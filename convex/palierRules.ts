import type { ClassName, VisibleClassName } from "./curriculum";
import { PALIER_SIZE } from "./paliers/scoring";

// ---------------------------------------------------------------------------
// COMBIEN D'ÉTAPES PAR THÉMATIQUE — la règle, en un seul endroit.
//
// Une thématique se joue en PALIERS de dix exercices (`PALIER_SIZE`, verrouillé
// par la décision 50), validés à 7/10. Le nombre de paliers d'une thématique
// était fixé à dix partout — cent exercices sur « Les lettres de l'alphabet »
// pour un enfant de six ans. Ce nombre est désormais DYNAMIQUE : chaque
// thématique peut porter le sien (`topics.palierCount`), et sans valeur
// posée, c'est le défaut de son niveau qui s'applique.
//
// LE DÉFAUT PAR NIVEAU suit l'attention et la profondeur du programme :
//
//   CI, CP    3 paliers  =  30 exercices   découverte, entraînement, maîtrise
//   CE1, CE2  4 paliers  =  40 exercices   + une consolidation
//   CM1, CM2  5 paliers  =  50 exercices   + un approfondissement
//
// Un palier est une séance de dix minutes environ. Trois à cinq séances par
// thématique, c'est une thématique par semaine ou deux, et six thématiques
// par matière et par niveau font vingt à trente séances dans l'année : assez
// pour installer une notion, pas assez pour lasser. Une thématique large
// (« Le présent, le futur et l'imparfait ») peut monter jusqu'à dix depuis
// l'administration ; une thématique étroite peut descendre à deux.
//
// LA DIFFICULTÉ EST RELATIVE AU NOMBRE DE PALIERS. Les consignes de génération
// parlaient d'un palier « 3/10 » ; avec quatre paliers, le troisième est déjà
// un approfondissement. `difficultyStage` place chaque palier sur l'échelle
// découverte → consolidation → approfondissement → maîtrise selon sa position,
// et le dernier palier est toujours celui de la maîtrise.
//
// Module pur, sans Convex : les requêtes, les mutations, l'écran et les tests
// lisent la même règle.
// ---------------------------------------------------------------------------

export const MIN_PALIERS_PER_TOPIC = 1;
export const MAX_PALIERS_PER_TOPIC = 10;

export const DEFAULT_PALIERS_BY_CLASS: Record<VisibleClassName, number> = {
  CI: 3,
  CP: 3,
  CE1: 4,
  CE2: 4,
  CM1: 5,
  CM2: 5,
};

/** Une thématique sans niveau (ancienne donnée) : le milieu de l'échelle. */
export const FALLBACK_PALIER_COUNT = 4;

export function defaultPalierCount(className: ClassName | null | undefined): number {
  if (!className) return FALLBACK_PALIER_COUNT;
  return (
    (DEFAULT_PALIERS_BY_CLASS as Partial<Record<ClassName, number>>)[className] ??
    FALLBACK_PALIER_COUNT
  );
}

/** Un nombre de paliers acceptable : un entier entre 1 et 10. */
export function isValidPalierCount(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= MIN_PALIERS_PER_TOPIC &&
    value <= MAX_PALIERS_PER_TOPIC
  );
}

export type TopicLike = {
  palierCount?: number | null;
  class?: ClassName | null;
};

/** Le nombre d'étapes d'une thématique : sa valeur propre, sinon le défaut du niveau. */
export function effectivePalierCount(topic: TopicLike): number {
  if (isValidPalierCount(topic.palierCount)) return topic.palierCount;
  return defaultPalierCount(topic.class);
}

/** Le nombre d'exercices que la thématique met devant l'enfant. */
export function exercisesForTopic(topic: TopicLike): number {
  return effectivePalierCount(topic) * PALIER_SIZE;
}

export type DifficultyStage =
  | "decouverte"
  | "consolidation"
  | "approfondissement"
  | "maitrise";

/**
 * Où se situe un palier sur l'échelle de difficulté, selon sa position dans
 * la thématique. Le premier est toujours une découverte, le dernier toujours
 * la maîtrise ; entre les deux, la position relative décide. Avec dix
 * paliers, on retrouve exactement l'ancienne grille (1-3, 4-6, 7-9, 10).
 */
export function difficultyStage(palierIndex: number, palierCount: number): DifficultyStage {
  const n = Math.max(1, palierCount);
  const i = Math.min(Math.max(1, palierIndex), n);
  if (i >= n) return "maitrise";
  if (i === 1) return "decouverte";
  const position = i / n;
  if (position <= 0.34) return "decouverte";
  if (position <= 0.67) return "consolidation";
  return "approfondissement";
}

export type PalierStatus = "locked" | "available" | "in_progress" | "completed";

/**
 * L'état de chaque palier d'une thématique, du premier au dernier.
 *
 *   completed    validé au moins une fois
 *   in_progress  une tentative ouverte, pas encore validé
 *   available    le premier, ou le précédent est validé
 *   locked       tout le reste — et tous, si la thématique est fermée
 */
export function resolvePalierStatuses(input: {
  topicLocked: boolean;
  palierCount: number;
  validated: ReadonlySet<number>;
  inProgress: ReadonlySet<number>;
}): PalierStatus[] {
  const statuses: PalierStatus[] = [];
  for (let i = 1; i <= input.palierCount; i++) {
    if (input.topicLocked) statuses.push("locked");
    else if (input.validated.has(i)) statuses.push("completed");
    else if (input.inProgress.has(i)) statuses.push("in_progress");
    else if (i === 1 || input.validated.has(i - 1)) statuses.push("available");
    else statuses.push("locked");
  }
  return statuses;
}

/** Tous les paliers, du premier au dernier, sont validés. */
export function isTopicComplete(validated: ReadonlySet<number>, palierCount: number): boolean {
  if (palierCount < 1) return false;
  for (let i = 1; i <= palierCount; i++) {
    if (!validated.has(i)) return false;
  }
  return true;
}

/** Le prochain palier à jouer : le premier non validé, ou le dernier si tout l'est. */
export function nextPalierIndex(validated: ReadonlySet<number>, palierCount: number): number {
  const n = Math.max(1, palierCount);
  for (let i = 1; i <= n; i++) {
    if (!validated.has(i)) return i;
  }
  return n;
}
