/**
 * LES GABARITS D'ANGLAIS DU CI : les salutations, les couleurs, les nombres de 0 à 10, les animaux, les fruits
 * (`an-ci-hello`, `an-ci-colours`, `an-ci-numbers`, `an-ci-animals`, `an-ci-fruits`).
 *
 * Sur les cent dix-huit exercices que le modèle avait écrits pour ces cinq thématiques, un sur trois était faux,
 * ambigu ou hors niveau : « How many stars? » avec six étoiles et « seven » pour réponse, un cheval rangé dans
 * « Autres animaux », « hello » et « hi » tous deux justes dans un même choix, deux poignées de main (👋) pour
 * « hi » et « goodbye », « Remets ces phrases dans le bon ordre : 'I am Modou', 'Goodbye' » avec « Goodbye » en
 * premier, « I see a ___ (lion, cow, monkey) » où les trois mots vont, « I have an ___ » où « apple » et
 * « pineapple » vont, des consignes en anglais qu'un enfant de six ans ne lit pas, un rose écrit avec un émoji
 * d'Unicode 15. Ici chaque réponse se lit dans un tableau (un mot, son dessin, son sens en français) et aucun mot
 * hors de la liste de la fiche n'entre dans un exercice.
 *
 * LA MAISON DES MOTS (celle de `anglais.ts`, le lot du CP, dont ce module emprunte les outils)
 * - La consigne est en français, sans aucun mot anglais. L'anglais n'est que dans ce que l'enfant apprend : les
 *   choix, les cases, les tuiles, la phrase à trou, la phrase à remettre dans l'ordre. Jamais d'écoute ni de
 *   prononciation : l'application ne lit pas l'anglais.
 * - Une étiquette est un mot SEUL, sans article, avec son dessin devant quand il en a un (« 🐶 dog ») : au CI, une
 *   tuile « article + un nom » doit avoir son image au catalogue (`lib/item-images.ts`).
 * - Les émojis sont anciens (Unicode 11 au plus) et jamais suivis de U+FE0F : les pastilles de couleur 🟠 🟡 🟢 🟣
 *   🟤 et les cœurs blanc et marron sont d'Unicode 12, un appareil ancien les montre en case vide. Les couleurs
 *   passent donc par les ronds 🔴 🔵 ⚪, les cœurs 💛 💚 🧡 💜 🖤 💗 et le chocolat 🍫.
 * - La fiche des animaux et celle des fruits disent « mots isolés, sans phrase » : aucune phrase à trou.
 *
 * LES JUMEAUX. « hello » et « hi » disent la même chose, « goodbye » et « bye » aussi : jamais l'un en bonne
 * réponse et l'autre en mauvais choix. « hi » et « bye » ne servent que rangés (« pour dire bonjour », « pour dire
 * au revoir »), où ils ont une seule bonne case. De même, une couleur n'est jamais proposée à côté d'une couleur
 * voisine (orange et rouge, rose et violet) pour le dessin d'une banane ou d'une tomate : un fruit peut être vert
 * ou brun selon sa maturité.
 *
 * RÈGLES POUR AJOUTER UN MOT
 * - Il est dans la liste fermée de la fiche (`convex/programme/anglais.ts`). Sinon on change la fiche d'abord.
 * - Aucun indice n'écrit le mot anglais de la bonne réponse. Un indice peut donner sa première lettre.
 * - Les énoncés n'ont aucun « : » (l'écran coupe une consigne sur le deux-points), au plus une apostrophe droite,
 *   et vingt mots au plus (la consigne du CI).
 *
 * MODULE PUR (voir `types.ts`).
 */
import { fresh, originOf, pick, pickFresh, randomInt, shuffle, type GameContext, type GeneratedGame } from "./shared";
import {
  NUMBER_WORDS,
  drawingToWord,
  firstLetterHint,
  frenchLinks,
  frenchToWord,
  freshWord,
  linkKey,
  pairsCount,
  pictureLinks,
  range,
  sentenceOrder,
  sortWords,
  tileOf,
  type Word,
} from "./anglais";

// ===========================================================================
// UN INTRUS : DEUX D'UNE FAMILLE, UN D'UNE AUTRE
// ===========================================================================

/** Deux familles de mots et les deux manières de poser la question. */
type Property = {
  yes: readonly Word[];
  no: readonly Word[];
  /** La question dont la réponse est dans `yes` : un mot de `yes` parmi deux de `no`. */
  positive: string;
  /** La question dont la réponse est dans `no` : un mot de `no` parmi deux de `yes`. */
  negative: string;
  hintYes: string;
  hintNo: string;
};

/** « Lequel n'est pas un fruit ? » : trois tuiles avec leur dessin, deux d'une famille et une de l'autre. */
function oddOneOut(kind: string, ctx: GameContext, property: Property, concept: string): GeneratedGame {
  return fresh(ctx, kind, () => {
    const answerIsYes = ctx.rng() < 0.5;
    const answer = freshWord(ctx, answerIsYes ? property.yes : property.no);
    const others = shuffle(
      ctx.rng,
      (answerIsYes ? property.no : property.yes).filter((word) => word.en !== answer.en),
    ).slice(0, 2);
    const options = shuffle(ctx.rng, [answer, ...others]).map(tileOf);
    return {
      type: "qcm",
      prompt: answerIsYes ? property.positive : property.negative,
      payload: { options, correctIndex: options.indexOf(tileOf(answer)), game: originOf(kind, ctx), concept },
      answerKey: tileOf(answer),
      hints: [
        "Regarde les trois dessins, l'un après l'autre.",
        answerIsYes ? property.hintYes : property.hintNo,
        "Cherche celui qui n'est pas comme les deux autres.",
      ],
    };
  });
}

// ===========================================================================
// LES ANIMAUX (an-ci-animals)
// ===========================================================================

type Animal = Word & { home: "ferme" | "sauvage" | "autre" };

/** La liste de la fiche : dog, cat, bird, fish, cow, goat, sheep, horse, chicken, monkey, lion, elephant. */
export const ANIMALS: readonly Animal[] = [
  { en: "dog", fr: "chien", the: "le chien", emoji: "🐶", home: "autre" },
  { en: "cat", fr: "chat", the: "le chat", emoji: "🐱", home: "autre" },
  { en: "bird", fr: "oiseau", the: "l'oiseau", emoji: "🐦", home: "autre" },
  { en: "fish", fr: "poisson", the: "le poisson", emoji: "🐟", home: "autre" },
  { en: "cow", fr: "vache", the: "la vache", emoji: "🐄", home: "ferme" },
  { en: "goat", fr: "chèvre", the: "la chèvre", emoji: "🐐", home: "ferme" },
  { en: "sheep", fr: "mouton", the: "le mouton", emoji: "🐑", home: "ferme" },
  { en: "horse", fr: "cheval", the: "le cheval", emoji: "🐴", home: "ferme" },
  { en: "chicken", fr: "poule", the: "la poule", emoji: "🐔", home: "ferme" },
  { en: "monkey", fr: "singe", the: "le singe", emoji: "🐒", home: "sauvage" },
  { en: "lion", fr: "lion", the: "le lion", emoji: "🦁", home: "sauvage" },
  { en: "elephant", fr: "éléphant", the: "l'éléphant", emoji: "🐘", home: "sauvage" },
];

/** Ceux qui vivent à la ferme et ceux qui vivent dans la nature : le chien, le chat, l'oiseau et le poisson n'entrent dans aucune des deux. */
const FARM = ANIMALS.filter((animal) => animal.home === "ferme");
const WILD = ANIMALS.filter((animal) => animal.home === "sauvage");

const ANIMAL_CONCEPT = "les animaux en anglais";

/** « Quel mot va avec ce dessin ? » : un animal dessiné. */
export function makeAnimalWord(ctx: GameContext): GeneratedGame {
  return drawingToWord("animal-mot", ctx, ANIMALS, ANIMAL_CONCEPT);
}

/** « Comment dit-on « le chien » en anglais ? » */
export function makeAnimalFrench(ctx: GameContext): GeneratedGame {
  return frenchToWord("animal-francais", ctx, ANIMALS, ANIMAL_CONCEPT);
}

/** Relier un animal dessiné à son mot, et aux deux derniers niveaux, une fois sur deux, un mot français à son mot anglais. */
export function makeAnimalLinks(ctx: GameContext): GeneratedGame {
  if (ctx.level >= 3 && ctx.rng() < 0.5) return frenchLinks("animal-relier", ctx, ANIMALS, ANIMAL_CONCEPT);
  return pictureLinks("animal-relier", ctx, ANIMALS, ANIMAL_CONCEPT);
}

/** « Glisse chaque mot dans la bonne case. » : les animaux de la ferme, ou les animaux sauvages. */
export function makeAnimalSort(ctx: GameContext): GeneratedGame {
  return sortWords("animal-glisser", ctx, ["Animaux de la ferme", "Animaux sauvages"], [FARM, WILD], ANIMAL_CONCEPT, [
    "Pense à l'endroit où vit chaque animal.",
    "À la ferme, on trouve des animaux qui donnent du lait, de la laine ou des œufs.",
    "Les animaux sauvages vivent en liberté, dans la nature, loin des maisons.",
  ]);
}

/** « Lequel vit à la ferme ? » ou « Lequel ne vit pas à la ferme ? » */
export function makeAnimalOdd(ctx: GameContext): GeneratedGame {
  return oddOneOut(
    "animal-intrus",
    ctx,
    {
      yes: FARM,
      no: WILD,
      positive: "Lequel vit à la ferme ?",
      negative: "Lequel ne vit pas à la ferme ?",
      hintYes: "À la ferme, on trouve des animaux qui donnent du lait, de la laine ou des œufs.",
      hintNo: "Un animal sauvage vit en liberté, dans la nature, loin des maisons.",
    },
    ANIMAL_CONCEPT,
  );
}

// ===========================================================================
// LES FRUITS (an-ci-fruits)
// ===========================================================================

/** La liste de la fiche : mango, banana, orange, apple, lemon, watermelon, pineapple. */
export const FRUITS: readonly Word[] = [
  { en: "mango", fr: "mangue", the: "la mangue", emoji: "🥭" },
  { en: "banana", fr: "banane", the: "la banane", emoji: "🍌" },
  { en: "orange", fr: "orange", the: "l'orange", emoji: "🍊" },
  { en: "apple", fr: "pomme", the: "la pomme", emoji: "🍎" },
  { en: "lemon", fr: "citron", the: "le citron", emoji: "🍋" },
  { en: "watermelon", fr: "pastèque", the: "la pastèque", emoji: "🍉" },
  { en: "pineapple", fr: "ananas", the: "l'ananas", emoji: "🍍" },
];

const FRUIT_CONCEPT = "les fruits en anglais";

/** « Quel mot va avec ce dessin ? » : un fruit dessiné. */
export function makeFruitWord(ctx: GameContext): GeneratedGame {
  return drawingToWord("fruit-mot", ctx, FRUITS, FRUIT_CONCEPT);
}

/** « Comment dit-on « la mangue » en anglais ? » */
export function makeFruitFrench(ctx: GameContext): GeneratedGame {
  return frenchToWord("fruit-francais", ctx, FRUITS, FRUIT_CONCEPT);
}

/** Relier un fruit dessiné à son mot, ou, aux deux derniers niveaux et une fois sur deux, un mot français à son mot anglais. */
export function makeFruitLinks(ctx: GameContext): GeneratedGame {
  if (ctx.level >= 3 && ctx.rng() < 0.5) return frenchLinks("fruit-relier", ctx, FRUITS, FRUIT_CONCEPT);
  return pictureLinks("fruit-relier", ctx, FRUITS, FRUIT_CONCEPT);
}

/** « Glisse chaque mot dans la bonne case. » : un fruit, ou un animal déjà vu. */
export function makeFruitSort(ctx: GameContext): GeneratedGame {
  return sortWords("fruit-glisser", ctx, ["Fruits", "Animaux"], [FRUITS, ANIMALS], FRUIT_CONCEPT, [
    "Regarde chaque mot, et son dessin quand il en a un.",
    "Un fruit pousse sur un arbre ou sur une plante, et on le mange.",
    "Un animal bouge tout seul : il marche, court, nage ou vole.",
  ]);
}

/** « Lequel est un fruit ? » ou « Lequel n'est pas un fruit ? » : un fruit et deux animaux, ou deux fruits et un animal. */
export function makeFruitOdd(ctx: GameContext): GeneratedGame {
  return oddOneOut(
    "fruit-intrus",
    ctx,
    {
      yes: FRUITS,
      no: ANIMALS,
      positive: "Lequel est un fruit ?",
      negative: "Lequel n'est pas un fruit ?",
      hintYes: "Un fruit pousse sur un arbre ou sur une plante, et on le mange.",
      hintNo: "Un animal bouge tout seul : il marche, court, nage ou vole.",
    },
    FRUIT_CONCEPT,
  );
}

// ===========================================================================
// LES COULEURS (an-ci-colours)
// ===========================================================================

type Thing = { the: string; emoji: string };

type Colour = Word & {
  /** Les couleurs qu'on confond avec elle : jamais proposées à côté d'elle comme mauvais choix. */
  near: readonly string[];
  /** Des choses dont cette couleur est LA couleur, sans doute possible. */
  things: readonly Thing[];
};

/** La liste de la fiche : red, blue, yellow, green, orange, black, white, pink, brown, purple. */
export const COLOURS: readonly Colour[] = [
  { en: "red", fr: "rouge", the: "la couleur rouge", emoji: "🔴", near: ["orange", "pink", "brown", "purple"], things: [{ the: "la tomate", emoji: "🍅" }, { the: "la fraise", emoji: "🍓" }] },
  { en: "blue", fr: "bleu", the: "la couleur bleue", emoji: "🔵", near: ["purple", "green", "black"], things: [{ the: "la vague", emoji: "🌊" }] },
  { en: "yellow", fr: "jaune", the: "la couleur jaune", emoji: "💛", near: ["orange", "green", "brown", "white"], things: [{ the: "la banane", emoji: "🍌" }, { the: "le citron", emoji: "🍋" }, { the: "le tournesol", emoji: "🌻" }] },
  { en: "green", fr: "vert", the: "la couleur verte", emoji: "💚", near: ["yellow", "blue", "brown"], things: [{ the: "le concombre", emoji: "🥒" }, { the: "la grenouille", emoji: "🐸" }, { the: "la salade", emoji: "🥬" }] },
  { en: "orange", fr: "orange", the: "la couleur orange", emoji: "🧡", near: ["red", "yellow", "brown", "pink"], things: [{ the: "la carotte", emoji: "🥕" }, { the: "la citrouille", emoji: "🎃" }] },
  { en: "black", fr: "noir", the: "la couleur noire", emoji: "🖤", near: ["brown", "purple", "blue"], things: [] },
  { en: "white", fr: "blanc", the: "la couleur blanche", emoji: "⚪", near: ["yellow", "pink"], things: [{ the: "le lait", emoji: "🥛" }, { the: "la dent", emoji: "🦷" }, { the: "le bonhomme de neige", emoji: "⛄" }] },
  { en: "pink", fr: "rose", the: "la couleur rose", emoji: "💗", near: ["red", "purple", "white", "orange"], things: [{ the: "le cochon", emoji: "🐷" }, { the: "la fleur de cerisier", emoji: "🌸" }] },
  { en: "brown", fr: "marron", the: "la couleur marron", emoji: "🍫", near: ["orange", "red", "black", "yellow", "green"], things: [{ the: "l'ours", emoji: "🐻" }, { the: "la cacahuète", emoji: "🥜" }] },
  { en: "purple", fr: "violet", the: "la couleur violette", emoji: "💜", near: ["blue", "pink", "black", "red"], things: [{ the: "l'aubergine", emoji: "🍆" }] },
];

/** Les six couleurs du premier palier, puis les dix de la fiche. */
const BASIC_COLOURS = COLOURS.filter((colour) => ["red", "blue", "yellow", "green", "black", "white"].includes(colour.en));
const coloursOf = (level: number): readonly Colour[] => (level === 1 ? BASIC_COLOURS : COLOURS);

const COLOUR_CONCEPT = "les couleurs en anglais";

/** La bonne couleur et deux couleurs qui ne lui ressemblent pas, mélangées : les trois choix d'un QCM ou d'un trou. */
function threeColours(ctx: GameContext, answer: Colour, pool: readonly Colour[]): string[] {
  const far = pool.filter((colour) => colour.en !== answer.en && !answer.near.includes(colour.en) && !colour.near.includes(answer.en));
  return shuffle(
    ctx.rng,
    [answer, ...shuffle(ctx.rng, far).slice(0, 2)].map((colour) => colour.en),
  );
}

/** « De quelle couleur est ce dessin ? » : un rond, un cœur ou le chocolat, la couleur parmi trois mots. */
export function makeColourWord(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "couleur-mot", () => {
    const pool = coloursOf(ctx.level);
    const answer = freshWord(ctx, pool, COLOURS);
    const options = threeColours(ctx, answer, pool);
    return {
      type: "qcm",
      prompt: `De quelle couleur est ce dessin ?\n${answer.emoji}`,
      payload: { options, correctIndex: options.indexOf(answer.en), game: originOf("couleur-mot", ctx), concept: COLOUR_CONCEPT },
      answerKey: answer.en,
      hints: ["Regarde bien la couleur du dessin.", "Dis la couleur en français, puis cherche le mot anglais qui va avec.", firstLetterHint(answer)],
    };
  });
}

/** « De quelle couleur est la banane ? » : une chose dont la couleur ne fait aucun doute. */
export function makeColourThing(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "couleur-chose", () => {
    const pool = coloursOf(ctx.level);
    const answer = freshWord(
      ctx,
      pool.filter((colour) => colour.things.length > 0),
      COLOURS.filter((colour) => colour.things.length > 0),
    );
    const thing = pick(ctx.rng, answer.things);
    const options = threeColours(ctx, answer, pool);
    return {
      type: "qcm",
      prompt: `De quelle couleur est ${thing.the} ?\n${thing.emoji}`,
      payload: { options, correctIndex: options.indexOf(answer.en), game: originOf("couleur-chose", ctx), concept: COLOUR_CONCEPT },
      answerKey: answer.en,
      hints: ["Pense à cette chose, telle que tu la vois tous les jours.", "Dis la couleur en français, puis cherche le mot anglais qui va avec.", firstLetterHint(answer)],
    };
  });
}

/** « Comment dit-on « la couleur rouge » en anglais ? » */
export function makeColourFrench(ctx: GameContext): GeneratedGame {
  return frenchToWord("couleur-francais", ctx, coloursOf(ctx.level), COLOUR_CONCEPT);
}

/** « Relie chaque dessin à son mot. » : trois à cinq couleurs. */
export function makeColourLinks(ctx: GameContext): GeneratedGame {
  return pictureLinks("couleur-relier", ctx, coloursOf(ctx.level), COLOUR_CONCEPT);
}

/** « Glisse chaque dessin sous sa couleur. » : deux couleurs éloignées, deux ou trois choses de chacune. */
export function makeColourSort(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "couleur-glisser",
    () => {
      const sortable = coloursOf(ctx.level).filter((colour) => colour.things.length >= 2);
      const first = freshWord(ctx, sortable);
      const second = pick(
        ctx.rng,
        sortable.filter((colour) => colour.en !== first.en && !first.near.includes(colour.en) && !colour.near.includes(first.en)),
      );
      const perColour = ctx.level === 1 ? 2 : 3;
      const items = shuffle(ctx.rng, [
        ...shuffle(ctx.rng, first.things).slice(0, perColour).map((thing) => ({ text: thing.emoji, correctZone: first.en })),
        ...shuffle(ctx.rng, second.things).slice(0, perColour).map((thing) => ({ text: thing.emoji, correctZone: second.en })),
      ]);
      const zones = shuffle(ctx.rng, [first.en, second.en]);
      return {
        type: "drag-drop",
        prompt: "Glisse chaque dessin sous sa couleur.",
        payload: { zones, items, game: originOf("couleur-glisser", ctx), concept: COLOUR_CONCEPT },
        answerKey: items.map((item) => `${item.text} → ${item.correctZone}`).join(" ; "),
        hints: [
          "Regarde chaque dessin et dis sa couleur en français.",
          "Cherche ensuite le mot anglais de cette couleur.",
          "Commence par le dessin dont tu es le plus sûr.",
        ],
      };
    },
    (game) => JSON.stringify((game.payload.items as { text: string }[]).map((item) => item.text).sort()),
  );
}

/** « 💛 It is ___. » : la phrase de la fiche, le dessin en tête. */
export function makeColourSentence(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "couleur-phrase", () => {
    const pool = coloursOf(ctx.level);
    const answer = freshWord(ctx, pool, COLOURS);
    const options = threeColours(ctx, answer, pool);
    return {
      type: "fill-blank",
      prompt: "Regarde le dessin et complète la phrase.",
      payload: {
        text: `${answer.emoji} It is ___.`,
        blanks: [{ options, answer: answer.en }],
        game: originOf("couleur-phrase", ctx),
        concept: "dire la couleur d'un dessin en anglais",
      },
      answerKey: answer.en,
      hints: ["Regarde bien la couleur du dessin.", "Lis la phrase en anglais, puis cherche le mot qui dit la couleur.", firstLetterHint(answer)],
    };
  });
}

// ===========================================================================
// LES NOMBRES DE 0 À 10 (an-ci-numbers)
// ===========================================================================

const numberWord = (n: number) => NUMBER_WORDS[n] as string;

/** La première lettre d'un mot de nombre, comme indice. */
const numberLetterHint = (n: number) => firstLetterHint({ en: numberWord(n), fr: "", the: "" });

/** Les nombres d'un palier : de un à cinq, puis de zéro à huit, puis de zéro à dix. */
function numbersOf(level: number): number[] {
  if (level === 1) return range(5).map((i) => i + 1);
  if (level === 2) return range(9);
  return range(11);
}

/** Deux nombres de `among` proches de `n`, jamais `n` ni ceux de `except` : les erreurs d'un enfant qui hésite. */
function nearNumbers(ctx: GameContext, n: number, among: readonly number[], except: readonly number[] = []): number[] {
  const left = among.filter((m) => m !== n && !except.includes(m));
  const near = left.filter((m) => Math.abs(m - n) <= 3);
  const others = left.filter((m) => !near.includes(m));
  return [...shuffle(ctx.rng, near), ...shuffle(ctx.rng, others)].slice(0, 2);
}

/** Un nombre qui n'a pas encore servi dans ce palier, quel que soit le jeu. */
const freshNumber = (ctx: GameContext, among: readonly number[]): number => pickFresh(ctx, among, (n) => `compte:${n}`);

const NUMBER_CONCEPT = "compter jusqu'à dix en anglais";

/** L'indice qui aide à trouver le mot sans l'écrire : on compte en anglais jusqu'au nombre. */
const numberHint = (n: number) => (n === 0 ? "C'est le nombre de ce qu'il n'y a pas du tout." : "Compte en anglais depuis un jusqu'à ce nombre.");

/** « Quel mot va avec le chiffre 3 ? » */
export function makeCountWord(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "compte-mot", () => {
    const among = numbersOf(ctx.level);
    const n = freshNumber(ctx, among);
    const options = shuffle(ctx.rng, [n, ...nearNumbers(ctx, n, among)]).map(numberWord);
    return {
      type: "qcm",
      prompt: `Quel mot va avec le chiffre ${n} ?`,
      payload: { options, correctIndex: options.indexOf(numberWord(n)), game: originOf("compte-mot", ctx), concept: NUMBER_CONCEPT },
      answerKey: numberWord(n),
      hints: ["Dis le chiffre en français, puis cherche son mot anglais.", numberHint(n), numberLetterHint(n)],
    };
  });
}

/** « Complète avec le bon chiffre. » : « three = ___ » avec trois chiffres en choix. */
export function makeCountDigit(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "compte-chiffre", () => {
    const among = numbersOf(ctx.level);
    const n = freshNumber(ctx, among);
    const options = shuffle(ctx.rng, [n, ...nearNumbers(ctx, n, among)]).map(String);
    return {
      type: "fill-blank",
      prompt: "Complète avec le bon chiffre.",
      payload: { text: `${numberWord(n)} = ___`, blanks: [{ options, answer: String(n) }], game: originOf("compte-chiffre", ctx), concept: NUMBER_CONCEPT },
      answerKey: String(n),
      hints: ["Lis le mot anglais doucement.", numberHint(n), "Choisis le chiffre que ce mot dit."],
    };
  });
}

const COUNTABLES = ["🍎", "⚽", "⭐", "🐟", "🌸", "🥭"] as const;

/** Des dessins par rangées de cinq, sur deux lignes au plus : « 🍎🍎🍎🍎🍎 » puis « 🍎🍎🍎 ». */
const rowsOf = (emoji: string, count: number): string =>
  [emoji.repeat(Math.min(count, 5)), count > 5 ? emoji.repeat(count - 5) : ""].filter(Boolean).join("\n");

/** « Combien vois-tu de dessins ? Choisis le mot anglais. » : de un à dix dessins, le nombre à choisir en anglais. */
export function makeCountDrawings(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "compte-dessins", () => {
    const among = numbersOf(ctx.level).filter((m) => m > 0);
    const n = freshNumber(ctx, among);
    const emoji = pick(ctx.rng, COUNTABLES);
    const options = shuffle(ctx.rng, [n, ...nearNumbers(ctx, n, among)]).map(numberWord);
    return {
      type: "qcm",
      prompt: `Combien vois-tu de dessins ? Choisis le mot anglais.\n${rowsOf(emoji, n)}`,
      payload: { options, correctIndex: options.indexOf(numberWord(n)), game: originOf("compte-dessins", ctx), concept: NUMBER_CONCEPT },
      answerKey: numberWord(n),
      hints: ["Compte les dessins un par un, avec ton doigt.", "Dis le nombre en français, puis cherche son mot anglais.", numberLetterHint(n)],
    };
  });
}

/** « Relie chaque chiffre à son mot anglais. » : trois à cinq paires. */
export function makeCountLinks(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "compte-relier",
    () => {
      const among = numbersOf(ctx.level);
      const chosen = shuffle(ctx.rng, among).slice(0, pairsCount(ctx.level, among.length));
      const pairs = chosen.map((n) => ({ left: String(n), right: numberWord(n) }));
      return {
        type: "match",
        prompt: "Relie chaque chiffre à son mot anglais.",
        payload: { pairs, game: originOf("compte-relier", ctx), concept: NUMBER_CONCEPT },
        answerKey: pairs.map((pair) => `${pair.left} ~ ${pair.right}`).join(" ; "),
        hints: ["Lis les chiffres l'un après l'autre.", "Compte en anglais pour retrouver le mot de chaque chiffre.", "Commence par la paire dont tu es le plus sûr."],
      };
    },
    linkKey,
  );
}

/**
 * « Relie chaque groupe de dessins à son mot anglais. » : des dessins différents, des nombres différents, de un à cinq
 * dessins par groupe (une tuile de dix dessins déborde d'une colonne sur un téléphone).
 */
export function makeCountDrawingLinks(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "compte-relier-dessins",
    () => {
      const among = numbersOf(ctx.level).filter((m) => m > 0 && m <= 5);
      const counts = shuffle(ctx.rng, among).slice(0, pairsCount(ctx.level, among.length));
      const emojis = shuffle(ctx.rng, COUNTABLES);
      const pairs = counts.map((n, i) => ({ left: emojis[i].repeat(n), right: numberWord(n) }));
      return {
        type: "match",
        prompt: "Relie chaque groupe de dessins à son mot anglais.",
        payload: { pairs, game: originOf("compte-relier-dessins", ctx), concept: NUMBER_CONCEPT },
        answerKey: pairs.map((pair) => `${pair.left} ~ ${pair.right}`).join(" ; "),
        hints: ["Compte les dessins de chaque groupe, un par un.", "Dis le nombre en français, puis cherche son mot anglais.", "Commence par le groupe le plus petit."],
      };
    },
    linkKey,
  );
}

/** « Remets ces nombres dans l'ordre, du plus petit au plus grand. » : trois ou quatre mots. */
export function makeCountOrder(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "compte-ordre",
    () => {
      const chosen = shuffle(ctx.rng, numbersOf(ctx.level))
        .slice(0, ctx.level === 1 ? 3 : 4)
        .sort((a, b) => a - b);
      const sequence = chosen.map(numberWord);
      return {
        type: "order",
        prompt: "Remets ces nombres dans l'ordre, du plus petit au plus grand.",
        payload: { correctSequence: sequence, game: originOf("compte-ordre", ctx), concept: NUMBER_CONCEPT },
        answerKey: sequence.join(", "),
        hints: ["Dis chaque nombre en français, puis range-les.", "Cherche d'abord le nombre le plus petit.", "Place ensuite celui qui vient juste après, et ainsi de suite."],
      };
    },
    (game) => (game.payload.correctSequence as string[]).join(","),
  );
}

/** « Quel est le mot anglais du nombre qui vient juste après 4 ? » */
export function makeCountNext(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "compte-suivant", () => {
    const among = numbersOf(ctx.level);
    const n = pick(
      ctx.rng,
      among.filter((m) => m < among[among.length - 1]),
    );
    const answer = n + 1;
    const options = shuffle(ctx.rng, [answer, ...nearNumbers(ctx, answer, among, [n])]).map(numberWord);
    return {
      type: "qcm",
      prompt: `Quel est le mot anglais du nombre qui vient juste après ${n} ?`,
      payload: { options, correctIndex: options.indexOf(numberWord(answer)), game: originOf("compte-suivant", ctx), concept: NUMBER_CONCEPT },
      answerKey: numberWord(answer),
      hints: ["Compte en français jusqu'au nombre de la consigne.", "Le nombre cherché est celui que tu dis juste après.", numberLetterHint(answer)],
    };
  });
}

/**
 * « Complète la suite des nombres. » : « one, two, ___ » au premier palier (cinq nombres seulement : avec trois
 * nombres montrés il ne resterait qu'un mauvais choix), « one, two, three, ___ » ensuite, et plus loin une suite qui descend.
 */
export function makeCountSeries(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "compte-suite", () => {
    const among = numbersOf(ctx.level);
    const length = ctx.level === 1 ? 2 : 3;
    const descending = ctx.level >= 3 && ctx.rng() < 0.5;
    const first = descending
      ? pick(
          ctx.rng,
          among.filter((m) => m - length >= among[0]),
        )
      : pick(
          ctx.rng,
          among.filter((m) => m + length <= among[among.length - 1]),
        );
    const step = descending ? -1 : 1;
    const shown = range(length).map((i) => first + i * step);
    const answer = first + length * step;
    const options = shuffle(ctx.rng, [answer, ...nearNumbers(ctx, answer, among, shown)]).map(numberWord);
    return {
      type: "fill-blank",
      prompt: "Complète la suite des nombres.",
      payload: {
        text: `${shown.map(numberWord).join(", ")}, ___`,
        blanks: [{ options, answer: numberWord(answer) }],
        game: originOf("compte-suite", ctx),
        concept: NUMBER_CONCEPT,
      },
      answerKey: numberWord(answer),
      hints: [
        "Dis les nombres de la suite à voix haute.",
        descending ? "Chaque nombre est le précédent moins un." : "Chaque nombre est le précédent plus un.",
        numberLetterHint(answer),
      ],
    };
  });
}

/** « Glisse chaque nombre dans la bonne case. » : moins ou plus qu'un nombre de repère, jamais le repère. */
export function makeCountSort(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "compte-glisser",
    () => {
      const among = numbersOf(ctx.level);
      // Au premier palier, cinq nombres seulement : le repère laisse au moins un nombre de chaque côté. Ensuite, au moins deux.
      const margin = ctx.level === 1 ? 1 : 2;
      const mark = randomInt(ctx.rng, among[0] + margin, among[among.length - 1] - margin);
      const total = ctx.level === 1 ? 4 : ctx.level === 2 ? 5 : 6;
      const below = shuffle(
        ctx.rng,
        among.filter((n) => n < mark),
      );
      const above = shuffle(
        ctx.rng,
        among.filter((n) => n > mark),
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
        payload: { zones, items, game: originOf("compte-glisser", ctx), concept: NUMBER_CONCEPT },
        answerKey: items.map((item) => `${item.text} → ${item.correctZone}`).join(" ; "),
        hints: ["Dis chaque nombre en français.", `Compare-le au nombre ${mark}.`, `Un nombre qui vient avant ${mark} va dans la case du moins.`],
      };
    },
    (game) => String(game.prompt) + JSON.stringify((game.payload.items as { text: string }[]).map((item) => item.text).sort()),
  );
}

// ===========================================================================
// SALUER ET SE PRÉSENTER (an-ci-hello)
// ===========================================================================

type Saying = Word & {
  /** À quel moment on le dit, sans l'écrire : l'indice qui explique sans donner. */
  clue: string;
};

/**
 * Les mots de la fiche qui ont UN seul sens en français, sans jumeau : « hello » (pas « hi », qui dit la même chose),
 * « goodbye » (pas « bye »), « good night ». « good morning » n'y est pas : « bonjour » le dit aussi.
 */
export const SAYINGS: readonly Saying[] = [
  { en: "hello", fr: "bonjour", the: "bonjour", clue: "On le dit en arrivant, quand on voit quelqu'un." },
  { en: "goodbye", fr: "au revoir", the: "au revoir", clue: "On le dit en partant, quand on quitte quelqu'un." },
  { en: "thank you", fr: "merci", the: "merci", clue: "On le dit pour remercier quelqu'un qui donne ou qui aide." },
  { en: "sorry", fr: "pardon", the: "pardon", emoji: "😔", clue: "On le dit pour s'excuser, quand on a fait de la peine." },
  { en: "please", fr: "s'il te plaît", the: "s'il te plaît", clue: "On le dit pour demander quelque chose poliment." },
  { en: "yes", fr: "oui", the: "oui", emoji: "👍", clue: "On le dit pour accepter, quand on est d'accord." },
  { en: "no", fr: "non", the: "non", emoji: "👎", clue: "On le dit pour refuser, quand on n'est pas d'accord." },
  { en: "good night", fr: "bonne nuit", the: "bonne nuit", emoji: "🌙", clue: "On le dit le soir, avant de dormir." },
];

/** Les mots que montre un dessin sûr : le lever du soleil, la lune, le pouce levé, le pouce baissé, le visage triste. */
const PICTURED: readonly Word[] = [
  { en: "good morning", fr: "bonjour le matin", the: "bonjour le matin", emoji: "🌅" },
  { en: "good night", fr: "bonne nuit", the: "bonne nuit", emoji: "🌙" },
  { en: "yes", fr: "oui", the: "oui", emoji: "👍" },
  { en: "no", fr: "non", the: "non", emoji: "👎" },
  { en: "sorry", fr: "pardon", the: "pardon", emoji: "😔" },
];

/** Les mots pour dire bonjour et ceux pour dire au revoir : « good night » ne va dans aucune case. */
const HELLO_WORDS: readonly Word[] = [
  { en: "hello", fr: "bonjour", the: "bonjour" },
  { en: "hi", fr: "salut", the: "salut" },
  { en: "good morning", fr: "bonjour le matin", the: "bonjour le matin" },
];
const GOODBYE_WORDS: readonly Word[] = [
  { en: "goodbye", fr: "au revoir", the: "au revoir" },
  { en: "bye", fr: "salut", the: "salut" },
];

const HELLO_CONCEPT = "saluer en anglais";

/** Les situations de la vie de l'école, avec LE mot qui va, en français : « Tu arrives à l'école. » */
type Situation = { text: string; answer: string; except?: readonly string[] };

const SITUATIONS: readonly Situation[] = [
  { text: "Tu arrives à l'école.", answer: "hello" },
  { text: "Ton oncle arrive chez toi.", answer: "hello" },
  { text: "Tu pars de l'école.", answer: "goodbye" },
  { text: "Ton ami s'en va.", answer: "goodbye" },
  { text: "On te donne un cadeau.", answer: "thank you" },
  { text: "Ta tante te donne une mangue.", answer: "thank you" },
  { text: "Tu marches sur le pied de ton ami.", answer: "sorry" },
  { text: "Tu bouscules ton ami sans le vouloir.", answer: "sorry" },
  { text: "Tu demandes du pain poliment.", answer: "please" },
  { text: "Tu vas te coucher.", answer: "good night" },
  // Un oui ou un non : « no, thank you » et « yes, please » sont polis, donc ces deux mots n'entrent pas dans les choix.
  { text: "Ton ami te propose un jeu que tu acceptes.", answer: "yes", except: ["please", "thank you"] },
  { text: "Ton ami te propose un jeu que tu refuses.", answer: "no", except: ["please", "thank you"] },
];

/** « Comment dit-on « merci » en anglais ? » */
export function makeSayingFrench(ctx: GameContext): GeneratedGame {
  return frenchToWord("salut-francais", ctx, SAYINGS, HELLO_CONCEPT);
}

/** « Quel mot va avec ce dessin ? » : le lever du soleil, la lune, un pouce, un visage triste. */
export function makeSayingDrawing(ctx: GameContext): GeneratedGame {
  return drawingToWord("salut-dessin", ctx, PICTURED, HELLO_CONCEPT);
}

/** « Tu arrives à l'école. Que dis-tu en anglais ? » : la situation donne LE mot, deux autres mots sont faux. */
export function makeSayingSituation(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "salut-situation", () => {
    const situation = pickFresh(ctx, SITUATIONS, (s) => `salut:${s.text}`);
    const answer = SAYINGS.find((saying) => saying.en === situation.answer) as Saying;
    const wrong = shuffle(
      ctx.rng,
      SAYINGS.filter((saying) => saying.en !== answer.en && !(situation.except ?? []).includes(saying.en)),
    ).slice(0, 2);
    const options = shuffle(
      ctx.rng,
      [answer, ...wrong].map((saying) => saying.en),
    );
    return {
      type: "qcm",
      prompt: `${situation.text} Que dis-tu en anglais ?`,
      payload: { options, correctIndex: options.indexOf(answer.en), game: originOf("salut-situation", ctx), concept: HELLO_CONCEPT },
      answerKey: answer.en,
      hints: ["Pense à ce que tu dirais dans cette situation.", answer.clue, "Écarte les mots anglais qui ne vont pas avec la situation."],
    };
  });
}

/** Relier un dessin à son mot, ou, aux deux derniers niveaux, un mot français à son mot anglais. */
export function makeSayingLinks(ctx: GameContext): GeneratedGame {
  if (ctx.level <= 2) return pictureLinks("salut-relier", ctx, PICTURED, HELLO_CONCEPT);
  return frenchLinks("salut-relier", ctx, SAYINGS, HELLO_CONCEPT);
}

/** « Glisse chaque mot dans la bonne case. » : pour dire bonjour, ou pour dire au revoir. */
export function makeSayingSort(ctx: GameContext): GeneratedGame {
  return sortWords("salut-glisser", ctx, ["Pour dire bonjour", "Pour dire au revoir"], [HELLO_WORDS, GOODBYE_WORDS], HELLO_CONCEPT, [
    "Pense à ce que tu dis en arrivant, et à ce que tu dis en partant.",
    "Un mot qui se dit au début d'une rencontre va avec bonjour, un mot qui se dit à la fin va avec au revoir.",
    "Lis chaque mot et pense à quand on le dit.",
  ]);
}

const NAMES = ["Awa", "Modou", "Fatou", "Cheikh", "Aminata", "Ibrahima"] as const;

/** « I am Awa. » ou « My name is Modou. » remis dans l'ordre. */
export function makeIntroduceOrder(ctx: GameContext): GeneratedGame {
  return sentenceOrder(
    "salut-prenom",
    ctx,
    () => {
      const name = pickFresh(ctx, NAMES, (n) => `prenom:${n}`);
      return ctx.level === 1 || ctx.rng() < 0.5 ? ["I", "am", `${name}.`] : ["My", "name", "is", `${name}.`];
    },
    "se présenter en anglais",
  );
}

/** « My ___ is Awa. » : trois mots en choix, un seul fait une phrase. */
export function makeIntroduceGap(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "salut-trou", () => {
    const name = pickFresh(ctx, NAMES, (n) => `prenom:${n}`);
    const wrong = shuffle(ctx.rng, ["hello", "sorry", "please", "yes", "no", "goodbye"]).slice(0, 2);
    const options = shuffle(ctx.rng, ["name", ...wrong]);
    return {
      type: "fill-blank",
      prompt: "Complète la phrase pour te présenter.",
      payload: { text: `My ___ is ${name}.`, blanks: [{ options, answer: "name" }], game: originOf("salut-trou", ctx), concept: "se présenter en anglais" },
      answerKey: "name",
      hints: ["Lis la phrase en anglais, doucement.", "Pense à ce qu'on dit pour donner son prénom.", "Le mot commence par la lettre n."],
    };
  });
}

/** « 🌙 Good ___! » : le dessin dit le moment, le lever du soleil ou la lune. */
export function makeGoodGap(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "salut-trou-dessin", () => {
    const morning = ctx.rng() < 0.5;
    const answer = morning ? "morning" : "night";
    const options = shuffle(ctx.rng, ["morning", "night", pick(ctx.rng, ["please", "yes", "sorry", "no"])]);
    return {
      type: "fill-blank",
      prompt: "Regarde le dessin et complète la phrase.",
      payload: { text: `${morning ? "🌅" : "🌙"} Good ___!`, blanks: [{ options, answer }], game: originOf("salut-trou-dessin", ctx), concept: HELLO_CONCEPT },
      answerKey: answer,
      hints: [
        "Regarde bien le dessin.",
        morning ? "Le soleil se lève : à quel moment de la journée est-ce ?" : "La lune brille : à quel moment de la journée est-ce ?",
        `Le mot commence par la lettre ${answer[0]}.`,
      ],
    };
  });
}

/** « Mets les paroles dans l'ordre de la rencontre. » : saluer, se présenter, prendre congé. */
export function makeMeetingOrder(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "salut-rencontre",
    () => {
      const name = pickFresh(ctx, NAMES, (n) => `prenom:${n}`);
      const sequence = ["Hello!", `I am ${name}.`, "Goodbye!"];
      return {
        type: "order",
        prompt: "Mets les paroles dans l'ordre de la rencontre.",
        payload: { correctSequence: sequence, game: originOf("salut-rencontre", ctx), concept: "l'ordre d'une rencontre : saluer, se présenter, prendre congé" },
        answerKey: sequence.join(" "),
        hints: [
          "Pense à ce qu'on dit en premier quand on rencontre quelqu'un.",
          "On dit son prénom après avoir salué.",
          "On prend congé à la fin, quand on s'en va.",
        ],
      };
    },
    (game) => String(game.answerKey),
  );
}
