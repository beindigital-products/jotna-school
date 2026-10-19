/**
 * LES TYPES D'EXERCICE — la liste unique, lue par le schéma, les mutations,
 * la génération et les écrans.
 *
 * Elle était recopiée dans chaque validateur (`schema.ts`, `exercises.ts`,
 * `paliers/index.ts`) : un type ajouté à l'un et oublié dans l'autre ne se
 * voit qu'au premier exercice refusé. Ajouter un type se fait ICI, puis dans
 * `paliers/exerciseRules.ts` (le juger, le montrer sans sa réponse) et dans
 * les écrans qui le dessinent. L'import de PDF (`pdfUploads.ts`,
 * `exercises.createDrafts`) garde à dessein les cinq types classiques : c'est
 * tout ce que son extraction sait produire.
 *
 * DEUX FAMILLES.
 *
 * - Les CLASSIQUES, que le modèle sait écrire : QCM, glisser-déposer,
 *   association, remise en ordre, réponse courte, et la phrase à trous.
 * - Les JEUX, que le CODE fabrique (`paliers/games`), jamais le modèle : la
 *   frise à compléter, le dessin sur quadrillage, l'écoute, l'atelier des
 *   couleurs. Une symétrie ou un son se calculent ; demandés au modèle, ils
 *   reviendraient faux une fois sur deux, et personne ne relit un son.
 *
 * Élargir l'union est additif : aucun exercice déjà écrit n'en devient
 * invalide.
 */
import { v, type Infer } from "convex/values";

export const exerciseTypeValidator = v.union(
  v.literal("qcm"),
  v.literal("drag-drop"),
  v.literal("match"),
  v.literal("order"),
  v.literal("short-answer"),
  v.literal("fill-blank"),
  v.literal("pattern"),
  v.literal("pixel-art"),
  v.literal("listen"),
  v.literal("color-mix"),
);

export type ExerciseType = Infer<typeof exerciseTypeValidator>;

export const EXERCISE_TYPES = [
  "qcm",
  "drag-drop",
  "match",
  "order",
  "short-answer",
  "fill-blank",
  "pattern",
  "pixel-art",
  "listen",
  "color-mix",
] as const satisfies readonly ExerciseType[];

/** Ce que le modèle a le droit de rendre dans un palier. */
export const AI_EXERCISE_TYPES = [
  "qcm",
  "drag-drop",
  "match",
  "order",
  "short-answer",
  "fill-blank",
] as const satisfies readonly ExerciseType[];

/** Les jeux fabriqués par le code (`paliers/games`). */
export const GAME_EXERCISE_TYPES = [
  "pattern",
  "pixel-art",
  "listen",
  "color-mix",
] as const satisfies readonly ExerciseType[];

const KNOWN: ReadonlySet<string> = new Set(EXERCISE_TYPES);
const FROM_AI: ReadonlySet<string> = new Set(AI_EXERCISE_TYPES);

export function isExerciseType(value: unknown): value is ExerciseType {
  return typeof value === "string" && KNOWN.has(value);
}

export function isAiExerciseType(value: unknown): value is (typeof AI_EXERCISE_TYPES)[number] {
  return typeof value === "string" && FROM_AI.has(value);
}

/** Le nom d'un type pour un adulte (administration, bulletins). */
export const EXERCISE_TYPE_LABELS: Record<ExerciseType, string> = {
  qcm: "QCM",
  "drag-drop": "Glisser-déposer",
  match: "Associer",
  order: "Ordonner",
  "short-answer": "Réponse courte",
  "fill-blank": "Phrase à trous",
  pattern: "Frise à compléter",
  "pixel-art": "Dessin sur quadrillage",
  listen: "Écoute",
  "color-mix": "Atelier des couleurs",
};
