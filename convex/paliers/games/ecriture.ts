/**
 * LES GABARITS D'ÉCRITURE DU CP : remettre les mots d'une phrase dans l'ordre, la majuscule et le point,
 * « un », « une », « des », « le », « la », « les », le singulier et le pluriel du nom, le bon mot dans une
 * phrase (`fr-cp-ecrire`).
 *
 * Le modèle écrivait « Associe les mots à leur catégorie » avec « Kaolack » parmi des fruits, « Écris une
 * phrase avec Mariama et le lait caillé » (plusieurs phrases justes, une seule acceptée), « Remets les
 * phrases dans le bon ordre » sans rien qui dise lequel vient d'abord : des exercices qui n'apprennent pas
 * à écrire. Ici chaque phrase vient d'un petit tableau (un prénom, un verbe, un objet), l'accord se lit
 * dans le genre du nom (`genders.ts`), et chaque exercice n'a qu'une bonne réponse.
 *
 * CE QUE LA FICHE DONNE, ET CE QUE CE FICHIER N'INVENTE PAS
 * - La phrase simple : un sujet, un verbe, un complément (« Awa mange une mangue. »), avec sa majuscule et
 *   son point. Trois phrases font une petite histoire : la deuxième et la troisième reprennent le prénom par « Il » ou « Elle ».
 * - Le singulier et le pluriel du nom, avec « un », « une », « des », « le », « la », « les ». Les noms de
 *   la liste font tous leur pluriel avec un « s » ; aucun « eau », « al », « ou » n'y est.
 * - Pas de leçon de règle, pas d'accord du verbe, pas de conjugaison : la fiche les écarte.
 *
 * COMMENT UNE PHRASE N'A QU'UNE BONNE FAÇON DE S'ÉCRIRE
 * - Un exercice « remets les mots dans l'ordre » donne le premier mot avec sa majuscule et le dernier avec
 *   son point : sujet, verbe, article, nom. Aucun autre ordre n'est une phrase.
 * - Trois phrases ne se rangent que dans un ordre : celles qui commencent par « Il » ou « Elle » reprennent
 *   un prénom déjà dit, elles ne peuvent pas commencer l'histoire, et on rentre chez soi à la fin.
 * - Le mot d'un trou est le seul de ses trois choix qui va avec la phrase : mêmes genre et même nombre, une
 *   seule catégorie qui convient (on mange une mangue, on ne mange pas une robe).
 *
 * RÈGLES POUR AJOUTER UN NOM
 * - Son genre est celui de `genders.ts`, sans variante. Son pluriel est son nom suivi de « s ».
 * - Une étiquette est un mot SEUL, sans article. Les phrases entières restent des phrases : au CI, une tuile
 *   « article + un nom » doit avoir son image au catalogue (`lib/item-images.ts`) et les pluriels n'en
 *   ont presque pas. Les trous (`fill-blank`) n'ont pas cette règle ; les QCM, ordres, appariements et
 *   glissés l'ont.
 * - Les énoncés n'ont aucun « : » (l'écran coupe une consigne sur le deux-points), au plus une apostrophe
 *   droite, et vingt-huit mots au plus (la consigne du CP). Aucun indice n'écrit un mot de la réponse.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { genderOf } from "../genders";
import { fresh, originOf, pick, pickFresh, randomInt, shuffle, type GameContext, type GeneratedGame } from "./shared";

// ===========================================================================
// LES PRÉNOMS, LES NOMS ET LES PHRASES
// ===========================================================================

type Person = { name: string; pronoun: "Il" | "Elle" };

/** Les prénoms des petites phrases : sans apostrophe. */
const PEOPLE: readonly Person[] = [
  { name: "Awa", pronoun: "Elle" },
  { name: "Fatou", pronoun: "Elle" },
  { name: "Aminata", pronoun: "Elle" },
  { name: "Moussa", pronoun: "Il" },
  { name: "Cheikh", pronoun: "Il" },
  { name: "Modou", pronoun: "Il" },
];

type Noun = {
  noun: string;
  /** Son dessin, quand un émoji sûr (Unicode 11 au plus, sans U+FE0F) le montre. */
  emoji?: string;
};

/** Les noms qui font leur pluriel avec un « s ». Leur genre est lu dans `genders.ts`. */
export const NOUNS: readonly Noun[] = [
  { noun: "ballon", emoji: "⚽" },
  { noun: "chat", emoji: "🐱" },
  { noun: "chien", emoji: "🐶" },
  { noun: "livre", emoji: "📖" },
  { noun: "cahier", emoji: "📒" },
  { noun: "mouton", emoji: "🐑" },
  { noun: "cartable", emoji: "🎒" },
  { noun: "crayon" },
  { noun: "stylo" },
  { noun: "mangue", emoji: "🥭" },
  { noun: "banane", emoji: "🍌" },
  { noun: "orange", emoji: "🍊" },
  { noun: "poule", emoji: "🐔" },
  { noun: "pomme", emoji: "🍎" },
  { noun: "vache", emoji: "🐄" },
  { noun: "fleur", emoji: "🌸" },
  { noun: "robe", emoji: "👗" },
  { noun: "table" },
  { noun: "chaise" },
  { noun: "maison", emoji: "🏠" },
];

const DRAWN_NOUNS = NOUNS.filter((entry) => entry.emoji);
const isFeminine = (noun: string) => genderOf(noun) === "f";
const plural = (noun: string) => `${noun}s`;
/** « un » ou « une » : l'article du nom au singulier. */
const indefinite = (noun: string) => (isFeminine(noun) ? "une" : "un");
/** « le » ou « la » : l'article défini du nom au singulier. */
const definite = (noun: string) => (isFeminine(noun) ? "la" : "le");

/** Une phrase simple : un verbe et ce qu'il prend, un article et un nom. Les objets sont ceux que le verbe accepte. */
const SENTENCES: readonly { verb: string; objects: readonly string[] }[] = [
  { verb: "mange", objects: ["mangue", "banane", "orange", "pomme"] },
  { verb: "porte", objects: ["robe", "cartable"] },
  { verb: "lit", objects: ["livre", "cahier"] },
  { verb: "a", objects: ["ballon", "chat", "chien", "poule"] },
  { verb: "voit", objects: ["mouton", "vache", "chat"] },
];

/** De courtes phrases d'animaux : un article, un nom, un verbe. Le verbe est celui de l'animal. */
const ANIMAL_SENTENCES: readonly (readonly [string, string, string])[] = [
  ["Le", "chat", "dort."],
  ["Le", "chien", "court."],
  ["La", "poule", "mange."],
  ["La", "vache", "mange."],
  ["Le", "mouton", "dort."],
  ["Le", "lapin", "saute."],
];

type Simple = { person: Person; verb: string; noun: string };

/** Une phrase simple tirée au hasard, que le palier n'a pas encore prise. */
function drawSimple(ctx: GameContext): Simple {
  const person = pick(ctx.rng, PEOPLE);
  const pattern = pick(ctx.rng, SENTENCES);
  const noun = pickFresh(ctx, pattern.objects, (candidate) => `ecrire:${candidate}`);
  return { person, verb: pattern.verb, noun };
}

const simpleText = (sentence: Simple) => `${sentence.person.name} ${sentence.verb} ${indefinite(sentence.noun)} ${sentence.noun}.`;

// ===========================================================================
// LES MOTS D'UNE PHRASE
// ===========================================================================

/** « Remets les mots dans l'ordre pour écrire une phrase. » : majuscule au premier mot, point au dernier. */
export function makeWriteOrder(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "ecrire-ordre",
    () => {
      let tiles: string[];
      if (ctx.level === 1 && ctx.rng() < 0.4) {
        tiles = [...pick(ctx.rng, ANIMAL_SENTENCES)];
      } else {
        const sentence = drawSimple(ctx);
        const subject = ctx.level === 1 ? sentence.person.pronoun : sentence.person.name;
        tiles = [subject, sentence.verb, indefinite(sentence.noun), `${sentence.noun}.`];
      }
      return {
        type: "order",
        prompt: "Remets les mots dans l'ordre pour écrire une phrase.",
        payload: { correctSequence: tiles, game: originOf("ecrire-ordre", ctx), concept: "ordonner les mots d'une phrase" },
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

/** « Quelle phrase est bien écrite ? » : la bonne, celle sans majuscule, celle sans point. */
export function makeWriteWellWritten(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "ecrire-bien-ecrite", () => {
    const sentence = drawSimple(ctx);
    const correct = simpleText(sentence);
    const noCapital = `${correct[0].toLowerCase()}${correct.slice(1)}`;
    const noPoint = correct.slice(0, -1);
    const options = shuffle(ctx.rng, [correct, noCapital, noPoint]);
    return {
      type: "qcm",
      prompt: "Quelle phrase est bien écrite ?",
      payload: {
        options,
        correctIndex: options.indexOf(correct),
        game: originOf("ecrire-bien-ecrite", ctx),
        concept: "la majuscule et le point",
      },
      answerKey: correct,
      hints: [
        "Une phrase commence par une majuscule.",
        "Une phrase finit par un point.",
        "Regarde le début et la fin de chaque phrase.",
      ],
    };
  });
}

// ===========================================================================
// UN, UNE, DES, LE, LA, LES
// ===========================================================================

/** « Complète la phrase avec le bon mot. » : « Awa a ___ chat. » avec un, une, des. */
export function makeWriteArticle(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "ecrire-un-des",
    () => {
      const noun = pickFresh(ctx, NOUNS, (entry) => `ecrire-nom:${entry.noun}`).noun;
      const many = ctx.level >= 2 && ctx.rng() < 0.5;
      // Les articles définis se choisissent devant une consonne : « l'orange » ne se complète pas par un mot.
      const useDefinite = ctx.level >= 2 && ctx.rng() < 0.5 && !/^[aeiouyéèêh]/u.test(noun);
      const person = pick(ctx.rng, PEOPLE);
      let text: string;
      let answer: string;
      let options: string[];
      if (useDefinite) {
        text = `Voici ___ ${many ? plural(noun) : noun}.`;
        answer = many ? "les" : definite(noun);
        options = ["le", "la", "les"];
      } else {
        text = `${person.name} a ___ ${many ? plural(noun) : noun}.`;
        answer = many ? "des" : indefinite(noun);
        options = ["un", "une", "des"];
      }
      return {
        type: "fill-blank",
        prompt: "Complète la phrase avec le bon mot.",
        payload: {
          text,
          blanks: [{ options: shuffle(ctx.rng, options), answer }],
          game: originOf("ecrire-un-des", ctx),
          concept: "un, une, des, le, la, les",
        },
        answerKey: answer,
        hints: [
          "Regarde la fin du nom, un s veut dire qu'il y en a plusieurs.",
          "Un nom qui va avec « une » ou « la » est féminin, avec « un » ou « le » il est masculin.",
          "Lis la phrase à voix basse avec chaque mot pour entendre le bon.",
        ],
      };
    },
    (game) => String(game.payload.text),
  );
}

/**
 * « Regarde le dessin et complète la phrase. » : « Il y a ___ pommes. » sous des pommes dessinées. Le premier dessin
 * d'un palier montre plusieurs choses, le suivant une seule : l'enfant oppose « des » à « un » ou « une ». Sans cela,
 * le hasard donnait six dessins au pluriel sur six, et « des » se devinait sans regarder.
 */
export function makeWriteCount(ctx: GameContext): GeneratedGame {
  const marker = "ecrire-groupe:plusieurs-servi";
  const several = !ctx.used.has(marker);
  const game = fresh(
    ctx,
    "ecrire-groupe",
    () => {
      const entry = pickFresh(ctx, DRAWN_NOUNS, (candidate) => `ecrire-nom:${candidate.noun}`);
      const count = several ? randomInt(ctx.rng, 2, ctx.level === 1 ? 3 : 5) : 1;
      const answer = several ? "des" : indefinite(entry.noun);
      return {
        type: "fill-blank",
        prompt: `Regarde le dessin et complète la phrase.\n${(entry.emoji as string).repeat(count)}`,
        payload: {
          text: `Il y a ___ ${several ? plural(entry.noun) : entry.noun}.`,
          blanks: [{ options: shuffle(ctx.rng, ["un", "une", "des"]), answer }],
          game: originOf("ecrire-groupe", ctx),
          concept: "un ou plusieurs",
        },
        answerKey: answer,
        hints: [
          "Compte les dessins, un par un.",
          "S'il y en a un seul, on dit un ou une. S'il y en a plusieurs, on dit des.",
          "Regarde aussi le nom, un s à la fin veut dire plusieurs.",
        ],
      };
    },
    (game) => String(game.payload.text) + String(game.prompt),
  );
  ctx.used.add(marker);
  return game;
}

/** « Relie chaque nom au singulier à son pluriel. » : trois à cinq paires, le pluriel est le nom suivi d'un s. */
export function makeWritePluralLinks(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "ecrire-pluriel",
    () => {
      const count = ctx.level === 1 ? 3 : ctx.level === 2 ? 4 : 5;
      const chosen = shuffle(ctx.rng, NOUNS).slice(0, count);
      const pairs = chosen.map((entry) => ({ left: entry.noun, right: plural(entry.noun) }));
      return {
        type: "match",
        prompt: "Relie chaque nom au singulier à son pluriel.",
        payload: { pairs, game: originOf("ecrire-pluriel", ctx), concept: "le pluriel du nom" },
        answerKey: pairs.map((pair) => `${pair.left} ~ ${pair.right}`).join(" ; "),
        hints: [
          "Le pluriel dit qu'il y en a plusieurs.",
          "Pour dire plusieurs, on ajoute une lettre à la fin du nom.",
          "Commence par la paire dont tu es le plus sûr.",
        ],
      };
    },
    (game) =>
      (game.payload.pairs as { left: string }[])
        .map((pair) => pair.left)
        .sort()
        .join(","),
  );
}

/** « Glisse chaque mot dans la bonne case. » : le singulier, ou le pluriel. */
export function makeWriteNumberSort(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "ecrire-nombre",
    () => {
      const total = ctx.level === 1 ? 4 : ctx.level === 2 ? 5 : 6;
      const chosen = shuffle(ctx.rng, NOUNS).slice(0, total);
      const manyCount = Math.floor(total / 2) + randomInt(ctx.rng, 0, 1);
      const zones = ["Singulier", "Pluriel"];
      const items = shuffle(
        ctx.rng,
        chosen.map((entry, i) =>
          i < manyCount ? { text: plural(entry.noun), correctZone: zones[1] } : { text: entry.noun, correctZone: zones[0] },
        ),
      );
      return {
        type: "drag-drop",
        prompt: "Glisse chaque mot dans la bonne case.",
        payload: { zones, items, game: originOf("ecrire-nombre", ctx), concept: "le singulier et le pluriel" },
        answerKey: items.map((item) => `${item.text} → ${item.correctZone}`).join(" ; "),
        hints: [
          "Le singulier parle d'un seul, le pluriel parle de plusieurs.",
          "Regarde la fin de chaque mot, un s veut dire plusieurs.",
          "Un mot sans s à la fin parle d'un seul.",
        ],
      };
    },
    (game) => JSON.stringify((game.payload.items as { text: string }[]).map((item) => item.text).sort()),
  );
}

// ===========================================================================
// DEUX PHRASES : UN PETIT TEXTE
// ===========================================================================

/**
 * Où l'on va, ce qu'on y fait, puis le retour. Trois phrases, dans l'ordre de l'histoire : on arrive d'abord,
 * on fait ce qu'on est venu faire, on rentre à la fin. Ce qu'on fait va avec le lieu.
 */
const OUTINGS: readonly { first: string; then: readonly string[] }[] = [
  { first: "va au marché.", then: ["achète une mangue.", "achète une banane.", "achète du riz."] },
  { first: "va à l'école.", then: ["lit un livre.", "prend un cahier.", "écrit avec un crayon."] },
  { first: "va au jardin.", then: ["cueille une fleur.", "mange une pomme.", "cueille une orange."] },
];

/** « Remets les phrases dans l'ordre de la petite histoire. » : on arrive, on fait, on rentre. */
export function makeWriteText(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "ecrire-texte",
    () => {
      const person = pick(ctx.rng, PEOPLE);
      const outing = pick(ctx.rng, OUTINGS);
      const then = pick(ctx.rng, outing.then);
      const sequence = [`${person.name} ${outing.first}`, `${person.pronoun} ${then}`, `${person.pronoun} rentre à la maison.`];
      return {
        type: "order",
        prompt: "Remets les phrases dans l'ordre de la petite histoire.",
        payload: { correctSequence: sequence, game: originOf("ecrire-texte", ctx), concept: "ordonner les phrases d'une histoire" },
        answerKey: sequence.join(" "),
        hints: [
          "Une histoire commence par dire qui est la personne et où va cette personne.",
          "Un petit mot reprend le prénom pour ne pas le répéter, il ne peut pas venir en premier.",
          "Dans une histoire, on arrive d'abord, on fait quelque chose, puis on revient.",
        ],
      };
    },
    (game) => String(game.answerKey),
  );
}

// ===========================================================================
// LE BON MOT DANS UNE PHRASE
// ===========================================================================

const FOOD = ["mangue", "banane", "orange", "pomme", "carotte", "tomate", "melon", "citron", "ananas", "avocat", "gâteau", "oignon"] as const;
const CLOTHES = ["robe", "jupe", "chemise", "veste", "casquette", "pantalon", "chapeau", "boubou", "pagne", "foulard"] as const;
const SCHOOL = ["livre", "cahier", "crayon", "stylo", "cartable", "table", "chaise", "ardoise", "gomme", "règle", "trousse"] as const;
/** Ce que chaque animal crie : un cri par animal, jamais deux animaux pour le même cri. */
const ANIMAL_CRIES: readonly (readonly [string, string])[] = [
  ["chat", "miaou"],
  ["chien", "ouaf"],
  ["âne", "hi-han"],
  ["coq", "cocorico"],
  ["poule", "cot cot"],
  ["vache", "meuh"],
  ["chèvre", "bê"],
];
const ANIMALS = ANIMAL_CRIES.map(([animal]) => animal);

type Gap = { text: string; answer: string; wrong: string[]; hint: string };

/** Les mots de `pool` qui ont le genre de `word`, sauf `word` : les mauvais choix s'accordent avec l'article de la phrase. */
const sameGender = (word: string, pool: readonly string[]) => pool.filter((other) => other !== word && genderOf(other) === genderOf(word));

type Frame = (ctx: GameContext) => Gap;

/** Les cadres d'un trou : on mange, on met, un animal crie, on s'assoit. Un seul des trois mots y va. */
const FRAMES: readonly Frame[] = [
  (ctx) => {
    const answer = pick(ctx.rng, FOOD);
    return {
      text: `On mange ${indefinite(answer)} ___.`,
      answer,
      wrong: shuffle(ctx.rng, sameGender(answer, [...CLOTHES, ...SCHOOL])).slice(0, 2),
      hint: "Pense à ce que tu peux manger.",
    };
  },
  (ctx) => {
    const answer = pick(ctx.rng, CLOTHES);
    return {
      text: `Je mets ${indefinite(answer)} ___ pour aller à l'école.`,
      answer,
      wrong: shuffle(ctx.rng, sameGender(answer, [...FOOD, ...ANIMALS])).slice(0, 2),
      hint: "Pense à ce que tu portes pour t'habiller.",
    };
  },
  (ctx) => {
    const [answer, cry] = pick(ctx.rng, ANIMAL_CRIES);
    return {
      text: `${cap(definite(answer))} ___ dit ${cry}.`,
      answer,
      wrong: shuffle(ctx.rng, sameGender(answer, ANIMALS)).slice(0, 2),
      hint: "Pense à l'animal qui fait ce bruit.",
    };
  },
  (ctx) => {
    const answer = pick(ctx.rng, ["chaise", "banc"]);
    return {
      text: `On s'assoit sur ${indefinite(answer)} ___.`,
      answer,
      wrong: shuffle(ctx.rng, sameGender(answer, FOOD)).slice(0, 2),
      hint: "Pense à ce qui sert à s'asseoir.",
    };
  },
];

const cap = (text: string) => `${text[0].toUpperCase()}${text.slice(1)}`;

/** « Complète la phrase avec le bon mot. » : trois mots du même genre, un seul va avec la phrase. */
export function makeWriteWord(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "ecrire-mot",
    () => {
      const gap = pick(ctx.rng, FRAMES)(ctx);
      return {
        type: "fill-blank",
        prompt: "Complète la phrase avec le bon mot.",
        payload: {
          text: gap.text,
          blanks: [{ options: shuffle(ctx.rng, [gap.answer, ...gap.wrong]), answer: gap.answer }],
          game: originOf("ecrire-mot", ctx),
          concept: "choisir le mot qui va avec la phrase",
        },
        answerKey: gap.answer,
        hints: ["Lis la phrase en entier, doucement.", gap.hint, "Essaie chaque mot dans la phrase et garde celui qui est vrai."],
      };
    },
    (game) => String(game.payload.text),
  );
}
