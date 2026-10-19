/**
 * LES GABARITS D'ANGLAIS DU CP : la famille, le corps, la classe, les nombres de 11 à 20, les aliments
 * (`an-cp-family`, `an-cp-body`, `an-cp-classroom`, `an-cp-numbers-20`, `an-cp-food`).
 *
 * Le modèle écrivait « Which part is used to walk? » avec le pied pour réponse mais « arm » et « hand »
 * comme autres choix, « Place the words in the correct zones » avec « Fruits », « Viandes » et « Boissons »
 * dont une case restait vide, ou une consigne en anglais qu'un enfant de six ans ne lit pas. Ici le
 * vocabulaire est la liste FERMÉE de la fiche de chaque thématique, la bonne réponse se lit dans un tableau
 * (un mot, son émoji, son sens en français), et aucun mot hors liste n'entre dans un exercice.
 *
 * LA MAISON DES MOTS (l'esprit de `components/landing/demo/bank/anglais.ts`)
 * - La consigne est en français. L'anglais n'est que dans ce que l'enfant apprend : les mots des choix, des
 *   cases et des tuiles, la phrase à trou, la phrase à remettre dans l'ordre.
 * - Un dessin (émoji) ou un mot français dit de quel mot il s'agit. Jamais de prononciation ni d'écoute :
 *   l'application ne lit pas l'anglais.
 * - Pas de forme négative, pas de question à construire, pas de pluriel : la fiche les écarte.
 * - Une étiquette est un mot SEUL, sans article (« nez », « chaise ») : au CI, une tuile « article + un nom »
 *   doit avoir son image au catalogue (`lib/item-images.ts`). Ces gabarits ne sont câblés qu'au CP, mais le
 *   CI les joue aussi dans les tests.
 * - Les émojis sont anciens (Unicode 11 au plus) et jamais suivis de U+FE0F : un mot dont l'émoji ne
 *   respecte pas cela (l'œil, le crayon, le stylo, le doigt, la chaise, la fenêtre, le jus) n'a pas de
 *   dessin ; il passe par son sens en français.
 *
 * RÈGLES POUR AJOUTER UN MOT
 * - Il est dans la liste fermée de la fiche (`convex/programme/anglais.ts`). Sinon on change la fiche
 *   d'abord, jamais l'inverse.
 * - Aucun indice n'écrit le mot anglais de la bonne réponse. Un indice peut donner sa première lettre.
 * - Les énoncés n'ont aucun « : » (l'écran coupe une consigne sur le deux-points), au plus une apostrophe
 *   droite, et vingt-huit mots au plus (la consigne du CP).
 *
 * MODULE PUR (voir `types.ts`).
 */
import { fresh, originOf, pick, pickFresh, randomInt, shuffle, type GameContext, type GeneratedGame } from "./shared";

const range = (n: number) => Array.from({ length: n }, (_, i) => i);

// ===========================================================================
// LES MOTS ET LEURS OUTILS
// ===========================================================================

type Word = {
  en: string;
  /** Le mot français seul, sans article : l'étiquette d'une tuile. */
  fr: string;
  /** Le mot français avec son article, comme un énoncé le dit. */
  the: string;
  /** Son dessin, ou rien quand aucun émoji sûr ne le montre. */
  emoji?: string;
};

const tileOf = (word: Word) => (word.emoji ? `${word.emoji} ${word.en}` : word.en);
const withPicture = (words: readonly Word[]) => words.filter((word) => word.emoji);
const firstLetterHint = (word: Word) => `Le mot commence par la lettre ${word.en[0]}.`;
const pairsCount = (level: number, available: number) => Math.min(available, level === 1 ? 3 : level === 2 ? 4 : 5);

const linkKey = (game: GeneratedGame) =>
  (game.payload.pairs as { left: string; right: string }[])
    .map((pair) => `${pair.left}${pair.right}`)
    .sort()
    .join(",");

/** Un mot qui n'a pas encore servi dans ce palier, quel que soit le jeu : les mêmes mots ne reviennent pas d'un exercice à l'autre. */
const freshWord = <T extends Word>(ctx: GameContext, words: readonly T[]): T => pickFresh(ctx, words, (word) => `en:${word.en}`);

/** La bonne réponse d'un mot et deux autres mots de la liste, mélangés : les trois choix d'un QCM ou d'un trou. */
function threeWords(ctx: GameContext, answer: Word, words: readonly Word[]): string[] {
  const wrong = shuffle(
    ctx.rng,
    words.filter((word) => word.en !== answer.en),
  ).slice(0, 2);
  return shuffle(
    ctx.rng,
    [answer, ...wrong].map((word) => word.en),
  );
}

/** « Quel mot va avec ce dessin ? » : le dessin sur sa propre ligne, le mot parmi trois mots. */
function drawingToWord(kind: string, ctx: GameContext, words: readonly Word[], concept: string): GeneratedGame {
  const drawn = withPicture(words);
  return fresh(ctx, kind, () => {
    const answer = freshWord(ctx, drawn);
    const options = threeWords(ctx, answer, drawn);
    return {
      type: "qcm",
      prompt: `Quel mot va avec ce dessin ?\n${answer.emoji}`,
      payload: { options, correctIndex: options.indexOf(answer.en), game: originOf(kind, ctx), concept },
      answerKey: answer.en,
      hints: [
        "Regarde bien le dessin.",
        "Dis en français ce que tu vois, puis cherche le mot anglais qui va avec.",
        firstLetterHint(answer),
      ],
    };
  });
}

/** « Comment dit-on « la chaise » en anglais ? » : le mot français donne le sens, le mot anglais est le choix. */
function frenchToWord(kind: string, ctx: GameContext, words: readonly Word[], concept: string): GeneratedGame {
  return fresh(ctx, kind, () => {
    const answer = freshWord(ctx, words);
    const options = threeWords(ctx, answer, words);
    return {
      type: "qcm",
      prompt: `Comment dit-on « ${answer.the} » en anglais ?`,
      payload: { options, correctIndex: options.indexOf(answer.en), game: originOf(kind, ctx), concept },
      answerKey: answer.en,
      hints: [
        "Pense à ce que veut dire le mot français.",
        "Écarte les mots anglais que tu connais et qui disent autre chose.",
        firstLetterHint(answer),
      ],
    };
  });
}

/** « Relie chaque dessin à son mot. » : trois à cinq paires. */
function pictureLinks(kind: string, ctx: GameContext, words: readonly Word[], concept: string): GeneratedGame {
  const drawn = withPicture(words);
  return fresh(
    ctx,
    kind,
    () => {
      const chosen = shuffle(ctx.rng, drawn).slice(0, pairsCount(ctx.level, drawn.length));
      const pairs = chosen.map((word) => ({ left: word.emoji as string, right: word.en }));
      return {
        type: "match",
        prompt: "Relie chaque dessin à son mot.",
        payload: { pairs, game: originOf(kind, ctx), concept },
        answerKey: pairs.map((pair) => `${pair.left} ~ ${pair.right}`).join(" ; "),
        hints: [
          "Regarde les dessins l'un après l'autre.",
          "Dis en français ce que montre un dessin, puis cherche son mot anglais.",
          "Commence par la paire dont tu es le plus sûr.",
        ],
      };
    },
    linkKey,
  );
}

/** « Relie chaque mot français à son mot anglais. » : pour les mots qu'aucun dessin sûr ne montre. */
function frenchLinks(kind: string, ctx: GameContext, words: readonly Word[], concept: string): GeneratedGame {
  return fresh(
    ctx,
    kind,
    () => {
      const chosen = shuffle(ctx.rng, words).slice(0, pairsCount(ctx.level, words.length));
      const pairs = chosen.map((word) => ({ left: word.fr, right: word.en }));
      return {
        type: "match",
        prompt: "Relie chaque mot français à son mot anglais.",
        payload: { pairs, game: originOf(kind, ctx), concept },
        answerKey: pairs.map((pair) => `${pair.left} ~ ${pair.right}`).join(" ; "),
        hints: [
          "Lis les mots français l'un après l'autre.",
          "Cherche d'abord le mot anglais que tu connais déjà.",
          "Commence par la paire dont tu es le plus sûr.",
        ],
      };
    },
    linkKey,
  );
}

/**
 * « Glisse chaque mot dans la bonne case. » : quatre à six mots, les deux cases toujours servies. Aux deux
 * premiers niveaux le dessin accompagne le mot ; ensuite le mot est seul.
 */
function sortWords(
  kind: string,
  ctx: GameContext,
  zones: readonly [string, string],
  groups: readonly [readonly Word[], readonly Word[]],
  concept: string,
  hints: readonly [string, string, string],
): GeneratedGame {
  return fresh(
    ctx,
    kind,
    () => {
      const total = ctx.level === 1 ? 4 : ctx.level === 2 ? 5 : 6;
      const firstCount = Math.min(groups[0].length, Math.floor(total / 2) + randomInt(ctx.rng, 0, 1));
      const secondCount = Math.min(total - firstCount, groups[1].length);
      const chosen = [
        ...shuffle(ctx.rng, groups[0]).slice(0, firstCount).map((word) => ({ word, correctZone: zones[0] })),
        ...shuffle(ctx.rng, groups[1]).slice(0, secondCount).map((word) => ({ word, correctZone: zones[1] })),
      ];
      const items = shuffle(ctx.rng, chosen).map(({ word, correctZone }) => ({
        text: ctx.level <= 2 ? tileOf(word) : word.en,
        correctZone,
      }));
      return {
        type: "drag-drop",
        prompt: "Glisse chaque mot dans la bonne case.",
        payload: { zones: [...zones], items, game: originOf(kind, ctx), concept },
        answerKey: items.map((item) => `${item.text} → ${item.correctZone}`).join(" ; "),
        hints: [...hints],
      };
    },
    (game) => JSON.stringify((game.payload.items as { text: string }[]).map((item) => item.text).sort()),
  );
}

/** « Regarde le dessin et complète la phrase. » : le dessin en tête de la phrase, trois mots en choix. */
function gapFromDrawing(
  kind: string,
  ctx: GameContext,
  words: readonly Word[],
  sentence: (emoji: string) => string,
  concept: string,
): GeneratedGame {
  const drawn = withPicture(words);
  return fresh(ctx, kind, () => {
    const answer = freshWord(ctx, drawn);
    const options = threeWords(ctx, answer, drawn);
    return {
      type: "fill-blank",
      prompt: "Regarde le dessin et complète la phrase.",
      payload: {
        text: sentence(answer.emoji as string),
        blanks: [{ options, answer: answer.en }],
        game: originOf(kind, ctx),
        concept,
      },
      answerKey: answer.en,
      hints: [
        "Regarde bien le dessin.",
        "Lis la phrase en anglais, puis cherche le mot qui va avec le dessin.",
        firstLetterHint(answer),
      ],
    };
  });
}

/** « Complète la phrase pour dire « la chaise ». » : le sens vient du mot français de la consigne. */
function gapFromFrench<T extends Word>(
  kind: string,
  ctx: GameContext,
  words: readonly T[],
  prompt: (word: T) => string,
  text: string,
  concept: string,
): GeneratedGame {
  return fresh(ctx, kind, () => {
    const answer = freshWord(ctx, words);
    const options = threeWords(ctx, answer, words);
    return {
      type: "fill-blank",
      prompt: prompt(answer),
      payload: { text, blanks: [{ options, answer: answer.en }], game: originOf(kind, ctx), concept },
      answerKey: answer.en,
      hints: [
        "Lis la phrase en anglais, doucement.",
        "Pense à ce que veut dire le mot français de la consigne.",
        firstLetterHint(answer),
      ],
    };
  });
}

/** « Remets les mots dans l'ordre pour écrire une phrase. » : majuscule au premier mot, point au dernier. */
function sentenceOrder(kind: string, ctx: GameContext, build: () => readonly string[], concept: string): GeneratedGame {
  return fresh(
    ctx,
    kind,
    () => {
      const tiles = build();
      return {
        type: "order",
        prompt: "Remets les mots dans l'ordre pour écrire une phrase.",
        payload: { correctSequence: [...tiles], game: originOf(kind, ctx), concept },
        answerKey: tiles.join(" "),
        hints: [
          "Une phrase commence par une majuscule et finit par un point.",
          "Cherche le mot qui commence par une majuscule, c'est le premier.",
          "Le dernier mot est suivi du point.",
        ],
      };
    },
    (game) => String(game.answerKey),
  );
}

// ===========================================================================
// MA FAMILLE (an-cp-family)
// ===========================================================================

type Relative = Word & {
  /** Qui est-ce, en français, sans écrire le mot anglais de la réponse. */
  clue: string;
};

/** La liste de la fiche : mother, father, brother, sister, grandmother, grandfather, baby, friend. */
export const FAMILY: readonly Relative[] = [
  { en: "mother", fr: "maman", the: "la maman", emoji: "👩", clue: "la maman" },
  { en: "father", fr: "papa", the: "le papa", emoji: "👨", clue: "le papa" },
  { en: "brother", fr: "frère", the: "le frère", emoji: "👦", clue: "le garçon qui a les mêmes parents que toi" },
  { en: "sister", fr: "sœur", the: "la sœur", emoji: "👧", clue: "la fille qui a les mêmes parents que toi" },
  { en: "grandmother", fr: "grand-mère", the: "la grand-mère", emoji: "👵", clue: "la maman de ta maman" },
  { en: "grandfather", fr: "grand-père", the: "le grand-père", emoji: "👴", clue: "le papa de ton papa" },
  { en: "baby", fr: "bébé", the: "le bébé", emoji: "👶", clue: "un tout petit enfant qui ne marche pas encore" },
  { en: "friend", fr: "ami", the: "l'ami", clue: "celui ou celle avec qui tu joues" },
];

/** Les femmes et les filles, les hommes et les garçons : le bébé et l'ami, qui sont les deux, n'y sont pas. */
const FEMALES = FAMILY.filter((word) => ["mother", "sister", "grandmother"].includes(word.en));
const MALES = FAMILY.filter((word) => ["father", "brother", "grandfather"].includes(word.en));

/** « Quel mot va avec ce dessin ? » : un membre de la famille dessiné. */
export function makeFamilyWord(ctx: GameContext): GeneratedGame {
  return drawingToWord("famille-mot", ctx, FAMILY, "les membres de la famille en anglais");
}

/** « Quel mot anglais dit « la maman de ta maman » ? » : la définition donne le mot, pas le dessin. */
export function makeFamilyClue(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "famille-lien", () => {
    const answer = freshWord(ctx, FAMILY);
    const options = threeWords(ctx, answer, FAMILY);
    return {
      type: "qcm",
      prompt: `Quel mot anglais dit « ${answer.clue} » ?`,
      payload: {
        options,
        correctIndex: options.indexOf(answer.en),
        game: originOf("famille-lien", ctx),
        concept: "les membres de la famille en anglais",
      },
      answerKey: answer.en,
      hints: [
        "Pense à la personne dont parle la consigne.",
        "Écarte les mots anglais qui disent une autre personne.",
        firstLetterHint(answer),
      ],
    };
  });
}

/** « Relie chaque dessin à son mot. » */
export function makeFamilyLinks(ctx: GameContext): GeneratedGame {
  return pictureLinks("famille-relier", ctx, FAMILY, "les membres de la famille en anglais");
}

/** « Glisse chaque mot dans la bonne case. » : une femme ou une fille, un homme ou un garçon. */
export function makeFamilySort(ctx: GameContext): GeneratedGame {
  return sortWords("famille-glisser", ctx, ["Femme ou fille", "Homme ou garçon"], [FEMALES, MALES], "les membres de la famille en anglais", [
    "Pense à la personne que dit chaque mot.",
    "Une maman, une sœur et une grand-mère sont des femmes ou des filles.",
    "Un papa, un frère et un grand-père sont des hommes ou des garçons.",
  ]);
}

/** « 👩 This is my ___. » */
export function makeFamilyGap(ctx: GameContext): GeneratedGame {
  return gapFromDrawing("famille-trou", ctx, FAMILY, (emoji) => `${emoji} This is my ___.`, "présenter un membre de sa famille");
}

/** « This is my mother. » remis dans l'ordre. */
export function makeFamilySentence(ctx: GameContext): GeneratedGame {
  return sentenceOrder("famille-phrase", ctx, () => ["This", "is", "my", `${freshWord(ctx, FAMILY).en}.`], "présenter un membre de sa famille");
}

// ===========================================================================
// MON CORPS (an-cp-body)
// ===========================================================================

type BodyPart = Word & {
  /** « ton nez », « tes cheveux » : le mot français de la consigne. */
  yours: string;
  /** Le visage, ou les bras et les jambes. La tête et les cheveux n'ont pas de case. */
  zone?: "visage" | "membres";
};

/** La liste de la fiche : head, hair, eye, ear, nose, mouth, hand, finger, arm, leg, foot, au singulier. */
export const BODY: readonly BodyPart[] = [
  { en: "head", fr: "tête", the: "la tête", yours: "ta tête" },
  { en: "hair", fr: "cheveux", the: "les cheveux", yours: "tes cheveux" },
  { en: "eye", fr: "œil", the: "l'œil", yours: "ton œil", zone: "visage" },
  { en: "ear", fr: "oreille", the: "l'oreille", yours: "ton oreille", emoji: "👂", zone: "visage" },
  { en: "nose", fr: "nez", the: "le nez", yours: "ton nez", emoji: "👃", zone: "visage" },
  { en: "mouth", fr: "bouche", the: "la bouche", yours: "ta bouche", emoji: "👄", zone: "visage" },
  { en: "hand", fr: "main", the: "la main", yours: "ta main", emoji: "✋", zone: "membres" },
  { en: "finger", fr: "doigt", the: "le doigt", yours: "ton doigt", zone: "membres" },
  { en: "arm", fr: "bras", the: "le bras", yours: "ton bras", emoji: "💪", zone: "membres" },
  { en: "leg", fr: "jambe", the: "la jambe", yours: "ta jambe", emoji: "🦵", zone: "membres" },
  { en: "foot", fr: "pied", the: "le pied", yours: "ton pied", emoji: "🦶", zone: "membres" },
];

const FACE_PARTS = BODY.filter((part) => part.zone === "visage");
const LIMB_PARTS = BODY.filter((part) => part.zone === "membres");

/** « Quel mot va avec ce dessin ? » : une partie du corps dessinée. */
export function makeBodyWord(ctx: GameContext): GeneratedGame {
  return drawingToWord("corps-mot", ctx, BODY, "les parties du corps en anglais");
}

/** « Comment dit-on « touche ton nez » en anglais ? » : la phrase de la maîtresse, trois phrases au choix. */
export function makeBodyCommand(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "corps-consigne", () => {
    const touch = ctx.level < 3 || ctx.rng() < 0.5;
    const answer = freshWord(ctx, BODY);
    const wrong = shuffle(
      ctx.rng,
      BODY.filter((part) => part.en !== answer.en),
    ).slice(0, 2);
    const sentence = (part: BodyPart) => (touch ? `Touch your ${part.en}.` : `Point to your ${part.en}.`);
    const options = shuffle(
      ctx.rng,
      [answer, ...wrong].map(sentence),
    );
    return {
      type: "qcm",
      prompt: `Comment dit-on « ${touch ? "touche" : "montre"} ${answer.yours} » en anglais ?`,
      payload: {
        options,
        correctIndex: options.indexOf(sentence(answer)),
        game: originOf("corps-consigne", ctx),
        concept: "toucher ou montrer une partie du corps",
      },
      answerKey: sentence(answer),
      hints: [
        "Les trois phrases commencent de la même façon. Regarde la fin.",
        "Cherche la partie du corps que dit la consigne.",
        `Le dernier mot commence par la lettre ${answer.en[0]}.`,
      ],
    };
  });
}

/** Relier un dessin à son mot, ou, plus loin, un mot français à son mot anglais. */
export function makeBodyLinks(ctx: GameContext): GeneratedGame {
  if (ctx.level === 1) return pictureLinks("corps-relier", ctx, BODY, "les parties du corps en anglais");
  return frenchLinks("corps-relier", ctx, BODY, "les parties du corps en anglais");
}

/** « Glisse chaque mot dans la bonne case. » : le visage, ou les bras et les jambes. */
export function makeBodySort(ctx: GameContext): GeneratedGame {
  return sortWords("corps-glisser", ctx, ["Visage", "Bras et jambes"], [FACE_PARTS, LIMB_PARTS], "les parties du corps en anglais", [
    "Pense à l'endroit du corps où se trouve chaque partie.",
    "Les yeux, le nez, la bouche et l'oreille sont sur le visage.",
    "La main, le doigt, le bras, la jambe et le pied vont avec les bras et les jambes.",
  ]);
}

/** « Complète la phrase pour toucher ton nez. » : « Touch your ___. » */
export function makeBodyGap(ctx: GameContext): GeneratedGame {
  const touch = ctx.level < 3 || ctx.rng() < 0.5;
  return gapFromFrench(
    "corps-trou",
    ctx,
    BODY,
    (part) => `Complète la phrase pour ${touch ? "toucher" : "montrer"} ${part.yours}.`,
    touch ? "Touch your ___." : "Point to your ___.",
    "toucher ou montrer une partie du corps",
  );
}

/**
 * « Touch your nose. » remis dans l'ordre. « Point to your head. » n'y est pas : le mot « Point » est le mot
 * français du point final que l'indice dit, et un indice n'écrit jamais un mot de la réponse.
 */
export function makeBodySentence(ctx: GameContext): GeneratedGame {
  return sentenceOrder("corps-phrase", ctx, () => ["Touch", "your", `${freshWord(ctx, BODY).en}.`], "toucher une partie du corps");
}

// ===========================================================================
// DANS MA CLASSE (an-cp-classroom)
// ===========================================================================

/** La liste de la fiche : book, pen, pencil, bag, ruler, desk, chair, board, door, window. Toutes commencent par une consonne. */
export const CLASSROOM: readonly Word[] = [
  { en: "book", fr: "livre", the: "le livre", emoji: "📖" },
  { en: "pen", fr: "stylo", the: "le stylo" },
  { en: "pencil", fr: "crayon", the: "le crayon" },
  { en: "bag", fr: "cartable", the: "le cartable", emoji: "🎒" },
  { en: "ruler", fr: "règle", the: "la règle", emoji: "📏" },
  { en: "desk", fr: "bureau", the: "le bureau" },
  { en: "chair", fr: "chaise", the: "la chaise" },
  { en: "board", fr: "tableau", the: "le tableau" },
  { en: "door", fr: "porte", the: "la porte", emoji: "🚪" },
  { en: "window", fr: "fenêtre", the: "la fenêtre" },
];

/** Ce qu'on tient dans la main, ce qui reste dans la classe : le cartable, ni l'un ni l'autre, n'y est pas. */
const SMALL_THINGS = CLASSROOM.filter((word) => ["book", "pen", "pencil", "ruler"].includes(word.en));
const BIG_THINGS = CLASSROOM.filter((word) => ["desk", "chair", "board", "door", "window"].includes(word.en));

/** « Quel mot va avec ce dessin ? » : un livre, un cartable, une règle ou une porte. */
export function makeClassWord(ctx: GameContext): GeneratedGame {
  return drawingToWord("classe-mot", ctx, CLASSROOM, "les objets de la classe en anglais");
}

/** « Comment dit-on « la chaise » en anglais ? » */
export function makeClassFrench(ctx: GameContext): GeneratedGame {
  return frenchToWord("classe-francais", ctx, CLASSROOM, "les objets de la classe en anglais");
}

/** Relier un dessin à son mot, ou, plus loin, un mot français à son mot anglais. */
export function makeClassLinks(ctx: GameContext): GeneratedGame {
  if (ctx.level === 1) return pictureLinks("classe-relier", ctx, CLASSROOM, "les objets de la classe en anglais");
  return frenchLinks("classe-relier", ctx, CLASSROOM, "les objets de la classe en anglais");
}

/** « Glisse chaque mot dans la bonne case. » : un petit objet, ou un grand. */
export function makeClassSort(ctx: GameContext): GeneratedGame {
  return sortWords("classe-glisser", ctx, ["Petit objet", "Grand objet"], [SMALL_THINGS, BIG_THINGS], "les objets de la classe en anglais", [
    "Pense à la taille de chaque objet dans ta classe.",
    "Un petit objet tient dans la main ou dans le cartable.",
    "Un grand objet est un meuble ou une partie de la salle.",
  ]);
}

/** « 🎒 It is a ___. » */
export function makeClassGap(ctx: GameContext): GeneratedGame {
  return gapFromDrawing("classe-trou", ctx, CLASSROOM, (emoji) => `${emoji} It is a ___.`, "dire ce qu'est un objet");
}

/** « What is it? 🚪 It is a ___. » : la question, puis la réponse à compléter. */
export function makeClassQuestion(ctx: GameContext): GeneratedGame {
  const drawn = withPicture(CLASSROOM);
  return fresh(ctx, "classe-question", () => {
    const answer = freshWord(ctx, drawn);
    const options = threeWords(ctx, answer, CLASSROOM);
    return {
      type: "fill-blank",
      prompt: "On te montre un objet de la classe. Réponds à la question.",
      payload: {
        text: `What is it? ${answer.emoji} It is a ___.`,
        blanks: [{ options, answer: answer.en }],
        game: originOf("classe-question", ctx),
        concept: "répondre à la question sur un objet",
      },
      answerKey: answer.en,
      hints: [
        "Regarde bien le dessin dans la phrase.",
        "Dis en français ce que tu vois, puis cherche le mot anglais.",
        firstLetterHint(answer),
      ],
    };
  });
}

/** « It is a book. » remis dans l'ordre. */
export function makeClassSentence(ctx: GameContext): GeneratedGame {
  return sentenceOrder("classe-phrase", ctx, () => ["It", "is", "a", `${freshWord(ctx, CLASSROOM).en}.`], "dire ce qu'est un objet");
}

// ===========================================================================
// LES NOMBRES DE 11 À 20 (an-cp-numbers-20)
// ===========================================================================

/** De zero à twenty : le rang d'un mot est le nombre qu'il dit. */
export const NUMBER_WORDS = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
  "twenty",
] as const;

const numberWord = (n: number) => NUMBER_WORDS[n] as string;

/** Les nombres dont un palier parle : onze à quinze, puis jusqu'à dix-huit, puis jusqu'à vingt. */
function poolOf(level: number): number[] {
  if (level === 1) return range(5).map((i) => 11 + i);
  if (level === 2) return range(8).map((i) => 11 + i);
  return range(10).map((i) => 11 + i);
}

/** Les nombres de zéro à dix, revus : au dernier palier, ils se mêlent aux autres (un mauvais choix, une paire, un rang). */
const REVIEW = range(10).map((i) => 1 + i);

/** Ce que les mauvais choix peuvent être : au dernier palier, les nombres de zéro à dix aussi. */
const choicesOf = (level: number) => (level === 4 ? range(21) : poolOf(level));

/** Deux nombres de `pool` proches de `n`, jamais `n` ni ceux de `except` : les erreurs d'un enfant qui hésite. */
function neighboursIn(ctx: GameContext, n: number, pool: readonly number[], except: readonly number[] = []): number[] {
  const left = pool.filter((m) => m !== n && !except.includes(m));
  const near = left.filter((m) => Math.abs(m - n) <= 3);
  const others = left.filter((m) => !near.includes(m));
  return [...shuffle(ctx.rng, near), ...shuffle(ctx.rng, others)].slice(0, 2);
}

/** Des nombres du palier, et au dernier palier un nombre revu de un à dix. */
function numbersWithReview(ctx: GameContext, count: number): number[] {
  const review = ctx.level === 4 ? 1 : 0;
  return [...shuffle(ctx.rng, poolOf(ctx.level)).slice(0, count - review), ...shuffle(ctx.rng, REVIEW).slice(0, review)];
}

/** Le même coup de pouce pour trouver un mot de nombre : le bout de mot commun de 13 à 19, sinon le comptage. */
const numberHint = (n: number) =>
  n >= 13 && n <= 19 ? "Les nombres de 13 à 19 finissent tous par le même bout de mot." : "Compte en anglais depuis un jusqu'à ce nombre.";

/** « Comment écrit-on le nombre 14 en anglais ? » */
export function makeNumberWord(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "nombre-mot", () => {
    const n = pickFresh(ctx, poolOf(ctx.level), (m) => `nombre:${m}`);
    const options = shuffle(ctx.rng, [n, ...neighboursIn(ctx, n, choicesOf(ctx.level))]).map(numberWord);
    return {
      type: "qcm",
      prompt: `Comment écrit-on le nombre ${n} en anglais ?`,
      payload: {
        options,
        correctIndex: options.indexOf(numberWord(n)),
        game: originOf("nombre-mot", ctx),
        concept: "écrire un nombre en anglais",
      },
      answerKey: numberWord(n),
      hints: ["Dis le nombre en français, puis cherche son mot anglais.", numberHint(n), `Le mot commence par la lettre ${numberWord(n)[0]}.`],
    };
  });
}

/** « Complète avec le bon nombre. » : « sixteen = ___ » avec trois nombres en chiffres. */
export function makeNumberDigit(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "nombre-chiffre", () => {
    const n = pickFresh(ctx, poolOf(ctx.level), (m) => `nombre:${m}`);
    const options = shuffle(ctx.rng, [n, ...neighboursIn(ctx, n, choicesOf(ctx.level))]).map(String);
    return {
      type: "fill-blank",
      prompt: "Complète avec le bon nombre.",
      payload: {
        text: `${numberWord(n)} = ___`,
        blanks: [{ options, answer: String(n) }],
        game: originOf("nombre-chiffre", ctx),
        concept: "lire un nombre en anglais",
      },
      answerKey: String(n),
      hints: [
        "Lis le mot anglais doucement.",
        "Compte en anglais depuis un jusqu'à ce mot.",
        "Choisis le nombre qui est dit par ce mot.",
      ],
    };
  });
}

/** « Relie chaque nombre à son mot anglais. » : trois à cinq paires. */
export function makeNumberLinks(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "nombre-relier",
    () => {
      const chosen = numbersWithReview(ctx, pairsCount(ctx.level, poolOf(ctx.level).length));
      const pairs = shuffle(ctx.rng, chosen).map((n) => ({ left: String(n), right: numberWord(n) }));
      return {
        type: "match",
        prompt: "Relie chaque nombre à son mot anglais.",
        payload: { pairs, game: originOf("nombre-relier", ctx), concept: "écrire un nombre en anglais" },
        answerKey: pairs.map((pair) => `${pair.left} ~ ${pair.right}`).join(" ; "),
        hints: [
          "Lis les nombres l'un après l'autre.",
          "Les mots qui finissent par le même bout de mot disent des nombres qui se suivent.",
          "Commence par la paire dont tu es le plus sûr.",
        ],
      };
    },
    linkKey,
  );
}

/** « Remets ces nombres dans l'ordre, du plus petit au plus grand. » : trois ou quatre mots. */
export function makeEnglishNumberOrder(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "nombre-ordre",
    () => {
      const chosen = numbersWithReview(ctx, ctx.level === 1 ? 3 : 4).sort((a, b) => a - b);
      const sequence = chosen.map(numberWord);
      return {
        type: "order",
        prompt: "Remets ces nombres dans l'ordre, du plus petit au plus grand.",
        payload: { correctSequence: sequence, game: originOf("nombre-ordre", ctx), concept: "ranger des nombres en anglais" },
        answerKey: sequence.join(", "),
        hints: [
          "Dis chaque nombre en français, puis range-les.",
          "Cherche d'abord le nombre le plus petit.",
          "Place ensuite celui qui vient juste après, et ainsi de suite.",
        ],
      };
    },
    (game) => (game.payload.correctSequence as string[]).join(","),
  );
}

/** « Quel est le mot anglais du nombre qui vient juste après 13 ? » */
export function makeNumberNext(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "nombre-suivant", () => {
    const n = pick(
      ctx.rng,
      poolOf(ctx.level).filter((m) => m < 20),
    );
    const answer = n + 1;
    const options = shuffle(ctx.rng, [answer, ...neighboursIn(ctx, answer, choicesOf(ctx.level), [n])]).map(numberWord);
    return {
      type: "qcm",
      prompt: `Quel est le mot anglais du nombre qui vient juste après ${n} ?`,
      payload: {
        options,
        correctIndex: options.indexOf(numberWord(answer)),
        game: originOf("nombre-suivant", ctx),
        concept: "le nombre d'après, en anglais",
      },
      answerKey: numberWord(answer),
      hints: [
        "Compte en français jusqu'au nombre de la consigne.",
        "Le nombre cherché est celui que tu dis juste après.",
        `Le mot commence par la lettre ${numberWord(answer)[0]}.`,
      ],
    };
  });
}

/** « Tu as 7 ans. Complète la réponse. » : « How old are you? I am ___. » */
export function makeNumberAge(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "nombre-age", () => {
    const ages = range(7).map((i) => 6 + i);
    const n = pick(ctx.rng, ages);
    const wrong = shuffle(
      ctx.rng,
      ages.filter((m) => m !== n),
    ).slice(0, 2);
    const options = shuffle(ctx.rng, [n, ...wrong]).map(numberWord);
    return {
      type: "fill-blank",
      prompt: `Tu as ${n} ans. Complète la réponse.`,
      payload: {
        text: "How old are you? I am ___.",
        blanks: [{ options, answer: numberWord(n) }],
        game: originOf("nombre-age", ctx),
        concept: "dire son âge",
      },
      answerKey: numberWord(n),
      hints: [
        "Cherche dans la consigne le nombre qui dit ton âge.",
        "Dis ce nombre en anglais.",
        `Le mot commence par la lettre ${numberWord(n)[0]}.`,
      ],
    };
  });
}

/** « Écris en lettres, en anglais, le nombre 16. » : un mot à écrire. */
export function makeNumberWrite(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "nombre-ecrire", () => {
    const n = pickFresh(ctx, poolOf(ctx.level), (m) => `nombre:${m}`);
    return {
      type: "short-answer",
      prompt: `Écris en lettres, en anglais, le nombre ${n}.`,
      payload: {
        acceptedAnswers: [numberWord(n)],
        game: originOf("nombre-ecrire", ctx),
        concept: "écrire un nombre en anglais",
      },
      answerKey: numberWord(n),
      hints: ["Dis le nombre en français, puis cherche son mot anglais.", numberHint(n), `Le mot commence par la lettre ${numberWord(n)[0]}.`],
    };
  });
}

/** « Glisse chaque nombre dans la bonne case. » : moins ou plus qu'un nombre de repère, jamais le repère. */
export function makeNumberSort(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "nombre-glisser",
    () => {
      const topic = poolOf(ctx.level);
      // Au premier palier, cinq nombres seulement : le repère laisse au moins un nombre de chaque côté. Ensuite, au moins deux.
      const margin = ctx.level === 1 ? 1 : 2;
      const mark = randomInt(ctx.rng, topic[0] + margin, topic[topic.length - 1] - margin);
      const total = ctx.level === 1 ? 4 : ctx.level === 2 ? 5 : 6;
      // Les nombres du palier d'abord, les nombres revus de 1 à 10 ensuite (au dernier palier) : un côté ne se remplit pas de « two » et « four ».
      const below = [...shuffle(ctx.rng, topic.filter((n) => n < mark)), ...(ctx.level === 4 ? shuffle(ctx.rng, REVIEW) : [])];
      const above = shuffle(
        ctx.rng,
        topic.filter((n) => n > mark),
      );
      const belowCount = Math.min(below.length, Math.floor(total / 2) + randomInt(ctx.rng, 0, 1));
      const chosen = new Set<number>([...below.slice(0, belowCount), ...above.slice(0, total - belowCount)]);
      for (const n of [...below, ...above]) {
        if (chosen.size >= total) break;
        chosen.add(n);
      }
      const zones = [`Moins de ${mark}`, `Plus de ${mark}`];
      const items = shuffle(
        ctx.rng,
        [...chosen].map((n) => ({ text: numberWord(n), correctZone: n < mark ? zones[0] : zones[1] })),
      );
      return {
        type: "drag-drop",
        prompt: "Glisse chaque nombre dans la bonne case.",
        payload: { zones, items, game: originOf("nombre-glisser", ctx), concept: "comparer des nombres en anglais" },
        answerKey: items.map((item) => `${item.text} → ${item.correctZone}`).join(" ; "),
        hints: [
          "Dis chaque nombre en français.",
          `Compare-le au nombre ${mark}.`,
          `Un nombre qui vient avant ${mark} va dans la case du moins.`,
        ],
      };
    },
    (game) => String(game.prompt) + JSON.stringify((game.payload.items as { text: string }[]).map((item) => item.text).sort()),
  );
}

const COUNTABLES = ["🍎", "⚽", "⭐", "🐟", "🌸", "🥭"] as const;

/** « Combien vois-tu de dessins ? » : deux rangées de dix au plus, le nombre à choisir en anglais. */
export function makeNumberCount(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "nombre-compter", () => {
    const max = ctx.level === 1 ? 15 : ctx.level === 2 ? 18 : 20;
    const count = randomInt(ctx.rng, 11, max);
    const emoji = pick(ctx.rng, COUNTABLES);
    const rows = [emoji.repeat(10), emoji.repeat(count - 10)];
    const options = shuffle(ctx.rng, [count, ...neighboursIn(ctx, count, range(10).map((i) => 11 + i))]).map(numberWord);
    return {
      type: "qcm",
      prompt: `Combien vois-tu de dessins ? Choisis le mot anglais.\n${rows.join("\n")}`,
      payload: {
        options,
        correctIndex: options.indexOf(numberWord(count)),
        game: originOf("nombre-compter", ctx),
        concept: "compter jusqu'à 20 en anglais",
      },
      answerKey: numberWord(count),
      hints: [
        "La première rangée a dix dessins. Compte ceux de la deuxième.",
        "Ajoute dix au nombre de dessins de la deuxième rangée.",
        "Dis le nombre en français, puis cherche son mot anglais.",
      ],
    };
  });
}

// ===========================================================================
// MANGER ET BOIRE (an-cp-food)
// ===========================================================================

type Food = Word & { kind: "manger" | "boire" };

/** La liste de la fiche : rice, fish, bread, milk, water, egg, chicken, tea, juice. */
export const FOOD: readonly Food[] = [
  { en: "rice", fr: "riz", the: "le riz", emoji: "🍚", kind: "manger" },
  { en: "fish", fr: "poisson", the: "le poisson", emoji: "🐟", kind: "manger" },
  { en: "bread", fr: "pain", the: "le pain", emoji: "🍞", kind: "manger" },
  { en: "milk", fr: "lait", the: "le lait", emoji: "🥛", kind: "boire" },
  { en: "water", fr: "eau", the: "l'eau", emoji: "💧", kind: "boire" },
  { en: "egg", fr: "œuf", the: "l'œuf", emoji: "🥚", kind: "manger" },
  { en: "chicken", fr: "poulet", the: "le poulet", emoji: "🍗", kind: "manger" },
  { en: "tea", fr: "thé", the: "le thé", emoji: "🍵", kind: "boire" },
  { en: "juice", fr: "jus", the: "le jus", kind: "boire" },
];

/** Ce qu'on peut aimer sans article ni pluriel : « I like egg. » serait faux (« egg » se compte), la fiche n'a pas de pluriel. */
const LIKED = FOOD.filter((food) => food.en !== "egg");
const TO_EAT = FOOD.filter((food) => food.kind === "manger");
const TO_DRINK = FOOD.filter((food) => food.kind === "boire");

/** « Quel mot va avec ce dessin ? » : un aliment ou une boisson dessinés. */
export function makeFoodWord(ctx: GameContext): GeneratedGame {
  return drawingToWord("aliment-mot", ctx, FOOD, "les aliments et les boissons en anglais");
}

/** « Comment dit-on « le lait » en anglais ? » */
export function makeFoodFrench(ctx: GameContext): GeneratedGame {
  return frenchToWord("aliment-francais", ctx, FOOD, "les aliments et les boissons en anglais");
}

/** Relier un dessin à son mot, ou, plus loin, un mot français à son mot anglais. */
export function makeFoodLinks(ctx: GameContext): GeneratedGame {
  if (ctx.level <= 2) return pictureLinks("aliment-relier", ctx, FOOD, "les aliments et les boissons en anglais");
  return frenchLinks("aliment-relier", ctx, FOOD, "les aliments et les boissons en anglais");
}

/** « Glisse chaque mot dans la bonne case. » : je mange, ou je bois. */
export function makeFoodSort(ctx: GameContext): GeneratedGame {
  return sortWords("aliment-glisser", ctx, ["Je mange", "Je bois"], [TO_EAT, TO_DRINK], "les aliments et les boissons en anglais", [
    "Pense à ton repas, ce que tu manges et ce que tu bois dans un verre.",
    "On mange du pain, du riz, du poisson, un œuf ou du poulet.",
    "On boit du lait, de l'eau, du thé ou du jus.",
  ]);
}

/** « 🍚 I like ___. » */
export function makeFoodGap(ctx: GameContext): GeneratedGame {
  return gapFromDrawing("aliment-trou", ctx, LIKED, (emoji) => `${emoji} I like ___.`, "dire ce qu'on aime manger ou boire");
}

/** « Complète la phrase pour dire que tu aimes le jus. » : « I like ___. » */
export function makeFoodFrenchGap(ctx: GameContext): GeneratedGame {
  return gapFromFrench(
    "aliment-trou-francais",
    ctx,
    LIKED,
    (food) => `Complète la phrase pour dire que tu aimes ${food.the}.`,
    "I like ___.",
    "dire ce qu'on aime manger ou boire",
  );
}

/** « I like rice. » remis dans l'ordre. */
export function makeFoodSentence(ctx: GameContext): GeneratedGame {
  return sentenceOrder("aliment-phrase", ctx, () => ["I", "like", `${freshWord(ctx, LIKED).en}.`], "dire ce qu'on aime manger ou boire");
}
