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
 * LA LECTURE DU CE1 : un texte narratif (qui, quoi, où, quand), un texte descriptif (de quel animal ?), un texte injonctif (une recette, la règle
 * d'un jeu), et des phrases à ranger sous Vrai ou Faux.
 *
 * Chaque test RECALCULE la bonne réponse avec ses propres tables, écrites à part : les seize histoires (moment, prénom, lieu, action), les prénoms
 * de fille, les trois indices de chaque animal (aucun indice ne va à deux animaux), les étapes de chaque recette, les règles des jeux. Un gabarit
 * dont la réponse n'est pas dans le texte, ou dont un mauvais choix y est écrit, échoue. À la fin, des MUTATIONS : on abîme la bonne réponse d'un
 * exercice juste, et chaque vérification doit le voir.
 */

const LEVELS: GameLevel[] = [1, 2, 3, 4];
const draws = LEVELS.flatMap((level) => Array.from({ length: 60 }, (_, n) => ({ level, seed: `lec:${level}:${n}` })));
const make = (kind: GameKind, d: { level: GameLevel; seed: string }) => GAME_KINDS[kind].make(makeContext("CE1", d.level, `${kind}:${d.seed}`));

type Exo = { type?: string; prompt: string; answerKey: string; hints: string[]; payload: Record<string, unknown> };
const optionsOf = (exo: Exo) => exo.payload.options as string[];
const rightOption = (exo: Exo) => optionsOf(exo)[exo.payload.correctIndex as number];
const wrongOf = (exo: Exo) => optionsOf(exo).filter((option) => option !== rightOption(exo));
const itemsOf = (exo: Exo) => exo.payload.items as { text: string; correctZone: string }[];
const zonesOf = (exo: Exo) => exo.payload.zones as string[];
const sequenceOf = (exo: Exo) => exo.payload.correctSequence as string[];
const pairsOf = (exo: Exo) => exo.payload.pairs as { left: string; right: string }[];

const fold = (text: string) => text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
const apostrophes = (text: string) => (text.match(/'/g) ?? []).length;
const wordCount = (text: string) => text.split(/\s+/).filter((token) => /[\p{L}\p{N}]/u.test(token)).length;
const same = (a: readonly string[], b: readonly string[]) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());
/** Les mots de quatre lettres ou plus, sans accents. */
const bigWords = (text: string) => fold(text).split(/[^a-z]+/).filter((word) => word.length >= 4);
/** Les mots de trois lettres ou plus, sans accents (« dix » compte : un nombre faux est un mot de trois lettres). */
const shortWords = (text: string) => fold(text).split(/[^a-z]+/).filter((word) => word.length >= 3);
const lower = (text: string) => `${text[0].toLowerCase()}${text.slice(1)}`;

type Check = (exo: Exo) => string | null;
const ok = (condition: boolean, message: string) => (condition ? null : message);
const all = (...results: (string | null)[]) => results.find((result) => result !== null) ?? null;

/** Un énoncé de lecture : le texte, un retour à la ligne, la question. */
const split = (prompt: string): [string, string] | null => {
  const parts = prompt.split("\n");
  return parts.length === 2 ? [parts[0], parts[1]] : null;
};

// ===========================================================================
// LES TABLES, ÉCRITES À PART
// ===========================================================================

// --- Les histoires : [prénom, moment, verbe, lieu, ce qu'on y fait, comment on finit] ---
type StoryRow = readonly [string, string, string, string, string, string];
const STORY_TABLE: readonly StoryRow[] = [
  ["Awa", "Le matin", "va", "au marché", "achète des mangues", "rentre à la maison"],
  ["Moussa", "À midi", "va", "à la plage", "ramasse des coquillages", "mange du poisson"],
  ["Fatou", "Le soir", "va", "à la mosquée", "prie avec sa maman", "se couche tôt"],
  ["Cheikh", "Le matin", "part", "à la pêche", "attrape un gros poisson", "revient avec son filet"],
  ["Aminata", "À midi", "va", "au champ", "arrose les tomates", "se repose sous un arbre"],
  ["Omar", "Le soir", "va", "au village", "rend visite à sa grand-mère", "dort chez elle"],
  ["Mariama", "Le matin", "va", "à la boutique", "achète du pain", "revient chez elle"],
  ["Ibrahima", "Le matin", "va", "au puits", "remplit son seau", "porte le seau à la case"],
  ["Khady", "À midi", "va", "dans la cour", "joue à la corde", "boit un jus de bissap"],
  ["Modou", "Le soir", "part", "à la ferme", "donne du grain aux poules", "ferme la porte"],
  ["Rokhaya", "Le matin", "va", "en classe", "écrit la date au tableau", "range ses affaires"],
  ["Pape", "À midi", "va", "au port", "vend des oranges", "compte ses pièces"],
  ["Seynabou", "Le soir", "part", "sur la colline", "regarde le coucher du soleil", "chante une chanson"],
  ["Ousmane", "Le matin", "part", "dans les champs", "sème du mil", "rentre avant midi"],
  ["Dieynaba", "À midi", "va", "à la cantine", "mange du riz", "lave son assiette"],
  ["Abdou", "Le soir", "va", "au stade", "joue au ballon", "lave ses mains"],
];
const FEMININE = new Set(["Awa", "Fatou", "Aminata", "Mariama", "Khady", "Rokhaya", "Seynabou", "Dieynaba"]);
const STORY_NAMES = STORY_TABLE.map((row) => row[0]);
const STORY_WHATS = STORY_TABLE.map((row) => row[4]);
const STORY_PLACES = STORY_TABLE.map((row) => row[3]);
const MOMENTS = ["le matin", "à midi", "le soir"];

/** L'histoire d'un texte : celle dont le prénom y est écrit (un seul prénom par texte). */
const storyOf = (text: string) => {
  const mine = STORY_TABLE.filter((row) => text.split(/[\s,.]+/u).includes(row[0]));
  return mine.length === 1 ? mine[0] : undefined;
};
/** Le texte d'une histoire, recomposé ici avec la règle de la fiche : un moment, un prénom, un lieu, une action, une fin. */
const storyText = (row: StoryRow) => {
  const she = FEMININE.has(row[0]);
  return `${row[1]}, ${row[0]} ${row[2]} ${row[3]}. ${she ? "Elle" : "Il"} ${row[4]}. Puis, ${she ? "elle" : "il"} ${row[5]}.`;
};

const checkStory =
  (kind: "qui" | "quoi" | "ou" | "quand"): Check =>
  (exo) => {
    const parts = split(exo.prompt);
    if (!parts) return `l'énoncé n'a pas la forme texte puis question : ${exo.prompt}`;
    const [text, question] = parts;
    const row = storyOf(text);
    if (!row) return `histoire inconnue : ${text}`;
    const [name, when, go, place, what] = row;
    const pronoun = FEMININE.has(name) ? "elle" : "il";
    const expected = {
      qui: { question: `Qui ${what} ?`, answer: name, pool: STORY_NAMES },
      quoi: { question: `Que fait ${name} ${place} ?`, answer: what, pool: STORY_WHATS },
      ou: { question: `Où ${go} ${name} ?`, answer: place, pool: STORY_PLACES },
      quand: { question: `Quand ${name} ${go}${go === "va" ? "-t-" : "-"}${pronoun} ${place} ?`, answer: lower(when), pool: MOMENTS },
    }[kind];
    return all(
      ok(text === storyText(row), `le texte n'est pas celui de la table : ${text}`),
      ok(question === expected.question, `question « ${question} », la règle dit « ${expected.question} »`),
      ok(rightOption(exo) === expected.answer, `réponse « ${rightOption(exo)} », le texte dit « ${expected.answer} »`),
      ok(text.toLowerCase().includes(expected.answer.toLowerCase()), `la réponse « ${expected.answer} » n'est pas écrite dans le texte`),
      ok(wrongOf(exo).length === 2, "deux mauvais choix"),
      ...wrongOf(exo).map((wrong) =>
        all(
          ok(expected.pool.includes(wrong), `« ${wrong} » n'est pas dans le tableau`),
          ok(!text.toLowerCase().includes(wrong.toLowerCase()), `le texte écrit « ${wrong} » : un mauvais choix y est écrit`),
        ),
      ),
      kind === "quand" ? ok(same(optionsOf(exo), MOMENTS), optionsOf(exo).join(" | ")) : null,
    );
  };

// --- Remettre une histoire dans l'ordre ---
const ORDER_TABLE: readonly (readonly string[])[] = [
  ["D'abord, Awa se lève.", "Ensuite, elle se lave.", "Enfin, elle va en classe."],
  ["D'abord, Moussa prend son cartable.", "Ensuite, il ferme la porte.", "Enfin, il part à l'école."],
  ["D'abord, Fatou lave le riz.", "Ensuite, elle le met dans la marmite.", "Enfin, elle le sert chaud."],
  ["D'abord, Cheikh lance son filet.", "Ensuite, il attend un peu.", "Enfin, il sort un poisson."],
  ["D'abord, Aminata achète du pain.", "Ensuite, elle paie le vendeur.", "Enfin, elle rentre chez elle."],
  ["D'abord, Omar plante une graine.", "Ensuite, il l'arrose.", "Enfin, une petite pousse sort de terre."],
  ["Le matin, Awa va au marché.", "À midi, elle prépare le repas.", "L'après-midi, elle lave le linge.", "Le soir, elle raconte une histoire."],
  ["Le matin, Moussa va à la pêche.", "À midi, il mange du poisson.", "L'après-midi, il répare son filet.", "Le soir, il rentre au village."],
  ["Le matin, Fatou va en classe.", "À midi, elle mange à la cantine.", "L'après-midi, elle joue dans la cour.", "Le soir, elle fait ses devoirs."],
  ["Le matin, Ibrahima va au champ.", "À midi, il se repose sous un arbre.", "L'après-midi, il arrose les tomates.", "Le soir, il revient à la case."],
  ["Le matin, Mariama aide sa maman.", "À midi, elle va au puits.", "L'après-midi, elle lit un livre.", "Le soir, elle dort tôt."],
  ["Le matin, Modou prend le car.", "À midi, il arrive au village.", "L'après-midi, il rend visite à son oncle.", "Le soir, il repart chez lui."],
];
/** Le mot qui ouvre chaque phrase, dans l'ordre où il vient : un ordre que le texte ÉCRIT, pas un ordre à deviner. */
const MARKERS_THREE = ["D'abord, ", "Ensuite, ", "Enfin, "];
const MARKERS_FOUR = ["Le matin, ", "À midi, ", "L'après-midi, ", "Le soir, "];
const checkOrder: Check = (exo) => {
  const sequence = sequenceOf(exo);
  const markers = sequence.length === 3 ? MARKERS_THREE : MARKERS_FOUR;
  return all(
    ok(ORDER_TABLE.some((row) => JSON.stringify(row) === JSON.stringify(sequence)), `suite inconnue : ${sequence.join(" ")}`),
    ok(sequence.every((sentence, i) => sentence.startsWith(markers[i])), `les mots d'ordre ne se suivent pas : ${sequence.join(" ")}`),
    ok(sequence.length === 3 || sequence.length === 4, `${sequence.length} phrases`),
    ok(exo.prompt === "Remets les phrases de cette histoire dans le bon ordre.", exo.prompt),
  );
};

// --- Vrai ou faux ---
type TrueFalse = { lines: readonly string[]; truths: readonly string[]; falses: readonly string[] };
const TRUE_FALSE_TABLE: readonly TrueFalse[] = [
  { lines: ["Awa va au marché avec sa maman.", "Elle achète des mangues et du riz.", "Elle rentre avant midi."], truths: ["Awa va au marché.", "Awa achète du riz.", "Awa va au marché avec sa maman."], falses: ["Awa achète du poisson.", "Awa va à la plage.", "Awa rentre le soir."] },
  { lines: ["Moussa pêche avec son grand-père.", "Ils prennent trois poissons.", "Moussa est très content."], truths: ["Moussa pêche avec son grand-père.", "Ils prennent trois poissons.", "Moussa est content."], falses: ["Moussa pêche tout seul.", "Ils prennent dix poissons.", "Moussa est triste."] },
  { lines: ["Le chat de Fatou dort sur la natte.", "Il est petit et noir.", "Il aime le lait."], truths: ["Le chat dort sur la natte.", "Le chat est noir.", "Le chat aime le lait."], falses: ["Le chat dort dans le panier.", "Le chat est blanc.", "Le chat est très grand."] },
  { lines: ["Cheikh ramasse des coquillages sur la plage.", "Il en trouve douze.", "Il les met dans un seau."], truths: ["Cheikh ramasse des coquillages.", "Cheikh trouve douze coquillages.", "Cheikh met les coquillages dans un seau."], falses: ["Cheikh ramasse des mangues.", "Cheikh trouve deux coquillages.", "Cheikh met les coquillages dans un sac."] },
  { lines: ["Aminata prépare du riz pour sa famille.", "Elle lave le riz avec soin.", "Elle le fait cuire une heure."], truths: ["Aminata prépare du riz.", "Aminata lave le riz.", "Le riz cuit une heure."], falses: ["Aminata prépare du pain.", "Aminata lave le linge.", "Le riz cuit dix minutes."] },
  { lines: ["Omar joue au ballon dans la cour.", "Son ami Pape joue avec lui.", "Ils gagnent le match."], truths: ["Omar joue au ballon.", "Pape joue avec Omar.", "Omar et Pape gagnent."], falses: ["Omar joue dans la rue.", "Omar joue seul.", "Omar et Pape perdent."] },
  { lines: ["Mariama va au puits tôt le matin.", "Elle remplit deux seaux.", "Elle porte les seaux sur sa tête."], truths: ["Mariama va au puits.", "Mariama remplit deux seaux.", "Mariama porte les seaux sur sa tête."], falses: ["Mariama va au puits le soir.", "Mariama remplit un seul seau.", "Mariama porte les seaux dans ses mains."] },
  { lines: ["Le lion vit dans la savane.", "Il chasse la nuit.", "Il dort le jour sous un arbre."], truths: ["Le lion vit dans la savane.", "Le lion chasse la nuit.", "Le lion dort le jour."], falses: ["Le lion vit dans la mer.", "Le lion chasse le jour.", "Le lion dort la nuit."] },
  { lines: ["Ibrahima plante du mil au champ.", "Il creuse un petit trou pour chaque graine.", "Il arrose les graines chaque soir."], truths: ["Ibrahima plante du mil.", "Ibrahima creuse un trou pour chaque graine.", "Ibrahima arrose chaque soir."], falses: ["Ibrahima plante des tomates.", "Ibrahima jette les graines sans trou.", "Ibrahima arrose chaque matin."] },
  { lines: ["Khady lit un livre sous un arbre.", "Le livre parle de deux singes.", "Khady rit beaucoup."], truths: ["Khady lit un livre.", "Khady lit sous un arbre.", "Khady rit."], falses: ["Khady lit dans sa case.", "Le livre parle de deux lions.", "Khady ne rit pas."] },
  { lines: ["Le car part de Dakar à huit heures.", "Il roule toute la matinée.", "Il arrive à Saint-Louis à midi."], truths: ["Le car part à huit heures.", "Le car roule toute la matinée.", "Le car arrive à midi."], falses: ["Le car part à dix heures.", "Le car roule toute la nuit.", "Le car arrive le soir."] },
  { lines: ["Penda a trois frères et deux sœurs.", "Elle est la plus petite de la famille.", "Elle aime beaucoup chanter."], truths: ["Penda a trois frères.", "Penda a deux sœurs.", "Penda est la plus petite."], falses: ["Penda a deux frères.", "Penda est la plus grande.", "Penda n'aime pas chanter."] },
];
const checkTrueFalse: Check = (exo) => {
  const parts = split(exo.prompt);
  if (!parts) return `l'énoncé n'a pas la forme texte puis consigne : ${exo.prompt}`;
  const row = TRUE_FALSE_TABLE.find((candidate) => candidate.lines.join(" ") === parts[0]);
  if (!row) return `texte inconnu : ${parts[0]}`;
  for (const item of itemsOf(exo)) {
    const zone = row.truths.includes(item.text) ? "Vrai" : row.falses.includes(item.text) ? "Faux" : undefined;
    if (zone !== item.correctZone) return `« ${item.text} » rangé dans « ${item.correctZone} », la table dit « ${zone} »`;
  }
  const trues = itemsOf(exo).filter((item) => item.correctZone === "Vrai").length;
  return all(
    ok(parts[1] === "Range chaque phrase dans Vrai ou dans Faux.", parts[1]),
    ok(same(zonesOf(exo), ["Vrai", "Faux"]), zonesOf(exo).join(" | ")),
    ok(trues >= 2 && itemsOf(exo).length - trues >= 2, `${trues} vraies sur ${itemsOf(exo).length}`),
    ok(itemsOf(exo).length >= 4 && itemsOf(exo).length <= 5, `${itemsOf(exo).length} phrases`),
  );
};

// --- Relier un prénom à son action ---
const PEOPLE = ["Awa", "Fatou", "Aminata", "Moussa", "Cheikh", "Omar"];
const ACTIONS = ["achète des mangues", "pêche un poisson", "garde les moutons", "lave le linge", "plante du mil", "vend des oranges", "lit un livre", "joue au ballon", "prépare du riz", "chante une chanson", "dessine une maison", "arrose les fleurs"];
const checkLink: Check = (exo) => {
  const parts = split(exo.prompt);
  if (!parts) return `l'énoncé n'a pas la forme texte puis consigne : ${exo.prompt}`;
  const sentences = parts[0].split(/(?<=\.) /u);
  return all(
    ok(parts[1] === "Relie chaque prénom à son action.", parts[1]),
    ok(pairsOf(exo).length === 3 && sentences.length === 3, "trois phrases, trois paires"),
    ...pairsOf(exo).map((pair) =>
      all(
        ok(PEOPLE.includes(pair.left), `prénom inconnu : ${pair.left}`),
        ok(ACTIONS.includes(pair.right), `action inconnue : ${pair.right}`),
        ok(sentences.includes(`${pair.left} ${pair.right}.`), `« ${pair.left} ${pair.right}. » n'est pas écrit dans le texte`),
      ),
    ),
  );
};

// --- De quel animal parle le texte ---
const ANIMAL_TABLE: readonly (readonly [string, readonly string[]])[] = [
  ["l'éléphant", ["Il a une très longue trompe.", "Il a de très grandes oreilles.", "Il a deux grandes défenses blanches."]],
  ["le lion", ["Il a une grande crinière.", "Il rugit très fort.", "Il est le roi de la savane."]],
  ["la girafe", ["Elle a un très long cou.", "Elle a des taches sur la peau.", "Elle mange les feuilles tout en haut des arbres."]],
  ["le poisson", ["Il nage dans la mer.", "Il a des écailles brillantes.", "Il respire sous l'eau."]],
  ["le singe", ["Il grimpe aux arbres.", "Il mange des bananes.", "Il a de longs bras."]],
  ["le chat", ["Il miaule.", "Il a de longues moustaches.", "Il attrape les souris."]],
  ["le chien", ["Il aboie.", "Il garde la maison.", "Il remue la queue quand il est content."]],
  ["la vache", ["Elle meugle.", "Elle donne du lait.", "Elle a deux cornes."]],
  ["le cheval", ["Il galope très vite.", "Il hennit.", "On peut monter sur son dos."]],
  ["la poule", ["Elle pond des œufs.", "Elle picore des grains.", "Elle a une crête rouge sur la tête."]],
  ["le mouton", ["Il a une laine épaisse.", "Il bêle.", "On coupe sa laine pour faire des habits."]],
];
const ANIMAL_NAMES = ANIMAL_TABLE.map((row) => row[0]);
const checkAnimal: Check = (exo) => {
  const parts = split(exo.prompt);
  if (!parts) return `l'énoncé n'a pas la forme texte puis question : ${exo.prompt}`;
  const row = ANIMAL_TABLE.find((candidate) => candidate[1].join(" ") === parts[0]);
  if (!row) return `texte inconnu : ${parts[0]}`;
  return all(
    ok(parts[1] === "De quel animal parle ce texte ?", parts[1]),
    ok(rightOption(exo) === row[0], `réponse « ${rightOption(exo)} », les indices disent « ${row[0]} »`),
    ok(wrongOf(exo).length === 2 && wrongOf(exo).every((wrong) => ANIMAL_NAMES.includes(wrong) && wrong !== row[0]), `mauvais choix : ${wrongOf(exo).join(" | ")}`),
    // Aucun des trois indices ne va à un autre animal du tableau.
    ok(row[1].every((clue) => ANIMAL_TABLE.filter((other) => other[1].includes(clue)).length === 1), "un indice va à deux animaux"),
  );
};

// --- Une recette ---
const RECIPE_TABLE: readonly (readonly [string, readonly [string, string, string]])[] = [
  ["Pour préparer le riz.", ["Lave le riz dans une bassine.", "Mets le riz dans la marmite.", "Laisse cuire pendant une heure."]],
  ["Pour préparer un jus de bissap.", ["Lave les fleurs rouges.", "Fais bouillir les fleurs dans une casserole.", "Ajoute du sucre et laisse refroidir."]],
  ["Pour planter une graine.", ["Creuse un petit trou dans la terre.", "Mets la graine dans le trou.", "Recouvre la graine de terre et arrose."]],
  ["Pour se laver les mains.", ["Ouvre le robinet et mouille tes mains.", "Frotte tes mains avec du savon.", "Rince tes mains et essuie-les."]],
  ["Pour faire une omelette.", ["Casse deux œufs dans un bol.", "Bats les œufs avec une fourchette.", "Fais cuire dans une poêle chaude."]],
  ["Pour faire un avion en papier.", ["Prends une feuille de papier.", "Plie la feuille en deux.", "Plie les coins vers le centre."]],
];
const POSITION_OF: Record<string, number> = { "Que faut-il faire en premier ?": 0, "Que faut-il faire au milieu ?": 1, "Que faut-il faire en dernier ?": 2 };
const checkRecipe: Check = (exo) => {
  const parts = split(exo.prompt);
  if (!parts) return `l'énoncé n'a pas la forme texte puis question : ${exo.prompt}`;
  const row = RECIPE_TABLE.find((candidate) => parts[0] === `${candidate[0]} D'abord, ${lower(candidate[1][0])} Ensuite, ${lower(candidate[1][1])} Enfin, ${lower(candidate[1][2])}`);
  if (!row) return `recette inconnue : ${parts[0]}`;
  const position = POSITION_OF[parts[1]];
  if (position === undefined) return `question inconnue : ${parts[1]}`;
  return all(
    ok(rightOption(exo) === row[1][position], `la ${position + 1}e étape est « ${row[1][position]} », pas « ${rightOption(exo)} »`),
    ok(same(wrongOf(exo), row[1].filter((_, index) => index !== position)), `mauvais choix : ${wrongOf(exo).join(" | ")}`),
  );
};

// --- La règle d'un jeu ---
const BALL = "Pour jouer au ballon, on forme deux équipes. Chaque équipe a cinq joueurs. Il faut mettre le ballon dans le but.";
const ROPE = "Pour jouer à la corde, deux enfants tiennent la corde. Un troisième enfant saute. Il compte ses sauts à voix haute.";
const HIDE = "Pour jouer à cache-cache, un enfant ferme les yeux. Il compte de un à dix. Les autres vont se cacher.";
const HOPSCOTCH = "Pour jouer à la marelle, on dessine des cases sur le sol. On lance un caillou dans la première case. Puis on saute sur un pied.";
const WOLF = "Pour jouer au loup, un enfant est le loup. Il court après les autres. Celui que le loup touche devient le loup.";
const STATUES = "Pour jouer aux statues, tous les enfants dansent. Quand la musique finit, il faut rester immobile. Celui qui bouge a perdu.";
const RULE_TABLE: readonly { text: string; question: string; answer: string; wrong: readonly string[] }[] = [
  { text: BALL, question: "Combien de joueurs a chaque équipe ?", answer: "cinq joueurs", wrong: ["trois joueurs", "dix joueurs"] },
  { text: ROPE, question: "Qui tient la corde ?", answer: "deux enfants", wrong: ["un seul enfant", "tous les enfants"] },
  { text: HIDE, question: "Quel nombre dit-il en dernier ?", answer: "dix", wrong: ["cinq", "vingt"] },
  { text: HOPSCOTCH, question: "Que fait-on au début du jeu ?", answer: "on dessine des cases", wrong: ["on dessine des étoiles", "on dessine des maisons"] },
  { text: WOLF, question: "Que fait le loup ?", answer: "il court après les autres", wrong: ["il se cache", "il compte les sauts"] },
  { text: STATUES, question: "Que font les enfants au début ?", answer: "ils dansent", wrong: ["ils dorment", "ils chantent"] },
  { text: BALL, question: "Où faut-il mettre le ballon ?", answer: "dans le but", wrong: ["dans la cour", "dans un panier"] },
  { text: ROPE, question: "Que fait l'enfant qui saute ?", answer: "il compte ses sauts", wrong: ["il chante une chanson", "il court autour"] },
  { text: HIDE, question: "Que font les autres enfants ?", answer: "ils vont se cacher", wrong: ["ils rentrent à la maison", "ils lancent un ballon"] },
  { text: HOPSCOTCH, question: "Que lance-t-on dans la première case ?", answer: "on lance un caillou", wrong: ["on lance un ballon", "on lance une corde"] },
  { text: WOLF, question: "Que devient celui que le loup touche ?", answer: "il devient le loup", wrong: ["il devient un arbre", "il devient le gagnant"] },
  { text: STATUES, question: "Que faut-il faire quand la musique finit ?", answer: "rester immobile", wrong: ["courir très vite", "crier fort"] },
];
const checkRule: Check = (exo) => {
  const parts = split(exo.prompt);
  if (!parts) return `l'énoncé n'a pas la forme texte puis question : ${exo.prompt}`;
  const row = RULE_TABLE.find((candidate) => candidate.text === parts[0] && candidate.question === parts[1]);
  if (!row) return `règle inconnue : ${exo.prompt}`;
  const written = new Set(bigWords(parts[0]));
  const writtenShort = new Set(shortWords(parts[0]));
  return all(
    ok(rightOption(exo) === row.answer, `réponse « ${rightOption(exo)} », la règle dit « ${row.answer} »`),
    ok(same(wrongOf(exo), row.wrong), `mauvais choix : ${wrongOf(exo).join(" | ")}`),
    // La bonne réponse se lit dans le texte ; chaque mauvais choix dit au moins une chose que le texte n'écrit pas.
    ok(bigWords(row.answer).every((word) => written.has(word)), `la réponse « ${row.answer} » n'est pas écrite dans la règle`),
    ...row.wrong.map((wrong) => ok(shortWords(wrong).some((word) => !writtenShort.has(word)), `« ${wrong} » est écrit dans la règle`)),
  );
};

const CHECKS: Record<string, Check> = {
  "ce1-fr-lec-qui": checkStory("qui"),
  "ce1-fr-lec-quoi": checkStory("quoi"),
  "ce1-fr-lec-ou": checkStory("ou"),
  "ce1-fr-lec-quand": checkStory("quand"),
  "ce1-fr-lec-ordre": checkOrder,
  "ce1-fr-lec-vrai": checkTrueFalse,
  "ce1-fr-lec-relier": checkLink,
  "ce1-fr-lec-animal": checkAnimal,
  "ce1-fr-lec-recette": checkRecipe,
  "ce1-fr-lec-regle": checkRule,
};

const KINDS = Object.keys(CHECKS) as GameKind[];
const TOPIC_KEY = "fr-ce1-lecture";
const entry = allProgrammeEntries().find((candidate) => candidate.topic.key === TOPIC_KEY)!;
const games = () => entry.topic.games ?? [];

describe("chaque gabarit de lecture du CE1 a sa vérification", () => {
  it("couvre exactement les dix gabarits de la thématique", () => {
    expect(KINDS).toHaveLength(10);
    expect([...games().map((spec) => spec.kind as string)].sort()).toEqual([...KINDS].sort());
    for (const kind of KINDS) expect(Object.keys(GAME_KINDS), kind).toContain(kind);
  });

  it("a des tables sans défaut : un prénom par histoire, un indice par animal, des étapes toutes différentes", () => {
    expect(new Set(STORY_NAMES).size).toBe(16);
    expect(new Set(STORY_WHATS).size).toBe(16);
    for (const row of STORY_TABLE) expect(storyText(row), row[0]).not.toMatch(/:/);
    const clues = ANIMAL_TABLE.flatMap((row) => row[1]);
    expect(new Set(clues).size).toBe(clues.length);
    for (const row of RECIPE_TABLE) expect(new Set(row[1]).size, row[0]).toBe(3);
    for (const row of TRUE_FALSE_TABLE) {
      expect(row.truths).toHaveLength(3);
      expect(row.falses).toHaveLength(3);
      expect(new Set([...row.truths, ...row.falses]).size, row.lines[0]).toBe(6);
    }
  });
});

describe("les gabarits de lecture recalculent juste, depuis des tables et des règles écrites à part", () => {
  for (const kind of KINDS) {
    it(`${kind} : la bonne réponse se lit dans le texte, à tous les niveaux`, () => {
      for (const d of draws) {
        const exo = make(kind, d) as unknown as Exo;
        expect(CHECKS[kind](exo), `${kind} niveau ${d.level} : ${exo.prompt}`).toBeNull();
      }
    });
  }
});

// ===========================================================================
// LES MUTATIONS
// ===========================================================================

/** Abîme la bonne réponse d'un exercice juste, sans toucher à l'énoncé ni aux tuiles. */
function mutate(kind: GameKind, exo: Exo): Exo | null {
  const payload = JSON.parse(JSON.stringify(exo.payload)) as Record<string, unknown>;
  const copy = (): Exo => ({ ...exo, payload });
  switch (GAME_KINDS[kind].type) {
    case "qcm": {
      const options = payload.options as string[];
      payload.correctIndex = ((payload.correctIndex as number) + 1) % options.length;
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

  it("voient aussi un texte abîmé : un mauvais choix écrit dans le texte, un mauvais animal, un mot d'ordre à l'envers", () => {
    const qcm = (prompt: string, options: string[], correctIndex: number) => ({ type: "qcm", prompt, answerKey: options[correctIndex], hints: [], payload: { options, correctIndex } }) as Exo;
    const story = "Le matin, Awa va au marché. Elle achète des mangues. Puis, elle rentre à la maison.";
    // « à la maison » est écrit dans le texte : ce n'est pas un mauvais choix pour « Où va Awa ? ».
    expect(CHECKS["ce1-fr-lec-ou"](qcm(`${story}\nOù va Awa ?`, ["au marché", "à la maison", "à la plage"], 0))).not.toBeNull();
    expect(CHECKS["ce1-fr-lec-quand"](qcm(`${story}\nQuand Awa va-t-elle au marché ?`, ["le matin", "à midi", "le soir"], 1))).not.toBeNull();
    expect(CHECKS["ce1-fr-lec-animal"](qcm("Il miaule. Il a de longues moustaches. Il attrape les souris.\nDe quel animal parle ce texte ?", ["le chat", "le chien", "le lion"], 1))).not.toBeNull();
    const order = { type: "order", prompt: "Remets les phrases de cette histoire dans le bon ordre.", answerKey: "", hints: [], payload: { correctSequence: ["Ensuite, elle se lave.", "D'abord, Awa se lève.", "Enfin, elle va en classe."] } } as Exo;
    expect(CHECKS["ce1-fr-lec-ordre"](order)).not.toBeNull();
    // Une règle bien posée passe, un mauvais choix qui dit ce que le texte écrit ne passe pas.
    expect(CHECKS["ce1-fr-lec-regle"](qcm(`${ROPE}\nQui tient la corde ?`, ["deux enfants", "un seul enfant", "tous les enfants"], 0))).toBeNull();
    const bad = qcm(`${WOLF}\nQue fait le loup ?`, ["il court après les autres", "il compte les sauts", "il court après les autres enfants"], 0);
    expect(CHECKS["ce1-fr-lec-regle"](bad)).not.toBeNull();
  });
});

// ===========================================================================
// LES RÈGLES COMMUNES
// ===========================================================================

describe("tous les gabarits de lecture du CE1", () => {
  const exos = KINDS.flatMap((kind) => draws.filter((_, i) => i % 3 === 0).map((d) => ({ kind, exo: make(kind, d) as unknown as Exo })));

  const texts = (exo: Exo): string[] => {
    const out = [...exo.hints];
    if (exo.payload.options) out.push(...optionsOf(exo));
    if (exo.payload.correctSequence) out.push(...sequenceOf(exo));
    if (exo.payload.pairs) out.push(...pairsOf(exo).flatMap((pair) => [pair.left, pair.right]));
    if (exo.payload.items) out.push(...itemsOf(exo).map((item) => item.text), ...zonesOf(exo));
    return out;
  };

  it("ont un énoncé que l'écran sait couper : pas de deux-points, une apostrophe au plus, quatre-vingts mots au plus (le plafond du CE1)", () => {
    for (const { kind, exo } of exos) {
      expect(exo.prompt, kind).not.toMatch(/:/);
      expect(apostrophes(exo.prompt), `${kind} : ${exo.prompt}`).toBeLessThanOrEqual(1);
      expect(wordCount(exo.prompt), `${kind} : ${exo.prompt}`).toBeLessThanOrEqual(80);
    }
  });

  it("mettent le texte dans l'énoncé : un texte de trois à six phrases, puis la question à la ligne", () => {
    for (const { kind, exo } of exos) {
      if (kind === "ce1-fr-lec-ordre") continue;
      const parts = split(exo.prompt);
      expect(parts, `${kind} : ${exo.prompt}`).not.toBeNull();
      const sentences = parts![0].split(/(?<=\.) /u);
      expect(sentences.length, `${kind} : ${parts![0]}`).toBeGreaterThanOrEqual(3);
      expect(sentences.length, `${kind} : ${parts![0]}`).toBeLessThanOrEqual(6);
    }
  });

  it("n'écrivent aucun émoji, ni dans un énoncé, ni sur une tuile, ni dans un indice, et aucun U+FE0F", () => {
    const selector = String.fromCodePoint(0xfe0f);
    for (const { kind, exo } of exos) {
      expect(/\p{Extended_Pictographic}/u.test(exo.prompt), `${kind} : ${exo.prompt}`).toBe(false);
      for (const text of texts(exo)) {
        expect(text.includes(selector), `${kind} : « ${text} »`).toBe(false);
        expect(/\p{Extended_Pictographic}/u.test(text), `${kind} : « ${text} »`).toBe(false);
      }
    }
  });

  it("proposent des choix tous différents, dont un seul est la bonne réponse", () => {
    for (const { kind, exo } of exos) {
      if (exo.payload.options) {
        expect(new Set(optionsOf(exo)).size, `${kind} : ${exo.prompt}`).toBe(optionsOf(exo).length);
        expect(optionsOf(exo).length, `${kind} : ${exo.prompt}`).toBe(3);
      }
      if (exo.payload.items) {
        const items = itemsOf(exo);
        expect(new Set(items.map((item) => item.text)).size, `${kind} : ${exo.prompt}`).toBe(items.length);
      }
      if (exo.payload.pairs) {
        const pairs = pairsOf(exo);
        expect(new Set(pairs.map((pair) => pair.left)).size, kind).toBe(3);
        expect(new Set(pairs.map((pair) => pair.right)).size, kind).toBe(3);
      }
      if (exo.payload.correctSequence) expect(new Set(sequenceOf(exo)).size, kind).toBe(sequenceOf(exo).length);
    }
  });

  it("n'écrivent dans aucun indice un chiffre, ni un mot de quatre lettres ou plus de la bonne réponse, d'un choix ou d'une étiquette", () => {
    for (const { kind, exo } of exos) {
      const answers: string[] = [];
      if (exo.payload.options) answers.push(...optionsOf(exo));
      if (exo.payload.correctSequence) answers.push(...sequenceOf(exo));
      if (exo.payload.pairs) answers.push(...pairsOf(exo).flatMap((pair) => [pair.left, pair.right]));
      if (exo.payload.items) answers.push(...itemsOf(exo).map((item) => item.text), ...zonesOf(exo));
      const forbidden = new Set(answers.flatMap(bigWords));
      for (const hint of exo.hints) {
        expect(hint, `${kind} : « ${hint} » écrit un chiffre`).not.toMatch(/\d/);
        const hintWords = fold(hint).split(/[^a-z]+/);
        for (const word of forbidden) expect(hintWords, `${kind} : « ${hint} » écrit « ${word} »`).not.toContain(word);
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
        subject: "Français",
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
});

// ===========================================================================
// LA THÉMATIQUE DU PROGRAMME
// ===========================================================================

describe("la thématique « Lire et comprendre » du CE1", () => {
  it("remplit les dix places du palier, avec des jeux connus, sans appeler le modèle", () => {
    expect(games().reduce((sum, spec) => sum + spec.count, 0)).toBe(PALIER_SIZE);
    for (const spec of games()) {
      expect(Object.keys(GAME_KINDS), spec.kind).toContain(spec.kind);
      expect(spec.vocabulary, spec.kind).toBeUndefined();
    }
    expect(topicUsesModel(TOPIC_KEY)).toBe(false);
  });

  it("est celle du CE1, à quatre paliers, et garde sa clé", () => {
    expect(entry.klass).toBe("CE1");
    expect(entry.topic.palierCount).toBeUndefined();
    expect(entry.topic.name).toBe("Lire et comprendre");
  });

  it("fabrique des paliers entiers, de dix exercices, qui passent le contrôleur et la règle, aux quatre paliers", () => {
    for (let n = 0; n < 60; n++) {
      for (const palierIndex of [1, 2, 3, 4]) {
        const paliers = generateGames(games(), { klass: "CE1", palierIndex, palierCount: 4, seed: `${TOPIC_KEY}:${n}:${palierIndex}` });
        expect(paliers, `palier ${palierIndex}`).toHaveLength(PALIER_SIZE);
        const questions = paliers.map((game) => `${game.prompt}|${JSON.stringify(game.payload)}`);
        expect(new Set(questions).size, `#${n} palier ${palierIndex}`).toBe(questions.length);
        expect(new Set(paliers.map((game) => game.type)).size, `palier ${palierIndex}`).toBeGreaterThanOrEqual(4);
        for (const game of paliers) {
          const defects = auditExercise({ type: game.type, prompt: game.prompt, payload: game.payload, answerKey: game.answerKey, hints: game.hints, class: "CE1", subject: "Français" });
          expect(defects, `palier ${palierIndex} : ${game.prompt}`).toEqual([]);
          const kind = (game.payload.game as { kind: string }).kind;
          expect(CHECKS[kind](game as unknown as Exo), `palier ${palierIndex} ${kind} : ${game.prompt}`).toBeNull();
        }
      }
    }
  });

  it("pose, dans un palier, les quatre questions (qui, quoi, où, quand) sur quatre histoires différentes", () => {
    const STORY_KINDS = ["ce1-fr-lec-qui", "ce1-fr-lec-quoi", "ce1-fr-lec-ou", "ce1-fr-lec-quand"];
    for (let n = 0; n < 80; n++) {
      for (const palierIndex of [1, 2, 3, 4]) {
        const paliers = generateGames(games(), { klass: "CE1", palierIndex, palierCount: 4, seed: `story:${n}:${palierIndex}` });
        const names = paliers.filter((game) => STORY_KINDS.includes((game.payload.game as { kind: string }).kind)).map((game) => storyOf(game.prompt.split("\n")[0])?.[0]);
        expect(names, `palier ${palierIndex}`).toHaveLength(4);
        expect(new Set(names).size, `palier ${palierIndex} : ${names.join(" ")}`).toBe(4);
      }
    }
  });

  it("donne à chaque palier ses propres histoires : les seize histoires sont servies, quatre à chaque niveau", () => {
    const STORY_KINDS = ["ce1-fr-lec-qui", "ce1-fr-lec-quoi", "ce1-fr-lec-ou", "ce1-fr-lec-quand"];
    const byLevel: Record<number, Set<string>> = { 1: new Set(), 2: new Set(), 3: new Set(), 4: new Set() };
    for (let n = 0; n < 120; n++) {
      for (const palierIndex of [1, 2, 3, 4]) {
        for (const game of generateGames(games(), { klass: "CE1", palierIndex, palierCount: 4, seed: `lvl:${n}:${palierIndex}` })) {
          if (STORY_KINDS.includes((game.payload.game as { kind: string }).kind)) byLevel[palierIndex].add(storyOf(game.prompt.split("\n")[0])![0]);
        }
      }
    }
    for (const level of [1, 2, 3, 4]) expect(byLevel[level].size, `niveau ${level}`).toBe(4);
    const everyName = [1, 2, 3, 4].flatMap((level) => [...byLevel[level]]);
    expect([...everyName].sort()).toEqual([...STORY_NAMES].sort());
  });

  it("sert toutes les lignes de ses tableaux : aucune n'est perdue entre les paliers", () => {
    // Le nombre de questions différentes que chaque gabarit pose, sur les quatre paliers de la thématique et assez de graines.
    const EXPECTED: Record<string, number> = {
      "ce1-fr-lec-qui": 16,
      "ce1-fr-lec-quoi": 16,
      "ce1-fr-lec-ou": 16,
      "ce1-fr-lec-quand": 16,
      "ce1-fr-lec-ordre": 12,
      "ce1-fr-lec-animal": 11,
      "ce1-fr-lec-recette": 18,
      "ce1-fr-lec-regle": 12,
    };
    const seen: Record<string, Set<string>> = {};
    const texts = new Set<string>();
    const trues = new Set<string>();
    const falses = new Set<string>();
    for (let n = 0; n < 250; n++) {
      for (const palierIndex of [1, 2, 3, 4]) {
        for (const game of generateGames(games(), { klass: "CE1", palierIndex, palierCount: 4, seed: `row:${n}:${palierIndex}` })) {
          const kind = (game.payload.game as { kind: string }).kind;
          if (EXPECTED[kind]) (seen[kind] ??= new Set()).add(`${game.prompt}|${game.answerKey}`);
          if (kind === "ce1-fr-lec-vrai") {
            texts.add(game.prompt.split("\n")[0]);
            for (const item of game.payload.items as { text: string; correctZone: string }[]) (item.correctZone === "Vrai" ? trues : falses).add(item.text);
          }
        }
      }
    }
    for (const [kind, count] of Object.entries(EXPECTED)) expect(seen[kind]?.size, kind).toBe(count);
    // Le vrai ou faux tire des phrases de chaque texte : les douze textes et toutes leurs phrases doivent servir.
    expect(texts.size).toBe(12);
    expect([...trues].sort()).toEqual(TRUE_FALSE_TABLE.flatMap((row) => row.truths).sort());
    expect([...falses].sort()).toEqual(TRUE_FALSE_TABLE.flatMap((row) => row.falses).sort());
  });

  it("relie assez de trios de prénoms et d'actions pour que deux paliers ne posent pas le même", () => {
    const seen = new Set<string>();
    for (let n = 0; n < 800; n++) {
      for (const level of LEVELS) {
        const exo = GAME_KINDS["ce1-fr-lec-relier"].make(makeContext("CE1", level, `relier:${level}:${n}`));
        seen.add((exo.payload.pairs as { right: string }[]).map((pair) => pair.right).sort().join("|"));
      }
    }
    // Douze actions, deux cent vingt trios, cinquante-cinq par niveau.
    expect(seen.size).toBeGreaterThan(200);
  });

  it("ne repose presque jamais la même question à deux paliers", () => {
    let repeated = 0;
    let total = 0;
    for (let n = 0; n < 60; n++) {
      const before = new Set<string>();
      for (const palierIndex of [1, 2, 3, 4]) {
        const paliers = generateGames(games(), { klass: "CE1", palierIndex, palierCount: 4, seed: `var:${n}:${palierIndex}` });
        const here = paliers.map((game) => `${game.prompt}|${game.answerKey}`);
        for (const question of here) {
          total += 1;
          if (before.has(question)) repeated += 1;
        }
        here.forEach((question) => before.add(question));
      }
    }
    expect(repeated / total).toBeLessThan(0.02);
  });

  it("garde de quoi servir la démo du site : un gabarit du type de chaque exercice de la banque", () => {
    const types = new Set(games().map((spec) => GAME_KINDS[spec.kind].type));
    for (const type of ["qcm", "order", "match", "drag-drop"]) expect(types.has(type as never), type).toBe(true);
  });

  it("refait chaque exercice raté par le code, sans le modèle", () => {
    for (const kind of KINDS) {
      const again = regenerateGame({ kind, level: 3 }, "CE1", `reprise:${kind}`);
      expect(again, kind).not.toBeNull();
      expect(again!.type, kind).toBe(GAME_KINDS[kind].type);
    }
  });
});
