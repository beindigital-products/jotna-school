/**
 * LES PÉRIMÈTRES ET LES AIRES DU CM1 : le périmètre et l'aire du carré et du rectangle, un côté qui manque, les unités d'aire (cm², dm², m²), comparer, relier,
 * distinguer le tour d'une figure de sa surface, de petits problèmes (`ma-cm1-perimetres-aires`).
 *
 * Sur l'échantillon, le modèle écrivait « 1 m² = 100 cm² », une aire en centimètres, le périmètre d'un rectangle comme la somme de deux côtés, et comparait deux
 * rectangles de même aire en disant qu'ils ont le même périmètre. Ici le calcul est FAIT par le code, jamais écrit : un périmètre est le double de la longueur plus
 * la largeur, une aire le produit, et les mauvais choix sont les erreurs d'enfant connues. Aucun n'a la valeur de la bonne réponse.
 *
 * - LES CINQ PALIERS (`stepOf`) : un carré de 2 à 9, puis de 5 à 15, de 8 à 25, de 10 à 40, de 12 à 60 ; des rectangles dont la longueur est toujours plus grande que la largeur.
 *   Des centimètres aux deux premiers paliers, des centimètres ou des mètres ensuite. Les aires s'écrivent avec leur unité au carré (« 49 cm² »), jamais « 49 cm ».
 * - LES PIÈGES : l'aire à la place du périmètre (et l'inverse), la somme de deux côtés au lieu du double, une aire sans son carré (« 49 cm »), deux rectangles de même aire
 *   mais de périmètres différents (et de même périmètre mais d'aires différentes) dès le quatrième palier.
 * - LES UNITÉS D'AIRE : 1 m² vaut 100 dm², 1 dm² vaut 100 cm², donc 1 m² vaut 10 000 cm² ; l'erreur d'enfant est de croire qu'un mètre carré vaut 100 centimètres carrés.
 * - Les énoncés n'ont aucun « : », au plus une apostrophe droite, vingt-huit mots au plus. Aucun indice n'écrit un chiffre. Les cases d'un glissé s'appellent
 *   « Périmètre » et « Aire » : leurs indices n'emploient ni l'un ni l'autre mot.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { fresh, originOf, pick, pickFresh, randomInt, shuffle, type GameContext, type GeneratedGame } from "./shared";
import { choiceGame, gapGame, linkGame, sortGame, type Hints } from "./tableaux";
import { show, stepOf, wrongNumbers, type Step } from "./cm1MathsOutils";

const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

// ===========================================================================
// LES MESURES DE CHAQUE PALIER
// ===========================================================================

/** Le côté d'un carré. */
export const SQUARE_SIDE: Record<Step, readonly [number, number]> = { 1: [2, 9], 2: [5, 15], 3: [8, 25], 4: [10, 40], 5: [12, 60] };
/** La longueur et la largeur d'un rectangle : la longueur est toujours plus grande que la largeur. */
export const RECT_LONG: Record<Step, readonly [number, number]> = { 1: [4, 9], 2: [6, 15], 3: [10, 25], 4: [15, 40], 5: [20, 60] };
export const RECT_WIDE: Record<Step, readonly [number, number]> = { 1: [2, 6], 2: [3, 10], 3: [5, 18], 4: [8, 30], 5: [10, 45] };

/** Des centimètres aux deux premiers paliers, des centimètres ou des mètres ensuite. */
const unitOf = (ctx: GameContext) => (stepOf(ctx) <= 2 ? "cm" : pick(ctx.rng, ["cm", "m"]));

export type Rect = { l: number; w: number };

/** Un côté de carré du palier, qu'aucun exercice n'a déjà posé. */
function drawSide(ctx: GameContext): number {
  return pickFresh(ctx, range(...SQUARE_SIDE[stepOf(ctx)]), (n) => `cm1-per:carre:${n}`);
}

/** Un rectangle du palier : la longueur est strictement plus grande que la largeur. */
function drawRect(ctx: GameContext): Rect {
  const step = stepOf(ctx);
  const pairs = range(...RECT_LONG[step]).flatMap((l) => range(...RECT_WIDE[step]).filter((w) => w < l).map((w) => ({ l, w })));
  return pickFresh(ctx, pairs, (pair) => `cm1-per:rect:${pair.l}x${pair.w}`);
}

const perimeterOf = (r: Rect) => 2 * (r.l + r.w);
const areaOf = (r: Rect) => r.l * r.w;
const sized = (r: Rect, u: string) => `${r.l} ${u} sur ${r.w} ${u}`;

const PERIMETER_HINTS: Hints = ["Le périmètre est la longueur du tour de la figure.", "Additionne la longueur de tous les côtés.", "Un rectangle a deux longs côtés et deux courts côtés."];
const AREA_HINTS: Hints = ["L'aire mesure la place que la figure couvre.", "Compte ce qu'il y a dans une rangée, puis le nombre de rangées.", "Une aire s'écrit avec une unité au carré."];
const SIDE_HINTS: Hints = ["Dessine la figure et écris ce que tu connais.", "Le tour d'un rectangle contient deux longueurs et deux largeurs.", "Retire ce que tu connais, puis partage ce qui reste."];
const AREA_SIDE_HINTS: Hints = ["L'aire est le produit de la longueur par la largeur.", "Cherche par quel nombre multiplier le côté connu pour arriver à l'aire.", "Vérifie en multipliant ta réponse par le côté connu."];

/** Les deux mauvais choix d'un nombre, écrits avec leur unité. */
const withUnit = (pair: readonly [string, string], suffix: string) => pair.map((value) => `${value} ${suffix}`);

// ===========================================================================
// LE PÉRIMÈTRE, L'AIRE
// ===========================================================================

/** « Un rectangle mesure 12 cm de long et 5 cm de large. Quel est son périmètre ? » ou « Un carré mesure 7 cm de côté. Quel est son périmètre ? ». */
export function makeCm1PerPerimeter(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "cm1-per-perimetre", "calculer le périmètre d'un carré ou d'un rectangle", () => {
    const u = unitOf(ctx);
    if (ctx.rng() < 0.4) {
      const s = drawSide(ctx);
      return {
        prompt: `Un carré mesure ${s} ${u} de côté. Quel est son périmètre ?`,
        answer: `${show(4 * s)} ${u}`,
        wrong: withUnit(wrongNumbers(ctx, 4 * s, [2 * s, s * s, s + 4, 3 * s], 1, 9999), u),
        hints: PERIMETER_HINTS,
      };
    }
    const r = drawRect(ctx);
    return {
      prompt: `Un rectangle mesure ${r.l} ${u} de long et ${r.w} ${u} de large. Quel est son périmètre ?`,
      answer: `${show(perimeterOf(r))} ${u}`,
      wrong: withUnit(wrongNumbers(ctx, perimeterOf(r), [r.l + r.w, areaOf(r), 2 * r.l + r.w, r.l + 2 * r.w], 1, 9999), u),
      hints: PERIMETER_HINTS,
    };
  });
}

/** « Un rectangle mesure 12 cm de long et 5 cm de large. Quelle est son aire ? » : « 60 cm² », jamais « 60 cm ». */
export function makeCm1PerArea(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "cm1-per-aire", "calculer l'aire d'un carré ou d'un rectangle", () => {
    const u = unitOf(ctx);
    if (ctx.rng() < 0.4) {
      const s = drawSide(ctx);
      const pool = [`${show(4 * s)} ${u}²`, `${show(s * s)} ${u}`, `${show(2 * s)} ${u}²`, `${show(s * s + s)} ${u}²`];
      return {
        prompt: `Un carré mesure ${s} ${u} de côté. Quelle est son aire ?`,
        answer: `${show(s * s)} ${u}²`,
        wrong: shuffle(ctx.rng, pool),
        hints: AREA_HINTS,
      };
    }
    const r = drawRect(ctx);
    const pool = [`${show(perimeterOf(r))} ${u}²`, `${show(areaOf(r))} ${u}`, `${show(r.l + r.w)} ${u}²`, `${show(areaOf(r) + r.l)} ${u}²`];
    return {
      prompt: `Un rectangle mesure ${r.l} ${u} de long et ${r.w} ${u} de large. Quelle est son aire ?`,
      answer: `${show(areaOf(r))} ${u}²`,
      wrong: shuffle(ctx.rng, pool),
      hints: AREA_HINTS,
    };
  });
}

type SideForm = "carre-perimetre" | "rectangle-perimetre" | "rectangle-aire" | "carre-aire";
const SIDE_FORMS: Record<Step, readonly SideForm[]> = {
  1: ["carre-perimetre"],
  2: ["carre-perimetre", "rectangle-perimetre"],
  3: ["rectangle-perimetre", "rectangle-aire"],
  4: ["rectangle-perimetre", "rectangle-aire", "carre-aire"],
  5: ["rectangle-aire", "carre-aire", "rectangle-perimetre"],
};

/** Un côté qui manque : « Un rectangle a un périmètre de 34 cm et une longueur de 12 cm. Sa largeur mesure ___ cm. » */
export function makeCm1PerSide(ctx: GameContext): GeneratedGame {
  return gapGame(ctx, "cm1-per-cote", "chercher un côté à partir du périmètre ou de l'aire", () => {
    const u = unitOf(ctx);
    const form = pick(ctx.rng, SIDE_FORMS[stepOf(ctx)]);
    if (form === "carre-perimetre") {
      const s = drawSide(ctx);
      return {
        prompt: "Complète avec le bon nombre.",
        text: `Un carré a un périmètre de ${show(4 * s)} ${u}. Son côté mesure ___ ${u}.`,
        answer: show(s),
        wrong: wrongNumbers(ctx, s, [2 * s, s + 1, s - 1, 4 * s - 4, 3 * s], 1, 9999),
        hints: ["Le périmètre est la longueur du tour de la figure.", "Les quatre côtés d'un carré sont égaux.", "Partage le périmètre en quatre parts égales."],
      };
    }
    if (form === "carre-aire") {
      const s = drawSide(ctx);
      return {
        prompt: "Complète avec le bon nombre.",
        text: `Un carré a une aire de ${show(s * s)} ${u}². Son côté mesure ___ ${u}.`,
        answer: show(s),
        wrong: wrongNumbers(ctx, s, [s + 1, s - 1, s * 2, (s * s) / 2, 4 * s], 1, 9999),
        hints: ["L'aire d'un carré est le côté multiplié par lui-même.", "Cherche le nombre qui, multiplié par lui-même, donne l'aire.", "Vérifie en multipliant ta réponse par elle-même."],
      };
    }
    const r = drawRect(ctx);
    if (form === "rectangle-perimetre") {
      return {
        prompt: "Complète avec le bon nombre.",
        text: `Un rectangle a un périmètre de ${show(perimeterOf(r))} ${u} et une longueur de ${r.l} ${u}. Sa largeur mesure ___ ${u}.`,
        answer: show(r.w),
        wrong: wrongNumbers(ctx, r.w, [perimeterOf(r) / 2, perimeterOf(r) - r.l, r.w + 1, r.w - 1, perimeterOf(r) / 2 + r.l], 1, 9999),
        hints: SIDE_HINTS,
      };
    }
    return {
      prompt: "Complète avec le bon nombre.",
      text: `Un rectangle a une aire de ${show(areaOf(r))} ${u}² et une longueur de ${r.l} ${u}. Sa largeur mesure ___ ${u}.`,
      answer: show(r.w),
      wrong: wrongNumbers(ctx, r.w, [areaOf(r) - r.l, r.w + 1, r.w - 1, areaOf(r) / 2, r.l - r.w], 1, 9999),
      hints: AREA_SIDE_HINTS,
    };
  });
}

// ===========================================================================
// COMPARER, ÉCRIRE, RELIER
// ===========================================================================

/** Les groupes de rectangles de même aire, ou de même demi-périmètre : trois au moins, avec la longueur la plus grande des rectangles du jeu. */
function trapGroups(by: "aire" | "somme", maxLong: number): Rect[][] {
  const groups = new Map<number, Rect[]>();
  for (let l = 3; l <= maxLong; l++) {
    for (let w = 2; w < l; w++) {
      const key = by === "aire" ? l * w : l + w;
      groups.set(key, [...(groups.get(key) ?? []), { l, w }]);
    }
  }
  return [...groups.values()].filter((group) => group.length >= 3);
}

const QUANTITIES = { perimetre: perimeterOf, aire: areaOf } as const;

/** « Lequel de ces rectangles a le plus grand périmètre ? » : trois rectangles, dont (dès le quatrième palier) deux ou trois de même aire, ou de même périmètre. */
export function makeCm1PerCompare(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "cm1-per-comparer", "comparer des périmètres et des aires", () => {
    const step = stepOf(ctx);
    const u = unitOf(ctx);
    const trap = step >= 4 && ctx.rng() < 0.6;
    // Le piège : trois rectangles de même aire, on demande le périmètre ; ou de même demi-périmètre, on demande l'aire.
    const quantity: keyof typeof QUANTITIES = trap ? (ctx.rng() < 0.5 ? "perimetre" : "aire") : pick(ctx.rng, ["perimetre", "aire"] as const);
    const biggest = ctx.rng() < 0.6;
    let rects: Rect[] = [];
    for (let attempt = 0; attempt < 200; attempt++) {
      if (trap) {
        const group = pick(ctx.rng, trapGroups(quantity === "perimetre" ? "aire" : "somme", RECT_LONG[step][1]));
        rects = shuffle(ctx.rng, group).slice(0, 3);
      } else {
        rects = [drawRect(ctx), drawRect(ctx), drawRect(ctx)];
      }
      const values = rects.map(QUANTITIES[quantity]);
      if (new Set(values).size === 3) break;
    }
    const sorted = [...rects].sort((a, b) => QUANTITIES[quantity](a) - QUANTITIES[quantity](b));
    const answer = biggest ? sorted[2] : sorted[0];
    return {
      prompt: `Lequel de ces rectangles a ${quantity === "perimetre" ? (biggest ? "le plus grand périmètre" : "le plus petit périmètre") : biggest ? "la plus grande aire" : "la plus petite aire"} ?`,
      answer: sized(answer, u),
      wrong: rects.filter((r) => r !== answer).map((r) => sized(r, u)),
      hints: [
        "Calcule la grandeur demandée pour chaque rectangle.",
        quantity === "perimetre" ? "Le périmètre est le double de la longueur plus la largeur." : "L'aire est la longueur multipliée par la largeur.",
        "Deux rectangles peuvent avoir une grandeur égale sans avoir l'autre égale.",
      ],
    };
  });
}

/** « Un rectangle mesure 12 cm sur 5 cm. Écris son aire en cm². » : une réponse courte. */
export function makeCm1PerWrite(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "cm1-per-ecrire", () => {
    const u = unitOf(ctx);
    const wantsArea = ctx.rng() < 0.5;
    const ask = wantsArea ? `son aire en ${u}²` : `son périmètre en ${u}`;
    let prompt: string;
    let value: number;
    if (ctx.rng() < 0.6) {
      const r = drawRect(ctx);
      prompt = `Un rectangle mesure ${r.l} ${u} sur ${r.w} ${u}. Écris ${ask}.`;
      value = wantsArea ? areaOf(r) : perimeterOf(r);
    } else {
      const s = drawSide(ctx);
      prompt = `Un carré mesure ${s} ${u} de côté. Écris ${ask}.`;
      value = wantsArea ? s * s : 4 * s;
    }
    return {
      type: "short-answer",
      prompt,
      payload: { acceptedAnswers: [String(value)], game: originOf("cm1-per-ecrire", ctx), concept: "calculer un périmètre ou une aire et l'écrire" },
      answerKey: String(value),
      hints: wantsArea ? [...AREA_HINTS] : [...PERIMETER_HINTS],
    };
  });
}

type AreaThing = { subject: string; unit: "cm²" | "m²" };
/** Douze choses, six petites et six grandes : l'unité d'aire qui va avec la taille de la chose. */
export const AREA_THINGS: readonly AreaThing[] = [
  { subject: "Un timbre", unit: "cm²" },
  { subject: "Une carte postale", unit: "cm²" },
  { subject: "Une page de cahier", unit: "cm²" },
  { subject: "Un carreau de carrelage", unit: "cm²" },
  { subject: "Une photo d'identité", unit: "cm²" },
  { subject: "Une pièce de monnaie", unit: "cm²" },
  { subject: "Une salle de classe", unit: "m²" },
  { subject: "Une cour de récréation", unit: "m²" },
  { subject: "Un terrain de basket", unit: "m²" },
  { subject: "Un jardin", unit: "m²" },
  { subject: "Un tapis de salon", unit: "m²" },
  { subject: "Un champ de mil", unit: "m²" },
];

/** « Une salle de classe a une aire qui se mesure en ___. » : m², avec cm² et une unité de longueur pour mauvais choix. */
export function makeCm1PerUnit(ctx: GameContext): GeneratedGame {
  return gapGame(ctx, "cm1-per-unite", "choisir l'unité d'une aire", () => {
    const thing = pickFresh(ctx, AREA_THINGS, (row) => `cm1-per:unite:${row.subject}`);
    const other = thing.unit === "cm²" ? "m²" : "cm²";
    const length = thing.unit === "cm²" ? "cm" : "m";
    return {
      prompt: "Complète la phrase.",
      text: `${thing.subject} a une aire qui se mesure en ___.`,
      answer: thing.unit,
      wrong: [other, length],
      hints: ["Imagine la taille de la chose.", "Une petite surface se mesure avec une petite unité, une grande surface avec une grande.", "Une aire se mesure toujours avec une unité au carré."],
    };
  });
}

type AreaConversion = { from: "m²" | "dm²" | "cm²"; to: "m²" | "dm²" | "cm²"; factor: number; down: boolean; top: number };
const AREA_CONVERSIONS: Record<Step, readonly AreaConversion[]> = {
  1: [{ from: "dm²", to: "cm²", factor: 100, down: true, top: 9 }],
  2: [{ from: "m²", to: "dm²", factor: 100, down: true, top: 9 }, { from: "dm²", to: "cm²", factor: 100, down: true, top: 20 }],
  3: [{ from: "m²", to: "cm²", factor: 10000, down: true, top: 9 }, { from: "m²", to: "dm²", factor: 100, down: true, top: 30 }],
  4: [{ from: "cm²", to: "dm²", factor: 100, down: false, top: 30 }, { from: "dm²", to: "m²", factor: 100, down: false, top: 30 }, { from: "m²", to: "cm²", factor: 10000, down: true, top: 9 }],
  5: [{ from: "cm²", to: "m²", factor: 10000, down: false, top: 20 }, { from: "m²", to: "cm²", factor: 10000, down: true, top: 20 }, { from: "dm²", to: "cm²", factor: 100, down: true, top: 90 }, { from: "cm²", to: "dm²", factor: 100, down: false, top: 90 }],
};

/** « 3 m² = ___ cm² » ou « 500 cm² = ___ dm² » : cent fois, dix mille fois. */
export function makeCm1PerConversion(ctx: GameContext): GeneratedGame {
  return gapGame(ctx, "cm1-per-conversion", "convertir des unités d'aire", () => {
    const c = pick(ctx.rng, AREA_CONVERSIONS[stepOf(ctx)]);
    const k = randomInt(ctx.rng, 2, c.top);
    const shown = c.down ? k : k * c.factor;
    const answer = c.down ? k * c.factor : k;
    return {
      prompt: "Complète avec le bon nombre.",
      text: `${show(shown)} ${c.from} = ___ ${c.to}`,
      answer: show(answer),
      // L'erreur d'enfant : croire qu'une unité d'aire vaut dix ou cent fois la petite, comme pour une longueur.
      wrong: wrongNumbers(ctx, answer, [answer * 10, answer / 10, c.down ? k * 100 : k * 10, c.down ? k * 10 : k * 1000, shown * 10], 1, 99999999),
      hints: [
        "Une aire se mesure avec des carrés : une unité au carré contient beaucoup de petits carrés.",
        c.down ? "On passe à une unité plus petite : il faut beaucoup plus de carrés." : "On passe à une unité plus grande : il faut beaucoup moins de carrés.",
        "Un décimètre carré contient dix fois dix centimètres carrés, et un mètre carré contient dix fois dix décimètres carrés.",
      ],
    };
  });
}

/** « Relie chaque rectangle à son périmètre. » (ou à son aire) : trois rectangles de valeurs différentes. */
export function makeCm1PerLinks(ctx: GameContext): GeneratedGame {
  return linkGame(ctx, "cm1-per-relier", "relier un rectangle et son périmètre ou son aire", () => {
    const u = unitOf(ctx);
    const wantsArea = ctx.rng() < 0.5;
    const value = wantsArea ? areaOf : perimeterOf;
    const rects: Rect[] = [];
    for (let attempt = 0; attempt < 60 && rects.length < 3; attempt++) {
      const r = drawRect(ctx);
      if (!rects.some((other) => value(other) === value(r))) rects.push(r);
    }
    return {
      prompt: `Relie chaque rectangle à ${wantsArea ? "son aire" : "son périmètre"}.`,
      pairs: rects.map((r) => ({ left: sized(r, u), right: wantsArea ? `${show(areaOf(r))} ${u}²` : `${show(perimeterOf(r))} ${u}` })),
      hints: wantsArea ? [...AREA_HINTS] : [...PERIMETER_HINTS],
    };
  });
}

/** Six situations où l'on fait le tour d'une figure, six où l'on couvre sa surface. */
export const AROUND: readonly string[] = [
  "Clôturer un jardin",
  "Border un parterre de fleurs",
  "Faire le tour d'un terrain",
  "Tendre une corde autour d'une piste",
  "Poser une plinthe autour d'une pièce",
  "Entourer une photo d'un cadre",
];
export const COVER: readonly string[] = [
  "Carreler le sol d'une salle",
  "Peindre un mur",
  "Semer du gazon sur un terrain",
  "Couvrir un toit de tôle",
  "Recouvrir une table d'une nappe",
  "Cultiver un champ de maïs",
];

/** « Glisse chaque situation dans la bonne case. » : le tour d'une figure (le périmètre) ou sa surface (l'aire). */
export function makeCm1PerSort(ctx: GameContext): GeneratedGame {
  return sortGame(ctx, "cm1-per-glisser", "distinguer le périmètre et l'aire dans une situation", () => {
    const each = stepOf(ctx) === 1 ? 2 : 3;
    const around = shuffle(ctx.rng, AROUND).slice(0, each);
    const cover = shuffle(ctx.rng, COVER).slice(0, each);
    return {
      prompt: "Glisse chaque situation dans la bonne case.",
      zones: ["Périmètre", "Aire"],
      items: [...around.map((text) => ({ text, zone: "Périmètre" })), ...cover.map((text) => ({ text, zone: "Aire" }))],
      hints: ["Demande-toi si on suit le bord de la figure ou si on couvre toute sa surface.", "Suivre le bord se mesure avec une longueur.", "Couvrir se mesure avec des carrés."],
    };
  });
}

type ProblemForm = "carre-tour" | "rectangle-tour" | "salle" | "grillage" | "peinture";
const PROBLEM_FORMS: Record<Step, readonly ProblemForm[]> = {
  1: ["carre-tour"],
  2: ["carre-tour", "rectangle-tour"],
  3: ["rectangle-tour", "salle"],
  4: ["grillage", "salle", "rectangle-tour"],
  5: ["grillage", "peinture", "salle"],
};
const PROBLEM_HINTS: Hints = ["Lis le problème en entier et cherche ce qu'on demande.", "Demande-toi s'il faut le tour de la figure ou sa surface.", "Calcule d'abord la mesure, puis le prix s'il y en a un."];

/** Un petit problème : une clôture (le périmètre), un sol à carreler (l'aire), un prix par mètre ou par mètre carré. */
export function makeCm1PerProblem(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "cm1-per-probleme", "résoudre un petit problème de périmètre ou d'aire", () => {
    const step = stepOf(ctx);
    const form = pick(ctx.rng, PROBLEM_FORMS[step]);
    if (form === "carre-tour") {
      const s = drawSide(ctx);
      return {
        prompt: `Un jardin carré mesure ${s} m de côté. On pose une clôture tout autour. Quelle longueur de clôture faut-il ?`,
        answer: `${show(4 * s)} m`,
        wrong: withUnit(wrongNumbers(ctx, 4 * s, [2 * s, s * s, s + 4, 3 * s], 1, 9999), "m"),
        hints: PROBLEM_HINTS,
      };
    }
    const r = drawRect(ctx);
    if (form === "rectangle-tour") {
      return {
        prompt: `Un champ rectangulaire mesure ${r.l} m de long et ${r.w} m de large. Un enfant en fait le tour à pied. Combien de mètres parcourt-il ?`,
        answer: `${show(perimeterOf(r))} m`,
        wrong: withUnit(wrongNumbers(ctx, perimeterOf(r), [r.l + r.w, areaOf(r), 2 * r.l + r.w], 1, 9999), "m"),
        hints: PROBLEM_HINTS,
      };
    }
    if (form === "salle") {
      return {
        prompt: `Une salle rectangulaire mesure ${r.l} m sur ${r.w} m. Quelle est la surface du sol à carreler ?`,
        answer: `${show(areaOf(r))} m²`,
        wrong: shuffle(ctx.rng, [`${show(perimeterOf(r))} m²`, `${show(areaOf(r))} m`, `${show(r.l + r.w)} m²`, `${show(areaOf(r) + r.l)} m²`]),
        hints: PROBLEM_HINTS,
      };
    }
    if (form === "grillage") {
      const price = pick(ctx.rng, [250, 500, 750]);
      const total = perimeterOf(r) * price;
      return {
        prompt: `Un jardin rectangulaire mesure ${r.l} m sur ${r.w} m. Le grillage coûte ${show(price)} FCFA le mètre. Combien coûte la clôture complète ?`,
        answer: `${show(total)} FCFA`,
        wrong: withUnit(wrongNumbers(ctx, total, [(r.l + r.w) * price, areaOf(r) * price, total + price, total - price].filter((n) => n % 250 === 0), 250, 9999999), "FCFA"),
        hints: PROBLEM_HINTS,
      };
    }
    const price = pick(ctx.rng, [250, 500, 750]);
    const total = areaOf(r) * price;
    return {
      prompt: `Un mur rectangulaire mesure ${r.l} m sur ${r.w} m. La peinture coûte ${show(price)} FCFA le mètre carré. Combien coûte la peinture du mur ?`,
      answer: `${show(total)} FCFA`,
      wrong: withUnit(wrongNumbers(ctx, total, [perimeterOf(r) * price, (r.l + r.w) * price, total + price, total - price].filter((n) => n % 250 === 0), 250, 9999999), "FCFA"),
      hints: PROBLEM_HINTS,
    };
  });
}
