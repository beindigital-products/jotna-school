/**
 * LES FORMES DE LA DÉMONSTRATION de la vitrine : une classe, un type
 * d'exercice, un exercice prêt à jouer.
 *
 * La section « Exercices » de la page d'accueil laisse un parent, un
 * professeur ou une école ESSAYER les exercices de l'élève sans créer de
 * compte : on choisit une matière et une classe, et chaque carte est un vrai
 * exercice, joué avec les écrans de l'application (`components/exercises`),
 * jugé par la même règle (`convex/paliers/exerciseRules.ts`).
 *
 * MODULE LÉGER : que des types et deux petites tables. Il est lu par la
 * vitrine dès le premier affichage ; les écrans, la banque d'exercices et les
 * générateurs de jeux n'arrivent qu'à la demande (`demo-cards.tsx`).
 */
import type { VisibleClassName } from "@/convex/curriculum";
import type { ExerciseType } from "@/convex/exerciseTypes";
import type { ProgrammeSubjectKey } from "@/convex/programme/types";

export type DemoSubject = ProgrammeSubjectKey;

/** Les six classes de l'élémentaire, dans l'ordre scolaire. */
export type DemoClass = VisibleClassName;

export const DEMO_CLASSES = [
  "CI",
  "CP",
  "CE1",
  "CE2",
  "CM1",
  "CM2",
] as const satisfies readonly DemoClass[];

/** L'âge d'un enfant de cette classe : ce qui aide un parent à reconnaître la sienne. */
export const CLASS_AGES: Record<DemoClass, string> = {
  CI: "5-6 ans",
  CP: "6-7 ans",
  CE1: "7-8 ans",
  CE2: "8-9 ans",
  CM1: "9-10 ans",
  CM2: "10-11 ans",
};

/** Les exercices que le modèle écrit (`AI_EXERCISE_TYPES`, `convex/exerciseTypes.ts`). */
export type ClassicType = Extract<
  ExerciseType,
  "qcm" | "drag-drop" | "match" | "order" | "short-answer" | "fill-blank"
>;

/** Les jeux que le code fabrique (`GAME_EXERCISE_TYPES`). */
export type GameType = Extract<ExerciseType, "pattern" | "pixel-art" | "listen" | "color-mix">;

/**
 * La difficulté d'un exercice, sur l'échelle des paliers (`difficultyStage`,
 * `convex/palierRules.ts`) : découverte, consolidation, approfondissement,
 * maîtrise.
 */
export type Stage = 1 | 2 | 3 | 4;

export const STAGE_LABELS: Record<Stage, string> = {
  1: "Découverte",
  2: "Consolidation",
  3: "Approfondissement",
  4: "Maîtrise",
};

/** Un exercice prêt à jouer : ce que la séance de l'élève reçoit, plus de quoi l'étiqueter. */
export type PlayableExercise = {
  /** Sert de graine au mélange des tuiles : le même exercice se remélange pareil. */
  id: string;
  type: ExerciseType;
  prompt: string;
  /** Le payload COMPLET, avec la réponse : l'écran n'en reçoit que la vue (`sanitizePayload`). */
  payload: Record<string, unknown>;
  hints: string[];
  /** La thématique du programme dont l'exercice est un exemple. */
  topic: string;
  stage: Stage;
  /** Un jeu : son nom (« Suite de nombres »). */
  gameLabel?: string;
};

/** Un exercice classique de la banque, écrit à la main pour une matière et une classe. */
export type ClassicItem = {
  type: ClassicType;
  topic: string;
  stage: Stage;
  prompt: string;
  payload: Record<string, unknown>;
  hints: string[];
  /**
   * Mathématiques : l'expression dont la valeur EST la bonne réponse, comme le
   * `mathExpression` que le modèle écrit (`convex/paliers/mathRepair.ts`). Un
   * test la calcule et la compare à la réponse.
   */
  expression?: string;
};

/** Ce que la banque garde d'une matière : un exercice par type et par classe. */
export type SubjectBank = Record<DemoClass, ClassicItem[]>;
