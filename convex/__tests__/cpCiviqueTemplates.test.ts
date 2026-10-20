import { describe, expect, it } from "vitest";
import { auditExercise } from "../paliers/exerciseAudit";
import { GAME_KINDS, generateGames, regenerateGame, type GameKind } from "../paliers/games";
import { makeContext, type GameLevel } from "../paliers/games/shared";
import { topicUsesModel } from "../paliers/pregen";
import { allProgrammeEntries } from "../programme";
import { PALIER_SIZE } from "../paliers/scoring";

/**
 * L'INSTRUCTION CIVIQUE DU CP : la route, le règlement de la classe, les responsabilités, filles et garçons, la paix.
 *
 * Chaque test RECALCULE la bonne réponse depuis l'énoncé et les tuiles, avec ses propres tables écrites à part (chaque
 * situation avec son bon geste et ses trois mauvais, les suites qui n'ont qu'un ordre, les trous, les droits et les devoirs,
 * les responsables, les panneaux). Un gabarit dont la réponse contredit sa table échoue. À la fin, des MUTATIONS : on abîme
 * la bonne réponse d'un exercice juste, et chaque vérification doit le voir. L'échantillon du modèle comptait huit exercices
 * faux sur vingt-sept (« Les garçons jouent et les filles aident », la vaisselle rangée chez les filles, des paires que rien
 * ne relie, des numéros qui contredisent l'ordre).
 */

const LEVELS: GameLevel[] = [1, 2, 3, 4];
const draws = LEVELS.flatMap((level) => Array.from({ length: 60 }, (_, n) => ({ level, seed: `civ:${level}:${n}` })));
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

const fold = (text: string) => text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
const apostrophes = (text: string) => (text.match(/'/g) ?? []).length;
const wordCount = (text: string) => text.split(/\s+/).filter((token) => /[\p{L}\p{N}]/u.test(token)).length;
const same = (a: readonly string[], b: readonly string[]) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());

type Check = (exo: Exo) => string | null;
const ok = (condition: boolean, message: string) => (condition ? null : message);

// ---------------------------------------------------------------------------
// Les tables de vérité, écrites à part des gabarits
// ---------------------------------------------------------------------------

/** [thème, groupe, situation, étiquette, bon geste, trois mauvais gestes] */
type Row = [string, string, string, string, string, string, string, string];
const TABLE: Row[] = [
  ["route", "traverser", "Tu veux traverser la route.", "Tu veux traverser la route", "Je regarde à gauche et à droite avant de traverser.", "Je traverse en courant sans regarder.", "Je traverse la route en jouant au ballon.", "Je traverse les yeux fermés."],
  ["route", "traverser", "Il y a un passage pour piétons devant toi.", "Un passage pour piétons est devant toi", "Je traverse sur le passage pour piétons.", "Je traverse loin du passage, entre les voitures.", "Je marche au milieu de la route.", "Je joue au ballon au milieu de la route."],
  ["route", "stop", "Ton père conduit. Il voit le panneau STOP.", "Papa voit le panneau STOP", "Il s'arrête au panneau STOP.", "Il roule plus vite au panneau STOP.", "Il klaxonne et passe sans s'arrêter.", "Il ferme les yeux et continue."],
  ["route", "interdit", "Ton oncle conduit. Il voit le panneau sens interdit.", "Oncle voit un sens interdit", "Il n'entre pas dans la rue.", "Il entre dans la rue quand même.", "Il entre dans la rue en klaxonnant.", "Il entre dans la rue à toute vitesse."],
  ["route", "voiture", "Tu montes dans la voiture de ta tante.", "Tu montes en voiture", "J'attache ma ceinture de sécurité.", "Je laisse ma ceinture détachée.", "Je me mets debout sur le siège.", "Je penche la tête dehors par la fenêtre."],
  ["route", "moto", "Ton grand frère va t'emmener à moto.", "Tu montes sur une moto", "Je mets un casque sur ma tête.", "Je monte sans casque.", "Je monte à moto avec un chapeau de paille.", "Je monte à moto avec mon cartable sur la tête."],
  ["route", "car", "Le car de l'école arrive devant toi.", "Le car arrive", "J'attends que le car soit arrêté pour monter.", "Je cours vers le car qui roule.", "Je monte avant que le car s'arrête.", "Je pousse les autres pour monter."],
  ["route", "car", "Le car est arrêté et tu dois descendre.", "Tu descends du car", "Je descends doucement et je regarde la route.", "Je saute du car en courant.", "Je descends sans regarder la route.", "Je pousse mes camarades pour descendre."],
  ["route", "marcher", "Tu marches au bord de la route.", "Tu marches au bord de la route", "Je marche sur le côté, loin des voitures.", "Je marche au milieu de la chaussée.", "Je joue au ballon sur la route.", "Je marche en dansant devant les voitures."],
  ["reglement", "ecoute", "Le maître parle à la classe.", "Le maître parle", "J'écoute le maître en silence.", "Je parle fort avec mon voisin.", "Je chante pendant que le maître parle.", "Je me lève et je cours dans la classe."],
  ["reglement", "parole", "Tu veux répondre à une question.", "Tu veux répondre", "Je lève la main et j'attends mon tour.", "Je crie la réponse sans attendre.", "Je me lève et je parle sans permission.", "Je prends la parole de mon voisin."],
  ["reglement", "bonjour", "Tu arrives en classe le matin.", "Tu arrives en classe", "Je dis bonjour à mon maître et à mes camarades.", "Je claque la porte en criant.", "Je jette mon cartable par terre.", "Je tire la langue à mon maître."],
  ["reglement", "faute", "Tu as cassé le crayon d'un camarade.", "Tu as cassé un crayon", "Je lui dis pardon et je répare ma faute.", "Je cache le crayon cassé.", "Je dis que c'est sa faute.", "Je me moque de lui."],
  ["reglement", "calme", "Tu as fini ton travail avant les autres.", "Tu as fini avant les autres", "Je reste calme sans déranger les autres.", "Je dérange mes voisins pour jouer.", "Je déchire mes feuilles.", "Je crie que j'ai fini."],
  ["reglement", "propre", "Il y a des papiers par terre dans la classe.", "Des papiers sont par terre", "Je mets les papiers à la poubelle.", "Je jette encore plus de papiers par terre.", "Je cache les papiers sous la table.", "Je laisse les papiers par terre."],
  ["reglement", "demander", "Tu veux le livre de ton voisin.", "Tu veux le livre de ton voisin", "Je lui demande le livre poliment.", "Je prends son livre sans rien dire.", "Je tire son livre très fort.", "Je cache son livre dans mon sac."],
  ["reglement", "rang", "La cloche sonne à la fin de la récréation.", "La cloche sonne", "Je me mets en rang pour rentrer.", "Je continue de jouer dans la cour.", "Je me cache pour ne pas rentrer.", "Je cours dans les couloirs."],
  ["responsabilites", "balayer", "Tu es responsable de la propreté. La classe est sale.", "La classe est sale", "Je balaie la classe.", "Je jette des papiers par terre.", "Je pars jouer dehors.", "Je renverse la poubelle."],
  ["responsabilites", "ranger", "Tu es responsable du matériel. Les livres sont par terre.", "Les livres sont par terre", "Je range les livres sur l'étagère.", "Je déchire les livres.", "Je lance les livres sur mes amis.", "Je cache les livres sous la table."],
  ["responsabilites", "calme", "Tu es chef de classe. Le maître sort un moment.", "Le maître sort", "Je demande le calme à mes camarades.", "Je crie plus fort que les autres.", "Je saute sur les tables.", "Je quitte la classe sans permission."],
  ["responsabilites", "drapeau", "C'est lundi matin. Il faut lever le drapeau.", "Il faut lever le drapeau", "J'aide à lever le drapeau avec respect.", "Je joue avec le drapeau.", "Je rigole pendant le lever du drapeau.", "Je jette le drapeau par terre."],
  ["responsabilites", "balayer", "Tu es responsable de la propreté. Il y a une peau de banane dans la cour.", "Une peau de banane est dans la cour", "Je mets la peau de banane à la poubelle.", "Je jette la peau de banane sous la table.", "Je laisse la peau de banane par terre.", "Je lance la peau de banane sur un camarade."],
  ["responsabilites", "ranger", "Tu es responsable du matériel. Il manque des crayons.", "Il manque des crayons", "Je compte les crayons et je préviens le maître.", "Je cache la boîte de crayons.", "Je jette la boîte de crayons.", "Je prends tous les crayons pour moi."],
  ["responsabilites", "calme", "Ton camarade chef de classe te demande de te taire.", "Le chef de classe te demande le silence", "Je l'écoute et je me tais.", "Je me moque de ce chef.", "Je crie encore plus fort.", "Je lui jette mon cahier."],
  ["responsabilites", "tableau", "Tu es de service pour le tableau. Il est plein d'écriture.", "Le tableau est plein d'écriture", "J'efface le tableau avec l'éponge.", "Je laisse le tableau sale.", "Je casse la craie en deux.", "Je jette la craie par la fenêtre."],
  ["genre", "inviter", "Une fille veut jouer au foot avec les garçons.", "Une fille veut jouer au foot", "Je l'invite à jouer avec nous.", "Je lui dis que le foot est seulement pour les garçons.", "Je cache le ballon pour qu'elle ne joue pas.", "Je me moque d'elle."],
  ["genre", "inviter", "Un garçon veut sauter à la corde avec les filles.", "Un garçon veut sauter à la corde", "Je lui fais une place dans le jeu.", "Je lui dis que la corde est seulement pour les filles.", "Je me moque de ce garçon.", "Je lui prends la corde."],
  ["genre", "parole", "Une fille lève la main pour répondre en classe.", "Une fille répond en classe", "Je l'écoute comme les autres.", "Je dis que les filles se trompent toujours.", "Je parle plus fort qu'elle pour l'empêcher.", "Je ris de sa réponse."],
  ["genre", "maison", "À la maison, il faut balayer la cour.", "Il faut balayer la cour", "Mon frère et ma sœur balaient la cour ensemble.", "Seules les filles balaient la cour.", "Seuls les garçons balaient la cour.", "Personne ne balaie la cour."],
  ["genre", "chef", "Le maître cherche un chef de classe.", "Le maître cherche un chef", "Une fille ou un garçon peut être chef de classe.", "Seul un garçon peut être chef de classe.", "Seule une fille peut être chef de classe.", "Seul le plus grand peut être chef de classe."],
  ["genre", "maison", "Il faut mettre la table pour le repas.", "Il faut mettre la table pour le repas", "Mon frère et ma sœur mettent la table ensemble.", "Seule ma sœur met la table.", "Seul mon frère met la table.", "Personne n'aide à mettre la table."],
  ["genre", "partage", "Une fille et un garçon veulent le même livre.", "Une fille et un garçon veulent le même livre", "Ils lisent le livre ensemble.", "Le garçon prend le livre parce qu'il est un garçon.", "La fille prend le livre parce qu'elle est une fille.", "Ils se battent pour le livre."],
  ["genre", "consoler", "Un garçon pleure parce qu'il est tombé.", "Un garçon pleure", "Je le console comme n'importe quel enfant.", "Je lui dis que les garçons ne pleurent jamais.", "Je ris de lui devant tout le monde.", "Je lui dis de partir et de pleurer ailleurs."],
  ["paix", "parole", "Un camarade te pousse sans le faire exprès.", "Un camarade te pousse", "Je lui dis calmement que ça m'a fait mal.", "Je le pousse très fort.", "Je lui donne un coup de poing.", "Je lui crie des gros mots."],
  ["paix", "partage", "Deux enfants veulent le même ballon.", "Deux enfants veulent le même ballon", "Je propose de jouer chacun à notre tour.", "Je prends le ballon de force.", "Je frappe mon camarade.", "Je cache le ballon."],
  ["paix", "adulte", "La dispute continue et tu ne sais plus quoi faire.", "La dispute continue", "Je demande l'aide d'un adulte.", "Je continue à me battre.", "Je casse le cahier de mon camarade.", "Je continue la dispute en criant."],
  ["paix", "moquerie", "Un camarade porte de vieilles chaussures.", "Un camarade a de vieilles chaussures", "Je ne me moque pas de lui.", "Je me moque de ses chaussures.", "Je dis aux autres de rire de lui.", "Je cache ses chaussures."],
  ["paix", "pardon", "Tu t'es disputé avec ton ami hier.", "Tu t'es disputé avec ton ami", "Je vais lui dire que je suis désolé.", "Je ne lui parle plus jamais.", "Je le frappe pour me venger.", "Je dis du mal de lui."],
  ["paix", "parole", "Un camarade t'a insulté.", "Un camarade t'a insulté", "Je demande à mon camarade de ne plus m'insulter.", "Je réponds en insultant mon camarade.", "Je tape sur mon camarade pour le punir.", "Je dis à tous que c'est un méchant."],
  ["paix", "adulte", "Deux enfants se battent dans la cour.", "Deux enfants se battent", "Je préviens un adulte tout de suite.", "Je crie pour encourager la bagarre.", "Je prends un bâton pour les séparer.", "Je regarde en riant."],
  ["paix", "reconcilier", "Ton ami est triste après une dispute.", "Ton ami est triste", "Je lui dis des mots gentils et je me réconcilie.", "Je lui tourne le dos en riant.", "Je me moque de sa tristesse.", "Je lui dis que je ne suis plus son ami."],
];

const TOPIC_OF_TEXT = new Map(TABLE.map((row) => [row[2], row[0]]));
const RIGHT_OF_TEXT = new Map(TABLE.map((row) => [row[2], row[4]]));
const WRONGS_OF_TEXT = new Map(TABLE.map((row) => [row[2], [row[5], row[6], row[7]]]));
const RIGHT_OF_LABEL = new Map(TABLE.map((row) => [row[3], row[4]]));
const GROUP_OF_LABEL = new Map(TABLE.map((row) => [row[3], `${row[0]}:${row[1]}`]));
const ALL_RIGHT = new Set(TABLE.map((row) => row[4]));
const ALL_WRONG = new Set(TABLE.flatMap((row) => [row[5], row[6], row[7]]));
const SCENE_OF_ACT = new Map(TABLE.flatMap((row, i) => [row[4], row[5], row[6], row[7]].map((act) => [act, i] as const)));

/** [thème, énoncé, étapes] : chaque suite n'a qu'un ordre. */
const SEQ: [string, string, string[]][] = [
  ["route", "Mets ces gestes dans le bon ordre pour traverser la route.", ["Je m'arrête au bord de la route.", "Je regarde à gauche et à droite.", "Je traverse quand la route est libre."]],
  ["route", "Mets ces gestes dans le bon ordre pour monter dans la voiture.", ["Je monte dans la voiture.", "Je m'assois sur le siège.", "J'attache ma ceinture."]],
  ["route", "Mets ces gestes dans le bon ordre pour monter dans le car.", ["J'attends que le car s'arrête.", "Je monte doucement.", "Je m'assois à ma place."]],
  ["reglement", "Mets ces gestes dans le bon ordre pour répondre à une question.", ["Je lève la main.", "Le maître me donne la parole.", "Je donne ma réponse."]],
  ["reglement", "Mets ces gestes dans le bon ordre pour entrer en classe.", ["La cloche sonne.", "Je me mets en rang.", "J'entre en classe."]],
  ["reglement", "Mets ces gestes dans le bon ordre pour saluer le maître.", ["Le maître entre dans la classe.", "Je me lève et je dis bonjour.", "Je m'assois quand le maître le dit."]],
  ["responsabilites", "Mets ces gestes dans le bon ordre pour balayer la classe.", ["Je prends le balai.", "Je balaie la classe.", "Je range le balai."]],
  ["responsabilites", "Mets ces gestes dans le bon ordre pour effacer le tableau.", ["Je prends l'éponge.", "J'efface le tableau.", "Je repose l'éponge."]],
  ["responsabilites", "Mets ces gestes dans le bon ordre pour distribuer les crayons.", ["Je prends la boîte de crayons.", "Je donne un crayon à chaque élève.", "Je range la boîte."]],
  ["genre", "Mets ces gestes dans le bon ordre pour jouer ensemble.", ["Je propose un jeu à mes camarades.", "Mes camarades acceptent.", "Nous jouons tous ensemble."]],
  ["genre", "Mets ces gestes dans le bon ordre pour partager le travail.", ["Nous choisissons les tâches.", "Chacun fait sa part.", "Nous finissons ensemble."]],
  ["genre", "Mets ces gestes dans le bon ordre pour le repas en famille.", ["Ma sœur et moi lavons nos mains.", "Nous mettons la table.", "Nous mangeons en famille."]],
  ["paix", "Mets ces gestes dans le bon ordre pour se réconcilier.", ["Nous nous disputons.", "Nous nous calmons.", "Nous nous réconcilions."]],
  ["paix", "Mets ces gestes dans le bon ordre quand tu es en colère.", ["Je suis en colère.", "Je respire doucement.", "Je parle sans crier."]],
  ["paix", "Mets ces gestes dans le bon ordre pour demander de l'aide.", ["Je vois un conflit.", "Je cherche un adulte.", "Je lui explique ce qui se passe."]],
];

/** [thème, phrase à trou, bon mot, deux mots qui ne vont pas] */
const GAP: [string, string, string, string[]][] = [
  ["route", "Au panneau STOP, la voiture ___.", "s'arrête", ["accélère", "chante"]],
  ["route", "Dans la voiture, j'attache ma ___ de sécurité.", "ceinture", ["chaussure", "casquette"]],
  ["route", "À moto, je mets un ___ sur la tête.", "casque", ["ballon", "seau"]],
  ["route", "Je traverse sur le passage pour ___.", "piétons", ["voitures", "camions"]],
  ["route", "Au passage pour piétons, je regarde avant de ___.", "traverser", ["manger", "dormir"]],
  ["reglement", "En classe, je lève la ___ pour parler.", "main", ["jambe", "chaise"]],
  ["reglement", "Quand le maître parle, je fais ___.", "silence", ["du bruit", "la course"]],
  ["reglement", "Je range mes affaires dans mon ___.", "cartable", ["ballon", "seau"]],
  ["reglement", "À la récréation, je ___ avec mes amis.", "joue", ["dors", "me bats"]],
  ["reglement", "Quand j'ai fait une faute, je dis ___.", "pardon", ["bonjour", "au revoir"]],
  ["responsabilites", "Le ___ de classe aide le maître à garder le calme.", "chef", ["chat", "pain"]],
  ["responsabilites", "Le responsable de la propreté ___ la classe.", "balaie", ["salit", "casse"]],
  ["responsabilites", "Le responsable du matériel range les ___.", "crayons", ["nuages", "oiseaux"]],
  ["responsabilites", "Le lundi matin, on lève le ___.", "drapeau", ["gâteau", "cartable"]],
  ["genre", "À l'école, les filles et les ___ ont les mêmes droits.", "garçons", ["chiens", "arbres"]],
  ["genre", "Filles et garçons peuvent tous ___ au foot.", "jouer", ["manger", "dormir"]],
  ["genre", "Dans une famille, ___ peuvent aider à la maison.", "tous les enfants", ["seulement les filles", "seulement les garçons"]],
  ["genre", "Un garçon peut ___ quand il a du chagrin.", "pleurer", ["aboyer", "briller"]],
  ["genre", "Une fille peut être ___ de classe.", "chef", ["chat", "pain"]],
  ["paix", "Quand je suis en colère, je ___ au lieu de frapper.", "parle", ["pousse", "tape"]],
  ["paix", "Après une dispute, on se ___.", "réconcilie", ["bat", "moque"]],
  ["paix", "Je ne me ___ pas de mon camarade.", "moque", ["lave", "couche"]],
  ["paix", "Si la dispute continue, je demande l'aide d'un ___.", "adulte", ["chat", "ballon"]],
  ["paix", "Pour régler un conflit, on ___ au lieu de se battre.", "discute", ["crie", "frappe"]],
];

const RIGHTS = ["Je peux jouer à la récréation.", "Je peux poser une question au maître.", "Je peux être écouté quand je parle.", "Je peux être protégé à l'école."];
const DUTIES = ["Je dois écouter le maître.", "Je dois respecter mes camarades.", "Je dois ranger mes affaires.", "Je dois arriver à l'heure."];

/** Étiquette courte → tâche (l'association) ; question → nom entier du responsable (le QCM). */
const ROLE_TASK: Record<string, string> = {
  "chef de classe": "garde le calme",
  propreté: "balaie la classe",
  matériel: "range les crayons",
  "lever des couleurs": "lève le drapeau",
};
const ROLE_OF_QUESTION: Record<string, string> = {
  "Qui garde le calme dans la classe ?": "le chef de classe",
  "Qui balaie la classe ?": "le responsable de la propreté",
  "Qui range les crayons ?": "le responsable du matériel",
  "Qui lève le drapeau ?": "le responsable du lever des couleurs",
};
const ROLE_NAMES = Object.values(ROLE_OF_QUESTION);
const PANEL_SAYS: Record<string, string> = {
  STOP: "Il faut s'arrêter.",
  "sens interdit": "On ne peut pas entrer dans la rue.",
  "passage pour piétons": "Les piétons peuvent traverser ici.",
};
const ROAD_WORD: Record<string, string> = {
  "À moto, que dois-tu mettre sur la tête pour te protéger ? Écris le mot.": "casque",
  "Dans une voiture, que dois-tu attacher pour te protéger ? Écris le mot.": "ceinture",
  "Quel panneau te dit de t'arrêter ? Écris le mot.": "stop",
};
const PANEL_WRONG = ["Il faut aller plus vite.", "Il faut jouer au ballon.", "On peut entrer très vite.", "On doit klaxonner fort.", "Les piétons doivent courir loin d'ici.", "Les voitures doivent accélérer ici."];

// ---------------------------------------------------------------------------
// Les vérifications de chaque gabarit : elles recalculent la réponse
// ---------------------------------------------------------------------------

const KINDS = [
  "geste-situation",
  "geste-glisser",
  "geste-intrus",
  "geste-relier",
  "geste-ordre",
  "geste-trou",
  "droit-devoir",
  "role-qui",
  "role-relier",
  "panneau-qcm",
  "route-ecrire",
] as const satisfies readonly GameKind[];

const CHECKS: Record<string, Check> = {
  "geste-situation": (exo) => {
    const text = exo.prompt.replace(/ Que faut-il faire \?$/u, "");
    const right = RIGHT_OF_TEXT.get(text);
    const wrongs = WRONGS_OF_TEXT.get(text) ?? [];
    const others = optionsOf(exo).filter((option) => option !== rightOption(exo));
    return (
      ok(right !== undefined, `situation inconnue : ${text}`) ??
      ok(rightOption(exo) === right, `la bonne option est « ${rightOption(exo)} », la table dit « ${right} »`) ??
      ok(others.length === 2 && others.every((option) => wrongs.includes(option)), `un mauvais choix n'est pas un mauvais geste de cette scène : ${others.join(" | ")}`)
    );
  },
  "geste-glisser": (exo) => {
    if (JSON.stringify(zonesOf(exo)) !== JSON.stringify(["À faire", "À éviter"])) return `cases ${zonesOf(exo).join(" / ")}`;
    for (const item of itemsOf(exo)) {
      const zone = ALL_RIGHT.has(item.text) ? "À faire" : ALL_WRONG.has(item.text) ? "À éviter" : null;
      if (zone !== item.correctZone) return `« ${item.text} » va dans « ${zone} », l'exercice dit « ${item.correctZone} »`;
    }
    const scenes = itemsOf(exo).map((item) => SCENE_OF_ACT.get(item.text));
    const counts = ["À faire", "À éviter"].map((zone) => itemsOf(exo).filter((item) => item.correctZone === zone).length);
    return ok(new Set(scenes).size === scenes.length, "deux gestes de la même scène") ?? ok(counts[0] >= 2 && counts[0] === counts[1], "les deux cases n'ont pas le même nombre de gestes");
  },
  "geste-intrus": (exo) => {
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
  "geste-relier": (exo) => {
    const pairs = pairsOf(exo);
    for (const pair of pairs) if (RIGHT_OF_LABEL.get(pair.left) !== pair.right) return `« ${pair.left} » est relié à « ${pair.right} », la table dit « ${RIGHT_OF_LABEL.get(pair.left)} »`;
    const groups = pairs.map((pair) => GROUP_OF_LABEL.get(pair.left));
    return ok(pairs.length >= 3 && pairs.length <= 4, "nombre de paires") ?? ok(new Set(groups).size === pairs.length, `deux situations du même groupe : ${groups.join(" | ")}`);
  },
  "geste-ordre": (exo) => {
    const seq = SEQ.find((entry) => entry[1] === exo.prompt);
    return ok(seq !== undefined, `suite inconnue : ${exo.prompt}`) ?? ok(JSON.stringify(sequenceOf(exo)) === JSON.stringify(seq![2]), `les étapes disent ${sequenceOf(exo).join(" > ")}`);
  },
  "geste-trou": (exo) => {
    const gap = GAP.find((entry) => entry[1] === textOf(exo));
    return (
      ok(gap !== undefined, `phrase inconnue : ${textOf(exo)}`) ??
      ok(blankOf(exo).answer === gap![2], `la phrase veut « ${gap![2]} », le trou dit « ${blankOf(exo).answer} »`) ??
      ok(same(blankOf(exo).options, [gap![2], ...gap![3]]), `les choix ne sont pas ceux de la table : ${blankOf(exo).options.join(" | ")}`)
    );
  },
  "droit-devoir": (exo) => {
    if (JSON.stringify(zonesOf(exo)) !== JSON.stringify(["Droits", "Devoirs"])) return `cases ${zonesOf(exo).join(" / ")}`;
    for (const item of itemsOf(exo)) {
      const zone = RIGHTS.includes(item.text) ? "Droits" : DUTIES.includes(item.text) ? "Devoirs" : null;
      if (zone !== item.correctZone) return `« ${item.text} » va dans « ${zone} », l'exercice dit « ${item.correctZone} »`;
    }
    const counts = ["Droits", "Devoirs"].map((zone) => itemsOf(exo).filter((item) => item.correctZone === zone).length);
    return ok(counts[0] >= 2 && counts[0] === counts[1], "les deux cases n'ont pas le même nombre de phrases");
  },
  "role-qui": (exo) => {
    const role = ROLE_OF_QUESTION[exo.prompt];
    return ok(role !== undefined, `question inconnue : ${exo.prompt}`) ?? ok(rightOption(exo) === role, `la bonne option est « ${rightOption(exo)} », la table dit « ${role} »`) ?? ok(optionsOf(exo).every((option) => ROLE_NAMES.includes(option)), "un choix n'est pas un responsable");
  },
  "role-relier": (exo) => {
    const pairs = pairsOf(exo);
    for (const pair of pairs) if (ROLE_TASK[pair.left] !== pair.right) return `« ${pair.left} » est relié à « ${pair.right} »`;
    return ok(pairs.length >= 3 && pairs.length <= 4 && new Set(pairs.map((pair) => pair.left)).size === pairs.length, "nombre de paires");
  },
  "panneau-qcm": (exo) => {
    const name = /^Que veut dire le panneau (.+) \?$/u.exec(exo.prompt)?.[1] ?? "";
    const says = PANEL_SAYS[name];
    const others = optionsOf(exo).filter((option) => option !== rightOption(exo));
    return ok(says !== undefined, `panneau inconnu : ${name}`) ?? ok(rightOption(exo) === says, `le panneau ${name} dit « ${says} », la bonne option est « ${rightOption(exo)} »`) ?? ok(others.every((option) => PANEL_WRONG.includes(option)), "un mauvais choix hors de la table");
  },
};

CHECKS["route-ecrire"] = (exo) => {
  const word = ROAD_WORD[exo.prompt];
  const accepted = exo.payload.acceptedAnswers as string[];
  return ok(word !== undefined, `énoncé inconnu : ${exo.prompt}`) ?? ok(JSON.stringify(accepted) === JSON.stringify([word]), `la réponse admise est ${accepted.join(" | ")}, la table dit « ${word} »`) ?? ok(!fold(exo.prompt).includes(fold(word)), "le mot est écrit dans l'énoncé");
};

const TOPICS = ["route", "reglement", "responsabilites", "genre", "paix"];

describe("chaque gabarit du civique du CP a sa vérification", () => {
  it("couvre exactement les onze gabarits", () => {
    expect(Object.keys(CHECKS).sort()).toEqual([...KINDS].sort());
    for (const kind of KINDS) expect(Object.keys(GAME_KINDS), kind).toContain(kind);
  });
});

describe("les gabarits du civique du CP recalculent juste, depuis une table écrite à part", () => {
  for (const kind of KINDS) {
    it(`${kind} : la bonne réponse se lit dans la table, à tous les niveaux et avec chaque thématique`, () => {
      for (const topic of TOPICS) {
        for (const d of draws.filter((_, i) => i % 2 === 0)) {
          const exo = make(kind, topic, d) as unknown as Exo;
          expect(CHECKS[kind](exo), `${kind} ${topic} niveau ${d.level} : ${exo.prompt}`).toBeNull();
        }
      }
    });
  }

  it("sans thématique (vocabulary absent), les scènes de toutes les thématiques servent, justes", () => {
    for (const kind of KINDS) {
      for (const d of draws.filter((_, i) => i % 10 === 0)) {
        const exo = make(kind, undefined, d) as unknown as Exo;
        expect(CHECKS[kind](exo), `${kind} niveau ${d.level} : ${exo.prompt}`).toBeNull();
      }
    }
  });

  it("chaque scène, chaque suite et chaque trou d'une thématique appartient à cette thématique", () => {
    for (const topic of TOPICS) {
      for (const d of draws.filter((_, i) => i % 3 === 0)) {
        const situation = make("geste-situation", topic, d) as unknown as Exo;
        expect(TOPIC_OF_TEXT.get(situation.prompt.replace(/ Que faut-il faire \?$/u, "")), situation.prompt).toBe(topic);
        const order = make("geste-ordre", topic, d) as unknown as Exo;
        expect(SEQ.find((entry) => entry[1] === order.prompt)?.[0], order.prompt).toBe(topic);
        const gap = make("geste-trou", topic, d) as unknown as Exo;
        expect(GAP.find((entry) => entry[1] === textOf(gap))?.[0], textOf(gap)).toBe(topic);
      }
    }
  });
});

describe("la table elle-même est saine", () => {
  it("n'a que des gestes tous différents, et aucun mauvais geste n'est un bon geste", () => {
    const acts = TABLE.flatMap((row) => [row[4], row[5], row[6], row[7]]);
    expect(new Set(acts).size).toBe(acts.length);
    for (const wrong of ALL_WRONG) expect(ALL_RIGHT.has(wrong), wrong).toBe(false);
  });

  it("n'attribue jamais une tâche à un sexe dans un bon geste, et ne range jamais en cases « Filles » et « Garçons »", () => {
    for (const right of ALL_RIGHT) expect(right, right).not.toMatch(/\b(seul|seule|seuls|seules)\b/iu);
    for (const d of draws.filter((_, i) => i % 4 === 0)) {
      const sort = make("geste-glisser", "genre", d) as unknown as Exo;
      expect(zonesOf(sort)).toEqual(["À faire", "À éviter"]);
    }
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
      for (const d of draws.filter((_, i) => i % 6 === 0)) {
        const exo = make(kind, "route", d) as unknown as Exo;
        const broken = mutate(kind, exo);
        if (!broken) continue;
        mutated += 1;
        expect(CHECKS[kind](broken), `${kind} niveau ${d.level} : ${exo.prompt}`).not.toBeNull();
      }
      expect(mutated, kind).toBeGreaterThan(0);
    });
  }
});

// ===========================================================================
// LES RÈGLES COMMUNES
// ===========================================================================

describe("tous les gabarits du civique du CP", () => {
  const exos = KINDS.flatMap((kind) => TOPICS.flatMap((topic) => draws.filter((_, i) => i % 3 === 0).map((d) => ({ kind, topic, exo: make(kind, topic, d) as unknown as Exo }))));

  const texts = (exo: Exo): string[] => {
    const out = [exo.prompt, ...exo.hints];
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
      if (exo.payload.acceptedAnswers) answers.push(...(exo.payload.acceptedAnswers as string[]));
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
      const a = GAME_KINDS[kind].make(makeContext("CP", 2, "graine", undefined, "paix"));
      const b = GAME_KINDS[kind].make(makeContext("CP", 2, "graine", undefined, "paix"));
      expect(a).toEqual(b);
      expect(a.hints).toHaveLength(3);
      expect(new Set(a.hints).size, kind).toBe(3);
    }
  });

  it("passent le contrôleur de l'instruction civique au CP sans aucun défaut, à tous les niveaux", () => {
    for (const { kind, exo } of exos) {
      const defects = auditExercise({
        type: GAME_KINDS[kind].type,
        prompt: exo.prompt,
        payload: exo.payload,
        answerKey: exo.answerKey,
        hints: exo.hints,
        class: "CP",
        subject: "Instruction civique",
      });
      expect(defects, `${kind} : ${exo.prompt}`).toEqual([]);
    }
  });
});

// ===========================================================================
// LES THÉMATIQUES DU PROGRAMME
// ===========================================================================

describe("les cinq thématiques d'instruction civique du CP", () => {
  const KEYS = ["ci-cp-route", "ci-cp-reglement", "ci-cp-responsabilites", "ci-cp-genre", "ci-cp-paix"];
  const LOT1_KEYS = ["hi-cp-calendrier", "hi-cp-durees", "hi-cp-frequences", "hi-cp-emploi-du-temps", "ge-cp-itineraire", "ge-cp-distances", "ge-cp-plan", "ge-cp-quartier"];
  const LOT2_KEYS = ["an-cp-family", "an-cp-body", "an-cp-classroom", "an-cp-numbers-20", "an-cp-food", "fr-cp-lecture", "fr-cp-ecrire"];
  const LOT3_KEYS = ["fr-cp-consignes", "fr-cp-decrire", "fr-cp-raconter", "fr-cp-inviter", "ar-cp-melanges", "ar-cp-traits", "ar-cp-decorer", "ar-cp-rythmes"];
  const entryOf = (key: string) => allProgrammeEntries().find((e) => e.topic.key === key)!;
  const topicOf = (key: string) => entryOf(key).topic;

  it("remplissent les dix places du palier, avec des jeux connus, sans appeler le modèle", () => {
    for (const key of KEYS) {
      const specs = topicOf(key).games ?? [];
      expect(
        specs.reduce((sum, spec) => sum + spec.count, 0),
        key,
      ).toBe(PALIER_SIZE);
      for (const spec of specs) {
        expect(Object.keys(GAME_KINDS), `${key} : ${spec.kind}`).toContain(spec.kind);
        // Chaque jeu de gestes porte sa thématique : c'est elle qui choisit les scènes.
        if ((KINDS as readonly string[]).includes(spec.kind)) expect(spec.vocabulary, `${key} : ${spec.kind}`).toBe(key.replace("ci-cp-", ""));
      }
      expect(topicUsesModel(key), key).toBe(false);
    }
  });

  it("sont, avec les vingt-trois des trois premiers lots, les seules thématiques du CP entièrement faites par le code", () => {
    const allCode = allProgrammeEntries()
      .filter((e) => e.klass === "CP" && (e.topic.games ?? []).reduce((sum, spec) => sum + spec.count, 0) >= PALIER_SIZE)
      .map((e) => e.topic.key);
    expect(allCode.sort()).toEqual([...LOT1_KEYS, ...LOT2_KEYS, ...LOT3_KEYS, ...KEYS].sort());
  });

  it("sont celles du CP, et n'ont changé ni leur clé ni leur nombre de paliers", () => {
    for (const key of KEYS) {
      expect(entryOf(key).klass, key).toBe("CP");
      expect(topicOf(key).palierCount, key).toBeUndefined();
    }
  });

  it("fabriquent des paliers entiers, de dix exercices tous différents, qui passent le contrôleur", () => {
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
              subject: "Instruction civique",
            });
            expect(defects, `${key} palier ${palierIndex} : ${game.prompt}`).toEqual([]);
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
