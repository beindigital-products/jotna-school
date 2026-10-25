import { describe, expect, it } from "vitest";
import type { GameLevel } from "../paliers/games/shared";
import { acceptedOf, all, blankOf, defineMathsTests, itemsOf, levelOf, ok, optionsOf, pairsOf, rightOption, sequenceOf, textOf, textsOf, wrongOf, zonesOf, type Check, type Exo } from "@/lib/test-support/cm1MathsKit";

/**
 * LES NOMBRES DÉCIMAUX DU CM1 (`ma-cm1-decimaux`).
 *
 * Chaque test RECALCULE la réponse sur des entiers de centièmes, avec sa propre lecture d'un nombre écrit (la virgule coupe la partie entière et les chiffres de
 * droite, jamais un nombre flottant) : la comparaison, la somme, la différence, le complément, la valeur d'un chiffre. Aucun nombre n'est écrit avec un zéro
 * inutile à droite (« 4,50 »). Le niveau 2 est celui des paliers 2 et 3.
 */

const DEC = String.raw`\d+(?:,\d{1,2})?`;
const BAD_ZERO = /,\d*0(?!\d)/;

/** Un nombre écrit « 45,6 » en centièmes : 4560. Les chiffres de droite sont lus un par un, pas comme un nombre flottant. */
function hundredths(text: string): number {
  const [whole, decimals = ""] = text.replace(/ /g, "").split(",");
  return Number(whole) * 100 + Number(decimals.padEnd(2, "0"));
}
const places = (text: string) => (text.includes(",") ? text.split(",")[1].length : 0);
const wholeOf = (text: string) => Number(text.split(",")[0].replace(/ /g, ""));
const sortedDigits = (h: number) => String(h).split("").sort().join("");

/** Les nombres de ce texte n'ont aucun zéro inutile à droite de la virgule. */
const cleanNumbers = (exo: Exo) => ok(![exo.prompt, ...textsOf(exo)].some((text) => BAD_ZERO.test(text)), `un zéro inutile à droite de la virgule : ${exo.prompt} ${textsOf(exo).join(" | ")}`);

/** Le palier de la partie entière et du nombre de chiffres après la virgule : le niveau 2 réunit les paliers 2 et 3. */
const SHAPE: Record<GameLevel, { whole: [number, number]; places: number[] }> = {
  1: { whole: [0, 9], places: [1] },
  2: { whole: [0, 99], places: [1, 2] },
  3: { whole: [10, 499], places: [1, 2] },
  4: { whole: [10, 499], places: [1, 2] },
};
const shaped = (text: string, level: GameLevel) => {
  const { whole, places: allowed } = SHAPE[level];
  return wholeOf(text) >= whole[0] && wholeOf(text) <= whole[1] && allowed.includes(places(text));
};

const RANKS: Record<string, number> = { centièmes: 1, dixièmes: 10, unités: 100, dizaines: 1000, centaines: 10000 };

const checkParts: Check = (exo) => {
  const level = levelOf(exo);
  let m = new RegExp(`^Quelle est la partie entière de (${DEC}) \\?$`).exec(exo.prompt);
  let expected: string;
  let target: string;
  if (m) {
    target = m[1];
    expected = String(wholeOf(target));
  } else if ((m = new RegExp(`^Quels chiffres forment la partie décimale de (${DEC}) \\?$`).exec(exo.prompt))) {
    target = m[1];
    expected = target.split(",")[1] ?? "";
  } else return `énoncé inconnu : ${exo.prompt}`;
  const asNumber = (text: string) => Number(text.replace(/ /g, ""));
  return all(
    ok(rightOption(exo) === expected, `${exo.prompt} : ${rightOption(exo)}, pas ${expected}`),
    ok(wrongOf(exo).every((option) => asNumber(option) !== asNumber(expected)), `un mauvais choix qui vaut la bonne réponse : ${optionsOf(exo).join(" / ")}`),
    ok(target.includes(","), "un nombre sans virgule"),
    ok(wholeOf(target) >= 1, "une partie entière nulle"),
    ok(shaped(target, level), `${target} hors de la plage du niveau ${level}`),
    cleanNumbers(exo),
  );
};

const SHAPE_DIGITS: Record<GameLevel, { whole: number[]; places: number }> = { 1: { whole: [1], places: 1 }, 2: { whole: [1, 2], places: 2 }, 3: { whole: [2, 3], places: 2 }, 4: { whole: [3], places: 2 } };

const checkDigits: Check = (exo) => {
  const level = levelOf(exo);
  const rankOf = (text: string, digit: string) => {
    const [whole] = text.split(",");
    const index = text.replace(",", "").indexOf(digit);
    // De gauche à droite : les chiffres entiers, puis les dixièmes et les centièmes.
    return index < whole.length ? 100 * 10 ** (whole.length - 1 - index) : 10 ** (1 - (index - whole.length));
  };
  const distinct = (text: string) => {
    const digits = text.replace(",", "");
    return /^[1-9]+$/.test(digits) && new Set(digits).size === digits.length;
  };
  const shape = (text: string) => SHAPE_DIGITS[level].whole.includes(text.split(",")[0].length) && places(text) === SHAPE_DIGITS[level].places;
  let m = new RegExp(`^Quel est le chiffre des (${Object.keys(RANKS).join("|")}) de (${DEC}) \\?$`).exec(exo.prompt);
  if (m) {
    const target = m[2];
    const digits = target.replace(",", "");
    const wholeLength = target.split(",")[0].length;
    // Le rang demandé se retrouve à sa place : unités juste avant la virgule, dixièmes juste après.
    const position = RANKS[m[1]] >= 100 ? wholeLength - 1 - Math.log10(RANKS[m[1]] / 100) : wholeLength + Math.log10(10 / RANKS[m[1]]);
    return all(
      ok(Number.isInteger(position) && position >= 0 && position < digits.length, `le rang ${m[1]} n'existe pas dans ${target}`),
      ok(rightOption(exo) === digits[position], `${exo.prompt} : ${rightOption(exo)}, pas ${digits[position]}`),
      ok(distinct(target) && shape(target), `${target} : des chiffres qui se répètent, un zéro, ou une forme hors du niveau ${level}`),
      ok(wrongOf(exo).every((option) => /^\d$/.test(option)), "des chiffres pour mauvais choix"),
      cleanNumbers(exo),
    );
  }
  m = new RegExp(`^Dans (${DEC}), quelle est la valeur du chiffre (\\d) \\?$`).exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const target = m[1];
  const digit = m[2];
  const expected = Number(digit) * rankOf(target, digit);
  return all(
    ok(target.replace(",", "").split(digit).length === 2, `le chiffre ${digit} n'est pas seul dans ${target}`),
    ok(hundredths(rightOption(exo)) === expected, `${exo.prompt} : ${rightOption(exo)}, pas ${expected / 100}`),
    ok(wrongOf(exo).every((option) => hundredths(option) !== expected), "un mauvais choix égal à la valeur"),
    ok(level >= 2, "la valeur d'un chiffre au premier palier"),
    // Le fait d'un indice est vrai : un chiffre vaut dix fois plus quand il avance d'un rang vers la gauche (jamais « un dixième de plus »).
    ok(exo.hints[2] === "Un chiffre vaut dix fois plus quand il avance d'un rang vers la gauche." && exo.hints.every((hint) => !/de plus/.test(hint)), `l'indice du rang : ${exo.hints.join(" | ")}`),
    ok(distinct(target) && shape(target), `${target} hors de la plage du niveau ${level}`),
    cleanNumbers(exo),
  );
};

/** Les formes d'écriture et les paliers où elles servent : le niveau 2 réunit les paliers 2 et 3. */
const WRITE_FORMS: Record<GameLevel, string[]> = {
  1: ["dixiemes", "unitesDixiemes"],
  2: ["centiemes", "unitesDixiemesCentiemes", "dixiemes", "fractionDixiemes"],
  3: ["centiemes", "unitesDixiemesCentiemes", "fractionDixiemes", "fractionCentiemes"],
  4: ["fractionCentiemes", "unitesDixiemesCentiemes", "fractionDixiemes"],
};

const checkWrite: Check = (exo) => {
  const level = levelOf(exo);
  let form: string;
  let expected: number;
  let m = /^Écris (\d+) dixièmes sous forme de nombre décimal\.$/.exec(exo.prompt);
  if (m) {
    form = "dixiemes";
    expected = Number(m[1]) * 10;
    if (Number(m[1]) < 2) return "un seul dixième au pluriel";
  } else if ((m = /^Écris (\d+) centièmes sous forme de nombre décimal\.$/.exec(exo.prompt))) {
    form = "centiemes";
    expected = Number(m[1]);
    if (Number(m[1]) < 2) return "un seul centième au pluriel";
  } else if ((m = /^Écris en chiffres (\d+) unités et (\d+) dixièmes\.$/.exec(exo.prompt))) {
    form = "unitesDixiemes";
    expected = Number(m[1]) * 100 + Number(m[2]) * 10;
    if (Number(m[1]) < 2 || Number(m[2]) < 2 || Number(m[2]) > 9) return "un nombre hors des unités et des dixièmes";
  } else if ((m = /^Écris en chiffres (\d+) unités, (\d+) dixièmes et (\d+) centièmes\.$/.exec(exo.prompt))) {
    form = "unitesDixiemesCentiemes";
    expected = Number(m[1]) * 100 + Number(m[2]) * 10 + Number(m[3]);
    if (Number(m[1]) < 2 || Number(m[2]) < 2 || Number(m[3]) < 2 || Number(m[2]) > 9 || Number(m[3]) > 9) return "un nombre hors des unités, dixièmes et centièmes";
  } else if ((m = /^Écris la fraction (\d+)\/10 sous forme de nombre décimal\.$/.exec(exo.prompt))) {
    form = "fractionDixiemes";
    expected = Number(m[1]) * 10;
  } else if ((m = /^Écris la fraction (\d+)\/100 sous forme de nombre décimal\.$/.exec(exo.prompt))) {
    form = "fractionCentiemes";
    expected = Number(m[1]);
  } else return `énoncé inconnu : ${exo.prompt}`;
  return all(
    ok(hundredths(exo.answerKey) === expected, `${exo.prompt} : ${exo.answerKey}, pas ${expected / 100}`),
    ok(acceptedOf(exo).length === 1 && acceptedOf(exo)[0] === exo.answerKey, "la réponse admise n'est pas la clé"),
    ok(!BAD_ZERO.test(exo.answerKey) && /^\d+(,\d{1,2})?$/.test(exo.answerKey), `une réponse mal écrite : ${exo.answerKey}`),
    ok(WRITE_FORMS[level].includes(form), `la forme ${form} au niveau ${level}`),
  );
};

const checkLinks: Check = (exo) => {
  if (exo.prompt !== "Relie chaque nombre décimal à sa fraction décimale.") return `énoncé inconnu : ${exo.prompt}`;
  const level = levelOf(exo);
  const rows = pairsOf(exo).map((pair) => ({ left: pair.left, right: /^(\d+(?: \d{3})*)\/(10|100)$/.exec(pair.right) }));
  if (rows.some((row) => row.right === null)) return `une fraction illisible : ${pairsOf(exo).map((pair) => pair.right).join(", ")}`;
  return all(
    ok(rows.length === 3, "trois nombres"),
    ok(rows.every((row) => (Number(row.right![1].replace(/ /g, "")) * 100) / Number(row.right![2]) === hundredths(row.left)), `une fraction fausse : ${pairsOf(exo).map((pair) => `${pair.left} ~ ${pair.right}`).join(" ; ")}`),
    ok(rows.every((row) => Number(row.right![2]) === 10 ** places(row.left)), "le bas de la fraction ne suit pas le nombre de chiffres après la virgule"),
    ok(new Set(rows.map((row) => hundredths(row.left))).size === 3, "deux nombres de même valeur"),
    ok(rows.every((row) => shaped(row.left, level)), `un nombre hors de la plage du niveau ${level}`),
    cleanNumbers(exo),
  );
};

/** Plusieurs nombres à comparer ou à ranger : valeurs différentes, forme du palier (mêmes chiffres échangés au niveau 3, mêmes dixièmes au niveau 4). */
function comparable(texts: string[], level: GameLevel): string | null {
  const values = texts.map(hundredths);
  const sameWhole = values.every((h) => Math.floor(h / 100) === Math.floor(values[0] / 100));
  const sameTenths = values.some((a, i) => values.some((b, j) => i !== j && Math.floor(a / 10) === Math.floor(b / 10)));
  return all(
    ok(new Set(values).size === texts.length, "deux nombres de même valeur"),
    ok(values.every((h) => h > 0), "un nombre nul"),
    ok(level !== 1 || (sameWhole && texts.every((t) => places(t) === 1)), "au premier palier, même partie entière et des dixièmes seulement"),
    ok(level !== 3 || values.every((h) => sortedDigits(h) === sortedDigits(values[0])), "au palier 4, les mêmes chiffres échangés"),
    ok(level !== 4 || sameTenths, "au dernier palier, deux nombres aux mêmes dixièmes"),
    ok(texts.every((t) => wholeOf(t) <= 499), "une partie entière trop grande"),
  );
}

const checkCompare: Check = (exo) => {
  const m = /^Quel est le (plus grand|plus petit) de ces nombres \?$/.exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const values = optionsOf(exo).map(hundredths);
  const expected = m[1] === "plus grand" ? Math.max(...values) : Math.min(...values);
  return all(ok(hundredths(rightOption(exo)) === expected, `${exo.prompt} ${optionsOf(exo).join(", ")} : ${rightOption(exo)}`), comparable(optionsOf(exo), levelOf(exo)), cleanNumbers(exo));
};

const checkOrder: Check = (exo) => {
  const ascending = exo.prompt === "Range ces nombres du plus petit au plus grand.";
  const descending = exo.prompt === "Range ces nombres du plus grand au plus petit.";
  if (ascending === descending) return `énoncé inconnu : ${exo.prompt}`;
  const values = sequenceOf(exo).map(hundredths);
  const sorted = [...values].sort((a, b) => (ascending ? a - b : b - a));
  return all(
    ok(values.length === 4, "quatre nombres"),
    ok(JSON.stringify(values) === JSON.stringify(sorted), `${exo.prompt} ${sequenceOf(exo).join(" / ")}`),
    ok(levelOf(exo) >= 2 || ascending, "du plus grand au plus petit au premier palier"),
    comparable(sequenceOf(exo), levelOf(exo)),
    cleanNumbers(exo),
  );
};

const checkSort: Check = (exo) => {
  const [low, high] = zonesOf(exo);
  const m = new RegExp(`^Moins de (${DEC})$`).exec(low);
  if (!m || high !== `Plus de ${m[1]}`) return `cases inconnues : ${zonesOf(exo).join(" / ")}`;
  const threshold = hundredths(m[1]);
  const level = levelOf(exo);
  const each = level === 1 ? 2 : 3;
  const items = itemsOf(exo);
  const wrongPlace = items.find((item) => item.correctZone !== (hundredths(item.text) < threshold ? low : high));
  return all(
    ok(!wrongPlace, `${wrongPlace?.text} n'est pas dans la bonne case (${low})`),
    ok(items.every((item) => hundredths(item.text) !== threshold), "un nombre égal au seuil"),
    ok(items.filter((item) => item.correctZone === low).length === each && items.filter((item) => item.correctZone === high).length === each, `${each} nombres par case`),
    ok(level !== 1 || (places(m[1]) === 1 && items.every((item) => places(item.text) <= 1)), "des dixièmes seulement au premier palier"),
    ok(items.every((item) => hundredths(item.text) > 0), "un nombre nul"),
    cleanNumbers(exo),
  );
};

const checkSuite: Check = (exo) => {
  const text = textOf(exo);
  const level = levelOf(exo);
  const cells = text.split(" ; ");
  const blank = cells.indexOf("___");
  if (cells.length !== 5 || blank < 0) return `suite inconnue : ${text}`;
  const values = cells.map((cell, i) => hundredths(i === blank ? blankOf(exo).answer : cell));
  const gap = values[1] - values[0];
  const descending = /Elle descend/.test(exo.prompt);
  if (!descending && !/Elle avance/.test(exo.prompt)) return `énoncé inconnu : ${exo.prompt}`;
  const steps: Record<GameLevel, number[]> = { 1: [10], 2: [5, 10, 25, 50], 3: [2, 5, 25, 50], 4: [5, 25, 75] };
  const tops: Record<GameLevel, number> = { 1: 300, 2: 3000, 3: 10000, 4: 30000 };
  return all(
    ok(values.every((value, i) => i === 0 || value - values[i - 1] === gap), `${text} : ${blankOf(exo).answer} ne garde pas le pas`),
    ok(steps[level].includes(Math.abs(gap)), `le pas ${gap / 100} au niveau ${level}`),
    ok(descending === gap < 0, "la consigne ne dit pas le sens de la suite"),
    ok(level >= 2 || !descending, "une suite qui descend au premier palier"),
    ok(values.every((value) => value > 0 && value % Math.abs(gap) === 0 && value <= tops[level]), "un terme nul, trop grand, ou qui n'est pas un multiple du pas"),
    ok(level === 1 ? blank === 4 : level === 2 ? blank >= 1 : blank >= 1 && blank <= 3, `le trou à la place ${blank} au niveau ${level}`),
    ok(blankOf(exo).options.every((option) => option === blankOf(exo).answer || !values.includes(hundredths(option))), "un mauvais choix déjà écrit dans la suite"),
    cleanNumbers(exo),
  );
};

const checkCalc: Check = (exo) => {
  const m = new RegExp(`^Calcule (${DEC}) (\\+|−) (${DEC})\\.$`).exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const [a, b] = [hundredths(m[1]), hundredths(m[3])];
  const subtract = m[2] === "−";
  const expected = subtract ? a - b : a + b;
  const level = levelOf(exo);
  return all(
    ok(expected > 0 && hundredths(rightOption(exo)) === expected, `${exo.prompt} : ${rightOption(exo)}, pas ${expected / 100}`),
    ok(wrongOf(exo).every((option) => hundredths(option) !== expected), "un mauvais choix égal au résultat"),
    ok(!subtract || level >= 2, "une soustraction au premier palier"),
    ok(shaped(m[1], level) && shaped(m[3], level), `un nombre hors de la plage du niveau ${level}`),
    cleanNumbers(exo),
  );
};

const checkComplement: Check = (exo) => {
  const text = textOf(exo);
  const m = new RegExp(`^(${DEC}) \\+ ___ = (1|10|100)$`).exec(text);
  if (!m) return `phrase inconnue : ${text}`;
  const [a, total] = [hundredths(m[1]), Number(m[2]) * 100];
  const level = levelOf(exo);
  const fits = blankOf(exo).options.filter((option) => a + hundredths(option) === total);
  const totals: Record<GameLevel, number[]> = { 1: [1], 2: [1, 10], 3: [10, 100], 4: [100] };
  return all(
    ok(fits.length === 1 && fits[0] === blankOf(exo).answer, `${text} : ${fits.length} choix conviennent parmi ${blankOf(exo).options.join(", ")} (réponse ${blankOf(exo).answer})`),
    ok(a > 0 && a < total, "un nombre qui n'est pas plus petit que le total"),
    ok(totals[level].includes(Number(m[2])), `le total ${m[2]} au niveau ${level}`),
    ok(level !== 1 || places(m[1]) === 1, "des dixièmes seulement au premier palier"),
    cleanNumbers(exo),
  );
};

const TOPIC_KINDS = {
  "ma-cm1-decimaux": ["parties", "chiffres", "ecrire", "relier", "comparer", "ordre", "glisser", "suite", "calcul", "complement"].map((k) => `cm1-dcm-${k}`),
};

defineMathsTests({
  label: "des nombres décimaux du CM1",
  checks: {
    "cm1-dcm-parties": checkParts,
    "cm1-dcm-chiffres": checkDigits,
    "cm1-dcm-ecrire": checkWrite,
    "cm1-dcm-relier": checkLinks,
    "cm1-dcm-comparer": checkCompare,
    "cm1-dcm-ordre": checkOrder,
    "cm1-dcm-glisser": checkSort,
    "cm1-dcm-suite": checkSuite,
    "cm1-dcm-calcul": checkCalc,
    "cm1-dcm-complement": checkComplement,
  },
  topicKinds: TOPIC_KINDS,
});

describe("les vérifications des décimaux voient un énoncé abîmé", () => {
  const qcm = (prompt: string, options: string[], correctIndex: number, level: number) =>
    ({ type: "qcm", prompt, answerKey: options[correctIndex], hints: [], payload: { options, correctIndex, game: { kind: "x", level } } }) as Exo;
  const gap = (text: string, options: string[], answer: string, level: number) =>
    ({ type: "fill-blank", prompt: "x", answerKey: answer, hints: [], payload: { text, blanks: [{ options, answer }], game: { kind: "x", level } } }) as Exo;

  it("la lecture d'un nombre écrit : les chiffres de droite se lisent un par un, 4,5 vaut 450 centièmes et 4,05 vaut 405", () => {
    expect(hundredths("4,5")).toBe(450);
    expect(hundredths("4,05")).toBe(405);
    expect(hundredths("4,25")).toBe(425);
    expect(hundredths("12")).toBe(1200);
    expect(hundredths("0,07")).toBe(7);
  });

  it("4,5 est plus grand que 4,25 : on ne compare pas 5 et 25", () => {
    expect(checkCompare(qcm("Quel est le plus grand de ces nombres ?", ["4,5", "4,25", "4,05"], 0, 2))).toBeNull();
    expect(checkCompare(qcm("Quel est le plus grand de ces nombres ?", ["4,5", "4,25", "4,05"], 1, 2))).not.toBeNull();
    expect(checkCompare(qcm("Quel est le plus petit de ces nombres ?", ["4,5", "4,25", "4,05"], 2, 2))).toBeNull();
    expect(checkCompare(qcm("Quel est le plus petit de ces nombres ?", ["4,5", "4,25", "4,05"], 1, 2))).not.toBeNull();
  });

  it("la virgule mal alignée est refusée : 4,5 + 2,35 vaut 6,85, pas 2,8 ni 6,4", () => {
    expect(checkCalc(qcm("Calcule 4,5 + 2,35.", ["6,85", "2,8", "6,4"], 0, 2))).toBeNull();
    expect(checkCalc(qcm("Calcule 4,5 + 2,35.", ["6,85", "2,8", "6,4"], 1, 2))).not.toBeNull();
    expect(checkCalc(qcm("Calcule 4,5 + 2,35.", ["6,85", "2,8", "6,4"], 2, 2))).not.toBeNull();
  });

  it("un zéro inutile, un complément faux et une partie décimale confondue avec la partie entière sont refusés", () => {
    expect(checkCalc(qcm("Calcule 4,50 + 2,35.", ["6,85", "2,8", "6,4"], 0, 2))).not.toBeNull();
    expect(checkComplement(gap("6,4 + ___ = 10", ["3,6", "4,6", "3,4"], "3,6", 2))).toBeNull();
    expect(checkComplement(gap("6,4 + ___ = 10", ["3,6", "4,6", "3,4"], "4,6", 2))).not.toBeNull();
    expect(checkParts(qcm("Quelle est la partie entière de 45,67 ?", ["45", "67", "4"], 0, 3))).toBeNull();
    expect(checkParts(qcm("Quelle est la partie entière de 45,67 ?", ["45", "67", "4"], 1, 3))).not.toBeNull();
    expect(checkParts(qcm("Quels chiffres forment la partie décimale de 4,05 ?", ["05", "5", "4"], 0, 2))).not.toBeNull();
  });
});
