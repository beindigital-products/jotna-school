/**
 * LES GRANDS NOMBRES DU CM1 : jusqu'aux millions (`ma-cm1-grands-nombres`). Le voisin d'un nombre, comparer, ranger, le chiffre et la valeur d'un
 * rang, décomposer, arrondir, placer par rapport à un seuil, compléter une suite, les écrire en lettres et les lire.
 *
 * Sur l'échantillon, le modèle écrivait mal les grands nombres en lettres (« deux cents mille », « quatre-vingt millions »), arrondissait « 45 650 »
 * à 45 600 et confondait le chiffre des centaines avec le nombre de centaines. Ici la réponse est CALCULÉE, jamais écrite, et le mot d'un nombre vient
 * d'UNE fonction, `wordsOfCm1`, que le test recalcule avec son propre algorithme.
 *
 * LES CINQ PALIERS (`stepOf`) : cinq chiffres (10 000 à 99 999), six chiffres jusqu'à 499 999, six chiffres jusqu'à 999 999, sept chiffres jusqu'à
 * 4 999 999, enfin les millions jusqu'à 9 999 999. Le plafond de la fiche est 9 999 999 : le milliard est au CM2, aucun nombre ne le passe, ni dans un
 * énoncé ni dans un choix. Un million n'est écrit en lettres qu'avec un chiffre de millions (« trois millions quatre cent vingt mille ») : « deux
 * cents millions » et « quatre-vingts millions » n'existent pas à ce plafond.
 *
 * LES NOMBRES S'ÉCRIVENT comme à l'école : les milliers séparés par une espace (« 4 567 890 »), et en lettres sans trait d'union au-delà de cent :
 * « quatre-vingt mille » (sans s : mille est un mot de nombre derrière), « deux cent mille » (sans s), « deux cents » (un s quand rien ne suit),
 * « un million » mais « deux millions ». Une réponse à écrire en chiffres accepte « 4567890 » et « 4 567 890 ».
 *
 * L'ARRONDI suit la règle de l'école : on regarde le chiffre juste à droite du rang demandé, de cinq à neuf on monte d'un, sinon on garde.
 * Les mauvais choix sont des erreurs d'enfant : arrondir dans le mauvais sens (tronquer, ou monter à tort), arrondir à un autre rang.
 *
 * Les mauvais choix des autres jeux sont aussi des erreurs d'enfant : le nombre lui-même, une dizaine, une centaine, un millier de plus ou de moins,
 * les chiffres échangés, un rang pour un autre. Aucun indice n'écrit un chiffre : un nombre se lirait dedans.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { fresh, originOf, pick, randomInt, shuffle, type GameContext, type GeneratedGame } from "./shared";
import { choiceGame, firstLetter, gapGame, sequenceGame, sortGame } from "./tableaux";
import { inWords } from "./nombresCp";
import { CAP_CM1, digitAt, digitsOf, distinctInRange, distinctNumbers, lengthOf, plainNumber, reversed, show, stepOf, wrongNumbers, type Step } from "./cm1MathsOutils";

// ===========================================================================
// LA PLAGE, LES RANGS ET LES MOTS
// ===========================================================================

/** Le plus petit et le plus grand nombre servis à chaque palier. */
const RANGE: Record<Step, readonly [number, number]> = {
  1: [10000, 99999],
  2: [100000, 499999],
  3: [100000, 999999],
  4: [1000000, 4999999],
  5: [1000000, 9999999],
};

/** La plage de ce palier. */
export function rangeOfCm1(ctx: GameContext): { lo: number; top: number } {
  const [lo, top] = RANGE[stepOf(ctx)];
  return { lo, top };
}

const RANK_NAMES = ["unités", "dizaines", "centaines", "milliers", "dizaines de mille", "centaines de mille", "millions"] as const;
const RANK_SINGULAR = ["unité", "dizaine", "centaine", "millier", "dizaine de mille", "centaine de mille", "million"] as const;
const plural = (n: number, rank: number) => `${n} ${n > 1 ? RANK_NAMES[rank] : RANK_SINGULAR[rank]}`;

/** Un nombre de 0 à 999 en lettres. `final` : rien ne suit, donc « cent » et « quatre-vingts » prennent leur s. */
function underThousand(n: number, final: boolean): string {
  const hundreds = Math.floor(n / 100);
  const under = n % 100;
  const parts: string[] = [];
  if (hundreds === 1) parts.push("cent");
  else if (hundreds > 1) parts.push(`${inWords(hundreds)} cent${under === 0 && final ? "s" : ""}`);
  if (under > 0 || parts.length === 0) parts.push(under === 80 && !final ? "quatre-vingt" : inWords(under));
  return parts.join(" ");
}

/**
 * Un nombre de 0 à 9 999 999 en lettres, comme à l'école de France et du Sénégal. Au-dessus de cent, aucun trait d'union entre les mots ; « cent » et
 * « vingt » ne prennent un s que sans mot derrière (« deux cents », « quatre-vingts »), jamais devant « mille » ni devant un mot de million.
 */
export function wordsOfCm1(n: number): string {
  const parts: string[] = [];
  const millions = Math.floor(n / 1000000);
  const rest = n % 1000000;
  const thousands = Math.floor(rest / 1000);
  const low = rest % 1000;
  if (millions === 1) parts.push("un million");
  else if (millions > 1) parts.push(`${inWords(millions)} millions`);
  if (thousands === 1) parts.push("mille");
  else if (thousands > 1) parts.push(`${underThousand(thousands, false)} mille`);
  if (low > 0 || parts.length === 0) parts.push(underThousand(low, true));
  return parts.join(" ");
}

/** Le nombre de chiffres d'un nombre, dit en toutes lettres. */
const COUNT_WORDS: Record<number, string> = { 5: "cinq", 6: "six", 7: "sept" };

/** Le nombre dont deux chiffres voisins sont échangés : l'erreur de l'enfant qui lit de travers. */
function swapNeighbours(n: number, position: number): number {
  const digits = digitsOf(n);
  [digits[position], digits[position + 1]] = [digits[position + 1], digits[position]];
  return Number(digits.join(""));
}

/** Des nombres écrits avec les mêmes chiffres, deux voisins échangés : seule la place des chiffres les départage. */
function sameDigitNumbers(ctx: GameContext, count: number, lo: number, top: number): number[] {
  const base = plainNumber(ctx, lo, top);
  const positions = shuffle(ctx.rng, Array.from({ length: lengthOf(base) - 1 }, (_, i) => i)).slice(0, count - 1);
  return shuffle(ctx.rng, [base, ...positions.map((position) => swapNeighbours(base, position))]);
}

/** Les nombres à comparer ou à ranger : des voisins de millier dès le deuxième palier, et aux paliers 3 et 5 parfois les mêmes chiffres dans un autre ordre. */
function numbersToCompare(ctx: GameContext, count: number): number[] {
  const { lo, top } = rangeOfCm1(ctx);
  const step = stepOf(ctx);
  if ((step === 3 || step === 5) && ctx.rng() < 0.4) return sameDigitNumbers(ctx, count, lo, top);
  return distinctNumbers(ctx, count, lo, top, step >= 2);
}

// ===========================================================================
// LE VOISIN, COMPARER, RANGER
// ===========================================================================

/** Les pas d'une question de voisin, par palier : 1 se dit « juste après », les autres « en ajoutant ». */
const NEIGHBOUR_STEPS: Record<Step, readonly number[]> = {
  1: [1, 10, 100],
  2: [1, 100, 1000],
  3: [1, 1000, 10000],
  4: [1, 1000, 10000, 100000],
  5: [1, 10000, 100000, 1000000],
};

/** « Quel nombre vient juste après 399 999 ? » ou « Quel nombre obtiens-tu en ajoutant 1 000 à 456 789 ? » : souvent une retenue qui traverse plusieurs rangs. */
export function makeCm1GnNeighbour(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "cm1-gn-voisin", "ajouter ou enlever un nombre rond", () => {
    const { lo, top } = rangeOfCm1(ctx);
    const size = pick(ctx.rng, NEIGHBOUR_STEPS[stepOf(ctx)]);
    const up = ctx.rng() < 0.5;
    const rank = Math.round(Math.log10(size));
    // Le résultat reste un nombre du CM1 : jamais au-delà de 9 999 999, jamais zéro.
    const from = up ? lo : Math.max(lo, size + 1);
    const to = up ? Math.min(top, CAP_CM1 - size) : top;
    let n = randomInt(ctx.rng, from, to);
    if (ctx.rng() < 0.65) {
      // Une retenue qui traverse un ou plusieurs rangs : 399 999 + 1, 456 900 + 100, 1 000 000 - 1.
      for (let attempt = 0; attempt < 30; attempt++) {
        const block = 10 ** (rank + randomInt(ctx.rng, 0, 2) + 1);
        const lower = randomInt(ctx.rng, 0, size - 1);
        const q = randomInt(ctx.rng, 1, Math.floor(to / block) + 1);
        const candidate = up ? q * block - size + lower : q * block + lower;
        if (candidate >= from && candidate <= to) {
          n = candidate;
          break;
        }
      }
    }
    const answer = up ? n + size : n - size;
    const direction = up ? 1 : -1;
    const prompt =
      size === 1
        ? `Quel nombre vient juste ${up ? "après" : "avant"} ${show(n)} ?`
        : `Quel nombre obtiens-tu en ${up ? "ajoutant" : "enlevant"} ${show(size)} à ${show(n)} ?`;
    return {
      prompt,
      answer: show(answer),
      // Les erreurs d'enfant : le nombre lui-même, le mauvais sens, le mauvais rang.
      wrong: wrongNumbers(ctx, answer, [n, n - direction * size, n + direction * size * 10, size >= 10 ? n + direction * (size / 10) : n + direction * 10, n + direction * size * 100], 1, CAP_CM1),
      hints:
        size === 1
          ? ["Dis les nombres en comptant, depuis le début.", up ? "Le nombre d'après est un de plus." : "Le nombre d'avant est un de moins.", "Fais attention quand un chiffre arrive au bout : le rang d'à côté change."]
          : [
              "Repère le rang que le nombre rond fait bouger.",
              up ? "Le chiffre de ce rang monte d'un cran." : "Le chiffre de ce rang descend d'un cran.",
              up ? "Si ce chiffre passe de neuf à zéro, le rang d'à côté monte aussi." : "Si ce chiffre passe de zéro à neuf, le rang d'à côté descend aussi.",
            ],
    };
  });
}

/** « Quel est le plus grand de ces nombres ? » : trois nombres différents, dont deux du même millier dès le deuxième palier, ou écrits avec les mêmes chiffres. */
export function makeCm1GnCompare(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "cm1-gn-comparer", "comparer des grands nombres", () => {
    const numbers = numbersToCompare(ctx, 3);
    const biggest = ctx.rng() < 0.6;
    const answer = biggest ? Math.max(...numbers) : Math.min(...numbers);
    return {
      prompt: `Quel est le ${biggest ? "plus grand" : "plus petit"} de ces nombres ?`,
      answer: show(answer),
      wrong: numbers.filter((n) => n !== answer).map(show),
      hints: [
        "Compare d'abord le nombre de chiffres de chaque nombre.",
        "S'il est le même, regarde le chiffre de gauche, puis le suivant.",
        biggest ? "Le plus grand est celui qui a le plus fort chiffre au rang le plus à gauche." : "Le plus petit est celui qui a le plus faible chiffre au rang le plus à gauche.",
      ],
    };
  });
}

/** « Mets ces nombres dans l'ordre, du plus petit au plus grand. » : quatre nombres différents. */
export function makeCm1GnOrder(ctx: GameContext): GeneratedGame {
  return sequenceGame(ctx, "cm1-gn-ordre", "ranger des grands nombres", () => {
    const numbers = numbersToCompare(ctx, 4);
    const ascending = stepOf(ctx) < 3 || ctx.rng() < 0.6;
    return {
      prompt: ascending ? "Mets ces nombres dans l'ordre, du plus petit au plus grand." : "Mets ces nombres dans l'ordre, du plus grand au plus petit.",
      sequence: [...numbers].sort((a, b) => (ascending ? a - b : b - a)).map(show),
      hints: [
        "Compare d'abord le nombre de chiffres de chaque nombre.",
        ascending ? "Le plus petit nombre est celui dont le chiffre de gauche est le plus faible : mets-le au début." : "Le plus grand nombre est celui dont le chiffre de gauche est le plus fort : mets-le au début.",
        "Si deux nombres ont le même chiffre de gauche, regarde le chiffre d'après.",
      ],
    };
  });
}

// ===========================================================================
// LE CHIFFRE ET LA VALEUR D'UN RANG, DÉCOMPOSER, ARRONDIR
// ===========================================================================

/**
 * Trois questions sur un rang : « Quel est le chiffre des centaines de mille de 456 789 ? » (le chiffre), « Dans 456 789, quelle est la valeur du chiffre 5 ? »
 * (la valeur, dès le deuxième palier) et « Dans 456 789, combien y a-t-il de milliers en tout ? » (le nombre de milliers, dès le troisième : 456, pas 6).
 */
export function makeCm1GnDigits(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "cm1-gn-chiffres", "le chiffre, la valeur et le nombre d'un rang", () => {
    const { lo, top } = rangeOfCm1(ctx);
    const step = stepOf(ctx);
    const n = plainNumber(ctx, lo, top);
    const len = lengthOf(n);
    const forms = step === 1 ? ["chiffre"] : step === 2 ? ["chiffre", "valeur"] : step === 3 ? ["chiffre", "valeur", "nombre"] : ["chiffre", "valeur", "nombre", "nombre"];
    const form = pick(ctx.rng, forms);
    if (form === "nombre") {
      const rank = randomInt(ctx.rng, 2, len - 2);
      const count = Math.floor(n / 10 ** rank);
      const digit = digitAt(n, rank);
      return {
        prompt: `Dans ${show(n)}, combien y a-t-il de ${RANK_NAMES[rank]} en tout ?`,
        answer: show(count),
        // Les erreurs d'enfant : le chiffre du rang seul, le nombre du rang d'à côté, les chiffres qui restent à droite.
        wrong: wrongNumbers(ctx, count, [digit, Math.floor(count / 10), count * 10 + digitAt(n, rank - 1), n % 10 ** rank, Math.floor(n / 10 ** (rank + 1))], 1, CAP_CM1),
        hints: [
          "Il ne s'agit pas du seul chiffre de ce rang.",
          "Compte tous les chiffres qui sont à gauche du rang, avec lui.",
          "Les chiffres qui sont à droite du rang ne comptent pas.",
        ],
      };
    }
    const rank = randomInt(ctx.rng, 0, len - 1);
    const digit = digitAt(n, rank);
    if (form === "chiffre") {
      const others = digitsOf(n).filter((d) => d !== digit);
      return {
        prompt: `Quel est le chiffre des ${RANK_NAMES[rank]} de ${show(n)} ?`,
        answer: String(digit),
        wrong: shuffle(ctx.rng, [...others, ...Array.from({ length: 9 }, (_, i) => i + 1).filter((d) => d !== digit && !others.includes(d))]).map(String),
        hints: ["Les unités sont le chiffre tout à droite.", "Va vers la gauche : les dizaines, les centaines, les milliers et ainsi de suite.", "Compte les rangs depuis la droite, en partant des unités."],
      };
    }
    const value = digit * 10 ** rank;
    return {
      prompt: `Dans ${show(n)}, quelle est la valeur du chiffre ${digit} ?`,
      answer: show(value),
      wrong: wrongNumbers(ctx, value, [digit, digit * 10 ** (rank + 1), rank > 0 ? digit * 10 ** (rank - 1) : -1, digit * 10 ** ((rank + 2) % len)], 1, CAP_CM1),
      hints: [
        "Le chiffre vaut plus ou moins selon sa place dans le nombre.",
        "Cherche son rang : unités, dizaines, centaines, milliers et ainsi de suite.",
        "Ajoute autant de zéros que le chiffre a de rangs à sa droite.",
      ],
    };
  });
}

/** Un nombre dont trois ou quatre chiffres seulement ne sont pas nuls : sa décomposition en valeurs reste lisible. */
function roundishNumber(ctx: GameContext, lo: number, top: number): number {
  const len = lengthOf(lo);
  for (let attempt = 0; attempt < 200; attempt++) {
    const nonZero = randomInt(ctx.rng, 3, 4);
    const ranks = shuffle(ctx.rng, Array.from({ length: len - 1 }, (_, i) => i)).slice(0, nonZero - 1);
    let n = randomInt(ctx.rng, 1, 9) * 10 ** (len - 1);
    for (const rank of ranks) n += randomInt(ctx.rng, 1, 9) * 10 ** rank;
    if (n >= lo && n <= top) return n;
  }
  return lo + 2030;
}

/** Quatre façons de décomposer, du plus simple au plus fin : le palier choisit la sienne. */
export function makeCm1GnDecompose(ctx: GameContext): GeneratedGame {
  return gapGame(ctx, "cm1-gn-decomposer", "décomposer un grand nombre", () => {
    const { lo, top } = rangeOfCm1(ctx);
    const step = stepOf(ctx);
    const forms = step === 1 ? ["somme", "dit", "blocs"] : step === 2 ? ["somme", "dit", "blocs", "milliers"] : step === 3 ? ["somme", "blocs", "milliers", "dit"] : ["somme", "dit", "milliers", "blocs"];
    const form = pick(ctx.rng, forms);
    if (form === "somme") {
      const n = roundishNumber(ctx, lo, top);
      const len = lengthOf(n);
      const parts = Array.from({ length: len }, (_, i) => digitAt(n, len - 1 - i) * 10 ** (len - 1 - i)).filter((part) => part > 0);
      const missing = randomInt(ctx.rng, 1, parts.length - 1);
      const value = parts[missing];
      const rank = Math.floor(Math.log10(value));
      const digit = value / 10 ** rank;
      return {
        prompt: "Complète avec le bon nombre.",
        text: `${show(n)} = ${parts.map((part, i) => (i === missing ? "___" : show(part))).join(" + ")}`,
        answer: show(value),
        wrong: wrongNumbers(ctx, value, [digit, digit * 10 ** (rank + 1), rank > 0 ? digit * 10 ** (rank - 1) : -1, digit * 10 ** (rank + 2)], 1, CAP_CM1, parts),
        hints: ["Les autres parties sont déjà écrites.", "Cherche le chiffre du rang qui manque.", "Ajoute autant de zéros que le chiffre a de rangs à sa droite."],
      };
    }
    if (form === "dit") {
      const n = plainNumber(ctx, lo, top);
      const len = lengthOf(n);
      const said = Array.from({ length: len }, (_, i) => plural(digitAt(n, len - 1 - i), len - 1 - i));
      const near = [swapNeighbours(n, len - 2), swapNeighbours(n, len - 3), n + 10, n - 10, n + 100, n - 100, n + 1000, n - 1000, reversed(n)];
      return {
        prompt: "Complète avec le bon nombre.",
        text: `${said.slice(0, -1).join(", ")} et ${said[said.length - 1]}, c'est le nombre ___.`,
        answer: show(n),
        wrong: wrongNumbers(ctx, n, near, lo, CAP_CM1),
        hints: ["Chaque rang donne un chiffre.", "Écris d'abord le chiffre des plus grands rangs, à gauche.", "Les unités se mettent tout à droite."],
      };
    }
    const n = plainNumber(ctx, lo, top);
    const blocks = Math.floor(n / 1000);
    const rest = n % 1000;
    if (form === "blocs") {
      return {
        prompt: "Complète avec le bon nombre.",
        text: `${show(n)} = ${show(blocks)} × 1 000 + ___`,
        answer: show(rest),
        wrong: wrongNumbers(ctx, rest, [Math.floor(rest / 10), rest * 10, reversed(rest), n % 10000, blocks % 1000], 1, CAP_CM1),
        hints: ["Le produit du nombre de milliers par mille donne les chiffres de gauche.", "Cherche ce qui reste à droite, après les milliers.", "Ce reste est écrit avec trois chiffres."],
      };
    }
    return {
      prompt: "Complète avec le bon nombre.",
      text: `${show(n)} = ___ × 1 000 + ${rest}`,
      answer: show(blocks),
      wrong: wrongNumbers(ctx, blocks, [Math.floor(n / 100), Math.floor(blocks / 10), rest, blocks * 10 + digitAt(n, 2), n % 100000], 1, CAP_CM1),
      hints: ["Les trois chiffres de droite sont déjà écrits à part.", "Combien de milliers entiers y a-t-il dans le nombre ?", "Les chiffres de gauche, jusqu'aux milliers, forment ce nombre."],
    };
  });
}

/** Les rangs d'un arrondi par palier : de la dizaine au million. */
const ROUND_UNITS: Record<Step, readonly number[]> = {
  1: [10, 100, 1000],
  2: [100, 1000, 10000],
  3: [1000, 10000, 100000],
  4: [1000, 10000, 100000],
  5: [10000, 100000, 1000000],
};

const ROUND_PHRASES: Record<number, string> = {
  10: "à la dizaine près",
  100: "à la centaine près",
  1000: "au millier près",
  10000: "à la dizaine de mille près",
  100000: "à la centaine de mille près",
  1000000: "au million près",
};

/** L'arrondi de l'école : de cinq à neuf on monte au multiple d'au-dessus, sinon on garde celui d'en dessous. */
export const roundTo = (n: number, unit: number) => Math.floor((n + unit / 2) / unit) * unit;

/** « Arrondis 45 678 à la centaine près. Quel nombre obtiens-tu ? » : le chiffre juste à droite du rang décide. */
export function makeCm1GnRound(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "cm1-gn-arrondir", "arrondir un grand nombre", () => {
    const step = stepOf(ctx);
    // Un nombre d'au plus 9 499 999 : arrondi à son rang, il ne dépasse jamais 9 999 999.
    const lo = RANGE[step][0];
    const top = Math.min(RANGE[step][1], 9499999);
    const n = plainNumber(ctx, lo, top);
    const unit = pick(ctx.rng, ROUND_UNITS[step]);
    const answer = roundTo(n, unit);
    const down = Math.floor(n / unit) * unit;
    const otherWay = answer === down ? down + unit : down;
    const pool = [otherWay, roundTo(n, unit * 10), unit >= 100 ? roundTo(n, unit / 10) : otherWay, n];
    return {
      prompt: `Arrondis ${show(n)} ${ROUND_PHRASES[unit]}. Quel nombre obtiens-tu ?`,
      answer: show(answer),
      wrong: wrongNumbers(ctx, answer, pool, 1, CAP_CM1),
      hints: [
        "Cherche le rang demandé dans le nombre.",
        "Regarde le chiffre juste à sa droite : de cinq à neuf, le chiffre du rang monte d'un, sinon il reste.",
        "Remplace tous les chiffres à droite du rang par des zéros.",
      ],
    };
  });
}

// ===========================================================================
// SE SITUER, COMPLÉTER UNE SUITE
// ===========================================================================

/** « Glisse chaque nombre dans la bonne case. » : moins de 500 000 ou plus de 500 000. Le seuil n'est jamais un des nombres. */
export function makeCm1GnSortThreshold(ctx: GameContext): GeneratedGame {
  return sortGame(ctx, "cm1-gn-glisser", "placer des nombres par rapport à un seuil", () => {
    const { lo, top } = rangeOfCm1(ctx);
    const step = stepOf(ctx);
    const len = lengthOf(lo);
    const each = step === 1 ? 2 : 3;
    // Un seuil rond : le chiffre de gauche suivi de zéros, ou, dès le troisième palier, un demi (« 250 000 »).
    const unit = step >= 3 ? 5 * 10 ** (len - 2) : 10 ** (len - 1);
    const thresholds: number[] = [];
    for (let t = Math.ceil((lo + 1) / unit) * unit; t < top; t += unit) if (t - lo >= each && top - t >= each) thresholds.push(t);
    const threshold = pick(ctx.rng, thresholds);
    const below = distinctInRange(ctx, lo, threshold - 1, each);
    const above = distinctInRange(ctx, threshold + 1, top, each);
    const lowZone = `Moins de ${show(threshold)}`;
    const highZone = `Plus de ${show(threshold)}`;
    return {
      prompt: "Glisse chaque nombre dans la bonne case.",
      zones: [lowZone, highZone],
      items: [...below.map((n) => ({ text: show(n), zone: lowZone })), ...above.map((n) => ({ text: show(n), zone: highZone }))],
      hints: ["Lis les nombres un par un.", "Compare chaque nombre à celui de la case.", "Regarde d'abord le nombre de chiffres, puis le chiffre de gauche."],
    };
  });
}

/** Les pas d'une suite, par palier : des pas qu'on compte de tête, du plus facile au plus fin. */
const SUITE_STEPS: Record<Step, readonly number[]> = {
  1: [1000, 5000, 10000],
  2: [5000, 10000, 25000, 50000],
  3: [10000, 25000, 50000, 100000],
  4: [100000, 250000, 500000],
  5: [250000, 500000, 1000000],
};

/** « Complète la suite : 120 000, 130 000, 140 000, ___ » : un seul pas, un seul nombre qui manque. Dès le troisième palier, le nombre qui manque est au milieu. */
export function makeCm1GnSuite(ctx: GameContext): GeneratedGame {
  return gapGame(ctx, "cm1-gn-suite", "compléter une suite de grands nombres", () => {
    const { lo, top } = rangeOfCm1(ctx);
    const step = stepOf(ctx);
    const size = pick(ctx.rng, SUITE_STEPS[step]);
    const length = 5;
    const descending = step >= 2 && ctx.rng() < 0.4;
    // Le premier terme est un multiple du pas : « 120 000, 130 000 » se lit mieux que « 123 456, 133 456 ».
    const first = Math.ceil(lo / size);
    const last = Math.floor(top / size);
    const startK = randomInt(ctx.rng, first + (descending ? length - 1 : 0), last - (descending ? 0 : length - 1));
    const start = startK * size;
    const values = Array.from({ length }, (_, i) => (descending ? start - i * size : start + i * size));
    const blank = step >= 3 ? randomInt(ctx.rng, 1, length - 2) : length - 1;
    const answer = values[blank];
    return {
      prompt: descending ? "Complète la suite de nombres. Elle descend toujours du même pas." : "Complète la suite de nombres. Elle avance toujours du même pas.",
      text: values.map((value, i) => (i === blank ? "___" : show(value))).join(", "),
      answer: show(answer),
      wrong: wrongNumbers(ctx, answer, [answer + size, answer - size, answer + 2 * size, answer + size / 10, answer - size / 10], 1, CAP_CM1, values),
      hints: [
        "Regarde deux nombres qui se suivent : de combien avance-t-on ?",
        "Vérifie ce même pas avec les autres nombres de la suite.",
        "Ajoute ou enlève ce pas au nombre d'à côté.",
      ],
    };
  });
}

// ===========================================================================
// LES NOMBRES EN LETTRES
// ===========================================================================

/** Les trois conseils d'un nombre écrit en lettres, selon sa famille de mots. Aucun ne contient un chiffre. */
function wordHints(n: number): [string, string, string] {
  const family =
    n >= 1000000
      ? "Le mot million se dit après le nombre de millions, et il prend un s quand il y en a plusieurs."
      : "Les milliers se disent avant le mot mille, qui ne prend jamais de s.";
  return ["Dis le nombre à voix haute, doucement.", "Cherche d'abord les plus grands rangs, puis les plus petits.", family];
}

/** « Quel nombre s'écrit « trois millions quatre cent vingt mille » ? » */
export function makeCm1GnWords(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "cm1-gn-lettres", "lire un grand nombre écrit en lettres", () => {
    const { lo, top } = rangeOfCm1(ctx);
    const n = randomInt(ctx.rng, lo, top);
    const len = lengthOf(n);
    const near = [n - 10 ** (len - 4), n + 10 ** (len - 4), n - 10 ** (len - 3), n + 10 ** (len - 3), n - 10 ** (len - 2), n + 10 ** (len - 2), swapNeighbours(n, len - 2), n + 1];
    return {
      prompt: `Quel nombre s'écrit « ${wordsOfCm1(n)} » ?`,
      answer: show(n),
      wrong: wrongNumbers(ctx, n, near, lo, top),
      hints: wordHints(n),
    };
  });
}

/** « Écris en chiffres le nombre « trois millions quatre cent vingt mille ». » : une réponse courte (« 3420000 » vaut « 3 420 000 »). */
export function makeCm1GnWriteNumber(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "cm1-gn-ecrire", () => {
    const { lo, top } = rangeOfCm1(ctx);
    const n = randomInt(ctx.rng, lo, top);
    const words = wordsOfCm1(n);
    return {
      type: "short-answer",
      prompt: `Écris en chiffres le nombre « ${words} ».`,
      payload: { acceptedAnswers: [String(n)], game: originOf("cm1-gn-ecrire", ctx), concept: "écrire en chiffres un grand nombre dit en lettres" },
      answerKey: String(n),
      hints: ["Dis le nombre à voix haute, doucement.", `Ce nombre s'écrit avec ${COUNT_WORDS[lengthOf(n)]} chiffres.`, `Le premier mot commence par la lettre ${firstLetter(words)}.`],
    };
  });
}
