/**
 * MULTIPLIER ET PARTAGER AU CP (`ma-cp-multiplier`) : le sens de la multiplication (3 paquets de 4 mangues), les tables de 2 et de 3,
 * le sens de la division-partage (partager 12 bonbons entre 3 enfants).
 *
 * Sur l'échantillon de CP, le modèle sortait de la fiche : « 7 × 10 » et « ___ fois 9 égal 72 » dans les nombres, « Le produit de 3 et
 * ___ est 12 », « Combien de fois 3 entre dans 9 ? » (un mot de division que la fiche n'a pas). La fiche dit : le sens de la multiplication,
 * les tables de 2 et de 3, le sens du partage, « aucune autre table que celles de 2 et de 3 ».
 *
 * CE QUE CE FICHIER NE FAIT PAS SORTIR DE LA FICHE
 * - Une multiplication a TOUJOURS un facteur égal à 2 ou à 3 (l'autre va de 2 à 10) : 3 × 4 est la table de 3, 4 × 5 n'est à aucune
 *   des deux tables. Le résultat ne passe jamais 30.
 * - Un partage est entre 2 ou 3 enfants, sans reste, et chaque part vaut de 2 à 10.
 * - Aucun signe de division : « partager », jamais « ÷ ».
 * - Aucun indice n'écrit un chiffre : un résultat se lirait dedans.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { fresh, originOf, pick, pickFresh, randomInt, shuffle, type GameContext, type GameLevel, type GeneratedGame } from "./shared";
import { CHILDREN, ITEMS, hasHe, ofItems, quantity } from "./stories";
import { choiceGame, gapGame, linkGame, sequenceGame, sortGame } from "./tableaux";
import { wrongNumbers } from "./nombresCp";

/** Les choses qu'on met en paquets : des aliments, des jeux, du matériel d'école (pas d'animaux). */
const THINGS = ITEMS.filter((item) => item.family !== "animal");
/** Les choses qu'on partage : on ne partage pas une règle entre enfants dans un problème de CP. */
const SHARED = ITEMS.filter((item) => item.family === "fruit" || item.family === "nourriture" || (item.family === "jeu" && item.singular === "bille"));

/** Le plus grand facteur « libre » (l'autre vaut 2 ou 3) selon le palier. */
const FREE_TOP: Record<GameLevel, number> = { 1: 5, 2: 8, 3: 10, 4: 10 };

const TABLES = [2, 3] as const;

/** Deux facteurs de 2 à 10 dont l'un vaut 2 ou 3 : (nombre de paquets, contenu d'un paquet), dans un ordre ou dans l'autre. */
function factors(ctx: GameContext): { table: 2 | 3; other: number; packs: number; each: number } {
  const table = pick(ctx.rng, TABLES);
  const other = randomInt(ctx.rng, 2, FREE_TOP[ctx.level]);
  const tableFirst = ctx.rng() < 0.5;
  return { table, other, packs: tableFirst ? table : other, each: tableFirst ? other : table };
}

// ===========================================================================
// MULTIPLIER : paquets, additions répétées, tables
// ===========================================================================

/** « Awa a 3 paquets de 4 mangues. Combien de mangues a-t-elle en tout ? » */
export function makeTimesPacks(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "mult-paquets", "le sens de la multiplication : des paquets pareils", () => {
    const child = pickFresh(ctx, CHILDREN, (candidate) => `paquets:${candidate.name}`);
    const thing = pick(ctx.rng, THINGS);
    const { packs, each } = factors(ctx);
    const product = packs * each;
    return {
      prompt: `${child.name} a ${packs} paquets de ${quantity(each, thing)}. Combien ${ofItems(thing)} ${hasHe(child)} en tout ?`,
      answer: String(product),
      // Les erreurs d'enfant : additionner au lieu de multiplier, oublier un paquet, en compter un de trop.
      wrong: wrongNumbers(ctx, product, [packs + each, product - each, product + each, product - packs, product + packs], 0, 30),
      hints: [
        "Compte combien de paquets il y a.",
        "Dans chaque paquet, il y a le même nombre de choses.",
        "Additionne le contenu de tous les paquets.",
      ],
    };
  });
}

/** « Awa a 3 paquets de 4 mangues. Combien de mangues a-t-elle en tout ? Écris le nombre. » : une réponse courte. */
export function makeTimesWrite(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "mult-ecrire", () => {
    const child = pickFresh(ctx, CHILDREN, (candidate) => `paquets:${candidate.name}`);
    const thing = pick(ctx.rng, THINGS);
    const { packs, each } = factors(ctx);
    const product = packs * each;
    return {
      type: "short-answer",
      prompt: `${child.name} a ${packs} paquets de ${quantity(each, thing)}. Combien ${ofItems(thing)} ${hasHe(child)} en tout ? Écris le nombre.`,
      payload: { acceptedAnswers: [String(product)], game: originOf("mult-ecrire", ctx), concept: "calculer le total de paquets pareils" },
      answerKey: String(product),
      hints: [
        "Compte combien de paquets il y a.",
        "Dans chaque paquet, il y a le même nombre de choses.",
        "Additionne le contenu de tous les paquets.",
      ],
    };
  });
}

/** « Quelle multiplication donne le même résultat que 3 + 3 + 3 + 3 ? » : le nombre de fois, puis le nombre ajouté. */
export function makeTimesRepeated(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "mult-addition", "écrire une addition répétée en multiplication", () => {
    const term = pick(ctx.rng, TABLES);
    const times = randomInt(ctx.rng, 3, ctx.level === 1 ? 4 : 6);
    const value = times * term;
    const sum = Array.from({ length: times }, () => String(term)).join(" + ");
    // Des écritures de valeurs toutes différentes : une seule est égale à l'addition.
    const candidates = [
      { text: `${times + 1} × ${term}`, value: (times + 1) * term },
      { text: `${times - 1} × ${term}`, value: (times - 1) * term },
      // L'autre table : « 3 × 4 » pour « 2 + 2 + 2 + 2 », jamais une multiplication hors des tables de 2 et de 3.
      { text: `${term === 2 ? 3 : 2} × ${times}`, value: (term === 2 ? 3 : 2) * times },
      { text: `${term} × ${term}`, value: term * term },
      { text: `${times + 2} × ${term}`, value: (times + 2) * term },
    ];
    const wrong: string[] = [];
    const seen = new Set<number>([value]);
    for (const candidate of shuffle(ctx.rng, candidates)) {
      if (!seen.has(candidate.value)) {
        seen.add(candidate.value);
        wrong.push(candidate.text);
      }
    }
    return {
      prompt: `Quelle multiplication donne le même résultat que ${sum} ?`,
      answer: `${times} × ${term}`,
      wrong: wrong.slice(0, 2),
      hints: [
        "Compte combien de fois le même nombre est ajouté.",
        "Une multiplication dit combien de fois, et combien à chaque fois.",
        "Écris d'abord le nombre de fois, puis le nombre ajouté.",
      ],
    };
  });
}

/** « Combien font 3 × 7 ? », « Combien font 7 × 3 ? » ou « Quel est le double de 8 ? » : les tables de 2 et de 3. */
export function makeTimesFact(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "mult-table", "les tables de 2 et de 3", () => {
    const table = pick(ctx.rng, TABLES);
    const other = randomInt(ctx.rng, 1, FREE_TOP[ctx.level]);
    const product = table * other;
    const wrong = wrongNumbers(ctx, product, [product + table, product - table, product + other, table + other, product + 1, product - 1], 0, 30);
    const step = table === 2 ? "Compte de deux en deux." : "Compte de trois en trois.";
    if (table === 2 && ctx.rng() < 0.3) {
      return {
        prompt: `Quel est le double de ${other} ?`,
        answer: String(product),
        wrong,
        hints: ["Le double, c'est deux fois le même nombre.", "Ajoute le nombre à lui-même.", "Dessine deux groupes pareils, puis compte tout."],
      };
    }
    const tableFirst = ctx.rng() < 0.5;
    return {
      prompt: `Combien font ${tableFirst ? `${table} × ${other}` : `${other} × ${table}`} ?`,
      answer: String(product),
      wrong,
      hints: ["Une multiplication, ce sont des groupes pareils.", step, "Additionne le même nombre plusieurs fois."],
    };
  });
}

/** « 3 × ___ = 18 » ou « ___ × 2 = 14 » : le facteur qui manque. */
export function makeTimesGap(ctx: GameContext): GeneratedGame {
  return gapGame(ctx, "mult-trou", "trouver le facteur qui manque", () => {
    const table = pick(ctx.rng, TABLES);
    const other = randomInt(ctx.rng, 2, FREE_TOP[ctx.level]);
    const product = table * other;
    const step = table === 2 ? "Compte de deux en deux jusqu'au résultat." : "Compte de trois en trois jusqu'au résultat.";
    return {
      prompt: "Complète avec le bon nombre.",
      text: ctx.rng() < 0.5 ? `${table} × ___ = ${product}` : `___ × ${table} = ${product}`,
      answer: String(other),
      wrong: wrongNumbers(ctx, other, [other + 1, other - 1, other + 2, table], 0, 10),
      hints: ["Cherche combien de fois le petit nombre entre dans le résultat.", step, "Compte combien de pas il faut pour arriver au résultat."],
    };
  });
}

/** « Relie chaque multiplication à son résultat. » : trois ou quatre multiplications des tables de 2 et de 3, tous les résultats différents. */
export function makeTimesLinks(ctx: GameContext): GeneratedGame {
  return linkGame(ctx, "mult-relier", "relier une multiplication et son résultat", () => {
    const wanted = ctx.level >= 3 ? 4 : 3;
    const chosen: { text: string; product: number }[] = [];
    for (let attempt = 0; attempt < 200 && chosen.length < wanted; attempt++) {
      const table = pick(ctx.rng, TABLES);
      const other = randomInt(ctx.rng, 2, FREE_TOP[ctx.level]);
      const text = ctx.rng() < 0.5 ? `${table} × ${other}` : `${other} × ${table}`;
      const product = table * other;
      if (chosen.every((entry) => entry.text !== text && entry.product !== product)) chosen.push({ text, product });
    }
    return {
      prompt: "Relie chaque multiplication à son résultat.",
      pairs: chosen.map((entry) => ({ left: entry.text, right: String(entry.product) })),
      hints: ["Compte de deux en deux, puis de trois en trois.", "Additionne le même nombre plusieurs fois.", "Commence par la multiplication dont tu es certain."],
    };
  });
}

/** « Mets dans l'ordre, du plus petit au plus grand, les résultats de la table de 3. » : quatre résultats différents. */
export function makeTimesOrder(ctx: GameContext): GeneratedGame {
  return sequenceGame(ctx, "mult-suite", "ranger les résultats d'une table", () => {
    const table = pick(ctx.rng, TABLES);
    const multipliers = shuffle(
      ctx.rng,
      Array.from({ length: 10 }, (_, i) => i + 1),
    ).slice(0, 4);
    const ascending = ctx.level < 3 || ctx.rng() < 0.6;
    const values = multipliers.map((k) => k * table).sort((a, b) => (ascending ? a - b : b - a));
    return {
      prompt: `Mets dans l'ordre, ${ascending ? "du plus petit au plus grand" : "du plus grand au plus petit"}, les résultats de la table de ${table}.`,
      sequence: values.map(String),
      hints: [table === 2 ? "Compte de deux en deux." : "Compte de trois en trois.", "Chaque résultat est plus grand que celui d'avant dans la table.", "Mets d'abord celui qui arrive en premier quand tu comptes."],
    };
  });
}

// Les résultats qui sont dans une seule des deux tables : les pairs qui ne sont pas multiples de trois, et les multiples de trois impairs.
const ONLY_TWO = [2, 4, 8, 10, 14, 16, 20] as const;
const ONLY_THREE = [3, 9, 15, 21, 27] as const;

/** « Glisse chaque résultat dans sa table. » : la table de 2 (un nombre pair) ou la table de 3. Jamais un multiple de 6. */
export function makeTimesSort(ctx: GameContext): GeneratedGame {
  return sortGame(ctx, "mult-glisser", "reconnaître la table d'un résultat", () => {
    const each = ctx.level === 1 ? 2 : 3;
    return {
      prompt: "Glisse chaque résultat dans sa table.",
      zones: ["Table de 2", "Table de 3"],
      items: [
        ...shuffle(ctx.rng, ONLY_TWO)
          .slice(0, each)
          .map((n) => ({ text: String(n), zone: "Table de 2" })),
        ...shuffle(ctx.rng, ONLY_THREE)
          .slice(0, each)
          .map((n) => ({ text: String(n), zone: "Table de 3" })),
      ],
      hints: ["Compte de deux en deux, puis de trois en trois.", "Les résultats de la table de deux sont des nombres pairs.", "Les résultats de la table de trois arrivent quand on compte de trois en trois."],
    };
  });
}

// ===========================================================================
// PARTAGER
// ===========================================================================

/** Un partage sans reste : entre 2 ou 3 enfants, chaque part de 2 à 10 (5 au premier palier, 8 au deuxième). */
function share(ctx: GameContext): { children: 2 | 3; part: number; total: number } {
  const children = pick(ctx.rng, TABLES);
  const part = randomInt(ctx.rng, 2, FREE_TOP[ctx.level]);
  return { children, part, total: children * part };
}

/** « Fatou partage 12 bonbons entre 3 enfants. Combien de bonbons chaque enfant reçoit-il ? » */
export function makeShareQuestion(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "part-qcm", "le sens du partage", () => {
    const child = pickFresh(ctx, CHILDREN, (candidate) => `partage:${candidate.name}`);
    const thing = pick(ctx.rng, SHARED);
    const { children, part, total } = share(ctx);
    return {
      prompt: `${child.name} partage ${quantity(total, thing)} entre ${children} enfants. Combien ${ofItems(thing)} chaque enfant reçoit-il ?`,
      answer: String(part),
      wrong: wrongNumbers(ctx, part, [part + 1, part - 1, part + 2, children, total - children], 1, 30),
      hints: [
        "Partager, c'est faire des parts toutes pareilles.",
        "Distribue un par un à chaque enfant, comme aux cartes.",
        "Compte ce que reçoit un seul enfant.",
      ],
    };
  });
}

/** « Je partage 12 bonbons entre 3 enfants. Chaque enfant reçoit ___ bonbons. » */
export function makeShareGap(ctx: GameContext): GeneratedGame {
  return gapGame(ctx, "part-trou", "compléter un partage", () => {
    const thing = pick(ctx.rng, SHARED);
    const { children, part, total } = share(ctx);
    return {
      prompt: "Complète avec le bon nombre.",
      text: `Je partage ${quantity(total, thing)} entre ${children} enfants. Chaque enfant reçoit ___ ${thing.plural}.`,
      answer: String(part),
      wrong: wrongNumbers(ctx, part, [part + 1, part - 1, part + 2, children], 1, 30),
      hints: ["Les parts sont toutes pareilles.", "Distribue un par un à chaque enfant, jusqu'à la fin.", "Compte ce que reçoit un seul enfant."],
    };
  });
}
