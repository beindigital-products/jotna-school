/**
 * LES GABARITS DES SCIENCES DU CE1, SECONDE MOITIÉ, LA MATIÈRE ET LES OBJETS : les substances autour de nous, l'eau potable, les objets
 * techniques simples (`sc-ce1-substances`, `sc-ce1-eau`, `sc-ce1-objets`). La première moitié (nutrition, respiration, paludisme) est dans
 * `ce1Vivant.ts`.
 *
 * Sur l'échantillon de CE1, le modèle écrivait ici : « Quel aliment se dissout dans l'eau ? » avec la farine parmi les choix
 * (la farine ne se dissout pas), un ordre « bouillir, filtrer » à l'envers de l'usage, « Nomme une manière de séparer le sable de l'eau »
 * (filtrer ET laisser reposer sont justes), « Pourquoi est-il important de fermer un robinet ? » (une question ouverte). Ici chaque
 * exercice lit une ligne d'un tableau FERMÉ de faits sûrs.
 *
 * CE QUE LES FICHES DONNENT, ET CE QUE CE FICHIER N'INVENTE PAS
 * - Substances : le sel et le sucre se dissolvent dans l'eau, le sable non ; mélanger, filtrer, laisser reposer (décanter). Les seuls
 *   produits qui se dissolvent ici sont le sel et le sucre. HORS FICHE, À FAIRE RELIRE : les produits qui ne se dissolvent pas hors
 *   du sable (caillou, gravier, riz, bois, clou, charbon, brique), « le sable tombe au fond », « le filtre retient le sable et pas
 *   le sel ».
 * - Eau potable : d'où vient l'eau (robinet, puits, forage, fleuve) ; la rendre potable (la faire bouillir, la filtrer, quelques gouttes
 *   d'eau de javel) ; la garder dans un récipient propre et couvert. HORS FICHE, À FAIRE RELIRE : les définitions du puits et du forage
 *   (un trou creusé à la main, un trou percé par une machine), « laisser refroidir » après avoir fait bouillir.
 * - Objets : lampe torche, ciseaux, robinet, cadenas (à quoi ils servent, comment ils fonctionnent, comment les entretenir) ; prendre
 *   soin de l'environnement de l'école. HORS FICHE, À FAIRE RELIRE : la règle, le balai, le seau, la craie et le cartable comme objets
 *   usuels ; les gestes de la poubelle, de la trousse et de l'adulte prévenu.
 *
 * RÈGLES POUR AJOUTER UNE LIGNE
 * - Une étiquette est un nom (ou une courte phrase) SEUL, avec sa majuscule, sans article quand c'est un nom (« Sable », « Gouttes de javel »).
 * - Les énoncés n'ont aucun « : », au plus une apostrophe droite, vingt-huit mots au plus.
 * - Aucun indice n'écrit un chiffre ni un mot de quatre lettres ou plus de la bonne réponse, d'une étiquette ou d'une case.
 * - Les mauvais choix ne peuvent pas être une deuxième bonne réponse : seuls le sel et le sucre se dissolvent, le robinet et le seau ne
 *   sont jamais mêlés dans une même question sur l'eau.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { joinFrench } from "./ce1Outils";
import {
  binSort,
  factChoice,
  factGap,
  factWrite,
  GESTURE_STEP_HINTS,
  partOf,
  pickLine,
  pickPairs,
  quarter,
  stepsOrder,
  type Fact,
  type GapFact,
  type Steps,
  type WriteFact,
} from "./ce1SciencesOutils";
import { fresh, originOf, pickFresh, shuffle, takeFresh, type GameContext, type GeneratedGame } from "./shared";
import { choiceGame, type Hints } from "./tableaux";

// ===========================================================================
// LES SUBSTANCES AUTOUR DE NOUS (sc-ce1-substances)
// ===========================================================================

/** Les seuls produits qui se dissolvent dans l'eau, ici. */
const DISSOLVERS = ["Sel", "Sucre"] as const;
/** Des produits qui ne se dissolvent pas dans l'eau : on les voit toujours après avoir remué. */
const SOLIDS = ["Sable", "Caillou", "Gravier", "Riz", "Bois", "Clou", "Charbon", "Brique"] as const;

/** Les paires de produits qui ne se dissolvent pas, pour servir de mauvais choix à « Quel produit se dissout ? ». */
const SOLID_PAIRS = [
  ["Sable", "Caillou"],
  ["Gravier", "Riz"],
  ["Bois", "Clou"],
  ["Charbon", "Brique"],
  ["Sable", "Riz"],
  ["Caillou", "Clou"],
] as const;

type DissolveEntry = { question: string; answer: string; wrong: readonly [string, string]; hints: Hints };

/** Six façons de demander ce qui se dissout, quatre de demander ce qui ne se dissout pas. */
const DISSOLVE_ASKS = [
  "Quel produit se dissout dans l'eau ?",
  "Lequel de ces produits se dissout dans l'eau ?",
  "Quel produit disparaît quand on le remue dans l'eau ?",
  "Lequel de ces produits se mélange à l'eau sans se voir ?",
  "Quel produit ne se voit plus après avoir été remué dans l'eau ?",
  "Quel produit peut-on dissoudre dans l'eau ?",
] as const;
const KEEP_ASKS = [
  "Quel produit ne se dissout pas dans l'eau ?",
  "Lequel de ces produits reste visible dans l'eau ?",
  "Quel produit ne disparaît pas quand on le remue dans l'eau ?",
  "Lequel de ces produits ne se mélange pas à l'eau ?",
] as const;

const DISSOLVE_HINTS: Hints = [
  "Remue chaque produit dans un verre d'eau, dans ta tête.",
  "Un produit qui se dissout ne se voit plus quand on a remué.",
  "Les deux autres produits restent visibles dans le verre.",
];
const KEEP_HINTS: Hints = [
  "Remue chaque produit dans un verre d'eau, dans ta tête.",
  "Un produit qui reste visible après avoir remué ne s'est pas mélangé à l'eau.",
  "Deux des trois produits disparaissent dans l'eau.",
];

/** Les questions « se dissout » (douze : six façons de demander, le sel et le sucre) et « ne se dissout pas » (huit : un produit chacune), mêlées. */
const DISSOLVE_ENTRIES: readonly DissolveEntry[] = (() => {
  const dissolves: DissolveEntry[] = DISSOLVE_ASKS.flatMap((question, i) =>
    DISSOLVERS.map((answer, j): DissolveEntry => ({ question, answer, wrong: [...SOLID_PAIRS[(i + j) % SOLID_PAIRS.length]], hints: DISSOLVE_HINTS })),
  );
  const keeps: DissolveEntry[] = SOLIDS.map((answer, i): DissolveEntry => ({ question: KEEP_ASKS[i % KEEP_ASKS.length], answer, wrong: [DISSOLVERS[0], DISSOLVERS[1]], hints: KEEP_HINTS }));
  // Deux « se dissout » pour une « ne se dissout pas » : chaque niveau en a des deux sortes.
  return Array.from({ length: dissolves.length + keeps.length }, (_, i) => (i % 5 < 3 ? dissolves.shift() ?? keeps.shift()! : keeps.shift() ?? dissolves.shift()!));
})();

/** « Quel produit se dissout dans l'eau ? » ou « Quel produit ne se dissout pas dans l'eau ? » : le sel et le sucre, ou ce qui reste visible. */
export function makeCe1DissolveChoice(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce1-subst-dissout-qcm", "ce qui se dissout dans l'eau", () => {
    const entry = pickLine(ctx, "ce1-subst-dissout-qcm", quarter(DISSOLVE_ENTRIES, ctx.level, 2), (candidate) => `ce1-subst-dissout-qcm:${candidate.question}:${candidate.answer}`);
    return { prompt: entry.question, answer: entry.answer, wrong: entry.wrong, hints: entry.hints };
  });
}

/** « Glisse chaque produit dans la bonne case » : ce qui se dissout, et ce qui reste visible. */
export function makeCe1DissolveSort(ctx: GameContext): GeneratedGame {
  return binSort(
    ctx,
    "ce1-subst-dissout-glisser",
    "ranger les produits qui se dissolvent ou non",
    "Glisse chaque produit dans la bonne case.",
    { zone: "Se dissout", tiles: [...DISSOLVERS] },
    { zone: "Ne se dissout pas", tiles: [...SOLIDS] },
    [
      "Remue chaque produit dans un verre d'eau, dans ta tête.",
      "Certains produits disparaissent dans l'eau, d'autres restent visibles.",
      "Ce que tu mets dans le thé ou dans la sauce disparaît, pas ce qui est dur.",
    ],
  );
}

/** « Parmi ces produits, combien se dissolvent dans l'eau ? » : un nombre à écrire, compté dans la liste. */
export function makeCe1DissolveCount(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "ce1-subst-dissout-compte", () => {
    const count = ctx.rng() < 0.5 ? 1 : 2;
    const dissolvers = shuffle(ctx.rng, DISSOLVERS).slice(0, count);
    const solids = takeFresh(ctx, quarter(SOLIDS, ctx.level, 4 - count + 1), 4 - count, (solid) => `ce1-subst-dissout-compte:${solid}`);
    const shown = shuffle(ctx.rng, [...dissolvers, ...solids]).map((product) => product.toLowerCase());
    return {
      type: "short-answer",
      prompt: `Parmi ces produits, combien se dissolvent dans l'eau ? ${joinFrench(shown).replace(/^./, (letter) => letter.toUpperCase())}. Écris le nombre.`,
      payload: { acceptedAnswers: [String(count)], game: originOf("ce1-subst-dissout-compte", ctx), concept: "compter les produits qui se dissolvent" },
      answerKey: String(count),
      hints: [
        "Remue chaque produit dans un verre d'eau, dans ta tête.",
        "Compte ceux qui ne se voient plus quand on a remué.",
        "Certains produits restent bien visibles, il ne faut pas les compter.",
      ],
    };
  });
}

const BECOMES_LINES: readonly Fact[] = [
  {
    question: "Que devient le sucre quand on le remue dans l'eau ?",
    answer: "Il se dissout",
    wrong: ["Il reste en morceaux visibles", "Il se change en sable"],
    hints: ["Remue du sucre dans un verre d'eau, dans ta tête.", "Au bout d'un moment, on ne le voit plus.", "L'eau devient sucrée sans rien de visible."],
  },
  {
    question: "Que devient le sel quand on le remue dans l'eau ?",
    answer: "Il se dissout",
    wrong: ["Il reste en morceaux visibles", "Il se change en sable"],
    hints: ["Remue du sel dans un verre d'eau, dans ta tête.", "Au bout d'un moment, on ne le voit plus.", "L'eau devient salée sans rien de visible."],
  },
  {
    question: "Un verre d'eau contient du sable. On le laisse reposer. Où va le sable ?",
    answer: "Au fond du verre",
    wrong: ["En haut du verre", "Dans l'air"],
    hints: ["Le sable est plus lourd que l'eau.", "Il descend doucement.", "On le voit s'installer tout en bas."],
  },
  {
    question: "Quel geste retient le sable avec un tissu propre ?",
    answer: "Filtrer",
    wrong: ["Remuer", "Goûter"],
    hints: ["On verse l'eau à travers le tissu.", "Le tissu laisse passer l'eau mais arrête ce qui est gros.", "L'eau passe, le sable reste dessus."],
  },
  {
    question: "Quel geste laisse le sable tomber au fond du verre ?",
    answer: "Laisser reposer",
    wrong: ["Filtrer", "Remuer"],
    hints: ["Il suffit d'attendre.", "On ne touche plus au verre.", "Le calme fait descendre ce qui est lourd."],
  },
  {
    question: "Quel geste répartit le sucre dans toute l'eau ?",
    answer: "Mélanger",
    wrong: ["Filtrer", "Laisser reposer"],
    hints: ["On le fait avec une cuillère.", "La cuillère tourne dans le verre.", "On fait bouger le sucre et l'eau ensemble."],
  },
  {
    question: "On remue du sable dans l'eau, puis on attend. Que se passe-t-il ?",
    answer: "Le sable tombe au fond",
    wrong: ["Le sable disparaît", "Le sable monte en haut"],
    hints: ["Ce solide ne se mélange pas à l'eau.", "Il est plus lourd que l'eau.", "Au bout d'un moment, l'eau en haut redevient claire."],
  },
  {
    question: "On verse une eau sableuse sur un tissu. Que reste-t-il sur le tissu ?",
    answer: "Sable",
    wrong: ["Sel", "Sucre"],
    hints: ["Le tissu arrête ce qui est solide.", "L'eau passe à travers.", "Ce qui reste est ce qui ne s'est pas mélangé."],
  },
  {
    question: "Quel produit peut-on retenir avec un filtre ?",
    answer: "Sable",
    wrong: ["Sel", "Sucre"],
    hints: ["Un filtre arrête ce qui reste visible.", "Ce qui a disparu dans l'eau passe à travers.", "Il y a un seul produit qui ne disparaît pas."],
  },
  {
    question: "Quel geste mélange le sel dans l'eau ?",
    answer: "Remuer avec une cuillère",
    wrong: ["Filtrer avec un tissu", "Attendre sans toucher"],
    hints: ["Un geste fait tourner l'eau.", "Un ustensile de cuisine aide à répartir le sel.", "Il ne faut pas rester immobile."],
  },
];

/**
 * L'ordre des lignes : un niveau lit des lignes voisines (deux par palier), qui n'ont donc jamais la même bonne réponse.
 * Les deux lignes que ce tirage ne lit jamais (les places 4 et 7) servent de réserve.
 */
const BECOMES_ORDER = [0, 2, 3, 6, 5, 1, 9, 7, 4, 8] as const;

/** « Que devient le sucre quand on le remue dans l'eau ? » : un fait de cours sur la dissolution, le mélange, le filtre ou le repos. */
export function makeCe1SubstanceChoice(ctx: GameContext): GeneratedGame {
  return factChoice(ctx, "ce1-subst-devient-qcm", "dissoudre, mélanger, filtrer, laisser reposer", BECOMES_ORDER.map((i) => BECOMES_LINES[i]), 2);
}

const SUBSTANCE_PAIRS: readonly (readonly [string, string])[] = [
  ["Mélanger", "Remuer pour répartir un produit"],
  ["Filtrer", "Passer l'eau dans un tissu propre"],
  ["Laisser reposer", "Attendre que ce qui est lourd tombe"],
  ["Sel", "Il se dissout dans l'eau"],
  ["Sable", "Il reste visible dans l'eau"],
];

/** « Relie chaque mot à ce qu'il veut dire. » */
export function makeCe1SubstanceLink(ctx: GameContext): GeneratedGame {
  return pickPairs(ctx, "ce1-subst-relier", "relier les mots des substances", "Relie chaque mot à ce qu'il veut dire.", SUBSTANCE_PAIRS, [
    "Lis d'abord chaque explication, puis cherche le mot qui lui va.",
    "Trois mots sont à relier, chacun avec son explication.",
    "Commence par la paire dont tu es le plus sûr.",
  ]);
}

const SAND_STEPS_SHORT: Steps = {
  prompt: "Pour séparer le sable de l'eau, mets ces gestes du premier au dernier.",
  sequence: ["Mélange le sable et l'eau", "Laisse reposer le verre", "Verse l'eau claire"],
  hints: GESTURE_STEP_HINTS,
};
const SAND_STEPS_LONG: Steps = {
  prompt: "Pour séparer le sable de l'eau, mets ces gestes du premier au dernier.",
  sequence: ["Mets du sable dans l'eau", "Remue le mélange", "Laisse reposer le verre", "Verse l'eau claire"],
  hints: GESTURE_STEP_HINTS,
};
const SUGAR_STEPS_SHORT: Steps = {
  prompt: "Pour dissoudre du sucre, mets ces gestes du premier au dernier.",
  sequence: ["Mets de l'eau dans un verre", "Ajoute le sucre", "Remue avec une cuillère"],
  hints: GESTURE_STEP_HINTS,
};
const SUGAR_STEPS_LONG: Steps = {
  prompt: "Pour dissoudre du sucre, mets ces gestes du premier au dernier.",
  sequence: ["Prends un verre", "Mets de l'eau dans le verre", "Ajoute le sucre", "Remue avec une cuillère"],
  hints: GESTURE_STEP_HINTS,
};
const SALT_STEPS_SHORT: Steps = {
  prompt: "Pour dissoudre du sel, mets ces gestes du premier au dernier.",
  sequence: ["Mets de l'eau dans un verre", "Ajoute le sel", "Remue avec une cuillère"],
  hints: GESTURE_STEP_HINTS,
};
const SALT_STEPS_LONG: Steps = {
  prompt: "Pour dissoudre du sel, mets ces gestes du premier au dernier.",
  sequence: ["Prends un verre", "Mets de l'eau dans le verre", "Ajoute le sel", "Remue avec une cuillère"],
  hints: GESTURE_STEP_HINTS,
};
const FILTER_STEPS_SHORT: Steps = {
  prompt: "Pour filtrer une eau sableuse, mets ces gestes du premier au dernier.",
  sequence: ["Pose un tissu propre sur un pot", "Verse l'eau sableuse dessus", "Garde l'eau claire"],
  hints: GESTURE_STEP_HINTS,
};
const FILTER_STEPS_LONG: Steps = {
  prompt: "Pour filtrer une eau sableuse, mets ces gestes du premier au dernier.",
  sequence: ["Prends un tissu propre", "Pose-le sur un pot", "Verse l'eau sableuse dessus", "Garde l'eau claire"],
  hints: GESTURE_STEP_HINTS,
};

/** « Pour séparer le sable de l'eau, mets ces gestes du premier au dernier. » : trois étapes puis quatre. */
export function makeCe1SubstanceOrder(ctx: GameContext): GeneratedGame {
  const steps =
    ctx.level <= 2
      ? partOf([SAND_STEPS_SHORT, SUGAR_STEPS_SHORT, FILTER_STEPS_SHORT, SALT_STEPS_SHORT], ctx.level - 1, 2)
      : partOf([SAND_STEPS_LONG, SUGAR_STEPS_LONG, FILTER_STEPS_LONG, SALT_STEPS_LONG], ctx.level - 3, 2);
  return stepsOrder(ctx, "ce1-subst-ordre", "ranger les gestes d'une expérience", steps);
}

const SUBSTANCE_GAPS: readonly GapFact[] = [
  {
    text: "Le sel et le sucre se ___ dans l'eau.",
    answer: "dissolvent",
    wrong: ["cassent", "cachent"],
    hints: ["On ne les voit plus quand on a remué.", "Ils se mêlent à l'eau.", "Le contraire serait de rester visibles."],
  },
  {
    text: "Le sable ne se dissout pas et tombe au ___ du verre.",
    answer: "fond",
    wrong: ["haut", "bord"],
    hints: ["Le sable est lourd.", "Il descend quand on attend.", "C'est tout en bas."],
  },
  {
    text: "Pour retenir le sable, on ___ l'eau avec un tissu propre.",
    answer: "filtre",
    wrong: ["goûte", "mange"],
    hints: ["On verse l'eau à travers le tissu.", "Le tissu arrête le sable.", "C'est le geste qu'on fait avec un tissu."],
  },
  {
    text: "Pour dissoudre le sucre dans l'eau, il faut ___ le mélange.",
    answer: "remuer",
    wrong: ["filtrer", "casser"],
    hints: ["On le fait avec une cuillère.", "La cuillère tourne dans le verre.", "Ce geste répartit le sucre."],
  },
  {
    text: "Le ___ est un produit qui se dissout dans l'eau.",
    answer: "sucre",
    wrong: ["sable", "caillou"],
    hints: ["Il disparaît quand on remue.", "On en met dans le thé.", "Il est blanc et donne un goût doux."],
  },
  {
    text: "Le ___ est un produit qui ne se dissout pas dans l'eau.",
    answer: "sable",
    wrong: ["sel", "sucre"],
    hints: ["On le voit toujours après avoir remué.", "Il tombe au fond du verre.", "On le trouve sur la plage."],
  },
  {
    text: "Dans un verre d'eau salée, on ne voit plus le ___.",
    answer: "sel",
    wrong: ["sable", "caillou"],
    hints: ["Il s'est mélangé à l'eau.", "On le sent seulement au goût.", "On en met dans la cuisine."],
  },
  {
    text: "Pour séparer le sable de l'eau, on peut laisser ___ le mélange.",
    answer: "reposer",
    wrong: ["brûler", "danser"],
    hints: ["Il suffit d'attendre.", "On ne touche plus au verre.", "Le sable descend tout seul."],
  },
];

/** « Le sel et le sucre se ___ dans l'eau. » : le mot qui complète, deux fois par palier. */
export function makeCe1SubstanceGap(ctx: GameContext): GeneratedGame {
  return factGap(ctx, "ce1-subst-trou", "compléter une phrase sur les substances", SUBSTANCE_GAPS, 2);
}

// ===========================================================================
// L'EAU POTABLE (sc-ce1-eau)
// ===========================================================================

const WATER_SOURCES: readonly Fact[] = [
  {
    question: "Quelle source donne de l'eau grâce à un trou creusé dans le sol ?",
    answer: "Puits",
    wrong: ["Robinet", "Fleuve"],
    hints: ["Il faut descendre un seau pour la puiser.", "On le creuse à la main.", "Il est profond et étroit."],
  },
  {
    question: "Quel nom a le trou creusé dans le sol pour trouver de l'eau ?",
    answer: "Puits",
    wrong: ["Robinet", "Fleuve"],
    hints: ["C'est un trou dans la terre.", "On y descend un seau.", "On le trouve dans la cour ou le village."],
  },
  {
    question: "Quelle source est un trou très profond percé par une machine ?",
    answer: "Forage",
    wrong: ["Robinet", "Fleuve"],
    hints: ["Une machine perce la terre très loin.", "Il est plus profond qu'un trou creusé à la main.", "Il apporte l'eau d'en bas."],
  },
  {
    question: "Quel nom a le trou très profond percé par une machine pour trouver l'eau ?",
    answer: "Forage",
    wrong: ["Robinet", "Fleuve"],
    hints: ["Une machine perce la terre.", "Il est très profond.", "Il apporte l'eau du sous-sol."],
  },
  {
    question: "Quelle source est un grand cours d'eau qui coule ?",
    answer: "Fleuve",
    wrong: ["Puits", "Robinet"],
    hints: ["Il avance vers la mer.", "Il est large et long.", "Le Sénégal et la Gambie en sont."],
  },
  {
    question: "Quel nom a un grand cours d'eau qui va vers la mer ?",
    answer: "Fleuve",
    wrong: ["Puits", "Robinet"],
    hints: ["Il coule sans s'arrêter.", "Il est large et long.", "Il finit dans la mer."],
  },
  {
    question: "Quelle source donne de l'eau quand on tourne une poignée ?",
    answer: "Robinet",
    wrong: ["Puits", "Fleuve"],
    hints: ["On le trouve à la maison ou dans la cour.", "On le ferme pour arrêter l'eau.", "L'eau y arrive par un tuyau."],
  },
  {
    question: "Quel objet fait couler l'eau à la maison ?",
    answer: "Robinet",
    wrong: ["Puits", "Fleuve"],
    hints: ["On le tourne pour ouvrir ou fermer.", "L'eau sort d'un tuyau.", "On le trouve près de l'évier."],
  },
];

/** « Quelle source donne de l'eau grâce à un trou creusé dans le sol ? » : le robinet, le puits, le forage ou le fleuve. */
export function makeCe1PotableSourceChoice(ctx: GameContext): GeneratedGame {
  return factChoice(ctx, "ce1-pot-source", "d'où vient l'eau", WATER_SOURCES);
}

const SOURCE_PAIRS: readonly (readonly [string, string])[] = [
  ["Puits", "Un trou creusé dans le sol"],
  ["Forage", "Un trou profond percé par une machine"],
  ["Robinet", "L'eau coule quand on le tourne"],
  ["Fleuve", "Un grand cours d'eau"],
  ["Mare", "De l'eau de pluie dans un creux"],
];

/** « Relie chaque source d'eau à ce qu'elle est. » */
export function makeCe1PotableSourceLink(ctx: GameContext): GeneratedGame {
  return pickPairs(ctx, "ce1-pot-relier", "relier une source d'eau à ce qu'elle est", "Relie chaque source à ce qu'elle est.", SOURCE_PAIRS, [
    "Lis d'abord chaque explication, puis cherche la source qui lui va.",
    "Certaines sources sont creusées, d'autres coulent toutes seules.",
    "Commence par la paire dont tu es le plus sûr.",
  ]);
}

const WATER_GESTURE_LINES: readonly Fact[] = [
  {
    question: "Que fait-on pour rendre une eau douteuse plus sûre à boire ?",
    answer: "On la fait bouillir",
    wrong: ["On la laisse ouverte", "On y ajoute du sable"],
    hints: ["Il faut chauffer l'eau sur le feu.", "La chaleur tue ce qui est dangereux.", "On voit des bulles quand l'eau est prête."],
  },
  {
    question: "Quel geste rend l'eau potable avec de la chaleur ?",
    answer: "La faire bouillir",
    wrong: ["La remuer", "La verser par terre"],
    hints: ["On la met sur le feu.", "On attend qu'elle fasse des bulles.", "Cela dure quelques minutes."],
  },
  {
    question: "Que met-on en quelques gouttes pour rendre l'eau potable ?",
    answer: "Eau de javel",
    wrong: ["Sucre", "Sel"],
    hints: ["C'est un produit pour nettoyer.", "Il en faut très peu.", "Il tue ce qui est dangereux dans l'eau."],
  },
  {
    question: "Quel geste retire les saletés de l'eau avec un tissu propre ?",
    answer: "La filtrer",
    wrong: ["La renverser", "La remuer"],
    hints: ["On verse l'eau à travers le tissu.", "Le tissu arrête les saletés.", "L'eau qui passe est plus claire."],
  },
  {
    question: "Quel geste ne rend pas l'eau potable ?",
    answer: "Y ajouter du sucre",
    wrong: ["La faire bouillir", "Y mettre quelques gouttes de javel"],
    hints: ["Deux gestes sur trois protègent le ventre.", "Un des gestes ne change rien à la propreté.", "Ce qui rend l'eau douce ne la rend pas pure."],
  },
  {
    question: "Lequel de ces gestes ne rend pas l'eau plus sûre ?",
    answer: "La laisser dans un seau ouvert",
    wrong: ["La faire bouillir", "Y mettre quelques gouttes de javel"],
    hints: ["Deux gestes sur trois protègent le ventre.", "La poussière et les mouches entrent facilement.", "Ne rien faire ne protège de rien."],
  },
  {
    question: "Quel geste est à éviter pour avoir une eau potable ?",
    answer: "Y jeter du sable",
    wrong: ["La faire bouillir", "La filtrer"],
    hints: ["La terre et la saleté salissent l'eau.", "Deux gestes sur trois la rendent plus propre.", "On ne met pas de terre dans l'eau qu'on boit."],
  },
  {
    question: "Que peut-on faire d'une eau trouble avant de la faire bouillir ?",
    answer: "La filtrer",
    wrong: ["La renverser", "La remuer fort"],
    hints: ["Le tissu retient les saletés.", "L'eau devient plus claire.", "On la verse à travers un tissu propre."],
  },
];

/** L'ordre des lignes : deux lignes voisines, lues par un même palier, n'ont jamais la même bonne réponse. */
const WATER_GESTURE_ORDER = [0, 2, 3, 4, 1, 5, 7, 6] as const;

/** « Que fait-on pour rendre une eau douteuse plus sûre à boire ? » : bouillir, filtrer ou la javel, deux fois par palier. */
export function makeCe1PotableGestureChoice(ctx: GameContext): GeneratedGame {
  return factChoice(ctx, "ce1-pot-geste", "rendre l'eau potable", WATER_GESTURE_ORDER.map((i) => WATER_GESTURE_LINES[i]), 2);
}

const WATER_KEEPING: readonly Fact[] = [
  {
    question: "Dans quel récipient garde-t-on l'eau potable ?",
    answer: "Un récipient propre et couvert",
    wrong: ["Un récipient sale et ouvert", "Un récipient troué et sale"],
    hints: ["L'eau ne doit pas se salir.", "Un couvercle protège de la poussière.", "Il faut qu'il soit lavé."],
  },
  {
    question: "Pourquoi couvre-t-on le récipient d'eau potable ?",
    answer: "Pour garder l'eau propre",
    wrong: ["Pour la rendre chaude", "Pour la faire bouillir"],
    hints: ["Des mouches et de la poussière peuvent y tomber.", "Un couvercle les arrête.", "Cela protège le ventre."],
  },
  {
    question: "Que fait-on avant de remplir un récipient pour l'eau potable ?",
    answer: "On le lave",
    wrong: ["On le casse", "On le salit"],
    hints: ["Il ne doit pas être sale.", "On utilise de l'eau propre et du savon.", "Cela protège l'eau qu'on va y verser."],
  },
  {
    question: "Que fait-on pour que l'eau potable reste propre dans la jarre ?",
    answer: "On la couvre",
    wrong: ["On la laisse ouverte", "On y met du sable"],
    hints: ["Un couvercle suffit.", "La poussière ne doit pas tomber dedans.", "Elle reste protégée."],
  },
  {
    question: "Où range-t-on le récipient d'eau potable ?",
    answer: "À l'abri de la poussière",
    wrong: ["Près des ordures", "Sous un tas de sable"],
    hints: ["La saleté doit rester loin.", "Un endroit propre et fermé convient.", "Pas à côté de ce qui sent mauvais."],
  },
  {
    question: "Quelle chose peut salir l'eau potable gardée dans un seau ?",
    answer: "La poussière et les mouches",
    wrong: ["Le couvercle propre", "Le seau bien lavé"],
    hints: ["Ce qui vole peut y tomber.", "Un seau ouvert les laisse entrer.", "Ce qui est propre ne la salit pas."],
  },
  {
    question: "Pourquoi lave-t-on le seau avant de mettre l'eau potable dedans ?",
    answer: "Pour ne pas salir l'eau",
    wrong: ["Pour le faire briller", "Pour l'alourdir"],
    hints: ["Un seau sale rend l'eau sale.", "On veut garder l'eau pure.", "C'est une question de santé."],
  },
  {
    question: "Quel récipient garde l'eau potable propre ?",
    answer: "Un seau propre avec son couvercle",
    wrong: ["Un seau sale sans couvercle", "Un seau troué et ouvert"],
    hints: ["Il faut qu'il soit fermé.", "Il faut qu'il soit lavé.", "Un récipient fermé et bien lavé protège l'eau."],
  },
];

/** « Dans quel récipient garde-t-on l'eau potable ? » : propre et couvert. */
export function makeCe1PotableKeepingChoice(ctx: GameContext): GeneratedGame {
  return factChoice(ctx, "ce1-pot-garde", "garder l'eau potable", WATER_KEEPING);
}

/**
 * « Glisse chaque geste dans la bonne case » : ce qui rend l'eau plus sûre, et ce qui ne la rend pas
 * plus sûre. Les cases disent « plus sûre », pas « potable » : un tissu retient les saletés, pas tous
 * les microbes, donc filtrer seul ne rend pas l'eau potable, il la rend seulement plus sûre.
 */
export function makeCe1PotableSort(ctx: GameContext): GeneratedGame {
  return binSort(
    ctx,
    "ce1-pot-glisser",
    "ranger les gestes selon qu'ils rendent l'eau plus sûre",
    "Glisse chaque geste dans la bonne case.",
    { zone: "Rend l'eau plus sûre", tiles: ["Faire bouillir", "Filtrer", "Gouttes de javel"] },
    { zone: "Ne rend pas l'eau plus sûre", tiles: ["Ajouter du sucre", "Ajouter du sable", "Laisser ouvert", "Remuer avec un bâton", "Jeter du sel"] },
    [
      "Pense à ce qui protège le ventre quand on boit.",
      "Un geste qui nettoie ou qui chauffe aide, un geste qui salit ou qui ajoute n'importe quoi n'aide pas.",
      "Trois gestes de la maison chassent une partie des dangers de l'eau.",
    ],
  );
}

const BOIL_STEPS_SHORT: Steps = {
  prompt: "Pour rendre l'eau potable en la chauffant, mets ces gestes du premier au dernier.",
  sequence: ["Verse l'eau dans une casserole", "Fais bouillir l'eau", "Laisse refroidir l'eau"],
  hints: GESTURE_STEP_HINTS,
};
const BOIL_STEPS_LONG: Steps = {
  prompt: "Pour rendre l'eau potable en la chauffant, mets ces gestes du premier au dernier.",
  sequence: ["Verse l'eau dans une casserole", "Fais bouillir l'eau", "Laisse refroidir l'eau", "Garde-la dans un récipient couvert"],
  hints: GESTURE_STEP_HINTS,
};
const KEEP_STEPS_SHORT: Steps = {
  prompt: "Pour garder l'eau potable, mets ces gestes du premier au dernier.",
  sequence: ["Lave le récipient", "Remplis-le d'eau potable", "Mets le couvercle"],
  hints: GESTURE_STEP_HINTS,
};
const KEEP_STEPS_LONG: Steps = {
  prompt: "Pour garder l'eau potable, mets ces gestes du premier au dernier.",
  sequence: ["Lave le récipient", "Remplis-le d'eau potable", "Mets le couvercle", "Range-le à l'abri"],
  hints: GESTURE_STEP_HINTS,
};
const WELL_STEPS_SHORT: Steps = {
  prompt: "Pour boire l'eau du puits, mets ces gestes du premier au dernier.",
  sequence: ["Puise l'eau du puits", "Fais-la bouillir", "Garde-la dans un récipient couvert"],
  hints: GESTURE_STEP_HINTS,
};
const WELL_STEPS_LONG: Steps = {
  prompt: "Pour boire l'eau du puits, mets ces gestes du premier au dernier.",
  sequence: ["Puise l'eau du puits", "Filtre-la avec un tissu propre", "Fais-la bouillir", "Garde-la dans un récipient couvert"],
  hints: GESTURE_STEP_HINTS,
};
const TAP_STEPS_SHORT: Steps = {
  prompt: "Pour remplir un seau propre, mets ces gestes du premier au dernier.",
  sequence: ["Ouvre le robinet", "Remplis le seau", "Ferme le robinet"],
  hints: GESTURE_STEP_HINTS,
};
const TAP_STEPS_LONG: Steps = {
  prompt: "Pour remplir un seau propre, mets ces gestes du premier au dernier.",
  sequence: ["Lave le seau", "Ouvre le robinet", "Remplis le seau", "Ferme le robinet"],
  hints: GESTURE_STEP_HINTS,
};

/** « Pour rendre l'eau potable en la chauffant, mets ces gestes du premier au dernier. » : trois étapes puis quatre. */
export function makeCe1PotableOrder(ctx: GameContext): GeneratedGame {
  const steps =
    ctx.level <= 2
      ? partOf([BOIL_STEPS_SHORT, KEEP_STEPS_SHORT, WELL_STEPS_SHORT, TAP_STEPS_SHORT], ctx.level - 1, 2)
      : partOf([BOIL_STEPS_LONG, KEEP_STEPS_LONG, WELL_STEPS_LONG, TAP_STEPS_LONG], ctx.level - 3, 2);
  return stepsOrder(ctx, "ce1-pot-ordre", "ranger les gestes de l'eau potable", steps);
}

const WATER_GAPS: readonly GapFact[] = [
  {
    text: "On garde l'eau potable dans un récipient ___ et couvert.",
    answer: "propre",
    wrong: ["sale", "troué"],
    hints: ["C'est le contraire de sale.", "Il a été lavé.", "L'eau ne doit pas être salie."],
  },
  {
    text: "Pour rendre l'eau potable, on peut la faire ___.",
    answer: "bouillir",
    wrong: ["geler", "couler"],
    hints: ["On la chauffe sur le feu.", "Des bulles montent.", "L'eau est très chaude."],
  },
  {
    text: "On met quelques gouttes d'eau de ___ dans l'eau pour la rendre potable.",
    answer: "javel",
    wrong: ["sucre", "sel"],
    hints: ["C'est un produit pour nettoyer.", "Il en faut très peu.", "Il vient dans une bouteille."],
  },
  {
    text: "Un ___ est un trou creusé dans le sol pour trouver de l'eau.",
    answer: "puits",
    wrong: ["fleuve", "robinet"],
    hints: ["On y descend un seau.", "Il est profond.", "On le trouve dans la cour."],
  },
  {
    text: "Un ___ est un trou très profond percé par une machine.",
    answer: "forage",
    wrong: ["robinet", "fleuve"],
    hints: ["Une machine perce la terre.", "Il est bien plus profond qu'un trou fait à la main.", "Il apporte l'eau du sous-sol."],
  },
  {
    text: "On tourne le ___ pour faire couler l'eau.",
    answer: "robinet",
    wrong: ["puits", "fleuve"],
    hints: ["On le trouve à la maison.", "L'eau y arrive par un tuyau.", "On le ferme pour arrêter l'eau."],
  },
  {
    text: "Pour retirer les saletés de l'eau, on la ___ avec un tissu propre.",
    answer: "filtre",
    wrong: ["boit", "casse"],
    hints: ["On verse l'eau à travers le tissu.", "Le tissu arrête les saletés.", "C'est le geste qu'on fait avec un tissu."],
  },
  {
    text: "On couvre le récipient pour que l'eau reste ___.",
    answer: "propre",
    wrong: ["sale", "trouble"],
    hints: ["La poussière ne peut pas entrer.", "Elle est protégée.", "C'est le contraire de sale."],
  },
];

/** « On garde l'eau potable dans un récipient ___ et couvert. » : le mot qui complète, deux fois par palier. */
export function makeCe1PotableGap(ctx: GameContext): GeneratedGame {
  return factGap(ctx, "ce1-pot-trou", "compléter une phrase sur l'eau potable", WATER_GAPS, 2);
}

const WATER_WRITES: readonly WriteFact[] = [
  {
    prompt: "Pour rendre l'eau potable, on peut la faire quoi ? Écris le verbe.",
    accepted: ["bouillir", "faire bouillir", "la faire bouillir"],
    hints: ["On chauffe l'eau très fort.", "Lis bien la question avant d'écrire.", "Le mot commence par la lettre b."],
  },
  {
    prompt: "Quel nom a le trou très profond percé par une machine pour trouver l'eau ? Écris le mot.",
    accepted: ["forage", "le forage", "un forage"],
    hints: ["Une machine perce la terre.", "Lis bien la question avant d'écrire.", "Le mot commence par la lettre f."],
  },
  {
    prompt: "Quel produit met-on en quelques gouttes pour rendre l'eau potable ? Écris le mot.",
    accepted: ["javel", "l'eau de javel", "eau de javel", "de l'eau de javel", "la javel"],
    hints: ["C'est un produit pour nettoyer.", "Lis bien la question avant d'écrire.", "Le mot commence par la lettre j."],
  },
  {
    prompt: "Quel nom a le trou creusé dans le sol pour trouver de l'eau ? Écris le mot.",
    accepted: ["puits", "le puits", "un puits"],
    hints: ["On y descend un seau.", "Lis bien la question avant d'écrire.", "Le mot commence par la lettre p."],
  },
  {
    prompt: "Quel objet fait couler l'eau à la maison ? Écris le mot.",
    accepted: ["robinet", "le robinet", "un robinet"],
    hints: ["On le tourne pour ouvrir ou fermer.", "Lis bien la question avant d'écrire.", "Le mot commence par la lettre r."],
  },
];

/** « Quel nom a le trou très profond percé par une machine ? Écris le mot. » : un mot à écrire, de la liste fermée. */
export function makeCe1PotableWrite(ctx: GameContext): GeneratedGame {
  return factWrite(ctx, "ce1-pot-ecrire", "écrire un mot de l'eau potable", WATER_WRITES);
}

// ===========================================================================
// LES OBJETS TECHNIQUES SIMPLES (sc-ce1-objets)
// ===========================================================================

/** Un objet, son nom avec article, le verbe « sert » qui lui va, ce à quoi il sert, et un groupe pour ne pas mêler des usages proches. */
type Tool = { name: string; the: string; serves: "sert" | "servent"; use: string; group: string };

const TOOLS: readonly Tool[] = [
  { name: "Lampe torche", the: "la lampe torche", serves: "sert", use: "éclairer dans le noir", group: "lumière" },
  { name: "Ciseaux", the: "les ciseaux", serves: "servent", use: "couper du papier", group: "couper" },
  { name: "Robinet", the: "le robinet", serves: "sert", use: "faire couler l'eau", group: "eau" },
  { name: "Cadenas", the: "le cadenas", serves: "sert", use: "fermer à clé", group: "fermer" },
  { name: "Règle", the: "la règle", serves: "sert", use: "mesurer une longueur", group: "mesurer" },
  { name: "Balai", the: "le balai", serves: "sert", use: "balayer le sol", group: "nettoyer" },
  { name: "Seau", the: "le seau", serves: "sert", use: "porter de l'eau", group: "eau" },
  { name: "Craie", the: "la craie", serves: "sert", use: "écrire sur le tableau", group: "écrire" },
  { name: "Cartable", the: "le cartable", serves: "sert", use: "porter les cahiers", group: "porter" },
];

const cap = (text: string) => `${text[0].toUpperCase()}${text.slice(1)}`;

/** « À quoi sert la lampe torche ? » : l'usage de l'objet, parmi les usages d'autres objets. Les deux QCM d'objets d'un palier ne parlent pas du même objet. */
export function makeCe1ToolUse(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce1-objet-usage-qcm", "à quoi sert un objet", () => {
    const tool = pickFresh(ctx, quarter(TOOLS, ctx.level, 1), (candidate) => `ce1-objet-outil:${candidate.name}`);
    const others = shuffle(ctx.rng, TOOLS.filter((other) => other.group !== tool.group)).slice(0, 2);
    return {
      prompt: `À quoi ${tool.serves === "sert" ? "sert" : "servent"} ${tool.the} ?`,
      answer: cap(tool.use),
      wrong: others.map((other) => cap(other.use)),
      hints: [
        "Pense à ce que tu fais avec cet objet, à la maison ou à l'école.",
        "Chaque objet sert à une seule chose parmi ces trois.",
        "Imagine-toi en train de t'en servir.",
      ],
    };
  });
}

/** « Quel objet sert à couper du papier ? » : l'objet, parmi trois. */
export function makeCe1ToolWho(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce1-objet-qui-qcm", "quel objet sert à quoi", () => {
    const tool = pickFresh(ctx, quarter(TOOLS, ctx.level, 1), (candidate) => `ce1-objet-outil:${candidate.name}`);
    const others = shuffle(ctx.rng, TOOLS.filter((other) => other.group !== tool.group)).slice(0, 2);
    return {
      prompt: `Quel objet sert à ${tool.use} ?`,
      answer: tool.name,
      wrong: others.map((other) => other.name),
      hints: [
        "Pense à ce que tu veux faire.",
        "Un seul des trois objets convient.",
        "Imagine-toi avec chaque objet dans la main.",
      ],
    };
  });
}

/** Des groupes d'objets qui servent à la même chose : une case de glissé en prend deux ou trois. */
const TOOL_GROUPS = [
  { zone: "Pour couper", tiles: ["Ciseaux", "Couteau", "Machette"] },
  { zone: "Pour éclairer", tiles: ["Lampe torche", "Bougie", "Lampe à pétrole"] },
  { zone: "Pour fermer", tiles: ["Cadenas", "Serrure", "Verrou"] },
  { zone: "Pour mesurer", tiles: ["Règle", "Mètre", "Balance"] },
] as const;

/** Les paires de cases possibles : six couples de groupes. */
const TOOL_PAIRS = TOOL_GROUPS.flatMap((first, i) => TOOL_GROUPS.slice(i + 1).map((second) => [first, second] as const));

/** « Glisse chaque objet dans la bonne case » : deux sortes d'usage. */
export function makeCe1ToolSort(ctx: GameContext): GeneratedGame {
  const [first, second] = pickFresh(ctx, quarter(TOOL_PAIRS, ctx.level, 1), (pair) => `ce1-objet-glisser:${pair[0].zone}:${pair[1].zone}`);
  return binSort(
    ctx,
    "ce1-objet-glisser",
    "ranger des objets selon ce à quoi ils servent",
    "Glisse chaque objet dans la bonne case.",
    { zone: first.zone, tiles: first.tiles },
    { zone: second.zone, tiles: second.tiles },
    [
      "Pense à ce que tu fais avec chaque objet.",
      "Les objets d'une même case servent à la même chose.",
      "Imagine-toi en train de t'en servir.",
    ],
    { easy: 4, hard: 5 },
  );
}

const TOOL_PAIRS_LINK: readonly (readonly [string, string])[] = TOOLS.filter((tool) => tool.name !== "Seau").map((tool) => [tool.name, cap(tool.use)] as const);

/** « Relie chaque objet à son usage. » */
export function makeCe1ToolLink(ctx: GameContext): GeneratedGame {
  return pickPairs(ctx, "ce1-objet-relier", "relier un objet à son usage", "Relie chaque objet à son usage.", TOOL_PAIRS_LINK, [
    "Pense à ce que tu fais avec chaque objet.",
    "Chaque objet sert à une seule des trois choses.",
    "Commence par l'objet que tu connais le mieux.",
  ]);
}

const TOOL_WORKS: readonly Fact[] = [
  {
    question: "Que met-on dans une lampe torche pour qu'elle éclaire ?",
    answer: "Piles",
    wrong: ["Eau", "Sable"],
    hints: ["Elles donnent de l'énergie.", "On les glisse dans le manche.", "Sans elles, la lampe reste éteinte."],
  },
  {
    question: "Que faut-il tourner pour que l'eau coule ?",
    answer: "Robinet",
    wrong: ["Cadenas", "Règle"],
    hints: ["On le trouve près de l'évier.", "L'eau sort d'un tuyau.", "On le ferme pour arrêter l'eau."],
  },
  {
    question: "Comment ouvre-t-on un cadenas ?",
    answer: "Avec une clé",
    wrong: ["Avec une règle", "Avec un seau"],
    hints: ["Elle entre dans une petite fente.", "On la tourne.", "Elle est petite et en métal."],
  },
  {
    question: "Que fait-on quand les piles de la lampe torche sont usées ?",
    answer: "On les change",
    wrong: ["On les mange", "On les jette dans la rue"],
    hints: ["La lampe n'éclaire plus.", "On en met de nouvelles.", "Les vieilles piles ne se jettent pas n'importe où."],
  },
  {
    question: "Comment entretient-on une lampe torche ?",
    answer: "On change les piles usées",
    wrong: ["On la plonge dans l'eau", "On la jette au sol"],
    hints: ["Une lampe qui ne marche plus a besoin d'énergie.", "Il faut penser à ce qui est dedans.", "Prendre soin, c'est ne pas abîmer."],
  },
  {
    question: "Que fait-on des ciseaux après les avoir utilisés ?",
    answer: "On les range fermés",
    wrong: ["On les laisse par terre", "On les jette"],
    hints: ["Ils peuvent blesser s'ils sont ouverts.", "On les met à leur place.", "Prendre soin, c'est ranger."],
  },
  {
    question: "Comment éviter qu'un robinet coule pour rien ?",
    answer: "On le ferme bien",
    wrong: ["On l'ouvre grand", "On le casse"],
    hints: ["L'eau est précieuse.", "On tourne la poignée.", "On arrête l'eau après avoir bu."],
  },
  {
    question: "Que fait-on pour ne pas perdre la clé du cadenas ?",
    answer: "On la range à sa place",
    wrong: ["On la jette", "On la cache dans le sable"],
    hints: ["Une clé perdue ne sert plus.", "On la met toujours au même endroit.", "Prendre soin, c'est ranger."],
  },
  {
    question: "Comment utilise-t-on une règle pour mesurer ?",
    answer: "On la pose le long de l'objet",
    wrong: ["On la plie en quatre morceaux", "On la lance contre le mur"],
    hints: ["Elle a des traits régulièrement espacés.", "Elle reste bien droite.", "Le bord de la chose mesurée suit le bord de la règle."],
  },
];

/** « Que met-on dans une lampe torche pour qu'elle éclaire ? » : comment un objet marche, et comment on l'entretient, deux fois par palier. */
export function makeCe1ToolWorks(ctx: GameContext): GeneratedGame {
  return factChoice(ctx, "ce1-objet-marche-qcm", "comment un objet marche et s'entretient", TOOL_WORKS, 2);
}

const SCHOOL_CARE: readonly Fact[] = [
  {
    question: "Où jette-t-on les papiers à l'école ?",
    answer: "À la poubelle",
    wrong: ["Dans la cour", "Sous la table"],
    hints: ["Elle est faite pour recevoir les déchets.", "On la trouve dans la classe ou dans la cour.", "Cela garde l'école propre."],
  },
  {
    question: "Que fait-on du robinet de la cour après avoir bu ?",
    answer: "On le ferme bien",
    wrong: ["On l'ouvre grand", "On le laisse couler"],
    hints: ["L'eau est précieuse.", "On tourne la poignée.", "On arrête l'eau."],
  },
  {
    question: "Où range-t-on les ciseaux et les crayons après la classe ?",
    answer: "Dans la trousse",
    wrong: ["Par terre", "Dans la poubelle"],
    hints: ["Elle se ferme avec une fermeture.", "On la glisse avec les affaires de la classe.", "Elle garde tout au même endroit."],
  },
  {
    question: "Que fait-on pour garder la classe propre ?",
    answer: "On balaie le sol",
    wrong: ["On jette des papiers", "On salit les murs"],
    hints: ["On utilise un balai.", "Le sol doit être propre.", "Chacun peut aider."],
  },
  {
    question: "Que fait-on quand on voit un robinet qui fuit ?",
    answer: "On prévient un adulte",
    wrong: ["On ne dit rien", "On l'ouvre grand"],
    hints: ["L'eau coule pour rien.", "Quelqu'un doit le réparer.", "On demande de l'aide."],
  },
  {
    question: "Comment prend-on soin des plantes de l'école ?",
    answer: "On les arrose avec soin",
    wrong: ["On les arrache", "On marche dessus"],
    hints: ["Les plantes ont besoin de boire.", "On leur donne de l'eau.", "Il ne faut pas les abîmer."],
  },
  {
    question: "Que fait-on des déchets dans la cour ?",
    answer: "On les ramasse",
    wrong: ["On les laisse", "On les cache dans le puits"],
    hints: ["La cour doit rester propre.", "On les prend avec la main ou un balai.", "Ensuite on les met à la poubelle."],
  },
  {
    question: "Pourquoi ferme-t-on bien le robinet ?",
    answer: "Pour ne pas gaspiller l'eau",
    wrong: ["Pour le faire briller", "Pour le casser"],
    hints: ["L'eau est précieuse.", "Elle ne doit pas couler sans raison.", "On en a besoin plus tard."],
  },
];

/** « Où jette-t-on les papiers à l'école ? » : un geste pour prendre soin de l'école. */
export function makeCe1SchoolCareChoice(ctx: GameContext): GeneratedGame {
  return factChoice(ctx, "ce1-ecole-qcm", "prendre soin de l'école", SCHOOL_CARE);
}

const BATTERY_STEPS_SHORT: Steps = {
  prompt: "Pour changer les piles d'une lampe torche, mets ces gestes du premier au dernier.",
  sequence: ["Ouvre la lampe", "Retire les piles usées", "Mets des piles neuves"],
  hints: GESTURE_STEP_HINTS,
};
const BATTERY_STEPS_LONG: Steps = {
  prompt: "Pour changer les piles d'une lampe torche, mets ces gestes du premier au dernier.",
  sequence: ["Ouvre la lampe", "Retire les piles usées", "Mets des piles neuves", "Ferme la lampe"],
  hints: GESTURE_STEP_HINTS,
};
const GLASS_STEPS_SHORT: Steps = {
  prompt: "Pour boire un verre d'eau, mets ces gestes du premier au dernier.",
  sequence: ["Ouvre le robinet", "Remplis ton verre", "Ferme le robinet"],
  hints: GESTURE_STEP_HINTS,
};
const GLASS_STEPS_LONG: Steps = {
  prompt: "Pour boire un verre d'eau, mets ces gestes du premier au dernier.",
  sequence: ["Prends ton verre", "Ouvre le robinet", "Remplis ton verre", "Ferme le robinet"],
  hints: GESTURE_STEP_HINTS,
};
const LOCK_STEPS_SHORT: Steps = {
  prompt: "Pour ouvrir un cadenas, mets ces gestes du premier au dernier.",
  sequence: ["Mets la clé dans le cadenas", "Tourne la clé", "Retire le cadenas"],
  hints: GESTURE_STEP_HINTS,
};
const LOCK_STEPS_LONG: Steps = {
  prompt: "Pour ouvrir un cadenas, mets ces gestes du premier au dernier.",
  sequence: ["Prends la clé", "Mets la clé dans le cadenas", "Tourne la clé", "Retire le cadenas"],
  hints: GESTURE_STEP_HINTS,
};
const CUT_STEPS_SHORT: Steps = {
  prompt: "Pour couper une feuille, mets ces gestes du premier au dernier.",
  sequence: ["Tiens la feuille", "Coupe le long du trait", "Range les ciseaux"],
  hints: GESTURE_STEP_HINTS,
};
const CUT_STEPS_LONG: Steps = {
  prompt: "Pour couper une feuille, mets ces gestes du premier au dernier.",
  sequence: ["Tiens la feuille", "Ouvre les ciseaux", "Coupe le long du trait", "Range les ciseaux"],
  hints: GESTURE_STEP_HINTS,
};

/** « Pour changer les piles d'une lampe torche, mets ces gestes du premier au dernier. » : trois étapes puis quatre. */
export function makeCe1ToolOrder(ctx: GameContext): GeneratedGame {
  const steps =
    ctx.level <= 2
      ? partOf([BATTERY_STEPS_SHORT, GLASS_STEPS_SHORT, LOCK_STEPS_SHORT, CUT_STEPS_SHORT], ctx.level - 1, 2)
      : partOf([BATTERY_STEPS_LONG, GLASS_STEPS_LONG, LOCK_STEPS_LONG, CUT_STEPS_LONG], ctx.level - 3, 2);
  return stepsOrder(ctx, "ce1-objet-ordre", "ranger les gestes d'un objet", steps);
}

const TOOL_GAPS: readonly GapFact[] = [
  {
    text: "On ouvre un cadenas avec une ___.",
    answer: "clé",
    wrong: ["règle", "craie"],
    hints: ["Elle est petite et en métal.", "Elle entre dans une fente.", "On la tourne."],
  },
  {
    text: "Une lampe torche marche avec des ___.",
    answer: "piles",
    wrong: ["feuilles", "cailloux"],
    hints: ["Elles donnent de l'énergie.", "On les glisse dans le manche.", "On les change quand elles sont usées."],
  },
  {
    text: "Les ___ servent à couper du papier.",
    answer: "ciseaux",
    wrong: ["balais", "seaux"],
    hints: ["Ils ont deux lames.", "On les tient par deux anneaux.", "Ils font des découpages."],
  },
  {
    text: "On ferme le ___ pour ne pas gaspiller l'eau.",
    answer: "robinet",
    wrong: ["balai", "cartable"],
    hints: ["L'eau y coule.", "On tourne la poignée.", "On le trouve près de l'évier."],
  },
  {
    text: "On jette les papiers à la ___.",
    answer: "poubelle",
    wrong: ["table", "fenêtre"],
    hints: ["Elle reçoit les déchets.", "Elle garde l'école propre.", "Elle se trouve dans la classe."],
  },
  {
    text: "La ___ sert à mesurer une longueur.",
    answer: "règle",
    wrong: ["craie", "trousse"],
    hints: ["Elle a des traits régulièrement espacés.", "On la pose le long de l'objet.", "Elle reste bien droite."],
  },
  {
    text: "On écrit sur le tableau avec une ___.",
    answer: "craie",
    wrong: ["règle", "clé"],
    hints: ["Elle est blanche.", "Elle laisse une trace.", "Elle se casse facilement."],
  },
  {
    text: "Le ___ sert à balayer le sol.",
    answer: "balai",
    wrong: ["seau", "cadenas"],
    hints: ["Il a un long manche.", "Il rassemble la poussière.", "On le range dans un coin."],
  },
];

/** « On ouvre un cadenas avec une ___. » : le mot qui complète, deux fois par palier. */
export function makeCe1ToolGap(ctx: GameContext): GeneratedGame {
  return factGap(ctx, "ce1-objet-trou", "compléter une phrase sur un objet", TOOL_GAPS, 2);
}
