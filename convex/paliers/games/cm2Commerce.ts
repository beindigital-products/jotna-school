/**
 * ACHETER, VENDRE, GAGNER AU CM2 (`ma-cm2-commerce`) : le budget d'une famille, le prix d'achat, les frais, le prix de revient, le prix de vente, le
 * bénéfice et la perte, en francs CFA.
 *
 * Sur l'échantillon, le modèle écrivait « prix de revient = prix de vente - bénéfice » sans dire que c'est le prix d'achat PLUS les frais, calculait un
 * « bénéfice » négatif et appelait « gain » une perte. Ici la réponse est CALCULÉE sur des entiers de francs : le prix de revient est le prix d'achat plus
 * les frais, le bénéfice est le prix de vente moins le prix de revient (quand il est positif), la perte est la différence inverse, et un article n'est jamais
 * vendu exactement à son prix de revient.
 *
 * - LES CINQ PALIERS (`stepOf`) : des sommes de quelques milliers de francs, de cent en cent ; des dizaines de milliers de francs ; des centaines de milliers
 *   (plusieurs sacs à payer) ; des millions de francs ; jusqu'à neuf millions de francs avec plusieurs articles.
 * - LES ERREURS D'ENFANT : oublier les frais, les soustraire au lieu de les ajouter, prendre le prix de vente pour le prix de revient, appeler perte un
 *   bénéfice, additionner au lieu de soustraire.
 * - Les sommes s'écrivent comme à l'école : « 12 500 FCFA », les milliers séparés par une espace. Les énoncés n'ont aucun « : », au plus une apostrophe droite,
 *   vingt-huit mots au plus. Aucun indice n'écrit un chiffre : un résultat se lirait dedans.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { fresh, originOf, pick, randomInt, shuffle, type GameContext, type GeneratedGame } from "./shared";
import { choiceGame, gapGame, linkGame, sequenceGame, sortGame } from "./tableaux";
import { show, stepOf, wrongNumbers, type Step } from "./cm1MathsOutils";
import { fcfa } from "./cm2MathsOutils";

// ===========================================================================
// LES SOMMES ET LES ARTICLES
// ===========================================================================

/** L'unité des sommes (on compte de ... en ...), le plus petit et le plus grand prix de revient servis à chaque palier. */
const SCALE: Record<Step, { unit: number; lo: number; hi: number }> = {
  1: { unit: 100, lo: 1000, hi: 9000 },
  2: { unit: 500, lo: 5000, hi: 90000 },
  3: { unit: 1000, lo: 20000, hi: 500000 },
  4: { unit: 5000, lo: 100000, hi: 2000000 },
  5: { unit: 10000, lo: 500000, hi: 9000000 },
};

/** Des marchandises dites en peu de mots : l'énoncé écrit déjà trois grandes sommes, et vingt-huit mots au plus. */
const GOODS = ["du riz", "du mil", "du sucre", "du savon", "du poisson", "des pagnes", "des arachides"] as const;
const FEES = ["de transport", "de frais"] as const;

/** Une somme ronde entre `lo` et `hi`, au multiple de l'unité du palier. */
function amount(ctx: GameContext, lo: number, hi: number): number {
  const { unit } = SCALE[stepOf(ctx)];
  return randomInt(ctx.rng, Math.ceil(lo / unit), Math.floor(hi / unit)) * unit;
}

/** Un prix d'achat, des frais et un bénéfice qui vont ensemble : les frais font un dixième à un cinquième de l'achat, le bénéfice un dixième à un tiers. */
function priceSet(ctx: GameContext): { achat: number; frais: number; revient: number; benefice: number; vente: number } {
  const { unit, lo, hi } = SCALE[stepOf(ctx)];
  const achat = amount(ctx, lo, hi);
  const frais = Math.max(unit, Math.round((achat * (0.1 + ctx.rng() * 0.1)) / unit) * unit);
  const revient = achat + frais;
  const benefice = Math.max(unit, Math.round((revient * (0.1 + ctx.rng() * 0.2)) / unit) * unit);
  return { achat, frais, revient, benefice, vente: revient + benefice };
}

/** Les deux mauvais choix d'une somme en francs : comme `wrongNumbers`, avec le plus petit pas du palier. */
function wrongSums(ctx: GameContext, answer: number, pool: readonly number[], avoid: readonly number[] = []): [string, string] {
  return wrongNumbers(ctx, answer, pool, 1, 99999999, avoid);
}

// ===========================================================================
// LE PRIX DE REVIENT, LE BÉNÉFICE, GAGNER OU PERDRE
// ===========================================================================

/** « Un commerçant achète des sacs de riz pour 12 500 FCFA et paie 1 500 FCFA de transport. Quel est son prix de revient ? » */
export function makeCm2ComCost(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "cm2-com-revient", "calculer le prix de revient", () => {
    const { achat, frais, revient } = priceSet(ctx);
    const goods = pick(ctx.rng, GOODS);
    const fee = pick(ctx.rng, FEES);
    return {
      prompt: `Un commerçant achète ${goods} pour ${fcfa(achat)} et paie ${fcfa(frais)} ${fee}. Quel est son prix de revient ?`,
      answer: show(revient),
      // Les erreurs d'enfant : oublier les frais, les soustraire, ne garder que les frais.
      // Jamais un nombre que l'énoncé écrit déjà : le prix d'achat et les frais ne sont pas des mauvais choix.
      wrong: wrongSums(ctx, revient, [achat - frais, revient + frais, revient * 10 > 99999999 ? -1 : revient * 10, Math.floor(revient / 10)], [achat, frais]),
      hints: ["Le prix de revient est tout ce que le commerçant a payé.", "Il comprend le prix d'achat et les frais.", "Ajoute les frais au prix d'achat."],
    };
  });
}

/** « Un sac revient à 14 000 FCFA. Le commerçant le vend 16 500 FCFA. Quel est son bénéfice ? » */
export function makeCm2ComProfit(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "cm2-com-benefice", "calculer le bénéfice", () => {
    const { revient, benefice, vente } = priceSet(ctx);
    return {
      prompt: `Un article revient à ${fcfa(revient)}. Le commerçant le vend ${fcfa(vente)}. Quel est son bénéfice ?`,
      answer: show(benefice),
      // Les erreurs d'enfant : additionner au lieu de soustraire, prendre le prix de vente ou de revient pour le bénéfice.
      wrong: wrongSums(ctx, benefice, [vente + revient, benefice * 10, Math.floor(benefice / 10)], [revient, vente]),
      hints: ["Le bénéfice est ce que le commerçant gagne en plus.", "Compare le prix de vente et le prix de revient.", "Enlève le prix de revient au prix de vente."],
    };
  });
}

/** « Un commerçant a payé un sac 14 000 FCFA en tout. Il le vend 12 500 FCFA. Que se passe-t-il ? » : il gagne ou il perd, et combien. */
export function makeCm2ComGainOrLoss(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "cm2-com-gain-perte", "dire si le commerçant gagne ou perd", () => {
    const { revient, benefice } = priceSet(ctx);
    const gain = ctx.rng() < 0.5;
    const { unit } = SCALE[stepOf(ctx)];
    const diff = gain ? benefice : Math.max(unit, Math.min(benefice, revient - unit));
    const vente = gain ? revient + diff : revient - diff;
    const sentence = (win: boolean, sum: number) => `Il ${win ? "gagne" : "perd"} ${fcfa(sum)}.`;
    const otherSum = diff + (ctx.rng() < 0.5 ? unit * randomInt(ctx.rng, 1, 3) : -unit * Math.min(randomInt(ctx.rng, 1, 3), Math.floor(diff / unit) - 1));
    return {
      prompt: `Un commerçant a payé un article ${fcfa(revient)} en tout. Il le vend ${fcfa(vente)}. Que se passe-t-il ?`,
      answer: sentence(gain, diff),
      // Les erreurs d'enfant : le gain pour la perte, ou la bonne direction avec une autre somme.
      wrong: [sentence(!gain, diff), sentence(gain, otherSum > 0 && otherSum !== diff ? otherSum : diff + unit)],
      hints: ["Compare le prix de vente et le prix payé en tout.", "Si on vend plus cher qu'on a payé, on gagne ; sinon, on perd.", "Pour savoir de combien, calcule l'écart entre les deux prix."],
    };
  });
}

// ===========================================================================
// LE PRIX DE VENTE, LE REVIENT, L'ACHAT, LA PERTE : LE NOMBRE QUI MANQUE
// ===========================================================================

/** Quatre phrases à trou : le prix de vente, le prix de revient, le prix d'achat, la perte. */
export function makeCm2ComGap(ctx: GameContext): GeneratedGame {
  return gapGame(ctx, "cm2-com-vente", "trouver le prix ou la somme qui manque", () => {
    const step = stepOf(ctx);
    const set = priceSet(ctx);
    const form = pick(ctx.rng, step === 1 ? ["vente", "revient"] : ["vente", "revient", "achat", "perte"]);
    const wrongFrom = (answer: number, pool: readonly number[], avoid: readonly number[]) => wrongSums(ctx, answer, pool, avoid);
    if (form === "vente") {
      return {
        prompt: "Complète avec le bon nombre.",
        text: `${show(set.revient)} FCFA de revient et ${show(set.benefice)} FCFA de bénéfice donnent un prix de vente de ___ FCFA.`,
        answer: show(set.vente),
        wrong: wrongFrom(set.vente, [set.revient - set.benefice, set.benefice, set.revient], [set.revient, set.benefice]),
        hints: ["Le prix de vente couvre le prix de revient.", "Il comprend aussi le bénéfice.", "Ajoute le bénéfice au prix de revient."],
      };
    }
    if (form === "revient") {
      return {
        prompt: "Complète avec le bon nombre.",
        text: `Un article est vendu ${show(set.vente)} FCFA avec ${show(set.benefice)} FCFA de bénéfice. Son prix de revient est de ___ FCFA.`,
        answer: show(set.revient),
        wrong: wrongFrom(set.revient, [set.vente + set.benefice, set.benefice, set.vente], [set.vente, set.benefice]),
        hints: ["Le prix de vente est plus grand que le prix de revient.", "La différence est le bénéfice.", "Enlève le bénéfice au prix de vente."],
      };
    }
    if (form === "achat") {
      return {
        prompt: "Complète avec le bon nombre.",
        text: `Un article revient à ${show(set.revient)} FCFA, dont ${show(set.frais)} FCFA de frais. Son prix d'achat est de ___ FCFA.`,
        answer: show(set.achat),
        wrong: wrongFrom(set.achat, [set.revient + set.frais, set.frais, set.revient], [set.revient, set.frais]),
        hints: ["Le prix de revient comprend le prix d'achat et les frais.", "Le prix d'achat est ce qui reste sans les frais.", "Enlève les frais au prix de revient."],
      };
    }
    const loss = Math.max(SCALE[step].unit, Math.min(set.benefice, set.revient - SCALE[step].unit));
    return {
      prompt: "Complète avec le bon nombre.",
      text: `Un article revient à ${show(set.revient)} FCFA et il est vendu ${show(set.revient - loss)} FCFA. La perte est de ___ FCFA.`,
      answer: show(loss),
      wrong: wrongFrom(loss, [set.revient + (set.revient - loss), set.revient - loss, set.revient], [set.revient, set.revient - loss]),
      hints: ["On perd quand on vend moins cher qu'on n'a payé.", "La perte est l'écart entre les deux prix.", "Enlève le plus petit prix au plus grand."],
    };
  });
}

// ===========================================================================
// LE BUDGET, LA QUANTITÉ ACHETÉE
// ===========================================================================

const EXPENSES = ["de loyer", "de nourriture", "de transport", "d'école", "d'électricité", "de santé"] as const;

/** « Une famille gagne 150 000 FCFA par mois. Elle paie 40 000 FCFA de loyer et 60 000 FCFA de nourriture. Que lui reste-t-il ? » */
export function makeCm2ComBudget(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "cm2-com-budget", "calculer ce qui reste du budget d'une famille", () => {
    const step = stepOf(ctx);
    const { unit, lo, hi } = SCALE[step];
    // Trois dépenses au troisième palier seulement : aux paliers des millions, l'énoncé tiendrait en plus de vingt-huit mots.
    const count = step === 3 ? 3 : 2;
    const labels = shuffle(ctx.rng, EXPENSES.filter((e) => !e.includes("'"))).slice(0, count);
    const spent = labels.map(() => amount(ctx, Math.max(unit, Math.round(lo / 4)), Math.round(hi / 2)));
    const total = spent.reduce((a, b) => a + b, 0);
    const income = total + amount(ctx, unit * 2, Math.max(unit * 4, Math.round(hi / 3)));
    const left = income - total;
    const list = spent.map((s, i) => `${fcfa(s)} ${labels[i]}`);
    const sentence = `${list.slice(0, -1).join(", ")} et ${list[list.length - 1]}`;
    return {
      prompt: `Une famille gagne ${fcfa(income)}. Elle paie ${sentence}. Que lui reste-t-il ?`,
      answer: show(left),
      // Les erreurs d'enfant : une seule dépense enlevée, les dépenses additionnées avec le revenu, le total des dépenses pour le reste.
      wrong: wrongSums(ctx, left, [income - spent[0], income + total, total, income - total + unit * 10, income - total - spent[spent.length - 1]], [income, ...spent]),
      hints: ["Additionne d'abord toutes les dépenses.", "Le reste est ce que la famille garde.", "Enlève le total des dépenses à ce que la famille gagne."],
    };
  });
}

const UNITS: readonly { name: string; each: string }[] = [
  { name: "sacs de riz", each: "le sac" },
  { name: "sacs de mil", each: "le sac" },
  { name: "pagnes", each: "le pagne" },
  { name: "cartons de savon", each: "le carton" },
  { name: "bidons d'huile", each: "le bidon" },
];

/** « Un commerçant achète 12 sacs de riz à 8 500 FCFA le sac. Combien paie-t-il en tout ? » ; deux sortes d'articles dès le quatrième palier. */
export function makeCm2ComQuantity(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "cm2-com-quantite", "calculer le prix d'achat de plusieurs articles", () => {
    const step = stepOf(ctx);
    const { unit, lo, hi } = SCALE[step];
    const units = shuffle(ctx.rng, UNITS.filter((u) => !u.name.includes("'")));
    const draw = () => ({ n: randomInt(ctx.rng, 3, step <= 2 ? 12 : 40), price: Math.max(unit, amount(ctx, Math.round(lo / 12), Math.round(hi / 12))) });
    const first = draw();
    if (step >= 4) {
      const second = draw();
      const total = first.n * first.price + second.n * second.price;
      return {
        prompt: `Un commerçant achète ${first.n} ${units[0].name} à ${fcfa(first.price)} ${units[0].each} et ${second.n} ${units[1].name} à ${fcfa(second.price)} ${units[1].each}. Combien paie-t-il en tout ?`,
        answer: show(total),
        wrong: wrongSums(ctx, total, [first.n * first.price, second.n * second.price, (first.n + second.n) * first.price, (first.n + second.n) * (first.price + second.price), total + first.price]),
        hints: ["Calcule d'abord ce que coûtent les articles de chaque sorte.", "Pour une sorte, multiplie le nombre d'articles par le prix d'un seul.", "Puis additionne les deux sommes."],
      };
    }
    const total = first.n * first.price;
    return {
      prompt: `Un commerçant achète ${first.n} ${units[0].name} à ${fcfa(first.price)} ${units[0].each}. Combien paie-t-il en tout ?`,
      answer: show(total),
      wrong: wrongSums(ctx, total, [first.n + first.price, total * 10, Math.floor(total / 10), total + first.price, total - first.price]),
      hints: ["Tous les articles ont le même prix.", "Pour trouver le prix de tous, multiplie.", "Multiplie le nombre d'articles par le prix d'un seul."],
    };
  });
}

// ===========================================================================
// ÉCRIRE, RANGER, RELIER, CLASSER
// ===========================================================================

/** « Un article revient à 14 000 FCFA. Il est vendu 16 500 FCFA. Écris le bénéfice en FCFA. » : une réponse à écrire. */
export function makeCm2ComWrite(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "cm2-com-ecrire", () => {
    const step = stepOf(ctx);
    const set = priceSet(ctx);
    const form = pick(ctx.rng, step === 1 ? ["revient", "benefice"] : ["revient", "benefice", "vente", "perte"]);
    let prompt: string;
    let result: number;
    if (form === "revient") {
      prompt = `Un commerçant achète un article ${fcfa(set.achat)} et paie ${fcfa(set.frais)} de frais. Écris son prix de revient en FCFA.`;
      result = set.revient;
    } else if (form === "benefice") {
      prompt = `Un article revient à ${fcfa(set.revient)}. Il est vendu ${fcfa(set.vente)}. Écris le bénéfice en FCFA.`;
      result = set.benefice;
    } else if (form === "vente") {
      prompt = `Un article revient à ${fcfa(set.revient)}. Le commerçant veut ${fcfa(set.benefice)} de bénéfice. Écris le prix de vente en FCFA.`;
      result = set.vente;
    } else {
      const loss = Math.max(SCALE[step].unit, Math.min(set.benefice, set.revient - SCALE[step].unit));
      prompt = `Un article revient à ${fcfa(set.revient)}. Il est vendu ${fcfa(set.revient - loss)}. Écris la perte en FCFA.`;
      result = loss;
    }
    return {
      type: "short-answer",
      prompt,
      payload: { acceptedAnswers: [show(result), String(result)], game: originOf("cm2-com-ecrire", ctx), concept: "écrire une somme du commerce en FCFA" },
      answerKey: show(result),
      hints: ["Repère ce qu'on te demande : un prix de revient, un prix de vente, un bénéfice ou une perte.", "Écris seulement le nombre, sans mot.", "Les milliers se séparent par une espace, ou ne se séparent pas."],
    };
  });
}

/** « Range ces prix de revient, du plus petit au plus grand. » : quatre sommes « achat + frais ». */
export function makeCm2ComOrder(ctx: GameContext): GeneratedGame {
  return sequenceGame(ctx, "cm2-com-ranger", "ranger des prix de revient", () => {
    const sums = new Map<number, string>();
    while (sums.size < 4) {
      const { achat, frais, revient } = priceSet(ctx);
      if (!sums.has(revient)) sums.set(revient, `${show(achat)} + ${show(frais)}`);
    }
    const ascending = ctx.rng() < 0.65;
    return {
      prompt: ascending ? "Range ces prix de revient, du plus petit au plus grand." : "Range ces prix de revient, du plus grand au plus petit.",
      sequence: [...sums.entries()].sort((a, b) => (ascending ? a[0] - b[0] : b[0] - a[0])).map(([, text]) => text),
      hints: ["Chaque ligne est un prix d'achat et des frais à additionner.", "Calcule chaque prix de revient.", ascending ? "Mets d'abord le plus petit prix de revient." : "Mets d'abord le plus grand prix de revient."],
    };
  });
}

const DEFINITIONS: readonly (readonly [string, string])[] = [
  ["Prix de revient", "Prix d'achat plus frais"],
  ["Bénéfice", "Prix de vente moins prix de revient"],
  ["Perte", "Prix de revient moins prix de vente"],
  ["Prix de vente", "Prix de revient plus bénéfice"],
];

/** « Relie chaque mot à ce qu'il veut dire. » (les premiers paliers) ou « Relie chaque situation à ce qui se passe. » : trois paires. */
export function makeCm2ComLinks(ctx: GameContext): GeneratedGame {
  return linkGame(ctx, "cm2-com-relier", "relier un mot du commerce à son sens ou une situation à son résultat", () => {
    const step = stepOf(ctx);
    if (step <= 2 && ctx.rng() < 0.6) {
      const chosen = shuffle(ctx.rng, DEFINITIONS).slice(0, 3);
      return {
        prompt: "Relie chaque mot à ce qu'il veut dire.",
        pairs: chosen.map(([left, right]) => ({ left, right })),
        hints: ["Le prix de revient comprend tout ce que le commerçant a payé.", "Le bénéfice et la perte comparent deux prix.", "Commence par le mot dont tu es le plus sûr."],
      };
    }
    const pairs: { left: string; right: string }[] = [];
    const seen = new Set<number>();
    // Au moins un bénéfice et une perte : trois pertes de suite se devineraient.
    const wins = shuffle(ctx.rng, [true, false, ctx.rng() < 0.5]);
    while (pairs.length < 3) {
      const { revient, benefice } = priceSet(ctx);
      const { unit } = SCALE[step];
      const win = wins[pairs.length];
      const diff = win ? benefice : Math.max(unit, Math.min(benefice, revient - unit));
      if (seen.has(diff) || seen.has(-diff)) continue;
      seen.add(win ? diff : -diff);
      pairs.push({ left: `Revient à ${show(revient)}, vendu ${show(win ? revient + diff : revient - diff)}`, right: `${win ? "Bénéfice" : "Perte"} de ${show(diff)}` });
    }
    return {
      prompt: "Relie chaque situation à ce qui se passe, en FCFA.",
      pairs,
      hints: ["Compare le prix de vente et le prix de revient.", "Un prix de vente plus grand donne un bénéfice, plus petit une perte.", "Pour savoir de combien, calcule l'écart entre les deux prix."],
    };
  });
}

/** « Glisse chaque situation dans la bonne case. » : deux situations de bénéfice et deux de perte. */
export function makeCm2ComSort(ctx: GameContext): GeneratedGame {
  return sortGame(ctx, "cm2-com-glisser", "classer des ventes en bénéfice ou en perte", () => {
    const { unit } = SCALE[stepOf(ctx)];
    const zones: readonly [string, string] = ["Bénéfice", "Perte"];
    const items: { text: string; zone: string }[] = [];
    const seen = new Set<string>();
    while (items.length < 4) {
      const { revient, benefice } = priceSet(ctx);
      const win = items.length % 2 === 0;
      const sold = win ? revient + benefice : revient - Math.max(unit, Math.min(benefice, revient - unit));
      const text = `Revient à ${show(revient)}, vendu ${show(sold)}`;
      if (seen.has(text)) continue;
      seen.add(text);
      items.push({ text, zone: win ? zones[0] : zones[1] });
    }
    return {
      prompt: "Glisse chaque situation dans la bonne case.",
      zones,
      items,
      hints: ["Compare le prix de vente et le prix de revient de chaque ligne.", "Un prix de vente plus grand que le prix de revient donne un bénéfice.", "Un prix de vente plus petit donne une perte."],
    };
  });
}
