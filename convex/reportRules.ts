/**
 * LE BULLETIN D'UNE THÉMATIQUE, EN RÈGLES PURES.
 *
 * `reports.generate` le produit quand l'élève franchit la thématique
 * (`palierAttempts.submitPalier`), depuis ses réponses sur les paliers de la
 * thématique. Le score est la part des bonnes réponses parmi les réponses
 * données ; un indice n'est pas une réponse. Les forces et les faiblesses
 * sont des types d'exercice (plus de 80 % de bonnes réponses, moins de
 * 50 %). Une erreur fréquente est un exercice tenté trois fois ou plus avec
 * une majorité de mauvaises réponses.
 *
 * Module pur, sans Convex, testé dans `convex/__tests__/reportRules.test.ts`.
 */

export type ReportExercise = {
  type: string;
  prompt: string;
  /** Les réponses données à l'exercice, toutes tentatives confondues, sans les indices. */
  answers: readonly { isCorrect: boolean }[];
};

export type TopicReportContent = {
  /** 0 à 1. */
  score: number;
  strengths: string[];
  weaknesses: string[];
  frequentMistakes: string[];
};

const EXERCISE_TYPE_LABELS: Record<string, string> = {
  qcm: "Questions à choix multiples",
  "drag-drop": "Glisser-déposer",
  match: "Association",
  order: "Remise en ordre",
  "short-answer": "Réponse courte",
};

export function formatExerciseType(type: string): string {
  return EXERCISE_TYPE_LABELS[type] ?? type;
}

/** Le contenu du bulletin, ou `null` quand l'élève n'a donné aucune réponse. */
export function buildTopicReport(exercises: readonly ReportExercise[]): TopicReportContent | null {
  let total = 0;
  let correct = 0;
  const byType = new Map<string, { correct: number; total: number }>();
  const frequentMistakes = new Set<string>();

  for (const exercise of exercises) {
    const answered = exercise.answers.length;
    if (answered === 0) continue;
    const right = exercise.answers.filter((a) => a.isCorrect).length;
    total += answered;
    correct += right;
    const stats = byType.get(exercise.type) ?? { correct: 0, total: 0 };
    stats.correct += right;
    stats.total += answered;
    byType.set(exercise.type, stats);
    if (answered >= 3 && right / answered < 0.5) frequentMistakes.add(exercise.prompt);
  }
  if (total === 0) return null;

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  for (const [type, stats] of byType) {
    const ratio = stats.correct / stats.total;
    if (ratio > 0.8) strengths.push(formatExerciseType(type));
    else if (ratio < 0.5) weaknesses.push(formatExerciseType(type));
  }

  return {
    score: correct / total,
    strengths,
    weaknesses,
    frequentMistakes: [...frequentMistakes],
  };
}
