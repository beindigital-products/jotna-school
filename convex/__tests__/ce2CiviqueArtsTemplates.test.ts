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
 * L'INSTRUCTION CIVIQUE ET LES ARTS DU CE2 : mes droits et mes devoirs, vivre en paix, les bonnes valeurs, la vie en communauté ; le coloriage
 * magique, reproduire un modèle, les mélodies, l'hymne national et les chants, jouer une scène.
 *
 * Chaque test RECALCULE la bonne réponse depuis l'énoncé et les tuiles, avec ses propres tables écrites à part : les droits et les devoirs,
 * ce qu'on accepte et ce qu'on refuse pour vivre en paix, la valeur que montre chaque scène, les biens communs, les couleurs chaudes et
 * froides, les techniques de reproduction, les notes d'une mélodie (une mélodie monte quand chaque note est plus loin de do que la précédente),
 * ce qu'on fait pendant l'hymne, les scènes de la vie courante et les scènes imaginaires. Un gabarit dont la réponse contredit sa table échoue.
 * À la fin, des MUTATIONS : on abîme la bonne réponse d'un exercice juste, puis son énoncé, et chaque vérification doit le voir.
 * L'échantillon du modèle comptait 7 exercices faux ou creux sur 51 en instruction civique et en arts du CE2 (« Comment peut-on améliorer
 * la vie dans notre quartier ? », « Quelle mélodie monte ? » quatre fois, « Nomme un aliment que l'on pourrait vendre au marché »).
 */

const LEVELS: GameLevel[] = [1, 2, 3, 4];
const draws = LEVELS.flatMap((level) => Array.from({ length: 60 }, (_, n) => ({ level, seed: `ce2sc:${level}:${n}` })));
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
/** Deux vérifications l'une après l'autre : la première erreur gagne. */
const both = (first: Check, second: Check): Check => (exo) => all(first(exo), second(exo));
/** Les choix d'un QCM sans la bonne réponse. */
const wrongOf = (exo: Exo) => optionsOf(exo).filter((option) => option !== rightOption(exo));

/** Un trou : la phrase et sa réponse doivent être dans la table, avec les mêmes choix. */
const checkGap = (table: readonly (readonly [string, string, string[]])[]): Check => (exo) => {
  const rows = table.filter((entry) => entry[0] === textOf(exo));
  if (rows.length === 0) return `phrase inconnue : ${textOf(exo)}`;
  const row = rows.find((entry) => entry[1] === blankOf(exo).answer);
  if (!row) return `la phrase veut « ${rows.map((entry) => entry[1]).join(" | ")} », le trou dit « ${blankOf(exo).answer} »`;
  return ok(same(blankOf(exo).options, [row[1], ...row[2]]), `les choix : ${blankOf(exo).options.join(" | ")}`);
};
/** Une question à choix : la question doit être dans la table, avec la bonne option et de mauvais choix permis. */
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
/** Un ordre : l'énoncé et la suite doivent être ensemble dans la table. */
const checkOrder = (table: readonly (readonly [string, string[]])[]): Check => (exo) => {
  const rows = table.filter((entry) => entry[0] === exo.prompt);
  if (rows.length === 0) return `énoncé inconnu : ${exo.prompt}`;
  return ok(rows.some((entry) => sameSeq(entry[1], sequenceOf(exo))), `suite ${sequenceOf(exo).join(" > ")} au lieu de ${rows.map((entry) => entry[1].join(" > ")).join(" ou ")}`);
};
/** Un glissé : chaque étiquette doit aller dans la case que la table lui donne, et les cases sont celles de la table. */
const checkSort = (zoneOf: Record<string, string>, zones: readonly (readonly [string, string])[]): Check => (exo) => {
  if (!zones.some((pair) => sameSeq(zonesOf(exo), pair))) return `cases ${zonesOf(exo).join(" | ")}`;
  for (const item of itemsOf(exo)) if (zoneOf[item.text] !== item.correctZone) return `« ${item.text} » est rangé dans « ${item.correctZone} », la table dit « ${zoneOf[item.text]} »`;
  return ok(itemsOf(exo).length >= 3 && itemsOf(exo).length <= 4, "trois ou quatre étiquettes");
};
/** Un appariement : chaque paire doit être dans la table (la gauche donne la droite), pour l'énoncé donné. */
const checkLink = (tables: Record<string, Record<string, string>>): Check => (exo) => {
  const table = tables[exo.prompt];
  if (!table) return `énoncé inconnu : ${exo.prompt}`;
  for (const pair of pairsOf(exo)) if (table[pair.left] !== pair.right) return `« ${pair.left} » va avec « ${pair.right} », la table dit « ${table[pair.left]} »`;
  return ok(pairsOf(exo).length === 3, "trois paires");
};

// ---------------------------------------------------------------------------
// Les tables de vérité, écrites à part des gabarits
// ---------------------------------------------------------------------------

const zoneMap = (lists: readonly (readonly [readonly string[], string])[]): Record<string, string> =>
  Object.fromEntries(lists.flatMap(([items, zone]) => items.map((item) => [item, zone] as const)));

// ===== Mes droits et mes devoirs =====
const RIGHTS_T = ["Avoir un nom", "Aller à l'école", "Être soigné", "Être protégé", "Jouer"];
const DUTIES_T = ["Respecter les autres", "Travailler à l'école", "Aider à la maison"];
const RIGHT_EXAMPLE_T: Record<string, string> = {
  "Avoir un nom": "Être appelé par son prénom",
  "Aller à l'école": "Apprendre à lire et à écrire",
  "Être soigné": "Aller voir le médecin",
  "Être protégé": "Être à l'abri du danger",
  Jouer: "S'amuser dans la cour",
};

// ===== Vivre en paix =====
const ACCEPTED_T = ["Parler calmement", "Écouter l'autre", "Demander pardon", "Accepter les différences"];
const REFUSED_T = ["Frapper", "Se moquer", "Insulter", "Se battre"];
const PEACE_LINK_T: Record<string, string> = {
  Dialogue: "Se parler pour régler un problème",
  Tolérance: "Accepter que l'autre soit différent",
  Médiation: "Aider deux amis à faire la paix",
  Moquerie: "Rire de quelqu'un pour lui faire de la peine",
  Violence: "Faire du mal avec ses mains ou ses mots",
};

// ===== Les bonnes valeurs =====
const VALUES_T = ["Honnêteté", "Solidarité", "Courage", "Parole donnée", "Teranga"];
const VALUE_OF_ACTION: Record<string, string> = {
  "Rendre un objet trouvé": "Honnêteté",
  "Dire la vérité": "Honnêteté",
  "Ne pas copier sur son voisin": "Honnêteté",
  "Partager son repas": "Solidarité",
  "Aider un voisin malade": "Solidarité",
  "Donner des habits à une famille": "Solidarité",
  "Parler devant la classe malgré sa peur": "Courage",
  "Aller seul chercher de l'eau la nuit": "Courage",
  "Dire non à un copain qui veut mal faire": "Courage",
  "Rendre le livre comme promis": "Parole donnée",
  "Arriver à l'heure promise": "Parole donnée",
  "Garder un secret promis": "Parole donnée",
  "Offrir à boire à un invité": "Teranga",
  "Offrir une place à un voyageur": "Teranga",
  "Saluer chaleureusement un invité": "Teranga",
};
const VALUE_LINK_T: Record<string, string> = {
  Honnêteté: "Rendre ce qu'on a trouvé",
  Solidarité: "Aider quelqu'un qui a un problème",
  Courage: "Agir malgré la peur",
  "Parole donnée": "Faire ce qu'on a promis",
  Teranga: "Bien accueillir un invité",
};

// ===== La vie en communauté =====
const COMMON_T = ["Puits", "Marché", "Terrain de sport"];
const PERSONAL_T = ["Mon cahier", "Mon ballon", "Ma chambre", "Ma natte"];
const COMMUNITY_LINK_T: Record<string, string> = {
  Puits: "Garder l'eau propre",
  Marché: "Ne pas jeter de déchets",
  "Terrain de sport": "Jouer chacun son tour",
  Voisin: "L'aider quand il a un problème",
  Quartier: "Respecter les règles de tous",
};

// ===== Le coloriage magique et reproduire un modèle =====
const WARM_T = ["Rouge", "Orange", "Jaune"];
const COLD_T = ["Bleu", "Vert", "Violet"];
const TECHNIQUES_T = ["Quadrillage", "Calque", "Pochoir", "Pliage", "Collage"];
const TECHNIQUE_LINK_T: Record<string, string> = {
  Quadrillage: "Copier un dessin case par case",
  Calque: "Suivre les traits à travers un papier transparent",
  Pochoir: "Peindre dans les trous d'une feuille découpée",
  Pliage: "Faire une forme en rabattant le papier",
  Collage: "Fixer des morceaux sur une feuille",
};

// ===== Les mélodies : les notes vont de do à si =====
const NOTE_RANK: Record<string, number> = { Do: 0, Ré: 1, Mi: 2, Fa: 3, Sol: 4, La: 5, Si: 6 };
const stepsOf = (text: string): number[] => text.split(", ").map((note) => NOTE_RANK[note] ?? -1);
const rising = (steps: readonly number[]) => steps.length >= 3 && steps.every((step, i) => i === 0 || step > steps[i - 1]);
const falling = (steps: readonly number[]) => steps.length >= 3 && steps.every((step, i) => i === 0 || step < steps[i - 1]);

// ===== L'hymne national et les chants =====
const ANTHEM_DO_T = ["Se tenir debout", "Se tenir droit", "Chanter avec les autres", "Écouter en silence"];
const ANTHEM_DONT_T = ["Bavarder", "S'asseoir par terre", "Jouer avec ses amis", "Rire fort"];
const ANTHEM_LINK_T: Record<string, string> = {
  Titre: "Le Lion rouge",
  Auteur: "Léopold Sédar Senghor",
  Moment: "Le lever des couleurs",
  Posture: "Debout et bien droit",
  Accompagnement: "Des gestes et des instruments",
};

// ===== Jouer une scène =====
const LIFE_SCENES_T = ["Acheter des mangues au marché", "Se faire soigner au dispensaire", "Faire coudre un boubou chez le tailleur", "Faire ses devoirs à la maison"];
const IMAGINARY_SCENES_T = ["Un lion qui parle au roi", "Un voyage sur la lune", "Un arbre qui danse", "Un poisson qui joue au football"];
const STAGE_LINK_T: Record<string, string> = {
  Saynète: "Une petite scène jouée",
  Parodie: "Imiter en exagérant pour faire rire",
  Rôle: "Le personnage qu'on joue",
  Répétition: "Jouer la scène avant le spectacle",
  Dramatisation: "Jouer une scène comme au théâtre",
};
const STAGE_PLACES_T = ["Marché", "Dispensaire", "Atelier du tailleur"];
const STAGE_ROLES_T = ["Vendeur", "Client", "Tailleur", "Infirmier", "Malade"];

// Les lignes que les gabarits posent, relues une à une : (énoncé ou phrase, bonne réponse, mauvais choix permis) pour les questions et les trous,
// (énoncé, écritures admises) pour les réponses à écrire, (énoncé, suite) pour les ordres.
const DROIT_QCM_T: [string, string, string[]][] = [
  ["Après les devoirs, Mariama a le temps de s'amuser. Quel droit est respecté ?", "Jouer", ["Aller à l'école", "Être protégé"]],
  ["Les enfants dansent et chantent sous le grand arbre. Quel droit est respecté ?", "Jouer", ["Avoir un nom", "Être soigné"]],
  ["Chaque enfant du quartier est inscrit sur le registre de la mairie. Quel droit est respecté ?", "Avoir un nom", ["Être protégé", "Être soigné"]],
  ["Fatou reçoit son prénom le jour de sa naissance. Quel droit est respecté ?", "Avoir un nom", ["Jouer", "Être soigné"]],
  ["Ibou part à l'école chaque matin avec son cartable. Quel droit est respecté ?", "Aller à l'école", ["Jouer", "Être soigné"]],
  ["Awa a de la fièvre et l'infirmier la soigne. Quel droit est respecté ?", "Être soigné", ["Avoir un nom", "Jouer"]],
  ["Un acte de naissance écrit le prénom de Modou. Quel droit est respecté ?", "Avoir un nom", ["Aller à l'école", "Être protégé"]],
  ["Les enfants courent et rient dans la cour. Quel droit est respecté ?", "Jouer", ["Avoir un nom", "Être soigné"]],
  ["Une grande personne éloigne Modou d'un fil électrique tombé. Quel droit est respecté ?", "Être protégé", ["Avoir un nom", "Jouer"]],
  ["Aminata apprend à lire avec ses camarades. Quel droit est respecté ?", "Aller à l'école", ["Avoir un nom", "Être protégé"]],
  ["Un médecin examine Cheikh quand il a mal au ventre. Quel droit est respecté ?", "Être soigné", ["Aller à l'école", "Jouer"]],
  ["Les adultes surveillent les enfants près du fleuve. Quel droit est respecté ?", "Être protégé", ["Aller à l'école", "Être soigné"]],
];
const DEVOIR_QCM_T: [string, string, string[]][] = [
  ["Ibou porte l'eau pour sa mère. Quel devoir respecte-t-il ?", "Aider à la maison", ["Respecter les autres", "Travailler à l'école"]],
  ["Cheikh dit bonjour à tous ses camarades. Quel devoir respecte-t-il ?", "Respecter les autres", ["Aider à la maison", "Travailler à l'école"]],
  ["Pape prête son crayon sans se moquer de son ami. Quel devoir respecte-t-il ?", "Respecter les autres", ["Aider à la maison", "Travailler à l'école"]],
  ["Mariama fait tous ses exercices de calcul sans copier. Quel devoir respecte-t-elle ?", "Travailler à l'école", ["Aider à la maison", "Respecter les autres"]],
  ["Awa range sa natte et ses habits. Quel devoir respecte-t-elle ?", "Aider à la maison", ["Respecter les autres", "Travailler à l'école"]],
  ["Modou lave les assiettes après le repas. Quel devoir respecte-t-il ?", "Aider à la maison", ["Respecter les autres", "Travailler à l'école"]],
  ["Fatou balaie la cour avant de partir à l'école. Quel devoir respecte-t-elle ?", "Aider à la maison", ["Respecter les autres", "Travailler à l'école"]],
  ["Ali apprend sa leçon chaque soir. Quel devoir respecte-t-il ?", "Travailler à l'école", ["Aider à la maison", "Respecter les autres"]],
];
const DROIT_TROU_T: [string, string, string[]][] = [
  ["L'enfant doit ___ ses camarades.", "respecter", ["frapper", "gronder"]],
  ["Travailler en classe est un ___ de l'élève.", "devoir", ["cadeau", "jeu"]],
  ["Un enfant malade a le droit d'être ___.", "soigné", ["grondé", "puni"]],
  ["Avoir un nom est un ___ de l'enfant.", "droit", ["devoir", "jeu"]],
  ["Un enfant a le droit d'être ___ du danger.", "protégé", ["puni", "séparé"]],
  ["Tous les enfants ont le droit de ___.", "jouer", ["frapper", "insulter"]],
  ["Un enfant qui a mal à la dent a le droit d'aller chez le ___.", "médecin", ["menuisier", "tailleur"]],
  ["Aider à la maison est un ___ de l'enfant.", "devoir", ["cadeau", "droit"]],
  ["Les enfants ont le droit de ___ à l'école.", "apprendre", ["dormir", "voler"]],
  ["Pour un enfant, aller à l'école est un ___.", "droit", ["cadeau", "jeu"]],
  ["L'enfant doit ___ sa mère à la maison.", "aider", ["gronder", "oublier"]],
  ["Chaque enfant a le droit d'avoir un ___.", "nom", ["champ", "cheval"]],
];
const DROIT_ECRIRE_T: [string, string[]][] = [
  ["Comment appelle-t-on ce que l'enfant doit faire, comme aider à la maison ? Écris le mot.", ["devoir", "un devoir"]],
  ["Comment appelle-t-on ce que l'enfant reçoit, comme avoir un nom ? Écris le mot.", ["droit", "un droit"]],
  ["Le prénom d'un enfant est son ___. Écris le mot.", ["nom"]],
  ["Que doit faire l'enfant pour sa mère à la maison ? Écris le verbe.", ["aider"]],
  ["Que fait un élève en classe pour apprendre ? Écris le verbe.", ["travailler", "apprendre", "étudier"]],
  ["Quel droit permet à un enfant malade d'aller chez le médecin ? Écris le mot.", ["soigné", "être soigné", "soins"]],
  ["Quel verbe veut dire s'amuser, comme à la récréation ? Écris le verbe.", ["jouer"]],
  ["Que doit faire l'enfant avec ses camarades ? Écris le verbe.", ["respecter"]],
];
const PAIX_SITUATION_T: [string, string, string[]][] = [
  ["Un grand veut forcer un petit à donner son goûter. Que faire ?", "Refuser la force et appeler un adulte", ["Donner le goûter et se taire", "Frapper le grand en retour"]],
  ["Un nouvel élève arrive dans la classe. Comment l'accueillir ?", "Avec le sourire et du respect", ["En l'ignorant", "En se moquant de lui"]],
  ["Fatou a cassé le crayon de Mariama. Que doit-elle faire ?", "Dire qu'elle regrette", ["Accuser une autre élève", "Cacher le crayon"]],
  ["On entend des cris au fond de la classe. Que peut-on faire ?", "Demander à chacun de se calmer", ["Crier plus fort que tout le monde", "Jeter une chaise"]],
  ["Une dispute éclate dans la cour. Qui peut aider à faire la paix ?", "Un camarade qui écoute les deux", ["Un enfant qui crie plus fort", "Un enfant qui prend un bâton"]],
  ["Une camarade pleure après une moquerie. Que faire ?", "Lui demander pardon", ["Dire que ce n'est rien", "Rire encore plus fort"]],
  ["Deux élèves ont des habitudes différentes. Que faire ?", "Accepter ces différences", ["Obliger l'autre à changer", "Se moquer de lui"]],
  ["Ibou a bousculé un ami sans le vouloir. Que fait-il ?", "Il s'excuse tout de suite", ["Il dit que c'est la faute de son ami", "Il s'enfuit en courant"]],
  ["Pape et Cheikh veulent le même jeu. Quelle solution est juste ?", "Jouer chacun son tour", ["Casser le jeu", "Se battre pour le jeu"]],
  ["Deux amis se disputent pour un ballon. Que peut faire un élève ?", "Les écouter l'un après l'autre", ["Les frapper tous les deux", "Rire de leur dispute"]],
  ["Modou est en colère contre son ami. Que peut-il faire ?", "Lui parler calmement", ["Le pousser très fort", "Ne plus jamais lui parler"]],
  ["Un camarade se moque de la tenue d'Awa. Que fais-tu ?", "Je lui dis d'arrêter", ["Je me moque aussi", "Je ris avec les autres"]],
];
const PAIX_MOT_T: [string, string, string[]][] = [
  ["Que montre un enfant qui accepte une autre façon de penser ?", "Tolérance", ["Moquerie", "Violence"]],
  ["Comment appelle-t-on celui qui aide deux personnes à faire la paix ?", "Médiateur", ["Menteur", "Voleur"]],
  ["Que veut dire le mot tolérance ?", "Accepter les différences", ["Imposer ses idées", "Éviter les autres"]],
  ["Que veut dire le mot dialogue ?", "Se parler pour se comprendre", ["Garder le silence", "Se battre pour gagner"]],
  ["Que veut dire le mot médiation ?", "Aider deux personnes à faire la paix", ["Gagner contre un adversaire", "Punir les deux personnes"]],
  ["Que refuse-t-on quand on dit non à la violence ?", "Les coups et les insultes", ["Les conseils des adultes", "Les jeux entre amis"]],
  ["Quel mot veut dire se parler pour régler un problème ?", "Dialogue", ["Moquerie", "Violence"]],
  ["Quel mot veut dire rire de quelqu'un pour lui faire de la peine ?", "Moquerie", ["Dialogue", "Médiation"]],
];
const PAIX_ORDRE_T: [string, string[]][] = [
  ["Mets ces étapes dans l'ordre du temps pour régler une dispute.", ["On se calme", "On s'écoute", "On cherche un accord"]],
  ["Mets ces étapes dans l'ordre du temps pour faire la paix.", ["On dit qu'on regrette", "On demande pardon", "On se serre la main"]],
  ["Mets ces événements dans l'ordre du temps.", ["Deux amis se disputent", "Un camarade vient les écouter", "Les deux amis font la paix"]],
  ["Mets ces événements dans l'ordre du temps.", ["Un enfant se moque d'un autre", "Un camarade lui dit d'arrêter", "Il présente ses excuses"]],
];
const PAIX_TROU_T: [string, string, string[]][] = [
  ["Le dialogue, c'est se ___ pour se comprendre.", "parler", ["battre", "cacher"]],
  ["Se moquer des autres leur fait de la ___.", "peine", ["fête", "joie"]],
  ["La ___ nous apprend à accepter les différences.", "tolérance", ["moquerie", "violence"]],
  ["Les enfants différents doivent être ___.", "respectés", ["battus", "moqués"]],
  ["Un médiateur aide deux personnes à faire la ___.", "paix", ["chasse", "guerre"]],
  ["Pour régler un problème, on utilise le ___.", "dialogue", ["bâton", "silence"]],
  ["On dit non à la ___ et aux moqueries.", "violence", ["amitié", "paix"]],
  ["Quand on se dispute, on doit d'abord se ___.", "calmer", ["battre", "cacher"]],
  ["Pour faire la paix, on demande ___.", "pardon", ["punition", "vengeance"]],
  ["Un camarade qui écoute les deux amis est un ___.", "médiateur", ["menteur", "voleur"]],
  ["Après une dispute, on cherche un ___ avec l'autre.", "accord", ["caillou", "combat"]],
  ["Insulter un camarade est un manque de ___.", "respect", ["force", "temps"]],
];
const PAIX_ECRIRE_T: [string, string[]][] = [
  ["Comment appelle-t-on celui qui aide deux personnes à faire la paix ? Écris le mot.", ["médiateur", "mediateur", "un médiateur"]],
  ["Que demande-t-on quand on a fait de la peine à quelqu'un ? Écris le mot.", ["pardon", "des excuses", "excuses"]],
  ["Que doit-on refuser pour vivre en paix ? Écris le mot.", ["violence", "la violence"]],
  ["Rire de quelqu'un pour faire de la peine est une ___. Écris le mot.", ["moquerie", "une moquerie"]],
  ["Quel mot veut dire se parler pour se comprendre ? Écris le mot.", ["dialogue", "le dialogue"]],
  ["Que fait un médiateur avec les deux amis ? Écris le verbe.", ["écouter", "ecouter"]],
  ["Quel mot veut dire accepter les différences ? Écris le mot.", ["tolérance", "tolerance", "la tolérance"]],
  ["Quand on a un problème avec un ami, il faut en ___. Écris le verbe.", ["parler", "discuter"]],
];
const VALEUR_SITUATION_T: [string, string, string[]][] = [
  ["Les élèves apportent du riz à une famille dont la case a brûlé. Quelle valeur montrent-ils ?", "Solidarité", ["Courage", "Honnêteté"]],
  ["Une famille accueille un voyageur et lui offre à manger et un lit. Quelle valeur montre-t-elle ?", "Teranga", ["Courage", "Honnêteté"]],
  ["Ali ne copie pas sur son voisin pendant la dictée. Quelle valeur montre-t-il ?", "Honnêteté", ["Solidarité", "Teranga"]],
  ["Fatou ose parler devant toute la classe malgré sa peur. Quelle valeur montre-t-elle ?", "Courage", ["Honnêteté", "Teranga"]],
  ["Awa salue chaleureusement une invitée et lui offre de l'eau fraîche. Quelle valeur montre-t-elle ?", "Teranga", ["Courage", "Parole donnée"]],
  ["Aminata a dit qu'elle viendrait à midi et elle arrive à midi. Quelle valeur montre-t-elle ?", "Parole donnée", ["Courage", "Solidarité"]],
  ["Cheikh partage son goûter avec un camarade qui n'a rien. Quelle valeur montre-t-il ?", "Solidarité", ["Courage", "Honnêteté"]],
  ["Mariama dit la vérité à sa mère sur la note du cahier. Quelle valeur montre-t-elle ?", "Honnêteté", ["Solidarité", "Teranga"]],
  ["Un voisin est malade et Fatou porte son seau d'eau. Quelle valeur montre-t-elle ?", "Solidarité", ["Parole donnée", "Teranga"]],
  ["Awa trouve un stylo dans la cour et le rend. Quelle valeur montre-t-elle ?", "Honnêteté", ["Courage", "Teranga"]],
  ["Awa a peur du noir mais elle va chercher de l'eau pour sa grand-mère. Quelle valeur montre-t-elle ?", "Courage", ["Honnêteté", "Teranga"]],
  ["Moussa avait promis de rendre le livre lundi et il le rend lundi. Quelle valeur montre-t-il ?", "Parole donnée", ["Courage", "Teranga"]],
];
const VALEUR_DEFINITION_T: [string, string, string[]][] = [
  ["Que veut dire être solidaire ?", "Aider ceux qui ont un problème", ["Faire seul son travail", "Garder tout pour soi"]],
  ["Que montre-t-on quand on rend un objet trouvé ?", "Honnêteté", ["Courage", "Teranga"]],
  ["Que veut dire être honnête ?", "Dire la vérité", ["Faire des cadeaux", "Obéir à tout le monde"]],
  ["Quelle valeur consiste à bien recevoir un invité ?", "Teranga", ["Courage", "Solidarité"]],
  ["Quelle valeur consiste à aider un voisin en difficulté ?", "Solidarité", ["Honnêteté", "Parole donnée"]],
  ["Que veut dire avoir du courage ?", "Faire ce qui est juste malgré la peur", ["Fuir tous les problèmes", "Ne jamais avoir peur"]],
  ["Que veut dire le mot teranga ?", "Bien accueillir ses invités", ["Faire un long voyage", "Partager un secret"]],
  ["Que veut dire tenir sa parole ?", "Faire ce qu'on a promis", ["Changer d'avis", "Dire un secret"]],
];
const VALEUR_ORDRE_T: [string, string[]][] = [
  ["Mets ces gestes dans l'ordre du temps pour rendre un objet trouvé.", ["On trouve un objet", "On cherche à qui il est", "On le rend à son propriétaire"]],
  ["Mets ces étapes dans l'ordre du temps pour aider un voisin.", ["On demande ce dont il a besoin", "On va chez lui", "On l'aide"]],
  ["Mets ces gestes dans l'ordre du temps pour accueillir un invité.", ["On salue l'invité", "On lui offre à boire", "On partage le repas"]],
  ["Mets ces étapes dans l'ordre du temps.", ["On fait une promesse", "On pense à la tenir", "On fait ce qu'on a promis"]],
];
const VALEUR_TROU_T: [string, string, string[]][] = [
  ["Celui qui dit la vérité est ___.", "honnête", ["menteur", "méchant"]],
  ["Quand on promet, on doit ___ sa promesse.", "tenir", ["perdre", "vendre"]],
  ["Un invité reçoit un bon ___ chez nous.", "accueil", ["bâton", "silence"]],
  ["Une personne qui tient sa ___ fait ce qu'elle a promis.", "parole", ["chance", "place"]],
  ["Avoir du ___, c'est agir malgré la peur.", "courage", ["sommeil", "talent"]],
  ["Aider un voisin est un geste de ___.", "solidarité", ["colère", "paresse"]],
  ["À l'école comme à la maison, on dit la ___.", "vérité", ["chanson", "fatigue"]],
  ["Chez nous, l'hospitalité se nomme la ___.", "teranga", ["kora", "tama"]],
  ["La teranga, c'est bien ___ ses invités.", "accueillir", ["chasser", "oublier"]],
  ["Celui qui partage avec ceux qui manquent de tout est ___.", "solidaire", ["pressé", "égoïste"]],
  ["Un élève qui ne triche pas montre son ___.", "honnêteté", ["appétit", "sommeil"]],
  ["Dire non à un copain qui veut mal faire demande du ___.", "courage", ["bruit", "temps"]],
];
const VALEUR_ECRIRE_T: [string, string[]][] = [
  ["Que fait-on d'un objet trouvé ? Écris le verbe.", ["rendre", "rapporter"]],
  ["Quand on tient sa promesse, on tient sa ___. Écris le mot.", ["parole", "sa parole"]],
  ["Quelle valeur montre celui qui dit toujours la vérité ? Écris le mot.", ["honnêteté", "honnetete", "l'honnêteté"]],
  ["Celui qui partage avec les autres est ___. Écris le mot.", ["solidaire", "généreux"]],
  ["Quelle valeur montre celui qui agit malgré sa peur ? Écris le mot.", ["courage", "le courage"]],
  ["Que doit-on faire de sa promesse ? Écris le verbe.", ["tenir"]],
  ["Comment appelle-t-on l'accueil des invités au Sénégal ? Écris le mot.", ["teranga", "la teranga"]],
  ["Quelle valeur montre celui qui aide ses voisins ? Écris le mot.", ["solidarité", "solidarite", "la solidarité"]],
];
const COMMUN_BIEN_T: [string, string, string[]][] = [
  ["Lequel de ces lieux est un bien commun du quartier ?", "Marché", ["Ma natte", "Mon ballon"]],
  ["Lequel de ces lieux est un bien commun du quartier ?", "Puits", ["Ma chambre", "Mon cahier"]],
  ["Lequel de ces lieux est un bien commun du quartier ?", "Terrain de sport", ["Ma chambre", "Mon cahier"]],
  ["Qu'est-ce que tout le quartier utilise ensemble ?", "Puits", ["Ma natte", "Mon ballon"]],
  ["Qu'est-ce que tout le quartier utilise ensemble ?", "Marché", ["Ma chambre", "Mon cahier"]],
  ["Qu'est-ce que tout le quartier utilise ensemble ?", "Terrain de sport", ["Ma natte", "Mon ballon"]],
  ["Quel lieu appartient à tous les habitants du quartier ?", "Puits", ["Ma chambre", "Mon ballon"]],
  ["Quel lieu appartient à tous les habitants du quartier ?", "Marché", ["Ma natte", "Mon cahier"]],
];
const COMMUN_REGLE_T: [string, string, string[]][] = [
  ["Le puits est fermé pour être réparé. Que faire ?", "Attendre qu'il soit réparé", ["Casser le puits", "Forcer la porte"]],
  ["Une règle du quartier est affichée. Comment la suit-on ?", "On la respecte comme les autres", ["On fait comme si elle n'existait pas", "On la déchire en petits morceaux"]],
  ["Des voisins dorment. Quelle règle suivre au terrain de sport ?", "Arrêter de jouer tard le soir", ["Jouer toute la nuit", "Mettre la musique très fort"]],
  ["Plusieurs enfants veulent le terrain de sport. Quelle règle suivre ?", "Jouer chacun son tour", ["Empêcher les autres de jouer", "Prendre le terrain par la force"]],
  ["Un enfant veut jeter ses déchets au marché. Où doit-il les mettre ?", "Dans la poubelle", ["Devant la boutique", "Par terre"]],
  ["Le puits du quartier est sale. Que doit-on faire ?", "Le nettoyer ensemble", ["Le laisser comme ça", "Y jeter des déchets"]],
  ["La nuit, des voisins dorment. Que doit-on faire ?", "Parler doucement", ["Crier et chanter fort", "Jouer au tam-tam"]],
  ["Un ballon tombe chez un voisin. Que fait-on ?", "On le demande poliment", ["On casse sa clôture", "On entre sans rien dire"]],
  ["Un nouvel habitant arrive dans le quartier. Que fait-on ?", "On lui explique les règles", ["On l'ignore", "On se moque de lui"]],
  ["Des enfants salissent le marché en jouant. Que leur dit-on ?", "De nettoyer ce qu'ils ont sali", ["De continuer à jouer", "De partir en courant"]],
  ["Le terrain de sport est en désordre après le match. Que faire ?", "Le ranger tous ensemble", ["Casser les buts", "Partir sans rien ranger"]],
  ["On puise de l'eau au puits. Comment faire avec les autres ?", "Attendre son tour", ["Passer devant tout le monde", "Prendre tous les seaux"]],
];
const COMMUN_VOISIN_T: [string, string, string[]][] = [
  ["Un voisin n'a plus de riz. Que peut-on faire ?", "Lui en donner un peu", ["Le lui reprocher", "Rire de lui"]],
  ["Des voisins construisent un toit. Comment aider ?", "Donner un coup de main", ["Cacher les outils", "Regarder sans bouger"]],
  ["Un voisin déménage. Comment s'entraider ?", "Porter ses affaires avec lui", ["Cacher ses affaires", "Rester chez soi"]],
  ["Un enfant du quartier est perdu. Que faire ?", "L'accompagner chez ses parents", ["Le laisser seul", "Se moquer de lui"]],
  ["Une voisine âgée ne peut pas porter son seau. Que faire ?", "Porter son seau pour elle", ["Lui dire de se débrouiller", "Passer sans rien dire"]],
  ["Un voisin est malade. Que peut-on faire ?", "Lui apporter à manger", ["Fermer sa porte", "Rire de lui"]],
  ["Une voisine a un bébé malade. Que peut-on faire ?", "L'aider à aller au dispensaire", ["Faire du bruit près d'elle", "Fermer les volets"]],
  ["La maison d'un voisin a brûlé. Que peut-on faire ?", "Lui donner des habits et un repas", ["Fermer sa porte", "Se moquer de sa maison"]],
];
const COMMUN_ORDRE_T: [string, string[]][] = [
  ["Mets ces étapes dans l'ordre du temps pour aider un voisin.", ["Demander ce dont il a besoin", "Aller chez lui", "L'aider", "Lui dire au revoir"]],
  ["Mets ces gestes dans l'ordre du temps pour nettoyer le puits.", ["On prend des seaux et des balais", "On enlève les déchets", "On rince le bord du puits"]],
  ["Mets ces gestes dans l'ordre du temps pour bien utiliser le terrain de sport.", ["On attend son tour", "On joue", "On range le ballon"]],
  ["Mets ces événements dans l'ordre du temps.", ["Un nouvel habitant arrive", "On lui explique les règles", "Il les respecte avec les autres"]],
];
const COMMUN_TROU_T: [string, string, string[]][] = [
  ["Sur le terrain de sport, on joue chacun son ___.", "tour", ["champ", "prix"]],
  ["Au marché, on met ses déchets dans la ___.", "poubelle", ["natte", "rivière"]],
  ["Il faut garder l'eau du puits ___.", "propre", ["cachée", "sale"]],
  ["Quand un voisin construit, on peut lui donner un coup de ___.", "main", ["pied", "tête"]],
  ["Le puits est un bien ___ du quartier.", "commun", ["cassé", "privé"]],
  ["Les règles du quartier sont les mêmes pour ___.", "tous", ["personne", "un seul"]],
  ["Pour ne pas déranger les voisins, on évite de faire trop de ___ la nuit.", "bruit", ["fumée", "poussière"]],
  ["Entre voisins, on doit s'entraider quand on a un ___.", "problème", ["bonbon", "cadeau"]],
  ["Un nouvel habitant doit connaître les ___ du quartier.", "règles", ["couleurs", "fruits"]],
  ["Le terrain de sport, le puits et le marché sont des biens ___.", "communs", ["cassés", "privés"]],
  ["Dans le quartier, chacun doit ___ les règles.", "respecter", ["cacher", "oublier"]],
  ["On ne ___ pas le puits en y jetant des déchets.", "salit", ["lave", "remplit"]],
];
const COMMUN_ECRIRE_T: [string, string[]][] = [
  ["Comment s'appellent les gens qui habitent à côté de chez nous ? Écris le mot.", ["voisins", "voisin", "les voisins"]],
  ["Que doit-on faire des règles du quartier ? Écris le verbe.", ["respecter"]],
  ["Que fait-on pour un voisin qui a besoin d'aide ? Écris le verbe.", ["aider", "s'entraider"]],
  ["Où doit-on mettre ses déchets au marché ? Écris le mot.", ["poubelle", "la poubelle", "dans la poubelle"]],
  ["Quel lieu donne de l'eau à tout le quartier ? Écris le mot.", ["puits", "le puits"]],
  ["Où va-t-on acheter et vendre dans le quartier ? Écris le mot.", ["marché", "le marché", "marche"]],
  ["Quel bien commun sert à jouer et à faire du sport ? Écris les trois mots.", ["terrain de sport", "le terrain de sport"]],
  ["Comment appelle-t-on ce qui sert à tous les habitants ? Écris deux mots.", ["bien commun", "biens communs", "un bien commun"]],
];
const COULEUR_QCM_T: [string, string, string[]][] = [
  ["Pour dessiner un feu de camp, quelle couleur choisis-tu ?", "Rouge", ["Bleu", "Vert"]],
  ["Quelle couleur est froide ?", "Bleu", ["Jaune", "Rouge"]],
  ["Quelle couleur est chaude ?", "Rouge", ["Bleu", "Vert"]],
  ["Quelle couleur est chaude ?", "Jaune", ["Vert", "Violet"]],
  ["Quelle couleur est chaude ?", "Orange", ["Bleu", "Violet"]],
  ["Pour dessiner un lac calme, quelle couleur choisis-tu ?", "Bleu", ["Orange", "Rouge"]],
  ["Quelle couleur est froide ?", "Vert", ["Orange", "Rouge"]],
  ["Pour dessiner une forêt fraîche, quelle couleur choisis-tu ?", "Vert", ["Jaune", "Rouge"]],
  ["Pour dessiner un coucher de soleil, quelle couleur choisis-tu ?", "Orange", ["Bleu", "Vert"]],
  ["Quelle couleur est froide ?", "Violet", ["Jaune", "Orange"]],
  ["Pour dessiner le soleil du désert, quelle couleur choisis-tu ?", "Jaune", ["Bleu", "Vert"]],
  ["Pour dessiner une mer calme, quelle couleur choisis-tu ?", "Bleu", ["Jaune", "Orange"]],
];
const TECHNIQUE_QCM_T: [string, string, string[]][] = [
  ["On peint dans les trous d'une feuille découpée. Quelle technique est-ce ?", "Pochoir", ["Calque", "Quadrillage"]],
  ["On divise le modèle et la feuille en petites cases égales. Quelle technique est-ce ?", "Quadrillage", ["Collage", "Pliage"]],
  ["On pose un papier transparent sur le modèle et on suit les traits. Quelle technique est-ce ?", "Calque", ["Pliage", "Pochoir"]],
  ["On rabat le papier sur lui-même pour faire une forme. Quelle technique est-ce ?", "Pliage", ["Calque", "Pochoir"]],
  ["Pour décorer une boîte, on colle des morceaux de tissu. Quelle technique est-ce ?", "Collage", ["Pochoir", "Quadrillage"]],
  ["On fixe des morceaux de papier sur une feuille avec de la colle. Quelle technique est-ce ?", "Collage", ["Calque", "Quadrillage"]],
  ["Pour copier un dessin case par case, quelle technique utilise-t-on ?", "Quadrillage", ["Collage", "Pochoir"]],
  ["Pour repasser sur les traits d'un modèle à travers un papier, quelle technique utilise-t-on ?", "Calque", ["Collage", "Quadrillage"]],
  ["Pour décorer une carte, on plie du papier en forme d'étoile. Quelle technique est-ce ?", "Pliage", ["Calque", "Collage"]],
  ["Pour faire un tableau avec des morceaux de tissu et de papier, quelle technique utilise-t-on ?", "Collage", ["Calque", "Pliage"]],
  ["Pour faire un bateau ou un oiseau avec une feuille, quelle technique utilise-t-on ?", "Pliage", ["Collage", "Pochoir"]],
  ["Pour répéter plusieurs fois le même motif, quelle technique utilise-t-on ?", "Pochoir", ["Calque", "Pliage"]],
];
const TECHNIQUE_TROU_T: [string, string, string[]][] = [
  ["Pour décorer un objet, on peut le plier ou le ___.", "coller", ["manger", "vendre"]],
  ["Le ___ fixe des morceaux sur une feuille avec de la colle.", "collage", ["pochoir", "quadrillage"]],
  ["Pour copier un dessin, on peut le diviser en petites ___.", "cases", ["boules", "tiges"]],
  ["Un objet fait pour décorer est un objet ___.", "décoratif", ["bruyant", "comestible"]],
  ["Avec le ___, on copie un dessin case par case.", "quadrillage", ["collage", "pochoir"]],
  ["Le ___ est un papier transparent posé sur le modèle.", "calque", ["pliage", "pochoir"]],
  ["Le ___ fait une forme en rabattant le papier.", "pliage", ["calque", "collage"]],
  ["Avec un ___, on peint dans les trous d'une feuille découpée.", "pochoir", ["calque", "pliage"]],
];
const HYMNE_QCM_T: [string, string, string[]][] = [
  ["Qui a écrit les paroles de l'hymne national ?", "Léopold Sédar Senghor", ["Un griot du village", "Un ministre d'aujourd'hui"]],
  ["Quel est le titre de l'hymne national du Sénégal ?", "Le Lion rouge", ["La Voix du fleuve", "Le Chant du matin"]],
  ["Quand chante-t-on l'hymne national ?", "Au lever des couleurs", ["Pendant la récréation", "À la fin du repas"]],
  ["Comment peut-on accompagner un chant ?", "Avec des gestes et des instruments", ["Avec des cris très forts", "En restant sans bouger"]],
  ["Qui chante l'hymne au lever des couleurs ?", "Tous les élèves ensemble", ["Seulement la maîtresse", "Un seul élève"]],
  ["Comment se tient-on quand on chante l'hymne ?", "Debout et bien droit", ["Assis par terre", "En courant dans la cour"]],
  ["Que fait-on au lever des couleurs ?", "On chante l'hymne", ["On fait la sieste", "On joue au ballon"]],
  ["Quel nom porte notre hymne national ?", "Le Lion rouge", ["La Voix du fleuve", "Le Chant du matin"]],
  ["Que montre-t-on en chantant l'hymne ?", "Du respect pour notre pays", ["De l'ennui et de la fatigue", "De la colère envers tout le monde"]],
  ["Quel poète a écrit les paroles de notre hymne ?", "Léopold Sédar Senghor", ["Un griot du village", "Un ministre d'aujourd'hui"]],
  ["Quel instrument peut accompagner un chant ?", "Tama", ["Cahier", "Natte"]],
  ["Que doit-on faire pendant le chant de l'hymne ?", "Rester sérieux et attentif", ["Bavarder avec son voisin", "Faire des grimaces"]],
];
const HYMNE_ORDRE_T: [string, string[]][] = [
  ["Mets ces étapes dans l'ordre du temps pour composer un petit chant.", ["Choisir un thème", "Trouver les paroles", "Inventer la mélodie", "Chanter devant la classe"]],
  ["Mets ces gestes dans l'ordre du temps au lever des couleurs.", ["Les élèves se rangent", "On se tient droit", "On chante l'hymne"]],
  ["Mets ces étapes dans l'ordre du temps pour accompagner un chant.", ["On apprend le chant", "On choisit des gestes et un instrument", "On répète ensemble", "On chante avec l'accompagnement"]],
  ["Mets ces étapes dans l'ordre du temps pour apprendre un chant.", ["On écoute le chant", "On le chante phrase par phrase", "On le chante en entier"]],
];
const HYMNE_TROU_T: [string, string, string[]][] = [
  ["On peut accompagner un chant avec des gestes et des ___.", "instruments", ["cahiers", "cailloux"]],
  ["Pendant l'hymne, on se tient ___ et bien droit.", "debout", ["assis", "couché"]],
  ["Dans un chant, les mots s'appellent les ___.", "paroles", ["gestes", "notes"]],
  ["Pour chanter ensemble, on suit la même ___.", "mélodie", ["recette", "route"]],
  ["On chante l'hymne avec ___ et respect.", "sérieux", ["colère", "paresse"]],
  ["Le Lion rouge est notre hymne ___.", "national", ["familial", "étranger"]],
  ["Au lever des couleurs, tous les élèves chantent ___.", "ensemble", ["dehors", "seuls"]],
  ["Pour mettre un chant en valeur, on peut ajouter des ___.", "gestes", ["devoirs", "légumes"]],
  ["Quand on invente un petit chant, on le ___.", "compose", ["mange", "vend"]],
  ["On chante l'hymne au lever des ___.", "couleurs", ["repas", "tambours"]],
  ["Les paroles de l'hymne ont été écrites par Léopold Sédar ___.", "Senghor", ["Ba", "Sarr"]],
  ["Notre hymne national s'appelle Le Lion ___.", "rouge", ["bleu", "vert"]],
];
const HYMNE_ECRIRE_T: [string, string[]][] = [
  ["Que fait-on ensemble au lever des couleurs ? Écris le verbe.", ["chanter"]],
  ["Quel verbe veut dire inventer un petit chant ? Écris le verbe.", ["composer"]],
  ["Au lever de quoi chante-t-on l'hymne ? Écris le mot.", ["couleurs", "des couleurs"]],
  ["Quel est le titre de l'hymne national ? Écris les trois mots.", ["le lion rouge", "Le Lion rouge"]],
  ["Comment se tient-on pendant l'hymne ? Écris le mot.", ["debout"]],
  ["Qui a écrit les paroles de l'hymne national ? Écris son nom de famille.", ["senghor", "Senghor"]],
  ["Avec quoi accompagne-t-on un chant, en plus des gestes ? Écris le mot.", ["instruments", "instrument", "un instrument"]],
  ["Comment appelle-t-on les mots d'un chant ? Écris le mot.", ["paroles", "les paroles"]],
];
const THEATRE_LIEU_T: [string, string, string[]][] = [
  ["Le tailleur prend les mesures d'un client. Quel est le lieu de la scène ?", "Atelier du tailleur", ["Dispensaire", "Marché"]],
  ["Une infirmière prend la température d'un enfant. Quel est le lieu de la scène ?", "Dispensaire", ["Atelier du tailleur", "Marché"]],
  ["On pèse du riz et on discute le prix. Quel est le lieu de la scène ?", "Marché", ["Atelier du tailleur", "Dispensaire"]],
  ["On coud un boubou avec une machine. Quel est le lieu de la scène ?", "Atelier du tailleur", ["Dispensaire", "Marché"]],
  ["On attend son tour pour être soigné. Quel est le lieu de la scène ?", "Dispensaire", ["Atelier du tailleur", "Marché"]],
  ["On regarde des étals de mangues et de légumes. Quel est le lieu de la scène ?", "Marché", ["Atelier du tailleur", "Dispensaire"]],
  ["Un client choisit un beau tissu pour sa tenue. Quel est le lieu de la scène ?", "Atelier du tailleur", ["Dispensaire", "Marché"]],
  ["Un médecin donne des médicaments au malade. Quel est le lieu de la scène ?", "Dispensaire", ["Atelier du tailleur", "Marché"]],
  ["Une vendeuse appelle les clients pour ses tomates. Quel est le lieu de la scène ?", "Marché", ["Atelier du tailleur", "Dispensaire"]],
  ["Une affiche rappelle de se faire vacciner. Quel est le lieu de la scène ?", "Dispensaire", ["Atelier du tailleur", "Marché"]],
  ["On entend les cris des vendeurs et on marchande. Quel est le lieu de la scène ?", "Marché", ["Atelier du tailleur", "Dispensaire"]],
  ["Le client essaie son pantalon devant le miroir. Quel est le lieu de la scène ?", "Atelier du tailleur", ["Dispensaire", "Marché"]],
];
const THEATRE_ROLE_T: [string, string, string[]][] = [
  ["Au marché, qui achète des mangues ?", "Client", ["Tailleur", "Vendeur"]],
  ["Dans la scène au dispensaire, qui soigne les malades ?", "Infirmier", ["Client", "Tailleur"]],
  ["Chez le tailleur, qui commande un boubou ?", "Client", ["Infirmier", "Tailleur"]],
  ["Au dispensaire, qui vient se faire soigner ?", "Malade", ["Infirmier", "Vendeur"]],
  ["Au dispensaire, qui donne les médicaments ?", "Infirmier", ["Client", "Vendeur"]],
  ["Au marché, qui discute le prix pour acheter ?", "Client", ["Infirmier", "Tailleur"]],
  ["Dans la scène chez le tailleur, qui prend les mesures ?", "Tailleur", ["Client", "Vendeur"]],
  ["Dans la scène au marché, qui vend les légumes ?", "Vendeur", ["Client", "Infirmier"]],
];
const THEATRE_PARODIE_T: [string, string, string[]][] = [
  ["Que veut dire une scène de la vie courante ?", "Un moment de tous les jours", ["Un conte de dragons", "Un voyage sur la lune"]],
  ["Que fait-on dans une parodie ?", "On imite en exagérant pour faire rire", ["On reste immobile sans parler", "On récite un texte sérieux"]],
  ["Que veut dire le mot saynète ?", "Une petite scène jouée", ["Un long chant triste", "Un plat de riz"]],
  ["Que fait un acteur qui interprète un rôle ?", "Il joue un personnage", ["Il copie son voisin", "Il écrit le texte"]],
  ["Que veut dire répéter une scène ?", "La jouer plusieurs fois avant le spectacle", ["La jouer sans les costumes", "La montrer une seule fois"]],
  ["Que veut dire une scène imaginaire ?", "Une histoire inventée", ["Un lieu qui existe", "Une leçon de maths"]],
  ["Que veut dire dramatiser une scène ?", "La jouer comme au théâtre", ["L'écrire sur un cahier", "La raconter assis"]],
  ["Quel est le but d'une parodie ?", "Faire rire le public", ["Endormir le public", "Faire peur au public"]],
];
const THEATRE_ORDRE_T: [string, string[]][] = [
  ["Mets ces étapes dans l'ordre du temps.", ["Distribuer les rôles", "Apprendre ses répliques", "Répéter ensemble", "Jouer la saynète"]],
  ["Mets ces événements dans l'ordre du temps.", ["Le vendeur installe ses mangues", "Le client demande le prix", "Ils discutent et se mettent d'accord", "Le client paie et repart"]],
  ["Mets ces événements dans l'ordre du temps.", ["Un malade arrive", "L'infirmière l'examine", "Elle lui donne un médicament"]],
  ["Mets ces étapes dans l'ordre du temps pour préparer une saynète.", ["Choisir le sujet", "Écrire les répliques", "Distribuer les rôles", "Répéter la scène", "Jouer devant le public"]],
];
const THEATRE_TROU_T: [string, string, string[]][] = [
  ["Avant le spectacle, on doit ___ la scène.", "répéter", ["oublier", "vendre"]],
  ["Une scène imaginaire est une histoire ___.", "inventée", ["lue", "vraie"]],
  ["L'acteur joue un ___ dans la scène.", "rôle", ["marché", "repas"]],
  ["Pour jouer un rôle, l'acteur ___ un personnage.", "interprète", ["achète", "efface"]],
  ["Dramatiser une scène, c'est la jouer comme au ___.", "théâtre", ["marché", "stade"]],
  ["Pour bien jouer, on apprend ses ___.", "répliques", ["cailloux", "sandales"]],
  ["Dans une scène de la vie courante, on joue un moment de tous les ___.", "jours", ["lions", "rêves"]],
  ["Au marché, le ___ vend ses mangues.", "vendeur", ["infirmier", "tailleur"]],
  ["Dans une ___, on imite en exagérant pour faire rire.", "parodie", ["leçon", "prière"]],
  ["Au dispensaire, l'infirmier ___ les malades.", "soigne", ["coud", "vend"]],
  ["Une ___ est une petite scène jouée.", "saynète", ["chanson", "danse"]],
  ["Chez le tailleur, on coud un ___.", "boubou", ["ballon", "puits"]],
];
const THEATRE_ECRIRE_T: [string, string[]][] = [
  ["Que fait-on avant le spectacle pour bien jouer ? Écris le verbe.", ["répéter", "repeter"]],
  ["Comment appelle-t-on les mots que dit chaque acteur ? Écris le mot.", ["répliques", "réplique", "texte"]],
  ["Qui vend des légumes dans la scène du marché ? Écris le mot.", ["vendeur", "vendeuse", "marchand"]],
  ["Comment appelle-t-on une scène où l'on imite en exagérant pour faire rire ? Écris le mot.", ["parodie", "une parodie"]],
  ["Qui prend les mesures d'un client pour lui coudre un boubou ? Écris le mot.", ["tailleur", "le tailleur"]],
  ["Comment appelle-t-on une petite scène jouée ? Écris le mot.", ["saynète", "saynete", "une saynète"]],
  ["Qui soigne les malades dans la scène du dispensaire ? Écris le mot.", ["infirmier", "infirmière", "médecin"]],
  ["Quel mot veut dire le personnage qu'on joue ? Écris le mot.", ["rôle", "role", "un rôle"]],
];

// ---------------------------------------------------------------------------
// Une vérification par gabarit
// ---------------------------------------------------------------------------

/** Les choix d'une question sont tous dans la liste de ce que la question traite. */
const within = (names: readonly string[]): Check => (exo) => ok(optionsOf(exo).every((option) => names.includes(option)), `choix hors liste : ${optionsOf(exo).join(" | ")}`);
const levelOf = (exo: Exo) => (exo.payload.game as { level: number }).level;

const CHECKS: Record<string, Check> = {
  // ----- Mes droits et mes devoirs -----
  "ce2-droit-qcm": both(checkQuestion(DROIT_QCM_T), within(RIGHTS_T)),
  "ce2-devoir-qcm": both(checkQuestion(DEVOIR_QCM_T), within(DUTIES_T)),
  "ce2-droit-glisser": checkSort(zoneMap([[RIGHTS_T, "Droit"], [DUTIES_T, "Devoir"]]), [["Droit", "Devoir"]]),
  "ce2-droit-relier": checkLink({ "Relie chaque droit à un exemple.": RIGHT_EXAMPLE_T }),
  "ce2-droit-trou": checkGap(DROIT_TROU_T),
  "ce2-droit-ecrire": checkWrite(DROIT_ECRIRE_T),

  // ----- Vivre en paix -----
  "ce2-paix-situation": checkQuestion(PAIX_SITUATION_T),
  "ce2-paix-mot": checkQuestion(PAIX_MOT_T),
  "ce2-paix-glisser": checkSort(zoneMap([[ACCEPTED_T, "On accepte"], [REFUSED_T, "On refuse"]]), [["On accepte", "On refuse"]]),
  "ce2-paix-relier": checkLink({ "Relie chaque mot à son sens.": PEACE_LINK_T }),
  "ce2-paix-ordre": checkOrder(PAIX_ORDRE_T),
  "ce2-paix-trou": checkGap(PAIX_TROU_T),
  "ce2-paix-ecrire": checkWrite(PAIX_ECRIRE_T),

  // ----- Les bonnes valeurs -----
  "ce2-valeur-situation": both(checkQuestion(VALEUR_SITUATION_T), within(VALUES_T)),
  "ce2-valeur-definition": checkQuestion(VALEUR_DEFINITION_T),
  "ce2-valeur-glisser": (exo) =>
    all(
      ok(exo.prompt === "Glisse chaque scène sous la valeur qu'elle montre.", `énoncé inconnu : ${exo.prompt}`),
      ok(zonesOf(exo).length === 2 && zonesOf(exo).every((zone) => VALUES_T.includes(zone)), `cases ${zonesOf(exo).join(" | ")}`),
      ...itemsOf(exo).map((item) => ok(VALUE_OF_ACTION[item.text] === item.correctZone, `« ${item.text} » montre « ${VALUE_OF_ACTION[item.text]} », pas « ${item.correctZone} »`)),
      ok(itemsOf(exo).length === 4, "quatre scènes"),
    ),
  "ce2-valeur-relier": checkLink({ "Relie chaque valeur à son exemple.": VALUE_LINK_T }),
  "ce2-valeur-ordre": checkOrder(VALEUR_ORDRE_T),
  "ce2-valeur-trou": checkGap(VALEUR_TROU_T),
  "ce2-valeur-ecrire": checkWrite(VALEUR_ECRIRE_T),

  // ----- La vie en communauté -----
  "ce2-commun-bien": both(checkQuestion(COMMUN_BIEN_T), (exo) => ok(COMMON_T.includes(rightOption(exo)) && wrongOf(exo).every((option) => PERSONAL_T.includes(option)), `biens ${optionsOf(exo).join(" | ")}`)),
  "ce2-commun-regle": checkQuestion(COMMUN_REGLE_T),
  "ce2-commun-voisin": checkQuestion(COMMUN_VOISIN_T),
  "ce2-commun-glisser": checkSort(zoneMap([[COMMON_T, "Bien commun"], [PERSONAL_T, "Bien personnel"]]), [["Bien commun", "Bien personnel"]]),
  "ce2-commun-relier": checkLink({ "Relie chaque lieu ou personne à ce qu'on doit faire.": COMMUNITY_LINK_T }),
  "ce2-commun-ordre": checkOrder(COMMUN_ORDRE_T),
  "ce2-commun-trou": checkGap(COMMUN_TROU_T),
  "ce2-commun-ecrire": checkWrite(COMMUN_ECRIRE_T),

  // ----- Le coloriage magique -----
  "ce2-couleur-qcm": both(checkQuestion(COULEUR_QCM_T), within([...WARM_T, ...COLD_T])),
  "ce2-couleur-glisser": checkSort(zoneMap([[WARM_T, "Chaudes"], [COLD_T, "Froides"]]), [["Chaudes", "Froides"]]),

  // ----- Reproduire un modèle -----
  "ce2-technique-qcm": both(checkQuestion(TECHNIQUE_QCM_T), within(TECHNIQUES_T)),
  "ce2-technique-relier": checkLink({ "Relie chaque technique à ce qu'on fait.": TECHNIQUE_LINK_T }),
  "ce2-technique-trou": checkGap(TECHNIQUE_TROU_T),

  // ----- Les mélodies : calculées d'après l'ordre des notes -----
  "ce2-melodie-choisir": (exo) => {
    const count = levelOf(exo) <= 2 ? 3 : 4;
    if (exo.prompt === "Quelles mélodies sont pareilles ?") {
      const pairs = optionsOf(exo).map((option) => option.split(" et ").map(stepsOf));
      const same = (pair: number[][]) => pair.length === 2 && sameSeq(pair[0].map(String), pair[1].map(String));
      return all(
        ok(pairs.every((pair) => pair.length === 2 && pair.every((steps) => steps.length === count && steps.every((step) => step >= 0))), `mélodies mal écrites : ${optionsOf(exo).join(" | ")}`),
        ok(pairs.filter(same).length === 1, `une seule paire doit être pareille : ${optionsOf(exo).join(" | ")}`),
        ok(same(pairs[optionsOf(exo).indexOf(rightOption(exo))]), `la bonne paire n'est pas pareille : ${rightOption(exo)}`),
      );
    }
    const up = exo.prompt === "Quelle mélodie monte ?";
    if (!up && exo.prompt !== "Quelle mélodie descend ?") return `question inconnue : ${exo.prompt}`;
    const direction = up ? rising : falling;
    const all3 = optionsOf(exo).map(stepsOf);
    return all(
      ok(all3.every((steps) => steps.length === count && steps.every((step) => step >= 0)), `mélodies mal écrites : ${optionsOf(exo).join(" | ")}`),
      ok(all3.filter(direction).length === 1, `une seule mélodie doit ${up ? "monter" : "descendre"} : ${optionsOf(exo).join(" | ")}`),
      ok(direction(stepsOf(rightOption(exo))), `« ${rightOption(exo)} » ne ${up ? "monte" : "descend"} pas`),
    );
  },
  "ce2-melodie-trou": (exo) => {
    const match = /^La mélodie (.+) ___\.$/u.exec(textOf(exo));
    if (!match) return `phrase inconnue : ${textOf(exo)}`;
    const steps = stepsOf(match[1]);
    const answer = blankOf(exo).answer;
    return all(
      ok(steps.length === (levelOf(exo) <= 2 ? 3 : 4) && steps.every((step) => step >= 0), `notes : ${match[1]}`),
      ok(rising(steps) || falling(steps), `la mélodie ne fait que monter ou descendre : ${match[1]}`),
      ok(answer === (rising(steps) ? "monte" : "descend"), `la mélodie ${match[1]} ${rising(steps) ? "monte" : "descend"}, le trou dit « ${answer} »`),
      ok(same(blankOf(exo).options, ["monte", "descend", "s'arrête"]), `choix ${blankOf(exo).options.join(" | ")}`),
    );
  },

  // ----- L'hymne national et les chants -----
  "ce2-hymne-qcm": checkQuestion(HYMNE_QCM_T),
  "ce2-hymne-glisser": checkSort(zoneMap([[ANTHEM_DO_T, "On le fait"], [ANTHEM_DONT_T, "On ne le fait pas"]]), [["On le fait", "On ne le fait pas"]]),
  "ce2-hymne-relier": checkLink({ "Relie chaque mot à ce qui lui correspond.": ANTHEM_LINK_T }),
  "ce2-hymne-ordre": checkOrder(HYMNE_ORDRE_T),
  "ce2-hymne-trou": checkGap(HYMNE_TROU_T),
  "ce2-hymne-ecrire": checkWrite(HYMNE_ECRIRE_T),

  // ----- Jouer une scène -----
  "ce2-theatre-lieu": both(checkQuestion(THEATRE_LIEU_T), within(STAGE_PLACES_T)),
  "ce2-theatre-role": both(checkQuestion(THEATRE_ROLE_T), within(STAGE_ROLES_T)),
  "ce2-theatre-parodie": checkQuestion(THEATRE_PARODIE_T),
  "ce2-theatre-glisser": checkSort(zoneMap([[LIFE_SCENES_T, "Vie courante"], [IMAGINARY_SCENES_T, "Imaginaire"]]), [["Vie courante", "Imaginaire"]]),
  "ce2-theatre-relier": checkLink({ "Relie chaque mot du théâtre à son sens.": STAGE_LINK_T }),
  "ce2-theatre-ordre": checkOrder(THEATRE_ORDRE_T),
  "ce2-theatre-trou": checkGap(THEATRE_TROU_T),
  "ce2-theatre-ecrire": checkWrite(THEATRE_ECRIRE_T),
};

const KINDS = Object.keys(CHECKS) as GameKind[];
const TOPIC_KINDS: Record<string, string[]> = {
  "ci-ce2-droits": ["ce2-droit-qcm", "ce2-devoir-qcm", "ce2-droit-glisser", "ce2-droit-relier", "ce2-droit-trou", "ce2-droit-ecrire"],
  "ci-ce2-paix": ["ce2-paix-situation", "ce2-paix-mot", "ce2-paix-glisser", "ce2-paix-relier", "ce2-paix-ordre", "ce2-paix-trou", "ce2-paix-ecrire"],
  "ci-ce2-valeurs": ["ce2-valeur-situation", "ce2-valeur-definition", "ce2-valeur-glisser", "ce2-valeur-relier", "ce2-valeur-ordre", "ce2-valeur-trou", "ce2-valeur-ecrire"],
  "ci-ce2-communaute": ["ce2-commun-bien", "ce2-commun-regle", "ce2-commun-voisin", "ce2-commun-glisser", "ce2-commun-relier", "ce2-commun-ordre", "ce2-commun-trou", "ce2-commun-ecrire"],
  "ar-ce2-coloriage": ["ce2-couleur-qcm", "ce2-couleur-glisser"],
  "ar-ce2-reproduire": ["ce2-technique-qcm", "ce2-technique-relier", "ce2-technique-trou"],
  "ar-ce2-melodies": ["ce2-melodie-choisir", "ce2-melodie-trou"],
  "ar-ce2-hymne": ["ce2-hymne-qcm", "ce2-hymne-glisser", "ce2-hymne-relier", "ce2-hymne-ordre", "ce2-hymne-trou", "ce2-hymne-ecrire"],
  "ar-ce2-theatre": ["ce2-theatre-lieu", "ce2-theatre-role", "ce2-theatre-parodie", "ce2-theatre-glisser", "ce2-theatre-relier", "ce2-theatre-ordre", "ce2-theatre-trou", "ce2-theatre-ecrire"],
};
/** Les jeux que les quatre fiches d'arts gardaient déjà, avec leurs places : les gabarits prennent les places qui restent. */
const KEPT_GAMES: Record<string, Record<string, number>> = {
  "ar-ce2-coloriage": { "coloriage-magique": 5, "couleurs-chaudes-froides": 3 },
  "ar-ce2-reproduire": { "pixel-copie": 3, "pixel-memoire": 2, "pixel-symetrie": 2 },
  "ar-ce2-melodies": { "ecoute-melodie": 4, "ecoute-pareil": 4 },
  "ar-ce2-hymne": { "ecoute-motif-rythmique": 2 },
};
const TOPIC_KEYS = Object.keys(TOPIC_KINDS);
const topicOfKind = (kind: string) => TOPIC_KEYS.find((key) => TOPIC_KINDS[key].includes(kind)) as string;
const entryOf = (key: string) => allProgrammeEntries().find((entry) => entry.topic.key === key)!;
const subjectOfKind = (kind: string) => entryOf(topicOfKind(kind)).subject.name;

describe("chaque gabarit de l'instruction civique et des arts du CE2 a sa vérification", () => {
  it("couvre exactement les quarante-neuf gabarits, tous rangés dans une thématique", () => {
    expect(KINDS).toHaveLength(49);
    expect(Object.values(TOPIC_KINDS).flat().sort()).toEqual([...KINDS].sort());
    for (const kind of KINDS) expect(Object.keys(GAME_KINDS), kind).toContain(kind);
  });
});

describe("les gabarits de l'instruction civique et des arts du CE2 recalculent juste, depuis une table écrite à part", () => {
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
  it("séparent les droits des devoirs, et ce qu'on accepte de ce qu'on refuse", () => {
    expect(RIGHTS_T.filter((name) => DUTIES_T.includes(name))).toEqual([]);
    expect(RIGHTS_T).toHaveLength(5);
    expect(DUTIES_T).toHaveLength(3);
    expect(ACCEPTED_T.filter((name) => REFUSED_T.includes(name))).toEqual([]);
    expect(Object.keys(RIGHT_EXAMPLE_T).sort()).toEqual([...RIGHTS_T].sort());
  });

  it("donnent trois scènes à chaque valeur, et un exemple à chacune des cinq", () => {
    expect(VALUES_T).toHaveLength(5);
    for (const value of VALUES_T) expect(Object.values(VALUE_OF_ACTION).filter((entry) => entry === value), value).toHaveLength(3);
    expect(Object.keys(VALUE_LINK_T).sort()).toEqual([...VALUES_T].sort());
  });

  it("séparent les biens communs des biens personnels, les scènes de la vie courante des scènes imaginaires", () => {
    expect(COMMON_T.filter((name) => PERSONAL_T.includes(name))).toEqual([]);
    expect(LIFE_SCENES_T.filter((name) => IMAGINARY_SCENES_T.includes(name))).toEqual([]);
    expect(COMMON_T).toEqual(["Puits", "Marché", "Terrain de sport"]);
  });

  it("donnent trois couleurs chaudes et trois couleurs froides, toutes différentes", () => {
    expect(new Set([...WARM_T, ...COLD_T]).size).toBe(6);
    expect(WARM_T).toEqual(["Rouge", "Orange", "Jaune"]);
    expect(COLD_T).toEqual(["Bleu", "Vert", "Violet"]);
  });

  it("rangent les sept notes de do à si, et reconnaissent une mélodie qui monte ou qui descend", () => {
    expect(Object.keys(NOTE_RANK)).toEqual(["Do", "Ré", "Mi", "Fa", "Sol", "La", "Si"]);
    expect(rising(stepsOf("Do, Ré, Mi"))).toBe(true);
    expect(falling(stepsOf("Do, Ré, Mi"))).toBe(false);
    expect(falling(stepsOf("Sol, Mi, Do"))).toBe(true);
    expect(rising(stepsOf("Do, Sol, Mi"))).toBe(false);
    expect(falling(stepsOf("Do, Sol, Mi"))).toBe(false);
  });

  it("ne citent aucune parole de l'hymne ni aucun autre auteur que Senghor", () => {
    const written = [...Object.values(ANTHEM_LINK_T), ...ANTHEM_DO_T, ...ANTHEM_DONT_T].join(" ");
    expect(fold(written)).not.toMatch(/marseillaise|liberte|patrie/u);
    expect(ANTHEM_LINK_T.Auteur).toBe("Léopold Sédar Senghor");
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
  /** Cherche, parmi quarante graines par niveau, des exercices qui passent `want`, et vérifie que `damage` les rend faux pour la table. */
  function seesDamage(kind: string, want: (exo: Exo) => boolean, damage: (exo: Exo) => Exo): void {
    let tried = 0;
    for (const level of LEVELS) {
      for (let i = 0; i < 40; i++) {
        const exo = draw(kind, level, `mut:${kind}:${i}`);
        if (!want(exo)) continue;
        tried += 1;
        expect(CHECKS[kind](exo), `${kind} : l'exercice juste doit passer : ${exo.prompt}`).toBeNull();
        expect(CHECKS[kind](damage(exo)), `${kind} : l'exercice abîmé doit échouer : ${exo.prompt}`).not.toBeNull();
      }
    }
    expect(tried, kind).toBeGreaterThan(0);
  }

  it("voient aussi un énoncé abîmé : une couleur, une mélodie, un sens, une scène ou une case échangés", () => {
    // « chaude » devenu « froide » : la bonne couleur n'est plus la bonne.
    seesDamage("ce2-couleur-qcm", (exo) => exo.prompt === "Quelle couleur est chaude ?", (exo) => ({ ...exo, prompt: "Quelle couleur est froide ?" }));
    seesDamage("ce2-couleur-qcm", (exo) => exo.prompt === "Quelle couleur est froide ?", (exo) => ({ ...exo, prompt: "Quelle couleur est chaude ?" }));
    // « monte » devenu « descend » : la mélodie qui monte n'est plus la bonne réponse.
    seesDamage("ce2-melodie-choisir", (exo) => exo.prompt === "Quelle mélodie monte ?", (exo) => ({ ...exo, prompt: "Quelle mélodie descend ?" }));
    seesDamage("ce2-melodie-choisir", (exo) => exo.prompt === "Quelle mélodie descend ?", (exo) => ({ ...exo, prompt: "Quelle mélodie monte ?" }));
    // Les notes d'un trou lues à l'envers : « monte » ne va plus.
    seesDamage("ce2-melodie-trou", () => true, (exo) => {
      const match = /^La mélodie (.+) ___\.$/u.exec(textOf(exo)) as RegExpExecArray;
      const reversed = match[1].split(", ").reverse().join(", ");
      return { ...exo, payload: { ...exo.payload, text: `La mélodie ${reversed} ___.` } };
    });
    // Deux cases échangées : chaque étiquette se retrouve dans l'autre case.
    for (const kind of ["ce2-droit-glisser", "ce2-paix-glisser", "ce2-valeur-glisser", "ce2-commun-glisser", "ce2-couleur-glisser", "ce2-hymne-glisser", "ce2-theatre-glisser"]) {
      seesDamage(kind, () => true, (exo) => {
        const [a, b] = zonesOf(exo);
        return { ...exo, payload: { ...exo.payload, zones: [b, a], items: itemsOf(exo).map((item) => ({ ...item, correctZone: item.correctZone === a ? b : a })) } };
      });
    }
    // Deux droites échangées : chaque mot se retrouve avec le sens de l'autre.
    for (const kind of ["ce2-droit-relier", "ce2-paix-relier", "ce2-valeur-relier", "ce2-commun-relier", "ce2-technique-relier", "ce2-hymne-relier", "ce2-theatre-relier"]) {
      seesDamage(kind, () => true, (exo) => {
        const pairs = pairsOf(exo).map((pair) => ({ ...pair }));
        [pairs[0].right, pairs[1].right] = [pairs[1].right, pairs[0].right];
        return { ...exo, payload: { ...exo.payload, pairs } };
      });
    }
    // Le lieu d'une scène changé dans l'énoncé : le marché devient le dispensaire.
    seesDamage("ce2-theatre-lieu", (exo) => rightOption(exo) === "Marché", (exo) => ({ ...exo, payload: { ...exo.payload, correctIndex: optionsOf(exo).indexOf("Dispensaire") === -1 ? 0 : optionsOf(exo).indexOf("Dispensaire") } }));
  });
});

// ===========================================================================
// LES RÈGLES COMMUNES
// ===========================================================================

describe("tous les gabarits de l'instruction civique et des arts du CE2", () => {
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
      if (exo.payload.blanks) expect(apostrophes(textOf(exo)), `${kind} : ${textOf(exo)}`).toBeLessThanOrEqual(1);
    }
  });

  it("n'écrivent aucun émoji, ni dans un énoncé, ni sur une tuile, ni dans un indice", () => {
    for (const { kind, exo } of exos) {
      expect(/\p{Extended_Pictographic}/u.test(exo.prompt), `${kind} : ${exo.prompt}`).toBe(false);
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

  it("n'écrivent pas la bonne option beaucoup plus longue que les autres : l'enfant la devinerait à sa longueur", () => {
    for (const { kind, exo } of exos) {
      if (!exo.payload.options) continue;
      const right = rightOption(exo).length;
      const longest = Math.max(...wrongOf(exo).map((option) => option.length));
      expect(right >= 24 && right >= 2 * longest, `${kind} : ${optionsOf(exo).join(" | ")}`).toBe(false);
    }
  });
});

// ===========================================================================
// LES THÉMATIQUES DU PROGRAMME
// ===========================================================================

describe("les neuf thématiques d'instruction civique et d'arts du CE2", () => {
  const topicOf = (key: string) => entryOf(key).topic;
  const templateSpecs = (key: string) => (topicOf(key).games ?? []).filter((spec) => (spec.kind as string).startsWith("ce2-"));

  it("remplissent les dix places du palier, avec des jeux connus, sans appeler le modèle", () => {
    for (const key of TOPIC_KEYS) {
      const specs = topicOf(key).games ?? [];
      expect(specs.reduce((sum, spec) => sum + spec.count, 0), key).toBe(PALIER_SIZE);
      expect(sameSeq(templateSpecs(key).map((spec) => spec.kind as string).sort(), [...TOPIC_KINDS[key]].sort()), `${key} : ${templateSpecs(key).map((spec) => spec.kind).join(" ")}`).toBe(true);
      for (const spec of specs) {
        expect(Object.keys(GAME_KINDS), `${key} : ${spec.kind}`).toContain(spec.kind);
        expect(spec.vocabulary, `${key} : ${spec.kind}`).toBeUndefined();
      }
      expect(topicUsesModel(key), key).toBe(false);
    }
  });

  it("gardent les jeux que leur fiche avait déjà, avec les mêmes places", () => {
    for (const [key, kept] of Object.entries(KEPT_GAMES)) {
      const specs = topicOf(key).games ?? [];
      for (const [kind, count] of Object.entries(kept)) expect(specs.find((spec) => spec.kind === kind)?.count, `${key} : ${kind}`).toBe(count);
      const keptTotal = Object.values(kept).reduce((sum, count) => sum + count, 0);
      const templateTotal = templateSpecs(key).reduce((sum, spec) => sum + spec.count, 0);
      expect(keptTotal + templateTotal, key).toBe(PALIER_SIZE);
    }
  });

  it("sont celles du CE2, et n'ont changé ni leur clé ni leur nombre de paliers", () => {
    for (const key of TOPIC_KEYS) {
      expect(entryOf(key).klass, key).toBe("CE2");
      expect(topicOf(key).palierCount, key).toBeUndefined();
    }
    expect(TOPIC_KEYS).toHaveLength(9);
    expect(TOPIC_KEYS.slice().sort()).toEqual(["ar-ce2-coloriage", "ar-ce2-hymne", "ar-ce2-melodies", "ar-ce2-reproduire", "ar-ce2-theatre", "ci-ce2-communaute", "ci-ce2-droits", "ci-ce2-paix", "ci-ce2-valeurs"]);
  });

  it("sont parmi les thématiques du CE2 que le modèle n'écrit plus", () => {
    const allCode = allProgrammeEntries()
      .filter((entry) => entry.klass === "CE2" && (entry.topic.games ?? []).reduce((sum, spec) => sum + spec.count, 0) >= PALIER_SIZE)
      .map((entry) => entry.topic.key);
    for (const key of TOPIC_KEYS) expect(allCode, key).toContain(key);
  });

  it("fabriquent des paliers entiers, de dix exercices, dont les gabarits sont tous différents, et qui passent le contrôleur et la table", () => {
    for (const key of TOPIC_KEYS) {
      for (let n = 0; n < 30; n++) {
        for (const palierIndex of [1, 2, 3, 4]) {
          const games = generateGames(topicOf(key).games ?? [], { klass: "CE2", palierIndex, palierCount: 4, seed: `${key}:${n}:${palierIndex}` });
          expect(games, `${key} palier ${palierIndex}`).toHaveLength(PALIER_SIZE);
          const ours = games.filter((game) => (game.payload.game as { kind: string }).kind.startsWith("ce2-"));
          const questions = ours.map((game) => `${game.prompt}|${String(game.payload.text ?? "")}|${game.answerKey}`);
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
            if (kind.startsWith("ce2-")) expect(CHECKS[kind](game as unknown as Exo), `${key} palier ${palierIndex} ${kind} : ${game.prompt}`).toBeNull();
          }
        }
      }
    }
  });

  it("varient les types d'un palier : au moins quatre sortes d'exercices sur dix (trois aux mélodies, qui gardent huit écoutes)", () => {
    for (const key of TOPIC_KEYS) {
      for (const palierIndex of [1, 2, 3, 4]) {
        const games = generateGames(topicOf(key).games ?? [], { klass: "CE2", palierIndex, palierCount: 4, seed: key });
        expect(new Set(games.map((game) => game.type)).size, `${key} palier ${palierIndex}`).toBeGreaterThanOrEqual(key === "ar-ce2-melodies" ? 3 : 4);
      }
    }
  });

  it("ne reposent pas la même question d'un palier à l'autre : chaque palier a sa part des lignes", () => {
    for (const key of TOPIC_KEYS) {
      let total = 0;
      let repeated = 0;
      for (let n = 0; n < 20; n++) {
        const seen = new Map<string, number>();
        for (const palierIndex of [1, 2, 3, 4]) {
          const games = generateGames(topicOf(key).games ?? [], { klass: "CE2", palierIndex, palierCount: 4, seed: `variete:${key}:${n}:${palierIndex}` });
          for (const game of games) {
            const kind = (game.payload.game as { kind: string }).kind;
            if (!kind.startsWith("ce2-")) continue;
            const items = game.payload.items as { text: string; correctZone: string }[] | undefined;
            const pairs = game.payload.pairs as { left: string; right: string }[] | undefined;
            const answer = items
              ? items.map((item) => `${item.text}>${item.correctZone}`).sort().join(";")
              : pairs
                ? pairs.map((pair) => `${pair.left}~${pair.right}`).sort().join(";")
                : game.answerKey;
            const question = `${kind}|${game.prompt}|${String(game.payload.text ?? "")}|${answer}`;
            total += 1;
            if (seen.has(question) && seen.get(question) !== palierIndex) repeated += 1;
            if (!seen.has(question)) seen.set(question, palierIndex);
          }
        }
      }
      expect(repeated / total, key).toBeLessThan(0.05);
    }
  });

  it("gardent de quoi servir la démo du site : un gabarit pour chaque type que sa banque d'exercices attend", () => {
    // La banque de la vitrine veut, sur une thématique tout en gabarits, un gabarit du type de chaque exercice de sa banque : les thématiques
    // civiques, l'hymne et le théâtre ont le QCM, la phrase à trous, le glissé et l'ordre ou l'appariement. Les trois autres arts gardent leurs jeux.
    const typesOf = (key: string) => new Set((topicOf(key).games ?? []).map((spec) => GAME_KINDS[spec.kind].type));
    for (const key of TOPIC_KEYS.filter((entry) => !["ar-ce2-coloriage", "ar-ce2-reproduire", "ar-ce2-melodies"].includes(entry))) {
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
