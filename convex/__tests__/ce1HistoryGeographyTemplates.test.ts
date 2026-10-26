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
 * L'HISTOIRE ET LA GÉOGRAPHIE DU CE1 : le temps qui passe, l'histoire de la famille, de l'école et du quartier ; les points
 * cardinaux, les saisons, le relief et les cours d'eau, le plan.
 *
 * Chaque test RECALCULE la bonne réponse depuis l'énoncé et les tuiles, avec ses propres tables écrites à part : des années lues
 * dans l'énoncé et rangées par ce test, des quarts de tour calculés avec des vecteurs (le gabarit compte des positions sur une
 * boussole), des liens de famille, les mois de chaque saison, les carrés d'un plan lus un à un. Un gabarit dont la réponse contredit
 * sa table échoue. À la fin, des MUTATIONS : on abîme la bonne réponse d'un exercice juste, et chaque vérification doit le voir.
 * L'échantillon du modèle comptait 18 exercices faux sur 48 en histoire et en géographie du CE1 (« Quel est le nom de ton
 * quartier ? », « Bakel - Gambie », un « centre » entre le nord et le sud, un ordre « d'importance »).
 */

const LEVELS: GameLevel[] = [1, 2, 3, 4];
const draws = LEVELS.flatMap((level) => Array.from({ length: 60 }, (_, n) => ({ level, seed: `ce1hg:${level}:${n}` })));
const make = (kind: GameKind, d: (typeof draws)[number]) => GAME_KINDS[kind].make(makeContext("CE1", d.level, `${kind}:${d.seed}`));

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

const fold = (text: string) => text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
const cap = (text: string) => `${text[0].toUpperCase()}${text.slice(1)}`;
const apostrophes = (text: string) => (text.match(/'/g) ?? []).length;
const wordCount = (text: string) => text.split(/\s+/).filter((token) => /[\p{L}\p{N}]/u.test(token)).length;
const same = (a: readonly string[], b: readonly string[]) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());
const sameSeq = (a: readonly string[], b: readonly string[]) => JSON.stringify(a) === JSON.stringify(b);

type Check = (exo: Exo) => string | null;
const ok = (condition: boolean, message: string) => (condition ? null : message);
/** Le premier message d'erreur d'une suite de vérifications. */
const all = (...results: (string | null)[]) => results.find((result) => result !== null) ?? null;
/** Les choix d'un QCM sans la bonne réponse. */
const wrongOf = (exo: Exo) => optionsOf(exo).filter((option) => option !== rightOption(exo));
/** Une ligne de table [clé, réponse, ...] retrouvée par sa clé. */
const lookup = <T extends readonly string[]>(table: readonly T[], key: string): T | undefined => table.find((row) => row[0] === key);
/** Un trou : la phrase doit être dans la table, la réponse et les choix aussi. */
const checkGap = (table: readonly (readonly [string, string, string[]])[]): Check => (exo) => {
  const row = table.find((entry) => entry[0] === textOf(exo));
  if (!row) return `phrase inconnue : ${textOf(exo)}`;
  return all(ok(blankOf(exo).answer === row[1], `la phrase veut « ${row[1]} », le trou dit « ${blankOf(exo).answer} »`), ok(same(blankOf(exo).options, [row[1], ...row[2]]), `les choix : ${blankOf(exo).options.join(" | ")}`));
};
/** Une question à choix : la question doit être dans la table, la bonne option aussi. */
const checkQuestion = (table: readonly (readonly [string, string])[], wrongCount = 2): Check => (exo) => {
  const row = lookup(table, exo.prompt);
  if (!row) return `question inconnue : ${exo.prompt}`;
  return all(ok(rightOption(exo) === row[1], `la bonne option est « ${rightOption(exo)} », la table dit « ${row[1]} »`), ok(wrongOf(exo).length === wrongCount && !wrongOf(exo).includes(row[1]), `mauvais choix ${wrongOf(exo).join(" | ")}`));
};
/** Un appariement : chaque gauche doit avoir, dans la table, la droite qu'on lui a donnée. */
const checkLinks = (table: Record<string, string>): Check => (exo) => {
  for (const pair of pairsOf(exo)) if (table[pair.left] !== pair.right) return `« ${pair.left} » est relié à « ${pair.right} », la table dit « ${table[pair.left]} »`;
  return ok(pairsOf(exo).length === 3, "trois paires");
};

// ---------------------------------------------------------------------------
// Les années : des clauses lues dans l'énoncé
// ---------------------------------------------------------------------------

/** Le nom qui ouvre chaque proposition datée, et l'étiquette que le gabarit en fait. */
const EVENT_TILE: Record<string, string> = {
  marché: "Marché",
  mairie: "Mairie",
  puits: "Puits",
  dispensaire: "Dispensaire",
  pont: "Pont",
  mosquée: "Mosquée",
  fontaine: "Fontaine",
  route: "Route",
  monument: "Monument",
  cantine: "Cantine",
  bibliothèque: "Bibliothèque",
  clôture: "Clôture",
  terrain: "Terrain",
  cour: "Cour",
  "première classe": "Première classe",
  village: "Fondation",
};

/** Les propositions « le puits est creusé en 1950 » d'un énoncé, dans l'ordre où l'énoncé les dit. */
function datedOf(prompt: string): { tile: string; year: number }[] {
  const found: { tile: string; year: number; at: number }[] = [];
  for (const [noun, tile] of Object.entries(EVENT_TILE)) {
    const match = new RegExp(`(?:^|[ ,.])(?:[Ll]e|[Ll]a) ${noun} (?:[^,.]*?)en (\\d{4})`, "u").exec(prompt);
    if (match) found.push({ tile, year: Number(match[1]), at: match.index });
  }
  return found.sort((a, b) => a.at - b.at).map(({ tile, year }) => ({ tile, year }));
}
const YEAR_MIN = 1900;
const YEAR_MAX = 2020;
const yearsOk = (dated: { year: number }[]) => dated.every((entry) => entry.year >= YEAR_MIN && entry.year <= YEAR_MAX) && new Set(dated.map((entry) => entry.year)).size === dated.length;

// ---------------------------------------------------------------------------
// Les tables de vérité, écrites à part des gabarits : HISTOIRE
// ---------------------------------------------------------------------------

// ===== Le temps qui passe =====
const GEN_RANK: Record<string, number> = {
  Enfant: 0,
  Fille: 0,
  Fils: 0,
  "Petit-fils": 0,
  "Petite-fille": 0,
  Père: 1,
  Mère: 1,
  "Grand-père": 2,
  "Grand-mère": 2,
  "Arrière-grand-père": 3,
  "Arrière-grand-mère": 3,
};
const FEMININE_PEOPLE = new Set(["Fille", "Petite-fille", "Mère", "Grand-mère", "Arrière-grand-mère"]);
const MASCULINE_PEOPLE = new Set(["Fils", "Petit-fils", "Père", "Grand-père", "Arrière-grand-père"]);
const FEMININE_FIRST_NAMES = ["Awa", "Fatou", "Aminata", "Khady", "Penda", "Mariama"];
const MASCULINE_FIRST_NAMES = ["Moussa", "Cheikh", "Modou", "Ibrahima", "Ousmane", "Samba"];
const MONTHS_T = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const NUMBER_WORDS: Record<string, number> = { un: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6 };

/** [phrase, bonne réponse, mauvais choix] */
const GEN_GAP_T: [string, string, string[]][] = [
  ["Les parents de mes parents sont mes ___.", "grands-parents", ["oncles", "cousins"]],
  ["Les enfants de mes enfants seront mes ___.", "petits-enfants", ["cousins", "neveux"]],
  ["Mes grands-parents sont plus ___ que mes parents.", "âgés", ["jeunes", "petits"]],
  ["Un enfant est plus ___ que ses parents.", "jeune", ["âgé", "ancien"]],
  ["Mon arrière-grand-mère est la mère de ma ___.", "grand-mère", ["tante", "cousine"]],
  ["Mes parents sont plus ___ que mes grands-parents.", "jeunes", ["âgés", "anciens"]],
];

/** [besoin, chose d'autrefois, chose d'aujourd'hui, phrase d'autrefois, phrase d'aujourd'hui] */
const NEED_T: [string, string, string, string, string][] = [
  ["avoir de la lumière", "Lampe à pétrole", "Lampe électrique", "une lampe à pétrole", "une lampe électrique"],
  ["envoyer des nouvelles de loin", "Lettre", "Téléphone portable", "une lettre", "un téléphone portable"],
  ["voyager sur une longue route", "Charrette", "Voiture", "une charrette", "une voiture"],
  ["faire cuire le riz", "Feu de bois", "Cuisinière à gaz", "un feu de bois", "une cuisinière à gaz"],
  ["avoir de l'eau à la maison", "Puits", "Robinet", "un puits", "un robinet"],
];
const needRow = (need: string) => NEED_T.find((row) => row[0] === need);
/** Ce qui sert AUSSI un autre besoin : un feu de bois éclaire, un téléphone portable aussi. Jamais un mauvais choix pour ce besoin-là. */
const ALSO_SERVES: Record<string, string> = {
  "Feu de bois": "avoir de la lumière",
  "un feu de bois": "avoir de la lumière",
  "Téléphone portable": "avoir de la lumière",
  "un téléphone portable": "avoir de la lumière",
};
const servesToo = (thing: string, need: string) => ALSO_SERVES[thing] === need;
const THEN_TILES = NEED_T.map((row) => row[1]);
const NOW_TILES = NEED_T.map((row) => row[2]);

// ===== L'histoire de ma famille =====
const TERM_LIST = ["Grand-père", "Grand-mère", "Oncle", "Tante", "Cousin", "Cousine"];
const FEMININE_TERM = new Set(["Grand-mère", "Tante", "Cousine"]);
/** [rôle, de qui, nom] */
const LINK_T: [string, string, string][] = [
  ["le père", "mère", "Grand-père"],
  ["la mère", "père", "Grand-mère"],
  ["le père", "père", "Grand-père"],
  ["la mère", "mère", "Grand-mère"],
  ["le frère", "mère", "Oncle"],
  ["le frère", "père", "Oncle"],
  ["la sœur", "mère", "Tante"],
  ["la sœur", "père", "Tante"],
  ["le fils", "oncle", "Cousin"],
  ["la fille", "oncle", "Cousine"],
  ["le fils", "tante", "Cousin"],
  ["la fille", "tante", "Cousine"],
];
const termOfLink = (role: string, of: string) => LINK_T.find((row) => row[0] === role.toLowerCase() && row[1] === of)?.[2];
const POSSESSIVE_OF: Record<string, [string, string]> = { mère: ["ta", "ma"], père: ["ton", "mon"], oncle: ["ton", "mon"], tante: ["ta", "ma"] };
const GENERATION_OF_TERM: Record<string, string> = {
  Frère: "Ma génération",
  Sœur: "Ma génération",
  Cousin: "Ma génération",
  Cousine: "Ma génération",
  Père: "Génération de mes parents",
  Mère: "Génération de mes parents",
  Oncle: "Génération de mes parents",
  Tante: "Génération de mes parents",
  "Grand-père": "Génération de mes grands-parents",
  "Grand-mère": "Génération de mes grands-parents",
};
/** [question, bonne réponse] */
const MEMORY_T: [string, string][] = [
  ["Que montre un arbre généalogique ?", "Les liens entre les membres d'une famille"],
  ["À quoi sert un arbre généalogique ?", "À retrouver qui est lié à qui"],
  ["Que garde une photo de famille ancienne ?", "Le souvenir d'un moment passé"],
  ["Que raconte un grand-parent sur la famille ?", "Ce que la famille a vécu autrefois"],
];
const MEMORY_LINK_T: Record<string, string> = {
  "Arbre généalogique": "Montre qui est lié à qui",
  "Photo ancienne": "Garde l'image d'un moment passé",
  "Récit d'un grand-parent": "Raconte ce que la famille a vécu",
  "Acte de naissance": "Donne la date de naissance d'une personne",
  "Livret de famille": "Liste les parents et les enfants",
};
const RELATIVE_WORDS: Record<string, string> = { oncle: "oncle", oncles: "oncle", tante: "tante", tantes: "tante", cousin: "cousin", cousins: "cousin", cousine: "cousine", cousines: "cousine" };

// ===== L'histoire de mon école =====
const SOURCE_KIND: Record<string, "personne" | "document"> = {
  "Ancien élève": "personne",
  "Ancien instituteur": "personne",
  "Photo ancienne": "document",
  Registre: "document",
  "Vieux cahier": "document",
};
const SOURCE_GIVES: Record<string, string> = {
  "Ancien élève": "Raconte ses souvenirs d'élève",
  "Ancien instituteur": "Raconte comment il faisait la classe",
  "Photo ancienne": "Montre l'école d'autrefois",
  Registre: "Garde les noms des élèves",
  "Vieux cahier": "Montre ce qu'on écrivait en classe",
};
/** [question, bonne réponse] */
const SOURCE_Q_T: [string, string][] = [
  ["Qui peut raconter comment était l'école il y a longtemps ?", "Ancien élève"],
  ["Que regarde-t-on pour voir comment était l'école autrefois ?", "Photo ancienne"],
  ["Où sont écrits les noms des élèves inscrits depuis longtemps ?", "Registre"],
  ["Que lit-on pour voir ce que les élèves écrivaient autrefois ?", "Vieux cahier"],
  ["Qui peut raconter comment on faisait la classe autrefois ?", "Ancien instituteur"],
  ["Qui a sûrement des souvenirs de l'école, il y a longtemps ?", "Ancien élève"],
  ["Que peut-on regarder pour voir comment on s'habillait autrefois ?", "Photo ancienne"],
  ["Que lit-on pour savoir qui était inscrit à l'école autrefois ?", "Registre"],
  ["Que peut-on ouvrir pour voir comment écrivait un élève autrefois ?", "Vieux cahier"],
  ["Qui peut expliquer comment il enseignait il y a longtemps ?", "Ancien instituteur"],
];
/** [phrase, bonne réponse, mauvais choix] */
const SOURCE_GAP_T: [string, string, string[]][] = [
  ["On peut lire les noms des élèves d'autrefois dans un ___.", "registre", ["ballon", "crayon"]],
  ["Pour voir l'école d'autrefois, on regarde une ___ ancienne.", "photo", ["règle", "craie"]],
  ["Un ancien élève nous raconte ses ___.", "souvenirs", ["crayons", "ballons"]],
  ["Un registre garde les ___ des élèves.", "noms", ["prix", "voitures"]],
];

// ===== Mon quartier, mon village, ma commune =====
const WORD_GIVES: Record<string, string> = {
  Maire: "Dirige la commune",
  Fondateur: "A créé le village",
  Mairie: "Là où travaille le maire",
  Monument: "Rappelle un événement du passé",
  Commune: "Plusieurs quartiers ou villages réunis",
};
const PERSON_WORDS = new Set(["Maire", "Fondateur"]);
/** [question, bonne réponse] */
const WORD_Q_T: [string, string][] = [
  ["Comment s'appelle la personne qui dirige la commune ?", "Maire"],
  ["Comment s'appelle la personne qui a créé le village ?", "Fondateur"],
  ["Comment s'appelle le bâtiment où travaille le maire ?", "Mairie"],
  ["Quelle construction rappelle un événement du passé ?", "Monument"],
  ["Comment appelle-t-on l'ensemble des quartiers ou villages dirigés par un maire ?", "Commune"],
  ["Qui est élu pour diriger la commune ?", "Maire"],
  ["Qui a fondé le village il y a très longtemps ?", "Fondateur"],
  ["Dans quel bâtiment le maire reçoit-il les habitants ?", "Mairie"],
  ["Que construit-on pour garder le souvenir d'une personne importante ?", "Monument"],
  ["Quel mot désigne tout le territoire dirigé par le maire ?", "Commune"],
];
const WORD_TILES = ["Maire", "Fondateur", "Mairie", "Monument", "Commune", "Puits", "Quartier"];
const PLACE_WORDS = ["Mairie", "Monument", "Puits", "Marché"];
/** [phrase, bonne réponse, mauvais choix] */
const WORD_GAP_T: [string, string, string[]][] = [
  ["Le ___ dirige la commune.", "maire", ["monument", "puits"]],
  ["Le maire travaille à la ___.", "mairie", ["mosquée", "boutique"]],
  ["Le ___ a créé le village il y a longtemps.", "fondateur", ["maire", "monument"]],
  ["Un ___ garde le souvenir d'un événement du passé.", "monument", ["puits", "marché"]],
  ["La commune est dirigée par le ___.", "maire", ["fondateur", "monument"]],
  ["Le maire est choisi par les ___ de la commune.", "habitants", ["monuments", "puits"]],
  ["On va à la ___ pour voir le maire.", "mairie", ["mosquée", "boutique"]],
  ["Le ___ est une construction qui rappelle le passé.", "monument", ["maire", "fondateur"]],
  ["Le village a été créé par son ___.", "fondateur", ["maire", "monument"]],
];

// ---------------------------------------------------------------------------
// Les tables de vérité : GÉOGRAPHIE
// ---------------------------------------------------------------------------

// ===== Les points cardinaux : un vecteur par direction =====
const VECTOR: Record<string, [number, number]> = { nord: [0, 1], est: [1, 0], sud: [0, -1], ouest: [-1, 0] };
const NAME_OF = (x: number, y: number) => Object.entries(VECTOR).find(([, v]) => v[0] === x && v[1] === y)?.[0] as string;
/** Les mots d'un point cardinal avec son article : « le nord », « l'est ». */
const WITH_ARTICLE: Record<string, string> = { nord: "le nord", est: "l'est", sud: "le sud", ouest: "l'ouest" };
const DIRECTION_FROM_ARTICLE = (words: string) => Object.entries(WITH_ARTICLE).find(([, value]) => value === words)?.[0] as string;
const DIRECTION_FROM_OF = (words: string) => ({ "du nord": "nord", "de l'est": "est", "du sud": "sud", "de l'ouest": "ouest" })[words] as string;
/** Tourner à droite : (x, y) devient (y, -x). À gauche : (-y, x). Demi-tour : (-x, -y). */
const turnRight = ([x, y]: [number, number]): [number, number] => [y, -x];
const turnLeft = ([x, y]: [number, number]): [number, number] => [-y, x];
const turnBack = ([x, y]: [number, number]): [number, number] => [-x, -y];
const nameOfVector = (v: [number, number]) => NAME_OF(v[0], v[1]);
const DIRECTION_TILES = ["Nord", "Est", "Sud", "Ouest"];
const AT_T: Record<string, string> = { nord: "Au nord", est: "À l'est", sud: "Au sud", ouest: "À l'ouest" };

/** [question, bonne réponse] */
const SUN_T: [string, string][] = [
  ["De quel côté le soleil se lève-t-il ?", "Est"],
  ["De quel côté le soleil se couche-t-il ?", "Ouest"],
  ["Le matin, de quel côté vient la première lumière du jour ?", "Est"],
  ["Le soir, de quel côté le soleil disparaît-il ?", "Ouest"],
];
/** [phrase, bonne réponse, mauvais choix] */
const DIRECTION_GAP_T: [string, string, string[]][] = [
  ["Le soleil se lève à l'___.", "est", ["ouest"]],
  ["Le soleil se couche à l'___.", "ouest", ["est"]],
  ["Le contraire du nord est le ___.", "sud", ["est", "ouest"]],
  ["Le contraire du sud est le ___.", "nord", ["est", "ouest"]],
  ["La boussole montre toujours le ___.", "nord", ["sud", "est"]],
  ["Le contraire de l'est est l'___.", "ouest", ["est"]],
];
const CLUE_T: Record<string, string> = {
  "Le soleil se lève": "Est",
  "Le contraire de l'ouest": "Est",
  "Le soleil se couche": "Ouest",
  "Le contraire de l'est": "Ouest",
  "L'aiguille de la boussole montre": "Nord",
  "Le contraire du sud": "Nord",
  "Le contraire du nord": "Sud",
  "Ce qui est derrière toi quand tu regardes le nord": "Sud",
};
const SUN_ZONE_T: Record<string, string> = {
  "Le soleil se lève": "Est",
  "Le matin": "Est",
  "Le lever du jour": "Est",
  "Le soleil du matin": "Est",
  "Le soleil se couche": "Ouest",
  "Le soir": "Ouest",
  "La tombée de la nuit": "Ouest",
  "Le soleil du soir": "Ouest",
};
const PLACE_NAMES = ["puits", "mosquée", "marché", "boutique", "dispensaire", "manguier"];

// ===== Les saisons =====
const DRY_T = ["décembre", "janvier", "février", "mars", "avril", "mai"];
const RAIN_T = ["août", "septembre"];
const SEASON_OF = (month: string) => (DRY_T.includes(month) ? "Saison sèche" : RAIN_T.includes(month) ? "Saison des pluies" : undefined);
/** [question, bonne réponse] */
const SEASON_FACT_T: [string, string][] = [
  ["Pendant quelle période de l'année pleut-il beaucoup ?", "Saison des pluies"],
  ["Quel autre nom donne-t-on à la saison des pluies ?", "Hivernage"],
  ["Quel vent chaud et sec souffle pendant la saison sèche ?", "Harmattan"],
  ["Quelle saison dure le plus longtemps au Sénégal ?", "Saison sèche"],
  ["Où pleut-il le plus au Sénégal ?", "Au sud"],
  ["Dans quelle saison l'harmattan souffle-t-il ?", "Saison sèche"],
  ["Quelle saison porte aussi le nom d'hivernage ?", "Saison des pluies"],
  ["Pendant la saison sèche, tombe-t-il beaucoup ou peu de pluie ?", "Peu de pluie"],
];
const SEASON_WORDING_T: [string, string, string][] = [
  ["Il ne pleut presque pas", "Il pleut souvent", "Un vent chaud et sec"],
  ["Les mois sans averses", "Les mois d'averses", "Un vent venu du désert"],
  ["Les champs attendent la pluie", "Les champs reçoivent beaucoup d'eau", "Un vent qui sèche l'air"],
  ["Les mois où le sol se fend", "Les mois où l'eau remplit les mares", "Un vent chargé de poussière"],
];
/** [phrase, bonne réponse, mauvais choix] */
const SEASON_GAP_T: [string, string, string[]][] = [
  ["L'harmattan est un vent ___ et sec.", "chaud", ["froid", "mouillé"]],
  ["L'harmattan est un vent chaud et ___.", "sec", ["humide", "froid"]],
  ["Pendant la saison sèche, il ne ___ presque pas.", "pleut", ["neige", "gèle"]],
  ["Pendant l'hivernage, il ___ souvent.", "pleut", ["neige", "gèle"]],
  ["L'hivernage est le nom de la saison des ___.", "pluies", ["vents", "récoltes"]],
  ["Il pleut davantage au ___ du pays qu'au nord.", "sud", ["nord"]],
  ["Pendant l'hivernage, la terre est souvent ___.", "mouillée", ["sèche", "gelée"]],
  ["L'harmattan souffle surtout pendant la saison ___.", "sèche", ["pluvieuse", "froide"]],
];

// ===== Le relief et les cours d'eau =====
const RIVER_NAMES = ["Gambie", "Casamance"];
const LAKE_NAMES = ["Lac Rose", "Lac de Guiers"];
/** [question, bonne réponse] */
const WATER_TYPE_T: [string, string][] = [
  ["Lequel de ces points d'eau est un trou creusé dans le sol ?", "Puits"],
  ["Lequel de ces points d'eau reste après la pluie dans un creux du sol ?", "Mare"],
];
/** [question, bonne réponse] */
const WATER_WORD_T: [string, string][] = [
  ["Comment appelle-t-on un trou creusé pour atteindre l'eau ?", "Puits"],
  ["Comment appelle-t-on une petite étendue d'eau qui reste après la pluie ?", "Mare"],
  ["Comment appelle-t-on une grande étendue d'eau entourée de terre ?", "Lac"],
  ["Comment appelle-t-on un grand cours d'eau qui coule vers la mer ?", "Fleuve"],
  ["Quel mot désigne un trou profond dans le sol pour puiser de l'eau ?", "Puits"],
  ["Quel mot désigne l'eau de pluie qui reste dans un creux du sol ?", "Mare"],
  ["Quel mot désigne une grande eau calme entourée de terre ?", "Lac"],
  ["Quel mot désigne une grande eau qui coule sans cesse vers la mer ?", "Fleuve"],
];
const WATER_GIVES: Record<string, string> = {
  Puits: "Un trou creusé pour trouver l'eau",
  Mare: "De l'eau de pluie dans un creux",
  Lac: "Une grande eau entourée de terre",
  Fleuve: "Un grand cours d'eau qui va vers la mer",
  Océan: "Une immense eau salée au bord du pays",
};
const FLOWING_T = ["Gambie", "Casamance", "Fleuve"];
const STILL_T = ["Lac Rose", "Lac de Guiers", "Mare", "Puits"];
const RIVER_OF_TOWN: Record<string, string> = {
  "Saint-Louis": "Sénégal",
  Podor: "Sénégal",
  Bakel: "Sénégal",
  Ziguinchor: "Casamance",
  Kolda: "Casamance",
  Sédhiou: "Casamance",
};
/** [question, bonne réponse] */
const RELIEF_T: [string, string][] = [
  ["Comment est le relief du Sénégal ?", "Surtout plat"],
  ["Où trouve-t-on des collines au Sénégal ?", "Au sud-est"],
  ["Dans quelle région trouve-t-on des collines ?", "Kédougou"],
  ["Quelle région du Sénégal a un relief de collines ?", "Kédougou"],
];
/** [phrase, bonne réponse, mauvais choix] */
const WATER_GAP_T: [string, string, string[]][] = [
  ["Le ___ de Guiers est un grand point d'eau.", "lac", ["fleuve", "puits"]],
  ["La Casamance est un ___.", "fleuve", ["lac", "puits"]],
  ["Un ___ est un trou creusé pour trouver de l'eau.", "puits", ["lac", "fleuve"]],
  ["Une ___ garde l'eau de pluie dans un creux du sol.", "mare", ["colline", "montagne"]],
  ["Le Sénégal est un pays surtout ___.", "plat", ["montagneux", "volcanique"]],
  ["Les collines du Sénégal se trouvent au sud-___.", "est", ["ouest", "nord"]],
  ["Un ___ est une grande eau entourée de terre.", "lac", ["puits", "fleuve"]],
  ["Le ___ est un grand cours d'eau qui va vers la mer.", "fleuve", ["lac", "puits"]],
];

// ===== Le plan =====
/** Pour chaque plan, les objets possibles : nom sans article, avec son article, son pluriel. */
const PLAN_T: Record<string, { which: string; nouns: string; objects: [string, string, string][] }> = {
  "de la classe": {
    which: "Quel objet",
    nouns: "objets",
    objects: [
      ["porte", "la porte", "portes"],
      ["fenêtre", "la fenêtre", "fenêtres"],
      ["bureau", "le bureau", "bureaux"],
      ["table", "la table", "tables"],
      ["chaise", "la chaise", "chaises"],
      ["placard", "le placard", "placards"],
    ],
  },
  "de l'école": {
    which: "Quel lieu",
    nouns: "lieux",
    objects: [
      ["classe", "la classe", "classes"],
      ["cour", "la cour", "cours"],
      ["puits", "le puits", "puits"],
      ["cantine", "la cantine", "cantines"],
      ["bibliothèque", "la bibliothèque", "bibliothèques"],
      ["terrain", "le terrain", "terrains"],
    ],
  },
  "de la maison": {
    which: "Quelle pièce",
    nouns: "pièces",
    objects: [
      ["cuisine", "la cuisine", "cuisines"],
      ["chambre", "la chambre", "chambres"],
      ["salon", "le salon", "salons"],
      ["cour", "la cour", "cours"],
      ["douche", "la douche", "douches"],
      ["véranda", "la véranda", "vérandas"],
    ],
  },
};
const PLAN_SQUARES = ["🟥", "🟦", "🟩", "🟨", "🟪", "🟧"];
const PLAN_EMPTY = "⬜";

type ParsedPlan = {
  of: string;
  /** Les trois objets de la légende : nom, nom avec article, pluriel, carré. */
  legend: { name: string; word: string; many: string; square: string }[];
  /** La grille, ligne par ligne : le carré de chaque case. */
  grid: string[][];
  /** La dernière ligne de l'énoncé : la question. */
  question: string;
};

/** Lit un plan dans un énoncé : l'introduction, la légende, le quadrillage et la question. Un message d'erreur si le plan est mal formé. */
function readPlan(prompt: string): ParsedPlan | string {
  const lines = prompt.split("\n");
  if (lines.length < 4) return `un plan a au moins quatre lignes : ${prompt}`;
  const intro = /^Voici le plan (de la classe|de l'école|de la maison) vu de dessus\. (\S+) est (?:la|le) (\p{L}+), (\S+) (?:la|le) (\p{L}+) et (\S+) (?:la|le) (\p{L}+)\.$/u.exec(lines[0]);
  if (!intro) return `introduction ou légende mal formée : ${lines[0]}`;
  const scene = PLAN_T[intro[1]];
  const names = [intro[3], intro[5], intro[7]];
  const squares = [intro[2], intro[4], intro[6]];
  const legend: ParsedPlan["legend"] = [];
  for (let i = 0; i < 3; i++) {
    const row = scene.objects.find((object) => object[0] === names[i]);
    if (!row) return `objet inconnu dans ${intro[1]} : ${names[i]}`;
    legend.push({ name: names[i], word: row[1], many: row[2], square: squares[i] });
  }
  if (new Set(squares).size !== 3 || squares.some((square) => !PLAN_SQUARES.includes(square))) return `carrés de la légende : ${squares.join(" ")}`;
  if (new Set(names).size !== 3) return `objets répétés dans la légende : ${names.join(" ")}`;
  const grid = lines.slice(1, -1).map((line) => Array.from(line));
  if (grid.some((row) => row.length !== 3)) return `une ligne du plan n'a pas trois cases : ${lines.slice(1, -1).join(" / ")}`;
  if (grid.some((row) => row.some((cell) => cell !== PLAN_EMPTY && !squares.includes(cell)))) return `un carré du plan n'est pas dans la légende : ${grid.map((row) => row.join("")).join(" / ")}`;
  return { of: intro[1], legend, grid, question: lines[lines.length - 1] };
}

/** L'endroit d'une case, écrit à part du gabarit : lignes de haut en bas, colonnes de gauche à droite. */
function placeName(rows: number, r: number, c: number): string {
  if (rows === 3 && r === 1 && c === 1) return "au centre";
  const vertical = r === 0 ? "en haut" : r === rows - 1 ? "en bas" : "au milieu";
  const horizontal = ["à gauche", "au milieu", "à droite"][c];
  return `${vertical} ${horizontal}`;
}
/** Le carré posé à un endroit du plan, ou undefined. */
const squareAt = (plan: ParsedPlan, place: string) => {
  for (let r = 0; r < plan.grid.length; r++) for (let c = 0; c < 3; c++) if (placeName(plan.grid.length, r, c) === place) return plan.grid[r][c];
  return undefined;
};
const entryOfSquare = (plan: ParsedPlan, square: string | undefined) => plan.legend.find((entry) => entry.square === square);
const placesOfSquare = (plan: ParsedPlan, square: string) => {
  const found: string[] = [];
  plan.grid.forEach((row, r) => row.forEach((cell, c) => cell === square && found.push(placeName(plan.grid.length, r, c))));
  return found;
};
const PLAN_FACT_T: [string, string][] = [
  ["À quoi sert la légende d'un plan ?", "À expliquer ce que chaque signe montre"],
  ["Que dessine-t-on sur un plan ?", "Un lieu vu de dessus"],
  ["Comment voit-on un lieu sur un plan ?", "Vu de dessus"],
  ["Que trouve-t-on dans la légende d'un plan ?", "Le sens de chaque couleur"],
];

// ---------------------------------------------------------------------------
// Les vérifications de chaque gabarit
// ---------------------------------------------------------------------------

/** Une chronologie lue dans l'énoncé : les propositions, avec leur année, dans l'ordre où l'énoncé les dit. */
function chronology(exo: Exo, count: number): { tile: string; year: number }[] | string {
  const dated = datedOf(exo.prompt);
  if (dated.length !== count) return `${dated.length} propositions datées au lieu de ${count} : ${exo.prompt}`;
  if (!yearsOk(dated)) return `années hors de ${YEAR_MIN}-${YEAR_MAX} ou répétées : ${dated.map((entry) => entry.year).join(", ")}`;
  return dated;
}

const orderByYear: (suffix: string) => Check = (suffix) => (exo) => {
  const dated = chronology(exo, 3);
  if (typeof dated === "string") return dated;
  const expected = [...dated].sort((a, b) => a.year - b.year).map((entry) => entry.tile);
  return all(
    ok(sameSeq(sequenceOf(exo), expected), `l'énoncé range ${expected.join(" > ")}, le gabarit dit ${sequenceOf(exo).join(" > ")}`),
    ok(!sameSeq(dated.map((entry) => entry.tile), expected), "l'énoncé dit déjà les événements dans l'ordre du temps"),
    ok(exo.prompt.endsWith(suffix), `fin d'énoncé : ${exo.prompt}`),
  );
};

const gapBetweenDates: Check = (exo) => {
  const dated = chronology(exo, 2);
  if (typeof dated === "string") return dated;
  const gap = Math.abs(dated[0].year - dated[1].year);
  return all(
    ok(exo.type === "short-answer", `type ${exo.type}`),
    ok(sameSeq(acceptedOf(exo), [String(gap)]), `les dates disent ${gap}, les réponses admises ${acceptedOf(exo).join(" | ")}`),
    ok(exo.answerKey === String(gap), `clé ${exo.answerKey}`),
    ok(exo.prompt.endsWith("Combien d'années passent entre ces deux dates ? Écris le nombre."), `fin d'énoncé : ${exo.prompt}`),
  );
};

/** La chronologie d'un qcm « le plus récent » ou « juste après le début » : trois événements, dont le premier a l'année la plus petite. */
const latestOf: (baseTile: string, baseWords: string) => Check = (baseTile, baseWords) => (exo) => {
  const dated = chronology(exo, 3);
  if (typeof dated === "string") return dated;
  const base = dated.find((entry) => entry.tile === baseTile);
  if (!base) return `l'événement de départ « ${baseTile} » manque : ${exo.prompt}`;
  const others = dated.filter((entry) => entry !== base);
  if (others.some((entry) => entry.year <= base.year)) return `un ajout est avant ou en même temps que « ${baseTile} »`;
  const latest = exo.prompt.endsWith("Quel ajout est le plus récent ?");
  const after = exo.prompt.endsWith(`Quel ajout est arrivé juste après ${baseWords} ?`);
  if (!latest && !after) return `question inconnue : ${exo.prompt}`;
  const expected = (latest ? [...others].sort((a, b) => b.year - a.year) : [...others].sort((a, b) => a.year - b.year))[0].tile;
  return all(
    ok(rightOption(exo) === expected, `les dates disent « ${expected} », la bonne option est « ${rightOption(exo)} »`),
    ok(same(optionsOf(exo), dated.map((entry) => entry.tile)), `les choix : ${optionsOf(exo).join(" | ")}`),
  );
};

const CHECKS: Record<string, Check> = {
  // ===== Le temps qui passe =====
  "ce1-generation-ordre": (exo) => {
    const up = exo.prompt === "Mets ces personnes d'une même famille de la plus jeune à la plus âgée.";
    const down = exo.prompt === "Mets ces personnes d'une même famille de la plus âgée à la plus jeune.";
    if (!up && !down) return `énoncé inconnu : ${exo.prompt}`;
    const ranks = sequenceOf(exo).map((person) => GEN_RANK[person]);
    if (ranks.some((rank) => rank === undefined)) return `personne inconnue : ${sequenceOf(exo).join(" ")}`;
    const strict = ranks.every((rank, i) => i === 0 || (up ? rank > ranks[i - 1] : rank < ranks[i - 1]));
    const feminine = sequenceOf(exo).some((person) => FEMININE_PEOPLE.has(person));
    const masculine = sequenceOf(exo).some((person) => MASCULINE_PEOPLE.has(person));
    return all(ok(strict, `les générations ${ranks.join(" ")} ne vont pas ${up ? "des plus jeunes aux plus âgées" : "des plus âgées aux plus jeunes"}`), ok(!(feminine && masculine), "une famille mêle des hommes et des femmes dans une même lignée"));
  },
  "ce1-naissance": (exo) => {
    const match = /^(\p{Lu}\p{L}+) est (née?) en (\d{4}), (\p{Lu}\p{L}+) en (\d{4}) et (\p{Lu}\p{L}+) en (\d{4})\. Qui est (née?) en (premier|dernier) \?$/u.exec(exo.prompt);
    if (!match) return `énoncé inconnu : ${exo.prompt}`;
    const people = [
      [match[1], Number(match[3])],
      [match[4], Number(match[5])],
      [match[6], Number(match[7])],
    ] as [string, number][];
    const years = people.map(([, year]) => year);
    const feminine = people.every(([name]) => FEMININE_FIRST_NAMES.includes(name));
    const masculine = people.every(([name]) => MASCULINE_FIRST_NAMES.includes(name));
    const target = match[9] === "premier" ? Math.min(...years) : Math.max(...years);
    const expected = (people.find(([, year]) => year === target) as [string, number])[0];
    return all(
      ok(new Set(years).size === 3 && years.every((year) => year >= YEAR_MIN && year <= YEAR_MAX), `années ${years.join(", ")}`),
      ok(feminine || masculine, "les trois prénoms ne sont pas du même genre"),
      ok(match[2] === (feminine ? "née" : "né") && match[8] === match[2], "l'accord de né / née"),
      ok(rightOption(exo) === expected, `les années disent ${expected}, la bonne option est ${rightOption(exo)}`),
      ok(same(optionsOf(exo), people.map(([name]) => name)), `les choix : ${optionsOf(exo).join(" | ")}`),
    );
  },
  "ce1-ligne-ordre": orderByYear("Mets-les du plus ancien au plus récent."),
  "ce1-ligne-ecart": gapBetweenDates,
  "ce1-mois-decalage": (exo) => {
    const match = /^Nous sommes en (\p{L}+)\. Quel mois (?:sera dans (\p{L}+) mois|était il y a (\p{L}+) mois) \?$/u.exec(exo.prompt);
    if (!match) return `énoncé inconnu : ${exo.prompt}`;
    const start = MONTHS_T.indexOf(match[1]);
    const forward = match[2] !== undefined;
    const size = NUMBER_WORDS[(match[2] ?? match[3]) as string];
    if (start < 0 || !size) return `mois ou nombre inconnu : ${exo.prompt}`;
    const expected = MONTHS_T[(((start + (forward ? size : -size)) % 12) + 12) % 12];
    const index = MONTHS_T.indexOf(expected);
    return all(
      ok(rightOption(exo) === expected, `le calendrier dit ${expected}, la bonne option est ${rightOption(exo)}`),
      ok(same(optionsOf(exo), [expected, MONTHS_T[(index + 1) % 12], MONTHS_T[(index + 11) % 12]]), `les choix : ${optionsOf(exo).join(" | ")}`),
    );
  },
  "ce1-generation-trou": checkGap(GEN_GAP_T),
  "ce1-autrefois-qcm": (exo) => {
    const match = /^Pour (.+), que (faisait-on autrefois|fait-on de nos jours) \?$/u.exec(exo.prompt);
    if (!match) return `énoncé inconnu : ${exo.prompt}`;
    const row = needRow(match[1]);
    if (!row) return `besoin inconnu : ${match[1]}`;
    const then = match[2] === "faisait-on autrefois";
    const expected = then ? row[1] : row[2];
    const pool = (then ? THEN_TILES : NOW_TILES).filter((tile) => tile !== expected);
    return all(
      ok(rightOption(exo) === expected, `« ${match[1]} » ${then ? "autrefois" : "de nos jours"} : « ${expected} », la bonne option est « ${rightOption(exo)} »`),
      ok(wrongOf(exo).length === 2 && wrongOf(exo).every((option) => pool.includes(option)), `mauvais choix ${wrongOf(exo).join(" | ")} (ils doivent être de la même époque, d'autres besoins)`),
      ok(wrongOf(exo).every((option) => !servesToo(option, match[1])), `un mauvais choix sert aussi à ${match[1]} : ${wrongOf(exo).join(" | ")}`),
    );
  },
  "ce1-autrefois-relier": (exo) => {
    const needs = new Set<string>();
    for (const pair of pairsOf(exo)) {
      const match = /^(Autrefois|De nos jours), pour (.+)$/u.exec(pair.left);
      if (!match) return `partie gauche inconnue : ${pair.left}`;
      const row = needRow(match[2]);
      if (!row) return `besoin inconnu : ${match[2]}`;
      needs.add(match[2]);
      const expected = match[1] === "Autrefois" ? row[1] : row[2];
      if (pair.right !== expected) return `« ${pair.left} » est relié à « ${pair.right} », la table dit « ${expected} »`;
    }
    return ok(pairsOf(exo).length === 3 && needs.size === 3, "trois besoins différents");
  },
  "ce1-autrefois-glisser": (exo) => {
    const match = /^Pour (.+) et pour (.+), glisse chaque chose dans sa case, la plus ancienne de chaque besoin en Autrefois\.$/u.exec(exo.prompt);
    if (!match) return `énoncé inconnu : ${exo.prompt}`;
    const first = needRow(match[1]);
    const second = needRow(match[2]);
    if (!first || !second || match[1] === match[2]) return `besoins : ${match[1]} / ${match[2]}`;
    const expected = new Map<string, string>([first, second].flatMap((row) => [[row[1], "Autrefois"] as const, [row[2], "Aujourd'hui"] as const]));
    for (const item of itemsOf(exo)) if (expected.get(item.text) !== item.correctZone) return `« ${item.text} » est rangé dans « ${item.correctZone} », la table dit « ${expected.get(item.text)} »`;
    return all(ok(itemsOf(exo).length === 4, "quatre choses"), ok(sameSeq(zonesOf(exo), ["Autrefois", "Aujourd'hui"]), `cases ${zonesOf(exo).join(" | ")}`));
  },
  "ce1-autrefois-trou": (exo) => {
    const match = /^(Autrefois|De nos jours), pour (.+), on (utilisait|utilise) ___\.$/u.exec(textOf(exo));
    if (!match) return `phrase inconnue : ${textOf(exo)}`;
    const row = needRow(match[2]);
    if (!row) return `besoin inconnu : ${match[2]}`;
    const then = match[1] === "Autrefois";
    if ((match[3] === "utilisait") !== then) return `le temps du verbe ne suit pas « ${match[1]} »`;
    const expected = then ? row[3] : row[4];
    const pool = NEED_T.filter((entry) => entry !== row).map((entry) => (then ? entry[3] : entry[4]));
    return all(
      ok(blankOf(exo).answer === expected, `la phrase veut « ${expected} », le trou dit « ${blankOf(exo).answer} »`),
      ok(blankOf(exo).options.length === 3 && blankOf(exo).options.filter((option) => option !== expected).every((option) => pool.includes(option)), `les choix : ${blankOf(exo).options.join(" | ")}`),
      ok(blankOf(exo).options.every((option) => !servesToo(option, match[2])), `un mauvais choix sert aussi à ${match[2]} : ${blankOf(exo).options.join(" | ")}`),
    );
  },

  // ===== L'histoire de ma famille =====
  "ce1-lien-qcm": (exo) => {
    const match = /^Qui est (le père|la mère|le frère|la sœur|le fils|la fille) de (ta|ton) (mère|père|oncle|tante) \?$/u.exec(exo.prompt);
    if (!match) return `énoncé inconnu : ${exo.prompt}`;
    const term = termOfLink(match[1], match[3]);
    if (!term) return `lien inconnu : ${match[1]} de ${match[3]}`;
    return all(
      ok(match[2] === POSSESSIVE_OF[match[3]][0], `possessif ${match[2]} devant ${match[3]}`),
      ok(rightOption(exo) === term, `${match[1]} de ${match[3]} : ${term}, la bonne option est ${rightOption(exo)}`),
      ok(wrongOf(exo).length === 2 && wrongOf(exo).every((option) => TERM_LIST.includes(option)), `mauvais choix ${wrongOf(exo).join(" | ")}`),
    );
  },
  "ce1-lien-trou": (exo) => {
    const match = /^(Le père|La mère|Le frère|La sœur|Le fils|La fille) de (ma|mon) (mère|père|oncle|tante) est (ma|mon) ___\.$/u.exec(textOf(exo));
    if (!match) return `phrase inconnue : ${textOf(exo)}`;
    const term = termOfLink(match[1], match[3]);
    if (!term) return `lien inconnu : ${match[1]} de ${match[3]}`;
    const feminine = FEMININE_TERM.has(term);
    const sameGender = TERM_LIST.filter((entry) => FEMININE_TERM.has(entry) === feminine).map((entry) => entry.toLowerCase());
    return all(
      ok(match[2] === POSSESSIVE_OF[match[3]][1], `possessif ${match[2]} devant ${match[3]}`),
      ok(match[4] === (feminine ? "ma" : "mon"), `article ${match[4]} devant ${term}`),
      ok(blankOf(exo).answer === term.toLowerCase(), `la famille dit « ${term.toLowerCase()} », le trou dit « ${blankOf(exo).answer} »`),
      ok(same(blankOf(exo).options, sameGender), `les choix : ${blankOf(exo).options.join(" | ")}`),
    );
  },
  "ce1-lien-relier": (exo) => {
    const terms = new Set<string>();
    for (const pair of pairsOf(exo)) {
      const match = /^(Le père|La mère|Le frère|La sœur|Le fils|La fille) de (ta|ton) (mère|père|oncle|tante)$/u.exec(pair.left);
      if (!match) return `partie gauche inconnue : ${pair.left}`;
      const term = termOfLink(match[1], match[3]);
      if (pair.right !== term) return `« ${pair.left} » est relié à « ${pair.right} », la famille dit « ${term} »`;
      terms.add(pair.right);
    }
    return ok(pairsOf(exo).length === 3 && terms.size === 3, "trois noms différents");
  },
  "ce1-famille-glisser": (exo) => {
    for (const item of itemsOf(exo)) if (GENERATION_OF_TERM[item.text] !== item.correctZone) return `« ${item.text} » est rangé dans « ${item.correctZone} », la table dit « ${GENERATION_OF_TERM[item.text]} »`;
    const used = new Set(itemsOf(exo).map((item) => item.correctZone));
    return all(ok(zonesOf(exo).length === 2 && same(zonesOf(exo), [...used]), `cases ${zonesOf(exo).join(" | ")}`), ok(itemsOf(exo).length >= 4, "quatre personnes au moins"));
  },
  "ce1-famille-ordre": (exo) => {
    const oldestFirst = exo.prompt === "Mets ces membres de ta famille de la génération la plus âgée à la plus jeune.";
    const youngestFirst = exo.prompt === "Mets ces membres de ta famille de la génération la plus jeune à la plus âgée.";
    if (!oldestFirst && !youngestFirst) return `énoncé inconnu : ${exo.prompt}`;
    const age = { "Génération de mes grands-parents": 0, "Génération de mes parents": 1, "Ma génération": 2 } as Record<string, number>;
    const ranks = sequenceOf(exo).map((person) => age[GENERATION_OF_TERM[person]]);
    if (ranks.some((rank) => rank === undefined)) return `personne inconnue : ${sequenceOf(exo).join(" ")}`;
    return all(
      ok(same(ranks.map(String), ["0", "1", "2"]), `les générations ${ranks.join(" ")} ne sont pas trois générations différentes`),
      ok(ranks.every((rank, i) => i === 0 || (oldestFirst ? rank > ranks[i - 1] : rank < ranks[i - 1])), `les générations ${ranks.join(" ")} ne vont pas ${oldestFirst ? "de la plus âgée à la plus jeune" : "de la plus jeune à la plus âgée"}`),
    );
  },
  "ce1-souvenir-qcm": checkQuestion(MEMORY_T),
  "ce1-souvenir-relier": checkLinks(MEMORY_LINK_T),
  "ce1-famille-compte": (exo) => {
    const match = /^(\p{Lu}\p{L}+) a (.+)\. Combien a-t-(elle|il) de personnes de cette famille en tout \? Écris le nombre\.$/u.exec(exo.prompt);
    if (!match) return `énoncé inconnu : ${exo.prompt}`;
    const parts = match[2].split(/, | et /u);
    let total = 0;
    const kinds = new Set<string>();
    for (const part of parts) {
      const piece = /^(\d+) (\p{L}+)$/u.exec(part);
      if (!piece || !RELATIVE_WORDS[piece[2]]) return `groupe inconnu : ${part}`;
      const count = Number(piece[1]);
      if (count === 1 ? piece[2] !== RELATIVE_WORDS[piece[2]] : piece[2] !== `${RELATIVE_WORDS[piece[2]]}s`) return `accord de « ${part} »`;
      kinds.add(RELATIVE_WORDS[piece[2]]);
      total += count;
    }
    const feminine = FEMININE_FIRST_NAMES.includes(match[1]);
    return all(
      ok(feminine || MASCULINE_FIRST_NAMES.includes(match[1]), `prénom inconnu : ${match[1]}`),
      ok(match[3] === (feminine ? "elle" : "il"), `pronom ${match[3]} pour ${match[1]}`),
      ok(kinds.size === parts.length && parts.length >= 2, "deux ou trois groupes différents"),
      ok(sameSeq(acceptedOf(exo), [String(total)]), `la phrase dit ${total}, les réponses admises ${acceptedOf(exo).join(" | ")}`),
      ok(exo.answerKey === String(total), `clé ${exo.answerKey}`),
    );
  },

  // ===== L'histoire de mon école =====
  "ce1-source-qcm": (exo) => {
    const row = lookup(SOURCE_Q_T, exo.prompt);
    if (!row) return `question inconnue : ${exo.prompt}`;
    return all(
      ok(rightOption(exo) === row[1], `la bonne option est « ${rightOption(exo)} », la table dit « ${row[1]} »`),
      ok(wrongOf(exo).length === 2 && wrongOf(exo).every((option) => SOURCE_KIND[option] === "document" && option !== row[1]), `mauvais choix ${wrongOf(exo).join(" | ")} (des documents, pas la réponse)`),
    );
  },
  "ce1-source-relier": checkLinks(SOURCE_GIVES),
  "ce1-source-glisser": (exo) => {
    for (const item of itemsOf(exo)) {
      const zone = SOURCE_KIND[item.text] === "personne" ? "Personne" : "Document";
      if (item.correctZone !== zone) return `« ${item.text} » est rangé dans « ${item.correctZone} », la table dit « ${zone} »`;
    }
    const persons = itemsOf(exo).filter((item) => item.correctZone === "Personne");
    return all(ok(sameSeq(zonesOf(exo), ["Personne", "Document"]), `cases ${zonesOf(exo).join(" | ")}`), ok(persons.length === 2 && itemsOf(exo).length - persons.length >= 2, "deux personnes et deux ou trois documents"));
  },
  "ce1-source-trou": checkGap(SOURCE_GAP_T),
  "ce1-ecole-ordre": orderByYear("Mets-les du plus ancien au plus récent."),
  "ce1-ecole-recent": latestOf("Première classe", "la première classe"),
  "ce1-ecole-ecart": gapBetweenDates,

  // ===== Mon quartier, mon village, ma commune =====
  "ce1-mot-qcm": (exo) => {
    const row = lookup(WORD_Q_T, exo.prompt);
    if (!row) return `question inconnue : ${exo.prompt}`;
    const personAnswer = PERSON_WORDS.has(row[1]);
    return all(
      ok(rightOption(exo) === row[1], `la bonne option est « ${rightOption(exo)} », la table dit « ${row[1]} »`),
      ok(wrongOf(exo).length === 2 && wrongOf(exo).every((option) => WORD_TILES.includes(option) && option !== row[1]), `mauvais choix ${wrongOf(exo).join(" | ")}`),
      ok(!personAnswer || wrongOf(exo).every((option) => !PERSON_WORDS.has(option)), "une personne parmi les mauvais choix d'une question sur une personne"),
    );
  },
  "ce1-mot-relier": checkLinks(WORD_GIVES),
  "ce1-mot-glisser": (exo) => {
    for (const item of itemsOf(exo)) {
      const zone = PERSON_WORDS.has(item.text) ? "Personne" : PLACE_WORDS.includes(item.text) ? "Lieu" : "?";
      if (item.correctZone !== zone) return `« ${item.text} » est rangé dans « ${item.correctZone} », la table dit « ${zone} »`;
    }
    const persons = itemsOf(exo).filter((item) => item.correctZone === "Personne");
    return all(ok(sameSeq(zonesOf(exo), ["Personne", "Lieu"]), `cases ${zonesOf(exo).join(" | ")}`), ok(persons.length === 2 && itemsOf(exo).length - persons.length >= 2, "deux personnes et deux ou trois lieux"));
  },
  "ce1-mot-trou": checkGap(WORD_GAP_T),
  "ce1-village-ordre": orderByYear("Mets-les du plus ancien au plus récent."),
  "ce1-village-recent": latestOf("Fondation", "la fondation"),
  "ce1-village-ecart": gapBetweenDates,

  // ===== Les points cardinaux =====
  "ce1-oppose": (exo) => {
    const match = /^Quel point cardinal est (?:en face|le contraire) (du nord|de l'est|du sud|de l'ouest) \?$/u.exec(exo.prompt);
    if (!match) return `énoncé inconnu : ${exo.prompt}`;
    const direction = VECTOR[DIRECTION_FROM_OF(match[1])];
    const opposite = nameOfVector(turnBack(direction));
    const perpendicular = [nameOfVector(turnRight(direction)), nameOfVector(turnLeft(direction))].map(cap);
    return all(ok(rightOption(exo) === cap(opposite), `l'opposé ${match[1]} est ${opposite}, la bonne option est ${rightOption(exo)}`), ok(same(wrongOf(exo), perpendicular), `mauvais choix ${wrongOf(exo).join(" | ")}`));
  },
  "ce1-soleil": (exo) => {
    const row = lookup(SUN_T, exo.prompt);
    if (!row) return `question inconnue : ${exo.prompt}`;
    return all(ok(rightOption(exo) === row[1], `le soleil : ${row[1]}, la bonne option est ${rightOption(exo)}`), ok(wrongOf(exo).length === 2 && wrongOf(exo).every((option) => DIRECTION_TILES.includes(option)), `mauvais choix ${wrongOf(exo).join(" | ")}`));
  },
  "ce1-face": (exo) => {
    const match = /^Tu regardes vers (le nord|l'est|le sud|l'ouest)\. Quel point cardinal est (à ta droite|à ta gauche|derrière toi) \?$/u.exec(exo.prompt);
    if (!match) return `énoncé inconnu : ${exo.prompt}`;
    const facing = VECTOR[DIRECTION_FROM_ARTICLE(match[1])];
    const turned = match[2] === "à ta droite" ? turnRight(facing) : match[2] === "à ta gauche" ? turnLeft(facing) : turnBack(facing);
    return all(ok(rightOption(exo) === cap(nameOfVector(turned)), `${match[2]} quand on regarde ${match[1]} : ${nameOfVector(turned)}, la bonne option est ${rightOption(exo)}`), ok(wrongOf(exo).length === 2 && wrongOf(exo).every((option) => DIRECTION_TILES.includes(option)), `mauvais choix ${wrongOf(exo).join(" | ")}`));
  },
  "ce1-tourne": (exo) => {
    const match = /^Tu regardes vers (le nord|l'est|le sud|l'ouest)\. ((?:Tu tournes à droite\.|Tu tournes à gauche\.|Tu fais demi-tour\.)(?: (?:Tu tournes à droite\.|Tu tournes à gauche\.|Tu fais demi-tour\.))*) Vers quel point cardinal regardes-tu maintenant \?$/u.exec(exo.prompt);
    if (!match) return `énoncé inconnu : ${exo.prompt}`;
    let direction = VECTOR[DIRECTION_FROM_ARTICLE(match[1])];
    const turns = match[2].match(/Tu tournes à droite\.|Tu tournes à gauche\.|Tu fais demi-tour\./gu) as string[];
    for (const turn of turns) direction = turn === "Tu tournes à droite." ? turnRight(direction) : turn === "Tu tournes à gauche." ? turnLeft(direction) : turnBack(direction);
    return all(ok(rightOption(exo) === cap(nameOfVector(direction)), `après ${turns.length} tour(s) : ${nameOfVector(direction)}, la bonne option est ${rightOption(exo)}`), ok(wrongOf(exo).length === 2 && wrongOf(exo).every((option) => DIRECTION_TILES.includes(option)), `mauvais choix ${wrongOf(exo).join(" | ")}`));
  },
  "ce1-boussole-ordre": (exo) => {
    const match = /^Tu regardes vers (le nord|l'est|le sud|l'ouest) puis tu tournes (à droite|à gauche), par quarts de tour\. Mets les points cardinaux en suivant tes regards, du premier au dernier\.$/u.exec(exo.prompt);
    if (!match) return `énoncé inconnu : ${exo.prompt}`;
    let direction = VECTOR[DIRECTION_FROM_ARTICLE(match[1])];
    const expected: string[] = [];
    for (let i = 0; i < 4; i++) {
      expected.push(cap(nameOfVector(direction)));
      direction = match[2] === "à droite" ? turnRight(direction) : turnLeft(direction);
    }
    return ok(sameSeq(sequenceOf(exo), expected), `le tour donne ${expected.join(" > ")}, le gabarit dit ${sequenceOf(exo).join(" > ")}`);
  },
  "ce1-point-trou": checkGap(DIRECTION_GAP_T),
  "ce1-lieux-direction": (exo) => {
    const pair = /^(?:Le|La) (\p{L}+) est (au nord|au sud|à l'est|à l'ouest) (?:du|de la) (\p{L}+)\. Où est (?:le|la) (\p{L}+) par rapport (?:au|à la) (\p{L}+) \?$/u.exec(exo.prompt);
    if (pair) {
      const [, first, where, second, asked, from] = pair;
      const direction = where.replace(/^(au|à l'|à) ?/u, "");
      if (!PLACE_NAMES.includes(first) || !PLACE_NAMES.includes(second) || first === second) return `lieux : ${first} / ${second}`;
      const opposite = nameOfVector(turnBack(VECTOR[direction]));
      return all(
        ok(asked === second && from === first, `la question parle de ${asked} par rapport à ${from}, la phrase de ${first} et ${second}`),
        ok(rightOption(exo) === AT_T[opposite], `${first} est ${where} ${second} : ${second} est ${AT_T[opposite]}, la bonne option est ${rightOption(exo)}`),
        ok(wrongOf(exo).length === 2 && wrongOf(exo).every((option) => Object.values(AT_T).includes(option)), `mauvais choix ${wrongOf(exo).join(" | ")}`),
      );
    }
    const chain = /^(?:Le|La) (\p{L}+) est (au nord|au sud) (?:du|de la) (\p{L}+)\. (?:Le|La) (\p{L}+) est (au nord|au sud) (?:du|de la) (\p{L}+)\. Quel lieu est le plus (au nord|au sud) \?$/u.exec(exo.prompt);
    if (!chain) return `énoncé inconnu : ${exo.prompt}`;
    const [, second, wordA, first, third, wordB, secondAgain, asked] = chain;
    return all(
      ok(wordA === wordB && wordB === asked, "les trois phrases ne parlent pas du même côté"),
      ok(new Set([first, second, third]).size === 3 && [first, second, third].every((name) => PLACE_NAMES.includes(name)), `lieux : ${first} / ${second} / ${third}`),
      ok(secondAgain === second, "la deuxième phrase doit partir du lieu de la première"),
      ok(rightOption(exo) === cap(third), `le lieu le plus ${asked} est ${third}, la bonne option est ${rightOption(exo)}`),
      ok(same(optionsOf(exo), [first, second, third].map(cap)), `les choix : ${optionsOf(exo).join(" | ")}`),
    );
  },
  "ce1-point-relier": checkLinks(CLUE_T),
  "ce1-point-glisser": (exo) => {
    for (const item of itemsOf(exo)) if (SUN_ZONE_T[item.text] !== item.correctZone) return `« ${item.text} » est rangé dans « ${item.correctZone} », la table dit « ${SUN_ZONE_T[item.text]} »`;
    const east = itemsOf(exo).filter((item) => item.correctZone === "Est").length;
    return all(ok(sameSeq(zonesOf(exo), ["Est", "Ouest"]), `cases ${zonesOf(exo).join(" | ")}`), ok(east >= 2 && itemsOf(exo).length - east === east, "autant de phrases de chaque côté, deux au moins"));
  },

  // ===== Le climat et les saisons =====
  "ce1-mois-saison": (exo) => {
    if (exo.prompt === "Quel mois est de la saison sèche ?") {
      return all(ok(DRY_T.includes(rightOption(exo)), `${rightOption(exo)} n'est pas un mois sûr de la saison sèche`), ok(same(wrongOf(exo), RAIN_T), `mauvais choix ${wrongOf(exo).join(" | ")}`));
    }
    if (exo.prompt === "Quel mois est de la saison des pluies ?") {
      return all(ok(RAIN_T.includes(rightOption(exo)), `${rightOption(exo)} n'est pas un mois sûr de la saison des pluies`), ok(wrongOf(exo).length === 2 && wrongOf(exo).every((option) => DRY_T.includes(option)), `mauvais choix ${wrongOf(exo).join(" | ")}`));
    }
    const match = /^En quelle saison est le mois (?:de|d')\s?(\p{L}+) \?$/u.exec(exo.prompt);
    if (!match) return `énoncé inconnu : ${exo.prompt}`;
    const month = match[1];
    const elided = /^[aeiouéh]/u.test(month);
    return all(
      ok(SEASON_OF(month) !== undefined, `${month} est un mois de bord, jamais posé`),
      ok(exo.prompt.includes(elided ? `mois d'${month}` : `mois de ${month}`), `élision de ${month}`),
      ok(rightOption(exo) === SEASON_OF(month), `${month} est de la ${SEASON_OF(month)}, la bonne option est ${rightOption(exo)}`),
      ok(same(optionsOf(exo), ["Saison sèche", "Saison des pluies"]), `les choix : ${optionsOf(exo).join(" | ")}`),
    );
  },
  "ce1-saison-glisser": (exo) => {
    for (const item of itemsOf(exo)) {
      const month = item.text.toLowerCase();
      if (SEASON_OF(month) !== item.correctZone) return `« ${item.text} » est rangé dans « ${item.correctZone} », la table dit « ${SEASON_OF(month)} »`;
    }
    const rain = itemsOf(exo).filter((item) => item.correctZone === "Saison des pluies").length;
    return all(ok(sameSeq(zonesOf(exo), ["Saison sèche", "Saison des pluies"]), `cases ${zonesOf(exo).join(" | ")}`), ok(rain === 2 && itemsOf(exo).length - rain >= 2, "deux mois de pluie, deux ou trois mois secs"));
  },
  "ce1-saison-fait": (exo) => {
    const row = lookup(SEASON_FACT_T, exo.prompt);
    if (!row) return `question inconnue : ${exo.prompt}`;
    return all(ok(rightOption(exo) === row[1], `la bonne option est « ${rightOption(exo)} », la table dit « ${row[1]} »`), ok(wrongOf(exo).length >= 1 && wrongOf(exo).length <= 2, "un ou deux mauvais choix"));
  },
  "ce1-saison-relier": (exo) => {
    const rights = new Map(pairsOf(exo).map((pair) => [pair.left, pair.right]));
    if (!same([...rights.keys()], ["Saison sèche", "Hivernage", "Harmattan"])) return `mots : ${[...rights.keys()].join(" | ")}`;
    const wording = SEASON_WORDING_T.find((row) => row[0] === rights.get("Saison sèche"));
    if (!wording) return `phrase inconnue pour la saison sèche : ${rights.get("Saison sèche")}`;
    return all(ok(rights.get("Hivernage") === wording[1], `hivernage : ${rights.get("Hivernage")}`), ok(rights.get("Harmattan") === wording[2], `harmattan : ${rights.get("Harmattan")}`));
  },
  "ce1-saison-ordre": (exo) => {
    const months = sequenceOf(exo).map((tile) => tile.toLowerCase());
    const indexes = months.map((month) => MONTHS_T.indexOf(month));
    return all(
      ok(indexes.every((index) => index >= 0 && index <= 4), `mois hors de janvier à mai : ${months.join(" ")}`),
      ok(indexes.every((index, i) => i === 0 || index > indexes[i - 1]), `ordre du calendrier : ${months.join(" > ")}`),
      ok(months.every((month) => DRY_T.includes(month)), "un mois de la suite n'est pas de la saison sèche"),
      ok(exo.prompt === "Mets ces mois de la saison sèche dans l'ordre du calendrier.", exo.prompt),
    );
  },
  "ce1-saison-trou": checkGap(SEASON_GAP_T),

  // ===== Le relief et les cours d'eau =====
  "ce1-eau-type": (exo) => {
    const fixed = lookup(WATER_TYPE_T, exo.prompt);
    if (fixed) return all(ok(rightOption(exo) === fixed[1], `la bonne option est « ${rightOption(exo)} », la table dit « ${fixed[1]} »`), ok(wrongOf(exo).length === 2 && wrongOf(exo).every((option) => [...RIVER_NAMES, ...LAKE_NAMES].includes(option)), `mauvais choix ${wrongOf(exo).join(" | ")}`));
    if (exo.prompt === "Lequel de ces points d'eau est un fleuve ?" || exo.prompt === "Parmi ces points d'eau, lequel est un fleuve ?") return all(ok(RIVER_NAMES.includes(rightOption(exo)), `${rightOption(exo)} n'est pas un fleuve`), ok(same(wrongOf(exo), LAKE_NAMES), `mauvais choix ${wrongOf(exo).join(" | ")}`));
    if (exo.prompt === "Lequel de ces points d'eau est un lac ?" || exo.prompt === "Parmi ces points d'eau, lequel est un lac ?") return all(ok(LAKE_NAMES.includes(rightOption(exo)), `${rightOption(exo)} n'est pas un lac`), ok(same(wrongOf(exo), RIVER_NAMES), `mauvais choix ${wrongOf(exo).join(" | ")}`));
    return `question inconnue : ${exo.prompt}`;
  },
  "ce1-eau-mot": (exo) => {
    const row = lookup(WATER_WORD_T, exo.prompt);
    if (!row) return `question inconnue : ${exo.prompt}`;
    return all(ok(rightOption(exo) === row[1], `la bonne option est « ${rightOption(exo)} », la table dit « ${row[1]} »`), ok(wrongOf(exo).length === 2 && wrongOf(exo).every((option) => Object.keys(WATER_GIVES).includes(option) && option !== row[1]), `mauvais choix ${wrongOf(exo).join(" | ")}`));
  },
  "ce1-eau-glisser": (exo) => {
    for (const item of itemsOf(exo)) {
      const zone = FLOWING_T.includes(item.text) ? "Eau qui coule" : STILL_T.includes(item.text) ? "Eau qui reste" : "?";
      if (item.correctZone !== zone) return `« ${item.text} » est rangé dans « ${item.correctZone} », la table dit « ${zone} »`;
    }
    const flowing = itemsOf(exo).filter((item) => item.correctZone === "Eau qui coule").length;
    return all(ok(sameSeq(zonesOf(exo), ["Eau qui coule", "Eau qui reste"]), `cases ${zonesOf(exo).join(" | ")}`), ok(flowing >= 2 && itemsOf(exo).length - flowing >= 2, "deux ou trois points d'eau de chaque case"));
  },
  "ce1-eau-relier": checkLinks(WATER_GIVES),
  "ce1-eau-ville": (exo) => {
    const match = /^Quel fleuve passe près de (.+) \?$/u.exec(exo.prompt);
    if (!match) return `énoncé inconnu : ${exo.prompt}`;
    const river = RIVER_OF_TOWN[match[1]];
    if (!river) return `ville inconnue : ${match[1]}`;
    return all(ok(rightOption(exo) === river, `${match[1]} est sur le ${river}, la bonne option est ${rightOption(exo)}`), ok(same(optionsOf(exo), ["Sénégal", "Casamance", "Gambie"]), `les choix : ${optionsOf(exo).join(" | ")}`));
  },
  "ce1-relief": checkQuestion(RELIEF_T),
  "ce1-eau-trou": checkGap(WATER_GAP_T),

  // ===== Le plan =====
  "ce1-plan-ou": (exo) => {
    const plan = readPlan(exo.prompt);
    if (typeof plan === "string") return plan;
    const match = /^Où est (?:la|le|l')\s?(\p{L}+) \?$/u.exec(plan.question);
    const entry = match && plan.legend.find((candidate) => candidate.name === match[1]);
    if (!entry) return `question inconnue : ${plan.question}`;
    const places = placesOfSquare(plan, entry.square);
    const allPlaces = plan.legend.flatMap((candidate) => placesOfSquare(plan, candidate.square));
    const level = (exo.payload.game as { level: number }).level;
    return all(
      ok(plan.grid.length === (level === 1 ? 2 : 3), `lignes du plan : ${plan.grid.length}`),
      ok(places.length === 1, `${entry.name} est posé ${places.length} fois`),
      ok(rightOption(exo) === places[0], `${entry.name} est ${places[0]}, la bonne option est ${rightOption(exo)}`),
      ok(allPlaces.length === 3 && same(optionsOf(exo), allPlaces), `les choix : ${optionsOf(exo).join(" | ")}`),
    );
  },
  "ce1-plan-quoi": (exo) => {
    const plan = readPlan(exo.prompt);
    if (typeof plan === "string") return plan;
    const match = /^(Quel objet|Quel lieu|Quelle pièce) est (.+) \?$/u.exec(plan.question);
    if (!match) return `question inconnue : ${plan.question}`;
    const entry = entryOfSquare(plan, squareAt(plan, match[2]));
    if (!entry) return `rien ${match[2]} sur le plan`;
    return all(
      ok(match[1] === PLAN_T[plan.of].which, `« ${match[1]} » pour un plan ${plan.of}`),
      ok(rightOption(exo) === cap(entry.name), `${match[2]} il y a ${entry.name}, la bonne option est ${rightOption(exo)}`),
      ok(same(optionsOf(exo), plan.legend.map((candidate) => cap(candidate.name))), `les choix : ${optionsOf(exo).join(" | ")}`),
    );
  },
  "ce1-plan-compter": (exo) => {
    const plan = readPlan(exo.prompt);
    if (typeof plan === "string") return plan;
    const match = /^Combien de (\p{L}+) y a-t-il sur le plan \?$/u.exec(plan.question);
    const entry = match && plan.legend.find((candidate) => candidate.many === match[1]);
    if (!entry) return `question inconnue : ${plan.question}`;
    const count = placesOfSquare(plan, entry.square).length;
    return all(
      ok(count >= 2 && count <= 4, `${count} ${entry.many} sur le plan`),
      ok(rightOption(exo) === String(count), `il y a ${count} ${entry.many}, la bonne option est ${rightOption(exo)}`),
      ok(same(optionsOf(exo), [count, count + 1, count - 1].map(String)), `les choix : ${optionsOf(exo).join(" | ")}`),
      ok(plan.legend.filter((candidate) => candidate !== entry).every((candidate) => placesOfSquare(plan, candidate.square).length === 1), "les deux autres objets ne sont posés qu'une fois"),
    );
  },
  "ce1-plan-relier": (exo) => {
    const plan = readPlan(exo.prompt);
    if (typeof plan === "string") return plan;
    if (!/^Relie chaque (objet|lieu|pièce) à sa place\.$/u.test(plan.question)) return `question inconnue : ${plan.question}`;
    for (const pair of pairsOf(exo)) {
      const entry = plan.legend.find((candidate) => cap(candidate.name) === pair.left);
      if (!entry) return `objet inconnu : ${pair.left}`;
      const places = placesOfSquare(plan, entry.square);
      if (places.length !== 1 || places[0] !== pair.right) return `« ${pair.left} » est relié à « ${pair.right} », le plan dit « ${places.join(" | ")} »`;
    }
    return ok(pairsOf(exo).length === 3, "trois paires");
  },
  "ce1-plan-ecrire": (exo) => {
    const plan = readPlan(exo.prompt);
    if (typeof plan === "string") return plan;
    if (plan.question !== "Combien de cases vides y a-t-il ? Écris le nombre.") return `question inconnue : ${plan.question}`;
    const blank = plan.grid.flat().filter((cell) => cell === PLAN_EMPTY).length;
    return all(
      ok(exo.type === "short-answer", `type ${exo.type}`),
      ok(sameSeq(acceptedOf(exo), [String(blank)]), `le plan a ${blank} cases vides, les réponses admises ${acceptedOf(exo).join(" | ")}`),
      ok(exo.answerKey === String(blank), `clé ${exo.answerKey}`),
    );
  },
  "ce1-plan-ordre": (exo) => {
    const plan = readPlan(exo.prompt);
    if (typeof plan === "string") return plan;
    if (plan.question !== `Mets les ${PLAN_T[plan.of].nouns} du plan de gauche à droite.`) return `question inconnue : ${plan.question}`;
    const filled = plan.grid.filter((row) => row.some((cell) => cell !== PLAN_EMPTY));
    if (filled.length !== 1) return `${filled.length} lignes occupées`;
    const expected = filled[0].map((cell) => cap((entryOfSquare(plan, cell) ?? { name: "?" }).name));
    return all(ok(filled[0].every((cell) => cell !== PLAN_EMPTY), "la ligne n'a pas trois objets"), ok(sameSeq(sequenceOf(exo), expected), `la ligne dit ${expected.join(" > ")}, le gabarit dit ${sequenceOf(exo).join(" > ")}`));
  },
  "ce1-plan-trou": (exo) => {
    const plan = readPlan(exo.prompt);
    if (typeof plan === "string") return plan;
    if (plan.question !== "Complète la phrase.") return `question inconnue : ${plan.question}`;
    const match = /^(.+), il y a ___\.$/u.exec(textOf(exo));
    if (!match) return `phrase inconnue : ${textOf(exo)}`;
    const place = match[1].toLowerCase();
    const entry = entryOfSquare(plan, squareAt(plan, place));
    if (!entry) return `rien ${place} sur le plan`;
    return all(
      ok(match[1] === cap(place), "majuscule de la phrase"),
      ok(blankOf(exo).answer === entry.word, `${place} il y a ${entry.word}, le trou dit ${blankOf(exo).answer}`),
      ok(same(blankOf(exo).options, plan.legend.map((candidate) => candidate.word)), `les choix : ${blankOf(exo).options.join(" | ")}`),
    );
  },
  "ce1-plan-glisser": (exo) => {
    const plan = readPlan(exo.prompt);
    if (typeof plan === "string") return plan;
    if (!/^Glisse chaque (objet|lieu|pièce) en haut ou en bas\.$/u.test(plan.question)) return `question inconnue : ${plan.question}`;
    if (plan.grid.length !== 2) return `${plan.grid.length} lignes au lieu de 2`;
    for (const item of itemsOf(exo)) {
      const entry = plan.legend.find((candidate) => cap(candidate.name) === item.text);
      if (!entry) return `objet inconnu : ${item.text}`;
      const zone = plan.grid.findIndex((cells) => cells.includes(entry.square)) === 0 ? "En haut" : "En bas";
      if (item.correctZone !== zone) return `« ${item.text} » est rangé dans « ${item.correctZone} », le plan dit « ${zone} »`;
    }
    return all(ok(sameSeq(zonesOf(exo), ["En haut", "En bas"]), `cases ${zonesOf(exo).join(" | ")}`), ok(itemsOf(exo).length === 3 && itemsOf(exo).some((item) => item.correctZone === "En haut") && itemsOf(exo).some((item) => item.correctZone === "En bas"), "trois objets, au moins un sur chaque ligne"));
  },
  "ce1-plan-legende": checkQuestion(PLAN_FACT_T),
};

const KINDS = Object.keys(CHECKS) as GameKind[];
const TOPIC_KINDS: Record<string, string[]> = {
  "hi-ce1-temps": ["ce1-generation-ordre", "ce1-naissance", "ce1-ligne-ordre", "ce1-ligne-ecart", "ce1-mois-decalage", "ce1-generation-trou", "ce1-autrefois-qcm", "ce1-autrefois-relier", "ce1-autrefois-glisser", "ce1-autrefois-trou"],
  "hi-ce1-famille": ["ce1-lien-qcm", "ce1-lien-trou", "ce1-lien-relier", "ce1-famille-glisser", "ce1-famille-ordre", "ce1-souvenir-qcm", "ce1-souvenir-relier", "ce1-famille-compte"],
  "hi-ce1-ecole": ["ce1-source-qcm", "ce1-source-relier", "ce1-source-glisser", "ce1-source-trou", "ce1-ecole-ordre", "ce1-ecole-recent", "ce1-ecole-ecart"],
  "hi-ce1-quartier": ["ce1-mot-qcm", "ce1-mot-relier", "ce1-mot-glisser", "ce1-mot-trou", "ce1-village-ordre", "ce1-village-recent", "ce1-village-ecart"],
  "ge-ce1-orientation": ["ce1-oppose", "ce1-soleil", "ce1-face", "ce1-tourne", "ce1-boussole-ordre", "ce1-point-trou", "ce1-lieux-direction", "ce1-point-relier", "ce1-point-glisser"],
  "ge-ce1-saisons": ["ce1-mois-saison", "ce1-saison-glisser", "ce1-saison-fait", "ce1-saison-relier", "ce1-saison-ordre", "ce1-saison-trou"],
  "ge-ce1-eau-relief": ["ce1-eau-type", "ce1-eau-mot", "ce1-eau-glisser", "ce1-eau-relier", "ce1-eau-ville", "ce1-relief", "ce1-eau-trou"],
  "ge-ce1-plan": ["ce1-plan-ou", "ce1-plan-quoi", "ce1-plan-compter", "ce1-plan-ecrire", "ce1-plan-relier", "ce1-plan-ordre", "ce1-plan-trou", "ce1-plan-glisser", "ce1-plan-legende"],
};
const TOPIC_KEYS = Object.keys(TOPIC_KINDS);
const topicOfKind = (kind: string) => TOPIC_KEYS.find((key) => TOPIC_KINDS[key].includes(kind)) as string;
const entryOf = (key: string) => allProgrammeEntries().find((entry) => entry.topic.key === key)!;
const subjectOfKind = (kind: string) => entryOf(topicOfKind(kind)).subject.name;

describe("chaque gabarit de l'histoire et de la géographie du CE1 a sa vérification", () => {
  it("couvre exactement les soixante-trois gabarits, tous rangés dans une thématique", () => {
    expect(KINDS).toHaveLength(63);
    expect(Object.values(TOPIC_KINDS).flat().sort()).toEqual([...KINDS].sort());
    for (const kind of KINDS) expect(Object.keys(GAME_KINDS), kind).toContain(kind);
  });
});

describe("les gabarits de l'histoire et de la géographie du CE1 recalculent juste, depuis une table écrite à part", () => {
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
  it("n'écrivent aucun mois de bord (novembre, juin, juillet, octobre) parmi les mois de saison", () => {
    for (const edge of ["novembre", "juin", "juillet", "octobre"]) {
      expect(DRY_T).not.toContain(edge);
      expect(RAIN_T).not.toContain(edge);
    }
    expect(DRY_T.filter((month) => RAIN_T.includes(month))).toEqual([]);
  });

  it("ne donnent à chaque lien de famille qu'un seul nom, et un nom du bon genre", () => {
    const keys = LINK_T.map((row) => `${row[0]}|${row[1]}`);
    expect(new Set(keys).size).toBe(keys.length);
    for (const [role, , term] of LINK_T) {
      const feminine = role.startsWith("la ");
      expect(FEMININE_TERM.has(term) === feminine || term.startsWith("Cousin"), `${role} -> ${term}`).toBe(true);
    }
  });

  it("n'associent à chaque couple d'autrefois qu'une chose par époque, toutes différentes", () => {
    const tiles = NEED_T.flatMap((row) => [row[1], row[2]]);
    expect(new Set(tiles).size).toBe(tiles.length);
  });

  it("donnent à la boussole quatre directions qui se font face deux à deux", () => {
    for (const direction of Object.keys(VECTOR)) {
      const v = VECTOR[direction];
      expect(nameOfVector(turnRight(turnRight(v)))).toBe(nameOfVector(turnBack(v)));
      expect(nameOfVector(turnLeft(turnRight(v)))).toBe(direction);
    }
    expect(nameOfVector(turnRight(VECTOR.nord))).toBe("est");
    expect(nameOfVector(turnRight(VECTOR.est))).toBe("sud");
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
      payload.acceptedAnswers = [String(Number((payload.acceptedAnswers as string[])[0]) + 5)];
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

  it("voient aussi un énoncé abîmé : une année changée dans la chronologie, un quart de tour oublié, un carré déplacé", () => {
    const d = draws[130];
    const order = make("ce1-ligne-ordre" as GameKind, d) as unknown as Exo;
    const dated = datedOf(order.prompt);
    const swapped = { ...order, prompt: order.prompt.replace(String(dated[0].year), String(dated[1].year + 1)) };
    expect(CHECKS["ce1-ligne-ordre"](swapped)).not.toBeNull();

    const turn = make("ce1-tourne" as GameKind, { level: 3, seed: "mut-turn" }) as unknown as Exo;
    const forgotten = { ...turn, prompt: turn.prompt.replace(/ Tu (?:tournes à droite|tournes à gauche|fais demi-tour)\./u, "") };
    expect(CHECKS["ce1-tourne"](forgotten)).not.toBeNull();

    let moved = 0;
    for (const seed of [3, 7, 11, 19, 23, 29, 31, 37]) {
      const plan = make("ce1-plan-ou" as GameKind, { level: 2, seed: `mut:${seed}` }) as unknown as Exo;
      const lines = plan.prompt.split("\n");
      const turned = [lines[0], Array.from(lines[1]).reverse().join(""), ...lines.slice(2)].join("\n");
      if (turned === plan.prompt) continue;
      moved += 1;
      // Un plan retourné ligne par ligne change au moins une place : la bonne option ne suit plus.
      const verdict = CHECKS["ce1-plan-ou"]({ ...plan, prompt: turned });
      const row = Array.from(lines[1]);
      if (row.join("") !== row.slice().reverse().join("")) expect(verdict, plan.prompt).not.toBeNull();
    }
    expect(moved).toBeGreaterThan(0);
  });
});

// ===========================================================================
// LES RÈGLES COMMUNES
// ===========================================================================

describe("tous les gabarits de l'histoire et de la géographie du CE1", () => {
  const exos = KINDS.flatMap((kind) => draws.filter((_, i) => i % 3 === 0).map((d) => ({ kind, exo: make(kind, d) as unknown as Exo })));

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

  it("n'écrivent un émoji que dans le plan d'un énoncé, jamais sur une tuile ni dans un indice", () => {
    for (const { kind, exo } of exos) {
      if (!kind.startsWith("ce1-plan-") || kind === "ce1-plan-legende") expect(/\p{Extended_Pictographic}/u.test(exo.prompt), `${kind} : ${exo.prompt}`).toBe(false);
      for (const text of texts(exo)) {
        expect(/\p{Extended_Pictographic}/u.test(text), `${kind} : « ${text} »`).toBe(false);
        expect(text.includes("\uFE0F"), `${kind} : « ${text} »`).toBe(false);
      }
    }
  });

  it("proposent des choix tous différents, dont un seul est la bonne réponse", () => {
    for (const { kind, exo } of exos) {
      if (exo.payload.options) {
        const options = optionsOf(exo);
        expect(new Set(options).size, `${kind} : ${exo.prompt}`).toBe(options.length);
        expect(options.length, `${kind} : ${exo.prompt}`).toBeGreaterThanOrEqual(2);
        expect(options.length, `${kind} : ${exo.prompt}`).toBeLessThanOrEqual(3);
      }
      if (exo.payload.blanks) {
        const { options, answer } = blankOf(exo);
        expect(new Set(options).size, `${kind} : ${textOf(exo)}`).toBe(options.length);
        expect(options.filter((option) => option === answer), `${kind} : ${textOf(exo)}`).toHaveLength(1);
        expect(options.length, `${kind} : ${textOf(exo)}`).toBeGreaterThanOrEqual(2);
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

  it("ne font jamais comparer des années par le seul chiffre des centaines (1960 et 2000 : les centaines trompent)", () => {
    for (const { kind, exo } of exos) {
      if (!/\b\d{4}\b/.test(exo.prompt)) continue;
      for (const hint of exo.hints) if (/chiffre des centaines/.test(hint)) expect(hint, `${kind} : « ${hint} »`).toMatch(/milliers/);
    }
  });

  it("donnent trois indices différents, et se refont à l'identique avec la même graine", () => {
    for (const kind of KINDS) {
      const a = GAME_KINDS[kind].make(makeContext("CE1", 2, "graine"));
      const b = GAME_KINDS[kind].make(makeContext("CE1", 2, "graine"));
      expect(a).toEqual(b);
      expect(a.hints).toHaveLength(3);
      expect(new Set(a.hints).size, kind).toBe(3);
    }
  });

  it("passent le contrôleur au CE1 sans aucun défaut, à tous les niveaux", () => {
    for (const { kind, exo } of exos) {
      const defects = auditExercise({
        type: GAME_KINDS[kind].type,
        prompt: exo.prompt,
        payload: exo.payload,
        answerKey: exo.answerKey,
        hints: exo.hints,
        class: "CE1",
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
});

// ===========================================================================
// LES THÉMATIQUES DU PROGRAMME
// ===========================================================================

describe("les huit thématiques d'histoire et de géographie du CE1", () => {
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

  it("sont celles du CE1, et n'ont changé ni leur clé ni leur nombre de paliers", () => {
    for (const key of TOPIC_KEYS) {
      expect(entryOf(key).klass, key).toBe("CE1");
      expect(topicOf(key).palierCount, key).toBeUndefined();
    }
    expect(TOPIC_KEYS).toHaveLength(8);
  });

  it("sont parmi les thématiques du CE1 que le modèle n'écrit plus", () => {
    const allCode = allProgrammeEntries()
      .filter((entry) => entry.klass === "CE1" && (entry.topic.games ?? []).reduce((sum, spec) => sum + spec.count, 0) >= PALIER_SIZE)
      .map((entry) => entry.topic.key);
    for (const key of TOPIC_KEYS) expect(allCode, key).toContain(key);
  });

  it("fabriquent des paliers entiers, de dix exercices tous différents, qui passent le contrôleur et la table", () => {
    for (const key of TOPIC_KEYS) {
      for (let n = 0; n < 30; n++) {
        for (const palierIndex of [1, 2, 3, 4]) {
          const games = generateGames(topicOf(key).games ?? [], { klass: "CE1", palierIndex, palierCount: 4, seed: `${key}:${n}:${palierIndex}` });
          expect(games, `${key} palier ${palierIndex}`).toHaveLength(PALIER_SIZE);
          const questions = games.map((game) => `${game.prompt}|${JSON.stringify(game.payload)}`);
          expect(new Set(questions).size, `${key} #${n} palier ${palierIndex}`).toBe(questions.length);
          for (const game of games) {
            const defects = auditExercise({
              type: game.type,
              prompt: game.prompt,
              payload: game.payload,
              answerKey: game.answerKey,
              hints: game.hints,
              class: "CE1",
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
        const games = generateGames(topicOf(key).games ?? [], { klass: "CE1", palierIndex, palierCount: 4, seed: key });
        expect(new Set(games.map((game) => game.type)).size, `${key} palier ${palierIndex}`).toBeGreaterThanOrEqual(4);
      }
    }
  });

  it("gardent de quoi servir la démo du site : les quatre types de base, et l'ordre ou la réponse courte que la banque attend", () => {
    // La banque de la vitrine (`components/landing/__tests__/demo-bank.test.ts`) veut, sur une thématique tout en gabarits, un gabarit du type de chacun
    // de ses exercices : un ordre sur « L'histoire de ma famille », une réponse courte sur « Le plan de la classe et de l'école ».
    const typesOf = (key: string) => new Set((topicOf(key).games ?? []).map((spec) => GAME_KINDS[spec.kind].type));
    for (const key of TOPIC_KEYS) {
      for (const type of ["qcm", "drag-drop", "match", "fill-blank"]) expect(typesOf(key).has(type as never), `${key} : ${type}`).toBe(true);
    }
    expect(typesOf("hi-ce1-famille").has("order" as never)).toBe(true);
    expect(typesOf("ge-ce1-plan").has("short-answer" as never)).toBe(true);
  });

  it("refont chaque exercice raté par le code, sans le modèle", () => {
    for (const key of TOPIC_KEYS) {
      for (const spec of topicOf(key).games ?? []) {
        const origin = { kind: spec.kind, level: 3 };
        const again = regenerateGame(origin, "CE1", `reprise:${key}:${spec.kind}`);
        expect(again, spec.kind).not.toBeNull();
        expect(again!.type, spec.kind).toBe(GAME_KINDS[spec.kind].type);
      }
    }
  });
});
