"use client";

import Image from "next/image";
import { useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";
import { useIsNativeApp } from "@/hooks/use-native-app";

/**
 * Pio — LA mascotte de Jotna : le lionceau explorateur à la loupe.
 *
 * C'EST L'AVATAR OFFICIEL v4, celui de `public/brand/pio/reference-v4.png`
 * sur la branche de juillet, détouré en huit poses dans
 * `public/images/pio/*.png`.
 *
 * DEPUIS SEPTEMBRE 2026, PIO EST UNE VIDÉO DANS L'APPLICATION MOBILE. Sur
 * iOS et Android (Capacitor), chaque pose est un clip en boucle
 * de cinq secondes, généré sur OpenArt (Kling 3 Omni, image vers vidéo, la
 * pose en première et en dernière image pour que la boucle soit invisible)
 * à partir de la pose PNG posée sur un fond bleu uni, puis détouré et encodé
 * avec canal alpha par `scripts/pio-encode.sh` :
 *
 *   - `public/videos/pio/<pose>.mov`  HEVC avec alpha, pour iOS et Safari ;
 *   - `public/videos/pio/<pose>.webm` VP9 avec alpha, pour Android, Chrome
 *     et Firefox.
 *
 * Le webview prend la première source qu'il sait lire ; le PNG de la pose
 * reste l'affiche (`poster`) le temps du chargement.
 *
 * SUR LE WEB, PIO EST L'IMAGE FIXE DE LA POSE. Le propriétaire a tranché :
 * les animations sont pour l'application mobile, le site n'en a pas besoin,
 * et 17 Mo de clips n'ont rien à faire dans une page web. L'image fixe sert
 * aussi de repli dans l'application quand l'enfant a demandé moins de
 * mouvement (`prefers-reduced-motion`) ou quand l'appelant passe
 * `animated={false}` (les dialogs, pour ne pas rivaliser avec leur propre
 * entrée).
 *
 * Plus AUCUNE animation codée du personnage : ni respiration, ni rebond, ni
 * dandinement en framer-motion. Ce qui bouge, c'est Pio lui-même, dans le
 * clip. Les décisions de juillet tiennent toujours : c'est cet avatar partout,
 * l'expression est dans l'image, et son corps n'est jamais déformé par du code.
 *
 * LA HAUTEUR EST LA MESURE. `size` est la hauteur de Pio debout, en pixels,
 * comme avec les anciens PNG (572 × 800). Le clip a de l'air au-dessus de sa
 * tête pour qu'il puisse sauter : la vidéo déborde donc du cadre vers le haut,
 * sans changer la place que Pio occupe dans la mise en page.
 *
 * PIO A DES TENUES. `classic` est le Pio de tous les jours (tunique, loupe,
 * sacoche) ; `boubou` est sa tenue du module Arabe & Coran : grand boubou
 * vert émeraude brodé d'or et kufi assorti, avec ses propres poses (le salut
 * main sur le cœur, l'écoute, la prononciation, le bravo). Une tenue n'a pas
 * forcément toutes les poses : une pose absente retombe sur la plus proche
 * qui existe dans CETTE tenue (`OUTFITS`), jamais sur une autre tenue — Pio ne
 * change pas d'habits au milieu d'un écran.
 */
export type PioState =
  | "idle"
  | "hello"
  | "cheer"
  | "sad"
  | "amazed"
  | "encourage"
  | "think"
  | "sleep"
  /** La marche sur la carte : Pio marche sur place, la carte le déplace. */
  | "walk"
  /** La marche qui s'éloigne, vue de dos : Pio monte le chemin. */
  | "walkAway"
  /** La marche qui s'approche, vue de face : Pio redescend le chemin. */
  | "walkToward"
  /** Le salut, main sur le cœur. */
  | "salam"
  /** Pio écoute l'enfant parler. */
  | "listen"
  /** Pio montre comment on prononce. */
  | "recite"
  /** Pio applaudit. */
  | "bravo";

export type PioOutfit = "classic" | "boubou";

const POSES: readonly PioState[] = [
  "idle",
  "hello",
  "cheer",
  "sad",
  "amazed",
  "encourage",
  "think",
  "sleep",
  "walk",
  "walkAway",
  "walkToward",
  "salam",
  "listen",
  "recite",
  "bravo",
];

type OutfitSpec = {
  /** Les poses qui existent vraiment dans cette tenue : un PNG et un clip chacune. */
  poses: readonly PioState[];
  /** Pour une pose absente, la plus proche qui existe dans la même tenue. */
  fallback: Partial<Record<PioState, PioState>>;
  images: string;
  videos: string;
  /**
   * Vers où regardent les clips de marche de cette tenue, sans retournement :
   * 1 à droite, -1 à gauche. La carte retourne Pio d'après ce sens, pour
   * qu'il regarde toujours là où il va (`pio-walker.tsx`).
   */
  walkFacing: 1 | -1;
};

const OUTFITS: Record<PioOutfit, OutfitSpec> = {
  classic: {
    poses: ["idle", "hello", "cheer", "sad", "amazed", "encourage", "think", "sleep", "walk"],
    // « sad » applicatif = pose douce, Pio serre ses livres — jamais moqueur.
    fallback: {
      salam: "hello",
      listen: "think",
      recite: "hello",
      bravo: "cheer",
      walkAway: "walk",
      walkToward: "walk",
    },
    images: "/images/pio",
    videos: "/videos/pio",
    // Le clip `walk` marche vers la gauche, de trois quarts.
    walkFacing: -1,
  },
  boubou: {
    poses: ["idle", "salam", "listen", "recite", "bravo", "encourage", "walkAway", "walkToward"],
    fallback: {
      hello: "salam",
      cheer: "bravo",
      amazed: "bravo",
      sad: "encourage",
      think: "idle",
      sleep: "idle",
      walk: "walkToward",
    },
    images: "/images/pio/boubou",
    videos: "/videos/pio/boubou",
    // `walkAway` (de dos) et `walkToward` (de face) partent vers la droite.
    walkFacing: 1,
  },
};

/** Le sens des clips de marche d'une tenue : 1 vers la droite, -1 vers la gauche. */
export function pioWalkFacing(outfit: PioOutfit): 1 | -1 {
  return OUTFITS[outfit].walkFacing;
}

/** La pose réellement jouée pour cette tenue. */
function resolvePose(outfit: PioOutfit, state: PioState): PioState {
  const spec = OUTFITS[outfit];
  if (spec.poses.includes(state)) return state;
  return spec.fallback[state] ?? "idle";
}

/** L'affiche et l'image de repli d'un clip. La marche part de la pose calme. */
function posterFor(outfit: PioOutfit, pose: PioState): string {
  return `${OUTFITS[outfit].images}/${pose === "walk" ? "idle" : pose}.png`;
}

const LABELS: Record<PioState, string> = {
  idle: "Pio te regarde",
  hello: "Pio te dit bonjour",
  cheer: "Pio célèbre avec toi",
  sad: "Pio te réconforte",
  amazed: "Pio est émerveillé",
  encourage: "Pio t'encourage",
  think: "Pio réfléchit",
  sleep: "Pio se repose",
  walk: "Pio marche",
  walkAway: "Pio marche",
  walkToward: "Pio marche",
  salam: "Pio te salue, la main sur le cœur",
  listen: "Pio t'écoute",
  recite: "Pio te montre comment le dire",
  bravo: "Pio t'applaudit",
};

/**
 * Géométrie des clips, fixée par `scripts/pio-encode.sh` : un cadre de
 * 576 × 1024 où Pio debout mesure 800 pixels, les pattes à 96 pixels du bas.
 * Tout ce qui suit en découle ; ne pas retoucher l'un sans l'autre.
 */
const CLIP = { width: 576, height: 1024, pioHeight: 800, bottomGap: 96 } as const;

/** 572 × 800 : la largeur de Pio découle de sa hauteur, comme avant. */
const ASPECT = 572 / 800;

export function pioClipSources(
  state: PioState,
  outfit: PioOutfit = "classic",
): { mov: string; webm: string } {
  const pose = resolvePose(outfit, state);
  const dir = OUTFITS[outfit].videos;
  return {
    mov: `${dir}/${pose}.mov`,
    webm: `${dir}/${pose}.webm`,
  };
}

export function isPioState(value: string): value is PioState {
  return (POSES as readonly string[]).includes(value);
}

type PioProps = {
  state?: PioState;
  /** La tenue. `boubou` : le module Arabe & Coran. */
  outfit?: PioOutfit;
  /** Hauteur de Pio debout, en pixels. La largeur suit le ratio de l'image. */
  size?: number;
  className?: string;
  /** `false` : l'image fixe de la pose, sans vidéo. Pour les dialogs. */
  animated?: boolean;
  /** Priorité de chargement : l'accueil, où Pio est l'élément le plus visible. */
  priority?: boolean;
};

export function Pio({
  state = "idle",
  outfit = "classic",
  size = 96,
  className = "",
  animated = true,
  priority = false,
}: PioProps) {
  const reducedMotion = useReducedMotion();
  const isNativeApp = useIsNativeApp();
  const width = Math.round(size * ASPECT);
  const playing = isNativeApp && animated && !reducedMotion;
  const pose = resolvePose(outfit, state);

  return (
    <div
      role="img"
      aria-label={LABELS[state]}
      className={`pio relative inline-block shrink-0 select-none ${className}`}
      style={{ width, height: size }}
    >
      {playing ? (
        <PioClip key={`${outfit}:${pose}`} state={pose} outfit={outfit} size={size} priority={priority} />
      ) : (
        <Image
          src={posterFor(outfit, pose)}
          alt=""
          width={572}
          height={800}
          priority={priority}
          draggable={false}
          unoptimized
          className="h-full w-full object-contain"
        />
      )}
    </div>
  );
}

/**
 * Le clip d'une pose. Monté à neuf à chaque changement de pose (`key`) :
 * un `<video>` ne recharge pas ses `<source>` tout seul.
 */
function PioClip({
  state,
  outfit,
  size,
  priority,
}: {
  state: PioState;
  outfit: PioOutfit;
  size: number;
  priority: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const scale = size / CLIP.pioHeight;
  const height = Math.round(CLIP.height * scale);
  const width = Math.round(CLIP.width * scale);
  // Les pattes de Pio au bas du cadre de mise en page : le clip déborde en haut.
  const headroom = CLIP.height - CLIP.pioHeight - CLIP.bottomGap;
  const top = Math.round(-headroom * scale);
  // L'affiche est le PNG 572 × 800 de la pose ; `contain` le pose dans le cadre
  // du clip. On la cale à la hauteur exacte de Pio dans la vidéo, pour que le
  // premier plan n'ait pas de sursaut quand la lecture démarre.
  const posterHeight = CLIP.width * (800 / 572);
  const posterY = (headroom / (CLIP.height - posterHeight)) * 100;
  const sources = pioClipSources(state, outfit);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    // React n'écrit pas l'attribut `muted` dans le HTML rendu ; iOS refuse
    // alors la lecture automatique. On le pose ici, puis on lance la lecture.
    video.muted = true;
    video.defaultMuted = true;
    const play = video.play();
    if (play && typeof play.catch === "function") play.catch(() => {});
  }, []);

  return (
    <video
      ref={ref}
      className="pointer-events-none absolute left-1/2 max-w-none -translate-x-1/2"
      style={{ width, height, top, objectFit: "contain", objectPosition: `50% ${posterY.toFixed(1)}%` }}
      width={CLIP.width}
      height={CLIP.height}
      poster={posterFor(outfit, state)}
      autoPlay
      loop
      muted
      playsInline
      disablePictureInPicture
      disableRemotePlayback
      preload={priority ? "auto" : "metadata"}
      aria-hidden
      tabIndex={-1}
    >
      {/* Safari et iOS lisent la première ; Chrome, Android et Firefox passent à la seconde. */}
      <source src={sources.mov} type='video/quicktime; codecs="hvc1"' />
      <source src={sources.webm} type='video/webm; codecs="vp9"' />
    </video>
  );
}
