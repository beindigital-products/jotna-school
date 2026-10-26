/**
 * LES GABARITS D'ÉPELLATION DU CE1 : écrire et épeler des mots anglais (`an-ce1-spell`).
 *
 * C'est la suite de l'alphabet du CI et du CP (`anglaisAlphabet.ts`) : l'enfant connaît les lettres et leurs noms
 * anglais ; il apprend maintenant à REMETTRE les lettres d'un mot dans l'ordre, à écrire un mot qu'il connaît, à
 * compléter une lettre manquante, à choisir la bonne écriture, à relier un mot à son épellation (« C-A-T »).
 *
 * COMME AU CE1 (`ce1Anglais.ts`) : la consigne est en français et ne contient aucun mot anglais ; le mot est toujours
 * montré par son DESSIN (un émoji d'Unicode 11 au plus, sans U+FE0F). La voix des tuiles s'arrête au CP : ici rien ne
 * se dit, tout se lit.
 *
 * LES DOUZE MOTS, tous vus au CI et au CP, SANS LETTRE RÉPÉTÉE (une tuile en double serait ambiguë à remettre dans
 * l'ordre) : cat, dog, red, sun (trois lettres) ; rice, milk, blue, fish (quatre) ; mango, house, lemon, horse (cinq).
 * Les trois paliers prennent chacun un tiers de la liste : les mots courts d'abord.
 *
 * LES FAUTES. Une mauvaise écriture n'est JAMAIS un autre mot anglais : « cat » n'a pas « act » pour faute, « dog » n'a
 * pas « god ». Les fautes sont écrites à la main dans `SPELL_WORDS`, et un test vérifie qu'elles ne sont pas des mots de la liste.
 *
 * MODULE PUR (voir `types.ts`).
 */
import type { GameContext, GeneratedGame } from "./shared";
import { choiceLine, gapLine, orderLine, pairsOf, sortTiles, writeLine, type EnGap, type EnWrite } from "./ce1Anglais";
import type { Fact, Steps } from "./ce1SciencesOutils";
import type { Hints } from "./tableaux";

const CONCEPT = "écrire et épeler des mots anglais";

export type SpellWord = {
  en: string;
  /** Le mot français avec son article, pour l'indice. */
  the: string;
  emoji: string;
  /** Deux écritures fausses, qui ne sont pas des mots anglais. */
  wrong: readonly [string, string];
};

/** Les douze mots, rangés par longueur : le premier tiers au premier palier, le deuxième au deuxième, le dernier ensuite. */
export const SPELL_WORDS: readonly SpellWord[] = [
  { en: "cat", the: "le chat", emoji: "🐱", wrong: ["cta", "kat"] },
  { en: "dog", the: "le chien", emoji: "🐶", wrong: ["dgo", "odg"] },
  { en: "red", the: "la couleur rouge", emoji: "🔴", wrong: ["rde", "erd"] },
  { en: "sun", the: "le soleil", emoji: "🌞", wrong: ["snu", "usn"] },
  { en: "rice", the: "le riz", emoji: "🍚", wrong: ["rcie", "rica"] },
  { en: "milk", the: "le lait", emoji: "🥛", wrong: ["mlik", "melk"] },
  { en: "blue", the: "la couleur bleue", emoji: "🔵", wrong: ["blou", "bule"] },
  { en: "fish", the: "le poisson", emoji: "🐟", wrong: ["fsih", "fich"] },
  { en: "mango", the: "la mangue", emoji: "🥭", wrong: ["magno", "mangu"] },
  { en: "house", the: "la maison", emoji: "🏠", wrong: ["huose", "hause"] },
  { en: "lemon", the: "le citron", emoji: "🍋", wrong: ["lemno", "limon"] },
  { en: "horse", the: "le cheval", emoji: "🐴", wrong: ["hrose", "hosre"] },
];

/** Les trois parts de la liste : un palier, quatre mots. */
const BANDS = 3 as const;

/** Les indices communs : on dit le mot en français, on compte les lettres, on donne la première. */
const hintsFor = (word: SpellWord, middle: string): Hints => [
  `Dis en français ce que tu vois, avec le mot « ${word.the} ».`,
  middle,
  `Le mot commence par la lettre ${word.en[0]}.`,
];
const lettersCount = (word: SpellWord) => `Le mot a ${word.en.length} lettres.`;

/** « Remets les lettres dans l'ordre pour écrire le mot du dessin. » : les lettres du mot, sans lettre répétée. */
const ORDERS: readonly Steps[] = SPELL_WORDS.map((word) => ({
  prompt: `Remets les lettres dans l'ordre pour écrire le mot du dessin.\n${word.emoji}`,
  sequence: word.en.split(""),
  hints: hintsFor(word, lettersCount(word)),
}));

export function makeCe1EnSpellOrder(ctx: GameContext): GeneratedGame {
  return orderLine(ctx, "ce1-en-sp-ordre", CONCEPT, ORDERS, BANDS);
}

/** « Écris en anglais le mot de ce dessin. » : le mot, seul, en minuscules. */
const WRITES: readonly EnWrite[] = SPELL_WORDS.map((word) => ({
  prompt: `Écris en anglais le mot de ce dessin.\n${word.emoji}`,
  accepted: [word.en],
  hints: hintsFor(word, lettersCount(word)),
}));

export function makeCe1EnSpellWrite(ctx: GameContext): GeneratedGame {
  return writeLine(ctx, "ce1-en-sp-ecrire", CONCEPT, WRITES, BANDS, 2);
}

/** Les lettres de remplacement : des voyelles pour une voyelle manquante, des consonnes pour une consonne, jamais la bonne lettre. */
const VOWEL_POOL = ["a", "e", "i", "o", "u"];
const CONSONANT_POOL = ["b", "c", "d", "f", "g", "k", "l", "m", "n", "p", "r", "s", "t", "v", "w", "z"];

/** Deux trous par mot, à deux places différentes (jamais la première lettre : elle est donnée par l'indice). */
const GAPS: readonly EnGap[] = SPELL_WORDS.flatMap((word) =>
  [1, word.en.length - 1].map((at) => {
    const answer = word.en[at];
    const pool = (VOWEL_POOL.includes(answer) ? VOWEL_POOL : CONSONANT_POOL).filter((letter) => letter !== answer);
    // Deux lettres fixes par mot et par place : le tirage ne change pas d'une exécution à l'autre.
    const offset = (word.en.charCodeAt(0) + at) % pool.length;
    const wrong: [string, string] = [pool[offset], pool[(offset + 1) % pool.length]];
    return {
      prompt: "Complète le mot du dessin avec la lettre qui manque.",
      text: `${word.emoji} ${word.en.slice(0, at)}___${word.en.slice(at + 1)}`,
      answer,
      wrong,
      hints: hintsFor(word, "Dis les lettres du mot l'une après l'autre."),
    };
  }),
);

export function makeCe1EnSpellGap(ctx: GameContext): GeneratedGame {
  return gapLine(ctx, "ce1-en-sp-trou", CONCEPT, GAPS, BANDS, 2);
}

/** « Quelle est la bonne écriture du mot de ce dessin ? » : le mot et deux fautes écrites à la main. */
const CHOICES: readonly Fact[] = SPELL_WORDS.map((word) => ({
  question: `Quelle est la bonne écriture du mot de ce dessin ?\n${word.emoji}`,
  answer: word.en,
  wrong: word.wrong,
  hints: hintsFor(word, lettersCount(word)),
}));

export function makeCe1EnSpellChoice(ctx: GameContext): GeneratedGame {
  return choiceLine(ctx, "ce1-en-sp-choix", CONCEPT, CHOICES, BANDS, 1);
}

/** « C-A-T » : l'épellation d'un mot, les lettres en majuscules séparées par des traits d'union. */
export const spelled = (word: string) => word.toUpperCase().split("").join("-");

const PAIRS: readonly (readonly [string, string])[] = SPELL_WORDS.map((word) => [word.en, spelled(word.en)] as const);

export function makeCe1EnSpellLink(ctx: GameContext): GeneratedGame {
  const hints: Hints = [
    "Lis le mot, puis dis ses lettres l'une après l'autre.",
    "Regarde la première lettre de chaque épellation.",
    "Commence par la paire dont tu es le plus sûr.",
  ];
  return pairsOf(ctx, "ce1-en-sp-relier", CONCEPT, "Relie chaque mot à son épellation.", PAIRS, hints, BANDS);
}

/** « Glisse chaque mot dans la bonne case. » : trois lettres, ou cinq lettres. */
const THREE = SPELL_WORDS.filter((word) => word.en.length === 3).map((word) => word.en);
const FIVE = SPELL_WORDS.filter((word) => word.en.length === 5).map((word) => word.en);

export function makeCe1EnSpellSort(ctx: GameContext): GeneratedGame {
  return sortTiles(
    ctx,
    "ce1-en-sp-glisser",
    CONCEPT,
    "Glisse chaque mot dans la bonne case.",
    { zone: "3 lettres", tiles: THREE },
    { zone: "5 lettres", tiles: FIVE },
    ["Compte les lettres de chaque mot.", "Touche les lettres l'une après l'autre en les comptant.", "Un mot court a trois lettres, un mot long en a cinq."],
  );
}

/** « Combien de lettres a le mot de ce dessin ? » : le nombre de lettres du mot, et le nombre juste avant et juste après. */
const COUNTS: readonly Fact[] = SPELL_WORDS.map((word) => ({
  question: `Combien de lettres a le mot anglais de ce dessin ?\n${word.emoji}`,
  answer: String(word.en.length),
  wrong: [String(word.en.length - 1), String(word.en.length + 1)],
  hints: hintsFor(word, "Dis les lettres du mot l'une après l'autre en les comptant."),
}));

export function makeCe1EnSpellCount(ctx: GameContext): GeneratedGame {
  return choiceLine(ctx, "ce1-en-sp-compter", CONCEPT, COUNTS, BANDS, 1);
}
