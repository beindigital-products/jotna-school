/**
 * LES RÈGLES DE PROGRESSION — déverrouillage et étoiles.
 *
 * PUR, DONC PARTAGÉ. L'écran a besoin de savoir quelles leçons sont ouvertes
 * pour dessiner le parcours ; le serveur a besoin de la même réponse pour
 * accorder des étoiles. Une règle écrite deux fois est une règle qui finit par
 * dire deux choses — ici elle est écrite une fois, et testée
 * (`convex/__tests__/arabic.test.ts`).
 */

import { v } from "convex/values";
import { ARABIC_LESSONS } from "./curriculum";
import { hifzLessonKey } from "./hifz";

// ---------------------------------------------------------------------------
// Le placement décidé par l'école
// ---------------------------------------------------------------------------

/**
 * Ce que l'école déclare du niveau d'un élève.
 *
 * Le validateur est ici, avec le type, pour la même raison que
 * `moduleCatalog.moduleKeyValidator` : le schéma et les fonctions doivent
 * écrire les MÊMES trois valeurs, et deux listes séparées finissent par
 * diverger d'un accent.
 */
export const placementLevelValidator = v.union(
  v.literal("debutant"),
  v.literal("intermediaire"),
  v.literal("confirme"),
);

export type PlacementLevel = "debutant" | "intermediaire" | "confirme";

/** Les trois niveaux, dans l'ordre, avec ce qu'ils veulent dire pour l'école. */
export const PLACEMENT_LEVELS: readonly {
  key: PlacementLevel;
  label: string;
  hint: string;
}[] = [
  {
    key: "debutant",
    label: "Débutant",
    hint: "Ne connaît pas encore l'alphabet. Commence au début.",
  },
  {
    key: "intermediaire",
    label: "Intermédiaire",
    hint: "Connaît les lettres. Ouvre le parcours aux voyelles et à l'assemblage.",
  },
  {
    key: "confirme",
    label: "Confirmé",
    hint: "Lit déjà l'arabe. Ouvre le parcours jusqu'aux sourates.",
  },
];

/**
 * Où chaque niveau déclaré ouvre le parcours.
 *
 * `debutant` n'ouvre rien de plus : il commence au début, comme tout le monde.
 * `intermediaire` suppose l'alphabet connu et ouvre jusqu'aux voyelles.
 * `confirme` suppose qu'il lit déjà, et ouvre jusqu'aux sourates.
 *
 * On désigne un NIVEAU, pas une leçon précise : ajouter une leçon d'alphabet
 * ne doit pas déplacer silencieusement tous les élèves placés « intermédiaire ».
 */
const LEVEL_ENTRY: Readonly<Record<PlacementLevel, string | null>> = {
  debutant: null,
  intermediaire: "harakat",
  confirme: "coran",
};

/** Ce que l'école a déclaré. Tous les champs sauf `level` sont facultatifs. */
export interface Placement {
  level: PlacementLevel;
  /** La leçon sur laquelle l'élève s'est arrêté, si l'école la connaît. */
  startLessonKey?: string | null;
  /** La sourate qu'il apprend, si l'école la connaît. */
  surahKey?: string | null;
}

function orderOf(lessonKey: string | null | undefined): number {
  if (!lessonKey) return 0;
  return ARABIC_LESSONS.find((lesson) => lesson.key === lessonKey)?.order ?? 0;
}

/** Le rang de la première leçon d'un niveau, ou 0 si le niveau n'existe pas. */
function firstOrderOfLevel(levelKey: string | null): number {
  if (!levelKey) return 0;
  const lesson = ARABIC_LESSONS.find(
    (candidate) => candidate.levelKey === levelKey,
  );
  return lesson?.order ?? 0;
}

/**
 * JUSQU'OÙ le placement ouvre le parcours — un PLANCHER, jamais un plafond.
 *
 * TROIS PROPRIÉTÉS QUI TIENNENT ENSEMBLE, et qu'il faut lire comme un tout :
 *
 *   1. ÇA N'EFFACE RIEN, ET ÇA NE VALIDE RIEN. Un élève placé « confirmé »
 *      n'a pas « fait » l'alphabet : ses leçons d'alphabet restent ouvertes et
 *      NON FAITES, sans étoiles. Les marquer terminées serait écrire en son
 *      nom un travail qu'il n'a pas rendu, et le priver des étoiles qu'il
 *      gagnerait en le faisant vraiment ;
 *
 *   2. LES LEÇONS D'AVANT RESTENT OUVERTES. Un plancher ouvre tout ce qui le
 *      précède, il n'en ferme rien. Un enfant placé trop haut doit pouvoir
 *      redescendre sans qu'un adulte reprenne la main — c'est la seule
 *      rattrapabilité d'un placement faux ;
 *
 *   3. ON PREND LE MAXIMUM des trois indications, parce qu'elles disent la
 *      même chose à trois finesses différentes et qu'une école peut n'en
 *      renseigner qu'une. Une sourate en cours de mémorisation implique qu'on
 *      sait la lire, donc qu'on est au moins à son niveau.
 *
 * C'EST UNE DÉCLARATION D'ADULTE, PAS UNE MESURE. Personne n'a testé cet
 * enfant ici : un directeur a coché une case. Le module lui fait confiance
 * pour ouvrir des portes, jamais pour attribuer un résultat.
 */
export function placementFloorOrder(
  placement: Placement | null | undefined,
): number {
  if (!placement) return 0;
  return Math.max(
    firstOrderOfLevel(LEVEL_ENTRY[placement.level] ?? null),
    orderOf(placement.startLessonKey),
    placement.surahKey ? orderOf(hifzLessonKey(placement.surahKey)) : 0,
  );
}

// ---------------------------------------------------------------------------
// Déverrouillage
// ---------------------------------------------------------------------------

/**
 * Une leçon est ouverte si celle qui la précède est terminée — ou si le
 * placement de l'école la met à portée.
 *
 * SÉQUENTIEL, ET C'EST LE SUJET : on n'assemble pas des lettres qu'on ne sait
 * pas nommer, et on ne lit pas un verset avant de savoir assembler. Ouvrir
 * tout d'emblée laisserait un enfant de six ans choisir Al-Fātiḥa en premier
 * écran, échouer, et conclure qu'il n'y arrive pas.
 *
 * LA PREMIÈRE LEÇON EST TOUJOURS OUVERTE — sans quoi rien ne commence jamais.
 *
 * UNE LEÇON DÉJÀ TERMINÉE RESTE OUVERTE, évidemment : on révise l'alphabet
 * toute l'année, et une leçon qui se referme derrière l'enfant serait une
 * punition pour avoir avancé.
 *
 * `floorOrder` VIENT DU PLACEMENT (`placementFloorOrder`) et vaut 0 par
 * défaut : un élève non placé suit la règle séquentielle seule, qui est celle
 * du module depuis le premier jour.
 */
export function isLessonUnlocked(
  lessonKey: string,
  completedKeys: ReadonlySet<string>,
  floorOrder = 0,
): boolean {
  const index = ARABIC_LESSONS.findIndex((lesson) => lesson.key === lessonKey);
  if (index < 0) return false;
  if (index === 0) return true;
  if (completedKeys.has(lessonKey)) return true;
  if (ARABIC_LESSONS[index].order <= floorOrder) return true;
  return completedKeys.has(ARABIC_LESSONS[index - 1].key);
}

/**
 * La première leçon ouverte et non terminée — le bouton « Continuer ».
 *
 * ON NE RENVOIE PAS UN ÉLÈVE PLACÉ AU DÉBUT DU PARCOURS. Sans le plancher, un
 * enfant placé « confirmé » verrait « Continuer » pointer sur la première
 * leçon d'alphabet : ouverte, non faite, donc techniquement la bonne réponse —
 * et exactement le contraire de ce que son école vient de déclarer. On cherche
 * donc d'abord À PARTIR du plancher, et on ne revient en arrière que si tout
 * ce qui suit est déjà terminé.
 */
export function nextLessonKey(
  completedKeys: ReadonlySet<string>,
  floorOrder = 0,
): string {
  for (const lesson of ARABIC_LESSONS) {
    if (lesson.order < floorOrder) continue;
    if (completedKeys.has(lesson.key)) continue;
    if (isLessonUnlocked(lesson.key, completedKeys, floorOrder)) {
      return lesson.key;
    }
  }
  for (const lesson of ARABIC_LESSONS) {
    if (completedKeys.has(lesson.key)) continue;
    if (isLessonUnlocked(lesson.key, completedKeys, floorOrder)) {
      return lesson.key;
    }
  }
  // Tout est terminé : on renvoie la dernière, pour que « Continuer » mène à
  // une révision plutôt qu'à rien.
  return ARABIC_LESSONS[ARABIC_LESSONS.length - 1].key;
}

/** Ce qu'une tentative vaut, de 0 à 1. */
export interface AttemptValue {
  drill: string;
  itemKey: string;
  correct: boolean;
  score?: number;
}

/**
 * La note d'une leçon : la MEILLEURE tentative de chaque exercice, moyennée.
 *
 * LE MEILLEUR ESSAI, PAS LA MOYENNE DES ESSAIS. Un enfant qui rate trois fois
 * le ع puis le réussit a APPRIS le ع — c'est exactement ce que le module veut
 * obtenir. Moyenner les échecs punirait l'entraînement, donc découragerait de
 * réessayer, qui est tout ce qu'on lui demande de faire.
 *
 * Un exercice est identifié par (famille, item) : prononcer ب et écrire ب sont
 * deux apprentissages, ils comptent deux fois.
 */
export function lessonScore(attempts: readonly AttemptValue[]): number {
  if (attempts.length === 0) return 0;

  const best = new Map<string, number>();
  for (const attempt of attempts) {
    const key = `${attempt.drill}:${attempt.itemKey}`;
    const value =
      typeof attempt.score === "number"
        ? clamp01(attempt.score)
        : attempt.correct
          ? 1
          : 0;
    const current = best.get(key);
    if (current === undefined || value > current) best.set(key, value);
  }

  let total = 0;
  for (const value of best.values()) total += value;
  return total / best.size;
}

/**
 * Les étoiles d'une leçon, de 1 à 3.
 *
 * JAMAIS ZÉRO POUR QUI A TERMINÉ. Une leçon finie vaut au moins une étoile :
 * l'enfant a écouté, répété, tracé. Le zéro est réservé à ce qui n'a pas été
 * commencé, et c'est ce que l'absence de ligne dit déjà.
 */
export function starsFor(score: number): 1 | 2 | 3 {
  if (score >= 0.9) return 3;
  if (score >= 0.7) return 2;
  return 1;
}

function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}
