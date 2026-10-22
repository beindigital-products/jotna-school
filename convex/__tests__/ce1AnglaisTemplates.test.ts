import { describe, expect, it, vi } from "vitest";
import { auditExercise } from "../paliers/exerciseAudit";
import { GAME_KINDS, generateGames, regenerateGame, type GameKind } from "../paliers/games";
import { makeContext, type GameLevel } from "../paliers/games/shared";
import { topicUsesModel } from "../paliers/pregen";
import { allProgrammeEntries } from "../programme";
import { PALIER_SIZE } from "../paliers/scoring";

// Ces tests jouent des milliers de tirages : sur le serveur de CI, chargé, l'un d'eux dépasse les 5 secondes par défaut.
vi.setConfig({ testTimeout: 30_000 });

/**
 * L'ANGLAIS DU CE1 : se présenter, les jours de la semaine, a ou an, les vêtements, j'aime et je n'aime pas, les ordres de la classe.
 *
 * Chaque test RECALCULE la bonne réponse, avec ses propres règles et ses propres tables, écrites à part : l'ordre des jours se compte sur
 * la semaine, « a » ou « an » se lit sur la première lettre, la couleur d'un vêtement se lit dans la phrase française, le sens d'une phrase
 * avec « like » se recompose mot à mot. Un gabarit dont la réponse contredit sa règle échoue. À la fin, des MUTATIONS : on abîme la bonne
 * réponse d'un exercice juste, et chaque vérification doit le voir. Sur l'échantillon de CE1 lu le 21 octobre 2026, 12 exercices
 * d'anglais sur 36 étaient faux (« Today is ___ » sans donnée, des phrases qui ne sont pas de l'anglais, des consignes en anglais).
 */

const LEVELS: GameLevel[] = [1, 2, 3, 4];
const draws = LEVELS.flatMap((level) => Array.from({ length: 60 }, (_, n) => ({ level, seed: `ce1en:${level}:${n}` })));
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

const fold = (text: string) => text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
const apostrophes = (text: string) => (text.match(/'/g) ?? []).length;
const wordCount = (text: string) => text.split(/\s+/).filter((token) => /[\p{L}\p{N}]/u.test(token)).length;
const same = (a: readonly string[], b: readonly string[]) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());

type Check = (exo: Exo) => string | null;
const ok = (condition: boolean, message: string) => (condition ? null : message);
const all = (...results: (string | null)[]) => results.find((result) => result !== null) ?? null;

// ===========================================================================
// LES RÈGLES ET LES TABLES, ÉCRITES À PART
// ===========================================================================

// --- Se présenter : chaque réponse a son type, reconnu par une expression ---
const NAMES = "Awa|Moussa|Fatou|Ibrahima|Aminata|Cheikh|Omar";
const REPLY_TYPES: Record<string, RegExp> = {
  name: new RegExp(`^My name is (${NAMES})\\.$`),
  fine: /^I am fine, thank you\.$/,
  old: /^I am (six|seven|eight|nine|ten)\.$/,
  from: /^I am from (Senegal|Mali|Guinea|Gambia|France)\.$/,
};
const QUESTION_TYPE: Record<string, string> = {
  "What is your name?": "name",
  "How are you?": "fine",
  "How old are you?": "old",
  "Where are you from?": "from",
};
const replyType = (text: string) => Object.keys(REPLY_TYPES).find((type) => REPLY_TYPES[type].test(text));
const quoted = (prompt: string) => /«\s(.+?)\s»/u.exec(prompt)?.[1];

// --- Les jours : leur rang dans la semaine ---
const WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const WEEK_FR = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
const rank = (day: string) => WEEK.indexOf(day);

// --- a ou an : une voyelle écrite ouvre « an », sur ces mots sans exception (ni hour, ni university) ---
const aanFor = (word: string) => ("aeiou".includes(word[0]) ? "an" : "a");
const NOUNS_A_AN = ["dog", "cat", "bird", "fish", "cow", "goat", "horse", "monkey", "lion", "banana", "mango", "lemon", "book", "pen", "pencil", "bag", "ruler", "desk", "chair", "board", "door", "window", "head", "nose", "mouth", "hand", "leg", "apple", "orange", "egg", "elephant", "arm", "ear", "eye"];

// --- Les vêtements : ce que dit chaque phrase française ---
const CLOTHES_FR: Record<string, [string, string]> = {
  "une robe rouge": ["red", "dress"],
  "un tee-shirt bleu": ["blue", "T-shirt"],
  "une jupe verte": ["green", "skirt"],
  "un chapeau noir": ["black", "hat"],
  "une chemise blanche": ["white", "shirt"],
  "une casquette jaune": ["yellow", "cap"],
  "un boubou rose": ["pink", "boubou"],
  "une robe bleue": ["blue", "dress"],
  "un tee-shirt jaune": ["yellow", "T-shirt"],
  "une jupe rose": ["pink", "skirt"],
  "un chapeau vert": ["green", "hat"],
  "une chemise rouge": ["red", "shirt"],
  "une casquette noire": ["black", "cap"],
  "un boubou blanc": ["white", "boubou"],
};
const CLOTHES_WORDS: Record<string, string> = {
  "le tee-shirt": "T-shirt",
  "la chemise": "shirt",
  "le pantalon": "trousers",
  "la jupe": "skirt",
  "la robe": "dress",
  "les chaussures": "shoes",
  "les chaussettes": "socks",
  "le chapeau": "hat",
  "la casquette": "cap",
  "le boubou": "boubou",
};
const CLOTHES_EMOJI: Record<string, string> = { "👕": "T-shirt", "👗": "dress", "👟": "shoes", "🧦": "socks", "🧢": "cap" };
const CLOTHES_FR_WORD: Record<string, string> = {
  "tee-shirt": "T-shirt",
  chemise: "shirt",
  pantalon: "trousers",
  jupe: "skirt",
  robe: "dress",
  chaussures: "shoes",
  chaussettes: "socks",
  chapeau: "hat",
  casquette: "cap",
  boubou: "boubou",
};

// --- J'aime : les aliments et leur français ---
const FOOD_FR: Record<string, string> = { rice: "le riz", fish: "le poisson", bread: "le pain", chicken: "le poulet", milk: "le lait", water: "l'eau", mango: "la mangue" };
const FOODS = Object.keys(FOOD_FR);
const FOOD_ALT = FOODS.join("|");

// --- Les ordres de la classe ---
const ORDER_FR: Record<string, string> = {
  "lève-toi": "stand up",
  "assieds-toi": "sit down",
  "ouvre ton livre": "open your book",
  "ferme ton livre": "close your book",
  regarde: "look",
  écoute: "listen",
  écris: "write",
  lis: "read",
  "viens ici": "come here",
  "tais-toi": "be quiet",
};
const ORDER_EMOJI: Record<string, string> = { "📖": "open your book", "📕": "close your book", "👀": "look", "👂": "listen", "🤫": "be quiet" };
const SITUATIONS: Record<string, string> = {
  "se lève": "stand up",
  "s'asseye": "sit down",
  "ouvres ton livre": "open your book",
  "fermes ton livre": "close your book",
  regardes: "look",
  écoutes: "listen",
  écrives: "write",
  lises: "read",
  viennes: "come here",
  silence: "be quiet",
};

// ===========================================================================
// LES VÉRIFICATIONS : une par gabarit
// ===========================================================================

type Row = readonly [string, string, readonly string[]];
const checkGapTable =
  (table: readonly Row[]): Check =>
  (exo) => {
    const row = table.find((entry) => entry[0] === textOf(exo) && entry[1] === blankOf(exo).answer);
    if (!row) return `phrase inconnue : ${textOf(exo)} → ${blankOf(exo).answer}`;
    return ok(same(blankOf(exo).options, [row[1], ...row[2]]), `les choix : ${blankOf(exo).options.join(" | ")}`);
  };

const WHO_GAP_TABLE: readonly Row[] = [
  ["What is your ___? My name is Awa.", "name", ["old", "from"]],
  ["How ___ are you? I am eight.", "old", ["name", "fine"]],
  ["Where are you ___? I am from Mali.", "from", ["old", "fine"]],
  ["How are you? I am ___, thank you.", "fine", ["name", "from"]],
  ["My ___ is Moussa.", "name", ["old", "fine"]],
  ["I ___ eight.", "am", ["is", "are"]],
  ["I am ___ Senegal.", "from", ["old", "fine"]],
  ["How ___ you?", "are", ["am", "is"]],
  ["What is your name? ___ name is Fatou.", "My", ["Your", "Am"]],
  ["How ___ are you? I am nine.", "old", ["name", "from"]],
  ["Where are you from? I ___ from France.", "am", ["is", "are"]],
  ["I am fine, ___ you.", "thank", ["name", "from"]],
];
const LIKES_GAP_TABLE: readonly Row[] = [
  ["I ___ rice.", "like", ["am", "do"]],
  ["Do you like mango? Yes, I ___.", "do", ["like", "am"]],
  ["I ___ fish.", "like", ["am", "is"]],
  ["___ you like bread?", "Do", ["Am", "Is"]],
  ["I do not ___ fish.", "like", ["am", "is"]],
  ["Do you like bread? No, I do ___.", "not", ["like", "am"]],
  ["I do ___ like milk.", "not", ["am", "is"]],
  ["Do you like water? Yes, I ___.", "do", ["like", "are"]],
  ["___ you like chicken?", "Do", ["Am", "Is"]],
  ["I do not like mango. I ___ rice.", "like", ["am", "not"]],
  ["Do you like fish? No, I do ___.", "not", ["like", "are"]],
  ["I ___ not like water.", "do", ["am", "is"]],
];
const CMD_GAP_TABLE: readonly Row[] = [
  ["Open your ___, please.", "book", ["pen", "bag"]],
  ["Stand ___, please.", "up", ["down", "here"]],
  ["Sit ___, please.", "down", ["up", "here"]],
  ["Come ___, please.", "here", ["up", "down"]],
  ["___ your book, please.", "Close", ["Open", "Read"]],
  ["Be ___, please.", "quiet", ["up", "here"]],
];
const CMD_GAP_PROMPT: Record<string, string> = {
  book: "ouvre ton livre",
  up: "lève-toi",
  down: "assieds-toi",
  here: "viens ici",
  Close: "ferme ton livre",
  quiet: "tais-toi",
};

const checkSteps =
  (valid: (sequence: string[]) => boolean, what: string): Check =>
  (exo) =>
    ok(valid(sequenceOf(exo)), `${what} : ${sequenceOf(exo).join(" ")}`);
const checkLinks =
  (valid: (left: string, right: string) => boolean): Check =>
  (exo) => {
    for (const pair of pairsOf(exo)) if (!valid(pair.left, pair.right)) return `« ${pair.left} » relié à « ${pair.right} »`;
    return ok(pairsOf(exo).length === 3, "trois paires");
  };
const checkSort =
  (zones: readonly [string, string], zoneOf: (tile: string) => string | undefined): Check =>
  (exo) => {
    for (const item of itemsOf(exo)) if (zoneOf(item.text) !== item.correctZone) return `« ${item.text} » rangé dans « ${item.correctZone} », la règle dit « ${zoneOf(item.text)} »`;
    return all(
      ok(same(zonesOf(exo), zones), `cases ${zonesOf(exo).join(" | ")}`),
      ok(zones.every((zone) => itemsOf(exo).some((item) => item.correctZone === zone)), "chaque case reçoit au moins une étiquette"),
      ok(itemsOf(exo).length >= 4 && itemsOf(exo).length <= 5, `${itemsOf(exo).length} étiquettes`),
    );
  };
const sentenceOk = (sequence: string[], valid: RegExp) => valid.test(sequence.join(" ")) && /^[A-Z]/u.test(sequence[0]) && /[.?]$/u.test(sequence[sequence.length - 1]);

const CHECKS: Record<string, Check> = {
  // --- Se présenter ---
  "ce1-en-who-reponse": (exo) => {
    const question = quoted(exo.prompt) ?? (/Tu rencontres un ami|Ta maîtresse te dit/u.test(exo.prompt) ? "How are you?" : undefined);
    const type = question ? QUESTION_TYPE[question] : undefined;
    if (!type) return `question inconnue : ${exo.prompt}`;
    return all(
      ok(replyType(rightOption(exo)) === type, `la bonne réponse « ${rightOption(exo)} » n'est pas de type ${type}`),
      ok(wrongOf(exo).length === 2 && wrongOf(exo).every((option) => replyType(option) !== undefined && replyType(option) !== type), `mauvais choix ${wrongOf(exo).join(" | ")}`),
    );
  },
  "ce1-en-who-question": (exo) => {
    const reply = quoted(exo.prompt);
    const type = reply ? replyType(reply) : undefined;
    if (!type) return `réponse inconnue : ${exo.prompt}`;
    return all(
      ok(QUESTION_TYPE[rightOption(exo)] === type, `la bonne question « ${rightOption(exo)} » n'appelle pas ${reply}`),
      ok(wrongOf(exo).every((option) => QUESTION_TYPE[option] !== undefined && QUESTION_TYPE[option] !== type), `mauvais choix ${wrongOf(exo).join(" | ")}`),
    );
  },
  "ce1-en-who-relier": checkLinks((left, right) => QUESTION_TYPE[left] !== undefined && replyType(right) === QUESTION_TYPE[left]),
  "ce1-en-who-trou": checkGapTable(WHO_GAP_TABLE),
  "ce1-en-who-ordre": checkSteps((s) => {
    const [first, second, third] = s;
    const greet = first === "Hello." && QUESTION_TYPE[second] !== undefined && replyType(third) === QUESTION_TYPE[second];
    const bye = QUESTION_TYPE[first] !== undefined && replyType(second) === QUESTION_TYPE[first] && third === "Goodbye.";
    return s.length === 3 && (greet || bye);
  }, "dialogue"),
  "ce1-en-who-phrase": checkSteps(
    (s) => sentenceOk(s, new RegExp(`^(My name is (${NAMES})\\.|I am (six|seven|eight|nine|ten)\\.|I am from (Senegal|Mali|Guinea|Gambia|France)\\.|I am fine, thank you\\.|What is your name\\?|How are you\\?|How old are you\\?|Where are you from\\?)$`)),
    "phrase",
  ),
  "ce1-en-who-glisser": checkSort(["Prénom", "Pays"], (tile) => (NAMES.split("|").includes(tile) ? "Prénom" : ["Senegal", "Mali", "Guinea", "Gambia", "France"].includes(tile) ? "Pays" : undefined)),

  // --- Les jours ---
  "ce1-en-days-ordre": checkSteps((s) => s.length >= 3 && s.every((day, i) => rank(day) >= 0 && (i === 0 || rank(day) === rank(s[i - 1]) + 1)), "jours"),
  "ce1-en-days-apres": (exo) => {
    const match = /^Quel jour vient juste (après|avant) (\w+) \?$/u.exec(exo.prompt);
    if (!match || rank(match[2]) < 0) return `question inconnue : ${exo.prompt}`;
    const target = rank(match[2]) + (match[1] === "après" ? 1 : -1);
    return all(
      ok(rightOption(exo) === WEEK[target], `la bonne option est « ${rightOption(exo)} », la semaine dit « ${WEEK[target]} »`),
      ok(wrongOf(exo).length === 2 && wrongOf(exo).every((day) => rank(day) >= 0), `mauvais choix ${wrongOf(exo).join(" | ")}`),
    );
  },
  "ce1-en-days-trou": (exo) => {
    const match = /^(Today|Tomorrow) is (\w+)\. (Today|Tomorrow) is ___\.$/u.exec(textOf(exo));
    if (!match || match[1] === match[3] || rank(match[2]) < 0) return `phrase inconnue : ${textOf(exo)}`;
    const want = rank(match[2]) + (match[1] === "Today" ? 1 : -1);
    return all(
      ok(blankOf(exo).answer === WEEK[want], `le trou veut « ${WEEK[want]} », il dit « ${blankOf(exo).answer} »`),
      ok(blankOf(exo).options.length === 3 && blankOf(exo).options.every((day) => rank(day) >= 0), `choix ${blankOf(exo).options.join(" | ")}`),
    );
  },
  "ce1-en-days-ecrire": (exo) => {
    const match = /\s(Today|Tomorrow) is (\w+)\. (Today|Tomorrow) is ___\.$/u.exec(exo.prompt);
    if (!match || match[1] === match[3] || rank(match[2]) < 0) return `énoncé inconnu : ${exo.prompt}`;
    const want = WEEK[rank(match[2]) + (match[1] === "Today" ? 1 : -1)];
    return ok(acceptedOf(exo)[0] === want && exo.answerKey === want && acceptedOf(exo).length === 1, `le jour juste est « ${want} », le gabarit dit « ${acceptedOf(exo).join(" | ")} »`);
  },
  "ce1-en-days-relier": checkLinks((left, right) => WEEK_FR.indexOf(left) >= 0 && WEEK_FR.indexOf(left) === rank(right)),
  "ce1-en-days-glisser": checkSort(["Du lundi au vendredi", "Week-end"], (tile) => (rank(tile) < 0 ? undefined : rank(tile) <= 4 ? "Du lundi au vendredi" : "Week-end")),
  "ce1-en-days-phrase": checkSteps((s) => sentenceOk(s, new RegExp(`^(Today|Tomorrow) is (${WEEK.join("|")})\\.$`)), "phrase"),

  // --- A ou an ---
  "ce1-en-aan-glisser": checkSort(["a", "an"], (tile) => (NOUNS_A_AN.includes(tile) ? aanFor(tile) : undefined)),
  "ce1-en-aan-phrase": (exo) => {
    const match = /^It is (an?) (\w+)\.$/u.exec(rightOption(exo));
    if (!match || !NOUNS_A_AN.includes(match[2])) return `bonne phrase inconnue : ${rightOption(exo)}`;
    const word = match[2];
    return all(
      ok(match[1] === aanFor(word), `« ${rightOption(exo)} » : le petit mot juste est « ${aanFor(word)} »`),
      ok(same(wrongOf(exo), [`It is ${aanFor(word) === "a" ? "an" : "a"} ${word}.`, `It is ${word}.`]), `mauvais choix ${wrongOf(exo).join(" | ")}`),
    );
  },
  "ce1-en-aan-trou": (exo) => {
    const word = /« (\w+) »/u.exec(exo.prompt)?.[1];
    if (!word || !NOUNS_A_AN.includes(word)) return `mot inconnu : ${exo.prompt}`;
    return all(
      ok(blankOf(exo).answer === `${aanFor(word)} ${word}`, `le trou veut « ${aanFor(word)} ${word} », il dit « ${blankOf(exo).answer} »`),
      ok(same(blankOf(exo).options, [`${aanFor(word)} ${word}`, `${aanFor(word) === "a" ? "an" : "a"} ${word}`, word]), `choix ${blankOf(exo).options.join(" | ")}`),
    );
  },
  "ce1-en-aan-ordre": checkSteps((s) => {
    const noun = s[3]?.replace(".", "");
    return s.length === 4 && s[0] === "It" && s[1] === "is" && NOUNS_A_AN.includes(noun) && s[2] === aanFor(noun) && s[3].endsWith(".");
  }, "phrase"),
  "ce1-en-aan-relier": checkLinks((left, right) => NOUNS_A_AN.includes(left) && right === `It is ${aanFor(left)} ${left}.`),
  "ce1-en-aan-ecrire": (exo) => {
    const word = /___ (\w+)\.$/u.exec(exo.prompt)?.[1];
    if (!word || !NOUNS_A_AN.includes(word)) return `mot inconnu : ${exo.prompt}`;
    return ok(acceptedOf(exo)[0] === aanFor(word) && exo.answerKey === aanFor(word) && acceptedOf(exo).length === 1, `le petit mot juste est « ${aanFor(word)} », le gabarit dit « ${acceptedOf(exo).join(" | ")} »`);
  },

  // --- Les vêtements ---
  "ce1-en-clothes-mot": (exo) => {
    const emoji = /\n(.+)$/u.exec(exo.prompt)?.[1];
    const word = emoji ? CLOTHES_EMOJI[emoji] : undefined;
    if (!word) return `dessin inconnu : ${exo.prompt}`;
    return all(ok(rightOption(exo) === word, `la bonne option est « ${rightOption(exo)} », le dessin dit « ${word} »`), ok(wrongOf(exo).every((option) => Object.values(CLOTHES_EMOJI).includes(option)), `mauvais choix ${wrongOf(exo).join(" | ")}`));
  },
  "ce1-en-clothes-francais": (exo) => {
    const french = /« (.+) »/u.exec(exo.prompt)?.[1];
    const word = french ? CLOTHES_WORDS[french] : undefined;
    if (!word) return `mot inconnu : ${exo.prompt}`;
    return all(ok(rightOption(exo) === word, `la bonne option est « ${rightOption(exo)} », le français dit « ${word} »`), ok(wrongOf(exo).every((option) => Object.values(CLOTHES_WORDS).includes(option)), `mauvais choix ${wrongOf(exo).join(" | ")}`));
  },
  "ce1-en-clothes-relier": checkLinks((left, right) => CLOTHES_EMOJI[left] === right || CLOTHES_FR_WORD[left] === right),
  "ce1-en-clothes-couleur": (exo) => {
    const french = /« (.+) »/u.exec(exo.prompt)?.[1];
    const outfit = french ? CLOTHES_FR[french] : undefined;
    if (!outfit) return `phrase inconnue : ${exo.prompt}`;
    const [colour, noun] = outfit;
    return all(
      ok(rightOption(exo) === `It is a ${colour} ${noun}.`, `la bonne phrase est « It is a ${colour} ${noun}. », le gabarit dit « ${rightOption(exo)} »`),
      ok(same(wrongOf(exo), [`It is a ${noun} ${colour}.`, `It is ${colour} a ${noun}.`]), `mauvais choix ${wrongOf(exo).join(" | ")}`),
    );
  },
  "ce1-en-clothes-phrase": checkSteps((s) => {
    const colours = ["red", "blue", "yellow", "green", "black", "white", "pink"];
    const nouns = ["dress", "T-shirt", "skirt", "hat", "shirt", "cap", "boubou"];
    return s.length === 5 && s[0] === "It" && s[1] === "is" && s[2] === "a" && colours.includes(s[3]) && nouns.includes(s[4].replace(".", "")) && s[4].endsWith(".");
  }, "phrase"),
  "ce1-en-clothes-trou": (exo) => {
    const french = /« (.+) »/u.exec(exo.prompt)?.[1];
    const outfit = french ? CLOTHES_FR[french] : undefined;
    if (!outfit) return `phrase inconnue : ${exo.prompt}`;
    return all(
      ok(textOf(exo) === `It is a ___ ${outfit[1]}.`, `le texte est « ${textOf(exo)} »`),
      ok(blankOf(exo).answer === outfit[0], `le trou veut « ${outfit[0]} », il dit « ${blankOf(exo).answer} »`),
      ok(blankOf(exo).options.length === 3 && !blankOf(exo).options.includes("orange"), `choix ${blankOf(exo).options.join(" | ")}`),
    );
  },
  "ce1-en-clothes-trou-mot": (exo) => {
    const french = /« (.+) »/u.exec(exo.prompt)?.[1];
    const word = french ? CLOTHES_WORDS[french] : undefined;
    if (!word || ["trousers", "shoes", "socks"].includes(word)) return `mot inconnu : ${exo.prompt}`;
    return all(
      ok(textOf(exo) === "It is a ___.", "texte"),
      ok(blankOf(exo).answer === word, `le trou veut « ${word} », il dit « ${blankOf(exo).answer} »`),
      ok(blankOf(exo).options.every((option) => Object.values(CLOTHES_WORDS).includes(option)), `choix ${blankOf(exo).options.join(" | ")}`),
    );
  },

  // --- J'aime, je n'aime pas ---
  "ce1-en-likes-trou": checkGapTable(LIKES_GAP_TABLE),
  "ce1-en-likes-reponse": (exo) => {
    const food = new RegExp(`Do you like (${FOOD_ALT})\\?`, "u").exec(exo.prompt)?.[1];
    if (!food) return `question inconnue : ${exo.prompt}`;
    const yes = exo.prompt.includes(`Tu aimes ${FOOD_FR[food]}.`);
    const no = exo.prompt.includes(`Tu n'aimes pas ${FOOD_FR[food]}.`);
    if (yes === no) return `ni oui ni non : ${exo.prompt}`;
    return all(
      ok(rightOption(exo) === (yes ? "Yes, I do." : "No, I do not."), `la bonne réponse est « ${yes ? "Yes, I do." : "No, I do not."} », le gabarit dit « ${rightOption(exo)} »`),
      ok(same(wrongOf(exo), yes ? ["Yes, I like.", "No, I do."] : ["No, I do.", "Yes, I do not."]), `mauvais choix ${wrongOf(exo).join(" | ")}`),
    );
  },
  "ce1-en-likes-sens": (exo) => {
    const match = new RegExp(`« (I like|I do not like|Do you like) (${FOOD_ALT})[.?] »`, "u").exec(exo.prompt);
    if (!match) return `phrase inconnue : ${exo.prompt}`;
    const fr = FOOD_FR[match[2]];
    const want = match[1] === "I like" ? `J'aime ${fr}.` : match[1] === "I do not like" ? `Je n'aime pas ${fr}.` : `Tu aimes ${fr} ?`;
    return all(ok(rightOption(exo) === want, `le sens juste est « ${want} », le gabarit dit « ${rightOption(exo)} »`), ok(wrongOf(exo).length === 2 && !wrongOf(exo).includes(want), `mauvais choix ${wrongOf(exo).join(" | ")}`));
  },
  "ce1-en-likes-phrase": checkSteps((s) => sentenceOk(s, new RegExp(`^(I like (${FOOD_ALT})\\.|I do not like (${FOOD_ALT})\\.|Do you like (${FOOD_ALT})\\?)$`)), "phrase"),
  "ce1-en-likes-relier": checkLinks((left, right) => {
    const match = new RegExp(`^(I like|I do not like|Do you like) (${FOOD_ALT})[.?]$`).exec(left);
    if (!match) return false;
    const fr = FOOD_FR[match[2]];
    return right === (match[1] === "I like" ? `J'aime ${fr}.` : match[1] === "I do not like" ? `Je n'aime pas ${fr}.` : `Tu aimes ${fr} ?`);
  }),
  "ce1-en-likes-glisser": checkSort(["J'aime", "Je n'aime pas"], (tile) => {
    const match = new RegExp(`^I (do not )?like (${FOOD_ALT})\\.$`).exec(tile);
    return match ? (match[1] ? "Je n'aime pas" : "J'aime") : undefined;
  }),

  // --- Les ordres de la classe ---
  "ce1-en-cmd-mot": (exo) => {
    const emoji = /\n(.+)$/u.exec(exo.prompt)?.[1];
    const word = emoji ? ORDER_EMOJI[emoji] : undefined;
    if (!word) return `dessin inconnu : ${exo.prompt}`;
    return all(ok(rightOption(exo) === word, `la bonne option est « ${rightOption(exo)} », le dessin dit « ${word} »`), ok(wrongOf(exo).every((option) => Object.values(ORDER_EMOJI).includes(option)), `mauvais choix ${wrongOf(exo).join(" | ")}`));
  },
  "ce1-en-cmd-francais": (exo) => {
    const french = /« (.+) »/u.exec(exo.prompt)?.[1];
    const word = french ? ORDER_FR[french] : undefined;
    if (!word) return `ordre inconnu : ${exo.prompt}`;
    return all(ok(rightOption(exo) === word, `la bonne option est « ${rightOption(exo)} », le français dit « ${word} »`), ok(wrongOf(exo).every((option) => Object.values(ORDER_FR).includes(option)), `mauvais choix ${wrongOf(exo).join(" | ")}`));
  },
  "ce1-en-cmd-relier": checkLinks((left, right) => ORDER_EMOJI[left] === right || ORDER_FR[left] === right),
  "ce1-en-cmd-situation": (exo) => {
    const key = Object.keys(SITUATIONS).find((cue) => exo.prompt.includes(cue));
    if (!key) return `situation inconnue : ${exo.prompt}`;
    return all(
      ok(rightOption(exo) === SITUATIONS[key], `la bonne option est « ${rightOption(exo)} », la situation dit « ${SITUATIONS[key]} »`),
      ok(wrongOf(exo).length === 2 && wrongOf(exo).every((option) => Object.values(SITUATIONS).includes(option)), `mauvais choix ${wrongOf(exo).join(" | ")}`),
    );
  },
  "ce1-en-cmd-phrase": checkSteps((s) => sentenceOk(s, /^(Stand up|Sit down|Open your book|Close your book|Come here|Be quiet), please\.$/) && s.length >= 3, "phrase"),
  "ce1-en-cmd-trou": (exo) => {
    const asked = /« (.+) »/u.exec(exo.prompt)?.[1];
    const answer = blankOf(exo).answer;
    if (CMD_GAP_PROMPT[answer] !== asked) return `l'énoncé dit « ${asked} », le mot juste « ${answer} » dit « ${CMD_GAP_PROMPT[answer]} »`;
    return checkGapTable(CMD_GAP_TABLE)(exo);
  },
  "ce1-en-cmd-glisser": checkSort(["Avec mon livre", "Avec mon corps"], (tile) => (["open your book", "close your book", "read"].includes(tile) ? "Avec mon livre" : ["stand up", "sit down", "come here"].includes(tile) ? "Avec mon corps" : undefined)),
};

const KINDS = Object.keys(CHECKS) as GameKind[];
const TOPIC_KINDS: Record<string, string[]> = {
  "an-ce1-who": ["ce1-en-who-reponse", "ce1-en-who-question", "ce1-en-who-relier", "ce1-en-who-trou", "ce1-en-who-ordre", "ce1-en-who-phrase", "ce1-en-who-glisser"],
  "an-ce1-days": ["ce1-en-days-ordre", "ce1-en-days-apres", "ce1-en-days-trou", "ce1-en-days-ecrire", "ce1-en-days-relier", "ce1-en-days-glisser", "ce1-en-days-phrase"],
  "an-ce1-a-an": ["ce1-en-aan-glisser", "ce1-en-aan-phrase", "ce1-en-aan-trou", "ce1-en-aan-ordre", "ce1-en-aan-relier", "ce1-en-aan-ecrire"],
  "an-ce1-clothes": ["ce1-en-clothes-mot", "ce1-en-clothes-francais", "ce1-en-clothes-relier", "ce1-en-clothes-couleur", "ce1-en-clothes-phrase", "ce1-en-clothes-trou", "ce1-en-clothes-trou-mot"],
  "an-ce1-likes": ["ce1-en-likes-trou", "ce1-en-likes-reponse", "ce1-en-likes-sens", "ce1-en-likes-phrase", "ce1-en-likes-relier", "ce1-en-likes-glisser"],
  "an-ce1-commands": ["ce1-en-cmd-mot", "ce1-en-cmd-francais", "ce1-en-cmd-relier", "ce1-en-cmd-situation", "ce1-en-cmd-phrase", "ce1-en-cmd-trou", "ce1-en-cmd-glisser"],
};
const PALIER_COUNT: Record<string, number> = { "an-ce1-who": 3, "an-ce1-days": 2, "an-ce1-a-an": 3, "an-ce1-clothes": 2, "an-ce1-likes": 3, "an-ce1-commands": 2 };
const TOPIC_KEYS = Object.keys(TOPIC_KINDS);
const entryOf = (key: string) => allProgrammeEntries().find((entry) => entry.topic.key === key)!;
const topicOf = (key: string) => entryOf(key).topic;

describe("chaque gabarit d'anglais du CE1 a sa vérification", () => {
  it("couvre exactement les quarante gabarits, tous rangés dans une thématique", () => {
    expect(KINDS).toHaveLength(40);
    expect(Object.values(TOPIC_KINDS).flat().sort()).toEqual([...KINDS].sort());
    for (const kind of KINDS) expect(Object.keys(GAME_KINDS), kind).toContain(kind);
  });
});

describe("les gabarits d'anglais du CE1 recalculent juste, depuis des règles et des tables écrites à part", () => {
  for (const kind of KINDS) {
    it(`${kind} : la bonne réponse se lit dans la règle, à tous les niveaux`, () => {
      for (const d of draws) {
        const exo = make(kind, d) as unknown as Exo;
        expect(CHECKS[kind](exo), `${kind} niveau ${d.level} : ${exo.prompt}`).toBeNull();
      }
    });
  }
});

// ===========================================================================
// LES MUTATIONS
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
      payload.acceptedAnswers = ["zzz"];
      return { ...copy(), answerKey: "zzz" };
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

  it("voient aussi un énoncé abîmé : la couleur après le nom, un « an » devant une consonne, un jour de trop", () => {
    const colour = make("ce1-en-clothes-couleur" as GameKind, { level: 1, seed: "mut-colour" }) as unknown as Exo;
    const broken = JSON.parse(JSON.stringify(colour)) as Exo;
    broken.payload.correctIndex = optionsOf(broken).findIndex((option) => option !== rightOption(broken));
    expect(CHECKS["ce1-en-clothes-couleur"](colour)).toBeNull();
    expect(CHECKS["ce1-en-clothes-couleur"](broken)).not.toBeNull();
    expect(CHECKS["ce1-en-aan-phrase"]({ ...colour, payload: { options: ["It is an dog.", "It is a dog.", "It is dog."], correctIndex: 0 } })).not.toBeNull();
    expect(CHECKS["ce1-en-days-ordre"]({ ...colour, payload: { correctSequence: ["Monday", "Wednesday", "Tuesday"] } })).not.toBeNull();
  });
});

// ===========================================================================
// LES RÈGLES COMMUNES
// ===========================================================================

/** Les quatre gabarits qui écrivent un dessin à nommer, et nulle part ailleurs. */
const DRAWN_KINDS = ["ce1-en-clothes-mot", "ce1-en-clothes-relier", "ce1-en-cmd-mot", "ce1-en-cmd-relier"];

describe("tous les gabarits d'anglais du CE1", () => {
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

  it("n'écrivent un émoji que sur un dessin à nommer, jamais dans un indice, jamais suivi de U+FE0F", () => {
    for (const { kind, exo } of exos) {
      for (const text of texts(exo)) {
        expect(text.includes("\uFE0F"), `${kind} : « ${text} »`).toBe(false);
        if (!DRAWN_KINDS.includes(kind)) expect(/\p{Extended_Pictographic}/u.test(text), `${kind} : « ${text} »`).toBe(false);
      }
      if (!DRAWN_KINDS.includes(kind)) expect(/\p{Extended_Pictographic}/u.test(exo.prompt), `${kind} : ${exo.prompt}`).toBe(false);
      for (const hint of exo.hints) expect(/\p{Extended_Pictographic}/u.test(hint), `${kind} : « ${hint} »`).toBe(false);
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
        expect(new Set(pairs.map((pair) => pair.left)).size, kind).toBe(3);
        expect(new Set(pairs.map((pair) => pair.right)).size, kind).toBe(3);
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
      const a = GAME_KINDS[kind].make(makeContext("CE1", 2, "graine"));
      const b = GAME_KINDS[kind].make(makeContext("CE1", 2, "graine"));
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
        subject: "Anglais",
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

  it("ne mettent jamais une étiquette de glissé ou un mot de choix d'un mot avec un article français en tête", () => {
    for (const { kind, exo } of exos) {
      const tiles = [...(exo.payload.items ? itemsOf(exo).map((item) => item.text) : []), ...(exo.payload.options && !/\s/u.test(rightOption(exo)) ? optionsOf(exo) : [])];
      for (const text of tiles) expect(text, `${kind} : « ${text} »`).not.toMatch(/^(?:le|la|les|l'|un|une|des|du|de la|de l') /iu);
    }
  });
});

// ===========================================================================
// LES THÉMATIQUES DU PROGRAMME
// ===========================================================================

describe("les six thématiques d'anglais du CE1", () => {
  it("remplissent les dix places du palier, avec des jeux connus, sans appeler le modèle", () => {
    for (const key of TOPIC_KEYS) {
      const specs = topicOf(key).games ?? [];
      expect(specs.reduce((sum, spec) => sum + spec.count, 0), key).toBe(PALIER_SIZE);
      expect([...specs.map((spec) => spec.kind as string)].sort(), key).toEqual([...TOPIC_KINDS[key]].sort());
      for (const spec of specs) {
        expect(Object.keys(GAME_KINDS), `${key} : ${spec.kind}`).toContain(spec.kind);
        expect(spec.vocabulary, `${key} : ${spec.kind}`).toBeUndefined();
      }
      expect(topicUsesModel(key), key).toBe(false);
    }
  });

  it("sont celles du CE1, et gardent leur clé et leur nombre de paliers", () => {
    for (const key of TOPIC_KEYS) {
      expect(entryOf(key).klass, key).toBe("CE1");
      expect(topicOf(key).palierCount, key).toBe(PALIER_COUNT[key]);
    }
    expect(TOPIC_KEYS).toHaveLength(6);
  });

  it("fabriquent des paliers entiers, de dix exercices, qui passent le contrôleur et la règle, à chacun de leurs paliers", () => {
    for (const key of TOPIC_KEYS) {
      const count = PALIER_COUNT[key];
      for (let n = 0; n < 30; n++) {
        for (let palierIndex = 1; palierIndex <= count; palierIndex++) {
          const games = generateGames(topicOf(key).games ?? [], { klass: "CE1", palierIndex, palierCount: count, seed: `${key}:${n}:${palierIndex}` });
          expect(games, `${key} palier ${palierIndex}`).toHaveLength(PALIER_SIZE);
          const questions = games.map((game) => `${game.prompt}|${JSON.stringify(game.payload)}`);
          expect(new Set(questions).size, `${key} #${n} palier ${palierIndex}`).toBe(questions.length);
          expect(new Set(games.map((game) => game.type)).size, `${key} palier ${palierIndex}`).toBeGreaterThanOrEqual(4);
          for (const game of games) {
            const defects = auditExercise({ type: game.type, prompt: game.prompt, payload: game.payload, answerKey: game.answerKey, hints: game.hints, class: "CE1", subject: "Anglais" });
            expect(defects, `${key} palier ${palierIndex} : ${game.prompt}`).toEqual([]);
            const kind = (game.payload.game as { kind: string }).kind;
            expect(CHECKS[kind](game as unknown as Exo), `${key} palier ${palierIndex} ${kind} : ${game.prompt}`).toBeNull();
          }
        }
      }
    }
  });

  it("ne posent pas, dans un palier, deux phrases à trou qui se complètent par le même mot", () => {
    for (const key of TOPIC_KEYS) {
      for (let n = 0; n < 40; n++) {
        for (let palierIndex = 1; palierIndex <= PALIER_COUNT[key]; palierIndex++) {
          const games = generateGames(topicOf(key).games ?? [], { klass: "CE1", palierIndex, palierCount: PALIER_COUNT[key], seed: `gap:${key}:${n}:${palierIndex}` });
          const answers = games.filter((game) => game.type === "fill-blank").map((game) => (game.payload.blanks as { answer: string }[])[0].answer);
          expect(new Set(answers).size, `${key} palier ${palierIndex} : ${answers.join(" ")}`).toBe(answers.length);
        }
      }
    }
  });

  it("ne posent pas, dans un palier, deux fois la même question d'un même gabarit", () => {
    for (const key of TOPIC_KEYS) {
      const twice = (topicOf(key).games ?? []).filter((spec) => spec.count >= 2).map((spec) => spec.kind as string);
      for (let n = 0; n < 40; n++) {
        for (let palierIndex = 1; palierIndex <= PALIER_COUNT[key]; palierIndex++) {
          const games = generateGames(topicOf(key).games ?? [], { klass: "CE1", palierIndex, palierCount: PALIER_COUNT[key], seed: `twice:${key}:${n}:${palierIndex}` });
          for (const kind of twice) {
            const mine = games.filter((game) => (game.payload.game as { kind: string }).kind === kind);
            const asked = mine.map((game) => `${game.prompt}|${game.answerKey}|${game.type === "fill-blank" ? String(game.payload.text) : ""}`);
            expect(new Set(asked).size, `${key} palier ${palierIndex} ${kind} : ${asked.join(" | ")}`).toBe(asked.length);
          }
        }
      }
    }
  });

  it("servent toutes les lignes de leurs tableaux : aucune n'est perdue entre les paliers", () => {
    // Le nombre de questions différentes que chaque gabarit pose, sur tous les paliers de sa thématique et assez de graines.
    const EXPECTED: Record<string, number> = {
      "ce1-en-who-reponse": 12,
      "ce1-en-who-question": 12,
      "ce1-en-who-trou": 12,
      "ce1-en-who-ordre": 3,
      "ce1-en-who-phrase": 12,
      "ce1-en-days-ordre": 6,
      "ce1-en-days-apres": 12,
      "ce1-en-days-trou": 8,
      "ce1-en-days-ecrire": 8,
      "ce1-en-days-phrase": 6,
      "ce1-en-aan-phrase": 12,
      "ce1-en-aan-trou": 12,
      "ce1-en-aan-ordre": 6,
      "ce1-en-aan-ecrire": 12,
      "ce1-en-clothes-couleur": 14,
      "ce1-en-clothes-phrase": 14,
      "ce1-en-clothes-trou": 14,
      "ce1-en-likes-trou": 12,
      "ce1-en-likes-reponse": 12,
      "ce1-en-likes-sens": 12,
      "ce1-en-likes-phrase": 12,
      "ce1-en-cmd-situation": 10,
      "ce1-en-cmd-phrase": 6,
      "ce1-en-cmd-trou": 6,
    };
    const seen: Record<string, Set<string>> = {};
    for (const key of TOPIC_KEYS) {
      for (let n = 0; n < 250; n++) {
        for (let palierIndex = 1; palierIndex <= PALIER_COUNT[key]; palierIndex++) {
          for (const game of generateGames(topicOf(key).games ?? [], { klass: "CE1", palierIndex, palierCount: PALIER_COUNT[key], seed: `row:${key}:${n}:${palierIndex}` })) {
            const kind = (game.payload.game as { kind: string }).kind;
            if (!EXPECTED[kind]) continue;
            (seen[kind] ??= new Set()).add(`${game.prompt}|${game.answerKey}|${game.type === "fill-blank" ? String(game.payload.text) : ""}`);
          }
        }
      }
    }
    for (const [kind, count] of Object.entries(EXPECTED)) expect(seen[kind]?.size, kind).toBe(count);
  });

  it("ne reposent presque jamais la même question à deux paliers d'une même thématique", () => {
    for (const key of TOPIC_KEYS) {
      let repeated = 0;
      let total = 0;
      for (let n = 0; n < 40; n++) {
        const before = new Set<string>();
        for (let palierIndex = 1; palierIndex <= PALIER_COUNT[key]; palierIndex++) {
          const games = generateGames(topicOf(key).games ?? [], { klass: "CE1", palierIndex, palierCount: PALIER_COUNT[key], seed: `var:${key}:${n}:${palierIndex}` });
          const here = games.map((game) => `${game.prompt}|${game.type === "fill-blank" ? String(game.payload.text) : ""}|${game.answerKey}`);
          for (const question of here) {
            total += 1;
            if (before.has(question)) repeated += 1;
          }
          here.forEach((question) => before.add(question));
        }
      }
      expect(repeated / total, key).toBeLessThan(0.02);
    }
  });

  it("gardent de quoi servir la démo du site : un gabarit du type de chaque exercice de la banque", () => {
    const typesOf = (key: string) => new Set((topicOf(key).games ?? []).map((spec) => GAME_KINDS[spec.kind].type));
    expect(typesOf("an-ce1-who").has("qcm" as never)).toBe(true);
    expect(typesOf("an-ce1-days").has("short-answer" as never)).toBe(true);
    expect(typesOf("an-ce1-a-an").has("drag-drop" as never)).toBe(true);
    expect(typesOf("an-ce1-clothes").has("order" as never)).toBe(true);
    expect(typesOf("an-ce1-likes").has("fill-blank" as never)).toBe(true);
    expect(typesOf("an-ce1-commands").has("match" as never)).toBe(true);
  });

  it("refont chaque exercice raté par le code, sans le modèle", () => {
    for (const key of TOPIC_KEYS) {
      for (const kind of TOPIC_KINDS[key]) {
        const again = regenerateGame({ kind, level: 4 }, "CE1", `reprise:${key}:${kind}`);
        expect(again, kind).not.toBeNull();
        expect(again!.type, kind).toBe(GAME_KINDS[kind as GameKind].type);
      }
    }
  });
});
