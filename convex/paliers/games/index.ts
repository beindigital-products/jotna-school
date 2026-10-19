/**
 * LES JEUX FABRIQUÉS PAR LE CODE — le catalogue et la fabrique.
 *
 * Une thématique du programme (`convex/programme`) dit quels jeux mêler à
 * ses paliers, et combien : « trois frises de couleurs, deux dessins de
 * mémoire ». Le reste du palier vient du modèle de langue, comme avant. Une
 * thématique tout en jeux (« Grave ou aigu ? ») n'appelle pas le modèle du
 * tout : rien à payer, rien à attendre.
 *
 * MODULE PUR : la génération d'un palier (`paliers/index.ts`), la
 * régénération d'un exercice raté et les tests l'appellent de la même façon.
 */
import type { VisibleClassName } from "../../curriculum";
import { PALIER_SIZE } from "../scoring";
import {
  makeBodyCommand,
  makeBodyGap,
  makeBodyLinks,
  makeBodySentence,
  makeBodySort,
  makeBodyWord,
  makeClassFrench,
  makeClassGap,
  makeClassLinks,
  makeClassQuestion,
  makeClassSentence,
  makeClassSort,
  makeClassWord,
  makeFamilyClue,
  makeFamilyGap,
  makeFamilyLinks,
  makeFamilySentence,
  makeFamilySort,
  makeFamilyWord,
  makeFoodFrench,
  makeFoodFrenchGap,
  makeFoodGap,
  makeFoodLinks,
  makeFoodSentence,
  makeFoodSort,
  makeFoodWord,
  makeNumberAge,
  makeNumberCount,
  makeNumberDigit,
  makeNumberLinks,
  makeNumberNext,
  makeEnglishNumberOrder,
  makeNumberSort,
  makeNumberWord,
  makeNumberWrite,
} from "./anglais";
import {
  makeWriteArticle,
  makeWriteCount,
  makeWriteNumberSort,
  makeWriteOrder,
  makeWritePluralLinks,
  makeWriteText,
  makeWriteWellWritten,
  makeWriteWord,
} from "./ecriture";
import {
  makeReadAssemble,
  makeReadGap,
  makeReadLetter,
  makeReadLinks,
  makeReadPicture,
  makeReadSentence,
  makeReadSound,
  makeReadSoundSort,
  makeReadSyllables,
} from "./lecture";
import { makeColorPair, makeColorPick, makeColorResult, makeWarmCold } from "./colors";
import { makeAddEmojis, makeCompareRows, makeCountEmojis, makeNumberGroups, makeTakeAwayEmojis } from "./counting";
import { makeCorners, makeRowOrdinal, makeRowPosition, makeShapeName, makeSolidName, makeSortShapes } from "./geometry";
import {
  makeBelongs,
  makeColorOfThing,
  makeCompareAnimals,
  makeMoment,
  makeNeighbourDay,
  makeOddOneOut,
  makeOrderAnimals,
} from "./sorting";
import {
  makeBiggest,
  makeComplement,
  makeDoubleHalf,
  makeNeighbour,
  makeNumberInWords,
  makeNumberOrder,
  makeTensAndUnits,
  makeWrittenCalc,
} from "./numbers";
import {
  makeBeatCount,
  makeDuration,
  makeMelody,
  makePitch,
  makeRhythmPattern,
  makeSameDifferent,
  makeVolume,
} from "./listen";
import { makeFreshFrise, makeNumberSuite } from "./patterns";
import {
  makeCountInScene,
  makeDatumInImage,
  makeDatumOrQuestion,
  makeFindDatum,
  makeProblemQuestion,
  makeSolveWithUseless,
  makeTableCell,
  makeTableNumber,
  makeUselessDatum,
  makeWhoHas,
} from "./problems";
import {
  makeFirstLetter,
  makeCapitalMatch,
  makeFirstSyllable,
  makeLastSyllable,
  makeLetterCount,
  makeLetterOrder,
  makeMissingLetter,
  makeMissingSyllable,
  makeSentenceGap,
  makeSyllableCount,
  makeSyllableOrder,
  makeSyllableToWord,
  makeWordFromSyllable,
  makeWordToPicture,
} from "./words";
import { makeColorByNumber, makePixelCopy, makePixelMemory, makePixelSymmetry } from "./pixel";
import {
  makeBeside,
  makeBetween,
  makeFrontBehind,
  makeFrontBehindSort,
  makeGridBlank,
  makeGridCell,
  makeGridMove,
  makeGridPosition,
  makeGridSort,
  makeLandmarkOdd,
  makeLandmarkPick,
  makeLandmarkRoute,
  makeLandmarkSort,
  makeNearFar,
  makeOnUnder,
  makePointing,
  makePointingLinks,
  makeQueueOrder,
  makeRowCopy,
  makeRowNeighbour,
  makeSideSort,
} from "./espace";
import {
  makeActivityMoment,
  makeActivityMoments,
  makeActivityOrder,
  makeBeforeAfter,
  makeBeforeAfterMoments,
  makeCycleOrder,
  makeDayLinks,
  makeDayRank,
  makeDayZones,
  makeGrowLinks,
  makeMissingDay,
  makeMomentNeighbour,
  makeMomentOrder,
  makeRelativeBlank,
  makeRelativeDay,
  makeSchoolOrRest,
  makeTimeWords,
  makeWeekOrder,
} from "./temps";
import {
  makeCalendarDay,
  makeDurationLinks,
  makeDurationOrder,
  makeDurationSort,
  makeDurationUnits,
  makeFrequencyBlank,
  makeFrequencyLinks,
  makeFrequencyOrder,
  makeFrequencyPick,
  makeFrequencySort,
  makeLongerDuration,
  makeMissingMonth,
  makeMonthGap,
  makeMonthLinks,
  makeMonthNeighbour,
  makeMonthOrder,
  makeMonthRank,
  makeMonthsAroundOne,
  makeReadDate,
  makeTimetableBlank,
  makeTimetableHour,
  makeTimetableNeighbour,
  makeTimetableOrder,
  makeWeekTimetable,
} from "./calendrier";
import {
  makeCloserFarther,
  makeCompareMeasures,
  makeDistanceOrder,
  makeNearestBlank,
  makePlaceFunctions,
  makePlanBlank,
  makePlanCount,
  makePlanLinks,
  makePlanSort,
  makePlanWhat,
  makePlanWhere,
  makeRouteBlank,
  makeRouteOrder,
  makeRoutePassBy,
  makeRouteSort,
  makeShortestPath,
  makeStepsDifference,
  makeStreetBlank,
  makeStreetOrder,
  makeStreetQuestion,
  makeStreetSort,
  makeTurn,
  makeTwoMoves,
  makeWhoIsNearest,
} from "./quartier";
import {
  gameLevel,
  makeContext,
  type GameContext,
  type GameExerciseType,
  type GameLevel,
  type GeneratedGame,
} from "./shared";
import type { GameOrigin } from "./types";

export type { GeneratedGame, GameExerciseType } from "./shared";

export const GAME_KINDS = {
  "frise-couleurs": {
    label: "Frise de couleurs",
    type: "pattern",
    make: (ctx: GameContext) => makeFreshFrise(ctx, "couleurs"),
  },
  "frise-formes": {
    label: "Frise de formes",
    type: "pattern",
    make: (ctx: GameContext) => makeFreshFrise(ctx, "formes"),
  },
  "frise-objets": {
    label: "Frise d'images",
    type: "pattern",
    make: (ctx: GameContext) => makeFreshFrise(ctx, "objets"),
  },
  "frise-rythme": {
    label: "Rythme écrit à compléter",
    type: "pattern",
    make: (ctx: GameContext) => makeFreshFrise(ctx, "rythme"),
  },
  "suite-nombres": { label: "Suite de nombres", type: "pattern", make: makeNumberSuite },
  "pixel-copie": { label: "Reproduire un dessin", type: "pixel-art", make: makePixelCopy },
  "pixel-memoire": { label: "Dessin de mémoire", type: "pixel-art", make: makePixelMemory },
  "pixel-symetrie": { label: "Symétrie", type: "pixel-art", make: makePixelSymmetry },
  "coloriage-magique": { label: "Coloriage magique", type: "pixel-art", make: makeColorByNumber },
  "ecoute-hauteur": { label: "Grave ou aigu", type: "listen", make: makePitch },
  "ecoute-duree": { label: "Long ou court", type: "listen", make: makeDuration },
  "ecoute-intensite": { label: "Fort ou doux", type: "listen", make: makeVolume },
  "ecoute-rythme": { label: "Compter les coups", type: "listen", make: makeBeatCount },
  "ecoute-motif-rythmique": { label: "Reconnaître un rythme", type: "listen", make: makeRhythmPattern },
  "ecoute-melodie": { label: "La mélodie monte ou descend", type: "listen", make: makeMelody },
  "ecoute-pareil": { label: "Pareil ou différent", type: "listen", make: makeSameDifferent },
  "couleurs-reconnaitre": { label: "Reconnaître une couleur", type: "color-mix", make: makeColorPick },
  "couleurs-melange": { label: "Mélanger deux couleurs", type: "color-mix", make: makeColorResult },
  "couleurs-melange-inverse": { label: "Retrouver un mélange", type: "color-mix", make: makeColorPair },
  "couleurs-chaudes-froides": { label: "Couleurs chaudes et froides", type: "color-mix", make: makeWarmCold },
  // Les gabarits : des exercices classiques, écrits à partir d'un vocabulaire fermé.
  "syllabes-ordre": { label: "Remettre des syllabes dans l'ordre", type: "order", make: makeSyllableOrder },
  "lettres-ordre": { label: "Remettre des lettres dans l'ordre", type: "order", make: makeLetterOrder },
  "syllabe-initiale": { label: "Première syllabe d'un mot", type: "qcm", make: makeFirstSyllable },
  "lettre-initiale": { label: "Première lettre d'un mot", type: "qcm", make: makeFirstLetter },
  "syllabe-finale": { label: "Dernière syllabe d'un mot", type: "qcm", make: makeLastSyllable },
  "mot-syllabe": { label: "Mot qui commence par une syllabe", type: "qcm", make: makeWordFromSyllable },
  "syllabes-compter": { label: "Compter les syllabes", type: "qcm", make: makeSyllableCount },
  "lettres-compter": { label: "Compter les lettres", type: "qcm", make: makeLetterCount },
  "syllabe-manquante": { label: "Syllabe qui manque", type: "fill-blank", make: makeMissingSyllable },
  "lettre-manquante": { label: "Lettre qui manque", type: "fill-blank", make: makeMissingLetter },
  "phrase-trou": { label: "Phrase à trou", type: "fill-blank", make: makeSentenceGap },
  "syllabe-mot": { label: "Relier une syllabe et un mot", type: "match", make: makeSyllableToWord },
  "mot-image": { label: "Relier un mot et son image", type: "match", make: makeWordToPicture },
  "majuscule-minuscule": { label: "Relier une minuscule et sa majuscule", type: "match", make: makeCapitalMatch },
  "compter-emojis": { label: "Compter des dessins", type: "qcm", make: makeCountEmojis },
  "ajouter-emojis": { label: "Ajouter des dessins", type: "qcm", make: makeAddEmojis },
  "enlever-emojis": { label: "Enlever des dessins", type: "qcm", make: makeTakeAwayEmojis },
  "rangee-plus-moins": { label: "La rangée qui en a le plus ou le moins", type: "qcm", make: makeCompareRows },
  "forme-nom": { label: "Le nom d'une forme", type: "qcm", make: makeShapeName },
  "forme-coins": { label: "Les coins d'une forme", type: "qcm", make: makeCorners },
  "solide-nom": { label: "Le nom d'un solide", type: "qcm", make: makeSolidName },
  "classer-formes": { label: "Classer des formes", type: "drag-drop", make: makeSortShapes },
  "rangee-position": { label: "Gauche, droite, milieu dans une rangée", type: "qcm", make: makeRowPosition },
  "rangee-ordinal": { label: "Le rang dans une rangée", type: "qcm", make: makeRowOrdinal },
  "intrus": { label: "Celui qui n'est pas comme les autres", type: "qcm", make: makeOddOneOut },
  "appartient": { label: "Est-ce un fruit, un animal…", type: "qcm", make: makeBelongs },
  "couleur-objet": { label: "Qu'est-ce qui est de cette couleur", type: "qcm", make: makeColorOfThing },
  "comparer-mesure": { label: "Le plus lourd, le plus léger, le plus grand, le plus petit", type: "qcm", make: makeCompareAnimals },
  "animaux-ordre": { label: "Ranger des animaux", type: "order", make: makeOrderAnimals },
  "moment-journee": { label: "Le moment de la journée", type: "qcm", make: makeMoment },
  "jour-voisin": { label: "Le jour d'avant ou d'après", type: "qcm", make: makeNeighbourDay },
  "nombre-groupe": { label: "Relier un nombre et un groupe de dessins", type: "match", make: makeNumberGroups },
  "nombres-ordre": { label: "Ranger des nombres", type: "order", make: makeNumberOrder },
  "nombre-voisin": { label: "Le nombre juste avant ou après", type: "qcm", make: makeNeighbour },
  "nombre-plus-grand": { label: "Le plus grand ou le plus petit nombre", type: "qcm", make: makeBiggest },
  "nombre-en-lettres": { label: "Lire un nombre écrit en lettres", type: "qcm", make: makeNumberInWords },
  "double-moitie": { label: "Le double ou la moitié", type: "qcm", make: makeDoubleHalf },
  "complement": { label: "Combien faut-il ajouter", type: "qcm", make: makeComplement },
  "calcul-ecrit": { label: "Une addition ou une soustraction écrite", type: "qcm", make: makeWrittenCalc },
  "dizaine-unites": { label: "Une dizaine et des unités", type: "qcm", make: makeTensAndUnits },
  // Les petits problèmes du CI (`problems.ts`) : l'image, le tableau, la donnée et la question, la donnée inutile.
  "image-compter": { label: "Compter une sorte de dessins dans une image", type: "qcm", make: makeCountInScene },
  "image-qui": { label: "Qui en a le plus, le moins, autant", type: "qcm", make: makeWhoHas },
  "tableau-case": { label: "La case qui manque dans un tableau à double entrée", type: "qcm", make: makeTableCell },
  "tableau-nombre": { label: "Lire un nombre dans un tableau", type: "qcm", make: makeTableNumber },
  "image-donnee": { label: "Un petit problème dont l'image donne un nombre", type: "qcm", make: makeDatumInImage },
  "probleme-donnee": { label: "Retrouver une donnée du problème", type: "qcm", make: makeFindDatum },
  "donnee-ou-question": { label: "Ce que je sais, ce que je cherche", type: "drag-drop", make: makeDatumOrQuestion },
  "probleme-question": { label: "La question qui va avec le problème", type: "fill-blank", make: makeProblemQuestion },
  "donnee-inutile": { label: "Le nombre qui ne sert pas", type: "qcm", make: makeUselessDatum },
  "probleme-inutile": { label: "Résoudre sans la donnée inutile", type: "qcm", make: makeSolveWithUseless },
  // Le temps (`temps.ts`) : les jours de la semaine, hier et demain, les moments de la journée, avant et après.
  "jours-ordre": { label: "Ranger les jours de la semaine", type: "order", make: makeWeekOrder },
  "jour-manquant": { label: "Le jour qui manque dans la semaine", type: "fill-blank", make: makeMissingDay },
  "jour-ecole-repos": { label: "Jour d'école ou jour de repos", type: "drag-drop", make: makeSchoolOrRest },
  "jour-rang": { label: "Le rang d'un jour dans la semaine", type: "qcm", make: makeDayRank },
  "jours-relier": { label: "Relier un jour et le jour d'après", type: "match", make: makeDayLinks },
  "jour-relatif": { label: "Quel jour était hier, quel jour sera demain", type: "qcm", make: makeRelativeDay },
  "jour-hier-demain": { label: "Hier, aujourd'hui ou demain", type: "drag-drop", make: makeDayZones },
  "jour-trou": { label: "Une phrase à trou sur hier et demain", type: "fill-blank", make: makeRelativeBlank },
  "temps-ordre": { label: "Ranger hier, aujourd'hui, demain", type: "order", make: makeTimeWords },
  "activite-moment": { label: "À quel moment de la journée", type: "qcm", make: makeActivityMoment },
  "moment-ordre": { label: "Ranger les moments de la journée", type: "order", make: makeMomentOrder },
  "activite-ordre": { label: "Ranger les activités d'une journée", type: "order", make: makeActivityOrder },
  "moment-voisin": { label: "Le moment d'avant ou d'après", type: "qcm", make: makeMomentNeighbour },
  "activite-moments": { label: "Glisser les activités dans les moments", type: "drag-drop", make: makeActivityMoments },
  "cycle-ordre": { label: "Ranger ce qui grandit", type: "order", make: makeCycleOrder },
  "avant-apres": { label: "Ce qui vient avant ou après", type: "qcm", make: makeBeforeAfter },
  "avant-apres-glisser": { label: "Avant ou après un moment", type: "drag-drop", make: makeBeforeAfterMoments },
  "grandir-relier": { label: "Relier un petit et l'animal qu'il devient", type: "match", make: makeGrowLinks },
  // L'espace (`espace.ts`) : sur et sous, devant et derrière, droite et gauche, les repères, le quadrillage.
  "sur-sous": { label: "Sur ou sous", type: "qcm", make: makeOnUnder },
  "devant-derriere": { label: "Devant ou derrière", type: "qcm", make: makeFrontBehind },
  "position-glisser": { label: "Devant ou derrière un repère", type: "drag-drop", make: makeFrontBehindSort },
  "file-ordre": { label: "Mettre une file dans l'ordre", type: "order", make: makeQueueOrder },
  "a-cote": { label: "À côté de", type: "qcm", make: makeBeside },
  "entre": { label: "Entre deux dessins", type: "qcm", make: makeBetween },
  "pres-loin": { label: "Le plus près, le plus loin", type: "qcm", make: makeNearFar },
  "rangee-voisin": { label: "Juste à droite ou juste à gauche", type: "qcm", make: makeRowNeighbour },
  "doigt-direction": { label: "Le doigt qui montre une direction", type: "qcm", make: makePointing },
  "doigt-relier": { label: "Relier un doigt et sa direction", type: "match", make: makePointingLinks },
  "gauche-droite-glisser": { label: "À gauche ou à droite d'un dessin", type: "drag-drop", make: makeSideSort },
  "rangee-copie": { label: "Remettre une rangée dans le même ordre", type: "order", make: makeRowCopy },
  "repere-glisser": { label: "Repère fixe ou repère mobile", type: "drag-drop", make: makeLandmarkSort },
  "repere-qcm": { label: "Lequel ne bouge pas", type: "qcm", make: makeLandmarkPick },
  "repere-intrus": { label: "L'intrus parmi les repères", type: "qcm", make: makeLandmarkOdd },
  "repere-trajet": { label: "Les repères d'un trajet", type: "order", make: makeLandmarkRoute },
  "grille-position": { label: "Une place dans un quadrillage", type: "qcm", make: makeGridPosition },
  "grille-ligne-colonne": { label: "La ligne et la colonne d'une case", type: "qcm", make: makeGridCell },
  "grille-trou": { label: "Compléter une phrase sur un quadrillage", type: "fill-blank", make: makeGridBlank },
  "pion-deplacement": { label: "Déplacer un pion sur un quadrillage", type: "qcm", make: makeGridMove },
  "grille-glisser": { label: "Haut et bas, gauche et droite d'un quadrillage", type: "drag-drop", make: makeGridSort },
  // Le calendrier, les durées, les fréquences et l'emploi du temps du CP (`calendrier.ts`).
  "mois-ordre": { label: "Ranger les mois de l'année", type: "order", make: makeMonthOrder },
  "mois-voisin": { label: "Le mois d'avant ou d'après", type: "qcm", make: makeMonthNeighbour },
  "mois-rang": { label: "Le rang d'un mois dans l'année", type: "qcm", make: makeMonthRank },
  "mois-trou": { label: "Le mois qui manque dans l'année", type: "fill-blank", make: makeMissingMonth },
  "mois-ecart": { label: "Dans combien de mois, un nombre à écrire", type: "short-answer", make: makeMonthGap },
  "date-lire": { label: "Lire une date", type: "qcm", make: makeReadDate },
  "calendrier-jour": { label: "Quel jour est une date du calendrier", type: "qcm", make: makeCalendarDay },
  "mois-relier": { label: "Relier un mois et le mois d'après", type: "match", make: makeMonthLinks },
  "mois-avant-apres": { label: "Avant ou après un mois", type: "drag-drop", make: makeMonthsAroundOne },
  "duree-plus-long": { label: "Quelle durée est la plus longue ou la plus courte", type: "qcm", make: makeLongerDuration },
  "duree-ordre": { label: "Ranger des durées", type: "order", make: makeDurationOrder },
  "duree-relier": { label: "Relier une durée et son nombre", type: "match", make: makeDurationLinks },
  "duree-glisser": { label: "Plus court ou plus long qu'une durée", type: "drag-drop", make: makeDurationSort },
  "duree-unites": { label: "Ce que contient une durée", type: "fill-blank", make: makeDurationUnits },
  "frequence-glisser": { label: "Tous les jours, chaque semaine, chaque année", type: "drag-drop", make: makeFrequencySort },
  "frequence-qcm": { label: "Quand revient un moment", type: "qcm", make: makeFrequencyPick },
  "frequence-trou": { label: "Une phrase à trou sur ce qui revient", type: "fill-blank", make: makeFrequencyBlank },
  "frequence-relier": { label: "Relier un moment et sa fréquence", type: "match", make: makeFrequencyLinks },
  "frequence-ordre": { label: "Ranger ce qui revient souvent ou rarement", type: "order", make: makeFrequencyOrder },
  "edt-apres": { label: "Le cours juste avant ou après la récréation", type: "qcm", make: makeTimetableNeighbour },
  "edt-quand": { label: "L'heure d'un cours dans l'emploi du temps", type: "qcm", make: makeTimetableHour },
  "edt-ordre": { label: "Ranger les cours d'une journée", type: "order", make: makeTimetableOrder },
  "edt-trou": { label: "Une phrase à trou sur l'emploi du temps", type: "fill-blank", make: makeTimetableBlank },
  "edt-semaine": { label: "Lire l'emploi du temps de la semaine", type: "qcm", make: makeWeekTimetable },
  // Le quartier du CP (`quartier.ts`) : l'itinéraire, les distances, le plan vu de dessus, les lieux d'une rue.
  "trajet-case": { label: "Où arrive le pion après deux déplacements", type: "qcm", make: makeTwoMoves },
  "trajet-tourne": { label: "Où arrive le pion qui tourne à droite ou à gauche", type: "qcm", make: makeTurn },
  "itineraire-ordre": { label: "Les lieux d'un trajet dans l'ordre", type: "order", make: makeRouteOrder },
  "itineraire-passe": { label: "Devant quel lieu passe-t-on", type: "qcm", make: makeRoutePassBy },
  "itineraire-trou": { label: "Une phrase à trou sur un trajet", type: "fill-blank", make: makeRouteBlank },
  "itineraire-glisser": { label: "Avant ou après un lieu du trajet", type: "drag-drop", make: makeRouteSort },
  "distance-pas": { label: "Qui habite le plus près ou le plus loin", type: "qcm", make: makeWhoIsNearest },
  "distance-ordre": { label: "Ranger des distances en pas", type: "order", make: makeDistanceOrder },
  "mesure-comparer": { label: "Comparer des mesures en pas ou en empans", type: "qcm", make: makeCompareMeasures },
  "chemin-court": { label: "Le chemin le plus court", type: "qcm", make: makeShortestPath },
  "pas-difference": { label: "Combien de pas de plus, un nombre à écrire", type: "short-answer", make: makeStepsDifference },
  "distance-trou": { label: "Une phrase à trou sur des distances", type: "fill-blank", make: makeNearestBlank },
  "distance-glisser": { label: "Plus près ou plus loin qu'un lieu", type: "drag-drop", make: makeCloserFarther },
  "plan-ou": { label: "Où est un objet sur un plan vu de dessus", type: "qcm", make: makePlanWhere },
  "plan-objet": { label: "Quel objet est à cette place du plan", type: "qcm", make: makePlanWhat },
  "plan-compter": { label: "Compter sur un plan vu de dessus", type: "qcm", make: makePlanCount },
  "plan-glisser": { label: "Ranger les objets d'un plan", type: "drag-drop", make: makePlanSort },
  "plan-relier": { label: "Relier un objet et sa place sur le plan", type: "match", make: makePlanLinks },
  "plan-trou": { label: "Une phrase à trou sur un plan", type: "fill-blank", make: makePlanBlank },
  "quartier-rue": { label: "Où est un lieu dans la rue", type: "qcm", make: makeStreetQuestion },
  "quartier-ordre": { label: "Les lieux d'une rue dans l'ordre", type: "order", make: makeStreetOrder },
  "quartier-glisser": { label: "Avant ou après un lieu de la rue", type: "drag-drop", make: makeStreetSort },
  "quartier-trou": { label: "Une phrase à trou sur une rue", type: "fill-blank", make: makeStreetBlank },
  "lieu-fonction": { label: "Relier un lieu et ce qu'on y fait", type: "match", make: makePlaceFunctions },
  // L'anglais du CP (`anglais.ts`) : la famille, le corps, la classe, les nombres de 11 à 20, les aliments.
  "famille-mot": { label: "Le mot anglais d'un membre de la famille dessiné", type: "qcm", make: makeFamilyWord },
  "famille-lien": { label: "Le mot anglais d'un membre de la famille décrit", type: "qcm", make: makeFamilyClue },
  "famille-relier": { label: "Relier un dessin de la famille et son mot anglais", type: "match", make: makeFamilyLinks },
  "famille-glisser": { label: "Femme ou fille, homme ou garçon, en anglais", type: "drag-drop", make: makeFamilySort },
  "famille-trou": { label: "This is my, une phrase à trou", type: "fill-blank", make: makeFamilyGap },
  "famille-phrase": { label: "Remettre This is my dans l'ordre", type: "order", make: makeFamilySentence },
  "corps-mot": { label: "Le mot anglais d'une partie du corps dessinée", type: "qcm", make: makeBodyWord },
  "corps-consigne": { label: "Dire en anglais de toucher ou de montrer une partie du corps", type: "qcm", make: makeBodyCommand },
  "corps-relier": { label: "Relier une partie du corps et son mot anglais", type: "match", make: makeBodyLinks },
  "corps-glisser": { label: "Le visage, ou les bras et les jambes, en anglais", type: "drag-drop", make: makeBodySort },
  "corps-trou": { label: "Touch your, une phrase à trou", type: "fill-blank", make: makeBodyGap },
  "corps-phrase": { label: "Remettre Touch your dans l'ordre", type: "order", make: makeBodySentence },
  "classe-mot": { label: "Le mot anglais d'un objet de la classe dessiné", type: "qcm", make: makeClassWord },
  "classe-francais": { label: "Le mot anglais d'un objet de la classe nommé en français", type: "qcm", make: makeClassFrench },
  "classe-relier": { label: "Relier un objet de la classe et son mot anglais", type: "match", make: makeClassLinks },
  "classe-glisser": { label: "Petit ou grand objet de la classe, en anglais", type: "drag-drop", make: makeClassSort },
  "classe-trou": { label: "It is a, une phrase à trou", type: "fill-blank", make: makeClassGap },
  "classe-question": { label: "What is it, une réponse à compléter", type: "fill-blank", make: makeClassQuestion },
  "classe-phrase": { label: "Remettre It is a dans l'ordre", type: "order", make: makeClassSentence },
  "nombre-mot": { label: "Le mot anglais d'un nombre de 11 à 20", type: "qcm", make: makeNumberWord },
  "nombre-chiffre": { label: "Le nombre d'un mot anglais, en chiffres", type: "fill-blank", make: makeNumberDigit },
  "nombre-relier": { label: "Relier un nombre et son mot anglais", type: "match", make: makeNumberLinks },
  "nombre-ordre": { label: "Ranger des nombres écrits en anglais", type: "order", make: makeEnglishNumberOrder },
  "nombre-suivant": { label: "Le mot anglais du nombre d'après", type: "qcm", make: makeNumberNext },
  "nombre-age": { label: "I am, dire son âge en anglais", type: "fill-blank", make: makeNumberAge },
  "nombre-ecrire": { label: "Écrire un nombre en anglais", type: "short-answer", make: makeNumberWrite },
  "nombre-glisser": { label: "Moins ou plus qu'un nombre, en anglais", type: "drag-drop", make: makeNumberSort },
  "nombre-compter": { label: "Compter jusqu'à 20 et choisir le mot anglais", type: "qcm", make: makeNumberCount },
  "aliment-mot": { label: "Le mot anglais d'un aliment dessiné", type: "qcm", make: makeFoodWord },
  "aliment-francais": { label: "Le mot anglais d'un aliment nommé en français", type: "qcm", make: makeFoodFrench },
  "aliment-relier": { label: "Relier un aliment et son mot anglais", type: "match", make: makeFoodLinks },
  "aliment-glisser": { label: "Je mange ou je bois, en anglais", type: "drag-drop", make: makeFoodSort },
  "aliment-trou": { label: "I like, une phrase à trou avec un dessin", type: "fill-blank", make: makeFoodGap },
  "aliment-trou-francais": { label: "I like, une phrase à trou avec un mot français", type: "fill-blank", make: makeFoodFrenchGap },
  "aliment-phrase": { label: "Remettre I like dans l'ordre", type: "order", make: makeFoodSentence },
  // La lecture du CP (`lecture.ts`) : lire des mots, assembler des syllabes, des sons proches.
  "lire-dessin": { label: "Le mot qui va avec un dessin", type: "qcm", make: makeReadPicture },
  "lire-relier": { label: "Relier un mot lu et son dessin", type: "match", make: makeReadLinks },
  "lire-syllabes": { label: "Remettre les syllabes d'un mot dans l'ordre", type: "order", make: makeReadSyllables },
  "lire-assembler": { label: "Assembler des syllabes et écrire le mot", type: "short-answer", make: makeReadAssemble },
  "lire-son": { label: "Le mot qui a un son parmi des sons proches", type: "qcm", make: makeReadSound },
  "lire-son-glisser": { label: "Ranger des mots selon deux sons proches", type: "drag-drop", make: makeReadSoundSort },
  "lire-lettre": { label: "Le mot qui commence par b, d ou p", type: "qcm", make: makeReadLetter },
  "lire-trou": { label: "Une phrase à trou avec un dessin", type: "fill-blank", make: makeReadGap },
  "lire-phrase": { label: "Lire deux phrases et répondre", type: "qcm", make: makeReadSentence },
  // L'écriture du CP (`ecriture.ts`) : la phrase, un, une, des, le singulier et le pluriel.
  "ecrire-ordre": { label: "Remettre les mots d'une phrase dans l'ordre", type: "order", make: makeWriteOrder },
  "ecrire-bien-ecrite": { label: "La phrase avec sa majuscule et son point", type: "qcm", make: makeWriteWellWritten },
  "ecrire-un-des": { label: "Un, une, des, le, la, les dans une phrase", type: "fill-blank", make: makeWriteArticle },
  "ecrire-groupe": { label: "Un ou plusieurs dessins, une phrase à trou", type: "fill-blank", make: makeWriteCount },
  "ecrire-pluriel": { label: "Relier un nom et son pluriel", type: "match", make: makeWritePluralLinks },
  "ecrire-nombre": { label: "Singulier ou pluriel", type: "drag-drop", make: makeWriteNumberSort },
  "ecrire-texte": { label: "Remettre les trois phrases d'une histoire dans l'ordre", type: "order", make: makeWriteText },
  "ecrire-mot": { label: "Le bon mot dans une phrase", type: "fill-blank", make: makeWriteWord },
} as const satisfies Record<
  string,
  { label: string; type: GameExerciseType; make: (ctx: GameContext) => GeneratedGame }
>;

export type GameKind = keyof typeof GAME_KINDS;

/** « Trois frises de couleurs » : ce qu'une thématique demande à chaque palier. */
export type GameSpec = {
  kind: GameKind;
  count: number;
  /** Pour les gabarits de mots : « mots-2 », les mots vus jusqu'au deuxième palier de lecture. */
  vocabulary?: string;
};

export function isGameKind(value: unknown): value is GameKind {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(GAME_KINDS, value);
}

/** Combien d'exercices de jeu un palier recevra : jamais plus que le palier. */
export function gameCount(specs: readonly GameSpec[] | undefined): number {
  const total = (specs ?? []).reduce((sum, spec) => sum + Math.max(0, Math.floor(spec.count)), 0);
  return Math.min(PALIER_SIZE, total);
}

/**
 * Le contrôle d'un gabarit avant de le servir : `true` quand l'exercice peut
 * partir. Posé par la génération d'un palier (`paliers/index.ts`), qui y met le
 * contrôleur structurel (`exerciseAudit.ts`).
 */
export type GameAccept = (game: GeneratedGame) => boolean;

/** Les types des gabarits : le contrôleur est fait pour eux, pas pour les quatre jeux (frise, dessin, écoute, couleurs). */
const TEMPLATE_TYPES: readonly GameExerciseType[] = ["qcm", "order", "match", "drag-drop", "fill-blank", "short-answer"];

/** Combien de fois refaire un gabarit refusé, avec une autre graine, avant de l'abandonner. */
export const TEMPLATE_RETRIES = 4;

export type GameRunOptions = {
  klass: VisibleClassName;
  palierIndex: number;
  palierCount: number;
  /** La graine : la même graine refait les mêmes exercices. */
  seed: string;
  /**
   * Refuse un gabarit fautif : il est refait avec une autre graine
   * (`TEMPLATE_RETRIES` fois au plus), puis abandonné. Un palier peut alors
   * compter moins de jeux que demandé, et le modèle écrit la différence. Ne juge
   * que les gabarits : les quatre jeux ne passent pas par là.
   */
  accept?: GameAccept;
};

/**
 * Fabrique un exercice, et le refait avec une autre graine tant que `accept`
 * le refuse. La première graine est celle d'avant : sans refus, rien ne change.
 */
function makeAccepted(make: (suffix: string) => GeneratedGame, accept: GameAccept | undefined): GeneratedGame | null {
  let game = make("");
  if (!accept || !TEMPLATE_TYPES.includes(game.type) || accept(game)) return game;
  for (let retry = 1; retry <= TEMPLATE_RETRIES; retry++) {
    game = make(`:r${retry}`);
    if (accept(game)) return game;
  }
  return null;
}

/**
 * Les exercices de jeu d'un palier, dans l'ordre des jeux demandés. Le palier
 * les mêle ensuite aux exercices du modèle (`interleave`).
 */
export function generateGames(specs: readonly GameSpec[], opts: GameRunOptions): GeneratedGame[] {
  const level = gameLevel(opts.palierIndex, opts.palierCount);
  const used = new Set<string>();
  const out: GeneratedGame[] = [];
  let n = 0;
  for (const spec of specs) {
    if (!isGameKind(spec.kind)) continue;
    for (let i = 0; i < spec.count && out.length < PALIER_SIZE; i++) {
      const seed = `${opts.seed}:${spec.kind}:${n++}`;
      const game = makeAccepted(
        (suffix) => GAME_KINDS[spec.kind].make(makeContext(opts.klass, level, `${seed}${suffix}`, used, spec.vocabulary)),
        opts.accept,
      );
      if (game) out.push(game);
    }
  }
  return out;
}

/**
 * UNE VARIATION D'UN JEU RATÉ, sans le modèle : le même jeu, au même
 * niveau, avec une autre graine. `null` quand l'exercice ne vient pas d'un
 * jeu (le modèle s'en charge alors), d'un jeu disparu du catalogue, ou d'un
 * gabarit que `accept` a refusé à chaque tirage.
 */
export function regenerateGame(
  origin: GameOrigin | null | undefined,
  klass: VisibleClassName,
  seed: string,
  accept?: GameAccept,
): GeneratedGame | null {
  if (!origin || !isGameKind(origin.kind)) return null;
  const kind = origin.kind;
  const level = Math.min(4, Math.max(1, Math.round(origin.level))) as GameLevel;
  return makeAccepted(
    (suffix) => GAME_KINDS[kind].make(makeContext(klass, level, `${seed}${suffix}`, undefined, origin.vocabulary)),
    accept,
  );
}

/** Le jeu d'origine d'un exercice, lu dans son payload. */
export function gameOriginOf(payload: unknown): GameOrigin | null {
  if (!payload || typeof payload !== "object") return null;
  const game = (payload as { game?: unknown }).game;
  if (!game || typeof game !== "object") return null;
  const { kind, level, vocabulary } = game as { kind?: unknown; level?: unknown; vocabulary?: unknown };
  if (typeof kind !== "string" || typeof level !== "number") return null;
  return typeof vocabulary === "string" ? { kind, level, vocabulary } : { kind, level };
}

/**
 * Mêle deux listes sans que les jeux s'agglutinent à la fin : un palier
 * de six exercices du modèle et quatre jeux alterne les deux, en gardant
 * l'ordre de chaque liste (la difficulté du modèle croît d'un exercice à
 * l'autre).
 */
export function interleave<T>(first: readonly T[], second: readonly T[]): T[] {
  if (first.length === 0) return [...second];
  if (second.length === 0) return [...first];
  const out: T[] = [];
  const total = first.length + second.length;
  let i = 0;
  let j = 0;
  for (let k = 0; k < total; k++) {
    // On prend dans la liste la plus « en retard » sur sa part du palier.
    const firstDue = (i + 1) / first.length;
    const secondDue = (j + 1) / second.length;
    if (j >= second.length || (i < first.length && firstDue <= secondDue)) out.push(first[i++]);
    else out.push(second[j++]);
  }
  return out;
}
