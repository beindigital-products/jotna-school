/**
 * LES PÉRIMÈTRES ET LES AIRES DU CE2 : le périmètre du carré et du rectangle, un côté qui manque, l'aire comptée en carreaux, comparer des aires
 * (`ma-ce2-perimetre-aire`).
 *
 * La thématique n'avait aucun jeu de code : les dix exercices de chaque palier étaient écrits par le modèle, qui confondait le périmètre et l'aire
 * (« le périmètre d'un rectangle de 6 cm sur 4 cm est 24 »), oubliait le double de la somme, ou donnait une aire en centimètres. Ici le calcul est FAIT par le
 * code, jamais écrit, et les mauvais choix sont les erreurs d'enfant connues.
 *
 * CE QUE CE FICHIER NE FAIT PAS SORTIR DE LA FICHE
 * - Le périmètre du carré et du rectangle, en centimètres ou en mètres, jamais en kilomètres ni avec une virgule. Un rectangle a toujours un côté plus long
 *   que l'autre : la longueur est strictement plus grande que la largeur.
 * - L'aire se compte en CARREAUX d'un quadrillage : jamais « cm² » ni « m² », que la fiche ne donne pas. Une aire n'est jamais un nombre de centimètres.
 * - Les mauvais choix sont des erreurs d'enfant : la somme des deux côtés au lieu du double (la moitié du tour), l'aire à la place du périmètre (et l'inverse),
 *   un côté de trop ou de moins, trois côtés au lieu de quatre. Aucun ne vaut la bonne réponse.
 * - Deux rectangles de même aire n'ont pas le même périmètre : au dernier palier, la comparaison pose ce piège.
 * - Les gabarits de mesure et de problème du CE2 ont leurs propres fichiers ; ici, un problème est un tour ou une surface, avec au plus un prix.
 * - Aucun indice n'écrit un chiffre ni l'unité de la bonne réponse.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { fresh, originOf, pick, pickFresh, randomInt, shuffle, type GameContext, type GameLevel, type GeneratedGame } from "./shared";
import { CHILDREN, pronoun } from "./stories";
import { choiceGame, linkGame, type Hints } from "./tableaux";
import { formatNumber } from "./patterns";
import { wrongNumbersCe1 } from "./nombresCe1";
import { binSort } from "./ce1SciencesOutils";
import { ce2Gap, gr, hints } from "./ce2Outils";

const show = (n: number) => formatNumber(n);
const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

// ===========================================================================
// LES MESURES DE CHAQUE PALIER
// ===========================================================================

/** Le côté d'un carré : de petits nombres d'abord, puis des mètres. */
export const SQUARE_SIDE: Record<GameLevel, readonly [number, number]> = { 1: [2, 6], 2: [4, 9], 3: [5, 15], 4: [8, 25] };
/** La longueur et la largeur d'un rectangle : la longueur est toujours plus grande que la largeur. */
export const RECT_LONG: Record<GameLevel, readonly [number, number]> = { 1: [3, 6], 2: [5, 9], 3: [8, 15], 4: [12, 30] };
export const RECT_WIDE: Record<GameLevel, readonly [number, number]> = { 1: [2, 4], 2: [2, 6], 3: [4, 10], 4: [6, 20] };

/** Centimètres aux deux premiers paliers, centimètres ou mètres ensuite. */
const unitOf = (ctx: GameContext) => (ctx.level <= 2 ? "cm" : pick(ctx.rng, ["cm", "m"]));

const PERIMETER_HINTS: Hints = [
  "Le périmètre est la longueur du tour de la figure.",
  "Additionne la longueur de tous les côtés.",
  "Un rectangle a deux longs côtés et deux courts côtés.",
];
const SQUARE_SIDE_HINTS: Hints = [
  "Le périmètre est la longueur du tour de la figure.",
  "Les quatre côtés d'un carré sont égaux.",
  "Partage le périmètre en quatre parts égales.",
];
const RECT_SIDE_HINTS: Hints = [
  "Le périmètre est la longueur du tour du rectangle.",
  "Le tour contient deux longueurs et deux largeurs.",
  "Retire les deux longueurs, puis partage ce qui reste entre les deux largeurs.",
];
const AREA_HINTS: Hints = [
  "L'aire mesure la place que la figure couvre.",
  "Compte ce qu'il y a dans une rangée, puis le nombre de rangées.",
  "Pour une figure en deux morceaux, calcule chaque morceau à part.",
];

// ===========================================================================
// UN CALCUL
// ===========================================================================

export type Form = "carre" | "rectangle" | "cote-carre" | "cote-rectangle" | "aire" | "aire-deux" | "aire-coin";

export type Calc = {
  prompt: string;
  result: number;
  unit: string;
  /** Les erreurs d'enfant : des nombres qui ne valent jamais le résultat. */
  pool: number[];
  hints: Hints;
};

/** Un long côté et un court côté du palier, pas encore posés dans ce palier. */
function drawRectangle(ctx: GameContext): { long: number; wide: number } {
  const pairs = range(RECT_LONG[ctx.level][0], RECT_LONG[ctx.level][1]).flatMap((long) =>
    range(RECT_WIDE[ctx.level][0], RECT_WIDE[ctx.level][1])
      .filter((wide) => wide < long)
      .map((wide) => ({ long, wide })),
  );
  return pickFresh(ctx, pairs, (pair) => `ce2-per:rect:${pair.long}x${pair.wide}`);
}

/** Une mesure à calculer : l'énoncé entier, le résultat, et les erreurs d'enfant. */
export function drawCalc(ctx: GameContext, form: Form): Calc {
  switch (form) {
    case "carre": {
      const u = unitOf(ctx);
      const s = pickFresh(ctx, range(...SQUARE_SIDE[ctx.level]), (n) => `ce2-per:carre:${n}`);
      return {
        prompt: `Quel est le périmètre d'un carré de ${s} ${u} de côté ?`,
        result: 4 * s,
        unit: u,
        pool: [2 * s, s * s, s + 4, 3 * s],
        hints: PERIMETER_HINTS,
      };
    }
    case "rectangle": {
      const u = unitOf(ctx);
      const { long, wide } = drawRectangle(ctx);
      return {
        prompt: `Un rectangle mesure ${long} ${u} de long et ${wide} ${u} de large. Quel est son périmètre ?`,
        result: 2 * (long + wide),
        unit: u,
        pool: [long + wide, long * wide, 2 * long + wide, long + 2 * wide],
        hints: PERIMETER_HINTS,
      };
    }
    case "cote-carre": {
      const u = unitOf(ctx);
      const s = pickFresh(ctx, range(...SQUARE_SIDE[ctx.level]), (n) => `ce2-per:carre:${n}`);
      return {
        prompt: `Un carré a un périmètre de ${4 * s} ${u}. Quelle est la longueur de son côté ?`,
        result: s,
        unit: u,
        pool: [2 * s, s + 1, s - 1, 4 * s - 4, s * 3],
        hints: SQUARE_SIDE_HINTS,
      };
    }
    case "cote-rectangle": {
      const u = unitOf(ctx);
      const { long, wide } = drawRectangle(ctx);
      const perimeter = 2 * (long + wide);
      return {
        prompt: `Un rectangle a un périmètre de ${perimeter} ${u}. Sa longueur est de ${long} ${u}. Quelle est sa largeur ?`,
        result: wide,
        unit: u,
        pool: [perimeter / 2, perimeter - long, wide + 1, wide - 1, perimeter / 2 + long],
        hints: RECT_SIDE_HINTS,
      };
    }
    case "aire": {
      const long = pickFresh(ctx, range(ctx.level === 1 ? 3 : 4, ctx.level === 1 ? 5 : 8), (n) => `ce2-per:aire-long:${n}`);
      const wide = randomInt(ctx.rng, 2, Math.min(long - 1, ctx.level === 1 ? 4 : 6));
      return {
        prompt: `Un rectangle est quadrillé en ${long} carreaux de long sur ${wide} carreaux de large. Combien de carreaux contient-il ?`,
        result: long * wide,
        unit: "carreaux",
        pool: [long + wide, 2 * (long + wide), long * wide + wide, long * wide - wide, long * wide + long],
        hints: AREA_HINTS,
      };
    }
    case "aire-deux": {
      const a = randomInt(ctx.rng, 3, 6);
      const b = randomInt(ctx.rng, 2, 5);
      const c = randomInt(ctx.rng, 2, 5);
      const d = randomInt(ctx.rng, 2, 5);
      ctx.used.add(`ce2-per:aire-deux:${a}x${b}+${c}x${d}`);
      return {
        prompt: `Une figure est faite de deux rectangles. Le premier fait ${a} carreaux sur ${b}, le second ${c} carreaux sur ${d}. Combien de carreaux contient-elle ?`,
        result: a * b + c * d,
        unit: "carreaux",
        pool: [a + b + c + d, a * b, c * d, (a + c) * (b + d), a * b * c * d],
        hints: AREA_HINTS,
      };
    }
    case "aire-coin": {
      const w = randomInt(ctx.rng, 2, 3);
      const h = randomInt(ctx.rng, 2, 3);
      const big = pickFresh(ctx, range(6, 10), (n) => `ce2-per:coin-large:${n}`);
      const tall = randomInt(ctx.rng, 4, 8);
      return {
        prompt: `Un rectangle fait ${big} carreaux sur ${tall}. On enlève un coin de ${w} carreaux sur ${h}. Combien de carreaux reste-t-il ?`,
        result: big * tall - w * h,
        unit: "carreaux",
        pool: [big * tall, big * tall + w * h, big * tall - w - h, (big - w) * (tall - h)],
        hints: AREA_HINTS,
      };
    }
  }
}

const answerOf = (calc: Calc) => `${show(calc.result)} ${calc.unit}`;

/** Un QCM sur un calcul : le résultat avec son unité, et deux erreurs d'enfant. */
function calcChoice(ctx: GameContext, kind: string, concept: string, form: Form): GeneratedGame {
  return choiceGame(ctx, kind, concept, () => {
    const calc = drawCalc(ctx, form);
    return {
      prompt: calc.prompt,
      answer: answerOf(calc),
      wrong: wrongNumbersCe1(ctx, calc.result, calc.pool, 1, 1000).map((value) => `${value} ${calc.unit}`),
      hints: calc.hints,
    };
  });
}

// ===========================================================================
// LES GABARITS QUI CALCULENT
// ===========================================================================

/** « Quel est le périmètre d'un carré de 5 cm de côté ? » : quatre fois le côté, et deux erreurs d'enfant. */
export function makeCe2PerSquare(ctx: GameContext): GeneratedGame {
  return calcChoice(ctx, "ce2-per-carre", "calculer le périmètre d'un carré", "carre");
}

/** « Un rectangle mesure 8 cm de long et 5 cm de large. Quel est son périmètre ? » : le double de la somme. */
export function makeCe2PerRectangle(ctx: GameContext): GeneratedGame {
  return calcChoice(ctx, "ce2-per-rectangle", "calculer le périmètre d'un rectangle", "rectangle");
}

const SIDE_FORMS: Record<GameLevel, Form> = { 1: "cote-carre", 2: "cote-carre", 3: "cote-rectangle", 4: "cote-rectangle" };

/** Un côté qui manque : le côté d'un carré dont on connaît le périmètre, puis la largeur d'un rectangle dont on connaît le périmètre et la longueur. */
export function makeCe2PerSide(ctx: GameContext): GeneratedGame {
  return calcChoice(ctx, "ce2-per-cote", "retrouver un côté à partir du périmètre", SIDE_FORMS[ctx.level]);
}

const AREA_FORMS: Record<GameLevel, Form> = { 1: "aire", 2: "aire", 3: "aire-deux", 4: "aire-coin" };

/** L'aire en carreaux : un rectangle, puis deux rectangles, puis un rectangle dont on enlève un coin. */
export function makeCe2PerArea(ctx: GameContext): GeneratedGame {
  return calcChoice(ctx, "ce2-per-aire", "calculer une aire en carreaux", AREA_FORMS[ctx.level]);
}

const WRITE_FORMS: Record<GameLevel, readonly Form[]> = {
  1: ["carre", "aire"],
  2: ["rectangle", "cote-carre"],
  3: ["cote-rectangle", "aire-deux"],
  4: ["rectangle", "aire-coin", "cote-rectangle"],
};

/** « … Écris le nombre. » : le même calcul, une réponse courte sans unité. */
export function makeCe2PerWrite(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "ce2-per-ecrire", () => {
    const calc = drawCalc(ctx, pick(ctx.rng, WRITE_FORMS[ctx.level]));
    return {
      type: "short-answer",
      prompt: `${calc.prompt} Écris le nombre.`,
      payload: { acceptedAnswers: [String(calc.result)], game: originOf("ce2-per-ecrire", ctx), concept: "calculer un périmètre, un côté ou une aire et écrire le nombre" },
      answerKey: String(calc.result),
      hints: [...calc.hints],
    };
  });
}

// ===========================================================================
// COMPARER
// ===========================================================================

type Rectangle = { long: number; wide: number };
const areaOf = (r: Rectangle) => r.long * r.wide;
const perimeterOf = (r: Rectangle) => 2 * (r.long + r.wide);

/** Deux rectangles de même aire et de périmètres différents : le piège du dernier palier. */
export const SAME_AREA_PAIRS: readonly (readonly [Rectangle, Rectangle])[] = [
  [{ long: 6, wide: 2 }, { long: 4, wide: 3 }],
  [{ long: 9, wide: 2 }, { long: 6, wide: 3 }],
  [{ long: 10, wide: 2 }, { long: 5, wide: 4 }],
  [{ long: 8, wide: 3 }, { long: 6, wide: 4 }],
  [{ long: 10, wide: 3 }, { long: 6, wide: 5 }],
  [{ long: 12, wide: 3 }, { long: 9, wide: 4 }],
];

/** La longueur des rectangles qu'on compare, par palier. */
export const COMPARE_LONG: Record<GameLevel, readonly [number, number]> = { 1: [3, 6], 2: [4, 8], 3: [5, 10], 4: [6, 12] };

const COMPARE_HINTS: Hints = [
  "Lis bien ce qu'on compare : la place couverte ou la longueur du tour.",
  "Calcule la mesure demandée pour chaque rectangle.",
  "Deux rectangles peuvent couvrir autant de place sans avoir le même tour.",
];

/** Deux rectangles A et B de ce palier, et ce qu'on compare. */
function drawComparison(ctx: GameContext): { a: Rectangle; b: Rectangle; asks: "aire" | "périmètre" } {
  if (ctx.level === 4 && ctx.rng() < 0.6) {
    const [first, second] = pickFresh(ctx, SAME_AREA_PAIRS, (pair) => `ce2-per:comparer:${pair[0].long}x${pair[0].wide}`);
    const [a, b] = ctx.rng() < 0.5 ? [first, second] : [second, first];
    return { a, b, asks: ctx.rng() < 0.5 ? "aire" : "périmètre" };
  }
  const asks = ctx.level === 3 ? "périmètre" : ctx.level <= 2 ? "aire" : pick(ctx.rng, ["aire", "périmètre"] as const);
  const [lowLong, highLong] = COMPARE_LONG[ctx.level];
  for (let attempt = 0; attempt < 200; attempt++) {
    const draw = (): Rectangle => {
      const long = randomInt(ctx.rng, lowLong, highLong);
      return { long, wide: randomInt(ctx.rng, 2, Math.min(long - 1, 6)) };
    };
    const a = draw();
    const b = draw();
    if (areaOf(a) === areaOf(b) || perimeterOf(a) === perimeterOf(b)) continue;
    return { a, b, asks };
  }
  throw new Error("unreachable");
}

/** « Lequel a la plus grande aire ? » ou « le plus grand périmètre ? » : le rectangle A, le rectangle B, ou « ils sont égaux » quand l'aire est la même. */
export function makeCe2PerCompare(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce2-per-comparer", "comparer des aires et des périmètres", () => {
    const { a, b, asks } = drawComparison(ctx);
    const measure = asks === "aire" ? areaOf : perimeterOf;
    const equalText = asks === "aire" ? "Ils ont la même aire" : "Ils ont le même périmètre";
    const answer = measure(a) === measure(b) ? equalText : measure(a) > measure(b) ? "Le rectangle A" : "Le rectangle B";
    return {
      prompt: `Le rectangle A mesure ${a.long} carreaux sur ${a.wide}. Le rectangle B mesure ${b.long} carreaux sur ${b.wide}. Lequel a ${asks === "aire" ? "la plus grande aire" : "le plus grand périmètre"} ?`,
      answer,
      wrong: ["Le rectangle A", "Le rectangle B", equalText].filter((choice) => choice !== answer),
      hints: COMPARE_HINTS,
    };
  });
}

// ===========================================================================
// LA PHRASE À TROUS
// ===========================================================================

const gap = (text: string, answer: string, wrong: readonly [string, string]) =>
  gr(text, answer, wrong, hints("Lis la phrase en entier avant de choisir.", "Pense à la figure dont on parle et à ce qu'on veut mesurer.", "Teste chaque choix dans la phrase."));

/** Huit phrases, deux par palier : les deux mots, puis le mot ou le nombre qui complète. */
export const GAP_ROWS = [
  // Palier 1
  gap("Pour mesurer la longueur du contour d'une figure, on calcule son ___.", "périmètre", ["aire", "côté"]),
  gap("Pour mesurer la place qu'une figure couvre, on calcule son ___.", "aire", ["périmètre", "côté"]),
  // Palier 2
  gap("Le périmètre d'un rectangle est la somme de ses ___ côtés.", "quatre", ["deux", "trois"]),
  gap("L'aire se compte en ___ sur un quadrillage.", "carreaux", ["mètres", "côtés"]),
  // Palier 3
  gap("Un rectangle de 12 m sur 7 m a un périmètre de ___ m.", "38", ["19", "84"]),
  gap("Un carré de 15 cm de côté a un périmètre de ___ cm.", "60", ["30", "225"]),
  // Palier 4
  gap("Un rectangle de 9 carreaux sur 6 contient ___ carreaux.", "54", ["30", "15"]),
  gap("Un rectangle de 8 carreaux sur 5 perd un coin de 2 carreaux sur 2, il reste ___ carreaux.", "36", ["40", "44"]),
];

/** « Pour mesurer le contour, on calcule son ___. » : le mot ou le nombre qui manque. */
export function makeCe2PerGap(ctx: GameContext): GeneratedGame {
  return ce2Gap(ctx, "ce2-per-trou", "compléter une phrase sur le périmètre ou l'aire", GAP_ROWS);
}

// ===========================================================================
// RELIER
// ===========================================================================

/** « Relie chaque carré à son périmètre. » : trois figures du palier, tous les résultats différents. */
export function makeCe2PerLinks(ctx: GameContext): GeneratedGame {
  return linkGame(ctx, "ce2-per-relier", "relier une figure à son périmètre ou à son aire", () => {
    const pairs: { left: string; right: string }[] = [];
    const rights = new Set<string>();
    const add = (left: string, right: string) => {
      if (rights.has(right) || pairs.some((pair) => pair.left === left)) return;
      rights.add(right);
      pairs.push({ left, right });
    };
    const wanted = 3;
    for (let attempt = 0; attempt < 300 && pairs.length < wanted; attempt++) {
      if (ctx.level === 1) {
        const s = randomInt(ctx.rng, 2, 9);
        add(`Carré de ${s} cm de côté`, `${4 * s} cm`);
      } else if (ctx.level === 2) {
        const long = randomInt(ctx.rng, 4, 10);
        const wide = randomInt(ctx.rng, 2, long - 1);
        add(`Rectangle de ${long} cm sur ${wide} cm`, `${2 * (long + wide)} cm`);
      } else if (ctx.level === 3) {
        const long = randomInt(ctx.rng, 4, 9);
        const wide = randomInt(ctx.rng, 2, long - 1);
        add(`Rectangle de ${long} carreaux sur ${wide}`, `${long * wide} carreaux`);
      } else {
        const turn = pairs.length;
        if (turn === 0) {
          const s = randomInt(ctx.rng, 5, 12);
          add(`Périmètre du carré de ${s} cm`, `${4 * s} cm`);
        } else if (turn === 1) {
          const long = randomInt(ctx.rng, 6, 14);
          const wide = randomInt(ctx.rng, 3, long - 1);
          add(`Périmètre du rectangle de ${long} cm sur ${wide} cm`, `${2 * (long + wide)} cm`);
        } else {
          const long = randomInt(ctx.rng, 5, 9);
          const wide = randomInt(ctx.rng, 3, long - 1);
          add(`Aire du rectangle de ${long} carreaux sur ${wide}`, `${long * wide} carreaux`);
        }
      }
    }
    const prompt = ["Relie chaque carré à son périmètre.", "Relie chaque rectangle à son périmètre.", "Relie chaque rectangle à son aire.", "Relie chaque figure à son résultat."][ctx.level - 1];
    return {
      prompt,
      pairs: shuffle(ctx.rng, pairs),
      hints: ["Calcule chaque mesure à part.", "Commence par la figure dont tu es le plus sûr.", "Chaque résultat va avec une seule figure."],
    };
  });
}

// ===========================================================================
// GLISSER
// ===========================================================================

/** Huit situations où l'on mesure un tour. */
export const PERIMETER_TILES = [
  "La clôture d'un jardin",
  "Le grillage autour d'un champ",
  "Le tour d'un terrain de sport",
  "La bordure d'une photo",
  "La guirlande autour d'une salle",
  "La plinthe d'une chambre",
  "Le fil autour d'un cadre",
  "La barrière d'un enclos",
] as const;
/** Huit situations où l'on mesure une surface. */
export const AREA_TILES = [
  "La peinture d'un mur",
  "Le carrelage d'une cuisine",
  "Le gazon d'un terrain",
  "Le papier peint d'une chambre",
  "Le tissu d'une nappe",
  "La toile d'une grande tente",
  "Le goudron d'une cour",
  "La moquette d'une salle",
] as const;

/** « Glisse chaque situation dans la bonne case. » : un tour (périmètre) ou une surface (aire). */
export function makeCe2PerSort(ctx: GameContext): GeneratedGame {
  return binSort(
    ctx,
    "ce2-per-glisser",
    "reconnaître une situation de périmètre ou d'aire",
    "Glisse chaque situation dans la bonne case.",
    { zone: "Périmètre", tiles: PERIMETER_TILES },
    { zone: "Aire", tiles: AREA_TILES },
    ["Demande-toi si on mesure le tour ou la surface.", "Une clôture suit le bord, une peinture recouvre.", "Commence par la situation dont tu es le plus sûr."],
  );
}

// ===========================================================================
// LES PROBLÈMES
// ===========================================================================

const PROBLEM_HINTS: Hints = [
  "Dessine la figure dont on parle.",
  "Cherche si l'on mesure le tour ou la surface.",
  "Si l'on parle de prix, calcule d'abord la longueur ou le nombre de petits carrés.",
];

/** Un problème : le tour d'un jardin carré, d'un champ rectangulaire, des carreaux d'une salle, puis le prix d'une clôture. */
export function makeCe2PerProblem(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce2-per-probleme", "résoudre un petit problème de périmètre ou d'aire", () => {
    const child = pickFresh(ctx, CHILDREN, (candidate) => `ce2-per:enfant:${candidate.name}`);
    if (ctx.level === 1) {
      const s = randomInt(ctx.rng, 3, 8);
      return {
        prompt: `Un jardin carré a ${s} m de côté. ${child.name} pose une clôture tout autour. Quelle longueur de clôture lui faut-il ?`,
        answer: `${4 * s} m`,
        wrong: wrongNumbersCe1(ctx, 4 * s, [2 * s, s * s, s + 4, 3 * s], 1, 200).map((value) => `${value} m`),
        hints: PROBLEM_HINTS,
      };
    }
    if (ctx.level === 2) {
      const { long, wide } = drawRectangle(ctx);
      return {
        prompt: `Un champ rectangulaire mesure ${long} m de long et ${wide} m de large. ${child.name} en fait le tour à pied. Combien de mètres parcourt-${pronoun(child)} ?`,
        answer: `${2 * (long + wide)} m`,
        wrong: wrongNumbersCe1(ctx, 2 * (long + wide), [long + wide, long * wide, 2 * long + wide], 1, 400).map((value) => `${value} m`),
        hints: PROBLEM_HINTS,
      };
    }
    if (ctx.level === 3) {
      const rows = randomInt(ctx.rng, 5, 12);
      const each = randomInt(ctx.rng, 4, 11);
      return {
        prompt: `Une salle est carrelée en ${rows} rangées de ${each} carreaux. Combien de carreaux couvrent la salle ?`,
        answer: `${rows * each} carreaux`,
        wrong: wrongNumbersCe1(ctx, rows * each, [rows + each, 2 * (rows + each), rows * each + each, rows * each - rows], 1, 400).map((value) => `${value} carreaux`),
        hints: PROBLEM_HINTS,
      };
    }
    const long = randomInt(ctx.rng, 8, 14);
    const wide = randomInt(ctx.rng, 4, Math.min(long - 1, 9));
    const price = pick(ctx.rng, [250, 500, 750]);
    const total = 2 * (long + wide) * price;
    return {
      prompt: `Un jardin rectangulaire mesure ${long} m sur ${wide} m. Le grillage coûte ${show(price)} FCFA le mètre. Combien coûte la clôture complète ?`,
      answer: `${show(total)} FCFA`,
      wrong: wrongNumbersCe1(
        ctx,
        total,
        [(long + wide) * price, long * wide * price, total + price, total - price, 2 * (long + wide) + price].filter((n) => n % 250 === 0),
        250,
        100000,
      ).map((value) => `${value} FCFA`),
      hints: PROBLEM_HINTS,
    };
  });
}
