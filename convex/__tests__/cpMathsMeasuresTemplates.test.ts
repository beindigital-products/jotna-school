import { describe, expect, it, vi } from "vitest";
import { auditExercise } from "../paliers/exerciseAudit";
import { GAME_KINDS, generateGames, regenerateGame, type GameKind } from "../paliers/games";
import { clockOf, timeWords } from "../paliers/games/heureCp";
import { makeContext, type GameLevel } from "../paliers/games/shared";
import { variantsForLevel } from "../paliers/games/tableaux";
import { topicUsesModel } from "../paliers/pregen";
import { allProgrammeEntries } from "../programme";
import { PALIER_SIZE } from "../paliers/scoring";

// Ces tests jouent des milliers de tirages : sur le serveur de CI, chargé, l'un d'eux dépasse les 5 secondes par défaut.
vi.setConfig({ testTimeout: 30_000 });

/**
 * LES MATHÉMATIQUES DU CP, SECONDE PARTIE : les mesures (mètre, litre, kilogramme), l'heure, le calendrier et la monnaie, les petits
 * problèmes, et le matériel du géomètre (`ma-cp-mesures`, `ma-cp-heure-monnaie`, `ma-cp-problemes`, `ma-cp-figures`).
 *
 * Chaque test RECALCULE la bonne réponse depuis l'énoncé, avec ses propres tables (les unités par mot-clé, les vingt-quatre horloges
 * écrites une à une, les faits du calendrier) et sa propre arithmétique. Les règles de la fiche sont des tests à part : une unité par
 * sorte de mesure, des heures justes et des demi-heures, des pièces de 5 à 100 F, une histoire à une opération, aucun nombre au-delà de
 * cent. À la fin, des MUTATIONS : on abîme la bonne réponse d'un exercice juste, et chaque vérification doit le voir.
 */

const LEVELS: GameLevel[] = [1, 2, 3, 4];
const draws = LEVELS.flatMap((level) => Array.from({ length: 60 }, (_, n) => ({ level, seed: `mth7:${level}:${n}` })));
const make = (kind: GameKind, d: (typeof draws)[number]) => GAME_KINDS[kind].make(makeContext("CP", d.level, `${kind}:${d.seed}`));

type Exo = { prompt: string; answerKey: string; hints: string[]; payload: Record<string, unknown> };
const optionsOf = (exo: Exo) => exo.payload.options as string[];
const rightOption = (exo: Exo) => optionsOf(exo)[exo.payload.correctIndex as number];
const itemsOf = (exo: Exo) => exo.payload.items as { text: string; correctZone: string }[];
const zonesOf = (exo: Exo) => exo.payload.zones as string[];
const sequenceOf = (exo: Exo) => exo.payload.correctSequence as string[];
const pairsOf = (exo: Exo) => exo.payload.pairs as { left: string; right: string }[];
const blankOf = (exo: Exo) => (exo.payload.blanks as { options: string[]; answer: string }[])[0];
const textOf = (exo: Exo) => String(exo.payload.text);
const acceptedOf = (exo: Exo) => exo.payload.acceptedAnswers as string[];
const levelOf = (exo: Exo) => (exo.payload.game as { level: number }).level;

const fold = (text: string) => text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
const apostrophes = (text: string) => (text.match(/'/g) ?? []).length;
const wordCount = (text: string) => text.split(/\s+/).filter((token) => /[\p{L}\p{N}]/u.test(token)).length;
const capital = (text: string) => `${text[0].toUpperCase()}${text.slice(1)}`;
/** Le sélecteur de variation U+FE0F, écrit par son code : un littéral s'y perdrait. */
const VARIATION_SELECTOR = String.fromCharCode(0xfe0f);

type Check = (exo: Exo) => string | null;
const ok = (condition: boolean, message: string) => (condition ? null : message);
const isInteger = (text: string) => /^\d+$/.test(text);
const allDifferent = (list: readonly string[]) => new Set(list).size === list.length;

// ---------------------------------------------------------------------------
// Les tables de vérité, écrites à part des gabarits
// ---------------------------------------------------------------------------

/** L'unité d'une chose, d'après le mot qui dit ce qu'on veut en savoir. */
function unitOf(text: string): string | null {
  if (/longueur|hauteur|largeur/u.test(text)) return "mètre";
  if (/quantité/u.test(text)) return "litre";
  if (/poids/u.test(text)) return "kilogramme";
  return null;
}

/** La partie du corps de chaque mesure. */
const BODY_PART: Record<string, string> = { empans: "Main", pieds: "Pied", coudées: "Bras", pas: "Jambes" };
const BODY_MEASURES = ["Pas", "Pied", "Empan", "Coudée"];

/** Les parts de kilogramme, en quarts : un quart vaut 1, un demi 2, un kilogramme 4. */
const QUARTERS: Record<string, number> = { "quarts de kilogramme": 1, "demi-kilogrammes": 2 };
const KILO_LABEL: Record<number, string> = { 2: "Demi-kilogramme", 4: "Kilogramme" };
const KILO_ORDER = ["Quart de kilogramme", "Demi-kilogramme", "Kilogramme"];

const KILO_GAPS: Record<string, string> = {
  "Deux ___ font un kilogramme.": "demi-kilogrammes",
  "Quatre ___ font un kilogramme.": "quarts de kilogramme",
  "Un demi-kilogramme est ___ qu'un kilogramme.": "plus léger",
  "Un kilogramme est ___ qu'un demi-kilogramme.": "plus lourd",
  "Un quart de kilogramme est ___ qu'un demi-kilogramme.": "plus léger",
  "Un kilogramme est ___ qu'un quart de kilogramme.": "plus lourd",
};

/** Les vingt-quatre horloges, écrites une à une : les heures justes de une à douze, puis les demi-heures. */
const CLOCK_WHOLE = ["🕐", "🕑", "🕒", "🕓", "🕔", "🕕", "🕖", "🕗", "🕘", "🕙", "🕚", "🕛"];
const CLOCK_HALF = ["🕜", "🕝", "🕞", "🕟", "🕠", "🕡", "🕢", "🕣", "🕤", "🕥", "🕦", "🕧"];

/** L'heure d'une horloge : (heure de 1 à 12, demi-heure ?), ou null. */
function clockTime(emoji: string): { hour: number; half: boolean } | null {
  const whole = CLOCK_WHOLE.indexOf(emoji);
  if (whole >= 0) return { hour: whole + 1, half: false };
  const half = CLOCK_HALF.indexOf(emoji);
  return half >= 0 ? { hour: half + 1, half: true } : null;
}
const clockText = (time: { hour: number; half: boolean }) => `${time.hour} heure${time.hour > 1 ? "s" : ""}${time.half ? " et demie" : ""}`;
/** Les minutes depuis minuit, sur un cadran de douze heures (12 heures vaut 0). */
const minutesOf = (time: { hour: number; half: boolean }) => (time.hour % 12) * 60 + (time.half ? 30 : 0);

const CALENDAR: Record<string, string> = {
  "Combien de jours y a-t-il dans une semaine ?": "7",
  "Combien de mois y a-t-il dans une année ?": "12",
  "Combien de jours y a-t-il dans deux semaines ?": "14",
  "Combien de jours y a-t-il dans trois semaines ?": "21",
};
const DAYS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

const COINS = [5, 10, 25, 50];

const TOOLS: Record<string, string> = {
  "Avec quoi trace-t-on un trait bien droit ?": "Règle",
  "Avec quoi mesure-t-on la longueur d'un trait ?": "Double décimètre",
  "Avec quoi découpe-t-on une figure ?": "Ciseaux",
  "Avec quoi enlève-t-on un trait fait au crayon ?": "Gomme",
  "Avec quoi dessine-t-on un trait sur la feuille ?": "Crayon",
  "Avec quoi fixe-t-on une figure découpée sur le cahier ?": "Colle",
};
const PROCEDURES: Record<string, string[]> = {
  "Mets dans le bon ordre les étapes pour reproduire une figure.": ["Je regarde bien la figure.", "Je trace les traits avec la règle.", "Je compare avec la figure."],
  "Mets dans le bon ordre les étapes pour découper une figure.": ["Je dessine la figure sur la feuille.", "Je découpe en suivant le trait.", "Je colle la figure sur le cahier."],
  "Mets dans le bon ordre les étapes pour tracer un trait droit.": ["Je pose la règle sur la feuille.", "Je tiens bien la règle.", "Je trace le trait le long de la règle."],
};

const PROBLEM_STEPS = [
  "Je lis le problème.",
  "Je cherche les nombres de l'histoire.",
  "Je choisis l'opération.",
  "Je fais le calcul.",
  "J'écris la réponse.",
];
const ADD_VERBS = ["reçoit", "trouve", "ramasse"];
const REMOVE_VERBS = ["mange", "donne", "perd", "vend"];
const IRRELEVANT = ["Le jour de la semaine", "La couleur du sac", "Le nom du marchand", "Le lieu de la scène"];

const units = (n: number) => n % 10;
const hasCarry = (a: number, b: number) => units(a) + units(b) >= 10;
const hasBorrow = (a: number, b: number) => units(a) < units(b);

type Story = { op: "add" | "sub" | "mult"; a: number; b: number; result: number; operation: string; noun: string };

/** Lit l'histoire d'un énoncé : « X a 38 mangues. Elle en reçoit 27. », « X a 45 mangues. Il en vend 18. », « X a 3 paquets de 5 mangues. ». */
function parseStory(text: string): Story | null {
  const packs = /^\p{L}+ a (\d+) paquets de (\d+) ([^.]+)\./u.exec(text);
  if (packs) {
    const [a, b] = [Number(packs[1]), Number(packs[2])];
    return { op: "mult", a, b, result: a * b, operation: `${a} × ${b}`, noun: packs[3] };
  }
  const plain = /^\p{L}+ a (\d+) ([^.]+)\. (?:(?:Il|Elle) en (\p{L}+) (\d+)|On lui en donne (\d+))\./u.exec(text);
  if (!plain) return null;
  const a = Number(plain[1]);
  if (plain[5] !== undefined) {
    const b = Number(plain[5]);
    return { op: "add", a, b, result: a + b, operation: `${a} + ${b}`, noun: plain[2] };
  }
  const verb = plain[3];
  const b = Number(plain[4]);
  if (ADD_VERBS.includes(verb)) return { op: "add", a, b, result: a + b, operation: `${a} + ${b}`, noun: plain[2] };
  if (REMOVE_VERBS.includes(verb)) return { op: "sub", a, b, result: a - b, operation: `${a} − ${b}`, noun: plain[2] };
  return null;
}

/** Les nombres d'une histoire respectent la fiche : sous cent, une retenue et un emprunt dès le deuxième palier, un facteur de 2 ou 3. */
function storyOk(story: Story, level: number): string | null {
  if (story.op === "mult") {
    return (
      ok((story.a === 2 || story.a === 3 || story.b === 2 || story.b === 3) && story.result <= 30 && story.a >= 2 && story.b >= 2, `paquets ${story.operation}`) ??
      ok(level >= 2, "une multiplication au premier palier")
    );
  }
  if (story.result > 100 || story.result < 0) return `résultat ${story.result}`;
  if (level >= 2 && story.op === "add" && !hasCarry(story.a, story.b)) return `${story.operation} sans retenue`;
  if (level >= 2 && story.op === "sub" && !hasBorrow(story.a, story.b)) return `${story.operation} sans emprunt`;
  return ok(story.op === "add" || story.a > story.b, `${story.operation} négatif`);
}

// ---------------------------------------------------------------------------
// Les vérifications de chaque gabarit : elles recalculent la réponse
// ---------------------------------------------------------------------------

const KINDS = [
  "mesure-unite", "mesure-glisser", "mesure-relier", "mesure-corps", "mesure-calcul", "mesure-repete", "mesure-ordre", "mesure-plus", "mesure-kilo", "mesure-kilo-trou",
  "heure-lire", "heure-relier", "heure-ordre", "heure-trou", "calendrier-combien", "calendrier-glisser", "monnaie-payer", "monnaie-pieces", "monnaie-relier",
  "pb-operation", "pb-resoudre", "pb-ecrire", "pb-trou", "pb-manquante", "pb-inutile", "pb-question", "pb-etapes", "pb-relier", "pb-glisser",
  "outil-geometrie", "figure-etapes",
] as const satisfies readonly GameKind[];

const CLOCK_KINDS: readonly string[] = ["heure-lire", "heure-relier", "heure-ordre"];

const CHECKS: Record<string, Check> = {
  // --- Les mesures ---------------------------------------------------------
  "mesure-unite": (exo) => {
    const m = /^Quelle unité sert à mesurer (.+) \?$/u.exec(exo.prompt);
    if (!m) return `énoncé inattendu : ${exo.prompt}`;
    const unit = unitOf(m[1]);
    if (!unit) return `sorte de mesure inconnue : ${m[1]}`;
    return (
      ok(rightOption(exo) === capital(unit), `${m[1]} : ${capital(unit)}, la clé dit ${rightOption(exo)}`) ??
      ok([...optionsOf(exo)].sort().join("|") === "Kilogramme|Litre|Mètre", `choix ${optionsOf(exo).join(" | ")}`)
    );
  },
  "mesure-glisser": (exo) => {
    const items = itemsOf(exo);
    const zones = zonesOf(exo);
    for (const item of items) {
      const unit = unitOf(item.text);
      if (!unit) return `sorte de mesure inconnue : ${item.text}`;
      if (item.correctZone !== `Se mesure en ${unit}s`) return `${item.text} : ${unit}s, la case dit ${item.correctZone}`;
    }
    return (
      ok(zones.length === 2 && zones[0] !== zones[1], `cases ${zones.join(" | ")}`) ??
      ok(zones.every((zone) => items.filter((item) => item.correctZone === zone).length >= 2), "une case a moins de deux mesures")
    );
  },
  "mesure-relier": (exo) => {
    const pairs = pairsOf(exo);
    for (const pair of pairs) {
      const unit = unitOf(pair.left);
      if (!unit) return `sorte de mesure inconnue : ${pair.left}`;
      if (pair.right !== capital(unit)) return `${pair.left} : ${capital(unit)}, la paire dit ${pair.right}`;
    }
    return ok(pairs.length === 3 && allDifferent(pairs.map((pair) => pair.right)), "trois mesures, trois unités différentes");
  },
  "mesure-corps": (exo) => {
    const body = /^Avec quelle partie du corps mesure-t-on en (\p{L}+) \?$/u.exec(exo.prompt);
    if (body) {
      const part = BODY_PART[body[1]];
      return (
        ok(part !== undefined, `mesure inconnue : ${body[1]}`) ??
        ok(rightOption(exo) === part, `${body[1]} : ${part}, la clé dit ${rightOption(exo)}`) ??
        // « Pied » ne se propose jamais pour le pas : on mesure en pas avec les jambes, et le pied est une autre mesure.
        ok(!(body[1] === "pas" && optionsOf(exo).includes("Pied")), "« Pied » parmi les choix du pas")
      );
    }
    if (exo.prompt !== "Quelle mesure est la même pour tous les enfants ?") return `énoncé inattendu : ${exo.prompt}`;
    return (
      ok(rightOption(exo) === "Mètre", `la même pour tous : Mètre, la clé dit ${rightOption(exo)}`) ??
      ok(optionsOf(exo).filter((option) => option !== "Mètre").every((option) => BODY_MEASURES.includes(option)), `choix ${optionsOf(exo).join(" | ")}`)
    );
  },
  "mesure-calcul": (exo) => {
    const found = [...exo.prompt.matchAll(/(\d+) (mètres|litres|kilogrammes)/gu)];
    if (found.length < 2) return `deux mesures attendues : ${exo.prompt}`;
    const [a, b] = [Number(found[0][1]), Number(found[1][1])];
    const sub = /coupe|verse|vend/u.test(exo.prompt);
    const result = sub ? a - b : a + b;
    return (
      ok(found[0][2] === found[1][2], "deux unités différentes dans un calcul") ??
      ok(a >= 2 && b >= 2 && (!sub || a > b), `${a} ${sub ? "−" : "+"} ${b}`) ??
      ok(rightOption(exo) === String(result), `${a} ${sub ? "−" : "+"} ${b} = ${result}, la clé dit ${rightOption(exo)}`) ??
      ok(optionsOf(exo).every(isInteger) && allDifferent(optionsOf(exo)), `choix ${optionsOf(exo).join(" | ")}`)
    );
  },
  "mesure-repete": (exo) => {
    const each = /(\d+) (mètres|litres|kilogrammes)/u.exec(exo.prompt);
    const count = /(?:dans|pèsent) (\d+) (cordes|seaux|sacs)/u.exec(exo.prompt);
    if (!each || !count) return `énoncé inattendu : ${exo.prompt}`;
    const total = Number(each[1]) * Number(count[1]);
    return (
      ok(Number(count[1]) === 2 || Number(count[1]) === 3, `${count[1]} fois : ni 2 ni 3`) ??
      ok(total <= 30 && Number(each[1]) >= 2, `${each[1]} × ${count[1]} = ${total}`) ??
      ok(acceptedOf(exo).length === 1 && acceptedOf(exo)[0] === String(total), `${each[1]} × ${count[1]} = ${total}, la clé dit ${acceptedOf(exo).join("/")}`)
    );
  },
  "mesure-ordre": (exo) => {
    const sequence = sequenceOf(exo);
    const ascending = /du plus léger au plus lourd|de la plus courte à la plus longue|de la plus petite à la plus grande/u.test(exo.prompt);
    const descending = /du plus lourd au plus léger|de la plus longue à la plus courte|de la plus grande à la plus petite/u.test(exo.prompt);
    if (ascending === descending) return `sens du rangement introuvable : ${exo.prompt}`;
    if (sequence.every((tile) => KILO_ORDER.includes(tile))) {
      const expected = ascending ? KILO_ORDER : [...KILO_ORDER].reverse();
      return ok(sequence.join("|") === expected.join("|"), `parts de kilogramme : ${sequence.join(" > ")}`) ?? ok(/poids/u.test(exo.prompt), "énoncé des parts sans « poids »");
    }
    const parsed = sequence.map((tile) => /^(\d+) (mètres|litres|kilogrammes)$/u.exec(tile));
    if (parsed.some((m) => m === null)) return `tuile inattendue : ${sequence.join(" | ")}`;
    const values = parsed.map((m) => Number(m![1]));
    const unit = parsed[0]![2];
    const expectedUnit = /longueurs/u.test(exo.prompt) ? "mètres" : /quantités d'eau/u.test(exo.prompt) ? "litres" : /poids/u.test(exo.prompt) ? "kilogrammes" : "";
    const sorted = [...values].sort((x, y) => (ascending ? x - y : y - x));
    return (
      ok(unit === expectedUnit && parsed.every((m) => m![2] === unit), `unités ${sequence.join(" | ")} pour « ${exo.prompt} »`) ??
      ok(values.join() === sorted.join(), `${values.join(" > ")} n'est pas rangé ${ascending ? "du plus petit au plus grand" : "du plus grand au plus petit"}`) ??
      ok(new Set(values).size === values.length && values.every((value) => value >= 2), `valeurs ${values.join(", ")}`)
    );
  },
  "mesure-plus": (exo) => {
    const FORMS: Record<string, { most: boolean; unit: string }> = {
      "Quelle corde est la plus longue ?": { most: true, unit: "mètres" },
      "Quelle corde est la plus courte ?": { most: false, unit: "mètres" },
      "Quel seau contient le plus d'eau ?": { most: true, unit: "litres" },
      "Quel seau contient le moins d'eau ?": { most: false, unit: "litres" },
      "Quel sac est le plus lourd ?": { most: true, unit: "kilogrammes" },
      "Quel sac est le plus léger ?": { most: false, unit: "kilogrammes" },
    };
    const form = FORMS[exo.prompt];
    if (!form) return `énoncé inattendu : ${exo.prompt}`;
    const values = optionsOf(exo).map((option) => {
      const m = /^(\d+) (mètres|litres|kilogrammes)$/u.exec(option);
      return m && m[2] === form.unit ? Number(m[1]) : NaN;
    });
    if (values.some(Number.isNaN)) return `choix ${optionsOf(exo).join(" | ")} pour « ${exo.prompt} »`;
    const expected = form.most ? Math.max(...values) : Math.min(...values);
    return ok(allDifferent(optionsOf(exo)), "deux choix égaux") ?? ok(rightOption(exo) === `${expected} ${form.unit}`, `${exo.prompt} ${expected}, la clé dit ${rightOption(exo)}`);
  },
  "mesure-kilo": (exo) => {
    const count = /^Combien de (demi-kilogrammes|quarts de kilogramme) faut-il pour faire un kilogramme \?$/u.exec(exo.prompt);
    if (count) {
      const expected = 4 / QUARTERS[count[1]];
      return ok(rightOption(exo) === String(expected), `${count[1]} : ${expected}, la clé dit ${rightOption(exo)}`) ?? ok(optionsOf(exo).every(isInteger), "choix qui ne sont pas des nombres");
    }
    const equal = /^(Deux|Quatre) (quarts de kilogramme|demi-kilogrammes) pèsent autant que quoi \?$/u.exec(exo.prompt);
    if (equal) {
      const total = (equal[1] === "Deux" ? 2 : 4) * QUARTERS[equal[2]];
      return (
        ok(total === 2 || total === 4, `${equal[1]} ${equal[2]} font ${total} quarts : ni un demi ni un kilogramme`) ??
        ok(rightOption(exo) === KILO_LABEL[total], `${total} quarts : ${KILO_LABEL[total]}, la clé dit ${rightOption(exo)}`) ??
        ok([...optionsOf(exo)].sort().join("|") === [...KILO_ORDER].sort().join("|"), `choix ${optionsOf(exo).join(" | ")}`)
      );
    }
    const bags = /^\p{L}+ achète (\d+) sachets de sucre d'un (demi-kilogramme|quart de kilogramme)\. Combien de kilogrammes de sucre achète-t-(?:il|elle) \?$/u.exec(exo.prompt);
    if (!bags) return `énoncé inattendu : ${exo.prompt}`;
    const quarters = Number(bags[1]) * (bags[2] === "demi-kilogramme" ? 2 : 1);
    return ok(quarters === 4, `${bags[1]} sachets de ${bags[2]} : ${quarters} quarts`) ?? ok(rightOption(exo) === "1", `un kilogramme, la clé dit ${rightOption(exo)}`);
  },
  "mesure-kilo-trou": (exo) => {
    const expected = KILO_GAPS[textOf(exo)];
    return (
      ok(expected !== undefined, `phrase inconnue : ${textOf(exo)}`) ??
      ok(blankOf(exo).answer === expected, `${textOf(exo)} : ${expected}, la clé dit ${blankOf(exo).answer}`) ??
      ok(blankOf(exo).options.length === 3 && allDifferent(blankOf(exo).options), `choix ${blankOf(exo).options.join(" | ")}`)
    );
  },

  // --- L'heure, le calendrier, la monnaie -------------------------------------
  "heure-lire": (exo) => {
    const emoji = /(\p{Extended_Pictographic})\s*$/u.exec(exo.prompt);
    const time = emoji ? clockTime(emoji[1]) : null;
    if (!time) return `horloge introuvable : ${exo.prompt}`;
    return (
      ok(/^Quelle heure est-il \?/u.test(exo.prompt), exo.prompt) ??
      ok(rightOption(exo) === clockText(time), `${emoji![1]} : ${clockText(time)}, la clé dit ${rightOption(exo)}`) ??
      ok(allDifferent(optionsOf(exo)) && optionsOf(exo).every((option) => /^\d+ heures?( et demie)?$/u.test(option)), `choix ${optionsOf(exo).join(" | ")}`)
    );
  },
  "heure-relier": (exo) => {
    const pairs = pairsOf(exo);
    for (const pair of pairs) {
      const time = clockTime(pair.left);
      if (!time) return `horloge inconnue : ${pair.left}`;
      if (pair.right !== clockText(time)) return `${pair.left} : ${clockText(time)}, la paire dit ${pair.right}`;
    }
    return ok(pairs.length === 3 && allDifferent(pairs.map((pair) => pair.right)), "trois horloges, trois heures différentes");
  },
  "heure-ordre": (exo) => {
    const times = sequenceOf(exo).map(clockTime);
    if (times.some((time) => time === null)) return `horloge inconnue : ${sequenceOf(exo).join(" ")}`;
    const minutes = times.map((time) => time!.hour * 60 + (time!.half ? 30 : 0));
    return (
      ok(minutes.every((value) => value >= 6 * 60 && value <= 11 * 60 + 30), `hors du matin : ${minutes.join(", ")}`) ??
      ok(minutes.every((value, i) => i === 0 || value > minutes[i - 1]), `pas du plus tôt au plus tard : ${minutes.join(", ")}`) ??
      ok(/du matin/u.test(exo.prompt), "énoncé sans « du matin »")
    );
  },
  "heure-trou": (exo) => {
    const m = /^Il est (\d+) heures?( et demie)?\. (Une heure|Une demi-heure) plus tard, il sera ___\.$/u.exec(textOf(exo));
    if (!m) return `phrase inattendue : ${textOf(exo)}`;
    const start = { hour: Number(m[1]), half: m[2] !== undefined };
    const later = (minutesOf(start) + (m[3] === "Une heure" ? 60 : 30)) % 720;
    const expected = clockText({ hour: Math.floor(later / 60) || 12, half: later % 60 === 30 });
    return (
      ok(blankOf(exo).answer === expected, `${textOf(exo)} : ${expected}, la clé dit ${blankOf(exo).answer}`) ??
      ok(blankOf(exo).options.length === 3 && allDifferent(blankOf(exo).options), `choix ${blankOf(exo).options.join(" | ")}`)
    );
  },
  "calendrier-combien": (exo) => {
    const expected = CALENDAR[exo.prompt];
    return (
      ok(expected !== undefined, `question inconnue : ${exo.prompt}`) ??
      ok(rightOption(exo) === expected, `${exo.prompt} ${expected}, la clé dit ${rightOption(exo)}`) ??
      ok(optionsOf(exo).every(isInteger), "choix qui ne sont pas des nombres")
    );
  },
  "calendrier-glisser": (exo) => {
    for (const item of itemsOf(exo)) {
      const zone = DAYS.includes(item.text) ? "Jours" : MONTHS.includes(item.text) ? "Mois" : null;
      if (zone === null) return `mot inconnu : ${item.text}`;
      if (item.correctZone !== zone) return `${item.text} : ${zone}, la case dit ${item.correctZone}`;
    }
    return ok(zonesOf(exo).join("|") === "Jours|Mois", `cases ${zonesOf(exo).join(" | ")}`) ?? ok(itemsOf(exo).filter((item) => item.correctZone === "Jours").length >= 2, "pas assez de jours");
  },
  "monnaie-payer": (exo) => {
    const price = /doit payer (\d+) F\./u.exec(exo.prompt);
    if (!price) return `somme introuvable : ${exo.prompt}`;
    const total = (option: string) => {
      const coins = [...option.matchAll(/(\d+) F/gu)].map((m) => Number(m[1]));
      return coins.every((coin) => COINS.includes(coin)) && coins.length === 2 ? coins.reduce((sum, coin) => sum + coin, 0) : NaN;
    };
    const sums = optionsOf(exo).map(total);
    if (sums.some(Number.isNaN)) return `pièces inconnues : ${optionsOf(exo).join(" | ")}`;
    const wrong = optionsOf(exo).filter((option) => option !== rightOption(exo));
    return (
      ok(Number(price[1]) % 5 === 0 && Number(price[1]) <= 100, `somme ${price[1]}`) ??
      ok(total(rightOption(exo)) === Number(price[1]), `${rightOption(exo)} fait ${total(rightOption(exo))}, la somme est ${price[1]}`) ??
      ok(wrong.every((option) => total(option) !== Number(price[1])), `un mauvais choix fait aussi ${price[1]} : ${optionsOf(exo).join(" | ")}`)
    );
  },
  "monnaie-pieces": (exo) => {
    const m = /^Combien de pièces de (\d+) F faut-il pour payer (\d+) F \?$/u.exec(exo.prompt);
    if (!m) return `énoncé inattendu : ${exo.prompt}`;
    const [coin, price] = [Number(m[1]), Number(m[2])];
    return (
      ok(COINS.includes(coin) && price % coin === 0 && price <= 100, `${price} F avec des pièces de ${coin} F`) ??
      ok(price / coin >= 2 && price / coin <= 10, `${price / coin} pièces`) ??
      ok(rightOption(exo) === String(price / coin), `${price} / ${coin} = ${price / coin}, la clé dit ${rightOption(exo)}`) ??
      ok(optionsOf(exo).every(isInteger) && allDifferent(optionsOf(exo)), `choix ${optionsOf(exo).join(" | ")}`)
    );
  },
  "monnaie-relier": (exo) => {
    const pairs = pairsOf(exo);
    for (const pair of pairs) {
      const m = /^(\d+) pièces de (\d+) F$/u.exec(pair.left);
      if (!m) return `groupe inattendu : ${pair.left}`;
      if (!COINS.includes(Number(m[2]))) return `pièce de ${m[2]} F`;
      if (pair.right !== `${Number(m[1]) * Number(m[2])} F`) return `${pair.left} : ${Number(m[1]) * Number(m[2])} F, la paire dit ${pair.right}`;
    }
    return ok(pairs.length === 3 && allDifferent(pairs.map((pair) => pair.right)), "trois groupes, trois sommes différentes");
  },

  // --- Les problèmes -------------------------------------------------------------
  "pb-operation": (exo) => {
    const story = parseStory(exo.prompt);
    if (!story) return `histoire introuvable : ${exo.prompt}`;
    const wrong = optionsOf(exo).filter((option) => option !== rightOption(exo));
    return (
      storyOk(story, levelOf(exo)) ??
      ok(exo.prompt.endsWith(" Quelle opération faut-il faire ?"), "sans la question de l'opération") ??
      ok(rightOption(exo) === story.operation, `${story.operation}, la clé dit ${rightOption(exo)}`) ??
      ok(optionsOf(exo).every((option) => /^\d+ [+−×] \d+$/u.test(option)) && allDifferent(optionsOf(exo)), `choix ${optionsOf(exo).join(" | ")}`) ??
      ok(wrong.every((option) => option !== story.operation && (option.match(/\d+/gu) ?? []).every((n) => Number(n) <= 100)), `mauvais choix ${wrong.join(" | ")}`)
    );
  },
  "pb-resoudre": (exo) => {
    const story = parseStory(exo.prompt);
    if (!story) return `histoire introuvable : ${exo.prompt}`;
    return (
      storyOk(story, levelOf(exo)) ??
      ok(rightOption(exo) === String(story.result), `${story.operation} = ${story.result}, la clé dit ${rightOption(exo)}`) ??
      ok(optionsOf(exo).every(isInteger) && allDifferent(optionsOf(exo)), `choix ${optionsOf(exo).join(" | ")}`)
    );
  },
  "pb-ecrire": (exo) => {
    const story = parseStory(exo.prompt);
    if (!story) return `histoire introuvable : ${exo.prompt}`;
    return (
      storyOk(story, levelOf(exo)) ??
      ok(exo.prompt.endsWith(" Écris le nombre."), "sans « Écris le nombre. »") ??
      ok(acceptedOf(exo).length === 1 && acceptedOf(exo)[0] === String(story.result), `${story.operation} = ${story.result}, la clé dit ${acceptedOf(exo).join("/")}`) ??
      ok(exo.answerKey === String(story.result), "clé et réponse acceptée différentes")
    );
  },
  "pb-trou": (exo) => {
    const story = parseStory(textOf(exo));
    if (!story) return `histoire introuvable : ${textOf(exo)}`;
    const text = textOf(exo);
    return (
      storyOk(story, levelOf(exo)) ??
      ok((text.match(/___/gu) ?? []).length === 1, `un seul trou attendu : ${text}`) ??
      ok(blankOf(exo).answer === String(story.result), `${story.operation} = ${story.result}, la clé dit ${blankOf(exo).answer}`) ??
      ok(blankOf(exo).options.length === 3 && blankOf(exo).options.every(isInteger) && allDifferent(blankOf(exo).options), `choix ${blankOf(exo).options.join(" | ")}`)
    );
  },
  "pb-manquante": (exo) => {
    const text = exo.prompt;
    let expected: string | null = null;
    if (/quelques-un/u.test(text)) expected = / en reçoit /u.test(text) ? "Le nombre reçu" : "Le nombre enlevé";
    else if (/ a des paquets de /u.test(text)) expected = "Le nombre de paquets";
    else if (/ a \d+ paquets de [^\d]/u.test(text)) expected = "Le nombre dans chaque paquet";
    else if (/ a des [^.]+\. (?:Il|Elle) en \p{L}+ \d+\./u.test(text)) expected = "Le nombre du début";
    const wrong = optionsOf(exo).filter((option) => option !== rightOption(exo));
    return (
      ok(expected !== null, `donnée manquante introuvable : ${text}`) ??
      ok(rightOption(exo) === expected, `${expected}, la clé dit ${rightOption(exo)}`) ??
      ok(wrong.every((option) => IRRELEVANT.includes(option)), `mauvais choix ${wrong.join(" | ")}`) ??
      ok(text.endsWith(" Que manque-t-il pour répondre ?"), "sans la question de la donnée") ??
      // Le texte ne donne pas le nombre qu'il dit manquant : « quelques-unes » sans chiffre à côté.
      ok(!/quelques-un\p{L}* \d/u.test(text), "le nombre qui manque est écrit")
    );
  },
  "pb-inutile": (exo) => {
    const story = parseStory(exo.prompt);
    const extra = /(\d+) (ans|élèves|frères et sœurs)\./u.exec(exo.prompt);
    if (!story || !extra) return `histoire ou donnée inutile introuvable : ${exo.prompt}`;
    const value = Number(extra[1]);
    return (
      storyOk(story, levelOf(exo)) ??
      ok(value !== story.a && value !== story.b, `la donnée inutile ${value} est aussi un nombre de l'histoire`) ??
      ok(rightOption(exo) === String(value), `le nombre qui ne sert à rien est ${value}, la clé dit ${rightOption(exo)}`) ??
      ok([...optionsOf(exo)].sort().join() === [String(story.a), String(story.b), String(value)].sort().join(), `choix ${optionsOf(exo).join(" | ")} pour ${story.a}, ${story.b} et ${value}`)
    );
  },
  "pb-question": (exo) => {
    const story = parseStory(exo.prompt);
    if (!story) return `histoire introuvable : ${exo.prompt}`;
    const ending = story.op === "add" ? "maintenant ?" : story.op === "sub" ? "lui reste-t-il ?" : "en tout ?";
    const wrong = optionsOf(exo).filter((option) => option !== rightOption(exo));
    return (
      storyOk(story, levelOf(exo)) ??
      ok(/^Combien d(?:e |')/u.test(rightOption(exo)) && rightOption(exo).endsWith(ending), `la bonne question d'une histoire « ${story.op} » finit par « ${ending} » : ${rightOption(exo)}`) ??
      ok(rightOption(exo).includes(story.noun), `la bonne question parle de ${story.noun} : ${rightOption(exo)}`) ??
      ok(wrong.every((option) => !/^Combien/u.test(option)), `une mauvaise question commence par « Combien » : ${wrong.join(" | ")}`)
    );
  },
  "pb-etapes": (exo) => {
    const sequence = sequenceOf(exo);
    const start = PROBLEM_STEPS.indexOf(sequence[0]);
    return (
      ok(start >= 0, `étape inconnue : ${sequence[0]}`) ??
      ok(sequence.join("|") === PROBLEM_STEPS.slice(start, start + sequence.length).join("|"), `étapes dans le désordre : ${sequence.join(" > ")}`) ??
      ok(sequence.length >= 4, "moins de quatre étapes")
    );
  },
  "pb-relier": (exo) => {
    const pairs = pairsOf(exo);
    for (const pair of pairs) {
      const more = /^(\d+) [^,]+, puis (\d+) de plus$/u.exec(pair.left);
      const less = /^(\d+) [^,]+, puis (\d+) de moins$/u.exec(pair.left);
      const packs = /^(\d+) paquets de (\d+) /u.exec(pair.left);
      const expected = more ? `${more[1]} + ${more[2]}` : less ? `${less[1]} − ${less[2]}` : packs ? `${packs[1]} × ${packs[2]}` : null;
      if (!expected) return `histoire inattendue : ${pair.left}`;
      if (pair.right !== expected) return `${pair.left} : ${expected}, la paire dit ${pair.right}`;
      if (packs && !(Number(packs[1]) === 2 || Number(packs[1]) === 3 || Number(packs[2]) === 2 || Number(packs[2]) === 3)) return `paquets hors des tables de 2 et de 3 : ${pair.left}`;
      if (less && Number(less[1]) <= Number(less[2])) return `${pair.left} : un retrait plus grand que le début`;
    }
    return ok(pairs.length === 3 && allDifferent(pairs.map((pair) => pair.right)), "trois histoires, trois opérations différentes");
  },
  "pb-glisser": (exo) => {
    for (const item of itemsOf(exo)) {
      const m = /^\p{L}+ (\p{L}+) (\d+) \p{L}+$/u.exec(item.text);
      if (!m) return `histoire inattendue : ${item.text}`;
      const zone = ADD_VERBS.includes(m[1]) ? "On ajoute" : REMOVE_VERBS.includes(m[1]) ? "On enlève" : null;
      if (zone === null) return `verbe inconnu : ${m[1]}`;
      if (item.correctZone !== zone) return `${item.text} : ${zone}, la case dit ${item.correctZone}`;
    }
    const count = (zone: string) => itemsOf(exo).filter((item) => item.correctZone === zone).length;
    return ok(zonesOf(exo).join("|") === "On ajoute|On enlève", `cases ${zonesOf(exo).join(" | ")}`) ?? ok(count("On ajoute") >= 2 && count("On enlève") >= 2, "pas assez d'histoires par case");
  },

  // --- Le matériel du géomètre ----------------------------------------------------
  "outil-geometrie": (exo) => {
    const expected = TOOLS[exo.prompt];
    const options = optionsOf(exo);
    return (
      ok(expected !== undefined, `question inconnue : ${exo.prompt}`) ??
      ok(rightOption(exo) === expected, `${exo.prompt} ${expected}, la clé dit ${rightOption(exo)}`) ??
      // Le double décimètre EST une règle : ils ne se proposent jamais ensemble.
      ok(!(options.includes("Règle") && options.includes("Double décimètre")), `règle et double décimètre ensemble : ${options.join(" | ")}`) ??
      ok(allDifferent(options) && options.length === 3, `choix ${options.join(" | ")}`)
    );
  },
  "figure-etapes": (exo) => {
    const expected = PROCEDURES[exo.prompt];
    return ok(expected !== undefined, `procédure inconnue : ${exo.prompt}`) ?? ok(sequenceOf(exo).join("|") === expected.join("|"), `étapes dans le désordre : ${sequenceOf(exo).join(" > ")}`);
  },
};

describe("chaque gabarit des mesures, de l'heure, des problèmes et des figures du CP a sa vérification", () => {
  it("couvre exactement les trente et un gabarits", () => {
    expect(KINDS).toHaveLength(31);
    expect(Object.keys(CHECKS).sort()).toEqual([...KINDS].sort());
    for (const kind of KINDS) expect(Object.keys(GAME_KINDS), kind).toContain(kind);
  });
});

describe("les vingt-quatre horloges sont celles de Unicode, une par heure et par demi-heure", () => {
  it("la table de ce test et `clockOf` dessinent la même horloge pour chaque heure, juste ou et demie", () => {
    for (let hour = 1; hour <= 12; hour++) {
      expect(clockOf(hour, false), `${hour} heures`).toBe(CLOCK_WHOLE[hour - 1]);
      expect(clockOf(hour, true), `${hour} heures et demie`).toBe(CLOCK_HALF[hour - 1]);
    }
  });

  it("chaque horloge est un seul émoji d'affichage par défaut, que l'énoncé pose sur son socle", () => {
    for (const emoji of [...CLOCK_WHOLE, ...CLOCK_HALF]) {
      expect(/^\p{Emoji_Presentation}$/u.test(emoji), emoji).toBe(true);
      expect([...emoji].length, emoji).toBe(1);
    }
    expect(new Set([...CLOCK_WHOLE, ...CLOCK_HALF]).size).toBe(24);
  });

  it("`timeWords` écrit l'heure comme le test : « 1 heure », « 3 heures », « 3 heures et demie »", () => {
    for (let hour = 1; hour <= 12; hour++) for (const half of [false, true]) expect(timeWords(hour, half)).toBe(clockText({ hour, half }));
  });
});

describe("les gabarits des mesures, de l'heure, des problèmes et des figures du CP recalculent juste, depuis leurs propres tables", () => {
  for (const kind of KINDS) {
    it(`${kind} : la bonne réponse se recalcule, à tous les niveaux`, () => {
      for (const d of draws) {
        const exo = make(kind, d) as unknown as Exo;
        expect(CHECKS[kind](exo), `${kind} niveau ${d.level} : ${exo.prompt}`).toBeNull();
      }
    });
  }
});

describe("les règles de la fiche tiennent partout", () => {
  const every = KINDS.flatMap((kind) => draws.filter((_, i) => i % 3 === 0).map((d) => ({ kind, exo: make(kind, d) as unknown as Exo })));

  const shownTexts = (exo: Exo): string[] => {
    const texts: string[] = [exo.prompt];
    if (exo.payload.options) texts.push(...optionsOf(exo));
    if (exo.payload.blanks) texts.push(textOf(exo), ...blankOf(exo).options);
    if (exo.payload.correctSequence) texts.push(...sequenceOf(exo));
    if (exo.payload.pairs) texts.push(...pairsOf(exo).flatMap((pair) => [pair.left, pair.right]));
    if (exo.payload.items) texts.push(...itemsOf(exo).map((item) => item.text), ...zonesOf(exo));
    return texts;
  };

  it("aucun nombre n'est écrit au-delà de cent, ni dans l'énoncé ni dans un choix", () => {
    for (const { kind, exo } of every) for (const text of shownTexts(exo)) for (const n of text.match(/\d+/gu) ?? []) expect(Number(n), `${kind} : ${text}`).toBeLessThanOrEqual(100);
  });

  it("les mesures : une seule unité par sorte de mesure, jamais de gramme, de centimètre ni de demi-litre", () => {
    for (const { kind, exo } of every) {
      if (!kind.startsWith("mesure-")) continue;
      for (const text of shownTexts(exo)) expect(fold(text), `${kind} : ${text}`).not.toMatch(/\bgrammes?\b|centimetre|\bcm\b|demi-litre/u);
    }
  });

  it("les paquets des problèmes : un facteur égal à 2 ou à 3, un résultat sous trente", () => {
    for (const { kind, exo } of every) {
      if (kind !== "pb-operation" && kind !== "pb-resoudre") continue;
      const story = parseStory(exo.prompt);
      if (story?.op === "mult") {
        expect(story.a === 2 || story.a === 3 || story.b === 2 || story.b === 3, `${kind} : ${exo.prompt}`).toBe(true);
        expect(story.result, `${kind} : ${exo.prompt}`).toBeLessThanOrEqual(30);
      }
    }
  });

  it("le premier palier n'a pas de multiplication dans les problèmes ; les suivants ont l'ajout, le retrait et les paquets", () => {
    for (const d of draws.filter((entry) => entry.level === 1)) {
      for (const kind of ["pb-operation", "pb-resoudre", "pb-ecrire"] as const) {
        const exo = make(kind, d) as unknown as Exo;
        expect(parseStory(exo.prompt)?.op, `${kind} : ${exo.prompt}`).not.toBe("mult");
      }
    }
    const ops = new Set(draws.filter((d) => d.level >= 2).map((d) => parseStory((make("pb-resoudre", d) as unknown as Exo).prompt)?.op));
    expect(ops).toEqual(new Set(["add", "sub", "mult"]));
  });

  it("la monnaie : des sommes multiples de cinq, jamais plus de cent francs", () => {
    for (const { kind, exo } of every) {
      if (!kind.startsWith("monnaie-")) continue;
      for (const text of shownTexts(exo)) for (const m of text.matchAll(/(\d+) F/gu)) expect(Number(m[1]) % 5, `${kind} : ${text}`).toBe(0);
    }
  });
});

// ===========================================================================
// DEUX PALIERS D'UNE MÊME THÉMATIQUE NE POSENT JAMAIS LA MÊME QUESTION
// ===========================================================================

/** Ce qui fait l'identité d'une question : l'énoncé et la bonne réponse, ou l'ensemble des paires, des tuiles ou des étapes. */
function questionKey(exo: Exo): string {
  if (exo.payload.options) return `${exo.prompt}|${rightOption(exo)}`;
  if (exo.payload.blanks) return `${textOf(exo)}|${blankOf(exo).answer}`;
  if (exo.payload.pairs) return pairsOf(exo).map((pair) => `${pair.left}~${pair.right}`).sort().join(";");
  if (exo.payload.items) return itemsOf(exo).map((item) => `${item.text}>${item.correctZone}`).sort().join(";");
  if (exo.payload.correctSequence) return sequenceOf(exo).join(">");
  return `${exo.prompt}|${acceptedOf(exo).join("/")}`;
}

describe("les variantes d'un gabarit à peu de choix sont réparties par palier", () => {
  it("`variantsForLevel` donne trois parts qui ne se recoupent pas, jamais vides, dès trois variantes", () => {
    for (let n = 3; n <= 14; n++) {
      const items = Array.from({ length: n }, (_, i) => i);
      const groups = [1, 2, 4].map((level) => variantsForLevel(items, level as GameLevel));
      for (const group of groups) expect(group.length, `n=${n}`).toBeGreaterThan(0);
      expect(groups.flat().sort((a, b) => a - b), `n=${n}`).toEqual(items);
      expect(variantsForLevel(items, 3), `n=${n}`).toEqual(variantsForLevel(items, 4));
    }
    // En dessous de trois variantes, toutes restent permises.
    expect(variantsForLevel([1, 2], 1)).toEqual([1, 2]);
  });

  const FEW_VARIANTS = [
    "mesure-corps", "mesure-kilo", "mesure-kilo-trou", "calendrier-combien", "outil-geometrie", "figure-etapes", "pb-etapes", "ligne-qcm", "ligne-relier",
  ] as const satisfies readonly GameKind[];
  for (const kind of FEW_VARIANTS) {
    it(`${kind} : les trois paliers du CP ne posent jamais la même question`, () => {
      for (let n = 0; n < 80; n++) {
        const keys = [1, 2, 4].map((level) => questionKey(GAME_KINDS[kind].make(makeContext("CP", level as GameLevel, `variete:${kind}:${n}`)) as unknown as Exo));
        expect(new Set(keys).size, `${kind} #${n} : ${keys.join(" | ")}`).toBe(keys.length);
      }
    });
  }
});

// ===========================================================================
// LES MUTATIONS : une vérification qui ne voit pas une réponse abîmée ne prouve rien
// ===========================================================================

/** Abîme la bonne réponse d'un exercice juste, sans toucher à l'énoncé ni aux tuiles. `null` si rien ne peut être abîmé. */
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
      payload.acceptedAnswers = ["xxxx"];
      return copy();
    }
    default:
      return null;
  }
}

describe("les vérifications voient une bonne réponse abîmée", () => {
  for (const kind of KINDS) {
    it(`${kind} : abîmer la réponse fait échouer la vérification`, () => {
      let mutated = 0;
      for (const d of draws.filter((_, i) => i % 6 === 0)) {
        const exo = make(kind, d) as unknown as Exo;
        const broken = mutate(kind, exo);
        if (!broken) continue;
        mutated += 1;
        expect(CHECKS[kind](broken), `${kind} niveau ${d.level} : ${exo.prompt}`).not.toBeNull();
      }
      expect(mutated, kind).toBeGreaterThan(0);
    });
  }
});

// ===========================================================================
// LES RÈGLES COMMUNES
// ===========================================================================

describe("tous les gabarits des mesures, de l'heure, des problèmes et des figures du CP", () => {
  const exos = KINDS.flatMap((kind) => draws.filter((_, i) => i % 3 === 0).map((d) => ({ kind, exo: make(kind, d) as unknown as Exo })));

  const texts = (exo: Exo): string[] => {
    const out = [exo.prompt, ...exo.hints];
    if (exo.payload.options) out.push(...optionsOf(exo));
    if (exo.payload.blanks) out.push(textOf(exo), ...blankOf(exo).options);
    if (exo.payload.correctSequence) out.push(...sequenceOf(exo));
    if (exo.payload.pairs) out.push(...pairsOf(exo).flatMap((pair) => [pair.left, pair.right]));
    if (exo.payload.items) out.push(...itemsOf(exo).map((item) => item.text), ...zonesOf(exo));
    if (exo.payload.acceptedAnswers) out.push(...acceptedOf(exo));
    return out;
  };

  it("ont un énoncé que l'écran sait couper : pas de deux-points, une apostrophe au plus, vingt-huit mots au plus", () => {
    for (const { kind, exo } of exos) {
      expect(exo.prompt, kind).not.toMatch(/:/);
      expect(apostrophes(exo.prompt), `${kind} : ${exo.prompt}`).toBeLessThanOrEqual(1);
      expect(wordCount(exo.prompt), `${kind} : ${exo.prompt}`).toBeLessThanOrEqual(28);
    }
  });

  it("n'écrivent jamais « de » devant une voyelle : « paquets de oranges » s'écrit « paquets d'oranges »", () => {
    // Tous les tirages, pas un sur trois : la variante « paquets sans nombre » est rare.
    for (const kind of KINDS) {
      for (const d of draws) for (const text of texts(make(kind, d) as unknown as Exo)) expect(text, `${kind} : « ${text} »`).not.toMatch(/\bde [aeiouyéèêâîôû]/u);
    }
  });

  it("n'écrivent d'émoji que l'horloge des trois gabarits de l'heure, et jamais U+FE0F : les appareils anciens montrent les récents en carré", () => {
    for (const { kind, exo } of exos) {
      for (const text of texts(exo)) {
        expect(text.includes(VARIATION_SELECTOR), `${kind} : « ${text} »`).toBe(false);
        const emojis = text.match(/\p{Extended_Pictographic}/gu) ?? [];
        if (CLOCK_KINDS.includes(kind)) for (const emoji of emojis) expect(clockTime(emoji), `${kind} : « ${text} »`).not.toBeNull();
        else expect(emojis, `${kind} : « ${text} »`).toEqual([]);
      }
    }
  });

  it("proposent des choix tous différents, dont un seul est la bonne réponse", () => {
    for (const { kind, exo } of exos) {
      if (exo.payload.options) {
        const options = optionsOf(exo);
        expect(new Set(options).size, `${kind} : ${exo.prompt}`).toBe(options.length);
        expect(options.length, `${kind} : ${exo.prompt}`).toBe(3);
      }
      if (exo.payload.blanks) {
        const { options, answer } = blankOf(exo);
        expect(new Set(options).size, `${kind} : ${textOf(exo)}`).toBe(options.length);
        expect(options.filter((option) => option === answer), `${kind} : ${textOf(exo)}`).toHaveLength(1);
      }
      if (exo.payload.items) {
        const items = itemsOf(exo);
        expect(new Set(items.map((item) => item.text)).size, `${kind} : ${exo.prompt}`).toBe(items.length);
        for (const zone of zonesOf(exo)) expect(items.some((item) => item.correctZone === zone), `${kind} : ${zone}`).toBe(true);
      }
      if (exo.payload.pairs) {
        const pairs = pairsOf(exo);
        expect(new Set(pairs.map((pair) => pair.left)).size, `${kind} : ${exo.prompt}`).toBe(pairs.length);
        expect(new Set(pairs.map((pair) => pair.right)).size, `${kind} : ${exo.prompt}`).toBe(pairs.length);
      }
      if (exo.payload.correctSequence) {
        const sequence = sequenceOf(exo);
        expect(new Set(sequence).size, `${kind} : ${sequence.join(" ")}`).toBe(sequence.length);
        expect(sequence.length, kind).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it("n'écrivent dans aucun indice un chiffre, ni un mot de quatre lettres ou plus de la bonne réponse ou d'une tuile", () => {
    // « heure » et « demie » sont dans presque tous les choix de l'heure : les citer dit la règle de lecture, jamais l'horloge.
    const SHARED_WORDS = new Set(["heure", "heures", "demie"]);
    for (const { kind, exo } of exos) {
      const answers: string[] = [];
      if (exo.payload.options) answers.push(rightOption(exo));
      if (exo.payload.blanks) answers.push(blankOf(exo).answer);
      if (exo.payload.correctSequence) answers.push(...sequenceOf(exo));
      if (exo.payload.pairs) answers.push(...pairsOf(exo).flatMap((pair) => [pair.left, pair.right]));
      if (exo.payload.items) answers.push(...itemsOf(exo).map((item) => item.text));
      if (exo.payload.acceptedAnswers) answers.push(...acceptedOf(exo));
      const words = new Set(
        answers.flatMap((answer) =>
          fold(answer)
            .split(/[^a-z]+/)
            .filter((word) => word.length >= 4 && !SHARED_WORDS.has(word)),
        ),
      );
      for (const hint of exo.hints) {
        expect(/\d/.test(hint), `${kind} : « ${hint} » écrit un chiffre`).toBe(false);
        const hintWords = fold(hint).split(/[^a-z]+/);
        for (const word of words) expect(hintWords, `${kind} : « ${hint} » écrit « ${word} »`).not.toContain(word);
      }
    }
  });

  it("donnent trois indices différents, et se refont à l'identique avec la même graine", () => {
    for (const kind of KINDS) {
      const a = GAME_KINDS[kind].make(makeContext("CP", 2, "graine"));
      const b = GAME_KINDS[kind].make(makeContext("CP", 2, "graine"));
      expect(a).toEqual(b);
      expect(a.hints).toHaveLength(3);
      expect(new Set(a.hints).size, kind).toBe(3);
    }
  });

  it("passent le contrôleur de mathématiques au CP sans aucun défaut, à tous les niveaux", () => {
    for (const { kind, exo } of exos) {
      const defects = auditExercise({
        type: GAME_KINDS[kind].type,
        prompt: exo.prompt,
        payload: exo.payload,
        answerKey: exo.answerKey,
        hints: exo.hints,
        class: "CP",
        subject: "Mathématiques",
      });
      expect(defects, `${kind} : ${exo.prompt}`).toEqual([]);
    }
  });
});

// ===========================================================================
// LES THÉMATIQUES DU PROGRAMME
// ===========================================================================

describe("les quatre dernières thématiques de mathématiques du CP : mesures, heure et monnaie, problèmes, figures", () => {
  const KEYS = ["ma-cp-mesures", "ma-cp-heure-monnaie", "ma-cp-problemes", "ma-cp-figures"];
  const entryOf = (key: string) => allProgrammeEntries().find((e) => e.topic.key === key)!;
  const topicOf = (key: string) => entryOf(key).topic;
  const kindsOf = (key: string) => (topicOf(key).games ?? []).map((spec) => spec.kind as string);

  it("remplissent les dix places du palier, avec des jeux connus, sans appeler le modèle", () => {
    for (const key of KEYS) {
      const specs = topicOf(key).games ?? [];
      expect(
        specs.reduce((sum, spec) => sum + spec.count, 0),
        key,
      ).toBe(PALIER_SIZE);
      for (const spec of specs) {
        expect(Object.keys(GAME_KINDS), `${key} : ${spec.kind}`).toContain(spec.kind);
        expect(spec.vocabulary, `${key} : ${spec.kind}`).toBeUndefined();
      }
      expect(topicUsesModel(key), key).toBe(false);
    }
  });

  it("n'emploient chaque gabarit que dans la thématique qui le concerne", () => {
    for (const kind of kindsOf("ma-cp-mesures")) expect(kind, kind).toMatch(/^mesure-/);
    for (const kind of kindsOf("ma-cp-heure-monnaie")) expect(kind, kind).toMatch(/^(heure-|calendrier-|monnaie-)/);
    for (const kind of kindsOf("ma-cp-problemes")) expect(kind, kind).toMatch(/^pb-/);
    // Les figures empruntent les lignes aux arts et les coins à la géométrie du CI, qui sont déjà prouvés.
    const allowed = ["pixel-copie", "frise-formes", "ligne-glisser", "ligne-relier", "ligne-qcm", "outil-geometrie", "figure-etapes", "forme-coins"];
    for (const kind of kindsOf("ma-cp-figures")) expect(allowed, kind).toContain(kind);
  });

  it("achèvent le CP : aucune des quarante-deux thématiques n'appelle plus le modèle", () => {
    const cp = allProgrammeEntries().filter((e) => e.klass === "CP");
    expect(cp).toHaveLength(42);
    for (const entry of cp) {
      expect((entry.topic.games ?? []).reduce((sum, spec) => sum + spec.count, 0), entry.topic.key).toBeGreaterThanOrEqual(PALIER_SIZE);
      expect(topicUsesModel(entry.topic.key), entry.topic.key).toBe(false);
    }
  });

  it("sont celles du CP, et n'ont changé ni leur clé ni leur nombre de paliers", () => {
    for (const key of KEYS) {
      expect(entryOf(key).klass, key).toBe("CP");
      expect(topicOf(key).palierCount, key).toBeUndefined();
    }
  });

  it("fabriquent des paliers entiers, de dix exercices tous différents, qui passent le contrôleur et le calcul", () => {
    for (const key of KEYS) {
      for (let n = 0; n < 40; n++) {
        for (const palierIndex of [1, 2, 3]) {
          const games = generateGames(topicOf(key).games ?? [], { klass: "CP", palierIndex, palierCount: 3, seed: `${key}:${n}:${palierIndex}` });
          expect(games, `${key} palier ${palierIndex}`).toHaveLength(PALIER_SIZE);
          const questions = games.map((game) => `${game.prompt}|${JSON.stringify(game.payload)}`);
          expect(new Set(questions).size, `${key} #${n} palier ${palierIndex}`).toBe(questions.length);
          for (const game of games) {
            const defects = auditExercise({
              type: game.type,
              prompt: game.prompt,
              payload: game.payload,
              answerKey: game.answerKey,
              hints: game.hints,
              class: "CP",
              subject: "Mathématiques",
            });
            expect(defects, `${key} palier ${palierIndex} : ${game.prompt}`).toEqual([]);
            const origin = game.payload.game as { kind: string };
            if (CHECKS[origin.kind]) expect(CHECKS[origin.kind](game as unknown as Exo), `${key} palier ${palierIndex} ${origin.kind} : ${game.prompt}`).toBeNull();
          }
        }
      }
    }
  });

  it("varient les types d'un palier : au moins quatre sortes d'exercices sur dix", () => {
    for (const key of KEYS) {
      for (const palierIndex of [1, 2, 3]) {
        const games = generateGames(topicOf(key).games ?? [], { klass: "CP", palierIndex, palierCount: 3, seed: key });
        expect(new Set(games.map((game) => game.type)).size, `${key} palier ${palierIndex}`).toBeGreaterThanOrEqual(4);
      }
    }
  });

  it("gardent de quoi servir la démo du site : un glissé pour l'heure et la monnaie, une réponse courte pour les problèmes", () => {
    const typesOf = (key: string) => new Set((topicOf(key).games ?? []).map((spec) => GAME_KINDS[spec.kind].type));
    expect(typesOf("ma-cp-heure-monnaie").has("drag-drop")).toBe(true);
    expect(typesOf("ma-cp-problemes").has("short-answer")).toBe(true);
  });

  it("refont chaque exercice raté par le code, sans le modèle", () => {
    for (const key of KEYS) {
      for (const spec of topicOf(key).games ?? []) {
        const origin = { kind: spec.kind, level: 2, vocabulary: spec.vocabulary };
        const again = regenerateGame(origin, "CP", `reprise:${key}:${spec.kind}`);
        expect(again, spec.kind).not.toBeNull();
        expect(again!.type, spec.kind).toBe(GAME_KINDS[spec.kind].type);
      }
    }
  });
});
