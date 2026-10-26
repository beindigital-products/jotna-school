/**
 * LES GABARITS DE GRAMMAIRE DU CE1 EN ANGLAIS : un ou plusieurs (`an-ce1-plural`) et mon, ton, son (`an-ce1-possessives`).
 *
 * Le plan (`docs/programme-anglais-v2.md`, lot 3) : le pluriel apparaissait pour la première fois au CE2, noyé dans « have
 * got », et les adjectifs possessifs n'étaient jamais enseignés seuls. Ils viennent ici, avant « j'aime » et « les ordres de la
 * classe », qui les emploient.
 *
 * COMME AU CE1 (`ce1Anglais.ts`) : la consigne est en français, l'anglais n'est que dans ce que l'enfant apprend, tout est lu
 * (la voix s'arrête au CP), les émojis sont d'Unicode 11 au plus et sans U+FE0F. Les trois paliers prennent chacun un tiers de
 * chaque tableau (`BANDS`).
 *
 * UN OU PLUSIEURS
 * - Douze mots des thématiques du CI et du CP : cat, dog, book, banana | bag, apple, egg, bird | goat, lion, fish, sheep. Les
 *   deux derniers ne changent pas au pluriel (« two fish », « three sheep ») : ils sont au troisième palier, jamais avant.
 * - Le nombre s'écrit en toutes lettres (one à five) et le dessin est répété autant de fois : le nombre et le dessin disent la
 *   même chose, et la bonne réponse est la seule forme qui va avec les deux.
 * - Les fautes sont celles des francophones : « three cat » (pas de s), « one cats » (un s de trop), « two fishs » (le s de
 *   « fish »). Jamais « -es » pour un mot régulier : « mango, mangoes » est au programme du CM1.
 *
 * MON, TON, SON
 * - my, your, his, her avec les sujets I, you, he, she. L'énoncé NOMME le sujet (« Le mot va avec « he ». ») : sans cela, « He is
 *   Omar. ___ dog is brown. » accepterait aussi « my » (le chien de celui qui parle). Le français « son » est ambigu (his ou
 *   her) : il n'y a donc jamais de « son » ni de « sa » dans un énoncé, seulement « le sac d'Awa » (her) ou « le sac d'Omar » (his).
 * - Les noms d'objets sont ceux de la classe et de la famille ; les adjectifs sont les couleurs du CI.
 *
 * MODULE PUR (voir `types.ts`).
 */
import type { GameContext, GeneratedGame } from "./shared";
import { choiceLine, gapLine, orderLine, pairsOf, sentence, sortTiles, writeLine, type Bands, type EnGap, type EnWrite } from "./ce1Anglais";
import type { Fact } from "./ce1SciencesOutils";
import type { Hints } from "./tableaux";

const BANDS: Bands = 3;

// ===========================================================================
// UN OU PLUSIEURS (an-ce1-plural)
// ===========================================================================

const PLURAL_CONCEPT = "un ou plusieurs : le s du pluriel en anglais";
export const NUMBER_WORDS: readonly string[] = ["zero", "one", "two", "three", "four", "five"];

export type PluralWord = {
  en: string;
  /** Le pluriel : « cats », mais « fish » ne change pas. */
  plural: string;
  the: string;
  emoji: string;
};

/** Les douze mots, par part de palier : quatre réguliers, quatre réguliers, deux réguliers et deux qui ne changent pas. */
export const PLURAL_WORDS: readonly PluralWord[] = [
  { en: "cat", plural: "cats", the: "le chat", emoji: "🐱" },
  { en: "dog", plural: "dogs", the: "le chien", emoji: "🐶" },
  { en: "book", plural: "books", the: "le livre", emoji: "📖" },
  { en: "banana", plural: "bananas", the: "la banane", emoji: "🍌" },
  { en: "bag", plural: "bags", the: "le sac", emoji: "🎒" },
  { en: "apple", plural: "apples", the: "la pomme", emoji: "🍎" },
  { en: "egg", plural: "eggs", the: "l'œuf", emoji: "🥚" },
  { en: "bird", plural: "birds", the: "l'oiseau", emoji: "🐦" },
  { en: "goat", plural: "goats", the: "la chèvre", emoji: "🐐" },
  { en: "lion", plural: "lions", the: "le lion", emoji: "🦁" },
  { en: "fish", plural: "fish", the: "le poisson", emoji: "🐟" },
  { en: "sheep", plural: "sheep", the: "le mouton", emoji: "🐑" },
];

const isRegular = (word: PluralWord) => word.plural !== word.en;
/** Combien de dessins pour le pluriel d'un mot : deux à cinq, en tournant d'un mot à l'autre. */
export const countFor = (index: number) => 2 + (index % 4);
const drawn = (word: PluralWord, count: number) => word.emoji.repeat(count);

const pluralHints = (word: PluralWord, count: number): Hints => [
  "Compte les dessins.",
  count === 1
    ? "Quand il n'y en a qu'un seul, le nom ne prend pas de s."
    : isRegular(word)
      ? "Quand il y en a plusieurs, le nom prend un s."
      : "Fish et sheep ne changent pas quand il y en a plusieurs.",
  `Le nom est le mot anglais de ${word.the}.`,
];

/** « Quelle est la bonne écriture pour ce dessin ? » : un seul dessin, ou plusieurs ; la faute est le s oublié, le s de trop, ou le s de « fish ». */
const PLURAL_CHOICES: readonly Fact[] = PLURAL_WORDS.flatMap((word, index): Fact[] => {
  const count = countFor(index);
  const many = `${NUMBER_WORDS[count]} ${word.plural}`;
  const one = `one ${word.en}`;
  return [
    {
      question: `Quelle est la bonne écriture pour ce dessin ?\n${drawn(word, 1)}`,
      answer: one,
      wrong: isRegular(word) ? [`one ${word.plural}`, `${NUMBER_WORDS[count]} ${word.en}`] : [`one ${word.en}s`, `${NUMBER_WORDS[count]} ${word.en}`],
      hints: pluralHints(word, 1),
    },
    {
      question: `Quelle est la bonne écriture pour ce dessin ?\n${drawn(word, count)}`,
      answer: many,
      wrong: isRegular(word) ? [`${NUMBER_WORDS[count]} ${word.en}`, `one ${word.plural}`] : [`${NUMBER_WORDS[count]} ${word.en}s`, `${NUMBER_WORDS[count]} ${word.en}es`],
      hints: pluralHints(word, count),
    },
  ];
});

export function makeCe1EnPluralChoice(ctx: GameContext): GeneratedGame {
  return choiceLine(ctx, "ce1-en-pl-choix", PLURAL_CONCEPT, PLURAL_CHOICES, BANDS, 2);
}

/** « 🐱🐱🐱 three ___ » : le nom au singulier ou au pluriel, selon le nombre de dessins. */
const PLURAL_GAPS: readonly EnGap[] = PLURAL_WORDS.flatMap((word, index): EnGap[] => {
  const count = countFor(index);
  const wrongOf = (answer: string): [string, string] =>
    answer === word.en ? [`${word.en}s`, `${word.en}'s`] : isRegular(word) ? [word.en, `${word.en}'s`] : [`${word.en}s`, `${word.en}es`];
  return [
    { prompt: "Complète avec le bon mot.", text: `${drawn(word, 1)} one ___`, answer: word.en, wrong: wrongOf(word.en), hints: pluralHints(word, 1) },
    { prompt: "Complète avec le bon mot.", text: `${drawn(word, count)} ${NUMBER_WORDS[count]} ___`, answer: word.plural, wrong: wrongOf(word.plural), hints: pluralHints(word, count) },
  ];
});

export function makeCe1EnPluralGap(ctx: GameContext): GeneratedGame {
  return gapLine(ctx, "ce1-en-pl-trou", PLURAL_CONCEPT, PLURAL_GAPS, BANDS, 3);
}

/** « Écris le mot au pluriel, en anglais. » puis `🐱🐱🐱 three ___` : `cats`. */
const PLURAL_WRITES: readonly EnWrite[] = PLURAL_WORDS.map((word, index) => {
  const count = countFor(index);
  return {
    prompt: `Écris le mot au pluriel, en anglais.\n${drawn(word, count)} ${NUMBER_WORDS[count]} ___`,
    accepted: [word.plural],
    hints: pluralHints(word, count),
  };
});

export function makeCe1EnPluralWrite(ctx: GameContext): GeneratedGame {
  return writeLine(ctx, "ce1-en-pl-ecrire", PLURAL_CONCEPT, PLURAL_WRITES, BANDS, 1);
}

/** `one cat ~ 🐱`, `three cats ~ 🐱🐱🐱` : un groupe de dessins et sa phrase. */
const PLURAL_PAIRS: readonly (readonly [string, string])[] = PLURAL_WORDS.flatMap((word, index) => [
  [`one ${word.en}`, drawn(word, 1)] as const,
  [`${NUMBER_WORDS[countFor(index)]} ${word.plural}`, drawn(word, countFor(index))] as const,
]);

export function makeCe1EnPluralLink(ctx: GameContext): GeneratedGame {
  return pairsOf(
    ctx,
    "ce1-en-pl-relier",
    PLURAL_CONCEPT,
    "Relie chaque groupe de dessins à son écriture.",
    PLURAL_PAIRS,
    ["Compte les dessins de chaque groupe.", "Un seul dessin : pas de s. Plusieurs dessins : un s.", "Commence par la paire dont tu es le plus sûr."],
    BANDS,
  );
}

/** « Glisse chaque groupe dans la bonne case. » : singulier (un seul), ou pluriel (plusieurs). Les cases ne s'appellent pas « Un seul » : le contrôleur du CI y verrait une chose sans image. */
const ONE_TILES = PLURAL_WORDS.map((word) => `one ${word.en}`);
const MANY_TILES = PLURAL_WORDS.map((word, index) => `${NUMBER_WORDS[countFor(index)]} ${word.plural}`);

export function makeCe1EnPluralSort(ctx: GameContext): GeneratedGame {
  return sortTiles(
    ctx,
    "ce1-en-pl-glisser",
    PLURAL_CONCEPT,
    "Glisse chaque groupe de mots dans la bonne case.",
    { zone: "Singulier", tiles: ONE_TILES },
    { zone: "Pluriel", tiles: MANY_TILES },
    ["Regarde le nombre de chaque groupe.", "Le nombre one dit qu'il n'y en a qu'un : c'est le singulier.", "Deux, trois, quatre et cinq disent qu'il y en a plusieurs : c'est le pluriel."],
  );
}

/** « I like cats. » remis dans l'ordre, un mot de chaque part de palier. */
export function makeCe1EnPluralOrder(ctx: GameContext): GeneratedGame {
  return orderLine(
    ctx,
    "ce1-en-pl-phrase",
    PLURAL_CONCEPT,
    PLURAL_WORDS.map((word) => sentence(`I like ${word.plural}.`)),
    BANDS,
  );
}

// ===========================================================================
// MON, TON, SON (an-ce1-possessives)
// ===========================================================================

const POSS_CONCEPT = "my, your, his, her : mon, ton, son";

export type Owner = { subject: "I" | "you" | "he" | "she"; be: "am" | "are" | "is"; possessive: "my" | "your" | "his" | "her"; names: readonly string[] };

/** Les quatre sujets, chacun avec son adjectif et des prénoms qui vont avec lui (une fille pour « she », un garçon pour « he »). */
export const OWNERS: readonly Owner[] = [
  { subject: "I", be: "am", possessive: "my", names: ["Awa", "Modou", "Fatou", "Omar"] },
  { subject: "you", be: "are", possessive: "your", names: ["Aminata", "Cheikh", "Moussa", "Fatou"] },
  { subject: "he", be: "is", possessive: "his", names: ["Modou", "Omar", "Cheikh", "Moussa"] },
  { subject: "she", be: "is", possessive: "her", names: ["Awa", "Fatou", "Aminata", "Awa"] },
];
export const POSSESSIVES = OWNERS.map((owner) => owner.possessive);

export type Thing = { en: string; the: string; color: string };
/** Les objets, avec une couleur du CI pour la phrase (« ___ bag is red »). */
export const THINGS: readonly Thing[] = [
  { en: "bag", the: "le sac", color: "red" },
  { en: "book", the: "le livre", color: "blue" },
  { en: "dog", the: "le chien", color: "brown" },
  { en: "cat", the: "le chat", color: "black" },
  { en: "house", the: "la maison", color: "white" },
  { en: "pen", the: "le stylo", color: "green" },
];

/** Les personnes de la famille, qui s'ajoutent aux objets dans les phrases à remettre dans l'ordre (« This is my mother. »). */
const FAMILY_THINGS = ["mother", "father", "brother", "sister"] as const;

const possessiveWrong = (answer: string): [string, string] => {
  const others = POSSESSIVES.filter((word) => word !== answer);
  return [others[0], others[1]];
};

const possHints = (owner: Owner, clue: string): Hints => ["Lis la phrase en entier, doucement.", clue, `Le mot commence par la lettre ${owner.possessive[0]}.`];

const capital = (word: string) => word[0].toUpperCase() + word.slice(1);

/** « He is Omar. ___ dog is brown. » avec « Le mot va avec « he ». » : un sujet, un prénom, un objet. Chaque objet passe par les quatre sujets. */
const POSS_GAPS: readonly EnGap[] = THINGS.flatMap((thing, thingIndex) =>
  OWNERS.map((owner, ownerIndex): EnGap => {
    const name = owner.names[(thingIndex + ownerIndex) % owner.names.length];
    return {
      prompt: `Complète la phrase. Le mot va avec « ${owner.subject} ».`,
      text: `${capital(owner.subject)} ${owner.be} ${name}. ___ ${thing.en} is ${thing.color}.`,
      answer: owner.possessive,
      wrong: possessiveWrong(owner.possessive),
      hints: possHints(owner, `Cherche le mot qui va avec « ${owner.subject} ».`),
    };
  }),
);

export function makeCe1EnPossGap(ctx: GameContext): GeneratedGame {
  return gapLine(ctx, "ce1-en-poss-trou", POSS_CONCEPT, POSS_GAPS, BANDS, 3);
}

const ofName = (thing: Thing, name: string) => `${thing.the} ${/^[AEIOU]/.test(name) ? "d'" : "de "}${name}`;
const mine = (thing: Thing) => thing.the.replace(/^le /, "mon ").replace(/^la /, "ma ");
const yours = (thing: Thing) => thing.the.replace(/^le /, "ton ").replace(/^la /, "ta ");

/** « Comment dit-on « le sac d'Awa » en anglais ? » : `her bag`, parmi `his bag` et `my bag`. */
const POSS_CHOICES: readonly Fact[] = THINGS.flatMap((thing, thingIndex): Fact[] => {
  const girl = ["Awa", "Fatou", "Aminata"][thingIndex % 3];
  const boy = ["Omar", "Modou", "Cheikh"][thingIndex % 3];
  return [
    { question: `Comment dit-on « ${ofName(thing, girl)} » en anglais ?`, answer: `her ${thing.en}`, wrong: [`his ${thing.en}`, `my ${thing.en}`], hints: possHints(OWNERS[3], "Une fille : le mot est celui de « she ».") },
    { question: `Comment dit-on « ${ofName(thing, boy)} » en anglais ?`, answer: `his ${thing.en}`, wrong: [`her ${thing.en}`, `my ${thing.en}`], hints: possHints(OWNERS[2], "Un garçon : le mot est celui de « he ».") },
    { question: `Comment dit-on « ${mine(thing)} » en anglais ?`, answer: `my ${thing.en}`, wrong: [`your ${thing.en}`, `his ${thing.en}`], hints: possHints(OWNERS[0], "Mon, ma : c'est à moi, le mot est celui de « I ».") },
    { question: `Comment dit-on « ${yours(thing)} » en anglais ?`, answer: `your ${thing.en}`, wrong: [`my ${thing.en}`, `her ${thing.en}`], hints: possHints(OWNERS[1], "Ton, ta : c'est à toi, le mot est celui de « you ».") },
  ];
});

export function makeCe1EnPossChoice(ctx: GameContext): GeneratedGame {
  return choiceLine(ctx, "ce1-en-poss-choix", POSS_CONCEPT, POSS_CHOICES, BANDS, 2);
}

/** « Écris le mot qui manque. Il va avec « he ». » puis `He is Omar. ___ dog is brown.` : `his`. */
const POSS_WRITES: readonly EnWrite[] = POSS_GAPS.map((row) => ({
  prompt: `Écris le mot qui manque. ${/« (.+?) »/.exec(row.prompt ?? "")?.[0] ? `Il va avec ${/« (.+?) »/.exec(row.prompt ?? "")?.[0]}.` : ""}\n${row.text}`,
  accepted: [row.answer],
  hints: row.hints,
}));

export function makeCe1EnPossWrite(ctx: GameContext): GeneratedGame {
  return writeLine(ctx, "ce1-en-poss-ecrire", POSS_CONCEPT, POSS_WRITES, BANDS, 2);
}

/** `I ~ my`, `you ~ your`, `he ~ his`, `she ~ her`. */
const POSS_PAIRS: readonly (readonly [string, string])[] = OWNERS.map((owner) => [owner.subject, owner.possessive] as const);

export function makeCe1EnPossLink(ctx: GameContext): GeneratedGame {
  return pairsOf(
    ctx,
    "ce1-en-poss-relier",
    POSS_CONCEPT,
    "Relie chaque mot à celui qui va avec lui.",
    POSS_PAIRS,
    ["Pense à qui parle, à qui on parle, ou de qui on parle.", "Je va avec mon, tu va avec ton.", "Commence par la paire dont tu es le plus sûr."],
    BANDS,
  );
}

/** « Glisse chaque groupe dans la bonne case. » : un garçon, ou une fille. */
const BOY_TILES = THINGS.map((thing) => `his ${thing.en}`);
const GIRL_TILES = THINGS.map((thing) => `her ${thing.en}`);

export function makeCe1EnPossSort(ctx: GameContext): GeneratedGame {
  return sortTiles(
    ctx,
    "ce1-en-poss-glisser",
    POSS_CONCEPT,
    "Glisse chaque groupe de mots dans la bonne case.",
    { zone: "À un garçon", tiles: BOY_TILES },
    { zone: "À une fille", tiles: GIRL_TILES },
    ["Regarde le premier mot de chaque groupe.", "Le mot his parle d'un garçon.", "Le mot her parle d'une fille."],
  );
}

/** « This is my mother. » remis dans l'ordre. Les noms sont la boucle extérieure : chaque palier a ses noms, avec les quatre adjectifs. */
const POSS_SENTENCES = [...THINGS.map((thing) => thing.en), ...FAMILY_THINGS].flatMap((noun) =>
  OWNERS.map((owner) => sentence(`This is ${owner.possessive} ${noun}.`)),
);

export function makeCe1EnPossOrder(ctx: GameContext): GeneratedGame {
  return orderLine(ctx, "ce1-en-poss-phrase", POSS_CONCEPT, POSS_SENTENCES, BANDS);
}
