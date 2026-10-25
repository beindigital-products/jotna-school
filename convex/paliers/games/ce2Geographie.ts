/**
 * LES GABARITS DE LA GÉOGRAPHIE DU CE2 : lire une carte, les régions du Sénégal, les activités des hommes, l'habitat et les
 * déplacements (`ge-ce2-carte`, `ge-ce2-regions`, `ge-ce2-activites`, `ge-ce2-habitat`).
 *
 * Sur l'échantillon de CE2, le modèle écrivait des exercices faux dans près d'un cas sur trois en géographie : un glissé dont les
 * étiquettes et les cases sont inversées (« Casamance » rangé sous « Ziguinchor »), une échelle « qui représente la hauteur des
 * montagnes », « Mafé - Kolda, Mil - Kaolack » donné pour des régions de production, une question ouverte (« Quel aliment est
 * transporté par camion ? »). Ici la réponse se calcule ou se lit dans une table fermée.
 *
 * CE QUE LES FICHES DONNENT, ET CE QUE CE FICHIER N'INVENTE PAS
 * - La carte : le plan et la carte, la légende, le nord en haut, l'échelle expliquée simplement. Les cartes des exercices sont des
 *   quadrillages de carrés de couleur dont la légende est écrite dans l'énoncé : on y lit la réponse. L'échelle est toujours dite
 *   dans l'énoncé (« 1 cm montre 10 km ») : l'élève multiplie ou divise, il n'a rien à savoir.
 * - Les régions : les quatorze régions et leurs chefs-lieux, qui portent le même nom. Leur place se calcule sur les coordonnées de
 *   leur chef-lieu, ce qui ne se discute pas : nord et sud par la latitude, ouest et est par la longitude, avec un écart minimal
 *   entre deux régions comparées. Les faits retenus sont ceux que tout le monde admet : Dakar est la capitale et la plus petite
 *   région, Tambacounda la plus grande, Saint-Louis au bord du fleuve Sénégal, Ziguinchor en Casamance, Kédougou aux collines.
 * - Les activités : l'agriculture (arachide, mil, riz, maraîchage dans les Niayes), l'élevage (bœufs, moutons, chèvres), la pêche
 *   (les pirogues de Kayar et de Joal), le tourisme (Saly, le Cap Skirring). Mbour et Saint-Louis, à la fois ports de pêche et
 *   lieux de tourisme, ne sont jamais rangés d'un seul côté.
 * - L'habitat et les déplacements : village et ville, leurs matériaux, la route, le chemin de fer, le port, l'aéroport, l'exode
 *   rural et les départs de la saison sèche.
 *
 * RÈGLES POUR AJOUTER UNE LIGNE
 * - Une étiquette est un nom SEUL, avec sa majuscule, sans article (« Village », « Pirogue »).
 * - Les énoncés n'ont aucun « : » (l'écran coupe une consigne sur le deux-points), au plus une apostrophe droite, vingt-huit mots
 *   au plus. Aucun indice n'écrit un chiffre ni un mot de quatre lettres ou plus de la bonne réponse ou d'une tuile.
 * - Les mauvais choix ne peuvent pas être une deuxième bonne réponse.
 * - Un gabarit qui pose plusieurs fois la même question dans un palier (`uses`) a au moins quatre fois `uses` lignes.
 *
 * MODULE PUR (voir `types.ts`).
 */
import {
  ce2Gap,
  ce2Link,
  ce2Order,
  ce2Question,
  ce2Sort,
  ce2Write,
  combinations,
  tag,
  type GapRow,
  type Hints,
  type LinkRow,
  type OrderRow,
  type QuestionRow,
  type SortRow,
  type WriteRow,
} from "./ce2Outils";
import { fresh, originOf, pick, randomInt, shuffle, type GameContext, type GeneratedGame, type GameLevel } from "./shared";
import { choiceGame, sequenceGame } from "./tableaux";

const hints = (a: string, b: string, c: string): Hints => [a, b, c];

// ===========================================================================
// LIRE UNE CARTE (ge-ce2-carte)
// ===========================================================================

/** Les quatre points cardinaux, le côté de la carte où chacun se place. */
const CARDINALS = [
  { word: "le nord", tile: "Nord", side: "En haut", sidePhrase: "en haut" },
  { word: "le sud", tile: "Sud", side: "En bas", sidePhrase: "en bas" },
  { word: "l'est", tile: "Est", side: "À droite", sidePhrase: "à droite" },
  { word: "l'ouest", tile: "Ouest", side: "À gauche", sidePhrase: "à gauche" },
] as const;

const ORIENT_HINTS = hints("Pense à une carte posée sur la table, devant toi.", "Les quatre points cardinaux sont placés aux quatre côtés de la carte.", "Rappelle-toi la boussole ou la rose des vents.");
const SIDES = CARDINALS.map((cardinal) => cardinal.side);
const ORIENT_ROWS: readonly QuestionRow[] = [0, 1, 2].flatMap((form) =>
  CARDINALS.map((cardinal, i): QuestionRow => {
    const wrongSides = SIDES.filter((side) => side !== cardinal.side);
    const wrongPoints = CARDINALS.filter((other) => other !== cardinal).map((other) => other.tile);
    const fact = `point:${cardinal.word}`;
    if (form === 0) return { prompt: `Sur une carte, de quel côté se trouve ${cardinal.word} ?`, fact, answer: cardinal.side, wrong: wrongSides.slice(i % 2), hints: ORIENT_HINTS };
    if (form === 1) return { prompt: `Où place-t-on ${cardinal.word} sur une carte ?`, fact, answer: cardinal.side, wrong: [...wrongSides].reverse(), hints: ORIENT_HINTS };
    return { prompt: `Quel point cardinal est ${cardinal.sidePhrase} de la carte ?`, fact, answer: cardinal.tile, wrong: wrongPoints.slice(i % 2), hints: ORIENT_HINTS };
  }),
);

/** « Sur une carte, de quel côté se trouve le nord ? » : en haut, en bas, à droite ou à gauche. */
export function makeCe2Orientation(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "ce2-orientation", "où placer les points cardinaux sur une carte", ORIENT_ROWS, 2);
}

// ---------------------------------------------------------------------------
// Les cartes en carrés de couleur : une légende écrite, un quadrillage
// ---------------------------------------------------------------------------

type MapObject = { tile: string; word: string; at: string; of: string; square: string };

/** Les six lieux d'une carte de village, un carré de couleur chacun. Aucun n'est élidé (un énoncé n'a qu'une apostrophe). */
const MAP_OBJECTS: readonly MapObject[] = [
  { tile: "Village", word: "le village", at: "au village", of: "du village", square: "🟥" },
  { tile: "Puits", word: "le puits", at: "au puits", of: "du puits", square: "🟦" },
  { tile: "Champ", word: "le champ", at: "au champ", of: "du champ", square: "🟩" },
  { tile: "Marché", word: "le marché", at: "au marché", of: "du marché", square: "🟨" },
  { tile: "Mosquée", word: "la mosquée", at: "à la mosquée", of: "de la mosquée", square: "🟪" },
  { tile: "Terrain", word: "le terrain", at: "au terrain", of: "du terrain", square: "🟧" },
];

const EMPTY = "⬜";

type Direction = { label: string; phrase: string; dr: number; dc: number };
const DIRECTIONS: readonly Direction[] = [
  { label: "Au nord", phrase: "au nord", dr: -1, dc: 0 },
  { label: "Au sud", phrase: "au sud", dr: 1, dc: 0 },
  { label: "À l'est", phrase: "à l'est", dr: 0, dc: 1 },
  { label: "À l'ouest", phrase: "à l'ouest", dr: 0, dc: -1 },
];

type MapDraw = {
  text: string;
  /** Le lieu cherché (A), le lieu de départ (B) et les deux autres. */
  a: MapObject;
  b: MapObject;
  others: MapObject[];
  /** Où est A par rapport à B. */
  direction: Direction;
};

/**
 * Une carte de quatre lieux. A est posé dans une direction de B (juste à côté avec `adjacent`, sinon plus loin sur la même ligne ou
 * la même colonne), les deux autres lieux ailleurs. Les petits niveaux ont trois lignes de quatre cases, les autres quatre de cinq.
 */
function drawMap(ctx: GameContext, adjacent: boolean): MapDraw {
  const small = ctx.level <= 2;
  const rows = small ? 3 : 4;
  const cols = small ? 4 : 5;
  const [a, b, c, d] = shuffle(ctx.rng, MAP_OBJECTS).slice(0, 4);
  for (let attempt = 0; attempt < 200; attempt++) {
    const direction = pick(ctx.rng, DIRECTIONS);
    const br = randomInt(ctx.rng, 0, rows - 1);
    const bc = randomInt(ctx.rng, 0, cols - 1);
    let reach = 0;
    while (br + direction.dr * (reach + 1) >= 0 && br + direction.dr * (reach + 1) < rows && bc + direction.dc * (reach + 1) >= 0 && bc + direction.dc * (reach + 1) < cols) reach++;
    if (reach < 1) continue;
    const distance = adjacent ? 1 : randomInt(ctx.rng, 1, reach);
    const placed = new Map<string, MapObject>();
    const cell = (r: number, c2: number) => `${r},${c2}`;
    placed.set(cell(br, bc), b);
    placed.set(cell(br + direction.dr * distance, bc + direction.dc * distance), a);
    const free = shuffle(
      ctx.rng,
      Array.from({ length: rows * cols }, (_, i) => cell(Math.floor(i / cols), i % cols)).filter((key) => !placed.has(key)),
    );
    placed.set(free[0], c);
    placed.set(free[1], d);
    const grid = Array.from({ length: rows }, (_, r) =>
      Array.from({ length: cols }, (_, c2) => placed.get(cell(r, c2))?.square ?? EMPTY).join(""),
    ).join("\n");
    const [first, ...rest] = shuffle(ctx.rng, [a, b, c, d]);
    const legend = `${first.square} est ${first.word}, ${rest[0].square} ${rest[0].word}, ${rest[1].square} ${rest[1].word} et ${rest[2].square} ${rest[2].word}.`;
    return { text: `Le nord est en haut. ${legend}\n${grid}`, a, b, others: [c, d], direction };
  }
  throw new Error("carte impossible");
}

const MAP_HINTS = hints("Lis d'abord ce que montre chaque couleur.", "Trouve le lieu de la question, puis regarde la case juste à côté.", "Regarde seulement la case collée au lieu, dans la bonne direction.");

/** « Où est le puits par rapport au village ? » : au nord, au sud, à l'est ou à l'ouest, sur une carte à quadrillage. */
export function makeCe2MapDirection(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce2-carte-direction", "dire où est un lieu par rapport à un autre sur une carte", () => {
    const map = drawMap(ctx, false);
    return {
      prompt: `${map.text}\nOù est ${map.a.word} par rapport ${map.b.at} ?`,
      answer: map.direction.label,
      wrong: shuffle(
        ctx.rng,
        DIRECTIONS.filter((direction) => direction !== map.direction).map((direction) => direction.label),
      ),
      hints: hints("Lis d'abord ce que montre chaque couleur.", "Repère les deux lieux de la question sur la carte.", "Regarde si le premier lieu est plus haut, plus bas, à gauche ou à droite du second."),
    };
  });
}

/** « Quel lieu est juste au nord du village ? » : le lieu collé à un autre, dans une direction. */
export function makeCe2MapNeighbour(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce2-carte-voisin", "lire le lieu voisin sur une carte", () => {
    const map = drawMap(ctx, true);
    return {
      prompt: `${map.text}\nQuel lieu est juste ${map.direction.phrase} ${map.b.of} ?`,
      answer: map.a.tile,
      wrong: map.others.map((other) => other.tile),
      hints: MAP_HINTS,
    };
  });
}

/** « Que montre 🟩 sur cette carte ? » : le lieu d'une couleur de la légende. */
export function makeCe2MapLegend(ctx: GameContext): GeneratedGame {
  return choiceGame(ctx, "ce2-carte-legende", "lire la légende d'une carte", () => {
    const map = drawMap(ctx, false);
    const asked = pick(ctx.rng, [map.a, map.b, ...map.others]);
    return {
      prompt: `${map.text}\nQue montre ${asked.square} sur cette carte ?`,
      answer: asked.tile,
      wrong: [map.a, map.b, ...map.others].filter((object) => object !== asked).map((object) => object.tile),
      hints: hints("Lis la légende avant de regarder la carte.", "Une couleur ne montre qu'un seul lieu.", "Cherche la couleur de la question dans la légende."),
    };
  });
}

/** L'échelle : combien de kilomètres montre un centimètre, selon le niveau. */
const SCALES: Record<GameLevel, readonly number[]> = { 1: [2, 5, 10], 2: [5, 10, 20], 3: [10, 20, 50], 4: [10, 20, 50, 100] };

/** « Sur une carte, 1 cm montre 10 km. Deux villes sont à 3 cm. Quelle est la distance réelle en km ? » : un produit ou un quotient. */
export function makeCe2Scale(ctx: GameContext): GeneratedGame {
  return fresh(ctx, "ce2-echelle", () => {
    const scale = pick(ctx.rng, SCALES[ctx.level]);
    const cm = randomInt(ctx.rng, 2, 9);
    const km = scale * cm;
    const forward = ctx.rng() < 0.5;
    const prompt = forward
      ? `Sur une carte, 1 cm montre ${scale} km. Deux villes sont à ${cm} cm. Quelle est la distance réelle en km ? Écris le nombre.`
      : `Sur une carte, 1 cm montre ${scale} km. Deux villes sont à ${km} km. Combien de cm les sépare sur la carte ? Écris le nombre.`;
    const answer = String(forward ? km : cm);
    return {
      type: "short-answer",
      prompt,
      payload: { acceptedAnswers: [answer], game: originOf("ce2-echelle", ctx), concept: "utiliser l'échelle d'une carte" },
      answerKey: answer,
      hints: forward
        ? ["Lis combien de kilomètres montre un seul centimètre.", "Autant de centimètres, autant de fois cette distance.", "Calcule avec une multiplication."]
        : ["Lis combien de kilomètres montre un seul centimètre.", "Cherche combien de fois cette distance entre dans la distance réelle.", "Calcule avec une division."],
    };
  });
}

const MAP_WORD_HINTS = hints("Lis la phrase en entier.", "Pense à ce que sert chaque mot quand on regarde un dessin de lieu.", "Un seul des trois mots a un sens dans cette phrase.");
const MAP_GAP_ROWS: readonly GapRow[] = [
  { text: "On dessine le plan d'une école et la ___ d'un pays.", answer: "carte", wrong: ["légende", "échelle"], hints: MAP_WORD_HINTS },
  { text: "On dessine le ___ d'une classe ou d'une maison.", answer: "plan", wrong: ["pays", "fleuve"], hints: MAP_WORD_HINTS },
  { text: "La ___ explique ce que veulent dire les couleurs et les signes.", answer: "légende", wrong: ["flèche", "échelle"], hints: MAP_WORD_HINTS },
  { text: "Sur une carte, l'___ sert à calculer les distances.", answer: "échelle", wrong: ["orientation", "étoile"], hints: MAP_WORD_HINTS },
  { text: "Sur une carte, le nord est en haut et le sud en ___.", answer: "bas", wrong: ["milieu", "coin"], hints: MAP_WORD_HINTS },
  { text: "Pour trouver le nord, on peut utiliser une ___.", answer: "boussole", wrong: ["échelle", "légende"], hints: MAP_WORD_HINTS },
];

/** « La ___ explique ce que veulent dire les couleurs et les signes. » : un mot de la carte, parmi trois. */
export function makeCe2MapGap(ctx: GameContext): GeneratedGame {
  return ce2Gap(ctx, "ce2-carte-trou", "le vocabulaire de la carte", MAP_GAP_ROWS);
}

/** Les glissés « plan ou carte » : deux petits lieux dessinés en plan, deux grands lieux dessinés en carte. */
const PLAN_PLACES = ["Classe", "Maison", "École", "Cour", "Chambre"] as const;
const MAP_PLACES = ["Sénégal", "Afrique", "Monde"] as const;
const PLAN_OR_MAP_ROWS: readonly SortRow[] = combinations(PLAN_PLACES, 2).flatMap((plans) =>
  combinations(MAP_PLACES, 2).map(
    (maps): SortRow => ({
      prompt: "Glisse chaque lieu sous ce qui le montre le mieux, un plan ou une carte.",
      zones: ["Plan", "Carte"],
      items: [...plans.map((text) => ({ text, zone: "Plan" })), ...maps.map((text) => ({ text, zone: "Carte" }))],
      hints: hints("Pense à la taille de chaque lieu.", "Un petit lieu se dessine en détail.", "Un très grand lieu se dessine beaucoup plus petit que la réalité."),
    }),
  ),
);

export function makeCe2PlanOrMap(ctx: GameContext): GeneratedGame {
  return ce2Sort(ctx, "ce2-plan-carte-glisser", "distinguer un plan et une carte", PLAN_OR_MAP_ROWS);
}

/** Les ordres de la boussole : en partant d'un point, dans le sens des aiguilles d'une montre ou dans l'autre. */
const WHEEL = ["Nord", "Est", "Sud", "Ouest"] as const;
const PHRASE_OF: Record<string, string> = { Nord: "du nord", Est: "de l'est", Sud: "du sud", Ouest: "de l'ouest" };
const COMPASS_ROWS: readonly OrderRow[] = WHEEL.flatMap((start, i) =>
  [1, 3].map(
    (step): OrderRow => ({
      prompt: `Range les points cardinaux ${step === 1 ? "dans le sens des aiguilles" : "dans le sens inverse des aiguilles"}, en partant ${PHRASE_OF[start]}.`,
      sequence: [0, 1, 2, 3].map((k) => WHEEL[(i + step * k) % 4]),
      hints: hints("Imagine une boussole posée à plat devant toi.", "Les quatre points sont placés autour, comme sur un cadran.", "Avance d'un quart de tour à chaque fois."),
    }),
  ),
);

export function makeCe2CompassOrder(ctx: GameContext): GeneratedGame {
  return ce2Order(ctx, "ce2-boussole-ordre", "faire le tour de la boussole", COMPASS_ROWS);
}

// ===========================================================================
// LES RÉGIONS DU SÉNÉGAL (ge-ce2-regions)
// ===========================================================================

/** Les quatorze régions : le chef-lieu porte le même nom, et ses coordonnées (latitude nord, longitude ouest en degrés négatifs). */
type Region = { name: string; lat: number; lon: number };
const REGIONS: readonly Region[] = [
  { name: "Dakar", lat: 14.72, lon: -17.47 },
  { name: "Thiès", lat: 14.79, lon: -16.92 },
  { name: "Diourbel", lat: 14.66, lon: -16.23 },
  { name: "Fatick", lat: 14.34, lon: -16.41 },
  { name: "Kaolack", lat: 14.17, lon: -16.08 },
  { name: "Kaffrine", lat: 14.11, lon: -15.55 },
  { name: "Louga", lat: 15.61, lon: -16.22 },
  { name: "Saint-Louis", lat: 16.02, lon: -16.49 },
  { name: "Matam", lat: 15.66, lon: -13.26 },
  { name: "Tambacounda", lat: 13.77, lon: -13.67 },
  { name: "Kédougou", lat: 12.56, lon: -12.17 },
  { name: "Kolda", lat: 12.89, lon: -14.94 },
  { name: "Sédhiou", lat: 12.71, lon: -15.56 },
  { name: "Ziguinchor", lat: 12.58, lon: -16.27 },
];
const REGION_NAMES = REGIONS.map((region) => region.name);
const regionsNamed = (...names: string[]) => names.map((name) => REGIONS.find((region) => region.name === name) as Region);

/** Des villes qui ne sont chefs-lieux d'aucune région. */
const OTHER_TOWNS = ["Mbour", "Touba", "Pikine", "Rufisque", "Richard-Toll", "Podor", "Linguère", "Bakel"];

const REGION_NAME_HINTS = hints("Pense à la liste des quatorze régions du Sénégal.", "Le chef-lieu d'une région porte le même nom qu'elle.", "Les deux autres sont aussi des villes, mais aucune région ne porte leur nom.");
const CHIEF_ROWS: readonly QuestionRow[] = REGIONS.flatMap((region, i): QuestionRow[] => [
  {
    prompt: "Laquelle de ces villes est le chef-lieu d'une région ?",
    fact: `region:${region.name}`,
    answer: region.name,
    wrong: [OTHER_TOWNS[i % OTHER_TOWNS.length], OTHER_TOWNS[(i + 3) % OTHER_TOWNS.length]],
    hints: REGION_NAME_HINTS,
  },
  {
    prompt: `Quel est le chef-lieu de la région de ${region.name} ?`,
    fact: `region:${region.name}`,
    answer: region.name,
    wrong: [REGION_NAMES[(i + 5) % REGION_NAMES.length], REGION_NAMES[(i + 9) % REGION_NAMES.length]],
    hints: hints("Pense à la liste des quatorze régions du Sénégal.", "Le chef-lieu d'une région porte le même nom qu'elle.", "Cherche la ville qui s'appelle comme la région."),
  },
]);

/** « Quel est le chef-lieu de la région de Kolda ? » (ou quelle ville est un chef-lieu) : une région, parmi trois. */
export function makeCe2ChiefTown(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "ce2-chef-lieu", "le chef-lieu d'une région", CHIEF_ROWS);
}

const COUNT_HINTS = hints("Pense à la liste des régions du Sénégal.", "Chaque région a un chef-lieu qui porte son nom.", "Tu peux les compter sur la carte, une par une.");
const COUNT_ROWS: readonly QuestionRow[] = [
  { prompt: "Combien de régions compte le Sénégal ?", answer: "14", wrong: ["12", "16"], hints: COUNT_HINTS },
  { prompt: "Le Sénégal est partagé en combien de régions ?", answer: "14", wrong: ["10", "13"], hints: COUNT_HINTS },
  { prompt: "Combien y a-t-il de régions au Sénégal ?", answer: "14", wrong: ["15", "18"], hints: COUNT_HINTS },
  { prompt: "Quel est le nombre de régions du Sénégal ?", answer: "14", wrong: ["11", "17"], hints: COUNT_HINTS },
];

export function makeCe2RegionCount(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "ce2-region-compte", "le nombre de régions du Sénégal", COUNT_ROWS);
}

/** L'écart minimal entre deux régions comparées : assez grand pour qu'aucun chef-lieu ne soit à égalité sur la carte. */
const LAT_GAP = 0.9;
const LON_GAP = 1.2;

type Axis = { phrase: string; hint: string; value: (region: Region) => number; gap: number; best: "max" | "min" };
const AXES: readonly Axis[] = [
  { phrase: "au nord", hint: "Cherche la région la plus haute sur la carte.", value: (r) => r.lat, gap: LAT_GAP, best: "max" },
  { phrase: "au sud", hint: "Cherche la région la plus basse sur la carte.", value: (r) => r.lat, gap: LAT_GAP, best: "min" },
  { phrase: "à l'est", hint: "Cherche la région la plus à droite sur la carte.", value: (r) => r.lon, gap: LON_GAP, best: "max" },
  { phrase: "à l'ouest", hint: "Cherche la région la plus à gauche sur la carte.", value: (r) => r.lon, gap: LON_GAP, best: "min" },
];

const REGION_PLUS_ROWS: readonly QuestionRow[] = combinations(REGIONS, 3).flatMap((trio) =>
  AXES.flatMap((axis): QuestionRow[] => {
    const sorted = [...trio].sort((x, y) => (axis.best === "max" ? axis.value(y) - axis.value(x) : axis.value(x) - axis.value(y)));
    if (Math.abs(axis.value(sorted[0]) - axis.value(sorted[1])) < axis.gap) return [];
    return [
      {
        prompt: `Laquelle de ces régions est la plus ${axis.phrase} ?`,
        answer: sorted[0].name,
        wrong: [sorted[1].name, sorted[2].name],
        hints: hints("Imagine la carte du Sénégal posée devant toi.", "Compare la place de chaque région sur la carte.", axis.hint),
      },
    ];
  }),
);

/** « Laquelle de ces régions est la plus au nord ? » : la région extrême parmi trois, d'après les coordonnées des chefs-lieux. */
export function makeCe2RegionMost(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "ce2-region-plus", "la région la plus au nord, au sud, à l'est ou à l'ouest", REGION_PLUS_ROWS, 2);
}

/** « Range ces régions du nord au sud. » : trois ou quatre régions que les coordonnées séparent nettement. */
export function makeCe2RegionOrder(ctx: GameContext): GeneratedGame {
  return sequenceGame(ctx, "ce2-region-ordre", "ranger des régions du nord au sud ou de l'ouest à l'est", () => {
    const count = ctx.level >= 3 ? 4 : 3;
    const vertical = ctx.rng() < 0.6;
    const descending = ctx.rng() < 0.5;
    const gap = vertical ? (ctx.level >= 3 ? 0.5 : LAT_GAP) : ctx.level >= 3 ? 0.7 : LON_GAP;
    const value = (region: Region) => (vertical ? region.lat : region.lon);
    for (let attempt = 0; attempt < 400; attempt++) {
      const chosen = shuffle(ctx.rng, REGIONS).slice(0, count);
      // Du nord au sud : latitude décroissante ; de gauche à droite (de l'ouest à l'est) : longitude croissante.
      const sorted = [...chosen].sort((x, y) => (vertical ? value(y) - value(x) : value(x) - value(y)));
      if (!sorted.every((region, i) => i === 0 || Math.abs(value(region) - value(sorted[i - 1])) >= gap)) continue;
      const names = sorted.map((region) => region.name);
      const alphabetical = [...names].sort((x, y) => x.localeCompare(y, "fr"));
      const asked = vertical && descending ? [...names].reverse() : names;
      if (asked.every((name, i) => name === alphabetical[i]) || asked.every((name, i) => name === alphabetical[count - 1 - i])) continue;
      return {
        prompt: vertical
          ? `Range ces régions ${descending ? "du sud au nord" : "du nord au sud"}.`
          : "Range ces régions de gauche à droite sur la carte du Sénégal.",
        sequence: asked,
        hints: hints(
          "Imagine la carte du Sénégal posée devant toi.",
          "Compare la place de chaque région sur la carte.",
          vertical ? (descending ? "Commence par la région la plus basse sur la carte." : "Commence par la région la plus haute sur la carte.") : "Commence par la région la plus à gauche sur la carte.",
        ),
      };
    }
    throw new Error("régions impossibles à ranger");
  });
}

/** Les glissés de régions : nord ou sud (latitude), ouest ou est (longitude). */
const NORTH_REGIONS = regionsNamed("Saint-Louis", "Louga", "Matam");
const SOUTH_REGIONS = regionsNamed("Ziguinchor", "Sédhiou", "Kolda", "Kédougou");
const WEST_REGIONS = regionsNamed("Dakar", "Thiès", "Saint-Louis");
const EAST_REGIONS = regionsNamed("Tambacounda", "Matam", "Kédougou");
const REGION_SORT_HINTS = hints("Imagine la carte du Sénégal posée devant toi.", "Une case est en haut ou à gauche de la carte, l'autre en bas ou à droite.", "Compare la place de chaque région avec celle des autres.");
const REGION_SORT_ROWS: readonly SortRow[] = [
  ...combinations(NORTH_REGIONS, 2).flatMap((north) =>
    combinations(SOUTH_REGIONS, 2).map(
      (south): SortRow => ({
        prompt: "Glisse chaque région sous sa place sur la carte, nord ou sud.",
        zones: ["Nord", "Sud"],
        items: [...north.map((r) => ({ text: r.name, zone: "Nord" })), ...south.map((r) => ({ text: r.name, zone: "Sud" }))],
        hints: REGION_SORT_HINTS,
      }),
    ),
  ),
  ...combinations(WEST_REGIONS, 2).flatMap((west) =>
    combinations(EAST_REGIONS, 2).map(
      (east): SortRow => ({
        prompt: "Glisse chaque région sous sa place sur la carte, ouest ou est.",
        zones: ["Ouest", "Est"],
        items: [...west.map((r) => ({ text: r.name, zone: "Ouest" })), ...east.map((r) => ({ text: r.name, zone: "Est" }))],
        hints: REGION_SORT_HINTS,
      }),
    ),
  ),
];

export function makeCe2RegionSort(ctx: GameContext): GeneratedGame {
  return ce2Sort(ctx, "ce2-region-glisser", "classer des régions selon leur place", REGION_SORT_ROWS);
}

/** Ce que l'on retient de cinq régions, sans rien d'autre : une seule région par fait. */
const REGION_FACTS: readonly { region: string; fact: string }[] = [
  { region: "Dakar", fact: "La capitale du Sénégal" },
  { region: "Saint-Louis", fact: "Au bord du fleuve Sénégal" },
  { region: "Ziguinchor", fact: "Au cœur de la Casamance" },
  { region: "Kédougou", fact: "Des collines au sud-est" },
  { region: "Tambacounda", fact: "La plus grande région" },
];
const REGION_LINK_ROWS: readonly LinkRow[] = combinations(REGION_FACTS, 3).map(
  (facts): LinkRow => ({
    prompt: "Relie chaque région à ce qui la décrit.",
    pairs: facts.map((entry) => ({ left: entry.region, right: entry.fact })),
    hints: hints("Lis chaque nom à gauche.", "Pense à ce que tu sais de chacun.", "Commence par celui que tu connais le mieux."),
  }),
);

export function makeCe2RegionLinks(ctx: GameContext): GeneratedGame {
  return ce2Link(ctx, "ce2-region-relier", "relier une région à ce qui la décrit", REGION_LINK_ROWS);
}

const REGION_GAP_HINTS = hints("Lis la phrase en entier.", "Pense à ce que tu sais de ce pays.", "Un seul des trois mots a un sens dans cette phrase.");
const REGION_GAP_ROWS: readonly GapRow[] = [
  { text: "Dakar est la ___ du Sénégal.", answer: "capitale", wrong: ["colline", "pirogue"], hints: REGION_GAP_HINTS },
  { text: "Le Sénégal est partagé en quatorze ___.", answer: "régions", wrong: ["fleuves", "océans"], hints: REGION_GAP_HINTS },
  { text: "Chaque région a un chef-lieu qui porte le même ___ qu'elle.", answer: "nom", wrong: ["jour", "âge"], hints: REGION_GAP_HINTS },
  { text: "La région de Ziguinchor se trouve en ___.", answer: "Casamance", wrong: ["Mauritanie", "Guinée"], hints: REGION_GAP_HINTS },
  { text: "La région de Saint-Louis est au bord du fleuve ___.", answer: "Sénégal", wrong: ["Gambie", "Casamance"], hints: REGION_GAP_HINTS },
  { text: "La région de Kédougou est connue pour ses ___.", answer: "collines", wrong: ["îles", "dunes"], hints: REGION_GAP_HINTS },
  { text: "La région de Tambacounda est la plus ___ du pays.", answer: "grande", wrong: ["petite", "froide"], hints: REGION_GAP_HINTS },
  { text: "La région de Dakar est la plus ___ du pays.", answer: "petite", wrong: ["grande", "froide"], hints: REGION_GAP_HINTS },
];

tag(REGION_GAP_ROWS, (_, index) => ["region:Dakar", undefined, undefined, "region:Ziguinchor", "region:Saint-Louis", "region:Kédougou", "region:Tambacounda", "region:Dakar"][index]);

export function makeCe2RegionGap(ctx: GameContext): GeneratedGame {
  return ce2Gap(ctx, "ce2-region-trou", "compléter une phrase sur les régions du Sénégal", REGION_GAP_ROWS);
}

const REGION_WRITE_ROWS: readonly WriteRow[] = [
  { prompt: "Quelle est la capitale du Sénégal ? Écris le mot.", accepted: ["Dakar"], hints: hints("Lis bien la question.", "C'est la plus grande ville du pays.", "Le mot commence par la lettre D.") },
  { prompt: "Quelle région est la plus grande du pays ? Écris le mot.", accepted: ["Tambacounda"], hints: hints("Lis bien la question.", "Elle est à l'est, loin de l'océan.", "Le mot commence par la lettre T.") },
  { prompt: "Quelle région est la plus petite du pays ? Écris le mot.", accepted: ["Dakar"], hints: hints("Lis bien la question.", "Elle est au bord de l'océan, sur une presqu'île.", "Le mot commence par la lettre D.") },
  { prompt: "Combien de régions compte le Sénégal ? Écris le nombre.", accepted: ["14", "quatorze"], hints: hints("Lis bien la question.", "Compte les régions de la carte, une par une.", "C'est un nombre entre dix et vingt.") },
];

tag(REGION_WRITE_ROWS, (_, index) => ["region:Dakar", "region:Tambacounda", "region:Dakar", undefined][index]);

export function makeCe2RegionWrite(ctx: GameContext): GeneratedGame {
  return ce2Write(ctx, "ce2-region-ecrire", "écrire un fait sur les régions du Sénégal", REGION_WRITE_ROWS);
}

// ===========================================================================
// LES ACTIVITÉS DES HOMMES (ge-ce2-activites)
// ===========================================================================

const ACTIVITY_HINTS = (last: string): Hints => hints("Lis bien ce que fait chaque activité.", "Chaque activité a ses lieux et ses outils.", last);
const ACTIVITY_ROWS: readonly QuestionRow[] = [
  {
    prompt: "Quelle activité emploie des pirogues pour attraper du poisson ?",
    answer: "Pêche",
    wrong: ["Élevage", "Tourisme"],
    hints: ACTIVITY_HINTS("Pense à l'eau, aux filets et aux bateaux."),
  },
  {
    prompt: "Quelle activité consiste à garder des troupeaux de bœufs, de moutons et de chèvres ?",
    answer: "Élevage",
    wrong: ["Pêche", "Tourisme"],
    hints: ACTIVITY_HINTS("Pense aux animaux de la ferme et aux pâturages."),
  },
  {
    prompt: "Quelle activité accueille des visiteurs sur les plages de Saly ?",
    answer: "Tourisme",
    wrong: ["Agriculture", "Pêche"],
    hints: ACTIVITY_HINTS("Pense aux hôtels et aux vacances."),
  },
  {
    prompt: "Quelle activité plante du mil, de l'arachide et du riz ?",
    answer: "Agriculture",
    wrong: ["Pêche", "Tourisme"],
    hints: ACTIVITY_HINTS("Pense aux champs et aux récoltes."),
  },
  {
    prompt: "Quelle activité fait venir des visiteurs au Cap Skirring ?",
    answer: "Tourisme",
    wrong: ["Élevage", "Agriculture"],
    hints: ACTIVITY_HINTS("Pense aux voyageurs qui viennent se reposer."),
  },
  {
    prompt: "Quelle activité se pratique dans le port de Kayar ?",
    answer: "Pêche",
    wrong: ["Agriculture", "Élevage"],
    hints: ACTIVITY_HINTS("Pense à ce qu'on trouve dans un port au bord de la mer."),
  },
  {
    prompt: "Quelle activité cultive des légumes dans les Niayes ?",
    answer: "Agriculture",
    wrong: ["Tourisme", "Élevage"],
    hints: ACTIVITY_HINTS("Pense à la terre, à l'eau et aux jardins."),
  },
  {
    prompt: "Quelle activité élève des chèvres et des moutons ?",
    answer: "Élevage",
    wrong: ["Agriculture", "Pêche"],
    hints: ACTIVITY_HINTS("Pense à ceux qui soignent les troupeaux."),
  },
];

tag(ACTIVITY_ROWS, (row) => `activite:${row.answer}`);

/** « Quelle activité emploie des pirogues pour attraper du poisson ? » : une des quatre activités, parmi trois. */
export function makeCe2ActivityQuestion(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "ce2-activite-qcm", "reconnaître une activité des hommes", ACTIVITY_ROWS, 2);
}

const PRODUCT_HINTS = hints("Lis la question en entier.", "Pense au lieu et à l'activité dont elle parle.", "Un seul des trois choix correspond.");
const PRODUCT_ROWS: readonly QuestionRow[] = [
  { prompt: "Que cultive-t-on surtout dans les Niayes ?", answer: "Légumes", wrong: ["Bœufs", "Poisson"], hints: PRODUCT_HINTS },
  { prompt: "Que pêchent les pêcheurs de Kayar ?", answer: "Poisson", wrong: ["Mil", "Moutons"], hints: PRODUCT_HINTS },
  { prompt: "Qu'élèvent les éleveurs ?", answer: "Moutons", wrong: ["Riz", "Pirogues"], hints: PRODUCT_HINTS },
  { prompt: "Que sème-t-on dans un champ au début des pluies ?", answer: "Mil", wrong: ["Pirogues", "Bœufs"], hints: PRODUCT_HINTS },
  { prompt: "Qu'attrape-t-on avec des filets ?", answer: "Poisson", wrong: ["Riz", "Légumes"], hints: PRODUCT_HINTS },
  { prompt: "Que récolte-t-on dans un champ d'arachide ?", answer: "Arachides", wrong: ["Poissons", "Moutons"], hints: PRODUCT_HINTS },
];

tag(PRODUCT_ROWS, (_, index) => `activite:${["Agriculture", "Pêche", "Élevage", "Agriculture", "Pêche", "Agriculture"][index]}`);

export function makeCe2ProductQuestion(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "ce2-produit-qcm", "ce qu'on produit dans un lieu", PRODUCT_ROWS, 1, undefined, 1);
}

/** Les lieux et leur activité : deux lieux de pêche, deux lieux de tourisme, les Niayes pour les légumes. */
const PLACE_LINK_ROWS: readonly LinkRow[] = ["Kayar", "Joal"].flatMap((fishing) =>
  ["Saly", "Cap Skirring"].map(
    (tourism): LinkRow => ({
      prompt: "Relie chaque lieu à ce qu'on y fait le plus.",
      pairs: [
        { left: fishing, right: "Pêche" },
        { left: tourism, right: "Tourisme" },
        { left: "Niayes", right: "Légumes" },
      ],
      hints: hints("Lis chaque lieu à gauche.", "Pense à ce qu'on y fait le plus.", "Commence par le lieu que tu connais le mieux."),
    }),
  ),
);

export function makeCe2PlaceActivityLinks(ctx: GameContext): GeneratedGame {
  return ce2Link(ctx, "ce2-lieu-relier", "relier un lieu à son activité", PLACE_LINK_ROWS);
}

const CROPS = ["Mil", "Arachide", "Riz"] as const;
const HERDS = ["Bœufs", "Moutons", "Chèvres"] as const;
const FISHING = ["Pirogue", "Filet", "Poisson"] as const;
const TOURISM = ["Plage", "Hôtel", "Visiteur"] as const;
const FARM_SORT_ROWS: readonly SortRow[] = combinations(CROPS, 2).flatMap((crops) =>
  combinations(HERDS, 2).map(
    (herds): SortRow => ({
      prompt: "Glisse chaque mot sous son activité, agriculture ou élevage.",
      zones: ["Agriculture", "Élevage"],
      items: [...crops.map((text) => ({ text, zone: "Agriculture" })), ...herds.map((text) => ({ text, zone: "Élevage" }))],
      hints: hints("Lis chaque mot l'un après l'autre.", "Demande-toi si on le plante ou si on le soigne.", "Les champs d'un côté, les troupeaux de l'autre."),
    }),
  ),
);
const SEA_SORT_ROWS: readonly SortRow[] = combinations(FISHING, 2).flatMap((fishing) =>
  combinations(TOURISM, 2).map(
    (tourism): SortRow => ({
      prompt: "Glisse chaque mot sous son activité, pêche ou tourisme.",
      zones: ["Pêche", "Tourisme"],
      items: [...fishing.map((text) => ({ text, zone: "Pêche" })), ...tourism.map((text) => ({ text, zone: "Tourisme" }))],
      hints: hints("Lis chaque mot l'un après l'autre.", "Demande-toi si on le voit sur l'eau ou chez les vacanciers.", "Les gens qui travaillent d'un côté, les visiteurs de l'autre."),
    }),
  ),
);
/** Les deux paires de cases en alternance : chaque fenêtre de lignes pose les deux, et un palier n'en pose pas deux fois la même. */
const ACTIVITY_SORT_ROWS: readonly SortRow[] = tag(
  FARM_SORT_ROWS.flatMap((row, i) => [row, SEA_SORT_ROWS[i]]),
  (row) => `cases:${row.zones.join("/")}`,
);

export function makeCe2ActivitySort(ctx: GameContext): GeneratedGame {
  return ce2Sort(ctx, "ce2-activite-glisser", "classer des mots selon leur activité", ACTIVITY_SORT_ROWS, 2);
}

const ACTIVITY_GAP_HINTS = hints("Lis la phrase en entier.", "Pense à l'activité dont la phrase parle.", "Un seul des trois mots a un sens dans cette phrase.");
const ACTIVITY_GAP_ROWS: readonly GapRow[] = [
  { text: "Les Niayes sont connues pour le ___.", answer: "maraîchage", wrong: ["tourisme", "élevage"], hints: ACTIVITY_GAP_HINTS },
  { text: "À Kayar, les pêcheurs partent en mer en ___.", answer: "pirogue", wrong: ["charrette", "camion"], hints: ACTIVITY_GAP_HINTS },
  { text: "Le mil et l'arachide sont cultivés par les ___.", answer: "agriculteurs", wrong: ["pêcheurs", "touristes"], hints: ACTIVITY_GAP_HINTS },
  { text: "Les bœufs, les moutons et les chèvres sont élevés par les ___.", answer: "éleveurs", wrong: ["pêcheurs", "touristes"], hints: ACTIVITY_GAP_HINTS },
  { text: "Saly et le Cap Skirring accueillent des ___.", answer: "touristes", wrong: ["éleveurs", "pêcheurs"], hints: ACTIVITY_GAP_HINTS },
  { text: "Le poisson attrapé dans les filets est vendu au ___.", answer: "marché", wrong: ["désert", "puits"], hints: ACTIVITY_GAP_HINTS },
  { text: "Le riz, le mil et l'arachide poussent dans les ___.", answer: "champs", wrong: ["pirogues", "hôtels"], hints: ACTIVITY_GAP_HINTS },
  { text: "Joal et Mbour sont des ports de ___.", answer: "pêche", wrong: ["mines", "rizières"], hints: ACTIVITY_GAP_HINTS },
  { text: "On élève des troupeaux pour avoir de la viande et du ___.", answer: "lait", wrong: ["mil", "sable"], hints: ACTIVITY_GAP_HINTS },
  { text: "Un hôtel au bord de la plage accueille des ___.", answer: "visiteurs", wrong: ["pêcheurs", "bœufs"], hints: ACTIVITY_GAP_HINTS },
];

tag(ACTIVITY_GAP_ROWS, (_, index) => `activite:${["Agriculture", "Pêche", "Agriculture", "Élevage", "Tourisme", "Pêche", "Agriculture", "Pêche", "Élevage", "Tourisme"][index]}`);

export function makeCe2ActivityGap(ctx: GameContext): GeneratedGame {
  return ce2Gap(ctx, "ce2-activite-trou", "compléter une phrase sur les activités", ACTIVITY_GAP_ROWS, 2, 2);
}

/** Les étapes d'une sortie de pêche et d'une culture de mil, dans leur ordre : quatre étapes prises dans l'ordre. */
const FISHING_STEPS = ["Préparer la pirogue", "Partir en mer", "Jeter les filets", "Remonter les filets", "Revenir au port", "Vendre le poisson"] as const;
const FARMING_STEPS = ["Préparer le champ", "Attendre la pluie", "Semer le mil", "Récolter le mil", "Vendre le mil"] as const;
const STEPS_ROWS: readonly OrderRow[] = [
  ...combinations(FISHING_STEPS, 4).map(
    (steps): OrderRow => ({
      prompt: "Mets ces étapes de la pêche dans l'ordre du temps.",
      sequence: steps,
      hints: hints("Pense à la journée d'un pêcheur, du début à la fin.", "Ce qu'on prépare passe avant ce qu'on fait avec.", "Termine par ce que l'on fait quand tout est fini."),
    }),
  ),
  ...combinations(FARMING_STEPS, 4).map(
    (steps): OrderRow => ({
      prompt: "Mets ces étapes de la culture du mil dans l'ordre du temps.",
      sequence: steps,
      hints: hints("Pense à la vie des cultures, de la terre nue à la récolte.", "Ce qu'on prépare passe avant ce qu'on fait avec.", "Termine par ce que l'on fait quand tout est fini."),
    }),
  ),
];

export function makeCe2StepsOrder(ctx: GameContext): GeneratedGame {
  return ce2Order(ctx, "ce2-etapes-ordre", "ranger les étapes d'une activité", STEPS_ROWS);
}

const ACTIVITY_WRITE_ROWS: readonly WriteRow[] = [
  {
    prompt: "Quelle activité emploie des pirogues pour attraper du poisson ? Écris le mot.",
    accepted: ["pêche", "la pêche", "peche"],
    hints: hints("Lis bien la question.", "Pense à la mer et aux filets.", "Le mot commence par la lettre P."),
  },
  {
    prompt: "Quelle activité élève des bœufs, des moutons et des chèvres ? Écris le mot.",
    accepted: ["élevage", "l'élevage", "elevage"],
    hints: hints("Lis bien la question.", "Pense aux troupeaux et aux pâturages.", "Le mot commence par la lettre E."),
  },
  {
    prompt: "Quelle activité accueille des visiteurs sur la plage de Saly ? Écris le mot.",
    accepted: ["tourisme", "le tourisme"],
    hints: hints("Lis bien la question.", "Pense aux hôtels et aux vacances.", "Le mot commence par la lettre T."),
  },
  {
    prompt: "Quelle activité plante du mil et de l'arachide ? Écris le mot.",
    accepted: ["agriculture", "l'agriculture"],
    hints: hints("Lis bien la question.", "Pense aux champs et aux récoltes.", "Le mot commence par la lettre A."),
  },
];

tag(ACTIVITY_WRITE_ROWS, (_, index) => `activite:${["Pêche", "Élevage", "Tourisme", "Agriculture"][index]}`);

export function makeCe2ActivityWrite(ctx: GameContext): GeneratedGame {
  return ce2Write(ctx, "ce2-activite-ecrire", "écrire le nom d'une activité", ACTIVITY_WRITE_ROWS, 1, 3);
}

// ===========================================================================
// L'HABITAT ET LES DÉPLACEMENTS (ge-ce2-habitat)
// ===========================================================================

const VILLAGE_SIGHTS = ["Case", "Champ", "Troupeau"] as const;
const TOWN_SIGHTS = ["Immeuble", "Embouteillage", "Feu tricolore"] as const;
const HABITAT_SORT_ROWS: readonly SortRow[] = combinations(VILLAGE_SIGHTS, 2).flatMap((village) =>
  combinations(TOWN_SIGHTS, 2).map(
    (town): SortRow => ({
      prompt: "Glisse chaque élément sous le lieu où on le voit le plus souvent, village ou ville.",
      zones: ["Village", "Ville"],
      items: [...village.map((text) => ({ text, zone: "Village" })), ...town.map((text) => ({ text, zone: "Ville" }))],
      hints: hints("Lis chaque élément l'un après l'autre.", "Demande-toi si on le voit plutôt à la campagne ou dans un lieu très peuplé.", "Les champs et les animaux d'un côté, les rues bondées de l'autre."),
    }),
  ),
);

export function makeCe2HabitatSort(ctx: GameContext): GeneratedGame {
  return ce2Sort(ctx, "ce2-habitat-glisser", "distinguer l'habitat rural et urbain", HABITAT_SORT_ROWS);
}

const HABITAT_HINTS = hints("Lis la question en entier.", "Pense à la campagne et aux grands lieux très peuplés.", "Un seul des trois choix correspond.");
const HABITAT_ROWS: readonly QuestionRow[] = [
  { prompt: "Où voit-on surtout des champs autour des maisons ?", answer: "Au village", wrong: ["En ville", "Au port"], hints: HABITAT_HINTS },
  { prompt: "Dans quel habitat trouve-t-on beaucoup d'immeubles ?", answer: "En ville", wrong: ["Au village", "Dans un champ"], hints: HABITAT_HINTS },
  { prompt: "Avec quoi fait-on les briques d'un mur en banco ?", answer: "Terre", wrong: ["Verre", "Métal"], hints: HABITAT_HINTS },
  { prompt: "Avec quoi fait-on le toit d'une case traditionnelle ?", answer: "Paille", wrong: ["Verre", "Acier"], hints: HABITAT_HINTS },
  { prompt: "Avec quoi construit-on beaucoup de maisons en ville ?", answer: "Ciment", wrong: ["Paille", "Glace"], hints: HABITAT_HINTS },
];

export function makeCe2HabitatQuestion(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "ce2-habitat-qcm", "l'habitat rural et urbain et ses matériaux", HABITAT_ROWS);
}

/** Les voies de communication et le moyen de transport qui les prend. */
const ROUTES = [
  { way: "Route", means: "Voiture" },
  { way: "Chemin de fer", means: "Train" },
  { way: "Port", means: "Bateau" },
  { way: "Aéroport", means: "Avion" },
] as const;
const WAY_LINK_ROWS: readonly LinkRow[] = combinations(ROUTES, 3).flatMap((three) => [
  {
    prompt: "Relie chaque voie de communication au moyen qui l'utilise.",
    pairs: three.map((route) => ({ left: route.way, right: route.means })),
    hints: hints("Lis chaque mot à gauche.", "Chaque moyen a sa voie.", "Commence par celui dont tu es sûr."),
  },
  {
    prompt: "Relie chaque moyen de transport à la voie qu'il utilise.",
    pairs: three.map((route) => ({ left: route.means, right: route.way })),
    hints: hints("Lis chaque mot à gauche.", "Chaque moyen a sa voie.", "Commence par celui dont tu es sûr."),
  },
]);

export function makeCe2WayLinks(ctx: GameContext): GeneratedGame {
  return ce2Link(ctx, "ce2-voie-relier", "relier une voie de communication à son moyen de transport", WAY_LINK_ROWS);
}

const LAND_MEANS = ["Bus", "Camion", "Train", "Voiture"] as const;
const WATER_MEANS = ["Bateau", "Pirogue"] as const;
const MEANS_SORT_ROWS: readonly SortRow[] = [
  ...combinations(LAND_MEANS, 2).map(
    (land): SortRow => ({
      prompt: "Glisse chaque moyen de transport sous l'endroit où il se déplace.",
      zones: ["Terre", "Eau"],
      items: [...land.map((text) => ({ text, zone: "Terre" })), ...WATER_MEANS.map((text) => ({ text, zone: "Eau" }))],
      hints: hints("Lis chaque moyen l'un après l'autre.", "Demande-toi s'il roule ou s'il flotte.", "Ce qui flotte va d'un côté, ce qui roule de l'autre."),
    }),
  ),
  ...combinations(LAND_MEANS, 3).map(
    (land): SortRow => ({
      prompt: "Glisse chaque moyen de transport sous l'endroit où il se déplace.",
      zones: ["Terre", "Air"],
      items: [...land.map((text) => ({ text, zone: "Terre" })), { text: "Avion", zone: "Air" }],
      hints: hints("Lis chaque moyen l'un après l'autre.", "Demande-toi s'il roule ou s'il vole.", "Un seul de ces moyens quitte le sol."),
    }),
  ),
];

export function makeCe2MeansSort(ctx: GameContext): GeneratedGame {
  return ce2Sort(ctx, "ce2-moyen-glisser", "classer des moyens de transport selon leur milieu", MEANS_SORT_ROWS);
}

const MIGRATION_HINTS = hints("Lis la question en entier.", "Pense à ceux qui vivent à la campagne et à ce dont ils ont besoin.", "Un seul des trois choix correspond.");
const MIGRATION_ROWS: readonly QuestionRow[] = [
  { prompt: "Que veut dire exode rural ?", answer: "Partir du village pour aller en ville", wrong: ["Venir de la ville pour vivre au village", "Construire une route entre deux villages"], hints: MIGRATION_HINTS },
  { prompt: "Pourquoi des habitants quittent-ils leur village pendant la saison sèche ?", answer: "Il y a moins de travail dans les champs", wrong: ["Il pleut beaucoup", "Les champs sont inondés"], hints: MIGRATION_HINTS },
  { prompt: "Où partent souvent les habitants qui quittent leur village ?", answer: "Vers les villes", wrong: ["Vers les champs", "Vers les puits"], hints: MIGRATION_HINTS },
  { prompt: "Que cherchent souvent ceux qui partent en ville ?", answer: "Travail", wrong: ["Pirogue", "Troupeau"], hints: MIGRATION_HINTS },
  { prompt: "Quand beaucoup de gens partent d'un village, que devient-il ?", answer: "Il a moins d'habitants", wrong: ["Il a plus d'habitants", "Il devient un port"], hints: MIGRATION_HINTS },
  { prompt: "Un habitant qui quitte son village pour la ville fait partie de quel mouvement de population ?", answer: "Exode rural", wrong: ["Élevage", "Pêche"], hints: MIGRATION_HINTS },
  { prompt: "Que se passe-t-il dans les villes quand beaucoup de gens arrivent ?", answer: "Elles ont plus d'habitants", wrong: ["Elles ont moins d'habitants", "Elles deviennent des villages"], hints: MIGRATION_HINTS },
  { prompt: "Quelle saison pousse certains habitants à quitter leur village ?", answer: "La saison sèche", wrong: ["La saison des pluies", "La saison des fêtes"], hints: MIGRATION_HINTS },
];

export function makeCe2MigrationQuestion(ctx: GameContext): GeneratedGame {
  return ce2Question(ctx, "ce2-exode-qcm", "l'exode rural et les départs de la saison sèche", MIGRATION_ROWS, 2);
}

const MATERIAL_HINTS = hints("Lis la phrase en entier.", "Pense à la maison dont la phrase parle.", "Un seul des trois mots a un sens dans cette phrase.");
const MATERIAL_ROWS: readonly GapRow[] = [
  { text: "Les murs d'une case en banco sont faits de ___.", answer: "terre", wrong: ["verre", "fer"], hints: MATERIAL_HINTS },
  { text: "Le toit d'une case traditionnelle est souvent fait de ___.", answer: "paille", wrong: ["verre", "glace"], hints: MATERIAL_HINTS },
  { text: "En ville, beaucoup d'immeubles sont construits en ___.", answer: "béton", wrong: ["paille", "glace"], hints: MATERIAL_HINTS },
  { text: "Un toit en ___ brille au soleil et résiste à la pluie.", answer: "tôle", wrong: ["paille", "herbe"], hints: MATERIAL_HINTS },
  { text: "Les briques sont faites de terre mélangée avec de l'___.", answer: "eau", wrong: ["huile", "fer"], hints: MATERIAL_HINTS },
  { text: "Une maison en ___ est solide et dure longtemps.", answer: "dur", wrong: ["eau", "vent"], hints: MATERIAL_HINTS },
  { text: "La case est surtout la maison du ___.", answer: "village", wrong: ["port", "désert"], hints: MATERIAL_HINTS },
  { text: "Un immeuble a plusieurs ___.", answer: "étages", wrong: ["pirogues", "champs"], hints: MATERIAL_HINTS },
];

export function makeCe2MaterialGap(ctx: GameContext): GeneratedGame {
  return ce2Gap(ctx, "ce2-materiau-trou", "les matériaux de l'habitat", MATERIAL_ROWS, 2);
}

/** Du plus lent au plus rapide : à pied, la charrette, la voiture, l'avion. */
const SPEED = ["À pied", "Charrette", "Voiture", "Avion"] as const;
const SPEED_ROWS: readonly OrderRow[] = combinations(SPEED, 3).flatMap((three) => [
  {
    prompt: "Mets ces moyens de transport du plus lent au plus rapide.",
    sequence: three,
    hints: hints("Pense à la vitesse de chaque moyen.", "Compare ce qui avance avec les pieds, avec un animal, avec un moteur ou avec des ailes.", "Commence par celui qui avance le plus doucement."),
  },
  {
    prompt: "Mets ces moyens de transport du plus rapide au plus lent.",
    sequence: [...three].reverse(),
    hints: hints("Pense à la vitesse de chaque moyen.", "Compare ce qui avance avec les pieds, avec un animal, avec un moteur ou avec des ailes.", "Commence par celui qui avance le plus vite."),
  },
]);

export function makeCe2SpeedOrder(ctx: GameContext): GeneratedGame {
  return ce2Order(ctx, "ce2-vitesse-ordre", "ranger des moyens de transport par vitesse", SPEED_ROWS);
}

const MEANS_WRITE_ROWS: readonly WriteRow[] = [
  { prompt: "Quel moyen de transport utilise un port ? Écris le mot.", accepted: ["bateau", "un bateau", "navire", "pirogue"], hints: hints("Lis bien la question.", "Il flotte sur l'eau.", "Le mot commence par la lettre B.") },
  { prompt: "Quel moyen de transport utilise un aéroport ? Écris le mot.", accepted: ["avion", "un avion"], hints: hints("Lis bien la question.", "Il vole dans le ciel.", "Le mot commence par la lettre A.") },
  { prompt: "Quel moyen de transport roule sur le chemin de fer ? Écris le mot.", accepted: ["train", "un train"], hints: hints("Lis bien la question.", "Il est fait de plusieurs wagons.", "Le mot commence par la lettre T.") },
  { prompt: "Quelle voie de communication prend une voiture ? Écris le mot.", accepted: ["route", "la route"], hints: hints("Lis bien la question.", "Elle est en terre ou goudronnée.", "Le mot commence par la lettre R.") },
];

export function makeCe2MeansWrite(ctx: GameContext): GeneratedGame {
  return ce2Write(ctx, "ce2-moyen-ecrire", "écrire un moyen de transport ou une voie", MEANS_WRITE_ROWS);
}
