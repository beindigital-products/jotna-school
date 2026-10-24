/**
 * LES MILLIONS ET LES MILLIARDS DU CM2 (`ma-cm2-milliards`) : comparer, ranger, le chiffre et la valeur d'un rang, compléter une suite, arrondir, écrire un
 * nombre en chiffres d'après ses lettres, le lire, calculer avec de grands nombres, relier, placer par rapport à un seuil.
 *
 * Sur l'échantillon, le modèle écrivait « deux cent millions » (sans s), « trois milliards » pour 3 000 000, et arrondissait au million « 3 450 000 » vers
 * 3 000 000. Ici la réponse est CALCULÉE, jamais écrite, et le mot d'un nombre vient d'UNE fonction, `wordsOfCm2` (`cm2MathsOutils.ts`), que le test
 * recalcule avec son propre algorithme.
 *
 * LES CINQ PALIERS (`stepOf`) : sept chiffres (les millions), huit chiffres, neuf chiffres, dix chiffres (les milliards), puis jusqu'aux centaines de
 * milliards (douze chiffres). Aucun nombre ne dépasse 999 999 999 999, ni dans un énoncé ni dans un choix.
 *
 * LES NOMBRES S'ÉCRIVENT comme à l'école : les milliers séparés par une espace (« 4 567 890 123 »), et en lettres sans trait d'union au-delà de cent :
 * « deux cents millions » (cent prend un s devant un nom), « deux cent mille » (sans s devant mille), « un milliard » mais « deux milliards ».
 * Une réponse à écrire en chiffres accepte « 3200000000 » et « 3 200 000 000 ».
 *
 * L'ARRONDI suit la règle de l'école : on regarde le chiffre juste à droite du rang demandé, de cinq à neuf on monte d'un, sinon on garde. Les mauvais choix
 * sont des erreurs d'enfant : tronquer, monter à tort, arrondir à un autre rang.
 *
 * Aucun indice n'écrit un chiffre : un nombre se lirait dedans.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { fresh, originOf, pick, randomInt, shuffle, type GameContext, type GeneratedGame } from "./shared";
import { choiceGame, gapGame, linkGame, sequenceGame, sortGame } from "./tableaux";
import { digitAt, digitsOf, lengthOf, show, stepOf, type Step } from "./cm1MathsOutils";
import { CAP_CM2, closeNumbers, swapRanks, wordsOfCm2, wrongBig } from "./cm2MathsOutils";

// ===========================================================================
// LA PLAGE, LES RANGS ET LES NOMBRES RONDS
// ===========================================================================

/** Le plus petit et le plus grand nombre servis à chaque palier. */
const RANGE: Record<Step, readonly [number, number]> = {
  1: [1000000, 9999999],
  2: [10000000, 99999999],
  3: [100000000, 999999999],
  4: [1000000000, 9999999999],
  5: [10000000000, CAP_CM2],
};

/** La plage de ce palier. */
export function rangeOfCm2(ctx: GameContext): { lo: number; top: number } {
  const [lo, top] = RANGE[stepOf(ctx)];
  return { lo, top };
}

const RANK_NAMES = [
  "unités",
  "dizaines",
  "centaines",
  "milliers",
  "dizaines de mille",
  "centaines de mille",
  "millions",
  "dizaines de millions",
  "centaines de millions",
  "milliards",
  "dizaines de milliards",
  "centaines de milliards",
] as const;

/** Les unités d'un arrondi : sa taille et la façon de le dire. */
const ROUND_UNITS: readonly { size: number; label: string }[] = [
  { size: 10000, label: "à la dizaine de mille la plus proche" },
  { size: 100000, label: "à la centaine de mille la plus proche" },
  { size: 1000000, label: "au million le plus proche" },
  { size: 10000000, label: "à la dizaine de millions la plus proche" },
  { size: 100000000, label: "à la centaine de millions la plus proche" },
  { size: 1000000000, label: "au milliard le plus proche" },
  { size: 10000000000, label: "à la dizaine de milliards la plus proche" },
  { size: 100000000000, label: "à la centaine de milliards la plus proche" },
];
/** Les unités d'arrondi servies à chaque palier. */
const ROUND_BY_STEP: Record<Step, readonly number[]> = {
  1: [10000, 100000, 1000000],
  2: [100000, 1000000, 10000000],
  3: [1000000, 10000000, 100000000],
  4: [10000000, 100000000, 1000000000],
  5: [100000000, 1000000000, 10000000000, 100000000000],
};

/** Un nombre dont trois ou quatre chiffres seulement ne sont pas nuls : sa lecture et sa décomposition restent lisibles. */
export function roundishBig(ctx: GameContext, lo: number, top: number): number {
  const len = lengthOf(lo);
  for (let attempt = 0; attempt < 300; attempt++) {
    const nonZero = randomInt(ctx.rng, 3, 4);
    const ranks = shuffle(ctx.rng, Array.from({ length: len - 1 }, (_, i) => i)).slice(0, nonZero - 1);
    let n = randomInt(ctx.rng, 1, 9) * 10 ** (len - 1);
    for (const rank of ranks) n += randomInt(ctx.rng, 1, 9) * 10 ** rank;
    if (n >= lo && n <= top) return n;
  }
  return lo + 2030;
}

/** Un nombre de la plage, tous chiffres non nuls : un chiffre n'est pas un zéro qui se confond avec un rang vide. */
function digitsNoZero(ctx: GameContext, lo: number, top: number): number {
  const len = lengthOf(lo);
  for (let attempt = 0; attempt < 300; attempt++) {
    let n = 0;
    for (let i = 0; i < len; i++) n = n * 10 + randomInt(ctx.rng, 1, 9);
    if (n >= lo && n <= top) return n;
  }
  return lo + 111111;
}

/** Des nombres à comparer ou à ranger : très différents au premier palier, ensuite proches (mêmes premiers chiffres). */
function numbersToCompare(ctx: GameContext, count: number): number[] {
  const { lo, top } = rangeOfCm2(ctx);
  if (stepOf(ctx) === 1) {
    const out = new Set<number>();
    while (out.size < count) out.add(randomInt(ctx.rng, lo, top));
    return [...out];
  }
  return closeNumbers(ctx, count, lo, top);
}

// ===========================================================================
// COMPARER, RANGER
// ===========================================================================

/** « Quel est le plus grand de ces nombres ? » : trois nombres différents. */
export function makeCm2GrnCompare(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "cm2-grn-comparer", "comparer des grands nombres", () => {
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
export function makeCm2GrnOrder(ctx: GameContext): GeneratedGame {
  return sequenceGame(ctx, "cm2-grn-ranger", "ranger des grands nombres", () => {
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
// LE CHIFFRE, LA VALEUR ET LE NOMBRE D'UN RANG
// ===========================================================================

/** Un chiffre qui n'est dans le nombre qu'une fois, et son rang : sa valeur ne se confond avec aucun autre. */
function singleDigit(n: number): { digit: number; rank: number } | null {
  const digits = digitsOf(n);
  const candidates = digits.map((digit, i) => ({ digit, rank: digits.length - 1 - i })).filter(({ digit }) => digit > 0 && digits.filter((d) => d === digit).length === 1);
  return candidates.length > 0 ? candidates[0] : null;
}

/**
 * Trois questions sur un rang : « Quel est le chiffre des millions de 345 678 912 ? » (le chiffre), « Dans 345 678 912, quelle est la valeur du chiffre 4 ? »
 * (la valeur, dès le deuxième palier) et « Dans 345 678 912, combien y a-t-il de milliers en tout ? » (le nombre de milliers, dès le troisième : 345 678, pas 8).
 */
export function makeCm2GrnDigits(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "cm2-grn-chiffres", "le chiffre, la valeur et le nombre d'un rang", () => {
    const { lo, top } = rangeOfCm2(ctx);
    const step = stepOf(ctx);
    const n = digitsNoZero(ctx, lo, top);
    const len = lengthOf(n);
    const forms = step === 1 ? ["chiffre"] : step === 2 ? ["chiffre", "valeur"] : step === 3 ? ["chiffre", "valeur", "nombre"] : ["chiffre", "valeur", "nombre", "nombre"];
    const form = pick(ctx.rng, forms);
    if (form === "nombre") {
      const rank = pick(ctx.rng, [3, 6, 9].filter((r) => r <= len - 2));
      const count = Math.floor(n / 10 ** rank);
      const digit = digitAt(n, rank);
      return {
        prompt: `Dans ${show(n)}, combien y a-t-il de ${RANK_NAMES[rank]} en tout ?`,
        answer: show(count),
        // Les erreurs d'enfant : le chiffre du rang seul, le nombre du rang d'à côté, les chiffres qui restent à droite.
        wrong: wrongBig(ctx, count, [digit, Math.floor(count / 10), count * 10 + digitAt(n, rank - 1), n % 10 ** rank, Math.floor(n / 10 ** (rank + 1))], 1, CAP_CM2),
        hints: [
          "Il ne s'agit pas du seul chiffre de ce rang.",
          "Compte tous les chiffres qui sont à gauche du rang, avec lui.",
          "Les chiffres qui sont à droite du rang ne comptent pas.",
        ],
      };
    }
    if (form === "valeur") {
      const single = singleDigit(n);
      if (single) {
        const { digit, rank } = single;
        const value = digit * 10 ** rank;
        return {
          prompt: `Dans ${show(n)}, quelle est la valeur du chiffre ${digit} ?`,
          answer: show(value),
          wrong: wrongBig(ctx, value, [digit, digit * 10 ** (rank + 1), rank > 0 ? digit * 10 ** (rank - 1) : -1, digit * 10 ** (rank + 2)], 1, CAP_CM2),
          hints: [
            "Le chiffre vaut plus ou moins selon sa place dans le nombre.",
            "Cherche son rang : unités, dizaines, centaines, milliers et ainsi de suite.",
            "Ajoute autant de zéros que le chiffre a de rangs à sa droite.",
          ],
        };
      }
    }
    const rank = randomInt(ctx.rng, 0, len - 1);
    const digit = digitAt(n, rank);
    const others = digitsOf(n).filter((d) => d !== digit);
    return {
      prompt: `Quel est le chiffre des ${RANK_NAMES[rank]} de ${show(n)} ?`,
      answer: String(digit),
      wrong: shuffle(ctx.rng, [...others, ...Array.from({ length: 9 }, (_, i) => i + 1).filter((d) => d !== digit && !others.includes(d))]).map(String),
      hints: ["Les unités sont le chiffre tout à droite.", "Va vers la gauche : les dizaines, les centaines, les milliers et ainsi de suite.", "Compte les rangs depuis la droite, en partant des unités."],
    };
  });
}

// ===========================================================================
// COMPLÉTER UNE SUITE
// ===========================================================================

/** Le pas d'une suite, par palier. */
const SEQUENCE_STEPS: Record<Step, readonly number[]> = {
  1: [100000, 500000, 1000000],
  2: [1000000, 5000000, 10000000],
  3: [10000000, 50000000, 100000000],
  4: [100000000, 500000000, 1000000000],
  5: [1000000000, 5000000000, 10000000000, 100000000000],
};

/** « Complète la suite. » : cinq termes à pas constant, un terme caché au milieu. */
export function makeCm2GrnSequence(ctx: GameContext): GeneratedGame {
  return gapGame(ctx, "cm2-grn-suite", "compléter une suite de grands nombres", () => {
    const { lo, top } = rangeOfCm2(ctx);
    const delta = pick(ctx.rng, SEQUENCE_STEPS[stepOf(ctx)].filter((d) => lo + 4 * d <= top));
    const ascending = ctx.rng() < 0.65;
    const first = ascending
      ? randomInt(ctx.rng, Math.ceil(lo / delta), Math.floor((top - 4 * delta) / delta)) * delta
      : randomInt(ctx.rng, Math.ceil((lo + 4 * delta) / delta), Math.floor(top / delta)) * delta;
    const terms = Array.from({ length: 5 }, (_, i) => (ascending ? first + i * delta : first - i * delta));
    const hidden = randomInt(ctx.rng, 1, 3);
    const answer = terms[hidden];
    const sign = ascending ? 1 : -1;
    return {
      prompt: "Complète la suite.",
      text: terms.map((t, i) => (i === hidden ? "___" : show(t))).join(", "),
      answer: show(answer),
      // Les erreurs d'enfant : un pas dix fois trop petit ou trop grand, le mauvais sens, un terme de trop ou de moins.
      wrong: wrongBig(ctx, answer, [terms[hidden - 1] + sign * delta * 10, terms[hidden - 1] + sign * Math.max(1, delta / 10), terms[hidden - 1] - sign * delta, answer + sign * delta], 1, CAP_CM2, terms),
      hints: ["Cherche de combien on avance d'un terme au suivant.", "Ce pas est le même entre deux termes qui se suivent.", ascending ? "Ajoute ce pas au terme d'avant." : "Enlève ce pas au terme d'avant."],
    };
  });
}

// ===========================================================================
// ARRONDIR
// ===========================================================================

/** L'arrondi d'un nombre à l'unité `size` : on regarde le chiffre juste à droite, de cinq à neuf on monte. */
const roundTo = (n: number, size: number) => Math.floor((n + size / 2) / size) * size;

/** « Arrondis 3 456 789 au million le plus proche. » : jamais un nombre déjà rond à cette unité. */
export function makeCm2GrnRound(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "cm2-grn-arrondir", "arrondir un grand nombre", () => {
    const { lo, top } = rangeOfCm2(ctx);
    const size = pick(ctx.rng, ROUND_BY_STEP[stepOf(ctx)]);
    const unit = ROUND_UNITS.find((u) => u.size === size)!;
    let n = digitsNoZero(ctx, lo, top);
    // Un nombre de la plage dont l'arrondi tient dans le plafond.
    while (roundTo(n, size) > CAP_CM2 || n % size === 0) n = digitsNoZero(ctx, lo, top);
    const answer = roundTo(n, size);
    const down = Math.floor(n / size) * size;
    const up = down + size;
    return {
      prompt: `Arrondis ${show(n)} ${unit.label}.`,
      answer: show(answer),
      // Les erreurs d'enfant : tronquer, monter à tort, arrondir à l'unité d'à côté.
      wrong: wrongBig(ctx, answer, [down, up, roundTo(n, size / 10), roundTo(n, size * 10), answer > down ? down - size : up + size], 1, CAP_CM2),
      hints: [
        "Repère le rang demandé, puis le chiffre juste à sa droite.",
        "De zéro à quatre, le nombre garde son chiffre du rang. De cinq à neuf, ce chiffre monte d'un.",
        "Tous les chiffres à droite du rang deviennent des zéros.",
      ],
    };
  });
}

// ===========================================================================
// ÉCRIRE EN CHIFFRES, LIRE
// ===========================================================================

/** « Écris en chiffres le nombre trois milliards deux cents millions. » : une réponse à écrire, avec ou sans espaces. */
export function makeCm2GrnWrite(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "cm2-grn-ecrire", () => {
    const { lo, top } = rangeOfCm2(ctx);
    const n = roundishBig(ctx, lo, top);
    return {
      type: "short-answer",
      prompt: `Écris en chiffres le nombre ${wordsOfCm2(n)}.`,
      payload: { acceptedAnswers: [show(n), String(n)], game: originOf("cm2-grn-ecrire", ctx), concept: "écrire un grand nombre en chiffres" },
      answerKey: show(n),
      hints: ["Écris chaque groupe de trois chiffres : les milliards, les millions, les milliers, puis le reste.", "Un groupe qui n'est pas dit s'écrit avec trois zéros.", "Sépare les groupes de trois chiffres par une espace."],
    };
  });
}

/** « Comment lit-on 3 204 000 000 ? » : le nombre en lettres, avec les erreurs d'un enfant qui lit de travers pour mauvais choix. */
export function makeCm2GrnRead(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "cm2-grn-lire", "lire un grand nombre", () => {
    const { lo, top } = rangeOfCm2(ctx);
    const n = roundishBig(ctx, lo, top);
    const len = lengthOf(n);
    const pool = [swapRanks(n, len - 2, len - 3), swapRanks(n, 0, 1), Math.floor(n / 1000) >= lo / 1000 ? Math.floor(n / 1000) : -1, n * 1000, n + 10 ** (len - 2), n - 10 ** (len - 3)];
    const wrong = wrongBig(ctx, n, pool, 1, CAP_CM2).map((text) => wordsOfCm2(Number(text.replace(/ /g, ""))));
    return {
      prompt: `Comment lit-on ${show(n)} ?`,
      answer: wordsOfCm2(n),
      wrong,
      hints: ["Coupe le nombre en groupes de trois chiffres, en partant de la droite.", "Chaque groupe se lit avec son nom : milliards, millions, mille.", "Le groupe des unités se lit sans nom."],
    };
  });
}

// ===========================================================================
// CALCULER
// ===========================================================================

/** Un multiple de `unit` dans [lo, top]. */
const multiple = (ctx: GameContext, unit: number, lo: number, top: number) => randomInt(ctx.rng, Math.ceil(lo / unit), Math.floor(top / unit)) * unit;

/**
 * « Calcule 2 450 000 + 3 800 000. », « Calcule 7 000 000 - 2 350 000. », « Combien font 36 000 × 1 000 ? », « Combien font 4 500 000 ÷ 1 000 ? » :
 * l'addition et la soustraction aux premiers paliers, la multiplication et la division par 10, 100 ou 1 000 ensuite.
 */
export function makeCm2GrnCompute(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "cm2-grn-calculer", "calculer avec de grands nombres", () => {
    const { lo, top } = rangeOfCm2(ctx);
    const step = stepOf(ctx);
    const forms = step === 1 ? ["somme", "difference"] : step === 2 ? ["somme", "difference", "produit"] : ["somme", "difference", "produit", "quotient"];
    const form = pick(ctx.rng, forms);
    const unit = Math.max(1000, 10 ** (lengthOf(lo) - 3));
    if (form === "somme" || form === "difference") {
      const a = multiple(ctx, unit, lo, Math.floor(top / 2));
      const b = multiple(ctx, unit, Math.floor(lo / 10), Math.floor(top / 2));
      const big = Math.max(a, b);
      const small = Math.min(a, b);
      const answer = form === "somme" ? a + b : big - small;
      const carry = 10 ** (lengthOf(unit) - 1);
      return {
        prompt: form === "somme" ? `Calcule ${show(a)} + ${show(b)}.` : `Calcule ${show(big)} - ${show(small)}.`,
        answer: show(answer),
        // Les erreurs d'enfant : oublier la retenue, décaler les chiffres, additionner au lieu de soustraire.
        wrong: wrongBig(ctx, answer, form === "somme" ? [answer - carry, answer + carry, answer * 10, Math.floor(answer / 10)] : [big + small, answer + carry, answer - carry, answer * 10], 1, CAP_CM2),
        hints:
          form === "somme"
            ? ["Aligne les chiffres de même rang, les unités sous les unités.", "Additionne rang par rang, en partant de la droite.", "Quand un rang dépasse neuf, la retenue passe au rang d'à côté."]
            : ["Aligne les chiffres de même rang, les unités sous les unités.", "Soustrais rang par rang, en partant de la droite.", "Quand le chiffre du haut est trop petit, emprunte au rang d'à côté."],
      };
    }
    const power = pick(ctx.rng, [10, 100, 1000]);
    if (form === "produit") {
      const small = multiple(ctx, Math.max(1, unit / 1000), Math.ceil(lo / power / 100), Math.floor(top / power));
      const answer = small * power;
      return {
        prompt: `Combien font ${show(small)} × ${show(power)} ?`,
        answer: show(answer),
        wrong: wrongBig(ctx, answer, [answer * 10, Math.floor(answer / 10), small * (power / 10), small * power * 100, small + power], 1, CAP_CM2),
        hints: ["Multiplier par dix, cent ou mille décale les chiffres vers la gauche.", "Compte les zéros du nombre par lequel on multiplie.", "Ajoute autant de zéros à droite que ce nombre en a."],
      };
    }
    const answer = multiple(ctx, Math.max(1, unit / 1000), Math.ceil(lo / power / 100), Math.floor(top / power));
    const dividend = answer * power;
    return {
      prompt: `Combien font ${show(dividend)} ÷ ${show(power)} ?`,
      answer: show(answer),
      wrong: wrongBig(ctx, answer, [answer * 10, Math.floor(answer / 10), dividend / (power * 10), dividend / (power / 10)], 1, CAP_CM2),
      hints: ["Diviser par dix, cent ou mille décale les chiffres vers la droite.", "Compte les zéros du nombre par lequel on divise.", "Enlève autant de zéros à droite que ce nombre en a."],
    };
  });
}

// ===========================================================================
// RELIER, PLACER PAR RAPPORT À UN SEUIL
// ===========================================================================

/** « Relie chaque nombre à son écriture en lettres. » ou « Relie chaque calcul à son résultat. » : trois paires différentes. */
export function makeCm2GrnLinks(ctx: GameContext): GeneratedGame {
  return linkGame(ctx, "cm2-grn-relier", "relier un grand nombre à ses lettres ou un calcul à son résultat", () => {
    const { lo, top } = rangeOfCm2(ctx);
    const step = stepOf(ctx);
    if (step >= 3 && ctx.rng() < 0.4) {
      const powers = shuffle(ctx.rng, [10, 100, 1000]);
      const pairs = powers.map((power) => {
        const small = randomInt(ctx.rng, 2, 99) * 1000;
        return { left: `${show(small)} × ${show(power)}`, right: show(small * power) };
      });
      return {
        prompt: "Relie chaque calcul à son résultat.",
        pairs,
        hints: ["Compte les zéros du nombre par lequel on multiplie.", "Ajoute autant de zéros à droite du nombre.", "Commence par le calcul dont tu es le plus sûr."],
      };
    }
    const numbers = new Set<number>();
    while (numbers.size < 3) numbers.add(roundishBig(ctx, lo, top));
    return {
      prompt: "Relie chaque nombre à son écriture en lettres.",
      pairs: [...numbers].map((n) => ({ left: show(n), right: wordsOfCm2(n) })),
      hints: ["Compte les chiffres de chaque nombre.", "Repère les milliards, les millions et les milliers.", "Commence par le nombre dont tu es le plus sûr."],
    };
  });
}

/** Un seuil rond dans la plage : le multiple de la puissance de dix des plus grands chiffres. */
function thresholdOf(ctx: GameContext, lo: number): number {
  return randomInt(ctx.rng, 2, 8) * 10 ** (lengthOf(lo) - 1);
}

/** « Glisse chaque nombre dans la bonne case. » : deux nombres de chaque côté d'un seuil rond. */
export function makeCm2GrnThreshold(ctx: GameContext): GeneratedGame {
  return sortGame(ctx, "cm2-grn-glisser", "placer un grand nombre par rapport à un seuil", () => {
    const { lo, top } = rangeOfCm2(ctx);
    const cap = Math.min(top, 10 ** lengthOf(lo) - 1);
    const t = thresholdOf(ctx, lo);
    const below = new Set<number>();
    while (below.size < 2) below.add(randomInt(ctx.rng, lo, t - 1));
    const above = new Set<number>();
    while (above.size < 2) above.add(randomInt(ctx.rng, t + 1, cap));
    const zones: readonly [string, string] = [`Moins de ${show(t)}`, `${show(t)} ou plus`];
    return {
      prompt: "Glisse chaque nombre dans la bonne case.",
      zones,
      items: [...[...below].map((n) => ({ text: show(n), zone: zones[0] })), ...[...above].map((n) => ({ text: show(n), zone: zones[1] }))],
      hints: ["Compare chaque nombre au seuil écrit sur la case.", "Regarde d'abord le chiffre de gauche, puis le suivant.", "Un nombre plus petit que le seuil va dans la première case."],
    };
  });
}
