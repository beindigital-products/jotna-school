/**
 * LES NOMBRES DU CP : jusqu'à 50, puis jusqu'à 100 (`ma-cp-nombres-50`, `ma-cp-nombres-100`). Le voisin d'un nombre, comparer,
 * ranger, dizaines et unités, décomposer (30 + 7, 7 × 10 + 8), les glisser « moins de » ou « plus de », les écrire en lettres
 * et les lire.
 *
 * Sur l'échantillon de CP, le modèle écrivait « huitante » (qui n'est pas du français de l'école), « ___ fois 9 égal 72 » et
 * « 7 × 10 » sous « Les nombres jusqu'à 50 », une somme de 33 et 21 rangée dans les nombres alors que la fiche n'en parle pas, des
 * tuiles qui contiennent la réponse. Ici la réponse est CALCULÉE, jamais écrite, et le mot d'un nombre vient d'UNE fonction, `inWords`,
 * que le test recalcule avec sa propre table (21 « vingt et un », 71 « soixante et onze », 80 « quatre-vingts », 81 « quatre-vingt-un »,
 * 91 « quatre-vingt-onze »).
 *
 * LE PLAFOND vient du champ `vocabulary` de la fiche : « nombres-50 » (de 1 à 50) ou « nombres-100 » (de 51 à 100). Le plus grand
 * nombre d'un palier monte avec sa position : 20, 30, 40, 50 pour la première fiche ; 70, 80, 90, 100 pour la seconde. Aucun nombre n'est
 * jamais écrit au-delà du plafond de la fiche, ni dans l'énoncé ni dans un choix.
 *
 * Les mauvais choix sont des erreurs d'enfant : le nombre lui-même, une dizaine de plus ou de moins, les deux chiffres échangés.
 * Aucun indice n'écrit un chiffre : un nombre se lirait dedans.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { fresh, originOf, pick, randomInt, shuffle, type GameContext, type GameLevel, type GeneratedGame } from "./shared";
import { choiceGame, firstLetter, gapGame, linkGame, sequenceGame, sortGame } from "./tableaux";

// ===========================================================================
// LE PLAFOND ET LES MOTS
// ===========================================================================

export type NumberCap = 50 | 100;

/** « nombres-100 » vaut 100, tout le reste 50. */
export const capOf = (vocabulary: string | undefined): NumberCap => (vocabulary === "nombres-100" ? 100 : 50);

const LOW: Record<NumberCap, number> = { 50: 1, 100: 51 };
/** Le plus petit nombre d'un mauvais choix : sur la fiche de 100, jamais 8 ou 5, qui ne sont pas de la fiche. */
const floorOf = (cap: NumberCap) => (cap === 100 ? 50 : 0);
const TOP_BY_LEVEL: Record<NumberCap, Record<GameLevel, number>> = {
  50: { 1: 20, 2: 30, 3: 40, 4: 50 },
  100: { 1: 70, 2: 80, 3: 90, 4: 100 },
};

/** Le plafond de la fiche, le plus petit nombre servi et le plus grand de ce palier. */
export function rangeOf(ctx: GameContext): { cap: NumberCap; lo: number; top: number } {
  const cap = capOf(ctx.vocabulary);
  return { cap, lo: LOW[cap], top: TOP_BY_LEVEL[cap][ctx.level] };
}

const UNIT_WORDS = ["zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize"] as const;
const TENS_WORDS: Record<number, string> = { 2: "vingt", 3: "trente", 4: "quarante", 5: "cinquante", 6: "soixante" };

/**
 * Un nombre de 0 à 100 en lettres, comme à l'école de France et du Sénégal : « vingt et un », « soixante et onze », « soixante-dix-sept »,
 * « quatre-vingts » (avec un s), « quatre-vingt-un » (sans s ni « et »), « quatre-vingt-onze », « cent ».
 */
export function inWords(n: number): string {
  if (n <= 16) return UNIT_WORDS[n];
  if (n < 20) return `dix-${UNIT_WORDS[n - 10]}`;
  if (n === 100) return "cent";
  const tens = Math.floor(n / 10);
  const units = n % 10;
  if (tens <= 6) {
    const base = TENS_WORDS[tens];
    if (units === 0) return base;
    return units === 1 ? `${base} et un` : `${base}-${UNIT_WORDS[units]}`;
  }
  if (tens === 7) return n === 71 ? "soixante et onze" : `soixante-${inWords(n - 60)}`;
  if (tens === 8) return units === 0 ? "quatre-vingts" : `quatre-vingt-${UNIT_WORDS[units]}`;
  return `quatre-vingt-${inWords(n - 80)}`;
}

/** Les deux mauvais choix d'un nombre : les `pool` d'abord (les erreurs d'enfant), les voisins ensuite. */
export function wrongNumbers(ctx: GameContext, answer: number, pool: readonly number[], min: number, max: number): [string, string] {
  const fits = (n: number) => Number.isInteger(n) && n >= min && n <= max && n !== answer;
  const typical = shuffle(ctx.rng, Array.from(new Set(pool.filter(fits))));
  const near = shuffle(
    ctx.rng,
    Array.from(new Set([answer - 1, answer + 1, answer - 2, answer + 2, answer - 10, answer + 10].filter(fits))).filter((n) => !typical.includes(n)),
  );
  const out = [...typical, ...near].slice(0, 2);
  for (let n = min; out.length < 2 && n <= max; n++) if (fits(n) && !out.includes(n)) out.push(n);
  return [String(out[0]), String(out[1])];
}

const plural = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`;

/** `count` nombres différents de [lo, top], dont deux de la même dizaine quand `shareTens` (la comparaison devient moins évidente). */
function distinctNumbers(ctx: GameContext, count: number, lo: number, top: number, shareTens: boolean): number[] {
  for (let attempt = 0; attempt < 60; attempt++) {
    const out: number[] = [];
    if (shareTens) {
      const tens = randomInt(ctx.rng, Math.floor(lo / 10), Math.floor(top / 10));
      const sameTens = Array.from({ length: 10 }, (_, u) => tens * 10 + u).filter((n) => n >= lo && n <= top);
      if (sameTens.length < 2) continue;
      out.push(...shuffle(ctx.rng, sameTens).slice(0, 2));
    }
    while (out.length < count) {
      const n = randomInt(ctx.rng, lo, top);
      if (!out.includes(n)) out.push(n);
    }
    return shuffle(ctx.rng, out);
  }
  const out: number[] = [];
  while (out.length < count) {
    const n = randomInt(ctx.rng, lo, top);
    if (!out.includes(n)) out.push(n);
  }
  return out;
}

// ===========================================================================
// LE VOISIN, COMPARER, RANGER
// ===========================================================================

/** « Quel nombre vient juste après 37 ? » */
export function makeCpNeighbour(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "nb-voisin", "le nombre qui vient juste avant ou juste après", () => {
    const { cap, lo, top } = rangeOf(ctx);
    const after = ctx.rng() < 0.5;
    const n = after ? randomInt(ctx.rng, lo, top - 1) : randomInt(ctx.rng, lo + 1, top);
    const answer = after ? n + 1 : n - 1;
    return {
      prompt: `Quel nombre vient juste ${after ? "après" : "avant"} ${n} ?`,
      answer: String(answer),
      wrong: wrongNumbers(ctx, answer, [n, after ? answer + 1 : answer - 1, after ? answer + 10 : answer - 10], floorOf(cap), cap),
      hints: [
        "Dis les nombres en comptant, depuis le début.",
        after ? "Le nombre d'après est un de plus." : "Le nombre d'avant est un de moins.",
        after ? "Arrête-toi sur le nombre de la question, puis dis le suivant." : "Arrête-toi sur le nombre de la question, puis reviens d'un pas en arrière.",
      ],
    };
  });
}

/** « Quel est le plus grand de ces nombres ? » : trois nombres différents, dont deux de la même dizaine dès le deuxième palier. */
export function makeCpCompare(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "nb-comparer", "comparer des nombres", () => {
    const { lo, top } = rangeOf(ctx);
    const numbers = distinctNumbers(ctx, 3, lo, top, ctx.level >= 2);
    const biggest = ctx.rng() < 0.6;
    const answer = biggest ? Math.max(...numbers) : Math.min(...numbers);
    return {
      prompt: `Quel est le ${biggest ? "plus grand" : "plus petit"} de ces nombres ?`,
      answer: String(answer),
      wrong: numbers.filter((n) => n !== answer).map(String),
      hints: [
        "Regarde d'abord le chiffre des dizaines de chaque nombre.",
        "Si les dizaines sont les mêmes, regarde les unités.",
        biggest ? "Le plus grand est celui qui a le plus de dizaines." : "Le plus petit est celui qui a le moins de dizaines.",
      ],
    };
  });
}

/** « Mets ces nombres dans l'ordre, du plus petit au plus grand. » : quatre nombres différents. */
export function makeCpOrder(ctx: GameContext): GeneratedGame {
  return sequenceGame(ctx, "nb-ordre", "ranger des nombres", () => {
    const { lo, top } = rangeOf(ctx);
    const numbers = distinctNumbers(ctx, 4, lo, top, ctx.level >= 2);
    const ascending = ctx.level < 3 || ctx.rng() < 0.6;
    return {
      prompt: ascending ? "Mets ces nombres dans l'ordre, du plus petit au plus grand." : "Mets ces nombres dans l'ordre, du plus grand au plus petit.",
      sequence: numbers.sort((a, b) => (ascending ? a - b : b - a)).map(String),
      hints: [
        "Regarde d'abord le chiffre des dizaines de chaque nombre.",
        ascending ? "Le plus petit nombre est celui qui a le moins de dizaines : mets-le au début." : "Le plus grand nombre est celui qui a le plus de dizaines : mets-le au début.",
        "Si deux nombres ont les mêmes dizaines, regarde leurs unités.",
      ],
    };
  });
}

// ===========================================================================
// DIZAINES ET UNITÉS, DÉCOMPOSER
// ===========================================================================

/** « Dans 37, combien y a-t-il de dizaines ? » ou « …d'unités ? » ; au palier de 100, aussi « combien de dizaines dans une centaine ». */
export function makeCpTensUnits(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "nb-dizaines", "les dizaines et les unités d'un nombre", () => {
    const { cap, lo, top } = rangeOf(ctx);
    if (cap === 100 && ctx.level >= 3 && ctx.rng() < 0.3) {
      return {
        prompt: "Combien de dizaines y a-t-il dans une centaine ?",
        answer: "10",
        wrong: ["1", "100"],
        hints: ["Une dizaine, c'est dix.", "Une centaine, c'est cent.", "Compte de dix en dix jusqu'à cent."],
      };
    }
    const n = randomInt(ctx.rng, Math.max(lo, 11), Math.min(top, 99));
    const tens = Math.floor(n / 10);
    const units = n % 10;
    if (units === 0 || ctx.rng() < 0.5) {
      return {
        prompt: `Dans ${n}, combien y a-t-il de dizaines ?`,
        answer: String(tens),
        wrong: wrongNumbers(ctx, tens, [units, tens + 1, tens - 1], 0, 10),
        hints: ["Une dizaine, c'est dix.", "Le chiffre de gauche dit combien de dizaines.", "Compte de dix en dix jusqu'au nombre."],
      };
    }
    return {
      prompt: `Dans ${n}, combien y a-t-il d'unités ?`,
      answer: String(units),
      wrong: wrongNumbers(ctx, units, [tens, units + 1, units - 1], 0, 9),
      hints: ["Les unités sont ce qu'il reste quand on a enlevé toutes les dizaines.", "Le chiffre de droite dit combien d'unités.", "Enlève les dizaines une par une et compte ce qui reste."],
    };
  });
}

/** Trois façons de décomposer : 37 = 30 + ___, 3 dizaines et 7 unités c'est ___, 3 × 10 + 7 = ___ (palier de 100). */
export function makeCpDecompose(ctx: GameContext): GeneratedGame {
  return gapGame(ctx, "nb-decomposer", "décomposer un nombre", () => {
    const { cap, lo, top } = rangeOf(ctx);
    let n = randomInt(ctx.rng, Math.max(lo, 11), Math.min(top, 99));
    if (n % 10 === 0) n -= 1;
    const tens = Math.floor(n / 10);
    const units = n % 10;
    const swapped = units * 10 + tens;
    const form = randomInt(ctx.rng, 0, cap === 100 ? 3 : 1);
    if (form === 0) {
      return {
        prompt: "Complète avec le bon nombre.",
        text: `${n} = ${tens * 10} + ___`,
        answer: String(units),
        wrong: wrongNumbers(ctx, units, [tens, units + 1, units - 1], 0, 9),
        hints: ["Les dizaines sont déjà écrites.", "Ce qui manque, ce sont les unités.", "Enlève les dizaines du nombre : il reste les unités."],
      };
    }
    if (form === 1) {
      return {
        prompt: "Complète avec le bon nombre.",
        text: `${plural(tens, "dizaine", "dizaines")} et ${plural(units, "unité", "unités")}, c'est le nombre ___.`,
        answer: String(n),
        wrong: wrongNumbers(ctx, n, [swapped, n + 10, n - 10], floorOf(cap), cap),
        hints: ["Une dizaine, c'est dix.", "Écris d'abord le chiffre des dizaines, puis celui des unités.", "Les dizaines se mettent à gauche, les unités à droite."],
      };
    }
    if (form === 2) {
      return {
        prompt: "Complète avec le bon nombre.",
        text: `${tens} × 10 + ${units} = ___`,
        answer: String(n),
        wrong: wrongNumbers(ctx, n, [swapped, n + 10, n - 10], floorOf(cap), cap),
        hints: ["Un nombre de fois dix, ce sont des dizaines.", "Compte de dix en dix, puis ajoute les unités.", "Les dizaines se mettent à gauche, les unités à droite."],
      };
    }
    return {
      prompt: "Complète avec le bon nombre.",
      text: `${tens * 10} + ${units} = ___`,
      answer: String(n),
      wrong: wrongNumbers(ctx, n, [swapped, n + 10, n - 10], floorOf(cap), cap),
      hints: ["Les dizaines sont déjà écrites en entier.", "Ajoute les unités à la fin.", "Les dizaines se mettent à gauche, les unités à droite."],
    };
  });
}

/** « Glisse chaque nombre dans la bonne case. » : moins de 30 ou plus de 30. Le seuil n'est jamais un des nombres. */
export function makeCpSortThreshold(ctx: GameContext): GeneratedGame {
  return sortGame(ctx, "nb-glisser", "placer des nombres par rapport à un seuil", () => {
    const { lo, top } = rangeOf(ctx);
    const each = ctx.level === 1 ? 2 : 3;
    const thresholds = [10, 20, 30, 40, 50, 60, 70, 80, 90].filter((t) => t - lo >= each && top - t >= each);
    const threshold = pick(ctx.rng, thresholds);
    const below = shuffle(
      ctx.rng,
      Array.from({ length: threshold - lo }, (_, i) => lo + i),
    ).slice(0, each);
    const above = shuffle(
      ctx.rng,
      Array.from({ length: top - threshold }, (_, i) => threshold + 1 + i),
    ).slice(0, each);
    return {
      prompt: "Glisse chaque nombre dans la bonne case.",
      zones: [`Moins de ${threshold}`, `Plus de ${threshold}`],
      items: [...below.map((n) => ({ text: String(n), zone: `Moins de ${threshold}` })), ...above.map((n) => ({ text: String(n), zone: `Plus de ${threshold}` }))],
      hints: ["Lis les nombres un par un.", "Compare chaque nombre au nombre de la case.", "Regarde d'abord le chiffre des dizaines."],
    };
  });
}

// ===========================================================================
// LES NOMBRES EN LETTRES
// ===========================================================================

/** Les trois conseils d'un nombre écrit en lettres, selon sa famille de mots. Aucun ne contient un chiffre. */
function wordHints(n: number): [string, string, string] {
  const family =
    n >= 100
      ? "Cent est le nombre juste après quatre-vingt-dix-neuf."
      : n >= 80
        ? "Quatre-vingt veut dire quatre fois vingt."
        : n >= 70
          ? "Soixante-dix veut dire soixante plus dix."
          : n >= 20
            ? "Le premier mot dit les dizaines, le second dit les unités."
            : n >= 17
              ? "Dix-sept, dix-huit et dix-neuf veulent dire dix plus sept, huit ou neuf."
              : "Ce nombre n'a qu'un seul mot, à connaître par cœur.";
  return ["Dis le mot à voix haute, doucement.", "Cherche d'abord les dizaines, puis les unités.", family];
}

/** « Quel nombre s'écrit « soixante-quinze » ? » */
export function makeCpWords(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "nb-lettres", "lire un nombre écrit en lettres", () => {
    const { cap, lo, top } = rangeOf(ctx);
    const n = randomInt(ctx.rng, Math.max(lo, 2), top);
    const swapped = n >= 10 && n < 100 ? (n % 10) * 10 + Math.floor(n / 10) : n;
    return {
      prompt: `Quel nombre s'écrit « ${inWords(n)} » ?`,
      answer: String(n),
      wrong: wrongNumbers(ctx, n, [n - 10, n + 10, swapped, n - 20], floorOf(cap), cap),
      hints: wordHints(n),
    };
  });
}

/** « Relie chaque nombre à son écriture en lettres. » : trois ou quatre nombres différents. */
export function makeCpWordLinks(ctx: GameContext): GeneratedGame {
  return linkGame(ctx, "nb-relier", "relier un nombre et son écriture en lettres", () => {
    const { lo, top } = rangeOf(ctx);
    const count = ctx.level >= 3 ? 4 : 3;
    const numbers = distinctNumbers(ctx, count, Math.max(lo, 2), top, false).sort((a, b) => a - b);
    return {
      prompt: "Relie chaque nombre à son écriture en lettres.",
      pairs: numbers.map((n) => ({ left: String(n), right: inWords(n) })),
      hints: ["Lis les mots un par un, à voix haute.", "Cherche d'abord les dizaines, puis les unités.", "Commence par le nombre dont tu es certain."],
    };
  });
}

/** « Écris en chiffres le nombre « soixante-quinze ». » : une réponse courte. */
export function makeCpWriteNumber(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "nb-ecrire", () => {
    const { lo, top } = rangeOf(ctx);
    const n = randomInt(ctx.rng, Math.max(lo, 2), top);
    return {
      type: "short-answer",
      prompt: `Écris en chiffres le nombre « ${inWords(n)} ».`,
      payload: { acceptedAnswers: [String(n)], game: originOf("nb-ecrire", ctx), concept: "écrire en chiffres un nombre dit en lettres" },
      answerKey: String(n),
      hints: [
        "Dis le mot à voix haute, doucement.",
        n >= 100 ? "Ce nombre s'écrit avec trois chiffres." : n >= 10 ? "Ce nombre s'écrit avec deux chiffres." : "Ce nombre s'écrit avec un seul chiffre.",
        `Le premier mot commence par la lettre ${firstLetter(inWords(n))}.`,
      ],
    };
  });
}
