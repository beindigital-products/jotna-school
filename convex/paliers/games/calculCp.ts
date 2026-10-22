/**
 * LE CALCUL DU CP : additions avec retenue, soustractions avec emprunt (nombres jusqu'à 100), en ligne et par étapes, et les petits
 * problèmes du marché en francs, avec les pièces de 5 F à 100 F (`ma-cp-retenue`).
 *
 * Sur l'échantillon de CP, le modèle écrivait « Mets les étapes de l'addition dans l'ordre » sans qu'aucune étape ne parle de retenue,
 * « 60 − 25 » rangé sous « retenue » alors que la fiche veut l'emprunt, des sommes sans aucune retenue, « Awa a 62 FCFA, elle dépense
 * 17 FCFA » avec trois réponses proches. Ici le calcul est FAIT par le code, jamais écrit : une seule option juste par construction, et
 * les mauvais choix sont les erreurs d'enfant connues.
 *
 * - Une addition de ce fichier a TOUJOURS une retenue : les unités passent dix. Une soustraction a TOUJOURS un emprunt : le chiffre des
 *   unités du premier nombre est plus petit que celui du second. Le résultat ne passe jamais cent.
 * - Les erreurs d'enfant : oublier la retenue (une dizaine de moins), la compter deux fois, enlever le petit chiffre du grand sans
 *   emprunter (62 − 38 donne alors 36).
 * - L'argent : des pièces de 5, 10, 25, 50 et 100 F, des prix qui sont des multiples de cinq, jamais plus de cent francs.
 * - Aucun indice n'écrit un chiffre : un résultat se lirait dedans.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { fresh, originOf, pick, pickFresh, randomInt, shuffle, type GameContext, type GameLevel, type GeneratedGame } from "./shared";
import { CHILDREN, hasHe, pronoun } from "./stories";
import { cap, choiceGame, gapGame, levelGroup, linkGame, pickPreferred, sequenceGame, sortGame } from "./tableaux";
import { wrongNumbers } from "./nombresCp";

const ADD_TOP: Record<GameLevel, number> = { 1: 70, 2: 90, 3: 100, 4: 100 };
const SUB_TOP: Record<GameLevel, number> = { 1: 70, 2: 90, 3: 99, 4: 99 };
const MONEY_TOP: Record<GameLevel, number> = { 1: 60, 2: 80, 3: 100, 4: 100 };

const unitsOf = (n: number) => n % 10;
const tensOf = (n: number) => Math.floor(n / 10);

// ===========================================================================
// DES OPÉRATIONS QUI ONT TOUJOURS UNE RETENUE OU UN EMPRUNT
// ===========================================================================

/** Une addition dont les unités passent dix : a + b ne dépasse pas `top`. */
export function carryPair(ctx: GameContext, top: number): [number, number] {
  for (let attempt = 0; attempt < 300; attempt++) {
    const a = randomInt(ctx.rng, 11, top - 6);
    const b = randomInt(ctx.rng, 6, top - a);
    if (b >= 6 && a + b <= top && unitsOf(a) + unitsOf(b) >= 10) return [a, b];
  }
  return [27, 18];
}

/** Une soustraction dont le chiffre des unités de a est plus petit que celui de b : a − b est positif, a ne dépasse pas `top`. */
export function borrowPair(ctx: GameContext, top: number): [number, number] {
  for (let attempt = 0; attempt < 300; attempt++) {
    const a = randomInt(ctx.rng, 21, top);
    const b = randomInt(ctx.rng, 6, a - 1);
    if (b < a && unitsOf(a) < unitsOf(b)) return [a, b];
  }
  return [52, 28];
}

/** Une opération au hasard : addition avec retenue ou soustraction avec emprunt. */
function randomOperation(ctx: GameContext): { text: string; result: number } {
  if (ctx.rng() < 0.5) {
    const [a, b] = carryPair(ctx, ADD_TOP[ctx.level]);
    return { text: `${a} + ${b}`, result: a + b };
  }
  const [a, b] = borrowPair(ctx, SUB_TOP[ctx.level]);
  return { text: `${a} − ${b}`, result: a - b };
}

// ===========================================================================
// CALCULER
// ===========================================================================

/** « Combien font 47 + 38 ? » : les unités passent dix. */
export function makeCarryAdd(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "calc-ajouter", "additionner avec une retenue", () => {
    const [a, b] = carryPair(ctx, ADD_TOP[ctx.level]);
    const sum = a + b;
    return {
      prompt: `Combien font ${a} + ${b} ?`,
      answer: String(sum),
      // L'erreur de l'enfant : oublier la retenue (une dizaine de moins), la compter deux fois (une de plus).
      wrong: wrongNumbers(ctx, sum, [sum - 10, sum + 10, sum - 1, sum + 1], 0, 100),
      hints: [
        "Additionne d'abord les unités.",
        "Si les unités passent dix, écris les unités et retiens une dizaine.",
        "Ajoute la dizaine retenue aux dizaines.",
      ],
    };
  });
}

/** « Combien font 62 − 38 ? » : on ne peut pas enlever les unités sans emprunter. */
export function makeBorrowSub(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "calc-enlever", "soustraire avec un emprunt", () => {
    const [a, b] = borrowPair(ctx, SUB_TOP[ctx.level]);
    const result = a - b;
    // L'erreur classique : enlever le petit chiffre du grand sans emprunter (62 − 38 donne alors 36).
    const noBorrow = 10 * (tensOf(a) - tensOf(b)) + (unitsOf(b) - unitsOf(a));
    return {
      prompt: `Combien font ${a} − ${b} ?`,
      answer: String(result),
      wrong: wrongNumbers(ctx, result, [noBorrow, result + 10, result - 10, result + 1], 0, 100),
      hints: [
        "Regarde d'abord les unités.",
        "Si tu ne peux pas enlever, emprunte une dizaine pour avoir plus d'unités.",
        "Enlève ensuite les dizaines, sans oublier celle que tu as empruntée.",
      ],
    };
  });
}

/** Une question sur l'étape qui fait peur : ce qu'on écrit, ce qu'on retient, ce que devient le chiffre quand on emprunte. */
export function makeCarryAsk(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "calc-retenue", "la retenue et l'emprunt", () => {
    const form = randomInt(ctx.rng, 0, 2);
    if (form < 2) {
      const [a, b] = carryPair(ctx, ADD_TOP[ctx.level]);
      const sum = unitsOf(a) + unitsOf(b);
      if (form === 0) {
        return {
          prompt: `Dans ${a} + ${b}, les unités font ${sum}. On écrit ${sum - 10}. Combien retient-on ?`,
          answer: "1",
          wrong: ["0", "2"],
          hints: ["Les unités ont passé dix.", "Dix unités font une dizaine.", "Cette dizaine s'ajoute aux dizaines."],
        };
      }
      return {
        prompt: `Dans ${a} + ${b}, les unités font ${sum}. Quel chiffre écrit-on sous les unités ?`,
        answer: String(sum - 10),
        wrong: wrongNumbers(ctx, sum - 10, [1, unitsOf(a), unitsOf(b), sum - 9], 0, 9),
        hints: ["Une dizaine a été retenue.", "On écrit seulement ce qui reste après la dizaine.", "Enlève dix aux unités."],
      };
    }
    const [a, b] = borrowPair(ctx, SUB_TOP[ctx.level]);
    const ua = unitsOf(a);
    const ub = unitsOf(b);
    return {
      prompt: `Dans ${a} − ${b}, on ne peut pas enlever ${ub} de ${ua}. On emprunte une dizaine, et ${ua} devient combien ?`,
      answer: String(ua + 10),
      wrong: wrongNumbers(ctx, ua + 10, [ua, 10, ua + 1, ub], 0, 19),
      hints: ["Une dizaine, c'est dix unités.", "Les unités gagnent la dizaine empruntée.", "Ajoute dix aux unités."],
    };
  });
}

/** « 47 + ___ = 85 » ou « 91 − ___ = 56 » : le nombre qui manque. */
export function makeCalcGap(ctx: GameContext): GeneratedGame {
  return gapGame(ctx, "calc-trou", "trouver le nombre qui manque dans un calcul", () => {
    if (ctx.rng() < 0.5) {
      const [a, b] = carryPair(ctx, ADD_TOP[ctx.level]);
      return {
        prompt: "Complète avec le bon nombre.",
        text: `${a} + ___ = ${a + b}`,
        answer: String(b),
        wrong: wrongNumbers(ctx, b, [b + 10, b - 10, b + 1, b - 1], 0, 99),
        hints: ["Cherche ce qu'il faut ajouter pour arriver au total.", "Retire le premier nombre du total, unités d'abord.", "Vérifie en refaisant l'addition."],
      };
    }
    const [a, b] = borrowPair(ctx, SUB_TOP[ctx.level]);
    return {
      prompt: "Complète avec le bon nombre.",
      text: `${a} − ___ = ${a - b}`,
      answer: String(b),
      wrong: wrongNumbers(ctx, b, [b + 10, b - 10, b + 1, b - 1], 0, 99),
      hints: ["Cherche ce qu'on a enlevé pour arriver au reste.", "Retire le reste du premier nombre, unités d'abord.", "Vérifie en refaisant la soustraction."],
    };
  });
}

/** Les étapes d'un calcul posé : l'addition avec retenue et la soustraction avec emprunt, chacune dans un seul ordre. */
export const CALC_STEPS: readonly { prompt: string; steps: readonly string[] }[] = [
  {
    prompt: "Mets dans le bon ordre les étapes d'une addition avec retenue.",
    steps: ["J'additionne les unités.", "J'écris les unités et je retiens une dizaine.", "J'additionne les dizaines avec la retenue."],
  },
  {
    prompt: "Mets dans le bon ordre les étapes d'une soustraction avec emprunt.",
    steps: ["Je regarde les unités.", "J'emprunte une dizaine pour avoir plus d'unités.", "J'enlève les unités.", "J'enlève les dizaines qui restent."],
  },
];

/** « Mets dans le bon ordre les étapes d'une addition avec retenue. » */
export function makeCalcSteps(ctx: GameContext): GeneratedGame {
  return sequenceGame(ctx, "calc-ordre", "remettre dans l'ordre les étapes d'un calcul", () => {
    const entry = pickFresh(ctx, CALC_STEPS, (candidate) => `calc-ordre:${candidate.prompt}`);
    return {
      prompt: entry.prompt,
      sequence: entry.steps,
      hints: ["Pense à ce qu'on fait en premier.", "Chaque étape prépare la suivante.", "Imagine l'opération posée en colonnes."],
    };
  });
}

/** « Relie chaque calcul à son résultat. » : des additions avec retenue et des soustractions avec emprunt, tous les résultats différents. */
export function makeCalcLinks(ctx: GameContext): GeneratedGame {
  return linkGame(ctx, "calc-relier", "relier un calcul et son résultat", () => {
    const wanted = ctx.level >= 3 ? 4 : 3;
    const chosen: { text: string; result: number }[] = [];
    for (let attempt = 0; attempt < 200 && chosen.length < wanted; attempt++) {
      const operation = randomOperation(ctx);
      if (chosen.every((other) => other.text !== operation.text && other.result !== operation.result)) chosen.push(operation);
    }
    return {
      prompt: "Relie chaque calcul à son résultat.",
      pairs: chosen.map((operation) => ({ left: operation.text, right: String(operation.result) })),
      hints: ["Calcule chaque opération, unités d'abord.", "Pense à la retenue ou à l'emprunt.", "Commence par le calcul dont tu es certain."],
    };
  });
}

/** « Glisse chaque addition dans la bonne case. » : avec retenue ou sans retenue. */
export function makeCalcSort(ctx: GameContext): GeneratedGame {
  return sortGame(ctx, "calc-glisser", "reconnaître une addition avec retenue", () => {
    const each = ctx.level === 1 ? 2 : 3;
    const topSum = ADD_TOP[ctx.level];
    const seen = new Set<string>();
    const draw = (carry: boolean): string => {
      for (let attempt = 0; attempt < 400; attempt++) {
        const a = randomInt(ctx.rng, 11, topSum - 11);
        const b = randomInt(ctx.rng, 11, topSum - 11);
        const key = [a, b].sort((x, y) => x - y).join("+");
        // Sans retenue : les unités restent sous dix et le total reste sous cent (sinon les dizaines retiendraient une centaine).
        const fits = carry ? unitsOf(a) + unitsOf(b) >= 10 && a + b <= topSum : unitsOf(a) + unitsOf(b) <= 9 && a + b <= Math.min(99, topSum);
        if (fits && !seen.has(key)) {
          seen.add(key);
          return `${a} + ${b}`;
        }
      }
      return carry ? "27 + 18" : "21 + 34";
    };
    const withCarry = Array.from({ length: each }, () => draw(true));
    const without = Array.from({ length: each }, () => draw(false));
    return {
      prompt: "Glisse chaque addition dans la bonne case.",
      zones: ["Avec retenue", "Sans retenue"],
      items: [...withCarry.map((text) => ({ text, zone: "Avec retenue" })), ...without.map((text) => ({ text, zone: "Sans retenue" }))],
      hints: ["Additionne les unités de chaque opération.", "Si les unités passent dix, il y a une retenue.", "Si les unités restent sous dix, il n'y a pas de retenue."],
    };
  });
}

// ===========================================================================
// LE MARCHÉ : les pièces, le prix, la monnaie
// ===========================================================================

const COIN_VALUES = [5, 10, 25, 50] as const;

/** Des choses qu'on achète au marché, au singulier, sans apostrophe. */
const GOODS: readonly string[] = ["une mangue", "un pain", "un cahier", "une banane", "une orange", "un crayon", "une règle", "un ballon"];

const coinPhrase = (value: number, count: number) => `${count} ${count > 1 ? "pièces" : "pièce"} de ${value} F`;

/** « Awa a 2 pièces de 25 F et 1 pièce de 10 F. Combien a-t-elle en tout ? » */
export function makeCoinsTotal(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "monnaie-somme", "additionner des pièces", () => {
    const child = pickFresh(ctx, CHILDREN, (candidate) => `monnaie-somme:${candidate.name}`);
    const top = MONEY_TOP[ctx.level];
    const totalOf = (list: { value: number; count: number }[]) => list.reduce((sum, part) => sum + part.value * part.count, 0);
    let parts: { value: number; count: number }[] = [
      { value: 25, count: 1 },
      { value: 10, count: 1 },
    ];
    for (let attempt = 0; attempt < 200; attempt++) {
      const kinds = shuffle(ctx.rng, COIN_VALUES).slice(0, ctx.level === 1 ? 2 : randomInt(ctx.rng, 2, 3));
      const candidate = kinds.map((value) => ({ value, count: randomInt(ctx.rng, 1, 3) }));
      if (totalOf(candidate) <= top && totalOf(candidate) >= 15) {
        parts = candidate;
        break;
      }
    }
    const total = totalOf(parts);
    const listed = parts.map((part) => coinPhrase(part.value, part.count));
    const sentence = listed.length === 1 ? listed[0] : `${listed.slice(0, -1).join(", ")} et ${listed[listed.length - 1]}`;
    // L'erreur de l'enfant : additionner les valeurs des pièces sans compter combien il y en a.
    const valuesOnly = parts.reduce((sum, part) => sum + part.value, 0);
    return {
      prompt: `${child.name} a ${sentence}. Combien ${hasHe(child)} en tout ?`,
      answer: String(total),
      wrong: wrongNumbers(ctx, total, [valuesOnly, total - 5, total + 5, total - 10, total + 10].filter((n) => n % 5 === 0), 5, 100),
      hints: [
        "Compte d'abord les pièces qui ont la même valeur, une sorte après l'autre.",
        "Additionne ensuite ce que valent toutes les sortes de pièces.",
        "Commence par les plus grosses pièces.",
      ],
    };
  });
}

/** La tranche d'un prix : jusqu'à 30 F, de 35 à 60 F, 65 F et plus. Chaque palier préfère la sienne (`makeChangeDue`). */
const priceBand = (price: number): 0 | 1 | 2 => (price <= 30 ? 0 : price <= 60 ? 1 : 2);

/** « Moussa achète un pain à 35 F. Il paie avec une pièce de 50 F. Combien lui rend-on ? » */
export function makeChangeDue(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "monnaie-rendre", "rendre la monnaie", () => {
    const child = pickFresh(ctx, CHILDREN, (candidate) => `monnaie-rendre:${candidate.name}`);
    const good = pick(ctx.rng, GOODS);
    // Chaque palier a sa tranche de prix (jusqu'à 30 F, de 35 à 60 F, 65 F et plus : le prix de 65 F ou plus ne se paie qu'avec une pièce de 100 F) :
    // sans cela, « achète un pain à 35 F, paie avec une pièce de 50 F » pouvait revenir d'un palier à l'autre. Le premier palier ne paie qu'avec 50 F.
    const purchases: { paid: number; price: number }[] = [];
    for (const coin of ctx.level === 1 ? [50] : [50, 100]) {
      for (let price = 5; price <= coin - 5; price += 5) purchases.push({ paid: coin, price });
    }
    const { paid, price } = pickPreferred(
      ctx,
      purchases,
      purchases.filter((purchase) => priceBand(purchase.price) === levelGroup(ctx.level)),
      (purchase) => `rendre-prix:${purchase.paid}:${purchase.price}`,
    );
    const change = paid - price;
    return {
      prompt: `${child.name} achète ${good} à ${price} F. ${cap(pronoun(child))} paie avec une pièce de ${paid} F. Combien lui rend-on ?`,
      answer: String(change),
      wrong: wrongNumbers(ctx, change, [change - 5, change + 5, change - 10, change + 10, price].filter((n) => n % 5 === 0), 5, 100),
      hints: [
        "On rend la différence entre ce qu'on donne et ce qu'on doit.",
        "Pars du prix et compte, de pièce en pièce, jusqu'à la somme donnée.",
        "Retire le prix de la somme donnée, unités d'abord.",
      ],
    };
  });
}

/** « Fatou a 80 F. Elle achète une mangue à 35 F. Combien lui reste-t-il ? Écris le nombre. » : une réponse courte. */
export function makeShopLeft(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "monnaie-achat", () => {
    const child = pickFresh(ctx, CHILDREN, (candidate) => `monnaie-achat:${candidate.name}`);
    const good = pick(ctx.rng, GOODS);
    const top = MONEY_TOP[ctx.level];
    let start = 50;
    let price = 15;
    for (let attempt = 0; attempt < 200; attempt++) {
      start = 5 * randomInt(ctx.rng, 4, top / 5);
      price = 5 * randomInt(ctx.rng, 1, start / 5 - 1);
      const left = start - price;
      // Un reste qui répète un des deux nombres de l'énoncé se confondrait avec lui.
      if (left !== price && left !== start) break;
    }
    const left = start - price;
    return {
      type: "short-answer",
      prompt: `${child.name} a ${start} F. ${cap(pronoun(child))} achète ${good} à ${price} F. Combien lui reste-t-il ? Écris le nombre.`,
      payload: { acceptedAnswers: [String(left)], game: originOf("monnaie-achat", ctx), concept: "calculer ce qu'il reste après un achat" },
      answerKey: String(left),
      hints: [
        "Ce qui reste, c'est ce qu'on avait moins ce qu'on a dépensé.",
        "Retire le prix de la somme de départ, unités d'abord.",
        "Compte à rebours depuis la somme de départ.",
      ],
    };
  });
}
