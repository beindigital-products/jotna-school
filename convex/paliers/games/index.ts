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
  makeAnimalFrench,
  makeAnimalLinks,
  makeAnimalOdd,
  makeAnimalSort,
  makeAnimalWord,
  makeColourFrench,
  makeColourLinks,
  makeColourSentence,
  makeColourSort,
  makeColourThing,
  makeColourWord,
  makeCountDigit,
  makeCountDrawingLinks,
  makeCountDrawings,
  makeCountLinks,
  makeCountNext,
  makeCountOrder,
  makeCountSeries,
  makeCountSort,
  makeCountWord,
  makeFruitFrench,
  makeFruitLinks,
  makeFruitOdd,
  makeFruitSort,
  makeFruitWord,
  makeGoodGap,
  makeIntroduceGap,
  makeIntroduceOrder,
  makeMeetingOrder,
  makeSayingDrawing,
  makeSayingFrench,
  makeSayingLinks,
  makeSayingSituation,
  makeSayingSort,
} from "./anglaisCi";
import { makeActOdd, makeActSort, makeRuleGap, makeSceneChoice, makeSceneLinks, makeSequence } from "./civique";
import {
  makeFauneCover,
  makeFauneGap,
  makeFauneHabitat,
  makeFauneLinks,
  makeFauneLives,
  makeFauneOdd,
  makeFauneSort,
  makeMilieuGap,
  makeMilieuOdd,
  makeMilieuSort,
  makePlanteGap,
  makePlanteLinks,
  makePlanteOrder,
  makePlantePart,
  makePlanteSort,
  makePlanteWho,
} from "./milieuCi";
import {
  makeHygieneCare,
  makeHygieneChoice,
  makeHygieneGap,
  makeHygieneOdd,
  makeHygieneSense,
  makeHygieneSort,
  makeHygieneSteps,
  makeToolChoice,
  makeToolGap,
  makeToolLinks,
  makeToolSort,
  makeToolSteps,
  makeToolWho,
} from "./soinsCi";
import {
  makeContourChoice,
  makeContourGap,
  makeContourLinks,
  makeContourSort,
  makeFriseNext,
  makeFriseOdd,
  makeTeinteChoice,
  makeTeinteLinks,
  makeTeinteOrder,
  makeTeinteSort,
} from "./plastiqueCi";
import {
  makeCriAnimal,
  makeCriLinks,
  makeEmotionGap,
  makeEmotionGesture,
  makeEmotionSituation,
  makeVisageEmotion,
  makeVisageLinks,
  makeVisageSort,
  makeVisageWhich,
} from "./mimesCi";
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
import {
  makeInstructionGap,
  makeInstructionLinks,
  makeInstructionMeaning,
  makeInstructionOdd,
  makeInstructionSteps,
  makeInstructionVerb,
} from "./consignes";
import { makeAdjectiveOrder, makeCompareGap, makeContraryChoice, makeContraryGap, makeContraryLinks } from "./decrire";
import {
  makeStoryGap,
  makeStoryLinks,
  makeStoryOrder,
  makeStoryWhat,
  makeStoryWhen,
  makeStoryWhere,
  makeStoryWho,
} from "./recit";
import {
  makeInvitationChoice,
  makeInvitationGap,
  makeInvitationOrder,
  makeInvitationReply,
  makeInvitationSort,
  makeInvitationWho,
} from "./invitation";
import {
  makeLineChoice,
  makeLineLinks,
  makeLineSort,
  makePaintLinks,
  makePaintTool,
  makeStrokeChoice,
  makeTechniqueChoice,
  makeTechniqueLinks,
  makeVoiceChoice,
  makeVoiceGap,
  makeVoiceOrder,
} from "./arts";
// Les gabarits du civique du CP (`gestes.ts`) portent des noms que le civique du CI (`civique.ts`) prend aussi : les alias les séparent.
import {
  makeActOdd as makeGestureOdd,
  makeActSort as makeGestureSort,
  makePanelChoice,
  makeRightsSort,
  makeRoleChoice,
  makeRoadWrite,
  makeRoleLinks,
  makeRuleGap as makeGestureGap,
  makeSceneChoice as makeGestureScene,
  makeSceneLinks as makeGestureLinks,
  makeSequence as makeGestureSequence,
} from "./gestes";
// Les sciences du CP (`sciences.ts`) et « jouer un rôle » (`metiers.ts`) : des noms propres à chaque module, pour ne marcher sur personne.
import {
  makeFruitVegetableSort,
  makeHabitChoice,
  makeHabitGap,
  makeHabitLinks,
  makeHabitOdd,
  makeHabitSequence,
  makeHabitSort,
  makeIllnessFact,
  makeIllnessSort,
  makeLifeGap,
  makeLifeLinks,
  makeLifeNext,
  makeLifeOrder,
  makeLifeSort,
  makeLifeYoung,
  makeMatterChange,
  makeMatterChoice,
  makeMatterGap,
  makeMatterLinks,
  makeMatterOrder,
  makeMatterSort,
  makeMatterWrite,
  makeMealChoice,
  makeMealSort,
  makeRepairLinks,
} from "./sciences";
import { makeCryChoice, makeCryLinks, makeJobGap, makeJobLinks, makeJobOrder, makeJobSort, makeJobTool, makeJobWho, makeJobWrite } from "./metiers";
// Les mathématiques du CP : les nombres jusqu'à 50 et 100 (`nombresCp.ts`), retenue, emprunt et monnaie (`calculCp.ts`), tables de 2 et de 3 (`tablesCp.ts`).
import {
  makeCpCompare,
  makeCpDecompose,
  makeCpNeighbour,
  makeCpOrder,
  makeCpSortThreshold,
  makeCpTensUnits,
  makeCpWordLinks,
  makeCpWords,
  makeCpWriteNumber,
} from "./nombresCp";
import { makeBorrowSub, makeCalcGap, makeCalcLinks, makeCalcSort, makeCalcSteps, makeCarryAdd, makeCarryAsk, makeChangeDue, makeCoinsTotal, makeShopLeft } from "./calculCp";
import {
  makeShareGap,
  makeShareQuestion,
  makeTimesFact,
  makeTimesGap,
  makeTimesLinks,
  makeTimesOrder,
  makeTimesPacks,
  makeTimesRepeated,
  makeTimesSort,
  makeTimesWrite,
} from "./tablesCp";
// Les mesures (`mesuresCp.ts`), l'heure et la monnaie (`heureCp.ts`), les problèmes (`problemesCp.ts`) et les figures (`figuresCp.ts`) du CP.
import {
  makeBodyMeasure,
  makeKiloGap,
  makeKiloParts,
  makeMeasureMost,
  makeMeasureOrder,
  makeMeasureRepeat,
  makeMeasureSum,
  makeUnitChoice,
  makeUnitLinks,
  makeUnitSort,
} from "./mesuresCp";
import { makeCalendarCount, makeClockLinks, makeClockOrder, makeCoinCount, makeCoinLinks, makeDayOrMonth, makeLaterGap, makePayCoins, makeReadClock } from "./heureCp";
import {
  makeAddOrRemove,
  makeCpProblemQuestion,
  makeCpStoryLinks,
  makeCpUselessDatum,
  makeMissingDatum,
  makePickOperation,
  makeProblemSteps,
  makeSolve,
  makeSolveGap,
  makeSolveWrite,
} from "./problemesCp";
import { makeFigureSteps, makeGeometryTool } from "./figuresCp";
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
import { makeSentenceOrder, makeWordCount, makeWordPlace, makeWrittenSentence } from "./phrases";
import { makeFeelingChoice, makeFormulaGap, makeFormulaMatch, makeFormulaSort, makeMeeting, makeSituationChoice } from "./politesse";
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
  // Les premières phrases (`phrases.ts`) : remettre des mots dans l'ordre, la majuscule et le point, compter les mots.
  "phrase-ordre": { label: "Remettre les mots d'une phrase dans l'ordre", type: "order", make: makeSentenceOrder },
  "phrase-ecrite": { label: "La phrase bien écrite : majuscule et point", type: "qcm", make: makeWrittenSentence },
  "phrase-mots-compter": { label: "Compter les mots d'une phrase", type: "qcm", make: makeWordCount },
  "phrase-mot-place": { label: "Le premier ou le dernier mot d'une phrase", type: "qcm", make: makeWordPlace },
  // La politesse (`politesse.ts`) : bonjour, au revoir, merci, s'il te plaît, pardon, dire ce qu'on ressent.
  "politesse-situation": { label: "Quelle formule pour cette situation", type: "qcm", make: makeSituationChoice },
  "politesse-besoin": { label: "Dire un besoin ou un sentiment", type: "qcm", make: makeFeelingChoice },
  "politesse-relier": { label: "Relier une formule et sa situation", type: "match", make: makeFormulaMatch },
  "politesse-glisser": { label: "Glisser des situations sous la bonne formule", type: "drag-drop", make: makeFormulaSort },
  "politesse-trou": { label: "La formule qui complète une situation", type: "fill-blank", make: makeFormulaGap },
  "politesse-rencontre": { label: "Ranger les paroles d'une rencontre", type: "order", make: makeMeeting },
  // Les consignes du CP (`consignes.ts`) : le sens des six verbes de la fiche, les étapes d'un geste.
  "consigne-sens": { label: "Ce que fait la consigne", type: "qcm", make: makeInstructionMeaning },
  "consigne-verbe": { label: "Le verbe qui dit l'action", type: "qcm", make: makeInstructionVerb },
  "consigne-relier": { label: "Relier une consigne et son sens", type: "match", make: makeInstructionLinks },
  "consigne-trou": { label: "Le verbe qui complète une consigne", type: "fill-blank", make: makeInstructionGap },
  "consigne-intrus": { label: "Le mot qui n'est pas une consigne", type: "qcm", make: makeInstructionOdd },
  "consigne-etapes": { label: "Remettre les étapes d'un geste dans l'ordre", type: "order", make: makeInstructionSteps },
  // Décrire et comparer au CP (`decrire.ts`) : les contraires, plus grand que, l'adjectif et son nom.
  "contraire-qcm": { label: "Le contraire d'un mot", type: "qcm", make: makeContraryChoice },
  "contraire-relier": { label: "Relier un mot et son contraire", type: "match", make: makeContraryLinks },
  "contraire-trou": { label: "Le mot contraire dans une phrase", type: "fill-blank", make: makeContraryGap },
  "comparer-trou": { label: "Plus grand que, plus lourd que", type: "fill-blank", make: makeCompareGap },
  "adjectif-ordre": { label: "L'adjectif et son nom dans l'ordre", type: "order", make: makeAdjectiveOrder },
  // Raconter au CP (`recit.ts`) : d'abord, ensuite, enfin, qui, où, quand.
  "recit-ordre": { label: "Remettre une histoire dans l'ordre", type: "order", make: makeStoryOrder },
  "recit-qui": { label: "Qui fait quoi dans un petit texte", type: "qcm", make: makeStoryWho },
  "recit-ou": { label: "Où se passe l'histoire", type: "qcm", make: makeStoryWhere },
  "recit-quoi": { label: "Ce que fait la personne de l'histoire", type: "qcm", make: makeStoryWhat },
  "recit-quand": { label: "Quand se passe l'histoire", type: "qcm", make: makeStoryWhen },
  "recit-trou": { label: "Le mot d'ordre qui manque", type: "fill-blank", make: makeStoryGap },
  "recit-relier": { label: "Relier un enfant et ce qu'il fait", type: "match", make: makeStoryLinks },
  // Inviter et conseiller au CP (`invitation.ts`).
  "invitation-glisser": { label: "Invitation ou conseil", type: "drag-drop", make: makeInvitationSort },
  "invitation-choisir": { label: "La phrase qui invite ou qui conseille", type: "qcm", make: makeInvitationChoice },
  "invitation-reponse": { label: "Répondre poliment à une invitation", type: "qcm", make: makeInvitationReply },
  "invitation-qui": { label: "Qui invite, qui est invité, quel jour", type: "qcm", make: makeInvitationWho },
  "invitation-trou": { label: "Le mot qui complète une invitation", type: "fill-blank", make: makeInvitationGap },
  "invitation-ordre": { label: "Remettre une invitation dans l'ordre", type: "order", make: makeInvitationOrder },
  // Les arts du CP (`arts.ts`) : le matériel du peintre, les lignes, les traits, modeler, les voix.
  "peinture-outil": { label: "Le matériel du peintre", type: "qcm", make: makePaintTool },
  "peinture-relier": { label: "Relier un outil du peintre à son travail", type: "match", make: makePaintLinks },
  "ligne-qcm": { label: "Reconnaître une ligne", type: "qcm", make: makeLineChoice },
  "ligne-relier": { label: "Relier une ligne et ce qu'on voit", type: "match", make: makeLineLinks },
  "ligne-glisser": { label: "Ligne droite ou ligne courbe", type: "drag-drop", make: makeLineSort },
  "trait-qcm": { label: "Reconnaître un trait", type: "qcm", make: makeStrokeChoice },
  "technique-qcm": { label: "Ce qu'on prend pour modeler, peindre, dessiner", type: "qcm", make: makeTechniqueChoice },
  "technique-relier": { label: "Relier un geste et ce qu'on prend", type: "match", make: makeTechniqueLinks },
  "voix-ordre": { label: "Ranger les voix du plus doux au plus fort", type: "order", make: makeVoiceOrder },
  "voix-qcm": { label: "La voix la plus douce ou la plus forte", type: "qcm", make: makeVoiceChoice },
  "voix-trou": { label: "Parler ou chanter doucement ou fort", type: "fill-blank", make: makeVoiceGap },
  // L'instruction civique du CP (`gestes.ts`) : la route, le règlement, les responsabilités, filles et garçons, la paix.
  "geste-situation": { label: "Le bon geste dans une situation", type: "qcm", make: makeGestureScene },
  "geste-glisser": { label: "Glisser des gestes sous « À faire » ou « À éviter »", type: "drag-drop", make: makeGestureSort },
  "geste-intrus": { label: "Quel geste est bien, ou n'est pas bien, parmi trois", type: "qcm", make: makeGestureOdd },
  "geste-relier": { label: "Relier une situation et le bon geste", type: "match", make: makeGestureLinks },
  "geste-ordre": { label: "Remettre des gestes dans l'ordre", type: "order", make: makeGestureSequence },
  "geste-trou": { label: "Compléter une règle de vie", type: "fill-blank", make: makeGestureGap },
  "droit-devoir": { label: "Glisser des phrases sous « Droits » ou « Devoirs »", type: "drag-drop", make: makeRightsSort },
  "role-qui": { label: "Qui fait quoi dans la classe", type: "qcm", make: makeRoleChoice },
  "role-relier": { label: "Relier un responsable et sa tâche", type: "match", make: makeRoleLinks },
  "panneau-qcm": { label: "Ce que dit un panneau", type: "qcm", make: makePanelChoice },
  "route-ecrire": { label: "Écrire le mot de la sécurité routière", type: "short-answer", make: makeRoadWrite },
  // Les sciences du CP (`sciences.ts`) : solide, liquide ou gaz ; les êtres vivants grandissent ; bien manger ; les maladies ; la nature.
  "etat-qcm": { label: "Dans quel état est cette chose : solide, liquide ou gaz", type: "qcm", make: makeMatterChoice },
  "etat-glisser": { label: "Glisser des choses sous leur état", type: "drag-drop", make: makeMatterSort },
  "etat-relier": { label: "Relier un état et un exemple", type: "match", make: makeMatterLinks },
  "etat-change": { label: "Ce que le chaud et le froid font à l'eau", type: "qcm", make: makeMatterChange },
  "etat-ordre": { label: "Ranger la glace, l'eau et la vapeur", type: "order", make: makeMatterOrder },
  "etat-trou": { label: "Compléter une phrase sur les états de la matière", type: "fill-blank", make: makeMatterGap },
  "etat-ecrire": { label: "Écrire le mot qui dit un état de l'eau", type: "short-answer", make: makeMatterWrite },
  "vie-ordre": { label: "Remettre les étapes d'une vie dans l'ordre", type: "order", make: makeLifeOrder },
  "vie-suite": { label: "L'étape juste avant ou juste après", type: "qcm", make: makeLifeNext },
  "vie-petit": { label: "Le petit d'un animal", type: "qcm", make: makeLifeYoung },
  "vie-relier": { label: "Relier un animal et son petit", type: "match", make: makeLifeLinks },
  "vie-glisser": { label: "Ce qui grandit et ce qui ne grandit pas", type: "drag-drop", make: makeLifeSort },
  "vie-trou": { label: "Compléter une phrase sur les êtres vivants qui grandissent", type: "fill-blank", make: makeLifeGap },
  "habitude-situation": { label: "Le bon geste pour sa santé ou pour la nature", type: "qcm", make: makeHabitChoice },
  "habitude-glisser": { label: "Glisser des gestes sous « À faire » ou « À éviter »", type: "drag-drop", make: makeHabitSort },
  "habitude-intrus": { label: "Quel geste est bien, ou n'est pas bien, parmi trois", type: "qcm", make: makeHabitOdd },
  "habitude-relier": { label: "Relier une situation et le bon geste", type: "match", make: makeHabitLinks },
  "habitude-ordre": { label: "Remettre des gestes de santé ou de nature dans l'ordre", type: "order", make: makeHabitSequence },
  "habitude-trou": { label: "Compléter une règle de santé ou de nature", type: "fill-blank", make: makeHabitGap },
  "repas-qcm": { label: "Un aliment qui fait du bien ou qu'il faut éviter", type: "qcm", make: makeMealChoice },
  "repas-glisser": { label: "Glisser des aliments sous « Bon pour le corps » ou « À éviter »", type: "drag-drop", make: makeMealSort },
  "repas-fruit-legume": { label: "Fruit ou légume", type: "drag-drop", make: makeFruitVegetableSort },
  "maladie-glisser": { label: "Se protéger du paludisme ou de la diarrhée", type: "drag-drop", make: makeIllnessSort },
  "maladie-cause": { label: "Les causes et les protections des maladies du milieu", type: "qcm", make: makeIllnessFact },
  "nature-reparer": { label: "Relier un problème de la nature et ce qui le répare", type: "match", make: makeRepairLinks },
  // Jouer un rôle au CP (`metiers.ts`) : qui fait quoi, quel objet pour quel rôle, imiter un animal.
  "metier-qui": { label: "Quel métier fait ce travail", type: "qcm", make: makeJobWho },
  "metier-outil": { label: "Quel objet sert à quel métier", type: "qcm", make: makeJobTool },
  "metier-relier": { label: "Relier un métier et son travail ou son objet", type: "match", make: makeJobLinks },
  "metier-glisser": { label: "Glisser les gestes de deux métiers", type: "drag-drop", make: makeJobSort },
  "metier-trou": { label: "Compléter une phrase sur un métier", type: "fill-blank", make: makeJobGap },
  "metier-ordre": { label: "Remettre un travail ou une scène dans l'ordre", type: "order", make: makeJobOrder },
  "metier-ecrire": { label: "Écrire le nom du métier que l'on joue", type: "short-answer", make: makeJobWrite },
  "imiter-qcm": { label: "Quel animal fait ce cri, ou quel cri fait cet animal", type: "qcm", make: makeCryChoice },
  "imiter-relier": { label: "Relier un animal et son cri", type: "match", make: makeCryLinks },
  // Les nombres du CP (`nombresCp.ts`) : jusqu'à 50, puis jusqu'à 100.
  "nb-voisin": { label: "Le nombre juste avant ou juste après, jusqu'à 100", type: "qcm", make: makeCpNeighbour },
  "nb-comparer": { label: "Le plus grand ou le plus petit de trois nombres", type: "qcm", make: makeCpCompare },
  "nb-ordre": { label: "Ranger quatre nombres", type: "order", make: makeCpOrder },
  "nb-dizaines": { label: "Combien de dizaines ou d'unités dans un nombre", type: "qcm", make: makeCpTensUnits },
  "nb-decomposer": { label: "Décomposer un nombre : 30 + 7, 3 × 10 + 7", type: "fill-blank", make: makeCpDecompose },
  "nb-glisser": { label: "Glisser des nombres sous « Moins de » ou « Plus de »", type: "drag-drop", make: makeCpSortThreshold },
  "nb-lettres": { label: "Quel nombre s'écrit en lettres", type: "qcm", make: makeCpWords },
  "nb-relier": { label: "Relier un nombre et son écriture en lettres", type: "match", make: makeCpWordLinks },
  "nb-ecrire": { label: "Écrire en chiffres un nombre dit en lettres", type: "short-answer", make: makeCpWriteNumber },
  // L'addition avec retenue, la soustraction avec emprunt et la monnaie du CP (`calculCp.ts`).
  "calc-ajouter": { label: "Une addition dont les unités passent dix", type: "qcm", make: makeCarryAdd },
  "calc-enlever": { label: "Une soustraction avec emprunt", type: "qcm", make: makeBorrowSub },
  "calc-retenue": { label: "Ce qu'on écrit, ce qu'on retient, ce qu'on emprunte", type: "qcm", make: makeCarryAsk },
  "calc-trou": { label: "Le nombre qui manque dans un calcul", type: "fill-blank", make: makeCalcGap },
  "calc-ordre": { label: "Les étapes d'un calcul posé dans l'ordre", type: "order", make: makeCalcSteps },
  "calc-relier": { label: "Relier un calcul et son résultat", type: "match", make: makeCalcLinks },
  "calc-glisser": { label: "Glisser des additions sous « Avec retenue » ou « Sans retenue »", type: "drag-drop", make: makeCalcSort },
  "monnaie-somme": { label: "Additionner des pièces", type: "qcm", make: makeCoinsTotal },
  "monnaie-rendre": { label: "Rendre la monnaie", type: "qcm", make: makeChangeDue },
  "monnaie-achat": { label: "Ce qui reste après un achat, à écrire", type: "short-answer", make: makeShopLeft },
  // Multiplier et partager au CP (`tablesCp.ts`) : les tables de 2 et de 3.
  "mult-paquets": { label: "Des paquets pareils : combien en tout", type: "qcm", make: makeTimesPacks },
  "mult-ecrire": { label: "Des paquets pareils : le total, à écrire", type: "short-answer", make: makeTimesWrite },
  "mult-addition": { label: "Une addition répétée écrite en multiplication", type: "qcm", make: makeTimesRepeated },
  "mult-table": { label: "Un résultat des tables de 2 et de 3", type: "qcm", make: makeTimesFact },
  "mult-trou": { label: "Le facteur qui manque", type: "fill-blank", make: makeTimesGap },
  "mult-relier": { label: "Relier une multiplication et son résultat", type: "match", make: makeTimesLinks },
  "mult-suite": { label: "Ranger les résultats d'une table", type: "order", make: makeTimesOrder },
  "mult-glisser": { label: "Glisser des résultats sous « Table de 2 » ou « Table de 3 »", type: "drag-drop", make: makeTimesSort },
  "part-qcm": { label: "Partager en parts pareilles : combien chacun", type: "qcm", make: makeShareQuestion },
  "part-trou": { label: "Compléter un partage", type: "fill-blank", make: makeShareGap },
  // Les mesures du CP (`mesuresCp.ts`) : le mètre, le litre, le kilogramme, avec le corps puis avec l'unité.
  "mesure-unite": { label: "L'unité qui sert à mesurer une chose", type: "qcm", make: makeUnitChoice },
  "mesure-glisser": { label: "Glisser des mesures sous leur unité", type: "drag-drop", make: makeUnitSort },
  "mesure-relier": { label: "Relier une mesure et son unité", type: "match", make: makeUnitLinks },
  "mesure-corps": { label: "Mesurer avec son corps, puis avec le mètre", type: "qcm", make: makeBodyMeasure },
  "mesure-calcul": { label: "Ajouter ou enlever des mesures", type: "qcm", make: makeMeasureSum },
  "mesure-repete": { label: "Répéter une mesure, le total à écrire", type: "short-answer", make: makeMeasureRepeat },
  "mesure-ordre": { label: "Ranger des mesures", type: "order", make: makeMeasureOrder },
  "mesure-plus": { label: "Le plus long, le plus lourd, le plus plein", type: "qcm", make: makeMeasureMost },
  "mesure-kilo": { label: "Le demi-kilogramme et le quart de kilogramme", type: "qcm", make: makeKiloParts },
  "mesure-kilo-trou": { label: "Compléter une phrase sur les parts de kilogramme", type: "fill-blank", make: makeKiloGap },
  // L'heure, le calendrier et la monnaie du CP (`heureCp.ts`) : l'horloge est un émoji de Unicode.
  "heure-lire": { label: "Lire l'heure sur une horloge", type: "qcm", make: makeReadClock },
  "heure-relier": { label: "Relier une horloge et son heure", type: "match", make: makeClockLinks },
  "heure-ordre": { label: "Ranger des horloges du matin", type: "order", make: makeClockOrder },
  "heure-trou": { label: "Une heure ou une demi-heure plus tard", type: "fill-blank", make: makeLaterGap },
  "calendrier-combien": { label: "Combien de jours, combien de mois", type: "qcm", make: makeCalendarCount },
  "calendrier-glisser": { label: "Un jour ou un mois", type: "drag-drop", make: makeDayOrMonth },
  "monnaie-payer": { label: "Quelles pièces pour payer une somme", type: "qcm", make: makePayCoins },
  "monnaie-pieces": { label: "Combien de pièces pareilles pour une somme", type: "qcm", make: makeCoinCount },
  "monnaie-relier": { label: "Relier des pièces et leur somme", type: "match", make: makeCoinLinks },
  // Résoudre un problème au CP (`problemesCp.ts`) : l'opération, la donnée qui manque, la donnée inutile, la question.
  "pb-operation": { label: "Choisir l'opération d'un problème", type: "qcm", make: makePickOperation },
  "pb-resoudre": { label: "Résoudre un petit problème", type: "qcm", make: makeSolve },
  "pb-ecrire": { label: "Résoudre un petit problème, le nombre à écrire", type: "short-answer", make: makeSolveWrite },
  "pb-trou": { label: "Compléter la réponse d'un problème", type: "fill-blank", make: makeSolveGap },
  "pb-manquante": { label: "La donnée qui manque", type: "qcm", make: makeMissingDatum },
  "pb-inutile": { label: "La donnée qui ne sert à rien", type: "qcm", make: makeCpUselessDatum },
  "pb-question": { label: "La question qui va avec l'histoire", type: "qcm", make: makeCpProblemQuestion },
  "pb-etapes": { label: "Les étapes pour résoudre un problème", type: "order", make: makeProblemSteps },
  "pb-relier": { label: "Relier une histoire et son opération", type: "match", make: makeCpStoryLinks },
  "pb-glisser": { label: "On ajoute ou on enlève", type: "drag-drop", make: makeAddOrRemove },
  // Lignes, frises et figures au CP (`figuresCp.ts`).
  "outil-geometrie": { label: "L'outil du géomètre", type: "qcm", make: makeGeometryTool },
  "figure-etapes": { label: "Les étapes pour reproduire, tracer ou découper une figure", type: "order", make: makeFigureSteps },
  // Les animaux du CI en anglais (`anglaisCi.ts`) : un dessin et son mot, la ferme ou la nature.
  "animal-mot": { label: "Le mot anglais d'un animal dessiné", type: "qcm", make: makeAnimalWord },
  "animal-francais": { label: "Le mot anglais d'un animal nommé en français", type: "qcm", make: makeAnimalFrench },
  "animal-relier": { label: "Relier un animal et son mot anglais", type: "match", make: makeAnimalLinks },
  "animal-glisser": { label: "Animaux de la ferme ou animaux sauvages, en anglais", type: "drag-drop", make: makeAnimalSort },
  "animal-intrus": { label: "Lequel vit à la ferme, parmi trois animaux", type: "qcm", make: makeAnimalOdd },
  // Les fruits du CI en anglais.
  "fruit-mot": { label: "Le mot anglais d'un fruit dessiné", type: "qcm", make: makeFruitWord },
  "fruit-francais": { label: "Le mot anglais d'un fruit nommé en français", type: "qcm", make: makeFruitFrench },
  "fruit-relier": { label: "Relier un fruit et son mot anglais", type: "match", make: makeFruitLinks },
  "fruit-glisser": { label: "Fruit ou animal, en anglais", type: "drag-drop", make: makeFruitSort },
  "fruit-intrus": { label: "Lequel est un fruit, parmi trois dessins", type: "qcm", make: makeFruitOdd },
  // Les couleurs du CI en anglais.
  "couleur-mot": { label: "Le mot anglais d'une couleur dessinée", type: "qcm", make: makeColourWord },
  "couleur-chose": { label: "De quelle couleur est une chose, en anglais", type: "qcm", make: makeColourThing },
  "couleur-francais": { label: "Le mot anglais d'une couleur nommée en français", type: "qcm", make: makeColourFrench },
  "couleur-relier": { label: "Relier une couleur et son mot anglais", type: "match", make: makeColourLinks },
  "couleur-glisser": { label: "Glisser des dessins sous leur couleur anglaise", type: "drag-drop", make: makeColourSort },
  "couleur-phrase": { label: "It is, une phrase à trou avec une couleur", type: "fill-blank", make: makeColourSentence },
  // Les nombres de 0 à 10 du CI en anglais.
  "compte-mot": { label: "Le mot anglais d'un chiffre de 0 à 10", type: "qcm", make: makeCountWord },
  "compte-chiffre": { label: "Le chiffre d'un mot anglais, de 0 à 10", type: "fill-blank", make: makeCountDigit },
  "compte-dessins": { label: "Compter de 1 à 10 dessins et choisir le mot anglais", type: "qcm", make: makeCountDrawings },
  "compte-relier": { label: "Relier un chiffre et son mot anglais", type: "match", make: makeCountLinks },
  "compte-relier-dessins": { label: "Relier un groupe de dessins et son mot anglais", type: "match", make: makeCountDrawingLinks },
  "compte-ordre": { label: "Ranger des nombres écrits en anglais, de 0 à 10", type: "order", make: makeCountOrder },
  "compte-suivant": { label: "Le mot anglais du chiffre d'après", type: "qcm", make: makeCountNext },
  "compte-suite": { label: "Compléter une suite de nombres en anglais", type: "fill-blank", make: makeCountSeries },
  "compte-glisser": { label: "Moins ou plus qu'un chiffre, en anglais, de 0 à 10", type: "drag-drop", make: makeCountSort },
  // Saluer et se présenter en anglais.
  "salut-francais": { label: "Le mot anglais d'une formule nommée en français", type: "qcm", make: makeSayingFrench },
  "salut-dessin": { label: "Le mot anglais d'un moment ou d'un signe dessiné", type: "qcm", make: makeSayingDrawing },
  "salut-situation": { label: "Le mot anglais qui va avec une situation", type: "qcm", make: makeSayingSituation },
  "salut-relier": { label: "Relier une salutation et son sens", type: "match", make: makeSayingLinks },
  "salut-glisser": { label: "Pour dire bonjour ou pour dire au revoir, en anglais", type: "drag-drop", make: makeSayingSort },
  "salut-prenom": { label: "Remettre I am ou My name is dans l'ordre", type: "order", make: makeIntroduceOrder },
  "salut-trou": { label: "My name is, une phrase à trou", type: "fill-blank", make: makeIntroduceGap },
  "salut-trou-dessin": { label: "Good morning ou good night, une phrase à trou avec un dessin", type: "fill-blank", make: makeGoodGap },
  "salut-rencontre": { label: "Ranger les paroles d'une rencontre en anglais", type: "order", make: makeMeetingOrder },
  // L'instruction civique du CI (`civique.ts`) : une situation, un bon geste et des gestes à éviter ; la route, l'école, l'entraide, le respect.
  "civ-situation": { label: "Que fais-tu dans cette situation", type: "qcm", make: makeSceneChoice },
  "civ-glisser": { label: "Glisser des gestes sous « à faire » ou « à éviter »", type: "drag-drop", make: makeActSort },
  "civ-intrus": { label: "Quel geste est bien, ou n'est pas bien, parmi trois", type: "qcm", make: makeActOdd },
  "civ-relier": { label: "Relier une situation et le bon geste", type: "match", make: makeSceneLinks },
  "civ-ordre": { label: "Remettre des gestes dans l'ordre", type: "order", make: makeSequence },
  "civ-trou": { label: "Compléter une règle de vie", type: "fill-blank", make: makeRuleGap },
  // Les sciences du CI, première partie (`milieuCi.ts`) : naturel ou fabriqué, les animaux, les plantes.
  "milieu-intrus": { label: "Quelle chose est fabriquée, ou naturelle, parmi trois", type: "qcm", make: makeMilieuOdd },
  "milieu-glisser": { label: "Glisser des choses sous « naturel » ou « fabriqué »", type: "drag-drop", make: makeMilieuSort },
  "milieu-trou": { label: "Compléter une phrase sur les choses naturelles ou fabriquées", type: "fill-blank", make: makeMilieuGap },
  "faune-glisser": { label: "Glisser des animaux sous « domestiques » ou « sauvages »", type: "drag-drop", make: makeFauneSort },
  "faune-habitat": { label: "Glisser des animaux dans l'eau, sur la terre ou dans les airs", type: "drag-drop", make: makeFauneHabitat },
  "faune-intrus": { label: "Quel animal est domestique, ou sauvage, parmi trois", type: "qcm", make: makeFauneOdd },
  "faune-couvre": { label: "Quel animal a des poils, des plumes ou des écailles", type: "qcm", make: makeFauneCover },
  "faune-vit": { label: "Quel animal vit dans l'eau, ou vole dans le ciel", type: "qcm", make: makeFauneLives },
  "faune-relier": { label: "Relier un animal et l'endroit où il vit", type: "match", make: makeFauneLinks },
  "faune-trou": { label: "Compléter une phrase sur un animal", type: "fill-blank", make: makeFauneGap },
  "plante-partie": { label: "Quelle partie de la plante répond à la question", type: "qcm", make: makePlantePart },
  "plante-qui": { label: "Quelle plante donne ce fruit ou ces graines", type: "qcm", make: makePlanteWho },
  "plante-donne": { label: "Relier une plante et ce qu'elle donne", type: "match", make: makePlanteLinks },
  "plante-type": { label: "Glisser des plantes sous « un arbre » ou « une plante du champ »", type: "drag-drop", make: makePlanteSort },
  "plante-ordre": { label: "Remettre les parties de la plante dans l'ordre, du bas vers le haut", type: "order", make: makePlanteOrder },
  "plante-trou": { label: "Compléter une phrase sur les plantes", type: "fill-blank", make: makePlanteGap },
  // Les sciences du CI, seconde partie (`soinsCi.ts`) : le corps et la propreté, les outils de la maison et de l'école.
  "hygiene-situation": { label: "Que fais-tu pour rester propre, dans cette situation", type: "qcm", make: makeHygieneChoice },
  "hygiene-glisser": { label: "Glisser des gestes de propreté sous « à faire » ou « à éviter »", type: "drag-drop", make: makeHygieneSort },
  "hygiene-intrus": { label: "Quel geste est bon, ou mauvais, pour la santé parmi trois", type: "qcm", make: makeHygieneOdd },
  "hygiene-ordre": { label: "Remettre les gestes de la propreté dans l'ordre", type: "order", make: makeHygieneSteps },
  "hygiene-sens": { label: "Avec quelle partie du corps je vois, j'entends, je sens, je goûte, je prends", type: "qcm", make: makeHygieneSense },
  "hygiene-soin": { label: "Relier une partie du corps et son soin", type: "match", make: makeHygieneCare },
  "hygiene-trou": { label: "Compléter une phrase sur la propreté", type: "fill-blank", make: makeHygieneGap },
  "outil-qui": { label: "Avec quel outil je fais cela", type: "qcm", make: makeToolWho },
  "outil-relier": { label: "Relier un outil et ce qu'il sert à faire", type: "match", make: makeToolLinks },
  "outil-trou": { label: "Compléter une phrase avec le bon outil", type: "fill-blank", make: makeToolGap },
  "outil-ordre": { label: "Remettre les gestes d'un outil dans l'ordre", type: "order", make: makeToolSteps },
  "outil-geste": { label: "Que fais-tu avec cet outil, dans cette situation", type: "qcm", make: makeToolChoice },
  "outil-glisser": { label: "Glisser des gestes d'outil sous « à faire » ou « à éviter »", type: "drag-drop", make: makeToolSort },
  // Les arts plastiques du CI (`plastiqueCi.ts`) : les couleurs, les formes, les frises.
  "teinte-chose": { label: "Quelle chose est de cette couleur, parmi trois", type: "qcm", make: makeTeinteChoice },
  "teinte-relier": { label: "Relier une chose et sa couleur", type: "match", make: makeTeinteLinks },
  "teinte-glisser": { label: "Glisser des choses sous leur couleur", type: "drag-drop", make: makeTeinteSort },
  "teinte-ordre": { label: "Remettre les couleurs du drapeau, du feu ou de l'arc-en-ciel dans l'ordre", type: "order", make: makeTeinteOrder },
  "contour-chose": { label: "Quelle forme a cet objet, parmi trois formes", type: "qcm", make: makeContourChoice },
  "contour-relier": { label: "Relier un objet et sa forme", type: "match", make: makeContourLinks },
  "contour-glisser": { label: "Glisser des objets sous leur forme", type: "drag-drop", make: makeContourSort },
  "contour-trou": { label: "Compléter une phrase sur la forme d'un objet", type: "fill-blank", make: makeContourGap },
  "guirlande-suite": { label: "Quel dessin continue la frise, parmi trois", type: "qcm", make: makeFriseNext },
  "guirlande-intrus": { label: "Quel dessin n'est pas à sa place dans la frise, parmi trois", type: "qcm", make: makeFriseOdd },
  // Les mimes et les émotions du CI (`mimesCi.ts`).
  "visage-glisser": { label: "Glisser des visages sous leur émotion", type: "drag-drop", make: makeVisageSort },
  "visage-quel": { label: "Quel visage montre cette émotion, parmi trois", type: "qcm", make: makeVisageWhich },
  "visage-emotion": { label: "Quelle émotion montre ce visage, parmi trois", type: "qcm", make: makeVisageEmotion },
  "visage-relier": { label: "Relier un visage et son émotion", type: "match", make: makeVisageLinks },
  "emotion-situation": { label: "Quelle émotion ressens-tu dans cette situation", type: "qcm", make: makeEmotionSituation },
  "emotion-geste": { label: "Quel geste fais-tu avec cette émotion", type: "qcm", make: makeEmotionGesture },
  "cri-animal": { label: "Quel animal fait ce cri, parmi trois dessins", type: "qcm", make: makeCriAnimal },
  "cri-relier": { label: "Relier un animal et son cri", type: "match", make: makeCriLinks },
  "emotion-trou": { label: "Compléter une phrase sur ce que l'on fait avec une émotion", type: "fill-blank", make: makeEmotionGap },
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
