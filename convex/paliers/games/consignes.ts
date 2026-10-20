/**
 * LES GABARITS DES CONSIGNES DU CP : le sens des verbes d'une consigne, la bonne consigne pour une action, les
 * étapes d'un geste simple remises dans l'ordre (`fr-cp-consignes`).
 *
 * Le modèle écrivait « Associe chaque aliment à son prix en FCFA » (des prix inventés, hors sujet), « Pour faire
 * du ___, il faut du mil » avec « fonio » (le fonio n'est pas fait de mil), « Souligne le mot ___ » avec « yassa »
 * et « mafé » acceptés tous les deux, une recette de bissap inventée et fausse. Quatre exercices sur six
 * étaient faux. Ici tout vient d'un tableau fermé : les six verbes de la fiche (entoure, colorie, découpe,
 * relie, souligne, recopie), ce que chacun fait faire, et quatre gestes du quotidien dont l'ordre ne se discute
 * pas (se laver les mains, planter une graine, faire un dessin, boire un verre d'eau).
 *
 * CE QUE LA FICHE DONNE, ET CE QUE CE FICHIER N'INVENTE PAS
 * - Les six verbes de la fiche, et rien d'autre : pas de « barre », pas de « complète » (une autre fiche).
 * - Aucune recette : le modèle se trompait sur le jus de bissap. Les étapes sont des gestes que tout enfant a vus
 *   mille fois, chacune a besoin de celle d'avant.
 * - Une phrase à trou dit, après le trou, ce que le verbe fait faire : un seul des six verbes y va.
 *
 * RÈGLES POUR AJOUTER UN VERBE OU UN GESTE
 * - Le sens d'un verbe (`gloss`) ne contient jamais le verbe, et deux verbes n'ont jamais le même sens.
 * - Un geste est une suite où chaque étape a besoin de la précédente, écrite en phrases entières (au CI, une tuile
 *   « article + un nom » demande une image du catalogue).
 * - Les énoncés n'ont aucun « : », au plus une apostrophe droite, vingt-huit mots au plus.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { pick, shuffle, type GameContext, type GeneratedGame } from "./shared";
import { choiceGame, firstLetter, gapGame, linkGame, sequenceGame } from "./tableaux";

type Instruction = {
  /** Le verbe, tel qu'une consigne l'écrit : « Entoure ». */
  verb: string;
  /** Ce qu'il fait faire, à l'infinitif, sans le verbe lui-même. */
  gloss: string;
  /** Ce que fait l'enfant, à la première personne. */
  doing: string;
  /** Une phrase où seul ce verbe va, parmi les six. */
  frame: string;
};

/** Les six verbes de la fiche. */
export const INSTRUCTIONS: readonly Instruction[] = [
  { verb: "Entoure", gloss: "faire un rond autour", doing: "Je fais un rond autour.", frame: "___ le dessin en faisant un rond autour." },
  { verb: "Colorie", gloss: "remplir de couleurs", doing: "Je remplis avec des couleurs.", frame: "___ le dessin en le remplissant de couleurs." },
  { verb: "Découpe", gloss: "couper avec des ciseaux", doing: "Je coupe avec des ciseaux.", frame: "___ la forme avec des ciseaux." },
  { verb: "Relie", gloss: "tracer un trait entre deux dessins", doing: "Je trace un trait entre deux dessins.", frame: "___ les deux dessins en traçant un trait entre eux." },
  { verb: "Souligne", gloss: "tracer un trait sous le mot", doing: "Je trace un trait sous le mot.", frame: "___ le mot en traçant un trait dessous." },
  { verb: "Recopie", gloss: "écrire une deuxième fois", doing: "J'écris encore une fois ce qui est écrit.", frame: "___ la phrase en l'écrivant une deuxième fois." },
];

/** Des mots qui ne sont jamais une consigne de classe. */
const NOT_INSTRUCTIONS = ["Mange", "Dors"] as const;

const others = (ctx: GameContext, entry: Instruction) =>
  shuffle(
    ctx.rng,
    INSTRUCTIONS.filter((candidate) => candidate.verb !== entry.verb),
  );

/** « La consigne dit « Découpe ». Que fais-tu ? » : trois façons de faire, une seule est celle du verbe. */
export function makeInstructionMeaning(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "consigne-sens", "le sens d'un verbe de consigne", () => {
    const entry = pick(ctx.rng, INSTRUCTIONS);
    return {
      prompt: `La consigne dit « ${entry.verb} ». Que fais-tu ?`,
      answer: entry.doing,
      wrong: others(ctx, entry).map((other) => other.doing),
      hints: ["Lis bien le mot de la consigne.", "Pense à ce que font tes mains.", `Le mot de la consigne commence par la lettre ${firstLetter(entry.verb)}.`],
    };
  });
}

/** « Quel mot de consigne veut dire « couper avec des ciseaux » ? » : le verbe parmi trois verbes. */
export function makeInstructionVerb(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "consigne-verbe", "le verbe qui dit l'action", () => {
    const entry = pick(ctx.rng, INSTRUCTIONS);
    return {
      prompt: `Quel mot de consigne veut dire « ${entry.gloss} » ?`,
      answer: entry.verb,
      wrong: others(ctx, entry).map((other) => other.verb),
      hints: ["Lis bien ce qu'on te demande de faire.", "Cherche le mot qui dit cette action.", `Le mot commence par la lettre ${firstLetter(entry.verb)}.`],
    };
  });
}

/** « Relie chaque consigne à ce qu'elle veut dire. » : trois à cinq verbes et leur sens. */
export function makeInstructionLinks(ctx: GameContext): GeneratedGame {
  return linkGame(ctx, "consigne-relier", "le sens des verbes de consigne", () => {
    const count = ctx.level === 1 ? 3 : ctx.level === 2 ? 4 : 5;
    const pairs = shuffle(ctx.rng, INSTRUCTIONS)
      .slice(0, count)
      .map((entry) => ({ left: entry.verb, right: entry.gloss }));
    return {
      prompt: "Relie chaque consigne à ce qu'elle veut dire.",
      pairs,
      hints: ["Lis les consignes l'une après l'autre.", "Pense à ce que font tes mains pour chacune.", "Commence par la paire dont tu es le plus sûr."],
    };
  });
}

/** « Complète la consigne avec le bon verbe. » : « ___ la forme avec des ciseaux. » */
export function makeInstructionGap(ctx: GameContext): GeneratedGame {
  return gapGame(ctx, "consigne-trou", "le verbe qui va avec la consigne", () => {
    const entry = pick(ctx.rng, INSTRUCTIONS);
    return {
      prompt: "Complète la consigne avec le bon verbe.",
      text: entry.frame,
      answer: entry.verb,
      wrong: others(ctx, entry).map((other) => other.verb),
      hints: ["Lis toute la phrase, elle dit ce qu'on fait.", "Cherche le verbe qui va avec la fin de la phrase.", `Le mot commence par la lettre ${firstLetter(entry.verb)}.`],
    };
  });
}

/** « Quel mot n'est pas une consigne de classe ? » : un mot qui ne se fait pas sur sa feuille, deux consignes. */
export function makeInstructionOdd(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "consigne-intrus", "reconnaître une consigne", () => {
    const answer = pick(ctx.rng, NOT_INSTRUCTIONS);
    return {
      prompt: "Quel mot n'est pas une consigne de classe ?",
      answer,
      wrong: shuffle(ctx.rng, INSTRUCTIONS)
        .slice(0, 2)
        .map((entry) => entry.verb),
      hints: ["Lis les trois mots.", "Une consigne dit ce qu'on doit faire sur sa feuille.", "Un seul de ces mots ne se fait pas sur une feuille."],
    };
  });
}

type Routine = {
  /** Ce qu'on veut faire : « se laver les mains ». */
  goal: string;
  /** Les étapes, chacune a besoin de la précédente. */
  steps: readonly string[];
};

/** Quatre gestes du quotidien dont l'ordre ne se discute pas. */
export const ROUTINES: readonly Routine[] = [
  { goal: "se laver les mains", steps: ["Mouille tes mains.", "Mets du savon.", "Frotte tes mains.", "Rince tes mains."] },
  {
    goal: "planter une graine",
    steps: ["Fais un trou dans la terre.", "Mets la graine dans le trou.", "Recouvre la graine de terre.", "Arrose la terre."],
  },
  { goal: "faire un dessin", steps: ["Prends une feuille.", "Dessine une maison.", "Colorie la maison.", "Accroche ton dessin."] },
  { goal: "boire un verre d'eau", steps: ["Prends un verre.", "Remplis le verre d'eau.", "Bois l'eau.", "Pose le verre."] },
];

/** « Mets ces étapes dans le bon ordre pour se laver les mains. » : trois étapes au premier palier, quatre ensuite. */
export function makeInstructionSteps(ctx: GameContext): GeneratedGame {
  return sequenceGame(ctx, "consigne-etapes", "remettre les étapes d'un geste dans l'ordre", () => {
    const routine = pick(ctx.rng, ROUTINES);
    return {
      prompt: `Mets ces étapes dans le bon ordre pour ${routine.goal}.`,
      sequence: routine.steps.slice(0, ctx.level === 1 ? 3 : 4),
      hints: ["Pense à ce qu'on fait en premier.", "Chaque étape a besoin de celle d'avant.", "La dernière étape finit le travail."],
    };
  });
}
