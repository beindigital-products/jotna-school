/**
 * LES GABARITS DES PREMIÈRES PHRASES : remettre des mots dans l'ordre, reconnaître une phrase bien
 * écrite (la majuscule au début, le point à la fin), compter les mots, trouver le premier ou le
 * dernier. Pour l'enfant de CI qui écrit ses premiers énoncés (français, `fr-ci-phrases`).
 *
 * Le modèle écrivait « Que mange Aïssatou ? » (aucune scène : la réponse ne se trouve pas), « Mets
 * les mots dans l'ordre : une, Fatou, mangue, a. » avec une case nommée « Fatou a une mangue. »
 * (la case EST la réponse), « Ousmane lis un livre », « Quelle phrase commence par une
 * majuscule ? » avec deux phrases qui en ont une. Ici chaque phrase est écrite et relue à la main,
 * dans une table fermée, et chaque exercice s'en déduit : une seule bonne réponse, jamais deux.
 *
 * RÈGLES POUR AJOUTER UNE PHRASE
 * - Des mots du vocabulaire du CI (`LEXICON`, `words.ts`) et de quelques mots-outils (un, une, le,
 *   la, du, son, sa, a, est, boit, mange, voit, lave, met, roule, joue, dort, sur, dans) : une
 *   phrase faite de mots que l'enfant a déjà lus.
 * - UNE SEULE MANIÈRE de les ranger. Le premier mot porte la majuscule, le dernier le point, un
 *   déterminant précède son nom. Une phrase qui garde un sens quand on échange deux noms de même
 *   genre (« Le bébé dort dans un lit » : « Le lit dort dans un bébé ») est interdite : l'enfant qui
 *   la range ainsi aurait faux. Un seul nom par phrase, ou deux noms de genres différents.
 * - Une seule majuscule, au début : c'est ce qui rend « Lola A une robe. » fausse.
 * - Pas d'apostrophe, pas de mot répété (deux tuiles identiques se confondent), de trois à six mots.
 *
 * Les énoncés n'ont aucun « : » (l'écran coupe une consigne sur le deux-points), au plus une
 * apostrophe droite, et vingt mots au plus.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { fresh, originOf, pick, pickFresh, shuffle, type GameContext, type GeneratedGame } from "./shared";

/** Trois ou quatre mots : le sujet, le verbe, ce qu'il a ou ce qu'il fait. */
export const SHORT_SENTENCES: readonly string[] = [
  "Lola a une robe.",
  "Toto a un ballon.",
  "Modou a un sac.",
  "Penda a une radio.",
  "Papa a une auto.",
  "Tata a une moto.",
  "Maman a une robe.",
  "Papa boit du café.",
  "Maman lave le bébé.",
  "Penda est malade.",
  "Toto est malade.",
  "Le rat dort.",
  "Le bébé dort.",
  "La poule boit.",
];

/** Quatre ou cinq mots : un verbe et son complément. */
export const MEDIUM_SENTENCES: readonly string[] = [
  "Modou lave son ballon.",
  "Penda met sa robe.",
  "Lola met un foulard.",
  "Papa lave la moto.",
  "Tata lave le foulard.",
  "Penda lave son foulard.",
  "Toto met son sac.",
  "Toto voit un mouton.",
  "Lola voit une poule.",
  "Modou voit le bateau.",
  "Papa voit la radio.",
  "Lola mange une tomate.",
  "Toto mange un bonbon.",
  "Penda mange une olive.",
];

/** Cinq ou six mots : un verbe, un petit mot de lieu et un nom. */
export const LONG_SENTENCES: readonly string[] = [
  "Papa roule sur sa moto.",
  "Modou roule sur sa moto.",
  "Toto roule sur sa moto.",
  "Penda roule dans une auto.",
  "Maman roule dans une auto.",
  "Tata roule dans son auto.",
  "Papa roule dans son auto.",
  "Lola dort dans son lit.",
  "Toto dort dans le salon.",
  "Papa dort dans un lit.",
  "Modou joue dans le salon.",
  "Penda joue dans le salon.",
  "Tata joue dans le salon.",
];

/** Les phrases du niveau : courtes au premier palier, plus longues ensuite. */
function sentencesFor(level: number): readonly string[] {
  if (level <= 1) return SHORT_SENTENCES;
  if (level === 2) return MEDIUM_SENTENCES;
  return LONG_SENTENCES;
}

/** Une phrase pas encore prise dans ce palier, par aucun des gabarits de phrases. */
function pickSentence(ctx: GameContext): string {
  return pickFresh(ctx, sentencesFor(ctx.level), (text) => `phrase:${text}`);
}

const wordsOf = (sentence: string) => sentence.split(" ");
/** Un mot sans le point qui ferme la phrase. */
const bare = (word: string) => word.replace(/\.$/, "");

// ===========================================================================
// REMETTRE LES MOTS DANS L'ORDRE
// ===========================================================================

/**
 * « Remets les mots dans l'ordre pour faire une phrase. » : les mots de la phrase, le dernier
 * avec son point. Le mot qui porte la majuscule ouvre la phrase : il n'y a qu'une façon de les
 * ranger.
 */
export function makeSentenceOrder(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "phrase-ordre",
    () => {
      const sentence = pickSentence(ctx);
      return {
        type: "order",
        prompt: "Remets les mots dans l'ordre pour faire une phrase.",
        payload: {
          correctSequence: wordsOf(sentence),
          game: originOf("phrase-ordre", ctx),
          concept: "remettre des mots dans l'ordre pour faire une phrase",
        },
        answerKey: sentence,
        hints: [
          "Cherche le mot qui commence par une majuscule, il ouvre la phrase.",
          "Cherche le mot qui porte le point, il ferme la phrase.",
          "Dis la phrase à voix haute pour vérifier qu'elle sonne bien.",
        ],
      };
    },
    (game) => game.answerKey,
  );
}

// ===========================================================================
// UNE PHRASE BIEN ÉCRITE
// ===========================================================================

type WrittenMode = "majuscule" | "point" | "ecrite";

const lowerFirst = (text: string) => `${text[0].toLowerCase()}${text.slice(1)}`;
const withoutPoint = (text: string) => text.replace(/\.$/, "");
/** Une majuscule au milieu de la phrase, sur son deuxième mot : « Lola A une robe. ». */
const capitalSecond = (text: string) => {
  const words = wordsOf(text);
  words[1] = `${words[1][0].toUpperCase()}${words[1].slice(1)}`;
  return words.join(" ");
};

const WRITTEN_PROMPTS: Record<WrittenMode, string> = {
  majuscule: "Quelle phrase commence par une majuscule ?",
  point: "Quelle phrase finit par un point ?",
  ecrite: "Quelle phrase est bien écrite ?",
};

const WRITTEN_HINTS: Record<WrittenMode, [string, string, string]> = {
  majuscule: [
    "Regarde la première lettre de chaque phrase.",
    "Une majuscule est une grande lettre.",
    "Les autres phrases commencent par une petite lettre.",
  ],
  point: [
    "Regarde la fin de chaque phrase.",
    "Un point est une toute petite boule posée en bas.",
    "Les autres phrases ont une virgule ou rien à la fin.",
  ],
  ecrite: [
    "Regarde le début et la fin de chaque phrase.",
    "Une phrase commence par une grande lettre et finit par un point.",
    "Une grande lettre au milieu de la phrase n'est pas à sa place.",
  ],
};

/**
 * « Quelle phrase est bien écrite ? » : trois fois la même phrase, une seule écrite comme il faut.
 * Au premier palier on ne regarde qu'une chose (la majuscule, ou le point) : les mauvais choix
 * n'ont jamais cette chose-là, donc aucun n'est une deuxième bonne réponse. Ensuite il faut les
 * deux, puis repérer aussi une majuscule mal placée.
 */
export function makeWrittenSentence(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "phrase-ecrite",
    () => {
      const sentence = pickSentence(ctx);
      const mode: WrittenMode = ctx.level <= 1 ? pick(ctx.rng, ["majuscule", "point"] as const) : "ecrite";
      let wrong: string[];
      if (mode === "majuscule") {
        wrong = [lowerFirst(sentence), lowerFirst(withoutPoint(sentence))];
      } else if (mode === "point") {
        wrong = [withoutPoint(sentence), `${withoutPoint(sentence)},`];
      } else if (ctx.level === 2) {
        wrong = [lowerFirst(sentence), withoutPoint(sentence)];
      } else {
        wrong = shuffle(ctx.rng, [lowerFirst(sentence), withoutPoint(sentence), capitalSecond(sentence), lowerFirst(withoutPoint(sentence))]).slice(0, 2);
      }
      const options = shuffle(ctx.rng, [sentence, ...wrong]);
      return {
        type: "qcm",
        prompt: WRITTEN_PROMPTS[mode],
        payload: {
          options,
          correctIndex: options.indexOf(sentence),
          game: originOf("phrase-ecrite", ctx),
          concept: "la majuscule au début et le point à la fin d'une phrase",
        },
        answerKey: sentence,
        hints: [...WRITTEN_HINTS[mode]],
      };
    },
    (game) => `${game.prompt}|${game.answerKey}`,
  );
}

// ===========================================================================
// COMPTER LES MOTS, TROUVER LE PREMIER OU LE DERNIER
// ===========================================================================

/** « Combien de mots dans la phrase « Lola a une robe. » ? » : les mots sont séparés par une espace. */
export function makeWordCount(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "phrase-mots-compter", () => {
    const sentence = pickSentence(ctx);
    const count = wordsOf(sentence).length;
    const near = [count - 2, count - 1, count + 1, count + 2].filter((n) => n >= 1);
    const options = shuffle(ctx.rng, [count, ...shuffle(ctx.rng, near).slice(0, 2)]).map(String);
    return {
      type: "qcm",
      prompt: `Combien de mots dans la phrase « ${sentence} » ?`,
      payload: {
        options,
        correctIndex: options.indexOf(String(count)),
        game: originOf("phrase-mots-compter", ctx),
        concept: "compter les mots d'une phrase",
      },
      answerKey: String(count),
      hints: [
        "Lis la phrase en touchant chaque mot avec le doigt.",
        "Un mot est séparé du suivant par un petit espace.",
        "Compte à voix haute chaque mot, du premier au dernier.",
      ],
    };
  });
}

/** « Quel est le premier mot de la phrase « … » ? » ou le dernier : trois mots de la phrase, un seul est à la bonne place. */
export function makeWordPlace(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "phrase-mot-place", () => {
    const sentence = pickSentence(ctx);
    const words = wordsOf(sentence).map(bare);
    const first = ctx.rng() < 0.5;
    const answer = first ? words[0] : words[words.length - 1];
    const others = words.filter((word) => word !== answer);
    const options = shuffle(ctx.rng, [answer, ...shuffle(ctx.rng, others).slice(0, 2)]);
    return {
      type: "qcm",
      prompt: `Quel est le ${first ? "premier" : "dernier"} mot de la phrase « ${sentence} » ?`,
      payload: {
        options,
        correctIndex: options.indexOf(answer),
        game: originOf("phrase-mot-place", ctx),
        concept: first ? "le premier mot d'une phrase" : "le dernier mot d'une phrase",
      },
      answerKey: answer,
      hints: first
        ? [
            "Lis la phrase de gauche à droite.",
            "Le premier mot est celui par lequel la phrase commence.",
            "Il commence par une majuscule.",
          ]
        : [
            "Lis la phrase de gauche à droite jusqu'au bout.",
            "Le dernier mot est celui qui est juste avant le point.",
            "Il se termine par un point dans la phrase.",
          ],
    };
  });
}
