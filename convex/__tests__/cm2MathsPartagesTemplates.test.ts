import { acceptedOf, all, blankOf, defineMathsTests, itemsOf, levelOf, num, ok, optionsOf, pairsOf, rightOption, sequenceOf, textOf, wrongOf, zonesOf, type Check, type Exo } from "@/lib/test-support/cm1MathsKit";
import type { GameLevel } from "../paliers/games/shared";

/**
 * PARTAGES ET MOYENNE AU CM2 (`ma-cm2-partages-moyenne`).
 *
 * Chaque test RECALCULE la réponse avec sa propre arithmétique, écrite à part : un partage égal est une division sans reste, un partage par un écart se résout
 * par (somme - écart) / 2, la moyenne est la somme divisée par le nombre de valeurs (comptée en demis pour accepter « 12,5 »), la note qui manque est la moyenne
 * multipliée par le nombre de notes, moins les notes connues. Le niveau 2 réunit les paliers 2 et 3.
 */

const NUM = String.raw`\d+(?: \d{3})*`;
const HALF = String.raw`\d+(?: \d{3})*(?:,5)?`;
/** Une moyenne écrite « 12 » ou « 12,5 » en demis : 24 ou 25. */
const halves = (text: string) => Math.round(Number(text.replace(/ /g, "").replace(",", ".")) * 2);
const values = (list: string) => list.split(/, | et /).map(num);
const mean2Of = (list: number[]) => (list.reduce((a, b) => a + b, 0) * 2) / list.length;

/** Les sommes à partager de chaque niveau : l'unité, le plus petit et le plus grand total. */
const SUM_LO: Record<GameLevel, number> = { 1: 1000, 2: 10000, 3: 500000, 4: 1000000 };
const SUM_HI: Record<GameLevel, number> = { 1: 9000, 2: 500000, 3: 5000000, 4: 9000000 };

const checkEqual: Check = (exo) => {
  const level = levelOf(exo);
  const m = new RegExp(`^On partage (${NUM}) FCFA également entre (\\d+) enfants\\. Combien reçoit chaque enfant \\?$`).exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const total = num(m[1]);
  const parts = Number(m[2]);
  return all(
    ok(total % parts === 0, "une division qui ne tombe pas juste"),
    ok(num(rightOption(exo)) === total / parts, `${exo.prompt} : ${rightOption(exo)}, pas ${total / parts}`),
    ok(wrongOf(exo).every((option) => num(option) !== total / parts && num(option) !== total && num(option) !== parts), "un mauvais choix égal à la bonne réponse ou à un nombre de l'énoncé"),
    ok(parts >= 2 && parts <= 8 && (level > 1 || parts <= 5), `${parts} enfants au niveau ${level}`),
    ok(total >= SUM_LO[level] && total <= SUM_HI[level], `le total ${total} hors de la plage du niveau ${level}`),
  );
};

const checkUnequal: Check = (exo) => {
  const level = levelOf(exo);
  const m = new RegExp(`^(\\p{L}+) et (\\p{L}+) se partagent (${NUM}) FCFA\\. (\\p{L}+) reçoit (${NUM}) FCFA de plus (?:que |qu')(\\p{L}+)\\. Combien reçoit (\\p{L}+) \\?$`, "u").exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const [, first, second, , more, , less, asked] = m;
  // Un prénom qui commence par une voyelle prend « qu' » : « de plus qu'Awa », jamais « de plus que Awa ».
  if (/^[AEIOUY]/.test(less) !== exo.prompt.includes(`qu'${less}`)) return `l'élision devant ${less} : ${exo.prompt}`;
  const total = num(m[3]);
  const gap = num(m[5]);
  const small = (total - gap) / 2;
  const expected = asked === more ? small + gap : small;
  return all(
    ok(more === first && less === second && (asked === first || asked === second), "les noms de l'énoncé"),
    ok(Number.isInteger(small) && small > 0, "un partage qui ne tombe pas juste"),
    ok(num(rightOption(exo)) === expected, `${exo.prompt} : ${rightOption(exo)}, pas ${expected}`),
    ok(wrongOf(exo).every((option) => num(option) !== expected && num(option) !== total && num(option) !== gap), "un mauvais choix égal à la bonne réponse ou à un nombre de l'énoncé"),
    ok(gap < small + gap && gap >= 1, "un écart plus grand que la plus petite part"),
    ok(total >= SUM_LO[level] / 2 && total <= SUM_HI[level] * 1.5, `le total ${total} hors de la plage du niveau ${level}`),
  );
};

const checkShares: Check = (exo) => {
  const level = levelOf(exo);
  const m = new RegExp(`^On partage (${NUM}) FCFA en (\\d+) parts égales\\. (\\p{L}+) prend (\\d+) parts\\. Combien reçoit (\\p{L}+) \\?$`, "u").exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const total = num(m[1]);
  const parts = Number(m[2]);
  const taken = Number(m[4]);
  return all(
    ok(m[3] === m[5], "deux noms différents"),
    ok(total % parts === 0, "une part qui ne tombe pas juste"),
    ok(taken >= 2 && taken < parts, `${taken} parts prises sur ${parts}`),
    ok([4, 5, 8, 10].includes(parts), `${parts} parts`),
    ok(num(rightOption(exo)) === (total / parts) * taken, `${exo.prompt} : ${rightOption(exo)}, pas ${(total / parts) * taken}`),
    ok(wrongOf(exo).every((option) => num(option) !== (total / parts) * taken && num(option) !== total), "un mauvais choix égal à la bonne réponse ou au total"),
    ok(total >= SUM_LO[level] && total <= SUM_HI[level], `le total ${total} hors de la plage du niveau ${level}`),
  );
};

/** Le nombre de valeurs et la plage de chaque contexte à chaque niveau. */
const COUNTS: Record<GameLevel, number[]> = { 1: [3], 2: [4, 5], 3: [4, 5], 4: [5, 6] };
const RANGE: Record<string, [number, number]> = { notes: [3, 20], temperatures: [20, 45], recoltes: [40, 900] };

const readAverage = (prompt: string): { context: string; list: number[] } | null => {
  let m = new RegExp(`^Les notes (de |d')(\\p{L}+) sont (.+)\\. Quelle est sa moyenne \\?$`, "u").exec(prompt);
  // Un prénom qui commence par une voyelle prend « d' » : « les notes d'Awa », jamais « de Awa ».
  if (m && /^[AEIOUY]/.test(m[2]) !== (m[1] === "d'")) return null;
  if (m) return { context: "notes", list: values(m[3]) };
  m = new RegExp(`^Les températures de (\\d+) jours sont (.+) degrés\\. Quelle est la température moyenne \\?$`, "u").exec(prompt);
  if (m) return { context: "temperatures", list: values(m[2]) };
  m = new RegExp(`^Un paysan récolte (.+) kg d'arachide en (\\d+) jours\\. Quelle est sa récolte moyenne par jour \\?$`, "u").exec(prompt);
  if (m) return { context: "recoltes", list: values(m[1]) };
  return null;
};

const checkAverage: Check = (exo) => {
  const level = levelOf(exo);
  const read = readAverage(exo.prompt);
  if (!read) return `énoncé inconnu : ${exo.prompt}`;
  const { context, list } = read;
  const mean2 = mean2Of(list);
  const [lo, hi] = RANGE[context];
  return all(
    ok(Number.isInteger(mean2), "une moyenne qui ne tombe pas sur un demi"),
    ok(halves(rightOption(exo)) === mean2, `${exo.prompt} : ${rightOption(exo)}, pas ${mean2 / 2}`),
    ok(wrongOf(exo).every((option) => halves(option) !== mean2 && !list.some((v) => halves(option) === v * 2)), "un mauvais choix égal à la bonne réponse ou à une valeur de la série"),
    ok(list.length >= 3 && list.length <= 6 && COUNTS[level].includes(list.length), `${list.length} valeurs au niveau ${level}`),
    ok(list.every((v) => v >= lo && v <= hi), `une valeur hors de la plage de ${context}`),
    ok(mean2 % 2 === 0 || (level >= 3 && list.length % 2 === 0), "une moyenne avec un demi trop tôt"),
    ok(context === "notes" || level >= 2, `le contexte ${context} au premier palier`),
    ok(context !== "recoltes" || level >= 2, "des récoltes trop tôt"),
  );
};

const checkMissing: Check = (exo) => {
  const level = levelOf(exo);
  const blank = blankOf(exo);
  const m = new RegExp(`^La moyenne de (\\d+) notes est (${HALF})\\. Les notes connues sont (.+)\\. La note qui manque est ___\\.$`).exec(textOf(exo));
  if (!m) return `texte inconnu : ${textOf(exo)}`;
  const count = Number(m[1]);
  const known = values(m[3]);
  const expected = (halves(m[2]) * count) / 2 - known.reduce((a, b) => a + b, 0);
  return all(
    ok(known.length === count - 1, `${known.length} notes connues pour ${count} notes`),
    ok(Number.isInteger(expected) && expected >= 3 && expected <= 20, `la note qui manque, ${expected}, hors de 3 à 20`),
    ok(num(blank.answer) === expected, `${textOf(exo)} : ${blank.answer}, pas ${expected}`),
    ok(blank.options.every((option) => option === blank.answer || (num(option) !== expected && !known.includes(num(option)) && halves(option) !== halves(m[2]))), `un choix égal à la bonne réponse ou à un nombre du texte : ${blank.options.join(", ")}`),
    ok(COUNTS[level].includes(count), `${count} notes au niveau ${level}`),
  );
};

const checkCompare: Check = (exo) => {
  const level = levelOf(exo);
  const m = new RegExp(`^(\\p{L}+) a eu (.+)\\. (\\p{L}+) a eu (.+)\\. Qui a la meilleure moyenne \\?$`, "u").exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const a = values(m[2]);
  const b = values(m[4]);
  const expected = mean2Of(a) > mean2Of(b) ? m[1] : m[3];
  return all(
    ok(mean2Of(a) !== mean2Of(b), "deux moyennes égales"),
    ok(a.length === b.length, "deux séries de longueurs différentes"),
    ok(rightOption(exo) === expected, `${exo.prompt} : ${rightOption(exo)}, pas ${expected}`),
    ok(new Set(optionsOf(exo)).size === 3 && optionsOf(exo).includes("Ils ont la même moyenne"), "les trois choix"),
    ok(COUNTS[level].includes(a.length), `${a.length} notes au niveau ${level}`),
    ok([...a, ...b].every((v) => v >= 3 && v <= 20), "une note hors de 3 à 20"),
  );
};

const checkWrite: Check = (exo) => {
  const level = levelOf(exo);
  const m = new RegExp(`^Calcule la moyenne de (.+)\\. Écris le résultat\\.$`).exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const list = values(m[1]);
  const mean2 = mean2Of(list);
  return all(
    ok(Number.isInteger(mean2), "une moyenne qui ne tombe pas sur un demi"),
    ok(halves(exo.answerKey) === mean2, `${exo.prompt} : ${exo.answerKey}, pas ${mean2 / 2}`),
    ok(acceptedOf(exo).every((text) => halves(text) === mean2), `les écritures admises : ${acceptedOf(exo).join(" / ")}`),
    ok(acceptedOf(exo)[0] === exo.answerKey, "la première écriture admise est la réponse"),
    ok(COUNTS[level].includes(list.length), `${list.length} valeurs au niveau ${level}`),
    ok(list.every((v) => v >= 3 && v <= 45), "une valeur hors de la plage"),
  );
};

const checkOrder: Check = (exo) => {
  const m = /^Range ces séries d'après leur moyenne, de la (plus petite à la plus grande|plus grande à la plus petite)\.$/.exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const series = sequenceOf(exo).map(values);
  const means = series.map(mean2Of);
  const ascending = m[1].startsWith("plus petite");
  return all(
    ok(series.length === 4 && new Set(means).size === 4, "quatre moyennes différentes"),
    ok(means.every((mean, i) => i === 0 || (ascending ? mean > means[i - 1] : mean < means[i - 1])), `${exo.prompt} : ${sequenceOf(exo).join(" | ")}`),
    ok(means.every(Number.isInteger), "une moyenne qui ne tombe pas sur un demi"),
    ok(series.every((list) => list.every((v) => v >= 3 && v <= 20)), "une note hors de 3 à 20"),
  );
};

const checkLinks: Check = (exo) => {
  const pairs = pairsOf(exo);
  return all(
    ok(exo.prompt === "Relie chaque série à sa moyenne.", `énoncé inconnu : ${exo.prompt}`),
    ok(pairs.length === 3, "trois paires"),
    ...pairs.map((pair) => ok(Number.isInteger(mean2Of(values(pair.left))) && halves(pair.right) === mean2Of(values(pair.left)), `${pair.left} a pour moyenne ${mean2Of(values(pair.left)) / 2}, pas ${pair.right}`)),
    ok(new Set(pairs.map((pair) => halves(pair.right))).size === 3, "deux séries de même moyenne"),
  );
};

const checkSort: Check = (exo) => {
  const [first, second] = zonesOf(exo);
  const a = /^Moyenne inférieure à (\d+)$/.exec(first);
  const b = /^Moyenne supérieure à (\d+)$/.exec(second);
  if (!a || !b || a[1] !== b[1]) return `les cases : ${first} / ${second}`;
  const threshold2 = Number(a[1]) * 2;
  const items = itemsOf(exo);
  return all(
    ok(items.length === 4 && items.filter((item) => item.correctZone === first).length === 2, "deux séries par case"),
    ...items.map((item) => {
      const mean2 = mean2Of(values(item.text));
      return all(ok(mean2 !== threshold2, `${item.text} : une moyenne égale au seuil`), ok(item.correctZone === (mean2 < threshold2 ? first : second), `${item.text} est dans la mauvaise case (seuil ${a[1]})`));
    }),
    ok(Number(a[1]) >= 10 && Number(a[1]) <= 12, "un seuil hors de 10 à 12"),
  );
};

defineMathsTests({
  label: "des partages et de la moyenne du CM2",
  klass: "CM2",
  checks: {
    "cm2-par-egal": checkEqual,
    "cm2-par-inegal": checkUnequal,
    "cm2-par-parts": checkShares,
    "cm2-par-moyenne": checkAverage,
    "cm2-par-manquant": checkMissing,
    "cm2-par-comparer": checkCompare,
    "cm2-par-ecrire": checkWrite,
    "cm2-par-ranger": checkOrder,
    "cm2-par-relier": checkLinks,
    "cm2-par-glisser": checkSort,
  },
  topicKinds: {
    "ma-cm2-partages-moyenne": ["cm2-par-egal", "cm2-par-inegal", "cm2-par-parts", "cm2-par-moyenne", "cm2-par-manquant", "cm2-par-comparer", "cm2-par-ecrire", "cm2-par-ranger", "cm2-par-relier", "cm2-par-glisser"],
  },
});
