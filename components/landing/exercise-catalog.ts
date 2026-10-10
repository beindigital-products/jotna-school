/**
 * LES EXERCICES DE CHAQUE MATIÈRE — ce que la section « Exercices » de la
 * vitrine montre.
 *
 * Pour chaque matière : les types d'exercice qu'on y trouve vraiment, et un
 * exemple court, propre à la matière, que la carte joue sous les yeux du
 * visiteur. Rien ici n'est promis à la légère : un test
 * (`__tests__/exercise-catalog.test.ts`) compare ce catalogue à ce que le
 * serveur fait.
 *
 * - LES EXERCICES CLASSIQUES sont ceux que le modèle a le droit d'écrire pour
 *   la matière : la ligne « Types autorisés » de sa consigne
 *   (`convex/paliers/prompts.ts`). En mathématiques, pas de phrase à trous.
 * - LES JEUX sont ceux que le code fabrique (`convex/paliers/games`) : une
 *   matière n'en montre que si une de ses thématiques en demande
 *   (`convex/programme`, champ `games`). Aujourd'hui les mathématiques, la
 *   géographie et l'éducation artistique.
 *
 * Ajouter un jeu à une thématique, ou un type d'exercice à une matière, fait
 * donc échouer le test jusqu'à ce que la vitrine le montre.
 *
 * MODULE DE DONNÉES : ni JSX ni logique. Les aperçus animés sont dans
 * `exercise-previews.tsx`, la mise en page dans `exercise-types.tsx`.
 */
import type { ExerciseType } from "@/convex/exerciseTypes";
import type { ProgrammeSubjectKey } from "@/convex/programme/types";

/**
 * Le nom d'un type d'exercice, vérifié à la compilation : si le serveur le
 * supprime ou le renomme (`convex/exerciseTypes.ts`), `K<"qcm">` ne compile
 * plus et la vitrine ne peut pas continuer à le montrer.
 */
type K<T extends ExerciseType> = T;

/** Une pastille de peinture : même nom et même couleur que dans le jeu. */
export type Swatch = { name: string; color: string };

/** Ce que joue l'aperçu d'une carte : un exemple court, avec la bonne réponse. */
export type Example =
  | { kind: K<"qcm">; question: string; options: [string, string, string, string]; correct: number }
  | { kind: K<"drag-drop">; zone: string; items: [string, string] }
  | { kind: K<"match">; pairs: [[string, string], [string, string]] }
  | { kind: K<"order">; items: string[] }
  | { kind: K<"short-answer">; question: string; answer: string }
  | {
      kind: K<"fill-blank">;
      before: string;
      after: string;
      options: [string, string, string];
      correct: number;
    }
  | { kind: K<"pattern">; sequence: (string | null)[]; options: [string, string, string]; answer: string }
  | { kind: K<"pixel-art">; variant: "copy" | "symmetry" }
  | { kind: K<"listen">; options: [string, string]; correct: number }
  | { kind: K<"color-mix">; a: Swatch; b: Swatch; result: Swatch };

export type TypeInfo = {
  /** La pastille de la carte. */
  label: string;
  title: string;
  /** La phrase par défaut ; une matière peut la préciser (`CatalogEntry.description`). */
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

export type CatalogEntry = {
  example: Example;
  /** Remplace la phrase du type quand la matière en fait un usage plus précis. */
  description?: string;
};

export type SubjectCatalog = {
  /** L'en-tête du panneau : ce qu'on fait concrètement dans cette matière. */
  practice: string;
  /** Les exercices que le modèle écrit, dans l'ordre d'affichage. */
  exercises: CatalogEntry[];
  /** Les jeux que le code fabrique ; vide quand la matière n'en a pas. */
  games: CatalogEntry[];
};

const BLUE: Swatch = { name: "bleu", color: "#3b82f6" };
const YELLOW: Swatch = { name: "jaune", color: "#facc15" };
const GREEN: Swatch = { name: "vert", color: "#22c55e" };

// Les exemples viennent du programme (`convex/programme`) : les titres des rois,
// le drapeau, les instruments, le vocabulaire d'anglais. Ils tiennent dans la
// carte d'un téléphone (270 px de large) : des mots courts, pas de phrase longue.
export const CATALOG: Record<ProgrammeSubjectKey, SubjectCatalog> = {
  francais: {
    practice: "Lire, conjuguer, accorder, remettre une phrase dans l'ordre.",
    exercises: [
      {
        example: {
          kind: "qcm",
          question: "Quel mot est un verbe ?",
          options: ["courir", "table", "rouge", "petit"],
          correct: 0,
        },
      },
      { example: { kind: "drag-drop", zone: "Verbes", items: ["chanter", "manger"] } },
      {
        example: {
          kind: "match",
          pairs: [
            ["grand", "petit"],
            ["jour", "nuit"],
          ],
        },
      },
      { example: { kind: "order", items: ["Le", "chat", "dort"] } },
      { example: { kind: "short-answer", question: "Le contraire de « froid » ?", answer: "chaud" } },
      {
        example: {
          kind: "fill-blank",
          before: "Hier, Modou",
          after: "au marché.",
          options: ["est allé", "va", "ira"],
          correct: 0,
        },
      },
    ],
    games: [],
  },

  mathematiques: {
    practice:
      "Calculer avec des signes et avec des mots, résoudre des problèmes, compléter des suites, dessiner une symétrie.",
    // Pas de phrase à trous : un calcul à trou s'écrit en réponse courte, que le
    // serveur vérifie par le calcul (`MATH_TYPES_LIST`, `convex/paliers/prompts.ts`).
    exercises: [
      {
        example: {
          kind: "qcm",
          question: "6 × 7 = ?",
          options: ["42", "36", "48", "13"],
          correct: 0,
        },
      },
      { example: { kind: "drag-drop", zone: "Nombres pairs", items: ["8", "14"] } },
      {
        example: {
          kind: "match",
          pairs: [
            ["3 × 4", "12"],
            ["20 ÷ 4", "5"],
          ],
        },
      },
      { example: { kind: "order", items: ["3", "7", "12"] } },
      { example: { kind: "short-answer", question: "Combien font 9 × 5 ?", answer: "45" } },
    ],
    games: [
      {
        example: {
          kind: "pattern",
          sequence: ["5", "10", "15", null],
          options: ["20", "17", "25"],
          answer: "20",
        },
        description: "Compléter une suite de nombres ou une frise de formes.",
      },
      {
        example: { kind: "pixel-art", variant: "symmetry" },
        description: "Reproduire une figure ou compléter une symétrie, case par case.",
      },
    ],
  },

  "eveil-scientifique": {
    practice: "Classer des animaux, suivre les étapes d'une vie, comprendre le corps et la santé.",
    exercises: [
      {
        example: {
          kind: "qcm",
          question: "Quel organe pompe le sang ?",
          options: ["Le cœur", "Les poumons", "L'estomac", "Le foie"],
          correct: 0,
        },
      },
      { example: { kind: "drag-drop", zone: "Animaux", items: ["lion", "poisson"] } },
      {
        example: {
          kind: "match",
          pairs: [
            ["abeille", "miel"],
            ["vache", "lait"],
          ],
        },
      },
      { example: { kind: "order", items: ["Graine", "Pousse", "Fleur"] } },
      { example: { kind: "short-answer", question: "Combien de pattes a un insecte ?", answer: "6" } },
      {
        example: {
          kind: "fill-blank",
          before: "On se lave les mains avec du",
          after: ".",
          options: ["savon", "sable", "sel"],
          correct: 0,
        },
      },
    ],
    games: [],
  },

  histoire: {
    practice: "Remettre des événements dans l'ordre, associer un roi à son royaume, situer les grandes dates.",
    exercises: [
      {
        example: {
          kind: "qcm",
          question: "Quel est le titre du roi du Cayor ?",
          options: ["Damel", "Teigne", "Bourba", "Brak"],
          correct: 0,
        },
      },
      { example: { kind: "drag-drop", zone: "Aujourd'hui", items: ["téléphone", "ordinateur"] } },
      {
        example: {
          kind: "match",
          pairs: [
            ["Teigne", "Baol"],
            ["Bourba", "Djolof"],
          ],
        },
      },
      { example: { kind: "order", items: ["Hier", "Aujourd'hui", "Demain"] } },
      { example: { kind: "short-answer", question: "Premier président du Sénégal ?", answer: "Senghor" } },
      {
        example: {
          kind: "fill-blank",
          before: "Indépendance du Sénégal en",
          after: ".",
          options: ["1960", "1895", "1914"],
          correct: 0,
        },
      },
    ],
    games: [],
  },

  geographie: {
    practice: "Se repérer, classer des régions et des activités, lire une carte.",
    exercises: [
      {
        example: {
          kind: "qcm",
          question: "Quelle est la capitale du Sénégal ?",
          options: ["Dakar", "Thiès", "Touba", "Kaolack"],
          correct: 0,
        },
      },
      { example: { kind: "drag-drop", zone: "Au bord de la mer", items: ["pirogue", "poisson"] } },
      {
        example: {
          kind: "match",
          pairs: [
            ["Saint-Louis", "Nord"],
            ["Ziguinchor", "Sud"],
          ],
        },
      },
      { example: { kind: "order", items: ["Village", "Région", "Pays"] } },
      { example: { kind: "short-answer", question: "Quel océan borde le Sénégal ?", answer: "Atlantique" } },
      {
        example: {
          kind: "fill-blank",
          before: "Le soleil se lève à l'",
          after: ".",
          options: ["est", "ouest", "nord"],
          correct: 0,
        },
      },
    ],
    games: [
      {
        example: { kind: "pixel-art", variant: "copy" },
        description: "Se repérer sur un quadrillage et reproduire un dessin, case par case.",
      },
    ],
  },

  "instruction-civique": {
    practice: "Choisir le bon comportement, connaître les symboles et les institutions de la République.",
    exercises: [
      {
        example: {
          kind: "qcm",
          question: "Le feu est rouge. Que fait-on ?",
          options: ["On s'arrête", "On traverse", "On court", "On crie"],
          correct: 0,
        },
      },
      { example: { kind: "drag-drop", zone: "À faire", items: ["dire merci", "faire la queue"] } },
      {
        example: {
          kind: "match",
          pairs: [
            ["Président", "chef de l'État"],
            ["Député", "vote les lois"],
          ],
        },
      },
      { example: { kind: "order", items: ["Stop", "Regarde", "Traverse"] } },
      {
        example: {
          kind: "short-answer",
          question: "Comment s'appelle l'hymne national ?",
          answer: "Le Lion rouge",
        },
      },
      {
        example: {
          kind: "fill-blank",
          before: "Le drapeau est vert, or et",
          after: ".",
          options: ["rouge", "bleu", "blanc"],
          correct: 0,
        },
      },
    ],
    games: [],
  },

  "education-artistique": {
    practice:
      "Questions sur les instruments et les techniques, et des jeux de couleurs, de dessin, de rythmes et d'écoute.",
    exercises: [
      {
        example: {
          kind: "qcm",
          question: "Quel instrument est à cordes ?",
          options: ["La kora", "Le tam-tam", "La flûte", "Le balafon"],
          correct: 0,
        },
      },
      { example: { kind: "drag-drop", zone: "Instruments à vent", items: ["flûte", "trompette"] } },
      {
        example: {
          kind: "match",
          pairs: [
            ["tambour", "🥁"],
            ["pinceau", "🎨"],
          ],
        },
      },
      { example: { kind: "order", items: ["Plier", "Découper", "Coller"] } },
      { example: { kind: "short-answer", question: "Instrument à 21 cordes du griot ?", answer: "kora" } },
      {
        example: {
          kind: "fill-blank",
          before: "Le tam-tam est un instrument de",
          after: ".",
          options: ["percussion", "cordes", "vent"],
          correct: 0,
        },
      },
    ],
    games: [
      {
        example: {
          kind: "pattern",
          sequence: ["🔴", "🟡", "🔴", "🟡", "🔴", null],
          options: ["🟡", "🔴", "🟢"],
          answer: "🟡",
        },
        description: "Compléter une frise de couleurs, de formes, d'images ou de rythmes.",
      },
      {
        example: { kind: "pixel-art", variant: "copy" },
        description:
          "Reproduire un modèle, le dessiner de mémoire, compléter une symétrie ou colorier selon les numéros.",
      },
      { example: { kind: "listen", options: ["Grave", "Aigu"], correct: 1 } },
      { example: { kind: "color-mix", a: BLUE, b: YELLOW, result: GREEN } },
    ],
  },

  anglais: {
    practice:
      "Associer un mot à son image, compléter une phrase, remettre des mots dans l'ordre. Les consignes restent en français.",
    exercises: [
      {
        example: {
          kind: "qcm",
          question: "« rouge » en anglais ?",
          options: ["red", "blue", "green", "yellow"],
          correct: 0,
        },
      },
      { example: { kind: "drag-drop", zone: "Fruits", items: ["apple", "mango"] } },
      {
        example: {
          kind: "match",
          pairs: [
            ["dog", "🐶"],
            ["apple", "🍎"],
          ],
        },
      },
      { example: { kind: "order", items: ["I", "like", "rice"] } },
      { example: { kind: "short-answer", question: "« bleu » en anglais ?", answer: "blue" } },
      {
        example: {
          kind: "fill-blank",
          before: "I",
          after: "eight years old.",
          options: ["am", "have", "is"],
          correct: 0,
        },
      },
    ],
    games: [],
  },
};
