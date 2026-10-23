/**
 * LA DIVISIBILITÉ ET LE CALCUL MENTAL DU CM1 (`ma-cm1-divisibilite`) : les critères de divisibilité par 2, 5, 10, 3 et 9, les multiples, les tables de
 * multiplication, multiplier par dix, cent, mille, le double et la moitié.
 *
 * Sur l'échantillon, le modèle écrivait « 123 est divisible par 9 » (la somme des chiffres vaut 6), proposait deux nombres divisibles dans un QCM qui n'en
 * attendait qu'un, et se trompait d'un zéro en multipliant par cent. Ici la réponse est CALCULÉE par un reste de division, jamais écrite ; un seul choix
 * est divisible (ou, quand l'énoncé le demande, un seul ne l'est pas).
 *
 * - LES PALIERS (`stepOf`) : les critères de 2, 5 et 10 (le dernier chiffre) sur deux chiffres ; puis 3 sur trois chiffres ; puis 9 et 3 (la somme des
 *   chiffres) ; puis quatre chiffres ; enfin quatre et cinq chiffres avec 3 et 9 seulement. Les tables vont de la 2 à la 5, puis la 6 et la 7, puis la 8 et la 9,
 *   puis toutes ; les nombres multipliés par dix, cent, mille grandissent avec le palier.
 * - LES PIÈGES D'ENFANT : un nombre divisible par 3 mais pas par 9 (« 12 » pour 9), un nombre divisible par 5 mais pas par 10 (« 35 »), un nombre impair qui
 *   finit par cinq (« 45 » pour 2), un nombre qui finit par 3, 6 ou 9 sans que la somme de ses chiffres tombe dans la table de 3 (« 133 »), un nombre voisin
 *   d'un multiple (« 48 » pour 7 : « 49 » est le bon).
 * - LES TABLES de ce palier ne sont jamais posées deux fois (6 × 7 et 7 × 6 sont le même fait) dans un même palier.
 * - Aucun indice n'écrit un chiffre : un résultat se lirait dedans. Les cases d'un glissé s'appellent « Divisible par 3 » et « Pas divisible par 3 » : leurs
 *   indices n'emploient pas le mot « divisible ».
 *
 * MODULE PUR (voir `types.ts`).
 */
import { fresh, originOf, pick, pickFresh, randomInt, shuffle, type GameContext, type GeneratedGame } from "./shared";
import { choiceGame, gapGame, linkGame, sequenceGame, sortGame } from "./tableaux";
import { formatNumber } from "./patterns";
import { show, stepOf, wrongNumbers, type Step } from "./cm1MathsOutils";

// ===========================================================================
// LES CRITÈRES DE DIVISIBILITÉ
// ===========================================================================

/** Les diviseurs d'un palier. */
const DIVISORS: Record<Step, readonly number[]> = { 1: [2, 5, 10], 2: [2, 5, 10, 3], 3: [3, 9, 2, 5, 10], 4: [3, 9, 2, 5], 5: [3, 9] };
/** Le plus petit et le plus grand nombre testés à chaque palier. */
const SPAN: Record<Step, readonly [number, number]> = { 1: [20, 99], 2: [100, 999], 3: [100, 999], 4: [1000, 9999], 5: [1000, 99999] };

/** Un nombre qui ressemble à un multiple sans en être un : le piège que l'enfant choisit. */
const TRAPS: Record<number, (n: number) => boolean> = {
  2: (n) => n % 10 === 5,
  3: (n) => [3, 6, 9].includes(n % 10),
  9: (n) => n % 3 === 0,
  10: (n) => n % 5 === 0,
};

/** `count` multiples de `d` différents dans [lo, hi]. */
function multiplesOf(ctx: GameContext, d: number, lo: number, hi: number, count: number): number[] {
  const out = new Set<number>();
  while (out.size < count) out.add(randomInt(ctx.rng, Math.ceil(lo / d), Math.floor(hi / d)) * d);
  return [...out];
}

/** `count` nombres de [lo, hi] qui ne sont pas multiples de `d`, de préférence ceux qui ressemblent à un multiple (`TRAPS`). */
function nonMultiplesOf(ctx: GameContext, d: number, lo: number, hi: number, count: number): number[] {
  const out = new Set<number>();
  const trap = TRAPS[d];
  for (let attempt = 0; out.size < count && attempt < 2000; attempt++) {
    const n = randomInt(ctx.rng, lo, hi);
    if (n % d === 0) continue;
    if (trap && !trap(n) && ctx.rng() < 0.7) continue;
    out.add(n);
  }
  while (out.size < count) {
    const n = randomInt(ctx.rng, lo, hi);
    if (n % d !== 0) out.add(n);
  }
  return [...out];
}

/** Les trois indices du critère de `d`. */
function criterionHints(d: number): [string, string, string] {
  switch (d) {
    case 2:
      return ["Regarde le dernier chiffre de chaque nombre.", "Un nombre divisible par deux finit par un chiffre pair.", "Les chiffres pairs sont zéro, deux, quatre, six et huit."];
    case 5:
      return ["Regarde le dernier chiffre de chaque nombre.", "Un nombre divisible par cinq finit par zéro ou par cinq.", "Les autres chiffres de fin ne conviennent pas."];
    case 10:
      return ["Regarde le dernier chiffre de chaque nombre.", "Un nombre divisible par dix finit par un zéro.", "Un nombre qui finit par cinq est seulement divisible par cinq."];
    case 3:
      return ["Additionne les chiffres de chaque nombre.", "Un nombre est divisible par trois quand la somme de ses chiffres l'est.", "Les multiples de trois sont trois, six, neuf, douze, quinze, dix-huit et ainsi de suite."];
    default:
      return ["Additionne les chiffres de chaque nombre.", "Un nombre est divisible par neuf quand la somme de ses chiffres l'est.", "Les multiples de neuf sont neuf, dix-huit, vingt-sept, trente-six et ainsi de suite."];
  }
}

/** Les trois indices d'un glissé : les cases s'appellent « Divisible par… », ces indices n'emploient donc pas ce mot. */
function sortHints(d: number): [string, string, string] {
  switch (d) {
    case 2:
      return ["Regarde le dernier chiffre de chaque nombre.", "Il doit être pair : zéro, deux, quatre, six ou huit.", "Un chiffre impair écarte le nombre."];
    case 5:
      return ["Regarde le dernier chiffre de chaque nombre.", "Il doit être zéro ou cinq.", "Tout autre chiffre de fin écarte le nombre."];
    case 10:
      return ["Regarde le dernier chiffre de chaque nombre.", "Il doit être un zéro.", "Un nombre qui finit par cinq va avec les nombres écartés."];
    case 3:
      return ["Additionne les chiffres de chaque nombre.", "Cherche si cette somme est dans la table de trois.", "Les multiples de trois sont trois, six, neuf, douze, quinze et ainsi de suite."];
    default:
      return ["Additionne les chiffres de chaque nombre.", "Cherche si cette somme est dans la table de neuf.", "Les multiples de neuf sont neuf, dix-huit, vingt-sept, trente-six et ainsi de suite."];
  }
}

/** « Lequel de ces nombres est divisible par 9 ? » (ou « n'est pas divisible », dès le troisième palier) : un seul nombre répond. */
export function makeCm1DblCriterion(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "cm1-dbl-critere", "reconnaître un nombre divisible", () => {
    const step = stepOf(ctx);
    const [lo, hi] = SPAN[step];
    const d = pick(ctx.rng, DIVISORS[step]);
    const negated = step >= 3 && ctx.rng() < 0.35;
    const single = negated ? nonMultiplesOf(ctx, d, lo, hi, 1)[0] : multiplesOf(ctx, d, lo, hi, 1)[0];
    const others = negated ? multiplesOf(ctx, d, lo, hi, 2) : nonMultiplesOf(ctx, d, lo, hi, 2);
    const hints = criterionHints(d);
    return {
      prompt: `Lequel de ces nombres ${negated ? "n'est pas" : "est"} divisible par ${d} ?`,
      answer: show(single),
      wrong: others.filter((n) => n !== single).map(show),
      hints: negated ? ["Cherche le seul nombre qui ne suit pas la règle.", hints[1], hints[2]] : hints,
    };
  });
}

/** « Glisse chaque nombre dans la bonne case. » : divisible par 3, ou non. */
export function makeCm1DblSort(ctx: GameContext): GeneratedGame {
  return sortGame(ctx, "cm1-dbl-glisser", "trier des nombres selon un critère de divisibilité", () => {
    const step = stepOf(ctx);
    const [lo, hi] = SPAN[step];
    const d = pick(ctx.rng, DIVISORS[step]);
    const each = step === 1 ? 2 : 3;
    const yes = `Divisible par ${d}`;
    const no = `Pas divisible par ${d}`;
    return {
      prompt: "Glisse chaque nombre dans la bonne case.",
      zones: [yes, no],
      items: [...multiplesOf(ctx, d, lo, hi, each).map((n) => ({ text: show(n), zone: yes })), ...nonMultiplesOf(ctx, d, lo, hi, each).map((n) => ({ text: show(n), zone: no }))],
      hints: sortHints(d),
    };
  });
}

/** Un nombre écrit avec un trou à la place d'un chiffre : « 4___5 ». Les milliers sont séparés par une espace. */
function writeWithBlank(digits: readonly number[], blank: number): string {
  const formatted = formatNumber(Number(digits.join("")));
  let seen = -1;
  let out = "";
  for (const ch of formatted) {
    if (ch === " ") {
      out += ch;
      continue;
    }
    seen += 1;
    out += seen === blank ? "___" : ch;
  }
  return out;
}

/** Combien de chiffres a le nombre du trou, par palier. */
const GAP_LENGTH: Record<Step, readonly [number, number]> = { 1: [3, 3], 2: [3, 4], 3: [3, 4], 4: [4, 5], 5: [4, 5] };

/** « 4___5 est divisible par 3. » : un seul des trois chiffres proposés convient (jamais les deux chiffres qui conviennent, comme zéro et neuf pour neuf). */
export function makeCm1DblDigit(ctx: GameContext): GeneratedGame {
  return gapGame(ctx, "cm1-dbl-chiffre", "trouver le chiffre qui rend un nombre divisible", () => {
    const step = stepOf(ctx);
    const d = pick(ctx.rng, DIVISORS[step]);
    const lengths = GAP_LENGTH[step];
    const length = randomInt(ctx.rng, lengths[0], lengths[1]);
    const digits = Array.from({ length }, (_, i) => (i === 0 ? randomInt(ctx.rng, 1, 9) : randomInt(ctx.rng, 0, 9)));
    // Pour 2, 5 et 10 seul le dernier chiffre compte ; pour 3 et 9 le trou peut être n'importe où sauf en tête.
    const blank = d === 2 || d === 5 || d === 10 ? length - 1 : randomInt(ctx.rng, 1, length - 1);
    const works = (x: number) => Number(digits.map((digit, i) => (i === blank ? x : digit)).join("")) % d === 0;
    const valid = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].filter(works);
    const invalid = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].filter((x) => !works(x));
    const answer = pick(ctx.rng, valid);
    const hints = criterionHints(d);
    return {
      prompt: "Complète avec le chiffre qui convient.",
      text: `${writeWithBlank(digits, blank)} est divisible par ${d}.`,
      answer: String(answer),
      wrong: shuffle(ctx.rng, invalid).slice(0, 2).map(String),
      hints: [d === 2 || d === 5 || d === 10 ? "Seul le dernier chiffre décide." : "Le chiffre qui manque change la somme des chiffres.", hints[1], hints[2]],
    };
  });
}

// ===========================================================================
// LES MULTIPLES
// ===========================================================================

const MULTIPLE_DIVISORS: Record<Step, readonly number[]> = { 1: [3, 4, 6], 2: [6, 7, 8], 3: [7, 8, 9, 11], 4: [6, 7, 8, 9, 12], 5: [7, 8, 9, 11, 12, 15] };
/** Les rangs des multiples (le k de k × d) servis à chaque palier. */
const FACTORS: Record<Step, readonly [number, number]> = { 1: [3, 10], 2: [5, 12], 3: [8, 15], 4: [10, 20], 5: [12, 30] };

/** « Lequel de ces nombres est un multiple de 7 ? » : le bon est dans la table, les deux autres sont à un ou deux de lui. */
export function makeCm1DblMultiple(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "cm1-dbl-multiple", "reconnaître un multiple", () => {
    const step = stepOf(ctx);
    const d = pick(ctx.rng, MULTIPLE_DIVISORS[step]);
    const k = randomInt(ctx.rng, FACTORS[step][0], FACTORS[step][1]);
    const multiple = d * k;
    const near = shuffle(ctx.rng, [multiple - 2, multiple - 1, multiple + 1, multiple + 2]).slice(0, 2);
    return {
      prompt: `Lequel de ces nombres est un multiple de ${d} ?`,
      answer: show(multiple),
      wrong: near.map(show),
      hints: ["Un multiple d'un nombre est dans sa table de multiplication.", "Récite la table, de ligne en ligne, jusqu'aux nombres proposés.", "Un nombre trop proche du bon n'est pas dans la table."],
    };
  });
}

/** « Complète la suite des multiples de 6. » : cinq multiples qui se suivent, un seul manque, jamais le premier. */
export function makeCm1DblSuite(ctx: GameContext): GeneratedGame {
  return gapGame(ctx, "cm1-dbl-suite", "compléter la suite des multiples", () => {
    const step = stepOf(ctx);
    const d = pick(ctx.rng, MULTIPLE_DIVISORS[step]);
    const startRanks: Record<Step, readonly [number, number]> = { 1: [1, 1], 2: [1, 3], 3: [3, 8], 4: [5, 12], 5: [8, 20] };
    const first = randomInt(ctx.rng, startRanks[step][0], startRanks[step][1]);
    const values = Array.from({ length: 5 }, (_, i) => (first + i) * d);
    const blank = randomInt(ctx.rng, step === 1 ? 2 : 1, 3);
    const answer = values[blank];
    return {
      prompt: `Complète la suite des multiples de ${d}.`,
      text: values.map((value, i) => (i === blank ? "___" : show(value))).join(", "),
      answer: show(answer),
      wrong: wrongNumbers(ctx, answer, [answer + 1, answer - 1, answer + 2, answer - 2, answer + 10, answer - 10], 1, 99999, values),
      hints: ["Chaque nombre de la suite est dans la table du nombre demandé.", "Regarde de combien on avance d'un nombre à l'autre.", "Ajoute ce même pas au nombre qui précède le trou."],
    };
  });
}

// ===========================================================================
// LES TABLES ET LE CALCUL MENTAL
// ===========================================================================

/** Les tables de chaque palier. */
const TABLES: Record<Step, readonly number[]> = { 1: [2, 3, 4, 5], 2: [6, 7], 3: [8, 9], 4: [6, 7, 8, 9], 5: [2, 3, 4, 5, 6, 7, 8, 9] };

export type Product = { a: number; b: number };

/** Un produit de la table du palier par un facteur de 2 à 9, jamais le même fait deux fois dans un palier (6 × 7 et 7 × 6 sont le même fait). */
export function drawProduct(ctx: GameContext): Product {
  const pairs: Product[] = TABLES[stepOf(ctx)].flatMap((a) => [2, 3, 4, 5, 6, 7, 8, 9].map((b) => ({ a, b })));
  const chosen = pickFresh(ctx, pairs, (pair) => `cm1-dbl:fait:${Math.min(pair.a, pair.b)}x${Math.max(pair.a, pair.b)}`);
  return ctx.rng() < 0.5 ? chosen : { a: chosen.b, b: chosen.a };
}

/** « Combien font 7 × 8 ? » : une table du palier. Les erreurs d'enfant : un rang de la table, la somme des facteurs. */
export function makeCm1DblTimes(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "cm1-dbl-fois", "connaître les tables de multiplication", () => {
    const { a, b } = drawProduct(ctx);
    const p = a * b;
    return {
      prompt: `Combien font ${a} × ${b} ?`,
      answer: String(p),
      wrong: wrongNumbers(ctx, p, [p + a, p - a, p + b, p - b, a + b], 1, 90),
      hints: ["Pense à la table de multiplication.", "Récite la table, de ligne en ligne, jusqu'au bon nombre.", "Vérifie avec l'autre table : l'ordre des facteurs ne change rien."],
    };
  });
}

/** Les nombres multipliés par dix, cent ou mille : par palier. */
function drawTen(ctx: GameContext): { a: number; b: number } {
  const step = stepOf(ctx);
  if (step === 1) return { a: randomInt(ctx.rng, 12, 99), b: 10 };
  if (step === 2) return { a: randomInt(ctx.rng, 12, 99), b: 100 };
  if (step === 3) return ctx.rng() < 0.5 ? { a: randomInt(ctx.rng, 12, 99), b: 1000 } : { a: randomInt(ctx.rng, 101, 999), b: pick(ctx.rng, [10, 100]) };
  if (step === 4) return { a: randomInt(ctx.rng, 2, 9) * 10, b: randomInt(ctx.rng, 2, 9) * 10 };
  return ctx.rng() < 0.5 ? { a: randomInt(ctx.rng, 2, 9) * 100, b: randomInt(ctx.rng, 2, 9) * 10 } : { a: randomInt(ctx.rng, 2, 9) * 10, b: randomInt(ctx.rng, 2, 9) * 100 };
}

/** « 45 × 100 = ___ » puis « 40 × 30 = ___ » : compter les zéros. */
export function makeCm1DblTen(ctx: GameContext): GeneratedGame {
  return gapGame(ctx, "cm1-dbl-dix", "multiplier par dix, cent, mille et par des nombres ronds", () => {
    const step = stepOf(ctx);
    const { a, b } = drawTen(ctx);
    const p = a * b;
    return {
      prompt: "Complète le calcul.",
      text: `${show(a)} × ${show(b)} = ___`,
      answer: show(p),
      wrong: wrongNumbers(ctx, p, [p / 10, p * 10, p / 100, p * 100], 1, 9999999),
      hints:
        step >= 4
          ? ["Multiplie d'abord les chiffres sans les zéros.", "Compte tous les zéros des deux nombres.", "Écris ces zéros à droite du produit."]
          : ["Multiplier par dix, cent ou mille décale les chiffres vers la gauche.", "Compte les zéros du second nombre.", "Écris ce même nombre de zéros à droite du premier nombre."],
    };
  });
}

type WriteForm = "double" | "moitie" | "multiple";
const WRITE_FORMS: Record<Step, readonly WriteForm[]> = {
  1: ["double", "moitie"],
  2: ["double", "moitie"],
  3: ["double", "moitie", "multiple"],
  4: ["double", "moitie", "multiple"],
  5: ["double", "moitie", "multiple"],
};
const DOUBLE_SPAN: Record<Step, readonly [number, number]> = { 1: [12, 49], 2: [60, 499], 3: [120, 999], 4: [1200, 4999], 5: [10000, 49999] };
const HALF_SPAN: Record<Step, readonly [number, number]> = { 1: [12, 98], 2: [100, 998], 3: [200, 998], 4: [1000, 9998], 5: [10000, 99998] };
const ABOVE_DIVISORS: Record<number, readonly number[]> = { 3: [6, 7, 8, 9], 4: [7, 8, 9, 11, 12], 5: [12, 15, 25] };
const ABOVE_SPAN: Record<number, readonly [number, number]> = { 3: [30, 120], 4: [100, 500], 5: [200, 999] };

/** « Écris le double de 345. », « Écris la moitié de 740. » ou « Écris le plus petit multiple de 7 supérieur à 40. » : une réponse courte. */
export function makeCm1DblWrite(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "cm1-dbl-ecrire", () => {
    const step = stepOf(ctx);
    const form = pick(ctx.rng, WRITE_FORMS[step]);
    let prompt: string;
    let answer: number;
    let concept: string;
    let hints: [string, string, string];
    if (form === "double") {
      const n = randomInt(ctx.rng, DOUBLE_SPAN[step][0], DOUBLE_SPAN[step][1]);
      prompt = `Écris le double de ${show(n)}.`;
      answer = 2 * n;
      concept = "calculer le double d'un nombre";
      hints = ["Le double d'un nombre, c'est deux fois ce nombre.", "Double chaque rang du nombre, de la droite vers la gauche.", "Additionne les résultats, avec les retenues."];
    } else if (form === "moitie") {
      const n = 2 * randomInt(ctx.rng, Math.ceil(HALF_SPAN[step][0] / 2), Math.floor(HALF_SPAN[step][1] / 2));
      prompt = `Écris la moitié de ${show(n)}.`;
      answer = n / 2;
      concept = "calculer la moitié d'un nombre pair";
      hints = ["La moitié d'un nombre, c'est le partager en deux parts égales.", "Partage d'abord les plus grands rangs, puis le reste.", "Vérifie : deux fois ta réponse redonne le nombre."];
    } else {
      const d = pick(ctx.rng, ABOVE_DIVISORS[step]);
      let n = randomInt(ctx.rng, ABOVE_SPAN[step][0], ABOVE_SPAN[step][1]);
      if (n % d === 0) n += 1;
      prompt = `Écris le plus petit multiple de ${d} supérieur à ${show(n)}.`;
      answer = (Math.floor(n / d) + 1) * d;
      concept = "trouver le multiple suivant";
      hints = ["Un multiple d'un nombre est dans sa table de multiplication.", "Récite la table jusqu'à dépasser le nombre demandé.", "Prends le premier résultat qui le dépasse."];
    }
    return {
      type: "short-answer",
      prompt,
      payload: { acceptedAnswers: [String(answer)], game: originOf("cm1-dbl-ecrire", ctx), concept },
      answerKey: String(answer),
      hints,
    };
  });
}

/** « Relie chaque calcul à son résultat. » : trois produits de la table du palier, tous les résultats différents. */
export function makeCm1DblLinks(ctx: GameContext): GeneratedGame {
  return linkGame(ctx, "cm1-dbl-relier", "relier un produit et son résultat", () => {
    const chosen: Product[] = [];
    const results = new Set<number>();
    for (let attempt = 0; attempt < 60 && chosen.length < 3; attempt++) {
      const product = drawProduct(ctx);
      if (results.has(product.a * product.b)) continue;
      results.add(product.a * product.b);
      chosen.push(product);
    }
    return {
      prompt: "Relie chaque calcul à son résultat.",
      pairs: chosen.map((product) => ({ left: `${product.a} × ${product.b}`, right: String(product.a * product.b) })),
      hints: ["Commence par le calcul que tu connais le mieux.", "Récite la table de multiplication du premier nombre.", "Chaque résultat va avec un seul calcul."],
    };
  });
}

/** « Range ces calculs du plus petit au plus grand résultat. » : quatre produits dont les résultats sont différents. */
export function makeCm1DblOrder(ctx: GameContext): GeneratedGame {
  return sequenceGame(ctx, "cm1-dbl-ordre", "comparer des produits", () => {
    const step = stepOf(ctx);
    const chosen: Product[] = [];
    const results = new Set<number>();
    for (let attempt = 0; attempt < 60 && chosen.length < 4; attempt++) {
      const product = drawProduct(ctx);
      if (results.has(product.a * product.b)) continue;
      results.add(product.a * product.b);
      chosen.push(product);
    }
    const ascending = step < 3 || ctx.rng() < 0.6;
    const sorted = [...chosen].sort((x, y) => (ascending ? x.a * x.b - y.a * y.b : y.a * y.b - x.a * x.b));
    return {
      prompt: ascending ? "Range ces calculs du plus petit au plus grand résultat." : "Range ces calculs du plus grand au plus petit résultat.",
      sequence: sorted.map((product) => `${product.a} × ${product.b}`),
      hints: ["Calcule chaque produit dans ta tête.", "Retiens le résultat de chaque calcul.", "Compare les résultats, puis range les calculs."],
    };
  });
}
