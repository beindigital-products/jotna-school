"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { AlertTriangle, Check } from "lucide-react";
import ExercisePrompt from "./ExercisePrompt";
import { payloadImage } from "./ExerciseImage";
import { ExerciseActions } from "./game-parts";
import { MATCH_HINT } from "@/convex/voice/speakable";
import { linkTiles, matchAnswer, type MatchLink } from "@/lib/exerciseAnswers";
import {
  ActionButton3D,
  ELEVATIONS,
  GESTURE_ACCENT,
  OPTION_TONE_COUNT,
  Reward,
  TILE_CORRECT_TONE,
  TILE_WRONG_TONE,
  Tile3D,
  tileChosenTone,
  useGameFeel,
  type TileState,
} from "@/components/student/game-kit";
import {
  CableOverlay,
  type Cable,
  type CableTone,
  type Point,
  type Socket,
} from "@/components/student/game-kit/gestes-cables";
import { useTilePictures } from "./item-pictures";
import { useTileVoice } from "./prompt-reader";
import { glyphTilesOf, isDenseTileCount, TilePicture } from "./tile-picture";

/**
 * Server contract — the sanitized payload sent by `getExercisesForPalier`
 * (see convex/paliers/index.ts → sanitizePayload case "match"):
 *   { left:  string[]   // original order, kid pairs FROM these
 *     right: string[] } // already shuffled deterministically server-side
 *
 * The submission expected by `verifyMatch` is
 *   JSON.stringify([{ left, right }, …])
 * matching the kid's connections.
 *
 * ON PEUT COMMENCER PAR LA GAUCHE OU PAR LA DROITE : le premier toucher
 * choisit la tuile, le suivant, dans l'AUTRE colonne, la relie à elle. Un
 * toucher sur une tuile déjà reliée défait son lien.
 *
 * UNE TUILE EST SA POSITION, PAS SON TEXTE. Deux tuiles peuvent se ressembler
 * (« a » deux fois : mangue et yassa ont le même son). Suivies par leur
 * texte, relier l'une colorait les deux et le second mot restait sans
 * partenaire. Les liens retiennent donc des indices (`lib/exerciseAnswers.ts`).
 *
 * L'ÉCRAN EST UN JEU DE CÂBLES (`docs/direction-jeu-exercices.md`). Chaque
 * tuile est une `Tile3D` épaisse, posée sur la carte, avec une prise sur son
 * bord intérieur. Toucher une tuile la soulève et la teinte de bleu (l'accent
 * du geste « choisir ») ; les prises de l'autre colonne s'allument en ambre
 * et l'appellent. Toucher le partenaire tend un câble d'une prise à l'autre,
 * dans la couleur de la paire, et les deux tuiles prennent cette couleur. Les
 * câbles sont dessinés dans un SVG par-dessus la grille
 * (`game-kit/gestes-cables.tsx`) à partir des positions mesurées des tuiles.
 * Juste : tout passe au vert et gonfle, la récompense jaillit de la planche.
 * Faux : tout passe à l'ambre et dit non, jamais de rouge.
 *
 * LE CONTRAT DU DOM reste celui que la galerie, la vitrine et les tests
 * connaissent : les tuiles de gauche sont les N premiers boutons de réponse,
 * celles de droite les N suivants, puis « Valider » ; le nom accessible d'une
 * tuile est son texte. `data-linked` et `data-rank` disent son lien.
 *
 * « Valider » est posé dans la barre d'action (`ExerciseActions`,
 * `game-parts.tsx`) : pour un enfant qui apprend à lire, « Écouter » vient
 * juste au-dessus, comme au QCM.
 *
 * EN CI, UNE TUILE QUI NOMME UNE CHOSE MONTRE SON IMAGE (`item-pictures.tsx`) :
 * un enfant de six ans ne lit pas encore « le crocodile », il doit VOIR de quoi
 * on parle. Les images se résolvent sur le texte des tuiles, côté par côté
 * (`useTilePictures`), avec l'énoncé (un énoncé qui demande de lire, de décoder,
 * de nommer ou de traduire n'en laisse aucune), l'image d'énoncé et, pour chaque
 * côté, ce que l'AUTRE montre : ses tuiles « que des émojis » (quand un côté montre
 * « [chat] » et l'autre « le chat », l'image sur le mot donnerait la paire : le
 * côté des mots n'en reçoit aucune et le côté des émojis reste en émojis, [chat]
 * tient lieu de l'émoji) et ses textes (`counterpart` : « Arachide » en face de
 * « Cacahuète », la même image des deux côtés, se relierait par son dessin : ni
 * l'un ni l'autre n'en reçoit). Une tuile qui reçoit une image la pose au-dessus
 * de son mot sur un téléphone, à côté de lui à 640 px de large et plus, sans
 * l'émoji de tête que l'image remplace (`tile-picture.tsx` dit la mise en page et
 * la hauteur qu'elle coûte : une tuile de 68,5 px au lieu de 56 en pile, 56 px en
 * rangée ; une colonne qui montre des images serre ses tuiles de 12 px à 8 px).
 * Rien ne change dans la donnée : les paires partent toujours en
 * `{ left, right }` faites des textes d'origine, et le nom accessible d'une tuile
 * à image est son mot. Sans `ItemPicturesProvider` (les autres classes, la vitrine,
 * les aperçus des professeurs) ou pour une tuile sans image, le DOM est celui
 * d'avant, au caractère près.
 */
interface MatchPayload {
  /** Identifiant d'une image d'énoncé du catalogue (`lib/exercise-images.ts`). */
  image?: string;
  left?: string[];
  right?: string[];
}

interface MatchExerciseProps {
  prompt: string;
  payload: MatchPayload;
  onSubmit: (answer: string) => void;
  onSkip?: () => void;
  disabled: boolean;
  isCorrect: boolean | null;
}

type Side = keyof MatchLink;

/** La tuile en main prend l'accent du geste « choisir » : le bleu d'option. */
const SELECT_TONE = GESTURE_ACCENT.choisir.optionIndex;

/**
 * La couleur d'une paire suit son rang, en sautant le bleu de la sélection :
 * rose, ambre, vert, violet, sarcelle, puis bleu pour une sixième paire.
 */
export function pairTone(rank: number): number {
  return (rank + 1) % OPTION_TONE_COUNT;
}

/** Le câble d'une paire : la couleur 500 de son option et son contour 700 ; vert ou ambre après le verdict. */
export function cableToneFor(rank: number, verdict: boolean | null): CableTone {
  if (verdict === true) return { main: TILE_CORRECT_TONE.badge, dark: TILE_CORRECT_TONE.flank };
  if (verdict === false) return { main: TILE_WRONG_TONE.badge, dark: TILE_WRONG_TONE.flank };
  const tone = tileChosenTone(pairTone(rank));
  return { main: tone.flank, dark: tone.badge };
}

const SELECT_CABLE_TONE: CableTone = { main: tileChosenTone(SELECT_TONE).flank, dark: tileChosenTone(SELECT_TONE).badge };

/**
 * LA LARGEUR DES DEUX COLONNES SUIT LEUR CONTENU. Quand une colonne ne porte
 * que des signes d'un ou deux graphèmes (« 2 », « 5 », « a », « an ») et
 * l'autre des rangées d'émojis ou des mots, la première se serre (un tiers)
 * et laisse les deux autres tiers aux rangées : quatre mangues tiennent alors
 * sur une ligne de tuile au lieu de deux, et la planche est plus courte sur un
 * téléphone. Deux colonnes de mots, ou deux de signes : moitié-moitié.
 */
export function matchColumns(left: readonly string[], right: readonly string[]): "egales" | "gauche-etroite" | "droite-etroite" {
  const narrow = (items: readonly string[]) => items.every((item) => Array.from(item.trim()).length <= 2);
  const leftNarrow = narrow(left);
  const rightNarrow = narrow(right);
  if (leftNarrow === rightNarrow) return "egales";
  return leftNarrow ? "gauche-etroite" : "droite-etroite";
}

const COLUMN_CLASSES = {
  egales: "grid-cols-2",
  "gauche-etroite": "grid-cols-[1fr_2fr]",
  "droite-etroite": "grid-cols-[2fr_1fr]",
} as const;

type Geometry = { left: Point[]; right: Point[] };

const samePoints = (a: Point[], b: Point[]) =>
  a.length === b.length && a.every((p, i) => Math.abs(p.x - b[i].x) < 0.5 && Math.abs(p.y - b[i].y) < 0.5);

export default function MatchExercise({
  prompt,
  payload,
  onSubmit,
  onSkip,
  disabled,
  isCorrect,
}: MatchExerciseProps) {
  const left = Array.isArray(payload?.left) ? payload.left : [];
  const right = Array.isArray(payload?.right) ? payload.right : [];
  const malformed = left.length === 0 || right.length !== left.length;
  const feel = useGameFeel();

  // L'image de chaque tuile (CI), côté par côté : chaque côté se résout avec les
  // tuiles « que des émojis » de l'autre. Avant le retour anticipé : l'ordre des
  // hooks ne dépend pas de la donnée.
  const exerciseImage = payloadImage(payload);
  const pictures = {
    left: useTilePictures(left, { prompt, glyphTiles: glyphTilesOf(right), counterpart: right, exerciseImage }),
    right: useTilePictures(right, { prompt, glyphTiles: glyphTilesOf(left), counterpart: left, exerciseImage }),
  };
  // La voix des tuiles (CI) : toucher un mot le dit. Les deux colonnes se suivent
  // (le rang d'une tuile de droite est celui de la gauche plus son indice). Pas de
  // file automatique : six à dix mots à la suite, après le mode d'emploi, feraient
  // attendre l'enfant ; il entend chaque mot en le touchant.
  const tileVoice = useTileVoice([...left, ...right], prompt, { autoRead: true });
  const voiceIndex = (side: Side, index: number) => (side === "left" ? index : left.length + index);

  // Des INDICES dans `left` et `right`, jamais des textes (voir l'en-tête).
  // La tuile choisie attend son partenaire dans l'autre colonne.
  const [selected, setSelected] = useState<{ side: Side; index: number } | null>(null);
  const [links, setLinks] = useState<MatchLink[]>([]);

  // La récompense rejoue à chaque passage à « juste » : un compteur ajusté
  // pendant le rendu, comme `Reward` le fait pour sa propre prop.
  const [fire, setFire] = useState(0);
  const [seenVerdict, setSeenVerdict] = useState(isCorrect);
  if (isCorrect !== seenVerdict) {
    setSeenVerdict(isCorrect);
    if (isCorrect === true) setFire((n) => n + 1);
  }

  /* ── Les positions des prises ─────────────────────────────────────────── */

  // Les câbles se dessinent entre les bords intérieurs des tuiles, mesurés
  // relativement à la planche. Mesuré après chaque changement de liens et à
  // chaque redimensionnement (un mot qui passe à la ligne change la hauteur).
  const boardRef = useRef<HTMLDivElement>(null);
  const tileRefs = useRef<{ left: (HTMLElement | null)[]; right: (HTMLElement | null)[] }>({ left: [], right: [] });
  const [geometry, setGeometry] = useState<Geometry | null>(null);
  const count = left.length;

  const measure = useCallback(() => {
    const board = boardRef.current;
    if (!board) return;
    const box = board.getBoundingClientRect();
    const edge = (el: HTMLElement | null, side: Side): Point => {
      if (!el) return { x: 0, y: 0 };
      const rect = el.getBoundingClientRect();
      return {
        x: (side === "left" ? rect.right : rect.left) - box.left,
        y: rect.top + rect.height / 2 - box.top,
      };
    };
    const next: Geometry = {
      left: Array.from({ length: count }, (_, i) => edge(tileRefs.current.left[i] ?? null, "left")),
      right: Array.from({ length: count }, (_, i) => edge(tileRefs.current.right[i] ?? null, "right")),
    };
    setGeometry((prev) => (prev && samePoints(prev.left, next.left) && samePoints(prev.right, next.right) ? prev : next));
  }, [count]);

  useLayoutEffect(() => {
    measure();
  }, [measure, links, selected, isCorrect, disabled]);

  useEffect(() => {
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => measure());
    if (boardRef.current) observer.observe(boardRef.current);
    for (const el of [...tileRefs.current.left, ...tileRefs.current.right]) if (el) observer.observe(el);
    // Les polices arrivent après le premier rendu et changent les retours à la ligne.
    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready.then(measure).catch(() => {});
    }
    return () => observer.disconnect();
  }, [measure]);

  /* ── Les gestes ───────────────────────────────────────────────────────── */

  const handleClick = (side: Side, index: number) => {
    if (disabled) return;
    // Toucher un mot, c'est l'entendre, qu'il se relie, se délie ou se choisisse.
    tileVoice?.hear(voiceIndex(side, index));
    // Une tuile reliée : on défait son lien.
    if (links.some((link) => link[side] === index)) {
      setLinks(links.filter((link) => link[side] !== index));
      setSelected(null);
      return;
    }
    // Rien de choisi, ou une tuile de la même colonne : on choisit celle-ci.
    if (selected === null || selected.side === side) {
      setSelected({ side, index });
      return;
    }
    // Une tuile de l'autre colonne : on relie, et le câble claque dans la main.
    setLinks(
      side === "right"
        ? linkTiles(links, selected.index, index)
        : linkTiles(links, index, selected.index),
    );
    setSelected(null);
    feel.vibrate("select");
  };

  /** Le rang du lien d'une tuile, -1 si elle est libre. */
  const rankOf = (side: Side, index: number) => links.findIndex((link) => link[side] === index);

  const handleSubmit = () => {
    onSubmit(matchAnswer(left, right, links));
  };

  // True soft-fail — should be vanishingly rare now that the contract is
  // wired correctly. Keep the safety net for future schema drift.
  if (malformed) {
    if (typeof window !== "undefined") {
      console.error(
        "[MatchExercise] payload missing or mismatched 'left'/'right'; soft-fail. payload =",
        payload,
      );
    }
    return (
      <div className="space-y-4">
        <ExercisePrompt prompt={prompt} image={payloadImage(payload)} />
        <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-amber-300 bg-amber-50 p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-amber-600" aria-hidden />
          <div>
            <p className="font-bold text-amber-900">
              Cet exercice est cassé, on te le saute.
            </p>
            <p className="mt-1 text-sm text-amber-700">
              Pas de souci, ça ne te coûte rien.
            </p>
          </div>
          <button
            onClick={() => onSkip?.()}
            disabled={disabled}
            className="mt-1 rounded-2xl bg-amber-500 px-6 py-2.5 text-base font-bold text-white shadow hover:bg-amber-600 disabled:opacity-50"
          >
            Suivant
          </button>
        </div>
      </div>
    );
  }

  /* ── Ce que chaque tuile montre ───────────────────────────────────────── */

  const complete = links.length === left.length;
  const columns = matchColumns(left, right);

  const tileState = (linked: boolean, active: boolean): TileState => {
    if (linked && isCorrect === true) return "juste";
    if (linked && isCorrect === false) return "fausse";
    return linked || active ? "choisie" : "repos";
  };

  /** La prise d'une tuile : reliée, en main, appelée par la tuile en main, ou libre. */
  const socketOf = (side: Side, index: number, point: Point): Socket => {
    const rank = rankOf(side, index);
    const active = selected?.side === side && selected.index === index;
    // La tuile en main est soulevée : sa prise monte avec elle.
    const at = active ? { x: point.x, y: point.y + ELEVATIONS.soulevee.lift } : point;
    if (rank >= 0) return { id: `${side}-${index}`, at, mode: "relie", tone: cableToneFor(rank, isCorrect) };
    if (active) return { id: `${side}-${index}`, at, mode: "choisie", tone: SELECT_CABLE_TONE };
    const called = selected !== null && selected.side !== side && !disabled;
    return { id: `${side}-${index}`, at, mode: called ? "appel" : "libre" };
  };

  const cables: Cable[] = geometry
    ? links.map((link, rank) => ({
        id: `${link.left}-${link.right}`,
        from: geometry.left[link.left] ?? { x: 0, y: 0 },
        to: geometry.right[link.right] ?? { x: 0, y: 0 },
        tone: cableToneFor(rank, isCorrect),
      }))
    : [];
  const sockets: Socket[] = geometry
    ? [
        ...geometry.left.map((point, index) => socketOf("left", index, point)),
        ...geometry.right.map((point, index) => socketOf("right", index, point)),
      ]
    : [];

  const column = (side: Side, items: string[]) => (
    // Une colonne qui montre des images serre ses tuiles (8 px au lieu de 12) et, à
    // partir de quatre, leurs pastilles : voir `tile-picture.tsx`.
    <div className={pictures[side].some((picture) => picture !== null) ? "space-y-2" : "space-y-3"}>
      {items.map((item, index) => {
        const rank = rankOf(side, index);
        const linked = rank >= 0;
        const active = selected?.side === side && selected.index === index;
        return (
          <Tile3D
            key={index}
            ref={(el) => {
              tileRefs.current[side][index] = el;
            }}
            tone={linked ? pairTone(rank) : SELECT_TONE}
            state={tileState(linked, active)}
            // Une tuile reliée est posée ; seule la tuile en main se soulève.
            elevation={linked ? "posee" : undefined}
            disabled={disabled}
            onPress={() => handleClick(side, index)}
            speaking={tileVoice?.speaking === voiceIndex(side, index)}
            align="center"
            data-side={side}
            data-linked={linked ? "true" : "false"}
            data-rank={linked ? rank : undefined}
          >
            <TilePicture text={item} image={pictures[side][index]} dense={isDenseTileCount(items.length)} />
          </Tile3D>
        );
      })}
    </div>
  );

  return (
    // Sur un écran court (667 px ou moins), les blocs se resserrent, comme au QCM.
    <div className="space-y-6 [@media(max-height:667px)]:space-y-4">
      <div className="space-y-2">
        <ExercisePrompt prompt={prompt} image={payloadImage(payload)} />
        {/* Le mode d'emploi, en petit : il est DIT par Pio (CI, CP) ; ici il ne
            doit pas pousser les tuiles sous le premier écran d'un téléphone. */}
        <p className="text-sm font-semibold leading-snug text-amber-900/80">{MATCH_HINT}</p>
      </div>

      {/* La planche : deux colonnes de tuiles, les câbles par-dessus, la récompense au milieu. */}
      <div ref={boardRef} className="relative">
        <div className={`grid gap-x-7 sm:gap-x-14 ${COLUMN_CLASSES[columns]}`} data-columns={columns}>
          {/* Left column — original order */}
          {column("left", left)}
          {/* Right column — server-shuffled */}
          {column("right", right)}
        </div>
        <CableOverlay cables={cables} sockets={sockets} />
        <Reward fire={fire > 0 ? fire : null} />
      </div>

      {/* Les paires, pour qui n'y voit pas : les câbles sont muets. */}
      <p className="sr-only" aria-live="polite">
        {links.map((link) => `${left[link.left]} relié à ${right[link.right]}`).join(", ")}
      </p>

      <ExerciseActions>
        {/* La coche : le même « Valider » que le QCM, pour que le dock ne change pas de visage d'une question à l'autre. */}
        <ActionButton3D
          shine={complete && !disabled}
          disabled={disabled || !complete}
          onClick={handleSubmit}
          icon={<Check className="h-6 w-6" strokeWidth={3} aria-hidden />}
        >
          Valider
        </ActionButton3D>
      </ExerciseActions>
    </div>
  );
}
