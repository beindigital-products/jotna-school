/**
 * LES NOMBRES DU CE1 : jusqu'à 1 000, puis jusqu'à 10 000 (`ma-ce1-nombres-1000`, `ma-ce1-nombres-10000`). Le voisin d'un nombre, comparer,
 * ranger, le chiffre et la valeur d'un rang, décomposer, encadrer, placer par rapport à un seuil, compléter une suite, les écrire en lettres
 * et les lire.
 *
 * Sur l'échantillon de CE1, les maths étaient la matière la moins fausse (12 %), mais le modèle écrivait des nombres au-delà de 1 000 sous
 * « Les nombres jusqu'à 1 000 », « mille deux cent trente quatre » sans trait d'union, « quatre cents » devant un autre mot. Et la suite de
 * nombres du site (`suite-nombres`) plafonne à 1 000 au CE1, même sous « Les nombres jusqu'à 10 000 ». Ici la réponse est CALCULÉE, jamais
 * écrite, et le mot d'un nombre vient d'UNE fonction, `wordsOf`, que le test recalcule avec sa propre table.
 *
 * LE PLAFOND vient du champ `vocabulary` de la fiche : « nombres-1000 » (de 100 à 1 000) ou « nombres-10000 » (de 1 000 à 10 000). Le plus
 * grand nombre d'un palier monte avec sa position : 300, 500, 800, 1 000 pour la première fiche ; 3 000, 5 000, 8 000, 10 000 pour la seconde.
 * Aucun nombre n'est écrit au-delà du plafond de la fiche, ni dans l'énoncé ni dans un choix.
 *
 * LES NOMBRES S'ÉCRIVENT comme à l'école : les milliers séparés par une espace (« 2 345 », `formatNumber`), et en lettres sans trait d'union
 * au-delà de cent : « trois cent quarante-cinq », « deux cents » (un s quand rien ne suit), « deux cent un », « mille deux cent trente-quatre »,
 * « deux mille » (mille ne prend jamais de s), « quatre-vingts » (un s quand rien ne suit), « soixante et onze », « vingt et un ». Une réponse
 * à écrire en chiffres accepte « 2345 » et « 2 345 » : la même réponse.
 *
 * Les mauvais choix sont des erreurs d'enfant : le nombre lui-même, une dizaine ou une centaine de plus ou de moins, les chiffres échangés, un
 * rang pour un autre. Aucun indice n'écrit un chiffre : un nombre se lirait dedans.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { fresh, originOf, pick, randomInt, shuffle, type GameContext, type GameLevel, type GeneratedGame } from "./shared";
import { choiceGame, firstLetter, gapGame, linkGame, sequenceGame, sortGame } from "./tableaux";
import { formatNumber } from "./patterns";
import { inWords } from "./nombresCp";

// ===========================================================================
// LE PLAFOND, LES RANGS ET LES MOTS
// ===========================================================================

export type NumberCapCe1 = 1000 | 10000;

/** « nombres-10000 » vaut 10 000, tout le reste 1 000. */
export const capOfCe1 = (vocabulary: string | undefined): NumberCapCe1 => (vocabulary === "nombres-10000" ? 10000 : 1000);

const LOW: Record<NumberCapCe1, number> = { 1000: 100, 10000: 1000 };
const TOP_BY_LEVEL: Record<NumberCapCe1, Record<GameLevel, number>> = {
  1000: { 1: 300, 2: 500, 3: 800, 4: 1000 },
  10000: { 1: 3000, 2: 5000, 3: 8000, 4: 10000 },
};

/** Le plafond de la fiche, le plus petit nombre servi et le plus grand de ce palier. */
export function rangeOfCe1(ctx: GameContext): { cap: NumberCapCe1; lo: number; top: number } {
  const cap = capOfCe1(ctx.vocabulary);
  return { cap, lo: LOW[cap], top: TOP_BY_LEVEL[cap][ctx.level] };
}

/** Le rang qui sert à comparer et à encadrer : la centaine sous 1 000, le millier sous 10 000. */
const blockOf = (cap: NumberCapCe1) => (cap === 1000 ? 100 : 1000);

const show = (n: number) => formatNumber(n);

const UNIT_WORDS = ["zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf"] as const;

/**
 * Un nombre de 0 à 10 000 en lettres, comme à l'école de France et du Sénégal. Au-dessus de cent, aucun trait d'union entre les mots ; « cent » et
 * « vingt » ne prennent un s que sans mot derrière (« deux cents », « quatre-vingts »), jamais devant « mille » ni un autre mot.
 */
export function wordsOf(n: number): string {
  if (n === 10000) return "dix mille";
  const parts: string[] = [];
  const thousands = Math.floor(n / 1000);
  const rest = n % 1000;
  if (thousands === 1) parts.push("mille");
  else if (thousands > 1) parts.push(`${UNIT_WORDS[thousands]} mille`);
  const hundreds = Math.floor(rest / 100);
  const under = rest % 100;
  if (hundreds === 1) parts.push("cent");
  else if (hundreds > 1) parts.push(`${UNIT_WORDS[hundreds]} cent${under === 0 ? "s" : ""}`);
  if (under > 0 || parts.length === 0) parts.push(inWords(under));
  return parts.join(" ");
}

/** Le chiffre d'un rang : 0 les unités, 1 les dizaines, 2 les centaines, 3 les milliers. */
const digitAt = (n: number, rank: number) => Math.floor(n / 10 ** rank) % 10;
const RANK_NAMES = ["unités", "dizaines", "centaines", "milliers"] as const;
const RANK_SINGULAR = ["unité", "dizaine", "centaine", "millier"] as const;
const plural = (n: number, rank: number) => `${n} ${n > 1 ? RANK_NAMES[rank] : RANK_SINGULAR[rank]}`;

/** Un nombre de `digits` chiffres, tous différents et aucun zéro : chaque chiffre a une seule place et une seule valeur. */
function plainNumber(ctx: GameContext, digits: number, lo: number, top: number): number {
  for (let attempt = 0; attempt < 500; attempt++) {
    const n = randomInt(ctx.rng, lo, top);
    const text = String(n);
    if (text.length === digits && !text.includes("0") && new Set(text).size === digits) return n;
  }
  return digits === 3 ? 345 : 2345;
}

/** Les deux mauvais choix d'un nombre : les `pool` d'abord (les erreurs d'enfant), les voisins ensuite. */
export function wrongNumbersCe1(ctx: GameContext, answer: number, pool: readonly number[], min: number, max: number): [string, string] {
  const fits = (n: number) => Number.isInteger(n) && n >= min && n <= max && n !== answer;
  const typical = shuffle(ctx.rng, Array.from(new Set(pool.filter(fits))));
  const near = shuffle(
    ctx.rng,
    Array.from(new Set([answer - 1, answer + 1, answer - 10, answer + 10, answer - 100, answer + 100, answer - 1000, answer + 1000].filter(fits))).filter((n) => !typical.includes(n)),
  );
  const out = [...typical, ...near].slice(0, 2);
  for (let n = min; out.length < 2 && n <= max; n++) if (fits(n) && !out.includes(n)) out.push(n);
  return [show(out[0]), show(out[1])];
}

/** `count` nombres différents de [lo, top], dont deux du même rang (même centaine, ou même millier) quand `shareBlock` : la comparaison devient moins évidente. */
function distinctNumbers(ctx: GameContext, count: number, lo: number, top: number, shareBlock: boolean, block: number): number[] {
  for (let attempt = 0; attempt < 80; attempt++) {
    const out: number[] = [];
    if (shareBlock) {
      const start = randomInt(ctx.rng, Math.floor(lo / block), Math.floor(top / block));
      const same = Array.from({ length: block }, (_, i) => start * block + i).filter((n) => n >= lo && n <= top);
      if (same.length < 2) continue;
      out.push(...shuffle(ctx.rng, same).slice(0, 2));
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

/** « Quel nombre vient juste après 399 ? » : dès le deuxième palier, souvent un nombre qui change de dizaine ou de centaine. */
export function makeCe1NbNeighbour(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce1-nb-voisin", "le nombre qui vient juste avant ou juste après", () => {
    const { lo, top } = rangeOfCe1(ctx);
    const after = ctx.rng() < 0.5;
    const tricky = ctx.level >= 2 && ctx.rng() < (ctx.level === 2 ? 0.4 : 0.65);
    const step = ctx.level === 2 ? 10 : 100;
    let n: number;
    if (tricky) {
      // Un nombre qui finit par 9 (ou 99) a un suivant qui change de dizaine (ou de centaine) ; un multiple a un précédent qui finit par 9.
      const multiple = step * randomInt(ctx.rng, Math.ceil((lo + 1) / step), Math.floor(top / step));
      n = after ? multiple - 1 : multiple;
    } else {
      n = after ? randomInt(ctx.rng, lo, top - 1) : randomInt(ctx.rng, lo + 1, top);
    }
    const answer = after ? n + 1 : n - 1;
    return {
      prompt: `Quel nombre vient juste ${after ? "après" : "avant"} ${show(n)} ?`,
      answer: show(answer),
      wrong: wrongNumbersCe1(ctx, answer, [n, after ? answer + 10 : answer - 10, after ? answer - 100 : answer + 100, after ? answer + 100 : answer - 100], lo - 1, top),
      hints: [
        "Dis les nombres en comptant, depuis le début.",
        after ? "Le nombre d'après est un de plus." : "Le nombre d'avant est un de moins.",
        "Fais attention quand un chiffre arrive au bout : la dizaine ou la centaine change.",
      ],
    };
  });
}

/** « Quel est le plus grand de ces nombres ? » : trois nombres différents, dont deux de la même centaine (ou du même millier) dès le deuxième palier. */
export function makeCe1NbCompare(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce1-nb-comparer", "comparer des nombres", () => {
    const { cap, lo, top } = rangeOfCe1(ctx);
    const numbers = distinctNumbers(ctx, 3, lo, top, ctx.level >= 2, blockOf(cap));
    const biggest = ctx.rng() < 0.6;
    const answer = biggest ? Math.max(...numbers) : Math.min(...numbers);
    const rank = cap === 1000 ? "centaines" : "milliers";
    return {
      prompt: `Quel est le ${biggest ? "plus grand" : "plus petit"} de ces nombres ?`,
      answer: show(answer),
      wrong: numbers.filter((n) => n !== answer).map(show),
      hints: [
        `Regarde d'abord le chiffre des ${rank} de chaque nombre.`,
        "Si ce chiffre est le même, regarde le chiffre d'après.",
        biggest ? "Le plus grand est celui qui a le plus fort chiffre au rang le plus à gauche." : "Le plus petit est celui qui a le plus faible chiffre au rang le plus à gauche.",
      ],
    };
  });
}

/** « Mets ces nombres dans l'ordre, du plus petit au plus grand. » : quatre nombres différents. */
export function makeCe1NbOrder(ctx: GameContext): GeneratedGame {
  return sequenceGame(ctx, "ce1-nb-ordre", "ranger des nombres", () => {
    const { cap, lo, top } = rangeOfCe1(ctx);
    const numbers = distinctNumbers(ctx, 4, lo, top, ctx.level >= 2, blockOf(cap));
    const ascending = ctx.level < 3 || ctx.rng() < 0.6;
    return {
      prompt: ascending ? "Mets ces nombres dans l'ordre, du plus petit au plus grand." : "Mets ces nombres dans l'ordre, du plus grand au plus petit.",
      sequence: numbers.sort((a, b) => (ascending ? a - b : b - a)).map(show),
      hints: [
        "Regarde d'abord le chiffre de gauche de chaque nombre.",
        ascending ? "Le plus petit nombre est celui dont le chiffre de gauche est le plus faible : mets-le au début." : "Le plus grand nombre est celui dont le chiffre de gauche est le plus fort : mets-le au début.",
        "Si deux nombres ont le même chiffre de gauche, regarde le chiffre d'après.",
      ],
    };
  });
}

// ===========================================================================
// LE CHIFFRE ET LA VALEUR D'UN RANG, DÉCOMPOSER, ENCADRER
// ===========================================================================

/** « Quel est le chiffre des dizaines de 345 ? » ou « Dans 345, quelle est la valeur du chiffre 4 ? » (dès le deuxième palier). */
export function makeCe1NbDigits(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce1-nb-chiffres", "le chiffre et la valeur d'un rang", () => {
    const { cap, lo, top } = rangeOfCe1(ctx);
    const digits = cap === 1000 ? 3 : 4;
    const n = plainNumber(ctx, digits, lo, Math.min(top, cap - 1));
    const rank = randomInt(ctx.rng, 0, digits - 1);
    const digit = digitAt(n, rank);
    if (ctx.level === 1 || ctx.rng() < 0.5) {
      const others = String(n).split("").map(Number).filter((d) => d !== digit);
      return {
        prompt: `Quel est le chiffre des ${RANK_NAMES[rank]} de ${show(n)} ?`,
        answer: String(digit),
        wrong: shuffle(ctx.rng, [...others, ...Array.from({ length: 9 }, (_, i) => i + 1).filter((d) => d !== digit && !others.includes(d))]).map(String),
        hints: [
          "Les unités sont le chiffre tout à droite.",
          "Va vers la gauche : les dizaines, puis les centaines, puis les milliers.",
          "Compte les rangs depuis la droite, en partant des unités.",
        ],
      };
    }
    const value = digit * 10 ** rank;
    return {
      prompt: `Dans ${show(n)}, quelle est la valeur du chiffre ${digit} ?`,
      answer: show(value),
      wrong: wrongNumbersCe1(ctx, value, [digit, digit * 10 ** (rank + 1), rank > 0 ? digit * 10 ** (rank - 1) : -1, digit * 10 ** ((rank + 2) % digits)], 1, cap - 1),
      hints: [
        "Le chiffre vaut plus ou moins selon sa place dans le nombre.",
        "Cherche son rang : unités, dizaines, centaines ou milliers.",
        "Ajoute autant de zéros que le chiffre a de rangs à sa droite.",
      ],
    };
  });
}

/** Trois à quatre façons de décomposer, du plus simple au plus fin : le palier choisit la sienne. */
export function makeCe1NbDecompose(ctx: GameContext): GeneratedGame {
  return gapGame(ctx, "ce1-nb-decomposer", "décomposer un nombre", () => {
    const { cap, lo, top } = rangeOfCe1(ctx);
    const digits = cap === 1000 ? 3 : 4;
    const n = plainNumber(ctx, digits, lo, Math.min(top, cap - 1));
    const parts = Array.from({ length: digits }, (_, i) => digitAt(n, digits - 1 - i) * 10 ** (digits - 1 - i));
    const swapped = Number(String(n).split("").reverse().join(""));
    const forms = ctx.level === 1 ? [1, 3] : ctx.level === 2 ? [0, 1, 3] : ctx.level === 3 ? [0, 2, 3] : [0, 1, 2, 3];
    const form = pick(ctx.rng, forms);
    const near = [swapped, n + 10, n - 10, n + 100, n - 100];
    if (form === 0) {
      // Un rang manque : les unités sauf au dernier palier, où n'importe lequel sauf le premier peut manquer.
      const missing = ctx.level >= 4 ? randomInt(ctx.rng, 1, digits - 1) : digits - 1;
      const text = `${show(n)} = ${parts.map((part, i) => (i === missing ? "___" : show(part))).join(" + ")}`;
      const value = parts[missing];
      const digit = digitAt(n, digits - 1 - missing);
      const rank = digits - 1 - missing;
      return {
        prompt: "Complète avec le bon nombre.",
        text,
        answer: show(value),
        wrong: wrongNumbersCe1(ctx, value, [digit, digit * 10 ** (rank + 1), rank > 0 ? digit * 10 ** (rank - 1) : -1], 1, cap - 1),
        hints: ["Les autres parties sont déjà écrites.", "Cherche le chiffre du rang qui manque.", "Ajoute autant de zéros que le chiffre a de rangs à sa droite."],
      };
    }
    if (form === 1) {
      const said = Array.from({ length: digits }, (_, i) => plural(digitAt(n, digits - 1 - i), digits - 1 - i));
      const text = `${said.slice(0, -1).join(", ")} et ${said[said.length - 1]}, c'est le nombre ___.`;
      return {
        prompt: "Complète avec le bon nombre.",
        text,
        answer: show(n),
        wrong: wrongNumbersCe1(ctx, n, near, lo, cap),
        hints: ["Chaque rang donne un chiffre.", "Écris d'abord le chiffre des plus grands rangs, à gauche.", "Les unités se mettent tout à droite."],
      };
    }
    if (form === 2) {
      // Chaque rang s'écrit « chiffre × valeur du rang » (« 2 × 1 000 »), sauf les unités, dont le chiffre s'écrit seul.
      const terms = parts.map((_, i) => (i === digits - 1 ? String(digitAt(n, 0)) : `${digitAt(n, digits - 1 - i)} × ${show(10 ** (digits - 1 - i))}`));
      const text = `${terms.join(" + ")} = ___`;
      return {
        prompt: "Complète avec le bon nombre.",
        text,
        answer: show(n),
        wrong: wrongNumbersCe1(ctx, n, near, lo, cap),
        hints: ["Un chiffre multiplié par un rang donne sa valeur.", "Additionne les valeurs, des plus grandes aux plus petites.", "Chaque valeur se place à son rang dans le nombre."],
      };
    }
    return {
      prompt: "Complète avec le bon nombre.",
      text: `${parts.map(show).join(" + ")} = ___`,
      answer: show(n),
      wrong: wrongNumbersCe1(ctx, n, near, lo, cap),
      hints: ["Les parties sont déjà des valeurs de rang.", "Écris chaque chiffre à sa place, de gauche à droite.", "Les unités se mettent tout à droite."],
    };
  });
}

/** « Entre quelles centaines se trouve 345 ? » (« Entre quels milliers… » au masculin) : les dizaines sous 1 000 au premier palier, les centaines ensuite ; les centaines, puis les milliers sous 10 000. */
export function makeCe1NbBracket(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce1-nb-encadrer", "encadrer un nombre", () => {
    const { cap, lo, top } = rangeOfCe1(ctx);
    const unit = cap === 1000 ? (ctx.level === 1 ? 10 : 100) : ctx.level <= 2 ? 100 : 1000;
    const name = unit === 10 ? "dizaines" : unit === 100 ? "centaines" : "milliers";
    // « milliers » est masculin : « quels milliers », mais « quelles dizaines » et « quelles centaines ».
    const which = unit === 1000 ? "quels" : "quelles";
    // Les indices s'accordent de même : « le millier … le plus petit », mais « la centaine … la plus petite ».
    const masculine = unit === 1000;
    // Un nombre qui n'est pas un multiple du rang, dans la plage du palier : le décaler d'un multiple dépasserait parfois le plafond du palier.
    let n = randomInt(ctx.rng, lo, Math.min(top, cap - 1));
    for (let attempt = 0; attempt < 50 && n % unit === 0; attempt++) n = randomInt(ctx.rng, lo, Math.min(top, cap - 1));
    if (n % unit === 0) n += 1;
    const below = Math.floor(n / unit) * unit;
    const label = (low: number) => `${show(low)} et ${show(low + unit)}`;
    const wrong = [below - unit, below + unit].filter((low) => low >= 0 && low + unit <= cap);
    if (wrong.length < 2) wrong.push(below + 2 * unit <= cap - unit ? below + 2 * unit : below - 2 * unit);
    return {
      prompt: `Entre ${which} ${name} se trouve ${show(n)} ?`,
      answer: label(below),
      wrong: wrong.slice(0, 2).map(label),
      hints: [
        `Cherche ${masculine ? "le" : "la"} ${unit === 10 ? "dizaine" : unit === 100 ? "centaine" : "millier"} juste en dessous du nombre.`,
        masculine ? "Le nombre est plus grand que le plus petit et plus petit que le plus grand." : "Le nombre est plus grand que la plus petite et plus petit que la plus grande.",
        "Garde les chiffres de gauche, mets des zéros derrière.",
      ],
    };
  });
}

// ===========================================================================
// SE SITUER, COMPLÉTER UNE SUITE
// ===========================================================================

/** « Glisse chaque nombre dans la bonne case. » : moins de 500 ou plus de 500. Le seuil n'est jamais un des nombres. */
export function makeCe1NbSortThreshold(ctx: GameContext): GeneratedGame {
  return sortGame(ctx, "ce1-nb-glisser", "placer des nombres par rapport à un seuil", () => {
    const { cap, lo, top } = rangeOfCe1(ctx);
    const block = blockOf(cap);
    const each = ctx.level === 1 ? 2 : 3;
    const thresholds: number[] = [];
    for (let t = Math.ceil((lo + 1) / block) * block; t < top; t += block) if (t - lo >= each && top - t >= each) thresholds.push(t);
    const threshold = pick(ctx.rng, thresholds);
    const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);
    const below = shuffle(ctx.rng, range(lo, threshold - 1)).slice(0, each);
    const above = shuffle(ctx.rng, range(threshold + 1, top)).slice(0, each);
    const lowZone = `Moins de ${show(threshold)}`;
    const highZone = `Plus de ${show(threshold)}`;
    return {
      prompt: "Glisse chaque nombre dans la bonne case.",
      zones: [lowZone, highZone],
      items: [...below.map((n) => ({ text: show(n), zone: lowZone })), ...above.map((n) => ({ text: show(n), zone: highZone }))],
      hints: ["Lis les nombres un par un.", "Compare chaque nombre au nombre de la case.", "Regarde d'abord le chiffre de gauche."],
    };
  });
}

/** Les pas d'une suite, par fiche et par palier : des pas qu'on compte de tête, du plus facile au plus fin. */
const SUITE_STEPS: Record<NumberCapCe1, Record<GameLevel, readonly number[]>> = {
  1000: { 1: [10], 2: [10, 100], 3: [50, 100], 4: [20, 25, 50, 100] },
  10000: { 1: [100], 2: [100, 1000], 3: [500, 1000], 4: [200, 250, 500, 1000] },
};

/** « Complète la suite : 320, 330, 340, ___ » : un seul pas, un seul nombre qui manque. Dès le troisième palier, le nombre qui manque est au milieu. */
export function makeCe1NbSuite(ctx: GameContext): GeneratedGame {
  return gapGame(ctx, "ce1-nb-suite", "compléter une suite de nombres", () => {
    const { cap, lo, top } = rangeOfCe1(ctx);
    const step = pick(ctx.rng, SUITE_STEPS[cap][ctx.level]);
    const length = 5;
    const span = (length - 1) * step;
    const descending = ctx.level >= 2 && ctx.rng() < 0.4;
    // Le premier terme est un multiple du pas : « 320, 330, 340 » se lit mieux que « 327, 337, 347 ».
    const first = Math.ceil(lo / step);
    const last = Math.floor(top / step);
    const startK = randomInt(ctx.rng, first + (descending ? length - 1 : 0), last - (descending ? 0 : length - 1));
    const start = startK * step;
    const values = Array.from({ length }, (_, i) => (descending ? start - i * step : start + i * step));
    const blank = ctx.level >= 3 ? randomInt(ctx.rng, 1, length - 2) : length - 1;
    const answer = values[blank];
    const text = values.map((value, i) => (i === blank ? "___" : show(value))).join(", ");
    return {
      prompt: descending ? "Complète la suite de nombres. Elle descend toujours du même pas." : "Complète la suite de nombres. Elle avance toujours du même pas.",
      text,
      answer: show(answer),
      wrong: wrongNumbersCe1(ctx, answer, [answer + step, answer - step, answer + 1, answer - 1, answer + 2 * step, answer + (span > step ? 10 : 1)], Math.max(0, lo - span), cap),
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
    n >= 1000
      ? "Mille ne prend jamais de s, et les milliers se disent avant les centaines."
      : n % 100 === 0
        ? "Les centaines se disent d'abord, puis le mot cent."
        : n % 100 >= 80
          ? "Quatre-vingt veut dire quatre fois vingt."
          : n % 100 >= 70
            ? "Soixante-dix veut dire soixante plus dix."
            : "Le premier mot dit les centaines, le suivant les dizaines, le dernier les unités.";
  return ["Dis le nombre à voix haute, doucement.", "Cherche d'abord les plus grands rangs, puis les plus petits.", family];
}

/** « Quel nombre s'écrit « trois cent quarante-cinq » ? » */
export function makeCe1NbWords(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce1-nb-lettres", "lire un nombre écrit en lettres", () => {
    const { cap, lo, top } = rangeOfCe1(ctx);
    const n = randomInt(ctx.rng, lo, Math.min(top, cap - 1));
    const swapped = Number(String(n).split("").reverse().join(""));
    return {
      prompt: `Quel nombre s'écrit « ${wordsOf(n)} » ?`,
      answer: show(n),
      wrong: wrongNumbersCe1(ctx, n, [n - 10, n + 10, n - 100, n + 100, swapped, n + 1], lo, cap),
      hints: wordHints(n),
    };
  });
}

/** « Relie chaque nombre à son écriture en lettres. » : trois ou quatre nombres différents. */
export function makeCe1NbWordLinks(ctx: GameContext): GeneratedGame {
  return linkGame(ctx, "ce1-nb-relier", "relier un nombre et son écriture en lettres", () => {
    const { cap, lo, top } = rangeOfCe1(ctx);
    const count = ctx.level >= 3 ? 4 : 3;
    const numbers = distinctNumbers(ctx, count, lo, Math.min(top, cap - 1), false, blockOf(cap)).sort((a, b) => a - b);
    return {
      prompt: "Relie chaque nombre à son écriture en lettres.",
      pairs: numbers.map((n) => ({ left: show(n), right: wordsOf(n) })),
      hints: ["Lis les mots un par un, à voix haute.", "Cherche d'abord les plus grands rangs.", "Commence par le nombre dont tu es certain."],
    };
  });
}

/** « Écris en chiffres le nombre « trois cent quarante-cinq ». » : une réponse courte (« 2345 » vaut « 2 345 »). */
export function makeCe1NbWriteNumber(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "ce1-nb-ecrire", () => {
    const { cap, lo, top } = rangeOfCe1(ctx);
    const n = randomInt(ctx.rng, lo, Math.min(top, cap - 1));
    const words = wordsOf(n);
    return {
      type: "short-answer",
      prompt: `Écris en chiffres le nombre « ${words} ».`,
      payload: { acceptedAnswers: [String(n)], game: originOf("ce1-nb-ecrire", ctx), concept: "écrire en chiffres un nombre dit en lettres" },
      answerKey: String(n),
      hints: [
        "Dis le nombre à voix haute, doucement.",
        n >= 1000 ? "Ce nombre s'écrit avec quatre chiffres." : "Ce nombre s'écrit avec trois chiffres.",
        `Le premier mot commence par la lettre ${firstLetter(words)}.`,
      ],
    };
  });
}
