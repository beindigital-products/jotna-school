import { describe, expect, it, vi } from "vitest";
import { auditExercise } from "../paliers/exerciseAudit";
import { GAME_KINDS, generateGames, type GameKind } from "../paliers/games";
import { makeContext, type GameLevel } from "../paliers/games/shared";
import { topicUsesModel } from "../paliers/pregen";
import { allProgrammeEntries } from "../programme";
import { PALIER_SIZE } from "../paliers/scoring";

// Ces tests jouent des milliers de tirages : sur le serveur de CI, chargé, l'un d'eux dépasse les 5 secondes par défaut.
vi.setConfig({ testTimeout: 60_000 });

/**
 * LES MATHÉMATIQUES DU CE1, SECONDE MOITIÉ : la géométrie, les mesures, la monnaie et les durées, les problèmes.
 *
 * Chaque test RECALCULE la bonne réponse avec ses propres tables et sa propre arithmétique, écrites à part : les propriétés de chaque figure, les facteurs
 * entre unités, la valeur d'une pile de pièces, la différence entre deux heures, la suite des jours et des mois, la solution de chaque histoire lue dans
 * son énoncé. Un gabarit dont la réponse contredit sa règle, ou qui sort de la plage de sa fiche, échoue. À la fin, des MUTATIONS : on abîme la bonne
 * réponse d'un exercice juste, et chaque vérification doit le voir.
 */

const LEVELS: GameLevel[] = [1, 2, 3, 4];
const draws = LEVELS.flatMap((level) => Array.from({ length: 60 }, (_, n) => ({ level, seed: `ce1m2:${level}:${n}` })));
const make = (kind: GameKind, d: { level: GameLevel; seed: string }) => GAME_KINDS[kind].make(makeContext("CE1", d.level, `${kind}:${d.seed}`));

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
/** Le nombre d'un texte : « 1 234 » vaut 1234. */
const num = (text: string) => Number(text.replace(/ /g, ""));
const NUMBER = String.raw`\d+(?: \d{3})*`;

// ===========================================================================
// LA GÉOMÉTRIE, ÉCRITE À PART
// ===========================================================================

type Figure = "carré" | "rectangle" | "triangle" | "cercle";
const FIGURES: Record<Figure, { côtés: number; sommets: number; "angles droits": number }> = {
  carré: { côtés: 4, sommets: 4, "angles droits": 4 },
  rectangle: { côtés: 4, sommets: 4, "angles droits": 4 },
  triangle: { côtés: 3, sommets: 3, "angles droits": -1 },
  cercle: { côtés: 0, sommets: 0, "angles droits": 0 },
};

/** Les figures nommées dans un énoncé, avec leur nombre : « un carré » vaut un, « deux carrés » vaut deux. */
function figuresIn(text: string): { figure: Figure; count: number }[] {
  return [...text.matchAll(/(?<![\p{L}])(un|une|deux) (carré|rectangle|triangle|cercle)s?(?![\p{L}])/giu)].map((match) => ({
    figure: match[2].toLowerCase() as Figure,
    count: match[1].toLowerCase() === "deux" ? 2 : 1,
  }));
}

type Property = "côtés" | "sommets" | "angles droits";

/** Combien de côtés, de sommets ou d'angles droits, d'après la question. Un triangle n'a pas de nombre d'angles droits : la question n'existe pas. */
function countFor(prompt: string): number | string {
  const property = /combien d(?:e |')(côtés|sommets|angles droits)/i.exec(prompt)?.[1] as Property | undefined;
  if (!property) return `pas de question de comptage : ${prompt}`;
  const figures = figuresIn(prompt);
  if (figures.length === 0) return `aucune figure dans ${prompt}`;
  let total = 0;
  for (const { figure, count } of figures) {
    const value = FIGURES[figure][property];
    if (value < 0) return `${property} d'un ${figure} : question interdite`;
    total += value * count;
  }
  return total;
}

const checkGeoFigure: Check = (exo) => {
  const q = exo.prompt;
  const expected = /longs côtés/.test(q) ? "Le rectangle" : /même longueur|tous égaux/.test(q) ? "Le carré" : /trois/.test(q) ? "Le triangle" : /aucun côté droit|aucun sommet|ronde/.test(q) ? "Le cercle" : null;
  const options = optionsOf(exo);
  return all(
    ok(expected !== null, `question inconnue : ${q}`),
    ok(rightOption(exo) === expected, `${q} : ${rightOption(exo)}, pas ${expected}`),
    // Un carré est aussi un rectangle : quand la bonne réponse est l'un des deux, l'autre n'est jamais proposé.
    ok(!(["Le carré", "Le rectangle"].includes(rightOption(exo)) && options.includes("Le carré") && options.includes("Le rectangle")), `le carré et le rectangle ensemble : ${options.join(", ")}`),
    ok(options.every((option) => ["Le carré", "Le rectangle", "Le triangle", "Le cercle"].includes(option)), `une figure inconnue : ${options.join(", ")}`),
  );
};

const checkGeoLines: Check = (exo) => {
  const q = exo.prompt;
  const expected = /ne se croisent jamais|rails|lignes d'une page|se font face/.test(q) ? "Parallèles" : /angle droit|bord du haut|forment un coin|se suivent/.test(q) ? "Perpendiculaires" : null;
  return all(
    ok(expected !== null, `question inconnue : ${q}`),
    ok(rightOption(exo) === expected, `${q} : ${rightOption(exo)}, pas ${expected}`),
    ok(!optionsOf(exo).some((option) => /sécante/i.test(option)), "« sécantes » est aussi juste pour des perpendiculaires"),
    ok(same(optionsOf(exo), ["Parallèles", "Perpendiculaires", "Courbes"]), `choix inattendus : ${optionsOf(exo).join(", ")}`),
  );
};

const checkGeoTool: Check = (exo) => {
  const q = exo.prompt;
  const expected = /cercle|rond|pointe et une mine/.test(q) ? "Compas" : /angle|carré/.test(q) ? "Équerre" : /trait bien droit|mesure-t-on/.test(q) ? "Règle" : null;
  return all(
    ok(expected !== null, `question inconnue : ${q}`),
    ok(rightOption(exo) === expected, `${q} : ${rightOption(exo)}, pas ${expected}`),
    ok(optionsOf(exo).every((option) => ["Règle", "Compas", "Équerre", "Gomme"].includes(option)), `un instrument inconnu : ${optionsOf(exo).join(", ")}`),
    // L'équerre est parfois graduée : on ne la propose pas contre la règle pour mesurer.
    ok(!/mesure-t-on/.test(q) || !optionsOf(exo).includes("Équerre"), "l'équerre contre la règle pour mesurer"),
  );
};

const checkGeoCount: Check = (exo) => {
  const expected = countFor(exo.prompt);
  return all(
    ok(typeof expected === "number", String(expected)),
    ok(rightOption(exo) === String(expected), `${exo.prompt} : ${rightOption(exo)}, pas ${expected}`),
    ok(wrongOf(exo).every((option) => /^\d$/.test(option)), `un choix qui n'est pas un chiffre : ${optionsOf(exo).join(", ")}`),
  );
};

const checkGeoGap: Check = (exo) => {
  const text = textOf(exo);
  const { answer } = blankOf(exo);
  const figure = /^Un (carré|triangle|rectangle|cercle) a ___ (côtés?|sommets?|angles droits)/.exec(text);
  if (figure) {
    const property = (figure[2].startsWith("côté") ? "côtés" : figure[2].startsWith("sommet") ? "sommets" : "angles droits") as Property;
    const expected = FIGURES[figure[1] as Figure][property];
    return all(ok(expected >= 0, `${text} : question interdite`), ok(answer === String(expected), `${text} : ${answer}, pas ${expected}`));
  }
  const expected =
    /^Des droites ___ ne se croisent jamais/.test(text) || /font face dans un rectangle sont ___/.test(text)
      ? "parallèles"
      : /^Des droites ___ se coupent en formant un angle droit/.test(text) || /se suivent dans un carré sont ___/.test(text)
        ? "perpendiculaires"
        : null;
  return all(ok(expected !== null, `phrase inconnue : ${text}`), ok(answer === expected, `${text} : ${answer}, pas ${expected}`));
};

const DESCRIPTION: Record<string, string> = {
  "Le carré": "4 côtés de même longueur",
  "Le rectangle": "2 longs côtés et 2 courts côtés",
  "Le triangle": "3 côtés et 3 sommets",
  "Le cercle": "aucun côté ni sommet",
  "Droites parallèles": "ne se croisent jamais",
  "Droites perpendiculaires": "se coupent en angle droit",
};

const checkGeoLinks: Check = (exo) =>
  all(
    ok(pairsOf(exo).length === 3, "trois paires"),
    ...pairsOf(exo).map((pair) => ok(DESCRIPTION[pair.left] === pair.right, `${pair.left} ~ ${pair.right}`)),
  );

const WITH_RIGHT = ["Page de cahier", "Porte de la classe", "Tableau noir", "Carreau du cahier", "Fenêtre de la classe"];
const ROUND = ["Pièce de monnaie", "Roue de vélo", "Assiette", "Bouton de chemise", "Couvercle de casserole"];
const PARALLEL = ["Rails d'une voie ferrée", "Lignes d'un cahier", "Barreaux d'une échelle", "Bords d'une règle", "Bords d'une route droite"];
const PERPENDICULAR = ["Haut et côté du tableau", "Mur et sol de la classe", "Coin d'une feuille", "Montant et barreau d'une échelle", "Bords voisins d'une porte"];

const checkGeoSort: Check = (exo) => {
  const level = levelOf(exo);
  const zones =
    level <= 2
      ? { yes: "A des angles droits", no: "N'a aucun angle droit", yesItems: WITH_RIGHT, noItems: ROUND }
      : { yes: "Droites parallèles", no: "Droites perpendiculaires", yesItems: PARALLEL, noItems: PERPENDICULAR };
  return all(
    ok(same(zonesOf(exo), [zones.yes, zones.no]), `cases inattendues : ${zonesOf(exo).join(", ")}`),
    ...itemsOf(exo).map((item) => {
      const expected = zones.yesItems.includes(item.text) ? zones.yes : zones.noItems.includes(item.text) ? zones.no : null;
      return ok(expected === item.correctZone, `${item.text} → ${item.correctZone}, pas ${expected}`);
    }),
    ok(itemsOf(exo).length >= 4 && itemsOf(exo).length <= 5, "quatre ou cinq étiquettes"),
    ok(new Set(itemsOf(exo).map((item) => item.correctZone)).size === 2, "les deux cases sont servies"),
  );
};

const GEO_STEPS: Record<string, string[]> = {
  "Mets dans le bon ordre les étapes pour tracer un segment.": ["Je place deux points sur la feuille.", "Je pose la règle sur les deux points.", "Je trace le trait le long de la règle."],
  "Mets dans le bon ordre les étapes pour vérifier un angle droit.": ["Je pose l'équerre sur l'angle.", "Je regarde si les deux côtés touchent l'équerre.", "Je dis si l'angle est droit ou non."],
  "Mets dans le bon ordre les étapes pour tracer un cercle.": ["Je pose la pointe du compas sur un point.", "Je tourne le compas autour de ce point.", "Je lève le compas quand le tour est fini."],
  "Mets dans le bon ordre les étapes pour mesurer un segment.": ["Je place le zéro de la règle au début du segment.", "Je regarde où le segment se termine.", "Je lis le nombre en face de la fin."],
  "Mets dans le bon ordre les étapes pour tracer un carré.": ["Je trace un côté avec la règle.", "Je trace un angle droit avec l'équerre.", "Je reporte la même longueur sur le nouveau côté.", "Je ferme la figure avec la règle."],
  "Mets dans le bon ordre les étapes pour tracer un rectangle.": ["Je trace le premier côté avec la règle.", "Je trace un angle droit avec l'équerre.", "Je trace les deux autres côtés.", "Je repasse les traits au crayon."],
  "Mets dans le bon ordre les étapes pour tracer un triangle.": ["Je place les points A, B et C.", "Je trace le côté AB.", "Je trace le côté BC.", "Je trace le côté CA."],
  "Mets dans le bon ordre les étapes pour construire une figure demandée.": ["Je lis la consigne.", "Je choisis les instruments.", "Je trace la figure.", "Je vérifie avec la règle et l'équerre."],
};

const checkGeoSteps: Check = (exo) => {
  const expected = GEO_STEPS[exo.prompt];
  const level = levelOf(exo);
  return all(
    ok(expected !== undefined, `énoncé inconnu : ${exo.prompt}`),
    ok(JSON.stringify(sequenceOf(exo)) === JSON.stringify(expected), `${exo.prompt} : ${sequenceOf(exo).join(" / ")}`),
    ok(sequenceOf(exo).length === (level <= 2 ? 3 : 4), `${sequenceOf(exo).length} étapes au palier ${level}`),
  );
};

const checkGeoWrite: Check = (exo) => {
  const expected = countFor(exo.prompt);
  return all(
    ok(typeof expected === "number", String(expected)),
    ok(acceptedOf(exo).length === 1 && acceptedOf(exo)[0] === String(expected), `${exo.prompt} : ${acceptedOf(exo).join(",")}, pas ${expected}`),
    ok(exo.answerKey === String(expected), "la clé de réponse"),
    ok(/Écris le nombre\.$/.test(exo.prompt), "la consigne d'écriture"),
  );
};

// ===========================================================================
// LES MESURES, ÉCRITES À PART
// ===========================================================================

/** La valeur d'une unité en centimètres (longueurs) ou en grammes (masses) : le mètre vaut 100 centimètres, le kilomètre 100 000. */
const BASE: Record<string, number> = { cm: 1, m: 100, km: 100000, g: 1, kg: 1000 };
const SYMBOL_OF_WORD: Record<string, string> = { centimètres: "cm", mètres: "m", kilomètres: "km", grammes: "g", kilogrammes: "kg" };
const KIND_OF: Record<string, "longueur" | "masse"> = { cm: "longueur", m: "longueur", km: "longueur", g: "masse", kg: "masse" };

/** Une mesure écrite, simple (« 2 500 g ») ou composée (« 2 m 50 cm ») : sa valeur dans la plus petite unité et les unités employées. */
function measureOf(text: string): { value: number; units: string[] } | null {
  const parts = [...text.matchAll(new RegExp(`(${NUMBER}) (cm|km|kg|m|g)\\b`, "g"))];
  if (parts.length === 0 || parts.map((part) => part[0]).join(" ") !== text) return null;
  return { value: parts.reduce((sum, part) => sum + num(part[1]) * BASE[part[2]], 0), units: parts.map((part) => part[2]) };
}

/** Le couple d'unités d'un palier : le mètre et le centimètre, le kilogramme et le gramme, le kilomètre et le mètre. */
const FAMILY_UNITS = [new Set(["m", "cm"]), new Set(["kg", "g"]), new Set(["km", "m"])];
const familyIndexOf = (units: string[]) => FAMILY_UNITS.findIndex((family) => units.every((unit) => family.has(unit)));
const ALLOWED_FAMILIES: Record<GameLevel, number[]> = { 1: [0], 2: [1], 3: [2, 0], 4: [0, 1, 2] };

const checkMesConvert: Check = (exo) => {
  const match = /^Convertis (.+) en (centimètres|mètres|kilomètres|grammes|kilogrammes)\.$/.exec(exo.prompt);
  if (!match) return `énoncé inconnu : ${exo.prompt}`;
  const from = measureOf(match[1]);
  const target = SYMBOL_OF_WORD[match[2]];
  const answer = measureOf(rightOption(exo));
  if (!from || !answer) return `mesure illisible : ${exo.prompt} / ${rightOption(exo)}`;
  const level = levelOf(exo);
  return all(
    ok(answer.units.length === 1 && answer.units[0] === target, `${rightOption(exo)} n'est pas en ${target}`),
    ok(answer.value === from.value, `${match[1]} = ${rightOption(exo)} ? ${from.value} contre ${answer.value}`),
    ok(KIND_OF[from.units[0]] === KIND_OF[target], "mélange de longueur et de masse"),
    ok(familyIndexOf([...from.units, target]) >= 0 && ALLOWED_FAMILIES[level].includes(familyIndexOf([...from.units, target])), `un couple d'unités hors du palier ${level} : ${exo.prompt}`),
    ok(from.units.length === 1 || level === 4, "un nombre composé avant le dernier palier"),
    ok(wrongOf(exo).every((option) => measureOf(option)?.units[0] === target && measureOf(option)?.value !== answer.value), `un mauvais choix qui n'en est pas un : ${optionsOf(exo).join(", ")}`),
  );
};

const checkMesWrite: Check = (exo) => {
  const match = /^Combien de (centimètres|mètres|kilomètres|grammes|kilogrammes) y a-t-il dans (.+) \? Écris le nombre\.$/.exec(exo.prompt);
  if (!match) return `énoncé inconnu : ${exo.prompt}`;
  const from = measureOf(match[2]);
  const target = SYMBOL_OF_WORD[match[1]];
  if (!from) return `mesure illisible : ${match[2]}`;
  const level = levelOf(exo);
  const expected = from.value / BASE[target];
  return all(
    ok(Number.isInteger(expected), `${match[2]} n'est pas un nombre entier de ${match[1]}`),
    ok(acceptedOf(exo).length === 1 && num(acceptedOf(exo)[0]) === expected, `${exo.prompt} : ${acceptedOf(exo)}, pas ${expected}`),
    ok(ALLOWED_FAMILIES[level].includes(familyIndexOf([...from.units, target])), `un couple d'unités hors du palier ${level}`),
  );
};

const checkMesCompare: Check = (exo) => {
  const match = /^Quelle est la plus (grande|petite) (longueur|masse|distance) \?$/.exec(exo.prompt);
  if (!match) return `énoncé inconnu : ${exo.prompt}`;
  const measures = optionsOf(exo).map((option) => measureOf(option));
  if (measures.some((measure) => !measure)) return `mesure illisible : ${optionsOf(exo).join(", ")}`;
  const values = measures.map((measure) => measure!.value);
  const units = measures.flatMap((measure) => measure!.units);
  const extreme = match[1] === "grande" ? Math.max(...values) : Math.min(...values);
  const family = familyIndexOf(units);
  const level = levelOf(exo);
  const wordFamily: Record<string, number> = { longueur: 0, masse: 1, distance: 2 };
  return all(
    ok(new Set(values).size === 3, `deux mesures égales : ${optionsOf(exo).join(", ")}`),
    ok(measureOf(rightOption(exo))!.value === extreme, `${exo.prompt} ${optionsOf(exo).join(", ")} : ${rightOption(exo)}`),
    ok(family >= 0 && ALLOWED_FAMILIES[level].includes(family), `unités hors du palier ${level} : ${units.join(",")}`),
    ok(new Set(units).size === 2, "il faut convertir : une grande et une petite unité"),
    ok(wordFamily[match[2]] === family, `le mot « ${match[2]} » ne va pas avec ${units.join(",")}`),
  );
};

const checkMesOrder: Check = (exo) => {
  const match = /^Range ces (longueurs|masses|distances) (de la plus petite à la plus grande|de la plus grande à la plus petite)\.$/.exec(exo.prompt);
  if (!match) return `énoncé inconnu : ${exo.prompt}`;
  const measures = sequenceOf(exo).map((tile) => measureOf(tile));
  if (measures.some((measure) => !measure)) return `mesure illisible : ${sequenceOf(exo).join(", ")}`;
  const values = measures.map((measure) => measure!.value);
  const ascending = match[2].startsWith("de la plus petite");
  const sorted = [...values].sort((a, b) => (ascending ? a - b : b - a));
  const units = measures.flatMap((measure) => measure!.units);
  return all(
    ok(sequenceOf(exo).length === 4 && new Set(values).size === 4, "quatre mesures différentes"),
    ok(JSON.stringify(values) === JSON.stringify(sorted), `${exo.prompt} ${sequenceOf(exo).join(" / ")}`),
    ok(familyIndexOf(units) >= 0 && ALLOWED_FAMILIES[levelOf(exo)].includes(familyIndexOf(units)), "unités hors du palier"),
    ok(new Set(units).size === 2, "il faut convertir"),
  );
};

const UNIT_OF: [RegExp, string][] = [
  [/longueur de la cour/, "Mètre"],
  [/l'eau du seau/, "Litre"],
  [/gros sac de riz/, "Kilogramme"],
  [/longueur d'un crayon/, "Centimètre"],
  [/une plume/, "Gramme"],
  [/lait d'une bouteille/, "Litre"],
  [/distance entre deux villes/, "Kilomètre"],
  [/sac de ciment/, "Kilogramme"],
  [/huile du bidon/, "Litre"],
  [/hauteur d'une porte/, "Mètre"],
  [/une pomme/, "Gramme"],
  [/longueur d'une gomme/, "Centimètre"],
];

const checkMesUnit: Check = (exo) => {
  const expected = UNIT_OF.find(([pattern]) => pattern.test(exo.prompt))?.[1];
  const words = ["Mètre", "Centimètre", "Kilomètre", "Kilogramme", "Gramme", "Litre"];
  return all(
    ok(expected !== undefined, `question inconnue : ${exo.prompt}`),
    ok(rightOption(exo) === expected, `${exo.prompt} : ${rightOption(exo)}, pas ${expected}`),
    ok(optionsOf(exo).every((option) => words.includes(option)), `une unité inconnue : ${optionsOf(exo).join(", ")}`),
  );
};

const SIZE_OF: [RegExp, string][] = [
  [/^Un crayon/, "15 cm"],
  [/^La porte de la classe/, "2 m"],
  [/^Une règle d'écolier/, "30 cm"],
  [/^La cour de l'école/, "30 m"],
  [/^La route entre deux villes/, "50 km"],
  [/^Un cahier pèse/, "200 g"],
  [/^Un sac de riz pèse/, "25 kg"],
  [/^Une plume/, "1 g"],
  [/^Un bidon d'huile/, "5 L"],
  [/^Une bouteille d'eau/, "1 L"],
  [/^Une pomme/, "150 g"],
  [/^Un élève de CE1/, "120 cm"],
];

const checkMesSize: Check = (exo) => {
  const expected = SIZE_OF.find(([pattern]) => pattern.test(exo.prompt))?.[1];
  const number = expected?.split(" ")[0];
  return all(
    ok(expected !== undefined, `question inconnue : ${exo.prompt}`),
    ok(rightOption(exo) === expected, `${exo.prompt} : ${rightOption(exo)}, pas ${expected}`),
    ok(optionsOf(exo).every((option) => option.startsWith(`${number} `)), `le même nombre dans les trois choix : ${optionsOf(exo).join(", ")}`),
  );
};

const checkMesGap: Check = (exo) => {
  const text = textOf(exo);
  const { answer } = blankOf(exo);
  const equality = new RegExp(`^(${NUMBER}) (m|km|kg) = ___ (cm|m|g)$`).exec(text);
  if (equality) {
    const expected = (num(equality[1]) * BASE[equality[2]]) / BASE[equality[3]];
    return all(ok(num(answer) === expected, `${text} : ${answer}, pas ${expected}`), ok(KIND_OF[equality[2]] === KIND_OF[equality[3]], "longueur et masse mêlées"));
  }
  const sentences: [RegExp, string][] = [
    [/^Un crayon mesure 15 ___ de long\.$/, "centimètres"],
    [/^La cour de l'école mesure 30 ___ de long\.$/, "mètres"],
    [/^Un sac de riz pèse 25 ___\.$/, "kilogrammes"],
    [/^Une plume pèse 2 ___\.$/, "grammes"],
    [/^La route entre deux villes mesure 50 ___\.$/, "kilomètres"],
    [/^Un seau contient 10 ___ d'eau\.$/, "litres"],
  ];
  const expected = sentences.find(([pattern]) => pattern.test(text))?.[1];
  return all(ok(expected !== undefined, `phrase inconnue : ${text}`), ok(answer === expected, `${text} : ${answer}, pas ${expected}`));
};

const MEASURE_TILES: Record<string, string> = {};
for (const tile of ["Hauteur d'un arbre", "Longueur d'une corde", "Largeur de la classe", "Distance entre deux villages", "Longueur d'un crayon"]) MEASURE_TILES[tile] = "Longueur";
for (const tile of ["Poids d'un sac de riz", "Poids d'un poisson", "Poids d'un cahier", "Poids d'une pomme", "Poids d'un bébé"]) MEASURE_TILES[tile] = "Poids";
for (const tile of ["Eau d'un seau", "Lait d'une bouteille", "Huile d'un bidon", "Jus d'une carafe", "Eau d'une marmite"]) MEASURE_TILES[tile] = "Quantité de liquide";
const SORT_ZONES: Record<GameLevel, [string, string]> = { 1: ["Longueur", "Quantité de liquide"], 2: ["Poids", "Quantité de liquide"], 3: ["Longueur", "Poids"], 4: ["Quantité de liquide", "Longueur"] };

const checkMesSort: Check = (exo) =>
  all(
    ok(same(zonesOf(exo), SORT_ZONES[levelOf(exo)]), `cases inattendues : ${zonesOf(exo).join(", ")}`),
    ...itemsOf(exo).map((item) => ok(MEASURE_TILES[item.text] === item.correctZone, `${item.text} → ${item.correctZone}, pas ${MEASURE_TILES[item.text]}`)),
    ok(new Set(itemsOf(exo).map((item) => item.correctZone)).size === 2, "les deux cases sont servies"),
  );

const checkMesLinks: Check = (exo) =>
  all(
    ok(pairsOf(exo).length === 3, "trois paires"),
    ...pairsOf(exo).map((pair) => {
      const left = measureOf(pair.left);
      const right = measureOf(pair.right);
      return ok(!!left && !!right && left.value === right.value && left.units[0] !== right.units[0], `${pair.left} ~ ${pair.right}`);
    }),
  );

const checkMesProblem: Check = (exo) => {
  const q = exo.prompt;
  let expected: number | undefined;
  let suffix = "";
  let m: RegExpExecArray | null;
  if ((m = /^Une marmite contient (\d+) litres et un bidon (\d+) litres\./.exec(q))) [expected, suffix] = [Number(m[1]) + Number(m[2]), " litres"];
  else if ((m = /^Un seau contient (\d+) litres d'eau\. \S+ en verse (\d+) litres/.exec(q))) [expected, suffix] = [Number(m[1]) - Number(m[2]), " litres"];
  else if ((m = /^Un panier contient (\d) kg de mangues et (\d+(?: \d{3})?) g de bananes\./.exec(q))) [expected, suffix] = [Number(m[1]) * 1000 + num(m[2]), " g"];
  else if ((m = /^Un sac de riz pèse (\d) kg\. \S+ en retire (\d+(?: \d{3})?) g\./.exec(q))) [expected, suffix] = [Number(m[1]) * 1000 - num(m[2]), " g"];
  else if ((m = /^\S+ a (\d) m de ruban rouge et (\d+) cm de ruban bleu\./.exec(q))) [expected, suffix] = [Number(m[1]) * 100 + Number(m[2]), " cm"];
  else if ((m = /^Une corde mesure (\d) m\. \S+ en coupe (\d+) cm\./.exec(q))) [expected, suffix] = [Number(m[1]) * 100 - Number(m[2]), " cm"];
  else if ((m = /^\S+ marche (\d) km le matin, puis (\d+(?: \d{3})?) m l'après-midi\./.exec(q))) [expected, suffix] = [Number(m[1]) * 1000 + num(m[2]), " m"];
  else if ((m = /^Une route mesure (\d) km\. \S+ en a déjà fait (\d+(?: \d{3})?) m\./.exec(q))) [expected, suffix] = [Number(m[1]) * 1000 - num(m[2]), " m"];
  if (expected === undefined) return `énoncé inconnu : ${q}`;
  const level = levelOf(exo);
  const litres = suffix === " litres";
  const family = litres ? -1 : suffix === " g" ? 1 : suffix === " cm" ? 0 : 2;
  return all(
    ok(rightOption(exo) === `${fmt(expected)}${suffix}`, `${q} : ${rightOption(exo)}, pas ${expected}${suffix}`),
    ok(expected > 0, "un résultat qui n'est pas positif"),
    ok(wrongOf(exo).every((option) => option.endsWith(suffix) && num(option.slice(0, -suffix.length)) > 0), `un mauvais choix hors de l'unité : ${optionsOf(exo).join(", ")}`),
    ok(level === 1 ? litres : level === 2 ? litres || family === 1 : level === 3 ? family === 0 || family === 2 : family >= 0, `une histoire hors du palier ${level} : ${q}`),
  );
};

// ===========================================================================
// LA MONNAIE ET LES DURÉES, ÉCRITES À PART
// ===========================================================================

const VALUES: Record<GameLevel, number[]> = { 1: [500, 200, 100, 50], 2: [2000, 1000, 500, 200, 100], 3: [5000, 2000, 1000, 500, 200], 4: [10000, 5000, 2000, 1000, 500] };
const PURSE_TOP: Record<GameLevel, number> = { 1: 1000, 2: 5000, 3: 10000, 4: 10000 };
const STACK = new RegExp(`(\\d+) (pièces?|billets?) de (${NUMBER}) F`, "g");

/** Les piles d'un porte-monnaie écrit : le nombre, le nom (pièce ou billet) et la valeur. */
function stacksIn(text: string): { count: number; noun: string; value: number }[] {
  return [...text.matchAll(STACK)].map((match) => ({ count: Number(match[1]), noun: match[2], value: num(match[3]) }));
}

/** Une pile est bien écrite : pièce sous mille francs, billet à partir de mille, pluriel avec plusieurs. */
const stackIsWritten = (stack: { count: number; noun: string; value: number }) => stack.noun === `${stack.value >= 1000 ? "billet" : "pièce"}${stack.count > 1 ? "s" : ""}`;
const totalOf = (stacks: { count: number; value: number }[]) => stacks.reduce((sum, stack) => sum + stack.count * stack.value, 0);
/** « 1 500 F » vaut 1500. */
const francsOf = (option: string) => num(option.replace(/ F$/, ""));

const checkMonSum: Check = (exo) => {
  const stacks = stacksIn(exo.prompt);
  const level = levelOf(exo);
  const total = totalOf(stacks);
  const values = stacks.map((stack) => stack.value);
  return all(
    ok(stacks.length === (level === 4 ? 3 : 2), `${stacks.length} piles au palier ${level}`),
    ok(stacks.every(stackIsWritten), `une pile mal écrite : ${exo.prompt}`),
    ok(stacks.every((stack) => stack.count >= 1 && stack.count <= 3 && VALUES[level].includes(stack.value)), `une valeur hors du palier ${level} : ${exo.prompt}`),
    ok(values.every((value, i) => i === 0 || value < values[i - 1]), "des piles qui ne sont pas rangées de la plus grande à la plus petite"),
    ok(total <= PURSE_TOP[level], `${total} F dépasse le plafond`),
    ok(rightOption(exo) === `${fmt(total)} F`, `${exo.prompt} : ${rightOption(exo)}, pas ${total}`),
    ok(wrongOf(exo).every((option) => /^[\d ]+ F$/.test(option) && francsOf(option) <= 10000), `un mauvais choix inattendu : ${optionsOf(exo).join(", ")}`),
  );
};

const checkMonCount: Check = (exo) => {
  const match = new RegExp(`^Combien de (pièces|billets) de (${NUMBER}) F faut-il pour payer (${NUMBER}) F \\?$`).exec(exo.prompt);
  if (!match) return `énoncé inconnu : ${exo.prompt}`;
  const [value, total] = [num(match[2]), num(match[3])];
  const level = levelOf(exo);
  const answer = /^(\d+) (pièces|billets)$/.exec(rightOption(exo));
  return all(
    ok(match[1] === (value >= 1000 ? "billets" : "pièces"), `${match[1]} de ${value} F`),
    ok(total % value === 0 && total / value >= 2 && total / value <= 9, `${total} F avec des ${value} F`),
    ok(!!answer && Number(answer[1]) === total / value && answer[2] === match[1], `${exo.prompt} : ${rightOption(exo)}, pas ${total / value}`),
    ok(VALUES[level].includes(value) && total <= PURSE_TOP[level], `hors du palier ${level} : ${exo.prompt}`),
    ok(wrongOf(exo).every((option) => new RegExp(`^\\d+ ${match[1]}$`).test(option)), `un mauvais choix inattendu : ${optionsOf(exo).join(", ")}`),
  );
};

const PAID: Record<GameLevel, number[]> = { 1: [500, 1000], 2: [1000, 2000], 3: [2000, 5000], 4: [5000, 10000] };
const STEP: Record<GameLevel, number> = { 1: 50, 2: 250, 3: 250, 4: 250 };

/** Un achat : le prix, la somme donnée et la manière de la donner (« une pièce de 500 F », « un billet de 1 000 F »). */
function purchaseIn(prompt: string): { price: number; paid: number; instrument: string } | null {
  const match = new RegExp(`à (${NUMBER}) F\\. (?:Il|Elle) paie avec (une pièce|un billet) de (${NUMBER}) F\\.`).exec(prompt);
  return match ? { price: num(match[1]), paid: num(match[3]), instrument: match[2] } : null;
}

const checkPurchase = (exo: Exo, answer: number | null): string | null => {
  const purchase = purchaseIn(exo.prompt);
  if (!purchase) return `énoncé inconnu : ${exo.prompt}`;
  const level = levelOf(exo);
  return all(
    ok(purchase.instrument === (purchase.paid >= 1000 ? "un billet" : "une pièce"), `${purchase.instrument} de ${purchase.paid} F`),
    ok(PAID[level].includes(purchase.paid), `${purchase.paid} F donnés au palier ${level}`),
    ok(purchase.price % STEP[level] === 0 && purchase.price > 0 && purchase.price < purchase.paid, `un prix de ${purchase.price} F (pas de ${STEP[level]})`),
    ok(answer === purchase.paid - purchase.price, `${exo.prompt} : ${answer}, pas ${purchase.paid - purchase.price}`),
  );
};

const checkMonChange: Check = (exo) => {
  const answer = /^([\d ]+) F$/.exec(rightOption(exo));
  return all(
    ok(/Combien lui rend-on \?$/.test(exo.prompt), "la question"),
    checkPurchase(exo, answer ? num(answer[1]) : null),
    ok(wrongOf(exo).every((option) => /^[\d ]+ F$/.test(option) && francsOf(option) % STEP[levelOf(exo)] === 0 && francsOf(option) <= purchaseIn(exo.prompt)!.paid), `un mauvais choix inattendu : ${optionsOf(exo).join(", ")}`),
  );
};

const checkMonLinks: Check = (exo) =>
  all(
    ok(pairsOf(exo).length === 3, "trois paires"),
    ...pairsOf(exo).map((pair) => {
      const stacks = stacksIn(pair.left);
      return ok(stacks.length >= 1 && stacks.every(stackIsWritten) && `${fmt(totalOf(stacks))} F` === pair.right, `${pair.left} ~ ${pair.right}`);
    }),
  );

const checkMonWrite: Check = (exo) => {
  const accepted = acceptedOf(exo);
  if (/Combien de francs lui rend-on \? Écris le nombre\.$/.test(exo.prompt)) return all(checkPurchase(exo, accepted.length === 1 ? Number(accepted[0]) : null), ok(exo.answerKey === accepted[0], "la clé"));
  const stacks = stacksIn(exo.prompt);
  const level = levelOf(exo);
  return all(
    ok(/Combien de francs a-t-(il|elle) \? Écris le nombre\.$/.test(exo.prompt), `énoncé inconnu : ${exo.prompt}`),
    ok(stacks.length === (level === 4 ? 3 : 2) && stacks.every(stackIsWritten), `piles : ${exo.prompt}`),
    ok(accepted.length === 1 && Number(accepted[0]) === totalOf(stacks), `${exo.prompt} : ${accepted}, pas ${totalOf(stacks)}`),
    ok(totalOf(stacks) <= PURSE_TOP[level], "plafond"),
  );
};

/** L'horloge : 🕐 à 🕛 sont les heures justes (1 à 12), 🕜 à 🕧 les demi-heures (1 à 12). */
function clockIn(text: string): { hour: number; half: boolean } | null {
  for (const char of text) {
    const code = char.codePointAt(0)!;
    if (code >= 0x1f550 && code <= 0x1f55b) return { hour: code - 0x1f550 + 1, half: false };
    if (code >= 0x1f55c && code <= 0x1f567) return { hour: code - 0x1f55c + 1, half: true };
  }
  return null;
}
const hoursText = (hour: number, half: boolean) => `${hour} heure${hour > 1 ? "s" : ""}${half ? " et demie" : ""}`;

const checkDurRead: Check = (exo) => {
  const clock = clockIn(exo.prompt);
  const level = levelOf(exo);
  if (!clock) return `aucune horloge : ${exo.prompt}`;
  // Un quart des vingt-quatre horloges par palier : les heures justes de 1 à 6, de 7 à 12, puis les demi-heures de 1 à 6, de 7 à 12.
  const own = level === 1 ? !clock.half && clock.hour <= 6 : level === 2 ? !clock.half && clock.hour >= 7 : level === 3 ? clock.half && clock.hour <= 6 : clock.half && clock.hour >= 7;
  return all(
    ok(/^Quelle heure est-il \? \S+$/u.test(exo.prompt), "la question"),
    ok(rightOption(exo) === hoursText(clock.hour, clock.half), `${exo.prompt} : ${rightOption(exo)}, pas ${hoursText(clock.hour, clock.half)}`),
    ok(own, `l'heure ${clock.hour}${clock.half ? " et demie" : ""} n'est pas celle du palier ${level}`),
    ok(wrongOf(exo).every((option) => /^\d+ heures?( et demie)?$/.test(option)), `un choix inattendu : ${optionsOf(exo).join(", ")}`),
  );
};

/** Une heure écrite : « 8 heures », « 2 heures et demie », « 11 h », « 4 h 45 ». */
function timeOf(text: string): number | null {
  let m: RegExpExecArray | null;
  if ((m = /^(\d+) heures?( et demie)?$/.exec(text))) return Number(m[1]) * 60 + (m[2] ? 30 : 0);
  if ((m = /^(\d+) h(?: (\d{2}))?$/.exec(text))) return Number(m[1]) * 60 + (m[2] ? Number(m[2]) : 0);
  return null;
}

/** Une durée, comme à l'école : 30 minutes, 1 heure et demie, 2 heures, ou des minutes sous l'heure. */
const durationText = (minutes: number) => {
  if (minutes < 60) return `${minutes} minutes`;
  const hours = Math.floor(minutes / 60);
  return `${hours} heure${hours > 1 ? "s" : ""}${minutes % 60 === 30 ? " et demie" : ""}`;
};

/** « 1 heure », « 2 heures » : le pluriel suit le nombre. */
const hourPlural = (text: string) => {
  const m = /^(\d+) (heures?)/.exec(text);
  return !m || (Number(m[1]) > 1) === (m[2] === "heures");
};

const checkDurSpan: Check = (exo) => {
  const match = /^(Le|La) (film|match|cours de lecture|fête|marché|réunion) commence à (.+) et finit à (.+)\. Combien de temps dure-t-(il|elle) \?$/.exec(exo.prompt);
  if (!match) return `énoncé inconnu : ${exo.prompt}`;
  const [start, end] = [timeOf(match[3]), timeOf(match[4])];
  if (start === null || end === null) return `heure illisible : ${exo.prompt}`;
  const level = levelOf(exo);
  const duration = end - start;
  const startMinute = start % 60;
  const hoursStyle = level <= 2;
  return all(
    ok((match[1] === "Le") === (match[5] === "il"), `« ${match[1]} ${match[2]} » avec « ${match[5]} »`),
    ok(hourPlural(match[3]) && hourPlural(match[4]), `le pluriel des heures : ${match[3]} / ${match[4]}`),
    ok(duration > 0 && end < 13 * 60 && (level > 2 || end <= 12 * 60 + 30), "une heure d'arrivée qui passe de 12 heures à 1 heure"),
    ok(rightOption(exo) === durationText(duration), `${exo.prompt} : ${rightOption(exo)}, pas ${durationText(duration)}`),
    ok(level !== 1 || (duration % 60 === 0 && startMinute === 0), "des heures entières au premier palier"),
    ok(level !== 2 || (duration % 30 === 0 && startMinute % 30 === 0), "des demi-heures au deuxième palier"),
    ok(level !== 3 || (duration < 60 && startMinute + duration < 60 && duration % 5 === 0 && startMinute % 5 === 0), "des minutes dans une même heure au troisième palier"),
    ok(level !== 4 || (duration < 60 && startMinute + duration >= 60 && duration % 5 === 0), "des minutes d'une heure à l'autre au dernier palier"),
    ok(hoursStyle ? /^\d+ heures?( et demie)?$/.test(match[3]) : /^\d+ h( \d{2})?$/.test(match[3]), `l'écriture de l'heure au palier ${level}`),
    ok(wrongOf(exo).every((option) => (hoursStyle ? /^(\d+ heures?( et demie)?|30 minutes)$/ : /^\d+ minutes$/).test(option)), `un choix inattendu : ${optionsOf(exo).join(", ")}`),
    ok(wrongOf(exo).every((option) => option !== rightOption(exo)), "un mauvais choix égal à la bonne réponse"),
  );
};

const TIME_GAPS: [RegExp, string][] = [
  [/^1 heure = ___ minutes$/, "60"],
  [/^Une semaine a ___ jours\.$/, "7"],
  [/^Une année a ___ mois\.$/, "12"],
  [/^Une demi-heure = ___ minutes$/, "30"],
  [/^Un jour a ___ heures\.$/, "24"],
  [/^Le mois de juin a ___ jours\.$/, "30"],
  [/^Un quart d'heure = ___ minutes$/, "15"],
  [/^Le mois de juillet a ___ jours\.$/, "31"],
  [/^En février d'une année ordinaire, il y a ___ jours\.$/, "28"],
  [/^2 heures = ___ minutes$/, "120"],
  [/^1 heure et demie = ___ minutes$/, "90"],
  [/^3 heures = ___ minutes$/, "180"],
];

const checkDurGap: Check = (exo) => {
  const text = textOf(exo);
  const expected = TIME_GAPS.find(([pattern]) => pattern.test(text))?.[1];
  return all(ok(expected !== undefined, `phrase inconnue : ${text}`), ok(blankOf(exo).answer === expected, `${text} : ${blankOf(exo).answer}, pas ${expected}`));
};

const WEEK = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
const YEAR = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const at = (list: string[], index: number) => list[((index % list.length) + list.length) % list.length];

const checkDurCalendar: Check = (exo) => {
  const q = exo.prompt;
  const level = levelOf(exo);
  let list: string[] = WEEK;
  let expected: string | undefined;
  let form = "";
  let m: RegExpExecArray | null;
  if ((m = /^Quel (jour|mois) vient juste (après|avant) (\S+) \?$/.exec(q))) {
    list = m[1] === "jour" ? WEEK : YEAR;
    expected = at(list, list.indexOf(m[3]) + (m[2] === "après" ? 1 : -1));
    form = `${m[1]}-${m[2]}`;
  } else if ((m = /^Quel (jour|mois) vient entre (\S+) et (\S+) \?$/.exec(q))) {
    list = m[1] === "jour" ? WEEK : YEAR;
    const a = list.indexOf(m[2]);
    expected = at(list, a + 1);
    form = `${m[1]}-entre`;
    if (a < 0 || at(list, a + 2) !== m[3]) return `${m[2]} et ${m[3]} ne se suivent pas à un jour d'écart : ${q}`;
  } else if ((m = /^Nous sommes (\S+)\. Quel jour sera-t-on dans (\d) jours \?$/.exec(q))) {
    expected = at(WEEK, WEEK.indexOf(m[1]) + Number(m[2]));
    form = "jour-plus";
  } else if ((m = /^Nous sommes en (\S+)\. Quel mois sera-t-on dans (\d) mois \?$/.exec(q))) {
    list = YEAR;
    expected = at(YEAR, YEAR.indexOf(m[1]) + Number(m[2]));
    form = "mois-plus";
  }
  if (!expected) return `énoncé inconnu : ${q}`;
  const wanted: Record<GameLevel, string[]> = { 1: ["jour-après", "jour-avant"], 2: ["mois-après", "mois-avant"], 3: ["jour-entre", "mois-entre"], 4: ["jour-plus", "mois-plus"] };
  const index = list.indexOf(expected);
  return all(
    ok(rightOption(exo) === expected, `${q} : ${rightOption(exo)}, pas ${expected}`),
    ok(wanted[level].includes(form), `la forme ${form} n'est pas celle du palier ${level}`),
    ok(same(wrongOf(exo), [at(list, index + 1), at(list, index - 1)]), `les deux voisins de ${expected} : ${wrongOf(exo).join(", ")}`),
  );
};

const checkDurOrder: Check = (exo) => {
  const level = levelOf(exo);
  const sequence = sequenceOf(exo);
  const weekIndexes = sequence.map((tile) => WEEK.indexOf(tile));
  const yearIndexes = sequence.map((tile) => YEAR.indexOf(tile));
  const inWeek = weekIndexes.every((index) => index >= 0);
  const inYear = yearIndexes.every((index) => index >= 0);
  const indexes = inWeek ? weekIndexes : yearIndexes;
  const increasing = indexes.every((index, i) => i === 0 || index > indexes[i - 1]);
  const consecutive = indexes.every((index, i) => i === 0 || index === indexes[i - 1] + 1);
  return all(
    ok(inWeek || inYear, `des tuiles inconnues : ${sequence.join(", ")}`),
    ok(increasing, `${exo.prompt} ${sequence.join(" / ")}`),
    ok(level !== 1 || (inWeek && sequence.length === 4 && consecutive && /semaine/.test(exo.prompt)), "quatre jours qui se suivent au premier palier"),
    ok(level !== 2 || (inYear && sequence.length === 4 && consecutive && /année/.test(exo.prompt)), "quatre mois qui se suivent au deuxième palier"),
    ok(level !== 3 || (inYear && sequence.length === 5 && consecutive), "cinq mois qui se suivent au troisième palier"),
    ok(level !== 4 || (inYear && sequence.length === 5), "cinq mois au dernier palier"),
  );
};

// ===========================================================================
// LES PROBLÈMES, ÉCRITS À PART
// ===========================================================================

const unitsOf = (n: number) => n % 10;
const tensOf = (n: number) => Math.floor(n / 10) % 10;
/** L'addition posée : la retenue des unités, puis celle des dizaines. */
const carries = (a: number, b: number) => {
  const units = unitsOf(a) + unitsOf(b) >= 10;
  return { units, tens: tensOf(a) + tensOf(b) + (units ? 1 : 0) >= 10 };
};
/** La soustraction posée : l'emprunt aux unités, puis aux dizaines. */
const borrows = (a: number, b: number) => {
  const units = unitsOf(a) < unitsOf(b);
  return { units, tens: tensOf(a) - (units ? 1 : 0) < tensOf(b) };
};
const TOP: Record<GameLevel, number> = { 1: 300, 2: 500, 3: 800, 4: 1000 };
const TABLES: Record<GameLevel, number[]> = { 1: [2, 5], 2: [3], 3: [4], 4: [2, 3, 4, 5] };

const ADD_VERBS = ["reçoit", "trouve", "ramasse", "gagne"];
const REMOVE_VERBS = ["mange", "donne", "perd", "vend"];
const NOUNS = ["mangue", "banane", "orange", "pain", "bonbon", "bille", "ballon", "cahier", "règle"];
const PLAIN_NOUNS = NOUNS.filter((noun) => !/^[aeiouyéè]/.test(noun));

type Solved = { form: string; result: number; a: number; b: number; c?: number; suffix: string; nouns: string[] };

/** La solution d'une histoire, lue dans son énoncé et calculée à part. */
function solve(prompt: string): Solved | null {
  const n = NUMBER;
  let m: RegExpExecArray | null;
  if ((m = new RegExp(`^\\S+ a (${n}) (\\S+)\\. (?:Il|Elle) en reçoit (${n}), puis en (${REMOVE_VERBS.join("|")}) (${n})\\.`).exec(prompt)))
    return { form: "recoit-perd", result: num(m[1]) + num(m[3]) - num(m[5]), a: num(m[1]), b: num(m[3]), c: num(m[5]), suffix: "", nouns: [m[2]] };
  if ((m = new RegExp(`^\\S+ a (\\d+) paquets de (${n}) (\\S+)\\. (?:Il|Elle) en reçoit (${n}) de plus\\.`).exec(prompt)))
    return { form: "paquets-plus", result: Number(m[1]) * num(m[2]) + num(m[4]), a: Number(m[1]), b: num(m[2]), c: num(m[4]), suffix: "", nouns: [m[3]] };
  if ((m = new RegExp(`^\\S+ a (\\d+) paquets de (${n}) (\\S+)\\. (?:Il|Elle) en (${REMOVE_VERBS.join("|")}) (${n})\\.`).exec(prompt)))
    return { form: "paquets-moins", result: Number(m[1]) * num(m[2]) - num(m[5]), a: Number(m[1]), b: num(m[2]), c: num(m[5]), suffix: "", nouns: [m[3]] };
  if ((m = new RegExp(`^\\S+ a (\\d+) paquets de (${n}) (\\S+)\\.`).exec(prompt)))
    return { form: "mult", result: Number(m[1]) * num(m[2]), a: Number(m[1]), b: num(m[2]), suffix: "", nouns: [m[3]] };
  if ((m = new RegExp(`^\\S+ a (${n}) (\\S+)\\. (?:(?:Il|Elle) en (${ADD_VERBS.join("|")}) (${n})|On lui en donne (${n}))\\.`).exec(prompt)))
    return { form: "add", result: num(m[1]) + num(m[4] ?? m[5]), a: num(m[1]), b: num(m[4] ?? m[5]), suffix: "", nouns: [m[2]] };
  if ((m = new RegExp(`^\\S+ a (${n}) (\\S+)\\. (?:Il|Elle) en (${REMOVE_VERBS.join("|")}) (${n})\\.`).exec(prompt)))
    return { form: "sub", result: num(m[1]) - num(m[4]), a: num(m[1]), b: num(m[4]), suffix: "", nouns: [m[2]] };
  if ((m = new RegExp(`^\\S+ achète (\\d) (\\S+)\\. Chaque (\\S+) coûte (${n}) F\\. (?:Il|Elle) achète aussi (?:un|une) (\\S+) à (${n}) F\\.`).exec(prompt)))
    return { form: "achat-total", result: Number(m[1]) * num(m[4]) + num(m[6]), a: Number(m[1]), b: num(m[4]), c: num(m[6]), suffix: " F", nouns: [m[2], m[3], m[5]] };
  if ((m = new RegExp(`^\\S+ achète (\\d) (\\S+)\\. Chaque (\\S+) coûte (${n}) F\\. (?:Il|Elle) paie avec (une pièce|un billet) de (${n}) F\\.`).exec(prompt)))
    return { form: "achat-monnaie", result: num(m[6]) - Number(m[1]) * num(m[4]), a: Number(m[1]), b: num(m[4]), c: num(m[6]), suffix: " F", nouns: [m[2], m[3], m[5]] };
  return null;
}

/** Les règles qui valent pour toute histoire : le pluriel, les chiffres du palier, la chose, le calcul qui reste dans la plage. */
function storyRules(s: Solved, level: GameLevel, small = false): string | null {
  if (s.form === "add" && !small) {
    const c = carries(s.a, s.b);
    return all(
      ok(s.a + s.b <= TOP[level], `${s.a} + ${s.b} dépasse ${TOP[level]}`),
      ok(c.units, "une addition sans retenue des unités"),
      ok(level <= 2 ? !c.tens : level === 4 ? c.tens : true, `retenue des dizaines au palier ${level}`),
    );
  }
  if (s.form === "sub" && !small) {
    const bo = borrows(s.a, s.b);
    return all(
      ok(s.a <= TOP[level] && s.b < s.a, `${s.a} − ${s.b} hors de la plage`),
      ok(bo.units, "une soustraction sans emprunt des unités"),
      ok(level <= 2 ? !bo.tens : level === 4 ? bo.tens : true, `emprunt des dizaines au palier ${level}`),
    );
  }
  if (s.form === "mult") {
    const [table, factor] = TABLES[level].includes(s.a) ? [s.a, s.b] : [s.b, s.a];
    return all(ok(TABLES[level].includes(table) && factor >= 2 && factor <= 10 && factor !== table, `${s.a} paquets de ${s.b} au palier ${level}`), ok(s.result <= 50, "un produit trop grand"));
  }
  if (s.form === "recoit-perd") {
    const top = { 1: 70, 2: 200, 3: 400, 4: 700 }[level];
    return all(ok(s.a >= { 1: 20, 2: 60, 3: 100, 4: 300 }[level] && s.a <= top, `${s.a} hors de la plage du palier ${level}`), ok(s.result > 0, "un résultat qui n'est pas positif"));
  }
  if (s.form === "paquets-plus" || s.form === "paquets-moins") {
    return all(ok(s.a >= 2 && s.a <= 5 && s.b >= 3 && s.b <= 10, `${s.a} paquets de ${s.b}`), ok(s.result > 0, "un résultat qui n'est pas positif"));
  }
  if (s.form === "achat-total" || s.form === "achat-monnaie") {
    return all(
      ok(s.b % 25 === 0 && s.b >= 50 && s.b <= 250, `un prix de ${s.b} F`),
      ok(s.nouns[0] === `${s.nouns[1]}s`, `un pluriel qui ne correspond pas : ${s.nouns[0]} / ${s.nouns[1]}`),
      ok(s.form === "achat-total" ? s.result <= 1000 && s.c! % 25 === 0 : s.result > 0 && s.result < s.c!, "la somme ou la monnaie"),
    );
  }
  return null;
}

const FORMS_BY_LEVEL: Record<GameLevel, string[]> = {
  1: ["recoit-perd"],
  2: ["recoit-perd", "paquets-plus"],
  3: ["paquets-plus", "paquets-moins", "achat-monnaie"],
  4: ["paquets-moins", "achat-total", "achat-monnaie"],
};

const oneStep = (exo: Exo, small = false): string | { s: Solved } => {
  const s = solve(exo.prompt);
  if (!s || !["add", "sub", "mult"].includes(s.form)) return `énoncé à une opération inconnu : ${exo.prompt}`;
  const rule = storyRules(s, levelOf(exo), small);
  return rule ? rule : { s };
};

const checkPbSolve: Check = (exo) => {
  const r = oneStep(exo);
  if (typeof r === "string") return r;
  return all(
    ok(rightOption(exo) === fmt(r.s.result), `${exo.prompt} : ${rightOption(exo)}, pas ${r.s.result}`),
    ok(wrongOf(exo).every((option) => /^[\d ]+$/.test(option)), `un choix inattendu : ${optionsOf(exo).join(", ")}`),
    ok(levelOf(exo) > 1 || r.s.form !== "mult", "une multiplication au premier palier"),
  );
};

const checkPbTwo: Check = (exo) => {
  const s = solve(exo.prompt);
  const level = levelOf(exo);
  if (!s || ["add", "sub", "mult"].includes(s.form)) return `énoncé à deux opérations inconnu : ${exo.prompt}`;
  return all(
    ok(FORMS_BY_LEVEL[level].includes(s.form), `${s.form} au palier ${level}`),
    storyRules(s, level),
    ok(rightOption(exo) === `${fmt(s.result)}${s.suffix}`, `${exo.prompt} : ${rightOption(exo)}, pas ${s.result}${s.suffix}`),
    ok(wrongOf(exo).every((option) => option.endsWith(s.suffix) && num(option.slice(0, option.length - s.suffix.length)) > 0), `un choix inattendu : ${optionsOf(exo).join(", ")}`),
  );
};

const checkPbWrite: Check = (exo) => {
  const s = solve(exo.prompt);
  if (!s) return `énoncé inconnu : ${exo.prompt}`;
  const goods = s.form === "achat-total" || s.form === "achat-monnaie";
  return all(
    storyRules(s, levelOf(exo)),
    ok(acceptedOf(exo).length === 1 && Number(acceptedOf(exo)[0]) === s.result, `${exo.prompt} : ${acceptedOf(exo)}, pas ${s.result}`),
    ok(/ Écris le nombre\.$/.test(exo.prompt), "la consigne d'écriture"),
    ok(goods || s.nouns.every((noun) => PLAIN_NOUNS.some((plain) => noun === `${plain}s`)), `une chose à voyelle initiale : ${s.nouns}`),
    ok(levelOf(exo) >= 2 || !["paquets-plus", "paquets-moins", "mult"].includes(s.form), "des paquets au premier palier"),
  );
};

const checkPbOperation: Check = (exo) => {
  const r = oneStep(exo, true);
  if (typeof r === "string") return r;
  const { s } = r;
  const sign = { add: "+", sub: "−", mult: "×" }[s.form as "add" | "sub" | "mult"];
  const expected = `${s.a} ${sign} ${s.b}`;
  const smallOk = s.form === "mult" || (s.form === "add" ? s.a >= 12 && s.a <= 60 && s.b >= 3 && s.b <= 20 : s.a >= 25 && s.a <= 90 && s.b >= 3 && s.b <= Math.min(20, s.a - 5));
  const signsOf = optionsOf(exo).map((option) => /[+−×]/.exec(option)?.[0]);
  return all(
    ok(rightOption(exo) === expected, `${exo.prompt} : ${rightOption(exo)}, pas ${expected}`),
    ok(smallOk, `des nombres trop grands pour choisir l'opération : ${s.a}, ${s.b}`),
    ok(/ Quelle opération faut-il faire \?$/.test(exo.prompt), "la question"),
    ok(new Set(signsOf).size === 3, `trois signes différents attendus : ${optionsOf(exo).join(", ")}`),
    // Une multiplication renversée serait aussi juste : un seul choix est la bonne réponse.
    ok(wrongOf(exo).every((option) => option !== `${s.b} ${sign} ${s.a}`), "une opération renversée en mauvais choix"),
  );
};

const checkPbUseless: Check = (exo) => {
  const q = exo.prompt;
  const end = q.indexOf(" Combien ");
  const story = q.slice(0, end);
  const sentences = story.split(/(?<=\.) /);
  const answer = rightOption(exo);
  const extras = [/^(Il|Elle) a \d ans$/, /^Sa classe a \d+ élèves$/, /^(Il|Elle) a \d frères et sœurs$/, /^Il fait très chaud$/, /^Son sac est rouge$/];
  const real = sentences.filter((sentence) => !extras.some((pattern) => pattern.test(sentence.replace(/\.$/, ""))));
  const rest = solve(`${real.join(" ")} Combien ?`);
  return all(
    ok(/ Quelle phrase ne sert à rien \?$/.test(q), "la question"),
    ok(sentences.length === 3, `${sentences.length} phrases`),
    ok(extras.some((pattern) => pattern.test(answer)), `« ${answer} » n'est pas une phrase sans rapport`),
    ok(sentences.includes(`${answer}.`), "la phrase inutile n'est pas dans l'énoncé"),
    ok(real.length === 2 && same(wrongOf(exo), real.map((sentence) => sentence.replace(/\.$/, ""))), `les deux autres choix sont les phrases de l'histoire : ${wrongOf(exo).join(" | ")}`),
    ok(sentences[0] !== `${answer}.`, "la phrase inutile ouvre l'énoncé"),
    ok(rest !== null && ["add", "sub"].includes(rest.form), "l'histoire sans la phrase inutile se résout encore, par un ajout ou un retrait"),
  );
};

const MISSING: [RegExp, string][] = [
  [/^Moussa achète des cahiers à 250 F chacun/, "Le nombre de cahiers"],
  [/^Awa achète 4 cahiers\./, "Le prix d'un cahier"],
  [/^Fatou a des billes\./, "Le nombre de billes au début"],
  [/^Ibrahima a 45 billes\./, "Le nombre de billes perdues"],
  [/^Un car fait 3 voyages\./, "Le nombre de places du car"],
  [/^Une classe a 4 rangées de bancs\./, "Le nombre de bancs par rangée"],
  [/^Awa achète un pain et un ballon\./, "Le prix du ballon"],
  [/^Moussa a 500 F\. Il achète un livre\./, "Le prix du livre"],
];

const checkPbMissing: Check = (exo) => {
  const expected = MISSING.find(([pattern]) => pattern.test(exo.prompt))?.[1];
  return all(
    ok(expected !== undefined, `énoncé inconnu : ${exo.prompt}`),
    ok(rightOption(exo) === expected, `${exo.prompt} : ${rightOption(exo)}, pas ${expected}`),
    ok(/ Que manque-t-il pour répondre \?$/.test(exo.prompt), "la question"),
    ok(wrongOf(exo).every((option) => /^(La couleur|Le nom|Le titre) /.test(option)), `les mauvais choix n'ont aucun rapport avec le calcul : ${wrongOf(exo).join(" | ")}`),
  );
};

const checkPbQuestion: Check = (exo) => {
  const s = solve(exo.prompt);
  const level = levelOf(exo);
  if (!s || ["add", "sub", "mult"].includes(s.form)) return `énoncé à deux opérations inconnu : ${exo.prompt}`;
  const expected =
    s.form === "recoit-perd"
      ? /^Le nombre d(?:e |')\S+ après en avoir reçu$/
      : s.form === "paquets-plus" || s.form === "paquets-moins"
        ? new RegExp(`^Le nombre d(?:e |')\\S+ dans les ${s.a} paquets$`)
        : new RegExp(`^Le prix des ${s.a} ${s.nouns[0]}$`);
  const final = s.form === "achat-total" ? "Le prix à payer en tout" : s.form === "achat-monnaie" ? "La monnaie rendue" : null;
  return all(
    ok(FORMS_BY_LEVEL[level].includes(s.form), `${s.form} au palier ${level}`),
    ok(expected.test(rightOption(exo)), `${exo.prompt} : ${rightOption(exo)}`),
    ok(/ Que faut-il chercher d'abord \?$/.test(exo.prompt), "la question"),
    ok(final === null ? wrongOf(exo).some((option) => /à la fin$/.test(option)) : wrongOf(exo).includes(final), `la question finale parmi les mauvais choix : ${wrongOf(exo).join(" | ")}`),
    ok(wrongOf(exo).some((option) => /^La couleur des /.test(option)), "un détail sans rapport parmi les mauvais choix"),
    ok(apostrophes(exo.prompt) <= 1, "une apostrophe au plus"),
  );
};

const PB_STEPS = {
  lire: "Je lis tout l'énoncé.",
  question: "Je repère la question.",
  operation: "Je choisis l'opération.",
  calcul: "Je fais le calcul.",
  verifier: "Je vérifie mon résultat.",
  reponse: "J'écris la phrase réponse.",
};
const PB_SEQUENCES: string[][] = [
  ["lire", "operation", "calcul"],
  ["question", "calcul", "reponse"],
  ["lire", "question", "operation"],
  ["operation", "calcul", "verifier"],
  ["lire", "question", "operation", "calcul"],
  ["question", "operation", "calcul", "reponse"],
  ["lire", "operation", "calcul", "verifier"],
  ["lire", "question", "calcul", "reponse"],
].map((keys) => keys.map((key) => PB_STEPS[key as keyof typeof PB_STEPS]));

const checkPbSteps: Check = (exo) => {
  const sequence = sequenceOf(exo);
  const level = levelOf(exo);
  return all(
    ok(PB_SEQUENCES.some((known) => JSON.stringify(known) === JSON.stringify(sequence)), `une suite inconnue : ${sequence.join(" / ")}`),
    ok(sequence.length === (level <= 2 ? 3 : 4), `${sequence.length} étapes au palier ${level}`),
    ok(!(sequence.includes(PB_STEPS.verifier) && sequence.includes(PB_STEPS.reponse)), "« vérifier » et « écrire la réponse » ensemble : leur ordre se discute"),
    ok(exo.prompt === "Mets dans le bon ordre les étapes pour résoudre un problème.", "la consigne"),
  );
};

const checkPbLinks: Check = (exo) => {
  const pairs = pairsOf(exo);
  const forms = new Set<string>();
  const problems: (string | null)[] = [];
  for (const pair of pairs) {
    const s = solve(`${pair.left} Combien ?`);
    if (!s || !["add", "sub", "mult"].includes(s.form)) {
      problems.push(`histoire inconnue : ${pair.left}`);
      continue;
    }
    forms.add(s.form);
    const sign = { add: "+", sub: "−", mult: "×" }[s.form as "add" | "sub" | "mult"];
    problems.push(ok(pair.right === `${s.a} ${sign} ${s.b}`, `${pair.left} ~ ${pair.right}`));
    problems.push(storyRules(s, levelOf(exo), true));
  }
  return all(ok(pairs.length === 3 && forms.size === 3, "une addition, une soustraction et une multiplication"), ...problems);
};

const checkPbSort: Check = (exo) => {
  const level = levelOf(exo);
  const items = itemsOf(exo);
  const problems = items.map((item) => {
    const m = /^\S+ (reçoit|trouve|ramasse|gagne|mange|donne|perd|vend) (\d+) (\S+)\.$/.exec(item.text);
    if (!m) return `phrase inconnue : ${item.text}`;
    const expected = ADD_VERBS.includes(m[1]) ? "On additionne" : "On soustrait";
    return ok(item.correctZone === expected, `${item.text} → ${item.correctZone}, pas ${expected}`);
  });
  const adds = items.filter((item) => item.correctZone === "On additionne").length;
  return all(
    ok(same(zonesOf(exo), ["On additionne", "On soustrait"]), `cases inattendues : ${zonesOf(exo).join(", ")}`),
    ...problems,
    ok(items.length === (level <= 2 ? 4 : 5), `${items.length} phrases au palier ${level}`),
    ok(adds >= 2 && items.length - adds >= 2, "au moins deux phrases dans chaque case"),
    ok(new Set(items.map((item) => item.text.split(" ")[0])).size === items.length, "deux phrases pour le même enfant"),
  );
};

const CHECKS: Record<string, Check> = {
  "ce1-geo-figure": checkGeoFigure,
  "ce1-geo-droites": checkGeoLines,
  "ce1-geo-outil": checkGeoTool,
  "ce1-geo-compter": checkGeoCount,
  "ce1-geo-trou": checkGeoGap,
  "ce1-geo-relier": checkGeoLinks,
  "ce1-geo-glisser": checkGeoSort,
  "ce1-geo-etapes": checkGeoSteps,
  "ce1-geo-ecrire": checkGeoWrite,
  "ce1-mes-unite": checkMesUnit,
  "ce1-mes-convertir": checkMesConvert,
  "ce1-mes-trou": checkMesGap,
  "ce1-mes-comparer": checkMesCompare,
  "ce1-mes-ranger": checkMesOrder,
  "ce1-mes-glisser": checkMesSort,
  "ce1-mes-relier": checkMesLinks,
  "ce1-mes-ecrire": checkMesWrite,
  "ce1-mes-probleme": checkMesProblem,
  "ce1-mes-grandeur": checkMesSize,
  "ce1-mon-somme": checkMonSum,
  "ce1-mon-pieces": checkMonCount,
  "ce1-mon-rendre": checkMonChange,
  "ce1-mon-relier": checkMonLinks,
  "ce1-mon-ecrire": checkMonWrite,
  "ce1-dur-lire": checkDurRead,
  "ce1-dur-duree": checkDurSpan,
  "ce1-dur-trou": checkDurGap,
  "ce1-dur-calendrier": checkDurCalendar,
  "ce1-dur-ordre": checkDurOrder,
  "ce1-pb-resoudre": checkPbSolve,
  "ce1-pb-deux": checkPbTwo,
  "ce1-pb-operation": checkPbOperation,
  "ce1-pb-utile": checkPbUseless,
  "ce1-pb-manquante": checkPbMissing,
  "ce1-pb-question": checkPbQuestion,
  "ce1-pb-ordre": checkPbSteps,
  "ce1-pb-relier": checkPbLinks,
  "ce1-pb-glisser": checkPbSort,
  "ce1-pb-ecrire": checkPbWrite,
};

const KINDS = Object.keys(CHECKS) as GameKind[];
const TOPIC_KINDS: Record<string, string[]> = {
  "ma-ce1-geometrie": ["pixel-copie", ...["figure", "droites", "outil", "compter", "trou", "relier", "glisser", "etapes", "ecrire"].map((k) => `ce1-geo-${k}`)],
  "ma-ce1-mesures": ["unite", "convertir", "trou", "comparer", "ranger", "glisser", "relier", "ecrire", "probleme", "grandeur"].map((k) => `ce1-mes-${k}`),
  "ma-ce1-monnaie-durees": [...["somme", "pieces", "rendre", "relier", "ecrire"].map((k) => `ce1-mon-${k}`), ...["lire", "duree", "trou", "calendrier", "ordre"].map((k) => `ce1-dur-${k}`)],
  "ma-ce1-problemes": ["resoudre", "deux", "operation", "utile", "manquante", "question", "ordre", "relier", "glisser", "ecrire"].map((k) => `ce1-pb-${k}`),
};
const TOPIC_KEYS = Object.keys(TOPIC_KINDS);
const entryOf = (key: string) => allProgrammeEntries().find((entry) => entry.topic.key === key)!;
const topicOf = (key: string) => entryOf(key).topic;

describe("chaque gabarit de mathématiques du CE1 (seconde moitié) a sa vérification", () => {
  it("couvre exactement les trente-neuf gabarits, tous rangés dans une thématique", () => {
    expect(KINDS).toHaveLength(39);
    expect([...new Set(Object.values(TOPIC_KINDS).flat())].filter((kind) => kind !== "pixel-copie").sort()).toEqual([...KINDS].sort());
    for (const kind of KINDS) expect(Object.keys(GAME_KINDS), kind).toContain(kind);
  });
});

describe("les gabarits de la seconde moitié des mathématiques du CE1 recalculent juste, depuis des tables et une arithmétique écrites à part", () => {
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

  it("voient aussi un énoncé abîmé : un triangle à angles droits, une durée qui traverse midi, une pièce pour un billet, une conversion de trop", () => {
    const qcm = (prompt: string, options: string[], correctIndex: number, level: number) =>
      ({ type: "qcm", prompt, answerKey: options[correctIndex], hints: [], payload: { options, correctIndex, game: { kind: "x", level } } }) as Exo;
    expect(CHECKS["ce1-geo-compter"](qcm("Combien de côtés a un carré ?", ["3", "4", "5"], 1, 1))).toBeNull();
    expect(CHECKS["ce1-geo-compter"](qcm("Combien de côtés a un carré ?", ["3", "4", "5"], 0, 1))).not.toBeNull();
    expect(CHECKS["ce1-geo-compter"](qcm("Combien d'angles droits a un triangle ?", ["0", "1", "3"], 1, 3))).not.toBeNull();
    expect(CHECKS["ce1-mes-convertir"](qcm("Convertis 3 m en centimètres.", ["30 cm", "300 cm", "3 000 cm"], 1, 1))).toBeNull();
    expect(CHECKS["ce1-mes-convertir"](qcm("Convertis 3 m en centimètres.", ["30 cm", "300 cm", "3 000 cm"], 2, 1))).not.toBeNull();
    expect(CHECKS["ce1-mes-convertir"](qcm("Convertis 2 m 50 cm en centimètres.", ["25 cm", "250 cm", "2 500 cm"], 1, 4))).toBeNull();
    expect(CHECKS["ce1-mes-convertir"](qcm("Convertis 2 m 50 cm en centimètres.", ["25 cm", "250 cm", "2 500 cm"], 1, 3))).not.toBeNull();
    expect(CHECKS["ce1-mon-rendre"](qcm("Awa achète un pain à 350 F. Elle paie avec une pièce de 500 F. Combien lui rend-on ?", ["150 F", "250 F", "300 F"], 0, 1))).toBeNull();
    expect(CHECKS["ce1-mon-rendre"](qcm("Awa achète un pain à 350 F. Elle paie avec un billet de 500 F. Combien lui rend-on ?", ["150 F", "250 F", "300 F"], 0, 1))).not.toBeNull();
    expect(CHECKS["ce1-dur-duree"](qcm("Le film commence à 8 heures et finit à 12 heures. Combien de temps dure-t-il ?", ["3 heures", "4 heures", "2 heures"], 1, 1))).toBeNull();
    expect(CHECKS["ce1-dur-duree"](qcm("Le film commence à 8 heures et finit à 12 heures. Combien de temps dure-t-elle ?", ["3 heures", "4 heures", "2 heures"], 1, 1))).not.toBeNull();
    expect(CHECKS["ce1-dur-calendrier"](qcm("Quel jour vient juste après dimanche ?", ["lundi", "dimanche", "mardi"], 0, 1))).toBeNull();
    expect(CHECKS["ce1-dur-calendrier"](qcm("Quel mois vient juste après décembre ?", ["janvier", "décembre", "février"], 0, 2))).toBeNull();
    expect(CHECKS["ce1-pb-deux"](qcm("Awa a 36 oranges. Elle en reçoit 8, puis en donne 16. Combien d'oranges a-t-elle maintenant ?", ["28", "18", "60"], 0, 1))).toBeNull();
    expect(CHECKS["ce1-pb-deux"](qcm("Awa a 36 oranges. Elle en reçoit 8, puis en donne 16. Combien d'oranges a-t-elle maintenant ?", ["28", "18", "60"], 1, 1))).not.toBeNull();
  });
});

// ===========================================================================
// LES RÈGLES COMMUNES
// ===========================================================================

describe("tous les gabarits de mathématiques du CE1 (seconde moitié)", () => {
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

  it("n'écrivent aucun émoji sauf l'horloge de l'énoncé, ni sélecteur de variation", () => {
    const selector = String.fromCodePoint(0xfe0f);
    for (const { kind, exo } of exos) {
      if (kind !== "ce1-dur-lire") expect(/\p{Extended_Pictographic}/u.test(exo.prompt), `${kind} : ${exo.prompt}`).toBe(false);
      else expect(clockIn(exo.prompt), exo.prompt).not.toBeNull();
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
      const a = GAME_KINDS[kind].make(makeContext("CE1", 3, "graine"));
      const b = GAME_KINDS[kind].make(makeContext("CE1", 3, "graine"));
      expect(a).toEqual(b);
      expect(a.hints).toHaveLength(3);
      expect(new Set(a.hints).size, kind).toBe(3);
    }
  });

  it("passent le contrôleur au CE1 sans aucun défaut, à tous les niveaux", () => {
    for (const { kind, exo } of exos) {
      const defects = auditExercise({
        type: GAME_KINDS[kind].type,
        prompt: exo.prompt,
        payload: exo.payload,
        answerKey: exo.answerKey,
        hints: exo.hints,
        class: "CE1",
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
});

// ===========================================================================
// LES THÉMATIQUES DU PROGRAMME
// ===========================================================================

describe("les quatre thématiques de mathématiques du CE1 (seconde moitié)", () => {
  it("remplissent les dix places du palier, avec des jeux connus, sans appeler le modèle", () => {
    for (const key of TOPIC_KEYS) {
      const specs = topicOf(key).games ?? [];
      expect(specs.reduce((sum, spec) => sum + spec.count, 0), key).toBe(PALIER_SIZE);
      expect([...specs.map((spec) => spec.kind as string)].sort(), key).toEqual([...TOPIC_KINDS[key]].sort());
      for (const spec of specs) expect(Object.keys(GAME_KINDS), `${key} : ${spec.kind}`).toContain(spec.kind);
      expect(topicUsesModel(key), key).toBe(false);
    }
  });

  it("sont celles du CE1, à quatre paliers, et gardent leur clé", () => {
    for (const key of TOPIC_KEYS) {
      expect(entryOf(key).klass, key).toBe("CE1");
      expect(topicOf(key).palierCount, key).toBeUndefined();
    }
    expect(TOPIC_KEYS).toHaveLength(4);
  });

  it("font des quarante-quatre thématiques du CE1 des thématiques fabriquées par le code, sans appel au modèle", () => {
    const ce1 = allProgrammeEntries().filter((entry) => entry.klass === "CE1");
    expect(ce1).toHaveLength(44);
    expect(ce1.filter((entry) => topicUsesModel(entry.topic.key)).map((entry) => entry.topic.key)).toEqual([]);
  });

  it("fabriquent des paliers entiers, de dix exercices, qui passent le contrôleur et la règle, aux quatre paliers", () => {
    for (const key of TOPIC_KEYS) {
      for (let n = 0; n < 30; n++) {
        for (const palierIndex of [1, 2, 3, 4]) {
          const paliers = generateGames(topicOf(key).games ?? [], { klass: "CE1", palierIndex, palierCount: 4, seed: `${key}:${n}:${palierIndex}` });
          expect(paliers, `${key} palier ${palierIndex}`).toHaveLength(PALIER_SIZE);
          const questions = paliers.map((game) => `${game.prompt}|${JSON.stringify(game.payload)}`);
          expect(new Set(questions).size, `${key} #${n} palier ${palierIndex}`).toBe(questions.length);
          expect(new Set(paliers.map((game) => game.type)).size, `${key} palier ${palierIndex}`).toBeGreaterThanOrEqual(4);
          for (const game of paliers) {
            const defects = auditExercise({ type: game.type, prompt: game.prompt, payload: game.payload, answerKey: game.answerKey, hints: game.hints, class: "CE1", subject: "Mathématiques" });
            expect(defects, `${key} palier ${palierIndex} : ${game.prompt}`).toEqual([]);
            const kind = (game.payload.game as { kind: string }).kind;
            if (kind === "pixel-copie") continue;
            expect(CHECKS[kind](game as unknown as Exo), `${key} palier ${palierIndex} ${kind} : ${game.prompt} ${game.payload.text ?? ""}`).toBeNull();
          }
        }
      }
    }
  });

  it("ne posent pas deux fois la même conversion, la même somme ni la même heure dans un palier", () => {
    for (let n = 0; n < 80; n++) {
      for (const palierIndex of [1, 2, 3, 4]) {
        const money = generateGames(topicOf("ma-ce1-monnaie-durees").games ?? [], { klass: "CE1", palierIndex, palierCount: 4, seed: `unique:${n}:${palierIndex}` });
        const prompts = money.map((game) => game.prompt);
        expect(new Set(prompts).size, `palier ${palierIndex}`).toBe(prompts.length);
        const measures = generateGames(topicOf("ma-ce1-mesures").games ?? [], { klass: "CE1", palierIndex, palierCount: 4, seed: `unique:${n}:${palierIndex}` });
        const conversions = measures
          .filter((game) => ["ce1-mes-convertir", "ce1-mes-ecrire"].includes((game.payload.game as { kind: string }).kind))
          .map((game) => {
            const asked = /^Convertis (.+) en (\S+)\.$/.exec(game.prompt) ?? /^Combien de (\S+) y a-t-il dans (.+) \? Écris le nombre\.$/.exec(game.prompt);
            const [from, to] = game.prompt.startsWith("Convertis") ? [asked![1], asked![2]] : [asked![2], asked![1]];
            return `${from}>${to}`;
          });
        expect(new Set(conversions).size, `palier ${palierIndex} : ${conversions.join(" ; ")}`).toBe(conversions.length);
      }
    }
  });

  it("donnent à chaque palier des heures qui lui sont propres", () => {
    const clocks = new Map<number, Set<string>>();
    for (const palierIndex of [1, 2, 3, 4]) {
      clocks.set(palierIndex, new Set());
      for (let n = 0; n < 40; n++) {
        const game = generateGames([{ kind: "ce1-dur-lire", count: 1 }], { klass: "CE1", palierIndex, palierCount: 4, seed: `horloge:${n}` })[0];
        clocks.get(palierIndex)!.add(game.prompt);
      }
    }
    for (const a of [1, 2, 3, 4]) for (const b of [1, 2, 3, 4]) if (a < b) expect([...clocks.get(a)!].filter((prompt) => clocks.get(b)!.has(prompt)), `paliers ${a} et ${b}`).toEqual([]);
  });
});
