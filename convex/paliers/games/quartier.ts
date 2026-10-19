/**
 * LES GABARITS DU QUARTIER : l'itinéraire, les distances, le plan vu de dessus, les lieux d'une rue. Pour
 * l'enfant de CP qui se repère autour de lui (géographie, étape 1 : `ge-cp-itineraire`,
 * `ge-cp-distances`, `ge-cp-plan`, `ge-cp-quartier`).
 *
 * Le modèle écrivait « Mets les villes dans l'ordre du plus près au plus loin de Dakar » (Thiès est plus près
 * que Mbour, et rien n'en parle dans la fiche), « Le terrain de football est devant l'école » sans aucun plan,
 * « Dépose ces objets dans les bonnes zones » avec la chaise sur la table : seize exercices sur vingt-trois
 * étaient faux ou injouables. Ici la scène est ÉCRITE dans l'énoncé (un trajet en mots, des nombres de pas,
 * une rue de quatre lieux) ou DESSINÉE par des émojis sur plusieurs lignes (un plan vu de dessus, un
 * quadrillage), et la bonne réponse se lit dans ce que l'énoncé montre. Aucune ville, aucune région, aucune
 * distance réelle : rien que la fiche ne dise.
 *
 * CE QUE LA FICHE DONNE, ET CE QUE CE FICHIER N'INVENTE PAS
 * - Les lieux (`PLACES`) sont ceux de la fiche (la maison, la boutique, la mosquée, l'école, le marché, le
 *   terrain de football) et quelques lieux d'un village (le puits, le dispensaire, le jardin).
 * - Ce qu'on fait dans un lieu (`FUNCTIONS`) est la définition du lieu : on apprend à l'école, on achète au
 *   marché, on prie à la mosquée, on se soigne au dispensaire, on joue sur le terrain de football.
 * - Les nombres de pas sont écrits dans l'énoncé : le gabarit n'en suppose aucun. Deux enfants ne
 *   comparent jamais leurs empans (celui d'un enfant n'est pas celui d'un autre) : un seul enfant mesure.
 * - Les mesures d'objets (`UNIT_OBJECTS`) respectent l'ordre réel des tailles (un cahier est plus court
 *   qu'une table, qui est plus courte qu'un tableau) : le nombre le plus grand est toujours le plus long.
 *
 * RÈGLES POUR AJOUTER UN LIEU OU UN OBJET
 * - Une étiquette est un mot SEUL, sans article (« marché », « puits ») : au CI, une tuile « article + un
 *   nom » doit avoir son image au catalogue (`lib/item-images.ts`) et la plupart de ces lieux n'en ont pas.
 *   Ces gabarits ne sont câblés qu'au CP, mais le CI les joue aussi dans les tests. Les dessins d'un plan
 *   (`optionOf`) ont leur image, comme dans `espace.ts`.
 * - Un seul lieu avec une élision (« l'école ») : un énoncé n'a qu'une apostrophe droite.
 * - Un lieu long (« le terrain de football ») n'entre que là où l'énoncé et les étiquettes restent courts.
 * - Les mauvais choix ne peuvent pas être une deuxième bonne réponse. Aucun indice n'écrit un mot de la
 *   bonne réponse (le nom d'un lieu, d'un enfant, d'un dessin, une direction).
 *
 * Les énoncés n'ont aucun « : » (l'écran coupe une consigne sur le deux-points), au plus une apostrophe
 * droite, et vingt-huit mots au plus (la consigne du CP). La voix de Pio ne dit pas les émojis : un énoncé
 * nomme toujours le dessin par son nom.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { LAND_ANIMALS, SCENE_THINGS } from "./espace";
import { fresh, originOf, pick, pickFresh, randomInt, shuffle, sortedOptions, type GameContext, type GeneratedGame } from "./shared";
import { CATEGORIES, optionOf, type Thing } from "./things";

const range = (n: number) => Array.from({ length: n }, (_, i) => i);
const cap = (text: string) => `${text[0].toUpperCase()}${text.slice(1)}`;
const apostrophes = (text: string) => (text.match(/'/g) ?? []).length;

/** Les prénoms des petites histoires : sans apostrophe, jamais deux fois le même dans un palier. */
const NAMES = ["Awa", "Moussa", "Fatou", "Cheikh", "Aminata", "Modou"] as const;

// ===========================================================================
// LES LIEUX
// ===========================================================================

type Place = {
  /** L'étiquette : un mot seul, sans article. */
  tile: string;
  /** Le nom avec son article, comme l'énoncé le dit. */
  the: string;
  masculine: boolean;
  /** Un nom long : il alourdit l'énoncé et l'étiquette de sa case. */
  long?: boolean;
};

export const PLACES: readonly Place[] = [
  { tile: "maison", the: "la maison", masculine: false },
  { tile: "boutique", the: "la boutique", masculine: false },
  { tile: "mosquée", the: "la mosquée", masculine: false },
  { tile: "école", the: "l'école", masculine: false },
  { tile: "marché", the: "le marché", masculine: true },
  { tile: "puits", the: "le puits", masculine: true },
  { tile: "dispensaire", the: "le dispensaire", masculine: true },
  { tile: "jardin", the: "le jardin", masculine: true },
  { tile: "terrain de football", the: "le terrain de football", masculine: true, long: true },
];

const isElided = (place: Place) => place.the.startsWith("l'");
/** « au marché », « à la mosquée », « à l'école ». */
const atOf = (place: Place) => (place.the.startsWith("le ") ? `au ${place.the.slice(3)}` : `à ${place.the}`);
/** « du marché », « de la mosquée », « de l'école ». */
const fromOf = (place: Place) => (place.the.startsWith("le ") ? `du ${place.the.slice(3)}` : `de ${place.the}`);

/** Les lieux qui tiennent dans une étiquette de case et dans un énoncé court. */
const SHORT_PLACES = PLACES.filter((place) => !place.long);
const SHORT_NO_ELISION = SHORT_PLACES.filter((place) => !isElided(place));
/** Les lieux où l'on va depuis chez soi : la maison n'en est pas un (« Qui habite le plus près de la maison ? » n'a pas de sens). */
const DESTINATIONS = SHORT_PLACES.filter((place) => place.tile !== "maison");
/** Les lieux masculins : « devant le ___ » se complète sans que l'article donne la réponse. */
const MASCULINE_PLACES = PLACES.filter((place) => place.masculine);
const SHORT_MASCULINE = MASCULINE_PLACES.filter((place) => !place.long);
/** Les lieux féminins sans élision : « loin de la boutique ». */
const FEMININE_PLACES = SHORT_NO_ELISION.filter((place) => !place.masculine && place.tile !== "maison");

/** Le trajet d'un enfant : « Awa part de la maison, passe devant la boutique et arrive à l'école. » */
function routeSentence(name: string, stops: readonly Place[]): string {
  const last = stops.length - 1;
  if (stops.length === 3) return `${name} part ${fromOf(stops[0])}, passe devant ${stops[1].the} et arrive ${atOf(stops[2])}.`;
  return `${name} part ${fromOf(stops[0])}, passe devant ${stops[1].the} puis devant ${stops[2].the} et arrive ${atOf(stops[last])}.`;
}

/** Les lieux d'une rue : « Dans la rue, il y a la mosquée, puis la boutique, puis le marché. » */
function streetSentence(stops: readonly Place[]): string {
  return `Dans la rue, il y a ${stops.map((place) => place.the).join(", puis ")}.`;
}

/** Les n premiers lieux d'un mélange de `pool`. */
function drawPlaces(ctx: GameContext, pool: readonly Place[], n: number): Place[] {
  return shuffle(ctx.rng, pool).slice(0, n);
}

// ===========================================================================
// UN QUADRILLAGE ET UN PION : LES PAS ET LES VIRAGES
// ===========================================================================

type Grid = Thing[][];

function drawGrid(ctx: GameContext, rows: number, cols: number, pool: readonly Thing[] = SCENE_THINGS): Grid {
  const things = shuffle(ctx.rng, pool).slice(0, rows * cols);
  return Array.from({ length: rows }, (_, r) => things.slice(r * cols, r * cols + cols));
}

/** Le quadrillage écrit sur plusieurs lignes de l'énoncé : une ligne d'émojis par rangée. */
const gridText = (grid: Grid) => grid.map((row) => row.map((thing) => thing.emoji).join(" ")).join("\n");
const flat = (grid: Grid) => grid.flat();
const inside = (grid: Grid, r: number, c: number) => r >= 0 && r < grid.length && c >= 0 && c < grid[0].length;

/** Les choix d'un QCM de dessins : la bonne réponse et les erreurs d'enfant, jamais la bonne réponse deux fois. */
function drawingOptions(ctx: GameContext, answer: Thing, traps: readonly Thing[], pool: readonly Thing[]): string[] {
  const wrong = [...new Set([...traps, ...shuffle(ctx.rng, pool)])].filter((thing) => thing.emoji !== answer.emoji).slice(0, 2);
  return shuffle(ctx.rng, [answer, ...wrong]).map(optionOf);
}

type Move = { word: "monte" | "descend" | "gauche" | "droite"; dr: number; dc: number };
const MOVES: readonly Move[] = [
  { word: "monte", dr: -1, dc: 0 },
  { word: "descend", dr: 1, dc: 0 },
  { word: "gauche", dr: 0, dc: -1 },
  { word: "droite", dr: 0, dc: 1 },
];

/** « monte de 1 case », « va de 2 cases vers la droite » : aucune apostrophe. */
function movePhrase(move: Move, cases: number): string {
  const how = cases === 1 ? "1 case" : `${cases} cases`;
  if (move.word === "monte") return `monte de ${how}`;
  if (move.word === "descend") return `descend de ${how}`;
  return `va de ${how} vers la ${move.word}`;
}

/**
 * « Le pion est sur le chat. Il monte de 1 case puis va de 1 case vers la droite. Où arrive-t-il ? » : deux
 * déplacements à angle droit, jamais un retour en arrière. Les mauvais choix sont des erreurs d'enfant : le
 * dessin après le premier déplacement seulement, et le dessin du départ.
 */
export function makeTwoMoves(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "trajet-case", () => {
    const grid = drawGrid(ctx, 3, 3);
    const maxCases = ctx.level === 1 ? 1 : 2;
    let chosen: { r: number; c: number; first: Move; n1: number; second: Move; n2: number } | null = null;
    for (let attempt = 0; attempt < 80 && !chosen; attempt++) {
      const r = randomInt(ctx.rng, 0, 2);
      const c = randomInt(ctx.rng, 0, 2);
      const first = pick(ctx.rng, MOVES);
      const second = pick(
        ctx.rng,
        MOVES.filter((move) => move.dr * first.dr + move.dc * first.dc === 0),
      );
      const n1 = randomInt(ctx.rng, 1, maxCases);
      const n2 = randomInt(ctx.rng, 1, maxCases);
      const midRow = r + first.dr * n1;
      const midCol = c + first.dc * n1;
      if (inside(grid, midRow, midCol) && inside(grid, midRow + second.dr * n2, midCol + second.dc * n2)) chosen = { r, c, first, n1, second, n2 };
    }
    // Aucun tirage dans le quadrillage (très rare) : de la case d'en haut à gauche, une case vers la droite puis une case vers le bas.
    const { r, c, first, n1, second, n2 } = chosen ?? { r: 0, c: 0, first: MOVES[3], n1: 1, second: MOVES[1], n2: 1 };
    const start = grid[r][c];
    const middle = grid[r + first.dr * n1][c + first.dc * n1];
    const answer = grid[r + first.dr * n1 + second.dr * n2][c + first.dc * n1 + second.dc * n2];
    const options = drawingOptions(ctx, answer, [middle, start], flat(grid));
    return {
      type: "qcm",
      prompt: `Regarde le quadrillage.\n${gridText(grid)}\nLe pion est sur ${start.label}. Il ${movePhrase(first, n1)} puis ${movePhrase(second, n2)}. Où arrive-t-il ?`,
      payload: {
        options,
        correctIndex: options.indexOf(optionOf(answer)),
        game: originOf("trajet-case", ctx),
        concept: "suivre un trajet sur un quadrillage",
      },
      answerKey: optionOf(answer),
      hints: [
        "Cherche d'abord le dessin où se trouve le pion.",
        "Monter va vers le haut de l'écran, descendre va vers le bas.",
        "Fais le premier déplacement avec le doigt, puis le second à partir de là.",
      ],
    };
  });
}

/** Les quatre directions dans le sens des aiguilles d'une montre : tourner à droite, c'est passer à la suivante. */
const HEADINGS: readonly { words: string; dr: number; dc: number }[] = [
  { words: "en haut", dr: -1, dc: 0 },
  { words: "à droite", dr: 0, dc: 1 },
  { words: "en bas", dr: 1, dc: 0 },
  { words: "à gauche", dr: 0, dc: -1 },
];

/**
 * « Le pion est sur le chat et regarde en haut. Il avance de 1 case, tourne à droite et avance de 1 case. Où
 * arrive-t-il ? » : tourner à droite, c'est vers LA droite du pion, pas celle de l'écran quand il regarde en bas.
 * Aux deux premiers paliers le pion regarde toujours en haut.
 */
export function makeTurn(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "trajet-tourne", () => {
    const grid = drawGrid(ctx, 3, 3);
    let chosen: { r: number; c: number; heading: number; right: boolean } | null = null;
    for (let attempt = 0; attempt < 80 && !chosen; attempt++) {
      const r = randomInt(ctx.rng, 0, 2);
      const c = randomInt(ctx.rng, 0, 2);
      const heading = ctx.level <= 2 ? 0 : randomInt(ctx.rng, 0, 3);
      const right = ctx.rng() < 0.5;
      const turned = (heading + (right ? 1 : 3)) % 4;
      const pr = r + HEADINGS[heading].dr;
      const pc = c + HEADINGS[heading].dc;
      if (inside(grid, pr, pc) && inside(grid, pr + HEADINGS[turned].dr, pc + HEADINGS[turned].dc)) chosen = { r, c, heading, right };
    }
    // Aucun tirage dans le quadrillage (très rare) : en bas à gauche, le pion regarde en haut et tourne à droite.
    const { r, c, heading, right } = chosen ?? { r: 2, c: 0, heading: 0, right: true };
    const turned = (heading + (right ? 1 : 3)) % 4;
    const mirrored = (heading + (right ? 3 : 1)) % 4;
    const middleRow = r + HEADINGS[heading].dr;
    const middleCol = c + HEADINGS[heading].dc;
    const start = grid[r][c];
    const middle = grid[middleRow][middleCol];
    const answer = grid[middleRow + HEADINGS[turned].dr][middleCol + HEADINGS[turned].dc];
    // L'erreur d'enfant : tourner du mauvais côté (si le quadrillage le permet), s'arrêter après un seul pas, ne pas bouger.
    const traps: Thing[] = [];
    const mirrorRow = middleRow + HEADINGS[mirrored].dr;
    const mirrorCol = middleCol + HEADINGS[mirrored].dc;
    if (inside(grid, mirrorRow, mirrorCol)) traps.push(grid[mirrorRow][mirrorCol]);
    traps.push(middle, start);
    const options = drawingOptions(ctx, answer, traps, flat(grid));
    return {
      type: "qcm",
      prompt: `Regarde le quadrillage.\n${gridText(grid)}\nLe pion est sur ${start.label} et regarde ${HEADINGS[heading].words}. Il avance de 1 case, tourne à ${right ? "droite" : "gauche"} et avance de 1 case. Où arrive-t-il ?`,
      payload: {
        options,
        correctIndex: options.indexOf(optionOf(answer)),
        game: originOf("trajet-tourne", ctx),
        concept: "tourner à droite ou à gauche",
      },
      answerKey: optionOf(answer),
      hints: [
        "Cherche d'abord le dessin où se trouve le pion, et regarde où il regarde.",
        "Avance d'une case dans la direction où le pion regarde.",
        "Tourner à droite, c'est tourner vers sa propre droite, celle du pion.",
      ],
    };
  });
}

// ===========================================================================
// L'ITINÉRAIRE
// ===========================================================================

/** « Awa part de la maison, passe devant la boutique et arrive au marché. Mets les lieux dans l'ordre du trajet. » */
export function makeRouteOrder(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "itineraire-ordre",
    () => {
      // Pas d'élision ici : « l'ordre » prend la seule apostrophe de l'énoncé.
      const stops = drawPlaces(ctx, SHORT_NO_ELISION, ctx.level === 1 ? 3 : 4);
      const name = pickFresh(ctx, NAMES, (n) => `itineraire-ordre-nom:${n}`);
      const sequence = stops.map((place) => place.tile);
      return {
        type: "order",
        prompt: `${routeSentence(name, stops)} Mets les lieux dans l'ordre du trajet.`,
        payload: { correctSequence: sequence, game: originOf("itineraire-ordre", ctx), concept: "suivre un trajet de lieu en lieu" },
        answerKey: sequence.join(", "),
        hints: [
          "Écoute le trajet en entier, du départ jusqu'à l'arrivée.",
          "Le départ est le premier lieu, l'arrivée est le dernier.",
          "Les lieux du milieu sont ceux devant lesquels on passe, dans l'ordre.",
        ],
      };
    },
    (game) => String(game.prompt),
  );
}

/** « …passe devant la boutique et arrive à l'école. Devant quel lieu passe Awa ? » : un lieu de la route, deux qui n'y sont pas. */
export function makeRoutePassBy(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "itineraire-passe",
    () => {
      const long = ctx.level >= 2;
      const stops = drawPlaces(ctx, SHORT_PLACES, long ? 4 : 3);
      const rest = SHORT_PLACES.filter((place) => !stops.includes(place));
      const name = pickFresh(ctx, NAMES, (n) => `itineraire-passe-nom:${n}`);
      // À quatre lieux, on demande le premier devant lequel on passe : le second est le piège, jamais le lieu hors trajet.
      const answer = stops[1];
      const wrong = long ? [stops[2], ...shuffle(ctx.rng, rest).slice(0, 1)] : shuffle(ctx.rng, rest).slice(0, 2);
      const options = shuffle(ctx.rng, [answer, ...wrong]).map((place) => place.tile);
      return {
        type: "qcm",
        prompt: `${routeSentence(name, stops)} Devant quel lieu passe ${name}${long ? " en premier" : ""} ?`,
        payload: {
          options,
          correctIndex: options.indexOf(answer.tile),
          game: originOf("itineraire-passe", ctx),
          concept: "lire un trajet",
        },
        answerKey: answer.tile,
        hints: [
          "Écoute le trajet en entier, du départ jusqu'à l'arrivée.",
          "On ne passe pas devant le lieu du départ, ni devant celui de l'arrivée.",
          long ? "Le premier lieu devant lequel on passe est écrit juste après le départ." : "Le lieu devant lequel on passe est écrit entre le départ et l'arrivée.",
        ],
      };
    },
    (game) => String(game.prompt),
  );
}

/** « Awa part du marché, passe devant le puits et arrive au jardin. » puis « Awa passe devant le ___. » : des lieux masculins. */
export function makeRouteBlank(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "itineraire-trou",
    () => {
      const stops = drawPlaces(ctx, MASCULINE_PLACES, 3);
      const rest = MASCULINE_PLACES.filter((place) => !stops.includes(place));
      const name = pickFresh(ctx, NAMES, (n) => `itineraire-trou-nom:${n}`);
      const answer = stops[1];
      const options = shuffle(ctx.rng, [answer, ...shuffle(ctx.rng, rest).slice(0, 2)]).map((place) => place.tile);
      return {
        type: "fill-blank",
        prompt: `${routeSentence(name, stops)} Complète la phrase.`,
        payload: {
          text: `${name} passe devant le ___.`,
          blanks: [{ options, answer: answer.tile }],
          game: originOf("itineraire-trou", ctx),
          concept: "lire un trajet",
        },
        answerKey: answer.tile,
        hints: [
          "Écoute le trajet en entier, du départ jusqu'à l'arrivée.",
          "On ne passe pas devant le lieu du départ, ni devant celui de l'arrivée.",
          "Le lieu devant lequel on passe est écrit entre le départ et l'arrivée.",
        ],
      };
    },
    (game) => String(game.prompt),
  );
}

export const ZONE_BEFORE = (place: Place) => `Avant ${place.the}`;
export const ZONE_AFTER = (place: Place) => `Après ${place.the}`;

/** Les lieux d'une suite, rangés avant ou après l'un d'eux (jamais lui-même). */
function aroundOne(stops: readonly Place[], reference: number) {
  const place = stops[reference];
  return stops
    .filter((_, i) => i !== reference)
    .map((other) => ({ text: other.tile, correctZone: stops.indexOf(other) < reference ? ZONE_BEFORE(place) : ZONE_AFTER(place) }));
}

/** Une suite de lieux et le rang d'un lieu de repère au milieu, jamais l'école : l'énoncé n'a qu'une apostrophe. */
function drawStopsAndReference(ctx: GameContext, length: number): { stops: Place[]; reference: number } {
  for (let attempt = 0; attempt < 60; attempt++) {
    const stops = drawPlaces(ctx, SHORT_PLACES, length);
    const reference = randomInt(ctx.rng, 1, length - 2);
    if (!isElided(stops[reference])) return { stops, reference };
  }
  return { stops: drawPlaces(ctx, SHORT_NO_ELISION, length), reference: 1 };
}

/** « …Glisse chaque lieu avant ou après la boutique. » : un lieu du trajet au moins de chaque côté. */
export function makeRouteSort(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "itineraire-glisser",
    () => {
      const { stops, reference } = drawStopsAndReference(ctx, 4);
      const name = pickFresh(ctx, NAMES, (n) => `itineraire-glisser-nom:${n}`);
      const place = stops[reference];
      const items = shuffle(ctx.rng, aroundOne(stops, reference));
      return {
        type: "drag-drop",
        prompt: `${routeSentence(name, stops)} Glisse chaque lieu avant ou après ${place.the}.`,
        payload: {
          zones: [ZONE_BEFORE(place), ZONE_AFTER(place)],
          items,
          game: originOf("itineraire-glisser", ctx),
          concept: "avant et après un lieu du trajet",
        },
        answerKey: items.map((item) => `${item.text} → ${item.correctZone}`).join(" ; "),
        hints: [
          "Écoute le trajet en entier, du départ jusqu'à l'arrivée.",
          "Les lieux que l'on rencontre avant celui de la phrase vont dans la première case.",
          "Ceux que l'on rencontre après lui vont dans l'autre case.",
        ],
      };
    },
    (game) => String(game.prompt),
  );
}

// ===========================================================================
// LES DISTANCES : DES PAS, DES EMPANS, LE CHEMIN LE PLUS COURT
// ===========================================================================

/** Trois nombres tous différents d'au moins deux, dans la plage du palier : de quoi ne jamais hésiter. */
function threeSteps(ctx: GameContext): [number, number, number] {
  const [min, max] = ctx.level === 1 ? [3, 10] : ctx.level === 2 ? [5, 20] : [8, 30];
  for (let attempt = 0; attempt < 80; attempt++) {
    const values = [randomInt(ctx.rng, min, max), randomInt(ctx.rng, min, max), randomInt(ctx.rng, min, max)];
    const sorted = [...values].sort((a, b) => a - b);
    if (sorted[1] - sorted[0] >= 2 && sorted[2] - sorted[1] >= 2) return values as [number, number, number];
  }
  return [min, min + 3, min + 6];
}

/** « Pour aller à la boutique, Awa fait 12 pas, Moussa 8 pas et Fatou 15 pas. » */
function walkSentence(destination: Place, kids: readonly string[], steps: readonly number[]): string {
  return `Pour aller ${atOf(destination)}, ${kids[0]} fait ${steps[0]} pas, ${kids[1]} ${steps[1]} pas et ${kids[2]} ${steps[2]} pas.`;
}

/** « …Qui habite le plus près ? » : le moins de pas est le plus près, le plus de pas est le plus loin. */
export function makeWhoIsNearest(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "distance-pas", () => {
    const destination = pick(ctx.rng, DESTINATIONS);
    const kids = shuffle(ctx.rng, NAMES).slice(0, 3);
    const steps = threeSteps(ctx);
    const near = ctx.level === 1 || ctx.rng() < 0.5;
    const target = near ? Math.min(...steps) : Math.max(...steps);
    const answer = kids[steps.indexOf(target)];
    const options = shuffle(ctx.rng, kids);
    return {
      type: "qcm",
      prompt: `${walkSentence(destination, kids, steps)} Qui habite le plus ${near ? "près" : "loin"} ?`,
      payload: { options, correctIndex: options.indexOf(answer), game: originOf("distance-pas", ctx), concept: "comparer des distances en pas" },
      answerKey: answer,
      hints: [
        "Compare les nombres de pas.",
        "Plus il y a de pas, plus c'est loin.",
        near ? "Celui qui fait le moins de pas habite le plus près." : "Celui qui fait le plus de pas habite le plus loin.",
      ],
    };
  });
}

/** « …Mets-les du plus près au plus loin. » : les trois enfants rangés selon leurs pas. */
export function makeDistanceOrder(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "distance-ordre",
    () => {
      // Un lieu féminin sans élision : il est cité deux fois (« à la boutique » puis « loin de la boutique »), pour dire
      // proche DE QUOI. Au masculin, « loin du marché » ne serait plus reconnu comme une référence par le contrôleur.
      const destination = pick(ctx.rng, FEMININE_PLACES);
      const kids = shuffle(ctx.rng, NAMES).slice(0, 3);
      const steps = threeSteps(ctx);
      const reverse = ctx.level >= 2 && ctx.rng() < 0.5;
      const order = range(3).sort((a, b) => (reverse ? steps[b] - steps[a] : steps[a] - steps[b]));
      const sequence = order.map((i) => kids[i]);
      return {
        type: "order",
        prompt: `${walkSentence(destination, kids, steps)} ${
          reverse ? `Mets-les du plus loin de ${destination.the} au plus près.` : `Mets-les du plus près au plus loin de ${destination.the}.`
        }`,
        payload: { correctSequence: sequence, game: originOf("distance-ordre", ctx), concept: "ranger des distances en pas" },
        answerKey: sequence.join(", "),
        hints: [
          "Compare les nombres de pas.",
          "Plus il y a de pas, plus c'est loin.",
          reverse ? "Place d'abord celui qui fait le plus de pas." : "Place d'abord celui qui fait le moins de pas.",
        ],
      };
    },
    (game) => String(game.prompt),
  );
}

type UnitFamily = {
  unit: string;
  /** Les trois objets, du plus court au plus long, et la plage de nombres de chacun : toujours croissante. */
  objects: readonly { tile: string; the: string; min: number; max: number }[];
};

/** Des objets de l'école mesurés en empans, des lieux de l'école mesurés en pas : l'ordre des tailles est celui du monde. */
export const UNIT_OBJECTS: readonly UnitFamily[] = [
  {
    unit: "empans",
    objects: [
      { tile: "cahier", the: "le cahier", min: 1, max: 2 },
      { tile: "table", the: "la table", min: 5, max: 7 },
      { tile: "tableau", the: "le tableau", min: 10, max: 13 },
    ],
  },
  {
    unit: "pas",
    objects: [
      { tile: "classe", the: "la classe", min: 8, max: 13 },
      { tile: "cour", the: "la cour", min: 20, max: 30 },
      { tile: "terrain", the: "le terrain", min: 40, max: 60 },
    ],
  },
];

/** « Awa mesure avec ses empans. Le cahier fait 2 empans, la table 6 empans… Qu'est-ce qui est le plus long ? » : un seul enfant, une seule unité. */
export function makeCompareMeasures(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "mesure-comparer", () => {
    const family = ctx.level === 1 ? UNIT_OBJECTS[0] : pick(ctx.rng, UNIT_OBJECTS);
    const name = pick(ctx.rng, NAMES);
    const numbers = family.objects.map((o) => randomInt(ctx.rng, o.min, o.max));
    const longest = ctx.level === 1 || ctx.rng() < 0.5;
    const answer = longest ? family.objects[2] : family.objects[0];
    const options = shuffle(
      ctx.rng,
      family.objects.map((o) => o.tile),
    );
    const [a, b, c] = family.objects;
    // Un seul empan s'écrit « 1 empan » ; les pas ne changent pas.
    const unitOf = (n: number) => (family.unit === "empans" && n === 1 ? "empan" : family.unit);
    return {
      type: "qcm",
      prompt: `${name} mesure avec ses ${family.unit}. ${cap(a.the)} fait ${numbers[0]} ${unitOf(numbers[0])}, ${b.the} ${numbers[1]} ${unitOf(numbers[1])} et ${c.the} ${numbers[2]} ${unitOf(numbers[2])}. Qu'est-ce qui est le plus ${longest ? "long" : "court"} ?`,
      payload: {
        options,
        correctIndex: options.indexOf(answer.tile),
        game: originOf("mesure-comparer", ctx),
        concept: "comparer des mesures faites avec un même pas ou un même empan",
      },
      answerKey: answer.tile,
      hints: [
        "Compare les nombres.",
        `Plus il y a ${family.unit === "empans" ? "d'empans" : "de pas"}, plus c'est long.`,
        longest ? "Le nombre le plus grand est celui de la réponse." : "Le nombre le plus petit est celui de la réponse.",
      ],
    };
  });
}

/** « Trois chemins mènent à l'école. Par le marché, 15 pas… Quel chemin est le plus court ? » : un seul nombre est le plus petit. */
export function makeShortestPath(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "chemin-court", () => {
    const destination = pick(ctx.rng, DESTINATIONS);
    const vias = shuffle(
      ctx.rng,
      SHORT_NO_ELISION.filter((place) => place !== destination),
    ).slice(0, 3);
    const steps = threeSteps(ctx);
    const shortest = ctx.level === 1 || ctx.rng() < 0.5;
    const target = shortest ? Math.min(...steps) : Math.max(...steps);
    const answer = vias[steps.indexOf(target)];
    const options = shuffle(
      ctx.rng,
      vias.map((place) => `Par ${place.the}`),
    );
    return {
      type: "qcm",
      prompt: `Trois chemins mènent ${atOf(destination)}. ${vias.map((place, i) => `Par ${place.the}, ${steps[i]} pas.`).join(" ")} Quel chemin est le plus ${shortest ? "court" : "long"} ?`,
      payload: {
        options,
        correctIndex: options.indexOf(`Par ${answer.the}`),
        game: originOf("chemin-court", ctx),
        concept: "trouver le chemin le plus court",
      },
      answerKey: `Par ${answer.the}`,
      hints: [
        "Lis chaque chemin et son nombre de pas.",
        "Plus il y a de pas, plus le chemin est long.",
        shortest ? "Le chemin le plus court est celui qui a le moins de pas." : "Le chemin le plus long est celui qui a le plus de pas.",
      ],
    };
  });
}

/** « Pour aller à la boutique, Awa fait 12 pas et Moussa 8 pas. Combien de pas de plus fait Awa ? Écris le nombre. » : un écart de pas, à écrire. */
export function makeStepsDifference(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "pas-difference", () => {
    const destination = pick(ctx.rng, DESTINATIONS);
    const kids = shuffle(ctx.rng, NAMES).slice(0, 2);
    const [min, max] = ctx.level === 1 ? [3, 10] : ctx.level === 2 ? [5, 20] : [8, 30];
    // Deux nombres qui diffèrent d'au moins deux : la différence n'est jamais 0 ni 1.
    const small = randomInt(ctx.rng, min, max - 2);
    const big = randomInt(ctx.rng, small + 2, max);
    const bigIsFirst = ctx.rng() < 0.5;
    const steps = bigIsFirst ? [big, small] : [small, big];
    const more = ctx.level === 1 || ctx.rng() < 0.5;
    // « de plus » parle de celui qui fait le plus de pas, « de moins » de celui qui en fait le moins.
    const who = kids[(more ? bigIsFirst : !bigIsFirst) ? 0 : 1];
    const gap = big - small;
    return {
      type: "short-answer",
      prompt: `Pour aller ${atOf(destination)}, ${kids[0]} fait ${steps[0]} pas et ${kids[1]} ${steps[1]} pas. Combien de pas de ${more ? "plus" : "moins"} fait ${who} ? Écris le nombre.`,
      payload: { acceptedAnswers: [String(gap)], game: originOf("pas-difference", ctx), concept: "comparer des distances en pas" },
      answerKey: String(gap),
      hints: [
        "Compare les deux nombres de pas.",
        "Pour savoir de combien ils diffèrent, enlève le petit nombre au grand nombre.",
        "Écris seulement le nombre, avec des chiffres.",
      ],
    };
  });
}

/** « De chez Awa, le marché est à 9 pas… Le lieu le plus près de chez Awa est le ___. » : des lieux masculins, le moins de pas. */
export function makeNearestBlank(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "distance-trou", () => {
    const places = drawPlaces(ctx, SHORT_MASCULINE, 3);
    const name = pick(ctx.rng, NAMES);
    const steps = threeSteps(ctx);
    const near = ctx.level === 1 || ctx.rng() < 0.5;
    const target = near ? Math.min(...steps) : Math.max(...steps);
    const answer = places[steps.indexOf(target)];
    const options = shuffle(
      ctx.rng,
      places.map((place) => place.tile),
    );
    const told = places.map((place, i) => `${place.the} est à ${steps[i]} pas`);
    return {
      type: "fill-blank",
      prompt: `De chez ${name}, ${told[0]}, ${told[1]} et ${told[2]}. Complète la phrase.`,
      payload: {
        text: `Le lieu le plus ${near ? "près" : "loin"} de chez ${name} est le ___.`,
        blanks: [{ options, answer: answer.tile }],
        game: originOf("distance-trou", ctx),
        concept: "comparer des distances en pas",
      },
      answerKey: answer.tile,
      hints: [
        "Lis chaque lieu et son nombre de pas.",
        "Plus il y a de pas, plus le lieu est loin.",
        near ? "Le lieu le plus près est celui qui a le moins de pas." : "Le lieu le plus loin est celui qui a le plus de pas.",
      ],
    };
  });
}

export const ZONE_CLOSER = "Plus près";
export const ZONE_FARTHER = "Plus loin";

/** « La boutique est à 10 pas de chez Awa. Glisse chaque lieu plus près ou plus loin que la boutique. » */
export function makeCloserFarther(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "distance-glisser",
    () => {
      const [min, max] = ctx.level === 1 ? [6, 12] : ctx.level === 2 ? [8, 20] : [12, 30];
      // Le lieu de repère n'est jamais l'école : « l'école » peut être une étiquette, et l'énoncé n'a qu'une apostrophe.
      const reference = pick(
        ctx.rng,
        DESTINATIONS.filter((place) => !isElided(place)),
      );
      const name = pickFresh(ctx, NAMES, (n) => `distance-glisser-nom:${n}`);
      const limit = randomInt(ctx.rng, min, max);
      const count = ctx.level === 1 ? 3 : 4;
      const places = shuffle(
        ctx.rng,
        DESTINATIONS.filter((place) => place !== reference),
      ).slice(0, count);
      // Un lieu au moins plus près et un au moins plus loin ; aucun à la même distance que le repère.
      const closerCount = randomInt(ctx.rng, 1, count - 1);
      const items = places.map((place, i) => {
        const closer = i < closerCount;
        const stepsAway = closer ? randomInt(ctx.rng, Math.max(1, limit - 8), limit - 1) : randomInt(ctx.rng, limit + 1, limit + 8);
        return { text: `${cap(place.tile)} ${stepsAway} pas`, correctZone: closer ? ZONE_CLOSER : ZONE_FARTHER };
      });
      return {
        type: "drag-drop",
        prompt: `${cap(reference.the)} est à ${limit} pas de chez ${name}. Glisse chaque lieu plus près ou plus loin que ${reference.the}.`,
        payload: {
          zones: [ZONE_CLOSER, ZONE_FARTHER],
          items: shuffle(ctx.rng, items),
          game: originOf("distance-glisser", ctx),
          concept: "plus près et plus loin qu'un lieu",
        },
        answerKey: items.map((item) => `${item.text} → ${item.correctZone}`).join(" ; "),
        hints: [
          "Lis chaque lieu et son nombre de pas.",
          "Un lieu qui a moins de pas que celui de la phrase est plus près.",
          "Un lieu qui a plus de pas est plus loin.",
        ],
      };
    },
    (game) => String(game.prompt),
  );
}

// ===========================================================================
// LE PLAN VU DE DESSUS
// ===========================================================================

/** Ce qu'on peut poser sur une table vue de dessus : trois objets de l'école, cinq fruits et un ballon. */
const TABLE_THINGS: readonly Thing[] = [
  ...CATEGORIES.ecole.things.filter((thing) => thing.label !== "les livres"),
  ...CATEGORIES.fruit.things.filter((thing) => !thing.label.startsWith("l'")),
  { emoji: "⚽", label: "le ballon" },
];

/** Ce qu'on voit dans une cour vue de dessus : une maison, une voiture, un vélo, un ballon, cinq animaux. */
const COURT_THINGS: readonly Thing[] = [
  { emoji: "🏠", label: "la maison" },
  { emoji: "🚗", label: "la voiture" },
  { emoji: "🚲", label: "le vélo" },
  { emoji: "⚽", label: "le ballon" },
  ...LAND_ANIMALS,
];

const SCENES: readonly { the: string; pool: readonly Thing[] }[] = [
  { the: "la table", pool: TABLE_THINGS },
  { the: "la cour", pool: COURT_THINGS },
];

/** Le pluriel de chaque dessin, pour « Combien de bananes y a-t-il ? ». */
const PLURALS: Record<string, string> = {
  "📏": "règles",
  "🎒": "cartables",
  "📒": "cahiers",
  "🥭": "mangues",
  "🍌": "bananes",
  "🍉": "pastèques",
  "🍎": "pommes",
  "🍋": "citrons",
  "⚽": "ballons",
  "🏠": "maisons",
  "🚗": "voitures",
  "🚲": "vélos",
  "🐔": "poules",
  "🐑": "moutons",
  "🐄": "vaches",
  "🐈": "chats",
  "🐕": "chiens",
};

/** Les places qu'on sait dire sur un plan : les quatre coins, et le milieu d'un plan de trois. */
function placesOf(size: number): { words: string; r: number; c: number }[] {
  const last = size - 1;
  const places = [
    { words: "en haut à gauche", r: 0, c: 0 },
    { words: "en haut à droite", r: 0, c: last },
    { words: "en bas à gauche", r: last, c: 0 },
    { words: "en bas à droite", r: last, c: last },
  ];
  if (size === 3) places.push({ words: "au milieu", r: 1, c: 1 });
  return places;
}

/** La scène d'un exercice : « la table » ou « la cour », avec son plan de 2 sur 2 au premier palier, de 3 sur 3 ensuite. */
function drawPlan(ctx: GameContext, size = ctx.level === 1 ? 2 : 3) {
  const scene = pick(ctx.rng, SCENES);
  return { scene, size, grid: drawGrid(ctx, size, size, scene.pool) };
}

const planHeader = (scene: { the: string }) => `Regarde ${scene.the} vue de dessus.`;

const PLAN_HINTS = [
  "Lis le plan ligne après ligne, du début jusqu'à la fin.",
  "Cherche d'abord la ligne du dessin, puis sa place dans la ligne.",
  "Dis le nom de chaque dessin, doucement.",
];

/** « Regarde la table vue de dessus. Où est la règle ? » : la place du dessin, parmi trois places. */
export function makePlanWhere(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "plan-ou", () => {
    const { scene, size, grid } = drawPlan(ctx);
    const place = pickFresh(ctx, placesOf(size), (entry) => `plan-place:${entry.words}`);
    const target = grid[place.r][place.c];
    const wrong = shuffle(
      ctx.rng,
      placesOf(size).filter((entry) => entry.words !== place.words),
    ).slice(0, 2);
    const options = shuffle(ctx.rng, [place, ...wrong]).map((entry) => entry.words);
    return {
      type: "qcm",
      prompt: `${planHeader(scene)}\n${gridText(grid)}\nOù est ${target.label} ?`,
      payload: { options, correctIndex: options.indexOf(place.words), game: originOf("plan-ou", ctx), concept: "retrouver un objet sur un plan" },
      answerKey: place.words,
      hints: [...PLAN_HINTS],
    };
  });
}

/** « Regarde la table vue de dessus. Qu'est-ce qui est en bas à droite ? » : le dessin à cette place. */
export function makePlanWhat(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "plan-objet", () => {
    const { scene, size, grid } = drawPlan(ctx);
    const place = pickFresh(ctx, placesOf(size), (entry) => `plan-place:${entry.words}`);
    const answer = grid[place.r][place.c];
    const options = drawingOptions(ctx, answer, [], flat(grid));
    return {
      type: "qcm",
      prompt: `${planHeader(scene)}\n${gridText(grid)}\nQu'est-ce qui est ${place.words} ?`,
      payload: { options, correctIndex: options.indexOf(optionOf(answer)), game: originOf("plan-objet", ctx), concept: "lire un plan vu de dessus" },
      answerKey: optionOf(answer),
      hints: [...PLAN_HINTS],
    };
  });
}

/** « Regarde la table vue de dessus. Combien de bananes y a-t-il ? » : un même dessin à plusieurs places. */
export function makePlanCount(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "plan-compter", () => {
    const scene = pick(ctx.rng, SCENES);
    const rows = ctx.level === 1 ? 2 : 3;
    const cols = 3;
    const target = pick(ctx.rng, scene.pool);
    const count = randomInt(ctx.rng, 1, ctx.level === 1 ? 3 : 4);
    const others = scene.pool.filter((thing) => thing.emoji !== target.emoji);
    const cells = shuffle(ctx.rng, [
      ...Array.from({ length: count }, () => target),
      ...Array.from({ length: rows * cols - count }, () => pick(ctx.rng, others)),
    ]);
    const grid: Grid = Array.from({ length: rows }, (_, r) => cells.slice(r * cols, r * cols + cols));
    // Les erreurs d'enfant : un de trop, un de moins (deux de trop quand il n'y en a qu'un).
    const wrong = shuffle(
      ctx.rng,
      [count + 1, count - 1, count + 2].filter((n) => n >= 1 && n !== count),
    ).slice(0, 2);
    const options = shuffle(ctx.rng, [count, ...wrong]).map(String);
    return {
      type: "qcm",
      prompt: `${planHeader(scene)}\n${gridText(grid)}\nCombien de ${PLURALS[target.emoji]} y a-t-il ?`,
      payload: { options, correctIndex: options.indexOf(String(count)), game: originOf("plan-compter", ctx), concept: "compter sur un plan vu de dessus" },
      answerKey: String(count),
      hints: [
        "Cherche tous les dessins pareils à celui de la question.",
        "Passe d'une ligne à l'autre, sans en oublier.",
        "Compte avec le doigt, un dessin à la fois.",
      ],
    };
  });
}

/** « Regarde la table vue de dessus. Glisse chaque dessin en haut ou en bas. » : un plan de quatre dessins. */
export function makePlanSort(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "plan-glisser",
    () => {
      const { scene, grid } = drawPlan(ctx, 2);
      const byRows = ctx.level === 1 || ctx.rng() < 0.5;
      const items = shuffle(
        ctx.rng,
        grid.flatMap((row, r) =>
          row.map((thing, c) => ({
            text: optionOf(thing),
            correctZone: byRows ? (r === 0 ? "En haut" : "En bas") : c === 0 ? "À gauche" : "À droite",
          })),
        ),
      );
      return {
        type: "drag-drop",
        prompt: `${planHeader(scene)}\n${gridText(grid)}\nGlisse chaque dessin ${byRows ? "en haut ou en bas" : "à gauche ou à droite"}.`,
        payload: {
          zones: byRows ? ["En haut", "En bas"] : ["À gauche", "À droite"],
          items,
          game: originOf("plan-glisser", ctx),
          concept: "ranger les dessins d'un plan",
        },
        answerKey: items.map((item) => `${item.text} → ${item.correctZone}`).join(" ; "),
        hints: [...PLAN_HINTS],
      };
    },
    (game) => String(game.prompt),
  );
}

/** « Regarde la table vue de dessus. Relie chaque dessin à sa place. » : trois dessins, trois places différentes. */
export function makePlanLinks(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "plan-relier",
    () => {
      const { scene, grid } = drawPlan(ctx, 3);
      const places = shuffle(ctx.rng, placesOf(3)).slice(0, 3);
      const pairs = places.map((place) => ({ left: optionOf(grid[place.r][place.c]), right: place.words }));
      return {
        type: "match",
        prompt: `${planHeader(scene)}\n${gridText(grid)}\nRelie chaque dessin à sa place.`,
        payload: { pairs, game: originOf("plan-relier", ctx), concept: "retrouver un objet sur un plan" },
        answerKey: pairs.map((p) => `${p.left} ~ ${p.right}`).join(" ; "),
        hints: [...PLAN_HINTS],
      };
    },
    (game) => String(game.prompt),
  );
}

/** « Regarde la table vue de dessus. Complète la phrase. En bas à droite, il y a ___. » */
export function makePlanBlank(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "plan-trou", () => {
    const { scene, size, grid } = drawPlan(ctx);
    const place = pickFresh(ctx, placesOf(size), (entry) => `plan-place:${entry.words}`);
    const answer = grid[place.r][place.c];
    const options = drawingOptions(ctx, answer, [], flat(grid));
    return {
      type: "fill-blank",
      prompt: `${planHeader(scene)}\n${gridText(grid)}\nComplète la phrase.`,
      payload: {
        text: `${cap(place.words)}, il y a ___.`,
        blanks: [{ options, answer: optionOf(answer) }],
        game: originOf("plan-trou", ctx),
        concept: "lire un plan vu de dessus",
      },
      answerKey: optionOf(answer),
      hints: [...PLAN_HINTS],
    };
  });
}

// ===========================================================================
// LE QUARTIER : LES LIEUX D'UNE RUE
// ===========================================================================

/** Ce qu'on fait dans un lieu : la définition du lieu, sans ambiguïté. */
export const FUNCTIONS: readonly { place: string; does: string }[] = [
  { place: "école", does: "apprendre" },
  { place: "marché", does: "acheter" },
  { place: "mosquée", does: "prier" },
  { place: "dispensaire", does: "se soigner" },
  { place: "terrain de football", does: "jouer" },
];

type StreetQuestion = { text: string; answer: Place; cited: Place[]; hint: string };

/** Une question sur une rue : le voisin d'un bout, le lieu juste avant ou juste après, le lieu entre deux. */
function streetQuestion(ctx: GameContext, street: readonly Place[]): StreetQuestion {
  const last = street.length - 1;
  const kinds: ("bout" | "apres" | "avant" | "entre")[] =
    ctx.level === 1 ? ["bout"] : ctx.level === 2 ? ["bout", "apres", "avant"] : ["bout", "apres", "avant", "entre"];
  const kind = pick(ctx.rng, kinds);
  if (kind === "bout") {
    const atStart = ctx.rng() < 0.5;
    const cited = street[atStart ? 0 : last];
    return {
      text: `Quel lieu est à côté ${fromOf(cited)} ?`,
      answer: street[atStart ? 1 : last - 1],
      cited: [cited],
      hint: "Le lieu cité est au bout de la rue, il n'a qu'un seul voisin.",
    };
  }
  if (kind === "apres") {
    const at = randomInt(ctx.rng, 0, last - 1);
    return {
      text: `Quel lieu est juste après ${street[at].the} ?`,
      answer: street[at + 1],
      cited: [street[at]],
      hint: "Le bon lieu est écrit juste après lui dans la phrase.",
    };
  }
  if (kind === "avant") {
    const at = randomInt(ctx.rng, 1, last);
    return {
      text: `Quel lieu est juste avant ${street[at].the} ?`,
      answer: street[at - 1],
      cited: [street[at]],
      hint: "Le bon lieu est écrit juste avant lui dans la phrase.",
    };
  }
  const at = randomInt(ctx.rng, 0, last - 2);
  return {
    text: `Quel lieu est entre ${street[at].the} et ${street[at + 2].the} ?`,
    answer: street[at + 1],
    cited: [street[at], street[at + 2]],
    hint: "Entre veut dire au milieu des deux, avec un lieu de chaque côté.",
  };
}

/** « Dans la rue, il y a la mosquée, puis la boutique, puis le marché. Quel lieu est à côté de la mosquée ? » */
export function makeStreetQuestion(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "quartier-rue", () => {
    const length = ctx.level === 1 ? 3 : 4;
    // Une seule apostrophe dans l'énoncé : on refait le tirage tant que « l'école » est écrite deux fois.
    let prompt = "";
    let question: StreetQuestion | null = null;
    for (let attempt = 0; attempt < 60; attempt++) {
      const street = drawPlaces(ctx, SHORT_PLACES, length);
      question = streetQuestion(ctx, street);
      prompt = `${streetSentence(street)} ${question.text}`;
      if (apostrophes(prompt) <= 1) break;
    }
    const found = question as StreetQuestion;
    // Les lieux de la question ne sont jamais des mauvais choix.
    const pool = SHORT_PLACES.filter((place) => place !== found.answer && !found.cited.includes(place));
    const wrong = shuffle(ctx.rng, pool).slice(0, 2);
    const options = shuffle(ctx.rng, [found.answer, ...wrong]).map((place) => place.tile);
    return {
      type: "qcm",
      prompt,
      payload: { options, correctIndex: options.indexOf(found.answer.tile), game: originOf("quartier-rue", ctx), concept: "dire où se trouve un lieu" },
      answerKey: found.answer.tile,
      hints: ["Lis la rue dans l'ordre, du premier lieu jusqu'au dernier.", "Les lieux sont écrits dans l'ordre où on les voit.", found.hint],
    };
  });
}

/** « Dans la rue, il y a le marché, puis la mosquée, puis la boutique. Mets les lieux dans le même ordre. » */
export function makeStreetOrder(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "quartier-ordre",
    () => {
      const street = drawPlaces(ctx, SHORT_PLACES, ctx.level === 1 ? 3 : 4);
      const sequence = street.map((place) => place.tile);
      return {
        type: "order",
        prompt: `${streetSentence(street)} Mets les lieux dans le même ordre.`,
        payload: { correctSequence: sequence, game: originOf("quartier-ordre", ctx), concept: "lire une rue lieu après lieu" },
        answerKey: sequence.join(", "),
        hints: [
          "Lis la rue dans l'ordre, du premier lieu jusqu'au dernier.",
          "Cherche le lieu écrit en premier, et place-le au début.",
          "Place ensuite celui qui est écrit après, puis le suivant.",
        ],
      };
    },
    (game) => String(game.prompt),
  );
}

/** « Dans la rue, il y a la mosquée, puis la boutique, puis le marché. Glisse chaque lieu avant ou après la boutique. » */
export function makeStreetSort(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "quartier-glisser",
    () => {
      const { stops: street, reference } = drawStopsAndReference(ctx, ctx.level === 1 ? 3 : 4);
      const place = street[reference];
      const items = shuffle(ctx.rng, aroundOne(street, reference));
      return {
        type: "drag-drop",
        prompt: `${streetSentence(street)} Glisse chaque lieu avant ou après ${place.the}.`,
        payload: {
          zones: [ZONE_BEFORE(place), ZONE_AFTER(place)],
          items,
          game: originOf("quartier-glisser", ctx),
          concept: "avant et après un lieu de la rue",
        },
        answerKey: items.map((item) => `${item.text} → ${item.correctZone}`).join(" ; "),
        hints: [
          "Lis la rue dans l'ordre, du premier lieu jusqu'au dernier.",
          "Les lieux écrits avant celui de la phrase vont dans la première case.",
          "Ceux qui sont écrits après lui vont dans l'autre case.",
        ],
      };
    },
    (game) => String(game.prompt),
  );
}

/** « Dans la rue, il y a le marché, puis le puits, puis le jardin. Le puits est entre le marché et le ___. » : des lieux masculins. */
export function makeStreetBlank(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "quartier-trou",
    () => {
      const street = drawPlaces(ctx, MASCULINE_PLACES, 3);
      const rest = MASCULINE_PLACES.filter((place) => !street.includes(place));
      const holeAtEnd = ctx.rng() < 0.5;
      const answer = street[holeAtEnd ? 2 : 0];
      const options = shuffle(ctx.rng, [answer, ...shuffle(ctx.rng, rest).slice(0, 2)]).map((place) => place.tile);
      const text = holeAtEnd ? `${cap(street[1].the)} est entre ${street[0].the} et le ___.` : `${cap(street[1].the)} est entre le ___ et ${street[2].the}.`;
      return {
        type: "fill-blank",
        prompt: `${streetSentence(street)} Complète la phrase.`,
        payload: { text, blanks: [{ options, answer: answer.tile }], game: originOf("quartier-trou", ctx), concept: "dire où se trouve un lieu" },
        answerKey: answer.tile,
        hints: [
          "Lis la rue dans l'ordre, du premier lieu jusqu'au dernier.",
          "Entre veut dire au milieu des deux, avec un lieu de chaque côté.",
          "Le lieu qui manque est le voisin du lieu de la phrase, de l'autre côté.",
        ],
      };
    },
    (game) => String(game.prompt),
  );
}

/** « Relie chaque lieu à ce qu'on y fait. » : l'école pour apprendre, le marché pour acheter, trois paires sur cinq. */
export function makePlaceFunctions(ctx: GameContext): GeneratedGame {
  return fresh(
    ctx,
    "lieu-fonction",
    () => {
      const chosen = shuffle(ctx.rng, FUNCTIONS).slice(0, 3);
      const pairs = chosen.map((f) => ({ left: f.place, right: f.does }));
      return {
        type: "match",
        prompt: "Relie chaque lieu à ce qu'on y fait.",
        payload: { pairs, game: originOf("lieu-fonction", ctx), concept: "à quoi sert chaque lieu du quartier" },
        answerKey: pairs.map((p) => `${p.left} ~ ${p.right}`).join(" ; "),
        hints: ["Dis le nom de chaque lieu, doucement.", "Pense à ce que les gens font dans chaque lieu.", "Commence par la paire dont tu es le plus sûr."],
      };
    },
    sortedOptions,
  );
}
