/**
 * CE QU'UNE MATIÈRE PROPOSE, CLASSE PAR CLASSE — la table qui décide des
 * cartes de la section « Exercices » de la vitrine.
 *
 * - LES EXERCICES CLASSIQUES : ceux que le modèle a le droit d'écrire pour la
 *   matière (la ligne « Types autorisés » de sa consigne,
 *   `convex/paliers/prompts.ts`), sauf la réponse courte au CI, où l'enfant ne
 *   sait pas encore écrire au clavier (`readingLearnerRules`). Le modèle n'écrit
 *   pas de phrase à trous en mathématiques : un calcul à trou s'y écrit en
 *   réponse courte, que le serveur vérifie par le calcul. Un gabarit n'est pas
 *   le modèle : les petits problèmes du CI en servent une (`probleme-question`,
 *   le trou est un mot), que la vitrine ne montre pas, puisqu'elle liste ce que
 *   le modèle écrit.
 * - LES JEUX : ceux que le programme demande aux thématiques de CETTE classe
 *   (`games`, `convex/programme`) : les quatre jeux (frises, dessin, écoute,
 *   couleurs) ET les gabarits du code, ces exercices à vocabulaire fermé que le
 *   modèle ne sait pas écrire sans erreur (syllabes, lettres, dessins à compter). Un jeu qui n'existe pas à une classe ne se
 *   montre pas à cette classe : un CM1 n'a pas de frise de nombres, un
 *   élève de géographie n'a de dessin sur quadrillage qu'au CI.
 *
 * LA TABLE DES JEUX EST ÉCRITE ICI plutôt que lue dans `convex/programme` : ce
 * programme pèse plusieurs centaines de kilo-octets de descriptions, et la
 * vitrine n'a besoin que des noms. Un test la recalcule depuis le programme
 * (`__tests__/demo-matrix.test.ts`) : elle ne peut pas s'en écarter.
 *
 * MODULE LÉGER (voir `demo-types.ts`).
 */
import type { GameKind } from "@/convex/paliers/games";
import type { ClassicType, DemoClass, DemoSubject, GameType, TemplateType } from "./demo-types";

/** Un jeu d'une classe : ses variantes, chacune avec la thématique qui la demande. */
export type GameOffer = {
  type: GameType | TemplateType;
  /** `vocabulary` : le vocabulaire ou le plafond de la fiche (« mots-2 », « nombres-10 »), le même que dans le programme. */
  options: { kind: GameKind; topic: string; vocabulary?: string }[];
};

const ALL_CLASSIC: readonly ClassicType[] = [
  "qcm",
  "drag-drop",
  "match",
  "order",
  "short-answer",
  "fill-blank",
];

const NO_FILL_BLANK: readonly ClassicType[] = ALL_CLASSIC.filter((type) => type !== "fill-blank");

/** Les exercices classiques de chaque matière, tous classes confondues. */
export const CLASSIC_BY_SUBJECT: Record<DemoSubject, readonly ClassicType[]> = {
  francais: ALL_CLASSIC,
  mathematiques: NO_FILL_BLANK,
  "eveil-scientifique": ALL_CLASSIC,
  histoire: ALL_CLASSIC,
  geographie: ALL_CLASSIC,
  "instruction-civique": ALL_CLASSIC,
  "education-artistique": ALL_CLASSIC,
  anglais: ALL_CLASSIC,
};

/** Les jeux de chaque matière et de chaque classe. Une classe absente n'en a pas. */
export const GAMES_BY_SUBJECT: Record<DemoSubject, Partial<Record<DemoClass, GameOffer[]>>> = {
  francais: {
    CI: [
      { type: "qcm", options: [{ kind: "lettre-initiale", topic: "Les sons a, i, o, l, t", vocabulary: "mots-1" }, { kind: "syllabes-compter", topic: "Les sons a, i, o, l, t", vocabulary: "mots-1" }, { kind: "syllabe-initiale", topic: "Les sons a, i, o, l, t", vocabulary: "mots-1" }, { kind: "syllabe-finale", topic: "Les sons a, i, o, l, t", vocabulary: "mots-1" }, { kind: "lettres-compter", topic: "Les sons a, i, o, l, t", vocabulary: "mots-1" }, { kind: "mot-syllabe", topic: "Les sons n, e, p, d, m, b", vocabulary: "mots-2" }] },
      { type: "fill-blank", options: [{ kind: "syllabe-manquante", topic: "Les sons a, i, o, l, t", vocabulary: "mots-1" }, { kind: "phrase-trou", topic: "Les sons a, i, o, l, t", vocabulary: "mots-1" }, { kind: "lettre-manquante", topic: "Les sons n, e, p, d, m, b", vocabulary: "mots-2" }] },
      { type: "order", options: [{ kind: "lettres-ordre", topic: "Les sons a, i, o, l, t", vocabulary: "mots-1" }, { kind: "syllabes-ordre", topic: "Les sons n, e, p, d, m, b", vocabulary: "mots-2" }] },
      { type: "match", options: [{ kind: "syllabe-mot", topic: "Les sons n, e, p, d, m, b", vocabulary: "mots-2" }, { kind: "mot-image", topic: "Les sons s, r, au, eau, on, om", vocabulary: "mots-4" }, { kind: "majuscule-minuscule", topic: "Les lettres et les mots", vocabulary: "mots-4" }] },
    ],
  },
  mathematiques: {
    CI: [
      { type: "pattern", options: [{ kind: "frise-formes", topic: "Trier et ranger" }, { kind: "frise-couleurs", topic: "Trier et ranger" }, { kind: "suite-nombres", topic: "Les nombres jusqu'à 10", vocabulary: "nombres-10" }] },
      { type: "qcm", options: [{ kind: "intrus", topic: "Trier et ranger" }, { kind: "appartient", topic: "Trier et ranger" }, { kind: "couleur-objet", topic: "Trier et ranger" }, { kind: "compter-emojis", topic: "Les nombres jusqu'à 10" }, { kind: "rangee-plus-moins", topic: "Les nombres jusqu'à 10" }, { kind: "nombre-voisin", topic: "Les nombres jusqu'à 10", vocabulary: "nombres-10" }, { kind: "nombre-plus-grand", topic: "Les nombres jusqu'à 10", vocabulary: "nombres-10" }, { kind: "nombre-en-lettres", topic: "Les nombres jusqu'à 10", vocabulary: "nombres-10" }, { kind: "ajouter-emojis", topic: "Ajouter et enlever jusqu'à 10" }, { kind: "enlever-emojis", topic: "Ajouter et enlever jusqu'à 10" }, { kind: "calcul-ecrit", topic: "Ajouter et enlever jusqu'à 10", vocabulary: "nombres-10" }, { kind: "double-moitie", topic: "Ajouter et enlever jusqu'à 10", vocabulary: "nombres-10" }, { kind: "complement", topic: "Ajouter et enlever jusqu'à 10", vocabulary: "nombres-10" }, { kind: "dizaine-unites", topic: "Les nombres de 11 à 20", vocabulary: "nombres-20" }, { kind: "rangee-position", topic: "Gauche, droite, dessus, dessous" }, { kind: "rangee-ordinal", topic: "Gauche, droite, dessus, dessous" }, { kind: "forme-nom", topic: "Les formes et les solides" }, { kind: "forme-coins", topic: "Les formes et les solides" }, { kind: "solide-nom", topic: "Les formes et les solides" }, { kind: "comparer-mesure", topic: "Plus long, plus lourd, plus tard" }, { kind: "moment-journee", topic: "Plus long, plus lourd, plus tard" }, { kind: "jour-voisin", topic: "Plus long, plus lourd, plus tard" }, { kind: "image-compter", topic: "Petits problèmes", vocabulary: "nombres-20" }, { kind: "image-qui", topic: "Petits problèmes", vocabulary: "nombres-20" }, { kind: "tableau-case", topic: "Petits problèmes" }, { kind: "tableau-nombre", topic: "Petits problèmes", vocabulary: "nombres-20" }, { kind: "image-donnee", topic: "Petits problèmes", vocabulary: "nombres-20" }, { kind: "probleme-donnee", topic: "Petits problèmes", vocabulary: "nombres-20" }, { kind: "donnee-inutile", topic: "Petits problèmes", vocabulary: "nombres-20" }, { kind: "probleme-inutile", topic: "Petits problèmes", vocabulary: "nombres-20" }] },
      { type: "order", options: [{ kind: "animaux-ordre", topic: "Trier et ranger" }, { kind: "nombres-ordre", topic: "Les nombres de 11 à 20", vocabulary: "nombres-20" }] },
      { type: "match", options: [{ kind: "nombre-groupe", topic: "Les nombres jusqu'à 10" }] },
      { type: "pixel-art", options: [{ kind: "pixel-copie", topic: "Gauche, droite, dessus, dessous" }] },
      { type: "drag-drop", options: [{ kind: "classer-formes", topic: "Les formes et les solides" }, { kind: "donnee-ou-question", topic: "Petits problèmes", vocabulary: "nombres-20" }] },
    ],
    CP: [
      { type: "pattern", options: [{ kind: "suite-nombres", topic: "Les nombres jusqu'à 50", vocabulary: "nombres-50" }, { kind: "frise-formes", topic: "Lignes, frises et figures" }] },
      { type: "pixel-art", options: [{ kind: "pixel-copie", topic: "Lignes, frises et figures" }] },
    ],
    CE1: [
      // Les fiches de nombres du CE1 fabriquent leurs propres suites (`nombresCe1.ts`, type « fill-blank ») : plus de « pattern ».
      { type: "pixel-art", options: [{ kind: "pixel-copie", topic: "Droites, angles et figures" }] },
    ],
    CE2: [
      { type: "pixel-art", options: [{ kind: "pixel-symetrie", topic: "La symétrie et les solides" }] },
    ],
    CM1: [
      { type: "pixel-art", options: [{ kind: "pixel-copie", topic: "Figures planes et constructions" }] },
    ],
    CM2: [
      { type: "pixel-art", options: [{ kind: "pixel-symetrie", topic: "Symétrie et translation" }] },
    ],
  },
  "eveil-scientifique": {},
  histoire: {},
  geographie: {
    CI: [
      { type: "pixel-art", options: [{ kind: "pixel-copie", topic: "Se repérer sur un quadrillage" }] },
    ],
  },
  "instruction-civique": {},
  "education-artistique": {
    CI: [
      { type: "color-mix", options: [{ kind: "couleurs-reconnaitre", topic: "Les couleurs" }] },
      { type: "pattern", options: [{ kind: "frise-couleurs", topic: "Les couleurs" }, { kind: "frise-formes", topic: "Les formes" }, { kind: "frise-objets", topic: "Frises et guirlandes" }] },
      { type: "pixel-art", options: [{ kind: "pixel-copie", topic: "Les formes" }] },
      { type: "listen", options: [{ kind: "ecoute-hauteur", topic: "Grave ou aigu ?" }, { kind: "ecoute-melodie", topic: "Grave ou aigu ?" }, { kind: "ecoute-duree", topic: "Long ou court, fort ou doux" }, { kind: "ecoute-intensite", topic: "Long ou court, fort ou doux" }] },
    ],
    CP: [
      { type: "color-mix", options: [{ kind: "couleurs-melange", topic: "Mélanger les couleurs" }, { kind: "couleurs-melange-inverse", topic: "Mélanger les couleurs" }, { kind: "couleurs-reconnaitre", topic: "Mélanger les couleurs" }] },
      { type: "pixel-art", options: [{ kind: "pixel-copie", topic: "Les traits et les lignes" }, { kind: "pixel-memoire", topic: "Décorer avec des motifs" }] },
      { type: "pattern", options: [{ kind: "frise-formes", topic: "Les traits et les lignes" }, { kind: "frise-objets", topic: "Décorer avec des motifs" }, { kind: "frise-rythme", topic: "Comptines et rythmes" }] },
      { type: "listen", options: [{ kind: "ecoute-rythme", topic: "Comptines et rythmes" }, { kind: "ecoute-hauteur", topic: "Comptines et rythmes" }] },
    ],
    CE1: [
      { type: "pixel-art", options: [{ kind: "pixel-copie", topic: "Dessiner et reproduire" }, { kind: "pixel-memoire", topic: "Dessiner et reproduire" }, { kind: "pixel-symetrie", topic: "Plier, découper, coller" }] },
      { type: "listen", options: [{ kind: "ecoute-hauteur", topic: "Écouter et comparer les sons" }, { kind: "ecoute-duree", topic: "Écouter et comparer les sons" }, { kind: "ecoute-intensite", topic: "Écouter et comparer les sons" }] },
    ],
    CE2: [
      { type: "pixel-art", options: [{ kind: "coloriage-magique", topic: "Le coloriage magique" }, { kind: "pixel-copie", topic: "Reproduire un modèle" }, { kind: "pixel-memoire", topic: "Reproduire un modèle" }, { kind: "pixel-symetrie", topic: "Reproduire un modèle" }] },
      { type: "color-mix", options: [{ kind: "couleurs-chaudes-froides", topic: "Le coloriage magique" }] },
      { type: "listen", options: [{ kind: "ecoute-melodie", topic: "Les mélodies" }, { kind: "ecoute-pareil", topic: "Les mélodies" }, { kind: "ecoute-motif-rythmique", topic: "L'hymne national et les chants" }] },
    ],
    CM1: [
      { type: "pixel-art", options: [{ kind: "pixel-memoire", topic: "Le dessin de mémoire" }, { kind: "pixel-copie", topic: "Le dessin de mémoire" }] },
      { type: "pattern", options: [{ kind: "frise-formes", topic: "Frises et motifs" }, { kind: "frise-couleurs", topic: "Frises et motifs" }, { kind: "frise-objets", topic: "Frises et motifs" }, { kind: "frise-rythme", topic: "Les rythmes" }] },
      { type: "listen", options: [{ kind: "ecoute-rythme", topic: "Percussions et cordes" }, { kind: "ecoute-motif-rythmique", topic: "Percussions et cordes" }] },
    ],
    CM2: [
      { type: "pixel-art", options: [{ kind: "pixel-symetrie", topic: "Rosaces et symétries" }, { kind: "coloriage-magique", topic: "Rosaces et symétries" }, { kind: "pixel-memoire", topic: "Observer et illustrer" }, { kind: "pixel-copie", topic: "Observer et illustrer" }] },
      { type: "listen", options: [{ kind: "ecoute-melodie", topic: "Les instruments à vent" }, { kind: "ecoute-pareil", topic: "Les instruments à vent" }, { kind: "ecoute-intensite", topic: "Chanter et accompagner" }, { kind: "ecoute-motif-rythmique", topic: "Chanter et accompagner" }] },
    ],
  },
  anglais: {},
};

/** Les exercices classiques qu'une classe a dans cette matière : pas de réponse courte au CI. */
export function classicTypesFor(subject: DemoSubject, klass: DemoClass): ClassicType[] {
  return CLASSIC_BY_SUBJECT[subject].filter((type) => !(klass === "CI" && type === "short-answer"));
}

/** Les jeux qu'une classe a dans cette matière, dans l'ordre du programme. */
export function gamesFor(subject: DemoSubject, klass: DemoClass): GameOffer[] {
  return GAMES_BY_SUBJECT[subject][klass] ?? [];
}
