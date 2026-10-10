/**
 * ÉDUCATION ARTISTIQUE — Domaine 4 du CEB (EPSA) : arts plastiques,
 * éducation musicale, arts scéniques. L'éducation physique et sportive, du
 * même domaine, n'est pas servie : elle se pratique dans la cour.
 *
 * C'EST LA MATIÈRE DES JEUX (`paliers/games`). Peindre, écouter un son,
 * dessiner de mémoire ou compléter une symétrie ne se demandent pas au
 * modèle de langue : le code fabrique ces exercices, justes par construction.
 * Chaque thématique dit combien de jeux mettre dans un palier ; le modèle
 * complète avec des questions de connaissance (instruments, émotions,
 * étapes d'un pliage). « Grave ou aigu ? » est tout en jeux : le modèle
 * n'est pas appelé.
 *
 * Répartition des niveaux 1 et 2 entre les classes : comme pour l'ESVS
 * (voir `sciences.ts`).
 */
import type { ProgrammeSubject } from "./types";

export const EDUCATION_ARTISTIQUE: ProgrammeSubject = {
  key: "education-artistique",
  name: "Éducation artistique",
  aliases: ["Arts plastiques", "Éducation musicale", "Education artistique", "Arts", "Dessin"],
  icon: "Palette",
  color: "#ec4899",
  order: 7,
  domain: "Éducation physique, sportive et artistique",
  classes: {
    CI: [
      {
        key: "ar-ci-couleurs",
        name: "Les couleurs",
        description:
          "Arts plastiques, étape 1 : discrimination des couleurs. Reconnaître et nommer le rouge, le jaune, le bleu, le vert, l'orange, le violet, le noir et le blanc ; la couleur des choses (la mangue, le ciel, les feuilles, le drapeau).",
        games: [
          { kind: "couleurs-reconnaitre", count: 4 },
          { kind: "frise-couleurs", count: 2 },
        ],
      },
      {
        key: "ar-ci-formes",
        name: "Les formes",
        description:
          "Arts plastiques, étape 1 : discrimination des formes. Le rond, le carré, le triangle, le rectangle, l'étoile, le cœur ; retrouver une forme dans un objet (la roue est ronde, la fenêtre est carrée).",
        games: [
          { kind: "frise-formes", count: 3 },
          { kind: "pixel-copie", count: 3 },
        ],
      },
      {
        key: "ar-ci-frises",
        name: "Frises et guirlandes",
        description:
          "Arts plastiques, étape 1 : motifs, guirlandes et frises pour décorer ; voir ce qui se répète, continuer une frise, décorer un objet.",
        games: [
          { kind: "frise-couleurs", count: 3 },
          { kind: "frise-objets", count: 3 },
          { kind: "pixel-copie", count: 2 },
        ],
      },
      {
        key: "ar-ci-grave-aigu",
        name: "Grave ou aigu ?",
        description:
          "Éducation musicale, étape 1 : discrimination des sons graves et aigus, et des sons qui montent ou descendent. Uniquement des jeux d'écoute.",
        games: [
          { kind: "ecoute-hauteur", count: 7 },
          { kind: "ecoute-melodie", count: 3 },
        ],
      },
      {
        key: "ar-ci-long-fort",
        name: "Long ou court, fort ou doux",
        description:
          "Éducation musicale, étape 1 : discrimination des sons longs et courts, forts et doux. Uniquement des jeux d'écoute.",
        games: [
          { kind: "ecoute-duree", count: 5 },
          { kind: "ecoute-intensite", count: 5 },
        ],
      },
      {
        key: "ar-ci-mimes",
        name: "Mimes et émotions",
        description:
          "Arts scéniques, étape 1 : imitation, mimes, jeux de rôles et déguisements. Reconnaître une émotion (joie, tristesse, colère, peur, surprise) sur un visage (émoji) ou dans une situation de la vie de l'enfant, choisir le geste ou le visage qui va avec, deviner l'animal ou le métier que l'on mime.",
      },
    ],
    CP: [
      {
        key: "ar-cp-melanges",
        name: "Mélanger les couleurs",
        description:
          "Arts plastiques, étape 1 : peindre. Les trois couleurs primaires (rouge, jaune, bleu) et ce qu'elles donnent mélangées deux à deux (orange, vert, violet) ; le matériel du peintre (pinceau, palette, gobelet d'eau).",
        games: [
          { kind: "couleurs-melange", count: 3 },
          { kind: "couleurs-melange-inverse", count: 3 },
          { kind: "couleurs-reconnaitre", count: 1 },
        ],
      },
      {
        key: "ar-cp-traits",
        name: "Les traits et les lignes",
        description:
          "Arts plastiques, étape 1 : les traits (plein, délié, modulé), les lignes droites, courbes, brisées, en zigzag, en spirale ; dessiner en suivant un modèle.",
        games: [
          { kind: "pixel-copie", count: 4 },
          { kind: "frise-formes", count: 2 },
        ],
      },
      {
        key: "ar-cp-decorer",
        name: "Décorer avec des motifs",
        description:
          "Arts plastiques, étape 1 : décoration d'objets (calebasse, pagne, poterie, case) avec des motifs et des frises ; modeler, peindre, dessiner.",
        games: [
          { kind: "frise-objets", count: 2 },
          { kind: "frise-formes", count: 2 },
          { kind: "pixel-memoire", count: 2 },
          { kind: "pixel-copie", count: 1 },
        ],
      },
      {
        key: "ar-cp-rythmes",
        name: "Comptines et rythmes",
        description:
          "Éducation musicale, étape 1 : comptines, rondes et berceuses ; frapper un rythme, compter les coups, exploration vocale (chanter fort, doucement, aigu, grave).",
        games: [
          { kind: "ecoute-rythme", count: 4 },
          { kind: "frise-rythme", count: 3 },
          { kind: "ecoute-hauteur", count: 1 },
        ],
      },
      {
        key: "ar-cp-roles",
        name: "Jouer un rôle",
        description:
          "Arts scéniques, étape 1 : jeux de rôles et déguisements. Qui fait quoi (le vendeur au marché, le maître, l'infirmière, le pêcheur), quel costume ou quel objet pour quel rôle, imiter un animal.",
      },
    ],
    CE1: [
      {
        key: "ar-ce1-dessin",
        name: "Dessiner et reproduire",
        description:
          "Arts plastiques, étape 2, paliers 1-2 : le dessin et la reproduction d'un modèle ; le matériel (crayon, gomme, règle, crayons de couleur) ; dessiner des objets de la vie courante.",
        games: [
          { kind: "pixel-copie", count: 4 },
          { kind: "pixel-memoire", count: 2 },
        ],
      },
      {
        key: "ar-ce1-pliage",
        name: "Plier, découper, coller",
        description:
          "Arts plastiques, étape 2, paliers 1-2 : découpage, collage, pliage, modelage d'objets de la vie courante, tableaux et maquettes ; les étapes dans l'ordre, le matériel (ciseaux, colle, papier, argile) ; un pliage en deux fait apparaître une symétrie.",
        games: [{ kind: "pixel-symetrie", count: 4 }],
      },
      {
        key: "ar-ce1-instruments",
        name: "Les instruments du Sénégal",
        description:
          "Éducation musicale, étape 2, paliers 1-2 : les instruments locaux et la façon d'en jouer : la kora (on pince ses cordes), le balafon (on frappe ses lames de bois), le tama (petit tambour qu'on serre sous le bras), le sabar et le djembé (tambours qu'on frappe), le riti (vièle à une corde jouée avec un archet), les maracas (on les secoue), la flûte (on souffle). Les chants du folklore local.",
      },
      {
        key: "ar-ce1-sons",
        name: "Écouter et comparer les sons",
        description:
          "Éducation musicale, étape 2 : comparer la hauteur, la durée et l'intensité des sons.",
        games: [
          { kind: "ecoute-hauteur", count: 3 },
          { kind: "ecoute-duree", count: 3 },
          { kind: "ecoute-intensite", count: 2 },
        ],
      },
      {
        key: "ar-ce1-mimes",
        name: "Mimer les sentiments",
        description:
          "Arts scéniques, étape 2, paliers 1-2 : mimes d'attitudes et de sentiments (la joie, la peur, la colère, la fatigue, la honte), jeux de rôles, déguisements ; ce que disent le visage, les mains, la façon de marcher.",
      },
    ],
    CE2: [
      {
        key: "ar-ce2-coloriage",
        name: "Le coloriage magique",
        description:
          "Arts plastiques, étape 2, paliers 3-4 : le coloriage ; les couleurs chaudes (rouge, orange, jaune) et froides (bleu, vert, violet) ; choisir ses couleurs pour donner une ambiance.",
        games: [
          { kind: "coloriage-magique", count: 5 },
          { kind: "couleurs-chaudes-froides", count: 3 },
        ],
      },
      {
        key: "ar-ce2-reproduire",
        name: "Reproduire un modèle",
        description:
          "Arts plastiques, étape 2, paliers 3-4 : les techniques de reproduction (quadrillage, calque, pochoir), la décoration par pliage et collage, la production d'objets décoratifs.",
        games: [
          { kind: "pixel-copie", count: 3 },
          { kind: "pixel-memoire", count: 2 },
          { kind: "pixel-symetrie", count: 2 },
        ],
      },
      {
        key: "ar-ce2-melodies",
        name: "Les mélodies",
        description:
          "Éducation musicale, étape 2, paliers 3-4 : imiter des sons et des mélodies ; une mélodie qui monte, qui descend, deux mélodies pareilles ou différentes.",
        games: [
          { kind: "ecoute-melodie", count: 4 },
          { kind: "ecoute-pareil", count: 4 },
        ],
      },
      {
        key: "ar-ce2-hymne",
        name: "L'hymne national et les chants",
        description:
          "Éducation musicale, étape 2, paliers 3-4 : l'hymne national, « Le Lion rouge », paroles de Léopold Sédar Senghor ; quand on le chante (le lever des couleurs) et comment se tenir ; accompagner un chant de gestes et d'instruments ; composer un petit chant. Ne citer aucune parole de l'hymne.",
        games: [{ kind: "ecoute-motif-rythmique", count: 2 }],
      },
      {
        key: "ar-ce2-theatre",
        name: "Jouer une scène",
        description:
          "Arts scéniques, étape 2, paliers 3-4 : la dramatisation de scènes de la vie courante (au marché, chez le tailleur, au dispensaire) et de scènes imaginaires, la parodie, l'interprétation d'un rôle ; les étapes pour préparer une saynète.",
      },
    ],
    CM1: [
      {
        key: "ar-cm1-memoire",
        name: "Le dessin de mémoire",
        description:
          "Arts plastiques, étape 3, paliers 1-2 : le dessin de mémoire et la reproduction ; observer, retenir, redessiner.",
        games: [
          { kind: "pixel-memoire", count: 6 },
          { kind: "pixel-copie", count: 1 },
        ],
      },
      {
        key: "ar-cm1-motifs",
        name: "Frises et motifs",
        description:
          "Arts plastiques, étape 3, paliers 1-2 : frises et motifs décoratifs (pagnes, calebasses, poteries) ; répéter, alterner, symétriser un motif.",
        games: [
          { kind: "frise-formes", count: 2 },
          { kind: "frise-couleurs", count: 2 },
          { kind: "frise-objets", count: 1 },
          { kind: "pixel-copie", count: 2 },
        ],
      },
      {
        key: "ar-cm1-instruments",
        name: "Percussions et cordes",
        description:
          "Éducation musicale, étape 3, paliers 1-2 : les sons des instruments à percussion (djembé, sabar, tama, balafon) et à cordes (kora, xalam, riti, guitare) ; reconnaître la famille d'un instrument ; interpréter un chant avec accompagnement.",
        games: [
          { kind: "ecoute-rythme", count: 2 },
          { kind: "ecoute-motif-rythmique", count: 2 },
        ],
      },
      {
        key: "ar-cm1-rythmes",
        name: "Les rythmes",
        description:
          "Éducation musicale, étape 3 : lire et reconnaître un rythme (coups longs et courts), compléter un rythme écrit, accompagner un chant en rythme.",
        games: [
          { kind: "ecoute-motif-rythmique", count: 4 },
          { kind: "frise-rythme", count: 3 },
          { kind: "ecoute-rythme", count: 1 },
        ],
      },
      {
        key: "ar-cm1-comedie",
        name: "Jouer la joie et la tristesse",
        description:
          "Arts scéniques, étape 3, paliers 1-2 : l'imitation de comédiens, les jeux de rôles gais ou tristes ; ce qu'expriment le visage, la voix et le corps.",
      },
    ],
    CM2: [
      {
        key: "ar-cm2-rosaces",
        name: "Rosaces et symétries",
        description:
          "Arts plastiques, étape 3, paliers 3-4 : les rosaces, l'embellissement avec des motifs ornementaux, la symétrie dans les décors.",
        games: [
          { kind: "pixel-symetrie", count: 5 },
          { kind: "coloriage-magique", count: 2 },
        ],
      },
      {
        key: "ar-cm2-observer",
        name: "Observer et illustrer",
        description:
          "Arts plastiques, étape 3, paliers 3-4 : le dessin d'imitation et d'observation, l'illustration de textes (quelle image pour quel passage, ce que l'illustrateur doit montrer).",
        games: [
          { kind: "pixel-memoire", count: 2 },
          { kind: "pixel-copie", count: 2 },
        ],
      },
      {
        key: "ar-cm2-vent",
        name: "Les instruments à vent",
        description:
          "Éducation musicale, étape 3, paliers 3-4 : les sons des instruments à vent (flûte peule, trompette, saxophone, clairon), le fredonnement, reconnaître une mélodie.",
        games: [
          { kind: "ecoute-melodie", count: 2 },
          { kind: "ecoute-pareil", count: 2 },
        ],
      },
      {
        key: "ar-cm2-chanter",
        name: "Chanter et accompagner",
        description:
          "Éducation musicale, étape 3, paliers 3-4 : l'exécution et l'accompagnement de chants : les nuances (fort, doux), le rythme, la mélodie.",
        games: [
          { kind: "ecoute-intensite", count: 2 },
          { kind: "ecoute-motif-rythmique", count: 2 },
          { kind: "ecoute-melodie", count: 2 },
        ],
      },
      {
        key: "ar-cm2-mise-en-scene",
        name: "La mise en scène",
        description:
          "Arts scéniques, étape 3, paliers 3-4 : interpréter un personnage d'une histoire ; le décor, le costume, le déguisement, la mise en scène ; les étapes de la préparation d'un spectacle.",
      },
    ],
  },
};
