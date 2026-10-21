import { describe, expect, it } from "vitest";
import { explainTilePictures, pictureForTile } from "../../lib/item-pictures";
import { auditExercise } from "../paliers/exerciseAudit";
import { GAME_KINDS, gameOriginOf, generateGames, regenerateGame, type GameKind } from "../paliers/games";
import { ANIMALS, FAUNE_GAPS, GIVERS, MADE_THINGS, NATURAL_THINGS, PART_CLUES, PLANTE_GAPS } from "../paliers/games/milieuCi";
import {
  CARES,
  HYGIENE_GAPS,
  HYGIENE_SCENES,
  HYGIENE_SEQUENCES,
  SENSES,
  TOOLS_LIST,
  TOOL_GAPS,
  TOOL_SCENES,
  TOOL_SEQUENCES,
} from "../paliers/games/soinsCi";
import { makeContext, type GameLevel } from "../paliers/games/shared";
import { topicUsesModel } from "../paliers/pregen";
import { PALIER_SIZE } from "../paliers/scoring";
import { allProgrammeEntries } from "../programme";

/**
 * LES GABARITS DES SCIENCES DU CI : naturel ou fabriqué, les animaux, les plantes, le corps et la propreté, les outils
 * (`sc-ci-milieu`, `sc-ci-animaux`, `sc-ci-plantes`, `sc-ci-hygiene`, `sc-ci-outils`).
 *
 * Chaque gabarit a son VÉRIFICATEUR, écrit ici avec ses propres tables (une chose et sa catégorie, un animal et ce qu'on
 * en sait, une scène, son bon geste et ses mauvais gestes) : il recalcule la bonne réponse depuis l'énoncé et les tuiles,
 * et il liste ce qui cloche. Un test abîme ensuite chaque gabarit (le bon choix déplacé, une tuile dans la mauvaise case,
 * deux paires échangées, deux pas échangés) et exige que son vérificateur le voie : un contrôle qui ne verrait rien ne
 * prouverait rien. Les tables ci-dessous sont une copie figée des modules `milieuCi.ts` et `soinsCi.ts`, relue à la main :
 * changer une chose ou une scène oblige à changer ce fichier, donc à la relire. Le modèle avait écrit vingt-cinq exercices
 * de sciences que nous avons lus : six faux, vingt-deux douteux (un ordre « par habitat » sans critère, l'arachide rangée
 * parmi les céréales, le bissap tantôt naturel et tantôt fabriqué, « Frapper doucement » juste et jugé faux).
 */

type Exo = { type: string; prompt: string; answerKey: string; hints: string[]; payload: Record<string, unknown> };

// ---------------------------------------------------------------------------
// Les tables du test
// ---------------------------------------------------------------------------

const NATURAL = [
  "l'arbre", "l'eau", "le sable", "la pierre", "le soleil", "le ciel", "la fleur", "la feuille", "la montagne",
  "le baobab", "le poisson", "l'oiseau", "le lion", "l'éléphant", "le singe", "la girafe",
];
const MADE = [
  "la table", "la chaise", "le seau", "le vélo", "la pirogue", "la voiture", "le bus", "la maison", "le ballon", "la lampe",
  "le livre", "le balai", "le marteau", "les ciseaux", "l'assiette", "le cahier", "le stylo", "le crayon", "la règle",
  "la robe", "le tee-shirt", "le chapeau", "le lit", "l'armoire", "la radio", "le cartable",
];
const EASY_NATURAL = ["l'arbre", "l'eau", "le soleil", "la fleur", "le poisson", "le lion"];
const EASY_MADE = ["la table", "le vélo", "le seau", "la voiture", "le ballon", "le livre"];

type Facts = { keeper: "domestique" | "sauvage" | null; cover: "poils" | "plumes" | "écailles" | null; home: "eau" | "terre" | "air" | null };
const ANIMAL: Record<string, Facts> = {
  "le chat": { keeper: "domestique", cover: "poils", home: "terre" },
  "le chien": { keeper: "domestique", cover: "poils", home: "terre" },
  "le mouton": { keeper: "domestique", cover: null, home: "terre" },
  "la chèvre": { keeper: "domestique", cover: null, home: "terre" },
  "la poule": { keeper: "domestique", cover: "plumes", home: "terre" },
  "l'âne": { keeper: "domestique", cover: "poils", home: "terre" },
  "la vache": { keeper: "domestique", cover: "poils", home: "terre" },
  "le cheval": { keeper: "domestique", cover: "poils", home: "terre" },
  "le lion": { keeper: "sauvage", cover: "poils", home: "terre" },
  "le singe": { keeper: "sauvage", cover: "poils", home: "terre" },
  "la hyène": { keeper: "sauvage", cover: "poils", home: "terre" },
  "le crocodile": { keeper: "sauvage", cover: "écailles", home: null },
  "l'éléphant": { keeper: "sauvage", cover: null, home: "terre" },
  "la girafe": { keeper: "sauvage", cover: "poils", home: "terre" },
  "le poisson": { keeper: null, cover: "écailles", home: "eau" },
  "l'étoile de mer": { keeper: null, cover: null, home: "eau" },
  "l'oiseau": { keeper: null, cover: "plumes", home: "air" },
  "la fourmi": { keeper: null, cover: null, home: "terre" },
};

type GapRow = { text: string; answer: string; wrong: [string, string] };
const FAUNE_GAP_ROWS: GapRow[] = [
  { text: "Le poisson a des ___.", answer: "écailles", wrong: ["plumes", "poils"] },
  { text: "La poule a des ___.", answer: "plumes", wrong: ["écailles", "poils"] },
  { text: "Le chat a des ___.", answer: "poils", wrong: ["plumes", "écailles"] },
  { text: "Le poisson vit dans ___.", answer: "l'eau", wrong: ["le ciel", "l'arbre"] },
  { text: "L'oiseau vole dans ___.", answer: "le ciel", wrong: ["l'eau", "le sable"] },
  { text: "La vache donne ___.", answer: "du lait", wrong: ["du riz", "du sable"] },
  { text: "La poule pond ___.", answer: "un œuf", wrong: ["un ballon", "un livre"] },
];
const PLANTE_GAP_ROWS: GapRow[] = [
  { text: "La mangue est ___ du manguier.", answer: "le fruit", wrong: ["la racine", "la feuille"] },
  { text: "Sous la terre, il y a ___ du manguier.", answer: "la racine", wrong: ["la feuille", "le fruit"] },
  { text: "Le manguier donne ___.", answer: "la mangue", wrong: ["l'arachide", "le fruit du baobab"] },
  { text: "L'arachide pousse ___.", answer: "sous la terre", wrong: ["sur un arbre", "dans l'eau"] },
  { text: "Le mil et l'arachide poussent dans ___.", answer: "le champ", wrong: ["la mer", "la forêt"] },
];
const HYGIENE_GAP_ROWS: GapRow[] = [
  { text: "Je me brosse les ___.", answer: "dents", wrong: ["yeux", "oreilles"] },
  { text: "Je me lave les mains avec du ___.", answer: "savon", wrong: ["lait", "riz"] },
  { text: "Je coupe mes ___ quand ils sont longs.", answer: "ongles", wrong: ["dents", "yeux"] },
];
const TOOL_GAP_ROWS: GapRow[] = [
  { text: "Je coupe le papier avec ___.", answer: "les ciseaux", wrong: ["le marteau", "le balai"] },
  { text: "Pour balayer la cour, je prends ___.", answer: "le balai", wrong: ["les ciseaux", "l'arrosoir"] },
  { text: "J'arrose les plantes avec ___.", answer: "l'arrosoir", wrong: ["le balai", "le marteau"] },
  { text: "J'enfonce un clou avec ___.", answer: "le marteau", wrong: ["le balai", "les ciseaux"] },
  { text: "Je pile le mil avec ___.", answer: "le pilon", wrong: ["les ciseaux", "le balai"] },
  { text: "Je porte de l'eau dans ___.", answer: "le seau", wrong: ["le balai", "les ciseaux"] },
];

const PART_ROWS = [
  { question: "Quelle partie de la plante est sous la terre ?", answer: "la racine", others: ["la tige", "la feuille", "la fleur", "le fruit"] },
  { question: "Quelle partie de la plante porte les feuilles ?", answer: "la tige", others: ["la racine", "la fleur", "le fruit"] },
  { question: "Quelle partie du manguier se mange ?", answer: "le fruit", others: ["la racine", "la tige", "la feuille"] },
  { question: "Quelle partie de la plante est jolie et colorée ?", answer: "la fleur", others: ["la racine", "la tige", "la feuille"] },
];

const GIVE_ROWS = [
  { plant: "le manguier", product: "la mangue", ask: "Quelle plante donne des mangues ?", emoji: "🥭" },
  { plant: "l'arachidier", product: "l'arachide", ask: "Quelle plante donne des arachides ?", emoji: "🥜" },
  { plant: "le mil", product: "les grains de mil", ask: "Quelle plante donne des grains de mil ?", emoji: "🌾" },
  { plant: "le baobab", product: "le fruit du baobab", ask: "", emoji: "" },
  { plant: "le fromager", product: "le fruit du fromager", ask: "", emoji: "" },
];
const TREES = ["le baobab", "le manguier", "le fromager"];
const FIELD = ["le mil", "l'arachidier"];

const SENSE_ROWS = [
  { question: "Avec quoi je vois ?", answer: "les yeux" },
  { question: "Avec quoi j'entends ?", answer: "les oreilles" },
  { question: "Avec quoi je sens les odeurs ?", answer: "le nez" },
  { question: "Avec quoi je goûte ?", answer: "la langue" },
  { question: "Avec quoi je prends un objet ?", answer: "les mains" },
];
const CARE_ROWS = [
  { part: "les mains", care: "Les laver avec du savon" },
  { part: "les dents", care: "Les brosser" },
  { part: "les ongles", care: "Les couper" },
];

const TOOL_ROWS = [
  { name: "les ciseaux", ask: "Avec quoi je coupe le papier ?", use: "Couper du papier", group: "coupe", others: ["le marteau", "le balai", "l'arrosoir", "le seau", "le pilon"] },
  { name: "le marteau", ask: "Avec quoi j'enfonce un clou ?", use: "Enfoncer un clou", group: "frappe", others: ["les ciseaux", "le balai", "l'arrosoir", "le seau"] },
  { name: "le balai", ask: "Avec quoi je balaie la cour ?", use: "Balayer la cour", group: "nettoie", others: ["les ciseaux", "le marteau", "l'arrosoir", "le pilon"] },
  { name: "l'arrosoir", ask: "Avec quoi j'arrose les plantes ?", use: "Arroser les plantes", group: "eau", others: ["les ciseaux", "le marteau", "le balai", "le pilon"] },
  { name: "le pilon", ask: "Avec quoi je pile le mil dans le mortier ?", use: "Piler le mil", group: "frappe", others: ["les ciseaux", "le balai", "l'arrosoir", "le seau"] },
  { name: "le seau", ask: "Avec quoi je porte de l'eau du puits ?", use: "Puiser et porter de l'eau", group: "eau", others: ["les ciseaux", "le marteau", "le balai", "le pilon"] },
];

type Bank = "hygiene" | "outil";
type SceneRow = { id: string; bank: Bank; group: string; text: string; right: string; wrong: [string, string, string] };
const SCENE_ROWS: SceneRow[] = [
  { id: "hy1", bank: "hygiene", group: "mains", text: "Tu vas manger ton repas.", right: "Je me lave les mains avant de manger", wrong: ["Je mange avec les mains sales", "Je mets mes doigts sales dans la bouche", "Je mange du pain tombé dans la poussière"] },
  { id: "hy2", bank: "hygiene", group: "mains", text: "Tu sors des toilettes.", right: "Je me lave les mains après les toilettes", wrong: ["Je ne me lave jamais les mains", "Je file jouer sans me laver les mains", "Je prends mon goûter avec les mains sales"] },
  { id: "hy3", bank: "hygiene", group: "dents", text: "Tu as mangé des bonbons.", right: "Je me brosse bien les dents", wrong: ["Je me couche sans me brosser les dents", "Je mange encore des bonbons au lit", "Je ne me brosse jamais les dents"] },
  { id: "hy4", bank: "hygiene", group: "ongles", text: "Tes ongles sont longs et sales.", right: "Je coupe mes ongles quand ils sont longs", wrong: ["Je ronge mes ongles avec les dents", "Je garde mes ongles longs et sales", "Je me gratte avec mes ongles sales"] },
  { id: "hy5", bank: "hygiene", group: "fruit", text: "Tu as acheté une mangue au marché.", right: "Je lave la mangue avant de la manger", wrong: ["Je mange la mangue sans la laver", "Je mange une mangue ramassée dans la boue", "Je donne la mangue sale à mon petit frère"] },
  { id: "hy6", bank: "hygiene", group: "repas", text: "Il reste du riz sur la table.", right: "Je couvre le riz avec un couvercle", wrong: ["Je laisse le riz découvert toute la nuit", "Je laisse le riz ouvert près des fourmis", "Je pose le riz par terre dans la cour"] },
  { id: "hy7", bank: "hygiene", group: "corps", text: "Tu as joué dans la poussière.", right: "Je me lave avec de l'eau et du savon", wrong: ["Je me couche sans me laver", "Je garde mes habits sales plusieurs jours", "Je ne me lave jamais le corps"] },
  { id: "hy8", bank: "hygiene", group: "eau", text: "Il fait chaud et tu as soif.", right: "Je bois de l'eau propre", wrong: ["Je bois l'eau sale de la flaque", "Je bois l'eau du caniveau", "Je bois de l'eau qui sent mauvais"] },
  { id: "ou1", bank: "outil", group: "ciseaux", text: "Tu as fini de couper avec les ciseaux.", right: "Je range les ciseaux à leur place", wrong: ["Je laisse les ciseaux ouverts par terre", "Je cours avec les ciseaux à la main", "Je pointe les ciseaux vers mon ami"] },
  { id: "ou2", bank: "outil", group: "marteau", text: "Tu vas enfoncer un clou avec le marteau.", right: "Je regarde bien le clou en frappant", wrong: ["Je ferme les yeux en frappant", "Je lance le marteau à mon ami", "Je cours avec le marteau dans la cour"] },
  { id: "ou3", bank: "outil", group: "balai", text: "La classe est pleine de poussière.", right: "Je balaie la poussière vers la poubelle", wrong: ["Je joue à l'épée avec le balai", "Je soulève la poussière sur mes amis", "Je ne balaie jamais la classe"] },
  { id: "ou4", bank: "outil", group: "arrosoir", text: "Les plantes ont soif.", right: "J'arrose les plantes avec l'arrosoir", wrong: ["J'arrose mon ami avec l'arrosoir", "Je jette l'arrosoir par terre", "Je laisse les plantes sans eau"] },
  { id: "ou5", bank: "outil", group: "pilon", text: "Tu piles le mil avec le pilon.", right: "Je tiens bien le pilon à deux mains", wrong: ["Je lance le pilon à mon ami", "Je pile en regardant ailleurs", "Je cours avec le pilon dans la cour"] },
  { id: "ou6", bank: "outil", group: "seau", text: "Le seau est plein d'eau et très lourd.", right: "Je demande de l'aide à un grand", wrong: ["Je porte le seau en courant", "Je tire le seau seul en forçant", "Je soulève le seau sans regarder"] },
];

type SeqRow = { bank: Bank; prompt: string; steps: string[] };
const SEQ_ROWS: SeqRow[] = [
  { bank: "hygiene", prompt: "Mets les gestes dans l'ordre pour te laver les mains.", steps: ["Je mouille mes mains", "Je mets du savon", "Je frotte mes mains", "Je rince mes mains"] },
  { bank: "hygiene", prompt: "Mets les gestes dans l'ordre pour te brosser les dents.", steps: ["Je prends ma brosse à dents", "Je brosse bien mes dents", "Je rince ma bouche à l'eau"] },
  { bank: "hygiene", prompt: "Mets les gestes dans l'ordre pour te laver le corps.", steps: ["Je mouille tout mon corps", "Je me savonne partout", "Je me rince bien à l'eau"] },
  { bank: "hygiene", prompt: "Mets les gestes dans l'ordre du repas.", steps: ["Je me lave les mains d'abord", "Je m'assois à table", "Je mange mon repas"] },
  { bank: "outil", prompt: "Mets les gestes dans l'ordre pour utiliser le balai.", steps: ["Je prends le balai", "Je balaie la cour", "Je range le balai"] },
  { bank: "outil", prompt: "Mets les gestes dans l'ordre pour arroser les plantes.", steps: ["Je remplis l'arrosoir d'eau", "J'arrose les plantes", "Je range l'arrosoir"] },
  { bank: "outil", prompt: "Mets les gestes dans l'ordre pour couper du papier.", steps: ["Je prends les ciseaux", "Je coupe le papier", "Je range les ciseaux"] },
  { bank: "outil", prompt: "Mets les gestes dans l'ordre pour enfoncer un clou.", steps: ["Je pose le clou sur le bois", "Je frappe sur le clou", "Je range le marteau"] },
  { bank: "outil", prompt: "Mets les gestes dans l'ordre pour piler le mil.", steps: ["Je mets le mil dans le mortier", "Je pile le mil avec le pilon", "Je lave le mortier et le pilon"] },
];

/** Les émojis de tout le module, chacun d'Unicode 11 au plus et sans sélecteur de variation. */
const ALLOWED_EMOJI = Array.from(
  "😋🧼🤢👅🍞🚽🚰🙅🏃🍪🍬🦷🛌🍭🙈💅👐😬🤕🛒🥭🤮👶🍚🥘🌙🐜🚮🧒🚿😴👕🥵🥤💦🧺😱👉👀🤾🤸💨😠💧🥀🌾🤲🤝😤🌱🧹🔨📄🧻💺🥣💪✅❌",
);
const VARIATION_SELECTOR = String.fromCodePoint(0xfe0f);
const JOINER = String.fromCodePoint(0x200d);
const GOOD_ZONE = "✅ À faire";
const BAD_ZONE = "❌ À éviter";

// ---------------------------------------------------------------------------
// Les outils des vérificateurs
// ---------------------------------------------------------------------------

const LEVELS: GameLevel[] = [1, 2, 3, 4];
type Draw = { level: GameLevel; seed: string };
/** Cent vingt tirages par gabarit : les quatre niveaux, trente graines. */
const DRAWS: Draw[] = LEVELS.flatMap((level) => Array.from({ length: 30 }, (_, n) => ({ level, seed: `sci:${level}:${n}` })));
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
const emojiOf = (tile: string) => /^\p{Extended_Pictographic}/u.exec(tile)?.[0] ?? "";
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

const kindOf = (name: string): "natural" | "made" | null => (NATURAL.includes(name) ? "natural" : MADE.includes(name) ? "made" : null);
const SORT_SIZE: Record<GameLevel, number> = { 1: 4, 2: 4, 3: 5, 4: 5 };

// ---------------------------------------------------------------------------
// Les vérificateurs, un par gabarit
// ---------------------------------------------------------------------------

/** « Quelle chose est fabriquée par l'homme ? » : une chose fabriquée parmi deux de la nature, ou l'inverse. */
function checkMilieuOdd(exo: Exo): string[] {
  const asked = exo.prompt === "Quelle chose est fabriquée par l'homme ?" ? "made" : exo.prompt === "Quelle chose existe dans la nature, sans l'homme ?" ? "natural" : null;
  if (!asked) return [`énoncé inconnu : « ${exo.prompt} »`];
  const options = optionsOf(exo);
  const matching = options.filter((option) => kindOf(option) === asked);
  const easy = [...EASY_NATURAL, ...EASY_MADE];
  return [
    ...eq("type", exo.type, "qcm"),
    ...eq("nombre d'options", options.length, 3),
    ...distinct("options", options),
    ...isTrue("chaque option est une chose connue", options.every((option) => kindOf(option) !== null)),
    ...eq("une seule option répond", matching.length, 1),
    ...eq("l'option désignée", rightOption(exo), matching[0]),
    ...eq("la clé de réponse", exo.answerKey, matching[0]),
    ...(levelOf(exo) === 1 ? isTrue("au premier niveau, que des choses sûres", options.every((option) => easy.includes(option))) : []),
  ];
}

/** « Glisse chaque chose dans la bonne case. » */
function checkMilieuSort(exo: Exo): string[] {
  const items = itemsOf(exo);
  const zoneOf = (text: string) => (kindOf(text) === "natural" ? "Naturel" : kindOf(text) === "made" ? "Fabriqué" : "?");
  const easy = [...EASY_NATURAL, ...EASY_MADE];
  return [
    ...eq("type", exo.type, "drag-drop"),
    ...eq("les cases", [...zonesOf(exo)].sort(), ["Fabriqué", "Naturel"]),
    ...eq("le nombre de choses", items.length, SORT_SIZE[levelOf(exo)]),
    ...distinct("choses", items.map((item) => item.text)),
    ...items.flatMap((item) => eq(`la case de « ${item.text} »`, item.correctZone, zoneOf(item.text))),
    ...isTrue("au moins deux choses dans chaque case", items.filter((item) => item.correctZone === "Naturel").length >= 2 && items.filter((item) => item.correctZone === "Fabriqué").length >= 2),
    ...(levelOf(exo) === 1 ? isTrue("au premier niveau, que des choses sûres", items.every((item) => easy.includes(item.text))) : []),
  ];
}

/** « Le sable, la pierre et ___ sont dans la nature. » */
function checkMilieuGap(exo: Exo): string[] {
  const match = /^(.+), (.+) et ___ (sont fabriqués par l'homme|sont dans la nature)\.$/.exec(textOf(exo));
  if (!match) return [`phrase inconnue : « ${textOf(exo)} »`];
  const asked = match[3] === "sont dans la nature" ? "natural" : "made";
  const lowered = (text: string) => text.charAt(0).toLocaleLowerCase("fr") + text.slice(1);
  const blank = blankOf(exo);
  return [
    ...eq("type", exo.type, "fill-blank"),
    ...eq("les deux exemples sont de l'espèce demandée", [kindOf(lowered(match[1])), kindOf(match[2])], [asked, asked]),
    ...distinct("les trois choses", [lowered(match[1]), match[2], blank.answer]),
    ...eq("la bonne réponse est de l'espèce demandée", kindOf(blank.answer), asked),
    ...eq("les deux autres sont de l'autre espèce", blank.options.filter((option) => option !== blank.answer).map(kindOf), asked === "natural" ? ["made", "made"] : ["natural", "natural"]),
    ...eq("trois choix", blank.options.length, 3),
    ...eq("la clé de réponse", exo.answerKey, blank.answer),
    ...eq("un seul trou", textOf(exo).split("___").length - 1, 1),
  ];
}

function checkFauneSort(exo: Exo): string[] {
  const items = itemsOf(exo);
  return [
    ...eq("type", exo.type, "drag-drop"),
    ...eq("les cases", [...zonesOf(exo)].sort(), ["Domestiques", "Sauvages"]),
    ...eq("le nombre d'animaux", items.length, SORT_SIZE[levelOf(exo)]),
    ...distinct("animaux", items.map((item) => item.text)),
    ...items.flatMap((item) => {
      const keeper = ANIMAL[item.text]?.keeper;
      return keeper ? eq(`la case de « ${item.text} »`, item.correctZone, keeper === "domestique" ? "Domestiques" : "Sauvages") : [`animal inconnu ou discutable : « ${item.text} »`];
    }),
    ...isTrue("au moins deux animaux dans chaque case", items.filter((item) => item.correctZone === "Domestiques").length >= 2 && items.filter((item) => item.correctZone === "Sauvages").length >= 2),
  ];
}

const HOME_ZONE = { eau: "Dans l'eau", terre: "Sur la terre", air: "Dans les airs" } as const;

function checkFauneHabitat(exo: Exo): string[] {
  const items = itemsOf(exo);
  return [
    ...eq("type", exo.type, "drag-drop"),
    ...eq("les cases", [...zonesOf(exo)].sort(), ["Dans l'eau", "Dans les airs", "Sur la terre"]),
    ...eq("le nombre d'animaux", items.length, SORT_SIZE[levelOf(exo)]),
    ...distinct("animaux", items.map((item) => item.text)),
    ...items.flatMap((item) => {
      const home = ANIMAL[item.text]?.home;
      return home ? eq(`la case de « ${item.text} »`, item.correctZone, HOME_ZONE[home]) : [`animal sans habitat sûr : « ${item.text} »`];
    }),
    ...Object.values(HOME_ZONE).flatMap((zone) => isTrue(`un animal au moins dans « ${zone} »`, items.some((item) => item.correctZone === zone))),
  ];
}

function checkFauneOdd(exo: Exo): string[] {
  const asked = exo.prompt === "Quel animal est sauvage ?" ? "sauvage" : exo.prompt === "Quel animal est domestique ?" ? "domestique" : null;
  if (!asked) return [`énoncé inconnu : « ${exo.prompt} »`];
  const options = optionsOf(exo);
  const matching = options.filter((option) => ANIMAL[option]?.keeper === asked);
  return [
    ...eq("type", exo.type, "qcm"),
    ...eq("nombre d'options", options.length, 3),
    ...distinct("options", options),
    ...isTrue("chaque option est un animal domestique ou sauvage", options.every((option) => ANIMAL[option]?.keeper)),
    ...eq("une seule option répond", matching.length, 1),
    ...eq("l'option désignée", rightOption(exo), matching[0]),
    ...eq("la clé de réponse", exo.answerKey, matching[0]),
  ];
}

function checkFauneCover(exo: Exo): string[] {
  const asked = ({ "Quel animal a des poils ?": "poils", "Quel animal a des plumes ?": "plumes", "Quel animal a des écailles ?": "écailles" } as Record<string, string>)[exo.prompt];
  if (!asked) return [`énoncé inconnu : « ${exo.prompt} »`];
  const options = optionsOf(exo);
  return [
    ...eq("type", exo.type, "qcm"),
    ...eq("nombre d'options", options.length, 3),
    ...distinct("options", options),
    ...isTrue("chaque option a un revêtement sûr", options.every((option) => ANIMAL[option]?.cover)),
    ...eq("l'option désignée a ce revêtement", ANIMAL[rightOption(exo)]?.cover, asked),
    ...eq("une seule option a ce revêtement", options.filter((option) => ANIMAL[option]?.cover === asked).length, 1),
    ...eq("la clé de réponse", exo.answerKey, rightOption(exo)),
  ];
}

function checkFauneLives(exo: Exo): string[] {
  const asked = exo.prompt === "Quel animal vit dans l'eau ?" ? "eau" : exo.prompt === "Quel animal vole dans le ciel ?" ? "air" : null;
  if (!asked) return [`énoncé inconnu : « ${exo.prompt} »`];
  const options = optionsOf(exo);
  const others = options.filter((option) => option !== rightOption(exo));
  return [
    ...eq("type", exo.type, "qcm"),
    ...eq("nombre d'options", options.length, 3),
    ...distinct("options", options),
    ...eq("l'option désignée", ANIMAL[rightOption(exo)]?.home, asked),
    ...isTrue("les deux autres marchent sur la terre, et ne volent pas du tout", others.every((option) => ANIMAL[option]?.home === "terre" && option !== "la poule")),
    ...eq("la clé de réponse", exo.answerKey, rightOption(exo)),
  ];
}

function checkFauneLinks(exo: Exo): string[] {
  const pairs = pairsOf(exo);
  return [
    ...eq("type", exo.type, "match"),
    ...eq("le nombre de paires", pairs.length, 3),
    ...eq("les trois endroits", pairs.map((pair) => pair.right).sort(), ["Dans l'eau", "Dans les airs", "Sur la terre"]),
    ...pairs.flatMap((pair) => {
      const home = ANIMAL[pair.left]?.home;
      return home ? eq(`l'endroit de « ${pair.left} »`, pair.right, HOME_ZONE[home]) : [`animal sans habitat sûr : « ${pair.left} »`];
    }),
  ];
}

function gapChecker(rows: GapRow[]) {
  return (exo: Exo): string[] => {
    const row = rows.find((candidate) => candidate.text === textOf(exo));
    if (!row) return [`phrase inconnue : « ${textOf(exo)} »`];
    const blank = blankOf(exo);
    return [
      ...eq("type", exo.type, "fill-blank"),
      ...eq("le mot juste", blank.answer, row.answer),
      ...eq("la clé de réponse", exo.answerKey, row.answer),
      ...eq("les trois mots", [...blank.options].sort(), [row.answer, ...row.wrong].sort()),
      ...eq("un seul trou", textOf(exo).split("___").length - 1, 1),
      ...eq("un seul blanc", (exo.payload.blanks as unknown[]).length, 1),
    ];
  };
}

function checkPlantPart(exo: Exo): string[] {
  const row = PART_ROWS.find((candidate) => candidate.question === exo.prompt);
  if (!row) return [`question inconnue : « ${exo.prompt} »`];
  const options = optionsOf(exo);
  return [
    ...eq("type", exo.type, "qcm"),
    ...eq("nombre d'options", options.length, 3),
    ...distinct("options", options),
    ...eq("l'option désignée", rightOption(exo), row.answer),
    ...eq("la clé de réponse", exo.answerKey, row.answer),
    ...isTrue("les deux autres sont des parties qui ne répondent pas", options.filter((option) => option !== row.answer).every((option) => row.others.includes(option))),
  ];
}

function checkPlantWho(exo: Exo): string[] {
  const [question, emoji] = exo.prompt.split("\n");
  const row = GIVE_ROWS.find((candidate) => candidate.ask !== "" && candidate.ask === question);
  if (!row) return [`question inconnue : « ${exo.prompt} »`];
  const options = optionsOf(exo);
  return [
    ...eq("type", exo.type, "qcm"),
    ...eq("l'émoji du produit", emoji, row.emoji),
    ...eq("nombre d'options", options.length, 3),
    ...distinct("options", options),
    ...isTrue("chaque option est une plante de la liste", options.every((option) => GIVE_ROWS.some((candidate) => candidate.plant === option))),
    ...eq("l'option désignée", rightOption(exo), row.plant),
    ...eq("la clé de réponse", exo.answerKey, row.plant),
  ];
}

function checkPlantLinks(exo: Exo): string[] {
  const pairs = pairsOf(exo);
  return [
    ...eq("type", exo.type, "match"),
    ...eq("le nombre de paires", pairs.length, 3),
    ...distinct("plantes", pairs.map((pair) => pair.left)),
    ...distinct("produits", pairs.map((pair) => pair.right)),
    ...pairs.flatMap((pair) => eq(`ce que donne « ${pair.left} »`, pair.right, GIVE_ROWS.find((row) => row.plant === pair.left)?.product)),
  ];
}

function checkPlantSort(exo: Exo): string[] {
  const items = itemsOf(exo);
  const zoneOf = (text: string) => (TREES.includes(text) ? "Un arbre" : FIELD.includes(text) ? "Une plante du champ" : "?");
  return [
    ...eq("type", exo.type, "drag-drop"),
    ...eq("les cases", [...zonesOf(exo)].sort(), ["Un arbre", "Une plante du champ"]),
    ...eq("le nombre de plantes", items.length, 4),
    ...eq("deux arbres", items.filter((item) => item.correctZone === "Un arbre").length, 2),
    ...distinct("plantes", items.map((item) => item.text)),
    ...items.flatMap((item) => eq(`la case de « ${item.text} »`, item.correctZone, zoneOf(item.text))),
    ...eq("les deux plantes du champ", items.filter((item) => item.correctZone === "Une plante du champ").map((item) => item.text).sort(), [...FIELD].sort()),
  ];
}

function checkPlantOrder(exo: Exo): string[] {
  return [
    ...eq("type", exo.type, "order"),
    ...eq("l'énoncé", exo.prompt, "Mets les parties de la plante dans l'ordre du bas vers le haut."),
    ...eq("l'ordre", sequenceOf(exo), ["la racine", "la tige", "la feuille"]),
  ];
}

function checkSense(exo: Exo): string[] {
  const row = SENSE_ROWS.find((candidate) => candidate.question === exo.prompt);
  if (!row) return [`question inconnue : « ${exo.prompt} »`];
  const options = optionsOf(exo);
  return [
    ...eq("type", exo.type, "qcm"),
    ...eq("nombre d'options", options.length, 3),
    ...distinct("options", options),
    ...eq("l'option désignée", rightOption(exo), row.answer),
    ...eq("la clé de réponse", exo.answerKey, row.answer),
    ...isTrue("les deux autres sont d'autres parties du corps de la liste", options.filter((option) => option !== row.answer).every((option) => SENSE_ROWS.some((candidate) => candidate.answer === option))),
  ];
}

function checkCare(exo: Exo): string[] {
  const pairs = pairsOf(exo);
  return [
    ...eq("type", exo.type, "match"),
    ...eq("les soins", pairs.map((pair) => `${pair.left} ~ ${pair.right}`).sort(), CARE_ROWS.map((row) => `${row.part} ~ ${row.care}`).sort()),
  ];
}

function checkToolWho(exo: Exo): string[] {
  const row = TOOL_ROWS.find((candidate) => candidate.ask === exo.prompt);
  if (!row) return [`question inconnue : « ${exo.prompt} »`];
  const options = optionsOf(exo);
  return [
    ...eq("type", exo.type, "qcm"),
    ...eq("nombre d'options", options.length, 3),
    ...distinct("options", options),
    ...eq("l'option désignée", rightOption(exo), row.name),
    ...eq("la clé de réponse", exo.answerKey, row.name),
    ...isTrue("les deux autres ne font sûrement pas cela", options.filter((option) => option !== row.name).every((option) => row.others.includes(option))),
  ];
}

function checkToolLinks(exo: Exo): string[] {
  const pairs = pairsOf(exo);
  const rows = pairs.map((pair) => TOOL_ROWS.find((row) => row.name === pair.left));
  return [
    ...eq("type", exo.type, "match"),
    ...eq("le nombre de paires", pairs.length, 3),
    ...distinct("outils", pairs.map((pair) => pair.left)),
    ...distinct("usages", pairs.map((pair) => pair.right)),
    ...pairs.flatMap((pair, index) => eq(`l'usage de « ${pair.left} »`, pair.right, rows[index]?.use)),
    ...distinct("groupes d'outils (deux outils d'un groupe font presque la même chose)", rows.map((row) => row?.group ?? "?")),
  ];
}

// --- Les scènes : une situation, un bon geste, trois mauvais ---

const rowOfPrompt = (bank: Bank, prompt: string) => SCENE_ROWS.find((row) => row.bank === bank && prompt === `${row.text} Que fais-tu ?`);
const rowOfRight = (bank: Bank, text: string) => SCENE_ROWS.find((row) => row.bank === bank && row.right === text);
const rowOfWrong = (bank: Bank, text: string) => SCENE_ROWS.find((row) => row.bank === bank && row.wrong.includes(text));

function sceneChoice(bank: Bank) {
  return (exo: Exo): string[] => {
    const row = rowOfPrompt(bank, exo.prompt);
    if (!row) return [`situation inconnue : « ${exo.prompt} »`];
    const options = optionsOf(exo).map(stripEmoji);
    const others = options.filter((text) => text !== row.right);
    return [
      ...eq("type", exo.type, "qcm"),
      ...eq("nombre d'options", options.length, 3),
      ...distinct("options", options),
      ...isTrue("le bon geste est parmi les options", options.includes(row.right)),
      ...eq("l'option désignée", stripEmoji(rightOption(exo)), row.right),
      ...eq("la clé de réponse", stripEmoji(exo.answerKey), row.right),
      ...isTrue(`les deux autres options sont des gestes à éviter de la scène « ${row.text} »`, others.length === 2 && others.every((text) => row.wrong.includes(text))),
      ...distinct("émojis des options", optionsOf(exo).map(emojiOf)),
    ];
  };
}

function sceneSort(bank: Bank) {
  return (exo: Exo): string[] => {
    const items = itemsOf(exo);
    const problems = [
      ...eq("type", exo.type, "drag-drop"),
      ...eq("les cases", [...zonesOf(exo)].sort(), [BAD_ZONE, GOOD_ZONE].sort()),
      ...eq("le nombre de gestes", items.length, 4),
    ];
    const scenes: string[] = [];
    for (const item of items) {
      const text = stripEmoji(item.text);
      const good = rowOfRight(bank, text);
      const bad = rowOfWrong(bank, text);
      if (!good && !bad) {
        problems.push(`geste inconnu : « ${text} »`);
        continue;
      }
      scenes.push((good ?? bad)!.id);
      if (good && item.correctZone !== GOOD_ZONE) problems.push(`« ${text} » est un bon geste, rangé sous « ${item.correctZone} »`);
      if (bad && item.correctZone !== BAD_ZONE) problems.push(`« ${text} » est un geste à éviter, rangé sous « ${item.correctZone} »`);
    }
    problems.push(
      ...distinct("scènes des gestes", scenes),
      ...distinct("émojis des gestes", items.map((item) => emojiOf(item.text))),
      ...isTrue("au moins deux gestes dans chaque case", items.filter((item) => item.correctZone === GOOD_ZONE).length >= 2 && items.filter((item) => item.correctZone === BAD_ZONE).length >= 2),
    );
    return problems;
  };
}

function sceneOdd(bank: Bank, good: string, bad: string) {
  return (exo: Exo): string[] => {
    const texts = optionsOf(exo).map(stripEmoji);
    const goods = texts.filter((text) => rowOfRight(bank, text));
    const bads = texts.filter((text) => rowOfWrong(bank, text));
    const askedGood = exo.prompt === good;
    const askedBad = exo.prompt === bad;
    const problems = [
      ...eq("type", exo.type, "qcm"),
      ...isTrue(`énoncé inconnu : « ${exo.prompt} »`, askedGood || askedBad),
      ...eq("nombre d'options", texts.length, 3),
      ...isTrue("chaque option est un geste connu", goods.length + bads.length === 3),
    ];
    const answer = stripEmoji(rightOption(exo));
    if (askedGood) problems.push(...eq("un bon geste et deux à éviter", [goods.length, bads.length], [1, 2]), ...eq("la réponse est le bon geste", goods, [answer]));
    if (askedBad) problems.push(...eq("deux bons gestes et un à éviter", [goods.length, bads.length], [2, 1]), ...eq("la réponse est le geste à éviter", bads, [answer]));
    const ids = texts.map((text) => (rowOfRight(bank, text) ?? rowOfWrong(bank, text))?.id ?? "?");
    problems.push(
      ...eq("la clé de réponse", stripEmoji(exo.answerKey), answer),
      ...distinct("scènes", ids),
      ...distinct("émojis", optionsOf(exo).map(emojiOf)),
    );
    return problems;
  };
}

function sceneSteps(bank: Bank) {
  return (exo: Exo): string[] => {
    const steps = sequenceOf(exo).map(stripEmoji);
    const known = SEQ_ROWS.find((row) => row.bank === bank && row.prompt === exo.prompt && row.steps.length === steps.length);
    if (!known) return [`suite inconnue : ${JSON.stringify(steps)} pour « ${exo.prompt} »`];
    return [
      ...eq("type", exo.type, "order"),
      ...eq("l'ordre", steps, known.steps),
      ...distinct("émojis", sequenceOf(exo).map(emojiOf)),
      ...isTrue("trois ou quatre pas", steps.length >= 3 && steps.length <= 4),
    ];
  };
}

const CHECKS: Record<string, (exo: Exo) => string[]> = {
  "milieu-intrus": checkMilieuOdd,
  "milieu-glisser": checkMilieuSort,
  "milieu-trou": checkMilieuGap,
  "faune-glisser": checkFauneSort,
  "faune-habitat": checkFauneHabitat,
  "faune-intrus": checkFauneOdd,
  "faune-couvre": checkFauneCover,
  "faune-vit": checkFauneLives,
  "faune-relier": checkFauneLinks,
  "faune-trou": gapChecker(FAUNE_GAP_ROWS),
  "plante-partie": checkPlantPart,
  "plante-qui": checkPlantWho,
  "plante-donne": checkPlantLinks,
  "plante-type": checkPlantSort,
  "plante-ordre": checkPlantOrder,
  "plante-trou": gapChecker(PLANTE_GAP_ROWS),
  "hygiene-situation": sceneChoice("hygiene"),
  "hygiene-glisser": sceneSort("hygiene"),
  "hygiene-intrus": sceneOdd("hygiene", "Quel geste est bon pour la santé ?", "Quel geste est mauvais pour la santé ?"),
  "hygiene-ordre": sceneSteps("hygiene"),
  "hygiene-sens": checkSense,
  "hygiene-soin": checkCare,
  "hygiene-trou": gapChecker(HYGIENE_GAP_ROWS),
  "outil-qui": checkToolWho,
  "outil-relier": checkToolLinks,
  "outil-trou": gapChecker(TOOL_GAP_ROWS),
  "outil-ordre": sceneSteps("outil"),
  "outil-geste": sceneChoice("outil"),
  "outil-glisser": sceneSort("outil"),
};

const KINDS = Object.keys(CHECKS) as GameKind[];

// ---------------------------------------------------------------------------
// Les tables
// ---------------------------------------------------------------------------

describe("les tables du test sont celles des modules", () => {
  it("compte les mêmes choses naturelles ou fabriquées", () => {
    expect([...NATURAL_THINGS]).toEqual(NATURAL);
    expect([...MADE_THINGS]).toEqual(MADE);
  });

  it("compte les mêmes animaux, avec ce qu'on en sait", () => {
    expect(ANIMALS.map((animal) => [animal.name, { keeper: animal.keeper, cover: animal.cover, home: animal.home }])).toEqual(Object.entries(ANIMAL));
  });

  it("compte les mêmes phrases à trou, parties, produits, sens, soins et outils", () => {
    const gap = (rows: readonly { text: string; answer: string; wrong: readonly [string, string] }[]) => rows.map((row) => ({ text: row.text, answer: row.answer, wrong: [...row.wrong] }));
    expect(gap(FAUNE_GAPS)).toEqual(FAUNE_GAP_ROWS);
    expect(gap(PLANTE_GAPS)).toEqual(PLANTE_GAP_ROWS);
    expect(gap(HYGIENE_GAPS)).toEqual(HYGIENE_GAP_ROWS);
    expect(gap(TOOL_GAPS)).toEqual(TOOL_GAP_ROWS);
    expect(PART_CLUES.map((clue) => ({ question: clue.question, answer: clue.answer, others: [...clue.others] }))).toEqual(PART_ROWS);
    expect(GIVERS.map((giver) => ({ plant: giver.plant, product: giver.product, ask: giver.ask?.question ?? "", emoji: giver.ask?.emoji ?? "" }))).toEqual(GIVE_ROWS);
    expect(SENSES.map((sense) => ({ question: sense.question, answer: sense.answer }))).toEqual(SENSE_ROWS);
    expect(CARES.map((care) => ({ part: care.part, care: care.care }))).toEqual(CARE_ROWS);
    expect(TOOLS_LIST.map((tool) => ({ name: tool.name, ask: tool.ask, use: tool.use, group: tool.group, others: [...tool.others] }))).toEqual(TOOL_ROWS);
  });

  it("compte les mêmes scènes et les mêmes suites, avec les mêmes gestes", () => {
    const scene =
      (bank: Bank) =>
      (s: (typeof HYGIENE_SCENES)[number]): SceneRow => ({ id: s.id, bank, group: s.group, text: s.text, right: s.right[1], wrong: s.wrong.map((act) => act[1]) as [string, string, string] });
    expect([...HYGIENE_SCENES.map(scene("hygiene")), ...TOOL_SCENES.map(scene("outil"))]).toEqual(SCENE_ROWS);
    const seq =
      (bank: Bank) =>
      (s: { prompt: string; steps: readonly (readonly [string, string])[] }): SeqRow => ({ bank, prompt: s.prompt, steps: s.steps.map((step) => step[1]) });
    expect([...HYGIENE_SEQUENCES.map(seq("hygiene")), ...TOOL_SEQUENCES.map(seq("outil"))]).toEqual(SEQ_ROWS);
  });

  it("n'écrit que les émojis de la liste, tous anciens, jamais suivis d'un sélecteur de variation", () => {
    const glyphsOf = (text: string) => text.match(/\p{Extended_Pictographic}/gu) ?? [];
    const used = new Set<string>();
    for (const scene of [...HYGIENE_SCENES, ...TOOL_SCENES]) {
      for (const glyph of [scene.emoji, scene.right[0], ...scene.wrong.map((act) => act[0])]) glyphsOf(glyph).forEach((g) => used.add(g));
    }
    for (const sequence of [...HYGIENE_SEQUENCES, ...TOOL_SEQUENCES]) for (const step of sequence.steps) glyphsOf(step[0]).forEach((g) => used.add(g));
    for (const glyph of used) expect(ALLOWED_EMOJI, glyph).toContain(glyph);
    const source = JSON.stringify([HYGIENE_SCENES, TOOL_SCENES, HYGIENE_SEQUENCES, TOOL_SEQUENCES, ANIMALS, GIVERS]);
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
  it("nomme chaque chose avec son article et un mot du catalogue des images, jamais sans dessin", () => {
    const names = [
      ...NATURAL,
      ...MADE,
      ...Object.keys(ANIMAL),
      ...GIVE_ROWS.flatMap((row) => [row.plant, row.product]),
      ...PART_ROWS.flatMap((row) => [row.answer, ...row.others]),
      ...SENSE_ROWS.map((row) => row.answer),
      ...CARE_ROWS.map((row) => row.part),
      ...TOOL_ROWS.flatMap((row) => [row.name, ...row.others]),
      ...TREES,
      ...FIELD,
    ];
    const missing = [...new Set(names)].filter((name) => !pictureForTile(name));
    expect(missing, "Ajoute l'image de cette chose au catalogue (docs/paliers-et-exercices.md, « Des images sur les tuiles (CI) »), ou retire-la du gabarit.").toEqual([]);
  });

  it("donne aux mots des phrases à trous des images à tous, ou à aucun", () => {
    for (const row of [...FAUNE_GAP_ROWS, ...PLANTE_GAP_ROWS, ...HYGIENE_GAP_ROWS, ...TOOL_GAP_ROWS]) {
      const shown = [row.answer, ...row.wrong].filter((word) => pictureForTile(word) !== null).length;
      expect(shown === 0 || shown === 3, `${row.text} : ${shown} mot(s) sur 3 avec une image`).toBe(true);
    }
  });
});

describe("la table ne se contredit pas", () => {
  it("n'écrit jamais deux fois le même geste, la même situation ou la même chose", () => {
    expect(distinct("gestes", SCENE_ROWS.flatMap((row) => [row.right, ...row.wrong]))).toEqual([]);
    expect(distinct("situations", SCENE_ROWS.map((row) => row.text))).toEqual([]);
    expect(distinct("identifiants", SCENE_ROWS.map((row) => row.id))).toEqual([]);
    expect(distinct("choses", [...NATURAL, ...MADE])).toEqual([]);
    expect(distinct("animaux", Object.keys(ANIMAL))).toEqual([]);
    expect(distinct("phrases à trou", [...FAUNE_GAP_ROWS, ...PLANTE_GAP_ROWS, ...HYGIENE_GAP_ROWS, ...TOOL_GAP_ROWS].map((row) => row.text))).toEqual([]);
  });

  it("donne à chaque scène quatre émojis différents, la scène comprise, et à chaque suite des émojis différents", () => {
    for (const scene of [...HYGIENE_SCENES, ...TOOL_SCENES]) {
      expect(distinct(scene.id, [scene.emoji, scene.right[0], ...scene.wrong.map((act) => act[0])]), scene.id).toEqual([]);
    }
    for (const sequence of [...HYGIENE_SEQUENCES, ...TOOL_SEQUENCES]) expect(distinct(sequence.id, sequence.steps.map((step) => step[0])), sequence.id).toEqual([]);
  });

  it("n'a aucune chose à la fois naturelle et fabriquée, et aucun animal à la fois domestique et sauvage", () => {
    expect(NATURAL.filter((name) => MADE.includes(name))).toEqual([]);
    for (const [name, facts] of Object.entries(ANIMAL)) expect(["domestique", "sauvage", null], name).toContain(facts.keeper);
  });

  it("ne demande jamais ce qui se discute : ni l'habitat du crocodile, ni le revêtement du mouton, de la chèvre ou de l'éléphant", () => {
    expect(ANIMAL["le crocodile"].home).toBeNull();
    for (const name of ["le mouton", "la chèvre", "l'éléphant"]) expect(ANIMAL[name].cover, name).toBeNull();
  });

  it("écrit chaque geste d'une scène avec quatre mots au moins (le repli de l'émoji de tête)", () => {
    for (const scene of [...HYGIENE_SCENES, ...TOOL_SCENES]) {
      for (const act of [scene.right, ...scene.wrong]) {
        expect(act[1].split(/\s+/).length, `${scene.id} : ${act[1]}`).toBeGreaterThanOrEqual(4);
      }
    }
  });

  it("n'écrit dans les énoncés aucun deux-points, au plus une apostrophe droite et vingt mots", () => {
    const prompts = [
      ...SCENE_ROWS.map((row) => `${row.text} Que fais-tu ?`),
      ...SEQ_ROWS.map((row) => row.prompt),
      ...PART_ROWS.map((row) => row.question),
      ...GIVE_ROWS.filter((row) => row.ask !== "").map((row) => row.ask),
      ...SENSE_ROWS.map((row) => row.question),
      ...TOOL_ROWS.map((row) => row.ask),
    ];
    for (const prompt of prompts) {
      expect(prompt, prompt).not.toContain(":");
      expect((prompt.match(/'/g) ?? []).length, prompt).toBeLessThanOrEqual(1);
      expect(prompt.split(/\s+/).length, prompt).toBeLessThanOrEqual(20);
    }
    for (const row of [...FAUNE_GAP_ROWS, ...PLANTE_GAP_ROWS, ...HYGIENE_GAP_ROWS, ...TOOL_GAP_ROWS]) {
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
      return [{ tiles: itemsOf(exo).map((item) => item.text), ctx: { prompt: exo.prompt, counterpart: zonesOf(exo) } }];
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

const GESTURE_KINDS = ["hygiene-situation", "hygiene-glisser", "hygiene-intrus", "hygiene-ordre", "outil-ordre", "outil-geste", "outil-glisser"] as const;
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
        subject: "Éveil scientifique",
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

  it("montre, au CI, une image à chaque tuile qui nomme une chose, ou à aucune, jamais à une seule, et rien sur un geste", () => {
    for (const d of DRAWS) {
      const exo = make(kind, d);
      for (const side of sides(exo)) {
        const resolution = explainTilePictures(side.tiles, side.ctx);
        const where = `${kind} ${d.seed} : ${JSON.stringify(side.tiles)}`;
        expect(resolution.guard, where).toBeNull();
        const shown = resolution.pictures.filter((picture) => picture !== null).length;
        expect(shown === 0 || shown === side.tiles.length, where).toBe(true);
        if ((GESTURE_KINDS as readonly string[]).includes(kind)) expect(shown, where).toBe(0);
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

  it("voit une chose rangée du mauvais côté, un animal sans habitat sûr et un revêtement douteux", () => {
    const sort = clone(make("milieu-glisser", { level: 2, seed: "x" }));
    itemsOf(sort).push({ text: "le bissap", correctZone: "Naturel" });
    expect(checkMilieuSort(sort).join(" | ")).toContain("la case de « le bissap »");
    const habitat = clone(make("faune-habitat", { level: 2, seed: "x" }));
    itemsOf(habitat).push({ text: "le crocodile", correctZone: "Dans l'eau" });
    expect(checkFauneHabitat(habitat).join(" | ")).toContain("animal sans habitat sûr");
    const cover = clone(make("faune-couvre", { level: 2, seed: "x" }));
    cover.payload.options = ["le mouton", "le chat", "le poisson"];
    cover.payload.correctIndex = 0;
    expect(checkFauneCover(cover).join(" | ")).toContain("revêtement");
  });

  it("voit un mauvais geste remplacé par le bon geste d'une autre scène", () => {
    const exo = make("hygiene-situation", { level: 2, seed: "x" });
    const row = rowOfPrompt("hygiene", exo.prompt)!;
    const otherRight = SCENE_ROWS.find((r) => r.bank === "hygiene" && r.id !== row.id)!.right;
    const bad = clone(exo);
    const index = optionsOf(bad).findIndex((option) => stripEmoji(option) !== row.right);
    optionsOf(bad)[index] = `😋 ${otherRight}`;
    expect(sceneChoice("hygiene")(bad).join(" | ")).toContain("gestes à éviter de la scène");
  });

  it("voit une suite de cinq gestes, que la table ne connaît pas, et une suite connue dans le désordre", () => {
    const exo = clone(make("hygiene-ordre", { level: 1, seed: "x" }));
    exo.payload.correctSequence = [...sequenceOf(exo), "💧 Je sèche mes mains"];
    expect(sceneSteps("hygiene")(exo).join(" | ")).toContain("suite inconnue");
    const mixed = clone(make("hygiene-ordre", { level: 1, seed: "x" }));
    sequenceOf(mixed).reverse();
    expect(sceneSteps("hygiene")(mixed).join(" | ")).toContain("l'ordre");
  });
});

// ---------------------------------------------------------------------------
// Dans le programme
// ---------------------------------------------------------------------------

describe("les cinq thématiques des sciences du CI", () => {
  const KEYS = ["sc-ci-milieu", "sc-ci-animaux", "sc-ci-plantes", "sc-ci-hygiene", "sc-ci-outils"] as const;
  const entryOf = (key: string) => allProgrammeEntries().find((entry) => entry.topic.key === key)!;
  const PREFIX: Record<(typeof KEYS)[number], string> = {
    "sc-ci-milieu": "milieu-",
    "sc-ci-animaux": "faune-",
    "sc-ci-plantes": "plante-",
    "sc-ci-hygiene": "hygiene-",
    "sc-ci-outils": "outil-",
  };

  it("sont dix gabarits par palier, sans le modèle, et gratuites à la pré-génération", () => {
    for (const key of KEYS) {
      const games = entryOf(key).topic.games ?? [];
      expect(games.reduce((sum, spec) => sum + spec.count, 0), key).toBe(PALIER_SIZE);
      expect(topicUsesModel(key), key).toBe(false);
      expect(entryOf(key).klass, key).toBe("CI");
    }
  });

  it("ne demandent que les gabarits de leur thématique, sans thématique de vocabulaire", () => {
    for (const key of KEYS) {
      for (const spec of entryOf(key).topic.games ?? []) {
        expect(spec.kind.startsWith(PREFIX[key]), `${key} : ${spec.kind}`).toBe(true);
        expect(spec.vocabulary, `${key} : ${spec.kind}`).toBeUndefined();
      }
    }
  });

  it("montrent chaque type que la démonstration de la page d'accueil montre au CI, et jamais une réponse à écrire", () => {
    const typesOf = (key: string) => new Set((entryOf(key).topic.games ?? []).map((spec) => GAME_KINDS[spec.kind].type));
    expect(typesOf("sc-ci-milieu").has("qcm")).toBe(true);
    expect(typesOf("sc-ci-animaux").has("drag-drop")).toBe(true);
    expect(typesOf("sc-ci-outils").has("match")).toBe(true);
    expect(typesOf("sc-ci-hygiene").has("order")).toBe(true);
    expect(typesOf("sc-ci-plantes").has("fill-blank")).toBe(true);
    for (const key of KEYS) expect(typesOf(key).has("short-answer"), key).toBe(false);
  });

  it("enregistrent chaque gabarit du lot dans une thématique", () => {
    const wired = new Set(KEYS.flatMap((key) => (entryOf(key).topic.games ?? []).map((spec) => spec.kind as string)));
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
              subject: "Éveil scientifique",
            } as Parameters<typeof auditExercise>[0]);
            expect(defects, `${key} palier ${palierIndex} : ${exo.prompt}`).toEqual([]);
          }
          const got: Record<string, number> = {};
          for (const exo of games) {
            const kind = gameOriginOf(exo.payload)!.kind;
            got[kind] = (got[kind] ?? 0) + 1;
          }
          expect(got, `${key} palier ${palierIndex}`).toEqual(wanted);
          // Deux exercices identiques dans un palier, l'enfant le voit.
          expect(distinct(key, games.map((exo) => signature(exo as unknown as Exo))), `${key} palier ${palierIndex}`).toEqual([]);
        }
      }
    }
  });
});
