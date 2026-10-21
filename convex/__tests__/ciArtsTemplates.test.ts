import { describe, expect, it } from "vitest";
import { explainTilePictures, pictureForTile, promptForbidsPictures } from "../../lib/item-pictures";
import { auditExercise } from "../paliers/exerciseAudit";
import { GAME_KINDS, gameOriginOf, generateGames, regenerateGame, type GameKind } from "../paliers/games";
import {
  COLOUR_FEMININE,
  COLOUR_ORDERS,
  COLOUR_THINGS,
  COLOUR_TILES,
  FRISE_MOTIFS,
  OBJECT_SHAPES,
  SHAPE_GAPS,
  SHAPE_TILES,
} from "../paliers/games/plastiqueCi";
import { ANIMAL_CRIES, EMOTION_GAPS, EMOTION_NAMES, EMOTION_THE, FACES, GESTURES, SITUATIONS } from "../paliers/games/mimesCi";
import { makeContext, type GameLevel } from "../paliers/games/shared";
import { topicUsesModel } from "../paliers/pregen";
import { PALIER_SIZE } from "../paliers/scoring";
import { allProgrammeEntries } from "../programme";
import { promptForbidsTileVoice } from "../voice/tiles";

/**
 * LES GABARITS DES ARTS DU CI : les couleurs, les formes, les frises, les mimes et les émotions
 * (`ar-ci-couleurs`, `ar-ci-formes`, `ar-ci-frises`, `ar-ci-mimes`).
 *
 * Chaque gabarit a son VÉRIFICATEUR, écrit ici avec ses propres tables (une chose et sa couleur, un objet et sa forme,
 * un visage et son émotion, un animal et son cri) : il recalcule la bonne réponse depuis l'énoncé et les tuiles, et
 * il liste ce qui cloche. Un test abîme ensuite chaque gabarit (le bon choix déplacé, une tuile dans la mauvaise case,
 * deux paires échangées, deux couleurs échangées) et exige que son vérificateur le voie : un contrôle qui ne verrait
 * rien ne prouverait rien. Les tables ci-dessous sont une copie figée des modules `plastiqueCi.ts` et `mimesCi.ts`,
 * relue à la main : changer une chose, une forme ou un visage oblige à changer ce fichier, donc à la relire. Sur les
 * seize exercices d'arts du modèle que nous avons lus, cinq étaient faux ; dans l'export de la production, on trouvait
 * en plus la mangue « jaune », la goyave « rouge », un ballon « rond » et des émotions « dans l'ordre de l'histoire ».
 *
 * La variété compte autant que la justesse : les associations ne reprennent pas la même paire d'un palier à l'autre, les
 * rangements de couleurs ne partagent qu'une chose, et un palier de mimes répartit ses émotions (voir la fin du fichier).
 */

type Exo = { type: string; prompt: string; answerKey: string; hints: string[]; payload: Record<string, unknown> };

// ---------------------------------------------------------------------------
// Les tables du test, écrites ici et non lues dans les modules
// ---------------------------------------------------------------------------

type ColourName = "rouge" | "jaune" | "vert" | "bleu" | "orange" | "violet" | "blanc";
const COLOUR_EMOJI: Record<ColourName, string> = { rouge: "🔴", jaune: "💛", vert: "💚", bleu: "🔵", orange: "🧡", violet: "💜", blanc: "⚪" };
const colourTile = (colour: ColourName) => `${COLOUR_EMOJI[colour]} ${colour}`;
const BASIC: ColourName[] = ["rouge", "jaune", "vert", "bleu"];

/** Une chose et la couleur de son dessin au catalogue. */
const COLOUR_ROWS: [string, ColourName][] = [
  ["la tomate", "rouge"],
  ["la fraise", "rouge"],
  ["la banane", "jaune"],
  ["le soleil", "jaune"],
  ["le poussin", "jaune"],
  ["la feuille", "vert"],
  ["le concombre", "vert"],
  ["le brocoli", "vert"],
  ["le crocodile", "vert"],
  ["le ciel", "bleu"],
  ["la carotte", "orange"],
  ["l'aubergine", "violet"],
  ["le lait", "blanc"],
  ["le sel", "blanc"],
];
const COLOUR_OF = new Map(COLOUR_ROWS);
const FEMININE_TO_COLOUR: Record<string, ColourName> = { rouge: "rouge", jaune: "jaune", verte: "vert", bleue: "bleu", orange: "orange", violette: "violet", blanche: "blanc" };
/** Les réponses de « Quelle chose est … ? » par niveau : trois paliers, trois couleurs, jamais la même question. */
const CHOSE_FIRST = ["la tomate", "la fraise", "la banane", "le soleil", "le poussin"];
const CHOSE_SECOND = ["la feuille", "le concombre", "le brocoli", "le crocodile", "le ciel"];
const CHOSE_THIRD = ["la carotte", "l'aubergine", "le lait", "le sel"];
const SORT_COLOURS: [ColourName, ColourName][] = [
  ["rouge", "jaune"],
  ["jaune", "vert"],
  ["vert", "blanc"],
];
const ORDER_ROWS: [string, ColourName[]][] = [
  ["Mets les couleurs du drapeau du Sénégal dans l'ordre, de gauche à droite.", ["vert", "jaune", "rouge"]],
  ["Mets dans l'ordre les lumières du feu, de haut en bas.", ["rouge", "jaune", "vert"]],
  ["Mets ces couleurs de l'arc-en-ciel en partant du haut.", ["rouge", "orange", "jaune", "vert"]],
];

type ShapeName = "rond" | "carré" | "triangle" | "rectangle" | "étoile" | "cœur";
const SHAPE_TILE: Record<ShapeName, string> = {
  rond: "le rond",
  carré: "le carré",
  triangle: "le triangle",
  rectangle: "le rectangle",
  étoile: "l'étoile",
  cœur: "le cœur",
};
const SIMPLE_SHAPES: ShapeName[] = ["rond", "carré", "triangle", "rectangle"];
/** Un objet et la forme de son dessin au catalogue, dans l'ordre des tiers par niveau. */
const OBJECT_ROWS: [string, ShapeName][] = [
  ["l'assiette", "rond"],
  ["le toit", "triangle"],
  ["le drapeau", "rectangle"],
  ["la fenêtre", "carré"],
  ["la pizza", "rond"],
  ["la tente", "triangle"],
  ["le livre", "rectangle"],
  ["l'étoile de mer", "étoile"],
  ["le cahier", "rectangle"],
  ["la règle", "rectangle"],
];
const SHAPE_OF = new Map(OBJECT_ROWS);
const SORT_SHAPES: [ShapeName, ShapeName][] = [
  ["rond", "rectangle"],
  ["triangle", "rond"],
  ["rectangle", "triangle"],
];

type GapRow = { text: string; answer: string; wrong: [string, string] };
const SHAPE_GAP_ROWS: GapRow[] = [
  { text: "Une assiette a la forme d'un ___.", answer: "rond", wrong: ["carré", "triangle"] },
  { text: "Le triangle a ___ coins.", answer: "trois", wrong: ["quatre", "cinq"] },
  { text: "La fenêtre a la forme d'un ___.", answer: "carré", wrong: ["rond", "triangle"] },
  { text: "Le carré a ___ côtés pareils.", answer: "quatre", wrong: ["trois", "cinq"] },
  { text: "Le toit a la forme d'un ___.", answer: "triangle", wrong: ["rond", "carré"] },
  { text: "Le drapeau a la forme d'un ___.", answer: "rectangle", wrong: ["rond", "triangle"] },
  { text: "Le rectangle a ___ coins.", answer: "quatre", wrong: ["trois", "cinq"] },
];
const EMOTION_GAP_ROWS: GapRow[] = [
  { text: "Quand je suis triste, je ___.", answer: "pleure", wrong: ["saute", "danse"] },
  { text: "Quand j'ai peur, je ___.", answer: "tremble", wrong: ["danse", "mange"] },
  { text: "Quand je suis en colère, je ___.", answer: "crie", wrong: ["dors", "danse"] },
  { text: "Quand on me donne un beau cadeau, je ___ de joie.", answer: "saute", wrong: ["dors", "mange"] },
  { text: "Le clown me fait ___.", answer: "rire", wrong: ["dormir", "manger"] },
];
/** L'émotion que dit chaque phrase à trou des émotions. */
const GAP_EMOTION: Record<string, "joie" | "tristesse" | "colère" | "peur" | "surprise"> = {
  "Quand je suis triste, je ___.": "tristesse",
  "Quand j'ai peur, je ___.": "peur",
  "Quand je suis en colère, je ___.": "colère",
  "Quand on me donne un beau cadeau, je ___ de joie.": "joie",
  "Le clown me fait ___.": "joie",
};

const FRISE_EMOJIS = ["🌳", "🏠", "🐟", "⭐", "🌸", "🍌", "🍎", "🐱", "🌙", "🦁", "🐢", "⛵", "🌴", "🥁"];
/** Le groupe qui se répète et la longueur de la frise montrée, par niveau (1, 2, puis 3 et 4). */
const SUITE_UNITS = ["AB", "AAB", "ABC"];
const SUITE_SHOWN = [5, 8, 8];
const INTRUS_UNITS = ["AB", "AB", "ABC"];
const INTRUS_LENGTH = [8, 10, 9];

type EmotionName = "joie" | "tristesse" | "colère" | "peur" | "surprise";
const EMOTION_LABEL: Record<EmotionName, string> = { joie: "Joie", tristesse: "Tristesse", colère: "Colère", peur: "Peur", surprise: "Surprise" };
const EMOTION_ARTICLE: Record<EmotionName, string> = { joie: "la joie", tristesse: "la tristesse", colère: "la colère", peur: "la peur", surprise: "la surprise" };
const EASY_EMOTIONS: EmotionName[] = ["joie", "tristesse", "colère"];
const FACE_ROWS: [string, EmotionName][] = [
  ["😀", "joie"],
  ["😢", "tristesse"],
  ["😠", "colère"],
  ["😊", "joie"],
  ["😭", "tristesse"],
  ["😡", "colère"],
  ["😨", "peur"],
  ["😲", "surprise"],
  ["😱", "peur"],
  ["😮", "surprise"],
  ["😄", "joie"],
];
const EMOTION_OF_FACE = new Map(FACE_ROWS);
const FIRST_FACE = (emotion: EmotionName) => (FACE_ROWS.find(([, e]) => e === emotion) as [string, EmotionName])[0];
const NEAR_FACES: Record<EmotionName, EmotionName[]> = { joie: [], tristesse: [], colère: [], peur: ["surprise"], surprise: ["peur"] };
const NEAR_SITUATIONS: Record<EmotionName, EmotionName[]> = { joie: ["surprise"], tristesse: ["colère"], colère: ["tristesse"], peur: ["surprise"], surprise: ["peur", "joie"] };
const ASKED: EmotionName[][] = [["joie", "tristesse"], ["colère", "peur"], ["surprise"]];
/** Les trois cases des deux rangements de visages du dernier niveau : chacun les siennes, la joie en commun. */
const HARD_TRIPLES: EmotionName[][] = [["tristesse", "peur", "joie"], ["colère", "surprise", "joie"]];
const SITUATION_ROWS: [string, EmotionName][] = [
  ["Tu reçois un beau cadeau.", "joie"],
  ["Tu perds ton jouet préféré.", "tristesse"],
  ["Un enfant casse ton jouet exprès.", "colère"],
  ["Tu entends un grand bruit dans le noir.", "peur"],
  ["Tu joues avec tous tes amis.", "joie"],
  ["Ton meilleur ami part très loin.", "tristesse"],
  ["Un enfant te pousse exprès.", "colère"],
  ["Un gros chien aboie près de toi.", "peur"],
];
const GESTURE_ROWS: Record<EmotionName, string> = {
  joie: "🕺 Je souris et je saute de joie",
  tristesse: "💧 Je pleure et je baisse la tête",
  colère: "👊 Je serre les poings et je tape du pied",
  peur: "🙈 Je me cache et je tremble",
  surprise: "👀 J'ouvre grand la bouche et les yeux",
};
const CRY_ROWS: [string, string][] = [
  ["le chat", "miaou"],
  ["la vache", "meuh"],
  ["le chien", "ouaf ouaf"],
  ["la poule", "cot cot"],
  ["le mouton", "bê bê"],
  ["l'âne", "hi-han"],
  ["le poussin", "piou piou"],
];
const CRY_OF = new Map(CRY_ROWS);

/** Les émojis de tout le module : chacun d'Unicode 11 au plus, sans sélecteur de variation. */
const ALLOWED_EMOJI = Array.from("🔴💛💚🔵🧡💜⚪🌳🏠🐟⭐🌸🍌🍎🐱🌙🦁🐢⛵🌴🥁❓😀😢😠😊😭😡😨😲😱😮😄🕺💧👊🙈👀");
const VARIATION_SELECTOR = String.fromCodePoint(0xfe0f);
const JOINER = String.fromCodePoint(0x200d);

// ---------------------------------------------------------------------------
// Les outils des vérificateurs
// ---------------------------------------------------------------------------

const LEVELS: GameLevel[] = [1, 2, 3, 4];
type Draw = { level: GameLevel; seed: string };
/** Cent vingt tirages par gabarit : les quatre niveaux, trente graines. */
const DRAWS: Draw[] = LEVELS.flatMap((level) => Array.from({ length: 30 }, (_, n) => ({ level, seed: `arts:${level}:${n}` })));
const make = (kind: GameKind, d: Draw) => GAME_KINDS[kind].make(makeContext("CI", d.level, `${kind}:${d.seed}`)) as unknown as Exo;

const optionsOf = (exo: Exo) => exo.payload.options as string[];
const rightOption = (exo: Exo) => optionsOf(exo)[exo.payload.correctIndex as number];
const itemsOf = (exo: Exo) => exo.payload.items as { text: string; correctZone: string }[];
const zonesOf = (exo: Exo) => exo.payload.zones as string[];
const sequenceOf = (exo: Exo) => exo.payload.correctSequence as string[];
const pairsOf = (exo: Exo) => exo.payload.pairs as { left: string; right: string }[];
const blankOf = (exo: Exo) => (exo.payload.blanks as { options: string[]; answer: string }[])[0];
const textOf = (exo: Exo) => exo.payload.text as string;
const levelOf = (exo: Exo) => (exo.payload.game as { level: number }).level as GameLevel;
const clone = (exo: Exo): Exo => JSON.parse(JSON.stringify(exo)) as Exo;

const stripEmoji = (text: string) => text.replace(/\p{Extended_Pictographic}/gu, "").replace(/\s+/g, " ").trim();
const fold = (text: string) => text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
const eq = (label: string, actual: unknown, expected: unknown): string[] =>
  JSON.stringify(actual) === JSON.stringify(expected) ? [] : [`${label} : ${JSON.stringify(actual)} au lieu de ${JSON.stringify(expected)}`];
const isTrue = (label: string, value: boolean): string[] => (value ? [] : [label]);
const distinct = (label: string, values: readonly string[]): string[] =>
  isTrue(`${label} : des doublons dans ${JSON.stringify(values)}`, new Set(values).size === values.length);

/** Ce qui fait l'identité d'un exercice, sans l'ordre où l'écran mélange ses tuiles. */
const signature = (exo: Exo) =>
  JSON.stringify([
    exo.prompt,
    exo.payload.options ? [...optionsOf(exo)].sort() : null,
    exo.payload.items ? itemsOf(exo).map((item) => item.text).sort() : null,
    exo.payload.pairs ? pairsOf(exo).map((pair) => pair.left + pair.right).sort() : null,
    exo.payload.correctSequence ?? null,
    exo.payload.text ?? null,
  ]);

/** Le tiers des variantes d'un niveau : un palier par niveau, trois paliers sans la même question. */
function third<T>(items: readonly T[], level: GameLevel): T[] {
  const group = level === 1 ? 0 : level === 2 ? 1 : 2;
  const from = Math.floor((items.length * group) / 3);
  const to = Math.floor((items.length * (group + 1)) / 3);
  return to > from ? items.slice(from, to) : [...items];
}
const byLevel = <T>(level: GameLevel, first: T, second: T, last: T): T => (level === 1 ? first : level === 2 ? second : last);

// ---------------------------------------------------------------------------
// Les vérificateurs, un par gabarit
// ---------------------------------------------------------------------------

/** « Quelle chose est jaune ? » : une chose de cette couleur parmi trois, la part de chaque niveau. */
function checkTeinteChoice(exo: Exo): string[] {
  const match = /^Quelle chose est (\p{L}+) \?$/u.exec(exo.prompt);
  const asked = match ? FEMININE_TO_COLOUR[match[1]] : undefined;
  if (!asked) return [`énoncé inconnu : « ${exo.prompt} »`];
  const options = optionsOf(exo);
  const right = rightOption(exo);
  const level = levelOf(exo);
  return [
    ...eq("type", exo.type, "qcm"),
    ...eq("trois options", options.length, 3),
    ...distinct("options", options),
    ...isTrue("une option que la table ne connaît pas", options.every((option) => COLOUR_OF.has(option))),
    ...isTrue(`« ${right} » n'est pas ${asked}`, COLOUR_OF.get(right) === asked),
    ...isTrue("plus d'une option de la couleur demandée", options.filter((option) => COLOUR_OF.get(option) === asked).length === 1),
    ...isTrue("la réponse n'est pas celle de ce niveau", byLevel(level, CHOSE_FIRST, CHOSE_SECOND, CHOSE_THIRD).includes(right)),
    ...(level === 1 ? isTrue("une couleur hors des quatre premières", options.every((option) => BASIC.includes(COLOUR_OF.get(option) as ColourName))) : []),
    ...eq("la réponse de la fiche", exo.answerKey, right),
  ];
}

/** « Relie chaque chose à sa couleur. » : trois choses, trois couleurs. */
function checkTeinteLinks(exo: Exo): string[] {
  const pairs = pairsOf(exo);
  return [
    ...eq("type", exo.type, "match"),
    ...eq("trois paires", pairs.length, 3),
    ...pairs.flatMap((pair) => {
      const colour = COLOUR_OF.get(pair.left);
      return isTrue(`« ${pair.left} » relié à « ${pair.right} »`, colour !== undefined && pair.right === colourTile(colour));
    }),
    ...distinct("choses", pairs.map((pair) => pair.left)),
    ...distinct("couleurs", pairs.map((pair) => pair.right)),
    ...(levelOf(exo) === 1 ? isTrue("une couleur hors des quatre premières", pairs.every((pair) => BASIC.includes(COLOUR_OF.get(pair.left) as ColourName))) : []),
  ];
}

/** « Glisse chaque chose dans sa couleur. » : deux cases par niveau, quatre tuiles, cinq aux deux derniers niveaux. */
function checkTeinteSort(exo: Exo): string[] {
  const level = levelOf(exo);
  const [first, second] = byLevel(level, SORT_COLOURS[0], SORT_COLOURS[1], SORT_COLOURS[2]);
  const items = itemsOf(exo);
  return [
    ...eq("type", exo.type, "drag-drop"),
    ...eq("les cases", [...zonesOf(exo)].sort(), [colourTile(first), colourTile(second)].sort()),
    ...items.flatMap((item) => {
      const colour = COLOUR_OF.get(item.text);
      return isTrue(`la case de « ${item.text} »`, colour !== undefined && item.correctZone === colourTile(colour));
    }),
    ...eq("tuiles", items.length, level <= 2 ? 4 : 5),
    ...distinct("choses", items.map((item) => item.text)),
    ...[first, second].flatMap((colour) => isTrue(`la case ${colour} reçoit moins de deux choses`, items.filter((item) => item.correctZone === colourTile(colour)).length >= 2)),
  ];
}

/** « Mets les couleurs du drapeau dans l'ordre. » : une suite par niveau. */
function checkTeinteOrder(exo: Exo): string[] {
  const [prompt, steps] = byLevel(levelOf(exo), ORDER_ROWS[0], ORDER_ROWS[1], ORDER_ROWS[2]);
  return [...eq("type", exo.type, "order"), ...eq("l'énoncé", exo.prompt, prompt), ...eq("l'ordre", sequenceOf(exo), steps.map(colourTile))];
}

/** « Quelle forme a l'assiette ? » : la forme de l'objet parmi trois formes. */
function checkContourChoice(exo: Exo): string[] {
  const match = /^Quelle forme a (.+) \?$/.exec(exo.prompt);
  const object = match?.[1] ?? "";
  const shape = SHAPE_OF.get(object);
  if (!shape) return [`objet inconnu : « ${object} »`];
  const options = optionsOf(exo);
  const level = levelOf(exo);
  const tilesOfShapes = Object.values(SHAPE_TILE);
  return [
    ...eq("type", exo.type, "qcm"),
    ...eq("trois options", options.length, 3),
    ...distinct("options", options),
    ...isTrue("une option qui n'est pas une forme", options.every((option) => tilesOfShapes.includes(option))),
    ...eq("la bonne forme", rightOption(exo), SHAPE_TILE[shape]),
    ...isTrue("l'objet n'est pas celui de ce niveau", third(OBJECT_ROWS, level).some(([name]) => name === object)),
    ...(level === 1 ? isTrue("une forme hors des quatre premières", options.every((option) => SIMPLE_SHAPES.some((name) => SHAPE_TILE[name] === option))) : []),
    ...eq("la réponse de la fiche", exo.answerKey, SHAPE_TILE[shape]),
  ];
}

/** « Relie chaque chose à sa forme. » : trois objets, trois formes. */
function checkContourLinks(exo: Exo): string[] {
  const pairs = pairsOf(exo);
  return [
    ...eq("type", exo.type, "match"),
    ...eq("trois paires", pairs.length, 3),
    ...pairs.flatMap((pair) => {
      const shape = SHAPE_OF.get(pair.left);
      return isTrue(`« ${pair.left} » relié à « ${pair.right} »`, shape !== undefined && pair.right === SHAPE_TILE[shape]);
    }),
    ...distinct("objets", pairs.map((pair) => pair.left)),
    ...distinct("formes", pairs.map((pair) => pair.right)),
    ...(levelOf(exo) === 1 ? isTrue("une forme hors des quatre premières", pairs.every((pair) => SIMPLE_SHAPES.includes(SHAPE_OF.get(pair.left) as ShapeName))) : []),
  ];
}

/** « Glisse chaque chose dans sa forme. » : deux cases par niveau, quatre tuiles, cinq aux deux derniers niveaux. */
function checkContourSort(exo: Exo): string[] {
  const level = levelOf(exo);
  const [first, second] = byLevel(level, SORT_SHAPES[0], SORT_SHAPES[1], SORT_SHAPES[2]);
  const items = itemsOf(exo);
  const counts = level <= 2 ? [2, 2] : [3, 2];
  return [
    ...eq("type", exo.type, "drag-drop"),
    ...eq("les cases", [...zonesOf(exo)].sort(), [SHAPE_TILE[first], SHAPE_TILE[second]].sort()),
    ...items.flatMap((item) => {
      const shape = SHAPE_OF.get(item.text);
      return isTrue(`la case de « ${item.text} »`, shape !== undefined && item.correctZone === SHAPE_TILE[shape]);
    }),
    ...eq("la première case", items.filter((item) => item.correctZone === SHAPE_TILE[first]).length, counts[0]),
    ...eq("la seconde case", items.filter((item) => item.correctZone === SHAPE_TILE[second]).length, counts[1]),
    ...distinct("objets", items.map((item) => item.text)),
  ];
}

/** Une phrase à trou de la table : le mot juste et deux mots faux, la part de chaque niveau. */
function gapChecker(rows: GapRow[]) {
  return (exo: Exo): string[] => {
    const row = rows.find((candidate) => candidate.text === textOf(exo));
    if (!row) return [`phrase inconnue : « ${textOf(exo)} »`];
    const blank = blankOf(exo);
    return [
      ...eq("type", exo.type, "fill-blank"),
      ...eq("les mots", [...blank.options].sort(), [row.answer, ...row.wrong].sort()),
      ...eq("le bon mot", blank.answer, row.answer),
      ...eq("un seul trou", textOf(exo).split("___").length - 1, 1),
      ...isTrue("la phrase n'est pas celle de ce niveau", third(rows, levelOf(exo)).includes(row)),
    ];
  };
}

/** La frise d'un énoncé : les émojis de la seconde ligne, sans le « ❓ » final. */
function friseOf(exo: Exo): { items: string[]; question: boolean } {
  const lines = exo.prompt.split("\n");
  const parts = (lines[1] ?? "").split(" ").filter(Boolean);
  const question = parts[parts.length - 1] === "❓";
  return { items: question ? parts.slice(0, -1) : parts, question };
}

/** Les lettres d'une frise, dans l'ordre où ses dessins apparaissent : « 🌳 🏠 🌳 » donne « ABA ». */
function lettersOf(items: string[]): string {
  const seen: string[] = [];
  return items
    .map((item) => {
      if (!seen.includes(item)) seen.push(item);
      return String.fromCharCode(65 + seen.indexOf(item));
    })
    .join("");
}

/** « Quel dessin continue la frise ? » : la frise se répète, le dessin suivant est le bon. */
function checkFriseNext(exo: Exo): string[] {
  const level = levelOf(exo);
  const unit = byLevel(level, SUITE_UNITS[0], SUITE_UNITS[1], SUITE_UNITS[2]);
  const shown = byLevel(level, SUITE_SHOWN[0], SUITE_SHOWN[1], SUITE_SHOWN[2]);
  const { items, question } = friseOf(exo);
  const options = optionsOf(exo);
  const right = rightOption(exo);
  const expected = Array.from({ length: shown + 1 }, (_, index) => unit[index % unit.length]).join("");
  // Le dessin que la frise appelle : celui de la lettre suivante du groupe, dans l'ordre où les dessins ont paru.
  const next = [...new Set(items)][unit.charCodeAt(shown % unit.length) - 65];
  return [
    ...eq("type", exo.type, "qcm"),
    ...isTrue("la première ligne de l'énoncé", exo.prompt.startsWith("Quel dessin continue la frise ?\n")),
    ...isTrue("pas de « ❓ » à la fin de la frise", question),
    ...eq("dessins montrés", items.length, shown),
    ...eq("le groupe qui se répète", lettersOf(items), expected.slice(0, shown)),
    ...isTrue("un dessin hors de la liste", items.every((item) => FRISE_EMOJIS.includes(item)) && options.every((option) => FRISE_EMOJIS.includes(option))),
    ...eq("trois options", options.length, 3),
    ...distinct("options", options),
    ...isTrue("le bon dessin n'est pas celui que la frise appelle", right === next),
    ...isTrue("plusieurs faux choix qui ne viennent pas de la frise", options.filter((option) => !items.includes(option)).length === 1),
    ...eq("la réponse de la fiche", exo.answerKey, right),
  ];
}

/** « Quel dessin n'est pas à sa place dans la frise ? » : un intrus, vu une seule fois, parmi les dessins du groupe. */
function checkFriseOdd(exo: Exo): string[] {
  const level = levelOf(exo);
  const unit = byLevel(level, INTRUS_UNITS[0], INTRUS_UNITS[1], INTRUS_UNITS[2]);
  const length = byLevel(level, INTRUS_LENGTH[0], INTRUS_LENGTH[1], INTRUS_LENGTH[2]);
  const { items, question } = friseOf(exo);
  const options = optionsOf(exo);
  const right = rightOption(exo);
  // Les premiers dessins ne sont jamais l'intrus : ils donnent le groupe.
  const group = items.slice(0, new Set(unit).size);
  const expected = items.map((_, index) => group[unit.charCodeAt(index % unit.length) - 65]);
  const wrong = items.map((item, index) => (item === expected[index] ? -1 : index)).filter((index) => index !== -1);
  return [
    ...eq("type", exo.type, "qcm"),
    ...isTrue("la première ligne de l'énoncé", exo.prompt.startsWith("Quel dessin n'est pas à sa place dans la frise ?\n")),
    ...isTrue("un « ❓ » dans une frise sans trou", !question),
    ...eq("dessins montrés", items.length, length),
    ...eq("dessins hors du groupe", wrong.length, 1),
    ...isTrue("l'intrus se glisse trop tôt", wrong.length === 1 && wrong[0] >= 3),
    ...isTrue("l'intrus n'est pas le bon dessin", wrong.length === 1 && items[wrong[0]] === right),
    ...isTrue("l'intrus apparaît plus d'une fois", items.filter((item) => item === right).length === 1),
    ...isTrue("un dessin hors de la liste", items.every((item) => FRISE_EMOJIS.includes(item))),
    ...eq("trois options", options.length, 3),
    ...distinct("options", options),
    ...isTrue("les deux autres options ne sont pas dans la frise", options.filter((option) => option !== right).every((option) => items.includes(option))),
    ...eq("la réponse de la fiche", exo.answerKey, right),
  ];
}

const emotionNames = Object.keys(EMOTION_LABEL) as EmotionName[];
const zonesEmotions = (exo: Exo) => zonesOf(exo).map((zone) => emotionNames.find((name) => EMOTION_LABEL[name] === zone));

/** « Glisse chaque visage dans la bonne case. » : deux ou trois émotions, quatre visages, cinq aux deux derniers niveaux. */
function checkFaceSort(exo: Exo): string[] {
  const level = levelOf(exo);
  const emotions = zonesEmotions(exo);
  const items = itemsOf(exo);
  const set = new Set(emotions);
  return [
    ...eq("type", exo.type, "drag-drop"),
    ...isTrue("une case qui n'est pas une émotion", emotions.every((emotion) => emotion !== undefined)),
    ...isTrue("la peur et la surprise ensemble", !(set.has("peur") && set.has("surprise"))),
    ...(level === 1 ? isTrue("les cases du premier niveau", emotions.length === 2 && emotions.every((emotion) => EASY_EMOTIONS.includes(emotion as EmotionName))) : []),
    ...(level === 2 ? eq("les cases du deuxième niveau", [...emotions].sort(), ["colère", "joie", "tristesse"]) : []),
    ...(level >= 3 ? isTrue("les cases du dernier niveau", HARD_TRIPLES.some((triple) => [...triple].sort().join("+") === [...emotions].sort().join("+"))) : []),
    ...items.flatMap((item) => {
      const emotion = EMOTION_OF_FACE.get(item.text);
      return isTrue(`la case de « ${item.text} »`, emotion !== undefined && item.correctZone === EMOTION_LABEL[emotion]);
    }),
    ...eq("tuiles", items.length, level <= 2 ? 4 : 5),
    ...distinct("visages", items.map((item) => item.text)),
    ...zonesOf(exo).flatMap((zone) => isTrue(`la case « ${zone} » est vide`, items.some((item) => item.correctZone === zone))),
  ];
}

/** « Quel visage montre la colère ? » : le visage de l'émotion parmi trois visages d'émotions différentes. */
function checkFaceWhich(exo: Exo): string[] {
  const match = /^Quel visage montre (la \p{L}+) \?$/u.exec(exo.prompt);
  const asked = emotionNames.find((name) => EMOTION_ARTICLE[name] === match?.[1]);
  if (!asked) return [`énoncé inconnu : « ${exo.prompt} »`];
  const options = optionsOf(exo);
  const right = rightOption(exo);
  const level = levelOf(exo);
  const others = options.filter((option) => option !== right).map((option) => EMOTION_OF_FACE.get(option));
  return [
    ...eq("type", exo.type, "qcm"),
    ...eq("trois options", options.length, 3),
    ...distinct("options", options),
    ...isTrue("une option qui n'est pas un visage", options.every((option) => EMOTION_OF_FACE.has(option))),
    ...eq("l'émotion du bon visage", EMOTION_OF_FACE.get(right), asked),
    ...isTrue("deux faux visages de la même émotion", new Set(others).size === 2),
    ...isTrue("un faux visage de l'émotion demandée", others.every((emotion) => emotion !== asked)),
    ...isTrue("un faux visage trop proche", others.every((emotion) => emotion !== undefined && !NEAR_FACES[asked].includes(emotion))),
    ...isTrue("l'émotion n'est pas celle de ce niveau", byLevel(level, ASKED[0], ASKED[1], ASKED[2]).includes(asked)),
    ...(level === 1 ? isTrue("un faux visage hors des trois premières émotions", others.every((emotion) => EASY_EMOTIONS.includes(emotion as EmotionName))) : []),
    ...eq("la réponse de la fiche", exo.answerKey, right),
  ];
}

/** « Quelle émotion montre ce visage ? » : l'émotion d'un visage parmi trois noms. */
function checkFaceEmotion(exo: Exo): string[] {
  const lines = exo.prompt.split("\n");
  const emotion = EMOTION_OF_FACE.get(lines[1] ?? "");
  if (lines[0] !== "Quelle émotion montre ce visage ?" || !emotion) return [`énoncé inconnu : « ${exo.prompt} »`];
  const options = optionsOf(exo);
  const level = levelOf(exo);
  const otherEmotions = emotionNames.filter((name) => options.includes(EMOTION_LABEL[name]) && name !== emotion);
  return [
    ...eq("type", exo.type, "qcm"),
    ...eq("trois options", options.length, 3),
    ...distinct("options", options),
    ...eq("des noms d'émotions", emotionNames.filter((name) => options.includes(EMOTION_LABEL[name])).length, 3),
    ...eq("la bonne émotion", rightOption(exo), EMOTION_LABEL[emotion]),
    ...isTrue("une émotion trop proche", otherEmotions.every((name) => !NEAR_FACES[emotion].includes(name))),
    ...isTrue("la peur et la surprise ensemble", !(options.includes("Peur") && options.includes("Surprise"))),
    ...isTrue("le visage n'est pas celui de ce niveau", third(FACE_ROWS, level).some(([face]) => face === lines[1])),
    ...(level === 1 ? isTrue("une émotion hors des trois premières", otherEmotions.every((name) => EASY_EMOTIONS.includes(name))) : []),
    ...eq("la réponse de la fiche", exo.answerKey, EMOTION_LABEL[emotion]),
  ];
}

/** « Relie chaque visage à son émotion. » : trois visages, trois émotions. */
function checkFaceLinks(exo: Exo): string[] {
  const pairs = pairsOf(exo);
  const emotions = pairs.map((pair) => EMOTION_OF_FACE.get(pair.left));
  return [
    ...eq("type", exo.type, "match"),
    ...eq("trois paires", pairs.length, 3),
    ...pairs.flatMap((pair) => {
      const emotion = EMOTION_OF_FACE.get(pair.left);
      return isTrue(`« ${pair.left} » relié à « ${pair.right} »`, emotion !== undefined && pair.right === EMOTION_LABEL[emotion]);
    }),
    ...distinct("visages", pairs.map((pair) => pair.left)),
    ...distinct("émotions", pairs.map((pair) => pair.right)),
    ...isTrue("la peur et la surprise ensemble", !(emotions.includes("peur") && emotions.includes("surprise"))),
    ...(levelOf(exo) === 1 ? isTrue("une émotion hors des trois premières", emotions.every((emotion) => EASY_EMOTIONS.includes(emotion as EmotionName))) : []),
  ];
}

const emotionTile = (emotion: EmotionName) => `${FIRST_FACE(emotion)} ${EMOTION_LABEL[emotion]}`;

/** « Tu reçois un beau cadeau. Que ressens-tu ? » : l'émotion de la situation parmi trois tuiles. */
function checkSituation(exo: Exo): string[] {
  const text = exo.prompt.replace(/ Que ressens-tu \?$/, "");
  const row = SITUATION_ROWS.find(([situation]) => situation === text);
  if (!row) return [`situation inconnue : « ${exo.prompt} »`];
  const emotion = row[1];
  const options = optionsOf(exo);
  const tiles = emotionNames.map(emotionTile);
  const otherEmotions = emotionNames.filter((name) => options.includes(emotionTile(name)) && emotionTile(name) !== rightOption(exo));
  return [
    ...eq("type", exo.type, "qcm"),
    ...eq("trois options", options.length, 3),
    ...distinct("options", options),
    ...isTrue("une option qui n'est pas une émotion", options.every((option) => tiles.includes(option))),
    ...eq("la bonne émotion", rightOption(exo), emotionTile(emotion)),
    ...isTrue("deux faux choix", otherEmotions.length === 2),
    ...isTrue("un faux choix qu'une situation ne distingue pas", otherEmotions.every((name) => !NEAR_SITUATIONS[emotion].includes(name))),
    ...isTrue("la surprise parmi les choix", !options.includes(emotionTile("surprise"))),
    ...isTrue("la situation n'est pas celle de ce niveau", third(SITUATION_ROWS, levelOf(exo)).some(([situation]) => situation === text)),
    ...eq("la réponse de la fiche", exo.answerKey, emotionTile(emotion)),
  ];
}

/** « Que fais-tu quand tu ressens de la joie ? » : le geste de l'émotion parmi trois gestes. */
function checkGesture(exo: Exo): string[] {
  const match = /^Que fais-tu quand tu ressens de (la \p{L}+) \?$/u.exec(exo.prompt);
  const asked = emotionNames.find((name) => EMOTION_ARTICLE[name] === match?.[1]);
  if (!asked) return [`énoncé inconnu : « ${exo.prompt} »`];
  const options = optionsOf(exo);
  const others = emotionNames.filter((name) => options.includes(GESTURE_ROWS[name]) && name !== asked);
  return [
    ...eq("type", exo.type, "qcm"),
    ...eq("trois options", options.length, 3),
    ...distinct("options", options),
    ...isTrue("une option qui n'est pas un geste de la table", options.every((option) => Object.values(GESTURE_ROWS).includes(option))),
    ...eq("le bon geste", rightOption(exo), GESTURE_ROWS[asked]),
    ...eq("deux faux gestes", others.length, 2),
    ...isTrue("un faux geste trop proche", others.every((name) => !NEAR_FACES[asked].includes(name))),
    ...isTrue("l'émotion n'est pas celle de ce niveau", byLevel(levelOf(exo), ASKED[0], ASKED[1], ASKED[2]).includes(asked)),
    ...eq("la réponse de la fiche", exo.answerKey, GESTURE_ROWS[asked]),
  ];
}

/** « Quel animal fait miaou ? » : l'animal de ce cri parmi trois dessins. */
function checkCryAnimal(exo: Exo): string[] {
  const match = /^Quel animal fait (.+) \?$/.exec(exo.prompt);
  const cry = match?.[1] ?? "";
  const animal = CRY_ROWS.find(([, sound]) => sound === cry)?.[0];
  if (!animal) return [`cri inconnu : « ${cry} »`];
  const options = optionsOf(exo);
  return [
    ...eq("type", exo.type, "qcm"),
    ...eq("trois options", options.length, 3),
    ...distinct("options", options),
    ...isTrue("un animal que la table ne connaît pas", options.every((option) => CRY_OF.has(option))),
    ...eq("le bon animal", rightOption(exo), animal),
    ...isTrue("l'animal n'est pas celui de ce niveau", third(CRY_ROWS, levelOf(exo)).some(([name]) => name === animal)),
    ...eq("la réponse de la fiche", exo.answerKey, animal),
  ];
}

/** « Relie chaque animal à son cri. » : trois animaux, trois cris. */
function checkCryLinks(exo: Exo): string[] {
  const pairs = pairsOf(exo);
  return [
    ...eq("type", exo.type, "match"),
    ...eq("trois paires", pairs.length, 3),
    ...pairs.flatMap((pair) => isTrue(`« ${pair.left} » relié à « ${pair.right} »`, CRY_OF.get(pair.left) === pair.right)),
    ...distinct("animaux", pairs.map((pair) => pair.left)),
    ...distinct("cris", pairs.map((pair) => pair.right)),
    ...(levelOf(exo) === 1 ? isTrue("un animal hors des quatre premiers", pairs.every((pair) => CRY_ROWS.slice(0, 4).some(([name]) => name === pair.left))) : []),
  ];
}

const CHECKS: Record<string, (exo: Exo) => string[]> = {
  "teinte-chose": checkTeinteChoice,
  "teinte-relier": checkTeinteLinks,
  "teinte-glisser": checkTeinteSort,
  "teinte-ordre": checkTeinteOrder,
  "contour-chose": checkContourChoice,
  "contour-relier": checkContourLinks,
  "contour-glisser": checkContourSort,
  "contour-trou": gapChecker(SHAPE_GAP_ROWS),
  "guirlande-suite": checkFriseNext,
  "guirlande-intrus": checkFriseOdd,
  "visage-glisser": checkFaceSort,
  "visage-quel": checkFaceWhich,
  "visage-emotion": checkFaceEmotion,
  "visage-relier": checkFaceLinks,
  "emotion-situation": checkSituation,
  "emotion-geste": checkGesture,
  "cri-animal": checkCryAnimal,
  "cri-relier": checkCryLinks,
  "emotion-trou": gapChecker(EMOTION_GAP_ROWS),
};

const KINDS = Object.keys(CHECKS) as GameKind[];

// ---------------------------------------------------------------------------
// Les tables
// ---------------------------------------------------------------------------

describe("les tables du test sont celles des modules", () => {
  it("compte les mêmes couleurs, choses et ordres", () => {
    expect(COLOUR_TILES).toEqual(Object.fromEntries(Object.entries(COLOUR_EMOJI).map(([name, emoji]) => [name, `${emoji} ${name}`])));
    expect(COLOUR_FEMININE).toEqual({ rouge: "rouge", jaune: "jaune", vert: "verte", bleu: "bleue", orange: "orange", violet: "violette", blanc: "blanche" });
    expect(COLOUR_THINGS.map((thing) => [thing.name, thing.colour])).toEqual(COLOUR_ROWS);
    expect(COLOUR_ORDERS.map((order) => [order.prompt, [...order.steps]])).toEqual(ORDER_ROWS);
  });

  it("compte les mêmes formes, objets et phrases à trou", () => {
    expect(SHAPE_TILES).toEqual(SHAPE_TILE);
    expect(OBJECT_SHAPES.map((object) => [object.name, object.shape])).toEqual(OBJECT_ROWS);
    const gap = (rows: readonly { text: string; answer: string; wrong: readonly [string, string] }[]) => rows.map((row) => ({ text: row.text, answer: row.answer, wrong: [...row.wrong] }));
    expect(gap(SHAPE_GAPS)).toEqual(SHAPE_GAP_ROWS);
    expect(gap(EMOTION_GAPS)).toEqual(EMOTION_GAP_ROWS);
    expect(EMOTION_GAPS.map((row) => [row.text, row.emotion])).toEqual(EMOTION_GAP_ROWS.map((row) => [row.text, GAP_EMOTION[row.text]]));
    expect([...FRISE_MOTIFS]).toEqual(FRISE_EMOJIS);
  });

  it("compte les mêmes visages, émotions, situations, gestes et cris", () => {
    expect(FACES.map((face) => [face.face, face.emotion])).toEqual(FACE_ROWS);
    expect(EMOTION_NAMES).toEqual(EMOTION_LABEL);
    expect(EMOTION_THE).toEqual(EMOTION_ARTICLE);
    expect(SITUATIONS.map((situation) => [situation.text, situation.emotion])).toEqual(SITUATION_ROWS);
    expect(GESTURES).toEqual(GESTURE_ROWS);
    expect(ANIMAL_CRIES.map((row) => [row.animal, row.cry])).toEqual(CRY_ROWS);
  });

  it("n'écrit que les émojis de la liste, tous anciens, jamais suivis d'un sélecteur de variation", () => {
    const glyphsOf = (text: string) => text.match(/\p{Extended_Pictographic}/gu) ?? [];
    const used = new Set<string>();
    for (const text of [
      ...Object.values(COLOUR_EMOJI),
      ...FRISE_EMOJIS,
      "❓",
      ...FACE_ROWS.map(([face]) => face),
      ...Object.values(GESTURE_ROWS),
      ...ORDER_ROWS.flatMap(([, steps]) => steps.map(colourTile)),
    ]) {
      glyphsOf(text).forEach((glyph) => used.add(glyph));
    }
    for (const glyph of used) expect(ALLOWED_EMOJI, glyph).toContain(glyph);
    const source = JSON.stringify([COLOUR_TILES, FRISE_MOTIFS, FACES, GESTURES]);
    expect(source).not.toContain(VARIATION_SELECTOR);
    expect(source).not.toContain(JOINER);
    // Un émoji d'Unicode 12 ou plus (pastilles de couleur, extensions) ne passerait pas la liste : on le dit aussi ici.
    for (const glyph of ALLOWED_EMOJI) {
      const code = glyph.codePointAt(0) as number;
      expect(code >= 0x1fa70 || (code >= 0x1f7e0 && code <= 0x1f7eb), glyph).toBe(false);
    }
  });
});

describe("les choses des tableaux ont leur image", () => {
  it("nomme chaque chose, objet, forme et animal avec son article et un mot du catalogue des images, jamais sans dessin", () => {
    const names = [...COLOUR_ROWS.map(([name]) => name), ...OBJECT_ROWS.map(([name]) => name), ...Object.values(SHAPE_TILE), ...CRY_ROWS.map(([name]) => name)];
    const missing = [...new Set(names)].filter((name) => !pictureForTile(name));
    expect(missing, "Ajoute l'image de cette chose au catalogue (docs/paliers-et-exercices.md, « Des images sur les tuiles (CI) »), ou retire-la du gabarit.").toEqual([]);
  });

  it("ne donne aucune image à une couleur, à une émotion, à un geste, à un cri ni à un visage", () => {
    const tiles = [
      ...Object.keys(COLOUR_EMOJI).map((name) => colourTile(name as ColourName)),
      ...Object.values(EMOTION_LABEL),
      ...emotionNames.map(emotionTile),
      ...Object.values(GESTURE_ROWS),
      ...CRY_ROWS.map(([, cry]) => cry),
      ...FACE_ROWS.map(([face]) => face),
      ...FRISE_EMOJIS,
    ];
    expect(tiles.filter((tile) => pictureForTile(tile) !== null)).toEqual([]);
  });

  it("donne aux mots des phrases à trous des images à tous, ou à aucun", () => {
    for (const row of [...SHAPE_GAP_ROWS, ...EMOTION_GAP_ROWS]) {
      const shown = [row.answer, ...row.wrong].filter((word) => pictureForTile(word) !== null).length;
      expect(shown === 0 || shown === 3, row.text).toBe(true);
    }
  });
});

describe("la table ne se contredit pas", () => {
  it("n'écrit jamais deux fois la même chose, le même objet, le même visage, la même situation ou la même phrase", () => {
    expect(distinct("choses", COLOUR_ROWS.map(([name]) => name))).toEqual([]);
    expect(distinct("objets", OBJECT_ROWS.map(([name]) => name))).toEqual([]);
    expect(distinct("visages", FACE_ROWS.map(([face]) => face))).toEqual([]);
    expect(distinct("situations", SITUATION_ROWS.map(([text]) => text))).toEqual([]);
    expect(distinct("cris", CRY_ROWS.map(([, cry]) => cry))).toEqual([]);
    expect(distinct("animaux", CRY_ROWS.map(([name]) => name))).toEqual([]);
    expect(distinct("phrases à trou", [...SHAPE_GAP_ROWS, ...EMOTION_GAP_ROWS].map((row) => row.text))).toEqual([]);
    expect(distinct("gestes", Object.values(GESTURE_ROWS))).toEqual([]);
  });

  it("ne demande jamais ce qui se discute : ni la mangue, la pomme ou la goyave, ni le ballon, la table ou le cœur d'un objet", () => {
    const names = [...COLOUR_ROWS.map(([name]) => name), ...OBJECT_ROWS.map(([name]) => name)];
    for (const doubtful of ["la mangue", "la pomme", "la goyave", "le citron", "le bissap", "le ballon", "la table"]) expect(names, doubtful).not.toContain(doubtful);
    expect(OBJECT_ROWS.filter(([, shape]) => shape === "cœur")).toEqual([]);
  });

  it("donne à chaque couleur une tuile différente, et à chaque émotion un nom différent", () => {
    expect(distinct("tuiles de couleur", Object.keys(COLOUR_EMOJI).map((name) => colourTile(name as ColourName)))).toEqual([]);
    expect(distinct("émojis de couleur", Object.values(COLOUR_EMOJI))).toEqual([]);
    expect(distinct("noms d'émotion", Object.values(EMOTION_LABEL))).toEqual([]);
  });

  it("écrit chaque geste avec quatre mots au moins après son émoji, un émoji qui n'est pas un visage", () => {
    for (const [emotion, gesture] of Object.entries(GESTURE_ROWS)) {
      expect(stripEmoji(gesture).split(" ").length, gesture).toBeGreaterThanOrEqual(4);
      const head = gesture.codePointAt(0) as number;
      // Les visages d'émotion sont les émojis de 1F600 à 1F64F ; le singe qui se cache les yeux (1F648) n'en montre aucune.
      expect(head >= 0x1f600 && head <= 0x1f64f && head !== 0x1f648, `${emotion} : ${gesture}`).toBe(false);
    }
  });

  it("n'écrit dans les énoncés aucun deux-points, au plus une apostrophe droite et vingt mots", () => {
    const prompts = [
      ...COLOUR_ROWS.map(([, colour]) => `Quelle chose est ${COLOUR_FEMININE[colour]} ?`),
      ...ORDER_ROWS.map(([prompt]) => prompt),
      ...OBJECT_ROWS.map(([name]) => `Quelle forme a ${name} ?`),
      ...SITUATION_ROWS.map(([text]) => `${text} Que ressens-tu ?`),
      ...Object.values(EMOTION_ARTICLE).map((article) => `Que fais-tu quand tu ressens de ${article} ?`),
      ...Object.values(EMOTION_ARTICLE).map((article) => `Quel visage montre ${article} ?`),
      ...CRY_ROWS.map(([, cry]) => `Quel animal fait ${cry} ?`),
    ];
    for (const prompt of prompts) {
      expect(prompt, prompt).not.toContain(":");
      expect((prompt.match(/'/g) ?? []).length, prompt).toBeLessThanOrEqual(1);
      expect(prompt.split(/\s+/).length, prompt).toBeLessThanOrEqual(20);
    }
    for (const row of [...SHAPE_GAP_ROWS, ...EMOTION_GAP_ROWS]) {
      expect((row.text.match(/'/g) ?? []).length, row.text).toBeLessThanOrEqual(1);
      expect(row.text.split("___").length - 1, row.text).toBe(1);
    }
  });
});

// ---------------------------------------------------------------------------
// Les gabarits
// ---------------------------------------------------------------------------

/** Les tuiles de chaque côté de l'exercice, avec ce qu'il faut à l'écran pour décider des images. */
function sides(exo: Exo): { tiles: string[]; ctx: Parameters<typeof explainTilePictures>[1] }[] {
  switch (exo.type) {
    case "qcm":
      return [{ tiles: optionsOf(exo), ctx: { prompt: exo.prompt, choice: true } }];
    case "fill-blank":
      return [{ tiles: blankOf(exo).options, ctx: { prompt: exo.prompt, choice: true } }];
    case "order":
      return [{ tiles: sequenceOf(exo), ctx: { prompt: exo.prompt } }];
    case "drag-drop":
      return [
        { tiles: itemsOf(exo).map((item) => item.text), ctx: { prompt: exo.prompt, counterpart: zonesOf(exo) } },
        { tiles: zonesOf(exo), ctx: { prompt: exo.prompt, counterpart: itemsOf(exo).map((item) => item.text) } },
      ];
    default: {
      const lefts = pairsOf(exo).map((pair) => pair.left);
      const rights = pairsOf(exo).map((pair) => pair.right);
      return [
        { tiles: lefts, ctx: { prompt: exo.prompt, counterpart: rights } },
        { tiles: rights, ctx: { prompt: exo.prompt, counterpart: lefts } },
      ];
    }
  }
}

/** Les gabarits dont les tuiles n'ont jamais d'image : une couleur, un visage, une émotion, un geste, un dessin d'émoji. */
const PICTURELESS_KINDS = ["teinte-ordre", "guirlande-suite", "guirlande-intrus", "visage-glisser", "visage-quel", "visage-emotion", "visage-relier", "emotion-situation", "emotion-geste", "emotion-trou"];
const ARTICLES = /^(?:le |la |l'|les |un |une |du |des |de la |de l')/;

describe.each(KINDS)("le gabarit « %s »", (kind) => {
  it("passe son vérificateur sur cent vingt tirages", () => {
    for (const d of DRAWS) {
      const exo = make(kind, d);
      expect(CHECKS[kind](exo), `${d.seed} : ${exo.prompt}`).toEqual([]);
    }
  });

  it("passe le contrôleur du CI sans aucun défaut, à tous les niveaux", () => {
    for (const d of DRAWS) {
      const exo = make(kind, d);
      const defects = auditExercise({
        type: exo.type,
        prompt: exo.prompt,
        payload: exo.payload,
        answerKey: exo.answerKey,
        hints: exo.hints,
        class: "CI",
        subject: "Éducation artistique",
      } as Parameters<typeof auditExercise>[0]);
      expect(defects, `${kind} ${d.seed} : ${exo.prompt}`).toEqual([]);
    }
  });

  it("donne trois indices différents, et se refait à l'identique avec la même graine", () => {
    const a = GAME_KINDS[kind].make(makeContext("CI", 2, "graine"));
    const b = GAME_KINDS[kind].make(makeContext("CI", 2, "graine"));
    expect(a).toEqual(b);
    expect(a.hints).toHaveLength(3);
    expect(new Set(a.hints).size).toBe(3);
  });

  it("garde l'origine du jeu pour refaire le même gabarit, que le code sait refaire sans le modèle", () => {
    const exo = GAME_KINDS[kind].make(makeContext("CI", 3, "origine"));
    expect(gameOriginOf(exo.payload)).toEqual({ kind, level: 3 });
    const again = regenerateGame(gameOriginOf(exo.payload), "CI", "autre graine");
    expect(again, kind).not.toBeNull();
    expect(CHECKS[kind](again as unknown as Exo), kind).toEqual([]);
  });

  it("n'écrit dans aucun indice le nom de la bonne réponse", () => {
    for (const d of DRAWS.slice(0, 60)) {
      const exo = make(kind, d);
      const answer = exo.type === "fill-blank" ? blankOf(exo).answer : exo.type === "qcm" ? stripEmoji(rightOption(exo)) : "";
      const core = fold(answer.replace(ARTICLES, ""));
      if (core.length < 3 || core.split(" ").length > 2) continue;
      const word = new RegExp(`(?<![a-z])${core}(?![a-z])`);
      for (const hint of exo.hints) {
        expect(word.test(fold(hint)), `${kind} ${d.seed} : « ${hint} » écrit « ${core} »`).toBe(false);
      }
    }
  });

  it("n'écrit aucun deux-points dans un indice, et dit les tuiles à voix haute : l'énoncé ne demande ni de lire ni de nommer", () => {
    for (const d of DRAWS.slice(0, 60)) {
      const exo = make(kind, d);
      for (const hint of exo.hints) expect(hint, `${kind} : ${hint}`).not.toContain(":");
      expect(promptForbidsTileVoice(exo.prompt), exo.prompt).toBe(false);
      expect(promptForbidsPictures(exo.prompt), exo.prompt).toBe(false);
    }
  });

  it("montre, au CI, une image à chaque tuile qui nomme une chose, ou à aucune, jamais à une seule, et rien sur une couleur, un visage ou un geste", () => {
    for (const d of DRAWS) {
      const exo = make(kind, d);
      for (const side of sides(exo)) {
        const resolution = explainTilePictures(side.tiles, side.ctx);
        const where = `${kind} ${d.seed} : ${JSON.stringify(side.tiles)}`;
        expect(resolution.guard, where).toBeNull();
        const shown = resolution.pictures.filter((picture) => picture !== null).length;
        expect(shown === 0 || shown === side.tiles.length, where).toBe(true);
        if (PICTURELESS_KINDS.includes(kind)) expect(shown, where).toBe(0);
      }
    }
  });
});

describe("les vérificateurs voient ce qu'on abîme", () => {
  const CORRUPT: Record<string, (exo: Exo) => Exo> = {
    qcm: (exo) => {
      const bad = clone(exo);
      bad.payload.correctIndex = ((exo.payload.correctIndex as number) + 1) % 3;
      return bad;
    },
    "drag-drop": (exo) => {
      const bad = clone(exo);
      const item = itemsOf(bad)[0];
      item.correctZone = zonesOf(bad).find((zone) => zone !== item.correctZone) as string;
      return bad;
    },
    match: (exo) => {
      const bad = clone(exo);
      const pairs = pairsOf(bad);
      [pairs[0].right, pairs[1].right] = [pairs[1].right, pairs[0].right];
      return bad;
    },
    order: (exo) => {
      const bad = clone(exo);
      const steps = sequenceOf(bad);
      [steps[0], steps[1]] = [steps[1], steps[0]];
      return bad;
    },
    "fill-blank": (exo) => {
      const bad = clone(exo);
      const blank = blankOf(bad);
      blank.answer = blank.options.find((option) => option !== blank.answer) as string;
      return bad;
    },
  };

  it.each(KINDS)("le vérificateur de « %s » voit chaque exercice abîmé, cent vingt fois sur cent vingt", (kind) => {
    for (const d of DRAWS) {
      const exo = make(kind, d);
      expect(CHECKS[kind](exo), `${d.seed} sain`).toEqual([]);
      expect(CHECKS[kind](CORRUPT[exo.type](exo)).length, `${d.seed} abîmé : ${exo.prompt}`).toBeGreaterThan(0);
    }
  });

  it("voit une frise qui ne se répète pas et un intrus qui n'en est pas un", () => {
    const next = clone(make("guirlande-suite", { level: 2, seed: "x" }));
    const lines = next.prompt.split("\n");
    const parts = lines[1].split(" ");
    [parts[0], parts[2]] = [parts[2], parts[0]];
    next.prompt = `${lines[0]}\n${parts.join(" ")}`;
    expect(checkFriseNext(next).join(" | ")).toContain("le groupe qui se répète");
    const odd = clone(make("guirlande-intrus", { level: 1, seed: "x" }));
    const motifs = friseOf(odd).items;
    odd.prompt = `Quel dessin n'est pas à sa place dans la frise ?\n${[motifs[1], ...motifs.slice(1)].join(" ")}`;
    expect(checkFriseOdd(odd).length).toBeGreaterThan(0);
  });

  it("voit la peur et la surprise réunies, et une situation que les choix ne distinguent pas", () => {
    const sort = clone(make("visage-glisser", { level: 3, seed: "x" }));
    sort.payload.zones = ["Peur", "Surprise", "Colère"];
    expect(checkFaceSort(sort).join(" | ")).toContain("la peur et la surprise ensemble");
    const links = clone(make("visage-relier", { level: 2, seed: "x" }));
    pairsOf(links)[0] = { left: "😨", right: "Peur" };
    pairsOf(links)[1] = { left: "😲", right: "Surprise" };
    expect(checkFaceLinks(links).join(" | ")).toContain("la peur et la surprise ensemble");
    const situation = clone(make("emotion-situation", { level: 2, seed: "x" }));
    situation.prompt = "Un enfant casse ton jouet exprès. Que ressens-tu ?";
    situation.payload.options = [emotionTile("colère"), emotionTile("tristesse"), emotionTile("joie")];
    situation.payload.correctIndex = 0;
    expect(checkSituation(situation).join(" | ")).toContain("un faux choix qu'une situation ne distingue pas");
  });

  it("voit une couleur qui n'est pas celle du dessin et un ordre qui n'est pas celui du drapeau", () => {
    const choice = clone(make("teinte-chose", { level: 1, seed: "x" }));
    choice.prompt = "Quelle chose est violette ?";
    expect(checkTeinteChoice(choice).join(" | ")).toContain("n'est pas violet");
    const order = clone(make("teinte-ordre", { level: 1, seed: "x" }));
    order.payload.correctSequence = [colourTile("rouge"), colourTile("jaune"), colourTile("vert")];
    expect(checkTeinteOrder(order).join(" | ")).toContain("l'ordre");
  });
});

// ---------------------------------------------------------------------------
// Dans le programme
// ---------------------------------------------------------------------------

describe("les quatre thématiques des arts du CI", () => {
  const KEYS = ["ar-ci-couleurs", "ar-ci-formes", "ar-ci-frises", "ar-ci-mimes"] as const;
  const entryOf = (key: string) => allProgrammeEntries().find((entry) => entry.topic.key === key)!;
  /** Les gabarits que ces thématiques demandaient avant ce lot : des jeux et un dessin à copier. */
  const BEFORE = ["couleurs-reconnaitre", "frise-couleurs", "frise-formes", "frise-objets", "pixel-copie"];
  const PREFIX: Record<(typeof KEYS)[number], string[]> = {
    "ar-ci-couleurs": ["teinte-"],
    "ar-ci-formes": ["contour-"],
    "ar-ci-frises": ["guirlande-"],
    "ar-ci-mimes": ["visage-", "emotion-", "cri-"],
  };
  /** La question que voit l'enfant : l'énoncé, et la phrase à trous quand l'énoncé est toujours le même. */
  const questionOf = (exo: { prompt: string; payload: Record<string, unknown> }) => `${exo.prompt}${typeof exo.payload.text === "string" ? ` ${exo.payload.text}` : ""}`;

  it("sont dix gabarits par palier, sans le modèle, et gratuites à la pré-génération", () => {
    for (const key of KEYS) {
      const games = entryOf(key).topic.games ?? [];
      expect(games.reduce((sum, spec) => sum + spec.count, 0), key).toBe(PALIER_SIZE);
      expect(topicUsesModel(key), key).toBe(false);
      expect(entryOf(key).klass, key).toBe("CI");
    }
  });

  it("ne demandent, en plus de leurs jeux, que les gabarits de leur thématique, sans thématique de vocabulaire", () => {
    for (const key of KEYS) {
      for (const spec of entryOf(key).topic.games ?? []) {
        const mine = PREFIX[key].some((prefix) => spec.kind.startsWith(prefix));
        expect(mine || BEFORE.includes(spec.kind), `${key} : ${spec.kind}`).toBe(true);
        expect(spec.vocabulary, `${key} : ${spec.kind}`).toBeUndefined();
      }
    }
  });

  it("montrent chaque type que la démonstration de la page d'accueil montre au CI, et jamais une réponse à écrire", () => {
    const typesOf = (key: string) => new Set((entryOf(key).topic.games ?? []).map((spec) => GAME_KINDS[spec.kind].type));
    expect(typesOf("ar-ci-couleurs").has("match")).toBe(true);
    expect(typesOf("ar-ci-couleurs").has("order")).toBe(true);
    expect(typesOf("ar-ci-formes").has("fill-blank")).toBe(true);
    expect(typesOf("ar-ci-frises").has("qcm")).toBe(true);
    expect(typesOf("ar-ci-mimes").has("drag-drop")).toBe(true);
    for (const key of KEYS) expect(typesOf(key).has("short-answer"), key).toBe(false);
  });

  it("enregistrent chaque gabarit du lot dans une thématique", () => {
    const wired = new Set(KEYS.flatMap((key) => (entryOf(key).topic.games ?? []).map((spec) => spec.kind as string)).filter((kind) => !BEFORE.includes(kind)));
    expect([...wired].sort()).toEqual([...KINDS].sort());
  });

  it("fabrique quarante paliers entiers par thématique et par palier, de dix exercices, sans défaut du contrôleur ni répétition", () => {
    for (const key of KEYS) {
      const specs = entryOf(key).topic.games ?? [];
      const wanted: Record<string, number> = {};
      for (const spec of specs) wanted[spec.kind] = (wanted[spec.kind] ?? 0) + spec.count;
      for (const palierIndex of [1, 2, 3]) {
        for (let n = 0; n < 40; n++) {
          const games = generateGames(specs, { klass: "CI", palierIndex, palierCount: 3, seed: `${key}:${palierIndex}:${n}` });
          expect(games, `${key} palier ${palierIndex} graine ${n}`).toHaveLength(PALIER_SIZE);
          for (const exo of games) {
            const defects = auditExercise({
              type: exo.type,
              prompt: exo.prompt,
              payload: exo.payload,
              answerKey: exo.answerKey,
              hints: exo.hints,
              class: "CI",
              subject: "Éducation artistique",
            } as Parameters<typeof auditExercise>[0]);
            expect(defects, `${key} palier ${palierIndex} : ${exo.prompt}`).toEqual([]);
          }
          const got: Record<string, number> = {};
          for (const exo of games) {
            const kind = gameOriginOf(exo.payload)!.kind;
            got[kind] = (got[kind] ?? 0) + 1;
          }
          expect(got, `${key} palier ${palierIndex}`).toEqual(wanted);
          // Deux exercices identiques dans un palier, l'enfant le voit. Les jeux (frises, dessins, pots de couleur) ont leur propre identité.
          const classic = games.filter((exo) => ["qcm", "order", "match", "drag-drop", "fill-blank"].includes(exo.type));
          expect(distinct(key, classic.map((exo) => signature(exo as unknown as Exo))), `${key} palier ${palierIndex}`).toEqual([]);
        }
      }
    }
  });

  it("ne repose jamais la même question dans deux paliers d'une thématique, pour les gabarits qui ont peu de variantes", () => {
    const FEW = ["teinte-chose", "teinte-ordre", "contour-chose", "contour-trou", "visage-quel", "visage-emotion", "emotion-situation", "emotion-geste", "cri-animal", "emotion-trou"];
    for (const key of KEYS) {
      const specs = entryOf(key).topic.games ?? [];
      for (let n = 0; n < 40; n++) {
        const seen = new Map<string, number>();
        for (const palierIndex of [1, 2, 3]) {
          const games = generateGames(specs, { klass: "CI", palierIndex, palierCount: 3, seed: `${key}:${palierIndex}:${n}` });
          for (const exo of games) {
            const kind = gameOriginOf(exo.payload)!.kind;
            if (!FEW.includes(kind)) continue;
            const question = `${kind}|${questionOf(exo)}`;
            expect(seen.has(question), `${key} graine ${n} : « ${questionOf(exo)} » aux paliers ${seen.get(question)} et ${palierIndex}`).toBe(false);
            seen.set(question, palierIndex);
          }
        }
      }
    }
  });

  it("ne montre pas deux fois les mêmes visages dans le même palier de mimes, ni la même paire de cases au premier palier", () => {
    const specs = entryOf("ar-ci-mimes").topic.games ?? [];
    for (const palierIndex of [1, 2, 3]) {
      for (let n = 0; n < 40; n++) {
        const games = generateGames(specs, { klass: "CI", palierIndex, palierCount: 3, seed: `mimes:${palierIndex}:${n}` });
        const sorts = games.filter((exo) => gameOriginOf(exo.payload)!.kind === "visage-glisser") as unknown as Exo[];
        expect(sorts, `palier ${palierIndex} graine ${n}`).toHaveLength(2);
        const [a, b] = sorts.map((exo) => itemsOf(exo).map((item) => item.text).sort().join(""));
        expect(a, `palier ${palierIndex} graine ${n}`).not.toBe(b);
        const [za, zb] = sorts.map((exo) => [...zonesOf(exo)].sort().join("+"));
        // Les deux rangements d'un palier ont le moins de visages possible en commun : un seul aux deux premiers niveaux (sept
        // visages pour huit tuiles), aucun au dernier, où chacun a ses propres cases et se partage les visages de la joie.
        const [fa, fb] = sorts.map((exo) => new Set(itemsOf(exo).map((item) => item.text)));
        expect(common(fa, fb), `palier ${palierIndex} graine ${n}`).toBe(palierIndex === 3 ? 0 : 1);
        // Au premier et au dernier niveau, les deux rangements n'ont pas les mêmes cases ; au deuxième, les trois émotions faciles.
        if (palierIndex !== 2) expect(za, `palier ${palierIndex} graine ${n}`).not.toBe(zb);
        if (palierIndex === 3) expect([za, zb].sort(), `palier 3 graine ${n}`).toEqual(HARD_TRIPLES.map((triple) => triple.map((emotion) => EMOTION_LABEL[emotion]).sort().join("+")).sort());
      }
    }
  });

  /** Les trois paliers d'une thématique, fabriqués chacun avec sa graine, comme la pré-génération. */
  const palierGames = (key: string, n: number) =>
    [1, 2, 3].map((palierIndex) => generateGames(entryOf(key).topic.games ?? [], { klass: "CI", palierIndex, palierCount: 3, seed: `${key}:${palierIndex}:${n}` }));
  const gameOf = (games: ReturnType<typeof generateGames>, kind: string) => games.find((exo) => gameOriginOf(exo.payload)!.kind === kind) as unknown as Exo;
  const common = (a: Set<string>, b: Set<string>) => [...a].filter((value) => b.has(value)).length;

  it("ne relie jamais la même paire à deux paliers pour les couleurs et les formes, ni plus d'une pour les cris et les visages, ni aucune aux trois", () => {
    const LINKS: [string, string, number][] = [
      ["ar-ci-couleurs", "teinte-relier", 0],
      ["ar-ci-formes", "contour-relier", 0],
      ["ar-ci-mimes", "cri-relier", 1],
      ["ar-ci-mimes", "visage-relier", 1],
    ];
    for (const [key, kind, most] of LINKS) {
      for (let n = 0; n < 40; n++) {
        const sets = palierGames(key, n).map((games) => new Set(pairsOf(gameOf(games, kind)).map((pair) => `${pair.left}~${pair.right}`)));
        const label = `${kind} graine ${n}`;
        expect(common(sets[0], sets[1]), label).toBeLessThanOrEqual(most);
        expect(common(sets[0], sets[2]), label).toBeLessThanOrEqual(most);
        expect(common(sets[1], sets[2]), label).toBeLessThanOrEqual(most);
        expect([...sets[0]].filter((pair) => sets[1].has(pair) && sets[2].has(pair)), label).toEqual([]);
      }
    }
  });

  it("ne range pas plus d'une même chose de couleur dans deux paliers, ni plus de deux objets de forme", () => {
    for (let n = 0; n < 40; n++) {
      const colours = palierGames("ar-ci-couleurs", n).map((games) => new Set(itemsOf(gameOf(games, "teinte-glisser")).map((item) => item.text)));
      const shapes = palierGames("ar-ci-formes", n).map((games) => new Set(itemsOf(gameOf(games, "contour-glisser")).map((item) => item.text)));
      for (const [a, b] of [[0, 1], [0, 2], [1, 2]]) {
        expect(common(colours[a], colours[b]), `couleurs graine ${n} paliers ${a + 1} et ${b + 1}`).toBeLessThanOrEqual(1);
        // Le catalogue n'a que deux objets ronds et deux triangulaires : deux tuiles reviennent, pas plus.
        expect(common(shapes[a], shapes[b]), `formes graine ${n} paliers ${a + 1} et ${b + 1}`).toBeLessThanOrEqual(2);
      }
    }
  });

  it("répartit les émotions d'un palier de mimes : trois au moins sur les cinq exercices à une seule émotion, et aucune plus de deux fois", () => {
    const EMOTIONS = Object.keys(EMOTION_LABEL) as EmotionName[];
    const emotionOf = (kind: string, exo: Exo): EmotionName | undefined => {
      if (kind === "visage-quel") return EMOTIONS.find((emotion) => exo.prompt === `Quel visage montre ${EMOTION_ARTICLE[emotion]} ?`);
      if (kind === "emotion-geste") return EMOTIONS.find((emotion) => exo.prompt === `Que fais-tu quand tu ressens de ${EMOTION_ARTICLE[emotion]} ?`);
      if (kind === "visage-emotion") return EMOTIONS.find((emotion) => exo.answerKey === EMOTION_LABEL[emotion]);
      if (kind === "emotion-situation") return SITUATION_ROWS.find(([text]) => exo.prompt === `${text} Que ressens-tu ?`)?.[1];
      if (kind === "emotion-trou") return GAP_EMOTION[String(exo.payload.text)];
      return undefined;
    };
    const SINGLE = ["visage-quel", "visage-emotion", "emotion-situation", "emotion-geste", "emotion-trou"];
    for (let n = 0; n < 40; n++) {
      palierGames("ar-ci-mimes", n).forEach((games, index) => {
        const emotions = games
          .map((exo) => ({ kind: gameOriginOf(exo.payload)!.kind as string, exo: exo as unknown as Exo }))
          .filter(({ kind }) => SINGLE.includes(kind))
          .map(({ kind, exo }) => emotionOf(kind, exo));
        const label = `palier ${index + 1} graine ${n} : ${JSON.stringify(emotions)}`;
        expect(emotions, label).toHaveLength(5);
        expect(
          emotions.every((emotion) => emotion !== undefined),
          label,
        ).toBe(true);
        expect(new Set(emotions).size, label).toBeGreaterThanOrEqual(3);
        for (const emotion of new Set(emotions)) expect(emotions.filter((other) => other === emotion).length, label).toBeLessThanOrEqual(2);
      });
    }
  });
});
