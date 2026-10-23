import { describe, expect, it, vi } from "vitest";
import { auditExercise } from "../paliers/exerciseAudit";
import { GAME_KINDS, generateGames, type GameKind } from "../paliers/games";
import { makeContext, type GameLevel } from "../paliers/games/shared";
import { wordsOfCe2 } from "../paliers/games/nombresCe2";
import { topicUsesModel } from "../paliers/pregen";
import { allProgrammeEntries } from "../programme";
import { PALIER_SIZE } from "../paliers/scoring";

// Ces tests jouent des milliers de tirages : sur le serveur de CI, chargé, l'un d'eux dépasse les 5 secondes par défaut.
vi.setConfig({ testTimeout: 60_000 });

/**
 * LES MATHÉMATIQUES DU CE2, PREMIÈRE MOITIÉ : les nombres jusqu'à 100 000, la multiplication, la division.
 *
 * Chaque test RECALCULE la bonne réponse avec sa propre arithmétique et ses propres règles, écrites à part : le mot de chaque nombre de 0 à 100 000 (un autre
 * algorithme que `wordsOfCe2`), les retenues colonne par colonne, les tables, la division euclidienne, la classe de difficulté de chaque palier. Un gabarit dont
 * la réponse contredit sa règle, ou qui sort de la plage de sa fiche, échoue. À la fin, des MUTATIONS : on abîme la bonne réponse d'un exercice juste, et
 * chaque vérification doit le voir.
 */

const LEVELS: GameLevel[] = [1, 2, 3, 4];
const draws = LEVELS.flatMap((level) => Array.from({ length: 60 }, (_, n) => ({ level, seed: `ce2m1:${level}:${n}` })));
const make = (kind: GameKind, d: { level: GameLevel; seed: string }) => GAME_KINDS[kind].make(makeContext("CE2", d.level, `${kind}:${d.seed}`));

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
const levelOf = (exo: Exo) => (exo.payload.game as { level: GameLevel }).level;

const apostrophes = (text: string) => (text.match(/'/g) ?? []).length;
const wordCount = (text: string) => text.split(/\s+/).filter((token) => /[\p{L}\p{N}]/u.test(token)).length;
const same = (a: readonly string[], b: readonly string[]) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());

type Check = (exo: Exo) => string | null;
const ok = (condition: boolean, message: string) => (condition ? null : message);
const all = (...results: (string | null)[]) => results.find((result) => result !== null) ?? null;

/** Un nombre écrit à l'école : les milliers séparés par une espace. */
const fmt = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
/** Le nombre d'un texte : « 12 345 » vaut 12345. */
const num = (text: string) => Number(text.replace(/ /g, ""));
const NUMBER = String.raw`\d+(?: \d{3})*`;

// ===========================================================================
// LES NOMBRES EN LETTRES, ÉCRITS À PART
// ===========================================================================

const UNDER_TWENTY = ["zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"];
const TENS = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante"];

/** Un nombre sous cent. `final` : rien ne suit, donc « quatre-vingts » prend son s. */
function underHundred(n: number, final: boolean): string {
  if (n < 20) return UNDER_TWENTY[n];
  const tens = Math.floor(n / 10);
  const units = n % 10;
  if (tens <= 6) return units === 0 ? TENS[tens] : units === 1 ? `${TENS[tens]} et un` : `${TENS[tens]}-${UNDER_TWENTY[units]}`;
  if (tens === 7) return units === 1 ? "soixante et onze" : `soixante-${UNDER_TWENTY[10 + units]}`;
  if (tens === 8) return units === 0 ? (final ? "quatre-vingts" : "quatre-vingt") : `quatre-vingt-${UNDER_TWENTY[units]}`;
  return `quatre-vingt-${UNDER_TWENTY[10 + units]}`;
}

/** Un nombre sous mille. « cent » prend un s après un nombre de centaines, quand rien ne suit. */
function underThousand(n: number, final: boolean): string {
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  if (hundreds === 0) return underHundred(rest, final);
  const head = hundreds === 1 ? "cent" : `${UNDER_TWENTY[hundreds]} cent${rest === 0 && final ? "s" : ""}`;
  return rest === 0 ? head : `${head} ${underHundred(rest, final)}`;
}

/** Un nombre de 0 à 100 000 en lettres : « mille » ne prend jamais de s, « quatre-vingt » et « cent » n'en prennent pas devant « mille ». */
function words(n: number): string {
  if (n === 0) return "zéro";
  const thousands = Math.floor(n / 1000);
  const rest = n % 1000;
  const head = thousands === 0 ? "" : thousands === 1 ? "mille" : `${underThousand(thousands, false)} mille`;
  if (rest === 0) return head;
  return head === "" ? underThousand(rest, true) : `${head} ${underThousand(rest, true)}`;
}

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
  [200, "deux cents"],
  [20200, "vingt mille deux cents"],
  [12345, "douze mille trois cent quarante-cinq"],
  [45678, "quarante-cinq mille six cent soixante-dix-huit"],
  [60060, "soixante mille soixante"],
  [3080, "trois mille quatre-vingts"],
  [3081, "trois mille quatre-vingt-un"],
];

// ===========================================================================
// LES NOMBRES JUSQU'À 100 000
// ===========================================================================

const LO: Record<GameLevel, number> = { 1: 1000, 2: 1000, 3: 10000, 4: 10000 };
const TOP: Record<GameLevel, number> = { 1: 20000, 2: 40000, 3: 70000, 4: 100000 };
const inRange = (n: number, level: GameLevel, max = 100000) => n >= LO[level] && n <= Math.min(TOP[level], max);

const RANKS = ["unités", "dizaines", "centaines", "milliers", "dizaines de mille"];

const checkNbNeighbour: Check = (exo) => {
  const m = new RegExp(`^Quel nombre vient juste (après|avant) (${NUMBER}) \\?$`).exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const n = num(m[2]);
  const expected = m[1] === "après" ? n + 1 : n - 1;
  const level = levelOf(exo);
  return all(
    ok(num(rightOption(exo)) === expected, `${exo.prompt} : ${rightOption(exo)}, pas ${expected}`),
    ok(wrongOf(exo).every((option) => /^[\d ]+$/.test(option) && num(option) <= 100000 && num(option) >= LO[level] - 1), `un choix hors de la plage : ${optionsOf(exo).join(", ")}`),
    ok(n >= LO[level] - 1 && n <= TOP[level], `${n} hors de la plage du palier ${level}`),
    ok(expected <= TOP[level] && expected >= LO[level] - 1, `la réponse ${expected} hors de la plage du palier ${level}`),
  );
};

const checkNbCompare: Check = (exo) => {
  const m = /^Quel est le (plus grand|plus petit) de ces nombres \?$/.exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const values = optionsOf(exo).map(num);
  const expected = m[1] === "plus grand" ? Math.max(...values) : Math.min(...values);
  const level = levelOf(exo);
  return all(
    ok(new Set(values).size === 3, "trois nombres différents"),
    ok(num(rightOption(exo)) === expected, `${exo.prompt} ${optionsOf(exo).join(", ")} : ${rightOption(exo)}`),
    ok(values.every((value) => inRange(value, level)), `un nombre hors de la plage du palier ${level}`),
    ok(level === 1 || new Set(values.map((value) => Math.floor(value / 1000))).size < 3, "deux nombres du même millier dès le deuxième palier"),
  );
};

const checkNbOrder: Check = (exo) => {
  const ascending = /du plus petit au plus grand/.test(exo.prompt);
  const descending = /du plus grand au plus petit/.test(exo.prompt);
  if (ascending === descending) return `énoncé inconnu : ${exo.prompt}`;
  const values = sequenceOf(exo).map(num);
  const sorted = [...values].sort((a, b) => (ascending ? a - b : b - a));
  const level = levelOf(exo);
  return all(
    ok(values.length === 4 && new Set(values).size === 4, "quatre nombres différents"),
    ok(JSON.stringify(values) === JSON.stringify(sorted), `${exo.prompt} ${sequenceOf(exo).join(" / ")}`),
    ok(values.every((value) => inRange(value, level)), "un nombre hors de la plage du palier"),
    ok(level < 3 ? ascending : true, "du plus petit au plus grand avant le troisième palier"),
  );
};

const checkNbDigits: Check = (exo) => {
  let m = new RegExp(`^Quel est le chiffre des (unités|dizaines|centaines|milliers|dizaines de mille) de (${NUMBER}) \\?$`).exec(exo.prompt);
  const level = levelOf(exo);
  if (m) {
    const n = num(m[2]);
    const digit = Math.floor(n / 10 ** RANKS.indexOf(m[1])) % 10;
    return all(
      ok(rightOption(exo) === String(digit), `${exo.prompt} : ${rightOption(exo)}, pas ${digit}`),
      ok(inRange(n, level, 99999) && n >= 10000 && !String(n).includes("0") && new Set(String(n)).size === 5, `${n} n'a pas cinq chiffres différents sans zéro dans la plage du palier ${level}`),
      ok(wrongOf(exo).every((option) => /^\d$/.test(option)), "des chiffres pour mauvais choix"),
    );
  }
  m = new RegExp(`^Dans (${NUMBER}), quelle est la valeur du chiffre (\\d) \\?$`).exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const n = num(m[1]);
  const digit = Number(m[2]);
  const rank = String(n).length - 1 - String(n).indexOf(String(digit));
  return all(
    ok(String(n).split(String(digit)).length === 2, `le chiffre ${digit} n'est pas seul dans ${n}`),
    ok(num(rightOption(exo)) === digit * 10 ** rank, `${exo.prompt} : ${rightOption(exo)}, pas ${digit * 10 ** rank}`),
    ok(level >= 2, "la valeur d'un chiffre avant le deuxième palier"),
    ok(inRange(n, level, 99999) && n >= 10000, `${n} hors de la plage du palier ${level}`),
  );
};

/** La valeur d'une somme écrite « 40 000 + 5 000 + 600 + 70 + 8 » ou « 4 × 10 000 + 5 × 1 000 + … + 8 ». */
function evaluate(expression: string): number | null {
  const terms = expression.split(" + ");
  let total = 0;
  for (const term of terms) {
    const product = new RegExp(`^(\\d) × (${NUMBER})$`).exec(term);
    if (product) total += Number(product[1]) * num(product[2]);
    else if (new RegExp(`^${NUMBER}$`).test(term)) total += num(term);
    else return null;
  }
  return total;
}

const checkNbDecompose: Check = (exo) => {
  const text = textOf(exo);
  const level = levelOf(exo);
  const answer = blankOf(exo).answer;
  const FORMS_OK: Record<GameLevel, number[]> = { 1: [1, 3], 2: [0, 1, 3], 3: [0, 2, 3], 4: [0, 1, 2, 3] };
  let form: number;
  let n: number;
  let m: RegExpExecArray | null;
  if ((m = new RegExp(`^(${NUMBER}) = (.+)$`).exec(text)) && m[2].includes("___")) {
    // Une partie manque : la somme des autres, plus la bonne réponse, vaut le nombre.
    form = 0;
    n = num(m[1]);
    const parts = m[2].split(" + ");
    if (parts.filter((part) => part === "___").length !== 1 || parts.length !== 5) return `forme inconnue : ${text}`;
    const known = parts.filter((part) => part !== "___").reduce((sum, part) => sum + num(part), 0);
    if (num(answer) !== n - known) return `${text} : ${answer}, pas ${n - known}`;
  } else if ((m = /^(.+), c'est le nombre ___\.$/.exec(text))) {
    form = 1;
    const said = m[1].split(/, | et /).map((part) => /^(\d) (unités?|dizaines?|centaines?|milliers?|dizaines? de mille)$/.exec(part));
    if (said.length !== 5 || said.some((part) => !part)) return `forme inconnue : ${text}`;
    n = said.reduce((sum, part) => {
      const rank = RANKS.findIndex((name) => name === part![2] || name.replace(/s\b/, "") === part![2] || name.replace("dizaines de mille", "dizaine de mille") === part![2]);
      return sum + Number(part![1]) * 10 ** (rank === -1 ? (part![2] === "millier" ? 3 : 0) : rank);
    }, 0);
    if (num(answer) !== n) return `${text} : ${answer}, pas ${n}`;
  } else if ((m = /^(.+) = ___$/.exec(text))) {
    form = m[1].includes("×") ? 2 : 3;
    const value = evaluate(m[1]);
    if (value === null) return `somme illisible : ${text}`;
    n = value;
    if (num(answer) !== n) return `${text} : ${answer}, pas ${n}`;
  } else return `forme inconnue : ${text}`;
  return all(
    ok(FORMS_OK[level].includes(form), `la forme ${form} n'est pas celle du palier ${level}`),
    ok(inRange(n, level, 99999) && n >= 10000 && !String(n).includes("0") && new Set(String(n)).size === 5, `${n} hors de la plage ou chiffres répétés`),
  );
};

const checkNbBracket: Check = (exo) => {
  const m = new RegExp(`^Entre (quelles centaines|quels milliers|quelles dizaines de mille) se trouve (${NUMBER}) \\?$`).exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const n = num(m[2]);
  const unit = m[1] === "quelles centaines" ? 100 : m[1] === "quels milliers" ? 1000 : 10000;
  const low = Math.floor(n / unit) * unit;
  const level = levelOf(exo);
  const units: Record<GameLevel, number[]> = { 1: [1000], 2: [1000], 3: [10000], 4: [100, 1000, 10000] };
  const bounds = (option: string) => /^([\d ]+) et ([\d ]+)$/.exec(option);
  return all(
    ok(rightOption(exo) === `${fmt(low)} et ${fmt(low + unit)}`, `${exo.prompt} : ${rightOption(exo)}, pas ${fmt(low)} et ${fmt(low + unit)}`),
    ok(n % unit !== 0, `${n} est un multiple de ${unit}`),
    ok(units[level].includes(unit), `l'unité ${unit} au palier ${level}`),
    ok(inRange(n, level, 99999), `${n} hors de la plage du palier ${level}`),
    ok(wrongOf(exo).every((option) => { const b = bounds(option); return !!b && num(b[2]) - num(b[1]) === unit && num(b[2]) <= 100000; }), `des bornes inattendues : ${optionsOf(exo).join(" | ")}`),
  );
};

const checkNbSort: Check = (exo) => {
  const level = levelOf(exo);
  const zones = zonesOf(exo);
  const m = [/^Moins de ([\d ]+)$/.exec(zones[0]), /^Plus de ([\d ]+)$/.exec(zones[1])];
  if (!m[0] || !m[1] || m[0][1] !== m[1][1]) return `cases inattendues : ${zones.join(" | ")}`;
  const threshold = num(m[0][1]);
  const each = level === 1 ? 2 : 3;
  const below = itemsOf(exo).filter((item) => item.correctZone === zones[0]);
  const above = itemsOf(exo).filter((item) => item.correctZone === zones[1]);
  return all(
    ok(threshold % 10000 === 0 && threshold > LO[level] && threshold < TOP[level], `le seuil ${threshold}`),
    ok(below.length === each && above.length === each, "autant de nombres dans chaque case"),
    ...itemsOf(exo).map((item) => ok(num(item.text) < threshold === (item.correctZone === zones[0]) && num(item.text) !== threshold && inRange(num(item.text), level), `${item.text} dans « ${item.correctZone} »`)),
  );
};

const STEPS: Record<GameLevel, number[]> = { 1: [1000], 2: [1000, 5000], 3: [2000, 5000, 10000], 4: [250, 500, 2500, 5000, 20000] };

const checkNbSuite: Check = (exo) => {
  const terms = textOf(exo).split(", ");
  const level = levelOf(exo);
  if (terms.length !== 5 || terms.filter((term) => term === "___").length !== 1) return `suite inattendue : ${textOf(exo)}`;
  const blank = terms.indexOf("___");
  const known = terms.map((term, i) => (i === blank ? null : num(term)));
  // Le pas se lit entre deux termes voisins connus.
  let step: number | null = null;
  for (let i = 0; i + 1 < known.length; i++) if (known[i] !== null && known[i + 1] !== null) { step = known[i + 1]! - known[i]!; break; }
  if (step === null) return "aucun pas lisible";
  const values = known.map((value, i) => value ?? known[(blank === 0 ? 1 : blank - 1)]! + step! * (i - (blank === 0 ? 1 : blank - 1)));
  const descending = step < 0;
  return all(
    ok(values.every((value, i) => i === 0 || value - values[i - 1] === step), `pas irrégulier : ${textOf(exo)}`),
    ok(blankOf(exo).answer === fmt(values[blank]), `${textOf(exo)} : ${blankOf(exo).answer}, pas ${values[blank]}`),
    ok(STEPS[level].includes(Math.abs(step)), `le pas ${Math.abs(step)} au palier ${level}`),
    ok(/Elle descend/.test(exo.prompt) === descending && /Elle avance/.test(exo.prompt) === !descending, "le sens de la suite dit dans l'énoncé"),
    ok(values.every((value) => value >= 0 && value <= 100000) && values.every((value) => value % Math.abs(step!) === 0), "des termes hors de la plage ou qui ne sont pas des multiples du pas"),
    ok(level < 3 ? blank === 4 : blank >= 1 && blank <= 3, `la place du trou au palier ${level}`),
    ok(!descending || level >= 2, "une suite qui descend au premier palier"),
  );
};

const checkNbWords: Check = (exo) => {
  const m = /^Quel nombre s'écrit « (.+) » \?$/.exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const n = num(rightOption(exo));
  return all(
    ok(words(n) === m[1], `${n} s'écrit « ${words(n)} », pas « ${m[1]} »`),
    ok(inRange(n, levelOf(exo), 99999), `${n} hors de la plage du palier`),
    ok(wrongOf(exo).every((option) => words(num(option)) !== m[1]), "un mauvais choix qui s'écrit pareil"),
  );
};

const checkNbWrite: Check = (exo) => {
  const m = /^Écris en chiffres le nombre « (.+) »\.$/.exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const n = Number(acceptedOf(exo)[0]);
  return all(
    ok(acceptedOf(exo).length === 1 && words(n) === m[1], `${n} s'écrit « ${words(n)} », pas « ${m[1]} »`),
    ok(exo.answerKey === String(n), "la clé de réponse"),
    ok(inRange(n, levelOf(exo), 99999), `${n} hors de la plage du palier`),
  );
};

// ===========================================================================
// LA MULTIPLICATION
// ===========================================================================

const TABLES: Record<GameLevel, number[]> = { 1: [2, 3, 4, 5], 2: [6, 7], 3: [8, 9], 4: [2, 3, 4, 5, 6, 7, 8, 9] };

const checkMultTable: Check = (exo) => {
  const m = /^Combien font (\d+) × (\d+) \?$/.exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const [a, b] = [Number(m[1]), Number(m[2])];
  const level = levelOf(exo);
  const [table, factor] = level === 4 ? [b, a] : [a, b];
  return all(
    ok(rightOption(exo) === String(a * b), `${exo.prompt} : ${rightOption(exo)}, pas ${a * b}`),
    ok(TABLES[level].includes(table) && factor >= 2 && factor <= 10, `${a} × ${b} hors des tables du palier ${level}`),
    ok(wrongOf(exo).every((option) => /^\d+$/.test(option) && Number(option) <= 100), "un choix inattendu"),
  );
};

const checkMultGap: Check = (exo) => {
  const m = /^(\d+|___) × (\d+|___) = (\d+)$/.exec(textOf(exo));
  if (!m) return `phrase inconnue : ${textOf(exo)}`;
  const level = levelOf(exo);
  const known = Number(m[1] === "___" ? m[2] : m[1]);
  const total = Number(m[3]);
  return all(
    ok(m[1] === "___" ? level === 4 : level !== 4, `le trou à gauche au palier ${level}`),
    ok(Number(blankOf(exo).answer) * known === total, `${textOf(exo)} : ${blankOf(exo).answer}`),
    ok(TABLES[level].includes(known) && Number(blankOf(exo).answer) >= 2 && Number(blankOf(exo).answer) <= 10, "hors des tables du palier"),
  );
};

/** Les retenues d'une multiplication par un chiffre, colonne par colonne. */
function columnCarries(n: number, m: number): number[] {
  const out: number[] = [];
  let carry = 0;
  for (const digit of String(n).split("").reverse().map(Number)) {
    const column = digit * m + carry;
    carry = (column - (column % 10)) / 10;
    out.push(carry);
  }
  return out;
}

function checkPosedRules(n: number, m: number, level: GameLevel): string | null {
  if (level === 4) return all(ok(n >= 12 && n <= 49 && m >= 12 && m <= 29 && n !== m, `${n} × ${m} hors de la plage`), ok(![...String(n), ...String(m)].includes("0"), "un zéro dans les facteurs"));
  const carries = columnCarries(n, m);
  return all(
    ok(![...String(n)].includes("0"), `un zéro dans ${n}`),
    ok(level === 3 ? n >= 111 && n <= 499 && m >= 3 && m <= 9 && n * m <= 3000 : n >= 11 && n <= 49, `${n} × ${m} hors de la plage du palier ${level}`),
    ok(level === 1 ? m >= 2 && m <= 4 && carries.every((carry) => carry === 0) : true, "une retenue au premier palier"),
    ok(level === 2 ? m >= 3 && m <= 9 && carries[0] > 0 && carries.slice(1).every((carry) => carry === 0) : true, "le deuxième palier n'a que la retenue des unités"),
    ok(level === 3 ? carries.some((carry) => carry > 0) : true, "une multiplication à trois chiffres sans retenue"),
  );
}

const checkMultPosed: Check = (exo) => {
  const m = /^Combien font (\d+) × (\d+) \?$/.exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const [n, k] = [Number(m[1]), Number(m[2])];
  const level = levelOf(exo);
  return all(
    ok(num(rightOption(exo)) === n * k, `${exo.prompt} : ${rightOption(exo)}, pas ${n * k}`),
    checkPosedRules(n, k, level),
    ok(wrongOf(exo).every((option) => /^[\d ]+$/.test(option) && num(option) !== n * k && num(option) >= 10), `un mauvais choix inattendu : ${optionsOf(exo).join(", ")}`),
  );
};

const checkMultWrite: Check = (exo) => {
  const level = levelOf(exo);
  let m = /^Pose et calcule (\d+) × (\d+)\. Écris le résultat\.$/.exec(exo.prompt);
  if (m) {
    const [n, k] = [Number(m[1]), Number(m[2])];
    return all(
      ok(level >= 3, "une multiplication posée avant le troisième palier"),
      checkPosedRules(n, k, level),
      ok(acceptedOf(exo).length === 1 && Number(acceptedOf(exo)[0]) === n * k, `${exo.prompt} : ${acceptedOf(exo)}, pas ${n * k}`),
    );
  }
  m = /^Écris le résultat de (\d+) × (\d+)\.$/.exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const [a, b] = [Number(m[1]), Number(m[2])];
  const [table, factor] = level === 4 ? [b, a] : [a, b];
  return all(
    ok(level <= 2, "une table à écrire au troisième palier"),
    ok(TABLES[level].includes(table) && factor >= 2 && factor <= 10, "hors des tables du palier"),
    ok(acceptedOf(exo).length === 1 && Number(acceptedOf(exo)[0]) === a * b, `${exo.prompt} : ${acceptedOf(exo)}, pas ${a * b}`),
  );
};

const checkMultTen: Check = (exo) => {
  const level = levelOf(exo);
  let m = new RegExp(`^Combien font (${NUMBER}) × (10|100) \\?$`).exec(exo.prompt);
  if (m) {
    const [n, times] = [num(m[1]), Number(m[2])];
    return all(
      ok(num(rightOption(exo)) === n * times, `${exo.prompt} : ${rightOption(exo)}, pas ${n * times}`),
      ok(level === 1 ? times === 10 && n >= 2 && n <= 99 : level === 2 ? times === 100 && n >= 2 && n <= 99 : level === 3 && n >= 11 && n <= 999, `${n} × ${times} au palier ${level}`),
    );
  }
  m = new RegExp(`^Quel nombre multiplié par (10|100) donne (${NUMBER}) \\?$`).exec(exo.prompt);
  if (m) {
    const [times, product] = [Number(m[1]), num(m[2])];
    return all(
      ok(level === 3, "la forme à l'envers n'est que du troisième palier"),
      ok(num(rightOption(exo)) * times === product, `${exo.prompt} : ${rightOption(exo)}`),
    );
  }
  m = /^Combien font (\d+) × (\d+) \?$/.exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const [a, b] = [Number(m[1]), Number(m[2])];
  return all(
    ok(level === 4 && a % 10 === 0 && b % 10 === 0 && a >= 20 && a <= 90 && b >= 20 && b <= 90, `${a} × ${b} au palier ${level}`),
    ok(num(rightOption(exo)) === a * b, `${exo.prompt} : ${rightOption(exo)}, pas ${a * b}`),
  );
};

const MENTAL_TOP: Record<GameLevel, number> = { 1: 100, 2: 200, 3: 500, 4: 1000 };

const checkMultMental: Check = (exo) => {
  const level = levelOf(exo);
  const top = MENTAL_TOP[level];
  let m = new RegExp(`^Quel est le double de (${NUMBER}) \\?$`).exec(exo.prompt);
  if (m) {
    const n = num(m[1]);
    return all(ok(num(rightOption(exo)) === 2 * n, `${exo.prompt} : ${rightOption(exo)}`), ok(n >= 6 && n <= top, `${n} hors de la plage du palier ${level}`));
  }
  m = new RegExp(`^Quelle est la moitié de (${NUMBER}) \\?$`).exec(exo.prompt);
  if (m) {
    const n = num(m[1]);
    return all(ok(n % 2 === 0, `la moitié de ${n}, qui est impair`), ok(num(rightOption(exo)) === n / 2, `${exo.prompt} : ${rightOption(exo)}`), ok(n >= 6 && n <= top, `${n} hors de la plage du palier ${level}`));
  }
  m = new RegExp(`^Quel est le triple de (${NUMBER}) \\?$`).exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const n = num(m[1]);
  return all(ok(level >= 2, "un triple au premier palier"), ok(num(rightOption(exo)) === 3 * n, `${exo.prompt} : ${rightOption(exo)}`), ok(n >= 6 && n <= Math.floor(top / 2), `${n} hors de la plage du palier ${level}`));
};

const checkMultDecompose: Check = (exo) => {
  const text = textOf(exo);
  const level = levelOf(exo);
  let m = /^(\d+) × (\d+) = (\d+) × (\d+) \+ \d+ × ___$/.exec(text);
  if (m) {
    const [t, n, t2, tens] = [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4])];
    return all(
      ok(t === t2 && tens % 10 === 0 && n - tens >= 2 && n - tens <= 9 && Number(blankOf(exo).answer) === n - tens, `${text} : ${blankOf(exo).answer}`),
      ok(TABLES[level].includes(t) && tens >= 10 && tens <= (level === 1 ? 30 : 90), `hors de la plage du palier ${level}`),
    );
  }
  m = new RegExp(`^(\\d+) × (\\d+) = (${NUMBER}) \\+ ___$`).exec(text);
  if (!m) return `phrase inconnue : ${text}`;
  const [t, n, partial] = [Number(m[1]), Number(m[2]), num(m[3])];
  const tens = Math.floor(n / 10) * 10;
  return all(
    ok(partial === t * tens && num(blankOf(exo).answer) === t * (n % 10), `${text} : ${blankOf(exo).answer}`),
    ok(level >= 3 && TABLES[level].includes(t), "cette forme n'est que des deux derniers paliers"),
  );
};

const checkMultLinks: Check = (exo) => {
  const level = levelOf(exo);
  const pairs = pairsOf(exo);
  return all(
    ok(pairs.length === (level >= 3 ? 4 : 3), `${pairs.length} paires au palier ${level}`),
    ...pairs.map((pair) => {
      const m = /^(\d+) × (\d+)$/.exec(pair.left);
      if (!m) return `paire inconnue : ${pair.left}`;
      const [a, b] = [Number(m[1]), Number(m[2])];
      const [table, factor] = level === 4 ? [b, a] : [a, b];
      return all(ok(num(pair.right) === a * b, `${pair.left} ~ ${pair.right}`), ok(TABLES[level].includes(table) && factor >= 2 && factor <= 10, "hors des tables du palier"));
    }),
  );
};

const SORT_TABLES: Record<GameLevel, [number, number]> = { 1: [3, 5], 2: [6, 7], 3: [8, 9], 4: [4, 7] };

const checkMultSort: Check = (exo) => {
  const level = levelOf(exo);
  const [a, b] = SORT_TABLES[level];
  const each = level === 1 ? 2 : 3;
  const inTable = (n: number, table: number) => n % table === 0 && n / table >= 2 && n / table <= 10;
  return all(
    ok(same(zonesOf(exo), [`Table de ${a}`, `Table de ${b}`]), `cases inattendues : ${zonesOf(exo).join(", ")}`),
    ...itemsOf(exo).map((item) => {
      const n = Number(item.text);
      const zoneTable = Number(item.correctZone.replace("Table de ", ""));
      const other = zoneTable === a ? b : a;
      return ok(inTable(n, zoneTable) && n % other !== 0, `${n} dans la ${item.correctZone}`);
    }),
    ok(itemsOf(exo).filter((item) => item.correctZone === `Table de ${a}`).length === each && itemsOf(exo).length === 2 * each, `${each} nombres par table`),
  );
};

const GIRLS = ["Awa", "Fatou", "Mariama", "Aïssatou", "Penda", "Khady", "Sokhna", "Coumba", "Ndèye", "Rama"];

const checkMultProblem: Check = (exo) => {
  const level = levelOf(exo);
  let m = /^Il y a (\d) (paniers|sacs|boîtes|rangées|assiettes) de (\d+) (bonbons|billes|crayons|cahiers|mangues)\. Combien y a-t-il de (\S+) en tout \?$/.exec(exo.prompt);
  if (m) {
    const [count, size] = [Number(m[1]), Number(m[3])];
    return all(
      ok(m[4] === m[5], "la chose du contenu et celle de la question"),
      ok(rightOption(exo) === String(count * size), `${exo.prompt} : ${rightOption(exo)}, pas ${count * size}`),
      ok(TABLES[level].includes(size) && count >= 2 && count <= 9, `${count} contenants de ${size} au palier ${level}`),
      ok(level !== 3, "les problèmes d'objets ne sont pas posés au troisième palier"),
    );
  }
  m = new RegExp(`^(\\S+) achète (\\d) (\\S+)\\. Chaque (\\S+) coûte (${NUMBER}) FCFA\\. Combien a-t-(il|elle) payé en tout \\?$`).exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const [count, price] = [Number(m[2]), num(m[5])];
  return all(
    ok(rightOption(exo) === `${fmt(count * price)} FCFA`, `${exo.prompt} : ${rightOption(exo)}, pas ${count * price}`),
    ok(price % 25 === 0 && price >= 100 && count >= 2 && count <= 9 && count * price <= 5000, `${count} achats à ${price} FCFA hors de la plage`),
    ok(m[3] === `${m[4]}s`, `un pluriel qui ne correspond pas à « ${m[4]} »`),
    ok((m[6] === "elle") === GIRLS.includes(m[1]), `« ${m[1]} » avec « ${m[6]} »`),
    ok(level >= 3, "l'argent n'est pas posé avant le troisième palier"),
  );
};

// ===========================================================================
// LA DIVISION
// ===========================================================================

type Plan = { divisors: number[]; quotient: [number, number] };
const PLAN: Record<GameLevel, Plan> = {
  1: { divisors: [2, 3, 4, 5], quotient: [2, 10] },
  2: { divisors: [2, 3, 4, 5, 6, 7, 8, 9], quotient: [2, 9] },
  3: { divisors: [2, 3, 4, 5, 6, 7, 8, 9], quotient: [10, 30] },
  4: { divisors: [3, 4, 5, 6, 7, 8, 9], quotient: [20, 150] },
};

/** Une division est dans la plage de son palier : diviseur, quotient, reste plus petit que le diviseur. */
function planRules(n: number, d: number, level: GameLevel): string | null {
  const q = Math.floor(n / d);
  return all(
    ok(PLAN[level].divisors.includes(d), `le diviseur ${d} au palier ${level}`),
    ok(q >= PLAN[level].quotient[0] && q <= PLAN[level].quotient[1], `le quotient ${q} hors de la plage du palier ${level}`),
  );
}

/** Le résultat d'une division comme à l'école : « 15 reste 2 », ou « 12 » quand elle tombe juste. */
const canonical = (n: number, d: number) => (n % d === 0 ? fmt(Math.floor(n / d)) : `${fmt(Math.floor(n / d))} reste ${n % d}`);

/** Une écriture « a reste b » ou « a » est une bonne écriture de la division quand d × a + b vaut n. */
function writesDivision(option: string, n: number, d: number): boolean {
  const m = new RegExp(`^(${NUMBER})(?: reste (${NUMBER}))?$`).exec(option);
  return !!m && d * num(m[1]) + (m[2] ? num(m[2]) : 0) === n;
}

const checkDivTable: Check = (exo) => {
  const m = new RegExp(`^Combien font (${NUMBER}) ÷ (\\d) \\?$`).exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const [n, d] = [num(m[1]), Number(m[2])];
  const level = levelOf(exo);
  return all(
    ok(n % d === 0 && n / d >= 2 && n / d <= 10, `${n} ÷ ${d} n'est pas une table à l'envers`),
    ok(TABLES[level].includes(d), `la table de ${d} au palier ${level}`),
    ok(rightOption(exo) === String(n / d), `${exo.prompt} : ${rightOption(exo)}, pas ${n / d}`),
  );
};

const THINGS = "bonbons|billes|crayons|cahiers|mangues|pains";

const checkDivShare: Check = (exo) => {
  const m = new RegExp(`^(\\S+) partage (${NUMBER}) (${THINGS}) entre (\\d) amis( , sans en couper|, sans en couper)?\\. Combien de (${THINGS}) chacun reçoit-il \\?$`).exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const [n, d] = [num(m[2]), Number(m[4])];
  const level = levelOf(exo);
  return all(
    ok(m[3] === m[6], "la chose du partage et celle de la question"),
    ok(rightOption(exo) === fmt(Math.floor(n / d)), `${exo.prompt} : ${rightOption(exo)}, pas ${Math.floor(n / d)}`),
    ok((n % d !== 0) === !!m[5], "« sans en couper » si, et seulement si, il y a un reste"),
    ok(level > 1 || n % d === 0, "un reste au premier palier"),
    planRules(n, d, level),
  );
};

const checkDivGroup: Check = (exo) => {
  const m = new RegExp(`^(\\S+) range (${NUMBER}) (${THINGS}) par paquets de (\\d)\\. Combien de paquets pleins fait-(il|elle) \\?$`).exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const [n, d] = [num(m[2]), Number(m[4])];
  const level = levelOf(exo);
  return all(
    ok((m[5] === "elle") === GIRLS.includes(m[1]), `« ${m[1]} » avec « ${m[5]} »`),
    ok(rightOption(exo) === fmt(Math.floor(n / d)), `${exo.prompt} : ${rightOption(exo)}, pas ${Math.floor(n / d)}`),
    ok(level > 1 || n % d === 0, "un reste au premier palier"),
    planRules(n, d, level),
  );
};

const checkDivRest: Check = (exo) => {
  const m = new RegExp(`^Quel est le reste de (${NUMBER}) ÷ (\\d) \\?$`).exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const [n, d] = [num(m[1]), Number(m[2])];
  return all(
    ok(rightOption(exo) === String(n % d), `${exo.prompt} : ${rightOption(exo)}, pas ${n % d}`),
    ok(n % d > 0, "un reste nul"),
    planRules(n, d, levelOf(exo)),
  );
};

const checkDivPosed: Check = (exo) => {
  const m = new RegExp(`^Pose (${NUMBER}) ÷ (\\d)\\. Quel est le résultat \\?$`).exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const [n, d] = [num(m[1]), Number(m[2])];
  const level = levelOf(exo);
  const options = optionsOf(exo);
  return all(
    ok(rightOption(exo) === canonical(n, d), `${exo.prompt} : ${rightOption(exo)}, pas ${canonical(n, d)}`),
    // Un seul choix est vrai en chiffres : un mauvais choix qui serait aussi juste (« 4 reste 2 » pour 10 ÷ 2) serait une seconde bonne réponse.
    ok(options.filter((option) => writesDivision(option, n, d)).length === 1, `plusieurs choix valent ${n} ÷ ${d} : ${options.join(" | ")}`),
    ok(level > 1 || n % d === 0, "un reste au premier palier"),
    planRules(n, d, level),
  );
};

const checkDivGap: Check = (exo) => {
  const text = textOf(exo);
  const level = levelOf(exo);
  const answer = blankOf(exo).answer;
  let m = new RegExp(`^(${NUMBER}) ÷ (\\d) = ___$`).exec(text);
  if (m) {
    const [n, d] = [num(m[1]), Number(m[2])];
    return all(ok(n % d === 0 && num(answer) === n / d, `${text} : ${answer}`), ok(level <= 2, "cette forme n'est que des deux premiers paliers"), planRules(n, d, level));
  }
  m = new RegExp(`^(${NUMBER}) = (\\d) × (${NUMBER}) \\+ ___$`).exec(text);
  if (m) {
    const [n, d, q] = [num(m[1]), Number(m[2]), num(m[3])];
    return all(ok(d * q + num(answer) === n && num(answer) < d && num(answer) > 0, `${text} : ${answer}`), ok(level >= 2, "cette forme n'est que du deuxième palier au dernier"), planRules(n, d, level));
  }
  m = new RegExp(`^(${NUMBER}) = (\\d) × ___ \\+ (\\d+)$`).exec(text);
  if (!m) return `phrase inconnue : ${text}`;
  const [n, d, r] = [num(m[1]), Number(m[2]), Number(m[3])];
  return all(ok(d * num(answer) + r === n && r < d && r > 0, `${text} : ${answer}`), ok(level >= 3, "cette forme n'est que des deux derniers paliers"), planRules(n, d, level));
};

const checkDivWrite: Check = (exo) => {
  const level = levelOf(exo);
  let m = new RegExp(`^Écris le résultat de (${NUMBER}) ÷ (\\d)\\.$`).exec(exo.prompt);
  if (m) {
    const [n, d] = [num(m[1]), Number(m[2])];
    return all(ok(n % d === 0 && acceptedOf(exo).length === 1 && Number(acceptedOf(exo)[0]) === n / d, `${exo.prompt} : ${acceptedOf(exo)}`), ok(level <= 2, "une division exacte à écrire aux deux derniers paliers"), planRules(n, d, level));
  }
  m = new RegExp(`^Pose (${NUMBER}) ÷ (\\d)\\. Écris le (reste|quotient)\\.$`).exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const [n, d] = [num(m[1]), Number(m[2])];
  const expected = m[3] === "reste" ? n % d : Math.floor(n / d);
  return all(ok(n % d > 0, "un reste nul"), ok(acceptedOf(exo).length === 1 && Number(acceptedOf(exo)[0]) === expected, `${exo.prompt} : ${acceptedOf(exo)}, pas ${expected}`), planRules(n, d, level));
};

const checkDivLinks: Check = (exo) => {
  const level = levelOf(exo);
  const pairs = pairsOf(exo);
  return all(
    ok(pairs.length === 3, "trois paires"),
    ...pairs.map((pair) => {
      const m = new RegExp(`^(${NUMBER}) ÷ (\\d)$`).exec(pair.left);
      if (!m) return `paire inconnue : ${pair.left}`;
      const [n, d] = [num(m[1]), Number(m[2])];
      return all(ok(pair.right === canonical(n, d), `${pair.left} ~ ${pair.right}`), ok(level > 1 || n % d === 0, "un reste au premier palier"), planRules(n, d, level));
    }),
  );
};

const checkDivSort: Check = (exo) => {
  const level = levelOf(exo);
  const each = level === 1 ? 2 : 3;
  return all(
    ok(same(zonesOf(exo), ["Tombe juste", "Il reste quelque chose"]), `cases inattendues : ${zonesOf(exo).join(", ")}`),
    ...itemsOf(exo).map((item) => {
      const m = new RegExp(`^(${NUMBER}) ÷ (\\d)$`).exec(item.text);
      if (!m) return `étiquette inconnue : ${item.text}`;
      const [n, d] = [num(m[1]), Number(m[2])];
      return ok(item.correctZone === (n % d === 0 ? "Tombe juste" : "Il reste quelque chose"), `${item.text} dans « ${item.correctZone} »`);
    }),
    ok(itemsOf(exo).filter((item) => item.correctZone === "Tombe juste").length === each && itemsOf(exo).length === 2 * each, `${each} divisions par case`),
  );
};

const checkDivProblem: Check = (exo) => {
  const level = levelOf(exo);
  const forms: Record<GameLevel, string[]> = { 1: ["partage", "groupement"], 2: ["partage", "groupement", "reste"], 3: ["groupement", "reste"], 4: ["reste", "voyages"] };
  let m = new RegExp(`^(\\S+) partage (${NUMBER}) (${THINGS}) entre (\\d) amis\\. Combien de (${THINGS}) chacun reçoit-il \\?$`).exec(exo.prompt);
  let form = "partage";
  let n = 0;
  let d = 0;
  let expected = 0;
  if (m) {
    [n, d] = [num(m[2]), Number(m[4])];
    expected = Math.floor(n / d);
  }
  else if ((m = new RegExp(`^(\\S+) range (${NUMBER}) (${THINGS}) par paquets de (\\d)\\. Combien de paquets fait-(il|elle) \\?$`).exec(exo.prompt))) {
    form = "groupement";
    [n, d] = [num(m[2]), Number(m[4])];
    expected = Math.floor(n / d);
    if ((m[5] === "elle") !== GIRLS.includes(m[1])) return `« ${m[1]} » avec « ${m[5]} »`;
  } else if ((m = new RegExp(`^(\\S+) range (${NUMBER}) (${THINGS}) par paquets de (\\d)\\. Combien de (${THINGS}) reste-t-il hors des paquets pleins \\?$`).exec(exo.prompt))) {
    form = "reste";
    [n, d] = [num(m[2]), Number(m[4])];
    expected = n % d;
  } else if ((m = new RegExp(`^Une charrette porte (\\d) sacs par voyage\\. Combien de voyages faut-il pour porter (${NUMBER}) sacs \\?$`).exec(exo.prompt))) {
    form = "voyages";
    [d, n] = [Number(m[1]), num(m[2])];
    expected = Math.ceil(n / d);
  } else return `énoncé inconnu : ${exo.prompt}`;
  return all(
    ok(rightOption(exo) === String(expected), `${exo.prompt} : ${rightOption(exo)}, pas ${expected}`),
    ok(forms[level].includes(form), `la forme ${form} au palier ${level}`),
    ok(form === "reste" || form === "voyages" ? n % d > 0 : n % d === 0, `${n} ÷ ${d} : un reste là où le problème n'en veut pas, ou aucun là où il en faut un`),
    planRules(n, d, level),
    ok(form === "voyages" || form === "groupement" || m![3] === m![5], "la chose du début et de la question"),
  );
};

const CHECKS: Record<string, Check> = {
  "ce2-nb-voisin": checkNbNeighbour,
  "ce2-nb-comparer": checkNbCompare,
  "ce2-nb-ordre": checkNbOrder,
  "ce2-nb-chiffres": checkNbDigits,
  "ce2-nb-decomposer": checkNbDecompose,
  "ce2-nb-encadrer": checkNbBracket,
  "ce2-nb-glisser": checkNbSort,
  "ce2-nb-suite": checkNbSuite,
  "ce2-nb-lettres": checkNbWords,
  "ce2-nb-ecrire": checkNbWrite,
  "ce2-mult-table": checkMultTable,
  "ce2-mult-trou": checkMultGap,
  "ce2-mult-poser": checkMultPosed,
  "ce2-mult-ecrire": checkMultWrite,
  "ce2-mult-dix": checkMultTen,
  "ce2-mult-double": checkMultMental,
  "ce2-mult-decomposer": checkMultDecompose,
  "ce2-mult-relier": checkMultLinks,
  "ce2-mult-glisser": checkMultSort,
  "ce2-mult-probleme": checkMultProblem,
  "ce2-div-table": checkDivTable,
  "ce2-div-partage": checkDivShare,
  "ce2-div-groupement": checkDivGroup,
  "ce2-div-reste": checkDivRest,
  "ce2-div-poser": checkDivPosed,
  "ce2-div-trou": checkDivGap,
  "ce2-div-ecrire": checkDivWrite,
  "ce2-div-relier": checkDivLinks,
  "ce2-div-glisser": checkDivSort,
  "ce2-div-probleme": checkDivProblem,
};

const KINDS = Object.keys(CHECKS) as GameKind[];
const TOPIC_KINDS: Record<string, string[]> = {
  "ma-ce2-grands-nombres": ["voisin", "comparer", "ordre", "chiffres", "decomposer", "encadrer", "glisser", "suite", "lettres", "ecrire"].map((k) => `ce2-nb-${k}`),
  "ma-ce2-multiplication": ["table", "trou", "poser", "ecrire", "dix", "double", "decomposer", "relier", "glisser", "probleme"].map((k) => `ce2-mult-${k}`),
  "ma-ce2-division": ["table", "partage", "groupement", "reste", "poser", "trou", "ecrire", "relier", "glisser", "probleme"].map((k) => `ce2-div-${k}`),
};
const TOPIC_KEYS = Object.keys(TOPIC_KINDS);
const entryOf = (key: string) => allProgrammeEntries().find((entry) => entry.topic.key === key)!;
const topicOf = (key: string) => entryOf(key).topic;

describe("chaque gabarit de mathématiques du CE2 (première moitié) a sa vérification", () => {
  it("couvre exactement les trente gabarits, tous rangés dans une thématique", () => {
    expect(KINDS).toHaveLength(30);
    expect([...new Set(Object.values(TOPIC_KINDS).flat())].sort()).toEqual([...KINDS].sort());
    for (const kind of KINDS) expect(Object.keys(GAME_KINDS), kind).toContain(kind);
  });
});

describe("l'écriture des nombres en lettres jusqu'à 100 000", () => {
  it("écrit les nombres difficiles comme à l'école : un s à cent et à vingt seulement en fin de nombre, mille sans s, et sans trait d'union au-delà de cent", () => {
    for (const [n, text] of TRICKY_WORDS) {
      expect(words(n), `table de ${n}`).toBe(text);
      expect(wordsOfCe2(n), `wordsOfCe2(${n})`).toBe(text);
    }
  });

  it("écrit tous les nombres de 0 à 100 000 comme la table du test, et ne donne jamais deux fois le même mot", () => {
    const seen = new Set<string>();
    for (let n = 0; n <= 100000; n++) {
      const text = wordsOfCe2(n);
      if (text !== words(n)) expect(text, String(n)).toBe(words(n));
      seen.add(text);
    }
    expect(seen.size).toBe(100001);
  });
});

describe("les gabarits de mathématiques du CE2 (première moitié) recalculent juste, depuis une arithmétique écrite à part", () => {
  for (const kind of KINDS) {
    it(`${kind} : la bonne réponse se lit dans la règle, à tous les niveaux`, () => {
      for (const d of draws) {
        const exo = make(kind, d) as unknown as Exo;
        expect(CHECKS[kind](exo), `${kind} niveau ${d.level} : ${exo.prompt} ${exo.payload.text ?? ""}`).toBeNull();
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
      for (const d of draws.filter((_, i) => i % 4 === 0)) {
        const exo = make(kind, d) as unknown as Exo;
        const broken = mutate(kind, exo);
        if (!broken) continue;
        mutated += 1;
        expect(CHECKS[kind](broken), `${kind} niveau ${d.level} : ${exo.prompt}`).not.toBeNull();
      }
      expect(mutated, kind).toBeGreaterThan(0);
    });
  }

  it("voient aussi un énoncé abîmé : quatre-vingts devant mille, un reste plus grand que le diviseur, une retenue de trop au premier palier", () => {
    const qcm = (prompt: string, options: string[], correctIndex: number, level: number) =>
      ({ type: "qcm", prompt, answerKey: options[correctIndex], hints: [], payload: { options, correctIndex, game: { kind: "x", level } } }) as Exo;
    const written = (prompt: string, answer: string, level: number) =>
      ({ type: "short-answer", prompt, answerKey: answer, hints: [], payload: { acceptedAnswers: [answer], game: { kind: "x", level } } }) as Exo;
    expect(CHECKS["ce2-nb-ecrire"](written("Écris en chiffres le nombre « quatre-vingt mille ».", "80000", 4))).toBeNull();
    expect(CHECKS["ce2-nb-ecrire"](written("Écris en chiffres le nombre « soixante-dix mille ».", "70000", 4))).toBeNull();
    expect(CHECKS["ce2-nb-ecrire"](written("Écris en chiffres le nombre « quatre-vingts mille ».", "80000", 4))).not.toBeNull();
    expect(CHECKS["ce2-div-poser"](qcm("Pose 47 ÷ 3. Quel est le résultat ?", ["15 reste 2", "15 reste 5", "16 reste 1"], 0, 3))).toBeNull();
    expect(CHECKS["ce2-div-poser"](qcm("Pose 47 ÷ 3. Quel est le résultat ?", ["15 reste 2", "15 reste 5", "16 reste 1"], 1, 3))).not.toBeNull();
    expect(CHECKS["ce2-div-poser"](qcm("Pose 10 ÷ 2. Quel est le résultat ?", ["5", "4 reste 2", "6"], 0, 2))).not.toBeNull();
    expect(CHECKS["ce2-mult-poser"](qcm("Combien font 27 × 3 ?", ["81", "71", "91"], 0, 1))).not.toBeNull();
    expect(CHECKS["ce2-mult-poser"](qcm("Combien font 27 × 3 ?", ["81", "71", "91"], 0, 2))).toBeNull();
    expect(CHECKS["ce2-mult-double"](qcm("Quelle est la moitié de 35 ?", ["17", "18", "16"], 1, 2))).not.toBeNull();
    expect(CHECKS["ce2-nb-voisin"](qcm("Quel nombre vient juste après 19 999 ?", ["20 000", "19 000", "20 999"], 0, 1))).toBeNull();
    expect(CHECKS["ce2-nb-voisin"](qcm("Quel nombre vient juste après 19 999 ?", ["20 000", "19 000", "20 999"], 1, 1))).not.toBeNull();
  });
});

// ===========================================================================
// LES RÈGLES COMMUNES
// ===========================================================================

describe("tous les gabarits de mathématiques du CE2 (première moitié)", () => {
  const exos = KINDS.flatMap((kind) => draws.filter((_, i) => i % 3 === 0).map((d) => ({ kind, exo: make(kind, d) as unknown as Exo })));

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
      const a = GAME_KINDS[kind].make(makeContext("CE2", 3, "graine"));
      const b = GAME_KINDS[kind].make(makeContext("CE2", 3, "graine"));
      expect(a).toEqual(b);
      expect(a.hints).toHaveLength(3);
      expect(new Set(a.hints).size, kind).toBe(3);
    }
  });

  it("passent le contrôleur au CE2 sans aucun défaut, à tous les niveaux", () => {
    for (const { kind, exo } of exos) {
      const defects = auditExercise({
        type: GAME_KINDS[kind].type,
        prompt: exo.prompt,
        payload: exo.payload,
        answerKey: exo.answerKey,
        hints: exo.hints,
        class: "CE2",
        subject: "Mathématiques",
      });
      expect(defects, `${kind} : ${exo.prompt}`).toEqual([]);
    }
  });

  it("portent leur gabarit et leur niveau dans le payload, pour que le code refasse un exercice raté", () => {
    for (const { kind, exo } of exos) {
      const origin = exo.payload.game as { kind: string; level: number };
      expect(origin.kind, kind).toBe(kind);
      expect([1, 2, 3, 4], kind).toContain(origin.level);
    }
  });

  it("n'écrivent un nombre de plus de trois chiffres qu'avec des espaces entre les milliers", () => {
    for (const { kind, exo } of exos) for (const text of [exo.prompt, ...texts(exo)]) expect(/\d{4,}/.test(text), `${kind} : « ${text} »`).toBe(false);
  });

  it("ne dépassent jamais 100 000, ni dans un énoncé, ni dans un choix", () => {
    for (const { kind, exo } of exos.filter(({ kind }) => kind.startsWith("ce2-nb-"))) {
      for (const text of [exo.prompt, ...texts(exo)]) for (const found of text.match(new RegExp(NUMBER, "g")) ?? []) expect(num(found), `${kind} : « ${text} »`).toBeLessThanOrEqual(100000);
    }
  });
});

// ===========================================================================
// LES THÉMATIQUES DU PROGRAMME
// ===========================================================================

describe("les trois thématiques de mathématiques du CE2 (première moitié)", () => {
  it("remplissent les dix places du palier, avec des jeux connus, sans appeler le modèle", () => {
    for (const key of TOPIC_KEYS) {
      const specs = topicOf(key).games ?? [];
      expect(specs.reduce((sum, spec) => sum + spec.count, 0), key).toBe(PALIER_SIZE);
      expect([...specs.map((spec) => spec.kind as string)].sort(), key).toEqual([...TOPIC_KINDS[key]].sort());
      for (const spec of specs) expect(Object.keys(GAME_KINDS), `${key} : ${spec.kind}`).toContain(spec.kind);
      expect(topicUsesModel(key), key).toBe(false);
    }
  });

  it("sont celles du CE2, à quatre paliers, et gardent leur clé", () => {
    for (const key of TOPIC_KEYS) {
      expect(entryOf(key).klass, key).toBe("CE2");
      expect(topicOf(key).palierCount, key).toBeUndefined();
    }
    expect(TOPIC_KEYS).toHaveLength(3);
  });

  it("fabriquent des paliers entiers, de dix exercices, qui passent le contrôleur et la règle, aux quatre paliers", () => {
    for (const key of TOPIC_KEYS) {
      for (let n = 0; n < 30; n++) {
        for (const palierIndex of [1, 2, 3, 4]) {
          const paliers = generateGames(topicOf(key).games ?? [], { klass: "CE2", palierIndex, palierCount: 4, seed: `${key}:${n}:${palierIndex}` });
          expect(paliers, `${key} palier ${palierIndex}`).toHaveLength(PALIER_SIZE);
          const questions = paliers.map((game) => `${game.prompt}|${JSON.stringify(game.payload)}`);
          expect(new Set(questions).size, `${key} #${n} palier ${palierIndex}`).toBe(questions.length);
          expect(new Set(paliers.map((game) => game.type)).size, `${key} palier ${palierIndex}`).toBeGreaterThanOrEqual(4);
          for (const game of paliers) {
            const defects = auditExercise({ type: game.type, prompt: game.prompt, payload: game.payload, answerKey: game.answerKey, hints: game.hints, class: "CE2", subject: "Mathématiques" });
            expect(defects, `${key} palier ${palierIndex} : ${game.prompt}`).toEqual([]);
            const kind = (game.payload.game as { kind: string }).kind;
            expect(CHECKS[kind](game as unknown as Exo), `${key} palier ${palierIndex} ${kind} : ${game.prompt} ${game.payload.text ?? ""}`).toBeNull();
          }
        }
      }
    }
  });

  it("ne posent pas, dans un palier de multiplication, deux fois le même produit (table et facteur) ni, dans un palier de division, deux fois la même division", () => {
    for (let n = 0; n < 120; n++) {
      for (const palierIndex of [1, 2, 3, 4] as GameLevel[]) {
        const mult = generateGames(topicOf("ma-ce2-multiplication").games ?? [], { klass: "CE2", palierIndex, palierCount: 4, seed: `produit:${n}:${palierIndex}` });
        const asked: string[] = [];
        for (const game of mult) {
          const kind = (game.payload.game as { kind: string }).kind;
          if (kind === "ce2-mult-table" || (kind === "ce2-mult-ecrire" && /^Écris le résultat/.test(game.prompt))) {
            const match = /(\d+) × (\d+)/.exec(game.prompt)!;
            asked.push(palierIndex === 4 ? `${match[2]}x${match[1]}` : `${match[1]}x${match[2]}`);
          }
          if (kind === "ce2-mult-trou") {
            const match = /(\d+) × ___ = (\d+)|___ × (\d+) = (\d+)/.exec(textOf(game as unknown as Exo))!;
            const table = Number(match[1] ?? match[3]);
            asked.push(`${table}x${Number(match[2] ?? match[4]) / table}`);
          }
          if (kind === "ce2-mult-relier") for (const pair of pairsOf(game as unknown as Exo)) {
            const match = /(\d+) × (\d+)/.exec(pair.left)!;
            asked.push(palierIndex === 4 ? `${match[2]}x${match[1]}` : `${match[1]}x${match[2]}`);
          }
        }
        expect(new Set(asked).size, `palier ${palierIndex} : ${asked.join(" ")}`).toBe(asked.length);
        const div = generateGames(topicOf("ma-ce2-division").games ?? [], { klass: "CE2", palierIndex, palierCount: 4, seed: `division:${n}:${palierIndex}` });
        const divisions = div
          .filter((game) => ["ce2-div-poser", "ce2-div-reste", "ce2-div-ecrire"].includes((game.payload.game as { kind: string }).kind))
          .map((game) => /(\d[\d ]*) ÷ (\d)/.exec(game.prompt)![0]);
        expect(new Set(divisions).size, `palier ${palierIndex} : ${divisions.join(" ; ")}`).toBe(divisions.length);
      }
    }
  });
});
