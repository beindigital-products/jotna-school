/**
 * LES GABARITS DES SCIENCES DU CE1, PREMIÈRE MOITIÉ, CE QUI VIT ET CE QUI SOIGNE : comment se nourrissent les êtres vivants, la
 * respiration, les parasites et le paludisme (`sc-ce1-nutrition`, `sc-ce1-respiration`, `sc-ce1-paludisme`). L'autre moitié (les
 * substances, l'eau potable, les objets techniques) est dans `ce1Matiere.ts`.
 *
 * Sur l'échantillon de CE1, le modèle écrivait ici : « Associe chaque aliment à son effet sur la santé » dans la fiche du paludisme
 * (hors sujet), un ordre de la prévention du paludisme sans critère, « Quel aliment aide les poumons ? » (le bissap), « Nomme un
 * animal qui respire avec des branchies » (question ouverte). Ici chaque exercice lit une ligne d'un tableau FERMÉ de faits sûrs.
 *
 * CE QUE LES FICHES DONNENT, ET CE QUE CE FICHIER N'INVENTE PAS
 * - Nutrition : herbivores, carnivores, omnivores ; une chaîne alimentaire simple (herbe, mouton, lion) ; les besoins des plantes
 *   (eau, lumière, sol). Les animaux rangés sont ceux dont le régime ne se discute pas à cet âge (le mouton, le lion) ; la poule, le
 *   singe et l'homme sont les omnivores. HORS FICHE, À FAIRE RELIRE : les autres animaux nommés (zèbre, hyène, pintade…) et les
 *   chaînes qui ne sont pas celle de la fiche (mil, poule, homme ; graine, souris, serpent…).
 * - Respiration : l'homme respire avec ses poumons, par le nez et la bouche ; le poisson avec ses branchies ; air pur et air pollué
 *   (fumée, poussière). HORS FICHE, À FAIRE RELIRE : « les poumons sont dans la poitrine », « l'air est plus pur sous les arbres »,
 *   les déchets brûlés et la fumée de voiture comme polluants.
 * - Paludisme : les vers intestinaux (mains sales, aliments mal lavés) ; le paludisme se transmet par la piqûre du moustique anophèle ;
 *   se protéger (moustiquaire imprégnée, supprimer les eaux stagnantes) ; aller au dispensaire en cas de fièvre. HORS FICHE, À FAIRE
 *   RELIRE : les moustiques se développent dans l'eau stagnante, la moustiquaire se pose pour la nuit, l'infirmier soigne au dispensaire.
 *
 * RÈGLES POUR AJOUTER UNE LIGNE
 * - Une étiquette est un nom (ou une courte phrase) SEUL, avec sa majuscule, sans article quand c'est un nom (« Mouton », « Poumons »).
 * - Les énoncés n'ont aucun « : », au plus une apostrophe droite, vingt-huit mots au plus.
 * - Aucun indice n'écrit un chiffre ni un mot de quatre lettres ou plus de la bonne réponse, d'une étiquette ou d'une case.
 * - Les mauvais choix ne peuvent pas être une deuxième bonne réponse : pas de poule dans « Quel animal est un carnivore ? », pas de
 *   « on le couvre » dans « Que fait-on d'un seau d'eau qui reste dehors ? ».
 *
 * MODULE PUR (voir `types.ts`).
 */
import {
  binSort,
  FACT_STEP_HINTS,
  factChoice,
  factGap,
  factWrite,
  GESTURE_STEP_HINTS,
  partOf,
  pickPairs,
  quarter,
  stepsOrder,
  type Fact,
  type GapFact,
  type Steps,
  type WriteFact,
} from "./ce1SciencesOutils";
import { pick, pickFresh, shuffle, type GameContext, type GeneratedGame } from "./shared";
import { choiceGame, linkGame, type Hints } from "./tableaux";

// ===========================================================================
// COMMENT SE NOURRISSENT LES ÊTRES VIVANTS (sc-ce1-nutrition)
// ===========================================================================

type Diet = "herbivore" | "carnivore" | "omnivore";

/** Un animal, son nom avec article (« le lion », « l'âne ») et son régime. */
type Animal = { name: string; the: string; diet: Diet };

const ANIMALS: readonly Animal[] = [
  { name: "Mouton", the: "le mouton", diet: "herbivore" },
  { name: "Vache", the: "la vache", diet: "herbivore" },
  { name: "Chèvre", the: "la chèvre", diet: "herbivore" },
  { name: "Cheval", the: "le cheval", diet: "herbivore" },
  { name: "Âne", the: "l'âne", diet: "herbivore" },
  { name: "Zèbre", the: "le zèbre", diet: "herbivore" },
  { name: "Girafe", the: "la girafe", diet: "herbivore" },
  { name: "Éléphant", the: "l'éléphant", diet: "herbivore" },
  { name: "Lapin", the: "le lapin", diet: "herbivore" },
  { name: "Lion", the: "le lion", diet: "carnivore" },
  { name: "Léopard", the: "le léopard", diet: "carnivore" },
  { name: "Hyène", the: "la hyène", diet: "carnivore" },
  { name: "Crocodile", the: "le crocodile", diet: "carnivore" },
  { name: "Aigle", the: "l'aigle", diet: "carnivore" },
  { name: "Serpent", the: "le serpent", diet: "carnivore" },
  { name: "Chat", the: "le chat", diet: "carnivore" },
  { name: "Homme", the: "l'homme", diet: "omnivore" },
  { name: "Poule", the: "la poule", diet: "omnivore" },
  { name: "Singe", the: "le singe", diet: "omnivore" },
  { name: "Rat", the: "le rat", diet: "omnivore" },
  { name: "Pintade", the: "la pintade", diet: "omnivore" },
  { name: "Corbeau", the: "le corbeau", diet: "omnivore" },
];

const OF_DIET = (diet: Diet) => ANIMALS.filter((animal) => animal.diet === diet);
const HERBIVORES = OF_DIET("herbivore");
const CARNIVORES = OF_DIET("carnivore");
const OMNIVORES = OF_DIET("omnivore");

/** Le mot d'un régime, comme une étiquette ou un choix l'écrit. */
const DIET_WORD: Record<Diet, string> = { herbivore: "Herbivore", carnivore: "Carnivore", omnivore: "Omnivore" };

/** « Quel animal est un herbivore ? » : un animal du régime demandé, parmi trois. Les mauvais choix ne sont jamais discutables. */
export function makeCe1NutritionDietChoice(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce1-nutri-regime-qcm", "reconnaître un régime alimentaire", () => {
    const animal = pickFresh(ctx, quarter(ANIMALS, ctx.level, 1), (candidate) => `ce1-nutri-regime-qcm:${candidate.name}`);
    // Un herbivore se cherche parmi des carnivores, un carnivore parmi des herbivores : la poule ou l'homme y seraient discutables.
    const others =
      animal.diet === "herbivore"
        ? shuffle(ctx.rng, CARNIVORES).slice(0, 2)
        : animal.diet === "carnivore"
          ? shuffle(ctx.rng, HERBIVORES).slice(0, 2)
          : [pick(ctx.rng, HERBIVORES), pick(ctx.rng, CARNIVORES)];
    return {
      prompt: `Quel animal est un ${animal.diet} ?`,
      answer: animal.name,
      wrong: others.map((other) => other.name),
      hints: [
        "Pense à ce que chaque animal met dans sa bouche pour vivre.",
        "Un animal peut manger des plantes, de la viande, ou un peu des deux.",
        "Regarde les trois animaux et imagine le repas de chacun.",
      ],
    };
  });
}

/** Les définitions des trois régimes. */
const DIET_DEFINITIONS: readonly { question: string; diet: Diet }[] = [
  { question: "Comment appelle-t-on un animal qui mange seulement des plantes ?", diet: "herbivore" },
  { question: "Comment appelle-t-on un animal qui mange seulement de la viande ?", diet: "carnivore" },
  { question: "Comment appelle-t-on un animal qui mange des plantes et de la viande ?", diet: "omnivore" },
];

/** « Comment appelle-t-on un animal qui mange seulement des plantes ? » ou « Quel mot dit comment le lion se nourrit ? » : le mot du régime. */
export function makeCe1NutritionDietWord(ctx: GameContext): GeneratedGame {
  type Entry = { question: string; diet: Diet; key: string };
  const entries: Entry[] = [
    ...ANIMALS.map((animal) => ({ question: `Quel mot dit comment ${animal.the} se nourrit ?`, diet: animal.diet, key: animal.name })),
    ...DIET_DEFINITIONS.map((definition) => ({ ...definition, key: definition.diet })),
  ];
  return choiceGame(ctx, "ce1-nutri-mot-qcm", "nommer un régime alimentaire", () => {
    const entry = pickFresh(ctx, quarter(entries, ctx.level, 1), (candidate) => `ce1-nutri-mot-qcm:${candidate.key}`);
    const wrong = (["herbivore", "carnivore", "omnivore"] as const).filter((diet) => diet !== entry.diet).map((diet) => DIET_WORD[diet]);
    return {
      prompt: entry.question,
      answer: DIET_WORD[entry.diet],
      wrong,
      hints: [
        "Il y a un mot pour chaque façon de se nourrir.",
        "Pense à ce que l'animal mange : des plantes, de la viande, ou les deux.",
        "Imagine son repas et cherche le mot qui lui va.",
      ],
    };
  });
}

/** Ce que mangent ceux dont le repas ne se discute pas. */
const FOODS: readonly { animal: Animal; food: string; other: string }[] = [
  ...["Mouton", "Vache", "Cheval", "Chèvre", "Âne", "Zèbre"].map((name) => ({ animal: ANIMALS.find((a) => a.name === name)!, food: "Herbe", other: "Viande" })),
  ...["Lion", "Léopard", "Hyène"].map((name) => ({ animal: ANIMALS.find((a) => a.name === name)!, food: "Viande", other: "Herbe" })),
];

/** « Que mange le mouton ? » : de l'herbe pour un brouteur, de la viande pour un chasseur. */
export function makeCe1NutritionFood(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce1-nutri-mange-qcm", "ce que mange un animal", () => {
    const entry = pickFresh(ctx, quarter(FOODS, ctx.level, 1), (candidate) => `ce1-nutri-mange-qcm:${candidate.animal.name}`);
    return {
      prompt: `Que mange ${entry.animal.the} ?`,
      answer: entry.food,
      wrong: [entry.other, "Pierres"],
      hints: [
        "Pense à la façon dont cet animal se nourrit.",
        "Certains animaux broutent, d'autres chassent.",
        "Regarde ses dents et imagine ce qu'il avale.",
      ],
    };
  });
}

/** « Glisse chaque animal dans la bonne case » : des brouteurs et des chasseurs. */
export function makeCe1NutritionDietSort(ctx: GameContext): GeneratedGame {
  return binSort(
    ctx,
    "ce1-nutri-regime-glisser",
    "ranger des animaux selon leur régime",
    "Glisse chaque animal dans la bonne case.",
    { zone: "Herbivores", tiles: HERBIVORES.map((animal) => animal.name) },
    { zone: "Carnivores", tiles: CARNIVORES.map((animal) => animal.name) },
    [
      "Pense à ce que chaque animal mange.",
      "Certains animaux broutent, d'autres attrapent d'autres animaux.",
      "Un animal qui attrape sa nourriture a souvent des dents pointues.",
    ],
  );
}

/** « Relie chaque animal à sa façon de se nourrir » : un herbivore, un carnivore, un omnivore. */
export function makeCe1NutritionDietLink(ctx: GameContext): GeneratedGame {
  return linkGame(ctx, "ce1-nutri-regime-relier", "relier un animal à son régime", () => {
    const herbivore = pickFresh(ctx, quarter(HERBIVORES, ctx.level, 1), (animal) => `ce1-nutri-regime-relier:${animal.name}`);
    const carnivore = pickFresh(ctx, quarter(CARNIVORES, ctx.level, 1), (animal) => `ce1-nutri-regime-relier:${animal.name}`);
    const omnivore = pickFresh(ctx, quarter(OMNIVORES, ctx.level, 1), (animal) => `ce1-nutri-regime-relier:${animal.name}`);
    return {
      prompt: "Relie chaque animal à sa façon de se nourrir.",
      pairs: shuffle(ctx.rng, [herbivore, carnivore, omnivore]).map((animal) => ({ left: animal.name, right: DIET_WORD[animal.diet] })),
      hints: [
        "Cherche, pour chaque animal, ce qu'il mange le plus souvent.",
        "Trois mots sont à relier, un pour chaque animal.",
        "Un des animaux mange de tout, comme toi.",
      ],
    };
  });
}

// --- La chaîne alimentaire ---------------------------------------------------

/** Un maillon d'une chaîne : son étiquette et son nom avec article. */
type Link = { tile: string; the: string };
const LINK = {
  herbe: { tile: "Herbe", the: "l'herbe" },
  mouton: { tile: "Mouton", the: "le mouton" },
  lion: { tile: "Lion", the: "le lion" },
  zebre: { tile: "Zèbre", the: "le zèbre" },
  sauterelle: { tile: "Sauterelle", the: "la sauterelle" },
  criquet: { tile: "Criquet", the: "le criquet" },
  poule: { tile: "Poule", the: "la poule" },
  mil: { tile: "Mil", the: "le mil" },
  homme: { tile: "Homme", the: "l'homme" },
  graine: { tile: "Graine", the: "la graine" },
  souris: { tile: "Souris", the: "la souris" },
  serpent: { tile: "Serpent", the: "le serpent" },
  lapin: { tile: "Lapin", the: "le lapin" },
  aigle: { tile: "Aigle", the: "l'aigle" },
  vache: { tile: "Vache", the: "la vache" },
  feuille: { tile: "Feuille", the: "la feuille" },
  chenille: { tile: "Chenille", the: "la chenille" },
  oiseau: { tile: "Oiseau", the: "l'oiseau" },
} satisfies Record<string, Link>;

/** Une chaîne alimentaire : chaque maillon est mangé par le suivant. */
const CHAINS_SHORT: readonly (readonly Link[])[] = [
  [LINK.herbe, LINK.mouton, LINK.lion],
  [LINK.herbe, LINK.zebre, LINK.lion],
  [LINK.herbe, LINK.sauterelle, LINK.poule],
  [LINK.mil, LINK.poule, LINK.homme],
  [LINK.herbe, LINK.mouton, LINK.homme],
  [LINK.graine, LINK.souris, LINK.serpent],
  [LINK.herbe, LINK.lapin, LINK.aigle],
  [LINK.herbe, LINK.vache, LINK.homme],
  [LINK.feuille, LINK.chenille, LINK.oiseau],
];
const CHAINS_LONG: readonly (readonly Link[])[] = [
  [LINK.herbe, LINK.criquet, LINK.poule, LINK.homme],
  [LINK.herbe, LINK.sauterelle, LINK.poule, LINK.homme],
  [LINK.graine, LINK.souris, LINK.serpent, LINK.aigle],
  [LINK.feuille, LINK.chenille, LINK.oiseau, LINK.aigle],
  [LINK.herbe, LINK.lapin, LINK.serpent, LINK.aigle],
  [LINK.mil, LINK.criquet, LINK.poule, LINK.homme],
];

/** Les chaînes d'un niveau : trois maillons aux deux premiers niveaux, quatre ensuite, jamais les mêmes d'un palier à l'autre. */
const chainsFor = (ctx: GameContext) => (ctx.level <= 2 ? partOf(CHAINS_SHORT, ctx.level - 1, 2) : partOf(CHAINS_LONG, ctx.level - 3, 2));
const chainKey = (chain: readonly Link[]) => chain.map((link) => link.tile).join("-");

/** « Range cette chaîne alimentaire » : de ce qui est mangé en premier à celui qui mange en dernier. */
export function makeCe1NutritionChainOrder(ctx: GameContext): GeneratedGame {
  const steps: Steps[] = chainsFor(ctx).map((chain) => ({
    prompt: "Range cette chaîne alimentaire, de ce qui est mangé en premier à celui qui mange en dernier.",
    sequence: chain.map((link) => link.tile),
    hints: [
      // Jamais « qui mange le plus termine la chaîne » : c'est faux (la vache mange plus que l'homme).
      "La chaîne commence par une plante ou un morceau de plante, qui ne mange personne.",
      "Chaque maillon est mangé par celui qui vient juste après.",
      "Le dernier mange celui qui le précède, et personne ne le mange dans la chaîne.",
    ],
  }));
  return stepsOrder(ctx, "ce1-nutri-chaine-ordre", "ranger une chaîne alimentaire", steps);
}

/** Ce qui ne mange ni n'est mangé dans une chaîne : jamais une bonne réponse. */
const DECOYS = ["Eau", "Soleil"] as const;

/** « Dans la chaîne herbe, mouton, lion, qui mange le mouton ? » ou « Qui est mangé par le lion ? » : le voisin dans la chaîne. */
export function makeCe1NutritionChainChoice(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce1-nutri-chaine-qcm", "lire une chaîne alimentaire", () => {
    const chain = pickFresh(ctx, chainsFor(ctx), (candidate) => `ce1-nutri-chaine-qcm:${chainKey(candidate)}`);
    const shown = chain.map((link) => link.tile.toLowerCase()).join(", ");
    const last = chain.length - 1;
    // Qui MANGE le maillon `index` (le suivant), ou qui est MANGÉ par lui (le précédent).
    const eater = ctx.rng() < 0.5;
    const index = eater ? Math.floor(ctx.rng() * last) : 1 + Math.floor(ctx.rng() * last);
    const answer = eater ? chain[index + 1] : chain[index - 1];
    const neighbour = eater ? chain[index - 1] : chain[index + 1];
    const decoys = shuffle(ctx.rng, DECOYS);
    return {
      prompt: eater
        ? `Dans la chaîne alimentaire ${shown}, qui mange ${chain[index].the} ?`
        : `Dans la chaîne alimentaire ${shown}, qui est mangé par ${chain[index].the} ?`,
      answer: answer.tile,
      wrong: neighbour ? [neighbour.tile, decoys[0]] : [decoys[0], decoys[1]],
      hints: [
        "Lis la chaîne du début à la fin, dans l'ordre où elle est écrite.",
        "Chaque maillon est mangé par celui qui vient juste après lui.",
        "Cherche le voisin de cet être vivant, de l'autre côté de la flèche.",
      ],
    };
  });
}

// --- Les besoins des plantes -------------------------------------------------

const PLANT_FACTS: readonly Fact[] = [
  {
    question: "Que faut-il donner à une plante pour qu'elle grandisse ?",
    answer: "Eau",
    wrong: ["Sable sec", "Cailloux"],
    hints: ["Pense à ce que la plante boit.", "Quand il ne pleut pas, on arrose les plantes.", "C'est un liquide qui coule du robinet."],
  },
  {
    question: "Qu'est-ce que le soleil donne à une plante ?",
    answer: "Lumière",
    wrong: ["Viande", "Sel"],
    hints: ["Pense à ce que le soleil envoie sur la terre.", "On voit clair grâce à cela.", "Une plante qui reste dans l'obscurité a du mal à pousser."],
  },
  {
    question: "Où les racines prennent-elles l'eau ?",
    answer: "Dans le sol",
    wrong: ["Dans le ciel", "Dans le vent"],
    hints: ["Les racines sont cachées sous la surface.", "Elles s'enfoncent là où la plante est plantée.", "C'est la terre qui porte la plante."],
  },
  {
    question: "Une plante reste dans le noir. Que lui manque-t-il ?",
    answer: "Lumière",
    wrong: ["Viande", "Cailloux"],
    hints: ["Pense à ce que le soleil envoie.", "Le noir est le contraire de cela.", "Une plante en a besoin pour bien pousser."],
  },
  {
    question: "Une plante n'est jamais arrosée. Que lui manque-t-il ?",
    answer: "Eau",
    wrong: ["Viande", "Plastique"],
    hints: ["Arroser, c'est lui donner à boire.", "La pluie lui en donne aussi.", "Sans elle, la plante se dessèche."],
  },
  {
    question: "Une plante est posée sur du béton, sans terre. Que lui manque-t-il ?",
    answer: "Terre",
    wrong: ["Viande", "Plastique"],
    hints: ["Les racines n'ont nulle part où s'enfoncer.", "La plante a besoin de quelque chose pour tenir et se nourrir.", "On la plante habituellement dans cela."],
  },
  {
    question: "De quoi une plante a-t-elle besoin pour vivre ?",
    answer: "D'eau, de lumière et de sol",
    wrong: ["De sel, de viande et de sable", "De sucre, de pierre et de lait"],
    hints: ["Pense à ce qu'on donne à une plante au jardin.", "Trois choses sont nécessaires, une qui vient du ciel.", "Une des trois s'arrose, une autre éclaire, une autre porte."],
  },
  {
    question: "Que fait le jardinier pour aider ses plantes à grandir ?",
    answer: "Il les arrose",
    wrong: ["Il les cache dans le noir", "Il les couvre de cailloux"],
    hints: ["Pense au geste que l'on fait avec un arrosoir.", "Il leur donne à boire.", "Le jardinier prend soin des plantes chaque jour."],
  },
];

/** « Que faut-il donner à une plante pour qu'elle grandisse ? » : l'eau, la lumière ou le sol. */
export function makeCe1PlantNeedChoice(ctx: GameContext): GeneratedGame {
  return factChoice(ctx, "ce1-nutri-plante-qcm", "les besoins d'une plante", PLANT_FACTS);
}

const PLANT_GAPS: readonly GapFact[] = [
  {
    text: "Pour grandir, une plante a besoin de lumière, de sol et d'___.",
    answer: "eau",
    wrong: ["huile", "encre"],
    hints: ["Pense à ce qu'on verse sur une plante.", "Quand il pleut, la plante en reçoit.", "C'est un liquide, on le boit aussi."],
  },
  {
    text: "Pour grandir, une plante a besoin d'eau, de sol et de ___.",
    answer: "lumière",
    wrong: ["viande", "sable"],
    hints: ["Elle vient du soleil.", "Dans le noir, la plante n'en reçoit pas.", "Elle éclaire le jour."],
  },
  {
    text: "Pour grandir, une plante a besoin d'eau, de lumière et de ___.",
    answer: "sol",
    wrong: ["viande", "plastique"],
    hints: ["Les racines y sont enfoncées.", "On le creuse pour planter.", "C'est la terre du jardin."],
  },
  {
    text: "Les racines d'une plante boivent l'eau du ___.",
    answer: "sol",
    wrong: ["ciel", "vent"],
    hints: ["Les racines sont dedans.", "Il est sous nos pieds.", "On y plante les graines."],
  },
  {
    text: "La plante reçoit sa lumière du ___.",
    answer: "soleil",
    wrong: ["sable", "vent"],
    hints: ["Il brille dans le ciel le jour.", "Il se lève à l'est.", "Il est chaud et lumineux."],
  },
  {
    text: "Une plante sans eau ne peut pas ___.",
    answer: "grandir",
    wrong: ["courir", "chanter"],
    hints: ["Pense à ce que fait une graine qui pousse.", "Une plante qui reçoit ce qu'il faut devient plus haute.", "Une plante ne court ni ne chante."],
  },
];

/** « Pour grandir, une plante a besoin de lumière, de sol et d'___ » : le besoin qui manque. */
export function makeCe1PlantNeedGap(ctx: GameContext): GeneratedGame {
  return factGap(ctx, "ce1-nutri-plante-trou", "compléter les besoins d'une plante", PLANT_GAPS);
}

/** « Glisse chaque chose dans la bonne case » : ce qui aide une plante, et ce qui ne l'aide pas. */
export function makeCe1PlantNeedSort(ctx: GameContext): GeneratedGame {
  return binSort(
    ctx,
    "ce1-nutri-plante-glisser",
    "ranger ce qui aide une plante à grandir",
    "Glisse chaque chose dans la bonne case.",
    { zone: "Aide la plante", tiles: ["Eau", "Lumière", "Soleil", "Terre", "Pluie"] },
    { zone: "N'aide pas la plante", tiles: ["Cailloux", "Plastique", "Viande", "Béton", "Ferraille"] },
    [
      "Pense à ce qu'une graine reçoit pour pousser.",
      "Il faut boire, recevoir de la clarté et s'enfoncer dans quelque chose.",
      // Pas « ce qui ne vit pas ne la nourrit pas » : la lumière et la terre ne vivent pas, et elles l'aident.
      "Une graine ne mange pas comme un animal, et les pierres ou les objets fabriqués ne la font pas pousser.",
    ],
  );
}

// ===========================================================================
// LA RESPIRATION (sc-ce1-respiration)
// ===========================================================================

type Breather = { name: string; the: string; organ: "Poumons" | "Branchies" };

const BREATHERS: readonly Breather[] = [
  { name: "Homme", the: "l'homme", organ: "Poumons" },
  { name: "Chien", the: "le chien", organ: "Poumons" },
  { name: "Vache", the: "la vache", organ: "Poumons" },
  { name: "Poule", the: "la poule", organ: "Poumons" },
  { name: "Mouton", the: "le mouton", organ: "Poumons" },
  { name: "Chat", the: "le chat", organ: "Poumons" },
  { name: "Cheval", the: "le cheval", organ: "Poumons" },
  { name: "Lion", the: "le lion", organ: "Poumons" },
  { name: "Poisson", the: "le poisson", organ: "Branchies" },
  { name: "Sardine", the: "la sardine", organ: "Branchies" },
  { name: "Thiof", the: "le thiof", organ: "Branchies" },
  { name: "Requin", the: "le requin", organ: "Branchies" },
];
const WITH_LUNGS = BREATHERS.filter((breather) => breather.organ === "Poumons");
const WITH_GILLS = BREATHERS.filter((breather) => breather.organ === "Branchies");

const ORGAN_HINTS: Record<Breather["organ"], Hints> = {
  Poumons: [
    "Pense à l'endroit où vit cet animal.",
    "Les animaux qui vivent sur la terre respirent l'air qui les entoure.",
    "Cet organe se gonfle quand on prend de l'air.",
  ],
  Branchies: [
    "Pense à l'endroit où vit cet animal.",
    "Un animal qui vit dans l'eau n'a pas de nez comme le nôtre.",
    "De fines lames de chaque côté de la tête prennent l'air qui est dans l'eau.",
  ],
};

/** « Avec quoi respire le poisson ? » : les poumons ou les branchies, parmi trois parties du corps. */
export function makeCe1BreathOrganChoice(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce1-resp-organe-qcm", "avec quoi un animal respire", () => {
    const breather = pickFresh(ctx, quarter(BREATHERS, ctx.level, 1), (candidate) => `ce1-resp-organe-qcm:${candidate.name}`);
    const other = breather.organ === "Poumons" ? "Branchies" : "Poumons";
    return {
      prompt: `Avec quoi respire ${breather.the} ?`,
      answer: breather.organ,
      wrong: [other, "Oreilles"],
      hints: ORGAN_HINTS[breather.organ],
    };
  });
}

/** « Quel animal respire avec des branchies ? » : un poisson parmi des animaux de la terre, ou l'inverse. */
export function makeCe1BreathAnimalChoice(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce1-resp-organe-nom", "quel animal respire avec quel organe", () => {
    const breather = pickFresh(ctx, quarter(BREATHERS, ctx.level, 1), (candidate) => `ce1-resp-organe-nom:${candidate.name}`);
    const others = breather.organ === "Poumons" ? shuffle(ctx.rng, WITH_GILLS) : shuffle(ctx.rng, WITH_LUNGS);
    return {
      prompt: `Quel animal respire avec des ${breather.organ.toLowerCase()} ?`,
      answer: breather.name,
      wrong: others.slice(0, 2).map((other) => other.name),
      hints: [
        "Pense à l'endroit où chaque animal vit.",
        "Un animal de la terre respire autrement qu'un animal de l'eau.",
        "Les deux autres animaux respirent d'une autre façon.",
      ],
    };
  });
}

/** « Glisse chaque animal dans la case de l'organe avec lequel il respire. » */
export function makeCe1BreathSort(ctx: GameContext): GeneratedGame {
  return binSort(
    ctx,
    "ce1-resp-organe-glisser",
    "ranger des animaux selon leur organe de respiration",
    "Glisse chaque animal dans la case de l'organe avec lequel il respire.",
    { zone: "Poumons", tiles: WITH_LUNGS.map((breather) => breather.name) },
    { zone: "Branchies", tiles: WITH_GILLS.map((breather) => breather.name) },
    [
      "Pense à l'endroit où chaque animal vit.",
      "Les animaux de l'eau n'ont pas de nez comme le nôtre.",
      "Un animal que l'on pêche respire autrement que celui qui marche.",
    ],
  );
}

const BREATH_FACTS: readonly Fact[] = [
  {
    question: "Par où l'air entre-t-il dans ton corps ?",
    answer: "Par le nez et la bouche",
    wrong: ["Par les yeux et les mains", "Par les oreilles et les pieds"],
    hints: ["Pense à ce que tu fais quand tu respires fort.", "L'air passe par le visage.", "Tu peux le sentir entrer au milieu du visage."],
  },
  {
    question: "Quels organes reçoivent l'air quand tu respires ?",
    answer: "Poumons",
    wrong: ["Dents", "Ongles"],
    hints: ["Ils se gonflent quand tu prends de l'air.", "Ils sont cachés à l'intérieur du corps.", "L'homme respire avec eux."],
  },
  {
    question: "Où se trouvent les poumons ?",
    answer: "Dans la poitrine",
    wrong: ["Dans les jambes", "Dans la tête"],
    hints: ["Mets ta main au milieu du corps, en haut.", "Ils sont entre le cou et le ventre.", "Ils bougent quand tu respires fort."],
  },
  {
    question: "Que fait le poisson avec ses branchies ?",
    answer: "Il respire dans l'eau",
    wrong: ["Il mange le sable", "Il écoute les bruits"],
    hints: ["Elles sont de chaque côté de sa tête.", "Un poisson vit sous l'eau.", "Elles lui servent à prendre l'air de l'eau."],
  },
  {
    question: "Que fait l'homme avec ses poumons ?",
    answer: "Il respire l'air",
    wrong: ["Il digère le riz", "Il écoute la radio"],
    hints: ["Pense à ce que tu fais sans arrêt, jour et nuit.", "Ils reçoivent ce qui entre par le nez.", "Ils se gonflent puis se vident."],
  },
  {
    question: "Où vaut-il mieux aller pour respirer un air pur ?",
    answer: "Sous les arbres",
    wrong: ["Près d'un feu de déchets", "Dans un nuage de poussière"],
    hints: ["Pense à un endroit calme et propre.", "Un air sale se voit parfois à sa couleur.", "Les plantes rendent l'air meilleur."],
  },
];

/** « Par où l'air entre-t-il dans ton corps ? » : une question de cours, une seule bonne réponse. */
export function makeCe1BreathFactChoice(ctx: GameContext): GeneratedGame {
  return factChoice(ctx, "ce1-resp-voie-qcm", "comprendre la respiration", BREATH_FACTS);
}

const POLLUTERS = ["Fumée", "Poussière", "Déchets brûlés"] as const;
/**
 * Ce qui ne salit pas l'air, et le garde propre. Pas le vent : l'harmattan soulève la poussière, donc
 * « le vent garde l'air propre » se discute.
 */
const CLEAN = ["Pluie", "Arbres", "Plantes"] as const;

/** Les indices quand la bonne réponse salit l'air (« Quelle chose pollue l'air ? »). */
const POLLUTER_HINTS = [
  "Pense à ce qui rend l'air difficile à respirer.",
  "Cela se voit parfois dans l'air et fait tousser.",
  "Les deux autres choix ne salissent pas l'air.",
] as const;
/** Les indices quand la bonne réponse ne salit pas l'air : les deux autres choix, eux, le salissent. */
const CLEAN_HINTS = [
  "Pense à ce qui rend l'air bon à respirer.",
  "Cette chose tombe du ciel ou pousse dans la terre.",
  "Les deux autres choix salissent l'air.",
] as const;

/** « Qu'est-ce qui pollue l'air ? » ou « Qu'est-ce qui ne pollue pas l'air ? » : la fumée et la poussière parmi ce qui ne salit pas. */
export function makeCe1AirChoice(ctx: GameContext): GeneratedGame {
  type Entry = { question: string; answer: string; wrong: readonly string[]; hints: readonly [string, string, string] };
  const entries: Entry[] = [
    ...POLLUTERS.map((answer) => ({ question: "Quelle chose pollue l'air ?", answer, wrong: shuffle(ctx.rng, CLEAN).slice(0, 2), hints: POLLUTER_HINTS })),
    ...CLEAN.map((answer) => ({ question: "Quelle chose ne pollue pas l'air ?", answer, wrong: shuffle(ctx.rng, POLLUTERS).slice(0, 2), hints: CLEAN_HINTS })),
    ...POLLUTERS.map((answer) => ({ question: "Quelle chose rend l'air sale ?", answer, wrong: shuffle(ctx.rng, CLEAN).slice(0, 2), hints: POLLUTER_HINTS })),
    ...CLEAN.map((answer) => ({ question: "Quelle chose garde l'air propre ?", answer, wrong: shuffle(ctx.rng, POLLUTERS).slice(0, 2), hints: CLEAN_HINTS })),
  ];
  return choiceGame(ctx, "ce1-resp-air-qcm", "air pur et air pollué", () => {
    const entry = pickFresh(ctx, quarter(entries, ctx.level, 1), (candidate) => `ce1-resp-air-qcm:${candidate.question}:${candidate.answer}`);
    return { prompt: entry.question, answer: entry.answer, wrong: entry.wrong, hints: [...entry.hints] };
  });
}

/** « Glisse chaque chose dans la bonne case » : ce qui pollue l'air, et ce qui ne le pollue pas. */
export function makeCe1AirSort(ctx: GameContext): GeneratedGame {
  return binSort(
    ctx,
    "ce1-resp-air-glisser",
    "ranger ce qui pollue l'air",
    "Glisse chaque chose dans la bonne case.",
    { zone: "Pollue l'air", tiles: ["Fumée noire", "Poussière", "Déchets brûlés", "Fumée de voiture"] },
    { zone: "Ne pollue pas l'air", tiles: ["Vent", "Pluie", "Arbres", "Herbe", "Nuage"] },
    [
      "Pense à ce qui rend l'air difficile à respirer.",
      "Ce qui salit l'air pique la gorge.",
      "La nature ne salit pas l'air, mais certains gestes de l'homme, si.",
    ],
  );
}

/** Ce que l'on relie : un mot de la respiration et ce qu'il veut dire. */
const BREATH_PAIRS: readonly (readonly [string, string])[] = [
  ["Poumons", "L'homme respire avec eux"],
  ["Branchies", "Le poisson respire avec elles"],
  ["Nez", "L'air y entre quand on respire"],
  ["Fumée", "Elle rend l'air pollué"],
  ["Air pur", "Il fait du bien quand on respire"],
];

/** « Relie chaque mot à ce qu'il veut dire. » */
export function makeCe1BreathLink(ctx: GameContext): GeneratedGame {
  return pickPairs(ctx, "ce1-resp-relier", "relier les mots de la respiration", "Relie chaque mot à ce qu'il veut dire.", BREATH_PAIRS, [
    "Lis d'abord chaque explication, puis cherche le mot qui lui va.",
    "Un mot parle d'un animal, un autre du corps, un autre de l'air.",
    "Commence par la paire dont tu es le plus sûr.",
  ]);
}

const BREATH_GAPS: readonly GapFact[] = [
  {
    text: "L'homme respire avec ses ___.",
    answer: "poumons",
    wrong: ["branchies", "oreilles"],
    hints: ["Ils se gonflent à l'intérieur de la poitrine.", "Pense à ce qui reçoit l'air.", "Ce ne sont pas des lames, mais des sortes de sacs."],
  },
  {
    text: "Le poisson respire avec ses ___.",
    answer: "branchies",
    wrong: ["poumons", "yeux"],
    hints: ["Elles sont de chaque côté de sa tête.", "Un poisson n'a pas de nez comme le nôtre.", "Ce sont de fines lames rouges."],
  },
  {
    text: "L'air entre dans le corps par le nez et la ___.",
    answer: "bouche",
    wrong: ["main", "oreille"],
    hints: ["Tu peux l'ouvrir pour respirer.", "Elle sert aussi à parler et à manger.", "Elle est sous le nez."],
  },
  {
    text: "La ___ noire rend l'air pollué.",
    answer: "fumée",
    wrong: ["pluie", "herbe"],
    hints: ["Elle s'élève d'un feu.", "On la voit monter dans le ciel.", "Elle fait tousser quand on la respire."],
  },
  {
    text: "Sous les arbres, l'air est plus ___.",
    answer: "pur",
    wrong: ["pollué", "sale"],
    hints: ["C'est le contraire d'un air qui fait tousser.", "On respire mieux dans un air comme celui-là.", "Les plantes l'aident à rester ainsi."],
  },
  {
    text: "Quand l'air est plein de poussière, il est ___.",
    answer: "pollué",
    wrong: ["pur", "frais"],
    hints: ["Il est devenu sale.", "Ce n'est pas bon pour la gorge.", "C'est le contraire d'un air pur."],
  },
  {
    text: "Un thiof respire avec ses ___.",
    answer: "branchies",
    wrong: ["poumons", "pattes"],
    hints: ["Un thiof vit dans la mer.", "Il n'a pas de nez comme le nôtre.", "Elles sont de chaque côté de sa tête."],
  },
  {
    text: "L'air que l'on respire va jusqu'aux ___.",
    answer: "poumons",
    wrong: ["genoux", "dents"],
    hints: ["Ils sont dans la poitrine.", "Ils se gonflent quand tu inspires.", "Ils servent à respirer."],
  },
];

/** « L'homme respire avec ses ___. » : le mot qui complète, deux fois par palier. */
export function makeCe1BreathGap(ctx: GameContext): GeneratedGame {
  return factGap(ctx, "ce1-resp-trou", "compléter une phrase sur la respiration", BREATH_GAPS, 2);
}

const lungs = ["poumons", "des poumons", "ses poumons", "les poumons"] as const;
const gills = ["branchies", "des branchies", "ses branchies", "les branchies"] as const;
const BREATH_WRITES: readonly WriteFact[] = [
  { prompt: "Avec quoi un poisson respire-t-il ? Écris le mot.", accepted: gills, hints: ["Pense à l'endroit où vit le poisson.", "Lis bien la question avant d'écrire.", "Le mot commence par la lettre b."] },
  { prompt: "Avec quoi un chien respire-t-il ? Écris le mot.", accepted: lungs, hints: ["Un chien vit sur la terre.", "Lis bien la question avant d'écrire.", "Le mot commence par la lettre p."] },
  { prompt: "Avec quoi une sardine respire-t-elle ? Écris le mot.", accepted: gills, hints: ["Une sardine vit dans la mer.", "Lis bien la question avant d'écrire.", "Le mot commence par la lettre b."] },
  { prompt: "Avec quoi un enfant respire-t-il ? Écris le mot.", accepted: lungs, hints: ["Pense à ce qui se gonfle dans ta poitrine.", "Lis bien la question avant d'écrire.", "Le mot commence par la lettre p."] },
  { prompt: "Avec quoi un requin respire-t-il ? Écris le mot.", accepted: gills, hints: ["Un requin vit dans l'eau.", "Lis bien la question avant d'écrire.", "Le mot commence par la lettre b."] },
  { prompt: "Avec quoi une vache respire-t-elle ? Écris le mot.", accepted: lungs, hints: ["Une vache vit sur la terre.", "Lis bien la question avant d'écrire.", "Le mot commence par la lettre p."] },
  { prompt: "Avec quoi un thiof respire-t-il ? Écris le mot.", accepted: gills, hints: ["Un thiof est un poisson de la mer.", "Lis bien la question avant d'écrire.", "Le mot commence par la lettre b."] },
  { prompt: "Avec quoi un cheval respire-t-il ? Écris le mot.", accepted: lungs, hints: ["Un cheval vit sur la terre.", "Lis bien la question avant d'écrire.", "Le mot commence par la lettre p."] },
];

/** « Avec quoi un poisson respire-t-il ? Écris le mot. » : un mot à écrire, de la liste fermée. */
export function makeCe1BreathWrite(ctx: GameContext): GeneratedGame {
  return factWrite(ctx, "ce1-resp-ecrire", "écrire l'organe de la respiration", BREATH_WRITES);
}

// ===========================================================================
// LES PARASITES ET LE PALUDISME (sc-ce1-paludisme)
// ===========================================================================

const MALARIA_CAUSES: readonly Fact[] = [
  {
    question: "Quel petit animal transmet le paludisme ?",
    answer: "Moustique",
    wrong: ["Mouche", "Fourmi"],
    hints: ["Il vole et il pique.", "On l'entend bourdonner la nuit.", "Il aime les endroits où l'eau reste sans bouger."],
  },
  {
    question: "Le paludisme se transmet par la piqûre de quel animal ?",
    answer: "Moustique",
    wrong: ["Abeille", "Papillon"],
    hints: ["Il pique surtout la nuit.", "Il vole près des mares et des flaques.", "Un bourdonnement fin annonce son arrivée."],
  },
  {
    question: "Comment attrape-t-on le paludisme ?",
    answer: "Par la piqûre d'un moustique",
    wrong: ["Par la piqûre d'une abeille", "Par la morsure d'une fourmi"],
    hints: ["Le paludisme est transmis par un insecte volant.", "Cet insecte aime l'eau qui ne coule pas.", "Il laisse un petit bouton qui gratte."],
  },
  {
    question: "Où les moustiques se développent-ils le mieux ?",
    answer: "Près des eaux stagnantes",
    wrong: ["Dans le sable très sec", "Sur la pierre brûlante"],
    hints: ["Ils ont besoin d'eau pour grandir.", "L'eau qui ne bouge pas leur convient.", "Une flaque qui reste des jours est leur maison."],
  },
  {
    question: "Comment s'appelle le moustique qui transmet le paludisme ?",
    answer: "Anophèle",
    wrong: ["Criquet", "Libellule"],
    hints: ["Son nom est un peu difficile à lire.", "Il commence par la lettre a.", "C'est un nom de moustique, pas de sauterelle."],
  },
  {
    question: "Qui transmet le paludisme d'une personne à une autre ?",
    answer: "Moustique",
    wrong: ["Chat", "Poisson"],
    hints: ["Il pique et il vole.", "Il se pose sur la peau la nuit.", "Il aime l'eau qui ne coule pas."],
  },
];

export function makeCe1MalariaCauseChoice(ctx: GameContext): GeneratedGame {
  return factChoice(ctx, "ce1-palu-cause-qcm", "la cause du paludisme", MALARIA_CAUSES);
}

const MALARIA_PROTECT: readonly Fact[] = [
  {
    question: "Que met-on au-dessus du lit pour se protéger des moustiques ?",
    answer: "Moustiquaire",
    wrong: ["Couverture", "Lampe"],
    hints: ["C'est un grand voile à mailles fines.", "Il empêche les insectes de passer.", "On le règle avant de se coucher."],
  },
  {
    question: "Que faut-il faire des eaux stagnantes ?",
    answer: "On les supprime",
    wrong: ["On les garde", "On les agrandit"],
    hints: ["Les moustiques s'y développent.", "On vide les flaques et les seaux.", "Moins il y en a, moins il y a de moustiques."],
  },
  {
    question: "Que fait-on d'un seau plein qui reste dehors plusieurs jours ?",
    answer: "On le vide",
    wrong: ["On le remplit encore", "On le laisse ouvert"],
    hints: ["Une eau qui reste là attire les insectes.", "Les moustiques y pondent.", "Il faut qu'il n'y ait plus d'eau dedans."],
  },
  {
    question: "Quand dort-on sous une moustiquaire ?",
    answer: "Pendant la nuit",
    wrong: ["À midi au soleil", "Pendant la récréation"],
    hints: ["Les moustiques piquent surtout quand il fait sombre.", "On la pose au moment de se coucher.", "C'est quand tu dors dans ton lit."],
  },
  {
    question: "Pourquoi dort-on sous une moustiquaire imprégnée ?",
    answer: "Pour éviter les piqûres",
    wrong: ["Pour avoir plus chaud", "Pour mieux entendre"],
    hints: ["Elle forme une barrière.", "Les insectes ne peuvent pas la traverser.", "Elle protège ceux qui dorment dessous."],
  },
  {
    question: "Quel geste éloigne les moustiques de la cour ?",
    answer: "Vider les flaques d'eau",
    wrong: ["Garder des seaux pleins", "Creuser des trous d'eau"],
    hints: ["Les moustiques ont besoin d'eau qui reste.", "Il faut enlever ce qui les attire.", "Moins d'eau, moins de moustiques."],
  },
];

export function makeCe1MalariaProtectChoice(ctx: GameContext): GeneratedGame {
  return factChoice(ctx, "ce1-palu-proteger-qcm", "se protéger des moustiques", MALARIA_PROTECT);
}

const WORM_FACTS: readonly Fact[] = [
  {
    question: "Que doit-on faire avant de manger pour éviter les vers ?",
    answer: "Se laver les mains",
    wrong: ["Courir très vite", "Boire un jus"],
    hints: ["Ce sont elles qui touchent à tout.", "On les passe sous l'eau avec du savon.", "C'est un geste d'hygiène avant le repas."],
  },
  {
    question: "Que faut-il faire des fruits avant de les manger ?",
    answer: "Les laver",
    wrong: ["Les cacher", "Les jeter"],
    hints: ["Ils peuvent porter de la terre.", "On les passe sous l'eau propre.", "Un fruit propre se mange sans danger."],
  },
  {
    question: "Qu'est-ce qui peut donner des vers intestinaux ?",
    answer: "Des mains sales",
    wrong: ["Des mains propres", "Un fruit bien lavé"],
    hints: ["Les vers entrent par la bouche.", "Ce qui est sale en porte.", "Pense à ce qu'on touche avant de manger."],
  },
  {
    question: "Quel aliment peut donner des vers ?",
    answer: "Un fruit mal lavé",
    wrong: ["Un fruit bien lavé", "Une eau bien bouillie"],
    hints: ["Il a gardé de la terre.", "Les vers viennent de ce qui est sale.", "Il n'a pas été nettoyé comme il faut."],
  },
  {
    question: "Pourquoi se lave-t-on les mains avant de manger ?",
    answer: "Pour éviter les vers",
    wrong: ["Pour avoir chaud", "Pour mieux courir"],
    hints: ["Des petits animaux peuvent se cacher sur les mains sales.", "Ils entrent dans le ventre avec la nourriture.", "C'est une question de santé."],
  },
  {
    question: "Que peuvent donner des mains sales ?",
    answer: "Des vers intestinaux",
    wrong: ["Des cheveux longs", "Des dents blanches"],
    hints: ["Ils vivent dans le ventre.", "Ils entrent par la bouche avec la nourriture.", "Ils donnent mal au ventre."],
  },
];

export function makeCe1WormChoice(ctx: GameContext): GeneratedGame {
  return factChoice(ctx, "ce1-palu-vers-qcm", "éviter les vers intestinaux", WORM_FACTS);
}

const FEVER_FACTS: readonly Fact[] = [
  {
    question: "Tu as de la fièvre. Que fais-tu ?",
    answer: "Je vais au dispensaire",
    wrong: ["Je reste seul dehors", "Je ne dis rien"],
    hints: ["Il faut se faire soigner.", "Un adulte t'y emmène si tu es malade.", "C'est là que travaillent les infirmiers."],
  },
  {
    question: "Où va-t-on quand on a de la fièvre ?",
    answer: "Au dispensaire",
    wrong: ["Au marché", "Au stade"],
    hints: ["On y est soigné.", "Les infirmiers y travaillent.", "C'est le lieu des soins du village."],
  },
  {
    question: "Qui peut te soigner au dispensaire ?",
    answer: "Infirmier",
    wrong: ["Boulanger", "Chauffeur"],
    hints: ["Il porte une blouse blanche.", "Il sait soigner les malades.", "Il travaille avec des médicaments."],
  },
  {
    question: "Ton ami a de la fièvre. Que lui dis-tu ?",
    answer: "Va vite au dispensaire",
    wrong: ["Reste au soleil", "Bois de l'eau sale"],
    hints: ["Il faut l'aider à se soigner.", "Il doit voir quelqu'un qui sait soigner.", "Mieux vaut ne pas attendre."],
  },
  {
    question: "Que fais-tu si la fièvre dure plusieurs jours ?",
    answer: "Je retourne au dispensaire",
    wrong: ["Je ne fais rien", "Je joue dehors"],
    hints: ["Une fièvre qui reste doit être soignée.", "On demande de l'aide à un adulte.", "Les infirmiers sauront quoi faire."],
  },
  {
    question: "Quand faut-il aller au dispensaire ?",
    answer: "Quand on a de la fièvre",
    wrong: ["Quand il pleut dehors", "Quand on est content"],
    hints: ["Pense à ce qui montre qu'on est malade.", "Le corps est trop chaud.", "C'est un signe du paludisme."],
  },
];

export function makeCe1FeverChoice(ctx: GameContext): GeneratedGame {
  return factChoice(ctx, "ce1-palu-fievre-qcm", "que faire en cas de fièvre", FEVER_FACTS);
}

/** « Glisse chaque geste dans la bonne case » : ce qui protège du paludisme, et ce qui y expose. */
export function makeCe1MalariaSort(ctx: GameContext): GeneratedGame {
  return binSort(
    ctx,
    "ce1-palu-glisser",
    "ranger les gestes selon qu'ils protègent des moustiques",
    "Glisse chaque geste dans la bonne case.",
    {
      zone: "Protège du paludisme",
      tiles: ["Dormir sous moustiquaire", "Vider les seaux d'eau", "Couvrir l'eau", "Boucher les flaques", "Vider les vieux pneus"],
    },
    {
      zone: "Expose au paludisme",
      // Pas « Garder des seaux pleins » ni « un pneu plein » : un seau plein et couvert ne risque rien
      // (le thème de l'eau potable l'enseigne), et « pneu plein » peut se lire « pneu gonflé ».
      tiles: ["Dormir sans moustiquaire", "Laisser l'eau stagner", "Laisser des seaux ouverts dehors", "Laisser des flaques", "Laisser de l'eau dans un pneu"],
    },
    [
      "Pense à ce qui éloigne les insectes qui piquent.",
      "Les insectes pondent là où l'eau reste.",
      "Un geste qui supprime l'eau qui reste aide, un geste qui la laisse nuit.",
    ],
  );
}

/** « Glisse chaque geste dans la bonne case » : ce qui peut donner des vers, et ce qui en protège. */
export function makeCe1WormSort(ctx: GameContext): GeneratedGame {
  return binSort(
    ctx,
    "ce1-palu-vers-glisser",
    "ranger ce qui donne ou évite les vers",
    "Glisse chaque chose dans la bonne case.",
    { zone: "Peut donner des vers", tiles: ["Mains sales", "Fruit mal lavé", "Légume mal lavé", "Salade mal lavée", "Mangue mal lavée"] },
    { zone: "Protège des vers", tiles: ["Mains propres", "Fruit bien lavé", "Légume bien lavé", "Salade bien lavée", "Mangue bien lavée"] },
    [
      "Pense à ce qui est propre et à ce qui ne l'est pas.",
      "Ce qui garde de la saleté porte de petits parasites.",
      "Un bon geste d'hygiène garde le ventre en bonne santé.",
    ],
  );
}

const MALARIA_PAIRS: readonly (readonly [string, string])[] = [
  ["Moustiquaire", "Un filet au-dessus du lit"],
  ["Dispensaire", "Là où l'on va se faire soigner"],
  ["Eaux stagnantes", "De l'eau qui reste sans bouger"],
  ["Anophèle", "Le moustique qui donne le paludisme"],
  ["Vers intestinaux", "Ils vivent dans le ventre"],
];

/** « Relie chaque mot à ce qu'il veut dire. » */
export function makeCe1MalariaLink(ctx: GameContext): GeneratedGame {
  return pickPairs(ctx, "ce1-palu-relier", "relier les mots du paludisme", "Relie chaque mot à ce qu'il veut dire.", MALARIA_PAIRS, [
    "Lis d'abord chaque explication, puis cherche le mot qui lui va.",
    "Un mot parle d'un lieu, un autre d'un objet, un autre d'un animal ou de l'eau.",
    "Commence par la paire dont tu es le plus sûr.",
  ]);
}

const FEVER_STEPS_SHORT: Steps = {
  prompt: "Tu as de la fièvre. Mets ces gestes dans l'ordre, du premier au dernier.",
  sequence: ["Je le dis à un adulte", "Je vais au dispensaire", "L'infirmier me soigne"],
  hints: GESTURE_STEP_HINTS,
};
const FEVER_STEPS_LONG: Steps = {
  prompt: "Tu as de la fièvre. Mets ces gestes dans l'ordre, du premier au dernier.",
  sequence: ["Je me sens très chaud", "Je le dis à un adulte", "Je vais au dispensaire", "L'infirmier me soigne"],
  hints: GESTURE_STEP_HINTS,
};
const NIGHT_STEPS_SHORT: Steps = {
  prompt: "Pour te protéger la nuit, mets ces gestes dans l'ordre, du premier au dernier.",
  sequence: ["J'installe la moustiquaire", "Je me couche dessous", "Je dors sans piqûre"],
  hints: GESTURE_STEP_HINTS,
};
const NIGHT_STEPS_LONG: Steps = {
  prompt: "Pour te protéger la nuit, mets ces gestes dans l'ordre, du premier au dernier.",
  sequence: ["La nuit tombe", "J'installe la moustiquaire", "Je me couche dessous", "Je dors sans piqûre"],
  hints: GESTURE_STEP_HINTS,
};
const MEAL_STEPS_SHORT: Steps = {
  prompt: "Avant le repas, mets ces gestes dans l'ordre, du premier au dernier.",
  sequence: ["Je me lave les mains", "Je me mets à table", "Je mange"],
  hints: GESTURE_STEP_HINTS,
};
const MEAL_STEPS_LONG: Steps = {
  prompt: "Avant le repas, mets ces gestes dans l'ordre, du premier au dernier.",
  sequence: ["Je joue dehors", "Je me lave les mains", "Je me mets à table", "Je mange"],
  hints: GESTURE_STEP_HINTS,
};
const WATER_STEPS_SHORT: Steps = {
  prompt: "Mets ces faits dans l'ordre, du premier au dernier.",
  sequence: ["Une eau reste sans bouger", "Un moustique me pique", "J'ai de la fièvre"],
  hints: FACT_STEP_HINTS,
};
const WATER_STEPS_LONG: Steps = {
  prompt: "Mets ces faits dans l'ordre, du premier au dernier.",
  sequence: ["Une eau reste sans bouger", "Des moustiques s'y développent", "Un moustique me pique", "J'ai de la fièvre"],
  hints: FACT_STEP_HINTS,
};

/** « Mets ces gestes dans l'ordre » : un ordre qui suit la logique des choses, trois étapes puis quatre. */
export function makeCe1MalariaOrder(ctx: GameContext): GeneratedGame {
  const steps =
    ctx.level <= 2
      ? partOf([FEVER_STEPS_SHORT, NIGHT_STEPS_SHORT, MEAL_STEPS_SHORT, WATER_STEPS_SHORT], ctx.level - 1, 2)
      : partOf([FEVER_STEPS_LONG, NIGHT_STEPS_LONG, MEAL_STEPS_LONG, WATER_STEPS_LONG], ctx.level - 3, 2);
  return stepsOrder(ctx, "ce1-palu-ordre", "ranger des gestes qui se suivent", steps);
}

const MALARIA_GAPS: readonly GapFact[] = [
  {
    text: "Le paludisme se transmet par la piqûre du ___.",
    answer: "moustique",
    wrong: ["papillon", "chat"],
    hints: ["Il vole et il pique.", "Il aime l'eau qui reste sans bouger.", "On l'entend bourdonner la nuit."],
  },
  {
    text: "Pour se protéger la nuit, on dort sous une ___.",
    answer: "moustiquaire",
    wrong: ["natte", "lampe"],
    hints: ["C'est un grand voile à mailles fines.", "On l'installe au-dessus du lit.", "Elle arrête les insectes."],
  },
  {
    text: "Quand on a de la fièvre, on va au ___.",
    answer: "dispensaire",
    wrong: ["marché", "stade"],
    hints: ["Les infirmiers y travaillent.", "On y est soigné.", "C'est un lieu de soins."],
  },
  {
    text: "On se lave les ___ avant de manger.",
    answer: "mains",
    wrong: ["genoux", "cheveux"],
    hints: ["Elles touchent à tout dans la journée.", "On les frotte avec du savon.", "On s'en sert pour porter la nourriture."],
  },
  {
    text: "Il faut supprimer les eaux ___.",
    answer: "stagnantes",
    wrong: ["claires", "bouillies"],
    hints: ["C'est de l'eau qui reste sans bouger.", "Elle attire les moustiques.", "Une flaque qui ne s'en va pas en est un exemple."],
  },
  {
    text: "Les vers intestinaux entrent dans le corps par des mains ___.",
    answer: "sales",
    wrong: ["propres", "froides"],
    hints: ["C'est le contraire de propre.", "La terre se glisse sous les ongles.", "Un bon lavage les protège."],
  },
];

export function makeCe1MalariaGap(ctx: GameContext): GeneratedGame {
  return factGap(ctx, "ce1-palu-trou", "compléter une phrase sur le paludisme", MALARIA_GAPS);
}

const MALARIA_WRITES: readonly WriteFact[] = [
  {
    prompt: "Quel objet protège des moustiques au-dessus du lit ? Écris le mot.",
    accepted: ["moustiquaire", "une moustiquaire", "la moustiquaire", "moustiquaires", "des moustiquaires", "moustiquaire imprégnée", "une moustiquaire imprégnée", "la moustiquaire imprégnée"],
    hints: ["Pense au grand voile au-dessus du lit.", "Lis bien la question avant d'écrire.", "Le mot commence par la lettre m."],
  },
  {
    prompt: "Quel petit animal transmet le paludisme ? Écris le mot.",
    accepted: ["moustique", "un moustique", "le moustique", "moustiques", "des moustiques", "les moustiques"],
    hints: ["Il vole et il pique la nuit.", "Lis bien la question avant d'écrire.", "Le mot commence par la lettre m."],
  },
  {
    prompt: "Dans quel lieu va-t-on se soigner quand on a de la fièvre ? Écris le mot.",
    accepted: ["dispensaire", "le dispensaire", "un dispensaire", "au dispensaire"],
    hints: ["Les infirmiers y travaillent.", "Lis bien la question avant d'écrire.", "Le mot commence par la lettre d."],
  },
  {
    prompt: "Quel animal pique et donne le paludisme ? Écris le mot.",
    accepted: ["moustique", "un moustique", "le moustique", "moustiques", "des moustiques", "les moustiques"],
    hints: ["Il vole près des flaques.", "Lis bien la question avant d'écrire.", "Le mot commence par la lettre m."],
  },
];

export function makeCe1MalariaWrite(ctx: GameContext): GeneratedGame {
  return factWrite(ctx, "ce1-palu-ecrire", "écrire un mot du paludisme", MALARIA_WRITES);
}
