"use client";

import { Check, X } from "lucide-react";
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  type CSSProperties,
  type HTMLAttributes,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import {
  TILE_CORRECT_TONE,
  TILE_NEUTRAL_TONE,
  TILE_WRONG_TONE,
  tileChosenTone,
  tileRestTone,
  type SurfaceTone,
} from "./tones";
import { useDeviceTilt, useGameFeel } from "./use-game-feel";

/**
 * LA TUILE 3D — l'objet qu'un enfant croit tenir.
 *
 * Une réponse n'est plus une ligne de formulaire : c'est une tuile épaisse,
 * crème comme une carte du Monde de Pio, avec un flanc peint, une ombre
 * posée sur la table, un filet de lumière en haut. Elle se soulève quand on
 * la choisit, s'enfonce sous le doigt, gonfle quand elle est juste, dit non
 * de la tête quand elle est fausse. Quatre couches, toutes statiques dans
 * leur peinture ; seuls leurs `transform` et `opacity` bougent :
 *
 *   racine
 *   ├── ombre      : une boîte transparente à `box-shadow` fixe, que l'on
 *   │                éloigne et éclaircit quand la tuile se soulève ;
 *   └── objet      : ce qui se soulève, s'incline, gonfle ou secoue
 *       ├── flanc  : l'épaisseur, décalée de `--gk-depth` vers le bas ;
 *       └── face   : le dessus, qui s'enfonce de `depth - 1px` à l'appui.
 *
 * CE QUE LE WKWEBVIEW A APPRIS (simulateur iPhone 17, 18 octobre 2026) : un
 * toucher coûtait 180 à 200 ms d'image gelée, pour 3 ms de React. Deux
 * causes, corrigées ici. L'ombre : sa transition la promouvait en couche à
 * chaque toucher, et WebKit repeignait alors son flou de 14 px (42 px à
 * l'échelle 3) ; elle est désormais une couche permanente (`will-change`),
 * peinte une fois, que l'on ne fait que déplacer : c'est la seule exception
 * admise à « jamais de will-change en statique ». La perspective : posée sur
 * la racine, elle ouvrait un contexte 3D par tuile ; elle est maintenant une
 * fonction `perspective()` dans le transform de l'objet, même rendu pour
 * l'inclinaison, sans contexte. Résultat : 30 ms par toucher.
 *
 * QUATRE ÉLÉVATIONS (`docs/direction-jeu-exercices.md`) : à plat (sans
 * flanc, une case vide), posée (5 px de flanc), soulevée (la tuile choisie
 * monte de 4 px, son ombre s'éloigne), saisie (8 px et un peu plus grande :
 * ce qu'on traîne). Par défaut l'élévation suit l'état : choisie = soulevée,
 * le reste = posée. L'appelant la force pour une étiquette qu'on glisse.
 *
 * L'INCLINAISON suit le doigt (jusqu'à 7°) et l'appareil (variables
 * `--gk-dev-*` posées par `useDeviceTilt`, écoute partagée que la tuile
 * demande le temps qu'elle est montée), seulement au niveau « riche ». Elle
 * passe par des variables CSS écrites sur l'élément, sans re-rendu React.
 *
 * SÉMANTIQUE INCHANGÉE : un `<button>` par défaut, avec `aria-pressed` quand
 * elle est choisie, `disabled` natif, le focus visible. `as="div"` sert aux
 * étiquettes dont dnd-kit tient déjà la sémantique : on pose alors ses
 * `listeners` et `attributes` sur la tuile (`...rest`), et `touch-none` reste
 * à la charge de l'appelant sur la poignée.
 *
 * LES PROPS DES ÉCRANS D'EXERCICE NE CHANGENT PAS : cette tuile se met SOUS
 * les options existantes (`QcmExercise`, `MatchExercise`…), elle n'en modifie
 * pas le contrat.
 */
export type TileState = "repos" | "choisie" | "juste" | "fausse";
export type TileElevation = "plat" | "posee" | "soulevee" | "saisie";
export type TileTone = number | "neutre";

type Elevation = { depth: number; lift: number; scale: number; shadowY: number; shadowScale: number; shadowOpacity: number };

/** L'échelle des élévations, en pixels. */
export const ELEVATIONS: Record<TileElevation, Elevation> = {
  plat: { depth: 0, lift: 0, scale: 1, shadowY: 1, shadowScale: 0.98, shadowOpacity: 0.12 },
  posee: { depth: 5, lift: 0, scale: 1, shadowY: 6, shadowScale: 0.99, shadowOpacity: 0.3 },
  soulevee: { depth: 5, lift: -4, scale: 1.01, shadowY: 12, shadowScale: 1.01, shadowOpacity: 0.24 },
  saisie: { depth: 5, lift: -8, scale: 1.04, shadowY: 18, shadowScale: 1.04, shadowOpacity: 0.18 },
};

/** L'élévation qu'un état prend quand l'appelant n'en impose pas. */
export function elevationFor(state: TileState, elevation?: TileElevation): TileElevation {
  if (elevation) return elevation;
  return state === "choisie" ? "soulevee" : "posee";
}

/** La teinte d'une tuile selon son état et son option. */
export function toneFor(state: TileState, tone: TileTone): SurfaceTone {
  if (state === "juste") return TILE_CORRECT_TONE;
  if (state === "fausse") return TILE_WRONG_TONE;
  if (tone === "neutre") return TILE_NEUTRAL_TONE;
  return state === "choisie" ? tileChosenTone(tone) : tileRestTone(tone);
}

const TILT_MAX_DEG = 7;

type Props = Omit<HTMLAttributes<HTMLElement>, "onClick" | "children" | "style"> & {
  children: ReactNode;
  state?: TileState;
  /** L'index de l'option (0 à 5, les couleurs de `QcmExercise`) ou `neutre`. */
  tone?: TileTone;
  elevation?: TileElevation;
  disabled?: boolean;
  onPress?: () => void;
  /** La pastille à gauche : une lettre, un numéro, une icône. Remplacée par l'icône d'état quand la tuile est juste ou fausse. */
  badge?: ReactNode;
  size?: "md" | "lg";
  align?: "left" | "center";
  /** `div` pour une étiquette dont dnd-kit tient la sémantique. */
  as?: "button" | "div";
  /** Force ou coupe l'inclinaison sous le doigt (sinon : le niveau décide). */
  tilt?: boolean;
  style?: CSSProperties;
};

export const Tile3D = forwardRef<HTMLElement, Props>(function Tile3D(
  {
    children,
    state = "repos",
    tone = 0,
    elevation,
    disabled = false,
    onPress,
    badge,
    size = "md",
    align = "left",
    as = "button",
    tilt,
    className = "",
    style,
    ...rest
  },
  ref,
) {
  const feel = useGameFeel();
  const objectRef = useRef<HTMLSpanElement>(null);
  const rootRef = useRef<HTMLElement>(null);
  useImperativeHandle(ref, () => rootRef.current as HTMLElement);

  const tiltAllowed = tilt ?? feel.budget.tilt;
  const tilting = tiltAllowed && !disabled;
  // Le capteur de l'appareil n'est écouté que tant qu'une tuile est montée
  // (`use-game-feel.tsx`) : pas pendant l'écran de fin ni sur la savane seule.
  useDeviceTilt(tiltAllowed);
  const lvl = ELEVATIONS[elevationFor(state, elevation)];
  const colors = toneFor(state, tone);

  /* L'inclinaison : deux variables sur l'objet, pas d'état React. */
  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const object = objectRef.current;
      if (!object) return;
      const rect = event.currentTarget.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const px = (event.clientX - rect.left) / rect.width - 0.5;
      const py = (event.clientY - rect.top) / rect.height - 0.5;
      object.style.setProperty("--gk-ry", `${(px * TILT_MAX_DEG * 2).toFixed(1)}deg`);
      object.style.setProperty("--gk-rx", `${(-py * TILT_MAX_DEG * 2).toFixed(1)}deg`);
    },
    [],
  );
  const resetTilt = useCallback(() => {
    const object = objectRef.current;
    if (!object) return;
    object.style.removeProperty("--gk-rx");
    object.style.removeProperty("--gk-ry");
  }, []);

  const motionClass =
    state === "juste"
      ? "animate-[gk-pop_0.45s_ease-out]"
      : state === "fausse"
        ? "animate-[gk-shake-soft_0.45s_ease-in-out]"
        : "";

  const rootVars = {
    "--gk-depth": `${lvl.depth}px`,
    ...style,
  } as CSSProperties;

  const objectStyle: CSSProperties = {
    transform: `perspective(700px) translateY(${lvl.lift}px) scale(${lvl.scale}) rotateX(calc(var(--gk-rx, 0deg) + var(--gk-dev-rx, 0deg))) rotateY(calc(var(--gk-ry, 0deg) + var(--gk-dev-ry, 0deg)))`,
  };
  const shadowStyle: CSSProperties = {
    transform: `translateY(${lvl.shadowY}px) scale(${lvl.shadowScale})`,
    opacity: lvl.shadowOpacity,
  };
  const faceStyle: CSSProperties = {
    backgroundImage: `linear-gradient(180deg, ${colors.faceTop} 0%, ${colors.faceBottom} 100%)`,
    color: colors.text,
  };

  const sizeClass = size === "lg" ? "min-h-16 px-5 py-3.5 text-xl" : "min-h-14 px-4 py-3 text-lg";
  const stateIcon =
    state === "juste" ? (
      <Check className="h-5 w-5" strokeWidth={3.5} aria-hidden />
    ) : state === "fausse" ? (
      <X className="h-5 w-5" strokeWidth={3.5} aria-hidden />
    ) : null;
  // Avec une pastille, l'icône d'état la remplace ; sans pastille (une tuile
  // qui ne montre qu'un émoji ou un chiffre centré), elle se pose en médaillon
  // sur le coin haut droit, pour ne pas pousser le contenu.
  const showBadge = badge !== undefined;
  const cornerIcon = badge === undefined ? stateIcon : null;

  const shared = {
    ref: rootRef as React.Ref<HTMLButtonElement & HTMLDivElement>,
    className: `gk-tile gk-motion group relative block w-full select-none rounded-2xl text-left font-display font-extrabold gk-focus ${
      disabled ? "cursor-not-allowed" : as === "button" ? "cursor-pointer" : ""
    } ${className}`,
    style: rootVars,
    "data-state": state,
    "data-elevation": elevationFor(state, elevation),
    onPointerMove: tilting ? onPointerMove : undefined,
    onPointerLeave: tilting ? resetTilt : undefined,
    onPointerUp: tilting ? resetTilt : undefined,
    onPointerCancel: tilting ? resetTilt : undefined,
    ...rest,
  };

  const body = (
    <>
      {/* L'ombre sur la table : une boîte transparente à ombre fixe, que l'on éloigne. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl shadow-[0_6px_14px_rgb(60_30_0_/_0.55)] will-change-transform transition-[transform,opacity] duration-200 ease-out"
        style={shadowStyle}
      />
      {/* L'objet : ce qui se soulève, s'incline, gonfle ou secoue. Verrouillée
          sans verdict, la tuile pâlit ICI (une couche déjà composée : son
          opacité ne coûte rien), pas sur la racine : une opacité sur la racine
          obligeait le WKWebView à recomposer toute la tuile, ombre comprise, à
          chaque verrouillage. La tuile jugée garde toute sa lumière. */}
      <span
        ref={objectRef}
        className={`gk-spring relative block transition-transform duration-[220ms] ${motionClass} ${
          disabled && state !== "juste" && state !== "fausse" ? "opacity-70" : ""
        }`}
        style={objectStyle}
      >
        {/* Le flanc : l'épaisseur, décalée vers le bas. */}
        <span
          aria-hidden
          className="absolute inset-0 rounded-2xl"
          style={{ backgroundColor: colors.flank, transform: `translateY(${lvl.depth}px)` }}
        />
        {/* La face : elle s'enfonce sous le doigt. */}
        <span
          className={`gk-face-light relative flex items-center gap-3 rounded-2xl border-2 border-white/70 transition-transform duration-[90ms] ease-out ${
            disabled ? "" : "group-active:translate-y-[calc(var(--gk-depth)_-_1px)]"
          } ${sizeClass} ${align === "center" ? "justify-center text-center" : ""}`}
          style={faceStyle}
        >
          {/* Le reflet : une bande claire en haut de la face. */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-2 top-[3px] h-[38%] rounded-xl bg-gradient-to-b from-white/55 to-white/0"
          />
          {showBadge && (
            <span
              aria-hidden
              className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base font-extrabold shadow-[inset_0_-2px_0_rgb(0_0_0_/_0.18),0_2px_0_rgb(0_0_0_/_0.12)]"
              style={{ backgroundColor: colors.badge, color: colors.badgeText }}
            >
              {stateIcon ?? badge}
            </span>
          )}
          {/* `overflow-wrap: anywhere` : un mot plus large que la tuile (le texte
              agrandi à 200 %, « l'éléphant » sur deux colonnes) se coupe au lieu
              de déborder ; à l'échelle normale, rien ne change (seul un mot qui
              ne tient pas se coupe). Pas d'`hyphens: auto` : il couperait aussi
              des mots qui tiennent. */}
          <span className={`relative min-w-0 flex-1 leading-snug [overflow-wrap:anywhere] ${align === "center" ? "text-center" : ""}`}>
            {children}
          </span>
          {cornerIcon && (
            <span
              aria-hidden
              className="gk-tile-corner absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white shadow-[0_2px_0_rgb(0_0_0_/_0.18)]"
              style={{ backgroundColor: colors.badge, color: colors.badgeText }}
            >
              {cornerIcon}
            </span>
          )}
        </span>
      </span>
    </>
  );

  if (as === "div") {
    return (
      <div {...(shared as HTMLAttributes<HTMLDivElement> & { ref: React.Ref<HTMLDivElement> })} aria-disabled={disabled || undefined}>
        {body}
      </div>
    );
  }

  return (
    <button
      type="button"
      {...(shared as HTMLAttributes<HTMLButtonElement> & { ref: React.Ref<HTMLButtonElement> })}
      disabled={disabled}
      aria-pressed={state === "choisie"}
      onClick={() => {
        if (disabled) return;
        feel.vibrate("tap");
        onPress?.();
      }}
    >
      {body}
    </button>
  );
});
