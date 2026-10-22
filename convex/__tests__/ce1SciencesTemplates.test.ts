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
 * LES SCIENCES DU CE1 : comment se nourrissent les êtres vivants, la respiration, les substances autour de nous, l'eau potable, les parasites et le
 * paludisme, les objets techniques simples.
 *
 * Chaque test RECALCULE la bonne réponse depuis l'énoncé et les tuiles, avec ses propres tables écrites à part : le régime de chaque animal, qui mange
 * quoi dans une chaîne, l'organe de chaque animal, ce qui se dissout, les gestes qui rendent l'eau potable, ce qui protège du paludisme, l'usage de chaque
 * objet. Un gabarit dont la réponse contredit sa table échoue. À la fin, des MUTATIONS : on abîme la bonne réponse d'un exercice juste, et chaque
 * vérification doit le voir. L'échantillon du modèle comptait 6 exercices faux sur 36 en sciences du CE1 (un ordre arbitraire de la prévention du
 * paludisme, « Quel aliment aide les poumons ? », la farine qui se dissout, une question ouverte sur un robinet).
 */

const LEVELS: GameLevel[] = [1, 2, 3, 4];
const draws = LEVELS.flatMap((level) => Array.from({ length: 60 }, (_, n) => ({ level, seed: `ce1sci:${level}:${n}` })));
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
const cap = (text: string) => `${text[0].toUpperCase()}${text.slice(1)}`;

type Check = (exo: Exo) => string | null;
const ok = (condition: boolean, message: string) => (condition ? null : message);
/** Le premier message d'erreur d'une suite de vérifications. */
const all = (...results: (string | null)[]) => results.find((result) => result !== null) ?? null;
/** Les choix d'un QCM sans la bonne réponse. */
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
/** Un appariement : chaque gauche a, dans la table, la droite qu'on lui a donnée ; trois paires. */
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
/** Un ordre : l'énoncé et la suite doivent être ceux d'une ligne de la table. */
const checkSteps =
  (table: readonly (readonly [string, readonly string[]])[]): Check =>
  (exo) => {
    const row = table.find((entry) => entry[0] === exo.prompt && sameSeq(entry[1], sequenceOf(exo)));
    return ok(!!row, `suite inconnue : ${exo.prompt} → ${sequenceOf(exo).join(" > ")}`);
  };
/** Une réponse à écrire : [énoncé, mot juste]. Le mot juste est la première écriture admise et la clé. */
const checkWrite =
  (table: readonly (readonly [string, string])[]): Check =>
  (exo) => {
    const row = table.find((entry) => entry[0] === exo.prompt);
    if (!row) return `énoncé inconnu : ${exo.prompt}`;
    return all(
      ok(acceptedOf(exo)[0] === row[1] && exo.answerKey === row[1], `le mot juste est « ${row[1]} », le gabarit dit « ${acceptedOf(exo)[0]} » (clé « ${exo.answerKey} »)`),
      ok(acceptedOf(exo).every((accepted) => accepted.includes(row[1].slice(0, 4))), `une écriture admise ne contient pas « ${row[1]} » : ${acceptedOf(exo).join(" | ")}`),
    );
  };

// ===========================================================================
// COMMENT SE NOURRISSENT LES ÊTRES VIVANTS (sc-ce1-nutrition) : les tables
// ===========================================================================

type Diet = "herbivore" | "carnivore" | "omnivore";
const ANIMAL_DIET: Record<string, Diet> = {
  Mouton: "herbivore",
  Vache: "herbivore",
  Chèvre: "herbivore",
  Cheval: "herbivore",
  Âne: "herbivore",
  Zèbre: "herbivore",
  Girafe: "herbivore",
  Éléphant: "herbivore",
  Lapin: "herbivore",
  Lion: "carnivore",
  Léopard: "carnivore",
  Hyène: "carnivore",
  Crocodile: "carnivore",
  Aigle: "carnivore",
  Serpent: "carnivore",
  Chat: "carnivore",
  Homme: "omnivore",
  Poule: "omnivore",
  Singe: "omnivore",
  Rat: "omnivore",
  Pintade: "omnivore",
  Corbeau: "omnivore",
};
/** Le nom d'un animal depuis son groupe nominal (« le lion », « l'âne », « la hyène »). */
const animalOf = (phrase: string): string => cap(phrase.replace(/^(?:le|la|l'|les) ?/u, ""));
const DIET_WORDS: Record<Diet, string> = { herbivore: "Herbivore", carnivore: "Carnivore", omnivore: "Omnivore" };
const DEFINITIONS: Record<string, Diet> = {
  "Comment appelle-t-on un animal qui mange seulement des plantes ?": "herbivore",
  "Comment appelle-t-on un animal qui mange seulement de la viande ?": "carnivore",
  "Comment appelle-t-on un animal qui mange des plantes et de la viande ?": "omnivore",
};
/** Les seuls animaux dont on demande ce qu'ils mangent. */
const EATS_FOOD: Record<string, string> = { Mouton: "Herbe", Vache: "Herbe", Cheval: "Herbe", Chèvre: "Herbe", Âne: "Herbe", Zèbre: "Herbe", Lion: "Viande", Léopard: "Viande", Hyène: "Viande" };

/** Qui mange quoi : de quoi se nourrit chaque maillon des chaînes. */
const FOOD_OF: Record<string, string[]> = {
  Mouton: ["Herbe"],
  Zèbre: ["Herbe"],
  Vache: ["Herbe"],
  Lapin: ["Herbe"],
  Sauterelle: ["Herbe"],
  Criquet: ["Herbe", "Mil"],
  Lion: ["Mouton", "Zèbre"],
  Poule: ["Mil", "Sauterelle", "Criquet"],
  Homme: ["Poule", "Mouton", "Vache"],
  Souris: ["Graine"],
  Serpent: ["Souris", "Lapin"],
  Aigle: ["Lapin", "Serpent", "Oiseau"],
  Chenille: ["Feuille"],
  Oiseau: ["Chenille"],
};
const PLANTS = ["Herbe", "Mil", "Graine", "Feuille"];
/** Une chaîne est juste si elle commence par une plante et que chaque maillon mange celui qui le précède. */
const chainIsValid = (chain: readonly string[]) => PLANTS.includes(chain[0]) && chain.slice(1).every((link, i) => (FOOD_OF[link] ?? []).includes(chain[i]));
const eatersOf = (food: string) => Object.keys(FOOD_OF).filter((name) => FOOD_OF[name].includes(food));

const PLANT_Q: readonly QRow[] = [
  ["Que faut-il donner à une plante pour qu'elle grandisse ?", "Eau", ["Lumière", "Terre"]],
  ["Qu'est-ce que le soleil donne à une plante ?", "Lumière", ["Eau", "Chaleur"]],
  ["Où les racines prennent-elles l'eau ?", "Dans le sol", ["Dans la terre"]],
  ["Une plante reste dans le noir. Que lui manque-t-il ?", "Lumière", ["Eau"]],
  ["Une plante n'est jamais arrosée. Que lui manque-t-il ?", "Eau", ["Lumière"]],
  ["Une plante est posée sur du béton, sans terre. Que lui manque-t-il ?", "Terre", ["Sol"]],
  ["De quoi une plante a-t-elle besoin pour vivre ?", "D'eau, de lumière et de sol"],
  ["Que fait le jardinier pour aider ses plantes à grandir ?", "Il les arrose"],
];
const PLANT_GAP_T: readonly GRow[] = [
  ["Pour grandir, une plante a besoin de lumière, de sol et d'___.", "eau", ["huile", "encre"]],
  ["Pour grandir, une plante a besoin d'eau, de sol et de ___.", "lumière", ["viande", "sable"]],
  ["Pour grandir, une plante a besoin d'eau, de lumière et de ___.", "sol", ["viande", "plastique"]],
  ["Les racines d'une plante boivent l'eau du ___.", "sol", ["ciel", "vent"]],
  ["La plante reçoit sa lumière du ___.", "soleil", ["sable", "vent"]],
  ["Une plante sans eau ne peut pas ___.", "grandir", ["courir", "chanter"]],
];
const HELPS_PLANT = ["Eau", "Lumière", "Soleil", "Terre", "Pluie"];
const HARMS_PLANT = ["Cailloux", "Plastique", "Viande", "Béton", "Ferraille"];
const PLANT_ZONES: readonly [string, string] = ["Aide la plante", "N'aide pas la plante"];

// ===========================================================================
// LA RESPIRATION (sc-ce1-respiration) : les tables
// ===========================================================================

const BREATHES_WITH: Record<string, "Poumons" | "Branchies"> = {
  Homme: "Poumons",
  Chien: "Poumons",
  Vache: "Poumons",
  Poule: "Poumons",
  Mouton: "Poumons",
  Chat: "Poumons",
  Cheval: "Poumons",
  Lion: "Poumons",
  Poisson: "Branchies",
  Sardine: "Branchies",
  Thiof: "Branchies",
  Requin: "Branchies",
};
const BREATH_Q: readonly QRow[] = [
  ["Par où l'air entre-t-il dans ton corps ?", "Par le nez et la bouche"],
  ["Quels organes reçoivent l'air quand tu respires ?", "Poumons"],
  ["Où se trouvent les poumons ?", "Dans la poitrine"],
  ["Que fait le poisson avec ses branchies ?", "Il respire dans l'eau"],
  ["Que fait l'homme avec ses poumons ?", "Il respire l'air"],
  ["Où vaut-il mieux aller pour respirer un air pur ?", "Sous les arbres", ["Près des arbres"]],
];
const POLLUTES = ["Fumée", "Poussière", "Déchets brûlés"];
const CLEAN_AIR = ["Vent", "Pluie", "Arbres"];
const AIR_SORT_ZONES: readonly [string, string] = ["Pollue l'air", "Ne pollue pas l'air"];
const POLLUTES_TILES = ["Fumée noire", "Poussière", "Déchets brûlés", "Fumée de voiture"];
const CLEAN_TILES = ["Vent", "Pluie", "Arbres", "Herbe", "Nuage"];
const BREATH_LINK_T: Record<string, string> = {
  Poumons: "L'homme respire avec eux",
  Branchies: "Le poisson respire avec elles",
  Nez: "L'air y entre quand on respire",
  Fumée: "Elle rend l'air pollué",
  "Air pur": "Il fait du bien quand on respire",
};
const BREATH_GAP_T: readonly GRow[] = [
  ["L'homme respire avec ses ___.", "poumons", ["branchies", "oreilles"]],
  ["Le poisson respire avec ses ___.", "branchies", ["poumons", "yeux"]],
  ["L'air entre dans le corps par le nez et la ___.", "bouche", ["main", "oreille"]],
  ["La ___ noire rend l'air pollué.", "fumée", ["pluie", "herbe"]],
  ["Sous les arbres, l'air est plus ___.", "pur", ["pollué", "sale"]],
  ["Quand l'air est plein de poussière, il est ___.", "pollué", ["pur", "frais"]],
  ["Un thiof respire avec ses ___.", "branchies", ["poumons", "pattes"]],
  ["L'air que l'on respire va jusqu'aux ___.", "poumons", ["genoux", "dents"]],
];

// ===========================================================================
// LES SUBSTANCES AUTOUR DE NOUS (sc-ce1-substances) : les tables
// ===========================================================================

/** Les deux seuls produits qui se dissolvent ici. */
const DISSOLVES = ["Sel", "Sucre"];
const STAYS = ["Sable", "Caillou", "Gravier", "Riz", "Bois", "Clou", "Charbon", "Brique"];
const ASKS_DISSOLVE = [
  "Quel produit se dissout dans l'eau ?",
  "Lequel de ces produits se dissout dans l'eau ?",
  "Quel produit disparaît quand on le remue dans l'eau ?",
  "Lequel de ces produits se mélange à l'eau sans se voir ?",
  "Quel produit ne se voit plus après avoir été remué dans l'eau ?",
  "Quel produit peut-on dissoudre dans l'eau ?",
];
const ASKS_STAY = [
  "Quel produit ne se dissout pas dans l'eau ?",
  "Lequel de ces produits reste visible dans l'eau ?",
  "Quel produit ne disparaît pas quand on le remue dans l'eau ?",
  "Lequel de ces produits ne se mélange pas à l'eau ?",
];
const SUBSTANCE_Q: readonly QRow[] = [
  ["Que devient le sucre quand on le remue dans l'eau ?", "Il se dissout", ["Il disparaît"]],
  ["Que devient le sel quand on le remue dans l'eau ?", "Il se dissout", ["Il disparaît"]],
  ["Un verre d'eau contient du sable. On le laisse reposer. Où va le sable ?", "Au fond du verre"],
  ["Quel geste retient le sable avec un tissu propre ?", "Filtrer"],
  ["Quel geste laisse le sable tomber au fond du verre ?", "Laisser reposer", ["Attendre"]],
  ["Quel geste répartit le sucre dans toute l'eau ?", "Mélanger", ["Remuer"]],
  ["On remue du sable dans l'eau, puis on attend. Que se passe-t-il ?", "Le sable tombe au fond"],
  ["On verse une eau sableuse sur un tissu. Que reste-t-il sur le tissu ?", "Sable", ["Gravier"]],
  ["Quel produit peut-on retenir avec un filtre ?", "Sable", ["Gravier"]],
  ["Quel geste mélange le sel dans l'eau ?", "Remuer avec une cuillère", ["Mélanger"]],
];
const SUBSTANCE_LINK_T: Record<string, string> = {
  Mélanger: "Remuer pour répartir un produit",
  Filtrer: "Passer l'eau dans un tissu propre",
  "Laisser reposer": "Attendre que ce qui est lourd tombe",
  Sel: "Il se dissout dans l'eau",
  Sable: "Il reste visible dans l'eau",
};
const SUBSTANCE_GAP_T: readonly GRow[] = [
  ["Le sel et le sucre se ___ dans l'eau.", "dissolvent", ["cassent", "cachent"]],
  ["Le sable ne se dissout pas et tombe au ___ du verre.", "fond", ["haut", "bord"]],
  ["Pour retenir le sable, on ___ l'eau avec un tissu propre.", "filtre", ["goûte", "mange"]],
  ["Pour dissoudre le sucre dans l'eau, il faut ___ le mélange.", "remuer", ["filtrer", "casser"]],
  ["Le ___ est un produit qui se dissout dans l'eau.", "sucre", ["sable", "caillou"]],
  ["Le ___ est un produit qui ne se dissout pas dans l'eau.", "sable", ["sel", "sucre"]],
  ["Dans un verre d'eau salée, on ne voit plus le ___.", "sel", ["sable", "caillou"]],
  ["Pour séparer le sable de l'eau, on peut laisser ___ le mélange.", "reposer", ["brûler", "danser"]],
];
const SUBSTANCE_STEPS_T: readonly (readonly [string, readonly string[]])[] = [
  ["Pour séparer le sable de l'eau, mets ces gestes du premier au dernier.", ["Mélange le sable et l'eau", "Laisse reposer le verre", "Verse l'eau claire"]],
  ["Pour séparer le sable de l'eau, mets ces gestes du premier au dernier.", ["Mets du sable dans l'eau", "Remue le mélange", "Laisse reposer le verre", "Verse l'eau claire"]],
  ["Pour dissoudre du sucre, mets ces gestes du premier au dernier.", ["Mets de l'eau dans un verre", "Ajoute le sucre", "Remue avec une cuillère"]],
  ["Pour dissoudre du sucre, mets ces gestes du premier au dernier.", ["Prends un verre", "Mets de l'eau dans le verre", "Ajoute le sucre", "Remue avec une cuillère"]],
  ["Pour dissoudre du sel, mets ces gestes du premier au dernier.", ["Mets de l'eau dans un verre", "Ajoute le sel", "Remue avec une cuillère"]],
  ["Pour dissoudre du sel, mets ces gestes du premier au dernier.", ["Prends un verre", "Mets de l'eau dans le verre", "Ajoute le sel", "Remue avec une cuillère"]],
  ["Pour filtrer une eau sableuse, mets ces gestes du premier au dernier.", ["Pose un tissu propre sur un pot", "Verse l'eau sableuse dessus", "Garde l'eau claire"]],
  ["Pour filtrer une eau sableuse, mets ces gestes du premier au dernier.", ["Prends un tissu propre", "Pose-le sur un pot", "Verse l'eau sableuse dessus", "Garde l'eau claire"]],
];

// ===========================================================================
// L'EAU POTABLE (sc-ce1-eau) : les tables
// ===========================================================================

const SOURCE_Q: readonly QRow[] = [
  ["Quelle source donne de l'eau grâce à un trou creusé dans le sol ?", "Puits", ["Forage"]],
  ["Quel nom a le trou creusé dans le sol pour trouver de l'eau ?", "Puits", ["Forage"]],
  ["Quelle source est un trou très profond percé par une machine ?", "Forage", ["Puits"]],
  ["Quel nom a le trou très profond percé par une machine pour trouver l'eau ?", "Forage", ["Puits"]],
  ["Quelle source est un grand cours d'eau qui coule ?", "Fleuve"],
  ["Quel nom a un grand cours d'eau qui va vers la mer ?", "Fleuve"],
  ["Quelle source donne de l'eau quand on tourne une poignée ?", "Robinet"],
  ["Quel objet fait couler l'eau à la maison ?", "Robinet"],
];
const SOURCE_LINK_T: Record<string, string> = {
  Puits: "Un trou creusé dans le sol",
  Forage: "Un trou profond percé par une machine",
  Robinet: "L'eau coule quand on le tourne",
  Fleuve: "Un grand cours d'eau",
  Mare: "De l'eau de pluie dans un creux",
};
/** Les gestes qui rendent bien l'eau plus sûre, tels que les choix les écrivent. */
const SAFE_GESTURES = ["On la fait bouillir", "La faire bouillir", "Eau de javel", "La filtrer", "Y mettre quelques gouttes de javel"];
/** [question, bonne réponse, vrai si la question demande ce qui NE rend PAS l'eau potable]. */
const GESTURE_Q: readonly (readonly [string, string, boolean])[] = [
  ["Que fait-on pour rendre une eau douteuse plus sûre à boire ?", "On la fait bouillir", false],
  ["Quel geste rend l'eau potable avec de la chaleur ?", "La faire bouillir", false],
  ["Que met-on en quelques gouttes pour rendre l'eau potable ?", "Eau de javel", false],
  ["Quel geste retire les saletés de l'eau avec un tissu propre ?", "La filtrer", false],
  ["Quel geste ne rend pas l'eau potable ?", "Y ajouter du sucre", true],
  ["Lequel de ces gestes ne rend pas l'eau plus sûre ?", "La laisser dans un seau ouvert", true],
  ["Quel geste est à éviter pour avoir une eau potable ?", "Y jeter du sable", true],
  ["Que peut-on faire d'une eau trouble avant de la faire bouillir ?", "La filtrer", false],
];
const KEEPING_Q: readonly QRow[] = [
  ["Dans quel récipient garde-t-on l'eau potable ?", "Un récipient propre et couvert"],
  ["Pourquoi couvre-t-on le récipient d'eau potable ?", "Pour garder l'eau propre"],
  ["Que fait-on avant de remplir un récipient pour l'eau potable ?", "On le lave"],
  ["Que fait-on pour que l'eau potable reste propre dans la jarre ?", "On la couvre"],
  ["Où range-t-on le récipient d'eau potable ?", "À l'abri de la poussière"],
  ["Quelle chose peut salir l'eau potable gardée dans un seau ?", "La poussière et les mouches"],
  ["Pourquoi lave-t-on le seau avant de mettre l'eau potable dedans ?", "Pour ne pas salir l'eau"],
  ["Quel récipient garde l'eau potable propre ?", "Un seau propre avec son couvercle"],
];
const POTABLE_ZONES: readonly [string, string] = ["Rend l'eau potable", "Ne rend pas l'eau potable"];
const POTABLE_SORT_T: Record<string, string> = {
  "Faire bouillir": "Rend l'eau potable",
  Filtrer: "Rend l'eau potable",
  "Gouttes de javel": "Rend l'eau potable",
  "Ajouter du sucre": "Ne rend pas l'eau potable",
  "Ajouter du sable": "Ne rend pas l'eau potable",
  "Laisser ouvert": "Ne rend pas l'eau potable",
  "Remuer avec un bâton": "Ne rend pas l'eau potable",
  "Jeter du sel": "Ne rend pas l'eau potable",
};
const POTABLE_STEPS_T: readonly (readonly [string, readonly string[]])[] = [
  ["Pour rendre l'eau potable en la chauffant, mets ces gestes du premier au dernier.", ["Verse l'eau dans une casserole", "Fais bouillir l'eau", "Laisse refroidir l'eau"]],
  ["Pour rendre l'eau potable en la chauffant, mets ces gestes du premier au dernier.", ["Verse l'eau dans une casserole", "Fais bouillir l'eau", "Laisse refroidir l'eau", "Garde-la dans un récipient couvert"]],
  ["Pour garder l'eau potable, mets ces gestes du premier au dernier.", ["Lave le récipient", "Remplis-le d'eau potable", "Mets le couvercle"]],
  ["Pour garder l'eau potable, mets ces gestes du premier au dernier.", ["Lave le récipient", "Remplis-le d'eau potable", "Mets le couvercle", "Range-le à l'abri"]],
  ["Pour boire l'eau du puits, mets ces gestes du premier au dernier.", ["Puise l'eau du puits", "Fais-la bouillir", "Garde-la dans un récipient couvert"]],
  ["Pour boire l'eau du puits, mets ces gestes du premier au dernier.", ["Puise l'eau du puits", "Filtre-la avec un tissu propre", "Fais-la bouillir", "Garde-la dans un récipient couvert"]],
  ["Pour remplir un seau propre, mets ces gestes du premier au dernier.", ["Ouvre le robinet", "Remplis le seau", "Ferme le robinet"]],
  ["Pour remplir un seau propre, mets ces gestes du premier au dernier.", ["Lave le seau", "Ouvre le robinet", "Remplis le seau", "Ferme le robinet"]],
];
const POTABLE_GAP_T: readonly GRow[] = [
  ["On garde l'eau potable dans un récipient ___ et couvert.", "propre", ["sale", "troué"]],
  ["Pour rendre l'eau potable, on peut la faire ___.", "bouillir", ["geler", "couler"]],
  ["On met quelques gouttes d'eau de ___ dans l'eau pour la rendre potable.", "javel", ["sucre", "sel"]],
  ["Un ___ est un trou creusé dans le sol pour trouver de l'eau.", "puits", ["fleuve", "robinet"]],
  ["Un ___ est un trou très profond percé par une machine.", "forage", ["robinet", "fleuve"]],
  ["On tourne le ___ pour faire couler l'eau.", "robinet", ["puits", "fleuve"]],
  ["Pour retirer les saletés de l'eau, on la ___ avec un tissu propre.", "filtre", ["boit", "casse"]],
  ["On couvre le récipient pour que l'eau reste ___.", "propre", ["sale", "trouble"]],
];
const POTABLE_WRITE_T: readonly (readonly [string, string])[] = [
  ["Pour rendre l'eau potable, on peut la faire quoi ? Écris le verbe.", "bouillir"],
  ["Quel nom a le trou très profond percé par une machine pour trouver l'eau ? Écris le mot.", "forage"],
  ["Quel produit met-on en quelques gouttes pour rendre l'eau potable ? Écris le mot.", "javel"],
  ["Quel nom a le trou creusé dans le sol pour trouver de l'eau ? Écris le mot.", "puits"],
  ["Quel objet fait couler l'eau à la maison ? Écris le mot.", "robinet"],
];

// ===========================================================================
// LES PARASITES ET LE PALUDISME (sc-ce1-paludisme) : les tables
// ===========================================================================

const CAUSE_Q: readonly QRow[] = [
  ["Quel petit animal transmet le paludisme ?", "Moustique"],
  ["Le paludisme se transmet par la piqûre de quel animal ?", "Moustique"],
  ["Comment attrape-t-on le paludisme ?", "Par la piqûre d'un moustique"],
  ["Où les moustiques se développent-ils le mieux ?", "Près des eaux stagnantes"],
  ["Comment s'appelle le moustique qui transmet le paludisme ?", "Anophèle"],
  ["Qui transmet le paludisme d'une personne à une autre ?", "Moustique"],
];
const PROTECT_Q: readonly QRow[] = [
  ["Que met-on au-dessus du lit pour se protéger des moustiques ?", "Moustiquaire", ["Moustiquaire imprégnée"]],
  ["Que faut-il faire des eaux stagnantes ?", "On les supprime", ["On les vide"]],
  ["Que fait-on d'un seau plein qui reste dehors plusieurs jours ?", "On le vide", ["On le couvre"]],
  ["Quand dort-on sous une moustiquaire ?", "Pendant la nuit"],
  ["Pourquoi dort-on sous une moustiquaire imprégnée ?", "Pour éviter les piqûres"],
  ["Quel geste éloigne les moustiques de la cour ?", "Vider les flaques d'eau"],
];
const WORM_Q: readonly QRow[] = [
  ["Que doit-on faire avant de manger pour éviter les vers ?", "Se laver les mains"],
  ["Que faut-il faire des fruits avant de les manger ?", "Les laver"],
  ["Qu'est-ce qui peut donner des vers intestinaux ?", "Des mains sales"],
  ["Quel aliment peut donner des vers ?", "Un fruit mal lavé"],
  ["Pourquoi se lave-t-on les mains avant de manger ?", "Pour éviter les vers"],
  ["Que peuvent donner des mains sales ?", "Des vers intestinaux"],
];
const FEVER_Q: readonly QRow[] = [
  ["Tu as de la fièvre. Que fais-tu ?", "Je vais au dispensaire"],
  ["Où va-t-on quand on a de la fièvre ?", "Au dispensaire"],
  ["Qui peut te soigner au dispensaire ?", "Infirmier", ["Infirmière", "Médecin"]],
  ["Ton ami a de la fièvre. Que lui dis-tu ?", "Va vite au dispensaire"],
  ["Que fais-tu si la fièvre dure plusieurs jours ?", "Je retourne au dispensaire"],
  ["Quand faut-il aller au dispensaire ?", "Quand on a de la fièvre"],
];
const MALARIA_ZONES: readonly [string, string] = ["Protège du paludisme", "Expose au paludisme"];
const MALARIA_SORT_T: Record<string, string> = {
  "Dormir sous moustiquaire": "Protège du paludisme",
  "Vider les seaux d'eau": "Protège du paludisme",
  "Couvrir l'eau": "Protège du paludisme",
  "Boucher les flaques": "Protège du paludisme",
  "Vider les vieux pneus": "Protège du paludisme",
  "Dormir sans moustiquaire": "Expose au paludisme",
  "Laisser l'eau stagner": "Expose au paludisme",
  "Garder des seaux pleins": "Expose au paludisme",
  "Laisser des flaques": "Expose au paludisme",
  "Laisser un pneu plein": "Expose au paludisme",
};
const WORM_ZONES: readonly [string, string] = ["Peut donner des vers", "Protège des vers"];
const WORM_SORT_T: Record<string, string> = {
  "Mains sales": "Peut donner des vers",
  "Fruit mal lavé": "Peut donner des vers",
  "Légume mal lavé": "Peut donner des vers",
  "Salade mal lavée": "Peut donner des vers",
  "Mangue mal lavée": "Peut donner des vers",
  "Mains propres": "Protège des vers",
  "Fruit bien lavé": "Protège des vers",
  "Légume bien lavé": "Protège des vers",
  "Salade bien lavée": "Protège des vers",
  "Mangue bien lavée": "Protège des vers",
};
const MALARIA_LINK_T: Record<string, string> = {
  Moustiquaire: "Un filet au-dessus du lit",
  Dispensaire: "Là où l'on va se faire soigner",
  "Eaux stagnantes": "De l'eau qui reste sans bouger",
  Anophèle: "Le moustique qui donne le paludisme",
  "Vers intestinaux": "Ils vivent dans le ventre",
};
const MALARIA_STEPS_T: readonly (readonly [string, readonly string[]])[] = [
  ["Tu as de la fièvre. Mets ces gestes dans l'ordre, du premier au dernier.", ["Je le dis à un adulte", "Je vais au dispensaire", "L'infirmier me soigne"]],
  ["Tu as de la fièvre. Mets ces gestes dans l'ordre, du premier au dernier.", ["Je me sens très chaud", "Je le dis à un adulte", "Je vais au dispensaire", "L'infirmier me soigne"]],
  ["Pour te protéger la nuit, mets ces gestes dans l'ordre, du premier au dernier.", ["J'installe la moustiquaire", "Je me couche dessous", "Je dors sans piqûre"]],
  ["Pour te protéger la nuit, mets ces gestes dans l'ordre, du premier au dernier.", ["La nuit tombe", "J'installe la moustiquaire", "Je me couche dessous", "Je dors sans piqûre"]],
  ["Avant le repas, mets ces gestes dans l'ordre, du premier au dernier.", ["Je me lave les mains", "Je me mets à table", "Je mange"]],
  ["Avant le repas, mets ces gestes dans l'ordre, du premier au dernier.", ["Je joue dehors", "Je me lave les mains", "Je me mets à table", "Je mange"]],
  ["Mets ces faits dans l'ordre, du premier au dernier.", ["Une eau reste sans bouger", "Un moustique me pique", "J'ai de la fièvre"]],
  ["Mets ces faits dans l'ordre, du premier au dernier.", ["Une eau reste sans bouger", "Des moustiques s'y développent", "Un moustique me pique", "J'ai de la fièvre"]],
];
const MALARIA_GAP_T: readonly GRow[] = [
  ["Le paludisme se transmet par la piqûre du ___.", "moustique", ["papillon", "chat"]],
  ["Pour se protéger la nuit, on dort sous une ___.", "moustiquaire", ["natte", "lampe"]],
  ["Quand on a de la fièvre, on va au ___.", "dispensaire", ["marché", "stade"]],
  ["On se lave les ___ avant de manger.", "mains", ["genoux", "cheveux"]],
  ["Il faut supprimer les eaux ___.", "stagnantes", ["claires", "bouillies"]],
  ["Les vers intestinaux entrent dans le corps par des mains ___.", "sales", ["propres", "froides"]],
];
const MALARIA_WRITE_T: readonly (readonly [string, string])[] = [
  ["Quel objet protège des moustiques au-dessus du lit ? Écris le mot.", "moustiquaire"],
  ["Quel petit animal transmet le paludisme ? Écris le mot.", "moustique"],
  ["Dans quel lieu va-t-on se soigner quand on a de la fièvre ? Écris le mot.", "dispensaire"],
  ["Quel animal pique et donne le paludisme ? Écris le mot.", "moustique"],
];

// ===========================================================================
// LES OBJETS TECHNIQUES SIMPLES (sc-ce1-objets) : les tables
// ===========================================================================

/** Pour chaque objet : son usage, son groupe d'usage (deux objets du même groupe ne sont jamais mêlés dans une question) et son groupe nominal. */
const TOOL_USE: Record<string, { use: string; group: string; phrase: string }> = {
  "Lampe torche": { use: "Éclairer dans le noir", group: "lumière", phrase: "la lampe torche" },
  Ciseaux: { use: "Couper du papier", group: "couper", phrase: "les ciseaux" },
  Robinet: { use: "Faire couler l'eau", group: "eau", phrase: "le robinet" },
  Cadenas: { use: "Fermer à clé", group: "fermer", phrase: "le cadenas" },
  Règle: { use: "Mesurer une longueur", group: "mesurer", phrase: "la règle" },
  Balai: { use: "Balayer le sol", group: "nettoyer", phrase: "le balai" },
  Seau: { use: "Porter de l'eau", group: "eau", phrase: "le seau" },
  Craie: { use: "Écrire sur le tableau", group: "écrire", phrase: "la craie" },
  Cartable: { use: "Porter les cahiers", group: "porter", phrase: "le cartable" },
};
const TOOL_GROUPS_T: Record<string, string[]> = {
  "Pour couper": ["Ciseaux", "Couteau", "Machette"],
  "Pour éclairer": ["Lampe torche", "Bougie", "Lampe à pétrole"],
  "Pour fermer": ["Cadenas", "Serrure", "Verrou"],
  "Pour mesurer": ["Règle", "Mètre", "Balance"],
};
const TOOL_WORKS_Q: readonly QRow[] = [
  ["Que met-on dans une lampe torche pour qu'elle éclaire ?", "Piles"],
  ["Que faut-il tourner pour que l'eau coule ?", "Robinet"],
  ["Comment ouvre-t-on un cadenas ?", "Avec une clé"],
  ["Que fait-on quand les piles de la lampe torche sont usées ?", "On les change"],
  ["Comment entretient-on une lampe torche ?", "On change les piles usées"],
  ["Que fait-on des ciseaux après les avoir utilisés ?", "On les range fermés"],
  ["Comment éviter qu'un robinet coule pour rien ?", "On le ferme bien"],
  ["Que fait-on pour ne pas perdre la clé du cadenas ?", "On la range à sa place"],
  ["Comment utilise-t-on une règle pour mesurer ?", "On la pose le long de l'objet"],
];
const SCHOOL_Q: readonly QRow[] = [
  ["Où jette-t-on les papiers à l'école ?", "À la poubelle"],
  ["Que fait-on du robinet de la cour après avoir bu ?", "On le ferme bien"],
  ["Où range-t-on les ciseaux et les crayons après la classe ?", "Dans la trousse"],
  ["Que fait-on pour garder la classe propre ?", "On balaie le sol"],
  ["Que fait-on quand on voit un robinet qui fuit ?", "On prévient un adulte"],
  ["Comment prend-on soin des plantes de l'école ?", "On les arrose avec soin"],
  ["Que fait-on des déchets dans la cour ?", "On les ramasse"],
  ["Pourquoi ferme-t-on bien le robinet ?", "Pour ne pas gaspiller l'eau"],
];
const TOOL_STEPS_T: readonly (readonly [string, readonly string[]])[] = [
  ["Pour changer les piles d'une lampe torche, mets ces gestes du premier au dernier.", ["Ouvre la lampe", "Retire les piles usées", "Mets des piles neuves"]],
  ["Pour changer les piles d'une lampe torche, mets ces gestes du premier au dernier.", ["Ouvre la lampe", "Retire les piles usées", "Mets des piles neuves", "Ferme la lampe"]],
  ["Pour boire un verre d'eau, mets ces gestes du premier au dernier.", ["Ouvre le robinet", "Remplis ton verre", "Ferme le robinet"]],
  ["Pour boire un verre d'eau, mets ces gestes du premier au dernier.", ["Prends ton verre", "Ouvre le robinet", "Remplis ton verre", "Ferme le robinet"]],
  ["Pour ouvrir un cadenas, mets ces gestes du premier au dernier.", ["Mets la clé dans le cadenas", "Tourne la clé", "Retire le cadenas"]],
  ["Pour ouvrir un cadenas, mets ces gestes du premier au dernier.", ["Prends la clé", "Mets la clé dans le cadenas", "Tourne la clé", "Retire le cadenas"]],
  ["Pour couper une feuille, mets ces gestes du premier au dernier.", ["Tiens la feuille", "Coupe le long du trait", "Range les ciseaux"]],
  ["Pour couper une feuille, mets ces gestes du premier au dernier.", ["Tiens la feuille", "Ouvre les ciseaux", "Coupe le long du trait", "Range les ciseaux"]],
];
const TOOL_GAP_T: readonly GRow[] = [
  ["On ouvre un cadenas avec une ___.", "clé", ["règle", "craie"]],
  ["Une lampe torche marche avec des ___.", "piles", ["feuilles", "cailloux"]],
  ["Les ___ servent à couper du papier.", "ciseaux", ["balais", "seaux"]],
  ["On ferme le ___ pour ne pas gaspiller l'eau.", "robinet", ["balai", "cartable"]],
  ["On jette les papiers à la ___.", "poubelle", ["table", "fenêtre"]],
  ["La ___ sert à mesurer une longueur.", "règle", ["craie", "trousse"]],
  ["On écrit sur le tableau avec une ___.", "craie", ["règle", "clé"]],
  ["Le ___ sert à balayer le sol.", "balai", ["seau", "cadenas"]],
];

// ===========================================================================
// LES VÉRIFICATIONS : une par gabarit
// ===========================================================================

/** La chaîne, le sens de la question et le maillon demandé dans « Dans la chaîne alimentaire a, b, c, qui… ». */
const chainOfPrompt = (prompt: string) => {
  const match = /^Dans la chaîne alimentaire (.+?), qui (mange|est mangé par) (.+) \?$/u.exec(prompt);
  if (!match) return null;
  return { chain: match[1].split(", ").map(cap), eater: match[2] === "mange", subject: animalOf(match[3]) };
};

const CHECKS: Record<string, Check> = {
  // --- Nutrition ---
  "ce1-nutri-regime-qcm": (exo) => {
    const match = /^Quel animal est un (herbivore|carnivore|omnivore) \?$/u.exec(exo.prompt);
    if (!match) return `énoncé inconnu : ${exo.prompt}`;
    const diet = match[1] as Diet;
    const wrongs = wrongOf(exo);
    // Un herbivore se cherche parmi des carnivores, un carnivore parmi des herbivores, un omnivore parmi un de chaque : aucun choix discutable.
    const undisputed =
      diet === "omnivore"
        ? sameSeq(wrongs.map((name) => ANIMAL_DIET[name]).sort(), ["carnivore", "herbivore"])
        : wrongs.every((name) => ANIMAL_DIET[name] === (diet === "herbivore" ? "carnivore" : "herbivore"));
    return all(
      ok(ANIMAL_DIET[rightOption(exo)] === diet, `« ${rightOption(exo)} » est ${ANIMAL_DIET[rightOption(exo)]}, pas ${diet}`),
      ok(wrongs.length === 2 && wrongs.every((name) => name in ANIMAL_DIET && ANIMAL_DIET[name] !== diet), `mauvais choix ${wrongs.join(" | ")}`),
      ok(undisputed, `mauvais choix discutables : ${wrongs.join(" | ")}`),
    );
  },
  "ce1-nutri-mot-qcm": (exo) => {
    const definition = DEFINITIONS[exo.prompt];
    const match = /^Quel mot dit comment (.+) se nourrit \?$/u.exec(exo.prompt);
    const diet = definition ?? (match ? ANIMAL_DIET[animalOf(match[1])] : undefined);
    if (!diet) return `énoncé inconnu : ${exo.prompt}`;
    return all(ok(rightOption(exo) === DIET_WORDS[diet], `la bonne option est « ${rightOption(exo)} », il fallait « ${DIET_WORDS[diet]} »`), ok(same(optionsOf(exo), Object.values(DIET_WORDS)), `choix ${optionsOf(exo).join(" | ")}`));
  },
  "ce1-nutri-mange-qcm": (exo) => {
    const match = /^Que mange (.+) \?$/u.exec(exo.prompt);
    const name = match ? animalOf(match[1]) : "";
    const food = EATS_FOOD[name];
    if (!food) return `animal inconnu : ${exo.prompt}`;
    const other = food === "Herbe" ? "Viande" : "Herbe";
    return all(ok(rightOption(exo) === food, `${name} mange « ${food} », la bonne option est « ${rightOption(exo)} »`), ok(same(wrongOf(exo), [other, "Pierres"]), `mauvais choix ${wrongOf(exo).join(" | ")}`));
  },
  "ce1-nutri-regime-glisser": (exo) => {
    for (const item of itemsOf(exo)) {
      const diet = ANIMAL_DIET[item.text];
      if (diet !== "herbivore" && diet !== "carnivore") return `« ${item.text} » n'est ni herbivore ni carnivore`;
      if (item.correctZone !== (diet === "herbivore" ? "Herbivores" : "Carnivores")) return `« ${item.text} » est rangé dans « ${item.correctZone} »`;
    }
    return all(
      ok(same(zonesOf(exo), ["Herbivores", "Carnivores"]), "cases"),
      ok(itemsOf(exo).length >= 4 && itemsOf(exo).length <= 5, "quatre ou cinq animaux"),
      ok(["Herbivores", "Carnivores"].every((zone) => itemsOf(exo).some((item) => item.correctZone === zone)), "les deux cases servies"),
    );
  },
  "ce1-nutri-regime-relier": (exo) => {
    for (const pair of pairsOf(exo)) if (DIET_WORDS[ANIMAL_DIET[pair.left]] !== pair.right) return `« ${pair.left} » relié à « ${pair.right} »`;
    return all(ok(pairsOf(exo).length === 3, "trois paires"), ok(same(pairsOf(exo).map((pair) => pair.right), Object.values(DIET_WORDS)), "un animal de chaque régime"));
  },
  "ce1-nutri-chaine-ordre": (exo) => {
    const chain = sequenceOf(exo);
    return all(
      ok(chainIsValid(chain), `chaîne fausse : ${chain.join(" > ")}`),
      ok(chain.length >= 3 && chain.length <= 4, "trois ou quatre maillons"),
      ok(exo.prompt.includes("de ce qui est mangé en premier à celui qui mange en dernier"), "le critère de l'ordre est dans l'énoncé"),
    );
  },
  "ce1-nutri-chaine-qcm": (exo) => {
    const parsed = chainOfPrompt(exo.prompt);
    if (!parsed) return `énoncé inconnu : ${exo.prompt}`;
    const { chain, eater, subject } = parsed;
    const index = chain.indexOf(subject);
    if (index < 0) return `${subject} n'est pas dans la chaîne ${chain.join(" ")}`;
    if (!chainIsValid(chain)) return `chaîne fausse : ${chain.join(" > ")}`;
    const expected = eater ? chain[index + 1] : chain[index - 1];
    if (!expected) return `pas de voisin pour ${subject}`;
    // Qui mange X : aucun mauvais choix ne mange X. Qui est mangé par X : aucun mauvais choix n'est mangé par X.
    const banned = eater ? eatersOf(subject) : FOOD_OF[subject] ?? [];
    return all(
      ok(rightOption(exo) === expected, `la bonne option est « ${rightOption(exo)} », la chaîne dit « ${expected} »`),
      ok(wrongOf(exo).length === 2 && wrongOf(exo).every((option) => !banned.includes(option) && option !== subject), `un mauvais choix est juste aussi : ${wrongOf(exo).join(" | ")}`),
    );
  },
  "ce1-nutri-plante-qcm": checkQuestions(PLANT_Q),
  "ce1-nutri-plante-trou": checkGaps(PLANT_GAP_T),
  "ce1-nutri-plante-glisser": checkSort(PLANT_ZONES, {
    ...Object.fromEntries(HELPS_PLANT.map((tile) => [tile, PLANT_ZONES[0]])),
    ...Object.fromEntries(HARMS_PLANT.map((tile) => [tile, PLANT_ZONES[1]])),
  }),

  // --- Respiration ---
  "ce1-resp-organe-qcm": (exo) => {
    const match = /^Avec quoi respire (.+) \?$/u.exec(exo.prompt);
    const organ = match ? BREATHES_WITH[animalOf(match[1])] : undefined;
    if (!organ) return `animal inconnu : ${exo.prompt}`;
    return all(ok(rightOption(exo) === organ, `la bonne option est « ${rightOption(exo)} », il fallait « ${organ} »`), ok(same(optionsOf(exo), ["Poumons", "Branchies", "Oreilles"]), `choix ${optionsOf(exo).join(" | ")}`));
  },
  "ce1-resp-organe-nom": (exo) => {
    const match = /^Quel animal respire avec des (poumons|branchies) \?$/u.exec(exo.prompt);
    if (!match) return `énoncé inconnu : ${exo.prompt}`;
    const organ = cap(match[1]);
    return all(
      ok(BREATHES_WITH[rightOption(exo)] === organ, `« ${rightOption(exo)} » respire avec ${BREATHES_WITH[rightOption(exo)]}`),
      ok(wrongOf(exo).length === 2 && wrongOf(exo).every((name) => BREATHES_WITH[name] && BREATHES_WITH[name] !== organ), `mauvais choix ${wrongOf(exo).join(" | ")}`),
    );
  },
  "ce1-resp-organe-glisser": (exo) => {
    for (const item of itemsOf(exo)) if (BREATHES_WITH[item.text] !== item.correctZone) return `« ${item.text} » est rangé dans « ${item.correctZone} »`;
    return all(
      ok(same(zonesOf(exo), ["Poumons", "Branchies"]), "cases"),
      ok(itemsOf(exo).length >= 4 && itemsOf(exo).length <= 5, "quatre ou cinq animaux"),
      ok(["Poumons", "Branchies"].every((zone) => itemsOf(exo).some((item) => item.correctZone === zone)), "les deux cases servies"),
    );
  },
  "ce1-resp-voie-qcm": checkQuestions(BREATH_Q),
  "ce1-resp-air-qcm": (exo) => {
    const positive = ["Quelle chose pollue l'air ?", "Quelle chose rend l'air sale ?"];
    const negative = ["Quelle chose ne pollue pas l'air ?", "Quelle chose garde l'air propre ?"];
    const wants = positive.includes(exo.prompt) ? POLLUTES : negative.includes(exo.prompt) ? CLEAN_AIR : null;
    if (!wants) return `énoncé inconnu : ${exo.prompt}`;
    const unwanted = wants === POLLUTES ? CLEAN_AIR : POLLUTES;
    return all(ok(wants.includes(rightOption(exo)), `« ${rightOption(exo)} » n'est pas la bonne sorte`), ok(wrongOf(exo).length === 2 && wrongOf(exo).every((option) => unwanted.includes(option)), `mauvais choix ${wrongOf(exo).join(" | ")}`));
  },
  "ce1-resp-air-glisser": checkSort(AIR_SORT_ZONES, {
    ...Object.fromEntries(POLLUTES_TILES.map((tile) => [tile, AIR_SORT_ZONES[0]])),
    ...Object.fromEntries(CLEAN_TILES.map((tile) => [tile, AIR_SORT_ZONES[1]])),
  }),
  "ce1-resp-relier": checkLinks(BREATH_LINK_T),
  "ce1-resp-trou": checkGaps(BREATH_GAP_T),
  "ce1-resp-ecrire": (exo) => {
    const match = /^Avec quoi (?:un|une) (\p{L}+) respire-t-(?:il|elle) \? Écris le mot\.$/u.exec(exo.prompt);
    const organ = match ? (BREATHES_WITH[cap(match[1])] ?? (match[1] === "enfant" ? "Poumons" : undefined)) : undefined;
    if (!organ) return `énoncé inconnu : ${exo.prompt}`;
    const word = organ.toLowerCase();
    return all(
      ok(acceptedOf(exo)[0] === word && exo.answerKey === word, `le mot juste est « ${word} », le gabarit dit « ${acceptedOf(exo)[0]} »`),
      ok(acceptedOf(exo).every((accepted) => accepted.endsWith(word)), "une écriture admise est fausse"),
    );
  },

  // --- Paludisme ---
  "ce1-palu-cause-qcm": checkQuestions(CAUSE_Q),
  "ce1-palu-proteger-qcm": checkQuestions(PROTECT_Q),
  "ce1-palu-vers-qcm": checkQuestions(WORM_Q),
  "ce1-palu-fievre-qcm": checkQuestions(FEVER_Q),
  "ce1-palu-glisser": checkSort(MALARIA_ZONES, MALARIA_SORT_T),
  "ce1-palu-vers-glisser": checkSort(WORM_ZONES, WORM_SORT_T),
  "ce1-palu-relier": checkLinks(MALARIA_LINK_T),
  "ce1-palu-ordre": checkSteps(MALARIA_STEPS_T),
  "ce1-palu-trou": checkGaps(MALARIA_GAP_T),
  "ce1-palu-ecrire": checkWrite(MALARIA_WRITE_T),

  // --- Substances ---
  "ce1-subst-dissout-qcm": (exo) => {
    const dissolves = ASKS_DISSOLVE.includes(exo.prompt);
    if (!dissolves && !ASKS_STAY.includes(exo.prompt)) return `énoncé inconnu : ${exo.prompt}`;
    if (dissolves) return all(ok(DISSOLVES.includes(rightOption(exo)), `« ${rightOption(exo)} » ne se dissout pas`), ok(wrongOf(exo).length === 2 && wrongOf(exo).every((option) => STAYS.includes(option)), `mauvais choix ${wrongOf(exo).join(" | ")}`));
    return all(ok(STAYS.includes(rightOption(exo)), `« ${rightOption(exo)} » se dissout`), ok(same(wrongOf(exo), DISSOLVES), `mauvais choix ${wrongOf(exo).join(" | ")}`));
  },
  "ce1-subst-dissout-glisser": checkSort(["Se dissout", "Ne se dissout pas"], {
    ...Object.fromEntries(DISSOLVES.map((tile) => [tile, "Se dissout"])),
    ...Object.fromEntries(STAYS.map((tile) => [tile, "Ne se dissout pas"])),
  }),
  "ce1-subst-dissout-compte": (exo) => {
    const match = /^Parmi ces produits, combien se dissolvent dans l'eau \? (.+)\. Écris le nombre\.$/u.exec(exo.prompt);
    if (!match) return `énoncé inconnu : ${exo.prompt}`;
    const products = match[1].split(/, | et /u).map(cap);
    const count = products.filter((product) => DISSOLVES.includes(product)).length;
    return all(
      ok(products.length === 4 && products.every((product) => DISSOLVES.includes(product) || STAYS.includes(product)), `liste ${products.join(" ")}`),
      ok(acceptedOf(exo)[0] === String(count) && exo.answerKey === String(count), `il y en a ${count}, le gabarit dit ${acceptedOf(exo)[0]}`),
    );
  },
  "ce1-subst-devient-qcm": checkQuestions(SUBSTANCE_Q),
  "ce1-subst-relier": checkLinks(SUBSTANCE_LINK_T),
  "ce1-subst-ordre": checkSteps(SUBSTANCE_STEPS_T),
  "ce1-subst-trou": checkGaps(SUBSTANCE_GAP_T),

  // --- Eau potable ---
  "ce1-pot-source": checkQuestions(SOURCE_Q),
  "ce1-pot-relier": checkLinks(SOURCE_LINK_T),
  "ce1-pot-geste": (exo) => {
    const row = GESTURE_Q.find((entry) => entry[0] === exo.prompt);
    if (!row) return `question inconnue : ${exo.prompt}`;
    const [, right, negative] = row;
    return all(
      ok(rightOption(exo) === right, `la bonne option est « ${rightOption(exo)} », la table dit « ${right} »`),
      ok(wrongOf(exo).length === 2, "deux mauvais choix"),
      // Une question « ce qui rend potable » n'a que des gestes qui ne le rendent pas pour mauvais choix, et l'inverse.
      ok(wrongOf(exo).every((option) => SAFE_GESTURES.includes(option) === negative), `un mauvais choix est juste aussi : ${wrongOf(exo).join(" | ")}`),
      ok(SAFE_GESTURES.includes(right) !== negative, "la table se contredit"),
    );
  },
  "ce1-pot-garde": checkQuestions(KEEPING_Q),
  "ce1-pot-glisser": checkSort(POTABLE_ZONES, POTABLE_SORT_T),
  "ce1-pot-ordre": checkSteps(POTABLE_STEPS_T),
  "ce1-pot-trou": checkGaps(POTABLE_GAP_T),
  "ce1-pot-ecrire": checkWrite(POTABLE_WRITE_T),

  // --- Objets ---
  "ce1-objet-usage-qcm": (exo) => {
    const match = /^À quoi (?:sert|servent) (.+) \?$/u.exec(exo.prompt);
    const name = Object.keys(TOOL_USE).find((tool) => TOOL_USE[tool].phrase === match?.[1]);
    if (!name) return `objet inconnu : ${exo.prompt}`;
    const tool = TOOL_USE[name];
    const others = Object.values(TOOL_USE)
      .filter((other) => other.group !== tool.group)
      .map((other) => other.use);
    return all(
      ok(rightOption(exo) === tool.use, `la bonne option est « ${rightOption(exo)} », il fallait « ${tool.use} »`),
      ok(tool.phrase.startsWith("les ") ? /servent/u.test(exo.prompt) : /sert/u.test(exo.prompt), "le verbe s'accorde"),
      ok(wrongOf(exo).length === 2 && wrongOf(exo).every((use) => others.includes(use)), `mauvais choix ${wrongOf(exo).join(" | ")}`),
    );
  },
  "ce1-objet-qui-qcm": (exo) => {
    const match = /^Quel objet sert à (.+) \?$/u.exec(exo.prompt);
    const name = Object.keys(TOOL_USE).find((tool) => TOOL_USE[tool].use.toLowerCase() === match?.[1]);
    if (!name) return `usage inconnu : ${exo.prompt}`;
    const group = TOOL_USE[name].group;
    return all(
      ok(rightOption(exo) === name, `la bonne option est « ${rightOption(exo)} », il fallait « ${name} »`),
      ok(wrongOf(exo).length === 2 && wrongOf(exo).every((option) => TOOL_USE[option] && TOOL_USE[option].group !== group), `mauvais choix ${wrongOf(exo).join(" | ")}`),
    );
  },
  "ce1-objet-glisser": (exo) => {
    const zones = zonesOf(exo);
    const zoneOf: Record<string, string> = {};
    for (const zone of zones) for (const tile of TOOL_GROUPS_T[zone] ?? []) zoneOf[tile] = zone;
    for (const item of itemsOf(exo)) if (zoneOf[item.text] !== item.correctZone) return `« ${item.text} » est rangé dans « ${item.correctZone} », la table dit « ${zoneOf[item.text]} »`;
    return all(
      ok(zones.length === 2 && zones.every((zone) => zone in TOOL_GROUPS_T), `cases ${zones.join(" | ")}`),
      ok(zones.every((zone) => itemsOf(exo).some((item) => item.correctZone === zone)), "les deux cases servies"),
      ok(itemsOf(exo).length >= 4 && itemsOf(exo).length <= 5, "quatre ou cinq objets"),
    );
  },
  "ce1-objet-relier": (exo) => {
    for (const pair of pairsOf(exo)) if (!TOOL_USE[pair.left] || TOOL_USE[pair.left].use !== pair.right || pair.left === "Seau") return `« ${pair.left} » est relié à « ${pair.right} »`;
    return all(ok(pairsOf(exo).length === 3, "trois paires"), ok(new Set(pairsOf(exo).map((pair) => TOOL_USE[pair.left].group)).size === 3, "trois usages de groupes différents"));
  },
  "ce1-objet-marche-qcm": checkQuestions(TOOL_WORKS_Q),
  "ce1-ecole-qcm": checkQuestions(SCHOOL_Q),
  "ce1-objet-ordre": checkSteps(TOOL_STEPS_T),
  "ce1-objet-trou": checkGaps(TOOL_GAP_T),
};

const KINDS = Object.keys(CHECKS) as GameKind[];
const TOPIC_KINDS: Record<string, string[]> = {
  "sc-ce1-nutrition": ["ce1-nutri-regime-qcm", "ce1-nutri-mot-qcm", "ce1-nutri-mange-qcm", "ce1-nutri-regime-glisser", "ce1-nutri-regime-relier", "ce1-nutri-chaine-ordre", "ce1-nutri-chaine-qcm", "ce1-nutri-plante-qcm", "ce1-nutri-plante-trou", "ce1-nutri-plante-glisser"],
  "sc-ce1-respiration": ["ce1-resp-organe-qcm", "ce1-resp-organe-nom", "ce1-resp-organe-glisser", "ce1-resp-voie-qcm", "ce1-resp-air-qcm", "ce1-resp-air-glisser", "ce1-resp-relier", "ce1-resp-trou", "ce1-resp-ecrire"],
  "sc-ce1-substances": ["ce1-subst-dissout-qcm", "ce1-subst-dissout-glisser", "ce1-subst-dissout-compte", "ce1-subst-devient-qcm", "ce1-subst-relier", "ce1-subst-ordre", "ce1-subst-trou"],
  "sc-ce1-eau": ["ce1-pot-source", "ce1-pot-relier", "ce1-pot-geste", "ce1-pot-garde", "ce1-pot-glisser", "ce1-pot-ordre", "ce1-pot-trou", "ce1-pot-ecrire"],
  "sc-ce1-paludisme": ["ce1-palu-cause-qcm", "ce1-palu-proteger-qcm", "ce1-palu-vers-qcm", "ce1-palu-fievre-qcm", "ce1-palu-glisser", "ce1-palu-vers-glisser", "ce1-palu-relier", "ce1-palu-ordre", "ce1-palu-trou", "ce1-palu-ecrire"],
  "sc-ce1-objets": ["ce1-objet-usage-qcm", "ce1-objet-qui-qcm", "ce1-objet-glisser", "ce1-objet-relier", "ce1-objet-marche-qcm", "ce1-ecole-qcm", "ce1-objet-ordre", "ce1-objet-trou"],
};
const TOPIC_KEYS = Object.keys(TOPIC_KINDS);
const entryOf = (key: string) => allProgrammeEntries().find((entry) => entry.topic.key === key)!;
const topicOfKind = (kind: string) => TOPIC_KEYS.find((key) => TOPIC_KINDS[key].includes(kind)) as string;
const subjectOfKind = (kind: string) => entryOf(topicOfKind(kind)).subject.name;

describe("chaque gabarit des sciences du CE1 a sa vérification", () => {
  it("couvre exactement les cinquante-deux gabarits, tous rangés dans une thématique", () => {
    expect(KINDS).toHaveLength(52);
    expect(Object.values(TOPIC_KINDS).flat().sort()).toEqual([...KINDS].sort());
    for (const kind of KINDS) expect(Object.keys(GAME_KINDS), kind).toContain(kind);
  });
});

describe("les gabarits des sciences du CE1 recalculent juste, depuis une table écrite à part", () => {
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
  it("ne mettent chaque chaîne que d'êtres qui se mangent vraiment, en commençant par une plante", () => {
    for (const name of Object.keys(EATS_FOOD)) expect(ANIMAL_DIET[name], name).toBeDefined();
    for (const name of Object.keys(FOOD_OF)) for (const food of FOOD_OF[name]) expect(PLANTS.includes(food) || FOOD_OF[food] !== undefined, `${name} mange ${food}`).toBe(true);
    expect(chainIsValid(["Herbe", "Mouton", "Lion"])).toBe(true);
    expect(chainIsValid(["Mouton", "Herbe", "Lion"])).toBe(false);
    expect(chainIsValid(["Herbe", "Lion", "Mouton"])).toBe(false);
  });

  it("ne rangent chaque animal que dans un régime, et le lion n'est ni herbivore ni omnivore", () => {
    expect(ANIMAL_DIET.Lion).toBe("carnivore");
    expect(ANIMAL_DIET.Mouton).toBe("herbivore");
    expect(ANIMAL_DIET.Homme).toBe("omnivore");
    expect(Object.values(ANIMAL_DIET).every((diet) => ["herbivore", "carnivore", "omnivore"].includes(diet))).toBe(true);
  });

  it("n'ont que le sel et le sucre qui se dissolvent, et jamais un produit dans les deux listes", () => {
    expect(DISSOLVES).toEqual(["Sel", "Sucre"]);
    for (const product of STAYS) expect(DISSOLVES, product).not.toContain(product);
  });

  it("ne mêlent jamais le robinet et le seau dans une même question", () => {
    expect(TOOL_USE.Robinet.group).toBe(TOOL_USE.Seau.group);
    // Quand le robinet est la bonne réponse, le seau n'est pas un choix (il porte de l'eau), et inversement.
    for (const d of draws) {
      const exo = make("ce1-objet-qui-qcm" as GameKind, d) as unknown as Exo;
      if (rightOption(exo) === "Robinet") expect(optionsOf(exo), exo.prompt).not.toContain("Seau");
      if (rightOption(exo) === "Seau") expect(optionsOf(exo), exo.prompt).not.toContain("Robinet");
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

  it("voient aussi un énoncé abîmé : une chaîne à l'envers, un produit changé dans la liste, un mauvais choix devenu juste", () => {
    const chain = make("ce1-nutri-chaine-qcm" as GameKind, { level: 3, seed: "mut-chain" }) as unknown as Exo;
    const parsed = chainOfPrompt(chain.prompt)!;
    const shown = parsed.chain.map((link) => link.toLowerCase()).join(", ");
    const reversed = chain.prompt.replace(shown, [...parsed.chain].reverse().map((link) => link.toLowerCase()).join(", "));
    expect(CHECKS["ce1-nutri-chaine-qcm"]({ ...chain, prompt: reversed })).not.toBeNull();

    let changed = 0;
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const count = make("ce1-subst-dissout-compte" as GameKind, { level: 2, seed: `mut-count:${seed}` }) as unknown as Exo;
      const swapped = { ...count, prompt: count.prompt.replace(/sel|sucre/u, "sable") };
      if (swapped.prompt === count.prompt) continue;
      changed += 1;
      expect(CHECKS["ce1-subst-dissout-compte"](swapped), count.prompt).not.toBeNull();
    }
    expect(changed).toBeGreaterThan(0);

    // Un mauvais choix qui devient juste : la poule parmi les carnivores.
    let poisoned = 0;
    for (let n = 0; n < 40 && poisoned === 0; n++) {
      const candidate = make("ce1-nutri-regime-qcm" as GameKind, { level: 2, seed: `mut-diet:${n}` }) as unknown as Exo;
      if (!candidate.prompt.includes("carnivore")) continue;
      expect(CHECKS["ce1-nutri-regime-qcm"](candidate)).toBeNull();
      const broken = JSON.parse(JSON.stringify(candidate)) as Exo;
      (broken.payload.options as string[])[(broken.payload.correctIndex as number) === 0 ? 1 : 0] = "Poule";
      expect(CHECKS["ce1-nutri-regime-qcm"](broken)).not.toBeNull();
      poisoned += 1;
    }
    expect(poisoned).toBe(1);
  });
});

// ===========================================================================
// LES RÈGLES COMMUNES
// ===========================================================================

describe("tous les gabarits des sciences du CE1", () => {
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

describe("les six thématiques des sciences du CE1", () => {
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
    expect(TOPIC_KEYS).toHaveLength(6);
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
    // Les gabarits lus deux fois par palier (une phrase à trou, un QCM de faits) prennent de préférence deux lignes dont la réponse diffère.
    for (const key of TOPIC_KEYS) {
      const twice = (topicOf(key).games ?? []).filter((spec) => spec.count === 2).map((spec) => spec.kind as string);
      for (let n = 0; n < 40; n++) {
        for (const palierIndex of [1, 2, 3, 4]) {
          const games = generateGames(topicOf(key).games ?? [], { klass: "CE1", palierIndex, palierCount: 4, seed: `twice:${key}:${n}:${palierIndex}` });
          for (const kind of twice) {
            const answers = games.filter((game) => (game.payload.game as { kind: string }).kind === kind).map((game) => game.answerKey);
            expect(answers, `${key} palier ${palierIndex} ${kind}`).toHaveLength(2);
            expect(new Set(answers).size, `${key} palier ${palierIndex} ${kind} : ${answers.join(" | ")}`).toBe(2);
          }
        }
      }
    }
  });

  it("gardent de quoi servir la démo du site : les quatre types de base, et le type que la banque attend sur chaque thématique", () => {
    // La banque de la vitrine (`components/landing/demo/bank/eveil-scientifique.ts`) veut, sur une thématique tout en gabarits, un gabarit du type de
    // chacun de ses exercices : un QCM sur la respiration, un glissé sur les substances, un appariement sur les objets, un ordre sur la nutrition, une
    // réponse courte sur le paludisme et une phrase à trou sur l'eau.
    const typesOf = (key: string) => new Set((topicOf(key).games ?? []).map((spec) => GAME_KINDS[spec.kind].type));
    for (const key of TOPIC_KEYS) {
      for (const type of ["qcm", "drag-drop", "match", "fill-blank"]) expect(typesOf(key).has(type as never), `${key} : ${type}`).toBe(true);
    }
    expect(typesOf("sc-ce1-nutrition").has("order" as never)).toBe(true);
    expect(typesOf("sc-ce1-paludisme").has("short-answer" as never)).toBe(true);
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

  it("ne reposent presque jamais la même question à deux paliers d'une même thématique", () => {
    for (const key of TOPIC_KEYS) {
      let repeated = 0;
      let total = 0;
      for (let n = 0; n < 40; n++) {
        const seen = new Set<string>();
        for (const palierIndex of [1, 2, 3, 4]) {
          const games = generateGames(topicOf(key).games ?? [], { klass: "CE1", palierIndex, palierCount: 4, seed: `var:${key}:${n}:${palierIndex}` });
          const here = games.map((game) => `${game.prompt}|${game.type === "fill-blank" ? String(game.payload.text) : ""}|${game.answerKey}`);
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
