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
 * LE FRANÇAIS DU CE1, PREMIÈRE MOITIÉ : la phrase, le nom et l'adjectif, le présent et le passé composé, l'impératif et le futur, le dictionnaire.
 *
 * Chaque test RECALCULE la bonne réponse avec ses propres règles et ses propres tables, écrites à part : les formes du présent de neuf verbes,
 * leurs participes, les terminaisons du futur, l'ordre alphabétique (sans les accents), le sens de chaque phrase. Un gabarit dont la réponse
 * contredit sa règle échoue. À la fin, des MUTATIONS : on abîme la bonne réponse d'un exercice juste, et chaque vérification doit le voir.
 * Sur l'échantillon de CE1 lu le 21 octobre 2026, 17 exercices de français sur 42 étaient faux (« Fatou a mangé au yassa », un mot « avant »
 * donné à l'envers, « je irai »).
 */

const LEVELS: GameLevel[] = [1, 2, 3, 4];
const draws = LEVELS.flatMap((level) => Array.from({ length: 60 }, (_, n) => ({ level, seed: `ce1fr:${level}:${n}` })));
const make = (kind: GameKind, d: { level: GameLevel; seed: string }) => GAME_KINDS[kind].make(makeContext("CE1", d.level, `${kind}:${d.seed}`));

type Exo = { type?: string; prompt: string; answerKey: string; hints: string[]; payload: Record<string, unknown> };
const optionsOf = (exo: Exo) => exo.payload.options as string[];
const rightOption = (exo: Exo) => optionsOf(exo)[exo.payload.correctIndex as number];
const wrongOf = (exo: Exo) => optionsOf(exo).filter((option) => option !== rightOption(exo));
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
/** Les écritures admises d'un verbe conjugué « avec « ils » » : le verbe seul, ou avec le pronom de la consigne (« j'ai » s'élide). */
const writtenWith = (pronoun: string, form: string): string[] =>
  pronoun === "je" && /^[aeéèêiouyh]/u.test(form) ? [form, `j'${form}`, `j’${form}`] : [form, `${pronoun} ${form}`];

type Check = (exo: Exo) => string | null;
const ok = (condition: boolean, message: string) => (condition ? null : message);
const all = (...results: (string | null)[]) => results.find((result) => result !== null) ?? null;
const quoted = (prompt: string) => /«\s(.+?)\s»/u.exec(prompt)?.[1];
const words = (text: string) => text.replace(/[.,!?]/g, "").split(/\s+/).filter(Boolean);

// ===========================================================================
// LES TABLES, ÉCRITES À PART
// ===========================================================================

type Row = readonly [string, string, readonly string[]];
const checkGapTable =
  (table: readonly Row[]): Check =>
  (exo) => {
    const row = table.find((entry) => entry[0] === textOf(exo) && entry[1] === blankOf(exo).answer);
    if (!row) return `phrase inconnue : ${textOf(exo)} → ${blankOf(exo).answer}`;
    return ok(same(blankOf(exo).options, [row[1], ...row[2]]), `les choix : ${blankOf(exo).options.join(" | ")}`);
  };
const checkSteps =
  (valid: (sequence: string[]) => boolean, what: string): Check =>
  (exo) =>
    ok(valid(sequenceOf(exo)), `${what} : ${sequenceOf(exo).join(" ")}`);
const checkLinks =
  (valid: (left: string, right: string, prompt: string) => boolean): Check =>
  (exo) => {
    for (const pair of pairsOf(exo)) if (!valid(pair.left, pair.right, exo.prompt)) return `« ${pair.left} » relié à « ${pair.right} » (${exo.prompt})`;
    return ok(pairsOf(exo).length === 3, "trois paires");
  };
const checkSort =
  (zones: readonly [string, string], zoneOf: (tile: string) => string | undefined): Check =>
  (exo) => {
    for (const item of itemsOf(exo)) if (zoneOf(item.text) !== item.correctZone) return `« ${item.text} » rangé dans « ${item.correctZone} », la règle dit « ${zoneOf(item.text)} »`;
    return all(
      ok(same(zonesOf(exo), zones), `cases ${zonesOf(exo).join(" | ")}`),
      ok(zones.every((zone) => itemsOf(exo).some((item) => item.correctZone === zone)), "chaque case reçoit au moins une étiquette"),
      ok(itemsOf(exo).length >= 4 && itemsOf(exo).length <= 5, `${itemsOf(exo).length} étiquettes`),
    );
  };
const sentenceOk = (sequence: string[], valid: readonly string[]) => valid.includes(sequence.join(" ")) && /^[A-ZÉ]/u.test(sequence[0]) && /\.$/u.test(sequence[sequence.length - 1]);

// --- La phrase ---
const VERB_OF: Record<string, string> = {
  "Awa mange du riz.": "mange",
  "Moussa joue au ballon.": "joue",
  "Fatou lave le linge.": "lave",
  "Ibrahima ferme la porte.": "ferme",
  "Aminata lit un livre.": "lit",
  "Mariama achète du pain.": "achète",
  "Cheikh range ses affaires.": "range",
  "Omar saute dans la cour.": "saute",
  "Les enfants chantent dans la classe.": "chantent",
  "Le vendeur compte les pièces.": "compte",
  "La maîtresse écrit au tableau.": "écrit",
  "Le pêcheur lance son filet.": "lance",
};
const SUBJECT_OF: Record<string, string> = {
  "Awa mange du riz.": "Awa",
  "Moussa joue au ballon.": "Moussa",
  "Fatou lave le linge.": "Fatou",
  "Ibrahima ferme la porte.": "Ibrahima",
  "Aminata lit un livre.": "Aminata",
  "Mariama achète du pain.": "Mariama",
  "Cheikh range ses affaires.": "Cheikh",
  "Omar saute dans la cour.": "Omar",
  "Nous chantons dans la classe.": "Nous",
  "Elle écrit au tableau.": "Elle",
  "Ils jouent dans la cour.": "Ils",
  "Vous mangez du riz.": "Vous",
};
const PHRASE_ORDER_SET = [
  "Awa mange du riz.",
  "Moussa joue au ballon.",
  "Fatou lave le linge.",
  "Ibrahima ferme la porte.",
  "Aminata lit un livre.",
  "Mariama achète du pain.",
  "Cheikh range ses affaires.",
  "Omar saute dans la cour.",
  "Nous chantons dans la classe.",
  "Elle écrit au tableau.",
  "Ils jouent dans la cour.",
  "Vous mangez du riz.",
];
const GROUP_TABLE: readonly Row[] = [
  ["___ cartable est lourd.", "Le", ["La", "Les"]],
  ["___ mangue est sucrée.", "La", ["Le", "Les"]],
  ["___ enfants jouent.", "Les", ["Le", "La"]],
  ["Awa a ___ cahier neuf.", "un", ["une", "des"]],
  ["Moussa ouvre ___ porte.", "la", ["le", "les"]],
  ["Il y a ___ table dans la classe.", "une", ["un", "des"]],
  ["___ ballon roule.", "Le", ["La", "Les"]],
  ["Cheikh achète ___ mangues.", "des", ["un", "une"]],
  ["___ natte est propre.", "La", ["Le", "Les"]],
  ["Ils lisent ___ livre.", "un", ["une", "des"]],
  ["Omar cherche ___ cahier.", "le", ["la", "les"]],
  ["Fatou range ___ livres.", "les", ["le", "la"]],
];
const VERB_FORMS = ["mangeons", "chantons", "dormez", "achetez", "sautent", "écoutent", "courent", "lisent", "écrivent", "travaillent"];
const ABSTRACT_NOUNS = ["joie", "peur", "idée", "faim", "soif", "couleur", "histoire", "musique", "chanson", "vitesse", "fête"];
const GRAMMAR_TERMS: Record<string, string> = {
  "Le mot qui change avec hier et demain": "Verbe",
  "Celui qui fait l'action": "Sujet",
  "Elle a une majuscule et un point": "Phrase",
  "Un déterminant et un nom": "Groupe nominal",
};

// --- Le nom, l'article et l'adjectif ---
const ARTICLE_OF: Record<string, string> = {
  cahier: "le",
  mangue: "la",
  ballon: "le",
  porte: "la",
  marché: "le",
  maison: "la",
  livre: "le",
  table: "la",
  village: "le",
  classe: "la",
  stylo: "le",
  fenêtre: "la",
};
const AGREE_TABLE: readonly Row[] = [
  ["Un ___ arbre.", "grand", ["grande", "grands"]],
  ["Une ___ case.", "grande", ["grand", "grandes"]],
  ["Des ___ arbres.", "grands", ["grand", "grande"]],
  ["Une ___ maison.", "petite", ["petit", "petits"]],
  ["Un ___ cartable.", "petit", ["petite", "petits"]],
  ["Une fille ___.", "contente", ["content", "contents"]],
  ["Des garçons ___.", "contents", ["content", "contente"]],
  ["Une fleur ___.", "jolie", ["joli", "jolis"]],
  ["Des fruits ___.", "mûrs", ["mûr", "mûre"]],
  ["Une mangue ___.", "mûre", ["mûr", "mûrs"]],
  ["Un chat ___.", "noir", ["noire", "noirs"]],
  ["Des chattes ___.", "noires", ["noir", "noire"]],
];
const MASCULINE_NOUNS = ["courage", "bonheur", "silence", "travail", "respect", "voyage", "calme", "métier", "conseil"];
const FEMININE_NOUNS = ["joie", "peur", "idée", "faim", "soif", "couleur", "histoire", "musique", "chanson", "vitesse", "fête", "amitié"];
const NOM_ORDER_SET = [
  "Awa a une grande case.",
  "Moussa a un petit cartable.",
  "Fatou a un chat noir.",
  "Mariama cueille une jolie fleur.",
  "Cheikh mange un fruit mûr.",
  "Omar lit un grand livre.",
  "Aminata porte une petite mangue.",
  "Ibrahima a une belle voix.",
  "Nous voyons des grands arbres.",
  "Elle a des chattes noires.",
  "Ils lisent des livres neufs.",
  "Vous achetez des mangues mûres.",
];
const FEMININE_OF: Record<string, string> = { petit: "petite", grand: "grande", content: "contente", noir: "noire", joli: "jolie", mûr: "mûre", vert: "verte", blanc: "blanche" };

// --- Les verbes : formes écrites une à une ---
const PERSON: Record<string, number> = { je: 0, "j'": 0, tu: 1, il: 2, elle: 2, nous: 3, vous: 4, ils: 5, awa: 2, moussa: 2, omar: 2, cheikh: 2 };
const PRESENT_FORMS: Record<string, readonly string[]> = {
  chanter: ["chante", "chantes", "chante", "chantons", "chantez", "chantent"],
  jouer: ["joue", "joues", "joue", "jouons", "jouez", "jouent"],
  manger: ["mange", "manges", "mange", "mangeons", "mangez", "mangent"],
  danser: ["danse", "danses", "danse", "dansons", "dansez", "dansent"],
  avoir: ["ai", "as", "a", "avons", "avez", "ont"],
  être: ["suis", "es", "est", "sommes", "êtes", "sont"],
  aller: ["vais", "vas", "va", "allons", "allez", "vont"],
  partir: ["pars", "pars", "part", "partons", "partez", "partent"],
  finir: ["finis", "finis", "finit", "finissons", "finissez", "finissent"],
};
const AVOIR = PRESENT_FORMS.avoir;
const ETRE = PRESENT_FORMS["être"];
const PARTICIPLE: Record<string, string> = { chanter: "chanté", jouer: "joué", manger: "mangé", danser: "dansé", avoir: "eu", être: "été", finir: "fini", aller: "allé", partir: "parti" };
const WITH_ETRE = ["aller", "partir"];
/** Les passés composés justes pour une personne : avoir pour presque tous, être pour aller et partir, au masculin. */
const pastFor = (person: number): string[] =>
  Object.keys(PARTICIPLE).map((verb) => (WITH_ETRE.includes(verb) ? `${ETRE[person]} ${PARTICIPLE[verb]}${person >= 3 ? "s" : ""}` : `${AVOIR[person]} ${PARTICIPLE[verb]}`));
const presentFor = (person: number): string[] => Object.values(PRESENT_FORMS).map((forms) => forms[person]);
const subjectPerson = (text: string): number | undefined => {
  const first = text.replace(/^Hier, /u, "").split(/[\s']/u)[0].toLowerCase();
  return first === "j" ? 0 : PERSON[first];
};

// --- L'impératif et le futur ---
const FUTURE_END = ["ai", "as", "a", "ons", "ez", "ont"];
const IMPERATIVE_OF: Record<string, readonly [string, string, string]> = {
  "la porte": ["ferme", "fermons", "fermez"],
  "bien la maîtresse": ["écoute", "écoutons", "écoutez"],
  affaires: ["range", "rangeons", "rangez"],
  "le tableau": ["regarde", "regardons", "regardez"],
};
const IMPERATIVE_PERSON: Record<string, number> = { tu: 0, nous: 1, vous: 2 };
const FUTURE_GAP_TABLE: readonly Row[] = [
  ["Demain, je ___ une chanson.", "chanterai", ["chante", "chanteras"]],
  ["Demain, tu ___ avec Awa.", "danseras", ["danses", "danserai"]],
  ["Demain, Moussa ___ au ballon.", "jouera", ["joue", "joueront"]],
  ["Demain, nous ___ du riz.", "mangerons", ["mangeons", "mangerez"]],
  ["Demain, vous ___ en classe.", "chanterez", ["chantez", "chanteront"]],
  ["Demain, ils ___ dans la cour.", "danseront", ["dansent", "danserons"]],
  ["Demain, je ___ mes affaires.", "rangerai", ["range", "rangeras"]],
  ["Demain, nous ___ la maîtresse.", "écouterons", ["écoutons", "écouterez"]],
  ["Demain, tu ___ le tableau.", "regarderas", ["regardes", "regarderai"]],
  ["Demain, Fatou ___ la porte.", "fermera", ["ferme", "fermeront"]],
  ["Demain, vous ___ au ballon.", "jouerez", ["jouez", "joueras"]],
  ["Demain, ils ___ du poisson.", "mangeront", ["mangent", "mangerons"]],
];
const SENTENCE_KIND_OF: Record<string, string> = {
  "Ferme la porte.": "Impérative",
  "Il pleut.": "Impersonnelle",
  "Ne pas marcher sur les fleurs.": "Infinitive",
  "Écoute bien.": "Impérative",
  "Il neige.": "Impersonnelle",
  "Ne pas courir.": "Infinitive",
  "Range tes affaires.": "Impérative",
  "Il fait chaud.": "Impersonnelle",
  "Ne pas jeter de papiers par terre.": "Infinitive",
  "Regardez le tableau.": "Impérative",
  "Il faut écouter la maîtresse.": "Impersonnelle",
  "Ne pas parler en classe.": "Infinitive",
};
const IMPERATIVE_ORDER_SET = [
  "Ferme la porte.",
  "Écoute bien la maîtresse.",
  "Range tes affaires.",
  "Regarde le tableau.",
  "Mange ton riz.",
  "Lave tes mains.",
  "Fermons la porte.",
  "Écoutons la maîtresse.",
  "Rangeons nos affaires.",
  "Regardez le tableau.",
  "Fermez la porte.",
  "Écoutez la maîtresse.",
];

// --- Le dictionnaire ---
const isBefore = (a: string, b: string) => fold(a) < fold(b);
const LOGIC_TABLE: readonly Row[] = [
  ["Il pleut, ___ je prends mon parapluie.", "donc", ["mais", "parce que"]],
  ["Je prends mon parapluie ___ il pleut.", "parce que", ["mais", "donc"]],
  ["Awa veut jouer, ___ elle doit travailler.", "mais", ["donc", "parce que"]],
  ["Moussa est content ___ il a gagné.", "parce que", ["mais", "donc"]],
  ["Il a faim, ___ il mange.", "donc", ["mais", "parce que"]],
  ["J'aime le riz, ___ je n'aime pas le poisson.", "mais", ["donc", "parce que"]],
  ["Fatou est fatiguée ___ elle a couru.", "parce que", ["mais", "donc"]],
  ["Il fait chaud, ___ nous buvons de l'eau.", "donc", ["mais", "parce que"]],
  ["Je veux sortir, ___ il pleut.", "mais", ["donc", "parce que"]],
  ["Cheikh pleure ___ il est tombé.", "parce que", ["mais", "donc"]],
  ["Elle est malade, ___ elle reste à la maison.", "donc", ["mais", "parce que"]],
  ["Tu es petit, ___ tu cours vite.", "mais", ["donc", "parce que"]],
];
const TIME_TABLE: readonly Row[] = [
  ["D'abord, Awa lave le riz. ___, elle le cuit. Enfin, elle le sert.", "Ensuite", ["Mais", "Donc"]],
  ["___, je me lève. Ensuite, je me lave. Enfin, je pars.", "D'abord", ["Mais", "Donc"]],
  ["D'abord, il ouvre la porte. Ensuite, il entre. ___, il s'assoit.", "Enfin", ["Mais", "Donc"]],
  ["Il ferme la porte, ___ il part.", "puis", ["mais", "donc"]],
  ["D'abord, Moussa prend son cahier. ___, il écrit. Enfin, il le range.", "Ensuite", ["Mais", "Donc"]],
  ["___, Fatou se réveille. Ensuite, elle mange. Enfin, elle va à l'école.", "D'abord", ["Mais", "Donc"]],
  ["D'abord, nous pesons le riz. Ensuite, nous le lavons. ___, nous le cuisons.", "Enfin", ["Mais", "Donc"]],
  ["Elle lave le linge, ___ elle l'étend.", "puis", ["mais", "donc"]],
];
const CONNECTORS: Record<string, string> = {
  "d'abord": "Au début",
  enfin: "À la fin",
  mais: "Oppose deux idées",
  "parce que": "Donne la raison",
  donc: "Donne le résultat",
};
const SCHOOL = ["lire", "écrire", "copier", "réciter", "dessiner", "apprendre"];
const MARKET = ["vendre", "acheter", "payer", "peser", "emballer", "livrer"];

const capital = (word: string) => `${word[0].toUpperCase()}${word.slice(1)}`;

const CHECKS: Record<string, Check> = {
  // --- La phrase ---
  "ce1-fr-phrase-verbe": (exo) => {
    const text = quoted(exo.prompt);
    const verb = text ? VERB_OF[text] : undefined;
    if (!verb) return `phrase inconnue : ${exo.prompt}`;
    return all(
      ok(rightOption(exo) === verb, `le verbe est « ${verb} », le gabarit dit « ${rightOption(exo)} »`),
      ok(wrongOf(exo).length === 2 && wrongOf(exo).every((option) => option !== verb && words(text as string).includes(option)), `mauvais choix ${wrongOf(exo).join(" | ")}`),
    );
  },
  "ce1-fr-phrase-sujet": (exo) => {
    const text = quoted(exo.prompt);
    const subject = text ? SUBJECT_OF[text] : undefined;
    if (!subject) return `phrase inconnue : ${exo.prompt}`;
    return all(
      ok(rightOption(exo) === subject, `le sujet est « ${subject} », le gabarit dit « ${rightOption(exo)} »`),
      ok(wrongOf(exo).length === 2 && wrongOf(exo).every((option) => option !== subject && words(text as string).includes(option)), `mauvais choix ${wrongOf(exo).join(" | ")}`),
    );
  },
  "ce1-fr-phrase-ecrite": (exo) => {
    const right = rightOption(exo);
    if (!PHRASE_ORDER_SET.includes(right)) return `phrase inconnue : ${right}`;
    return ok(same(wrongOf(exo), [`${right[0].toLowerCase()}${right.slice(1)}`, right.slice(0, -1)]), `mauvais choix ${wrongOf(exo).join(" | ")}`);
  },
  "ce1-fr-phrase-groupe": checkGapTable(GROUP_TABLE),
  "ce1-fr-phrase-glisser": checkSort(["Verbe", "Nom"], (tile) => (VERB_FORMS.includes(tile) ? "Verbe" : ABSTRACT_NOUNS.includes(tile) ? "Nom" : undefined)),
  "ce1-fr-phrase-ordre": checkSteps((s) => sentenceOk(s, PHRASE_ORDER_SET), "phrase"),
  "ce1-fr-phrase-relier": checkLinks((left, right) => GRAMMAR_TERMS[left] === right),

  // --- Le nom, l'article et l'adjectif ---
  "ce1-fr-nom-article": (exo) => {
    const noun = quoted(exo.prompt);
    const article = noun ? ARTICLE_OF[noun] : undefined;
    if (!article) return `nom inconnu : ${exo.prompt}`;
    return all(
      ok(rightOption(exo) === article, `devant « ${noun} » on met « ${article} », le gabarit dit « ${rightOption(exo)} »`),
      ok(same(wrongOf(exo), ["le", "la", "les"].filter((a) => a !== article)), `mauvais choix ${wrongOf(exo).join(" | ")}`),
    );
  },
  "ce1-fr-nom-accord": checkGapTable(AGREE_TABLE),
  "ce1-fr-nom-genre": checkSort(["Masculin", "Féminin"], (tile) => (MASCULINE_NOUNS.includes(tile) ? "Masculin" : FEMININE_NOUNS.includes(tile) ? "Féminin" : undefined)),
  "ce1-fr-nom-ordre": checkSteps((s) => sentenceOk(s, NOM_ORDER_SET), "phrase"),
  "ce1-fr-nom-relier": checkLinks((left, right) => FEMININE_OF[left] === right),
  "ce1-fr-nom-ecrire": (exo) => {
    const masculine = quoted(exo.prompt);
    const feminine = masculine ? FEMININE_OF[masculine] : undefined;
    if (!feminine) return `adjectif inconnu : ${exo.prompt}`;
    return ok(acceptedOf(exo).length === 1 && acceptedOf(exo)[0] === feminine && exo.answerKey === feminine, `le féminin est « ${feminine} », le gabarit dit « ${acceptedOf(exo).join(" | ")} »`);
  },

  // --- Le présent et le passé composé ---
  "ce1-fr-present-present": (exo) => {
    const person = subjectPerson(textOf(exo));
    if (person === undefined) return `sujet inconnu : ${textOf(exo)}`;
    return all(
      ok(presentFor(person).includes(blankOf(exo).answer), `« ${blankOf(exo).answer} » n'est pas une forme de la personne ${person}`),
      ok(blankOf(exo).options.filter((option) => option !== blankOf(exo).answer).every((option) => !presentFor(person).includes(option)), `un mauvais choix est juste aussi : ${blankOf(exo).options.join(" | ")}`),
    );
  },
  "ce1-fr-present-passe": (exo) => {
    const person = subjectPerson(textOf(exo));
    if (person === undefined) return `sujet inconnu : ${textOf(exo)}`;
    return all(
      ok(pastFor(person).includes(blankOf(exo).answer), `« ${blankOf(exo).answer} » n'est pas un passé composé juste de la personne ${person}`),
      ok(blankOf(exo).options.filter((option) => option !== blankOf(exo).answer).every((option) => !pastFor(person).includes(option)), `un mauvais choix est juste aussi : ${blankOf(exo).options.join(" | ")}`),
    );
  },
  "ce1-fr-present-temps": (exo) => {
    const past = /passé composé|déjà faite|« Awa a chanté »|« Nous avons mangé »/u.test(exo.prompt);
    const now = /présent|en ce moment|« Awa chante »|« Nous mangeons »/u.test(exo.prompt);
    if (past === now) return `temps ambigu : ${exo.prompt}`;
    const right = rightOption(exo);
    return all(
      ok(past ? right === "hier" : ["maintenant", "aujourd'hui"].includes(right), `la bonne réponse « ${right} » ne va pas avec ${past ? "le passé" : "le présent"}`),
      ok(wrongOf(exo).length === 2 && (past ? !wrongOf(exo).includes("hier") : wrongOf(exo).includes("hier") && wrongOf(exo).includes("demain")), `mauvais choix ${wrongOf(exo).join(" | ")}`),
    );
  },
  "ce1-fr-present-reconnaitre": (exo) => {
    const past = exo.prompt.includes("passé composé");
    const startsPast = (sentence: string) => sentence.startsWith("Hier,");
    return all(
      ok(startsPast(rightOption(exo)) === past, `la bonne phrase « ${rightOption(exo)} » n'a pas le bon temps`),
      ok(wrongOf(exo).length === 2 && wrongOf(exo).every((sentence) => startsPast(sentence) !== past), `mauvais choix ${wrongOf(exo).join(" | ")}`),
    );
  },
  "ce1-fr-present-glisser": checkSort(["Présent", "Passé composé"], (tile) =>
    ["je chante", "tu danses", "il mange", "nous jouons", "vous finissez", "ils vont", "elle a", "nous sommes"].includes(tile)
      ? "Présent"
      : ["j'ai chanté", "tu as dansé", "il a mangé", "nous avons joué", "vous avez fini", "ils sont allés", "elle a eu", "nous avons été"].includes(tile)
        ? "Passé composé"
        : undefined,
  ),
  "ce1-fr-present-relier": checkLinks((left, right, prompt) => {
    const verb = /du verbe (\p{L}+)\.$/u.exec(prompt)?.[1];
    const person = PERSON[left];
    return verb !== undefined && person !== undefined && PRESENT_FORMS[verb]?.[person] === right;
  }),
  "ce1-fr-present-ordre": checkSteps(
    (s) =>
      sentenceOk(s, [
        "Awa mange du riz.",
        "Nous jouons au ballon.",
        "Awa a chanté.",
        "Nous avons mangé du riz.",
        "Tu as dansé.",
        "Moussa a joué dehors.",
        "Ils finissent leur travail.",
        "Moussa est allé au marché.",
        "Vous avez chanté.",
        "Ils sont partis tôt.",
        "Nous avons fini la leçon.",
        "Elle a mangé une mangue.",
      ]),
    "phrase",
  ),
  "ce1-fr-present-ecrire": (exo) => {
    const present = /^Conjugue (\p{L}+) au présent avec « (\p{L}+) »\.$/u.exec(exo.prompt);
    const past = /^Écris le passé composé d(?:e |')(\p{L}+) avec « (\p{L}+) »\.$/u.exec(exo.prompt);
    const match = present ?? past;
    if (!match) return `énoncé inconnu : ${exo.prompt}`;
    const verb = match[1];
    const person = PERSON[match[2]];
    const want = present ? PRESENT_FORMS[verb]?.[person] : `${AVOIR[person]} ${PARTICIPLE[verb]}`;
    return ok(same(acceptedOf(exo), writtenWith(match[2], want)) && acceptedOf(exo)[0] === want && exo.answerKey === want, `la forme juste est « ${want} », le gabarit dit « ${acceptedOf(exo).join(" | ")} »`);
  },

  // --- L'impératif et le futur ---
  "ce1-fr-imperatif-imperatif": (exo) => {
    const match = /^\((tu|nous|vous)\) ___ (.+) !$/u.exec(textOf(exo));
    if (!match) return `phrase inconnue : ${textOf(exo)}`;
    const key = Object.keys(IMPERATIVE_OF).find((cue) => match[2].includes(cue));
    if (!key) return `verbe inconnu : ${textOf(exo)}`;
    const forms = IMPERATIVE_OF[key];
    const want = capital(forms[IMPERATIVE_PERSON[match[1]]]);
    const allowedWrong = [...forms.map(capital), capital(`${forms[0]}s`)];
    return all(
      ok(blankOf(exo).answer === want, `l'ordre juste est « ${want} », le gabarit dit « ${blankOf(exo).answer} »`),
      ok(blankOf(exo).options.length === 3 && blankOf(exo).options.filter((option) => option !== want).every((option) => allowedWrong.includes(option)), `choix ${blankOf(exo).options.join(" | ")}`),
    );
  },
  "ce1-fr-imperatif-futur": checkGapTable(FUTURE_GAP_TABLE),
  "ce1-fr-imperatif-sorte": (exo) => {
    const text = quoted(exo.prompt);
    const kind = text ? SENTENCE_KIND_OF[text] : undefined;
    if (!kind) return `phrase inconnue : ${exo.prompt}`;
    return all(ok(rightOption(exo) === kind, `la sorte est « ${kind} », le gabarit dit « ${rightOption(exo)} »`), ok(same(optionsOf(exo), ["Impérative", "Impersonnelle", "Infinitive"]), `choix ${optionsOf(exo).join(" | ")}`));
  },
  "ce1-fr-imperatif-temps": (exo) =>
    all(
      ok(rightOption(exo).startsWith("Demain,"), `la bonne phrase « ${rightOption(exo)} » ne parle pas de demain`),
      ok(wrongOf(exo).length === 2 && wrongOf(exo).every((sentence) => sentence.startsWith("Hier,") || sentence.startsWith("Maintenant,")), `mauvais choix ${wrongOf(exo).join(" | ")}`),
    ),
  "ce1-fr-imperatif-glisser": checkSort(["Impératif", "Futur"], (tile) =>
    tile.endsWith(" !") ? "Impératif" : ["chantera", "mangeront", "danserons", "fermeras", "écouterez", "rangerai", "regardera"].includes(tile) ? "Futur" : undefined,
  ),
  "ce1-fr-imperatif-ordre": checkSteps((s) => sentenceOk(s, IMPERATIVE_ORDER_SET), "phrase"),
  "ce1-fr-imperatif-relier": checkLinks((left, right, prompt) => {
    const verb = /du verbe (\p{L}+) au futur\.$/u.exec(prompt)?.[1];
    const person = PERSON[left];
    return verb !== undefined && person !== undefined && right === `${verb}${FUTURE_END[person]}`;
  }),
  "ce1-fr-imperatif-ecrire": (exo) => {
    const future = /^Écris (\p{L}+) au futur avec « (\p{L}+) »\.$/u.exec(exo.prompt);
    // L'impératif n'a pas de pronom : l'énoncé dit d'écrire le verbe seul, et seul le verbe est admis.
    const imperative = /^Écris l'impératif d(?:e |')(\p{L}+) avec « (\p{L}+) »\. Écris seulement le verbe\.$/u.exec(exo.prompt);
    const match = future ?? imperative;
    if (!match) return `énoncé inconnu : ${exo.prompt}`;
    const verb = match[1];
    const want = future ? `${verb}${FUTURE_END[PERSON[match[2]]]}` : verb === "manger" ? "mangeons" : `${verb.slice(0, -2)}${match[2] === "nous" ? "ons" : "ez"}`;
    const accepted = future ? writtenWith(match[2], want) : [want];
    return ok(same(acceptedOf(exo), accepted) && acceptedOf(exo)[0] === want && exo.answerKey === want, `la forme juste est « ${want} », le gabarit dit « ${acceptedOf(exo).join(" | ")} »`);
  },

  // --- Le dictionnaire ---
  "ce1-fr-dico-ordre": checkSteps((s) => s.length >= 3 && s.every((word, i) => i === 0 || isBefore(s[i - 1], word)), "ordre alphabétique"),
  "ce1-fr-dico-premier": (exo) =>
    ok(wrongOf(exo).length === 2 && wrongOf(exo).every((word) => isBefore(rightOption(exo), word)), `la bonne réponse « ${rightOption(exo)} » n'est pas la première : ${optionsOf(exo).join(" | ")}`),
  "ce1-fr-dico-apres": (exo) => {
    const match = /^Quel mot vient (après|avant) « (\p{L}+) » dans le dictionnaire \?$/u.exec(exo.prompt);
    if (!match) return `question inconnue : ${exo.prompt}`;
    const wantAfter = match[1] === "après";
    const onSide = (word: string) => (wantAfter ? isBefore(match[2], word) : isBefore(word, match[2]));
    return all(
      ok(onSide(rightOption(exo)), `« ${rightOption(exo)} » n'est pas ${match[1]} « ${match[2]} »`),
      ok(wrongOf(exo).length === 2 && wrongOf(exo).every((word) => !onSide(word)), `un mauvais choix est du bon côté : ${wrongOf(exo).join(" | ")}`),
    );
  },
  "ce1-fr-dico-temps": checkGapTable(TIME_TABLE),
  "ce1-fr-dico-logique": checkGapTable(LOGIC_TABLE),
  "ce1-fr-dico-recit": checkSteps((s) => s.length === 3 && s[0].startsWith("D'abord, ") && s[1].startsWith("Ensuite, ") && s[2].startsWith("Enfin, "), "histoire"),
  "ce1-fr-dico-relier": checkLinks((left, right) => CONNECTORS[left] === right),
  "ce1-fr-dico-theme": checkSort(["École", "Marché"], (tile) => (SCHOOL.includes(tile) ? "École" : MARKET.includes(tile) ? "Marché" : undefined)),
};

const KINDS = Object.keys(CHECKS) as GameKind[];
const TOPIC_KINDS: Record<string, string[]> = {
  "fr-ce1-phrase": ["ce1-fr-phrase-verbe", "ce1-fr-phrase-sujet", "ce1-fr-phrase-ecrite", "ce1-fr-phrase-groupe", "ce1-fr-phrase-glisser", "ce1-fr-phrase-ordre", "ce1-fr-phrase-relier"],
  "fr-ce1-nom-adjectif": ["ce1-fr-nom-article", "ce1-fr-nom-accord", "ce1-fr-nom-genre", "ce1-fr-nom-ordre", "ce1-fr-nom-relier", "ce1-fr-nom-ecrire"],
  "fr-ce1-present-passe": ["ce1-fr-present-present", "ce1-fr-present-passe", "ce1-fr-present-temps", "ce1-fr-present-reconnaitre", "ce1-fr-present-glisser", "ce1-fr-present-relier", "ce1-fr-present-ordre", "ce1-fr-present-ecrire"],
  "fr-ce1-imperatif-futur": ["ce1-fr-imperatif-imperatif", "ce1-fr-imperatif-futur", "ce1-fr-imperatif-sorte", "ce1-fr-imperatif-temps", "ce1-fr-imperatif-glisser", "ce1-fr-imperatif-ordre", "ce1-fr-imperatif-relier", "ce1-fr-imperatif-ecrire"],
  "fr-ce1-dictionnaire": ["ce1-fr-dico-ordre", "ce1-fr-dico-premier", "ce1-fr-dico-apres", "ce1-fr-dico-temps", "ce1-fr-dico-logique", "ce1-fr-dico-recit", "ce1-fr-dico-relier", "ce1-fr-dico-theme"],
};
const TOPIC_KEYS = Object.keys(TOPIC_KINDS);
const entryOf = (key: string) => allProgrammeEntries().find((entry) => entry.topic.key === key)!;
const topicOf = (key: string) => entryOf(key).topic;

describe("chaque gabarit de français du CE1 a sa vérification", () => {
  it("couvre exactement les trente-sept gabarits, tous rangés dans une thématique", () => {
    expect(KINDS).toHaveLength(37);
    expect(Object.values(TOPIC_KINDS).flat().sort()).toEqual([...KINDS].sort());
    for (const kind of KINDS) expect(Object.keys(GAME_KINDS), kind).toContain(kind);
  });
});

describe("les gabarits de français du CE1 recalculent juste, depuis des tables et des règles écrites à part", () => {
  for (const kind of KINDS) {
    it(`${kind} : la bonne réponse se lit dans la règle, à tous les niveaux`, () => {
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

  it("voient aussi un énoncé abîmé : un « s » à l'impératif de « tu », un participe sans « s » avec « ils », un mot du mauvais côté", () => {
    const wrong = (text: string, answer: string, options: string[]) => ({ type: "fill-blank", prompt: "Complète la phrase.", answerKey: answer, hints: [], payload: { text, blanks: [{ options, answer }] } }) as Exo;
    expect(CHECKS["ce1-fr-imperatif-imperatif"](wrong("(tu) ___ la porte !", "Fermes", ["Fermes", "Ferme", "Fermez"]))).not.toBeNull();
    expect(CHECKS["ce1-fr-present-passe"](wrong("Hier, ils ___ chez leur tante.", "sont allé", ["sont allé", "ont allés", "sommes allés"]))).not.toBeNull();
    expect(CHECKS["ce1-fr-present-present"](wrong("Nous ___ du riz.", "mange", ["mange", "mangeons", "mangez"]))).not.toBeNull();
    const after = { type: "qcm", prompt: "Quel mot vient après « Cheikh » dans le dictionnaire ?", answerKey: "Awa", hints: [], payload: { options: ["Awa", "Moussa", "Abdou"], correctIndex: 0 } } as Exo;
    expect(CHECKS["ce1-fr-dico-apres"](after)).not.toBeNull();
    expect(CHECKS["ce1-fr-dico-ordre"]({ ...after, payload: { correctSequence: ["Fatou", "Awa", "Omar"] } })).not.toBeNull();
  });
});

// ===========================================================================
// LES RÈGLES COMMUNES
// ===========================================================================

describe("tous les gabarits de français du CE1", () => {
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

  it("n'écrivent aucun émoji, ni dans un énoncé, ni sur une tuile, ni dans un indice, et aucun U+FE0F", () => {
    for (const { kind, exo } of exos) {
      expect(/\p{Extended_Pictographic}/u.test(exo.prompt), `${kind} : ${exo.prompt}`).toBe(false);
      for (const text of texts(exo)) {
        expect(text.includes("\uFE0F"), `${kind} : « ${text} »`).toBe(false);
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
      if (exo.payload.blanks) {
        const { options, answer } = blankOf(exo);
        expect(new Set(options).size, `${kind} : ${textOf(exo)}`).toBe(options.length);
        expect(options.filter((option) => option === answer), `${kind} : ${textOf(exo)}`).toHaveLength(1);
        expect(options.length, `${kind} : ${textOf(exo)}`).toBe(3);
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
      const forbidden = new Set(
        answers.flatMap((answer) =>
          fold(answer)
            .split(/[^a-z]+/)
            .filter((word) => word.length >= 4),
        ),
      );
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

  it("ne mettent jamais une étiquette de glissé ou un mot de choix d'un mot avec un article en tête", () => {
    for (const { kind, exo } of exos) {
      const tiles = [...(exo.payload.items ? itemsOf(exo).map((item) => item.text) : []), ...(exo.payload.options && !/\s/u.test(rightOption(exo)) ? optionsOf(exo) : [])];
      for (const text of tiles) expect(text, `${kind} : « ${text} »`).not.toMatch(/^(?:le|la|les|l'|un|une|des|du|de la|de l') /iu);
    }
  });
});

// ===========================================================================
// LES THÉMATIQUES DU PROGRAMME
// ===========================================================================

describe("les cinq thématiques de français du CE1", () => {
  it("remplissent les dix places du palier, avec des jeux connus, sans appeler le modèle", () => {
    for (const key of TOPIC_KEYS) {
      const specs = topicOf(key).games ?? [];
      expect(specs.reduce((sum, spec) => sum + spec.count, 0), key).toBe(PALIER_SIZE);
      expect([...specs.map((spec) => spec.kind as string)].sort(), key).toEqual([...TOPIC_KINDS[key]].sort());
      for (const spec of specs) {
        expect(Object.keys(GAME_KINDS), `${key} : ${spec.kind}`).toContain(spec.kind);
        expect(spec.vocabulary, `${key} : ${spec.kind}`).toBeUndefined();
      }
      expect(topicUsesModel(key), key).toBe(false);
    }
  });

  it("sont celles du CE1, à quatre paliers, et gardent leur clé", () => {
    for (const key of TOPIC_KEYS) {
      expect(entryOf(key).klass, key).toBe("CE1");
      expect(topicOf(key).palierCount, key).toBeUndefined();
    }
    expect(TOPIC_KEYS).toHaveLength(5);
  });

  it("fabriquent des paliers entiers, de dix exercices, qui passent le contrôleur et la règle, aux quatre paliers", () => {
    for (const key of TOPIC_KEYS) {
      for (let n = 0; n < 30; n++) {
        for (const palierIndex of [1, 2, 3, 4]) {
          const games = generateGames(topicOf(key).games ?? [], { klass: "CE1", palierIndex, palierCount: 4, seed: `${key}:${n}:${palierIndex}` });
          expect(games, `${key} palier ${palierIndex}`).toHaveLength(PALIER_SIZE);
          const questions = games.map((game) => `${game.prompt}|${JSON.stringify(game.payload)}`);
          expect(new Set(questions).size, `${key} #${n} palier ${palierIndex}`).toBe(questions.length);
          expect(new Set(games.map((game) => game.type)).size, `${key} palier ${palierIndex}`).toBeGreaterThanOrEqual(4);
          for (const game of games) {
            const defects = auditExercise({ type: game.type, prompt: game.prompt, payload: game.payload, answerKey: game.answerKey, hints: game.hints, class: "CE1", subject: "Français" });
            expect(defects, `${key} palier ${palierIndex} : ${game.prompt}`).toEqual([]);
            const kind = (game.payload.game as { kind: string }).kind;
            expect(CHECKS[kind](game as unknown as Exo), `${key} palier ${palierIndex} ${kind} : ${game.prompt}`).toBeNull();
          }
        }
      }
    }
  });

  it("ne posent pas, dans un palier, deux phrases à trou qui se complètent par le même mot", () => {
    for (const key of TOPIC_KEYS) {
      for (let n = 0; n < 40; n++) {
        for (const palierIndex of [1, 2, 3, 4]) {
          const games = generateGames(topicOf(key).games ?? [], { klass: "CE1", palierIndex, palierCount: 4, seed: `gap:${key}:${n}:${palierIndex}` });
          const answers = games.filter((game) => game.type === "fill-blank").map((game) => (game.payload.blanks as { answer: string }[])[0].answer);
          expect(new Set(answers).size, `${key} palier ${palierIndex} : ${answers.join(" ")}`).toBe(answers.length);
        }
      }
    }
  });

  it("ne posent pas, dans un palier, deux fois la même question d'un même gabarit", () => {
    for (const key of TOPIC_KEYS) {
      const twice = (topicOf(key).games ?? []).filter((spec) => spec.count >= 2).map((spec) => spec.kind as string);
      for (let n = 0; n < 40; n++) {
        for (const palierIndex of [1, 2, 3, 4]) {
          const games = generateGames(topicOf(key).games ?? [], { klass: "CE1", palierIndex, palierCount: 4, seed: `twice:${key}:${n}:${palierIndex}` });
          for (const kind of twice) {
            const mine = games.filter((game) => (game.payload.game as { kind: string }).kind === kind);
            const asked = mine.map((game) => `${game.prompt}|${game.answerKey}|${game.type === "fill-blank" ? String(game.payload.text) : ""}`);
            expect(new Set(asked).size, `${key} palier ${palierIndex} ${kind} : ${asked.join(" | ")}`).toBe(asked.length);
          }
        }
      }
    }
  });

  it("servent toutes les lignes de leurs tableaux : aucune n'est perdue entre les paliers", () => {
    // Le nombre de questions différentes que chaque gabarit pose, sur les quatre paliers de sa thématique et assez de graines.
    const EXPECTED: Record<string, number> = {
      "ce1-fr-phrase-verbe": 12,
      "ce1-fr-phrase-sujet": 12,
      "ce1-fr-phrase-ecrite": 12,
      "ce1-fr-phrase-groupe": 12,
      "ce1-fr-phrase-ordre": 12,
      "ce1-fr-nom-article": 12,
      "ce1-fr-nom-accord": 12,
      "ce1-fr-nom-ordre": 12,
      "ce1-fr-nom-ecrire": 8,
      "ce1-fr-present-present": 16,
      "ce1-fr-present-passe": 16,
      "ce1-fr-present-temps": 8,
      "ce1-fr-present-reconnaitre": 8,
      "ce1-fr-present-ordre": 12,
      "ce1-fr-present-ecrire": 16,
      "ce1-fr-imperatif-imperatif": 12,
      "ce1-fr-imperatif-futur": 12,
      "ce1-fr-imperatif-sorte": 12,
      "ce1-fr-imperatif-temps": 8,
      "ce1-fr-imperatif-ordre": 12,
      "ce1-fr-imperatif-ecrire": 8,
      "ce1-fr-dico-ordre": 12,
      "ce1-fr-dico-premier": 12,
      "ce1-fr-dico-apres": 12,
      "ce1-fr-dico-temps": 8,
      "ce1-fr-dico-logique": 12,
      "ce1-fr-dico-recit": 8,
    };
    const seen: Record<string, Set<string>> = {};
    for (const key of TOPIC_KEYS) {
      for (let n = 0; n < 250; n++) {
        for (const palierIndex of [1, 2, 3, 4]) {
          for (const game of generateGames(topicOf(key).games ?? [], { klass: "CE1", palierIndex, palierCount: 4, seed: `row:${key}:${n}:${palierIndex}` })) {
            const kind = (game.payload.game as { kind: string }).kind;
            if (!EXPECTED[kind]) continue;
            (seen[kind] ??= new Set()).add(`${game.prompt}|${game.answerKey}|${game.type === "fill-blank" ? String(game.payload.text) : ""}`);
          }
        }
      }
    }
    for (const [kind, count] of Object.entries(EXPECTED)) expect(seen[kind]?.size, kind).toBe(count);
  });

  it("ne reposent presque jamais la même question à deux paliers d'une même thématique", () => {
    for (const key of TOPIC_KEYS) {
      let repeated = 0;
      let total = 0;
      for (let n = 0; n < 40; n++) {
        const before = new Set<string>();
        for (const palierIndex of [1, 2, 3, 4]) {
          const games = generateGames(topicOf(key).games ?? [], { klass: "CE1", palierIndex, palierCount: 4, seed: `var:${key}:${n}:${palierIndex}` });
          const here = games.map((game) => `${game.prompt}|${game.type === "fill-blank" ? String(game.payload.text) : ""}|${game.answerKey}`);
          for (const question of here) {
            total += 1;
            if (before.has(question)) repeated += 1;
          }
          here.forEach((question) => before.add(question));
        }
      }
      expect(repeated / total, key).toBeLessThan(0.02);
    }
  });

  it("gardent de quoi servir la démo du site : un gabarit du type de chaque exercice de la banque", () => {
    const typesOf = (key: string) => new Set((topicOf(key).games ?? []).map((spec) => GAME_KINDS[spec.kind].type));
    expect(typesOf("fr-ce1-nom-adjectif").has("drag-drop" as never)).toBe(true);
    expect(typesOf("fr-ce1-present-passe").has("match" as never)).toBe(true);
    expect(typesOf("fr-ce1-dictionnaire").has("order" as never)).toBe(true);
    expect(typesOf("fr-ce1-imperatif-futur").has("short-answer" as never)).toBe(true);
  });

  it("refont chaque exercice raté par le code, sans le modèle", () => {
    for (const key of TOPIC_KEYS) {
      for (const kind of TOPIC_KINDS[key]) {
        const again = regenerateGame({ kind, level: 3 }, "CE1", `reprise:${key}:${kind}`);
        expect(again, kind).not.toBeNull();
        expect(again!.type, kind).toBe(GAME_KINDS[kind as GameKind].type);
      }
    }
  });
});
