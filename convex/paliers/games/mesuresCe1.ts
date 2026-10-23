/**
 * LES MESURES DU CE1 : le mètre, le centimètre et le kilomètre ; le kilogramme et le gramme ; le litre ; les conversions entre unités voisines
 * (`ma-ce1-mesures`).
 *
 * Le modèle écrivait des conversions fausses (« 1 km = 100 m »), des unités sans rapport avec la chose mesurée, des comparaisons de longueurs en
 * unités différentes avec deux bonnes réponses. Ici les conversions et les comparaisons sont FAITES par le code, les unités et les ordres de
 * grandeur viennent de tableaux fermés.
 *
 * CE QUE CE FICHIER NE FAIT PAS SORTIR DE LA FICHE
 * - Trois couples d'unités voisines : le mètre et le centimètre (1 m = 100 cm), le kilogramme et le gramme (1 kg = 1 000 g), le kilomètre et le mètre
 *   (1 km = 1 000 m). Aucun millimètre, décimètre, quintal, tonne, centilitre ni décilitre. Le litre n'a pas de sous-unité.
 * - Les nombres sont des demi-unités au plus (50 cm, 500 g, 500 m) ou des multiples de vingt-cinq : jamais de virgule.
 * - Un palier lit un couple : le mètre et le centimètre d'abord, puis le kilogramme et le gramme, puis le kilomètre et le mètre, puis les trois.
 * - Une unité est écrite en toutes lettres (« Mètre », « Kilogramme ») dans les choix, sans article (« article + nom » demanderait au CI une image
 *   du catalogue), et en symbole (« m », « kg ») dans les nombres.
 * - Aucun indice n'écrit un chiffre ni l'unité de la bonne réponse.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { fresh, originOf, pick, pickFresh, randomInt, shuffle, type GameContext, type GameLevel, type GeneratedGame } from "./shared";
import { CHILDREN, hasHe, pronoun } from "./stories";
import { choiceGame, type Hints } from "./tableaux";
import { formatNumber } from "./patterns";
import { wrongNumbersCe1 } from "./nombresCe1";
import { binSort, factChoice, factGap, pickPairs, type Fact, type GapFact } from "./ce1SciencesOutils";

const show = (n: number) => formatNumber(n);

// ===========================================================================
// LES TROIS COUPLES D'UNITÉS VOISINES
// ===========================================================================

export type Family = "m-cm" | "kg-g" | "km-m";

/** Pour chaque couple : la grande et la petite unité (symbole et mots), ce qu'il faut de petites pour une grande, et ce qu'on mesure. */
export const FAMILY: Record<Family, { big: string; small: string; bigWord: string; smallWord: string; factor: number; thing: string; things: string }> = {
  "m-cm": { big: "m", small: "cm", bigWord: "mètres", smallWord: "centimètres", factor: 100, thing: "longueur", things: "longueurs" },
  "kg-g": { big: "kg", small: "g", bigWord: "kilogrammes", smallWord: "grammes", factor: 1000, thing: "masse", things: "masses" },
  "km-m": { big: "km", small: "m", bigWord: "kilomètres", smallWord: "mètres", factor: 1000, thing: "distance", things: "distances" },
};

const FAMILIES_BY_LEVEL: Record<GameLevel, readonly Family[]> = {
  1: ["m-cm"],
  2: ["kg-g"],
  3: ["km-m", "m-cm"],
  4: ["m-cm", "kg-g", "km-m"],
};

const familyOf = (ctx: GameContext): Family => pick(ctx.rng, FAMILIES_BY_LEVEL[ctx.level]);

/** Le plus grand nombre de grandes unités d'une conversion simple. */
const WHOLE_TOP: Record<GameLevel, number> = { 1: 5, 2: 5, 3: 9, 4: 9 };

const CONVERT_HINTS: Hints = [
  "Compare la grande unité et la petite unité.",
  "Une grande unité contient beaucoup de petites unités.",
  "Pour passer à la petite unité, ajoute des zéros ; pour revenir, enlève-les.",
];

// ===========================================================================
// UNE CONVERSION
// ===========================================================================

export type Conversion = {
  /** Le nombre de départ, avec son unité, tel qu'il s'écrit dans l'énoncé (« 3 m », « 2 m 50 cm », « 4 000 g »). */
  from: string;
  /** L'unité du résultat, en toutes lettres : « centimètres », « kilogrammes ». */
  toWord: string;
  /** L'unité du résultat, en symbole. */
  to: string;
  result: number;
  /** Les erreurs d'enfant : un zéro de trop, un zéro de moins. */
  wrongPool: number[];
  key: string;
};

/** Une conversion : de la grande à la petite unité, de la petite à la grande, ou (au dernier palier) un nombre composé comme 2 m 50 cm. */
export function drawConversion(ctx: GameContext): Conversion {
  let conversion: Conversion | undefined;
  for (let attempt = 0; attempt < 20; attempt++) {
    const family = familyOf(ctx);
    const { big, small, bigWord, smallWord, factor } = FAMILY[family];
    const k = randomInt(ctx.rng, 1, WHOLE_TOP[ctx.level]);
    const compound = ctx.level === 4 && ctx.rng() < 0.4;
    const down = ctx.level <= 2 || compound || ctx.rng() < 0.5;
    if (compound) {
      const rest = pick(ctx.rng, [factor / 4, factor / 2]);
      const total = k * factor + rest;
      conversion = {
        from: `${k} ${big} ${show(rest)} ${small}`,
        toWord: smallWord,
        to: small,
        result: total,
        wrongPool: [total * 10, Math.round(total / 10), k * 10 + rest, k * factor * 10 + rest],
        key: `${family}:composé:${k}:${rest}`,
      };
    } else if (down) {
      conversion = {
        from: `${k} ${big}`,
        toWord: smallWord,
        to: small,
        result: k * factor,
        wrongPool: [k * factor * 10, k * (factor / 10), k * factor * 100],
        key: `${family}:bas:${k}`,
      };
    } else {
      conversion = {
        from: `${show(k * factor)} ${small}`,
        toWord: bigWord,
        to: big,
        result: k,
        wrongPool: [k * 10, k * 100, k * 1000],
        key: `${family}:haut:${k}`,
      };
    }
    if (!ctx.used.has(`ce1-mes-conv:${conversion.key}`)) break;
  }
  ctx.used.add(`ce1-mes-conv:${conversion!.key}`);
  return conversion!;
}

/** « Convertis 3 m en centimètres. » : trois nombres, dont deux ne sont qu'un zéro de trop ou de moins. */
export function makeCe1MesConvert(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce1-mes-convertir", "convertir une mesure dans l'unité voisine", () => {
    const c = drawConversion(ctx);
    const wrong = wrongNumbersCe1(ctx, c.result, c.wrongPool, 1, 1000000);
    return {
      prompt: `Convertis ${c.from} en ${c.toWord}.`,
      answer: `${show(c.result)} ${c.to}`,
      wrong: wrong.map((value) => `${value} ${c.to}`),
      hints: CONVERT_HINTS,
    };
  });
}

/** « Combien de centimètres y a-t-il dans 3 m ? Écris le nombre. » : une réponse courte, « 1 000 » vaut « 1000 ». */
export function makeCe1MesWrite(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "ce1-mes-ecrire", () => {
    const c = drawConversion(ctx);
    return {
      type: "short-answer",
      prompt: `Combien de ${c.toWord} y a-t-il dans ${c.from} ? Écris le nombre.`,
      payload: { acceptedAnswers: [String(c.result)], game: originOf("ce1-mes-ecrire", ctx), concept: "convertir une mesure et écrire le résultat" },
      answerKey: String(c.result),
      hints: [...CONVERT_HINTS],
    };
  });
}

// ===========================================================================
// COMPARER ET RANGER
// ===========================================================================

export type Measure = { base: number; label: string };

/** Le nombre de demi-unités le plus grand d'une mesure de comparaison, selon le palier. */
const HALF_TOP: Record<GameLevel, number> = { 1: 8, 2: 10, 3: 12, 4: 12 };

/**
 * `count` mesures différentes d'un couple : un nombre de demi-unités, écrit en grande unité s'il est entier (« 2 m »), en petite sinon (« 150 cm »). Il y en
 * a toujours au moins une de chaque sorte : il faut convertir pour comparer.
 */
export function drawMeasures(ctx: GameContext, family: Family, count: number): Measure[] {
  const { big, small, factor } = FAMILY[family];
  const half = factor / 2;
  for (let attempt = 0; attempt < 100; attempt++) {
    const picked = shuffle(ctx.rng, Array.from({ length: HALF_TOP[ctx.level] }, (_, i) => i + 1)).slice(0, count);
    if (!picked.some((n) => n % 2 === 0) || !picked.some((n) => n % 2 === 1)) continue;
    return picked.map((n) => ({ base: n * half, label: n % 2 === 0 ? `${n / 2} ${big}` : `${show(n * half)} ${small}` }));
  }
  throw new Error("unreachable");
}

const COMPARE_HINTS: Hints = [
  "Les mesures ne sont pas écrites dans la même unité.",
  "Écris-les toutes dans la petite unité avant de comparer.",
  "Une grande unité ne donne pas toujours la plus grande mesure.",
];

/** « Quelle est la plus grande longueur ? » : trois mesures en deux unités, une seule est la plus grande (ou la plus petite). */
export function makeCe1MesCompare(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce1-mes-comparer", "comparer des mesures écrites dans deux unités", () => {
    const family = familyOf(ctx);
    const measures = drawMeasures(ctx, family, 3);
    const largest = ctx.rng() < 0.5;
    const sorted = [...measures].sort((a, b) => a.base - b.base);
    const answer = largest ? sorted[2] : sorted[0];
    return {
      prompt: `Quelle est la plus ${largest ? "grande" : "petite"} ${FAMILY[family].thing} ?`,
      answer: answer.label,
      wrong: measures.filter((measure) => measure !== answer).map((measure) => measure.label),
      hints: COMPARE_HINTS,
    };
  });
}

/** « Range ces longueurs de la plus petite à la plus grande. » : quatre mesures en deux unités. */
export function makeCe1MesOrder(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "ce1-mes-ranger",
    () => {
      const family = familyOf(ctx);
      const measures = drawMeasures(ctx, family, 4);
      const ascending = ctx.rng() < 0.5;
      const sorted = [...measures].sort((a, b) => (ascending ? a.base - b.base : b.base - a.base));
      return {
        type: "order",
        prompt: `Range ces ${FAMILY[family].things} ${ascending ? "de la plus petite à la plus grande" : "de la plus grande à la plus petite"}.`,
        payload: { correctSequence: sorted.map((measure) => measure.label), game: originOf("ce1-mes-ranger", ctx), concept: "ranger des mesures écrites dans deux unités" },
        answerKey: sorted.map((measure) => measure.label).join(" "),
        hints: [...COMPARE_HINTS],
      };
    },
    (game) => String(game.answerKey),
  );
}

// ===========================================================================
// QUELLE UNITÉ, QUEL ORDRE DE GRANDEUR
// ===========================================================================

const UNIT_HINTS: Hints = [
  "Demande-toi ce que tu mesures : une longueur, une masse ou une quantité d'eau.",
  "Imagine si la chose est très petite ou très grande.",
  "Choisis l'unité dont la taille va avec la chose.",
];

const unit = (question: string, answer: string, wrong: readonly [string, string]): Fact => ({ question, answer, wrong, hints: UNIT_HINTS });

/** Trois questions par palier ; un mot seul sans article, des mauvais choix aussi longs que la bonne réponse. */
export const UNIT_FACTS: readonly Fact[] = [
  // Palier 1
  unit("Quelle unité convient le mieux pour mesurer la longueur de la cour ?", "Mètre", ["Kilogramme", "Litre"]),
  unit("Quelle unité convient le mieux pour mesurer l'eau du seau ?", "Litre", ["Mètre", "Centimètre"]),
  unit("Quelle unité convient le mieux pour peser un gros sac de riz ?", "Kilogramme", ["Kilomètre", "Centimètre"]),
  // Palier 2
  unit("Quelle unité convient le mieux pour mesurer la longueur d'un crayon ?", "Centimètre", ["Kilomètre", "Kilogramme"]),
  unit("Quelle unité convient le mieux pour peser une plume ?", "Gramme", ["Kilogramme", "Mètre"]),
  unit("Quelle unité convient le mieux pour mesurer le lait d'une bouteille ?", "Litre", ["Mètre", "Gramme"]),
  // Palier 3
  unit("Quelle unité convient le mieux pour mesurer la distance entre deux villes ?", "Kilomètre", ["Centimètre", "Gramme"]),
  unit("Quelle unité convient le mieux pour peser un sac de ciment ?", "Kilogramme", ["Kilomètre", "Centimètre"]),
  unit("Quelle unité convient le mieux pour mesurer l'huile du bidon ?", "Litre", ["Mètre", "Gramme"]),
  // Palier 4
  unit("Quelle unité convient le mieux pour mesurer la hauteur d'une porte ?", "Mètre", ["Kilomètre", "Gramme"]),
  unit("Quelle unité convient le mieux pour peser une pomme ?", "Gramme", ["Kilogramme", "Kilomètre"]),
  unit("Quelle unité convient le mieux pour mesurer la longueur d'une gomme ?", "Centimètre", ["Kilomètre", "Kilogramme"]),
];

/** « Quelle unité convient le mieux pour mesurer la longueur de la cour ? » : l'unité parmi trois. */
export function makeCe1MesUnit(ctx: GameContext): GeneratedGame {
  return factChoice(ctx, "ce1-mes-unite", "choisir l'unité qui convient à une mesure", UNIT_FACTS, 3);
}

const SIZE_HINTS: Hints = [
  "Imagine la chose dans ta main ou devant toi.",
  "Pense à une chose que tu connais avec une mesure proche.",
  "Une seule unité va avec la taille de la chose.",
];

const size = (question: string, answer: string, wrong: readonly [string, string]): Fact => ({ question, answer, wrong, hints: SIZE_HINTS });

/** Trois questions par palier ; le même nombre dans les trois choix, seule l'unité change. */
export const SIZE_FACTS: readonly Fact[] = [
  // Palier 1
  size("Un crayon mesure environ combien ?", "15 cm", ["15 m", "15 km"]),
  size("La porte de la classe est haute d'environ combien ?", "2 m", ["2 cm", "2 km"]),
  size("Une règle d'écolier mesure environ combien ?", "30 cm", ["30 m", "30 km"]),
  // Palier 2
  size("La cour de l'école mesure environ combien de long ?", "30 m", ["30 cm", "30 km"]),
  size("La route entre deux villes mesure environ combien ?", "50 km", ["50 m", "50 cm"]),
  size("Un cahier pèse environ combien ?", "200 g", ["200 kg", "200 m"]),
  // Palier 3
  size("Un sac de riz pèse environ combien ?", "25 kg", ["25 g", "25 km"]),
  size("Une plume pèse environ combien ?", "1 g", ["1 kg", "1 m"]),
  size("Un bidon d'huile contient combien environ ?", "5 L", ["5 m", "5 g"]),
  // Palier 4
  size("Une bouteille d'eau contient environ combien ?", "1 L", ["1 m", "1 g"]),
  size("Une pomme pèse environ combien ?", "150 g", ["150 kg", "150 m"]),
  size("Un élève de CE1 mesure environ combien ?", "120 cm", ["120 m", "120 km"]),
];

/** « Un crayon mesure environ combien ? » : le bon ordre de grandeur parmi trois unités. */
export function makeCe1MesSize(ctx: GameContext): GeneratedGame {
  return factChoice(ctx, "ce1-mes-grandeur", "choisir l'ordre de grandeur d'une chose", SIZE_FACTS, 3);
}

// ===========================================================================
// LA PHRASE À TROUS
// ===========================================================================

const GAP_HINTS: Hints = ["Lis la phrase en entier avant de choisir.", "Pense à la taille de la chose et à la valeur des unités.", "Teste chaque choix dans la phrase."];

const gap = (text: string, answer: string, wrong: readonly [string, string]): GapFact => ({ text, answer, wrong, hints: GAP_HINTS });

/** Trois phrases par palier : les égalités à savoir, puis une unité qui va avec la chose. */
export const GAP_FACTS: readonly GapFact[] = [
  // Palier 1
  gap("1 m = ___ cm", "100", ["10", "1 000"]),
  gap("Un crayon mesure 15 ___ de long.", "centimètres", ["mètres", "kilomètres"]),
  gap("La cour de l'école mesure 30 ___ de long.", "mètres", ["centimètres", "kilomètres"]),
  // Palier 2
  gap("1 kg = ___ g", "1 000", ["100", "10"]),
  gap("Un sac de riz pèse 25 ___.", "kilogrammes", ["grammes", "mètres"]),
  gap("Une plume pèse 2 ___.", "grammes", ["kilogrammes", "litres"]),
  // Palier 3
  gap("1 km = ___ m", "1 000", ["100", "10"]),
  gap("La route entre deux villes mesure 50 ___.", "kilomètres", ["mètres", "centimètres"]),
  gap("Un seau contient 10 ___ d'eau.", "litres", ["mètres", "centimètres"]),
  // Palier 4
  gap("2 m = ___ cm", "200", ["20", "2 000"]),
  gap("3 km = ___ m", "3 000", ["300", "30 000"]),
  gap("2 kg = ___ g", "2 000", ["200", "20 000"]),
];

/** « 1 km = ___ m » ou « Un crayon mesure 15 ___ de long. » : le nombre ou l'unité qui manque. */
export function makeCe1MesGap(ctx: GameContext): GeneratedGame {
  return factGap(ctx, "ce1-mes-trou", "compléter une égalité ou une phrase de mesure", GAP_FACTS, 3);
}

// ===========================================================================
// RELIER
// ===========================================================================

/** Des égalités d'unités voisines, chacune avec sa valeur : les deux côtés de toutes les paires sont différents. */
export const EQUALITIES: readonly (readonly [string, string])[] = [
  ["1 m", "100 cm"],
  ["2 m", "200 cm"],
  ["3 m", "300 cm"],
  ["1 kg", "1 000 g"],
  ["2 kg", "2 000 g"],
  ["5 kg", "5 000 g"],
  ["1 km", "1 000 m"],
  ["3 km", "3 000 m"],
];

/** « Relie chaque mesure à la même mesure dans l'autre unité. » : trois égalités prises dans la banque. */
export function makeCe1MesLinks(ctx: GameContext): GeneratedGame {
  return pickPairs(ctx, "ce1-mes-relier", "relier deux écritures de la même mesure", "Relie chaque mesure à la même mesure dans l'autre unité.", EQUALITIES, [
    "Pense à combien de petites unités il y a dans une grande.",
    "Une même mesure peut s'écrire de deux façons.",
    "Commence par la paire dont tu es le plus sûr.",
  ]);
}

// ===========================================================================
// GLISSER
// ===========================================================================

/** Des mesures de longueur, de poids et de liquide, chacune avec ce qu'on veut en savoir. */
export const KINDS_OF_MEASURE = {
  longueur: ["Hauteur d'un arbre", "Longueur d'une corde", "Largeur de la classe", "Distance entre deux villages", "Longueur d'un crayon"],
  poids: ["Poids d'un sac de riz", "Poids d'un poisson", "Poids d'un cahier", "Poids d'une pomme", "Poids d'un bébé"],
  liquide: ["Eau d'un seau", "Lait d'une bouteille", "Huile d'un bidon", "Jus d'une carafe", "Eau d'une marmite"],
} as const;

const SORT_HINTS: Hints = ["Lis chaque mesure en cherchant ce qu'on veut savoir.", "Les deux cases sont deux sortes de mesure différentes.", "Commence par la mesure dont tu es le plus sûr."];

const SORT_PAIRS = {
  1: ["longueur", "liquide"],
  2: ["poids", "liquide"],
  3: ["longueur", "poids"],
  4: ["liquide", "longueur"],
} as const;

const SORT_ZONES = { longueur: "Longueur", poids: "Poids", liquide: "Quantité de liquide" } as const;

/** « Glisse chaque mesure dans la bonne case. » : longueur ou liquide, poids ou liquide, longueur ou poids, selon le palier. */
export function makeCe1MesSort(ctx: GameContext): GeneratedGame {
  const [first, second] = SORT_PAIRS[ctx.level];
  return binSort(
    ctx,
    "ce1-mes-glisser",
    "classer des mesures selon ce qu'on mesure",
    "Glisse chaque mesure dans la bonne case.",
    { zone: SORT_ZONES[first], tiles: KINDS_OF_MEASURE[first] },
    { zone: SORT_ZONES[second], tiles: KINDS_OF_MEASURE[second] },
    SORT_HINTS,
  );
}

// ===========================================================================
// LES PROBLÈMES DE MESURES
// ===========================================================================

type Form = "litres" | "masse" | "longueur" | "distance";

const FORMS_BY_LEVEL: Record<GameLevel, readonly Form[]> = {
  1: ["litres"],
  2: ["masse", "litres"],
  3: ["longueur", "distance"],
  4: ["masse", "longueur", "distance"],
};

const PROBLEM_HINTS: Hints = [
  "Lis bien l'énoncé et repère les unités.",
  "Écris les deux mesures dans la même unité avant de calculer.",
  "Additionne si l'on ajoute, soustrais si l'on enlève.",
];

/** Un problème de mesures : une seule bonne réponse, les erreurs d'enfant (oublier de convertir, ajouter au lieu d'enlever) pour mauvais choix. */
export function makeCe1MesProblem(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce1-mes-probleme", "résoudre un petit problème de mesures", () => {
    const child = pickFresh(ctx, CHILDREN, (candidate) => `ce1-mes-probleme:${candidate.name}`);
    const form = pick(ctx.rng, FORMS_BY_LEVEL[ctx.level]);
    const adding = ctx.rng() < 0.5;
    if (form === "litres") {
      const a = randomInt(ctx.rng, 6, ctx.level === 1 ? 15 : 20);
      const b = randomInt(ctx.rng, 2, a - 2);
      const result = adding ? a + b : a - b;
      return {
        prompt: adding
          ? `Une marmite contient ${a} litres et un bidon ${b} litres. Combien de litres y a-t-il en tout ?`
          : `Un seau contient ${a} litres d'eau. ${child.name} en verse ${b} litres dans une bassine. Combien de litres reste-t-il dans le seau ?`,
        answer: `${result} litres`,
        wrong: wrongNumbersCe1(ctx, result, [adding ? a - b : a + b, a, b], 1, 40).map((value) => `${value} litres`),
        hints: PROBLEM_HINTS,
      };
    }
    const spec = {
      masse: { f: FAMILY["kg-g"], rests: [250, 500, 750] },
      longueur: { f: FAMILY["m-cm"], rests: [25, 50, 75] },
      distance: { f: FAMILY["km-m"], rests: [250, 500, 750] },
    }[form];
    const { small, factor } = spec.f;
    const k = randomInt(ctx.rng, 2, 6);
    const rest = pick(ctx.rng, spec.rests);
    const result = adding ? k * factor + rest : k * factor - rest;
    const prompt = {
      masse: adding
        ? `Un panier contient ${k} kg de mangues et ${show(rest)} g de bananes. Combien de grammes y a-t-il en tout ?`
        : `Un sac de riz pèse ${k} kg. ${child.name} en retire ${show(rest)} g. Combien de grammes reste-t-il dans le sac ?`,
      longueur: adding
        ? `${child.name} a ${k} m de ruban rouge et ${rest} cm de ruban bleu. Combien de centimètres de ruban ${hasHe(child)} en tout ?`
        : `Une corde mesure ${k} m. ${child.name} en coupe ${rest} cm. Combien de centimètres de corde reste-t-il ?`,
      distance: adding
        ? `${child.name} marche ${k} km le matin, puis ${show(rest)} m l'après-midi. Combien de mètres marche-t-${pronoun(child)} en tout ?`
        : `Une route mesure ${k} km. ${child.name} en a déjà fait ${show(rest)} m. Combien de mètres reste-t-il à faire ?`,
    }[form];
    // Les erreurs d'enfant : ne pas convertir (2 + 500), convertir de dix en dix, ajouter à la place d'enlever, se tromper d'un dixième de la grande unité.
    const pool = [adding ? k + rest : k - rest, k * (factor / 10) + (adding ? rest : -rest), adding ? k * factor - rest : k * factor + rest, result - factor / 10, result + factor / 10];
    return {
      prompt,
      answer: `${show(result)} ${small}`,
      wrong: wrongNumbersCe1(ctx, result, pool, 1, 100000).map((value) => `${value} ${small}`),
      hints: [PROBLEM_HINTS[0], "Passe la grande unité en petite unité avant de calculer.", PROBLEM_HINTS[2]],
    };
  });
}
