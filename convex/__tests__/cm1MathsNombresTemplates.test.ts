import { describe, expect, it } from "vitest";
import { wordsOfCm1 } from "../paliers/games/nombresCm1";
import type { GameLevel } from "../paliers/games/shared";
import { acceptedOf, all, blankOf, defineMathsTests, fmt, itemsOf, levelOf, num, NUMBER, ok, optionsOf, rightOption, sequenceOf, textOf, wrongOf, zonesOf, type Check, type Exo } from "@/lib/test-support/cm1MathsKit";

/**
 * LES GRANDS NOMBRES DU CM1 (`ma-cm1-grands-nombres`) : jusqu'à 9 999 999.
 *
 * Chaque test RECALCULE la bonne réponse avec sa propre arithmétique, écrite à part : le mot de chaque nombre (un autre algorithme que `wordsOfCm1`, et une
 * table de cas difficiles écrite à la main), l'arrondi de l'école compté en restes, la décomposition lue chiffre par chiffre, la plage de chaque palier. Un
 * gabarit dont la réponse contredit sa règle, ou qui sort de la plage de son palier, échoue.
 */

// ===========================================================================
// LES NOMBRES EN LETTRES, ÉCRITS À PART
// ===========================================================================

const SMALL = ["zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"];
const TENS = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante"];

/** Un nombre sous cent. `last` : rien ne suit, donc « quatre-vingts » prend son s. */
function underHundred(n: number, last: boolean): string {
  if (n < 20) return SMALL[n];
  const tens = Math.floor(n / 10);
  const units = n % 10;
  if (tens <= 6) return units === 0 ? TENS[tens] : units === 1 ? `${TENS[tens]} et un` : `${TENS[tens]}-${SMALL[units]}`;
  if (tens === 7) return units === 1 ? "soixante et onze" : `soixante-${SMALL[10 + units]}`;
  if (tens === 8) return units === 0 ? (last ? "quatre-vingts" : "quatre-vingt") : `quatre-vingt-${SMALL[units]}`;
  return `quatre-vingt-${SMALL[10 + units]}`;
}

/** Un nombre sous mille. « cent » prend un s après un nombre de centaines, quand rien ne suit. */
function underThousand(n: number, last: boolean): string {
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  if (hundreds === 0) return underHundred(rest, last);
  const head = hundreds === 1 ? "cent" : `${SMALL[hundreds]} cent${rest === 0 && last ? "s" : ""}`;
  return rest === 0 ? head : `${head} ${underHundred(rest, last)}`;
}

/** Un nombre de 1 à 9 999 999 en lettres : « mille » et « million » comptent comme des noms, le s de « cents » et de « quatre-vingts » ne se met qu'en fin de nombre. */
function words(n: number): string {
  const millions = Math.floor(n / 1000000);
  const thousands = Math.floor(n / 1000) % 1000;
  const units = n % 1000;
  const out: string[] = [];
  if (millions > 0) out.push(millions === 1 ? "un million" : `${SMALL[millions]} millions`);
  if (thousands > 0) out.push(thousands === 1 ? "mille" : `${underThousand(thousands, false)} mille`);
  if (units > 0) out.push(underThousand(units, true));
  return out.join(" ");
}

/** Des cas où l'on se trompe, écrits à la main : le s de « cents », « quatre-vingts », « mille » sans s, « un million » mais « deux millions ». */
const TRICKY_WORDS: [number, string][] = [
  [1000, "mille"],
  [1001, "mille un"],
  [2000, "deux mille"],
  [10000, "dix mille"],
  [21000, "vingt et un mille"],
  [21001, "vingt et un mille un"],
  [71000, "soixante et onze mille"],
  [80000, "quatre-vingt mille"],
  [80080, "quatre-vingt mille quatre-vingts"],
  [81000, "quatre-vingt-un mille"],
  [91000, "quatre-vingt-onze mille"],
  [99999, "quatre-vingt-dix-neuf mille neuf cent quatre-vingt-dix-neuf"],
  [100000, "cent mille"],
  [200000, "deux cent mille"],
  [280000, "deux cent quatre-vingt mille"],
  [280280, "deux cent quatre-vingt mille deux cent quatre-vingts"],
  [200, "deux cents"],
  [201, "deux cent un"],
  [20200, "vingt mille deux cents"],
  [12345, "douze mille trois cent quarante-cinq"],
  [45678, "quarante-cinq mille six cent soixante-dix-huit"],
  [60060, "soixante mille soixante"],
  [3080, "trois mille quatre-vingts"],
  [3081, "trois mille quatre-vingt-un"],
  [1000000, "un million"],
  [1000001, "un million un"],
  [1000080, "un million quatre-vingts"],
  [1001000, "un million mille"],
  [2000000, "deux millions"],
  [2000001, "deux millions un"],
  [3080000, "trois millions quatre-vingt mille"],
  [4200000, "quatre millions deux cent mille"],
  [4000200, "quatre millions deux cents"],
  [5000100, "cinq millions cent"],
  [6780071, "six millions sept cent quatre-vingt mille soixante et onze"],
  [9999999, "neuf millions neuf cent quatre-vingt-dix-neuf mille neuf cent quatre-vingt-dix-neuf"],
];

// ===========================================================================
// LA PLAGE DE CHAQUE PALIER
// ===========================================================================

/** Le niveau 1 est le palier 1 ; le niveau 2 les paliers 2 et 3 ; le niveau 3 le palier 4 ; le niveau 4 le palier 5. */
const LO: Record<GameLevel, number> = { 1: 10000, 2: 100000, 3: 1000000, 4: 1000000 };
const TOP: Record<GameLevel, number> = { 1: 99999, 2: 999999, 3: 4999999, 4: 9999999 };
const CAP = 9999999;
const inLevel = (n: number, level: GameLevel) => n >= LO[level] && n <= TOP[level];

const RANKS = ["unités", "dizaines", "centaines", "milliers", "dizaines de mille", "centaines de mille", "millions"];

const sortedDigits = (n: number) => String(n).split("").sort().join("");

/** Trois nombres à comparer : deux d'un même millier, ou les mêmes chiffres dans un autre ordre (dès le troisième palier). */
function hardToCompare(values: number[], level: GameLevel): boolean {
  if (level === 1) return true;
  const sameBlock = values.some((a, i) => values.some((b, j) => i !== j && Math.floor(a / 1000) === Math.floor(b / 1000)));
  const sameDigits = values.every((value) => sortedDigits(value) === sortedDigits(values[0]));
  return sameBlock || sameDigits;
}

const checkNeighbour: Check = (exo) => {
  const level = levelOf(exo);
  const allowed: Record<GameLevel, number[]> = { 1: [1, 10, 100], 2: [1, 100, 1000, 10000], 3: [1, 1000, 10000, 100000], 4: [1, 10000, 100000, 1000000] };
  let n: number;
  let size: number;
  let expected: number;
  let m = new RegExp(`^Quel nombre vient juste (après|avant) (${NUMBER}) \\?$`).exec(exo.prompt);
  if (m) {
    n = num(m[2]);
    size = 1;
    expected = m[1] === "après" ? n + 1 : n - 1;
  } else if ((m = new RegExp(`^Quel nombre obtiens-tu en (ajoutant|enlevant) (${NUMBER}) à (${NUMBER}) \\?$`).exec(exo.prompt))) {
    size = num(m[2]);
    n = num(m[3]);
    expected = m[1] === "ajoutant" ? n + size : n - size;
  } else return `énoncé inconnu : ${exo.prompt}`;
  return all(
    ok(num(rightOption(exo)) === expected, `${exo.prompt} : ${rightOption(exo)}, pas ${expected}`),
    ok(allowed[level].includes(size), `le pas ${size} au niveau ${level}`),
    ok(inLevel(n, level), `${n} hors de la plage du niveau ${level}`),
    ok(expected >= 1 && expected <= CAP, `la réponse ${expected} hors des nombres du CM1`),
    ok(wrongOf(exo).every((option) => /^\d[\d ]*$/.test(option) && num(option) >= 1 && num(option) <= CAP), `un choix hors des nombres du CM1 : ${optionsOf(exo).join(", ")}`),
  );
};

const checkCompare: Check = (exo) => {
  const m = /^Quel est le (plus grand|plus petit) de ces nombres \?$/.exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const values = optionsOf(exo).map(num);
  const expected = m[1] === "plus grand" ? Math.max(...values) : Math.min(...values);
  const level = levelOf(exo);
  return all(
    ok(new Set(values).size === 3, "trois nombres différents"),
    ok(num(rightOption(exo)) === expected, `${exo.prompt} ${optionsOf(exo).join(", ")} : ${rightOption(exo)}`),
    ok(values.every((value) => inLevel(value, level)), `un nombre hors de la plage du niveau ${level}`),
    ok(hardToCompare(values, level), "ni deux nombres du même millier ni les mêmes chiffres"),
  );
};

const checkOrder: Check = (exo) => {
  const ascending = /du plus petit au plus grand/.test(exo.prompt);
  const descending = /du plus grand au plus petit/.test(exo.prompt);
  if (ascending === descending) return `énoncé inconnu : ${exo.prompt}`;
  const values = sequenceOf(exo).map(num);
  const sorted = [...values].sort((a, b) => (ascending ? a - b : b - a));
  const level = levelOf(exo);
  return all(
    ok(values.length === 4 && new Set(values).size === 4, "quatre nombres différents"),
    ok(JSON.stringify(values) === JSON.stringify(sorted), `${exo.prompt} ${sequenceOf(exo).join(" / ")}`),
    ok(values.every((value) => inLevel(value, level)), "un nombre hors de la plage du palier"),
    ok(level > 1 || ascending, "du plus grand au plus petit au premier palier"),
    ok(hardToCompare(values, level), "ni deux nombres du même millier ni les mêmes chiffres"),
  );
};

const checkDigits: Check = (exo) => {
  const level = levelOf(exo);
  let m = new RegExp(`^Quel est le chiffre des (${RANKS.join("|")}) de (${NUMBER}) \\?$`).exec(exo.prompt);
  if (m) {
    const n = num(m[2]);
    const digit = Math.floor(n / 10 ** RANKS.indexOf(m[1])) % 10;
    return all(
      ok(rightOption(exo) === String(digit), `${exo.prompt} : ${rightOption(exo)}, pas ${digit}`),
      ok(inLevel(n, level) && !String(n).includes("0") && new Set(String(n)).size === String(n).length, `${n} n'a pas des chiffres tous différents sans zéro dans la plage du niveau ${level}`),
      ok(RANKS.indexOf(m[1]) < String(n).length, `le rang ${m[1]} n'existe pas dans ${n}`),
      ok(wrongOf(exo).every((option) => /^\d$/.test(option)), "des chiffres pour mauvais choix"),
    );
  }
  m = new RegExp(`^Dans (${NUMBER}), quelle est la valeur du chiffre (\\d) \\?$`).exec(exo.prompt);
  if (m) {
    const n = num(m[1]);
    const digit = Number(m[2]);
    const rank = String(n).length - 1 - String(n).indexOf(String(digit));
    return all(
      ok(String(n).split(String(digit)).length === 2, `le chiffre ${digit} n'est pas seul dans ${n}`),
      ok(num(rightOption(exo)) === digit * 10 ** rank, `${exo.prompt} : ${rightOption(exo)}, pas ${digit * 10 ** rank}`),
      ok(level >= 2, "la valeur d'un chiffre au premier palier"),
      ok(inLevel(n, level), `${n} hors de la plage du niveau ${level}`),
    );
  }
  m = new RegExp(`^Dans (${NUMBER}), combien y a-t-il de (${RANKS.join("|")}) en tout \\?$`).exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const n = num(m[1]);
  const rank = RANKS.indexOf(m[2]);
  return all(
    ok(num(rightOption(exo)) === Math.floor(n / 10 ** rank), `${exo.prompt} : ${rightOption(exo)}, pas ${Math.floor(n / 10 ** rank)}`),
    ok(level >= 2, "le nombre d'un rang au premier palier"),
    ok(rank >= 2 && rank <= String(n).length - 2, `le rang ${m[2]} de ${n} ne laisse pas un nombre de plusieurs chiffres`),
    ok(inLevel(n, level), `${n} hors de la plage du niveau ${level}`),
  );
};

/** Le rang d'un mot de rang écrit dans une décomposition « 4 centaines de mille ». */
function rankOfWord(word: string): number {
  if (/^centaines? de mille$/.test(word)) return 5;
  if (/^dizaines? de mille$/.test(word)) return 4;
  if (/^centaines?$/.test(word)) return 2;
  if (/^dizaines?$/.test(word)) return 1;
  if (/^unités?$/.test(word)) return 0;
  if (/^milliers?$/.test(word)) return 3;
  if (/^millions?$/.test(word)) return 6;
  return -1;
}

const checkDecompose: Check = (exo) => {
  const level = levelOf(exo);
  const text = textOf(exo);
  const answer = blankOf(exo).answer;
  // « 370 037 = 300 000 + ___ + 30 + 7 » : une somme de valeurs de rang.
  let m = new RegExp(`^(${NUMBER}) = ((?:${NUMBER}|___)(?: \\+ (?:${NUMBER}|___))+)$`).exec(text);
  if (m) {
    const n = num(m[1]);
    const terms = m[2].split(" + ").map((term) => (term === "___" ? num(answer) : num(term)));
    const blank = m[2].split(" + ").indexOf("___");
    const rankValue = (value: number) => {
      const rank = Math.floor(Math.log10(value));
      return value % 10 ** rank === 0 && value / 10 ** rank <= 9;
    };
    return all(
      ok(terms.reduce((sum, term) => sum + term, 0) === n, `${text} : ${answer}`),
      ok(terms.every(rankValue), `un terme qui n'est pas une valeur de rang : ${terms.join(" + ")}`),
      ok(terms.every((term, i) => i === 0 || term < terms[i - 1]), "des termes du plus grand au plus petit"),
      ok(blank >= 1, "le trou ne remplace pas le premier terme"),
      ok(terms.length >= 3 && terms.length <= 4, `${terms.length} termes`),
      ok(inLevel(n, level), `${n} hors de la plage du niveau ${level}`),
    );
  }
  // « 456 789 = 456 × 1 000 + ___ »
  m = new RegExp(`^(${NUMBER}) = (${NUMBER}) × 1 000 \\+ ___$`).exec(text);
  if (m) {
    const n = num(m[1]);
    return all(
      ok(num(m[2]) === Math.floor(n / 1000), `${text} : le nombre de milliers n'est pas ${Math.floor(n / 1000)}`),
      ok(num(answer) === n % 1000, `${text} : ${answer}, pas ${n % 1000}`),
      ok(inLevel(n, level) && !String(n).includes("0"), `${n} hors de la plage du niveau ${level}`),
    );
  }
  // « 456 789 = ___ × 1 000 + 789 »
  m = new RegExp(`^(${NUMBER}) = ___ × 1 000 \\+ (\\d{3})$`).exec(text);
  if (m) {
    const n = num(m[1]);
    return all(
      ok(Number(m[2]) === n % 1000, `${text} : le reste n'est pas ${n % 1000}`),
      ok(num(answer) === Math.floor(n / 1000), `${text} : ${answer}, pas ${Math.floor(n / 1000)}`),
      ok(inLevel(n, level) && !String(n).includes("0"), `${n} hors de la plage du niveau ${level}`),
    );
  }
  // « 4 centaines de mille, 5 dizaines de mille et 6 unités, c'est le nombre ___. »
  m = /^(.+), c'est le nombre ___\.$/.exec(text);
  if (!m) return `phrase inconnue : ${text}`;
  const parts = [...m[1].matchAll(/(\d) (centaines? de mille|dizaines? de mille|centaines?|dizaines?|unités?|milliers?|millions?)/g)];
  const digits = parts.map((part) => Number(part[1]));
  const ranks = parts.map((part) => rankOfWord(part[2]));
  const value = digits.reduce((sum, digit, i) => sum + digit * 10 ** ranks[i], 0);
  return all(
    ok(ranks.every((rank, i) => rank === parts.length - 1 - i), `les rangs ne se suivent pas : ${m[1]}`),
    ok(m[1].split(/, | et /).length === parts.length, `une partie de la phrase n'est pas un rang : ${m[1]}`),
    ok(parts.every((part, i) => /^(dizaines|centaines|unités|milliers|millions)/.test(part[2]) === (digits[i] > 1)), `le pluriel ne suit pas le chiffre : ${m![1]}`),
    ok(num(answer) === value, `${text} : ${answer}, pas ${value}`),
    ok(digits.every((digit) => digit >= 1), "un chiffre nul dans la décomposition dite"),
    ok(inLevel(value, level), `${value} hors de la plage du niveau ${level}`),
  );
};

const ROUND_UNIT: Record<string, number> = {
  "à la dizaine près": 10,
  "à la centaine près": 100,
  "au millier près": 1000,
  "à la dizaine de mille près": 10000,
  "à la centaine de mille près": 100000,
  "au million près": 1000000,
};

const checkRound: Check = (exo) => {
  const m = new RegExp(`^Arrondis (${NUMBER}) (${Object.keys(ROUND_UNIT).join("|")})\\. Quel nombre obtiens-tu \\?$`).exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const n = num(m[1]);
  const unit = ROUND_UNIT[m[2]];
  // L'arrondi de l'école compté en restes : le reste de la division par le rang, de la moitié du rang au rang, fait monter.
  const quotient = Math.floor(n / unit);
  const remainder = n - quotient * unit;
  const expected = (remainder * 2 >= unit ? quotient + 1 : quotient) * unit;
  const level = levelOf(exo);
  const allowed: Record<GameLevel, number[]> = { 1: [10, 100, 1000], 2: [100, 1000, 10000], 3: [1000, 10000, 100000], 4: [10000, 100000, 1000000] };
  // Le rang du niveau 2 est celui des paliers 2 et 3 : la centaine, le millier, la dizaine de mille, ou le millier, la dizaine de mille, la centaine de mille.
  const allowedHere = level === 2 ? [100, 1000, 10000, 100000] : allowed[level];
  return all(
    ok(num(rightOption(exo)) === expected, `${exo.prompt} : ${rightOption(exo)}, pas ${expected}`),
    ok(wrongOf(exo).every((option) => num(option) !== expected), "un mauvais choix qui est la bonne réponse"),
    ok(allowedHere.includes(unit), `le rang ${unit} au niveau ${level}`),
    ok(inLevel(n, level) && n <= 9499999, `${n} hors de la plage du niveau ${level}`),
    ok(!String(n).includes("0") && new Set(String(n)).size === String(n).length, `${n} : des chiffres qui se répètent ou un zéro`),
    ok(expected <= CAP, `l'arrondi ${expected} passe les millions`),
    ok(wrongOf(exo).every((option) => num(option) <= CAP && num(option) >= 1), "un choix hors des nombres du CM1"),
  );
};

const checkSort: Check = (exo) => {
  const [low, high] = zonesOf(exo);
  const lowMatch = new RegExp(`^Moins de (${NUMBER})$`).exec(low);
  const highMatch = new RegExp(`^Plus de (${NUMBER})$`).exec(high);
  if (!lowMatch || !highMatch || lowMatch[1] !== highMatch[1]) return `cases inconnues : ${zonesOf(exo).join(" / ")}`;
  const threshold = num(lowMatch[1]);
  const level = levelOf(exo);
  const items = itemsOf(exo);
  const each = level === 1 ? 2 : 3;
  const wrongPlace = items.find((item) => item.correctZone !== (num(item.text) < threshold ? low : high));
  return all(
    ok(!wrongPlace, `${wrongPlace?.text} n'est pas dans la bonne case (${low})`),
    ok(items.every((item) => num(item.text) !== threshold), "un nombre égal au seuil"),
    ok(items.filter((item) => item.correctZone === low).length === each && items.filter((item) => item.correctZone === high).length === each, `${each} nombres dans chaque case`),
    ok(items.every((item) => inLevel(num(item.text), level)), `un nombre hors de la plage du niveau ${level}`),
    ok(threshold % (level === 1 ? 10000 : 50000) === 0, `le seuil ${threshold} n'est pas rond`),
    ok(inLevel(threshold, level), `le seuil ${threshold} hors de la plage du niveau ${level}`),
  );
};

const checkSuite: Check = (exo) => {
  const text = textOf(exo);
  const level = levelOf(exo);
  const cells = text.split(", ");
  const blank = cells.indexOf("___");
  if (cells.length !== 5 || blank < 0) return `suite inconnue : ${text}`;
  const values = cells.map((cell, i) => (i === blank ? num(blankOf(exo).answer) : num(cell)));
  const gap = values[1] - values[0];
  const descending = /Elle descend/.test(exo.prompt);
  if (!descending && !/Elle avance/.test(exo.prompt)) return `énoncé inconnu : ${exo.prompt}`;
  const allowed: Record<GameLevel, number[]> = { 1: [1000, 5000, 10000], 2: [5000, 10000, 25000, 50000, 100000], 3: [100000, 250000, 500000], 4: [250000, 500000, 1000000] };
  const shown = new Set(values);
  return all(
    ok(values.every((value, i) => i === 0 || value - values[i - 1] === gap), `${text} : ${blankOf(exo).answer} ne garde pas le pas`),
    ok(allowed[level].includes(Math.abs(gap)), `le pas ${gap} au niveau ${level}`),
    ok(descending === gap < 0, "la consigne ne dit pas le sens de la suite"),
    ok(level >= 2 || !descending, "une suite qui descend au premier palier"),
    ok(values.every((value) => value % Math.abs(gap) === 0), "un terme qui n'est pas un multiple du pas"),
    ok(values.every((value) => inLevel(value, level)), `un terme hors de la plage du niveau ${level}`),
    ok(level === 1 ? blank === 4 : level === 2 ? blank >= 1 : blank >= 1 && blank <= 3, `le trou à la place ${blank} au niveau ${level}`),
    ok(level < 3 || (blank >= 1 && blank <= 3), "le trou au milieu dès le troisième niveau"),
    ok(blankOf(exo).options.every((option) => option === blankOf(exo).answer || !shown.has(num(option))), "un mauvais choix déjà écrit dans la suite"),
  );
};

const checkWords: Check = (exo) => {
  const m = /^Quel nombre s'écrit « (.+) » \?$/.exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const n = num(rightOption(exo));
  const level = levelOf(exo);
  return all(
    ok(words(n) === m[1], `« ${m[1]} » ne s'écrit pas ${rightOption(exo)} mais ${words(n)}`),
    ok(inLevel(n, level), `${n} hors de la plage du niveau ${level}`),
    ok(wrongOf(exo).every((option) => words(num(option)) !== m[1] && inLevel(num(option), level)), `un mauvais choix hors de la plage ou qui se dit pareil : ${optionsOf(exo).join(", ")}`),
    ok(!/cents mille|cents millions?|quatre-vingts (mille|million)/.test(m[1]), `une faute d'accord dans « ${m[1]} »`),
  );
};

const checkWrite: Check = (exo) => {
  const m = /^Écris en chiffres le nombre « (.+) »\.$/.exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const n = Number(exo.answerKey);
  const level = levelOf(exo);
  const countWord = ["", "", "", "", "", "cinq", "six", "sept"][String(n).length];
  return all(
    ok(acceptedOf(exo).length === 1 && acceptedOf(exo)[0] === exo.answerKey, "la réponse admise n'est pas la clé"),
    ok(/^\d+$/.test(exo.answerKey), "la réponse s'écrit avec des chiffres seuls"),
    ok(words(n) === m[1], `« ${m[1]} » ne s'écrit pas ${n} mais ${words(n)}`),
    ok(inLevel(n, level), `${n} hors de la plage du niveau ${level}`),
    ok(exo.hints[1] === `Ce nombre s'écrit avec ${countWord} chiffres.`, `le deuxième indice ne dit pas le nombre de chiffres : ${exo.hints[1]}`),
    ok(exo.hints[2] === `Le premier mot commence par la lettre ${m[1][0]}.`, `le troisième indice ne dit pas la première lettre : ${exo.hints[2]}`),
  );
};

const TOPIC_KINDS = {
  "ma-cm1-grands-nombres": ["voisin", "comparer", "ordre", "chiffres", "decomposer", "arrondir", "glisser", "suite", "lettres", "ecrire"].map((k) => `cm1-gn-${k}`),
};

defineMathsTests({
  label: "des grands nombres du CM1",
  checks: {
    "cm1-gn-voisin": checkNeighbour,
    "cm1-gn-comparer": checkCompare,
    "cm1-gn-ordre": checkOrder,
    "cm1-gn-chiffres": checkDigits,
    "cm1-gn-decomposer": checkDecompose,
    "cm1-gn-arrondir": checkRound,
    "cm1-gn-glisser": checkSort,
    "cm1-gn-suite": checkSuite,
    "cm1-gn-lettres": checkWords,
    "cm1-gn-ecrire": checkWrite,
  },
  topicKinds: TOPIC_KINDS,
  caps: [{ prefix: "cm1-gn-", max: CAP }],
});

describe("l'écriture des nombres en lettres jusqu'à 9 999 999", () => {
  it("écrit les cas difficiles comme à l'école : un s à cent et à vingt seulement en fin de nombre, mille sans s, million avec s au pluriel", () => {
    for (const [n, text] of TRICKY_WORDS) {
      expect(words(n), `table de ${n}`).toBe(text);
      expect(wordsOfCm1(n), `wordsOfCm1(${n})`).toBe(text);
    }
  });

  it("écrit chaque nombre comme la table du test, et ne donne jamais deux fois le même mot", () => {
    const seen = new Set<string>();
    const check = (n: number) => {
      const text = wordsOfCm1(n);
      if (text !== words(n)) expect(text, String(n)).toBe(words(n));
    };
    for (let n = 1; n <= 1100000; n++) {
      check(n);
      if (n <= 1000000) seen.add(wordsOfCm1(n));
    }
    for (let n = 1100000; n <= CAP; n += 13) check(n);
    expect(seen.size).toBe(1000000);
    // Les extrémités de chaque millier, que le pas ne visite pas toujours.
    for (const n of [CAP, 5000000, 8999999, 9000000, 9000001, 9080000, 9280000]) check(n);
  });

  it("écrit 4 567 890 avec ses espaces et ses mots, comme à l'école", () => {
    expect(fmt(4567890)).toBe("4 567 890");
    expect(wordsOfCm1(4567890)).toBe("quatre millions cinq cent soixante-sept mille huit cent quatre-vingt-dix");
  });
});

describe("les vérifications des grands nombres voient un énoncé abîmé", () => {
  const qcm = (prompt: string, options: string[], correctIndex: number, level: number) =>
    ({ type: "qcm", prompt, answerKey: options[correctIndex], hints: [], payload: { options, correctIndex, game: { kind: "x", level } } }) as Exo;
  const written = (prompt: string, answer: string, level: number) =>
    ({ type: "short-answer", prompt, answerKey: answer, hints: [], payload: { acceptedAnswers: [answer], game: { kind: "x", level } } }) as Exo;

  it("l'arrondi : 45 650 à la centaine monte à 45 700, pas à 45 600", () => {
    expect(checkRound(qcm("Arrondis 45 678 à la centaine près. Quel nombre obtiens-tu ?", ["45 700", "45 600", "46 000"], 0, 1))).toBeNull();
    expect(checkRound(qcm("Arrondis 45 678 à la centaine près. Quel nombre obtiens-tu ?", ["45 700", "45 600", "46 000"], 1, 1))).not.toBeNull();
    expect(checkRound(qcm("Arrondis 45 618 à la centaine près. Quel nombre obtiens-tu ?", ["45 600", "45 700", "46 000"], 1, 1))).not.toBeNull();
  });

  it("la lecture : « quatre-vingts mille » et « deux cents mille » sont refusés, « quatre-vingt mille » et « deux cent mille » acceptés", () => {
    expect(checkWords(qcm("Quel nombre s'écrit « quatre-vingt mille » ?", ["80 000", "81 000", "90 000"], 0, 1))).toBeNull();
    expect(checkWords(qcm("Quel nombre s'écrit « quatre-vingts mille » ?", ["80 000", "81 000", "90 000"], 0, 1))).not.toBeNull();
    expect(checkWords(qcm("Quel nombre s'écrit « deux cent mille » ?", ["200 000", "201 000", "210 000"], 0, 2))).toBeNull();
    expect(checkWords(qcm("Quel nombre s'écrit « deux cents mille » ?", ["200 000", "201 000", "210 000"], 0, 2))).not.toBeNull();
    expect(checkWrite(written("Écris en chiffres le nombre « deux millions quatre-vingts mille ».", "2080000", 3))).not.toBeNull();
  });

  it("le nombre d'un rang : 456 centaines n'est pas le chiffre des centaines", () => {
    expect(checkDigits(qcm("Dans 456 789, combien y a-t-il de milliers en tout ?", ["456", "6", "45"], 0, 2))).toBeNull();
    expect(checkDigits(qcm("Dans 456 789, combien y a-t-il de milliers en tout ?", ["456", "6", "45"], 1, 2))).not.toBeNull();
  });

  it("le voisin : une retenue oubliée est refusée", () => {
    expect(checkNeighbour(qcm("Quel nombre vient juste après 199 999 ?", ["200 000", "199 000", "190 000"], 0, 2))).toBeNull();
    expect(checkNeighbour(qcm("Quel nombre vient juste après 199 999 ?", ["200 000", "199 000", "190 000"], 1, 2))).not.toBeNull();
    expect(checkNeighbour(qcm("Quel nombre obtiens-tu en ajoutant 1 000 à 459 800 ?", ["460 800", "459 900", "469 800"], 0, 2))).toBeNull();
    expect(checkNeighbour(qcm("Quel nombre obtiens-tu en ajoutant 1 000 à 459 800 ?", ["460 800", "459 900", "469 800"], 1, 2))).not.toBeNull();
  });
});
