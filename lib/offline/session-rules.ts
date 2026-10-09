/**
 * UNE SÉANCE DE PALIER JOUÉE SUR L'APPAREIL — ses règles, pures.
 *
 * La séance est un journal : chaque réponse et chaque indice s'y ajoutent,
 * dans l'ordre. Tout le reste s'en déduit, exactement comme le serveur le
 * déduit de ses lignes d'essai :
 *
 *   - où en est l'enfant (`sessionProgress`), comme
 *     `palierAttempts.getProgressForPalierAttempt` ;
 *   - la note du palier (`gradeSession`), comme
 *     `palierAttempts.finishPalierAttempt` — mêmes fonctions de score
 *     (`convex/paliers/scoring.ts`, `convex/progressionRules.ts`).
 *
 * Le serveur rejouera ce journal à la synchronisation (`convex/offline/sync.ts`)
 * et rejugera chaque réponse : l'appareil et lui arrivent à la même note.
 */
import {
  MAX_ATTEMPTS_PER_EXERCISE,
  PALIER_VALIDATION_THRESHOLD,
  computePalierScore,
  scoreExerciseFromAttempts,
} from "@/convex/paliers/scoring";
import { summarizePalier, type AttemptRow, type PalierSummary } from "@/convex/progressionRules";

/** Une entrée du journal, telle que l'appareil la range. */
export type LocalLogEntry =
  | {
      kind: "answer";
      exerciseId: string;
      answer: string;
      correct: boolean;
      at: number;
      timeSpentMs: number;
    }
  | { kind: "hint"; exerciseId: string; hintIndex: number; at: number };

/** Un geste ne dure pas dix minutes : au-delà, le téléphone était posé (comme le serveur). */
const MAX_TIME_SPENT_MS = 10 * 60_000;

/**
 * Les lignes d'essai d'un exercice, comme le serveur les écrira : les
 * réponses numérotées (cinq au plus), les indices en ligne sentinelle
 * (`attemptNumber: 0`).
 */
export function rowsForExercise(log: readonly LocalLogEntry[], exerciseId: string): AttemptRow[] {
  const rows: AttemptRow[] = [];
  let real = 0;
  for (const entry of log) {
    if (entry.exerciseId !== exerciseId) continue;
    if (entry.kind === "answer") {
      if (real >= MAX_ATTEMPTS_PER_EXERCISE) continue;
      real += 1;
      rows.push({
        attemptNumber: real,
        isCorrect: entry.correct,
        hintsUsedCount: 0,
        timeSpentMs: Math.max(0, Math.min(entry.timeSpentMs, MAX_TIME_SPENT_MS)),
        submittedAt: entry.at,
      });
    } else {
      rows.push({
        attemptNumber: 0,
        isCorrect: false,
        hintsUsedCount: 1,
        timeSpentMs: 0,
        submittedAt: entry.at,
      });
    }
  }
  return rows;
}

export type SessionProgress = {
  currentIndex: number;
  completedCount: number;
  totalCount: number;
  failedAttemptsThisExo: number;
  hintsUsedThisExo: number;
  /** Tous les exercices sont faits (réussis, ou cinq essais épuisés). */
  allDone: boolean;
};

/** Où en est l'enfant : le premier exercice ni réussi ni épuisé. */
export function sessionProgress(
  exerciseIds: readonly string[],
  log: readonly LocalLogEntry[],
): SessionProgress {
  let currentIndex = Math.max(0, exerciseIds.length - 1);
  let completedCount = 0;
  let allDone = true;
  for (let i = 0; i < exerciseIds.length; i++) {
    const real = rowsForExercise(log, exerciseIds[i]).filter((r) => r.attemptNumber > 0);
    const completed = real.some((r) => r.isCorrect) || real.length >= MAX_ATTEMPTS_PER_EXERCISE;
    if (completed) {
      completedCount += 1;
      continue;
    }
    currentIndex = i;
    allDone = false;
    break;
  }
  const rows = exerciseIds.length > 0 ? rowsForExercise(log, exerciseIds[currentIndex]) : [];
  return {
    currentIndex,
    completedCount,
    totalCount: exerciseIds.length,
    failedAttemptsThisExo: rows.filter((r) => r.attemptNumber > 0 && !r.isCorrect).length,
    hintsUsedThisExo: rows.reduce((acc, r) => acc + r.hintsUsedCount, 0),
    allDone: exerciseIds.length > 0 && allDone,
  };
}

/** Le nombre d'essais déjà joués sur un exercice (les indices n'en sont pas). */
export function realAttemptsOn(log: readonly LocalLogEntry[], exerciseId: string): number {
  return rowsForExercise(log, exerciseId).filter((r) => r.attemptNumber > 0).length;
}

export type SessionGrade = {
  status: "validated" | "failed";
  average: number;
  starsTotal: number;
  threshold: number;
  exerciseCount: number;
  failedExerciseIds: string[];
  summary: PalierSummary;
};

/** La note du palier, comme `finishPalierAttempt` la calcule. */
export function gradeSession(
  exerciseIds: readonly string[],
  log: readonly LocalLogEntry[],
): SessionGrade {
  const rowsPerExercise = exerciseIds.map((id) => rowsForExercise(log, id));
  const scores = rowsPerExercise.map((rows) => {
    const real = rows.filter((r) => r.attemptNumber > 0);
    const totalHints = rows.reduce((acc, r) => acc + r.hintsUsedCount, 0);
    return scoreExerciseFromAttempts(
      real.map((r, i) => ({
        attemptNumber: r.attemptNumber,
        isCorrect: r.isCorrect,
        hintsUsedCount: i === 0 ? totalHints : 0,
      })),
    ).score;
  });
  const result = computePalierScore({ exerciseScores: scores, exerciseIds: [...exerciseIds] });
  return {
    status: result.status,
    average: result.average,
    starsTotal: result.starsTotal,
    threshold: PALIER_VALIDATION_THRESHOLD,
    exerciseCount: exerciseIds.length,
    failedExerciseIds: result.failedExerciseIds ?? [],
    summary: summarizePalier(rowsPerExercise),
  };
}

/** Le temps passé dans le journal, à partir de l'entrée `from`. */
export function logTimeMs(log: readonly LocalLogEntry[], from = 0): number {
  let total = 0;
  for (let i = from; i < log.length; i++) {
    const entry = log[i];
    if (entry.kind === "answer") total += Math.max(0, Math.min(entry.timeSpentMs, MAX_TIME_SPENT_MS));
  }
  return total;
}
