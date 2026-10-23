import { describe, expect, it } from "vitest";
import type { GameLevel } from "../paliers/games/shared";
import { acceptedOf, all, blankOf, defineMathsTests, itemsOf, levelOf, ok, optionsOf, pairsOf, rightOption, sequenceOf, textOf, wrongOf, zonesOf, type Check, type Exo } from "@/lib/test-support/cm1MathsKit";

/**
 * LES MESURES DU CM1 (`ma-cm1-mesures`).
 *
 * Chaque test RECALCULE la réponse avec sa propre arithmétique, écrite à part : toute mesure est ramenée à une unité de base (le millimètre, le gramme, le millilitre) par
 * le poids de son unité, une durée en minutes depuis minuit, un nombre décimal lu en centièmes sans nombre flottant. Le niveau 2 est celui des paliers 2 et 3, le niveau 3
 * celui du palier 4, le niveau 4 celui du palier 5.
 */

const NUMD = String.raw`\d+(?: \d{3})*(?:,\d{1,2})?`;

/** Un nombre écrit « 2,5 » ou « 2 500 » en centièmes : 250, 250000. */
function hundredths(text: string): number {
  const [whole, decimals = ""] = text.replace(/ /g, "").split(",");
  return Number(whole) * 100 + Number(decimals.padEnd(2, "0"));
}

/** Le poids de chaque unité dans l'unité de base de sa grandeur : le millimètre, le gramme, le millilitre. */
const WEIGHT: Record<string, number> = { km: 1000000, m: 1000, cm: 10, mm: 1, t: 1000000, kg: 1000, g: 1, L: 1000, dL: 100, cL: 10, mL: 1 };
const QUANTITY: Record<string, "longueur" | "masse" | "contenance"> = { km: "longueur", m: "longueur", cm: "longueur", mm: "longueur", t: "masse", kg: "masse", g: "masse", L: "contenance", dL: "contenance", cL: "contenance", mL: "contenance" };
const WORD: Record<string, string> = {
  kilomètres: "km", mètres: "m", centimètres: "cm", millimètres: "mm", tonnes: "t", kilogrammes: "kg", grammes: "g", litres: "L", décilitres: "dL", centilitres: "cL", millilitres: "mL",
};
const UNIT = "km|mm|cm|dL|cL|mL|kg|t|m|g|L";
const WORDS = Object.keys(WORD).join("|");

/** La valeur d'une mesure « 2,5 m » dans l'unité de base, en centièmes de cette unité (pour ne jamais passer par un flottant). */
const baseOf = (value: string, unit: string) => hundredths(value) * WEIGHT[unit];

const FAMILIES: Record<string, string[]> = {
  1: ["km>m", "m>cm", "kg>g", "L>cL"],
  2: ["km>m", "m>cm", "m>mm", "cm>mm", "t>kg", "kg>g", "L>dL", "L>cL", "L>mL", "cL>mL"],
  3: ["km>m", "m>cm", "m>mm", "cm>mm", "t>kg", "kg>g", "L>dL", "L>cL", "L>mL", "cL>mL"],
  4: ["km>m", "m>cm", "m>mm", "cm>mm", "t>kg", "kg>g", "L>dL", "L>cL", "L>mL", "cL>mL"],
};
const BIGS = new Set(["km", "t", "kg", "L", "m", "cm", "cL"]);
/** Le couple (grande, petite) de deux unités dites, dans le bon ordre ; `null` si elles ne sont pas voisines. */
function pairOf(a: string, b: string): { big: string; small: string } | null {
  const [big, small] = WEIGHT[a] >= WEIGHT[b] ? [a, b] : [b, a];
  return QUANTITY[a] === QUANTITY[b] && FAMILIES[2].includes(`${big}>${small}`) && BIGS.has(big) ? { big, small } : null;
}

const WHOLE_TOP: Record<GameLevel, number> = { 1: 6, 2: 12, 3: 20, 4: 30 };

const conversionOk = (fromValue: string, from: string, toValue: string, to: string, level: GameLevel): string | null => {
  const pair = pairOf(from, to);
  const up = pair !== null && pair.big === to;
  const bigValue = up ? toValue : fromValue;
  const bigC = hundredths(bigValue);
  return all(
    ok(baseOf(fromValue, from) === baseOf(toValue, to), `${fromValue} ${from} ne vaut pas ${toValue} ${to}`),
    ok(pair !== null && FAMILIES[level].includes(`${pair.big}>${pair.small}`), `le couple ${from} / ${to} au niveau ${level}`),
    ok(pair !== null && Number.isInteger((bigC * WEIGHT[pair.big]) / WEIGHT[pair.small] / 100), "une mesure dont la petite unité n'est pas entière"),
    ok(level >= 2 || !up, "de la petite vers la grande unité au premier palier"),
    ok(level >= 2 || bigC % 100 === 0, "un décimal au premier palier ou au deuxième"),
    ok(bigC <= WHOLE_TOP[level] * 100 + 75, `${bigValue} dépasse le plafond du niveau ${level}`),
    ok(level >= 3 || bigC >= 100, "moins d'une grande unité avant le quatrième palier"),
  );
};

const checkConvert: Check = (exo) => {
  const m = new RegExp(`^Convertis (${NUMD}) (${UNIT}) en (${WORDS})\\.$`).exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const to = WORD[m[3]];
  const right = /^(\S+(?: \d{3})*(?:,\d+)?) (\S+)$/.exec(rightOption(exo));
  if (!right || right[2] !== to) return `la réponse n'est pas dans ${to} : ${rightOption(exo)}`;
  return all(
    conversionOk(m[1], m[2], right[1], to, levelOf(exo)),
    ok(wrongOf(exo).every((option) => option.endsWith(` ${to}`) && baseOf(option.slice(0, -to.length - 1), to) !== baseOf(right[1], to)), "un mauvais choix égal à la réponse ou dans une autre unité"),
  );
};

const checkWrite: Check = (exo) => {
  const m = new RegExp(`^Combien de (${WORDS}) y a-t-il dans (${NUMD}) (${UNIT}) \\? Écris le nombre\\.$`).exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const to = WORD[m[1]];
  return all(
    ok(/^\d+(,\d+)?$/.test(exo.answerKey) && acceptedOf(exo).length === 1 && acceptedOf(exo)[0] === exo.answerKey, `une réponse mal écrite : ${exo.answerKey}`),
    conversionOk(m[2], m[3], exo.answerKey, to, levelOf(exo)),
  );
};

const checkGap: Check = (exo) => {
  const m = new RegExp(`^(${NUMD}) (${UNIT}) = ___ (${UNIT})$`).exec(textOf(exo));
  if (!m) return `phrase inconnue : ${textOf(exo)}`;
  return all(
    conversionOk(m[1], m[2], blankOf(exo).answer, m[3], levelOf(exo)),
    ok(blankOf(exo).options.every((option) => option === blankOf(exo).answer || baseOf(option, m[3]) !== baseOf(blankOf(exo).answer, m[3])), "un mauvais choix égal à la réponse"),
  );
};

/** Un libellé de mesure « 2,5 m » ou « 150 cm » : sa valeur dans l'unité de base. */
function labelValue(label: string): { base: number; unit: string } | null {
  const m = new RegExp(`^(${NUMD}) (${UNIT})$`).exec(label);
  return m ? { base: baseOf(m[1], m[2]), unit: m[2] } : null;
}

function comparable(labels: string[], level: GameLevel): string | null {
  const values = labels.map(labelValue);
  if (values.some((v) => v === null)) return `une mesure illisible : ${labels.join(" / ")}`;
  const list = values as { base: number; unit: string }[];
  const units = new Set(list.map((v) => v.unit));
  const pair = [...units].length === 2 ? pairOf([...units][0], [...units][1]) : null;
  return all(
    ok(new Set(list.map((v) => v.base)).size === labels.length, "deux mesures égales"),
    ok(units.size === 2 && pair !== null, `les unités ne sont pas deux unités voisines : ${[...units].join(", ")}`),
    ok(pair !== null && list.some((v) => v.unit === pair.big) && list.some((v) => v.unit === pair.small), "toutes dans la même unité : rien à convertir"),
    ok(pair !== null && FAMILIES[level].includes(`${pair.big}>${pair.small}`), `le couple au niveau ${level}`),
  );
}

const checkCompare: Check = (exo) => {
  const m = /^Quelle est la plus (grande|petite) (longueur|masse|contenance) \?$/.exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const values = optionsOf(exo).map(labelValue);
  if (values.some((v) => v === null)) return "une mesure illisible";
  const bases = (values as { base: number }[]).map((v) => v.base);
  const expected = m[1] === "grande" ? Math.max(...bases) : Math.min(...bases);
  return all(
    ok(labelValue(rightOption(exo))!.base === expected, `${exo.prompt} ${optionsOf(exo).join(" / ")} : ${rightOption(exo)}`),
    ok((values as { unit: string }[]).every((v) => QUANTITY[v.unit] === m[2]), "une mesure d'une autre grandeur"),
    comparable(optionsOf(exo), levelOf(exo)),
  );
};

const THINGS: Record<string, string> = { longueurs: "longueur", masses: "masse", contenances: "contenance" };

const checkOrder: Check = (exo) => {
  const m = /^Range ces (longueurs|masses|contenances) (de la plus petite à la plus grande|de la plus grande à la plus petite)\.$/.exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const ascending = m[2].includes("petite à la plus grande");
  const values = sequenceOf(exo).map(labelValue);
  if (values.some((v) => v === null)) return "une mesure illisible";
  const list = values as { base: number; unit: string }[];
  const bases = list.map((v) => v.base);
  const sorted = [...bases].sort((a, b) => (ascending ? a - b : b - a));
  return all(
    ok(JSON.stringify(bases) === JSON.stringify(sorted), `${exo.prompt} ${sequenceOf(exo).join(" / ")}`),
    ok(list.every((v) => QUANTITY[v.unit] === THINGS[m[1]]), "une mesure d'une autre grandeur"),
    ok(list.length === 4, "quatre mesures"),
    comparable(sequenceOf(exo), levelOf(exo)),
  );
};

/** Les vingt questions de l'unité : la bonne réponse, écrite à part. */
const UNIT_ANSWERS: Record<string, string> = {
  "mesurer la longueur de la cour": "Mètre",
  "mesurer la contenance d'une bassine": "Litre",
  "peser un sac de riz": "Kilogramme",
  "mesurer la distance entre deux villes": "Kilomètre",
  "mesurer la hauteur d'une fourmi": "Millimètre",
  "mesurer la longueur d'un crayon": "Centimètre",
  "peser une plume": "Gramme",
  "mesurer la contenance d'une cuillère": "Centilitre",
  "peser un camion chargé": "Tonne",
  "mesurer la contenance d'un verre": "Décilitre",
  "mesurer la hauteur d'une porte": "Mètre",
  "peser une pomme": "Gramme",
  "mesurer la contenance du grand bidon": "Litre",
  "mesurer la dose d'un médicament": "Millilitre",
  "peser un éléphant": "Tonne",
  "mesurer la longueur d'un fleuve": "Kilomètre",
  "mesurer la largeur d'un cahier": "Centimètre",
  "peser une lettre": "Gramme",
  "mesurer la masse d'un sac de ciment": "Kilogramme",
  "mesurer la hauteur d'un arbre": "Mètre",
};

const checkUnit: Check = (exo) => {
  const m = /^Quelle unité convient le mieux pour (.+) \?$/.exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const expected = UNIT_ANSWERS[m[1]];
  if (!expected) return `une question inconnue : ${m[1]}`;
  return all(ok(rightOption(exo) === expected, `${exo.prompt} : ${rightOption(exo)}, pas ${expected}`), ok(wrongOf(exo).every((option) => option !== expected), "un mauvais choix égal à la réponse"));
};

const checkLinks: Check = (exo) => {
  if (exo.prompt !== "Relie chaque mesure à la même mesure écrite dans une autre unité.") return `énoncé inconnu : ${exo.prompt}`;
  const rows = pairsOf(exo).map((pair) => ({ left: labelValue(pair.left), right: labelValue(pair.right) }));
  if (rows.some((row) => row.left === null || row.right === null)) return "une mesure illisible";
  return all(
    ok(rows.length === 3, "trois mesures"),
    ok(rows.every((row) => row.left!.base === row.right!.base && QUANTITY[row.left!.unit] === QUANTITY[row.right!.unit] && row.left!.unit !== row.right!.unit), `une paire fausse : ${pairsOf(exo).map((pair) => `${pair.left} ~ ${pair.right}`).join(" ; ")}`),
    ok(new Set(rows.map((row) => `${QUANTITY[row.left!.unit]}:${row.left!.base}`)).size === 3, "deux paires de même valeur"),
    ok(rows.every((row) => pairOf(row.left!.unit, row.right!.unit) !== null), "deux unités qui ne sont pas voisines"),
    ok(new Set(rows.map((row) => `${row.left!.unit}>${row.right!.unit}`)).size === 3, "deux paires du même couple"),
  );
};

const ZONE_OF: Record<string, "Longueur" | "Masse" | "Contenance"> = { longueur: "Longueur", masse: "Masse", contenance: "Contenance" };

const checkSort: Check = (exo) => {
  const [first, second] = zonesOf(exo);
  if (!["Longueur", "Masse", "Contenance"].includes(first) || !["Longueur", "Masse", "Contenance"].includes(second) || first === second) return `cases inconnues : ${zonesOf(exo).join(" / ")}`;
  const each = levelOf(exo) === 1 ? 2 : 3;
  const items = itemsOf(exo);
  const wrongPlace = items.find((item) => {
    const m = /^(\d+) (\S+)$/.exec(item.text);
    return !m || !QUANTITY[m[2]] || ZONE_OF[QUANTITY[m[2]]] !== item.correctZone;
  });
  return all(
    ok(!wrongPlace, `${wrongPlace?.text} n'est pas dans la bonne case`),
    ok(items.filter((item) => item.correctZone === first).length === each && items.filter((item) => item.correctZone === second).length === each, `${each} mesures par case`),
  );
};

// ---------------------------------------------------------------------------
// Les durées
// ---------------------------------------------------------------------------

/** « 14 h » ou « 14 h 05 » : les minutes depuis minuit. */
function readClock(text: string): number | null {
  const m = /^(\d{1,2}) h(?: (\d{2}))?$/.exec(text);
  return m && Number(m[1]) < 24 && (m[2] === undefined || Number(m[2]) < 60) ? Number(m[1]) * 60 + Number(m[2] ?? 0) : null;
}
/** « 45 min », « 2 h » ou « 1 h 35 min » : les minutes ; une durée écrite avec soixante minutes ou plus n'existe pas. */
function readDuration(text: string): number | null {
  const m = /^(?:(\d+) h)?(?: ?(\d{1,2}) min)?$/.exec(text);
  if (!m || (m[1] === undefined && m[2] === undefined) || (m[2] !== undefined && Number(m[2]) >= 60)) return null;
  return Number(m[1] ?? 0) * 60 + Number(m[2] ?? 0);
}

const DURATION_FORMS: Record<GameLevel, string[]> = {
  1: ["ecoule", "heures-minutes"],
  2: ["ecoule", "arrivee", "heures-minutes", "minutes-heures"],
  3: ["ecoule", "arrivee", "somme", "minutes-heures"],
  4: ["arrivee", "somme", "minutes-heures", "heures-minutes"],
};

const checkDuration: Check = (exo) => {
  const level = levelOf(exo);
  const durationOptions = optionsOf(exo).map(readDuration);
  const clockOptions = optionsOf(exo).map(readClock);
  let m = /^Un film commence à (.+) et finit à (.+)\. Combien de temps dure-t-il \?$/.exec(exo.prompt);
  if (m) {
    const [t1, t2] = [readClock(m[1]), readClock(m[2])];
    if (t1 === null || t2 === null) return `une heure illisible : ${exo.prompt}`;
    const d = t2 - t1;
    const shape = level === 1 ? d % 30 === 0 && t1 % 30 === 0 && d >= 30 && d <= 180 : level === 2 ? (d % 15 === 0 && t1 % 15 === 0 && d >= 30 && d <= 180) || ((t1 % 60) + d < 60 && d % 5 === 0 && d >= 10 && d < 60) : level === 3 ? d % 5 === 0 && d >= 65 && d <= 200 : false;
    return all(
      ok(d > 0 && readDuration(rightOption(exo)) === d, `${exo.prompt} : ${rightOption(exo)}, pas ${d} minutes`),
      ok(durationOptions.every((v) => v !== null) && durationOptions.filter((v) => v === d).length === 1, `durées illisibles ou en double : ${optionsOf(exo).join(" / ")}`),
      ok(DURATION_FORMS[level].includes("ecoule") && shape, `la durée ${d} min (départ ${m[1]}) au niveau ${level}`),
    );
  }
  m = /^Un car part à (.+) et roule (.+)\. À quelle heure arrive-t-il \?$/.exec(exo.prompt);
  if (m) {
    const [t1, d] = [readClock(m[1]), readDuration(m[2])];
    if (t1 === null || d === null) return `une heure ou une durée illisible : ${exo.prompt}`;
    const t2 = t1 + d;
    const shape = level === 2 ? (d % 15 === 0 && t1 % 15 === 0 && d >= 30 && d <= 180) || ((t1 % 60) + d < 60 && d % 5 === 0 && d >= 10 && d < 60) : level === 3 ? d % 5 === 0 && d >= 65 && d <= 200 : d % 5 === 0 && d >= 65 && d <= 300;
    return all(
      ok(t2 < 24 * 60 && readClock(rightOption(exo)) === t2, `${exo.prompt} : ${rightOption(exo)}, pas ${Math.floor(t2 / 60)} h ${t2 % 60}`),
      ok(clockOptions.every((v) => v !== null) && clockOptions.filter((v) => v === t2).length === 1, `heures illisibles ou en double : ${optionsOf(exo).join(" / ")}`),
      ok(DURATION_FORMS[level].includes("arrivee") && shape, `la durée ${d} min au niveau ${level}`),
    );
  }
  m = /^Un élève lit pendant (.+), puis fait ses devoirs pendant (.+)\. Quelle durée en tout \?$/.exec(exo.prompt);
  if (m) {
    const [a, b] = [readDuration(m[1]), readDuration(m[2])];
    if (a === null || b === null) return `une durée illisible : ${exo.prompt}`;
    return all(
      ok(readDuration(rightOption(exo)) === a + b, `${exo.prompt} : ${rightOption(exo)}, pas ${a + b} minutes`),
      ok(durationOptions.every((v) => v !== null) && durationOptions.filter((v) => v === a + b).length === 1, `durées illisibles ou en double : ${optionsOf(exo).join(" / ")}`),
      ok(DURATION_FORMS[level].includes("somme") && a % 5 === 0 && b % 5 === 0, `somme au niveau ${level}`),
    );
  }
  m = /^Convertis (\d+) min en heures et minutes\.$/.exec(exo.prompt);
  if (m) {
    const total = Number(m[1]);
    return all(
      ok(readDuration(rightOption(exo)) === total, `${exo.prompt} : ${rightOption(exo)}, pas ${total} minutes`),
      ok(durationOptions.every((v) => v !== null) && durationOptions.filter((v) => v === total).length === 1, `durées illisibles ou en double : ${optionsOf(exo).join(" / ")}`),
      ok(total % 60 !== 0 && total > 60 && total <= 305 && total % 5 === 0, `${total} minutes hors du palier`),
      ok(DURATION_FORMS[level].includes("minutes-heures"), `minutes en heures au niveau ${level}`),
    );
  }
  m = /^Convertis (.+) en minutes\.$/.exec(exo.prompt);
  if (m) {
    const d = readDuration(m[1]);
    if (d === null) return `une durée illisible : ${m[1]}`;
    const right = /^(\d+) min$/.exec(rightOption(exo));
    return all(
      ok(!!right && Number(right[1]) === d, `${exo.prompt} : ${rightOption(exo)}, pas ${d} min`),
      ok(wrongOf(exo).every((option) => /^\d+ min$/.test(option) && Number(option.replace(" min", "")) !== d), "un mauvais choix égal à la réponse"),
      ok(DURATION_FORMS[level].includes("heures-minutes") && d >= 60, `heures en minutes au niveau ${level}`),
    );
  }
  return `énoncé inconnu : ${exo.prompt}`;
};

const checkProblem: Check = (exo) => {
  const level = levelOf(exo);
  const forms: Record<GameLevel, string[]> = {
    1: ["morceaux"],
    2: ["morceaux", "reste", "bouteilles", "sacs"],
    3: ["sacs", "bouteilles", "reste"],
    4: ["tonnes", "bouteilles", "reste"],
  };
  let m = /^Une corde de (\d+) m est coupée en morceaux de (\d+) cm\. Combien de morceaux obtient-on \?$/.exec(exo.prompt);
  let form: string;
  let expected: string;
  if (m) {
    form = "morceaux";
    if ((Number(m[1]) * 100) % Number(m[2]) !== 0) return `${m[1]} m ne se coupe pas en morceaux de ${m[2]} cm sans reste`;
    expected = fmtNum((Number(m[1]) * 100) / Number(m[2]));
  } else if ((m = new RegExp(`^Un trajet mesure (\\d+) km\\. Un cycliste a déjà roulé (${NUMD}) m\\. Combien de mètres lui reste-t-il à faire \\?$`).exec(exo.prompt))) {
    form = "reste";
    const left = Number(m[1]) * 1000 - hundredths(m[2]) / 100;
    if (left <= 0) return "le cycliste a déjà tout roulé";
    expected = `${fmtNum(left)} m`;
  } else if ((m = /^On verse (\d+) L d'eau dans des bouteilles de (\d+) cL\. Combien de bouteilles faut-il \?$/.exec(exo.prompt))) {
    form = "bouteilles";
    if ((Number(m[1]) * 100) % Number(m[2]) !== 0) return `${m[1]} L ne se verse pas en bouteilles de ${m[2]} cL sans reste`;
    expected = fmtNum((Number(m[1]) * 100) / Number(m[2]));
  } else if ((m = /^Un commerçant reçoit (\d+) sacs de (\d+) kg de riz\. Quelle masse de riz reçoit-il en tout \?$/.exec(exo.prompt))) {
    form = "sacs";
    expected = `${fmtNum(Number(m[1]) * Number(m[2]))} kg`;
  } else if ((m = /^On charge (\d+) sacs de (\d+) kg dans un camion\. Quelle est la masse chargée, en tonnes \?$/.exec(exo.prompt))) {
    form = "tonnes";
    const kg = Number(m[1]) * Number(m[2]);
    if (kg % 250 !== 0) return `${kg} kg ne font pas un nombre de quarts de tonne`;
    expected = `${fmtDec((kg * 100) / 1000)} t`;
  } else return `énoncé inconnu : ${exo.prompt}`;
  return all(
    ok(rightOption(exo) === expected, `${exo.prompt} : ${rightOption(exo)}, pas ${expected}`),
    ok(optionsOf(exo).filter((option) => option === expected).length === 1, "deux fois la bonne réponse"),
    ok(forms[level].includes(form), `la forme ${form} au niveau ${level}`),
  );
};

const fmtNum = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
/** Un nombre de centièmes écrit à l'école : 250 donne « 2,5 », 100 donne « 1 », 25 donne « 0,25 ». */
function fmtDec(h: number): string {
  const whole = Math.floor(h / 100);
  const rest = h % 100;
  return rest === 0 ? fmtNum(whole) : rest % 10 === 0 ? `${fmtNum(whole)},${rest / 10}` : `${fmtNum(whole)},${String(rest).padStart(2, "0")}`;
}

const TOPIC_KINDS = {
  "ma-cm1-mesures": ["convertir", "ecrire", "trou", "comparer", "ranger", "unite", "relier", "glisser", "duree", "probleme"].map((k) => `cm1-mes-${k}`),
};

defineMathsTests({
  label: "des mesures du CM1",
  checks: {
    "cm1-mes-convertir": checkConvert,
    "cm1-mes-ecrire": checkWrite,
    "cm1-mes-trou": checkGap,
    "cm1-mes-comparer": checkCompare,
    "cm1-mes-ranger": checkOrder,
    "cm1-mes-unite": checkUnit,
    "cm1-mes-relier": checkLinks,
    "cm1-mes-glisser": checkSort,
    "cm1-mes-duree": checkDuration,
    "cm1-mes-probleme": checkProblem,
  },
  topicKinds: TOPIC_KINDS,
});

describe("les vérifications des mesures voient un énoncé abîmé", () => {
  const qcm = (prompt: string, options: string[], correctIndex: number, level: number) =>
    ({ type: "qcm", prompt, answerKey: options[correctIndex], hints: [], payload: { options, correctIndex, game: { kind: "x", level } } }) as Exo;
  const gap = (text: string, options: string[], answer: string, level: number) =>
    ({ type: "fill-blank", prompt: "x", answerKey: answer, hints: [], payload: { text, blanks: [{ options, answer }], game: { kind: "x", level } } }) as Exo;

  it("2,5 km valent 2 500 m, pas 250 m ni 25 000 m", () => {
    expect(checkConvert(qcm("Convertis 2,5 km en mètres.", ["2 500 m", "250 m", "25 000 m"], 0, 3))).toBeNull();
    expect(checkConvert(qcm("Convertis 2,5 km en mètres.", ["2 500 m", "250 m", "25 000 m"], 1, 3))).not.toBeNull();
    expect(checkGap(gap("1 t = ___ kg", ["1 000", "100", "10 000"], "100", 2))).not.toBeNull();
    expect(checkGap(gap("1 t = ___ kg", ["1 000", "100", "10 000"], "1 000", 2))).toBeNull();
  });

  it("250 centimètres sont plus que 2 mètres : on ne compare pas 250 et 2", () => {
    expect(checkCompare(qcm("Quelle est la plus grande longueur ?", ["250 cm", "2 m", "1,5 m"], 0, 2))).toBeNull();
    expect(checkCompare(qcm("Quelle est la plus grande longueur ?", ["250 cm", "2 m", "1,5 m"], 1, 2))).not.toBeNull();
    expect(checkCompare(qcm("Quelle est la plus petite longueur ?", ["150 cm", "1,5 m", "2 m"], 2, 2))).not.toBeNull();
  });

  it("les durées : retrancher les minutes à l'envers, couper 135 minutes en 1 h 35, ou écrire 1 h 75 min sont refusés", () => {
    expect(checkDuration(qcm("Un film commence à 14 h 45 et finit à 16 h 20. Combien de temps dure-t-il ?", ["1 h 35 min", "2 h 25 min", "1 h 15 min"], 0, 3))).toBeNull();
    expect(checkDuration(qcm("Un film commence à 14 h 45 et finit à 16 h 20. Combien de temps dure-t-il ?", ["1 h 35 min", "2 h 25 min", "1 h 15 min"], 1, 3))).not.toBeNull();
    expect(checkDuration(qcm("Convertis 135 min en heures et minutes.", ["2 h 15 min", "1 h 35 min", "2 h 25 min"], 0, 3))).toBeNull();
    expect(checkDuration(qcm("Convertis 135 min en heures et minutes.", ["2 h 15 min", "1 h 35 min", "2 h 25 min"], 1, 3))).not.toBeNull();
    expect(checkDuration(qcm("Convertis 135 min en heures et minutes.", ["2 h 15 min", "1 h 75 min", "2 h 25 min"], 0, 3))).not.toBeNull();
  });

  it("le problème des bouteilles et des tonnes : un nombre entier de bouteilles, des sacs qui font des quarts de tonne", () => {
    expect(checkProblem(qcm("On verse 4 L d'eau dans des bouteilles de 50 cL. Combien de bouteilles faut-il ?", ["8", "80", "2"], 0, 2))).toBeNull();
    expect(checkProblem(qcm("On verse 4 L d'eau dans des bouteilles de 50 cL. Combien de bouteilles faut-il ?", ["8", "80", "2"], 1, 2))).not.toBeNull();
    expect(checkProblem(qcm("On charge 40 sacs de 25 kg dans un camion. Quelle est la masse chargée, en tonnes ?", ["1 t", "0,1 t", "10 t"], 0, 4))).toBeNull();
    expect(checkProblem(qcm("On charge 40 sacs de 25 kg dans un camion. Quelle est la masse chargée, en tonnes ?", ["1 t", "0,1 t", "10 t"], 2, 4))).not.toBeNull();
  });
});
