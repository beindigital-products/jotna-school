/**
 * LE CALCUL DU CE1 : additions avec retenue et soustractions avec emprunt (nombres jusqu'à 1 000), en ligne et par étapes, le calcul mental (ajouter ou
 * retrancher 10 et 100) et les petits problèmes du marché en FCFA (`ma-ce1-add-sous`).
 *
 * Sur l'échantillon de CE1, le modèle écrivait des soustractions sans emprunt rangées sous « emprunt », des sommes qui dépassent 1 000, « Awa a 750 FCFA,
 * elle dépense 275 FCFA » avec trois réponses proches. Ici le calcul est FAIT par le code, jamais écrit : une seule option juste par construction, et les mauvais choix
 * sont les erreurs d'enfant connues.
 *
 * - Une addition de ce fichier a TOUJOURS une retenue : les unités passent dix. Au troisième palier les dizaines peuvent aussi passer dix, au quatrième elles
 *   le font TOUJOURS (deux retenues). Une soustraction a TOUJOURS un emprunt : le chiffre des unités du premier nombre est plus petit que celui du second ; un
 *   deuxième emprunt aux dizaines vient aux deux derniers paliers. Un zéro aux dizaines du premier nombre est écarté (l'emprunt se propagerait de la centaine). Le
 *   résultat ne passe jamais mille.
 * - Les erreurs d'enfant : oublier la retenue (dix ou cent de moins), la compter deux fois, enlever le petit chiffre du grand sans emprunter (523 − 168 donne alors
 *   465), oublier de réduire le chiffre qui a prêté (dix de plus).
 * - L'argent : des prix qui sont des multiples de vingt-cinq FCFA, jamais plus de mille FCFA.
 * - Aucun indice n'écrit un chiffre : un résultat se lirait dedans.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { fresh, originOf, pick, pickFresh, randomInt, shuffle, type GameContext, type GameLevel, type GeneratedGame } from "./shared";
import { CHILDREN, hasHe, pronoun } from "./stories";
import { cap, choiceGame, gapGame, linkGame, sequenceGame, sortGame } from "./tableaux";
import { formatNumber } from "./patterns";
import { wrongNumbersCe1 } from "./nombresCe1";

const ADD_TOP: Record<GameLevel, number> = { 1: 400, 2: 700, 3: 1000, 4: 1000 };
const SUB_TOP: Record<GameLevel, number> = { 1: 400, 2: 700, 3: 1000, 4: 1000 };
const MONEY_TOP: Record<GameLevel, number> = { 1: 500, 2: 750, 3: 1000, 4: 1000 };

const show = (n: number) => formatNumber(n);
const unitsOf = (n: number) => n % 10;
const tensOf = (n: number) => Math.floor(n / 10) % 10;
const hundredsOf = (n: number) => Math.floor(n / 100) % 10;

// ===========================================================================
// DES OPÉRATIONS QUI ONT TOUJOURS UNE RETENUE OU UN EMPRUNT
// ===========================================================================

/** Les retenues d'une addition : les unités passent dix, puis les dizaines (avec la retenue des unités) passent dix. */
export const carriesOf = (a: number, b: number): { units: boolean; tens: boolean } => {
  const units = unitsOf(a) + unitsOf(b) >= 10;
  return { units, tens: tensOf(a) + tensOf(b) + (units ? 1 : 0) >= 10 };
};

/** Les emprunts d'une soustraction : les unités, puis les dizaines (après avoir prêté une dizaine aux unités). */
export const borrowsOf = (a: number, b: number): { units: boolean; tens: boolean } => {
  const units = unitsOf(a) < unitsOf(b);
  return { units, tens: tensOf(a) - (units ? 1 : 0) < tensOf(b) };
};

const FALLBACK_CARRY: Record<GameLevel, [number, number]> = { 1: [147, 38], 2: [265, 59], 3: [468, 97], 4: [587, 246] };
const FALLBACK_BORROW: Record<GameLevel, [number, number]> = { 1: [243, 58], 2: [364, 89], 3: [523, 168], 4: [632, 285] };

/**
 * Une addition dont les unités passent dix. Aux deux premiers paliers les dizaines ne passent pas dix ; au troisième elles peuvent ; au quatrième elles le
 * font toujours. La somme ne dépasse pas `top`.
 */
export function carryPairCe1(ctx: GameContext, top: number = ADD_TOP[ctx.level]): [number, number] {
  for (let attempt = 0; attempt < 500; attempt++) {
    const a = randomInt(ctx.rng, 101, top - 20);
    const b = randomInt(ctx.rng, 11, top - a);
    if (b < 11 || a + b > top) continue;
    const { units, tens } = carriesOf(a, b);
    if (!units) continue;
    if (ctx.level <= 2 && tens) continue;
    if (ctx.level === 4 && !tens) continue;
    return [a, b];
  }
  return [...FALLBACK_CARRY[ctx.level]];
}

/**
 * Une soustraction dont le chiffre des unités de a est plus petit que celui de b, sans zéro aux dizaines de a. Aux deux premiers paliers les dizaines ne
 * demandent pas d'emprunt ; au troisième elles le peuvent ; au quatrième elles le demandent toujours. Le résultat reste positif.
 */
export function borrowPairCe1(ctx: GameContext, top: number = SUB_TOP[ctx.level]): [number, number] {
  for (let attempt = 0; attempt < 500; attempt++) {
    const a = randomInt(ctx.rng, 121, top);
    const b = randomInt(ctx.rng, 11, a - 20);
    if (b >= a || tensOf(a) === 0) continue;
    const { units, tens } = borrowsOf(a, b);
    if (!units) continue;
    if (ctx.level <= 2 && tens) continue;
    if (ctx.level === 4 && !tens) continue;
    return [a, b];
  }
  return [...FALLBACK_BORROW[ctx.level]];
}

/** Une opération au hasard : addition avec retenue ou soustraction avec emprunt. */
function randomOperation(ctx: GameContext): { text: string; result: number } {
  if (ctx.rng() < 0.5) {
    const [a, b] = carryPairCe1(ctx);
    return { text: `${show(a)} + ${show(b)}`, result: a + b };
  }
  const [a, b] = borrowPairCe1(ctx);
  return { text: `${show(a)} − ${show(b)}`, result: a - b };
}

/** Le résultat d'une soustraction posée sans emprunter : le petit chiffre est enlevé du grand dans chaque colonne. */
export const noBorrowResult = (a: number, b: number): number =>
  100 * Math.abs(hundredsOf(a) - hundredsOf(b)) + 10 * Math.abs(tensOf(a) - tensOf(b)) + Math.abs(unitsOf(a) - unitsOf(b));

// ===========================================================================
// CALCULER
// ===========================================================================

/** « Combien font 347 + 285 ? » : les unités passent dix, parfois les dizaines. */
export function makeCe1CalcAdd(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce1-calc-ajouter", "additionner avec une retenue", () => {
    const [a, b] = carryPairCe1(ctx);
    const sum = a + b;
    const { tens } = carriesOf(a, b);
    return {
      prompt: `Combien font ${show(a)} + ${show(b)} ?`,
      answer: show(sum),
      // L'erreur de l'enfant : oublier la retenue (dix ou cent de moins), la compter deux fois (dix ou cent de plus).
      wrong: wrongNumbersCe1(ctx, sum, [sum - 10, sum + 10, tens ? sum - 100 : sum + 100, sum - 1, sum + 1], 100, 1000),
      hints: [
        "Additionne d'abord les unités.",
        "Si un rang passe dix, écris ce qui dépasse et retiens une unité du rang d'après.",
        "Ajoute la retenue aux dizaines, puis aux centaines.",
      ],
    };
  });
}

/** « Combien font 523 − 168 ? » : on ne peut pas enlever les unités sans emprunter. */
export function makeCe1CalcSub(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce1-calc-enlever", "soustraire avec un emprunt", () => {
    const [a, b] = borrowPairCe1(ctx);
    const result = a - b;
    return {
      prompt: `Combien font ${show(a)} − ${show(b)} ?`,
      answer: show(result),
      // Les erreurs classiques : enlever le petit chiffre du grand sans emprunter, oublier de réduire le chiffre qui a prêté.
      wrong: wrongNumbersCe1(ctx, result, [noBorrowResult(a, b), result + 10, result - 10, result + 100, result + 1], 1, 1000),
      hints: [
        "Regarde d'abord les unités.",
        "Si tu ne peux pas enlever, emprunte une unité du rang d'après pour avoir plus d'unités.",
        "Enlève ensuite les autres rangs, sans oublier ce que tu as prêté.",
      ],
    };
  });
}

/** Une question sur l'étape qui fait peur : ce qu'on écrit sous les dizaines, ce qu'on retient, ce que devient le chiffre quand on emprunte. */
export function makeCe1CalcCarryAsk(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce1-calc-retenue", "la retenue et l'emprunt", () => {
    const form = ctx.level >= 3 ? randomInt(ctx.rng, 0, 2) : randomInt(ctx.rng, 0, 1) * 2;
    if (form === 0) {
      // Le chiffre écrit sous les dizaines est la somme des dizaines et de la retenue, moins dix si elle passe dix.
      const [a, b] = carryPairCe1(ctx);
      const tensSum = tensOf(a) + tensOf(b) + 1;
      const written = tensSum >= 10 ? tensSum - 10 : tensSum;
      return {
        prompt: `Dans ${show(a)} + ${show(b)}, les unités ont passé dix. Quel chiffre écrit-on sous les dizaines, avec la retenue ?`,
        answer: String(written),
        wrong: wrongNumbersCe1(ctx, written, [tensSum, tensOf(a) + tensOf(b), tensOf(a), tensOf(b)], 0, 9),
        hints: ["Additionne les dizaines.", "N'oublie pas la dizaine retenue des unités.", "Si le total passe dix, écris seulement ce qui dépasse."],
      };
    }
    if (form === 1) {
      const [a, b] = carryPairCe1(ctx);
      const sum = unitsOf(a) + unitsOf(b);
      return {
        prompt: `Dans ${show(a)} + ${show(b)}, les unités font ${sum}. On écrit ${sum - 10}. Combien de dizaines retient-on ?`,
        answer: "1",
        wrong: ["0", "2"],
        hints: ["Les unités ont passé dix.", "Dix unités font une dizaine.", "Cette dizaine s'ajoute aux dizaines."],
      };
    }
    const [a, b] = borrowPairCe1(ctx);
    const ua = unitsOf(a);
    const ub = unitsOf(b);
    return {
      prompt: `Dans ${show(a)} − ${show(b)}, on ne peut pas enlever ${ub} de ${ua}. On emprunte une dizaine, et ${ua} devient combien ?`,
      answer: String(ua + 10),
      wrong: wrongNumbersCe1(ctx, ua + 10, [ua, 10, ua + 1, ub], 0, 19),
      hints: ["Une dizaine, c'est dix unités.", "Les unités gagnent la dizaine empruntée.", "Ajoute dix aux unités."],
    };
  });
}

/** « 347 + ___ = 632 » ou « 523 − ___ = 355 » : le nombre qui manque. */
export function makeCe1CalcGap(ctx: GameContext): GeneratedGame {
  return gapGame(ctx, "ce1-calc-trou", "trouver le nombre qui manque dans un calcul", () => {
    if (ctx.rng() < 0.5) {
      const [a, b] = carryPairCe1(ctx);
      return {
        prompt: "Complète avec le bon nombre.",
        text: `${show(a)} + ___ = ${show(a + b)}`,
        answer: show(b),
        wrong: wrongNumbersCe1(ctx, b, [b + 10, b - 10, b + 100, b - 100, b + 1, b - 1], 1, 999),
        hints: ["Cherche ce qu'il faut ajouter pour arriver au total.", "Retire le premier nombre du total, unités d'abord.", "Vérifie en refaisant l'addition."],
      };
    }
    const [a, b] = borrowPairCe1(ctx);
    return {
      prompt: "Complète avec le bon nombre.",
      text: `${show(a)} − ___ = ${show(a - b)}`,
      answer: show(b),
      wrong: wrongNumbersCe1(ctx, b, [b + 10, b - 10, b + 100, b - 100, b + 1, b - 1], 1, 999),
      hints: ["Cherche ce qu'on a enlevé pour arriver au reste.", "Retire le reste du premier nombre, unités d'abord.", "Vérifie en refaisant la soustraction."],
    };
  });
}

/** « Combien font 347 + 10 ? » : ajouter ou retrancher dix ou cent de tête. Aux niveaux 3 et 4, la dizaine ou la centaine change. */
export function makeCe1CalcMental(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce1-calc-mental", "ajouter ou retrancher dix ou cent de tête", () => {
    const top = ADD_TOP[ctx.level];
    const step = ctx.level === 1 ? 10 : ctx.level === 2 ? 100 : pick(ctx.rng, [10, 100]);
    const plus = ctx.rng() < 0.5;
    let n: number;
    if (ctx.level >= 3 && step === 10 && ctx.rng() < 0.7) {
      // Un nombre dont les dizaines sont au bord : 395 + 10 passe la centaine, 400 − 10 la repasse en arrière.
      const multiple = 100 * randomInt(ctx.rng, 2, Math.floor(top / 100) - 1);
      n = (plus ? multiple - 10 : multiple) + randomInt(ctx.rng, 0, 9);
    } else if (plus) {
      n = randomInt(ctx.rng, 100, top - step);
    } else {
      n = randomInt(ctx.rng, 100 + step, top);
    }
    const result = plus ? n + step : n - step;
    const other = step === 10 ? 100 : 10;
    return {
      prompt: `Combien font ${show(n)} ${plus ? "+" : "−"} ${step} ?`,
      answer: show(result),
      wrong: wrongNumbersCe1(ctx, result, [plus ? n + other : n - other, plus ? n - step : n + step, n, plus ? result + 1 : result - 1], 1, 1000),
      hints: [
        step === 10 ? "Seul le chiffre des dizaines change." : "Seul le chiffre des centaines change.",
        plus ? "Ajouter, c'est avancer d'un rang de plus." : "Retrancher, c'est reculer d'un rang de moins.",
        "Les autres chiffres restent les mêmes, sauf si un chiffre arrive au bout.",
      ],
    };
  });
}

// ===========================================================================
// LES ÉTAPES, RELIER, RANGER
// ===========================================================================

/** Les étapes d'un calcul posé, chacune dans un seul ordre : poser une addition, l'addition avec retenue, poser une soustraction, la soustraction avec emprunt. */
export const CALC_STEPS_CE1: readonly { prompt: string; steps: readonly string[] }[] = [
  {
    prompt: "Mets dans le bon ordre les étapes pour poser une addition.",
    steps: [
      "J'écris un nombre en haut.",
      "J'écris l'autre nombre en dessous, unités sous unités.",
      "Je trace un trait sous les nombres.",
      "J'additionne en commençant par les unités.",
    ],
  },
  {
    prompt: "Mets dans le bon ordre les étapes d'une addition avec retenue.",
    steps: ["J'additionne les unités.", "J'écris les unités et je retiens une dizaine.", "J'additionne les dizaines avec la retenue.", "J'additionne les centaines."],
  },
  {
    prompt: "Mets dans le bon ordre les étapes pour poser une soustraction.",
    steps: [
      "J'écris le plus grand nombre en haut.",
      "J'écris l'autre nombre en dessous, unités sous unités.",
      "Je trace un trait sous les nombres.",
      "Je soustrais en commençant par les unités.",
    ],
  },
  {
    prompt: "Mets dans le bon ordre les étapes d'une soustraction avec emprunt.",
    steps: [
      "Je regarde les unités.",
      "J'emprunte une dizaine pour avoir plus d'unités.",
      "J'enlève les unités.",
      "J'enlève les dizaines, sans oublier celle que j'ai prêtée.",
      "J'enlève les centaines.",
    ],
  },
];

/** « Mets dans le bon ordre les étapes d'une addition avec retenue. » : chaque palier a sa suite d'étapes. */
export function makeCe1CalcSteps(ctx: GameContext): GeneratedGame {
  return sequenceGame(ctx, "ce1-calc-ordre", "remettre dans l'ordre les étapes d'un calcul", () => {
    const entry = CALC_STEPS_CE1[ctx.level - 1];
    return {
      prompt: entry.prompt,
      sequence: entry.steps,
      hints: ["Pense à ce qu'on fait en premier.", "Chaque étape prépare la suivante.", "Imagine l'opération posée en colonnes."],
    };
  });
}

/** « Relie chaque calcul à son résultat. » : des additions avec retenue et des soustractions avec emprunt, tous les résultats différents. */
export function makeCe1CalcLinks(ctx: GameContext): GeneratedGame {
  return linkGame(ctx, "ce1-calc-relier", "relier un calcul et son résultat", () => {
    const wanted = ctx.level >= 3 ? 4 : 3;
    const chosen: { text: string; result: number }[] = [];
    for (let attempt = 0; attempt < 300 && chosen.length < wanted; attempt++) {
      const operation = randomOperation(ctx);
      if (chosen.every((other) => other.text !== operation.text && other.result !== operation.result)) chosen.push(operation);
    }
    return {
      prompt: "Relie chaque calcul à son résultat.",
      pairs: chosen.map((operation) => ({ left: operation.text, right: show(operation.result) })),
      hints: ["Calcule chaque opération, unités d'abord.", "Pense à la retenue ou à l'emprunt.", "Commence par le calcul dont tu es certain."],
    };
  });
}

/** « Glisse chaque addition dans la bonne case. » : avec retenue (à un rang quelconque, mille compris) ou sans retenue. */
export function makeCe1CalcSort(ctx: GameContext): GeneratedGame {
  return sortGame(ctx, "ce1-calc-glisser", "reconnaître une addition avec retenue", () => {
    const each = ctx.level === 1 ? 2 : 3;
    const top = ADD_TOP[ctx.level];
    const seen = new Set<string>();
    const draw = (carry: boolean): string => {
      for (let attempt = 0; attempt < 600; attempt++) {
        const a = randomInt(ctx.rng, 111, top - 11);
        const b = randomInt(ctx.rng, 11, top - a);
        if (b < 11 || a + b > top) continue;
        const { units, tens } = carriesOf(a, b);
        // Une somme de mille ou plus a aussi une retenue : celle des centaines.
        const hasCarry = units || tens || a + b >= 1000;
        const key = [a, b].sort((x, y) => x - y).join("+");
        if (hasCarry === carry && !seen.has(key)) {
          seen.add(key);
          return `${show(a)} + ${show(b)}`;
        }
      }
      return carry ? "247 + 38" : "211 + 134";
    };
    const withCarry = Array.from({ length: each }, () => draw(true));
    const without = Array.from({ length: each }, () => draw(false));
    return {
      prompt: "Glisse chaque addition dans la bonne case.",
      zones: ["Avec retenue", "Sans retenue"],
      items: [...withCarry.map((text) => ({ text, zone: "Avec retenue" })), ...without.map((text) => ({ text, zone: "Sans retenue" }))],
      hints: ["Additionne les unités de chaque opération.", "Si un rang passe dix, il y a une retenue.", "Si aucun rang ne passe dix, il n'y a pas de retenue."],
    };
  });
}

/** « Pose et calcule 347 + 285. Écris le résultat. » : une réponse courte, « 1 000 » vaut « 1000 ». */
export function makeCe1CalcWrite(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "ce1-calc-ecrire", () => {
    const addition = ctx.rng() < 0.5;
    const [a, b] = addition ? carryPairCe1(ctx) : borrowPairCe1(ctx);
    const result = addition ? a + b : a - b;
    return {
      type: "short-answer",
      prompt: `Pose et calcule ${show(a)} ${addition ? "+" : "−"} ${show(b)}. Écris le résultat.`,
      payload: { acceptedAnswers: [String(result)], game: originOf("ce1-calc-ecrire", ctx), concept: addition ? "poser une addition avec retenue" : "poser une soustraction avec emprunt" },
      answerKey: String(result),
      hints: [
        "Pose le calcul en colonnes, unités sous unités.",
        addition ? "Commence par les unités et retiens quand un rang passe dix." : "Commence par les unités et emprunte quand tu ne peux pas enlever.",
        "Vérifie avec l'opération qui fait le contraire.",
      ],
    };
  });
}

// ===========================================================================
// LE MARCHÉ : les prix en FCFA
// ===========================================================================

/** Des choses qu'on achète au marché, au singulier, sans apostrophe. */
const GOODS: readonly string[] = ["un pain", "un cahier", "un ballon", "une règle", "un seau", "une casserole", "un livre", "une natte"];

/** Un prix qui est un multiple de vingt-cinq FCFA, entre `lo` et `hi`. */
const priceBetween = (ctx: GameContext, lo: number, hi: number) => 25 * randomInt(ctx.rng, Math.ceil(lo / 25), Math.floor(hi / 25));

const francs = (values: readonly string[]) => values.map((value) => `${value} FCFA`);

/**
 * Un problème d'argent : ce qu'il reste après un achat, le total de deux achats, ou la monnaie rendue sur un billet de mille FCFA. Les prix sont des
 * multiples de vingt-cinq ; le total ne dépasse jamais mille FCFA.
 */
export function makeCe1CalcMoney(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce1-calc-fcfa", "résoudre un petit problème d'argent en FCFA", () => {
    const child = pickFresh(ctx, CHILDREN, (candidate) => `ce1-calc-fcfa:${candidate.name}`);
    const top = MONEY_TOP[ctx.level];
    const form = ctx.level === 1 ? randomInt(ctx.rng, 0, 1) : randomInt(ctx.rng, 0, ctx.level >= 3 ? 2 : 1);
    if (form === 0) {
      const start = priceBetween(ctx, 200, top);
      const price = priceBetween(ctx, 50, start - 50);
      const left = start - price;
      return {
        prompt: `${child.name} a ${show(start)} FCFA. ${cap(pronoun(child))} achète ${pick(ctx.rng, GOODS)} à ${show(price)} FCFA. Combien lui reste-t-il ?`,
        answer: `${show(left)} FCFA`,
        wrong: francs(wrongNumbersCe1(ctx, left, [left + 25, left - 25, left + 50, left - 50, start + price, price].filter((n) => n % 25 === 0), 25, 1000)),
        hints: [
          "Ce qui reste, c'est ce qu'on avait moins ce qu'on a dépensé.",
          "Retire le prix de la somme de départ, unités d'abord.",
          "Compte à rebours depuis la somme de départ.",
        ],
      };
    }
    if (form === 1) {
      const first = priceBetween(ctx, 100, Math.floor(top / 2) - 25);
      const second = priceBetween(ctx, 100, top - first);
      const sum = first + second;
      const goods = shuffle(ctx.rng, GOODS).slice(0, 2);
      return {
        prompt: `${child.name} achète ${goods[0]} à ${show(first)} FCFA et ${goods[1]} à ${show(second)} FCFA. Combien ${hasHe(child)} payé en tout ?`,
        answer: `${show(sum)} FCFA`,
        wrong: francs(wrongNumbersCe1(ctx, sum, [sum + 25, sum - 25, sum + 50, sum - 50, sum - 100, second - first].filter((n) => n % 25 === 0), 100, 1000)),
        hints: [
          "Pour savoir ce qu'on paie en tout, on additionne les deux prix.",
          "Additionne d'abord les unités, puis les dizaines, puis les centaines.",
          "Vérifie que le total est plus grand que chaque prix.",
        ],
      };
    }
    const price = priceBetween(ctx, 150, 900);
    const change = 1000 - price;
    return {
      prompt: `${child.name} achète ${pick(ctx.rng, GOODS)} à ${show(price)} FCFA. ${cap(pronoun(child))} paie avec un billet de 1 000 FCFA. Combien lui rend-on ?`,
      answer: `${show(change)} FCFA`,
      wrong: francs(wrongNumbersCe1(ctx, change, [change + 25, change - 25, change + 50, change - 50, change + 100, change - 100, price].filter((n) => n % 25 === 0), 25, 1000)),
      hints: [
        "On rend la différence entre ce qu'on donne et ce qu'on doit.",
        "Pars du prix et compte jusqu'à la somme donnée.",
        "Retire le prix de la somme donnée, unités d'abord.",
      ],
    };
  });
}
