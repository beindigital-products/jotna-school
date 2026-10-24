import { acceptedOf, all, blankOf, defineMathsTests, itemsOf, levelOf, num, ok, optionsOf, pairsOf, rightOption, sequenceOf, textOf, wrongOf, zonesOf, type Check, type Exo } from "@/lib/test-support/cm1MathsKit";
import type { GameLevel } from "../paliers/games/shared";

/**
 * SOLIDES ET VOLUMES AU CM2 (`ma-cm2-volumes`).
 *
 * Chaque test RECALCULE la réponse avec sa propre arithmétique, écrite à part : le volume d'un pavé droit est la longueur fois la largeur fois la hauteur,
 * celui d'un cube est son arête au cube, une conversion passe par les centimètres cubes (un décimètre cube ou un litre en vaut mille, un mètre cube un million),
 * un angle se nomme d'après sa mesure. Le niveau 2 réunit les paliers 2 et 3, le niveau 3 est le palier 4, le niveau 4 le palier 5.
 */

const NUM = String.raw`\d+(?: \d{3})*`;
const fmt = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const numbersIn = (text: string) => (text.match(new RegExp(NUM, "g")) ?? []).map(num);
const CUBIC: Record<string, string> = { cm: "cm³", dm: "dm³", m: "m³" };

/** Les unités et les plages de dimensions de chaque niveau pour un pavé ou un cube : [unité, plus petite, plus grande]. */
const SOLIDS: Record<GameLevel, readonly (readonly [string, number, number])[]> = {
  1: [["cm", 2, 5]],
  2: [["cm", 2, 9], ["dm", 2, 10]],
  3: [["cm", 10, 30]],
  4: [["m", 2, 12]],
};
const solidOk = (unit: string, dims: number[], level: GameLevel, cubeMax?: number) =>
  SOLIDS[level].some(([u, lo, hi]) => u === unit && dims.every((d) => d >= lo && d <= Math.min(hi, cubeMax ?? hi)));

const wrongsFit = (exo: Exo, answer: number, suffix: string, own: number[], max: number) =>
  ok(
    wrongOf(exo).every((option) => option.endsWith(` ${suffix}`) && num(option.replace(` ${suffix}`, "")) !== answer && !own.includes(num(option.replace(` ${suffix}`, ""))) && num(option.replace(` ${suffix}`, "")) <= max),
    `un mauvais choix égal à la bonne réponse, à un nombre de l'énoncé ou trop grand : ${wrongOf(exo).join(" ; ")}`,
  );

const checkBox: Check = (exo) => {
  const level = levelOf(exo);
  const m = /^Un pavé droit mesure (\d+) (cm|dm|m) sur (\d+) \2 sur (\d+) \2\. Quel est son volume \?$/.exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const [length, width, height] = [Number(m[1]), Number(m[3]), Number(m[4])];
  const volume = length * width * height;
  return all(
    ok(solidOk(m[2], [length, width, height], level), `${length} ${m[2]} sur ${width} sur ${height} au niveau ${level}`),
    ok(length >= width && width >= height && !(length === height), "des dimensions mal rangées ou toutes égales"),
    ok(rightOption(exo) === `${fmt(volume)} ${CUBIC[m[2]]}`, `${exo.prompt} : ${rightOption(exo)}, pas ${fmt(volume)} ${CUBIC[m[2]]}`),
    wrongsFit(exo, volume, CUBIC[m[2]], [length, width, height], Math.max(volume * 3, 20)),
  );
};

const checkCube: Check = (exo) => {
  const level = levelOf(exo);
  const m = /^Un cube a une arête de (\d+) (cm|dm|m)\. Quel est son volume \?$/.exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const edge = Number(m[1]);
  return all(
    ok(solidOk(m[2], [edge], level, m[2] === "cm" && level === 3 ? 20 : undefined), `${edge} ${m[2]} au niveau ${level}`),
    ok(rightOption(exo) === `${fmt(edge * edge * edge)} ${CUBIC[m[2]]}`, `${exo.prompt} : ${rightOption(exo)}, pas ${fmt(edge ** 3)}`),
    wrongsFit(exo, edge ** 3, CUBIC[m[2]], [edge], Math.max(edge ** 3 * 3, 20)),
  );
};

const checkGap: Check = (exo) => {
  const level = levelOf(exo);
  const text = textOf(exo);
  const { answer, options } = blankOf(exo);
  const own = numbersIn(text);
  const wrongNums = options.filter((option) => option !== answer).map(num);
  const common = all(ok(!wrongNums.some((n) => own.includes(n) || n === num(answer)), `un mauvais choix égal à la bonne réponse ou à un nombre du texte : ${options.join(" ; ")}`), ok(exo.hints.length === 3, "trois indices"));
  const box = new RegExp(`^Un pavé droit de volume (${NUM}) (cm³|dm³|m³) a une longueur de (\\d+) (cm|dm|m) et une largeur de (\\d+) \\4\\. Sa hauteur est ___ \\4\\.$`).exec(text);
  if (box) {
    const [volume, length, width] = [num(box[1]), Number(box[3]), Number(box[5])];
    const height = volume / (length * width);
    return all(
      common,
      ok(box[2] === CUBIC[box[4]], "l'unité du volume ne suit pas celle des longueurs"),
      ok(Number.isInteger(height) && solidOk(box[4], [length, width, height], level), `${text} : hauteur ${height} au niveau ${level}`),
      ok(length >= width && width >= height, "des dimensions mal rangées"),
      ok(num(answer) === height, `${text} : ${answer}, pas ${height}`),
    );
  }
  const cube = new RegExp(`^Un cube de volume (${NUM}) (cm³|dm³|m³) a une arête de ___ (cm|dm|m)\\.$`).exec(text);
  if (cube) {
    const volume = num(cube[1]);
    const edge = Math.round(Math.cbrt(volume));
    return all(common, ok(edge ** 3 === volume, `${volume} n'est pas un cube`), ok(cube[2] === CUBIC[cube[3]], "l'unité du volume ne suit pas celle de l'arête"), ok(solidOk(cube[3], [edge], level, cube[3] === "cm" && level === 3 ? 20 : undefined), `arête ${edge} ${cube[3]} au niveau ${level}`), ok(num(answer) === edge, `${text} : ${answer}, pas ${edge}`));
  }
  return `phrase à trou inconnue : ${text}`;
};

const checkWrite: Check = (exo) => {
  const level = levelOf(exo);
  const cube = /^Un cube a une arête de (\d+) (cm|dm|m)\. Écris son volume en (cm³|dm³|m³)\.$/.exec(exo.prompt);
  const box = /^Un pavé droit mesure (\d+) (cm|dm|m) sur (\d+) \2 sur (\d+) \2\. Écris son volume en (cm³|dm³|m³)\.$/.exec(exo.prompt);
  let volume: number;
  let unit: string;
  let asked: string;
  if (cube) {
    const edge = Number(cube[1]);
    volume = edge ** 3;
    [unit, asked] = [cube[2], cube[3]];
    if (!solidOk(unit, [edge], level, unit === "cm" && level === 3 ? 20 : undefined)) return `${edge} ${unit} au niveau ${level}`;
  } else if (box) {
    const dims = [Number(box[1]), Number(box[3]), Number(box[4])];
    volume = dims[0] * dims[1] * dims[2];
    [unit, asked] = [box[2], box[5]];
    if (!solidOk(unit, dims, level)) return `${dims.join(" sur ")} ${unit} au niveau ${level}`;
  } else return `énoncé inconnu : ${exo.prompt}`;
  return all(
    ok(asked === CUBIC[unit], "l'unité demandée ne suit pas celle des longueurs"),
    ok(exo.answerKey === fmt(volume), `${exo.prompt} : ${exo.answerKey}, pas ${fmt(volume)}`),
    ok(acceptedOf(exo).includes(fmt(volume)) && acceptedOf(exo).includes(String(volume)) && new Set(acceptedOf(exo)).size === acceptedOf(exo).length, `les réponses acceptées : ${acceptedOf(exo).join(" ; ")}`),
  );
};

/** Un volume en centimètres cubes : un décimètre cube ou un litre en vaut mille, un mètre cube un million. */
const CM3: Record<string, number> = { "cm³": 1, "dm³": 1000, L: 1000, "m³": 1000000 };
const UNIT = String.raw`(?:cm³|dm³|m³|L)`;
const CONVERSIONS: Record<GameLevel, readonly string[]> = {
  1: ["dm³>L", "L>dm³"],
  2: ["dm³>L", "L>dm³", "dm³>cm³", "cm³>dm³", "L>cm³", "cm³>L"],
  3: ["dm³>cm³", "cm³>dm³", "L>cm³", "cm³>L", "m³>dm³", "dm³>m³", "m³>L", "L>m³"],
  4: ["dm³>cm³", "cm³>dm³", "L>cm³", "cm³>L", "m³>dm³", "dm³>m³", "m³>L", "L>m³"],
};
const COUNT_TOP: Record<GameLevel, number> = { 1: 9, 2: 20, 3: 50, 4: 90 };

const checkUnits: Check = (exo) => {
  const level = levelOf(exo);
  const m = new RegExp(`^Convertis (${NUM}) (${UNIT}) en (${UNIT})\\.$`).exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const n = num(m[1]);
  const result = (n * CM3[m[2]]) / CM3[m[3]];
  const small = Math.min(n, result);
  return all(
    ok(CONVERSIONS[level].includes(`${m[2]}>${m[3]}`), `la conversion ${m[2]} en ${m[3]} au niveau ${level}`),
    ok(Number.isInteger(result) && result >= 2, `un résultat qui ne tombe pas juste : ${result}`),
    ok(small >= 2 && small <= COUNT_TOP[level], `le nombre ${small} hors de la plage du niveau ${level}`),
    ok(rightOption(exo) === `${fmt(result)} ${m[3]}`, `${exo.prompt} : ${rightOption(exo)}, pas ${fmt(result)} ${m[3]}`),
    wrongsFit(exo, result, m[3], [n], Math.max(result * 100, 1000)),
  );
};

const CONTAINERS: Record<string, { unit: string; pronoun: string; adjective: string }> = {
  "Un aquarium": { unit: "dm", pronoun: "il", adjective: "plein" },
  "Une caisse": { unit: "cm", pronoun: "elle", adjective: "pleine" },
  "Une citerne": { unit: "m", pronoun: "elle", adjective: "pleine" },
};
/** Les dimensions d'un récipient de chaque niveau, dans son unité : [plus petite, plus grande]. */
const CONTAINER_DIMS: Record<GameLevel, Record<string, readonly [number, number]>> = {
  1: { dm: [2, 5] },
  2: { dm: [3, 8], cm: [10, 50] },
  3: { m: [2, 4] },
  4: { m: [2, 6] },
};

const checkContent: Check = (exo) => {
  const level = levelOf(exo);
  const m = /^(Un aquarium|Une caisse|Une citerne) en forme de pavé droit mesure (\d+) (dm|cm|m) sur (\d+) \3 sur (\d+) \3\. Combien de litres d'eau contient-(il|elle) quand \6 est (plein|pleine) \?$/.exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const [container, unit, pronoun, adjective] = [m[1], m[3], m[6], m[7]];
  const dims = [Number(m[2]), Number(m[4]), Number(m[5])];
  const spec = CONTAINERS[container];
  const range = CONTAINER_DIMS[level][unit];
  const product = dims[0] * dims[1] * dims[2];
  const litres = unit === "dm" ? product : unit === "cm" ? product / 1000 : product * 1000;
  return all(
    ok(spec.unit === unit && spec.pronoun === pronoun && spec.adjective === adjective, `${container} en ${unit}, « ${pronoun} est ${adjective} »`),
    ok(!!range && dims.every((d) => d >= range[0] * (unit === "cm" ? 1 : 1) && d <= range[1]) && (unit !== "cm" || dims.every((d) => d % 10 === 0)), `${dims.join(" sur ")} ${unit} au niveau ${level}`),
    ok(dims[0] >= dims[1] && dims[1] >= dims[2] && dims[0] !== dims[2], "des dimensions mal rangées ou toutes égales"),
    ok(Number.isInteger(litres), `un nombre de litres qui ne tombe pas juste : ${litres}`),
    ok(rightOption(exo) === `${fmt(litres)} L`, `${exo.prompt} : ${rightOption(exo)}, pas ${fmt(litres)} L`),
    wrongsFit(exo, litres, "L", dims, Math.max(litres * 100, 1000)),
  );
};

const TILE = new RegExp(`^(${NUM}) (cm³|dm³|m³|L)$`);
const cm3Of = (tile: string) => {
  const m = TILE.exec(tile);
  return m ? num(m[1]) * CM3[m[2]] : null;
};
const UNITS_BY_LEVEL: Record<GameLevel, readonly string[]> = { 1: ["cm³", "dm³"], 2: ["cm³", "dm³", "L"], 3: ["cm³", "dm³", "L", "m³"], 4: ["cm³", "dm³", "L", "m³"] };

const checkOrder: Check = (exo) => {
  const level = levelOf(exo);
  const tiles = sequenceOf(exo);
  const values = tiles.map(cm3Of);
  if (values.some((v) => v === null)) return `une tuile mal écrite : ${tiles.join(" ; ")}`;
  const ascending = exo.prompt === "Range ces volumes, du plus petit au plus grand.";
  if (!ascending && exo.prompt !== "Range ces volumes, du plus grand au plus petit.") return `énoncé inconnu : ${exo.prompt}`;
  const numbers = values as number[];
  const units = tiles.map((tile) => tile.split(" ").pop() as string);
  return all(
    ok(tiles.length === 4 && new Set(numbers).size === 4, "quatre volumes de valeurs différentes"),
    ok(new Set(units).size >= 2, "tous les volumes dans la même unité"),
    ok(units.every((unit) => UNITS_BY_LEVEL[level].includes(unit)), `une unité hors du niveau ${level} : ${units.join(" ")}`),
    ok(numbers.every((v, i) => i === 0 || (ascending ? numbers[i - 1] < v : numbers[i - 1] > v)), `l'ordre ${numbers.join(" ; ")} ne suit pas la consigne`),
  );
};

const checkLinks: Check = (exo) => {
  const level = levelOf(exo);
  const pairs = pairsOf(exo);
  const values = pairs.map((pair) => cm3Of(pair.left));
  return all(
    ok(pairs.length === 3 && new Set(values).size === 3, "trois volumes différents"),
    ...pairs.map((pair) => {
      const l = TILE.exec(pair.left);
      const r = TILE.exec(pair.right);
      if (!l || !r) return `une tuile mal écrite : ${pair.left} ~ ${pair.right}`;
      return all(
        ok(cm3Of(pair.left) === cm3Of(pair.right), `${pair.left} n'est pas égal à ${pair.right}`),
        ok(CONVERSIONS[level].includes(`${l[2]}>${r[2]}`), `la conversion ${l[2]} en ${r[2]} au niveau ${level}`),
      );
    }),
    ok(new Set(pairs.map((pair) => pair.right)).size === 3, "deux tuiles égales à droite"),
  );
};

const ANGLES: Record<GameLevel, readonly number[]> = {
  1: [30, 45, 60, 90, 120, 135, 150],
  2: [20, 40, 70, 90, 100, 110, 140, 160, 180, 10, 80, 85, 95, 105, 170],
  3: [5, 15, 88, 89, 90, 91, 92, 175, 179, 180],
  4: [5, 15, 88, 89, 90, 91, 92, 175, 179, 180],
};
const NAMES = ["Un angle aigu", "Un angle droit", "Un angle obtus", "Un angle plat"];
const nameOf = (degrees: number) => (degrees < 90 ? NAMES[0] : degrees === 90 ? NAMES[1] : degrees < 180 ? NAMES[2] : NAMES[3]);

const checkAngle: Check = (exo) => {
  const level = levelOf(exo);
  const m = /^Comment s'appelle un angle de (\d+) degrés \?$/.exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const degrees = Number(m[1]);
  return all(
    ok(ANGLES[level].includes(degrees), `${degrees} degrés au niveau ${level}`),
    ok(rightOption(exo) === nameOf(degrees), `${exo.prompt} : ${rightOption(exo)}, pas ${nameOf(degrees)}`),
    ok(optionsOf(exo).every((option) => NAMES.includes(option)) && new Set(optionsOf(exo)).size === 3, `des choix hors des quatre noms : ${optionsOf(exo).join(" ; ")}`),
    ok(level > 1 || !optionsOf(exo).includes(NAMES[3]), "l'angle plat servi au premier palier"),
  );
};

const checkSort: Check = (exo) => {
  const level = levelOf(exo);
  const zones = zonesOf(exo);
  const items = itemsOf(exo);
  return all(
    ok(zones[0] === "Angle aigu" && zones[1] === "Angle obtus", `cases inconnues : ${zones.join(" ; ")}`),
    ok(items.length === 4 && items.filter((item) => item.correctZone === zones[0]).length === 2, "deux angles par case"),
    ...items.map((item) => {
      const m = /^(\d+) degrés$/.exec(item.text);
      if (!m) return `une tuile mal écrite : ${item.text}`;
      const degrees = Number(m[1]);
      return all(ok(degrees !== 90 && degrees !== 180 && ANGLES[level].includes(degrees), `${degrees} degrés au niveau ${level}`), ok(item.correctZone === (degrees < 90 ? zones[0] : zones[1]), `${item.text} est rangé dans « ${item.correctZone} »`));
    }),
  );
};

defineMathsTests({
  label: "des solides et des volumes du CM2",
  klass: "CM2",
  checks: {
    "cm2-vol-pave": checkBox,
    "cm2-vol-cube": checkCube,
    "cm2-vol-trou": checkGap,
    "cm2-vol-ecrire": checkWrite,
    "cm2-vol-unites": checkUnits,
    "cm2-vol-boite": checkContent,
    "cm2-vol-ranger": checkOrder,
    "cm2-vol-relier": checkLinks,
    "cm2-vol-angle": checkAngle,
    "cm2-vol-glisser": checkSort,
  },
  topicKinds: {
    "ma-cm2-volumes": ["cm2-vol-pave", "cm2-vol-cube", "cm2-vol-trou", "cm2-vol-ecrire", "cm2-vol-unites", "cm2-vol-boite", "cm2-vol-ranger", "cm2-vol-relier", "cm2-vol-angle", "cm2-vol-glisser"],
  },
});
