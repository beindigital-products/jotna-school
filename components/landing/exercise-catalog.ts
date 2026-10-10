/**
 * CE QUE LA VITRINE DIT DES EXERCICES : le nom de chaque type d'exercice, et la
 * phrase qui résume ce qu'on fait dans chaque matière.
 *
 * Ce que chaque matière et chaque classe PROPOSE vraiment est dans
 * `demo/demo-matrix.ts` ; les exercices à jouer sont dans `demo/bank/` (écrits
 * à la main) et `demo/make-game.ts` (fabriqués par le code). Ce fichier n'a
 * que des mots.
 *
 * MODULE DE DONNÉES : ni JSX ni logique.
 */
import type { ExerciseType } from "@/convex/exerciseTypes";
import type { ProgrammeSubjectKey } from "@/convex/programme/types";

export type TypeInfo = {
  /** La pastille de la carte. */
  label: string;
  title: string;
  /** La phrase qui explique le type d'exercice sous le titre de la carte. */
  description: string;
};

/** Un type d'exercice, dit pour un adulte. Un nouveau type côté serveur oblige à l'écrire ici. */
export const TYPE_INFO: Record<ExerciseType, TypeInfo> = {
  qcm: {
    label: "QCM",
    title: "Questions à choix multiples",
    description: "Quatre propositions, une bonne réponse. Simple et efficace.",
  },
  "drag-drop": {
    label: "Glisser-déposer",
    title: "Classer par le geste",
    description: "Classer, trier, ranger : chaque étiquette dans la bonne case.",
  },
  match: {
    label: "Association",
    title: "Relier les paires",
    description: "Associer des mots, des images ou des idées qui vont ensemble.",
  },
  order: {
    label: "Mise en ordre",
    title: "Remettre en ordre",
    description: "Chronologie, étapes, mots d'une phrase : dans le bon ordre.",
  },
  "short-answer": {
    label: "Réponse courte",
    title: "Écrire la réponse",
    description: "Écrire la solution : l'orthographe compte.",
  },
  "fill-blank": {
    label: "Phrase à trous",
    title: "Compléter la phrase",
    description: "Choisir le mot qui manque pour que la phrase soit juste.",
  },
  pattern: {
    label: "Suites et frises",
    title: "Continuer la suite",
    description: "Compléter une frise ou une suite de nombres.",
  },
  "pixel-art": {
    label: "Dessin",
    title: "Dessiner sur quadrillage",
    description: "Reproduire un modèle ou compléter une symétrie, case par case.",
  },
  listen: {
    label: "Écoute",
    title: "Écouter et reconnaître",
    description: "Grave ou aigu, long ou court, fort ou doux, rythmes et mélodies.",
  },
  "color-mix": {
    label: "Couleurs",
    title: "L'atelier des couleurs",
    description: "Reconnaître une couleur, mélanger deux couleurs, retrouver un mélange.",
  },
};

/** L'en-tête du panneau d'une matière : ce qu'on y fait concrètement. */
export const SUBJECT_PRACTICE: Record<ProgrammeSubjectKey, string> = {
  francais: "Lire, conjuguer, accorder, remettre une phrase dans l'ordre.",
  mathematiques: "Calculer avec des signes et avec des mots, résoudre des problèmes, compléter des suites, dessiner une symétrie.",
  "eveil-scientifique": "Classer des animaux, suivre les étapes d'une vie, comprendre le corps et la santé.",
  histoire: "Remettre des événements dans l'ordre, associer un roi à son royaume, situer les grandes dates.",
  geographie: "Se repérer, classer des régions et des activités, lire une carte.",
  "instruction-civique": "Choisir le bon comportement, connaître les symboles et les institutions de la République.",
  "education-artistique": "Questions sur les instruments et les techniques, et des jeux de couleurs, de dessin, de rythmes et d'écoute.",
  anglais: "Associer un mot à son image, compléter une phrase, remettre des mots dans l'ordre. Les consignes restent en français.",
};
