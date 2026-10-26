/**
 * LES GABARITS D'ALPHABET ANGLAIS : le CI (`an-ci-abc-1`, `an-ci-abc-2`, `an-ci-abc-3`) et le CP (`an-cp-abc`,
 * `an-cp-sounds`, `an-cp-name`).
 *
 * Pourquoi cette leçon n'existait nulle part : le programme d'anglais commençait par « hello » et « thank you »,
 * puis demandait de lire des mots, alors que l'enfant n'avait jamais entendu le nom d'une lettre en anglais. Le
 * propriétaire l'a relevé le 26 octobre 2026 (« on ne parle pas de l'alphabet, du B-A-BA »). Le programme est
 * refait dans `docs/programme-anglais-v2.md` : l'alphabet vient en premier, au CI à l'oral, au CP avec la lecture.
 *
 * COMMENT ON ENSEIGNE UNE LETTRE SANS VOIX D'ÉNONCÉ ANGLAISE
 * - La consigne est en français et ne dit aucune lettre : la voix française lirait « B » à la française (« bé »),
 *   et E, G, I, J, K, R, U, W, Y, Z ne se disent pas pareil dans les deux langues. La lettre est toujours une
 *   TUILE, jamais un mot de l'énoncé.
 * - Une tuile se dit avec la voix anglaise (`convex/voice/tiles.ts`, `englishLetters`) : « B » se dit « bee »,
 *   « F-A-T-O-U » se dit « eff, ay, tee, oh, you », « A, B, ___, D » se dit « ay, bee, … , dee ». Seules les
 *   MAJUSCULES sont des noms de lettre : « a » reste l'article de « a dog ».
 * - Chaque lettre a UN mot-image (A apple, B banana…), dont l'initiale est cette lettre et seulement elle. Les 25
 *   mots ont donc 25 initiales différentes : aucun mauvais choix ne peut commencer par la bonne lettre. Le X n'a
 *   pas de mot qui commence par lui (box le finit) : il s'apprend dans la suite des lettres, jamais comme initiale.
 * - Les émojis sont anciens (Unicode 11 au plus), sans U+FE0F. Le stylo, le jus et le cerf-volant n'ont pas
 *   d'émoji sûr : P est pig, J est jeans, K est key. Q est queen, montré par la princesse 👸 : il n'existe pas
 *   d'émoji « reine » d'Unicode 11 ; à revoir si l'on fabrique l'image.
 *
 * LA PORTÉE D'UN GABARIT. Les trois thématiques du CI se partagent les mêmes jeux, sur des lettres différentes :
 * `vocabulary` de la fiche dit la plage (« a-i », « j-r », « s-z », « a-z »). Une plage vide ou inconnue vaut A à Z.
 *
 * RÈGLES POUR AJOUTER UN JEU
 * - Aucune lettre ni aucun mot anglais dans l'énoncé. Les énoncés n'ont aucun « : », au plus une apostrophe droite,
 *   vingt mots au plus.
 * - Aucun indice n'écrit la bonne réponse. Un indice peut donner sa première lettre.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { fresh, originOf, pickFresh, randomInt, shuffle, type GameContext, type GeneratedGame } from "./shared";
import { drawingToWord, freshWord, linkKey, pairsCount, pictureLinks, tileOf, type Word } from "./anglais";

// ===========================================================================
// LES LETTRES ET LEURS MOTS
// ===========================================================================

export const ALPHABET: readonly string[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export type KeyWord = Word & { letter: string };

/** Un mot par lettre, sauf le X : l'initiale du mot est la lettre, et personne d'autre ne la porte. */
export const KEY_WORDS: readonly KeyWord[] = [
  { letter: "A", en: "apple", fr: "pomme", the: "la pomme", emoji: "🍎" },
  { letter: "B", en: "banana", fr: "banane", the: "la banane", emoji: "🍌" },
  { letter: "C", en: "cat", fr: "chat", the: "le chat", emoji: "🐱" },
  { letter: "D", en: "dog", fr: "chien", the: "le chien", emoji: "🐶" },
  { letter: "E", en: "egg", fr: "œuf", the: "l'œuf", emoji: "🥚" },
  { letter: "F", en: "fish", fr: "poisson", the: "le poisson", emoji: "🐟" },
  { letter: "G", en: "goat", fr: "chèvre", the: "la chèvre", emoji: "🐐" },
  { letter: "H", en: "house", fr: "maison", the: "la maison", emoji: "🏠" },
  { letter: "I", en: "ice cream", fr: "glace", the: "la glace", emoji: "🍦" },
  { letter: "J", en: "jeans", fr: "jean", the: "le jean", emoji: "👖" },
  { letter: "K", en: "key", fr: "clé", the: "la clé", emoji: "🔑" },
  { letter: "L", en: "lion", fr: "lion", the: "le lion", emoji: "🦁" },
  { letter: "M", en: "mango", fr: "mangue", the: "la mangue", emoji: "🥭" },
  { letter: "N", en: "nose", fr: "nez", the: "le nez", emoji: "👃" },
  { letter: "O", en: "orange", fr: "orange", the: "l'orange", emoji: "🍊" },
  { letter: "P", en: "pig", fr: "cochon", the: "le cochon", emoji: "🐷" },
  { letter: "Q", en: "queen", fr: "reine", the: "la reine", emoji: "👸" },
  { letter: "R", en: "rice", fr: "riz", the: "le riz", emoji: "🍚" },
  { letter: "S", en: "sun", fr: "soleil", the: "le soleil", emoji: "🌞" },
  { letter: "T", en: "tree", fr: "arbre", the: "l'arbre", emoji: "🌳" },
  { letter: "U", en: "umbrella", fr: "parapluie", the: "le parapluie", emoji: "🌂" },
  { letter: "V", en: "van", fr: "camionnette", the: "la camionnette", emoji: "🚐" },
  { letter: "W", en: "water", fr: "eau", the: "l'eau", emoji: "💧" },
  { letter: "Y", en: "yam", fr: "igname", the: "l'igname", emoji: "🍠" },
  { letter: "Z", en: "zebra", fr: "zèbre", the: "le zèbre", emoji: "🦓" },
];

/** Les mots de trois lettres que l'enfant lit au CP (`an-cp-sounds`), chacun avec son dessin. */
export const SHORT_WORDS: readonly Word[] = [
  { en: "cat", fr: "chat", the: "le chat", emoji: "🐱" },
  { en: "dog", fr: "chien", the: "le chien", emoji: "🐶" },
  { en: "sun", fr: "soleil", the: "le soleil", emoji: "🌞" },
  { en: "pig", fr: "cochon", the: "le cochon", emoji: "🐷" },
  { en: "key", fr: "clé", the: "la clé", emoji: "🔑" },
  { en: "box", fr: "boîte", the: "la boîte", emoji: "📦" },
];

/** Les prénoms épelés : aucune lettre ne s'y répète (une tuile en double serait ambiguë), de trois à six lettres. */
export const SPELLED_NAMES: readonly string[] = [
  "Idy", "Sow", "Omar", "Diop", "Gaye", "Binta", "Khady", "Demba", "Salif", "Fatou", "Aliou", "Mbaye", "Thiam", "Seydou", "Lamine", "Ndiaye",
];

export const VOWELS: readonly string[] = ["A", "E", "I", "O", "U"];
/** Le Y est tantôt voyelle, tantôt consonne : il ne sert à aucun tri. */
export const CONSONANTS: readonly string[] = ALPHABET.filter((letter) => !VOWELS.includes(letter) && letter !== "Y");

const CONCEPT_LETTERS = "les lettres de l'alphabet anglais";
const CONCEPT_WORDS = "la lettre par laquelle commence un mot anglais";
const CONCEPT_SPELL = "épeler un prénom en anglais";

/** La plage de lettres de la fiche : « a-i » donne A à I. Inconnue ou absente, tout l'alphabet. */
export function lettersOf(ctx: GameContext): readonly string[] {
  const match = /^([a-z])-([a-z])$/.exec(ctx.vocabulary ?? "");
  if (!match) return ALPHABET;
  const from = ALPHABET.indexOf(match[1].toUpperCase());
  const to = ALPHABET.indexOf(match[2].toUpperCase());
  return to >= from ? ALPHABET.slice(from, to + 1) : ALPHABET;
}

/** Les mots-images dont l'initiale est dans la plage. */
const wordsIn = (letters: readonly string[]): readonly KeyWord[] => KEY_WORDS.filter((word) => letters.includes(word.letter));

/** Combien de lettres se suivent : trois au premier palier, quatre au deuxième, cinq ensuite. */
const runLength = (level: number) => (level === 1 ? 3 : level === 2 ? 4 : 5);

// ===========================================================================
// LES JEUX
// ===========================================================================

/** « Quel mot va avec ce dessin ? » : un des mots-images de la plage. */
export function makeAbcWord(ctx: GameContext): GeneratedGame {
  return drawingToWord("abc-mot-dessin", ctx, wordsIn(lettersOf(ctx)), CONCEPT_WORDS);
}

/** « Relie chaque lettre au mot qui commence par elle. » : la lettre à gauche, le mot et son dessin à droite. */
export function makeAbcLinks(ctx: GameContext): GeneratedGame {
  const words = wordsIn(lettersOf(ctx));
  return fresh(
    ctx,
    "abc-relier-mot",
    () => {
      const chosen = shuffle(ctx.rng, words).slice(0, pairsCount(ctx.level, words.length));
      const pairs = chosen.map((word) => ({ left: word.letter, right: tileOf(word) }));
      return {
        type: "match",
        prompt: "Relie chaque lettre au mot qui commence par elle.",
        payload: { pairs, game: originOf("abc-relier-mot", ctx), concept: CONCEPT_WORDS },
        answerKey: pairs.map((pair) => `${pair.left} ~ ${pair.right}`).join(" ; "),
        hints: [
          "Touche une lettre pour l'entendre, puis touche les mots.",
          "Dis en français ce que montre chaque dessin, puis cherche son mot anglais.",
          "Commence par la paire dont tu es le plus sûr.",
        ],
      };
    },
    linkKey,
  );
}

/** « B is for ___. » : trois mots en choix, un seul commence par la lettre. */
export function makeAbcFor(ctx: GameContext): GeneratedGame {
  const words = wordsIn(lettersOf(ctx));
  return fresh(ctx, "abc-pour", () => {
    const answer = freshWord(ctx, words);
    const wrong = shuffle(
      ctx.rng,
      words.filter((word) => word.en !== answer.en),
    ).slice(0, 2);
    const options = shuffle(ctx.rng, [answer, ...wrong]).map(tileOf);
    return {
      type: "fill-blank",
      prompt: "Complète la phrase avec le bon mot.",
      payload: {
        text: `${answer.letter} is for ___.`,
        blanks: [{ options, answer: tileOf(answer) }],
        game: originOf("abc-pour", ctx),
        concept: CONCEPT_WORDS,
      },
      answerKey: tileOf(answer),
      hints: [
        "Écoute la phrase en anglais, doucement.",
        "Dis en français ce que montre chaque dessin, puis cherche son mot anglais.",
        "Le mot commence par la lettre du début de la phrase.",
      ],
    };
  });
}

/** « Remets les lettres dans l'ordre, comme dans la chanson. » : trois à cinq lettres qui se suivent. */
export function makeAbcOrder(ctx: GameContext): GeneratedGame {
  const letters = lettersOf(ctx);
  return fresh(
    ctx,
    "abc-ordre",
    () => {
      const length = Math.min(runLength(ctx.level), letters.length);
      const start = randomInt(ctx.rng, 0, letters.length - length);
      const sequence = letters.slice(start, start + length);
      return {
        type: "order",
        prompt: "Remets les lettres dans l'ordre, comme dans la chanson.",
        payload: { correctSequence: [...sequence], game: originOf("abc-ordre", ctx), concept: CONCEPT_LETTERS },
        answerKey: sequence.join(" "),
        hints: [
          "Chante la chanson de l'alphabet depuis le début.",
          "Touche une lettre pour l'entendre, puis cherche celle qui vient juste après.",
          "Chaque lettre vient juste après sa voisine de gauche dans la chanson.",
        ],
      };
    },
    (game) => String(game.answerKey),
  );
}

/** « A, B, ___, D » : la lettre qui manque dans une suite. Le trou est dans la plage, ses voisines peuvent en sortir. */
export function makeAbcMissing(ctx: GameContext): GeneratedGame {
  const letters = lettersOf(ctx);
  return fresh(ctx, "abc-manquante", () => {
    const size = ctx.level === 1 ? 4 : 5;
    const gap = pickFresh(ctx, letters, (letter) => `gap:${letter}`);
    const gapIndex = ALPHABET.indexOf(gap);
    // Le trou n'est ni la première ni la dernière lettre de la suite : il a une voisine de chaque côté.
    const before = randomInt(ctx.rng, 1, size - 2);
    const start = Math.min(Math.max(0, gapIndex - before), ALPHABET.length - size);
    const run = ALPHABET.slice(start, start + size);
    const shown = run.map((letter) => (letter === gap ? "___" : letter));
    const wrong = shuffle(
      ctx.rng,
      ALPHABET.filter((letter) => !run.includes(letter)),
    ).slice(0, 2);
    const options = shuffle(ctx.rng, [gap, ...wrong]);
    return {
      type: "fill-blank",
      prompt: "Quelle lettre manque dans la suite ?",
      payload: { text: shown.join(", "), blanks: [{ options, answer: gap }], game: originOf("abc-manquante", ctx), concept: CONCEPT_LETTERS },
      answerKey: gap,
      hints: [
        "Chante la chanson de l'alphabet depuis le début.",
        "Cherche entre quelles lettres se trouve le trou.",
        "Touche chaque lettre proposée pour l'entendre, puis dis-la dans la suite.",
      ],
    };
  });
}

/** « Relie chaque grande lettre à sa petite lettre. » : sans I et L ensemble, que la police sans empattement confond. */
export function makeAbcCase(ctx: GameContext): GeneratedGame {
  const letters = lettersOf(ctx);
  return fresh(
    ctx,
    "abc-majuscule",
    () => {
      const chosen: string[] = [];
      for (const letter of shuffle(ctx.rng, letters)) {
        if (chosen.length >= pairsCount(ctx.level, letters.length)) break;
        const twin = letter === "I" ? "L" : letter === "L" ? "I" : null;
        if (twin && chosen.includes(twin)) continue;
        chosen.push(letter);
      }
      const pairs = chosen.map((letter) => ({ left: letter, right: letter.toLowerCase() }));
      return {
        type: "match",
        prompt: "Relie chaque grande lettre à sa petite lettre.",
        payload: { pairs, game: originOf("abc-majuscule", ctx), concept: CONCEPT_LETTERS },
        answerKey: pairs.map((pair) => `${pair.left} ~ ${pair.right}`).join(" ; "),
        hints: [
          "Regarde la forme de chaque lettre.",
          "La petite lettre ressemble souvent à la grande.",
          "Commence par la paire dont tu es le plus sûr.",
        ],
      };
    },
    linkKey,
  );
}

/** « Quelle lettre commence le mot anglais de ce dessin ? » : le mot a été appris, il n'est jamais écrit dans l'énoncé. */
export function makeAbcFirst(ctx: GameContext): GeneratedGame {
  const letters = lettersOf(ctx);
  const words = wordsIn(letters);
  return fresh(ctx, "abc-premiere", () => {
    const answer = freshWord(ctx, words);
    const wrong = shuffle(
      ctx.rng,
      letters.filter((letter) => letter !== answer.letter),
    ).slice(0, 2);
    const options = shuffle(ctx.rng, [answer.letter, ...wrong]);
    return {
      type: "qcm",
      prompt: `Quelle lettre commence le mot anglais de ce dessin ?\n${answer.emoji}`,
      payload: { options, correctIndex: options.indexOf(answer.letter), game: originOf("abc-premiere", ctx), concept: CONCEPT_WORDS },
      answerKey: answer.letter,
      hints: [
        `Dis en français ce que tu vois, avec le mot « ${answer.the} ».`,
        "Cherche le mot anglais que tu as appris pour ce dessin.",
        "Chante l'alphabet et arrête-toi quand tu entends le début du mot.",
      ],
    };
  });
}

/** « Glisse chaque lettre dans la bonne case. » : les cinq voyelles et les consonnes, sans le Y. */
export function makeAbcVowels(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "abc-voyelle",
    () => {
      const total = ctx.level === 1 ? 4 : ctx.level === 2 ? 5 : 6;
      const vowelCount = Math.floor(total / 2) + randomInt(ctx.rng, 0, 1);
      const vowels = shuffle(ctx.rng, VOWELS).slice(0, vowelCount);
      const consonants = shuffle(ctx.rng, CONSONANTS).slice(0, total - vowelCount);
      const items = shuffle(ctx.rng, [
        ...vowels.map((text) => ({ text, correctZone: "Voyelles" })),
        ...consonants.map((text) => ({ text, correctZone: "Consonnes" })),
      ]);
      return {
        type: "drag-drop",
        prompt: "Glisse chaque lettre dans la bonne case.",
        payload: { zones: ["Voyelles", "Consonnes"], items, game: originOf("abc-voyelle", ctx), concept: "les voyelles et les consonnes en anglais" },
        answerKey: items.map((item) => `${item.text} → ${item.correctZone}`).join(" ; "),
        hints: [
          "Il y a seulement cinq voyelles.",
          "Touche une lettre pour l'entendre, puis cherche sa case.",
          "Les voyelles sont a, e, i, o et u.",
        ],
      };
    },
    (game) => JSON.stringify((game.payload.items as { text: string }[]).map((item) => item.text).sort()),
  );
}

/** « Relie chaque dessin à son mot. » : les mots de trois lettres de la fiche. */
export function makeAbcShortWords(ctx: GameContext): GeneratedGame {
  return pictureLinks("abc-mots-courts", ctx, SHORT_WORDS, "lire des mots courts en anglais");
}

/** « Range ces mots dans l'ordre alphabétique. » : trois ou quatre mots d'initiales différentes. */
export function makeAbcWordsOrder(ctx: GameContext): GeneratedGame {
  const words = wordsIn(lettersOf(ctx));
  return fresh(
    ctx,
    "abc-mots-ordre",
    () => {
      const chosen = shuffle(ctx.rng, words).slice(0, ctx.level <= 2 ? 3 : 4);
      const sequence = [...chosen].sort((a, b) => ALPHABET.indexOf(a.letter) - ALPHABET.indexOf(b.letter)).map((word) => word.en);
      return {
        type: "order",
        prompt: "Range ces mots dans l'ordre alphabétique.",
        payload: { correctSequence: sequence, game: originOf("abc-mots-ordre", ctx), concept: "l'ordre alphabétique des mots anglais" },
        answerKey: sequence.join(" "),
        hints: [
          "Regarde la première lettre de chaque mot.",
          "Chante l'alphabet : le mot dont la lettre vient en premier va en premier.",
          "Le mot dont la première lettre est la plus loin dans l'alphabet va en dernier.",
        ],
      };
    },
    (game) => String(game.answerKey),
  );
}

/** Les prénoms que le palier peut épeler : les courts d'abord. */
function namesFor(level: number): readonly string[] {
  const longest = level === 1 ? 4 : level === 2 ? 5 : 6;
  return SPELLED_NAMES.filter((name) => name.length <= longest);
}

/** « Remets les lettres dans l'ordre pour épeler « Fatou ». » */
export function makeAbcSpell(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "abc-epeler",
    () => {
      const name = pickFresh(ctx, namesFor(ctx.level), (n) => `epeler:${n}`, SPELLED_NAMES);
      const sequence = name.toUpperCase().split("");
      return {
        type: "order",
        prompt: `Remets les lettres dans l'ordre pour épeler « ${name} ».`,
        payload: { correctSequence: sequence, game: originOf("abc-epeler", ctx), concept: CONCEPT_SPELL },
        answerKey: sequence.join(" "),
        hints: [
          "Dis le prénom doucement, une lettre après l'autre.",
          `Le prénom commence par la lettre ${name[0].toUpperCase()}.`,
          "Touche une lettre pour l'entendre.",
        ],
      };
    },
    (game) => String(game.answerKey),
  );
}

/** « Comment épelle-t-on « Fatou » ? » : la bonne épellation et deux autres où deux lettres voisines sont échangées. */
export function makeAbcSpellChoice(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "abc-epeler-choix", () => {
    const name = pickFresh(ctx, namesFor(ctx.level), (n) => `epeler:${n}`, SPELLED_NAMES);
    const letters = name.toUpperCase().split("");
    const swaps = shuffle(
      ctx.rng,
      letters.slice(0, -1).map((_, i) => i),
    ).slice(0, 2);
    const wrong = swaps.map((i) => {
      const copy = [...letters];
      [copy[i], copy[i + 1]] = [copy[i + 1], copy[i]];
      return copy.join("-");
    });
    const right = letters.join("-");
    const options = shuffle(ctx.rng, [right, ...wrong]);
    return {
      type: "qcm",
      prompt: `Comment épelle-t-on « ${name} » ?`,
      payload: { options, correctIndex: options.indexOf(right), game: originOf("abc-epeler-choix", ctx), concept: CONCEPT_SPELL },
      answerKey: right,
      hints: [
        "Dis le prénom doucement, une lettre après l'autre.",
        "Touche chaque proposition pour l'entendre.",
        `Le prénom commence par la lettre ${name[0].toUpperCase()}.`,
      ],
    };
  });
}
