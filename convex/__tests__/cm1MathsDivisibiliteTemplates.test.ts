import { describe, expect, it } from "vitest";
import type { GameLevel } from "../paliers/games/shared";
import { acceptedOf, all, blankOf, defineMathsTests, itemsOf, levelOf, num, NUMBER, ok, optionsOf, pairsOf, rightOption, sequenceOf, textOf, wrongOf, zonesOf, type Check, type Exo } from "@/lib/test-support/cm1MathsKit";

/**
 * LA DIVISIBILITÉ ET LE CALCUL MENTAL DU CM1 (`ma-cm1-divisibilite`).
 *
 * Chaque test RECALCULE la bonne réponse avec un reste de division ou un produit, écrits à part : un seul choix divisible (ou, quand l'énoncé le demande, un
 * seul qui ne l'est pas), un seul chiffre qui convient dans un trou, un multiple voisin jamais proposé comme bon choix, les tables de chaque palier, le nombre de
 * zéros d'un produit. Le niveau 2 est celui des paliers 2 et 3, le niveau 3 celui du palier 4, le niveau 4 celui du palier 5.
 */

const DIVISORS: Record<GameLevel, number[]> = { 1: [2, 5, 10], 2: [2, 5, 10, 3, 9], 3: [3, 9, 2, 5], 4: [3, 9] };
const SPAN: Record<GameLevel, [number, number]> = { 1: [20, 99], 2: [100, 999], 3: [1000, 9999], 4: [1000, 99999] };
const MULTIPLE_DIVISORS: Record<GameLevel, number[]> = { 1: [3, 4, 6], 2: [6, 7, 8, 9, 11], 3: [6, 7, 8, 9, 12], 4: [7, 8, 9, 11, 12, 15] };
const FACTORS: Record<GameLevel, [number, number]> = { 1: [3, 10], 2: [5, 15], 3: [10, 20], 4: [12, 30] };
const TABLES: Record<GameLevel, number[]> = { 1: [2, 3, 4, 5], 2: [6, 7, 8, 9], 3: [6, 7, 8, 9], 4: [2, 3, 4, 5, 6, 7, 8, 9] };

const within = (n: number, [lo, hi]: [number, number]) => n >= lo && n <= hi;

/** Le fait d'une table, sans l'ordre des facteurs : 6 × 7 et 7 × 6 sont le même. */
const factOf = (a: number, b: number) => `${Math.min(a, b)}x${Math.max(a, b)}`;
const inTables = (a: number, b: number, level: GameLevel) => (TABLES[level].includes(a) || TABLES[level].includes(b)) && a >= 2 && a <= 9 && b >= 2 && b <= 9;

const checkCriterion: Check = (exo) => {
  const m = /^Lequel de ces nombres (est|n'est pas) divisible par (\d+) \?$/.exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const d = Number(m[2]);
  const negated = m[1] === "n'est pas";
  const level = levelOf(exo);
  const values = optionsOf(exo).map(num);
  const matching = values.filter((value) => (value % d === 0) !== negated);
  return all(
    ok(matching.length === 1, `${matching.length} nombres répondent à « ${exo.prompt} » parmi ${optionsOf(exo).join(", ")}`),
    ok(num(rightOption(exo)) === matching[0], `${exo.prompt} : ${rightOption(exo)}, pas ${matching[0]}`),
    ok(DIVISORS[level].includes(d), `le diviseur ${d} au niveau ${level}`),
    ok(values.every((value) => within(value, SPAN[level])), `un nombre hors de la plage du niveau ${level}`),
    ok(!negated || level >= 2, "un « n'est pas divisible » au premier palier"),
    ok(new Set(values).size === 3, "trois nombres différents"),
  );
};

const checkSort: Check = (exo) => {
  const [yes, no] = zonesOf(exo);
  const m = /^Divisible par (\d+)$/.exec(yes);
  if (!m || no !== `Pas divisible par ${m[1]}`) return `cases inconnues : ${zonesOf(exo).join(" / ")}`;
  const d = Number(m[1]);
  const level = levelOf(exo);
  const items = itemsOf(exo);
  const each = level === 1 ? 2 : 3;
  const wrongPlace = items.find((item) => item.correctZone !== (num(item.text) % d === 0 ? yes : no));
  return all(
    ok(!wrongPlace, `${wrongPlace?.text} n'est pas dans la bonne case (${yes})`),
    ok(items.filter((item) => item.correctZone === yes).length === each && items.filter((item) => item.correctZone === no).length === each, `${each} nombres par case`),
    ok(DIVISORS[level].includes(d), `le diviseur ${d} au niveau ${level}`),
    ok(items.every((item) => within(num(item.text), SPAN[level])), `un nombre hors de la plage du niveau ${level}`),
  );
};

const checkDigit: Check = (exo) => {
  const text = textOf(exo);
  const m = /^([\d ]*___[\d ]*) est divisible par (\d+)\.$/.exec(text);
  if (!m) return `phrase inconnue : ${text}`;
  const d = Number(m[2]);
  const level = levelOf(exo);
  const [before, after] = m[1].split("___");
  const build = (digit: string) => num(`${before}${digit}${after}`);
  const length = (before + after).replace(/ /g, "").length + 1;
  const blank = before.replace(/ /g, "").length;
  const fits = blankOf(exo).options.filter((option) => build(option) % d === 0);
  const lengths: Record<GameLevel, [number, number]> = { 1: [3, 3], 2: [3, 4], 3: [4, 5], 4: [4, 5] };
  return all(
    ok(fits.length === 1 && fits[0] === blankOf(exo).answer, `${text} : ${fits.length} chiffres conviennent parmi ${blankOf(exo).options.join(", ")} (réponse ${blankOf(exo).answer})`),
    ok(DIVISORS[level].includes(d), `le diviseur ${d} au niveau ${level}`),
    ok(within(length, lengths[level]), `${length} chiffres au niveau ${level}`),
    ok(blank >= 1, "le trou remplace le premier chiffre"),
    ok(d === 3 || d === 9 || blank === length - 1, `le critère de ${d} ne regarde que le dernier chiffre : le trou doit y être`),
    ok(!/^0/.test(before.replace(/ /g, "") || "1"), "un nombre qui commence par zéro"),
    ok(blankOf(exo).options.every((option) => /^\d$/.test(option)), "des chiffres pour choix"),
  );
};

const checkMultiple: Check = (exo) => {
  const m = /^Lequel de ces nombres est un multiple de (\d+) \?$/.exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const d = Number(m[1]);
  const level = levelOf(exo);
  const values = optionsOf(exo).map(num);
  const multiples = values.filter((value) => value % d === 0);
  const right = num(rightOption(exo));
  return all(
    ok(multiples.length === 1 && multiples[0] === right, `${exo.prompt} : ${multiples.length} multiples parmi ${optionsOf(exo).join(", ")} (réponse ${right})`),
    ok(MULTIPLE_DIVISORS[level].includes(d), `le nombre ${d} au niveau ${level}`),
    ok(within(right / d, FACTORS[level]), `le rang ${right / d} de ${right} au niveau ${level}`),
    ok(values.every((value) => Math.abs(value - right) <= 2), "un mauvais choix qui n'est pas voisin du multiple"),
  );
};

const checkSuite: Check = (exo) => {
  const m = /^Complète la suite des multiples de (\d+)\.$/.exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const d = Number(m[1]);
  const level = levelOf(exo);
  const cells = textOf(exo).split(", ");
  const blank = cells.indexOf("___");
  if (cells.length !== 5 || blank < 0) return `suite inconnue : ${textOf(exo)}`;
  const values = cells.map((cell, i) => (i === blank ? num(blankOf(exo).answer) : num(cell)));
  const starts: Record<GameLevel, [number, number]> = { 1: [1, 1], 2: [1, 8], 3: [5, 12], 4: [8, 20] };
  return all(
    ok(values.every((value) => value % d === 0), "un terme qui n'est pas un multiple"),
    ok(values.every((value, i) => i === 0 || value - values[i - 1] === d), `${textOf(exo)} : ${blankOf(exo).answer} ne garde pas le pas`),
    ok(MULTIPLE_DIVISORS[level].includes(d), `le nombre ${d} au niveau ${level}`),
    ok(within(values[0] / d, starts[level]), `le premier terme ${values[0]} au niveau ${level}`),
    ok(blank >= (level === 1 ? 2 : 1) && blank <= 3, `le trou à la place ${blank}`),
    ok(blankOf(exo).options.every((option) => option === blankOf(exo).answer || !values.includes(num(option))), "un mauvais choix déjà écrit dans la suite"),
  );
};

const checkTimes: Check = (exo) => {
  const m = /^Combien font (\d) × (\d) \?$/.exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const [a, b] = [Number(m[1]), Number(m[2])];
  const level = levelOf(exo);
  return all(
    ok(num(rightOption(exo)) === a * b, `${exo.prompt} : ${rightOption(exo)}, pas ${a * b}`),
    ok(inTables(a, b, level), `${a} × ${b} n'est dans aucune table du niveau ${level}`),
    ok(wrongOf(exo).every((option) => num(option) >= 1 && num(option) <= 90), "un choix hors des tables"),
  );
};

const checkTen: Check = (exo) => {
  const m = new RegExp(`^(${NUMBER}) × (${NUMBER}) = ___$`).exec(textOf(exo));
  if (!m) return `phrase inconnue : ${textOf(exo)}`;
  const [a, b] = [num(m[1]), num(m[2])];
  const level = levelOf(exo);
  const roundTo = (n: number, unit: number) => n % unit === 0 && n / unit >= 2 && n / unit <= 9;
  const shapes: Record<GameLevel, boolean> = {
    1: b === 10 && a >= 12 && a <= 99,
    2: (b === 100 && a >= 12 && a <= 99) || (b === 1000 && a >= 12 && a <= 99) || ([10, 100].includes(b) && a >= 101 && a <= 999),
    3: roundTo(a, 10) && roundTo(b, 10),
    4: (roundTo(a, 100) && roundTo(b, 10)) || (roundTo(a, 10) && roundTo(b, 100)),
  };
  return all(
    ok(num(blankOf(exo).answer) === a * b, `${textOf(exo)} : ${blankOf(exo).answer}, pas ${a * b}`),
    ok(shapes[level], `${a} × ${b} n'a pas la forme du niveau ${level}`),
    ok(blankOf(exo).options.every((option) => option === blankOf(exo).answer || num(option) !== a * b), "un mauvais choix qui est la bonne réponse"),
  );
};

const checkWrite: Check = (exo) => {
  const level = levelOf(exo);
  const answer = Number(exo.answerKey);
  const base = all(ok(acceptedOf(exo).length === 1 && acceptedOf(exo)[0] === exo.answerKey, "la réponse admise n'est pas la clé"), ok(/^\d+$/.test(exo.answerKey), "des chiffres seuls"));
  if (base) return base;
  let m = new RegExp(`^Écris le double de (${NUMBER})\\.$`).exec(exo.prompt);
  if (m) {
    const n = num(m[1]);
    const spans: Record<GameLevel, [number, number]> = { 1: [12, 49], 2: [60, 999], 3: [1200, 4999], 4: [10000, 49999] };
    return all(ok(answer === n + n, `${exo.prompt} : ${answer}, pas ${n + n}`), ok(within(n, spans[level]), `${n} hors de la plage du niveau ${level}`));
  }
  m = new RegExp(`^Écris la moitié de (${NUMBER})\\.$`).exec(exo.prompt);
  if (m) {
    const n = num(m[1]);
    const spans: Record<GameLevel, [number, number]> = { 1: [12, 98], 2: [100, 998], 3: [1000, 9998], 4: [10000, 99998] };
    return all(ok(n % 2 === 0 && answer * 2 === n, `${exo.prompt} : ${answer}`), ok(within(n, spans[level]), `${n} hors de la plage du niveau ${level}`));
  }
  m = new RegExp(`^Écris le plus petit multiple de (\\d+) supérieur à (${NUMBER})\\.$`).exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const d = Number(m[1]);
  const n = num(m[2]);
  let expected = n + 1;
  while (expected % d !== 0) expected += 1;
  const allowed: Record<GameLevel, number[]> = { 1: [], 2: [6, 7, 8, 9], 3: [7, 8, 9, 11, 12], 4: [12, 15, 25] };
  const spans: Record<GameLevel, [number, number]> = { 1: [0, 0], 2: [30, 120], 3: [100, 500], 4: [200, 999] };
  return all(
    ok(answer === expected, `${exo.prompt} : ${answer}, pas ${expected}`),
    ok(n % d !== 0, `${n} est déjà un multiple de ${d}`),
    ok(allowed[level].includes(d), `le nombre ${d} au niveau ${level}`),
    ok(within(n, spans[level]), `${n} hors de la plage du niveau ${level}`),
  );
};

const checkLinks: Check = (exo) => {
  if (exo.prompt !== "Relie chaque calcul à son résultat.") return `énoncé inconnu : ${exo.prompt}`;
  const level = levelOf(exo);
  const pairs = pairsOf(exo).map((pair) => {
    const m = /^(\d) × (\d)$/.exec(pair.left);
    return m ? { a: Number(m[1]), b: Number(m[2]), result: num(pair.right) } : null;
  });
  if (pairs.some((pair) => pair === null)) return `un calcul illisible : ${pairsOf(exo).map((pair) => pair.left).join(", ")}`;
  const rows = pairs as { a: number; b: number; result: number }[];
  return all(
    ok(rows.length === 3, "trois calculs"),
    ok(rows.every((row) => row.a * row.b === row.result), `un résultat faux : ${pairsOf(exo).map((pair) => `${pair.left} ~ ${pair.right}`).join(" ; ")}`),
    ok(new Set(rows.map((row) => row.result)).size === 3, "deux calculs de même résultat"),
    ok(new Set(rows.map((row) => factOf(row.a, row.b))).size === 3, "deux fois le même fait"),
    ok(rows.every((row) => inTables(row.a, row.b, level)), `un calcul hors des tables du niveau ${level}`),
  );
};

const checkOrder: Check = (exo) => {
  const ascending = exo.prompt === "Range ces calculs du plus petit au plus grand résultat.";
  const descending = exo.prompt === "Range ces calculs du plus grand au plus petit résultat.";
  if (ascending === descending) return `énoncé inconnu : ${exo.prompt}`;
  const level = levelOf(exo);
  const rows = sequenceOf(exo).map((tile) => {
    const m = /^(\d) × (\d)$/.exec(tile);
    return m ? { a: Number(m[1]), b: Number(m[2]) } : null;
  });
  if (rows.some((row) => row === null)) return `un calcul illisible : ${sequenceOf(exo).join(", ")}`;
  const products = (rows as { a: number; b: number }[]).map((row) => row.a * row.b);
  const sorted = [...products].sort((x, y) => (ascending ? x - y : y - x));
  return all(
    ok(new Set(products).size === 4, "quatre résultats différents"),
    ok(JSON.stringify(products) === JSON.stringify(sorted), `${exo.prompt} ${sequenceOf(exo).join(" / ")}`),
    ok(level >= 2 || ascending, "du plus grand au plus petit au premier palier"),
    ok((rows as { a: number; b: number }[]).every((row) => inTables(row.a, row.b, level)), `un calcul hors des tables du niveau ${level}`),
    ok(new Set((rows as { a: number; b: number }[]).map((row) => factOf(row.a, row.b))).size === 4, "deux fois le même fait"),
  );
};

/** Les faits de table qu'un exercice pose : un palier ne pose jamais deux fois le même (6 × 7 et 7 × 6 sont le même fait). */
function asked(exo: Exo): string[] | null {
  const kind = (exo.payload.game as { kind: string }).kind;
  const fact = (text: string) => {
    const m = /(\d) × (\d)/.exec(text);
    return m ? factOf(Number(m[1]), Number(m[2])) : null;
  };
  if (kind === "cm1-dbl-fois") return [fact(exo.prompt)!];
  if (kind === "cm1-dbl-relier") return pairsOf(exo).map((pair) => fact(pair.left)!);
  if (kind === "cm1-dbl-ordre") return sequenceOf(exo).map((tile) => fact(tile)!);
  return null;
}

const TOPIC_KINDS = {
  "ma-cm1-divisibilite": ["critere", "glisser", "chiffre", "multiple", "suite", "fois", "dix", "ecrire", "relier", "ordre"].map((k) => `cm1-dbl-${k}`),
};

defineMathsTests({
  label: "de la divisibilité du CM1",
  checks: {
    "cm1-dbl-critere": checkCriterion,
    "cm1-dbl-glisser": checkSort,
    "cm1-dbl-chiffre": checkDigit,
    "cm1-dbl-multiple": checkMultiple,
    "cm1-dbl-suite": checkSuite,
    "cm1-dbl-fois": checkTimes,
    "cm1-dbl-dix": checkTen,
    "cm1-dbl-ecrire": checkWrite,
    "cm1-dbl-relier": checkLinks,
    "cm1-dbl-ordre": checkOrder,
  },
  topicKinds: TOPIC_KINDS,
  asked,
});

describe("les vérifications de la divisibilité voient un énoncé abîmé", () => {
  const qcm = (prompt: string, options: string[], correctIndex: number, level: number) =>
    ({ type: "qcm", prompt, answerKey: options[correctIndex], hints: [], payload: { options, correctIndex, game: { kind: "x", level } } }) as Exo;
  const gap = (text: string, options: string[], answer: string, level: number) =>
    ({ type: "fill-blank", prompt: "x", answerKey: answer, hints: [], payload: { text, blanks: [{ options, answer }], game: { kind: "x", level } } }) as Exo;

  it("deux nombres divisibles dans un QCM, ou un nombre divisible par trois mais pas par neuf, sont refusés", () => {
    expect(checkCriterion(qcm("Lequel de ces nombres est divisible par 9 ?", ["225", "124", "338"], 0, 2))).toBeNull();
    expect(checkCriterion(qcm("Lequel de ces nombres est divisible par 9 ?", ["225", "126", "338"], 0, 2))).not.toBeNull();
    expect(checkCriterion(qcm("Lequel de ces nombres est divisible par 9 ?", ["225", "123", "338"], 1, 2))).not.toBeNull();
    expect(checkCriterion(qcm("Lequel de ces nombres est divisible par 3 ?", ["225", "126", "338"], 0, 2))).not.toBeNull();
    expect(checkCriterion(qcm("Lequel de ces nombres n'est pas divisible par 5 ?", ["225", "130", "338"], 2, 2))).toBeNull();
    expect(checkCriterion(qcm("Lequel de ces nombres n'est pas divisible par 5 ?", ["225", "130", "338"], 0, 2))).not.toBeNull();
  });

  it("un trou à deux chiffres qui conviennent est refusé (zéro et neuf pour neuf), comme une mauvaise réponse", () => {
    expect(checkDigit(gap("4___5 est divisible par 9.", ["0", "9", "3"], "0", 2))).not.toBeNull();
    expect(checkDigit(gap("4___5 est divisible par 9.", ["0", "2", "3"], "0", 2))).toBeNull();
    expect(checkDigit(gap("4___5 est divisible par 9.", ["0", "2", "3"], "2", 2))).not.toBeNull();
    expect(checkDigit(gap("41___ est divisible par 5.", ["0", "2", "3"], "0", 1))).toBeNull();
    expect(checkDigit(gap("41___ est divisible par 5.", ["0", "2", "3"], "2", 1))).not.toBeNull();
    expect(checkDigit(gap("4___1 est divisible par 5.", ["0", "2", "3"], "0", 1))).not.toBeNull();
  });

  it("deux multiples dans un QCM, ou une table hors du palier, sont refusés", () => {
    expect(checkMultiple(qcm("Lequel de ces nombres est un multiple de 7 ?", ["56", "57", "55"], 0, 2))).toBeNull();
    expect(checkMultiple(qcm("Lequel de ces nombres est un multiple de 7 ?", ["56", "63", "55"], 0, 2))).not.toBeNull();
    expect(checkTimes(qcm("Combien font 2 × 3 ?", ["6", "5", "8"], 0, 4))).toBeNull();
    expect(checkTimes(qcm("Combien font 2 × 3 ?", ["6", "5", "8"], 0, 2))).not.toBeNull();
  });

  it("un produit par dix, cent, mille : un zéro de trop est refusé", () => {
    expect(checkTen(gap("45 × 100 = ___", ["4 500", "450", "45 000"], "4 500", 2))).toBeNull();
    expect(checkTen(gap("45 × 100 = ___", ["4 500", "450", "45 000"], "450", 2))).not.toBeNull();
    expect(checkTen(gap("40 × 30 = ___", ["1 200", "120", "12 000"], "1 200", 3))).toBeNull();
    expect(checkTen(gap("40 × 30 = ___", ["1 200", "120", "12 000"], "12 000", 3))).not.toBeNull();
  });
});
