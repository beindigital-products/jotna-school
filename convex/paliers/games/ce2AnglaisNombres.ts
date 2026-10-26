/**
 * LES GABARITS DES NOMBRES DE 20 À 100 EN ANGLAIS, AU CE2 (`an-ce2-numbers-100`).
 *
 * Le CM1 compte en anglais jusqu'à cent au marché (`an-cm1-market`) sans que personne ait appris les dizaines : le plan
 * (`docs/programme-anglais-v2.md`, lot 3) les place au CE2, après les nombres de 0 à 20 du CP.
 *
 * TROIS PALIERS, TROIS PARTS D'UN TABLEAU DE VINGT-SEPT NOMBRES
 * - Palier 1 : les dizaines, de twenty à one hundred.
 * - Palier 2 : les nombres de 21 à 59 (twenty-one, thirty-six, fifty-eight…).
 * - Palier 3 : les nombres de 61 à 99 (sixty-seven, seventy-three, ninety-nine…).
 * Les nombres composés s'écrivent avec un trait d'union (« twenty-one »). Une réponse à écrire accepte aussi l'espace
 * (« twenty one »), jamais une autre faute.
 *
 * LES FAUTES SONT CELLES DES FRANCOPHONES. « thirteen » et « thirty », « fourteen » et « forty » se ressemblent à l'oreille et à
 * l'œil : un mauvais choix est souvent le nombre en -teen d'une dizaine (30 ou 13). Les autres sont les deux chiffres échangés
 * (« thirty-seven » ou « seventy-three ») et la dizaine voisine. Un mauvais choix est toujours un nombre de 11 à 100 qui n'est pas
 * la bonne réponse, et jamais 12 (« twelve » ne ressemble à aucune dizaine).
 *
 * COMME AU CE2 (`ce2Anglais.ts`) : la consigne est en français, l'anglais n'est que dans ce que l'enfant apprend (entre
 * guillemets dans l'énoncé), rien ne se dit, les nombres sont des mots.
 *
 * MODULE PUR (voir `types.ts`).
 */
import type { GameContext, GeneratedGame } from "./shared";
import { choiceLine, gapLine, orderLine, pairsOf, sortTiles, writeLine, type Bands, type EnGap, type EnWrite } from "./ce1Anglais";
import type { Fact, Steps } from "./ce1SciencesOutils";
import type { Hints } from "./tableaux";

const BANDS: Bands = 3;
const CONCEPT = "les nombres de 20 à 100 en anglais";

const ONES = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
const TEENS: Record<number, string> = { 13: "thirteen", 14: "fourteen", 15: "fifteen", 16: "sixteen", 17: "seventeen", 18: "eighteen", 19: "nineteen" };

/** Le nombre écrit en anglais : « 36 » donne « thirty-six », « 100 » donne « one hundred ». De 13 à 100 seulement. */
export function toWords(n: number): string {
  if (n === 100) return "one hundred";
  if (n >= 13 && n <= 19) return TEENS[n];
  if (n >= 20 && n < 100) {
    const tens = TENS[Math.floor(n / 10)];
    return n % 10 === 0 ? tens : `${tens}-${ONES[n % 10]}`;
  }
  throw new Error(`toWords : ${n} est hors de 13 à 100`);
}

/** Les nombres du tableau : neuf par palier. Les dizaines d'abord, puis les nombres de 21 à 59, puis ceux de 62 à 99. */
export const NUMBERS: readonly number[] = [
  20, 30, 40, 50, 60, 70, 80, 90, 100,
  21, 25, 32, 36, 43, 47, 54, 58, 59,
  62, 67, 73, 76, 81, 85, 94, 98, 99,
];

/** Les mauvais choix d'un nombre : sa version en -teen si c'est une dizaine, les chiffres échangés, puis les voisins. */
export function distractors(n: number): [number, number] {
  const candidates: number[] = [];
  if (n % 10 === 0 && n < 100) candidates.push(n / 10 + 10);
  if (n % 10 !== 0) candidates.push((n % 10) * 10 + Math.floor(n / 10));
  candidates.push(n + 10, n - 10, n + 1, n - 1);
  const valid = [...new Set(candidates)].filter((candidate) => candidate >= 13 && candidate <= 100 && candidate !== n);
  return [valid[0], valid[1]];
}

const numberHints = (n: number, clue: string): Hints => [
  "Dis les nombres en français, puis cherche leur écriture en anglais.",
  clue,
  `Le nombre ${n} s'écrit avec ${n % 10 === 0 ? "un seul mot" : "deux mots reliés par un trait d'union"}.`,
];

const TEN_CLUE = "Les mots en -ty sont les dizaines : thirty, forty, fifty.";
const COMPOUND_CLUE = "Le premier mot dit les dizaines, le second les unités.";

/** « Quel est le nombre « forty » en chiffres ? » : le mot anglais donne le nombre, deux autres nombres en choix. */
const WORD_TO_DIGITS: readonly Fact[] = NUMBERS.map((n) => ({
  question: `Quel est le nombre « ${toWords(n)} » en chiffres ?`,
  answer: String(n),
  wrong: distractors(n).map(String) as [string, string],
  hints: numberHints(n, n % 10 === 0 ? TEN_CLUE : COMPOUND_CLUE),
}));

export function makeCe2EnNumWord(ctx: GameContext): GeneratedGame {
  return choiceLine(ctx, "ce2-en-num-mot", CONCEPT, WORD_TO_DIGITS, BANDS, 1);
}

/** « Comment écrit-on 37 en anglais ? » : le nombre en chiffres donne le mot, deux autres mots en choix. */
const DIGITS_TO_WORD: readonly Fact[] = NUMBERS.map((n) => ({
  question: `Comment écrit-on ${n} en anglais ?`,
  answer: toWords(n),
  wrong: distractors(n).map(toWords) as [string, string],
  hints: numberHints(n, n % 10 === 0 ? "Un mot en -ty est une dizaine, un mot en -teen est un nombre de 13 à 19." : "Écris d'abord les dizaines, puis les unités."),
}));

export function makeCe2EnNumDigits(ctx: GameContext): GeneratedGame {
  return choiceLine(ctx, "ce2-en-num-chiffre", CONCEPT, DIGITS_TO_WORD, BANDS, 2);
}

/** « Écris 52 en lettres, en anglais. » : le trait d'union ou l'espace sont admis ; pour 100, « a hundred » aussi. */
const WRITES: readonly EnWrite[] = NUMBERS.map((n) => {
  const word = toWords(n);
  return {
    prompt: `Écris ${n} en lettres, en anglais.`,
    accepted: [...new Set([word, word.replace(/-/g, " "), ...(n === 100 ? ["a hundred"] : [])])],
    hints: numberHints(n, "Une dizaine s'écrit avec un mot qui finit par -ty, et cent s'écrit en deux mots."),
  };
});

export function makeCe2EnNumWrite(ctx: GameContext): GeneratedGame {
  return writeLine(ctx, "ce2-en-num-ecrire", CONCEPT, WRITES, BANDS, 2);
}

/** `forty ~ 40` : un nombre écrit en anglais et ses chiffres. */
const PAIRS: readonly (readonly [string, string])[] = NUMBERS.map((n) => [toWords(n), String(n)] as const);

export function makeCe2EnNumLink(ctx: GameContext): GeneratedGame {
  return pairsOf(
    ctx,
    "ce2-en-num-relier",
    CONCEPT,
    "Relie chaque nombre écrit en anglais à ses chiffres.",
    PAIRS,
    ["Lis le premier mot de chaque nombre.", "Un mot en -ty dit les dizaines.", "Commence par la paire dont tu es le plus sûr."],
    BANDS,
  );
}

/** « Range ces nombres du plus petit au plus grand. » : trois nombres écrits en anglais, quatre rangements par palier. */
const ORDER_PROMPT = "Range ces nombres du plus petit au plus grand.";
const ORDER_HINTS: Hints = ["Dis les nombres en français, puis range-les.", "Les dizaines se classent d'abord, puis les unités.", "Le plus grand nombre vient en dernier."];
export const ORDER_ROWS: readonly (readonly number[])[] = [
  [20, 30, 40], [40, 60, 80], [50, 70, 90], [30, 60, 100],
  [21, 22, 23], [34, 36, 38], [45, 47, 49], [52, 55, 58],
  [61, 63, 65], [72, 75, 78], [84, 86, 88], [97, 98, 99],
];
const ORDERS: readonly Steps[] = ORDER_ROWS.map((numbers) => ({ prompt: ORDER_PROMPT, sequence: numbers.map(toWords), hints: ORDER_HINTS }));

export function makeCe2EnNumOrder(ctx: GameContext): GeneratedGame {
  return orderLine(ctx, "ce2-en-num-ordre", CONCEPT, ORDERS, BANDS);
}

/** Une suite de quatre nombres dont un est caché : départ, pas, et rang du trou (de 0 à 3). */
export const SERIES: readonly (readonly [number, number, number])[] = [
  [20, 10, 2], [50, 10, 1], [60, 10, 3], [30, 20, 2],
  [21, 1, 2], [30, 2, 3], [45, 1, 1], [50, 3, 2],
  [61, 1, 2], [70, 5, 2], [92, 2, 1], [96, 1, 3],
];

const GAPS: readonly EnGap[] = SERIES.map(([start, step, hole]) => {
  const numbers = [0, 1, 2, 3].map((i) => start + i * step);
  const answer = numbers[hole];
  return {
    prompt: "Complète la suite des nombres.",
    text: numbers.map((n, i) => (i === hole ? "___" : toWords(n))).join(", "),
    answer: toWords(answer),
    wrong: distractors(answer).map(toWords) as [string, string],
    hints: ["Dis la suite des nombres en français.", `Chaque nombre augmente de ${step}.`, `Le mot commence par la lettre ${toWords(answer)[0]}.`],
  };
});

export function makeCe2EnNumSeries(ctx: GameContext): GeneratedGame {
  return gapLine(ctx, "ce2-en-num-suite", CONCEPT, GAPS, BANDS, 2);
}

/** « Glisse chaque nombre dans la bonne case. » : se termine par -teen (13 à 19), ou par -ty (20, 30… 90). */
const TEEN_TILES = Object.values(TEENS);
const TY_TILES = [20, 30, 40, 50, 60, 70, 80, 90].map(toWords);

export function makeCe2EnNumSort(ctx: GameContext): GeneratedGame {
  return sortTiles(
    ctx,
    "ce2-en-num-glisser",
    CONCEPT,
    "Glisse chaque nombre dans la bonne case.",
    { zone: "Finit par -teen", tiles: TEEN_TILES },
    { zone: "Finit par -ty", tiles: TY_TILES },
    ["Regarde la fin de chaque mot.", "Un nombre en -teen va de 13 à 19.", "Un nombre en -ty est une dizaine : 20, 30, 40…"],
  );
}
