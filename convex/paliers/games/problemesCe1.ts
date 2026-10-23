/**
 * RÉSOUDRE UN PROBLÈME AU CE1 (`ma-ce1-problemes`) : analyser un énoncé, repérer les données utiles, inutiles et manquantes, poser la question
 * intermédiaire, choisir l'opération, résoudre un problème à une ou deux opérations.
 *
 * Sur l'échantillon de CE1, le modèle écrivait des problèmes sans donnée manquante là où il disait en chercher une, des données « inutiles » qui servaient, des
 * questions intermédiaires sans rapport avec l'histoire. Ici l'histoire est tirée du lexique fermé de `stories.ts` (un prénom, une chose avec son genre, son
 * pluriel et ses verbes), l'opération est CHOISIE par le code puis écrite, et la réponse est CALCULÉE, jamais écrite.
 *
 * Trois sortes d'histoire à une opération, trois à deux opérations :
 * - AJOUTER : « Awa a 345 mangues. Elle en reçoit 27. » (addition avec retenue, comme `calculCe1.ts`) ;
 * - ENLEVER : « Awa a 345 mangues. Elle en vend 168. » (soustraction avec emprunt) ;
 * - MULTIPLIER : « Awa a 4 paquets de 5 mangues. » (les tables de 2 à 5 de `tablesCe1.ts`) ;
 * - à deux opérations : recevoir puis donner, des paquets plus ou moins quelques-uns, un achat de plusieurs choses à un même prix puis la monnaie rendue.
 *
 * CE QUE CE FICHIER NE FAIT PAS SORTIR DE LA FICHE
 * - Les nombres restent sous mille, les prix sont des multiples de vingt-cinq FCFA, la monnaie rendue ne dépasse pas la somme donnée.
 * - Une donnée « inutile » n'a rien à voir avec la question (l'âge de l'enfant, la classe, le temps qu'il fait) ; une donnée « manquante » est un nombre que
 *   l'énoncé ne donne pas et que le calcul demande.
 * - Les verbes d'ajout (« reçoit », « trouve », « ramasse ») et de retrait (« mange », « donne », « perd », « vend ») ne laissent aucun doute sur le sens.
 * - Les énoncés n'ont aucun « : », au plus une apostrophe droite, vingt-huit mots au plus. Aucun indice n'écrit un chiffre ni un nombre du calcul.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { fresh, originOf, pick, pickFresh, randomInt, shuffle, takeFresh, type GameContext, type GameLevel, type GeneratedGame } from "./shared";
import { CHILDREN, ITEMS, VERBS, hasHe, ofItems, pronoun, type Child, type Item } from "./stories";
import { cap, choiceGame, linkGame, sortGame, type Hints } from "./tableaux";
import { formatNumber } from "./patterns";
import { wrongNumbersCe1 } from "./nombresCe1";
import { borrowPairCe1, carryPairCe1 } from "./calculCe1";
import { TABLES_BY_LEVEL } from "./tablesCe1";
import { stepsByLevel, factChoice, type Fact, type Steps } from "./ce1SciencesOutils";

const show = (n: number) => formatNumber(n);

/** Les choses des problèmes : pas d'animaux (« Awa mange 3 moutons »). */
const THINGS: readonly Item[] = ITEMS.filter((item) => item.family !== "animal");
/** Les choses dont le pluriel ne commence pas par une voyelle : « Combien de mangues » compte une apostrophe de moins qu'« Combien d'oranges ». */
const PLAIN_THINGS: readonly Item[] = THINGS.filter((item) => !item.vowel);

const qty = (n: number, item: Item): string => `${show(n)} ${n === 1 ? item.singular : item.plural}`;

/** Le plus grand nombre d'une histoire à une opération, selon le palier. */
const TOP: Record<GameLevel, number> = { 1: 300, 2: 500, 3: 800, 4: 1000 };

type Op = "add" | "sub" | "mult";

const OPS_BY_LEVEL: Record<GameLevel, readonly Op[]> = {
  1: ["add", "sub"],
  2: ["add", "sub", "mult"],
  3: ["add", "sub", "mult"],
  4: ["add", "sub", "mult"],
};

const ADD_VERBS = ["reçoit", "trouve", "ramasse"] as const;

// ===========================================================================
// UNE HISTOIRE À UNE OPÉRATION
// ===========================================================================

export type Story = {
  op: Op;
  child: Child;
  item: Item;
  /** add : a + b ; sub : a − b ; mult : a paquets de b. */
  a: number;
  b: number;
  result: number;
  /** « 345 + 27 », « 345 − 168 », « 4 × 5 ». */
  operation: string;
  /** Les phrases qui donnent les données, une par donnée. */
  sentences: string[];
  /** La question : « Combien de mangues a-t-elle maintenant ? ». */
  question: string;
};

/** Deux nombres pour une histoire : retenue et emprunt comme au calcul du palier, une table du palier pour les paquets. `small` : des nombres courts (choisir l'opération). */
function numbersOf(ctx: GameContext, op: Op, small: boolean): { a: number; b: number } {
  if (op === "mult") {
    const table = pick(ctx.rng, TABLES_BY_LEVEL[ctx.level]);
    const others = [2, 3, 4, 5, 6, 7, 8, 9, 10].filter((value) => value !== table);
    const other = pick(ctx.rng, others);
    return ctx.rng() < 0.5 ? { a: table, b: other } : { a: other, b: table };
  }
  if (small) {
    if (op === "add") return { a: randomInt(ctx.rng, 12, 60), b: randomInt(ctx.rng, 3, 20) };
    const a = randomInt(ctx.rng, 25, 90);
    return { a, b: randomInt(ctx.rng, 3, Math.min(20, a - 5)) };
  }
  for (let attempt = 0; attempt < 30; attempt++) {
    const [a, b] = op === "add" ? carryPairCe1(ctx, TOP[ctx.level]) : borrowPairCe1(ctx, TOP[ctx.level]);
    if (a !== b) return { a, b };
  }
  return op === "add" ? { a: 147, b: 38 } : { a: 243, b: 58 };
}

/** Une histoire à une opération : l'enfant, la chose, les nombres, les phrases. */
export function drawStory(ctx: GameContext, op: Op = pick(ctx.rng, OPS_BY_LEVEL[ctx.level]), options: { small?: boolean; plain?: boolean } = {}): Story {
  const child = pickFresh(ctx, CHILDREN, (candidate) => `ce1-pb:${candidate.name}`);
  const item = pick(ctx.rng, options.plain ? PLAIN_THINGS : THINGS);
  const { a, b } = numbersOf(ctx, op, options.small ?? false);
  const who = cap(pronoun(child));
  const removes = VERBS[pick(ctx.rng, item.remove)].present;
  const base = { op, child, item, a, b };
  if (op === "add") {
    const gives = ctx.rng() < 0.5 ? `${who} en ${pick(ctx.rng, ADD_VERBS)} ${show(b)}.` : `On lui en donne ${show(b)}.`;
    return {
      ...base,
      result: a + b,
      operation: `${show(a)} + ${show(b)}`,
      sentences: [`${child.name} a ${qty(a, item)}.`, gives],
      question: `Combien ${ofItems(item)} ${hasHe(child)} maintenant ?`,
    };
  }
  if (op === "sub") {
    return {
      ...base,
      result: a - b,
      operation: `${show(a)} − ${show(b)}`,
      sentences: [`${child.name} a ${qty(a, item)}.`, `${who} en ${removes} ${show(b)}.`],
      question: `Combien ${ofItems(item)} lui reste-t-il ?`,
    };
  }
  return {
    ...base,
    result: a * b,
    operation: `${a} × ${b}`,
    sentences: [`${child.name} a ${a} paquets de ${qty(b, item)}.`],
    question: `Combien ${ofItems(item)} ${hasHe(child)} en tout ?`,
  };
}

const setupOf = (story: Story): string => story.sentences.join(" ");

/** Les erreurs d'enfant sur le résultat : le signe changé, une dizaine de trop ou de moins, un nombre de l'énoncé recopié. */
function wrongResults(ctx: GameContext, story: Story): [string, string] {
  const { a, b, result, op } = story;
  const pool =
    op === "add"
      ? [Math.abs(a - b), result - 10, result + 10, a, b, result - 100, result + 100]
      : op === "sub"
        ? [a + b, result - 10, result + 10, b, a, result - 100, result + 100]
        : [a + b, result - b, result + b, result - a, result + a];
  return wrongNumbersCe1(ctx, result, pool, 1, 1500);
}

const SOLVE_HINTS: Hints = [
  "Lis l'histoire en entier, puis la question.",
  "Cherche si la quantité grandit ou diminue, ou si elle se répète.",
  "Fais le calcul, puis vérifie que la réponse a du sens.",
];

/** « Awa a 345 mangues. Elle en reçoit 27. Combien de mangues a-t-elle maintenant ? » : un problème à une opération. */
export function makeCe1PbSolve(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce1-pb-resoudre", "résoudre un problème à une opération", () => {
    const story = drawStory(ctx);
    return { prompt: `${setupOf(story)} ${story.question}`, answer: show(story.result), wrong: wrongResults(ctx, story), hints: SOLVE_HINTS };
  });
}

/** « … Écris le nombre. » : un problème à une ou deux opérations, une réponse courte. */
export function makeCe1PbWrite(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "ce1-pb-ecrire", () => {
    const twoSteps = ctx.level >= 2 && ctx.rng() < 0.5;
    const drawn = twoSteps ? drawTwoSteps(ctx, true) : undefined;
    const story = drawn ? undefined : drawStory(ctx, undefined, { plain: true });
    const prompt = drawn ? `${drawn.setup} ${drawn.question} Écris le nombre.` : `${setupOf(story!)} ${story!.question} Écris le nombre.`;
    const result = drawn ? drawn.result : story!.result;
    return {
      type: "short-answer",
      prompt,
      payload: { acceptedAnswers: [String(result)], game: originOf("ce1-pb-ecrire", ctx), concept: "résoudre un problème et écrire le résultat" },
      answerKey: String(result),
      hints: [...SOLVE_HINTS],
    };
  });
}

/** « Quelle opération faut-il faire ? » : l'opération du problème parmi trois, avec les mêmes nombres. */
export function makeCe1PbOperation(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce1-pb-operation", "choisir l'opération d'un problème", () => {
    const story = drawStory(ctx, undefined, { small: true, plain: true });
    const { a, b, op } = story;
    const text = {
      add: `${a} + ${b}`,
      sub: `${a} − ${b}`,
      mult: `${a} × ${b}`,
    };
    const wrong = op === "mult" ? [text.add, `${Math.max(a, b)} − ${Math.min(a, b)}`] : op === "add" ? [text.sub, text.mult] : [text.add, text.mult];
    return {
      prompt: `${setupOf(story)} ${story.question} Quelle opération faut-il faire ?`,
      answer: text[op],
      wrong,
      hints: ["Cherche si la quantité grandit, diminue ou se répète.", "Une quantité qui se répète en paquets égaux se multiplie.", "Teste chaque opération avec l'histoire."],
    };
  });
}

// ===========================================================================
// LA DONNÉE INUTILE, LA DONNÉE MANQUANTE
// ===========================================================================

/** Une phrase en plus qui ne sert pas au calcul : l'âge, la classe, la fratrie, le temps qu'il fait. */
function extraSentence(ctx: GameContext, child: Child): string {
  const who = cap(pronoun(child));
  const choices: (() => string)[] = [
    () => `${who} a ${randomInt(ctx.rng, 6, 9)} ans.`,
    () => `Sa classe a ${randomInt(ctx.rng, 25, 45)} élèves.`,
    () => `${who} a ${randomInt(ctx.rng, 2, 6)} frères et sœurs.`,
    () => "Il fait très chaud.",
    () => "Son sac est rouge.",
  ];
  return pick(ctx.rng, choices)();
}

const withoutPeriod = (sentence: string) => sentence.replace(/\.$/, "");

/** « Awa a 345 mangues. Elle en reçoit 27. Elle a 7 ans. Combien … ? Quelle phrase ne sert à rien ? » : la phrase inutile parmi trois. */
export function makeCe1PbUseless(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce1-pb-utile", "trouver la donnée inutile", () => {
    const story = drawStory(ctx, pick(ctx.rng, ["add", "sub"] as const), { plain: true });
    const extra = extraSentence(ctx, story.child);
    const sentences = [...story.sentences];
    sentences.splice(randomInt(ctx.rng, 1, sentences.length), 0, extra);
    return {
      prompt: `${sentences.join(" ")} ${story.question} Quelle phrase ne sert à rien ?`,
      answer: withoutPeriod(extra),
      wrong: story.sentences.map(withoutPeriod),
      hints: ["Lis toute l'histoire.", "Chaque phrase dit quelque chose de différent.", "Cherche la phrase qui ne change pas la réponse."],
    };
  });
}

const MISSING_HINTS: Hints = ["Lis l'énoncé en entier.", "Cherche ce que le calcul demande et que l'énoncé ne dit pas.", "Sans cette information, on ne peut pas calculer."];

const missing = (question: string, answer: string, wrong: readonly [string, string]): Fact => ({ question: `${question} Que manque-t-il pour répondre ?`, answer, wrong, hints: MISSING_HINTS });

/** Deux énoncés par palier : une donnée manque, les deux autres choix n'ont aucun rapport avec le calcul. */
export const MISSING_FACTS: readonly Fact[] = [
  // Palier 1
  missing("Moussa achète des cahiers à 250 F chacun. Combien paie-t-il en tout ?", "Le nombre de cahiers", ["La couleur des cahiers", "Le nom de la boutique"]),
  missing("Awa achète 4 cahiers. Combien paie-t-elle en tout ?", "Le prix d'un cahier", ["La couleur des cahiers", "Le nom de la boutique"]),
  // Palier 2
  missing("Fatou a des billes. Elle en perd 8. Combien lui en reste-t-il ?", "Le nombre de billes au début", ["La couleur des billes", "Le nom de son amie"]),
  missing("Ibrahima a 45 billes. Il en perd quelques-unes. Combien lui en reste-t-il ?", "Le nombre de billes perdues", ["La couleur des billes", "Le nom de son ami"]),
  // Palier 3
  missing("Un car fait 3 voyages. Combien de personnes a-t-il emmenées en tout ?", "Le nombre de places du car", ["La couleur du car", "Le nom du chauffeur"]),
  missing("Une classe a 4 rangées de bancs. Combien de bancs y a-t-il en tout ?", "Le nombre de bancs par rangée", ["La couleur des bancs", "Le nom de la maîtresse"]),
  // Palier 4
  missing("Awa achète un pain et un ballon. Le pain coûte 150 F. Combien paie-t-elle en tout ?", "Le prix du ballon", ["La couleur du ballon", "Le nom du marchand"]),
  missing("Moussa a 500 F. Il achète un livre. Combien d'argent lui reste-t-il ?", "Le prix du livre", ["Le titre du livre", "Le nom de la librairie"]),
];

/** « Awa achète 4 cahiers. Combien paie-t-elle en tout ? Que manque-t-il pour répondre ? » : la donnée qui manque parmi trois. */
export function makeCe1PbMissing(ctx: GameContext): GeneratedGame {
  return factChoice(ctx, "ce1-pb-manquante", "trouver la donnée qui manque", MISSING_FACTS, 2);
}

// ===========================================================================
// DEUX OPÉRATIONS
// ===========================================================================

/** Des choses qu'on achète, au singulier et au pluriel, avec leur article : « Chaque cahier coûte 250 F. » */
const GOODS: readonly { one: string; many: string; art: string }[] = [
  { one: "cahier", many: "cahiers", art: "un" },
  { one: "règle", many: "règles", art: "une" },
  { one: "ballon", many: "ballons", art: "un" },
  { one: "livre", many: "livres", art: "un" },
  { one: "pain", many: "pains", art: "un" },
  { one: "casserole", many: "casseroles", art: "une" },
];

export type TwoSteps = {
  form: "recoit-perd" | "paquets-plus" | "paquets-moins" | "achat-total" | "achat-monnaie";
  setup: string;
  question: string;
  result: number;
  /** « F » pour l'argent, vide sinon. */
  suffix: string;
  wrongPool: number[];
  /** Ce qu'il faut chercher d'abord, ce qui est demandé à la fin, et un détail sans rapport. */
  intermediate: string;
  final: string;
  other: string;
};

type TwoForm = TwoSteps["form"];

const TWO_FORMS: Record<GameLevel, readonly TwoForm[]> = {
  1: ["recoit-perd"],
  2: ["recoit-perd", "paquets-plus"],
  3: ["paquets-plus", "paquets-moins", "achat-monnaie"],
  4: ["paquets-moins", "achat-total", "achat-monnaie"],
};

const paidWith = (paid: number) => (paid >= 1000 ? `un billet de ${show(paid)} F` : `une pièce de ${show(paid)} F`);
const priceBetween = (ctx: GameContext, lo: number, hi: number) => 25 * randomInt(ctx.rng, Math.ceil(lo / 25), Math.floor(hi / 25));

/** Un problème à deux opérations : l'enfant, la chose, les nombres, ce qu'il faut chercher d'abord. `plain` : une chose sans voyelle initiale (une apostrophe de moins). */
export function drawTwoSteps(ctx: GameContext, plain = false): TwoSteps {
  const child = pickFresh(ctx, CHILDREN, (candidate) => `ce1-pb:${candidate.name}`);
  const item = pick(ctx.rng, plain ? PLAIN_THINGS : THINGS);
  const who = cap(pronoun(child));
  const removes = VERBS[pick(ctx.rng, item.remove)].present;
  const form = pick(ctx.rng, TWO_FORMS[ctx.level]);
  const other = `La couleur des ${item.plural} du panier`;
  if (form === "recoit-perd") {
    const [lo, hi] = { 1: [20, 70], 2: [60, 200], 3: [100, 400], 4: [300, 700] }[ctx.level];
    const a = randomInt(ctx.rng, lo, hi);
    const b = randomInt(ctx.rng, 5, Math.floor(a / 2));
    const c = randomInt(ctx.rng, 3, Math.floor((a + b) / 2));
    return {
      form,
      setup: `${child.name} a ${qty(a, item)}. ${who} en reçoit ${show(b)}, puis en ${removes} ${show(c)}.`,
      question: `Combien ${ofItems(item)} ${hasHe(child)} maintenant ?`,
      result: a + b - c,
      suffix: "",
      wrongPool: [a + b, a + b + c, a - c, a + b - c + 10, a + b - c - 10],
      intermediate: `Le nombre ${ofItems(item)} après en avoir reçu`,
      final: `Le nombre ${ofItems(item)} à la fin`,
      other,
    };
  }
  if (form === "paquets-plus" || form === "paquets-moins") {
    const k = randomInt(ctx.rng, 2, 5);
    const m = randomInt(ctx.rng, 3, ctx.level === 2 ? 9 : 10);
    const total = k * m;
    const plus = form === "paquets-plus";
    const c = plus ? randomInt(ctx.rng, 3, ctx.level === 2 ? 15 : 30) : randomInt(ctx.rng, 3, Math.min(30, total - 3));
    return {
      form,
      setup: `${child.name} a ${k} paquets de ${qty(m, item)}. ${who} en ${plus ? "reçoit" : removes} ${c}${plus ? " de plus" : ""}.`,
      question: `Combien ${ofItems(item)} ${hasHe(child)} maintenant ?`,
      result: plus ? total + c : total - c,
      suffix: "",
      wrongPool: plus ? [total, k + m + c, k * (m + c), total - c] : [total, total + c, k * (m - 1) + c, total - c + 10].filter((n) => n > 0),
      intermediate: `Le nombre ${ofItems(item)} dans les ${k} paquets`,
      final: `Le nombre ${ofItems(item)} à la fin`,
      other,
    };
  }
  const good = pick(ctx.rng, GOODS);
  if (form === "achat-total") {
    const k = randomInt(ctx.rng, 2, 4);
    const p = priceBetween(ctx, 50, 200);
    const second = pick(ctx.rng, GOODS.filter((candidate) => candidate !== good));
    const q = priceBetween(ctx, 50, 200);
    const total = k * p + q;
    return {
      form,
      setup: `${child.name} achète ${k} ${good.many}. Chaque ${good.one} coûte ${show(p)} F. ${who} achète aussi ${second.art} ${second.one} à ${show(q)} F.`,
      question: `Combien paie-t-${pronoun(child)} en tout ?`,
      result: total,
      suffix: " F",
      wrongPool: [k * p, p + q, k * (p + q), total - 25, total + 25, total - 50],
      intermediate: `Le prix des ${k} ${good.many}`,
      final: "Le prix à payer en tout",
      other: `La couleur des ${good.many} du magasin`,
    };
  }
  const k = randomInt(ctx.rng, 2, 5);
  const p = priceBetween(ctx, 50, 250);
  const spent = k * p;
  const paid = pick(ctx.rng, [500, 1000, 2000].filter((value) => value > spent));
  return {
    form,
    setup: `${child.name} achète ${k} ${good.many}. Chaque ${good.one} coûte ${show(p)} F. ${who} paie avec ${paidWith(paid)}.`,
    question: "Combien lui rend-on ?",
    result: paid - spent,
    suffix: " F",
    wrongPool: [spent, paid - p, paid - spent + 25, paid - spent - 25, paid + spent],
    intermediate: `Le prix des ${k} ${good.many}`,
    final: "La monnaie rendue",
    other: `La couleur des ${good.many} du magasin`,
  };
}

/** « Awa a 45 mangues. Elle en reçoit 27, puis en vend 18. Combien … ? » : un problème à deux opérations. */
export function makeCe1PbTwoSteps(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce1-pb-deux", "résoudre un problème à deux opérations", () => {
    const d = drawTwoSteps(ctx);
    return {
      prompt: `${d.setup} ${d.question}`,
      answer: `${show(d.result)}${d.suffix}`,
      wrong: wrongNumbersCe1(ctx, d.result, d.wrongPool, 1, 3000).map((value) => `${value}${d.suffix}`),
      hints: ["Lis l'énoncé et repère les deux étapes.", "Fais le premier calcul, puis le deuxième.", "Vérifie que ta réponse a du sens."],
    };
  });
}

/** « … Que faut-il chercher d'abord ? » : la question intermédiaire d'un problème à deux opérations. */
export function makeCe1PbQuestion(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce1-pb-question", "poser la question intermédiaire", () => {
    const d = drawTwoSteps(ctx, true);
    return {
      prompt: `${d.setup} ${d.question} Que faut-il chercher d'abord ?`,
      answer: d.intermediate,
      wrong: [d.final, d.other],
      hints: ["Une question intermédiaire aide à trouver la réponse finale.", "Cherche ce qu'il faut calculer avant de répondre.", "La dernière question vient après les autres."],
    };
  });
}

// ===========================================================================
// RELIER, GLISSER, RANGER
// ===========================================================================

/** « Relie chaque histoire à son calcul. » : une addition, une soustraction et une multiplication, chacune avec ses nombres. */
export function makeCe1PbLinks(ctx: GameContext): GeneratedGame {
  return linkGame(ctx, "ce1-pb-relier", "relier une histoire à son calcul", () => {
    const stories = (["add", "sub", "mult"] as const).map((op) => drawStory(ctx, op, { small: true }));
    return {
      prompt: "Relie chaque histoire à son calcul.",
      pairs: shuffle(
        ctx.rng,
        stories.map((story) => ({ left: story.sentences.join(" "), right: story.operation })),
      ),
      hints: ["Cherche si la quantité grandit, diminue ou se répète.", "Une quantité qui se répète en paquets égaux se multiplie.", "Commence par l'histoire dont tu es le plus sûr."],
    };
  });
}

const ADD_PHRASES = ["reçoit", "trouve", "ramasse", "gagne"] as const;

/** « Glisse chaque phrase dans la bonne case. » : on additionne quand la quantité grandit, on soustrait quand elle diminue. */
export function makeCe1PbSort(ctx: GameContext): GeneratedGame {
  return sortGame(ctx, "ce1-pb-glisser", "reconnaître une addition et une soustraction", () => {
    const adds = ctx.level <= 2 ? 2 : ctx.rng() < 0.5 ? 3 : 2;
    const subs = ctx.level <= 2 ? 2 : 5 - adds;
    const children = takeFresh(ctx, CHILDREN, adds + subs, (child) => `ce1-pb-glisser:${child.name}`);
    const things = shuffle(ctx.rng, THINGS).slice(0, adds + subs);
    const numbers = shuffle(ctx.rng, Array.from({ length: 17 }, (_, i) => i + 3)).slice(0, adds + subs);
    const items = children.map((child, index) => {
      const item = things[index];
      const adding = index < adds;
      const verb = adding ? pick(ctx.rng, ADD_PHRASES) : VERBS[pick(ctx.rng, item.remove)].present;
      return { text: `${child.name} ${verb} ${qty(numbers[index], item)}.`, zone: adding ? "On additionne" : "On soustrait" };
    });
    return {
      prompt: "Glisse chaque phrase dans la bonne case.",
      zones: ["On additionne", "On soustrait"],
      items,
      hints: ["Cherche si la quantité grandit ou diminue.", "Un verbe qui ajoute demande une addition.", "Un verbe qui enlève demande une soustraction."],
    };
  });
}

const STEP_TEXT = {
  lire: "Je lis tout l'énoncé.",
  question: "Je repère la question.",
  operation: "Je choisis l'opération.",
  calcul: "Je fais le calcul.",
  verifier: "Je vérifie mon résultat.",
  reponse: "J'écris la phrase réponse.",
} as const;

const STEP_HINTS: Hints = ["Pense à ce qui se fait avant le calcul.", "Chaque étape prépare la suivante.", "La dernière étape arrive quand le travail est fini."];
const solving = (...keys: (keyof typeof STEP_TEXT)[]): Steps => ({
  prompt: "Mets dans le bon ordre les étapes pour résoudre un problème.",
  sequence: keys.map((key) => STEP_TEXT[key]),
  hints: STEP_HINTS,
});

/** Trois étapes aux deux premiers paliers, quatre aux deux derniers : jamais « vérifier » et « écrire la réponse » ensemble, leur ordre se discute. */
export const SHORT_STEPS: readonly Steps[] = [solving("lire", "operation", "calcul"), solving("question", "calcul", "reponse"), solving("lire", "question", "operation"), solving("operation", "calcul", "verifier")];
export const LONG_STEPS: readonly Steps[] = [
  solving("lire", "question", "operation", "calcul"),
  solving("question", "operation", "calcul", "reponse"),
  solving("lire", "operation", "calcul", "verifier"),
  solving("lire", "question", "calcul", "reponse"),
];

/** « Mets dans le bon ordre les étapes pour résoudre un problème. » */
export function makeCe1PbSteps(ctx: GameContext): GeneratedGame {
  return stepsByLevel(ctx, "ce1-pb-ordre", "ranger les étapes pour résoudre un problème", SHORT_STEPS, LONG_STEPS);
}
