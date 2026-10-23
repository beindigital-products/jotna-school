/**
 * LES FRACTIONS DU CM1 (`ma-cm1-fractions`) : lire et écrire une fraction, une part d'un tout, comparer à 1, comparer et ranger, des fractions égales,
 * les dixièmes et les centièmes (les fractions décimales).
 *
 * Sur l'échantillon, le modèle écrivait « trois huit » pour 3/8, comparait 3/4 et 3/8 en disant que 3/8 est la plus grande (« le nombre du bas est plus grand »),
 * et proposait « 2/4 » et « 1/2 » dans un QCM qui n'attendait qu'une réponse. Ici la réponse est CALCULÉE par produit en croix, jamais écrite, et la lecture d'une
 * fraction vient d'UNE fonction, `readFraction`, que le test recalcule avec sa propre table.
 *
 * - LES CINQ PALIERS (`stepOf`) : les demis, les tiers, les quarts et les cinquièmes ; jusqu'aux dixièmes ; jusqu'aux dixièmes avec des fractions plus grandes
 *   que 1 ; jusqu'aux douzièmes et aux centièmes ; les douzièmes et les centièmes, des fractions de dénominateurs différents.
 * - LA LECTURE : « un demi », « un tiers », « un quart », puis « cinquième », « sixième »… ; le nom des parts prend un s quand le nombre du haut dépasse un
 *   (« trois huitièmes », mais « deux tiers » : tiers ne change pas). Un demi ne se lit qu'avec un en haut : « deux demis » n'est jamais écrit.
 * - COMPARER : toujours par produit en croix (a/b contre c/d : a × d contre c × b), jamais par la valeur décimale. Deux fractions de même valeur (1/2 et 2/4) ne sont
 *   jamais proposées ensemble dans une question qui attend une seule réponse.
 * - Une fraction s'écrit avec une barre oblique, sans espace : « 3/8 ». Les énoncés n'ont aucun « : », au plus une apostrophe droite, vingt-huit mots au plus.
 *   Aucun indice n'écrit un chiffre : un résultat se lirait dedans. Les cases d'un glissé s'appellent « Plus petite que 1 » et « Plus grande que 1 » : leurs indices
 *   n'emploient ni « plus », ni « petite », ni « grande ».
 *
 * MODULE PUR (voir `types.ts`).
 */
import { fresh, originOf, pick, randomInt, shuffle, type GameContext, type GeneratedGame } from "./shared";
import { choiceGame, gapGame, linkGame, sequenceGame, sortGame } from "./tableaux";
import { inWords } from "./nombresCp";
import { show, stepOf, wrongNumbers, type Step } from "./cm1MathsOutils";

export type Fraction = { n: number; d: number };

/** « 3/8 » : une fraction comme elle s'écrit sur une tuile. */
const text = (f: Fraction) => `${f.n}/${f.d}`;
/** a/b contre c/d par le produit en croix : négatif si a/b est plus petite, nul si elles sont égales. */
const compare = (a: Fraction, b: Fraction) => a.n * b.d - b.n * a.d;
const allDifferent = (list: readonly Fraction[]) => list.every((a, i) => list.every((b, j) => i === j || compare(a, b) !== 0));
const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

// ===========================================================================
// LIRE ET ÉCRIRE UNE FRACTION
// ===========================================================================

/** Le nom des parts : un demi, un tiers, un quart, puis les ordinaux. */
const DENOMINATOR_WORDS: Record<number, string> = {
  2: "demi",
  3: "tiers",
  4: "quart",
  5: "cinquième",
  6: "sixième",
  7: "septième",
  8: "huitième",
  9: "neuvième",
  10: "dixième",
  11: "onzième",
  12: "douzième",
  100: "centième",
};
/** Les ordinaux d'un nombre du haut, pour l'erreur d'enfant qui lit les deux nombres à l'envers. */
const ORDINAL_WORDS: Record<number, string> = { 2: "deuxième", 3: "troisième", 4: "quatrième", 5: "cinquième", 6: "sixième", 7: "septième", 8: "huitième", 9: "neuvième", 10: "dixième", 11: "onzième", 12: "douzième" };

/** « trois huitièmes », « deux tiers », « un demi » : le nom des parts prend un s quand le haut dépasse un, sauf tiers. */
export function readFraction(n: number, d: number): string {
  return `${inWords(n)} ${DENOMINATOR_WORDS[d]}${n > 1 && d !== 3 ? "s" : ""}`;
}

/** Les dénominateurs qu'on lit ou qu'on écrit, par palier. */
const READ_DENOMINATORS: Record<Step, readonly number[]> = {
  1: [2, 3, 4, 5],
  2: [4, 5, 6, 8, 10],
  3: [3, 4, 5, 6, 7, 8, 9, 10],
  4: [6, 7, 8, 9, 10, 11, 12, 100],
  5: [7, 8, 9, 10, 11, 12, 100],
};

/** Une fraction à lire, plus petite que 1, qu'aucun exercice du palier n'a déjà posée. Un demi n'a que un en haut. */
export function drawReadable(ctx: GameContext): Fraction {
  const denominators = READ_DENOMINATORS[stepOf(ctx)];
  let found: Fraction = { n: 1, d: 2 };
  for (let attempt = 0; attempt < 40; attempt++) {
    const d = pick(ctx.rng, denominators);
    const n = d === 2 ? 1 : d === 100 ? randomInt(ctx.rng, 1, 99) : randomInt(ctx.rng, 1, d - 1);
    found = { n, d };
    if (!ctx.used.has(`cm1-frc:fait:${text(found)}`)) break;
  }
  ctx.used.add(`cm1-frc:fait:${text(found)}`);
  return found;
}

/** Les mauvaises lectures de n/d : les deux nombres à l'envers, un autre nom de parts, un autre nombre du haut. */
function wrongReadings(n: number, d: number): string[] {
  const out: string[] = [];
  if (n >= 2 && n <= 12 && d <= 12) out.push(`${inWords(d)} ${ORDINAL_WORDS[n]}s`);
  for (const other of [d - 1, d + 1, d === 100 ? 10 : d * 2]) {
    if (other in DENOMINATOR_WORDS && other !== d && !(other === 2 && n > 1)) out.push(readFraction(n, other));
  }
  const step = d === 100 ? 10 : 1;
  for (const other of [n - step, n + step]) if (other >= 1 && other < d && d !== 2) out.push(readFraction(other, d));
  return out;
}

/** « Lis la fraction 3/8. Comment se dit-elle ? » : trois huitièmes. (« Lis » : en CI, l'écran ne met aucune image sur des tuiles qu'il faut lire.) */
export function makeCm1FrcRead(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "cm1-frc-lire", "lire une fraction", () => {
    const { n, d } = drawReadable(ctx);
    const answer = readFraction(n, d);
    const wrong = [...new Set(wrongReadings(n, d))].filter((option) => option !== answer);
    return {
      prompt: `Lis la fraction ${n}/${d}. Comment se dit-elle ?`,
      answer,
      wrong: shuffle(ctx.rng, wrong),
      hints: ["Le nombre du haut se dit comme un nombre ordinaire.", "Le nombre du bas donne le nom des parts.", "Quand le nombre du haut dépasse un, le nom des parts prend un s."],
    };
  });
}

/** « Écris la fraction « sept huitièmes ». » : une réponse courte, « 7/8 ». */
export function makeCm1FrcWrite(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "cm1-frc-ecrire", () => {
    const { n, d } = drawReadable(ctx);
    return {
      type: "short-answer",
      prompt: `Écris la fraction « ${readFraction(n, d)} ».`,
      payload: { acceptedAnswers: [`${n}/${d}`], game: originOf("cm1-frc-ecrire", ctx), concept: "écrire une fraction dite en lettres" },
      answerKey: `${n}/${d}`,
      hints: ["Le nombre du haut se dit en premier.", "Le nombre du bas donne le nombre de parts du tout.", "Écris le nombre du haut, une barre oblique, puis le nombre du bas."],
    };
  });
}

/** « Relie chaque fraction à sa lecture. » : trois fractions, toutes les lectures différentes. */
export function makeCm1FrcLinks(ctx: GameContext): GeneratedGame {
  return linkGame(ctx, "cm1-frc-relier", "relier une fraction et sa lecture", () => {
    const chosen: Fraction[] = [];
    for (let attempt = 0; attempt < 60 && chosen.length < 3; attempt++) {
      const fraction = drawReadable(ctx);
      if (chosen.some((other) => text(other) === text(fraction) || readFraction(other.n, other.d) === readFraction(fraction.n, fraction.d))) continue;
      chosen.push(fraction);
    }
    return {
      prompt: "Relie chaque fraction à sa lecture.",
      pairs: chosen.map((fraction) => ({ left: text(fraction), right: readFraction(fraction.n, fraction.d) })),
      hints: ["Lis d'abord le nombre du haut.", "Le nom des parts vient du nombre du bas.", "Chaque lecture va avec une seule fraction."],
    };
  });
}

// ===========================================================================
// UNE PART D'UN TOUT
// ===========================================================================

const SHAPES: readonly { name: string; feminine: boolean }[] = [
  { name: "Un gâteau", feminine: false },
  { name: "Une tablette de chocolat", feminine: true },
  { name: "Une pizza", feminine: true },
  { name: "Un pain", feminine: false },
];

const PART_DENOMINATORS: Record<Step, readonly number[]> = { 1: [4, 6, 8], 2: [4, 5, 6, 8, 10], 3: [3, 4, 5, 6, 7, 8, 9, 10], 4: [6, 7, 8, 9, 10, 11, 12], 5: [8, 9, 10, 11, 12] };

/** « Un gâteau est coupé en 8 parts égales. On en mange 3. Quelle fraction a-t-on mangée ? » (ou « Quelle fraction reste-t-il ? » dès le deuxième palier). */
export function makeCm1FrcPart(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "cm1-frc-part", "écrire la fraction d'un tout", () => {
    const step = stepOf(ctx);
    const shape = pick(ctx.rng, SHAPES);
    const d = pick(ctx.rng, PART_DENOMINATORS[step]);
    // Le nombre de parts mangées n'est jamais la moitié : « mangé » et « reste » auraient la même fraction.
    let n = randomInt(ctx.rng, 1, d - 1);
    while (n * 2 === d) n = randomInt(ctx.rng, 1, d - 1);
    const rest = step >= 2 && ctx.rng() < 0.5;
    const cut = `${shape.name} est coupé${shape.feminine ? "e" : ""} en ${d} parts égales. On en mange ${n}.`;
    if (rest) {
      return {
        prompt: `${cut} Quelle fraction reste-t-il ?`,
        answer: `${d - n}/${d}`,
        wrong: shuffle(ctx.rng, [`${n}/${d}`, `${d}/${d - n}`, `${d - n}/${n}`, `${n}/${d - n}`].filter((option) => !option.endsWith("/1"))),
        hints: ["Compte d'abord les parts qui restent.", "Le nombre de parts du tout ne change pas : c'est le nombre du bas.", "Écris les parts qui restent au-dessus du nombre de parts du tout."],
      };
    }
    return {
      prompt: `${cut} Quelle fraction a-t-on mangée ?`,
      answer: `${n}/${d}`,
      wrong: shuffle(ctx.rng, [`${d}/${n}`, `${d - n}/${d}`, `${n}/${d - n}`, `${n}/${d + 1}`].filter((option) => !option.endsWith("/1"))),
      hints: ["Compte le nombre de parts égales du tout : c'est le nombre du bas.", "Compte les parts mangées : c'est le nombre du haut.", "Écris les parts mangées au-dessus du nombre de parts du tout."],
    };
  });
}

// ===========================================================================
// COMPARER, RANGER, SE SITUER PAR RAPPORT À 1
// ===========================================================================

/** Les dénominateurs des fractions à comparer, par palier. */
const COMPARE_DENOMINATORS: Record<Step, readonly number[]> = { 1: [3, 4, 5, 6], 2: [3, 4, 5, 6, 7, 8], 3: [4, 5, 6, 7, 8, 9, 10], 4: [5, 6, 7, 8, 9, 10, 11, 12], 5: [6, 7, 8, 9, 10, 11, 12] };

/** `count` fractions de valeurs différentes : même dénominateur, même numérateur, dénominateurs multiples l'un de l'autre, ou dénominateurs quelconques, selon le palier. */
function comparableFractions(ctx: GameContext, count: number): Fraction[] {
  const step = stepOf(ctx);
  for (let attempt = 0; attempt < 200; attempt++) {
    const style = step === 1 ? "denominator" : step === 2 ? "numerator" : pick(ctx.rng, step === 3 ? ["denominator", "numerator", "multiples"] : ["multiples", "numerator", "any"]);
    let list: Fraction[];
    if (style === "denominator") {
      const d = pick(ctx.rng, COMPARE_DENOMINATORS[step]);
      list = shuffle(ctx.rng, range(1, d - 1)).slice(0, count).map((n) => ({ n, d }));
    } else if (style === "numerator") {
      const n = randomInt(ctx.rng, 1, 3);
      list = shuffle(ctx.rng, COMPARE_DENOMINATORS[step].filter((d) => d > n)).slice(0, count).map((d) => ({ n, d }));
    } else if (style === "multiples") {
      const family = pick(ctx.rng, [[2, 4, 8], [2, 3, 6, 12], [2, 5, 10], [3, 6, 12]]);
      list = Array.from({ length: count }, () => {
        const d = pick(ctx.rng, family);
        return { n: randomInt(ctx.rng, 1, d - 1), d };
      });
    } else {
      list = Array.from({ length: count }, () => {
        const d = pick(ctx.rng, COMPARE_DENOMINATORS[step]);
        return { n: randomInt(ctx.rng, 1, d - 1), d };
      });
    }
    if (list.length === count && allDifferent(list) && new Set(list.map(text)).size === count) return list;
  }
  return Array.from({ length: count }, (_, i) => ({ n: i + 1, d: count + 1 }));
}

/** « Quelle est la plus grande de ces fractions ? » : trois fractions de valeurs différentes. */
export function makeCm1FrcCompare(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "cm1-frc-comparer", "comparer des fractions", () => {
    const list = comparableFractions(ctx, 3);
    const biggest = ctx.rng() < 0.6;
    const sorted = [...list].sort(compare);
    const answer = biggest ? sorted[2] : sorted[0];
    return {
      prompt: `Quelle est la ${biggest ? "plus grande" : "plus petite"} de ces fractions ?`,
      answer: text(answer),
      wrong: list.filter((f) => text(f) !== text(answer)).map(text),
      hints: [
        "Regarde d'abord si les fractions ont le même nombre du bas ou le même nombre du haut.",
        "Même nombre du bas : la plus grande a le plus de parts en haut. Même nombre du haut : des parts plus petites donnent une fraction plus petite.",
        "Sinon, mets les fractions sur le même nombre du bas.",
      ],
    };
  });
}

/** « Range ces fractions de la plus petite à la plus grande. » : quatre fractions de valeurs différentes. */
export function makeCm1FrcOrder(ctx: GameContext): GeneratedGame {
  return sequenceGame(ctx, "cm1-frc-ordre", "ranger des fractions", () => {
    const list = comparableFractions(ctx, 4);
    const ascending = stepOf(ctx) < 3 || ctx.rng() < 0.6;
    const sorted = [...list].sort((a, b) => (ascending ? compare(a, b) : compare(b, a)));
    return {
      prompt: ascending ? "Range ces fractions de la plus petite à la plus grande." : "Range ces fractions de la plus grande à la plus petite.",
      sequence: sorted.map(text),
      hints: [
        "Regarde d'abord si les fractions ont le même nombre du bas ou le même nombre du haut.",
        "Mets les fractions sur le même nombre du bas pour les comparer.",
        "Compare les nombres du haut, puis range les fractions.",
      ],
    };
  });
}

type Position = "petite" | "egale" | "grande";
const POSITIONS: readonly Position[] = ["petite", "egale", "grande"];
/** Trois fractions toujours valables, si le tirage n'en trouve pas trois différentes : la bonne, puis deux autres. */
const ONE_FALLBACK: Record<Position, readonly Fraction[]> = {
  petite: [{ n: 1, d: 4 }, { n: 4, d: 4 }, { n: 5, d: 4 }],
  egale: [{ n: 3, d: 3 }, { n: 1, d: 3 }, { n: 4, d: 3 }],
  grande: [{ n: 5, d: 4 }, { n: 1, d: 4 }, { n: 4, d: 4 }],
};

/** « Quelle fraction est plus petite que 1 ? », « égale à 1 », « plus grande que 1 » : une seule des trois fractions répond. */
export function makeCm1FrcOne(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "cm1-frc-un", "comparer une fraction à un tout", () => {
    const denominators = COMPARE_DENOMINATORS[stepOf(ctx)];
    const target = pick(ctx.rng, POSITIONS);
    const others = POSITIONS.filter((position) => position !== target);
    const make = (position: Position): Fraction => {
      const d = pick(ctx.rng, denominators);
      return position === "petite" ? { n: randomInt(ctx.rng, 1, d - 1), d } : position === "egale" ? { n: d, d } : { n: randomInt(ctx.rng, d + 1, 2 * d - 1), d };
    };
    let list: readonly Fraction[] = ONE_FALLBACK[target];
    for (let attempt = 0; attempt < 100; attempt++) {
      const drawn = [make(target), make(pick(ctx.rng, others)), make(pick(ctx.rng, others))];
      if (new Set(drawn.map(text)).size === 3) {
        list = drawn;
        break;
      }
    }
    return {
      prompt: `Quelle fraction est ${target === "egale" ? "égale à" : target === "petite" ? "plus petite que" : "plus grande que"} 1 ?`,
      answer: text(list[0]),
      wrong: [list[1], list[2]].map(text),
      hints: [
        "Compare le nombre du haut au nombre du bas de chaque fraction.",
        "Un tout, c'est autant de parts en haut qu'en bas.",
        target === "egale" ? "Cherche la fraction qui a le même nombre en haut et en bas." : target === "petite" ? "Cherche la fraction dont le haut est inférieur au bas." : "Cherche la fraction dont le haut dépasse le bas.",
      ],
    };
  });
}

/** « Glisse chaque fraction dans la bonne case. » : plus petite ou plus grande que 1 (dès le troisième palier, parfois que 1/2). */
export function makeCm1FrcSort(ctx: GameContext): GeneratedGame {
  return sortGame(ctx, "cm1-frc-glisser", "placer des fractions par rapport à un seuil", () => {
    const step = stepOf(ctx);
    const half = step >= 3 && ctx.rng() < 0.5;
    const each = step === 1 ? 2 : 3;
    const denominators = COMPARE_DENOMINATORS[step].filter((d) => !half || d >= 4);
    const small: Fraction[] = [];
    const big: Fraction[] = [];
    for (let attempt = 0; attempt < 400 && (small.length < each || big.length < each); attempt++) {
      const d = pick(ctx.rng, denominators);
      const n = half ? randomInt(ctx.rng, 1, d + 2) : randomInt(ctx.rng, 1, 2 * d - 1);
      const value = half ? n * 2 - d : n - d;
      if (value === 0) continue;
      if ([...small, ...big].some((other) => compare(other, { n, d }) === 0)) continue;
      if (value < 0 && small.length < each) small.push({ n, d });
      else if (value > 0 && big.length < each) big.push({ n, d });
    }
    const threshold = half ? "1/2" : "1";
    const lowZone = `Plus petite que ${threshold}`;
    const highZone = `Plus grande que ${threshold}`;
    return {
      prompt: "Glisse chaque fraction dans la bonne case.",
      zones: [lowZone, highZone],
      items: [...small.map((f) => ({ text: text(f), zone: lowZone })), ...big.map((f) => ({ text: text(f), zone: highZone }))],
      hints: half
        ? ["Prends la moitié du nombre du bas.", "Compare cette moitié au nombre du haut.", "Un haut qui dépasse cette moitié donne une fraction au-delà d'un demi."]
        : ["Compare le nombre du haut au nombre du bas.", "Un tout, c'est autant de parts en haut qu'en bas.", "Un haut qui dépasse le bas donne davantage qu'un tout."],
    };
  });
}

// ===========================================================================
// DES FRACTIONS ÉGALES, LES DIXIÈMES ET LES CENTIÈMES
// ===========================================================================

type EqualPlan = { b: readonly number[]; k: readonly number[]; forms: readonly string[] };
/** Les dénominateurs, les multiplicateurs et les formes de la fraction égale, par palier. */
const EQUAL_PLAN: Record<Step, readonly EqualPlan[]> = {
  1: [{ b: [2, 3, 4, 5], k: [2], forms: ["haut"] }],
  2: [{ b: [2, 3, 4, 5, 6], k: [2, 3, 4], forms: ["haut", "bas"] }],
  3: [{ b: [2, 3, 4, 5, 6], k: [2, 3, 4, 5], forms: ["haut", "bas", "reduire"] }, { b: [10], k: [10], forms: ["haut"] }],
  4: [{ b: [3, 4, 5, 6, 7, 8], k: [2, 3, 4, 5], forms: ["haut", "bas", "reduire"] }, { b: [10], k: [10], forms: ["haut", "reduire"] }],
  5: [{ b: [3, 4, 5, 6, 7, 8, 9, 10], k: [2, 3, 4, 5, 6], forms: ["haut", "bas", "reduire"] }, { b: [10], k: [10], forms: ["haut", "bas", "reduire"] }],
};

/** « 3/4 = ___/8 », « 2/5 = 4/___ » ou « 6/8 = ___/4 » : la fraction multipliée en haut et en bas par le même nombre. */
export function makeCm1FrcEqual(ctx: GameContext): GeneratedGame {
  return gapGame(ctx, "cm1-frc-egale", "trouver une fraction égale", () => {
    const plan = pick(ctx.rng, EQUAL_PLAN[stepOf(ctx)]);
    const b = pick(ctx.rng, plan.b);
    const k = pick(ctx.rng, plan.k);
    // Un haut qui n'a pas de diviseur commun avec le bas, plus petit que lui : la fraction ne se réduit pas déjà.
    const tops = range(1, b - 1).filter((a) => range(2, a).every((f) => a % f !== 0 || b % f !== 0));
    const a = pick(ctx.rng, tops.length > 0 ? tops : [1]);
    const form = pick(ctx.rng, plan.forms);
    if (form === "haut") {
      return {
        prompt: "Complète avec le bon nombre.",
        text: `${a}/${b} = ___/${b * k}`,
        answer: String(a * k),
        wrong: wrongNumbers(ctx, a * k, [a + (b * k - b), a + k, a * k + 1, a * k - 1, b * k], 1, 120),
        hints: ["Les deux fractions disent la même part du tout.", "Cherche par quel nombre on a multiplié le nombre du bas.", "Multiplie le nombre du haut par ce même nombre."],
      };
    }
    if (form === "bas") {
      return {
        prompt: "Complète avec le bon nombre.",
        text: `${a}/${b} = ${a * k}/___`,
        answer: String(b * k),
        wrong: wrongNumbers(ctx, b * k, [b + (a * k - a), b + k, b * k + 1, b * k - 1, a * k], 2, 120),
        hints: ["Les deux fractions disent la même part du tout.", "Cherche par quel nombre on a multiplié le nombre du haut.", "Multiplie le nombre du bas par ce même nombre."],
      };
    }
    return {
      prompt: "Complète avec le bon nombre.",
      text: `${a * k}/${b * k} = ___/${b}`,
      answer: String(a),
      wrong: wrongNumbers(ctx, a, [a * k - (b * k - b), a + 1, a - 1, b, a * k - b], 1, 120),
      hints: ["Les deux fractions disent la même part du tout.", "Cherche par quel nombre on a divisé le nombre du bas.", "Divise le nombre du haut par ce même nombre."],
    };
  });
}

type UnitForm = { from: string; to: string; factor: number; reverse: boolean };
const UNIT_FORMS: Record<string, UnitForm> = {
  unitesDixiemes: { from: "unités", to: "dixièmes", factor: 10, reverse: false },
  dixiemesCentiemes: { from: "dixièmes", to: "centièmes", factor: 10, reverse: false },
  unitesCentiemes: { from: "unités", to: "centièmes", factor: 100, reverse: false },
  centiemesDixiemes: { from: "centièmes", to: "dixièmes", factor: 10, reverse: true },
  dixiemesUnites: { from: "dixièmes", to: "unités", factor: 10, reverse: true },
};
const UNIT_PLAN: Record<Step, readonly string[]> = {
  1: ["unitesDixiemes"],
  2: ["unitesDixiemes", "dixiemesCentiemes"],
  3: ["unitesDixiemes", "dixiemesCentiemes", "unitesCentiemes", "dixiemesUnites"],
  4: ["unitesDixiemes", "dixiemesCentiemes", "unitesCentiemes", "centiemesDixiemes", "dixiemesUnites"],
  5: ["unitesCentiemes", "centiemesDixiemes", "dixiemesUnites", "dixiemesCentiemes"],
};

/** « 3 unités = ___ dixièmes », « 5 dixièmes = ___ centièmes », « 40 centièmes = ___ dixièmes » : changer d'unité, de dix en dix. */
export function makeCm1FrcUnits(ctx: GameContext): GeneratedGame {
  return gapGame(ctx, "cm1-frc-unites", "passer des unités aux dixièmes et aux centièmes", () => {
    const step = stepOf(ctx);
    const form = UNIT_FORMS[pick(ctx.rng, UNIT_PLAN[step])];
    // Le petit nombre : de 2 à 9, puis jusqu'à 30 aux deux derniers paliers.
    const small = randomInt(ctx.rng, 2, step >= 4 ? 30 : 9);
    const shown = form.reverse ? small * form.factor : small;
    const answer = form.reverse ? small : small * form.factor;
    return {
      prompt: "Complète avec le bon nombre.",
      text: `${shown} ${form.from} = ___ ${form.to}`,
      answer: show(answer),
      wrong: wrongNumbers(ctx, answer, [answer * 10, answer / 10, answer * 100, answer / 100, shown], 1, 99999),
      hints: [
        "Dix dixièmes font une unité, et dix centièmes font un dixième.",
        form.reverse ? "On passe à une unité plus grande : il faut moins de morceaux." : "On passe à une unité plus petite : il faut plus de morceaux.",
        form.reverse ? "Divise par dix, ou par cent de l'unité à l'autre." : "Multiplie par dix, ou par cent de l'unité à l'autre.",
      ],
    };
  });
}
