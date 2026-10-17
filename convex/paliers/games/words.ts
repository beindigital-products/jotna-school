/**
 * LES GABARITS DE MOTS : syllabes et lettres, pour l'enfant qui apprend à lire.
 *
 * Le modèle de langue écrivait « Remets les syllabes dans l'ordre pour former
 * 'mangue' » avec `ma / ng / ue`, « Complète : ___ngue » avec « m », « Mets ces
 * mots dans l'ordre : ear, hand, eye ». Un enfant de CI ne peut ni deviner ni
 * vérifier, et le contrôleur ne voit pas qu'un mot est mal coupé. Ces gabarits
 * ne se trompent pas : chaque mot du vocabulaire porte sa découpe en syllabes,
 * écrite et relue une fois pour toutes ; l'exercice en est tiré, avec des
 * distracteurs qui ne forment aucun mot.
 *
 * Les gabarits rendent des exercices CLASSIQUES (QCM, ordre, association,
 * phrase à trous) : l'écran, la correction et l'audit sont ceux de toujours.
 *
 * LE VOCABULAIRE SUIT LE PROGRAMME DU CI (`programme/francais.ts`, thématiques
 * « Les sons… ») : « mots-1 » ne contient que les mots du premier palier de
 * lecture, « mots-4 » tous les mots. Un gabarit sans vocabulaire prend tout.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { KNOWN_WORDS } from "../knownWords";
import { originOf, pick, shuffle, type GameContext, type GeneratedGame } from "./shared";

type Stage = 1 | 2 | 3 | 4;

export type LexiconWord = {
  word: string;
  /** La découpe en syllabes, relue à la main : jamais déduite. */
  syllables: string[];
  /** Un émoji ancien (Unicode 11 au plus) qui montre le mot, quand il existe. */
  emoji?: string;
  /** Le premier palier de lecture où le mot est vu. */
  stage: Stage;
};

/** Les mots des thématiques « Les sons… » du CI, dans l'ordre où l'enfant les rencontre. */
export const LEXICON: readonly LexiconWord[] = [
  // Palier 2 : a, i, o, l, t
  { word: "lit", syllables: ["lit"], emoji: "🛏️", stage: 1 },
  { word: "ami", syllables: ["a", "mi"], stage: 1 },
  { word: "tata", syllables: ["ta", "ta"], stage: 1 },
  { word: "toto", syllables: ["to", "to"], stage: 1 },
  { word: "lola", syllables: ["lo", "la"], stage: 1 },
  { word: "olive", syllables: ["o", "li", "ve"], stage: 1 },
  { word: "tomate", syllables: ["to", "ma", "te"], emoji: "🍅", stage: 1 },
  // Palier 3 : n, e, p, d, m, b
  { word: "papa", syllables: ["pa", "pa"], stage: 2 },
  { word: "dodo", syllables: ["do", "do"], stage: 2 },
  { word: "moto", syllables: ["mo", "to"], emoji: "🏍️", stage: 2 },
  { word: "malade", syllables: ["ma", "la", "de"], stage: 2 },
  { word: "midi", syllables: ["mi", "di"], stage: 2 },
  { word: "modou", syllables: ["mo", "dou"], stage: 2 },
  { word: "penda", syllables: ["pen", "da"], stage: 2 },
  // Palier 4, première partie : f, u, ou, é, è
  { word: "poule", syllables: ["pou", "le"], emoji: "🐔", stage: 3 },
  { word: "loupe", syllables: ["lou", "pe"], emoji: "🔍", stage: 3 },
  { word: "fumée", syllables: ["fu", "mée"], stage: 3 },
  { word: "été", syllables: ["é", "té"], stage: 3 },
  { word: "élève", syllables: ["é", "lè", "ve"], stage: 3 },
  { word: "père", syllables: ["pè", "re"], stage: 3 },
  { word: "mère", syllables: ["mè", "re"], stage: 3 },
  { word: "café", syllables: ["ca", "fé"], emoji: "☕", stage: 3 },
  { word: "bébé", syllables: ["bé", "bé"], emoji: "👶", stage: 3 },
  { word: "foulard", syllables: ["fou", "lard"], stage: 3 },
  // Palier 4, seconde partie : s, r, au, eau, on, om
  { word: "sac", syllables: ["sac"], emoji: "🎒", stage: 4 },
  { word: "rat", syllables: ["rat"], emoji: "🐀", stage: 4 },
  { word: "robe", syllables: ["ro", "be"], emoji: "👗", stage: 4 },
  { word: "sel", syllables: ["sel"], emoji: "🧂", stage: 4 },
  { word: "radio", syllables: ["ra", "di", "o"], emoji: "📻", stage: 4 },
  { word: "auto", syllables: ["au", "to"], emoji: "🚗", stage: 4 },
  { word: "bateau", syllables: ["ba", "teau"], emoji: "⛵", stage: 4 },
  { word: "eau", syllables: ["eau"], emoji: "💧", stage: 4 },
  { word: "mouton", syllables: ["mou", "ton"], emoji: "🐑", stage: 4 },
  { word: "savon", syllables: ["sa", "von"], emoji: "🧼", stage: 4 },
  { word: "salon", syllables: ["sa", "lon"], stage: 4 },
  { word: "bonbon", syllables: ["bon", "bon"], stage: 4 },
  { word: "ballon", syllables: ["bal", "lon"], emoji: "⚽", stage: 4 },
];

/** « mots-2 » : les mots vus jusqu'au deuxième palier de lecture. Sans vocabulaire : tous. */
export function stageOf(vocabulary: string | undefined): Stage {
  const match = /^mots-([1-4])$/.exec(vocabulary ?? "");
  return match ? (Number(match[1]) as Stage) : 4;
}

function wordsOf(ctx: GameContext, keep: (entry: LexiconWord) => boolean = () => true): LexiconWord[] {
  const stage = stageOf(ctx.vocabulary);
  const seen = LEXICON.filter((entry) => entry.stage <= stage && keep(entry));
  // Un vocabulaire trop court pour le gabarit : on élargit plutôt que d'échouer.
  return seen.length > 0 ? seen : LEXICON.filter(keep);
}

/**
 * Les pièces (syllabes, lettres) qu'on peut proposer comme mauvais choix : celles
 * des mots que l'enfant a déjà vus. Au premier palier, « fou » ou « bé » seraient
 * des syllabes inconnues, donc des choix qu'il écarte sans lire. Trop peu de
 * pièces : on prend tout le vocabulaire plutôt que d'échouer.
 */
function piecesSeen(ctx: GameContext, piecesOf: (entry: LexiconWord) => string[], atLeast = 6): string[] {
  const seen = Array.from(new Set(wordsOf(ctx).flatMap(piecesOf)));
  return seen.length >= atLeast ? seen : Array.from(new Set(LEXICON.flatMap(piecesOf)));
}

/**
 * Un mot pour ce gabarit. Dix gabarits par palier piochent dans 7 à 37 mots :
 * on prend d'abord un mot qu'AUCUN gabarit n'a pris dans ce palier ; sinon un mot que CE
 * gabarit n'a pas pris (« tomate » en première lettre puis en syllabes, deux exercices
 * différents) ; sinon, tout a servi et on recommence.
 */
function pickWord(ctx: GameContext, kind: string, pool: readonly LexiconWord[]): LexiconWord {
  const untouched = pool.filter((e) => !ctx.used.has(e.word));
  const unseenHere = pool.filter((e) => !ctx.used.has(`${kind}:${e.word}`));
  const chosen = pick(ctx.rng, untouched.length > 0 ? untouched : unseenHere.length > 0 ? unseenHere : pool);
  ctx.used.add(chosen.word);
  ctx.used.add(`${kind}:${chosen.word}`);
  return chosen;
}

const stripAccents = (text: string) => text.normalize("NFD").replace(/\p{M}/gu, "");
const picture = (entry: LexiconWord) => (entry.emoji ? ` ${entry.emoji}` : "");

function exercise(
  kind: string,
  ctx: GameContext,
  type: "qcm" | "order" | "match" | "fill-blank",
  concept: string,
  prompt: string,
  payload: Record<string, unknown>,
  answerKey: string,
  hints: [string, string, string],
): GeneratedGame {
  return {
    type,
    prompt,
    payload: { ...payload, game: originOf(kind, ctx), concept },
    answerKey,
    hints,
  };
}

/** Trois choix dont un seul juste, dans un ordre tiré au sort. */
function choices(ctx: GameContext, answer: string, wrong: string[]): { options: string[]; correctIndex: number } {
  const options = shuffle(ctx.rng, [answer, ...wrong.slice(0, 2)]);
  return { options, correctIndex: options.indexOf(answer) };
}

// ---------------------------------------------------------------------------
// Les syllabes et les lettres d'un mot
// ---------------------------------------------------------------------------

/** « Remets les syllabes dans l'ordre pour former un mot » : trois syllabes différentes. */
export function makeSyllableOrder(ctx: GameContext): GeneratedGame {
  const entry = pickWord(
    ctx,
    "syllabes-ordre",
    wordsOf(ctx, (e) => e.syllables.length >= 3 && new Set(e.syllables).size === e.syllables.length),
  );
  return exercise(
    "syllabes-ordre",
    ctx,
    "order",
    "ordre des syllabes d'un mot",
    `Remets les syllabes dans l'ordre pour former un mot.${picture(entry)}`,
    { correctSequence: entry.syllables },
    entry.syllables.join(", "),
    [
      "Dis les syllabes à voix haute, l'une après l'autre.",
      "Cherche la syllabe qui commence le mot, puis celle d'après.",
      `Le mot commence par la lettre « ${entry.syllables[0].slice(0, 1)} ».`,
    ],
  );
}

/** « Remets les lettres dans l'ordre pour écrire le mot » : un mot dessiné, des lettres toutes différentes. */
export function makeLetterOrder(ctx: GameContext): GeneratedGame {
  const entry = pickWord(
    ctx,
    "lettres-ordre",
    wordsOf(ctx, (e) => {
      const letters = Array.from(e.word);
      return !!e.emoji && letters.length >= 3 && letters.length <= 5 && new Set(letters).size === letters.length;
    }),
  );
  const letters = Array.from(entry.word);
  return exercise(
    "lettres-ordre",
    ctx,
    "order",
    "ordre des lettres d'un mot",
    `Remets les lettres dans l'ordre pour écrire le mot.${picture(entry)}`,
    { correctSequence: letters },
    letters.join(", "),
    [
      "Regarde bien le dessin et dis le mot.",
      "Quelle lettre entends-tu en premier ?",
      `Le mot finit par la lettre « ${letters[letters.length - 1]} ».`,
    ],
  );
}

/** « Par quelle syllabe commence ce mot ? » */
export function makeFirstSyllable(ctx: GameContext): GeneratedGame {
  const entry = pickWord(ctx, "syllabe-initiale", wordsOf(ctx, (e) => e.syllables.length >= 2));
  const answer = entry.syllables[0];
  const pool = piecesSeen(ctx, (e) => e.syllables.slice(0, 1));
  // Un distracteur qui commence le mot serait une deuxième bonne réponse (« ba » pour « ballon »).
  const wrong = shuffle(
    ctx.rng,
    pool.filter((s) => s !== answer && !entry.word.startsWith(s) && stripAccents(s) !== stripAccents(answer)),
  );
  const { options, correctIndex } = choices(ctx, answer, wrong);
  return exercise(
    "syllabe-initiale",
    ctx,
    "qcm",
    "première syllabe d'un mot",
    `Par quelle syllabe commence « ${entry.word} » ?${picture(entry)}`,
    { options, correctIndex },
    answer,
    [
      "Dis le mot lentement, en frappant dans tes mains.",
      "La première syllabe est le premier bruit que tu entends.",
      `Le mot « ${entry.word} » finit par « ${entry.syllables[entry.syllables.length - 1]} ».`,
    ],
  );
}

/** « Par quelle lettre commence ce mot ? » */
export function makeFirstLetter(ctx: GameContext): GeneratedGame {
  const entry = pickWord(ctx, "lettre-initiale", wordsOf(ctx));
  const answer = Array.from(entry.word)[0];
  const letters = piecesSeen(ctx, (e) => Array.from(e.word).slice(0, 1), 4);
  const wrong = shuffle(
    ctx.rng,
    letters.filter((l) => stripAccents(l) !== stripAccents(answer)),
  );
  const { options, correctIndex } = choices(ctx, answer, wrong);
  return exercise(
    "lettre-initiale",
    ctx,
    "qcm",
    "première lettre d'un mot",
    `Par quelle lettre commence « ${entry.word} » ?${picture(entry)}`,
    { options, correctIndex },
    answer,
    [
      "Dis le mot et écoute le premier son.",
      "Le premier son est celui que tu dis avant tous les autres.",
      `Le mot « ${entry.word} » finit par « ${Array.from(entry.word).slice(-1)[0]} ».`,
    ],
  );
}

/** « Combien de syllabes dans ce mot ? » */
export function makeSyllableCount(ctx: GameContext): GeneratedGame {
  const entry = pickWord(ctx, "syllabes-compter", wordsOf(ctx));
  const answer = entry.syllables.length;
  const wrong = shuffle(
    ctx.rng,
    [1, 2, 3, 4].filter((n) => n !== answer),
  ).map(String);
  const { options, correctIndex } = choices(ctx, String(answer), wrong);
  return exercise(
    "syllabes-compter",
    ctx,
    "qcm",
    "nombre de syllabes d'un mot",
    `Combien de syllabes entends-tu dans « ${entry.word} » ?${picture(entry)}`,
    { options, correctIndex },
    String(answer),
    [
      "Dis le mot en frappant dans tes mains à chaque morceau.",
      "Chaque coup dans les mains est une syllabe.",
      "Compte les coups, puis choisis le nombre.",
    ],
  );
}

/**
 * « Par quelle syllabe finit ce mot ? » Le pendant de `makeFirstSyllable`. Un mot dont la
 * première et la dernière syllabes sont les mêmes (« papa ») est écarté : l'indice
 * « le mot commence par pa » donnerait la réponse.
 */
export function makeLastSyllable(ctx: GameContext): GeneratedGame {
  const entry = pickWord(
    ctx,
    "syllabe-finale",
    wordsOf(ctx, (e) => e.syllables.length >= 2 && e.syllables[0] !== e.syllables[e.syllables.length - 1]),
  );
  const answer = entry.syllables[entry.syllables.length - 1];
  const pool = piecesSeen(ctx, (e) => e.syllables.slice(-1));
  // Un distracteur qui finit le mot serait une deuxième bonne réponse (« é » pour « fumée »).
  const wrong = shuffle(
    ctx.rng,
    pool.filter((s) => s !== answer && !entry.word.endsWith(s) && stripAccents(s) !== stripAccents(answer)),
  );
  const { options, correctIndex } = choices(ctx, answer, wrong);
  return exercise(
    "syllabe-finale",
    ctx,
    "qcm",
    "dernière syllabe d'un mot",
    `Par quelle syllabe finit « ${entry.word} » ?${picture(entry)}`,
    { options, correctIndex },
    answer,
    [
      "Dis le mot lentement, en frappant dans tes mains.",
      "La dernière syllabe est le dernier bruit que tu entends.",
      `Le mot « ${entry.word} » commence par « ${entry.syllables[0]} ».`,
    ],
  );
}

/** « Combien de lettres compte ce mot ? » : trois nombres voisins, jamais nuls. */
export function makeLetterCount(ctx: GameContext): GeneratedGame {
  const entry = pickWord(ctx, "lettres-compter", wordsOf(ctx));
  const answer = Array.from(entry.word).length;
  const near = shuffle(
    ctx.rng,
    [answer - 2, answer - 1, answer + 1, answer + 2].filter((n) => n >= 1 && n !== answer),
  ).slice(0, 2);
  const { options, correctIndex } = choices(ctx, String(answer), near.map(String));
  return exercise(
    "lettres-compter",
    ctx,
    "qcm",
    "nombre de lettres d'un mot",
    `Combien de lettres compte « ${entry.word} » ?${picture(entry)}`,
    { options, correctIndex },
    String(answer),
    [
      "Épelle le mot, lettre après lettre.",
      "Touche une lettre du doigt chaque fois que tu dis son nom.",
      "Compte les lettres, puis choisis le nombre.",
    ],
  );
}

/**
 * Comment un mot s'entend au début, pour comparer sans se fier à l'écriture :
 * sans accents ni majuscules, et « au », « eau » disent le même son que « o »
 * (« auto » commence comme « olive »). Elle ne sert qu'à ÉCARTER des mauvais
 * choix : en écarter un de trop ne coûte rien, en garder un de trop casse l'exercice.
 */
const startSound = (text: string) => stripAccents(text.toLowerCase()).replace(/^(?:eau|au)/, "o");

/**
 * « Quel mot commence par la syllabe « pa » ? » : le sens inverse de
 * `makeFirstSyllable`. Un seul des trois mots commence par la syllabe : les deux
 * autres ne la portent ni à l'écrit (« bal » commence par « ba », « loupe » par
 * « lo ») ni à l'oreille (« auto » commence comme « olive »). Les mauvais choix
 * viennent des mots du palier de lecture ; s'il en restait moins de deux, on
 * piocherait dans tout le vocabulaire (le test des 37 mots montre que ça n'arrive pas).
 *
 * Pas d'émoji dans l'énoncé : le dessin du mot donnerait la réponse. Les indices
 * n'écrivent aucun des trois mots.
 */
export function makeWordFromSyllable(ctx: GameContext): GeneratedGame {
  const entry = pickWord(ctx, "mot-syllabe", wordsOf(ctx, (e) => e.syllables.length >= 2));
  const syllable = entry.syllables[0];
  const wouldFit = (word: string) =>
    stripAccents(word.toLowerCase()).startsWith(stripAccents(syllable.toLowerCase())) ||
    startSound(word).startsWith(startSound(syllable));
  const fits = (e: LexiconWord) => e.word !== entry.word && !wouldFit(e.word);
  const seen = wordsOf(ctx).filter(fits);
  const wrong = shuffle(ctx.rng, seen.length >= 2 ? seen : LEXICON.filter(fits)).map((e) => e.word);
  const { options, correctIndex } = choices(ctx, entry.word, wrong);
  const count = entry.syllables.length;
  return exercise(
    "mot-syllabe",
    ctx,
    "qcm",
    "mot qui commence par une syllabe",
    `Quel mot commence par la syllabe « ${syllable} » ?`,
    { options, correctIndex },
    entry.word,
    [
      `Dis la syllabe « ${syllable} » à voix haute.`,
      "Dis chaque mot lentement et écoute son premier bruit.",
      `Le mot que tu cherches compte ${count} syllabes.`,
    ],
  );
}

// ---------------------------------------------------------------------------
// Compléter un mot
// ---------------------------------------------------------------------------

/**
 * Les deux mauvais choix d'un trou : ils ne doivent former AUCUN mot, sinon
 * l'exercice a deux bonnes réponses (`to___te` avec « ma » et avec « ta » si
 * « tate » existait). `KNOWN_WORDS` est la liste fermée du CI et du CP.
 */
function wrongPieces(
  ctx: GameContext,
  pool: readonly string[],
  make: (piece: string) => string,
  answer: string,
): string[] {
  const candidates = shuffle(
    ctx.rng,
    Array.from(new Set(pool)).filter((piece) => piece !== answer && !KNOWN_WORDS.has(stripAccents(make(piece)))),
  );
  return candidates.slice(0, 2);
}

/** « Quelle syllabe manque pour écrire le mot ? » : `to___te`. */
export function makeMissingSyllable(ctx: GameContext): GeneratedGame {
  const entry = pickWord(ctx, "syllabe-manquante", wordsOf(ctx, (e) => e.syllables.length >= 2));
  const index = Math.floor(ctx.rng() * entry.syllables.length);
  const answer = entry.syllables[index];
  const before = entry.syllables.slice(0, index).join("");
  const after = entry.syllables.slice(index + 1).join("");
  const pool = piecesSeen(ctx, (e) => e.syllables).filter((s) => s.length <= 3);
  const wrong = wrongPieces(ctx, pool, (piece) => `${before}${piece}${after}`, answer);
  const options = shuffle(ctx.rng, [answer, ...wrong]);
  return exercise(
    "syllabe-manquante",
    ctx,
    "fill-blank",
    "syllabe qui manque dans un mot",
    `Quelle syllabe manque pour écrire le mot ?${picture(entry)}`,
    { text: `${before}___${after}`, blanks: [{ options, answer }] },
    entry.word,
    [
      "Dis le mot en entier, puis écoute la syllabe qui manque.",
      "Essaie chaque syllabe et dis le mot : un seul est un vrai mot.",
      `Le mot compte ${entry.syllables.length} syllabes.`,
    ],
  );
}

/** « Quelle lettre manque pour écrire le mot ? » : `m___to`. */
export function makeMissingLetter(ctx: GameContext): GeneratedGame {
  const entry = pickWord(ctx, "lettre-manquante", wordsOf(ctx, (e) => Array.from(e.word).length >= 3));
  const letters = Array.from(entry.word);
  const index = 1 + Math.floor(ctx.rng() * (letters.length - 1));
  const answer = letters[index];
  const before = letters.slice(0, index).join("");
  const after = letters.slice(index + 1).join("");
  const pool = piecesSeen(ctx, (e) => Array.from(e.word), 4);
  const wrong = wrongPieces(ctx, pool, (piece) => `${before}${piece}${after}`, answer);
  const options = shuffle(ctx.rng, [answer, ...wrong]);
  return exercise(
    "lettre-manquante",
    ctx,
    "fill-blank",
    "lettre qui manque dans un mot",
    `Quelle lettre manque pour écrire le mot ?${picture(entry)}`,
    { text: `${before}___${after}`, blanks: [{ options, answer }] },
    entry.word,
    [
      "Dis le mot en entier, doucement.",
      "Essaie chaque lettre et dis le mot : un seul est un vrai mot.",
      `Le mot a ${letters.length} lettres.`,
    ],
  );
}

// ---------------------------------------------------------------------------
// Compléter une phrase
// ---------------------------------------------------------------------------

type Sentence = {
  /** Le mot du vocabulaire qui complète la phrase. */
  word: string;
  /** La phrase, avec un seul trou `___`. */
  text: string;
  /** Les mots du vocabulaire qui iraient AUSSI dans la phrase : jamais proposés comme mauvais choix. */
  also?: string[];
};

/**
 * LES PHRASES À TROU. Chacune est écrite et relue à la main pour qu'UN SEUL mot
 * du vocabulaire la complète : « La ___ pond un œuf. » n'a que « poule ». Le
 * modèle écrivait « Mon ___ est dans le jardin. » avec « père » : « mère », « ami »
 * ou « bébé » allaient aussi, et l'enfant juste se faisait dire qu'il avait faux.
 *
 * Pour AJOUTER une phrase : le mot doit être dans `LEXICON`, une propriété
 * propre à lui seul doit suffire à le trouver (ce qu'il fait, ce qu'on en fait),
 * et tout autre mot du vocabulaire qui irait aussi va dans `also`. Aucune phrase
 * ne dit le mot, ni ne le suggère par une lettre.
 */
export const SENTENCES: readonly Sentence[] = [
  { word: "lit", text: "Je dors dans mon ___.", also: ["dodo"] },
  { word: "moto", text: "Papa roule vite sur sa ___.", also: ["auto"] },
  { word: "malade", text: "Penda tousse, elle est ___." },
  { word: "midi", text: "À ___, le soleil est tout en haut du ciel." },
  { word: "papa", text: "Mon ___ est le mari de maman.", also: ["père"] },
  { word: "poule", text: "La ___ pond un œuf." },
  { word: "loupe", text: "Avec la ___, je vois les très petites choses." },
  { word: "fumée", text: "Le feu fait de la ___ grise." },
  { word: "été", text: "En ___, il fait très chaud." },
  {
    word: "élève",
    text: "À l'école, un ___ écoute la maîtresse.",
    also: ["ami", "bébé", "papa", "père", "mère", "modou", "penda", "toto", "lola", "tata"],
  },
  { word: "café", text: "Papa boit un ___ bien chaud." },
  { word: "bébé", text: "Le ___ n'a pas encore de dents et il pleure." },
  { word: "foulard", text: "Maman met un ___ sur sa tête.", also: ["sac"] },
  { word: "sac", text: "Je mets mes cahiers dans mon ___.", also: ["lit", "salon", "auto", "bateau", "radio"] },
  { word: "robe", text: "Maman met une belle ___ pour la fête." },
  { word: "sel", text: "Je mets du ___ dans la soupe.", also: ["savon", "café"] },
  { word: "radio", text: "J'écoute de la musique à la ___." },
  { word: "auto", text: "Papa roule dans son ___ rouge.", also: ["moto"] },
  { word: "bateau", text: "Le pêcheur part en mer sur son ___." },
  { word: "mouton", text: "Le ___ a de la laine sur le dos." },
  { word: "savon", text: "Je lave mes mains avec du ___." },
  { word: "ballon", text: "Les enfants jouent au ___ dans la cour." },
  { word: "salon", text: "On regarde la télé dans le ___.", also: ["lit"] },
];

/** « Complète la phrase. » : `Je dors dans mon ___.` avec « lit », « tomate », « olive ». */
export function makeSentenceGap(ctx: GameContext): GeneratedGame {
  const entry = pickWord(
    ctx,
    "phrase-trou",
    wordsOf(ctx, (e) => SENTENCES.some((s) => s.word === e.word)),
  );
  const sentence = SENTENCES.find((s) => s.word === entry.word) as Sentence;
  // Un mot déjà écrit dans la phrase (« Papa boit un ___ ») ne se propose pas, ni un mot qui irait aussi.
  const written = stripAccents(sentence.text.toLowerCase());
  const wrong = shuffle(
    ctx.rng,
    wordsOf(ctx)
      .map((e) => e.word)
      .filter(
        (word) =>
          word !== sentence.word &&
          !(sentence.also ?? []).includes(word) &&
          !new RegExp(`(?<![a-z])${stripAccents(word)}(?![a-z])`).test(written),
      ),
  ).slice(0, 2);
  const options = shuffle(ctx.rng, [sentence.word, ...wrong]);
  return exercise(
    "phrase-trou",
    ctx,
    "fill-blank",
    "mot qui complète une phrase",
    "Complète la phrase.",
    { text: sentence.text, blanks: [{ options, answer: sentence.word }] },
    sentence.word,
    [
      "Lis la phrase en entier, doucement.",
      "Essaie chaque mot dans la phrase : un seul a du sens.",
      "Dis la phrase à voix haute avec le mot que tu as choisi.",
    ],
  );
}

// ---------------------------------------------------------------------------
// Relier
// ---------------------------------------------------------------------------

/** Relier chaque syllabe au mot qui commence par elle : des syllabes toutes différentes. */
export function makeSyllableToWord(ctx: GameContext): GeneratedGame {
  const candidates = shuffle(
    ctx.rng,
    wordsOf(ctx, (e) => e.syllables.length >= 2),
  );
  const chosen: LexiconWord[] = [];
  for (const entry of candidates) {
    const first = entry.syllables[0];
    // Deux mots qui commencent pareil, ou dont une syllabe commence l'autre
    // (« ba » et « bal »), rendraient la paire ambiguë.
    const clashes = chosen.some((c) => c.word.startsWith(first) || entry.word.startsWith(c.syllables[0]));
    if (!clashes) chosen.push(entry);
    if (chosen.length === 4) break;
  }
  if (chosen.length < 3) return makeFirstSyllable(ctx);
  const pairs = chosen.map((e) => ({ left: e.syllables[0], right: e.word }));
  return exercise(
    "syllabe-mot",
    ctx,
    "match",
    "syllabe et mot qui commence par elle",
    "Relie chaque syllabe au mot qui commence par elle.",
    { pairs },
    pairs.map((p) => `${p.left} ~ ${p.right}`).join(" ; "),
    [
      "Lis la syllabe, puis cherche le mot qui commence par ce son.",
      "Dis chaque mot lentement et écoute son premier son.",
      "Commence par la syllabe qui te semble la plus facile.",
    ],
  );
}

/**
 * Relier chaque lettre minuscule à sa majuscule : quatre lettres du vocabulaire du
 * palier, sans accent. « i » et « l » ne vont jamais ensemble : la majuscule « I »
 * ressemble au « l » minuscule dans bien des polices, l'association serait
 * ambiguë à l'écran.
 */
export function makeCapitalMatch(ctx: GameContext): GeneratedGame {
  const letters = piecesSeen(ctx, (e) => Array.from(e.word), 6).filter((l) => /^[a-z]$/.test(l));
  const chosen: string[] = [];
  for (const letter of shuffle(ctx.rng, letters)) {
    const clashes = (letter === "i" && chosen.includes("l")) || (letter === "l" && chosen.includes("i"));
    if (!clashes) chosen.push(letter);
    if (chosen.length === 4) break;
  }
  const pairs = chosen.map((letter) => ({ left: letter, right: letter.toUpperCase() }));
  return exercise(
    "majuscule-minuscule",
    ctx,
    "match",
    "lettre minuscule et sa majuscule",
    "Relie chaque lettre minuscule à sa majuscule.",
    { pairs },
    pairs.map((p) => `${p.left} ~ ${p.right}`).join(" ; "),
    [
      "Regarde la forme de chaque lettre.",
      "La majuscule est la grande lettre, la minuscule est la petite.",
      "Commence par la lettre que tu reconnais le mieux.",
    ],
  );
}

/** Relier chaque mot à son image : des émojis tous différents. */
export function makeWordToPicture(ctx: GameContext): GeneratedGame {
  const candidates = shuffle(
    ctx.rng,
    wordsOf(ctx, (e) => !!e.emoji),
  );
  const chosen: LexiconWord[] = [];
  for (const entry of candidates) {
    if (!chosen.some((c) => c.emoji === entry.emoji)) chosen.push(entry);
    if (chosen.length === 4) break;
  }
  if (chosen.length < 3) return makeFirstLetter(ctx);
  const pairs = chosen.map((e) => ({ left: e.word, right: e.emoji as string }));
  return exercise(
    "mot-image",
    ctx,
    "match",
    "mot et image",
    "Relie chaque mot à son image.",
    { pairs },
    pairs.map((p) => `${p.left} ~ ${p.right}`).join(" ; "),
    [
      "Lis le mot en entier, lettre après lettre.",
      "Regarde les images et dis leur nom.",
      "Commence par le mot le plus court.",
    ],
  );
}
