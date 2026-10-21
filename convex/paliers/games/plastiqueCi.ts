/**
 * LES GABARITS DES ARTS PLASTIQUES DU CI : les couleurs, les formes, les frises
 * (`ar-ci-couleurs`, `ar-ci-formes`, `ar-ci-frises`).
 *
 * Ces trois thématiques laissaient au modèle quatre, quatre et deux exercices par palier, à côté des jeux (pots de
 * couleur, frises à compléter, dessins à copier). Sur les seize exercices d'arts du CI relus le 19 octobre 2026, cinq
 * étaient faux. Dans l'export de la production, le modèle rangeait la mangue, la goyave et la pomme sous trois couleurs,
 * comptait la table parmi les rectangles, prenait un ballon pour un rond (c'est une boule) et demandait « Quelle couleur
 * est souvent utilisée pour décorer les guirlandes ? ». Ici chaque réponse se lit dans un tableau : une chose, sa couleur
 * ou sa forme sur le dessin du catalogue, et rien d'autre.
 *
 * LES TUILES. Une tuile qui nomme une chose est « article + nom », un mot du catalogue des images
 * (`lib/item-images.ts`) : au CI l'écran y met le dessin et garde le nom écrit. Une couleur n'est pas une chose : sa
 * tuile est un rond ou un cœur de sa couleur suivi de son nom (« 💛 jaune »), comme au CI en anglais
 * (`anglaisCi.ts`), et la voix dit le nom seul. Une frise est faite d'émojis seuls. Aucun émoji n'est d'Unicode 12 ou
 * plus, aucun n'est suivi d'un sélecteur de variation.
 *
 * CE QUE LES TABLEAUX NE DISENT PAS, ON NE LE DEMANDE PAS
 * - Les fruits qui changent de couleur en mûrissant (la mangue, la pomme, la goyave, le citron, le bissap) ne sont
 *   jamais demandés. Les choses sont celles dont le dessin du catalogue ne laisse aucun doute : la tomate et la
 *   fraise rouges, la banane, le soleil et le poussin jaunes, la feuille, le concombre, le brocoli et le crocodile
 *   verts, le ciel bleu, la carotte orange, l'aubergine violette, le lait et le sel blancs.
 * - Les formes sont celles que montre le dessin de l'objet : l'assiette et la pizza rondes, la fenêtre carrée, le
 *   drapeau, le livre, le cahier et la règle rectangles, le toit et la tente triangles, l'étoile de mer. Pas de
 *   ballon (une boule), pas de table (rectangle ou ronde selon la table), pas d'objet en forme de cœur : le
 *   catalogue n'en a pas.
 * - Un seul ordre juste : les couleurs du drapeau du Sénégal de gauche à droite, celles d'un feu de haut en bas, les
 *   quatre premières de l'arc-en-ciel en partant du haut.
 *
 * LA MÊME QUESTION DEUX FOIS, NON. Un gabarit qui a peu de variantes donne à chaque niveau (donc à chaque palier de la
 * thématique) sa part : trois paliers ne répètent jamais la même question. Les associations vont plus loin : chaque
 * niveau a ses propres choses (`LINK_THINGS`, `LINK_OBJECTS`), donc deux paliers ne relient jamais la même paire. Au
 * rangement des couleurs, deux paliers voisins ne partagent qu'une chose (`SORT_ZONES`). Celui des formes en partage
 * deux : le catalogue n'a que deux objets ronds et deux triangulaires.
 *
 * RÈGLES POUR AJOUTER UNE CHOSE
 * - Le nom, avec son article, est un mot du catalogue (`pictureForTile` le reconnaît), et un test le vérifie.
 * - Une seule couleur ou une seule forme, sans doute possible, sur le dessin du catalogue.
 * - Les énoncés n'ont aucun « : », au plus une apostrophe droite, et vingt mots au plus (la consigne du CI).
 *
 * MODULE PUR (voir `types.ts`).
 */
import { fresh, pickFresh, randomInt, shuffle, takeFresh, type GameContext, type GeneratedGame } from "./shared";
import { linkKey } from "./anglais";
import { byLevel, choiceGame, gapGame, itemsKey, linkGame, orderGame, sortGame, type Gap } from "./ciTiles";
import { variantsForLevel } from "./tableaux";

// ===========================================================================
// LES COULEURS (ar-ci-couleurs)
// ===========================================================================

const COULEURS_CONCEPT = "reconnaître et nommer les couleurs des choses";

export type Colour = "rouge" | "jaune" | "vert" | "bleu" | "orange" | "violet" | "blanc";

/** La tuile d'une couleur : un rond ou un cœur de sa couleur, puis son nom. La voix dit le nom seul. */
export const COLOUR_TILES: Record<Colour, string> = {
  rouge: "🔴 rouge",
  jaune: "💛 jaune",
  vert: "💚 vert",
  bleu: "🔵 bleu",
  orange: "🧡 orange",
  violet: "💜 violet",
  blanc: "⚪ blanc",
};

/** La couleur qui s'accorde avec « chose » : « verte », « bleue ». Les autres ne changent pas. */
export const COLOUR_FEMININE: Record<Colour, string> = {
  rouge: "rouge",
  jaune: "jaune",
  vert: "verte",
  bleu: "bleue",
  orange: "orange",
  violet: "violette",
  blanc: "blanche",
};

/** Une chose et la couleur de son dessin au catalogue : une seule, sans doute possible. */
export type ColourThing = { name: string; colour: Colour };

export const COLOUR_THINGS: readonly ColourThing[] = [
  { name: "la tomate", colour: "rouge" },
  { name: "la fraise", colour: "rouge" },
  { name: "la banane", colour: "jaune" },
  { name: "le soleil", colour: "jaune" },
  { name: "le poussin", colour: "jaune" },
  { name: "la feuille", colour: "vert" },
  { name: "le concombre", colour: "vert" },
  { name: "le brocoli", colour: "vert" },
  { name: "le crocodile", colour: "vert" },
  { name: "le ciel", colour: "bleu" },
  { name: "la carotte", colour: "orange" },
  { name: "l'aubergine", colour: "violet" },
  { name: "le lait", colour: "blanc" },
  { name: "le sel", colour: "blanc" },
];

const BASIC_COLOURS: readonly Colour[] = ["rouge", "jaune", "vert", "bleu"];

const thingNamed = (name: string): ColourThing => COLOUR_THINGS.find((thing) => thing.name === name) as ColourThing;
const colourOfThing = (name: string): Colour => (COLOUR_THINGS.find((thing) => thing.name === name) as ColourThing).colour;
/** La clé d'une chose déjà montrée dans ce palier, la même pour les gabarits de la thématique. */
const teinteKey = (thing: ColourThing) => `teinte:${thing.name}`;

/**
 * Les réponses de « Quelle chose est … ? », par niveau : rouge ou jaune, puis vert ou bleu, puis orange, violet ou blanc.
 * Trois paliers, trois couleurs différentes : la question n'est jamais la même d'un palier à l'autre.
 */
const CHOSE_FIRST: readonly string[] = ["la tomate", "la fraise", "la banane", "le soleil", "le poussin"];
const CHOSE_SECOND: readonly string[] = ["la feuille", "le concombre", "le brocoli", "le crocodile", "le ciel"];
const CHOSE_THIRD: readonly string[] = ["la carotte", "l'aubergine", "le lait", "le sel"];

/** « Quelle chose est jaune ? » : une chose de cette couleur parmi trois dessins. */
export function makeTeinteChoice(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "teinte-chose", () => {
    const answerName = pickFresh(ctx, byLevel(ctx.level, CHOSE_FIRST, CHOSE_SECOND, CHOSE_THIRD), (name) => `teinte:${name}`);
    const colour = colourOfThing(answerName);
    const pool = COLOUR_THINGS.filter((thing) => thing.colour !== colour && (ctx.level > 1 || BASIC_COLOURS.includes(thing.colour)));
    const others = takeFresh(ctx, pool, 2, teinteKey).map((thing) => thing.name);
    return choiceGame("teinte-chose", ctx, `Quelle chose est ${COLOUR_FEMININE[colour]} ?`, answerName, others, COULEURS_CONCEPT, [
      "Regarde les trois dessins, l'un après l'autre.",
      `Cherche le dessin qui est de couleur ${COLOUR_FEMININE[colour]}.`,
      "Les deux autres dessins ne sont pas de cette couleur.",
    ]);
  });
}

/**
 * Les choses que « Relie chaque chose à sa couleur. » montre à chaque niveau. Une chose n'est que dans un niveau : deux
 * paliers de la thématique ne relient jamais la même paire. Le premier niveau n'a que des couleurs de base.
 */
const LINK_THINGS: readonly [readonly string[], readonly string[], readonly string[]] = [
  ["la tomate", "la banane", "la feuille", "le ciel"],
  ["la fraise", "le soleil", "le concombre", "le lait", "la carotte"],
  ["le poussin", "le brocoli", "le crocodile", "le sel", "l'aubergine"],
];

/** « Relie chaque chose à sa couleur. » : trois choses, trois couleurs différentes, celles du niveau. */
export function makeTeinteLinks(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "teinte-relier",
    () => {
      const names = byLevel(ctx.level, LINK_THINGS[0], LINK_THINGS[1], LINK_THINGS[2]);
      const allowed = COLOUR_THINGS.filter((thing) => names.includes(thing.name));
      const colours = shuffle(ctx.rng, [...new Set(allowed.map((thing) => thing.colour))]).slice(0, 3);
      const pairs = colours.map((colour) => {
        const [thing] = takeFresh(ctx, allowed.filter((candidate) => candidate.colour === colour), 1, teinteKey);
        return { left: thing.name, right: COLOUR_TILES[colour] };
      });
      return linkGame("teinte-relier", ctx, "Relie chaque chose à sa couleur.", pairs, COULEURS_CONCEPT, [
        "Regarde la couleur de chaque dessin.",
        "Commence par la chose dont tu es sûr.",
        "Il reste une couleur pour la dernière chose.",
      ]);
    },
    linkKey,
  );
}

/**
 * Une case de « Glisse chaque chose dans sa couleur. » : sa couleur, combien de choses elle reçoit (trois dans la première case
 * des niveaux de cinq tuiles), celles qui y sont toujours, puis celles dont on tire le reste. Il n'y a que trois choses jaunes
 * et quatre vertes : elles se partagent entre deux paliers voisins, qui n'en montrent donc qu'une en commun.
 */
type SortZone = { colour: Colour; count: number; always: readonly string[]; among: readonly string[] };
const SORT_ZONES: readonly (readonly [SortZone, SortZone])[] = [
  [
    { colour: "rouge", count: 2, always: ["la tomate", "la fraise"], among: [] },
    { colour: "jaune", count: 2, always: ["la banane", "le soleil"], among: [] },
  ],
  [
    { colour: "jaune", count: 2, always: ["le poussin"], among: ["la banane", "le soleil"] },
    { colour: "vert", count: 2, always: ["la feuille", "le concombre"], among: [] },
  ],
  [
    { colour: "vert", count: 3, always: ["le brocoli", "le crocodile"], among: ["la feuille", "le concombre"] },
    { colour: "blanc", count: 2, always: ["le lait", "le sel"], among: [] },
  ],
];

/**
 * « Glisse chaque chose dans sa couleur. » : quatre choses, cinq aux deux derniers niveaux, sous deux couleurs. Pas plus :
 * sur un téléphone de 375 × 812, six tuiles à image font trois rangées et les cases passent sous le dock.
 */
export function makeTeinteSort(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "teinte-glisser",
    () => {
      const zones = byLevel(ctx.level, SORT_ZONES[0], SORT_ZONES[1], SORT_ZONES[2]);
      const items = shuffle(
        ctx.rng,
        zones.flatMap((zone) => {
          for (const name of zone.always) ctx.used.add(teinteKey(thingNamed(name)));
          const extra = takeFresh(ctx, zone.among.map(thingNamed), zone.count - zone.always.length, teinteKey).map((thing) => thing.name);
          return [...zone.always, ...extra].map((name) => ({ text: name, correctZone: COLOUR_TILES[zone.colour] }));
        }),
      );
      return sortGame(
        "teinte-glisser",
        ctx,
        "Glisse chaque chose dans sa couleur.",
        zones.map((zone) => COLOUR_TILES[zone.colour]),
        items,
        COULEURS_CONCEPT,
        ["Regarde la couleur de chaque dessin.", "Pose d'abord les choses dont tu es sûr.", "Chaque chose va dans la case de sa couleur."],
      );
    },
    itemsKey,
  );
}

/** Un ordre de couleurs qui n'a qu'une suite juste. */
export type ColourOrder = { prompt: string; steps: readonly Colour[]; hints: [string, string, string] };

/** Un ordre par niveau : le drapeau du Sénégal, le feu, l'arc-en-ciel. */
export const COLOUR_ORDERS: readonly [ColourOrder, ColourOrder, ColourOrder] = [
  {
    prompt: "Mets les couleurs du drapeau du Sénégal dans l'ordre, de gauche à droite.",
    steps: ["vert", "jaune", "rouge"],
    hints: [
      "Pense au drapeau du Sénégal, celui de l'école.",
      "La bande de gauche a la couleur des feuilles.",
      "La bande du milieu a la couleur du soleil, celle de droite la couleur de la tomate.",
    ],
  },
  {
    prompt: "Mets dans l'ordre les lumières du feu, de haut en bas.",
    steps: ["rouge", "jaune", "vert"],
    hints: [
      "Pense à un feu que tu vois dans la rue.",
      "La lumière du haut dit aux voitures de s'arrêter.",
      "La lumière du bas dit aux voitures de passer, celle du milieu leur dit d'attendre.",
    ],
  },
  {
    prompt: "Mets ces couleurs de l'arc-en-ciel en partant du haut.",
    steps: ["rouge", "orange", "jaune", "vert"],
    hints: [
      "Pense à un arc-en-ciel après la pluie.",
      "Tout en haut, la bande a la couleur de la tomate, puis vient celle de la carotte.",
      "Ensuite viennent la bande du soleil, puis celle des feuilles.",
    ],
  },
];

/** « Mets les couleurs du drapeau dans l'ordre. » : une suite par niveau, trois ou quatre couleurs. */
export function makeTeinteOrder(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "teinte-ordre",
    () => {
      const order = byLevel(ctx.level, COLOUR_ORDERS[0], COLOUR_ORDERS[1], COLOUR_ORDERS[2]);
      return orderGame("teinte-ordre", ctx, order.prompt, order.steps.map((colour) => COLOUR_TILES[colour]), COULEURS_CONCEPT, [...order.hints]);
    },
    (game) => String(game.prompt),
  );
}

// ===========================================================================
// LES FORMES (ar-ci-formes)
// ===========================================================================

const FORMES_CONCEPT = "retrouver la forme d'un objet : le rond, le carré, le triangle, le rectangle, l'étoile";

export type Shape = "rond" | "carré" | "triangle" | "rectangle" | "étoile" | "cœur";

/** La tuile d'une forme : un mot du catalogue, avec son dessin. */
export const SHAPE_TILES: Record<Shape, string> = {
  rond: "le rond",
  carré: "le carré",
  triangle: "le triangle",
  rectangle: "le rectangle",
  étoile: "l'étoile",
  cœur: "le cœur",
};

/** Un objet et la forme de son dessin au catalogue. */
export type ObjectShape = { name: string; shape: Shape };

/** Rangés pour que chaque tiers (un par niveau) montre des formes variées. */
export const OBJECT_SHAPES: readonly ObjectShape[] = [
  { name: "l'assiette", shape: "rond" },
  { name: "le toit", shape: "triangle" },
  { name: "le drapeau", shape: "rectangle" },
  { name: "la fenêtre", shape: "carré" },
  { name: "la pizza", shape: "rond" },
  { name: "la tente", shape: "triangle" },
  { name: "le livre", shape: "rectangle" },
  { name: "l'étoile de mer", shape: "étoile" },
  { name: "le cahier", shape: "rectangle" },
  { name: "la règle", shape: "rectangle" },
];

const SIMPLE_SHAPES: readonly Shape[] = ["rond", "carré", "triangle", "rectangle"];

const objectsOf = (shape: Shape) => OBJECT_SHAPES.filter((object) => object.shape === shape);
const contourKey = (object: ObjectShape) => `contour:${object.name}`;

/** Ce qu'on voit d'une forme sans la nommer : un indice qui ne dit pas son nom. */
export const SHAPE_FACTS: Record<Shape, string> = {
  rond: "Cette forme n'a aucun coin.",
  carré: "Cette forme a quatre coins et quatre côtés pareils.",
  rectangle: "Cette forme a quatre coins, deux grands côtés et deux petits côtés.",
  triangle: "Cette forme a trois coins.",
  étoile: "Cette forme a des pointes.",
  cœur: "Cette forme est celle d'un cœur.",
};

/** « Quelle forme a l'assiette ? » : la forme de l'objet parmi trois dessins de formes. */
export function makeContourChoice(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "contour-chose", () => {
    const object = pickFresh(ctx, variantsForLevel(OBJECT_SHAPES, ctx.level), contourKey);
    const pool = (ctx.level === 1 ? SIMPLE_SHAPES : (Object.keys(SHAPE_TILES) as Shape[])).filter((shape) => shape !== object.shape);
    const others = shuffle(ctx.rng, pool).slice(0, 2).map((shape) => SHAPE_TILES[shape]);
    return choiceGame("contour-chose", ctx, `Quelle forme a ${object.name} ?`, SHAPE_TILES[object.shape], others, FORMES_CONCEPT, [
      "Regarde bien le contour de l'objet.",
      SHAPE_FACTS[object.shape],
      "Écarte les formes qui ne ressemblent pas à l'objet.",
    ]);
  });
}

/**
 * Les objets que « Relie chaque chose à sa forme. » montre à chaque niveau : trois formes différentes, et jamais le même
 * objet à deux niveaux. Le catalogue n'a que deux objets ronds, deux triangulaires, un carré et une étoile : le carré et
 * l'étoile viennent au dernier niveau, avec un rectangle.
 */
const LINK_OBJECTS: readonly [readonly string[], readonly string[], readonly string[]] = [
  ["l'assiette", "le toit", "le drapeau"],
  ["la pizza", "la tente", "le livre"],
  ["la fenêtre", "l'étoile de mer", "le cahier", "la règle"],
];

/** « Relie chaque chose à sa forme. » : trois objets de trois formes différentes, ceux du niveau. */
export function makeContourLinks(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "contour-relier",
    () => {
      const names = byLevel(ctx.level, LINK_OBJECTS[0], LINK_OBJECTS[1], LINK_OBJECTS[2]);
      const allowed = OBJECT_SHAPES.filter((object) => names.includes(object.name));
      const shapes = shuffle(ctx.rng, [...new Set(allowed.map((object) => object.shape))]).slice(0, 3);
      const pairs = shapes.map((shape) => {
        const [object] = takeFresh(ctx, allowed.filter((candidate) => candidate.shape === shape), 1, contourKey);
        return { left: object.name, right: SHAPE_TILES[shape] };
      });
      return linkGame("contour-relier", ctx, "Relie chaque chose à sa forme.", pairs, FORMES_CONCEPT, [
        "Regarde le contour de chaque dessin.",
        "Compte les coins de chaque chose.",
        "Il reste une forme pour la dernière chose.",
      ]);
    },
    linkKey,
  );
}

/** Les deux cases de « Glisse chaque chose dans sa forme. », par niveau : la première reçoit trois objets aux niveaux de cinq tuiles. */
const SORT_SHAPES: readonly (readonly [Shape, Shape])[] = [
  ["rond", "rectangle"],
  ["triangle", "rond"],
  ["rectangle", "triangle"],
];

/** « Glisse chaque chose dans sa forme. » : quatre objets, cinq aux deux derniers niveaux, sous deux formes. */
export function makeContourSort(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "contour-glisser",
    () => {
      const [first, second] = byLevel(ctx.level, SORT_SHAPES[0], SORT_SHAPES[1], SORT_SHAPES[2]);
      const counts = ctx.level <= 2 ? [2, 2] : [3, 2];
      const items = shuffle(ctx.rng, [
        ...takeFresh(ctx, objectsOf(first), counts[0], contourKey).map((object) => ({ text: object.name, correctZone: SHAPE_TILES[first] })),
        ...takeFresh(ctx, objectsOf(second), counts[1], contourKey).map((object) => ({ text: object.name, correctZone: SHAPE_TILES[second] })),
      ]);
      return sortGame(
        "contour-glisser",
        ctx,
        "Glisse chaque chose dans sa forme.",
        [SHAPE_TILES[first], SHAPE_TILES[second]],
        items,
        FORMES_CONCEPT,
        ["Regarde le contour de chaque dessin.", "Compte les coins de chaque chose.", "Pose d'abord les choses dont tu es sûr."],
      );
    },
    itemsKey,
  );
}

/** Les phrases à trou des formes : la forme d'un objet, ou ce qu'on compte sur une forme. Deux par niveau, trois au dernier. */
export const SHAPE_GAPS: readonly Gap[] = [
  {
    text: "Une assiette a la forme d'un ___.",
    answer: "rond",
    wrong: ["carré", "triangle"],
    hint: "Passe ton doigt autour de l'assiette. Sens-tu des coins ?",
  },
  { text: "Le triangle a ___ coins.", answer: "trois", wrong: ["quatre", "cinq"], hint: "Compte les coins du triangle avec ton doigt." },
  {
    text: "La fenêtre a la forme d'un ___.",
    answer: "carré",
    wrong: ["rond", "triangle"],
    hint: "La fenêtre a quatre coins et quatre côtés pareils.",
  },
  { text: "Le carré a ___ côtés pareils.", answer: "quatre", wrong: ["trois", "cinq"], hint: "Compte les côtés du carré avec ton doigt." },
  {
    text: "Le toit a la forme d'un ___.",
    answer: "triangle",
    wrong: ["rond", "carré"],
    hint: "Le toit a trois coins, un en haut et deux en bas.",
  },
  {
    text: "Le drapeau a la forme d'un ___.",
    answer: "rectangle",
    wrong: ["rond", "triangle"],
    hint: "Le drapeau a quatre coins, deux grands côtés et deux petits côtés.",
  },
  { text: "Le rectangle a ___ coins.", answer: "quatre", wrong: ["trois", "cinq"], hint: "Compte les coins du rectangle avec ton doigt." },
];

/** « L'assiette a la forme d'un ___. » : le mot de la forme, ou le nombre de coins, dans le trou. */
export function makeContourGap(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "contour-trou",
    () => {
      const gap = pickFresh(ctx, variantsForLevel(SHAPE_GAPS, ctx.level), (row) => `contour-trou:${row.text}`);
      return gapGame("contour-trou", ctx, gap, FORMES_CONCEPT);
    },
    // La phrase qu'on lit fait l'identité : la même phrase avec une autre réponse serait la même question.
    (game) => String(game.payload.text),
  );
}

// ===========================================================================
// LES FRISES (ar-ci-frises)
// ===========================================================================

const FRISES_CONCEPT = "voir ce qui se répète dans une frise et la continuer";

/** Les dessins des frises : des émojis seuls, d'Unicode 11 au plus, sans sélecteur de variation. */
export const FRISE_MOTIFS: readonly string[] = ["🌳", "🏠", "🐟", "⭐", "🌸", "🍌", "🍎", "🐱", "🌙", "🦁", "🐢", "⛵", "🌴", "🥁"];

/** Le groupe qui se répète (des rangs de motifs) et combien de dessins la frise montre, par niveau. */
type Rhythm = { unit: readonly number[]; shown: number };
const SUITES: readonly [Rhythm, Rhythm, Rhythm] = [
  { unit: [0, 1], shown: 5 },
  { unit: [0, 0, 1], shown: 8 },
  { unit: [0, 1, 2], shown: 8 },
];

/** « Quel dessin continue la frise ? » : la frise se répète, le dessin suivant parmi trois. */
export function makeFriseNext(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "guirlande-suite", () => {
    const { unit, shown } = byLevel(ctx.level, SUITES[0], SUITES[1], SUITES[2]);
    const letters = Math.max(...unit) + 1;
    // Un dessin de plus que le groupe : il n'est dans aucune frise, c'est le faux choix qu'on écarte sans y réfléchir.
    const motifs = shuffle(ctx.rng, FRISE_MOTIFS).slice(0, letters + 1);
    const frise = Array.from({ length: shown + 1 }, (_, index) => motifs[unit[index % unit.length]]);
    const answer = frise[shown];
    const inGroup = motifs.slice(0, letters).filter((motif) => motif !== answer);
    const near = inGroup[randomInt(ctx.rng, 0, inGroup.length - 1)];
    return choiceGame(
      "guirlande-suite",
      ctx,
      `Quel dessin continue la frise ?\n${frise.slice(0, shown).join(" ")} ❓`,
      answer,
      [near, motifs[letters]],
      FRISES_CONCEPT,
      [
        "Regarde le début de la frise. Qu'est-ce qui revient toujours ?",
        "Trouve le petit groupe qui se répète.",
        "Continue le groupe à partir du dernier dessin.",
      ],
    );
  });
}

/** La frise de « Quel dessin n'est pas à sa place ? » : le groupe, sa longueur, et le rang avant lequel l'intrus ne se glisse jamais. */
type OddRhythm = { unit: readonly number[]; length: number; from: number };
const INTRUS: readonly [OddRhythm, OddRhythm, OddRhythm] = [
  { unit: [0, 1], length: 8, from: 3 },
  { unit: [0, 1], length: 10, from: 3 },
  { unit: [0, 1, 2], length: 9, from: 3 },
];

/** « Quel dessin n'est pas à sa place dans la frise ? » : un intrus, vu une seule fois, parmi les dessins du groupe. */
export function makeFriseOdd(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "guirlande-intrus", () => {
    const { unit, length, from } = byLevel(ctx.level, INTRUS[0], INTRUS[1], INTRUS[2]);
    const letters = Math.max(...unit) + 1;
    const motifs = shuffle(ctx.rng, FRISE_MOTIFS).slice(0, letters + 1);
    const intruder = motifs[letters];
    const frise = Array.from({ length }, (_, index) => motifs[unit[index % unit.length]]);
    frise[randomInt(ctx.rng, from, length - 1)] = intruder;
    return choiceGame(
      "guirlande-intrus",
      ctx,
      `Quel dessin n'est pas à sa place dans la frise ?\n${frise.join(" ")}`,
      intruder,
      shuffle(ctx.rng, motifs.slice(0, letters)).slice(0, 2),
      FRISES_CONCEPT,
      [
        "Regarde la frise de gauche à droite, un dessin après l'autre.",
        "Trouve le petit groupe qui se répète tout au long de la frise.",
        "Cherche le dessin qui ne fait pas partie du groupe.",
      ],
    );
  });
}
