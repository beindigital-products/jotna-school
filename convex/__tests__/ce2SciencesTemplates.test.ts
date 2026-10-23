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
 * LES SCIENCES DU CE2 : le corps humain, la vie des plantes, la vie des animaux, le circuit électrique, se protéger des maladies,
 * l'environnement et la population.
 *
 * Chaque test RECALCULE la bonne réponse depuis l'énoncé et les tuiles, avec ses propres tables écrites à part : l'organe de chaque
 * sens, ce qu'il faut à une graine pour germer, les animaux ovipares et vivipares et le petit de chacun, les étapes de la vie de chaque
 * animal, les conducteurs et les isolants, les gestes qui protègent du paludisme ou ne transmettent pas le VIH, les bons et les mauvais
 * gestes pour l'environnement. Un gabarit dont la réponse contredit sa table échoue. À la fin, des MUTATIONS : on abîme la bonne réponse
 * d'un exercice juste, puis son énoncé, et chaque vérification doit le voir. L'échantillon du modèle comptait 7 exercices faux sur 36
 * en sciences du CE2 (un squelette « composé de os et de côtes », une paire « mangue ~ mangue », une respiration en « échange de gaz »).
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
const invert = (table: Record<string, string>): Record<string, string> => Object.fromEntries(Object.entries(table).map(([key, value]) => [value, key]));

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

// ===== Le corps humain =====
const SENSE_ORGAN: Record<string, string> = { Vue: "Yeux", Ouïe: "Oreilles", Odorat: "Nez", Goût: "Langue", Toucher: "Peau" };
const SENSE_OF_ORGAN = invert(SENSE_ORGAN);
const ORGANS_T = Object.values(SENSE_ORGAN);
const SENSES_T = Object.keys(SENSE_ORGAN);
const SKELETON_T = ["Crâne", "Côtes", "Colonne vertébrale"];
const SKELETON_ZONES: [string, string] = ["Squelette", "Organe d'un sens"];
const SCENE_SENSE: Record<string, string> = {
  "Regarder le ciel": "Vue",
  "Lire un livre": "Vue",
  "Voir un arc-en-ciel": "Vue",
  "Écouter une chanson": "Ouïe",
  "Entendre le tonnerre": "Ouïe",
  "Entendre un tam-tam": "Ouïe",
  "Respirer un parfum": "Odorat",
  "Sentir la fumée": "Odorat",
  "Humer un repas qui cuit": "Odorat",
  "Manger du sucre": "Goût",
  "Goûter un citron": "Goût",
  "Croquer une mangue": "Goût",
  "Caresser un chat": "Toucher",
  "Toucher une pierre chaude": "Toucher",
  "Tenir un glaçon": "Toucher",
};
const BONE_ROLE: Record<string, string> = {
  Crâne: "Il protège le cerveau",
  Côtes: "Elles protègent le cœur",
  "Colonne vertébrale": "Elle tient le corps droit",
  Muscles: "Ils font bouger les os",
};

// ===== La vie des plantes =====
const NEEDS_T = ["Eau", "Chaleur", "Air"];
const NOT_NEEDS_T = ["Sel", "Sucre", "Savon", "Huile"];
const NEED_PROMPTS = ["Qu'est-ce qui aide une graine à germer ?", "De quoi une graine a-t-elle besoin pour germer ?", "Que boit la graine avant de germer ?"];
const FRUIT_SEED: Record<string, string> = { Mangue: "Noyau", Arachide: "Gousse", Mil: "Grains" };
const PART_ROLE: Record<string, string> = {
  Fleur: "Elle devient un fruit",
  Fruit: "Il porte les graines",
  Graine: "Elle germe avec de l'eau",
  Racine: "Elle sort la première",
};

// ===== La vie des animaux =====
const OVIPARES_T = ["Poule", "Tortue", "Poisson", "Canard", "Pigeon", "Crocodile", "Grenouille", "Papillon", "Pintade"];
const VIVIPARES_T = ["Chèvre", "Chat", "Homme", "Vache", "Mouton", "Chien", "Âne", "Cheval", "Lion", "Éléphant", "Singe"];
const YOUNG_T: Record<string, string> = { Poule: "Poussin", Chèvre: "Chevreau", Chat: "Chaton", Chien: "Chiot", Vache: "Veau", Mouton: "Agneau", Canard: "Caneton", Cheval: "Poulain" };
const LIFE_T: Record<string, string[]> = {
  papillon: ["Œuf", "Chenille", "Chrysalide", "Papillon"],
  grenouille: ["Œuf", "Têtard", "Grenouille"],
  poule: ["Œuf", "Poussin", "Poule"],
  canard: ["Œuf", "Caneton", "Canard"],
  tortue: ["Œuf", "Bébé tortue", "Tortue"],
};

// ===== Le circuit électrique =====
const PIECE_ROLE: Record<string, string> = {
  Pile: "Elle donne l'électricité",
  Ampoule: "Elle éclaire",
  Fils: "Ils relient les pièces",
  Interrupteur: "Il ouvre ou ferme le circuit",
};
const CONDUCTORS_T = ["Cuivre", "Fer", "Aluminium", "Acier"];
const INSULATORS_T = ["Plastique", "Bois", "Caoutchouc", "Verre", "Tissu", "Carton"];
const SAFE_ACTS_T = ["Prévenir un adulte si un fil est abîmé", "Rester loin d'un fil tombé", "Demander à un adulte de brancher l'appareil", "Éteindre l'appareil avant de le ranger"];
const DANGEROUS_ACTS_T = ["Mettre un doigt dans une prise", "Toucher un fil dénudé", "Toucher une prise avec les mains mouillées", "Jouer près d'un fil tombé"];

// ===== Se protéger des maladies =====
const MALARIA_ACTS_T = ["Dormir sous une moustiquaire", "Vider l'eau qui ne bouge pas", "Porter des habits longs le soir"];
const HIV_ACTS_T = ["Ne pas partager une lame", "Ne pas partager une seringue", "Ne pas toucher le sang d'un autre"];
const SAFE_WITH_HIV_T = ["Jouer ensemble", "Manger ensemble", "Se donner la main", "Partager un jeu"];
const RISK_WITH_HIV_T = ["Partager une lame", "Partager une seringue", "Toucher du sang"];
const MALARIA_LINK_T: Record<string, string> = {
  "Dormir sous une moustiquaire": "Les moustiques ne peuvent pas piquer pendant la nuit",
  "Vider l'eau qui ne bouge pas": "Les moustiques n'y pondent plus",
  "Porter des habits longs": "La peau est couverte le soir",
  "Aller voir un médecin": "Le médecin soigne la maladie",
};

// ===== L'environnement et la population =====
const PROBLEM_LINK_T: Record<string, string> = {
  "Sachets plastiques": "Un panier en tissu",
  "Déchets dans la rue": "Poubelle",
  "Arbre coupé": "Un arbre planté",
  "Feu de brousse": "Ne pas allumer de feu",
  "Manque d'eau": "Ne pas gaspiller l'eau",
};
const NATURE_PROBLEMS_T = ["Sachets plastiques", "Coupe des arbres", "Feux de brousse", "Déchets dans la rue"];
const PEOPLE_PROBLEMS_T = ["Quartier trop peuplé", "Manque d'eau", "Peu de place pour vivre"];
const GOOD_ACTS_T = ["Mettre les déchets à la poubelle", "Planter un arbre", "Fermer le robinet", "Utiliser un sac en tissu", "Ramasser les déchets"];
const BAD_ACTS_T = ["Jeter un sachet par terre", "Allumer un feu dans la brousse", "Couper des arbres pour rien", "Laisser couler l'eau", "Jeter les déchets dans la rue"];

const zoneMap = (lists: readonly (readonly [readonly string[], string])[]): Record<string, string> =>
  Object.fromEntries(lists.flatMap(([items, zone]) => items.map((item) => [item, zone] as const)));

// Les lignes que les gabarits posent, relues une à une : (énoncé ou phrase, bonne réponse, mauvais choix permis) pour les questions et les trous,
// (énoncé, écritures admises) pour les réponses à écrire, (énoncé, suite) pour les ordres.
const SENS_SITUATION_T: [string, string, string[]][] = [
  ["Tu poses ta main sur une pierre chaude. Quel sens utilises-tu ?", "Toucher", ["Goût", "Ouïe"]],
  ["Tu goûtes un morceau de citron. Quel sens utilises-tu ?", "Goût", ["Ouïe", "Vue"]],
  ["Tu respires le parfum d'une mangue mûre. Quel sens utilises-tu ?", "Odorat", ["Ouïe", "Toucher"]],
  ["Tu entends le tam-tam d'un village voisin. Quel sens utilises-tu ?", "Ouïe", ["Goût", "Odorat"]],
  ["Tu respires le parfum d'une fleur. Quel sens utilises-tu ?", "Odorat", ["Goût", "Ouïe"]],
  ["Tu écoutes la voix de ta maîtresse. Quel sens utilises-tu ?", "Ouïe", ["Goût", "Odorat"]],
  ["Tu mords dans une mangue sucrée. Quel sens utilises-tu ?", "Goût", ["Ouïe", "Vue"]],
  ["Tu regardes les étoiles dans le ciel. Quel sens utilises-tu ?", "Vue", ["Goût", "Odorat"]],
  ["Tu lis un livre sous l'arbre. Quel sens utilises-tu ?", "Vue", ["Goût", "Odorat"]],
  ["Tu entends le coq chanter le matin. Quel sens utilises-tu ?", "Ouïe", ["Goût", "Odorat"]],
  ["Tu respires l'odeur du poisson grillé. Quel sens utilises-tu ?", "Odorat", ["Ouïe", "Toucher"]],
  ["Tu caresses le pelage doux d'un chat. Quel sens utilises-tu ?", "Toucher", ["Goût", "Ouïe"]],
  ["Tu plonges ta main dans l'eau fraîche du puits. Quel sens utilises-tu ?", "Toucher", ["Goût", "Odorat"]],
  ["Tu goûtes une cuillère de sucre. Quel sens utilises-tu ?", "Goût", ["Ouïe", "Vue"]],
  ["Tu admires les couleurs d'un boubou. Quel sens utilises-tu ?", "Vue", ["Goût", "Odorat"]],
  ["Tu entends la cloche de l'école. Quel sens utilises-tu ?", "Ouïe", ["Goût", "Odorat"]],
];
const ORGANE_QCM_T: [string, string, string[]][] = [
  ["Avec quel organe voit-on ?", "Yeux", ["Langue", "Oreilles"]],
  ["Quel organe nous permet de reconnaître les odeurs ?", "Nez", ["Langue", "Yeux"]],
  ["Quel organe nous permet d'entendre ?", "Oreilles", ["Nez", "Peau"]],
  ["Quel organe est celui du toucher ?", "Peau", ["Nez", "Yeux"]],
  ["Quel organe nous permet de goûter ?", "Langue", ["Oreilles", "Peau"]],
  ["Quel est l'organe de la vue ?", "Yeux", ["Nez", "Peau"]],
  ["Quel est l'organe du goût ?", "Langue", ["Nez", "Yeux"]],
  ["Quel organe sert à l'odorat ?", "Nez", ["Oreilles", "Peau"]],
  ["Quel organe sert à l'ouïe ?", "Oreilles", ["Langue", "Yeux"]],
  ["Avec quel organe sent-on le chaud et le froid ?", "Peau", ["Langue", "Oreilles"]],
  ["Quel organe nous permet de sentir qu'un objet est rugueux ?", "Peau", ["Langue", "Oreilles"]],
  ["Avec quel organe écoute-t-on la musique ?", "Oreilles", ["Langue", "Yeux"]],
];
const OS_QCM_T: [string, string, string[]][] = [
  ["Quelle partie du squelette tient le corps droit ?", "Colonne vertébrale", ["Crâne", "Côtes"]],
  ["Quelle partie du squelette protège le cœur et les poumons ?", "Côtes", ["Colonne vertébrale", "Crâne"]],
  ["Quelle partie du squelette protège le cerveau ?", "Crâne", ["Colonne vertébrale", "Côtes"]],
  ["Quand tu cours, quelles parties du corps travaillent beaucoup ?", "Les muscles des jambes", ["Les oreilles", "Les yeux"]],
  ["De quoi le squelette est-il fait ?", "Os", ["Muscles", "Peau"]],
  ["Que font les muscles ?", "Ils font bouger les os", ["Ils goûtent les aliments", "Ils protègent le cerveau"]],
  ["Quand tu portes un seau d'eau, quelles parties du corps travaillent ?", "Les muscles des bras", ["Le nez", "Les oreilles"]],
  ["Que protège le crâne ?", "Cerveau", ["Cœur", "Estomac"]],
  ["Que protègent les côtes ?", "Cœur et poumons", ["Cerveau et yeux", "Dents et langue"]],
  ["Quelle partie du squelette se trouve dans la tête ?", "Crâne", ["Colonne vertébrale", "Côtes"]],
  ["Comment appelle-t-on l'ensemble des os du corps ?", "Squelette", ["Cerveau", "Peau"]],
  ["Quelle partie du corps fait bouger les os ?", "Muscles", ["Cheveux", "Peau"]],
];
const CORPS_TROU_T: [string, string, string[]][] = [
  ["Pour courir, on se sert des ___ de nos jambes.", "muscles", ["dents", "yeux"]],
  ["Les ___ font bouger les os.", "muscles", ["cheveux", "dents"]],
  ["La peau est l'organe du ___.", "toucher", ["bruit", "goût"]],
  ["Nous avons ___ sens.", "cinq", ["dix", "trois"]],
  ["Le crâne protège le ___.", "cerveau", ["cœur", "estomac"]],
  ["On voit avec les ___.", "yeux", ["mains", "oreilles"]],
  ["On reconnaît les odeurs avec le ___.", "nez", ["doigt", "genou"]],
  ["Les côtes protègent le cœur et les ___.", "poumons", ["mains", "oreilles"]],
  ["On entend avec les ___.", "oreilles", ["pieds", "yeux"]],
  ["On goûte les aliments avec la ___.", "langue", ["main", "oreille"]],
  ["La colonne vertébrale est au milieu du ___.", "dos", ["bras", "ventre"]],
  ["Le squelette est fait d'os qui tiennent le corps ___.", "debout", ["couché", "plié"]],
];
const CORPS_ECRIRE_T: [string, string[]][] = [
  ["Avec quel organe entend-on ? Écris le mot.", ["oreilles", "les oreilles", "oreille"]],
  ["Combien de sens avons-nous ? Écris le nombre.", ["5", "cinq"]],
  ["Quelle partie du squelette protège le cœur et les poumons ? Écris le mot.", ["côtes", "cotes", "les côtes"]],
  ["Quel organe nous permet de reconnaître les odeurs ? Écris le mot.", ["nez", "le nez"]],
  ["Quelles parties du corps font bouger les os ? Écris le mot.", ["muscles", "les muscles", "muscle"]],
  ["Avec quoi goûte-t-on les aliments ? Écris le mot.", ["langue", "la langue"]],
  ["Quel organe nous permet de voir ? Écris le mot.", ["yeux", "les yeux", "œil"]],
  ["Quelle partie du squelette protège le cerveau ? Écris le mot.", ["crâne", "crane", "le crâne"]],
];
const PLANTE_QCM_T: [string, string, string[]][] = [
  ["Que boit la graine avant de germer ?", "Eau", ["Sel", "Sucre"]],
  ["Où se trouvent les graines d'une plante ?", "Dans le fruit", ["Dans la tige", "Dans les racines"]],
  ["Que devient le fruit mûr ?", "Il libère ses graines", ["Il devient une racine", "Il redevient une fleur"]],
  ["Quelle partie de la plante porte les graines ?", "Fruit", ["Feuille", "Racine"]],
  ["Que devient la fleur d'une plante ?", "Fruit", ["Feuille", "Racine"]],
  ["De quoi une graine a-t-elle besoin pour germer ?", "Chaleur", ["Savon", "Sucre"]],
  ["Qu'est-ce qui aide une graine à germer ?", "Eau", ["Sel", "Sucre"]],
  ["Que cache une mangue en son centre ?", "Noyau", ["Fleur", "Racine"]],
  ["Quelle partie sort la première de la graine qui germe ?", "La racine", ["La fleur", "Le fruit"]],
  ["Qu'est-ce qui aide une graine à germer ?", "Air", ["Huile", "Savon"]],
  ["Que porte le fruit ?", "Graines", ["Plumes", "Racines"]],
  ["Où se trouvent les graines de l'arachide ?", "Dans une gousse", ["Dans une feuille", "Dans une fleur"]],
  ["Que donne une graine qui germe ?", "Jeune plante", ["Fleur", "Fruit"]],
  ["De quoi une graine a-t-elle besoin pour germer ?", "Eau", ["Huile", "Sel"]],
  ["Que fait la graine d'abord quand on la sème ?", "Elle boit l'eau", ["Elle donne un fruit", "Elle perd ses racines"]],
  ["Que sont les grains de mil ?", "Graines", ["Feuilles", "Racines"]],
];
const PLANTE_TROU_T: [string, string, string[]][] = [
  ["Le fruit porte les ___.", "graines", ["racines", "écorces"]],
  ["Le mil donne de petits ___.", "grains", ["noyaux", "oignons"]],
  ["Sans ___, une graine ne germe pas.", "air", ["huile", "sel"]],
  ["La racine descend dans la ___.", "terre", ["lune", "mer"]],
  ["Une graine qui germe devient une jeune ___.", "plante", ["maison", "pierre"]],
  ["Une graine bien arrosée finit par ___.", "germer", ["fondre", "voler"]],
  ["De la fleur naît le ___.", "fruit", ["caillou", "tronc"]],
  ["Sans ___, une graine ne germe pas.", "eau", ["sel", "sucre"]],
  ["La mangue a un gros ___ en son centre.", "noyau", ["papier", "sable"]],
  ["La première partie qui sort de la graine est la ___.", "racine", ["feuille", "fleur"]],
  ["L'arachide pousse dans une ___.", "gousse", ["feuille", "fleur"]],
  ["Eau, air et ___ font germer la graine.", "chaleur", ["glace", "nuit"]],
];
const PLANTE_ECRIRE_T: [string, string[]][] = [
  ["Quelle partie sort la première de la graine qui germe ? Écris le mot.", ["racine", "la racine"]],
  ["Eau, air et ___ font germer la graine. Écris le mot.", ["chaleur", "la chaleur"]],
  ["Que porte le fruit ? Écris le mot.", ["graines", "des graines", "graine"]],
  ["Dans quoi se trouvent les graines de l'arachide ? Écris le mot.", ["gousse", "une gousse", "la gousse"]],
  ["Comment s'appelle le moment où la graine commence à pousser ? Écris le mot.", ["germination", "la germination"]],
  ["Combien de choses faut-il à une graine pour germer ? Écris le nombre.", ["3", "trois"]],
  ["Quelle partie de la mangue contient la graine ? Écris le mot.", ["noyau", "le noyau"]],
  ["Que devient la fleur de la plante ? Écris le mot.", ["fruit", "un fruit", "le fruit"]],
];
const PLANTE_ORDRE_T: [string, string[]][] = [
  ["Mets ces étapes de la germination dans l'ordre du temps.", ["La graine est semée", "La graine boit l'eau", "La racine sort", "La tige pousse"]],
  ["Mets les étapes de la vie de la plante dans l'ordre du temps.", ["Graine", "Jeune plante", "Fleur", "Fruit"]],
  ["Range ces parties de la plante dans l'ordre de la terre vers le ciel.", ["Racine", "Tige", "Fleur"]],
  ["Mets ces étapes dans l'ordre du temps, après la fleur.", ["Fruit", "Graines", "Jeune plante"]],
];
const ANIMAL_DEFINITION_T: [string, string, string[]][] = [
  ["Comment naissent les petits de la chèvre ?", "Ils sortent du ventre de leur mère", ["Ils sortent d'un œuf", "Ils sortent d'une coquille"]],
  ["Comment naissent les petits du chat ?", "Ils sortent du ventre de leur mère", ["Ils sortent d'un œuf", "Ils sortent d'une coquille"]],
  ["Comment naissent les petits du canard ?", "Dans des œufs", ["Dans le ventre de leur mère", "Dans une poche"]],
  ["Comment naissent les petits du mouton ?", "Ils sortent du ventre de leur mère", ["Ils sortent d'un œuf", "Ils sortent d'une coquille"]],
  ["Que veut dire ovipare ?", "Qui pond des œufs", ["Qui met ses petits au monde", "Qui vit dans l'eau"]],
  ["Comment naissent les petits de la poule ?", "Dans des œufs", ["Dans le ventre de leur mère", "Dans un terrier"]],
  ["Comment naissent les petits de la tortue ?", "Dans des œufs", ["Dans le ventre de leur mère", "Dans une poche"]],
  ["Que veut dire vivipare ?", "Qui met ses petits au monde", ["Qui pond des œufs", "Qui vit dans l'eau"]],
];
const CYCLE_ORDRE_T: [string, string[]][] = [
  ["Mets les étapes de la vie du papillon dans l'ordre du temps.", ["Œuf", "Chenille", "Chrysalide", "Papillon"]],
  ["Mets les étapes de la vie de la grenouille dans l'ordre du temps.", ["Œuf", "Têtard", "Grenouille"]],
  ["Mets les étapes de la vie du canard dans l'ordre du temps.", ["Œuf", "Caneton", "Canard"]],
  ["Mets les étapes de la vie de la poule dans l'ordre du temps.", ["Œuf", "Poussin", "Poule"]],
  ["Dans l'ordre du temps, range les étapes de la vie du papillon.", ["Œuf", "Chenille", "Chrysalide", "Papillon"]],
  ["Mets les étapes de la vie de la tortue dans l'ordre du temps.", ["Œuf", "Bébé tortue", "Tortue"]],
  ["Dans l'ordre du temps, range les étapes de la vie de la poule.", ["Œuf", "Poussin", "Poule"]],
  ["Dans l'ordre du temps, range les étapes de la vie de la grenouille.", ["Œuf", "Têtard", "Grenouille"]],
];
const CYCLE_QCM_T: [string, string, string[]][] = [
  ["Que sort de l'œuf du canard ?", "Caneton", ["Poussin", "Têtard"]],
  ["Que devient la chenille ?", "Chrysalide", ["Poussin", "Têtard"]],
  ["Que sort de l'œuf de la tortue ?", "Bébé tortue", ["Poussin", "Têtard"]],
  ["Que sort de l'œuf de la grenouille ?", "Têtard", ["Chenille", "Poussin"]],
  ["Que devient la chrysalide ?", "Papillon", ["Chenille", "Têtard"]],
  ["Que devient le têtard ?", "Grenouille", ["Papillon", "Poussin"]],
  ["Que sort de l'œuf du papillon ?", "Chenille", ["Poussin", "Têtard"]],
  ["Que sort de l'œuf de la poule ?", "Poussin", ["Chenille", "Têtard"]],
];
const ANIMAL_TROU_T: [string, string, string[]][] = [
  ["La tortue est un animal ___.", "ovipare", ["aquatique", "vivipare"]],
  ["Avant d'être papillon, il est une ___.", "chenille", ["poule", "tortue"]],
  ["Un animal qui met ses petits au monde est ___.", "vivipare", ["aquatique", "ovipare"]],
  ["Le poussin sort d'un ___.", "œuf", ["caillou", "fruit"]],
  ["La chèvre met au monde ses ___.", "petits", ["graines", "œufs"]],
  ["Le chat est un animal ___.", "vivipare", ["aquatique", "ovipare"]],
  ["Le mouton met au monde ses ___.", "agneaux", ["graines", "œufs"]],
  ["De l'œuf de la grenouille sort un ___.", "têtard", ["papillon", "poussin"]],
  ["La poule, la tortue et le poisson pondent des ___.", "œufs", ["fruits", "graines"]],
  ["Un animal qui pond des œufs est ___.", "ovipare", ["aquatique", "vivipare"]],
  ["La poule pond des ___.", "œufs", ["fruits", "graines"]],
  ["Le têtard devient une ___.", "grenouille", ["chenille", "poule"]],
];
const ANIMAL_ECRIRE_T: [string, string[]][] = [
  ["Nomme un animal ovipare. Écris le mot.", ["poule", "tortue", "poisson", "canard", "pigeon", "crocodile", "grenouille", "papillon"]],
  ["Nomme un animal vivipare. Écris le mot.", ["chèvre", "chat", "homme", "vache", "mouton", "chien", "âne", "cheval", "lion", "éléphant", "singe"]],
  ["Un animal qui met ses petits au monde est ___. Écris le mot.", ["vivipare", "vivipares"]],
  ["Un animal qui pond des œufs est ___. Écris le mot.", ["ovipare", "ovipares"]],
  ["Quel animal sort de l'œuf du papillon ? Écris le mot.", ["chenille", "la chenille", "une chenille"]],
  ["Comment s'appelle le bébé de la poule ? Écris le mot.", ["poussin", "le poussin"]],
  ["Comment s'appelle le bébé de la grenouille ? Écris le mot.", ["têtard", "tetard", "le têtard"]],
  ["Quelle étape vient entre la chenille et le papillon ? Écris le mot.", ["chrysalide", "la chrysalide"]],
];
const CIRCUIT_PIECE_QCM_T: [string, string, string[]][] = [
  ["Quelle pièce permet d'ouvrir ou de fermer le circuit ?", "Interrupteur", ["Ampoule", "Pile"]],
  ["Quelles pièces longues et minces relient la pile à la lampe ?", "Fils", ["Ampoule", "Pile"]],
  ["Quelle pièce du circuit brille quand il est fermé ?", "Ampoule", ["Fils", "Interrupteur"]],
  ["Dans une lampe torche, quelle pièce donne l'électricité ?", "Pile", ["Ampoule", "Fils"]],
  ["Quelles pièces relient les autres pièces du circuit ?", "Fils", ["Interrupteur", "Pile"]],
  ["Quelle pièce utilise-t-on pour allumer et éteindre ?", "Interrupteur", ["Fils", "Pile"]],
  ["Quelle pièce du circuit éclaire ?", "Ampoule", ["Fils", "Pile"]],
  ["Quelle pièce du circuit donne l'électricité ?", "Pile", ["Ampoule", "Interrupteur"]],
];
const CIRCUIT_ETAT_QCM_T: [string, string, string[]][] = [
  ["L'interrupteur est ouvert. Que se passe-t-il ?", "L'ampoule reste éteinte", ["L'ampoule brille", "La pile se remplit"]],
  ["L'interrupteur est fermé. Que se passe-t-il ?", "L'ampoule brille", ["L'ampoule reste éteinte", "Le fil se coupe"]],
  ["Un fil du circuit est coupé. Que se passe-t-il ?", "Le circuit est ouvert", ["L'ampoule brille plus fort", "Le circuit est fermé"]],
  ["Le circuit est fermé. Que fait l'électricité ?", "Elle circule", ["Elle disparaît", "Elle s'arrête"]],
  ["Le circuit est fermé. Que peut faire l'ampoule ?", "Elle brille", ["Elle disparaît", "Elle reste éteinte"]],
  ["Le circuit est ouvert. Que fait l'électricité ?", "Elle ne circule pas", ["Elle brille", "Elle circule"]],
  ["Comment appelle-t-on un circuit où le courant circule ?", "Un circuit fermé", ["Un circuit cassé", "Un circuit ouvert"]],
  ["Comment appelle-t-on un circuit où le courant ne passe pas ?", "Un circuit ouvert", ["Un circuit fermé", "Un circuit plein"]],
];
const CIRCUIT_ORDRE_T: [string, string[]][] = [
  ["Mets ces événements dans l'ordre du temps.", ["La pile donne l'électricité", "L'électricité passe dans les fils", "L'ampoule brille"]],
  ["Mets ces événements dans l'ordre du temps.", ["On ferme l'interrupteur", "L'électricité circule", "L'ampoule brille"]],
  ["Mets ces événements dans l'ordre du temps.", ["On ouvre l'interrupteur", "Le circuit est ouvert", "L'ampoule s'éteint"]],
  ["Mets ces événements dans l'ordre du temps.", ["On coupe un fil", "Le circuit s'ouvre", "L'ampoule s'éteint"]],
];
const CIRCUIT_TROU_T: [string, string, string[]][] = [
  ["L'ampoule ___ quand le circuit est fermé.", "brille", ["grince", "tombe"]],
  ["La ___ donne l'électricité au circuit.", "pile", ["ampoule", "interrupteur"]],
  ["Quand le circuit est ___, l'ampoule brille.", "fermé", ["cassé", "ouvert"]],
  ["Un métal est un bon ___ d'électricité.", "conducteur", ["cadeau", "isolant"]],
  ["Quand le circuit est ___, l'ampoule reste éteinte.", "ouvert", ["fermé", "plein"]],
  ["Les ___ relient les pièces du circuit.", "fils", ["ampoules", "piles"]],
  ["Un circuit sans pile ne peut pas ___ l'ampoule.", "allumer", ["manger", "ouvrir"]],
  ["Le plastique et le bois sont des ___.", "isolants", ["conducteurs", "métaux"]],
  ["Le circuit électrique simple a une pile, une ampoule, des fils et un ___.", "interrupteur", ["ballon", "robinet"]],
  ["Le cuivre et le fer sont des ___.", "conducteurs", ["isolants", "plastiques"]],
  ["Le courant ne passe que si le circuit est ___.", "fermé", ["coupé", "ouvert"]],
  ["Pour allumer et éteindre, on utilise un ___.", "interrupteur", ["ballon", "robinet"]],
];
const CIRCUIT_ECRIRE_T: [string, string[]][] = [
  ["Comment appelle-t-on une matière qui laisse passer l'électricité ? Écris le mot.", ["conducteur", "un conducteur"]],
  ["Quelle pièce sert à allumer et à éteindre ? Écris le mot.", ["interrupteur", "un interrupteur", "l'interrupteur"]],
  ["Un circuit simple a une pile, une ampoule, des fils et un interrupteur. Combien de sortes de pièces ? Écris le nombre.", ["4", "quatre"]],
  ["Comment appelle-t-on une matière qui bloque l'électricité ? Écris le mot.", ["isolant", "un isolant"]],
  ["Un circuit où l'électricité circule est un circuit ___. Écris le mot.", ["fermé", "ferme"]],
  ["Quelle pièce du circuit donne l'électricité ? Écris le mot.", ["pile", "la pile", "une pile"]],
  ["Un circuit où l'électricité ne passe pas est un circuit ___. Écris le mot.", ["ouvert"]],
  ["Quelle pièce du circuit éclaire ? Écris le mot.", ["ampoule", "l'ampoule", "une ampoule"]],
];
const PALU_QCM_T: [string, string, string[]][] = [
  ["Par quoi le paludisme se transmet-il ?", "Par la piqûre d'un moustique", ["En jouant avec un ami", "En mangeant des mangues"]],
  ["Comment se protéger des moustiques pendant la nuit ?", "Dormir sous une moustiquaire", ["Dormir dehors sous les étoiles", "Manger du riz avant de dormir"]],
  ["Quel vêtement protège le soir des piqûres de moustiques ?", "Des habits longs", ["Maillot", "Short"]],
  ["Où les moustiques pondent-ils leurs œufs ?", "Dans l'eau qui ne bouge pas", ["Dans le sable sec", "Dans les branches"]],
  ["Que faut-il faire si on a de la fièvre ?", "Prévenir un adulte", ["Jouer dehors", "Se cacher"]],
  ["Quel animal transmet le paludisme ?", "Moustique", ["Chèvre", "Poule"]],
  ["Que faut-il faire de l'eau qui ne bouge pas autour de la maison ?", "Vider cette eau", ["Boire cette eau", "Garder cette eau"]],
  ["Pourquoi dort-on sous une moustiquaire ?", "Pour éviter les piqûres", ["Pour avoir plus chaud", "Pour cacher le lit"]],
];
const VIH_QCM_T: [string, string, string[]][] = [
  ["Quel objet ne faut-il jamais partager pour éviter le VIH ?", "Lame", ["Ballon", "Livre"]],
  ["Pour ne pas attraper le VIH, que faut-il éviter de toucher ?", "Le sang d'une autre personne", ["La main d'un ami", "Le ballon d'un copain"]],
  ["Peut-on attraper le VIH en mangeant avec une personne qui l'a ?", "Non, on ne l'attrape pas ainsi", ["Oui, avec la cuillère", "Oui, toujours"]],
  ["Peut-on jouer avec un enfant qui a le VIH ?", "Oui, sans aucun danger", ["Non, jamais", "Seulement de loin"]],
  ["Quel objet ne faut-il jamais partager pour éviter le VIH ?", "Seringue", ["Ballon", "Natte"]],
  ["Peut-on attraper le VIH en se donnant la main ?", "Non, on ne l'attrape pas ainsi", ["Oui, toujours", "Oui, à chaque fois"]],
  ["Peut-on attraper le VIH en jouant au ballon ?", "Non, on ne l'attrape pas ainsi", ["Oui, si on joue longtemps", "Oui, toujours"]],
  ["Peut-on rester à côté d'un camarade qui a le VIH ?", "Oui, sans aucun danger", ["Non, jamais", "Seulement de loin"]],
];
const SANTE_TROU_T: [string, string, string[]][] = [
  ["Pour se protéger du paludisme, on porte des habits ___ le soir.", "longs", ["courts", "mouillés"]],
  ["Le paludisme donne de la ___.", "fièvre", ["joie", "musique"]],
  ["On ne peut pas attraper le VIH en se donnant la ___.", "main", ["lame", "seringue"]],
  ["On ne partage jamais une ___ avec un autre.", "seringue", ["balle", "natte"]],
  ["Quand on a de la fièvre, on prévient un ___.", "adulte", ["ballon", "mouton"]],
  ["Les moustiques piquent surtout à la tombée de la ___.", "nuit", ["pluie", "récréation"]],
  ["Pour ne pas attraper le VIH, on ne partage pas une ___.", "lame", ["balle", "natte"]],
  ["Le paludisme se transmet par la piqûre d'un ___.", "moustique", ["poisson", "serpent"]],
  ["On dort sous une ___ pour se protéger des moustiques.", "moustiquaire", ["natte", "valise"]],
  ["Pour ne pas attraper le VIH, on ne touche pas le ___ d'une autre personne.", "sang", ["lait", "mil"]],
  ["Avec un ami qui a le VIH, on peut ___ sans danger.", "jouer", ["se couper", "se piquer"]],
  ["Les moustiques pondent dans l'eau qui ne ___ pas.", "bouge", ["chante", "saute"]],
];
const SANTE_ECRIRE_T: [string, string[]][] = [
  ["Que doit-on faire de l'eau qui ne bouge pas autour de la maison ? Écris le verbe.", ["vider"]],
  ["Comment s'appelle la maladie transmise par les moustiques ? Écris le mot.", ["paludisme", "le paludisme", "palu"]],
  ["Quel insecte transmet le paludisme ? Écris le mot.", ["moustique", "le moustique", "un moustique"]],
  ["Quel objet ne faut-il jamais partager pour éviter le VIH ? Écris le mot.", ["lame", "seringue", "une lame", "une seringue"]],
  ["Sous quoi dort-on pour éviter les piqûres de moustique ? Écris le mot.", ["moustiquaire", "une moustiquaire", "la moustiquaire"]],
  ["Que ne faut-il pas toucher d'une autre personne pour éviter le VIH ? Écris le mot.", ["sang", "le sang"]],
  ["Le soir, on porte des habits ___ pour éviter les piqûres. Écris le mot.", ["longs", "long"]],
  ["Que faut-il vider autour de la maison pour éviter les moustiques ? Écris le mot.", ["eau", "l'eau"]],
];
const ENV_CAUSE_QCM_T: [string, string, string[]][] = [
  ["Que provoque la coupe de trop d'arbres ?", "Moins d'ombre et moins d'abris pour les animaux", ["Plus d'animaux dans la brousse", "Plus d'ombre sous le soleil"]],
  ["Pourquoi les sachets plastiques sont-ils un problème ?", "Ils restent très longtemps dans la nature", ["Ils font pousser les plantes", "Ils pourrissent vite"]],
  ["Pourquoi manque-t-on d'eau dans un quartier trop peuplé ?", "Il y a trop de monde pour la même eau", ["Il y a trop de pluie", "Les gens boivent moins"]],
  ["Que provoquent les feux de brousse ?", "Ils brûlent les arbres, les herbes et les animaux", ["Ils apportent de l'eau", "Ils font pousser les arbres plus vite"]],
  ["Qu'arrive-t-il dans un quartier trop peuplé ?", "Il y a peu de place pour tout le monde", ["Il y a peu de gens", "Il y a trop d'espace vide"]],
  ["Que se passe-t-il quand les déchets restent dans la rue ?", "Ils attirent les mouches et sentent mauvais", ["Ils font beaucoup d'ombre", "Ils rendent l'air très pur"]],
  ["Pourquoi les arbres sont-ils utiles ?", "Ils donnent de l'ombre et abritent les animaux", ["Ils font beaucoup de bruit", "Ils salissent toutes les rues"]],
  ["Pourquoi ne faut-il pas jeter les déchets par terre ?", "Ils salissent et font tomber malade", ["Ils font pousser les arbres", "Ils rendent l'eau plus claire"]],
];
const ENV_SOLUTION_QCM_T: [string, string, string[]][] = [
  ["Comment éviter les feux de brousse ?", "Ne pas allumer de feu dans la brousse", ["Allumer des feux près des herbes sèches", "Jeter des cendres chaudes dans l'herbe"]],
  ["Que faire des déchets ?", "Les mettre à la poubelle", ["Les brûler dans la brousse", "Les jeter dans la rue"]],
  ["Comment éviter les sachets plastiques ?", "Utiliser un panier ou un sac en tissu", ["En acheter beaucoup plus", "Les jeter par terre"]],
  ["Que faire quand on coupe un arbre ?", "Planter un nouvel arbre", ["Couper un autre arbre", "Ne rien faire du tout"]],
  ["Que peut-on faire pour garder le quartier propre ?", "Ramasser les déchets ensemble", ["Jeter les déchets dans le puits", "Laisser les déchets au soleil"]],
  ["Comment économiser l'eau ?", "Fermer le robinet quand on ne s'en sert pas", ["Laisser couler l'eau", "Remplir un seau et le vider"]],
  ["Comment protéger les arbres de la brousse ?", "Ne pas couper de jeunes arbres", ["Allumer un feu autour des troncs", "Couper les plus petits d'abord"]],
  ["Que faire pour ne pas gaspiller l'eau du puits ?", "Ne prendre que l'eau dont on a besoin", ["Laisser le seau ouvert au soleil", "Remplir tous les seaux du village"]],
];
const ENV_ORDRE_T: [string, string[]][] = [
  ["Mets ces gestes dans l'ordre du temps pour planter un arbre.", ["Creuser un trou", "Mettre le jeune arbre", "Reboucher avec la terre", "Arroser"]],
  ["Mets ces événements dans l'ordre du temps.", ["On coupe beaucoup d'arbres", "Le sol n'est plus protégé", "La pluie emporte la terre"]],
  ["Mets ces gestes dans l'ordre du temps pour jeter des déchets.", ["Ramasser les déchets", "Les mettre dans un sac", "Jeter le sac à la poubelle"]],
  ["Mets ces événements dans l'ordre du temps.", ["Une étincelle tombe dans l'herbe sèche", "Le feu s'étend", "Les arbres brûlent"]],
];
const ENV_TROU_T: [string, string, string[]][] = [
  ["Un quartier trop ___ manque souvent d'eau.", "peuplé", ["propre", "vert"]],
  ["Les feux de ___ brûlent les arbres et les herbes.", "brousse", ["puits", "école"]],
  ["Pour remplacer un arbre coupé, on en ___ un autre.", "plante", ["brûle", "coupe"]],
  ["Il faut ___ le robinet quand on ne s'en sert pas.", "fermer", ["casser", "ouvrir"]],
  ["On ne doit pas ___ les déchets dans la rue.", "jeter", ["compter", "ramasser"]],
  ["Pour garder le quartier propre, on ___ les déchets ensemble.", "ramasse", ["cache", "perd"]],
  ["Un feu de brousse peut brûler toute la ___.", "forêt", ["lune", "mer"]],
  ["Les sachets plastiques ne ___ pas dans la terre.", "pourrissent", ["chantent", "dorment"]],
  ["Planter un arbre aide à protéger la ___.", "nature", ["cuisine", "voiture"]],
  ["Un sachet plastique reste très longtemps dans la ___.", "nature", ["classe", "cuisine"]],
  ["On met les déchets à la ___.", "poubelle", ["brousse", "rue"]],
  ["Un sac en ___ peut remplacer un sachet plastique.", "tissu", ["pierre", "sable"]],
];
const ENV_ECRIRE_T: [string, string[]][] = [
  ["Que ramasse-t-on ensemble pour garder le quartier propre ? Écris le mot.", ["déchets", "les déchets", "dechets", "ordures"]],
  ["Que faut-il fermer pour ne pas gaspiller l'eau ? Écris le mot.", ["robinet", "le robinet"]],
  ["Quel objet en plastique reste très longtemps dans la nature ? Écris le mot.", ["sachet", "sachets", "un sachet", "sachet plastique"]],
  ["Où faut-il mettre les déchets ? Écris le mot.", ["poubelle", "la poubelle", "une poubelle"]],
  ["Quel liquide manque dans un quartier trop peuplé ? Écris le mot.", ["eau", "l'eau"]],
  ["Comment appelle-t-on le feu qui brûle les herbes et les arbres ? Écris les trois mots.", ["feu de brousse", "feux de brousse", "un feu de brousse"]],
  ["Un quartier où il y a beaucoup trop de monde est trop ___. Écris le mot.", ["peuplé", "surpeuplé"]],
  ["Pour remplacer ce qu'on a coupé dans la brousse, on plante un ___. Écris le mot.", ["arbre", "un arbre"]],
];

// ---------------------------------------------------------------------------
// Une vérification par gabarit
// ---------------------------------------------------------------------------

const CHECKS: Record<string, Check> = {
  // ----- Le corps humain -----
  "ce2-sens-situation": both(checkQuestion(SENS_SITUATION_T), (exo) => ok(optionsOf(exo).every((option) => SENSES_T.includes(option)), `sens inconnu : ${optionsOf(exo).join(" | ")}`)),
  "ce2-organe-qcm": both(checkQuestion(ORGANE_QCM_T), (exo) => ok(optionsOf(exo).every((option) => ORGANS_T.includes(option)), `organe inconnu : ${optionsOf(exo).join(" | ")}`)),
  "ce2-sens-relier": (exo) =>
    all(
      ok(exo.prompt === "Relie chaque organe au sens qu'il permet.", `énoncé inconnu : ${exo.prompt}`),
      ...pairsOf(exo).map((pair) => ok(SENSE_OF_ORGAN[pair.left] === pair.right, `« ${pair.left} » n'est pas l'organe de « ${pair.right} »`)),
      ok(pairsOf(exo).length === 3, "trois paires"),
    ),
  "ce2-os-qcm": checkQuestion(OS_QCM_T),
  "ce2-os-relier": (exo) =>
    all(
      ok(exo.prompt === "Relie chaque partie du corps à son rôle.", `énoncé inconnu : ${exo.prompt}`),
      ...pairsOf(exo).map((pair) => ok(BONE_ROLE[pair.left] === pair.right, `« ${pair.left} » ne va pas avec « ${pair.right} »`)),
      ok(pairsOf(exo).length === 3, "trois paires"),
    ),
  "ce2-squelette-glisser": checkSort(zoneMap([[SKELETON_T, "Squelette"], [ORGANS_T, "Organe d'un sens"]]), [SKELETON_ZONES]),
  "ce2-scene-glisser": (exo) =>
    all(
      ok(exo.prompt === "Glisse chaque scène sous le sens qu'elle fait travailler.", `énoncé inconnu : ${exo.prompt}`),
      ok(zonesOf(exo).length === 2 && zonesOf(exo).every((zone) => SENSES_T.includes(zone)), `cases ${zonesOf(exo).join(" | ")}`),
      ...itemsOf(exo).map((item) => ok(SCENE_SENSE[item.text] === item.correctZone, `« ${item.text} » fait travailler « ${SCENE_SENSE[item.text]} », pas « ${item.correctZone} »`)),
      ok(itemsOf(exo).length === 4, "quatre scènes"),
    ),
  "ce2-corps-trou": checkGap(CORPS_TROU_T),
  "ce2-corps-ecrire": checkWrite(CORPS_ECRIRE_T),

  // ----- La vie des plantes -----
  "ce2-plante-qcm": both(checkQuestion(PLANTE_QCM_T), (exo) =>
    NEED_PROMPTS.includes(exo.prompt) ? ok(NEEDS_T.includes(rightOption(exo)) && wrongOf(exo).every((option) => NOT_NEEDS_T.includes(option)), `besoins ${optionsOf(exo).join(" | ")}`) : null,
  ),
  "ce2-plante-trou": checkGap(PLANTE_TROU_T),
  "ce2-plante-ecrire": checkWrite(PLANTE_ECRIRE_T),
  "ce2-besoin-glisser": both(checkSort(zoneMap([[NEEDS_T, "Il lui faut"], [NOT_NEEDS_T, "Il ne lui faut pas"]]), [["Il lui faut", "Il ne lui faut pas"]]), (exo) =>
    ok(exo.prompt === "Glisse chaque mot dans la bonne case, selon ce qu'il faut à une graine pour germer.", `énoncé inconnu : ${exo.prompt}`),
  ),
  "ce2-plante-ordre": checkOrder(PLANTE_ORDRE_T),
  "ce2-plante-relier": checkLink({
    "Relie chaque plante à ce qui porte sa graine.": FRUIT_SEED,
    "Relie chaque partie à ce qu'elle fait.": PART_ROLE,
  }),

  // ----- La vie des animaux -----
  "ce2-ovipare-qcm": (exo) => {
    const ovipare = exo.prompt === "Lequel de ces animaux est ovipare ?";
    if (!ovipare && exo.prompt !== "Lequel de ces animaux est vivipare ?") return `question inconnue : ${exo.prompt}`;
    const [good, bad] = ovipare ? [OVIPARES_T, VIVIPARES_T] : [VIVIPARES_T, OVIPARES_T];
    return all(ok(good.includes(rightOption(exo)), `« ${rightOption(exo)} » n'est pas ${ovipare ? "ovipare" : "vivipare"}`), ok(wrongOf(exo).length === 2 && wrongOf(exo).every((option) => bad.includes(option)), `mauvais choix ${wrongOf(exo).join(" | ")}`));
  },
  "ce2-animal-definition": checkQuestion(ANIMAL_DEFINITION_T),
  "ce2-animal-glisser": checkSort(zoneMap([[OVIPARES_T, "Ovipares"], [VIVIPARES_T, "Vivipares"]]), [["Ovipares", "Vivipares"]]),
  "ce2-petit-relier": checkLink({ "Relie chaque animal à son petit.": YOUNG_T }),
  "ce2-cycle-ordre": both(checkOrder(CYCLE_ORDRE_T), (exo) => {
    const animal = /vie (?:du|de la) (\p{L}+)/u.exec(exo.prompt)?.[1];
    if (!animal || !LIFE_T[animal]) return `animal inconnu : ${exo.prompt}`;
    return all(ok(/ordre du temps/u.test(exo.prompt), "l'énoncé ne dit pas selon quoi ranger"), ok(sameSeq(sequenceOf(exo), LIFE_T[animal]), `suite ${sequenceOf(exo).join(" > ")} au lieu de ${LIFE_T[animal].join(" > ")}`));
  }),
  "ce2-cycle-qcm": checkQuestion(CYCLE_QCM_T),
  "ce2-animal-trou": checkGap(ANIMAL_TROU_T),
  "ce2-animal-ecrire": both(checkWrite(ANIMAL_ECRIRE_T), (exo) => {
    const ovipare = exo.prompt === "Nomme un animal ovipare. Écris le mot.";
    const vivipare = exo.prompt === "Nomme un animal vivipare. Écris le mot.";
    if (!ovipare && !vivipare) return null;
    const names = (ovipare ? OVIPARES_T : VIVIPARES_T).map((name) => name.toLowerCase());
    return ok(acceptedOf(exo).every((answer) => names.includes(answer)), `réponse admise qui n'est pas ${ovipare ? "ovipare" : "vivipare"} : ${acceptedOf(exo).join(" | ")}`);
  }),

  // ----- Le circuit électrique -----
  "ce2-circuit-piece-qcm": both(checkQuestion(CIRCUIT_PIECE_QCM_T), (exo) => ok(optionsOf(exo).every((option) => option in PIECE_ROLE), `pièce inconnue : ${optionsOf(exo).join(" | ")}`)),
  "ce2-circuit-piece-relier": checkLink({ "Relie chaque pièce à son rôle.": PIECE_ROLE }),
  "ce2-circuit-etat-qcm": checkQuestion(CIRCUIT_ETAT_QCM_T),
  "ce2-conducteur-glisser": checkSort(zoneMap([[CONDUCTORS_T, "Conducteur"], [INSULATORS_T, "Isolant"]]), [["Conducteur", "Isolant"]]),
  "ce2-matiere-qcm": (exo) => {
    const conductor = exo.prompt === "Lequel de ces matériaux laisse passer l'électricité ?" || exo.prompt === "Lequel de ces matériaux est un conducteur ?";
    const insulator = exo.prompt === "Lequel de ces matériaux bloque l'électricité ?" || exo.prompt === "Lequel de ces matériaux est un isolant ?";
    if (!conductor && !insulator) return `question inconnue : ${exo.prompt}`;
    const [good, bad] = conductor ? [CONDUCTORS_T, INSULATORS_T] : [INSULATORS_T, CONDUCTORS_T];
    return all(ok(good.includes(rightOption(exo)), `« ${rightOption(exo)} » n'est pas ${conductor ? "un conducteur" : "un isolant"}`), ok(wrongOf(exo).length === 2 && wrongOf(exo).every((option) => bad.includes(option)), `mauvais choix ${wrongOf(exo).join(" | ")}`));
  },
  "ce2-danger-glisser": checkSort(zoneMap([[SAFE_ACTS_T, "À faire"], [DANGEROUS_ACTS_T, "À ne pas faire"]]), [["À faire", "À ne pas faire"]]),
  "ce2-circuit-ordre": checkOrder(CIRCUIT_ORDRE_T),
  "ce2-circuit-trou": checkGap(CIRCUIT_TROU_T),
  "ce2-circuit-ecrire": checkWrite(CIRCUIT_ECRIRE_T),

  // ----- Se protéger des maladies -----
  "ce2-palu-qcm": checkQuestion(PALU_QCM_T),
  "ce2-vih-qcm": checkQuestion(VIH_QCM_T),
  "ce2-geste-glisser": checkSort(zoneMap([[MALARIA_ACTS_T, "Paludisme"], [HIV_ACTS_T, "VIH"]]), [["Paludisme", "VIH"]]),
  "ce2-vih-glisser": checkSort(zoneMap([[SAFE_WITH_HIV_T, "Sans danger"], [RISK_WITH_HIV_T, "Dangereux"]]), [["Sans danger", "Dangereux"]]),
  "ce2-palu-relier": checkLink({ "Relie chaque geste à ce qu'il apporte.": MALARIA_LINK_T }),
  "ce2-sante-trou": checkGap(SANTE_TROU_T),
  "ce2-sante-ecrire": checkWrite(SANTE_ECRIRE_T),

  // ----- L'environnement et la population -----
  "ce2-env-cause-qcm": checkQuestion(ENV_CAUSE_QCM_T),
  "ce2-env-solution-qcm": checkQuestion(ENV_SOLUTION_QCM_T),
  "ce2-env-relier": checkLink({ "Relie chaque problème à une solution.": PROBLEM_LINK_T }),
  "ce2-env-probleme-glisser": checkSort(zoneMap([[NATURE_PROBLEMS_T, "Environnement"], [PEOPLE_PROBLEMS_T, "Population"]]), [["Environnement", "Population"]]),
  "ce2-env-geste-glisser": checkSort(zoneMap([[GOOD_ACTS_T, "Bon geste"], [BAD_ACTS_T, "Mauvais geste"]]), [["Bon geste", "Mauvais geste"]]),
  "ce2-env-ordre": checkOrder(ENV_ORDRE_T),
  "ce2-env-trou": checkGap(ENV_TROU_T),
  "ce2-env-ecrire": checkWrite(ENV_ECRIRE_T),
};

const KINDS = Object.keys(CHECKS) as GameKind[];
const TOPIC_KINDS: Record<string, string[]> = {
  "sc-ce2-corps": ["ce2-sens-situation", "ce2-organe-qcm", "ce2-sens-relier", "ce2-os-qcm", "ce2-os-relier", "ce2-squelette-glisser", "ce2-scene-glisser", "ce2-corps-trou", "ce2-corps-ecrire"],
  "sc-ce2-plantes": ["ce2-plante-qcm", "ce2-plante-trou", "ce2-plante-ecrire", "ce2-besoin-glisser", "ce2-plante-ordre", "ce2-plante-relier"],
  "sc-ce2-animaux": ["ce2-ovipare-qcm", "ce2-animal-definition", "ce2-animal-glisser", "ce2-petit-relier", "ce2-cycle-ordre", "ce2-cycle-qcm", "ce2-animal-trou", "ce2-animal-ecrire"],
  "sc-ce2-electricite": ["ce2-circuit-piece-qcm", "ce2-circuit-piece-relier", "ce2-circuit-etat-qcm", "ce2-conducteur-glisser", "ce2-matiere-qcm", "ce2-danger-glisser", "ce2-circuit-ordre", "ce2-circuit-trou", "ce2-circuit-ecrire"],
  "sc-ce2-sante": ["ce2-palu-qcm", "ce2-vih-qcm", "ce2-geste-glisser", "ce2-vih-glisser", "ce2-palu-relier", "ce2-sante-trou", "ce2-sante-ecrire"],
  "sc-ce2-environnement": ["ce2-env-cause-qcm", "ce2-env-solution-qcm", "ce2-env-relier", "ce2-env-probleme-glisser", "ce2-env-geste-glisser", "ce2-env-ordre", "ce2-env-trou", "ce2-env-ecrire"],
};
const TOPIC_KEYS = Object.keys(TOPIC_KINDS);
const topicOfKind = (kind: string) => TOPIC_KEYS.find((key) => TOPIC_KINDS[key].includes(kind)) as string;
const entryOf = (key: string) => allProgrammeEntries().find((entry) => entry.topic.key === key)!;
const subjectOfKind = (kind: string) => entryOf(topicOfKind(kind)).subject.name;

describe("chaque gabarit des sciences du CE2 a sa vérification", () => {
  it("couvre exactement les quarante-sept gabarits, tous rangés dans une thématique", () => {
    expect(KINDS).toHaveLength(47);
    expect(Object.values(TOPIC_KINDS).flat().sort()).toEqual([...KINDS].sort());
    for (const kind of KINDS) expect(Object.keys(GAME_KINDS), kind).toContain(kind);
  });
});

describe("les gabarits des sciences du CE2 recalculent juste, depuis une table écrite à part", () => {
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
  it("donnent à chaque sens un organe différent, et cinq sens", () => {
    expect(SENSES_T).toHaveLength(5);
    expect(new Set(ORGANS_T).size).toBe(5);
    expect(Object.keys(SCENE_SENSE)).toHaveLength(15);
    for (const sense of SENSES_T) expect(Object.values(SCENE_SENSE).filter((value) => value === sense), sense).toHaveLength(3);
  });

  it("séparent les animaux ovipares des vivipares, et donnent à chaque petit un nom différent", () => {
    expect(OVIPARES_T.filter((name) => VIVIPARES_T.includes(name))).toEqual([]);
    expect(new Set(Object.values(YOUNG_T)).size).toBe(Object.keys(YOUNG_T).length);
    for (const animal of Object.keys(YOUNG_T)) expect([...OVIPARES_T, ...VIVIPARES_T], animal).toContain(animal);
  });

  it("commencent la vie d'un ovipare par l'œuf et la finissent par l'animal adulte", () => {
    for (const [animal, steps] of Object.entries(LIFE_T)) {
      expect(steps[0], animal).toBe("Œuf");
      expect(steps[steps.length - 1].toLowerCase(), animal).toBe(animal);
      expect(OVIPARES_T.map((name) => name.toLowerCase()), animal).toContain(animal);
    }
  });

  it("séparent les conducteurs des isolants, et les gestes sûrs des gestes dangereux", () => {
    expect(CONDUCTORS_T.filter((name) => INSULATORS_T.includes(name))).toEqual([]);
    expect(SAFE_ACTS_T.filter((name) => DANGEROUS_ACTS_T.includes(name))).toEqual([]);
    expect(SAFE_WITH_HIV_T.filter((name) => RISK_WITH_HIV_T.includes(name))).toEqual([]);
    expect(GOOD_ACTS_T.filter((name) => BAD_ACTS_T.includes(name))).toEqual([]);
    expect(NATURE_PROBLEMS_T.filter((name) => PEOPLE_PROBLEMS_T.includes(name))).toEqual([]);
  });

  it("ne rangent parmi les gestes dangereux pour le VIH que le sang, la lame et la seringue", () => {
    expect(RISK_WITH_HIV_T.every((act) => /lame|seringue|sang/u.test(fold(act)))).toBe(true);
    expect(SAFE_WITH_HIV_T.every((act) => !/lame|seringue|sang/u.test(fold(act)))).toBe(true);
  });

  it("ne donnent à une graine que trois besoins, la lumière n'étant pas dite par la fiche", () => {
    expect(NEEDS_T).toEqual(["Eau", "Chaleur", "Air"]);
    expect(NOT_NEEDS_T.map(fold)).not.toContain("lumiere");
    expect(NOT_NEEDS_T.map(fold)).not.toContain("soleil");
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

  it("voient aussi un énoncé abîmé : un animal échangé, un circuit retourné, un sens changé, un matériau échangé", () => {
    // « ovipare » devenu « vivipare » : la bonne option n'est plus la bonne.
    seesDamage("ce2-ovipare-qcm", (exo) => exo.prompt.includes("est ovipare"), (exo) => ({ ...exo, prompt: exo.prompt.replace("est ovipare", "est vivipare") }));
    seesDamage("ce2-ovipare-qcm", (exo) => exo.prompt.includes("est vivipare"), (exo) => ({ ...exo, prompt: exo.prompt.replace("est vivipare", "est ovipare") }));
    // « laisse passer » devenu « bloque » : un conducteur n'est plus la réponse.
    seesDamage("ce2-matiere-qcm", (exo) => exo.prompt.includes("laisse passer"), (exo) => ({ ...exo, prompt: exo.prompt.replace("laisse passer", "bloque") }));
    seesDamage("ce2-matiere-qcm", (exo) => exo.prompt.includes("bloque"), (exo) => ({ ...exo, prompt: exo.prompt.replace("bloque", "laisse passer") }));
    // « ouvert » devenu « fermé » dans la question sur l'interrupteur.
    seesDamage("ce2-circuit-etat-qcm", (exo) => exo.prompt.startsWith("L'interrupteur est ouvert"), (exo) => ({ ...exo, prompt: exo.prompt.replace("ouvert", "fermé") }));
    // Les deux sens d'un glissé échangés : chaque scène se retrouve sous l'autre sens.
    seesDamage("ce2-scene-glisser", () => true, (exo) => {
      const [a, b] = zonesOf(exo);
      return { ...exo, payload: { ...exo.payload, zones: [b, a], items: itemsOf(exo).map((item) => ({ ...item, correctZone: item.correctZone === a ? b : a })) } };
    });
    // L'animal du cycle changé dans l'énoncé : la suite n'est plus la sienne.
    seesDamage("ce2-cycle-ordre", (exo) => /papillon/u.test(exo.prompt), (exo) => ({ ...exo, prompt: exo.prompt.replace("papillon", "grenouille") }));
    // Deux sens d'une paire échangés : « Yeux ~ Vue » devient « Yeux ~ Ouïe ».
    seesDamage("ce2-sens-relier", () => true, (exo) => {
      const pairs = pairsOf(exo).map((pair) => ({ ...pair }));
      [pairs[0].right, pairs[1].right] = [pairs[1].right, pairs[0].right];
      return { ...exo, payload: { ...exo.payload, pairs } };
    });
    // Un besoin de la graine remplacé par une chose inutile, dans la case « il lui faut ».
    seesDamage("ce2-besoin-glisser", (exo) => itemsOf(exo).some((item) => item.text === "Eau"), (exo) => ({ ...exo, payload: { ...exo.payload, items: itemsOf(exo).map((item) => (item.text === "Eau" ? { ...item, text: "Sel" } : item)) } }));
    // « sans danger » et « dangereux » échangés.
    seesDamage("ce2-vih-glisser", () => true, (exo) => ({ ...exo, payload: { ...exo.payload, items: itemsOf(exo).map((item) => ({ ...item, correctZone: item.correctZone === "Dangereux" ? "Sans danger" : "Dangereux" })) } }));
  });
});

// ===========================================================================
// LES RÈGLES COMMUNES
// ===========================================================================

describe("tous les gabarits des sciences du CE2", () => {
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

describe("les six thématiques de sciences du CE2", () => {
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
    expect(TOPIC_KEYS).toHaveLength(6);
    expect(TOPIC_KEYS.slice().sort()).toEqual(["sc-ce2-animaux", "sc-ce2-corps", "sc-ce2-electricite", "sc-ce2-environnement", "sc-ce2-plantes", "sc-ce2-sante"]);
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

  it("ne reposent pas la même question d'un palier à l'autre : chaque palier a sa part des lignes", () => {
    for (const key of TOPIC_KEYS) {
      let total = 0;
      let repeated = 0;
      for (let n = 0; n < 20; n++) {
        const seen = new Map<string, number>();
        for (const palierIndex of [1, 2, 3, 4]) {
          const games = generateGames(topicOf(key).games ?? [], { klass: "CE2", palierIndex, palierCount: 4, seed: `variete:${key}:${n}:${palierIndex}` });
          for (const game of games) {
            const items = game.payload.items as { text: string; correctZone: string }[] | undefined;
            const pairs = game.payload.pairs as { left: string; right: string }[] | undefined;
            const answer = items
              ? items.map((item) => `${item.text}>${item.correctZone}`).sort().join(";")
              : pairs
                ? pairs.map((pair) => `${pair.left}~${pair.right}`).sort().join(";")
                : game.answerKey;
            const question = `${(game.payload.game as { kind: string }).kind}|${game.prompt}|${String(game.payload.text ?? "")}|${answer}`;
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
