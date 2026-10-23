/**
 * LES NOMBRES DU CE2 : jusqu'à 100 000 (`ma-ce2-grands-nombres`). Le voisin d'un nombre, comparer, ranger, le chiffre et la valeur d'un rang, décomposer,
 * encadrer, placer par rapport à un seuil, compléter une suite, les écrire en lettres et les lire.
 *
 * Sur l'échantillon de CE2, la fiche n'avait qu'un jeu de code sur dix (la suite de nombres du site, qui plafonne bien en dessous de 100 000) ; les neuf
 * autres exercices étaient écrits par le modèle, qui écrit mal les grands nombres en lettres (« vingt-et-un mille », « quatre-vingts mille »). Ici la
 * réponse est CALCULÉE, jamais écrite, et le mot d'un nombre vient d'UNE fonction, `wordsOfCe2`, que le test recalcule avec sa propre table.
 *
 * LE PLAFOND est 100 000, jamais dépassé, ni dans l'énoncé ni dans un choix. Le plus grand nombre d'un palier monte avec sa position : 20 000, 40 000,
 * 70 000, 100 000. Le plus petit est 1 000 aux deux premiers paliers, 10 000 ensuite. Le nombre 100 000 n'est servi que comme voisin d'un nombre ou
 * comme fin d'une suite : jamais comme chiffre, décomposition, nombre en lettres ou à écrire (six chiffres, un rang de plus).
 *
 * LES NOMBRES S'ÉCRIVENT comme à l'école : les milliers séparés par une espace (« 45 678 », `formatNumber`), et en lettres sans trait d'union au-delà
 * de cent : « quarante-cinq mille six cent soixante-dix-huit », « quatre-vingt mille » (sans s : mille est un mot de nombre derrière), « deux cent mille »
 * (sans s), « deux cents » (un s quand rien ne suit), « vingt et un mille ». Une réponse à écrire en chiffres accepte « 45678 » et « 45 678 ».
 *
 * Les mauvais choix sont des erreurs d'enfant : le nombre lui-même, une dizaine, une centaine ou un millier de plus ou de moins, les chiffres échangés, un
 * rang pour un autre. Aucun indice n'écrit un chiffre : un nombre se lirait dedans.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { fresh, originOf, pick, randomInt, shuffle, type GameContext, type GameLevel, type GeneratedGame } from "./shared";
import { choiceGame, firstLetter, gapGame, sequenceGame, sortGame } from "./tableaux";
import { formatNumber } from "./patterns";
import { inWords } from "./nombresCp";
import { wrongNumbersCe1 } from "./nombresCe1";

// ===========================================================================
// LA PLAGE, LES RANGS ET LES MOTS
// ===========================================================================

const LOW: Record<GameLevel, number> = { 1: 1000, 2: 1000, 3: 10000, 4: 10000 };
const TOP: Record<GameLevel, number> = { 1: 20000, 2: 40000, 3: 70000, 4: 100000 };
/** Le plafond de la fiche : aucun nombre au-delà. */
export const CAP_CE2 = 100000;
/** Le plus grand nombre à cinq chiffres : les kinds qui lisent les rangs ne servent pas 100 000. */
const FIVE_DIGITS_TOP = 99999;

/** Le plus petit nombre servi et le plus grand de ce palier. */
export function rangeOfCe2(ctx: GameContext): { lo: number; top: number } {
  return { lo: LOW[ctx.level], top: TOP[ctx.level] };
}

const show = (n: number) => formatNumber(n);

/**
 * Un nombre de 0 à 100 000 en lettres, comme à l'école de France et du Sénégal. Au-dessus de cent, aucun trait d'union entre les mots ; « cent » et
 * « vingt » ne prennent un s que sans mot derrière (« deux cents », « quatre-vingts »), jamais devant « mille » ni un autre mot.
 */
export function wordsOfCe2(n: number): string {
  const parts: string[] = [];
  const thousands = Math.floor(n / 1000);
  const rest = n % 1000;
  if (thousands === 1) parts.push("mille");
  else if (thousands > 1) {
    const head = thousands === 100 ? "cent" : thousands === 80 ? "quatre-vingt" : inWords(thousands);
    parts.push(`${head} mille`);
  }
  const hundreds = Math.floor(rest / 100);
  const under = rest % 100;
  if (hundreds === 1) parts.push("cent");
  else if (hundreds > 1) parts.push(`${inWords(hundreds)} cent${under === 0 ? "s" : ""}`);
  if (under > 0 || parts.length === 0) parts.push(inWords(under));
  return parts.join(" ");
}

/** Le chiffre d'un rang : 0 les unités, 1 les dizaines, 2 les centaines, 3 les milliers, 4 les dizaines de mille. */
const digitAt = (n: number, rank: number) => Math.floor(n / 10 ** rank) % 10;
const RANK_NAMES = ["unités", "dizaines", "centaines", "milliers", "dizaines de mille"] as const;
const RANK_SINGULAR = ["unité", "dizaine", "centaine", "millier", "dizaine de mille"] as const;
const plural = (n: number, rank: number) => `${n} ${n > 1 ? RANK_NAMES[rank] : RANK_SINGULAR[rank]}`;

/** Un nombre à cinq chiffres, tous différents et aucun zéro : chaque chiffre a une seule place et une seule valeur. */
function plainNumber(ctx: GameContext, lo: number, top: number): number {
  for (let attempt = 0; attempt < 800; attempt++) {
    const n = randomInt(ctx.rng, Math.max(lo, 10000), Math.min(top, FIVE_DIGITS_TOP));
    const text = String(n);
    if (!text.includes("0") && new Set(text).size === 5) return n;
  }
  return 12345;
}

/** `count` nombres différents de [lo, top], dont deux du même millier quand `shareBlock` : la comparaison devient moins évidente. */
function distinctNumbers(ctx: GameContext, count: number, lo: number, top: number, shareBlock: boolean): number[] {
  const out: number[] = [];
  if (shareBlock) {
    const start = randomInt(ctx.rng, Math.ceil(lo / 1000), Math.floor((top - 999) / 1000));
    const same = new Set<number>();
    while (same.size < 2) same.add(start * 1000 + randomInt(ctx.rng, 0, 999));
    out.push(...same);
  }
  while (out.length < count) {
    const n = randomInt(ctx.rng, lo, top);
    if (!out.includes(n)) out.push(n);
  }
  return shuffle(ctx.rng, out);
}

// ===========================================================================
// LE VOISIN, COMPARER, RANGER
// ===========================================================================

const NEIGHBOUR_STEP: Record<GameLevel, number> = { 1: 100, 2: 1000, 3: 1000, 4: 10000 };
const NEIGHBOUR_TRICKY: Record<GameLevel, number> = { 1: 0.3, 2: 0.5, 3: 0.6, 4: 0.7 };

/** « Quel nombre vient juste après 39 999 ? » : souvent un nombre qui change de centaine, de millier ou de dizaine de mille. */
export function makeCe2NbNeighbour(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce2-nb-voisin", "le nombre qui vient juste avant ou juste après", () => {
    const { lo, top } = rangeOfCe2(ctx);
    const after = ctx.rng() < 0.5;
    const step = NEIGHBOUR_STEP[ctx.level];
    let n: number;
    if (ctx.rng() < NEIGHBOUR_TRICKY[ctx.level]) {
      // Un nombre qui finit par 9 (ou 99, ou 999) a un suivant qui change de rang ; un multiple a un précédent qui finit par 9.
      const multiple = step * randomInt(ctx.rng, Math.ceil((lo + 1) / step), Math.floor(top / step));
      n = after ? multiple - 1 : multiple;
    } else {
      n = after ? randomInt(ctx.rng, lo, top - 1) : randomInt(ctx.rng, lo + 1, top);
    }
    const answer = after ? n + 1 : n - 1;
    return {
      prompt: `Quel nombre vient juste ${after ? "après" : "avant"} ${show(n)} ?`,
      answer: show(answer),
      wrong: wrongNumbersCe1(ctx, answer, [n, after ? answer + 10 : answer - 10, after ? answer - 100 : answer + 100, after ? answer + 1000 : answer - 1000, after ? answer - 1000 : answer + 1000], lo - 1, top),
      hints: [
        "Dis les nombres en comptant, depuis le début.",
        after ? "Le nombre d'après est un de plus." : "Le nombre d'avant est un de moins.",
        "Fais attention quand un chiffre arrive au bout : la dizaine, la centaine ou le millier change.",
      ],
    };
  });
}

/** « Quel est le plus grand de ces nombres ? » : trois nombres différents, dont deux du même millier dès le deuxième palier. */
export function makeCe2NbCompare(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce2-nb-comparer", "comparer des nombres", () => {
    const { lo, top } = rangeOfCe2(ctx);
    const numbers = distinctNumbers(ctx, 3, lo, top, ctx.level >= 2);
    const biggest = ctx.rng() < 0.6;
    const answer = biggest ? Math.max(...numbers) : Math.min(...numbers);
    return {
      prompt: `Quel est le ${biggest ? "plus grand" : "plus petit"} de ces nombres ?`,
      answer: show(answer),
      wrong: numbers.filter((n) => n !== answer).map(show),
      hints: [
        "Compare d'abord le nombre de chiffres de chaque nombre.",
        "Si c'est le même, regarde le chiffre de gauche, puis le suivant.",
        biggest ? "Le plus grand est celui qui a le plus fort chiffre au rang le plus à gauche." : "Le plus petit est celui qui a le plus faible chiffre au rang le plus à gauche.",
      ],
    };
  });
}

/** « Mets ces nombres dans l'ordre, du plus petit au plus grand. » : quatre nombres différents. */
export function makeCe2NbOrder(ctx: GameContext): GeneratedGame {
  return sequenceGame(ctx, "ce2-nb-ordre", "ranger des nombres", () => {
    const { lo, top } = rangeOfCe2(ctx);
    const numbers = distinctNumbers(ctx, 4, lo, top, ctx.level >= 2);
    const ascending = ctx.level < 3 || ctx.rng() < 0.6;
    return {
      prompt: ascending ? "Mets ces nombres dans l'ordre, du plus petit au plus grand." : "Mets ces nombres dans l'ordre, du plus grand au plus petit.",
      sequence: numbers.sort((a, b) => (ascending ? a - b : b - a)).map(show),
      hints: [
        "Compare d'abord le nombre de chiffres de chaque nombre.",
        ascending ? "Le plus petit nombre est celui dont le chiffre de gauche est le plus faible : mets-le au début." : "Le plus grand nombre est celui dont le chiffre de gauche est le plus fort : mets-le au début.",
        "Si deux nombres ont le même chiffre de gauche, regarde le chiffre d'après.",
      ],
    };
  });
}

// ===========================================================================
// LE CHIFFRE ET LA VALEUR D'UN RANG, DÉCOMPOSER, ENCADRER
// ===========================================================================

/** « Quel est le chiffre des dizaines de mille de 45 678 ? » ou « Dans 45 678, quelle est la valeur du chiffre 5 ? » (dès le deuxième palier). */
export function makeCe2NbDigits(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce2-nb-chiffres", "le chiffre et la valeur d'un rang", () => {
    const { lo, top } = rangeOfCe2(ctx);
    const n = plainNumber(ctx, lo, top);
    const rank = randomInt(ctx.rng, 0, 4);
    const digit = digitAt(n, rank);
    if (ctx.level === 1 || ctx.rng() < 0.5) {
      const others = String(n).split("").map(Number).filter((d) => d !== digit);
      return {
        prompt: `Quel est le chiffre des ${RANK_NAMES[rank]} de ${show(n)} ?`,
        answer: String(digit),
        wrong: shuffle(ctx.rng, [...others, ...Array.from({ length: 9 }, (_, i) => i + 1).filter((d) => d !== digit && !others.includes(d))]).map(String),
        hints: [
          "Les unités sont le chiffre tout à droite.",
          "Va vers la gauche : les dizaines, les centaines, les milliers, puis les dizaines de mille.",
          "Compte les rangs depuis la droite, en partant des unités.",
        ],
      };
    }
    const value = digit * 10 ** rank;
    return {
      prompt: `Dans ${show(n)}, quelle est la valeur du chiffre ${digit} ?`,
      answer: show(value),
      wrong: wrongNumbersCe1(ctx, value, [digit, digit * 10 ** (rank + 1), rank > 0 ? digit * 10 ** (rank - 1) : -1, digit * 10 ** ((rank + 2) % 5)], 1, FIVE_DIGITS_TOP),
      hints: [
        "Le chiffre vaut plus ou moins selon sa place dans le nombre.",
        "Cherche son rang : unités, dizaines, centaines, milliers ou dizaines de mille.",
        "Ajoute autant de zéros que le chiffre a de rangs à sa droite.",
      ],
    };
  });
}

/** Quatre façons de décomposer, du plus simple au plus fin : le palier choisit la sienne. */
export function makeCe2NbDecompose(ctx: GameContext): GeneratedGame {
  return gapGame(ctx, "ce2-nb-decomposer", "décomposer un nombre", () => {
    const { lo, top } = rangeOfCe2(ctx);
    const n = plainNumber(ctx, lo, top);
    const parts = Array.from({ length: 5 }, (_, i) => digitAt(n, 4 - i) * 10 ** (4 - i));
    const swapped = Number(String(n).split("").reverse().join(""));
    const forms = ctx.level === 1 ? [1, 3] : ctx.level === 2 ? [0, 1, 3] : ctx.level === 3 ? [0, 2, 3] : [0, 1, 2, 3];
    const form = pick(ctx.rng, forms);
    const near = [swapped, n + 10, n - 10, n + 100, n - 100, n + 1000];
    if (form === 0) {
      // Un rang manque : les unités sauf au dernier palier, où n'importe lequel sauf le premier peut manquer.
      const missing = ctx.level >= 4 ? randomInt(ctx.rng, 1, 4) : 4;
      const text = `${show(n)} = ${parts.map((part, i) => (i === missing ? "___" : show(part))).join(" + ")}`;
      const value = parts[missing];
      const rank = 4 - missing;
      const digit = digitAt(n, rank);
      return {
        prompt: "Complète avec le bon nombre.",
        text,
        answer: show(value),
        wrong: wrongNumbersCe1(ctx, value, [digit, digit * 10 ** (rank + 1), rank > 0 ? digit * 10 ** (rank - 1) : -1], 1, FIVE_DIGITS_TOP),
        hints: ["Les autres parties sont déjà écrites.", "Cherche le chiffre du rang qui manque.", "Ajoute autant de zéros que le chiffre a de rangs à sa droite."],
      };
    }
    if (form === 1) {
      const said = Array.from({ length: 5 }, (_, i) => plural(digitAt(n, 4 - i), 4 - i));
      const text = `${said.slice(0, -1).join(", ")} et ${said[said.length - 1]}, c'est le nombre ___.`;
      return {
        prompt: "Complète avec le bon nombre.",
        text,
        answer: show(n),
        wrong: wrongNumbersCe1(ctx, n, near, lo, FIVE_DIGITS_TOP),
        hints: ["Chaque rang donne un chiffre.", "Écris d'abord le chiffre des plus grands rangs, à gauche.", "Les unités se mettent tout à droite."],
      };
    }
    if (form === 2) {
      // Chaque rang s'écrit « chiffre × valeur du rang » (« 4 × 10 000 »), sauf les unités, dont le chiffre s'écrit seul.
      const terms = parts.map((_, i) => (i === 4 ? String(digitAt(n, 0)) : `${digitAt(n, 4 - i)} × ${show(10 ** (4 - i))}`));
      return {
        prompt: "Complète avec le bon nombre.",
        text: `${terms.join(" + ")} = ___`,
        answer: show(n),
        wrong: wrongNumbersCe1(ctx, n, near, lo, FIVE_DIGITS_TOP),
        hints: ["Un chiffre multiplié par un rang donne sa valeur.", "Additionne les valeurs, des plus grandes aux plus petites.", "Chaque valeur se place à son rang dans le nombre."],
      };
    }
    return {
      prompt: "Complète avec le bon nombre.",
      text: `${parts.map(show).join(" + ")} = ___`,
      answer: show(n),
      wrong: wrongNumbersCe1(ctx, n, near, lo, FIVE_DIGITS_TOP),
      hints: ["Les parties sont déjà des valeurs de rang.", "Écris chaque chiffre à sa place, de gauche à droite.", "Les unités se mettent tout à droite."],
    };
  });
}

/** Le rang d'un encadrement par palier : les milliers, puis les dizaines de mille, puis l'un des trois. */
function bracketUnit(ctx: GameContext): number {
  return ctx.level <= 2 ? 1000 : ctx.level === 3 ? 10000 : pick(ctx.rng, [100, 1000, 10000]);
}

/** « Entre quels milliers se trouve 12 345 ? » : les milliers aux deux premiers paliers, les dizaines de mille au troisième, un des trois au dernier. */
export function makeCe2NbBracket(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce2-nb-encadrer", "encadrer un nombre", () => {
    const { lo, top } = rangeOfCe2(ctx);
    const unit = bracketUnit(ctx);
    const max = Math.min(top, FIVE_DIGITS_TOP);
    // Un nombre qui n'est pas un multiple du rang, dans la plage du palier : le décaler d'un multiple dépasserait parfois le plafond du palier.
    let n = randomInt(ctx.rng, lo, max);
    for (let attempt = 0; attempt < 50 && n % unit === 0; attempt++) n = randomInt(ctx.rng, lo, max);
    if (n % unit === 0) n += 1;
    const below = Math.floor(n / unit) * unit;
    const label = (low: number) => `${show(low)} et ${show(low + unit)}`;
    const wrong = [below - unit, below + unit].filter((low) => low >= 0 && low + unit <= CAP_CE2);
    if (wrong.length < 2) wrong.push(below + 2 * unit + unit <= CAP_CE2 ? below + 2 * unit : below - 2 * unit);
    const what = unit === 100 ? "quelles centaines" : unit === 1000 ? "quels milliers" : "quelles dizaines de mille";
    const unitWord = unit === 100 ? "cent" : unit === 1000 ? "mille" : "dix mille";
    return {
      prompt: `Entre ${what} se trouve ${show(n)} ?`,
      answer: label(below),
      wrong: wrong.slice(0, 2).map(label),
      hints: [
        `Cherche le multiple de ${unitWord} juste en dessous du nombre.`,
        "Le nombre est plus grand que la plus petite borne et plus petit que la plus grande.",
        "Garde les chiffres de gauche, mets des zéros derrière.",
      ],
    };
  });
}

// ===========================================================================
// SE SITUER, COMPLÉTER UNE SUITE
// ===========================================================================

/** `count` entiers différents de [from, to]. */
function distinctInRange(ctx: GameContext, from: number, to: number, count: number): number[] {
  const out = new Set<number>();
  while (out.size < count) out.add(randomInt(ctx.rng, from, to));
  return [...out];
}

/** « Glisse chaque nombre dans la bonne case. » : moins de 30 000 ou plus de 30 000. Le seuil est un multiple de dix mille et n'est jamais un des nombres. */
export function makeCe2NbSortThreshold(ctx: GameContext): GeneratedGame {
  return sortGame(ctx, "ce2-nb-glisser", "placer des nombres par rapport à un seuil", () => {
    const { lo, top } = rangeOfCe2(ctx);
    const each = ctx.level === 1 ? 2 : 3;
    const thresholds: number[] = [];
    for (let t = Math.ceil((lo + 1) / 10000) * 10000; t < top; t += 10000) if (t - lo >= each && top - t >= each) thresholds.push(t);
    const threshold = pick(ctx.rng, thresholds);
    const below = distinctInRange(ctx, lo, threshold - 1, each);
    const above = distinctInRange(ctx, threshold + 1, top, each);
    const lowZone = `Moins de ${show(threshold)}`;
    const highZone = `Plus de ${show(threshold)}`;
    return {
      prompt: "Glisse chaque nombre dans la bonne case.",
      zones: [lowZone, highZone],
      items: [...below.map((n) => ({ text: show(n), zone: lowZone })), ...above.map((n) => ({ text: show(n), zone: highZone }))],
      hints: ["Lis les nombres un par un.", "Compare chaque nombre au nombre de la case.", "Regarde d'abord le chiffre de gauche."],
    };
  });
}

/** Les pas d'une suite, par palier : des pas qu'on compte de tête, du plus facile au plus fin. */
const SUITE_STEPS: Record<GameLevel, readonly number[]> = { 1: [1000], 2: [1000, 5000], 3: [2000, 5000, 10000], 4: [250, 500, 2500, 5000, 20000] };

/** « Complète la suite : 12 000, 13 000, 14 000, ___ » : un seul pas, un seul nombre qui manque. Dès le troisième palier, le nombre qui manque est au milieu. */
export function makeCe2NbSuite(ctx: GameContext): GeneratedGame {
  return gapGame(ctx, "ce2-nb-suite", "compléter une suite de nombres", () => {
    const { lo, top } = rangeOfCe2(ctx);
    const step = pick(ctx.rng, SUITE_STEPS[ctx.level]);
    const length = 5;
    const span = (length - 1) * step;
    const descending = ctx.level >= 2 && ctx.rng() < 0.4;
    // Le premier terme est un multiple du pas : « 12 000, 13 000 » se lit mieux que « 12 345, 13 345 ».
    const first = Math.ceil(lo / step);
    const last = Math.floor(top / step);
    const startK = randomInt(ctx.rng, first + (descending ? length - 1 : 0), last - (descending ? 0 : length - 1));
    const start = startK * step;
    const values = Array.from({ length }, (_, i) => (descending ? start - i * step : start + i * step));
    const blank = ctx.level >= 3 ? randomInt(ctx.rng, 1, length - 2) : length - 1;
    const answer = values[blank];
    return {
      prompt: descending ? "Complète la suite de nombres. Elle descend toujours du même pas." : "Complète la suite de nombres. Elle avance toujours du même pas.",
      text: values.map((value, i) => (i === blank ? "___" : show(value))).join(", "),
      answer: show(answer),
      wrong: wrongNumbersCe1(ctx, answer, [answer + step, answer - step, answer + 2 * step, answer + 1000, answer - 1000], Math.max(0, lo - span), CAP_CE2),
      hints: [
        "Regarde deux nombres qui se suivent : de combien avance-t-on ?",
        "Vérifie ce même pas avec les autres nombres de la suite.",
        "Ajoute ou enlève ce pas au nombre d'à côté.",
      ],
    };
  });
}

// ===========================================================================
// LES NOMBRES EN LETTRES
// ===========================================================================

/** Les trois conseils d'un nombre écrit en lettres, selon sa famille de mots. Aucun ne contient un chiffre. */
function wordHints(n: number): [string, string, string] {
  const family =
    n >= 10000
      ? "Les dizaines de mille se disent avant le mot mille, qui ne prend jamais de s."
      : n >= 1000
        ? "Mille ne prend jamais de s, et les milliers se disent avant les centaines."
        : "Le premier mot dit les centaines, le suivant les dizaines, le dernier les unités.";
  return ["Dis le nombre à voix haute, doucement.", "Cherche d'abord les plus grands rangs, puis les plus petits.", family];
}

/** « Quel nombre s'écrit « quarante-cinq mille six cent soixante-dix-huit » ? » */
export function makeCe2NbWords(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce2-nb-lettres", "lire un nombre écrit en lettres", () => {
    const { lo, top } = rangeOfCe2(ctx);
    const n = randomInt(ctx.rng, lo, Math.min(top, FIVE_DIGITS_TOP));
    const swapped = Number(String(n).split("").reverse().join(""));
    return {
      prompt: `Quel nombre s'écrit « ${wordsOfCe2(n)} » ?`,
      answer: show(n),
      wrong: wrongNumbersCe1(ctx, n, [n - 10, n + 10, n - 100, n + 100, n - 1000, n + 1000, swapped, n + 1], lo, FIVE_DIGITS_TOP),
      hints: wordHints(n),
    };
  });
}

/** « Écris en chiffres le nombre « quarante-cinq mille six cent soixante-dix-huit ». » : une réponse courte (« 45678 » vaut « 45 678 »). */
export function makeCe2NbWriteNumber(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "ce2-nb-ecrire", () => {
    const { lo, top } = rangeOfCe2(ctx);
    const n = randomInt(ctx.rng, lo, Math.min(top, FIVE_DIGITS_TOP));
    const words = wordsOfCe2(n);
    return {
      type: "short-answer",
      prompt: `Écris en chiffres le nombre « ${words} ».`,
      payload: { acceptedAnswers: [String(n)], game: originOf("ce2-nb-ecrire", ctx), concept: "écrire en chiffres un nombre dit en lettres" },
      answerKey: String(n),
      hints: [
        "Dis le nombre à voix haute, doucement.",
        n >= 10000 ? "Ce nombre s'écrit avec cinq chiffres." : "Ce nombre s'écrit avec quatre chiffres.",
        `Le premier mot commence par la lettre ${firstLetter(words)}.`,
      ],
    };
  });
}
