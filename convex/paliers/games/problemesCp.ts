/**
 * RÉSOUDRE UN PROBLÈME AU CP (`ma-cp-problemes`) : comprendre un énoncé, trouver les données utiles, inutiles ou manquantes, choisir
 * l'opération, construire la question d'un problème. Nombres jusqu'à 100.
 *
 * Sur l'échantillon de CP, le modèle écrivait des problèmes dont la question ne suivait pas l'histoire et des « donnée manquante » sans
 * donnée qui manque. Ici l'histoire est tirée du lexique fermé de `stories.ts` (un prénom, une chose avec son genre, son pluriel et ses
 * verbes), l'opération est CHOISIE par le code puis écrite, et la réponse est CALCULÉE, jamais écrite.
 *
 * Trois sortes d'histoire, chacune avec UNE opération :
 * - AJOUTER : « Awa a 38 mangues. Elle en reçoit 27. » (38 + 27) ;
 * - ENLEVER : « Awa a 45 mangues. Elle en vend 18. » (45 − 18) ;
 * - MULTIPLIER, à partir du deuxième palier : « Awa a 3 paquets de 5 mangues. » (3 × 5). Un facteur vaut 2 ou 3, le résultat ne passe pas 30.
 *
 * CE QUE CE FICHIER NE FAIT PAS SORTIR DE LA FICHE
 * - Aucun nombre au-delà de cent, ni dans l'énoncé ni dans un choix. Une addition a une retenue et une soustraction un emprunt dès le
 *   deuxième palier (`carryPair`, `borrowPair` de `calculCp.ts`).
 * - Une donnée « inutile » est un nombre qui n'a rien à voir avec la question (l'âge de l'enfant, les élèves de sa classe) ; une donnée
 *   « manquante » est un nombre que l'énoncé ne donne pas. Les mauvais choix sont des détails sans aucun lien avec le calcul.
 * - Les verbes d'ajout (« reçoit », « trouve », « ramasse ») et de retrait (« mange », « donne », « perd », « vend ») ne laissent aucun doute
 *   sur le sens : celui qui donne en a moins.
 * - Les énoncés n'ont aucun « : », au plus une apostrophe droite, vingt-huit mots au plus. Aucun indice n'écrit un chiffre.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { fresh, originOf, pick, pickFresh, randomInt, shuffle, type GameContext, type GameLevel, type GeneratedGame } from "./shared";
import { CHILDREN, ITEMS, VERBS, hasHe, ofChild, ofItems, pronoun, quantity, type Child, type Item } from "./stories";
import { cap, choiceGame, gapGame, linkGame, sequenceGame, sortGame } from "./tableaux";
import { borrowPair, carryPair } from "./calculCp";
import { wrongNumbers } from "./nombresCp";

/** Les choses des problèmes : pas d'animaux (« Awa mange 3 moutons »). */
const THINGS: readonly Item[] = ITEMS.filter((item) => item.family !== "animal");

/** Le plus grand nombre d'un énoncé, selon le palier. */
const TOP: Record<GameLevel, number> = { 1: 30, 2: 60, 3: 100, 4: 100 };

type Op = "add" | "sub" | "mult";

/** Les sortes d'histoire d'un palier : la multiplication ne vient qu'au deuxième. */
const opsOf = (level: GameLevel): readonly Op[] => (level === 1 ? ["add", "sub"] : ["add", "sub", "mult"]);

const ADD_VERBS = ["reçoit", "trouve", "ramasse"] as const;

/** Des textes sans doublon, dans l'ordre. */
const unique = (texts: readonly string[]): string[] => [...new Set(texts)];

/** Une écriture « a + b », « a − b » ou « a × b » dont les nombres, et la somme d'une addition, restent sous cent. */
const withinHundred = (text: string): boolean => {
  const numbers = (text.match(/\d+/gu) ?? []).map(Number);
  return numbers.every((n) => n <= 100) && (!text.includes("+") || numbers[0] + numbers[1] <= 100);
};

// ===========================================================================
// UNE HISTOIRE
// ===========================================================================

type Story = {
  op: Op;
  child: Child;
  item: Item;
  /** add : a + b ; sub : a − b ; mult : a paquets de b. */
  a: number;
  b: number;
  result: number;
  /** « 38 + 27 », « 45 − 18 », « 3 × 5 ». */
  operation: string;
  /** Les phrases qui donnent les données (sans la question). */
  setup: string;
  /** La question : « Combien de mangues a-t-elle maintenant ? ». */
  question: string;
  /** La phrase d'arrivée, avec le trou : « Elle a maintenant ___ mangues. ». */
  conclusion: string;
  /** Le verbe de retrait d'une histoire qui enlève (« vend »). */
  removes: string;
};

/**
 * Deux nombres pour une histoire : retenue et emprunt dès le deuxième palier, un facteur de 2 ou 3 pour les paquets. Les deux nombres
 * d'une addition sont différents : « 6 mangues et 6 de plus » donnerait deux choix identiques à la question de la donnée inutile.
 */
function numbersOf(ctx: GameContext, op: Op): { a: number; b: number } {
  const top = TOP[ctx.level];
  if (op === "mult") {
    const table = pick(ctx.rng, [2, 3]);
    // L'autre facteur n'est jamais le même : « 3 paquets de 3 » donnerait deux fois le même nombre dans les choix.
    const others = Array.from({ length: (ctx.level === 2 ? 6 : 10) - 1 }, (_, i) => i + 2).filter((value) => value !== table);
    const other = pick(ctx.rng, others);
    return ctx.rng() < 0.5 ? { a: table, b: other } : { a: other, b: table };
  }
  if (op === "add") {
    for (let attempt = 0; attempt < 30; attempt++) {
      let a: number;
      let b: number;
      if (ctx.level >= 2) [a, b] = carryPair(ctx, top);
      else {
        a = randomInt(ctx.rng, 3, top - 4);
        b = randomInt(ctx.rng, 2, Math.min(12, top - a));
      }
      if (a !== b) return { a, b };
    }
    return { a: 27, b: 18 };
  }
  if (ctx.level >= 2) {
    const [a, b] = borrowPair(ctx, top);
    return { a, b };
  }
  const a = randomInt(ctx.rng, 6, top);
  return { a, b: randomInt(ctx.rng, 2, Math.min(12, a - 2)) };
}

/** Une histoire à une opération : l'enfant, la chose, les nombres, les phrases. */
function drawStory(ctx: GameContext, op: Op = pick(ctx.rng, opsOf(ctx.level)), item: Item = pick(ctx.rng, THINGS)): Story {
  const child = pickFresh(ctx, CHILDREN, (candidate) => `probleme:${candidate.name}`);
  const { a, b } = numbersOf(ctx, op);
  const who = cap(pronoun(child));
  const removes = VERBS[pick(ctx.rng, item.remove)].present;
  const base = { op, child, item, a, b, removes };
  if (op === "add") {
    const gives = ctx.rng() < 0.5 ? `${who} en ${pick(ctx.rng, ADD_VERBS)} ${b}.` : `On lui en donne ${b}.`;
    return {
      ...base,
      result: a + b,
      operation: `${a} + ${b}`,
      setup: `${child.name} a ${quantity(a, item)}. ${gives}`,
      question: `Combien ${ofItems(item)} ${hasHe(child)} maintenant ?`,
      conclusion: `${who} a maintenant ___ ${item.plural}.`,
    };
  }
  if (op === "sub") {
    return {
      ...base,
      result: a - b,
      operation: `${a} − ${b}`,
      setup: `${child.name} a ${quantity(a, item)}. ${who} en ${removes} ${b}.`,
      question: `Combien ${ofItems(item)} lui reste-t-il ?`,
      conclusion: `Il lui reste ___ ${item.plural}.`,
    };
  }
  return {
    ...base,
    result: a * b,
    operation: `${a} × ${b}`,
    setup: `${child.name} a ${a} paquets de ${quantity(b, item)}.`,
    question: `Combien ${ofItems(item)} ${hasHe(child)} en tout ?`,
    conclusion: `${who} a ___ ${item.plural} en tout.`,
  };
}

/** Les erreurs d'enfant sur le résultat : le signe changé, une dizaine oubliée, un nombre de l'énoncé recopié. */
function wrongResults(ctx: GameContext, story: Story): [string, string] {
  const { a, b, result, op } = story;
  const pool =
    op === "add"
      ? [Math.abs(a - b), result - 10, result + 10, a, b]
      : op === "sub"
        ? [a + b, result - 10, result + 10, b, a]
        : [a + b, result - b, result + b, result - a, result + a];
  return wrongNumbers(ctx, result, pool, 0, op === "mult" ? 30 : 100);
}

// ===========================================================================
// CHOISIR L'OPÉRATION ET LA CALCULER
// ===========================================================================

/** « Awa a 45 mangues. Elle en vend 18. Combien de mangues lui reste-t-il ? Quelle opération faut-il faire ? » */
export function makePickOperation(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "pb-operation", "choisir l'opération d'un problème", () => {
    const story = drawStory(ctx);
    const { a, b, op } = story;
    // Le bon signe avec un autre nombre à la place de l'un des deux, ou le mauvais signe avec les bons nombres.
    const near = (n: number): number[] => [n + 1, n - 1, n + 10, n - 10].filter((value) => value >= 2);
    const wrong =
      op === "add"
        ? [`${Math.max(a, b)} − ${Math.min(a, b)}`, ...near(b).map((x) => `${a} + ${x}`), ...near(a).map((x) => `${x} + ${b}`)]
        : op === "sub"
          ? [`${a} + ${b}`, ...near(b).filter((x) => x < a).map((x) => `${a} − ${x}`), ...near(a).filter((x) => x > b).map((x) => `${x} − ${b}`)]
          : [`${a} + ${b}`, ...near(b).filter((x) => x <= 10).map((x) => `${a} × ${x}`), ...near(a).filter((x) => x <= 10).map((x) => `${x} × ${b}`)];
    return {
      prompt: `${story.setup} ${story.question} Quelle opération faut-il faire ?`,
      answer: story.operation,
      // Une somme au-delà de cent ne s'écrit pas ; il reste toujours au moins deux autres écritures.
      wrong: unique(wrong).filter(withinHundred),
      hints: ["Lis l'histoire en entier.", "Demande-toi si le nombre augmente, diminue ou se répète.", "Choisis le signe qui va avec ce qui se passe."],
    };
  });
}

/** « Awa a 38 mangues. Elle en reçoit 27. Combien de mangues a-t-elle maintenant ? » : le résultat. */
export function makeSolve(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "pb-resoudre", "résoudre un petit problème", () => {
    const story = drawStory(ctx);
    return {
      prompt: `${story.setup} ${story.question}`,
      answer: String(story.result),
      wrong: wrongResults(ctx, story),
      hints: ["Lis l'histoire en entier.", "Demande-toi si le nombre augmente, diminue ou se répète.", "Fais l'opération qui va avec l'histoire."],
    };
  });
}

/** « Awa a 38 mangues. Elle en reçoit 27. Combien de mangues a-t-elle maintenant ? Écris le nombre. » : une réponse courte. */
export function makeSolveWrite(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "pb-ecrire", () => {
    const story = drawStory(ctx);
    return {
      type: "short-answer",
      prompt: `${story.setup} ${story.question} Écris le nombre.`,
      payload: { acceptedAnswers: [String(story.result)], game: originOf("pb-ecrire", ctx), concept: "résoudre un petit problème" },
      answerKey: String(story.result),
      hints: ["Lis l'histoire en entier.", "Demande-toi si le nombre augmente, diminue ou se répète.", "Fais l'opération qui va avec l'histoire."],
    };
  });
}

/** « Awa a 45 mangues. Elle en vend 18. Il lui reste ___ mangues. » : le résultat dans une phrase à trou. */
export function makeSolveGap(ctx: GameContext): GeneratedGame {
  return gapGame(ctx, "pb-trou", "compléter la réponse d'un problème", () => {
    const story = drawStory(ctx);
    return {
      prompt: "Complète avec le bon nombre.",
      text: `${story.setup} ${story.conclusion}`,
      answer: String(story.result),
      wrong: wrongResults(ctx, story),
      hints: ["Lis l'histoire en entier.", "Demande-toi si le nombre augmente, diminue ou se répète.", "Fais l'opération qui va avec l'histoire."],
    };
  });
}

// ===========================================================================
// LES DONNÉES : MANQUANTES, INUTILES
// ===========================================================================

/** Des détails qui n'ont aucun lien avec un calcul : jamais un nombre de l'énoncé. */
const IRRELEVANT = ["Le jour de la semaine", "La couleur du sac", "Le nom du marchand", "Le lieu de la scène"] as const;

/** « Awa a 38 mangues. Elle en reçoit quelques-unes. Combien … ? Que manque-t-il pour répondre ? » : la donnée qui manque. */
export function makeMissingDatum(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "pb-manquante", "trouver la donnée qui manque", () => {
    const variant = pick(ctx.rng, ctx.level === 1 ? ["added", "removed", "start"] : ["added", "removed", "start", "packs", "inside"]);
    const op: Op = variant === "added" ? "add" : variant === "packs" || variant === "inside" ? "mult" : "sub";
    // « 4 paquets d'oranges » ajouterait une apostrophe à celle de la question : pour les paquets sans nombre, une chose dont le pluriel ne commence pas par une voyelle.
    const story = drawStory(ctx, op, variant === "inside" ? pick(ctx.rng, THINGS.filter((thing) => !thing.vowel)) : undefined);
    const { item, child } = story;
    const who = cap(pronoun(child));
    const some = item.gender === "f" ? "quelques-unes" : "quelques-uns";
    const hidden: Record<string, { setup: string; answer: string }> = {
      added: { setup: `${child.name} a ${quantity(story.a, item)}. ${who} en reçoit ${some}.`, answer: "Le nombre reçu" },
      removed: { setup: `${child.name} a ${quantity(story.a, item)}. ${who} en ${story.removes} ${some}.`, answer: "Le nombre enlevé" },
      start: { setup: `${child.name} a des ${item.plural}. ${who} en ${story.removes} ${story.b}.`, answer: "Le nombre du début" },
      packs: { setup: `${child.name} a des paquets de ${quantity(story.b, item)}.`, answer: "Le nombre de paquets" },
      inside: { setup: `${child.name} a ${story.a} paquets de ${item.plural}.`, answer: "Le nombre dans chaque paquet" },
    };
    return {
      prompt: `${hidden[variant].setup} ${story.question} Que manque-t-il pour répondre ?`,
      answer: hidden[variant].answer,
      wrong: shuffle(ctx.rng, IRRELEVANT).slice(0, 2),
      hints: ["Lis l'histoire en entier.", "Cherche ce que l'histoire ne dit pas.", "Sans cela, le calcul est impossible."],
    };
  });
}

/** Une phrase en plus qui donne un nombre sans lien avec la question : l'âge, la classe, la fratrie. */
function extraSentence(ctx: GameContext, child: Child, taken: readonly number[]): { text: string; value: number } {
  const who = cap(pronoun(child));
  const choices: { text: (n: number) => string; min: number; max: number }[] = [
    { text: (n) => `${who} a ${n} ans.`, min: 5, max: 9 },
    { text: (n) => `Sa classe a ${n} élèves.`, min: 20, max: 40 },
    { text: (n) => `${who} a ${n} frères et sœurs.`, min: 2, max: 8 },
  ];
  const choice = pick(ctx.rng, choices);
  const values = Array.from({ length: choice.max - choice.min + 1 }, (_, i) => choice.min + i).filter((n) => !taken.includes(n));
  const value = pick(ctx.rng, values);
  return { text: choice.text(value), value };
}

/** « Awa a 38 mangues. Elle en reçoit 27. Elle a 7 ans. Combien … ? Quel nombre ne sert à rien ? » */
export function makeCpUselessDatum(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "pb-inutile", "trouver la donnée inutile", () => {
    const story = drawStory(ctx);
    const extra = extraSentence(ctx, story.child, [story.a, story.b]);
    return {
      prompt: `${story.setup} ${extra.text} ${story.question} Quel nombre ne sert à rien ?`,
      answer: String(extra.value),
      wrong: [String(story.a), String(story.b)],
      hints: ["Lis toute l'histoire.", "Chaque nombre dit quelque chose de différent.", "Cherche le nombre qui ne change pas la réponse."],
    };
  });
}

// ===========================================================================
// LA QUESTION, LES ÉTAPES, LES SENS
// ===========================================================================

/** « Awa a 38 mangues. Elle en reçoit 27. Quelle question va avec cette histoire ? » : la question qui a une réponse dans l'histoire. */
export function makeCpProblemQuestion(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "pb-question", "construire la question d'un problème", () => {
    const story = drawStory(ctx);
    const { child } = story;
    // Des questions sans rapport avec l'histoire, aussi longues que la bonne : la longueur ne doit pas la trahir.
    const unrelated = [
      `À quelle heure ${child.name} se lève-t-${pronoun(child)} le matin ?`,
      `Quel est le plat préféré ${ofChild(child)} ?`,
      `Dans quelle rue habite ${child.name} avec sa famille ?`,
      `Comment s'appelle l'école ${ofChild(child)} ?`,
    ];
    return {
      prompt: `${story.setup} Quelle question va avec cette histoire ?`,
      answer: story.question,
      wrong: shuffle(ctx.rng, unrelated),
      hints: ["Lis l'histoire et vois de quoi on parle.", "La bonne question demande un nombre qu'on peut trouver avec l'histoire.", "Écarte les questions qui n'ont rien à voir avec l'histoire."],
    };
  });
}

/** Les étapes pour résoudre un problème, dans l'ordre. */
export const PROBLEM_STEPS: readonly string[] = [
  "Je lis le problème.",
  "Je cherche les nombres de l'histoire.",
  "Je choisis l'opération.",
  "Je fais le calcul.",
  "J'écris la réponse.",
];

/** « Mets dans le bon ordre les étapes pour résoudre un problème. » : quatre étapes qui se suivent, puis les cinq. */
export function makeProblemSteps(ctx: GameContext): GeneratedGame {
  return sequenceGame(ctx, "pb-etapes", "les étapes pour résoudre un problème", () => {
    const start = ctx.rng() < 0.5 ? 0 : 1;
    return {
      prompt: "Mets dans le bon ordre les étapes pour résoudre un problème.",
      sequence: ctx.level <= 2 ? PROBLEM_STEPS.slice(start, start + 4) : [...PROBLEM_STEPS],
      hints: ["Pense à ce par quoi tu commences quand on te donne un énoncé.", "On ne peut pas calculer avant de savoir quoi calculer.", "Chaque étape prépare la suivante."],
    };
  });
}

/** « Relie chaque histoire à son opération. » : un ajout, un retrait, et des paquets pareils (au deuxième palier). */
export function makeCpStoryLinks(ctx: GameContext): GeneratedGame {
  return linkGame(ctx, "pb-relier", "relier une histoire et son opération", () => {
    const ops: Op[] = ctx.level === 1 ? ["add", "sub", "add"] : ["add", "sub", "mult"];
    for (let attempt = 0; ; attempt++) {
      const items = shuffle(ctx.rng, THINGS);
      const pairs = ops.map((op, i) => {
        const { a, b } = numbersOf(ctx, op);
        const item = items[i];
        if (op === "add") return { left: `${a} ${item.plural}, puis ${b} de plus`, right: `${a} + ${b}` };
        if (op === "sub") return { left: `${a} ${item.plural}, puis ${b} de moins`, right: `${a} − ${b}` };
        return { left: `${a} paquets de ${quantity(b, item)}`, right: `${a} × ${b}` };
      });
      // Trois opérations toutes différentes : une seule paire pour chaque histoire.
      if (new Set(pairs.map((pair) => pair.right)).size === pairs.length || attempt >= 20) {
        return {
          prompt: "Relie chaque histoire à son opération.",
          pairs: shuffle(ctx.rng, pairs),
          hints: ["Lis chaque histoire avec attention.", "Demande-toi si le nombre augmente, diminue ou se répète.", "Commence par la paire dont tu es certain."],
        };
      }
    }
  });
}

/** « Glisse chaque histoire dans la bonne case. » : on ajoute ou on enlève. */
export function makeAddOrRemove(ctx: GameContext): GeneratedGame {
  return sortGame(ctx, "pb-glisser", "ajouter ou enlever dans une histoire", () => {
    const each = ctx.level === 1 ? 2 : 3;
    const children = shuffle(ctx.rng, CHILDREN);
    const items = shuffle(ctx.rng, THINGS);
    const sentence = (index: number, add: boolean) => {
      const child = children[index];
      const item = items[index];
      const n = randomInt(ctx.rng, 2, 9);
      if (add) return `${child.name} ${pick(ctx.rng, ADD_VERBS)} ${quantity(n, item)}`;
      return `${child.name} ${VERBS[pick(ctx.rng, item.remove)].present} ${quantity(n, item)}`;
    };
    return {
      prompt: "Glisse chaque histoire dans la bonne case.",
      zones: ["On ajoute", "On enlève"],
      items: [
        ...Array.from({ length: each }, (_, i) => ({ text: sentence(i, true), zone: "On ajoute" })),
        ...Array.from({ length: each }, (_, i) => ({ text: sentence(each + i, false), zone: "On enlève" })),
      ],
      hints: ["Lis chaque histoire avec attention.", "Demande-toi si l'enfant en a plus ou moins après.", "Commence par l'histoire dont tu es le plus sûr."],
    };
  });
}
