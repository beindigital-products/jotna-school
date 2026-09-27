"use client";

import { animate, motion, useMotionValue, useReducedMotion } from "framer-motion";
import {
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type Ref,
} from "react";
import type { WorldPoint } from "./trail-geometry";

/**
 * LA CAMÉRA DE LA CARTE — un cadre fixe sur un monde plus grand que lui.
 *
 * Le monde est un `div` de taille fixe (en pixels-monde) déplacé et agrandi
 * par une seule transformation : `translate(x, y) scale(s)`, origine en haut
 * à gauche. Un point-monde `p` s'affiche donc à l'écran en `p × s + (x, y)`,
 * et tout ce que la page pose dans le monde — étapes, Pio, décor — suit le
 * zoom sans rien recalculer.
 *
 * LES GESTES SONT CEUX D'UNE CARTE : un doigt déplace, deux doigts pincent,
 * la molette avec Ctrl (ou le pavé tactile) zoome, la molette seule déplace.
 * Un toucher qui ne bouge pas reste un toucher : il atteint le bouton
 * dessous. Un doigt qui glisse devient un déplacement, et le clic qui
 * suivrait est avalé (`onClickCapture`) pour qu'un enfant qui fait défiler
 * la carte n'ouvre pas un monde par accident.
 *
 * `touch-action: none` sur le cadre coupe le défilement et le zoom natifs
 * du navigateur pendant qu'on manipule la carte ; le reste de la page se
 * défile toujours depuis l'extérieur du cadre.
 *
 * Exposé au parent par `ref` : `focus` (aller à un point), `follow` (suivre
 * un point image par image, en douceur), `zoomBy`, `fitAll` et `scale`.
 */
export type CameraHandle = {
  focus: (p: WorldPoint, opts?: { scale?: number; animate?: boolean; duration?: number }) => void;
  follow: (p: WorldPoint, strength?: number) => void;
  zoomBy: (factor: number) => void;
  fitAll: () => void;
  scale: () => number;
};

export const MAX_SCALE = 2.8;

/** Le zoom d'arrivée : le monde remplit la largeur, sans être minuscule ni énorme. */
export function initialScaleFor(viewportWidth: number, worldWidth: number): number {
  return clamp(viewportWidth / worldWidth, 0.85, 1.5);
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

type Gesture = {
  mode: "idle" | "pan" | "pinch";
  moved: boolean;
  startX: number;
  startY: number;
  startTx: number;
  startTy: number;
  startScale: number;
  startDist: number;
  startMidX: number;
  startMidY: number;
};

const DRAG_THRESHOLD = 8;

type Props = {
  worldWidth: number;
  worldHeight: number;
  /** Le point-monde que la caméra vise en arrivant. */
  initialFocus: WorldPoint;
  children: ReactNode;
  /** Ce qui reste collé au cadre (boutons, titres) et ne bouge pas avec le monde. */
  hud?: ReactNode;
  className?: string;
  /** Ce qui entoure le monde quand il est plus petit que le cadre : la savane peinte assombrie, ou un simple dégradé. */
  frame?: "painted" | "plain";
  ref?: Ref<CameraHandle>;
};

export function MapViewport({
  worldWidth,
  worldHeight,
  initialFocus,
  children,
  hud,
  className = "",
  frame = "plain",
  ref,
}: Props) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const size = useRef({ w: 0, h: 0 });
  const gesture = useRef<Gesture>({
    mode: "idle",
    moved: false,
    startX: 0,
    startY: 0,
    startTx: 0,
    startTy: 0,
    startScale: 1,
    startDist: 1,
    startMidX: 0,
    startMidY: 0,
  });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const reducedMotion = useReducedMotion();

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const s = useMotionValue(1);

  // Les effets à montage unique lisent la taille du monde par cette ref,
  // tenue à jour hors du rendu.
  const worldRef = useRef({ w: worldWidth, h: worldHeight });
  useLayoutEffect(() => {
    worldRef.current = { w: worldWidth, h: worldHeight };
  }, [worldWidth, worldHeight]);

  // ── Bornes ───────────────────────────────────────────────────────────
  function fitScale(): number {
    const { w, h } = size.current;
    const world = worldRef.current;
    if (w === 0 || h === 0) return 1;
    return Math.min(w / world.w, h / world.h);
  }

  function minScale(): number {
    return Math.max(0.2, Math.min(fitScale(), 0.75));
  }

  function clampScale(v: number): number {
    return clamp(v, minScale(), MAX_SCALE);
  }

  /** Une translation qui ne laisse pas de vide au-delà du monde (ou le centre s'il est plus petit). */
  function clampAxis(t: number, scale: number, view: number, world: number): number {
    const scaled = world * scale;
    if (scaled <= view) return (view - scaled) / 2;
    return clamp(t, view - scaled, 0);
  }

  function place(tx: number, ty: number, scale: number) {
    const { w, h } = size.current;
    const world = worldRef.current;
    const sc = clampScale(scale);
    s.set(sc);
    x.set(clampAxis(tx, sc, w, world.w));
    y.set(clampAxis(ty, sc, h, world.h));
  }

  function targetFor(p: WorldPoint, scale: number) {
    const { w, h } = size.current;
    const world = worldRef.current;
    const sc = clampScale(scale);
    return {
      sc,
      tx: clampAxis(w / 2 - p.x * sc, sc, w, world.w),
      ty: clampAxis(h / 2 - p.y * sc, sc, h, world.h),
    };
  }

  function glide(tx: number, ty: number, sc: number, duration: number) {
    if (reducedMotion || duration <= 0) {
      place(tx, ty, sc);
      return;
    }
    const opts = { duration, ease: "easeInOut" as const };
    animate(x, tx, opts);
    animate(y, ty, opts);
    animate(s, sc, opts);
  }

  // ── L'API exposée au parent ──────────────────────────────────────────
  useImperativeHandle(ref, () => ({
    focus(p, opts) {
      const { sc, tx, ty } = targetFor(p, opts?.scale ?? s.get());
      if (opts?.animate === false) place(tx, ty, sc);
      else glide(tx, ty, sc, opts?.duration ?? 0.7);
    },
    follow(p, strength = 0.14) {
      const { tx, ty } = targetFor(p, s.get());
      x.set(x.get() + (tx - x.get()) * strength);
      y.set(y.get() + (ty - y.get()) * strength);
    },
    zoomBy(factor) {
      const { w, h } = size.current;
      const from = s.get();
      const to = clampScale(from * factor);
      if (to === from) return;
      const cx = w / 2;
      const cy = h / 2;
      const tx = cx - (cx - x.get()) * (to / from);
      const ty = cy - (cy - y.get()) * (to / from);
      const world = worldRef.current;
      glide(clampAxis(tx, to, w, world.w), clampAxis(ty, to, h, world.h), to, 0.25);
    },
    fitAll() {
      const world = worldRef.current;
      const { sc, tx, ty } = targetFor({ x: world.w / 2, y: world.h / 2 }, fitScale());
      glide(tx, ty, sc, 0.5);
    },
    scale: () => s.get(),
  }));

  // ── Mesure du cadre et arrivée ───────────────────────────────────────
  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    function measure() {
      const rect = frame!.getBoundingClientRect();
      size.current = { w: rect.width, h: rect.height };
    }
    measure();

    // L'ARRIVÉE : on voit la carte entière un instant, puis la caméra plonge
    // sur Pio. L'enfant comprend où il est dans le monde avant de voir le détail.
    const world = worldRef.current;
    const overview = targetFor({ x: world.w / 2, y: world.h / 2 }, fitScale());
    place(overview.tx, overview.ty, overview.sc);
    const arrival = targetFor(initialFocus, initialScaleFor(size.current.w, world.w));
    const timer = window.setTimeout(() => glide(arrival.tx, arrival.ty, arrival.sc, 0.9), 320);

    const observer = new ResizeObserver(() => {
      measure();
      place(x.get(), y.get(), s.get());
    });
    observer.observe(frame);

    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
    };
    // Une seule arrivée par montage : `initialFocus` est lu tel qu'il est à
    // ce moment-là, les tailles passent ensuite par des refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Molette et pincement natif ───────────────────────────────────────
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const { w, h } = size.current;
      const world = worldRef.current;
      if (e.ctrlKey || e.metaKey) {
        const rect = frame!.getBoundingClientRect();
        const px = e.clientX - rect.left;
        const py = e.clientY - rect.top;
        const from = s.get();
        const to = clampScale(from * Math.exp(-e.deltaY * 0.0025));
        const tx = px - (px - x.get()) * (to / from);
        const ty = py - (py - y.get()) * (to / from);
        s.set(to);
        x.set(clampAxis(tx, to, w, world.w));
        y.set(clampAxis(ty, to, h, world.h));
      } else {
        const sc = s.get();
        x.set(clampAxis(x.get() - e.deltaX, sc, w, world.w));
        y.set(clampAxis(y.get() - e.deltaY, sc, h, world.h));
      }
    }
    // Safari iOS : le pincement natif émet `gesturestart` ; on le coupe pour
    // que la page ne zoome pas en même temps que la carte.
    function swallow(e: Event) {
      e.preventDefault();
    }

    frame.addEventListener("wheel", onWheel, { passive: false });
    frame.addEventListener("gesturestart", swallow);
    return () => {
      frame.removeEventListener("wheel", onWheel);
      frame.removeEventListener("gesturestart", swallow);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Doigts et souris ─────────────────────────────────────────────────
  function beginPan(px: number, py: number) {
    const g = gesture.current;
    g.mode = "pan";
    g.startX = px;
    g.startY = py;
    g.startTx = x.get();
    g.startTy = y.get();
  }

  function beginPinch() {
    const [a, b] = Array.from(pointers.current.values());
    const g = gesture.current;
    g.mode = "pinch";
    g.moved = true;
    g.startDist = Math.max(1, Math.hypot(b.x - a.x, b.y - a.y));
    g.startMidX = (a.x + b.x) / 2;
    g.startMidY = (a.y + b.y) / 2;
    g.startTx = x.get();
    g.startTy = y.get();
    g.startScale = s.get();
  }

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    if (pointers.current.size === 0) gesture.current.moved = false;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) beginPan(e.clientX, e.clientY);
    else if (pointers.current.size === 2) beginPinch();
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current;
    const { w, h } = size.current;
    const world = worldRef.current;

    if (g.mode === "pan" && pointers.current.size === 1) {
      const dx = e.clientX - g.startX;
      const dy = e.clientY - g.startY;
      if (!g.moved) {
        if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
        g.moved = true;
        // Capturé seulement une fois le glissement avéré : un simple toucher
        // doit garder sa cible, sinon le clic du bouton dessous se perd.
        frameRef.current?.setPointerCapture(e.pointerId);
      }
      const sc = s.get();
      x.set(clampAxis(g.startTx + dx, sc, w, world.w));
      y.set(clampAxis(g.startTy + dy, sc, h, world.h));
    } else if (g.mode === "pinch" && pointers.current.size >= 2) {
      const [a, b] = Array.from(pointers.current.values());
      const dist = Math.max(1, Math.hypot(b.x - a.x, b.y - a.y));
      const midX = (a.x + b.x) / 2;
      const midY = (a.y + b.y) / 2;
      const to = clampScale(g.startScale * (dist / g.startDist));
      const ratio = to / g.startScale;
      // Le point-monde sous les doigts reste sous les doigts.
      const rect = frameRef.current?.getBoundingClientRect();
      const ox = rect?.left ?? 0;
      const oy = rect?.top ?? 0;
      const tx = midX - ox - (g.startMidX - ox - g.startTx) * ratio;
      const ty = midY - oy - (g.startMidY - oy - g.startTy) * ratio;
      s.set(to);
      x.set(clampAxis(tx, to, w, world.w));
      y.set(clampAxis(ty, to, h, world.h));
    }
  }

  function onPointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.delete(e.pointerId);
    const frame = frameRef.current;
    if (frame?.hasPointerCapture(e.pointerId)) frame.releasePointerCapture(e.pointerId);

    if (pointers.current.size === 1) {
      const [rest] = Array.from(pointers.current.values());
      beginPan(rest.x, rest.y);
    } else if (pointers.current.size === 0) {
      gesture.current.mode = "idle";
      // Le clic arrive juste après : on le laisse voir `moved`, puis on oublie.
      window.setTimeout(() => {
        gesture.current.moved = false;
      }, 0);
    }
  }

  function onClickCapture(e: React.MouseEvent<HTMLDivElement>) {
    // `detail === 0` : activation au clavier, jamais un glissement.
    if (gesture.current.moved && e.detail > 0) {
      e.stopPropagation();
      e.preventDefault();
    }
  }

  return (
    <div
      ref={frameRef}
      className={`relative isolate select-none overflow-hidden bg-[radial-gradient(circle_at_50%_30%,#e6b23f_0%,#c98d26_70%,#a8701a_100%)] ${className}`}
      style={{
        touchAction: "none",
        WebkitUserSelect: "none",
        ...(frame === "painted"
          ? { backgroundImage: "url(/images/world/map-trail-bg.jpg)", backgroundSize: "cover", backgroundPosition: "center" }
          : {}),
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClickCapture={onClickCapture}
    >
      {/* Au-delà du monde : la même savane, dans l'ombre — « pas encore exploré ». */}
      {frame === "painted" && (
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-amber-950/55" />
      )}
      <motion.div
        className="absolute left-0 top-0 will-change-transform"
        style={{ x, y, scale: s, transformOrigin: "0 0", width: worldWidth, height: worldHeight }}
      >
        {children}
      </motion.div>
      {hud}
    </div>
  );
}
