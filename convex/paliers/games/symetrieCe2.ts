/**
 * LA SYMÉTRIE ET LES SOLIDES DU CE2 : les axes de symétrie d'une figure, le symétrique d'un point sur un quadrillage, le cube, le pavé droit et le
 * cylindre (faces, arêtes, sommets) (`ma-ce2-symetrie`).
 *
 * La thématique avait un jeu de code sur dix (`pixel-symetrie`, compléter un dessin par symétrie) ; les sept autres exercices étaient écrits par le
 * modèle. Ici chaque gabarit repose sur un tableau FERMÉ de faits, ou sur un calcul que le code fait : la bonne réponse se lit sans deviner, et les mauvais
 * choix ne peuvent pas être une deuxième bonne réponse.
 *
 * CE QUE CE FICHIER NE FAIT PAS SORTIR DE LA FICHE
 * - Trois solides : le cube, le pavé droit, le cylindre. La boule et la pyramide ne servent que de mauvais choix, jamais de bonne réponse.
 * - Un cube est un pavé droit particulier : quand la bonne réponse est « le cube » ou « le pavé droit », l'autre ne se propose pas dans les choix. Le
 *   cube et le pavé droit ont les mêmes nombres (six faces, douze arêtes, huit sommets) : aucune question ne demande lequel des deux a tant de faces.
 * - Le cylindre n'est compté que par ses sommets (aucun) : ses faces et ses arêtes se comptent de plusieurs façons, la fiche ne tranche pas.
 * - Les axes de symétrie sont ceux des figures simples (carré, rectangle de 6 cm sur 4 cm, triangle équilatéral, losange sans angle droit, parallélogramme
 *   sans angle droit, triangle aux côtés inégaux) et de quelques lettres capitales sans empattement (H, X, A, T, M, F, R, Z, N). Jamais le cercle, qui en a une
 *   infinité. Un rectangle est toujours donné avec ses mesures : un carré est un rectangle, et il a quatre axes.
 * - Un symétrique se compte en carreaux, en colonnes ou en lignes d'un quadrillage : un point à la même distance de la ligne de symétrie, de l'autre côté.
 * - Un énoncé n'a qu'une apostrophe droite : « A' » ne s'écrit pas, le symétrique s'appelle B.
 * - Aucun indice n'écrit un chiffre ni le mot de la bonne réponse.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { pick, pickFresh, randomInt, shuffle, type GameContext, type GameLevel, type GeneratedGame } from "./shared";
import { choiceGame, type Hints } from "./tableaux";
import { wrongNumbersCe1 } from "./nombresCe1";
import { ce2Gap, ce2Link, ce2Order, ce2Question, ce2Sort, ce2Write, gr, hints, ordr, qr, sortRows, wr, type LinkRow } from "./ce2Outils";

// ===========================================================================
// LES FIGURES ET LEURS AXES DE SYMÉTRIE
// ===========================================================================

/** Une figure : comment l'énoncé la nomme (« un carré »), comment un choix la nomme (« Le carré »), et son nombre d'axes de symétrie. */
export type Figure = { text: string; choice: string; axes: number };

const figure = (text: string, choice: string, axes: number): Figure => ({ text, choice, axes });
const letter = (name: string, axes: number): Figure => figure(`la lettre ${name}`, `La lettre ${name}`, axes);

const SQUARE = figure("un carré", "Le carré", 4);
const RECTANGLE = figure("un rectangle de 6 cm sur 4 cm", "Le rectangle de 6 cm sur 4 cm", 2);
const EQUILATERAL = figure("un triangle équilatéral", "Le triangle équilatéral", 3);
const RHOMBUS = figure("un losange sans angle droit", "Le losange sans angle droit", 2);
const TWO_EQUAL = figure("un triangle qui a deux côtés égaux et un troisième plus long", "Le triangle à deux côtés égaux", 1);
const PARALLELOGRAM = figure("un parallélogramme sans angle droit", "Le parallélogramme sans angle droit", 0);
const UNEQUAL = figure("un triangle aux trois côtés inégaux", "Le triangle aux côtés inégaux", 0);

export const LETTERS: readonly Figure[] = [letter("H", 2), letter("X", 2), letter("A", 1), letter("T", 1), letter("M", 1), letter("F", 0), letter("R", 0), letter("Z", 0), letter("N", 0)];
const [H, , A, , , F] = LETTERS;

/** Les figures dont on compte les axes, selon le palier : trois figures simples, puis six, puis des lettres, puis tout. */
export const FIGURES_BY_LEVEL: Record<GameLevel, readonly Figure[]> = {
  1: [SQUARE, RECTANGLE, EQUILATERAL],
  2: [SQUARE, RECTANGLE, EQUILATERAL, RHOMBUS, TWO_EQUAL, PARALLELOGRAM],
  3: [RECTANGLE, RHOMBUS, ...LETTERS],
  4: [SQUARE, RECTANGLE, EQUILATERAL, RHOMBUS, TWO_EQUAL, PARALLELOGRAM, UNEQUAL, ...LETTERS],
};

/** Les choix de « lequel a exactement… axes » : des figures dont le nom n'est pas ambigu (jamais « le rectangle » sans mesures), au plus vingt-trois caractères. */
export const CHOICES_BY_LEVEL: Record<GameLevel, readonly Figure[]> = {
  1: [SQUARE, EQUILATERAL, H, A, F],
  2: [SQUARE, EQUILATERAL, H, A, F],
  3: [SQUARE, EQUILATERAL, ...LETTERS],
  4: [SQUARE, EQUILATERAL, ...LETTERS],
};

const AXIS_HINTS: Hints = [
  "Imagine que tu plies la figure le long d'une ligne.",
  "Un axe coupe la figure en deux parties qui se superposent exactement.",
  "Essaie les lignes droites l'une après l'autre, sans en oublier.",
];

const COUNT_WORDS = ["aucun", "un", "deux", "trois", "quatre"] as const;

/** Deux nombres d'axes faux, proches du bon : un de plus, un de moins, le double. */
function wrongAxes(ctx: GameContext, answer: number): string[] {
  return wrongNumbersCe1(ctx, answer, [answer + 1, answer - 1, answer * 2, 2, 1, 3], 0, 6);
}

/** « Combien d'axes de symétrie a un carré ? » ou « Parmi ces choix, lequel a exactement deux axes de symétrie ? » : l'un ou l'autre. */
export function makeCe2SymAxis(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce2-sym-axe", "trouver les axes de symétrie d'une figure", () => {
    if (ctx.rng() < 0.5) {
      const fig = pickFresh(ctx, FIGURES_BY_LEVEL[ctx.level], (candidate) => `ce2-sym:axes:${candidate.text}`);
      return {
        prompt: `Combien d'axes de symétrie a ${fig.text} ?`,
        answer: String(fig.axes),
        wrong: wrongAxes(ctx, fig.axes),
        hints: AXIS_HINTS,
      };
    }
    const pool = CHOICES_BY_LEVEL[ctx.level];
    const answer = pickFresh(ctx, pool, (candidate) => `ce2-sym:choix:${candidate.choice}`);
    const others = shuffle(
      ctx.rng,
      pool.filter((candidate) => candidate.axes !== answer.axes),
    );
    return {
      prompt: `Parmi ces choix, lequel ${answer.axes === 0 ? "n'a aucun" : `a exactement ${COUNT_WORDS[answer.axes]}`} ${answer.axes <= 1 ? "axe" : "axes"} de symétrie ?`,
      answer: answer.choice,
      wrong: others.slice(0, 2).map((other) => other.choice),
      hints: AXIS_HINTS,
    };
  });
}

// ===========================================================================
// LE SYMÉTRIQUE D'UN POINT
// ===========================================================================

const carreaux = (n: number) => `${n} ${n === 1 ? "carreau" : "carreaux"}`;

const MIRROR_HINTS: Hints = [
  "Le symétrique est de l'autre côté de la ligne de symétrie.",
  "Le point et son symétrique sont à la même distance de cette ligne.",
  "Dessine la ligne, puis reporte la distance de l'autre côté.",
];

/**
 * Le symétrique d'un point sur un quadrillage. Premier palier : la distance du symétrique à la ligne (la même). Deuxième : la distance entre le
 * point et son symétrique (le double). Troisième : la colonne du symétrique. Dernier : la ligne du symétrique, d'un côté ou de l'autre.
 */
export function makeCe2SymMirror(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce2-sym-miroir", "trouver le symétrique d'un point sur un quadrillage", () => {
    if (ctx.level === 1) {
      const d = pickFresh(ctx, [1, 2, 3, 4, 5], (n) => `ce2-sym:miroir:${n}`);
      return {
        prompt: `Le point A est à ${carreaux(d)} de la ligne de symétrie. Son symétrique B est de l'autre côté. À combien de carreaux de cette ligne est B ?`,
        answer: carreaux(d),
        wrong: wrongNumbersCe1(ctx, d, [d * 2, d + 1, d - 1, d + 2], 1, 12).map((value) => carreaux(Number(value))),
        hints: MIRROR_HINTS,
      };
    }
    if (ctx.level === 2) {
      const d = pickFresh(ctx, [2, 3, 4, 5, 6, 7, 8, 9], (n) => `ce2-sym:miroir:${n}`);
      return {
        prompt: `Le point A est à ${carreaux(d)} de la ligne de symétrie. Son symétrique B est de l'autre côté. Combien de carreaux y a-t-il entre A et B ?`,
        answer: carreaux(2 * d),
        wrong: wrongNumbersCe1(ctx, 2 * d, [d, d + 1, 2 * d + 1, 2 * d - 1, 3 * d], 1, 30).map((value) => carreaux(Number(value))),
        hints: [MIRROR_HINTS[0], "Compte la distance de A à la ligne, puis la même distance de la ligne à B.", MIRROR_HINTS[2]],
      };
    }
    if (ctx.level === 3) {
      const c = randomInt(ctx.rng, 4, 9);
      const a = pickFresh(ctx, Array.from({ length: c - 1 }, (_, i) => i + 1), (n) => `ce2-sym:colonne:${c}:${n}`);
      const answer = 2 * c - a;
      return {
        prompt: `Sur un quadrillage, la ligne de symétrie est la colonne ${c}. Le point A est dans la colonne ${a}. Dans quelle colonne est son symétrique ?`,
        answer: String(answer),
        wrong: wrongNumbersCe1(ctx, answer, [c + a, c - a, answer + 2, answer - 2, c], 1, 20),
        hints: [MIRROR_HINTS[0], "Compte combien de colonnes séparent A de la ligne, puis avance d'autant de l'autre côté.", MIRROR_HINTS[2]],
      };
    }
    const r = randomInt(ctx.rng, 4, 8);
    const lines = Array.from({ length: 2 * r - 1 }, (_, i) => i + 1).filter((n) => n !== r);
    const a = pickFresh(ctx, lines, (n) => `ce2-sym:ligne:${r}:${n}`);
    const answer = 2 * r - a;
    return {
      prompt: `La ligne de symétrie est la ligne ${r} d'un quadrillage. Le point A est sur la ligne ${a}. Sur quelle ligne est son symétrique ?`,
      answer: String(answer),
      wrong: wrongNumbersCe1(ctx, answer, [r + a, Math.abs(r - a), answer + 2, answer - 2, a], 1, 20),
      hints: [MIRROR_HINTS[0], "Compte combien de lignes séparent A de la ligne de symétrie, puis passe de l'autre côté d'autant.", MIRROR_HINTS[2]],
    };
  });
}

// ===========================================================================
// LES SOLIDES
// ===========================================================================

export type Solid = { name: string; faces: number; edges: number; vertices: number };

/** Les deux solides qu'on compte : le cube et le pavé droit ont les mêmes nombres. */
export const COUNTED_SOLIDS: readonly Solid[] = [
  { name: "un cube", faces: 6, edges: 12, vertices: 8 },
  { name: "un pavé droit", faces: 6, edges: 12, vertices: 8 },
];

const SOLID_HINTS: Hints = [
  "Pense à la forme de ses faces.",
  "Compte les faces plates, les faces rondes et les coins.",
  "Imagine un objet de la vie qui lui ressemble.",
];

const PART_HINTS: Hints = [
  "Pose le solide devant toi, dans ta tête.",
  "Une face est un côté plat, une arête est le bord où deux faces se rejoignent.",
  "Un sommet est un coin : compte-les un par un.",
];

const solid = (prompt: string, answer: string, wrong: readonly [string, string]) => qr(prompt, answer, wrong, SOLID_HINTS);

/** Douze questions, trois par palier ; la boule et la pyramide ne sont jamais la bonne réponse. */
export const SOLID_ROWS = [
  // Palier 1
  solid("Quel solide a six faces toutes carrées ?", "Le cube", ["Le cylindre", "La boule"]),
  solid("Quel solide a deux faces rondes et planes ?", "Le cylindre", ["Le cube", "La boule"]),
  solid("Quel solide ressemble à une boîte de chaussures ?", "Le pavé droit", ["Le cylindre", "La boule"]),
  // Palier 2
  solid("Un dé à jouer a la forme de quel solide ?", "Le cube", ["Le cylindre", "La boule"]),
  solid("Une boîte de conserve a la forme de quel solide ?", "Le cylindre", ["Le cube", "Le pavé droit"]),
  solid("Une brique a la forme de quel solide ?", "Le pavé droit", ["Le cylindre", "La boule"]),
  // Palier 3
  solid("Quel solide a six faces rectangulaires, certaines plus longues que d'autres ?", "Le pavé droit", ["Le cylindre", "La boule"]),
  solid("Quel solide n'a aucun sommet ?", "Le cylindre", ["Le cube", "Le pavé droit"]),
  solid("Quel solide peut rouler sur sa face courbe ?", "Le cylindre", ["Le cube", "Le pavé droit"]),
  // Palier 4
  solid("Quel solide a huit sommets, douze arêtes et toutes ses faces carrées ?", "Le cube", ["Le cylindre", "La boule"]),
  solid("Une boîte allongée de gâteaux a la forme de quel solide ?", "Le pavé droit", ["Le cylindre", "La boule"]),
  solid("Un tuyau rond et droit a la forme de quel solide ?", "Le cylindre", ["Le cube", "La boule"]),
];

const PARTS = [
  { word: "faces", of: "de faces", count: (s: Solid) => s.faces },
  { word: "sommets", of: "de sommets", count: (s: Solid) => s.vertices },
  { word: "arêtes", of: "d'arêtes", count: (s: Solid) => s.edges },
] as const;

/** Le nombre que le palier demande : les faces d'abord, puis les sommets, puis les arêtes, puis l'un des trois. */
const PART_BY_LEVEL: Record<GameLevel, readonly number[]> = { 1: [0], 2: [1], 3: [2], 4: [0, 1, 2] };

/** « Quel solide a six faces toutes carrées ? » ou « Combien de sommets a un cube ? » : l'un ou l'autre. */
export function makeCe2SymSolid(ctx: GameContext): GeneratedGame {
  if (ctx.rng() < 0.5) return ce2Question(ctx, "ce2-sym-solide", "reconnaître un solide", SOLID_ROWS);
  return choiceGame(ctx, "ce2-sym-solide", "compter les faces, les sommets et les arêtes d'un solide", () => {
    if (ctx.level === 4 && ctx.rng() < 0.25) {
      return { prompt: "Combien de sommets a un cylindre ?", answer: "0", wrong: ["1", "2"], hints: PART_HINTS };
    }
    const part = PARTS[pick(ctx.rng, PART_BY_LEVEL[ctx.level])];
    const shape = pickFresh(ctx, COUNTED_SOLIDS, (candidate) => `ce2-sym:solide:${part.word}:${candidate.name}`);
    const answer = part.count(shape);
    return {
      prompt: `Combien ${part.of} a ${shape.name} ?`,
      answer: String(answer),
      // Les deux autres nombres du même solide : la faute d'un enfant qui compte autre chose.
      wrong: PARTS.filter((other) => other.word !== part.word).map((other) => String(other.count(shape))),
      hints: PART_HINTS,
    };
  });
}

// ===========================================================================
// LA PHRASE À TROUS
// ===========================================================================

const gap = (text: string, answer: string, wrong: readonly [string, string]) =>
  gr(text, answer, wrong, hints("Lis la phrase en entier avant de choisir.", "Pense à la figure ou au solide dont on parle.", "Teste chaque choix dans la phrase."));

/** Douze phrases, trois par palier. */
export const GAP_ROWS = [
  // Palier 1
  gap("Un cube a ___ faces.", "6", ["4", "8"]),
  gap("Une boîte de conserve a la forme d'un ___.", "cylindre", ["cube", "carré"]),
  gap("Un carré a ___ axes de symétrie.", "4", ["2", "1"]),
  // Palier 2
  gap("Un pavé droit a ___ sommets.", "8", ["6", "12"]),
  gap("Une figure se plie le long de son ___ de symétrie.", "axe", ["côté", "sommet"]),
  gap("Un rectangle de 6 cm sur 4 cm a ___ axes de symétrie.", "2", ["1", "4"]),
  // Palier 3
  gap("Un cube a ___ arêtes.", "12", ["6", "8"]),
  gap("Un point et son symétrique sont à la même ___ de la ligne de symétrie.", "distance", ["couleur", "taille"]),
  gap("Un triangle équilatéral a ___ axes de symétrie.", "3", ["1", "2"]),
  // Palier 4
  gap("Un cylindre a deux faces ___ et une face courbe.", "rondes", ["carrées", "triangulaires"]),
  gap("Le cube et le pavé droit ont chacun ___ faces.", "6", ["4", "8"]),
  gap("Un losange sans angle droit a ___ axes de symétrie.", "2", ["1", "4"]),
];

/** « Un cube a ___ faces. » : le nombre ou le mot qui manque. */
export function makeCe2SymGap(ctx: GameContext): GeneratedGame {
  return ce2Gap(ctx, "ce2-sym-trou", "compléter une phrase sur la symétrie ou les solides", GAP_ROWS);
}

// ===========================================================================
// RELIER
// ===========================================================================

export const CUBE_OBJECTS = ["Dé", "Glaçon"] as const;
export const BLOCK_OBJECTS = ["Boîte de chaussures", "Brique", "Boîte d'allumettes", "Paquet de biscuits"] as const;
export const CYLINDER_OBJECTS = ["Boîte de conserve", "Rouleau de papier", "Tube de colle", "Tuyau"] as const;

/** Chaque objet de la vie va avec son solide : un objet de chaque sorte, trente-deux combinaisons, rangées par quarts. */
export const LINK_ROWS: readonly LinkRow[] = CUBE_OBJECTS.flatMap((cube) =>
  BLOCK_OBJECTS.flatMap((block) =>
    CYLINDER_OBJECTS.map((cylinder) => ({
      prompt: "Relie chaque objet au solide qui lui ressemble.",
      pairs: [
        { left: cube, right: "Cube" },
        { left: block, right: "Pavé droit" },
        { left: cylinder, right: "Cylindre" },
      ],
      hints: hints("Pense à la forme de l'objet.", "Un solide a des faces plates ou rondes.", "Commence par l'objet dont tu es le plus sûr."),
    })),
  ),
);

/** « Relie chaque objet au solide qui lui ressemble. » : un objet pour le cube, un pour le pavé droit, un pour le cylindre. */
export function makeCe2SymLinks(ctx: GameContext): GeneratedGame {
  return ce2Link(ctx, "ce2-sym-relier", "relier un objet de la vie à son solide", LINK_ROWS);
}

// ===========================================================================
// GLISSER
// ===========================================================================

export const FLAT_FIGURES = ["Le carré", "Le rectangle", "Le triangle", "Le cercle"] as const;
export const SOLID_NAMES = ["Le cube", "Le pavé droit", "Le cylindre", "La boule", "La pyramide"] as const;
export const WITH_AXIS = ["Un carré", "Un rectangle de 6 cm sur 4 cm", "Un triangle équilatéral", "La lettre H", "La lettre A", "La lettre T"] as const;
export const WITHOUT_AXIS = ["Un parallélogramme sans angle droit", "Un triangle aux trois côtés inégaux", "La lettre F", "La lettre R", "La lettre Z"] as const;

/** Seize glissés : huit « figure plate ou solide » (paliers 1 et 2), huit « au moins un axe ou aucun » (paliers 3 et 4). */
export const SORT_ROWS = [
  ...sortRows(
    "Glisse chaque mot dans la bonne case.",
    ["Figure plate", "Solide"],
    FLAT_FIGURES,
    SOLID_NAMES,
    hints("Pense aux objets que tu peux prendre dans la main.", "Une figure plate se dessine sur une feuille.", "Un solide a un volume et se pose sur la table."),
    8,
  ),
  ...sortRows(
    "Glisse chaque figure dans la bonne case.",
    ["Au moins un axe", "Aucun axe"],
    WITH_AXIS,
    WITHOUT_AXIS,
    hints("Imagine que tu plies chaque figure en deux.", "Une figure a un axe quand les deux moitiés se superposent.", "Essaie d'abord les figures que tu connais le mieux."),
    8,
  ),
];

/** « Glisse chaque mot dans la bonne case. » : une figure plate ou un solide, puis une figure qui a un axe de symétrie ou qui n'en a pas. */
export function makeCe2SymSort(ctx: GameContext): GeneratedGame {
  return ce2Sort(ctx, "ce2-sym-glisser", "classer des figures et des solides", SORT_ROWS);
}

// ===========================================================================
// L'ORDRE DES GESTES
// ===========================================================================

const STEP_HINTS = hints("Pense à ce qu'on fait en premier.", "Chaque geste prépare le suivant.", "Le dernier geste confirme le travail.");

/** Quatre suites de gestes, une par palier. */
export const STEP_ROWS = [
  ordr(
    "Mets dans l'ordre les gestes pour compléter une figure par symétrie.",
    ["Repère la ligne de symétrie", "Place le symétrique de chaque sommet", "Relie les points entre eux", "Vérifie en pliant la feuille"],
    STEP_HINTS,
  ),
  ordr(
    "Mets dans l'ordre les gestes pour trouver le symétrique du point A.",
    ["Compte la distance du point à la ligne", "Compte la même distance de l'autre côté", "Marque le nouveau point", "Donne-lui un nom"],
    STEP_HINTS,
  ),
  ordr(
    "Mets dans l'ordre les gestes pour vérifier une ligne de symétrie.",
    ["Découpe la figure", "Plie-la le long de la ligne", "Regarde si les deux parties se superposent", "Conclus"],
    STEP_HINTS,
  ),
  ordr(
    "Mets dans l'ordre les gestes pour reconnaître un solide.",
    ["Observe ses faces", "Compte les faces et les sommets", "Compare avec les solides connus", "Donne son nom"],
    STEP_HINTS,
  ),
];

/** « Mets dans l'ordre les gestes pour… » : quatre gestes, une suite par palier. */
export function makeCe2SymSteps(ctx: GameContext): GeneratedGame {
  return ce2Order(ctx, "ce2-sym-etapes", "ordonner les gestes d'une construction par symétrie", STEP_ROWS);
}

// ===========================================================================
// ÉCRIRE LE NOMBRE
// ===========================================================================

const WRITE_HINTS = hints("Imagine le solide ou la figure dans ta tête.", "Compte ce qui est demandé, un par un.", "Si la question en cite plusieurs, additionne-les.");
const write = (prompt: string, answer: number) => wr(`${prompt} Écris le nombre.`, [String(answer)], WRITE_HINTS);

/** Seize questions, quatre par palier : les faces et les axes d'abord, puis les sommets, puis les arêtes et les sommes, puis tout. */
export const WRITE_ROWS = [
  // Palier 1
  write("Combien de faces a un cube ?", 6),
  write("Combien d'axes de symétrie a un carré ?", 4),
  write("Combien de faces a un pavé droit ?", 6),
  write("Combien d'axes de symétrie a un triangle équilatéral ?", 3),
  // Palier 2
  write("Combien de sommets a un cube ?", 8),
  write("Combien d'axes de symétrie a un rectangle de 6 cm sur 4 cm ?", 2),
  write("Combien de sommets a un pavé droit ?", 8),
  write("Combien d'axes de symétrie a la lettre H ?", 2),
  // Palier 3
  write("Combien d'arêtes a un cube ?", 12),
  write("Combien d'arêtes a un pavé droit ?", 12),
  write("Combien de faces et de sommets a un cube en tout ?", 14),
  write("Combien d'axes de symétrie a la lettre F ?", 0),
  // Palier 4
  write("Combien de sommets a un cylindre ?", 0),
  write("Combien de faces, d'arêtes et de sommets a un pavé droit en tout ?", 26),
  write("Combien d'axes de symétrie a un losange sans angle droit ?", 2),
  write("Combien d'axes de symétrie a un parallélogramme sans angle droit ?", 0),
];

/** « Combien d'arêtes a un cube ? Écris le nombre. » : une réponse courte. */
export function makeCe2SymWrite(ctx: GameContext): GeneratedGame {
  return ce2Write(ctx, "ce2-sym-ecrire", "compter les faces, les arêtes, les sommets ou les axes et écrire le nombre", WRITE_ROWS);
}
