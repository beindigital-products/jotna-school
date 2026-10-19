"use client";

import Image from "next/image";
import { useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";

/**
 * Pio — LA mascotte de Jotna : le lionceau explorateur à la loupe.
 *
 * C'EST L'AVATAR OFFICIEL v4, celui de `public/brand/pio/reference-v4.png`
 * sur la branche de juillet, détouré en huit poses dans
 * `public/images/pio/*.png`.
 *
 * DEPUIS SEPTEMBRE 2026, PIO EST UNE VIDÉO, dans l'application comme sur le
 * web (depuis le 9 octobre 2026, l'espace élève est le même partout). Chaque
 * pose est un clip en boucle de cinq secondes, généré sur OpenArt (Kling 3 Omni, image vers vidéo, la
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
 * L'IMAGE FIXE DE LA POSE sert de repli quand l'enfant a demandé moins de
 * mouvement (`prefers-reduced-motion`) ou quand l'appelant passe
 * `animated={false}` (les dialogs, pour ne pas rivaliser avec leur propre
 * entrée).
 *
 * Plus AUCUNE animation codée du personnage : ni respiration, ni rebond, ni
 * dandinement en framer-motion. Ce qui bouge, c'est Pio lui-même, dans le
 * clip. Les décisions de juillet tiennent toujours : c'est cet avatar partout,
 * l'expression est dans l'image, et son corps n'est jamais déformé par du code.
 *
 * LES AFFICHES LÉGÈRES (`lite`). Les PNG d'origine pèsent 500 à 600 Ko. La page
 * d'accueil, que l'on ouvre sur un téléphone avec une donnée chère, sert à la
 * place les WebP de `public/images/pio/lite/` (40 à 50 Ko, faits par
 * `scripts/pio-lite.mjs`) : même pose, même cadrage, 640 pixels de haut. Seule la
 * tenue de tous les jours en a ; le boubou garde ses PNG.
 *
 * LA HAUTEUR EST LA MESURE. `size` est la hauteur de Pio debout, en pixels,
 * comme avec les anciens PNG (572 × 800). Le clip a de l'air au-dessus de sa
 * tête pour qu'il puisse sauter : la vidéo déborde donc du cadre vers le haut,
 * sans changer la place que Pio occupe dans la mise en page. Depuis octobre
 * 2026, `size` accepte aussi une LONGUEUR CSS (`"clamp(132px, 27svh, 250px)"`) :
 * la scène de la question (`session-stage.tsx`) le taille d'après la hauteur
 * de l'écran, et la largeur comme la géométrie du clip suivent en `calc()`.
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
  /** La question : Pio montre l'énoncé du doigt, la loupe dans l'autre patte. */
  | "ask"
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
  "ask",
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
  /**
   * LES POSES QUASI IMMOBILES, dont le clip reste dans le contour de son
   * affiche. Pour elles SEULES, l'affiche reste peinte sous le clip (voir
   * `Pio`) : sur iOS, la couche vidéo du clip HEVC s'éteint d'elle-même dès
   * qu'un son part, et l'affiche prend le relais sans attendre la page. Sous
   * un clip qui bouge, la même affiche ferait un Pio EN DOUBLE (vu le
   * 18 octobre 2026 sur l'iPhone 17 : « cheer » saute, son affiche restait
   * debout derrière lui). La mesure qui décide (`docs/pio-animations.md`) :
   * la part de l'affiche que le clip laisse à découvert, image par image ;
   * « ask » 5,7 % au pire (la tête qui tourne), « cheer » 37 %.
   */
  still: readonly PioState[];
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
    poses: ["idle", "hello", "cheer", "sad", "amazed", "encourage", "think", "sleep", "ask", "walk"],
    // La question : un son (la voix, le verdict) part toujours pendant qu'il joue.
    still: ["ask"],
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
    // Le coach montre déjà l'affiche pendant la voix et le micro (`pronounce-coach.tsx`).
    still: [],
    fallback: {
      hello: "salam",
      cheer: "bravo",
      amazed: "bravo",
      sad: "encourage",
      think: "idle",
      sleep: "idle",
      // Pas de doigt tendu en boubou : il attend, calme, dans la même tenue.
      ask: "idle",
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

/**
 * La pose est-elle quasi immobile dans cette tenue (`still`) : son affiche
 * reste alors peinte sous le clip. Résolue comme `Pio` la joue (une pose
 * absente retombe sur une autre, qui a sa propre réponse).
 */
export function isPioStill(state: PioState, outfit: PioOutfit = "classic"): boolean {
  return OUTFITS[outfit].still.includes(resolvePose(outfit, state));
}

/** L'affiche et l'image de repli d'un clip. La marche part de la pose calme. */
function posterFor(outfit: PioOutfit, pose: PioState, lite = false): string {
  const name = pose === "walk" ? "idle" : pose;
  // Le WebP léger n'existe que pour la tenue de tous les jours.
  if (lite && outfit === "classic") return `${OUTFITS.classic.images}/lite/${name}.webp`;
  return `${OUTFITS[outfit].images}/${name}.png`;
}

/** L'image d'une pose, telle que `Pio` l'affiche : le PNG d'origine, ou le WebP léger avec `lite`. */
export function pioPosterSrc(state: PioState, outfit: PioOutfit = "classic", lite = false): string {
  return posterFor(outfit, resolvePose(outfit, state), lite);
}

/** Les affiches déjà demandées : une seule requête par URL et par page. */
const requestedPosters = new Set<string>();

/**
 * PRÉCHARGE LES AFFICHES de poses à venir, pour qu'un changement de pose ne
 * laisse jamais un trou à la place de Pio. Vu sur le simulateur iPhone 17
 * (18 octobre 2026, film du verdict image par image) : au moment où la
 * réponse est jugée, la scène de la question passe du clip « ask » à
 * l'affiche « cheer », que le webview n'avait jamais chargée ; pendant
 * 300 ms (trois images à 10 i/s), le ciel était vide à la place de Pio, la
 * bulle encore à « C'est parti ! ». Une `Image` par URL, demandée une fois
 * par page (le cache HTTP garde le reste) ; rien côté serveur. Rend les URL
 * demandées cette fois-ci (vide quand tout l'était déjà) : les tests le lisent.
 */
export function preloadPioPosters(
  states: readonly PioState[],
  { outfit = "classic", lite = false }: { outfit?: PioOutfit; lite?: boolean } = {},
): string[] {
  if (typeof window === "undefined") return [];
  const requested: string[] = [];
  for (const state of states) {
    const src = pioPosterSrc(state, outfit, lite);
    if (requestedPosters.has(src)) continue;
    requestedPosters.add(src);
    const image = new window.Image();
    image.src = src;
    // Décodée tout de suite aussi : le bitmap attend dans le cache du moteur,
    // et l'affiche se peint dans l'image même où elle est demandée.
    if (typeof image.decode === "function") image.decode().catch(() => {});
    requested.push(src);
  }
  return requested;
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
  ask: "Pio te montre la question",
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

/** La hauteur de Pio debout : des pixels, ou une longueur CSS. */
export type PioSize = number | string;

/**
 * Une dimension dérivée de la hauteur : `size × factor`, en pixels arrondis
 * quand `size` est un nombre, en `calc()` quand c'est une longueur CSS.
 */
function scaled(size: PioSize, factor: number): number | string {
  if (typeof size === "number") return Math.round(size * factor);
  return factor === 1 ? size : `calc(${size} * ${factor})`;
}

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
  /** Hauteur de Pio debout, en pixels ou en longueur CSS. La largeur suit le ratio de l'image. */
  size?: PioSize;
  className?: string;
  /** `false` : l'image fixe de la pose, sans vidéo. Pour les dialogs. */
  animated?: boolean;
  /** Priorité de chargement : l'accueil, où Pio est l'élément le plus visible. */
  priority?: boolean;
  /** Les affiches WebP légères (40 Ko) au lieu des PNG (550 Ko) : la page d'accueil. */
  lite?: boolean;
};

export function Pio({
  state = "idle",
  outfit = "classic",
  size = 96,
  className = "",
  animated = true,
  priority = false,
  lite = false,
}: PioProps) {
  const reducedMotion = useReducedMotion();
  const width = scaled(size, ASPECT);
  const playing = animated && !reducedMotion;
  const pose = resolvePose(outfit, state);
  // L'affiche : seule quand le clip ne joue pas ; SOUS le clip d'une pose
  // quasi immobile ; absente sous un clip qui bouge (la `<video>` garde son
  // `poster` le temps du chargement, comme avant).
  const poster = !playing || OUTFITS[outfit].still.includes(pose);

  return (
    <div
      role="img"
      aria-label={LABELS[state]}
      className={`pio relative inline-block shrink-0 select-none ${className}`}
      style={{ width, height: size }}
    >
      {/* L'AFFICHE RESTE SOUS LE CLIP D'UNE POSE QUASI IMMOBILE (`still`).
          Sur iOS, un son qui part (la voix de l'énoncé, le « bravo » du
          verdict) fait DISPARAÎTRE la couche vidéo du clip HEVC muet
          sur-le-champ, avant que la page ait repeint quoi que ce soit : avec le
          remplacement du clip par l'affiche dans la même tâche, il restait 200
          à 300 ms de ciel vide à la place de Pio (film du verdict du
          18 octobre 2026, iPhone 17 ; retarder le démontage de la vidéo n'y
          changeait rien). Remontrer l'affiche sur un événement de la vidéo ne
          marcherait pas : un son qui part sous un clip monté ne lui fait rien
          dire (aucun `pause`, `suspend` ni `waiting` : sonde `[video]` de
          `app/dev/session-shell.tsx`, écran de fin avec `?son=1`), et au
          verdict le fil principal est pris 250 ms, un retour par la page
          arriverait après le trou. Peinte sous la vidéo, l'affiche de la pose
          prend le relais à l'image même où la vidéo s'éteint, sans passer par
          la page. Le clip « ask » part de cette affiche et en reste
          très proche : ce qu'il en laisse à découvert quand la tête tourne
          tient dans un à deux pixels de bord à la taille de la scène (5,7 % de
          la silhouette au pire, à pleine résolution). Sous un clip qui BOUGE,
          la même affiche ferait un Pio en double (« cheer » saute, son affiche
          restait debout derrière lui : écran de fin de palier, iPhone 17,
          18 octobre 2026) : pour ces poses, rien sous le clip.
          `decoding="sync"`, pas l'`async` de next/image : quand la pose change
          (ask puis cheer) dans une tâche déjà lourde, une affiche en cache
          (`preloadPioPosters`) se peint dans la même image. */}
      {poster && (
        <Image
          src={posterFor(outfit, pose, lite)}
          alt=""
          width={572}
          height={800}
          priority={priority}
          draggable={false}
          unoptimized
          decoding="sync"
          className="h-full w-full object-contain"
        />
      )}
      {playing && <PioClip key={`${outfit}:${pose}`} state={pose} outfit={outfit} size={size} priority={priority} lite={lite} />}
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
  lite,
}: {
  state: PioState;
  outfit: PioOutfit;
  size: PioSize;
  priority: boolean;
  lite: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  // Tout est à l'échelle de la hauteur de Pio dans le clip (800 px).
  const height = scaled(size, CLIP.height / CLIP.pioHeight);
  const width = scaled(size, CLIP.width / CLIP.pioHeight);
  // Les pattes de Pio au bas du cadre de mise en page : le clip déborde en haut.
  const headroom = CLIP.height - CLIP.pioHeight - CLIP.bottomGap;
  const top = scaled(size, -headroom / CLIP.pioHeight);
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
      poster={posterFor(outfit, state, lite)}
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
