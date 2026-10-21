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
 * LES GABARITS DU CP EN FRANÇAIS ET EN ARTS : les consignes, décrire et comparer, raconter, inviter et conseiller ;
 * le matériel du peintre, les lignes et les traits, modeler, peindre, dessiner, les voix.
 *
 * Chaque test RECALCULE la bonne réponse depuis l'énoncé et les tuiles, avec ses propres tables écrites à part (le sens
 * de chaque verbe de consigne, les contraires, l'ordre des bêtes, les histoires, les invitations et les conseils, les
 * lignes, les voix) : un gabarit dont la réponse contredit sa table échoue. À la fin, des MUTATIONS : on abîme la bonne
 * réponse d'un exercice juste, et chaque vérification doit le voir. L'échantillon que le modèle avait écrit sur ces huit
 * thématiques comptait dix-huit exercices faux sur trente-cinq (un zigzag dessiné avec des tildes, un trait délié qui
 * ondule, une recette de bissap inventée, « Viens » et « Venez » acceptés tous les deux, un texte absent de l'écran).
 */

const LEVELS: GameLevel[] = [1, 2, 3, 4];
const draws = LEVELS.flatMap((level) => Array.from({ length: 60 }, (_, n) => ({ level, seed: `cp3:${level}:${n}` })));
const make = (kind: GameKind, d: (typeof draws)[number]) => GAME_KINDS[kind].make(makeContext("CP", d.level, `${kind}:${d.seed}`));

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
const wordCount = (text: string) =>
  text
    .replace(/\p{Extended_Pictographic}/gu, " ")
    .split(/\s+/)
    .filter((token) => /[\p{L}\p{N}]/u.test(token)).length;
const withoutEmoji = (text: string) => text.replace(/\p{Extended_Pictographic}/gu, "").trim();
const same = (a: readonly string[], b: readonly string[]) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());
const permutations = (items: string[]): string[][] =>
  items.length <= 1 ? [items] : items.flatMap((item, i) => permutations([...items.slice(0, i), ...items.slice(i + 1)]).map((rest) => [item, ...rest]));

type Check = (exo: Exo) => string | null;
const ok = (condition: boolean, message: string) => (condition ? null : message);

// ---------------------------------------------------------------------------
// Les tables de vérité, écrites à part des gabarits
// ---------------------------------------------------------------------------

// ----- les consignes -----
const GLOSS: Record<string, string> = {
  Entoure: "faire un rond autour",
  Colorie: "remplir de couleurs",
  Découpe: "couper avec des ciseaux",
  Relie: "tracer un trait entre deux dessins",
  Souligne: "tracer un trait sous le mot",
  Recopie: "écrire une deuxième fois",
};
const DOING: Record<string, string> = {
  Entoure: "Je fais un rond autour.",
  Colorie: "Je remplis avec des couleurs.",
  Découpe: "Je coupe avec des ciseaux.",
  Relie: "Je trace un trait entre deux dessins.",
  Souligne: "Je trace un trait sous le mot.",
  Recopie: "J'écris encore une fois ce qui est écrit.",
};
const FRAME_VERB: Record<string, string> = {
  "___ le dessin en faisant un rond autour.": "Entoure",
  "___ le dessin en le remplissant de couleurs.": "Colorie",
  "___ la forme avec des ciseaux.": "Découpe",
  "___ les deux dessins en traçant un trait entre eux.": "Relie",
  "___ le mot en traçant un trait dessous.": "Souligne",
  "___ la phrase en l'écrivant une deuxième fois.": "Recopie",
};
const VERBS = Object.keys(GLOSS);
const GOAL_STEPS: Record<string, string[]> = {
  "se laver les mains": ["Mouille tes mains.", "Mets du savon.", "Frotte tes mains.", "Rince tes mains."],
  "planter une graine": ["Fais un trou dans la terre.", "Mets la graine dans le trou.", "Recouvre la graine de terre.", "Arrose la terre."],
  "faire un dessin": ["Prends une feuille.", "Dessine une maison.", "Colorie la maison.", "Accroche ton dessin."],
  "boire un verre d'eau": ["Prends un verre.", "Remplis le verre d'eau.", "Bois l'eau.", "Pose le verre."],
};

// ----- décrire et comparer -----
const CONTRARY: Record<string, string> = {
  grand: "petit",
  petit: "grand",
  chaud: "froid",
  froid: "chaud",
  lourd: "léger",
  léger: "lourd",
  plein: "vide",
  vide: "plein",
  long: "court",
  court: "long",
};
const SIZE_FAMILY = ["grand", "petit", "long", "court"];
const CONTRARY_SENTENCE: Record<string, string> = {
  "Le feu est chaud, la glace est ___.": "froid",
  "Le chat est petit, le lion est ___.": "grand",
  "Le coton est léger, le fer est ___.": "lourd",
  "Le verre n'est pas plein, il est ___.": "vide",
  "Le crayon est long, le bout de crayon est ___.": "court",
};
/** Les bêtes, de la plus légère et plus petite à la plus lourde et plus grande : un seul ordre sert à juger « plus grand » comme « plus lourd ». */
const BEAST_ORDER = ["fourmi", "souris", "poule", "chien", "mouton", "vache", "girafe", "éléphant"];
const BEAST_OF_EMOJI: Record<string, string> = { "🐜": "fourmi", "🐭": "souris", "🐔": "poule", "🐕": "chien", "🐑": "mouton", "🐄": "vache", "🦒": "girafe", "🐘": "éléphant" };
const BEAST_GENDER: Record<string, "m" | "f"> = { fourmi: "f", souris: "f", poule: "f", chien: "m", mouton: "m", vache: "f", girafe: "f", éléphant: "m" };
const ADJECTIVE_BASE: Record<string, string> = { grand: "grand", grande: "grand", petit: "petit", petite: "petit", lourd: "lourd", lourde: "lourd", léger: "léger", légère: "léger" };

const NOUN_GENDER: Record<string, "m" | "f"> = { ballon: "m", cartable: "m", robe: "f", livre: "m", chat: "m", chien: "m", poule: "f", vache: "f", mouton: "m" };
const NOUN_VERB: Record<string, string> = { ballon: "a", livre: "a", cartable: "porte", robe: "porte", chat: "voit", chien: "voit", poule: "voit", vache: "voit", mouton: "voit" };
const BEFORE_FORMS = { m: ["grand", "petit", "joli", "gros"], f: ["grande", "petite", "jolie", "grosse"] };
const AFTER_FORMS = { m: ["rouge", "jaune", "bleu", "vert", "blanc", "noir"], f: ["rouge", "jaune", "bleue", "verte", "blanche", "noire"] };
const NAMES = ["Awa", "Fatou", "Aminata", "Moussa", "Cheikh", "Modou"];
const FEMALE_NAMES = ["Awa", "Fatou", "Aminata"];

// ----- raconter -----
const STORY = [
  { go: "va au marché", mid: "achète des mangues", midWhere: "achète des mangues au marché", end: "rentre à la maison", place: "au marché" },
  { go: "sort de la classe", mid: "joue au ballon", midWhere: "joue au ballon dans la cour", end: "retourne en classe", place: "dans la cour" },
  { go: "part à la pêche avec son grand-père", mid: "attrape un poisson", midWhere: "attrape un poisson avec son grand-père", end: "rentre avec le poisson", place: "à la pêche" },
];
const STORY_PLACES = STORY.map((story) => story.place);
const TIME_LABEL: Record<string, string> = { "Le matin": "le matin", "À midi": "midi", "Le soir": "le soir" };

// ----- inviter -----
const INVITATIONS = [
  "Viens jouer au ballon avec moi !",
  "Viens à mon baptême samedi !",
  "Je t'invite à mon anniversaire.",
  "Viens manger chez moi demain !",
  "Veux-tu venir au marché avec moi ?",
  "Viens chanter avec moi !",
];
const ADVICE = [
  "Fais attention en traversant la route.",
  "Lave-toi les mains avant de manger.",
  "Bois de l'eau quand il fait chaud.",
  "Mets ton chapeau quand il y a du soleil.",
  "Regarde des deux côtés avant de traverser.",
  "Mange des fruits pour grandir.",
];
const POLITE_YES = ["Oui, avec plaisir, merci !", "Oui, j'arrive, merci !", "Oui, merci beaucoup !"];
const POLITE_NO = ["Merci, mais je ne peux pas venir.", "Merci beaucoup, mais je ne peux pas.", "Merci de l'invitation, mais je ne peux pas venir."];
const RUDE = ["Non, va-t'en, je ne veux pas venir !", "Je m'en fiche de ton invitation !", "Pas question, laisse-moi tranquille !", "Non, ta fête ne m'intéresse pas du tout !"];

// ----- les arts -----
const TOOL_ROLE: Record<string, string> = { pinceau: "étaler la peinture", palette: "mélanger les couleurs", "gobelet d'eau": "laver le pinceau" };
const THE_TOOL: Record<string, string> = { "le pinceau": "pinceau", "la palette": "palette", "le gobelet d'eau": "gobelet d'eau" };
const LINE_DESC: Record<string, string> = {
  droite: "ne tourne jamais",
  courbe: "est arrondie, comme un arc-en-ciel",
  zigzag: "monte et descend en faisant des pointes",
  spirale: "tourne en s'enroulant sur elle-même, comme un escargot",
};
const STRAIGHT = ["le bord d'une règle", "un fil bien tendu", "le bord d'un cahier", "le haut du tableau"];
const CURVED = ["la forme d'un arc-en-ciel", "le bord d'une roue", "le bord d'une assiette", "le bord d'un ballon"];
const STROKE_DESC: Record<string, string> = { plein: "est toujours aussi épais", délié: "est très fin", modulé: "est tantôt épais, tantôt fin" };
// « découper » et « coller » ne servent qu'à relier (technique-relier) : le QCM n'en pose pas.
const MATERIAL: Record<string, string> = { modeler: "argile", peindre: "pinceau", dessiner: "crayon", découper: "ciseaux", coller: "colle" };
const WRONG_MATERIAL: Record<string, string[]> = { modeler: ["pinceau", "ciseaux"], peindre: ["argile", "ciseaux"], dessiner: ["argile", "ciseaux"] };
const LOUDNESS: Record<string, number> = { chuchoter: 0, "parler doucement": 1, "parler fort": 2, crier: 3 };
const VOICE_SENTENCE: Record<string, string> = {
  "Une berceuse se chante ___ pour endormir bébé.": "doucement",
  "Pour ne pas réveiller bébé, on parle ___.": "doucement",
  "Pour dire un secret à l'oreille, on parle ___.": "doucement",
  "Dans la bibliothèque, on parle ___.": "doucement",
  "Pour appeler un ami de l'autre côté de la cour, on parle ___.": "fort",
  "Pour être entendu au fond de la classe, on parle ___.": "fort",
};

// ---------------------------------------------------------------------------
// Les vérifications de chaque gabarit : elles recalculent la réponse
// ---------------------------------------------------------------------------

const CONSIGNES_KINDS = ["consigne-sens", "consigne-verbe", "consigne-relier", "consigne-trou", "consigne-intrus", "consigne-etapes"] as const satisfies readonly GameKind[];
const DECRIRE_KINDS = ["contraire-qcm", "contraire-relier", "contraire-trou", "comparer-trou", "adjectif-ordre"] as const satisfies readonly GameKind[];
const RECIT_KINDS = ["recit-ordre", "recit-qui", "recit-ou", "recit-quoi", "recit-quand", "recit-trou", "recit-relier"] as const satisfies readonly GameKind[];
const INVITATION_KINDS = [
  "invitation-glisser",
  "invitation-choisir",
  "invitation-reponse",
  "invitation-qui",
  "invitation-trou",
  "invitation-ordre",
] as const satisfies readonly GameKind[];
const ARTS_KINDS = [
  "peinture-outil",
  "peinture-relier",
  "ligne-qcm",
  "ligne-relier",
  "ligne-glisser",
  "trait-qcm",
  "technique-qcm",
  "technique-relier",
  "voix-ordre",
  "voix-qcm",
  "voix-trou",
] as const satisfies readonly GameKind[];

const FRENCH_KINDS: readonly GameKind[] = [...CONSIGNES_KINDS, ...DECRIRE_KINDS, ...RECIT_KINDS, ...INVITATION_KINDS];
const NEW_KINDS: readonly GameKind[] = [...FRENCH_KINDS, ...ARTS_KINDS];

const CHECKS: Record<string, Check> = {
  // ----- les consignes -----
  "consigne-sens": (exo) => {
    const verb = /« (\p{L}+) »/u.exec(exo.prompt)?.[1] ?? "";
    return ok(DOING[verb] === rightOption(exo), `« ${verb} » fait faire « ${DOING[verb]} », la bonne option est « ${rightOption(exo)} »`) ?? ok(optionsOf(exo).every((o) => Object.values(DOING).includes(o)), "un choix hors de la table");
  },
  "consigne-verbe": (exo) => {
    const gloss = /« (.+) »/u.exec(exo.prompt)?.[1] ?? "";
    const verb = VERBS.find((v) => GLOSS[v] === gloss);
    return ok(verb !== undefined && rightOption(exo) === verb, `« ${gloss} » dit « ${verb} », la bonne option est « ${rightOption(exo)} »`) ?? ok(optionsOf(exo).every((o) => VERBS.includes(o)), "un choix qui n'est pas un verbe de consigne");
  },
  "consigne-relier": (exo) => {
    const pairs = pairsOf(exo);
    for (const pair of pairs) if (GLOSS[pair.left] !== pair.right) return `« ${pair.left} » est relié à « ${pair.right} »`;
    return ok(pairs.length >= 3 && pairs.length <= 5 && new Set(pairs.map((pair) => pair.left)).size === pairs.length, "nombre de paires");
  },
  "consigne-trou": (exo) => {
    const verb = FRAME_VERB[textOf(exo)];
    return ok(verb !== undefined && blankOf(exo).answer === verb, `la phrase dit « ${verb} », le trou dit « ${blankOf(exo).answer} »`) ?? ok(blankOf(exo).options.every((o) => VERBS.includes(o)), "un choix qui n'est pas un verbe de consigne");
  },
  "consigne-intrus": (exo) => {
    const options = optionsOf(exo);
    const odd = options.filter((option) => !VERBS.includes(option));
    return ok(odd.length === 1 && ["Mange", "Dors"].includes(odd[0]) && rightOption(exo) === odd[0], `l'intrus est « ${odd.join(" | ")} », la bonne option est « ${rightOption(exo)} »`);
  },
  "consigne-etapes": (exo) => {
    const goal = /pour (.+)\.$/u.exec(exo.prompt)?.[1] ?? "";
    const steps = GOAL_STEPS[goal];
    const tiles = sequenceOf(exo);
    return ok(steps !== undefined && JSON.stringify(tiles) === JSON.stringify(steps.slice(0, tiles.length)), `les étapes de « ${goal} » sont ${steps?.join(" > ")}, l'exercice dit ${tiles.join(" > ")}`) ?? ok(tiles.length >= 3, "moins de trois étapes");
  },
  // ----- décrire et comparer -----
  "contraire-qcm": (exo) => {
    const word = /contraire de « (.+) » \?$/u.exec(exo.prompt)?.[1] ?? "";
    const options = optionsOf(exo);
    return (
      ok(CONTRARY[word] === rightOption(exo), `le contraire de « ${word} » est « ${CONTRARY[word]} », la bonne option est « ${rightOption(exo)} »`) ??
      ok(options.every((o) => o in CONTRARY), "un choix hors de la table") ??
      // « grand » et « court » se confondraient : aucun mot de taille parmi les mauvais choix d'une question de taille.
      ok(!SIZE_FAMILY.includes(word) || options.filter((o) => SIZE_FAMILY.includes(o)).length === 1, "deux mots de taille pour une question de taille")
    );
  },
  "contraire-relier": (exo) => {
    const pairs = pairsOf(exo);
    for (const pair of pairs) if (CONTRARY[pair.left] !== pair.right) return `« ${pair.left} » est relié à « ${pair.right} »`;
    return ok(pairs.length >= 3 && pairs.length <= 4 && new Set(pairs.flatMap((p) => [p.left, p.right])).size === pairs.length * 2, "nombre de paires ou mot répété");
  },
  "contraire-trou": (exo) => {
    const answer = CONTRARY_SENTENCE[textOf(exo)];
    const options = blankOf(exo).options;
    return (
      ok(answer !== undefined && blankOf(exo).answer === answer, `la phrase veut « ${answer} », le trou dit « ${blankOf(exo).answer} »`) ??
      ok(options.every((o) => o in CONTRARY), "un choix hors de la table") ??
      // Le mot déjà écrit dans la phrase (le contraire de la réponse) n'est jamais un choix.
      ok(!options.includes(CONTRARY[answer]), "le mot de la phrase est un choix") ??
      ok(!SIZE_FAMILY.includes(answer) || options.filter((o) => SIZE_FAMILY.includes(o)).length === 1, "deux mots de taille")
    );
  },
  "comparer-trou": (exo) => {
    const [, emojis = ""] = exo.prompt.split("\n");
    const [firstEmoji, secondEmoji] = emojis.split(" ");
    const first = BEAST_OF_EMOJI[firstEmoji];
    const second = BEAST_OF_EMOJI[secondEmoji];
    const match = /^(?:La|Le|L')\s*(\p{L}+) est plus ___ que (?:la|le|l')\s*(\p{L}+)\.$/u.exec(textOf(exo));
    if (!first || !second || !match) return `énoncé ${exo.prompt} / ${textOf(exo)}`;
    if (match[1] !== first || match[2] !== second) return "les bêtes de la phrase ne sont pas celles des dessins";
    const a = BEAST_ORDER.indexOf(first);
    const b = BEAST_ORDER.indexOf(second);
    if (a === b) return "la même bête deux fois";
    const feminine = BEAST_GENDER[first] === "f";
    const options = blankOf(exo).options;
    for (const option of options) if (!(option in ADJECTIVE_BASE)) return `« ${option} » n'est pas un mot de comparaison`;
    // L'adjectif s'accorde avec la première bête : la forme du féminin est celle qui diffère du masculin.
    const isFeminineForm = (option: string) => option !== ADJECTIVE_BASE[option];
    if (!options.every((option) => isFeminineForm(option) === feminine)) return "un adjectif mal accordé";
    // Plus grand, plus lourd : vrai pour la bête la plus haute dans l'ordre ; plus petit, plus léger : pour l'autre. Une seule option est vraie.
    const truth = (option: string) => (["grand", "lourd"].includes(ADJECTIVE_BASE[option]) ? a > b : a < b);
    const trueOptions = options.filter(truth);
    return ok(trueOptions.length === 1 && trueOptions[0] === blankOf(exo).answer, `les mots vrais sont « ${trueOptions.join(" | ")} », le trou dit « ${blankOf(exo).answer} »`);
  },
  "adjectif-ordre": (exo) => {
    const tiles = sequenceOf(exo);
    if (tiles.length !== 5) return `${tiles.length} mots`;
    const nounTile = tiles.find((tile) => tile.replace(/\.$/u, "") in NOUN_GENDER);
    const noun = nounTile?.replace(/\.$/u, "") ?? "";
    const gender = NOUN_GENDER[noun];
    const determiner = gender === "f" ? "une" : "un";
    const valid = (order: string[]) => {
      if (!NAMES.includes(order[0]) || order[1] !== NOUN_VERB[noun] || order[2] !== determiner) return false;
      const beforeForm = BEFORE_FORMS[gender].includes(order[3]) && order[4] === `${noun}.`;
      const afterForm = order[3] === noun && order[4].endsWith(".") && AFTER_FORMS[gender].includes(order[4].slice(0, -1));
      return beforeForm || afterForm;
    };
    return ok(noun in NOUN_GENDER, `nom ${noun}`) ?? ok(valid(tiles), `phrase ${tiles.join(" ")}`) ?? ok(permutations(tiles).filter(valid).length === 1, "plusieurs façons de ranger les mots");
  },
  // ----- raconter -----
  "recit-ordre": (exo) => {
    const tiles = sequenceOf(exo);
    const first = /^D'abord, (\p{Lu}\p{L}*) (.+)\.$/u.exec(tiles[0] ?? "");
    const second = /^Ensuite, (il|elle) (.+)\.$/u.exec(tiles[1] ?? "");
    const third = /^Enfin, (il|elle) (.+)\.$/u.exec(tiles[2] ?? "");
    if (!first || !second || !third) return `phrases ${tiles.join(" ")}`;
    const story = STORY.find((entry) => entry.go === first[2]);
    const pronoun = FEMALE_NAMES.includes(first[1]) ? "elle" : "il";
    return (
      ok(story !== undefined && NAMES.includes(first[1]), `histoire ${first[2]}`) ??
      ok(second[2] === story!.midWhere && third[2] === story!.end, "les étapes ne sont pas celles de l'histoire") ??
      ok(second[1] === pronoun && third[1] === pronoun, "le pronom ne va pas avec le prénom") ??
      ok(tiles.length === 3, "nombre de phrases")
    );
  },
  "recit-qui": (exo) => {
    const match = /^(\p{Lu}\p{L}*) (.+?)\. (\p{Lu}\p{L}*) (.+?)\.\nQui (.+) \?$/u.exec(exo.prompt);
    if (!match) return `énoncé ${exo.prompt}`;
    const [, a, actionA, b, actionB, asked] = match;
    const known = (action: string) => STORY.some((story) => story.midWhere === action);
    if (a === b || actionA === actionB || !known(actionA) || !known(actionB)) return "personnes ou actions hors table";
    const who = asked === actionA ? a : asked === actionB ? b : null;
    return ok(who !== null && rightOption(exo) === who, `qui ${asked} : ${who}, la bonne option est « ${rightOption(exo)} »`) ?? ok(optionsOf(exo).includes(a) && optionsOf(exo).includes(b), "les deux personnes du texte ne sont pas des choix");
  },
  "recit-ou": (exo) => {
    const match = /^(\p{Lu}\p{L}*) (.+?)\. (Il|Elle) (.+?)\.\n(Où .+) \?$/u.exec(exo.prompt);
    if (!match) return `énoncé ${exo.prompt}`;
    const story = STORY.find((entry) => entry.go === match[2]);
    if (!story || match[4] !== story.midWhere) return "le texte n'est pas celui d'une histoire";
    const text = `${match[2]}. ${match[4]}.`;
    return (
      ok(rightOption(exo) === story.place, `l'histoire se passe « ${story.place} », la bonne option est « ${rightOption(exo)} »`) ??
      // L'endroit est ÉCRIT dans le texte : sans cela, l'enfant devinerait.
      ok(text.includes(story.place), `l'endroit « ${story.place} » n'est pas écrit dans le texte`) ??
      ok(same(optionsOf(exo), STORY_PLACES), "les choix ne sont pas les trois endroits")
    );
  },
  "recit-quoi": (exo) => {
    const match = /^(\p{Lu}\p{L}*) (.+?)\.\nQue fait (\p{Lu}\p{L}*) \?$/u.exec(exo.prompt);
    if (!match) return `énoncé ${exo.prompt}`;
    const story = STORY.find((entry) => entry.midWhere === match[2]);
    const pronoun = FEMALE_NAMES.includes(match[1]) ? "Elle" : "Il";
    return (
      ok(story !== undefined && match[1] === match[3], "texte ou prénom") ??
      ok(rightOption(exo) === `${pronoun} ${story!.mid}.`, `la bonne option est « ${rightOption(exo)} »`) ??
      ok(optionsOf(exo).every((o) => STORY.some((entry) => o === `${pronoun} ${entry.mid}.`)), "un choix hors des histoires")
    );
  },
  "recit-quand": (exo) => {
    const match = /^(Le matin|À midi|Le soir), (\p{Lu}\p{L}*) (.+?)\. (Il|Elle) (.+?)\.\nQuel moment de la journée est écrit dans l'histoire \?$/u.exec(exo.prompt);
    if (!match) return `énoncé ${exo.prompt}`;
    return ok(TIME_LABEL[match[1]] === rightOption(exo), `« ${match[1]} » dit « ${TIME_LABEL[match[1]]} », la bonne option est « ${rightOption(exo)} »`) ?? ok(same(optionsOf(exo), Object.values(TIME_LABEL)), "les choix ne sont pas les trois moments");
  },
  "recit-trou": (exo) => {
    const text = textOf(exo);
    const words = ["D'abord", "Ensuite", "Enfin"];
    // Trois phrases, chacune ouverte par son mot d'ordre ; le trou prend la place d'un seul de ces mots.
    const parts = /^(\S+|___), (.+?)\. (\S+|___), (.+?)\. (\S+|___), (.+?)\.$/u.exec(text);
    if (!parts) return `texte ${text}`;
    const leads = [parts[1], parts[3], parts[5]];
    const missingAt = leads.indexOf("___");
    return (
      ok(missingAt >= 0 && leads.filter((lead) => lead === "___").length === 1, "un seul mot d'ordre manque") ??
      ok(leads.every((lead, i) => lead === "___" || lead === words[i]), `les mots écrits ne sont pas à leur place : ${leads.join(" | ")}`) ??
      ok(blankOf(exo).answer === words[missingAt], `le mot qui manque est « ${words[missingAt]} », le trou dit « ${blankOf(exo).answer} »`) ??
      ok(same(blankOf(exo).options, words), "les choix ne sont pas les trois mots d'ordre")
    );
  },
  "recit-relier": (exo) => {
    const [text, instruction] = exo.prompt.split("\n");
    const sentences = [...text.matchAll(/(\p{Lu}\p{L}*) (.+?)\./gu)].map((m) => [m[1], m[2]] as const);
    const pairs = pairsOf(exo);
    if (sentences.length !== 3 || instruction !== "Relie chaque enfant à ce qu'il fait.") return `énoncé ${exo.prompt}`;
    for (const pair of pairs) {
      const sentence = sentences.find(([name]) => name === pair.left);
      if (!sentence || sentence[1] !== pair.right) return `« ${pair.left} » est relié à « ${pair.right} », le texte dit « ${sentence?.[1]} »`;
      if (!STORY.some((story) => story.mid === pair.right)) return "une action hors table";
    }
    return ok(pairs.length === 3 && new Set(pairs.map((p) => p.left)).size === 3 && new Set(pairs.map((p) => p.right)).size === 3, "paires");
  },
  // ----- inviter -----
  "invitation-glisser": (exo) => {
    if (JSON.stringify(zonesOf(exo)) !== JSON.stringify(["Invitation", "Conseil"])) return `cases ${zonesOf(exo).join(" / ")}`;
    for (const item of itemsOf(exo)) {
      const zone = INVITATIONS.includes(item.text) ? "Invitation" : ADVICE.includes(item.text) ? "Conseil" : null;
      if (zone !== item.correctZone) return `« ${item.text} » va dans « ${zone} », l'exercice dit « ${item.correctZone} »`;
    }
    const counts = ["Invitation", "Conseil"].map((zone) => itemsOf(exo).filter((item) => item.correctZone === zone).length);
    return ok(counts[0] >= 2 && counts[1] >= 2, "une case a moins de deux phrases");
  },
  "invitation-choisir": (exo) => {
    const wantsInvitation = exo.prompt === "Quelle phrase est une invitation ?";
    const wantsAdvice = exo.prompt === "Quelle phrase est un conseil ?";
    if (!wantsInvitation && !wantsAdvice) return `énoncé ${exo.prompt}`;
    const right = wantsInvitation ? INVITATIONS : ADVICE;
    const other = wantsInvitation ? ADVICE : INVITATIONS;
    const options = optionsOf(exo);
    return ok(right.includes(rightOption(exo)), "la bonne option n'est pas de la bonne sorte") ?? ok(options.filter((o) => right.includes(o)).length === 1 && options.filter((o) => other.includes(o)).length === 2, "un mauvais choix est de la bonne sorte");
  },
  "invitation-reponse": (exo) => {
    const match = /^(\p{Lu}\p{L}*) t'invite à (.+)\. (Tu veux venir\.|Tu ne peux pas venir\.) Que réponds-tu poliment \?$/u.exec(exo.prompt);
    if (!match) return `énoncé ${exo.prompt}`;
    const accepts = match[3] === "Tu veux venir.";
    const polite = accepts ? POLITE_YES : POLITE_NO;
    const options = optionsOf(exo);
    return (
      ok(NAMES.includes(match[1]), "prénom") ??
      ok(polite.includes(rightOption(exo)), `« ${rightOption(exo)} » n'est pas la réponse polie de ce cas`) ??
      ok(options.filter((o) => RUDE.includes(o)).length === 2 && options.filter((o) => POLITE_YES.includes(o) || POLITE_NO.includes(o)).length === 1, "une seule réponse polie parmi trois")
    );
  },
  "invitation-qui": (exo) => {
    const match = /^(\p{Lu}\p{L}*) invite (\p{Lu}\p{L}*) à (.+) (samedi|dimanche|lundi)\.\n(Qui invite \?|Qui est invité \?|Quel jour a lieu l'invitation \?)$/u.exec(exo.prompt);
    if (!match) return `énoncé ${exo.prompt}`;
    const [, host, guest, , day, ask] = match;
    const options = optionsOf(exo);
    const answer = ask === "Qui invite ?" ? host : ask === "Qui est invité ?" ? guest : day;
    return (
      ok(host !== guest && NAMES.includes(host) && NAMES.includes(guest), "prénoms") ??
      ok(rightOption(exo) === answer, `la réponse est « ${answer} », la bonne option est « ${rightOption(exo)} »`) ??
      ok(ask.startsWith("Quel jour") ? same(options, ["samedi", "dimanche", "lundi"]) : options.includes(host) && options.includes(guest), "les choix ne sont pas ceux de la question")
    );
  },
  "invitation-trou": (exo) => {
    const match = /^(\p{Lu}\p{L}*) invite (\p{Lu}\p{L}*)\. (Il|Elle) lui dit « ___ (.+) ! »$/u.exec(textOf(exo));
    if (!match) return `phrase ${textOf(exo)}`;
    return (
      ok(match[3] === (FEMALE_NAMES.includes(match[1]) ? "Elle" : "Il"), "le pronom ne va pas avec l'enfant qui invite") ??
      // On parle à UN ami : « Viens », et jamais « Venez ».
      ok(blankOf(exo).answer === "Viens" && same(blankOf(exo).options, ["Viens", "Venir", "Venu"]), `réponse ${blankOf(exo).answer}`)
    );
  },
  "invitation-ordre": (exo) => {
    const tiles = sequenceOf(exo);
    return (
      ok(tiles.length === 3, "nombre de phrases") ??
      ok(/^Salut \p{Lu}\p{L}* !$/u.test(tiles[0]) && NAMES.includes(tiles[0].slice(6, -2)), "la première phrase n'est pas le salut") ??
      ok(/^Je t'invite à (mon anniversaire|mon baptême|ma fête)\.$/u.test(tiles[1]), "la deuxième phrase n'invite pas") ??
      ok(/^À (samedi|dimanche) !$/u.test(tiles[2]), "la dernière phrase n'est pas l'au revoir")
    );
  },
  // ----- les arts -----
  "peinture-outil": (exo) => {
    const byRole = /^Quel outil sert à (.+) \?$/u.exec(exo.prompt);
    const byTool = /^À quoi sert (.+) \?$/u.exec(exo.prompt);
    const tools = Object.keys(TOOL_ROLE);
    if (byRole) {
      const tool = tools.find((t) => TOOL_ROLE[t] === byRole[1]);
      return ok(tool !== undefined && rightOption(exo) === tool, `« ${byRole[1]} » est le travail du ${tool}, la bonne option est « ${rightOption(exo)} »`) ?? ok(same(optionsOf(exo), tools), "les choix ne sont pas les trois outils");
    }
    if (byTool) {
      const tool = THE_TOOL[byTool[1]];
      return ok(tool !== undefined && rightOption(exo) === TOOL_ROLE[tool], `le travail de « ${byTool[1]} » est « ${TOOL_ROLE[tool]} », la bonne option est « ${rightOption(exo)} »`) ?? ok(same(optionsOf(exo), Object.values(TOOL_ROLE)), "les choix ne sont pas les trois travaux");
    }
    return `énoncé ${exo.prompt}`;
  },
  "peinture-relier": (exo) => {
    const pairs = pairsOf(exo);
    for (const pair of pairs) if (TOOL_ROLE[pair.left] !== pair.right) return `« ${pair.left} » est relié à « ${pair.right} »`;
    return ok(pairs.length === 3 && new Set(pairs.map((pair) => pair.left)).size === 3, "les trois outils, chacun une fois");
  },
  "ligne-qcm": (exo) => {
    const desc = /^Quelle ligne (.+) \?$/u.exec(exo.prompt)?.[1] ?? "";
    const name = Object.keys(LINE_DESC).find((line) => LINE_DESC[line] === desc);
    return ok(name !== undefined && rightOption(exo) === name, `« ${desc} » est la ${name}, la bonne option est « ${rightOption(exo)} »`) ?? ok(optionsOf(exo).every((o) => o in LINE_DESC), "un choix qui n'est pas une ligne");
  },
  "ligne-relier": (exo) => {
    const pairs = pairsOf(exo);
    for (const pair of pairs) if (LINE_DESC[pair.left] !== pair.right) return `« ${pair.left} » est relié à « ${pair.right} »`;
    return ok(pairs.length >= 3 && pairs.length <= 4 && new Set(pairs.map((p) => p.left)).size === pairs.length, "nombre de paires");
  },
  "ligne-glisser": (exo) => {
    if (JSON.stringify(zonesOf(exo)) !== JSON.stringify(["Ligne droite", "Ligne courbe"])) return `cases ${zonesOf(exo).join(" / ")}`;
    for (const item of itemsOf(exo)) {
      const zone = STRAIGHT.includes(item.text) ? "Ligne droite" : CURVED.includes(item.text) ? "Ligne courbe" : null;
      if (zone !== item.correctZone) return `« ${item.text} » va dans « ${zone} », l'exercice dit « ${item.correctZone} »`;
    }
    const counts = ["Ligne droite", "Ligne courbe"].map((zone) => itemsOf(exo).filter((item) => item.correctZone === zone).length);
    return ok(counts[0] >= 2 && counts[1] >= 2, "une case a moins de deux choses");
  },
  "trait-qcm": (exo) => {
    const desc = /^Quel trait (.+) \?$/u.exec(exo.prompt)?.[1] ?? "";
    const name = Object.keys(STROKE_DESC).find((stroke) => STROKE_DESC[stroke] === desc);
    return ok(name !== undefined && rightOption(exo) === name, `« ${desc} » est le trait ${name}, la bonne option est « ${rightOption(exo)} »`) ?? ok(same(optionsOf(exo), Object.keys(STROKE_DESC)), "les choix ne sont pas les trois traits");
  },
  "technique-qcm": (exo) => {
    const match = /^Que prends-tu pour (modeler|peindre|dessiner) (.+) \?$/u.exec(exo.prompt);
    if (!match) return `énoncé ${exo.prompt}`;
    const verb = match[1];
    return (
      ok(rightOption(exo) === MATERIAL[verb], `pour ${verb} on prend « ${MATERIAL[verb]} », la bonne option est « ${rightOption(exo)} »`) ??
      ok(same(optionsOf(exo).filter((o) => o !== MATERIAL[verb]), WRONG_MATERIAL[verb]), "un mauvais choix peut aussi servir")
    );
  },
  "technique-relier": (exo) => {
    const pairs = pairsOf(exo);
    for (const pair of pairs) if (MATERIAL[pair.left] !== pair.right) return `« ${pair.left} » est relié à « ${pair.right} »`;
    return ok(pairs.length === 3, "nombre de paires");
  },
  "voix-ordre": (exo) => {
    const soft = exo.prompt.includes("de la plus douce à la plus forte");
    const loud = exo.prompt.includes("de la plus forte à la plus douce");
    const ranks = sequenceOf(exo).map((voice) => LOUDNESS[voice]);
    if (ranks.includes(undefined as unknown as number) || soft === loud) return `énoncé ${exo.prompt}`;
    for (let i = 1; i < ranks.length; i++) if (soft ? ranks[i] <= ranks[i - 1] : ranks[i] >= ranks[i - 1]) return `${sequenceOf(exo).join(" > ")} n'est pas dans l'ordre demandé`;
    return ok(ranks.length >= 3, "moins de trois voix");
  },
  "voix-qcm": (exo) => {
    const loud = exo.prompt === "Quelle façon de parler est la plus forte ?";
    const soft = exo.prompt === "Quelle façon de parler est la plus douce ?";
    if (loud === soft) return `énoncé ${exo.prompt}`;
    const ranks = optionsOf(exo).map((voice) => LOUDNESS[voice]);
    if (ranks.includes(undefined as unknown as number)) return "un choix qui n'est pas une façon de parler";
    const wanted = loud ? Math.max(...ranks) : Math.min(...ranks);
    return ok(LOUDNESS[rightOption(exo)] === wanted, `la bonne option est « ${rightOption(exo)} », ce n'est pas la ${loud ? "plus forte" : "plus douce"} des trois`);
  },
  "voix-trou": (exo) => {
    const answer = VOICE_SENTENCE[textOf(exo)];
    const { options } = blankOf(exo);
    // Une phrase qui veut « doucement » n'offre que des façons de parler fortes ; une phrase qui veut « fort » n'offre que des façons de parler douces.
    const rivals = answer === "doucement" ? ["très fort", "fort", "en criant"] : ["doucement", "en chuchotant"];
    return (
      ok(answer !== undefined && blankOf(exo).answer === answer, `la phrase veut « ${answer} », le trou dit « ${blankOf(exo).answer} »`) ??
      ok(options.filter((option) => option !== answer).every((option) => rivals.includes(option)), `un mauvais choix peut aussi aller : ${options.join(" | ")}`)
    );
  },
};

describe("chaque gabarit du lot 3 a sa vérification", () => {
  it("couvre exactement les gabarits du français et des arts du CP", () => {
    expect(Object.keys(CHECKS).sort()).toEqual([...NEW_KINDS].sort());
    for (const kind of NEW_KINDS) expect(Object.keys(GAME_KINDS), kind).toContain(kind);
  });
});

for (const [name, kinds] of [
  ["les consignes", CONSIGNES_KINDS],
  ["décrire et comparer", DECRIRE_KINDS],
  ["raconter", RECIT_KINDS],
  ["inviter et conseiller", INVITATION_KINDS],
  ["les arts", ARTS_KINDS],
] as const) {
  describe(`les gabarits de ${name} recalculent juste, depuis une table écrite à part`, () => {
    for (const kind of kinds) {
      it(`${kind} : la bonne réponse se lit dans la table, à tous les niveaux`, () => {
        for (const d of draws) {
          const exo = make(kind, d);
          expect(CHECKS[kind](exo), `${kind} niveau ${d.level} : ${exo.prompt}`).toBeNull();
        }
      });
    }
  });
}

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
      if (options.length < 2) return null;
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
      if (sequence.length < 2 || sequence[0] === sequence[sequence.length - 1]) return null;
      [sequence[0], sequence[sequence.length - 1]] = [sequence[sequence.length - 1], sequence[0]];
      return copy();
    }
    case "match": {
      const pairs = payload.pairs as { left: string; right: string }[];
      if (pairs.length < 2) return null;
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
  for (const kind of NEW_KINDS) {
    it(`${kind} : abîmer la réponse fait échouer la vérification`, () => {
      let mutated = 0;
      for (const d of draws.filter((_, i) => i % 6 === 0)) {
        const exo = make(kind, d);
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

describe("tous les gabarits du français et des arts du CP", () => {
  const exos = NEW_KINDS.flatMap((kind) => draws.map((d) => ({ kind, exo: make(kind, d) as Exo, level: d.level })));

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
      expect(exo.prompt.length, kind).toBeGreaterThan(10);
    }
  });

  it("n'écrivent jamais U+FE0F ni un émoji de Unicode 12 ou après : sur un téléphone ancien, il s'afficherait en case vide", () => {
    const recent = /[\u{1F7E0}-\u{1F7EB}\u{1F90D}-\u{1F90F}\u{1FA70}-\u{1FAFF}]/u;
    for (const { kind, exo } of exos) {
      for (const text of texts(exo)) {
        expect(text.includes("\uFE0F"), `${kind} : « ${text} »`).toBe(false);
        expect(recent.test(text), `${kind} : « ${text} »`).toBe(false);
      }
    }
  });

  it("proposent des choix tous différents, dont un seul est la bonne réponse", () => {
    for (const { kind, exo } of exos) {
      if (exo.payload.options) {
        const options = optionsOf(exo);
        expect(new Set(options).size, `${kind} : ${exo.prompt}`).toBe(options.length);
        expect(options.length, `${kind} : ${exo.prompt}`).toBeGreaterThanOrEqual(3);
      }
      if (exo.payload.blanks) {
        const { options, answer } = blankOf(exo);
        expect(new Set(options).size, `${kind} : ${textOf(exo)}`).toBe(options.length);
        expect(options.length, kind).toBe(3);
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

  it("n'écrivent dans aucun indice un mot de la bonne réponse ni d'une étiquette à placer", () => {
    for (const { kind, exo } of exos) {
      const answers: string[] = [];
      if (exo.payload.options) answers.push(rightOption(exo));
      if (exo.payload.blanks) answers.push(blankOf(exo).answer);
      if (exo.payload.correctSequence) answers.push(...sequenceOf(exo));
      if (exo.payload.pairs) answers.push(...pairsOf(exo).flatMap((pair) => [pair.left, pair.right]));
      if (exo.payload.items) answers.push(...itemsOf(exo).map((item) => item.text));
      const words = new Set(
        answers.flatMap((answer) =>
          fold(answer.replace(/\p{Extended_Pictographic}/gu, " "))
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
    for (const kind of NEW_KINDS) {
      const a = GAME_KINDS[kind].make(makeContext("CP", 2, "graine"));
      const b = GAME_KINDS[kind].make(makeContext("CP", 2, "graine"));
      expect(a).toEqual(b);
      expect(a.hints).toHaveLength(3);
      expect(new Set(a.hints).size, kind).toBe(3);
    }
  });

  it("passent le contrôleur de leur matière au CP sans aucun défaut, à tous les niveaux", () => {
    for (const { kind, exo } of exos) {
      const subject = (ARTS_KINDS as readonly string[]).includes(kind) ? "Éducation artistique" : "Français";
      const defects = auditExercise({
        type: GAME_KINDS[kind].type,
        prompt: exo.prompt,
        payload: exo.payload,
        answerKey: exo.answerKey,
        hints: exo.hints,
        class: "CP",
        subject,
      });
      expect(defects, `${kind} : ${exo.prompt}`).toEqual([]);
    }
  });

  it("n'écrivent aucune tuile « article + un nom » : au CI, elle demanderait une image que le catalogue n'a pas", () => {
    // « le matin », « le soir » ont leur image au catalogue (les moments de la journée) : seules les autres tuiles sont jugées.
    const ARTICLE_THEN_NOUN = /^(?:(?:le|la|les|un|une|des|du|de la)\s+|(?:de\s+)?l['’]\s?)[\p{L}'’-]+$/iu;
    const WITH_PICTURE = ["le matin", "le soir"];
    for (const { kind, exo } of exos) {
      const tiles: string[] = [];
      if (exo.payload.options) tiles.push(...optionsOf(exo));
      if (exo.payload.correctSequence) tiles.push(...sequenceOf(exo));
      if (exo.payload.pairs) tiles.push(...pairsOf(exo).flatMap((pair) => [pair.left, pair.right]));
      if (exo.payload.items) tiles.push(...itemsOf(exo).map((item) => item.text), ...zonesOf(exo));
      for (const tile of tiles) {
        const text = withoutEmoji(tile);
        expect(WITH_PICTURE.includes(text) || !ARTICLE_THEN_NOUN.test(text), `${kind} : « ${tile} »`).toBe(true);
      }
    }
  });
});

// ===========================================================================
// LES THÉMATIQUES DU PROGRAMME
// ===========================================================================

describe("les huit thématiques de français et d'arts du CP", () => {
  const KEYS = ["fr-cp-consignes", "fr-cp-decrire", "fr-cp-raconter", "fr-cp-inviter", "ar-cp-melanges", "ar-cp-traits", "ar-cp-decorer", "ar-cp-rythmes"];
  const LOT1_KEYS = ["hi-cp-calendrier", "hi-cp-durees", "hi-cp-frequences", "hi-cp-emploi-du-temps", "ge-cp-itineraire", "ge-cp-distances", "ge-cp-plan", "ge-cp-quartier"];
  const LOT2_KEYS = ["an-cp-family", "an-cp-body", "an-cp-classroom", "an-cp-numbers-20", "an-cp-food", "fr-cp-lecture", "fr-cp-ecrire"];
  const entryOf = (key: string) => allProgrammeEntries().find((e) => e.topic.key === key)!;
  const topicOf = (key: string) => entryOf(key).topic;

  it("remplissent les dix places du palier, avec des jeux connus, sans appeler le modèle", () => {
    for (const key of KEYS) {
      const specs = topicOf(key).games ?? [];
      expect(
        specs.reduce((sum, spec) => sum + spec.count, 0),
        key,
      ).toBe(PALIER_SIZE);
      for (const spec of specs) expect(Object.keys(GAME_KINDS), `${key} : ${spec.kind}`).toContain(spec.kind);
      expect(topicUsesModel(key), key).toBe(false);
    }
  });

  it("sont toutes entièrement faites par le code, avec celles des lots précédents (la liste exacte est dans cpCiviqueTemplates.test.ts)", () => {
    const allCode = new Set(
      allProgrammeEntries()
        .filter((e) => e.klass === "CP" && (e.topic.games ?? []).reduce((sum, spec) => sum + spec.count, 0) >= PALIER_SIZE)
        .map((e) => e.topic.key),
    );
    for (const key of [...LOT1_KEYS, ...LOT2_KEYS, ...KEYS]) expect(allCode.has(key), key).toBe(true);
  });

  it("sont celles du CP, et n'ont changé ni leur clé ni leur nombre de paliers", () => {
    for (const key of KEYS) {
      expect(entryOf(key).klass, key).toBe("CP");
      expect(topicOf(key).palierCount, key).toBeUndefined();
    }
  });

  it("fabriquent des paliers entiers, de dix exercices tous différents, qui passent le contrôleur", () => {
    for (const key of KEYS) {
      const subject = entryOf(key).subject.name;
      for (let n = 0; n < 40; n++) {
        for (const palierIndex of [1, 2, 3]) {
          const games = generateGames(topicOf(key).games ?? [], { klass: "CP", palierIndex, palierCount: 3, seed: `${key}:${n}:${palierIndex}` });
          expect(games, `${key} palier ${palierIndex}`).toHaveLength(PALIER_SIZE);
          // Le même énoncé avec la même réponse peut cacher deux contenus différents (« Complète l'histoire… ») : seul le contenu entier fait le doublon.
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
              subject,
            });
            expect(defects, `${key} palier ${palierIndex} : ${game.prompt}`).toEqual([]);
          }
        }
      }
    }
  });

  it("varient les types d'un palier : au moins trois sortes d'exercices sur dix", () => {
    for (const key of KEYS) {
      for (const palierIndex of [1, 2, 3]) {
        const games = generateGames(topicOf(key).games ?? [], { klass: "CP", palierIndex, palierCount: 3, seed: key });
        expect(new Set(games.map((game) => game.type)).size, `${key} palier ${palierIndex}`).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it("racontent des histoires différentes dans un même palier : trois ordres de phrases, trois histoires, et deux trous, deux histoires", () => {
    const storyOf = (text: string) => STORY.findIndex((story) => text.includes(story.go) || text.includes(story.end));
    for (let n = 0; n < 60; n++) {
      for (const palierIndex of [1, 2, 3]) {
        const games = generateGames(topicOf("fr-cp-raconter").games ?? [], { klass: "CP", palierIndex, palierCount: 3, seed: `histoires:${n}:${palierIndex}` });
        const orders = games.filter((game) => game.payload.game.kind === "recit-ordre").map((game) => storyOf(sequenceOf(game as unknown as Exo).join(" ")));
        const gaps = games.filter((game) => game.payload.game.kind === "recit-trou").map((game) => storyOf(textOf(game as unknown as Exo)));
        expect(orders, `palier ${palierIndex} #${n}`).toHaveLength(3);
        expect(new Set(orders).size, `ordres du palier ${palierIndex} #${n} : ${orders.join(",")}`).toBe(3);
        expect(gaps, `palier ${palierIndex} #${n}`).toHaveLength(2);
        expect(new Set(gaps).size, `trous du palier ${palierIndex} #${n} : ${gaps.join(",")}`).toBe(2);
        expect([...orders, ...gaps].every((index) => index >= 0)).toBe(true);
      }
    }
  });

  it("répondent poliment une fois oui et une fois non par palier d'invitation", () => {
    for (let n = 0; n < 40; n++) {
      for (const palierIndex of [1, 2, 3]) {
        const games = generateGames(topicOf("fr-cp-inviter").games ?? [], { klass: "CP", palierIndex, palierCount: 3, seed: `reponse:${n}:${palierIndex}` });
        const replies = games.filter((game) => game.payload.game.kind === "invitation-reponse").map((game) => game.prompt.includes("Tu veux venir."));
        expect(replies.filter(Boolean), `palier ${palierIndex} #${n}`).toHaveLength(1);
        expect(replies.filter((reply) => !reply), `palier ${palierIndex} #${n}`).toHaveLength(1);
      }
    }
  });

  it("gardent de quoi servir la démo du site : un exercice de chaque type que la banque attend sur ces thématiques", () => {
    // La banque (`components/landing/demo/bank`) montre, au CP, un QCM en « Raconter une histoire », un glissé en « Inviter et conseiller », une
    // association en « Décrire et comparer », une phrase à trous en « Les consignes » ; un QCM en « Mélanger les couleurs », un glissé en « Les traits
    // et les lignes », une association en « Décorer avec des motifs », un ordre et une phrase à trous en « Comptines et rythmes ».
    const typesOf = (key: string) => new Set((topicOf(key).games ?? []).map((spec) => GAME_KINDS[spec.kind].type));
    expect(typesOf("fr-cp-raconter").has("qcm")).toBe(true);
    expect(typesOf("fr-cp-inviter").has("drag-drop")).toBe(true);
    expect(typesOf("fr-cp-decrire").has("match")).toBe(true);
    expect(typesOf("fr-cp-consignes").has("fill-blank")).toBe(true);
    expect(typesOf("ar-cp-melanges").has("qcm")).toBe(true);
    expect(typesOf("ar-cp-traits").has("drag-drop")).toBe(true);
    expect(typesOf("ar-cp-decorer").has("match")).toBe(true);
    expect(typesOf("ar-cp-rythmes").has("order")).toBe(true);
    expect(typesOf("ar-cp-rythmes").has("fill-blank")).toBe(true);
  });

  it("refont chaque exercice raté par le code, sans le modèle", () => {
    for (const key of KEYS) {
      for (const spec of topicOf(key).games ?? []) {
        const origin = { kind: spec.kind, level: 2 };
        const again = regenerateGame(origin, "CP", `reprise:${key}:${spec.kind}`);
        expect(again, spec.kind).not.toBeNull();
        expect(again!.type, spec.kind).toBe(GAME_KINDS[spec.kind].type);
      }
    }
  });
});
