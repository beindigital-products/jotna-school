/**
 * LES FIGURES DU CM1 : reconnaître une figure d'après ses côtés, ses sommets et ses angles, les droites parallèles et perpendiculaires, les instruments, compter, le rayon et le
 * diamètre d'un cercle (`ma-cm1-figures`, avec un dessin à reproduire sur quadrillage).
 *
 * Sur l'échantillon, le modèle écrivait « un rectangle a quatre côtés égaux » (c'est le carré), « un triangle isocèle a trois côtés égaux » (c'est l'équilatéral) et proposait
 * « carré » et « rectangle » ensemble sous « quatre angles droits ». Ici chaque question est bâtie sur un tableau FERMÉ de propriétés : une figure a ou n'a pas une propriété, et le
 * code ne propose jamais un mauvais choix qui aurait toutes les propriétés demandées.
 *
 * - SEPT FIGURES : le carré, le rectangle, le parallélogramme (un parallélogramme quelconque), le triangle équilatéral, le triangle isocèle, le triangle rectangle et le cercle.
 *   Jamais un losange, un trapèze ni un polygone à cinq côtés.
 * - UNE PROPRIÉTÉ vraie, fausse ou INCERTAINE pour une figure : un triangle isocèle peut avoir un angle droit, un parallélogramme peut être un rectangle, un triangle rectangle peut avoir
 *   deux côtés égaux. Une figure n'est jamais un mauvais choix pour une question dont elle est incertaine : ce serait une seconde bonne réponse possible. Le carré est un rectangle et un
 *   parallélogramme : quand la bonne réponse est l'une de ces figures, l'autre qui a aussi les propriétés demandées ne se propose jamais.
 * - LES MOTS : les noms sont nus, avec une majuscule (« Carré », « Triangle isocèle »), sans article ; « exactement deux côtés de même longueur » distingue l'isocèle de l'équilatéral.
 * - LES CINQ PALIERS (`stepOf`) : une propriété d'abord, deux ensuite ; les mauvais choix qui ressemblent le plus à la bonne figure dès le quatrième palier ; un rayon de 2 à 90.
 * - Les énoncés n'ont aucun « : », au plus une apostrophe droite, vingt-huit mots au plus. Aucun indice n'écrit un chiffre ni le nom d'une figure.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { fresh, originOf, pick, pickFresh, randomInt, shuffle, type GameContext, type GeneratedGame } from "./shared";
import { choiceGame, gapGame, linkGame, sortGame, type Hints } from "./tableaux";
import { ce2Question, hints, qr, windowAt } from "./ce2Outils";
import { show, stepOf, wrongNumbers, type Step } from "./cm1MathsOutils";

// ===========================================================================
// LE TABLEAU DES FIGURES
// ===========================================================================

export type StatementId = "s4" | "s3" | "r4" | "r1" | "e4" | "e3" | "e2" | "p2" | "v3" | "v4" | "o2" | "r0" | "c1" | "c2";

/** Les phrases : « a quatre côtés », « n'a aucun sommet ». Celles qui commencent par « a » se regroupent (« a quatre côtés et quatre angles droits »). */
export const PHRASES: Record<StatementId, string> = {
  s4: "a quatre côtés",
  s3: "a trois côtés",
  r4: "a quatre angles droits",
  r1: "a un seul angle droit",
  e4: "a quatre côtés de même longueur",
  e3: "a trois côtés de même longueur",
  e2: "a exactement deux côtés de même longueur",
  p2: "a ses côtés opposés parallèles",
  v3: "a trois sommets",
  v4: "a quatre sommets",
  o2: "a ses côtés opposés de même longueur",
  r0: "n'a aucun angle droit",
  c1: "n'a aucun sommet",
  c2: "se trace avec un compas",
};

export type Figure = {
  id: string;
  /** Le nom nu, avec une majuscule. */
  name: string;
  /** Le nom nu, sans majuscule (dans une phrase à trou). */
  noun: string;
  has: readonly StatementId[];
  /** Les propriétés qu'on ne peut pas dire vraies ni fausses de cette figure : elle n'est jamais un mauvais choix pour elles. */
  unsure: readonly StatementId[];
  /** Les nombres qu'on peut demander ; `null` quand on ne peut pas trancher (un isocèle peut avoir un angle droit). */
  counts: { sides: number; vertices: number; rights: number | null; parallelPairs: number };
};

export const FIGURES: readonly Figure[] = [
  { id: "carre", name: "Carré", noun: "carré", has: ["s4", "r4", "e4", "p2", "v4", "o2"], unsure: [], counts: { sides: 4, vertices: 4, rights: 4, parallelPairs: 2 } },
  { id: "rectangle", name: "Rectangle", noun: "rectangle", has: ["s4", "r4", "p2", "v4", "o2"], unsure: ["e4"], counts: { sides: 4, vertices: 4, rights: 4, parallelPairs: 2 } },
  { id: "parallelogramme", name: "Parallélogramme", noun: "parallélogramme", has: ["s4", "p2", "v4", "o2"], unsure: ["e4", "r4", "r1", "r0"], counts: { sides: 4, vertices: 4, rights: null, parallelPairs: 2 } },
  { id: "equilateral", name: "Triangle équilatéral", noun: "triangle équilatéral", has: ["s3", "e3", "v3", "r0"], unsure: [], counts: { sides: 3, vertices: 3, rights: 0, parallelPairs: 0 } },
  { id: "isocele", name: "Triangle isocèle", noun: "triangle isocèle", has: ["s3", "e2", "v3"], unsure: ["r0", "r1", "e3"], counts: { sides: 3, vertices: 3, rights: null, parallelPairs: 0 } },
  { id: "triangle-rectangle", name: "Triangle rectangle", noun: "triangle rectangle", has: ["s3", "r1", "v3"], unsure: ["e2"], counts: { sides: 3, vertices: 3, rights: 1, parallelPairs: 0 } },
  { id: "cercle", name: "Cercle", noun: "cercle", has: ["c1", "c2", "r0"], unsure: [], counts: { sides: 0, vertices: 0, rights: 0, parallelPairs: 0 } },
];

const FIGURE_HINTS: Hints = ["Pense aux côtés, aux sommets et aux angles de chaque figure.", "Élimine les figures qui n'ont pas la première propriété.", "Une seule figure a toutes les propriétés demandées."];

/**
 * « a quatre côtés et quatre angles droits », « a quatre côtés et n'a aucun angle droit », « n'a aucun sommet et aucun angle droit », « se trace avec un compas » : les propriétés en
 * une phrase. Celles qui commencent par « a » se regroupent, celles qui commencent par « n'a » aussi (une seule apostrophe), les autres suivent.
 */
export function sentence(ids: readonly StatementId[]): string {
  const withA = ids.filter((id) => PHRASES[id].startsWith("a ")).map((id) => PHRASES[id].slice(2));
  const withNot = ids.filter((id) => PHRASES[id].startsWith("n'a ")).map((id) => PHRASES[id].slice(4));
  const others = ids.filter((id) => !PHRASES[id].startsWith("a ") && !PHRASES[id].startsWith("n'a ")).map((id) => PHRASES[id]);
  return [withA.length > 0 ? `a ${withA.join(" et ")}` : "", withNot.length > 0 ? `n'a ${withNot.join(" et ")}` : "", ...others].filter(Boolean).join(" et ");
}

/** Une figure peut-elle servir de mauvais choix ? Seulement si une propriété demandée lui manque à coup sûr. */
const failsSurely = (figure: Figure, wanted: readonly StatementId[]) => wanted.some((id) => !figure.has.includes(id) && !figure.unsure.includes(id));

type Question = { target: Figure; wanted: StatementId[]; distractors: Figure[] };

/** Toutes les questions possibles : d'abord une propriété, puis deux ; seulement celles qui laissent au moins deux mauvais choix. */
function allQuestions(): Question[] {
  const out: Question[] = [];
  for (const size of [1, 2]) {
    for (const target of FIGURES) {
      const sets = size === 1 ? target.has.map((id) => [id]) : target.has.flatMap((a, i) => target.has.slice(i + 1).map((b) => [a, b]));
      for (const wanted of sets) {
        const distractors = FIGURES.filter((figure) => figure.id !== target.id && failsSurely(figure, wanted));
        if (distractors.length >= 2) out.push({ target, wanted, distractors });
      }
    }
  }
  return out;
}
const QUESTIONS = allQuestions();

/**
 * Une question du palier, qu'aucun exercice du palier n'a déjà posée : la liste va des questions à une propriété à celles qui en demandent deux, découpée en cinq fenêtres, une par
 * palier, donc une même question ne revient pas d'un palier à l'autre. Les deux mauvais choix sont tirés au hasard, les plus ressemblants à la bonne figure d'abord dès le quatrième palier.
 */
export function drawQuestion(ctx: GameContext): { target: Figure; wanted: StatementId[]; options: Figure[] } {
  const step = stepOf(ctx);
  const window = windowAt(QUESTIONS, step - 1, 5, 3);
  const question = pickFresh(ctx, window, (candidate) => `cm1-fig:q:${candidate.target.id}:${candidate.wanted.join(",")}`);
  const overlap = (figure: Figure) => question.wanted.filter((id) => figure.has.includes(id)).length;
  const ranked = step >= 4 ? [...shuffle(ctx.rng, question.distractors)].sort((a, b) => overlap(b) - overlap(a)) : shuffle(ctx.rng, question.distractors);
  return { target: question.target, wanted: question.wanted, options: [question.target, ranked[0], ranked[1]] };
}

// ===========================================================================
// RECONNAÎTRE UNE FIGURE
// ===========================================================================

/** « Quelle figure a quatre angles droits et quatre côtés de même longueur ? » : Carré. */
export function makeCm1FigFigure(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "cm1-fig-figure", "reconnaître une figure d'après ses propriétés", () => {
    const { target, wanted, options } = drawQuestion(ctx);
    return {
      prompt: `Quelle figure ${sentence(wanted)} ?`,
      answer: target.name,
      wrong: options.slice(1).map((figure) => figure.name),
      hints: FIGURE_HINTS,
    };
  });
}

/** « Un ___ a trois côtés de même longueur. » : triangle équilatéral. */
export function makeCm1FigGap(ctx: GameContext): GeneratedGame {
  return gapGame(ctx, "cm1-fig-trou", "compléter une phrase sur une figure", () => {
    const { target, wanted, options } = drawQuestion(ctx);
    return {
      prompt: "Complète la phrase.",
      text: `Un ___ ${sentence(wanted)}.`,
      answer: target.noun,
      wrong: options.slice(1).map((figure) => figure.noun),
      hints: FIGURE_HINTS,
    };
  });
}

/** Les propriétés qu'une figure a et que les autres du groupe n'ont pas du tout (ni vraies ni incertaines). */
const exclusiveOf = (figure: Figure, others: readonly Figure[]) => figure.has.filter((id) => others.every((other) => !other.has.includes(id) && !other.unsure.includes(id)));

/** Tous les groupes de trois figures dont chacune a une description que les deux autres n'ont pas. */
function allTriples(): Figure[][] {
  const out: Figure[][] = [];
  for (let i = 0; i < FIGURES.length; i++) {
    for (let j = i + 1; j < FIGURES.length; j++) {
      for (let k = j + 1; k < FIGURES.length; k++) {
        const group = [FIGURES[i], FIGURES[j], FIGURES[k]];
        if (group.every((figure) => exclusiveOf(figure, group.filter((other) => other !== figure)).length > 0)) out.push(group);
      }
    }
  }
  return out;
}
const TRIPLES = allTriples();

/** « Relie chaque figure à sa description. » : trois figures, une description que les deux autres n'ont pas. */
export function makeCm1FigLinks(ctx: GameContext): GeneratedGame {
  return linkGame(ctx, "cm1-fig-relier", "relier une figure et sa description", () => {
    const group = pickFresh(ctx, windowAt(TRIPLES, stepOf(ctx) - 1, 5, 3), (candidate) => `cm1-fig:triple:${candidate.map((figure) => figure.id).join(",")}`);
    const rows = shuffle(ctx.rng, group).map((figure) => ({ left: figure.name, right: `Il ${PHRASES[pick(ctx.rng, exclusiveOf(figure, group.filter((other) => other !== figure)))]}` }));
    return {
      prompt: "Relie chaque figure à sa description.",
      pairs: rows,
      hints: ["Lis chaque description en entier.", "Commence par la figure que tu connais le mieux.", "Chaque description va avec une seule figure."],
    };
  });
}

// ===========================================================================
// LES DROITES ET LES INSTRUMENTS
// ===========================================================================

const LINE_HINTS: Hints = hints("Pense à la façon dont les deux droites se placent.", "Imagine-les prolongées très loin des deux côtés.", "Si elles se rencontrent, regarde le coin qu'elles forment.");
const PARALLEL = "Parallèles";
const PERPENDICULAR = "Perpendiculaires";
const NEITHER = "Ni l'un ni l'autre";
const line = (prompt: string, answer: string) => qr(prompt, answer, [PARALLEL, PERPENDICULAR, NEITHER].filter((option) => option !== answer) as unknown as [string, string], LINE_HINTS);

/** Douze questions : deux côtés qui se font face, deux côtés qui se suivent, des droites de la vie de tous les jours. */
export const LINE_ROWS = [
  line("Dans un carré, deux côtés qui se font face sont des droites comment ?", PARALLEL),
  line("Dans un carré, deux côtés qui se suivent sont des droites comment ?", PERPENDICULAR),
  line("Les lignes d'une page de cahier sont des droites comment ?", PARALLEL),
  line("Dans un rectangle, deux côtés qui se suivent sont des droites comment ?", PERPENDICULAR),
  line("Dans un rectangle, deux côtés qui se font face sont des droites comment ?", PARALLEL),
  line("Deux rails d'une voie ferrée droite sont des droites comment ?", PARALLEL),
  line("Dans un triangle rectangle, les deux côtés de l'angle droit sont des droites comment ?", PERPENDICULAR),
  line("Le bord du haut et le bord de côté d'une feuille sont des droites comment ?", PERPENDICULAR),
  line("Dans un parallélogramme, deux côtés qui se font face sont des droites comment ?", PARALLEL),
  line("Dans un parallélogramme sans angle droit, deux côtés qui se suivent sont des droites comment ?", NEITHER),
  line("Dans un triangle équilatéral, deux côtés qui se suivent sont des droites comment ?", NEITHER),
  line("Le mur et le sol d'une pièce forment un coin droit. Ce sont des droites comment ?", PERPENDICULAR),
];

/** « Dans un rectangle, deux côtés qui se font face sont des droites comment ? » : parallèles, perpendiculaires, ou ni l'un ni l'autre. */
export function makeCm1FigLines(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "cm1-fig-droites", "distinguer des droites parallèles et perpendiculaires", LINE_ROWS);
}

const TOOL_HINTS: Hints = hints("Pense à ce que fait chaque instrument.", "Chaque instrument sert à un seul travail.", "Imagine le geste de ta main.");
const RULER = "Règle";
const SQUARE_TOOL = "Équerre";
const COMPASS = "Compas";
const tool = (task: string, answer: string) => qr(`Quel instrument faut-il pour ${task} ?`, answer, [RULER, SQUARE_TOOL, COMPASS].filter((option) => option !== answer) as unknown as [string, string], TOOL_HINTS);

/** Quinze tâches, trois par palier : un seul instrument y répond. */
export const TOOL_ROWS = [
  tool("tracer un segment bien droit", RULER),
  tool("tracer un cercle", COMPASS),
  tool("vérifier qu'un angle est droit", SQUARE_TOOL),
  tool("mesurer la longueur d'un côté", RULER),
  tool("tracer deux droites perpendiculaires", SQUARE_TOOL),
  tool("tracer un arc de cercle", COMPASS),
  tool("relier deux points par une droite", RULER),
  tool("construire un angle droit", SQUARE_TOOL),
  tool("reporter une longueur sur une droite", COMPASS),
  tool("tracer le rayon d'un cercle", RULER),
  tool("contrôler les coins d'un carré", SQUARE_TOOL),
  tool("placer des points à la même distance d'un point", COMPASS),
  tool("mesurer le diamètre d'un cercle tracé", RULER),
  tool("vérifier les angles d'un rectangle", SQUARE_TOOL),
  tool("dessiner un cercle de centre donné", COMPASS),
];

/** « Quel instrument faut-il pour tracer un cercle ? » : la règle, l'équerre ou le compas. */
export function makeCm1FigTool(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "cm1-fig-outil", "choisir l'instrument du géomètre", TOOL_ROWS);
}

// ===========================================================================
// COMPTER, LE RAYON ET LE DIAMÈTRE
// ===========================================================================

type Thing = { word: string; ask: string; value: (figure: Figure) => number | null };
const THINGS: readonly Thing[] = [
  { word: "côtés", ask: "Combien de côtés", value: (figure) => figure.counts.sides },
  { word: "sommets", ask: "Combien de sommets", value: (figure) => figure.counts.vertices },
  { word: "angles droits", ask: "Combien d'angles droits", value: (figure) => figure.counts.rights },
  { word: "paires de côtés parallèles", ask: "Combien de paires de côtés parallèles", value: (figure) => figure.counts.parallelPairs },
];

type CountQuestion = { question: string; value: number };

/** Toutes les questions de comptage qu'on peut trancher : une figure, ce qu'on compte, le nombre. */
const COUNT_QUESTIONS: CountQuestion[] = THINGS.flatMap((thing) =>
  FIGURES.flatMap((figure) => {
    const value = thing.value(figure);
    return value === null ? [] : [{ question: `${thing.ask} a un ${figure.noun}`, value }];
  }),
);

/** Une question de comptage du palier (une fenêtre de la liste par palier), qu'aucun exercice du palier n'a déjà posée. */
function drawCount(ctx: GameContext): CountQuestion {
  return pickFresh(ctx, windowAt(COUNT_QUESTIONS, stepOf(ctx) - 1, 5, 3), (candidate) => `cm1-fig:compte:${candidate.question}`);
}

/** « Combien de sommets a un triangle rectangle ? » : un nombre, à choisir parmi trois. */
export function makeCm1FigCount(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "cm1-fig-compter", "compter les côtés, les sommets et les angles d'une figure", () => {
    const { question, value } = drawCount(ctx);
    return {
      prompt: `${question} ?`,
      answer: String(value),
      wrong: shuffle(ctx.rng, [0, 1, 2, 3, 4, 5].filter((n) => n !== value)).map(String),
      hints: ["Dessine la figure dans ta tête.", "Compte un par un ce que la question demande.", "Une paire, ce sont deux côtés qui se font face."],
    };
  });
}

/** Le rayon d'un cercle par palier : de plus en plus grand. */
const RADIUS: Record<Step, readonly [number, number]> = { 1: [2, 9], 2: [3, 15], 3: [5, 25], 4: [10, 50], 5: [12, 90] };
const RADIUS_HINTS: Hints = ["Le diamètre traverse le cercle en passant par le centre.", "Le rayon va du centre jusqu'au bord du cercle.", "Le diamètre est fait de deux rayons."];

/** « Un cercle a un rayon de 6 cm. Son diamètre mesure ___ cm. » ou l'inverse. */
export function makeCm1FigRadius(ctx: GameContext): GeneratedGame {
  return gapGame(ctx, "cm1-fig-rayon", "passer du rayon au diamètre d'un cercle", () => {
    const r = randomInt(ctx.rng, ...RADIUS[stepOf(ctx)]);
    const u = stepOf(ctx) <= 2 ? "cm" : pick(ctx.rng, ["cm", "m"]);
    if (ctx.rng() < 0.5) {
      return {
        prompt: "Complète avec le bon nombre.",
        text: `Un cercle a un rayon de ${r} ${u}. Son diamètre mesure ___ ${u}.`,
        answer: show(2 * r),
        wrong: wrongNumbers(ctx, 2 * r, [r, 3 * r, 2 * r + 2, 2 * r - 2, r + 2], 1, 999),
        hints: RADIUS_HINTS,
      };
    }
    return {
      prompt: "Complète avec le bon nombre.",
      text: `Un cercle a un diamètre de ${show(2 * r)} ${u}. Son rayon mesure ___ ${u}.`,
      answer: show(r),
      wrong: wrongNumbers(ctx, r, [2 * r, 4 * r, r + 1, r - 1, 2 * r - 2], 1, 999),
      hints: RADIUS_HINTS,
    };
  });
}

/** « Combien de côtés a un carré ? Écris le nombre. » ou « Un cercle a un rayon de 7 cm. Écris son diamètre en cm. » : une réponse courte. */
export function makeCm1FigWrite(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "cm1-fig-ecrire", () => {
    let prompt: string;
    let value: number;
    if (ctx.rng() < 0.5) {
      const r = randomInt(ctx.rng, ...RADIUS[stepOf(ctx)]);
      const u = stepOf(ctx) <= 2 ? "cm" : pick(ctx.rng, ["cm", "m"]);
      if (ctx.rng() < 0.5) {
        prompt = `Un cercle a un rayon de ${r} ${u}. Écris son diamètre en ${u}.`;
        value = 2 * r;
      } else {
        prompt = `Un cercle a un diamètre de ${show(2 * r)} ${u}. Écris son rayon en ${u}.`;
        value = r;
      }
    } else {
      const count = drawCount(ctx);
      prompt = `${count.question} ? Écris le nombre.`;
      value = count.value;
    }
    return {
      type: "short-answer",
      prompt,
      payload: { acceptedAnswers: [String(value)], game: originOf("cm1-fig-ecrire", ctx), concept: "compter ou mesurer sur une figure" },
      answerKey: String(value),
      hints: ["Dessine la figure dans ta tête.", "Compte ou calcule ce que la question demande.", "Le diamètre est fait de deux rayons."],
    };
  });
}

// ===========================================================================
// CLASSER
// ===========================================================================

type Classification = { zones: readonly [string, string]; yes: readonly string[]; no: readonly string[] };
/** Trois façons de classer les figures, sans figure incertaine : les côtés, les côtés parallèles, les triangles et les quadrilatères. */
export const CLASSIFICATIONS: readonly Classification[] = [
  { zones: ["Quatre côtés", "Trois côtés"], yes: ["Carré", "Rectangle", "Parallélogramme"], no: ["Triangle équilatéral", "Triangle isocèle", "Triangle rectangle"] },
  { zones: ["A des côtés parallèles", "N'a pas de côtés parallèles"], yes: ["Carré", "Rectangle", "Parallélogramme"], no: ["Triangle équilatéral", "Triangle isocèle", "Triangle rectangle", "Cercle"] },
  { zones: ["Triangles", "Quadrilatères"], yes: ["Triangle équilatéral", "Triangle isocèle", "Triangle rectangle"], no: ["Carré", "Rectangle", "Parallélogramme"] },
];

/** « Glisse chaque figure dans la bonne case. » : quatre côtés ou trois, côtés parallèles ou non, triangles ou quadrilatères. */
export function makeCm1FigSort(ctx: GameContext): GeneratedGame {
  return sortGame(ctx, "cm1-fig-glisser", "classer des figures d'après leurs côtés", () => {
    const each = stepOf(ctx) === 1 ? 2 : 3;
    const classification = pick(ctx.rng, CLASSIFICATIONS);
    const [yesZone, noZone] = classification.zones;
    return {
      prompt: "Glisse chaque figure dans la bonne case.",
      zones: [yesZone, noZone],
      items: [
        ...shuffle(ctx.rng, classification.yes).slice(0, each).map((text) => ({ text, zone: yesZone })),
        ...shuffle(ctx.rng, classification.no).slice(0, each).map((text) => ({ text, zone: noZone })),
      ],
      hints: ["Dessine chaque figure dans ta tête.", "Regarde ce que la case demande, puis teste chaque figure.", "Les figures d'une même case se ressemblent."],
    };
  });
}
