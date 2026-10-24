/**
 * SYMÉTRIE ET TRANSLATION AU CM2 (`ma-cm2-symetrie`) : les axes de symétrie d'une figure, le symétrique d'un point sur un quadrillage, la translation d'un point,
 * les solides (cube, pavé droit, cylindre).
 *
 * La thématique garde trois dessins à compléter par symétrie (`pixel-symetrie`) ; les sept autres exercices n'avaient aucun jeu de code. Ici la réponse est
 * CALCULÉE ou lue dans un tableau FERMÉ : le symétrique d'une colonne `p` par rapport à la colonne `a` est `2a - p`, une translation ajoute ses déplacements aux
 * coordonnées, la somme des arêtes d'un cube est douze fois son arête.
 *
 * CE QUE CE FICHIER NE FAIT PAS SORTIR DE LA FICHE
 * - Les figures sont celles du CE2 (carré, rectangle de 6 cm sur 4 cm, triangle équilatéral, losange sans angle droit, parallélogramme sans angle droit, triangle
 *   aux trois côtés inégaux, triangle à deux côtés égaux, quelques lettres) et, au dernier palier, le pentagone et l'hexagone réguliers (cinq et six axes). Jamais
 *   le cercle, qui en a une infinité. Un rectangle est toujours donné avec ses mesures : un carré est un rectangle, et il a quatre axes.
 * - Un symétrique se compte en colonnes ou en lignes d'un quadrillage : le point et son symétrique sont à la même distance de l'axe, de part et d'autre.
 * - Une translation se lit dans des coordonnées « (4 ; 3) » : le premier nombre compte les carreaux vers la droite, le second vers le haut. Les mots « abscisse » et
 *   « ordonnée » ne sont pas employés. Aucun résultat n'est négatif.
 * - Le cube et le pavé droit ont six faces, douze arêtes et huit sommets ; le cylindre n'est compté que par ses sommets (aucun) : ses faces et ses arêtes se comptent
 *   de plusieurs façons, la fiche ne tranche pas. La somme des longueurs des arêtes est servie en centimètres.
 * - Les erreurs d'enfant : compter la colonne de l'axe, additionner le point et l'axe, oublier un déplacement, échanger les deux coordonnées, mélanger faces,
 *   arêtes et sommets.
 * - Les énoncés n'ont aucun « : », au plus une apostrophe droite, vingt-huit mots au plus. « A' » ne s'écrit pas : le symétrique s'appelle B. Aucun indice n'écrit un chiffre.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { pick, randomInt, shuffle, type GameContext, type GeneratedGame } from "./shared";
import { choiceGame, gapGame, linkGame, sortGame } from "./tableaux";
import { show, stepOf, wrongNumbers, type Step } from "./cm1MathsOutils";

// ===========================================================================
// LES FIGURES ET LEURS AXES
// ===========================================================================

type Figure = { text: string; tile: string; axes: number };
const figure = (text: string, tile: string, axes: number): Figure => ({ text, tile, axes });
const letter = (name: string, axes: number): Figure => figure(`la lettre ${name}`, `La lettre ${name}`, axes);

const SQUARE = figure("un carré", "Un carré", 4);
const RECTANGLE = figure("un rectangle de 6 cm sur 4 cm", "Un rectangle de 6 cm sur 4 cm", 2);
const EQUILATERAL = figure("un triangle équilatéral", "Un triangle équilatéral", 3);
const RHOMBUS = figure("un losange sans angle droit", "Un losange sans angle droit", 2);
const TWO_EQUAL = figure("un triangle qui a deux côtés égaux et un troisième plus long", "Un triangle à deux côtés égaux", 1);
const PARALLELOGRAM = figure("un parallélogramme sans angle droit", "Un parallélogramme sans angle droit", 0);
const UNEQUAL = figure("un triangle aux trois côtés inégaux", "Un triangle aux trois côtés inégaux", 0);
const PENTAGON = figure("un pentagone régulier", "Un pentagone régulier", 5);
const HEXAGON = figure("un hexagone régulier", "Un hexagone régulier", 6);
const LETTERS: readonly Figure[] = [letter("H", 2), letter("X", 2), letter("A", 1), letter("T", 1), letter("M", 1), letter("F", 0), letter("R", 0), letter("Z", 0), letter("N", 0)];

const FIGURES_BY_STEP: Record<Step, readonly Figure[]> = {
  1: [SQUARE, RECTANGLE, EQUILATERAL, PARALLELOGRAM, UNEQUAL],
  2: [SQUARE, RECTANGLE, EQUILATERAL, RHOMBUS, TWO_EQUAL, PARALLELOGRAM, UNEQUAL],
  3: [SQUARE, RECTANGLE, EQUILATERAL, RHOMBUS, TWO_EQUAL, PARALLELOGRAM, UNEQUAL, ...LETTERS],
  4: [SQUARE, RECTANGLE, EQUILATERAL, RHOMBUS, TWO_EQUAL, PARALLELOGRAM, UNEQUAL, PENTAGON, HEXAGON, ...LETTERS],
  5: [SQUARE, RECTANGLE, EQUILATERAL, RHOMBUS, TWO_EQUAL, PARALLELOGRAM, UNEQUAL, PENTAGON, HEXAGON, ...LETTERS],
};

const COUNT_WORDS = ["zéro", "un", "deux", "trois", "quatre", "cinq", "six"] as const;
const AXES_PHRASE = ["aucun axe", "1 axe", "2 axes", "3 axes", "4 axes", "5 axes", "6 axes"] as const;

/** « Combien d'axes de symétrie a un carré ? » : le nombre d'axes de la figure, écrit en toutes lettres. */
export function makeCm2SymAxis(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "cm2-sym-axe", "compter les axes de symétrie d'une figure", () => {
    const shape = pick(ctx.rng, FIGURES_BY_STEP[stepOf(ctx)]);
    const prompt = `Combien d'axes de symétrie a ${shape.text} ?`;
    // Les mots du nombre que l'énoncé écrit déjà (« deux côtés égaux ») ne sont jamais un mauvais choix ; « un » est l'article de « un carré », pas un nombre.
    const written = new Set(COUNT_WORDS.filter((word) => word !== "un" && new RegExp(`(^|[^\\p{L}])${word}([^\\p{L}]|$)`, "u").test(prompt)));
    const candidates = [shape.axes + 1, shape.axes - 1, shape.axes + 2, shape.axes * 2, 2, 1, 3, 0].filter((n) => Number.isInteger(n) && n >= 0 && n <= 6 && n !== shape.axes && !written.has(COUNT_WORDS[n]));
    const wrong = shuffle(ctx.rng, [...new Set(candidates)]).slice(0, 2);
    return {
      prompt,
      answer: COUNT_WORDS[shape.axes],
      wrong: wrong.map((n) => COUNT_WORDS[n]),
      hints: [
        "Imagine que tu plies la figure le long d'une ligne.",
        "Un axe sépare la figure en parties qui se superposent exactement.",
        "Essaie les lignes droites l'une après l'autre, sans en oublier.",
      ],
    };
  });
}

/** « Relie chaque figure à son nombre d'axes de symétrie. » : trois figures de nombres d'axes différents. */
export function makeCm2SymLinks(ctx: GameContext): GeneratedGame {
  return linkGame(ctx, "cm2-sym-relier", "relier une figure à son nombre d'axes", () => {
    const pool = shuffle(ctx.rng, [...FIGURES_BY_STEP[stepOf(ctx)]]);
    const chosen = new Map<number, Figure>();
    for (const shape of pool) if (!chosen.has(shape.axes) && chosen.size < 3) chosen.set(shape.axes, shape);
    return {
      prompt: "Relie chaque figure à son nombre d'axes de symétrie.",
      pairs: [...chosen.values()].map((shape) => ({ left: shape.tile, right: AXES_PHRASE[shape.axes] })),
      hints: ["Pense à plier chaque figure en deux.", "Un axe sépare la figure en moitiés qui se superposent.", "Commence par la figure dont tu es le plus sûr."],
    };
  });
}

/** « Glisse chaque figure dans la bonne case. » : deux figures qui ont au moins un axe, deux qui n'en ont aucun. */
export function makeCm2SymSort(ctx: GameContext): GeneratedGame {
  return sortGame(ctx, "cm2-sym-glisser", "classer des figures selon leurs axes de symétrie", () => {
    const pool = FIGURES_BY_STEP[stepOf(ctx)];
    const zones: readonly [string, string] = ["Au moins un axe", "Aucun axe"];
    const withAxis = shuffle(ctx.rng, pool.filter((shape) => shape.axes > 0)).slice(0, 2);
    const without = shuffle(ctx.rng, pool.filter((shape) => shape.axes === 0)).slice(0, 2);
    return {
      prompt: "Glisse chaque figure dans la bonne case.",
      zones,
      items: [...withAxis.map((shape) => ({ text: shape.tile, zone: zones[0] })), ...without.map((shape) => ({ text: shape.tile, zone: zones[1] }))],
      hints: ["Imagine que tu plies chaque figure en deux.", "Une figure a un axe quand ses moitiés se superposent.", "Essaie d'abord les figures que tu connais le mieux."],
    };
  });
}

// ===========================================================================
// LE SYMÉTRIQUE D'UN POINT SUR UN QUADRILLAGE
// ===========================================================================

/** La plage de l'axe et la plus grande distance d'un point à l'axe, à chaque palier. */
const MIRROR: Record<Step, { axis: [number, number]; far: number }> = {
  1: { axis: [3, 8], far: 4 },
  2: { axis: [4, 10], far: 5 },
  3: { axis: [6, 15], far: 8 },
  4: { axis: [7, 18], far: 10 },
  5: { axis: [8, 20], far: 12 },
};

/** Un axe, un point et son symétrique : le point est à `distance` carreaux de l'axe, d'un côté ou de l'autre. */
function drawMirror(ctx: GameContext): { axis: number; point: number; mirror: number } {
  const { axis: range, far } = MIRROR[stepOf(ctx)];
  for (let attempt = 0; attempt < 100; attempt++) {
    const axis = randomInt(ctx.rng, range[0], range[1]);
    const distance = randomInt(ctx.rng, 1, Math.min(far, axis - 1));
    const left = stepOf(ctx) === 1 ? true : ctx.rng() < 0.5;
    const point = left ? axis - distance : axis + distance;
    const mirror = 2 * axis - point;
    if (point >= 1 && mirror >= 1 && point <= 30 && mirror <= 30) return { axis, point, mirror };
  }
  return { axis: 5, point: 3, mirror: 7 };
}

/** « Sur un quadrillage, A est dans la colonne 2 et l'axe de symétrie est la colonne 5. Dans quelle colonne est son symétrique B ? » */
export function makeCm2SymMirror(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "cm2-sym-miroir", "trouver le symétrique d'un point par rapport à un axe", () => {
    const step = stepOf(ctx);
    const { axis, point, mirror } = drawMirror(ctx);
    const kind = step >= 2 && ctx.rng() < 0.4 ? "ligne" : "colonne";
    // Aux deux derniers paliers, on connaît parfois le symétrique et on cherche le point.
    const inverse = step >= 4 && ctx.rng() < 0.5;
    const answer = inverse ? point : mirror;
    const given = inverse ? mirror : point;
    // Les erreurs d'enfant : compter la colonne de l'axe en trop ou en moins, additionner le point et l'axe, doubler l'axe, ne rien changer.
    const pool = [answer + 1, answer - 1, axis + given, axis * 2, given];
    return {
      prompt: inverse
        ? `Sur un quadrillage, B est dans la ${kind} ${given}. Il est le symétrique de A par rapport à la ${kind} ${axis}. Dans quelle ${kind} est A ?`
        : `Sur un quadrillage, A est dans la ${kind} ${given} et l'axe de symétrie est la ${kind} ${axis}. Dans quelle ${kind} est son symétrique B ?`,
      answer: show(answer),
      wrong: wrongNumbers(ctx, answer, pool, 1, 40, [given, axis]),
      hints: [
        "Un point et son symétrique sont à la même distance de l'axe.",
        `Cherche d'abord le nombre de carreaux entre ${inverse ? "B" : "le point"} et l'axe.`,
        "Avance du même nombre de carreaux de l'autre côté de l'axe.",
      ],
    };
  });
}

/** « Sur un quadrillage, A est dans la colonne 3 et son symétrique B dans la colonne 11. L'axe de symétrie est la colonne ___. » ou la distance au même axe. */
export function makeCm2SymGap(ctx: GameContext): GeneratedGame {
  return gapGame(ctx, "cm2-sym-trou", "compléter ce qu'on sait d'un point et de son symétrique", () => {
    const step = stepOf(ctx);
    const { axis, point, mirror } = drawMirror(ctx);
    const distance = Math.abs(axis - point);
    if (step <= 2 && distance >= 2 && ctx.rng() < 0.4) {
      return {
        prompt: "Complète avec le bon nombre.",
        text: `Un point est à ${distance} carreaux de la ligne de symétrie. Son symétrique est à ___ carreaux de cette ligne.`,
        answer: show(distance),
        wrong: wrongNumbers(ctx, distance, [distance * 2, distance + 1, distance - 1, 2 * distance + 1], 1, 40, []),
        hints: ["Un point et son symétrique sont à la même distance de la ligne.", "La distance ne change pas quand on passe de l'autre côté.", "Compte les carreaux entre le point et la ligne."],
      };
    }
    const [first, second] = point < mirror ? [point, mirror] : [mirror, point];
    return {
      prompt: "Complète avec le bon nombre.",
      text: `Sur un quadrillage, A est dans la colonne ${first} et son symétrique B dans la colonne ${second}. L'axe de symétrie est la colonne ___.`,
      answer: show(axis),
      wrong: wrongNumbers(ctx, axis, [first + second, Math.abs(second - first), axis + 1, axis - 1, (first + second) / 2 + 2], 1, 60, [first, second]),
      hints: ["Le symétrique est à la même distance de l'axe que le point.", "L'axe est au milieu entre le point et son symétrique.", "Cherche le nombre qui est au milieu des deux colonnes."],
    };
  });
}

// ===========================================================================
// LA TRANSLATION
// ===========================================================================

/** Les déplacements et la plage de départ à chaque palier : à droite seulement, un sens à la fois, droite et haut, les quatre sens. */
const SHIFT: Record<Step, { start: [number, number]; move: [number, number] }> = {
  1: { start: [1, 8], move: [1, 6] },
  2: { start: [1, 9], move: [1, 7] },
  3: { start: [1, 9], move: [1, 8] },
  4: { start: [3, 14], move: [1, 9] },
  5: { start: [4, 20], move: [1, 12] },
};

/** « Le point A(4 ; 3) est translaté de 5 carreaux vers la droite et de 2 vers le haut. Quelles sont ses nouvelles coordonnées ? » */
export function makeCm2SymShift(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "cm2-sym-translation", "translater un point sur un quadrillage", () => {
    const step = stepOf(ctx);
    const { start, move } = SHIFT[step];
    for (let attempt = 0; attempt < 200; attempt++) {
      const x = randomInt(ctx.rng, start[0], start[1]);
      const y = randomInt(ctx.rng, start[0], start[1]);
      // Les sens autorisés : à droite (1), un seul sens au choix (2), à droite et en haut (3), les quatre sens (4 et 5).
      let dx = 0;
      let dy = 0;
      if (step === 1) dx = randomInt(ctx.rng, move[0], move[1]);
      else if (step === 2) {
        if (ctx.rng() < 0.5) dx = randomInt(ctx.rng, move[0], move[1]);
        else dy = randomInt(ctx.rng, move[0], move[1]);
      } else if (step === 3) {
        dx = randomInt(ctx.rng, move[0], move[1]);
        dy = randomInt(ctx.rng, move[0], move[1]);
      } else {
        dx = randomInt(ctx.rng, move[0], move[1]) * (ctx.rng() < 0.5 ? 1 : -1);
        dy = randomInt(ctx.rng, move[0], move[1]) * (ctx.rng() < 0.5 ? 1 : -1);
      }
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0) continue;
      const side = (n: number, positive: string, negative: string, first: boolean) => `de ${Math.abs(n)} ${first ? "carreaux " : ""}vers ${n > 0 ? positive : negative}`;
      const parts: string[] = [];
      if (dx !== 0) parts.push(side(dx, "la droite", "la gauche", true));
      if (dy !== 0) parts.push(side(dy, "le haut", "le bas", parts.length === 0));
      const text = (a: number, b: number) => `(${a} ; ${b})`;
      // Les erreurs d'enfant : oublier un déplacement, échanger les deux coordonnées, inverser un sens, tout inverser.
      const pool = [[x + dx, y], [x, y + dy], [x + dy, y + dx], [x - dx, y - dy], [x + dx, y - dy], [x - dx, y + dy]].filter(([a, b]) => a >= 0 && b >= 0 && !(a === nx && b === ny) && !(a === x && b === y));
      const wrong = shuffle(ctx.rng, [...new Set(pool.map(([a, b]) => text(a, b)))]).slice(0, 2);
      if (wrong.length < 2) continue;
      return {
        prompt: `Le point A(${x} ; ${y}) est translaté ${parts.join(" et ")}. Quelles sont ses nouvelles coordonnées ?`,
        answer: text(nx, ny),
        wrong,
        hints: [
          "Une translation fait glisser le point sans le tourner.",
          "Le premier nombre des coordonnées compte vers la droite, le second vers le haut.",
          "Vers la gauche ou vers le bas, on retire des carreaux.",
        ],
      };
    }
    return { prompt: "Le point A(2 ; 3) est translaté de 4 carreaux vers la droite. Quelles sont ses nouvelles coordonnées ?", answer: "(6 ; 3)", wrong: ["(2 ; 7)", "(4 ; 3)"], hints: ["Une translation fait glisser le point sans le tourner.", "Le premier nombre des coordonnées compte vers la droite, le second vers le haut.", "Vers la gauche ou vers le bas, on retire des carreaux."] };
  });
}

// ===========================================================================
// LES SOLIDES
// ===========================================================================

/** Les nombres de faces, d'arêtes et de sommets du cube, du pavé droit et (sommets seulement) du cylindre. */
const COUNTS: { solid: string; part: "faces" | "arêtes" | "sommets"; count: number }[] = [
  { solid: "un cube", part: "faces", count: 6 },
  { solid: "un cube", part: "arêtes", count: 12 },
  { solid: "un cube", part: "sommets", count: 8 },
  { solid: "un pavé droit", part: "faces", count: 6 },
  { solid: "un pavé droit", part: "arêtes", count: 12 },
  { solid: "un pavé droit", part: "sommets", count: 8 },
  { solid: "un cylindre", part: "sommets", count: 0 },
];

/** « Combien de sommets a un pavé droit ? » ou « Un cube a une arête de 3 cm. Quelle est la somme des longueurs de toutes ses arêtes ? » */
export function makeCm2SymSolid(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "cm2-sym-solide", "connaître le cube, le pavé droit et le cylindre", () => {
    const step = stepOf(ctx);
    if (step <= 2 || ctx.rng() < 0.2) {
      const pool = step === 1 ? COUNTS.filter((row) => row.solid !== "un cylindre") : COUNTS;
      const row = pick(ctx.rng, pool);
      const wrong = shuffle(ctx.rng, [4, 5, 6, 8, 10, 12, 14, 0, 1, 2].filter((n) => n !== row.count)).filter((n) => (row.count === 0 ? n <= 4 : n >= 4)).slice(0, 2);
      return {
        prompt: `Combien ${row.part === "arêtes" ? "d'arêtes" : `de ${row.part}`} a ${row.solid} ?`,
        answer: show(row.count),
        wrong: wrong.map(show),
        hints: ["Imagine le solide posé sur la table.", "Une face est un côté plat, une arête est un bord, un sommet est un coin.", "Compte une sorte d'éléments après l'autre, sans en oublier."],
      };
    }
    if (step === 3 || ctx.rng() < 0.4) {
      const edge = randomInt(ctx.rng, 2, step === 3 ? 9 : 15);
      const total = 12 * edge;
      return {
        prompt: `Un cube a une arête de ${edge} cm. Quelle est la somme des longueurs de toutes ses arêtes ?`,
        answer: `${show(total)} cm`,
        wrong: wrongNumbers(ctx, total, [edge * 6, edge * 8, edge * 4, edge ** 3, edge * 3], 1, total * 3, [edge]).map((text) => `${text} cm`),
        hints: ["La somme des arêtes est la longueur de tous les bords ajoutés.", "Un cube a douze arêtes, toutes égales.", "Multiplie la longueur d'une arête par leur nombre."],
      };
    }
    const dims = [randomInt(ctx.rng, 2, 12), randomInt(ctx.rng, 2, 12), randomInt(ctx.rng, 2, 12)].sort((a, b) => b - a);
    if (dims[0] === dims[2]) dims[0] += 1;
    const total = 4 * (dims[0] + dims[1] + dims[2]);
    return {
      prompt: `Un pavé droit mesure ${dims[0]} cm sur ${dims[1]} cm sur ${dims[2]} cm. Quelle est la somme des longueurs de toutes ses arêtes ?`,
      answer: `${show(total)} cm`,
      wrong: wrongNumbers(ctx, total, [dims[0] + dims[1] + dims[2], 2 * (dims[0] + dims[1] + dims[2]), 12 * dims[0], dims[0] * dims[1] * dims[2]], 1, total * 3, dims).map((text) => `${text} cm`),
      hints: ["La somme des arêtes est la longueur de tous les bords ajoutés.", "Un pavé droit a quatre arêtes de chaque longueur.", "Additionne les trois dimensions, puis multiplie par le nombre d'arêtes de chaque sorte."],
    };
  });
}
