/**
 * LES GABARITS DE LA NARRATION DU CP : remettre les étapes d'une histoire avec « d'abord, ensuite, enfin », retrouver
 * qui fait quoi, où, quand dans un petit texte (`fr-cp-raconter`).
 *
 * Le modèle écrivait « Qui va au marché ? » sans aucune histoire à l'écran, « Que fait Modou au marché ? » avec deux
 * réponses acceptées et le texte absent, « Associe les personnages à leurs actions » (des paires arbitraires, rien ne
 * dit qui fait quoi). Cinq exercices sur huit étaient faux ou injouables. Ici le TEXTE est dans l'énoncé : la réponse
 * s'y lit, et chaque question n'a qu'une réponse, parce que chaque personne y fait une seule chose.
 *
 * CE QUE LA FICHE DONNE, ET CE QUE CE FICHIER N'INVENTE PAS
 * - Trois histoires de la vie de l'enfant que la fiche cite : le marché, la récréation, la pêche avec le grand-père.
 *   Chacune a trois étapes : on part, on fait, on rentre.
 * - Les mots d'ordre de la fiche : d'abord, ensuite, enfin. Ils sont ÉCRITS dans les phrases à remettre dans l'ordre :
 *   l'enfant n'a pas à deviner un ordre que rien ne dit, il lit la clé.
 * - Un prénom, jamais deux fois le même dans un texte ; « Il » et « Elle » reprennent le prénom.
 *
 * RÈGLES POUR AJOUTER UNE HISTOIRE
 * - Trois étapes dont chacune vient après la précédente, sans apostrophe dans une étape (« D'abord » en a déjà une).
 * - Une étape du milieu qui n'appartient à aucune autre histoire : « achète des mangues » ne va qu'au marché.
 * - Les énoncés n'ont aucun « : », au plus une apostrophe droite, vingt-huit mots au plus. Une étiquette est une phrase
 *   entière ou un mot seul, jamais « article + un nom ».
 *
 * MODULE PUR (voir `types.ts`).
 */
import { pick, pickFresh, shuffle, type GameContext, type GeneratedGame } from "./shared";
import { choiceGame, firstLetter, gapGame, linkGame, sequenceGame } from "./tableaux";

type Person = { name: string; pronoun: "Il" | "Elle" };

const PEOPLE: readonly Person[] = [
  { name: "Awa", pronoun: "Elle" },
  { name: "Fatou", pronoun: "Elle" },
  { name: "Aminata", pronoun: "Elle" },
  { name: "Moussa", pronoun: "Il" },
  { name: "Cheikh", pronoun: "Il" },
  { name: "Modou", pronoun: "Il" },
];

type Story = {
  /** La première étape : on part. */
  go: string;
  /** Ce que la personne fait, seul de son histoire. */
  mid: string;
  /** Ce qu'elle fait, avec l'endroit. */
  midWhere: string;
  /** La dernière étape : on rentre. */
  end: string;
  /** L'endroit de l'histoire. */
  place: string;
  /** La question « où » de l'histoire. */
  where: (name: string) => string;
};

/** Les trois histoires de la fiche. */
export const STORIES: readonly Story[] = [
  {
    go: "va au marché",
    mid: "achète des mangues",
    midWhere: "achète des mangues au marché",
    end: "rentre à la maison",
    place: "au marché",
    where: (name) => `Où va ${name} ?`,
  },
  {
    go: "sort de la classe",
    mid: "joue au ballon",
    midWhere: "joue au ballon dans la cour",
    end: "retourne en classe",
    place: "dans la cour",
    where: (name) => `Où joue ${name} ?`,
  },
  {
    go: "part à la pêche avec son grand-père",
    mid: "attrape un poisson",
    midWhere: "attrape un poisson avec son grand-père",
    end: "rentre avec le poisson",
    place: "à la pêche",
    where: (name) => `Où part ${name} ?`,
  },
];

const PLACES = STORIES.map((story) => story.place);

const sentence = (person: Person, phrase: string) => `${person.name} ${phrase}.`;
/** « elle » ou « il » au milieu d'une phrase. */
const lowerPronoun = (person: Person) => person.pronoun.toLowerCase();

/** Des prénoms qui ne se répètent pas : les n premiers d'un mélange. */
const people = (ctx: GameContext, n: number) => shuffle(ctx.rng, PEOPLE).slice(0, n);

/** « D'abord, Awa va au marché. » « Ensuite, elle achète des mangues. » « Enfin, elle rentre à la maison. » remises dans l'ordre. */
export function makeStoryOrder(ctx: GameContext): GeneratedGame {
  return sequenceGame(ctx, "recit-ordre", "remettre les étapes d'une histoire dans l'ordre", () => {
    // Trois exercices par palier : trois histoires différentes, pas la même avec un autre prénom.
    const story = pickFresh(ctx, STORIES, (candidate) => `recit-ordre:histoire:${candidate.go}`);
    const [person] = people(ctx, 1);
    return {
      prompt: "Remets les phrases dans le bon ordre.",
      sequence: [`D'abord, ${person.name} ${story.go}.`, `Ensuite, ${lowerPronoun(person)} ${story.midWhere}.`, `Enfin, ${lowerPronoun(person)} ${story.end}.`],
      hints: [
        "Lis chaque phrase et repère son premier mot.",
        "Une histoire commence, continue, puis se termine.",
        "Lis les phrases à voix basse pour voir si elles se suivent.",
      ],
    };
  });
}

/** « Awa achète des mangues. Moussa joue au ballon. Qui joue au ballon ? » : deux personnes, deux actions, une question. */
export function makeStoryWho(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "recit-qui", "retrouver qui fait quoi", () => {
    const [first, second, third] = people(ctx, 3);
    const [storyA, storyB] = shuffle(ctx.rng, STORIES);
    const target = ctx.rng() < 0.5 ? { person: first, story: storyA } : { person: second, story: storyB };
    return {
      prompt: `${sentence(first, storyA.midWhere)} ${sentence(second, storyB.midWhere)}\nQui ${target.story.midWhere} ?`,
      answer: target.person.name,
      wrong: [first, second, third].filter((person) => person.name !== target.person.name).map((person) => person.name),
      hints: ["Lis les deux phrases doucement.", "Cherche dans le texte ce que la question dit.", "Le nom qui vient avant ces mots est la réponse."],
    };
  });
}

/** « Moussa sort de la classe. Il joue au ballon dans la cour. Où joue Moussa ? » : l'endroit est écrit dans le texte. */
export function makeStoryWhere(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "recit-ou", "retrouver où se passe l'histoire", () => {
    const story = pick(ctx.rng, STORIES);
    const [person] = people(ctx, 1);
    return {
      prompt: `${sentence(person, story.go)} ${person.pronoun} ${story.midWhere}.\n${story.where(person.name)}`,
      answer: story.place,
      wrong: PLACES.filter((place) => place !== story.place),
      hints: ["Lis l'histoire doucement.", "Cherche l'endroit dont parle la première phrase.", "Regarde ce que la personne fait ensuite."],
    };
  });
}

/** « Awa achète des mangues au marché. Que fait Awa ? » : ce que fait la personne, parmi les actions des autres histoires. */
export function makeStoryWhat(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "recit-quoi", "retrouver ce que fait la personne", () => {
    const story = pick(ctx.rng, STORIES);
    const [person] = people(ctx, 1);
    const action = (target: Story) => `${person.pronoun} ${target.mid}.`;
    return {
      prompt: `${sentence(person, story.midWhere)}\nQue fait ${person.name} ?`,
      answer: action(story),
      wrong: STORIES.filter((other) => other !== story).map(action),
      hints: ["Lis la phrase doucement.", "Cherche le verbe qui dit ce que la personne fait.", "Les autres choix parlent d'autres histoires."],
    };
  });
}

/** Les moments de la journée : ce que le texte dit, et ce qu'on lit dans les choix. */
const TIMES: readonly { opening: string; label: string }[] = [
  { opening: "Le matin", label: "le matin" },
  { opening: "À midi", label: "midi" },
  { opening: "Le soir", label: "le soir" },
];

/** « Le matin, Awa va au marché. Quel moment de la journée est écrit dans l'histoire ? » */
export function makeStoryWhen(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "recit-quand", "retrouver quand se passe l'histoire", () => {
    const story = pick(ctx.rng, STORIES);
    const time = pick(ctx.rng, TIMES);
    const [person] = people(ctx, 1);
    return {
      prompt: `${time.opening}, ${person.name} ${story.go}. ${person.pronoun} ${story.mid}.\nQuel moment de la journée est écrit dans l'histoire ?`,
      answer: time.label,
      wrong: TIMES.filter((other) => other.label !== time.label).map((other) => other.label),
      hints: ["Lis la première phrase.", "Cherche le mot qui dit le moment de la journée.", "Il est écrit avant le prénom."],
    };
  });
}

/** « D'abord, Awa va au marché. ___, elle achète des mangues. Enfin, elle rentre à la maison. » : le mot d'ordre qui manque. */
export function makeStoryGap(ctx: GameContext): GeneratedGame {
  return gapGame(ctx, "recit-trou", "les mots d'ordre d'une histoire", () => {
    const story = pickFresh(ctx, STORIES, (candidate) => `recit-trou:histoire:${candidate.go}`);
    const [person] = people(ctx, 1);
    const words = ["D'abord", "Ensuite", "Enfin"] as const;
    const missing = pick(ctx.rng, words);
    const lines = [`${person.name} ${story.go}.`, `${lowerPronoun(person)} ${story.midWhere}.`, `${lowerPronoun(person)} ${story.end}.`];
    const text = words.map((word, i) => `${word === missing ? "___" : word}, ${lines[i]}`).join(" ");
    return {
      prompt: "Complète l'histoire avec le bon mot.",
      text,
      answer: missing,
      wrong: words.filter((word) => word !== missing),
      hints: ["Lis l'histoire en entier.", "Un mot dit si c'est le début, le milieu ou la fin.", "Regarde les autres mots qui sont déjà écrits."],
    };
  });
}

/** « Awa achète des mangues. Moussa joue au ballon. Fatou attrape un poisson. Relie chaque enfant à ce qu'il fait. » */
export function makeStoryLinks(ctx: GameContext): GeneratedGame {
  return linkGame(ctx, "recit-relier", "retrouver qui fait quoi dans un texte", () => {
    const heroes = people(ctx, 3);
    const stories = shuffle(ctx.rng, STORIES);
    const lines = heroes.map((person, i) => sentence(person, stories[i].mid));
    return {
      prompt: `${lines.join(" ")}\nRelie chaque enfant à ce qu'il fait.`,
      pairs: heroes.map((person, i) => ({ left: person.name, right: stories[i].mid })),
      hints: ["Lis les trois phrases doucement.", "Chaque enfant fait une seule chose dans le texte.", `Cherche d'abord le prénom qui commence par la lettre ${firstLetter(heroes[0].name)}.`],
    };
  });
}
