import { describe, expect, it } from "vitest";
import { wordsOfCm2 } from "../paliers/games/cm2MathsOutils";
import type { GameLevel } from "../paliers/games/shared";
import { acceptedOf, all, blankOf, defineMathsTests, fmt, itemsOf, levelOf, num, NUMBER, ok, optionsOf, pairsOf, rightOption, sequenceOf, textOf, wrongOf, zonesOf, type Check, type Exo } from "@/lib/test-support/cm1MathsKit";

/**
 * LES MILLIONS ET LES MILLIARDS DU CM2 (`ma-cm2-milliards`) : jusqu'à 999 999 999 999.
 *
 * Chaque test RECALCULE la bonne réponse avec sa propre arithmétique, écrite à part : le mot de chaque nombre (un autre algorithme que `wordsOfCm2`, et une
 * table de cas difficiles écrite à la main), l'arrondi de l'école compté en restes, la suite lue terme à terme, la plage de chaque palier. Un gabarit dont
 * la réponse contredit sa règle, ou qui sort de la plage de son palier, échoue.
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

/** Un nombre de 1 à 999 999 999 999 en lettres : « mille » ne prend jamais le s de « cents » devant lui ; « million » et « milliard » sont des noms qui le gardent. */
function words(n: number): string {
  const groups = [Math.floor(n / 1e9), Math.floor(n / 1e6) % 1000, Math.floor(n / 1e3) % 1000, n % 1000];
  const out: string[] = [];
  if (groups[0] > 0) out.push(groups[0] === 1 ? "un milliard" : `${underThousand(groups[0], true)} milliards`);
  if (groups[1] > 0) out.push(groups[1] === 1 ? "un million" : `${underThousand(groups[1], true)} millions`);
  if (groups[2] > 0) out.push(groups[2] === 1 ? "mille" : `${underThousand(groups[2], false)} mille`);
  if (groups[3] > 0) out.push(underThousand(groups[3], true));
  return out.join(" ");
}

/** Des cas où l'on se trompe, écrits à la main. */
const TRICKY_WORDS: [number, string][] = [
  [1000000, "un million"],
  [2000000, "deux millions"],
  [200000000, "deux cents millions"],
  [280000000, "deux cent quatre-vingts millions"],
  [80000000, "quatre-vingts millions"],
  [81000000, "quatre-vingt-un millions"],
  [200000, "deux cent mille"],
  [80000, "quatre-vingt mille"],
  [280000, "deux cent quatre-vingt mille"],
  [1000000000, "un milliard"],
  [2000000000, "deux milliards"],
  [3200000000, "trois milliards deux cents millions"],
  [1001000000, "un milliard un million"],
  [1000001000, "un milliard mille"],
  [4080000000, "quatre milliards quatre-vingts millions"],
  [10000000000, "dix milliards"],
  [200000000000, "deux cents milliards"],
  [280000000000, "deux cent quatre-vingts milliards"],
  [999999999999, "neuf cent quatre-vingt-dix-neuf milliards neuf cent quatre-vingt-dix-neuf millions neuf cent quatre-vingt-dix-neuf mille neuf cent quatre-vingt-dix-neuf"],
  [71000000000, "soixante et onze milliards"],
  [91000000, "quatre-vingt-onze millions"],
  [345000000, "trois cent quarante-cinq millions"],
  [6780071000, "six milliards sept cent quatre-vingts millions soixante et onze mille"],
];

describe("les mots des grands nombres", () => {
  it("la table de cas difficiles est lue juste par l'algorithme du test", () => {
    for (const [n, text] of TRICKY_WORDS) expect(words(n), String(n)).toBe(text);
  });
  it("wordsOfCm2 donne les mêmes mots que l'algorithme du test, pour des milliers de nombres", () => {
    let seed = 12345;
    const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
    for (let i = 0; i < 3000; i++) {
      const digits = 1 + Math.floor(rnd() * 12);
      const n = Math.max(1, Math.floor(rnd() * 10 ** digits));
      expect(wordsOfCm2(n), String(n)).toBe(words(n));
    }
    for (const [n] of TRICKY_WORDS) expect(wordsOfCm2(n), String(n)).toBe(words(n));
  });
});

// ===========================================================================
// LA PLAGE DE CHAQUE PALIER
// ===========================================================================

/** Le niveau 1 est le palier 1 ; le niveau 2 les paliers 2 et 3 ; le niveau 3 le palier 4 ; le niveau 4 le palier 5. */
const LO: Record<GameLevel, number> = { 1: 1000000, 2: 10000000, 3: 1000000000, 4: 10000000000 };
const TOP: Record<GameLevel, number> = { 1: 9999999, 2: 999999999, 3: 9999999999, 4: 999999999999 };
const CAP = 999999999999;
const inLevel = (n: number, level: GameLevel) => n >= LO[level] && n <= TOP[level];

const RANKS = ["unités", "dizaines", "centaines", "milliers", "dizaines de mille", "centaines de mille", "millions", "dizaines de millions", "centaines de millions", "milliards", "dizaines de milliards", "centaines de milliards"];

/** Un nombre est « de la plage » du niveau quand tous ses chiffres sont non nuls (pour les gabarits qui le veulent). */
const noZero = (n: number) => !String(n).includes("0");

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
    ok(level === 1 || new Set(values.map((value) => String(value)[0])).size === 1, "dès le deuxième palier, les nombres partagent leur premier chiffre"),
  );
};

const checkOrder: Check = (exo) => {
  const m = /^Mets ces nombres dans l'ordre, du (plus petit au plus grand|plus grand au plus petit)\.$/.exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const values = sequenceOf(exo).map(num);
  const level = levelOf(exo);
  const ascending = m[1].startsWith("plus petit");
  return all(
    ok(values.length === 4 && new Set(values).size === 4, "quatre nombres différents"),
    ok(values.every((value, i) => i === 0 || (ascending ? value > values[i - 1] : value < values[i - 1])), `${exo.prompt} : ${sequenceOf(exo).join(" ")}`),
    ok(values.every((value) => inLevel(value, level)), `un nombre hors de la plage du niveau ${level}`),
    ok(level === 1 || new Set(values.map((value) => String(value)[0])).size === 1, "dès le deuxième palier, les nombres partagent leur premier chiffre"),
    ok(level >= 2 || ascending, "à rebours au premier palier"),
  );
};

const checkDigits: Check = (exo) => {
  const level = levelOf(exo);
  let m = new RegExp(`^Quel est le chiffre des (${RANKS.join("|")}) de (${NUMBER}) \\?$`).exec(exo.prompt);
  if (m) {
    const rank = RANKS.indexOf(m[1]);
    const digits = String(num(m[2]));
    return all(
      ok(rank >= 0 && rank < digits.length, `le rang ${m[1]} n'existe pas dans ${m[2]}`),
      ok(rightOption(exo) === digits[digits.length - 1 - rank], `${exo.prompt} : ${rightOption(exo)}, pas ${digits[digits.length - 1 - rank]}`),
      ok(wrongOf(exo).every((option) => /^\d$/.test(option)), "des chiffres pour mauvais choix"),
      ok(inLevel(num(m[2]), level) && noZero(num(m[2])), `${m[2]} hors de la plage du niveau ${level} ou avec un zéro`),
    );
  }
  m = new RegExp(`^Dans (${NUMBER}), quelle est la valeur du chiffre (\\d) \\?$`).exec(exo.prompt);
  if (m) {
    const text = String(num(m[1]));
    const digit = m[2];
    const rank = text.length - 1 - text.indexOf(digit);
    return all(
      ok(text.split(digit).length === 2, `le chiffre ${digit} n'est pas seul dans ${m[1]}`),
      ok(num(rightOption(exo)) === Number(digit) * 10 ** rank, `${exo.prompt} : ${rightOption(exo)}`),
      ok(level >= 2, "la valeur d'un chiffre au premier palier"),
      ok(inLevel(num(m[1]), level) && noZero(num(m[1])), `${m[1]} hors de la plage du niveau ${level} ou avec un zéro`),
    );
  }
  m = new RegExp(`^Dans (${NUMBER}), combien y a-t-il de (milliers|millions|milliards) en tout \\?$`).exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const n = num(m[1]);
  const rank = RANKS.indexOf(m[2]);
  return all(
    ok(num(rightOption(exo)) === Math.floor(n / 10 ** rank), `${exo.prompt} : ${rightOption(exo)}, pas ${Math.floor(n / 10 ** rank)}`),
    ok(level >= 2, "le nombre d'un rang au premier palier"),
    ok(Math.floor(n / 10 ** rank) >= 10, "au moins deux chiffres de rang : ce n'est pas le chiffre seul"),
    ok(inLevel(n, level) && noZero(n), `${m[1]} hors de la plage du niveau ${level} ou avec un zéro`),
  );
};

/** Le pas des suites de chaque niveau. */
const SEQUENCE_STEPS: Record<GameLevel, number[]> = {
  1: [100000, 500000, 1000000],
  2: [1000000, 5000000, 10000000, 50000000, 100000000],
  3: [100000000, 500000000, 1000000000],
  4: [1000000000, 5000000000, 10000000000, 100000000000],
};

const checkSequence: Check = (exo) => {
  const level = levelOf(exo);
  const blank = blankOf(exo);
  const terms = textOf(exo).split(", ");
  const hidden = terms.indexOf("___");
  const known = terms.map((t) => (t === "___" ? null : num(t)));
  const diffs = known.slice(1).map((value, i) => (value !== null && known[i] !== null ? value - (known[i] as number) : null)).filter((d): d is number => d !== null);
  const delta = diffs[0] ?? (((known[hidden + 1] as number) - (known[hidden - 1] as number)) / 2);
  const expected = (known[hidden - 1] as number) + delta;
  return all(
    ok(terms.length === 5 && hidden >= 1 && hidden <= 3, `la place du trou : ${textOf(exo)}`),
    ok(diffs.every((d) => d === delta), `un pas qui change : ${textOf(exo)}`),
    ok(num(blank.answer) === expected, `${textOf(exo)} : ${blank.answer}, pas ${expected}`),
    ok(SEQUENCE_STEPS[level].includes(Math.abs(delta)), `le pas ${delta} au niveau ${level}`),
    ok([...known, expected].every((t) => t === null || (t >= 1 && t <= CAP)), "un terme hors des nombres du CM2"),
    ok(blank.options.every((option) => /^\d[\d ]*$/.test(option) && num(option) >= 1 && num(option) <= CAP), `un choix hors des nombres du CM2 : ${blank.options.join(", ")}`),
    ok([...known, expected].every((t) => t === null || inLevel(t, level)), `un terme hors de la plage du niveau ${level} : ${textOf(exo)}`),
  );
};

const ROUND_LABELS: Record<string, number> = {
  "à la dizaine de mille la plus proche": 1e4,
  "à la centaine de mille la plus proche": 1e5,
  "au million le plus proche": 1e6,
  "à la dizaine de millions la plus proche": 1e7,
  "à la centaine de millions la plus proche": 1e8,
  "au milliard le plus proche": 1e9,
  "à la dizaine de milliards la plus proche": 1e10,
  "à la centaine de milliards la plus proche": 1e11,
};
const ROUND_SIZES: Record<GameLevel, number[]> = {
  1: [1e4, 1e5, 1e6],
  2: [1e5, 1e6, 1e7, 1e8],
  3: [1e7, 1e8, 1e9],
  4: [1e8, 1e9, 1e10, 1e11],
};

const checkRound: Check = (exo) => {
  const level = levelOf(exo);
  const m = new RegExp(`^Arrondis (${NUMBER}) (${Object.keys(ROUND_LABELS).join("|")})\\.$`).exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const n = num(m[1]);
  const size = ROUND_LABELS[m[2]];
  const rest = n % size;
  const expected = rest * 2 >= size ? n - rest + size : n - rest;
  return all(
    ok(num(rightOption(exo)) === expected, `${exo.prompt} : ${rightOption(exo)}, pas ${expected}`),
    ok(rest !== 0, `${n} est déjà rond à ${size}`),
    ok(ROUND_SIZES[level].includes(size), `l'unité ${size} au niveau ${level}`),
    ok(inLevel(n, level), `${n} hors de la plage du niveau ${level}`),
    ok(expected <= CAP, "un arrondi au-delà du plafond"),
    ok(wrongOf(exo).every((option) => num(option) % 10 === 0 && num(option) !== expected), "un mauvais choix égal à la bonne réponse ou non arrondi"),
  );
};

const checkWrite: Check = (exo) => {
  const level = levelOf(exo);
  const m = /^Écris en chiffres le nombre (.+)\.$/.exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const n = num(exo.answerKey);
  return all(
    ok(words(n) === m[1], `« ${m[1]} » n'est pas ${n} : ${words(n)}`),
    ok(acceptedOf(exo).join("|") === [fmt(n), String(n)].join("|"), `les écritures admises : ${acceptedOf(exo).join(" / ")}`),
    ok(inLevel(n, level), `${n} hors de la plage du niveau ${level}`),
    ok(String(n).replace(/0/g, "").length <= 4, "trop de chiffres non nuls pour la lecture"),
  );
};

const checkRead: Check = (exo) => {
  const level = levelOf(exo);
  const m = new RegExp(`^Comment lit-on (${NUMBER}) \\?$`).exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const n = num(m[1]);
  return all(
    ok(rightOption(exo) === words(n), `${exo.prompt} : « ${rightOption(exo)} », pas « ${words(n)} »`),
    ok(wrongOf(exo).every((option) => option !== words(n)), "un mauvais choix égal à la bonne lecture"),
    ok(inLevel(n, level), `${n} hors de la plage du niveau ${level}`),
  );
};

const checkCompute: Check = (exo) => {
  const level = levelOf(exo);
  let expected: number;
  let form: string;
  let big: number;
  let m = new RegExp(`^Calcule (${NUMBER}) \\+ (${NUMBER})\\.$`).exec(exo.prompt);
  if (m) {
    form = "somme";
    expected = num(m[1]) + num(m[2]);
    big = Math.max(num(m[1]), num(m[2]));
  } else if ((m = new RegExp(`^Calcule (${NUMBER}) - (${NUMBER})\\.$`).exec(exo.prompt))) {
    form = "difference";
    expected = num(m[1]) - num(m[2]);
    big = num(m[1]);
    if (expected <= 0) return "une différence nulle ou négative";
  } else if ((m = new RegExp(`^Combien font (${NUMBER}) × (${NUMBER}) \\?$`).exec(exo.prompt))) {
    form = "produit";
    expected = num(m[1]) * num(m[2]);
    big = expected;
    if (![10, 100, 1000].includes(num(m[2]))) return "un multiplicateur hors de 10, 100 et 1 000";
  } else if ((m = new RegExp(`^Combien font (${NUMBER}) ÷ (${NUMBER}) \\?$`).exec(exo.prompt))) {
    form = "quotient";
    if (![10, 100, 1000].includes(num(m[2]))) return "un diviseur hors de 10, 100 et 1 000";
    if (num(m[1]) % num(m[2]) !== 0) return "une division qui ne tombe pas juste";
    expected = num(m[1]) / num(m[2]);
    big = num(m[1]);
  } else return `énoncé inconnu : ${exo.prompt}`;
  return all(
    ok(num(rightOption(exo)) === expected, `${exo.prompt} : ${rightOption(exo)}, pas ${expected}`),
    ok(wrongOf(exo).every((option) => num(option) !== expected && num(option) >= 1 && num(option) <= CAP), `un mauvais choix égal à la bonne réponse ou hors du plafond : ${optionsOf(exo).join(", ")}`),
    ok(expected >= 1 && expected <= CAP && big <= CAP, "un résultat hors des nombres du CM2"),
    ok(level >= 2 || ["somme", "difference"].includes(form), `la forme ${form} au premier palier`),
    ok(level >= 2 || form !== "produit", "un produit au premier palier"),
    ok(["somme", "difference"].includes(form) ? big >= LO[level] && big <= TOP[level] * 2 : true, `le plus grand terme ${big} hors de la plage du niveau ${level}`),
  );
};

const checkLinks: Check = (exo) => {
  const level = levelOf(exo);
  const pairs = pairsOf(exo);
  if (exo.prompt === "Relie chaque calcul à son résultat.") {
    return all(
      ok(level >= 2, "un calcul relié au premier palier"),
      ...pairs.map((pair) => {
        const m = new RegExp(`^(${NUMBER}) × (${NUMBER})$`).exec(pair.left);
        if (!m) return `calcul inconnu : ${pair.left}`;
        return all(ok(num(pair.right) === num(m[1]) * num(m[2]), `${pair.left} = ${pair.right}`), ok([10, 100, 1000].includes(num(m[2])), "un multiplicateur hors de 10, 100 et 1 000"), ok(num(pair.right) <= CAP, "hors du plafond"));
      }),
      ok(new Set(pairs.map((pair) => pair.left.split(" × ")[1])).size === 3, "trois multiplicateurs différents"),
    );
  }
  if (exo.prompt !== "Relie chaque nombre à son écriture en lettres.") return `énoncé inconnu : ${exo.prompt}`;
  return all(
    ok(pairs.length === 3, "trois paires"),
    ...pairs.map((pair) => all(ok(words(num(pair.left)) === pair.right, `${pair.left} se lit « ${words(num(pair.left))} », pas « ${pair.right} »`), ok(inLevel(num(pair.left), level), `${pair.left} hors de la plage du niveau ${level}`))),
  );
};

const checkThreshold: Check = (exo) => {
  const level = levelOf(exo);
  const [first, second] = zonesOf(exo);
  const a = new RegExp(`^Moins de (${NUMBER})$`).exec(first);
  const b = new RegExp(`^(${NUMBER}) ou plus$`).exec(second);
  if (!a || !b || a[1] !== b[1]) return `les cases : ${first} / ${second}`;
  const t = num(a[1]);
  const items = itemsOf(exo);
  const length = String(t).length;
  return all(
    ok(/^[2-8]0*$/.test(String(t)), `le seuil ${t} n'est pas un chiffre suivi de zéros`),
    ok(items.length === 4, "quatre nombres"),
    ...items.map((item) => {
      const value = num(item.text);
      return all(
        ok(value !== t, "un nombre égal au seuil"),
        ok(item.correctZone === (value < t ? first : second), `${item.text} est dans la mauvaise case (seuil ${t})`),
        ok(String(value).length === length, `${item.text} n'a pas autant de chiffres que le seuil`),
        ok(inLevel(value, level), `${item.text} hors de la plage du niveau ${level}`),
      );
    }),
    ok(items.filter((item) => item.correctZone === first).length === 2, "deux nombres par case"),
  );
};

const KINDS = [
  "cm2-grn-comparer",
  "cm2-grn-ranger",
  "cm2-grn-chiffres",
  "cm2-grn-suite",
  "cm2-grn-arrondir",
  "cm2-grn-ecrire",
  "cm2-grn-lire",
  "cm2-grn-calculer",
  "cm2-grn-relier",
  "cm2-grn-glisser",
];

defineMathsTests({
  label: "des millions et des milliards du CM2",
  klass: "CM2",
  checks: {
    "cm2-grn-comparer": checkCompare,
    "cm2-grn-ranger": checkOrder,
    "cm2-grn-chiffres": checkDigits,
    "cm2-grn-suite": checkSequence,
    "cm2-grn-arrondir": checkRound,
    "cm2-grn-ecrire": checkWrite,
    "cm2-grn-lire": checkRead,
    "cm2-grn-calculer": checkCompute,
    "cm2-grn-relier": checkLinks,
    "cm2-grn-glisser": checkThreshold,
  },
  topicKinds: { "ma-cm2-milliards": KINDS },
  caps: [{ prefix: "cm2-grn-", max: CAP }],
});
