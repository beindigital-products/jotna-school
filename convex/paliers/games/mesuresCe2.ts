/**
 * LES MESURES DU CE2 : les longueurs (km, m, dm, cm, mm), les masses (kg, g), les contenances (L, dL, cL), les durées (h, min, s) et les conversions
 * entre unités voisines (`ma-ce2-mesures`).
 *
 * La thématique n'avait aucun jeu de code. Le modèle écrivait des conversions fausses (« 1 dm = 100 cm »), mélangeait une unité de longueur et une unité de
 * contenance, comparait des mesures dans deux unités avec deux bonnes réponses. Ici les conversions, les comparaisons et les durées sont FAITES par le code,
 * les unités et les ordres de grandeur viennent de tableaux fermés.
 *
 * CE QUE CE FICHIER NE FAIT PAS SORTIR DE LA FICHE
 * - Neuf couples d'unités voisines : m-cm (100), kg-g (1 000), km-m (1 000) au premier palier ; m-dm, dm-cm, cm-mm (10) au deuxième ; L-dL, L-cL (100),
 *   dL-cL (10) au troisième ; tous au dernier. Aucune tonne, aucun quintal, aucun hectolitre, aucune virgule : les nombres sont des entiers.
 * - Une conversion écrit « 3 m en centimètres » ou « 300 cm en mètres » ; au dernier palier, un nombre composé comme « 2 m 50 cm » (le reste est toujours un
 *   quart, une demi ou trois quarts de l'unité pour les couples de cent et de mille, un petit nombre pour les couples de dix).
 * - Les durées : une heure vaut soixante minutes, une minute soixante secondes ; jamais un quart ni une demi-heure en décimal. Une heure s'écrit « 17 h 05 » ;
 *   l'heure de fin d'une durée reste dans la journée.
 * - Les mesures d'une comparaison sont dans deux unités : il faut convertir pour comparer, et l'une est toujours une valeur entière de la grande unité.
 * - Une unité est écrite en toutes lettres (« Mètre », « Kilogramme ») dans les choix, sans article, et en symbole (« m », « kg ») dans les nombres.
 * - Aucun indice n'écrit un chiffre ni l'unité de la bonne réponse.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { fresh, originOf, pick, pickFresh, randomInt, shuffle, type GameContext, type GameLevel, type GeneratedGame } from "./shared";
import { CHILDREN, hasHe, pronoun } from "./stories";
import { choiceGame, gapGame, linkGame, type Hints } from "./tableaux";
import { formatNumber } from "./patterns";
import { wrongNumbersCe1 } from "./nombresCe1";
import { binSort } from "./ce1SciencesOutils";
import { ce2Gap, ce2Question, gr, hints, qr } from "./ce2Outils";

const show = (n: number) => formatNumber(n);

// ===========================================================================
// LES NEUF COUPLES D'UNITÉS VOISINES
// ===========================================================================

export type Family = "m-cm" | "kg-g" | "km-m" | "m-dm" | "dm-cm" | "cm-mm" | "L-dL" | "L-cL" | "dL-cL";

export type FamilyInfo = {
  big: string;
  small: string;
  bigWord: string;
  smallWord: string;
  /** Ce qu'il faut de petites unités pour une grande. */
  factor: number;
  thing: "longueur" | "distance" | "masse" | "contenance";
  things: string;
  /** Les restes d'un nombre composé : jamais de virgule. */
  rests: readonly number[];
};

export const FAMILY: Record<Family, FamilyInfo> = {
  "m-cm": { big: "m", small: "cm", bigWord: "mètres", smallWord: "centimètres", factor: 100, thing: "longueur", things: "longueurs", rests: [25, 50, 75] },
  "kg-g": { big: "kg", small: "g", bigWord: "kilogrammes", smallWord: "grammes", factor: 1000, thing: "masse", things: "masses", rests: [250, 500, 750] },
  "km-m": { big: "km", small: "m", bigWord: "kilomètres", smallWord: "mètres", factor: 1000, thing: "distance", things: "distances", rests: [250, 500, 750] },
  "m-dm": { big: "m", small: "dm", bigWord: "mètres", smallWord: "décimètres", factor: 10, thing: "longueur", things: "longueurs", rests: [2, 5, 8] },
  "dm-cm": { big: "dm", small: "cm", bigWord: "décimètres", smallWord: "centimètres", factor: 10, thing: "longueur", things: "longueurs", rests: [3, 5, 7] },
  "cm-mm": { big: "cm", small: "mm", bigWord: "centimètres", smallWord: "millimètres", factor: 10, thing: "longueur", things: "longueurs", rests: [2, 5, 8] },
  "L-dL": { big: "L", small: "dL", bigWord: "litres", smallWord: "décilitres", factor: 10, thing: "contenance", things: "contenances", rests: [2, 5, 8] },
  "L-cL": { big: "L", small: "cL", bigWord: "litres", smallWord: "centilitres", factor: 100, thing: "contenance", things: "contenances", rests: [25, 50, 75] },
  "dL-cL": { big: "dL", small: "cL", bigWord: "décilitres", smallWord: "centilitres", factor: 10, thing: "contenance", things: "contenances", rests: [2, 5, 8] },
};

const ALL_FAMILIES = Object.keys(FAMILY) as Family[];

export const FAMILIES_BY_LEVEL: Record<GameLevel, readonly Family[]> = {
  1: ["m-cm", "kg-g", "km-m"],
  2: ["m-dm", "dm-cm", "cm-mm"],
  3: ["L-dL", "L-cL", "dL-cL"],
  4: ALL_FAMILIES,
};

const familyOf = (ctx: GameContext): Family => pick(ctx.rng, FAMILIES_BY_LEVEL[ctx.level]);

/** Le plus grand nombre de grandes unités d'une conversion simple. */
const WHOLE_TOP: Record<GameLevel, number> = { 1: 5, 2: 6, 3: 7, 4: 9 };

const CONVERT_HINTS: Hints = [
  "Compare la grande unité et la petite unité.",
  "Une grande unité contient beaucoup de petites unités.",
  "Pour passer à la petite unité, multiplie ; pour revenir, partage.",
];

// ===========================================================================
// UNE CONVERSION
// ===========================================================================

export type Conversion = {
  /** Le nombre de départ avec son unité, tel qu'il s'écrit dans l'énoncé (« 3 m », « 2 m 50 cm », « 4 000 g »). */
  from: string;
  /** Le début de l'égalité à compléter quand ce n'est pas un nombre composé (« 3 m », « 400 cm »). */
  toWord: string;
  to: string;
  result: number;
  /** Les erreurs d'enfant : un zéro de trop, un zéro de moins, ne pas convertir. */
  wrongPool: number[];
  key: string;
  /** « down » : vers la petite unité ; « up » : vers la grande ; « compound » : un nombre composé vers la petite unité. */
  direction: "down" | "up" | "compound";
  family: Family;
  k: number;
  rest?: number;
};

/** Une conversion : de la grande à la petite unité, de la petite à la grande, ou (au dernier palier) un nombre composé comme 2 m 50 cm. */
export function drawConversion(ctx: GameContext, allowCompound = true): Conversion {
  let conversion: Conversion | undefined;
  for (let attempt = 0; attempt < 30; attempt++) {
    const family = familyOf(ctx);
    const { big, small, bigWord, smallWord, factor, rests } = FAMILY[family];
    const k = randomInt(ctx.rng, 1, WHOLE_TOP[ctx.level]);
    const compound = allowCompound && ctx.level === 4 && ctx.rng() < 0.4;
    const down = ctx.level === 1 || compound || ctx.rng() < 0.5;
    if (compound) {
      const rest = pick(ctx.rng, rests);
      const total = k * factor + rest;
      conversion = {
        from: `${k} ${big} ${show(rest)} ${small}`,
        toWord: smallWord,
        to: small,
        result: total,
        wrongPool: [total * 10, Math.round(total / 10), k + rest, k * factor * 10 + rest],
        key: `${family}:composé:${k}:${rest}`,
        direction: "compound",
        family,
        k,
        rest,
      };
    } else if (down) {
      conversion = {
        from: `${k} ${big}`,
        toWord: smallWord,
        to: small,
        result: k * factor,
        wrongPool: [k * factor * 10, k * (factor / 10), k * factor * 100],
        key: `${family}:bas:${k}`,
        direction: "down",
        family,
        k,
      };
    } else {
      conversion = {
        from: `${show(k * factor)} ${small}`,
        toWord: bigWord,
        to: big,
        result: k,
        wrongPool: [k * 10, k * 100, k * 1000],
        key: `${family}:haut:${k}`,
        direction: "up",
        family,
        k,
      };
    }
    if (!ctx.used.has(`ce2-mes-conv:${conversion.key}`)) break;
  }
  ctx.used.add(`ce2-mes-conv:${conversion!.key}`);
  return conversion!;
}

/** « Convertis 3 m en centimètres. » : trois nombres, dont deux ne sont qu'un zéro de trop ou de moins. */
export function makeCe2MesConvert(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce2-mes-convertir", "convertir une mesure dans l'unité voisine", () => {
    const c = drawConversion(ctx);
    return {
      prompt: `Convertis ${c.from} en ${c.toWord}.`,
      answer: `${show(c.result)} ${c.to}`,
      wrong: wrongNumbersCe1(ctx, c.result, c.wrongPool, 1, 1000000).map((value) => `${value} ${c.to}`),
      hints: CONVERT_HINTS,
    };
  });
}

/** « Combien de centimètres y a-t-il dans 3 m ? Écris le nombre. » : une réponse courte, « 1 000 » vaut « 1000 ». */
export function makeCe2MesWrite(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "ce2-mes-ecrire", () => {
    const c = drawConversion(ctx);
    return {
      type: "short-answer",
      prompt: `Combien de ${c.toWord} y a-t-il dans ${c.from} ? Écris le nombre.`,
      payload: { acceptedAnswers: [String(c.result)], game: originOf("ce2-mes-ecrire", ctx), concept: "convertir une mesure et écrire le résultat" },
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
export function makeCe2MesCompare(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce2-mes-comparer", "comparer des mesures écrites dans deux unités", () => {
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
export function makeCe2MesOrder(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "ce2-mes-ranger",
    () => {
      const family = familyOf(ctx);
      const measures = drawMeasures(ctx, family, 4);
      const ascending = ctx.rng() < 0.5;
      const sorted = [...measures].sort((a, b) => (ascending ? a.base - b.base : b.base - a.base));
      return {
        type: "order",
        prompt: `Range ces ${FAMILY[family].things} ${ascending ? "de la plus petite à la plus grande" : "de la plus grande à la plus petite"}.`,
        payload: { correctSequence: sorted.map((measure) => measure.label), game: originOf("ce2-mes-ranger", ctx), concept: "ranger des mesures écrites dans deux unités" },
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
  "Demande-toi ce que tu mesures, une longueur, une masse ou une quantité de liquide.",
  "Imagine si la chose est très petite ou très grande.",
  "Choisis l'unité dont la taille va avec la chose.",
];

const unit = (prompt: string, answer: string, wrong: readonly [string, string]) => qr(prompt, answer, wrong, UNIT_HINTS);

/** Seize questions, quatre par palier ; un mot seul sans article, puis au dernier palier l'ordre de grandeur (le même nombre, seule l'unité change). */
export const UNIT_ROWS = [
  // Palier 1
  unit("Quelle unité convient le mieux pour mesurer la longueur de la cour ?", "Mètre", ["Kilogramme", "Litre"]),
  unit("Quelle unité convient le mieux pour mesurer l'eau de la bassine ?", "Litre", ["Mètre", "Gramme"]),
  unit("Quelle unité convient le mieux pour peser un sac de riz ?", "Kilogramme", ["Kilomètre", "Centimètre"]),
  unit("Quelle unité convient le mieux pour mesurer la distance entre deux villes ?", "Kilomètre", ["Centimètre", "Gramme"]),
  // Palier 2
  unit("Quelle unité convient le mieux pour mesurer la hauteur d'une fourmi ?", "Millimètre", ["Kilomètre", "Kilogramme"]),
  unit("Quelle unité convient le mieux pour mesurer la longueur d'un crayon ?", "Centimètre", ["Kilomètre", "Litre"]),
  unit("Quelle unité convient le mieux pour peser une plume ?", "Gramme", ["Kilogramme", "Mètre"]),
  unit("Quelle unité convient le mieux pour mesurer le sirop d'une cuillère ?", "Centilitre", ["Kilomètre", "Gramme"]),
  // Palier 3
  unit("Quelle unité convient le mieux pour mesurer le jus d'un verre ?", "Décilitre", ["Kilomètre", "Gramme"]),
  unit("Quelle unité convient le mieux pour mesurer la hauteur d'une porte ?", "Mètre", ["Kilomètre", "Gramme"]),
  unit("Quelle unité convient le mieux pour peser une pomme ?", "Gramme", ["Kilomètre", "Litre"]),
  unit("Quelle unité convient le mieux pour mesurer l'eau du grand bidon ?", "Litre", ["Millimètre", "Gramme"]),
  // Palier 4
  qr("Un crayon mesure environ combien ?", "15 cm", ["15 m", "15 km"], hints("Imagine la chose dans ta main.", "Pense à une chose que tu connais avec une mesure proche.", "Une seule unité va avec la taille de la chose.")),
  qr("Une bouteille d'eau contient environ combien ?", "1 L", ["1 m", "1 g"], hints("Imagine la chose devant toi.", "Pense à ce qu'on mesure : une quantité de liquide.", "Une seule unité va avec ce qu'on mesure.")),
  qr("Une pomme pèse environ combien ?", "150 g", ["150 kg", "150 m"], hints("Imagine la chose dans ta main.", "Pense à une chose que tu connais avec une masse proche.", "Une seule unité va avec la taille de la chose.")),
  qr("Un élève de CE2 mesure environ combien ?", "130 cm", ["130 m", "130 km"], hints("Imagine un élève debout à côté de toi.", "Pense à ta propre taille.", "Une seule unité va avec la taille d'un élève.")),
];

/** « Quelle unité convient le mieux pour mesurer la longueur de la cour ? » : l'unité parmi trois, puis « combien environ ? ». */
export function makeCe2MesUnit(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "ce2-mes-unite", "choisir l'unité ou l'ordre de grandeur d'une mesure", UNIT_ROWS);
}

// ===========================================================================
// LA PHRASE À TROUS
// ===========================================================================

const gap = (text: string, answer: string, wrong: readonly [string, string]) =>
  gr(text, answer, wrong, hints("Lis la phrase en entier avant de choisir.", "Pense à la taille de la chose et à la valeur des unités.", "Teste chaque choix dans la phrase."));

/** Huit phrases, deux par palier : une unité qui va avec la chose. */
export const GAP_ROWS = [
  // Palier 1
  gap("Un crayon mesure 15 ___ de long.", "centimètres", ["mètres", "kilomètres"]),
  gap("Un sac de riz pèse 25 ___.", "kilogrammes", ["grammes", "mètres"]),
  // Palier 2
  gap("Une table mesure 8 ___ de large.", "décimètres", ["kilomètres", "millimètres"]),
  gap("Une cuillère de sirop contient 5 ___.", "centilitres", ["litres", "kilomètres"]),
  // Palier 3
  gap("Une bouteille contient 1 ___ d'eau.", "litre", ["mètre", "gramme"]),
  gap("Une pièce de monnaie a 2 ___ d'épaisseur.", "millimètres", ["mètres", "kilomètres"]),
  // Palier 4
  gap("Un verre contient 2 ___ de jus.", "décilitres", ["litres", "kilomètres"]),
  gap("La route entre deux villes mesure 40 ___.", "kilomètres", ["mètres", "centimètres"]),
];

/** « 3 m = ___ cm » ou « Un crayon mesure 15 ___ de long. » : le nombre ou l'unité qui manque. */
export function makeCe2MesGap(ctx: GameContext): GeneratedGame {
  if (ctx.rng() < 0.5) return ce2Gap(ctx, "ce2-mes-trou", "compléter une phrase de mesure", GAP_ROWS);
  return gapGame(ctx, "ce2-mes-trou", "compléter une égalité de mesures", () => {
    const c = drawConversion(ctx, false);
    return {
      prompt: "Complète l'égalité.",
      text: `${c.from} = ___ ${c.to}`,
      answer: show(c.result),
      wrong: wrongNumbersCe1(ctx, c.result, c.wrongPool, 1, 1000000),
      hints: CONVERT_HINTS,
    };
  });
}

// ===========================================================================
// RELIER
// ===========================================================================

/** « Relie chaque mesure à la même mesure dans l'autre unité. » : trois égalités, tous les côtés différents. */
export function makeCe2MesLinks(ctx: GameContext): GeneratedGame {
  return linkGame(ctx, "ce2-mes-relier", "relier deux écritures de la même mesure", () => {
    const pairs: { left: string; right: string }[] = [];
    const oneFamily = ctx.level < 4 ? familyOf(ctx) : undefined;
    for (let attempt = 0; attempt < 300 && pairs.length < 3; attempt++) {
      const family = oneFamily ?? familyOf(ctx);
      const { big, small, factor } = FAMILY[family];
      const k = randomInt(ctx.rng, 1, 9);
      const left = `${k} ${big}`;
      const right = `${show(k * factor)} ${small}`;
      if (pairs.some((pair) => pair.left === left || pair.right === right)) continue;
      pairs.push({ left, right });
    }
    return {
      prompt: "Relie chaque mesure à la même mesure dans l'autre unité.",
      pairs: shuffle(ctx.rng, pairs),
      hints: ["Pense à combien de petites unités il y a dans une grande.", "Une même mesure peut s'écrire de deux façons.", "Commence par la paire dont tu es le plus sûr."],
    };
  });
}

// ===========================================================================
// GLISSER
// ===========================================================================

export const KINDS_OF_MEASURE = {
  longueur: ["Hauteur d'un baobab", "Longueur d'une corde", "Largeur de la classe", "Distance entre deux villes", "Épaisseur d'un cahier", "Longueur d'un crayon"],
  masse: ["Masse d'un sac de riz", "Masse d'un poisson", "Masse d'un cahier", "Masse d'une pomme", "Masse d'un bébé", "Masse d'une valise"],
  contenance: ["Eau d'un seau", "Lait d'une bouteille", "Huile d'un bidon", "Jus d'une carafe", "Eau d'une marmite", "Sirop d'une cuillère"],
} as const;

const SORT_PAIRS = {
  1: ["longueur", "masse"],
  2: ["longueur", "contenance"],
  3: ["masse", "contenance"],
  4: ["contenance", "longueur"],
} as const;

const SORT_ZONES = { longueur: "Longueur", masse: "Masse", contenance: "Contenance" } as const;

/** « Glisse chaque mesure dans la bonne case. » : longueur ou masse, longueur ou contenance, masse ou contenance, selon le palier. */
export function makeCe2MesSort(ctx: GameContext): GeneratedGame {
  const [first, second] = SORT_PAIRS[ctx.level];
  return binSort(
    ctx,
    "ce2-mes-glisser",
    "classer des mesures selon ce qu'on mesure",
    "Glisse chaque mesure dans la bonne case.",
    { zone: SORT_ZONES[first], tiles: KINDS_OF_MEASURE[first] },
    { zone: SORT_ZONES[second], tiles: KINDS_OF_MEASURE[second] },
    ["Lis chaque mesure en cherchant ce qu'on veut savoir.", "Les deux cases sont deux sortes de mesure différentes.", "Commence par la mesure dont tu es le plus sûr."],
  );
}

// ===========================================================================
// LES DURÉES
// ===========================================================================

/** « 17 h 05 », « 8 h » : une heure comme à l'école. */
export const clockText = (total: number): string => {
  const hour = Math.floor(total / 60);
  const minute = total % 60;
  return minute === 0 ? `${hour} h` : `${hour} h ${String(minute).padStart(2, "0")}`;
};

const DURATION_HINTS: Hints = [
  "Pense à ce que contient une heure ou une minute.",
  "Une heure contient soixante minutes, une minute contient soixante secondes.",
  "Multiplie pour passer à la plus petite unité.",
];

/**
 * Les durées. Premier palier : des heures en minutes. Deuxième : des minutes en secondes. Troisième : des heures et des minutes en minutes, ou des minutes
 * en heures et minutes. Dernier : l'heure de fin d'une séance.
 */
export function makeCe2MesDuration(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce2-mes-duree", "calculer avec des heures, des minutes et des secondes", () => {
    if (ctx.level === 1) {
      const h = pickFresh(ctx, [2, 3, 4, 5, 6], (n) => `ce2-mes:duree-h:${n}`);
      return {
        prompt: `Combien de minutes y a-t-il dans ${h} h ?`,
        answer: String(60 * h),
        wrong: wrongNumbersCe1(ctx, 60 * h, [h * 100, h * 10, h * 30, h * 50], 1, 1000),
        hints: DURATION_HINTS,
      };
    }
    if (ctx.level === 2) {
      const m = pickFresh(ctx, [2, 3, 4, 5, 6], (n) => `ce2-mes:duree-min:${n}`);
      return {
        prompt: `Combien de secondes y a-t-il dans ${m} min ?`,
        answer: String(60 * m),
        wrong: wrongNumbersCe1(ctx, 60 * m, [m * 100, m * 10, m * 30, m * 50], 1, 1000),
        hints: DURATION_HINTS,
      };
    }
    if (ctx.level === 3) {
      const minutes = pick(ctx.rng, [15, 20, 30, 40, 45]);
      if (ctx.rng() < 0.5) {
        const h = pickFresh(ctx, [2, 3, 4], (n) => `ce2-mes:duree-hm:${n}:${minutes}`);
        return {
          prompt: `Combien de minutes y a-t-il dans ${h} h ${minutes} min ?`,
          answer: String(60 * h + minutes),
          wrong: wrongNumbersCe1(ctx, 60 * h + minutes, [h * 100 + minutes, h + minutes, h * 60, h * 10 + minutes], 1, 1000),
          hints: [DURATION_HINTS[0], "Passe d'abord les heures en minutes, puis ajoute les minutes qui restent.", DURATION_HINTS[2]],
        };
      }
      const h = pickFresh(ctx, [2, 3, 4], (n) => `ce2-mes:duree-minh:${n}:${minutes}`);
      const total = 60 * h + minutes;
      return {
        prompt: `${total} minutes font combien d'heures et de minutes ?`,
        answer: `${h} h ${minutes} min`,
        // Les erreurs d'enfant : couper le nombre en deux chiffres (140 donne 1 h 40), ajouter dix minutes, une heure de plus ou de moins.
        wrong: [
          ...(total % 100 >= 10 && total % 100 <= 59 ? [`${Math.floor(total / 100)} h ${total % 100} min`] : []),
          `${h} h ${minutes + 10} min`,
          `${h + 1} h ${minutes} min`,
          `${h - 1} h ${minutes} min`,
        ],
        hints: ["Cherche combien d'heures entières tiennent dans le total.", "Une heure contient soixante minutes.", "Ce qui reste après les heures entières, ce sont les minutes."],
      };
    }
    const start = pickFresh(ctx, Array.from({ length: 9 }, (_, i) => 8 + i).flatMap((hour) => [0, 10, 15, 20, 30, 40, 45, 50].map((minute) => 60 * hour + minute)), (n) => `ce2-mes:fin:${n}`);
    const dh = randomInt(ctx.rng, 1, 2);
    const dm = pick(ctx.rng, [15, 20, 30, 40, 45, 50]);
    const end = start + 60 * dh + dm;
    return {
      prompt: `Un film commence à ${clockText(start)} et dure ${dh} h ${dm} min. À quelle heure finit-il ?`,
      answer: clockText(end),
      // Les erreurs d'enfant : oublier la retenue d'une heure, ajouter dix minutes de trop, retrancher au lieu d'ajouter une heure.
      wrong: [end - 60, end + 10, end + 60, end - 10].map(clockText),
      hints: ["Pars de l'heure du début.", "Ajoute d'abord les heures, puis les minutes.", "Quand les minutes dépassent soixante, passe à l'heure suivante."],
    };
  });
}

// ===========================================================================
// LES PROBLÈMES DE MESURES
// ===========================================================================

const PROBLEM_HINTS: Hints = [
  "Lis bien l'énoncé et repère les unités.",
  "Écris les deux mesures dans la même unité avant de calculer.",
  "Additionne si l'on ajoute, soustrais si l'on enlève.",
];

/** Un problème de mesures : une seule bonne réponse, les erreurs d'enfant (oublier de convertir, ajouter au lieu d'enlever) pour mauvais choix. */
export function makeCe2MesProblem(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce2-mes-probleme", "résoudre un petit problème de mesures", () => {
    const child = pickFresh(ctx, CHILDREN, (candidate) => `ce2-mes-probleme:${candidate.name}`);
    const family = familyOf(ctx);
    const { big, small, smallWord, factor, thing, rests } = FAMILY[family];
    const adding = ctx.rng() < 0.5;
    const k = randomInt(ctx.rng, 2, 6);
    const rest = pick(ctx.rng, rests);
    const result = adding ? k * factor + rest : k * factor - rest;
    const rs = show(rest);
    const prompt = {
      longueur: adding
        ? `${child.name} a ${k} ${big} de ruban rouge et ${rs} ${small} de ruban bleu. Combien de ${smallWord} de ruban ${hasHe(child)} en tout ?`
        : `Une corde mesure ${k} ${big}. ${child.name} en coupe ${rs} ${small}. Combien de ${smallWord} de corde reste-t-il ?`,
      distance: adding
        ? `${child.name} marche ${k} ${big} le matin, puis ${rs} ${small} l'après-midi. Combien de ${smallWord} marche-t-${pronoun(child)} en tout ?`
        : `Une route mesure ${k} ${big}. ${child.name} en a déjà fait ${rs} ${small}. Combien de ${smallWord} reste-t-il à faire ?`,
      masse: adding
        ? `Un panier contient ${k} ${big} de mangues et ${rs} ${small} de bananes. Combien de ${smallWord} y a-t-il en tout ?`
        : `Un sac de riz pèse ${k} ${big}. ${child.name} en retire ${rs} ${small}. Combien de ${smallWord} reste-t-il dans le sac ?`,
      contenance: adding
        ? `${child.name} verse ${k} ${big} de jus dans une carafe, puis ${rs} ${small} de plus. Combien de ${smallWord} y a-t-il dans la carafe ?`
        : `Un flacon contient ${k} ${big} d'huile. ${child.name} en verse ${rs} ${small}. Combien de ${smallWord} reste-t-il dans le flacon ?`,
    }[thing];
    // Les erreurs d'enfant : ne pas convertir (2 + 50), convertir de dix en dix, ajouter à la place d'enlever, se tromper d'un dixième de la grande unité.
    const pool = [adding ? k + rest : k - rest, k * (factor / 10) + (adding ? rest : -rest), adding ? k * factor - rest : k * factor + rest, result - factor / 10, result + factor / 10];
    return {
      prompt,
      answer: `${show(result)} ${small}`,
      wrong: wrongNumbersCe1(ctx, result, pool, 1, 100000).map((value) => `${value} ${small}`),
      hints: [PROBLEM_HINTS[0], "Passe la grande unité en petite unité avant de calculer.", PROBLEM_HINTS[2]],
    };
  });
}
