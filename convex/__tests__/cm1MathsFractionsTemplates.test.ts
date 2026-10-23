import { describe, expect, it } from "vitest";
import { readFraction } from "../paliers/games/fractionsCm1";
import type { GameLevel } from "../paliers/games/shared";
import { acceptedOf, all, blankOf, defineMathsTests, itemsOf, levelOf, num, ok, optionsOf, pairsOf, rightOption, sequenceOf, textOf, wrongOf, zonesOf, type Check, type Exo } from "@/lib/test-support/cm1MathsKit";

/**
 * LES FRACTIONS DU CM1 (`ma-cm1-fractions`).
 *
 * Chaque test RECALCULE la réponse avec sa propre arithmétique : la lecture d'une fraction (une table à part, un nombre du haut écrit en lettres par une autre
 * fonction que celle du gabarit), la comparaison par produit en croix, l'égalité de deux fractions, la conversion des unités par leur poids. Un gabarit dont
 * la réponse contredit sa règle, ou dont un mauvais choix a la même valeur que la bonne réponse, échoue. Le niveau 2 est celui des paliers 2 et 3.
 */

// ===========================================================================
// LA LECTURE, ÉCRITE À PART
// ===========================================================================

const SMALL = ["zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"];
const TENS = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante"];

/** Un nombre de 1 à 99 en lettres, devant le nom des parts : « quatre-vingts centièmes » garde son s. */
function say(n: number): string {
  if (n < 20) return SMALL[n];
  const tens = Math.floor(n / 10);
  const units = n % 10;
  if (tens <= 6) return units === 0 ? TENS[tens] : units === 1 ? `${TENS[tens]} et un` : `${TENS[tens]}-${SMALL[units]}`;
  if (tens === 7) return units === 1 ? "soixante et onze" : `soixante-${SMALL[10 + units]}`;
  if (tens === 8) return units === 0 ? "quatre-vingts" : `quatre-vingt-${SMALL[units]}`;
  return `quatre-vingt-${SMALL[10 + units]}`;
}

/** Le nom des parts, au singulier et au pluriel : « tiers » ne change pas. */
const PARTS: Record<number, [string, string]> = {
  2: ["demi", "demis"],
  3: ["tiers", "tiers"],
  4: ["quart", "quarts"],
  5: ["cinquième", "cinquièmes"],
  6: ["sixième", "sixièmes"],
  7: ["septième", "septièmes"],
  8: ["huitième", "huitièmes"],
  9: ["neuvième", "neuvièmes"],
  10: ["dixième", "dixièmes"],
  11: ["onzième", "onzièmes"],
  12: ["douzième", "douzièmes"],
  100: ["centième", "centièmes"],
};

const reading = (n: number, d: number) => `${say(n)} ${PARTS[d][n > 1 ? 1 : 0]}`;

/** Toutes les lectures possibles, de 1 à 99 en haut et de 2 à 12 ou 100 en bas : de quoi retrouver la fraction d'une lecture. */
const READINGS = new Map<string, { n: number; d: number }>();
for (const d of Object.keys(PARTS).map(Number)) for (let n = 1; n <= 99; n++) READINGS.set(reading(n, d), { n, d });

type Frac = { n: number; d: number };
/** a/b contre c/d par le produit en croix. */
const cmp = (a: Frac, b: Frac) => a.n * b.d - b.n * a.d;
const parse = (text: string): Frac | null => {
  const m = /^(\d+)\/(\d+)$/.exec(text);
  return m ? { n: Number(m[1]), d: Number(m[2]) } : null;
};
const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

const READ_DENOMINATORS: Record<GameLevel, number[]> = { 1: [2, 3, 4, 5], 2: [3, 4, 5, 6, 7, 8, 9, 10], 3: [6, 7, 8, 9, 10, 11, 12, 100], 4: [7, 8, 9, 10, 11, 12, 100] };
const COMPARE_DENOMINATORS: Record<GameLevel, number[]> = { 1: [3, 4, 5, 6], 2: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], 3: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], 4: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] };
const PART_DENOMINATORS: Record<GameLevel, number[]> = { 1: [4, 6, 8], 2: [3, 4, 5, 6, 7, 8, 9, 10], 3: [6, 7, 8, 9, 10, 11, 12], 4: [8, 9, 10, 11, 12] };

/** Une fraction à lire : plus petite que 1, un demi n'a que un en haut, les centièmes vont jusqu'à 99. */
const readable = (f: Frac, level: GameLevel) => READ_DENOMINATORS[level].includes(f.d) && f.n >= 1 && f.n < f.d && (f.d !== 2 || f.n === 1);

const checkRead: Check = (exo) => {
  const m = /^Lis la fraction (\d+)\/(\d+)\. Comment se dit-elle \?$/.exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const f = { n: Number(m[1]), d: Number(m[2]) };
  const wrongFractions = wrongOf(exo).map((option) => READINGS.get(option));
  return all(
    ok(rightOption(exo) === reading(f.n, f.d), `${exo.prompt} : ${rightOption(exo)}, pas ${reading(f.n, f.d)}`),
    ok(readable(f, levelOf(exo)), `${f.n}/${f.d} n'est pas à lire au niveau ${levelOf(exo)}`),
    // Une mauvaise lecture peut n'être celle d'aucune fraction (« huit troisièmes » : les deux nombres à l'envers) ; sinon elle dit une autre fraction.
    ok(wrongFractions.every((other) => other === undefined || cmp(other, f) !== 0), `un mauvais choix de même valeur : ${optionsOf(exo).join(" / ")}`),
    ok(f.d !== 2 || !optionsOf(exo).some((option) => /^(deux|trois|quatre) demis/.test(option)), "un « deux demis » proposé"),
  );
};

const checkWrite: Check = (exo) => {
  const m = /^Écris la fraction « (.+) »\.$/.exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const f = READINGS.get(m[1]);
  if (!f) return `lecture inconnue : ${m[1]}`;
  return all(
    ok(exo.answerKey === `${f.n}/${f.d}`, `${exo.prompt} : ${exo.answerKey}, pas ${f.n}/${f.d}`),
    ok(acceptedOf(exo).length === 1 && acceptedOf(exo)[0] === exo.answerKey, "la réponse admise n'est pas la clé"),
    ok(readable(f, levelOf(exo)), `${f.n}/${f.d} n'est pas à écrire au niveau ${levelOf(exo)}`),
  );
};

const checkLinks: Check = (exo) => {
  if (exo.prompt !== "Relie chaque fraction à sa lecture.") return `énoncé inconnu : ${exo.prompt}`;
  const rows = pairsOf(exo).map((pair) => ({ f: parse(pair.left), right: pair.right }));
  if (rows.some((row) => row.f === null)) return "une fraction illisible";
  return all(
    ok(rows.length === 3, "trois fractions"),
    ok(rows.every((row) => row.right === reading(row.f!.n, row.f!.d)), `une lecture fausse : ${pairsOf(exo).map((pair) => `${pair.left} ~ ${pair.right}`).join(" ; ")}`),
    ok(new Set(rows.map((row) => row.right)).size === 3, "deux fractions de même lecture"),
    ok(rows.every((row) => readable(row.f!, levelOf(exo))), `une fraction hors du niveau ${levelOf(exo)}`),
  );
};

const SHAPES: Record<string, boolean> = { "Un gâteau": false, "Une tablette de chocolat": true, "Une pizza": true, "Un pain": false };

const checkPart: Check = (exo) => {
  const m = /^(Un gâteau|Une tablette de chocolat|Une pizza|Un pain) est coupé(e?) en (\d+) parts égales\. On en mange (\d+)\. Quelle fraction (a-t-on mangée|reste-t-il) \?$/.exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const [d, n] = [Number(m[3]), Number(m[4])];
  const rest = m[5] === "reste-t-il";
  const expected = rest ? `${d - n}/${d}` : `${n}/${d}`;
  const level = levelOf(exo);
  return all(
    ok((m[2] === "e") === SHAPES[m[1]], `« ${m[1]} est coupé${m[2]} » : le genre ne s'accorde pas`),
    ok(rightOption(exo) === expected, `${exo.prompt} : ${rightOption(exo)}, pas ${expected}`),
    ok(n >= 1 && n < d && n * 2 !== d, `${n} parts sur ${d}`),
    ok(PART_DENOMINATORS[level].includes(d), `${d} parts au niveau ${level}`),
    ok(!rest || level >= 2, "« reste-t-il » au premier palier"),
    ok(wrongOf(exo).every((option) => parse(option) !== null && cmp(parse(option)!, parse(expected)!) !== 0 && !option.endsWith("/1")), `un mauvais choix de même valeur ou en « /1 » : ${optionsOf(exo).join(" / ")}`),
  );
};

/** Les fractions à comparer sont toutes plus petites que 1, de valeurs différentes. */
function comparable(list: Frac[], level: GameLevel): string | null {
  return all(
    ok(list.every((f) => f.n >= 1 && f.n < f.d), "une fraction qui n'est pas plus petite que 1"),
    ok(list.every((f) => COMPARE_DENOMINATORS[level].includes(f.d)), `un dénominateur hors du niveau ${level}`),
    ok(list.every((a, i) => list.every((b, j) => i === j || cmp(a, b) !== 0)), "deux fractions de même valeur"),
    ok(level !== 1 || list.every((f) => f.d === list[0].d), "au premier palier, même nombre du bas"),
  );
}

const checkCompare: Check = (exo) => {
  const m = /^Quelle est la (plus grande|plus petite) de ces fractions \?$/.exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const list = optionsOf(exo).map(parse);
  if (list.some((f) => f === null)) return "une fraction illisible";
  const fractions = list as Frac[];
  const best = fractions.reduce((a, b) => ((cmp(a, b) > 0) === (m[1] === "plus grande") ? a : b));
  return all(
    ok(rightOption(exo) === `${best.n}/${best.d}`, `${exo.prompt} ${optionsOf(exo).join(", ")} : ${rightOption(exo)}`),
    comparable(fractions, levelOf(exo)),
  );
};

const checkOrder: Check = (exo) => {
  const ascending = exo.prompt === "Range ces fractions de la plus petite à la plus grande.";
  const descending = exo.prompt === "Range ces fractions de la plus grande à la plus petite.";
  if (ascending === descending) return `énoncé inconnu : ${exo.prompt}`;
  const list = sequenceOf(exo).map(parse);
  if (list.some((f) => f === null)) return "une fraction illisible";
  const fractions = list as Frac[];
  const sorted = [...fractions].sort((a, b) => (ascending ? cmp(a, b) : cmp(b, a)));
  const level = levelOf(exo);
  return all(
    ok(fractions.length === 4, "quatre fractions"),
    ok(JSON.stringify(fractions) === JSON.stringify(sorted), `${exo.prompt} ${sequenceOf(exo).join(" / ")}`),
    ok(level >= 2 || ascending, "de la plus grande à la plus petite au premier palier"),
    comparable(fractions, level),
  );
};

const checkOne: Check = (exo) => {
  const m = /^Quelle fraction est (plus petite que|égale à|plus grande que) 1 \?$/.exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const list = optionsOf(exo).map(parse);
  if (list.some((f) => f === null)) return "une fraction illisible";
  const fractions = list as Frac[];
  const status = (f: Frac) => (f.n < f.d ? "plus petite que" : f.n === f.d ? "égale à" : "plus grande que");
  const matching = fractions.filter((f) => status(f) === m[1]);
  const level = levelOf(exo);
  return all(
    ok(matching.length === 1 && rightOption(exo) === `${matching[0].n}/${matching[0].d}`, `${exo.prompt} ${optionsOf(exo).join(", ")} : ${matching.length} fractions répondent (réponse ${rightOption(exo)})`),
    ok(fractions.every((f) => COMPARE_DENOMINATORS[level].includes(f.d) && f.n >= 1 && f.n < 2 * f.d), `une fraction hors du niveau ${level}`),
  );
};

const checkSort: Check = (exo) => {
  const [low, high] = zonesOf(exo);
  const m = /^Plus petite que (1|1\/2)$/.exec(low);
  if (!m || high !== `Plus grande que ${m[1]}`) return `cases inconnues : ${zonesOf(exo).join(" / ")}`;
  const threshold = parse(m[1] === "1" ? "1/1" : "1/2")!;
  const level = levelOf(exo);
  const each = level === 1 ? 2 : 3;
  const items = itemsOf(exo).map((item) => ({ ...item, f: parse(item.text) }));
  if (items.some((item) => item.f === null)) return "une fraction illisible";
  const wrongPlace = items.find((item) => item.correctZone !== (cmp(item.f!, threshold) < 0 ? low : high));
  return all(
    ok(!wrongPlace, `${wrongPlace?.text} n'est pas dans la bonne case (${low})`),
    ok(items.every((item) => cmp(item.f!, threshold) !== 0), "une fraction égale au seuil"),
    ok(items.filter((item) => item.correctZone === low).length === each && items.filter((item) => item.correctZone === high).length === each, `${each} fractions par case`),
    ok(m[1] === "1" || level >= 2, "le seuil un demi au premier palier"),
    ok(items.every((item) => COMPARE_DENOMINATORS[level].includes(item.f!.d) && item.f!.n >= 1), `une fraction hors du niveau ${level}`),
    ok(new Set(items.map((item) => item.text)).size === items.length, "deux fois la même fraction"),
  );
};

const checkEqual: Check = (exo) => {
  const text = textOf(exo);
  const level = levelOf(exo);
  const blank = blankOf(exo);
  let base: Frac;
  let form: "haut" | "bas" | "reduire";
  let fits: (candidate: number) => boolean;
  let reducedOk: boolean;
  let m = /^(\d+)\/(\d+) = ___\/(\d+)$/.exec(text);
  if (m) {
    base = { n: Number(m[1]), d: Number(m[2]) };
    const c = Number(m[3]);
    fits = (x) => base.n * c === x * base.d;
    // Un bas qui grandit : la fraction de départ est irréductible. Un bas qui rapetisse : on réduit, et la fraction cherchée est irréductible.
    form = c > base.d ? "haut" : "reduire";
    reducedOk = form === "haut" ? gcd(base.n, base.d) === 1 : gcd(base.n, base.d) > 1 && gcd(Number(blank.answer), c) === 1;
  } else if ((m = /^(\d+)\/(\d+) = (\d+)\/___$/.exec(text))) {
    base = { n: Number(m[1]), d: Number(m[2]) };
    const c = Number(m[3]);
    fits = (x) => base.n * x === c * base.d;
    form = "bas";
    reducedOk = gcd(base.n, base.d) === 1;
  } else return `phrase inconnue : ${text}`;
  return all(
    ok(blank.options.filter((option) => fits(Number(option))).length === 1 && fits(Number(blank.answer)), `${text} : ${blank.options.length} choix, réponse ${blank.answer}`),
    ok(reducedOk, `${text} : la fraction de départ ou la fraction cherchée n'est pas à la bonne forme`),
    ok(base.n < base.d, "une fraction qui n'est pas plus petite que 1"),
    ok(level >= 2 || form === "haut", `la forme ${form} au premier palier`),
  );
};

/** Le poids d'une unité : une unité vaut dix dixièmes, un dixième dix centièmes. */
const WEIGHT: Record<string, number> = { unités: 100, dixièmes: 10, centièmes: 1 };
const UNIT_PAIRS: Record<GameLevel, string[]> = {
  1: ["unités>dixièmes"],
  2: ["unités>dixièmes", "dixièmes>centièmes", "unités>centièmes", "dixièmes>unités"],
  3: ["unités>dixièmes", "dixièmes>centièmes", "unités>centièmes", "centièmes>dixièmes", "dixièmes>unités"],
  4: ["unités>centièmes", "centièmes>dixièmes", "dixièmes>unités", "dixièmes>centièmes"],
};

const checkUnits: Check = (exo) => {
  const m = /^(\d+) (unités|dixièmes|centièmes) = ___ (unités|dixièmes|centièmes)$/.exec(textOf(exo));
  if (!m) return `phrase inconnue : ${textOf(exo)}`;
  const shown = Number(m[1]);
  const total = shown * WEIGHT[m[2]];
  const answer = total / WEIGHT[m[3]];
  const level = levelOf(exo);
  return all(
    ok(Number.isInteger(answer) && num(blankOf(exo).answer) === answer, `${textOf(exo)} : ${blankOf(exo).answer}, pas ${answer}`),
    ok(UNIT_PAIRS[level].includes(`${m[2]}>${m[3]}`), `le passage ${m[2]} vers ${m[3]} au niveau ${level}`),
    ok(blankOf(exo).options.every((option) => option === blankOf(exo).answer || num(option) !== answer), "un mauvais choix égal à la réponse"),
    ok(shown >= 2, "un seul à convertir"),
  );
};

/** Les fractions lues ou écrites qu'un palier ne pose jamais deux fois. */
function asked(exo: Exo): string[] | null {
  const kind = (exo.payload.game as { kind: string }).kind;
  if (kind === "cm1-frc-lire") {
    const m = /^Lis la fraction (\d+\/\d+)\. Comment se dit-elle \?$/.exec(exo.prompt);
    return m ? [m[1]] : null;
  }
  if (kind === "cm1-frc-ecrire") return [exo.answerKey];
  if (kind === "cm1-frc-relier") return pairsOf(exo).map((pair) => pair.left);
  return null;
}

const TOPIC_KINDS = {
  "ma-cm1-fractions": ["lire", "ecrire", "relier", "part", "comparer", "ordre", "un", "glisser", "egale", "unites"].map((k) => `cm1-frc-${k}`),
};

defineMathsTests({
  label: "des fractions du CM1",
  checks: {
    "cm1-frc-lire": checkRead,
    "cm1-frc-ecrire": checkWrite,
    "cm1-frc-relier": checkLinks,
    "cm1-frc-part": checkPart,
    "cm1-frc-comparer": checkCompare,
    "cm1-frc-ordre": checkOrder,
    "cm1-frc-un": checkOne,
    "cm1-frc-glisser": checkSort,
    "cm1-frc-egale": checkEqual,
    "cm1-frc-unites": checkUnits,
  },
  topicKinds: TOPIC_KINDS,
  asked,
});

describe("la lecture des fractions", () => {
  it("lit comme à l'école : un demi, un tiers, un quart, deux tiers, trois quarts, et le s des ordinaux seulement au-dessus de un", () => {
    const table: [number, number, string][] = [
      [1, 2, "un demi"],
      [1, 3, "un tiers"],
      [2, 3, "deux tiers"],
      [1, 4, "un quart"],
      [3, 4, "trois quarts"],
      [1, 5, "un cinquième"],
      [3, 8, "trois huitièmes"],
      [7, 10, "sept dixièmes"],
      [11, 12, "onze douzièmes"],
      [1, 100, "un centième"],
      [23, 100, "vingt-trois centièmes"],
      [21, 100, "vingt et un centièmes"],
      [71, 100, "soixante et onze centièmes"],
      [80, 100, "quatre-vingts centièmes"],
      [99, 100, "quatre-vingt-dix-neuf centièmes"],
    ];
    for (const [n, d, text] of table) {
      expect(reading(n, d), `table de ${n}/${d}`).toBe(text);
      expect(readFraction(n, d), `readFraction(${n}, ${d})`).toBe(text);
    }
  });

  it("écrit la même lecture que la table du test pour toutes les fractions lues par le gabarit", () => {
    for (const d of [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 100]) for (let n = 1; n <= 99; n++) expect(readFraction(n, d), `${n}/${d}`).toBe(reading(n, d));
  });

  it("ne donne jamais deux fois la même lecture à deux fractions de même dénominateur", () => {
    expect(new Set([...READINGS.keys()]).size).toBe(READINGS.size);
  });
});

describe("les vérifications des fractions voient un énoncé abîmé", () => {
  const qcm = (prompt: string, options: string[], correctIndex: number, level: number) =>
    ({ type: "qcm", prompt, answerKey: options[correctIndex], hints: [], payload: { options, correctIndex, game: { kind: "x", level } } }) as Exo;
  const gap = (text: string, options: string[], answer: string, level: number) =>
    ({ type: "fill-blank", prompt: "x", answerKey: answer, hints: [], payload: { text, blanks: [{ options, answer }], game: { kind: "x", level } } }) as Exo;

  it("trois huit n'est pas une lecture, deux demis non plus ; 3/8 se lit trois huitièmes", () => {
    expect(checkRead(qcm("Lis la fraction 3/8. Comment se dit-elle ?", ["trois huitièmes", "huit troisièmes", "trois neuvièmes"], 0, 3))).toBeNull();
    expect(checkRead(qcm("Lis la fraction 3/8. Comment se dit-elle ?", ["trois huitièmes", "huit troisièmes", "trois neuvièmes"], 1, 3))).not.toBeNull();
    expect(checkRead(qcm("Lis la fraction 3/8. Comment se dit-elle ?", ["trois huit", "huit troisièmes", "trois neuvièmes"], 0, 3))).not.toBeNull();
  });

  it("3/8 est plus petit que 3/4 : la plus grande des deux est 3/4", () => {
    expect(checkCompare(qcm("Quelle est la plus grande de ces fractions ?", ["3/4", "3/8", "3/10"], 0, 2))).toBeNull();
    expect(checkCompare(qcm("Quelle est la plus grande de ces fractions ?", ["3/4", "3/8", "3/10"], 1, 2))).not.toBeNull();
    expect(checkCompare(qcm("Quelle est la plus petite de ces fractions ?", ["3/4", "3/8", "3/10"], 2, 2))).toBeNull();
  });

  it("deux fractions de même valeur ne sont pas proposées ensemble ; une seule fraction répond à « égale à 1 »", () => {
    expect(checkCompare(qcm("Quelle est la plus grande de ces fractions ?", ["1/2", "2/4", "1/3"], 0, 3))).not.toBeNull();
    expect(checkOne(qcm("Quelle fraction est égale à 1 ?", ["4/4", "3/4", "5/4"], 0, 2))).toBeNull();
    expect(checkOne(qcm("Quelle fraction est égale à 1 ?", ["4/4", "3/3", "5/4"], 0, 2))).not.toBeNull();
    expect(checkOne(qcm("Quelle fraction est plus grande que 1 ?", ["4/4", "3/4", "5/4"], 2, 2))).toBeNull();
  });

  it("des fractions égales : un seul choix égale la fraction de départ, et l'addition en haut et en bas est refusée", () => {
    expect(checkEqual(gap("3/4 = ___/8", ["6", "7", "5"], "6", 2))).toBeNull();
    expect(checkEqual(gap("3/4 = ___/8", ["6", "7", "5"], "7", 2))).not.toBeNull();
    expect(checkEqual(gap("2/5 = 4/___", ["10", "9", "7"], "10", 2))).toBeNull();
    expect(checkEqual(gap("2/4 = ___/8", ["4", "5", "3"], "4", 2))).not.toBeNull();
  });

  it("les unités : dix dixièmes font une unité, cent centièmes aussi", () => {
    expect(checkUnits(gap("3 unités = ___ dixièmes", ["30", "300", "33"], "30", 1))).toBeNull();
    expect(checkUnits(gap("3 unités = ___ dixièmes", ["30", "300", "33"], "300", 1))).not.toBeNull();
    expect(checkUnits(gap("40 centièmes = ___ dixièmes", ["4", "400", "44"], "4", 3))).toBeNull();
    expect(checkUnits(gap("40 centièmes = ___ dixièmes", ["4", "400", "44"], "400", 3))).not.toBeNull();
  });
});
