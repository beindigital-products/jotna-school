/**
 * LES MESURES DU CM1 : convertir les longueurs (km, m, cm, mm), les masses (t, kg, g) et les contenances (L, dL, cL, mL), avec des nombres décimaux, comparer et ranger des
 * mesures écrites dans deux unités, choisir l'unité, les durées et de petits problèmes (`ma-cm1-mesures`).
 *
 * Sur l'échantillon, le modèle écrivait « 2,5 km = 250 m » (un zéro de moins), « 1 t = 100 kg », comparait « 3 m » et « 250 cm » en disant que 250 est plus grand, et additionnait
 * des heures et des minutes sans retenue (« 1 h 45 min + 50 min = 1 h 95 min »). Ici les conversions, les comparaisons et les durées sont FAITES par le code, les unités et les
 * ordres de grandeur viennent d'un tableau fermé.
 *
 * - LES UNITÉS : dix couples (km-m, m-cm, m-mm, cm-mm, t-kg, kg-g, L-dL, L-cL, L-mL, cL-mL). Un nombre est compté en CENTIÈMES de la grande unité (`dec` l'écrit : 250 centièmes de
 *   mètre, « 2,5 m ») ; sa valeur dans la petite unité est toujours un entier (« 2,5 km » vaut 2 500 m, « 0,25 L » vaut 25 cL).
 * - LES CINQ PALIERS (`stepOf`) : des nombres entiers de la grande vers la petite unité ; dans les deux sens ; avec des demi-unités ; avec des quarts et des trois quarts ; les mêmes avec
 *   plus d'unités. Les durées vont des demi-heures aux minutes qui franchissent l'heure, puis aux additions de durées.
 * - LES ERREURS D'ENFANT : un zéro de trop ou de moins, comparer les nombres sans regarder l'unité, couper « 135 min » en « 1 h 35 min », soustraire les minutes à l'envers.
 *   Aucun mauvais choix ne vaut la bonne réponse, et une durée n'est jamais écrite avec soixante minutes ou plus (« 1 h 75 min »).
 * - Une heure s'écrit « 14 h » ou « 14 h 05 » ; une durée « 45 min », « 2 h », « 1 h 35 min ». L'heure de fin reste dans la journée.
 * - Les énoncés n'ont aucun « : », au plus une apostrophe droite, vingt-huit mots au plus. Aucun indice n'écrit un chiffre. Les cases d'un glissé s'appellent « Longueur », « Masse » et
 *   « Contenance » : leurs indices n'emploient aucun de ces mots.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { fresh, originOf, pick, randomInt, shuffle, type GameContext, type GeneratedGame } from "./shared";
import { choiceGame, gapGame, linkGame, sortGame, type Hints } from "./tableaux";
import { qr, ce2Question, hints } from "./ce2Outils";
import { dec, show, stepOf, wrongDecimals, wrongNumbers, type Step } from "./cm1MathsOutils";

// ===========================================================================
// LES DIX COUPLES D'UNITÉS
// ===========================================================================

export type Family = "km-m" | "m-cm" | "m-mm" | "cm-mm" | "t-kg" | "kg-g" | "L-dL" | "L-cL" | "L-mL" | "cL-mL";
export type Quantity = "longueur" | "masse" | "contenance";

export type FamilyInfo = {
  big: string;
  small: string;
  bigWord: string;
  smallWord: string;
  /** Ce qu'il faut de petites unités pour une grande. */
  factor: number;
  quantity: Quantity;
  /** Les restes d'une grande unité en centièmes : une demi-unité, un quart, trois quarts quand la petite unité reste entière. */
  rests: readonly number[];
};

export const FAMILY: Record<Family, FamilyInfo> = {
  "km-m": { big: "km", small: "m", bigWord: "kilomètres", smallWord: "mètres", factor: 1000, quantity: "longueur", rests: [25, 50, 75] },
  "m-cm": { big: "m", small: "cm", bigWord: "mètres", smallWord: "centimètres", factor: 100, quantity: "longueur", rests: [25, 50, 75] },
  "m-mm": { big: "m", small: "mm", bigWord: "mètres", smallWord: "millimètres", factor: 1000, quantity: "longueur", rests: [25, 50, 75] },
  "cm-mm": { big: "cm", small: "mm", bigWord: "centimètres", smallWord: "millimètres", factor: 10, quantity: "longueur", rests: [50] },
  "t-kg": { big: "t", small: "kg", bigWord: "tonnes", smallWord: "kilogrammes", factor: 1000, quantity: "masse", rests: [25, 50, 75] },
  "kg-g": { big: "kg", small: "g", bigWord: "kilogrammes", smallWord: "grammes", factor: 1000, quantity: "masse", rests: [25, 50, 75] },
  "L-dL": { big: "L", small: "dL", bigWord: "litres", smallWord: "décilitres", factor: 10, quantity: "contenance", rests: [50] },
  "L-cL": { big: "L", small: "cL", bigWord: "litres", smallWord: "centilitres", factor: 100, quantity: "contenance", rests: [25, 50, 75] },
  "L-mL": { big: "L", small: "mL", bigWord: "litres", smallWord: "millilitres", factor: 1000, quantity: "contenance", rests: [25, 50, 75] },
  "cL-mL": { big: "cL", small: "mL", bigWord: "centilitres", smallWord: "millilitres", factor: 10, quantity: "contenance", rests: [50] },
};

const ALL_FAMILIES = Object.keys(FAMILY) as Family[];

/** Les couples de chaque palier : les plus familiers d'abord. */
const FAMILIES_BY_STEP: Record<Step, readonly Family[]> = {
  1: ["km-m", "m-cm", "kg-g", "L-cL"],
  2: ["cm-mm", "m-mm", "t-kg", "L-mL", "L-dL"],
  3: ALL_FAMILIES,
  4: ALL_FAMILIES,
  5: ALL_FAMILIES,
};

/** Le plus grand nombre entier de grandes unités d'une conversion, par palier. */
const WHOLE_TOP: Record<Step, number> = { 1: 6, 2: 9, 3: 12, 4: 20, 5: 30 };

const CONVERT_HINTS: Hints = [
  "Compare la grande unité et la petite unité.",
  "Une grande unité contient beaucoup de petites unités.",
  "Pour passer à la petite unité, multiplie ; pour revenir à la grande, partage.",
];

export type Conversion = {
  family: Family;
  /** La valeur en centièmes de la grande unité (250 pour « 2,5 m »). */
  bigC: number;
  /** La valeur dans la petite unité (250 pour « 2,5 m » en centimètres... 2,5 m = 250 cm). */
  small: number;
  /** Vrai : de la petite vers la grande unité. */
  up: boolean;
};

/** Une conversion du palier, qu'aucun exercice n'a déjà posée : entière d'abord, avec demi, quarts et trois quarts ensuite, dans les deux sens dès le deuxième palier. */
export function drawConversion(ctx: GameContext): Conversion {
  const step = stepOf(ctx);
  let found: Conversion | undefined;
  for (let attempt = 0; attempt < 40; attempt++) {
    const family = pick(ctx.rng, FAMILIES_BY_STEP[step]);
    const info = FAMILY[family];
    const withRest = step >= 3 && ctx.rng() < (step === 3 ? 0.5 : 0.65);
    const k = randomInt(ctx.rng, withRest && step >= 4 ? 0 : 1, WHOLE_TOP[step]);
    const bigC = k * 100 + (withRest ? pick(ctx.rng, info.rests) : 0);
    if (bigC === 0) continue;
    const up = step >= 2 && ctx.rng() < 0.5;
    found = { family, bigC, small: (bigC * info.factor) / 100, up };
    if (!ctx.used.has(`cm1-mes:conv:${family}:${found.up}:${bigC}`)) break;
  }
  ctx.used.add(`cm1-mes:conv:${found!.family}:${found!.up}:${found!.bigC}`);
  return found!;
}

/** La mesure de départ comme elle s'écrit : « 2,5 m », ou « 250 cm » quand on remonte vers la grande unité. */
const fromText = (c: Conversion) => (c.up ? `${show(c.small)} ${FAMILY[c.family].small}` : `${dec(c.bigC)} ${FAMILY[c.family].big}`);
/** L'unité d'arrivée, en toutes lettres. */
const toWord = (c: Conversion) => (c.up ? FAMILY[c.family].bigWord : FAMILY[c.family].smallWord);
/** La mesure d'arrivée comme elle s'écrit. */
const toText = (c: Conversion) => (c.up ? `${dec(c.bigC)} ${FAMILY[c.family].big}` : `${show(c.small)} ${FAMILY[c.family].small}`);
const toValue = (c: Conversion) => (c.up ? dec(c.bigC) : show(c.small));
const toUnit = (c: Conversion) => (c.up ? FAMILY[c.family].big : FAMILY[c.family].small);

/** Les deux mauvais choix d'une conversion : un zéro de trop ou de moins. */
function wrongValues(ctx: GameContext, c: Conversion): [string, string] {
  if (c.up) return wrongDecimals(ctx, c.bigC, [c.bigC * 10, c.bigC / 10, c.bigC * 100, c.bigC / 100], 1, 99999999);
  return wrongNumbers(ctx, c.small, [c.small * 10, c.small / 10, c.small * 100, c.small / 100], 1, 99999999);
}

/** « Convertis 2,5 km en mètres. » : trois mesures, dont deux ne sont qu'un zéro de trop ou de moins. */
export function makeCm1MesConvert(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "cm1-mes-convertir", "convertir une mesure dans une autre unité", () => {
    const c = drawConversion(ctx);
    return {
      prompt: `Convertis ${fromText(c)} en ${toWord(c)}.`,
      answer: toText(c),
      wrong: wrongValues(ctx, c).map((value) => `${value} ${toUnit(c)}`),
      hints: CONVERT_HINTS,
    };
  });
}

/** « Combien de mètres y a-t-il dans 2,5 km ? Écris le nombre. » : une réponse courte (« 2 500 » vaut « 2500 », « 2,5 » vaut « 2.5 »). */
export function makeCm1MesWrite(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "cm1-mes-ecrire", () => {
    const c = drawConversion(ctx);
    // Un entier s'écrit sans espace (« 1125 » vaut « 1 125 »), un décimal avec sa virgule.
    const answer = c.up ? dec(c.bigC) : String(c.small);
    return {
      type: "short-answer",
      prompt: `Combien de ${toWord(c)} y a-t-il dans ${fromText(c)} ? Écris le nombre.`,
      payload: { acceptedAnswers: [answer], game: originOf("cm1-mes-ecrire", ctx), concept: "convertir une mesure et écrire le résultat" },
      answerKey: answer,
      hints: [...CONVERT_HINTS],
    };
  });
}

/** « 2,5 km = ___ m » : l'égalité à compléter. */
export function makeCm1MesGap(ctx: GameContext): GeneratedGame {
  return gapGame(ctx, "cm1-mes-trou", "compléter une égalité de mesures", () => {
    const c = drawConversion(ctx);
    return {
      prompt: "Complète l'égalité.",
      text: `${fromText(c)} = ___ ${toUnit(c)}`,
      answer: toValue(c),
      wrong: wrongValues(ctx, c),
      hints: CONVERT_HINTS,
    };
  });
}

// ===========================================================================
// COMPARER ET RANGER
// ===========================================================================

export type Measure = { base: number; label: string };

/** Le plus grand nombre de pas d'une comparaison, selon le palier. */
const STEP_TOP: Record<Step, number> = { 1: 8, 2: 10, 3: 12, 4: 14, 5: 16 };

const COMPARE_HINTS: Hints = [
  "Les mesures ne sont pas écrites dans la même unité.",
  "Écris-les toutes dans la petite unité avant de comparer.",
  "Une grande unité ne donne pas toujours la plus grande mesure.",
];

/**
 * `count` mesures différentes d'un couple, comptées en pas de demi-unité (de quart pour les couples de cent et de mille) : écrites en grande unité quand le pas tombe juste
 * (« 2 m », « 1,5 m »), en petite sinon (« 150 cm »). Il y en a toujours au moins une de chaque sorte : il faut convertir pour comparer.
 */
export function drawMeasures(ctx: GameContext, family: Family, count: number): Measure[] {
  const { big, small, factor } = FAMILY[family];
  const grain = factor === 10 ? 5 : factor / 4;
  for (let attempt = 0; attempt < 200; attempt++) {
    const picked = shuffle(ctx.rng, Array.from({ length: STEP_TOP[stepOf(ctx)] }, (_, i) => i + 1)).slice(0, count);
    const measures = picked.map((n) => {
      const base = n * grain;
      const whole = base % factor === 0;
      const half = base % (factor / 2) === 0;
      const label = whole || (half && ctx.rng() < 0.5) ? `${dec((base * 100) / factor)} ${big}` : `${show(base)} ${small}`;
      return { base, label };
    });
    if (measures.some((m) => m.label.endsWith(` ${big}`)) && measures.some((m) => m.label.endsWith(` ${small}`))) return measures;
  }
  const n = [1, 2, 3, 4].slice(0, count);
  return n.map((i) => (i % 2 === 0 ? { base: i * factor, label: `${i} ${big}` } : { base: i * factor + factor / 2, label: `${show(i * factor + factor / 2)} ${small}` }));
}

const familyOf = (ctx: GameContext): Family => pick(ctx.rng, FAMILIES_BY_STEP[stepOf(ctx)]);

/** « Quelle est la plus grande longueur ? » : trois mesures en deux unités, une seule est la plus grande (ou la plus petite). */
export function makeCm1MesCompare(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "cm1-mes-comparer", "comparer des mesures écrites dans deux unités", () => {
    const family = familyOf(ctx);
    const measures = drawMeasures(ctx, family, 3);
    const largest = ctx.rng() < 0.5;
    const sorted = [...measures].sort((a, b) => a.base - b.base);
    const answer = largest ? sorted[2] : sorted[0];
    return {
      prompt: `Quelle est la plus ${largest ? "grande" : "petite"} ${FAMILY[family].quantity} ?`,
      answer: answer.label,
      wrong: measures.filter((measure) => measure !== answer).map((measure) => measure.label),
      hints: COMPARE_HINTS,
    };
  });
}

const THINGS: Record<Quantity, string> = { longueur: "longueurs", masse: "masses", contenance: "contenances" };

/** « Range ces longueurs de la plus petite à la plus grande. » : quatre mesures en deux unités. */
export function makeCm1MesOrder(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "cm1-mes-ranger",
    () => {
      const family = familyOf(ctx);
      const measures = drawMeasures(ctx, family, 4);
      const ascending = ctx.rng() < 0.5;
      const sorted = [...measures].sort((a, b) => (ascending ? a.base - b.base : b.base - a.base));
      return {
        type: "order",
        prompt: `Range ces ${THINGS[FAMILY[family].quantity]} ${ascending ? "de la plus petite à la plus grande" : "de la plus grande à la plus petite"}.`,
        payload: { correctSequence: sorted.map((measure) => measure.label), game: originOf("cm1-mes-ranger", ctx), concept: "ranger des mesures écrites dans deux unités" },
        answerKey: sorted.map((measure) => measure.label).join(" "),
        hints: [...COMPARE_HINTS],
      };
    },
    (game) => String(game.answerKey),
  );
}

// ===========================================================================
// L'UNITÉ, L'ÉQUIVALENCE, LE GLISSÉ
// ===========================================================================

const UNIT_HINTS: Hints = hints("Demande-toi ce que tu mesures : une distance, un poids ou une quantité de liquide.", "Imagine si la chose est très petite ou très grande.", "Choisis l'unité dont la taille va avec la chose.");
const unit = (what: string, answer: string, wrong: readonly [string, string]) => qr(`Quelle unité convient le mieux pour ${what} ?`, answer, wrong, UNIT_HINTS);

/** Vingt questions, quatre par palier : un mot seul, sans article. Les mauvais choix ne sont jamais une autre unité plausible de la même grandeur. */
export const UNIT_ROWS = [
  // Palier 1
  unit("mesurer la longueur de la cour", "Mètre", ["Kilogramme", "Litre"]),
  unit("mesurer la contenance d'une bassine", "Litre", ["Mètre", "Gramme"]),
  unit("peser un sac de riz", "Kilogramme", ["Kilomètre", "Centimètre"]),
  unit("mesurer la distance entre deux villes", "Kilomètre", ["Centimètre", "Gramme"]),
  // Palier 2
  unit("mesurer la hauteur d'une fourmi", "Millimètre", ["Kilomètre", "Kilogramme"]),
  unit("mesurer la longueur d'un crayon", "Centimètre", ["Kilomètre", "Litre"]),
  unit("peser une plume", "Gramme", ["Kilogramme", "Mètre"]),
  unit("mesurer la contenance d'une cuillère", "Centilitre", ["Kilomètre", "Gramme"]),
  // Palier 3
  unit("peser un camion chargé", "Tonne", ["Gramme", "Millimètre"]),
  unit("mesurer la contenance d'un verre", "Décilitre", ["Kilomètre", "Gramme"]),
  unit("mesurer la hauteur d'une porte", "Mètre", ["Kilomètre", "Gramme"]),
  unit("peser une pomme", "Gramme", ["Kilomètre", "Litre"]),
  // Palier 4
  unit("mesurer la contenance du grand bidon", "Litre", ["Millimètre", "Gramme"]),
  unit("mesurer la dose d'un médicament", "Millilitre", ["Kilomètre", "Kilogramme"]),
  unit("peser un éléphant", "Tonne", ["Gramme", "Centimètre"]),
  unit("mesurer la longueur d'un fleuve", "Kilomètre", ["Centimètre", "Millilitre"]),
  // Palier 5
  unit("mesurer la largeur d'un cahier", "Centimètre", ["Kilomètre", "Gramme"]),
  unit("peser une lettre", "Gramme", ["Tonne", "Mètre"]),
  unit("mesurer la masse d'un sac de ciment", "Kilogramme", ["Millimètre", "Litre"]),
  unit("mesurer la hauteur d'un arbre", "Mètre", ["Millilitre", "Gramme"]),
];

/** « Quelle unité convient le mieux pour mesurer la longueur de la cour ? » : l'unité parmi trois. */
export function makeCm1MesUnit(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "cm1-mes-unite", "choisir l'unité d'une mesure", UNIT_ROWS);
}

/** « Relie chaque mesure à la même mesure écrite dans une autre unité. » : trois mesures de couples différents. */
export function makeCm1MesLinks(ctx: GameContext): GeneratedGame {
  return linkGame(ctx, "cm1-mes-relier", "relier deux écritures d'une même mesure", () => {
    const chosen: { left: string; right: string; family: Family }[] = [];
    for (let attempt = 0; attempt < 100 && chosen.length < 3; attempt++) {
      const c = { ...drawConversion(ctx), up: false };
      if (chosen.some((other) => other.family === c.family || other.left === fromText(c))) continue;
      chosen.push({ left: fromText(c), right: toText(c), family: c.family });
    }
    return {
      prompt: "Relie chaque mesure à la même mesure écrite dans une autre unité.",
      pairs: chosen.map(({ left, right }) => ({ left, right })),
      hints: ["Écris chaque mesure dans la plus petite unité.", "Une grande unité contient beaucoup de petites unités.", "Chaque mesure va avec une seule autre écriture."],
    };
  });
}

const SYMBOLS: Record<Quantity, readonly string[]> = {
  longueur: ["km", "m", "cm", "mm"],
  masse: ["t", "kg", "g"],
  contenance: ["L", "dL", "cL", "mL"],
};
const ZONE: Record<Quantity, string> = { longueur: "Longueur", masse: "Masse", contenance: "Contenance" };

/** « Glisse chaque mesure dans la bonne case. » : une longueur, une masse ou une contenance, d'après l'unité. */
export function makeCm1MesSort(ctx: GameContext): GeneratedGame {
  return sortGame(ctx, "cm1-mes-glisser", "reconnaître la grandeur d'une mesure d'après son unité", () => {
    const each = stepOf(ctx) === 1 ? 2 : 3;
    const [first, second] = shuffle(ctx.rng, ["longueur", "masse", "contenance"] as const).slice(0, 2);
    const draw = (quantity: Quantity) => {
      const out = new Set<string>();
      while (out.size < each) out.add(`${randomInt(ctx.rng, 2, 90)} ${pick(ctx.rng, SYMBOLS[quantity])}`);
      return [...out];
    };
    return {
      prompt: "Glisse chaque mesure dans la bonne case.",
      zones: [ZONE[first], ZONE[second]],
      items: [...draw(first).map((text) => ({ text, zone: ZONE[first] })), ...draw(second).map((text) => ({ text, zone: ZONE[second] }))],
      hints: ["Lis l'unité de chaque mesure, pas le nombre.", "Un mètre sert pour une distance, un gramme pour peser, un litre pour remplir.", "Les unités d'une même case se ressemblent."],
    };
  });
}

// ===========================================================================
// LES DURÉES
// ===========================================================================

const pad = (n: number) => String(n).padStart(2, "0");
/** « 14 h » ou « 14 h 05 » : une heure du jour, d'après le nombre de minutes écoulées depuis minuit. */
export const clock = (t: number) => (t % 60 === 0 ? `${t / 60} h` : `${Math.floor(t / 60)} h ${pad(t % 60)}`);
/** « 45 min », « 2 h » ou « 1 h 35 min » : une durée en minutes, jamais soixante minutes ou plus. */
export const duration = (m: number) => (m < 60 ? `${m} min` : m % 60 === 0 ? `${m / 60} h` : `${Math.floor(m / 60)} h ${m % 60} min`);

type DurationForm = "ecoule" | "arrivee" | "somme" | "minutes-heures" | "heures-minutes";
const DURATION_FORMS: Record<Step, readonly DurationForm[]> = {
  1: ["ecoule", "heures-minutes"],
  2: ["ecoule", "arrivee", "heures-minutes"],
  3: ["ecoule", "arrivee", "minutes-heures"],
  4: ["ecoule", "arrivee", "somme", "minutes-heures"],
  5: ["arrivee", "somme", "minutes-heures", "heures-minutes"],
};

const DURATION_HINTS: Hints = ["Pars de l'heure de départ.", "Compte d'abord jusqu'à l'heure ronde suivante, puis ajoute le reste.", "Une heure contient soixante minutes."];

/**
 * Les durées écrites des mauvais choix : d'abord les erreurs d'enfant de `typical`, puis des durées voisines tirées au hasard. Aucune ne vaut la bonne durée, et chacune est
 * normalisée (jamais « 1 h 75 min »).
 */
function wrongDurations(ctx: GameContext, correct: number, typical: readonly number[]): string[] {
  const seen = new Set<number>([correct]);
  const out: string[] = [];
  const fillers = shuffle(ctx.rng, [10, -10, 15, -15, 30, -30, 60, -60].map((delta) => correct + delta));
  for (const m of [...typical, ...fillers]) {
    if (m > 0 && !seen.has(m)) {
      seen.add(m);
      out.push(duration(m));
    }
  }
  return out;
}

/** Une heure de départ et une durée du palier : des demi-heures, puis des quarts d'heure, puis des minutes qui ne franchissent pas l'heure, puis qui la franchissent. */
function drawSpan(ctx: GameContext): { t1: number; d: number } {
  const step = stepOf(ctx);
  const hour = randomInt(ctx.rng, 7, 17) * 60;
  if (step === 1) return { t1: hour + pick(ctx.rng, [0, 30]), d: randomInt(ctx.rng, 1, 6) * 30 };
  if (step === 2) return { t1: hour + pick(ctx.rng, [0, 15, 30, 45]), d: randomInt(ctx.rng, 2, 12) * 15 };
  if (step === 3) {
    // La durée tient dans l'heure : de dix à cinquante-cinq minutes, le départ laisse la place.
    const d = randomInt(ctx.rng, 2, 11) * 5;
    return { t1: hour + randomInt(ctx.rng, 0, Math.floor((59 - d) / 5)) * 5, d };
  }
  return { t1: hour + randomInt(ctx.rng, 0, 11) * 5, d: randomInt(ctx.rng, 13, step === 4 ? 40 : 60) * 5 };
}

/**
 * Cinq façons de calculer une durée : le temps écoulé entre deux heures, l'heure d'arrivée, la somme de deux durées, des minutes en heures et minutes, des heures et minutes en
 * minutes. Le palier choisit ses formes et la finesse des minutes.
 */
export function makeCm1MesDuration(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "cm1-mes-duree", "calculer avec des heures et des minutes", () => {
    const step = stepOf(ctx);
    const form = pick(ctx.rng, DURATION_FORMS[step]);
    if (form === "ecoule" || form === "arrivee") {
      const { t1, d } = drawSpan(ctx);
      const t2 = t1 + d;
      if (form === "ecoule") {
        // L'erreur d'enfant : retrancher les minutes à l'envers (de 14 h 45 à 16 h 20, quarante-cinq moins vingt donne vingt-cinq).
        const reversed = (Math.floor(t2 / 60) - Math.floor(t1 / 60)) * 60 + Math.abs((t2 % 60) - (t1 % 60));
        return {
          prompt: `Un film commence à ${clock(t1)} et finit à ${clock(t2)}. Combien de temps dure-t-il ?`,
          answer: duration(d),
          wrong: wrongDurations(ctx, d, [reversed]),
          hints: DURATION_HINTS,
        };
      }
      return {
        prompt: `Un car part à ${clock(t1)} et roule ${duration(d)}. À quelle heure arrive-t-il ?`,
        answer: clock(t2),
        wrong: shuffle(ctx.rng, [t2 - 60, t2 + 60, t2 + 10, t2 - 10, t2 + 15, t2 - 15].filter((t) => t > 0 && t !== t2 && t < 24 * 60)).map(clock),
        hints: DURATION_HINTS,
      };
    }
    if (form === "somme") {
      // Deux durées dont les minutes dépassent soixante : la retenue d'une heure est la difficulté.
      const a = randomInt(ctx.rng, 5, 26 + (step - 4) * 12) * 5;
      const b = randomInt(ctx.rng, 5, 18) * 5;
      const total = a + b;
      return {
        prompt: `Un élève lit pendant ${duration(a)}, puis fait ses devoirs pendant ${duration(b)}. Quelle durée en tout ?`,
        answer: duration(total),
        wrong: wrongDurations(ctx, total, [Math.abs(a - b), total + 5, total - 5]),
        hints: ["Additionne les heures, puis les minutes.", "Quand les minutes atteignent soixante, elles font une heure de plus.", "Écris le total en heures et en minutes."],
      };
    }
    if (form === "minutes-heures") {
      // Un total qui n'est pas un nombre rond d'heures : de 65 à 175 minutes, puis jusqu'à 300.
      let total = randomInt(ctx.rng, 13, step === 3 ? 35 : 60) * 5;
      if (total % 60 === 0) total += 5;
      // L'erreur d'enfant : couper le nombre en deux (135 minutes donnent 1 h 35 min, qu'`duration` n'écrit jamais).
      const cut = total >= 100 && total % 100 >= 10 && total % 100 <= 59 ? [`${Math.floor(total / 100)} h ${total % 100} min`] : [];
      return {
        prompt: `Convertis ${total} min en heures et minutes.`,
        answer: duration(total),
        wrong: [...cut, ...wrongDurations(ctx, total, [total + 5, total - 5])].filter((option) => option !== duration(total)),
        hints: ["Cherche combien d'heures entières tiennent dans le total.", "Une heure contient soixante minutes.", "Ce qui reste après les heures entières, ce sont les minutes."],
      };
    }
    const hours = randomInt(ctx.rng, step === 1 ? 1 : 2, step === 1 ? 4 : 5);
    const minutes = step === 1 ? 0 : pick(ctx.rng, [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]);
    const total = hours * 60 + minutes;
    return {
      prompt: `Convertis ${duration(total)} en minutes.`,
      answer: `${total} min`,
      // Les erreurs d'enfant : écrire l'heure comme cent minutes, oublier les minutes, ajouter les heures aux minutes.
      wrong: wrongNumbers(ctx, total, [hours * 100 + minutes, hours * 60, hours + minutes, total + 10, total - 10], 1, 9999).map((value) => `${value} min`),
      hints: ["Passe d'abord les heures en minutes.", "Une heure contient soixante minutes.", "Ajoute les minutes qui restent."],
    };
  });
}

// ===========================================================================
// LES PROBLÈMES
// ===========================================================================

type ProblemForm = "morceaux" | "reste" | "bouteilles" | "sacs" | "tonnes";
const PROBLEM_FORMS: Record<Step, readonly ProblemForm[]> = {
  1: ["morceaux"],
  2: ["morceaux", "reste"],
  3: ["bouteilles", "morceaux", "sacs"],
  4: ["sacs", "bouteilles", "reste"],
  5: ["tonnes", "bouteilles", "reste"],
};

const PROBLEM_HINTS: Hints = ["Lis bien l'énoncé et repère les unités.", "Écris les deux mesures dans la même unité avant de calculer.", "Partage si l'on découpe ou si l'on remplit, multiplie si l'on rassemble."];

/** Un problème de mesures : une seule bonne réponse, les erreurs d'enfant (oublier de convertir, se tromper d'un zéro) pour mauvais choix. */
export function makeCm1MesProblem(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "cm1-mes-probleme", "résoudre un petit problème de mesures", () => {
    const step = stepOf(ctx);
    const form = pick(ctx.rng, PROBLEM_FORMS[step]);
    if (form === "morceaux") {
      let cm = pick(ctx.rng, step === 1 ? [50, 25] : [50, 25, 20, 10, 40]);
      const m = randomInt(ctx.rng, 2, step === 1 ? 6 : 12);
      // Un nombre entier de morceaux : 4 m ne se coupe pas en morceaux de 40 cm sans reste ici.
      if ((m * 100) % cm !== 0) cm = 50;
      const count = (m * 100) / cm;
      return {
        prompt: `Une corde de ${m} m est coupée en morceaux de ${cm} cm. Combien de morceaux obtient-on ?`,
        answer: show(count),
        wrong: wrongNumbers(ctx, count, [count * 10, count / 10, m, count + 2, count - 2], 1, 9999),
        hints: [PROBLEM_HINTS[0], "Passe les mètres en centimètres avant de partager.", PROBLEM_HINTS[2]],
      };
    }
    if (form === "reste") {
      const a = randomInt(ctx.rng, 2, step >= 4 ? 9 : 6);
      const done = pick(ctx.rng, [250, 500, 750, 1250, 1500]);
      const left = a * 1000 - done;
      return {
        prompt: `Un trajet mesure ${a} km. Un cycliste a déjà roulé ${show(done)} m. Combien de mètres lui reste-t-il à faire ?`,
        answer: `${show(left)} m`,
        wrong: wrongNumbers(ctx, left, [a * 1000 + done, a - done > 0 ? a - done : done, a * 100 - done, left + 100, left - 100].filter((n) => n > 0), 1, 99999).map((value) => `${value} m`),
        hints: [PROBLEM_HINTS[0], "Passe les kilomètres en mètres avant de soustraire.", "Soustrais ce qui est déjà fait."],
      };
    }
    if (form === "bouteilles") {
      const cl = pick(ctx.rng, [25, 50, 20, 10]);
      const litres = randomInt(ctx.rng, 2, step === 3 ? 6 : 12);
      const count = (litres * 100) / cl;
      return {
        prompt: `On verse ${litres} L d'eau dans des bouteilles de ${cl} cL. Combien de bouteilles faut-il ?`,
        answer: show(count),
        wrong: wrongNumbers(ctx, count, [count * 10, count / 10, litres, count + 2, count - 2], 1, 9999),
        hints: [PROBLEM_HINTS[0], "Passe les litres en centilitres avant de partager.", PROBLEM_HINTS[2]],
      };
    }
    if (form === "sacs") {
      const kg = pick(ctx.rng, [25, 50, 20, 10, 5]);
      const n = randomInt(ctx.rng, 6, 40);
      return {
        prompt: `Un commerçant reçoit ${n} sacs de ${kg} kg de riz. Quelle masse de riz reçoit-il en tout ?`,
        answer: `${show(n * kg)} kg`,
        wrong: wrongNumbers(ctx, n * kg, [n + kg, n * kg * 10, (n * kg) / 10, n * kg + kg, n * kg - kg], 1, 99999).map((value) => `${value} kg`),
        hints: [PROBLEM_HINTS[0], "Une masse totale s'obtient en multipliant le nombre de sacs par la masse d'un sac.", "Écris le résultat dans l'unité de l'énoncé."],
      };
    }
    // Des tonnes : le nombre de sacs fait un nombre de quarts de tonne.
    const quarters = randomInt(ctx.rng, 2, 14);
    const total = quarters * 250;
    const kg = pick(ctx.rng, [25, 50, 20, 10].filter((candidate) => total % candidate === 0));
    const n = total / kg;
    return {
      prompt: `On charge ${n} sacs de ${kg} kg dans un camion. Quelle est la masse chargée, en tonnes ?`,
      answer: `${dec(total / 10)} t`,
      wrong: wrongDecimals(ctx, total / 10, [total, total * 10, total / 100, total / 100 / 10], 1, 99999).map((value) => `${value} t`),
      hints: [PROBLEM_HINTS[0], "Calcule d'abord la masse totale en kilogrammes.", "Une tonne contient mille kilogrammes : passe à la grande unité."],
    };
  });
}
