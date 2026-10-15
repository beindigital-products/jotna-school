/**
 * Ce que tous les jeux partagent : le tirage reproductible, la difficulté,
 * la forme d'un exercice fabriqué.
 *
 * MODULE PUR (voir `types.ts`).
 */
import type { VisibleClassName } from "../../curriculum";
import { difficultyStage } from "../../palierRules";
import { seededRandom } from "../exerciseRules";
import type { GameOrigin } from "./types";

/**
 * Les exercices fabriqués par le code : les quatre jeux (`exerciseTypes.ts`)
 * et les GABARITS, qui rendent un type classique (QCM, ordre, association,
 * phrase à trous) écrit à partir d'un vocabulaire fermé et vérifié
 * (`words.ts`, `counting.ts`). Le modèle de langue se trompait de découpe en
 * syllabes et de somme ; un gabarit ne se trompe pas.
 */
export type GameExerciseType =
  | "pattern"
  | "pixel-art"
  | "listen"
  | "color-mix"
  | "qcm"
  | "order"
  | "match"
  | "fill-blank";

/** Un exercice fabriqué, prêt à rejoindre les exercices du palier. */
export type GeneratedGame = {
  type: GameExerciseType;
  prompt: string;
  /** Le payload complet ; `game` et `concept` y voyagent, jamais montrés à l'enfant. */
  payload: Record<string, unknown> & { game: GameOrigin; concept: string };
  answerKey: string;
  hints: string[];
};

/**
 * L'âge de la classe, en trois tranches : CI-CP (on apprend à lire),
 * CE1-CE2, CM1-CM2. Les jeux s'agrandissent d'une tranche à l'autre.
 */
export type AgeBand = 0 | 1 | 2;

export function ageBand(klass: VisibleClassName): AgeBand {
  if (klass === "CI" || klass === "CP") return 0;
  if (klass === "CE1" || klass === "CE2") return 1;
  return 2;
}

/**
 * La difficulté d'un jeu, de 1 à 4, lue sur la position du palier dans sa
 * thématique : découverte, consolidation, approfondissement, maîtrise
 * (`palierRules.difficultyStage`, la même échelle que la consigne du modèle).
 */
export type GameLevel = 1 | 2 | 3 | 4;

export function gameLevel(palierIndex: number, palierCount: number): GameLevel {
  switch (difficultyStage(palierIndex, palierCount)) {
    case "decouverte":
      return 1;
    case "consolidation":
      return 2;
    case "approfondissement":
      return 3;
    case "maitrise":
      return 4;
  }
}

/** Ce qu'un jeu sait de l'exercice à fabriquer. */
export type GameContext = {
  klass: VisibleClassName;
  band: AgeBand;
  level: GameLevel;
  rng: () => number;
  /**
   * Ce que les exercices précédents du même palier ont déjà pris (un motif,
   * une frise) : deux exercices identiques dans un palier, l'enfant le voit.
   */
  used: Set<string>;
  /** Le vocabulaire d'un gabarit de mots (« mots-2 » : les mots vus jusqu'au deuxième palier de lecture). */
  vocabulary?: string;
};

export function makeContext(
  klass: VisibleClassName,
  level: GameLevel,
  seed: string,
  used: Set<string> = new Set(),
  vocabulary?: string,
): GameContext {
  return { klass, band: ageBand(klass), level, rng: seededRandom(seed), used, vocabulary };
}

/** L'origine à poser dans le payload : de quoi refaire le même gabarit avec une autre graine. */
export function originOf(kind: string, ctx: GameContext): GameOrigin {
  return ctx.vocabulary ? { kind, level: ctx.level, vocabulary: ctx.vocabulary } : { kind, level: ctx.level };
}

export function randomInt(rng: () => number, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

export function pick<T>(rng: () => number, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)];
}

export function shuffle<T>(rng: () => number, items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Tire un élément pas encore pris dans ce palier ; quand tout a servi, on
 * recommence plutôt que d'échouer.
 */
export function pickFresh<T>(
  ctx: GameContext,
  items: readonly T[],
  keyOf: (item: T) => string,
): T {
  const fresh = items.filter((item) => !ctx.used.has(keyOf(item)));
  const chosen = pick(ctx.rng, fresh.length > 0 ? fresh : items);
  ctx.used.add(keyOf(chosen));
  return chosen;
}
