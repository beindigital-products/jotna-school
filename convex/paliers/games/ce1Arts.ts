/**
 * LES GABARITS DES ARTS DU CE1 : dessiner et reproduire, plier, découper, coller, les instruments du Sénégal, écouter et comparer les
 * sons, mimer les sentiments (`ar-ce1-dessin`, `ar-ce1-pliage`, `ar-ce1-instruments`, `ar-ce1-sons`, `ar-ce1-mimes`).
 *
 * Trois de ces fiches avaient déjà des jeux (copier un dessin, la symétrie, écouter la hauteur, la durée et l'intensité d'un son) qui
 * ne remplissaient que quatre à huit places sur dix : le modèle écrivait le reste. Les deux autres n'avaient aucun jeu. Sur l'échantillon
 * de CE1, 9 exercices d'arts sur 30 étaient faux : « Quel son est plus aigu ? » avec un triangle et une flûte (le triangle est plus aigu), trois
 * QCM identiques d'un palier à l'autre, « Quelles expressions faciales montre la joie ? » (une question ouverte), « Pour montrer la
 * peur, on peut faire un visage triste » (la clé disait peur), un ordre « découper, plier, appliquer la colle » sans critère, « Quel objet
 * de la vie courante est facile à dessiner ? » (une question d'opinion). Ici chaque exercice lit une ligne d'un tableau fermé.
 *
 * CE QUE LES FICHES DONNENT, ET CE QUE CE FICHIER N'INVENTE PAS
 * - Dessin : le crayon, la gomme, la règle, les crayons de couleur ; dessiner des objets de la vie courante.
 * - Pliage : ciseaux, colle, papier, argile ; les étapes dans l'ordre ; un pliage en deux fait apparaître une symétrie.
 * - Instruments : la kora (on pince ses cordes), le balafon (on frappe ses lames de bois), le tama (petit tambour qu'on serre sous le bras),
 *   le sabar et le djembé (tambours qu'on frappe), le riti (vièle à une corde jouée avec un archet), les maracas (on les secoue), la flûte
 *   (on souffle). Le tama n'est jamais rangé parmi ce qu'on frappe : la fiche dit seulement qu'on le serre sous le bras.
 * - Sons : la hauteur, la durée et l'intensité. HORS FICHE, À FAIRE RELIRE : la flûte est aiguë et le tambour grave, une sirène ou le tonnerre
 *   sont des sons forts et un chuchotement un son faible. Les sons à relier vont par trios choisis à la main (`SOUND_TRIOS`) : chaque son
 *   n'y a qu'une étiquette qui lui convienne.
 * - Mimes : la joie, la peur, la colère, la fatigue, la honte ; ce que disent le visage, les mains, la façon de marcher. Aucune posture ne
 *   sert à deux sentiments : « se cacher le visage » (peur ou honte) et « crier fort » (colère ou joie) n'y sont pas.
 *   HORS FICHE, À FAIRE RELIRE : chaque posture et le sentiment qui lui est donné.
 *
 * RÈGLES POUR AJOUTER UNE LIGNE
 * - Un choix ou une étiquette qui nomme une chose est un nom SEUL avec sa majuscule (« Kora », « Ciseaux »), jamais « la kora » : le test des
 *   images du CI refuse « article + nom ». Un geste est un verbe à l'infinitif ou une phrase qui commence par « On », « Il » ou « Je ».
 * - Les énoncés n'ont aucun « : », au plus une apostrophe droite, vingt-huit mots au plus.
 * - Aucun indice n'écrit un chiffre ni un mot de quatre lettres ou plus de la bonne réponse, d'une étiquette ou d'une case.
 * - Les mauvais choix ne peuvent pas être une deuxième bonne réponse.
 *
 * MODULE PUR (voir `types.ts`).
 */
import {
  binSort,
  factChoice,
  factGap,
  factWriteLine,
  GESTURE_STEP_HINTS,
  pickPairs,
  quarter,
  stepsByLevel,
  type Bin,
  type Fact,
  type GapFact,
  type Steps,
  type WriteFact,
} from "./ce1SciencesOutils";
import { pickFresh, shuffle, type GameContext, type GeneratedGame } from "./shared";
import { linkGame, type Hints } from "./tableaux";

// ===========================================================================
// DESSINER ET REPRODUIRE (ar-ce1-dessin)
// ===========================================================================

const DRAW_TOOLS: readonly Fact[] = [
  {
    question: "Quel outil aide à tracer une ligne droite ?",
    answer: "Règle",
    wrong: ["Gomme", "Crayons de couleur"],
    hints: ["Il est plat et long.", "On le pose sur la feuille.", "Il a des traits régulièrement espacés."],
  },
  {
    question: "Quel outil sert à effacer un trait ?",
    answer: "Gomme",
    wrong: ["Règle", "Crayon"],
    hints: ["Il fait disparaître ce qui est écrit au crayon.", "Il est souvent blanc ou rose.", "On le frotte sur la feuille."],
  },
  {
    question: "Quel outil sert à dessiner un trait ?",
    answer: "Crayon",
    wrong: ["Gomme", "Cartable"],
    hints: ["Il laisse une trace grise.", "On le taille quand il est usé.", "On le tient entre les doigts."],
  },
  {
    question: "Quel outil sert à colorier un dessin ?",
    answer: "Crayons de couleur",
    wrong: ["Gomme", "Règle"],
    hints: ["Ils sont de plusieurs teintes.", "Ils remplissent les formes.", "Il y en a une boîte dans ta trousse."],
  },
  {
    question: "À quoi sert la gomme ?",
    answer: "À effacer",
    wrong: ["À couper", "À colorier"],
    hints: ["Elle fait disparaître un trait.", "On corrige une erreur avec elle.", "On la frotte sur la feuille."],
  },
  {
    question: "À quoi sert la règle ?",
    answer: "À tracer",
    wrong: ["À effacer", "À colorier"],
    hints: ["Elle est plate et droite.", "On la tient avec une main.", "Un crayon longe son bord."],
  },
];

/** « Quel outil aide à tracer une ligne droite ? » : l'outil du dessin, ou ce à quoi il sert. */
export function makeCe1DrawTool(ctx: GameContext): GeneratedGame {
  return factChoice(ctx, "ce1-dessin-materiel", "le matériel du dessin", DRAW_TOOLS);
}

const DRAW_PAIRS: readonly (readonly [string, string])[] = [
  ["Crayon", "Dessiner un trait"],
  ["Gomme", "Effacer"],
  ["Règle", "Tracer une ligne droite"],
  ["Crayons de couleur", "Colorier"],
  ["Feuille", "Recevoir le dessin"],
];

/** « Relie chaque objet à son usage. » */
export function makeCe1DrawLink(ctx: GameContext): GeneratedGame {
  return pickPairs(ctx, "ce1-dessin-relier", "relier un outil du dessin à son usage", "Relie chaque objet à son usage.", DRAW_PAIRS, [
    "Pense à ce que tu fais avec chaque objet.",
    "Chaque objet sert à une seule des trois choses.",
    "Commence par l'objet que tu connais le mieux.",
  ]);
}

const HOUSE_SHORT: Steps = {
  prompt: "Pour dessiner une maison, mets ces gestes du premier au dernier.",
  sequence: ["Je dessine un carré", "J'ajoute un toit", "Je colorie la maison"],
  hints: GESTURE_STEP_HINTS,
};
const HOUSE_LONG: Steps = {
  prompt: "Pour dessiner une maison, mets ces gestes du premier au dernier.",
  sequence: ["Je prends un crayon", "Je dessine un carré", "J'ajoute un toit", "Je colorie la maison"],
  hints: GESTURE_STEP_HINTS,
};
const TREE_DRAW_SHORT: Steps = {
  prompt: "Pour dessiner un arbre, mets ces gestes du premier au dernier.",
  sequence: ["Je dessine le tronc", "J'ajoute les branches", "Je colorie les feuilles"],
  hints: GESTURE_STEP_HINTS,
};
const TREE_DRAW_LONG: Steps = {
  prompt: "Pour dessiner un arbre, mets ces gestes du premier au dernier.",
  sequence: ["Je prends un crayon", "Je dessine le tronc", "J'ajoute les branches", "Je colorie les feuilles"],
  hints: GESTURE_STEP_HINTS,
};
const LINE_SHORT: Steps = {
  prompt: "Pour tracer une ligne droite, mets ces gestes du premier au dernier.",
  sequence: ["Je pose la règle", "Je tiens la règle", "Je trace le trait"],
  hints: GESTURE_STEP_HINTS,
};
const LINE_LONG: Steps = {
  prompt: "Pour tracer une ligne droite, mets ces gestes du premier au dernier.",
  sequence: ["Je prends un crayon", "Je pose la règle", "Je tiens la règle", "Je trace le trait"],
  hints: GESTURE_STEP_HINTS,
};

/** « Pour dessiner une maison, mets ces gestes du premier au dernier. » : trois étapes puis quatre. */
export function makeCe1DrawOrder(ctx: GameContext): GeneratedGame {
  return stepsByLevel(ctx, "ce1-dessin-ordre", "ranger les gestes d'un dessin", [HOUSE_SHORT, TREE_DRAW_SHORT, LINE_SHORT], [HOUSE_LONG, TREE_DRAW_LONG, LINE_LONG]);
}

const DRAW_GAPS: readonly GapFact[] = [
  {
    text: "Pour effacer un trait, j'utilise une ___.",
    answer: "gomme",
    wrong: ["règle", "feuille"],
    hints: ["Elle fait disparaître le crayon.", "On la frotte sur la feuille.", "Elle est souvent blanche."],
  },
  {
    text: "Pour tracer une ligne droite, j'utilise une ___.",
    answer: "règle",
    wrong: ["gomme", "brosse"],
    hints: ["Elle est plate et longue.", "Elle a des graduations.", "On la pose sur la feuille."],
  },
  {
    text: "Pour colorier, j'utilise des crayons de ___.",
    answer: "couleur",
    wrong: ["pluie", "nuit"],
    hints: ["Ils sont rouges, bleus ou verts.", "Ils remplissent les formes.", "Ils changent l'allure du dessin."],
  },
  {
    text: "Pour dessiner, je prends un ___.",
    answer: "crayon",
    wrong: ["ballon", "seau"],
    hints: ["Il laisse une trace grise.", "On le taille quand il est usé.", "On le tient entre les doigts."],
  },
  {
    text: "Je dessine sur une ___ de papier.",
    answer: "feuille",
    wrong: ["bouteille", "chaise"],
    hints: ["Elle est plate et fine.", "On la plie facilement.", "Elle est dans ton cahier."],
  },
];

/** « Pour effacer un trait, j'utilise une ___. » : le mot qui complète. */
export function makeCe1DrawGap(ctx: GameContext): GeneratedGame {
  return factGap(ctx, "ce1-dessin-trou", "compléter une phrase sur le dessin", DRAW_GAPS);
}

// ===========================================================================
// PLIER, DÉCOUPER, COLLER (ar-ce1-pliage)
// ===========================================================================

const FOLD_TOOLS: readonly Fact[] = [
  {
    question: "Quel outil sert à découper du papier ?",
    answer: "Ciseaux",
    wrong: ["Colle", "Argile"],
    hints: ["Il a deux lames.", "On le tient par deux anneaux.", "Il coupe la feuille."],
  },
  {
    question: "Qu'est-ce qui sert à coller deux morceaux de papier ?",
    answer: "Colle",
    wrong: ["Ciseaux", "Argile"],
    hints: ["Elle est collante.", "On l'étale avec le doigt ou un pinceau.", "Elle tient les morceaux ensemble."],
  },
  {
    question: "Avec quoi peut-on modeler un petit objet ?",
    answer: "Argile",
    wrong: ["Ciseaux", "Colle"],
    hints: ["C'est une terre molle.", "On la pétrit avec les doigts.", "Elle durcit en séchant."],
  },
  {
    question: "À quoi servent les ciseaux ?",
    answer: "À découper",
    wrong: ["À coller", "À modeler"],
    hints: ["Ils ont deux lames.", "Ils séparent la feuille en morceaux.", "Il faut les manier avec soin."],
  },
  {
    question: "À quoi sert la colle ?",
    answer: "À coller",
    wrong: ["À découper", "À modeler"],
    hints: ["Elle réunit des morceaux.", "On en met un peu seulement.", "Elle est collante."],
  },
  {
    question: "À quoi sert l'argile ?",
    answer: "À modeler",
    wrong: ["À découper", "À coller"],
    hints: ["Elle se pétrit.", "On en fait des petits objets.", "Elle prend la forme qu'on veut."],
  },
];

/** « Quel outil sert à découper du papier ? » : le matériel du pliage, du découpage et du collage. */
export function makeCe1FoldTool(ctx: GameContext): GeneratedGame {
  return factChoice(ctx, "ce1-pli-materiel", "le matériel du pliage, du découpage et du collage", FOLD_TOOLS);
}

const FOLD_PAIRS: readonly (readonly [string, string])[] = [
  ["Ciseaux", "Découper le papier"],
  ["Colle", "Fixer deux morceaux"],
  ["Argile", "Modeler un objet"],
  ["Papier", "Se plie et se découpe"],
  ["Pli", "La ligne où la feuille est pliée"],
];

/** « Relie chaque mot à ce qu'il veut dire. » */
export function makeCe1FoldLink(ctx: GameContext): GeneratedGame {
  return pickPairs(ctx, "ce1-pli-relier", "relier un mot du pliage à son sens", "Relie chaque mot à ce qu'il veut dire.", FOLD_PAIRS, [
    "Lis d'abord chaque explication, puis cherche le mot qui lui va.",
    "Pense au geste de chaque mot : couper, coller, façonner ou plier.",
    "Commence par la paire dont tu es le plus sûr.",
  ]);
}

const COLLAGE_SHORT: Steps = {
  prompt: "Pour faire un collage, mets ces gestes du premier au dernier.",
  sequence: ["Je découpe un papier", "Je mets de la colle", "Je colle le papier"],
  hints: GESTURE_STEP_HINTS,
};
const COLLAGE_LONG: Steps = {
  prompt: "Pour faire un collage, mets ces gestes du premier au dernier.",
  sequence: ["Je prends mes ciseaux", "Je découpe un papier", "Je mets de la colle", "Je colle le papier"],
  hints: GESTURE_STEP_HINTS,
};
const FOLD_SHORT: Steps = {
  prompt: "Pour plier une feuille en deux, mets ces gestes du premier au dernier.",
  sequence: ["Je prends une feuille", "Je plie en deux", "J'appuie sur le pli"],
  hints: GESTURE_STEP_HINTS,
};
const FOLD_LONG: Steps = {
  prompt: "Pour plier une feuille en deux, mets ces gestes du premier au dernier.",
  sequence: ["Je prends une feuille", "Je plie en deux", "J'appuie sur le pli", "Je déplie la feuille"],
  hints: GESTURE_STEP_HINTS,
};
const CLAY_SHORT: Steps = {
  prompt: "Pour modeler un objet, mets ces gestes du premier au dernier.",
  sequence: ["Je prends de l'argile", "Je forme un objet", "Je laisse sécher"],
  hints: GESTURE_STEP_HINTS,
};
const CLAY_LONG: Steps = {
  prompt: "Pour modeler un objet, mets ces gestes du premier au dernier.",
  sequence: ["Je prends de l'argile", "Je roule une boule", "Je forme un objet", "Je laisse sécher"],
  hints: GESTURE_STEP_HINTS,
};
const CUT_SHORT: Steps = {
  prompt: "Pour découper une forme, mets ces gestes du premier au dernier.",
  sequence: ["Je dessine un trait", "Je découpe sur le trait", "Je range les ciseaux"],
  hints: GESTURE_STEP_HINTS,
};
/**
 * « Je prends les ciseaux » n'a pas de place forcée (avant le crayon, avant ou après le trait) : la suite finit donc par « Je range les
 * ciseaux », qui ne peut venir qu'après la découpe.
 */
const CUT_LONG: Steps = {
  prompt: "Pour découper une forme, mets ces gestes du premier au dernier.",
  sequence: ["Je prends un crayon", "Je dessine un trait", "Je découpe sur le trait", "Je range les ciseaux"],
  hints: GESTURE_STEP_HINTS,
};

/** « Pour faire un collage, mets ces gestes du premier au dernier. » : trois étapes puis quatre, deux fois par palier. */
export function makeCe1FoldOrder(ctx: GameContext): GeneratedGame {
  return stepsByLevel(ctx, "ce1-pli-ordre", "ranger les gestes d'un pliage, d'un collage ou d'un modelage", [COLLAGE_SHORT, FOLD_SHORT, CLAY_SHORT, CUT_SHORT], [COLLAGE_LONG, FOLD_LONG, CLAY_LONG, CUT_LONG]);
}

const FOLD_GAPS: readonly GapFact[] = [
  {
    text: "Pour découper, j'utilise des ___.",
    answer: "ciseaux",
    wrong: ["crayons", "livres"],
    hints: ["Ils ont deux lames.", "On les tient par deux anneaux.", "Ils coupent la feuille."],
  },
  {
    text: "Pour coller, j'utilise de la ___.",
    answer: "colle",
    wrong: ["règle", "gomme"],
    hints: ["Elle est collante.", "On en met un peu seulement.", "Elle réunit deux morceaux."],
  },
  {
    text: "On modèle un objet avec de l'___.",
    answer: "argile",
    wrong: ["encre", "huile"],
    hints: ["C'est une terre molle.", "On la pétrit avec les doigts.", "Elle sèche et durcit."],
  },
  {
    text: "On plie une feuille de ___.",
    answer: "papier",
    wrong: ["fer", "pierre"],
    hints: ["Elle est fine et souple.", "On écrit dessus.", "On la déchire facilement."],
  },
];

/** « Pour découper, j'utilise des ___. » : le mot qui complète. */
export function makeCe1FoldGap(ctx: GameContext): GeneratedGame {
  return factGap(ctx, "ce1-pli-trou", "compléter une phrase sur le pliage et le collage", FOLD_GAPS);
}

const FOLD_SYMMETRY: readonly Fact[] = [
  {
    question: "Tu plies une feuille en deux et tu découpes une forme. Que vois-tu en dépliant ?",
    answer: "Deux côtés pareils",
    wrong: ["Un seul côté", "Trois morceaux"],
    hints: ["La forme est coupée de part et d'autre du pli.", "Les moitiés se ressemblent.", "C'est comme un miroir."],
  },
  {
    question: "Quel mot dit ce qui est pareil des deux côtés d'un pli ?",
    answer: "Symétrie",
    wrong: ["Colle", "Argile"],
    hints: ["C'est un mot que l'on apprend en arts.", "Il commence par la lettre s.", "Il parle d'un miroir invisible."],
  },
  {
    question: "Que fait apparaître un pliage en deux ?",
    answer: "Symétrie",
    wrong: ["Couleur", "Bruit"],
    hints: ["Deux moitiés se font face.", "Elles sont pareilles.", "Le mot commence par la lettre s."],
  },
  {
    question: "Où se trouve la ligne de symétrie quand on plie en deux ?",
    answer: "Sur le pli",
    wrong: ["Sur un coin", "Hors de la feuille"],
    hints: ["C'est la ligne où la feuille est repliée.", "Elle sépare deux moitiés pareilles.", "On la sent sous le doigt."],
  },
  {
    question: "Tu plies en deux une feuille avec la moitié d'un papillon dessiné. Que se passe-t-il en dépliant ?",
    answer: "Le papillon est entier",
    wrong: ["Le papillon disparaît", "Il y a deux feuilles"],
    hints: ["Chaque moitié devient une aile.", "Les deux ailes sont pareilles.", "Cela marche avec les formes symétriques."],
  },
];

/** « Que fait apparaître un pliage en deux ? » : la symétrie. */
export function makeCe1FoldSymmetry(ctx: GameContext): GeneratedGame {
  return factChoice(ctx, "ce1-pli-symetrie", "la symétrie d'un pliage en deux", FOLD_SYMMETRY);
}

// ===========================================================================
// ÉCOUTER ET COMPARER LES SONS (ar-ce1-sons)
// ===========================================================================

/**
 * Les sons à relier, par trios choisis à la main, un par palier. Un son a toujours une force, une hauteur et une durée : trois étiquettes
 * prises au hasard sur trois axes se recoupent (une sirène est forte, aiguë et longue ; une cloche dure et sonne fort ; un tambour est grave
 * et fort). Dans chaque trio, chaque son n'a qu'une étiquette qui lui convienne : jamais « fort » avec « grave » (le tonnerre et le tambour
 * sont les deux), aucune étiquette de durée (une cloche ou un sifflet sont aussi forts).
 */
const SOUND_TRIOS: readonly (readonly (readonly [string, string])[])[] = [
  [
    ["Tonnerre", "Un son fort"],
    ["Chuchotement", "Un son faible"],
    ["Flûte", "Un son aigu"],
  ],
  [
    ["Tambour", "Un son grave"],
    ["Flûte", "Un son aigu"],
    ["Chuchotement", "Un son faible"],
  ],
  [
    ["Pétard", "Un son fort"],
    ["Murmure", "Un son faible"],
    ["Chant d'oiseau", "Un son aigu"],
  ],
  [
    ["Tambour", "Un son grave"],
    ["Sifflet", "Un son aigu"],
    ["Pas de chat", "Un son faible"],
  ],
];

/** « Relie chaque son à ce qui le décrit. » */
export function makeCe1SoundLink(ctx: GameContext): GeneratedGame {
  return linkGame(ctx, "ce1-son-relier", "relier un son à ce qui le décrit", () => {
    const trio = pickFresh(ctx, quarter(SOUND_TRIOS, ctx.level, 1), (candidate) => `ce1-son-relier:${candidate.map((pair) => pair[0]).join("|")}`);
    return {
      prompt: "Relie chaque son à ce qui le décrit.",
      pairs: shuffle(ctx.rng, trio).map(([left, right]) => ({ left, right })),
      hints: ["Imagine chaque son dans ta tête.", "Certains sons sont forts ou faibles, d'autres graves ou aigus.", "Commence par le son que tu connais le mieux."],
    };
  });
}

/** « Glisse chaque son dans la bonne case » : un son fort, un son faible. */
export function makeCe1SoundSort(ctx: GameContext): GeneratedGame {
  return binSort(
    ctx,
    "ce1-son-glisser",
    "ranger des sons forts et faibles",
    "Glisse chaque son dans la bonne case.",
    { zone: "Son fort", tiles: ["Sirène", "Tonnerre", "Tambour", "Klaxon", "Pétard"] },
    { zone: "Son faible", tiles: ["Chuchotement", "Murmure", "Pas de chat", "Feuille qui bouge", "Goutte d'eau"] },
    [
      "Imagine chaque son dans ta tête.",
      "Certains sons te font boucher les oreilles, d'autres demandent de se taire.",
      "Demande-toi si tu l'entendrais de loin.",
    ],
  );
}

// ===========================================================================
// LES INSTRUMENTS DU SÉNÉGAL (ar-ce1-instruments)
// ===========================================================================

const INSTRUMENT_HOW: readonly Fact[] = [
  {
    question: "Comment joue-t-on de la kora ?",
    answer: "On pince ses cordes",
    wrong: ["On souffle dedans", "On la secoue"],
    hints: ["Elle a plusieurs fils tendus.", "On les touche du bout des doigts.", "Le son vient des fils qui vibrent."],
  },
  {
    question: "Comment joue-t-on du sabar ?",
    answer: "On le frappe",
    wrong: ["On souffle dedans", "On le secoue"],
    hints: ["C'est un tambour.", "Il sonne quand on tape dessus.", "Les mains ou une baguette le font vibrer."],
  },
  {
    question: "Comment joue-t-on de la flûte ?",
    answer: "On souffle dedans",
    wrong: ["On pince ses cordes", "On la frappe"],
    hints: ["Elle est creuse.", "Le son vient de l'air.", "Il faut de la respiration."],
  },
  {
    question: "Comment joue-t-on des maracas ?",
    answer: "On les secoue",
    wrong: ["On souffle dedans", "On pince leurs cordes"],
    hints: ["Ils sont remplis de petites graines.", "Le son vient du mouvement.", "On les tient à la main."],
  },
  {
    question: "Comment joue-t-on du riti ?",
    answer: "On le joue avec un archet",
    wrong: ["On le secoue", "On souffle dedans"],
    hints: ["Il a une seule corde.", "On frotte la corde.", "Une baguette courbe la fait chanter."],
  },
  {
    question: "Comment joue-t-on du tama ?",
    answer: "On le serre sous le bras",
    wrong: ["On souffle dedans", "On pince ses cordes"],
    hints: ["C'est un petit tambour.", "On le tient contre son corps.", "Une main reste libre pour jouer."],
  },
  {
    question: "Comment joue-t-on du balafon ?",
    answer: "On frappe ses lames de bois",
    wrong: ["On pince ses cordes", "On souffle dedans"],
    hints: ["Il ressemble à un grand clavier.", "Les sons viennent de ce qu'on tape.", "Chaque touche sonne différemment."],
  },
  {
    question: "Comment joue-t-on du djembé ?",
    answer: "On le frappe",
    wrong: ["On pince ses cordes", "On souffle dedans"],
    hints: ["C'est un tambour.", "Il sonne quand on tape dessus.", "Les mains le font vibrer."],
  },
];

/** « Comment joue-t-on de la kora ? » : la façon de jouer d'un instrument, deux fois par palier. */
export function makeCe1InstrumentHow(ctx: GameContext): GeneratedGame {
  return factChoice(ctx, "ce1-instru-geste", "comment on joue d'un instrument", INSTRUMENT_HOW, 2);
}

const INSTRUMENT_WHICH: readonly Fact[] = [
  {
    question: "Quel instrument se joue en soufflant ?",
    answer: "Flûte",
    wrong: ["Kora", "Balafon"],
    hints: ["Il est creux.", "Le son vient de l'air.", "Il faut de la respiration."],
  },
  {
    question: "Quel instrument se joue en pinçant ses cordes ?",
    answer: "Kora",
    wrong: ["Flûte", "Maracas"],
    hints: ["Il a de nombreux fils tendus.", "On les touche du bout des doigts.", "Il est grand et rond."],
  },
  {
    question: "Quel instrument se secoue ?",
    answer: "Maracas",
    wrong: ["Kora", "Flûte"],
    hints: ["Ils sont remplis de petites graines.", "Ils vont par deux.", "On les tient à la main."],
  },
  {
    question: "Quel instrument se joue avec un archet ?",
    answer: "Riti",
    wrong: ["Kora", "Balafon"],
    hints: ["Il n'a qu'une seule corde.", "On la frotte.", "Il est comme un petit violon."],
  },
  {
    question: "Quel instrument a des lames de bois ?",
    answer: "Balafon",
    wrong: ["Kora", "Maracas"],
    hints: ["Il ressemble à un clavier.", "Il faut taper dessus.", "Chaque touche sonne différemment."],
  },
  {
    question: "Quel petit tambour se serre sous le bras ?",
    answer: "Tama",
    wrong: ["Kora", "Flûte"],
    hints: ["Il est petit.", "On le tient contre son corps.", "Une main reste libre pour jouer."],
  },
  {
    question: "Quel instrument a une seule corde ?",
    answer: "Riti",
    wrong: ["Kora", "Balafon"],
    hints: ["On le joue avec une baguette courbe.", "Il est comme un petit violon.", "Son son est doux."],
  },
  {
    question: "Quel instrument est un tambour qu'on frappe ?",
    answer: "Sabar",
    wrong: ["Kora", "Flûte"],
    hints: ["Il est large.", "Il sonne quand on tape dessus.", "On l'entend dans les fêtes."],
  },
];

/** « Quel instrument se joue en soufflant ? » : l'instrument qui se joue ainsi, deux fois par palier. */
export function makeCe1InstrumentWhich(ctx: GameContext): GeneratedGame {
  return factChoice(ctx, "ce1-instru-quel", "quel instrument se joue comment", INSTRUMENT_WHICH, 2);
}

/** « Glisse chaque instrument dans la bonne case » : ceux qu'on frappe, ceux qu'on ne frappe pas. */
export function makeCe1InstrumentSort(ctx: GameContext): GeneratedGame {
  return binSort(
    ctx,
    "ce1-instru-glisser",
    "ranger les instruments qu'on frappe ou non",
    "Glisse chaque instrument dans la bonne case.",
    { zone: "On frappe", tiles: ["Balafon", "Sabar", "Djembé"] },
    { zone: "On ne frappe pas", tiles: ["Kora", "Flûte", "Maracas", "Riti"] },
    [
      "Pense à la façon de jouer de chaque instrument.",
      "Certains instruments sonnent quand on tape dessus.",
      "D'autres se soufflent, se pincent, se secouent ou se frottent.",
    ],
  );
}

const INSTRUMENT_PAIRS: readonly (readonly [string, string])[] = [
  ["Kora", "On pince ses cordes"],
  ["Balafon", "On frappe ses lames de bois"],
  ["Tama", "On le serre sous le bras"],
  ["Riti", "On le joue avec un archet"],
  ["Maracas", "On les secoue"],
  ["Flûte", "On souffle dedans"],
];

/** « Relie chaque instrument à sa façon de jouer. » */
export function makeCe1InstrumentLink(ctx: GameContext): GeneratedGame {
  return pickPairs(ctx, "ce1-instru-relier", "relier un instrument à sa façon de jouer", "Relie chaque instrument à sa façon de jouer.", INSTRUMENT_PAIRS, [
    "Pense à ce que tu fais de chaque instrument.",
    "Chaque instrument a sa façon propre, différente des autres.",
    "Commence par l'instrument que tu connais le mieux.",
  ]);
}

const INSTRUMENT_GAPS: readonly GapFact[] = [
  {
    text: "La kora se joue en pinçant ses ___.",
    answer: "cordes",
    wrong: ["lames", "tambours"],
    hints: ["Ce sont des fils tendus.", "Ils vibrent sous les doigts.", "On les touche un par un."],
  },
  {
    text: "Le balafon a des lames de ___.",
    answer: "bois",
    wrong: ["fer", "verre"],
    hints: ["C'est une matière qui vient des arbres.", "Elle sonne quand on la frappe.", "Elle est dure mais légère."],
  },
  {
    text: "On souffle dans la ___.",
    answer: "flûte",
    wrong: ["kora", "tama"],
    hints: ["Elle est creuse.", "Le son vient de l'air.", "On la tient avec les doigts."],
  },
  {
    text: "On secoue les ___.",
    answer: "maracas",
    wrong: ["cordes", "archets"],
    hints: ["Ils sont remplis de petites graines.", "Ils vont par deux.", "On les tient à la main."],
  },
  {
    text: "Le riti se joue avec un ___.",
    answer: "archet",
    wrong: ["bâton", "souffle"],
    hints: ["C'est une baguette courbe.", "Il frotte la corde.", "Il est comme celui d'un violon."],
  },
  {
    text: "Le tama est un petit ___ qu'on serre sous le bras.",
    answer: "tambour",
    wrong: ["balafon", "riti"],
    hints: ["On frappe dessus.", "Il est rond.", "Il fait du rythme."],
  },
  {
    text: "Le sabar et le djembé sont des ___ qu'on frappe.",
    answer: "tambours",
    wrong: ["flûtes", "cordes"],
    hints: ["Ils sonnent sous les mains.", "On les entend dans les fêtes.", "Ils font du rythme."],
  },
  {
    text: "Le riti est une vièle à une ___.",
    answer: "corde",
    wrong: ["flûte", "lame"],
    hints: ["Elle est tendue.", "On la frotte.", "Il n'y en a qu'une."],
  },
];

/** « La kora se joue en pinçant ses ___. » : le mot qui complète, deux fois par palier. */
export function makeCe1InstrumentGap(ctx: GameContext): GeneratedGame {
  return factGap(ctx, "ce1-instru-trou", "compléter une phrase sur un instrument", INSTRUMENT_GAPS, 2);
}

const INSTRUMENT_WRITES: readonly WriteFact[] = [
  {
    prompt: "Quel instrument se souffle ? Écris le mot.",
    accepted: ["flûte", "la flûte", "une flûte", "flute"],
    hints: ["Il est creux.", "Le son vient de l'air.", "Le mot commence par la lettre f."],
  },
  {
    prompt: "Quel instrument se joue avec un archet ? Écris le mot.",
    accepted: ["riti", "le riti"],
    hints: ["Il n'a qu'une corde.", "Il est comme un petit violon.", "Le mot commence par la lettre r."],
  },
  {
    prompt: "Combien de cordes a le riti ? Écris le nombre.",
    accepted: ["1", "une", "une corde"],
    hints: ["Il n'y en a pas deux.", "C'est le plus petit nombre.", "Écris le nombre en chiffre."],
  },
  {
    prompt: "Quel instrument a des lames de bois ? Écris le mot.",
    accepted: ["balafon", "le balafon"],
    hints: ["Il ressemble à un clavier.", "Il faut taper dessus.", "Le mot commence par la lettre b."],
  },
  {
    prompt: "Quel instrument se secoue ? Écris le mot.",
    accepted: ["maracas", "les maracas", "des maracas"],
    hints: ["Ils sont remplis de petites graines.", "Ils vont par deux.", "Le mot commence par la lettre m."],
  },
  {
    prompt: "Quel instrument a des cordes que l'on pince ? Écris le mot.",
    accepted: ["kora", "la kora"],
    hints: ["Il a de nombreux fils tendus.", "On les touche du bout des doigts.", "Le mot commence par la lettre k."],
  },
  {
    prompt: "Quel petit tambour se serre sous le bras ? Écris le mot.",
    accepted: ["tama", "le tama"],
    hints: ["Il est petit.", "On le tient contre son corps.", "Le mot commence par la lettre t."],
  },
  {
    prompt: "Quel instrument est une vièle à une corde ? Écris le mot.",
    accepted: ["riti", "le riti"],
    hints: ["On le joue avec une baguette courbe.", "Il est comme un petit violon.", "Le mot commence par la lettre r."],
  },
];

/** « Quel instrument se souffle ? Écris le mot. » : un mot à écrire, de la liste fermée, deux fois par palier. */
export function makeCe1InstrumentWrite(ctx: GameContext): GeneratedGame {
  return factWriteLine(ctx, "ce1-instru-ecrire", "écrire le nom d'un instrument", INSTRUMENT_WRITES, 2);
}

// ===========================================================================
// MIMER LES SENTIMENTS (ar-ce1-mimes)
// ===========================================================================

type Feeling = "Joie" | "Peur" | "Colère" | "Fatigue" | "Honte";

/** Les indices d'un sentiment : ils ne le nomment pas, ils disent ce qu'on fait quand on le ressent. */
const MIME_HINTS: Record<Feeling, Hints> = {
  Joie: ["Pense à ce que tu fais quand tu es très content.", "Le visage et le corps sont pleins d'énergie.", "On a envie de bouger et de rire."],
  Peur: ["Pense à ce que tu fais quand tu veux t'éloigner d'un danger.", "Le corps se méfie.", "On cherche à se protéger."],
  Colère: ["Pense à ce qui se passe quand on n'est pas du tout content.", "Le corps est tendu.", "Le visage est fermé."],
  Fatigue: ["Pense à ce que tu fais le soir, après une longue journée.", "Le corps n'a plus d'énergie.", "On a envie de dormir."],
  Honte: ["Pense à ce que tu fais quand tu as fait une bêtise devant les autres.", "On évite le regard des autres.", "On voudrait se faire tout petit."],
};

/** Une posture (« sourit et saute très haut », qui complète « quelqu'un qui »), son sentiment et deux sentiments qui n'en sont pas. */
const POSTURES: readonly { posture: string; feeling: Feeling; wrong: readonly [Feeling, Feeling] }[] = [
  { posture: "sourit et saute très haut", feeling: "Joie", wrong: ["Peur", "Honte"] },
  { posture: "recule en tremblant", feeling: "Peur", wrong: ["Joie", "Fatigue"] },
  { posture: "serre les poings et fronce les sourcils", feeling: "Colère", wrong: ["Joie", "Fatigue"] },
  { posture: "bâille et frotte ses yeux", feeling: "Fatigue", wrong: ["Colère", "Peur"] },
  { posture: "baisse la tête et regarde ses pieds", feeling: "Honte", wrong: ["Joie", "Colère"] },
  { posture: "rit et bat des mains", feeling: "Joie", wrong: ["Colère", "Fatigue"] },
  { posture: "se cache derrière un adulte", feeling: "Peur", wrong: ["Joie", "Colère"] },
  { posture: "tape du pied et frappe la table", feeling: "Colère", wrong: ["Joie", "Peur"] },
  { posture: "marche lentement, les épaules tombantes", feeling: "Fatigue", wrong: ["Joie", "Colère"] },
  { posture: "parle tout bas, les yeux baissés", feeling: "Honte", wrong: ["Joie", "Colère"] },
  { posture: "danse les bras levés", feeling: "Joie", wrong: ["Peur", "Fatigue"] },
  { posture: "retient son souffle et ne bouge plus", feeling: "Peur", wrong: ["Joie", "Colère"] },
  { posture: "croise les bras et fronce les sourcils", feeling: "Colère", wrong: ["Joie", "Fatigue"] },
  { posture: "pose sa tête sur ses bras", feeling: "Fatigue", wrong: ["Joie", "Peur"] },
  { posture: "rougit et baisse les yeux", feeling: "Honte", wrong: ["Joie", "Colère"] },
];

/** « Que ressent quelqu'un qui recule en tremblant ? » : le sentiment qu'une posture montre, trois fois par palier. */
export function makeCe1MimeFeeling(ctx: GameContext): GeneratedGame {
  const facts: Fact[] = POSTURES.map((entry) => ({
    question: `Que ressent quelqu'un qui ${entry.posture} ?`,
    answer: entry.feeling,
    wrong: entry.wrong,
    hints: MIME_HINTS[entry.feeling],
  }));
  return factChoice(ctx, "ce1-mime-sentiment", "reconnaître un sentiment à une posture", facts, 3);
}

const MIME_GESTURES: readonly Fact[] = [
  { question: "Quel geste montre la joie ?", answer: "Taper dans ses mains", wrong: ["Baisser la tête", "Reculer en tremblant"], hints: MIME_HINTS.Joie },
  { question: "Comment mime-t-on la joie ?", answer: "Sauter en riant", wrong: ["Bâiller longuement", "Serrer les poings"], hints: MIME_HINTS.Joie },
  { question: "Quel geste montre la peur ?", answer: "Reculer en tremblant", wrong: ["Taper dans ses mains", "Poser sa tête sur ses bras"], hints: MIME_HINTS.Peur },
  { question: "Comment mime-t-on la peur ?", answer: "Se cacher derrière un adulte", wrong: ["Sauter en riant", "Taper du pied"], hints: MIME_HINTS.Peur },
  { question: "Quel geste montre la colère ?", answer: "Serrer les poings", wrong: ["Bâiller longuement", "Baisser la tête"], hints: MIME_HINTS.Colère },
  { question: "Comment mime-t-on la colère ?", answer: "Taper du pied", wrong: ["Sauter en riant", "Reculer en tremblant"], hints: MIME_HINTS.Colère },
  { question: "Quel geste montre la fatigue ?", answer: "Bâiller longuement", wrong: ["Serrer les poings", "Taper dans ses mains"], hints: MIME_HINTS.Fatigue },
  { question: "Comment mime-t-on la fatigue ?", answer: "Poser sa tête sur ses bras", wrong: ["Sauter en riant", "Taper du pied"], hints: MIME_HINTS.Fatigue },
  { question: "Quel geste montre la honte ?", answer: "Baisser la tête", wrong: ["Taper dans ses mains", "Serrer les poings"], hints: MIME_HINTS.Honte },
  { question: "Comment mime-t-on la honte ?", answer: "Regarder ses pieds", wrong: ["Sauter en riant", "Taper du pied"], hints: MIME_HINTS.Honte },
];

/** « Quel geste montre la joie ? » : le geste d'un sentiment, deux fois par palier. */
export function makeCe1MimeGesture(ctx: GameContext): GeneratedGame {
  return factChoice(ctx, "ce1-mime-geste", "le geste d'un sentiment", MIME_GESTURES, 2);
}

/** Les gestes de chaque sentiment : aucun ne sert à deux sentiments. */
const MIME_TILES: Record<Feeling, readonly string[]> = {
  Joie: ["Sauter en riant", "Taper dans ses mains", "Danser", "Sourire"],
  Peur: ["Reculer en tremblant", "Se cacher derrière un adulte", "Retenir son souffle", "Trembler"],
  Colère: ["Serrer les poings", "Taper du pied", "Froncer les sourcils", "Taper sur la table"],
  Fatigue: ["Bâiller", "Frotter ses yeux", "Marcher lentement", "Poser sa tête sur ses bras"],
  Honte: ["Baisser la tête", "Regarder ses pieds", "Parler tout bas", "Rougir"],
};
const FEELINGS = Object.keys(MIME_TILES) as Feeling[];
/** Les dix couples de sentiments. */
const FEELING_PAIRS = FEELINGS.flatMap((first, i) => FEELINGS.slice(i + 1).map((second) => [first, second] as const));

/** « Glisse chaque geste dans la bonne case » : les gestes de deux sentiments. */
export function makeCe1MimeSort(ctx: GameContext): GeneratedGame {
  const [first, second] = pickFresh(ctx, quarter(FEELING_PAIRS, ctx.level), (pair) => `ce1-mime-glisser:${pair[0]}:${pair[1]}`);
  const bin = (feeling: Feeling): Bin => ({ zone: feeling, tiles: MIME_TILES[feeling] });
  return binSort(
    ctx,
    "ce1-mime-glisser",
    "ranger les gestes de deux sentiments",
    "Glisse chaque geste dans la case du sentiment qu'il montre.",
    bin(first),
    bin(second),
    [
      "Imagine-toi en train de faire chaque geste.",
      "Chaque geste va avec un seul des deux sentiments.",
      "Demande-toi ce que ressent celui qui le fait.",
    ],
  );
}

const MIME_PAIRS: readonly (readonly [string, string])[] = [
  ["Joie", "Il saute et il rit"],
  ["Peur", "Il recule en tremblant"],
  ["Colère", "Il serre les poings"],
  ["Fatigue", "Elle bâille"],
  ["Honte", "Il baisse la tête"],
];

/** « Relie chaque sentiment à son geste. » */
export function makeCe1MimeLink(ctx: GameContext): GeneratedGame {
  return pickPairs(ctx, "ce1-mime-relier", "relier un sentiment à son geste", "Relie chaque sentiment à son geste.", MIME_PAIRS, [
    "Imagine ce que tu fais quand tu ressens chaque chose.",
    "Chaque geste va avec un seul sentiment.",
    "Commence par le sentiment que tu reconnais le mieux.",
  ]);
}

const MIME_GAPS: readonly GapFact[] = [
  {
    text: "Quand on a peur, on peut ___ en tremblant.",
    answer: "reculer",
    wrong: ["danser", "sauter"],
    hints: ["On s'éloigne de ce qui fait peur.", "On fait un pas vers l'arrière.", "Le mot commence par la lettre r."],
  },
  {
    text: "Quand on est en colère, on serre les ___.",
    answer: "poings",
    wrong: ["genoux", "oreilles"],
    hints: ["On les ferme très fort.", "Ils sont au bout des bras.", "On les cache parfois dans les poches."],
  },
  {
    text: "Quand on a honte, on baisse la ___.",
    answer: "tête",
    wrong: ["main", "jambe"],
    hints: ["On ne veut pas croiser les regards.", "Elle est en haut du corps.", "Les yeux regardent par terre."],
  },
  {
    text: "Quand on est fatigué, on ___.",
    answer: "bâille",
    wrong: ["saute", "chante"],
    hints: ["On ouvre grand la bouche.", "On a envie de dormir.", "C'est contagieux."],
  },
  {
    text: "Quand on est content, on ___.",
    answer: "sourit",
    wrong: ["bâille", "recule"],
    hints: ["Les coins de la bouche se relèvent.", "Cela se voit sur le visage.", "C'est le contraire de pleurer."],
  },
  {
    text: "On rit quand on ressent de la ___.",
    answer: "joie",
    wrong: ["peur", "honte"],
    hints: ["C'est un sentiment très agréable.", "Il donne envie de danser.", "Le mot est tout petit."],
  },
  {
    text: "La ___ nous fait taper du pied.",
    answer: "colère",
    wrong: ["joie", "fatigue"],
    hints: ["On n'est pas du tout content.", "Le corps est tendu.", "Elle fait monter la voix."],
  },
  {
    text: "Un enfant qui bâille est ___.",
    answer: "fatigué",
    wrong: ["furieux", "joyeux"],
    hints: ["Il a besoin de repos.", "Ses yeux se ferment.", "Il a envie de dormir."],
  },
];

/** « Quand on a peur, on peut ___ en tremblant. » : le mot qui complète, deux fois par palier. */
export function makeCe1MimeGap(ctx: GameContext): GeneratedGame {
  return factGap(ctx, "ce1-mime-trou", "compléter une phrase sur un sentiment", MIME_GAPS, 2);
}

const MIME_WRITES: readonly WriteFact[] = [
  {
    prompt: "Quel sentiment montre quelqu'un qui bâille ? Écris le mot.",
    accepted: ["fatigue", "la fatigue"],
    hints: ["Il a besoin de repos.", "Ses yeux se ferment.", "Le mot commence par la lettre f."],
  },
  {
    prompt: "Quel sentiment montre quelqu'un qui serre les poings ? Écris le mot.",
    accepted: ["colère", "la colère"],
    hints: ["Il n'est pas du tout content.", "Son corps est tendu.", "Le mot commence par la lettre c."],
  },
  {
    prompt: "Quel sentiment montre quelqu'un qui recule en tremblant ? Écris le mot.",
    accepted: ["peur", "la peur"],
    hints: ["Il veut s'éloigner d'un danger.", "Son corps se méfie.", "Le mot commence par la lettre p."],
  },
  {
    prompt: "Quel sentiment montre quelqu'un qui baisse la tête et regarde ses pieds ? Écris le mot.",
    accepted: ["honte", "la honte"],
    hints: ["Il évite le regard des autres.", "Il voudrait se faire tout petit.", "Le mot commence par la lettre h."],
  },
  {
    prompt: "Quel sentiment montre quelqu'un qui saute et qui rit ? Écris le mot.",
    accepted: ["joie", "la joie"],
    hints: ["C'est un sentiment très agréable.", "Il donne envie de danser.", "Le mot commence par la lettre j."],
  },
];

/** « Quel sentiment montre quelqu'un qui bâille ? Écris le mot. » : un mot à écrire, de la liste fermée. */
export function makeCe1MimeWrite(ctx: GameContext): GeneratedGame {
  return factWriteLine(ctx, "ce1-mime-ecrire", "écrire le sentiment d'une posture", MIME_WRITES);
}
