import { acceptedOf, all, blankOf, defineMathsTests, itemsOf, levelOf, num, ok, optionsOf, pairsOf, rightOption, sequenceOf, textOf, wrongOf, zonesOf, type Check, type Exo } from "@/lib/test-support/cm1MathsKit";
import type { GameLevel } from "../paliers/games/shared";

/**
 * ACHETER, VENDRE, GAGNER AU CM2 (`ma-cm2-commerce`) : le budget, le prix d'achat, les frais, le prix de revient, le prix de vente, le bénéfice et la perte.
 *
 * Chaque test RECALCULE la réponse avec sa propre arithmétique, écrite à part : le prix de revient est le prix d'achat plus les frais, le bénéfice est le prix
 * de vente moins le prix de revient quand il est positif, la perte la différence inverse. Les sommes sont celles du palier (le niveau 2 réunit les paliers 2 et 3).
 */

const SUM = String.raw`\d+(?: \d{3})*`;
/** L'unité des sommes de chaque niveau (le niveau 2 réunit 500 et 1 000), le plus petit achat et le plus grand revient. */
const UNIT: Record<GameLevel, number> = { 1: 100, 2: 500, 3: 5000, 4: 10000 };
const LO: Record<GameLevel, number> = { 1: 1000, 2: 5000, 3: 100000, 4: 500000 };
const HI: Record<GameLevel, number> = { 1: 9000, 2: 500000, 3: 2000000, 4: 9000000 };
const multiple = (n: number, level: GameLevel) => n > 0 && n % UNIT[level] === 0;
const inRange = (achat: number, level: GameLevel) => achat >= LO[level] && achat <= HI[level];

const checkCost: Check = (exo) => {
  const level = levelOf(exo);
  const m = new RegExp(`^Un commerçant achète (du riz|du mil|du sucre|du savon|du poisson|des pagnes|des arachides) pour (${SUM}) FCFA et paie (${SUM}) FCFA (de transport|de frais)\\. Quel est son prix de revient \\?$`).exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const achat = num(m[2]);
  const frais = num(m[3]);
  return all(
    ok(num(rightOption(exo)) === achat + frais, `${exo.prompt} : ${rightOption(exo)}, pas ${achat + frais}`),
    ok(wrongOf(exo).every((option) => num(option) !== achat + frais && num(option) !== achat && num(option) !== frais), "un mauvais choix égal à la bonne réponse ou à un nombre de l'énoncé"),
    ok(multiple(achat, level) && multiple(frais, level), "des sommes qui ne sont pas des multiples de l'unité du palier"),
    ok(inRange(achat, level), `l'achat ${achat} hors de la plage du niveau ${level}`),
    ok(frais < achat, "des frais plus grands que l'achat"),
  );
};

const checkProfit: Check = (exo) => {
  const level = levelOf(exo);
  const m = new RegExp(`^Un article revient à (${SUM}) FCFA\\. Le commerçant le vend (${SUM}) FCFA\\. Quel est son bénéfice \\?$`).exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const revient = num(m[1]);
  const vente = num(m[2]);
  return all(
    ok(vente > revient, "un prix de vente qui ne dépasse pas le prix de revient"),
    ok(num(rightOption(exo)) === vente - revient, `${exo.prompt} : ${rightOption(exo)}, pas ${vente - revient}`),
    ok(wrongOf(exo).every((option) => num(option) !== vente - revient && num(option) !== revient && num(option) !== vente), "un mauvais choix égal à la bonne réponse ou à un prix de l'énoncé"),
    ok(multiple(revient, level) && multiple(vente, level), "des sommes qui ne sont pas des multiples de l'unité du palier"),
    ok(revient >= LO[level] && revient <= HI[level] * 1.5, `le prix de revient ${revient} hors de la plage du niveau ${level}`),
    ok(vente - revient < revient, "un bénéfice plus grand que le prix de revient"),
  );
};

const checkGainOrLoss: Check = (exo) => {
  const level = levelOf(exo);
  const m = new RegExp(`^Un commerçant a payé un article (${SUM}) FCFA en tout\\. Il le vend (${SUM}) FCFA\\. Que se passe-t-il \\?$`).exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const paid = num(m[1]);
  const sold = num(m[2]);
  const read = (option: string) => {
    const o = new RegExp(`^Il (gagne|perd) (${SUM}) FCFA\\.$`).exec(option);
    return o ? { win: o[1] === "gagne", sum: num(o[2]) } : null;
  };
  const right = read(rightOption(exo));
  const expected = { win: sold > paid, sum: Math.abs(sold - paid) };
  return all(
    ok(sold !== paid, "un prix de vente égal au prix payé"),
    ok(right !== null && right.win === expected.win && right.sum === expected.sum, `${exo.prompt} : ${rightOption(exo)}, pas ${expected.win ? "gagne" : "perd"} ${expected.sum}`),
    ok(wrongOf(exo).every((option) => { const r = read(option); return r !== null && !(r.win === expected.win && r.sum === expected.sum); }), "un mauvais choix qui dit la même chose"),
    ok(multiple(paid, level) && multiple(sold, level), "des sommes qui ne sont pas des multiples de l'unité du palier"),
    ok(new Set(optionsOf(exo)).size === 3, "trois choix différents"),
  );
};

const checkGap: Check = (exo) => {
  const level = levelOf(exo);
  const text = textOf(exo);
  const blank = blankOf(exo);
  const numbers = (text.match(new RegExp(SUM, "g")) ?? []).map(num);
  let expected: number;
  let m = new RegExp(`^(${SUM}) FCFA de revient et (${SUM}) FCFA de bénéfice donnent un prix de vente de ___ FCFA\\.$`).exec(text);
  if (m) expected = num(m[1]) + num(m[2]);
  else if ((m = new RegExp(`^Un article est vendu (${SUM}) FCFA avec (${SUM}) FCFA de bénéfice\\. Son prix de revient est de ___ FCFA\\.$`).exec(text))) expected = num(m[1]) - num(m[2]);
  else if ((m = new RegExp(`^Un article revient à (${SUM}) FCFA, dont (${SUM}) FCFA de frais\\. Son prix d'achat est de ___ FCFA\\.$`).exec(text))) expected = num(m[1]) - num(m[2]);
  else if ((m = new RegExp(`^Un article revient à (${SUM}) FCFA et il est vendu (${SUM}) FCFA\\. La perte est de ___ FCFA\\.$`).exec(text))) expected = num(m[1]) - num(m[2]);
  else return `texte inconnu : ${text}`;
  return all(
    ok(num(blank.answer) === expected && expected > 0, `${text} : ${blank.answer}, pas ${expected}`),
    ok(blank.options.every((option) => option === blank.answer || (num(option) !== expected && !numbers.includes(num(option)))), `un choix égal à la bonne réponse ou à un nombre du texte : ${blank.options.join(", ")}`),
    ok(numbers.every((n) => multiple(n, level) || n === expected), "des sommes qui ne sont pas des multiples de l'unité du palier"),
    ok(level >= 2 || /de revient et|vendu .* avec/.test(text), "une perte ou un prix d'achat au premier palier"),
  );
};

const checkBudget: Check = (exo) => {
  const level = levelOf(exo);
  const m = new RegExp(`^Une famille gagne (${SUM}) FCFA\\. Elle paie (.+)\\. Que lui reste-t-il \\?$`).exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const income = num(m[1]);
  const spent = [...m[2].matchAll(new RegExp(`(${SUM}) FCFA de (loyer|nourriture|transport|santé)`, "g"))].map((x) => num(x[1]));
  const left = income - spent.reduce((a, b) => a + b, 0);
  return all(
    ok(spent.length >= 2 && spent.length <= 3, `${spent.length} dépenses`),
    ok(level === 2 ? spent.length >= 2 : spent.length === 2, `${spent.length} dépenses au niveau ${level}`),
    ok(left > 0, "un reste nul ou négatif"),
    ok(num(rightOption(exo)) === left, `${exo.prompt} : ${rightOption(exo)}, pas ${left}`),
    ok(wrongOf(exo).every((option) => num(option) !== left && num(option) !== income && !spent.includes(num(option))), "un mauvais choix égal à la bonne réponse ou à un nombre de l'énoncé"),
    ok(new Set(m[2].match(/de (loyer|nourriture|transport|santé)/g)).size === spent.length, "deux dépenses du même genre"),
    ok(multiple(income, level) && spent.every((s) => multiple(s, level)), "des sommes qui ne sont pas des multiples de l'unité du palier"),
  );
};

const checkQuantity: Check = (exo) => {
  const level = levelOf(exo);
  const one = new RegExp(`^Un commerçant achète (\\d+) (.+?) à (${SUM}) FCFA (le \\w+)\\. Combien paie-t-il en tout \\?$`).exec(exo.prompt);
  const two = new RegExp(`^Un commerçant achète (\\d+) (.+?) à (${SUM}) FCFA (le \\w+) et (\\d+) (.+?) à (${SUM}) FCFA (le \\w+)\\. Combien paie-t-il en tout \\?$`).exec(exo.prompt);
  let total: number;
  if (two) total = Number(two[1]) * num(two[3]) + Number(two[5]) * num(two[7]);
  else if (one) total = Number(one[1]) * num(one[3]);
  else return `énoncé inconnu : ${exo.prompt}`;
  return all(
    ok(num(rightOption(exo)) === total, `${exo.prompt} : ${rightOption(exo)}, pas ${total}`),
    ok(wrongOf(exo).every((option) => num(option) !== total), "un mauvais choix égal à la bonne réponse"),
    ok(!!two === level >= 3, `${two ? "deux" : "une"} sorte d'articles au niveau ${level}`),
    ok(total <= 99999999, "un total hors des sommes du CM2"),
  );
};

const checkWrite: Check = (exo) => {
  const level = levelOf(exo);
  let expected: number;
  let m = new RegExp(`^Un commerçant achète un article (${SUM}) FCFA et paie (${SUM}) FCFA de frais\\. Écris son prix de revient en FCFA\\.$`).exec(exo.prompt);
  if (m) expected = num(m[1]) + num(m[2]);
  else if ((m = new RegExp(`^Un article revient à (${SUM}) FCFA\\. Il est vendu (${SUM}) FCFA\\. Écris le bénéfice en FCFA\\.$`).exec(exo.prompt))) {
    expected = num(m[2]) - num(m[1]);
    if (expected <= 0) return "un bénéfice nul ou négatif";
  } else if ((m = new RegExp(`^Un article revient à (${SUM}) FCFA\\. Le commerçant veut (${SUM}) FCFA de bénéfice\\. Écris le prix de vente en FCFA\\.$`).exec(exo.prompt))) expected = num(m[1]) + num(m[2]);
  else if ((m = new RegExp(`^Un article revient à (${SUM}) FCFA\\. Il est vendu (${SUM}) FCFA\\. Écris la perte en FCFA\\.$`).exec(exo.prompt))) {
    expected = num(m[1]) - num(m[2]);
    if (expected <= 0) return "une perte nulle ou négative";
  } else return `énoncé inconnu : ${exo.prompt}`;
  const forms = level === 1 ? /achète un article|Écris le bénéfice/ : /./;
  return all(
    ok(num(exo.answerKey) === expected, `${exo.prompt} : ${exo.answerKey}, pas ${expected}`),
    ok(acceptedOf(exo).every((text) => num(text) === expected), `les écritures admises : ${acceptedOf(exo).join(" / ")}`),
    ok(acceptedOf(exo)[0] === exo.answerKey, "la première écriture admise est la réponse"),
    ok(forms.test(exo.prompt), `la forme de ${exo.prompt} au niveau ${level}`),
  );
};

const checkOrder: Check = (exo) => {
  const level = levelOf(exo);
  const m = /^Range ces prix de revient, du (plus petit au plus grand|plus grand au plus petit)\.$/.exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const tiles = sequenceOf(exo).map((tile) => new RegExp(`^(${SUM}) \\+ (${SUM})$`).exec(tile));
  if (tiles.some((tile) => tile === null)) return `une tuile qui n'est pas « achat + frais » : ${sequenceOf(exo).join(" | ")}`;
  const values = tiles.map((tile) => num((tile as RegExpExecArray)[1]) + num((tile as RegExpExecArray)[2]));
  const ascending = m[1].startsWith("plus petit");
  return all(
    ok(values.length === 4 && new Set(values).size === 4, "quatre sommes différentes"),
    ok(values.every((value, i) => i === 0 || (ascending ? value > values[i - 1] : value < values[i - 1])), `${exo.prompt} : ${sequenceOf(exo).join(" | ")}`),
    ok(tiles.every((tile) => multiple(num((tile as RegExpExecArray)[1]), level) && multiple(num((tile as RegExpExecArray)[2]), level)), "des sommes qui ne sont pas des multiples de l'unité du palier"),
  );
};

const DEFINITIONS: Record<string, string> = {
  "Prix de revient": "Prix d'achat plus frais",
  Bénéfice: "Prix de vente moins prix de revient",
  Perte: "Prix de revient moins prix de vente",
  "Prix de vente": "Prix de revient plus bénéfice",
};

const checkLinks: Check = (exo) => {
  const level = levelOf(exo);
  const pairs = pairsOf(exo);
  if (exo.prompt === "Relie chaque mot à ce qu'il veut dire.") {
    return all(
      ok(level <= 2, "des définitions aux derniers paliers"),
      ok(pairs.length === 3, "trois paires"),
      ...pairs.map((pair) => ok(DEFINITIONS[pair.left] === pair.right, `définition fausse : ${pair.left} ~ ${pair.right}`)),
    );
  }
  if (exo.prompt !== "Relie chaque situation à ce qui se passe, en FCFA.") return `énoncé inconnu : ${exo.prompt}`;
  return all(
    ok(pairs.length === 3, "trois paires"),
    ...pairs.map((pair) => {
      const m = new RegExp(`^Revient à (${SUM}), vendu (${SUM})$`).exec(pair.left);
      const r = new RegExp(`^(Bénéfice|Perte) de (${SUM})$`).exec(pair.right);
      if (!m || !r) return `paire inconnue : ${pair.left} ~ ${pair.right}`;
      const diff = num(m[2]) - num(m[1]);
      return all(ok(diff !== 0 && (diff > 0) === (r[1] === "Bénéfice") && Math.abs(diff) === num(r[2]), `${pair.left} ne donne pas « ${pair.right} »`), ok(multiple(num(m[1]), level) && multiple(num(m[2]), level), "des sommes hors de l'unité du palier"));
    }),
  );
};

const checkSort: Check = (exo) => {
  const level = levelOf(exo);
  const [first, second] = zonesOf(exo);
  const items = itemsOf(exo);
  return all(
    ok(first === "Bénéfice" && second === "Perte", `les cases : ${first} / ${second}`),
    ok(items.length === 4 && items.filter((item) => item.correctZone === first).length === 2, "deux situations par case"),
    ...items.map((item) => {
      const m = new RegExp(`^Revient à (${SUM}), vendu (${SUM})$`).exec(item.text);
      if (!m) return `étiquette inconnue : ${item.text}`;
      const diff = num(m[2]) - num(m[1]);
      return all(ok(diff !== 0 && item.correctZone === (diff > 0 ? first : second), `${item.text} est dans la mauvaise case`), ok(multiple(num(m[1]), level) && multiple(num(m[2]), level), "des sommes hors de l'unité du palier"));
    }),
  );
};

defineMathsTests({
  label: "du commerce du CM2",
  klass: "CM2",
  checks: {
    "cm2-com-revient": checkCost,
    "cm2-com-benefice": checkProfit,
    "cm2-com-gain-perte": checkGainOrLoss,
    "cm2-com-vente": checkGap,
    "cm2-com-budget": checkBudget,
    "cm2-com-quantite": checkQuantity,
    "cm2-com-ecrire": checkWrite,
    "cm2-com-ranger": checkOrder,
    "cm2-com-relier": checkLinks,
    "cm2-com-glisser": checkSort,
  },
  topicKinds: {
    "ma-cm2-commerce": ["cm2-com-revient", "cm2-com-benefice", "cm2-com-gain-perte", "cm2-com-vente", "cm2-com-budget", "cm2-com-quantite", "cm2-com-ecrire", "cm2-com-ranger", "cm2-com-relier", "cm2-com-glisser"],
  },
});
