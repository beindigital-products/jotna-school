/**
 * PARTAGES ET MOYENNE AU CM2 (`ma-cm2-partages-moyenne`) : partager également, partager de façon inégale (une somme et un écart, des parts), calculer une
 * moyenne (notes, températures, récoltes d'arachide), trouver la valeur qui manque pour obtenir une moyenne, comparer des moyennes.
 *
 * Sur l'échantillon, le modèle écrivait « la moyenne de 12, 15 et 9 est 12,5 » (la somme divisée par quatre), partageait 60 000 FCFA en deux parts égales
 * « de 20 000 » et donnait à celui qui reçoit « 4 000 FCFA de plus » la moitié de la somme. Ici la réponse est CALCULÉE : la moyenne est la somme divisée par
 * le nombre de valeurs, un partage inégal par un écart se résout par (somme - écart) / 2, et chaque tirage choisit d'abord la moyenne puis les valeurs qui la
 * donnent, pour qu'elle tombe toujours juste (entière, ou avec un demi à partir du quatrième palier).
 *
 * - LES CINQ PALIERS (`stepOf`) : trois notes sur vingt ; quatre valeurs (notes, températures) ; cinq valeurs, des récoltes en kilogrammes ; des moyennes avec
 *   un demi ; des sommes en millions et des séries plus longues.
 * - LES ERREURS D'ENFANT : diviser par le mauvais nombre de valeurs, donner la somme pour la moyenne, la plus grande valeur pour la moyenne, la moitié de la
 *   somme pour la part de chacun quand les parts sont inégales, oublier l'écart.
 * - Les énoncés n'ont aucun « : », au plus une apostrophe droite, vingt-huit mots au plus. Aucun indice n'écrit un chiffre : un résultat se lirait dedans.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { fresh, originOf, pick, randomInt, shuffle, type GameContext, type GeneratedGame } from "./shared";
import { choiceGame, gapGame, linkGame, sequenceGame, sortGame } from "./tableaux";
import { show, stepOf, wrongNumbers, type Step } from "./cm1MathsOutils";
import { dec3, fcfa } from "./cm2MathsOutils";

// ===========================================================================
// LES SOMMES, LES NOMS ET LES SÉRIES
// ===========================================================================

const NAMES = ["Awa", "Moussa", "Fatou", "Modou", "Aminata", "Ibrahima"] as const;

/** L'unité des sommes à partager, le plus petit et le plus grand total servis à chaque palier. */
const SUMS: Record<Step, { unit: number; lo: number; hi: number }> = {
  1: { unit: 500, lo: 1000, hi: 9000 },
  2: { unit: 1000, lo: 10000, hi: 90000 },
  3: { unit: 5000, lo: 50000, hi: 500000 },
  4: { unit: 50000, lo: 500000, hi: 5000000 },
  5: { unit: 100000, lo: 1000000, hi: 9000000 },
};

/** Les deux mauvais choix d'un nombre entier : comme `wrongNumbers`, sans plafond du CM1. */
function wrongInts(ctx: GameContext, answer: number, pool: readonly number[], avoid: readonly number[] = []): [string, string] {
  return wrongNumbers(ctx, answer, pool, 1, 99999999, avoid);
}

/** Le nombre de valeurs d'une série et la plage de ses valeurs, par contexte. */
type Context = "notes" | "temperatures" | "recoltes";
const SERIES: Record<Context, { lo: number; hi: number; unit: number }> = {
  notes: { lo: 3, hi: 20, unit: 1 },
  temperatures: { lo: 20, hi: 45, unit: 1 },
  recoltes: { lo: 40, hi: 900, unit: 10 },
};
const CONTEXTS_BY_STEP: Record<Step, readonly Context[]> = {
  1: ["notes"],
  2: ["notes", "temperatures"],
  3: ["notes", "temperatures", "recoltes"],
  4: ["notes", "temperatures", "recoltes"],
  5: ["notes", "temperatures", "recoltes"],
};
const COUNT_BY_STEP: Record<Step, readonly number[]> = { 1: [3], 2: [4], 3: [4, 5], 4: [4, 5], 5: [5, 6] };

/** Une série de `count` valeurs entières dont la moyenne est exactement `mean` (en demis : `mean2 / 2`). Rend `null` si le tirage échoue. */
function seriesWithMean(ctx: GameContext, context: Context, count: number, mean2: number): number[] | null {
  const { lo, hi, unit } = SERIES[context];
  const total = (mean2 * count) / 2;
  if (!Number.isInteger(total)) return null;
  for (let attempt = 0; attempt < 200; attempt++) {
    const values: number[] = [];
    let rest = total;
    for (let i = 0; i < count - 1; i++) {
      const v = randomInt(ctx.rng, Math.ceil(lo / unit), Math.floor(hi / unit)) * unit;
      values.push(v);
      rest -= v;
    }
    if (rest >= lo && rest <= hi && rest % unit === 0) {
      values.push(rest);
      // Une série où toutes les valeurs sont égales n'est pas une série ; deux valeurs égales se tolèrent.
      if (new Set(values).size > 1) return shuffle(ctx.rng, values);
    }
  }
  return null;
}

/** Une moyenne (en demis) et une série qui la donne, au palier : entière jusqu'au troisième palier, avec un demi ensuite quand le nombre de valeurs est pair. */
function drawSeries(ctx: GameContext, forced?: Context): { context: Context; values: number[]; mean2: number } {
  const step = stepOf(ctx);
  for (let attempt = 0; attempt < 300; attempt++) {
    const context = forced ?? pick(ctx.rng, CONTEXTS_BY_STEP[step]);
    const count = pick(ctx.rng, COUNT_BY_STEP[step]);
    const { lo, hi, unit } = SERIES[context];
    const half = step >= 4 && count % 2 === 0 && context !== "recoltes" && ctx.rng() < 0.4;
    // La moyenne tombe entre les extrêmes : ni trop basse ni trop haute pour que des valeurs la donnent.
    const mean = randomInt(ctx.rng, Math.ceil((lo + (hi - lo) * 0.25) / unit), Math.floor((lo + (hi - lo) * 0.75) / unit)) * unit;
    const mean2 = mean * 2 + (half ? 1 : 0);
    const values = seriesWithMean(ctx, context, count, mean2);
    if (values) return { context, values, mean2 };
  }
  const values = [10, 12, 14];
  return { context: "notes", values, mean2: 24 };
}

/** Une moyenne en demis, écrite à l'école : « 12 » ou « 12,5 ». */
const meanText = (mean2: number) => dec3(mean2 * 500);
/** Des valeurs en phrase : « 12, 15 et 9 ». */
const listText = (values: readonly number[]) => `${values.slice(0, -1).map(show).join(", ")} et ${show(values[values.length - 1])}`;

// ===========================================================================
// PARTAGER
// ===========================================================================

/** Un total qui se partage sans reste entre `parts` personnes, à l'unité du palier. */
function evenTotal(ctx: GameContext, parts: number): number {
  const { unit, lo, hi } = SUMS[stepOf(ctx)];
  const block = unit * parts;
  return randomInt(ctx.rng, Math.ceil(lo / block), Math.floor(hi / block)) * block;
}

/** « On partage 12 000 FCFA également entre 4 enfants. Combien reçoit chaque enfant ? » */
export function makeCm2ParEqual(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "cm2-par-egal", "partager une somme également", () => {
    const parts = pick(ctx.rng, stepOf(ctx) <= 2 ? [2, 3, 4, 5] : [3, 4, 5, 6, 8]);
    const total = evenTotal(ctx, parts);
    const share = total / parts;
    return {
      prompt: `On partage ${fcfa(total)} également entre ${parts} enfants. Combien reçoit chaque enfant ?`,
      answer: show(share),
      // Les erreurs d'enfant : multiplier au lieu de diviser, diviser par le mauvais nombre, un rang de trop ou de moins.
      wrong: wrongInts(ctx, share, [total * parts > 99999999 ? -1 : total * parts, total / (parts + 1), total / (parts - 1), share * 10, Math.floor(share / 10)], [total, parts]),
      hints: ["Les parts sont toutes égales.", "Pour partager également, on divise.", "Divise la somme par le nombre d'enfants."],
    };
  });
}

/** « Awa et Moussa se partagent 18 000 FCFA. Awa reçoit 4 000 FCFA de plus que Moussa. Combien reçoit Moussa ? » : (somme - écart) / 2. */
export function makeCm2ParUnequal(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "cm2-par-inegal", "partager une somme avec un écart", () => {
    const { unit, lo, hi } = SUMS[stepOf(ctx)];
    const [first, second] = shuffle(ctx.rng, [...NAMES]).slice(0, 2);
    const small = randomInt(ctx.rng, Math.ceil(lo / 2 / unit), Math.floor(hi / 2 / unit)) * unit;
    const gap = randomInt(ctx.rng, 1, Math.max(1, Math.floor(small / unit) - 1)) * unit;
    const big = small + gap;
    const total = small + big;
    const askBig = ctx.rng() < 0.4;
    const answer = askBig ? big : small;
    return {
      prompt: `${first} et ${second} se partagent ${fcfa(total)}. ${first} reçoit ${fcfa(gap)} de plus ${/^[AEIOUY]/.test(second) ? `qu'${second}` : `que ${second}`}. Combien reçoit ${askBig ? first : second} ?`,
      answer: show(answer),
      // Les erreurs d'enfant : la moitié de la somme, la somme moins l'écart, l'écart ajouté de travers.
      wrong: wrongInts(ctx, answer, [total / 2, total - gap, askBig ? small : big, total + gap, askBig ? total / 2 + gap : total / 2 - gap], [total, gap]),
      hints: [
        "La somme comprend la part de chacun.",
        "Si on enlève l'écart à la somme, il reste deux parts égales.",
        askBig ? "Partage ce qui reste en deux, puis ajoute l'écart à la plus petite part." : "Partage ce qui reste en deux : c'est la plus petite part.",
      ],
    };
  });
}

/** « On partage 60 000 FCFA en 10 parts égales. Awa prend 3 parts. Combien reçoit Awa ? » : une part vaut le total divisé par le nombre de parts. */
export function makeCm2ParShares(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "cm2-par-parts", "partager en parts égales puis prendre plusieurs parts", () => {
    const parts = pick(ctx.rng, [4, 5, 8, 10]);
    const total = evenTotal(ctx, parts);
    const one = total / parts;
    const taken = randomInt(ctx.rng, 2, parts - 1);
    const name = pick(ctx.rng, NAMES);
    const answer = one * taken;
    return {
      prompt: `On partage ${fcfa(total)} en ${parts} parts égales. ${name} prend ${taken} parts. Combien reçoit ${name} ?`,
      answer: show(answer),
      // Les erreurs d'enfant : la valeur d'une seule part, le total divisé par le nombre de parts prises, une part de trop ou de moins.
      wrong: wrongInts(ctx, answer, [one, total / taken, one * (taken + 1), one * (taken - 1), total - answer], [total]),
      hints: ["Cherche d'abord ce que vaut une part.", "Une part vaut la somme divisée par le nombre de parts.", "Puis multiplie par le nombre de parts prises."],
    };
  });
}

// ===========================================================================
// LA MOYENNE
// ===========================================================================

/** L'énoncé d'une moyenne, selon le contexte : les notes d'un élève, les températures de plusieurs jours, la récolte de plusieurs jours. */
function averageQuestion(context: Context, values: readonly number[], name: string): string {
  if (context === "notes") return `Les notes ${/^[AEIOUY]/.test(name) ? `d'${name}` : `de ${name}`} sont ${listText(values)}. Quelle est sa moyenne ?`;
  if (context === "temperatures") return `Les températures de ${values.length} jours sont ${listText(values)} degrés. Quelle est la température moyenne ?`;
  return `Un paysan récolte ${listText(values)} kg d'arachide en ${values.length} jours. Quelle est sa récolte moyenne par jour ?`;
}

/** « Les notes d'Awa sont 12, 15 et 9. Quelle est sa moyenne ? » (ou des températures, des récoltes d'arachide) : la somme divisée par le nombre de valeurs. */
export function makeCm2ParAverage(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "cm2-par-moyenne", "calculer une moyenne", () => {
    const { context, values, mean2 } = drawSeries(ctx);
    const sum = values.reduce((a, b) => a + b, 0);
    const name = pick(ctx.rng, NAMES);
    const mean = mean2 / 2;
    // Les erreurs d'enfant : la somme, la somme divisée par un de plus ou de moins, la plus grande valeur, la valeur du milieu.
    const pool = [sum, sum / (values.length + 1), sum / (values.length - 1), Math.max(...values), Math.min(...values), values[Math.floor(values.length / 2)]];
    const fits = (n: number) => Number.isInteger(n * 2) && n > 0 && n !== mean && !values.includes(n);
    const typical = shuffle(ctx.rng, [...new Set(pool.filter(fits))]);
    const near = shuffle(ctx.rng, [mean - 1, mean + 1, mean - 2, mean + 2, mean * 2].filter((n) => fits(n) && !typical.includes(n) && Number.isInteger(n)));
    const wrong = [...typical, ...near].slice(0, 2).map((n) => meanText(n * 2));
    return {
      prompt: averageQuestion(context, values, name),
      answer: meanText(mean2),
      wrong,
      hints: ["La moyenne est la valeur qu'auraient toutes les valeurs si elles étaient égales.", "Additionne d'abord toutes les valeurs.", "Divise la somme par le nombre de valeurs."],
    };
  });
}

/** « La moyenne de 4 notes est 12. Les notes connues sont 10, 14 et 11. La note qui manque est ___. » : moyenne fois nombre moins somme. */
export function makeCm2ParMissing(ctx: GameContext): GeneratedGame {
  return gapGame(ctx, "cm2-par-manquant", "trouver la valeur qui manque pour une moyenne", () => {
    const { values, mean2 } = drawSeries(ctx, "notes");
    const missing = values[values.length - 1];
    const known = values.slice(0, -1);
    const total = (mean2 * values.length) / 2;
    const mean = mean2 / 2;
    const sum = known.reduce((a, b) => a + b, 0);
    const fits = (n: number) => Number.isInteger(n) && n >= 0 && n <= 20 && n !== missing && !known.includes(n) && n !== mean;
    const pool = [mean, sum, total, Math.round(total / known.length) - 0, Math.abs(mean - sum / known.length) + mean];
    const typical = shuffle(ctx.rng, [...new Set(pool.filter(fits))]);
    const near = shuffle(ctx.rng, [missing - 1, missing + 1, missing - 2, missing + 2, missing - 3, missing + 3].filter((n) => fits(n) && !typical.includes(n)));
    const chosen = [...typical, ...near].slice(0, 2);
    // Toujours deux mauvais choix : à défaut, les premières notes possibles de la plage.
    for (let n = 3; chosen.length < 2 && n <= 20; n++) if (fits(n) && !chosen.includes(n)) chosen.push(n);
    const wrong = chosen.map(show);
    return {
      prompt: "Complète avec le bon nombre.",
      text: `La moyenne de ${values.length} notes est ${meanText(mean2)}. Les notes connues sont ${listText(known)}. La note qui manque est ___.`,
      answer: show(missing),
      wrong,
      hints: ["Si la moyenne est connue, on connaît la somme de toutes les notes.", "Cette somme est la moyenne multipliée par le nombre de notes.", "Enlève les notes connues à cette somme."],
    };
  });
}

/** « Awa a eu 12, 15 et 9. Moussa a eu 10, 14 et 15. Qui a la meilleure moyenne ? » : deux séries de trois notes, jamais la même moyenne. */
export function makeCm2ParCompare(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "cm2-par-comparer", "comparer deux moyennes", () => {
    const [first, second] = shuffle(ctx.rng, [...NAMES]).slice(0, 2);
    let a = drawSeries(ctx, "notes");
    let b = drawSeries(ctx, "notes");
    while (a.mean2 === b.mean2 || a.values.length !== b.values.length) {
      a = drawSeries(ctx, "notes");
      b = drawSeries(ctx, "notes");
    }
    const winner = a.mean2 > b.mean2 ? first : second;
    return {
      prompt: `${first} a eu ${listText(a.values)}. ${second} a eu ${listText(b.values)}. Qui a la meilleure moyenne ?`,
      answer: winner,
      wrong: [winner === first ? second : first, "Ils ont la même moyenne"],
      hints: ["Calcule la moyenne de chaque élève.", "Additionne ses notes, puis divise par leur nombre.", "Compare les deux moyennes, pas les notes une à une."],
    };
  });
}

/** « Calcule la moyenne de 18, 22, 25 et 31. Écris le résultat. » : une réponse à écrire, avec une virgule quand elle a un demi. */
export function makeCm2ParWrite(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "cm2-par-ecrire", () => {
    const { values, mean2 } = drawSeries(ctx, pick(ctx.rng, ["notes", "temperatures"] as const));
    const text = meanText(mean2);
    return {
      type: "short-answer",
      prompt: `Calcule la moyenne de ${listText(values)}. Écris le résultat.`,
      payload: { acceptedAnswers: [text], game: originOf("cm2-par-ecrire", ctx), concept: "écrire une moyenne" },
      answerKey: text,
      hints: ["Additionne toutes les valeurs.", "Compte combien il y a de valeurs.", "Divise la somme par ce nombre, avec une virgule s'il le faut."],
    };
  });
}

/** « Range ces séries d'après leur moyenne, de la plus petite à la plus grande. » : quatre séries de moyennes différentes. */
export function makeCm2ParOrder(ctx: GameContext): GeneratedGame {
  return sequenceGame(ctx, "cm2-par-ranger", "ranger des séries d'après leur moyenne", () => {
    const series = new Map<number, string>();
    let guard = 0;
    while (series.size < 4 && guard++ < 200) {
      const { values, mean2 } = drawSeries(ctx, "notes");
      if (values.length === 3 || guard > 50) series.set(mean2, listText(values));
    }
    const ascending = ctx.rng() < 0.65;
    return {
      prompt: ascending ? "Range ces séries d'après leur moyenne, de la plus petite à la plus grande." : "Range ces séries d'après leur moyenne, de la plus grande à la plus petite.",
      sequence: [...series.entries()].sort((a, b) => (ascending ? a[0] - b[0] : b[0] - a[0])).map(([, text]) => text),
      hints: ["Calcule la moyenne de chaque série.", "Additionne les valeurs, puis divise par leur nombre.", ascending ? "Mets d'abord la série dont la moyenne est la plus petite." : "Mets d'abord la série dont la moyenne est la plus grande."],
    };
  });
}

/** « Relie chaque série à sa moyenne. » : trois séries de moyennes différentes. */
export function makeCm2ParLinks(ctx: GameContext): GeneratedGame {
  return linkGame(ctx, "cm2-par-relier", "relier une série à sa moyenne", () => {
    const pairs = new Map<number, string>();
    let guard = 0;
    while (pairs.size < 3 && guard++ < 200) {
      const { values, mean2 } = drawSeries(ctx, "notes");
      pairs.set(mean2, listText(values));
    }
    return {
      prompt: "Relie chaque série à sa moyenne.",
      pairs: [...pairs.entries()].map(([mean2, text]) => ({ left: text, right: meanText(mean2) })),
      hints: ["Calcule la moyenne de chaque série.", "Additionne les valeurs, puis divise par leur nombre.", "Commence par la série dont tu es le plus sûr."],
    };
  });
}

/** « Glisse chaque série dans la bonne case. » : deux séries de moyenne plus petite que le seuil, deux de moyenne plus grande. */
export function makeCm2ParSort(ctx: GameContext): GeneratedGame {
  return sortGame(ctx, "cm2-par-glisser", "placer des moyennes par rapport à un seuil", () => {
    const threshold = randomInt(ctx.rng, 10, 12);
    const zones: readonly [string, string] = [`Moyenne inférieure à ${threshold}`, `Moyenne supérieure à ${threshold}`];
    const below = new Map<string, string>();
    const above = new Map<string, string>();
    let guard = 0;
    while ((below.size < 2 || above.size < 2) && guard++ < 3000) {
      const { values, mean2 } = drawSeries(ctx, "notes");
      if (mean2 === threshold * 2) continue;
      const text = listText(values);
      if (mean2 < threshold * 2 && below.size < 2) below.set(text, text);
      else if (mean2 > threshold * 2 && above.size < 2) above.set(text, text);
    }
    return {
      prompt: "Glisse chaque série dans la bonne case.",
      zones,
      items: [...[...below.keys()].map((text) => ({ text, zone: zones[0] })), ...[...above.keys()].map((text) => ({ text, zone: zones[1] }))],
      hints: ["Calcule la moyenne de chaque série.", "Compare-la au nombre écrit sur la case.", "Une moyenne plus petite que ce nombre va dans la première case."],
    };
  });
}
