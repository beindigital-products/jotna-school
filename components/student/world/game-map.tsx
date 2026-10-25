"use client";

import { AnimatePresence, motion, useTransform } from "framer-motion";
import { ChevronDown, LocateFixed, Maximize2, Minus, Plus } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { pioWalkFacing, type PioOutfit, type PioState } from "@/components/student/pio";
import { useDeviceTier, type DeviceTier } from "@/hooks/use-device-tier";
import { MapViewport, useCounterScale, type CameraHandle } from "./map-viewport";
import { PioWalkerSprite, usePioWalker } from "./pio-walker";
import {
  buildTrail,
  trailNodePoints,
  trailPathD,
  trailWorldHeight,
  type TrailLayout,
  type WorldPoint,
} from "./trail-geometry";

/**
 * LA CARTE DE JEU — le cadre qui assemble le monde, le sentier, les étapes,
 * Pio qui marche et les commandes de zoom.
 *
 * Ce composant ne sait pas ce qu'est une étape : la page lui donne un nombre
 * et une fonction `renderNode` qui dessine la i-ème (un médaillon de monde,
 * un nœud de sentier...). Il fournit en échange les coordonnées-monde, l'état
 * de Pio et `walkTo`, la seule façon de le faire marcher. La page décide de
 * ce qui se passe à l'arrivée (`onArrive`) : ouvrir un monde, montrer la
 * carte d'une étape.
 *
 * Tout ce qui est dans le monde suit le zoom ; tout ce qui est dans `hud`
 * reste collé au cadre.
 */
export type MapNodeContext = {
  index: number;
  x: number;
  y: number;
  /**
   * Du côté du sentier où se tient l'étape : -1 à gauche de l'axe, 1 à droite,
   * 0 sur une route couchée (pas de côté libre : les plaques restent dessous).
   */
  side: -1 | 0 | 1;
  isPioHere: boolean;
  isTarget: boolean;
  walking: boolean;
  walkTo: () => void;
};

type Props = {
  layout: TrailLayout;
  /** Le nombre d'étapes touchables. */
  count: number;
  /** Des points de sentier après la dernière étape (le trésor, par exemple). */
  tailPoints?: number;
  /** Où Pio se tient en arrivant (peut viser un point de queue). */
  initialPioIndex: number;
  /** Jusqu'où le sentier est « fait » : pointillé vert jusqu'à cette étape. */
  currentIndex: number | null;
  onArrive: (index: number) => void;
  /** La pose de Pio quand il se tient sur une étape. */
  poseAt?: (index: number) => PioState;
  renderNode: (ctx: MapNodeContext) => ReactNode;
  /** Rendu dans le monde, sous Pio (trésor, décor). */
  worldExtras?: ReactNode;
  /** Rendu collé au cadre (titres, cartes). */
  hud?: ReactNode;
  className?: string;
  pioSize?: number;
  /**
   * Le sol du monde, à la place de la savane répétée. Le chemin du Coran y
   * pose ses propres paysages (village, désert, Arabie, Kaaba).
   */
  backdrop?: ReactNode;
  /** L'image assombrie qui remplit le cadre autour du monde (`painted`). */
  frameImage?: string;
  /** La tenue de Pio sur cette carte. */
  outfit?: PioOutfit;
  /**
   * Remplace la position du DERNIER point du sentier : le but (la Kaaba) se
   * pose au centre, devant son illustration, et non dans le zigzag.
   */
  endPoint?: WorldPoint;
};

/**
 * Ce que le HUD mange du cadre quand on voit toute la carte. Sur un téléphone,
 * la bannière du haut est aussi large que le cadre : le monde se cale dessous.
 * Dès la tablette, le monde est une colonne au milieu d'un grand cadre, la
 * bannière est dans un coin, et il reste centré sans marge.
 */
const FIT_INSETS = ({ w, h }: { w: number; h: number }) => {
  if (w < 640) return { top: 96, bottom: 16 };
  // À l'horizontale sur un téléphone, la bannière tient sur une ligne.
  if (h < 460) return { top: 64, bottom: 12 };
  return { top: 16, bottom: 16 };
};

export function GameMap({
  layout,
  count,
  tailPoints = 0,
  initialPioIndex,
  currentIndex,
  onArrive,
  poseAt,
  renderNode,
  worldExtras,
  hud,
  className = "",
  pioSize = 100,
  backdrop,
  frameImage,
  outfit = "classic",
  endPoint,
}: Props) {
  const camera = useRef<CameraHandle | null>(null);
  const tier = useDeviceTier();
  const totalPoints = count + tailPoints;
  const points = trailNodePoints(totalPoints, layout);
  if (endPoint && points.length > 0) points[points.length - 1] = endPoint;
  const axis = layout.horizontal ? "x" : "y";
  const trail = buildTrail(points, axis);
  const worldHeight = trailWorldHeight(totalPoints, layout);
  const safeInitial = Math.min(Math.max(0, initialPioIndex), Math.max(0, totalPoints - 1));

  const walker = usePioWalker({
    trail,
    initialIndex: safeInitial,
    camera,
    onArrive,
    walkFacing: pioWalkFacing(outfit),
    horizontal: layout.horizontal,
  });
  const { walking, standing, target, heading } = walker.state;
  // De dos quand il monte le sentier, de face quand il le redescend : une
  // tenue qui n'a qu'une marche retombe sur `walk` (`pio.tsx`).
  const pose: PioState = walking
    ? heading === "away"
      ? "walkAway"
      : "walkToward"
    : (standing !== null && poseAt?.(standing)) || "hello";

  const progressD =
    currentIndex !== null && currentIndex > 0
      ? trailPathD(trail.points.slice(0, Math.min(currentIndex, totalPoints - 1) + 1), axis)
      : "";

  const targetPoint = target !== null ? trail.points[target] : null;
  const initialPoint = trail.points[safeInitial] ?? { x: layout.worldWidth / 2, y: 0 };

  return (
    <MapViewport
      ref={camera}
      worldWidth={layout.worldWidth}
      worldHeight={worldHeight}
      initialFocus={{ x: initialPoint.x, y: initialPoint.y + 20 }}
      className={className}
      frame={tier === "full" ? "painted" : "plain"}
      fitInsets={FIT_INSETS}
      frameImage={frameImage}
      hud={
        <>
          <ZoomControls
            camera={camera}
            onLocate={() => {
              const cam = camera.current;
              if (!cam) return;
              cam.focus(walker.point(), { scale: Math.max(cam.scale(), 1.05) });
            }}
          />
          <GestureHint />
          {hud}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 shadow-[inset_0_0_70px_rgba(90,50,0,0.35)]"
          />
        </>
      }
    >
      <div aria-hidden className="absolute inset-0 overflow-hidden rounded-[28px]">
        {backdrop ?? <WorldBackdrop tier={tier} width={layout.worldWidth} height={worldHeight} />}
      </div>
      <WorldBoard />

      <TrailSvg d={trail.d} progressD={progressD} width={layout.worldWidth} height={worldHeight} />

      {trail.points.slice(0, count).map((p, i) =>
        renderNode({
          index: i,
          x: p.x,
          y: p.y,
          side: layout.horizontal ? 0 : p.x < layout.worldWidth / 2 ? -1 : 1,
          isPioHere: standing === i,
          isTarget: target === i,
          walking,
          walkTo: () => walker.walkTo(i),
        }),
      )}

      {worldExtras}

      {targetPoint && <DestinationMarker x={targetPoint.x} y={targetPoint.y} />}

      <PioWalkerSprite walker={walker} size={pioSize} pose={pose} outfit={outfit} />
    </MapViewport>
  );
}

/**
 * Le sentier : une ombre, un bord clair en relief, la terre battue, un
 * pointillé au milieu, et le chemin déjà fait en vert vif qui défile.
 *
 * Dézoomé, la route s'épaissit (jusqu'à presque le double) : une bande de 38
 * pixels-monde n'en ferait plus que 15 à l'écran, un fil. Au zoom normal, les
 * largeurs sont celles de toujours.
 */
function TrailSvg({
  d,
  progressD,
  width,
  height,
}: {
  d: string;
  progressD: string;
  width: number;
  height: number;
}) {
  const grow = useCounterScale({ cap: 1.9, power: 0.8 });
  const shadow = useTransform(grow, (g) => 58 * g);
  const edge = useTransform(grow, (g) => 48 * g);
  const road = useTransform(grow, (g) => 38 * g);
  const lane = useTransform(grow, (g) => 4 * g);
  const done = useTransform(grow, (g) => 15 * g);
  const doneDash = useTransform(grow, (g) => 5 * g);
  const round = { strokeLinecap: "round", strokeLinejoin: "round" } as const;

  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute left-0 top-0"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
    >
      <motion.path d={d} fill="none" stroke="rgba(70,35,5,0.45)" style={{ strokeWidth: shadow, ...round }} />
      <motion.path d={d} fill="none" stroke="#8a5420" style={{ strokeWidth: edge, ...round }} />
      <motion.path d={d} fill="none" stroke="#f4d078" style={{ strokeWidth: road, ...round }} />
      <motion.path
        d={d}
        fill="none"
        stroke="#fff4c9"
        strokeDasharray="10 16"
        opacity={0.9}
        style={{ strokeWidth: lane, ...round }}
      />
      {progressD && (
        <>
          <motion.path d={progressD} fill="none" stroke="#3f9a22" style={{ strokeWidth: done, ...round }} />
          <motion.path
            d={progressD}
            fill="none"
            stroke="#c8f27a"
            strokeDasharray="1 24"
            className="animate-[trail-dash_2.4s_linear_infinite]"
            style={{ strokeWidth: doneDash, ...round }}
          />
        </>
      )}
    </svg>
  );
}

/**
 * Le bord du monde : un cadre crème à flanc épais, hors du monde (il ne mange
 * rien au zoom normal), qui n'apparaît qu'en dézoomant. Le monde n'est plus un
 * rectangle de peinture coupé net, c'est un plateau de jeu posé sur la savane
 * dans l'ombre. Son ombre portée tombe vers le bas, comme celle d'un bouton.
 */
function WorldBoard() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute -inset-4 rounded-[44px] border-[16px] border-[#fff1cc] shadow-[0_0_0_4px_#c9a35a,0_10px_0_4px_#a8791f,0_28px_44px_rgba(30,15,0,0.65),inset_0_0_46px_rgba(90,50,0,0.5)]"
    />
  );
}

/** Le chevron qui rebondit au-dessus de l'étape visée pendant la marche. */
function DestinationMarker({ x, y }: { x: number; y: number }) {
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute z-30 -translate-x-1/2"
      style={{ left: x, top: y - 118 }}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1, y: [0, -12, 0] }}
      transition={{ y: { duration: 0.7, repeat: Infinity, ease: "easeInOut" }, opacity: { duration: 0.2 } }}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-white bg-gradient-to-b from-amber-400 to-orange-500 shadow-lg">
        <ChevronDown className="h-8 w-8 text-white" strokeWidth={4} />
      </span>
    </motion.div>
  );
}

const CONTROL =
  "btn-chunky flex h-11 w-11 items-center justify-center rounded-full border-[3px] border-white bg-gradient-to-b from-amber-50 to-amber-200 text-amber-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-300";

function ZoomControls({
  camera,
  onLocate,
}: {
  camera: React.RefObject<CameraHandle | null>;
  onLocate: () => void;
}) {
  const depth = { "--btn-depth": "#c9a35a" } as React.CSSProperties;
  return (
    <div className="absolute right-3 top-3 z-20 flex flex-col gap-2 [@media(max-height:500px)]:flex-row sm:gap-2.5">
      <button type="button" className={CONTROL} style={depth} aria-label="Zoomer" onClick={() => camera.current?.zoomBy(1.35)}>
        <Plus className="h-6 w-6" strokeWidth={3.5} aria-hidden />
      </button>
      <button type="button" className={CONTROL} style={depth} aria-label="Dézoomer" onClick={() => camera.current?.zoomBy(1 / 1.35)}>
        <Minus className="h-6 w-6" strokeWidth={3.5} aria-hidden />
      </button>
      <button type="button" className={CONTROL} style={depth} aria-label="Retrouver Pio" onClick={onLocate}>
        <LocateFixed className="h-6 w-6" strokeWidth={2.75} aria-hidden />
      </button>
      <button type="button" className={CONTROL} style={depth} aria-label="Voir toute la carte" onClick={() => camera.current?.fitAll()}>
        <Maximize2 className="h-5 w-5" strokeWidth={3} aria-hidden />
      </button>
    </div>
  );
}

/** Le mode d'emploi, quelques secondes à l'arrivée, puis il s'efface. */
function GestureHint() {
  const [visible, setVisible] = useState(true);
  // Doigt sur téléphone et tablette, souris et molette sur ordinateur.
  const touch = useSyncExternalStore(
    () => () => {},
    () => window.matchMedia("(pointer: coarse)").matches,
    () => true,
  );
  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), 4500);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ delay: 1.1, duration: 0.3 }}
          className="pointer-events-none absolute bottom-3 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full bg-amber-950/80 px-4 py-2 font-display text-sm font-bold text-white shadow-lg"
        >
          {touch ? "Pince pour zoomer, glisse pour bouger" : "Molette pour zoomer, glisse pour bouger"}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

/** 853 × 1844 : la hauteur de la peinture à la largeur du monde. */
const BG_RATIO = 1844 / 853;

/**
 * Le sol du monde. Sur « full », la savane peinte, répétée en miroir vers le
 * bas : chaque copie est retournée verticalement, donc les bords se
 * rejoignent sans couture, quelle que soit la longueur du sentier. Sur
 * « lite », un sable en dégradé et quelques buissons en CSS.
 */
function WorldBackdrop({ tier, width, height }: { tier: DeviceTier; width: number; height: number }) {
  if (tier === "full") {
    const tileHeight = Math.round(width * BG_RATIO);
    const tiles = Math.max(1, Math.ceil(height / tileHeight));
    return (
      <div aria-hidden className="absolute inset-0 overflow-hidden">
        {Array.from({ length: tiles }, (_, i) => (
          // eslint-disable-next-line @next/next/no-img-element -- décor répété ; `next/image` n'apporte rien sous export statique
          <img
            key={i}
            src="/images/world/map-trail-bg.jpg"
            alt=""
            draggable={false}
            className="absolute left-0 w-full object-cover"
            style={{ top: i * tileHeight, height: tileHeight, transform: i % 2 === 1 ? "scaleY(-1)" : undefined }}
          />
        ))}
      </div>
    );
  }

  const bushes = Array.from({ length: Math.max(4, Math.round(height / 140)) }, (_, i) => ({
    left: i % 2 === 0 ? 4 + ((i * 37) % 30) : 66 + ((i * 23) % 28),
    top: 40 + i * 140 + ((i * 53) % 60),
    size: 26 + ((i * 17) % 22),
  }));

  return (
    <div
      aria-hidden
      className="absolute inset-0 overflow-hidden bg-[radial-gradient(circle_at_30%_20%,#f6cf5f_0%,#e9b640_45%,#dba532_100%)]"
    >
      {bushes.map((b, i) => (
        <span
          key={i}
          className="absolute rounded-[100%] bg-[#6ab04c] shadow-[inset_0_-6px_0_rgba(0,0,0,0.15)]"
          style={{ left: `${b.left}%`, top: b.top, width: b.size * 1.5, height: b.size }}
        />
      ))}
    </div>
  );
}
