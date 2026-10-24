import { describe, expect, it } from "vitest";
import { dec3 } from "../paliers/games/cm2MathsOutils";
import { acceptedOf, all, blankOf, defineMathsTests, itemsOf, levelOf, ok, optionsOf, pairsOf, rightOption, sequenceOf, textOf, textsOf, wrongOf, zonesOf, type Check, type Exo } from "@/lib/test-support/cm1MathsKit";

/**
 * LES OPÉRATIONS SUR LES DÉCIMAUX DU CM2 (`ma-cm2-decimaux`).
 *
 * Chaque test RECALCULE la réponse sur des entiers de MILLIÈMES, avec sa propre lecture d'un nombre écrit (la virgule coupe la partie entière et les chiffres de
 * droite, jamais un nombre flottant) : le produit, le quotient, le décalage de la virgule. Aucun nombre n'est écrit avec un zéro inutile à droite (« 4,50 »),
 * aucun résultat n'a plus de trois chiffres après la virgule. Le niveau 2 réunit les paliers 2 et 3.
 */

const DEC = String.raw`\d+(?: \d{3})*(?:,\d{1,3})?`;
const BAD_ZERO = /,\d*0(?!\d)/;

/** Un nombre écrit « 45,6 » en millièmes : 45600. Les chiffres de droite sont lus un par un, pas comme un nombre flottant. */
function thousandths(text: string): number {
  const [whole, decimals = ""] = text.replace(/ /g, "").split(",");
  return Number(whole) * 1000 + Number(decimals.padEnd(3, "0"));
}
const placesOf = (text: string) => (text.includes(",") ? text.split(",")[1].length : 0);
const wholeOf = (text: string) => Number(text.split(",")[0].replace(/ /g, ""));
const cleanNumbers = (exo: Exo) => ok(![exo.prompt, ...textsOf(exo)].some((text) => BAD_ZERO.test(text)), `un zéro inutile à droite de la virgule : ${exo.prompt} ${textsOf(exo).join(" | ")}`);

/** La valeur en millièmes d'un calcul « A × B » ou « A ÷ B » : null quand le résultat n'est pas un nombre de millièmes entier. */
function evaluate(expression: string): number | null {
  const m = new RegExp(`^(${DEC}) (×|÷) (${DEC})$`).exec(expression);
  if (!m) return null;
  const a = thousandths(m[1]);
  const b = thousandths(m[3]);
  const value = m[2] === "×" ? (a * b) / 1000 : (a * 1000) / b;
  return Number.isInteger(value) ? value : null;
}

/** Les trois morceaux d'un calcul « A × B » ou « A ÷ B » (le nombre B peut avoir une espace de milliers). */
function partsOf(expression: string): { a: string; operator: string; b: string } {
  const m = new RegExp(`^(${DEC}) (×|÷) (${DEC})$`).exec(expression);
  return m ? { a: m[1], operator: m[2], b: m[3] } : { a: "", operator: "", b: "" };
}

const POWERS = [10, 100, 1000];
const isPower = (text: string) => POWERS.includes(thousandths(text) / 1000);

const checkTimesTen: Check = (exo) => {
  const level = levelOf(exo);
  const m = new RegExp(`^Calcule (${DEC}) × (\\d+(?: \\d{3})*)\\.$`).exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const a = thousandths(m[1]);
  const power = Number(m[2].replace(/ /g, ""));
  return all(
    ok(POWERS.includes(power), `le facteur ${power}`),
    ok(thousandths(rightOption(exo)) === a * power, `${exo.prompt} : ${rightOption(exo)}, pas ${dec3(a * power)}`),
    ok(wrongOf(exo).every((option) => thousandths(option) !== a * power), "un mauvais choix égal à la bonne réponse"),
    ok(level >= 2 || power !== 1000, "un facteur mille au premier palier"),
    ok([1, 2, 3].includes(placesOf(m[1])) && (level === 1 ? placesOf(m[1]) <= 2 : true), `les chiffres après la virgule de ${m[1]} au niveau ${level}`),
    ok(wholeOf(m[1]) >= 1 && wholeOf(m[1]) <= (level === 1 ? 99 : 999), `la partie entière de ${m[1]} au niveau ${level}`),
    cleanNumbers(exo),
  );
};

const checkDivTen: Check = (exo) => {
  const level = levelOf(exo);
  const m = new RegExp(`^Calcule (${DEC}) ÷ (\\d+(?: \\d{3})*)\\.$`).exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const a = thousandths(m[1]);
  const power = Number(m[2].replace(/ /g, ""));
  const zeros = String(power).length - 1;
  return all(
    ok(POWERS.includes(power), `le diviseur ${power}`),
    ok(a % power === 0, `${m[1]} ÷ ${power} n'a pas trois chiffres après la virgule au plus`),
    ok(thousandths(rightOption(exo)) === a / power, `${exo.prompt} : ${rightOption(exo)}, pas ${dec3(a / power)}`),
    ok(wrongOf(exo).every((option) => thousandths(option) !== a / power), "un mauvais choix égal à la bonne réponse"),
    ok(placesOf(m[1]) + zeros <= 3, "plus de trois chiffres après la virgule dans le résultat"),
    ok(level >= 2 || power !== 1000, "un diviseur mille au premier palier"),
    ok(wholeOf(m[1]) >= 10 && wholeOf(m[1]) <= (level === 1 ? 999 : 9999), `la partie entière de ${m[1]} au niveau ${level}`),
    cleanNumbers(exo),
  );
};

const checkTimesInteger: Check = (exo) => {
  const level = levelOf(exo);
  const m = new RegExp(`^Calcule (${DEC}) × (\\d+)\\.$`).exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const k = Number(m[2]);
  const a = thousandths(m[1]);
  const small = k >= 2 && k <= 9;
  const large = k >= 11 && k <= 99;
  return all(
    ok(thousandths(rightOption(exo)) === a * k, `${exo.prompt} : ${rightOption(exo)}, pas ${dec3(a * k)}`),
    ok(wrongOf(exo).every((option) => thousandths(option) !== a * k), "un mauvais choix égal à la bonne réponse"),
    ok(small || large, `le multiplicateur ${k}`),
    ok(level === 1 ? small && wholeOf(m[1]) <= 19 : level === 2 ? small || large : large, `le multiplicateur ${k} au niveau ${level}`),
    ok([1, 2].includes(placesOf(m[1])), `les chiffres après la virgule de ${m[1]}`),
    ok(wholeOf(m[1]) >= 1 && wholeOf(m[1]) <= (level <= 1 ? 19 : 99), `la partie entière de ${m[1]} au niveau ${level}`),
    cleanNumbers(exo),
  );
};

const checkTimesDecimal: Check = (exo) => {
  const level = levelOf(exo);
  const m = new RegExp(`^Calcule (${DEC}) × (${DEC})\\.$`).exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const a = thousandths(m[1]);
  const b = thousandths(m[2]);
  const value = evaluate(`${m[1]} × ${m[2]}`);
  const places = placesOf(m[1]) + placesOf(m[2]);
  const fits: Record<number, boolean> = {
    1: placesOf(m[1]) === 1 && placesOf(m[2]) === 1 && wholeOf(m[1]) === 0 && wholeOf(m[2]) === 0,
    2: placesOf(m[1]) === 1 && placesOf(m[2]) === 1 && wholeOf(m[1]) >= 1 && wholeOf(m[1]) <= 20 && wholeOf(m[2]) <= 9,
    3: placesOf(m[1]) === 2 && placesOf(m[2]) === 1 && wholeOf(m[1]) >= 1 && wholeOf(m[1]) <= 20 && wholeOf(m[2]) <= 9,
    4: placesOf(m[1]) + placesOf(m[2]) === 3 && wholeOf(m[1]) >= 1 && wholeOf(m[1]) <= 99 && wholeOf(m[2]) <= 9,
  };
  return all(
    ok(value !== null && thousandths(rightOption(exo)) === value, `${exo.prompt} : ${rightOption(exo)}, pas ${value === null ? "?" : dec3(value)}`),
    ok(wrongOf(exo).every((option) => thousandths(option) !== value), "un mauvais choix égal à la bonne réponse"),
    ok(a > 0 && b > 0, "un facteur nul"),
    ok(places >= 2 && places <= 3, `${places} chiffres après la virgule en tout`),
    ok(fits[level], `${exo.prompt} hors de la forme du niveau ${level}`),
    cleanNumbers(exo),
  );
};

const checkDivide: Check = (exo) => {
  const level = levelOf(exo);
  const m = new RegExp(`^Calcule (${DEC}) ÷ (\\d+)\\.$`).exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const dividend = thousandths(m[1]);
  const divisor = Number(m[2]);
  const value = evaluate(`${m[1]} ÷ ${divisor}`);
  const integers = placesOf(m[1]) === 0;
  return all(
    ok(value !== null && thousandths(rightOption(exo)) === value, `${exo.prompt} : ${rightOption(exo)}, pas ${value === null ? "?" : dec3(value)}`),
    ok(value !== null && Number.isInteger(dividend / divisor), "une division qui ne tombe pas juste en millièmes"),
    ok(wrongOf(exo).every((option) => thousandths(option) !== value), "un mauvais choix égal à la bonne réponse"),
    ok(divisor >= 2 && divisor <= 8, `le diviseur ${divisor}`),
    ok(level >= 2 || (divisor <= 5 && !integers), `le diviseur ${divisor} ou un entier à partager au premier palier`),
    ok(!integers || (dividend / 1000) % divisor !== 0, "un entier qui se partage sans reste, dans la forme du quotient décimal"),
    cleanNumbers(exo),
  );
};

const checkWrite: Check = (exo) => {
  const level = levelOf(exo);
  const m = new RegExp(`^Écris le résultat de (${DEC} [×÷] ${DEC})\\.$`).exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const value = evaluate(m[1]);
  const { a: left, b: right } = partsOf(m[1]);
  const power = isPower(right);
  return all(
    ok(value !== null && thousandths(exo.answerKey) === value, `${exo.prompt} : ${exo.answerKey}, pas ${value === null ? "?" : dec3(value)}`),
    ok(acceptedOf(exo)[0] === exo.answerKey, "la première écriture admise est la réponse"),
    ok(acceptedOf(exo).every((text) => thousandths(text) === value && placesOf(text) <= 3), `les écritures admises : ${acceptedOf(exo).join(" / ")}`),
    ok(level >= 2 || (power && thousandths(right) / 1000 !== 1000), "autre chose que dix et cent au premier palier"),
    ok(placesOf(exo.answerKey) <= 3, "plus de trois chiffres après la virgule dans le résultat"),
    ok(!BAD_ZERO.test(exo.answerKey) && !BAD_ZERO.test(left), "un zéro inutile"),
  );
};

const checkGap: Check = (exo) => {
  const blank = blankOf(exo);
  const text = textOf(exo);
  const level = levelOf(exo);
  let m = new RegExp(`^(${DEC}) × ___ = (${DEC})$`).exec(text);
  if (m) {
    const ratio = thousandths(m[2]) / thousandths(m[1]);
    return all(
      ok(blank.answer.replace(/ /g, "") === String(ratio), `${text} : ${blank.answer}, pas ${ratio}`),
      ok(POWERS.includes(ratio), "un facteur hors de 10, 100 et 1 000"),
      ok(level >= 2 || ratio !== 1000, "un facteur mille au premier palier"),
      cleanNumbers(exo),
    );
  }
  m = new RegExp(`^(${DEC}) ÷ ___ = (${DEC})$`).exec(text);
  if (m) {
    const ratio = thousandths(m[1]) / thousandths(m[2]);
    return all(
      ok(blank.answer.replace(/ /g, "") === String(ratio), `${text} : ${blank.answer}, pas ${ratio}`),
      ok(POWERS.includes(ratio), "un diviseur hors de 10, 100 et 1 000"),
      ok(level >= 2 || ratio !== 1000, "un diviseur mille au premier palier"),
      cleanNumbers(exo),
    );
  }
  m = new RegExp(`^___ × (\\d+(?: \\d{3})*) = (${DEC})$`).exec(text);
  if (!m) return `texte inconnu : ${text}`;
  const power = Number(m[1].replace(/ /g, ""));
  return all(
    ok(thousandths(blank.answer) * power === thousandths(m[2]), `${text} : ${blank.answer}`),
    ok(POWERS.includes(power) && (level >= 2 || power !== 1000), `le facteur ${power}`),
    ok(blank.options.every((option) => thousandths(option) !== thousandths(m![2]) || option === blank.answer), "un choix égal au résultat"),
    cleanNumbers(exo),
  );
};

const checkOrder: Check = (exo) => {
  const m = /^Range ces calculs d'après leur résultat, du (plus petit au plus grand|plus grand au plus petit)\.$/.exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const tiles = sequenceOf(exo);
  const values = tiles.map(evaluate);
  const bases = new Set(tiles.map((tile) => partsOf(tile).a));
  const ascending = m[1].startsWith("plus petit");
  const level = levelOf(exo);
  return all(
    ok(tiles.length === 4 && values.every((v) => v !== null), `quatre calculs valides : ${tiles.join(" | ")}`),
    ok(new Set(values).size === 4, "deux calculs de même résultat"),
    ok(values.every((value, i) => i === 0 || (ascending ? (value as number) > (values[i - 1] as number) : (value as number) < (values[i - 1] as number))), `${exo.prompt} : ${tiles.join(" | ")}`),
    ok(bases.size === 1, "un seul nombre de départ"),
    ok(tiles.every((tile) => isPower(partsOf(tile).b)), "un facteur hors de 10, 100 et 1 000"),
    ok(level >= 2 || placesOf([...bases][0]) === 0, "un décimal au premier palier"),
    cleanNumbers(exo),
  );
};

const checkLinks: Check = (exo) => {
  const level = levelOf(exo);
  const pairs = pairsOf(exo);
  return all(
    ok(exo.prompt === "Relie chaque calcul à son résultat.", `énoncé inconnu : ${exo.prompt}`),
    ok(pairs.length === 3, "trois paires"),
    ...pairs.map((pair) => {
      const value = evaluate(pair.left);
      const { operator, b: right } = partsOf(pair.left);
      return all(
        ok(value !== null && thousandths(pair.right) === value, `${pair.left} = ${value === null ? "?" : dec3(value)}, pas ${pair.right}`),
        ok(level >= 2 || (isPower(right) && thousandths(right) / 1000 !== 1000), `${pair.left} au premier palier`),
        ok(operator === "×" || isPower(right), "une division par autre chose que 10, 100 ou 1 000"),
      );
    }),
    cleanNumbers(exo),
  );
};

const checkSort: Check = (exo) => {
  const [first, second] = zonesOf(exo);
  const a = new RegExp(`^Plus grand que (${DEC})$`).exec(first);
  const b = new RegExp(`^Plus petit que (${DEC})$`).exec(second);
  if (!a || !b || a[1] !== b[1]) return `les cases : ${first} / ${second}`;
  const base = thousandths(a[1]);
  const items = itemsOf(exo);
  return all(
    ok(items.length === 4, "quatre calculs"),
    ok(items.filter((item) => item.correctZone === first).length === 2, "deux calculs par case"),
    ...items.map((item) => {
      const value = evaluate(item.text);
      return all(
        ok(value !== null && value !== base, `${item.text} : un résultat égal au départ ou invalide`),
        ok(value !== null && item.correctZone === (value > base ? first : second), `${item.text} est dans la mauvaise case (départ ${a[1]})`),
        ok(item.text.startsWith(`${a[1]} `), `${item.text} ne part pas de ${a[1]}`),
      );
    }),
    cleanNumbers(exo),
  );
};

describe("l'écriture des décimaux en millièmes", () => {
  it("dec3 écrit 6450 « 6,45 », 6400 « 6,4 », 6000 « 6 », 6005 « 6,005 » et 1250500 « 1 250,5 »", () => {
    expect(dec3(6450)).toBe("6,45");
    expect(dec3(6400)).toBe("6,4");
    expect(dec3(6000)).toBe("6");
    expect(dec3(6005)).toBe("6,005");
    expect(dec3(1250500)).toBe("1 250,5");
    expect(dec3(60)).toBe("0,06");
  });
  it("la lecture du test refait ces mêmes nombres", () => {
    for (const t of [6450, 6400, 6000, 6005, 1250500, 60, 7, 999999]) expect(thousandths(dec3(t))).toBe(t);
  });
});

defineMathsTests({
  label: "des opérations sur les décimaux du CM2",
  klass: "CM2",
  checks: {
    "cm2-dcm-fois10": checkTimesTen,
    "cm2-dcm-div10": checkDivTen,
    "cm2-dcm-fois-entier": checkTimesInteger,
    "cm2-dcm-fois-decimal": checkTimesDecimal,
    "cm2-dcm-diviser": checkDivide,
    "cm2-dcm-ecrire": checkWrite,
    "cm2-dcm-trou": checkGap,
    "cm2-dcm-ranger": checkOrder,
    "cm2-dcm-relier": checkLinks,
    "cm2-dcm-glisser": checkSort,
  },
  topicKinds: {
    "ma-cm2-decimaux": ["cm2-dcm-fois10", "cm2-dcm-div10", "cm2-dcm-fois-entier", "cm2-dcm-fois-decimal", "cm2-dcm-diviser", "cm2-dcm-ecrire", "cm2-dcm-trou", "cm2-dcm-ranger", "cm2-dcm-relier", "cm2-dcm-glisser"],
  },
});
