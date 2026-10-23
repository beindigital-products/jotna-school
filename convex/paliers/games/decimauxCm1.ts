/**
 * LES NOMBRES DÉCIMAUX DU CM1 (`ma-cm1-decimaux`) : la partie entière et la partie décimale, le chiffre et la valeur d'un rang, écrire un nombre décimal,
 * le relier à sa fraction décimale, comparer et ranger, se situer, compléter une suite, additionner et soustraire, le complément à 1, à 10, à 100.
 *
 * Sur l'échantillon, le modèle écrivait « 4,5 < 4,25 » (parce que 5 est plus petit que 25), « 3,2 + 1,45 = 4,47 » (la virgule mal alignée), et appelait « partie
 * décimale » tantôt les chiffres après la virgule, tantôt la fraction. Ici le nombre est un entier de CENTIÈMES, jamais une chaîne tapée à la main : la comparaison,
 * la somme et le complément se calculent sur des entiers, et c'est `dec` (`cm1MathsOutils.ts`) qui l'écrit, avec une virgule française et sans zéro inutile.
 *
 * - LES CINQ PALIERS (`stepOf`) : les dixièmes d'un nombre à un chiffre ; les centièmes ; des nombres jusqu'à 99 avec un ou deux chiffres après la virgule ; jusqu'à
 *   499 ; les mêmes avec des retenues et des chiffres échangés. Les centièmes sont la plus fine unité (les millièmes sont au CM2).
 * - LA PARTIE DÉCIMALE d'un nombre est LES CHIFFRES qui suivent la virgule (« 67 » pour 45,67, « 05 » pour 4,05) : la question le dit, jamais « 0,67 ».
 * - LES ERREURS D'ENFANT : comparer comme deux entiers (4,5 contre 4,25 : « 25 est plus grand que 5 »), aligner à droite au lieu d'aligner les virgules, oublier la retenue,
 *   donner la valeur du chiffre dans le mauvais rang, prendre la partie décimale pour la partie entière.
 * - Aucun nombre n'est écrit avec un zéro inutile (« 4,50 »), un nombre de plus de trois chiffres entiers ne se trouve jamais, et les énoncés n'ont aucun « : », au plus
 *   une apostrophe droite, vingt-huit mots au plus. Aucun indice n'écrit un chiffre : un résultat se lirait dedans. Les cases d'un glissé s'appellent « Moins de… » et
 *   « Plus de… » : leurs indices n'emploient ni « moins » ni « plus ».
 *
 * MODULE PUR (voir `types.ts`).
 */
import { fresh, originOf, pick, randomInt, shuffle, type GameContext, type GeneratedGame } from "./shared";
import { choiceGame, gapGame, linkGame, sequenceGame, sortGame } from "./tableaux";
import { dec, plainDigits, show, stepOf, wrongDecimals, type Step } from "./cm1MathsOutils";

// ===========================================================================
// LES NOMBRES, EN CENTIÈMES
// ===========================================================================

type DecimalPlan = { whole: readonly [number, number]; decimals: readonly (1 | 2)[] };
/** La partie entière et le nombre de chiffres après la virgule servis à chaque palier. */
const PLAN: Record<Step, DecimalPlan> = {
  1: { whole: [0, 9], decimals: [1] },
  2: { whole: [0, 9], decimals: [2] },
  3: { whole: [1, 99], decimals: [1, 2] },
  4: { whole: [10, 499], decimals: [1, 2] },
  5: { whole: [10, 499], decimals: [1, 2] },
};

/** Un nombre décimal en centièmes : un chiffre des dixièmes quelconque, un chiffre des centièmes jamais nul quand il y en a un (pas de zéro inutile à droite). */
function drawDecimal(ctx: GameContext, wholeAtLeast = 0, decimals?: 1 | 2): number {
  const plan = PLAN[stepOf(ctx)];
  const places = decimals ?? pick(ctx.rng, plan.decimals);
  const whole = randomInt(ctx.rng, Math.max(plan.whole[0], wholeAtLeast), plan.whole[1]);
  const tenths = places === 1 ? randomInt(ctx.rng, 1, 9) : randomInt(ctx.rng, 0, 9);
  const hundredths = places === 2 ? randomInt(ctx.rng, 1, 9) : 0;
  return whole * 100 + tenths * 10 + hundredths;
}

/** Les chiffres après la virgule : « 67 » pour 45,67, « 6 » pour 45,6, « 05 » pour 4,05. */
const decimalDigits = (h: number) => (h % 100 === 0 ? "" : h % 10 === 0 ? String((h % 100) / 10) : String(h % 100).padStart(2, "0"));

/** Quatre rangs d'un nombre : les chiffres, leur nom et leur poids en centièmes. */
const RANKS: readonly { name: string; unit: number }[] = [
  { name: "centièmes", unit: 1 },
  { name: "dixièmes", unit: 10 },
  { name: "unités", unit: 100 },
  { name: "dizaines", unit: 1000 },
  { name: "centaines", unit: 10000 },
];

// ===========================================================================
// PARTIES, CHIFFRES, ÉCRITURE
// ===========================================================================

/** La valeur d'une suite de chiffres écrite comme un nombre : « 04 » et « 4 » valent la même chose. */
const asNumber = (text: string) => Number(text.replace(/ /g, ""));

/** Des choix de parties du nombre qui ne valent jamais la même chose que la bonne réponse ni que l'un de l'autre. */
function distinctParts(answer: string, options: readonly string[]): string[] {
  const seen = new Set([asNumber(answer)]);
  return options.filter((option) => {
    if (seen.has(asNumber(option))) return false;
    seen.add(asNumber(option));
    return true;
  });
}

/** « Quelle est la partie entière de 45,67 ? » ou « Quels chiffres forment la partie décimale de 45,67 ? » : 45, puis 67. */
export function makeCm1DcmParts(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "cm1-dcm-parties", "distinguer la partie entière et la partie décimale", () => {
    const h = drawDecimal(ctx, 1);
    const whole = Math.floor(h / 100);
    const digits = decimalDigits(h);
    const glued = show(Number(`${whole}${digits}`));
    if (ctx.rng() < 0.5) {
      const wrong = [digits, glued, String(whole).length > 1 ? String(whole).slice(0, -1) : digits[0], digits[0], show(whole + 1), show(whole + 2)].filter((option) => option !== show(whole));
      return {
        prompt: `Quelle est la partie entière de ${dec(h)} ?`,
        answer: show(whole),
        wrong: shuffle(ctx.rng, distinctParts(show(whole), wrong)),
        hints: ["La virgule sépare le nombre en deux parties.", "La partie entière est à gauche de la virgule.", "Les chiffres à droite de la virgule ne font pas partie de la partie entière."],
      };
    }
    const wrong = [show(whole), glued, digits[digits.length - 1], String(whole).length > 1 ? String(whole).slice(0, -1) : show(whole), show(whole + 1), show(whole + 2)].filter((option) => option !== digits);
    return {
      prompt: `Quels chiffres forment la partie décimale de ${dec(h)} ?`,
      answer: digits,
      wrong: shuffle(ctx.rng, distinctParts(digits, wrong)),
      hints: ["La virgule sépare le nombre en deux parties.", "La partie décimale est à droite de la virgule.", "Les chiffres à gauche de la virgule ne font pas partie de la partie décimale."],
    };
  });
}

/** Le nombre de chiffres à gauche et à droite de la virgule des nombres aux chiffres tous différents, par palier. */
const DIGIT_SHAPE: Record<Step, readonly [readonly number[], number]> = { 1: [[1], 1], 2: [[1, 2], 2], 3: [[2], 2], 4: [[2, 3], 2], 5: [[3], 2] };

/** « Quel est le chiffre des dixièmes de 45,67 ? » ou « Dans 45,67, quelle est la valeur du chiffre 6 ? » (dès le deuxième palier) : 0,6. */
export function makeCm1DcmDigits(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "cm1-dcm-chiffres", "le chiffre et la valeur d'un rang", () => {
    const step = stepOf(ctx);
    const [wholeLengths, places] = DIGIT_SHAPE[step];
    const wholeLength = pick(ctx.rng, wholeLengths);
    const all = String(plainDigits(ctx, wholeLength + places)).split("").map(Number);
    const wholeDigits = all.slice(0, wholeLength);
    const decimalPart = all.slice(wholeLength);
    const h = Number(wholeDigits.join("")) * 100 + decimalPart[0] * 10 + (decimalPart[1] ?? 0);
    // Le rang de chaque chiffre, de la gauche vers la droite : les dixièmes et les centièmes, puis les unités, les dizaines, les centaines.
    const ranks = [...wholeDigits.map((_, i) => RANKS[2 + wholeLength - 1 - i]), ...decimalPart.map((_, i) => RANKS[1 - i])];
    const index = randomInt(ctx.rng, 0, all.length - 1);
    const digit = all[index];
    const rank = ranks[index];
    if (step === 1 || ctx.rng() < 0.5) {
      const others = all.filter((d) => d !== digit);
      return {
        prompt: `Quel est le chiffre des ${rank.name} de ${dec(h)} ?`,
        answer: String(digit),
        wrong: shuffle(ctx.rng, [...others, ...Array.from({ length: 9 }, (_, i) => i + 1).filter((d) => d !== digit && !others.includes(d))]).map(String),
        hints: ["Après la virgule viennent les dixièmes, puis les centièmes.", "Avant la virgule viennent les unités, puis les dizaines et les centaines.", "Lis le nombre de la gauche vers la droite, rang par rang."],
      };
    }
    const value = digit * rank.unit;
    const otherValues = ranks.map((r) => digit * r.unit).filter((v) => v !== value);
    return {
      prompt: `Dans ${dec(h)}, quelle est la valeur du chiffre ${digit} ?`,
      answer: dec(value),
      wrong: wrongDecimals(ctx, value, [...otherValues, digit * 100, digit * 10, digit], 1, 99999),
      hints: ["Un chiffre vaut plus ou moins selon son rang.", "Cherche son rang : dixièmes, centièmes, unités, dizaines ou centaines.", "Un chiffre des dixièmes vaut un dixième de plus que le même chiffre des centièmes."],
    };
  });
}

type WriteForm = "dixiemes" | "centiemes" | "unitesDixiemes" | "unitesDixiemesCentiemes" | "fractionDixiemes" | "fractionCentiemes";
const WRITE_FORMS: Record<Step, readonly WriteForm[]> = {
  1: ["dixiemes", "unitesDixiemes"],
  2: ["centiemes", "unitesDixiemesCentiemes"],
  3: ["dixiemes", "centiemes", "fractionDixiemes"],
  4: ["centiemes", "unitesDixiemesCentiemes", "fractionDixiemes", "fractionCentiemes"],
  5: ["fractionCentiemes", "unitesDixiemesCentiemes", "fractionDixiemes"],
};

/** « Écris 7 dixièmes sous forme de nombre décimal. », « Écris en chiffres 3 unités et 4 dixièmes. », « Écris la fraction 125/100 sous forme de nombre décimal. » */
export function makeCm1DcmWrite(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "cm1-dcm-ecrire", () => {
    const step = stepOf(ctx);
    const form = pick(ctx.rng, WRITE_FORMS[step]);
    // Des nombres d'au moins deux unités, dixièmes ou centièmes : le pluriel de l'énoncé est toujours juste.
    const small = () => randomInt(ctx.rng, 2, 9);
    let prompt: string;
    let h: number;
    if (form === "dixiemes") {
      const t = small();
      prompt = `Écris ${t} dixièmes sous forme de nombre décimal.`;
      h = t * 10;
    } else if (form === "centiemes") {
      const c = randomInt(ctx.rng, 2, 99);
      prompt = `Écris ${c} centièmes sous forme de nombre décimal.`;
      h = c;
    } else if (form === "unitesDixiemes") {
      const [u, t] = [randomInt(ctx.rng, 2, 99), small()];
      prompt = `Écris en chiffres ${u} unités et ${t} dixièmes.`;
      h = u * 100 + t * 10;
    } else if (form === "unitesDixiemesCentiemes") {
      const [u, t, c] = [randomInt(ctx.rng, 2, step >= 4 ? 499 : 99), small(), small()];
      prompt = `Écris en chiffres ${u} unités, ${t} dixièmes et ${c} centièmes.`;
      h = u * 100 + t * 10 + c;
    } else if (form === "fractionDixiemes") {
      const t = randomInt(ctx.rng, 11, step >= 4 ? 999 : 99);
      prompt = `Écris la fraction ${t}/10 sous forme de nombre décimal.`;
      h = t * 10;
    } else {
      const c = randomInt(ctx.rng, 101, step >= 4 ? 999 : 199);
      prompt = `Écris la fraction ${c}/100 sous forme de nombre décimal.`;
      h = c;
    }
    return {
      type: "short-answer",
      prompt,
      payload: { acceptedAnswers: [dec(h)], game: originOf("cm1-dcm-ecrire", ctx), concept: "écrire un nombre décimal" },
      answerKey: dec(h),
      hints: ["Les unités s'écrivent avant la virgule.", "Les dixièmes s'écrivent juste après la virgule, puis les centièmes.", "Un rang sans rien se remplit par zéro, mais jamais à la fin du nombre."],
    };
  });
}

/** La fraction décimale d'un nombre décimal : « 3/10 », « 7/100 », « 125/100 ». */
const fractionOf = (h: number) => (h % 10 === 0 ? `${show(h / 10)}/10` : `${show(h)}/100`);

/** « Relie chaque nombre décimal à sa fraction décimale. » : trois nombres de valeurs différentes. */
export function makeCm1DcmLinks(ctx: GameContext): GeneratedGame {
  return linkGame(ctx, "cm1-dcm-relier", "relier un nombre décimal et sa fraction décimale", () => {
    const chosen: number[] = [];
    for (let attempt = 0; attempt < 100 && chosen.length < 3; attempt++) {
      const h = drawDecimal(ctx);
      if (!chosen.includes(h)) chosen.push(h);
    }
    return {
      prompt: "Relie chaque nombre décimal à sa fraction décimale.",
      pairs: chosen.map((h) => ({ left: dec(h), right: fractionOf(h) })),
      hints: ["Un seul chiffre après la virgule, c'est des dixièmes.", "Deux chiffres après la virgule, c'est des centièmes.", "Le nombre sans la virgule va au-dessus de la barre."],
    };
  });
}

// ===========================================================================
// COMPARER, RANGER, SE SITUER
// ===========================================================================

/** `count` nombres décimaux de valeurs différentes, dont l'écriture trompe : plus de chiffres ne veut pas dire plus grand. */
function comparableDecimals(ctx: GameContext, count: number): number[] {
  const step = stepOf(ctx);
  const plan = PLAN[step];
  for (let attempt = 0; attempt < 300; attempt++) {
    let list: number[];
    if (step === 1) {
      const whole = randomInt(ctx.rng, plan.whole[0], plan.whole[1]);
      list = shuffle(ctx.rng, [1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, count).map((t) => whole * 100 + t * 10);
    } else if (step === 2) {
      const whole = randomInt(ctx.rng, plan.whole[0], plan.whole[1]);
      list = Array.from({ length: count }, (_, i) => whole * 100 + randomInt(ctx.rng, 0, 9) * 10 + (i === 0 ? 0 : randomInt(ctx.rng, 0, 9)));
      // Un chiffre des centièmes jamais nul, sauf pour le nombre à un seul chiffre après la virgule.
      list = list.map((h, i) => (i > 0 && h % 10 === 0 ? h + randomInt(ctx.rng, 1, 9) : h));
      if (list[0] % 100 === 0) list[0] += randomInt(ctx.rng, 1, 9) * 10;
    } else if (step === 4) {
      // Les mêmes chiffres, échangés : 45,67 contre 45,76 contre 54,67.
      const length = 4;
      const base = String(plainDigits(ctx, length)).split("");
      const swaps = shuffle(ctx.rng, [0, 1, 2]).slice(0, count - 1);
      const numbers = [base, ...swaps.map((i) => {
        const copy = [...base];
        [copy[i], copy[i + 1]] = [copy[i + 1], copy[i]];
        return copy;
      })];
      list = numbers.map((digits) => Number(digits.join("")));
    } else {
      list = Array.from({ length: count }, () => drawDecimal(ctx));
      if (step === 5) {
        // Deux nombres de même partie entière et de mêmes dixièmes : seuls les centièmes les séparent.
        const shared = list[0] - (list[0] % 10);
        list[1] = shared + randomInt(ctx.rng, 1, 9);
      }
    }
    if (new Set(list).size === count && list.every((h) => h > 0)) return list;
  }
  return Array.from({ length: count }, (_, i) => 100 + (i + 1) * 10);
}

/** « Quel est le plus grand de ces nombres ? » : 4,5 ; 4,25 ; 4,05. */
export function makeCm1DcmCompare(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "cm1-dcm-comparer", "comparer des nombres décimaux", () => {
    const list = comparableDecimals(ctx, 3);
    const biggest = ctx.rng() < 0.6;
    const answer = biggest ? Math.max(...list) : Math.min(...list);
    return {
      prompt: `Quel est le ${biggest ? "plus grand" : "plus petit"} de ces nombres ?`,
      answer: dec(answer),
      wrong: list.filter((h) => h !== answer).map(dec),
      hints: [
        "Compare d'abord les parties entières.",
        "Si elles sont égales, compare les dixièmes, puis les centièmes.",
        "Écris un zéro à la fin des nombres courts pour qu'ils aient autant de chiffres après la virgule.",
      ],
    };
  });
}

/** « Range ces nombres du plus petit au plus grand. » : quatre nombres décimaux de valeurs différentes. */
export function makeCm1DcmOrder(ctx: GameContext): GeneratedGame {
  return sequenceGame(ctx, "cm1-dcm-ordre", "ranger des nombres décimaux", () => {
    const list = comparableDecimals(ctx, 4);
    const ascending = stepOf(ctx) < 3 || ctx.rng() < 0.6;
    return {
      prompt: ascending ? "Range ces nombres du plus petit au plus grand." : "Range ces nombres du plus grand au plus petit.",
      sequence: [...list].sort((a, b) => (ascending ? a - b : b - a)).map(dec),
      hints: [
        "Compare d'abord les parties entières.",
        "Si elles sont égales, compare les dixièmes, puis les centièmes.",
        "Écris un zéro à la fin des nombres courts pour qu'ils aient autant de chiffres après la virgule.",
      ],
    };
  });
}

/** Le seuil d'un glissé et l'écart des nombres autour de lui, en centièmes, par palier. */
function drawThreshold(ctx: GameContext): { threshold: number; span: number } {
  const step = stepOf(ctx);
  if (step === 1) return { threshold: randomInt(ctx.rng, 1, 8) * 100 + 50, span: 300 };
  if (step === 2) return { threshold: randomInt(ctx.rng, 1, 8) * 100 + pick(ctx.rng, [25, 50, 75]), span: 200 };
  if (step === 3) return { threshold: randomInt(ctx.rng, 5, 60) * 100 + pick(ctx.rng, [0, 25, 50, 75]), span: 400 };
  return { threshold: randomInt(ctx.rng, 10, 300) * 100 + pick(ctx.rng, [0, 25, 50, 75]), span: 800 };
}

/** « Glisse chaque nombre dans la bonne case. » : moins ou plus de 2,5. Le seuil n'est jamais un des nombres. */
export function makeCm1DcmSort(ctx: GameContext): GeneratedGame {
  return sortGame(ctx, "cm1-dcm-glisser", "placer des nombres décimaux par rapport à un seuil", () => {
    const { threshold, span } = drawThreshold(ctx);
    const each = stepOf(ctx) === 1 ? 2 : 3;
    // Au premier palier, des dixièmes seulement : un chiffre après la virgule.
    const grain = stepOf(ctx) === 1 ? 10 : 1;
    const draw = (from: number, to: number) => {
      const out = new Set<number>();
      while (out.size < each) {
        const h = randomInt(ctx.rng, Math.ceil(from / grain), Math.floor(to / grain)) * grain;
        if (h > 0 && h !== threshold) out.add(h);
      }
      return [...out];
    };
    const below = draw(Math.max(1, threshold - span), threshold - 1);
    const above = draw(threshold + 1, threshold + span);
    const lowZone = `Moins de ${dec(threshold)}`;
    const highZone = `Plus de ${dec(threshold)}`;
    return {
      prompt: "Glisse chaque nombre dans la bonne case.",
      zones: [lowZone, highZone],
      items: [...below.map((h) => ({ text: dec(h), zone: lowZone })), ...above.map((h) => ({ text: dec(h), zone: highZone }))],
      hints: ["Compare d'abord les parties entières.", "Si elles sont égales, regarde les dixièmes, puis les centièmes.", "Écris un zéro à la fin du nombre le plus court pour comparer."],
    };
  });
}

// ===========================================================================
// UNE SUITE, DES CALCULS
// ===========================================================================

/** Les pas d'une suite en centièmes et le plus grand terme, par palier. */
const SUITE_STEPS: Record<Step, readonly number[]> = { 1: [10], 2: [10, 50], 3: [25, 50, 5], 4: [2, 5, 25, 50], 5: [5, 25, 75] };
const SUITE_TOP: Record<Step, number> = { 1: 300, 2: 1000, 3: 3000, 4: 10000, 5: 30000 };

/** « Complète la suite de nombres. 0,5 ; 1 ; 1,5 ; ___ ; 2,5 » : un seul pas, un seul nombre qui manque. */
export function makeCm1DcmSuite(ctx: GameContext): GeneratedGame {
  return gapGame(ctx, "cm1-dcm-suite", "compléter une suite de nombres décimaux", () => {
    const step = stepOf(ctx);
    const size = pick(ctx.rng, SUITE_STEPS[step]);
    const length = 5;
    const descending = step >= 2 && ctx.rng() < 0.4;
    // Un premier terme multiple du pas, positif : « 0,5 ; 1 ; 1,5 » se lit mieux que « 0,37 ; 0,87 ».
    const last = Math.floor(SUITE_TOP[step] / size);
    const startK = descending ? randomInt(ctx.rng, length, last) : randomInt(ctx.rng, 1, last - (length - 1));
    const values = Array.from({ length }, (_, i) => (startK + (descending ? -i : i)) * size);
    const blank = step >= 3 ? randomInt(ctx.rng, 1, length - 2) : length - 1;
    const answer = values[blank];
    return {
      prompt: descending ? "Complète la suite de nombres. Elle descend toujours du même pas." : "Complète la suite de nombres. Elle avance toujours du même pas.",
      text: values.map((value, i) => (i === blank ? "___" : dec(value))).join(" ; "),
      answer: dec(answer),
      wrong: wrongDecimals(ctx, answer, [answer + size, answer - size, answer + 2 * size, answer + size * 10, answer - size * 10], 1, 99999, values),
      hints: [
        "Regarde deux nombres qui se suivent : de combien avance-t-on ?",
        "Vérifie ce même pas avec les autres nombres de la suite.",
        "Ajoute ou enlève ce pas au nombre d'à côté, en alignant les virgules.",
      ],
    };
  });
}

/** Les chiffres d'un nombre décimal collés sans la virgule, comme le fait l'enfant qui additionne en entiers : 4,5 et 2,35 donnent 45 et 235. */
const glued = (h: number) => Number(`${Math.floor(h / 100)}${decimalDigits(h)}`);

/** « Calcule 4,5 + 2,35. » ou « Calcule 7,2 − 3,45. » : aligner les virgules, poser la retenue. */
export function makeCm1DcmCalc(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "cm1-dcm-calcul", "additionner et soustraire des nombres décimaux", () => {
    const step = stepOf(ctx);
    const subtract = step >= 3 && ctx.rng() < 0.5;
    let a = drawDecimal(ctx);
    let b = drawDecimal(ctx);
    // Une soustraction a un résultat positif ; une addition de deux nombres longs reste sous 1 000.
    if (subtract && a < b) [a, b] = [b, a];
    if (subtract && a === b) a += 10;
    const result = subtract ? a - b : a + b;
    // Les erreurs d'enfant : un chiffre des dixièmes lu comme des centièmes, les chiffres collés comme des entiers, une retenue oubliée ou ajoutée.
    const misaligned = (h: number) => Math.floor(h / 100) * 100 + (h % 100) / 10;
    const pool = [
      subtract ? misaligned(a) - b : misaligned(a) + b,
      subtract ? a - misaligned(b) : a + misaligned(b),
      subtract ? glued(a) - glued(b) : glued(a) + glued(b),
      result + 10,
      result - 10,
      result + 100,
      result - 100,
    ];
    return {
      prompt: `Calcule ${dec(a)} ${subtract ? "−" : "+"} ${dec(b)}.`,
      answer: dec(result),
      wrong: wrongDecimals(ctx, result, pool.filter((value) => Number.isInteger(value)), 1, 99999),
      hints: [
        "Écris les nombres l'un sous l'autre, virgule sous virgule.",
        "Complète avec des zéros pour que les nombres aient autant de chiffres après la virgule.",
        "Calcule comme avec des nombres entiers, puis place la virgule sous les autres.",
      ],
    };
  });
}

/** Le total à atteindre et la forme du nombre de départ, par palier. */
const COMPLEMENT_PLAN: Record<Step, readonly { total: number; decimals: 1 | 2 }[]> = {
  1: [{ total: 100, decimals: 1 }],
  2: [{ total: 100, decimals: 2 }],
  3: [{ total: 1000, decimals: 1 }, { total: 1000, decimals: 2 }],
  4: [{ total: 1000, decimals: 2 }, { total: 10000, decimals: 1 }],
  5: [{ total: 10000, decimals: 2 }, { total: 10000, decimals: 1 }],
};

/** « 0,35 + ___ = 1 » ou « 6,4 + ___ = 10 » : le complément à 1, à 10, à 100. */
export function makeCm1DcmComplement(ctx: GameContext): GeneratedGame {
  return gapGame(ctx, "cm1-dcm-complement", "chercher le complément d'un nombre décimal", () => {
    const { total, decimals } = pick(ctx.rng, COMPLEMENT_PLAN[stepOf(ctx)]);
    const wholeMax = Math.floor(total / 100) - 1;
    // Un nombre plus petit que le total, sans zéro inutile à droite ; le complément n'en a pas non plus.
    let a = 0;
    for (let attempt = 0; attempt < 100; attempt++) {
      const whole = total === 100 ? 0 : randomInt(ctx.rng, total === 1000 ? 1 : 10, wholeMax);
      const tenths = decimals === 1 ? randomInt(ctx.rng, 1, 9) : randomInt(ctx.rng, 0, 9);
      const hundredths = decimals === 2 ? randomInt(ctx.rng, 1, 9) : 0;
      a = whole * 100 + tenths * 10 + hundredths;
      if (a > 0 && a < total) break;
    }
    const answer = total - a;
    return {
      prompt: "Complète avec le bon nombre.",
      text: `${dec(a)} + ___ = ${dec(total)}`,
      answer: dec(answer),
      wrong: wrongDecimals(ctx, answer, [answer + 10, answer - 10, answer + 100, answer - 100, a, answer + 1, answer - 1], 1, 99999, [a]),
      hints: ["Cherche ce qu'il faut ajouter pour arriver au total.", "Compte d'abord jusqu'à la prochaine unité, puis jusqu'au total.", "Vérifie en additionnant ta réponse au premier nombre."],
    };
  });
}
