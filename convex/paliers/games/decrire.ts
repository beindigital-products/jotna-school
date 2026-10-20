/**
 * LES GABARITS DE LA DESCRIPTION ET DE LA COMPARAISON DU CP : les mots contraires, « plus grand que », l'adjectif
 * placé avec son nom (`fr-cp-decrire`).
 *
 * Le modèle écrivait « Classe ces fruits par taille » avec « bissap » et « arachide » parmi des fruits, « Quel fruit
 * est plus grand, la mangue ou l'orange ? » (« la mangue est souvent plus grosse » : une réponse discutable),
 * « Remets dans l'ordre : Le chat est petit, le cheval est grand » (deux phrases, aucun critère), « Associe chaque
 * aliment à sa couleur » avec deux fois « jaune ». Six exercices sur douze étaient faux ou douteux. Ici les contraires
 * viennent de la fiche, la taille et le poids d'une échelle de bêtes que personne ne discute (`things.ts`), et
 * l'adjectif suit une règle qu'un enfant de CP apprend : les mots de taille avant le nom, les couleurs après.
 *
 * CE QUE LA FICHE DONNE, ET CE QUE CE FICHIER N'INVENTE PAS
 * - Les contraires de la fiche (grand et petit, chaud et froid, lourd et léger), plus « plein et vide » (la banque de
 *   la vitrine l'emploie) et « long et court ».
 * - Les bêtes de `SIZE_SCALE` et `WEIGHT_SCALE`, espacées d'au moins deux crans : la girafe est plus grande que le
 *   chien, personne n'en doute. Une seule des trois réponses d'un trou est vraie : « La girafe est plus ___ que le
 *   chien » n'offre jamais « lourde », qui serait vraie aussi.
 * - Les adjectifs placés avec leur nom suivent la règle de l'école : grand, petit, joli, gros avant le nom ; rouge,
 *   jaune, bleu, vert, blanc, noir après. Une phrase n'a qu'un rangement.
 *
 * RÈGLES POUR AJOUTER UN MOT
 * - Un contraire ne se discute pas : « grand » et « long » ne sont pas mis ensemble dans un choix (« le contraire de
 *   grand », « court » se confondrait).
 * - Un nom a un genre sûr (`genders.ts`) : l'adjectif s'accorde avec lui.
 * - Une étiquette est un mot SEUL, sans article. Les énoncés n'ont aucun « : », au plus une apostrophe droite, vingt-huit
 *   mots au plus.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { genderOf } from "../genders";
import { pick, pickFresh, randomInt, shuffle, type GameContext, type GeneratedGame } from "./shared";
import { cap, choiceGame, firstLetter, gapGame, linkGame, sequenceGame } from "./tableaux";
import { SIZE_SCALE, WEIGHT_SCALE, type Thing } from "./things";

// ===========================================================================
// LES CONTRAIRES
// ===========================================================================

/** Les contraires, par paires : chaque mot n'a qu'un contraire. */
export const CONTRARIES: readonly (readonly [string, string])[] = [
  ["grand", "petit"],
  ["chaud", "froid"],
  ["lourd", "léger"],
  ["plein", "vide"],
  ["long", "court"],
];

/** Les mots de taille : « grand » et « long » se confondent, on ne les met pas ensemble dans un choix. */
const SIZE_WORDS: readonly string[] = ["grand", "petit", "long", "court"];

const contraryOf = (word: string) => {
  const pair = CONTRARIES.find((entry) => entry.includes(word));
  return pair ? pair[pair[0] === word ? 1 : 0] : null;
};

/** Deux mots qui ne sont ni le mot, ni son contraire, ni un mot qui se confondrait avec le contraire. */
function wrongContraries(ctx: GameContext, word: string): string[] {
  const answer = contraryOf(word) as string;
  const all = CONTRARIES.flat().filter((candidate) => candidate !== word && candidate !== answer);
  const safe = SIZE_WORDS.includes(word) ? all.filter((candidate) => !SIZE_WORDS.includes(candidate)) : all;
  return shuffle(ctx.rng, safe).slice(0, 2);
}

/** « Quel mot est le contraire de « grand » ? » : le contraire parmi trois mots. */
export function makeContraryChoice(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "contraire-qcm", "le contraire d'un mot", () => {
    const word = pickFresh(ctx, CONTRARIES.flat(), (candidate) => `contraire:${candidate}`);
    const answer = contraryOf(word) as string;
    return {
      prompt: `Quel mot est le contraire de « ${word} » ?`,
      answer,
      wrong: wrongContraries(ctx, word),
      hints: ["Un contraire dit tout l'inverse.", "Pense à ce qui n'est pas du tout comme ce mot.", `Le mot commence par la lettre ${firstLetter(answer)}.`],
    };
  });
}

/** « Relie chaque mot à son contraire. » : trois ou quatre paires. */
export function makeContraryLinks(ctx: GameContext): GeneratedGame {
  return linkGame(ctx, "contraire-relier", "les mots contraires", () => {
    const count = ctx.level === 1 ? 3 : 4;
    const pairs = shuffle(ctx.rng, CONTRARIES)
      .slice(0, count)
      .map(([first, second]) => (ctx.rng() < 0.5 ? { left: first, right: second } : { left: second, right: first }));
    return {
      prompt: "Relie chaque mot à son contraire.",
      pairs,
      hints: ["Un contraire dit tout l'inverse.", "Touche un mot de gauche, puis le mot qui dit tout l'inverse.", "Commence par la paire dont tu es le plus sûr."],
    };
  });
}

/** Les phrases à trou sur les contraires : le mot du début est écrit, celui du trou est son contraire. */
const CONTRARY_SENTENCES: readonly { text: string; answer: string }[] = [
  { text: "Le feu est chaud, la glace est ___.", answer: "froid" },
  { text: "Le chat est petit, le lion est ___.", answer: "grand" },
  { text: "Le coton est léger, le fer est ___.", answer: "lourd" },
  { text: "Le verre n'est pas plein, il est ___.", answer: "vide" },
  { text: "Le crayon est long, le bout de crayon est ___.", answer: "court" },
];

/** « Complète avec le mot contraire. » : « Le feu est chaud, la glace est ___. » */
export function makeContraryGap(ctx: GameContext): GeneratedGame {
  return gapGame(ctx, "contraire-trou", "le contraire dans une phrase", () => {
    const entry = pickFresh(ctx, CONTRARY_SENTENCES, (candidate) => `contraire-phrase:${candidate.answer}`);
    // Le mot du début de la phrase est le contraire de la réponse : on ne l'offre jamais.
    const word = contraryOf(entry.answer) as string;
    const wrong = shuffle(
      ctx.rng,
      CONTRARIES.flat().filter((candidate) => candidate !== entry.answer && candidate !== word && !(SIZE_WORDS.includes(entry.answer) && SIZE_WORDS.includes(candidate))),
    ).slice(0, 2);
    return {
      prompt: "Complète avec le mot contraire.",
      text: entry.text,
      answer: entry.answer,
      wrong,
      hints: ["Lis toute la phrase.", "Le mot du trou dit tout l'inverse du mot qui est avant.", `Le mot commence par la lettre ${firstLetter(entry.answer)}.`],
    };
  });
}

// ===========================================================================
// COMPARER : PLUS GRAND QUE
// ===========================================================================

type Scale = { things: readonly Thing[]; more: string; less: string; wrongForMore: string; wrongForLess: string };

/**
 * Les deux échelles. Pour la plus grande bête d'abord, les trois choix sont le mot juste (`more`), son contraire (`less`)
 * et un mot faux pour elle (`wrongForMore`). Pour la plus petite d'abord, le mot juste est `less`, et un mot faux pour
 * elle est `wrongForLess`. Jamais le mot que les deux bêtes rendraient vrai aussi : « plus lourde » pour la girafe plus
 * grande que le chien.
 */
const SCALES: readonly Scale[] = [
  { things: SIZE_SCALE, more: "grand", less: "petit", wrongForMore: "léger", wrongForLess: "lourd" },
  { things: WEIGHT_SCALE, more: "lourd", less: "léger", wrongForMore: "petit", wrongForLess: "grand" },
];

/** Le féminin des quatre adjectifs de comparaison. */
const FEMININE_FORM: Record<string, string> = { grand: "grande", petit: "petite", lourd: "lourde", léger: "légère" };

/** « La girafe » : le nom sans son article, pour lire son genre. */
const nounOf = (thing: Thing) => thing.label.replace(/^(?:le|la|l')\s*/u, "");

/** « La girafe est plus ___ que le chien. » : la taille ou le poids, avec les deux dessins sous les yeux. */
export function makeCompareGap(ctx: GameContext): GeneratedGame {
  return gapGame(ctx, "comparer-trou", "comparer deux bêtes", () => {
    const scale = pick(ctx.rng, SCALES);
    const high = randomInt(ctx.rng, 2, scale.things.length - 1);
    const low = randomInt(ctx.rng, 0, high - 2);
    const bigFirst = ctx.rng() < 0.5;
    const first = scale.things[bigFirst ? high : low];
    const second = scale.things[bigFirst ? low : high];
    const feminine = genderOf(nounOf(first)) === "f";
    const form = (word: string) => (feminine ? FEMININE_FORM[word] : word);
    const answer = bigFirst ? scale.more : scale.less;
    const wrong = bigFirst ? [scale.less, scale.wrongForMore] : [scale.more, scale.wrongForLess];
    return {
      prompt: `Complète la phrase avec le bon mot.\n${first.emoji} ${second.emoji}`,
      text: `${cap(first.label)} est plus ___ que ${second.label}.`,
      answer: form(answer),
      wrong: wrong.map(form),
      hints: ["Regarde bien les deux dessins.", `Pense à ${scale.more === "grand" ? "la taille" : "le poids"} de chaque bête.`, "Relis la phrase avec chaque mot."],
    };
  });
}

// ===========================================================================
// L'ADJECTIF ET SON NOM
// ===========================================================================

const NAMES = ["Awa", "Fatou", "Aminata", "Moussa", "Cheikh", "Modou"] as const;

/** Un nom, ce que l'on en fait, et les couleurs qui lui vont. */
const NOUNS_WITH_COLOURS: readonly { noun: string; verb: string; colours: readonly string[] }[] = [
  { noun: "ballon", verb: "a", colours: ["rouge", "jaune", "bleu", "vert"] },
  { noun: "cartable", verb: "porte", colours: ["bleu", "rouge", "noir", "vert"] },
  { noun: "robe", verb: "porte", colours: ["rouge", "jaune", "bleu", "vert", "blanc"] },
  { noun: "livre", verb: "a", colours: ["rouge", "bleu", "vert"] },
  { noun: "chat", verb: "voit", colours: ["noir", "blanc"] },
  { noun: "chien", verb: "voit", colours: ["noir", "blanc"] },
  { noun: "poule", verb: "voit", colours: ["noir", "blanc", "rouge"] },
  { noun: "vache", verb: "voit", colours: ["noir", "blanc"] },
  { noun: "mouton", verb: "voit", colours: ["noir", "blanc"] },
];

/** Les mots de taille (avant le nom) : le masculin et le féminin. */
export const BEFORE_NOUN: readonly (readonly [string, string])[] = [
  ["grand", "grande"],
  ["petit", "petite"],
  ["joli", "jolie"],
  ["gros", "grosse"],
];

/** Les couleurs (après le nom) : le masculin et le féminin. */
export const AFTER_NOUN: readonly (readonly [string, string])[] = [
  ["rouge", "rouge"],
  ["jaune", "jaune"],
  ["bleu", "bleue"],
  ["vert", "verte"],
  ["blanc", "blanche"],
  ["noir", "noire"],
];

/** « Remets les mots dans l'ordre pour écrire une phrase. » : « Awa a un grand ballon. » ou « Awa porte une robe rouge. » */
export function makeAdjectiveOrder(ctx: GameContext): GeneratedGame {
  return sequenceGame(ctx, "adjectif-ordre", "l'adjectif et son nom", () => {
    const entry = pickFresh(ctx, NOUNS_WITH_COLOURS, (candidate) => `adjectif:${candidate.noun}`);
    const feminine = genderOf(entry.noun) === "f";
    const determiner = feminine ? "une" : "un";
    const before = ctx.rng() < 0.5;
    const name = pick(ctx.rng, NAMES);
    const sequence = before
      ? (() => {
          const [masculine, female] = pick(ctx.rng, BEFORE_NOUN);
          return [name, entry.verb, determiner, feminine ? female : masculine, `${entry.noun}.`];
        })()
      : (() => {
          const colour = pick(ctx.rng, entry.colours);
          const [, female] = AFTER_NOUN.find(([masculine]) => masculine === colour) as readonly [string, string];
          return [name, entry.verb, determiner, entry.noun, `${feminine ? female : colour}.`];
        })();
    return {
      prompt: "Remets les mots dans l'ordre pour écrire une phrase.",
      sequence,
      hints: [
        "Une phrase commence par une majuscule et finit par un point.",
        "Le mot un ou une vient juste avant le groupe du nom.",
        "Les mots de taille se placent avant le nom, les mots de couleur après.",
      ],
    };
  });
}
