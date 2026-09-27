"use client";

import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  type AnimationPlaybackControls,
  type MotionValue,
} from "framer-motion";
import { useEffect, useRef, useState, type RefObject } from "react";
import { Pio, type PioState } from "@/components/student/pio";
import type { CameraHandle } from "./map-viewport";
import { walkDuration, type Trail } from "./trail-geometry";

/**
 * PIO QUI MARCHE — le personnage se déplace sur le sentier, comme dans un
 * jeu de plateau.
 *
 * On touche une étape : Pio part de là où il est, suit le sentier jusqu'à
 * elle, et prévient (`onArrive`) quand il y est. Sa position est une seule
 * abscisse curviligne (`pioLen`, en pixels depuis le départ du sentier) que
 * l'on anime ; `trail.pointAt` la transforme en coordonnées-monde à chaque
 * image. Retoucher une autre étape en route ne fait pas sauter Pio : la
 * nouvelle marche repart de l'abscisse où il en était.
 *
 * LA MARCHE EST DANS LE CLIP. Pendant le trajet, le sprite joue la pose
 * `walk` (Pio marche sur place, vidéo OpenArt) et c'est la carte qui le
 * déplace ; à l'arrêt, il joue la pose de l'étape. Le code ne fait plus
 * rebondir, dandiner ni empoussiérer le personnage : il ne fait que le
 * translater le long du sentier et le retourner quand il change de sens.
 *
 * `prefers-reduced-motion` : pas de marche, Pio est déjà arrivé.
 */
export type WalkerState = {
  walking: boolean;
  /** L'étape où Pio se tient, ou `null` pendant une marche. */
  standing: number | null;
  /** L'étape visée pendant une marche. */
  target: number | null;
};

/** Pio se tient un peu en bas à gauche de l'étape, pour ne pas la cacher. */
const STAND_OFFSET = { x: -52, y: 50 };

/** Sur quelle fraction de la marche Pio rejoint (puis quitte) l'axe du sentier. */
const EDGE_FRACTION = 0.18;

export type PioWalker = {
  pioX: MotionValue<number>;
  pioY: MotionValue<number>;
  facing: MotionValue<number>;
  state: WalkerState;
  walkTo: (index: number) => void;
  /** Le point-monde de Pio à cet instant, pour recentrer la caméra. */
  point: () => { x: number; y: number };
};

export function usePioWalker({
  trail,
  initialIndex,
  camera,
  onArrive,
}: {
  trail: Trail;
  initialIndex: number;
  camera: RefObject<CameraHandle | null>;
  onArrive: (index: number) => void;
}): PioWalker {
  const reducedMotion = useReducedMotion();
  const start = trail.points[initialIndex] ?? { x: 0, y: 0 };
  const pioLen = useMotionValue(trail.nodeLength[initialIndex] ?? 0);
  const pioX = useMotionValue(start.x + STAND_OFFSET.x);
  const pioY = useMotionValue(start.y + STAND_OFFSET.y);
  const facing = useMotionValue(1);
  const [state, setState] = useState<WalkerState>({
    walking: false,
    standing: initialIndex,
    target: null,
  });
  const controls = useRef<AnimationPlaybackControls | null>(null);

  useEffect(() => {
    return () => controls.current?.stop();
  }, []);

  function standAt(index: number) {
    const p = trail.points[index];
    if (!p) return;
    pioX.set(p.x + STAND_OFFSET.x);
    pioY.set(p.y + STAND_OFFSET.y);
  }

  function walkTo(index: number) {
    if (index < 0 || index >= trail.points.length) return;
    if (state.target === index) return;
    if (!state.walking && state.standing === index) {
      onArrive(index);
      return;
    }

    controls.current?.stop();
    const from = pioLen.get();
    const to = trail.nodeLength[index];
    const span = to - from;

    if (reducedMotion || Math.abs(span) < 1) {
      pioLen.set(to);
      standAt(index);
      setState({ walking: false, standing: index, target: null });
      onArrive(index);
      return;
    }

    setState({ walking: true, standing: null, target: index });
    controls.current = animate(pioLen, to, {
      duration: walkDuration(span),
      ease: [0.3, 0, 0.7, 1],
      onUpdate: (value) => {
        const t = (value - from) / span;
        // À 0 et à 1, Pio est sur sa place à côté de l'étape ; entre les deux, sur l'axe.
        const onAxis = Math.min(1, Math.min(t, 1 - t) / EDGE_FRACTION);
        const k = 1 - onAxis;
        const p = trail.pointAt(value);
        pioX.set(p.x + STAND_OFFSET.x * k);
        pioY.set(p.y + STAND_OFFSET.y * k);

        // Le sens de marche : la tangente du sentier, inversée si l'on recule.
        const dir = Math.sign(p.dx) * Math.sign(span);
        if (Math.abs(p.dx) > 0.35 && dir !== 0 && dir !== facing.get()) {
          animate(facing, dir, { duration: 0.16, ease: "easeInOut" });
        }
        camera.current?.follow({ x: p.x, y: p.y - 40 }, 0.16);
      },
      onComplete: () => {
        standAt(index);
        setState({ walking: false, standing: index, target: null });
        onArrive(index);
      },
    });
  }

  return {
    pioX,
    pioY,
    facing,
    state,
    walkTo,
    point: () => ({ x: pioX.get(), y: pioY.get() - 40 }),
  };
}

/**
 * Le sprite sur la carte, en coordonnées-monde. L'ancre est aux pattes ;
 * `size` est la hauteur de Pio en pixels-monde. `pose` vaut `walk` pendant
 * le trajet (voir `GameMap`).
 */
export function PioWalkerSprite({
  walker,
  size = 100,
  pose,
}: {
  walker: PioWalker;
  size?: number;
  pose: PioState;
}) {
  const width = Math.round(size * (572 / 800));

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute left-0 top-0 z-20"
      style={{ x: walker.pioX, y: walker.pioY }}
    >
      <div className="relative -translate-x-1/2 -translate-y-full" style={{ width, height: size }}>
        {/* L'ombre au sol, immobile : elle ancre Pio sur le sentier. */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-[100%] bg-black/30 blur-[2px]"
          style={{ width: width * 0.9, height: 14, transform: "translate(-50%, 8px)" }}
        />

        {/* Le retournement : Pio regarde dans le sens de la marche */}
        <motion.div className="absolute inset-0" style={{ scaleX: walker.facing }}>
          <Pio
            state={pose}
            size={size}
            className="drop-shadow-[0_10px_12px_rgba(60,30,0,0.4)]"
          />
        </motion.div>
      </div>
    </motion.div>
  );
}
