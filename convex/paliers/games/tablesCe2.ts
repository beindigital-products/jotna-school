/**
 * LA MULTIPLICATION DU CE2 : les tables de 2 à 9, la multiplication posée par un nombre à un chiffre puis à deux chiffres, multiplier par 10 et par 100,
 * le calcul mental (le double, la moitié, le triple, décomposer) et les problèmes de « combien en tout » (`ma-ce2-multiplication`).
 *
 * Sur l'échantillon de CE2, le modèle écrivait « 12 × 11 » comme une table, des multiplications posées au résultat faux, des « multiplier par 100 »
 * avec un zéro de moins. Ici le calcul est FAIT par le code, jamais écrit, et les tables sont celles de la fiche : 2 à 9, facteur de 2 à 10.
 *
 * - LES TABLES vont avec les paliers : 2 à 5 au premier, 6 et 7 au deuxième, 8 et 9 au troisième, toutes au dernier (où l'on écrit aussi « 7 × 4 » pour
 *   « 4 × 7 »). Un produit n'est posé qu'une fois dans un palier (clé partagée par tous les gabarits du fichier).
 * - LA MULTIPLICATION POSÉE : deux chiffres par un chiffre sans retenue (premier palier), avec la retenue des unités (deuxième), trois chiffres par un
 *   chiffre (troisième), deux chiffres par deux chiffres (dernier). Aucun chiffre des unités ni des dizaines n'est zéro.
 * - Les erreurs d'enfant : un facteur de trop ou de moins (« 7 × 8 » donne 48 ou 63), oublier la retenue, la compter deux fois, ne pas décaler le
 *   deuxième produit (23 × 14 donne alors 115), un zéro de moins ou de trop en multipliant par 10 ou par 100.
 * - Le double, la moitié, le triple : la moitié d'un nombre pair seulement.
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

/** Les tables de chaque palier : 2 à 5, puis 6 et 7, puis 8 et 9, puis toutes. */
export const TABLES_CE2: Record<GameLevel, readonly number[]> = { 1: [2, 3, 4, 5], 2: [6, 7], 3: [8, 9], 4: [2, 3, 4, 5, 6, 7, 8, 9] };
const FACTORS = [2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

type Product = { table: number; factor: number };

/** Un produit de ce palier, pas encore posé dans ce palier : la clé est partagée par tous les gabarits du fichier. */
function pickProduct(ctx: GameContext): Product {
  const all = TABLES_CE2[ctx.level].flatMap((table) => FACTORS.map((factor) => ({ table, factor })));
  return pickFresh(ctx, all, (product) => `ce2-mult:produit:${product.table}x${product.factor}`);
}

/** « 4 × 7 » : au dernier palier, on écrit le facteur avant la table (« 7 × 4 ») ; les autres paliers écrivent la table d'abord. */
const timesText = (ctx: GameContext, product: Product) => (ctx.level === 4 ? `${product.factor} × ${product.table}` : `${product.table} × ${product.factor}`);

// ===========================================================================
// LES TABLES
// ===========================================================================

/** « Combien font 7 × 8 ? » : une table du palier, un facteur de 2 à 10. */
export function makeCe2MultTable(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce2-mult-table", "connaître les tables de multiplication", () => {
    const product = pickProduct(ctx);
    const { table, factor } = product;
    const result = table * factor;
    return {
      prompt: `Combien font ${timesText(ctx, product)} ?`,
      answer: show(result),
      // L'erreur de l'enfant : un facteur de trop ou de moins, la table d'à côté, additionner au lieu de multiplier.
      wrong: wrongNumbersCe1(ctx, result, [result + table, result - table, result + factor, table * (factor + 1), (table + 1) * factor, table + factor], 2, 100),
      hints: [
        "Récite la table pas à pas, en comptant sur tes doigts.",
        "Chaque pas ajoute le nombre de la table.",
        "Compare avec un résultat de la table que tu connais bien.",
      ],
    };
  });
}

/** « 7 × ___ = 56 » ou « ___ × 7 = 56 » : le facteur qui manque. */
export function makeCe2MultGap(ctx: GameContext): GeneratedGame {
  return gapGame(ctx, "ce2-mult-trou", "trouver le facteur qui manque dans une multiplication", () => {
    const { table, factor } = pickProduct(ctx);
    const result = table * factor;
    return {
      prompt: "Complète avec le bon nombre.",
      text: ctx.level === 4 ? `___ × ${table} = ${show(result)}` : `${table} × ___ = ${show(result)}`,
      answer: String(factor),
      wrong: wrongNumbersCe1(ctx, factor, [factor + 1, factor - 1, factor + 2, factor - 2, table], 1, 10),
      hints: ["Cherche combien de fois on met la table pour arriver au résultat.", "Récite la table jusqu'au résultat.", "Vérifie en refaisant la multiplication."],
    };
  });
}

// ===========================================================================
// LA MULTIPLICATION POSÉE
// ===========================================================================

const FALLBACK_POSED: Record<GameLevel, [number, number]> = { 1: [32, 3], 2: [27, 3], 3: [245, 4], 4: [23, 14] };

/** Le chiffre de chaque rang, des unités vers la gauche. */
const digitsOf = (n: number) => String(n).split("").reverse().map(Number);

/**
 * Les retenues d'une multiplication par un seul chiffre, colonne par colonne, des unités vers la gauche : la retenue qui sort de chaque colonne.
 * Le test recalcule la même chose avec sa propre fonction.
 */
export function carriesOfProduct(n: number, multiplier: number): number[] {
  const out: number[] = [];
  let carry = 0;
  for (const digit of digitsOf(n)) {
    const column = digit * multiplier + carry;
    carry = Math.floor(column / 10);
    out.push(carry);
  }
  return out;
}

/**
 * Deux nombres à multiplier. Palier 1 : deux chiffres par un chiffre (2 à 5), sans retenue. Palier 2 : la retenue des unités seulement. Palier 3 : trois
 * chiffres par un chiffre (2 à 9), avec au moins une retenue. Palier 4 : deux chiffres par deux chiffres. Aucun chiffre n'est zéro.
 */
export function posedPair(ctx: GameContext): [number, number] {
  for (let attempt = 0; attempt < 600; attempt++) {
    if (ctx.level === 4) {
      const n = randomInt(ctx.rng, 12, 49);
      const m = randomInt(ctx.rng, 12, 29);
      if (n % 10 === 0 || m % 10 === 0 || n === m) continue;
      return [n, m];
    }
    const multiplier = ctx.level === 1 ? pick(ctx.rng, [2, 3, 4]) : ctx.level === 2 ? pick(ctx.rng, [3, 4, 5, 6, 7, 8, 9]) : pick(ctx.rng, [3, 4, 5, 6, 7, 8, 9]);
    const n = ctx.level === 3 ? randomInt(ctx.rng, 111, 499) : randomInt(ctx.rng, 11, 49);
    if (digitsOf(n).includes(0)) continue;
    const carries = carriesOfProduct(n, multiplier);
    if (ctx.level === 1 && carries.some((carry) => carry > 0)) continue;
    if (ctx.level === 2 && !(carries[0] > 0 && carries.slice(1).every((carry) => carry === 0))) continue;
    if (ctx.level === 3 && !(carries.some((carry) => carry > 0) && n * multiplier <= 3000)) continue;
    return [n, multiplier];
  }
  return [...FALLBACK_POSED[ctx.level]];
}

/** Les erreurs d'une multiplication posée : oublier une retenue, la compter deux fois, ne pas décaler le deuxième produit. */
function posedErrors(n: number, m: number): number[] {
  const result = n * m;
  if (m >= 10) {
    const tens = Math.floor(m / 10);
    const units = m % 10;
    // 23 × 14 : 23 × 4 = 92 et 23 × 10 = 230. Sans décalage : 92 + 23 = 115 ; un zéro oublié : 92 + 23 × 10 / 10 ne change rien, mais 92 + 23 × 1 × 100 = 2392.
    return [n * units + n * tens, n * units + n * tens * 100, result - n, result + n, result - 10 * n];
  }
  const carries = carriesOfProduct(n, m);
  const errors: number[] = [];
  carries.forEach((carry, i) => {
    if (carry > 0) errors.push(result - carry * 10 ** (i + 1), result + carry * 10 ** (i + 1));
  });
  errors.push(result + 10, result - 10);
  return errors;
}

/** « Combien font 27 × 3 ? » : un nombre de deux ou trois chiffres par un chiffre, puis par deux chiffres au dernier palier. */
export function makeCe2MultPosed(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce2-mult-poser", "poser une multiplication", () => {
    const [n, m] = posedPair(ctx);
    const result = n * m;
    return {
      prompt: `Combien font ${n} × ${m} ?`,
      answer: show(result),
      wrong: wrongNumbersCe1(ctx, result, posedErrors(n, m), 10, 10000),
      hints:
        ctx.level === 4
          ? ["Multiplie d'abord par le chiffre des unités du deuxième nombre.", "Multiplie ensuite par ses dizaines, en décalant le résultat d'un rang à gauche.", "Additionne les deux produits."]
          : [
              "Multiplie d'abord les unités.",
              "Si le produit des unités passe dix, écris les unités et retiens les dizaines.",
              "Multiplie ensuite le rang suivant et ajoute ce que tu as retenu.",
            ],
    };
  });
}

/** « Pose et calcule 27 × 3. Écris le résultat. » ou « Écris le résultat de 7 × 8. » : une réponse courte. */
export function makeCe2MultWrite(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "ce2-mult-ecrire", () => {
    if (ctx.level >= 3) {
      const [n, m] = posedPair(ctx);
      const result = n * m;
      return {
        type: "short-answer",
        prompt: `Pose et calcule ${n} × ${m}. Écris le résultat.`,
        payload: { acceptedAnswers: [String(result)], game: originOf("ce2-mult-ecrire", ctx), concept: "poser une multiplication" },
        answerKey: String(result),
        hints: ["Pose le calcul en colonnes, unités sous unités.", "Multiplie d'abord les unités, puis les rangs suivants avec la retenue.", "Vérifie avec un calcul approché."],
      };
    }
    const product = pickProduct(ctx);
    const result = product.table * product.factor;
    return {
      type: "short-answer",
      prompt: `Écris le résultat de ${timesText(ctx, product)}.`,
      payload: { acceptedAnswers: [String(result)], game: originOf("ce2-mult-ecrire", ctx), concept: "connaître les tables de multiplication" },
      answerKey: String(result),
      hints: ["Récite la table pas à pas, en comptant sur tes doigts.", "Chaque pas ajoute le nombre de la table.", "Vérifie avec une addition répétée."],
    };
  });
}

// ===========================================================================
// PAR 10 ET PAR 100, LE DOUBLE, LA MOITIÉ, LE TRIPLE, DÉCOMPOSER
// ===========================================================================

/** Un nombre écrit avec `zeros` zéros de plus à droite. */
const withZeros = (n: number, zeros: number) => Number(`${n}${"0".repeat(zeros)}`);

/** « Combien font 47 × 100 ? » : un zéro (ou deux) se glisse à droite. Au dernier palier, des dizaines par des dizaines (« 40 × 30 »). */
export function makeCe2MultTen(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce2-mult-dix", "multiplier par dix et par cent", () => {
    if (ctx.level === 4) {
      const a = randomInt(ctx.rng, 2, 9) * 10;
      const b = randomInt(ctx.rng, 2, 9) * 10;
      const result = a * b;
      return {
        prompt: `Combien font ${a} × ${b} ?`,
        answer: show(result),
        wrong: wrongNumbersCe1(ctx, result, [result / 10, result * 10, a + b, (a / 10) * (b / 10)], 20, 100000),
        hints: ["Multiplie d'abord les nombres sans leurs zéros.", "Compte tous les zéros qui restent à droite.", "Écris-les derrière le produit."],
      };
    }
    const times = ctx.level === 1 ? 10 : ctx.level === 2 ? 100 : pick(ctx.rng, [10, 100]);
    const n = ctx.level === 1 ? randomInt(ctx.rng, 2, 99) : ctx.level === 2 ? randomInt(ctx.rng, 2, 99) : randomInt(ctx.rng, 11, 999);
    if (ctx.level === 3 && ctx.rng() < 0.4) {
      return {
        prompt: `Quel nombre multiplié par ${times} donne ${show(n * times)} ?`,
        answer: show(n),
        wrong: wrongNumbersCe1(ctx, n, [n * 10, n * 100, n + 1, n - 1, Math.floor(n / 10)], 1, 99999),
        hints: [`Multiplier par ${times === 10 ? "dix" : "cent"}, c'est ajouter des zéros à droite.`, "Ici, les zéros sont déjà écrits : enlève-les.", "Vérifie en multipliant ton résultat."],
      };
    }
    const zeros = times === 10 ? 1 : 2;
    return {
      prompt: `Combien font ${show(n)} × ${times} ?`,
      answer: show(n * times),
      wrong: wrongNumbersCe1(ctx, n * times, [withZeros(n, zeros - 1), withZeros(n, zeros + 1), n * (times === 10 ? 100 : 10), n + times, withZeros(n, 1) + n], 11, 999999),
      hints: [`Multiplier par ${times === 10 ? "dix" : "cent"}, c'est ajouter ${zeros === 1 ? "un zéro" : "deux zéros"} à droite.`, "Les chiffres du nombre ne changent pas, ils avancent de rangs.", "Vérifie que le résultat est bien plus grand."],
    };
  });
}

const MENTAL_TOP: Record<GameLevel, number> = { 1: 100, 2: 200, 3: 500, 4: 1000 };

/** « Quel est le double de 125 ? », « Quelle est la moitié de 350 ? », « Quel est le triple de 40 ? » : la moitié d'un nombre pair seulement. */
export function makeCe2MultMental(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce2-mult-double", "le double, la moitié et le triple", () => {
    const top = MENTAL_TOP[ctx.level];
    const form = pick(ctx.rng, ctx.level === 1 ? ["double", "moitie"] : ["double", "moitie", "triple"]);
    if (form === "double") {
      const n = randomInt(ctx.rng, 6, top);
      return {
        prompt: `Quel est le double de ${show(n)} ?`,
        answer: show(2 * n),
        wrong: wrongNumbersCe1(ctx, 2 * n, [n + 2, 2 * n + 10, 2 * n - 10, n + 10, n, 3 * n], 2, 5000),
        hints: ["Le double, c'est deux fois le nombre.", "Ajoute le nombre à lui-même.", "Double d'abord les plus grands rangs, puis les plus petits."],
      };
    }
    if (form === "moitie") {
      const half = randomInt(ctx.rng, 3, Math.max(4, Math.floor(top / 2)));
      return {
        prompt: `Quelle est la moitié de ${show(2 * half)} ?`,
        answer: show(half),
        wrong: wrongNumbersCe1(ctx, half, [half + 10, half - 10, half + 1, half - 1, 2 * half - 2, half * 2], 1, 3000),
        hints: ["La moitié, c'est partager en deux parts égales.", "Cherche le nombre qui, ajouté à lui-même, donne le nombre de départ.", "Coupe d'abord les plus grands rangs en deux, puis les plus petits."],
      };
    }
    const n = randomInt(ctx.rng, 6, Math.floor(top / 2));
    return {
      prompt: `Quel est le triple de ${show(n)} ?`,
      answer: show(3 * n),
      wrong: wrongNumbersCe1(ctx, 3 * n, [2 * n, 4 * n, 3 * n + 10, 3 * n - 10, n + 3, n + 10], 2, 5000),
      hints: ["Le triple, c'est trois fois le nombre.", "Ajoute le nombre trois fois, ou double-le puis ajoute-le encore.", "Triple d'abord les plus grands rangs, puis les plus petits."],
    };
  });
}

/** « 7 × 24 = 7 × 20 + 7 × ___ » : décomposer un facteur pour calculer de tête. */
export function makeCe2MultDecompose(ctx: GameContext): GeneratedGame {
  return gapGame(ctx, "ce2-mult-decomposer", "décomposer pour multiplier de tête", () => {
    const table = pick(ctx.rng, TABLES_CE2[ctx.level]);
    const tens = randomInt(ctx.rng, 1, ctx.level === 1 ? 3 : 9) * 10;
    const units = randomInt(ctx.rng, 2, 9);
    const n = tens + units;
    const form = ctx.level >= 3 && ctx.rng() < 0.5 ? "produit" : "facteur";
    if (form === "produit") {
      const partial = table * tens;
      return {
        prompt: "Complète avec le bon nombre.",
        text: `${table} × ${n} = ${show(partial)} + ___`,
        answer: show(table * units),
        wrong: wrongNumbersCe1(ctx, table * units, [units, table + units, table * units + 10, table * units - 10, partial], 2, 999),
        hints: ["Le nombre est coupé en dizaines et en unités.", "Les dizaines sont déjà multipliées.", "Multiplie les unités par la table."],
      };
    }
    return {
      prompt: "Complète avec le bon nombre.",
      text: `${table} × ${n} = ${table} × ${tens} + ${table} × ___`,
      answer: String(units),
      wrong: wrongNumbersCe1(ctx, units, [units + 1, units - 1, tens, n, units + 10], 1, 99),
      hints: ["Le nombre est coupé en dizaines et en unités.", "Les dizaines sont déjà écrites.", "Cherche ce qui reste après les dizaines."],
    };
  });
}

// ===========================================================================
// RELIER, RANGER, PROBLÈMES
// ===========================================================================

/** « Relie chaque multiplication à son résultat. » : trois ou quatre produits des tables du palier, tous les résultats différents. */
export function makeCe2MultLinks(ctx: GameContext): GeneratedGame {
  return linkGame(ctx, "ce2-mult-relier", "relier une multiplication et son résultat", () => {
    const wanted = ctx.level >= 3 ? 4 : 3;
    const chosen: { text: string; result: number }[] = [];
    const used = new Set<number>();
    for (let attempt = 0; attempt < 300 && chosen.length < wanted; attempt++) {
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

/** Les deux tables d'un palier pour le glissé : jamais l'une dans l'autre (« 3 » et « 6 » partagent tous leurs multiples de six). */
const SORT_TABLES: Record<GameLevel, [number, number]> = { 1: [3, 5], 2: [6, 7], 3: [8, 9], 4: [4, 7] };

/** « Glisse chaque nombre dans la bonne table. » : des résultats de l'une des deux tables seulement, de deux à dix fois la table. */
export function makeCe2MultSort(ctx: GameContext): GeneratedGame {
  return sortGame(ctx, "ce2-mult-glisser", "reconnaître un nombre dans une table", () => {
    const [a, b] = SORT_TABLES[ctx.level];
    const inTable = (n: number, table: number) => n % table === 0 && n >= 2 * table && n <= 10 * table;
    const range = Array.from({ length: 90 }, (_, i) => i + 1);
    const onlyA = range.filter((n) => inTable(n, a) && !inTable(n, b) && n % b !== 0);
    const onlyB = range.filter((n) => inTable(n, b) && !inTable(n, a) && n % a !== 0);
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
 * Un problème de « combien en tout » : des paquets égaux, ou des achats égaux en FCFA. Les deux premiers paliers comptent des objets, le troisième de
 * l'argent, le dernier l'un ou l'autre. Le total d'argent ne dépasse jamais cinq mille FCFA.
 */
export function makeCe2MultProblem(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce2-mult-probleme", "résoudre un petit problème de multiplication", () => {
    const money = ctx.level === 3 || (ctx.level === 4 && ctx.rng() < 0.5);
    if (!money) {
      const table = pick(ctx.rng, TABLES_CE2[ctx.level]);
      const count = pickFresh(ctx, [2, 3, 4, 5, 6, 7, 8, 9], (candidate) => `ce2-mult:probleme:${table}x${candidate}`);
      const container = pick(ctx.rng, CONTAINERS);
      const total = count * table;
      return {
        prompt: `Il y a ${count} ${container.many} de ${table} ${container.thing}. Combien y a-t-il de ${container.thing} en tout ?`,
        answer: show(total),
        // L'erreur de l'enfant : additionner les deux nombres de l'énoncé, ou oublier un paquet.
        wrong: wrongNumbersCe1(ctx, total, [count + table, total - table, total + table, table * (count + 1), table], 2, 100),
        hints: ["Chaque contenant a le même nombre d'objets.", "Pour savoir combien en tout, répète ce nombre autant de fois qu'il y a de contenants.", "C'est une multiplication."],
      };
    }
    const child = pickFresh(ctx, CHILDREN, (candidate) => `ce2-mult:enfant:${candidate.name}`);
    const count = randomInt(ctx.rng, 2, 9);
    const price = 25 * randomInt(ctx.rng, 4, Math.floor(5000 / count / 25 / 2));
    const total = count * price;
    const good = pick(ctx.rng, GOODS);
    return {
      prompt: `${child.name} achète ${count} ${good.many}. Chaque ${good.one} coûte ${show(price)} FCFA. Combien ${hasHe(child)} payé en tout ?`,
      answer: `${show(total)} FCFA`,
      wrong: wrongNumbersCe1(ctx, total, [total + price, total - price, total + 100, total - 100, count + price, price].filter((n) => n % 25 === 0), 100, 5000).map((value) => `${value} FCFA`),
      hints: ["Tous les achats coûtent le même prix.", "Pour savoir ce qu'on paie en tout, répète le prix autant de fois qu'on achète.", "C'est une multiplication."],
    };
  });
}
