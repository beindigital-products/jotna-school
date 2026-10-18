"use client";

import { Volume2, VolumeX } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { ACTION_TONES } from "./tones";
import { useGameFeel } from "./use-game-feel";

/**
 * LA BARRE D'ACTION D'UN EXERCICE — « Écouter » juste au-dessus de « Valider ».
 *
 * Le propriétaire l'a demandé en voyant la maquette : le haut-parleur quitte la
 * ligne de l'énoncé (toute la carte du haut sert à l'énoncé, pleine largeur,
 * plus lisible) et devient un gros bouton d'action bleu posé juste au-dessus
 * de Valider, là où le doigt va de toute façon. Pour un enfant de CI, qui ne
 * lit pas, l'icône compte plus que le mot : elle vient d'abord, puis
 * « Écouter ». Pendant que la voix joue, quatre barres battent à la place du
 * haut-parleur (un `scaleY`, rien d'autre) et le bouton sert d'arrêt
 * (`aria-pressed`). Sans voix (pas de clé, pas de réseau), il passe en crème
 * avec le haut-parleur barré : « pas de son », pas « cassé », jamais gris ; un
 * toucher réessaie.
 *
 * UNE SEULE BRIQUE POUR TOUS LES ÉCRANS. `SceneActionBar` prend le bouton
 * principal en enfant (un `ActionButton3D` « Valider », avec toutes ses props)
 * et pose « Écouter » au-dessus quand `listen` est donné. Un exercice sans
 * Valider (réponse au toucher) l'appelle sans enfant : « Écouter » se pose seul
 * au bas de la carte, au même endroit. Les écrans d'exercice ne l'appellent
 * pas directement : `ExerciseActions` (`components/exercises/game-parts.tsx`)
 * lit le lecteur de consignes et la remplit.
 *
 * UNE LIGNE SUR TOUS LES TÉLÉPHONES, LE MOT TOUJOURS LÀ. Sur un écran de
 * 960 px de haut ou moins (tous les téléphones debout, jusqu'au 440 × 956 d'un
 * iPhone Pro Max ; une tablette couchée), Écouter et Valider tiennent sur UNE
 * ligne : Écouter prend 42 % de la largeur AVEC SON MOT (icône puis
 * « Écouter », en 18 px), Valider le reste. Au-delà (une tablette debout,
 * 1024 px et plus), DEUX RANGÉES, « Écouter l'énoncé » en pleine largeur
 * au-dessus de Valider, comme sur la maquette du propriétaire
 * (`scratchpad/maquettes/maquette-1`). Depuis que la barre vit dans le dock
 * collé en bas (`scene-dock.tsx`), Valider est visible sans défiler quelle que
 * soit la hauteur ; ce qui compte, c'est que TOUTES les tuiles d'un QCM
 * restent au-dessus du dock sur le premier écran. Deux rangées (170 px de dock
 * au lieu de 94) les coupaient à mi-hauteur sur l'iPhone 17 (402 × 874,
 * encoche de 62 px : la seconde rangée du QCM 4, « 5 » et « 1 », à moitié
 * sous le dock ; relu le 18 octobre 2026) ; sur une ligne, la seconde rangée
 * passe au-dessus du dock avec 20 px de marge, et un enfant de six ans voit
 * ses quatre réponses sans qu'on lui dise de faire défiler. Le seuil a été
 * 880 px (Écouter y devenait un carré de 64 px sans mot : un carré bleu muet,
 * avec le même haut-parleur que le bouton qui COUPE le son dans l'en-tête, qui
 * porte désormais une note de musique, `session-stage.tsx`), puis 700 px (le
 * mot gardé, mais deux rangées sur tous les grands téléphones). Sous 340 px de
 * large seulement (un écran de 320 px, un texte agrandi), le mot ne tient plus
 * à côté de Valider : le carré de 64 px, et le nom accessible dit tout. Sans
 * Valider, « Écouter » garde sa pleine largeur et son mot à toute hauteur. Un
 * écran qui porte déjà un gros clavier (le pavé de chiffres de la réponse
 * courte) demande la ligne À TOUTE HAUTEUR (`row`) : le pavé est la zone du
 * pouce, la barre reste sous lui sans pousser Valider hors de l'écran.
 *
 * Même objet que `ActionButton3D` : flanc de 8 px, ombre sur la table qui se
 * rapproche à l'appui, face qui s'enfonce en 90 ms, filet de lumière
 * (`gk-face-light`). Même teinte ciel que les actions « écouter » du jeu
 * (`ACTION_TONES.sky`, texte blanc à 3:1 au moins au milieu de la face). Les
 * hauteurs minimales sont en pixels (le texte agrandi grandit le mot, pas le
 * bouton entier) ; les transitions listent `translate` et `scale` : en
 * Tailwind v4, `translate-y-*` écrit la propriété `translate`, pas
 * `transform`, et une liste `transform, opacity` ne l'animait pas.
 */
export type SceneListenStatus = "idle" | "loading" | "playing" | "unavailable";

/** Le nom accessible du bouton « Écouter » et de Pio touchable. */
export const LISTEN_LABEL = "Écouter l'énoncé";
/**
 * Le même bouton quand aucun son n'est à jouer (pas de clé, pas de réseau) : un
 * lecteur d'écran doit l'entendre. Sans le mot « réessayer » : un test de bout
 * en bout clique le premier bouton `/Suivant|Réessayer/` de la page.
 */
export const LISTEN_MUTED_LABEL = "Écouter l'énoncé : le son manque, touche pour relancer";

export type SceneListen = {
  status: SceneListenStatus;
  /** Relire, ou arrêter si la voix joue : l'appelant décide (`toggleReader`). */
  onPress: () => void;
};

export function SceneActionBar({
  listen,
  row = false,
  children,
  className = "",
}: {
  /** La voix de l'énoncé ; `null` ou absent : pas de bouton Écouter. */
  listen?: SceneListen | null;
  /** Écouter et Valider sur une ligne à toute hauteur (un écran qui porte déjà un pavé). */
  row?: boolean;
  /** Le bouton principal (Valider), ou rien pour un exercice qui se répond au toucher. */
  children?: ReactNode;
  className?: string;
}) {
  const hasMain = Boolean(children);
  if (!listen && !hasMain) return null;
  const pair = Boolean(listen) && hasMain;
  // Les deux boutons sur une ligne sur un téléphone (960 px de haut ou moins, ou toujours, `row`) ; un seul garde la colonne.
  // Des classes ÉCRITES EN ENTIER : Tailwind ne voit pas une classe composée
  // d'un préfixe et d'un suffixe dans deux chaînes (vu : le dock gardait deux
  // rangées à 360 × 640).
  const line = !pair ? "" : row ? "flex-row items-stretch" : "[@media(max-height:960px)]:flex-row [@media(max-height:960px)]:items-stretch";
  return (
    <div data-scene-actions data-row={pair && row ? "1" : undefined} className={`flex flex-col gap-3 ${line} ${className}`}>
      {listen && <ListenButton listen={listen} compact={pair && !row} square={pair && row} />}
      {hasMain && <div className="min-w-0 flex-1">{children}</div>}
    </div>
  );
}

const DEPTH = 8;

/**
 * LE GROS BOUTON BLEU « ÉCOUTER ». `compact` (Valider partage sa ligne sur un
 * téléphone, 960 px de haut ou moins) : 42 % de la largeur, l'icône et le mot
 * en 18 px ; `square`
 * (la barre en ligne à toute hauteur, `row`) : la même chose à toute
 * hauteur. Sous 340 px de large, dans les deux cas, le carré de 64 px sans le
 * mot.
 */
export function ListenButton({
  listen,
  compact = false,
  square = false,
  className = "",
}: {
  listen: SceneListen;
  compact?: boolean;
  square?: boolean;
  className?: string;
}) {
  const feel = useGameFeel();
  const loading = listen.status === "loading";
  const playing = listen.status === "playing";
  const muted = listen.status === "unavailable";
  const tone = muted ? ACTION_TONES.white : ACTION_TONES.sky;
  // Sur une ligne : `w-[42%]` SANS `w-full` (les deux ensemble, c'est `w-full`
  // qui gagne dans la feuille de Tailwind, et le bouton débordait de la ligne :
  // la vue mobile dézoomait toute la page). Sur un téléphone, la requête média
  // l'emporte d'elle-même sur `w-full`.
  // Un téléphone (960 px de haut ou moins) : une ligne ; un écran étroit (moins
  // de 340 px) : le carré sans le mot. Des classes en entier (voir `SceneActionBar`).
  const width = square
    ? "w-[42%] shrink-0 [@media(max-width:339px)]:w-16"
    : compact
      ? "w-full [@media(max-height:960px)]:w-[42%] [@media(max-height:960px)]:shrink-0 [@media(max-height:960px)_and_(max-width:339px)]:w-16"
      : "w-full";
  const facePad = square
    ? "px-3 [@media(max-width:339px)]:px-0"
    : compact
      ? "px-6 [@media(max-height:960px)]:px-3 [@media(max-height:960px)_and_(max-width:339px)]:px-0"
      : "px-6";
  const faceText = square ? "text-lg" : compact ? "text-xl [@media(max-height:960px)]:text-lg" : "text-xl";
  // Et quand le BOUTON lui-même est trop étroit pour le mot (le texte agrandi à
  // 150 % sur 360 px : « Écouter » débordait de sa face), le mot se cache par une
  // requête de conteneur (`@container` sur le bouton) ; un moteur qui ne les
  // sait pas (WebView d'avant 2022) le rogne, comme avant.
  const word = square
    ? "[@media(max-width:339px)]:hidden @max-[8.5rem]:hidden"
    : compact
      ? "[@media(max-height:960px)_and_(max-width:339px)]:hidden @max-[8.5rem]:hidden"
      : "";
  const rootStyle = { "--gk-depth": `${DEPTH}px` } as CSSProperties;

  return (
    <button
      type="button"
      onClick={() => {
        feel.vibrate("tap");
        listen.onPress();
      }}
      aria-label={muted ? LISTEN_MUTED_LABEL : LISTEN_LABEL}
      aria-pressed={playing}
      data-listen-status={listen.status}
      className={`gk-listen gk-motion group @container relative block cursor-pointer select-none rounded-2xl font-display font-extrabold tracking-wide gk-focus ${width} ${className}`}
      style={rootStyle}
    >
      {/* L'ombre sur la table. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-35 shadow-[0_8px_18px_rgb(60_30_0_/_0.5)] will-change-transform transition-[transform,translate,opacity] duration-150 ease-out group-active:translate-y-[2px] group-active:opacity-25"
        style={{ transform: `translateY(${DEPTH + 2}px)` }}
      />
      {/* Le flanc. */}
      <span aria-hidden className="absolute inset-0 rounded-2xl" style={{ backgroundColor: tone.flank, transform: `translateY(${DEPTH}px)` }} />
      {/* La face : elle s'enfonce sous le doigt ; elle respire pendant le chargement (opacité). */}
      <span
        className={`gk-face-light relative flex min-h-[64px] items-center justify-center gap-2.5 overflow-hidden rounded-2xl border-2 border-white/60 py-2 transition-[transform,translate] duration-[90ms] ease-out group-active:translate-y-[calc(var(--gk-depth)_-_1px)] [@media(max-height:480px)]:min-h-[56px] ${facePad} ${faceText} ${
          loading ? "animate-pulse" : ""
        }`}
        style={{
          backgroundImage: `linear-gradient(180deg, ${tone.faceTop} 0%, ${tone.faceBottom} 100%)`,
          color: tone.text,
          textShadow: muted ? undefined : "0 1px 0 rgb(0 0 0 / 0.22)",
        }}
      >
        {/* Le reflet du haut, statique. */}
        <span aria-hidden className="pointer-events-none absolute inset-x-2 top-[3px] h-[42%] rounded-xl bg-gradient-to-b from-white/45 to-white/0" />
        <span className="relative flex h-[28px] w-[28px] shrink-0 items-center justify-center">
          {playing ? <VoiceBars /> : muted ? <VolumeX className="h-[28px] w-[28px]" strokeWidth={2.75} aria-hidden /> : <Volume2 className="h-[28px] w-[28px]" strokeWidth={2.75} aria-hidden />}
        </span>
        <span className={`relative ${word}`}>Écouter</span>
      </span>
    </button>
  );
}

/** La voix qui joue : quatre barres qui battent, par `scaleY` depuis leur pied. */
function VoiceBars() {
  return (
    <span aria-hidden data-voice-bars className="flex h-[24px] w-[28px] items-end justify-center gap-[3px]">
      {[0.55, 1, 0.75, 0.9].map((height, i) => (
        <span
          key={i}
          className="w-1 origin-bottom rounded-full bg-current animate-[gk-voice_0.9s_ease-in-out_infinite]"
          style={{ height: `${Math.round(height * 100)}%`, animationDelay: `${i * 0.12}s` }}
        />
      ))}
    </span>
  );
}
