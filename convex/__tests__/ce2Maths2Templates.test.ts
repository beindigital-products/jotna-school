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
 * LES MATHÉMATIQUES DU CE2, SECONDE MOITIÉ : la symétrie et les solides, les périmètres et les aires, les mesures, les problèmes en plusieurs étapes.
 *
 * Chaque test RECALCULE la bonne réponse avec ses propres tables et sa propre arithmétique, écrites à part : les axes de symétrie de chaque figure, les
 * nombres de faces, d'arêtes et de sommets, le périmètre et l'aire, le rapport de chaque couple d'unités, l'heure de fin d'une séance, et un petit
 * évaluateur d'expressions qui relit chaque calcul écrit d'un problème. Un gabarit dont la réponse contredit sa règle, ou qui sort de la plage de son palier,
 * échoue. À la fin, des MUTATIONS : on abîme la bonne réponse d'un exercice juste, et chaque vérification doit le voir.
 */

const LEVELS: GameLevel[] = [1, 2, 3, 4];
const draws = LEVELS.flatMap((level) => Array.from({ length: 60 }, (_, n) => ({ level, seed: `ce2m2:${level}:${n}` })));
const make = (kind: GameKind, d: { level: GameLevel; seed: string }) => GAME_KINDS[kind].make(makeContext("CE2", d.level, `${kind}:${d.seed}`));

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
/** Le nombre d'un texte : « 12 345 » vaut 12345. */
const num = (text: string) => Number(text.replace(/ /g, ""));
const NUMBER = String.raw`\d+(?: \d{3})*`;
const inRange = (value: number, [lo, hi]: readonly [number, number]) => value >= lo && value <= hi;
const lowerFirst = (text: string) => `${text.charAt(0).toLowerCase()}${text.slice(1)}`;

/** Un évaluateur d'expressions à part : « 1 000 − 3 × 250 », « (27 + 33) ÷ 10 ». Priorités habituelles, parenthèses, nombres à espaces. */
function evaluate(expression: string): number {
  const text = expression
    .replace(/(?<=\d) (?=\d{3}(?!\d))/g, "")
    .replace(/−/g, "-")
    .replace(/×/g, "*")
    .replace(/÷/g, "/");
  let i = 0;
  const peek = () => {
    while (text[i] === " ") i++;
    return text[i];
  };
  const factor = (): number => {
    if (peek() === "(") {
      i++;
      const inner = sum();
      if (peek() !== ")") throw new Error(`parenthèse non fermée dans « ${expression} »`);
      i++;
      return inner;
    }
    const m = /^\d+/.exec(text.slice(i));
    if (!m) throw new Error(`nombre attendu dans « ${expression} » à ${i}`);
    i += m[0].length;
    return Number(m[0]);
  };
  const term = (): number => {
    let value = factor();
    for (;;) {
      const c = peek();
      if (c === "*") {
        i++;
        value *= factor();
      } else if (c === "/") {
        i++;
        value /= factor();
      } else return value;
    }
  };
  const sum = (): number => {
    let value = term();
    for (;;) {
      const c = peek();
      if (c === "+") {
        i++;
        value += term();
      } else if (c === "-") {
        i++;
        value -= term();
      } else return value;
    }
  };
  const result = sum();
  if (peek() !== undefined) throw new Error(`reste « ${text.slice(i)} » dans « ${expression} »`);
  return result;
}

const escapeRe = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const numbersIn = (expression: string): number[] => (expression.replace(/(?<=\d) (?=\d{3}(?!\d))/g, "").match(/\d+/g) ?? []).map(Number);

// ===========================================================================
// LA SYMÉTRIE ET LES SOLIDES
// ===========================================================================

/** Les axes de symétrie de chaque figure, écrits à part. */
const AXES: Record<string, number> = {
  "un carré": 4,
  "un rectangle de 6 cm sur 4 cm": 2,
  "un triangle équilatéral": 3,
  "un losange sans angle droit": 2,
  "un triangle qui a deux côtés égaux et un troisième plus long": 1,
  "un parallélogramme sans angle droit": 0,
  "un triangle aux trois côtés inégaux": 0,
  "la lettre H": 2,
  "la lettre X": 2,
  "la lettre A": 1,
  "la lettre T": 1,
  "la lettre M": 1,
  "la lettre F": 0,
  "la lettre R": 0,
  "la lettre Z": 0,
  "la lettre N": 0,
};
const LETTER_FIGURES = Object.keys(AXES).filter((name) => name.startsWith("la lettre"));
const SIMPLE_FIGURES = ["un carré", "un rectangle de 6 cm sur 4 cm", "un triangle équilatéral"];
const AXES_BY_LEVEL: Record<GameLevel, string[]> = {
  1: SIMPLE_FIGURES,
  2: [...SIMPLE_FIGURES, "un losange sans angle droit", "un triangle qui a deux côtés égaux et un troisième plus long", "un parallélogramme sans angle droit"],
  3: ["un rectangle de 6 cm sur 4 cm", "un losange sans angle droit", ...LETTER_FIGURES],
  4: Object.keys(AXES),
};
const CHOICE_AXES: Record<string, number> = { "Le carré": 4, "Le triangle équilatéral": 3, "La lettre H": 2, "La lettre X": 2, "La lettre A": 1, "La lettre T": 1, "La lettre M": 1, "La lettre F": 0, "La lettre R": 0, "La lettre Z": 0, "La lettre N": 0 };
const EASY_CHOICES = ["Le carré", "Le triangle équilatéral", "La lettre H", "La lettre A", "La lettre F"];
const AXIS_WORDS = ["aucun", "un", "deux", "trois", "quatre"];

const checkSymAxis: Check = (exo) => {
  const level = levelOf(exo);
  let m = /^Combien d'axes de symétrie a (.+) \?$/.exec(exo.prompt);
  if (m) {
    const axes = AXES[m[1]];
    return all(
      ok(axes !== undefined, `figure inconnue : ${m[1]}`),
      ok(AXES_BY_LEVEL[level].includes(m[1]), `« ${m[1]} » au palier ${level}`),
      ok(rightOption(exo) === String(axes), `${exo.prompt} : ${rightOption(exo)}, pas ${axes}`),
      ok(optionsOf(exo).every((option) => /^[0-6]$/.test(option)), "des nombres d'axes entre 0 et 6"),
    );
  }
  m = /^Parmi ces choix, lequel (n'a aucun|a exactement (un|deux|trois|quatre)) axes? de symétrie \?$/.exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const wanted = m[1] === "n'a aucun" ? 0 : AXIS_WORDS.indexOf(m[2]);
  const pool = level <= 2 ? EASY_CHOICES : Object.keys(CHOICE_AXES);
  return all(
    ok(optionsOf(exo).every((option) => pool.includes(option)), `choix hors du palier ${level} : ${optionsOf(exo).join(" | ")}`),
    ok(CHOICE_AXES[rightOption(exo)] === wanted, `${exo.prompt} : « ${rightOption(exo)} » a ${CHOICE_AXES[rightOption(exo)]} axes`),
    ok(wrongOf(exo).every((option) => CHOICE_AXES[option] !== wanted), "un mauvais choix a aussi ce nombre d'axes"),
    ok((wanted <= 1) === / axe de symétrie/.test(exo.prompt), "axe au singulier jusqu'à un, axes ensuite"),
    ok(optionsOf(exo).every((option) => option.length < 24), "un choix de vingt-quatre caractères se devinerait à sa longueur"),
  );
};

const carreaux = (n: number) => `${n} ${n === 1 ? "carreau" : "carreaux"}`;

const checkSymMirror: Check = (exo) => {
  const level = levelOf(exo);
  let m = /^Le point A est à (\d+) carreaux? de la ligne de symétrie\. Son symétrique B est de l'autre côté\. À combien de carreaux de cette ligne est B \?$/.exec(exo.prompt);
  if (m) {
    const d = Number(m[1]);
    return all(
      ok(level === 1, "cette forme n'est que du premier palier"),
      ok(d >= 1 && d <= 5, `${d} carreaux`),
      ok(m[0].includes(`à ${carreaux(d)} de`), "carreau au singulier à un seul"),
      ok(rightOption(exo) === carreaux(d), `${exo.prompt} : ${rightOption(exo)}`),
    );
  }
  m = /^Le point A est à (\d+) carreaux de la ligne de symétrie\. Son symétrique B est de l'autre côté\. Combien de carreaux y a-t-il entre A et B \?$/.exec(exo.prompt);
  if (m) {
    const d = Number(m[1]);
    return all(ok(level === 2, "cette forme n'est que du deuxième palier"), ok(d >= 2 && d <= 9, `${d} carreaux`), ok(rightOption(exo) === carreaux(2 * d), `${exo.prompt} : ${rightOption(exo)}, pas ${2 * d}`));
  }
  m = /^Sur un quadrillage, la ligne de symétrie est la colonne (\d+)\. Le point A est dans la colonne (\d+)\. Dans quelle colonne est son symétrique \?$/.exec(exo.prompt);
  if (m) {
    const [c, a] = [Number(m[1]), Number(m[2])];
    return all(ok(level === 3, "cette forme n'est que du troisième palier"), ok(c >= 4 && c <= 9 && a >= 1 && a < c, `axe ${c}, point ${a}`), ok(rightOption(exo) === String(2 * c - a), `${exo.prompt} : ${rightOption(exo)}, pas ${2 * c - a}`));
  }
  m = /^La ligne de symétrie est la ligne (\d+) d'un quadrillage\. Le point A est sur la ligne (\d+)\. Sur quelle ligne est son symétrique \?$/.exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const [r, a] = [Number(m[1]), Number(m[2])];
  return all(ok(level === 4, "cette forme n'est que du dernier palier"), ok(r >= 4 && r <= 8 && a !== r && a >= 1 && a <= 2 * r - 1, `axe ${r}, point ${a}`), ok(rightOption(exo) === String(2 * r - a), `${exo.prompt} : ${rightOption(exo)}, pas ${2 * r - a}`));
};

const SOLID_NAMES = ["Le cube", "Le pavé droit", "Le cylindre", "La boule", "La pyramide"];
const SOLID_Q: Record<string, [string, GameLevel]> = {
  "Quel solide a six faces toutes carrées ?": ["Le cube", 1],
  "Quel solide a deux faces rondes et planes ?": ["Le cylindre", 1],
  "Quel solide ressemble à une boîte de chaussures ?": ["Le pavé droit", 1],
  "Un dé à jouer a la forme de quel solide ?": ["Le cube", 2],
  "Une boîte de conserve a la forme de quel solide ?": ["Le cylindre", 2],
  "Une brique a la forme de quel solide ?": ["Le pavé droit", 2],
  "Quel solide a six faces rectangulaires, certaines plus longues que d'autres ?": ["Le pavé droit", 3],
  "Quel solide n'a aucun sommet ?": ["Le cylindre", 3],
  "Quel solide peut rouler sur sa face courbe ?": ["Le cylindre", 3],
  "Quel solide a huit sommets, douze arêtes et toutes ses faces carrées ?": ["Le cube", 4],
  "Une boîte allongée de gâteaux a la forme de quel solide ?": ["Le pavé droit", 4],
  "Un tuyau rond et droit a la forme de quel solide ?": ["Le cylindre", 4],
};
/** Les nombres d'un cube et d'un pavé droit, écrits à part. */
const PART_COUNT: Record<string, number> = { faces: 6, sommets: 8, arêtes: 12 };

const checkSymSolid: Check = (exo) => {
  const level = levelOf(exo);
  const known = SOLID_Q[exo.prompt];
  if (known) {
    const [answer, from] = known;
    const options = optionsOf(exo);
    return all(
      ok(level === from, `« ${exo.prompt} » au palier ${level}, pas ${from}`),
      ok(rightOption(exo) === answer, `${exo.prompt} : ${rightOption(exo)}, pas ${answer}`),
      ok(options.every((option) => SOLID_NAMES.includes(option)), `solide inconnu : ${options.join(" | ")}`),
      // Un cube est un pavé droit particulier : l'un ne se propose pas contre l'autre.
      ok(!(answer === "Le cube" && options.includes("Le pavé droit")) && !(answer === "Le pavé droit" && options.includes("Le cube")), "le cube et le pavé droit ensemble"),
      ok(exo.prompt !== "Quel solide n'a aucun sommet ?" || !options.includes("La boule"), "la boule n'a aucun sommet non plus"),
    );
  }
  let m = /^Combien (de faces|de sommets|d'arêtes) a (un cube|un pavé droit) \?$/.exec(exo.prompt);
  if (m) {
    const part = m[1].replace(/^(de|d')\s?/, "");
    const wantedLevel: Record<string, GameLevel[]> = { faces: [1, 4], sommets: [2, 4], arêtes: [3, 4] };
    return all(
      ok(wantedLevel[part].includes(level), `${part} au palier ${level}`),
      ok(rightOption(exo) === String(PART_COUNT[part]), `${exo.prompt} : ${rightOption(exo)}, pas ${PART_COUNT[part]}`),
      ok(same(optionsOf(exo), ["6", "8", "12"]), `les trois nombres du solide : ${optionsOf(exo).join(" | ")}`),
    );
  }
  m = /^Combien de sommets a un cylindre \?$/.exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  return all(ok(level === 4, "le cylindre n'est compté qu'au dernier palier"), ok(rightOption(exo) === "0", "un cylindre n'a aucun sommet"), ok(same(optionsOf(exo), ["0", "1", "2"]), optionsOf(exo).join(" | ")));
};

const SYM_GAPS: Record<string, [string, GameLevel]> = {
  "Un cube a ___ faces.": ["6", 1],
  "Une boîte de conserve a la forme d'un ___.": ["cylindre", 1],
  "Un carré a ___ axes de symétrie.": ["4", 1],
  "Un pavé droit a ___ sommets.": ["8", 2],
  "Une figure se plie le long de son ___ de symétrie.": ["axe", 2],
  "Un rectangle de 6 cm sur 4 cm a ___ axes de symétrie.": ["2", 2],
  "Un cube a ___ arêtes.": ["12", 3],
  "Un point et son symétrique sont à la même ___ de la ligne de symétrie.": ["distance", 3],
  "Un triangle équilatéral a ___ axes de symétrie.": ["3", 3],
  "Un cylindre a deux faces ___ et une face courbe.": ["rondes", 4],
  "Le cube et le pavé droit ont chacun ___ faces.": ["6", 4],
  "Un losange sans angle droit a ___ axes de symétrie.": ["2", 4],
};

const checkSymGap: Check = (exo) => {
  const known = SYM_GAPS[textOf(exo)];
  if (!known) return `phrase inconnue : ${textOf(exo)}`;
  return all(ok(levelOf(exo) === known[1], `« ${textOf(exo)} » au palier ${levelOf(exo)}, pas ${known[1]}`), ok(blankOf(exo).answer === known[0], `${textOf(exo)} : ${blankOf(exo).answer}, pas ${known[0]}`));
};

const SOLID_OF_OBJECT: Record<string, string> = {
  Dé: "Cube",
  Glaçon: "Cube",
  "Boîte de chaussures": "Pavé droit",
  Brique: "Pavé droit",
  "Boîte d'allumettes": "Pavé droit",
  "Paquet de biscuits": "Pavé droit",
  "Boîte de conserve": "Cylindre",
  "Rouleau de papier": "Cylindre",
  "Tube de colle": "Cylindre",
  Tuyau: "Cylindre",
};

const checkSymLinks: Check = (exo) => {
  const pairs = pairsOf(exo);
  return all(
    ok(pairs.length === 3, "trois paires"),
    ok(same(pairs.map((pair) => pair.right), ["Cube", "Pavé droit", "Cylindre"]), "un objet par solide"),
    ...pairs.map((pair) => ok(SOLID_OF_OBJECT[pair.left] === pair.right, `${pair.left} ~ ${pair.right}`)),
  );
};

const FLAT = ["Le carré", "Le rectangle", "Le triangle", "Le cercle"];
const SOLIDS = ["Le cube", "Le pavé droit", "Le cylindre", "La boule", "La pyramide"];

const checkSymSort: Check = (exo) => {
  const level = levelOf(exo);
  const items = itemsOf(exo);
  if (level <= 2) {
    return all(
      ok(same(zonesOf(exo), ["Figure plate", "Solide"]), `cases inattendues : ${zonesOf(exo).join(", ")}`),
      ok(items.length === 4, "quatre étiquettes"),
      ...items.map((item) => ok(item.correctZone === (FLAT.includes(item.text) ? "Figure plate" : SOLIDS.includes(item.text) ? "Solide" : "?"), `${item.text} dans « ${item.correctZone} »`)),
      ok(items.filter((item) => item.correctZone === "Solide").length === 2, "deux étiquettes par case"),
    );
  }
  return all(
    ok(same(zonesOf(exo), ["Au moins un axe", "Aucun axe"]), `cases inattendues : ${zonesOf(exo).join(", ")}`),
    ok(items.length === 4, "quatre étiquettes"),
    ...items.map((item) => {
      const axes = AXES[lowerFirst(item.text)];
      return ok(axes !== undefined && item.correctZone === (axes > 0 ? "Au moins un axe" : "Aucun axe"), `${item.text} dans « ${item.correctZone} »`);
    }),
    ok(items.filter((item) => item.correctZone === "Aucun axe").length === 2, "deux étiquettes par case"),
  );
};

const SYM_STEPS: Record<GameLevel, [string, string[]]> = {
  1: ["Mets dans l'ordre les gestes pour compléter une figure par symétrie.", ["Repère la ligne de symétrie", "Place le symétrique de chaque sommet", "Relie les points entre eux", "Vérifie en pliant la feuille"]],
  2: ["Mets dans l'ordre les gestes pour trouver le symétrique du point A.", ["Compte la distance du point à la ligne", "Compte la même distance de l'autre côté", "Marque le nouveau point", "Donne-lui un nom"]],
  3: ["Mets dans l'ordre les gestes pour vérifier une ligne de symétrie.", ["Découpe la figure", "Plie-la le long de la ligne", "Regarde si les deux parties se superposent", "Conclus"]],
  4: ["Mets dans l'ordre les gestes pour reconnaître un solide.", ["Observe ses faces", "Compte les faces et les sommets", "Compare avec les solides connus", "Donne son nom"]],
};

const checkSymSteps: Check = (exo) => {
  const [prompt, steps] = SYM_STEPS[levelOf(exo)];
  return all(ok(exo.prompt === prompt, `énoncé du palier : ${exo.prompt}`), ok(JSON.stringify(sequenceOf(exo)) === JSON.stringify(steps), `suite : ${sequenceOf(exo).join(" | ")}`));
};

const SYM_WRITE: Record<string, [number, GameLevel]> = {
  "Combien de faces a un cube ?": [6, 1],
  "Combien d'axes de symétrie a un carré ?": [4, 1],
  "Combien de faces a un pavé droit ?": [6, 1],
  "Combien d'axes de symétrie a un triangle équilatéral ?": [3, 1],
  "Combien de sommets a un cube ?": [8, 2],
  "Combien d'axes de symétrie a un rectangle de 6 cm sur 4 cm ?": [2, 2],
  "Combien de sommets a un pavé droit ?": [8, 2],
  "Combien d'axes de symétrie a la lettre H ?": [2, 2],
  "Combien d'arêtes a un cube ?": [12, 3],
  "Combien d'arêtes a un pavé droit ?": [12, 3],
  "Combien de faces et de sommets a un cube en tout ?": [6 + 8, 3],
  "Combien d'axes de symétrie a la lettre F ?": [0, 3],
  "Combien de sommets a un cylindre ?": [0, 4],
  "Combien de faces, d'arêtes et de sommets a un pavé droit en tout ?": [6 + 12 + 8, 4],
  "Combien d'axes de symétrie a un losange sans angle droit ?": [2, 4],
  "Combien d'axes de symétrie a un parallélogramme sans angle droit ?": [0, 4],
};

const checkSymWrite: Check = (exo) => {
  const question = exo.prompt.replace(/ Écris le nombre\.$/, "");
  const known = SYM_WRITE[question];
  if (!known) return `question inconnue : ${exo.prompt}`;
  return all(
    ok(exo.prompt.endsWith(" Écris le nombre."), "la consigne « Écris le nombre. »"),
    ok(levelOf(exo) === known[1], `« ${question} » au palier ${levelOf(exo)}, pas ${known[1]}`),
    ok(acceptedOf(exo).length === 1 && acceptedOf(exo)[0] === String(known[0]), `${question} : ${acceptedOf(exo)}, pas ${known[0]}`),
  );
};

// ===========================================================================
// LES PÉRIMÈTRES ET LES AIRES
// ===========================================================================

const SQ_SIDE: Record<GameLevel, readonly [number, number]> = { 1: [2, 6], 2: [4, 9], 3: [5, 15], 4: [8, 25] };
const RECT_LONG: Record<GameLevel, readonly [number, number]> = { 1: [3, 6], 2: [5, 9], 3: [8, 15], 4: [12, 30] };
const RECT_WIDE: Record<GameLevel, readonly [number, number]> = { 1: [2, 4], 2: [2, 6], 3: [4, 10], 4: [6, 20] };

type Calc = { form: string; value: number; unit: string; problem: string | null };

/** Relit un énoncé de calcul de mesure : le résultat, son unité, et ce qui ne va pas dans les nombres. */
function parseCalc(prompt: string, level: GameLevel): Calc | null {
  const unitOk = (u: string) => (level <= 2 ? u === "cm" : u === "cm" || u === "m");
  let m = /^Quel est le périmètre d'un carré de (\d+) (cm|m) de côté \?$/.exec(prompt);
  if (m) {
    const s = Number(m[1]);
    return { form: "carre", value: 4 * s, unit: m[2], problem: all(ok(inRange(s, SQ_SIDE[level]), `côté ${s}`), ok(unitOk(m[2]), `unité ${m[2]}`)) };
  }
  m = /^Un rectangle mesure (\d+) (cm|m) de long et (\d+) (cm|m) de large\. Quel est son périmètre \?$/.exec(prompt);
  if (m) {
    const [long, wide] = [Number(m[1]), Number(m[3])];
    return {
      form: "rectangle",
      value: 2 * (long + wide),
      unit: m[2],
      problem: all(ok(m[2] === m[4], "deux unités"), ok(inRange(long, RECT_LONG[level]) && inRange(wide, RECT_WIDE[level]) && wide < long, `${long} sur ${wide}`), ok(unitOk(m[2]), `unité ${m[2]}`)),
    };
  }
  m = /^Un carré a un périmètre de (\d+) (cm|m)\. Quelle est la longueur de son côté \?$/.exec(prompt);
  if (m) {
    const p = Number(m[1]);
    return { form: "cote-carre", value: p / 4, unit: m[2], problem: all(ok(p % 4 === 0, `${p} n'est pas un multiple de quatre`), ok(inRange(p / 4, SQ_SIDE[level]), `côté ${p / 4}`), ok(unitOk(m[2]), `unité ${m[2]}`)) };
  }
  m = /^Un rectangle a un périmètre de (\d+) (cm|m)\. Sa longueur est de (\d+) (cm|m)\. Quelle est sa largeur \?$/.exec(prompt);
  if (m) {
    const [p, long] = [Number(m[1]), Number(m[3])];
    const wide = p / 2 - long;
    return {
      form: "cote-rectangle",
      value: wide,
      unit: m[2],
      problem: all(ok(m[2] === m[4], "deux unités"), ok(p % 2 === 0 && wide >= 1 && wide < long, `périmètre ${p}, longueur ${long}`), ok(inRange(long, RECT_LONG[level]) && inRange(wide, RECT_WIDE[level]), `${long} sur ${wide}`), ok(unitOk(m[2]), `unité ${m[2]}`)),
    };
  }
  m = /^Un rectangle est quadrillé en (\d+) carreaux de long sur (\d+) carreaux de large\. Combien de carreaux contient-il \?$/.exec(prompt);
  if (m) {
    const [long, wide] = [Number(m[1]), Number(m[2])];
    const longs: Record<GameLevel, readonly [number, number]> = { 1: [3, 5], 2: [4, 8], 3: [4, 8], 4: [4, 8] };
    const wides: Record<GameLevel, readonly [number, number]> = { 1: [2, 4], 2: [2, 6], 3: [2, 6], 4: [2, 6] };
    return { form: "aire", value: long * wide, unit: "carreaux", problem: ok(inRange(long, longs[level]) && inRange(wide, wides[level]) && wide < long, `${long} sur ${wide}`) };
  }
  m = /^Une figure est faite de deux rectangles\. Le premier fait (\d+) carreaux sur (\d+), le second (\d+) carreaux sur (\d+)\. Combien de carreaux contient-elle \?$/.exec(prompt);
  if (m) {
    const [a, b, c, d] = m.slice(1).map(Number);
    return { form: "aire-deux", value: a * b + c * d, unit: "carreaux", problem: ok(inRange(a, [3, 6]) && inRange(b, [2, 5]) && inRange(c, [2, 5]) && inRange(d, [2, 5]), `${a}x${b} + ${c}x${d}`) };
  }
  m = /^Un rectangle fait (\d+) carreaux sur (\d+)\. On enlève un coin de (\d+) carreaux sur (\d+)\. Combien de carreaux reste-t-il \?$/.exec(prompt);
  if (m) {
    const [big, tall, w, h] = m.slice(1).map(Number);
    return { form: "aire-coin", value: big * tall - w * h, unit: "carreaux", problem: ok(inRange(big, [6, 10]) && inRange(tall, [4, 8]) && inRange(w, [2, 3]) && inRange(h, [2, 3]), `${big}x${tall} - ${w}x${h}`) };
  }
  return null;
}

const calcCheck =
  (allowed: (level: GameLevel) => string[]): Check =>
  (exo) => {
    const level = levelOf(exo);
    const calc = parseCalc(exo.prompt, level);
    if (!calc) return `énoncé inconnu : ${exo.prompt}`;
    return all(
      calc.problem,
      ok(allowed(level).includes(calc.form), `la forme ${calc.form} au palier ${level}`),
      ok(rightOption(exo) === `${fmt(calc.value)} ${calc.unit}`, `${exo.prompt} : ${rightOption(exo)}, pas ${fmt(calc.value)} ${calc.unit}`),
      ok(wrongOf(exo).every((option) => option.endsWith(` ${calc.unit}`)), "même unité pour tous les choix"),
    );
  };

const checkPerSquare = calcCheck(() => ["carre"]);
const checkPerRectangle = calcCheck(() => ["rectangle"]);
const checkPerSide = calcCheck((level) => (level <= 2 ? ["cote-carre"] : ["cote-rectangle"]));
const checkPerArea = calcCheck((level) => (level <= 2 ? ["aire"] : level === 3 ? ["aire-deux"] : ["aire-coin"]));

const WRITE_FORMS: Record<GameLevel, string[]> = {
  1: ["carre", "aire"],
  2: ["rectangle", "cote-carre"],
  3: ["cote-rectangle", "aire-deux"],
  4: ["rectangle", "aire-coin", "cote-rectangle"],
};
const checkPerWrite: Check = (exo) => {
  const level = levelOf(exo);
  const calc = parseCalc(exo.prompt.replace(/ Écris le nombre\.$/, ""), level);
  if (!calc) return `énoncé inconnu : ${exo.prompt}`;
  return all(
    calc.problem,
    ok(exo.prompt.endsWith(" Écris le nombre."), "la consigne « Écris le nombre. »"),
    ok(WRITE_FORMS[level].includes(calc.form), `la forme ${calc.form} au palier ${level}`),
    ok(acceptedOf(exo).length === 1 && acceptedOf(exo)[0] === String(calc.value), `${exo.prompt} : ${acceptedOf(exo)}, pas ${calc.value}`),
  );
};

const area = (a: number, b: number) => a * b;
const perimeter = (a: number, b: number) => 2 * (a + b);

const checkPerCompare: Check = (exo) => {
  const level = levelOf(exo);
  const m = /^Le rectangle A mesure (\d+) carreaux sur (\d+)\. Le rectangle B mesure (\d+) carreaux sur (\d+)\. Lequel a (la plus grande aire|le plus grand périmètre) \?$/.exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const [a1, a2, b1, b2] = m.slice(1, 5).map(Number);
  const asksArea = m[5] === "la plus grande aire";
  const measure = asksArea ? area : perimeter;
  const [ma, mb] = [measure(a1, a2), measure(b1, b2)];
  const equalText = asksArea ? "Ils ont la même aire" : "Ils ont le même périmètre";
  const expected = ma === mb ? equalText : ma > mb ? "Le rectangle A" : "Le rectangle B";
  const sameArea = area(a1, a2) === area(b1, b2);
  return all(
    ok(rightOption(exo) === expected, `${exo.prompt} : ${rightOption(exo)}, pas ${expected}`),
    ok(same(optionsOf(exo), ["Le rectangle A", "Le rectangle B", equalText]), optionsOf(exo).join(" | ")),
    ok(a1 > a2 && b1 > b2 && a2 >= 2 && b2 >= 2, "la longueur dépasse la largeur"),
    ok(level === 4 || (area(a1, a2) !== area(b1, b2) && perimeter(a1, a2) !== perimeter(b1, b2)), "aux trois premiers paliers, ni l'aire ni le périmètre ne sont égaux"),
    ok(level !== 3 || !asksArea, "le troisième palier compare des périmètres"),
    ok(level > 2 || asksArea, "les deux premiers paliers comparent des aires"),
    ok(!sameArea || perimeter(a1, a2) !== perimeter(b1, b2), "deux rectangles de même aire ont des périmètres différents"),
    ok(level === 4 || Math.max(a1, b1) <= [0, 6, 8, 10, 12][level], `longueur trop grande au palier ${level}`),
  );
};

const PER_GAPS: Record<string, [string, GameLevel]> = {
  "Pour mesurer la longueur du contour d'une figure, on calcule son ___.": ["périmètre", 1],
  "Pour mesurer la place qu'une figure couvre, on calcule son ___.": ["aire", 1],
  "Le périmètre d'un rectangle est la somme de ses ___ côtés.": ["quatre", 2],
  "L'aire se compte en ___ sur un quadrillage.": ["carreaux", 2],
  "Un rectangle de 12 m sur 7 m a un périmètre de ___ m.": [String(2 * (12 + 7)), 3],
  "Un carré de 15 cm de côté a un périmètre de ___ cm.": [String(4 * 15), 3],
  "Un rectangle de 9 carreaux sur 6 contient ___ carreaux.": [String(9 * 6), 4],
  "Un rectangle de 8 carreaux sur 5 perd un coin de 2 carreaux sur 2, il reste ___ carreaux.": [String(8 * 5 - 2 * 2), 4],
};
const checkPerGap: Check = (exo) => {
  const known = PER_GAPS[textOf(exo)];
  if (!known) return `phrase inconnue : ${textOf(exo)}`;
  return all(ok(blankOf(exo).answer === known[0], `${textOf(exo)} : ${blankOf(exo).answer}, pas ${known[0]}`), ok(levelOf(exo) === known[1], `« ${textOf(exo)} » au palier ${levelOf(exo)}, pas ${known[1]}`));
};

const checkPerLinks: Check = (exo) => {
  const level = levelOf(exo);
  const pairs = pairsOf(exo);
  const forms = pairs.map((pair) => {
    let m = /^Carré de (\d+) cm de côté$/.exec(pair.left);
    if (m) return { form: "carre", good: pair.right === `${4 * Number(m[1])} cm` && inRange(Number(m[1]), [2, 9]) };
    m = /^Rectangle de (\d+) cm sur (\d+) cm$/.exec(pair.left);
    if (m) return { form: "rect", good: pair.right === `${perimeter(Number(m[1]), Number(m[2]))} cm` && Number(m[1]) > Number(m[2]) && inRange(Number(m[1]), [4, 10]) };
    m = /^Rectangle de (\d+) carreaux sur (\d+)$/.exec(pair.left);
    if (m) return { form: "aire", good: pair.right === `${area(Number(m[1]), Number(m[2]))} carreaux` && Number(m[1]) > Number(m[2]) && inRange(Number(m[1]), [4, 9]) };
    m = /^Périmètre du carré de (\d+) cm$/.exec(pair.left);
    if (m) return { form: "p-carre", good: pair.right === `${4 * Number(m[1])} cm` && inRange(Number(m[1]), [5, 12]) };
    m = /^Périmètre du rectangle de (\d+) cm sur (\d+) cm$/.exec(pair.left);
    if (m) return { form: "p-rect", good: pair.right === `${perimeter(Number(m[1]), Number(m[2]))} cm` && Number(m[1]) > Number(m[2]) && inRange(Number(m[1]), [6, 14]) };
    m = /^Aire du rectangle de (\d+) carreaux sur (\d+)$/.exec(pair.left);
    if (m) return { form: "a-rect", good: pair.right === `${area(Number(m[1]), Number(m[2]))} carreaux` && Number(m[1]) > Number(m[2]) && inRange(Number(m[1]), [5, 9]) };
    return { form: "?", good: false };
  });
  const allowed: Record<GameLevel, string[]> = { 1: ["carre"], 2: ["rect"], 3: ["aire"], 4: ["p-carre", "p-rect", "a-rect"] };
  const prompts: Record<GameLevel, string> = {
    1: "Relie chaque carré à son périmètre.",
    2: "Relie chaque rectangle à son périmètre.",
    3: "Relie chaque rectangle à son aire.",
    4: "Relie chaque figure à son résultat.",
  };
  return all(
    ok(pairs.length === 3, "trois paires"),
    ok(exo.prompt === prompts[level], `consigne du palier : ${exo.prompt}`),
    ...forms.map((entry, i) => ok(entry.form !== "?" && entry.good && allowed[level].includes(entry.form), `${pairs[i].left} ~ ${pairs[i].right}`)),
    ok(level < 4 || same(forms.map((entry) => entry.form), ["p-carre", "p-rect", "a-rect"]), "une paire de chaque sorte au dernier palier"),
  );
};

const PERIMETER_TILES = [
  "La clôture d'un jardin",
  "Le grillage autour d'un champ",
  "Le tour d'un terrain de sport",
  "La bordure d'une photo",
  "La guirlande autour d'une salle",
  "La plinthe d'une chambre",
  "Le fil autour d'un cadre",
  "La barrière d'un enclos",
];
const AREA_TILES = ["La peinture d'un mur", "Le carrelage d'une cuisine", "Le gazon d'un terrain", "Le papier peint d'une chambre", "Le tissu d'une nappe", "La toile d'une grande tente", "Le goudron d'une cour", "La moquette d'une salle"];

const checkPerSort: Check = (exo) => {
  const items = itemsOf(exo);
  const expected = items.length === (levelOf(exo) <= 2 ? 4 : 5);
  return all(
    ok(same(zonesOf(exo), ["Périmètre", "Aire"]), `cases inattendues : ${zonesOf(exo).join(", ")}`),
    ok(expected, `${items.length} étiquettes`),
    ...items.map((item) => ok(item.correctZone === (PERIMETER_TILES.includes(item.text) ? "Périmètre" : AREA_TILES.includes(item.text) ? "Aire" : "?"), `${item.text} dans « ${item.correctZone} »`)),
    ok(items.some((item) => item.correctZone === "Périmètre") && items.some((item) => item.correctZone === "Aire"), "les deux cases sont servies"),
  );
};

const checkPerProblem: Check = (exo) => {
  const level = levelOf(exo);
  const right = rightOption(exo);
  let m = /^Un jardin carré a (\d+) m de côté\. (\S+) pose une clôture tout autour\. Quelle longueur de clôture lui faut-il \?$/.exec(exo.prompt);
  if (m) {
    const s = Number(m[1]);
    return all(ok(level === 1, "cette forme n'est que du premier palier"), ok(inRange(s, [3, 8]), `côté ${s}`), ok(right === `${4 * s} m`, `${exo.prompt} : ${right}, pas ${4 * s} m`));
  }
  m = /^Un champ rectangulaire mesure (\d+) m de long et (\d+) m de large\. (\S+) en fait le tour à pied\. Combien de mètres parcourt-(il|elle) \?$/.exec(exo.prompt);
  if (m) {
    const [long, wide] = [Number(m[1]), Number(m[2])];
    return all(
      ok(level === 2, "cette forme n'est que du deuxième palier"),
      ok(inRange(long, RECT_LONG[2]) && inRange(wide, RECT_WIDE[2]) && wide < long, `${long} sur ${wide}`),
      ok(right === `${perimeter(long, wide)} m`, `${exo.prompt} : ${right}, pas ${perimeter(long, wide)} m`),
      ok((m[4] === "elle") === GIRLS.includes(m[3]), `« ${m[3]} » avec « ${m[4]} »`),
    );
  }
  m = /^Une salle est carrelée en (\d+) rangées de (\d+) carreaux\. Combien de carreaux couvrent la salle \?$/.exec(exo.prompt);
  if (m) {
    const [rows, each] = [Number(m[1]), Number(m[2])];
    return all(ok(level === 3, "cette forme n'est que du troisième palier"), ok(inRange(rows, [5, 12]) && inRange(each, [4, 11]), `${rows} rangées de ${each}`), ok(right === `${rows * each} carreaux`, `${exo.prompt} : ${right}, pas ${rows * each}`));
  }
  m = new RegExp(`^Un jardin rectangulaire mesure (\\d+) m sur (\\d+) m\\. Le grillage coûte (${NUMBER}) FCFA le mètre\\. Combien coûte la clôture complète \\?$`).exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const [long, wide, price] = [Number(m[1]), Number(m[2]), num(m[3])];
  return all(
    ok(level === 4, "cette forme n'est que du dernier palier"),
    ok(inRange(long, [8, 14]) && inRange(wide, [4, 9]) && wide < long, `${long} sur ${wide}`),
    ok([250, 500, 750].includes(price), `prix ${price}`),
    ok(right === `${fmt(perimeter(long, wide) * price)} FCFA`, `${exo.prompt} : ${right}, pas ${fmt(perimeter(long, wide) * price)}`),
    ok(wrongOf(exo).every((option) => num(option.replace(" FCFA", "")) % 25 === 0), "des prix en multiples de vingt-cinq"),
  );
};

const GIRLS = ["Awa", "Fatou", "Mariama", "Aïssatou", "Penda", "Khady", "Sokhna", "Coumba", "Ndèye", "Rama"];
const BOYS = ["Moussa", "Modou", "Ibrahima", "Ousmane", "Cheikh", "Mamadou", "Abdou", "Lamine", "Samba", "Malick"];
const NAMES = [...GIRLS, ...BOYS];

// ===========================================================================
// LES MESURES
// ===========================================================================

/** Chaque unité dans la plus petite de sa sorte (le millimètre, le gramme, le centilitre). */
const BASE: Record<string, number> = { km: 1_000_000, m: 1000, dm: 100, cm: 10, mm: 1, kg: 1000, g: 1, L: 100, dL: 10, cL: 1 };
const SYMBOL_OF_WORD: Record<string, string> = {
  mètres: "m",
  centimètres: "cm",
  décimètres: "dm",
  millimètres: "mm",
  kilomètres: "km",
  kilogrammes: "kg",
  grammes: "g",
  litres: "L",
  décilitres: "dL",
  centilitres: "cL",
};
const ALL_PAIRS: [string, string][] = [["m", "cm"], ["kg", "g"], ["km", "m"], ["m", "dm"], ["dm", "cm"], ["cm", "mm"], ["L", "dL"], ["L", "cL"], ["dL", "cL"]];
const PAIRS_BY_LEVEL: Record<GameLevel, [string, string][]> = {
  1: ALL_PAIRS.slice(0, 3),
  2: ALL_PAIRS.slice(3, 6),
  3: ALL_PAIRS.slice(6, 9),
  4: ALL_PAIRS,
};
const REST_OF: Record<string, number[]> = { "m>cm": [25, 50, 75], "kg>g": [250, 500, 750], "km>m": [250, 500, 750], "m>dm": [2, 5, 8], "dm>cm": [3, 5, 7], "cm>mm": [2, 5, 8], "L>dL": [2, 5, 8], "L>cL": [25, 50, 75], "dL>cL": [2, 5, 8] };
const WHOLE_TOP: Record<GameLevel, number> = { 1: 5, 2: 6, 3: 7, 4: 9 };
const THING_OF_PAIR: Record<string, string> = { "m>cm": "longueur", "kg>g": "masse", "km>m": "distance", "m>dm": "longueur", "dm>cm": "longueur", "cm>mm": "longueur", "L>dL": "contenance", "L>cL": "contenance", "dL>cL": "contenance" };
const pairOf = (level: GameLevel, a: string, b: string): [string, string] | undefined => PAIRS_BY_LEVEL[level].find(([big, small]) => (big === a && small === b) || (big === b && small === a));
const factorOf = (pair: [string, string]) => BASE[pair[0]] / BASE[pair[1]];

/** Une conversion relue : ce qu'elle vaut, ou ce qui ne va pas. */
function convert(level: GameLevel, from: string, target: string): { value: number; problem: string | null } {
  const compound = new RegExp(`^(\\d+) (\\S+) (${NUMBER}) (\\S+)$`).exec(from);
  if (compound) {
    const [k, bigUnit, rest, smallUnit] = [Number(compound[1]), compound[2], num(compound[3]), compound[4]];
    const pair = pairOf(level, bigUnit, smallUnit);
    if (!pair || pair[0] !== bigUnit) return { value: 0, problem: `couple inconnu : ${from}` };
    return {
      value: k * factorOf(pair) + rest,
      problem: all(
        ok(level === 4, "un nombre composé n'est que du dernier palier"),
        ok(REST_OF[`${pair[0]}>${pair[1]}`].includes(rest), `reste ${rest} pour ${pair.join(">")}`),
        ok(target === smallUnit, "un nombre composé se convertit vers la petite unité"),
        ok(k >= 1 && k <= WHOLE_TOP[level], `${k}`),
      ),
    };
  }
  const simple = new RegExp(`^(${NUMBER}) (\\S+)$`).exec(from);
  if (!simple) return { value: 0, problem: `écriture inconnue : ${from}` };
  const [n, unit] = [num(simple[1]), simple[2]];
  const pair = pairOf(level, unit, target);
  if (!pair) return { value: 0, problem: `couple inconnu au palier ${level} : ${unit} vers ${target}` };
  const value = (n * BASE[unit]) / BASE[target];
  const whole = unit === pair[0] ? n : value;
  return {
    value,
    problem: all(
      ok(Number.isInteger(value), `${from} en ${target} : ${value}`),
      ok(whole >= 1 && whole <= WHOLE_TOP[level], `${whole} grandes unités`),
      ok(level > 1 || unit === pair[0], "le premier palier ne convertit que vers la petite unité"),
    ),
  };
}

const checkMesConvert: Check = (exo) => {
  const m = /^Convertis (.+) en (\S+)\.$/.exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const target = SYMBOL_OF_WORD[m[2]];
  if (!target) return `unité inconnue : ${m[2]}`;
  const result = convert(levelOf(exo), m[1], target);
  return all(result.problem, ok(rightOption(exo) === `${fmt(result.value)} ${target}`, `${exo.prompt} : ${rightOption(exo)}, pas ${fmt(result.value)} ${target}`), ok(wrongOf(exo).every((option) => option.endsWith(` ${target}`)), "même unité pour tous les choix"));
};

const checkMesWrite: Check = (exo) => {
  const m = /^Combien de (\S+) y a-t-il dans (.+) \? Écris le nombre\.$/.exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const target = SYMBOL_OF_WORD[m[1]];
  if (!target) return `unité inconnue : ${m[1]}`;
  const result = convert(levelOf(exo), m[2], target);
  return all(result.problem, ok(acceptedOf(exo).length === 1 && acceptedOf(exo)[0] === String(result.value), `${exo.prompt} : ${acceptedOf(exo)}, pas ${result.value}`));
};

const MES_GAPS: Record<string, [string, GameLevel]> = {
  "Un crayon mesure 15 ___ de long.": ["centimètres", 1],
  "Un sac de riz pèse 25 ___.": ["kilogrammes", 1],
  "Une table mesure 8 ___ de large.": ["décimètres", 2],
  "Une cuillère de sirop contient 5 ___.": ["centilitres", 2],
  "Une bouteille contient 1 ___ d'eau.": ["litre", 3],
  "Une pièce de monnaie a 2 ___ d'épaisseur.": ["millimètres", 3],
  "Un verre contient 2 ___ de jus.": ["décilitres", 4],
  "La route entre deux villes mesure 40 ___.": ["kilomètres", 4],
};

const checkMesGap: Check = (exo) => {
  const text = textOf(exo);
  if (exo.prompt === "Complète l'égalité.") {
    const m = new RegExp(`^(.+) = ___ (\\S+)$`).exec(text);
    if (!m) return `égalité inconnue : ${text}`;
    const result = convert(levelOf(exo), m[1], m[2]);
    return all(
      result.problem,
      ok(!new RegExp(`^\\d+ \\S+ ${NUMBER} \\S+$`).test(m[1]), "pas de nombre composé dans une égalité à trou"),
      ok(blankOf(exo).answer === fmt(result.value), `${text} : ${blankOf(exo).answer}, pas ${fmt(result.value)}`),
    );
  }
  const known = MES_GAPS[text];
  if (!known) return `phrase inconnue : ${text}`;
  return all(ok(levelOf(exo) === known[1], `« ${text} » au palier ${levelOf(exo)}, pas ${known[1]}`), ok(blankOf(exo).answer === known[0], `${text} : ${blankOf(exo).answer}, pas ${known[0]}`));
};

/** Une mesure écrite « 3 m » ou « 150 cm » : sa valeur dans la plus petite unité de sa sorte. */
function measureOf(label: string): { base: number; unit: string; n: number } | null {
  const m = new RegExp(`^(${NUMBER}) (\\S+)$`).exec(label);
  if (!m || BASE[m[2]] === undefined) return null;
  return { base: num(m[1]) * BASE[m[2]], unit: m[2], n: num(m[1]) };
}

/** Les mesures d'une comparaison ou d'un rangement : deux unités d'un couple du palier, une valeur de chaque sorte, toutes différentes. */
function measuresProblem(level: GameLevel, labels: string[]): { problem: string | null; thing: string; values: number[] } {
  const parsed = labels.map(measureOf);
  if (parsed.some((entry) => entry === null)) return { problem: `mesure inconnue : ${labels.join(" | ")}`, thing: "", values: [] };
  const measures = parsed as { base: number; unit: string; n: number }[];
  const units = [...new Set(measures.map((measure) => measure.unit))];
  if (units.length !== 2) return { problem: `deux unités attendues : ${labels.join(" | ")}`, thing: "", values: [] };
  const pair = pairOf(level, units[0], units[1]);
  if (!pair) return { problem: `couple inconnu au palier ${level} : ${units.join(", ")}`, thing: "", values: [] };
  const values = measures.map((measure) => measure.base);
  const half = (BASE[pair[0]] / BASE[pair[1]] / 2) * BASE[pair[1]];
  return {
    problem: all(
      ok(new Set(values).size === values.length, `valeurs égales : ${labels.join(" | ")}`),
      ok(values.every((value) => value % half === 0 && value / half >= 1 && value / half <= [0, 8, 10, 12, 12][level]), `valeurs hors des demi-unités du palier : ${labels.join(" | ")}`),
      ok(measures.filter((measure) => measure.unit === pair[0]).every((measure) => (measure.base / half) % 2 === 0), "une grande unité est toujours une valeur entière"),
      ok(measures.filter((measure) => measure.unit === pair[1]).every((measure) => (measure.base / half) % 2 === 1), "une petite unité est une valeur impaire de demi-unités"),
    ),
    thing: THING_OF_PAIR[`${pair[0]}>${pair[1]}`],
    values,
  };
}

const checkMesCompare: Check = (exo) => {
  const m = /^Quelle est la plus (grande|petite) (longueur|masse|distance|contenance) \?$/.exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const problem = measuresProblem(levelOf(exo), optionsOf(exo));
  const values = problem.values;
  const right = measureOf(rightOption(exo));
  const best = m[1] === "grande" ? Math.max(...values) : Math.min(...values);
  return all(problem.problem, ok(optionsOf(exo).length === 3, "trois mesures"), ok(problem.thing === m[2], `« ${m[2]} » pour ${optionsOf(exo).join(" | ")}`), ok(right?.base === best, `${exo.prompt} : ${rightOption(exo)} n'est pas la ${m[1]}`));
};

const checkMesOrder: Check = (exo) => {
  const m = /^Range ces (longueurs|masses|distances|contenances) (de la plus petite à la plus grande|de la plus grande à la plus petite)\.$/.exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const sequence = sequenceOf(exo);
  const problem = measuresProblem(levelOf(exo), sequence);
  const bases = sequence.map((label) => measureOf(label)?.base ?? NaN);
  const ascending = m[2] === "de la plus petite à la plus grande";
  const sorted = [...bases].sort((a, b) => (ascending ? a - b : b - a));
  return all(problem.problem, ok(sequence.length === 4, "quatre mesures"), ok(`${problem.thing}s` === m[1] || (problem.thing === "distance" && m[1] === "distances"), `« ${m[1]} » pour ${sequence.join(" | ")}`), ok(JSON.stringify(bases) === JSON.stringify(sorted), `${exo.prompt} : ${sequence.join(" < ")}`));
};

const MES_UNITS: Record<string, [string, GameLevel]> = {
  "Quelle unité convient le mieux pour mesurer la longueur de la cour ?": ["Mètre", 1],
  "Quelle unité convient le mieux pour mesurer l'eau de la bassine ?": ["Litre", 1],
  "Quelle unité convient le mieux pour peser un sac de riz ?": ["Kilogramme", 1],
  "Quelle unité convient le mieux pour mesurer la distance entre deux villes ?": ["Kilomètre", 1],
  "Quelle unité convient le mieux pour mesurer la hauteur d'une fourmi ?": ["Millimètre", 2],
  "Quelle unité convient le mieux pour mesurer la longueur d'un crayon ?": ["Centimètre", 2],
  "Quelle unité convient le mieux pour peser une plume ?": ["Gramme", 2],
  "Quelle unité convient le mieux pour mesurer le sirop d'une cuillère ?": ["Centilitre", 2],
  "Quelle unité convient le mieux pour mesurer le jus d'un verre ?": ["Décilitre", 3],
  "Quelle unité convient le mieux pour mesurer la hauteur d'une porte ?": ["Mètre", 3],
  "Quelle unité convient le mieux pour peser une pomme ?": ["Gramme", 3],
  "Quelle unité convient le mieux pour mesurer l'eau du grand bidon ?": ["Litre", 3],
  "Un crayon mesure environ combien ?": ["15 cm", 4],
  "Une bouteille d'eau contient environ combien ?": ["1 L", 4],
  "Une pomme pèse environ combien ?": ["150 g", 4],
  "Un élève de CE2 mesure environ combien ?": ["130 cm", 4],
};

const checkMesUnit: Check = (exo) => {
  const known = MES_UNITS[exo.prompt];
  if (!known) return `question inconnue : ${exo.prompt}`;
  const options = optionsOf(exo);
  const sizeQuestion = known[1] === 4;
  return all(
    ok(levelOf(exo) === known[1], `« ${exo.prompt} » au palier ${levelOf(exo)}, pas ${known[1]}`),
    ok(rightOption(exo) === known[0], `${exo.prompt} : ${rightOption(exo)}, pas ${known[0]}`),
    // L'ordre de grandeur garde le même nombre dans les trois choix : seule l'unité change.
    ok(!sizeQuestion || new Set(options.map((option) => option.split(" ")[0])).size === 1, "le même nombre dans les trois choix"),
    ok(sizeQuestion || options.every((option) => /^[A-ZÉ][a-zéè]+$/.test(option)), "un mot seul sans article"),
  );
};

const checkMesLinks: Check = (exo) => {
  const level = levelOf(exo);
  const pairs = pairsOf(exo);
  const families = new Set<string>();
  return all(
    ok(pairs.length === 3, "trois paires"),
    ...pairs.map((pair) => {
      const left = measureOf(pair.left);
      const right = measureOf(pair.right);
      if (!left || !right) return `paire inconnue : ${pair.left} ~ ${pair.right}`;
      const found = pairOf(level, left.unit, right.unit);
      if (!found) return `couple inconnu au palier ${level} : ${pair.left} ~ ${pair.right}`;
      families.add(found.join(">"));
      return all(ok(left.unit === found[0] && left.base === right.base, `${pair.left} ~ ${pair.right}`), ok(left.n >= 1 && left.n <= 9, `${left.n}`));
    }),
    ok(level === 4 || families.size === 1, "un seul couple d'unités avant le dernier palier"),
  );
};

const LENGTHS = ["Hauteur d'un baobab", "Longueur d'une corde", "Largeur de la classe", "Distance entre deux villes", "Épaisseur d'un cahier", "Longueur d'un crayon"];
const MASSES = ["Masse d'un sac de riz", "Masse d'un poisson", "Masse d'un cahier", "Masse d'une pomme", "Masse d'un bébé", "Masse d'une valise"];
const CAPACITIES = ["Eau d'un seau", "Lait d'une bouteille", "Huile d'un bidon", "Jus d'une carafe", "Eau d'une marmite", "Sirop d'une cuillère"];
const MES_ZONES: Record<GameLevel, [string, string]> = { 1: ["Longueur", "Masse"], 2: ["Longueur", "Contenance"], 3: ["Masse", "Contenance"], 4: ["Contenance", "Longueur"] };
const ZONE_TILES: Record<string, string[]> = { Longueur: LENGTHS, Masse: MASSES, Contenance: CAPACITIES };

const checkMesSort: Check = (exo) => {
  const level = levelOf(exo);
  const zones = MES_ZONES[level];
  const items = itemsOf(exo);
  return all(
    ok(same(zonesOf(exo), zones), `cases inattendues : ${zonesOf(exo).join(", ")}`),
    ok(items.length === (level <= 2 ? 4 : 5), `${items.length} étiquettes`),
    ...items.map((item) => ok(zones.includes(item.correctZone) && ZONE_TILES[item.correctZone].includes(item.text), `${item.text} dans « ${item.correctZone} »`)),
    ok(zones.every((zone) => items.some((item) => item.correctZone === zone)), "les deux cases sont servies"),
  );
};

const clock = (total: number) => `${Math.floor(total / 60)} h${total % 60 === 0 ? "" : ` ${String(total % 60).padStart(2, "0")}`}`;

const checkMesDuration: Check = (exo) => {
  const level = levelOf(exo);
  const right = rightOption(exo);
  let m = /^Combien de minutes y a-t-il dans (\d) h \?$/.exec(exo.prompt);
  if (m) return all(ok(level === 1, "cette forme n'est que du premier palier"), ok(inRange(Number(m[1]), [2, 6]), `${m[1]} h`), ok(right === String(60 * Number(m[1])), `${exo.prompt} : ${right}`));
  m = /^Combien de secondes y a-t-il dans (\d) min \?$/.exec(exo.prompt);
  if (m) return all(ok(level === 2, "cette forme n'est que du deuxième palier"), ok(inRange(Number(m[1]), [2, 6]), `${m[1]} min`), ok(right === String(60 * Number(m[1])), `${exo.prompt} : ${right}`));
  m = /^Combien de minutes y a-t-il dans (\d) h (\d+) min \?$/.exec(exo.prompt);
  if (m) {
    const [h, min] = [Number(m[1]), Number(m[2])];
    return all(ok(level === 3, "cette forme n'est que du troisième palier"), ok(inRange(h, [2, 4]) && [15, 20, 30, 40, 45].includes(min), `${h} h ${min}`), ok(right === String(60 * h + min), `${exo.prompt} : ${right}`));
  }
  m = /^(\d+) minutes font combien d'heures et de minutes \?$/.exec(exo.prompt);
  if (m) {
    const total = Number(m[1]);
    const [h, min] = [Math.floor(total / 60), total % 60];
    return all(
      ok(level === 3, "cette forme n'est que du troisième palier"),
      ok(inRange(h, [2, 4]) && [15, 20, 30, 40, 45].includes(min), `${total} minutes`),
      ok(right === `${h} h ${min} min`, `${exo.prompt} : ${right}, pas ${h} h ${min} min`),
      ok(wrongOf(exo).every((option) => /^\d+ h \d+ min$/.test(option) && Number(option.split(" ")[2]) < 60), "des heures et des minutes valides (moins de soixante minutes)"),
    );
  }
  m = /^Un film commence à (\d+) h(?: (\d{2}))? et dure (\d) h (\d+) min\. À quelle heure finit-il \?$/.exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const start = 60 * Number(m[1]) + Number(m[2] ?? 0);
  const [dh, dm] = [Number(m[3]), Number(m[4])];
  const end = start + 60 * dh + dm;
  return all(
    ok(level === 4, "cette forme n'est que du dernier palier"),
    ok(inRange(Number(m[1]), [8, 16]) && [0, 10, 15, 20, 30, 40, 45, 50].includes(Number(m[2] ?? 0)), `début ${clock(start)}`),
    ok(inRange(dh, [1, 2]) && [15, 20, 30, 40, 45, 50].includes(dm), `durée ${dh} h ${dm}`),
    ok(end < 24 * 60, "la séance finit dans la journée"),
    ok(right === clock(end), `${exo.prompt} : ${right}, pas ${clock(end)}`),
    ok(wrongOf(exo).every((option) => /^\d+ h(?: \d{2})?$/.test(option) && (option.split(" ")[2] === undefined || Number(option.split(" ")[2]) < 60)), "des heures valides"),
  );
};

const checkMesProblem: Check = (exo) => {
  const level = levelOf(exo);
  const right = rightOption(exo);
  const forms: { re: RegExp; thing: string; adding: boolean; k: number; bigAt: number; rest: number; smallAt: number; word: number; child?: number }[] = [
    { re: new RegExp(`^(\\S+) a (\\d+) (\\S+) de ruban rouge et (${NUMBER}) (\\S+) de ruban bleu\\. Combien de (\\S+) de ruban a-t-(?:il|elle) en tout \\?$`), thing: "longueur", adding: true, k: 2, bigAt: 3, rest: 4, smallAt: 5, word: 6, child: 1 },
    { re: new RegExp(`^Une corde mesure (\\d+) (\\S+)\\. (\\S+) en coupe (${NUMBER}) (\\S+)\\. Combien de (\\S+) de corde reste-t-il \\?$`), thing: "longueur", adding: false, k: 1, bigAt: 2, rest: 4, smallAt: 5, word: 6, child: 3 },
    { re: new RegExp(`^(\\S+) marche (\\d+) (\\S+) le matin, puis (${NUMBER}) (\\S+) l'après-midi\\. Combien de (\\S+) marche-t-(?:il|elle) en tout \\?$`), thing: "distance", adding: true, k: 2, bigAt: 3, rest: 4, smallAt: 5, word: 6, child: 1 },
    { re: new RegExp(`^Une route mesure (\\d+) (\\S+)\\. (\\S+) en a déjà fait (${NUMBER}) (\\S+)\\. Combien de (\\S+) reste-t-il à faire \\?$`), thing: "distance", adding: false, k: 1, bigAt: 2, rest: 4, smallAt: 5, word: 6, child: 3 },
    { re: new RegExp(`^Un panier contient (\\d+) (\\S+) de mangues et (${NUMBER}) (\\S+) de bananes\\. Combien de (\\S+) y a-t-il en tout \\?$`), thing: "masse", adding: true, k: 1, bigAt: 2, rest: 3, smallAt: 4, word: 5 },
    { re: new RegExp(`^Un sac de riz pèse (\\d+) (\\S+)\\. (\\S+) en retire (${NUMBER}) (\\S+)\\. Combien de (\\S+) reste-t-il dans le sac \\?$`), thing: "masse", adding: false, k: 1, bigAt: 2, rest: 4, smallAt: 5, word: 6, child: 3 },
    { re: new RegExp(`^(\\S+) verse (\\d+) (\\S+) de jus dans une carafe, puis (${NUMBER}) (\\S+) de plus\\. Combien de (\\S+) y a-t-il dans la carafe \\?$`), thing: "contenance", adding: true, k: 2, bigAt: 3, rest: 4, smallAt: 5, word: 6, child: 1 },
    { re: new RegExp(`^Un flacon contient (\\d+) (\\S+) d'huile\\. (\\S+) en verse (${NUMBER}) (\\S+)\\. Combien de (\\S+) reste-t-il dans le flacon \\?$`), thing: "contenance", adding: false, k: 1, bigAt: 2, rest: 4, smallAt: 5, word: 6, child: 3 },
  ];
  for (const form of forms) {
    const m = form.re.exec(exo.prompt);
    if (!m) continue;
    const [k, big, rest, small, word] = [Number(m[form.k]), m[form.bigAt], num(m[form.rest]), m[form.smallAt], m[form.word]];
    const pair = pairOf(level, big, small);
    if (!pair) return `couple inconnu au palier ${level} : ${big}, ${small}`;
    const factor = factorOf(pair);
    const result = form.adding ? k * factor + rest : k * factor - rest;
    return all(
      ok(pair[0] === big && pair[1] === small, "la grande unité d'abord, puis la petite"),
      ok(THING_OF_PAIR[`${pair[0]}>${pair[1]}`] === form.thing, `${form.thing} pour ${pair.join(">")}`),
      ok(REST_OF[`${pair[0]}>${pair[1]}`].includes(rest), `reste ${rest}`),
      ok(k >= 2 && k <= 6, `${k} grandes unités`),
      ok(SYMBOL_OF_WORD[word] === small, `« ${word} » pour ${small}`),
      ok(right === `${fmt(result)} ${small}`, `${exo.prompt} : ${right}, pas ${fmt(result)} ${small}`),
      ok(form.child === undefined || NAMES.includes(m[form.child]), `prénom inconnu : ${m[form.child ?? 1]}`),
      ok(!/(?:a|marche)-t-il en tout/.test(exo.prompt) || !GIRLS.includes(m[1]), "il pour une fille"),
      ok(!/(?:a|marche)-t-elle en tout/.test(exo.prompt) || !BOYS.includes(m[1]), "elle pour un garçon"),
    );
  }
  return `énoncé inconnu : ${exo.prompt}`;
};

// ===========================================================================
// LES PROBLÈMES
// ===========================================================================

type Story = {
  scenario: string;
  ops: 2 | 3;
  ordered: boolean;
  text: string;
  value: number;
  unit: string;
  question: string;
  goal: string;
  first: string;
  steps: string[];
  calcNumbers: number[];
  tiles: string[];
  child: string | null;
  problem: string | null;
};

const SCENARIOS_BY_LEVEL: Record<GameLevel, string[]> = {
  1: ["billes", "route", "paquets", "billes3", "roues"],
  2: ["achat", "paquets", "partage", "route", "billes3", "roues"],
  3: ["achat", "partage", "rangement", "route", "billes3", "roues"],
  4: ["achat", "paquets", "partage", "rangement", "route", "billes3", "roues"],
};
const BANKNOTES = [500, 1000, 2000, 5000, 10000];
const BUY_COUNT: Record<GameLevel, readonly [number, number]> = { 1: [2, 3], 2: [2, 4], 3: [3, 6], 4: [3, 9] };
const BUY_PRICES: Record<GameLevel, number[]> = { 1: [50, 100, 150, 200], 2: [100, 150, 200, 250], 3: [125, 175, 225, 350], 4: [175, 225, 275, 325, 425] };
const BUNDLE_COUNT: Record<GameLevel, readonly [number, number]> = { 1: [2, 4], 2: [3, 5], 3: [4, 8], 4: [5, 9] };
const BUNDLE_SIZE: Record<GameLevel, readonly [number, number]> = { 1: [3, 6], 2: [4, 8], 3: [5, 9], 4: [6, 12] };
const BUNDLE_LOOSE: Record<GameLevel, readonly [number, number]> = { 1: [2, 9], 2: [3, 12], 3: [4, 20], 4: [7, 25] };
const START_COUNT: Record<GameLevel, readonly [number, number]> = { 1: [15, 30], 2: [25, 60], 3: [40, 120], 4: [80, 250] };
const SHARE_KIDS: Record<GameLevel, readonly [number, number]> = { 1: [2, 4], 2: [3, 5], 3: [4, 8], 4: [6, 9] };
const SHARE_EACH: Record<GameLevel, readonly [number, number]> = { 1: [3, 6], 2: [4, 8], 3: [6, 12], 4: [8, 15] };
const BOX_COUNT: Record<GameLevel, readonly [number, number]> = { 1: [3, 5], 2: [4, 7], 3: [5, 9], 4: [8, 20] };
const TRIP_TOTAL: Record<GameLevel, readonly [number, number]> = { 1: [60, 100], 2: [120, 300], 3: [200, 500], 4: [300, 900] };
const CARS: Record<GameLevel, readonly [number, number]> = { 1: [2, 4], 2: [3, 6], 3: [5, 9], 4: [8, 14] };
const BIKES: Record<GameLevel, readonly [number, number]> = { 1: [1, 3], 2: [2, 5], 3: [3, 8], 4: [5, 12] };
const STOCK_OF: Record<string, { many: string; one: string }> = { mangues: { many: "paniers", one: "panier" }, oranges: { many: "cageots", one: "cageot" }, œufs: { many: "boîtes", one: "boîte" } };
const ONE_OF: Record<string, string> = { sacs: "sac", boîtes: "boîte", paniers: "panier" };
const stepsLost = "Calcule ce qui reste après la perte";

/** Relit une histoire au début d'un énoncé : ses nombres, son résultat, ses étapes, et ce qui ne va pas. */
function parseStory(prompt: string, level: GameLevel): Story | null {
  const name = String.raw`([\p{L}]+)`;
  const base = { child: null as string | null, problem: null as string | null };
  let m = new RegExp(`^${name} achète (\\d+) (cahiers|pains|ballons|règles|mangues|stylos) à (${NUMBER}) FCFA pièce et paie (${NUMBER}) FCFA\\.`, "u").exec(prompt);
  if (m) {
    const [n, p, pay] = [Number(m[2]), num(m[4]), num(m[5])];
    const larger = BANKNOTES.find((note) => note > n * p);
    return {
      ...base,
      scenario: "achat",
      ops: 2,
      ordered: true,
      text: m[0],
      value: pay - n * p,
      unit: "FCFA",
      question: "Combien lui rend-on ?",
      goal: "la monnaie",
      first: `Combien coûtent les ${m[3]} ?`,
      steps: [`Calcule le prix des ${m[3]}`, "Calcule la monnaie rendue"],
      calcNumbers: [pay, n, p],
      tiles: [`${n} ${m[3]}`, `${fmt(p)} FCFA la pièce`, `${fmt(pay)} FCFA donnés`],
      child: m[1],
      problem: all(ok(inRange(n, BUY_COUNT[level]) && BUY_PRICES[level].includes(p), `${n} à ${p}`), ok(pay === larger && pay - n * p >= 25, `billet ${pay} pour ${n * p}`)),
    };
  }
  m = /^Il y a (\d+) (sacs|boîtes|paniers) de (\d+) (billes|bonbons|crayons|mangues) et (\d+) (billes|bonbons|crayons|mangues) à côté\./.exec(prompt);
  if (m) {
    const [n, size, x] = [Number(m[1]), Number(m[3]), Number(m[5])];
    return {
      ...base,
      scenario: "paquets",
      ops: 2,
      ordered: true,
      text: m[0],
      value: n * size + x,
      unit: m[4],
      question: `Combien de ${m[4]} en tout ?`,
      goal: "le total",
      first: `Combien de ${m[4]} y a-t-il dans les ${m[2]} ?`,
      steps: [`Calcule les ${m[4]} des ${m[2]}`, `Ajoute les ${m[4]} à côté`],
      calcNumbers: [n, size, x],
      tiles: [`${n} ${m[2]}`, `${size} ${m[4]} par ${ONE_OF[m[2]]}`, `${x} ${m[4]} à côté`],
      problem: all(ok(m[4] === m[6], "deux choses"), ok(inRange(n, BUNDLE_COUNT[level]) && inRange(size, BUNDLE_SIZE[level]) && inRange(x, BUNDLE_LOOSE[level]), `${n} de ${size} et ${x}`)),
    };
  }
  m = new RegExp(`^${name} a (\\d+) (billes|images|timbres|jetons)\\. (Il|Elle) en perd (\\d+), puis en gagne (\\d+)\\.`, "u").exec(prompt);
  if (m) {
    const [a, b, c] = [Number(m[2]), Number(m[5]), Number(m[6])];
    return {
      ...base,
      scenario: "billes",
      ops: 2,
      ordered: true,
      text: m[0],
      value: a - b + c,
      unit: m[3],
      question: `Combien en a-t-${m[4].toLowerCase()} maintenant ?`,
      goal: "le nombre final",
      first: `Combien de ${m[3]} reste-t-il après la perte ?`,
      steps: [stepsLost, "Ajoute ce qui est gagné"],
      calcNumbers: [a, b, c],
      tiles: [`${a} ${m[3]} au début`, `${b} ${m[3]} en moins`, `${c} ${m[3]} en plus`],
      child: m[1],
      problem: all(ok(inRange(a, START_COUNT[level]) && inRange(b, [3, Math.floor(a / 3)]) && inRange(c, [3, Math.floor(a / 3)]), `${a} - ${b} + ${c}`), ok((m[4] === "Elle") === GIRLS.includes(m[1]), `« ${m[1]} » avec « ${m[4]} »`)),
    };
  }
  m = new RegExp(`^${name} a (\\d+) (billes|images|timbres|jetons)\\. (Il|Elle) en perd (\\d+), en gagne (\\d+), puis en donne (\\d+)\\.`, "u").exec(prompt);
  if (m) {
    const [a, b, c, d] = [Number(m[2]), Number(m[5]), Number(m[6]), Number(m[7])];
    const step = Math.max(3, Math.floor(a / 5));
    return {
      ...base,
      scenario: "billes3",
      ops: 3,
      ordered: true,
      text: m[0],
      value: a - b + c - d,
      unit: m[3],
      question: `Combien en a-t-${m[4].toLowerCase()} maintenant ?`,
      goal: "le nombre final",
      first: `Combien de ${m[3]} reste-t-il après la perte ?`,
      steps: [stepsLost, "Ajoute ce qui est gagné", "Retire ce qui est donné"],
      calcNumbers: [a, b, c, d],
      tiles: [`${a} ${m[3]} au début`, `${b} ${m[3]} en moins`, `${c} ${m[3]} en plus`, `${d} ${m[3]} donnés`],
      child: m[1],
      problem: all(ok(inRange(a, START_COUNT[level]) && inRange(b, [2, step]) && inRange(c, [2, step]) && inRange(d, [2, step]) && a - b + c - d >= 1, `${a} - ${b} + ${c} - ${d}`), ok((m[4] === "Elle") === GIRLS.includes(m[1]), `« ${m[1]} » avec « ${m[4]} »`)),
    };
  }
  m = /^(\d+) (bonbons|biscuits|gâteaux|beignets) sont partagés entre (\d+) enfants\. Chacun en mange (\d+)\./.exec(prompt);
  if (m) {
    const [total, k, e] = [Number(m[1]), Number(m[3]), Number(m[4])];
    const q = total / k;
    return {
      ...base,
      scenario: "partage",
      ops: 2,
      ordered: true,
      text: m[0],
      value: q - e,
      unit: m[2],
      question: "Combien en reste-t-il à chacun ?",
      goal: "ce qui reste",
      first: `Combien de ${m[2]} chacun reçoit-il ?`,
      steps: [`Partage les ${m[2]} entre les enfants`, "Retire ce que chacun mange"],
      calcNumbers: [total, k, e],
      tiles: [`${total} ${m[2]}`, `${k} enfants`, `${e} ${m[2]} mangés`],
      problem: ok(Number.isInteger(q) && inRange(k, SHARE_KIDS[level]) && inRange(q, SHARE_EACH[level]) && e >= 1 && e <= q - 2, `${total} entre ${k}, ${e} mangés`),
    };
  }
  m = /^Un vendeur a (\d+) (mangues|oranges|œufs), puis en reçoit (\d+)\. Il les range par (paniers|cageots|boîtes) de (\d+)\./.exec(prompt);
  if (m) {
    const [a, b, k] = [Number(m[1]), Number(m[3]), Number(m[5])];
    const stock = STOCK_OF[m[2]];
    const total = a + b;
    return {
      ...base,
      scenario: "rangement",
      ops: 2,
      ordered: true,
      text: m[0],
      value: total / k,
      unit: m[4],
      question: `Combien de ${m[4]} remplit-il ?`,
      goal: `les ${m[4]}`,
      first: `Combien de ${m[2]} le vendeur a-t-il en tout ?`,
      steps: [`Additionne tous les ${m[2]}`, `Partage le total en ${m[4]}`],
      calcNumbers: [a, b, k],
      tiles: [`${a} ${m[2]} au début`, `${b} ${m[2]} en plus`, `${k} ${m[2]} par ${stock.one}`],
      problem: all(ok(stock.many === m[4], `« ${m[4]} » pour ${m[2]}`), ok(total % k === 0 && [4, 5, 6, 8, 10].includes(k) && inRange(total / k, BOX_COUNT[level]), `${total} par ${k}`), ok(a >= Math.floor(total / 3) && a <= Math.floor((2 * total) / 3) && b >= 1, `${a} et ${b}`)),
    };
  }
  m = /^Un car doit faire (\d+) km\. Il roule (\d+) km, puis (\d+) km\./.exec(prompt);
  if (m) {
    const [t, a, b] = [Number(m[1]), Number(m[2]), Number(m[3])];
    return {
      ...base,
      scenario: "route",
      ops: 2,
      ordered: true,
      text: m[0],
      value: t - a - b,
      unit: "km",
      question: "Combien de kilomètres lui reste-t-il ?",
      goal: "les kilomètres restants",
      first: "Combien de kilomètres a-t-il déjà faits ?",
      steps: ["Additionne les kilomètres déjà faits", "Retire-les du trajet total"],
      calcNumbers: [t, a, b],
      tiles: [`${t} km à faire`, `${a} km d'abord`, `${b} km ensuite`],
      problem: all(ok(inRange(t, TRIP_TOTAL[level]), `trajet ${t}`), ok(a >= Math.ceil(t * 0.2) && a <= Math.floor(t * 0.4) && b >= Math.ceil(t * 0.15) && b <= Math.floor(t * 0.3), `${a} et ${b} sur ${t}`), ok(t - a - b > 0, "il reste des kilomètres")),
    };
  }
  m = /^Un garage a (\d+) voitures et (\d+) motos\. Une voiture a 4 roues et une moto 2 roues\./.exec(prompt);
  if (m) {
    const [n, k] = [Number(m[1]), Number(m[2])];
    return {
      ...base,
      scenario: "roues",
      ops: 3,
      ordered: false,
      text: m[0],
      value: 4 * n + 2 * k,
      unit: "roues",
      question: "Combien de roues en tout ?",
      goal: "le nombre de roues",
      first: "",
      steps: [],
      calcNumbers: [n, 4, k, 2],
      tiles: [`${n} voitures`, `${k} motos`, "4 roues par voiture", "2 roues par moto"],
      problem: ok(inRange(n, CARS[level]) && inRange(k, BIKES[level]), `${n} voitures et ${k} motos`),
    };
  }
  return null;
}

const parsed = (exo: Exo): Story | string => parseStory(exo.prompt, levelOf(exo)) ?? `histoire inconnue : ${exo.prompt}`;
const problemChecks = (story: Story, exo: Exo, keep: (story: Story) => boolean, why: string): (string | null)[] => [
  story.problem,
  ok(SCENARIOS_BY_LEVEL[levelOf(exo)].includes(story.scenario), `le scénario ${story.scenario} au palier ${levelOf(exo)}`),
  ok(keep(story), why),
  ok(story.child === null || NAMES.includes(story.child), `prénom inconnu : ${story.child}`),
];

const resultCheck =
  (keep: (story: Story) => boolean, why: string): Check =>
  (exo) => {
    const story = parsed(exo);
    if (typeof story === "string") return story;
    return all(
      ...problemChecks(story, exo, keep, why),
      ok(exo.prompt === `${story.text} ${story.question}`, `énoncé : ${exo.prompt}`),
      ok(rightOption(exo) === `${fmt(story.value)} ${story.unit}`, `${exo.prompt} : ${rightOption(exo)}, pas ${fmt(story.value)} ${story.unit}`),
      ok(story.value >= 1, "un résultat positif"),
      ok(wrongOf(exo).every((option) => option.endsWith(` ${story.unit}`)), "même unité pour tous les choix"),
      ok(story.unit !== "FCFA" || wrongOf(exo).every((option) => num(option.replace(" FCFA", "")) % 25 === 0), "des prix en multiples de vingt-cinq"),
    );
  };

const checkPbTwo = resultCheck((story) => story.ops === 2, "deux opérations");
const checkPbThree = resultCheck((story) => story.ops === 3, "trois opérations");

const checkPbWrite: Check = (exo) => {
  const story = parsed(exo);
  if (typeof story === "string") return story;
  return all(
    ...problemChecks(story, exo, () => true, ""),
    ok(exo.prompt === `${story.text} ${story.question} Écris le nombre.`, `énoncé : ${exo.prompt}`),
    ok(acceptedOf(exo).length === 1 && acceptedOf(exo)[0] === String(story.value), `${exo.prompt} : ${acceptedOf(exo)}, pas ${story.value}`),
  );
};

const IRRELEVANT = ["Quelle heure est-il ?", "Quel temps fait-il ?"];

const checkPbFirst: Check = (exo) => {
  const story = parsed(exo);
  if (typeof story === "string") return story;
  return all(
    ...problemChecks(story, exo, (s) => s.ordered, "l'ordre des calculs n'est pas imposé"),
    ok(exo.prompt === `${story.text} Pour trouver ${story.goal}, que faut-il chercher en premier ?`, `énoncé : ${exo.prompt}`),
    ok(rightOption(exo) === story.first, `${exo.prompt} : ${rightOption(exo)}, pas ${story.first}`),
    ok(optionsOf(exo).includes(story.question), "la question finale est un choix"),
    ok(wrongOf(exo).filter((option) => IRRELEVANT.includes(option)).length === 1, "une question sans rapport est un choix"),
    ok(rightOption(exo) !== story.question, "la question finale n'est pas la bonne réponse"),
  );
};

const checkPbCalc: Check = (exo) => {
  const story = parsed(exo);
  if (typeof story === "string") return story;
  const right = rightOption(exo);
  return all(
    ...problemChecks(story, exo, (s) => s.scenario !== "roues", "les roues n'ont pas de calcul à ordre imposé"),
    ok(exo.prompt === `${story.text} Quel calcul donne ${story.goal} ?`, `énoncé : ${exo.prompt}`),
    ok(evaluate(right) === story.value, `${right} vaut ${evaluate(right)}, pas ${story.value}`),
    ok(JSON.stringify([...numbersIn(right)].sort((a, b) => a - b)) === JSON.stringify([...story.calcNumbers].sort((a, b) => a - b)), `les nombres de ${right} ne sont pas ceux de l'énoncé`),
    ...wrongOf(exo).map((option) => ok(Math.abs(evaluate(option) - story.value) > 1e-9, `« ${option} » vaut aussi ${story.value}`)),
    ok(new Set(optionsOf(exo).map((option) => evaluate(option))).size === 3, "trois calculs de valeurs différentes"),
  );
};

const checkPbUseless: Check = (exo) => {
  const story = parsed(exo);
  if (typeof story === "string") return story;
  const rest = exo.prompt.slice(story.text.length + 1);
  const age = story.child === null ? null : new RegExp(`^(Il|Elle) a (\\d+) ans\\. ${escapeRe(story.question)} Quelle donnée est inutile \\?$`).exec(rest);
  const weather = story.child === null ? rest === `Il fait chaud. ${story.question} Quelle donnée est inutile ?` : false;
  return all(
    ...problemChecks(story, exo, (s) => s.scenario !== "roues", "pas de donnée inutile pour les roues"),
    ok(story.child === null ? weather === true : age !== null, `énoncé : ${exo.prompt}`),
    ok(age === null || (age[1] === "Elle") === GIRLS.includes(story.child as string), "le pronom de l'âge"),
    ok(age === null || (Number(age[2]) >= 7 && Number(age[2]) <= 11 && rightOption(exo) === `${age[2]} ans`), `${exo.prompt} : ${rightOption(exo)}`),
    ok(age !== null || rightOption(exo) === "Il fait chaud", `${exo.prompt} : ${rightOption(exo)}`),
    ok(wrongOf(exo).every((option) => story.tiles.includes(option)), `un mauvais choix n'est pas une donnée du problème : ${wrongOf(exo).join(" | ")}`),
    ok(optionsOf(exo).every((option) => option.length < 24), "un choix de vingt-quatre caractères se devinerait à sa longueur"),
  );
};

const checkPbOrder: Check = (exo) => {
  const story = parsed(exo);
  if (typeof story === "string") return story;
  return all(
    ...problemChecks(story, exo, (s) => s.ordered, "l'ordre des calculs n'est pas imposé"),
    ok(exo.prompt === `${story.text} Mets les étapes dans l'ordre.`, `énoncé : ${exo.prompt}`),
    ok(JSON.stringify(sequenceOf(exo)) === JSON.stringify(["Lis l'énoncé", ...story.steps, "Vérifie la réponse"]), `suite : ${sequenceOf(exo).join(" | ")}`),
  );
};

const checkPbLinks: Check = (exo) => {
  const pairs = pairsOf(exo);
  const scenarios = new Set<string>();
  return all(
    ok(pairs.length === 3, "trois paires"),
    ok(exo.prompt === "Relie chaque problème à son calcul.", exo.prompt),
    ...pairs.map((pair) => {
      const story = parseStory(pair.left, levelOf(exo));
      if (!story) return `histoire inconnue : ${pair.left}`;
      scenarios.add(story.scenario);
      return all(
        ...problemChecks(story, exo, (s) => s.ops === 2, "deux opérations"),
        ok(pair.left === `${story.text} ${story.question}`, `tuile : ${pair.left}`),
        ok(evaluate(pair.right) === story.value, `${pair.right} vaut ${evaluate(pair.right)}, pas ${story.value}`),
        ok(JSON.stringify([...numbersIn(pair.right)].sort((a, b) => a - b)) === JSON.stringify([...story.calcNumbers].sort((a, b) => a - b)), `les nombres de ${pair.right}`),
      );
    }),
    ok(scenarios.size === 3, "trois scénarios différents"),
  );
};

const checkPbSort: Check = (exo) => {
  const level = levelOf(exo);
  const items = itemsOf(exo);
  const oneStep = items.filter((item) => item.correctZone === "Un seul calcul");
  const twoStep = items.filter((item) => item.correctZone === "Deux calculs");
  const classify = (text: string): string | null => {
    let m = /^(\S+) a (\d+) billes et en gagne (\d+)\. Combien en a-t-(il|elle) \?$/.exec(text);
    if (m) return ok((m[4] === "elle") === GIRLS.includes(m[1]) && NAMES.includes(m[1]) && inRange(Number(m[2]), [12, 400]), text) ?? "Un seul calcul";
    m = /^Il y a (\d+) mangues\. On en vend (\d+)\. Combien en reste-t-il \?$/.exec(text);
    if (m) return ok(Number(m[2]) < Number(m[1]), text) ?? "Un seul calcul";
    m = /^(\d) paniers contiennent (\d) oranges chacun\. Combien d'oranges en tout \?$/.exec(text);
    if (m) return ok(inRange(Number(m[1]), [3, 9]) && inRange(Number(m[2]), [3, 9]), text) ?? "Un seul calcul";
    m = /^(\d+) crayons sont rangés dans (\d) boîtes égales\. Combien de crayons dans chaque boîte \?$/.exec(text);
    if (m) return ok(Number(m[1]) % Number(m[2]) === 0 && Number(m[1]) / Number(m[2]) >= 3 && Number(m[1]) / Number(m[2]) <= 9, text) ?? "Un seul calcul";
    const story = parseStory(text, level);
    if (story && story.ops === 2 && text === `${story.text} ${story.question}` && story.problem === null) return "Deux calculs";
    return null;
  };
  return all(
    ok(same(zonesOf(exo), ["Un seul calcul", "Deux calculs"]), `cases inattendues : ${zonesOf(exo).join(", ")}`),
    ...items.map((item) => ok(classify(item.text) === item.correctZone, `« ${item.text} » dans « ${item.correctZone} »`)),
    ok(level <= 2 ? oneStep.length === 2 && twoStep.length === 2 : items.length === 5 && oneStep.length >= 2 && twoStep.length >= 2, `${oneStep.length} et ${twoStep.length} étiquettes`),
  );
};

const CHECK_FORMS: Record<GameLevel, string[]> = { 1: ["add", "sub"], 2: ["add", "sub"], 3: ["mul", "sub"], 4: ["mul", "div", "sub"] };
const CHECK_A: Record<GameLevel, readonly [number, number]> = { 1: [20, 80], 2: [120, 450], 3: [150, 600], 4: [400, 900] };
const CHECK_B: Record<GameLevel, readonly [number, number]> = { 1: [10, 60], 2: [80, 380], 3: [60, 400], 4: [120, 380] };
const CHECK_FACTOR: Record<GameLevel, readonly [number, number]> = { 1: [2, 5], 2: [2, 6], 3: [12, 49], 4: [25, 99] };

const checkPbCheck: Check = (exo) => {
  const level = levelOf(exo);
  const m = new RegExp(`^(\\S+) calcule (${NUMBER}) ([+−×÷]) (${NUMBER}) = (${NUMBER})\\. Quel calcul permet de vérifier son résultat \\?$`).exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const [x, op, y, z] = [num(m[2]), m[3], num(m[4]), num(m[5])];
  const truth = op === "+" ? x + y : op === "−" ? x - y : op === "×" ? x * y : x / y;
  const form = op === "+" ? "add" : op === "−" ? "sub" : op === "×" ? "mul" : "div";
  const numbers = [x, y, z];
  const rangeProblem =
    form === "add"
      ? ok(inRange(x, CHECK_A[level]) && inRange(y, CHECK_B[level]), `${x} + ${y}`)
      : form === "sub"
        ? ok(inRange(y, CHECK_B[level]) && inRange(x - y, CHECK_A[level]), `${x} − ${y}`)
        : form === "mul"
          ? ok(inRange(x, CHECK_FACTOR[level]) && inRange(y, [3, 9]), `${x} × ${y}`)
          : ok(inRange(z, CHECK_FACTOR[level]) && inRange(y, [3, 9]) && x % y === 0, `${x} ÷ ${y}`);
  return all(
    ok(NAMES.includes(m[1]), `prénom inconnu : ${m[1]}`),
    ok(truth === z, `${exo.prompt} : l'égalité est fausse`),
    ok(CHECK_FORMS[level].includes(form), `la forme ${form} au palier ${level}`),
    rangeProblem,
    // Le bon calcul retrouve un des deux nombres du calcul de départ (pas son résultat : « 134 + 98 » redit l'égalité sans la vérifier) ; aucun mauvais choix ne retrouve un nombre de l'égalité.
    ok([x, y].includes(evaluate(rightOption(exo))), `${rightOption(exo)} vaut ${evaluate(rightOption(exo))}, qui n'est ni ${x} ni ${y}`),
    ...wrongOf(exo).map((option) => ok(!numbers.includes(evaluate(option)), `« ${option} » vérifierait aussi (${evaluate(option)})`)),
    ok(optionsOf(exo).every((option) => /^\d[\d ]* [+−×÷] \d[\d ]*$/.test(option)), "des calculs à une opération"),
  );
};

const CHECKS: Record<string, Check> = {
  "ce2-sym-axe": checkSymAxis,
  "ce2-sym-miroir": checkSymMirror,
  "ce2-sym-solide": checkSymSolid,
  "ce2-sym-trou": checkSymGap,
  "ce2-sym-relier": checkSymLinks,
  "ce2-sym-glisser": checkSymSort,
  "ce2-sym-etapes": checkSymSteps,
  "ce2-sym-ecrire": checkSymWrite,
  "ce2-per-carre": checkPerSquare,
  "ce2-per-rectangle": checkPerRectangle,
  "ce2-per-cote": checkPerSide,
  "ce2-per-aire": checkPerArea,
  "ce2-per-comparer": checkPerCompare,
  "ce2-per-trou": checkPerGap,
  "ce2-per-ecrire": checkPerWrite,
  "ce2-per-relier": checkPerLinks,
  "ce2-per-glisser": checkPerSort,
  "ce2-per-probleme": checkPerProblem,
  "ce2-mes-convertir": checkMesConvert,
  "ce2-mes-ecrire": checkMesWrite,
  "ce2-mes-trou": checkMesGap,
  "ce2-mes-comparer": checkMesCompare,
  "ce2-mes-ranger": checkMesOrder,
  "ce2-mes-unite": checkMesUnit,
  "ce2-mes-relier": checkMesLinks,
  "ce2-mes-glisser": checkMesSort,
  "ce2-mes-duree": checkMesDuration,
  "ce2-mes-probleme": checkMesProblem,
  "ce2-pb-deux": checkPbTwo,
  "ce2-pb-trois": checkPbThree,
  "ce2-pb-ecrire": checkPbWrite,
  "ce2-pb-question": checkPbFirst,
  "ce2-pb-operation": checkPbCalc,
  "ce2-pb-utile": checkPbUseless,
  "ce2-pb-ordre": checkPbOrder,
  "ce2-pb-relier": checkPbLinks,
  "ce2-pb-glisser": checkPbSort,
  "ce2-pb-verifier": checkPbCheck,
};

const KINDS = Object.keys(CHECKS) as GameKind[];
const TOPIC_KINDS: Record<string, string[]> = {
  "ma-ce2-symetrie": ["pixel-symetrie", ...["axe", "miroir", "solide", "trou", "relier", "glisser", "etapes", "ecrire"].map((k) => `ce2-sym-${k}`)],
  "ma-ce2-perimetre-aire": ["carre", "rectangle", "cote", "aire", "comparer", "trou", "ecrire", "relier", "glisser", "probleme"].map((k) => `ce2-per-${k}`),
  "ma-ce2-mesures": ["convertir", "ecrire", "trou", "comparer", "ranger", "unite", "relier", "glisser", "duree", "probleme"].map((k) => `ce2-mes-${k}`),
  "ma-ce2-problemes": ["deux", "trois", "ecrire", "question", "operation", "utile", "ordre", "relier", "glisser", "verifier"].map((k) => `ce2-pb-${k}`),
};
const TOPIC_KEYS = Object.keys(TOPIC_KINDS);
const entryOf = (key: string) => allProgrammeEntries().find((entry) => entry.topic.key === key)!;
const topicOf = (key: string) => entryOf(key).topic;

describe("chaque gabarit de mathématiques du CE2 (seconde moitié) a sa vérification", () => {
  it("couvre exactement les trente-huit gabarits, tous rangés dans une thématique", () => {
    expect(KINDS).toHaveLength(38);
    expect([...new Set(Object.values(TOPIC_KINDS).flat().filter((kind) => kind !== "pixel-symetrie"))].sort()).toEqual([...KINDS].sort());
    for (const kind of KINDS) expect(Object.keys(GAME_KINDS), kind).toContain(kind);
  });
});

describe("l'évaluateur d'expressions du test", () => {
  it("applique les priorités, les parenthèses et lit les nombres à espaces", () => {
    expect(evaluate("1 000 − 3 × 250")).toBe(250);
    expect(evaluate("(27 + 33) ÷ 10")).toBe(6);
    expect(evaluate("27 + 33 ÷ 10")).toBeCloseTo(30.3);
    expect(evaluate("5 000 − 7 × 425")).toBe(2025);
    expect(evaluate("180 − 5 + 5 − 15")).toBe(165);
    expect(evaluate("8 × (3 + 4)")).toBe(56);
  });
});

describe("les gabarits de mathématiques du CE2 (seconde moitié) recalculent juste, depuis des tables et une arithmétique écrites à part", () => {
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

  it("voient aussi un énoncé abîmé : un périmètre pris pour une aire, une conversion fausse, un calcul de vérification qui ne vérifie rien, une heure de fin trop tôt", () => {
    const qcm = (prompt: string, options: string[], correctIndex: number, level: number) =>
      ({ type: "qcm", prompt, answerKey: options[correctIndex], hints: [], payload: { options, correctIndex, game: { kind: "x", level } } }) as Exo;
    expect(CHECKS["ce2-per-rectangle"](qcm("Un rectangle mesure 8 cm de long et 5 cm de large. Quel est son périmètre ?", ["26 cm", "40 cm", "13 cm"], 0, 3))).toBeNull();
    expect(CHECKS["ce2-per-rectangle"](qcm("Un rectangle mesure 8 cm de long et 5 cm de large. Quel est son périmètre ?", ["26 cm", "40 cm", "13 cm"], 1, 3))).not.toBeNull();
    expect(CHECKS["ce2-mes-convertir"](qcm("Convertis 3 m en centimètres.", ["300 cm", "30 cm", "3 000 cm"], 0, 1))).toBeNull();
    expect(CHECKS["ce2-mes-convertir"](qcm("Convertis 3 m en centimètres.", ["300 cm", "30 cm", "3 000 cm"], 1, 1))).not.toBeNull();
    expect(CHECKS["ce2-mes-convertir"](qcm("Convertis 3 m en décimètres.", ["30 dm", "300 dm", "3 dm"], 0, 1))).not.toBeNull();
    expect(CHECKS["ce2-pb-verifier"](qcm("Awa calcule 134 + 98 = 232. Quel calcul permet de vérifier son résultat ?", ["232 − 98", "232 + 98", "134 − 98"], 0, 2))).toBeNull();
    expect(CHECKS["ce2-pb-verifier"](qcm("Awa calcule 134 + 98 = 232. Quel calcul permet de vérifier son résultat ?", ["232 − 134", "232 − 98", "232 + 98"], 0, 2))).not.toBeNull();
    expect(CHECKS["ce2-pb-verifier"](qcm("Awa calcule 134 + 98 = 232. Quel calcul permet de vérifier son résultat ?", ["232 − 98", "232 + 98", "134 − 98"], 1, 2))).not.toBeNull();
    expect(CHECKS["ce2-mes-duree"](qcm("Un film commence à 15 h 20 et dure 1 h 45 min. À quelle heure finit-il ?", ["17 h 05", "16 h 05", "17 h 15"], 0, 4))).toBeNull();
    expect(CHECKS["ce2-mes-duree"](qcm("Un film commence à 15 h 20 et dure 1 h 45 min. À quelle heure finit-il ?", ["17 h 05", "16 h 05", "17 h 15"], 1, 4))).not.toBeNull();
    expect(CHECKS["ce2-sym-axe"](qcm("Combien d'axes de symétrie a un carré ?", ["4", "2", "1"], 0, 1))).toBeNull();
    expect(CHECKS["ce2-sym-axe"](qcm("Combien d'axes de symétrie a un carré ?", ["4", "2", "1"], 1, 1))).not.toBeNull();
    expect(CHECKS["ce2-sym-axe"](qcm("Combien d'axes de symétrie a un rectangle de 6 cm sur 4 cm ?", ["4", "2", "1"], 0, 1))).not.toBeNull();
    expect(CHECKS["ce2-pb-deux"](qcm("Awa achète 3 pains à 100 FCFA pièce et paie 500 FCFA. Combien lui rend-on ?", ["200 FCFA", "400 FCFA", "300 FCFA"], 0, 2))).toBeNull();
    expect(CHECKS["ce2-pb-deux"](qcm("Awa achète 3 pains à 100 FCFA pièce et paie 500 FCFA. Combien lui rend-on ?", ["200 FCFA", "400 FCFA", "300 FCFA"], 1, 2))).not.toBeNull();
    expect(CHECKS["ce2-pb-deux"](qcm("Awa achète 3 pains à 100 FCFA pièce et paie 1 000 FCFA. Combien lui rend-on ?", ["700 FCFA", "400 FCFA", "300 FCFA"], 0, 2))).not.toBeNull();
    expect(CHECKS["ce2-per-comparer"](qcm("Le rectangle A mesure 6 carreaux sur 2. Le rectangle B mesure 4 carreaux sur 3. Lequel a la plus grande aire ?", ["Le rectangle A", "Le rectangle B", "Ils ont la même aire"], 2, 4))).toBeNull();
    expect(CHECKS["ce2-per-comparer"](qcm("Le rectangle A mesure 6 carreaux sur 2. Le rectangle B mesure 4 carreaux sur 3. Lequel a le plus grand périmètre ?", ["Le rectangle A", "Le rectangle B", "Ils ont le même périmètre"], 0, 4))).toBeNull();
    expect(CHECKS["ce2-per-comparer"](qcm("Le rectangle A mesure 6 carreaux sur 2. Le rectangle B mesure 4 carreaux sur 3. Lequel a le plus grand périmètre ?", ["Le rectangle A", "Le rectangle B", "Ils ont le même périmètre"], 2, 4))).not.toBeNull();
  });
});

// ===========================================================================
// LES RÈGLES COMMUNES
// ===========================================================================

describe("tous les gabarits de mathématiques du CE2 (seconde moitié)", () => {
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

  it("n'écrivent aucun émoji, ni dans un énoncé, ni sur une tuile, ni dans un indice, et aucun sélecteur de variation", () => {
    const selector = String.fromCodePoint(0xfe0f);
    for (const { kind, exo } of exos) {
      expect(/\p{Extended_Pictographic}/u.test(exo.prompt), `${kind} : ${exo.prompt}`).toBe(false);
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
      const a = GAME_KINDS[kind].make(makeContext("CE2", 3, "graine"));
      const b = GAME_KINDS[kind].make(makeContext("CE2", 3, "graine"));
      expect(a).toEqual(b);
      expect(a.hints).toHaveLength(3);
      expect(new Set(a.hints).size, kind).toBe(3);
    }
  });

  it("passent le contrôleur au CE2 sans aucun défaut, à tous les niveaux", () => {
    for (const { kind, exo } of exos) {
      const defects = auditExercise({
        type: GAME_KINDS[kind].type,
        prompt: exo.prompt,
        payload: exo.payload,
        answerKey: exo.answerKey,
        hints: exo.hints,
        class: "CE2",
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

  it("n'écrivent jamais cm² ni m² : l'aire se compte en carreaux", () => {
    for (const { kind, exo } of exos) for (const text of [exo.prompt, ...texts(exo)]) expect(text, `${kind} : « ${text} »`).not.toMatch(/²/);
  });
});

// ===========================================================================
// LES THÉMATIQUES DU PROGRAMME
// ===========================================================================

describe("les quatre thématiques de mathématiques du CE2 (seconde moitié)", () => {
  it("remplissent les dix places du palier, avec des jeux connus, sans appeler le modèle", () => {
    for (const key of TOPIC_KEYS) {
      const specs = topicOf(key).games ?? [];
      expect(specs.reduce((sum, spec) => sum + spec.count, 0), key).toBe(PALIER_SIZE);
      expect([...new Set(specs.map((spec) => spec.kind as string))].sort(), key).toEqual([...TOPIC_KINDS[key]].sort());
      for (const spec of specs) expect(Object.keys(GAME_KINDS), `${key} : ${spec.kind}`).toContain(spec.kind);
      expect(topicUsesModel(key), key).toBe(false);
    }
  });

  it("sont celles du CE2, à quatre paliers, et gardent leur clé", () => {
    for (const key of TOPIC_KEYS) {
      expect(entryOf(key).klass, key).toBe("CE2");
      expect(topicOf(key).palierCount, key).toBeUndefined();
    }
    expect(TOPIC_KEYS).toHaveLength(4);
  });

  it("fabriquent des paliers entiers, de dix exercices, qui passent le contrôleur et la règle, aux quatre paliers", () => {
    for (const key of TOPIC_KEYS) {
      for (let n = 0; n < 30; n++) {
        for (const palierIndex of [1, 2, 3, 4]) {
          const paliers = generateGames(topicOf(key).games ?? [], { klass: "CE2", palierIndex, palierCount: 4, seed: `${key}:${n}:${palierIndex}` });
          expect(paliers, `${key} palier ${palierIndex}`).toHaveLength(PALIER_SIZE);
          const questions = paliers.map((game) => `${game.prompt}|${JSON.stringify(game.payload)}`);
          expect(new Set(questions).size, `${key} #${n} palier ${palierIndex}`).toBe(questions.length);
          expect(new Set(paliers.map((game) => game.type)).size, `${key} palier ${palierIndex}`).toBeGreaterThanOrEqual(4);
          for (const game of paliers) {
            const defects = auditExercise({ type: game.type, prompt: game.prompt, payload: game.payload, answerKey: game.answerKey, hints: game.hints, class: "CE2", subject: "Mathématiques" });
            expect(defects, `${key} palier ${palierIndex} : ${game.prompt}`).toEqual([]);
            const kind = (game.payload.game as { kind: string }).kind;
            if (kind === "pixel-symetrie") continue;
            expect(CHECKS[kind](game as unknown as Exo), `${key} palier ${palierIndex} ${kind} : ${game.prompt} ${game.payload.text ?? ""}`).toBeNull();
          }
        }
      }
    }
  });

  it("ne posent pas deux fois la même histoire dans un palier de problèmes, ni deux fois le même scénario plus de trois fois sur dix", () => {
    for (let n = 0; n < 120; n++) {
      for (const palierIndex of [1, 2, 3, 4] as GameLevel[]) {
        const paliers = generateGames(topicOf("ma-ce2-problemes").games ?? [], { klass: "CE2", palierIndex, palierCount: 4, seed: `histoires:${n}:${palierIndex}` });
        const stories = paliers.flatMap((game) => {
          if ((game.payload.game as { kind: string }).kind === "ce2-pb-verifier") return [];
          const story = parseStory(game.prompt, palierIndex);
          return story ? [`${story.scenario}|${story.calcNumbers.join(",")}`] : [];
        });
        expect(new Set(stories).size, `palier ${palierIndex} : ${stories.join(" ; ")}`).toBe(stories.length);
        const perScenario = new Map<string, number>();
        for (const story of stories) perScenario.set(story.split("|")[0], (perScenario.get(story.split("|")[0]) ?? 0) + 1);
        expect(Math.max(...perScenario.values()), `palier ${palierIndex} : ${[...perScenario].join(" ; ")}`).toBeLessThanOrEqual(3);
      }
    }
  });
});
