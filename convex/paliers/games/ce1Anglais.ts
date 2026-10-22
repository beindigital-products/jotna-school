/**
 * LES GABARITS D'ANGLAIS DU CE1 : se présenter, les jours de la semaine, a ou an, les vêtements, j'aime et je n'aime pas, les ordres de la
 * classe (`an-ce1-who`, `an-ce1-days`, `an-ce1-a-an`, `an-ce1-clothes`, `an-ce1-likes`, `an-ce1-commands`).
 *
 * Sur l'échantillon de CE1 lu le 21 octobre 2026, 12 exercices d'anglais sur 36 étaient faux : « Today is ___ » sans aucune donnée qui
 * dise quel jour on est, des phrases qui ne sont pas de l'anglais, des consignes en anglais qu'un enfant de sept ans ne lit pas, des
 * trous qui acceptent deux mots. Ici le vocabulaire et les phrases sont la liste FERMÉE de la fiche de chaque thématique, la bonne
 * réponse se lit dans un tableau écrit à la main, et aucun mot hors liste n'entre dans un exercice, sauf ceux que la liste HORS FICHE
 * ci-dessous annonce.
 *
 * COMME AU CP (`anglais.ts`) : la consigne est en français, l'anglais n'est que dans ce que l'enfant apprend ; aucune écoute ni
 * prononciation ; aucun indice n'écrit un mot anglais de la bonne réponse (il peut donner sa première lettre) ; les énoncés n'ont aucun
 * « : », au plus une apostrophe droite, vingt-huit mots au plus ; les émojis sont anciens (Unicode 11 au plus) et jamais suivis de U+FE0F.
 *
 * DEUX OU TROIS PALIERS, PAS QUATRE. `an-ce1-days`, `-clothes` et `-commands` n'ont que deux paliers (joués aux niveaux 1 et 4),
 * `-who`, `-a-an` et `-likes` trois (niveaux 1, 2 et 4). Un tableau coupé en quatre parts laisserait la part du niveau 3 sans palier : ici
 * chaque tableau est coupé en moitiés (deux paliers) ou en tiers (trois paliers), `bandPart`, et toutes ses lignes sont servies.
 *
 * HORS FICHE, À FAIRE RELIRE PAR UN PROFESSEUR D'ANGLAIS
 * - Se présenter : les prénoms Moussa, Fatou, Ibrahima, Aminata, Cheikh, Omar (la fiche n'écrit qu'Awa), les âges six, sept, neuf et dix
 *   (elle n'écrit que huit), « Hello. » et « Goodbye. » dans les petits dialogues (mots du CI), et que « I am from Mali. » se dit avec
 *   chacun des cinq pays de la fiche.
 * - Les jours : le français de chaque jour, « Du lundi au vendredi » et « Le week-end » comme cases (l'école de la semaine).
 * - a ou an : tous les mots, sauf ceux de la fiche (dog, banana, mango, book, apple, orange, egg, elephant), sont des mots des thématiques
 *   du CI et du CP (cat, bird, fish, cow, goat, horse, monkey, lion, lemon, pen, pencil, bag, ruler, desk, chair, board, door, window, head,
 *   nose, mouth, hand, leg, arm, ear, eye), au singulier.
 * - Les vêtements : les sept couleurs des phrases (red, blue, yellow, green, black, white, pink : jamais orange, qui prendrait « an »), le
 *   français de chaque vêtement, et que seuls T-shirt, dress, shoes, socks et cap ont un dessin (la fiche n'en donne pas d'autre).
 * - J'aime : seuls rice, fish, bread, chicken, milk, water et mango entrent dans les phrases (« I like banana. » n'est pas naturel au
 *   singulier, la fiche n'a pas de pluriel), et le français de chaque phrase.
 * - Les ordres : les dessins 👀 look, 👂 listen, 📖 open your book, 📕 close your book, 🤫 be quiet (la fiche en donne d'autres, qui ne sont
 *   pas des émojis sûrs), les situations de classe écrites en français, et la case « Avec mon livre » ou « Avec mon corps ».
 *
 * MODULE PUR (voir `types.ts`).
 */
import { fresh, originOf, pickFresh, shuffle, takeFresh, type GameContext, type GameLevel, type GeneratedGame } from "./shared";
import { choiceGame, gapGame, levelGroup, linkGame, sortGame, type Hints } from "./tableaux";
import { firstLetterHint, freshWord, threeWords, withPicture, type Word } from "./anglais";
import { partOf, pickLine, stepsOrder, triples, type Bin, type Fact, type Steps } from "./ce1SciencesOutils";

// ===========================================================================
// LES OUTILS : des tableaux coupés en moitiés ou en tiers
// ===========================================================================

/** 2 pour une thématique de deux paliers (niveaux 1 et 4), 3 pour une de trois (niveaux 1, 2 et 4). */
type Bands = 2 | 3;

const bandOf = (level: GameLevel, bands: Bands) => (bands === 3 ? levelGroup(level) : level <= 2 ? 0 : 1);

/** La part du palier : la moitié ou le tiers de la liste, toute la liste si cette part est plus courte que `uses`. */
export function bandPart<T>(items: readonly T[], level: GameLevel, bands: Bands, uses = 1): T[] {
  const part = partOf(items, bandOf(level, bands), bands);
  return part.length >= uses ? part : [...items];
}

/** Une phrase à trou : la phrase écrite avec `___`, le mot qui la complète, deux mots qui ne la complètent pas. */
type EnGap = { prompt?: string; text: string; answer: string; wrong: readonly [string, string]; hints: Hints };

/** Une phrase à trou : une ligne de la part du palier, de préférence dont le mot juste n'a pas déjà servi dans ce palier. */
function gapLine(ctx: GameContext, kind: string, concept: string, rows: readonly EnGap[], bands: Bands, uses: number): GeneratedGame {
  return gapGame(ctx, kind, concept, () => {
    const fact = pickLine(ctx, kind, bandPart(rows, ctx.level, bands, uses), (row) => `${kind}:${row.text}:${row.prompt ?? ""}:${row.answer}`);
    return { prompt: fact.prompt ?? "Complète la phrase.", text: fact.text, answer: fact.answer, wrong: fact.wrong, hints: fact.hints };
  });
}

/** Un QCM lu dans la part du palier. */
function choiceLine(ctx: GameContext, kind: string, concept: string, rows: readonly Fact[], bands: Bands, uses: number): GeneratedGame {
  return choiceGame(ctx, kind, concept, () => {
    const fact = pickLine(ctx, kind, bandPart(rows, ctx.level, bands, uses), (row) => `${kind}:${row.question}:${row.answer}`);
    return { prompt: fact.question, answer: fact.answer, wrong: fact.wrong, hints: fact.hints };
  });
}

/** Trois paires prises parmi tous les trios d'un tableau, chaque palier ayant ses trios. La droite de chaque paire est différente. */
function pairsOf(
  ctx: GameContext,
  kind: string,
  concept: string,
  prompt: string,
  pool: readonly (readonly [string, string])[],
  hints: Hints,
  bands: Bands,
): GeneratedGame {
  return linkGame(ctx, kind, concept, () => {
    const chosen = pickFresh(ctx, bandPart(triples(pool), ctx.level, bands), (trio) => `${kind}:${trio.map((pair) => pair[0]).join("|")}`);
    return { prompt, pairs: shuffle(ctx.rng, chosen).map(([left, right]) => ({ left, right })), hints };
  });
}

/** Un glissé entre deux cases : quatre étiquettes aux deux premiers niveaux, cinq ensuite, les deux cases toujours servies. */
function sortTiles(ctx: GameContext, kind: string, concept: string, prompt: string, first: Bin, second: Bin, hints: Hints): GeneratedGame {
  return sortGame(ctx, kind, concept, () => {
    const total = ctx.level <= 2 ? 4 : 5;
    const wanted = ctx.rng() < 0.5 ? Math.ceil(total / 2) : Math.floor(total / 2);
    const firstCount = Math.max(total - second.tiles.length, Math.min(wanted, first.tiles.length));
    const firstTiles = takeFresh(ctx, first.tiles, firstCount, (tile) => `${kind}:tile:${tile}`);
    const secondTiles = takeFresh(ctx, second.tiles, total - firstCount, (tile) => `${kind}:tile:${tile}`);
    return {
      prompt,
      zones: [first.zone, second.zone],
      items: [...firstTiles.map((text) => ({ text, zone: first.zone })), ...secondTiles.map((text) => ({ text, zone: second.zone }))],
      hints,
    };
  });
}

/** Une réponse à écrire lue dans la part du palier : le mot juste est la première écriture admise. */
type EnWrite = { prompt: string; accepted: readonly string[]; hints: Hints };

function writeLine(ctx: GameContext, kind: string, concept: string, rows: readonly EnWrite[], bands: Bands, uses: number): GeneratedGame {
  const lines = bandPart(rows, ctx.level, bands, uses).map((row) => ({ row, answer: row.accepted[0] }));
  const chosen = pickLine(ctx, kind, lines, (line) => `${kind}:${line.row.prompt}`).row;
  return {
    type: "short-answer",
    prompt: chosen.prompt,
    payload: { acceptedAnswers: [...chosen.accepted], game: originOf(kind, ctx), concept },
    answerKey: chosen.accepted[0],
    hints: [...chosen.hints],
  };
}

/** Un ordre lu dans la part du palier. */
const orderLine = (ctx: GameContext, kind: string, concept: string, rows: readonly Steps[], bands: Bands) =>
  stepsOrder(ctx, kind, concept, bandPart(rows, ctx.level, bands));

const SENTENCE_PROMPT = "Remets les mots dans l'ordre pour écrire une phrase.";
const SENTENCE_HINTS: Hints = [
  "Une phrase commence par une majuscule.",
  "Cherche le mot qui commence par une majuscule, c'est le premier.",
  "Le dernier mot finit la phrase.",
];

/** Une phrase à remettre dans l'ordre : ses mots, le premier avec sa majuscule, le dernier avec son point ou son point d'interrogation. */
const sentence = (text: string): Steps => ({ prompt: SENTENCE_PROMPT, sequence: text.split(" "), hints: SENTENCE_HINTS });

const GAP_READ = "Lis la phrase en entier, doucement.";

/** Une phrase à trou, avec l'indice de sens écrit en français et la première lettre du mot juste. */
const gap = (text: string, answer: string, wrong: readonly [string, string], clue: string, prompt?: string): EnGap => ({
  prompt,
  text,
  answer,
  wrong,
  hints: [GAP_READ, clue, firstLetterHint({ en: answer, fr: "", the: "" })],
});

/** Le dessin d'un mot : la bonne réponse est prise dans `answers`, les deux autres choix dans `pool`. */
function drawingWord(kind: string, ctx: GameContext, answers: readonly Word[], pool: readonly Word[], concept: string): GeneratedGame {
  return fresh(ctx, kind, () => {
    const answer = freshWord(ctx, withPicture(answers));
    const options = threeWords(ctx, answer, withPicture(pool));
    return {
      type: "qcm",
      prompt: `Quel mot va avec ce dessin ?\n${answer.emoji}`,
      payload: { options, correctIndex: options.indexOf(answer.en), game: originOf(kind, ctx), concept },
      answerKey: answer.en,
      hints: ["Regarde bien le dessin.", "Dis en français ce que tu vois, puis cherche le mot anglais qui va avec.", firstLetterHint(answer)],
    };
  });
}

/** « Comment dit-on « le chapeau » en anglais ? » : le mot français donne le sens. */
function frenchWord(kind: string, ctx: GameContext, answers: readonly Word[], pool: readonly Word[], concept: string): GeneratedGame {
  return fresh(ctx, kind, () => {
    const answer = freshWord(ctx, answers);
    const options = threeWords(ctx, answer, pool);
    return {
      type: "qcm",
      prompt: `Comment dit-on « ${answer.the} » en anglais ?`,
      payload: { options, correctIndex: options.indexOf(answer.en), game: originOf(kind, ctx), concept },
      answerKey: answer.en,
      hints: ["Pense à ce que veut dire le mot français.", "Écarte les mots anglais que tu connais et qui disent autre chose.", firstLetterHint(answer)],
    };
  });
}

// ===========================================================================
// SE PRÉSENTER (an-ce1-who, trois paliers)
// ===========================================================================

const WHO = "se présenter en anglais";

const NAME = (who: string) => `My name is ${who}.`;
const FINE = "I am fine, thank you.";
const OLD = (age: string) => `I am ${age}.`;
const FROM = (country: string) => `I am from ${country}.`;

const NAME_HINTS: Hints = ["La question demande comment tu t'appelles.", "La bonne réponse donne un prénom.", "Elle commence par la lettre M."];
const FINE_HINTS: Hints = ["La question demande si tu vas bien.", "On répond que tout va bien et on remercie.", "Elle commence par la lettre I."];
const OLD_HINTS: Hints = ["La question demande ton âge.", "La bonne réponse dit un nombre.", "Elle commence par la lettre I."];
const FROM_HINTS: Hints = ["La question demande d'où tu viens.", "La bonne réponse dit un pays.", "Elle commence par la lettre I."];

const ASK = (question: string) => `On te demande « ${question} ». Quelle est la bonne réponse ?`;

/** Une réponse à une question : jamais un mauvais choix qui répondrait aussi à la question. Chaque palier a une ligne de chaque sorte. */
const WHO_REPLIES: readonly Fact[] = [
  // Palier 1
  { question: ASK("What is your name?"), answer: NAME("Awa"), wrong: [OLD("eight"), FINE], hints: NAME_HINTS },
  { question: ASK("How are you?"), answer: FINE, wrong: [NAME("Fatou"), FROM("Mali")], hints: FINE_HINTS },
  { question: ASK("How old are you?"), answer: OLD("eight"), wrong: [FROM("Senegal"), FINE], hints: OLD_HINTS },
  { question: ASK("Where are you from?"), answer: FROM("Senegal"), wrong: [NAME("Moussa"), OLD("nine")], hints: FROM_HINTS },
  // Palier 2
  { question: ASK("What is your name?"), answer: NAME("Moussa"), wrong: [FROM("Guinea"), OLD("seven")], hints: NAME_HINTS },
  { question: "Tu rencontres un ami. Il te dit « How are you? ». Que réponds-tu ?", answer: FINE, wrong: [OLD("nine"), FROM("Gambia")], hints: FINE_HINTS },
  { question: ASK("How old are you?"), answer: OLD("nine"), wrong: [NAME("Aminata"), FINE], hints: OLD_HINTS },
  { question: ASK("Where are you from?"), answer: FROM("Mali"), wrong: [FINE, NAME("Cheikh")], hints: FROM_HINTS },
  // Palier 3
  { question: ASK("What is your name?"), answer: NAME("Fatou"), wrong: [FINE, FROM("France")], hints: NAME_HINTS },
  { question: "Ta maîtresse te dit « How are you? ». Que réponds-tu ?", answer: FINE, wrong: [NAME("Omar"), OLD("ten")], hints: FINE_HINTS },
  { question: ASK("How old are you?"), answer: OLD("ten"), wrong: [FROM("Mali"), NAME("Awa")], hints: OLD_HINTS },
  { question: ASK("Where are you from?"), answer: FROM("Gambia"), wrong: [OLD("eight"), NAME("Ibrahima")], hints: FROM_HINTS },
];

/** « On te demande « What is your name? ». Quelle est la bonne réponse ? » : trois fois par palier, une réponse à chaque sorte de question. */
export function makeCe1EnWhoReply(ctx: GameContext): GeneratedGame {
  return choiceLine(ctx, "ce1-en-who-reponse", WHO, WHO_REPLIES, 3, 3);
}

const QUESTIONS = ["What is your name?", "How are you?", "How old are you?", "Where are you from?"] as const;
const [Q_NAME, Q_FINE, Q_OLD, Q_FROM] = QUESTIONS;
const QUESTION_HINTS: Hints = [
  "Cherche ce que dit la réponse : un prénom, un âge, un pays ou des nouvelles.",
  "La question vient avant la réponse.",
  "Relis chaque question et vois laquelle appelle cette réponse.",
];
const askFor = (reply: string, answer: string, wrong: readonly [string, string]): Fact => ({
  question: `Quelle question appelle la réponse « ${reply} » ?`,
  answer,
  wrong,
  hints: QUESTION_HINTS,
});

const WHO_QUESTIONS: readonly Fact[] = [
  askFor(NAME("Awa"), Q_NAME, [Q_OLD, Q_FROM]),
  askFor(FINE, Q_FINE, [Q_NAME, Q_FROM]),
  askFor(OLD("eight"), Q_OLD, [Q_FINE, Q_NAME]),
  askFor(FROM("Senegal"), Q_FROM, [Q_OLD, Q_FINE]),
  askFor(NAME("Moussa"), Q_NAME, [Q_FINE, Q_OLD]),
  askFor(FROM("Mali"), Q_FROM, [Q_NAME, Q_FINE]),
  askFor(OLD("nine"), Q_OLD, [Q_FROM, Q_NAME]),
  askFor(NAME("Aminata"), Q_NAME, [Q_OLD, Q_FINE]),
  askFor(NAME("Fatou"), Q_NAME, [Q_FROM, Q_FINE]),
  askFor(OLD("ten"), Q_OLD, [Q_NAME, Q_FINE]),
  askFor(FROM("Guinea"), Q_FROM, [Q_FINE, Q_OLD]),
  askFor(FROM("France"), Q_FROM, [Q_OLD, Q_NAME]),
];

/** « Quelle question appelle la réponse « My name is Awa. » ? » */
export function makeCe1EnWhoQuestion(ctx: GameContext): GeneratedGame {
  return choiceLine(ctx, "ce1-en-who-question", WHO, WHO_QUESTIONS, 3, 1);
}

const WHO_PAIRS: readonly (readonly [string, string])[] = [
  [Q_NAME, NAME("Awa")],
  [Q_FINE, FINE],
  [Q_OLD, OLD("eight")],
  [Q_FROM, FROM("Senegal")],
];

/** « Relie chaque question à sa réponse. » */
export function makeCe1EnWhoLink(ctx: GameContext): GeneratedGame {
  return pairsOf(
    ctx,
    "ce1-en-who-relier",
    WHO,
    "Relie chaque question à sa réponse.",
    WHO_PAIRS,
    ["Lis une question, puis cherche sa réponse.", "La réponse à une question sur l'âge dit un nombre.", "Commence par la paire dont tu es le plus sûr."],
    3,
  );
}

const WHO_GAPS: readonly EnGap[] = [
  // Palier 1
  gap("What is your ___? My name is Awa.", "name", ["old", "from"], "On demande ici comment tu t'appelles."),
  gap("How ___ are you? I am eight.", "old", ["name", "fine"], "On demande ici ton âge."),
  gap("Where are you ___? I am from Mali.", "from", ["old", "fine"], "On demande ici d'où tu viens."),
  gap("How are you? I am ___, thank you.", "fine", ["name", "from"], "On dit ici que tout va bien."),
  // Palier 2
  gap("My ___ is Moussa.", "name", ["old", "fine"], "On dit ici comment on s'appelle."),
  gap("I ___ eight.", "am", ["is", "are"], "Avec « I », le verbe être se dit comme dans « I am »."),
  gap("I am ___ Senegal.", "from", ["old", "fine"], "On dit ici d'où on vient."),
  gap("How ___ you?", "are", ["am", "is"], "Avec « you », le verbe être se dit comme dans « you are »."),
  // Palier 3
  gap("What is your name? ___ name is Fatou.", "My", ["Your", "Am"], "Tu réponds, donc c'est ton nom à toi."),
  gap("How ___ are you? I am nine.", "old", ["name", "from"], "On demande ici ton âge."),
  gap("Where are you from? I ___ from France.", "am", ["is", "are"], "Avec « I », le verbe être se dit comme dans « I am »."),
  gap("I am fine, ___ you.", "thank", ["name", "from"], "On remercie ici quelqu'un."),
];

/** « What is your ___? My name is Awa. » : deux phrases à trou par palier, de mots différents. */
export function makeCe1EnWhoGap(ctx: GameContext): GeneratedGame {
  return gapLine(ctx, "ce1-en-who-trou", WHO, WHO_GAPS, 3, 2);
}

const DIALOGUE_HINTS: Hints = [
  "Une conversation commence par un bonjour ou par une question.",
  "Une réponse vient toujours après sa question.",
  "Au revoir se dit à la fin.",
];
const dialogue = (...lines: string[]): Steps => ({ prompt: "Remets ce petit dialogue dans l'ordre.", sequence: lines, hints: DIALOGUE_HINTS });

const WHO_DIALOGUES: readonly Steps[] = [
  dialogue("Hello.", Q_NAME, NAME("Awa")),
  dialogue("Hello.", Q_FINE, FINE),
  dialogue(Q_OLD, OLD("eight"), "Goodbye."),
];

/** Un petit dialogue de trois répliques, dans l'ordre d'une vraie conversation. */
export function makeCe1EnWhoDialogue(ctx: GameContext): GeneratedGame {
  return orderLine(ctx, "ce1-en-who-ordre", WHO, WHO_DIALOGUES, 3);
}

const WHO_SENTENCES: readonly Steps[] = [
  sentence("My name is Awa."),
  sentence("I am eight."),
  sentence("I am from Mali."),
  sentence("My name is Moussa."),
  sentence("What is your name?"),
  sentence("I am from Senegal."),
  sentence("How are you?"),
  sentence("I am fine, thank you."),
  sentence("Where are you from?"),
  sentence("How old are you?"),
  sentence("My name is Fatou."),
  sentence("I am from Gambia."),
];

/** Une phrase de la présentation à remettre dans l'ordre. */
export function makeCe1EnWhoSentence(ctx: GameContext): GeneratedGame {
  return orderLine(ctx, "ce1-en-who-phrase", WHO, WHO_SENTENCES, 3);
}

const FIRST_NAMES = ["Awa", "Moussa", "Fatou", "Ibrahima", "Aminata", "Cheikh"] as const;
const COUNTRIES = ["Senegal", "Mali", "Guinea", "Gambia", "France"] as const;

/** « Un prénom » ou « un pays » : des prénoms et les cinq pays de la fiche. */
export function makeCe1EnWhoSort(ctx: GameContext): GeneratedGame {
  return sortTiles(
    ctx,
    "ce1-en-who-glisser",
    WHO,
    "Glisse chaque mot dans la bonne case.",
    { zone: "Prénom", tiles: FIRST_NAMES },
    { zone: "Pays", tiles: COUNTRIES },
    [
      "Une personne porte un nom que ses parents ont choisi.",
      "Un grand territoire, avec ses frontières, a lui aussi un nom.",
      "Dis chaque mot à voix basse et cherche s'il nomme une personne ou un territoire.",
    ],
  );
}

// ===========================================================================
// LES JOURS DE LA SEMAINE (an-ce1-days, deux paliers)
// ===========================================================================

const DAYS_CONCEPT = "les jours de la semaine en anglais";

const DAYS = [
  { en: "Monday", fr: "lundi" },
  { en: "Tuesday", fr: "mardi" },
  { en: "Wednesday", fr: "mercredi" },
  { en: "Thursday", fr: "jeudi" },
  { en: "Friday", fr: "vendredi" },
  { en: "Saturday", fr: "samedi" },
  { en: "Sunday", fr: "dimanche" },
] as const;
const [MON, TUE, WED, THU, FRI, SAT, SUN] = DAYS.map((day) => day.en);

const DAYS_ORDER_HINTS: Hints = [
  "Dis les jours de la semaine en français, du lundi au dimanche.",
  "Cherche d'abord le jour qui vient en premier.",
  "Chaque jour vient juste après celui d'avant.",
];
const week = (...days: string[]): Steps => ({
  prompt: "Mets ces jours dans l'ordre de la semaine, en commençant par le premier.",
  sequence: days,
  hints: DAYS_ORDER_HINTS,
});

const DAYS_ORDERS: readonly Steps[] = [
  // Palier 1 : trois jours
  week(MON, TUE, WED),
  week(WED, THU, FRI),
  week(FRI, SAT, SUN),
  // Palier 2 : quatre ou cinq jours
  week(MON, TUE, WED, THU),
  week(THU, FRI, SAT, SUN),
  week(TUE, WED, THU, FRI, SAT),
];

/** Des jours à remettre dans l'ordre de la semaine : trois au premier palier, quatre ou cinq au second. */
export function makeCe1EnDaysOrder(ctx: GameContext): GeneratedGame {
  return orderLine(ctx, "ce1-en-days-ordre", DAYS_CONCEPT, DAYS_ORDERS, 2);
}

const DAYS_NEAR_HINTS: Hints = [
  "Dis les jours de la semaine en français, du lundi au dimanche.",
  "Cherche le jour demandé dans la suite des jours.",
  "Le jour cherché touche celui de la question.",
];
const after = (day: string, answer: string, wrong: readonly [string, string]): Fact => ({
  question: `Quel jour vient juste après ${day} ?`,
  answer,
  wrong,
  hints: DAYS_NEAR_HINTS,
});
const before = (day: string, answer: string, wrong: readonly [string, string]): Fact => ({
  question: `Quel jour vient juste avant ${day} ?`,
  answer,
  wrong,
  hints: DAYS_NEAR_HINTS,
});

const DAYS_NEXT: readonly Fact[] = [
  // Palier 1
  after(MON, TUE, [THU, SUN]),
  after(TUE, WED, [FRI, SUN]),
  before(TUE, MON, [THU, SAT]),
  before(WED, TUE, [FRI, SUN]),
  after(THU, FRI, [MON, WED]),
  before(FRI, THU, [MON, SAT]),
  // Palier 2
  after(FRI, SAT, [MON, WED]),
  after(SAT, SUN, [TUE, THU]),
  before(SAT, FRI, [MON, WED]),
  before(SUN, SAT, [TUE, THU]),
  after(WED, THU, [MON, SAT]),
  before(THU, WED, [FRI, SUN]),
];

/** « Quel jour vient juste après Monday ? » : le jour d'avant ou le jour d'après, deux fois par palier. */
export function makeCe1EnDaysNext(ctx: GameContext): GeneratedGame {
  return choiceLine(ctx, "ce1-en-days-apres", DAYS_CONCEPT, DAYS_NEXT, 2, 2);
}

const DAYS_GAP_CLUE = "Le jour de demain vient juste après le jour d'aujourd'hui.";
const dayGap = (text: string, answer: string, wrong: readonly [string, string]): EnGap =>
  gap(text, answer, wrong, DAYS_GAP_CLUE, "Complète la phrase avec le bon jour.");

const DAYS_GAPS: readonly EnGap[] = [
  // Palier 1
  dayGap("Today is Monday. Tomorrow is ___.", TUE, [THU, SUN]),
  dayGap("Today is Tuesday. Tomorrow is ___.", WED, [FRI, MON]),
  dayGap("Tomorrow is Thursday. Today is ___.", WED, [FRI, SUN]),
  dayGap("Tomorrow is Friday. Today is ___.", THU, [MON, SAT]),
  // Palier 2
  dayGap("Today is Friday. Tomorrow is ___.", SAT, [MON, WED]),
  dayGap("Today is Saturday. Tomorrow is ___.", SUN, [TUE, THU]),
  dayGap("Tomorrow is Sunday. Today is ___.", SAT, [TUE, THU]),
  dayGap("Tomorrow is Wednesday. Today is ___.", TUE, [FRI, SUN]),
];

/** « Today is Monday. Tomorrow is ___. » : deux phrases à trou par palier, de mots différents. */
export function makeCe1EnDaysGap(ctx: GameContext): GeneratedGame {
  return gapLine(ctx, "ce1-en-days-trou", DAYS_CONCEPT, DAYS_GAPS, 2, 2);
}

const DAYS_WRITE_HINTS: Hints = [
  "Dis les jours de la semaine en français, du lundi au dimanche.",
  "Le jour cherché touche le jour que la phrase donne.",
  "Un jour s'écrit avec une majuscule.",
];
const dayWrite = (given: string, answer: string): EnWrite => ({
  prompt: `Écris le jour qui manque, en anglais. ${given}`,
  accepted: [answer],
  hints: DAYS_WRITE_HINTS,
});

const DAYS_WRITES: readonly EnWrite[] = [
  // Palier 1
  dayWrite("Today is Monday. Tomorrow is ___.", TUE),
  dayWrite("Tomorrow is Wednesday. Today is ___.", TUE),
  dayWrite("Today is Wednesday. Tomorrow is ___.", THU),
  dayWrite("Tomorrow is Friday. Today is ___.", THU),
  // Palier 2
  dayWrite("Today is Friday. Tomorrow is ___.", SAT),
  dayWrite("Tomorrow is Sunday. Today is ___.", SAT),
  dayWrite("Today is Saturday. Tomorrow is ___.", SUN),
  dayWrite("Tomorrow is Thursday. Today is ___.", WED),
];

/** « Écris le jour qui manque, en anglais. Tomorrow is Wednesday. Today is ___. » */
export function makeCe1EnDaysWrite(ctx: GameContext): GeneratedGame {
  return writeLine(ctx, "ce1-en-days-ecrire", DAYS_CONCEPT, DAYS_WRITES, 2, 1);
}

const DAYS_PAIRS: readonly (readonly [string, string])[] = DAYS.map((day) => [day.fr, day.en] as const);

/** « Relie chaque jour français à son jour anglais. » */
export function makeCe1EnDaysLink(ctx: GameContext): GeneratedGame {
  return pairsOf(
    ctx,
    "ce1-en-days-relier",
    DAYS_CONCEPT,
    "Relie chaque jour français à son jour anglais.",
    DAYS_PAIRS,
    [
      "Dis les jours de la semaine en français, dans l'ordre.",
      "Cherche d'abord le jour anglais que tu connais déjà.",
      "Commence par la paire dont tu es le plus sûr.",
    ],
    2,
  );
}

/** « Du lundi au vendredi » ou « le week-end » : cinq jours de la semaine et les deux jours du week-end. */
export function makeCe1EnDaysSort(ctx: GameContext): GeneratedGame {
  return sortTiles(
    ctx,
    "ce1-en-days-glisser",
    DAYS_CONCEPT,
    "Glisse chaque jour dans la bonne case.",
    { zone: "Du lundi au vendredi", tiles: [MON, TUE, WED, THU, FRI] },
    { zone: "Week-end", tiles: [SAT, SUN] },
    [
      "Dis les jours de la semaine en français, dans l'ordre.",
      "Samedi et dimanche sont les deux derniers jours de la semaine.",
      "Les cinq premiers jours vont ensemble.",
    ],
  );
}

const DAYS_SENTENCES: readonly Steps[] = [
  sentence("Today is Monday."),
  sentence("Tomorrow is Tuesday."),
  sentence("Today is Wednesday."),
  sentence("Tomorrow is Friday."),
  sentence("Today is Saturday."),
  sentence("Tomorrow is Sunday."),
];

/** « Today is Monday. » ou « Tomorrow is Tuesday. » remis dans l'ordre. */
export function makeCe1EnDaysSentence(ctx: GameContext): GeneratedGame {
  return orderLine(ctx, "ce1-en-days-phrase", DAYS_CONCEPT, DAYS_SENTENCES, 2);
}

// ===========================================================================
// A OU AN ? (an-ce1-a-an, trois paliers)
// ===========================================================================

const AAN = "choisir a ou an devant un mot";

/** Les mots qui commencent par une consonne : « a ». */
const A_WORDS = ["dog", "cat", "bird", "fish", "cow", "goat", "horse", "monkey", "lion", "banana", "mango", "lemon", "book", "pen", "pencil", "bag", "ruler", "desk", "chair", "board", "door", "window", "head", "nose", "mouth", "hand", "leg"] as const;
/** Les mots qui commencent par une voyelle : « an ». */
const AN_WORDS = ["apple", "orange", "egg", "elephant", "arm", "ear", "eye"] as const;

/** « a » ou « an » : des mots de chaque sorte, les deux cases toujours servies. */
export function makeCe1EnAanSort(ctx: GameContext): GeneratedGame {
  return sortTiles(
    ctx,
    "ce1-en-aan-glisser",
    AAN,
    "« a » ou « an » ? Glisse chaque mot dans la bonne case.",
    { zone: "a", tiles: A_WORDS },
    { zone: "an", tiles: AN_WORDS },
    [
      "Regarde la première lettre de chaque mot.",
      "Un mot qui commence par une voyelle (a, e, i, o, u) va avec la case la plus longue.",
      "Un mot qui commence par une consonne va avec la case la plus courte.",
    ],
  );
}

const aanOf = (word: string) => ((AN_WORDS as readonly string[]).includes(word) ? "an" : "a");

const AAN_HINTS: Hints = [
  "Regarde la première lettre du mot.",
  "Une voyelle (a, e, i, o, u) demande le plus long des deux petits mots.",
  "Une consonne demande le plus court.",
];

/** Les mots d'un palier : une série de chacun des trois paliers, deux mots qui prennent « a » et deux qui prennent « an ». */
const AAN_SERIES = [
  ["dog", "apple", "banana", "egg"],
  ["cat", "orange", "book", "elephant"],
  ["lion", "ear", "mango", "eye"],
] as const;
const aanRows = <T>(build: (word: string) => T): T[] => AAN_SERIES.flatMap((series) => series.map(build));

const AAN_PHRASES: readonly Fact[] = aanRows((word) => ({
  question: "Quelle phrase est juste ?",
  answer: `It is ${aanOf(word)} ${word}.`,
  wrong: [`It is ${aanOf(word) === "a" ? "an" : "a"} ${word}.`, `It is ${word}.`] as [string, string],
  hints: AAN_HINTS,
}));

/** « Quelle phrase est juste ? » : « It is an apple. » parmi la même phrase avec le mauvais petit mot et la phrase sans petit mot. */
export function makeCe1EnAanPhrase(ctx: GameContext): GeneratedGame {
  return choiceLine(ctx, "ce1-en-aan-phrase", AAN, AAN_PHRASES, 3, 2);
}

const AAN_GAPS: readonly EnGap[] = aanRows((word) => ({
  prompt: `Complète la phrase avec le mot « ${word} ».`,
  text: "What is it? It is ___.",
  answer: `${aanOf(word)} ${word}`,
  wrong: [`${aanOf(word) === "a" ? "an" : "a"} ${word}`, word] as [string, string],
  hints: [GAP_READ, "Le mot est à droite du trou : regarde sa première lettre.", "Une voyelle demande le plus long des deux petits mots."] as Hints,
}));

/** « What is it? It is ___. » : « an apple » parmi « a apple » et « apple ». */
export function makeCe1EnAanGap(ctx: GameContext): GeneratedGame {
  return gapLine(ctx, "ce1-en-aan-trou", AAN, AAN_GAPS, 3, 2);
}

const AAN_SENTENCES: readonly Steps[] = AAN_SERIES.flatMap((series) => [
  sentence(`It is ${aanOf(series[0])} ${series[0]}.`),
  sentence(`It is ${aanOf(series[1])} ${series[1]}.`),
]);

/** « It is an apple. » remis dans l'ordre. */
export function makeCe1EnAanOrder(ctx: GameContext): GeneratedGame {
  return orderLine(ctx, "ce1-en-aan-ordre", AAN, AAN_SENTENCES, 3);
}

const AAN_PAIRS: readonly (readonly [string, string])[] = ["dog", "apple", "banana", "egg", "book", "elephant", "cat", "orange"].map(
  (word) => [word, `It is ${aanOf(word)} ${word}.`] as const,
);

/** « Relie chaque mot à sa phrase. » */
export function makeCe1EnAanLink(ctx: GameContext): GeneratedGame {
  return pairsOf(
    ctx,
    "ce1-en-aan-relier",
    AAN,
    "Relie chaque mot à sa phrase.",
    AAN_PAIRS,
    [
      "Regarde la première lettre de chaque mot.",
      "Une phrase avec le plus long des deux petits mots va avec un mot qui commence par une voyelle.",
      "Commence par la paire dont tu es le plus sûr.",
    ],
    3,
  );
}

const AAN_WRITES: readonly EnWrite[] = aanRows((word) => ({
  prompt: `Écris le petit mot qui manque. It is ___ ${word}.`,
  accepted: [aanOf(word)],
  hints: AAN_HINTS,
}));

/** « Écris le petit mot qui manque. It is ___ elephant. » : a ou an, écrit. */
export function makeCe1EnAanWrite(ctx: GameContext): GeneratedGame {
  return writeLine(ctx, "ce1-en-aan-ecrire", AAN, AAN_WRITES, 3, 2);
}

// ===========================================================================
// LES VÊTEMENTS (an-ce1-clothes, deux paliers)
// ===========================================================================

const CLOTHES_CONCEPT = "les vêtements en anglais";

/** La liste de la fiche. Seuls cinq vêtements ont un dessin sûr ; les autres passent par leur sens en français. */
const CLOTHES: readonly Word[] = [
  { en: "T-shirt", fr: "tee-shirt", the: "le tee-shirt", emoji: "👕" },
  { en: "shirt", fr: "chemise", the: "la chemise" },
  { en: "trousers", fr: "pantalon", the: "le pantalon" },
  { en: "skirt", fr: "jupe", the: "la jupe" },
  { en: "dress", fr: "robe", the: "la robe", emoji: "👗" },
  { en: "shoes", fr: "chaussures", the: "les chaussures", emoji: "👟" },
  { en: "socks", fr: "chaussettes", the: "les chaussettes", emoji: "🧦" },
  { en: "hat", fr: "chapeau", the: "le chapeau" },
  { en: "cap", fr: "casquette", the: "la casquette", emoji: "🧢" },
  { en: "boubou", fr: "boubou", the: "le boubou" },
];

/** Les vêtements qu'on dit au singulier avec un petit mot : « It is a dress. » (shoes, socks et trousers sont des mots entiers). */
const WORN_ALONE = CLOTHES.filter((word) => !["trousers", "shoes", "socks"].includes(word.en));

/** « Quel mot va avec ce dessin ? » : un vêtement dessiné, la moitié des dessins à chaque palier. */
export function makeCe1EnClothesWord(ctx: GameContext): GeneratedGame {
  return drawingWord("ce1-en-clothes-mot", ctx, bandPart(withPicture(CLOTHES), ctx.level, 2), CLOTHES, CLOTHES_CONCEPT);
}

/** « Comment dit-on « la jupe » en anglais ? » : deux fois par palier, la moitié de la liste. */
export function makeCe1EnClothesFrench(ctx: GameContext): GeneratedGame {
  return frenchWord("ce1-en-clothes-francais", ctx, bandPart(CLOTHES, ctx.level, 2), CLOTHES, CLOTHES_CONCEPT);
}

const PICTURED_PAIRS = withPicture(CLOTHES).map((word) => [word.emoji as string, word.en] as const);
const FRENCH_PAIRS = CLOTHES.map((word) => [word.fr, word.en] as const);

/** Relier un dessin à son mot au premier palier, un mot français à son mot anglais au second. */
export function makeCe1EnClothesLink(ctx: GameContext): GeneratedGame {
  const pool = ctx.level <= 2 ? PICTURED_PAIRS : FRENCH_PAIRS;
  const prompt = ctx.level <= 2 ? "Relie chaque dessin à son mot." : "Relie chaque mot français à son mot anglais.";
  return linkGame(ctx, "ce1-en-clothes-relier", CLOTHES_CONCEPT, () => {
    const chosen = pickFresh(ctx, triples(pool), (trio) => `ce1-en-clothes-relier:${trio.map((pair) => pair[0]).join("|")}`);
    return {
      prompt,
      pairs: shuffle(ctx.rng, chosen).map(([left, right]) => ({ left, right })),
      hints: ["Regarde les éléments l'un après l'autre.", "Dis en français de quoi il s'agit, puis cherche le mot anglais.", "Commence par la paire dont tu es le plus sûr."],
    };
  });
}

/** Un vêtement, sa couleur, et ce que l'enfant lit en français : « une robe rouge ». */
type Outfit = { fr: string; colour: string; noun: string };

const OUTFITS: readonly Outfit[] = [
  // Palier 1
  { fr: "une robe rouge", colour: "red", noun: "dress" },
  { fr: "un tee-shirt bleu", colour: "blue", noun: "T-shirt" },
  { fr: "une jupe verte", colour: "green", noun: "skirt" },
  { fr: "un chapeau noir", colour: "black", noun: "hat" },
  { fr: "une chemise blanche", colour: "white", noun: "shirt" },
  { fr: "une casquette jaune", colour: "yellow", noun: "cap" },
  { fr: "un boubou rose", colour: "pink", noun: "boubou" },
  // Palier 2
  { fr: "une robe bleue", colour: "blue", noun: "dress" },
  { fr: "un tee-shirt jaune", colour: "yellow", noun: "T-shirt" },
  { fr: "une jupe rose", colour: "pink", noun: "skirt" },
  { fr: "un chapeau vert", colour: "green", noun: "hat" },
  { fr: "une chemise rouge", colour: "red", noun: "shirt" },
  { fr: "une casquette noire", colour: "black", noun: "cap" },
  { fr: "un boubou blanc", colour: "white", noun: "boubou" },
];
const COLOURS = ["red", "blue", "yellow", "green", "black", "white", "pink"] as const;

const outfitSentence = (outfit: Outfit) => `It is a ${outfit.colour} ${outfit.noun}.`;

const COLOUR_ORDER_HINTS: Hints = [
  "En anglais, la couleur se place avant le nom.",
  "Le petit mot vient en premier, puis la couleur, puis le vêtement.",
  "Compare l'ordre des mots à celui du français, il est différent.",
];

const OUTFIT_PHRASES: readonly Fact[] = OUTFITS.map((outfit) => ({
  question: `Quelle phrase dit « ${outfit.fr} » ?`,
  answer: outfitSentence(outfit),
  wrong: [`It is a ${outfit.noun} ${outfit.colour}.`, `It is ${outfit.colour} a ${outfit.noun}.`] as [string, string],
  hints: COLOUR_ORDER_HINTS,
}));

/** « Quelle phrase dit « une robe rouge » ? » : « It is a red dress. », la couleur avant le nom. */
export function makeCe1EnClothesColour(ctx: GameContext): GeneratedGame {
  return choiceLine(ctx, "ce1-en-clothes-couleur", CLOTHES_CONCEPT, OUTFIT_PHRASES, 2, 2);
}

/** « It is a red dress. » remis dans l'ordre. */
export function makeCe1EnClothesSentence(ctx: GameContext): GeneratedGame {
  return orderLine(ctx, "ce1-en-clothes-phrase", CLOTHES_CONCEPT, OUTFITS.map((outfit) => sentence(outfitSentence(outfit))), 2);
}

const outfitGap = (outfit: Outfit, index: number): EnGap => {
  const others = COLOURS.filter((colour) => colour !== outfit.colour);
  const wrong: [string, string] = [others[index % others.length], others[(index + 3) % others.length]];
  return gap(`It is a ___ ${outfit.noun}.`, outfit.colour, wrong, "La couleur se place avant le nom.", `Complète la phrase pour dire « ${outfit.fr} ».`);
};

/** « Complète la phrase pour dire « une robe rouge ». » : « It is a ___ dress. » */
export function makeCe1EnClothesColourGap(ctx: GameContext): GeneratedGame {
  return gapLine(ctx, "ce1-en-clothes-trou", CLOTHES_CONCEPT, OUTFITS.map(outfitGap), 2, 1);
}

/** « Complète la phrase pour dire « la jupe ». » : « It is a ___. » */
export function makeCe1EnClothesWordGap(ctx: GameContext): GeneratedGame {
  const words = bandPart(WORN_ALONE, ctx.level, 2);
  return gapGame(ctx, "ce1-en-clothes-trou-mot", CLOTHES_CONCEPT, () => {
    const answer = freshWord(ctx, words);
    const wrong = shuffle(
      ctx.rng,
      WORN_ALONE.filter((word) => word.en !== answer.en),
    ).slice(0, 2);
    return {
      prompt: `Complète la phrase pour dire « ${answer.the} ».`,
      text: "It is a ___.",
      answer: answer.en,
      wrong: [wrong[0].en, wrong[1].en],
      hints: ["Lis la phrase en anglais, doucement.", "Pense à ce que veut dire le mot français de la consigne.", firstLetterHint(answer)],
    };
  });
}

// ===========================================================================
// J'AIME, JE N'AIME PAS (an-ce1-likes, trois paliers)
// ===========================================================================

const LIKES = "dire ce qu'on aime et ce qu'on n'aime pas, en anglais";

/** Les aliments qui se disent sans petit mot : rice, fish, bread, chicken, milk, water, mango. */
const FOODS = [
  { en: "rice", fr: "le riz" },
  { en: "fish", fr: "le poisson" },
  { en: "bread", fr: "le pain" },
  { en: "chicken", fr: "le poulet" },
  { en: "milk", fr: "le lait" },
  { en: "water", fr: "l'eau" },
  { en: "mango", fr: "la mangue" },
] as const;
type FoodName = (typeof FOODS)[number]["en"];
const FOOD = Object.fromEntries(FOODS.map((food) => [food.en, food])) as Record<FoodName, (typeof FOODS)[number]>;

const LIKES_GAPS: readonly EnGap[] = [
  // Palier 1 : dire qu'on aime
  gap("I ___ rice.", "like", ["am", "do"], "On dit ici qu'on aime le riz."),
  gap("Do you like mango? Yes, I ___.", "do", ["like", "am"], "On répond oui avec le petit mot de la question."),
  gap("I ___ fish.", "like", ["am", "is"], "On dit ici qu'on aime le poisson."),
  gap("___ you like bread?", "Do", ["Am", "Is"], "C'est le petit mot qui commence une question."),
  // Palier 2 : dire qu'on n'aime pas
  gap("I do not ___ fish.", "like", ["am", "is"], "On dit ici qu'on n'aime pas le poisson."),
  gap("Do you like bread? No, I do ___.", "not", ["like", "am"], "On répond non avec le petit mot qui nie."),
  gap("I do ___ like milk.", "not", ["am", "is"], "On dit ici qu'on n'aime pas le lait."),
  gap("Do you like water? Yes, I ___.", "do", ["like", "are"], "On répond oui avec le petit mot de la question."),
  // Palier 3 : les deux, et la question
  gap("___ you like chicken?", "Do", ["Am", "Is"], "C'est le petit mot qui commence une question."),
  gap("I do not like mango. I ___ rice.", "like", ["am", "not"], "On dit ici qu'on aime le riz."),
  gap("Do you like fish? No, I do ___.", "not", ["like", "are"], "On répond non avec le petit mot qui nie."),
  gap("I ___ not like water.", "do", ["am", "is"], "Le petit mot qui nie vient avec lui."),
];

/** « I ___ rice. » : deux phrases à trou par palier, de mots différents. */
export function makeCe1EnLikesGap(ctx: GameContext): GeneratedGame {
  return gapLine(ctx, "ce1-en-likes-trou", LIKES, LIKES_GAPS, 3, 2);
}

const YES_HINTS: Hints = ["La question parle de ce que tu aimes.", "Tu aimes ce mets, donc la réponse commence par oui.", "Pour répondre oui, on reprend le petit mot de la question."];
const NO_HINTS: Hints = ["La question parle de ce que tu aimes.", "Tu n'aimes pas ce mets, donc la réponse commence par non.", "Pour répondre non, on ajoute le petit mot qui nie."];
const yes = (food: FoodName): Fact => ({
  question: `On te demande « Do you like ${food}? ». Tu aimes ${FOOD[food].fr}. Quelle réponse ?`,
  answer: "Yes, I do.",
  wrong: ["Yes, I like.", "No, I do."],
  hints: YES_HINTS,
});
const no = (food: FoodName): Fact => ({
  question: `On te demande « Do you like ${food}? ». Tu n'aimes pas ${FOOD[food].fr}. Quelle réponse ?`,
  answer: "No, I do not.",
  wrong: ["No, I do.", "Yes, I do not."],
  hints: NO_HINTS,
});

const LIKES_REPLIES: readonly Fact[] = [
  yes("mango"),
  no("fish"),
  yes("rice"),
  no("bread"),
  no("milk"),
  yes("chicken"),
  yes("water"),
  no("mango"),
  no("rice"),
  yes("bread"),
  yes("milk"),
  no("chicken"),
];

/** « Do you like mango? » : la réponse courte, « Yes, I do. » ou « No, I do not. » */
export function makeCe1EnLikesReply(ctx: GameContext): GeneratedGame {
  return choiceLine(ctx, "ce1-en-likes-reponse", LIKES, LIKES_REPLIES, 3, 2);
}

const MEANING_HINTS: Hints = [
  "Lis la phrase anglaise en entier, doucement.",
  "Cherche si la phrase dit oui ou non à ce mets.",
  "Une phrase qui contient le petit mot qui nie dit le contraire.",
];
const like = (food: FoodName): Fact => ({
  question: `Que veut dire « I like ${food}. » ?`,
  answer: `J'aime ${FOOD[food].fr}.`,
  wrong: [`Je n'aime pas ${FOOD[food].fr}.`, `Tu aimes ${FOOD[food].fr}.`],
  hints: MEANING_HINTS,
});
const dislike = (food: FoodName): Fact => ({
  question: `Que veut dire « I do not like ${food}. » ?`,
  answer: `Je n'aime pas ${FOOD[food].fr}.`,
  wrong: [`J'aime ${FOOD[food].fr}.`, `Tu n'aimes pas ${FOOD[food].fr}.`],
  hints: MEANING_HINTS,
});
const doYouLike = (food: FoodName): Fact => ({
  question: `Que veut dire « Do you like ${food}? » ?`,
  answer: `Tu aimes ${FOOD[food].fr} ?`,
  wrong: [`J'aime ${FOOD[food].fr}.`, `Je n'aime pas ${FOOD[food].fr}.`],
  hints: MEANING_HINTS,
});

const LIKES_MEANINGS: readonly Fact[] = [
  like("rice"),
  like("fish"),
  doYouLike("mango"),
  like("bread"),
  dislike("fish"),
  like("milk"),
  dislike("bread"),
  doYouLike("chicken"),
  dislike("water"),
  like("chicken"),
  dislike("mango"),
  doYouLike("rice"),
];

/** « Que veut dire « I do not like fish. » ? » : le sens français d'une phrase. */
export function makeCe1EnLikesMeaning(ctx: GameContext): GeneratedGame {
  return choiceLine(ctx, "ce1-en-likes-sens", LIKES, LIKES_MEANINGS, 3, 2);
}

const LIKES_SENTENCES: readonly Steps[] = [
  sentence("I like rice."),
  sentence("I like fish."),
  sentence("Do you like mango?"),
  sentence("I like bread."),
  sentence("I do not like fish."),
  sentence("Do you like milk?"),
  sentence("I do not like bread."),
  sentence("Do you like chicken?"),
  sentence("I do not like water."),
  sentence("I do not like mango."),
  sentence("Do you like rice?"),
  sentence("I like water."),
];

/** « I like rice. », « I do not like fish. » ou « Do you like mango? » remis dans l'ordre. */
export function makeCe1EnLikesSentence(ctx: GameContext): GeneratedGame {
  return orderLine(ctx, "ce1-en-likes-phrase", LIKES, LIKES_SENTENCES, 3);
}

const LIKES_PAIRS: readonly (readonly [string, string])[] = [
  ["I like rice.", "J'aime le riz."],
  ["I do not like fish.", "Je n'aime pas le poisson."],
  ["Do you like mango?", "Tu aimes la mangue ?"],
  ["I like bread.", "J'aime le pain."],
  ["I do not like milk.", "Je n'aime pas le lait."],
];

/** « Relie chaque phrase anglaise à son sens. » */
export function makeCe1EnLikesLink(ctx: GameContext): GeneratedGame {
  return pairsOf(
    ctx,
    "ce1-en-likes-relier",
    LIKES,
    "Relie chaque phrase anglaise à son sens.",
    LIKES_PAIRS,
    [
      "Lis une phrase anglaise, doucement.",
      "Une phrase avec le petit mot qui nie dit non à ce mets.",
      "Une phrase qui finit par un point d'interrogation pose une question.",
    ],
    3,
  );
}

const LIKE_TILES = FOODS.map((food) => `I like ${food.en}.`);
const DISLIKE_TILES = FOODS.map((food) => `I do not like ${food.en}.`);

/** « J'aime » ou « Je n'aime pas » : des phrases qui disent qu'on aime, et des phrases qui disent qu'on n'aime pas. */
export function makeCe1EnLikesSort(ctx: GameContext): GeneratedGame {
  return sortTiles(
    ctx,
    "ce1-en-likes-glisser",
    LIKES,
    "Glisse chaque phrase dans la bonne case.",
    { zone: "J'aime", tiles: LIKE_TILES },
    { zone: "Je n'aime pas", tiles: DISLIKE_TILES },
    [
      "Lis chaque phrase anglaise, doucement.",
      "Une phrase avec le petit mot qui nie dit non à ce mets.",
      "Les autres phrases disent oui à ce mets.",
    ],
  );
}

// ===========================================================================
// LES ORDRES DE LA CLASSE (an-ce1-commands, deux paliers)
// ===========================================================================

const CMD = "comprendre les ordres de la classe en anglais";

/** La liste de la fiche. Cinq ordres ont un dessin sûr ; les autres passent par leur sens en français. */
const ORDERS: readonly Word[] = [
  { en: "stand up", fr: "lève-toi", the: "lève-toi" },
  { en: "sit down", fr: "assieds-toi", the: "assieds-toi" },
  { en: "open your book", fr: "ouvre ton livre", the: "ouvre ton livre", emoji: "📖" },
  { en: "close your book", fr: "ferme ton livre", the: "ferme ton livre", emoji: "📕" },
  { en: "look", fr: "regarde", the: "regarde", emoji: "👀" },
  { en: "listen", fr: "écoute", the: "écoute", emoji: "👂" },
  { en: "write", fr: "écris", the: "écris" },
  { en: "read", fr: "lis", the: "lis" },
  { en: "come here", fr: "viens ici", the: "viens ici" },
  { en: "be quiet", fr: "tais-toi", the: "tais-toi", emoji: "🤫" },
];

/** « Quel mot va avec ce dessin ? » : un ordre dessiné, deux par palier. */
export function makeCe1EnOrdersWord(ctx: GameContext): GeneratedGame {
  const pictured = withPicture(ORDERS);
  return drawingWord("ce1-en-cmd-mot", ctx, bandPart(pictured, ctx.level, 2), pictured, CMD);
}

/** « Comment dit-on « ouvre ton livre » en anglais ? » : la moitié de la liste à chaque palier. */
export function makeCe1EnOrdersFrench(ctx: GameContext): GeneratedGame {
  return frenchWord("ce1-en-cmd-francais", ctx, bandPart(ORDERS, ctx.level, 2), ORDERS, CMD);
}

const ORDER_PICTURE_PAIRS = withPicture(ORDERS).map((word) => [word.emoji as string, word.en] as const);
const ORDER_FRENCH_PAIRS = ORDERS.map((word) => [word.fr, word.en] as const);

/** Relier un dessin à son ordre au premier palier, un ordre français à son ordre anglais au second. */
export function makeCe1EnOrdersLink(ctx: GameContext): GeneratedGame {
  const pool = ctx.level <= 2 ? ORDER_PICTURE_PAIRS : ORDER_FRENCH_PAIRS;
  const prompt = ctx.level <= 2 ? "Associe chaque dessin à l'ordre de la maîtresse." : "Relie chaque ordre français à son ordre anglais.";
  return linkGame(ctx, "ce1-en-cmd-relier", CMD, () => {
    const chosen = pickFresh(ctx, triples(pool), (trio) => `ce1-en-cmd-relier:${trio.map((pair) => pair[0]).join("|")}`);
    return {
      prompt,
      pairs: shuffle(ctx.rng, chosen).map(([left, right]) => ({ left, right })),
      hints: ["Prends les éléments l'un après l'autre.", "Dis en français de quoi il s'agit, puis cherche l'ordre anglais.", "Commence par la paire dont tu es le plus sûr."],
    };
  });
}

const SITUATION_HINTS: Hints = ["Imagine la scène dans ta classe.", "Dis en français l'ordre que la maîtresse donne.", "Cherche ensuite l'ordre anglais qui a ce sens."];
const situation = (text: string, answer: string, wrong: readonly [string, string]): Fact => ({
  question: `${text} Quel ordre dit-elle ?`,
  answer,
  wrong,
  hints: SITUATION_HINTS,
});

const SITUATIONS: readonly Fact[] = [
  // Palier 1
  situation("La maîtresse veut que tout le monde se lève.", "stand up", ["sit down", "be quiet"]),
  situation("La maîtresse veut que tout le monde s'asseye.", "sit down", ["stand up", "write"]),
  situation("La maîtresse veut que tu ouvres ton livre.", "open your book", ["close your book", "come here"]),
  situation("La maîtresse veut que tu fermes ton livre.", "close your book", ["open your book", "listen"]),
  situation("La maîtresse veut que tu regardes le tableau.", "look", ["write", "read"]),
  // Palier 2
  situation("La maîtresse veut que tu écoutes l'histoire.", "listen", ["look", "stand up"]),
  situation("La maîtresse veut que tu écrives sur ton cahier.", "write", ["listen", "sit down"]),
  situation("La maîtresse veut que tu lises le texte.", "read", ["be quiet", "come here"]),
  situation("La maîtresse veut que tu viennes près d'elle.", "come here", ["stand up", "read"]),
  situation("La maîtresse veut que la classe fasse silence.", "be quiet", ["write", "look"]),
];

/** « La maîtresse veut que tout le monde se lève. Quel ordre dit-elle ? » : deux par palier. */
export function makeCe1EnOrdersSituation(ctx: GameContext): GeneratedGame {
  return choiceLine(ctx, "ce1-en-cmd-situation", CMD, SITUATIONS, 2, 2);
}

/** Les ordres d'au moins trois mots : « Look, please. » n'a que deux tuiles, l'enfant aurait une chance sur deux. */
const ORDER_SENTENCES: readonly Steps[] = [
  // Palier 1
  sentence("Stand up, please."),
  sentence("Sit down, please."),
  sentence("Open your book, please."),
  // Palier 2
  sentence("Close your book, please."),
  sentence("Come here, please."),
  sentence("Be quiet, please."),
];

/** « Open your book, please. » remis dans l'ordre. */
export function makeCe1EnOrdersSentence(ctx: GameContext): GeneratedGame {
  return orderLine(ctx, "ce1-en-cmd-phrase", CMD, ORDER_SENTENCES, 2);
}

const ORDER_GAPS: readonly EnGap[] = [
  // Palier 1
  gap("Open your ___, please.", "book", ["pen", "bag"], "On ouvre ici ce qu'on lit.", "Complète l'ordre pour dire « ouvre ton livre »."),
  gap("Stand ___, please.", "up", ["down", "here"], "On se met debout.", "Complète l'ordre pour dire « lève-toi »."),
  gap("Sit ___, please.", "down", ["up", "here"], "On se met assis.", "Complète l'ordre pour dire « assieds-toi »."),
  // Palier 2
  gap("Come ___, please.", "here", ["up", "down"], "On vient près de la maîtresse.", "Complète l'ordre pour dire « viens ici »."),
  gap("___ your book, please.", "Close", ["Open", "Read"], "On ferme ce qu'on avait ouvert.", "Complète l'ordre pour dire « ferme ton livre »."),
  gap("Be ___, please.", "quiet", ["up", "here"], "On ne fait plus de bruit.", "Complète l'ordre pour dire « tais-toi »."),
];

/** « Complète l'ordre pour dire « lève-toi ». » : « Stand ___, please. » */
export function makeCe1EnOrdersGap(ctx: GameContext): GeneratedGame {
  return gapLine(ctx, "ce1-en-cmd-trou", CMD, ORDER_GAPS, 2, 1);
}

/** « Avec mon livre » ou « Avec mon corps » : les ordres du livre et les ordres du corps. */
export function makeCe1EnOrdersSort(ctx: GameContext): GeneratedGame {
  return sortTiles(
    ctx,
    "ce1-en-cmd-glisser",
    CMD,
    "Glisse chaque ordre dans la bonne case.",
    { zone: "Avec mon livre", tiles: ["open your book", "close your book", "read"] },
    { zone: "Avec mon corps", tiles: ["stand up", "sit down", "come here"] },
    [
      "Dis chaque ordre en français.",
      "Certains ordres parlent de pages à lire, les autres te font bouger.",
      "Pense à ce que tu fais quand tu entends chaque ordre.",
    ],
  );
}
