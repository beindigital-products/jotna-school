/**
 * LES JEUX FABRIQUÉS PAR LE CODE — le catalogue et la fabrique.
 *
 * Une thématique du programme (`convex/programme`) dit quels jeux mêler à
 * ses paliers, et combien : « trois frises de couleurs, deux dessins de
 * mémoire ». Le reste du palier vient du modèle de langue, comme avant. Une
 * thématique tout en jeux (« Grave ou aigu ? ») n'appelle pas le modèle du
 * tout : rien à payer, rien à attendre.
 *
 * MODULE PUR : la génération d'un palier (`paliers/index.ts`), la
 * régénération d'un exercice raté et les tests l'appellent de la même façon.
 */
import type { VisibleClassName } from "../../curriculum";
import { PALIER_SIZE } from "../scoring";
import { makeColorPair, makeColorPick, makeColorResult, makeWarmCold } from "./colors";
import { makeAddEmojis, makeCountEmojis, makeTakeAwayEmojis } from "./counting";
import {
  makeBeatCount,
  makeDuration,
  makeMelody,
  makePitch,
  makeRhythmPattern,
  makeSameDifferent,
  makeVolume,
} from "./listen";
import { makeFreshFrise, makeNumberSuite } from "./patterns";
import {
  makeFirstLetter,
  makeFirstSyllable,
  makeLastSyllable,
  makeLetterCount,
  makeLetterOrder,
  makeMissingLetter,
  makeMissingSyllable,
  makeSentenceGap,
  makeSyllableCount,
  makeSyllableOrder,
  makeSyllableToWord,
  makeWordFromSyllable,
  makeWordToPicture,
} from "./words";
import { makeColorByNumber, makePixelCopy, makePixelMemory, makePixelSymmetry } from "./pixel";
import {
  gameLevel,
  makeContext,
  type GameContext,
  type GameExerciseType,
  type GameLevel,
  type GeneratedGame,
} from "./shared";
import type { GameOrigin } from "./types";

export type { GeneratedGame, GameExerciseType } from "./shared";

export const GAME_KINDS = {
  "frise-couleurs": {
    label: "Frise de couleurs",
    type: "pattern",
    make: (ctx: GameContext) => makeFreshFrise(ctx, "couleurs"),
  },
  "frise-formes": {
    label: "Frise de formes",
    type: "pattern",
    make: (ctx: GameContext) => makeFreshFrise(ctx, "formes"),
  },
  "frise-objets": {
    label: "Frise d'images",
    type: "pattern",
    make: (ctx: GameContext) => makeFreshFrise(ctx, "objets"),
  },
  "frise-rythme": {
    label: "Rythme écrit à compléter",
    type: "pattern",
    make: (ctx: GameContext) => makeFreshFrise(ctx, "rythme"),
  },
  "suite-nombres": { label: "Suite de nombres", type: "pattern", make: makeNumberSuite },
  "pixel-copie": { label: "Reproduire un dessin", type: "pixel-art", make: makePixelCopy },
  "pixel-memoire": { label: "Dessin de mémoire", type: "pixel-art", make: makePixelMemory },
  "pixel-symetrie": { label: "Symétrie", type: "pixel-art", make: makePixelSymmetry },
  "coloriage-magique": { label: "Coloriage magique", type: "pixel-art", make: makeColorByNumber },
  "ecoute-hauteur": { label: "Grave ou aigu", type: "listen", make: makePitch },
  "ecoute-duree": { label: "Long ou court", type: "listen", make: makeDuration },
  "ecoute-intensite": { label: "Fort ou doux", type: "listen", make: makeVolume },
  "ecoute-rythme": { label: "Compter les coups", type: "listen", make: makeBeatCount },
  "ecoute-motif-rythmique": { label: "Reconnaître un rythme", type: "listen", make: makeRhythmPattern },
  "ecoute-melodie": { label: "La mélodie monte ou descend", type: "listen", make: makeMelody },
  "ecoute-pareil": { label: "Pareil ou différent", type: "listen", make: makeSameDifferent },
  "couleurs-reconnaitre": { label: "Reconnaître une couleur", type: "color-mix", make: makeColorPick },
  "couleurs-melange": { label: "Mélanger deux couleurs", type: "color-mix", make: makeColorResult },
  "couleurs-melange-inverse": { label: "Retrouver un mélange", type: "color-mix", make: makeColorPair },
  "couleurs-chaudes-froides": { label: "Couleurs chaudes et froides", type: "color-mix", make: makeWarmCold },
  // Les gabarits : des exercices classiques, écrits à partir d'un vocabulaire fermé.
  "syllabes-ordre": { label: "Remettre des syllabes dans l'ordre", type: "order", make: makeSyllableOrder },
  "lettres-ordre": { label: "Remettre des lettres dans l'ordre", type: "order", make: makeLetterOrder },
  "syllabe-initiale": { label: "Première syllabe d'un mot", type: "qcm", make: makeFirstSyllable },
  "lettre-initiale": { label: "Première lettre d'un mot", type: "qcm", make: makeFirstLetter },
  "syllabe-finale": { label: "Dernière syllabe d'un mot", type: "qcm", make: makeLastSyllable },
  "mot-syllabe": { label: "Mot qui commence par une syllabe", type: "qcm", make: makeWordFromSyllable },
  "syllabes-compter": { label: "Compter les syllabes", type: "qcm", make: makeSyllableCount },
  "lettres-compter": { label: "Compter les lettres", type: "qcm", make: makeLetterCount },
  "syllabe-manquante": { label: "Syllabe qui manque", type: "fill-blank", make: makeMissingSyllable },
  "lettre-manquante": { label: "Lettre qui manque", type: "fill-blank", make: makeMissingLetter },
  "phrase-trou": { label: "Phrase à trou", type: "fill-blank", make: makeSentenceGap },
  "syllabe-mot": { label: "Relier une syllabe et un mot", type: "match", make: makeSyllableToWord },
  "mot-image": { label: "Relier un mot et son image", type: "match", make: makeWordToPicture },
  "compter-emojis": { label: "Compter des dessins", type: "qcm", make: makeCountEmojis },
  "ajouter-emojis": { label: "Ajouter des dessins", type: "qcm", make: makeAddEmojis },
  "enlever-emojis": { label: "Enlever des dessins", type: "qcm", make: makeTakeAwayEmojis },
} as const satisfies Record<
  string,
  { label: string; type: GameExerciseType; make: (ctx: GameContext) => GeneratedGame }
>;

export type GameKind = keyof typeof GAME_KINDS;

/** « Trois frises de couleurs » : ce qu'une thématique demande à chaque palier. */
export type GameSpec = {
  kind: GameKind;
  count: number;
  /** Pour les gabarits de mots : « mots-2 », les mots vus jusqu'au deuxième palier de lecture. */
  vocabulary?: string;
};

export function isGameKind(value: unknown): value is GameKind {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(GAME_KINDS, value);
}

/** Combien d'exercices de jeu un palier recevra : jamais plus que le palier. */
export function gameCount(specs: readonly GameSpec[] | undefined): number {
  const total = (specs ?? []).reduce((sum, spec) => sum + Math.max(0, Math.floor(spec.count)), 0);
  return Math.min(PALIER_SIZE, total);
}

/**
 * Le contrôle d'un gabarit avant de le servir : `true` quand l'exercice peut
 * partir. Posé par la génération d'un palier (`paliers/index.ts`), qui y met le
 * contrôleur structurel (`exerciseAudit.ts`).
 */
export type GameAccept = (game: GeneratedGame) => boolean;

/** Les types des gabarits : le contrôleur est fait pour eux, pas pour les quatre jeux (frise, dessin, écoute, couleurs). */
const TEMPLATE_TYPES: readonly GameExerciseType[] = ["qcm", "order", "match", "fill-blank"];

/** Combien de fois refaire un gabarit refusé, avec une autre graine, avant de l'abandonner. */
export const TEMPLATE_RETRIES = 4;

export type GameRunOptions = {
  klass: VisibleClassName;
  palierIndex: number;
  palierCount: number;
  /** La graine : la même graine refait les mêmes exercices. */
  seed: string;
  /**
   * Refuse un gabarit fautif : il est refait avec une autre graine
   * (`TEMPLATE_RETRIES` fois au plus), puis abandonné. Un palier peut alors
   * compter moins de jeux que demandé, et le modèle écrit la différence. Ne juge
   * que les gabarits : les quatre jeux ne passent pas par là.
   */
  accept?: GameAccept;
};

/**
 * Fabrique un exercice, et le refait avec une autre graine tant que `accept`
 * le refuse. La première graine est celle d'avant : sans refus, rien ne change.
 */
function makeAccepted(make: (suffix: string) => GeneratedGame, accept: GameAccept | undefined): GeneratedGame | null {
  let game = make("");
  if (!accept || !TEMPLATE_TYPES.includes(game.type) || accept(game)) return game;
  for (let retry = 1; retry <= TEMPLATE_RETRIES; retry++) {
    game = make(`:r${retry}`);
    if (accept(game)) return game;
  }
  return null;
}

/**
 * Les exercices de jeu d'un palier, dans l'ordre des jeux demandés. Le palier
 * les mêle ensuite aux exercices du modèle (`interleave`).
 */
export function generateGames(specs: readonly GameSpec[], opts: GameRunOptions): GeneratedGame[] {
  const level = gameLevel(opts.palierIndex, opts.palierCount);
  const used = new Set<string>();
  const out: GeneratedGame[] = [];
  let n = 0;
  for (const spec of specs) {
    if (!isGameKind(spec.kind)) continue;
    for (let i = 0; i < spec.count && out.length < PALIER_SIZE; i++) {
      const seed = `${opts.seed}:${spec.kind}:${n++}`;
      const game = makeAccepted(
        (suffix) => GAME_KINDS[spec.kind].make(makeContext(opts.klass, level, `${seed}${suffix}`, used, spec.vocabulary)),
        opts.accept,
      );
      if (game) out.push(game);
    }
  }
  return out;
}

/**
 * UNE VARIATION D'UN JEU RATÉ, sans le modèle : le même jeu, au même
 * niveau, avec une autre graine. `null` quand l'exercice ne vient pas d'un
 * jeu (le modèle s'en charge alors), d'un jeu disparu du catalogue, ou d'un
 * gabarit que `accept` a refusé à chaque tirage.
 */
export function regenerateGame(
  origin: GameOrigin | null | undefined,
  klass: VisibleClassName,
  seed: string,
  accept?: GameAccept,
): GeneratedGame | null {
  if (!origin || !isGameKind(origin.kind)) return null;
  const kind = origin.kind;
  const level = Math.min(4, Math.max(1, Math.round(origin.level))) as GameLevel;
  return makeAccepted(
    (suffix) => GAME_KINDS[kind].make(makeContext(klass, level, `${seed}${suffix}`, undefined, origin.vocabulary)),
    accept,
  );
}

/** Le jeu d'origine d'un exercice, lu dans son payload. */
export function gameOriginOf(payload: unknown): GameOrigin | null {
  if (!payload || typeof payload !== "object") return null;
  const game = (payload as { game?: unknown }).game;
  if (!game || typeof game !== "object") return null;
  const { kind, level, vocabulary } = game as { kind?: unknown; level?: unknown; vocabulary?: unknown };
  if (typeof kind !== "string" || typeof level !== "number") return null;
  return typeof vocabulary === "string" ? { kind, level, vocabulary } : { kind, level };
}

/**
 * Mêle deux listes sans que les jeux s'agglutinent à la fin : un palier
 * de six exercices du modèle et quatre jeux alterne les deux, en gardant
 * l'ordre de chaque liste (la difficulté du modèle croît d'un exercice à
 * l'autre).
 */
export function interleave<T>(first: readonly T[], second: readonly T[]): T[] {
  if (first.length === 0) return [...second];
  if (second.length === 0) return [...first];
  const out: T[] = [];
  const total = first.length + second.length;
  let i = 0;
  let j = 0;
  for (let k = 0; k < total; k++) {
    // On prend dans la liste la plus « en retard » sur sa part du palier.
    const firstDue = (i + 1) / first.length;
    const secondDue = (j + 1) / second.length;
    if (j >= second.length || (i < first.length && firstDue <= secondDue)) out.push(first[i++]);
    else out.push(second[j++]);
  }
  return out;
}
