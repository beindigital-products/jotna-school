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
 * L'INSTRUCTION CIVIQUE ET LES ARTS DU CE1 : les symboles de la Nation, le civisme, respecter les autorités, nos différences ; dessiner,
 * plier, les instruments du Sénégal, les sons, les mimes.
 *
 * Chaque test RECALCULE la bonne réponse depuis l'énoncé et les tuiles, avec ses propres tables écrites à part : les couleurs du drapeau, ce
 * que fait chaque autorité, le sentiment de chaque posture, la façon de jouer de chaque instrument. Un gabarit dont la réponse contredit sa
 * table échoue. À la fin, des MUTATIONS : on abîme la bonne réponse d'un exercice juste, et chaque vérification doit le voir. Sur l'échantillon
 * de CE1 lu le 21 octobre 2026, 20 exercices sur 54 étaient faux en civique et en arts (un ordre « d'importance » des symboles, « Wolof :
 * langue » et « Peul : ethnie » dans une même question, un visage triste pour la peur, un triangle moins aigu qu'une flûte).
 */

const LEVELS: GameLevel[] = [1, 2, 3, 4];
const draws = LEVELS.flatMap((level) => Array.from({ length: 60 }, (_, n) => ({ level, seed: `ce1ca:${level}:${n}` })));
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
const apostrophes = (text: string) => (text.match(/'/g) ?? []).length;
const wordCount = (text: string) => text.split(/\s+/).filter((token) => /[\p{L}\p{N}]/u.test(token)).length;
const same = (a: readonly string[], b: readonly string[]) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());
const sameSeq = (a: readonly string[], b: readonly string[]) => JSON.stringify(a) === JSON.stringify(b);

type Check = (exo: Exo) => string | null;
const ok = (condition: boolean, message: string) => (condition ? null : message);
const all = (...results: (string | null)[]) => results.find((result) => result !== null) ?? null;
const wrongOf = (exo: Exo) => optionsOf(exo).filter((option) => option !== rightOption(exo));

/** Une question à trois choix : [question, bonne réponse, ce qui ne doit JAMAIS figurer parmi les mauvais choix]. */
type QRow = readonly [string, string, (readonly string[])?];
const checkQuestions =
  (table: readonly QRow[]): Check =>
  (exo) => {
    const row = table.find((entry) => entry[0] === exo.prompt);
    if (!row) return `question inconnue : ${exo.prompt}`;
    const banned = [row[1], ...(row[2] ?? [])];
    return all(
      ok(rightOption(exo) === row[1], `la bonne option est « ${rightOption(exo)} », la table dit « ${row[1]} »`),
      ok(wrongOf(exo).length === 2, `mauvais choix : ${wrongOf(exo).join(" | ")}`),
      ok(wrongOf(exo).every((option) => !banned.includes(option)), `un mauvais choix est juste aussi : ${wrongOf(exo).join(" | ")}`),
    );
  };
/** Une phrase à trou : [phrase, mot qui la complète, mots qui ne la complètent pas]. */
type GRow = readonly [string, string, readonly string[]];
const checkGaps =
  (table: readonly GRow[]): Check =>
  (exo) => {
    const row = table.find((entry) => entry[0] === textOf(exo));
    if (!row) return `phrase inconnue : ${textOf(exo)}`;
    return all(
      ok(blankOf(exo).answer === row[1], `la phrase veut « ${row[1]} », le trou dit « ${blankOf(exo).answer} »`),
      ok(same(blankOf(exo).options, [row[1], ...row[2]]), `les choix : ${blankOf(exo).options.join(" | ")}`),
    );
  };
const checkLinks =
  (table: Record<string, string>): Check =>
  (exo) => {
    for (const pair of pairsOf(exo)) if (table[pair.left] !== pair.right) return `« ${pair.left} » est relié à « ${pair.right} », la table dit « ${table[pair.left]} »`;
    return ok(pairsOf(exo).length === 3, "trois paires");
  };
/** Un glissé : chaque étiquette est dans la case que la table lui donne ; les cases sont celles de la table, toutes deux servies. */
const checkSort =
  (zones: readonly [string, string], zoneOf: Record<string, string>): Check =>
  (exo) => {
    for (const item of itemsOf(exo)) if (zoneOf[item.text] !== item.correctZone) return `« ${item.text} » est rangé dans « ${item.correctZone} », la table dit « ${zoneOf[item.text]} »`;
    return all(
      ok(same(zonesOf(exo), zones), `cases ${zonesOf(exo).join(" | ")}`),
      ok(zones.every((zone) => itemsOf(exo).some((item) => item.correctZone === zone)), "chaque case reçoit au moins une étiquette"),
      ok(itemsOf(exo).length >= 4 && itemsOf(exo).length <= 5, `${itemsOf(exo).length} étiquettes`),
    );
  };
const checkSteps =
  (table: readonly (readonly [string, readonly string[]])[]): Check =>
  (exo) => {
    const row = table.find((entry) => entry[0] === exo.prompt && sameSeq(entry[1], sequenceOf(exo)));
    return ok(!!row, `suite inconnue : ${exo.prompt} → ${sequenceOf(exo).join(" > ")}`);
  };
/** Une réponse à écrire : [énoncé, mot juste, toutes les écritures admises]. Le mot juste est la première écriture admise et la clé. */
type WRow = readonly [string, string, readonly string[]];
const checkWrite =
  (table: readonly WRow[]): Check =>
  (exo) => {
    const row = table.find((entry) => entry[0] === exo.prompt);
    if (!row) return `énoncé inconnu : ${exo.prompt}`;
    return all(
      ok(acceptedOf(exo)[0] === row[1] && exo.answerKey === row[1], `le mot juste est « ${row[1]} », le gabarit dit « ${acceptedOf(exo)[0]} » (clé « ${exo.answerKey} »)`),
      ok(acceptedOf(exo).every((accepted) => row[2].includes(accepted)), `une écriture admise n'est pas dans la table : ${acceptedOf(exo).join(" | ")}`),
    );
  };

// ===========================================================================
// LES SYMBOLES DE LA NATION : les tables
// ===========================================================================

const SYMBOL_Q: readonly QRow[] = [
  ["Quelle couleur est au milieu du drapeau du Sénégal ?", "Or", ["Vert", "Rouge"]],
  ["Quelle couleur est l'étoile du drapeau ?", "Verte", ["Vert"]],
  ["Combien de branches a l'étoile du drapeau ?", "Cinq"],
  ["Quel est le titre de l'hymne national ?", "Le Lion rouge"],
  ["Quel arbre est sur les armoiries ?", "Baobab"],
  ["Quel animal est sur les armoiries ?", "Lion"],
  ["Quel symbole se chante ?", "Hymne"],
  ["Quel symbole flotte au vent au bout d'un mât ?", "Drapeau"],
  ["Qui a écrit les paroles de l'hymne national ?", "Léopold Sédar Senghor"],
  ["Combien de couleurs a le drapeau du Sénégal ?", "Trois"],
  ["Quelle phrase est la devise du Sénégal ?", "Un Peuple – Un But – Une Foi"],
  ["Quelle couleur est la première bande du drapeau, à gauche ?", "Vert"],
  ["Quelle couleur est la dernière bande du drapeau, à droite ?", "Rouge"],
];
const SYMBOL_NAME_Q: readonly QRow[] = [
  ["Quel symbole a trois bandes de couleurs et une étoile ?", "Drapeau"],
  ["Quel symbole est une phrase qui résume ce que veut le pays ?", "Devise"],
  ["Quel symbole est une chanson que l'on écoute debout ?", "Hymne"],
  ["Quel symbole montre un lion et un baobab ?", "Armoiries"],
  ["Quel symbole a des paroles et une musique ?", "Hymne"],
  ["Quel symbole se hisse sur un mât ?", "Drapeau"],
];
const FLAG_TILES = ["Vert", "Or", "Rouge", "Étoile"];
const ARMS_TILES = ["Lion", "Baobab"];
const SYMBOL_ZONES: readonly [string, string] = ["Sur le drapeau", "Sur les armoiries"];
const MOTTO = ["Peuple", "But", "Foi"];
const MOTTO_STEPS_T: readonly (readonly [string, readonly string[]])[] = [
  ["Range les trois parties de la devise du Sénégal, de la première à la dernière.", MOTTO],
  ["Range les trois parties de la devise du Sénégal, de la dernière à la première.", [...MOTTO].reverse()],
  ["Range ces trois parties de la devise du Sénégal, dans l'ordre où on les dit.", MOTTO],
  ["Range ces trois parties de la devise du Sénégal, en partant de la fin.", [...MOTTO].reverse()],
];
const SYMBOL_LINK_T: Record<string, string> = {
  Drapeau: "Trois bandes et une étoile",
  Devise: "Une phrase en trois parties",
  Hymne: "Un chant aux paroles de Senghor",
  Armoiries: "Un lion et un baobab",
  Étoile: "Elle a cinq branches",
};
const SYMBOL_GAP_T: readonly GRow[] = [
  ["Le drapeau du Sénégal est vert, or et ___.", "rouge", ["bleu", "noir"]],
  ["L'étoile du drapeau est ___.", "verte", ["rouge", "bleue"]],
  ["Le titre de l'hymne national est « Le Lion ___ ».", "rouge", ["vert", "bleu"]],
  ["L'étoile du drapeau a ___ branches.", "cinq", ["trois", "sept"]],
  ["La devise du Sénégal commence par « Un ___ ».", "Peuple", ["Roi", "Chant"]],
  ["Les armoiries montrent un lion et un ___.", "baobab", ["manguier", "cocotier"]],
  ["L'hymne national est un chant dont les paroles sont de Léopold Sédar ___.", "Senghor", ["Diop", "Sembène"]],
  ["Le ___ est hissé en haut d'un mât.", "drapeau", ["hymne", "devise"]],
  ["On chante l'___ national.", "hymne", ["armoiries", "étoile"]],
];
const SYMBOL_WRITE_T: readonly WRow[] = [
  ["Combien de branches a l'étoile du drapeau ? Écris le nombre.", "5", ["5", "cinq"]],
  ["Combien de couleurs a le drapeau du Sénégal ? Écris le nombre.", "3", ["3", "trois"]],
  ["Quel arbre est sur les armoiries ? Écris le mot.", "baobab", ["baobab", "le baobab", "un baobab"]],
  ["Quel animal est sur les armoiries ? Écris le mot.", "lion", ["lion", "le lion", "un lion"]],
  ["De quelle couleur est l'étoile du drapeau ? Écris le mot.", "verte", ["verte", "vert", "une étoile verte"]],
  ["Quel symbole se chante ? Écris le mot.", "hymne", ["hymne", "l'hymne", "un hymne"]],
];

// ===========================================================================
// LE CIVISME : les tables
// ===========================================================================

const CIVIC_SITUATION_Q: readonly QRow[] = [
  ["Tu vois un robinet ouvert dans la cour. Que fais-tu ?", "Je le ferme"],
  ["Tu as fini de boire à la borne-fontaine. Que fais-tu ?", "Je ferme le robinet"],
  ["Tu es le dernier à quitter la classe et la lampe est allumée. Que fais-tu ?", "J'éteins la lumière"],
  ["Tu vois un papier par terre dans la cour. Que fais-tu ?", "Je le jette à la poubelle"],
  ["Tu manges une mangue dans la rue. Que fais-tu de la peau ?", "Je la mets dans une poubelle"],
  ["Un ami veut casser une branche d'un arbre. Que fais-tu ?", "Je lui dis de ne pas le faire"],
  ["Un camarade écrit sur le mur de l'école. Que fais-tu ?", "Je lui dis d'arrêter"],
  ["Tu vois un jeune arbre qui manque d'eau. Que fais-tu ?", "Je l'arrose"],
  ["Tu te laves les mains. Que fais-tu du robinet pendant que tu savonnes ?", "Je le ferme"],
  ["La rue devant l'école est sale. Que peux-tu faire ?", "Ramasser les déchets"],
  ["Tu vois une borne-fontaine qui fuit. Que fais-tu ?", "Je préviens un adulte"],
  ["Tu joues dans la rue. Où mets-tu l'emballage de ton biscuit ?", "Dans une poubelle"],
  ["Tu utilises un banc de l'école. Comment en prendre soin ?", "Je ne le salis pas"],
];
const CIVIC_WHY_Q: readonly QRow[] = [
  ["Pourquoi éteint-on la lumière en sortant ?", "Pour ne pas gaspiller le courant"],
  ["Pourquoi ne casse-t-on pas les branches d'un arbre ?", "Parce qu'il est vivant"],
  ["Pourquoi garde-t-on la rue propre ?", "Pour que chacun s'y sente bien"],
  ["Pourquoi respecte-t-on les bornes-fontaines ?", "Elles servent à tout le monde"],
  ["Pourquoi respecte-t-on l'école ?", "Elle sert à tous les élèves"],
  ["Pourquoi ferme-t-on le robinet quand on a fini ?", "Pour ne pas gaspiller l'eau"],
];
const CIVIC_ZONES: readonly [string, string] = ["Protège le bien commun", "Abîme le bien commun"];
const CIVIC_SORT_T: Record<string, string> = {
  "Ramasser un papier": CIVIC_ZONES[0],
  "Fermer le robinet": CIVIC_ZONES[0],
  "Éteindre la lampe": CIVIC_ZONES[0],
  "Arroser un arbre": CIVIC_ZONES[0],
  "Jeter à la poubelle": CIVIC_ZONES[0],
  "Casser une branche": CIVIC_ZONES[1],
  "Écrire sur un mur": CIVIC_ZONES[1],
  "Gaspiller l'eau": CIVIC_ZONES[1],
  "Jeter un papier par terre": CIVIC_ZONES[1],
  "Laisser la lampe allumée": CIVIC_ZONES[1],
};
const CIVIC_LINK_T: Record<string, string> = {
  "Mur de l'école": "Je n'écris pas dessus",
  Poubelle: "J'y jette mes papiers",
  Arbre: "Je ne casse pas ses branches",
  "Borne-fontaine": "Je ferme le robinet après avoir bu",
  Lampe: "J'éteins quand je sors",
};
const CIVIC_STEPS_T: readonly (readonly [string, readonly string[]])[] = [
  ["Pour garder la rue propre, mets ces gestes du premier au dernier.", ["Je vois un papier", "Je le ramasse", "Je le jette à la poubelle"]],
  ["Pour garder la rue propre, mets ces gestes du premier au dernier.", ["Je me promène dans la rue", "Je vois un papier", "Je le ramasse", "Je le jette à la poubelle"]],
  ["Pour ne pas gaspiller l'eau, mets ces gestes du premier au dernier.", ["J'ouvre le robinet", "Je me lave les mains", "Je ferme le robinet"]],
  ["Pour ne pas gaspiller l'eau, mets ces gestes du premier au dernier.", ["Je prends mon seau", "J'ouvre le robinet", "Je remplis mon seau", "Je ferme le robinet"]],
  ["Pour quitter la classe, mets ces gestes du premier au dernier.", ["Je range mes affaires", "J'éteins la lampe", "Je ferme la porte"]],
  ["Pour quitter la classe, mets ces gestes du premier au dernier.", ["Je range mes affaires", "Je pousse ma chaise", "J'éteins la lampe", "Je ferme la porte"]],
  ["Pour arroser un arbre, mets ces gestes du premier au dernier.", ["Je remplis un seau d'eau", "Je porte le seau à l'arbre", "Je verse l'eau au pied"]],
  ["Pour arroser un arbre, mets ces gestes du premier au dernier.", ["Je prends un seau", "Je remplis le seau d'eau", "Je porte le seau à l'arbre", "Je verse l'eau au pied"]],
];
const CIVIC_GAP_T: readonly GRow[] = [
  ["On ferme le ___ pour ne pas gaspiller l'eau.", "robinet", ["balai", "cartable"]],
  ["On jette les papiers à la ___.", "poubelle", ["fenêtre", "table"]],
  ["On éteint la ___ en sortant de la classe.", "lumière", ["porte", "chaise"]],
  ["On ne casse pas les ___ des arbres.", "branches", ["livres", "bancs"]],
  ["L'école est un bien qui sert à tous les ___.", "élèves", ["chats", "oiseaux"]],
  ["On n'écrit pas sur les ___ de l'école.", "murs", ["nuages", "vents"]],
  ["Une rue propre est une rue sans ___.", "déchets", ["arbres", "maisons"]],
  ["On arrose un jeune arbre avec de l'___.", "eau", ["encre", "huile"]],
  ["Une eau qui coule pour rien est une eau ___.", "gaspillée", ["bue", "claire"]],
];
const CIVIC_WRITE_T: readonly WRow[] = [
  ["Que ferme-t-on après avoir bu à la borne-fontaine ? Écris le mot.", "robinet", ["robinet", "le robinet", "un robinet"]],
  ["Où jette-t-on un papier dans la rue ? Écris le mot.", "poubelle", ["poubelle", "la poubelle", "une poubelle"]],
  ["Que fait-on pour donner à boire à un arbre ? Écris le verbe.", "arroser", ["arroser", "l'arroser", "arrose"]],
  ["Quel objet éteint-on en sortant d'une classe vide ? Écris le mot.", "lumière", ["lumière", "la lumière", "une lumière", "lampe", "ampoule"]],
];

// ===========================================================================
// RESPECTER LES AUTORITÉS : les tables
// ===========================================================================

const AUTHORITY_WHO_Q: readonly QRow[] = [
  ["Qui dirige la commune ?", "Maire"],
  ["Qui travaille à la mairie ?", "Maire"],
  ["Qui prend les décisions importantes pour un village ?", "Chef de village"],
  ["Qui dirige tout un village, avec sagesse ?", "Chef de village"],
  ["Qui dirige l'école ?", "Directeur d'école"],
  ["Qui est responsable de tous les élèves de l'école ?", "Directeur d'école"],
  ["Qui éteint les incendies ?", "Sapeur-pompier"],
  ["Qui vient quand une maison brûle ?", "Sapeur-pompier"],
  ["Qui protège les gens et fait respecter la loi ?", "Policier", ["Gendarme"]],
  ["Qui, comme le gendarme, protège les gens et fait respecter la loi ?", "Policier", ["Gendarme"]],
  ["Qui, comme le policier, protège les gens et fait respecter la loi ?", "Gendarme", ["Policier"]],
  ["Qui, avec le policier, fait partie des forces de l'ordre ?", "Gendarme", ["Policier"]],
];
const AUTHORITY_ROLE_Q: readonly QRow[] = [
  ["Que fait le maire ?", "Il dirige la commune"],
  ["Que fait le chef de village ?", "Il dirige le village"],
  ["Que fait le directeur d'école ?", "Il dirige l'école"],
  ["Que fait le sapeur-pompier ?", "Il éteint les incendies"],
  ["Que fait le policier ?", "Il protège les gens"],
  ["Que fait le gendarme ?", "Il protège les gens"],
];
const AUTHORITY_ZONES: readonly [string, string] = ["Dirige un lieu", "Protège et secourt"];
const AUTHORITY_SORT_T: Record<string, string> = {
  Maire: AUTHORITY_ZONES[0],
  "Chef de village": AUTHORITY_ZONES[0],
  "Directeur d'école": AUTHORITY_ZONES[0],
  Policier: AUTHORITY_ZONES[1],
  Gendarme: AUTHORITY_ZONES[1],
  "Sapeur-pompier": AUTHORITY_ZONES[1],
};
const AUTHORITY_LINK_T: Record<string, string> = {
  Maire: "Il dirige la commune",
  "Chef de village": "Il dirige le village",
  "Directeur d'école": "Il dirige l'école",
  "Sapeur-pompier": "Il éteint les incendies",
  Policier: "Il protège les gens et fait respecter la loi",
};
const AUTHORITY_STEPS_T: readonly (readonly [string, readonly string[]])[] = [
  ["Il y a un incendie. Mets ces faits du premier au dernier.", ["Un feu se déclare", "Un adulte appelle les secours", "Les sapeurs-pompiers éteignent le feu"]],
  ["Il y a un incendie. Mets ces faits du premier au dernier.", ["Un feu se déclare", "On s'éloigne du feu", "Un adulte appelle les secours", "Les sapeurs-pompiers éteignent le feu"]],
  ["Une personne est blessée. Mets ces gestes du premier au dernier.", ["Je préviens un adulte", "Les secours arrivent", "La personne est soignée"]],
  ["Une personne est blessée. Mets ces gestes du premier au dernier.", ["Une personne tombe", "Je préviens un adulte", "Les secours arrivent", "La personne est soignée"]],
  ["Tu es perdu dans la rue. Mets ces gestes du premier au dernier.", ["Je reste calme", "Je cherche un policier", "Il m'aide à retrouver ma famille"]],
  ["Tu es perdu dans la rue. Mets ces gestes du premier au dernier.", ["Je me rends compte que je suis perdu", "Je reste calme", "Je cherche un policier", "Il m'aide à retrouver ma famille"]],
];
const AUTHORITY_GAP_T: readonly GRow[] = [
  ["Le ___ dirige la commune.", "maire", ["pompier", "gendarme"]],
  ["Le ___ dirige l'école.", "directeur", ["maire", "policier"]],
  ["Le chef de ___ dirige le village.", "village", ["rue", "classe"]],
  ["Le sapeur-pompier éteint les ___.", "incendies", ["fruits", "chants"]],
  ["Le policier protège les ___.", "gens", ["livres", "tambours"]],
  ["La commune est dirigée par le ___.", "maire", ["directeur", "pompier"]],
  ["Le directeur est le chef de l'___.", "école", ["village", "commune"]],
  ["Le gendarme et le policier font partie des forces de l'___.", "ordre", ["école", "village"]],
  ["Le sapeur-pompier fait partie des forces de ___.", "secours", ["jeux", "classe"]],
];
const AUTHORITY_WRITE_T: readonly WRow[] = [
  ["Qui dirige la commune ? Écris le mot.", "maire", ["maire", "le maire", "la maire"]],
  ["Qui éteint les incendies ? Écris le mot.", "pompier", ["pompier", "sapeur-pompier", "un pompier", "le pompier", "le sapeur-pompier"]],
  ["Qui dirige l'école ? Écris le mot.", "directeur", ["directeur", "le directeur", "la directrice", "directrice"]],
  ["Qui dirige un village ? Écris le mot.", "chef", ["chef", "le chef", "chef de village", "le chef de village"]],
];

// ===========================================================================
// NOS DIFFÉRENCES, NOTRE RICHESSE : les tables
// ===========================================================================

const DIFF_SITUATION_Q: readonly QRow[] = [
  ["Un nouvel élève arrive et ne connaît personne. Que fais-tu ?", "Je lui dis bonjour"],
  ["Un camarade parle une autre langue à la maison. Que fais-tu ?", "Je lui demande un mot"],
  ["Un ami prie d'une autre façon que toi. Que fais-tu ?", "Je le respecte"],
  ["Un camarade se déplace en fauteuil roulant. Que fais-tu à la récréation ?", "Je l'invite à jouer"],
  ["Un enfant a un accent différent du tien. Que fais-tu ?", "Je l'écoute avec attention"],
  ["Deux amis parlent des langues différentes. Que peuvent-ils faire ?", "S'apprendre des mots"],
  ["Une camarade porte de grosses lunettes. Que fais-tu ?", "Je joue avec elle"],
  ["Un élève ne voit pas bien le tableau. Comment peux-tu l'aider ?", "Je lui lis ce qui est écrit"],
  ["Un enfant fête une autre fête que toi. Que fais-tu ?", "Je lui souhaite une bonne fête"],
  ["Un camarade est plus lent que les autres pour courir. Que fais-tu ?", "Je l'encourage"],
  ["Tu entends une chanson dans une langue que tu ne connais pas. Que fais-tu ?", "J'écoute avec curiosité"],
  ["Un nouvel élève vient d'un autre village. Que fais-tu ?", "Je lui montre l'école"],
  ["Un camarade entend mal. Que fais-tu pour lui parler ?", "Je le regarde et je parle clairement"],
];
const DIFF_FACT_Q: readonly QRow[] = [
  ["Que veut dire respecter les différences ?", "Accepter chacun comme il est"],
  ["Que fait le cousinage à plaisanterie ?", "Il rapproche les familles par le rire"],
  ["Au Sénégal, combien de langues parle-t-on ?", "Plusieurs langues"],
  ["Pourquoi les différences sont-elles une richesse ?", "On apprend les uns des autres"],
  ["Que fait-on avec un cousin à plaisanterie ?", "On se taquine pour rire"],
  ["Que peut-on apprendre d'un ami qui parle une autre langue ?", "De nouveaux mots"],
];
const DIFF_ZONES: readonly [string, string] = ["Respecte les autres", "Ne respecte pas"];
const DIFF_SORT_T: Record<string, string> = {
  "Écouter un ami": DIFF_ZONES[0],
  "Inviter un camarade": DIFF_ZONES[0],
  "Dire bonjour": DIFF_ZONES[0],
  "Apprendre un mot": DIFF_ZONES[0],
  "Partager son goûter": DIFF_ZONES[0],
  "Se moquer d'un ami": DIFF_ZONES[1],
  "Dire que c'est nul": DIFF_ZONES[1],
  "Laisser un enfant seul": DIFF_ZONES[1],
  "Refuser de jouer": DIFF_ZONES[1],
  "Imiter pour blesser": DIFF_ZONES[1],
};
const DIFF_LINK_T: Record<string, string> = {
  Langue: "Ce que l'on parle pour se comprendre",
  Religion: "Ce que l'on croit et que l'on pratique",
  "Cousinage à plaisanterie": "Des familles qui se taquinent pour rire",
  Différence: "Ce qui n'est pas pareil chez chacun",
  Respect: "Accepter l'autre comme il est",
};
const DIFF_STEPS_T: readonly (readonly [string, readonly string[]])[] = [
  ["Un nouvel élève arrive. Mets ces gestes du premier au dernier.", ["Je lui dis bonjour", "Je lui demande son prénom", "Nous jouons ensemble"]],
  ["Un nouvel élève arrive. Mets ces gestes du premier au dernier.", ["Je le vois seul dans la cour", "Je lui dis bonjour", "Je lui demande son prénom", "Nous jouons ensemble"]],
  ["Tu découvres une chanson dans une autre langue. Mets ces gestes du premier au dernier.", ["J'écoute la chanson", "Je demande le sens des mots", "Je chante avec mon ami"]],
  ["Tu découvres une chanson dans une autre langue. Mets ces gestes du premier au dernier.", ["Mon ami met une chanson", "J'écoute la chanson", "Je demande le sens des mots", "Je chante avec mon ami"]],
  ["Un camarade te dit un mot d'une autre langue. Mets ces gestes du premier au dernier.", ["Il me dit le mot", "Je répète le mot", "Je retiens le mot"]],
  ["Un camarade te dit un mot d'une autre langue. Mets ces gestes du premier au dernier.", ["Je lui demande un mot", "Il me dit le mot", "Je répète le mot", "Je retiens le mot"]],
];
const DIFF_GAP_T: readonly GRow[] = [
  ["Au Sénégal, on parle plusieurs ___.", "langues", ["fruits", "saisons"]],
  ["Le ___ à plaisanterie rapproche les familles par le rire.", "cousinage", ["mariage", "voyage"]],
  ["On ne se moque pas des ___ des autres.", "différences", ["chaussures", "cartables"]],
  ["Un camarade en fauteuil roulant peut ___ avec nous.", "jouer", ["voler", "disparaître"]],
  ["Chaque enfant est ___ des autres.", "différent", ["pareil", "identique"]],
  ["On respecte la religion de ses ___.", "camarades", ["chaussures", "cartables"]],
  ["Quand un ami est différent, je l'___ pour jouer.", "invite", ["évite", "oublie"]],
  ["Les différences sont une ___ pour le pays.", "richesse", ["peur", "dispute"]],
  ["Pour se comprendre, deux amis peuvent s'apprendre des ___.", "mots", ["dents", "nuages"]],
];
const DIFF_WRITE_T: readonly WRow[] = [
  ["Que doit-on faire des différences des autres ? Écris le verbe.", "respecter", ["respecter", "les respecter", "accepter"]],
  ["Au Sénégal, on parle plusieurs, quoi ? Écris le mot.", "langues", ["langues", "les langues"]],
  ["Quel mot dit que chaque enfant n'est pas pareil ? Écris le mot.", "différent", ["différent", "différente", "différents"]],
  ["Comment s'appelle ce qui rapproche des familles par le rire ? Écris le mot.", "cousinage", ["cousinage", "le cousinage", "cousinage à plaisanterie", "le cousinage à plaisanterie"]],
];

// ===========================================================================
// DESSINER, PLIER : les tables
// ===========================================================================

const DRAW_TOOL_Q: readonly QRow[] = [
  ["Quel outil aide à tracer une ligne droite ?", "Règle"],
  ["Quel outil sert à effacer un trait ?", "Gomme"],
  ["Quel outil sert à dessiner un trait ?", "Crayon"],
  ["Quel outil sert à colorier un dessin ?", "Crayons de couleur"],
  ["À quoi sert la gomme ?", "À effacer"],
  ["À quoi sert la règle ?", "À tracer"],
];
const DRAW_LINK_T: Record<string, string> = {
  Crayon: "Dessiner un trait",
  Gomme: "Effacer",
  Règle: "Tracer une ligne droite",
  "Crayons de couleur": "Colorier",
  Feuille: "Recevoir le dessin",
};
const DRAW_STEPS_T: readonly (readonly [string, readonly string[]])[] = [
  ["Pour dessiner une maison, mets ces gestes du premier au dernier.", ["Je dessine un carré", "J'ajoute un toit", "Je colorie la maison"]],
  ["Pour dessiner une maison, mets ces gestes du premier au dernier.", ["Je prends un crayon", "Je dessine un carré", "J'ajoute un toit", "Je colorie la maison"]],
  ["Pour dessiner un arbre, mets ces gestes du premier au dernier.", ["Je dessine le tronc", "J'ajoute les branches", "Je colorie les feuilles"]],
  ["Pour dessiner un arbre, mets ces gestes du premier au dernier.", ["Je prends un crayon", "Je dessine le tronc", "J'ajoute les branches", "Je colorie les feuilles"]],
  ["Pour tracer une ligne droite, mets ces gestes du premier au dernier.", ["Je pose la règle", "Je tiens la règle", "Je trace le trait"]],
  ["Pour tracer une ligne droite, mets ces gestes du premier au dernier.", ["Je prends un crayon", "Je pose la règle", "Je tiens la règle", "Je trace le trait"]],
];
const DRAW_GAP_T: readonly GRow[] = [
  ["Pour effacer un trait, j'utilise une ___.", "gomme", ["règle", "feuille"]],
  ["Pour tracer une ligne droite, j'utilise une ___.", "règle", ["gomme", "brosse"]],
  ["Pour colorier, j'utilise des crayons de ___.", "couleur", ["pluie", "nuit"]],
  ["Pour dessiner, je prends un ___.", "crayon", ["ballon", "seau"]],
  ["Je dessine sur une ___ de papier.", "feuille", ["bouteille", "chaise"]],
];
const FOLD_TOOL_Q: readonly QRow[] = [
  ["Quel outil sert à découper du papier ?", "Ciseaux"],
  ["Qu'est-ce qui sert à coller deux morceaux de papier ?", "Colle"],
  ["Avec quoi peut-on modeler un petit objet ?", "Argile"],
  ["À quoi servent les ciseaux ?", "À découper"],
  ["À quoi sert la colle ?", "À coller"],
  ["À quoi sert l'argile ?", "À modeler"],
];
const FOLD_LINK_T: Record<string, string> = {
  Ciseaux: "Découper le papier",
  Colle: "Fixer deux morceaux",
  Argile: "Modeler un objet",
  Papier: "Se plie et se découpe",
  Pli: "La ligne où la feuille est pliée",
};
const FOLD_STEPS_T: readonly (readonly [string, readonly string[]])[] = [
  ["Pour faire un collage, mets ces gestes du premier au dernier.", ["Je découpe un papier", "Je mets de la colle", "Je colle le papier"]],
  ["Pour faire un collage, mets ces gestes du premier au dernier.", ["Je prends mes ciseaux", "Je découpe un papier", "Je mets de la colle", "Je colle le papier"]],
  ["Pour plier une feuille en deux, mets ces gestes du premier au dernier.", ["Je prends une feuille", "Je plie en deux", "J'appuie sur le pli"]],
  ["Pour plier une feuille en deux, mets ces gestes du premier au dernier.", ["Je prends une feuille", "Je plie en deux", "J'appuie sur le pli", "Je déplie la feuille"]],
  ["Pour modeler un objet, mets ces gestes du premier au dernier.", ["Je prends de l'argile", "Je forme un objet", "Je laisse sécher"]],
  ["Pour modeler un objet, mets ces gestes du premier au dernier.", ["Je prends de l'argile", "Je roule une boule", "Je forme un objet", "Je laisse sécher"]],
  ["Pour découper une forme, mets ces gestes du premier au dernier.", ["Je dessine un trait", "Je découpe sur le trait", "Je range les ciseaux"]],
  ["Pour découper une forme, mets ces gestes du premier au dernier.", ["Je prends un crayon", "Je dessine un trait", "Je découpe sur le trait", "Je range les ciseaux"]],
];
const FOLD_GAP_T: readonly GRow[] = [
  ["Pour découper, j'utilise des ___.", "ciseaux", ["crayons", "livres"]],
  ["Pour coller, j'utilise de la ___.", "colle", ["règle", "gomme"]],
  ["On modèle un objet avec de l'___.", "argile", ["encre", "huile"]],
  ["On plie une feuille de ___.", "papier", ["fer", "pierre"]],
];
const FOLD_SYMMETRY_Q: readonly QRow[] = [
  ["Tu plies une feuille en deux et tu découpes une forme. Que vois-tu en dépliant ?", "Deux côtés pareils"],
  ["Quel mot dit ce qui est pareil des deux côtés d'un pli ?", "Symétrie"],
  ["Que fait apparaître un pliage en deux ?", "Symétrie"],
  ["Où se trouve la ligne de symétrie quand on plie en deux ?", "Sur le pli"],
  ["Tu plies en deux une feuille avec la moitié d'un papillon dessiné. Que se passe-t-il en dépliant ?", "Le papillon est entier"],
];

// ===========================================================================
// LES SONS, LES INSTRUMENTS, LES MIMES : les tables
// ===========================================================================

const SOUND_LINK_T: Record<string, string> = {
  Chuchotement: "Un son faible",
  Murmure: "Un son faible",
  "Pas de chat": "Un son faible",
  Tonnerre: "Un son fort",
  Pétard: "Un son fort",
  Tambour: "Un son grave",
  Flûte: "Un son aigu",
  Sifflet: "Un son aigu",
  "Chant d'oiseau": "Un son aigu",
};
/**
 * Un son a une force, une hauteur et une durée : un appariement ne garde qu'une étiquette défendable par son. Jamais « fort » avec
 * « grave » (le tonnerre et le tambour sont les deux), aucune étiquette de durée (une cloche dure et sonne fort, un sifflet est court et fort).
 */
const checkSoundLinks: Check = (exo) => {
  const labels = pairsOf(exo).map((pair) => pair.right);
  return (
    checkLinks(SOUND_LINK_T)(exo) ??
    ok(!(labels.includes("Un son fort") && labels.includes("Un son grave")), `« fort » et « grave » ensemble : ${labels.join(" | ")}`) ??
    ok(labels.every((label) => ["Un son fort", "Un son faible", "Un son grave", "Un son aigu"].includes(label)), `étiquette de durée : ${labels.join(" | ")}`)
  );
};
const SOUND_ZONES: readonly [string, string] = ["Son fort", "Son faible"];
const SOUND_SORT_T: Record<string, string> = {
  Sirène: SOUND_ZONES[0],
  Tonnerre: SOUND_ZONES[0],
  Tambour: SOUND_ZONES[0],
  Klaxon: SOUND_ZONES[0],
  Pétard: SOUND_ZONES[0],
  Chuchotement: SOUND_ZONES[1],
  Murmure: SOUND_ZONES[1],
  "Pas de chat": SOUND_ZONES[1],
  "Feuille qui bouge": SOUND_ZONES[1],
  "Goutte d'eau": SOUND_ZONES[1],
};
const INSTRUMENT_HOW_Q: readonly QRow[] = [
  ["Comment joue-t-on de la kora ?", "On pince ses cordes"],
  ["Comment joue-t-on du balafon ?", "On frappe ses lames de bois"],
  ["Comment joue-t-on de la flûte ?", "On souffle dedans"],
  ["Comment joue-t-on des maracas ?", "On les secoue"],
  ["Comment joue-t-on du riti ?", "On le joue avec un archet"],
  ["Comment joue-t-on du tama ?", "On le serre sous le bras", ["On le frappe"]],
  ["Comment joue-t-on du sabar ?", "On le frappe"],
  ["Comment joue-t-on du djembé ?", "On le frappe"],
];
const INSTRUMENT_WHICH_Q: readonly QRow[] = [
  ["Quel instrument se joue en soufflant ?", "Flûte"],
  ["Quel instrument se joue en pinçant ses cordes ?", "Kora"],
  ["Quel instrument se secoue ?", "Maracas"],
  ["Quel instrument se joue avec un archet ?", "Riti"],
  ["Quel instrument a des lames de bois ?", "Balafon"],
  ["Quel petit tambour se serre sous le bras ?", "Tama", ["Sabar", "Djembé"]],
  ["Quel instrument a une seule corde ?", "Riti"],
  ["Quel instrument est un tambour qu'on frappe ?", "Sabar", ["Djembé", "Tama"]],
];
const INSTRUMENT_ZONES: readonly [string, string] = ["On frappe", "On ne frappe pas"];
const INSTRUMENT_SORT_T: Record<string, string> = {
  Balafon: INSTRUMENT_ZONES[0],
  Sabar: INSTRUMENT_ZONES[0],
  Djembé: INSTRUMENT_ZONES[0],
  Kora: INSTRUMENT_ZONES[1],
  Flûte: INSTRUMENT_ZONES[1],
  Maracas: INSTRUMENT_ZONES[1],
  Riti: INSTRUMENT_ZONES[1],
};
const INSTRUMENT_LINK_T: Record<string, string> = {
  Kora: "On pince ses cordes",
  Balafon: "On frappe ses lames de bois",
  Tama: "On le serre sous le bras",
  Riti: "On le joue avec un archet",
  Maracas: "On les secoue",
  Flûte: "On souffle dedans",
};
const INSTRUMENT_GAP_T: readonly GRow[] = [
  ["La kora se joue en pinçant ses ___.", "cordes", ["lames", "tambours"]],
  ["Le balafon a des lames de ___.", "bois", ["fer", "verre"]],
  ["On souffle dans la ___.", "flûte", ["kora", "tama"]],
  ["On secoue les ___.", "maracas", ["cordes", "archets"]],
  ["Le riti se joue avec un ___.", "archet", ["bâton", "souffle"]],
  ["Le tama est un petit ___ qu'on serre sous le bras.", "tambour", ["balafon", "riti"]],
  ["Le sabar et le djembé sont des ___ qu'on frappe.", "tambours", ["flûtes", "cordes"]],
  ["Le riti est une vièle à une ___.", "corde", ["flûte", "lame"]],
];
const INSTRUMENT_WRITE_T: readonly WRow[] = [
  ["Quel instrument se souffle ? Écris le mot.", "flûte", ["flûte", "la flûte", "une flûte", "flute"]],
  ["Quel instrument se joue avec un archet ? Écris le mot.", "riti", ["riti", "le riti"]],
  ["Combien de cordes a le riti ? Écris le nombre.", "1", ["1", "une", "une corde"]],
  ["Quel instrument a des lames de bois ? Écris le mot.", "balafon", ["balafon", "le balafon"]],
  ["Quel instrument se secoue ? Écris le mot.", "maracas", ["maracas", "les maracas", "des maracas"]],
  ["Quel instrument a des cordes que l'on pince ? Écris le mot.", "kora", ["kora", "la kora"]],
  ["Quel petit tambour se serre sous le bras ? Écris le mot.", "tama", ["tama", "le tama"]],
  ["Quel instrument est une vièle à une corde ? Écris le mot.", "riti", ["riti", "le riti"]],
];

type Feeling = "Joie" | "Peur" | "Colère" | "Fatigue" | "Honte";
const FEELINGS: Feeling[] = ["Joie", "Peur", "Colère", "Fatigue", "Honte"];
/** Chaque posture et son sentiment. */
const POSTURE_FEELING: Record<string, Feeling> = {
  "sourit et saute très haut": "Joie",
  "rit et bat des mains": "Joie",
  "danse les bras levés": "Joie",
  "recule en tremblant": "Peur",
  "se cache derrière un adulte": "Peur",
  "retient son souffle et ne bouge plus": "Peur",
  "serre les poings et fronce les sourcils": "Colère",
  "tape du pied et frappe la table": "Colère",
  "croise les bras et fronce les sourcils": "Colère",
  "bâille et frotte ses yeux": "Fatigue",
  "marche lentement, les épaules tombantes": "Fatigue",
  "pose sa tête sur ses bras": "Fatigue",
  "baisse la tête et regarde ses pieds": "Honte",
  "parle tout bas, les yeux baissés": "Honte",
  "rougit et baisse les yeux": "Honte",
};
/** Les sentiments qu'on peut prendre pour un autre : ils ne sont jamais mauvais choix de celui-ci. */
const CONFUSED_WITH: Record<Feeling, Feeling[]> = { Joie: [], Peur: ["Honte"], Colère: ["Honte"], Fatigue: ["Honte"], Honte: ["Peur", "Fatigue"] };
/** Chaque geste et son sentiment : aucun ne sert à deux sentiments. */
const GESTURE_FEELING: Record<string, Feeling> = {
  "Sauter en riant": "Joie",
  "Taper dans ses mains": "Joie",
  Danser: "Joie",
  Sourire: "Joie",
  "Reculer en tremblant": "Peur",
  "Se cacher derrière un adulte": "Peur",
  "Retenir son souffle": "Peur",
  Trembler: "Peur",
  "Serrer les poings": "Colère",
  "Taper du pied": "Colère",
  "Froncer les sourcils": "Colère",
  "Taper sur la table": "Colère",
  Bâiller: "Fatigue",
  "Frotter ses yeux": "Fatigue",
  "Marcher lentement": "Fatigue",
  "Poser sa tête sur ses bras": "Fatigue",
  "Baisser la tête": "Honte",
  "Regarder ses pieds": "Honte",
  "Parler tout bas": "Honte",
  Rougir: "Honte",
  "Bâiller longuement": "Fatigue",
};
const MIME_GESTURE_Q: readonly (readonly [string, string])[] = [
  ["Quel geste montre la joie ?", "Taper dans ses mains"],
  ["Comment mime-t-on la joie ?", "Sauter en riant"],
  ["Quel geste montre la peur ?", "Reculer en tremblant"],
  ["Comment mime-t-on la peur ?", "Se cacher derrière un adulte"],
  ["Quel geste montre la colère ?", "Serrer les poings"],
  ["Comment mime-t-on la colère ?", "Taper du pied"],
  ["Quel geste montre la fatigue ?", "Bâiller longuement"],
  ["Comment mime-t-on la fatigue ?", "Poser sa tête sur ses bras"],
  ["Quel geste montre la honte ?", "Baisser la tête"],
  ["Comment mime-t-on la honte ?", "Regarder ses pieds"],
];
const MIME_LINK_T: Record<string, string> = {
  Joie: "Il saute et il rit",
  Peur: "Il recule en tremblant",
  Colère: "Il serre les poings",
  Fatigue: "Elle bâille",
  Honte: "Il baisse la tête",
};
const MIME_GAP_T: readonly GRow[] = [
  ["Quand on a peur, on peut ___ en tremblant.", "reculer", ["danser", "sauter"]],
  ["Quand on est en colère, on serre les ___.", "poings", ["genoux", "oreilles"]],
  ["Quand on a honte, on baisse la ___.", "tête", ["main", "jambe"]],
  ["Quand on est fatigué, on ___.", "bâille", ["saute", "chante"]],
  ["Quand on est content, on ___.", "sourit", ["bâille", "recule"]],
  ["On rit quand on ressent de la ___.", "joie", ["peur", "honte"]],
  ["La ___ nous fait taper du pied.", "colère", ["joie", "fatigue"]],
  ["Un enfant qui bâille est ___.", "fatigué", ["furieux", "joyeux"]],
];
const MIME_WRITE_T: readonly WRow[] = [
  ["Quel sentiment montre quelqu'un qui bâille ? Écris le mot.", "fatigue", ["fatigue", "la fatigue"]],
  ["Quel sentiment montre quelqu'un qui serre les poings ? Écris le mot.", "colère", ["colère", "la colère"]],
  ["Quel sentiment montre quelqu'un qui recule en tremblant ? Écris le mot.", "peur", ["peur", "la peur"]],
  ["Quel sentiment montre quelqu'un qui baisse la tête et regarde ses pieds ? Écris le mot.", "honte", ["honte", "la honte"]],
  ["Quel sentiment montre quelqu'un qui saute et qui rit ? Écris le mot.", "joie", ["joie", "la joie"]],
];

// ===========================================================================
// LES VÉRIFICATIONS : une par gabarit
// ===========================================================================

const CHECKS: Record<string, Check> = {
  // --- Symboles de la Nation ---
  "ce1-symbole-qcm": checkQuestions(SYMBOL_Q),
  "ce1-symbole-nom": checkQuestions(SYMBOL_NAME_Q),
  "ce1-symbole-glisser": checkSort(SYMBOL_ZONES, { ...Object.fromEntries(FLAG_TILES.map((tile) => [tile, SYMBOL_ZONES[0]])), ...Object.fromEntries(ARMS_TILES.map((tile) => [tile, SYMBOL_ZONES[1]])) }),
  "ce1-symbole-ordre": (exo) =>
    all(
      checkSteps(MOTTO_STEPS_T)(exo),
      // La devise se dit toujours « Un Peuple – Un But – Une Foi » : de la première à la dernière dans un sens, l'inverse dans l'autre.
      ok(/première à la dernière|l'ordre où on les dit/u.test(exo.prompt) ? sameSeq(sequenceOf(exo), MOTTO) : sameSeq(sequenceOf(exo), [...MOTTO].reverse()), "le sens de la devise ne suit pas l'énoncé"),
      ok(!/gauche|droite/u.test(exo.prompt), "un ordre spatial sans scène"),
    ),
  "ce1-symbole-relier": checkLinks(SYMBOL_LINK_T),
  "ce1-symbole-trou": checkGaps(SYMBOL_GAP_T),
  "ce1-symbole-ecrire": checkWrite(SYMBOL_WRITE_T),

  // --- Civisme ---
  "ce1-civisme-situation": checkQuestions(CIVIC_SITUATION_Q),
  "ce1-civisme-pourquoi": checkQuestions(CIVIC_WHY_Q),
  "ce1-civisme-glisser": checkSort(CIVIC_ZONES, CIVIC_SORT_T),
  "ce1-civisme-relier": checkLinks(CIVIC_LINK_T),
  "ce1-civisme-ordre": checkSteps(CIVIC_STEPS_T),
  "ce1-civisme-trou": checkGaps(CIVIC_GAP_T),
  "ce1-civisme-ecrire": checkWrite(CIVIC_WRITE_T),

  // --- Autorités ---
  "ce1-autorite-qui": checkQuestions(AUTHORITY_WHO_Q),
  "ce1-autorite-role": checkQuestions(AUTHORITY_ROLE_Q),
  "ce1-autorite-glisser": checkSort(AUTHORITY_ZONES, AUTHORITY_SORT_T),
  "ce1-autorite-relier": checkLinks(AUTHORITY_LINK_T),
  "ce1-autorite-ordre": checkSteps(AUTHORITY_STEPS_T),
  "ce1-autorite-trou": checkGaps(AUTHORITY_GAP_T),
  "ce1-autorite-ecrire": checkWrite(AUTHORITY_WRITE_T),

  // --- Différences ---
  "ce1-diff-situation": checkQuestions(DIFF_SITUATION_Q),
  "ce1-diff-mot": checkQuestions(DIFF_FACT_Q),
  "ce1-diff-glisser": checkSort(DIFF_ZONES, DIFF_SORT_T),
  "ce1-diff-relier": checkLinks(DIFF_LINK_T),
  "ce1-diff-ordre": checkSteps(DIFF_STEPS_T),
  "ce1-diff-trou": checkGaps(DIFF_GAP_T),
  "ce1-diff-ecrire": checkWrite(DIFF_WRITE_T),

  // --- Dessin et pliage ---
  "ce1-dessin-materiel": checkQuestions(DRAW_TOOL_Q),
  "ce1-dessin-relier": checkLinks(DRAW_LINK_T),
  "ce1-dessin-ordre": checkSteps(DRAW_STEPS_T),
  "ce1-dessin-trou": checkGaps(DRAW_GAP_T),
  "ce1-pli-materiel": checkQuestions(FOLD_TOOL_Q),
  "ce1-pli-relier": checkLinks(FOLD_LINK_T),
  "ce1-pli-ordre": checkSteps(FOLD_STEPS_T),
  "ce1-pli-trou": checkGaps(FOLD_GAP_T),
  "ce1-pli-symetrie": checkQuestions(FOLD_SYMMETRY_Q),

  // --- Sons, instruments, mimes ---
  "ce1-son-relier": checkSoundLinks,
  "ce1-son-glisser": checkSort(SOUND_ZONES, SOUND_SORT_T),
  "ce1-instru-geste": checkQuestions(INSTRUMENT_HOW_Q),
  "ce1-instru-quel": checkQuestions(INSTRUMENT_WHICH_Q),
  "ce1-instru-glisser": checkSort(INSTRUMENT_ZONES, INSTRUMENT_SORT_T),
  "ce1-instru-relier": checkLinks(INSTRUMENT_LINK_T),
  "ce1-instru-trou": checkGaps(INSTRUMENT_GAP_T),
  "ce1-instru-ecrire": checkWrite(INSTRUMENT_WRITE_T),
  "ce1-mime-sentiment": (exo) => {
    const match = /^Que ressent quelqu'un qui (.+) \?$/u.exec(exo.prompt);
    const feeling = match ? POSTURE_FEELING[match[1]] : undefined;
    if (!feeling) return `posture inconnue : ${exo.prompt}`;
    return all(
      ok(rightOption(exo) === feeling, `la bonne option est « ${rightOption(exo)} », la table dit « ${feeling} »`),
      ok(wrongOf(exo).length === 2 && wrongOf(exo).every((option) => FEELINGS.includes(option as Feeling) && option !== feeling), `mauvais choix ${wrongOf(exo).join(" | ")}`),
      ok(wrongOf(exo).every((option) => !CONFUSED_WITH[feeling].includes(option as Feeling)), `un mauvais choix se confond avec ${feeling} : ${wrongOf(exo).join(" | ")}`),
    );
  },
  "ce1-mime-geste": (exo) => {
    const row = MIME_GESTURE_Q.find((entry) => entry[0] === exo.prompt);
    if (!row) return `question inconnue : ${exo.prompt}`;
    const feeling = GESTURE_FEELING[row[1]];
    return all(
      ok(rightOption(exo) === row[1], `la bonne option est « ${rightOption(exo)} », la table dit « ${row[1]} »`),
      ok(wrongOf(exo).length === 2 && wrongOf(exo).every((option) => GESTURE_FEELING[option] !== undefined && GESTURE_FEELING[option] !== feeling), `mauvais choix ${wrongOf(exo).join(" | ")}`),
    );
  },
  "ce1-mime-glisser": (exo) => {
    const zones = zonesOf(exo);
    for (const item of itemsOf(exo)) if (GESTURE_FEELING[item.text] !== item.correctZone) return `« ${item.text} » est rangé dans « ${item.correctZone} », la table dit « ${GESTURE_FEELING[item.text]} »`;
    return all(
      ok(zones.length === 2 && zones.every((zone) => FEELINGS.includes(zone as Feeling)) && zones[0] !== zones[1], `cases ${zones.join(" | ")}`),
      ok(zones.every((zone) => itemsOf(exo).some((item) => item.correctZone === zone)), "les deux cases servies"),
      ok(itemsOf(exo).length >= 4 && itemsOf(exo).length <= 5, "quatre ou cinq gestes"),
    );
  },
  "ce1-mime-relier": checkLinks(MIME_LINK_T),
  "ce1-mime-trou": checkGaps(MIME_GAP_T),
  "ce1-mime-ecrire": checkWrite(MIME_WRITE_T),
};

const KINDS = Object.keys(CHECKS) as GameKind[];
const TOPIC_KINDS: Record<string, string[]> = {
  "ci-ce1-nation": ["ce1-symbole-qcm", "ce1-symbole-nom", "ce1-symbole-glisser", "ce1-symbole-ordre", "ce1-symbole-relier", "ce1-symbole-trou", "ce1-symbole-ecrire"],
  "ci-ce1-civisme": ["ce1-civisme-situation", "ce1-civisme-pourquoi", "ce1-civisme-glisser", "ce1-civisme-relier", "ce1-civisme-ordre", "ce1-civisme-trou", "ce1-civisme-ecrire"],
  "ci-ce1-autorites": ["ce1-autorite-qui", "ce1-autorite-role", "ce1-autorite-glisser", "ce1-autorite-relier", "ce1-autorite-ordre", "ce1-autorite-trou", "ce1-autorite-ecrire"],
  "ci-ce1-diversite": ["ce1-diff-situation", "ce1-diff-mot", "ce1-diff-glisser", "ce1-diff-relier", "ce1-diff-ordre", "ce1-diff-trou", "ce1-diff-ecrire"],
  "ar-ce1-dessin": ["ce1-dessin-materiel", "ce1-dessin-relier", "ce1-dessin-ordre", "ce1-dessin-trou"],
  "ar-ce1-pliage": ["ce1-pli-materiel", "ce1-pli-relier", "ce1-pli-ordre", "ce1-pli-trou", "ce1-pli-symetrie"],
  "ar-ce1-sons": ["ce1-son-relier", "ce1-son-glisser"],
  "ar-ce1-instruments": ["ce1-instru-geste", "ce1-instru-quel", "ce1-instru-glisser", "ce1-instru-relier", "ce1-instru-trou", "ce1-instru-ecrire"],
  "ar-ce1-mimes": ["ce1-mime-sentiment", "ce1-mime-geste", "ce1-mime-glisser", "ce1-mime-relier", "ce1-mime-trou", "ce1-mime-ecrire"],
};
/** Les jeux que ces trois fiches avaient déjà : les gabarits s'y ajoutent, ils ne les remplacent pas. */
const EXISTING_GAMES: Record<string, string[]> = {
  "ar-ce1-dessin": ["pixel-copie", "pixel-memoire"],
  "ar-ce1-pliage": ["pixel-symetrie"],
  "ar-ce1-sons": ["ecoute-hauteur", "ecoute-duree", "ecoute-intensite"],
};
const TOPIC_KEYS = Object.keys(TOPIC_KINDS);
const entryOf = (key: string) => allProgrammeEntries().find((entry) => entry.topic.key === key)!;
const topicOfKind = (kind: string) => TOPIC_KEYS.find((key) => TOPIC_KINDS[key].includes(kind)) as string;
const subjectOfKind = (kind: string) => entryOf(topicOfKind(kind)).subject.name;

describe("chaque gabarit de l'instruction civique et des arts du CE1 a sa vérification", () => {
  it("couvre exactement les cinquante et un gabarits, tous rangés dans une thématique", () => {
    expect(KINDS).toHaveLength(51);
    expect(Object.values(TOPIC_KINDS).flat().sort()).toEqual([...KINDS].sort());
    for (const kind of KINDS) expect(Object.keys(GAME_KINDS), kind).toContain(kind);
  });
});

describe("les gabarits de l'instruction civique et des arts du CE1 recalculent juste, depuis une table écrite à part", () => {
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
  it("ne rangent chaque geste que dans un seul sentiment, et jamais une posture dans deux", () => {
    for (const feeling of FEELINGS) expect(Object.values(GESTURE_FEELING).includes(feeling), feeling).toBe(true);
    for (const feeling of FEELINGS) expect(Object.values(POSTURE_FEELING).filter((value) => value === feeling).length, feeling).toBeGreaterThanOrEqual(3);
    // « se cacher le visage » (peur ou honte) et « crier fort » (colère ou joie) se confondent : aucune posture ne les écrit.
    for (const text of [...Object.keys(POSTURE_FEELING), ...Object.keys(GESTURE_FEELING)]) {
      expect(/se cacher le visage|crier/iu.test(text), text).toBe(false);
    }
  });

  it("n'écrivent aucune parole de l'hymne que son titre, et aucune langue ni ethnie dans un groupe", () => {
    const ALL_TEXT = JSON.stringify([SYMBOL_Q, SYMBOL_NAME_Q, SYMBOL_GAP_T, SYMBOL_WRITE_T, DIFF_SITUATION_Q, DIFF_FACT_Q, DIFF_SORT_T, DIFF_LINK_T, DIFF_GAP_T, DIFF_WRITE_T]);
    for (const forbidden of ["Wolof", "Peul", "Sérère", "Diola", "Mandingue", "Toucouleur", "musulman", "chrétien", "Christianisme", "Islam"]) expect(ALL_TEXT, forbidden).not.toContain(forbidden);
    expect(JSON.stringify(SYMBOL_GAP_T)).toContain("Le Lion ___");
  });

  it("ne font jamais du tama une chose qu'on frappe, parce que la fiche dit seulement qu'on le serre sous le bras", () => {
    expect(INSTRUMENT_SORT_T.Tama).toBeUndefined();
    for (const d of draws) {
      const exo = make("ce1-instru-glisser" as GameKind, d) as unknown as Exo;
      expect(itemsOf(exo).map((item) => item.text), exo.prompt).not.toContain("Tama");
    }
  });

  it("ne mettent jamais le policier et le gendarme l'un parmi les mauvais choix de l'autre", () => {
    for (const d of draws) {
      const exo = make("ce1-autorite-qui" as GameKind, d) as unknown as Exo;
      if (rightOption(exo) === "Policier") expect(optionsOf(exo), exo.prompt).not.toContain("Gendarme");
      if (rightOption(exo) === "Gendarme") expect(optionsOf(exo), exo.prompt).not.toContain("Policier");
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
      payload.acceptedAnswers = ["zzz"];
      return { ...copy(), answerKey: "zzz" };
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

  it("voient aussi un énoncé abîmé : une devise remise à l'envers, un ordre de gauche à droite, un mauvais choix devenu juste", () => {
    const motto = make("ce1-symbole-ordre" as GameKind, { level: 1, seed: "mut-motto" }) as unknown as Exo;
    expect(CHECKS["ce1-symbole-ordre"]({ ...motto, prompt: motto.prompt.replace("de la première à la dernière", "de la dernière à la première") })).not.toBeNull();
    expect(CHECKS["ce1-symbole-ordre"]({ ...motto, prompt: "Range les couleurs du drapeau du Sénégal, de gauche à droite." })).not.toBeNull();

    // Un mauvais choix qui devient juste : le gendarme parmi les mauvais choix d'une question sur le policier.
    let poisoned = 0;
    for (let n = 0; n < 60 && poisoned === 0; n++) {
      const candidate = make("ce1-autorite-qui" as GameKind, { level: 2, seed: `mut-who:${n}` }) as unknown as Exo;
      if (rightOption(candidate) !== "Policier") continue;
      expect(CHECKS["ce1-autorite-qui"](candidate)).toBeNull();
      const broken = JSON.parse(JSON.stringify(candidate)) as Exo;
      (broken.payload.options as string[])[(broken.payload.correctIndex as number) === 0 ? 1 : 0] = "Gendarme";
      expect(CHECKS["ce1-autorite-qui"](broken)).not.toBeNull();
      poisoned += 1;
    }
    expect(poisoned).toBe(1);
  });
});

// ===========================================================================
// LES RÈGLES COMMUNES
// ===========================================================================

describe("tous les gabarits de l'instruction civique et des arts du CE1", () => {
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

  it("n'écrivent aucun émoji, ni sur une tuile, ni dans un énoncé, ni dans un indice", () => {
    for (const { kind, exo } of exos) {
      expect(/\p{Extended_Pictographic}/u.test(exo.prompt), `${kind} : ${exo.prompt}`).toBe(false);
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

  it("n'écrivent une étiquette de glissé ou un choix d'un mot que sans article en tête, pour que le catalogue d'images du CI s'en passe", () => {
    for (const { kind, exo } of exos) {
      const tiles = [...(exo.payload.items ? itemsOf(exo).map((item) => item.text) : []), ...(exo.payload.options && !/\s/u.test(rightOption(exo)) ? optionsOf(exo) : [])];
      for (const text of tiles) expect(text, `${kind} : « ${text} »`).not.toMatch(/^(?:le|la|les|l'|un|une|des|du|de la|de l') /iu);
    }
  });
});

// ===========================================================================
// LES THÉMATIQUES DU PROGRAMME
// ===========================================================================

describe("les neuf thématiques d'instruction civique et d'arts du CE1", () => {
  const topicOf = (key: string) => entryOf(key).topic;
  const ownKinds = (key: string) => (topicOf(key).games ?? []).map((spec) => spec.kind as string).filter((kind) => kind.startsWith("ce1-"));

  it("remplissent les dix places du palier, avec des jeux connus, sans appeler le modèle", () => {
    for (const key of TOPIC_KEYS) {
      const specs = topicOf(key).games ?? [];
      expect(specs.reduce((sum, spec) => sum + spec.count, 0), key).toBe(PALIER_SIZE);
      const expected = [...TOPIC_KINDS[key], ...(EXISTING_GAMES[key] ?? [])].sort();
      expect(sameSeq(specs.map((spec) => spec.kind as string).sort(), expected), `${key} : ${specs.map((spec) => spec.kind).join(" ")}`).toBe(true);
      for (const spec of specs) {
        expect(Object.keys(GAME_KINDS), `${key} : ${spec.kind}`).toContain(spec.kind);
        expect(spec.vocabulary, `${key} : ${spec.kind}`).toBeUndefined();
      }
      expect(topicUsesModel(key), key).toBe(false);
    }
  });

  it("gardent les jeux que ces fiches avaient et leur nombre : les gabarits ne font que compléter", () => {
    const counts: Record<string, Record<string, number>> = {
      "ar-ce1-dessin": { "pixel-copie": 4, "pixel-memoire": 2 },
      "ar-ce1-pliage": { "pixel-symetrie": 4 },
      "ar-ce1-sons": { "ecoute-hauteur": 3, "ecoute-duree": 3, "ecoute-intensite": 2 },
    };
    for (const key of Object.keys(counts)) {
      for (const [kind, count] of Object.entries(counts[key])) expect((topicOf(key).games ?? []).find((spec) => spec.kind === kind)?.count, `${key} : ${kind}`).toBe(count);
    }
  });

  it("sont celles du CE1, et n'ont changé ni leur clé ni leur nombre de paliers", () => {
    for (const key of TOPIC_KEYS) {
      expect(entryOf(key).klass, key).toBe("CE1");
      expect(topicOf(key).palierCount, key).toBeUndefined();
    }
    expect(TOPIC_KEYS).toHaveLength(9);
  });

  it("fabriquent des paliers entiers, de dix exercices tous différents pour leurs gabarits, qui passent le contrôleur et la table", () => {
    for (const key of TOPIC_KEYS) {
      for (let n = 0; n < 30; n++) {
        for (const palierIndex of [1, 2, 3, 4]) {
          const games = generateGames(topicOf(key).games ?? [], { klass: "CE1", palierIndex, palierCount: 4, seed: `${key}:${n}:${palierIndex}` });
          expect(games, `${key} palier ${palierIndex}`).toHaveLength(PALIER_SIZE);
          const mine = games.filter((game) => (game.payload.game as { kind: string }).kind.startsWith("ce1-"));
          const questions = mine.map((game) => `${game.prompt}|${JSON.stringify(game.payload)}`);
          expect(new Set(questions).size, `${key} #${n} palier ${palierIndex}`).toBe(questions.length);
          for (const game of mine) {
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

  it("varient les types d'un palier : au moins quatre sortes d'exercices sur dix, trois sur la fiche des sons qui garde huit écoutes", () => {
    for (const key of TOPIC_KEYS) {
      for (const palierIndex of [1, 2, 3, 4]) {
        const games = generateGames(topicOf(key).games ?? [], { klass: "CE1", palierIndex, palierCount: 4, seed: key });
        expect(new Set(games.map((game) => game.type)).size, `${key} palier ${palierIndex}`).toBeGreaterThanOrEqual(key === "ar-ce1-sons" ? 3 : 4);
      }
    }
  });

  it("ne posent pas, dans un palier, deux phrases à trou qui se complètent par le même mot", () => {
    for (const key of TOPIC_KEYS) {
      for (let n = 0; n < 30; n++) {
        for (const palierIndex of [1, 2, 3, 4]) {
          const games = generateGames(topicOf(key).games ?? [], { klass: "CE1", palierIndex, palierCount: 4, seed: `gap:${key}:${n}:${palierIndex}` });
          const answers = games.filter((game) => game.type === "fill-blank").map((game) => (game.payload.blanks as { answer: string }[])[0].answer);
          expect(new Set(answers).size, `${key} palier ${palierIndex} : ${answers.join(" ")}`).toBe(answers.length);
        }
      }
    }
  });

  it("ne posent pas, dans un palier, deux questions d'un même gabarit qui ont la même bonne réponse", () => {
    for (const key of TOPIC_KEYS) {
      const twice = (topicOf(key).games ?? []).filter((spec) => spec.count >= 2 && (spec.kind as string).startsWith("ce1-")).map((spec) => spec.kind as string);
      for (let n = 0; n < 40; n++) {
        for (const palierIndex of [1, 2, 3, 4]) {
          const games = generateGames(topicOf(key).games ?? [], { klass: "CE1", palierIndex, palierCount: 4, seed: `twice:${key}:${n}:${palierIndex}` });
          for (const kind of twice) {
            const answers = games.filter((game) => (game.payload.game as { kind: string }).kind === kind).map((game) => game.answerKey);
            // Une suite à ranger a toujours la même sorte de réponse (les gestes d'un même sujet) : seuls les QCM, les trous et les réponses écrites comptent.
            if (GAME_KINDS[kind as GameKind].type === "order" || GAME_KINDS[kind as GameKind].type === "match" || GAME_KINDS[kind as GameKind].type === "drag-drop") continue;
            expect(new Set(answers).size, `${key} palier ${palierIndex} ${kind} : ${answers.join(" | ")}`).toBe(answers.length);
          }
        }
      }
    }
  });

  it("gardent de quoi servir la démo du site : les quatre types de base, et le type que la banque attend sur chaque thématique", () => {
    // La banque de la vitrine (`components/landing/demo/bank/instruction-civique.ts` et `education-artistique.ts`) veut, sur une thématique tout en
    // gabarits, un gabarit du type de chacun de ses exercices.
    const typesOf = (key: string) => new Set((topicOf(key).games ?? []).map((spec) => GAME_KINDS[spec.kind].type));
    for (const key of TOPIC_KEYS.filter((candidate) => !EXISTING_GAMES[candidate])) {
      for (const type of ["qcm", "drag-drop", "match", "fill-blank"]) expect(typesOf(key).has(type as never), `${key} : ${type}`).toBe(true);
    }
    expect(typesOf("ci-ce1-nation").has("order" as never)).toBe(true);
    expect(typesOf("ci-ce1-autorites").has("short-answer" as never)).toBe(true);
    expect(typesOf("ar-ce1-instruments").has("short-answer" as never)).toBe(true);
    expect(typesOf("ar-ce1-sons").has("match" as never)).toBe(true);
    expect(typesOf("ar-ce1-pliage").has("order" as never)).toBe(true);
    expect(typesOf("ar-ce1-dessin").has("fill-blank" as never)).toBe(true);
    expect(typesOf("ar-ce1-mimes").has("drag-drop" as never)).toBe(true);
  });

  it("refont chaque exercice raté par le code, sans le modèle", () => {
    for (const key of TOPIC_KEYS) {
      for (const kind of ownKinds(key)) {
        const origin = { kind, level: 3 };
        const again = regenerateGame(origin, "CE1", `reprise:${key}:${kind}`);
        expect(again, kind).not.toBeNull();
        expect(again!.type, kind).toBe(GAME_KINDS[kind as GameKind].type);
      }
    }
  });

  it("ne reposent presque jamais la même question à deux paliers d'une même thématique, pour leurs gabarits", () => {
    for (const key of TOPIC_KEYS) {
      let repeated = 0;
      let total = 0;
      for (let n = 0; n < 40; n++) {
        const seen = new Set<string>();
        for (const palierIndex of [1, 2, 3, 4]) {
          const games = generateGames(topicOf(key).games ?? [], { klass: "CE1", palierIndex, palierCount: 4, seed: `var:${key}:${n}:${palierIndex}` });
          const here = games.filter((game) => (game.payload.game as { kind: string }).kind.startsWith("ce1-")).map((game) => `${game.prompt}|${game.type === "fill-blank" ? String(game.payload.text) : ""}|${game.answerKey}`);
          for (const question of here) {
            total += 1;
            if (seen.has(question)) repeated += 1;
          }
          here.forEach((question) => seen.add(question));
        }
      }
      expect(repeated / total, key).toBeLessThan(0.02);
    }
  });
});
