/**
 * LA MULTIPLICATION DU CE1 : les tables de 2 à 5, la multiplication posée par un nombre à un chiffre, le double et la moitié, multiplier par 10, et les
 * petits problèmes de « combien en tout » (`ma-ce1-multiplication`).
 *
 * Sur l'échantillon de CE1, le modèle écrivait des tables hors fiche (« 7 × 8 », « 6 × 9 »), « 25 × 4 » posée avec un résultat faux, des appariements
 * dont deux résultats étaient égaux, des « double de » avec un nombre impair. Ici le calcul est FAIT par le code, jamais écrit, et les tables sont
 * celles de la fiche : 2, 3, 4 et 5, facteur de 2 à 10.
 *
 * - LES TABLES vont avec les paliers : 2 et 5 au premier, 3 au deuxième, 4 au troisième, les quatre au dernier (où l'on écrit aussi « 7 × 4 » pour
 *   « 4 × 7 »). Un produit n'est posé qu'une fois dans un palier (clé partagée par tous les gabarits du fichier).
 * - LA MULTIPLICATION POSÉE est un nombre de deux chiffres par 2, 3, 4 ou 5 : sans retenue aux deux premiers paliers, avec la retenue des unités au
 *   troisième, avec deux retenues (résultat à trois chiffres) au quatrième. Aucun chiffre des unités n'est zéro.
 * - Les erreurs d'enfant : un facteur de trop ou de moins (« 4 × 7 » donne 24 ou 32), additionner au lieu de multiplier, oublier la retenue, écrire
 *   tout le produit des unités sous les unités (14 × 4 donne alors 416).
 * - La moitié n'est demandée que d'un nombre pair, le double d'un nombre qui ne dépasse pas la moitié du plafond du palier.
 * - L'argent : des prix multiples de vingt-cinq FCFA, un total qui ne dépasse jamais mille FCFA.
 * - Aucun indice n'écrit un chiffre : un produit se lirait dedans.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { fresh, originOf, pick, pickFresh, randomInt, shuffle, type GameContext, type GameLevel, type GeneratedGame } from "./shared";
import { CHILDREN, hasHe } from "./stories";
import { choiceGame, gapGame, linkGame, sortGame } from "./tableaux";
import { formatNumber } from "./patterns";
import { wrongNumbersCe1 } from "./nombresCe1";

const show = (n: number) => formatNumber(n);

/** Les tables de chaque palier : 2 et 5, puis 3, puis 4, puis les quatre. */
export const TABLES_BY_LEVEL: Record<GameLevel, readonly number[]> = { 1: [2, 5], 2: [3], 3: [4], 4: [2, 3, 4, 5] };
const FACTORS = [2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

type Product = { table: number; factor: number };

/** Un produit de ce palier, pas encore posé dans ce palier : la clé est partagée par tous les gabarits du fichier. */
function pickProduct(ctx: GameContext): Product {
  const all = TABLES_BY_LEVEL[ctx.level].flatMap((table) => FACTORS.map((factor) => ({ table, factor })));
  return pickFresh(ctx, all, (product) => `ce1-mult:produit:${product.table}x${product.factor}`);
}

/** « 4 × 7 » : au dernier palier, on écrit le facteur avant la table (« 7 × 4 ») ; les autres paliers écrivent la table d'abord. */
const timesText = (ctx: GameContext, product: Product) => (ctx.level === 4 ? `${product.factor} × ${product.table}` : `${product.table} × ${product.factor}`);

// ===========================================================================
// LES TABLES
// ===========================================================================

/** « Combien font 4 × 7 ? » : une table du palier, un facteur de 2 à 10. */
export function makeCe1MultTable(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce1-mult-table", "connaître les tables de multiplication", () => {
    const product = pickProduct(ctx);
    const { table, factor } = product;
    const result = table * factor;
    return {
      prompt: `Combien font ${timesText(ctx, product)} ?`,
      answer: show(result),
      // L'erreur de l'enfant : un facteur de trop ou de moins, la table d'à côté, additionner au lieu de multiplier.
      wrong: wrongNumbersCe1(ctx, result, [result + table, result - table, result + factor, table * (factor + 1), (table + 1) * factor, table + factor], 2, 60),
      hints: [
        "Récite la table pas à pas, en comptant sur tes doigts.",
        "Chaque pas ajoute le nombre de la table.",
        "Compare avec un résultat de la table que tu connais bien.",
      ],
    };
  });
}

/** « 4 × ___ = 28 » ou « ___ × 4 = 28 » : le facteur qui manque. */
export function makeCe1MultGap(ctx: GameContext): GeneratedGame {
  return gapGame(ctx, "ce1-mult-trou", "trouver le facteur qui manque dans une multiplication", () => {
    const { table, factor } = pickProduct(ctx);
    const result = table * factor;
    // Les trois premiers paliers écrivent la table d'abord (« 4 × ___ = 28 »), le dernier le facteur d'abord (« ___ × 4 = 28 ») : la même table ne
    // pose pas deux fois la même phrase.
    return {
      prompt: "Complète avec le bon nombre.",
      text: ctx.level === 4 ? `___ × ${table} = ${show(result)}` : `${table} × ___ = ${show(result)}`,
      answer: String(factor),
      wrong: wrongNumbersCe1(ctx, factor, [factor + 1, factor - 1, factor + 2, factor - 2, table], 1, 10),
      hints: ["Cherche combien de fois on met la table pour arriver au résultat.", "Récite la table jusqu'au résultat.", "Vérifie en refaisant la multiplication."],
    };
  });
}

/** Le nombre de termes d'une addition répétée, par palier : chaque palier a les siens, pour qu'« 4 + 4 + 4 » ne revienne pas d'un palier à l'autre. */
const TERMS_BY_LEVEL: Record<GameLevel, readonly number[]> = { 1: [3, 4], 2: [2, 4, 5], 3: [2, 3, 5], 4: [6, 7] };

/** « Quelle multiplication donne le même résultat que 5 + 5 + 5 ? » : le nombre de termes d'abord (« 3 × 5 »). */
export function makeCe1MultAddition(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce1-mult-addition", "écrire une addition répétée en multiplication", () => {
    const table = pick(ctx.rng, TABLES_BY_LEVEL[ctx.level]);
    const terms = pickFresh(
      ctx,
      TERMS_BY_LEVEL[ctx.level].filter((count) => count !== table),
      (count) => `ce1-mult:somme:${table}x${count}`,
    );
    return {
      prompt: `Quelle multiplication donne le même résultat que ${Array.from({ length: terms }, () => table).join(" + ")} ?`,
      answer: `${terms} × ${table}`,
      // Aucun choix n'est la multiplication renversée (« 5 × 3 » vaut « 3 × 5 ») : chaque faux choix change le résultat (un terme de plus, un terme de la table suivante).
      wrong: [`${terms + 1} × ${table}`, `${terms} × ${table + 1}`],
      hints: [
        "Compte combien de fois le même nombre revient dans l'addition.",
        "Écris ce nombre de fois, puis le nombre qui revient.",
        "Vérifie que les deux calculs donnent le même résultat.",
      ],
    };
  });
}

// ===========================================================================
// LA MULTIPLICATION POSÉE
// ===========================================================================

const MULTIPLIERS_BY_LEVEL: Record<GameLevel, readonly number[]> = { 1: [2, 3], 2: [2, 3, 4, 5], 3: [2, 3, 4, 5], 4: [3, 4, 5] };
const FALLBACK_POSED: Record<GameLevel, [number, number]> = { 1: [12, 3], 2: [21, 4], 3: [14, 4], 4: [47, 5] };

/**
 * Un nombre de deux chiffres par un nombre à un chiffre. Aux deux premiers paliers rien ne se retient (le produit reste sous cent) ; au troisième les
 * unités se retiennent ; au quatrième les dizaines aussi (le produit passe cent). Le chiffre des unités n'est jamais zéro.
 */
export function posedPair(ctx: GameContext): [number, number] {
  for (let attempt = 0; attempt < 500; attempt++) {
    const multiplier = pick(ctx.rng, MULTIPLIERS_BY_LEVEL[ctx.level]);
    const n = randomInt(ctx.rng, 11, 99);
    const units = n % 10;
    const tens = Math.floor(n / 10);
    if (units === 0) continue;
    const carryUnits = Math.floor((units * multiplier) / 10);
    const carryTens = Math.floor((tens * multiplier + carryUnits) / 10);
    if (ctx.level <= 2 && (carryUnits > 0 || carryTens > 0)) continue;
    if (ctx.level === 3 && !(carryUnits > 0 && carryTens === 0)) continue;
    if (ctx.level === 4 && !(carryUnits > 0 && carryTens > 0)) continue;
    return [n, multiplier];
  }
  return [...FALLBACK_POSED[ctx.level]];
}

/** Les erreurs d'une multiplication posée : oublier la retenue des unités, celle des dizaines, écrire tout le produit des unités. */
function posedErrors(n: number, multiplier: number): number[] {
  const units = n % 10;
  const tens = Math.floor(n / 10);
  const carryUnits = Math.floor((units * multiplier) / 10);
  const result = n * multiplier;
  const errors = [result - 10 * carryUnits, result + 10 * carryUnits];
  const carryTens = Math.floor((tens * multiplier + carryUnits) / 10);
  if (carryTens > 0) errors.push(result - 100 * carryTens);
  errors.push(Number(`${tens * multiplier}${units * multiplier}`));
  return errors;
}

/** « Combien font 23 × 4 ? » : un nombre de deux chiffres par un nombre à un chiffre, sans retenue puis avec. */
export function makeCe1MultPosed(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce1-mult-poser", "multiplier un nombre à deux chiffres", () => {
    const [n, multiplier] = posedPair(ctx);
    const result = n * multiplier;
    return {
      prompt: `Combien font ${n} × ${multiplier} ?`,
      answer: show(result),
      wrong: wrongNumbersCe1(ctx, result, posedErrors(n, multiplier), 10, 500),
      hints: [
        "Multiplie d'abord les unités.",
        "Si le produit des unités passe dix, écris les unités et retiens les dizaines.",
        "Multiplie ensuite les dizaines et ajoute ce que tu as retenu.",
      ],
    };
  });
}

/** « Pose et calcule 23 × 4. Écris le résultat. » ou « Écris le résultat de 7 × 4. » : une réponse courte. */
export function makeCe1MultWrite(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "ce1-mult-ecrire", () => {
    if (ctx.level >= 3) {
      const [n, multiplier] = posedPair(ctx);
      const result = n * multiplier;
      return {
        type: "short-answer",
        prompt: `Pose et calcule ${n} × ${multiplier}. Écris le résultat.`,
        payload: { acceptedAnswers: [String(result)], game: originOf("ce1-mult-ecrire", ctx), concept: "poser une multiplication par un nombre à un chiffre" },
        answerKey: String(result),
        hints: ["Pose le calcul en colonnes, unités sous unités.", "Multiplie d'abord les unités, puis les dizaines avec la retenue.", "Vérifie avec une addition répétée."],
      };
    }
    const product = pickProduct(ctx);
    const result = product.table * product.factor;
    return {
      type: "short-answer",
      prompt: `Écris le résultat de ${timesText(ctx, product)}.`,
      payload: { acceptedAnswers: [String(result)], game: originOf("ce1-mult-ecrire", ctx), concept: "connaître les tables de multiplication" },
      answerKey: String(result),
      hints: ["Récite la table pas à pas, en comptant sur tes doigts.", "Chaque pas ajoute le nombre de la table.", "Vérifie avec une addition répétée."],
    };
  });
}

// ===========================================================================
// LE DOUBLE, LA MOITIÉ, MULTIPLIER PAR 10
// ===========================================================================

const DOUBLE_TOP: Record<GameLevel, number> = { 1: 20, 2: 50, 3: 100, 4: 250 };

/** « Quel est le double de 35 ? » ou « Quelle est la moitié de 48 ? » : la moitié d'un nombre pair seulement. */
export function makeCe1MultDouble(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce1-mult-double", "le double et la moitié", () => {
    const top = DOUBLE_TOP[ctx.level];
    if (ctx.rng() < 0.5) {
      const n = randomInt(ctx.rng, 6, top);
      return {
        prompt: `Quel est le double de ${show(n)} ?`,
        answer: show(2 * n),
        wrong: wrongNumbersCe1(ctx, 2 * n, [n + 2, 2 * n + 10, 2 * n - 10, n + 10, n], 2, 600),
        hints: ["Le double, c'est deux fois le nombre.", "Ajoute le nombre à lui-même.", "Double d'abord les dizaines, puis les unités."],
      };
    }
    const half = randomInt(ctx.rng, 3, Math.max(4, top));
    return {
      prompt: `Quelle est la moitié de ${show(2 * half)} ?`,
      answer: show(half),
      wrong: wrongNumbersCe1(ctx, half, [half + 10, half - 10, half + 1, half - 1, 2 * half - 2, half * 2], 1, 500),
      hints: ["La moitié, c'est partager en deux parts égales.", "Cherche le nombre qui, ajouté à lui-même, donne le nombre de départ.", "Coupe d'abord les dizaines en deux, puis les unités."],
    };
  });
}

/** « Combien font 34 × 10 ? » ou « Quel nombre multiplié par 10 donne 450 ? » : un zéro se glisse à droite. */
export function makeCe1MultTen(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce1-mult-dix", "multiplier par dix", () => {
    const n = ctx.level === 1 ? randomInt(ctx.rng, 2, 9) : randomInt(ctx.rng, 11, 99);
    const reverse = ctx.level >= 3 && ctx.rng() < 0.5;
    if (reverse) {
      return {
        prompt: `Quel nombre multiplié par 10 donne ${show(n * 10)} ?`,
        answer: show(n),
        wrong: wrongNumbersCe1(ctx, n, [n * 10, n * 100, n + 1, n - 1, Number(String(n).split("").reverse().join(""))], 1, 999),
        hints: ["Multiplier par dix, c'est ajouter un zéro à droite.", "Ici, le zéro est déjà écrit : enlève-le.", "Vérifie en multipliant ton résultat par dix."],
      };
    }
    const text = String(n);
    const zeroInside = Number(`${text.slice(0, 1)}0${text.slice(1)}`);
    return {
      prompt: `Combien font ${n} × 10 ?`,
      answer: show(n * 10),
      wrong: wrongNumbersCe1(ctx, n * 10, [n + 10, n * 100, zeroInside, n * 10 + n, n + 1], 11, 9999),
      hints: ["Multiplier par dix, c'est ajouter un zéro à droite.", "Les chiffres du nombre ne changent pas, ils avancent d'un rang.", "Vérifie que le résultat est dix fois plus grand."],
    };
  });
}

// ===========================================================================
// RELIER, RANGER, PROBLÈMES
// ===========================================================================

/** « Relie chaque multiplication à son résultat. » : trois ou quatre produits des tables du palier, tous les résultats différents. */
export function makeCe1MultLinks(ctx: GameContext): GeneratedGame {
  return linkGame(ctx, "ce1-mult-relier", "relier une multiplication et son résultat", () => {
    const wanted = ctx.level >= 3 ? 4 : 3;
    const chosen: { text: string; result: number }[] = [];
    const used = new Set<number>();
    for (let attempt = 0; attempt < 200 && chosen.length < wanted; attempt++) {
      const { table, factor } = pickProduct(ctx);
      const result = table * factor;
      if (used.has(result)) continue;
      used.add(result);
      chosen.push({ text: timesText(ctx, { table, factor }), result });
    }
    return {
      prompt: "Relie chaque multiplication à son résultat.",
      pairs: chosen.map((product) => ({ left: product.text, right: show(product.result) })),
      hints: ["Récite chaque table pas à pas.", "Commence par la multiplication que tu connais le mieux.", "Chaque résultat va avec une seule multiplication."],
    };
  });
}

/** Les deux tables d'un palier pour le glissé : jamais l'une dans l'autre (« 2 » et « 4 » partagent tous leurs multiples de quatre). */
const SORT_TABLES: Record<GameLevel, [number, number]> = { 1: [2, 5], 2: [3, 5], 3: [3, 4], 4: [4, 5] };

/** « Glisse chaque nombre dans la bonne table. » : des résultats de l'une des deux tables seulement. */
export function makeCe1MultSort(ctx: GameContext): GeneratedGame {
  return sortGame(ctx, "ce1-mult-glisser", "reconnaître un nombre dans une table", () => {
    const [a, b] = SORT_TABLES[ctx.level];
    const inTable = (n: number, table: number) => n % table === 0;
    // Un nombre de la table est un des produits de 2 à 10 fois la table : jamais « 44 » dans la table de 2.
    const onlyA = Array.from({ length: 50 }, (_, i) => i + 1).filter((n) => n >= 2 * a && n <= 10 * a && inTable(n, a) && !inTable(n, b));
    const onlyB = Array.from({ length: 50 }, (_, i) => i + 1).filter((n) => n >= 2 * b && n <= 10 * b && inTable(n, b) && !inTable(n, a));
    const each = ctx.level === 1 ? 2 : 3;
    const zoneA = `Table de ${a}`;
    const zoneB = `Table de ${b}`;
    return {
      prompt: "Glisse chaque nombre dans la bonne table.",
      zones: [zoneA, zoneB],
      items: [
        ...shuffle(ctx.rng, onlyA).slice(0, each).map((n) => ({ text: String(n), zone: zoneA })),
        ...shuffle(ctx.rng, onlyB).slice(0, each).map((n) => ({ text: String(n), zone: zoneB })),
      ],
      hints: ["Récite chaque table jusqu'au nombre.", "Un nombre est dans la table s'il se trouve en la récitant.", "Commence par les nombres que tu reconnais tout de suite."],
    };
  });
}

/** Des contenants et ce qu'ils contiennent : le contenu s'écrit sans apostrophe devant le nom. */
const CONTAINERS: readonly { many: string; thing: string }[] = [
  { many: "paniers", thing: "bonbons" },
  { many: "sacs", thing: "billes" },
  { many: "boîtes", thing: "crayons" },
  { many: "rangées", thing: "cahiers" },
  { many: "assiettes", thing: "mangues" },
];

/** Des choses qu'on achète au marché, au singulier et au pluriel, sans apostrophe : « Chaque cahier coûte » s'accorde pour tous. */
const GOODS: readonly { one: string; many: string }[] = [
  { one: "cahier", many: "cahiers" },
  { one: "pain", many: "pains" },
  { one: "ballon", many: "ballons" },
  { one: "règle", many: "règles" },
  { one: "livre", many: "livres" },
  { one: "mangue", many: "mangues" },
];

/**
 * Un problème de « combien en tout » : des paquets égaux, ou des achats égaux en FCFA. Le premier palier et le deuxième comptent des objets, le troisième
 * de l'argent, le dernier l'un ou l'autre. Le total d'argent ne dépasse jamais mille FCFA.
 */
export function makeCe1MultProblem(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce1-mult-probleme", "résoudre un petit problème de multiplication", () => {
    const money = ctx.level === 3 || (ctx.level === 4 && ctx.rng() < 0.5);
    if (!money) {
      const table = pick(ctx.rng, TABLES_BY_LEVEL[ctx.level]);
      const count = pickFresh(ctx, [2, 3, 4, 5, 6], (candidate) => `ce1-mult:probleme:${table}x${candidate}`);
      const container = pick(ctx.rng, CONTAINERS);
      const total = count * table;
      return {
        prompt: `Il y a ${count} ${container.many} de ${table} ${container.thing}. Combien y a-t-il de ${container.thing} en tout ?`,
        answer: show(total),
        // L'erreur de l'enfant : additionner les deux nombres de l'énoncé, ou oublier un paquet.
        wrong: wrongNumbersCe1(ctx, total, [count + table, total - table, total + table, table * (count + 1), table], 2, 60),
        hints: ["Chaque contenant a le même nombre d'objets.", "Pour savoir combien en tout, répète ce nombre autant de fois qu'il y a de contenants.", "C'est une multiplication."],
      };
    }
    const child = pickFresh(ctx, CHILDREN, (candidate) => `ce1-mult:enfant:${candidate.name}`);
    const count = randomInt(ctx.rng, 2, 5);
    const price = 25 * randomInt(ctx.rng, 2, Math.floor(1000 / count / 25));
    const total = count * price;
    const good = pick(ctx.rng, GOODS);
    return {
      prompt: `${child.name} achète ${count} ${good.many}. Chaque ${good.one} coûte ${show(price)} FCFA. Combien ${hasHe(child)} payé en tout ?`,
      answer: `${show(total)} FCFA`,
      wrong: wrongNumbersCe1(ctx, total, [total + price, total - price, total + 50, total - 50, count + price, price].filter((n) => n % 25 === 0), 50, 1000).map((value) => `${value} FCFA`),
      hints: ["Tous les achats coûtent le même prix.", "Pour savoir ce qu'on paie en tout, répète le prix autant de fois qu'on achète.", "C'est une multiplication."],
    };
  });
}
