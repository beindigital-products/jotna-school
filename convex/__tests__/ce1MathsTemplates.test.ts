import { describe, expect, it, vi } from "vitest";
import { auditExercise } from "../paliers/exerciseAudit";
import { GAME_KINDS, generateGames, regenerateGame, type GameKind } from "../paliers/games";
import { makeContext, type GameLevel } from "../paliers/games/shared";
import { wordsOf } from "../paliers/games/nombresCe1";
import { topicUsesModel } from "../paliers/pregen";
import { allProgrammeEntries } from "../programme";
import { PALIER_SIZE } from "../paliers/scoring";

// Ces tests jouent des milliers de tirages : sur le serveur de CI, chargé, l'un d'eux dépasse les 5 secondes par défaut.
vi.setConfig({ testTimeout: 60_000 });

/**
 * LES MATHÉMATIQUES DU CE1, PREMIÈRE MOITIÉ : les nombres jusqu'à 1 000 et jusqu'à 10 000, les additions et soustractions, la multiplication.
 *
 * Chaque test RECALCULE la bonne réponse avec sa propre arithmétique et ses propres règles, écrites à part : les retenues et les emprunts colonne
 * par colonne, le mot de chaque nombre de 0 à 10 000 (une table et une liste de nombres difficiles), les tables de 2 à 5, la classe de difficulté de
 * chaque palier. Un gabarit dont la réponse contredit sa règle, ou qui sort de la plage de sa fiche, échoue. À la fin, des MUTATIONS : on abîme la
 * bonne réponse d'un exercice juste, et chaque vérification doit le voir.
 */

const LEVELS: GameLevel[] = [1, 2, 3, 4];
const draws = LEVELS.flatMap((level) => Array.from({ length: 60 }, (_, n) => ({ level, seed: `ce1m:${level}:${n}` })));
const make = (kind: GameKind, d: { level: GameLevel; seed: string }, vocabulary?: string) =>
  GAME_KINDS[kind].make(makeContext("CE1", d.level, `${kind}:${vocabulary ?? ""}:${d.seed}`, undefined, vocabulary));

type Exo = { type?: string; prompt: string; answerKey: string; hints: string[]; payload: Record<string, unknown> };
const optionsOf = (exo: Exo) => exo.payload.options as string[];
const rightOption = (exo: Exo) => optionsOf(exo)[exo.payload.correctIndex as number];
const wrongOf = (exo: Exo) => optionsOf(exo).filter((option) => option !== rightOption(exo));
const itemsOf = (exo: Exo) => exo.payload.items as { text: string; correctZone: string }[];
const zonesOf = (exo: Exo) => exo.payload.zones as string[];
const sequenceOf = (exo: Exo) => exo.payload.correctSequence as string[];
const pairsOf = (exo: Exo) => exo.payload.pairs as { left: string; right: string }[];
const blankOf = (exo: Exo) => (exo.payload.blanks as { options: string[]; answer: string }[])[0];
const textOf = (exo: Exo) => String(exo.payload.text);
const acceptedOf = (exo: Exo) => exo.payload.acceptedAnswers as string[];
const metaOf = (exo: Exo) => {
  const origin = exo.payload.game as { kind: string; level: GameLevel; vocabulary?: string };
  return { level: origin.level, cap: origin.vocabulary === "nombres-10000" ? (10000 as const) : (1000 as const) };
};

const apostrophes = (text: string) => (text.match(/'/g) ?? []).length;
const wordCount = (text: string) => text.split(/\s+/).filter((token) => /[\p{L}\p{N}]/u.test(token)).length;
const same = (a: readonly string[], b: readonly string[]) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());

type Check = (exo: Exo) => string | null;
const ok = (condition: boolean, message: string) => (condition ? null : message);
const all = (...results: (string | null)[]) => results.find((result) => result !== null) ?? null;

// ===========================================================================
// L'ARITHMÉTIQUE, ÉCRITE À PART
// ===========================================================================

/** Un nombre écrit à l'école : les milliers séparés par une espace. */
const fmt = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
/** Le nombre d'un texte : « 1 234 » vaut 1234. */
const num = (text: string) => Number(text.replace(/ /g, ""));
/** Tous les nombres d'un texte, « 2 000 » compris comme un seul. */
const numbersIn = (text: string) => (text.match(/\d{1,3}(?: \d{3})+|\d+/g) ?? []).map(num);

const MINUS = "−";

// --- Les nombres en lettres : une liste de nombres difficiles, puis une règle écrite autrement que `wordsOf` ---
const TRICKY_WORDS: readonly (readonly [number, string])[] = [
  [0, "zéro"],
  [1, "un"],
  [16, "seize"],
  [17, "dix-sept"],
  [21, "vingt et un"],
  [22, "vingt-deux"],
  [31, "trente et un"],
  [61, "soixante et un"],
  [70, "soixante-dix"],
  [71, "soixante et onze"],
  [72, "soixante-douze"],
  [77, "soixante-dix-sept"],
  [80, "quatre-vingts"],
  [81, "quatre-vingt-un"],
  [91, "quatre-vingt-onze"],
  [99, "quatre-vingt-dix-neuf"],
  [100, "cent"],
  [101, "cent un"],
  [110, "cent dix"],
  [180, "cent quatre-vingts"],
  [199, "cent quatre-vingt-dix-neuf"],
  [200, "deux cents"],
  [201, "deux cent un"],
  [280, "deux cent quatre-vingts"],
  [371, "trois cent soixante et onze"],
  [500, "cinq cents"],
  [999, "neuf cent quatre-vingt-dix-neuf"],
  [1000, "mille"],
  [1001, "mille un"],
  [1100, "mille cent"],
  [1200, "mille deux cents"],
  [2000, "deux mille"],
  [2080, "deux mille quatre-vingts"],
  [2200, "deux mille deux cents"],
  [3001, "trois mille un"],
  [4321, "quatre mille trois cent vingt et un"],
  [7777, "sept mille sept cent soixante-dix-sept"],
  [9999, "neuf mille neuf cent quatre-vingt-dix-neuf"],
  [10000, "dix mille"],
];

const SMALL = ["zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"];
const TENS_LIST = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante"];
/** De 0 à 99 : une table de cent entrées, construite dizaine par dizaine. */
const UNDER_100: string[] = Array.from({ length: 100 }, (_, n) => {
  if (n < 20) return SMALL[n];
  const tens = Math.floor(n / 10);
  const units = n % 10;
  if (tens < 7) return units === 0 ? TENS_LIST[tens] : units === 1 ? `${TENS_LIST[tens]} et un` : `${TENS_LIST[tens]}-${SMALL[units]}`;
  if (tens === 7) return units === 1 ? "soixante et onze" : `soixante-${SMALL[10 + units]}`;
  if (tens === 8) return units === 0 ? "quatre-vingts" : `quatre-vingt-${SMALL[units]}`;
  return `quatre-vingt-${SMALL[10 + units]}`;
});
/** Au-dessus de cent : les milliers, les centaines (un s à « cent » quand rien ne suit), le reste. */
function words(n: number): string {
  if (n < 100) return UNDER_100[n];
  const out: string[] = [];
  const thousands = Math.floor(n / 1000);
  const hundreds = Math.floor((n % 1000) / 100);
  const rest = n % 100;
  if (thousands > 0) out.push(thousands === 1 ? "mille" : `${thousands === 10 ? "dix" : SMALL[thousands]} mille`);
  if (hundreds > 0) out.push(hundreds === 1 ? "cent" : `${SMALL[hundreds]} cent${rest === 0 ? "s" : ""}`);
  if (rest > 0) out.push(UNDER_100[rest]);
  return out.join(" ");
}
const NUMBER_OF_WORDS = new Map<string, number>();
for (let n = 0; n <= 10000; n++) NUMBER_OF_WORDS.set(words(n), n);

// --- Les plages de chaque fiche ---
const LO = { 1000: 100, 10000: 1000 } as const;
const TOP: Record<1000 | 10000, Record<GameLevel, number>> = {
  1000: { 1: 300, 2: 500, 3: 800, 4: 1000 },
  10000: { 1: 3000, 2: 5000, 3: 8000, 4: 10000 },
};
const BLOCK = { 1000: 100, 10000: 1000 } as const;
const digitOf = (n: number, rank: number) => Math.floor(n / 10 ** rank) % 10;

/** Aucun nombre d'un exercice ne dépasse le plafond de sa fiche. */
const withinCap = (exo: Exo, cap: number) => {
  const texts = [exo.prompt, ...exo.hints];
  if (exo.payload.options) texts.push(...optionsOf(exo));
  if (exo.payload.blanks) texts.push(textOf(exo), ...blankOf(exo).options);
  if (exo.payload.correctSequence) texts.push(...sequenceOf(exo));
  if (exo.payload.pairs) texts.push(...pairsOf(exo).map((pair) => pair.left));
  if (exo.payload.items) texts.push(...itemsOf(exo).map((item) => item.text), ...zonesOf(exo));
  const biggest = Math.max(0, ...texts.flatMap(numbersIn));
  return ok(biggest <= cap, `un nombre dépasse ${cap} : ${biggest}`);
};

// ===========================================================================
// LES NOMBRES
// ===========================================================================

const checkNeighbour: Check = (exo) => {
  const { level, cap } = metaOf(exo);
  const match = /^Quel nombre vient juste (après|avant) (.+) \?$/u.exec(exo.prompt);
  if (!match) return `énoncé inconnu : ${exo.prompt}`;
  const n = num(match[2]);
  const answer = match[1] === "après" ? n + 1 : n - 1;
  return all(
    ok(rightOption(exo) === fmt(answer), `${match[1]} ${n} : ${rightOption(exo)}, la règle dit ${answer}`),
    ok(n >= LO[cap] && n <= TOP[cap][level], `${n} sort de la plage du palier`),
    ok(answer >= LO[cap] - 1 && answer <= TOP[cap][level], `${answer} sort de la plage du palier`),
    withinCap(exo, cap),
  );
};

const checkCompare: Check = (exo) => {
  const { level, cap } = metaOf(exo);
  const numbers = optionsOf(exo).map(num);
  const biggest = /plus grand/u.test(exo.prompt);
  const blocks = numbers.map((n) => Math.floor(n / BLOCK[cap]));
  return all(
    ok(rightOption(exo) === fmt(biggest ? Math.max(...numbers) : Math.min(...numbers)), `${biggest ? "plus grand" : "plus petit"} de ${numbers.join(" ")} : ${rightOption(exo)}`),
    ok(new Set(numbers).size === 3, "trois nombres différents"),
    ok(numbers.every((n) => n >= LO[cap] && n <= TOP[cap][level]), `plage : ${numbers.join(" ")}`),
    ok(level < 2 || new Set(blocks).size < 3, "deux nombres du même rang dès le deuxième palier"),
  );
};

const checkOrder: Check = (exo) => {
  const { level, cap } = metaOf(exo);
  const numbers = sequenceOf(exo).map(num);
  const ascending = /du plus petit au plus grand/u.test(exo.prompt);
  const sorted = [...numbers].sort((a, b) => (ascending ? a - b : b - a));
  return all(
    ok(JSON.stringify(numbers) === JSON.stringify(sorted), `la suite ${numbers.join(" ")} n'est pas rangée ${ascending ? "du plus petit au plus grand" : "du plus grand au plus petit"}`),
    ok(new Set(numbers).size === 4, "quatre nombres différents"),
    ok(numbers.every((n) => n >= LO[cap] && n <= TOP[cap][level]), `plage : ${numbers.join(" ")}`),
    ok(level < 2 || new Set(numbers.map((n) => Math.floor(n / BLOCK[cap]))).size < 4, "deux nombres du même rang dès le deuxième palier"),
  );
};

const RANKS = ["unités", "dizaines", "centaines", "milliers"];
const checkDigits: Check = (exo) => {
  const { level, cap } = metaOf(exo);
  const digits = cap === 1000 ? 3 : 4;
  const asDigit = /^Quel est le chiffre des (unités|dizaines|centaines|milliers) de (.+) \?$/u.exec(exo.prompt);
  const asValue = /^Dans (.+), quelle est la valeur du chiffre (\d) \?$/u.exec(exo.prompt);
  if (asDigit) {
    const n = num(asDigit[2]);
    return all(
      ok(rightOption(exo) === String(digitOf(n, RANKS.indexOf(asDigit[1]))), `le chiffre des ${asDigit[1]} de ${n} est ${digitOf(n, RANKS.indexOf(asDigit[1]))}, pas ${rightOption(exo)}`),
      ok(String(n).length === digits && !String(n).includes("0") && new Set(String(n)).size === digits, `${n} : chiffres différents, aucun zéro`),
      ok(n >= LO[cap] && n <= TOP[cap][level], `${n} sort de la plage`),
      ok(optionsOf(exo).every((option) => /^\d$/.test(option)), "des chiffres seuls"),
    );
  }
  if (!asValue) return `énoncé inconnu : ${exo.prompt}`;
  const n = num(asValue[1]);
  const digit = Number(asValue[2]);
  const occurrences = String(n).split("").filter((c) => c === String(digit)).length;
  const rank = String(n).length - 1 - String(n).indexOf(String(digit));
  return all(
    ok(level >= 2, "la valeur d'un chiffre n'est demandée qu'à partir du deuxième palier"),
    ok(occurrences === 1, `le chiffre ${digit} revient dans ${n}`),
    ok(rightOption(exo) === fmt(digit * 10 ** rank), `valeur de ${digit} dans ${n} : ${rightOption(exo)}, la règle dit ${digit * 10 ** rank}`),
    ok(n >= LO[cap] && n <= TOP[cap][level], `${n} sort de la plage`),
    withinCap(exo, cap),
  );
};

/** La somme d'une écriture « 300 + 40 + 5 » ou « 3 × 100 + 4 × 10 + 5 » (milliers écrits « 1 000 »). */
const evalSum = (expression: string) =>
  expression
    .split(" + ")
    .map((term) => term.split(" × ").map(num).reduce((a, b) => a * b, 1))
    .reduce((a, b) => a + b, 0);

const checkDecompose: Check = (exo) => {
  const { level, cap } = metaOf(exo);
  const text = textOf(exo);
  const answer = num(blankOf(exo).answer);
  const counts = /^(.+), c'est le nombre ___\.$/u.exec(text);
  let n: number;
  let form: number;
  if (counts) {
    form = 1;
    n = counts[1].split(/, | et /u).reduce((sum, part) => {
      const [count, name] = part.split(" ");
      const rank = RANKS.findIndex((rankName) => rankName.startsWith(name.slice(0, 5)));
      return sum + Number(count) * 10 ** rank;
    }, 0);
    if (n !== answer) return `${text} : ${n}, pas ${answer}`;
  } else if (text.endsWith(" = ___")) {
    n = evalSum(text.replace(/ = ___$/, ""));
    form = text.includes("×") ? 2 : 3;
    if (n !== answer) return `${text} : ${n}, pas ${answer}`;
    // Une écriture avec des « × » en a un par rang sauf les unités (« 2 × 1 000 + 3 × 100 + 4 × 10 + 5 ») : aucun rang ne s'écrit déjà en valeur.
    if (form === 2 && (text.match(/×/g) ?? []).length !== String(n).length - 1) return `${text} : un rang n'est pas écrit en chiffre × rang`;
  } else {
    form = 0;
    const [left, right] = text.split(" = ");
    n = num(left);
    const terms = right.split(" + ");
    const filled = terms.map((term) => (term === "___" ? String(answer) : term)).join(" + ");
    if (evalSum(filled) !== n) return `${text} avec ${answer} : ${evalSum(filled)}, pas ${n}`;
    const missing = terms.indexOf("___");
    // Le rang qui manque n'est jamais le premier ; avant le dernier palier, ce sont les unités.
    if (missing === 0) return "le premier rang ne manque jamais";
    if (level < 4 && missing !== terms.length - 1) return "les unités manquent avant le dernier palier";
  }
  const allowed = level === 1 ? [1, 3] : level === 2 ? [0, 1, 3] : level === 3 ? [0, 2, 3] : [0, 1, 2, 3];
  return all(
    ok(allowed.includes(form), `la forme ${form} n'est pas du palier ${level}`),
    ok(String(n).length === (cap === 1000 ? 3 : 4) && !String(n).includes("0") && new Set(String(n)).size === String(n).length, `${n} : chiffres différents, aucun zéro`),
    ok(n >= LO[cap] && n <= TOP[cap][level], `${n} sort de la plage`),
    withinCap(exo, cap),
  );
};

const checkBracket: Check = (exo) => {
  const { level, cap } = metaOf(exo);
  const match = /^Entre quelles (dizaines|centaines|milliers) se trouve (.+) \?$/u.exec(exo.prompt);
  if (!match) return `énoncé inconnu : ${exo.prompt}`;
  const unit = { dizaines: 10, centaines: 100, milliers: 1000 }[match[1] as "dizaines" | "centaines" | "milliers"];
  const n = num(match[2]);
  const low = Math.floor(n / unit) * unit;
  const expectedUnit = cap === 1000 ? (level === 1 ? 10 : 100) : level <= 2 ? 100 : 1000;
  const pairs = optionsOf(exo).map((option) => option.split(" et ").map(num));
  return all(
    ok(unit === expectedUnit, `le rang ${match[1]} n'est pas celui du palier ${level}`),
    ok(n % unit !== 0, `${n} est déjà un multiple`),
    ok(rightOption(exo) === `${fmt(low)} et ${fmt(low + unit)}`, `${n} est entre ${low} et ${low + unit}, pas ${rightOption(exo)}`),
    ok(pairs.every(([a, b]) => b - a === unit && a % unit === 0 && b <= cap && a >= 0), `des bornes qui ne se suivent pas : ${optionsOf(exo).join(" | ")}`),
    ok(n >= LO[cap] && n <= TOP[cap][level], `${n} sort de la plage`),
  );
};

const checkThreshold: Check = (exo) => {
  const { level, cap } = metaOf(exo);
  const [low, high] = zonesOf(exo);
  const lowMatch = /^Moins de (.+)$/u.exec(low);
  const highMatch = /^Plus de (.+)$/u.exec(high);
  if (!lowMatch || !highMatch || lowMatch[1] !== highMatch[1]) return `cases : ${zonesOf(exo).join(" | ")}`;
  const threshold = num(lowMatch[1]);
  for (const item of itemsOf(exo)) {
    const n = num(item.text);
    if (n === threshold) return "le seuil est un des nombres";
    if ((n < threshold ? low : high) !== item.correctZone) return `${n} rangé dans « ${item.correctZone} » pour le seuil ${threshold}`;
    if (n < LO[cap] || n > TOP[cap][level]) return `${n} sort de la plage`;
  }
  const below = itemsOf(exo).filter((item) => item.correctZone === low).length;
  return all(
    ok(threshold % BLOCK[cap] === 0, "le seuil est une centaine (ou un millier)"),
    ok(below >= 2 && itemsOf(exo).length - below >= 2, "au moins deux nombres de chaque côté"),
    ok(itemsOf(exo).length >= 4 && itemsOf(exo).length <= 6, `${itemsOf(exo).length} nombres`),
  );
};

const SUITE_STEPS = {
  1000: { 1: [10], 2: [10, 100], 3: [50, 100], 4: [20, 25, 50, 100] },
  10000: { 1: [100], 2: [100, 1000], 3: [500, 1000], 4: [200, 250, 500, 1000] },
} as const;
const checkSuite: Check = (exo) => {
  const { level, cap } = metaOf(exo);
  const tokens = textOf(exo).split(", ");
  const blank = tokens.indexOf("___");
  const known = tokens.map((token, i) => (i === blank ? null : num(token)));
  const descending = /descend/u.test(exo.prompt);
  const sign = descending ? -1 : 1;
  // Le pas se lit entre deux termes voisins connus ; le premier terme s'en déduit.
  const at = known.findIndex((value, i) => value !== null && known[i + 1] !== null && known[i + 1] !== undefined);
  if (at < 0) return "aucun couple de termes voisins";
  const step = Math.abs((known[at + 1] as number) - (known[at] as number));
  const first = (known[at] as number) - sign * step * at;
  const values = tokens.map((_, i) => first + sign * step * i);
  const answer = num(blankOf(exo).answer);
  return all(
    ok(tokens.length === 5, "cinq termes"),
    ok(values[blank] === answer, `la case ${blank + 1} vaut ${values[blank]}, pas ${answer}`),
    ok(known.every((value, i) => value === null || value === values[i]), `la suite ${textOf(exo)} n'avance pas d'un pas régulier`),
    ok((SUITE_STEPS[cap][level] as readonly number[]).includes(step), `le pas ${step} n'est pas du palier ${level}`),
    ok(first % step === 0 || (first - sign * 0) % step === 0, "le premier terme est un multiple du pas"),
    ok(!descending || level >= 2, "une suite qui descend dès le deuxième palier"),
    ok(level < 3 ? blank === 4 : blank >= 1 && blank <= 3, `la case qui manque est à la place ${blank + 1}`),
    ok(values.every((value) => value >= LO[cap] && value <= TOP[cap][level]), `${values.join(" ")} sort de la plage`),
    ok(new Set(blankOf(exo).options).size === 3, "trois choix différents"),
    withinCap(exo, cap),
  );
};

const checkWords: Check = (exo) => {
  const { level, cap } = metaOf(exo);
  const match = /^Quel nombre s'écrit « (.+) » \?$/u.exec(exo.prompt);
  if (!match) return `énoncé inconnu : ${exo.prompt}`;
  const n = NUMBER_OF_WORDS.get(match[1]);
  if (n === undefined) return `« ${match[1]} » n'est l'écriture d'aucun nombre`;
  return all(
    ok(rightOption(exo) === fmt(n), `« ${match[1]} » est ${n}, pas ${rightOption(exo)}`),
    ok(n >= LO[cap] && n <= Math.min(TOP[cap][level], cap - 1), `${n} sort de la plage`),
    withinCap(exo, cap),
  );
};

const checkWordLinks: Check = (exo) => {
  const { level, cap } = metaOf(exo);
  const pairs = pairsOf(exo);
  for (const pair of pairs) {
    const n = num(pair.left);
    if (words(n) !== pair.right) return `${n} s'écrit « ${words(n)} », pas « ${pair.right} »`;
    if (n < LO[cap] || n > Math.min(TOP[cap][level], cap - 1)) return `${n} sort de la plage`;
  }
  return all(
    ok(pairs.length === (level >= 3 ? 4 : 3), `${pairs.length} paires`),
    ok(new Set(pairs.map((pair) => pair.left)).size === pairs.length, "des nombres différents"),
  );
};

const checkWriteNumber: Check = (exo) => {
  const { level, cap } = metaOf(exo);
  const match = /^Écris en chiffres le nombre « (.+) »\.$/u.exec(exo.prompt);
  if (!match) return `énoncé inconnu : ${exo.prompt}`;
  const n = NUMBER_OF_WORDS.get(match[1]);
  if (n === undefined) return `« ${match[1]} » n'est l'écriture d'aucun nombre`;
  return all(
    ok(same(acceptedOf(exo), [String(n)]), `réponses admises : ${acceptedOf(exo).join(" | ")}`),
    ok(exo.answerKey === String(n), exo.answerKey),
    ok(n >= LO[cap] && n <= Math.min(TOP[cap][level], cap - 1), `${n} sort de la plage`),
  );
};

// ===========================================================================
// LE CALCUL
// ===========================================================================

const carries = (a: number, b: number) => {
  const units = (a % 10) + (b % 10) >= 10;
  return { units, tens: (Math.floor(a / 10) % 10) + (Math.floor(b / 10) % 10) + (units ? 1 : 0) >= 10 };
};
const borrows = (a: number, b: number) => {
  const units = a % 10 < b % 10;
  return { units, tens: (Math.floor(a / 10) % 10) - (units ? 1 : 0) < Math.floor(b / 10) % 10 };
};
const CALC_TOP: Record<GameLevel, number> = { 1: 400, 2: 700, 3: 1000, 4: 1000 };
const MONEY_TOP: Record<GameLevel, number> = { 1: 500, 2: 750, 3: 1000, 4: 1000 };

/** Une addition du palier : les unités passent dix, les dizaines non (deux premiers paliers), parfois (troisième), toujours (quatrième). */
const additionOk = (level: GameLevel, a: number, b: number): string | null => {
  const c = carries(a, b);
  return all(
    ok(c.units, `${a} + ${b} : les unités ne passent pas dix`),
    ok(level > 2 || !c.tens, `${a} + ${b} : une retenue des dizaines avant le troisième palier`),
    ok(level !== 4 || c.tens, `${a} + ${b} : pas de retenue des dizaines au dernier palier`),
    ok(a + b <= CALC_TOP[level] && a >= 101 && b >= 11, `${a} + ${b} sort de la plage du palier`),
  );
};
/** Une soustraction du palier : un emprunt aux unités, aux dizaines aussi au dernier palier, jamais de zéro aux dizaines. */
const subtractionOk = (level: GameLevel, a: number, b: number): string | null => {
  const r = borrows(a, b);
  return all(
    ok(r.units, `${a} − ${b} : pas d'emprunt aux unités`),
    ok(level > 2 || !r.tens, `${a} − ${b} : un emprunt aux dizaines avant le troisième palier`),
    ok(level !== 4 || r.tens, `${a} − ${b} : pas d'emprunt aux dizaines au dernier palier`),
    ok(Math.floor(a / 10) % 10 !== 0, `${a} : un zéro aux dizaines`),
    ok(a <= CALC_TOP[level] && b >= 11 && a > b, `${a} − ${b} sort de la plage du palier`),
  );
};

const checkCalcAdd: Check = (exo) => {
  const { level } = metaOf(exo);
  const match = /^Combien font (.+) \+ (.+) \?$/u.exec(exo.prompt);
  if (!match) return `énoncé inconnu : ${exo.prompt}`;
  const [a, b] = [num(match[1]), num(match[2])];
  return all(ok(rightOption(exo) === fmt(a + b), `${a} + ${b} : ${rightOption(exo)}, pas ${a + b}`), additionOk(level, a, b), withinCap(exo, 1000));
};

const checkCalcSub: Check = (exo) => {
  const { level } = metaOf(exo);
  const match = new RegExp(`^Combien font (.+) ${MINUS} (.+) \\?$`, "u").exec(exo.prompt);
  if (!match) return `énoncé inconnu : ${exo.prompt}`;
  const [a, b] = [num(match[1]), num(match[2])];
  return all(ok(rightOption(exo) === fmt(a - b), `${a} − ${b} : ${rightOption(exo)}, pas ${a - b}`), subtractionOk(level, a, b), withinCap(exo, 1000));
};

const checkCarryAsk: Check = (exo) => {
  const { level } = metaOf(exo);
  const tensStep = /^Dans (.+) \+ (.+), les unités ont passé dix\. Quel chiffre écrit-on sous les dizaines, avec la retenue \?$/u.exec(exo.prompt);
  const unitsStep = /^Dans (.+) \+ (.+), les unités font (\d+)\. On écrit (\d+)\. Combien de dizaines retient-on \?$/u.exec(exo.prompt);
  const borrowStep = new RegExp(`^Dans (.+) ${MINUS} (.+), on ne peut pas enlever (\\d) de (\\d)\\. On emprunte une dizaine, et \\d devient combien \\?$`, "u").exec(exo.prompt);
  if (tensStep) {
    const [a, b] = [num(tensStep[1]), num(tensStep[2])];
    const written = ((Math.floor(a / 10) % 10) + (Math.floor(b / 10) % 10) + 1) % 10;
    return all(ok(rightOption(exo) === String(written), `le chiffre écrit sous les dizaines de ${a} + ${b} est ${written}, pas ${rightOption(exo)}`), additionOk(level, a, b));
  }
  if (unitsStep) {
    const [a, b, said, written] = [num(unitsStep[1]), num(unitsStep[2]), Number(unitsStep[3]), Number(unitsStep[4])];
    return all(
      ok(said === (a % 10) + (b % 10) && written === said - 10, "les unités annoncées ne sont pas celles du calcul"),
      ok(rightOption(exo) === "1" && same(optionsOf(exo), ["0", "1", "2"]), "on retient une dizaine, parmi 0, 1 et 2"),
      ok(level >= 3, "cette question n'est posée qu'à partir du troisième palier"),
      additionOk(level, a, b),
    );
  }
  if (borrowStep) {
    const [a, b, ub, ua] = [num(borrowStep[1]), num(borrowStep[2]), Number(borrowStep[3]), Number(borrowStep[4])];
    return all(
      ok(ua === a % 10 && ub === b % 10, "les unités annoncées ne sont pas celles du calcul"),
      ok(rightOption(exo) === String(ua + 10), `${ua} devient ${ua + 10}, pas ${rightOption(exo)}`),
      subtractionOk(level, a, b),
    );
  }
  return `énoncé inconnu : ${exo.prompt}`;
};

const checkCalcGap: Check = (exo) => {
  const { level } = metaOf(exo);
  const text = textOf(exo);
  const add = /^(.+) \+ ___ = (.+)$/u.exec(text);
  const sub = new RegExp(`^(.+) ${MINUS} ___ = (.+)$`, "u").exec(text);
  const answer = num(blankOf(exo).answer);
  if (add) {
    const [a, c] = [num(add[1]), num(add[2])];
    return all(ok(answer === c - a, `${text} : ${c - a}, pas ${answer}`), additionOk(level, a, c - a));
  }
  if (sub) {
    const [a, c] = [num(sub[1]), num(sub[2])];
    return all(ok(answer === a - c, `${text} : ${a - c}, pas ${answer}`), subtractionOk(level, a, a - c));
  }
  return `texte inconnu : ${text}`;
};

const MENTAL = new RegExp(`^Combien font (.+) ([+${MINUS}]) (10|100) \\?$`, "u");
const checkMental: Check = (exo) => {
  const { level } = metaOf(exo);
  const match = MENTAL.exec(exo.prompt);
  if (!match) return `énoncé inconnu : ${exo.prompt}`;
  const n = num(match[1]);
  const step = Number(match[3]);
  const result = match[2] === "+" ? n + step : n - step;
  return all(
    ok(rightOption(exo) === fmt(result), `${n} ${match[2]} ${step} : ${rightOption(exo)}, pas ${result}`),
    ok(level >= 3 || step === (level === 1 ? 10 : 100), `le pas ${step} n'est pas du palier ${level}`),
    ok(n >= 100 && result >= 100 && n <= CALC_TOP[level] && result <= CALC_TOP[level], `${n} et ${result} sortent de la plage du palier`),
    withinCap(exo, 1000),
  );
};

const STEPS_BY_LEVEL: readonly { prompt: string; steps: readonly string[] }[] = [
  {
    prompt: "Mets dans le bon ordre les étapes pour poser une addition.",
    steps: ["J'écris un nombre en haut.", "J'écris l'autre nombre en dessous, unités sous unités.", "Je trace un trait sous les nombres.", "J'additionne en commençant par les unités."],
  },
  {
    prompt: "Mets dans le bon ordre les étapes d'une addition avec retenue.",
    steps: ["J'additionne les unités.", "J'écris les unités et je retiens une dizaine.", "J'additionne les dizaines avec la retenue.", "J'additionne les centaines."],
  },
  {
    prompt: "Mets dans le bon ordre les étapes pour poser une soustraction.",
    steps: ["J'écris le plus grand nombre en haut.", "J'écris l'autre nombre en dessous, unités sous unités.", "Je trace un trait sous les nombres.", "Je soustrais en commençant par les unités."],
  },
  {
    prompt: "Mets dans le bon ordre les étapes d'une soustraction avec emprunt.",
    steps: [
      "Je regarde les unités.",
      "J'emprunte une dizaine pour avoir plus d'unités.",
      "J'enlève les unités.",
      "J'enlève les dizaines, sans oublier celle que j'ai prêtée.",
      "J'enlève les centaines.",
    ],
  },
];
const checkCalcSteps: Check = (exo) => {
  const { level } = metaOf(exo);
  const expected = STEPS_BY_LEVEL[level - 1];
  return all(ok(exo.prompt === expected.prompt, exo.prompt), ok(JSON.stringify(sequenceOf(exo)) === JSON.stringify(expected.steps), sequenceOf(exo).join(" ")));
};

/** Une opération « a + b » ou « a − b » d'un appariement ou d'un glissé. */
const OPERATION = new RegExp(`^(.+) ([+${MINUS}]) (.+)$`, "u");
const checkCalcLinks: Check = (exo) => {
  const { level } = metaOf(exo);
  const pairs = pairsOf(exo);
  for (const pair of pairs) {
    const match = OPERATION.exec(pair.left);
    if (!match) return `opération inconnue : ${pair.left}`;
    const [a, b] = [num(match[1]), num(match[3])];
    const result = match[2] === "+" ? a + b : a - b;
    if (pair.right !== fmt(result)) return `${pair.left} : ${fmt(result)}, pas ${pair.right}`;
    const verdict = match[2] === "+" ? additionOk(level, a, b) : subtractionOk(level, a, b);
    if (verdict) return verdict;
  }
  return all(
    ok(pairs.length === (level >= 3 ? 4 : 3), `${pairs.length} paires`),
    ok(new Set(pairs.map((pair) => pair.right)).size === pairs.length, "des résultats différents"),
    ok(new Set(pairs.map((pair) => pair.left)).size === pairs.length, "des calculs différents"),
  );
};

const checkCalcSort: Check = (exo) => {
  const { level } = metaOf(exo);
  for (const item of itemsOf(exo)) {
    const match = /^(.+) \+ (.+)$/u.exec(item.text);
    if (!match) return `addition inconnue : ${item.text}`;
    const [a, b] = [num(match[1]), num(match[2])];
    const c = carries(a, b);
    const carry = c.units || c.tens || a + b >= 1000;
    if ((carry ? "Avec retenue" : "Sans retenue") !== item.correctZone) return `${item.text} rangée dans « ${item.correctZone} »`;
    if (a + b > CALC_TOP[level]) return `${item.text} dépasse ${CALC_TOP[level]}`;
  }
  const withCarry = itemsOf(exo).filter((item) => item.correctZone === "Avec retenue").length;
  return all(
    ok(same(zonesOf(exo), ["Avec retenue", "Sans retenue"]), zonesOf(exo).join(" | ")),
    ok(withCarry === (level === 1 ? 2 : 3) && itemsOf(exo).length - withCarry === withCarry, `${withCarry} avec retenue sur ${itemsOf(exo).length}`),
  );
};

const checkCalcWrite: Check = (exo) => {
  const { level } = metaOf(exo);
  const match = new RegExp(`^Pose et calcule (.+) ([+${MINUS}]) (.+)\\. Écris le résultat\\.$`, "u").exec(exo.prompt);
  if (!match) return `énoncé inconnu : ${exo.prompt}`;
  const [a, b] = [num(match[1]), num(match[3])];
  const result = match[2] === "+" ? a + b : a - b;
  return all(
    ok(same(acceptedOf(exo), [String(result)]), `réponses admises : ${acceptedOf(exo).join(" | ")}`),
    ok(exo.answerKey === String(result), exo.answerKey),
    match[2] === "+" ? additionOk(level, a, b) : subtractionOk(level, a, b),
  );
};

const checkMoney: Check = (exo) => {
  const { level } = metaOf(exo);
  const left = /^(\S+) a (.+) FCFA\. (?:Elle|Il) achète (.+) à (.+) FCFA\. Combien lui reste-t-il \?$/u.exec(exo.prompt);
  const both = /^(\S+) achète (.+) à (.+) FCFA et (.+) à (.+) FCFA\. Combien (?:a-t-il|a-t-elle) payé en tout \?$/u.exec(exo.prompt);
  const change = /^(\S+) achète (.+) à (.+) FCFA\. (?:Elle|Il) paie avec un billet de 1 000 FCFA\. Combien lui rend-on \?$/u.exec(exo.prompt);
  let expected: number;
  if (left) {
    const [start, price] = [num(left[2]), num(left[4])];
    expected = start - price;
    if (start < 200 || start > MONEY_TOP[level] || price < 50 || price > start - 50) return `${start} et ${price} : hors de la plage du palier`;
  } else if (both) {
    const [first, second] = [num(both[3]), num(both[5])];
    expected = first + second;
    if (expected > MONEY_TOP[level] || first < 100 || second < 100) return `${first} et ${second} : hors de la plage du palier`;
  } else if (change) {
    const price = num(change[3]);
    expected = 1000 - price;
    if (level < 3) return "la monnaie d'un billet de mille n'est pas demandée avant le troisième palier";
    if (price < 150 || price > 900) return `${price} : hors de la plage`;
  } else {
    return `énoncé inconnu : ${exo.prompt}`;
  }
  return all(
    ok(rightOption(exo) === `${fmt(expected)} FCFA`, `la réponse est ${expected} FCFA, pas ${rightOption(exo)}`),
    ok(optionsOf(exo).every((option) => /^\d{1,3}(?: \d{3})* FCFA$/.test(option)), optionsOf(exo).join(" | ")),
    ok(numbersIn(exo.prompt).every((n) => n % 25 === 0), "des prix multiples de vingt-cinq"),
    ok(optionsOf(exo).map((option) => num(option.replace(" FCFA", ""))).every((n) => n >= 25 && n <= 1000), "des choix de 25 à 1 000 FCFA"),
  );
};

// ===========================================================================
// LA MULTIPLICATION
// ===========================================================================

const TABLES: Record<GameLevel, readonly number[]> = { 1: [2, 5], 2: [3], 3: [4], 4: [2, 3, 4, 5] };

/** La table et le facteur d'une « a × b » dans le sens où le palier l'écrit : la table d'abord, le facteur d'abord au dernier palier. */
const sides = (level: GameLevel, first: number, second: number): [number, number] => (level === 4 ? [second, first] : [first, second]);
const productOk = (level: GameLevel, first: number, second: number): string | null => {
  const [table, factor] = sides(level, first, second);
  return all(
    ok(TABLES[level].includes(table), `la table de ${table} n'est pas du palier ${level}`),
    ok(factor >= 2 && factor <= 10, `le facteur ${factor} sort de 2 à 10`),
  );
};

const TIMES = /^Combien font (\d+) × (\d+) \?$/u;
const checkMultTable: Check = (exo) => {
  const { level } = metaOf(exo);
  const match = TIMES.exec(exo.prompt);
  if (!match) return `énoncé inconnu : ${exo.prompt}`;
  const [a, b] = [Number(match[1]), Number(match[2])];
  return all(ok(rightOption(exo) === fmt(a * b), `${a} × ${b} : ${rightOption(exo)}, pas ${a * b}`), productOk(level, a, b));
};

const checkMultGap: Check = (exo) => {
  const { level } = metaOf(exo);
  const text = textOf(exo);
  const tableFirst = /^(\d+) × ___ = (.+)$/u.exec(text);
  const factorFirst = /^___ × (\d+) = (.+)$/u.exec(text);
  const match = tableFirst ?? factorFirst;
  if (!match) return `texte inconnu : ${text}`;
  const [table, result] = [Number(match[1]), num(match[2])];
  const answer = Number(blankOf(exo).answer);
  return all(
    ok(answer * table === result, `${text} avec ${answer} : ${answer * table}`),
    ok(level === 4 ? factorFirst !== null : tableFirst !== null, "la table d'abord aux trois premiers paliers, le facteur d'abord au dernier"),
    ok(TABLES[level].includes(table) && answer >= 2 && answer <= 10, `la table de ${table} et le facteur ${answer} ne sont pas du palier ${level}`),
    ok(blankOf(exo).options.every((option) => /^\d+$/.test(option) && Number(option) >= 1 && Number(option) <= 10), "des facteurs de 1 à 10"),
  );
};

const TERMS: Record<GameLevel, readonly number[]> = { 1: [3, 4], 2: [2, 4, 5], 3: [2, 3, 5], 4: [6, 7] };
const checkMultAddition: Check = (exo) => {
  const { level } = metaOf(exo);
  const match = /^Quelle multiplication donne le même résultat que (.+) \?$/u.exec(exo.prompt);
  if (!match) return `énoncé inconnu : ${exo.prompt}`;
  const terms = match[1].split(" + ").map(Number);
  const table = terms[0];
  const value = (choice: string) => choice.split(" × ").map(Number).reduce((a, b) => a * b, 1);
  return all(
    ok(terms.every((term) => term === table), "des termes tous égaux"),
    ok(TABLES[level].includes(table), `la table de ${table} n'est pas du palier ${level}`),
    ok(TERMS[level].includes(terms.length) && terms.length !== table, `${terms.length} termes de ${table} ne sont pas du palier ${level}`),
    ok(rightOption(exo) === `${terms.length} × ${table}`, `la bonne écriture est ${terms.length} × ${table}, pas ${rightOption(exo)}`),
    ok(wrongOf(exo).every((choice) => value(choice) !== terms.length * table), "un faux choix qui vaut la somme (la multiplication renversée, par exemple)"),
  );
};

/** La classe de retenue d'une multiplication posée : rien, les unités, les unités et les dizaines. */
const posedOk = (level: GameLevel, n: number, m: number): string | null => {
  const units = n % 10;
  const tens = Math.floor(n / 10);
  const carryUnits = Math.floor((units * m) / 10);
  const carryTens = Math.floor((tens * m + carryUnits) / 10);
  const allowed = { 1: [2, 3], 2: [2, 3, 4, 5], 3: [2, 3, 4, 5], 4: [3, 4, 5] }[level];
  return all(
    ok(n >= 11 && n <= 99 && units !== 0, `${n} : deux chiffres, des unités non nulles`),
    ok(allowed.includes(m), `le multiplicateur ${m} n'est pas du palier ${level}`),
    ok(level > 2 || (carryUnits === 0 && carryTens === 0), `${n} × ${m} : une retenue avant le troisième palier`),
    ok(level !== 3 || (carryUnits > 0 && carryTens === 0), `${n} × ${m} : au troisième palier, la retenue des unités seulement`),
    ok(level !== 4 || (carryUnits > 0 && carryTens > 0), `${n} × ${m} : au dernier palier, les deux retenues`),
  );
};

const checkMultPosed: Check = (exo) => {
  const { level } = metaOf(exo);
  const match = TIMES.exec(exo.prompt);
  if (!match) return `énoncé inconnu : ${exo.prompt}`;
  const [n, m] = [Number(match[1]), Number(match[2])];
  return all(ok(rightOption(exo) === fmt(n * m), `${n} × ${m} : ${rightOption(exo)}, pas ${n * m}`), posedOk(level, n, m));
};

const checkMultWrite: Check = (exo) => {
  const { level } = metaOf(exo);
  if (level >= 3) {
    const match = /^Pose et calcule (\d+) × (\d+)\. Écris le résultat\.$/u.exec(exo.prompt);
    if (!match) return `énoncé inconnu : ${exo.prompt}`;
    const [n, m] = [Number(match[1]), Number(match[2])];
    return all(ok(same(acceptedOf(exo), [String(n * m)]), acceptedOf(exo).join(" | ")), posedOk(level, n, m));
  }
  const match = /^Écris le résultat de (\d+) × (\d+)\.$/u.exec(exo.prompt);
  if (!match) return `énoncé inconnu : ${exo.prompt}`;
  const [a, b] = [Number(match[1]), Number(match[2])];
  return all(ok(same(acceptedOf(exo), [String(a * b)]), acceptedOf(exo).join(" | ")), productOk(level, a, b));
};

const DOUBLE_TOP: Record<GameLevel, number> = { 1: 20, 2: 50, 3: 100, 4: 250 };
const checkMultDouble: Check = (exo) => {
  const { level } = metaOf(exo);
  const double = /^Quel est le double de (.+) \?$/u.exec(exo.prompt);
  const half = /^Quelle est la moitié de (.+) \?$/u.exec(exo.prompt);
  if (double) {
    const n = num(double[1]);
    return all(ok(rightOption(exo) === fmt(2 * n), `le double de ${n} est ${2 * n}, pas ${rightOption(exo)}`), ok(n >= 6 && n <= DOUBLE_TOP[level], `${n} sort de la plage du palier`));
  }
  if (half) {
    const n = num(half[1]);
    return all(
      ok(n % 2 === 0, `${n} est impair : pas de moitié entière`),
      ok(rightOption(exo) === fmt(n / 2), `la moitié de ${n} est ${n / 2}, pas ${rightOption(exo)}`),
      ok(n / 2 >= 3 && n / 2 <= Math.max(4, DOUBLE_TOP[level]), `${n} sort de la plage du palier`),
    );
  }
  return `énoncé inconnu : ${exo.prompt}`;
};

const checkMultTen: Check = (exo) => {
  const { level } = metaOf(exo);
  const times = /^Combien font (\d+) × 10 \?$/u.exec(exo.prompt);
  const reverse = /^Quel nombre multiplié par 10 donne (.+) \?$/u.exec(exo.prompt);
  if (times) {
    const n = Number(times[1]);
    return all(
      ok(rightOption(exo) === fmt(n * 10), `${n} × 10 : ${rightOption(exo)}, pas ${n * 10}`),
      ok(level === 1 ? n >= 2 && n <= 9 : n >= 11 && n <= 99, `${n} sort de la plage du palier`),
    );
  }
  if (reverse) {
    const result = num(reverse[1]);
    return all(
      ok(result % 10 === 0 && rightOption(exo) === fmt(result / 10), `${result} = ${result / 10} × 10, pas ${rightOption(exo)} × 10`),
      ok(level >= 3, "la question inverse n'est posée qu'à partir du troisième palier"),
    );
  }
  return `énoncé inconnu : ${exo.prompt}`;
};

const checkMultLinks: Check = (exo) => {
  const { level } = metaOf(exo);
  const pairs = pairsOf(exo);
  for (const pair of pairs) {
    const match = /^(\d+) × (\d+)$/u.exec(pair.left);
    if (!match) return `multiplication inconnue : ${pair.left}`;
    const [a, b] = [Number(match[1]), Number(match[2])];
    if (pair.right !== fmt(a * b)) return `${pair.left} : ${a * b}, pas ${pair.right}`;
    const verdict = productOk(level, a, b);
    if (verdict) return verdict;
  }
  return all(
    ok(pairs.length === (level >= 3 ? 4 : 3), `${pairs.length} paires`),
    ok(new Set(pairs.map((pair) => pair.right)).size === pairs.length, "des résultats différents"),
    ok(new Set(pairs.map((pair) => pair.left)).size === pairs.length, "des multiplications différentes"),
  );
};

const SORT_TABLES: Record<GameLevel, [number, number]> = { 1: [2, 5], 2: [3, 5], 3: [3, 4], 4: [4, 5] };
const checkMultSort: Check = (exo) => {
  const { level } = metaOf(exo);
  const [a, b] = SORT_TABLES[level];
  const zones = [`Table de ${a}`, `Table de ${b}`];
  for (const item of itemsOf(exo)) {
    const n = Number(item.text);
    if (!zones.includes(item.correctZone)) return `case inconnue : ${item.correctZone}`;
    const table = item.correctZone === zones[0] ? a : b;
    const other = table === a ? b : a;
    if (n % table !== 0 || n < 2 * table || n > 10 * table) return `${n} n'est pas dans la table de ${table}`;
    if (n % other === 0) return `${n} est aussi dans la table de ${other}`;
  }
  const inA = itemsOf(exo).filter((item) => item.correctZone === zones[0]).length;
  return all(
    ok(same(zonesOf(exo), zones), zonesOf(exo).join(" | ")),
    ok(inA === (level === 1 ? 2 : 3) && itemsOf(exo).length === 2 * inA, `${inA} nombres dans la première table`),
  );
};

const checkMultProblem: Check = (exo) => {
  const { level } = metaOf(exo);
  const objects = /^Il y a (\d+) (\S+) de (\d+) (\S+)\. Combien y a-t-il de (\S+) en tout \?$/u.exec(exo.prompt);
  const money = /^(\S+) achète (\d+) (\S+)\. Chaque (\S+) coûte (.+) FCFA\. Combien (?:a-t-il|a-t-elle) payé en tout \?$/u.exec(exo.prompt);
  if (objects) {
    const [count, table] = [Number(objects[1]), Number(objects[3])];
    return all(
      ok(objects[4] === objects[5], "la chose comptée est celle de l'énoncé"),
      ok(rightOption(exo) === fmt(count * table), `${count} × ${table} : ${rightOption(exo)}, pas ${count * table}`),
      ok(TABLES[level].includes(table) && count >= 2 && count <= 6, `${count} contenants de ${table} : hors du palier ${level}`),
      ok(level !== 3, "les problèmes d'objets ne sont pas posés au troisième palier"),
    );
  }
  if (money) {
    const [count, price] = [Number(money[2]), num(money[5])];
    return all(
      ok(rightOption(exo) === `${fmt(count * price)} FCFA`, `${count} × ${price} : ${rightOption(exo)}, pas ${count * price}`),
      ok(price % 25 === 0 && price >= 50 && count >= 2 && count <= 5 && count * price <= 1000, `${count} achats à ${price} FCFA : hors de la plage`),
      ok(level >= 3, "l'argent n'est pas posé avant le troisième palier"),
      ok(money[3] === `${money[4]}s`, `un pluriel qui ne correspond pas à « ${money[4]} »`),
    );
  }
  return `énoncé inconnu : ${exo.prompt}`;
};

const CHECKS: Record<string, Check> = {
  "ce1-nb-voisin": checkNeighbour,
  "ce1-nb-comparer": checkCompare,
  "ce1-nb-ordre": checkOrder,
  "ce1-nb-chiffres": checkDigits,
  "ce1-nb-decomposer": checkDecompose,
  "ce1-nb-encadrer": checkBracket,
  "ce1-nb-glisser": checkThreshold,
  "ce1-nb-suite": checkSuite,
  "ce1-nb-lettres": checkWords,
  "ce1-nb-relier": checkWordLinks,
  "ce1-nb-ecrire": checkWriteNumber,
  "ce1-calc-ajouter": checkCalcAdd,
  "ce1-calc-enlever": checkCalcSub,
  "ce1-calc-retenue": checkCarryAsk,
  "ce1-calc-trou": checkCalcGap,
  "ce1-calc-mental": checkMental,
  "ce1-calc-ordre": checkCalcSteps,
  "ce1-calc-relier": checkCalcLinks,
  "ce1-calc-glisser": checkCalcSort,
  "ce1-calc-ecrire": checkCalcWrite,
  "ce1-calc-fcfa": checkMoney,
  "ce1-mult-table": checkMultTable,
  "ce1-mult-trou": checkMultGap,
  "ce1-mult-addition": checkMultAddition,
  "ce1-mult-poser": checkMultPosed,
  "ce1-mult-ecrire": checkMultWrite,
  "ce1-mult-double": checkMultDouble,
  "ce1-mult-dix": checkMultTen,
  "ce1-mult-relier": checkMultLinks,
  "ce1-mult-glisser": checkMultSort,
  "ce1-mult-probleme": checkMultProblem,
};

const KINDS = Object.keys(CHECKS) as GameKind[];
const VOCABULARIES = ["nombres-1000", "nombres-10000"] as const;
const TOPIC_KINDS: Record<string, string[]> = {
  "ma-ce1-nombres-1000": ["voisin", "comparer", "ordre", "chiffres", "decomposer", "encadrer", "suite", "lettres", "relier", "ecrire"].map((k) => `ce1-nb-${k}`),
  "ma-ce1-nombres-10000": ["voisin", "comparer", "ordre", "chiffres", "decomposer", "encadrer", "glisser", "suite", "lettres", "ecrire"].map((k) => `ce1-nb-${k}`),
  "ma-ce1-add-sous": ["ajouter", "enlever", "retenue", "trou", "mental", "ordre", "relier", "glisser", "ecrire", "fcfa"].map((k) => `ce1-calc-${k}`),
  "ma-ce1-multiplication": ["table", "trou", "addition", "poser", "ecrire", "double", "dix", "relier", "glisser", "probleme"].map((k) => `ce1-mult-${k}`),
};
const TOPIC_KEYS = Object.keys(TOPIC_KINDS);
const entryOf = (key: string) => allProgrammeEntries().find((entry) => entry.topic.key === key)!;
const topicOf = (key: string) => entryOf(key).topic;

/** Les exercices à vérifier d'un gabarit : les nombres à chaque plafond, les autres sans plafond. */
const variants = (kind: GameKind): { vocabulary: string | undefined }[] => (kind.startsWith("ce1-nb-") ? VOCABULARIES.map((vocabulary) => ({ vocabulary })) : [{ vocabulary: undefined }]);

describe("chaque gabarit de mathématiques du CE1 a sa vérification", () => {
  it("couvre exactement les trente et un gabarits, tous rangés dans une thématique", () => {
    expect(KINDS).toHaveLength(31);
    expect([...new Set(Object.values(TOPIC_KINDS).flat())].sort()).toEqual([...KINDS].sort());
    for (const kind of KINDS) expect(Object.keys(GAME_KINDS), kind).toContain(kind);
  });
});

describe("l'écriture des nombres en lettres", () => {
  it("écrit les nombres difficiles comme à l'école : un s à cent et à vingt seulement en fin de nombre, mille sans s, et sans trait d'union au-delà de cent", () => {
    for (const [n, text] of TRICKY_WORDS) {
      expect(words(n), `table de ${n}`).toBe(text);
      expect(wordsOf(n), `wordsOf(${n})`).toBe(text);
    }
  });

  it("écrit tous les nombres de 0 à 10 000 comme la table du test, et ne donne jamais deux fois le même mot", () => {
    for (let n = 0; n <= 10000; n++) expect(wordsOf(n), String(n)).toBe(words(n));
    expect(NUMBER_OF_WORDS.size).toBe(10001);
  });
});

describe("les gabarits de mathématiques du CE1 recalculent juste, depuis une arithmétique écrite à part", () => {
  for (const kind of KINDS) {
    it(`${kind} : la bonne réponse se lit dans la règle, à tous les niveaux`, () => {
      for (const { vocabulary } of variants(kind)) {
        for (const d of draws) {
          const exo = make(kind, d, vocabulary) as unknown as Exo;
          expect(CHECKS[kind](exo), `${kind} ${vocabulary ?? ""} niveau ${d.level} : ${exo.prompt} ${exo.payload.text ?? ""}`).toBeNull();
        }
      }
    });
  }
});

// ===========================================================================
// LES MUTATIONS
// ===========================================================================

/** Abîme la bonne réponse d'un exercice juste, sans toucher à l'énoncé ni aux tuiles. */
function mutate(kind: GameKind, exo: Exo): Exo | null {
  const payload = JSON.parse(JSON.stringify(exo.payload)) as Record<string, unknown>;
  const copy = (): Exo => ({ ...exo, payload });
  switch (GAME_KINDS[kind].type) {
    case "qcm": {
      const options = payload.options as string[];
      payload.correctIndex = ((payload.correctIndex as number) + 1) % options.length;
      return copy();
    }
    case "fill-blank": {
      const blank = (payload.blanks as { options: string[]; answer: string }[])[0];
      const other = blank.options.find((option) => option !== blank.answer);
      if (!other) return null;
      blank.answer = other;
      return copy();
    }
    case "order": {
      const sequence = payload.correctSequence as string[];
      [sequence[0], sequence[sequence.length - 1]] = [sequence[sequence.length - 1], sequence[0]];
      return copy();
    }
    case "match": {
      const pairs = payload.pairs as { left: string; right: string }[];
      [pairs[0].right, pairs[1].right] = [pairs[1].right, pairs[0].right];
      return copy();
    }
    case "drag-drop": {
      const items = payload.items as { text: string; correctZone: string }[];
      const zones = payload.zones as string[];
      items[0].correctZone = zones.find((zone) => zone !== items[0].correctZone) as string;
      return copy();
    }
    case "short-answer": {
      payload.acceptedAnswers = ["999999"];
      return { ...copy(), answerKey: "999999" };
    }
    default:
      return null;
  }
}

describe("les vérifications voient une bonne réponse abîmée", () => {
  for (const kind of KINDS) {
    it(`${kind} : abîmer la réponse fait échouer la vérification`, () => {
      let mutated = 0;
      for (const { vocabulary } of variants(kind)) {
        for (const d of draws.filter((_, i) => i % 4 === 0)) {
          const exo = make(kind, d, vocabulary) as unknown as Exo;
          const broken = mutate(kind, exo);
          if (!broken) continue;
          mutated += 1;
          expect(CHECKS[kind](broken), `${kind} niveau ${d.level} : ${exo.prompt}`).not.toBeNull();
        }
      }
      expect(mutated, kind).toBeGreaterThan(0);
    });
  }

  it("voient aussi un énoncé abîmé : une addition sans retenue, une moitié impaire, une retenue de trop au deuxième palier", () => {
    const qcm = (prompt: string, options: string[], correctIndex: number, meta: { level: number; vocabulary?: string }) =>
      ({ type: "qcm", prompt, answerKey: options[correctIndex], hints: [], payload: { options, correctIndex, game: { kind: "x", ...meta } } }) as Exo;
    expect(CHECKS["ce1-nb-voisin"](qcm("Quel nombre vient juste après 399 ?", ["300", "400", "410"], 0, { level: 3 }))).not.toBeNull();
    expect(CHECKS["ce1-nb-voisin"](qcm("Quel nombre vient juste après 399 ?", ["300", "400", "410"], 1, { level: 3 }))).toBeNull();
    expect(CHECKS["ce1-calc-ajouter"](qcm("Combien font 221 + 49 ?", ["260", "270", "280"], 1, { level: 1 }))).toBeNull();
    expect(CHECKS["ce1-calc-ajouter"](qcm("Combien font 221 + 49 ?", ["260", "270", "280"], 0, { level: 1 }))).not.toBeNull();
    // 211 + 134 n'a aucune retenue : ce n'est pas une addition de ce fichier, même juste.
    expect(CHECKS["ce1-calc-ajouter"](qcm("Combien font 211 + 134 ?", ["345", "355", "335"], 0, { level: 1 }))).not.toBeNull();
    expect(CHECKS["ce1-mult-double"](qcm("Quelle est la moitié de 35 ?", ["17", "18", "16"], 1, { level: 2 }))).not.toBeNull();
    expect(CHECKS["ce1-mult-poser"](qcm("Combien font 14 × 4 ?", ["56", "416", "46"], 0, { level: 2 }))).not.toBeNull();
    expect(CHECKS["ce1-mult-poser"](qcm("Combien font 14 × 4 ?", ["56", "416", "46"], 0, { level: 3 }))).toBeNull();
  });
});

// ===========================================================================
// LES RÈGLES COMMUNES
// ===========================================================================

describe("tous les gabarits de mathématiques du CE1", () => {
  const exos = KINDS.flatMap((kind) =>
    variants(kind).flatMap(({ vocabulary }) => draws.filter((_, i) => i % 3 === 0).map((d) => ({ kind, vocabulary, exo: make(kind, d, vocabulary) as unknown as Exo }))),
  );

  const texts = (exo: Exo): string[] => {
    const out = [...exo.hints];
    if (exo.payload.options) out.push(...optionsOf(exo));
    if (exo.payload.blanks) out.push(textOf(exo), ...blankOf(exo).options);
    if (exo.payload.correctSequence) out.push(...sequenceOf(exo));
    if (exo.payload.pairs) out.push(...pairsOf(exo).flatMap((pair) => [pair.left, pair.right]));
    if (exo.payload.items) out.push(...itemsOf(exo).map((item) => item.text), ...zonesOf(exo));
    return out;
  };

  it("ont un énoncé que l'écran sait couper : pas de deux-points, une apostrophe au plus, vingt-huit mots au plus", () => {
    for (const { kind, exo } of exos) {
      expect(exo.prompt, kind).not.toMatch(/:/);
      expect(apostrophes(exo.prompt), `${kind} : ${exo.prompt}`).toBeLessThanOrEqual(1);
      expect(wordCount(exo.prompt), `${kind} : ${exo.prompt}`).toBeLessThanOrEqual(28);
    }
  });

  it("n'écrivent aucun émoji, ni dans un énoncé, ni sur une tuile, ni dans un indice, et aucun sélecteur de variation", () => {
    const selector = String.fromCodePoint(0xfe0f);
    for (const { kind, exo } of exos) {
      expect(/\p{Extended_Pictographic}/u.test(exo.prompt), `${kind} : ${exo.prompt}`).toBe(false);
      for (const text of texts(exo)) {
        expect(text.includes(selector), `${kind} : « ${text} »`).toBe(false);
        expect(/\p{Extended_Pictographic}/u.test(text), `${kind} : « ${text} »`).toBe(false);
      }
    }
  });

  it("proposent des choix tous différents, dont un seul est la bonne réponse", () => {
    for (const { kind, exo } of exos) {
      if (exo.payload.options) {
        expect(new Set(optionsOf(exo)).size, `${kind} : ${exo.prompt}`).toBe(optionsOf(exo).length);
        expect(optionsOf(exo).length, `${kind} : ${exo.prompt}`).toBe(3);
      }
      if (exo.payload.blanks) {
        const { options, answer } = blankOf(exo);
        expect(new Set(options).size, `${kind} : ${textOf(exo)}`).toBe(options.length);
        expect(options.filter((option) => option === answer), `${kind} : ${textOf(exo)}`).toHaveLength(1);
        expect(options.length, `${kind} : ${textOf(exo)}`).toBe(3);
      }
      if (exo.payload.items) {
        const items = itemsOf(exo);
        expect(new Set(items.map((item) => item.text)).size, `${kind} : ${exo.prompt}`).toBe(items.length);
      }
      if (exo.payload.pairs) {
        const pairs = pairsOf(exo);
        expect(new Set(pairs.map((pair) => pair.left)).size, kind).toBe(pairs.length);
        expect(new Set(pairs.map((pair) => pair.right)).size, kind).toBe(pairs.length);
      }
      if (exo.payload.correctSequence) expect(new Set(sequenceOf(exo)).size, kind).toBe(sequenceOf(exo).length);
    }
  });

  it("n'écrivent aucun chiffre dans un indice : un résultat se lirait dedans", () => {
    for (const { kind, exo } of exos) for (const hint of exo.hints) expect(hint, `${kind} : « ${hint} »`).not.toMatch(/\d/);
  });

  it("donnent trois indices différents, et se refont à l'identique avec la même graine", () => {
    for (const kind of KINDS) {
      for (const { vocabulary } of variants(kind)) {
        const a = GAME_KINDS[kind].make(makeContext("CE1", 3, "graine", undefined, vocabulary));
        const b = GAME_KINDS[kind].make(makeContext("CE1", 3, "graine", undefined, vocabulary));
        expect(a).toEqual(b);
        expect(a.hints).toHaveLength(3);
        expect(new Set(a.hints).size, kind).toBe(3);
      }
    }
  });

  it("passent le contrôleur au CE1 sans aucun défaut, à tous les niveaux et aux deux plafonds", () => {
    for (const { kind, exo } of exos) {
      const defects = auditExercise({
        type: GAME_KINDS[kind].type,
        prompt: exo.prompt,
        payload: exo.payload,
        answerKey: exo.answerKey,
        hints: exo.hints,
        class: "CE1",
        subject: "Mathématiques",
      });
      expect(defects, `${kind} : ${exo.prompt}`).toEqual([]);
    }
  });

  it("portent leur gabarit, leur niveau et leur plafond dans le payload, pour que le code refasse un exercice raté", () => {
    for (const { kind, vocabulary, exo } of exos) {
      const origin = exo.payload.game as { kind: string; level: number; vocabulary?: string };
      expect(origin.kind, kind).toBe(kind);
      expect([1, 2, 3, 4], kind).toContain(origin.level);
      expect(origin.vocabulary, kind).toBe(vocabulary);
    }
  });
});

// ===========================================================================
// LES THÉMATIQUES DU PROGRAMME
// ===========================================================================

describe("les quatre thématiques de mathématiques du CE1", () => {
  it("remplissent les dix places du palier, avec des jeux connus, sans appeler le modèle", () => {
    for (const key of TOPIC_KEYS) {
      const specs = topicOf(key).games ?? [];
      expect(specs.reduce((sum, spec) => sum + spec.count, 0), key).toBe(PALIER_SIZE);
      expect([...specs.map((spec) => spec.kind as string)].sort(), key).toEqual([...TOPIC_KINDS[key]].sort());
      for (const spec of specs) expect(Object.keys(GAME_KINDS), `${key} : ${spec.kind}`).toContain(spec.kind);
      expect(topicUsesModel(key), key).toBe(false);
    }
  });

  it("donnent à chaque gabarit de nombres le plafond de sa fiche, et aux autres aucun", () => {
    for (const key of TOPIC_KEYS) {
      for (const spec of topicOf(key).games ?? []) {
        const expected = key === "ma-ce1-nombres-1000" ? "nombres-1000" : key === "ma-ce1-nombres-10000" ? "nombres-10000" : undefined;
        expect(spec.vocabulary, `${key} : ${spec.kind}`).toBe(expected);
      }
    }
  });

  it("sont celles du CE1, à quatre paliers, et gardent leur clé", () => {
    for (const key of TOPIC_KEYS) {
      expect(entryOf(key).klass, key).toBe("CE1");
      expect(topicOf(key).palierCount, key).toBeUndefined();
    }
    expect(TOPIC_KEYS).toHaveLength(4);
  });

  it("fabriquent des paliers entiers, de dix exercices, qui passent le contrôleur et la règle, aux quatre paliers", () => {
    for (const key of TOPIC_KEYS) {
      for (let n = 0; n < 30; n++) {
        for (const palierIndex of [1, 2, 3, 4]) {
          const paliers = generateGames(topicOf(key).games ?? [], { klass: "CE1", palierIndex, palierCount: 4, seed: `${key}:${n}:${palierIndex}` });
          expect(paliers, `${key} palier ${palierIndex}`).toHaveLength(PALIER_SIZE);
          const questions = paliers.map((game) => `${game.prompt}|${JSON.stringify(game.payload)}`);
          expect(new Set(questions).size, `${key} #${n} palier ${palierIndex}`).toBe(questions.length);
          expect(new Set(paliers.map((game) => game.type)).size, `${key} palier ${palierIndex}`).toBeGreaterThanOrEqual(4);
          for (const game of paliers) {
            const defects = auditExercise({ type: game.type, prompt: game.prompt, payload: game.payload, answerKey: game.answerKey, hints: game.hints, class: "CE1", subject: "Mathématiques" });
            expect(defects, `${key} palier ${palierIndex} : ${game.prompt}`).toEqual([]);
            const kind = (game.payload.game as { kind: string }).kind;
            expect(CHECKS[kind](game as unknown as Exo), `${key} palier ${palierIndex} ${kind} : ${game.prompt} ${game.payload.text ?? ""}`).toBeNull();
          }
        }
      }
    }
  });

  it("ne posent pas, dans un palier de multiplication, deux fois le même produit (table et facteur)", () => {
    for (let n = 0; n < 120; n++) {
      for (const palierIndex of [1, 2, 3, 4] as GameLevel[]) {
        const paliers = generateGames(topicOf("ma-ce1-multiplication").games ?? [], { klass: "CE1", palierIndex, palierCount: 4, seed: `produit:${n}:${palierIndex}` });
        const asked: string[] = [];
        for (const game of paliers) {
          const kind = (game.payload.game as { kind: string }).kind;
          if ((kind === "ce1-mult-table" || kind === "ce1-mult-ecrire") && !/Pose/.test(game.prompt)) {
            const match = /(\d+) × (\d+)/.exec(game.prompt)!;
            const [table, factor] = sides(palierIndex, Number(match[1]), Number(match[2]));
            asked.push(`${table}x${factor}`);
          }
          if (kind === "ce1-mult-trou") {
            const match = /(\d+) × ___ = (.+)|___ × (\d+) = (.+)/.exec(textOf(game as unknown as Exo))!;
            const table = Number(match[1] ?? match[3]);
            asked.push(`${table}x${num(match[2] ?? match[4]) / table}`);
          }
          if (kind === "ce1-mult-relier") {
            for (const pair of pairsOf(game as unknown as Exo)) {
              const match = /(\d+) × (\d+)/.exec(pair.left)!;
              const [table, factor] = sides(palierIndex, Number(match[1]), Number(match[2]));
              asked.push(`${table}x${factor}`);
            }
          }
        }
        expect(new Set(asked).size, `palier ${palierIndex} : ${asked.join(" ")}`).toBe(asked.length);
      }
    }
  });

  it("sert tous les produits des tables du palier : chaque produit revient à un moment ou à un autre", () => {
    const seen: Record<number, Set<string>> = { 1: new Set(), 2: new Set(), 3: new Set(), 4: new Set() };
    for (let n = 0; n < 400; n++) {
      for (const level of LEVELS) {
        const exo = GAME_KINDS["ce1-mult-table"].make(makeContext("CE1", level, `produits:${level}:${n}`));
        const match = TIMES.exec(exo.prompt)!;
        seen[level].add(`${match[1]}x${match[2]}`);
      }
    }
    for (const level of LEVELS) {
      const expected = TABLES[level].flatMap((table) => [2, 3, 4, 5, 6, 7, 8, 9, 10].map((factor) => (level === 4 ? `${factor}x${table}` : `${table}x${factor}`)));
      expect([...seen[level]].sort(), `palier ${level}`).toEqual(expected.sort());
    }
  });

  it("sert chaque classe d'opération à son palier : retenue des unités puis des dizaines, emprunt des unités puis des dizaines", () => {
    const classes: Record<string, Set<string>> = { add1: new Set(), add3: new Set(), add4: new Set(), sub1: new Set(), sub3: new Set(), sub4: new Set() };
    for (let n = 0; n < 600; n++) {
      for (const level of [1, 3, 4] as GameLevel[]) {
        const add = /^Combien font (.+) \+ (.+) \?$/u.exec(GAME_KINDS["ce1-calc-ajouter"].make(makeContext("CE1", level, `add:${level}:${n}`)).prompt)!;
        const sub = new RegExp(`^Combien font (.+) ${MINUS} (.+) \\?$`, "u").exec(GAME_KINDS["ce1-calc-enlever"].make(makeContext("CE1", level, `sub:${level}:${n}`)).prompt)!;
        classes[`add${level}`].add(carries(num(add[1]), num(add[2])).tens ? "deux" : "une");
        classes[`sub${level}`].add(borrows(num(sub[1]), num(sub[2])).tens ? "deux" : "un");
      }
    }
    expect([...classes.add1]).toEqual(["une"]);
    expect([...classes.add4]).toEqual(["deux"]);
    expect([...classes.add3].sort()).toEqual(["deux", "une"]);
    expect([...classes.sub1]).toEqual(["un"]);
    expect([...classes.sub4]).toEqual(["deux"]);
    expect([...classes.sub3].sort()).toEqual(["deux", "un"]);
  });

  it("ne reposent presque jamais la même question à deux paliers d'une même thématique", () => {
    for (const key of TOPIC_KEYS) {
      let repeated = 0;
      let total = 0;
      for (let n = 0; n < 40; n++) {
        const before = new Set<string>();
        for (const palierIndex of [1, 2, 3, 4]) {
          const paliers = generateGames(topicOf(key).games ?? [], { klass: "CE1", palierIndex, palierCount: 4, seed: `var:${key}:${n}:${palierIndex}` });
          const here = paliers.map((game) => `${game.prompt}|${game.type === "fill-blank" ? String(game.payload.text) : ""}|${game.answerKey}`);
          for (const question of here) {
            total += 1;
            if (before.has(question)) repeated += 1;
          }
          here.forEach((question) => before.add(question));
        }
      }
      expect(repeated / total, key).toBeLessThan(0.02);
    }
  });

  it("gardent de quoi servir la démo du site : un QCM et une réponse courte dans chaque thématique", () => {
    const typesOf = (key: string) => new Set((topicOf(key).games ?? []).map((spec) => GAME_KINDS[spec.kind].type));
    for (const key of TOPIC_KEYS) for (const type of ["qcm", "short-answer"]) expect(typesOf(key).has(type as never), `${key} : ${type}`).toBe(true);
  });

  it("refont chaque exercice raté par le code, sans le modèle, au plafond de sa fiche", () => {
    for (const kind of KINDS) {
      for (const { vocabulary } of variants(kind)) {
        const again = regenerateGame({ kind, level: 3, ...(vocabulary ? { vocabulary } : {}) }, "CE1", `reprise:${kind}`);
        expect(again, kind).not.toBeNull();
        expect(again!.type, kind).toBe(GAME_KINDS[kind].type);
        expect(CHECKS[kind](again as unknown as Exo), `${kind} ${vocabulary ?? ""}`).toBeNull();
      }
    }
  });
});
