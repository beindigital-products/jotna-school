import { describe, expect, it, vi } from "vitest";
import { auditExercise } from "../paliers/exerciseAudit";
import { GAME_KINDS, generateGames, regenerateGame, type GameKind } from "../paliers/games";
import { makeContext, type GameLevel } from "../paliers/games/shared";
import { topicUsesModel } from "../paliers/pregen";
import { allProgrammeEntries } from "../programme";
import { PALIER_SIZE } from "../paliers/scoring";

// Ces tests jouent des milliers de tirages : sur le serveur de CI, chargé, l'un d'eux dépasse les 5 secondes par défaut.
vi.setConfig({ testTimeout: 30_000 });

/**
 * L'HISTOIRE ET LA GÉOGRAPHIE DU CE2 : le progrès, les royaumes du Sénégal et leurs rois ; lire une carte, les régions, les
 * activités des hommes, l'habitat et les déplacements.
 *
 * Chaque test RECALCULE la bonne réponse depuis l'énoncé et les tuiles, avec ses propres tables écrites à part : les titres et les
 * peuples des royaumes, les coordonnées des chefs-lieux (le nord et l'est se calculent), les cartes en carrés de couleur lues
 * case par case, l'échelle refaite avec une multiplication, les échelles du temps de chaque besoin. Un gabarit dont la réponse
 * contredit sa table échoue. À la fin, des MUTATIONS : on abîme la bonne réponse d'un exercice juste, puis son énoncé, et chaque
 * vérification doit le voir. L'échantillon du modèle comptait 18 exercices faux sur 48 en histoire et en géographie du CE2
 * (« le Walo, le royaume le plus au sud », « Alboury, roi du Fouta », une échelle « qui montre la hauteur des montagnes »).
 */

const LEVELS: GameLevel[] = [1, 2, 3, 4];
const draws = LEVELS.flatMap((level) => Array.from({ length: 60 }, (_, n) => ({ level, seed: `ce2hg:${level}:${n}` })));
const make = (kind: GameKind, d: (typeof draws)[number]) => GAME_KINDS[kind].make(makeContext("CE2", d.level, `${kind}:${d.seed}`));

type Exo = { type?: string; prompt: string; answerKey: string; hints: string[]; payload: Record<string, unknown> };
const optionsOf = (exo: Exo) => exo.payload.options as string[];
const rightOption = (exo: Exo) => optionsOf(exo)[exo.payload.correctIndex as number];
const itemsOf = (exo: Exo) => exo.payload.items as { text: string; correctZone: string }[];
const zonesOf = (exo: Exo) => exo.payload.zones as string[];
const sequenceOf = (exo: Exo) => exo.payload.correctSequence as string[];
const pairsOf = (exo: Exo) => exo.payload.pairs as { left: string; right: string }[];
const blankOf = (exo: Exo) => (exo.payload.blanks as { options: string[]; answer: string }[])[0];
const textOf = (exo: Exo) => String(exo.payload.text);
const acceptedOf = (exo: Exo) => exo.payload.acceptedAnswers as string[];
const levelOf = (exo: Exo) => (exo.payload.game as { level: number }).level;

const fold = (text: string) => text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
const apostrophes = (text: string) => (text.match(/'/g) ?? []).length;
const wordCount = (text: string) => text.split(/\s+/).filter((token) => /[\p{L}\p{N}]/u.test(token)).length;
const same = (a: readonly string[], b: readonly string[]) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());
const sameSeq = (a: readonly string[], b: readonly string[]) => JSON.stringify(a) === JSON.stringify(b);
const VS16 = String.fromCharCode(0xfe0f);

type Check = (exo: Exo) => string | null;
const ok = (condition: boolean, message: string) => (condition ? null : message);
/** Le premier message d'erreur d'une suite de vérifications. */
const all = (...results: (string | null)[]) => results.find((result) => result !== null) ?? null;
/** Les choix d'un QCM sans la bonne réponse. */
const wrongOf = (exo: Exo) => optionsOf(exo).filter((option) => option !== rightOption(exo));
/** Un trou : la phrase doit être dans la table, la réponse et les choix aussi. */
const checkGap = (table: readonly (readonly [string, string, string[]])[]): Check => (exo) => {
  const row = table.find((entry) => entry[0] === textOf(exo));
  if (!row) return `phrase inconnue : ${textOf(exo)}`;
  return all(
    ok(blankOf(exo).answer === row[1], `la phrase veut « ${row[1]} », le trou dit « ${blankOf(exo).answer} »`),
    ok(same(blankOf(exo).options, [row[1], ...row[2]]), `les choix : ${blankOf(exo).options.join(" | ")}`),
  );
};
/** Une question à choix : la question doit être dans la table, avec la bonne option et les bons choix. */
const checkQuestion = (table: readonly (readonly [string, string, string[]])[]): Check => (exo) => {
  const rows = table.filter((entry) => entry[0] === exo.prompt);
  if (rows.length === 0) return `question inconnue : ${exo.prompt}`;
  const row = rows.find((entry) => entry[1] === rightOption(exo));
  if (!row) return `la bonne option est « ${rightOption(exo)} », la table dit « ${rows.map((entry) => entry[1]).join(" | ")} »`;
  return ok(wrongOf(exo).length === 2 && wrongOf(exo).every((option) => option !== row[1] && row[2].includes(option)), `mauvais choix ${wrongOf(exo).join(" | ")}`);
};
/** Une réponse à écrire : l'énoncé est dans la table, la réponse donnée est la première des écritures admises. */
const checkWrite = (table: readonly (readonly [string, string[]])[]): Check => (exo) => {
  const row = table.find((entry) => entry[0] === exo.prompt);
  if (!row) return `énoncé inconnu : ${exo.prompt}`;
  return all(ok(sameSeq(acceptedOf(exo), row[1]), `écritures ${acceptedOf(exo).join(" | ")} au lieu de ${row[1].join(" | ")}`), ok(exo.answerKey === row[1][0], `réponse donnée ${exo.answerKey}`));
};
/** Un glissé : chaque étiquette doit aller dans la case que la table lui donne, et les cases sont celles de la table. */
const checkSort = (zoneOf: Record<string, string>, zones: readonly (readonly [string, string])[]): Check => (exo) => {
  if (!zones.some((pair) => sameSeq(zonesOf(exo), pair))) return `cases ${zonesOf(exo).join(" | ")}`;
  for (const item of itemsOf(exo)) if (zoneOf[item.text] !== item.correctZone) return `« ${item.text} » est rangé dans « ${item.correctZone} », la table dit « ${zoneOf[item.text]} »`;
  return ok(itemsOf(exo).length >= 3 && itemsOf(exo).length <= 4, "trois ou quatre étiquettes");
};

// ---------------------------------------------------------------------------
// Les tables de vérité, écrites à part des gabarits : HISTOIRE
// ---------------------------------------------------------------------------

// ===== Les royaumes et leurs rois =====
const KINGDOM_FACTS: Record<string, { title?: string; people?: string; place?: string }> = {
  Djolof: { title: "Bourba", people: "Wolof" },
  Cayor: { title: "Damel", people: "Wolof" },
  Baol: { title: "Teigne", people: "Wolof", place: "Au centre" },
  Walo: { title: "Brak", people: "Wolof", place: "Au nord" },
  Sine: { title: "Bour", people: "Sérère", place: "Au centre" },
  Saloum: { title: "Bour", people: "Sérère", place: "Au centre" },
  Tékrour: { place: "Au nord" },
  Fouta: { title: "Almamy", place: "Au nord" },
  Gabou: { title: "Mansa", place: "Au sud" },
};
const KN = Object.keys(KINGDOM_FACTS);
const TITLES_T = ["Bourba", "Damel", "Teigne", "Brak", "Bour", "Almamy", "Mansa"];
const PLACES_T = ["Au nord", "Au centre", "Au sud"];
const RANK_OF_PLACE: Record<string, number> = { "Au nord": 0, "Au centre": 1, "Au sud": 2 };
const holdersOf = (title: string) => KN.filter((name) => KINGDOM_FACTS[name].title === title);
const rankOfKingdom = (name: string) => RANK_OF_PLACE[KINGDOM_FACTS[name]?.place ?? ""];

/** Le royaume cité par une question de place : « le Walo », ou les royaumes de Casamance. */
const placeSubject = (prompt: string): { name: string | null; place: string } | null => {
  const m = /^(?:Où se place(?:nt)? |Dans quelle partie du pays se trouvai(?:t|ent) )(le (\p{L}+)|les royaumes de Casamance)/u.exec(prompt);
  if (!m) return null;
  if (m[2]) return { name: m[2], place: KINGDOM_FACTS[m[2]]?.place ?? "?" };
  return { name: null, place: "Au sud" };
};
const checkPlace = (names: readonly string[], casamance: boolean): Check => (exo) => {
  const subject = placeSubject(exo.prompt);
  if (!subject) return `question inconnue : ${exo.prompt}`;
  if (subject.name === null ? !casamance : !names.includes(subject.name)) return `royaume inattendu : ${exo.prompt}`;
  return all(ok(rightOption(exo) === subject.place, `la bonne option est « ${rightOption(exo)} », la table dit « ${subject.place} »`), ok(same(optionsOf(exo), PLACES_T), `choix ${optionsOf(exo).join(" | ")}`));
};
const checkNorthSouth = (wolof: boolean): Check => (exo) => {
  const direction = /le plus au (nord|sud) \?$/u.exec(exo.prompt)?.[1];
  if (!direction) return `question inconnue : ${exo.prompt}`;
  const options = optionsOf(exo);
  const ranks = options.map(rankOfKingdom);
  const hasWolof = options.includes("Walo") || options.includes("Baol");
  return all(
    ok(options.length === 3 && same(ranks.map(String), ["0", "1", "2"]), `places ${options.join(" | ")}`),
    ok(rightOption(exo) === options[ranks.indexOf(direction === "nord" ? 0 : 2)], `le plus au ${direction} n'est pas « ${rightOption(exo)} »`),
    ok(hasWolof === wolof, `le Walo ou le Baol ${wolof ? "manque" : "est de trop"} : ${options.join(" | ")}`),
  );
};

const SERERE_T: [string, string, string[]][] = [
  ["Le Sine et le ___ sont les deux royaumes sérères.", "Saloum", ["Walo", "Gabou"]],
  ["Le ___ et le Saloum sont les deux royaumes sérères.", "Sine", ["Fouta", "Cayor"]],
  ["Le Saloum est un royaume ___.", "sérère", ["wolof", "mandingue"]],
  ["Le Sine est un royaume ___.", "sérère", ["wolof", "peul"]],
];
const ROLE_T: [string, string, string[]][] = [
  ["Qui commandait tout le royaume ?", "Roi", ["Conseillers", "Villages"]],
  ["Qui aidait le roi à prendre ses décisions ?", "Conseillers", ["Villages", "Champs"]],
  ["Où vivaient les habitants du royaume ?", "Dans les villages", ["Sur les bateaux", "Dans le palais"]],
  ["Que formaient les villages réunis sous l'autorité du roi ?", "Royaume", ["Conseil", "Famille"]],
  ["Comment appelle-t-on les personnes qui conseillent le roi ?", "Conseillers", ["Paysans", "Voyageurs"]],
];
const ROLE_GAP_T: [string, string, string[]][] = [
  ["Le roi est aidé par ses ___ pour décider.", "conseillers", ["cousins", "voyageurs"]],
  ["Un royaume est fait de plusieurs ___ réunis sous le roi.", "villages", ["rivières", "bateaux"]],
  ["Dans un royaume, c'est le ___ qui commande.", "roi", ["puits", "voyageur"]],
  ["Avant une grande décision, le roi écoute ses ___.", "conseillers", ["chèvres", "maisons"]],
  ["Les paysans vivent dans les ___ du royaume.", "villages", ["nuages", "palais"]],
  ["Le ___ choisit avec l'aide de ses conseillers.", "roi", ["champ", "marché"]],
];
const ROLE_LINK_T: Record<string, string[]> = {
  Roi: ["Il commande le royaume", "Il dirige tout le pays", "Il porte un titre", "Il décide en dernier"],
  Conseillers: ["Ils aident le roi à décider", "Ils donnent leur avis au roi", "Ils restent près du roi", "Ils préparent ses choix"],
  Villages: ["Les habitants y vivent", "Ils réunissent les familles", "Ils forment le royaume", "Les paysans y habitent"],
};

// ===== Le progrès =====
/** [besoin, rang dans le temps] de chaque choix de QCM, de chaque étiquette et de chaque moyen dit dans une phrase. */
const CHOICE_T: Record<string, [string, number]> = {
  "Lampe à pétrole": ["s'éclairer", 0],
  "Lampe électrique": ["s'éclairer", 1],
  "Lettre": ["donner des nouvelles", 0],
  "Téléphone fixe": ["donner des nouvelles", 1],
  "Téléphone portable": ["donner des nouvelles", 2],
  "Feu de bois": ["cuisiner", 0],
  "Cuisinière à gaz": ["cuisiner", 1],
  "Aller à pied": ["se déplacer", 0],
  "Charrette": ["se déplacer", 1],
  "Car rapide": ["se déplacer", 2],
};
const REFERENCE_T: Record<string, [string, number]> = {
  "la lampe à pétrole": ["s'éclairer", 0],
  "la lampe électrique": ["s'éclairer", 1],
  "la lettre": ["donner des nouvelles", 0],
  "le téléphone fixe": ["donner des nouvelles", 1],
  "le téléphone portable": ["donner des nouvelles", 2],
  "le feu de bois": ["cuisiner", 0],
  "la cuisinière à gaz": ["cuisiner", 1],
  "la marche à pied": ["se déplacer", 0],
  "la charrette": ["se déplacer", 1],
  "le car rapide": ["se déplacer", 2],
};
const TILE_T: Record<string, [string, number]> = {
  "Lampe à pétrole": ["s'éclairer", 0],
  "Lampe électrique": ["s'éclairer", 1],
  Lettre: ["donner des nouvelles", 0],
  "Téléphone fixe": ["donner des nouvelles", 1],
  "Téléphone portable": ["donner des nouvelles", 2],
  "Feu de bois": ["cuisiner", 0],
  "Cuisinière à gaz": ["cuisiner", 1],
  "À pied": ["se déplacer", 0],
  Charrette: ["se déplacer", 1],
  "Car rapide": ["se déplacer", 2],
};
const NEED_ZONE_T: Record<string, string> = {
  "s'éclairer": "S'éclairer",
  "donner des nouvelles": "Donner des nouvelles",
  cuisiner: "Cuisiner",
  "se déplacer": "Se déplacer",
};
const LAST_RANK_T: Record<string, number> = { "s'éclairer": 1, "donner des nouvelles": 2, cuisiner: 1, "se déplacer": 2 };
const needOfZone = (zone: string) => Object.entries(NEED_ZONE_T).find((entry) => entry[1] === zone)?.[0];

const PROGRESS_GAP_T: [string, string, string[]][] = [
  ["Avant la lampe électrique, on s'éclairait avec une lampe à ___.", "pétrole", ["eau", "sable"]],
  ["Avant le téléphone, on envoyait des nouvelles avec une ___.", "lettre", ["charrette", "lampe"]],
  ["Le téléphone ___ se met dans la poche et se porte partout.", "portable", ["fixe", "mural"]],
  ["Autrefois, on faisait cuire le riz sur un feu de ___.", "bois", ["sable", "verre"]],
  ["La ___ est tirée par un animal sur la route.", "charrette", ["lampe", "lettre"]],
  ["Le ___ roule sur des rails.", "train", ["car rapide", "feu"]],
  ["Pour écrire une lettre, on utilise un stylo et du ___.", "papier", ["sable", "feu"]],
  ["Le ___ permet de donner des nouvelles en quelques secondes.", "téléphone", ["puits", "cheval"]],
];
const PROGRESS_WRITE_T: [string, string[]][] = [
  ["Avant l'électricité, une lampe brûlait du ___. Écris le mot.", ["pétrole", "petrole"]],
  ["Un téléphone à emporter partout est un téléphone ___. Écris le mot.", ["portable"]],
  ["Un message écrit sur du papier et glissé dans une enveloppe est une ___. Écris le mot.", ["lettre", "une lettre"]],
  ["Pour cuire le riz sans gaz, on allume un feu avec du ___. Écris le mot.", ["bois"]],
  ["Pour aller loin sur la route, on prend un car ___. Écris le mot.", ["rapide"]],
  ["Une lampe qui marche avec le courant est une lampe ___. Écris le mot.", ["électrique", "electrique"]],
  ["Pour cuisiner sans feu de bois, on peut utiliser une cuisinière à ___. Écris le mot.", ["gaz"]],
  ["Cette voiture à deux roues, tirée par un cheval ou un âne, s'appelle une ___. Écris le mot.", ["charrette", "une charrette"]],
];

// ---------------------------------------------------------------------------
// Les tables de vérité, écrites à part des gabarits : GÉOGRAPHIE
// ---------------------------------------------------------------------------

// ===== Lire une carte =====
const SIDE_OF: Record<string, string> = { "le nord": "En haut", "le sud": "En bas", "l'est": "À droite", "l'ouest": "À gauche" };
const POINT_OF_SIDE: Record<string, string> = { "en haut": "Nord", "en bas": "Sud", "à droite": "Est", "à gauche": "Ouest" };

const SQUARE_T: Record<string, string> = { "🟥": "village", "🟦": "puits", "🟩": "champ", "🟨": "marché", "🟪": "mosquée", "🟧": "terrain" };
const EMPTY_SQUARE = "⬜";
const DIRECTION_T: Record<string, { label: string; dr: number; dc: number }> = {
  "au nord": { label: "Au nord", dr: -1, dc: 0 },
  "au sud": { label: "Au sud", dr: 1, dc: 0 },
  "à l'est": { label: "À l'est", dr: 0, dc: 1 },
  "à l'ouest": { label: "À l'ouest", dr: 0, dc: -1 },
};
const tileOfWord = (word: string) => `${word[0].toUpperCase()}${word.slice(1)}`;

type ParsedMap = { legend: Record<string, string>; grid: string[][]; question: string; cell: (word: string) => [number, number] | undefined };
/** La carte d'un énoncé : la légende (carré, lieu), le quadrillage et la question. */
function readMap(exo: Exo): ParsedMap | string {
  const lines = exo.prompt.split("\n");
  if (lines.length < 5) return "pas de carte";
  const intro = lines[0];
  const grid = lines.slice(1, -1).map((line) => Array.from(line));
  if (!intro.startsWith("Le nord est en haut. ")) return "le haut de la carte n'est pas dit";
  const legend: Record<string, string> = {};
  for (const m of intro.matchAll(/(🟥|🟦|🟩|🟨|🟪|🟧) (?:est )?(?:le|la) (\p{L}+)/gu)) legend[m[1]] = m[2];
  if (Object.keys(legend).length !== 4) return `légende : ${intro}`;
  for (const [square, word] of Object.entries(legend)) if (SQUARE_T[square] !== word) return `le carré ${square} est dit « ${word} », la table dit « ${SQUARE_T[square]} »`;
  const small = levelOf(exo) <= 2;
  if (grid.length !== (small ? 3 : 4) || grid.some((row) => row.length !== (small ? 4 : 5))) return `quadrillage ${grid.length} lignes de ${grid[0].length} cases`;
  const flat = grid.flat();
  if (flat.some((cell) => cell !== EMPTY_SQUARE && !(cell in legend))) return "un carré n'est pas dans la légende";
  for (const square of Object.keys(legend)) if (flat.filter((cell) => cell === square).length !== 1) return `le carré ${square} n'est pas posé une seule fois`;
  const cell = (word: string): [number, number] | undefined => {
    const square = Object.keys(legend).find((key) => legend[key] === word);
    for (let r = 0; r < grid.length; r++) for (let c = 0; c < grid[r].length; c++) if (grid[r][c] === square) return [r, c];
    return undefined;
  };
  return { legend, grid, question: lines[lines.length - 1], cell };
}

const MAP_GAP_T: [string, string, string[]][] = [
  ["On dessine le plan d'une école et la ___ d'un pays.", "carte", ["légende", "échelle"]],
  ["On dessine le ___ d'une classe ou d'une maison.", "plan", ["pays", "fleuve"]],
  ["La ___ explique ce que veulent dire les couleurs et les signes.", "légende", ["flèche", "échelle"]],
  ["Sur une carte, l'___ sert à calculer les distances.", "échelle", ["orientation", "étoile"]],
  ["Sur une carte, le nord est en haut et le sud en ___.", "bas", ["milieu", "coin"]],
  ["Pour trouver le nord, on peut utiliser une ___.", "boussole", ["échelle", "légende"]],
];
const PLAN_OR_MAP_T: Record<string, string> = { Classe: "Plan", Maison: "Plan", École: "Plan", Cour: "Plan", Chambre: "Plan", Sénégal: "Carte", Afrique: "Carte", Monde: "Carte" };
/** Un quart de tour : vecteur (est, nord). Vers la droite (le sens des aiguilles) puis vers la gauche. */
const COMPASS_VECTOR: Record<string, [number, number]> = { Nord: [0, 1], Est: [1, 0], Sud: [0, -1], Ouest: [-1, 0] };
const compassName = (v: [number, number]) => Object.entries(COMPASS_VECTOR).find((entry) => entry[1][0] === v[0] && entry[1][1] === v[1])?.[0] as string;
const turnRight = ([x, y]: [number, number]): [number, number] => [y, -x];
const turnLeft = ([x, y]: [number, number]): [number, number] => [-y, x];

// ===== Les régions =====
/** Latitude et longitude des chefs-lieux. */
const COORD: Record<string, [number, number]> = {
  Dakar: [14.72, -17.47],
  Thiès: [14.79, -16.92],
  Diourbel: [14.66, -16.23],
  Fatick: [14.34, -16.41],
  Kaolack: [14.17, -16.08],
  Kaffrine: [14.11, -15.55],
  Louga: [15.61, -16.22],
  "Saint-Louis": [16.02, -16.49],
  Matam: [15.66, -13.26],
  Tambacounda: [13.77, -13.67],
  Kédougou: [12.56, -12.17],
  Kolda: [12.89, -14.94],
  Sédhiou: [12.71, -15.56],
  Ziguinchor: [12.58, -16.27],
};
const REGION_LIST = Object.keys(COORD);
const OTHER_TOWNS_T = ["Mbour", "Touba", "Pikine", "Rufisque", "Richard-Toll", "Podor", "Linguère", "Bakel"];
const lat = (name: string) => COORD[name][0];
const lon = (name: string) => COORD[name][1];
const REGION_FACT_T: Record<string, string> = {
  Dakar: "La capitale du Sénégal",
  "Saint-Louis": "Au bord du fleuve Sénégal",
  Ziguinchor: "Au cœur de la Casamance",
  Kédougou: "Des collines au sud-est",
  Tambacounda: "La plus grande région",
};
const REGION_GAP_T: [string, string, string[]][] = [
  ["Dakar est la ___ du Sénégal.", "capitale", ["colline", "pirogue"]],
  ["Le Sénégal est partagé en quatorze ___.", "régions", ["fleuves", "océans"]],
  ["Chaque région a un chef-lieu qui porte le même ___ qu'elle.", "nom", ["jour", "âge"]],
  ["La région de Ziguinchor se trouve en ___.", "Casamance", ["Mauritanie", "Guinée"]],
  ["La région de Saint-Louis est au bord du fleuve ___.", "Sénégal", ["Gambie", "Casamance"]],
  ["La région de Kédougou est connue pour ses ___.", "collines", ["îles", "dunes"]],
  ["La région de Tambacounda est la plus ___ du pays.", "grande", ["petite", "froide"]],
  ["La région de Dakar est la plus ___ du pays.", "petite", ["grande", "froide"]],
];
const REGION_WRITE_T: [string, string[]][] = [
  ["Quelle est la capitale du Sénégal ? Écris le mot.", ["Dakar"]],
  ["Quelle région est la plus grande du pays ? Écris le mot.", ["Tambacounda"]],
  ["Quelle région est la plus petite du pays ? Écris le mot.", ["Dakar"]],
  ["Combien de régions compte le Sénégal ? Écris le nombre.", ["14", "quatorze"]],
];

// ===== Les activités =====
const ACTIVITY_T: [string, string, string[]][] = [
  ["Quelle activité emploie des pirogues pour attraper du poisson ?", "Pêche", ["Élevage", "Tourisme"]],
  ["Quelle activité consiste à garder des troupeaux de bœufs, de moutons et de chèvres ?", "Élevage", ["Pêche", "Tourisme"]],
  ["Quelle activité accueille des visiteurs sur les plages de Saly ?", "Tourisme", ["Agriculture", "Pêche"]],
  ["Quelle activité plante du mil, de l'arachide et du riz ?", "Agriculture", ["Pêche", "Tourisme"]],
  ["Quelle activité fait venir des visiteurs au Cap Skirring ?", "Tourisme", ["Élevage", "Agriculture"]],
  ["Quelle activité se pratique dans le port de Kayar ?", "Pêche", ["Agriculture", "Élevage"]],
  ["Quelle activité cultive des légumes dans les Niayes ?", "Agriculture", ["Tourisme", "Élevage"]],
  ["Quelle activité élève des chèvres et des moutons ?", "Élevage", ["Agriculture", "Pêche"]],
];
const PRODUCT_T: [string, string, string[]][] = [
  ["Que cultive-t-on surtout dans les Niayes ?", "Légumes", ["Bœufs", "Poisson"]],
  ["Que pêchent les pêcheurs de Kayar ?", "Poisson", ["Mil", "Moutons"]],
  ["Qu'élèvent les éleveurs ?", "Moutons", ["Riz", "Pirogues"]],
  ["Que sème-t-on dans un champ au début des pluies ?", "Mil", ["Pirogues", "Bœufs"]],
  ["Qu'attrape-t-on avec des filets ?", "Poisson", ["Riz", "Légumes"]],
  ["Que récolte-t-on dans un champ d'arachide ?", "Arachides", ["Poissons", "Moutons"]],
];
const PLACE_ACTIVITY_T: Record<string, string> = { Kayar: "Pêche", Joal: "Pêche", Saly: "Tourisme", "Cap Skirring": "Tourisme", Niayes: "Légumes" };
const ACTIVITY_WORD_T: Record<string, string> = {
  Mil: "Agriculture",
  Arachide: "Agriculture",
  Riz: "Agriculture",
  Bœufs: "Élevage",
  Moutons: "Élevage",
  Chèvres: "Élevage",
  Pirogue: "Pêche",
  Filet: "Pêche",
  Poisson: "Pêche",
  Plage: "Tourisme",
  Hôtel: "Tourisme",
  Visiteur: "Tourisme",
};
const ACTIVITY_GAP_T: [string, string, string[]][] = [
  ["Les Niayes sont connues pour le ___.", "maraîchage", ["tourisme", "élevage"]],
  ["À Kayar, les pêcheurs partent en mer en ___.", "pirogue", ["charrette", "camion"]],
  ["Le mil et l'arachide sont cultivés par les ___.", "agriculteurs", ["pêcheurs", "touristes"]],
  ["Les bœufs, les moutons et les chèvres sont élevés par les ___.", "éleveurs", ["pêcheurs", "touristes"]],
  ["Saly et le Cap Skirring accueillent des ___.", "touristes", ["éleveurs", "pêcheurs"]],
  ["Le poisson attrapé dans les filets est vendu au ___.", "marché", ["désert", "puits"]],
  ["Le riz, le mil et l'arachide poussent dans les ___.", "champs", ["pirogues", "hôtels"]],
  ["Joal et Mbour sont des ports de ___.", "pêche", ["mines", "rizières"]],
  ["On élève des troupeaux pour avoir de la viande et du ___.", "lait", ["mil", "sable"]],
  ["Un hôtel au bord de la plage accueille des ___.", "visiteurs", ["pêcheurs", "bœufs"]],
];
const FISHING_STEPS_T = ["Préparer la pirogue", "Partir en mer", "Jeter les filets", "Remonter les filets", "Revenir au port", "Vendre le poisson"];
const FARMING_STEPS_T = ["Préparer le champ", "Attendre la pluie", "Semer le mil", "Récolter le mil", "Vendre le mil"];
const ACTIVITY_WRITE_T: [string, string[]][] = [
  ["Quelle activité emploie des pirogues pour attraper du poisson ? Écris le mot.", ["pêche", "la pêche", "peche"]],
  ["Quelle activité élève des bœufs, des moutons et des chèvres ? Écris le mot.", ["élevage", "l'élevage", "elevage"]],
  ["Quelle activité accueille des visiteurs sur la plage de Saly ? Écris le mot.", ["tourisme", "le tourisme"]],
  ["Quelle activité plante du mil et de l'arachide ? Écris le mot.", ["agriculture", "l'agriculture"]],
];

// ===== L'habitat et les déplacements =====
const HABITAT_ZONE_T: Record<string, string> = { Case: "Village", Champ: "Village", Troupeau: "Village", Immeuble: "Ville", Embouteillage: "Ville", "Feu tricolore": "Ville" };
const HABITAT_T: [string, string, string[]][] = [
  ["Où voit-on surtout des champs autour des maisons ?", "Au village", ["En ville", "Au port"]],
  ["Dans quel habitat trouve-t-on beaucoup d'immeubles ?", "En ville", ["Au village", "Dans un champ"]],
  ["Avec quoi fait-on les briques d'un mur en banco ?", "Terre", ["Verre", "Métal"]],
  ["Avec quoi fait-on le toit d'une case traditionnelle ?", "Paille", ["Verre", "Acier"]],
  ["Avec quoi construit-on beaucoup de maisons en ville ?", "Ciment", ["Paille", "Glace"]],
];
const WAY_T: Record<string, string> = { Route: "Voiture", "Chemin de fer": "Train", Port: "Bateau", Aéroport: "Avion" };
const MEANS_ZONE_T: Record<string, string> = { Bus: "Terre", Camion: "Terre", Train: "Terre", Voiture: "Terre", Bateau: "Eau", Pirogue: "Eau", Avion: "Air" };
const MIGRATION_T: [string, string, string[]][] = [
  ["Que veut dire exode rural ?", "Partir du village pour aller en ville", ["Venir de la ville pour vivre au village", "Construire une route entre deux villages"]],
  ["Pourquoi des habitants quittent-ils leur village pendant la saison sèche ?", "Il y a moins de travail dans les champs", ["Il pleut beaucoup", "Les champs sont inondés"]],
  ["Où partent souvent les habitants qui quittent leur village ?", "Vers les villes", ["Vers les champs", "Vers les puits"]],
  ["Que cherchent souvent ceux qui partent en ville ?", "Travail", ["Pirogue", "Troupeau"]],
  ["Quand beaucoup de gens partent d'un village, que devient-il ?", "Il a moins d'habitants", ["Il a plus d'habitants", "Il devient un port"]],
  ["Un habitant qui quitte son village pour la ville fait partie de quel mouvement de population ?", "Exode rural", ["Élevage", "Pêche"]],
  ["Que se passe-t-il dans les villes quand beaucoup de gens arrivent ?", "Elles ont plus d'habitants", ["Elles ont moins d'habitants", "Elles deviennent des villages"]],
  ["Quelle saison pousse certains habitants à quitter leur village ?", "La saison sèche", ["La saison des pluies", "La saison des fêtes"]],
];
const MATERIAL_T: [string, string, string[]][] = [
  ["Les murs d'une case en banco sont faits de ___.", "terre", ["verre", "fer"]],
  ["Le toit d'une case traditionnelle est souvent fait de ___.", "paille", ["verre", "glace"]],
  ["En ville, beaucoup d'immeubles sont construits en ___.", "béton", ["paille", "glace"]],
  ["Un toit en ___ brille au soleil et résiste à la pluie.", "tôle", ["paille", "herbe"]],
  ["Les briques sont faites de terre mélangée avec de l'___.", "eau", ["huile", "fer"]],
  ["Une maison en ___ est solide et dure longtemps.", "dur", ["eau", "vent"]],
  ["La case est surtout la maison du ___.", "village", ["port", "désert"]],
  ["Un immeuble a plusieurs ___.", "étages", ["pirogues", "champs"]],
];
const SPEED_T: Record<string, number> = { "À pied": 0, Charrette: 1, Voiture: 2, Avion: 3 };
const MEANS_WRITE_T: [string, string[]][] = [
  ["Quel moyen de transport utilise un port ? Écris le mot.", ["bateau", "un bateau", "navire", "pirogue"]],
  ["Quel moyen de transport utilise un aéroport ? Écris le mot.", ["avion", "un avion"]],
  ["Quel moyen de transport roule sur le chemin de fer ? Écris le mot.", ["train", "un train"]],
  ["Quelle voie de communication prend une voiture ? Écris le mot.", ["route", "la route"]],
];

// ===========================================================================
// LES VÉRIFICATIONS, UNE PAR GABARIT
// ===========================================================================

const CHECKS: Record<string, Check> = {
  // ----- Les royaumes du Sénégal (1) -----
  "ce2-fondateur": (exo) =>
    all(
      ok(/Ndiadiane Ndiaye/u.test(exo.prompt), "le fondateur n'est pas nommé"),
      ok(rightOption(exo) === "Djolof", `la bonne option est « ${rightOption(exo)} »`),
      ok(wrongOf(exo).length === 2 && wrongOf(exo).every((option) => KN.includes(option) && KINGDOM_FACTS[option].people !== "Wolof"), `mauvais choix ${wrongOf(exo).join(" | ")}`),
    ),
  "ce2-wolof-trou": (exo) => {
    const filled = textOf(exo).replace("___", blankOf(exo).answer);
    const m = /^Le (\p{L}+), le (\p{L}+), le (\p{L}+) et le (\p{L}+) sont des royaumes wolofs\.$/u.exec(filled);
    if (!m) return `phrase inconnue : ${filled}`;
    return all(
      ok(same(m.slice(1, 5), KN.filter((name) => KINGDOM_FACTS[name].people === "Wolof")), `les quatre royaumes : ${m.slice(1, 5).join(" ")}`),
      ok(blankOf(exo).options.length === 3 && blankOf(exo).options.filter((option) => option !== blankOf(exo).answer).every((option) => KN.includes(option) && KINGDOM_FACTS[option].people !== "Wolof"), `choix ${blankOf(exo).options.join(" | ")}`),
    );
  },
  "ce2-wolof-compte": (exo) => {
    const m = /^(.+) sont cités\. Combien sont des royaumes wolofs \? Écris le nombre\.$/u.exec(exo.prompt);
    if (!m) return `énoncé inconnu : ${exo.prompt}`;
    const cited = m[1].split(/, | et /).map((part) => part.replace(/^[Ll]e /, ""));
    const wolofs = cited.filter((name) => KINGDOM_FACTS[name]?.people === "Wolof").length;
    return all(
      ok(cited.every((name) => KN.includes(name)) && new Set(cited).size === cited.length, `noms ${cited.join(" ")}`),
      ok(cited.length === (levelOf(exo) >= 3 ? 4 : 3), `${cited.length} noms au niveau ${levelOf(exo)}`),
      ok(wolofs >= 1 && wolofs < cited.length, `${wolofs} wolofs sur ${cited.length}`),
      ok(sameSeq(acceptedOf(exo), [String(wolofs)]) && exo.answerKey === String(wolofs), `réponse ${acceptedOf(exo).join(" | ")} pour ${wolofs}`),
    );
  },
  "ce2-peuple-glisser": (exo) => {
    for (const item of itemsOf(exo)) if (KINGDOM_FACTS[item.text]?.people !== item.correctZone) return `« ${item.text} » est rangé dans « ${item.correctZone} »`;
    return all(ok(sameSeq(zonesOf(exo), ["Wolof", "Sérère"]), `cases ${zonesOf(exo).join(" | ")}`), ok(itemsOf(exo).length === 4, "quatre royaumes"));
  },
  "ce2-royaume-peuple": (exo) => {
    const people = /royaume (wolof|sérère) \?$/u.exec(exo.prompt)?.[1];
    if (!people) return `question inconnue : ${exo.prompt}`;
    const want = people === "wolof" ? "Wolof" : "Sérère";
    return all(
      ok(KINGDOM_FACTS[rightOption(exo)]?.people === want, `« ${rightOption(exo)} » n'est pas ${people}`),
      ok(wrongOf(exo).length === 2 && wrongOf(exo).every((option) => KN.includes(option) && KINGDOM_FACTS[option].people !== want), `mauvais choix ${wrongOf(exo).join(" | ")}`),
    );
  },
  "ce2-wolof-place": checkPlace(["Walo", "Baol"], false),
  "ce2-wolof-nord-sud": checkNorthSouth(true),
  "ce2-place-relier": (exo) => {
    for (const pair of pairsOf(exo)) if (KINGDOM_FACTS[pair.left]?.place !== pair.right) return `« ${pair.left} » est relié à « ${pair.right} », la table dit « ${KINGDOM_FACTS[pair.left]?.place} »`;
    return ok(same(pairsOf(exo).map((pair) => pair.right), PLACES_T), "trois places différentes");
  },
  // ----- Les royaumes du Sénégal (2) -----
  "ce2-royaume-place": checkPlace(["Sine", "Saloum", "Tékrour", "Fouta", "Gabou"], true),
  "ce2-royaume-nord-sud": checkNorthSouth(false),
  "ce2-royaume-ordre": (exo) => {
    const direction = /du (nord au sud|sud au nord)\.$/u.exec(exo.prompt)?.[1];
    if (!direction) return `énoncé inconnu : ${exo.prompt}`;
    const ranks = sequenceOf(exo).map(rankOfKingdom);
    return all(ok(sequenceOf(exo).length === 3, "trois royaumes"), ok(sameSeq(ranks.map(String), direction === "nord au sud" ? ["0", "1", "2"] : ["2", "1", "0"]), `places ${ranks.join(" ")} pour ${direction}`));
  },
  "ce2-vallee": (exo) =>
    all(
      ok(["Fouta", "Tékrour"].includes(rightOption(exo)), `la bonne option est « ${rightOption(exo)} »`),
      ok(wrongOf(exo).length === 2 && wrongOf(exo).every((option) => ["Sine", "Saloum", "Gabou"].includes(option)), `mauvais choix ${wrongOf(exo).join(" | ")}`),
    ),
  "ce2-serere-trou": checkGap(SERERE_T),
  "ce2-royaume-glisser": (exo) => {
    for (const item of itemsOf(exo)) {
      const place = KINGDOM_FACTS[item.text]?.place;
      if (place !== (item.correctZone === "Nord" ? "Au nord" : item.correctZone === "Centre" ? "Au centre" : "?")) return `« ${item.text} » est rangé dans « ${item.correctZone} », la table dit « ${place} »`;
    }
    return all(ok(sameSeq(zonesOf(exo), ["Nord", "Centre"]), `cases ${zonesOf(exo).join(" | ")}`), ok(itemsOf(exo).length === 4, "quatre royaumes"));
  },
  "ce2-role-qcm": checkQuestion(ROLE_T),
  "ce2-role-trou": checkGap(ROLE_GAP_T),
  "ce2-role-relier": (exo) => {
    for (const pair of pairsOf(exo)) if (!(ROLE_LINK_T[pair.left] ?? []).includes(pair.right)) return `« ${pair.left} » est relié à « ${pair.right} »`;
    return ok(same(pairsOf(exo).map((pair) => pair.left), ["Roi", "Conseillers", "Villages"]), "le roi, les conseillers, les villages");
  },
  // ----- Les rois et leurs titres -----
  "ce2-titre-qcm": (exo) => {
    let m = /^Quel est le titre du roi du (\p{L}+) \?$/u.exec(exo.prompt);
    if (m) {
      const title = KINGDOM_FACTS[m[1]]?.title;
      return all(
        ok(!!title, `royaume inconnu : ${m[1]}`),
        ok(rightOption(exo) === title, `le titre du roi du ${m[1]} est « ${title} », l'exercice dit « ${rightOption(exo)} »`),
        ok(wrongOf(exo).length === 2 && wrongOf(exo).every((option) => option !== title && TITLES_T.includes(option)), `mauvais choix ${wrongOf(exo).join(" | ")}`),
      );
    }
    m = /^Quel royaume avait un roi appelé (\p{L}+) \?$/u.exec(exo.prompt);
    if (m) {
      const holders = holdersOf(m[1]);
      return all(
        ok(holders.length === 1, `${holders.length} royaumes portent le titre ${m[1]}`),
        ok(rightOption(exo) === holders[0], `le titre ${m[1]} est celui du ${holders[0]}, l'exercice dit « ${rightOption(exo)} »`),
        ok(wrongOf(exo).length === 2 && wrongOf(exo).every((option) => KN.includes(option) && KINGDOM_FACTS[option].title !== m![1]), `mauvais choix ${wrongOf(exo).join(" | ")}`),
      );
    }
    if (exo.prompt === "Au Sine comme au Saloum, quel est le titre du roi ?") {
      return all(ok(rightOption(exo) === "Bour", `la bonne option est « ${rightOption(exo)} »`), ok(wrongOf(exo).every((option) => option !== "Bour" && TITLES_T.includes(option)), "mauvais choix"));
    }
    return `question inconnue : ${exo.prompt}`;
  },
  "ce2-titre-trou": (exo) => {
    const filled = textOf(exo);
    let m = /^Au (\p{L}+), le roi porte le titre de ___\.$/u.exec(filled);
    if (m) {
      const title = KINGDOM_FACTS[m[1]]?.title;
      return all(ok(blankOf(exo).answer === title, `le titre est « ${title} », le trou dit « ${blankOf(exo).answer} »`), ok(blankOf(exo).options.length === 3 && blankOf(exo).options.filter((o) => o !== title).every((o) => TITLES_T.includes(o)), `choix ${blankOf(exo).options.join(" | ")}`));
    }
    m = /^Le titre (de |d')(\p{L}+) était celui du roi du ___\.$/u.exec(filled);
    if (m) {
      // « de » s'élide devant une voyelle : « d'Almamy », « de Damel ».
      if (m[1] !== (/^[aeiouyàâéèêëîïôûùh]/iu.test(m[2]) ? "d'" : "de ")) return `« de » mal élidé : ${filled}`;
      m = [m[0], m[2]] as unknown as RegExpExecArray;
      const holders = holdersOf(m[1]);
      return all(ok(holders.length === 1 && blankOf(exo).answer === holders[0], `le titre ${m[1]} est celui du ${holders[0]}, le trou dit « ${blankOf(exo).answer} »`), ok(blankOf(exo).options.filter((o) => o !== blankOf(exo).answer).every((o) => KN.includes(o) && KINGDOM_FACTS[o].title !== m![1]), `choix ${blankOf(exo).options.join(" | ")}`));
    }
    return `phrase inconnue : ${filled}`;
  },
  "ce2-titre-relier": (exo) => {
    for (const pair of pairsOf(exo)) if (KINGDOM_FACTS[pair.left]?.title !== pair.right) return `« ${pair.left} » est relié à « ${pair.right} », la table dit « ${KINGDOM_FACTS[pair.left]?.title} »`;
    return ok(!(pairsOf(exo).some((pair) => pair.left === "Sine") && pairsOf(exo).some((pair) => pair.left === "Saloum")), "le Sine et le Saloum ensemble");
  },
  "ce2-titre-glisser": (exo) => {
    const zones = zonesOf(exo);
    const peopleMode = sameSeq(zones, ["Wolof", "Sérère"]);
    if (!peopleMode && !sameSeq(zones, ["Nord", "Centre"])) return `cases ${zones.join(" | ")}`;
    for (const item of itemsOf(exo)) {
      const holder = holdersOf(item.text)[0];
      if (!holder) return `titre inconnu : ${item.text}`;
      const expected = peopleMode ? KINGDOM_FACTS[holder].people : KINGDOM_FACTS[holder].place === "Au nord" ? "Nord" : "Centre";
      if (item.correctZone !== expected) return `« ${item.text} » est rangé dans « ${item.correctZone} », la table dit « ${expected} »`;
    }
    return ok(itemsOf(exo).length === 4, "quatre titres");
  },
  "ce2-titre-ecrire": (exo) => {
    const m = /^Écris le titre du roi du (\p{L}+)\.$/u.exec(exo.prompt);
    if (!m) return `énoncé inconnu : ${exo.prompt}`;
    const title = KINGDOM_FACTS[m[1]]?.title;
    return all(ok(!!title, `royaume inconnu : ${m[1]}`), ok(sameSeq(acceptedOf(exo), [title as string, title === "Almamy" ? "l'Almamy" : `le ${title}`, `un ${title}`]), `écritures ${acceptedOf(exo).join(" | ")}`), ok(exo.answerKey === title, `réponse donnée ${exo.answerKey}`));
  },
  "ce2-titre-ordre": (exo) => {
    const direction = /du (nord au sud|sud au nord)\.$/u.exec(exo.prompt)?.[1];
    if (!direction) return `énoncé inconnu : ${exo.prompt}`;
    const clauses = [...exo.prompt.matchAll(new RegExp(`(?:le|l') ?(${TITLES_T.join("|")})(?: règne)? au (${KN.join("|")})`, "giu"))].map((m) => ({ title: m[1], name: m[2] }));
    if (clauses.length !== 3) return `${clauses.length} propositions : ${exo.prompt}`;
    for (const clause of clauses) if (KINGDOM_FACTS[clause.name].title !== clause.title) return `le titre ${clause.title} n'est pas celui du ${clause.name}`;
    const byRank = [...clauses].sort((a, b) => rankOfKingdom(a.name) - rankOfKingdom(b.name)).map((clause) => clause.title);
    if (new Set(clauses.map((clause) => rankOfKingdom(clause.name))).size !== 3) return "deux royaumes à la même place";
    return ok(sameSeq(sequenceOf(exo), direction === "nord au sud" ? byRank : [...byRank].reverse()), `suite ${sequenceOf(exo).join(" ")} pour ${direction}`);
  },
  // ----- Le progrès -----
  "ce2-progres-compare": (exo) => {
    const m = /^Pour (.+), lequel est plus (récent|ancien) que (.+) \?$/u.exec(exo.prompt);
    if (!m) return `question inconnue : ${exo.prompt}`;
    const [, need, relation, reference] = m;
    const ref = REFERENCE_T[reference];
    if (!ref || ref[0] !== need) return `référence « ${reference} » pour « ${need} »`;
    const holds = (option: string) => {
      const entry = CHOICE_T[option];
      return !!entry && entry[0] === need && (relation === "récent" ? entry[1] > ref[1] : entry[1] < ref[1]);
    };
    return all(
      ok(holds(rightOption(exo)), `« ${rightOption(exo)} » n'est pas plus ${relation} que ${reference}`),
      ok(wrongOf(exo).length === 2 && wrongOf(exo).every((option) => option in CHOICE_T && CHOICE_T[option][0] !== need), `mauvais choix ${wrongOf(exo).join(" | ")}`),
    );
  },
  "ce2-progres-rang": (exo) => {
    const m = /^Pour (.+), lequel est le plus (récent|ancien) \?$/u.exec(exo.prompt);
    if (!m) return `question inconnue : ${exo.prompt}`;
    const [, need, relation] = m;
    const options = optionsOf(exo);
    const ranks = options.map((option) => (CHOICE_T[option]?.[0] === need ? CHOICE_T[option][1] : -1));
    return all(
      ok(options.length === 3 && same(ranks.map(String), ["0", "1", "2"]), `les trois moyens de « ${need} » : ${options.join(" | ")}`),
      ok(CHOICE_T[rightOption(exo)]?.[1] === (relation === "récent" ? 2 : 0), `« ${rightOption(exo)} » n'est pas le plus ${relation}`),
    );
  },
  "ce2-progres-ordre": (exo) => {
    const m = /^Pour (.+), mets ces moyens du plus (ancien au plus récent|récent au plus ancien)\.$/u.exec(exo.prompt);
    if (!m) return `énoncé inconnu : ${exo.prompt}`;
    const ranks = sequenceOf(exo).map((tile) => (TILE_T[tile]?.[0] === m[1] ? TILE_T[tile][1] : -1));
    return ok(sameSeq(ranks.map(String), m[2].startsWith("ancien") ? ["0", "1", "2"] : ["2", "1", "0"]), `rangs ${ranks.join(" ")} pour « ${m[2]} »`);
  },
  "ce2-progres-glisser": (exo) => {
    for (const item of itemsOf(exo)) {
      const need = TILE_T[item.text]?.[0];
      if (!need || NEED_ZONE_T[need] !== item.correctZone) return `« ${item.text} » est rangé dans « ${item.correctZone} », la table dit « ${need} »`;
    }
    return all(ok(zonesOf(exo).length === 2 && zonesOf(exo).every((zone) => needOfZone(zone) !== undefined), `cases ${zonesOf(exo).join(" | ")}`), ok(itemsOf(exo).length === 4, "quatre moyens"));
  },
  "ce2-progres-relier": (exo) => {
    const m = /^Relie chaque besoin au moyen le plus (ancien|récent)\.$/u.exec(exo.prompt);
    if (!m) return `énoncé inconnu : ${exo.prompt}`;
    for (const pair of pairsOf(exo)) {
      const need = needOfZone(pair.left);
      const entry = TILE_T[pair.right];
      if (!need || !entry || entry[0] !== need) return `« ${pair.left} » est relié à « ${pair.right} »`;
      if (entry[1] !== (m[1] === "ancien" ? 0 : LAST_RANK_T[need])) return `« ${pair.right} » n'est pas le moyen le plus ${m[1]} de « ${pair.left} »`;
    }
    return null;
  },
  "ce2-progres-trou": checkGap(PROGRESS_GAP_T),
  "ce2-progres-ecrire": checkWrite(PROGRESS_WRITE_T),
  // ----- Lire une carte -----
  "ce2-orientation": (exo) => {
    const m = /^Sur une carte, de quel côté se trouve (.+) \?$/u.exec(exo.prompt) ?? /^Où place-t-on (.+) sur une carte \?$/u.exec(exo.prompt);
    if (m) {
      return all(
        ok(SIDE_OF[m[1]] === rightOption(exo), `${m[1]} est « ${SIDE_OF[m[1]]} », l'exercice dit « ${rightOption(exo)} »`),
        ok(wrongOf(exo).length === 2 && wrongOf(exo).every((option) => option !== SIDE_OF[m[1]] && Object.values(SIDE_OF).includes(option)), `mauvais choix ${wrongOf(exo).join(" | ")}`),
      );
    }
    const side = /^Quel point cardinal est (.+) de la carte \?$/u.exec(exo.prompt);
    if (!side) return `question inconnue : ${exo.prompt}`;
    return all(
      ok(POINT_OF_SIDE[side[1]] === rightOption(exo), `${side[1]} est « ${POINT_OF_SIDE[side[1]]} », l'exercice dit « ${rightOption(exo)} »`),
      ok(wrongOf(exo).length === 2 && wrongOf(exo).every((option) => option !== POINT_OF_SIDE[side[1]] && Object.values(POINT_OF_SIDE).includes(option)), `mauvais choix ${wrongOf(exo).join(" | ")}`),
    );
  },
  "ce2-carte-direction": (exo) => {
    const map = readMap(exo);
    if (typeof map === "string") return map;
    const m = /^Où est (?:le|la) (\p{L}+) par rapport (?:au|à la) (\p{L}+) \?$/u.exec(map.question);
    if (!m) return `question inconnue : ${map.question}`;
    const a = map.cell(m[1]);
    const b = map.cell(m[2]);
    if (!a || !b) return `lieu absent de la carte : ${m[1]} ou ${m[2]}`;
    const dr = a[0] - b[0];
    const dc = a[1] - b[1];
    if ((dr === 0) === (dc === 0)) return "les deux lieux ne sont pas alignés";
    const label = dr === 0 ? (dc > 0 ? "À l'est" : "À l'ouest") : dr > 0 ? "Au sud" : "Au nord";
    return all(ok(rightOption(exo) === label, `${m[1]} est « ${label} » de ${m[2]}, l'exercice dit « ${rightOption(exo)} »`), ok(wrongOf(exo).length === 2 && wrongOf(exo).every((option) => option !== label && Object.values(DIRECTION_T).some((d) => d.label === option)), `mauvais choix ${wrongOf(exo).join(" | ")}`));
  },
  "ce2-carte-voisin": (exo) => {
    const map = readMap(exo);
    if (typeof map === "string") return map;
    const m = /^Quel lieu est juste (au nord|au sud|à l'est|à l'ouest) (?:du|de la) (\p{L}+) \?$/u.exec(map.question);
    if (!m) return `question inconnue : ${map.question}`;
    const b = map.cell(m[2]);
    if (!b) return `lieu absent de la carte : ${m[2]}`;
    const d = DIRECTION_T[m[1]];
    const neighbour = map.grid[b[0] + d.dr]?.[b[1] + d.dc];
    if (!neighbour || neighbour === EMPTY_SQUARE) return "aucun lieu voisin dans cette direction";
    const answer = tileOfWord(map.legend[neighbour]);
    const others = Object.values(map.legend).filter((word) => word !== map.legend[neighbour] && word !== m[2]).map(tileOfWord);
    return all(ok(rightOption(exo) === answer, `le voisin est « ${answer} », l'exercice dit « ${rightOption(exo)} »`), ok(same(wrongOf(exo), others), `mauvais choix ${wrongOf(exo).join(" | ")}`));
  },
  "ce2-carte-legende": (exo) => {
    const map = readMap(exo);
    if (typeof map === "string") return map;
    const m = /^Que montre (\S+) sur cette carte \?$/u.exec(map.question);
    if (!m || !(m[1] in map.legend)) return `question inconnue : ${map.question}`;
    const answer = tileOfWord(SQUARE_T[m[1]]);
    return all(ok(rightOption(exo) === answer, `${m[1]} montre « ${answer} », l'exercice dit « ${rightOption(exo)} »`), ok(wrongOf(exo).length === 2 && wrongOf(exo).every((option) => Object.values(map.legend).map(tileOfWord).includes(option) && option !== answer), `mauvais choix ${wrongOf(exo).join(" | ")}`));
  },
  "ce2-echelle": (exo) => {
    const forward = /^Sur une carte, 1 cm montre (\d+) km\. Deux villes sont à (\d+) cm\. Quelle est la distance réelle en km \? Écris le nombre\.$/u.exec(exo.prompt);
    if (forward) return ok(sameSeq(acceptedOf(exo), [String(Number(forward[1]) * Number(forward[2]))]), `${forward[2]} cm à ${forward[1]} km le centimètre font ${Number(forward[1]) * Number(forward[2])} km, l'exercice dit ${acceptedOf(exo)[0]}`);
    const backward = /^Sur une carte, 1 cm montre (\d+) km\. Deux villes sont à (\d+) km\. Combien de cm les sépare sur la carte \? Écris le nombre\.$/u.exec(exo.prompt);
    if (!backward) return `énoncé inconnu : ${exo.prompt}`;
    const scale = Number(backward[1]);
    const km = Number(backward[2]);
    return all(ok(km % scale === 0, `${km} km ne se partage pas en ${scale}`), ok(sameSeq(acceptedOf(exo), [String(km / scale)]), `${km} km à ${scale} km le centimètre font ${km / scale} cm, l'exercice dit ${acceptedOf(exo)[0]}`));
  },
  "ce2-carte-trou": checkGap(MAP_GAP_T),
  "ce2-plan-carte-glisser": checkSort(PLAN_OR_MAP_T, [["Plan", "Carte"]]),
  "ce2-boussole-ordre": (exo) => {
    const m = /^Range les points cardinaux dans le sens (inverse )?des aiguilles, en partant (du nord|de l'est|du sud|de l'ouest)\.$/u.exec(exo.prompt);
    if (!m) return `énoncé inconnu : ${exo.prompt}`;
    const start = { "du nord": "Nord", "de l'est": "Est", "du sud": "Sud", "de l'ouest": "Ouest" }[m[2]] as string;
    const expected = [start];
    let vector = COMPASS_VECTOR[start];
    for (let k = 0; k < 3; k++) {
      vector = m[1] ? turnLeft(vector) : turnRight(vector);
      expected.push(compassName(vector));
    }
    return ok(sameSeq(sequenceOf(exo), expected), `la suite ${sequenceOf(exo).join(" ")} au lieu de ${expected.join(" ")}`);
  },
  // ----- Les régions -----
  "ce2-chef-lieu": (exo) => {
    if (exo.prompt === "Laquelle de ces villes est le chef-lieu d'une région ?") {
      return all(ok(REGION_LIST.includes(rightOption(exo)), `« ${rightOption(exo)} » n'est pas un chef-lieu`), ok(wrongOf(exo).length === 2 && wrongOf(exo).every((option) => OTHER_TOWNS_T.includes(option)), `mauvais choix ${wrongOf(exo).join(" | ")}`));
    }
    const m = /^Quel est le chef-lieu de la région de (.+) \?$/u.exec(exo.prompt);
    if (!m || !REGION_LIST.includes(m[1])) return `question inconnue : ${exo.prompt}`;
    return all(ok(rightOption(exo) === m[1], `le chef-lieu de ${m[1]} porte son nom, l'exercice dit « ${rightOption(exo)} »`), ok(wrongOf(exo).length === 2 && wrongOf(exo).every((option) => option !== m[1] && REGION_LIST.includes(option)), `mauvais choix ${wrongOf(exo).join(" | ")}`));
  },
  "ce2-region-compte": (exo) =>
    all(
      ok(rightOption(exo) === String(REGION_LIST.length), `la bonne option est « ${rightOption(exo)} », il y a ${REGION_LIST.length} régions`),
      ok(wrongOf(exo).length === 2 && wrongOf(exo).every((option) => Number(option) !== REGION_LIST.length), `mauvais choix ${wrongOf(exo).join(" | ")}`),
    ),
  "ce2-region-plus": (exo) => {
    const m = /^Laquelle de ces régions est la plus (au nord|au sud|à l'est|à l'ouest) \?$/u.exec(exo.prompt);
    if (!m) return `question inconnue : ${exo.prompt}`;
    const options = optionsOf(exo);
    if (!options.every((name) => name in COORD)) return `région inconnue : ${options.join(" | ")}`;
    const value = m[1] === "au nord" || m[1] === "au sud" ? lat : lon;
    const sign = m[1] === "au nord" || m[1] === "à l'est" ? 1 : -1;
    const sorted = [...options].sort((x, y) => sign * (value(y) - value(x)));
    const gap = m[1] === "au nord" || m[1] === "au sud" ? 0.9 : 1.2;
    return all(ok(options.length === 3, "trois régions"), ok(rightOption(exo) === sorted[0], `la plus ${m[1]} est « ${sorted[0]} », l'exercice dit « ${rightOption(exo)} »`), ok(Math.abs(value(sorted[0]) - value(sorted[1])) >= gap - 1e-9, "deux régions trop proches"));
  },
  "ce2-region-ordre": (exo) => {
    const sequence = sequenceOf(exo);
    if (!sequence.every((name) => name in COORD)) return `région inconnue : ${sequence.join(" ")}`;
    const sorted = (value: (name: string) => number, sign: number) => [...sequence].sort((x, y) => sign * (value(y) - value(x)));
    const gaps = (value: (name: string) => number, min: number) => sequence.every((name, i) => i === 0 || Math.abs(value(name) - value(sequence[i - 1])) >= min - 1e-9);
    const length = ok(sequence.length === (levelOf(exo) >= 3 ? 4 : 3), `${sequence.length} régions au niveau ${levelOf(exo)}`);
    if (exo.prompt === "Range ces régions du nord au sud.") return all(length, ok(sameSeq(sequence, sorted(lat, 1)), `suite ${sequence.join(" ")} du nord au sud`), ok(gaps(lat, 0.5), "régions trop proches"));
    if (exo.prompt === "Range ces régions du sud au nord.") return all(length, ok(sameSeq(sequence, sorted(lat, -1)), `suite ${sequence.join(" ")} du sud au nord`), ok(gaps(lat, 0.5), "régions trop proches"));
    if (exo.prompt === "Range ces régions de gauche à droite sur la carte du Sénégal.") return all(length, ok(sameSeq(sequence, sorted(lon, -1)), `suite ${sequence.join(" ")} de gauche à droite`), ok(gaps(lon, 0.7), "régions trop proches"));
    return `énoncé inconnu : ${exo.prompt}`;
  },
  "ce2-region-glisser": (exo) => {
    const zones = zonesOf(exo);
    const rule: Record<string, (name: string) => boolean> = {
      Nord: (name) => lat(name) >= 15.5,
      Sud: (name) => lat(name) <= 13.0,
      Ouest: (name) => lon(name) <= -16.4,
      Est: (name) => lon(name) >= -13.7,
    };
    if (!sameSeq(zones, ["Nord", "Sud"]) && !sameSeq(zones, ["Ouest", "Est"])) return `cases ${zones.join(" | ")}`;
    for (const item of itemsOf(exo)) {
      if (!(item.text in COORD)) return `région inconnue : ${item.text}`;
      if (!rule[item.correctZone](item.text)) return `« ${item.text} » est rangé dans « ${item.correctZone} », ses coordonnées disent le contraire`;
    }
    return ok(itemsOf(exo).length === 4, "quatre régions");
  },
  "ce2-region-relier": (exo) => {
    for (const pair of pairsOf(exo)) if (REGION_FACT_T[pair.left] !== pair.right) return `« ${pair.left} » est relié à « ${pair.right} », la table dit « ${REGION_FACT_T[pair.left]} »`;
    return null;
  },
  "ce2-region-trou": checkGap(REGION_GAP_T),
  "ce2-region-ecrire": checkWrite(REGION_WRITE_T),
  // ----- Les activités des hommes -----
  "ce2-activite-qcm": checkQuestion(ACTIVITY_T),
  "ce2-produit-qcm": checkQuestion(PRODUCT_T),
  "ce2-lieu-relier": (exo) => {
    for (const pair of pairsOf(exo)) if (PLACE_ACTIVITY_T[pair.left] !== pair.right) return `« ${pair.left} » est relié à « ${pair.right} », la table dit « ${PLACE_ACTIVITY_T[pair.left]} »`;
    return ok(same(pairsOf(exo).map((pair) => pair.right), ["Pêche", "Tourisme", "Légumes"]), "une pêche, un tourisme, des légumes");
  },
  "ce2-activite-glisser": (exo) => {
    const zones = zonesOf(exo);
    if (!sameSeq(zones, ["Agriculture", "Élevage"]) && !sameSeq(zones, ["Pêche", "Tourisme"])) return `cases ${zones.join(" | ")}`;
    for (const item of itemsOf(exo)) if (ACTIVITY_WORD_T[item.text] !== item.correctZone) return `« ${item.text} » est rangé dans « ${item.correctZone} », la table dit « ${ACTIVITY_WORD_T[item.text]} »`;
    return ok(itemsOf(exo).length === 4, "quatre mots");
  },
  "ce2-activite-trou": checkGap(ACTIVITY_GAP_T),
  "ce2-etapes-ordre": (exo) => {
    const steps = exo.prompt === "Mets ces étapes de la pêche dans l'ordre du temps." ? FISHING_STEPS_T : exo.prompt === "Mets ces étapes de la culture du mil dans l'ordre du temps." ? FARMING_STEPS_T : null;
    if (!steps) return `énoncé inconnu : ${exo.prompt}`;
    const indexes = sequenceOf(exo).map((step) => steps.indexOf(step));
    return all(ok(indexes.every((index) => index >= 0), `étape inconnue : ${sequenceOf(exo).join(" | ")}`), ok(indexes.every((index, i) => i === 0 || index > indexes[i - 1]), `étapes dans le désordre : ${indexes.join(" ")}`), ok(indexes.length === 4, "quatre étapes"));
  },
  "ce2-activite-ecrire": checkWrite(ACTIVITY_WRITE_T),
  // ----- L'habitat et les déplacements -----
  "ce2-habitat-glisser": checkSort(HABITAT_ZONE_T, [["Village", "Ville"]]),
  "ce2-habitat-qcm": checkQuestion(HABITAT_T),
  "ce2-voie-relier": (exo) => {
    const waysLeft = exo.prompt === "Relie chaque voie de communication au moyen qui l'utilise.";
    if (!waysLeft && exo.prompt !== "Relie chaque moyen de transport à la voie qu'il utilise.") return `énoncé inconnu : ${exo.prompt}`;
    for (const pair of pairsOf(exo)) {
      const way = waysLeft ? pair.left : pair.right;
      const means = waysLeft ? pair.right : pair.left;
      if (WAY_T[way] !== means) return `« ${pair.left} » est relié à « ${pair.right} », la table dit « ${WAY_T[way]} » pour « ${way} »`;
    }
    return null;
  },
  "ce2-moyen-glisser": (exo) => {
    const zones = zonesOf(exo);
    if (!sameSeq(zones, ["Terre", "Eau"]) && !sameSeq(zones, ["Terre", "Air"])) return `cases ${zones.join(" | ")}`;
    for (const item of itemsOf(exo)) if (MEANS_ZONE_T[item.text] !== item.correctZone) return `« ${item.text} » est rangé dans « ${item.correctZone} », la table dit « ${MEANS_ZONE_T[item.text]} »`;
    return ok(itemsOf(exo).length === 4, "quatre moyens");
  },
  "ce2-exode-qcm": checkQuestion(MIGRATION_T),
  "ce2-materiau-trou": checkGap(MATERIAL_T),
  "ce2-vitesse-ordre": (exo) => {
    const slow = exo.prompt === "Mets ces moyens de transport du plus lent au plus rapide.";
    if (!slow && exo.prompt !== "Mets ces moyens de transport du plus rapide au plus lent.") return `énoncé inconnu : ${exo.prompt}`;
    const speeds = sequenceOf(exo).map((means) => SPEED_T[means]);
    return all(ok(speeds.every((speed) => speed !== undefined), `moyen inconnu : ${sequenceOf(exo).join(" | ")}`), ok(speeds.every((speed, i) => i === 0 || (slow ? speed > speeds[i - 1] : speed < speeds[i - 1])), `vitesses ${speeds.join(" ")}`), ok(speeds.length === 3, "trois moyens"));
  },
  "ce2-moyen-ecrire": checkWrite(MEANS_WRITE_T),
};

const KINDS = Object.keys(CHECKS) as GameKind[];
const TOPIC_KINDS: Record<string, string[]> = {
  "hi-ce2-progres": ["ce2-progres-compare", "ce2-progres-rang", "ce2-progres-ordre", "ce2-progres-glisser", "ce2-progres-relier", "ce2-progres-trou", "ce2-progres-ecrire"],
  "hi-ce2-royaumes-1": ["ce2-fondateur", "ce2-wolof-trou", "ce2-wolof-compte", "ce2-peuple-glisser", "ce2-royaume-peuple", "ce2-wolof-place", "ce2-wolof-nord-sud", "ce2-place-relier"],
  "hi-ce2-royaumes-2": ["ce2-vallee", "ce2-serere-trou", "ce2-royaume-place", "ce2-royaume-glisser", "ce2-royaume-ordre", "ce2-role-qcm", "ce2-role-trou", "ce2-role-relier", "ce2-royaume-nord-sud"],
  "hi-ce2-rois": ["ce2-titre-qcm", "ce2-titre-trou", "ce2-titre-relier", "ce2-titre-glisser", "ce2-titre-ecrire", "ce2-titre-ordre"],
  "ge-ce2-carte": ["ce2-orientation", "ce2-carte-direction", "ce2-carte-voisin", "ce2-carte-legende", "ce2-echelle", "ce2-carte-trou", "ce2-plan-carte-glisser", "ce2-boussole-ordre"],
  "ge-ce2-regions": ["ce2-chef-lieu", "ce2-region-compte", "ce2-region-plus", "ce2-region-ordre", "ce2-region-glisser", "ce2-region-relier", "ce2-region-trou", "ce2-region-ecrire"],
  "ge-ce2-activites": ["ce2-activite-qcm", "ce2-produit-qcm", "ce2-lieu-relier", "ce2-activite-glisser", "ce2-activite-trou", "ce2-etapes-ordre", "ce2-activite-ecrire"],
  "ge-ce2-habitat": ["ce2-habitat-glisser", "ce2-habitat-qcm", "ce2-voie-relier", "ce2-moyen-glisser", "ce2-exode-qcm", "ce2-materiau-trou", "ce2-vitesse-ordre", "ce2-moyen-ecrire"],
};
const TOPIC_KEYS = Object.keys(TOPIC_KINDS);
const topicOfKind = (kind: string) => TOPIC_KEYS.find((key) => TOPIC_KINDS[key].includes(kind)) as string;
const entryOf = (key: string) => allProgrammeEntries().find((entry) => entry.topic.key === key)!;
const subjectOfKind = (kind: string) => entryOf(topicOfKind(kind)).subject.name;

describe("chaque gabarit de l'histoire et de la géographie du CE2 a sa vérification", () => {
  it("couvre exactement les soixante et un gabarits, tous rangés dans une thématique", () => {
    expect(KINDS).toHaveLength(61);
    expect(Object.values(TOPIC_KINDS).flat().sort()).toEqual([...KINDS].sort());
    for (const kind of KINDS) expect(Object.keys(GAME_KINDS), kind).toContain(kind);
    // Aucun gabarit du CE2 de ce lot ne manque à la liste : tout ce que les thématiques d'histoire et de géographie du CE2 demandent est vérifié ici.
    // Les autres matières du CE2 (les mathématiques, les sciences…) ont chacune leur fichier de test.
    const lot = new Set(allProgrammeEntries().filter((entry) => /^(hi|ge)-ce2-/.test(entry.topic.key)).flatMap((entry) => (entry.topic.games ?? []).map((spec) => spec.kind as string)));
    expect(Object.keys(GAME_KINDS).filter((kind) => kind.startsWith("ce2-") && lot.has(kind)).sort()).toEqual([...KINDS].sort());
  });
});

describe("les gabarits de l'histoire et de la géographie du CE2 recalculent juste, depuis une table écrite à part", () => {
  for (const kind of KINDS) {
    it(`${kind} : la bonne réponse se lit dans la table, à tous les niveaux`, () => {
      for (const d of draws) {
        const exo = make(kind, d) as unknown as Exo;
        expect(CHECKS[kind](exo), `${kind} niveau ${d.level} : ${exo.prompt}`).toBeNull();
      }
    });
  }
});

describe("les tables elles-mêmes sont saines", () => {
  it("donnent un titre à huit royaumes, sept titres différents, le Bour étant celui du Sine et du Saloum", () => {
    const titled = KN.filter((name) => KINGDOM_FACTS[name].title);
    expect(titled).toHaveLength(8);
    expect(new Set(titled.map((name) => KINGDOM_FACTS[name].title)).size).toBe(7);
    expect(holdersOf("Bour")).toEqual(["Sine", "Saloum"]);
    expect(TITLES_T.every((title) => holdersOf(title).length >= 1)).toBe(true);
  });

  it("ne placent sur la carte que les royaumes dont la place ne se discute pas", () => {
    expect(KN.filter((name) => !KINGDOM_FACTS[name].place)).toEqual(["Djolof", "Cayor"]);
  });

  it("donnent aux quatorze chefs-lieux des coordonnées d'un pays qui va de 12 à 17 degrés nord et de 11 à 18 degrés ouest", () => {
    expect(REGION_LIST).toHaveLength(14);
    for (const name of REGION_LIST) {
      expect(lat(name), name).toBeGreaterThan(12);
      expect(lat(name), name).toBeLessThan(17);
      expect(lon(name), name).toBeGreaterThan(-18);
      expect(lon(name), name).toBeLessThan(-11);
    }
    // Dakar est la région la plus à l'ouest, Kédougou la plus au sud.
    expect(REGION_LIST.reduce((best, name) => (lon(name) < lon(best) ? name : best))).toBe("Dakar");
    expect(REGION_LIST.reduce((best, name) => (lat(name) < lat(best) ? name : best))).toBe("Kédougou");
  });

  it("rangent chaque besoin du plus ancien au plus récent, avec des rangs qui se suivent", () => {
    for (const need of Object.keys(NEED_ZONE_T)) {
      const ranks = Object.values(TILE_T).filter((entry) => entry[0] === need).map((entry) => entry[1]).sort();
      expect(ranks, need).toEqual(Array.from({ length: ranks.length }, (_, i) => i));
      expect(ranks.length - 1, need).toBe(LAST_RANK_T[need]);
    }
    expect(Object.keys(TILE_T)).toHaveLength(Object.keys(CHOICE_T).length);
  });

  it("font tourner la boussole : un quart de tour à droite puis à gauche revient au départ", () => {
    expect(compassName(turnRight(COMPASS_VECTOR.Nord))).toBe("Est");
    expect(compassName(turnRight(COMPASS_VECTOR.Est))).toBe("Sud");
    expect(compassName(turnLeft(COMPASS_VECTOR.Nord))).toBe("Ouest");
    for (const name of Object.keys(COMPASS_VECTOR)) expect(compassName(turnLeft(turnRight(COMPASS_VECTOR[name])))).toBe(name);
  });

  it("donnent six lieux de carte aux carrés tous différents", () => {
    expect(new Set(Object.keys(SQUARE_T)).size).toBe(6);
    expect(new Set(Object.values(SQUARE_T)).size).toBe(6);
  });
});

// ===========================================================================
// LES MUTATIONS : une vérification qui ne voit pas une réponse abîmée ne prouve rien
// ===========================================================================

/** Abîme la bonne réponse d'un exercice juste, sans toucher à l'énoncé ni aux tuiles. `null` si rien ne peut être abîmé. */
function mutate(kind: GameKind, exo: Exo): Exo | null {
  const payload = JSON.parse(JSON.stringify(exo.payload)) as Record<string, unknown>;
  const copy = (): Exo => ({ ...exo, payload });
  switch (GAME_KINDS[kind].type) {
    case "qcm": {
      const options = payload.options as string[];
      payload.correctIndex = ((payload.correctIndex as number) + 1) % options.length;
      return copy();
    }
    case "fill-blank": {
      const blank = (payload.blanks as { options: string[]; answer: string }[])[0];
      const other = blank.options.find((option) => option !== blank.answer);
      if (!other) return null;
      blank.answer = other;
      return copy();
    }
    case "order": {
      const sequence = payload.correctSequence as string[];
      [sequence[0], sequence[sequence.length - 1]] = [sequence[sequence.length - 1], sequence[0]];
      return copy();
    }
    case "match": {
      const pairs = payload.pairs as { left: string; right: string }[];
      [pairs[0].right, pairs[1].right] = [pairs[1].right, pairs[0].right];
      return copy();
    }
    case "drag-drop": {
      const items = payload.items as { text: string; correctZone: string }[];
      const zones = payload.zones as string[];
      items[0].correctZone = zones.find((zone) => zone !== items[0].correctZone) as string;
      return copy();
    }
    case "short-answer": {
      const first = (payload.acceptedAnswers as string[])[0];
      payload.acceptedAnswers = [Number.isNaN(Number(first)) ? `${first}x` : String(Number(first) + 5)];
      return copy();
    }
    default:
      return null;
  }
}

describe("les vérifications voient une bonne réponse abîmée", () => {
  for (const kind of KINDS) {
    it(`${kind} : abîmer la réponse fait échouer la vérification`, () => {
      let mutated = 0;
      for (const d of draws.filter((_, i) => i % 4 === 0)) {
        const exo = make(kind, d) as unknown as Exo;
        const broken = mutate(kind, exo);
        if (!broken) continue;
        mutated += 1;
        expect(CHECKS[kind](broken), `${kind} niveau ${d.level} : ${exo.prompt}`).not.toBeNull();
      }
      expect(mutated, kind).toBeGreaterThan(0);
    });
  }

  const draw = (kind: string, level: GameLevel, seed: string) => make(kind as GameKind, { level, seed }) as unknown as Exo;

  it("voient aussi un énoncé abîmé : une échelle changée, une carte retournée, un royaume échangé, une relation inversée", () => {
    // L'échelle : un centimètre qui montre un kilomètre de plus.
    const scale = draw("ce2-echelle", 3, "mut-echelle");
    const changed = { ...scale, prompt: scale.prompt.replace(/1 cm montre (\d+) km/u, (_, n) => `1 cm montre ${Number(n) + 1} km`) };
    expect(CHECKS["ce2-echelle"](changed)).not.toBeNull();

    // La carte retournée de gauche à droite : l'est devient l'ouest quand les deux lieux sont sur une même ligne.
    let flipped = 0;
    for (const seed of Array.from({ length: 40 }, (_, i) => `mut-carte:${i}`)) {
      const exo = draw("ce2-carte-direction", 2, seed);
      const lines = exo.prompt.split("\n");
      const mirrored = [lines[0], ...lines.slice(1, -1).map((line) => Array.from(line).reverse().join("")), lines[lines.length - 1]].join("\n");
      // L'est ou l'ouest : les deux lieux sont sur une même ligne, que le miroir retourne.
      if (!/^À l'(?:est|ouest)$/u.test(rightOption(exo))) continue;
      flipped += 1;
      expect(CHECKS["ce2-carte-direction"]({ ...exo, prompt: mirrored }), exo.prompt).not.toBeNull();
    }
    expect(flipped).toBeGreaterThan(0);

    // Un royaume échangé contre un autre dans la phrase des titres : le titre ne va plus avec son royaume.
    const order = draw("ce2-titre-ordre", 2, "mut-titre");
    const swapped = { ...order, prompt: order.prompt.replace(/ au (\p{L}+)(.*?) au (\p{L}+)/u, " au $3$2 au $1") };
    expect(swapped.prompt).not.toBe(order.prompt);
    expect(CHECKS["ce2-titre-ordre"](swapped)).not.toBeNull();

    // « plus récent » devenu « plus ancien » : la bonne option n'est plus la bonne.
    const compare = draw("ce2-progres-compare", 2, "mut-compare");
    const inverted = { ...compare, prompt: compare.prompt.includes("plus récent") ? compare.prompt.replace("plus récent", "plus ancien") : compare.prompt.replace("plus ancien", "plus récent") };
    expect(CHECKS["ce2-progres-compare"](inverted)).not.toBeNull();

    // « du nord au sud » devenu « du sud au nord » : la suite est à l'envers.
    const order2 = draw("ce2-royaume-ordre", 2, "mut-ordre");
    const reversed = { ...order2, prompt: order2.prompt.includes("du nord au sud") ? order2.prompt.replace("du nord au sud", "du sud au nord") : order2.prompt.replace("du sud au nord", "du nord au sud") };
    expect(CHECKS["ce2-royaume-ordre"](reversed)).not.toBeNull();

    // Une région déplacée au nord de la liste : la région « la plus au nord » change.
    const most = draw("ce2-region-plus", 2, "mut-plus");
    const turned = { ...most, prompt: most.prompt.replace(/la plus (?:au nord|au sud)/u, (found) => (found.endsWith("nord") ? "la plus au sud" : "la plus au nord")) };
    if (turned.prompt !== most.prompt) expect(CHECKS["ce2-region-plus"](turned)).not.toBeNull();
  });
});

// ===========================================================================
// LES RÈGLES COMMUNES
// ===========================================================================

describe("tous les gabarits de l'histoire et de la géographie du CE2", () => {
  const exos = KINDS.flatMap((kind) => draws.filter((_, i) => i % 3 === 0).map((d) => ({ kind, exo: make(kind, d) as unknown as Exo })));
  const MAP_KINDS = ["ce2-carte-direction", "ce2-carte-voisin", "ce2-carte-legende"];

  const texts = (exo: Exo): string[] => {
    const out = [...exo.hints];
    if (exo.payload.options) out.push(...optionsOf(exo));
    if (exo.payload.blanks) out.push(textOf(exo), ...blankOf(exo).options);
    if (exo.payload.correctSequence) out.push(...sequenceOf(exo));
    if (exo.payload.pairs) out.push(...pairsOf(exo).flatMap((pair) => [pair.left, pair.right]));
    if (exo.payload.items) out.push(...itemsOf(exo).map((item) => item.text), ...zonesOf(exo));
    return out;
  };

  it("ont un énoncé que l'écran sait couper : pas de deux-points, une apostrophe au plus, vingt-huit mots au plus", () => {
    for (const { kind, exo } of exos) {
      expect(exo.prompt, kind).not.toMatch(/:/);
      expect(apostrophes(exo.prompt), `${kind} : ${exo.prompt}`).toBeLessThanOrEqual(1);
      expect(wordCount(exo.prompt), `${kind} : ${exo.prompt}`).toBeLessThanOrEqual(28);
    }
  });

  it("n'écrivent un émoji que dans la carte d'un énoncé, jamais sur une tuile ni dans un indice", () => {
    for (const { kind, exo } of exos) {
      if (!MAP_KINDS.includes(kind)) expect(/\p{Extended_Pictographic}/u.test(exo.prompt), `${kind} : ${exo.prompt}`).toBe(false);
      expect(exo.prompt.includes(VS16), `${kind} : ${exo.prompt}`).toBe(false);
      for (const text of texts(exo)) {
        expect(/\p{Extended_Pictographic}/u.test(text), `${kind} : « ${text} »`).toBe(false);
        expect(text.includes(VS16), `${kind} : « ${text} »`).toBe(false);
      }
    }
  });

  it("proposent des choix tous différents, dont un seul est la bonne réponse", () => {
    for (const { kind, exo } of exos) {
      if (exo.payload.options) {
        const options = optionsOf(exo);
        expect(new Set(options).size, `${kind} : ${exo.prompt}`).toBe(options.length);
        expect(options.length, `${kind} : ${exo.prompt}`).toBe(3);
      }
      if (exo.payload.blanks) {
        const { options, answer } = blankOf(exo);
        expect(new Set(options).size, `${kind} : ${textOf(exo)}`).toBe(options.length);
        expect(options.filter((option) => option === answer), `${kind} : ${textOf(exo)}`).toHaveLength(1);
        expect(options.length, `${kind} : ${textOf(exo)}`).toBe(3);
      }
      if (exo.payload.items) {
        const items = itemsOf(exo);
        expect(new Set(items.map((item) => item.text)).size, `${kind} : ${exo.prompt}`).toBe(items.length);
        for (const zone of zonesOf(exo)) expect(items.some((item) => item.correctZone === zone), `${kind} : ${zone}`).toBe(true);
      }
      if (exo.payload.pairs) {
        const pairs = pairsOf(exo);
        expect(new Set(pairs.map((pair) => pair.left)).size, `${kind} : ${exo.prompt}`).toBe(pairs.length);
        expect(new Set(pairs.map((pair) => pair.right)).size, `${kind} : ${exo.prompt}`).toBe(pairs.length);
        expect(pairs.length, kind).toBe(3);
      }
      if (exo.payload.correctSequence) {
        const sequence = sequenceOf(exo);
        expect(new Set(sequence).size, `${kind} : ${sequence.join(" ")}`).toBe(sequence.length);
        expect(sequence.length, kind).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it("n'écrivent dans aucun indice un chiffre, ni un mot de quatre lettres ou plus de la bonne réponse ou d'une étiquette à placer", () => {
    for (const { kind, exo } of exos) {
      const answers: string[] = [];
      if (exo.payload.options) answers.push(rightOption(exo));
      if (exo.payload.blanks) answers.push(blankOf(exo).answer);
      if (exo.payload.correctSequence) answers.push(...sequenceOf(exo));
      if (exo.payload.pairs) answers.push(...pairsOf(exo).flatMap((pair) => [pair.left, pair.right]));
      if (exo.payload.items) answers.push(...itemsOf(exo).map((item) => item.text), ...zonesOf(exo));
      if (exo.payload.acceptedAnswers) answers.push(...acceptedOf(exo));
      const words = new Set(
        answers.flatMap((answer) =>
          fold(answer)
            .split(/[^a-z]+/)
            .filter((word) => word.length >= 4),
        ),
      );
      for (const hint of exo.hints) {
        expect(hint, `${kind} : « ${hint} » écrit un chiffre`).not.toMatch(/\d/);
        const hintWords = fold(hint).split(/[^a-z]+/);
        for (const word of words) expect(hintWords, `${kind} : « ${hint} » écrit « ${word} »`).not.toContain(word);
      }
    }
  });

  it("donnent trois indices différents, et se refont à l'identique avec la même graine", () => {
    for (const kind of KINDS) {
      const a = GAME_KINDS[kind].make(makeContext("CE2", 2, "graine"));
      const b = GAME_KINDS[kind].make(makeContext("CE2", 2, "graine"));
      expect(a).toEqual(b);
      expect(a.hints).toHaveLength(3);
      expect(new Set(a.hints).size, kind).toBe(3);
    }
  });

  it("passent le contrôleur au CE2 sans aucun défaut, à tous les niveaux", () => {
    for (const { kind, exo } of exos) {
      const defects = auditExercise({
        type: GAME_KINDS[kind].type,
        prompt: exo.prompt,
        payload: exo.payload,
        answerKey: exo.answerKey,
        hints: exo.hints,
        class: "CE2",
        subject: subjectOfKind(kind),
      });
      expect(defects, `${kind} : ${exo.prompt}`).toEqual([]);
    }
  });

  it("portent leur gabarit et leur niveau dans le payload, pour que le code refasse un exercice raté", () => {
    for (const { kind, exo } of exos) {
      const origin = exo.payload.game as { kind: string; level: number };
      expect(origin.kind, kind).toBe(kind);
      expect([1, 2, 3, 4], kind).toContain(origin.level);
    }
  });

  it("écrivent la bonne réponse d'un QCM ou d'un trou parmi les choix, et aucune réponse à écrire n'est vide", () => {
    for (const { kind, exo } of exos) {
      if (exo.payload.options) expect(optionsOf(exo), kind).toContain(exo.answerKey);
      if (exo.payload.blanks) expect(blankOf(exo).options, kind).toContain(blankOf(exo).answer);
      if (exo.payload.acceptedAnswers) {
        expect(acceptedOf(exo).length, kind).toBeGreaterThan(0);
        for (const answer of acceptedOf(exo)) expect(answer.trim(), kind).not.toBe("");
      }
    }
  });
});

// ===========================================================================
// LES THÉMATIQUES DU PROGRAMME
// ===========================================================================

describe("les huit thématiques d'histoire et de géographie du CE2", () => {
  const topicOf = (key: string) => entryOf(key).topic;

  it("remplissent les dix places du palier, avec des jeux connus, sans appeler le modèle", () => {
    for (const key of TOPIC_KEYS) {
      const specs = topicOf(key).games ?? [];
      expect(specs.reduce((sum, spec) => sum + spec.count, 0), key).toBe(PALIER_SIZE);
      expect(sameSeq(specs.map((spec) => spec.kind as string).sort(), [...TOPIC_KINDS[key]].sort()), `${key} : ${specs.map((spec) => spec.kind).join(" ")}`).toBe(true);
      for (const spec of specs) {
        expect(Object.keys(GAME_KINDS), `${key} : ${spec.kind}`).toContain(spec.kind);
        expect(spec.vocabulary, `${key} : ${spec.kind}`).toBeUndefined();
      }
      expect(topicUsesModel(key), key).toBe(false);
    }
  });

  it("sont celles du CE2, et n'ont changé ni leur clé ni leur nombre de paliers", () => {
    for (const key of TOPIC_KEYS) {
      expect(entryOf(key).klass, key).toBe("CE2");
      expect(topicOf(key).palierCount, key).toBeUndefined();
    }
    expect(TOPIC_KEYS).toHaveLength(8);
    expect(TOPIC_KEYS.slice().sort()).toEqual(["ge-ce2-activites", "ge-ce2-carte", "ge-ce2-habitat", "ge-ce2-regions", "hi-ce2-progres", "hi-ce2-rois", "hi-ce2-royaumes-1", "hi-ce2-royaumes-2"]);
  });

  it("sont parmi les thématiques du CE2 que le modèle n'écrit plus", () => {
    const allCode = allProgrammeEntries()
      .filter((entry) => entry.klass === "CE2" && (entry.topic.games ?? []).reduce((sum, spec) => sum + spec.count, 0) >= PALIER_SIZE)
      .map((entry) => entry.topic.key);
    for (const key of TOPIC_KEYS) expect(allCode, key).toContain(key);
  });

  it("fabriquent des paliers entiers, de dix exercices tous différents, qui passent le contrôleur et la table", () => {
    for (const key of TOPIC_KEYS) {
      for (let n = 0; n < 30; n++) {
        for (const palierIndex of [1, 2, 3, 4]) {
          const games = generateGames(topicOf(key).games ?? [], { klass: "CE2", palierIndex, palierCount: 4, seed: `${key}:${n}:${palierIndex}` });
          expect(games, `${key} palier ${palierIndex}`).toHaveLength(PALIER_SIZE);
          const questions = games.map((game) => `${game.prompt}|${String(game.payload.text ?? "")}|${game.answerKey}`);
          expect(new Set(questions).size, `${key} #${n} palier ${palierIndex}`).toBe(questions.length);
          for (const game of games) {
            const defects = auditExercise({
              type: game.type,
              prompt: game.prompt,
              payload: game.payload,
              answerKey: game.answerKey,
              hints: game.hints,
              class: "CE2",
              subject: entryOf(key).subject.name,
            });
            expect(defects, `${key} palier ${palierIndex} : ${game.prompt}`).toEqual([]);
            const kind = (game.payload.game as { kind: string }).kind;
            expect(CHECKS[kind](game as unknown as Exo), `${key} palier ${palierIndex} ${kind} : ${game.prompt}`).toBeNull();
          }
        }
      }
    }
  });

  it("varient les types d'un palier : au moins quatre sortes d'exercices sur dix", () => {
    for (const key of TOPIC_KEYS) {
      for (const palierIndex of [1, 2, 3, 4]) {
        const games = generateGames(topicOf(key).games ?? [], { klass: "CE2", palierIndex, palierCount: 4, seed: key });
        expect(new Set(games.map((game) => game.type)).size, `${key} palier ${palierIndex}`).toBeGreaterThanOrEqual(4);
      }
    }
  });

  it("gardent de quoi servir la démo du site : un gabarit pour chaque type que sa banque d'exercices attend", () => {
    // La banque de la vitrine (`components/landing/__tests__/demo-bank.test.ts`) veut, sur une thématique tout en gabarits, un gabarit du type de chaque
    // exercice de sa banque : ce test garde au moins le QCM, la phrase à trous, le glissé et l'ordre ou l'appariement dans chaque thématique.
    const typesOf = (key: string) => new Set((topicOf(key).games ?? []).map((spec) => GAME_KINDS[spec.kind].type));
    for (const key of TOPIC_KEYS) {
      for (const type of ["qcm", "fill-blank", "drag-drop"]) expect(typesOf(key).has(type as never), `${key} : ${type}`).toBe(true);
      expect(typesOf(key).has("order" as never) || typesOf(key).has("match" as never), `${key} : ordre ou appariement`).toBe(true);
    }
  });

  it("refont chaque exercice raté par le code, sans le modèle", () => {
    for (const key of TOPIC_KEYS) {
      for (const spec of topicOf(key).games ?? []) {
        const origin = { kind: spec.kind, level: 3 };
        const again = regenerateGame(origin, "CE2", `reprise:${key}:${spec.kind}`);
        expect(again, spec.kind).not.toBeNull();
        expect(again!.type, spec.kind).toBe(GAME_KINDS[spec.kind].type);
      }
    }
  });
});
