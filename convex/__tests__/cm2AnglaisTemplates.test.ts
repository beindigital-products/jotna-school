import { describe, expect, it } from "vitest";
import { defineTemplateTests } from "@/lib/test-support/cm1TestKit";
import type { GameKind } from "../paliers/games";

/**
 * L'ANGLAIS DU CM2 : huit thématiques, quarante-huit gabarits (`cm2AnglaisVerbes.ts`, `cm2AnglaisMots.ts`).
 *
 * Le moteur des vérifications est dans `lib/test-support/cm1TestKit.ts`. Ce fichier ne lit AUCUNE table des sources : il refait, avec ses propres
 * règles et ses propres tables, TOUTES les phrases justes de ces thématiques (was ou were ; did suivi de l'infinitif ; am, is ou are devant going to ;
 * -er, -est, more, most ; les lieux et les chemins ; les questions et leurs réponses ; les petits textes et ce qu'ils disent) et leurs phrases
 * françaises. Un exercice est juste quand sa bonne réponse est dans ce jeu de phrases justes, qu'aucun mauvais choix n'y est, que la phrase française
 * de la consigne est bien celle de la phrase anglaise, et que les paires et les cases sont celles de ces tables.
 */

const KINDS_OF = (prefix: string) => [`${prefix}-phrase`, `${prefix}-trou`, `${prefix}-ecrire`, `${prefix}-ordre`, `${prefix}-relier`, `${prefix}-glisser`];
const TOPIC_KINDS: Record<string, readonly string[]> = {
  "an-cm2-was-were": KINDS_OF("cm2-en-wv"),
  "an-cm2-past-regular": KINDS_OF("cm2-en-pr"),
  "an-cm2-past-irregular": KINDS_OF("cm2-en-pi"),
  "an-cm2-going-to": KINDS_OF("cm2-en-gt"),
  "an-cm2-comparatives": KINDS_OF("cm2-en-cp"),
  "an-cm2-directions": KINDS_OF("cm2-en-dr"),
  "an-cm2-questions": KINDS_OF("cm2-en-qs"),
  "an-cm2-reading": KINDS_OF("cm2-en-rd"),
};
const COUNTS: Record<string, number> = {
  "an-cm2-was-were": 3,
  "an-cm2-past-regular": 4,
  "an-cm2-past-irregular": 4,
  "an-cm2-going-to": 3,
  "an-cm2-comparatives": 4,
  "an-cm2-directions": 3,
  "an-cm2-questions": 3,
  "an-cm2-reading": 4,
};

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

// ===========================================================================
// LE JEU DE PHRASES JUSTES, REFAIT À PART
// ===========================================================================

/** Toutes les phrases et questions justes. */
const VALID = new Set<string>();
/** Une phrase anglaise juste et les phrases françaises qui la disent. */
const FR = new Map<string, Set<string>>();
/** Une phrase et sa négation. */
const NEG = new Map<string, string>();
/** Une question et ses deux réponses courtes. */
const REPLY = new Map<string, { yes: string; no: string }>();
/** Les paires de mots justes : « gauche|droite ». */
const GLOSS = new Set<string>();

const sp = (...parts: string[]) => parts.filter((part) => part !== "").join(" ");
const cap = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
const add = (en: string) => VALID.add(en);
const addFr = (en: string, fr: string) => {
  VALID.add(en);
  const set = FR.get(en) ?? new Set<string>();
  set.add(fr);
  FR.set(en, set);
};
const gloss = (left: string, right: string) => GLOSS.add(`${left}|${right}`);
const frOf = (en: string) => FR.get(en) ?? new Set<string>();
const WAS_PRON = ["I", "he", "she", "it"];
const wasOf = (pron: string) => (WAS_PRON.includes(pron) ? "was" : "were");
const nowOf = (pron: string) => (pron === "I" ? "am" : ["he", "she", "it"].includes(pron) ? "is" : "are");

// ----- hier : was et were
const WV_SUBJ: [string, string, string, string][] = [
  ["I", "I", "you", "J'étais"],
  ["You", "you", "I", "Tu étais"],
  ["He", "he", "he", "Il était"],
  ["She", "she", "she", "Elle était"],
  ["It", "it", "it", "Il faisait"],
  ["We", "we", "we", "Nous étions"],
  ["They", "they", "they", "Ils étaient"],
  ["Awa", "Awa", "she", "Awa était"],
  ["Moussa", "Moussa", "he", "Moussa était"],
  ["Awa and Moussa", "Awa and Moussa", "they", "Awa et Moussa étaient"],
  ["Moussa and Awa", "Moussa and Awa", "they", "Moussa et Awa étaient"],
  ["My friends", "my friends", "they", "Mes amis étaient"],
];
const WV_SINGULAR = ["I", "He", "She", "It", "Awa", "Moussa"];
const WV_PLACE: [string, string][] = [
  ["at home", "à la maison"],
  ["at school", "à l'école"],
  ["at the market", "au marché"],
  ["in the garden", "dans le jardin"],
  ["at the mosque", "à la mosquée"],
  ["in the street", "dans la rue"],
];
const WV_WEATHER: [string, string][] = [
  ["hot", "chaud"],
  ["cold", "froid"],
];
const WV_TIME: [string, string][] = [
  ["yesterday", "hier"],
  ["last night", "hier soir"],
  ["last week", "la semaine dernière"],
  ["last Sunday", "dimanche dernier"],
];
WV_SUBJ.forEach(([t, q, ans, fr]) => {
  const be = WV_SINGULAR.includes(t) ? "was" : "were";
  [...WV_PLACE, ...WV_WEATHER].forEach(([comp, compFr]) =>
    WV_TIME.forEach(([time, timeFr]) => {
      const pos = `${t} ${be} ${comp} ${time}.`;
      const neg = `${t} ${be} not ${comp} ${time}.`;
      const question = `${cap(be)} ${q} ${comp} ${time}?`;
      const weather = WV_WEATHER.some(([w]) => w === comp);
      if ((t === "It") === weather) addFr(pos, `${fr} ${compFr} ${timeFr}.`);
      else add(pos);
      NEG.set(pos, neg);
      add(neg);
      add(question);
      REPLY.set(question, { yes: `Yes, ${ans} ${wasOf(ans)}.`, no: `No, ${ans} ${wasOf(ans)} not.` });
    }),
  );
});
WV_TIME.forEach(([en, fr]) => gloss(en, fr));
WV_PLACE.forEach(([en, fr]) => gloss(en, fr));

// ----- hier : le passé des verbes réguliers et irréguliers
// base, passé, complément, participe français, complément français, infinitif français, être (m|f|p) ou vide
const PAST_VERB: [string, string, string, string, string, string, string][] = [
  ["play", "played", "football", "joué", "au football", "jouer", ""],
  ["watch", "watched", "television", "regardé", "la télévision", "regarder", ""],
  ["visit", "visited", "the market", "visité", "le marché", "visiter", ""],
  ["walk", "walked", "in the garden", "marché", "dans le jardin", "marcher", ""],
  ["cook", "cooked", "rice", "cuisiné", "du riz", "cuisiner", ""],
  ["help", "helped", "a friend", "aidé", "un ami", "aider", ""],
  ["clean", "cleaned", "the house", "nettoyé", "la maison", "nettoyer", ""],
  ["listen", "listened", "to the radio", "écouté", "la radio", "écouter", ""],
  ["study", "studied", "mathematics", "étudié", "les mathématiques", "étudier", ""],
  ["dance", "danced", "", "dansé", "", "danser", ""],
  ["go", "went", "to the market", "", "au marché", "aller", "allé|allée|allés"],
  ["have", "had", "breakfast", "pris", "le petit déjeuner", "avoir", ""],
  ["see", "saw", "Awa", "vu", "Awa", "voir", ""],
  ["eat", "ate", "rice", "mangé", "du riz", "manger", ""],
  ["drink", "drank", "water", "bu", "de l'eau", "boire", ""],
  ["buy", "bought", "a mango", "acheté", "une mangue", "acheter", ""],
  ["come", "came", "to the party", "", "à la fête", "venir", "venu|venue|venus"],
  ["make", "made", "a cake", "fait", "un gâteau", "faire", ""],
  ["take", "took", "the bus", "pris", "le bus", "prendre", ""],
  ["write", "wrote", "a letter", "écrit", "une lettre", "écrire", ""],
];
// sujet, sujet de question, pronom de réponse, auxiliaire avoir, auxiliaire être (vide si le genre n'est pas connu), genre (0 masculin, 1 féminin, 2 pluriel)
const SUBJ8: [string, string, string, string, string, number][] = [
  ["I", "I", "you", "J'ai", "", 0],
  ["You", "you", "I", "Tu as", "", 0],
  ["He", "he", "he", "Il a", "Il est", 0],
  ["She", "she", "she", "Elle a", "Elle est", 1],
  ["We", "we", "we", "Nous avons", "", 0],
  ["They", "they", "they", "Ils ont", "Ils sont", 2],
  ["Awa", "Awa", "she", "Awa a", "Awa est", 1],
  ["Moussa", "Moussa", "he", "Moussa a", "Moussa est", 0],
];
const PAST_TIME: [string, string][] = [
  ["yesterday", "hier"],
  ["last week", "la semaine dernière"],
  ["two days ago", "il y a deux jours"],
  ["last night", ""],
  ["last Sunday", ""],
];
const PAST_SET = new Set<string>();
const BASES = new Set<string>();
const PASTS = new Set<string>();
PAST_VERB.forEach(([base, past, obj, pp, frObj, inf, etre]) => {
  BASES.add(base);
  PASTS.add(past);
  gloss(base, past);
  gloss(base, inf);
  SUBJ8.forEach(([t, q, ans, av, aux, g]) =>
    PAST_TIME.forEach(([time, timeFr]) => {
      const pos = `${sp(t, past, obj, time)}.`;
      const neg = `${sp(t, "did not", base, obj, time)}.`;
      const question = `${sp("Did", q, base, obj, time)}?`;
      PAST_SET.add(pos);
      NEG.set(pos, neg);
      add(neg);
      add(question);
      REPLY.set(question, { yes: `Yes, ${ans} did.`, no: `No, ${ans} did not.` });
      const parts = etre.split("|");
      const french = etre === "" ? `${av} ${pp}` : aux === "" ? null : `${aux} ${parts[g]}`;
      if (timeFr !== "" && french !== null) addFr(pos, `${sp(french, frObj, timeFr)}.`);
      else add(pos);
    }),
  );
});
PAST_SET.forEach((sentence) => add(sentence));
PAST_TIME.forEach(([en, fr]) => fr !== "" && gloss(en, fr));

// ----- demain : être going to
// base, complément, infinitif français avec son complément
const GT_VERB: [string, string, string][] = [
  ["play", "football", "jouer au football"],
  ["watch", "television", "regarder la télévision"],
  ["visit", "my grandmother", "rendre visite à ma grand-mère"],
  ["cook", "rice", "cuisiner du riz"],
  ["help", "a friend", "aider un ami"],
  ["read", "a book", "lire un livre"],
  ["study", "mathematics", "étudier les mathématiques"],
  ["clean", "the house", "nettoyer la maison"],
  ["eat", "mangoes", "manger des mangues"],
  ["write", "a letter", "écrire une lettre"],
  ["buy", "bread", "acheter du pain"],
  ["listen", "to the radio", "écouter la radio"],
];
const VA_FR = ["Je vais", "Tu vas", "Il va", "Elle va", "Nous allons", "Ils vont", "Awa va", "Moussa va"];
const GT_TIME: [string, string][] = [
  ["tomorrow", "demain"],
  ["tonight", "ce soir"],
  ["next week", "la semaine prochaine"],
  ["next month", "le mois prochain"],
];
const GT_SET = new Set<string>();
SUBJ8.forEach(([t, q, ans], si) => {
  const be = t === "I" ? "am" : ["He", "She", "Awa", "Moussa"].includes(t) ? "is" : "are";
  add(`What ${be} ${q} going to do?`);
  GT_VERB.forEach(([base, obj, inf]) =>
    GT_TIME.forEach(([time, timeFr]) => {
      const pos = `${sp(t, be, "going to", base, obj, time)}.`;
      const neg = `${sp(t, be, "not going to", base, obj, time)}.`;
      const question = `${sp(cap(be), q, "going to", base, obj, time)}?`;
      GT_SET.add(pos);
      addFr(pos, `${sp(VA_FR[si], inf, timeFr)}.`);
      NEG.set(pos, neg);
      add(neg);
      add(question);
      REPLY.set(question, { yes: `Yes, ${ans} ${nowOf(ans)}.`, no: `No, ${ans} ${nowOf(ans)} not.` });
    }),
  );
});
GT_TIME.forEach(([en, fr]) => gloss(en, fr));
GT_VERB.forEach(([base, obj, inf]) => gloss(`${base} ${obj}`, inf));

// ----- comparer
// base, comparatif, superlatif, long ?, français
const CP_ADJ: [string, string, string, boolean, string][] = [
  ["tall", "taller", "the tallest", false, "grand"],
  ["small", "smaller", "the smallest", false, "petit"],
  ["big", "bigger", "the biggest", false, "gros"],
  ["old", "older", "the oldest", false, "vieux"],
  ["fast", "faster", "the fastest", false, "rapide"],
  ["beautiful", "more beautiful", "the most beautiful", true, "beau"],
  ["expensive", "more expensive", "the most expensive", true, "cher"],
  ["good", "better", "the best", false, "bon"],
];
const CP_NAMES = ["Awa", "Modou", "Fatou", "Moussa"];
const CP_THINGS_SUBJ = ["This mango", "This bag", "This house", "This book"];
const CP_THINGS_OBJ = ["the banana", "the hat", "the shop", "the pen"];
const CP_SUBJECTS = [...CP_NAMES, ...CP_THINGS_SUBJ];
const CP_OBJECTS = [...CP_NAMES, ...CP_THINGS_OBJ];
CP_ADJ.forEach(([base, comp, sup, , fr]) => {
  gloss(base, comp);
  gloss(base, sup);
  gloss(base, fr);
  CP_SUBJECTS.forEach((a) => {
    add(`${a} is ${sup}.`);
    CP_OBJECTS.forEach((b) => a !== b && add(`${a} is ${comp} than ${b}.`));
  });
});
const CP_SHORT = new Set(CP_ADJ.filter(([, , , long]) => !long).map(([base]) => base));
const CP_LONG = new Set(CP_ADJ.filter(([, , , long]) => long).map(([base]) => base));
const CP_COMPS = new Set(CP_ADJ.map(([, comp]) => comp));
const CP_SUPS = new Set(CP_ADJ.map(([, , sup]) => sup));

// ----- demander son chemin
// anglais, glose, article, « de » + article
const DR_PLACE: [string, string, string, string][] = [
  ["school", "école", "l'école", "de l'école"],
  ["market", "marché", "le marché", "du marché"],
  ["mosque", "mosquée", "la mosquée", "de la mosquée"],
  ["hospital", "hôpital", "l'hôpital", "de l'hôpital"],
  ["shop", "magasin", "le magasin", "du magasin"],
  ["bank", "banque", "la banque", "de la banque"],
  ["post office", "poste", "la poste", "de la poste"],
  ["bus station", "gare routière", "la gare routière", "de la gare routière"],
];
const DR_ROUTE: [string, string][] = [
  ["Go straight on.", "Va tout droit."],
  ["Turn left.", "Tourne à gauche."],
  ["Turn right.", "Tourne à droite."],
  ["Go straight on and turn left.", "Va tout droit et tourne à gauche."],
  ["Go straight on and turn right.", "Va tout droit et tourne à droite."],
  ["Turn left and go straight on.", "Tourne à gauche et va tout droit."],
  ["Turn right and go straight on.", "Tourne à droite et va tout droit."],
];
const DR_WORD: [string, string][] = [
  ["go straight on", "va tout droit"],
  ["turn left", "tourne à gauche"],
  ["turn right", "tourne à droite"],
  ["next to", "à côté de"],
  ["opposite", "en face de"],
  ["between", "entre"],
];
const ARTICLE_OF = new Map<string, string>();
const DR_DIALOGUES = new Set<string>();
DR_PLACE.forEach(([en, glose, art], i) => {
  ARTICLE_OF.set(art, en);
  gloss(en, glose);
  addFr(`Excuse me, where is the ${en}?`, `Excusez-moi, où est ${art} ?`);
  DR_PLACE.forEach(([bEn, , bArt, bDe], j) => {
    if (i === j) return;
    addFr(`The ${en} is next to the ${bEn}.`, `${cap(art)} est à côté ${bDe}.`);
    addFr(`The ${en} is opposite the ${bEn}.`, `${cap(art)} est en face ${bDe}.`);
    DR_PLACE.forEach(([cEn, , cArt], k) => {
      if (k === i || k === j) return;
      addFr(`The ${en} is between the ${bEn} and the ${cEn}.`, `${cap(art)} est entre ${bArt} et ${cArt}.`);
    });
  });
  DR_ROUTE.slice(3).forEach(([route]) => DR_DIALOGUES.add(`Excuse me, where is the ${en}?|${route}|Thank you.`));
});
DR_ROUTE.forEach(([en, fr]) => addFr(en, fr));
DR_WORD.forEach(([en, fr]) => gloss(en, fr));

// ----- poser des questions
type QsType = "personne" | "lieu" | "moment" | "raison" | "nombre" | "prix" | "chose";
const QS_TYPE_FR: Record<QsType, string> = {
  personne: "une personne",
  lieu: "un lieu",
  moment: "un moment",
  raison: "une raison",
  nombre: "un nombre",
  prix: "un prix",
  chose: "une chose",
};
const QS_WORD: Record<QsType, string> = { personne: "Who", lieu: "Where", moment: "When", raison: "Why", nombre: "How many", prix: "How much", chose: "What" };
const QS_TYPE_OF_WORD: Record<string, QsType> = Object.fromEntries(Object.entries(QS_WORD).map(([type, word]) => [word, type as QsType]));
const QS_TABLE: [QsType, string, string, string][] = [
  ["personne", "Who is he?", "He is my brother.", "Qui est-il ?"],
  ["personne", "Who is she?", "She is my mother.", "Qui est-elle ?"],
  ["personne", "Who is your friend?", "My friend is Awa.", "Qui est ton ami ?"],
  ["personne", "Who is Moussa?", "Moussa is my cousin.", "Qui est Moussa ?"],
  ["lieu", "Where is the school?", "It is next to the market.", "Où est l'école ?"],
  ["lieu", "Where are you?", "I am at home.", "Où es-tu ?"],
  ["lieu", "Where is the bank?", "It is opposite the post office.", "Où est la banque ?"],
  ["lieu", "Where is Awa?", "She is at the mosque.", "Où est Awa ?"],
  ["moment", "When is your birthday?", "It is in May.", "Quand est ton anniversaire ?"],
  ["moment", "When is the party?", "It is on Saturday.", "Quand est la fête ?"],
  ["moment", "When is the market?", "It is on Monday.", "Quand est le marché ?"],
  ["moment", "When is the match?", "It is on Sunday.", "Quand est le match ?"],
  ["raison", "Why are you sad?", "Because I am tired.", "Pourquoi es-tu triste ?"],
  ["raison", "Why are you happy?", "Because it is my birthday.", "Pourquoi es-tu content ?"],
  ["raison", "Why is Moussa tired?", "Because he played football.", "Pourquoi Moussa est-il fatigué ?"],
  ["raison", "Why is Awa happy?", "Because she is at home.", "Pourquoi Awa est-elle contente ?"],
  ["nombre", "How many books have you got?", "I have got five books.", "Combien de livres possèdes-tu ?"],
  ["nombre", "How many pens have you got?", "I have got three pens.", "Combien de stylos possèdes-tu ?"],
  ["nombre", "How many brothers have you got?", "I have got two brothers.", "Combien de frères as-tu ?"],
  ["nombre", "How many sisters have you got?", "I have got one sister.", "Combien de sœurs as-tu ?"],
  ["prix", "How much is it?", "It is five hundred francs.", "Combien ça coûte ?"],
  ["prix", "How much is the book?", "It is two hundred francs.", "Combien coûte le livre ?"],
  ["prix", "How much are the mangoes?", "They are three hundred francs.", "Combien coûtent les mangues ?"],
  ["prix", "How much is the bread?", "It is one hundred francs.", "Combien coûte le pain ?"],
  ["chose", "What is your name?", "My name is Awa.", "Quel est ton nom ?"],
  ["chose", "What is this?", "It is a mango.", "C'est quoi ?"],
];
const QS_TYPE_OF_QUESTION = new Map<string, QsType>();
const QS_TYPE_OF_ANSWER = new Map<string, QsType>();
const QS_ANSWER = new Map<string, string>();
QS_TABLE.forEach(([type, question, answer, fr]) => {
  QS_TYPE_OF_QUESTION.set(question, type);
  QS_TYPE_OF_ANSWER.set(answer, type);
  QS_ANSWER.set(question, answer);
  addFr(question, fr);
  add(answer);
});
const QS_LABEL: Record<QsType, string> = { personne: "Personne", lieu: "Lieu", moment: "Moment", raison: "Raison", nombre: "Nombre", prix: "Prix", chose: "Chose" };
(Object.keys(QS_WORD) as QsType[]).forEach((type) => gloss(QS_WORD[type], QS_LABEL[type]));
const typeFromFr = (text: string) => (Object.keys(QS_TYPE_FR) as QsType[]).find((type) => QS_TYPE_FR[type] === text);
/** Le mot interrogatif qui ouvre une question. */
const wordOfQuestion = (question: string) => (question.startsWith("How ") ? question.split(" ").slice(0, 2).join(" ") : question.split(" ")[0]);

// ----- lire un petit texte
type Reading = {
  text: string;
  qa: [string, string][];
  yes: string[];
  no: string[];
  num: [string, number][];
  pairs: [string, string][];
};
const READING: Reading[] = [
  {
    text: "My name is Awa. I am ten years old. I live in Dakar with my mother and my brother. Every day I go to school.",
    qa: [
      ["Où habite Awa ?", "À Dakar"],
      ["Avec qui Awa habite-t-elle ?", "Avec sa mère et son frère"],
      ["Où Awa va-t-elle chaque jour ?", "À l'école"],
    ],
    yes: ["Awa is ten years old.", "Awa lives in Dakar.", "Awa lives with her mother and her brother.", "Awa goes to school every day."],
    no: ["Awa lives in Thiès.", "Awa goes to the market every day.", "Awa is eleven years old."],
    num: [["Quel âge a Awa ?", 10]],
    pairs: [
      ["Où habite Awa ?", "Dakar"],
      ["Quel âge a Awa ?", "Ten"],
      ["Où Awa va-t-elle chaque jour ?", "School"],
    ],
  },
  {
    text: "Moussa is eleven. He likes football. On Saturday he plays football with his friends. After the game, he drinks water and eats a mango.",
    qa: [
      ["Que fait Moussa le samedi ?", "Il joue au football"],
      ["Qu'est-ce que Moussa aime ?", "Le football"],
      ["Que boit Moussa après le match ?", "De l'eau"],
    ],
    yes: ["Moussa is eleven.", "Moussa likes football.", "Moussa plays football on Saturday.", "Moussa eats a mango after the game."],
    no: ["Moussa likes mathematics.", "Moussa drinks milk after the game.", "Moussa is ten years old."],
    num: [["Quel âge a Moussa ?", 11]],
    pairs: [
      ["Quel âge a Moussa ?", "Eleven"],
      ["Quel jour joue-t-il au football ?", "Saturday"],
      ["Que mange-t-il après le match ?", "A mango"],
    ],
  },
  {
    text: "Fatou goes to the market with her mother. She buys three mangoes and two kilos of rice. The mangoes cost five hundred francs. Fatou is happy.",
    qa: [
      ["Où va Fatou ?", "Au marché"],
      ["Combien de mangues Fatou achète-t-elle ?", "Trois"],
      ["Combien coûtent les mangues ?", "Cinq cents francs"],
    ],
    yes: ["Fatou goes to the market with her mother.", "Fatou buys three mangoes.", "Fatou buys two kilos of rice.", "Fatou is happy."],
    no: ["Fatou buys five mangoes.", "Fatou is sad.", "Fatou goes to school with her mother."],
    num: [
      ["Combien de mangues Fatou achète-t-elle ?", 3],
      ["Combien de kilos de riz Fatou achète-t-elle ?", 2],
      ["Combien coûtent les mangues, en francs ?", 500],
    ],
    pairs: [
      ["Où va Fatou ?", "Market"],
      ["Avec qui va-t-elle ?", "Mother"],
      ["Que prend-elle en plus du riz ?", "Mangoes"],
    ],
  },
  {
    text: "Last Sunday we visited my grandmother. She cooked rice and fish. We ate in the garden. Then we played football.",
    qa: [
      ["Quand ont-ils rendu visite à la grand-mère ?", "Dimanche dernier"],
      ["Qu'a cuisiné la grand-mère ?", "Du riz et du poisson"],
      ["Où ont-ils mangé ?", "Dans le jardin"],
    ],
    yes: ["We visited my grandmother.", "My grandmother cooked rice and fish.", "We ate in the garden.", "We played football."],
    no: ["We ate in the house.", "My grandmother cooked bread and eggs.", "We visited my grandmother last night."],
    num: [],
    pairs: [
      ["Quel jour ont-ils rendu visite à la grand-mère ?", "Sunday"],
      ["Qui a cuisiné ?", "Grandmother"],
      ["Où ont-ils mangé ?", "Garden"],
    ],
  },
  {
    text: "The school is next to the market. The bank is opposite the school. The hospital is next to the bank.",
    qa: [
      ["Qu'est-ce qui est à côté du marché ?", "L'école"],
      ["Que trouve-t-on en face de l'école ?", "La banque"],
      ["Où est l'hôpital ?", "À côté de la banque"],
    ],
    yes: ["The school is next to the market.", "The bank is opposite the school.", "The hospital is next to the bank."],
    no: ["The bank is next to the school.", "The market is opposite the bank.", "The hospital is opposite the school."],
    num: [],
    pairs: [
      ["Qu'est-ce qui est à côté du marché ?", "School"],
      ["Que trouve-t-on en face de l'école ?", "Bank"],
      ["Qu'est-ce qui est à côté de la banque ?", "Hospital"],
    ],
  },
  {
    text: "Tomorrow is Saturday. I am going to help my father at the market. My sister is going to cook rice. In the evening, we are going to watch television.",
    qa: [
      ["Quel jour est demain ?", "Samedi"],
      ["Que va cuisiner la sœur ?", "Du riz"],
      ["Que vont faire les enfants le soir ?", "Regarder la télévision"],
    ],
    yes: ["Tomorrow is Saturday.", "I am going to help my father.", "My sister is going to cook rice.", "We are going to watch television."],
    no: ["Tomorrow is Sunday.", "My sister is going to cook fish.", "We are going to play football in the evening."],
    num: [],
    pairs: [
      ["Quel jour est demain ?", "Saturday"],
      ["Qui l'enfant va-t-il aider ?", "Father"],
      ["Que va cuisiner la sœur ?", "Rice"],
    ],
  },
  {
    text: "Yesterday I was at the mosque with my father. My mother was at home. We were hungry. We ate rice and fish.",
    qa: [
      ["Où étaient l'enfant et son père hier ?", "À la mosquée"],
      ["Où était la mère ?", "À la maison"],
      ["Comment étaient-ils ?", "Ils avaient faim"],
    ],
    yes: ["My mother was at home.", "We were hungry.", "We ate rice and fish.", "I was at the mosque with my father."],
    no: ["We were tired.", "I was at school yesterday.", "My mother was at the market."],
    num: [],
    pairs: [
      ["Où était la mère ?", "Home"],
      ["Avec qui l'enfant était-il à la mosquée ?", "Father"],
      ["Qu'ont-ils mangé avec le riz ?", "Fish"],
    ],
  },
];
/** Les phrases vraies de chaque texte, avec celles que les trous reconstruisent. */
const RD_TRUE: Record<string, Set<string>> = {};
const RD_FALSE: Record<string, Set<string>> = {};
const READING_OF = new Map<string, Reading>();
READING.forEach((r) => {
  READING_OF.set(r.text, r);
  RD_TRUE[r.text] = new Set(r.yes);
  RD_FALSE[r.text] = new Set(r.no);
});
// Les phrases vraies que seuls les trous disent (le texte les écrit autrement).
const GAP_TRUTHS: [number, string][] = [
  [0, "Awa lives in Dakar."],
  [0, "Awa is ten years old."],
  [0, "Awa goes to school every day."],
  [1, "Moussa is eleven years old."],
  [1, "Moussa plays football on Saturday."],
  [1, "After the game, Moussa drinks water."],
  [2, "Fatou buys three mangoes."],
  [2, "Fatou goes to the market with her mother."],
  [2, "The mangoes cost five hundred francs."],
  [3, "We visited my grandmother."],
  [3, "We ate in the garden."],
  [3, "Then we played football."],
  [4, "The school is next to the market."],
  [4, "The bank is opposite the school."],
  [4, "The hospital is next to the bank."],
  [5, "Tomorrow is Saturday."],
  [5, "My sister is going to cook rice."],
  [5, "I am going to help my father at the market."],
  [6, "My mother was at home."],
  [6, "We were hungry."],
  [6, "We ate rice and fish."],
];
GAP_TRUTHS.forEach(([i, sentence]) => RD_TRUE[READING[i].text].add(sentence));
const RD_DIALOGUES = new Set<string>([
  "Hello, Awa. How are you?|I am fine, thank you. And you?|I am fine too, thank you.",
  "Hello, Fatou. How are you?|I am fine, thank you. And you?|I am fine too, thank you.",
  "How much is the book?|It is two hundred francs.|Thank you. I would like the book, please.",
  "How much is the bag?|It is five hundred francs.|Thank you. I would like the bag, please.",
  "Where are you going?|I am going to the market.|What are you going to buy there?|I am going to buy rice.",
  "Excuse me, where is the post office?|It is opposite the bank.|Thank you.",
  "Hello, Fatou. What are you going to do tomorrow?|I am going to visit my grandmother. And you?|I am going to help my father too.",
  "Why are you sad?|Because I am tired.|Go to bed, then.",
]);

// ===========================================================================
// LES JUGES
// ===========================================================================

const ok = (condition: boolean, message: string) => (condition ? null : message);
const all = (...results: (string | null)[]) => results.find((result) => result !== null) ?? null;
const filled = (text: string, option: string) => text.replace("___", option);

/** Les débuts de mots de toutes les phrases justes : de quoi ne suivre que les débuts qui mènent encore à une phrase juste. */
const PREFIXES = new Set<string>();
let prefixesBuilt = false;
const buildPrefixes = () => {
  if (prefixesBuilt) return;
  prefixesBuilt = true;
  for (const sentence of VALID) {
    const words = sentence.split(" ");
    for (let n = 1; n <= words.length; n++) PREFIXES.add(words.slice(0, n).join(" "));
  }
};

/** Pas d'autre ordre des mêmes tuiles qui donne une phrase juste. */
function onlyOrder(tiles: readonly string[]): boolean {
  buildPrefixes();
  const target = tiles.join(" ");
  const seen = new Set<string>();
  const walk = (rest: string[], built: string[]): boolean => {
    const sentence = built.join(" ");
    if (built.length > 0 && !PREFIXES.has(sentence)) return true;
    if (rest.length === 0) return sentence === target || !VALID.has(sentence);
    for (let i = 0; i < rest.length; i++) {
      const key = `${sentence}|${rest[i]}|${rest.length}`;
      if (seen.has(key)) continue;
      seen.add(key);
      if (!walk([...rest.slice(0, i), ...rest.slice(i + 1)], [...built, rest[i]])) return false;
    }
    return true;
  };
  return walk([...tiles], []);
}

const notValid = (wrongs: string[], prompt: string) => all(...wrongs.map((wrong) => ok(!VALID.has(wrong), `« ${wrong} » est juste aussi (${prompt})`)));

const checkPhrase = (exo: Exo): string | null => {
  const right = rightOption(exo);
  const wrongs = optionsOf(exo).filter((option) => option !== right);
  const { prompt } = exo;
  if (prompt === "Quelle phrase est juste ?" || prompt === "Quelle question est juste ?")
    return all(ok(VALID.has(right), `« ${right} » n'est pas juste (${prompt})`), ok(!(right.endsWith("?") && / my grandmother/.test(right)), `« ${right} » demande à quelqu'un de visiter la grand-mère de celui qui parle`), notValid(wrongs, prompt));
  let m = /^Quelle phrase dit le contraire de « (.+) » \?$/.exec(prompt);
  if (m) return all(ok(NEG.get(m[1]) === right, `le contraire de « ${m[1]} » est « ${NEG.get(m[1])} », pas « ${right} »`), notValid(wrongs, prompt));
  m = /^On te demande « (.+) ». Tu réponds (oui|non)\. Quelle est la bonne réponse \?$/.exec(prompt);
  if (m) {
    const reply = REPLY.get(m[1]);
    if (!reply) return `question inconnue : ${m[1]}`;
    const expected = m[2] === "oui" ? reply.yes : reply.no;
    return all(ok(right === expected, `réponse attendue « ${expected} », pas « ${right} »`), ok(wrongs.every((wrong) => wrong !== expected), "la bonne réponse est aussi un mauvais choix"));
  }
  // la comparaison
  m = /^Quel est le (comparatif|superlatif) de « (.+) » \?$/.exec(prompt);
  if (m) {
    const adj = CP_ADJ.find(([base]) => base === m![2]);
    if (!adj) return `adjectif inconnu : ${m[2]}`;
    const expected = m[1] === "comparatif" ? adj[1] : adj[2];
    return all(
      ok(right === expected, `le ${m[1]} de ${m[2]} est « ${expected} », pas « ${right} »`),
      ...wrongs.map((wrong) => ok(wrong !== adj[1] && wrong !== adj[2], `« ${wrong} » est une forme juste de ${m![2]}`)),
    );
  }
  // le chemin
  m = /^Tu veux demander où est (.+)\. Quelle phrase est juste \?$/.exec(prompt);
  if (m) {
    const place = ARTICLE_OF.get(m[1]);
    return all(ok(right === `Excuse me, where is the ${place}?`, `« ${right} » ne demande pas où est ${m[1]}`), notValid(wrongs, prompt));
  }
  m = /^Que veut dire « (.+) » \?$/.exec(prompt);
  if (m) return all(ok(frOf(m[1]).has(right), `« ${m[1]} » ne veut pas dire « ${right} »`), ...wrongs.map((wrong) => ok(!frOf(m![1]).has(wrong), `« ${m![1]} » veut dire aussi « ${wrong} »`)));
  m = /^Quelle phrase veut dire « (.+) » \?$/.exec(prompt);
  if (m) return all(ok(frOf(right).has(m[1]), `« ${right} » ne veut pas dire « ${m[1]} »`), ...wrongs.map((wrong) => ok(!frOf(wrong).has(m![1]), `« ${wrong} » veut dire aussi « ${m![1]} »`)));
  // les questions
  m = /^Quelle réponse va avec la question « (.+) » \?$/.exec(prompt);
  if (m) {
    const type = QS_TYPE_OF_QUESTION.get(m[1]);
    return all(
      ok(QS_ANSWER.get(m[1]) === right, `la réponse à « ${m[1]} » est « ${QS_ANSWER.get(m[1])} », pas « ${right} »`),
      ...wrongs.map((wrong) => ok(QS_TYPE_OF_ANSWER.has(wrong) && QS_TYPE_OF_ANSWER.get(wrong) !== type, `« ${wrong} » pourrait répondre à « ${m![1]} »`)),
    );
  }
  m = /^Pour demander (.+), quel mot choisis-tu \?$/.exec(prompt);
  if (m) {
    const type = typeFromFr(m[1]);
    if (!type) return `sorte inconnue : ${m[1]}`;
    return all(
      ok(right === QS_WORD[type], `pour demander ${m[1]} il faut « ${QS_WORD[type]} », pas « ${right} »`),
      ok(wrongs.every((wrong) => QS_TYPE_OF_WORD[wrong] !== undefined && QS_TYPE_OF_WORD[wrong] !== type), "un mauvais choix demande la même chose"),
    );
  }
  m = /^Quelle question demande (.+) \?$/.exec(prompt);
  if (m) {
    const type = typeFromFr(m[1]);
    return all(
      ok(QS_TYPE_OF_QUESTION.get(right) === type, `« ${right} » ne demande pas ${m[1]}`),
      ...wrongs.map((wrong) => ok(QS_TYPE_OF_QUESTION.has(wrong) && QS_TYPE_OF_QUESTION.get(wrong) !== type && QS_TYPE_OF_WORD[wordOfQuestion(wrong)] !== type, `« ${wrong} » demande aussi ${m![1]}`)),
      // Un prix est aussi un nombre : l'un ne se propose jamais pour l'autre.
      ...wrongs.map((wrong) => ok(!(["nombre", "prix"].includes(type as string) && ["nombre", "prix"].includes(QS_TYPE_OF_QUESTION.get(wrong) as string)), `« ${wrong} » est un nombre ou un prix, comme la bonne réponse`)),
    );
  }
  // la lecture
  m = /^Lis le texte\. « (.+?) » (.+)$/.exec(prompt);
  if (m) {
    const reading = READING_OF.get(m[1]);
    if (!reading) return `texte inconnu : ${m[1]}`;
    const qa = reading.qa.find(([question]) => question === m![2]);
    if (!qa) return `question inconnue : ${m[2]}`;
    return all(ok(right === qa[1], `la réponse à « ${m[2]} » est « ${qa[1]} », pas « ${right} »`), ok(wrongs.every((wrong) => wrong !== qa[1]), "la bonne réponse est aussi un mauvais choix"));
  }
  return `énoncé inconnu : ${prompt}`;
};

const checkGap = (exo: Exo): string | null => {
  const blank = blankOf(exo);
  const text = textOf(exo);
  const right = filled(text, blank.answer);
  const wrongs = blank.options.filter((option) => option !== blank.answer).map((option) => filled(text, option));
  const { prompt } = exo;
  if (prompt === "Complète la phrase.") return all(ok(VALID.has(right), `« ${right} » n'est pas juste`), notValid(wrongs, prompt));
  let m = /^(.+) Complète la (?:phrase|question) en anglais\.$/.exec(prompt);
  if (m) return all(ok(VALID.has(right) && frOf(right).has(m[1]), `« ${right} » ne dit pas « ${m[1]} »`), ...wrongs.map((wrong) => ok(!frOf(wrong).has(m![1]), `« ${wrong} » dit aussi « ${m![1]} »`)));
  m = /^Complète avec le (comparatif|superlatif) de « (.+) »\.$/.exec(prompt);
  if (m) {
    const adj = CP_ADJ.find(([base]) => base === m![2]);
    if (!adj) return `adjectif inconnu : ${m[2]}`;
    return all(ok(blank.answer === (m[1] === "comparatif" ? adj[1] : adj[2]), `« ${blank.answer} » n'est pas le ${m[1]} de ${m[2]}`), ok(VALID.has(right), `« ${right} » n'est pas juste`), notValid(wrongs, prompt));
  }
  m = /^On te demande « (.+) ». Complète la réponse\.$/.exec(prompt);
  if (m) return ok(QS_ANSWER.get(m[1]) === right && wrongs.every((wrong) => !VALID.has(wrong)), `la réponse à « ${m[1]} » est « ${QS_ANSWER.get(m[1])} », pas « ${right} »`);
  m = /^Lis le texte\. « (.+?) » Complète la phrase\.$/.exec(prompt);
  if (m) {
    const truth = RD_TRUE[m[1]];
    if (!truth) return `texte inconnu : ${m[1]}`;
    return all(ok(truth.has(right), `« ${right} » n'est pas dit par le texte`), ...wrongs.map((wrong) => ok(!truth.has(wrong), `« ${wrong} » est dit aussi par le texte`)));
  }
  return `consigne inconnue : ${prompt}`;
};

const DR_WORD_EN: Record<string, string> = { "à gauche": "left", "à droite": "right", "en face de": "opposite", entre: "between", où: "where", "à côté de": "next to" };

const foldWord = (text: string) => text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
const checkWrite = (exo: Exo): string | null => {
  const accepted = acceptedOf(exo);
  if (accepted[0] !== exo.answerKey) return `la première écriture admise n'est pas la réponse : ${exo.prompt}`;
  // La réponse à écrire n'est pas dans l'énoncé : aucun de ses mots de cinq lettres ou plus n'y figure (la phrase à trou comprise).
  const promptWords = new Set(foldWord(exo.prompt).split(/[^a-z]+/));
  const copied = foldWord(accepted[0]).split(/[^a-z]+/).find((word) => word.length >= 5 && promptWords.has(word));
  if (copied) return `« ${copied} » est dans l'énoncé et dans la réponse : ${exo.prompt}`;
  const { prompt } = exo;
  let m = /^(.+?) Écris le (?:mot anglais|verbe anglais|repère de temps) qui manque dans (.+)$/.exec(prompt);
  if (m) {
    const sentence = filled(m[2], accepted[0]);
    return ok(VALID.has(sentence) && frOf(sentence).has(m[1]), `« ${sentence} » ne dit pas « ${m[1]} »`);
  }
  m = /^(?:Écris le petit mot qui manque|Écris le verbe qui manque|Écris le premier mot de la question)\. (.+)$/.exec(prompt);
  if (m) {
    const sentence = filled(m[1], accepted[0]);
    return ok(VALID.has(sentence), `« ${sentence} » n'est pas juste`);
  }
  m = /^Écris le (comparatif|superlatif) de « (.+) » dans (.+)$/.exec(prompt);
  if (m) {
    const adj = CP_ADJ.find(([base]) => base === m![2]);
    if (!adj) return `adjectif inconnu : ${m[2]}`;
    const expected = m[1] === "comparatif" ? adj[1] : adj[2].replace(/^the /, "");
    const sentence = filled(m[3], accepted[0]);
    return all(ok(accepted[0] === expected, `${m[1]} de ${m[2]} : « ${expected} », pas « ${accepted[0]} »`), ok(VALID.has(sentence), `« ${sentence} » n'est pas juste`));
  }
  m = /^Comment dit-on « (.+) » en anglais \? Écris le nom du lieu\.$/.exec(prompt);
  if (m) return ok(ARTICLE_OF.get(m[1]) === accepted[0], `« ${m[1]} » se dit « ${ARTICLE_OF.get(m[1])} », pas « ${accepted[0]} »`);
  m = /^Comment dit-on « (.+) » en anglais \? Écris (?:le mot|les deux mots)\.$/.exec(prompt);
  if (m) return ok(DR_WORD_EN[m[1]] === accepted[0], `« ${m[1]} » se dit « ${DR_WORD_EN[m[1]]} », pas « ${accepted[0]} »`);
  if (prompt === "Va tout droit. Écris le mot qui manque dans Go ___ on.") return ok(accepted[0] === "straight" && VALID.has(filled("Go ___ on.", accepted[0])), "« Go straight on. » attendu");
  m = /^Quel mot interrogatif demande (.+) \? Écris-le en anglais\.$/.exec(prompt);
  if (m) {
    const type = typeFromFr(m[1]);
    return all(ok(type !== undefined && accepted[0] === QS_WORD[type], `pour ${m[1]} : « ${type && QS_WORD[type]} », pas « ${accepted[0]} »`), ok(accepted.every((a) => a.toLowerCase() === accepted[0].toLowerCase()), "écritures admises différentes"));
  }
  m = /^(.+?) Écris le mot interrogatif qui manque dans (.+)$/.exec(prompt);
  if (m) {
    const question = filled(m[2], accepted[0]);
    return all(ok(VALID.has(question) && frOf(question).has(m[1]), `« ${question} » ne dit pas « ${m[1]} »`), ok(accepted.every((a) => a.toLowerCase() === accepted[0].toLowerCase()), "écritures admises différentes"));
  }
  m = /^Lis le texte\. « (.+?) » (.+) Écris le nombre en chiffres\.$/.exec(prompt);
  if (m) {
    const reading = READING_OF.get(m[1]);
    const num = reading?.num.find(([question]) => question === m![2]);
    return ok(num !== undefined && String(num[1]) === accepted[0], `la réponse à « ${m[2]} » est ${num?.[1]}, pas ${accepted[0]}`);
  }
  return `consigne inconnue : ${prompt}`;
};

const checkOrder = (exo: Exo): string | null => {
  const tiles = sequenceOf(exo);
  if (exo.prompt === "Remets ce dialogue dans l'ordre, de la première à la dernière phrase.") {
    const key = tiles.join("|");
    // Chaque réplique n'a qu'une place : un bonjour n'est jamais une réplique à part (il pourrait passer devant ou derrière), et une réplique qui ne vient pas en
    // premier est soit une réponse (aucun « ? »), soit une question qui reprend la précédente (« And you? », « there »).
    const anchored = tiles.slice(1).every((line) => !/^Hello/.test(line) && (!line.endsWith("?") || / there\?$/.test(line) || /And you\?$/.test(line)));
    return all(ok(DR_DIALOGUES.has(key) || RD_DIALOGUES.has(key), `dialogue inconnu : ${key}`), ok(anchored, `une réplique peut passer devant : ${key}`));
  }
  const sentence = tiles.join(" ");
  const isQuestion = sentence.endsWith("?");
  return all(
    ok(!(isQuestion && / my grandmother/.test(sentence)), `« ${sentence} » demande à quelqu'un de visiter la grand-mère de celui qui parle`),
    ok(VALID.has(sentence), `« ${sentence} » n'est pas juste`),
    ok(exo.prompt === (isQuestion ? "Remets les mots dans l'ordre pour écrire une question." : "Remets les mots dans l'ordre pour écrire une phrase."), `consigne : ${exo.prompt}`),
    ok(tiles.length >= 3 && tiles.length <= 8, `${tiles.length} tuiles`),
    ok(onlyOrder(tiles), `« ${sentence} » n'est pas le seul ordre`),
  );
};

const checkLink = (exo: Exo): string | null => {
  const reading = /^Lis le texte\. « (.+?) » Relie chaque question à sa réponse\.$/.exec(exo.prompt);
  if (reading) {
    const text = READING_OF.get(reading[1]);
    if (!text) return `texte inconnu : ${reading[1]}`;
    return all(...pairsOf(exo).map((pair) => ok(text.pairs.some(([left, right]) => left === pair.left && right === pair.right), `paire fausse : ${pair.left} ~ ${pair.right}`)));
  }
  const wanted: Record<string, (right: string) => boolean> = {
    "Relie chaque mot à sa forme pour comparer.": (right) => CP_COMPS.has(right),
    "Relie chaque mot à sa forme pour dire le plus.": (right) => CP_SUPS.has(right),
    "Relie chaque verbe à sa forme du passé.": (right) => PASTS.has(right),
  };
  const only = wanted[exo.prompt];
  const lefts = pairsOf(exo).map((pair) => pair.left);
  return all(
    // « tall » et « big » se traduisent tous deux par « grand » : jamais opposés dans un même « relier » des sens.
    ok(exo.prompt !== "Relie chaque mot anglais à son sens en français." || !(lefts.includes("tall") && lefts.includes("big")), `tall et big ensemble : ${lefts.join(", ")}`),
    ...(only ? pairsOf(exo).map((pair) => ok(only(pair.right), `« ${pair.right} » n'est pas ce que demande « ${exo.prompt} »`)) : []),
    ...pairsOf(exo).map((pair) => {
      if (QS_ANSWER.has(pair.left)) return ok(QS_ANSWER.get(pair.left) === pair.right, `réponse fausse : ${pair.left} ~ ${pair.right}`);
      const sentence = /[.?]$/.test(pair.left) && VALID.has(pair.left);
      return ok(sentence ? frOf(pair.left).has(pair.right) : GLOSS.has(`${pair.left}|${pair.right}`), `paire fausse : ${pair.left} ~ ${pair.right} (${exo.prompt})`);
    }),
  );
};

const SETS = (...words: string[]) => (text: string) => words.includes(text);
const typeOf = (type: QsType) => (text: string) => QS_TYPE_OF_QUESTION.get(text) === type;
const ZONE: Record<string, (text: string) => boolean> = {
  was: SETS("I", "He", "She", "It", "Awa", "Moussa"),
  were: SETS("You", "We", "They", "My friends", "Awa and Moussa"),
  is: SETS("He", "She", "Awa", "Moussa"),
  are: SETS("You", "We", "They", "My friends"),
  "Phrase positive": (t) => VALID.has(t) && !/ not /.test(t),
  "Phrase négative": (t) => VALID.has(t) && / not /.test(t),
  "Je demande": (t) => (VALID.has(t) && t.endsWith("?")) || QS_TYPE_OF_QUESTION.has(t),
  "Je réponds": (t) => /^(Yes|No), /.test(t) || QS_TYPE_OF_ANSWER.has(t),
  "Verbe de base": (t) => BASES.has(t),
  "Verbe au passé": (t) => PASTS.has(t),
  Futur: (t) => GT_SET.has(t),
  Passé: (t) => PAST_SET.has(t),
  "Mot court": (t) => CP_SHORT.has(t),
  "Mot long": (t) => CP_LONG.has(t),
  Comparatif: (t) => CP_COMPS.has(t),
  Superlatif: (t) => CP_SUPS.has(t),
  "Phrase juste": (t) => VALID.has(t),
  "Phrase fausse": (t) => !VALID.has(t),
  "Je me déplace": SETS("go straight on", "turn left", "turn right"),
  "Je situe un lieu": SETS("next to", "opposite", "between"),
  Lieu: (t) => DR_PLACE.some(([en]) => en === t) || typeOf("lieu")(t),
  Direction: SETS("left", "right", "straight on"),
  "Je demande mon chemin": (t) => /^Excuse me, where is the .+\?$/.test(t) && VALID.has(t),
  "Je donne le chemin": (t) => DR_ROUTE.some(([en]) => en === t),
  Personne: typeOf("personne"),
  Moment: typeOf("moment"),
  Nombre: typeOf("nombre"),
  Raison: typeOf("raison"),
  Prix: typeOf("prix"),
};

const checkSort = (exo: Exo): string | null => {
  const [first, second] = zonesOf(exo);
  const reading = /^Lis le texte\. « (.+?) » Glisse chaque phrase dans la bonne case\.$/.exec(exo.prompt);
  if (reading) {
    const truth = RD_TRUE[reading[1]];
    const falsity = RD_FALSE[reading[1]];
    if (!truth || !falsity) return `texte inconnu : ${reading[1]}`;
    return all(
      ok(first === "True" && second === "False", `cases : ${first} / ${second}`),
      ...itemsOf(exo).map((item) => ok(item.correctZone === "True" ? truth.has(item.text) && !falsity.has(item.text) : falsity.has(item.text) && !truth.has(item.text), `« ${item.text} » n'est pas ${item.correctZone}`)),
    );
  }
  const one = ZONE[first];
  const two = ZONE[second];
  if (!one || !two) return `case inconnue : ${first} / ${second}`;
  return all(
    ...itemsOf(exo).map((item) => {
      const mine = item.correctZone === first ? one : two;
      const other = item.correctZone === first ? two : one;
      return ok(mine(item.text) && !other(item.text), `« ${item.text} » ne va pas seulement dans « ${item.correctZone} » (${first} / ${second})`);
    }),
  );
};

const CHECKS: Record<string, (exo: Exo) => string | null> = {
  phrase: checkPhrase,
  trou: checkGap,
  ecrire: checkWrite,
  ordre: checkOrder,
  relier: checkLink,
  glisser: checkSort,
};

const { make, drawsOf } = defineTemplateTests({
  label: "de l'anglais du CM2",
  klass: "CM2",
  count: COUNTS,
  draws: 100,
  maxWords: 80,
  topicKinds: TOPIC_KINDS,
  expectedKinds: 48,
  topicCount: 8,
  kindPattern: /^cm2-en-/,
  check: (kind, exo) => CHECKS[kind.split("-").pop() as string](exo as Exo),
});

// ===========================================================================
// LES INDICES DE LONGUEUR DISENT LA VRAIE LONGUEUR
// ===========================================================================

describe("les indices qui comptent les lettres disent la longueur de la bonne réponse", () => {
  const LENGTH: Record<string, number> = { deux: 2, trois: 3, quatre: 4, cinq: 5 };
  const kinds = Object.values(TOPIC_KINDS).flat();
  for (const kind of kinds) {
    it(`${kind} : le nombre de lettres d'un indice est celui de la réponse`, () => {
      for (const d of drawsOf(kind).filter((_, i) => i % 7 === 0)) {
        const exo = make(kind as GameKind, d) as unknown as Exo;
        for (const hint of exo.hints) {
          // Seuls les indices du verbe être (« Avec ce sujet, le verbe être a trois lettres. ») comptent les lettres de la réponse elle-même.
          if (!hint.startsWith("Avec ce sujet, le verbe être")) continue;
          const m = /\b(deux|trois|quatre|cinq) lettres\b/.exec(hint);
          if (!m) continue;
          // Le verbe être de la réponse : le seul mot de la réponse, ou le premier verbe être de la phrase.
          const be = exo.answerKey.split(/[\s,.?]+/).find((word) => /^(was|were|am|is|are)$/i.test(word)) ?? exo.answerKey;
          expect(be.length, `${kind} : « ${hint} » pour « ${exo.answerKey} » (${exo.prompt})`).toBe(LENGTH[m[1]]);
        }
      }
    });
  }
});
