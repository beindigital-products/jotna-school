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
 * LES SCIENCES DU CP ET « JOUER UN RÔLE » : solide, liquide ou gaz ; les êtres vivants grandissent ; bien manger ; les maladies
 * du milieu ; protéger la nature ; jouer un rôle.
 *
 * Chaque test RECALCULE la bonne réponse depuis l'énoncé et les tuiles, avec ses propres tables écrites à part (l'état de chaque
 * chose, les étapes de chaque vie, chaque scène avec son bon geste et ses trois mauvais, les aliments, les métiers avec leurs
 * gestes et leur objet, les cris). Un gabarit dont la réponse contredit sa table échoue. À la fin, des MUTATIONS : on abîme la
 * bonne réponse d'un exercice juste, et chaque vérification doit le voir. L'échantillon du modèle comptait quatre exercices
 * faux sur trente et un (« Mafé » rangé dans « Liquide », des paires qui se suivent, « Plat » relié deux fois, un chapeau pour
 * le pêcheur).
 */

const LEVELS: GameLevel[] = [1, 2, 3, 4];
const draws = LEVELS.flatMap((level) => Array.from({ length: 60 }, (_, n) => ({ level, seed: `sci:${level}:${n}` })));
const make = (kind: GameKind, topic: string | undefined, d: (typeof draws)[number]) =>
  GAME_KINDS[kind].make(makeContext("CP", d.level, `${kind}:${d.seed}`, undefined, topic));

type Exo = { prompt: string; answerKey: string; hints: string[]; payload: Record<string, unknown> };
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
const low = (text: string) => text.toLowerCase();
/** Le nom seul d'une chose, en minuscules et sans article : « la pierre » donne « pierre ». */
const bare = (phrase: string) => low(phrase).replace(/^(l'|le |la |les |un |une |du |de la |des )/u, "");
/** Ce que montre la tuile d'une chose : son nom seul, avec sa majuscule (« la pierre » donne « Pierre »). */
const tileOf = (phrase: string) => `${bare(phrase)[0].toUpperCase()}${bare(phrase).slice(1)}`;
const apostrophes = (text: string) => (text.match(/'/g) ?? []).length;
const wordCount = (text: string) => text.split(/\s+/).filter((token) => /[\p{L}\p{N}]/u.test(token)).length;
const same = (a: readonly string[], b: readonly string[]) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());

type Check = (exo: Exo) => string | null;
const ok = (condition: boolean, message: string) => (condition ? null : message);

// ---------------------------------------------------------------------------
// Les tables de vérité, écrites à part des gabarits
// ---------------------------------------------------------------------------

// ===== Solide, liquide ou gaz =====
const STATES = ["solide", "liquide", "gaz"];
const STATE_OF: Record<string, string> = {
  "le bois": "solide",
  "la pierre": "solide",
  "le fer": "solide",
  "la glace": "solide",
  "le caillou": "solide",
  "la craie": "solide",
  "le sable": "solide",
  "l'eau": "liquide",
  "le lait": "liquide",
  "l'huile": "liquide",
  "le jus de bissap": "liquide",
  "la pluie": "liquide",
  "l'air": "gaz",
  "la vapeur d'eau": "gaz",
  "le vent": "gaz",
};
const STATE_OF_TILE: Record<string, string> = Object.fromEntries(Object.entries(STATE_OF).map(([thing, state]) => [bare(thing), state]));
/** [question, bonne réponse, mauvais choix] : les choix sont des tuiles, le nom seul. */
const CHANGE: [string, string, string[]][] = [
  ["Que devient un glaçon posé au soleil ?", "Eau", ["Pierre", "Bois"]],
  ["Que devient l'eau mise longtemps au congélateur ?", "Glace", ["Vapeur", "Lait"]],
  ["Que voit-on monter d'une casserole qui bout ?", "Vapeur", ["Glace", "Sable"]],
];
const MATTER_ORDER: [string, string[]][] = [
  ["Mets dans le bon ordre ce que devient un glaçon chauffé longtemps.", ["Glace", "Eau", "Vapeur"]],
  ["Mets dans le bon ordre ce que devient de la vapeur qu'on refroidit longtemps.", ["Vapeur", "Eau", "Glace"]],
];
/** [phrase, bonne réponse, mauvais choix] */
const MATTER_GAP: [string, string, string[]][] = [
  ["Un ___ garde sa forme.", "solide", ["liquide", "gaz"]],
  ["Un ___ coule et prend la forme du verre.", "liquide", ["solide", "gaz"]],
  ["Un ___ remplit toute la place qu'il trouve.", "gaz", ["solide", "liquide"]],
  ["L'air est un ___.", "gaz", ["solide", "liquide"]],
  ["La glace est de l'eau ___.", "solide", ["liquide", "gaz"]],
  ["L'eau du robinet est un ___.", "liquide", ["solide", "gaz"]],
  ["Le bois est un ___.", "solide", ["liquide", "gaz"]],
  ["Le lait est un ___.", "liquide", ["solide", "gaz"]],
  ["Au congélateur, l'eau devient de la ___.", "glace", ["vapeur", "pierre"]],
  ["Quand l'eau bout dans la casserole, elle donne de la ___.", "vapeur", ["glace", "poussière"]],
  ["Au soleil, un glaçon ___.", "fond", ["durcit", "grandit"]],
];
/** [énoncé, réponses admises] */
const MATTER_WORD: [string, string[]][] = [
  ["Dans le congélateur, l'eau devient dure comme une pierre. Écris le mot qui la nomme.", ["glace", "la glace", "de la glace", "glaçon", "un glaçon", "le glaçon"]],
  ["Quand une casserole bout, un nuage blanc monte. Écris son nom.", ["vapeur", "la vapeur", "de la vapeur"]],
  ["Une pierre garde sa forme. Écris le mot qui dit son état.", ["solide", "un solide"]],
  ["Le lait coule dans un verre. Écris le mot qui dit son état.", ["liquide", "un liquide"]],
  ["Autour de nous, il y a de l'air. Écris le mot qui dit son état.", ["gaz", "un gaz"]],
];

// ===== Les êtres vivants grandissent =====
const LIFE: Record<string, string[]> = {
  "de la poule": ["l'œuf", "le poussin", "la poule"],
  "de la plante": ["la graine", "la jeune plante", "la plante"],
  "de la personne": ["le bébé", "l'enfant", "l'adulte", "le vieillard"],
  "de la grenouille": ["l'œuf", "le têtard", "la grenouille"],
};
/** Le petit de chaque animal. */
const YOUNG_OF: Record<string, string> = {
  "la poule": "le poussin",
  "le chien": "le chiot",
  "le chat": "le chaton",
  "le mouton": "l'agneau",
  "la vache": "le veau",
  "la chèvre": "le chevreau",
  "le cheval": "le poulain",
};
const ADULT_OF_PHRASE: Record<string, string> = {
  "de la poule": "la poule",
  "du chien": "le chien",
  "du chat": "le chat",
  "du mouton": "le mouton",
  "de la vache": "la vache",
  "de la chèvre": "la chèvre",
  "du cheval": "le cheval",
};
const GROWS = new Set(["le poussin", "le chat", "l'enfant", "le manguier", "le mil", "le mouton", "le bébé", "le baobab", "la plante", "le chiot", "le têtard", "la chèvre"]);
const STAYS = new Set(["la pierre", "la chaise", "le cahier", "le seau", "le ballon", "la table", "le crayon", "la tasse", "le caillou", "le balai"]);
const YOUNG_OF_TILE: Record<string, string> = Object.fromEntries(Object.entries(YOUNG_OF).map(([adult, young]) => [bare(adult), tileOf(young)]));
const ADULT_TILES = Object.keys(YOUNG_OF).map(tileOf);
const GROWS_T = new Set([...GROWS].map(bare));
const STAYS_T = new Set([...STAYS].map(bare));
const LIFE_GAP: [string, string, string[]][] = [
  ["Un œuf de poule donne un ___.", "poussin", ["chiot", "agneau"]],
  ["Le poussin devient une ___ en grandissant.", "poule", ["graine", "pierre"]],
  ["Une graine pousse et devient une ___.", "plante", ["poule", "pierre"]],
  ["Le bébé devient un ___ en grandissant.", "enfant", ["poussin", "têtard"]],
  ["Un enfant devient un ___ en grandissant.", "adulte", ["poussin", "têtard"]],
  ["Le têtard devient une ___.", "grenouille", ["poule", "graine"]],
  ["Une ___ ne grandit pas.", "pierre", ["plante", "poule"]],
  ["Le petit du chien s'appelle le ___.", "chiot", ["poussin", "veau"]],
  ["Le petit de la vache s'appelle le ___.", "veau", ["chaton", "agneau"]],
];

// ===== Les habitudes : bien manger, les maladies, la nature =====
/** [thème, groupe, situation, étiquette, bon geste, trois mauvais gestes] */
type Row = [string, string, string, string, string, string, string, string];
const TABLE: Row[] = [
  ["manger", "mains", "Tu vas manger ton repas.", "Avant de manger", "Je me lave les mains avec du savon avant de manger.", "Je mange avec des mains sales.", "Je touche le sol puis je mange.", "Je m'essuie les mains sur mon pantalon."],
  ["manger", "mains", "Tu aides à préparer le repas.", "Tu aides en cuisine", "Je me lave les mains avant de toucher la nourriture.", "Je touche la nourriture avec des mains sales.", "Je goûte la sauce avec mes doigts sales.", "Je pose la viande crue sur le sol."],
  ["manger", "fruit", "Tu as acheté un fruit au marché.", "Un fruit du marché", "Je lave le fruit avant de le manger.", "Je mange le fruit sans le laver.", "Je ramasse le fruit par terre et je le mange.", "Je frotte le fruit sur mon habit sale."],
  ["manger", "reste", "Il reste du riz après le repas.", "Du riz qui reste", "Je couvre le riz qui reste avec un couvercle.", "Je laisse le riz sans couvercle toute la nuit.", "Je laisse le riz par terre dans la cour.", "Je pose le riz sur le sol de la cuisine."],
  ["manger", "poisson", "Le poisson sent très mauvais.", "Un poisson abîmé", "Je jette un poisson qui sent mauvais.", "Je mange un poisson qui sent mauvais.", "Je donne un poisson pourri à mon petit frère.", "Je mange un poisson pourri après l'avoir fait cuire."],
  ["manger", "pain", "Le pain a des taches vertes.", "Du pain avec des taches", "Je jette le pain qui a des taches vertes.", "Je mange le pain qui a des taches vertes.", "Je donne du pain moisi à mon camarade.", "Je range du pain moisi dans mon cartable."],
  ["manger", "bonbons", "On t'offre beaucoup de bonbons.", "Beaucoup de bonbons", "Je mange un bonbon et je garde le reste pour demain.", "Je mange tous les bonbons d'un seul coup.", "Je mange des bonbons à la place du repas.", "Je mange des bonbons toute la journée."],
  ["manger", "variete", "Tu veux bien manger.", "Un bon repas", "Je mange des fruits, des légumes et du poisson.", "Je mange seulement des bonbons.", "Je ne mange que du sucre.", "Je saute le repas pour manger des gâteaux."],
  ["manger", "table", "Le repas est servi.", "Le repas est servi", "Je m'assois à table pour manger calmement.", "Je mange en courant dans la cour.", "Je mange en jouant au ballon.", "Je mange debout en marchant partout."],
  ["maladies", "nuit", "La nuit, les moustiques sont nombreux.", "La nuit avec les moustiques", "Je dors sous une moustiquaire.", "Je dors sans moustiquaire.", "Je dors dans l'herbe, les bras à l'air.", "Je laisse la porte ouverte toute la nuit."],
  ["maladies", "eau-qui-dort", "De l'eau reste dans de vieux seaux.", "Eau dans de vieux seaux", "Je vide l'eau des vieux seaux.", "Je laisse l'eau dormir dans les vieux seaux.", "Je remplis d'eau les vieux seaux et je les laisse.", "Je laisse les seaux pleins d'eau sale dans la cour."],
  ["maladies", "boire", "Tu as très soif.", "Tu as soif", "Je bois de l'eau propre.", "Je bois l'eau sale de la mare.", "Je bois l'eau d'un seau plein de saletés.", "Je bois l'eau qui traîne dans la rue."],
  ["maladies", "mains", "Tu sors des toilettes.", "Tu sors des toilettes", "Je me lave les mains avec du savon après les toilettes.", "Je retourne jouer sans me laver les mains.", "Je m'essuie les mains sur mon habit.", "Je passe de l'eau sale sur mes mains."],
  ["maladies", "soin", "Tu as de la fièvre et tu te sens très mal.", "Tu as de la fièvre", "Je préviens un adulte pour aller au dispensaire.", "Je me cache et je ne dis rien.", "Je reste seul sans parler à personne.", "Je prends un médicament trouvé dans la rue."],
  ["maladies", "conseil", "Le médecin te donne un conseil.", "Un conseil du médecin", "J'écoute le médecin et je suis ses conseils.", "Je n'écoute pas le médecin.", "Je jette le médicament donné par le médecin.", "Je donne mon médicament à un camarade."],
  ["maladies", "soir", "Le soir, les moustiques sortent.", "Le soir arrive", "Je porte des habits longs le soir.", "Je sors torse nu à la tombée de la nuit.", "Je reste en short près de la mare le soir.", "Je joue dehors sans rien sur les bras le soir."],
  ["maladies", "soin", "Ton ventre te fait mal et tu vas souvent aux toilettes.", "Ton ventre te fait mal", "Je dis à un adulte que j'ai mal au ventre.", "Je cache mon mal de ventre à tout le monde.", "Je bois de l'eau sale pour me soigner.", "Je cours jouer en oubliant mon mal de ventre."],
  ["nature", "dechet", "Tu as fini ton goûter, le sachet est vide.", "Un sachet vide", "Je mets le sachet vide à la poubelle.", "Je jette le sachet vide par terre.", "Je jette le sachet vide dans la rivière.", "Je cache le sachet vide sous une pierre."],
  ["nature", "cour", "La cour est pleine de papiers.", "Une cour pleine de papiers", "Je ramasse les papiers de la cour.", "Je laisse les papiers par terre.", "J'ajoute d'autres papiers sur le sol.", "Je pousse les papiers sous un arbre."],
  ["nature", "arbre", "Tu as un petit arbre à planter.", "Un petit arbre à planter", "Je plante le petit arbre dans la terre.", "Je jette le petit arbre sur le sol.", "Je piétine le petit arbre.", "Je coupe le petit arbre pour jouer."],
  ["nature", "arbre", "Le petit arbre a soif.", "Un arbre qui a soif", "J'arrose le petit arbre avec de l'eau.", "Je laisse le petit arbre sans eau pendant des jours.", "Je tire fort sur les feuilles du petit arbre.", "Je coupe les branches du petit arbre sans raison."],
  ["nature", "oiseaux", "Tu trouves un nid d'oiseau dans un arbre.", "Un nid dans un arbre", "Je laisse le nid tranquille.", "Je prends les œufs du nid.", "Je jette des cailloux sur le nid.", "Je casse la branche du nid."],
  ["nature", "insectes", "Un papillon se pose sur une fleur.", "Un papillon sur une fleur", "Je regarde le papillon sans le toucher.", "J'attrape le papillon pour le serrer fort.", "J'écrase le papillon avec mon pied.", "J'enferme le papillon dans une boîte fermée."],
  ["nature", "fleurs", "Il y a des fleurs dans le jardin de l'école.", "Des fleurs à l'école", "Je regarde les fleurs sans les arracher.", "J'arrache les fleurs pour jouer.", "Je marche sur les fleurs pour aller plus vite.", "Je coupe toutes les fleurs sans raison."],
  ["nature", "dechet", "Des sacs en plastique volent dans la rue.", "Des sacs en plastique", "Je ramasse les sacs en plastique avec un adulte.", "Je laisse les sacs en plastique dans la rue.", "Je jette les sacs en plastique dans le fleuve.", "Je mets le feu aux sacs en plastique."],
  ["nature", "chien", "Un chien a soif dans la cour.", "Un chien qui a soif", "Je donne de l'eau à un chien qui a soif.", "Je lance des cailloux à un chien qui a soif.", "Je chasse un chien qui a soif avec un bâton.", "Je tire la queue d'un chien qui a soif."],
  ["nature", "ombre", "Un grand arbre donne de l'ombre dans la cour.", "Un arbre qui fait de l'ombre", "Je prends soin du grand arbre de la cour.", "Je grave mon nom dans l'écorce du grand arbre.", "Je casse les branches du grand arbre.", "Je mets le feu au pied du grand arbre."],
];

const RIGHT_OF_TEXT = new Map(TABLE.map((row) => [row[2], row[4]]));
const WRONGS_OF_TEXT = new Map(TABLE.map((row) => [row[2], [row[5], row[6], row[7]]]));
const TOPIC_OF_TEXT = new Map(TABLE.map((row) => [row[2], row[0]]));
const RIGHT_OF_LABEL = new Map(TABLE.map((row) => [row[3], row[4]]));
const GROUP_OF_LABEL = new Map(TABLE.map((row) => [row[3], row[1]]));
const ALL_RIGHT = new Set(TABLE.map((row) => row[4]));
const ALL_WRONG = new Set(TABLE.flatMap((row) => [row[5], row[6], row[7]]));
const SCENE_OF_ACT = new Map(TABLE.flatMap((row) => [row[4], row[5], row[6], row[7]].map((act) => [act, row[2]] as const)));

/** [thème, énoncé, étapes] */
const ROUTINE: [string, string, string[]][] = [
  ["manger", "Mets ces gestes dans le bon ordre pour manger propre.", ["Je me lave les mains.", "Je m'assois à table.", "Je mange mon repas."]],
  ["manger", "Mets ces gestes dans le bon ordre pour manger un fruit.", ["Je prends le fruit.", "Je lave le fruit avec de l'eau propre.", "Je mange le fruit."]],
  ["manger", "Mets ces gestes dans le bon ordre pour préparer le poisson.", ["Je me lave les mains.", "Je lave le poisson.", "Je fais cuire le poisson."]],
  ["maladies", "Mets ces gestes dans le bon ordre quand tu es malade.", ["Je dis que je suis malade.", "Je vais au dispensaire avec un adulte.", "Je suis les conseils du médecin."]],
  ["maladies", "Mets ces gestes dans le bon ordre après les toilettes.", ["Je sors des toilettes.", "Je me lave les mains avec du savon.", "Je retourne en classe."]],
  ["maladies", "Mets ces gestes dans le bon ordre pour boire de l'eau propre.", ["Je prends un verre propre.", "Je verse de l'eau propre.", "Je bois mon eau."]],
  ["nature", "Mets ces gestes dans le bon ordre pour planter un arbre.", ["Je fais un trou dans la terre.", "Je plante le petit arbre.", "J'arrose le petit arbre."]],
  ["nature", "Mets ces gestes dans le bon ordre pour garder la cour propre.", ["Je prends un balai.", "Je balaie la cour.", "Je mets les déchets à la poubelle."]],
  ["nature", "Mets ces gestes dans le bon ordre pour jeter un sachet.", ["Je mange mon goûter.", "Je prends le sachet vide.", "Je mets le sachet à la poubelle."]],
];

/** [thème, phrase, bonne réponse, mauvais choix] */
const HABIT_GAP: [string, string, string, string[]][] = [
  ["manger", "Avant de manger, je me lave les ___.", "mains", ["pieds", "genoux"]],
  ["manger", "Je lave le fruit avec de l'eau ___.", "propre", ["sale", "boueuse"]],
  ["manger", "Un aliment pourri me rend ___.", "malade", ["content", "fort"]],
  ["manger", "Trop de bonbons abîment mes ___.", "dents", ["chaussures", "cheveux"]],
  ["manger", "Je couvre le repas pour que les ___ ne se posent pas dessus.", "mouches", ["éléphants", "étoiles"]],
  ["manger", "Le poisson, le mil et le niébé sont des aliments ___.", "utiles", ["nuisibles", "pourris"]],
  ["manger", "Je mange des fruits et des ___ tous les jours.", "légumes", ["cailloux", "crayons"]],
  ["maladies", "Le paludisme se prend par la piqûre d'un ___.", "moustique", ["escargot", "papillon"]],
  ["maladies", "Pour dormir sans être piqué, je mets une ___.", "moustiquaire", ["casserole", "chaussure"]],
  ["maladies", "L'eau sale peut donner la ___.", "diarrhée", ["chance", "musique"]],
  ["maladies", "Je bois de l'eau ___ pour ne pas être malade.", "propre", ["sale", "trouble"]],
  ["maladies", "Je me lave les mains avec du ___.", "savon", ["sable", "sucre"]],
  ["maladies", "Quand je suis malade, je vais au ___.", "dispensaire", ["marché", "stade"]],
  ["maladies", "Les moustiques pondent dans l'eau qui ne ___ pas.", "bouge", ["chante", "mange"]],
  ["nature", "Je mets mes déchets dans la ___.", "poubelle", ["rivière", "rue"]],
  ["nature", "Un petit arbre a besoin d'être ___ souvent.", "arrosé", ["coupé", "brûlé"]],
  ["nature", "Les sachets en plastique abîment la ___.", "nature", ["musique", "soupe"]],
  ["nature", "Je ramasse les papiers pour garder la cour ___.", "propre", ["sale", "cassée"]],
  ["nature", "Pour protéger les oiseaux, je laisse leur ___ tranquille.", "nid", ["cartable", "ballon"]],
  ["nature", "Quand un arbre est coupé, je plante un nouvel ___.", "arbre", ["ballon", "cahier"]],
  ["nature", "Je ne jette pas de papier ___.", "par terre", ["à la poubelle", "dans le sac"]],
];

// ===== Les aliments, les maladies, la nature =====
const GOOD = ["la mangue", "la banane", "l'orange", "la papaye", "la carotte", "le chou", "le poisson frais", "le mil", "le lait caillé", "le niébé"];
const BAD = ["trop de bonbons", "trop de sucre", "trop de gâteaux", "du poisson pourri", "du pain moisi", "du riz resté au soleil", "un fruit pourri", "de la viande avariée"];
const FRUITS = ["la mangue", "la banane", "l'orange", "la papaye", "la pastèque", "la goyave"];
const VEGETABLES = ["la carotte", "le chou", "la laitue", "l'oignon", "le navet"];
const GOOD_T = GOOD.map(bare);
const BAD_T = BAD.map(bare);
const FRUITS_T = FRUITS.map(bare);
const VEGETABLES_T = VEGETABLES.map(bare);
const MALARIA = ["Dormir sous une moustiquaire", "Vider les vieux seaux d'eau", "Porter des habits longs le soir", "Fermer la fenêtre avant la nuit"];
const DIARRHEA = ["Boire de l'eau propre", "Se laver les mains avec du savon", "Laver les fruits avant de les manger", "Couvrir les restes du repas"];
/** [question, bonne réponse, mauvais choix] */
const ILLNESS: [string, string, string[]][] = [
  ["Par quoi le paludisme se prend-il ?", "la piqûre d'un moustique", ["la piqûre d'une fourmi", "le vent du soir"]],
  ["Qu'est-ce qui peut donner la diarrhée ?", "boire de l'eau sale", ["dormir sous une moustiquaire", "se laver les mains"]],
  ["Qu'est-ce qui peut donner la diarrhée ?", "manger avec des mains sales", ["boire de l'eau propre", "dormir sous une moustiquaire"]],
  ["Que faut-il faire pour ne pas attraper le paludisme ?", "dormir sous une moustiquaire", ["laisser l'eau dormir dans les seaux", "sortir torse nu le soir"]],
  ["Que faut-il faire pour ne pas attraper la diarrhée ?", "se laver les mains avec du savon", ["dormir sous une moustiquaire", "jouer dans l'eau sale"]],
  ["Où va-t-on quand on est très malade ?", "au dispensaire", ["au marché", "au stade"]],
];
/** [groupe, problème, réparation] */
const REPAIR: [string, string, string][] = [
  ["propre", "Une cour sale", "La balayer"],
  ["propre", "Des papiers par terre", "Les ramasser"],
  ["plante", "Une plante sans eau", "L'arroser"],
  ["arbre", "Un arbre coupé", "Planter un arbre"],
  ["arbre", "Une fleur arrachée", "Planter une fleur"],
  ["animal", "Un chien qui a soif", "Lui donner de l'eau"],
  ["dechet", "Un sachet par terre", "À la poubelle"],
];

// ===== Jouer un rôle =====
/** [métier, « à… », étiquette, premier geste, second geste, objet, à quoi l'objet sert] */
type Job = [string, string, string, string, string, string, string];
const JOBS: Job[] = [
  ["le vendeur", "au vendeur", "vendeur", "vend des mangues au marché", "pèse les fruits sur la balance", "une balance", "à peser ce qu'on achète"],
  ["le maître", "au maître", "maître", "apprend à lire aux élèves", "écrit au tableau", "une craie", "à écrire sur le tableau noir"],
  ["l'infirmière", "à l'infirmière", "infirmière", "soigne les malades", "prend la température", "un thermomètre", "à mesurer la fièvre"],
  ["le pêcheur", "au pêcheur", "pêcheur", "attrape des poissons", "répare ses filets", "un filet", "à prendre les poissons dans l'eau"],
  ["le cultivateur", "au cultivateur", "cultivateur", "cultive le champ", "sème le mil", "une daba", "à retourner la terre du champ"],
  ["le chauffeur", "au chauffeur", "chauffeur", "conduit le car", "tient le volant", "un volant", "à guider le car"],
  ["le tailleur", "au tailleur", "tailleur", "coud des habits", "prend les mesures d'un client", "une machine à coudre", "à assembler le tissu avec du fil"],
  ["le boulanger", "au boulanger", "boulanger", "fait le pain", "fait cuire des baguettes", "un four", "à cuire la pâte"],
];
const JOB_NAMES = JOBS.map((job) => tileOf(job[0]));
const jobOfTask = (task: string) => JOBS.find((job) => job[3] === task || job[4] === task);
const JOB_GAP: [string, string, string[]][] = [
  ["Le ___ attrape des poissons avec un filet.", "pêcheur", ["vendeur", "tailleur"]],
  ["L'infirmière soigne les ___.", "malades", ["poissons", "habits"]],
  ["Le maître apprend à lire aux ___.", "élèves", ["poissons", "champs"]],
  ["Pour jouer le pêcheur, je prends un ___.", "filet", ["four", "volant"]],
  ["Le boulanger fait cuire le ___.", "pain", ["filet", "tableau"]],
  ["Le cultivateur travaille dans son ___.", "champ", ["four", "tableau"]],
  ["Le chauffeur conduit le ___.", "car", ["poisson", "pain"]],
  ["Le tailleur coud des ___.", "habits", ["poissons", "pains"]],
  ["Le vendeur pèse les fruits sur la ___.", "balance", ["craie", "daba"]],
];
const JOB_ORDER: [string, string[]][] = [
  ["Mets dans le bon ordre le travail du pêcheur.", ["Il lance son filet.", "Il tire son filet.", "Il apporte les poissons au marché."]],
  ["Mets dans le bon ordre le travail du boulanger.", ["Il prépare la pâte.", "Il fait cuire le pain.", "Il vend le pain chaud."]],
  ["Mets dans le bon ordre une visite chez l'infirmière.", ["Le malade entre au dispensaire.", "L'infirmière prend sa température.", "L'infirmière le soigne."]],
  ["Mets dans le bon ordre un achat au marché.", ["Le client dit bonjour.", "Le client choisit une mangue.", "Le client paye le vendeur."]],
  ["Mets dans le bon ordre le jeu de rôles.", ["Je choisis mon rôle.", "Je prends mon déguisement.", "Je joue mon rôle avec mes amis."]],
  ["Mets dans le bon ordre le travail du cultivateur.", ["Il prépare la terre avec sa daba.", "Il sème le mil.", "Il récolte le mil mûr."]],
];
/** [énoncé, métier attendu, réponses admises] : le métier est désigné par ses gestes, jamais par son nom. */
const JOB_WORD: [string, string, string[]][] = [
  ["Dans un jeu de rôles, tu lances un filet à la mer pour attraper des poissons. Quel métier joues-tu ? Écris le mot.", "pêcheur", ["pêcheur", "un pêcheur", "le pêcheur", "pêcheuse", "une pêcheuse", "la pêcheuse"]],
  ["Dans un jeu de rôles, tu pèses des mangues et tu les vends au marché. Quel métier joues-tu ? Écris le mot.", "vendeur", ["vendeur", "un vendeur", "le vendeur", "vendeuse", "une vendeuse", "la vendeuse", "marchand", "un marchand", "le marchand", "marchande", "une marchande", "la marchande"]],
  ["Dans un jeu de rôles, tu fais cuire du pain dans un four. Quel métier joues-tu ? Écris le mot.", "boulanger", ["boulanger", "un boulanger", "le boulanger", "boulangère", "une boulangère", "la boulangère"]],
  ["Dans un jeu de rôles, tu couds des habits avec du fil et une aiguille. Quel métier joues-tu ? Écris le mot.", "tailleur", ["tailleur", "un tailleur", "le tailleur", "tailleuse", "une tailleuse", "la tailleuse", "couturier", "un couturier", "le couturier", "couturière", "une couturière", "la couturière"]],
  ["Dans un jeu de rôles, tu tiens un volant et tu conduis le car. Quel métier joues-tu ? Écris le mot.", "chauffeur", ["chauffeur", "un chauffeur", "le chauffeur", "chauffeuse", "une chauffeuse", "la chauffeuse", "conducteur", "un conducteur", "le conducteur", "conductrice", "une conductrice", "la conductrice"]],
  ["Dans un jeu de rôles, tu travailles la terre du champ avec une daba. Quel métier joues-tu ? Écris le mot.", "cultivateur", ["cultivateur", "un cultivateur", "le cultivateur", "cultivatrice", "une cultivatrice", "la cultivatrice", "paysan", "un paysan", "le paysan", "paysanne", "une paysanne", "la paysanne", "agriculteur", "un agriculteur", "l'agriculteur", "agricultrice", "une agricultrice", "l'agricultrice"]],
  ["Dans un jeu de rôles, tu écris au tableau et tu apprends à lire aux élèves. Quel métier joues-tu ? Écris le mot.", "maître", ["maître", "un maître", "le maître", "maîtresse", "une maîtresse", "la maîtresse", "instituteur", "un instituteur", "l'instituteur", "institutrice", "une institutrice", "l'institutrice"]],
  ["Dans un jeu de rôles, tu prends la température d'un malade et tu le soignes. Quel métier joues-tu ? Écris le mot.", "infirmière", ["infirmière", "une infirmière", "l'infirmière", "infirmier", "un infirmier", "l'infirmier", "médecin", "un médecin", "le médecin", "docteur", "un docteur", "le docteur", "docteure", "une docteure", "la docteure"]],
];
const CRY_OF: Record<string, string> = {
  "le chat": "miaou",
  "le chien": "ouaf",
  "la vache": "meuh",
  "le mouton": "bê",
  "le coq": "cocorico",
  "la grenouille": "coa-coa",
  "l'âne": "hi-han",
  "le canard": "coin-coin",
};
const ANIMAL_OF_CRY = Object.fromEntries(Object.entries(CRY_OF).map(([animal, cry]) => [cry, animal]));
const CRY_OF_TILE: Record<string, string> = Object.fromEntries(Object.entries(CRY_OF).map(([animal, cry]) => [bare(animal), cry]));
const ANIMAL_TILES = Object.keys(CRY_OF).map(tileOf);

// ---------------------------------------------------------------------------
// Les vérifications de chaque gabarit : elles recalculent la réponse
// ---------------------------------------------------------------------------

const KINDS = [
  "etat-qcm",
  "etat-glisser",
  "etat-relier",
  "etat-change",
  "etat-ordre",
  "etat-trou",
  "etat-ecrire",
  "vie-ordre",
  "vie-suite",
  "vie-petit",
  "vie-relier",
  "vie-glisser",
  "vie-trou",
  "habitude-situation",
  "habitude-glisser",
  "habitude-intrus",
  "habitude-relier",
  "habitude-ordre",
  "habitude-trou",
  "repas-qcm",
  "repas-glisser",
  "repas-fruit-legume",
  "maladie-glisser",
  "maladie-cause",
  "nature-reparer",
  "metier-qui",
  "metier-outil",
  "metier-relier",
  "metier-glisser",
  "metier-trou",
  "metier-ordre",
  "metier-ecrire",
  "imiter-qcm",
  "imiter-relier",
] as const satisfies readonly GameKind[];

/** Les gabarits d'habitudes se jouent avec la thématique du programme ; les autres n'en ont pas. */
const HABIT_KINDS: readonly string[] = ["habitude-situation", "habitude-glisser", "habitude-intrus", "habitude-relier", "habitude-ordre", "habitude-trou"];
const HABIT_TOPICS = ["manger", "maladies", "nature"];
const variants = (kind: string): (string | undefined)[] => (HABIT_KINDS.includes(kind) ? HABIT_TOPICS : [undefined]);

const ARTS_KINDS: readonly string[] = ["metier-qui", "metier-outil", "metier-relier", "metier-glisser", "metier-trou", "metier-ordre", "metier-ecrire", "imiter-qcm", "imiter-relier"];
const subjectOf = (kind: string) => (ARTS_KINDS.includes(kind) ? "Éducation artistique" : "Éveil scientifique");

const zonesLow = (exo: Exo) => zonesOf(exo).map(low);
const countsByZone = (exo: Exo) => zonesOf(exo).map((zone) => itemsOf(exo).filter((item) => item.correctZone === zone).length);

const CHECKS: Record<string, Check> = {
  // ----- Solide, liquide ou gaz
  "etat-qcm": (exo) => {
    const thing = /^Dans quel état est (.+) \?$/u.exec(exo.prompt)?.[1] ?? "";
    const state = STATE_OF[thing];
    return ok(state !== undefined, `chose inconnue : ${thing}`) ?? ok(rightOption(exo) === state, `${thing} est ${state}, la bonne option est « ${rightOption(exo)} »`) ?? ok(same(optionsOf(exo), STATES), `les choix sont ${optionsOf(exo).join(" | ")}`);
  },
  "etat-glisser": (exo) => {
    const zones = zonesLow(exo);
    if (zones.length !== 2 || new Set(zones).size !== 2 || !zones.every((zone) => STATES.includes(zone))) return `cases ${zonesOf(exo).join(" / ")}`;
    for (const item of itemsOf(exo)) {
      const state = STATE_OF_TILE[bare(item.text)];
      if (state === undefined || state !== low(item.correctZone)) return `« ${item.text} » est ${state}, l'exercice dit « ${item.correctZone} »`;
    }
    const counts = countsByZone(exo);
    return ok(counts[0] >= 2 && counts[0] === counts[1], "les deux cases n'ont pas le même nombre de choses");
  },
  "etat-relier": (exo) => {
    const pairs = pairsOf(exo);
    for (const pair of pairs) if (STATE_OF_TILE[bare(pair.right)] !== low(pair.left)) return `« ${pair.right} » est relié à « ${pair.left} », la table dit ${STATE_OF_TILE[bare(pair.right)]}`;
    return ok(same(pairs.map((pair) => low(pair.left)), STATES), "les trois états ne sont pas tous là");
  },
  "etat-change": (exo) => {
    const row = CHANGE.find((entry) => entry[0] === exo.prompt);
    const others = optionsOf(exo).filter((option) => option !== rightOption(exo));
    return ok(row !== undefined, `question inconnue : ${exo.prompt}`) ?? ok(rightOption(exo) === row![1], `la bonne option est « ${rightOption(exo)} », la table dit « ${row![1]} »`) ?? ok(same(others, row![2]), `mauvais choix ${others.join(" | ")}`);
  },
  "etat-ordre": (exo) => {
    const row = MATTER_ORDER.find((entry) => entry[0] === exo.prompt);
    return ok(row !== undefined, `suite inconnue : ${exo.prompt}`) ?? ok(JSON.stringify(sequenceOf(exo)) === JSON.stringify(row![1]), `les étapes disent ${sequenceOf(exo).join(" > ")}`);
  },
  "etat-trou": (exo) => {
    const row = MATTER_GAP.find((entry) => entry[0] === textOf(exo));
    return ok(row !== undefined, `phrase inconnue : ${textOf(exo)}`) ?? ok(blankOf(exo).answer === row![1], `la phrase veut « ${row![1]} », le trou dit « ${blankOf(exo).answer} »`) ?? ok(same(blankOf(exo).options, [row![1], ...row![2]]), `les choix : ${blankOf(exo).options.join(" | ")}`);
  },
  "etat-ecrire": (exo) => {
    const row = MATTER_WORD.find((entry) => entry[0] === exo.prompt);
    return ok(row !== undefined, `énoncé inconnu : ${exo.prompt}`) ?? ok(JSON.stringify(acceptedOf(exo)) === JSON.stringify(row![1]), `réponses admises ${acceptedOf(exo).join(" | ")}`) ?? ok(exo.answerKey === row![1][0], `clé ${exo.answerKey}`) ?? ok(!fold(exo.prompt).includes(fold(row![1][0])), "le mot est écrit dans l'énoncé");
  },
  // ----- Les êtres vivants grandissent
  "vie-ordre": (exo) => {
    const who = /^Mets dans le bon ordre les étapes de la vie (.+)\.$/u.exec(exo.prompt)?.[1] ?? "";
    const steps = LIFE[who];
    return ok(steps !== undefined, `vie inconnue : ${who}`) ?? ok(JSON.stringify(sequenceOf(exo)) === JSON.stringify(steps.map(tileOf)), `les étapes disent ${sequenceOf(exo).join(" > ")}`);
  },
  "vie-suite": (exo) => {
    const match = /^Dans la vie (.+), quelle étape vient juste (après|avant) (.+) \?$/u.exec(exo.prompt);
    if (!match) return `énoncé inconnu : ${exo.prompt}`;
    const [, who, way, step] = match;
    const steps = LIFE[who];
    if (!steps || !steps.includes(step)) return `étape inconnue : ${who} / ${step}`;
    const at = steps.indexOf(step);
    const neighbour = way === "après" ? steps[at + 1] : steps[at - 1];
    const expected = neighbour === undefined ? undefined : tileOf(neighbour);
    const others = optionsOf(exo).filter((option) => option !== rightOption(exo));
    return ok(expected !== undefined, "pas d'étape de ce côté") ?? ok(rightOption(exo) === expected, `après/avant ${step} vient « ${expected} », la bonne option est « ${rightOption(exo)} »`) ?? ok(others.length === 2 && others.every((option) => !steps.map(tileOf).includes(option)), `un mauvais choix est une étape de cette vie : ${others.join(" | ")}`);
  },
  "vie-petit": (exo) => {
    const asking = /^Comment s'appelle le petit (.+) \?$/u.exec(exo.prompt);
    const others = optionsOf(exo).filter((option) => option !== rightOption(exo));
    if (asking) {
      const adult = ADULT_OF_PHRASE[asking[1]];
      const young = YOUNG_OF[adult];
      return ok(young !== undefined, `animal inconnu : ${asking[1]}`) ?? ok(rightOption(exo) === tileOf(young), `le petit ${asking[1]} est « ${young} », la bonne option est « ${rightOption(exo)} »`) ?? ok(others.length === 2 && others.every((option) => Object.values(YOUNG_OF).map(tileOf).includes(option) && option !== tileOf(young)), `mauvais choix ${others.join(" | ")}`);
    }
    const reverse = /^(.+) est le petit de quel animal \?$/u.exec(exo.prompt);
    if (!reverse) return `énoncé inconnu : ${exo.prompt}`;
    const adult = Object.keys(YOUNG_OF).find((name) => low(YOUNG_OF[name]) === low(reverse[1]));
    return ok(adult !== undefined, `petit inconnu : ${reverse[1]}`) ?? ok(rightOption(exo) === tileOf(adult!), `la mère est « ${adult} », la bonne option est « ${rightOption(exo)} »`) ?? ok(others.length === 2 && others.every((option) => ADULT_TILES.includes(option) && option !== tileOf(adult!)), `mauvais choix ${others.join(" | ")}`);
  },
  "vie-relier": (exo) => {
    const pairs = pairsOf(exo);
    for (const pair of pairs) if (YOUNG_OF_TILE[bare(pair.left)] !== pair.right) return `« ${pair.left} » est relié à « ${pair.right} », la table dit « ${YOUNG_OF_TILE[bare(pair.left)]} »`;
    return ok(pairs.length >= 3 && pairs.length <= 4, "nombre de paires");
  },
  "vie-glisser": (exo) => {
    if (JSON.stringify(zonesOf(exo)) !== JSON.stringify(["Ça grandit", "Ça ne grandit pas"])) return `cases ${zonesOf(exo).join(" / ")}`;
    for (const item of itemsOf(exo)) {
      const zone = GROWS_T.has(bare(item.text)) ? "Ça grandit" : STAYS_T.has(bare(item.text)) ? "Ça ne grandit pas" : null;
      if (zone !== item.correctZone) return `« ${item.text} » va dans « ${zone} », l'exercice dit « ${item.correctZone} »`;
    }
    const counts = countsByZone(exo);
    return ok(counts[0] >= 2 && counts[0] === counts[1], "les deux cases n'ont pas le même nombre de mots");
  },
  "vie-trou": (exo) => {
    const row = LIFE_GAP.find((entry) => entry[0] === textOf(exo));
    return ok(row !== undefined, `phrase inconnue : ${textOf(exo)}`) ?? ok(blankOf(exo).answer === row![1], `la phrase veut « ${row![1]} », le trou dit « ${blankOf(exo).answer} »`) ?? ok(same(blankOf(exo).options, [row![1], ...row![2]]), `les choix : ${blankOf(exo).options.join(" | ")}`);
  },
  // ----- Les habitudes
  "habitude-situation": (exo) => {
    const text = exo.prompt.replace(/ Que faut-il faire \?$/u, "");
    const right = RIGHT_OF_TEXT.get(text);
    const wrongs = WRONGS_OF_TEXT.get(text) ?? [];
    const others = optionsOf(exo).filter((option) => option !== rightOption(exo));
    return ok(right !== undefined, `situation inconnue : ${text}`) ?? ok(rightOption(exo) === right, `la bonne option est « ${rightOption(exo)} », la table dit « ${right} »`) ?? ok(others.length === 2 && others.every((option) => wrongs.includes(option)), `un mauvais choix n'est pas un mauvais geste de cette scène : ${others.join(" | ")}`);
  },
  "habitude-glisser": (exo) => {
    if (JSON.stringify(zonesOf(exo)) !== JSON.stringify(["À faire", "À éviter"])) return `cases ${zonesOf(exo).join(" / ")}`;
    for (const item of itemsOf(exo)) {
      const zone = ALL_RIGHT.has(item.text) ? "À faire" : ALL_WRONG.has(item.text) ? "À éviter" : null;
      if (zone !== item.correctZone) return `« ${item.text} » va dans « ${zone} », l'exercice dit « ${item.correctZone} »`;
    }
    const scenes = itemsOf(exo).map((item) => SCENE_OF_ACT.get(item.text));
    const counts = countsByZone(exo);
    return ok(new Set(scenes).size === scenes.length, "deux gestes de la même scène") ?? ok(counts[0] >= 2 && counts[0] === counts[1], "les deux cases n'ont pas le même nombre de gestes");
  },
  "habitude-intrus": (exo) => {
    const wantsGood = exo.prompt === "Quel geste est bien ?";
    const wantsBad = exo.prompt === "Quel geste n'est pas bien ?";
    if (wantsGood === wantsBad) return `énoncé ${exo.prompt}`;
    const options = optionsOf(exo);
    const scenes = options.map((option) => SCENE_OF_ACT.get(option));
    const goods = options.filter((option) => ALL_RIGHT.has(option));
    const bads = options.filter((option) => ALL_WRONG.has(option));
    return (
      ok(options.length === 3 && goods.length + bads.length === 3, "un choix n'est pas dans la table") ??
      ok(new Set(scenes).size === 3, "deux choix viennent de la même scène") ??
      ok(wantsGood ? goods.length === 1 && goods[0] === rightOption(exo) : bads.length === 1 && bads[0] === rightOption(exo), `la bonne option est « ${rightOption(exo)} », ce n'est pas le seul geste ${wantsGood ? "bien" : "pas bien"} des trois`)
    );
  },
  "habitude-relier": (exo) => {
    const pairs = pairsOf(exo);
    for (const pair of pairs) if (RIGHT_OF_LABEL.get(pair.left) !== pair.right) return `« ${pair.left} » est relié à « ${pair.right} », la table dit « ${RIGHT_OF_LABEL.get(pair.left)} »`;
    const groups = pairs.map((pair) => GROUP_OF_LABEL.get(pair.left));
    return ok(pairs.length >= 3 && pairs.length <= 4, "nombre de paires") ?? ok(new Set(groups).size === pairs.length, `deux situations du même groupe : ${groups.join(" | ")}`);
  },
  "habitude-ordre": (exo) => {
    const row = ROUTINE.find((entry) => entry[1] === exo.prompt);
    return ok(row !== undefined, `suite inconnue : ${exo.prompt}`) ?? ok(JSON.stringify(sequenceOf(exo)) === JSON.stringify(row![2]), `les étapes disent ${sequenceOf(exo).join(" > ")}`);
  },
  "habitude-trou": (exo) => {
    const row = HABIT_GAP.find((entry) => entry[1] === textOf(exo));
    return ok(row !== undefined, `phrase inconnue : ${textOf(exo)}`) ?? ok(blankOf(exo).answer === row![2], `la phrase veut « ${row![2]} », le trou dit « ${blankOf(exo).answer} »`) ?? ok(same(blankOf(exo).options, [row![2], ...row![3]]), `les choix : ${blankOf(exo).options.join(" | ")}`);
  },
  // ----- Bien manger
  "repas-qcm": (exo) => {
    const others = optionsOf(exo).filter((option) => option !== rightOption(exo)).map(bare);
    if (exo.prompt === "Quel aliment fait du bien au corps ?") {
      return ok(GOOD_T.includes(bare(rightOption(exo))), `« ${rightOption(exo)} » ne fait pas du bien au corps`) ?? ok(others.length === 2 && others.every((option) => BAD_T.includes(option)), `un mauvais choix fait du bien : ${others.join(" | ")}`);
    }
    if (exo.prompt === "Quel aliment faut-il éviter ?") {
      return ok(BAD_T.includes(bare(rightOption(exo))), `« ${rightOption(exo)} » n'est pas à éviter`) ?? ok(others.length === 2 && others.every((option) => GOOD_T.includes(option)), `un mauvais choix est à éviter : ${others.join(" | ")}`);
    }
    return `énoncé ${exo.prompt}`;
  },
  "repas-glisser": (exo) => {
    if (JSON.stringify(zonesOf(exo)) !== JSON.stringify(["Bon pour le corps", "À éviter"])) return `cases ${zonesOf(exo).join(" / ")}`;
    for (const item of itemsOf(exo)) {
      const zone = GOOD_T.includes(bare(item.text)) ? "Bon pour le corps" : BAD_T.includes(bare(item.text)) ? "À éviter" : null;
      if (zone !== item.correctZone) return `« ${item.text} » va dans « ${zone} », l'exercice dit « ${item.correctZone} »`;
    }
    const counts = countsByZone(exo);
    return ok(counts[0] >= 2 && counts[0] === counts[1], "les deux cases n'ont pas le même nombre d'aliments");
  },
  "repas-fruit-legume": (exo) => {
    if (JSON.stringify(zonesOf(exo)) !== JSON.stringify(["Fruits", "Légumes"])) return `cases ${zonesOf(exo).join(" / ")}`;
    for (const item of itemsOf(exo)) {
      const zone = FRUITS_T.includes(bare(item.text)) ? "Fruits" : VEGETABLES_T.includes(bare(item.text)) ? "Légumes" : null;
      if (zone !== item.correctZone) return `« ${item.text} » va dans « ${zone} », l'exercice dit « ${item.correctZone} »`;
    }
    const counts = countsByZone(exo);
    return ok(counts[0] >= 2 && counts[0] === counts[1], "les deux cases n'ont pas le même nombre d'aliments");
  },
  // ----- Les maladies du milieu
  "maladie-glisser": (exo) => {
    if (JSON.stringify(zonesOf(exo)) !== JSON.stringify(["Contre le paludisme", "Contre la diarrhée"])) return `cases ${zonesOf(exo).join(" / ")}`;
    for (const item of itemsOf(exo)) {
      const zone = MALARIA.includes(item.text) ? "Contre le paludisme" : DIARRHEA.includes(item.text) ? "Contre la diarrhée" : null;
      if (zone !== item.correctZone) return `« ${item.text} » va dans « ${zone} », l'exercice dit « ${item.correctZone} »`;
    }
    const counts = countsByZone(exo);
    return ok(counts[0] >= 2 && counts[0] === counts[1], "les deux cases n'ont pas le même nombre de gestes");
  },
  "maladie-cause": (exo) => {
    const row = ILLNESS.find((entry) => entry[0] === exo.prompt && entry[1] === low(rightOption(exo)));
    const others = optionsOf(exo).filter((option) => option !== rightOption(exo)).map(low);
    return ok(row !== undefined, `question ou réponse inconnue : ${exo.prompt} / ${rightOption(exo)}`) ?? ok(same(others, row![2]), `mauvais choix ${others.join(" | ")}`);
  },
  // ----- Protéger la nature
  "nature-reparer": (exo) => {
    const pairs = pairsOf(exo);
    for (const pair of pairs) {
      const row = REPAIR.find((entry) => entry[1] === pair.left);
      if (!row || row[2] !== pair.right) return `« ${pair.left} » est relié à « ${pair.right} »`;
    }
    const groups = pairs.map((pair) => REPAIR.find((entry) => entry[1] === pair.left)![0]);
    return ok(pairs.length >= 3 && pairs.length <= 4, "nombre de paires") ?? ok(new Set(groups).size === pairs.length, `deux problèmes du même groupe : ${groups.join(" | ")}`);
  },
  // ----- Jouer un rôle
  "metier-qui": (exo) => {
    const task = /^Qui (.+) \?$/u.exec(exo.prompt)?.[1] ?? "";
    const job = jobOfTask(task);
    const others = optionsOf(exo).filter((option) => option !== rightOption(exo));
    return ok(job !== undefined, `travail inconnu : ${task}`) ?? ok(rightOption(exo) === tileOf(job![0]), `${task} : « ${job![0]} », la bonne option est « ${rightOption(exo)} »`) ?? ok(others.length === 2 && others.every((option) => JOB_NAMES.includes(option) && option !== tileOf(job![0])), `mauvais choix ${others.join(" | ")}`);
  },
  "metier-outil": (exo) => {
    // La question dit à quoi l'objet sert : « Quel objet sert au boulanger à cuire la pâte ? » (la balance pèse aussi la farine).
    const job = JOBS.find((entry) => exo.prompt === `Quel objet sert ${entry[1]} ${entry[6]} ?`);
    const to = exo.prompt;
    const tools = JOBS.map((entry) => tileOf(entry[5]));
    const others = optionsOf(exo).filter((option) => option !== rightOption(exo));
    return ok(job !== undefined, `métier inconnu : ${to}`) ?? ok(rightOption(exo) === tileOf(job![5]), `l'objet ${to} est « ${job![5]} », la bonne option est « ${rightOption(exo)} »`) ?? ok(others.length === 2 && others.every((option) => tools.includes(option) && option !== tileOf(job![5])), `mauvais choix ${others.join(" | ")}`);
  },
  "metier-relier": (exo) => {
    const pairs = pairsOf(exo);
    const withTasks = exo.prompt === "Relie chaque métier à son travail.";
    const withTools = exo.prompt === "Relie chaque métier à son objet.";
    if (withTasks === withTools) return `énoncé ${exo.prompt}`;
    for (const pair of pairs) {
      const job = JOBS.find((entry) => entry[2] === pair.left);
      if (!job) return `métier inconnu : ${pair.left}`;
      const rights = withTasks ? [job[3], job[4]] : [tileOf(job[5])];
      if (!rights.includes(pair.right)) return `« ${pair.left} » est relié à « ${pair.right} », la table dit ${rights.join(" ou ")}`;
    }
    return ok(pairs.length >= 3 && pairs.length <= 4 && new Set(pairs.map((pair) => pair.left)).size === pairs.length, "nombre de paires");
  },
  "metier-glisser": (exo) => {
    const zones = zonesOf(exo);
    const jobs = zones.map((zone) => JOBS.find((entry) => tileOf(entry[0]) === zone));
    if (zones.length !== 2 || jobs.some((job) => job === undefined) || jobs[0] === jobs[1]) return `cases ${zones.join(" / ")}`;
    for (const item of itemsOf(exo)) {
      const job = jobOfTask(low(item.text));
      if (!job || tileOf(job[0]) !== item.correctZone) return `« ${item.text} » est le travail de « ${job?.[0]} », l'exercice dit « ${item.correctZone} »`;
    }
    return ok(countsByZone(exo).every((count) => count === 2), "chaque case doit recevoir les deux gestes de son métier");
  },
  "metier-trou": (exo) => {
    const row = JOB_GAP.find((entry) => entry[0] === textOf(exo));
    return ok(row !== undefined, `phrase inconnue : ${textOf(exo)}`) ?? ok(blankOf(exo).answer === row![1], `la phrase veut « ${row![1]} », le trou dit « ${blankOf(exo).answer} »`) ?? ok(same(blankOf(exo).options, [row![1], ...row![2]]), `les choix : ${blankOf(exo).options.join(" | ")}`);
  },
  "metier-ordre": (exo) => {
    const row = JOB_ORDER.find((entry) => entry[0] === exo.prompt);
    return ok(row !== undefined, `suite inconnue : ${exo.prompt}`) ?? ok(JSON.stringify(sequenceOf(exo)) === JSON.stringify(row![1]), `les étapes disent ${sequenceOf(exo).join(" > ")}`);
  },
  "metier-ecrire": (exo) => {
    const row = JOB_WORD.find((entry) => entry[0] === exo.prompt);
    return ok(row !== undefined, `énoncé inconnu : ${exo.prompt}`) ?? ok(JSON.stringify(acceptedOf(exo)) === JSON.stringify(row![2]), `réponses admises ${acceptedOf(exo).join(" | ")}`) ?? ok(exo.answerKey === row![1], `clé ${exo.answerKey}`) ?? ok(!acceptedOf(exo).some((word) => fold(exo.prompt).includes(fold(word.replace(/^(le |la |l'|un |une )/u, "")))), "un nom de métier est écrit dans l'énoncé");
  },
  "imiter-qcm": (exo) => {
    const others = optionsOf(exo).filter((option) => option !== rightOption(exo));
    const byCry = /^Quel animal fait « (.+) » \?$/u.exec(exo.prompt);
    if (byCry) {
      const animal = ANIMAL_OF_CRY[byCry[1]];
      return ok(animal !== undefined, `cri inconnu : ${byCry[1]}`) ?? ok(rightOption(exo) === tileOf(animal), `« ${byCry[1]} » est le cri de « ${animal} », la bonne option est « ${rightOption(exo)} »`) ?? ok(others.length === 2 && others.every((option) => ANIMAL_TILES.includes(option) && option !== tileOf(animal)), `mauvais choix ${others.join(" | ")}`);
    }
    const byAnimal = /^Que dit (.+) \?$/u.exec(exo.prompt);
    if (!byAnimal) return `énoncé inconnu : ${exo.prompt}`;
    const cry = CRY_OF[byAnimal[1]];
    return ok(cry !== undefined, `animal inconnu : ${byAnimal[1]}`) ?? ok(rightOption(exo) === cry, `${byAnimal[1]} dit « ${cry} », la bonne option est « ${rightOption(exo)} »`) ?? ok(others.length === 2 && others.every((option) => option in ANIMAL_OF_CRY && option !== cry), `mauvais choix ${others.join(" | ")}`);
  },
  "imiter-relier": (exo) => {
    const pairs = pairsOf(exo);
    for (const pair of pairs) if (CRY_OF_TILE[bare(pair.left)] !== pair.right) return `« ${pair.left} » est relié à « ${pair.right} », la table dit « ${CRY_OF_TILE[bare(pair.left)]} »`;
    return ok(pairs.length >= 3 && pairs.length <= 4, "nombre de paires");
  },
};

describe("chaque gabarit des sciences du CP et de « jouer un rôle » a sa vérification", () => {
  it("couvre exactement les trente-quatre gabarits", () => {
    expect(KINDS).toHaveLength(34);
    expect(Object.keys(CHECKS).sort()).toEqual([...KINDS].sort());
    for (const kind of KINDS) expect(Object.keys(GAME_KINDS), kind).toContain(kind);
  });
});

describe("les gabarits des sciences du CP et de « jouer un rôle » recalculent juste, depuis une table écrite à part", () => {
  for (const kind of KINDS) {
    it(`${kind} : la bonne réponse se lit dans la table, à tous les niveaux`, () => {
      for (const topic of variants(kind)) {
        for (const d of draws.filter((_, i) => i % 2 === 0)) {
          const exo = make(kind, topic, d) as unknown as Exo;
          expect(CHECKS[kind](exo), `${kind} ${topic ?? ""} niveau ${d.level} : ${exo.prompt}`).toBeNull();
        }
      }
    });
  }

  it("sans thématique (vocabulary absent), les scènes d'habitudes de toutes les thématiques servent, justes", () => {
    for (const kind of HABIT_KINDS) {
      for (const d of draws.filter((_, i) => i % 10 === 0)) {
        const exo = make(kind as GameKind, undefined, d) as unknown as Exo;
        expect(CHECKS[kind](exo), `${kind} niveau ${d.level} : ${exo.prompt}`).toBeNull();
      }
    }
  });

  it("chaque scène, chaque suite et chaque trou d'habitudes appartient à la thématique demandée", () => {
    for (const topic of HABIT_TOPICS) {
      for (const d of draws.filter((_, i) => i % 3 === 0)) {
        const situation = make("habitude-situation", topic, d) as unknown as Exo;
        expect(TOPIC_OF_TEXT.get(situation.prompt.replace(/ Que faut-il faire \?$/u, "")), situation.prompt).toBe(topic);
        const order = make("habitude-ordre", topic, d) as unknown as Exo;
        expect(ROUTINE.find((entry) => entry[1] === order.prompt)?.[0], order.prompt).toBe(topic);
        const gap = make("habitude-trou", topic, d) as unknown as Exo;
        expect(HABIT_GAP.find((entry) => entry[1] === textOf(gap))?.[0], textOf(gap)).toBe(topic);
        for (const kind of ["habitude-glisser", "habitude-relier", "habitude-intrus"] as const) {
          const exo = make(kind, topic, d) as unknown as Exo;
          const acts = exo.payload.items ? itemsOf(exo).map((item) => item.text) : exo.payload.pairs ? pairsOf(exo).map((pair) => pair.right) : optionsOf(exo);
          for (const act of acts) expect(TOPIC_OF_TEXT.get(SCENE_OF_ACT.get(act) ?? ""), `${kind} : ${act}`).toBe(topic);
        }
      }
    }
  });
});

describe("les tables elles-mêmes sont saines", () => {
  it("n'ont que des gestes tous différents, et aucun mauvais geste n'est un bon geste", () => {
    const acts = TABLE.flatMap((row) => [row[4], row[5], row[6], row[7]]);
    expect(new Set(acts).size).toBe(acts.length);
    for (const wrong of ALL_WRONG) expect(ALL_RIGHT.has(wrong), wrong).toBe(false);
    expect(new Set(TABLE.map((row) => row[2])).size, "situations toutes différentes").toBe(TABLE.length);
    expect(new Set(TABLE.map((row) => row[3])).size, "étiquettes toutes différentes").toBe(TABLE.length);
  });

  it("garde chaque thème assez riche : huit scènes, trois suites et six trous au moins", () => {
    for (const topic of HABIT_TOPICS) {
      expect(TABLE.filter((row) => row[0] === topic).length, topic).toBeGreaterThanOrEqual(8);
      expect(ROUTINE.filter((row) => row[0] === topic).length, topic).toBeGreaterThanOrEqual(3);
      expect(HABIT_GAP.filter((row) => row[0] === topic).length, topic).toBeGreaterThanOrEqual(6);
    }
  });

  it("ne range aucun être vivant parmi ce qui ne grandit pas, et aucun objet parmi ce qui grandit", () => {
    for (const thing of GROWS) expect(STAYS.has(thing), thing).toBe(false);
    for (const thing of Object.values(YOUNG_OF)) expect(STAYS.has(thing), thing).toBe(false);
  });

  it("ne donne à chaque métier ni objet ni geste d'un autre", () => {
    const tools = JOBS.map((job) => job[5]);
    const tasks = JOBS.flatMap((job) => [job[3], job[4]]);
    expect(new Set(tools).size).toBe(tools.length);
    expect(new Set(tasks).size).toBe(tasks.length);
    expect(new Set(JOBS.map((job) => job[2])).size).toBe(JOBS.length);
  });

  it("laisse dans la matière des choses dont l'état ne se discute pas : ni fumée, ni nuage, ni pâte, ni miel", () => {
    for (const thing of Object.keys(STATE_OF)) expect(thing, thing).not.toMatch(/fumée|nuage|pâte|miel/u);
    expect(new Set(Object.values(STATE_OF))).toEqual(new Set(STATES));
  });

  it("ne classe ni tomate, ni gombo, ni aubergine, ni concombre, ni poivron parmi les fruits ou les légumes", () => {
    for (const food of [...FRUITS, ...VEGETABLES]) expect(food, food).not.toMatch(/tomate|gombo|aubergine|concombre|poivron/u);
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
      payload.acceptedAnswers = ["xxxx"];
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
      for (const topic of variants(kind)) {
        for (const d of draws.filter((_, i) => i % 6 === 0)) {
          const exo = make(kind, topic, d) as unknown as Exo;
          const broken = mutate(kind, exo);
          if (!broken) continue;
          mutated += 1;
          expect(CHECKS[kind](broken), `${kind} ${topic ?? ""} niveau ${d.level} : ${exo.prompt}`).not.toBeNull();
        }
      }
      expect(mutated, kind).toBeGreaterThan(0);
    });
  }
});

// ===========================================================================
// LES RÈGLES COMMUNES
// ===========================================================================

describe("tous les gabarits des sciences du CP et de « jouer un rôle »", () => {
  const exos = KINDS.flatMap((kind) => variants(kind).flatMap((topic) => draws.filter((_, i) => i % 3 === 0).map((d) => ({ kind, topic, exo: make(kind, topic, d) as unknown as Exo }))));

  const texts = (exo: Exo): string[] => {
    const out = [exo.prompt, ...exo.hints];
    if (exo.payload.options) out.push(...optionsOf(exo));
    if (exo.payload.blanks) out.push(textOf(exo), ...blankOf(exo).options);
    if (exo.payload.correctSequence) out.push(...sequenceOf(exo));
    if (exo.payload.pairs) out.push(...pairsOf(exo).flatMap((pair) => [pair.left, pair.right]));
    if (exo.payload.items) out.push(...itemsOf(exo).map((item) => item.text), ...zonesOf(exo));
    if (exo.payload.acceptedAnswers) out.push(...acceptedOf(exo));
    return out;
  };

  it("ont un énoncé que l'écran sait couper : pas de deux-points, une apostrophe au plus, vingt-huit mots au plus", () => {
    for (const { kind, exo } of exos) {
      expect(exo.prompt, kind).not.toMatch(/:/);
      expect(apostrophes(exo.prompt), `${kind} : ${exo.prompt}`).toBeLessThanOrEqual(1);
      expect(wordCount(exo.prompt), `${kind} : ${exo.prompt}`).toBeLessThanOrEqual(28);
    }
  });

  it("n'écrivent aucun émoji ni U+FE0F : les appareils anciens montrent les récents en carré", () => {
    for (const { kind, exo } of exos) {
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
        expect(options.length, `${kind} : ${exo.prompt}`).toBe(3);
      }
      if (exo.payload.blanks) {
        const { options, answer } = blankOf(exo);
        expect(new Set(options).size, `${kind} : ${textOf(exo)}`).toBe(options.length);
        expect(options.filter((option) => option === answer), `${kind} : ${textOf(exo)}`).toHaveLength(1);
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
      }
      if (exo.payload.correctSequence) {
        const sequence = sequenceOf(exo);
        expect(new Set(sequence).size, `${kind} : ${sequence.join(" ")}`).toBe(sequence.length);
        expect(sequence.length, kind).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it("n'écrivent dans aucun indice un mot de quatre lettres ou plus de la bonne réponse ni d'une étiquette à placer", () => {
    for (const { kind, exo } of exos) {
      const answers: string[] = [];
      if (exo.payload.options) answers.push(rightOption(exo));
      if (exo.payload.blanks) answers.push(blankOf(exo).answer);
      if (exo.payload.correctSequence) answers.push(...sequenceOf(exo));
      if (exo.payload.pairs) answers.push(...pairsOf(exo).flatMap((pair) => [pair.left, pair.right]));
      if (exo.payload.items) answers.push(...itemsOf(exo).map((item) => item.text));
      if (exo.payload.acceptedAnswers) answers.push(...acceptedOf(exo));
      const words = new Set(
        answers.flatMap((answer) =>
          fold(answer)
            .split(/[^a-z]+/)
            .filter((word) => word.length >= 4),
        ),
      );
      for (const hint of exo.hints) {
        const hintWords = fold(hint).split(/[^a-z]+/);
        for (const word of words) expect(hintWords, `${kind} : « ${hint} » écrit « ${word} »`).not.toContain(word);
      }
    }
  });

  it("donnent trois indices différents, et se refont à l'identique avec la même graine", () => {
    for (const kind of KINDS) {
      for (const topic of variants(kind)) {
        const a = GAME_KINDS[kind].make(makeContext("CP", 2, "graine", undefined, topic));
        const b = GAME_KINDS[kind].make(makeContext("CP", 2, "graine", undefined, topic));
        expect(a).toEqual(b);
        expect(a.hints).toHaveLength(3);
        expect(new Set(a.hints).size, kind).toBe(3);
      }
    }
  });

  it("passent le contrôleur au CP sans aucun défaut, à tous les niveaux", () => {
    for (const { kind, exo } of exos) {
      const defects = auditExercise({
        type: GAME_KINDS[kind].type,
        prompt: exo.prompt,
        payload: exo.payload,
        answerKey: exo.answerKey,
        hints: exo.hints,
        class: "CP",
        subject: subjectOf(kind),
      });
      expect(defects, `${kind} : ${exo.prompt}`).toEqual([]);
    }
  });
});

// ===========================================================================
// LES THÉMATIQUES DU PROGRAMME
// ===========================================================================

describe("les cinq thématiques de sciences du CP et « Jouer un rôle »", () => {
  /** Chaque thématique, et la matière que le contrôleur lui donne. */
  const KEYS = ["sc-cp-matiere", "sc-cp-grandir", "sc-cp-manger", "sc-cp-maladies", "sc-cp-nature", "ar-cp-roles"];
  const HABIT_TOPIC_OF: Record<string, string> = { "sc-cp-manger": "manger", "sc-cp-maladies": "maladies", "sc-cp-nature": "nature" };
  const EARLIER_KEYS = [
    // Lot 1
    "hi-cp-calendrier",
    "hi-cp-durees",
    "hi-cp-frequences",
    "hi-cp-emploi-du-temps",
    "ge-cp-itineraire",
    "ge-cp-distances",
    "ge-cp-plan",
    "ge-cp-quartier",
    // Lot 2
    "an-cp-family",
    "an-cp-body",
    "an-cp-classroom",
    "an-cp-numbers-20",
    "an-cp-food",
    "fr-cp-lecture",
    "fr-cp-ecrire",
    // Lot 3
    "fr-cp-consignes",
    "fr-cp-decrire",
    "fr-cp-raconter",
    "fr-cp-inviter",
    "ar-cp-melanges",
    "ar-cp-traits",
    "ar-cp-decorer",
    "ar-cp-rythmes",
    // Lot 4
    "ci-cp-route",
    "ci-cp-reglement",
    "ci-cp-responsabilites",
    "ci-cp-genre",
    "ci-cp-paix",
  ];
  const entryOf = (key: string) => allProgrammeEntries().find((e) => e.topic.key === key)!;
  const topicOf = (key: string) => entryOf(key).topic;
  const subjectOfKey = (key: string) => (key === "ar-cp-roles" ? "Éducation artistique" : "Éveil scientifique");

  it("remplissent les dix places du palier, avec des jeux connus, sans appeler le modèle", () => {
    for (const key of KEYS) {
      const specs = topicOf(key).games ?? [];
      expect(
        specs.reduce((sum, spec) => sum + spec.count, 0),
        key,
      ).toBe(PALIER_SIZE);
      for (const spec of specs) {
        expect(Object.keys(GAME_KINDS), `${key} : ${spec.kind}`).toContain(spec.kind);
        // Chaque jeu d'habitudes porte sa thématique : c'est elle qui choisit les scènes.
        if (HABIT_KINDS.includes(spec.kind)) expect(spec.vocabulary, `${key} : ${spec.kind}`).toBe(HABIT_TOPIC_OF[key]);
        else expect(spec.vocabulary, `${key} : ${spec.kind}`).toBeUndefined();
      }
      expect(topicUsesModel(key), key).toBe(false);
    }
  });

  it("n'emploient chaque gabarit que dans les thématiques qui le concernent", () => {
    const kindsOf = (key: string) => (topicOf(key).games ?? []).map((spec) => spec.kind as string);
    for (const kind of kindsOf("sc-cp-matiere")) expect(kind, kind).toMatch(/^etat-/);
    for (const kind of kindsOf("sc-cp-grandir")) expect(kind, kind).toMatch(/^vie-/);
    for (const kind of kindsOf("ar-cp-roles")) expect(kind, kind).toMatch(/^(metier|imiter)-/);
    for (const kind of kindsOf("sc-cp-manger")) expect(kind, kind).toMatch(/^(habitude|repas)-/);
    for (const kind of kindsOf("sc-cp-maladies")) expect(kind, kind).toMatch(/^(habitude-|maladie-)/);
    for (const kind of kindsOf("sc-cp-nature")) expect(kind, kind).toMatch(/^(habitude-|nature-)/);
  });

  it("sont, avec les vingt-huit des quatre premiers lots, parmi les thématiques du CP entièrement faites par le code", () => {
    const allCode = allProgrammeEntries()
      .filter((e) => e.klass === "CP" && (e.topic.games ?? []).reduce((sum, spec) => sum + spec.count, 0) >= PALIER_SIZE)
      .map((e) => e.topic.key);
    for (const key of [...EARLIER_KEYS, ...KEYS]) expect(allCode, key).toContain(key);
    expect(allCode.length).toBeGreaterThanOrEqual(EARLIER_KEYS.length + KEYS.length);
  });

  it("sont celles du CP, et n'ont changé ni leur clé ni leur nombre de paliers", () => {
    for (const key of KEYS) {
      expect(entryOf(key).klass, key).toBe("CP");
      expect(topicOf(key).palierCount, key).toBeUndefined();
    }
  });

  it("fabriquent des paliers entiers, de dix exercices tous différents, qui passent le contrôleur et la table", () => {
    for (const key of KEYS) {
      for (let n = 0; n < 40; n++) {
        for (const palierIndex of [1, 2, 3]) {
          const games = generateGames(topicOf(key).games ?? [], { klass: "CP", palierIndex, palierCount: 3, seed: `${key}:${n}:${palierIndex}` });
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
              class: "CP",
              subject: subjectOfKey(key),
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
    for (const key of KEYS) {
      for (const palierIndex of [1, 2, 3]) {
        const games = generateGames(topicOf(key).games ?? [], { klass: "CP", palierIndex, palierCount: 3, seed: key });
        expect(new Set(games.map((game) => game.type)).size, `${key} palier ${palierIndex}`).toBeGreaterThanOrEqual(4);
      }
    }
  });

  it("gardent de quoi servir la démo du site : un exercice de chaque type que la banque attend sur ces thématiques", () => {
    const typesOf = (key: string) => new Set((topicOf(key).games ?? []).map((spec) => GAME_KINDS[spec.kind].type));
    for (const key of KEYS) {
      for (const type of ["qcm", "drag-drop", "match", "order", "fill-blank"]) expect(typesOf(key).has(type as never), `${key} : ${type}`).toBe(true);
    }
    // La banque pose une réponse courte sur « Solide, liquide ou gaz ? » et sur « Jouer un rôle ».
    for (const key of ["sc-cp-matiere", "ar-cp-roles"]) expect(typesOf(key).has("short-answer" as never), key).toBe(true);
  });

  it("refont chaque exercice raté par le code, sans le modèle, avec la même thématique", () => {
    for (const key of KEYS) {
      for (const spec of topicOf(key).games ?? []) {
        const origin = { kind: spec.kind, level: 2, vocabulary: spec.vocabulary };
        const again = regenerateGame(origin, "CP", `reprise:${key}:${spec.kind}`);
        expect(again, spec.kind).not.toBeNull();
        expect(again!.type, spec.kind).toBe(GAME_KINDS[spec.kind].type);
      }
    }
  });
});
