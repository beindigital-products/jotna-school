/**
 * LES GABARITS DE LECTURE DU CE1 : comprendre un texte narratif (qui, quoi, où, quand), un texte descriptif (de quel animal parle-t-on ?)
 * et un texte injonctif (une recette, la règle d'un jeu) (`fr-ce1-lecture`).
 *
 * Le modèle écrivait ici des questions sans texte (« Où va Awa ? » avec aucune histoire à l'écran), des textes qui disaient deux choses
 * contraires, des questions à deux réponses justes. Ici le TEXTE est dans l'énoncé, et la réponse s'y lit : une question n'a qu'une
 * réponse parce que le texte n'a qu'un prénom, un lieu, un moment, et que chaque mauvais choix est une chose que le texte ne dit pas.
 *
 * LES TEXTES
 * - Les histoires (`STORIES`) sont ÉCRITES à partir de sept champs (le prénom, son genre, le moment, le verbe d'aller, le lieu, ce qu'on y fait,
 *   comment on finit) : « Le matin, Awa va au marché. Elle achète des mangues. Puis, elle rentre à la maison. » Les quatre questions (qui, quoi, où,
 *   quand) se lisent dans le même enregistrement ; les mauvais choix sont pris dans les autres histoires, MOINS ce que le texte écrit déjà
 *   (le lieu où l'on rentre n'est jamais un mauvais choix pour « Où va Awa ? »).
 * - Les textes descriptifs sont faits d'indices PROPRES à un animal : aucun indice ne va à deux animaux du tableau (« Il a des plumes » irait
 *   à la poule et à l'oiseau). Un mauvais choix est donc un animal dont AUCUN des trois indices ne dit rien.
 * - Les recettes disent leur ordre avec « D'abord, Ensuite, Enfin » : la question « en premier » a une seule réponse que le texte numérote.
 *   Les mauvais choix d'une règle sont des choses que la règle ne dit pas.
 * - Les choix d'une règle ne sont jamais « article + nom » (« des cases », « le loup ») : `templatePictures.test.ts` y verrait au CI une tuile
 *   sans image. Ils commencent par un verbe ou un pronom (« on dessine des cases », « il devient le loup »).
 *
 * COMME AU CP ET AU CI, avec la place d'un texte : un énoncé n'a aucun « : », une apostrophe droite au plus, quatre-vingts mots au plus
 * (le plafond du CE1 du contrôleur) ; aucun émoji. Aucun indice n'écrit un mot de quatre lettres ou plus d'un choix ou d'une réponse.
 *
 * HORS FICHE, À FAIRE RELIRE : les histoires de la vie courante (les prénoms, le marché, la pêche, le puits, le champ), les phrases sur la vie
 * des onze animaux, les recettes (riz, jus de bissap, omelette) et les jeux (ballon, corde, cache-cache, marelle, loup, statues).
 *
 * MODULE PUR (voir `types.ts`).
 */
import { pickFresh, shuffle, type GameContext, type GeneratedGame } from "./shared";
import { choiceGame, linkGame, sortGame, type Hints } from "./tableaux";
import { quarter, stepsOrder, triples, type Steps } from "./ce1SciencesOutils";

const READING = "lire et comprendre un texte";

// ===========================================================================
// LES HISTOIRES : qui, quoi, où, quand
// ===========================================================================

type Story = {
  name: string;
  /** Vrai pour un prénom de fille (« Elle »), faux pour un prénom de garçon (« Il »). */
  she: boolean;
  when: "Le matin" | "À midi" | "Le soir";
  /** Le verbe d'aller de la première phrase : « va » ou « part ». */
  go: "va" | "part";
  place: string;
  /** Ce que la personne fait à cet endroit, à la troisième personne. */
  what: string;
  /** Ce qu'elle fait ensuite. */
  end: string;
};

const STORIES: readonly Story[] = [
  // Niveau 1
  { name: "Awa", she: true, when: "Le matin", go: "va", place: "au marché", what: "achète des mangues", end: "rentre à la maison" },
  { name: "Moussa", she: false, when: "À midi", go: "va", place: "à la plage", what: "ramasse des coquillages", end: "mange du poisson" },
  { name: "Fatou", she: true, when: "Le soir", go: "va", place: "à la mosquée", what: "prie avec sa maman", end: "se couche tôt" },
  { name: "Cheikh", she: false, when: "Le matin", go: "part", place: "à la pêche", what: "attrape un gros poisson", end: "revient avec son filet" },
  // Niveau 2
  { name: "Aminata", she: true, when: "À midi", go: "va", place: "au champ", what: "arrose les tomates", end: "se repose sous un arbre" },
  { name: "Omar", she: false, when: "Le soir", go: "va", place: "au village", what: "rend visite à sa grand-mère", end: "dort chez elle" },
  { name: "Mariama", she: true, when: "Le matin", go: "va", place: "à la boutique", what: "achète du pain", end: "revient chez elle" },
  { name: "Ibrahima", she: false, when: "Le matin", go: "va", place: "au puits", what: "remplit son seau", end: "porte le seau à la case" },
  // Niveau 3
  { name: "Khady", she: true, when: "À midi", go: "va", place: "dans la cour", what: "joue à la corde", end: "boit un jus de bissap" },
  { name: "Modou", she: false, when: "Le soir", go: "part", place: "à la ferme", what: "donne du grain aux poules", end: "ferme la porte" },
  { name: "Rokhaya", she: true, when: "Le matin", go: "va", place: "en classe", what: "écrit la date au tableau", end: "range ses affaires" },
  { name: "Pape", she: false, when: "À midi", go: "va", place: "au port", what: "vend des oranges", end: "compte ses pièces" },
  // Niveau 4
  { name: "Seynabou", she: true, when: "Le soir", go: "part", place: "sur la colline", what: "regarde le coucher du soleil", end: "chante une chanson" },
  { name: "Ousmane", she: false, when: "Le matin", go: "part", place: "dans les champs", what: "sème du mil", end: "rentre avant midi" },
  { name: "Dieynaba", she: true, when: "À midi", go: "va", place: "à la cantine", what: "mange du riz", end: "lave son assiette" },
  { name: "Abdou", she: false, when: "Le soir", go: "va", place: "au stade", what: "joue au ballon", end: "lave ses mains" },
];

const STORY_NAMES = STORIES.map((story) => story.name);
const WHENS = ["Le matin", "À midi", "Le soir"] as const;

const pronounOf = (story: Story) => (story.she ? "Elle" : "Il");
const storyText = (story: Story) =>
  `${story.when}, ${story.name} ${story.go} ${story.place}. ${pronounOf(story)} ${story.what}. Puis, ${pronounOf(story).toLowerCase()} ${story.end}.`;
const lower = (text: string) => `${text[0].toLowerCase()}${text.slice(1)}`;

/** Une histoire de ce niveau, que les quatre questions (qui, quoi, où, quand) se partagent : un palier ne repose pas la même histoire. */
const pickStory = (ctx: GameContext): Story => pickFresh(ctx, quarter(STORIES, ctx.level), (candidate) => `ce1-fr-lec:histoire:${candidate.name}`);

/**
 * Les mauvais choix : ce que les autres histoires disent, sauf ce que le texte écrit déjà. Les plus proches de la bonne réponse en longueur
 * passent d'abord (à égalité, au hasard) : une bonne réponse deux fois plus longue que les autres se devine, et le contrôleur le signale.
 */
const otherThan = (ctx: GameContext, text: string, right: string, candidates: readonly string[]) =>
  shuffle(
    ctx.rng,
    [...new Set(candidates)].filter((candidate) => candidate !== right && !text.includes(candidate)),
  ).sort((a, b) => Math.abs(a.length - right.length) - Math.abs(b.length - right.length));

const WHO_HINTS: Hints = ["Relis le texte doucement.", "Repère les mots de la question au fil du texte.", "Le prénom de celui qui agit est écrit tout près de ces mots."];
const WHAT_HINTS: Hints = ["Relis le texte doucement.", "Cherche ce que fait la personne, juste après son prénom.", "La deuxième phrase du texte le dit."];
const WHERE_HINTS: Hints = ["Relis le texte doucement.", "Cherche le mot qui dit l'endroit, comme au, à la ou en.", "L'endroit est écrit juste après le verbe aller."];
const WHEN_HINTS: Hints = ["Relis le texte doucement.", "Cherche le mot qui dit le moment de la journée.", "Il est écrit au tout début du texte, avant le prénom."];

/** « Le matin, Awa va au marché. Elle achète des mangues. Puis, elle rentre à la maison. Qui achète des mangues ? » */
export function makeCe1FrReadWho(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce1-fr-lec-qui", READING, () => {
    const story = pickStory(ctx);
    const text = storyText(story);
    return {
      prompt: `${text}\nQui ${story.what} ?`,
      answer: story.name,
      wrong: otherThan(ctx, text, story.name, STORY_NAMES),
      hints: WHO_HINTS,
    };
  });
}

/** « … Que fait Awa au marché ? » : ce que fait la personne à l'endroit où elle va. */
export function makeCe1FrReadWhat(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce1-fr-lec-quoi", READING, () => {
    const story = pickStory(ctx);
    const text = storyText(story);
    return {
      prompt: `${text}\nQue fait ${story.name} ${story.place} ?`,
      answer: story.what,
      wrong: otherThan(
        ctx,
        text,
        story.what,
        STORIES.map((other) => other.what),
      ),
      hints: WHAT_HINTS,
    };
  });
}

/** « … Où va Awa ? » : l'endroit de la première phrase. */
export function makeCe1FrReadWhere(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce1-fr-lec-ou", READING, () => {
    const story = pickStory(ctx);
    const text = storyText(story);
    return {
      prompt: `${text}\nOù ${story.go} ${story.name} ?`,
      answer: story.place,
      wrong: otherThan(
        ctx,
        text,
        story.place,
        STORIES.map((other) => other.place),
      ),
      hints: WHERE_HINTS,
    };
  });
}

/** « … Quand Awa va-t-elle au marché ? » : le moment de la journée, écrit en tête du texte. */
export function makeCe1FrReadWhen(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce1-fr-lec-quand", READING, () => {
    const story = pickStory(ctx);
    const text = storyText(story);
    // « va-t-elle » prend un t entre deux voyelles ; « part-il » n'en prend pas.
    const link = story.go === "va" ? "-t-" : "-";
    return {
      prompt: `${text}\nQuand ${story.name} ${story.go}${link}${pronounOf(story).toLowerCase()} ${story.place} ?`,
      answer: lower(story.when),
      wrong: WHENS.filter((when) => when !== story.when).map(lower),
      hints: WHEN_HINTS,
    };
  });
}

// ===========================================================================
// REMETTRE UNE HISTOIRE DANS L'ORDRE
// ===========================================================================

const ORDER_WORDS_HINTS: Hints = [
  "Lis chaque phrase en entier.",
  "Cherche le premier mot de chaque phrase.",
  "Le premier mot dit si c'est le début, le milieu ou la fin.",
];
const ORDER_DAY_HINTS: Hints = ["Lis chaque phrase en entier.", "Cherche au début de chaque phrase le moment de la journée.", "Une journée se déroule selon l'ordre du temps."];
const READ_ORDER_PROMPT = "Remets les phrases de cette histoire dans le bon ordre.";
const steps = (sequence: readonly string[], hints: Hints): Steps => ({ prompt: READ_ORDER_PROMPT, sequence, hints });

const ORDERS: readonly Steps[] = [
  // Niveau 1 : D'abord, Ensuite, Enfin
  steps(["D'abord, Awa se lève.", "Ensuite, elle se lave.", "Enfin, elle va en classe."], ORDER_WORDS_HINTS),
  steps(["D'abord, Moussa prend son cartable.", "Ensuite, il ferme la porte.", "Enfin, il part à l'école."], ORDER_WORDS_HINTS),
  steps(["D'abord, Fatou lave le riz.", "Ensuite, elle le met dans la marmite.", "Enfin, elle le sert chaud."], ORDER_WORDS_HINTS),
  // Niveau 2
  steps(["D'abord, Cheikh lance son filet.", "Ensuite, il attend un peu.", "Enfin, il sort un poisson."], ORDER_WORDS_HINTS),
  steps(["D'abord, Aminata achète du pain.", "Ensuite, elle paie le vendeur.", "Enfin, elle rentre chez elle."], ORDER_WORDS_HINTS),
  steps(["D'abord, Omar plante une graine.", "Ensuite, il l'arrose.", "Enfin, une petite pousse sort de terre."], ORDER_WORDS_HINTS),
  // Niveau 3 : le matin, à midi, l'après-midi, le soir
  steps(["Le matin, Awa va au marché.", "À midi, elle prépare le repas.", "L'après-midi, elle lave le linge.", "Le soir, elle raconte une histoire."], ORDER_DAY_HINTS),
  steps(["Le matin, Moussa va à la pêche.", "À midi, il mange du poisson.", "L'après-midi, il répare son filet.", "Le soir, il rentre au village."], ORDER_DAY_HINTS),
  steps(["Le matin, Fatou va en classe.", "À midi, elle mange à la cantine.", "L'après-midi, elle joue dans la cour.", "Le soir, elle fait ses devoirs."], ORDER_DAY_HINTS),
  // Niveau 4
  steps(["Le matin, Ibrahima va au champ.", "À midi, il se repose sous un arbre.", "L'après-midi, il arrose les tomates.", "Le soir, il revient à la case."], ORDER_DAY_HINTS),
  steps(["Le matin, Mariama aide sa maman.", "À midi, elle va au puits.", "L'après-midi, elle lit un livre.", "Le soir, elle dort tôt."], ORDER_DAY_HINTS),
  steps(["Le matin, Modou prend le car.", "À midi, il arrive au village.", "L'après-midi, il rend visite à son oncle.", "Le soir, il repart chez lui."], ORDER_DAY_HINTS),
];

/** Les phrases d'une histoire à remettre dans l'ordre : trois avec D'abord, Ensuite, Enfin, quatre avec les moments de la journée. */
export function makeCe1FrReadOrder(ctx: GameContext): GeneratedGame {
  return stepsOrder(ctx, "ce1-fr-lec-ordre", READING, quarter(ORDERS, ctx.level));
}

// ===========================================================================
// VRAI OU FAUX : des phrases à ranger d'après un texte
// ===========================================================================

type TrueFalse = { lines: readonly string[]; truths: readonly string[]; falses: readonly string[] };

const TRUE_FALSE: readonly TrueFalse[] = [
  // Niveau 1
  {
    lines: ["Awa va au marché avec sa maman.", "Elle achète des mangues et du riz.", "Elle rentre avant midi."],
    truths: ["Awa va au marché.", "Awa achète du riz.", "Awa va au marché avec sa maman."],
    falses: ["Awa achète du poisson.", "Awa va à la plage.", "Awa rentre le soir."],
  },
  {
    lines: ["Moussa pêche avec son grand-père.", "Ils prennent trois poissons.", "Moussa est très content."],
    truths: ["Moussa pêche avec son grand-père.", "Ils prennent trois poissons.", "Moussa est content."],
    falses: ["Moussa pêche tout seul.", "Ils prennent dix poissons.", "Moussa est triste."],
  },
  {
    lines: ["Le chat de Fatou dort sur la natte.", "Il est petit et noir.", "Il aime le lait."],
    truths: ["Le chat dort sur la natte.", "Le chat est noir.", "Le chat aime le lait."],
    falses: ["Le chat dort dans le panier.", "Le chat est blanc.", "Le chat est très grand."],
  },
  // Niveau 2
  {
    lines: ["Cheikh ramasse des coquillages sur la plage.", "Il en trouve douze.", "Il les met dans un seau."],
    truths: ["Cheikh ramasse des coquillages.", "Cheikh trouve douze coquillages.", "Cheikh met les coquillages dans un seau."],
    falses: ["Cheikh ramasse des mangues.", "Cheikh trouve deux coquillages.", "Cheikh met les coquillages dans un sac."],
  },
  {
    lines: ["Aminata prépare du riz pour sa famille.", "Elle lave le riz avec soin.", "Elle le fait cuire une heure."],
    truths: ["Aminata prépare du riz.", "Aminata lave le riz.", "Le riz cuit une heure."],
    falses: ["Aminata prépare du pain.", "Aminata lave le linge.", "Le riz cuit dix minutes."],
  },
  {
    lines: ["Omar joue au ballon dans la cour.", "Son ami Pape joue avec lui.", "Ils gagnent le match."],
    truths: ["Omar joue au ballon.", "Pape joue avec Omar.", "Omar et Pape gagnent."],
    falses: ["Omar joue dans la rue.", "Omar joue seul.", "Omar et Pape perdent."],
  },
  // Niveau 3
  {
    lines: ["Mariama va au puits tôt le matin.", "Elle remplit deux seaux.", "Elle porte les seaux sur sa tête."],
    truths: ["Mariama va au puits.", "Mariama remplit deux seaux.", "Mariama porte les seaux sur sa tête."],
    falses: ["Mariama va au puits le soir.", "Mariama remplit un seul seau.", "Mariama porte les seaux dans ses mains."],
  },
  {
    lines: ["Le lion vit dans la savane.", "Il chasse la nuit.", "Il dort le jour sous un arbre."],
    truths: ["Le lion vit dans la savane.", "Le lion chasse la nuit.", "Le lion dort le jour."],
    falses: ["Le lion vit dans la mer.", "Le lion chasse le jour.", "Le lion dort la nuit."],
  },
  {
    lines: ["Ibrahima plante du mil au champ.", "Il creuse un petit trou pour chaque graine.", "Il arrose les graines chaque soir."],
    truths: ["Ibrahima plante du mil.", "Ibrahima creuse un trou pour chaque graine.", "Ibrahima arrose chaque soir."],
    falses: ["Ibrahima plante des tomates.", "Ibrahima jette les graines sans trou.", "Ibrahima arrose chaque matin."],
  },
  // Niveau 4
  {
    lines: ["Khady lit un livre sous un arbre.", "Le livre parle de deux singes.", "Khady rit beaucoup."],
    truths: ["Khady lit un livre.", "Khady lit sous un arbre.", "Khady rit."],
    falses: ["Khady lit dans sa case.", "Le livre parle de deux lions.", "Khady ne rit pas."],
  },
  {
    lines: ["Le car part de Dakar à huit heures.", "Il roule toute la matinée.", "Il arrive à Saint-Louis à midi."],
    truths: ["Le car part à huit heures.", "Le car roule toute la matinée.", "Le car arrive à midi."],
    falses: ["Le car part à dix heures.", "Le car roule toute la nuit.", "Le car arrive le soir."],
  },
  {
    lines: ["Penda a trois frères et deux sœurs.", "Elle est la plus petite de la famille.", "Elle aime beaucoup chanter."],
    truths: ["Penda a trois frères.", "Penda a deux sœurs.", "Penda est la plus petite."],
    falses: ["Penda a deux frères.", "Penda est la plus grande.", "Penda n'aime pas chanter."],
  },
];

const TRUE_FALSE_HINTS: Hints = ["Relis le texte doucement.", "Regarde si la phrase dit la même chose que le texte.", "Si le texte dit autre chose, la phrase est fausse."];

/** Un texte, quatre ou cinq phrases à ranger sous Vrai ou sous Faux : toutes les fausses contredisent le texte. */
export function makeCe1FrReadTrue(ctx: GameContext): GeneratedGame {
  const kind = "ce1-fr-lec-vrai";
  return sortGame(ctx, kind, READING, () => {
    const row = pickFresh(ctx, quarter(TRUE_FALSE, ctx.level), (candidate) => `${kind}:${candidate.lines[0]}`);
    const total = ctx.level <= 2 ? 4 : 5;
    const trueCount = ctx.level <= 2 ? 2 : ctx.rng() < 0.5 ? 3 : 2;
    const items = [
      ...shuffle(ctx.rng, row.truths)
        .slice(0, trueCount)
        .map((text) => ({ text, zone: "Vrai" })),
      ...shuffle(ctx.rng, row.falses)
        .slice(0, total - trueCount)
        .map((text) => ({ text, zone: "Faux" })),
    ];
    return { prompt: `${row.lines.join(" ")}\nRange chaque phrase dans Vrai ou dans Faux.`, zones: ["Vrai", "Faux"], items, hints: TRUE_FALSE_HINTS };
  });
}

// ===========================================================================
// RELIER : qui fait quoi, dans trois phrases
// ===========================================================================

const READ_PEOPLE = ["Awa", "Fatou", "Aminata", "Moussa", "Cheikh", "Omar"] as const;
const ACTIONS = [
  "achète des mangues",
  "pêche un poisson",
  "garde les moutons",
  "lave le linge",
  "plante du mil",
  "vend des oranges",
  "lit un livre",
  "joue au ballon",
  "prépare du riz",
  "chante une chanson",
  "dessine une maison",
  "arrose les fleurs",
] as const;
const ACTION_TRIOS = triples(ACTIONS);
const LINK_HINTS: Hints = ["Lis les trois phrases doucement.", "Chaque prénom fait une seule chose dans le texte.", "Commence par le prénom que tu lis en premier."];

/** « Awa pêche un poisson. Omar lit un livre. Fatou lave le linge. Relie chaque prénom à son action. » */
export function makeCe1FrReadLink(ctx: GameContext): GeneratedGame {
  const kind = "ce1-fr-lec-relier";
  return linkGame(ctx, kind, READING, () => {
    const actions = pickFresh(ctx, quarter(ACTION_TRIOS, ctx.level), (trio) => `${kind}:${trio.join("|")}`);
    const heroes = shuffle(ctx.rng, READ_PEOPLE).slice(0, 3);
    const lines = heroes.map((hero, i) => `${hero} ${actions[i]}.`);
    return {
      prompt: `${lines.join(" ")}\nRelie chaque prénom à son action.`,
      pairs: heroes.map((hero, i) => ({ left: hero, right: actions[i] })),
      hints: LINK_HINTS,
    };
  });
}

// ===========================================================================
// DE QUEL ANIMAL PARLE LE TEXTE ?
// ===========================================================================

type Animal = { name: string; clues: readonly [string, string, string] };

/** Onze animaux au catalogue d'images, chacun avec trois indices qui ne vont qu'à lui. */
const ANIMALS: readonly Animal[] = [
  { name: "l'éléphant", clues: ["Il a une très longue trompe.", "Il a de très grandes oreilles.", "Il a deux grandes défenses blanches."] },
  { name: "le lion", clues: ["Il a une grande crinière.", "Il rugit très fort.", "Il est le roi de la savane."] },
  { name: "la girafe", clues: ["Elle a un très long cou.", "Elle a des taches sur la peau.", "Elle mange les feuilles tout en haut des arbres."] },
  { name: "le poisson", clues: ["Il nage dans la mer.", "Il a des écailles brillantes.", "Il respire sous l'eau."] },
  { name: "le singe", clues: ["Il grimpe aux arbres.", "Il mange des bananes.", "Il a de longs bras."] },
  { name: "le chat", clues: ["Il miaule.", "Il a de longues moustaches.", "Il attrape les souris."] },
  { name: "le chien", clues: ["Il aboie.", "Il garde la maison.", "Il remue la queue quand il est content."] },
  { name: "la vache", clues: ["Elle meugle.", "Elle donne du lait.", "Elle a deux cornes."] },
  { name: "le cheval", clues: ["Il galope très vite.", "Il hennit.", "On peut monter sur son dos."] },
  { name: "la poule", clues: ["Elle pond des œufs.", "Elle picore des grains.", "Elle a une crête rouge sur la tête."] },
  { name: "le mouton", clues: ["Il a une laine épaisse.", "Il bêle.", "On coupe sa laine pour faire des habits."] },
];
const ANIMAL_HINTS: Hints = ["Lis les trois phrases doucement.", "Pense au corps de cet animal et à ce qu'il fait.", "Une seule bête a toutes ces choses."];

/** « Il a une très longue trompe. Il a de très grandes oreilles. Il a deux grandes défenses blanches. De quel animal parle ce texte ? » */
export function makeCe1FrReadAnimal(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce1-fr-lec-animal", READING, () => {
    const animal = pickFresh(ctx, quarter(ANIMALS, ctx.level), (candidate) => `ce1-fr-lec-animal:${candidate.name}`);
    return {
      prompt: `${animal.clues.join(" ")}\nDe quel animal parle ce texte ?`,
      answer: animal.name,
      wrong: shuffle(
        ctx.rng,
        ANIMALS.filter((other) => other !== animal).map((other) => other.name),
      ),
      hints: ANIMAL_HINTS,
    };
  });
}

// ===========================================================================
// UNE RECETTE
// ===========================================================================

type Recipe = { title: string; steps: readonly [string, string, string] };

const RECIPES: readonly Recipe[] = [
  { title: "Pour préparer le riz.", steps: ["Lave le riz dans une bassine.", "Mets le riz dans la marmite.", "Laisse cuire pendant une heure."] },
  { title: "Pour préparer un jus de bissap.", steps: ["Lave les fleurs rouges.", "Fais bouillir les fleurs dans une casserole.", "Ajoute du sucre et laisse refroidir."] },
  { title: "Pour planter une graine.", steps: ["Creuse un petit trou dans la terre.", "Mets la graine dans le trou.", "Recouvre la graine de terre et arrose."] },
  { title: "Pour se laver les mains.", steps: ["Ouvre le robinet et mouille tes mains.", "Frotte tes mains avec du savon.", "Rince tes mains et essuie-les."] },
  { title: "Pour faire une omelette.", steps: ["Casse deux œufs dans un bol.", "Bats les œufs avec une fourchette.", "Fais cuire dans une poêle chaude."] },
  { title: "Pour faire un avion en papier.", steps: ["Prends une feuille de papier.", "Plie la feuille en deux.", "Plie les coins vers le centre."] },
];

const RECIPE_QUESTIONS = ["Que faut-il faire en premier ?", "Que faut-il faire au milieu ?", "Que faut-il faire en dernier ?"] as const;
/** Les questions « en premier » d'abord, puis « au milieu », puis « en dernier » : chaque niveau lit un peu de chaque. */
const RECIPE_ROWS = RECIPE_QUESTIONS.flatMap((question, position) => RECIPES.map((recipe) => ({ recipe, position, question })));
const RECIPE_HINTS: Hints = ["Lis la recette en entier.", "Cherche le mot qui commence chaque étape.", "Il dit si c'est le début, le milieu ou la fin."];

/** « Pour préparer le riz. D'abord, lave le riz… Ensuite, … Enfin, … Que faut-il faire en premier ? » */
export function makeCe1FrReadRecipe(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce1-fr-lec-recette", READING, () => {
    const row = pickFresh(ctx, quarter(RECIPE_ROWS, ctx.level), (candidate) => `ce1-fr-lec-recette:${candidate.question}:${candidate.recipe.title}`);
    const [first, middle, last] = row.recipe.steps;
    const text = `${row.recipe.title} D'abord, ${lower(first)} Ensuite, ${lower(middle)} Enfin, ${lower(last)}`;
    return {
      prompt: `${text}\n${row.question}`,
      answer: row.recipe.steps[row.position],
      wrong: shuffle(
        ctx.rng,
        row.recipe.steps.filter((_, index) => index !== row.position),
      ),
      hints: RECIPE_HINTS,
    };
  });
}

// ===========================================================================
// LA RÈGLE D'UN JEU
// ===========================================================================

type Rule = { lines: readonly [string, string, string]; question: string; answer: string; wrong: readonly [string, string] };

const BALL = ["Pour jouer au ballon, on forme deux équipes.", "Chaque équipe a cinq joueurs.", "Il faut mettre le ballon dans le but."] as const;
const ROPE = ["Pour jouer à la corde, deux enfants tiennent la corde.", "Un troisième enfant saute.", "Il compte ses sauts à voix haute."] as const;
const HIDE = ["Pour jouer à cache-cache, un enfant ferme les yeux.", "Il compte de un à dix.", "Les autres vont se cacher."] as const;
const HOPSCOTCH = ["Pour jouer à la marelle, on dessine des cases sur le sol.", "On lance un caillou dans la première case.", "Puis on saute sur un pied."] as const;
const WOLF = ["Pour jouer au loup, un enfant est le loup.", "Il court après les autres.", "Celui que le loup touche devient le loup."] as const;
const STATUES = ["Pour jouer aux statues, tous les enfants dansent.", "Quand la musique finit, il faut rester immobile.", "Celui qui bouge a perdu."] as const;

const RULES: readonly Rule[] = [
  // Niveau 1
  { lines: BALL, question: "Combien de joueurs a chaque équipe ?", answer: "cinq joueurs", wrong: ["trois joueurs", "dix joueurs"] },
  { lines: ROPE, question: "Qui tient la corde ?", answer: "deux enfants", wrong: ["un seul enfant", "tous les enfants"] },
  { lines: HIDE, question: "Quel nombre dit-il en dernier ?", answer: "dix", wrong: ["cinq", "vingt"] },
  // Niveau 2
  { lines: HOPSCOTCH, question: "Que fait-on au début du jeu ?", answer: "on dessine des cases", wrong: ["on dessine des étoiles", "on dessine des maisons"] },
  { lines: WOLF, question: "Que fait le loup ?", answer: "il court après les autres", wrong: ["il se cache", "il compte les sauts"] },
  { lines: STATUES, question: "Que font les enfants au début ?", answer: "ils dansent", wrong: ["ils dorment", "ils chantent"] },
  // Niveau 3
  { lines: BALL, question: "Où faut-il mettre le ballon ?", answer: "dans le but", wrong: ["dans la cour", "dans un panier"] },
  { lines: ROPE, question: "Que fait l'enfant qui saute ?", answer: "il compte ses sauts", wrong: ["il chante une chanson", "il court autour"] },
  { lines: HIDE, question: "Que font les autres enfants ?", answer: "ils vont se cacher", wrong: ["ils rentrent à la maison", "ils lancent un ballon"] },
  // Niveau 4
  { lines: HOPSCOTCH, question: "Que lance-t-on dans la première case ?", answer: "on lance un caillou", wrong: ["on lance un ballon", "on lance une corde"] },
  { lines: WOLF, question: "Que devient celui que le loup touche ?", answer: "il devient le loup", wrong: ["il devient un arbre", "il devient le gagnant"] },
  { lines: STATUES, question: "Que faut-il faire quand la musique finit ?", answer: "rester immobile", wrong: ["courir très vite", "crier fort"] },
];
const RULE_HINTS: Hints = [
  "Relis le texte doucement.",
  "Souligne les mots de la question en les cherchant au fil du texte.",
  "La bonne réponse est écrite à côté de ces mots.",
];

/** « Pour jouer au ballon, on forme deux équipes. … Combien de joueurs a chaque équipe ? » : la réponse est écrite dans la règle. */
export function makeCe1FrReadRule(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce1-fr-lec-regle", READING, () => {
    const rule = pickFresh(ctx, quarter(RULES, ctx.level), (candidate) => `ce1-fr-lec-regle:${candidate.lines[0]}:${candidate.question}`);
    return { prompt: `${rule.lines.join(" ")}\n${rule.question}`, answer: rule.answer, wrong: rule.wrong, hints: RULE_HINTS };
  });
}
