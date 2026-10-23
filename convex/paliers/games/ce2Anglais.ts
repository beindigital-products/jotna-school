/**
 * LES GABARITS D'ANGLAIS DU CE2, LA GRAMMAIRE : le verbe être (am, is, are), avoir (have got, has got) et pouvoir (can)
 * (`an-ce2-be`, `an-ce2-have-got`, `an-ce2-can`).
 *
 * Le modèle écrivait ici des phrases où le verbe ne va pas avec le sujet (« She have got a brother »), des trous qui acceptent deux mots,
 * des questions sans le verbe avant le sujet. Ici une phrase se DÉDUIT d'un sujet (un pronom, un prénom, un groupe nominal), d'un verbe et
 * d'un complément pris dans des tableaux fermés : le verbe est celui du sujet, les mauvais choix sont les fautes d'enfant de la fiche (le
 * mauvais verbe être, « have » pour « has », un « s » à can, un « to » après can, un pluriel sans s), et une seule réponse est juste.
 *
 * COMME AU CP ET AU CE1 (`anglais.ts`, `ce1Anglais.ts`) : la consigne est en français, l'anglais n'est que dans ce que l'enfant apprend ;
 * aucune écoute ni prononciation ; aucun indice n'écrit un mot de quatre lettres ou plus d'une bonne réponse ; les énoncés n'ont aucun
 * « : », au plus une apostrophe droite, vingt-huit mots au plus ; aucun émoji. Les formes contractées (I'm, he's, hasn't) ne sont jamais
 * exigées ni proposées.
 *
 * TROIS PALIERS, PAS QUATRE. Chaque thématique a trois paliers (niveaux 1, 2 et 4) : un tableau est coupé en tiers (`bandPart`), et toutes
 * ses lignes sont servies. Premier tiers : des pronoms (I, you, he, she, we, they). Deuxième : des prénoms (Awa, Moussa, Awa and Moussa).
 * Troisième : des groupes nominaux (my brother, my friends, the girls).
 *
 * HORS FICHE, À FAIRE RELIRE PAR UN PROFESSEUR D'ANGLAIS
 * - Les prénoms (Awa, Moussa, Aminata, Fatou, Ibrahima, Cheikh, Omar) et les groupes nominaux (my brother, my mother, my cousin, my friends,
 *   my parents, the girls) ; « it » n'est que dans les glissés du verbe être.
 * - Être : les métiers (student, teacher, doctor), les états (happy, tired, hungry) et les lieux (at home, at school).
 * - Avoir : les mots de la famille et de la classe (brother, sister, pen, book, bag, ruler, cat, dog) et les nombres jusqu'à quinze ; le français
 *   de chaque phrase (« Nous avons cinq livres. »).
 * - Pouvoir : le français de chaque phrase (« Ils savent nager. », « Nous ne savons pas cuisiner. »).
 *
 * MODULE PUR (voir `types.ts`).
 */
import { pickFresh, shuffle, type GameContext, type GameLevel, type GeneratedGame } from "./shared";
import { levelGroup, linkGame, type Hints } from "./tableaux";
import { triples, type Fact, type Steps } from "./ce1SciencesOutils";
import { choiceLine, gap as enGap, gapLine, orderLine, pairsOf, sortTiles, writeLine, type EnGap, type EnWrite } from "./ce1Anglais";

const cap = (text: string) => `${text.charAt(0).toUpperCase()}${text.slice(1)}`;

// ===========================================================================
// LES PERSONNES : trois tiers de six sujets
// ===========================================================================

type Be = "am" | "is" | "are";

export type Person = {
  /** Le sujet en début de phrase (« She », « My brother »). */
  text: string;
  /** Le sujet au milieu d'une question (« she », « my brother »). */
  q: string;
  /** Le pronom d'une réponse courte (« Yes, she is. ») : « you » répond à « I », « I » répond à « you ». */
  ans: string;
  be: Be;
  have: "have" | "has";
  /** Le sujet français et le verbe « savoir » qui va avec : « Nous », « savons ». */
  canFr: readonly [string, string];
  /** « Nous avons », « J'ai ». */
  haveFr: string;
};

const person = (text: string, q: string, ans: string, be: Be, have: "have" | "has", canSub: string, canVerb: string, haveFr: string): Person => ({
  text,
  q,
  ans,
  be,
  have,
  canFr: [canSub, canVerb],
  haveFr,
});

export const PERSON_BANDS: readonly (readonly Person[])[] = [
  [
    person("I", "I", "you", "am", "have", "Je", "sais", "J'ai"),
    person("You", "you", "I", "are", "have", "Tu", "sais", "Tu as"),
    person("He", "he", "he", "is", "has", "Il", "sait", "Il a"),
    person("She", "she", "she", "is", "has", "Elle", "sait", "Elle a"),
    person("We", "we", "we", "are", "have", "Nous", "savons", "Nous avons"),
    person("They", "they", "they", "are", "have", "Ils", "savent", "Ils ont"),
  ],
  [
    person("Awa", "Awa", "she", "is", "has", "Awa", "sait", "Awa a"),
    person("Moussa", "Moussa", "he", "is", "has", "Moussa", "sait", "Moussa a"),
    person("Aminata", "Aminata", "she", "is", "has", "Aminata", "sait", "Aminata a"),
    person("Awa and Moussa", "Awa and Moussa", "they", "are", "have", "Awa et Moussa", "savent", "Awa et Moussa ont"),
    person("Fatou and Ibrahima", "Fatou and Ibrahima", "they", "are", "have", "Fatou et Ibrahima", "savent", "Fatou et Ibrahima ont"),
    person("Cheikh and Omar", "Cheikh and Omar", "they", "are", "have", "Cheikh et Omar", "savent", "Cheikh et Omar ont"),
  ],
  [
    person("My brother", "my brother", "he", "is", "has", "Mon frère", "sait", "Mon frère a"),
    person("My mother", "my mother", "she", "is", "has", "Ma mère", "sait", "Ma mère a"),
    person("My cousin", "my cousin", "he", "is", "has", "Mon cousin", "sait", "Mon cousin a"),
    person("My friends", "my friends", "they", "are", "have", "Mes amis", "savent", "Mes amis ont"),
    person("My parents", "my parents", "they", "are", "have", "Mes parents", "savent", "Mes parents ont"),
    person("The girls", "the girls", "they", "are", "have", "Les filles", "savent", "Les filles ont"),
  ],
];

/** Ce que chaque personne dit, deux choses par personne : le tableau est dans l'ordre des personnes de `PERSON_BANDS`. */
type Extras<T> = readonly (readonly (readonly [T, T])[])[];

/** Les deux lignes de chaque personne : douze lignes par tiers, trente-six en tout. */
const rowsOf = <T>(extras: Extras<T>): { p: Person; x: T; index: number }[] => {
  const rows: { p: Person; x: T; index: number }[] = [];
  PERSON_BANDS.forEach((band, b) => band.forEach((p, i) => extras[b][i].forEach((x) => rows.push({ p, x, index: rows.length }))));
  return rows;
};

/** Les personnes du palier : le tiers du niveau. */
const bandOfLevel = (level: GameLevel) => levelGroup(level);

const ansBe = (ans: string): Be => (ans === "I" ? "am" : ans === "he" || ans === "she" || ans === "it" ? "is" : "are");
const ansHave = (ans: string): "have" | "has" => (ans === "he" || ans === "she" || ans === "it" ? "has" : "have");

const otherBe = (be: Be): [Be, Be] => (["am", "is", "are"] as const).filter((candidate) => candidate !== be) as [Be, Be];
const otherHave = (have: "have" | "has") => (have === "have" ? "has" : "have");

const firstLetter = (word: string) => `Le mot commence par la lettre ${word.charAt(0)}.`;

/** La réponse courte à une question : « Yes, she is. » ou « No, she is not. ». */
const shortReply = (yes: boolean, ans: string, verb: string, negation = "not") => (yes ? `Yes, ${ans} ${verb}.` : `No, ${ans} ${verb} ${negation}.`);

const QUESTION_PROMPT = "Remets les mots dans l'ordre pour écrire une question.";
const QUESTION_HINTS: Hints = [
  "Une question commence par une majuscule.",
  "Dans une question, le verbe vient avant le sujet.",
  "Le dernier mot finit par un point d'interrogation.",
];
const REPLY_HINTS: Hints = ["Lis la question, puis ce que tu réponds : oui ou non.", "La réponse reprend le verbe de la question.", "Après non, le verbe est suivi de not."];
const SORT_PROMPT = "Glisse chaque sujet dans la bonne case.";

// ===========================================================================
// ÊTRE (an-ce2-be)
// ===========================================================================

const BE_CONCEPT = "choisir am, is ou are selon le sujet";

const BE_PREDS: Extras<string> = [
  [
    ["a student", "happy"],
    ["a teacher", "tired"],
    ["a doctor", "hungry"],
    ["a student", "at home"],
    ["students", "at school"],
    ["teachers", "happy"],
  ],
  [
    ["a doctor", "at school"],
    ["a student", "hungry"],
    ["a teacher", "tired"],
    ["students", "at home"],
    ["teachers", "tired"],
    ["doctors", "hungry"],
  ],
  [
    ["a student", "at school"],
    ["a doctor", "at home"],
    ["a teacher", "hungry"],
    ["students", "happy"],
    ["teachers", "at home"],
    ["happy", "at school"],
  ],
];

export const BE_ROWS = rowsOf(BE_PREDS);

const beSentence = (row: (typeof BE_ROWS)[number], be: Be = row.p.be, negative = false) => `${row.p.text} ${be}${negative ? " not" : ""} ${row.x}.`;
const beQuestion = (row: (typeof BE_ROWS)[number]) => `${cap(row.p.be)} ${row.p.q} ${row.x}?`;

const BE_GAPS: readonly EnGap[] = BE_ROWS.map((row) =>
  enGap(`${row.p.text} ___ ${row.x}.`, row.p.be, otherBe(row.p.be), "Le verbe être change de forme avec le sujet : cherche celle qui lui va."),
);

/** « Complète la phrase. » : She ___ a student. Deux par palier, de verbes différents. */
export function makeCe2EnBeGap(ctx: GameContext): GeneratedGame {
  return gapLine(ctx, "ce2-en-be-trou", BE_CONCEPT, BE_GAPS, 3, 2);
}

const BE_PHRASE_HINTS: Hints = ["Lis chaque phrase en entier.", "Le verbe être a une forme pour chaque sujet.", "Compare le verbe des trois phrases avec leur sujet."];

const BE_PHRASES: readonly Fact[] = BE_ROWS.map((row) => ({
  question: "Quelle phrase est juste ?",
  answer: beSentence(row),
  wrong: otherBe(row.p.be).map((be) => beSentence(row, be)) as unknown as readonly [string, string],
  hints: BE_PHRASE_HINTS,
}));

/** « Quelle phrase est juste ? » : la bonne forme du verbe être, et les deux autres formes. */
export function makeCe2EnBePhrase(ctx: GameContext): GeneratedGame {
  return choiceLine(ctx, "ce2-en-be-phrase", BE_CONCEPT, BE_PHRASES, 3, 2);
}

const BE_NEG_HINTS: Hints = ["Pour dire le contraire, on ajoute not après le verbe être.", "Le verbe reste le même : seul not s'ajoute.", "La bonne phrase a not, et son verbe va avec son sujet."];

const BE_NEGS: readonly Fact[] = BE_ROWS.map((row) => ({
  question: `Quelle phrase dit le contraire de « ${beSentence(row)} » ?`,
  answer: beSentence(row, row.p.be, true),
  wrong: [beSentence(row), beSentence(row, otherBe(row.p.be)[0], true)] as const,
  hints: BE_NEG_HINTS,
}));

/** « Quelle phrase dit le contraire de « She is a student. » ? » : la phrase avec not, le même verbe. */
export function makeCe2EnBeNegation(ctx: GameContext): GeneratedGame {
  return choiceLine(ctx, "ce2-en-be-neg", "dire le contraire avec not", BE_NEGS, 3, 1);
}

const BE_QUESTIONS: readonly Steps[] = BE_ROWS.map((row) => ({ prompt: QUESTION_PROMPT, sequence: beQuestion(row).split(" "), hints: QUESTION_HINTS }));

/** « Remets les mots dans l'ordre pour écrire une question. » : Are you a student? Le verbe vient avant le sujet. */
export function makeCe2EnBeQuestion(ctx: GameContext): GeneratedGame {
  return orderLine(ctx, "ce2-en-be-question", "poser une question avec le verbe être", BE_QUESTIONS, 3);
}

const BE_REPLIES: readonly Fact[] = BE_ROWS.map((row) => {
  const yes = row.index % 2 === 0;
  const be = ansBe(row.p.ans);
  const wrongBe = be === "is" ? "are" : "is";
  return {
    question: `On te demande « ${beQuestion(row)} ». Tu réponds ${yes ? "oui" : "non"}. Quelle est la bonne réponse ?`,
    answer: shortReply(yes, row.p.ans, be),
    wrong: [shortReply(yes, row.p.ans, wrongBe), shortReply(!yes, row.p.ans, be)] as const,
    hints: REPLY_HINTS,
  };
});

/** « On te demande « Is she a doctor? ». Tu réponds oui. » : Yes, she is. */
export function makeCe2EnBeReply(ctx: GameContext): GeneratedGame {
  return choiceLine(ctx, "ce2-en-be-reponse", "répondre à une question avec le verbe être", BE_REPLIES, 3, 2);
}

const BE_SORT: readonly [readonly string[], readonly string[]][] = [
  [["He", "She", "It"], ["You", "We", "They"]],
  [["Awa", "Moussa", "Aminata"], ["Awa and Moussa", "Fatou and Ibrahima", "Cheikh and Omar"]],
  [["My brother", "My mother", "The cat"], ["My friends", "My parents", "The girls"]],
];

/** « Glisse chaque sujet dans la bonne case. » : is ou are. */
export function makeCe2EnBeSort(ctx: GameContext): GeneratedGame {
  const [singular, plural] = BE_SORT[bandOfLevel(ctx.level)];
  return sortTiles(
    ctx,
    "ce2-en-be-glisser",
    "ranger les sujets selon is ou are",
    SORT_PROMPT,
    { zone: "is", tiles: singular },
    { zone: "are", tiles: plural },
    ["Cherche le verbe être qui va avec chaque sujet.", "Dis chaque sujet suivi du verbe être, et vois quelle forme va.", "Un prénom seul va avec la même forme que he ou she."],
  );
}

const BE_WRITES: readonly EnWrite[] = BE_ROWS.map((row) => ({
  prompt: `Écris le verbe être qui manque. ${row.p.text} ___ ${row.x}.`,
  accepted: [row.p.be],
  hints: ["Cherche le sujet de la phrase.", "Chaque sujet a sa forme du verbe être.", firstLetter(row.p.be)],
}));

/** « Écris le verbe être qui manque. She ___ a student. » : une réponse courte. */
export function makeCe2EnBeWrite(ctx: GameContext): GeneratedGame {
  return writeLine(ctx, "ce2-en-be-ecrire", BE_CONCEPT, BE_WRITES, 3, 1);
}

// ===========================================================================
// AVOIR (an-ce2-have-got)
// ===========================================================================

const HG_CONCEPT = "choisir have got ou has got selon le sujet";

type Noun = { en: string; fr: string; feminine?: boolean };
const BROTHER: Noun = { en: "brother", fr: "frère" };
const SISTER: Noun = { en: "sister", fr: "sœur", feminine: true };
const PEN: Noun = { en: "pen", fr: "stylo" };
const BOOK: Noun = { en: "book", fr: "livre" };
const BAG: Noun = { en: "bag", fr: "sac" };
const RULER: Noun = { en: "ruler", fr: "règle", feminine: true };
const CAT: Noun = { en: "cat", fr: "chat" };
const DOG: Noun = { en: "dog", fr: "chien" };

/** Les nombres des phrases, en anglais et en français. */
const NUMBERS: Record<number, readonly [string, string]> = {
  2: ["two", "deux"],
  3: ["three", "trois"],
  4: ["four", "quatre"],
  5: ["five", "cinq"],
  6: ["six", "six"],
  7: ["seven", "sept"],
  10: ["ten", "dix"],
  12: ["twelve", "douze"],
  15: ["fifteen", "quinze"],
};

type Thing = { en: string; fr: string; wrong: string };

/** Un objet et son nombre : « a brother », « three books » (pluriel régulier en s) ; `wrong` est la faute d'accord. */
const thing = (n: number, noun: Noun): Thing =>
  n === 1
    ? { en: `a ${noun.en}`, fr: `${noun.feminine ? "une" : "un"} ${noun.fr}`, wrong: `a ${noun.en}s` }
    : { en: `${NUMBERS[n][0]} ${noun.en}s`, fr: `${NUMBERS[n][1]} ${noun.fr}s`, wrong: `${NUMBERS[n][0]} ${noun.en}` };

const HG_THINGS: Extras<Thing> = [
  [
    [thing(1, BROTHER), thing(2, SISTER)],
    [thing(1, PEN), thing(3, BOOK)],
    [thing(1, DOG), thing(2, BROTHER)],
    [thing(1, SISTER), thing(4, PEN)],
    [thing(1, CAT), thing(5, BOOK)],
    [thing(1, BAG), thing(2, RULER)],
  ],
  [
    [thing(1, BROTHER), thing(3, SISTER)],
    [thing(1, RULER), thing(6, PEN)],
    [thing(1, CAT), thing(2, BAG)],
    [thing(1, DOG), thing(4, BOOK)],
    [thing(2, CAT), thing(1, BAG)],
    [thing(3, DOG), thing(1, PEN)],
  ],
  [
    [thing(1, BAG), thing(7, BOOK)],
    [thing(2, BROTHER), thing(1, SISTER)],
    [thing(1, DOG), thing(10, PEN)],
    [thing(12, BOOK), thing(1, CAT)],
    [thing(1, CAT), thing(3, BAG)],
    [thing(15, PEN), thing(2, RULER)],
  ],
];

export const HG_ROWS = rowsOf(HG_THINGS);
type HgRow = (typeof HG_ROWS)[number];

const hgSentence = (row: HgRow, have: "have" | "has" = row.p.have, negative = false, object = row.x.en) => `${row.p.text} ${have}${negative ? " not" : ""} got ${object}.`;
const hgQuestion = (row: HgRow) => `${cap(row.p.have)} ${row.p.q} got ${row.x.en}?`;

const HG_GAPS: readonly EnGap[] = HG_ROWS.map((row) =>
  enGap(`${row.p.text} ___ got ${row.x.en}.`, row.p.have, [otherHave(row.p.have), "is"], "Une forme va avec he, she et un seul nom ; l'autre va avec les autres sujets."),
);

/** « Complète la phrase. » : She ___ got a brother. Deux par palier, de mots différents. */
export function makeCe2EnHgGap(ctx: GameContext): GeneratedGame {
  return gapLine(ctx, "ce2-en-hg-trou", HG_CONCEPT, HG_GAPS, 3, 2);
}

const HG_PHRASE_HINTS: Hints = [
  "Lis chaque phrase en entier.",
  "Regarde le sujet, puis le verbe, puis le nombre de ce qu'on possède.",
  "Un nom prend un s quand il y en a plusieurs, et pas quand il n'y en a qu'un.",
];

const HG_PHRASES: readonly Fact[] = HG_ROWS.map((row) => ({
  question: "Quelle phrase est juste ?",
  answer: hgSentence(row),
  wrong: [hgSentence(row, otherHave(row.p.have)), hgSentence(row, row.p.have, false, row.x.wrong)] as const,
  hints: HG_PHRASE_HINTS,
}));

/** « Quelle phrase est juste ? » : le bon verbe, le bon pluriel, et deux fautes (le verbe de l'autre sujet, le s oublié ou de trop). */
export function makeCe2EnHgPhrase(ctx: GameContext): GeneratedGame {
  return choiceLine(ctx, "ce2-en-hg-phrase", HG_CONCEPT, HG_PHRASES, 3, 2);
}

const HG_NEG_HINTS: Hints = ["Pour dire le contraire, on ajoute not avant got.", "Le verbe reste le même : seul not s'ajoute.", "La bonne phrase a not, et son verbe va avec son sujet."];

const HG_NEGS: readonly Fact[] = HG_ROWS.map((row) => ({
  question: `Quelle phrase dit le contraire de « ${hgSentence(row)} » ?`,
  answer: hgSentence(row, row.p.have, true),
  wrong: [hgSentence(row), hgSentence(row, otherHave(row.p.have), true)] as const,
  hints: HG_NEG_HINTS,
}));

/** « Quelle phrase dit le contraire de « She has got a dog. » ? » : has not got. */
export function makeCe2EnHgNegation(ctx: GameContext): GeneratedGame {
  return choiceLine(ctx, "ce2-en-hg-neg", "dire qu'on n'a pas quelque chose", HG_NEGS, 3, 1);
}

const HG_QUESTIONS: readonly Steps[] = HG_ROWS.map((row) => ({ prompt: QUESTION_PROMPT, sequence: hgQuestion(row).split(" "), hints: QUESTION_HINTS }));

/** « Remets les mots dans l'ordre pour écrire une question. » : Have you got a pen? */
export function makeCe2EnHgQuestion(ctx: GameContext): GeneratedGame {
  return orderLine(ctx, "ce2-en-hg-question", "poser une question avec have got", HG_QUESTIONS, 3);
}

const HG_REPLIES: readonly Fact[] = HG_ROWS.map((row) => {
  const yes = row.index % 2 === 0;
  const have = ansHave(row.p.ans);
  return {
    question: `On te demande « ${hgQuestion(row)} ». Tu réponds ${yes ? "oui" : "non"}. Quelle est la bonne réponse ?`,
    answer: shortReply(yes, row.p.ans, have),
    wrong: [shortReply(yes, row.p.ans, otherHave(have)), shortReply(!yes, row.p.ans, have)] as const,
    hints: REPLY_HINTS,
  };
});

/** « On te demande « Has she got a cat? ». Tu réponds oui. » : Yes, she has. */
export function makeCe2EnHgReply(ctx: GameContext): GeneratedGame {
  return choiceLine(ctx, "ce2-en-hg-reponse", "répondre à une question avec have got", HG_REPLIES, 3, 1);
}

/** Une phrase anglaise et la même phrase en français : les deux côtés de toutes les paires sont différents. */
const HG_PAIRS: readonly (readonly [string, string])[][] = PERSON_BANDS.map((_, b) =>
  HG_ROWS.filter((row) => PERSON_BANDS[b].includes(row.p)).map((row) => [hgSentence(row), `${row.p.haveFr} ${row.x.fr}.`] as const),
);

/** « Relie chaque phrase anglaise à la même phrase en français. » : trois phrases du tiers du palier. */
export function makeCe2EnHgLinks(ctx: GameContext): GeneratedGame {
  return linkGame(ctx, "ce2-en-hg-relier", HG_CONCEPT, () => {
    const pool = HG_PAIRS[bandOfLevel(ctx.level)];
    const chosen = pickFresh(ctx, triples(pool), (trio) => `ce2-en-hg-relier:${trio.map((pair) => pair[0]).join("|")}`);
    return {
      prompt: "Relie chaque phrase anglaise à la même phrase en français.",
      pairs: shuffle(ctx.rng, chosen).map(([left, right]) => ({ left, right })),
      hints: ["Lis la phrase anglaise et dis-la en français.", "Cherche le sujet, puis ce qu'on possède et en quel nombre.", "Commence par la paire dont tu es le plus sûr."],
    };
  });
}

const HG_SORT: readonly [readonly string[], readonly string[]][] = [
  [["He", "She", "It"], ["I", "You", "We", "They"]],
  [["Awa", "Moussa", "Aminata"], ["Awa and Moussa", "Fatou and Ibrahima", "Cheikh and Omar"]],
  [["My brother", "My mother", "My cousin"], ["My friends", "My parents", "The girls"]],
];

/** « Glisse chaque sujet dans la bonne case. » : has got ou have got. */
export function makeCe2EnHgSort(ctx: GameContext): GeneratedGame {
  const [singular, plural] = HG_SORT[bandOfLevel(ctx.level)];
  return sortTiles(
    ctx,
    "ce2-en-hg-glisser",
    "ranger les sujets selon has got ou have got",
    SORT_PROMPT,
    { zone: "has got", tiles: singular },
    { zone: "have got", tiles: plural },
    ["Cherche la forme qui va avec chaque sujet.", "He, she et it vont ensemble.", "Un prénom seul va avec la même forme que he ou she."],
  );
}

const HG_WRITES: readonly EnWrite[] = HG_ROWS.map((row) => ({
  prompt: `Écris le mot qui manque. ${row.p.text} ___ got ${row.x.en}.`,
  accepted: [row.p.have],
  hints: ["Cherche le sujet de la phrase.", "Une forme va avec he, she et un seul nom ; l'autre avec les autres sujets.", firstLetter(row.p.have)],
}));

/** « Écris le mot qui manque. She ___ got a brother. » : have ou has. */
export function makeCe2EnHgWrite(ctx: GameContext): GeneratedGame {
  return writeLine(ctx, "ce2-en-hg-ecrire", HG_CONCEPT, HG_WRITES, 3, 1);
}

// ===========================================================================
// POUVOIR (an-ce2-can)
// ===========================================================================

const CAN_CONCEPT = "dire ce qu'on sait faire avec can";

type Verb = { en: string; fr: string };
const RUN: Verb = { en: "run", fr: "courir" };
const JUMP: Verb = { en: "jump", fr: "sauter" };
const SWIM: Verb = { en: "swim", fr: "nager" };
const SING: Verb = { en: "sing", fr: "chanter" };
const DANCE: Verb = { en: "dance", fr: "danser" };
const READ: Verb = { en: "read", fr: "lire" };
const WRITE: Verb = { en: "write", fr: "écrire" };
const DRAW: Verb = { en: "draw", fr: "dessiner" };
const COOK: Verb = { en: "cook", fr: "cuisiner" };
const CLIMB: Verb = { en: "climb", fr: "grimper" };
export const VERBS: readonly Verb[] = [RUN, JUMP, SWIM, SING, DANCE, READ, WRITE, DRAW, COOK, CLIMB];

const CAN_VERBS: Extras<Verb> = [
  [
    [SWIM, SING],
    [RUN, DANCE],
    [JUMP, CLIMB],
    [READ, DRAW],
    [COOK, WRITE],
    [SWIM, RUN],
  ],
  [
    [SING, DRAW],
    [RUN, CLIMB],
    [DANCE, COOK],
    [SWIM, JUMP],
    [READ, WRITE],
    [CLIMB, SING],
  ],
  [
    [COOK, SWIM],
    [SING, DANCE],
    [JUMP, READ],
    [DRAW, CLIMB],
    [RUN, WRITE],
    [JUMP, COOK],
  ],
];

export const CAN_ROWS = rowsOf(CAN_VERBS);
type CanRow = (typeof CAN_ROWS)[number];

const canSentence = (row: CanRow, negative = false) => `${row.p.text} ${negative ? "cannot" : "can"} ${row.x.en}.`;
/** « Elle sait nager », « Elle ne sait pas nager ». */
const canFrench = (row: CanRow, negative = false) => {
  const [subject, verb] = row.p.canFr;
  return `${subject} ${negative ? `ne ${verb} pas` : verb} ${row.x.fr}`;
};
const canQuestion = (row: CanRow) => `Can ${row.p.q} ${row.x.en}?`;

/** Les trois fautes de la fiche : un s à can, un s au verbe, un to après can. Chaque ligne en propose deux. */
const canErrors = (row: CanRow): string[] => [`${row.p.text} cans ${row.x.en}.`, `${row.p.text} can ${row.x.en}s.`, `${row.p.text} can to ${row.x.en}.`];
const twoErrors = (row: CanRow, shift: number) => {
  const errors = canErrors(row);
  return [errors[(row.index + shift) % 3], errors[(row.index + shift + 1) % 3]] as const;
};

const CAN_FR_HINTS: Hints = [
  "Pense à ce que dit la phrase française.",
  "Après can, le verbe ne change jamais et n'a pas de to.",
  "Cherche la phrase où can et le verbe sont écrits sans s.",
];

const CAN_FRENCH: readonly Fact[] = CAN_ROWS.map((row) => ({
  question: `Comment dit-on « ${canFrench(row)} » en anglais ?`,
  answer: canSentence(row),
  wrong: twoErrors(row, 0),
  hints: CAN_FR_HINTS,
}));

/** « Comment dit-on « Elle sait nager » en anglais ? » : She can swim. */
export function makeCe2EnCanFrench(ctx: GameContext): GeneratedGame {
  return choiceLine(ctx, "ce2-en-can-fr", CAN_CONCEPT, CAN_FRENCH, 3, 1);
}

const CAN_PHRASES: readonly Fact[] = CAN_ROWS.map((row) => ({
  question: "Quelle phrase est juste ?",
  answer: canSentence(row),
  wrong: twoErrors(row, 1),
  hints: ["Lis chaque phrase en entier.", "Can se place avant le verbe, et ne prend jamais de s.", "Le verbe qui suit can reste tel quel, sans to."],
}));

/** « Quelle phrase est juste ? » : can sans s, le verbe sans s, pas de to. */
export function makeCe2EnCanPhrase(ctx: GameContext): GeneratedGame {
  return choiceLine(ctx, "ce2-en-can-phrase", CAN_CONCEPT, CAN_PHRASES, 3, 1);
}

const CAN_NEGS: readonly Fact[] = CAN_ROWS.map((row) => ({
  question: `Comment dit-on « ${canFrench(row, true)} » en anglais ?`,
  answer: canSentence(row, true),
  wrong: [`${row.p.text} not can ${row.x.en}.`, `${row.p.text} cannot ${row.x.en}s.`] as const,
  hints: ["Pense à ce que dit la phrase française : on ne sait pas.", "La négation s'écrit en un seul mot, qui se place avant le verbe.", "Le verbe qui suit reste tel quel, sans s."],
}));

/** « Comment dit-on « Elle ne sait pas chanter » en anglais ? » : She cannot sing. */
export function makeCe2EnCanNegation(ctx: GameContext): GeneratedGame {
  return choiceLine(ctx, "ce2-en-can-neg", "dire qu'on ne sait pas faire quelque chose", CAN_NEGS, 3, 1);
}

const CAN_GAPS: readonly EnGap[] = CAN_ROWS.map((row) => {
  if (row.index % 2 === 0) {
    const others = VERBS.filter((verb) => verb !== row.x);
    return enGap(
      `${row.p.text} can ___.`,
      row.x.en,
      [others[row.index % others.length].en, others[(row.index + 4) % others.length].en],
      "Le verbe cherché dit ce que la phrase française dit qu'on sait faire.",
      `${canFrench(row)}. Complète la phrase en anglais.`,
    );
  }
  return enGap(`${row.p.text} ___ ${row.x.en}.`, "can", ["cans", "can to"], "Le petit mot qui dit qu'on sait faire ne change jamais.");
});

/** « Elle sait nager. Complète la phrase en anglais. » : She can ___. ou She ___ swim. */
export function makeCe2EnCanGap(ctx: GameContext): GeneratedGame {
  return gapLine(ctx, "ce2-en-can-trou", CAN_CONCEPT, CAN_GAPS, 3, 2);
}

const CAN_QUESTIONS: readonly Steps[] = CAN_ROWS.map((row) => ({ prompt: QUESTION_PROMPT, sequence: canQuestion(row).split(" "), hints: QUESTION_HINTS }));

/** « Remets les mots dans l'ordre pour écrire une question. » : Can you dance? */
export function makeCe2EnCanQuestion(ctx: GameContext): GeneratedGame {
  return orderLine(ctx, "ce2-en-can-question", "poser une question avec can", CAN_QUESTIONS, 3);
}

const CAN_REPLIES: readonly Fact[] = CAN_ROWS.map((row) => {
  const yes = row.index % 2 === 0;
  return {
    question: `On te demande « ${canQuestion(row)} ». Tu réponds ${yes ? "oui" : "non"}. Quelle est la bonne réponse ?`,
    answer: yes ? `Yes, ${row.p.ans} can.` : `No, ${row.p.ans} cannot.`,
    wrong: yes ? ([`Yes, ${row.p.ans} cans.`, `No, ${row.p.ans} cannot.`] as const) : ([`No, ${row.p.ans} not can.`, `Yes, ${row.p.ans} can.`] as const),
    hints: ["Lis la question, puis ce que tu réponds : oui ou non.", "La réponse reprend can, qui ne change jamais.", "Après non, la négation s'écrit en un seul mot."],
  };
});

/** « On te demande « Can you swim? ». Tu réponds oui. » : Yes, I can. */
export function makeCe2EnCanReply(ctx: GameContext): GeneratedGame {
  return choiceLine(ctx, "ce2-en-can-reponse", "répondre à une question avec can", CAN_REPLIES, 3, 1);
}

const CAN_PAIRS: readonly (readonly [string, string])[] = VERBS.map((verb) => [verb.en, verb.fr] as const);

/** « Relie chaque verbe anglais à son sens en français. » */
export function makeCe2EnCanLinks(ctx: GameContext): GeneratedGame {
  return pairsOf(ctx, "ce2-en-can-relier", CAN_CONCEPT, "Relie chaque verbe anglais à son sens en français.", CAN_PAIRS, [
    "Pense à ce que fait chaque verbe.",
    "Dis le verbe anglais, puis cherche le verbe français qui lui ressemble.",
    "Commence par la paire dont tu es le plus sûr.",
  ], 3);
}

/** « Glisse chaque phrase dans la bonne case. » : can ou cannot. */
export function makeCe2EnCanSort(ctx: GameContext): GeneratedGame {
  const rows = CAN_ROWS.filter((row) => PERSON_BANDS[bandOfLevel(ctx.level)].includes(row.p));
  const positive = rows.filter((row) => row.index % 2 === 0).map((row) => canSentence(row));
  const negative = rows.filter((row) => row.index % 2 === 1).map((row) => canSentence(row, true));
  return sortTiles(
    ctx,
    "ce2-en-can-glisser",
    "ranger les phrases selon can ou cannot",
    "Glisse chaque phrase dans la bonne case.",
    { zone: "can", tiles: positive },
    { zone: "cannot", tiles: negative },
    ["Lis chaque phrase en entier.", "Cherche si la phrase dit qu'on sait ou qu'on ne sait pas.", "Le petit mot qui nie est écrit en un seul mot."],
  );
}

const CAN_WRITES: readonly EnWrite[] = CAN_ROWS.map((row) => ({
  prompt: `${canFrench(row)}. Écris le verbe anglais qui manque dans ${row.p.text} can ___.`,
  accepted: [row.x.en],
  hints: ["Pense à ce que dit la phrase française.", "Le verbe anglais reste tel quel après can.", firstLetter(row.x.en)],
}));

/** « Elle sait nager. Écris le verbe anglais qui manque dans She can ___. » */
export function makeCe2EnCanWrite(ctx: GameContext): GeneratedGame {
  return writeLine(ctx, "ce2-en-can-ecrire", CAN_CONCEPT, CAN_WRITES, 3, 1);
}
