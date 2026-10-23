/**
 * LA GÉOMÉTRIE DU CE1 : les droites parallèles et perpendiculaires, l'angle droit et l'équerre, le carré, le rectangle, le triangle et le cercle, les
 * instruments pour tracer (`ma-ce1-geometrie`).
 *
 * La thématique avait un jeu de code sur dix (le dessin à reproduire sur quadrillage, `pixel-copie`) ; les neuf autres exercices étaient écrits par le modèle.
 * Ici chaque gabarit repose sur un tableau FERMÉ de faits de géométrie dont la bonne réponse se lit sans deviner, et deux mauvais choix qui ne peuvent
 * pas être une deuxième bonne réponse.
 *
 * CE QUE CE FICHIER NE FAIT PAS SORTIR DE LA FICHE
 * - Quatre figures : le carré, le rectangle, le triangle, le cercle. Jamais un losange, un trapèze ni un polygone à cinq côtés.
 * - Quand la bonne réponse est le carré ou le rectangle, l'autre ne se propose JAMAIS dans les choix : un carré est aussi un rectangle, et la fiche les
 *   distingue par « quatre côtés de même longueur » et « deux longs côtés et deux courts côtés ».
 * - Un triangle peut avoir un angle droit : aucune question ne compte les angles droits d'un triangle.
 * - Des droites parallèles ou perpendiculaires, jamais « sécantes » (les perpendiculaires sont sécantes : deux bonnes réponses).
 * - Les instruments sont la règle (tracer, mesurer), l'équerre (angle droit), le compas (cercle). Une étiquette est un mot seul ou « article + forme »
 *   du catalogue du CI (le carré, le rectangle, le triangle, le cercle) : jamais « article + objet » absent du catalogue.
 * - Aucun indice n'écrit un chiffre ni le mot de la bonne réponse.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { type GameContext, type GeneratedGame } from "./shared";
import { type Hints } from "./tableaux";
import {
  binSort,
  factChoice,
  factGap,
  factWriteLine,
  GESTURE_STEP_HINTS,
  pickPairs,
  stepsByLevel,
  type Fact,
  type GapFact,
  type Steps,
  type WriteFact,
} from "./ce1SciencesOutils";

const FIGURE_HINTS: Hints = ["Pense au nombre de côtés de la figure.", "Compte aussi les sommets, c'est-à-dire les coins.", "Regarde si la figure a des angles droits."];
const LINE_HINTS: Hints = ["Pense à la façon dont les deux droites se placent.", "Imagine-les prolongées très loin des deux côtés.", "Si elles se rencontrent, regarde le coin qu'elles forment."];
const TOOL_HINTS: Hints = ["Pense à ce que fait chaque instrument.", "Chaque instrument sert à un seul travail.", "Imagine le geste de ta main."];
const COUNT_HINTS: Hints = ["Dessine la figure dans ta tête.", "Compte les côtés ou les sommets un par un.", "Si la question en cite deux, additionne leurs nombres."];
const GAP_HINTS: Hints = ["Lis la phrase en entier avant de choisir.", "Pense à la figure ou aux droites dont on parle.", "Teste chaque choix dans la phrase."];
const WRITE_HINTS: Hints = ["Dessine la figure dans ta tête.", "Compte les côtés ou les sommets un par un.", "Si la question en cite plusieurs, additionne leurs nombres."];

const fact = (question: string, answer: string, wrong: readonly [string, string], hints: Hints): Fact => ({ question, answer, wrong, hints });
const gap = (text: string, answer: string, wrong: readonly [string, string]): GapFact => ({ text, answer, wrong, hints: GAP_HINTS });
const write = (prompt: string, answer: string): WriteFact => ({ prompt, accepted: [answer], hints: WRITE_HINTS });

// ===========================================================================
// LES FIGURES
// ===========================================================================

/** Trois questions par palier ; le carré et le rectangle ne se proposent jamais ensemble. */
export const FIGURE_FACTS: readonly Fact[] = [
  // Palier 1
  fact("Quelle figure a trois côtés ?", "Le triangle", ["Le carré", "Le cercle"], FIGURE_HINTS),
  fact("Quelle figure n'a aucun côté droit et se trace au compas ?", "Le cercle", ["Le carré", "Le rectangle"], FIGURE_HINTS),
  fact("Quelle figure a quatre côtés de même longueur ?", "Le carré", ["Le triangle", "Le cercle"], FIGURE_HINTS),
  // Palier 2
  fact("Quelle figure a deux longs côtés et deux courts côtés ?", "Le rectangle", ["Le triangle", "Le cercle"], FIGURE_HINTS),
  fact("Quelle figure a quatre angles droits et quatre côtés de même longueur ?", "Le carré", ["Le triangle", "Le cercle"], FIGURE_HINTS),
  fact("Quelle figure a trois sommets ?", "Le triangle", ["Le carré", "Le rectangle"], FIGURE_HINTS),
  // Palier 3
  fact("Quelle figure a quatre sommets, quatre angles droits, deux longs côtés et deux courts côtés ?", "Le rectangle", ["Le triangle", "Le cercle"], FIGURE_HINTS),
  fact("Quelle figure n'a aucun sommet ?", "Le cercle", ["Le carré", "Le triangle"], FIGURE_HINTS),
  fact("Quelle figure a quatre sommets, quatre angles droits et des côtés tous égaux ?", "Le carré", ["Le triangle", "Le cercle"], FIGURE_HINTS),
  // Palier 4
  fact("Une page de cahier a quatre angles droits, deux longs côtés et deux courts côtés. Quelle est sa forme ?", "Le rectangle", ["Le triangle", "Le cercle"], FIGURE_HINTS),
  fact("Une pièce de monnaie ronde a la forme de quelle figure ?", "Le cercle", ["Le carré", "Le triangle"], FIGURE_HINTS),
  fact("Un fanion a trois côtés et trois sommets. Quelle est sa forme ?", "Le triangle", ["Le rectangle", "Le cercle"], FIGURE_HINTS),
];

/** « Quelle figure a trois côtés ? » : la figure parmi trois. */
export function makeCe1GeoFigure(ctx: GameContext): GeneratedGame {
  return factChoice(ctx, "ce1-geo-figure", "reconnaître une figure par ses côtés et ses angles", FIGURE_FACTS, 3);
}

// ===========================================================================
// LES DROITES
// ===========================================================================

/** Deux questions par palier ; les deux mots de la fiche sont « parallèles » et « perpendiculaires ». */
export const LINE_FACTS: readonly Fact[] = [
  // Palier 1
  fact("Comment s'appellent deux droites qui ne se croisent jamais ?", "Parallèles", ["Perpendiculaires", "Courbes"], LINE_HINTS),
  fact("Comment s'appellent deux droites qui se coupent en formant un angle droit ?", "Perpendiculaires", ["Parallèles", "Courbes"], LINE_HINTS),
  // Palier 2
  fact("Les deux rails d'une voie ferrée droite sont des droites comment ?", "Parallèles", ["Perpendiculaires", "Courbes"], LINE_HINTS),
  fact("Le bord du haut et le bord de côté d'une feuille sont des droites comment ?", "Perpendiculaires", ["Parallèles", "Courbes"], LINE_HINTS),
  // Palier 3
  fact("Les lignes d'une page de cahier sont des droites comment ?", "Parallèles", ["Perpendiculaires", "Courbes"], LINE_HINTS),
  fact("Le mur et le sol d'une pièce forment un coin. Ce sont des droites comment ?", "Perpendiculaires", ["Parallèles", "Courbes"], LINE_HINTS),
  // Palier 4
  fact("Dans un rectangle, deux côtés qui se font face sont des droites comment ?", "Parallèles", ["Perpendiculaires", "Courbes"], LINE_HINTS),
  fact("Dans un carré, deux côtés qui se suivent sont des droites comment ?", "Perpendiculaires", ["Parallèles", "Courbes"], LINE_HINTS),
];

/** « Comment s'appellent deux droites qui ne se croisent jamais ? » : parallèles ou perpendiculaires. */
export function makeCe1GeoLines(ctx: GameContext): GeneratedGame {
  return factChoice(ctx, "ce1-geo-droites", "distinguer des droites parallèles et perpendiculaires", LINE_FACTS, 2);
}

// ===========================================================================
// LES INSTRUMENTS
// ===========================================================================

/** Deux questions par palier ; l'équerre ne mesure pas, la règle ne trace pas de cercle. */
export const TOOL_FACTS: readonly Fact[] = [
  // Palier 1
  fact("Avec quoi trace-t-on un trait bien droit ?", "Règle", ["Compas", "Gomme"], TOOL_HINTS),
  fact("Avec quoi trace-t-on un cercle ?", "Compas", ["Règle", "Gomme"], TOOL_HINTS),
  // Palier 2
  fact("Avec quoi vérifie-t-on qu'un angle est droit ?", "Équerre", ["Compas", "Gomme"], TOOL_HINTS),
  fact("Avec quoi mesure-t-on la longueur d'un segment ?", "Règle", ["Compas", "Gomme"], TOOL_HINTS),
  // Palier 3
  fact("Avec quoi trace-t-on un angle droit ?", "Équerre", ["Compas", "Gomme"], TOOL_HINTS),
  fact("Quel instrument a une pointe et une mine pour tourner autour d'un point ?", "Compas", ["Règle", "Équerre"], TOOL_HINTS),
  // Palier 4
  fact("Pour tracer un carré, on utilise la règle et quoi d'autre ?", "Équerre", ["Compas", "Gomme"], TOOL_HINTS),
  fact("Pour tracer un rond parfait, on utilise quoi ?", "Compas", ["Règle", "Équerre"], TOOL_HINTS),
];

/** « Avec quoi trace-t-on un cercle ? » : l'instrument parmi trois. */
export function makeCe1GeoTool(ctx: GameContext): GeneratedGame {
  return factChoice(ctx, "ce1-geo-outil", "choisir l'instrument du géomètre", TOOL_FACTS, 2);
}

// ===========================================================================
// COMPTER LES CÔTÉS ET LES SOMMETS
// ===========================================================================

/** Deux questions par palier. Aucun angle droit de triangle. */
export const COUNT_FACTS: readonly Fact[] = [
  // Palier 1
  fact("Combien de côtés a un triangle ?", "3", ["4", "2"], COUNT_HINTS),
  fact("Combien de côtés a un carré ?", "4", ["3", "5"], COUNT_HINTS),
  // Palier 2
  fact("Combien de sommets a un rectangle ?", "4", ["3", "2"], COUNT_HINTS),
  fact("Combien d'angles droits a un carré ?", "4", ["2", "3"], COUNT_HINTS),
  // Palier 3
  fact("Combien de sommets a un triangle ?", "3", ["4", "5"], COUNT_HINTS),
  fact("Combien de côtés a un cercle ?", "0", ["1", "2"], COUNT_HINTS),
  // Palier 4
  fact("Combien d'angles droits a un rectangle ?", "4", ["2", "3"], COUNT_HINTS),
  fact("Combien de côtés ont ensemble un carré et un triangle ?", "7", ["6", "8"], COUNT_HINTS),
];

/** « Combien de côtés a un triangle ? » : un nombre parmi trois. */
export function makeCe1GeoCount(ctx: GameContext): GeneratedGame {
  return factChoice(ctx, "ce1-geo-compter", "compter les côtés, les sommets et les angles droits", COUNT_FACTS, 2);
}

// ===========================================================================
// LA PHRASE À TROUS
// ===========================================================================

/** Deux phrases par palier. */
export const GAP_FACTS: readonly GapFact[] = [
  // Palier 1
  gap("Un carré a ___ côtés de même longueur.", "4", ["3", "5"]),
  gap("Un triangle a ___ sommets.", "3", ["2", "4"]),
  // Palier 2
  gap("Un rectangle a ___ angles droits.", "4", ["2", "3"]),
  gap("Des droites ___ ne se croisent jamais.", "parallèles", ["perpendiculaires", "courbes"]),
  // Palier 3
  gap("Des droites ___ se coupent en formant un angle droit.", "perpendiculaires", ["parallèles", "courbes"]),
  gap("Un cercle a ___ sommet.", "0", ["1", "2"]),
  // Palier 4
  gap("Les côtés qui se font face dans un rectangle sont ___.", "parallèles", ["perpendiculaires", "courbes"]),
  gap("Deux côtés qui se suivent dans un carré sont ___.", "perpendiculaires", ["parallèles", "courbes"]),
];

/** « Un carré a ___ côtés de même longueur. » : le mot ou le nombre qui manque. */
export function makeCe1GeoGap(ctx: GameContext): GeneratedGame {
  return factGap(ctx, "ce1-geo-trou", "compléter une phrase de géométrie", GAP_FACTS, 2);
}

// ===========================================================================
// RELIER
// ===========================================================================

/** Quatre figures et deux paires de droites, chacune avec ce qui la distingue. */
export const LINK_POOL: readonly (readonly [string, string])[] = [
  ["Le carré", "4 côtés de même longueur"],
  ["Le rectangle", "2 longs côtés et 2 courts côtés"],
  ["Le triangle", "3 côtés et 3 sommets"],
  ["Le cercle", "aucun côté ni sommet"],
  ["Droites parallèles", "ne se croisent jamais"],
  ["Droites perpendiculaires", "se coupent en angle droit"],
];

/** « Relie chaque figure à ce qui la décrit. » : trois paires prises dans la banque. */
export function makeCe1GeoLinks(ctx: GameContext): GeneratedGame {
  return pickPairs(ctx, "ce1-geo-relier", "relier une figure ou des droites à leur description", "Relie chaque figure ou chaque paire de droites à ce qui la décrit.", LINK_POOL, [
    "Pense à ce que chaque figure ou chaque paire de droites a de particulier.",
    "Compte les côtés quand tu hésites.",
    "Commence par la paire dont tu es le plus sûr.",
  ]);
}

// ===========================================================================
// GLISSER
// ===========================================================================

/** Des objets qui ont des angles droits, et des objets ronds qui n'en ont aucun. */
export const ANGLE_OBJECTS = {
  withRight: ["Page de cahier", "Porte de la classe", "Tableau noir", "Carreau du cahier", "Fenêtre de la classe"],
  withoutRight: ["Pièce de monnaie", "Roue de vélo", "Assiette", "Bouton de chemise", "Couvercle de casserole"],
} as const;

/** Des situations de droites parallèles, et des situations de droites perpendiculaires. */
export const LINE_SITUATIONS = {
  parallel: ["Rails d'une voie ferrée", "Lignes d'un cahier", "Barreaux d'une échelle", "Bords d'une règle", "Bords d'une route droite"],
  perpendicular: ["Haut et côté du tableau", "Mur et sol de la classe", "Coin d'une feuille", "Montant et barreau d'une échelle", "Bords voisins d'une porte"],
} as const;

/** « Glisse chaque objet dans la bonne case. » : avec ou sans angle droit aux deux premiers paliers, droites parallèles ou perpendiculaires ensuite. */
export function makeCe1GeoSort(ctx: GameContext): GeneratedGame {
  if (ctx.level <= 2) {
    return binSort(
      ctx,
      "ce1-geo-glisser",
      "classer des objets selon leurs angles droits",
      "Glisse chaque objet dans la bonne case.",
      { zone: "A des angles droits", tiles: ANGLE_OBJECTS.withRight },
      { zone: "N'a aucun angle droit", tiles: ANGLE_OBJECTS.withoutRight },
      ["Pense à la forme de chaque chose.", "Cherche s'il y a un coin comme celui d'une feuille.", "Commence par la chose dont tu es le plus sûr."],
    );
  }
  return binSort(
    ctx,
    "ce1-geo-glisser",
    "classer des situations de droites parallèles et perpendiculaires",
    "Glisse chaque situation dans la bonne case.",
    { zone: "Droites parallèles", tiles: LINE_SITUATIONS.parallel },
    { zone: "Droites perpendiculaires", tiles: LINE_SITUATIONS.perpendicular },
    ["Imagine les deux droites prolongées très loin.", "Regarde si elles se rencontrent un jour.", "Si elles forment un coin, c'est l'autre case."],
  );
}

// ===========================================================================
// L'ORDRE DES ÉTAPES
// ===========================================================================

const step = (prompt: string, sequence: readonly string[]): Steps => ({ prompt, sequence, hints: GESTURE_STEP_HINTS });

/** Trois étapes aux deux premiers paliers, quatre aux deux derniers : une seule suite possible. */
export const SHORT_STEPS: readonly Steps[] = [
  step("Mets dans le bon ordre les étapes pour tracer un segment.", ["Je place deux points sur la feuille.", "Je pose la règle sur les deux points.", "Je trace le trait le long de la règle."]),
  step("Mets dans le bon ordre les étapes pour vérifier un angle droit.", ["Je pose l'équerre sur l'angle.", "Je regarde si les deux côtés touchent l'équerre.", "Je dis si l'angle est droit ou non."]),
  step("Mets dans le bon ordre les étapes pour tracer un cercle.", ["Je pose la pointe du compas sur un point.", "Je tourne le compas autour de ce point.", "Je lève le compas quand le tour est fini."]),
  step("Mets dans le bon ordre les étapes pour mesurer un segment.", ["Je place le zéro de la règle au début du segment.", "Je regarde où le segment se termine.", "Je lis le nombre en face de la fin."]),
];

export const LONG_STEPS: readonly Steps[] = [
  step("Mets dans le bon ordre les étapes pour tracer un carré.", ["Je trace un côté avec la règle.", "Je trace un angle droit avec l'équerre.", "Je reporte la même longueur sur le nouveau côté.", "Je ferme la figure avec la règle."]),
  step("Mets dans le bon ordre les étapes pour tracer un rectangle.", ["Je trace le premier côté avec la règle.", "Je trace un angle droit avec l'équerre.", "Je trace les deux autres côtés.", "Je repasse les traits au crayon."]),
  step("Mets dans le bon ordre les étapes pour tracer un triangle.", ["Je place les points A, B et C.", "Je trace le côté AB.", "Je trace le côté BC.", "Je trace le côté CA."]),
  step("Mets dans le bon ordre les étapes pour construire une figure demandée.", ["Je lis la consigne.", "Je choisis les instruments.", "Je trace la figure.", "Je vérifie avec la règle et l'équerre."]),
];

/** « Mets dans le bon ordre les étapes pour tracer un cercle. » : trois ou quatre gestes dans un seul ordre. */
export function makeCe1GeoSteps(ctx: GameContext): GeneratedGame {
  return stepsByLevel(ctx, "ce1-geo-etapes", "ranger les étapes d'un tracé", SHORT_STEPS, LONG_STEPS);
}

// ===========================================================================
// ÉCRIRE LE NOMBRE
// ===========================================================================

/** Deux questions par palier ; les deux derniers paliers additionnent les côtés ou les sommets de plusieurs figures. */
export const WRITE_FACTS: readonly WriteFact[] = [
  // Palier 1
  write("Combien de côtés a un triangle ? Écris le nombre.", "3"),
  write("Combien de côtés a un rectangle ? Écris le nombre.", "4"),
  // Palier 2
  write("Combien de sommets a un carré ? Écris le nombre.", "4"),
  write("Combien d'angles droits a un carré ? Écris le nombre.", "4"),
  // Palier 3
  write("Un triangle et un carré ont ensemble combien de côtés ? Écris le nombre.", "7"),
  write("Un rectangle et un triangle ont ensemble combien de sommets ? Écris le nombre.", "7"),
  // Palier 4
  write("Deux carrés ont ensemble combien de côtés ? Écris le nombre.", "8"),
  write("Un carré, un triangle et un rectangle ont ensemble combien de côtés ? Écris le nombre.", "11"),
];

/** « Un triangle et un carré ont ensemble combien de côtés ? Écris le nombre. » : une réponse courte. */
export function makeCe1GeoWrite(ctx: GameContext): GeneratedGame {
  return factWriteLine(ctx, "ce1-geo-ecrire", "écrire le nombre de côtés ou de sommets", WRITE_FACTS, 2);
}
