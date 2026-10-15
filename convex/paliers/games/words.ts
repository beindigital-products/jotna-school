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
import { originOf, pickFresh, shuffle, type GameContext, type GeneratedGame } from "./shared";

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
  const entry = pickFresh(
    ctx,
    wordsOf(ctx, (e) => e.syllables.length >= 3 && new Set(e.syllables).size === e.syllables.length),
    (e) => e.word,
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
  const entry = pickFresh(
    ctx,
    wordsOf(ctx, (e) => {
      const letters = Array.from(e.word);
      return !!e.emoji && letters.length >= 3 && letters.length <= 5 && new Set(letters).size === letters.length;
    }),
    (e) => e.word,
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
  const entry = pickFresh(ctx, wordsOf(ctx, (e) => e.syllables.length >= 2), (e) => e.word);
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
  const entry = pickFresh(ctx, wordsOf(ctx), (e) => e.word);
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
  const entry = pickFresh(ctx, wordsOf(ctx), (e) => e.word);
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
  const entry = pickFresh(ctx, wordsOf(ctx, (e) => e.syllables.length >= 2), (e) => e.word);
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
  const entry = pickFresh(ctx, wordsOf(ctx, (e) => Array.from(e.word).length >= 3), (e) => e.word);
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
