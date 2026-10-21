/**
 * LES MESURES DU CP : le pas, le pied, l'empan et la coudée, puis le mètre ; le litre ; le kilogramme, le demi-kilogramme et le quart de
 * kilogramme ; comparer, ranger et calculer des mesures (`ma-cp-mesures`).
 *
 * Sur l'échantillon de CP, rien n'était faux en mesures, mais la fiche est une suite de faits fermés (quelle unité pour quelle sorte de
 * mesure, combien de demi-kilogrammes font un kilogramme) et de petits calculs : exactement ce qu'un tableau écrit à la main et une
 * addition faite par le code donnent avec certitude.
 *
 * CE QUE CE FICHIER NE FAIT PAS SORTIR DE LA FICHE
 * - Trois sortes de mesure, chacune avec UNE unité : la longueur (le mètre), la quantité de liquide (le litre), le poids (le
 *   kilogramme). Une chose se dit par ce qu'on veut en savoir (« la longueur de… », « la quantité d'eau dans… », « le poids de… ») :
 *   l'eau d'un seau se pèse aussi, mais ici on en mesure la quantité, et l'énoncé le dit.
 * - Le demi-kilogramme et le quart de kilogramme : deux demi-kilogrammes ou quatre quarts font un kilogramme, deux quarts font un demi.
 *   Aucun gramme, aucun centimètre, aucun demi-litre.
 * - Le pas, le pied, l'empan et la coudée changent d'une personne à l'autre ; seul le mètre est le même pour tous.
 * - Les calculs restent des additions, des soustractions et des multiplications dont un facteur vaut 2 ou 3 (résultat au plus 30),
 *   toujours dans une même unité : jamais des mètres ajoutés à des litres.
 * - Une étiquette qui se glisse ou se relie est un mot seul (« Mètre ») ou une phrase : jamais « article + nom », qui demanderait
 *   au CI une image du catalogue (`templatePictures.test.ts` joue tous les gabarits comme du CI).
 * - Aucun indice n'écrit un chiffre : un résultat se lirait dedans.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { fresh, originOf, pick, pickFresh, randomInt, shuffle, type GameContext, type GameLevel, type GeneratedGame } from "./shared";
import { CHILDREN, pronoun } from "./stories";
import { cap, choiceGame, firstLetter, gapGame, linkGame, sequenceGame, sortGame } from "./tableaux";
import { wrongNumbers } from "./nombresCp";

// ===========================================================================
// LES TROIS SORTES DE MESURE
// ===========================================================================

export type Dimension = "longueur" | "quantite" | "poids";

/** Pour chaque sorte de mesure : son unité (au singulier et au pluriel) et des choses de tous les jours qu'on en mesure. */
export const MEASURE_DIMENSIONS: Record<Dimension, { unit: string; plural: string; things: readonly string[] }> = {
  longueur: {
    unit: "mètre",
    plural: "mètres",
    things: ["la longueur de la cour", "la longueur d'une corde", "la hauteur d'un arbre", "la largeur de la classe", "la longueur d'un tissu"],
  },
  quantite: {
    unit: "litre",
    plural: "litres",
    things: ["la quantité d'eau dans un seau", "la quantité de lait dans une bouteille", "la quantité d'huile dans un bidon", "la quantité de jus dans une carafe"],
  },
  poids: {
    unit: "kilogramme",
    plural: "kilogrammes",
    things: ["le poids d'un sac de riz", "le poids d'un sac de mil", "le poids d'un poisson", "le poids d'un régime de bananes"],
  },
};

const DIMENSION_KEYS: readonly Dimension[] = ["longueur", "quantite", "poids"];

/** Le plus grand nombre servi dans un calcul ou un rangement, selon le palier. */
const TOP: Record<GameLevel, number> = { 1: 10, 2: 20, 3: 40, 4: 50 };

/** `count` nombres différents de [2, top] : jamais « 1 mètre », qui s'accorderait autrement. */
function distinctValues(ctx: GameContext, count: number, top: number): number[] {
  const pool = Array.from({ length: top - 1 }, (_, i) => i + 2);
  return shuffle(ctx.rng, pool).slice(0, count);
}

// ===========================================================================
// QUELLE UNITÉ POUR QUELLE MESURE
// ===========================================================================

/** « Quelle unité sert à mesurer la longueur d'une corde ? » : l'unité parmi les trois. */
export function makeUnitChoice(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "mesure-unite", "choisir l'unité d'une mesure", () => {
    const key = pick(ctx.rng, DIMENSION_KEYS);
    const answer = cap(MEASURE_DIMENSIONS[key].unit);
    return {
      prompt: `Quelle unité sert à mesurer ${pick(ctx.rng, MEASURE_DIMENSIONS[key].things)} ?`,
      answer,
      wrong: DIMENSION_KEYS.filter((other) => other !== key).map((other) => cap(MEASURE_DIMENSIONS[other].unit)),
      hints: [
        "Demande-toi ce que tu veux savoir sur la chose.",
        "Chaque unité sert à une seule sorte de mesure.",
        `Le mot commence par la lettre ${firstLetter(answer)}.`,
      ],
    };
  });
}

/** « Glisse chaque mesure dans la bonne case. » : deux unités, chacune avec ses mesures. */
export function makeUnitSort(ctx: GameContext): GeneratedGame {
  return sortGame(ctx, "mesure-glisser", "classer des mesures selon leur unité", () => {
    const [first, second] = shuffle(ctx.rng, DIMENSION_KEYS);
    const each = ctx.level === 1 ? 2 : 3;
    const zoneOf = (key: Dimension) => `Se mesure en ${MEASURE_DIMENSIONS[key].plural}`;
    return {
      prompt: "Glisse chaque mesure dans la bonne case.",
      zones: [zoneOf(first), zoneOf(second)],
      items: [first, second].flatMap((key) =>
        shuffle(ctx.rng, MEASURE_DIMENSIONS[key].things)
          .slice(0, each)
          .map((text) => ({ text, zone: zoneOf(key) })),
      ),
      hints: [
        "Lis chaque mesure en cherchant ce qu'on veut savoir.",
        "Les deux cases sont deux sortes de mesure différentes.",
        "Commence par la mesure dont tu es le plus sûr.",
      ],
    };
  });
}

/** « Relie chaque mesure à son unité. » : la longueur, la quantité de liquide et le poids, chacun avec son unité. */
export function makeUnitLinks(ctx: GameContext): GeneratedGame {
  return linkGame(ctx, "mesure-relier", "relier une mesure et son unité", () => ({
    prompt: "Relie chaque mesure à son unité.",
    pairs: shuffle(ctx.rng, DIMENSION_KEYS).map((key) => ({ left: pick(ctx.rng, MEASURE_DIMENSIONS[key].things), right: cap(MEASURE_DIMENSIONS[key].unit) })),
    hints: [
      "Demande-toi ce que tu veux savoir sur chaque chose.",
      "Chaque unité sert à une seule sorte de mesure.",
      "Commence par la paire dont tu es le plus sûr.",
    ],
  }));
}

// ===========================================================================
// MESURER AVEC SON CORPS, PUIS AVEC LE MÈTRE
// ===========================================================================

/** La partie du corps de chaque mesure, et deux parties qui ne peuvent pas être la bonne (jamais « pied » pour le pas). */
const BODY: readonly { measure: string; part: string; never: readonly [string, string] }[] = [
  { measure: "en empans", part: "Main", never: ["Pied", "Tête"] },
  { measure: "en pieds", part: "Pied", never: ["Main", "Tête"] },
  { measure: "en coudées", part: "Bras", never: ["Pied", "Tête"] },
  { measure: "en pas", part: "Jambes", never: ["Main", "Tête"] },
];

/** Ce qui change d'un enfant à l'autre : pas, pied, empan, coudée ; le mètre est le même pour tous. */
const BODY_MEASURES = ["Pas", "Pied", "Empan", "Coudée"] as const;

/** « Avec quelle partie du corps mesure-t-on en empans ? » ou « Quelle mesure est la même pour tous les enfants ? ». */
export function makeBodyMeasure(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "mesure-corps", "mesurer avec son corps, puis avec le mètre", () => {
    if (ctx.rng() < 0.7) {
      const entry = pick(ctx.rng, BODY);
      return {
        prompt: `Avec quelle partie du corps mesure-t-on ${entry.measure} ?`,
        answer: entry.part,
        wrong: entry.never,
        hints: [
          "Pense à ce que tu fais pour prendre cette mesure.",
          "Chaque mesure du corps se prend avec une seule partie.",
          `Le mot commence par la lettre ${firstLetter(entry.part)}.`,
        ],
      };
    }
    return {
      prompt: "Quelle mesure est la même pour tous les enfants ?",
      answer: "Mètre",
      wrong: shuffle(ctx.rng, BODY_MEASURES).slice(0, 2),
      hints: [
        "Pense à deux enfants qui mesurent la même table.",
        "Les mesures du corps changent selon la personne.",
        "Cette mesure est la même à l'école et à la boutique.",
      ],
    };
  });
}

// ===========================================================================
// CALCULER AVEC DES MESURES
// ===========================================================================

type Sentence = (a: number, b: number, name: string, he: string) => string;

const SENTENCES: Record<Dimension, { add: Sentence; sub: Sentence }> = {
  longueur: {
    add: (a, b) => `Une corde mesure ${a} mètres et une autre mesure ${b} mètres. Mises bout à bout, combien de mètres mesurent-elles ?`,
    sub: (a, b, name) => `Une corde mesure ${a} mètres. ${name} coupe ${b} mètres de corde. Combien de mètres reste-t-il ?`,
  },
  quantite: {
    add: (a, b) => `Un seau contient ${a} litres d'eau et un autre contient ${b} litres. Combien de litres y a-t-il en tout ?`,
    sub: (a, b, name) => `Un bidon contient ${a} litres d'huile. ${name} en verse ${b} litres. Combien de litres reste-t-il dans le bidon ?`,
  },
  poids: {
    add: (a, b, name, he) => `${name} achète ${a} kilogrammes de riz et ${b} kilogrammes de mil. Combien de kilogrammes achète-t-${he} en tout ?`,
    sub: (a, b, name) => `Un sac de riz pèse ${a} kilogrammes. ${name} en vend ${b} kilogrammes. Combien de kilogrammes reste-t-il dans le sac ?`,
  },
};

/** Une addition ou une soustraction de deux mesures de la même unité : « 12 mètres et 9 mètres, combien en tout ? ». */
export function makeMeasureSum(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "mesure-calcul", "ajouter ou enlever des mesures", () => {
    const key = pick(ctx.rng, DIMENSION_KEYS);
    const child = pickFresh(ctx, CHILDREN, (candidate) => `mesure:${candidate.name}`);
    const add = ctx.rng() < 0.5;
    const top = TOP[ctx.level];
    if (add) {
      const a = randomInt(ctx.rng, 2, top - 2);
      const b = randomInt(ctx.rng, 2, top - a);
      return {
        prompt: SENTENCES[key].add(a, b, child.name, pronoun(child)),
        answer: String(a + b),
        wrong: wrongNumbers(ctx, a + b, [Math.abs(a - b), a, b, a + b + 10, a + b - 10], 0, 100),
        hints: ["Lis l'histoire en entier.", "Quand on met ensemble, on ajoute.", "Additionne les deux nombres de l'histoire."],
      };
    }
    const a = randomInt(ctx.rng, 4, top);
    const b = randomInt(ctx.rng, 2, a - 2);
    return {
      prompt: SENTENCES[key].sub(a, b, child.name, pronoun(child)),
      answer: String(a - b),
      wrong: wrongNumbers(ctx, a - b, [a + b, a, b, a - b + 10, a - b - 10], 0, 100),
      hints: ["Lis l'histoire en entier.", "Quand on enlève, on retire une partie.", "Retire le plus petit nombre du plus grand."],
    };
  });
}

/** « Chaque seau contient 5 litres d'eau. Combien de litres y a-t-il dans 3 seaux ? Écris le nombre. » : un facteur vaut 2 ou 3. */
export function makeMeasureRepeat(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "mesure-repete", () => {
    const key = pick(ctx.rng, DIMENSION_KEYS);
    const count = pick(ctx.rng, [2, 3]);
    const each = randomInt(ctx.rng, 2, ctx.level === 1 ? 5 : 10);
    const total = count * each;
    const prompt = {
      longueur: `Chaque corde mesure ${each} mètres. Combien de mètres y a-t-il dans ${count} cordes ? Écris le nombre.`,
      quantite: `Chaque seau contient ${each} litres d'eau. Combien de litres y a-t-il dans ${count} seaux ? Écris le nombre.`,
      poids: `Chaque sac de riz pèse ${each} kilogrammes. Combien de kilogrammes pèsent ${count} sacs ? Écris le nombre.`,
    }[key];
    return {
      type: "short-answer",
      prompt,
      payload: { acceptedAnswers: [String(total)], game: originOf("mesure-repete", ctx), concept: "répéter une mesure" },
      answerKey: String(total),
      hints: ["Compte combien de fois on prend la même quantité.", "Chaque morceau est pareil.", "Additionne la même quantité plusieurs fois."],
    };
  });
}

// ===========================================================================
// COMPARER ET RANGER
// ===========================================================================

/** Ce qu'on compare dans chaque sorte de mesure : le nom de la chose, l'ordre croissant et la question du plus grand ou du plus petit. */
const COMPARE: Record<Dimension, { things: string; asc: string; desc: string; most: string; least: string }> = {
  longueur: {
    things: "longueurs",
    asc: "de la plus courte à la plus longue",
    desc: "de la plus longue à la plus courte",
    most: "Quelle corde est la plus longue ?",
    least: "Quelle corde est la plus courte ?",
  },
  quantite: {
    things: "quantités d'eau",
    asc: "de la plus petite à la plus grande",
    desc: "de la plus grande à la plus petite",
    most: "Quel seau contient le plus d'eau ?",
    least: "Quel seau contient le moins d'eau ?",
  },
  poids: {
    things: "poids",
    asc: "du plus léger au plus lourd",
    desc: "du plus lourd au plus léger",
    most: "Quel sac est le plus lourd ?",
    least: "Quel sac est le plus léger ?",
  },
};

/** Les trois parts de kilogramme de la fiche, du plus léger au plus lourd : une seule suite juste. */
export const KILO_PARTS = ["Quart de kilogramme", "Demi-kilogramme", "Kilogramme"] as const;

/** « Range ces longueurs, de la plus courte à la plus longue. » ou le quart, le demi et le kilogramme. */
export function makeMeasureOrder(ctx: GameContext): GeneratedGame {
  return sequenceGame(ctx, "mesure-ordre", "ranger des mesures", () => {
    const ascending = ctx.rng() < 0.5;
    if (ctx.level >= 2 && ctx.rng() < 0.35) {
      return {
        prompt: `Range ces poids ${ascending ? COMPARE.poids.asc : COMPARE.poids.desc}.`,
        sequence: ascending ? [...KILO_PARTS] : [...KILO_PARTS].reverse(),
        hints: ["Pense à des sachets de sucre de poids différents.", "Un entier pèse plus que ses parts.", ascending ? "Commence par la plus petite part." : "Commence par le plus gros sac."],
      };
    }
    const key = pick(ctx.rng, DIMENSION_KEYS);
    const count = ctx.level === 1 ? 3 : 4;
    const values = distinctValues(ctx, count, TOP[ctx.level]).sort((x, y) => (ascending ? x - y : y - x));
    return {
      prompt: `Range ces ${COMPARE[key].things} ${ascending ? COMPARE[key].asc : COMPARE[key].desc}.`,
      sequence: values.map((value) => `${value} ${MEASURE_DIMENSIONS[key].plural}`),
      hints: ["Lis bien chaque nombre.", "Compare les nombres, l'unité est la même.", ascending ? "Commence par le plus petit nombre." : "Commence par le plus grand nombre."],
    };
  });
}

/** « Quel sac est le plus lourd ? » : trois mesures de la même unité, la plus grande ou la plus petite. */
export function makeMeasureMost(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "mesure-plus", "comparer des mesures", () => {
    const key = pick(ctx.rng, DIMENSION_KEYS);
    const most = ctx.rng() < 0.5;
    const values = distinctValues(ctx, 3, TOP[ctx.level]);
    const target = most ? Math.max(...values) : Math.min(...values);
    const label = (value: number) => `${value} ${MEASURE_DIMENSIONS[key].plural}`;
    return {
      prompt: most ? COMPARE[key].most : COMPARE[key].least,
      answer: label(target),
      wrong: values.filter((value) => value !== target).map(label),
      hints: ["Lis bien chaque nombre.", "Compare les nombres, l'unité est la même.", most ? "Cherche le plus grand nombre." : "Cherche le plus petit nombre."],
    };
  });
}

// ===========================================================================
// LE DEMI-KILOGRAMME ET LE QUART DE KILOGRAMME
// ===========================================================================

/** Ce que valent plusieurs parts de kilogramme : « deux quarts de kilogramme pèsent autant qu'un demi-kilogramme ». */
const KILO_EQUALS: readonly { count: string; parts: string; equals: (typeof KILO_PARTS)[number] }[] = [
  { count: "Deux", parts: "quarts de kilogramme", equals: "Demi-kilogramme" },
  { count: "Deux", parts: "demi-kilogrammes", equals: "Kilogramme" },
  { count: "Quatre", parts: "quarts de kilogramme", equals: "Kilogramme" },
];

/** Combien de parts font un kilogramme : 2 demi-kilogrammes, 4 quarts. */
const KILO_COUNTS: readonly { plural: string; count: number }[] = [
  { plural: "demi-kilogrammes", count: 2 },
  { plural: "quarts de kilogramme", count: 4 },
];

/**
 * Les parts de kilogramme : combien d'un demi ou d'un quart font un kilogramme, ce que valent deux parts, ou le sucre acheté en sachets.
 * Trois sortes de question, chacune avec UNE bonne réponse.
 */
export function makeKiloParts(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "mesure-kilo", "le demi-kilogramme et le quart de kilogramme", () => {
    const roll = ctx.rng();
    if (roll < 0.3) {
      const entry = pick(ctx.rng, KILO_COUNTS);
      return {
        prompt: `Combien de ${entry.plural} faut-il pour faire un kilogramme ?`,
        answer: String(entry.count),
        wrong: shuffle(ctx.rng, [1, 2, 3, 4, 8].filter((n) => n !== entry.count).map(String)),
        hints: ["Un kilogramme se coupe en parts toutes pareilles.", "Plus la part est petite, plus il en faut.", "Imagine que tu remplis un sachet avec ces parts."],
      };
    }
    if (roll < 0.6) {
      const entry = pick(ctx.rng, KILO_EQUALS);
      return {
        prompt: `${entry.count} ${entry.parts} pèsent autant que quoi ?`,
        answer: entry.equals,
        wrong: KILO_PARTS.filter((part) => part !== entry.equals),
        hints: ["Pense à des sachets de sucre.", "Des parts pareilles remettent ensemble le tout.", "Compare le poids de toutes les parts avec le poids du sachet."],
      };
    }
    const child = pickFresh(ctx, CHILDREN, (candidate) => `kilo:${candidate.name}`);
    const half = ctx.rng() < 0.5;
    return {
      prompt: `${child.name} achète ${half ? "2" : "4"} sachets de sucre d'un ${half ? "demi-kilogramme" : "quart de kilogramme"}. Combien de kilogrammes de sucre achète-t-${pronoun(child)} ?`,
      answer: "1",
      wrong: ["2", "4", "3"],
      hints: ["Pense à ce que pèse chaque sachet.", "Des parts pareilles remettent ensemble le tout.", "Compte combien de sachets il faut pour faire un sac entier."],
    };
  });
}

/** Une phrase à trou sur les parts de kilogramme : « Deux ___ font un kilogramme. ». */
export function makeKiloGap(ctx: GameContext): GeneratedGame {
  return gapGame(ctx, "mesure-kilo-trou", "compléter une phrase sur les parts de kilogramme", () => {
    const rows: { text: string; answer: string; wrong: readonly string[] }[] = [
      { text: "Deux ___ font un kilogramme.", answer: "demi-kilogrammes", wrong: ["quarts de kilogramme", "litres"] },
      { text: "Quatre ___ font un kilogramme.", answer: "quarts de kilogramme", wrong: ["demi-kilogrammes", "litres"] },
      { text: "Un demi-kilogramme est ___ qu'un kilogramme.", answer: "plus léger", wrong: ["plus lourd", "aussi lourd"] },
      { text: "Un kilogramme est ___ qu'un demi-kilogramme.", answer: "plus lourd", wrong: ["plus léger", "aussi lourd"] },
      { text: "Un quart de kilogramme est ___ qu'un demi-kilogramme.", answer: "plus léger", wrong: ["plus lourd", "aussi lourd"] },
    ];
    const row = pick(ctx.rng, rows);
    return {
      prompt: "Complète la phrase.",
      text: row.text,
      answer: row.answer,
      wrong: row.wrong,
      hints: ["Relis la phrase en entier.", "Pense à des sachets de sucre.", "Cherche ce qui rend la phrase vraie."],
    };
  });
}
