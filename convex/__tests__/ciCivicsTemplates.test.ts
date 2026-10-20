import { describe, expect, it } from "vitest";
import { isSceneClipId } from "../../lib/scene-clips";
import { auditExercise } from "../paliers/exerciseAudit";
import { sanitizePayload } from "../paliers/exerciseRules";
import { GAME_KINDS, gameOriginOf, generateGames, regenerateGame, type GameKind } from "../paliers/games";
import { GAPS, SCENES, SEQUENCES, TOPICS } from "../paliers/games/civique";
import { makeContext, type GameLevel } from "../paliers/games/shared";
import { topicUsesModel } from "../paliers/pregen";
import { PALIER_SIZE } from "../paliers/scoring";
import { allProgrammeEntries } from "../programme";

/**
 * LES GABARITS DE L'INSTRUCTION CIVIQUE DU CI : le respect des autres, l'école, l'entraide, la route.
 *
 * Chaque gabarit a son VÉRIFICATEUR, écrit ici avec ses propres tables (une situation, son bon geste, les gestes à
 * éviter, les suites, les phrases à trou) : il recalcule la bonne réponse depuis l'énoncé et les tuiles, et il liste ce
 * qui cloche. Un test abîme ensuite chaque gabarit (le bon choix déplacé, un geste dans la mauvaise case, deux pas
 * échangés) et exige que son vérificateur le voie : un contrôle qui ne verrait rien ne prouverait rien. Les tables
 * ci-dessous sont une copie figée du module, relue à la main : changer une scène de `games/civique.ts` oblige à changer
 * ce fichier, donc à la relire. Le modèle avait écrit cent cinq exercices pour ces quatre thématiques, plus d'un sur
 * trois à refaire (un ordre qui regarde le feu après la route, « Marcher vite » sous « Quand je traverse », « Sur la
 * route, je marche »).
 */

type Topic = (typeof TOPICS)[number];
type Row = { id: string; topic: Topic; group: string; text: string; short: string; right: string; wrong: string[] };
type SequenceRow = { id: string; topic: Topic; prompt: string; steps: string[] };
type GapRow = { id: string; topic: Topic; text: string; answer: string; wrong: string[] };

/** Les scènes : la thématique, le groupe, la situation, l'étiquette, le bon geste et trois gestes à éviter, sans émoji. */
const ROWS: Row[] = [
  { id: "po1", topic: "politesse", group: "parole", text: "Ta grand-mère te parle.", short: "Grand-mère me parle",
    right: "J'écoute ma grand-mère calmement",
    wrong: ["Je tire la langue à ma grand-mère", "Je n'écoute pas ma grand-mère", "Je ne réponds pas à ma grand-mère"] },
  { id: "po2", topic: "politesse", group: "salut", text: "Tu vois un vieux monsieur dans la rue.", short: "Je vois un vieux monsieur",
    right: "Je dis bonjour au vieux monsieur",
    wrong: ["Je me moque du vieux monsieur", "Je tourne le dos au vieux monsieur", "Je crie sur le vieux monsieur"] },
  { id: "po3", topic: "politesse", group: "aide", text: "Une vieille dame porte un gros panier.", short: "Une dame porte un panier",
    right: "J'aide la vieille dame",
    wrong: ["Je refuse d'aider la vieille dame", "Je ris de la vieille dame", "Je bouscule la vieille dame"] },
  { id: "po4", topic: "politesse", group: "parole", text: "Papa parle avec un voisin. Tu as quelque chose à dire.", short: "Papa parle avec un voisin",
    right: "J'attends mon tour pour parler",
    wrong: ["Je parle plus fort que papa", "Je tire papa par le bras en criant", "Je coupe la parole à papa"] },
  { id: "po5", topic: "politesse", group: "parole", text: "Le directeur te dit bonjour.", short: "Le directeur me dit bonjour",
    right: "Je réponds poliment au directeur",
    wrong: ["Je ne réponds pas quand le directeur me salue", "Je fais la tête au directeur", "Je me moque du directeur"] },
  { id: "po6", topic: "politesse", group: "propre", text: "Tu vas manger.", short: "Je vais manger",
    right: "Je me lave les mains avec du savon",
    wrong: ["Je mange avec les mains sales", "Je mets les doigts sales à la bouche", "Je mange du pain tombé par terre"] },
  { id: "po7", topic: "politesse", group: "propre", text: "Tu te lèves le matin.", short: "Je me lève le matin",
    right: "Je me lave bien les dents",
    wrong: ["Je me recouche sans me laver", "Je ne me lave pas le visage", "Je garde mes habits sales"] },
  { id: "po8", topic: "politesse", group: "propre", text: "Tu as un papier sale dans la main.", short: "J'ai un papier sale",
    right: "Je jette le papier à la poubelle",
    wrong: ["Je jette le papier par terre", "Je lance le papier dans la rue", "Je cache le papier sous la table"] },
  { id: "po9", topic: "politesse", group: "affaires", text: "Tu rentres à la maison avec ton cartable.", short: "Je rentre avec mon cartable",
    right: "Je range mon cartable à sa place",
    wrong: ["Je jette mon cartable par terre", "Je laisse mon cartable sous la pluie", "Je laisse mon cartable dehors la nuit"] },
  { id: "po10", topic: "politesse", group: "affaires", text: "Ton cahier est tout neuf.", short: "Mon cahier est tout neuf",
    right: "Je garde mon cahier bien propre",
    wrong: ["Je déchire les pages de mon cahier", "Je gribouille sur tout mon cahier", "Je mouille mon cahier exprès"] },
  { id: "po11", topic: "politesse", group: "affaires", text: "Tu as fini de jouer avec tes jouets.", short: "J'ai fini de jouer",
    right: "Je range mes jouets dans la boîte",
    wrong: ["Je casse mes jouets exprès", "Je lance mes jouets contre le mur", "Je laisse mes jouets sous la pluie"] },
  { id: "ec1", topic: "ecole", group: "heure", text: "C'est lundi matin et tu es en bonne santé.", short: "C'est lundi matin",
    right: "Je me lève et je vais à l'école",
    wrong: ["Je reste au lit sans raison", "Je ne vais pas à l'école pour jouer", "Je regarde la télé au lieu d'aller en classe"] },
  { id: "ec2", topic: "ecole", group: "heure", text: "Tu pars pour l'école. La cloche sonne bientôt.", short: "Je pars pour l'école",
    right: "Je me dépêche d'arriver à l'heure",
    wrong: ["Je traîne et j'arrive en retard", "Je joue en chemin au lieu d'aller à l'école", "Je me rendors au lieu de partir"] },
  { id: "ec3", topic: "ecole", group: "heure", text: "Tu arrives en retard. Les élèves sont déjà en classe.", short: "J'arrive en retard",
    right: "Je m'excuse et j'entre doucement",
    wrong: ["J'entre en criant", "Je claque la porte", "Je ris de mon retard"] },
  { id: "ec4", topic: "ecole", group: "heure", text: "La cloche sonne. Il faut entrer en classe.", short: "La cloche sonne",
    right: "Je me mets calmement en rang",
    wrong: ["Je cours dans tous les sens", "Je crie dans le rang", "Je pousse les autres pour passer"] },
  { id: "ec5", topic: "ecole", group: "classe", text: "La maîtresse pose une question. Tu veux répondre.", short: "Je veux répondre",
    right: "Je lève la main et j'attends",
    wrong: ["Je crie ma réponse", "Je me lève et je cours vers la maîtresse", "Je parle sans attendre mon tour"] },
  { id: "ec6", topic: "ecole", group: "classe", text: "La maîtresse explique la leçon.", short: "La maîtresse explique la leçon",
    right: "J'écoute la maîtresse",
    wrong: ["Je bavarde pendant la leçon", "Je dors sur ma table", "Je joue pendant la leçon"] },
  { id: "ec7", topic: "ecole", group: "livre", text: "Un livre de la classe est tombé par terre.", short: "Un livre est par terre",
    right: "Je ramasse et je range le livre",
    wrong: ["Je marche sur le livre", "Je jette le livre à la poubelle", "Je déchire le livre"] },
  { id: "ec8", topic: "ecole", group: "ballon", text: "Tu as fini de jouer avec le ballon de la classe.", short: "J'ai fini avec le ballon",
    right: "Je rends le ballon à la maîtresse",
    wrong: ["Je garde le ballon de la classe chez moi", "Je cache le ballon dans la cour", "Je tape le ballon contre la fenêtre"] },
  { id: "ec9", topic: "ecole", group: "papier", text: "Tu as fini ton bonbon dans la cour.", short: "J'ai fini mon bonbon",
    right: "Je mets le papier à la poubelle",
    wrong: ["Je jette le papier dans la cour", "Je laisse le vent emporter le papier", "Je cache le papier sous l'arbre"] },
  { id: "ec10", topic: "ecole", group: "classe", text: "Tu es en classe et tu as envie de jouer.", short: "J'ai envie de jouer en classe",
    right: "Je reste assis à ma place",
    wrong: ["Je cours entre les tables", "Je fais des galipettes en classe", "Je lance des boulettes de papier"] },
  { id: "en1", topic: "entraide", group: "chagrin", text: "Un camarade tombe dans la cour.", short: "Un camarade est tombé",
    right: "J'aide mon camarade à se relever",
    wrong: ["Je ris de mon camarade", "Je laisse mon camarade par terre", "Je fais semblant de ne rien voir"] },
  { id: "en2", topic: "entraide", group: "partage", text: "Tu as un pain. Ton ami n'a rien à manger.", short: "Mon ami a faim",
    right: "Je partage mon pain avec mon ami",
    wrong: ["Je mange mon pain devant mon ami qui a faim", "Je cache mon pain pour ne rien donner", "Je me moque de mon ami qui a faim"] },
  { id: "en3", topic: "entraide", group: "pret", text: "Ton ami a oublié son crayon.", short: "Mon ami n'a pas de crayon",
    right: "Je prête mon crayon à mon ami",
    wrong: ["Je refuse de prêter mon crayon à mon ami", "Je rigole de mon ami", "Je cache mon crayon pour ne pas le prêter"] },
  { id: "en4", topic: "entraide", group: "accueil", text: "Une fille veut jouer au ballon avec toi.", short: "Une fille veut jouer",
    right: "J'invite la fille à jouer avec nous",
    wrong: ["Je refuse parce que c'est une fille", "Je me moque de la fille", "Je dis à la fille de s'en aller"] },
  { id: "en5", topic: "entraide", group: "accueil", text: "Un garçon veut jouer à la corde avec toi.", short: "Un garçon veut jouer",
    right: "J'invite le garçon à sauter à la corde",
    wrong: ["Je refuse parce que c'est un garçon", "Je rigole du garçon", "Je dis au garçon de s'en aller"] },
  { id: "en6", topic: "entraide", group: "travail", text: "La maîtresse demande de travailler à deux.", short: "On travaille à deux",
    right: "Je travaille bien avec mon voisin",
    wrong: ["Je refuse de travailler avec mon voisin", "Je regarde ailleurs sans rien faire", "Je me dispute avec mon voisin"] },
  { id: "en7", topic: "entraide", group: "expliquer", text: "Ton camarade ne comprend pas l'exercice.", short: "Il ne comprend pas",
    right: "J'explique doucement à mon camarade",
    wrong: ["Je me moque de mon camarade", "Je dis à mon camarade qu'il est bête", "Je refuse de l'aider"] },
  { id: "en8", topic: "entraide", group: "chagrin", text: "Un camarade pleure parce qu'il est triste.", short: "Un camarade pleure",
    right: "Je console doucement mon camarade",
    wrong: ["Je traite mon camarade de bébé", "Je laisse mon camarade pleurer seul", "J'embête encore plus mon camarade"] },
  { id: "en9", topic: "entraide", group: "partage", text: "Il y a un seul ballon pour toute l'équipe.", short: "Un seul ballon pour tous",
    right: "Je passe le ballon aux autres",
    wrong: ["Je garde le ballon pour moi seul", "Je pars avec le ballon", "Je ne laisse personne jouer"] },
  { id: "en10", topic: "entraide", group: "accueil", text: "Un nouvel élève arrive dans ta classe.", short: "Un nouvel élève arrive",
    right: "J'accueille le nouvel élève",
    wrong: ["Je tourne le dos au nouvel élève", "Je me moque du nouvel élève", "Je ne parle pas au nouvel élève"] },
  { id: "ro1", topic: "route", group: "arret", text: "Tu veux traverser. Le feu est rouge pour toi.", short: "le feu rouge",
    right: "Je m'arrête et j'attends au feu rouge",
    wrong: ["Je traverse quand le feu est rouge", "Je ferme les yeux et je traverse", "Je passe devant les voitures qui roulent"] },
  { id: "ro2", topic: "route", group: "traverser", text: "Tu veux traverser. Le feu est vert pour toi.", short: "le feu vert",
    right: "Je regarde bien avant de traverser",
    wrong: ["Je traverse sans regarder", "Je traverse les yeux fermés", "Je traverse en jouant au ballon"] },
  { id: "ro3", topic: "route", group: "traverser", text: "Tu veux traverser la route.", short: "le passage piéton",
    right: "Je traverse sur les bandes blanches",
    wrong: ["Je traverse entre les voitures", "Je traverse n'importe où", "Je traverse là où personne ne me voit"] },
  { id: "ro4", topic: "route", group: "traverser", text: "Tu es au bord du trottoir, prêt à traverser.", short: "Je vais traverser",
    right: "Je regarde à gauche puis à droite",
    wrong: ["Je regarde seulement mes chaussures", "Je parle à mon ami sans regarder", "Je ferme les yeux et j'avance"] },
  { id: "ro5", topic: "route", group: "marcher", text: "Il y a un trottoir le long de la route.", short: "Un trottoir longe la route",
    right: "Je marche sur le trottoir",
    wrong: ["Je marche au milieu de la route", "Je cours sur la route", "Je marche sur la route avec mes amis"] },
  { id: "ro6", topic: "route", group: "ballon-route", text: "Ton ballon roule sur la route.", short: "Mon ballon roule sur la route",
    right: "J'appelle un adulte pour mon ballon",
    wrong: ["Je cours après mon ballon sur la route", "Je me mets au milieu de la route", "Je crie après les voitures"] },
  { id: "ro7", topic: "route", group: "jouer", text: "Tes amis jouent au ballon sur la route.", short: "Mes amis jouent sur la route",
    right: "Je joue ailleurs, loin de la route",
    wrong: ["Je joue au ballon sur la route", "Je fais la course sur la route", "Je fais du vélo au milieu de la route"] },
  { id: "ro8", topic: "route", group: "traverser", text: "Tu sors de classe. Ta maman est de l'autre côté de la route.", short: "Maman est de l'autre côté",
    right: "Je traverse avec un adulte qui me guide",
    wrong: ["Je cours vers maman sans regarder", "Je me faufile entre les voitures", "Je crie pour que les voitures s'arrêtent"] },
  { id: "ro9", topic: "route", group: "arret", text: "Tu entends une moto arriver très vite.", short: "Une moto arrive vite",
    right: "J'attends que la moto soit bien passée",
    wrong: ["Je traverse en courant devant la moto", "Je ne regarde pas la moto qui arrive", "Je m'avance sur la route pour voir la moto"] },
  { id: "ro10", topic: "route", group: "marcher", text: "Il n'y a pas de trottoir sur ton chemin.", short: "Pas de trottoir sur mon chemin",
    right: "Je marche tout au bord de la route",
    wrong: ["Je marche au milieu des voitures", "Je zigzague d'un côté à l'autre de la route", "Je marche sur la route pour aller plus vite"] },
];

/** Les suites : l'énoncé et les pas dans l'ordre, sans émoji. */
const SEQUENCE_ROWS: SequenceRow[] = [
  { id: "sq-po1", topic: "politesse", prompt: "Mets ces gestes dans l'ordre du matin.", steps: ["Je me lève", "Je me lave", "Je m'habille", "Je prends mon cartable"] },
  { id: "sq-po2", topic: "politesse", prompt: "Mets ces gestes dans l'ordre du repas.", steps: ["Je me lave les mains", "Je mange", "Je me lave les dents"] },
  { id: "sq-po3", topic: "politesse", prompt: "Mets ces gestes dans l'ordre du retour.", steps: ["J'arrive à la maison", "Je me lave les mains", "Je prends mon goûter"] },
  { id: "sq-ec1", topic: "ecole", prompt: "Mets ces gestes dans l'ordre de la matinée.", steps: ["J'arrive à l'école", "Je me mets en rang", "J'entre en classe", "Je lève la main pour parler"] },
  { id: "sq-ec2", topic: "ecole", prompt: "Mets ces gestes dans l'ordre pour arriver à temps.", steps: ["Je me réveille tôt", "Je m'habille vite", "Je pars de la maison", "J'arrive à l'école"] },
  { id: "sq-ec3", topic: "ecole", prompt: "Mets ces gestes dans l'ordre du jeu de ballon.", steps: ["Je demande le ballon", "Je joue avec mes camarades", "Je rends le ballon"] },
  { id: "sq-en1", topic: "entraide", prompt: "Mets ces moments dans l'ordre de la scène.", steps: ["Mon camarade tombe", "J'accours vers lui", "Je l'aide à se relever", "Il me dit merci"] },
  { id: "sq-en2", topic: "entraide", prompt: "Mets ces gestes dans l'ordre du partage.", steps: ["J'ai un pain", "Je partage mon pain", "Nous mangeons ensemble"] },
  { id: "sq-en3", topic: "entraide", prompt: "Mets ces gestes dans l'ordre du jeu.", steps: ["Nous choisissons un jeu", "Nous jouons ensemble", "Nous rangeons le jeu"] },
  { id: "sq-ro1", topic: "route", prompt: "Mets ces gestes dans l'ordre de la traversée.", steps: ["Je m'arrête au bord du trottoir", "Je regarde à gauche", "Je regarde à droite", "Je traverse sur le passage piéton"] },
  { id: "sq-ro2", topic: "route", prompt: "Mets ces moments dans l'ordre du feu.", steps: ["Le feu est rouge", "Je m'arrête", "Le feu devient vert", "Je regarde et je traverse"] },
  { id: "sq-ro3", topic: "route", prompt: "Mets ces gestes dans l'ordre de la traversée.", steps: ["Je m'arrête au bord du trottoir", "Je regarde à gauche puis à droite", "Je traverse sur le passage piéton"] },
];

/** Les phrases à trou : un trou, un mot juste, deux mots qui ne vont pas. */
const GAP_ROWS: GapRow[] = [
  { id: "gp1", topic: "politesse", text: "Avant de manger, je me lave les ___.", answer: "mains", wrong: ["pieds", "cheveux"] },
  { id: "gp2", topic: "politesse", text: "Je jette mes papiers à la ___.", answer: "poubelle", wrong: ["fenêtre", "chaise"] },
  { id: "gp3", topic: "politesse", text: "Je range mon cahier dans mon ___.", answer: "cartable", wrong: ["lit", "seau"] },
  { id: "gp4", topic: "politesse", text: "Je ne tire pas la ___ aux grandes personnes.", answer: "langue", wrong: ["porte", "table"] },
  { id: "ge1", topic: "ecole", text: "Je lève la ___ pour parler en classe.", answer: "main", wrong: ["jambe", "langue"] },
  { id: "ge2", topic: "ecole", text: "J'arrive à temps, avant la ___.", answer: "cloche", wrong: ["mangue", "chaise"] },
  { id: "ge3", topic: "ecole", text: "Je mets mes papiers à la ___.", answer: "poubelle", wrong: ["porte", "table"] },
  { id: "ge4", topic: "ecole", text: "Je range les livres dans l'___.", answer: "armoire", wrong: ["arbre", "eau"] },
  { id: "ge5", topic: "ecole", text: "Je viens à l'école chaque ___.", answer: "jour", wrong: ["nuit", "étoile"] },
  { id: "gn1", topic: "entraide", text: "Je partage mon pain avec mon ___.", answer: "ami", wrong: ["mur", "toit"] },
  { id: "gn2", topic: "entraide", text: "Je prête mon ___ à un ami qui n'en a pas.", answer: "crayon", wrong: ["lion", "nuage"] },
  { id: "gn3", topic: "entraide", text: "Je ne me moque jamais de mon ___.", answer: "camarade", wrong: ["toit", "mur"] },
  { id: "gr1", topic: "route", text: "Au feu ___, je m'arrête.", answer: "rouge", wrong: ["vert", "bleu"] },
  { id: "gr2", topic: "route", text: "Au feu ___, je regarde puis je traverse.", answer: "vert", wrong: ["rouge", "bleu"] },
  { id: "gr3", topic: "route", text: "Je regarde à gauche, puis à ___.", answer: "droite", wrong: ["terre", "nuit"] },
  { id: "gr4", topic: "route", text: "Je marche sur le ___, pas sur la route.", answer: "trottoir", wrong: ["toit", "mur"] },
  { id: "gr5", topic: "route", text: "Je traverse sur le passage pour ___.", answer: "piétons", wrong: ["voitures", "motos"] },
  { id: "gr6", topic: "route", text: "Je ne joue pas sur la ___.", answer: "route", wrong: ["main", "dent"] },
];

/** Les émojis de tout le module, chacun vérifié d'Unicode 11 au plus et sans sélecteur de variation. */
const ALLOWED_EMOJI = Array.from("👵👂😛🙉🤐👴👋😝🙈😠🧺🤝🙅😆💥💬🤫📢💪😤🧔🙂😒🙊🍚🧼🤢👄🍞🌅🦷😴👕📄🚮🚯💨🎒🏠☔🌙📒📗💢🎨💦🧸📦😡🎯💧📅🏫⚽📺⏰🚶🐌🎲💤🚪🙋🔊🔔👫🏃❓✋📣👉👩📚📖🦶🤲🌳🍬🎈💺🤸🤕😟😋😕📝🤭👧🤗🚫👦🙌👥👀🤔💡😢😈🏀🔁🆕🔴🛑🚗💚🚸🦓👈👟🌇👣🚌🏐🚧👬🏁🚲👪🧑🚖🛵🌾🚕🌀✅❌🚿😊");

const KINDS = ["civ-situation", "civ-glisser", "civ-intrus", "civ-relier", "civ-ordre", "civ-trou"] as const satisfies readonly GameKind[];
type CivKind = (typeof KINDS)[number];

const LEVELS: GameLevel[] = [1, 2, 3, 4];
type Draw = { topic: Topic; level: GameLevel; seed: string };
/** Deux cent quarante tirages par gabarit : les quatre thématiques, les quatre niveaux, quinze graines. */
const draws: Draw[] = TOPICS.flatMap((topic) =>
  LEVELS.flatMap((level) => Array.from({ length: 15 }, (_, n) => ({ topic, level, seed: `civ:${topic}:${level}:${n}` }))),
);
const make = (kind: CivKind, d: Draw) => GAME_KINDS[kind].make(makeContext("CI", d.level, `${kind}:${d.seed}`, undefined, d.topic));

type Exo = { type: string; prompt: string; answerKey: string; hints: string[]; payload: Record<string, unknown> };
const optionsOf = (exo: Exo) => exo.payload.options as string[];
const rightOption = (exo: Exo) => optionsOf(exo)[exo.payload.correctIndex as number];
const itemsOf = (exo: Exo) => exo.payload.items as { text: string; correctZone: string }[];
const zonesOf = (exo: Exo) => exo.payload.zones as string[];
const sequenceOf = (exo: Exo) => exo.payload.correctSequence as string[];
const pairsOf = (exo: Exo) => exo.payload.pairs as { left: string; right: string }[];
const blankOf = (exo: Exo) => (exo.payload.blanks as { options: string[]; answer: string }[])[0];
const textOf = (exo: Exo) => exo.payload.text as string;
const levelOf = (exo: Exo) => (exo.payload.game as { level: number }).level;
const clone = (exo: Exo): Exo => JSON.parse(JSON.stringify(exo)) as Exo;

const stripEmoji = (text: string) => text.replace(/\p{Extended_Pictographic}/gu, "").replace(/\s+/g, " ").trim();
const emojiOf = (tile: string) => /^\p{Extended_Pictographic}/u.exec(tile)?.[0] ?? "";
const apostrophes = (text: string) => (text.match(/'/g) ?? []).length;
const fold = (text: string) => text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
const VARIATION_SELECTOR = String.fromCodePoint(0xfe0f);
const JOINER = String.fromCodePoint(0x200d);

const eq = (label: string, actual: unknown, expected: unknown): string[] =>
  JSON.stringify(actual) === JSON.stringify(expected) ? [] : [`${label} : ${JSON.stringify(actual)} au lieu de ${JSON.stringify(expected)}`];
const isTrue = (label: string, value: boolean): string[] => (value ? [] : [label]);
const distinct = (label: string, values: readonly string[]): string[] => isTrue(`${label} : des doublons dans ${JSON.stringify(values)}`, new Set(values).size === values.length);

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

// ---------------------------------------------------------------------------
// Ce que la table sait dire d'un texte
// ---------------------------------------------------------------------------

const rowOfRight = (text: string) => ROWS.find((row) => row.right === text);
const rowOfWrong = (text: string) => ROWS.find((row) => row.wrong.includes(text));
const rowOfGesture = (text: string) => rowOfRight(text) ?? rowOfWrong(text);
const rowOfShort = (short: string) => ROWS.find((row) => row.short === short);
const rowOfPrompt = (prompt: string) => ROWS.find((row) => prompt === `${row.text} Que fais-tu ?`);

const GOOD_ZONE = "✅ À faire";
const BAD_ZONE = "❌ À éviter";
const SORT_SIZE: Record<GameLevel, number> = { 1: 4, 2: 5, 3: 5, 4: 5 };
const PAIR_COUNT: Record<GameLevel, number> = { 1: 3, 2: 4, 3: 4, 4: 4 };

// ---------------------------------------------------------------------------
// Les vérificateurs, un par gabarit
// ---------------------------------------------------------------------------

/** « Ta grand-mère te parle. Que fais-tu ? » : le bon geste est l'option désignée, les deux autres sont des gestes à éviter de la scène. */
function checkSituation(exo: Exo): string[] {
  const row = rowOfPrompt(exo.prompt);
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
}

/** « Glisse chaque geste dans la bonne case. » : un bon geste sous « à faire », un mauvais sous « à éviter », de scènes différentes. */
function checkSort(exo: Exo): string[] {
  const items = itemsOf(exo);
  const problems = [
    ...eq("type", exo.type, "drag-drop"),
    ...eq("les cases", [...zonesOf(exo)].sort(), [BAD_ZONE, GOOD_ZONE].sort()),
    ...eq("le nombre de gestes", items.length, SORT_SIZE[levelOf(exo) as GameLevel]),
  ];
  const scenes: string[] = [];
  for (const item of items) {
    const text = stripEmoji(item.text);
    const good = rowOfRight(text);
    const bad = rowOfWrong(text);
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
    ...isTrue(
      "au moins deux gestes dans chaque case",
      items.filter((item) => item.correctZone === GOOD_ZONE).length >= 2 && items.filter((item) => item.correctZone === BAD_ZONE).length >= 2,
    ),
  );
  return problems;
}

/** « Quel geste est bien ? » ou « Quel geste n'est pas bien ? » : deux gestes d'un côté, un de l'autre, le seul de son côté est la réponse. */
function checkOdd(exo: Exo): string[] {
  const texts = optionsOf(exo).map(stripEmoji);
  const good = texts.filter((text) => rowOfRight(text));
  const bad = texts.filter((text) => rowOfWrong(text));
  const askedGood = exo.prompt === "Quel geste est bien ?";
  const askedBad = exo.prompt === "Quel geste n'est pas bien ?";
  const problems = [
    ...eq("type", exo.type, "qcm"),
    ...isTrue(`énoncé inconnu : « ${exo.prompt} »`, askedGood || askedBad),
    ...eq("nombre d'options", texts.length, 3),
    ...isTrue("chaque option est un geste connu", good.length + bad.length === 3),
  ];
  const answer = stripEmoji(rightOption(exo));
  if (askedGood) problems.push(...eq("un bon geste et deux à éviter", [good.length, bad.length], [1, 2]), ...eq("la réponse est le bon geste", good, [answer]));
  if (askedBad) problems.push(...eq("deux bons gestes et un à éviter", [good.length, bad.length], [2, 1]), ...eq("la réponse est le geste à éviter", bad, [answer]));
  problems.push(
    ...eq("la clé de réponse", stripEmoji(exo.answerKey), answer),
    ...distinct("scènes", texts.map((text) => rowOfGesture(text)?.id ?? "?")),
    ...distinct("émojis", optionsOf(exo).map(emojiOf)),
  );
  return problems;
}

/** « Relie chaque situation au bon geste. » : chaque étiquette va avec le bon geste de sa scène, aucune paire de scènes qui se ressemblent. */
function checkLinks(exo: Exo): string[] {
  const pairs = pairsOf(exo);
  const problems = [...eq("type", exo.type, "match"), ...eq("le nombre de paires", pairs.length, PAIR_COUNT[levelOf(exo) as GameLevel])];
  const rows: Row[] = [];
  for (const pair of pairs) {
    const left = rowOfShort(stripEmoji(pair.left));
    const right = rowOfRight(stripEmoji(pair.right));
    if (!left || !right) {
      problems.push(`paire inconnue : « ${pair.left} » et « ${pair.right} »`);
      continue;
    }
    if (left.id !== right.id) problems.push(`« ${pair.left} » est reliée au geste de « ${right.short} »`);
    rows.push(left);
  }
  problems.push(
    ...distinct("groupes de scènes (même groupe : la paire serait ambiguë)", rows.map((row) => row.group)),
    ...isTrue("une seule thématique", new Set(rows.map((row) => row.topic)).size <= 1),
    ...distinct("émojis des tuiles", pairs.flatMap((pair) => [emojiOf(pair.left), emojiOf(pair.right)])),
    ...distinct("gestes", pairs.map((pair) => stripEmoji(pair.right))),
  );
  return problems;
}

/** « Mets ces gestes dans l'ordre du matin. » : la suite est celle de la table, dans l'ordre, avec l'énoncé de la table. */
function checkOrder(exo: Exo): string[] {
  const steps = sequenceOf(exo).map(stripEmoji);
  const known = SEQUENCE_ROWS.find((row) => row.steps.length === steps.length && row.steps.every((step) => steps.includes(step)));
  if (!known) return [`suite inconnue : ${JSON.stringify(steps)}`];
  return [
    ...eq("type", exo.type, "order"),
    ...eq("l'ordre", steps, known.steps),
    ...eq("l'énoncé", exo.prompt, known.prompt),
    ...distinct("émojis", sequenceOf(exo).map(emojiOf)),
    ...isTrue("trois ou quatre pas", steps.length === 3 || steps.length === 4),
  ];
}

/** « Au feu ___, je m'arrête. » : un trou, le mot juste, deux mots de la table qui ne vont pas. */
function checkGap(exo: Exo): string[] {
  const gap = GAP_ROWS.find((row) => row.text === textOf(exo));
  if (!gap) return [`phrase inconnue : « ${textOf(exo)} »`];
  const blank = blankOf(exo);
  return [
    ...eq("type", exo.type, "fill-blank"),
    ...eq("le mot juste", blank.answer, gap.answer),
    ...eq("la clé de réponse", exo.answerKey, gap.answer),
    ...eq("les trois mots", [...blank.options].sort(), [gap.answer, ...gap.wrong].sort()),
    ...eq("un seul trou", textOf(exo).split("___").length - 1, 1),
    ...eq("un seul blanc", (exo.payload.blanks as unknown[]).length, 1),
  ];
}

const CHECKS: Record<CivKind, (exo: Exo) => string[]> = {
  "civ-situation": checkSituation,
  "civ-glisser": checkSort,
  "civ-intrus": checkOdd,
  "civ-relier": checkLinks,
  "civ-ordre": checkOrder,
  "civ-trou": checkGap,
};

/** Un exercice du gabarit qui répond au prédicat, cherché sur beaucoup de graines. */
function find(kind: CivKind, topic: Topic, predicate: (exo: Exo) => boolean): Exo {
  for (let n = 0; n < 1500; n++) {
    const exo = make(kind, { topic, level: (1 + (n % 4)) as GameLevel, seed: `find:${n}` });
    if (predicate(exo)) return exo;
  }
  throw new Error(`aucun tirage de ${kind} en ${topic} ne répond au prédicat`);
}

// ---------------------------------------------------------------------------
// Les tables
// ---------------------------------------------------------------------------

describe("les tables du test sont celles du module", () => {
  it("compte les mêmes scènes, avec les mêmes gestes", () => {
    expect(
      SCENES.map((scene) => ({
        id: scene.id,
        topic: scene.topic,
        group: scene.group,
        text: scene.text,
        short: scene.short,
        right: scene.right[1],
        wrong: scene.wrong.map((act) => act[1]),
      })),
    ).toEqual(ROWS);
  });

  it("compte les mêmes suites et les mêmes phrases à trou", () => {
    expect(SEQUENCES.map((sequence) => ({ id: sequence.id, topic: sequence.topic, prompt: sequence.prompt, steps: sequence.steps.map((step) => step[1]) }))).toEqual(SEQUENCE_ROWS);
    expect(GAPS.map((gap) => ({ id: gap.id, topic: gap.topic, text: gap.text, answer: gap.answer, wrong: [...gap.wrong] }))).toEqual(GAP_ROWS);
  });

  it("n'écrit que les émojis de la liste, tous anciens, jamais suivis d'un sélecteur de variation", () => {
    const used = new Set<string>();
    const glyphsOf = (text: string) => text.match(/\p{Extended_Pictographic}/gu) ?? [];
    for (const scene of SCENES) for (const glyph of [scene.emoji, scene.right[0], ...scene.wrong.map((act) => act[0])]) glyphsOf(glyph).forEach((g) => used.add(g));
    for (const sequence of SEQUENCES) for (const step of sequence.steps) glyphsOf(step[0]).forEach((g) => used.add(g));
    for (const zone of [GOOD_ZONE, BAD_ZONE]) glyphsOf(zone).forEach((g) => used.add(g));
    expect([...used].sort()).toEqual([...ALLOWED_EMOJI].sort());
    const source = JSON.stringify([SCENES, SEQUENCES, GAPS]);
    expect(source).not.toContain(VARIATION_SELECTOR);
    expect(source).not.toContain(JOINER);
    // Un émoji d'Unicode 12 ou plus (pastilles de couleur, extensions) ne passerait pas la liste ci-dessus : on le dit aussi ici.
    for (const glyph of ALLOWED_EMOJI) {
      const code = glyph.codePointAt(0) as number;
      expect(code >= 0x1fa70 || (code >= 0x1f7e0 && code <= 0x1f7eb), glyph).toBe(false);
    }
  });
});

describe("la table ne se contredit pas", () => {
  const rightTexts = ROWS.map((row) => row.right);
  const wrongTexts = ROWS.flatMap((row) => row.wrong);

  it("n'écrit jamais deux fois le même geste, la même situation ou la même étiquette", () => {
    expect(distinct("gestes", [...rightTexts, ...wrongTexts])).toEqual([]);
    expect(distinct("situations", ROWS.map((row) => row.text))).toEqual([]);
    expect(distinct("étiquettes", ROWS.map((row) => row.short))).toEqual([]);
    expect(distinct("identifiants", ROWS.map((row) => row.id))).toEqual([]);
    expect(distinct("phrases à trou", GAP_ROWS.map((row) => row.text))).toEqual([]);
    expect(distinct("suites", SEQUENCE_ROWS.map((row) => row.id))).toEqual([]);
  });

  it("donne à chaque scène quatre émojis différents, la scène comprise", () => {
    for (const scene of SCENES) {
      const glyphs = [scene.emoji, scene.right[0], ...scene.wrong.map((act) => act[0])];
      expect(distinct(scene.id, glyphs), scene.id).toEqual([]);
    }
    for (const sequence of SEQUENCES) expect(distinct(sequence.id, sequence.steps.map((step) => step[0])), sequence.id).toEqual([]);
  });

  it("garde chaque groupe dans une seule thématique, et au moins quatre groupes par thématique (quatre paires au dernier niveau)", () => {
    for (const topic of TOPICS) {
      const groups = new Set(ROWS.filter((row) => row.topic === topic).map((row) => row.group));
      expect(groups.size, topic).toBeGreaterThanOrEqual(4);
      for (const group of groups) expect(new Set(ROWS.filter((row) => row.group === group).map((row) => row.topic)).size, group).toBe(1);
    }
  });

  it("écrit des situations de vingt mots au plus avec la question, sans deux-points, avec une apostrophe droite au plus", () => {
    for (const row of ROWS) {
      const prompt = `${row.text} Que fais-tu ?`;
      expect(prompt, row.id).not.toMatch(/:/);
      expect(apostrophes(prompt), row.id).toBeLessThanOrEqual(1);
      expect(prompt.split(/\s+/).length, row.id).toBeLessThanOrEqual(20);
    }
    for (const row of SEQUENCE_ROWS) {
      expect(row.prompt, row.id).not.toMatch(/:/);
      expect(apostrophes(row.prompt), row.id).toBeLessThanOrEqual(1);
      // Le critère d'ordre est dans l'énoncé : « dans l'ordre du matin », « pour arriver à temps ».
      expect(row.prompt, row.id).toMatch(/ordre (?:de|du|des|d') |pour arriver/);
    }
    for (const row of GAP_ROWS) {
      expect(row.text.split("___").length - 1, row.id).toBe(1);
      expect(apostrophes(row.text), row.id).toBeLessThanOrEqual(1);
      expect(row.wrong, row.id).not.toContain(row.answer);
      expect(new Set(row.wrong).size, row.id).toBe(2);
    }
  });

  it("ne dit le bon geste ni dans l'indice de la scène ni dans les mots qu'un trou propose en trop", () => {
    for (const scene of SCENES) expect(fold(scene.hint), scene.id).not.toContain(fold(scene.right[1]));
    for (const row of GAP_ROWS) for (const word of row.wrong) expect(fold(row.text), `${row.id} : ${word}`).not.toContain(fold(word));
  });

  it("garde au moins une suite de trois pas par thématique, pour le premier niveau", () => {
    for (const topic of TOPICS) expect(SEQUENCE_ROWS.some((row) => row.topic === topic && row.steps.length === 3), topic).toBe(true);
  });
});

describe("la route dit la règle de la fiche", () => {
  const route = (short: string) => ROWS.find((row) => row.short === short)!;

  it("arrête au feu rouge et fait regarder au feu vert", () => {
    expect(route("le feu rouge").right).toMatch(/arrête/);
    expect(route("le feu rouge").wrong.some((text) => /traverse/.test(text))).toBe(true);
    expect(route("le feu vert").right).toMatch(/regarde/);
    expect(route("le passage piéton").right).toMatch(/traverse/);
  });

  it("range la traversée dans l'ordre de la fiche : s'arrêter, regarder à gauche, regarder à droite, traverser", () => {
    const crossing = SEQUENCE_ROWS.find((row) => row.id === "sq-ro1")!.steps;
    const at = (word: RegExp) => crossing.findIndex((step) => word.test(step));
    expect(at(/arrête/)).toBe(0);
    expect(at(/gauche/)).toBe(1);
    expect(at(/droite/)).toBe(2);
    expect(at(/traverse/)).toBe(3);
    expect(SEQUENCE_ROWS.find((row) => row.id === "sq-ro3")!.steps).toEqual(["Je m'arrête au bord du trottoir", "Je regarde à gauche puis à droite", "Je traverse sur le passage piéton"]);
  });

  it("fait venir le vert après le rouge : le feu DEVIENT vert", () => {
    expect(SEQUENCE_ROWS.find((row) => row.id === "sq-ro2")!.steps).toEqual(["Le feu est rouge", "Je m'arrête", "Le feu devient vert", "Je regarde et je traverse"]);
  });

  it("ne fait jamais marcher ni jouer sur la route dans un bon geste", () => {
    for (const row of ROWS.filter((r) => r.topic === "route")) {
      expect(row.right, row.id).not.toMatch(/marche (?:au milieu de|sur) la route|joue (?:au ballon )?sur la route/);
    }
  });
});

// ---------------------------------------------------------------------------
// Les gabarits
// ---------------------------------------------------------------------------

describe.each(KINDS)("le gabarit « %s »", (kind) => {
  it("passe son vérificateur sur deux cent quarante tirages", () => {
    for (const d of draws) {
      const exo = make(kind, d);
      expect(CHECKS[kind](exo), `${d.seed} : ${exo.prompt}`).toEqual([]);
    }
  });

  it("passe le contrôleur de l'instruction civique sans aucun défaut, à tous les niveaux", () => {
    for (const d of draws) {
      const exo = make(kind, d);
      const defects = auditExercise({
        type: exo.type,
        prompt: exo.prompt,
        payload: exo.payload,
        answerKey: exo.answerKey,
        hints: exo.hints,
        class: "CI",
        subject: "Instruction civique",
      });
      expect(defects, `${kind} ${d.seed} : ${exo.prompt}`).toEqual([]);
    }
  });

  it("donne trois indices différents, et se refait à l'identique avec la même graine", () => {
    for (const topic of TOPICS) {
      const a = GAME_KINDS[kind].make(makeContext("CI", 2, "graine", undefined, topic));
      const b = GAME_KINDS[kind].make(makeContext("CI", 2, "graine", undefined, topic));
      expect(a).toEqual(b);
      expect(a.hints).toHaveLength(3);
      expect(new Set(a.hints).size).toBe(3);
    }
  });

  it("garde l'origine du jeu, sa thématique comprise, pour refaire le même gabarit", () => {
    for (const topic of TOPICS) {
      const exo = GAME_KINDS[kind].make(makeContext("CI", 3, "origine", undefined, topic));
      expect(gameOriginOf(exo.payload)).toEqual({ kind, level: 3, vocabulary: topic });
      const again = regenerateGame(gameOriginOf(exo.payload), "CI", "autre graine");
      expect(again, `${kind} ${topic}`).not.toBeNull();
      expect(CHECKS[kind](again as unknown as Exo), `${kind} ${topic}`).toEqual([]);
      expect(gameOriginOf(again!.payload)?.vocabulary).toBe(topic);
    }
  });

  it("joue sans thématique (les jeux sans programme) : une thématique au hasard, jamais deux mêlées", () => {
    for (let n = 0; n < 60; n++) {
      const exo = GAME_KINDS[kind].make(makeContext("CI", 2, `libre:${kind}:${n}`));
      expect(CHECKS[kind](exo), exo.prompt).toEqual([]);
      const topics = new Set(
        exo.type === "match"
          ? pairsOf(exo).map((pair) => rowOfShort(stripEmoji(pair.left))?.topic)
          : exo.type === "drag-drop"
            ? itemsOf(exo).map((item) => rowOfGesture(stripEmoji(item.text))?.topic)
            : exo.type === "fill-blank"
              ? [GAP_ROWS.find((row) => row.text === textOf(exo))?.topic]
              : exo.type === "order"
                ? [SEQUENCE_ROWS.find((row) => row.prompt === exo.prompt && row.steps.length === sequenceOf(exo).length)?.topic]
                : optionsOf(exo).map((option) => rowOfGesture(stripEmoji(option))?.topic),
      );
      expect(topics.size, exo.prompt).toBe(1);
      expect(topics.has(undefined), exo.prompt).toBe(false);
    }
  });
});

describe("les vérificateurs voient ce qu'on abîme", () => {
  const CORRUPT: Record<CivKind, (exo: Exo) => Exo> = {
    "civ-situation": (exo) => {
      const bad = clone(exo);
      bad.payload.correctIndex = ((exo.payload.correctIndex as number) + 1) % 3;
      return bad;
    },
    "civ-glisser": (exo) => {
      const bad = clone(exo);
      itemsOf(bad)[0].correctZone = itemsOf(bad)[0].correctZone === GOOD_ZONE ? BAD_ZONE : GOOD_ZONE;
      return bad;
    },
    "civ-intrus": (exo) => {
      const bad = clone(exo);
      bad.payload.correctIndex = ((exo.payload.correctIndex as number) + 1) % 3;
      return bad;
    },
    "civ-relier": (exo) => {
      const bad = clone(exo);
      const pairs = pairsOf(bad);
      [pairs[0].right, pairs[1].right] = [pairs[1].right, pairs[0].right];
      return bad;
    },
    "civ-ordre": (exo) => {
      const bad = clone(exo);
      const steps = sequenceOf(bad);
      [steps[0], steps[1]] = [steps[1], steps[0]];
      return bad;
    },
    "civ-trou": (exo) => {
      const bad = clone(exo);
      const blank = blankOf(bad);
      blank.answer = blank.options.find((option) => option !== blank.answer) as string;
      return bad;
    },
  };

  it.each(KINDS)("le vérificateur de « %s » voit chaque exercice abîmé, deux cent quarante fois sur deux cent quarante", (kind) => {
    for (const d of draws) {
      const exo = make(kind, d);
      expect(CHECKS[kind](exo), `${d.seed} sain`).toEqual([]);
      expect(CHECKS[kind](CORRUPT[kind](exo)).length, `${d.seed} abîmé : ${exo.prompt}`).toBeGreaterThan(0);
    }
  });

  it("voit deux bons gestes dans un QCM de situation", () => {
    const exo = find("civ-situation", "route", (e) => levelOf(e) === 2);
    const bad = clone(exo);
    const row = rowOfPrompt(exo.prompt)!;
    const otherRight = ROWS.find((r) => r.topic === "route" && r.id !== row.id)!.right;
    const wrongIndex = optionsOf(bad).findIndex((_, i) => i !== bad.payload.correctIndex);
    optionsOf(bad)[wrongIndex] = `🛑 ${otherRight}`;
    expect(CHECKS["civ-situation"](bad).join(" | ")).toContain("gestes à éviter de la scène");
  });

  it("voit le feu vert relié au passage piéton, deux scènes qui se ressemblent", () => {
    const exo = find("civ-relier", "route", (e) => levelOf(e) === 2);
    const bad = clone(exo);
    bad.payload.pairs = [
      { left: "💚 le feu vert", right: "👀 Je regarde bien avant de traverser" },
      { left: "🚸 le passage piéton", right: "🦓 Je traverse sur les bandes blanches" },
      { left: "🌇 Un trottoir longe la route", right: "👣 Je marche sur le trottoir" },
      { left: "🔴 le feu rouge", right: "🛑 Je m'arrête au feu rouge" },
    ];
    expect(CHECKS["civ-relier"](bad).join(" | ")).toContain("groupes de scènes");
  });

  it("voit « Je traverse quand le feu est rouge » rangé sous « à faire »", () => {
    const exo = find("civ-glisser", "route", (e) => itemsOf(e).some((item) => stripEmoji(item.text) === "Je traverse quand le feu est rouge"));
    const bad = clone(exo);
    for (const item of itemsOf(bad)) if (stripEmoji(item.text) === "Je traverse quand le feu est rouge") item.correctZone = GOOD_ZONE;
    expect(CHECKS["civ-glisser"](bad).join(" | ")).toContain("geste à éviter, rangé sous");
  });

  it("voit la question de l'intrus posée à l'envers", () => {
    const exo = find("civ-intrus", "ecole", (e) => e.prompt === "Quel geste est bien ?");
    const bad = clone(exo);
    bad.prompt = "Quel geste n'est pas bien ?";
    expect(CHECKS["civ-intrus"](bad).length).toBeGreaterThan(0);
  });

  it("voit le feu qui devient vert avant d'être rouge, et la traversée où l'on regarde le feu après la route", () => {
    const feu = find("civ-ordre", "route", (e) => e.prompt === "Mets ces moments dans l'ordre du feu.");
    const swapped = clone(feu);
    const steps = sequenceOf(swapped);
    [steps[0], steps[2]] = [steps[2], steps[0]];
    expect(CHECKS["civ-ordre"](swapped).join(" | ")).toContain("l'ordre");
    // L'ordre que le modèle avait écrit : regarder à gauche, regarder à droite, vérifier le feu, traverser.
    const old = clone(feu);
    old.prompt = "Mets ces étapes dans l'ordre pour traverser.";
    old.payload.correctSequence = ["Regarder à gauche", "Regarder à droite", "Vérifier le feu", "Traverser"];
    expect(CHECKS["civ-ordre"](old).join(" | ")).toContain("suite inconnue");
  });

  it("voit « gauche » pour le trou de « puis à ___ »", () => {
    const exo = find("civ-trou", "route", (e) => textOf(e) === "Je regarde à gauche, puis à ___.");
    const bad = clone(exo);
    blankOf(bad).answer = "gauche";
    expect(CHECKS["civ-trou"](bad).length).toBeGreaterThan(0);
  });
});

describe("les gabarits ont la forme de l'écran du CI", () => {
  it("compte quatre puis cinq gestes à ranger, trois puis quatre paires à relier, et trois pas au premier niveau", () => {
    for (const d of draws) {
      expect(itemsOf(make("civ-glisser", d)), d.seed).toHaveLength(SORT_SIZE[d.level]);
      expect(pairsOf(make("civ-relier", d)), d.seed).toHaveLength(PAIR_COUNT[d.level]);
      if (d.level === 1) expect(sequenceOf(make("civ-ordre", d)), d.seed).toHaveLength(3);
    }
  });

  it("n'a aucun deux-points, au plus une apostrophe et vingt mots dans l'énoncé", () => {
    for (const kind of KINDS) {
      for (const d of draws) {
        const exo = make(kind, d);
        expect(exo.prompt, kind).not.toMatch(/:/);
        expect(apostrophes(exo.prompt), `${kind} : ${exo.prompt}`).toBeLessThanOrEqual(1);
        expect(exo.prompt.split(/\s+/).filter((token) => /[\p{L}\p{N}]/u.test(token)).length, `${kind} : ${exo.prompt}`).toBeLessThanOrEqual(20);
        if (exo.type === "fill-blank") expect(apostrophes(textOf(exo)), exo.prompt).toBeLessThanOrEqual(1);
      }
    }
  });

  it("n'écrit un émoji que de la liste, sans sélecteur de variation ni liaison", () => {
    for (const kind of KINDS) {
      for (const d of draws) {
        const exo = make(kind, d);
        const text = JSON.stringify([exo.prompt, exo.payload, exo.answerKey, exo.hints]);
        expect(text, kind).not.toContain(VARIATION_SELECTOR);
        expect(text, kind).not.toContain(JOINER);
        for (const glyph of text.match(/\p{Extended_Pictographic}/gu) ?? []) expect(ALLOWED_EMOJI, `${kind} : ${glyph}`).toContain(glyph);
      }
    }
  });

  it("n'écrit dans aucun indice le bon geste en entier", () => {
    for (const kind of ["civ-situation", "civ-intrus"] as const) {
      for (const d of draws) {
        const exo = make(kind, d);
        const answer = fold(stripEmoji(rightOption(exo)));
        for (const hint of exo.hints) expect(fold(hint), `${kind} : « ${hint} »`).not.toContain(answer);
      }
    }
  });
});

describe("la bonne réponse ne se devine pas", () => {
  const many = TOPICS.flatMap((topic) =>
    LEVELS.flatMap((level) => Array.from({ length: 40 }, (_, n) => ({ topic, level, seed: `spread:${topic}:${level}:${n}` }))),
  );

  it("n'est ni la plus courte ni la plus longue des options plus de quatre fois sur dix", () => {
    for (const kind of ["civ-situation", "civ-intrus"] as const) {
      let shortest = 0;
      let longest = 0;
      for (const d of many) {
        const exo = make(kind, d);
        const lengths = optionsOf(exo).map((option) => stripEmoji(option).length);
        const right = lengths[exo.payload.correctIndex as number];
        const others = lengths.filter((_, i) => i !== exo.payload.correctIndex);
        if (right < Math.min(...others)) shortest++;
        if (right > Math.max(...others)) longest++;
      }
      expect(shortest / many.length, `${kind} : la plus courte`).toBeLessThan(0.4);
      expect(longest / many.length, `${kind} : la plus longue`).toBeLessThan(0.4);
    }
  });

  it("ne tombe pas toujours à la même place", () => {
    for (const kind of ["civ-situation", "civ-intrus"] as const) {
      const places = [0, 0, 0];
      for (const d of many) places[make(kind, d).payload.correctIndex as number]++;
      for (const place of places) expect(place / many.length, `${kind} ${places}`).toBeGreaterThan(0.2);
    }
  });

  it("pose les deux sortes de questions de l'intrus", () => {
    const prompts = new Set(many.map((d) => make("civ-intrus", d).prompt));
    expect([...prompts].sort()).toEqual(["Quel geste est bien ?", "Quel geste n'est pas bien ?"]);
  });
});

// ---------------------------------------------------------------------------
// Le clip de la scène
// ---------------------------------------------------------------------------

describe("le clip de la scène", () => {
  it("est celui de la scène que l'énoncé raconte, pour chacun des 240 tirages du QCM", () => {
    for (const d of draws) {
      const exo = make("civ-situation", d);
      const scene = SCENES.find((candidate) => candidate.id === exo.payload.scene);
      const where = `${d.topic} ${d.level} ${d.seed}`;
      expect(scene, `${where} : une scène du module`).toBeDefined();
      expect(isSceneClipId(exo.payload.scene), `${where} : un clip du catalogue`).toBe(true);
      expect(exo.prompt, where).toBe(`${scene!.text} Que fais-tu ?`);
      expect(scene!.topic, where).toBe(d.topic);
    }
  });

  it("n'est porté que par le QCM de la situation : les autres gabarits n'ont pas de scène à montrer", () => {
    for (const kind of KINDS.filter((candidate) => candidate !== "civ-situation")) {
      for (const d of draws.slice(0, 40)) expect(make(kind, d).payload.scene, `${kind} ${d.seed}`).toBeUndefined();
    }
  });

  it("part vers l'écran de l'enfant, sans la bonne réponse", () => {
    for (const d of draws.slice(0, 40)) {
      const exo = make("civ-situation", d);
      const view = sanitizePayload("qcm", exo.payload, "exercice", "tentative") as Record<string, unknown>;
      expect(view.scene, d.seed).toBe(exo.payload.scene);
      expect(view, d.seed).not.toHaveProperty("correctIndex");
    }
  });

  it("revient avec l'exercice que l'enfant refait : la scène change, le clip aussi", () => {
    const seen = new Set<unknown>();
    for (let n = 0; n < 12; n++) {
      const redone = regenerateGame({ kind: "civ-situation", level: 2, vocabulary: "route" }, "CI", `refait:${n}`);
      expect(redone, `refait ${n}`).not.toBeNull();
      const scene = SCENES.find((candidate) => candidate.id === redone!.payload.scene);
      expect(scene?.topic, `refait ${n}`).toBe("route");
      expect(redone!.prompt, `refait ${n}`).toBe(`${scene!.text} Que fais-tu ?`);
      seen.add(redone!.payload.scene);
    }
    expect(seen.size, "plusieurs scènes de la route").toBeGreaterThan(2);
  });
});

// ---------------------------------------------------------------------------
// Dans le programme
// ---------------------------------------------------------------------------

describe("les quatre thématiques de l'instruction civique du CI", () => {
  const KEYS = ["ci-ci-politesse", "ci-ci-ecole", "ci-ci-entraide", "ci-ci-route"] as const;
  const entryOf = (key: string) => allProgrammeEntries().find((entry) => entry.topic.key === key)!;
  const TOPIC_OF_KEY: Record<(typeof KEYS)[number], Topic> = { "ci-ci-politesse": "politesse", "ci-ci-ecole": "ecole", "ci-ci-entraide": "entraide", "ci-ci-route": "route" };

  it("sont dix gabarits par palier, sans le modèle, et gratuites à la pré-génération", () => {
    for (const key of KEYS) {
      const games = entryOf(key).topic.games ?? [];
      expect(games.reduce((sum, spec) => sum + spec.count, 0), key).toBe(PALIER_SIZE);
      expect(topicUsesModel(key), key).toBe(false);
      expect(entryOf(key).klass, key).toBe("CI");
    }
  });

  it("ne demandent que des gabarits civiques de leur thématique, et ceux de la politesse du français pour saluer", () => {
    for (const key of KEYS) {
      for (const spec of entryOf(key).topic.games ?? []) {
        if (spec.kind.startsWith("civ-")) expect(spec.vocabulary, `${key} : ${spec.kind}`).toBe(TOPIC_OF_KEY[key]);
        else expect(key === "ci-ci-politesse" && spec.kind.startsWith("politesse-"), `${key} : ${spec.kind}`).toBe(true);
      }
    }
  });

  it("montrent chaque type que la démonstration de la page d'accueil montre au CI", () => {
    const typesOf = (key: string) => new Set((entryOf(key).topic.games ?? []).map((spec) => GAME_KINDS[spec.kind].type));
    expect(typesOf("ci-ci-route").has("qcm")).toBe(true);
    expect(typesOf("ci-ci-ecole").has("drag-drop")).toBe(true);
    expect(typesOf("ci-ci-politesse").has("match")).toBe(true);
    expect(typesOf("ci-ci-politesse").has("fill-blank")).toBe(true);
    expect(typesOf("ci-ci-entraide").has("order")).toBe(true);
    // Jamais une réponse à écrire au CI.
    for (const key of KEYS) expect(typesOf(key).has("short-answer"), key).toBe(false);
  });

  it("laisse les cinq thématiques de l'instruction civique du CP au modèle", () => {
    for (const key of ["ci-cp-reglement", "ci-cp-responsabilites", "ci-cp-genre", "ci-cp-route", "ci-cp-paix"]) {
      expect(entryOf(key).topic.games, key).toBeUndefined();
      expect(topicUsesModel(key), key).toBe(true);
    }
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
              subject: "Instruction civique",
            });
            expect(defects, `${key} palier ${palierIndex} : ${exo.prompt}`).toEqual([]);
          }
          // Les mêmes jeux que le programme demande, dans les mêmes nombres.
          const got: Record<string, number> = {};
          for (const exo of games) {
            const kind = gameOriginOf(exo.payload)!.kind;
            got[kind] = (got[kind] ?? 0) + 1;
          }
          expect(got, `${key} palier ${palierIndex}`).toEqual(wanted);
          // Deux exercices identiques dans un palier, l'enfant le voit.
          expect(distinct(key, games.map(signature)), `${key} palier ${palierIndex}`).toEqual([]);
          // Une même scène ne revient pas dans deux QCM de situation du même palier.
          const scenes = games.filter((exo) => gameOriginOf(exo.payload)!.kind === "civ-situation").map((exo) => exo.prompt);
          expect(distinct(`${key} situations`, scenes), `${key} palier ${palierIndex}`).toEqual([]);
        }
      }
    }
  });
});
