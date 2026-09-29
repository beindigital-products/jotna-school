/**
 * LA PROGRESSION D'UN ÉLÈVE, EN RÈGLES PURES.
 *
 * Tout ce que l'enfant voit monter vient d'ici : les points d'aventure (une
 * bonne réponse = un point, cinquante points = un niveau), les étoiles
 * (trois par exercice au plus, dix exercices par palier), la maîtrise d'une
 * thématique. La source est la fin d'un palier : `palierAttempts.submitPalier`
 * résume la tentative (`PalierSummary`), la range sur la tentative, et
 * recalcule la progression de la thématique depuis toutes les tentatives de
 * l'élève dessus. Rien n'est incrémenté à l'aveugle : on recompte toujours
 * depuis la source, donc un rejeu, une réparation ou une reprise ne peuvent
 * pas dériver.
 *
 * Pourquoi ce module existe : la jauge de niveau lisait des compteurs que
 * seul l'ancien flux d'exercices (`attempts.submit`) remplissait. Les
 * paliers ne les touchaient pas ; un élève pouvait valider cinq paliers et
 * rester « niveau 1, 0/50 ».
 *
 * Module pur, sans Convex, testé dans `convex/__tests__/progressionRules.test.ts`.
 */
import {
  MAX_ATTEMPTS_PER_EXERCISE,
  PALIER_SIZE,
  PALIER_VALIDATION_THRESHOLD,
  scoreExerciseFromAttempts,
  scoreToStarsSingle,
} from "./paliers/scoring";

export const EXOS_PER_LEVEL = 50;
export const STARS_PER_EXERCISE = 3;

/** Une bonne réponse est un point d'aventure ; cinquante points, un niveau. */
export function computeLevel(totalCorrectExercises: number): number {
  return Math.floor(Math.max(0, totalCorrectExercises) / EXOS_PER_LEVEL) + 1;
}

export function exosToNextLevel(totalCorrectExercises: number): number {
  return EXOS_PER_LEVEL - (Math.max(0, totalCorrectExercises) % EXOS_PER_LEVEL);
}

/** Une ligne d'`attempts` telle que le résumé la lit. */
export type AttemptRow = {
  attemptNumber: number;
  isCorrect: boolean;
  hintsUsedCount: number;
  timeSpentMs: number;
  submittedAt: number;
};

/** Ce qu'une tentative de palier a produit, rangé sur `palierAttempts`. */
export type PalierSummary = {
  exerciseCount: number;
  /** Exercices résolus (au moins une bonne réponse). */
  correctCount: number;
  /** Exercices résolus à la première réponse. */
  firstTryCount: number;
  /** Exercices résolus sans indice. */
  noHintCount: number;
  hintsUsed: number;
  /** Étoiles de la tentative, trois par exercice au plus. */
  starsTotal: number;
  timeSpentMs: number;
  /** Moyenne sur dix, celle que la validation juge. */
  averageScore: number;
};

/**
 * Résume une tentative de palier depuis les lignes d'essai de chaque
 * exercice. Les lignes d'indice (`attemptNumber: 0`) portent les indices et
 * ne sont pas des essais ; le temps s'additionne sur toutes les lignes.
 */
export function summarizePalier(exercises: readonly (readonly AttemptRow[])[]): PalierSummary {
  const summary: PalierSummary = {
    exerciseCount: exercises.length,
    correctCount: 0,
    firstTryCount: 0,
    noHintCount: 0,
    hintsUsed: 0,
    starsTotal: 0,
    timeSpentMs: 0,
    averageScore: 0,
  };
  let scoreSum = 0;
  for (const rows of exercises) {
    const real = rows.filter((a) => a.attemptNumber > 0);
    const hints = rows.reduce((acc, a) => acc + a.hintsUsedCount, 0);
    summary.hintsUsed += hints;
    summary.timeSpentMs += rows.reduce((acc, a) => acc + Math.max(0, a.timeSpentMs), 0);
    const { score, correctOnAttempt } = scoreExerciseFromAttempts(
      real.map((a, i) => ({
        attemptNumber: a.attemptNumber,
        isCorrect: a.isCorrect,
        hintsUsedCount: i === 0 ? hints : 0,
      })),
    );
    scoreSum += score;
    summary.starsTotal += scoreToStarsSingle(score);
    if (correctOnAttempt !== null) {
      summary.correctCount += 1;
      if (correctOnAttempt === 1) summary.firstTryCount += 1;
      if (hints === 0) summary.noHintCount += 1;
    }
  }
  summary.averageScore = exercises.length > 0 ? scoreSum / exercises.length : 0;
  return summary;
}

/** Une tentative de palier, telle que la progression la lit. */
export type PalierAttemptLike = {
  palierId: string;
  status: string;
  averageScore?: number;
  exerciseCount?: number;
  correctCount?: number;
  hintsUsed?: number;
  starsTotal?: number;
};

/** Une tentative compte quand elle est finie : validée ou manquée. */
export function isFinished(attempt: { status: string }): boolean {
  return attempt.status === "validated" || attempt.status === "failed";
}

/**
 * Les étoiles d'une tentative ancienne, qui n'a pas de résumé : la note
 * moyenne donne l'étoile par exercice, sur un palier plein.
 */
export function starsFallback(attempt: PalierAttemptLike): number {
  if (typeof attempt.starsTotal === "number") return attempt.starsTotal;
  if (typeof attempt.averageScore !== "number") return 0;
  return scoreToStarsSingle(attempt.averageScore) * PALIER_SIZE;
}

/** Le meilleur score d'étoiles par palier : on garde le meilleur, jamais la somme. */
export function bestStarsByPalier(attempts: readonly PalierAttemptLike[]): Map<string, number> {
  const best = new Map<string, number>();
  for (const attempt of attempts) {
    if (!isFinished(attempt)) continue;
    const stars = starsFallback(attempt);
    if (stars > (best.get(attempt.palierId) ?? -1)) best.set(attempt.palierId, stars);
  }
  return best;
}

export function totalStarsOf(attempts: readonly PalierAttemptLike[]): number {
  let total = 0;
  for (const stars of bestStarsByPalier(attempts).values()) total += stars;
  return total;
}

/**
 * La note d'un palier, de une à trois étoiles, depuis ses étoiles exactes :
 * trois quand l'enfant frôle le sans-faute (90 % des étoiles), deux dès le
 * seuil de validation (7 sur 10, soit 70 % arrondi au-dessus), une sinon.
 * L'écran de fin et les étapes du sentier montrent la même.
 */
export function palierStarRating(starsTotal: number, exerciseCount: number): number {
  const maxStars = Math.max(1, exerciseCount) * STARS_PER_EXERCISE;
  const threshold = Math.ceil((PALIER_VALIDATION_THRESHOLD / 10) * maxStars);
  if (starsTotal >= maxStars * 0.9) return 3;
  if (starsTotal >= threshold) return 2;
  return 1;
}

/**
 * Une tentative sans faute : chaque exercice réussi à la première réponse.
 * Un indice n'est pas une faute. Une tentative sans résumé n'en est pas une.
 */
export function isFlawless(attempt: { exerciseCount?: number; firstTryCount?: number }): boolean {
  return (attempt.exerciseCount ?? 0) > 0 && attempt.firstTryCount === attempt.exerciseCount;
}

/** Ce que porte `studentTopicProgress`, recalculé depuis les tentatives d'une thématique. */
export type TopicProgressCounters = {
  completedExercises: number;
  correctExercises: number;
  totalHintsUsed: number;
  /** 0 à 100 : la meilleure moyenne d'un palier validé, en pourcentage. */
  masteryLevel: number;
  /** Les étoiles de la meilleure tentative finie de chaque palier, additionnées. */
  starsEarned: number;
};

export function topicProgressFrom(attempts: readonly PalierAttemptLike[]): TopicProgressCounters {
  const counters: TopicProgressCounters = {
    completedExercises: 0,
    correctExercises: 0,
    totalHintsUsed: 0,
    masteryLevel: 0,
    starsEarned: totalStarsOf(attempts),
  };
  for (const attempt of attempts) {
    if (!isFinished(attempt)) continue;
    counters.completedExercises += attempt.exerciseCount ?? 0;
    counters.correctExercises += attempt.correctCount ?? 0;
    counters.totalHintsUsed += attempt.hintsUsed ?? 0;
    if (attempt.status === "validated" && typeof attempt.averageScore === "number") {
      counters.masteryLevel = Math.max(counters.masteryLevel, Math.round(attempt.averageScore * 10));
    }
  }
  return counters;
}

/** Un exercice est « du premier coup » quand sa première ligne d'essai est juste. */
export function isFirstTry(rows: readonly AttemptRow[]): boolean {
  const first = rows.filter((a) => a.attemptNumber > 0).sort((a, b) => a.attemptNumber - b.attemptNumber)[0];
  return first !== undefined && first.isCorrect;
}

export { MAX_ATTEMPTS_PER_EXERCISE };
