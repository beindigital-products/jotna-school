/**
 * LES GABARITS DE GÉOMÉTRIE : le nom d'une forme, ses coins, le nom d'un solide, le classement des
 * formes, le repérage dans une rangée (gauche, droite, milieu, premier, dernier). Pour l'enfant de
 * CI qui reconnaît le carré, le rond et le triangle, et se repère dans l'espace.
 *
 * Le modèle écrivait « Quelle est la forme d'une fenêtre ? » (un rectangle, un carré ?), « Quelle
 * forme a 4 côtés ? » (le carré ET le rectangle). Ici la forme est DESSINÉE par un émoji dont la
 * forme ne fait pas de doute, et les mauvais choix ne peuvent pas être une deuxième bonne réponse :
 * jamais « rectangle » pour un carré (un carré est un rectangle particulier), ni « pavé » pour un
 * cube.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { fresh, originOf, pick, randomInt, shuffle, type GameContext, type GeneratedGame } from "./shared";
import { CATEGORIES, optionOf, type Thing } from "./things";

type Shape = { name: string; plural: string; corners: number; emojis: readonly string[] };

/** Les formes dessinées par un émoji : ⬛ est un carré, 🔴 un rond, 🔺 un triangle (voir `SHAPE_OF_EMOJI`). */
const SHAPES: Record<"carre" | "rond" | "triangle", Shape> = {
  carre: { name: "carré", plural: "Carrés", corners: 4, emojis: ["⬛", "⬜", "🔲", "🔳"] },
  rond: { name: "rond", plural: "Ronds", corners: 0, emojis: ["🔴", "🔵", "⚫", "⚪"] },
  triangle: { name: "triangle", plural: "Triangles", corners: 3, emojis: ["🔺", "🔻"] },
};

/** Le rectangle n'a pas d'émoji sûr : il ne se dessine pas, il se nomme (ses coins, un mauvais choix). */
const RECTANGLE = { name: "rectangle", corners: 4 };

type ShapeKey = keyof typeof SHAPES;
const SHAPE_KEYS = Object.keys(SHAPES) as ShapeKey[];

const withArticle = (name: string) => `le ${name}`;

/** « Quel est le nom de cette forme ? ⬛ » : trois noms, dont un seul est celui de la forme dessinée. */
export function makeShapeName(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "forme-nom", () => {
    const key = pick(ctx.rng, SHAPE_KEYS);
    const shape = SHAPES[key];
    const emoji = pick(ctx.rng, shape.emojis);
    // Un carré est un rectangle particulier : « rectangle » ne se propose jamais pour un carré.
    const others = [
      ...SHAPE_KEYS.filter((k) => k !== key).map((k) => SHAPES[k].name),
      ...(key === "carre" ? [] : [RECTANGLE.name]),
    ];
    const wrong = shuffle(ctx.rng, others).slice(0, 2);
    const options = shuffle(ctx.rng, [shape.name, ...wrong]).map(withArticle);
    return {
      type: "qcm",
      prompt: `Quel est le nom de cette forme ? ${emoji}`,
      payload: {
        options,
        correctIndex: options.indexOf(withArticle(shape.name)),
        game: originOf("forme-nom", ctx),
        concept: "reconnaître une forme",
      },
      answerKey: withArticle(shape.name),
      hints: [
        "Regarde bien le contour de la forme.",
        "Compte les coins de la forme, un par un.",
        "Une forme qui n'a aucun coin est toute ronde.",
      ],
    };
  });
}

/** « Combien de coins a un triangle ? » : un triangle en a trois, un carré et un rectangle quatre, un rond aucun. */
export function makeCorners(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "forme-coins", () => {
    const forms = [
      { name: SHAPES.carre.name, corners: SHAPES.carre.corners },
      { name: SHAPES.triangle.name, corners: SHAPES.triangle.corners },
      { name: SHAPES.rond.name, corners: SHAPES.rond.corners },
      RECTANGLE,
    ];
    const form = pick(ctx.rng, forms);
    const wrong = shuffle(
      ctx.rng,
      [0, 1, 2, 3, 4, 5].filter((n) => n !== form.corners),
    ).slice(0, 2);
    const options = shuffle(ctx.rng, [form.corners, ...wrong]).map(String);
    return {
      type: "qcm",
      prompt: `Combien de coins a un ${form.name} ?`,
      payload: {
        options,
        correctIndex: options.indexOf(String(form.corners)),
        game: originOf("forme-coins", ctx),
        concept: "les coins d'une forme",
      },
      answerKey: String(form.corners),
      hints: [
        "Dessine la forme avec ton doigt, en suivant son contour.",
        "Touche chaque coin du bout du doigt, l'un après l'autre.",
        "Compte les coins que tu as touchés.",
      ],
    };
  });
}

/**
 * Les solides : un objet de tous les jours et le nom du solide qu'il rappelle. Un cube est un pavé
 * particulier : « le pavé » ne se propose jamais pour le dé, ni « le cube » pour la brique.
 */
const SOLIDS: { name: string; objects: readonly string[]; never: string | null }[] = [
  { name: "cube", objects: ["🎲"], never: "pavé" },
  { name: "pavé", objects: ["🧱"], never: "cube" },
  { name: "cylindre", objects: ["🥫", "🧻", "🔋"], never: null },
  { name: "boule", objects: ["⚽", "🏀", "⚾", "🎾"], never: null },
];

const SOLID_ARTICLE: Record<string, string> = { cube: "le cube", pavé: "le pavé", cylindre: "le cylindre", boule: "la boule" };

/** « Quel est le nom du solide qui ressemble à cet objet ? 🎲 » */
export function makeSolidName(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "solide-nom", () => {
    const solid = pick(ctx.rng, SOLIDS);
    const emoji = pick(ctx.rng, solid.objects);
    const wrong = shuffle(
      ctx.rng,
      SOLIDS.filter((s) => s.name !== solid.name && s.name !== solid.never).map((s) => s.name),
    ).slice(0, 2);
    const options = shuffle(ctx.rng, [solid.name, ...wrong]).map((name) => SOLID_ARTICLE[name]);
    return {
      type: "qcm",
      prompt: `Quel est le nom du solide qui ressemble à cet objet ? ${emoji}`,
      payload: {
        options,
        correctIndex: options.indexOf(SOLID_ARTICLE[solid.name]),
        game: originOf("solide-nom", ctx),
        concept: "reconnaître un solide",
      },
      answerKey: SOLID_ARTICLE[solid.name],
      hints: [
        "Regarde l'objet de tous les côtés.",
        "A-t-il des faces plates ? Peut-il rouler sans s'arrêter ?",
        "Pense à un dé, à une boîte, à une boîte de conserve et à un ballon.",
      ],
    };
  });
}

/** « Glisse chaque forme dans la bonne case. » : deux ou trois cases, une à deux formes dans chacune. */
export function makeSortShapes(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "classer-formes", () => {
    const keys = shuffle(ctx.rng, SHAPE_KEYS).slice(0, ctx.level >= 2 ? 3 : 2);
    const items: { text: string; correctZone: string }[] = [];
    for (const key of keys) {
      const shape = SHAPES[key];
      const count = Math.min(shape.emojis.length, randomInt(ctx.rng, 1, 2));
      for (const emoji of shuffle(ctx.rng, shape.emojis).slice(0, count)) items.push({ text: emoji, correctZone: shape.plural });
    }
    const zones = keys.map((key) => SHAPES[key].plural);
    return {
      type: "drag-drop",
      prompt: "Glisse chaque forme dans la bonne case.",
      payload: {
        zones,
        items: shuffle(ctx.rng, items),
        game: originOf("classer-formes", ctx),
        concept: "classer des formes",
      },
      answerKey: items.map((item) => `${item.text} → ${item.correctZone}`).join(" ; "),
      hints: [
        "Regarde le contour de chaque forme.",
        "Compte les coins de la forme : une forme sans coin va avec les formes toutes rondes.",
        "Commence par la forme que tu reconnais le mieux.",
      ],
    };
  });
}

/** Les dessins d'une rangée : des animaux et des fruits, tous différents. */
const ROW_THINGS: readonly Thing[] = [...CATEGORIES.animal.things, ...CATEGORIES.fruit.things];

function drawRow(ctx: GameContext, length: number): Thing[] {
  return shuffle(ctx.rng, ROW_THINGS).slice(0, length);
}

/**
 * « Regarde la rangée 🐔 🍌 🐄. Qui est à gauche ? » : la gauche est du côté où l'on commence à lire,
 * la droite du côté où l'on finit ; « au milieu » et « entre » n'ont qu'un dessin.
 */
export function makeRowPosition(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "rangee-position", () => {
    const row = drawRow(ctx, 3);
    const shown = row.map((t) => t.emoji).join(" ");
    const question = pick(ctx.rng, ["gauche", "droite", "milieu", "entre"] as const);
    const target = question === "gauche" ? row[0] : question === "droite" ? row[2] : row[1];
    const ask =
      question === "gauche"
        ? "Qui est à gauche ?"
        : question === "droite"
          ? "Qui est à droite ?"
          : question === "milieu"
            ? "Qui est au milieu ?"
            : `Qui est entre ${row[0].emoji} et ${row[2].emoji} ?`;
    const options = shuffle(ctx.rng, row).map(optionOf);
    return {
      type: "qcm",
      prompt: `Regarde la rangée ${shown}. ${ask}`,
      payload: {
        options,
        correctIndex: options.indexOf(optionOf(target)),
        game: originOf("rangee-position", ctx),
        concept: "se repérer dans une rangée",
      },
      answerKey: optionOf(target),
      hints: [
        "Lis la rangée de gauche à droite, comme un mot.",
        question === "gauche"
          ? "La gauche est le côté où la rangée commence."
          : question === "droite"
            ? "La droite est le côté où la rangée finit."
            : "Le dessin du milieu a un voisin de chaque côté.",
        "Dis le nom de chaque dessin, dans l'ordre.",
      ],
    };
  });
}

const ORDINALS = ["premier", "deuxième", "troisième", "dernier"] as const;

/** « Qui est le troisième, en lisant de gauche à droite ? » : quatre dessins différents. */
export function makeRowOrdinal(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "rangee-ordinal", () => {
    const row = drawRow(ctx, 4);
    const index = randomInt(ctx.rng, 0, 3);
    const options = shuffle(ctx.rng, row).map(optionOf);
    return {
      type: "qcm",
      prompt: `Regarde la rangée ${row.map((t) => t.emoji).join(" ")}. Qui est le ${ORDINALS[index]}, en lisant de gauche à droite ?`,
      payload: {
        options,
        correctIndex: options.indexOf(optionOf(row[index])),
        game: originOf("rangee-ordinal", ctx),
        concept: "le rang dans une rangée",
      },
      answerKey: optionOf(row[index]),
      hints: [
        "Lis la rangée de gauche à droite, un dessin après l'autre.",
        "Touche chaque dessin du doigt en comptant : premier, deuxième, troisième…",
        "Arrête-toi sur le dessin du rang demandé.",
      ],
    };
  });
}
