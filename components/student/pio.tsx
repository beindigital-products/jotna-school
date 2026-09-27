"use client";

import Image from "next/image";
import { motion, type Transition } from "framer-motion";

/**
 * Pio — LA mascotte de Jotna : le lionceau explorateur à la loupe.
 *
 * C'EST L'AVATAR OFFICIEL v4, celui de `public/brand/pio/reference-v4.png`
 * sur la branche de juillet, détouré en huit poses distinctes dans
 * `public/images/pio/*.png`. Le « petit oiseau rond » dessiné en SVG qui
 * vivait ici n'a jamais été la mascotte : c'était un bouche-trou de MVP, et
 * il donnait à tout l'espace élève un air de démonstrateur.
 *
 * DÉCISIONS VERROUILLÉES PAR LE PROPRIÉTAIRE (juillet 2026), reprises telles
 * quelles :
 *   - c'est CET avatar qui incarne Pio partout, modales et dialogs compris ;
 *   - AUCUNE animation du corps. Ce qui bouge, c'est le sprite entier — une
 *     respiration, un rebond de joie — jamais un membre déformé. Le composant
 *     ne rend que la pose courante ; l'expression est dans l'image.
 *
 * LA HAUTEUR EST LA MESURE. Les images font 572 × 800 : `size` donne la
 * hauteur, la largeur suit le ratio. Les anciens appelants passaient un carré
 * — Pio est simplement un peu plus étroit qu'avant, rien ne déborde.
 *
 * `animated` reste honoré comme avant : les dialogs le passent à `false` pour
 * ne pas rivaliser avec leur propre entrée. `prefers-reduced-motion` est
 * respecté par le `<MotionConfig reducedMotion="user">` de `(student)/layout`.
 */
export type PioState =
  | "idle"
  | "hello"
  | "cheer"
  | "sad"
  | "amazed"
  | "encourage"
  | "think"
  | "sleep";

const FILES: Record<PioState, string> = {
  idle: "/images/pio/idle.png",
  hello: "/images/pio/hello.png",
  cheer: "/images/pio/cheer.png",
  // « sad » applicatif = pose douce, Pio serre ses livres — jamais moqueur.
  sad: "/images/pio/sad.png",
  amazed: "/images/pio/amazed.png",
  encourage: "/images/pio/encourage.png",
  think: "/images/pio/think.png",
  sleep: "/images/pio/sleep.png",
};

const LABELS: Record<PioState, string> = {
  idle: "Pio te regarde",
  hello: "Pio te dit bonjour",
  cheer: "Pio célèbre avec toi",
  sad: "Pio te réconforte",
  amazed: "Pio est émerveillé",
  encourage: "Pio t'encourage",
  think: "Pio réfléchit",
  sleep: "Pio se repose",
};

/** Mouvements du sprite ENTIER — jamais du corps. Les poses calmes ne bougent pas. */
const MOTION: Partial<
  Record<PioState, { animate: Record<string, number[]>; transition: Transition }>
> = {
  idle: {
    animate: { y: [0, -3, 0] },
    transition: { duration: 3.2, repeat: Infinity, ease: "easeInOut" },
  },
  hello: {
    animate: { y: [0, -3, 0], rotate: [-1.5, 1.5, -1.5] },
    transition: { duration: 1.8, repeat: Infinity, ease: "easeInOut" },
  },
  cheer: {
    animate: { y: [0, -10, 0], scale: [1, 1.04, 1] },
    transition: { duration: 0.7, repeat: Infinity, ease: "easeInOut" },
  },
  encourage: {
    animate: { y: [0, -4, 0] },
    transition: { duration: 1.4, repeat: Infinity, ease: "easeInOut" },
  },
  amazed: {
    animate: { scale: [1, 1.03, 1] },
    transition: { duration: 1.2, repeat: Infinity, ease: "easeInOut" },
  },
};

/** 572 × 800 : la largeur découle de la hauteur. */
const ASPECT = 572 / 800;

/** Les deux poses de l'accueil, à précharger avant que l'enfant n'arrive. */
export const PIO_HUB_POSES: readonly PioState[] = ["idle", "hello"];

export function pioImageSrc(state: PioState): string {
  return FILES[state];
}

type PioProps = {
  state?: PioState;
  /** Hauteur en pixels. La largeur suit le ratio de l'image. */
  size?: number;
  className?: string;
  /** Respiration ou rebond du sprite entier. `false` dans les dialogs. */
  animated?: boolean;
  /** Priorité de chargement : l'accueil, où Pio est l'élément le plus visible. */
  priority?: boolean;
};

export function Pio({
  state = "idle",
  size = 96,
  className = "",
  animated = true,
  priority = false,
}: PioProps) {
  const width = Math.round(size * ASPECT);
  const move = animated ? MOTION[state] : undefined;

  // Le filtre (l'ombre portée passée en `className`) reste sur le cadre FIXE ;
  // le mouvement du sprite vit sur un nœud INTÉRIEUR. Les deux ne sont jamais
  // sur le même nœud : sinon WebKit (WKWebView iOS) fige le tampon du filtre
  // dans l'espace local, le promène avec la transform, et à la fermeture d'un
  // calque au-dessus (l'overlay de niveau) ce tampon garde ses pixels — un
  // rectangle coloré derrière Pio, exactement sa boîte. Avec la transform à
  // l'intérieur, le contenu du cadre change à chaque frame, donc le filtre se
  // recalcule et ne peut plus rien retenir. `isolation` lui donne en plus son
  // propre groupe de composition, pour qu'aucun calque voisin n'y déteigne.
  return (
    <div
      role="img"
      aria-label={LABELS[state]}
      className={`pio inline-block shrink-0 select-none ${className}`}
      style={{ width, height: size, isolation: "isolate" }}
    >
      <motion.div
        className="h-full w-full"
        animate={move?.animate}
        transition={move?.transition}
      >
        <Image
          src={FILES[state]}
          alt=""
          width={572}
          height={800}
          priority={priority}
          draggable={false}
          unoptimized
          className="h-full w-full object-contain"
        />
      </motion.div>
    </div>
  );
}
