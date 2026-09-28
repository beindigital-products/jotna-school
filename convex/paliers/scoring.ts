/**
 * Palier scoring — pure functions, no Convex imports.
 *
 * Decisions: 12, 13, 50, 51, 59.
 *
 *   - Palier size LOCKED to 10 (Decision 50).
 *   - Validation threshold: average >= 7 / 10 (Decision 13).
 *   - Per-exercise score (`computeExerciseScore`):
 *       attempts→correct: 1=10, 2=7, 3=4, 4=1, 5=1, never→0.
 *       Final score = max(0, brut - hintsUsed) (Decision 51).
 *   - failedExerciseIds = exos with score < 7 (Decision 59).
 */

export const PALIER_SIZE = 10;
export const PALIER_VALIDATION_THRESHOLD = 7;
export const MAX_ATTEMPTS_PER_EXERCISE = 5;

export interface AttemptForScoring {
  attemptNumber: number; // 1-based
  isCorrect: boolean;
  hintsUsedCount: number;
}

export interface ExerciseScoreInput {
  /** Final outcome — true if at least one attempt was correct. */
  isCorrect: boolean;
  /** 1..5; the attempt number on which the kid got it right. */
  correctOnAttempt?: number;
  /** Total hints consumed across all attempts on this exo. */
  hintsUsedCount: number;
}

const BASE_SCORE_BY_ATTEMPT: Record<number, number> = {
  1: 10,
  2: 7,
  3: 4,
  4: 1,
  5: 1,
};

/**
 * Compute the 0-10 score for a single exercise given the kid's attempts.
 * Hints are deducted from the base score; floor 0.
 */
export function computeExerciseScore(input: ExerciseScoreInput): number {
  if (!input.isCorrect) return 0;
  const attempt = clampAttempt(input.correctOnAttempt ?? 1);
  const brut = BASE_SCORE_BY_ATTEMPT[attempt] ?? 0;
  return Math.max(0, brut - Math.max(0, input.hintsUsedCount));
}

/**
 * Score a single exercise from its raw attempt history (in chronological order).
 */
export function scoreExerciseFromAttempts(
  attempts: AttemptForScoring[],
): { score: number; correctOnAttempt: number | null } {
  if (attempts.length === 0) {
    return { score: 0, correctOnAttempt: null };
  }
  const sorted = [...attempts].sort((a, b) => a.attemptNumber - b.attemptNumber);
  const firstCorrect = sorted.find((a) => a.isCorrect);
  if (!firstCorrect) {
    return { score: 0, correctOnAttempt: null };
  }
  const totalHints = sorted.reduce((acc, a) => acc + a.hintsUsedCount, 0);
  const score = computeExerciseScore({
    isCorrect: true,
    correctOnAttempt: firstCorrect.attemptNumber,
    hintsUsedCount: totalHints,
  });
  return { score, correctOnAttempt: firstCorrect.attemptNumber };
}

export interface PalierScoreInput {
  /** Per-exercise score (0..10), one entry per exo, expected length = 10. */
  exerciseScores: number[];
  /**
   * Optional aligned exerciseIds, used to compute `failedExerciseIds`
   * (score < 7). Same length as `exerciseScores`.
   */
  exerciseIds?: string[];
}

export interface PalierScoreResult {
  average: number;
  status: "validated" | "failed";
  failedIndices: number[];
  /** Only populated when `exerciseIds` was provided. */
  failedExerciseIds?: string[];
  /** Star representation for kid UI: 0..30 (10 exos × 3 stars). Decision 81. */
  starsTotal: number;
}

/**
 * Compute the palier average + validation status + failed exercise ids.
 *
 * Invariant: if `exerciseScores.length !== PALIER_SIZE`, we still compute the
 * average over whatever was passed (defensive — caller should assert size).
 */
export function computePalierScore(input: PalierScoreInput): PalierScoreResult {
  const scores = input.exerciseScores;
  const sum = scores.reduce((a, b) => a + b, 0);
  const denom = scores.length || 1;
  const average = sum / denom;
  const status: PalierScoreResult["status"] =
    average >= PALIER_VALIDATION_THRESHOLD ? "validated" : "failed";

  const failedIndices: number[] = [];
  scores.forEach((s, i) => {
    if (s < PALIER_VALIDATION_THRESHOLD) failedIndices.push(i);
  });

  let failedExerciseIds: string[] | undefined;
  if (input.exerciseIds) {
    failedExerciseIds = failedIndices.map((i) => input.exerciseIds![i]);
  }

  return {
    average,
    status,
    failedIndices,
    failedExerciseIds,
    starsTotal: scoreToStars(scores),
  };
}

/** Convert a 0..10 raw score per exo to a 0..3 star rating, summed. */
export function scoreToStars(scores: number[]): number {
  return scores.reduce((acc, s) => acc + scoreToStarsSingle(s), 0);
}

export function scoreToStarsSingle(score: number): number {
  if (score >= 9) return 3;
  if (score >= 6) return 2;
  if (score >= 3) return 1;
  return 0;
}

/**
 * UN INDICE N'EST PAS UN ESSAI. `requestHint` pose une ligne d'`attempts`
 * sentinelle (`attemptNumber: 0`) pour que le score déduise l'indice ; le
 * compte des essais et le numéro du suivant ne regardent que les lignes
 * numérotées. Les compter faisait sauter l'enfant de « encore 4 essais » à
 * « encore 2 » après un seul indice, et gonflait le numéro d'essai que la
 * grille de score punit.
 */
export function countRealAttempts(rows: readonly { attemptNumber: number }[]): number {
  let n = 0;
  for (const row of rows) if (row.attemptNumber > 0) n += 1;
  return n;
}

/** Essais restants après `realAttempts` essais joués. Jamais négatif. */
export function attemptsRemainingAfter(realAttempts: number): number {
  return Math.max(0, MAX_ATTEMPTS_PER_EXERCISE - realAttempts);
}

function clampAttempt(n: number): number {
  if (!Number.isFinite(n) || n < 1) return 1;
  if (n > MAX_ATTEMPTS_PER_EXERCISE) return MAX_ATTEMPTS_PER_EXERCISE;
  return Math.floor(n);
}
