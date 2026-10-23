import { describe, expect, it, vi } from "vitest";
import { auditExercise } from "../paliers/exerciseAudit";
import { GAME_KINDS, generateGames, regenerateGame, type GameKind } from "../paliers/games";
import { makeContext, type GameLevel } from "../paliers/games/shared";
import { topicUsesModel } from "../paliers/pregen";
import { allProgrammeEntries } from "../programme";
import { PALIER_SIZE } from "../paliers/scoring";

// Ces tests jouent des milliers de tirages : sur le serveur de CI, chargé, l'un d'eux dépasse les 5 secondes par défaut.
vi.setConfig({ testTimeout: 60_000 });

/**
 * LE FRANÇAIS DU CE2, PREMIÈRE MOITIÉ : COD, COI et pronoms ; compléments circonstanciels, phrase nominale et articles ; possessifs et
 * démonstratifs ; imparfait et passé composé ; impératif et futur simple (`fr-ce2-cod-coi`, `fr-ce2-cc`, `fr-ce2-determinants`,
 * `fr-ce2-imparfait`, `fr-ce2-imperatif-futur`).
 *
 * Ces tests ne relisent pas les tableaux des gabarits : ils RECALCULENT chaque réponse depuis l'énoncé, avec leur propre grammaire.
 * - Une petite grammaire de phrase (sujet, verbe, complément direct, compléments avec préposition) trouve le COD et le COI, le pronom qui remplace
 *   un complément (le, la, les, lui, leur), la question qui le trouve.
 * - Un lexique des compléments dit si un groupe de mots répond à où, à quand ou à comment.
 * - Un lexique des noms (genre, nombre, voyelle) dit quel possessif (mon, ma, mes… leur, leurs) et quel démonstratif (ce, cet, cette, ces) va devant.
 * - Une table de conjugaison écrite à part (présent, imparfait, futur, impératif, participe, de trente-sept verbes) dit la forme juste, le temps
 *   d'une phrase, et si un mauvais choix est bien une forme que la personne ou le temps interdit.
 * À la fin, des MUTATIONS : on abîme la bonne réponse d'un exercice juste, puis son énoncé, et chaque vérification doit le voir.
 * L'échantillon du modèle comptait 22 exercices faux ou creux sur 36 en français du CE2 (« Aminata va à le marché », « Place les verbes : fais,
 * Prendre, voir », « Les arbres dansent dans le vent », « Hier, je. »).
 */

const LEVELS: GameLevel[] = [1, 2, 3, 4];
const draws = LEVELS.flatMap((level) => Array.from({ length: 60 }, (_, n) => ({ level, seed: `ce2fr:${level}:${n}` })));
const make = (kind: GameKind, d: (typeof draws)[number]) => GAME_KINDS[kind].make(makeContext("CE2", d.level, `${kind}:${d.seed}`));

type Exo = { type?: string; prompt: string; answerKey: string; hints: string[]; payload: Record<string, unknown> };
const optionsOf = (exo: Exo) => exo.payload.options as string[];
const rightOption = (exo: Exo) => optionsOf(exo)[exo.payload.correctIndex as number];
const itemsOf = (exo: Exo) => exo.payload.items as { text: string; correctZone: string }[];
const zonesOf = (exo: Exo) => exo.payload.zones as string[];
const sequenceOf = (exo: Exo) => exo.payload.correctSequence as string[];
const pairsOf = (exo: Exo) => exo.payload.pairs as { left: string; right: string }[];
const blankOf = (exo: Exo) => (exo.payload.blanks as { options: string[]; answer: string }[])[0];
const textOf = (exo: Exo) => String(exo.payload.text);
const acceptedOf = (exo: Exo) => exo.payload.acceptedAnswers as string[];

const fold = (text: string) => text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
const apostrophes = (text: string) => (text.match(/'/g) ?? []).length;
const wordCount = (text: string) => text.split(/\s+/).filter((token) => /[\p{L}\p{N}]/u.test(token)).length;
const sameSeq = (a: readonly string[], b: readonly string[]) => JSON.stringify(a) === JSON.stringify(b);
const VS16 = String.fromCharCode(0xfe0f);
/** Les mots d'une phrase, en minuscules, accents gardés : « à » reste « à » (« a » est le verbe avoir). */
const wordsOf = (text: string): string[] => text.toLowerCase().replace(/’/g, "'").match(/[\p{L}]+(?:-[\p{L}]+)*'?/gu) ?? [];
const capitalise = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);

type Check = (exo: Exo) => string | null;
const ok = (condition: boolean, message: string) => (condition ? null : message);
/** Le premier message d'erreur d'une suite de vérifications. */
const all = (...results: (string | null)[]) => results.find((result) => result !== null) ?? null;
/** Les choix d'un QCM sans la bonne réponse. */
const wrongOf = (exo: Exo) => optionsOf(exo).filter((option) => option !== rightOption(exo));
const wrongsAre = (exo: Exo, allowed: (option: string) => boolean, forbidden: string) =>
  ok(wrongOf(exo).length === 2 && wrongOf(exo).every((option) => option !== forbidden && allowed(option)), `mauvais choix ${wrongOf(exo).join(" | ")}`);
const quoted = (prompt: string, index = 1) => [...prompt.matchAll(/« ([^»]+) »/gu)].map((match) => match[1])[index - 1] ?? "";

// ===========================================================================
// LA CONJUGAISON : une table écrite à part, par personne (je, tu, il, nous, vous, ils)
// ===========================================================================

type Person = "1s" | "2s" | "3s" | "1p" | "2p" | "3p";
const PERSONS: readonly Person[] = ["1s", "2s", "3s", "1p", "2p", "3p"];
type Tense = "present" | "imparfait" | "futur";
type Verb = { present: string[]; imparfait: string[]; futur: string[]; participe: string; imperatif: [string, string, string] };

const IRREGULAR: Record<string, Verb> = {
  être: { present: ["suis", "es", "est", "sommes", "êtes", "sont"], imparfait: ["étais", "étais", "était", "étions", "étiez", "étaient"], futur: ["serai", "seras", "sera", "serons", "serez", "seront"], participe: "été", imperatif: ["sois", "soyons", "soyez"] },
  avoir: { present: ["ai", "as", "a", "avons", "avez", "ont"], imparfait: ["avais", "avais", "avait", "avions", "aviez", "avaient"], futur: ["aurai", "auras", "aura", "aurons", "aurez", "auront"], participe: "eu", imperatif: ["aie", "ayons", "ayez"] },
  aller: { present: ["vais", "vas", "va", "allons", "allez", "vont"], imparfait: ["allais", "allais", "allait", "allions", "alliez", "allaient"], futur: ["irai", "iras", "ira", "irons", "irez", "iront"], participe: "allé", imperatif: ["va", "allons", "allez"] },
  faire: { present: ["fais", "fais", "fait", "faisons", "faites", "font"], imparfait: ["faisais", "faisais", "faisait", "faisions", "faisiez", "faisaient"], futur: ["ferai", "feras", "fera", "ferons", "ferez", "feront"], participe: "fait", imperatif: ["fais", "faisons", "faites"] },
  voir: { present: ["vois", "vois", "voit", "voyons", "voyez", "voient"], imparfait: ["voyais", "voyais", "voyait", "voyions", "voyiez", "voyaient"], futur: ["verrai", "verras", "verra", "verrons", "verrez", "verront"], participe: "vu", imperatif: ["vois", "voyons", "voyez"] },
  prendre: { present: ["prends", "prends", "prend", "prenons", "prenez", "prennent"], imparfait: ["prenais", "prenais", "prenait", "prenions", "preniez", "prenaient"], futur: ["prendrai", "prendras", "prendra", "prendrons", "prendrez", "prendront"], participe: "pris", imperatif: ["prends", "prenons", "prenez"] },
  boire: { present: ["bois", "bois", "boit", "buvons", "buvez", "boivent"], imparfait: ["buvais", "buvais", "buvait", "buvions", "buviez", "buvaient"], futur: ["boirai", "boiras", "boira", "boirons", "boirez", "boiront"], participe: "bu", imperatif: ["bois", "buvons", "buvez"] },
  dire: { present: ["dis", "dis", "dit", "disons", "dites", "disent"], imparfait: ["disais", "disais", "disait", "disions", "disiez", "disaient"], futur: ["dirai", "diras", "dira", "dirons", "direz", "diront"], participe: "dit", imperatif: ["dis", "disons", "dites"] },
  venir: { present: ["viens", "viens", "vient", "venons", "venez", "viennent"], imparfait: ["venais", "venais", "venait", "venions", "veniez", "venaient"], futur: ["viendrai", "viendras", "viendra", "viendrons", "viendrez", "viendront"], participe: "venu", imperatif: ["viens", "venons", "venez"] },
  partir: { present: ["pars", "pars", "part", "partons", "partez", "partent"], imparfait: ["partais", "partais", "partait", "partions", "partiez", "partaient"], futur: ["partirai", "partiras", "partira", "partirons", "partirez", "partiront"], participe: "parti", imperatif: ["pars", "partons", "partez"] },
  finir: { present: ["finis", "finis", "finit", "finissons", "finissez", "finissent"], imparfait: ["finissais", "finissais", "finissait", "finissions", "finissiez", "finissaient"], futur: ["finirai", "finiras", "finira", "finirons", "finirez", "finiront"], participe: "fini", imperatif: ["finis", "finissons", "finissez"] },
  courir: { present: ["cours", "cours", "court", "courons", "courez", "courent"], imparfait: ["courais", "courais", "courait", "courions", "couriez", "couraient"], futur: ["courrai", "courras", "courra", "courrons", "courrez", "courront"], participe: "couru", imperatif: ["cours", "courons", "courez"] },
  vendre: { present: ["vends", "vends", "vend", "vendons", "vendez", "vendent"], imparfait: ["vendais", "vendais", "vendait", "vendions", "vendiez", "vendaient"], futur: ["vendrai", "vendras", "vendra", "vendrons", "vendrez", "vendront"], participe: "vendu", imperatif: ["vends", "vendons", "vendez"] },
  dormir: { present: ["dors", "dors", "dort", "dormons", "dormez", "dorment"], imparfait: ["dormais", "dormais", "dormait", "dormions", "dormiez", "dormaient"], futur: ["dormirai", "dormiras", "dormira", "dormirons", "dormirez", "dormiront"], participe: "dormi", imperatif: ["dors", "dormons", "dormez"] },
  ouvrir: { present: ["ouvre", "ouvres", "ouvre", "ouvrons", "ouvrez", "ouvrent"], imparfait: ["ouvrais", "ouvrais", "ouvrait", "ouvrions", "ouvriez", "ouvraient"], futur: ["ouvrirai", "ouvriras", "ouvrira", "ouvrirons", "ouvrirez", "ouvriront"], participe: "ouvert", imperatif: ["ouvre", "ouvrons", "ouvrez"] },
  entendre: { present: ["entends", "entends", "entend", "entendons", "entendez", "entendent"], imparfait: ["entendais", "entendais", "entendait", "entendions", "entendiez", "entendaient"], futur: ["entendrai", "entendras", "entendra", "entendrons", "entendrez", "entendront"], participe: "entendu", imperatif: ["entends", "entendons", "entendez"] },
};

/** Les verbes du premier groupe, calculés : le radical, ses terminaisons, et les trois cas à part (-ger, -cer, -yer). */
function regularEr(infinitive: string): Verb {
  const stem = infinitive.slice(0, -2);
  const soft = (ending: string) => {
    if (infinitive.endsWith("ger") && /^[aoâ]/u.test(ending)) return `${stem}e${ending}`;
    if (infinitive.endsWith("cer") && /^[aoâ]/u.test(ending)) return `${stem.slice(0, -1)}ç${ending}`;
    return `${stem}${ending}`;
  };
  const yer = infinitive.endsWith("yer");
  const strong = yer ? `${stem.slice(0, -1)}i` : stem;
  return {
    present: [`${strong}e`, `${strong}es`, `${strong}e`, soft("ons"), `${stem}ez`, `${strong}ent`],
    imparfait: ["ais", "ais", "ait", "ions", "iez", "aient"].map((ending) => soft(ending)),
    futur: ["ai", "as", "a", "ons", "ez", "ont"].map((ending) => `${strong}er${ending}`),
    participe: `${stem}é`,
    imperatif: [`${strong}e`, soft("ons"), `${stem}ez`],
  };
}

const ER_VERBS = ["jouer", "raconter", "nager", "marcher", "rester", "chanter", "écouter", "laver", "manger", "commencer", "crier", "aboyer", "sonner", "trouver", "gronder", "souffler", "acheter", "ranger", "copier", "lancer", "ramener"];
/** Des participes de verbes que seules les histoires emploient : prévenir, cuire, écrire, mettre, lire. */
const EXTRA_PARTICIPLES = ["prévenu", "cuit", "écrit", "mis", "lu"];
const conjugation = (infinitive: string): Verb => IRREGULAR[infinitive] ?? regularEr(infinitive);
const VERB_LIST = [...Object.keys(IRREGULAR), ...ER_VERBS];

const PERSON_OF_PRONOUN: Record<string, Person> = { je: "1s", "j'": "1s", tu: "2s", il: "3s", elle: "3s", on: "3s", nous: "1p", vous: "2p", ils: "3p", elles: "3p" };
const personIndex = (person: Person) => PERSONS.indexOf(person);
const formOf = (infinitive: string, tense: Tense, person: Person) => conjugation(infinitive)[tense][personIndex(person)];
/** Le passé composé avec avoir : les verbes des gabarits n'emploient jamais être. */
const AVOIR_PRESENT = IRREGULAR.avoir.present;
const composeOf = (infinitive: string, person: Person) => `${AVOIR_PRESENT[personIndex(person)]} ${conjugation(infinitive).participe}`;

const FORM_TENSES = new Map<string, Set<string>>();
const addForm = (form: string, tense: string) => FORM_TENSES.set(form, (FORM_TENSES.get(form) ?? new Set()).add(tense));
for (const infinitive of VERB_LIST) {
  const verb = conjugation(infinitive);
  for (const tense of ["present", "imparfait", "futur"] as const) for (const form of verb[tense]) addForm(form, tense);
  for (const form of verb.imperatif) addForm(form, "imperatif");
  addForm(verb.participe, "participe");
}
const PARTICIPLES = new Set([...VERB_LIST.map((infinitive) => conjugation(infinitive).participe), ...EXTRA_PARTICIPLES]);
const AUXILIARIES = new Set([...AVOIR_PRESENT, ...IRREGULAR.être.present]);
const isParticiple = (word: string) => PARTICIPLES.has(word) || PARTICIPLES.has(word.replace(/e?s?$/u, ""));

/** Le temps d'une phrase, lu dans ses mots : le passé composé (auxiliaire puis participe), le futur, l'imparfait, le présent. */
function tenseOfSentence(sentence: string): "pc" | "futur" | "imparfait" | "present" | null {
  const words = wordsOf(sentence);
  for (let i = 0; i < words.length - 1; i++) if (AUXILIARIES.has(words[i].replace(/'$/u, "")) && isParticiple(words[i + 1])) return "pc";
  const tenses = words.flatMap((word) => [...(FORM_TENSES.get(word.replace(/'$/u, "")) ?? [])]);
  if (tenses.includes("futur")) return "futur";
  if (tenses.includes("imparfait")) return "imparfait";
  if (tenses.includes("present")) return "present";
  return null;
}

/** La personne d'un verbe, lue dans ce qui précède le trou : un pronom, ou « et » / un « s » final pour deux sujets ou plus. */
function personBeforeBlank(text: string): Person {
  const before = text.replace(/’/g, "'").split("___")[0];
  const tokens = before.split(/[\s,]+/).filter(Boolean);
  const clitics = new Set(["le", "la", "les", "l'", "y", "en", "me", "te", "se", "lui", "leur", "ne"]);
  let i = tokens.length - 1;
  while (i > 0 && clitics.has(tokens[i].toLowerCase())) i -= 1;
  const last = tokens[i].toLowerCase();
  if (PERSON_OF_PRONOUN[last]) return PERSON_OF_PRONOUN[last];
  if (tokens[i - 1]?.toLowerCase() === "et") return "3p";
  if (last.length > 3 && last.endsWith("s")) return "3p";
  return "3s";
}
/** Le verbe d'un trou : celui qui est donné entre parenthèses. */
const infinitiveOfGap = (exo: Exo): string => {
  const infinitive = /\(([^)]+)\)/u.exec(textOf(exo))?.[1] ?? "";
  if (!VERB_LIST.includes(infinitive)) throw new Error(`verbe inconnu : ${infinitive} dans « ${textOf(exo)} »`);
  return infinitive;
};

// ===========================================================================
// LA GRAMMAIRE DE PHRASE : sujet, verbe, complément direct, compléments avec préposition
// ===========================================================================

const MAIN_VERBS = new Set(
  "mange lave écoutent écoute lance donne poursuit comptent achète range prête cueille montre parle répond téléphone sourit obéissent obéit ressemble pense raconte rêve écrit lit regarde prépare suit cherche prend ramasse ferme".split(" "),
);
const PREPOSITIONS = new Set(["à", "au", "aux", "de", "dans", "sur", "sous", "près", "devant", "chez", "avec", "sans", "pendant", "après", "en", "derrière"]);
type Clause = { subject: string; verb: string; direct: string | null; prepositional: string[] };
function parseClause(sentence: string): Clause {
  const words = sentence.replace(/[.!?]$/u, "").split(" ");
  const at = words.findIndex((word) => MAIN_VERBS.has(word));
  if (at < 0) throw new Error(`aucun verbe connu dans « ${sentence} »`);
  const chunks: string[][] = [[]];
  for (const word of words.slice(at + 1)) {
    if (PREPOSITIONS.has(word) && chunks[chunks.length - 1].length > 0) chunks.push([word]);
    else chunks[chunks.length - 1].push(word);
  }
  const direct = chunks[0].length > 0 && !PREPOSITIONS.has(chunks[0][0]) ? chunks[0].join(" ") : null;
  const prepositional = chunks.filter((chunk) => chunk.length > 0 && PREPOSITIONS.has(chunk[0])).map((chunk) => chunk.join(" "));
  return { subject: words.slice(0, at).join(" "), verb: words[at], direct, prepositional };
}
/** Le COI : le premier complément avec « à », « au », « aux » ou « de ». */
const coiOf = (clause: Clause): string | null => clause.prepositional.find((chunk) => ["à", "au", "aux", "de"].includes(chunk.split(" ")[0])) ?? null;

const PEOPLE_WORDS = new Set(["maman", "maîtresse", "frère", "voisin", "fatou", "garçon", "oncle", "ami", "tante", "père", "cousins", "sœur", "moussa", "pape", "amis", "parents", "directeur", "voisins", "grands", "cousines", "grand-mère", "awa", "omar"]);
const isPerson = (chunk: string) => wordsOf(chunk).some((word) => PEOPLE_WORDS.has(word));
const FEMININE_NAMES = new Set(["fatou", "awa", "mariama", "khady", "aminata"]);
const PLURAL_DETERMINERS = new Set(["ses", "les", "aux", "leurs", "des", "mes", "nos", "ces", "tes", "vos"]);
const FEMININE_DETERMINERS = new Set(["la", "sa", "ma", "ta", "cette", "une", "notre"]);

/** Le pronom qui remplace un complément : le, la, les pour un COD ; lui, leur pour un COI. */
function pronounFor(chunk: string, kind: "COD" | "COI"): string {
  const first = wordsOf(chunk).filter((word) => word !== "à")[0];
  const plural = PLURAL_DETERMINERS.has(first);
  if (kind === "COI") return plural ? "leur" : "lui";
  if (plural) return "les";
  return FEMININE_DETERMINERS.has(first) || FEMININE_NAMES.has(first) ? "la" : "le";
}
const FEMININE_HEADS = new Set(["fatou", "awa", "maîtresse", "filles", "sœur", "cousines", "voisine"]);
const subjectPronoun = (phrase: string): string => {
  const parts = phrase.split(/ et /u);
  const heads = parts.map((part) => wordsOf(part).slice(-1)[0]);
  const plural = parts.length > 1 || heads.some((head) => ["filles", "garçons"].includes(head));
  const allFeminine = heads.every((head) => FEMININE_HEADS.has(head));
  return plural ? (allFeminine ? "elles" : "ils") : allFeminine ? "elle" : "il";
};

// ===========================================================================
// LES COMPLÉMENTS CIRCONSTANCIELS
// ===========================================================================

const PLACE_LABEL = "Lieu";
const TIME_LABEL = "Temps";
const MANNER_LABEL = "Manière";
const TIME_WORDS = new Set(["matin", "midi", "soir", "dimanche", "samedi", "lundi", "demain", "hier", "juillet", "nuit", "récréation", "jours", "après", "pendant"]);
const PLACE_WORDS = new Set(["cour", "marché", "manguier", "puits", "plage", "maison", "thiès", "fleuve", "école", "jardin", "colline", "tante", "port", "cartable", "banc", "place", "village", "bord", "chez"]);
/** Ce que dit un groupe de mots : un lieu, un moment ou une manière ; `null` pour tout autre groupe (sujet, COD, COI, verbe). */
function circumstanceOf(group: string): string | null {
  const words = wordsOf(group);
  const text = words.join(" ");
  if (words.length === 1 && words[0].endsWith("ment")) return MANNER_LABEL;
  if (/^(avec|sans) /u.test(text) || /^à (voix|pas) /u.test(text) || text === "en silence" || text === "très vite") return MANNER_LABEL;
  if (words.some((word) => TIME_WORDS.has(word))) return TIME_LABEL;
  if (words.some((word) => PLACE_WORDS.has(word))) return PLACE_LABEL;
  return null;
}
/** Les groupes qui peuvent être des compléments circonstanciels : avant la virgule, chaque groupe qui commence par une préposition, chaque adverbe. */
function groupsOf(sentence: string): string[] {
  const body = sentence.replace(/[.!?]$/u, "");
  const parts = body.split(", ");
  const groups: string[] = [];
  let text = body;
  if (parts.length > 1) {
    groups.push(parts[0]);
    text = parts.slice(1).join(", ");
  }
  let current: string[] | null = null;
  for (const word of text.split(" ")) {
    if (word.endsWith("ment") && word.length > 5) {
      if (current) groups.push(current.join(" "));
      current = null;
      groups.push(word);
    } else if (PREPOSITIONS.has(word.toLowerCase()) && !(current && ["près", "de"].includes(current[current.length - 1].toLowerCase()))) {
      if (current) groups.push(current.join(" "));
      current = [word];
    } else if (current) current.push(word);
  }
  if (current) groups.push(current.join(" "));
  return groups;
}

const DEFINITE = new Set(["le", "la", "les", "l'"]);
const INDEFINITE = new Set(["un", "une", "des"]);
/** Les verbes conjugués qu'une phrase nominale n'a pas : les formes des verbes de la table, et celles des phrases qui lui font face. */
const EXTRA_FORMS = new Set("dansent prépare brille aboie surveille entrent demande souhaite termine souhaitons chantent sortent sonne gardons ramassent célèbre partent ouvre est font fait finit va".split(" "));
/** Une forme est conjuguée quand elle est un présent, un imparfait, un futur ou un impératif : « marché » seul est un participe ou un nom. */
const isConjugated = (word: string) => EXTRA_FORMS.has(word) || [...(FORM_TENSES.get(word) ?? [])].some((tense) => tense !== "participe");
const hasConjugatedVerb = (sentence: string) => wordsOf(sentence).some(isConjugated);

/** Pour chaque phrase à trou de préposition, toutes les prépositions qui vont : une bonne réponse, et jamais un mauvais choix de cette liste. */
const VALID_PREPOSITIONS: Record<string, string[]> = {
  "Les enfants jouent ___ la cour.": ["dans"],
  "Nous arrivons ___ midi.": ["à"],
  "Il parle ___ voix basse.": ["à"],
  "Awa range ses affaires ___ soin.": ["avec", "sans"],
  "Le pêcheur travaille ___ port.": ["au"],
  "Les élèves sortent ___ la récréation.": ["pendant", "à", "après", "avant"],
  "Le chat saute ___ la table.": ["sur", "sous"],
  "Mariama habite ___ Thiès.": ["à"],
  "Il pleut ___ juillet.": ["en"],
  "Omar répond ___ politesse.": ["avec", "sans"],
  "Nous allons ___ Dakar.": ["à", "vers"],
  "Les enfants chantent ___ joie.": ["avec", "sans"],
};

// ===========================================================================
// LES POSSESSIFS ET LES DÉMONSTRATIFS
// ===========================================================================

type Noun = { g: "m" | "f"; n: "s" | "p"; vowel: boolean };
const noun = (g: "m" | "f", n: "s" | "p", vowel = false): Noun => ({ g, n, vowel });
const NOUNS: Record<string, Noun> = {
  ballon: noun("m", "s"), poupée: noun("f", "s"), sœurs: noun("f", "p"), sœur: noun("f", "s"), affaires: noun("f", "p"), cahiers: noun("m", "p"), cahier: noun("m", "s"),
  village: noun("m", "s"), mains: noun("f", "p"), cartable: noun("m", "s"), natte: noun("f", "s"), amies: noun("f", "p"), crayons: noun("m", "p"), casquette: noun("f", "s"),
  clés: noun("f", "p"), école: noun("f", "s", true), dessins: noun("m", "p"), cousins: noun("m", "p"), lettre: noun("f", "s"), porte: noun("f", "s"), case: noun("f", "s"),
  vélos: noun("m", "p"), jardin: noun("m", "s"), livres: noun("m", "p"), jouets: noun("m", "p"), maison: noun("f", "s"), classe: noun("f", "s"), pagne: noun("m", "s"),
  sac: noun("m", "s"), robe: noun("f", "s"), billes: noun("f", "p"), corde: noun("f", "s"), chèvres: noun("f", "p"), garçon: noun("m", "s"), fille: noun("f", "s"),
  filles: noun("f", "p"), arbres: noun("m", "p"), oiseau: noun("m", "s", true), chanson: noun("f", "s"), fruits: noun("m", "p"), éléphant: noun("m", "s", true),
  enfants: noun("m", "p"), mangue: noun("f", "s"), arbre: noun("m", "s", true), livre: noun("m", "s"), amis: noun("m", "p"), chaises: noun("f", "p"), orage: noun("m", "s", true),
  frère: noun("m", "s"), maîtresse: noun("f", "s"), père: noun("m", "s"), habits: noun("m", "p"), fleuve: noun("m", "s"), fruit: noun("m", "s"), tableau: noun("m", "s"), table: noun("f", "s"),
};
const POSSESSIVE_PERSON: Record<string, Person> = { mon: "1s", ma: "1s", mes: "1s", ton: "2s", ta: "2s", tes: "2s", son: "3s", sa: "3s", ses: "3s", notre: "1p", nos: "1p", votre: "2p", vos: "2p", leur: "3p", leurs: "3p" };
const possessiveFor = (person: Person, target: Noun): string => {
  if (person === "1p") return target.n === "p" ? "nos" : "notre";
  if (person === "2p") return target.n === "p" ? "vos" : "votre";
  if (person === "3p") return target.n === "p" ? "leurs" : "leur";
  const base = person === "1s" ? ["mon", "ma", "mes"] : person === "2s" ? ["ton", "ta", "tes"] : ["son", "sa", "ses"];
  if (target.n === "p") return base[2];
  return target.g === "m" || target.vowel ? base[0] : base[1];
};
const demonstrativeFor = (target: Noun): string => (target.n === "p" ? "ces" : target.g === "f" ? "cette" : target.vowel ? "cet" : "ce");
/** Le possesseur d'une phrase, lu dans son sujet : un pronom, « Les … », deux sujets reliés par « et », ou un prénom. */
function possessorOf(text: string): Person {
  const first = text.replace(/’/g, "'").split(/[\s,]+/)[0].toLowerCase();
  if (PERSON_OF_PRONOUN[first]) return PERSON_OF_PRONOUN[first];
  if (first === "les" || / et /u.test(text.split(".")[0].split("___")[0])) return "3p";
  return "3s";
}
const OWNER_LABEL: Record<Person, string> = { "1s": "moi", "2s": "toi", "3s": "lui ou à elle", "1p": "nous", "2p": "vous", "3p": "eux" };
const nounOf = (word: string): Noun => {
  const found = NOUNS[word.toLowerCase().replace(/[.!?]$/u, "")];
  if (!found) throw new Error(`nom inconnu : ${word}`);
  return found;
};

// ===========================================================================
// LES VÉRIFICATIONS, UNE PAR GABARIT
// ===========================================================================

const PRONOUNS_OBJECT = ["le", "la", "les", "lui", "leur"];

/** Les trous de conjugaison : la forme se recalcule depuis le verbe donné et la personne du sujet. */
function checkConjugated(exo: Exo, kind: "imparfait" | "pc" | "pc-recit"): string | null {
  const text = textOf(exo);
  const infinitive = infinitiveOfGap(exo);
  const person = personBeforeBlank(text);
  const verb = conjugation(infinitive);
  const expected = kind === "imparfait" ? formOf(infinitive, "imparfait", person) : composeOf(infinitive, person);
  const answer = blankOf(exo).answer;
  const wrongs = blankOf(exo).options.filter((option) => option !== answer);
  const allowed =
    kind === "imparfait"
      ? new Set([...verb.imparfait.filter((form) => form !== expected), verb.present[personIndex(person)], verb.futur[personIndex(person)]])
      : kind === "pc-recit"
        ? new Set([verb.imparfait[personIndex(person)], verb.present[personIndex(person)]])
        : new Set(PERSONS.filter((other) => other !== person).map((other) => composeOf(infinitive, other)));
  return all(
    ok(answer === expected, `la forme de « ${infinitive} » à la personne ${person} est « ${expected} », le trou dit « ${answer} »`),
    ok(wrongs.length === 2 && wrongs.every((option) => allowed.has(option) && option !== expected), `mauvais choix ${wrongs.join(" | ")}`),
    ok(kind !== "imparfait" || /autrefois|petit|petite|petits|chaque|tous les|avant|soir|pleuvait|jour/iu.test(text), "rien dans la phrase n'impose l'imparfait"),
    ok(kind === "imparfait" || /hier|ce matin|soudain|tout à coup/iu.test(text), "rien dans la phrase n'impose le passé composé"),
  );
}

const CHECKS: Record<string, Check> = {
  // ----- COD, COI et pronoms -----
  "ce2-cod-trouver": (exo) => {
    const clause = parseClause(quoted(exo.prompt));
    return all(
      ok(/^Lis la phrase « .+ » Quel est le COD \?$/u.test(exo.prompt), `énoncé inconnu : ${exo.prompt}`),
      ok(clause.direct !== null, "aucun COD dans la phrase"),
      ok(rightOption(exo) === clause.direct, `le COD est « ${clause.direct} », la réponse dit « ${rightOption(exo)} »`),
      wrongsAre(exo, (option) => [clause.subject, clause.verb, ...clause.prepositional].includes(option), clause.direct ?? ""),
    );
  },
  "ce2-coi-trouver": (exo) => {
    const clause = parseClause(quoted(exo.prompt));
    const coi = coiOf(clause);
    return all(
      ok(/^Lis la phrase « .+ » Quel est le COI \?$/u.test(exo.prompt), `énoncé inconnu : ${exo.prompt}`),
      ok(coi !== null, "aucun COI dans la phrase"),
      ok(rightOption(exo) === coi, `le COI est « ${coi} », la réponse dit « ${rightOption(exo)} »`),
      wrongsAre(exo, (option) => [clause.subject, clause.verb, clause.direct ?? ""].includes(option), coi ?? ""),
    );
  },
  "ce2-cod-question": (exo) => {
    if (exo.prompt === "Quelle question permet de trouver le COD ?") return ok(rightOption(exo) === "Qui ? ou quoi ?" && !wrongOf(exo).includes("Qui ? ou quoi ?"), "question du COD");
    if (exo.prompt === "Quelle question permet de trouver le COI ?") return ok(rightOption(exo) === "À qui ? ou à quoi ?" && !wrongOf(exo).includes("À qui ? ou à quoi ?"), "question du COI");
    const kind = /le (COD|COI) de/u.exec(exo.prompt)?.[1] as "COD" | "COI" | undefined;
    if (!kind) return `énoncé inconnu : ${exo.prompt}`;
    const clause = parseClause(quoted(exo.prompt));
    const complement = kind === "COD" ? clause.direct : coiOf(clause);
    if (complement === null) return "aucun complément";
    const expected = `${clause.subject} ${clause.verb} ${kind === "COI" ? "à " : ""}${isPerson(complement) ? "qui" : "quoi"} ?`;
    return all(ok(rightOption(exo) === expected, `la question est « ${expected} », la réponse dit « ${rightOption(exo)} »`), wrongsAre(exo, (option) => option.startsWith(`${clause.subject} ${clause.verb} `), expected));
  },
  "ce2-cod-glisser": (exo) =>
    all(
      ok(sameSeq(zonesOf(exo), ["COD", "COI"]), `cases ${zonesOf(exo).join(" | ")}`),
      ...itemsOf(exo).map((item) => {
        const expected = ["à", "de"].includes(item.text.split(" ")[0]) ? "COI" : "COD";
        return ok(item.correctZone === expected, `« ${item.text} » est un ${expected}, rangé dans « ${item.correctZone} »`);
      }),
      ok(itemsOf(exo).length === 4, "quatre étiquettes"),
    ),
  "ce2-cod-relier": (exo) =>
    all(
      ok(exo.prompt === "Relie chaque phrase à la même phrase avec un pronom.", `énoncé inconnu : ${exo.prompt}`),
      ...pairsOf(exo).map((pair) => {
        const clause = parseClause(pair.left);
        const kind = clause.direct ? "COD" : "COI";
        const expected = `${clause.subject} ${pronounFor((clause.direct ?? coiOf(clause)) as string, kind)} ${clause.verb}.`;
        return ok(pair.right === expected, `« ${pair.left} » donne « ${expected} », pas « ${pair.right} »`);
      }),
      ok(pairsOf(exo).length === 3, "trois paires"),
    ),
  "ce2-cod-pronom": (exo) => {
    const [first, second] = textOf(exo).split(/(?<=\.) /u);
    const clause = parseClause(first);
    const expected = pronounFor((clause.direct ?? coiOf(clause)) as string, clause.direct ? "COD" : "COI");
    return all(
      ok(second.includes("___") && second.startsWith(clause.subject), `deuxième phrase : ${second}`),
      ok(blankOf(exo).answer === expected, `le pronom est « ${expected} », le trou dit « ${blankOf(exo).answer} »`),
      ok(blankOf(exo).options.every((option) => PRONOUNS_OBJECT.includes(option)), "les choix sont des pronoms"),
    );
  },
  "ce2-cod-sujet": (exo) => {
    const expected = capitalise(subjectPronoun(quoted(exo.prompt)));
    return all(ok(rightOption(exo) === expected, `le pronom est « ${expected} », la réponse dit « ${rightOption(exo)} »`), wrongsAre(exo, (option) => ["Il", "Elle", "Ils", "Elles"].includes(option), expected));
  },
  "ce2-cod-ecrire": (exo) => {
    const subject = /^(.+)\. Quel pronom sujet remplace (.+) \? Écris le mot\.$/u.exec(exo.prompt);
    if (subject) return ok(sameSeq(acceptedOf(exo), [subjectPronoun(subject[2])]) && exo.answerKey === subjectPronoun(subject[2]), `pronom sujet ${acceptedOf(exo).join(" | ")}`);
    const object = /^(.+\.) Quel pronom remplace (.+) \? Écris le mot\.$/u.exec(exo.prompt);
    if (!object) return `énoncé inconnu : ${exo.prompt}`;
    const clause = parseClause(object[1]);
    const kind = clause.direct === object[2] ? "COD" : "COI";
    const expected = pronounFor(object[2], kind);
    return all(
      ok(kind === "COD" ? clause.direct === object[2] : coiOf(clause) === object[2], "le complément remplacé n'est pas dans la phrase"),
      ok(sameSeq(acceptedOf(exo), [expected]) && exo.answerKey === expected, `le pronom est « ${expected} », la clé dit « ${acceptedOf(exo).join(" | ")} »`),
    );
  },

  // ----- Les compléments circonstanciels, la phrase nominale, les articles -----
  "ce2-cc-type": (exo) => {
    const sentence = quoted(exo.prompt, 1);
    const group = quoted(exo.prompt, 2);
    const expected = circumstanceOf(group);
    return all(
      ok(sentence.includes(group), "le groupe n'est pas dans la phrase"),
      ok(expected !== null && rightOption(exo) === expected, `« ${group} » dit « ${expected} », la réponse dit « ${rightOption(exo)} »`),
      wrongsAre(exo, (option) => [PLACE_LABEL, TIME_LABEL, MANNER_LABEL].includes(option), expected ?? ""),
    );
  },
  "ce2-cc-question": (exo) => {
    const group = quoted(exo.prompt, 1);
    const sentence = quoted(exo.prompt, 2);
    const type = circumstanceOf(group);
    const expected = type === PLACE_LABEL ? "Où ?" : type === TIME_LABEL ? "Quand ?" : type === MANNER_LABEL ? "Comment ?" : null;
    return all(
      ok(sentence.includes(group), "le groupe n'est pas dans la phrase"),
      ok(expected !== null && rightOption(exo) === expected, `« ${group} » se trouve avec « ${expected} », pas « ${rightOption(exo)} »`),
      wrongsAre(exo, (option) => ["Où ?", "Quand ?", "Comment ?"].includes(option), expected ?? ""),
    );
  },
  "ce2-cc-trouver": (exo) => {
    const asked = /^Lis la phrase « .+ » Quel est le complément (de lieu|de temps|de manière) \?$/u.exec(exo.prompt)?.[1];
    const label = asked === "de lieu" ? PLACE_LABEL : asked === "de temps" ? TIME_LABEL : asked === "de manière" ? MANNER_LABEL : "?";
    const sentence = quoted(exo.prompt);
    const groups = groupsOf(sentence);
    const matching = groups.filter((group) => circumstanceOf(group) === label);
    return all(
      ok(matching.length === 1, `la phrase a ${matching.length} compléments de ce type : ${groups.join(" | ")}`),
      ok(rightOption(exo) === matching[0], `le complément est « ${matching[0]} », la réponse dit « ${rightOption(exo)} »`),
      wrongsAre(exo, (option) => circumstanceOf(option) !== label && sentence.includes(option), rightOption(exo)),
    );
  },
  "ce2-cc-glisser": (exo) => {
    const label = (zone: string) => ([PLACE_LABEL, TIME_LABEL, MANNER_LABEL].includes(zone) ? zone : "?");
    return all(
      ok(zonesOf(exo).length === 2 && zonesOf(exo).every((zone) => label(zone) !== "?"), `cases ${zonesOf(exo).join(" | ")}`),
      ...itemsOf(exo).map((item) => ok(circumstanceOf(item.text) === label(item.correctZone), `« ${item.text} » dit « ${circumstanceOf(item.text)} », rangé dans « ${item.correctZone} »`)),
      ok(itemsOf(exo).length === 4, "quatre étiquettes"),
    );
  },
  "ce2-cc-relier": (exo) =>
    all(
      ok(exo.prompt === "Relie chaque complément à ce qu'il dit.", `énoncé inconnu : ${exo.prompt}`),
      ...pairsOf(exo).map((pair) => ok(circumstanceOf(pair.left) === pair.right, `« ${pair.left} » dit « ${circumstanceOf(pair.left)} », pas « ${pair.right} »`)),
      ok(pairsOf(exo).length === 3, "trois paires"),
    ),
  "ce2-cc-nominale": (exo) =>
    all(
      ok(exo.prompt === "Laquelle de ces phrases est une phrase nominale ?", `énoncé inconnu : ${exo.prompt}`),
      ok(!hasConjugatedVerb(rightOption(exo)), `« ${rightOption(exo)} » a un verbe conjugué`),
      ...wrongOf(exo).map((option) => ok(hasConjugatedVerb(option), `« ${option} » n'a pas de verbe conjugué : ce serait une deuxième phrase nominale`)),
    ),
  "ce2-cc-article": (exo) => {
    const asked = /article (défini|indéfini)/u.exec(exo.prompt)?.[1];
    const group = asked === "défini" ? DEFINITE : INDEFINITE;
    const other = asked === "défini" ? INDEFINITE : DEFINITE;
    const found = wordsOf(quoted(exo.prompt)).filter((word) => group.has(word));
    return all(
      ok(asked !== undefined, `énoncé inconnu : ${exo.prompt}`),
      ok(found.length === 1, `la phrase a ${found.length} articles de ce type`),
      ok(rightOption(exo).toLowerCase() === found[0], `l'article est « ${found[0]} », la réponse dit « ${rightOption(exo)} »`),
      wrongsAre(exo, (option) => other.has(option.toLowerCase()), rightOption(exo)),
    );
  },
  "ce2-cc-mot": (exo) => {
    const text = textOf(exo);
    const valid = VALID_PREPOSITIONS[text];
    if (!valid) return `phrase inconnue : ${text}`;
    const wrongs = blankOf(exo).options.filter((option) => option !== blankOf(exo).answer);
    return all(ok(valid.includes(blankOf(exo).answer), `« ${blankOf(exo).answer} » ne va pas dans « ${text} »`), ok(wrongs.every((option) => !valid.includes(option)), `un mauvais choix va aussi : ${blankOf(exo).options.join(" | ")}`));
  },
  "ce2-cc-ecrire": (exo) => {
    const prompt = fold(exo.prompt);
    const [base, allowed] =
      /n'a pas de verbe conjugue|grande fete/u.test(prompt) ? ["phrase nominale", ["phrase nominale", "une phrase nominale"]]
      : /un, une ou des|« une porte »/u.test(exo.prompt) ? ["indéfini", ["indéfini", "indéfinis", "article indéfini"]]
      : /le, la ou les|« la porte »/u.test(exo.prompt) ? ["défini", ["défini", "définis", "article défini"]]
      : /lieu|endroit/u.test(prompt) ? ["où", ["où", "ou"]]
      : /temps|moment/u.test(prompt) ? ["quand", ["quand"]]
      : /maniere|facon/u.test(prompt) ? ["comment", ["comment"]]
      : ["?", []];
    return all(
      ok(acceptedOf(exo)[0] === base && acceptedOf(exo).every((entry) => allowed.includes(entry)), `écritures ${acceptedOf(exo).join(" | ")} pour « ${exo.prompt} » (attendu ${base})`),
      ok(exo.answerKey === acceptedOf(exo)[0], "clé = première écriture"),
    );
  },

  // ----- Les possessifs et les démonstratifs -----
  "ce2-poss-trou": (exo) => {
    const text = textOf(exo);
    const expected = possessiveFor(possessorOf(text), nounOf(text.split("___ ")[1].split(/[ .]/)[0]));
    return all(ok(blankOf(exo).answer === expected, `le possessif est « ${expected} », le trou dit « ${blankOf(exo).answer} »`), ok(blankOf(exo).options.every((option) => option in POSSESSIVE_PERSON), "les choix sont des possessifs"));
  },
  "ce2-poss-choisir": (exo) => {
    const check = (sentence: string) => {
      const words = wordsOf(sentence);
      const at = words.findIndex((word) => word in POSSESSIVE_PERSON);
      return { word: words[at], expected: possessiveFor(possessorOf(sentence), nounOf(words[at + 1])) };
    };
    const right = check(rightOption(exo));
    return all(
      ok(exo.prompt === "Quelle phrase est écrite correctement ?", `énoncé inconnu : ${exo.prompt}`),
      ok(right.word === right.expected, `la bonne option écrit « ${right.word} » au lieu de « ${right.expected} »`),
      ...wrongOf(exo).map((option) => ok(check(option).word !== check(option).expected, `un mauvais choix est bien écrit : ${option}`)),
    );
  },
  "ce2-dem-trou": (exo) => {
    const text = textOf(exo);
    const base = demonstrativeFor(nounOf(text.split("___ ")[1].split(/[ .?]/)[0]));
    const expected = text.startsWith("___") ? capitalise(base) : base;
    return all(
      ok(blankOf(exo).answer === expected, `le démonstratif est « ${expected} », le trou dit « ${blankOf(exo).answer} »`),
      ok(blankOf(exo).options.every((option) => ["ce", "cet", "cette", "ces"].includes(option.toLowerCase())), "les choix sont des démonstratifs"),
    );
  },
  "ce2-dem-choisir": (exo) => {
    const expected = demonstrativeFor(nounOf(quoted(exo.prompt)));
    return all(ok(rightOption(exo) === expected, `le démonstratif est « ${expected} », la réponse dit « ${rightOption(exo)} »`), wrongsAre(exo, (option) => ["ce", "cet", "cette", "ces"].includes(option), expected));
  },
  "ce2-det-glisser": (exo) =>
    all(
      ok(sameSeq(zonesOf(exo), ["Singulier", "Pluriel"]), `cases ${zonesOf(exo).join(" | ")}`),
      ...itemsOf(exo).map((item) => ok(item.correctZone === (item.text.endsWith("s") ? "Pluriel" : "Singulier"), `« ${item.text} » rangé dans « ${item.correctZone} »`)),
      ok(itemsOf(exo).length === 4, "quatre étiquettes"),
    ),
  "ce2-det-relier": (exo) =>
    all(
      ok(exo.prompt === "Relie chaque groupe à celui à qui il appartient.", `énoncé inconnu : ${exo.prompt}`),
      ...pairsOf(exo).map((pair) => {
        const [word, name] = pair.left.split(" ");
        const person = POSSESSIVE_PERSON[word];
        const target = nounOf(name);
        const article = target.n === "p" ? "Les" : target.vowel ? "L'" : target.g === "m" ? "Le" : "La";
        const expected = `${article}${article === "L'" ? "" : " "}${name} ${target.n === "p" ? "sont" : "est"} à ${OWNER_LABEL[person]}.`;
        return all(ok(possessiveFor(person, target) === word, `« ${pair.left} » est mal accordé`), ok(pair.right === expected, `« ${pair.left} » va avec « ${expected} », pas « ${pair.right} »`));
      }),
      ok(pairsOf(exo).length === 3, "trois paires"),
    ),
  "ce2-det-ordre": (exo) => {
    const words = wordsOf(sequenceOf(exo).join(" "));
    const at = words.findIndex((word) => word in POSSESSIVE_PERSON || ["ce", "cet", "cette", "ces"].includes(word));
    const target = nounOf(words[at + 1]);
    const valid = words[at] in POSSESSIVE_PERSON ? PERSONS.map((person) => possessiveFor(person, target)) : [demonstrativeFor(target)];
    return all(
      ok(exo.prompt === "Remets les mots dans l'ordre pour écrire une phrase.", `énoncé inconnu : ${exo.prompt}`),
      ok(/^\p{Lu}/u.test(sequenceOf(exo)[0]) && sequenceOf(exo)[sequenceOf(exo).length - 1].endsWith("."), "majuscule au début, point à la fin"),
      ok(valid.includes(words[at]), `« ${words[at]} » ne va pas devant « ${words[at + 1]} »`),
    );
  },
  "ce2-det-ecrire": (exo) => {
    const demonstrative = /^Quel petit mot démonstratif va devant « (.+) » \? Écris le mot\.$/u.exec(exo.prompt);
    if (demonstrative) return ok(sameSeq(acceptedOf(exo), [demonstrativeFor(nounOf(demonstrative[1]))]), `démonstratif ${acceptedOf(exo).join(" | ")}`);
    const possessive = /^(.+)\. Quel mot va devant (\S+) pour dire qu'(?:il|elle|ils|elles) (?:est|sont) à (.+) \? Écris le mot\.$/u.exec(exo.prompt);
    if (!possessive) return `énoncé inconnu : ${exo.prompt}`;
    const owner = possessive[3];
    const person: Person = owner === "nous" ? "1p" : owner === "vous" ? "2p" : owner === "toi" ? "2s" : owner === "eux" ? "3p" : "3s";
    return ok(sameSeq(acceptedOf(exo), [possessiveFor(person, nounOf(possessive[2]))]), `possessif ${acceptedOf(exo).join(" | ")}`);
  },

  // ----- L'imparfait et le passé composé -----
  "ce2-imparfait-forme": (exo) => checkConjugated(exo, "imparfait"),
  "ce2-imparfait-recit": (exo) => checkConjugated(exo, "pc-recit"),
  "ce2-compose-forme": (exo) => checkConjugated(exo, "pc"),
  "ce2-imparfait-choisir": (exo) => {
    const asked = exo.prompt.includes("à l'imparfait") ? "imparfait" : exo.prompt.includes("au passé composé") ? "pc" : null;
    if (asked === null) return `énoncé inconnu : ${exo.prompt}`;
    return all(
      ok(tenseOfSentence(rightOption(exo)) === asked, `« ${rightOption(exo)} » est ${tenseOfSentence(rightOption(exo))}, pas ${asked}`),
      ...wrongOf(exo).map((option) => ok(tenseOfSentence(option) !== asked && tenseOfSentence(option) !== null, `« ${option} » est aussi ${asked}`)),
    );
  },
  "ce2-compose-relier": (exo) =>
    all(
      ok(exo.prompt === "Relie chaque verbe à son participe passé.", `énoncé inconnu : ${exo.prompt}`),
      ...pairsOf(exo).map((pair) => ok(conjugation(pair.left).participe === pair.right, `le participe de « ${pair.left} » est « ${conjugation(pair.left).participe} », pas « ${pair.right} »`)),
      ok(pairsOf(exo).length === 3, "trois paires"),
    ),
  "ce2-imparfait-glisser": (exo) =>
    all(
      ok(sameSeq(zonesOf(exo), ["Imparfait", "Passé composé"]), `cases ${zonesOf(exo).join(" | ")}`),
      ...itemsOf(exo).map((item) => {
        const tense = tenseOfSentence(item.text);
        const expected = tense === "pc" ? "Passé composé" : tense === "imparfait" ? "Imparfait" : "?";
        return ok(item.correctZone === expected, `« ${item.text} » est ${tense}, rangé dans « ${item.correctZone} »`);
      }),
      ok(itemsOf(exo).length === 4, "quatre étiquettes"),
    ),
  "ce2-imparfait-ordre": (exo) => {
    const sequence = sequenceOf(exo);
    return all(
      ok(exo.prompt === "Remets ces phrases dans l'ordre du temps.", `énoncé inconnu : ${exo.prompt}`),
      ok(sequence.length === 3 && sequence[0].startsWith("D'abord,") && sequence[1].startsWith("Ensuite,") && sequence[2].startsWith("Enfin,"), `ordre ${sequence.join(" > ")}`),
      ...sequence.map((sentence) => ok(tenseOfSentence(sentence) === "pc", `« ${sentence} » n'est pas au passé composé avec avoir`)),
    );
  },
  "ce2-imparfait-ecrire": (exo) => {
    const match = /^Écris le verbe (\S+) (à l'imparfait|au passé composé) avec (\S+)\.$/u.exec(exo.prompt);
    if (!match) return `énoncé inconnu : ${exo.prompt}`;
    const person = PERSON_OF_PRONOUN[match[3]];
    const expected = match[2] === "à l'imparfait" ? formOf(match[1], "imparfait", person) : composeOf(match[1], person);
    return ok(sameSeq(acceptedOf(exo), [expected]) && exo.answerKey === expected, `la forme est « ${expected} », la clé dit « ${acceptedOf(exo).join(" | ")} »`);
  },

  // ----- L'impératif et le futur simple -----
  "ce2-imperatif-forme": (exo) => {
    const infinitive = infinitiveOfGap(exo);
    const addressee = textOf(exo).split(", ___")[0];
    const plural = / et /u.test(addressee) || addressee.endsWith("s");
    const verb = conjugation(infinitive);
    const expected = verb.imperatif[plural ? 2 : 0];
    const valid = new Set([...verb.present, ...verb.futur, ...verb.imperatif]);
    return all(
      ok(blankOf(exo).answer === expected, `l'ordre est « ${expected} » (${plural ? "plusieurs" : "une personne"}), le trou dit « ${blankOf(exo).answer} »`),
      ok(blankOf(exo).options.every((option) => valid.has(option)), `un choix n'est pas une forme de « ${infinitive} » : ${blankOf(exo).options.join(" | ")}`),
    );
  },
  "ce2-futur-forme": (exo) => {
    const infinitive = infinitiveOfGap(exo);
    const person = personBeforeBlank(textOf(exo));
    const expected = formOf(infinitive, "futur", person);
    const verb = conjugation(infinitive);
    const wrongs = blankOf(exo).options.filter((option) => option !== blankOf(exo).answer);
    return all(
      ok(blankOf(exo).answer === expected, `le futur de « ${infinitive} » à la personne ${person} est « ${expected} », le trou dit « ${blankOf(exo).answer} »`),
      ok(wrongs.length === 2 && wrongs.every((option) => (verb.futur.includes(option) && option !== expected) || option === verb.present[personIndex(person)]), `mauvais choix ${wrongs.join(" | ")}`),
    );
  },
  "ce2-imperatif-choisir": (exo) => {
    const right = rightOption(exo);
    const first = wordsOf(right)[0];
    const infinitive = VERB_LIST.find((entry) => conjugation(entry).imperatif.includes(first));
    return all(
      ok(exo.prompt === "Dans quelle phrase le verbe est-il à l'impératif ?", `énoncé inconnu : ${exo.prompt}`),
      ok(infinitive !== undefined && right.endsWith("!"), `« ${right} » n'est pas un ordre`),
      ...wrongOf(exo).map((option) => {
        const words = wordsOf(option);
        const verb = infinitive ? conjugation(infinitive) : null;
        const isTense = verb !== null && (verb.present.includes(words[1]) || verb.futur.includes(words[1]));
        return ok(["tu", "vous", "il", "elle"].includes(words[0]) && isTense && !option.endsWith("!"), `un mauvais choix peut être un ordre : ${option}`);
      }),
    );
  },
  "ce2-futur-choisir": (exo) =>
    all(
      ok(exo.prompt === "Dans quelle phrase le verbe est-il au futur ?", `énoncé inconnu : ${exo.prompt}`),
      ok(tenseOfSentence(rightOption(exo)) === "futur", `« ${rightOption(exo)} » n'est pas au futur`),
      ...wrongOf(exo).map((option) => ok(tenseOfSentence(option) === "pc" || tenseOfSentence(option) === "present", `« ${option} » est ${tenseOfSentence(option)}`)),
    ),
  "ce2-imperatif-glisser": (exo) =>
    all(
      ok(sameSeq(zonesOf(exo), ["Impératif", "Futur"]), `cases ${zonesOf(exo).join(" | ")}`),
      ...itemsOf(exo).map((item) => {
        const words = wordsOf(item.text);
        const futur = words.length === 2 && tenseOfSentence(item.text) === "futur" && words[0] in PERSON_OF_PRONOUN;
        const order = words.length === 1 && VERB_LIST.some((entry) => conjugation(entry).imperatif.includes(words[0]));
        const expected = futur ? "Futur" : order ? "Impératif" : "?";
        return ok(item.correctZone === expected, `« ${item.text} » est ${expected}, rangé dans « ${item.correctZone} »`);
      }),
      ok(itemsOf(exo).length === 4, "quatre étiquettes"),
    ),
  "ce2-imperatif-relier": (exo) => {
    const imperative = exo.prompt === "Relie chaque verbe à son impératif avec tu.";
    const future = exo.prompt === "Relie chaque verbe à son futur avec je.";
    return all(
      ok(imperative || future, `énoncé inconnu : ${exo.prompt}`),
      ...pairsOf(exo).map((pair) => {
        const expected = imperative ? conjugation(pair.left).imperatif[0] : formOf(pair.left, "futur", "1s");
        return ok(pair.right === expected, `« ${pair.left} » donne « ${expected} », pas « ${pair.right} »`);
      }),
      ok(pairsOf(exo).length === 3, "trois paires"),
    );
  },
  "ce2-imperatif-ordre": (exo) => {
    const sequence = sequenceOf(exo);
    const orders = ["lave", "mets", "saute", "range", "remplis", "reviens", "va", "viens", "fais", "prends", "finis"];
    return all(
      ok(exo.prompt === "Mets ces ordres dans l'ordre du temps.", `énoncé inconnu : ${exo.prompt}`),
      ok(sequence.length === 3 && sequence[0].startsWith("D'abord,") && sequence[1].startsWith("Ensuite,") && sequence[2].startsWith("Enfin,"), `ordre ${sequence.join(" > ")}`),
      ...sequence.map((sentence) => {
        const verb = (wordsOf(sentence.split(", ")[1])[0] ?? "").replace(/-.*$/u, "");
        return ok(orders.includes(verb) && !/(?:^| )(?:je|tu|il|elle|nous|vous|ils|elles) /u.test(sentence.toLowerCase()), `« ${sentence} » n'est pas un ordre`);
      }),
    );
  },
  "ce2-imperatif-ecrire": (exo) => {
    const match = /^Écris le verbe (\S+) (à l'impératif|au futur) avec (\S+)\.$/u.exec(exo.prompt);
    if (!match) return `énoncé inconnu : ${exo.prompt}`;
    const verb = conjugation(match[1]);
    const expected = match[2] === "à l'impératif" ? verb.imperatif[match[3] === "tu" ? 0 : 2] : formOf(match[1], "futur", PERSON_OF_PRONOUN[match[3]]);
    return ok(sameSeq(acceptedOf(exo), [expected]) && exo.answerKey === expected, `la forme est « ${expected} », la clé dit « ${acceptedOf(exo).join(" | ")} »`);
  },
};

// ===========================================================================
// LES TABLES SONT SAINES, LES GABARITS SONT COUVERTS
// ===========================================================================

/** Une vérification qui lève une erreur (un nom inconnu dans un exercice abîmé) dit simplement que l'exercice est faux. */
for (const kind of Object.keys(CHECKS)) {
  const check = CHECKS[kind];
  CHECKS[kind] = (exo) => {
    try {
      return check(exo);
    } catch (error) {
      return String(error);
    }
  };
}
const KINDS = Object.keys(CHECKS) as GameKind[];
const TOPIC_KINDS: Record<string, string[]> = {
  "fr-ce2-cod-coi": ["ce2-cod-trouver", "ce2-coi-trouver", "ce2-cod-question", "ce2-cod-glisser", "ce2-cod-relier", "ce2-cod-pronom", "ce2-cod-sujet", "ce2-cod-ecrire"],
  "fr-ce2-cc": ["ce2-cc-type", "ce2-cc-question", "ce2-cc-trouver", "ce2-cc-glisser", "ce2-cc-relier", "ce2-cc-nominale", "ce2-cc-article", "ce2-cc-mot", "ce2-cc-ecrire"],
  "fr-ce2-determinants": ["ce2-poss-trou", "ce2-poss-choisir", "ce2-dem-trou", "ce2-dem-choisir", "ce2-det-glisser", "ce2-det-relier", "ce2-det-ordre", "ce2-det-ecrire"],
  "fr-ce2-imparfait": ["ce2-imparfait-forme", "ce2-imparfait-choisir", "ce2-imparfait-recit", "ce2-compose-forme", "ce2-compose-relier", "ce2-imparfait-glisser", "ce2-imparfait-ordre", "ce2-imparfait-ecrire"],
  "fr-ce2-imperatif-futur": ["ce2-imperatif-forme", "ce2-futur-forme", "ce2-imperatif-choisir", "ce2-futur-choisir", "ce2-imperatif-glisser", "ce2-imperatif-relier", "ce2-imperatif-ordre", "ce2-imperatif-ecrire"],
};
const TOPIC_KEYS = Object.keys(TOPIC_KINDS);
const topicOfKind = (kind: string) => TOPIC_KEYS.find((key) => TOPIC_KINDS[key].includes(kind)) as string;
const entryOf = (key: string) => allProgrammeEntries().find((entry) => entry.topic.key === key)!;
const subjectOfKind = (kind: string) => entryOf(topicOfKind(kind)).subject.name;

describe("chaque gabarit de français du CE2 (grammaire et conjugaison) a sa vérification", () => {
  it("couvre exactement les quarante et un gabarits, tous rangés dans une thématique", () => {
    expect(KINDS).toHaveLength(41);
    expect(Object.values(TOPIC_KINDS).flat().sort()).toEqual([...KINDS].sort());
    for (const kind of KINDS) expect(Object.keys(GAME_KINDS), kind).toContain(kind);
  });
});

describe("les gabarits de français du CE2 recalculent juste, depuis une grammaire écrite à part", () => {
  for (const kind of KINDS) {
    it(`${kind} : la bonne réponse se recalcule, à tous les niveaux`, () => {
      for (const d of draws) {
        const exo = make(kind, d) as unknown as Exo;
        expect(CHECKS[kind](exo), `${kind} niveau ${d.level} : ${exo.prompt} ${exo.payload.text ?? ""}`).toBeNull();
      }
    });
  }
});

describe("la grammaire du test est saine", () => {
  it("conjugue juste les verbes de la table : imparfait, futur, impératif, participe", () => {
    expect(formOf("manger", "imparfait", "1p")).toBe("mangions");
    expect(formOf("manger", "imparfait", "3s")).toBe("mangeait");
    expect(formOf("nager", "present", "1p")).toBe("nageons");
    expect(formOf("commencer", "imparfait", "3s")).toBe("commençait");
    expect(formOf("aboyer", "futur", "3s")).toBe("aboiera");
    expect(formOf("aboyer", "present", "3s")).toBe("aboie");
    expect(formOf("courir", "futur", "1s")).toBe("courrai");
    expect(formOf("voir", "futur", "2s")).toBe("verras");
    expect(formOf("aller", "futur", "1s")).toBe("irai");
    expect(formOf("finir", "imparfait", "1s")).toBe("finissais");
    expect(conjugation("aller").imperatif).toEqual(["va", "allons", "allez"]);
    expect(conjugation("prendre").imperatif[2]).toBe("prenez");
    expect(composeOf("prendre", "2p")).toBe("avez pris");
    expect(composeOf("faire", "1s")).toBe("ai fait");
  });

  it("lit le temps d'une phrase", () => {
    expect(tenseOfSentence("Hier, Awa a joué dans la cour.")).toBe("pc");
    expect(tenseOfSentence("Autrefois, Awa jouait dans la cour.")).toBe("imparfait");
    expect(tenseOfSentence("Demain, nous irons au marché.")).toBe("futur");
    expect(tenseOfSentence("Aujourd'hui, nous allons au marché.")).toBe("present");
    expect(tenseOfSentence("Hier, nous sommes allés au marché.")).toBe("pc");
    expect(tenseOfSentence("Maintenant, il a dix ans.")).toBe("present");
  });

  it("lit la personne d'un verbe et le COD ou le COI d'une phrase", () => {
    expect(personBeforeBlank("Tu cherchais ton cahier quand, tout à coup, tu le ___ (trouver).")).toBe("2s");
    expect(personBeforeBlank("Hier, j'___ un oiseau. (voir)")).toBe("1s");
    expect(personBeforeBlank("Hier, Pape et Omar ___ un vieux baobab. (voir)")).toBe("3p");
    expect(personBeforeBlank("Ce matin, les garçons ___ vers la plage. (courir)")).toBe("3p");
    expect(personBeforeBlank("Autrefois, mon père ___ (vendre) des mangues.")).toBe("3s");
    const clause = parseClause("Moussa donne un cadeau à Fatou.");
    expect(clause).toEqual({ subject: "Moussa", verb: "donne", direct: "un cadeau", prepositional: ["à Fatou"] });
    expect(coiOf(clause)).toBe("à Fatou");
    expect(pronounFor("sa sœur", "COD")).toBe("la");
    expect(pronounFor("à ses amis", "COI")).toBe("leur");
    expect(pronounFor("à la maîtresse", "COI")).toBe("lui");
    expect(subjectPronoun("Moussa et Awa")).toBe("ils");
    expect(subjectPronoun("Fatou et Awa")).toBe("elles");
  });

  it("classe les compléments, les articles et les accords", () => {
    expect(circumstanceOf("à midi")).toBe(TIME_LABEL);
    expect(circumstanceOf("chez ma tante")).toBe(PLACE_LABEL);
    expect(circumstanceOf("à voix basse")).toBe(MANNER_LABEL);
    expect(circumstanceOf("ses livres")).toBeNull();
    expect(circumstanceOf("à la maîtresse")).toBeNull();
    expect(groupsOf("Le jeune garçon répond poliment à la maîtresse.")).toEqual(["poliment", "à la maîtresse"]);
    expect(groupsOf("Chaque matin, Awa balaie la cour.")).toEqual(["Chaque matin"]);
    expect(possessiveFor("3p", nounOf("cahiers"))).toBe("leurs");
    expect(possessiveFor("1s", nounOf("natte"))).toBe("ma");
    expect(demonstrativeFor(nounOf("arbre"))).toBe("cet");
    expect(demonstrativeFor(nounOf("école"))).toBe("cette");
    expect(hasConjugatedVerb("Grande fête au village.")).toBe(false);
    expect(hasConjugatedVerb("Les enfants dansent au village.")).toBe(true);
  });
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
      const first = (payload.acceptedAnswers as string[])[0];
      payload.acceptedAnswers = [`${first}x`];
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

  const draw = (kind: string, level: GameLevel, seed: string) => make(kind as GameKind, { level, seed }) as unknown as Exo;
  /** Cherche, parmi quarante graines par niveau, des exercices qui passent `want`, et vérifie que `damage` les rend faux pour la grammaire. */
  function seesDamage(kind: string, want: (exo: Exo) => boolean, damage: (exo: Exo) => Exo): void {
    let tried = 0;
    for (const level of LEVELS) {
      for (let i = 0; i < 40; i++) {
        const exo = draw(kind, level, `mut:${kind}:${i}`);
        if (!want(exo)) continue;
        tried += 1;
        expect(CHECKS[kind](exo), `${kind} : l'exercice juste doit passer : ${exo.prompt}`).toBeNull();
        expect(CHECKS[kind](damage(exo)), `${kind} : l'exercice abîmé doit échouer : ${exo.prompt}`).not.toBeNull();
      }
    }
    expect(tried, kind).toBeGreaterThan(0);
  }

  it("voient aussi un énoncé abîmé : un COD pour un COI, un temps, un genre, une personne ou un verbe changés", () => {
    // « COD » devenu « COI » dans l'énoncé : la bonne réponse n'est plus la bonne.
    seesDamage("ce2-cod-trouver", () => true, (exo) => ({ ...exo, prompt: exo.prompt.replace("le COD", "le COI") }));
    seesDamage("ce2-coi-trouver", () => true, (exo) => ({ ...exo, prompt: exo.prompt.replace("le COI", "le COD") }));
    // Le genre du complément changé dans le texte : le pronom ne va plus avec la phrase.
    seesDamage("ce2-cod-pronom", (exo) => blankOf(exo).answer === "la", (exo) => ({ ...exo, payload: { ...exo.payload, text: textOf(exo).replace(/ (la|sa|ma) /u, " le ") } }));
    // « lieu » devenu « temps » : le complément de lieu n'est plus celui qu'on demande.
    seesDamage("ce2-cc-trouver", (exo) => exo.prompt.includes("de lieu"), (exo) => ({ ...exo, prompt: exo.prompt.replace("de lieu", "de temps") }));
    seesDamage("ce2-cc-type", () => true, (exo) => ({ ...exo, prompt: exo.prompt.replace(/« [^»]+ » \?$/u, "« zzz » ?") }));
    // Un nom changé de genre dans l'énoncé : « garçon » devient « fille ».
    seesDamage("ce2-dem-choisir", (exo) => exo.prompt.includes("garçon"), (exo) => ({ ...exo, prompt: exo.prompt.replace("garçon", "fille") }));
    // La personne du trou changée : « je » devient « nous ».
    seesDamage("ce2-imparfait-forme", (exo) => /\bje\b/u.test(textOf(exo)), (exo) => ({ ...exo, payload: { ...exo.payload, text: textOf(exo).replace(/\bje\b/u, "nous") } }));
    // Le verbe changé : le verbe entre parenthèses devient « manger ».
    seesDamage("ce2-futur-forme", () => true, (exo) => ({ ...exo, payload: { ...exo.payload, text: textOf(exo).replace(/\([^)]+\)/u, "(manger)") } }));
    // L'énoncé qui demande « impératif » devient « futur » : la forme n'est plus la bonne.
    seesDamage("ce2-imperatif-relier", (exo) => exo.prompt.includes("impératif"), () => ({ ...draw("ce2-imperatif-relier", 1, "x"), prompt: "Relie chaque verbe à son futur avec je." }));
    seesDamage("ce2-imperatif-ecrire", (exo) => exo.prompt.includes("impératif"), (exo) => ({ ...exo, prompt: exo.prompt.replace("à l'impératif", "au futur") }));
    seesDamage("ce2-imparfait-ecrire", (exo) => exo.prompt.includes("imparfait"), (exo) => ({ ...exo, prompt: exo.prompt.replace("à l'imparfait", "au passé composé") }));
    // Deux cases échangées : chaque étiquette se retrouve dans l'autre case.
    for (const kind of ["ce2-cod-glisser", "ce2-cc-glisser", "ce2-det-glisser", "ce2-imparfait-glisser", "ce2-imperatif-glisser"]) {
      seesDamage(kind, () => true, (exo) => {
        const [a, b] = zonesOf(exo);
        return { ...exo, payload: { ...exo.payload, items: itemsOf(exo).map((item) => ({ ...item, correctZone: item.correctZone === a ? b : a })) } };
      });
    }
    // Deux droites échangées : chaque mot se retrouve avec le sens de l'autre.
    for (const kind of ["ce2-cod-relier", "ce2-cc-relier", "ce2-det-relier", "ce2-compose-relier", "ce2-imperatif-relier"]) {
      seesDamage(kind, () => true, (exo) => {
        const pairs = pairsOf(exo).map((pair) => ({ ...pair }));
        [pairs[0].right, pairs[1].right] = [pairs[1].right, pairs[0].right];
        return { ...exo, payload: { ...exo.payload, pairs } };
      });
    }
  });
});

// ===========================================================================
// LES RÈGLES COMMUNES
// ===========================================================================

describe("tous les gabarits de français du CE2 (grammaire et conjugaison)", () => {
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
      if (exo.payload.blanks) expect(apostrophes(textOf(exo)), `${kind} : ${textOf(exo)}`).toBeLessThanOrEqual(1);
    }
  });

  it("n'écrivent aucun émoji, ni dans un énoncé, ni sur une tuile, ni dans un indice", () => {
    for (const { kind, exo } of exos) {
      expect(/\p{Extended_Pictographic}/u.test(exo.prompt), `${kind} : ${exo.prompt}`).toBe(false);
      expect(exo.prompt.includes(VS16), `${kind} : ${exo.prompt}`).toBe(false);
      for (const text of texts(exo)) {
        expect(/\p{Extended_Pictographic}/u.test(text), `${kind} : « ${text} »`).toBe(false);
        expect(text.includes(VS16), `${kind} : « ${text} »`).toBe(false);
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
        expect(options.length, `${kind} : ${textOf(exo)}`).toBe(3);
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
        expect(pairs.length, kind).toBe(3);
      }
      if (exo.payload.correctSequence) {
        const sequence = sequenceOf(exo);
        expect(new Set(sequence).size, `${kind} : ${sequence.join(" ")}`).toBe(sequence.length);
        expect(sequence.length, kind).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it("n'écrivent dans aucun indice un chiffre, ni un mot de quatre lettres ou plus de la bonne réponse ou d'une étiquette à placer", () => {
    for (const { kind, exo } of exos) {
      const answers: string[] = [];
      if (exo.payload.options) answers.push(rightOption(exo));
      if (exo.payload.blanks) answers.push(blankOf(exo).answer);
      if (exo.payload.correctSequence) answers.push(...sequenceOf(exo));
      if (exo.payload.pairs) answers.push(...pairsOf(exo).flatMap((pair) => [pair.left, pair.right]));
      if (exo.payload.items) answers.push(...itemsOf(exo).map((item) => item.text), ...zonesOf(exo));
      if (exo.payload.acceptedAnswers) answers.push(...acceptedOf(exo));
      const words = new Set(
        answers.flatMap((answer) =>
          fold(answer)
            .split(/[^a-z]+/)
            .filter((word) => word.length >= 4),
        ),
      );
      for (const hint of exo.hints) {
        expect(hint, `${kind} : « ${hint} » écrit un chiffre`).not.toMatch(/\d/);
        const hintWords = fold(hint).split(/[^a-z]+/);
        for (const word of words) expect(hintWords, `${kind} : « ${hint} » écrit « ${word} »`).not.toContain(word);
      }
    }
  });

  it("donnent trois indices différents, et se refont à l'identique avec la même graine", () => {
    for (const kind of KINDS) {
      const a = GAME_KINDS[kind].make(makeContext("CE2", 2, "graine"));
      const b = GAME_KINDS[kind].make(makeContext("CE2", 2, "graine"));
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
        subject: subjectOfKind(kind),
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

  it("écrivent la bonne réponse d'un QCM ou d'un trou parmi les choix, et aucune réponse à écrire n'est vide", () => {
    for (const { kind, exo } of exos) {
      if (exo.payload.options) expect(optionsOf(exo), kind).toContain(exo.answerKey);
      if (exo.payload.blanks) expect(blankOf(exo).options, kind).toContain(blankOf(exo).answer);
      if (exo.payload.acceptedAnswers) {
        expect(acceptedOf(exo).length, kind).toBeGreaterThan(0);
        for (const answer of acceptedOf(exo)) expect(answer.trim(), kind).not.toBe("");
      }
    }
  });

  it("n'écrivent pas la bonne option beaucoup plus longue que les autres : l'enfant la devinerait à sa longueur", () => {
    for (const { kind, exo } of exos) {
      if (!exo.payload.options) continue;
      const right = rightOption(exo).length;
      const longest = Math.max(...wrongOf(exo).map((option) => option.length));
      expect(right >= 24 && right >= 2 * longest, `${kind} : ${optionsOf(exo).join(" | ")}`).toBe(false);
    }
  });
});

// ===========================================================================
// LES THÉMATIQUES DU PROGRAMME
// ===========================================================================

describe("les cinq thématiques de grammaire et de conjugaison du CE2", () => {
  const topicOf = (key: string) => entryOf(key).topic;

  it("remplissent les dix places du palier, avec des jeux connus, sans appeler le modèle", () => {
    for (const key of TOPIC_KEYS) {
      const specs = topicOf(key).games ?? [];
      expect(specs.reduce((sum, spec) => sum + spec.count, 0), key).toBe(PALIER_SIZE);
      expect(sameSeq(specs.map((spec) => spec.kind as string).sort(), [...TOPIC_KINDS[key]].sort()), `${key} : ${specs.map((spec) => spec.kind).join(" ")}`).toBe(true);
      for (const spec of specs) {
        expect(Object.keys(GAME_KINDS), `${key} : ${spec.kind}`).toContain(spec.kind);
        expect(spec.vocabulary, `${key} : ${spec.kind}`).toBeUndefined();
      }
      expect(topicUsesModel(key), key).toBe(false);
    }
  });

  it("sont celles du CE2, et n'ont changé ni leur clé ni leur nombre de paliers", () => {
    for (const key of TOPIC_KEYS) {
      expect(entryOf(key).klass, key).toBe("CE2");
      expect(topicOf(key).palierCount, key).toBeUndefined();
    }
    expect(TOPIC_KEYS.slice().sort()).toEqual(["fr-ce2-cc", "fr-ce2-cod-coi", "fr-ce2-determinants", "fr-ce2-imparfait", "fr-ce2-imperatif-futur"]);
  });

  it("sont parmi les thématiques du CE2 que le modèle n'écrit plus", () => {
    const allCode = allProgrammeEntries()
      .filter((entry) => entry.klass === "CE2" && (entry.topic.games ?? []).reduce((sum, spec) => sum + spec.count, 0) >= PALIER_SIZE)
      .map((entry) => entry.topic.key);
    for (const key of TOPIC_KEYS) expect(allCode, key).toContain(key);
  });

  it("fabriquent des paliers entiers, de dix exercices, dont les gabarits sont tous différents, et qui passent le contrôleur et la grammaire", () => {
    for (const key of TOPIC_KEYS) {
      for (let n = 0; n < 30; n++) {
        for (const palierIndex of [1, 2, 3, 4]) {
          const games = generateGames(topicOf(key).games ?? [], { klass: "CE2", palierIndex, palierCount: 4, seed: `${key}:${n}:${palierIndex}` });
          expect(games, `${key} palier ${palierIndex}`).toHaveLength(PALIER_SIZE);
          const questions = games.map((game) => `${game.prompt}|${String(game.payload.text ?? "")}|${game.answerKey}`);
          expect(new Set(questions).size, `${key} #${n} palier ${palierIndex}`).toBe(questions.length);
          for (const game of games) {
            const defects = auditExercise({
              type: game.type,
              prompt: game.prompt,
              payload: game.payload,
              answerKey: game.answerKey,
              hints: game.hints,
              class: "CE2",
              subject: entryOf(key).subject.name,
            });
            expect(defects, `${key} palier ${palierIndex} : ${game.prompt}`).toEqual([]);
            const kind = (game.payload.game as { kind: string }).kind;
            expect(CHECKS[kind](game as unknown as Exo), `${key} palier ${palierIndex} ${kind} : ${game.prompt}`).toBeNull();
          }
        }
      }
    }
  });

  it("varient les types d'un palier : au moins cinq sortes d'exercices sur dix", () => {
    for (const key of TOPIC_KEYS) {
      for (const palierIndex of [1, 2, 3, 4]) {
        const games = generateGames(topicOf(key).games ?? [], { klass: "CE2", palierIndex, palierCount: 4, seed: key });
        expect(new Set(games.map((game) => game.type)).size, `${key} palier ${palierIndex}`).toBeGreaterThanOrEqual(5);
      }
    }
  });

  it("ne reposent pas la même question d'un palier à l'autre : chaque palier a sa part des lignes", () => {
    for (const key of TOPIC_KEYS) {
      let total = 0;
      let repeated = 0;
      for (let n = 0; n < 20; n++) {
        const seen = new Map<string, number>();
        for (const palierIndex of [1, 2, 3, 4]) {
          const games = generateGames(topicOf(key).games ?? [], { klass: "CE2", palierIndex, palierCount: 4, seed: `variete:${key}:${n}:${palierIndex}` });
          for (const game of games) {
            const kind = (game.payload.game as { kind: string }).kind;
            const items = game.payload.items as { text: string; correctZone: string }[] | undefined;
            const pairs = game.payload.pairs as { left: string; right: string }[] | undefined;
            const answer = items
              ? items.map((item) => `${item.text}>${item.correctZone}`).sort().join(";")
              : pairs
                ? pairs.map((pair) => `${pair.left}~${pair.right}`).sort().join(";")
                : game.answerKey;
            const question = `${kind}|${game.prompt}|${String(game.payload.text ?? "")}|${answer}`;
            total += 1;
            if (seen.has(question) && seen.get(question) !== palierIndex) repeated += 1;
            if (!seen.has(question)) seen.set(question, palierIndex);
          }
        }
      }
      expect(repeated / total, key).toBeLessThan(0.05);
    }
  });

  it("gardent de quoi servir la démo du site : un gabarit pour chaque type que sa banque d'exercices attend", () => {
    // La banque de la vitrine veut, sur une thématique tout en gabarits, un gabarit du type de chaque exercice de sa banque : le QCM, la phrase à
    // trous, le glissé et l'ordre ou l'appariement.
    const typesOf = (key: string) => new Set((topicOf(key).games ?? []).map((spec) => GAME_KINDS[spec.kind].type));
    for (const key of TOPIC_KEYS) {
      for (const type of ["qcm", "fill-blank", "drag-drop"]) expect(typesOf(key).has(type as never), `${key} : ${type}`).toBe(true);
      expect(typesOf(key).has("order" as never) || typesOf(key).has("match" as never), `${key} : ordre ou appariement`).toBe(true);
    }
  });

  it("refont chaque exercice raté par le code, sans le modèle", () => {
    for (const key of TOPIC_KEYS) {
      for (const spec of topicOf(key).games ?? []) {
        const origin = { kind: spec.kind, level: 3 };
        const again = regenerateGame(origin, "CE2", `reprise:${key}:${spec.kind}`);
        expect(again, spec.kind).not.toBeNull();
        expect(again!.type, spec.kind).toBe(GAME_KINDS[spec.kind].type);
      }
    }
  });
});
