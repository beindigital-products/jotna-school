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

/** Les quatre jeux fabriqués par le code, comme les nomme `exerciseTypes.ts`. */
export type GameExerciseType = "pattern" | "pixel-art" | "listen" | "color-mix";

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
};

export function makeContext(
  klass: VisibleClassName,
  level: GameLevel,
  seed: string,
  used: Set<string> = new Set(),
): GameContext {
  return { klass, band: ageBand(klass), level, rng: seededRandom(seed), used };
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
