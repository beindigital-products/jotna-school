/**
 * LES GABARITS D'ANGLAIS DU CM1, LES VERBES : le présent simple (I, you, we, they), he, she, it et le s du verbe, la routine de la journée,
 * le présent continu (`an-cm1-present-simple`, `an-cm1-he-she-it`, `an-cm1-routine`, `an-cm1-continuous`).
 *
 * Le modèle écrivait ici « She play football », « Does he plays ? », « I am play », une réponse courte qui ne reprend pas le petit mot
 * d'aide de la question. Ici une phrase se DÉDUIT d'un sujet, d'un verbe et d'un complément pris dans des tables fermées : le s de he, she
 * et it, do ou does, am, is ou are + -ing sont ceux de la règle, et les mauvais choix sont les fautes d'enfant de la fiche (le verbe resté
 * sans s, le s gardé après does, le verbe sans être, le -ing mal écrit). Une phrase juste n'est jamais proposée comme mauvais choix.
 *
 * Les thématiques ont QUATRE, QUATRE, TROIS et QUATRE paliers : chaque gabarit donne à chaque palier sa part de la liste (`ce2Outils`).
 * Les lignes sont mêlées (`interleave`) pour qu'un palier voie des phrases, des négations, des questions et des réponses.
 *
 * HORS FICHE, À FAIRE RELIRE PAR UN PROFESSEUR D'ANGLAIS
 * - Les compléments de chaque verbe (play football, eat rice, drink water, read a book, write a letter, watch television, like mangoes,
 *   go to school, have breakfast, study mathematics ; cook rice, eat bread) et les prénoms (Awa, Moussa) ; « it » n'est qu'avec eat, drink, sleep.
 * - Le français de chaque phrase (« Nous mangeons du riz. », « Il est en train de boire de l'eau. », « J'écris une lettre. ») et les mots
 *   « toujours, en général, parfois, jamais ».
 * - La routine : les heures (six, sept, huit, cinq, neuf, une), les moments (le matin, l'après-midi, le soir, la nuit) et l'ordre d'une journée.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { ce2Gap, ce2Link, ce2Order, ce2Question, ce2Sort, ce2Write, hints, ordr, sortRows, type GapRow, type LinkRow, type OrderRow, type QuestionRow, type WriteRow } from "./ce2Outils";
import { QUESTION_HINTS, QUESTION_PROMPT, REPLY_HINTS, SENTENCE_HINTS, SENTENCE_PROMPT, SORT_HINTS_EN, SORT_PROMPT, apostrophes, firstLetter, interleave, link, startsWithVowel, trios, withObj, wordsOf } from "./cm1AnglaisOutils";
import type { GameContext, GeneratedGame } from "./shared";

type Make = (ctx: GameContext) => GeneratedGame;


// ===========================================================================
// LE PRÉSENT SIMPLE (an-cm1-present-simple) : I, you, we, they
// ===========================================================================

type PsVerb = { en: string; ing: string; obj: string; fr: readonly [string, string, string, string]; frObj: string; inf: string };

const PS_VERBS: readonly PsVerb[] = [
  { en: "play", ing: "playing", obj: "football", fr: ["joue", "joues", "jouons", "jouent"], frObj: "au football", inf: "jouer" },
  { en: "eat", ing: "eating", obj: "rice", fr: ["mange", "manges", "mangeons", "mangent"], frObj: "du riz", inf: "manger" },
  { en: "drink", ing: "drinking", obj: "water", fr: ["bois", "bois", "buvons", "boivent"], frObj: "de l'eau", inf: "boire" },
  { en: "read", ing: "reading", obj: "a book", fr: ["lis", "lis", "lisons", "lisent"], frObj: "un livre", inf: "lire" },
  { en: "write", ing: "writing", obj: "a letter", fr: ["écris", "écris", "écrivons", "écrivent"], frObj: "une lettre", inf: "écrire" },
  { en: "watch", ing: "watching", obj: "television", fr: ["regarde", "regardes", "regardons", "regardent"], frObj: "la télévision", inf: "regarder" },
  { en: "like", ing: "liking", obj: "mangoes", fr: ["aime", "aimes", "aimons", "aiment"], frObj: "les mangues", inf: "aimer" },
  { en: "go", ing: "going", obj: "to school", fr: ["vais", "vas", "allons", "vont"], frObj: "à l'école", inf: "aller" },
  { en: "have", ing: "having", obj: "breakfast", fr: ["prends", "prends", "prenons", "prennent"], frObj: "le petit déjeuner", inf: "avoir" },
  { en: "study", ing: "studying", obj: "mathematics", fr: ["étudie", "étudies", "étudions", "étudient"], frObj: "les mathématiques", inf: "étudier" },
];

const PS_SUBJ = ["I", "You", "We", "They"] as const;
const PS_SUBJ_FR = ["Je", "Tu", "Nous", "Ils"] as const;
/** Le verbe être qu'un enfant met à tort devant le verbe : « I am play », « They are play ». */
const PS_AUX = ["am", "are", "are", "are"] as const;
/** Le sujet au milieu d'une question : « Do you play football ? ». */
const PS_Q = ["I", "you", "we", "they"] as const;
/** Le pronom d'une réponse courte : « you » répond à « I », « I » répond à « you ». */
const PS_ANS = ["you", "I", "we", "they"] as const;

type Adverb = { en: string; fr: string };
const ADVERBS: readonly Adverb[] = [
  { en: "always", fr: "toujours" },
  { en: "usually", fr: "en général" },
  { en: "sometimes", fr: "parfois" },
  { en: "never", fr: "jamais" },
];

/** Le sujet français et son verbe : « J'écris », « Nous mangeons ». */
const frSubject = (s: number, form: string) => (s === 0 && startsWithVowel(form) ? `J'${form}` : `${PS_SUBJ_FR[s]} ${form}`);
const psFrench = (s: number, v: PsVerb) => `${frSubject(s, v.fr[s])} ${v.frObj}.`;
/** La phrase française d'un adverbe : « Je joue toujours au football. », « Je n'écris jamais une lettre. ». */
const psFrenchAdverb = (s: number, v: PsVerb, adv: Adverb) => {
  const form = v.fr[s];
  if (adv.en === "never") return `${PS_SUBJ_FR[s]} ${startsWithVowel(form) ? "n'" : "ne "}${form} jamais ${v.frObj}.`;
  return `${frSubject(s, form)} ${adv.fr} ${v.frObj}.`;
};

type PsRow = { s: number; v: PsVerb; key: string };
/** Trente lignes : chaque verbe avec trois des quatre sujets. */
const PS_ROWS: readonly PsRow[] = PS_VERBS.flatMap((v, vi) => [0, 1, 2].map((k) => ({ s: (vi + k) % 4, v, key: `ps:${v.en}:${(vi + k) % 4}` })));

const psSentence = (s: number, v: PsVerb, adverb = "") => `${PS_SUBJ[s]}${adverb === "" ? "" : ` ${adverb}`} ${v.en} ${v.obj}.`;
const psNegative = (s: number, v: PsVerb) => `${PS_SUBJ[s]} do not ${v.en} ${v.obj}.`;
const psQuestion = (s: number, v: PsVerb) => `Do ${PS_Q[s]} ${v.en} ${v.obj}?`;

/** Les lignes d'adverbe : une phrase par verbe et par sujet, avec un adverbe qui tourne ; la phrase française tient en une apostrophe au plus. */
const PS_ADVERB_ROWS: readonly (PsRow & { adv: Adverb })[] = (() => {
  const seen = new Set<string>();
  const rows: (PsRow & { adv: Adverb })[] = [];
  for (let i = 0; i < 24; i++) {
    const v = PS_VERBS[(i * 3) % 10];
    const s = (i + Math.floor(i / 4)) % 4;
    const adv = ADVERBS[i % 4];
    const key = `${s}|${v.en}`;
    if (seen.has(key) || apostrophes(psFrenchAdverb(s, v, adv)) > 1) continue;
    seen.add(key);
    rows.push({ s, v, adv, key: `ps-adv:${v.en}:${s}` });
  }
  return rows;
})();

const PS_PHRASE_POS: QuestionRow[] = PS_ROWS.map(({ s, v, key }) => ({
  fact: key,
  prompt: "Quelle phrase est juste ?",
  answer: psSentence(s, v),
  wrong: [`${PS_SUBJ[s]} ${PS_AUX[s]} ${v.en} ${v.obj}.`, `${PS_SUBJ[s]} ${v.ing} ${v.obj}.`],
  hints: hints("Lis chaque phrase en entier.", "Avec ce sujet, le verbe s'écrit tel quel, seul.", "Un verbe sans être ni -ing dit ce qu'on fait d'habitude."),
}));

const PS_PHRASE_NEG: QuestionRow[] = PS_ROWS.map(({ s, v, key }) => ({
  fact: key,
  prompt: `Quelle phrase dit le contraire de « ${psSentence(s, v)} » ?`,
  answer: psNegative(s, v),
  wrong: [`${PS_SUBJ[s]} ${v.en} not ${v.obj}.`, `${PS_SUBJ[s]} not ${v.en} ${v.obj}.`],
  hints: hints("Pour dire le contraire, on ajoute deux petits mots avant le verbe.", "Le verbe reste le même après ces deux petits mots.", "La bonne phrase a do, puis not, puis le verbe."),
}));

const PS_PHRASE_ADV: QuestionRow[] = PS_ADVERB_ROWS.map(({ s, v, adv, key }) => ({
  fact: key,
  prompt: "Quelle phrase est juste ?",
  answer: psSentence(s, v, adv.en),
  wrong: [`${PS_SUBJ[s]} ${v.en} ${adv.en} ${v.obj}.`, `${PS_SUBJ[s]} ${PS_AUX[s]} ${adv.en} ${v.en} ${v.obj}.`],
  hints: hints("Lis chaque phrase en entier.", "Le mot qui dit combien de fois se place juste avant le verbe.", "Cherche la phrase où ce mot touche le verbe, sans être ni -ing."),
}));

const PS_PHRASE_REPLY: QuestionRow[] = PS_ROWS.map(({ s, v, key }, index) => {
  const yes = index % 2 === 0;
  const ans = PS_ANS[s];
  const aux = ans === "I" ? "am" : "are";
  return {
    fact: key,
    prompt: `On te demande « ${psQuestion(s, v)} ». Tu réponds ${yes ? "oui" : "non"}. Quelle est la bonne réponse ?`,
    answer: yes ? `Yes, ${ans} do.` : `No, ${ans} do not.`,
    wrong: yes ? [`Yes, ${ans} ${aux}.`, `No, ${ans} do not.`] : [`No, ${ans} not.`, `Yes, ${ans} do.`],
    hints: REPLY_HINTS,
  };
});

const PS_QCM = interleave(PS_PHRASE_POS, PS_PHRASE_NEG, PS_PHRASE_ADV, PS_PHRASE_REPLY);

const PS_GAP_FORM: GapRow[] = PS_ROWS.map(({ s, v, key }) => ({
  fact: key,
  text: `${PS_SUBJ[s]} ___ ${v.obj}.`,
  answer: v.en,
  wrong: [v.ing, `to ${v.en}`],
  hints: hints("Lis la phrase en entier.", "Avec ce sujet, le verbe s'écrit tel quel, sans -ing ni to.", firstLetter(v.en)),
}));
const PS_GAP_AUX: GapRow[] = PS_ROWS.filter((_, index) => index % 2 === 0).map(({ s, v, key }) => ({
  fact: key,
  text: `${PS_SUBJ[s]} ___ not ${v.en} ${v.obj}.`,
  answer: "do",
  wrong: [PS_AUX[s], "does"],
  hints: hints("Lis la phrase en entier.", "Pour dire non, on met un petit mot, puis not, puis le verbe.", "Ce petit mot commence par la lettre d."),
}));
/** Deux autres adverbes, qui changent d'une ligne à l'autre : le français dit lequel est juste. */
const otherAdverbs = (adv: Adverb, index: number) => {
  const others = ADVERBS.filter((other) => other !== adv).map((other) => other.en);
  return [others[index % 3], others[(index + 1) % 3]];
};
const PS_GAP_ADVERB: GapRow[] = PS_ADVERB_ROWS.map(({ s, v, adv, key }, index) => ({
  fact: key,
  prompt: `${psFrenchAdverb(s, v, adv)} Complète la phrase en anglais.`,
  text: `${PS_SUBJ[s]} ___ ${v.en} ${v.obj}.`,
  answer: adv.en,
  wrong: otherAdverbs(adv, index),
  hints: hints("Lis la phrase française : un mot dit combien de fois.", "Cherche ce mot en anglais.", firstLetter(adv.en)),
}));
const PS_GAP_QUESTION: GapRow[] = PS_ROWS.filter((_, index) => index % 2 === 1).map(({ s, v, key }) => ({
  fact: key,
  text: `___ ${PS_Q[s]} ${v.en} ${v.obj}?`,
  answer: "Do",
  wrong: ["Does", "Are"],
  hints: hints("Lis la phrase en entier.", "Une question avec ce sujet commence par un petit mot d'aide.", "Ce petit mot commence par la lettre d."),
}));
const PS_TROU = interleave(PS_GAP_FORM, PS_GAP_AUX, PS_GAP_ADVERB, PS_GAP_QUESTION);

const PS_WRITE_VERB: WriteRow[] = PS_ROWS.map(({ s, v, key }) => ({
  fact: key,
  prompt: `${psFrench(s, v)} Écris le verbe anglais qui manque dans ${PS_SUBJ[s]} ___ ${v.obj}.`,
  accepted: [v.en],
  hints: hints("Pense à ce que dit la phrase française.", "Le verbe anglais reste tel quel avec ce sujet.", firstLetter(v.en)),
}));
const PS_WRITE_AUX: WriteRow[] = PS_ROWS.filter((_, index) => index % 2 === 0).map(({ s, v, key }) => ({
  fact: key,
  prompt: `Écris le petit mot qui manque. ${PS_SUBJ[s]} ___ not ${v.en} ${v.obj}.`,
  accepted: ["do"],
  hints: hints("Lis la phrase en entier.", "Pour dire non, on met un petit mot, puis not, puis le verbe.", "Ce petit mot commence par la lettre d."),
}));
const PS_WRITE_ADVERB: WriteRow[] = PS_ADVERB_ROWS.map(({ s, v, adv, key }) => ({
  fact: key,
  prompt: `${psFrenchAdverb(s, v, adv)} Écris le mot anglais qui manque dans ${PS_SUBJ[s]} ___ ${v.en} ${v.obj}.`,
  accepted: [adv.en],
  hints: hints("Lis la phrase française : un mot dit combien de fois.", "Cherche ce mot en anglais.", firstLetter(adv.en)),
}));
const PS_ECRIRE = interleave(PS_WRITE_VERB, PS_WRITE_AUX, PS_WRITE_ADVERB);

const PS_ORDRE: OrderRow[] = interleave(
  PS_ROWS.filter((_, index) => index % 3 === 0).map(({ s, v, key }) => ordr(SENTENCE_PROMPT, wordsOf(psSentence(s, v)), SENTENCE_HINTS, key)),
  PS_ROWS.filter((_, index) => index % 3 === 1).map(({ s, v, key }) => ordr(SENTENCE_PROMPT, wordsOf(psNegative(s, v)), SENTENCE_HINTS, key)),
  PS_ADVERB_ROWS.map(({ s, v, adv, key }) => ordr(SENTENCE_PROMPT, wordsOf(psSentence(s, v, adv.en)), SENTENCE_HINTS, key)),
  PS_ROWS.filter((_, index) => index % 3 === 2).map(({ s, v, key }) => ordr(QUESTION_PROMPT, wordsOf(psQuestion(s, v)), QUESTION_HINTS, key)),
);

const PS_RELIER: LinkRow[] = interleave(
  PS_VERBS.map((_, i) => link("Relie chaque verbe anglais à son sens en français.", [0, 1, 2, 3].map((k) => PS_VERBS[(i + k) % 10]).map((v) => [v.en, v.inf] as const), `ps-verbes:${i}`)),
  [0, 1, 2, 3].map((i) =>
    link("Relie chaque mot anglais à son sens en français.", [0, 1, 2].map((k) => ADVERBS[(i + k) % 4]).map((adv) => [adv.en, adv.fr] as const), `ps-adverbes:${i}`),
  ),
  [0, 1, 2, 3].flatMap((s) =>
    trios(PS_ROWS.filter((row) => row.s === s), 2).map((trio) =>
      link("Relie chaque phrase anglaise à la même phrase en français.", trio.map((row) => [psSentence(row.s, row.v), psFrench(row.s, row.v)] as const), `ps-phrases:${trio[0].key}`),
    ),
  ),
);

const PS_POSITIVE = ["I play football.", "You eat rice.", "We read a book.", "They watch television.", "I go to school.", "We have breakfast."];
const PS_NEGATIVE = ["I do not play football.", "You do not eat rice.", "We do not read a book.", "They do not watch television.", "I do not go to school.", "We do not have breakfast."];
const PS_GLISSER = [
  ...sortRows(SORT_PROMPT, ["Phrase positive", "Phrase négative"], PS_POSITIVE, PS_NEGATIVE, SORT_HINTS_EN, 8),
  ...sortRows(SORT_PROMPT, ["Je demande", "Je réponds"], ["Do you play football?", "Do we eat rice?", "Do they read a book?"], ["Yes, I do.", "No, I do not.", "Yes, we do.", "No, they do not."], SORT_HINTS_EN, 8),
];

export const makeCm1EnPsPhrase: Make = (ctx) => ce2Question(ctx, "cm1-en-ps-phrase", "choisir la bonne phrase au présent simple avec I, you, we ou they", PS_QCM, 3);
export const makeCm1EnPsTrou: Make = (ctx) => ce2Gap(ctx, "cm1-en-ps-trou", "compléter une phrase au présent simple", PS_TROU, 2, 1);
export const makeCm1EnPsEcrire: Make = (ctx) => ce2Write(ctx, "cm1-en-ps-ecrire", "écrire le verbe ou le petit mot du présent simple", PS_ECRIRE, 1, 2);
export const makeCm1EnPsOrdre: Make = (ctx) => ce2Order(ctx, "cm1-en-ps-ordre", "remettre les mots d'une phrase ou d'une question au présent simple", PS_ORDRE);
export const makeCm1EnPsRelier: Make = (ctx) => ce2Link(ctx, "cm1-en-ps-relier", "relier un verbe, un adverbe ou une phrase à son sens en français", PS_RELIER);
export const makeCm1EnPsGlisser: Make = (ctx) => ce2Sort(ctx, "cm1-en-ps-glisser", "classer les phrases positives, négatives, les questions et les réponses", PS_GLISSER, 2);

// ===========================================================================
// HE, SHE, IT : LE S DU VERBE (an-cm1-he-she-it)
// ===========================================================================

type HsVerb = {
  en: string;
  /** La forme avec he, she, it : plays, watches, goes, has. */
  s: string;
  ing: string;
  obj: string;
  /** La forme que l'enfant écrit à tort quand le verbe n'est pas régulier (« watchs », « gos », « haves »), sinon vide. */
  naive: string;
  fr: string;
  frObj: string;
};

const HS_VERBS: readonly HsVerb[] = [
  { en: "play", s: "plays", ing: "playing", obj: "football", naive: "", fr: "joue", frObj: "au football" },
  { en: "eat", s: "eats", ing: "eating", obj: "rice", naive: "", fr: "mange", frObj: "du riz" },
  { en: "read", s: "reads", ing: "reading", obj: "a book", naive: "", fr: "lit", frObj: "un livre" },
  { en: "watch", s: "watches", ing: "watching", obj: "television", naive: "watchs", fr: "regarde", frObj: "la télévision" },
  { en: "go", s: "goes", ing: "going", obj: "to school", naive: "gos", fr: "va", frObj: "à l'école" },
  { en: "have", s: "has", ing: "having", obj: "breakfast", naive: "haves", fr: "prend", frObj: "le petit déjeuner" },
  { en: "drink", s: "drinks", ing: "drinking", obj: "water", naive: "", fr: "boit", frObj: "de l'eau" },
  { en: "write", s: "writes", ing: "writing", obj: "a letter", naive: "", fr: "écrit", frObj: "une lettre" },
  { en: "sleep", s: "sleeps", ing: "sleeping", obj: "", naive: "", fr: "dort", frObj: "" },
];

type HsSubject = { text: string; q: string; ans: string; fr: string };
const HS_SUBJECTS: readonly HsSubject[] = [
  { text: "He", q: "he", ans: "he", fr: "Il" },
  { text: "She", q: "she", ans: "she", fr: "Elle" },
  { text: "It", q: "it", ans: "it", fr: "Il" },
  { text: "Awa", q: "Awa", ans: "she", fr: "Awa" },
  { text: "Moussa", q: "Moussa", ans: "he", fr: "Moussa" },
];

const hsOk = (subject: HsSubject, verb: HsVerb) => subject.text !== "It" || ["eat", "drink", "sleep"].includes(verb.en);
type HsRow = { p: HsSubject; v: HsVerb; key: string };
const HS_ROWS: readonly HsRow[] = HS_SUBJECTS.flatMap((p) => HS_VERBS.filter((v) => hsOk(p, v)).map((v) => ({ p, v, key: `hs:${v.en}:${p.text}` })));

const hsSentence = (p: HsSubject, v: HsVerb) => `${p.text} ${v.s}${withObj(v.obj)}.`;
const hsNegative = (p: HsSubject, v: HsVerb) => `${p.text} does not ${v.en}${withObj(v.obj)}.`;
const hsQuestion = (p: HsSubject, v: HsVerb) => `Does ${p.q} ${v.en}${withObj(v.obj)}?`;
const hsFrench = (p: HsSubject, v: HsVerb) => `${p.fr} ${v.fr}${withObj(v.frObj)}.`;
/** La faute d'enfant propre au verbe : le s oublié est toujours là, la seconde faute dépend du verbe. */
const hsSecondError = (p: HsSubject, v: HsVerb) => (v.naive !== "" ? `${p.text} ${v.naive}${withObj(v.obj)}.` : `${p.text} ${v.ing}${withObj(v.obj)}.`);
const hsWrongForm = (v: HsVerb) => (v.naive !== "" ? v.naive : v.ing);

const HS_PHRASE_POS: QuestionRow[] = HS_ROWS.map(({ p, v, key }) => ({
  fact: key,
  prompt: "Quelle phrase est juste ?",
  answer: hsSentence(p, v),
  wrong: [`${p.text} ${v.en}${withObj(v.obj)}.`, hsSecondError(p, v)],
  hints: hints("Lis chaque phrase en entier.", "Avec he, she, it ou un seul nom, le verbe prend une lettre de plus.", "Compare la fin du verbe dans les trois phrases."),
}));
const HS_PHRASE_NEG: QuestionRow[] = HS_ROWS.map(({ p, v, key }) => ({
  fact: key,
  prompt: `Quelle phrase dit le contraire de « ${hsSentence(p, v)} » ?`,
  answer: hsNegative(p, v),
  wrong: [`${p.text} do not ${v.en}${withObj(v.obj)}.`, `${p.text} does not ${v.s}${withObj(v.obj)}.`],
  hints: hints("Pour dire le contraire, on ajoute deux petits mots avant le verbe.", "Après ces deux petits mots, le verbe n'a plus sa lettre de plus.", "Le premier petit mot s'écrit comme avec le sujet de la phrase de départ."),
}));
const HS_PHRASE_REPLY: QuestionRow[] = HS_ROWS.map(({ p, v, key }, index) => {
  const yes = index % 2 === 0;
  return {
    fact: key,
    prompt: `On te demande « ${hsQuestion(p, v)} ». Tu réponds ${yes ? "oui" : "non"}. Quelle est la bonne réponse ?`,
    answer: yes ? `Yes, ${p.ans} does.` : `No, ${p.ans} does not.`,
    wrong: yes ? [`Yes, ${p.ans} do.`, `No, ${p.ans} does.`] : [`No, ${p.ans} do not.`, `Yes, ${p.ans} does not.`],
    hints: REPLY_HINTS,
  };
});
const HS_QCM = interleave(HS_PHRASE_POS, HS_PHRASE_NEG, HS_PHRASE_REPLY);

const HS_GAP_FORM: GapRow[] = HS_ROWS.map(({ p, v, key }) => ({
  fact: key,
  text: `${p.text} ___${withObj(v.obj)}.`,
  answer: v.s,
  wrong: [v.en, hsWrongForm(v)],
  hints: hints("Lis la phrase en entier.", "Avec he, she, it ou un seul nom, le verbe prend une lettre de plus.", firstLetter(v.s)),
}));
const HS_GAP_AUX: GapRow[] = HS_ROWS.filter((_, index) => index % 2 === 0).map(({ p, v, key }) => ({
  fact: key,
  text: `${p.text} ___ not ${v.en}${withObj(v.obj)}.`,
  answer: "does",
  wrong: ["do", "is"],
  hints: hints("Lis la phrase en entier.", "Pour dire non, on met un petit mot, puis not, puis le verbe.", "Ce petit mot commence par la lettre d."),
}));
const HS_GAP_QUESTION: GapRow[] = HS_ROWS.filter((_, index) => index % 2 === 1).map(({ p, v, key }) => ({
  fact: key,
  text: `___ ${p.q} ${v.en}${withObj(v.obj)}?`,
  answer: "Does",
  wrong: ["Do", "Is"],
  hints: hints("Lis la phrase en entier.", "Une question avec ce sujet commence par un petit mot d'aide.", "Ce petit mot commence par la lettre d."),
}));
const HS_GAP_BASE: GapRow[] = HS_ROWS.filter((_, index) => index % 3 === 0).map(({ p, v, key }) => ({
  fact: key,
  text: `Does ${p.q} ___${withObj(v.obj)}?`,
  answer: v.en,
  wrong: [v.s, v.ing],
  hints: hints("Lis la phrase en entier.", "Après le petit mot d'aide, le verbe reste sans lettre de plus.", firstLetter(v.en)),
}));
const HS_TROU = interleave(HS_GAP_FORM, HS_GAP_AUX, HS_GAP_QUESTION, HS_GAP_BASE);

const HS_WRITE_FORM: WriteRow[] = HS_ROWS.map(({ p, v, key }) => ({
  fact: key,
  prompt: `${hsFrench(p, v)} Écris le verbe anglais qui manque dans ${p.text} ___${withObj(v.obj)}.`,
  accepted: [v.s],
  hints: hints("Pense à ce que dit la phrase française.", "Avec he, she, it ou un seul nom, le verbe prend une lettre de plus.", firstLetter(v.s)),
}));
const HS_WRITE_AUX: WriteRow[] = HS_ROWS.filter((_, index) => index % 2 === 0).map(({ p, v, key }) => ({
  fact: key,
  prompt: `Écris le petit mot qui manque. ${p.text} ___ not ${v.en}${withObj(v.obj)}.`,
  accepted: ["does"],
  hints: hints("Lis la phrase en entier.", "Pour dire non, on met un petit mot, puis not, puis le verbe.", "Ce petit mot commence par la lettre d."),
}));
const HS_ECRIRE = interleave(HS_WRITE_FORM, HS_WRITE_AUX);

const HS_ORDRE: OrderRow[] = interleave(
  HS_ROWS.filter((_, index) => index % 3 === 0).map(({ p, v, key }) => ordr(SENTENCE_PROMPT, wordsOf(hsSentence(p, v)), SENTENCE_HINTS, key)),
  HS_ROWS.filter((_, index) => index % 3 === 1).map(({ p, v, key }) => ordr(SENTENCE_PROMPT, wordsOf(hsNegative(p, v)), SENTENCE_HINTS, key)),
  HS_ROWS.filter((_, index) => index % 3 === 2).map(({ p, v, key }) => ordr(QUESTION_PROMPT, wordsOf(hsQuestion(p, v)), QUESTION_HINTS, key)),
).filter((row) => row.sequence.length >= 3);

const HS_RELIER: LinkRow[] = interleave(
  HS_VERBS.map((_, i) => link("Relie chaque verbe à sa forme avec he, she ou it.", [0, 1, 2, 3].map((k) => HS_VERBS[(i + k) % 9]).map((v) => [v.en, v.s] as const), `hs-formes:${i}`)),
  HS_SUBJECTS.filter((p) => p.text !== "It").flatMap((p) =>
    trios(HS_ROWS.filter((row) => row.p === p && row.v.obj !== ""), 2).map((trio) =>
      link("Relie chaque phrase anglaise à la même phrase en français.", trio.map((row) => [hsSentence(row.p, row.v), hsFrench(row.p, row.v)] as const), `hs-phrases:${trio[0].key}`),
    ),
  ),
);

const HS_GLISSER = [
  ...sortRows("Glisse chaque forme dans la bonne case.", ["avec -s", "avec -es"], ["plays", "eats", "reads", "drinks", "writes", "sleeps"], ["watches", "goes"], SORT_HINTS_EN, 8),
  ...sortRows("Glisse chaque sujet dans la bonne case.", ["do", "does"], ["I", "You", "We", "They"], ["He", "She", "It", "Awa"], SORT_HINTS_EN, 8),
  ...sortRows(
    SORT_PROMPT,
    ["Phrase juste", "Phrase fausse"],
    ["She plays football.", "He eats rice.", "Awa reads a book.", "It drinks water."],
    ["She play football.", "He eat rice.", "Awa read a book.", "It drink water."],
    SORT_HINTS_EN,
    8,
  ),
];

export const makeCm1EnHsPhrase: Make = (ctx) => ce2Question(ctx, "cm1-en-hs-phrase", "choisir la bonne phrase avec he, she, it", HS_QCM, 3);
export const makeCm1EnHsTrou: Make = (ctx) => ce2Gap(ctx, "cm1-en-hs-trou", "compléter une phrase avec he, she, it", HS_TROU, 2, 1);
export const makeCm1EnHsEcrire: Make = (ctx) => ce2Write(ctx, "cm1-en-hs-ecrire", "écrire le verbe avec le s ou le petit mot does", HS_ECRIRE, 1, 2);
export const makeCm1EnHsOrdre: Make = (ctx) => ce2Order(ctx, "cm1-en-hs-ordre", "remettre les mots d'une phrase ou d'une question avec he, she, it", HS_ORDRE);
export const makeCm1EnHsRelier: Make = (ctx) => ce2Link(ctx, "cm1-en-hs-relier", "relier un verbe à sa forme avec he, she ou it", HS_RELIER);
export const makeCm1EnHsGlisser: Make = (ctx) => ce2Sort(ctx, "cm1-en-hs-glisser", "classer les formes du verbe, les sujets et les phrases justes ou fausses", HS_GLISSER, 2);

// ===========================================================================
// MA JOURNÉE EN ANGLAIS (an-cm1-routine) : at et in, l'heure, l'ordre d'une journée
// ===========================================================================

type RtRow = {
  stem: string;
  /** at ou in. */
  prep: "at" | "in";
  /** Ce qui suit : « six o'clock », « the morning », « night ». */
  rest: string;
  /** L'heure en lettres, quand la phrase a une heure. */
  time?: string;
  fr: string;
  key: string;
};

const rtRow = (stem: string, prep: "at" | "in", rest: string, fr: string, extra: { time?: string } = {}): RtRow => ({
  stem,
  prep,
  rest,
  fr,
  key: `rt:${stem}:${rest}`,
  ...extra,
});

const RT_ROWS: readonly RtRow[] = [
  rtRow("I get up", "at", "six o'clock", "Je me lève à six heures.", { time: "six" }),
  rtRow("I have breakfast", "in", "the morning", "Je prends le petit déjeuner le matin."),
  rtRow("I have breakfast", "at", "seven o'clock", "Je prends le petit déjeuner à sept heures.", { time: "seven" }),
  rtRow("I go to school", "in", "the morning", "Je vais à l'école le matin."),
  rtRow("I go to school", "at", "eight o'clock", "Je vais à l'école à huit heures.", { time: "eight" }),
  rtRow("I play football", "in", "the afternoon", "Je joue au football l'après-midi."),
  rtRow("I read a book", "in", "the afternoon", "Je lis un livre l'après-midi."),
  rtRow("I have lunch", "at", "one o'clock", "Je prends le déjeuner à une heure.", { time: "one" }),
  rtRow("I do my homework", "in", "the evening", "Je fais mes devoirs le soir."),
  rtRow("I do my homework", "at", "five o'clock", "Je fais mes devoirs à cinq heures.", { time: "five" }),
  rtRow("I watch television", "in", "the evening", "Je regarde la télévision le soir."),
  rtRow("I go to bed", "at", "nine o'clock", "Je me couche à neuf heures.", { time: "nine" }),
  rtRow("I go to bed", "at", "night", "Je me couche la nuit."),
  rtRow("I sleep", "at", "night", "Je dors la nuit."),
];

const rtSentence = (row: RtRow, prep: string = row.prep) => `${row.stem} ${prep} ${row.rest}.`;
const PREPS = ["at", "in", "on"] as const;
const otherPreps = (prep: string) => PREPS.filter((candidate) => candidate !== prep);

const RT_HINT_PREP = "On met at avant une heure précise et avant la nuit ; on met in avant le matin, l'après-midi et le soir.";

const RT_PHRASE_PREP: QuestionRow[] = RT_ROWS.map((row) => ({
  fact: row.key,
  prompt: "Quelle phrase est juste ?",
  answer: rtSentence(row),
  wrong: otherPreps(row.prep).map((prep) => rtSentence(row, prep)),
  hints: hints("Lis chaque phrase en entier.", RT_HINT_PREP, "Compare le petit mot qui précède l'heure ou le moment dans les trois phrases."),
}));
/** « Que veut dire … ? » : la bonne phrase française, et deux phrases d'autres actions. */
const RT_PHRASE_FR: QuestionRow[] = RT_ROWS.map((row, index) => {
  const others = RT_ROWS.filter((other) => other.stem !== row.stem);
  return {
    fact: row.key,
    prompt: `Que veut dire « ${rtSentence(row)} » ?`,
    answer: row.fr,
    wrong: [others[(index * 3) % others.length].fr, others[(index * 3 + 5) % others.length].fr],
    hints: hints("Lis la phrase anglaise, puis chaque phrase française.", "Cherche ce que fait la personne, puis quand elle le fait.", "Une seule phrase française dit les deux."),
  };
});
const RT_QCM = interleave(RT_PHRASE_PREP, RT_PHRASE_FR);

const RT_GAP_PREP: GapRow[] = RT_ROWS.map((row) => ({
  fact: row.key,
  text: `${row.stem} ___ ${row.rest}.`,
  answer: row.prep,
  wrong: otherPreps(row.prep),
  hints: hints("Lis la phrase en entier.", RT_HINT_PREP, firstLetter(row.prep)),
}));
const RT_GAP_TIME: GapRow[] = RT_ROWS.filter((row) => row.time !== undefined).map((row) => {
  const times = RT_ROWS.filter((other) => other.time !== undefined && other.time !== row.time).map((other) => other.time as string);
  return {
    fact: row.key,
    prompt: `${row.fr} Complète la phrase en anglais.`,
    text: `${row.stem} at ___ o'clock.`,
    answer: row.time as string,
    wrong: [times[0], times[2]],
    hints: hints("Lis la phrase française : un nombre dit l'heure.", "Cherche ce nombre en anglais.", firstLetter(row.time as string)),
  };
});
const RT_TROU = interleave(RT_GAP_PREP, RT_GAP_TIME);

const RT_WRITE_PREP: WriteRow[] = RT_ROWS.map((row) => ({
  fact: row.key,
  prompt: `Écris le petit mot qui manque. ${row.stem} ___ ${row.rest}.`,
  accepted: [row.prep],
  hints: hints("Lis la phrase en entier.", RT_HINT_PREP, firstLetter(row.prep)),
}));
const RT_WRITE_TIME: WriteRow[] = RT_ROWS.filter((row) => row.time !== undefined && apostrophes(`${row.fr} Écris le nombre en anglais qui manque dans ${row.stem} at ___ o'clock.`) <= 1).map((row) => ({
  fact: row.key,
  prompt: `${row.fr} Écris le nombre en anglais qui manque dans ${row.stem} at ___ o'clock.`,
  accepted: [row.time as string],
  hints: hints("Lis la phrase française : un nombre dit l'heure.", "Cherche ce nombre en anglais.", firstLetter(row.time as string)),
}));
const RT_ECRIRE = interleave(RT_WRITE_PREP, RT_WRITE_TIME);

/** Les actions d'une journée, dans l'ordre où elles se suivent. */
const RT_DAY = ["I get up at six o'clock.", "I have breakfast.", "I go to school.", "I have lunch.", "I do my homework.", "I go to bed at nine o'clock."];
const RT_DAY_PROMPT = "Range ces moments d'une journée, du premier au dernier.";
const RT_DAY_HINTS = hints("Lis toutes les phrases avant de les ranger.", "Pense à ta journée : qu'est-ce qui vient d'abord ?", "Ce qui se fait le soir ou la nuit se range à la fin.");
const RT_ORDRE: OrderRow[] = interleave(
  [0, 1, 2].map((start) => ordr(RT_DAY_PROMPT, RT_DAY.slice(start, start + 4), RT_DAY_HINTS, `rt-journee:${start}`)),
  [0, 1, 2, 3].map((start) => ordr(RT_DAY_PROMPT, RT_DAY.slice(start, start + 3), RT_DAY_HINTS, `rt-journee3:${start}`)),
  RT_ROWS.map((row) => ordr(SENTENCE_PROMPT, wordsOf(rtSentence(row)), SENTENCE_HINTS, row.key)).filter((row) => row.sequence.length >= 3),
);

const RT_CLOCKS: readonly (readonly [string, string])[] = [
  ["five o'clock", "5:00"],
  ["six o'clock", "6:00"],
  ["seven o'clock", "7:00"],
  ["eight o'clock", "8:00"],
  ["nine o'clock", "9:00"],
];
const RT_MOMENTS: readonly (readonly [string, string])[] = [
  ["the morning", "le matin"],
  ["the afternoon", "l'après-midi"],
  ["the evening", "le soir"],
  ["night", "la nuit"],
];
const RT_STEPS_FR = ["Je me lève à six heures.", "Je prends le petit déjeuner.", "Je vais à l'école.", "Je prends le déjeuner.", "Je fais mes devoirs.", "Je me couche à neuf heures."];
const RT_RELIER: LinkRow[] = interleave(
  [0, 1, 2, 3].map((start) => link("Relie chaque phrase anglaise à la même phrase en français.", [0, 1, 2].map((k) => [RT_DAY[start + k], RT_STEPS_FR[start + k]] as const), `rt-phrases:${start}`)),
  [0, 1, 2].map((start) => link("Relie chaque heure anglaise à la même heure en chiffres.", RT_CLOCKS.slice(start, start + 3), `rt-heures:${start}`)),
  [0, 1].map((start) => link("Relie chaque moment de la journée à son sens en français.", RT_MOMENTS.slice(start, start + 3), `rt-moments:${start}`)),
);

const RT_GLISSER = [
  ...sortRows("Glisse chaque mot dans la bonne case.", ["at", "in"], ["six o'clock", "seven o'clock", "eight o'clock", "night"], ["the morning", "the afternoon", "the evening"], SORT_HINTS_EN, 8),
  ...sortRows(
    SORT_PROMPT,
    ["Le matin", "Le soir et la nuit"],
    ["I get up at six o'clock.", "I have breakfast.", "I go to school."],
    ["I do my homework.", "I go to bed at nine o'clock.", "I sleep at night."],
    SORT_HINTS_EN,
    8,
  ),
];

export const makeCm1EnRtPhrase: Make = (ctx) => ce2Question(ctx, "cm1-en-rt-phrase", "choisir at ou in dans une phrase de la journée, ou son sens en français", RT_QCM, 3);
export const makeCm1EnRtTrou: Make = (ctx) => ce2Gap(ctx, "cm1-en-rt-trou", "compléter une phrase de la journée avec at, in ou une heure", RT_TROU, 2, 1);
export const makeCm1EnRtEcrire: Make = (ctx) => ce2Write(ctx, "cm1-en-rt-ecrire", "écrire at, in ou l'heure qui manque", RT_ECRIRE, 1, 2);
export const makeCm1EnRtOrdre: Make = (ctx) => ce2Order(ctx, "cm1-en-rt-ordre", "ranger les moments d'une journée ou les mots d'une phrase", RT_ORDRE);
export const makeCm1EnRtRelier: Make = (ctx) => ce2Link(ctx, "cm1-en-rt-relier", "relier une phrase, une heure ou un moment à son sens", RT_RELIER);
export const makeCm1EnRtGlisser: Make = (ctx) => ce2Sort(ctx, "cm1-en-rt-glisser", "classer les mots avec at ou in et les moments de la journée", RT_GLISSER, 2);

// ===========================================================================
// EN CE MOMENT : LE -ING (an-cm1-continuous)
// ===========================================================================

type CnVerb = { en: string; ing: string; obj: string; inf: string; frObj: string; spell: readonly [string, string] | null };
const CN_VERBS: readonly CnVerb[] = [
  { en: "read", ing: "reading", obj: "a book", inf: "lire", frObj: "un livre", spell: null },
  { en: "cook", ing: "cooking", obj: "rice", inf: "cuisiner", frObj: "du riz", spell: null },
  { en: "play", ing: "playing", obj: "football", inf: "jouer", frObj: "au football", spell: null },
  { en: "eat", ing: "eating", obj: "bread", inf: "manger", frObj: "du pain", spell: null },
  { en: "drink", ing: "drinking", obj: "water", inf: "boire", frObj: "de l'eau", spell: null },
  { en: "write", ing: "writing", obj: "a letter", inf: "écrire", frObj: "une lettre", spell: ["writeing", "writting"] },
  { en: "run", ing: "running", obj: "", inf: "courir", frObj: "", spell: ["runing", "runnig"] },
  { en: "swim", ing: "swimming", obj: "", inf: "nager", frObj: "", spell: ["swiming", "swimin"] },
  { en: "dance", ing: "dancing", obj: "", inf: "danser", frObj: "", spell: ["danceing", "dancng"] },
  { en: "sleep", ing: "sleeping", obj: "", inf: "dormir", frObj: "", spell: null },
];

type CnSubject = { text: string; be: "am" | "is" | "are"; q: string; fr: string };
const CN_SUBJECTS: readonly CnSubject[] = [
  { text: "I", be: "am", q: "I", fr: "Je suis" },
  { text: "You", be: "are", q: "you", fr: "Tu es" },
  { text: "He", be: "is", q: "he", fr: "Il est" },
  { text: "She", be: "is", q: "she", fr: "Elle est" },
  { text: "It", be: "is", q: "it", fr: "Il est" },
  { text: "We", be: "are", q: "we", fr: "Nous sommes" },
  { text: "They", be: "are", q: "they", fr: "Ils sont" },
  { text: "Awa", be: "is", q: "Awa", fr: "Awa est" },
];
const BES = ["am", "is", "are"] as const;
const otherBes = (be: string) => BES.filter((candidate) => candidate !== be);

const cnOk = (subject: CnSubject, verb: CnVerb) => subject.text !== "It" || ["eat", "drink", "sleep", "run", "swim"].includes(verb.en);
type CnRow = { p: CnSubject; v: CnVerb; key: string };
/** Trente lignes : chaque verbe avec trois sujets qui tournent (« It » seulement avec un verbe qui lui va). */
const CN_ROWS: readonly CnRow[] = CN_VERBS.flatMap((v, vi) => {
  const picked: CnSubject[] = [];
  for (let step = 0; picked.length < 3; step++) {
    const p = CN_SUBJECTS[(vi * 3 + step * 3 + Math.floor(step / 2)) % CN_SUBJECTS.length];
    if (cnOk(p, v) && !picked.includes(p)) picked.push(p);
    if (step > 30) break;
  }
  return picked.map((p) => ({ p, v, key: `cn:${v.en}:${p.text}` }));
});

const cnSentence = (p: CnSubject, v: CnVerb, tail = "") => `${p.text} ${p.be} ${v.ing}${withObj(v.obj)}${tail}.`;
const cnQuestion = (p: CnSubject, v: CnVerb) => `${p.be === "am" ? "Am" : p.be === "is" ? "Is" : "Are"} ${p.q} ${v.ing}${withObj(v.obj)}?`;
const cnFrench = (p: CnSubject, v: CnVerb) => `${p.fr} en train ${startsWithVowel(v.inf) ? "d'" : "de "}${v.inf}${withObj(v.frObj)}.`;

const CN_PHRASE_POS: QuestionRow[] = CN_ROWS.map(({ p, v, key }) => ({
  fact: key,
  prompt: "Quelle phrase est juste ?",
  answer: cnSentence(p, v),
  wrong: [`${p.text} ${v.ing}${withObj(v.obj)}.`, `${p.text} ${p.be} ${v.en}${withObj(v.obj)}.`],
  hints: hints("Lis chaque phrase en entier.", "Pour dire ce qui se passe en ce moment, il faut le verbe être, puis le verbe en -ing.", "Cherche la phrase qui a les deux."),
}));
const CN_PHRASE_SPELL: QuestionRow[] = CN_ROWS.filter((row) => row.v.spell !== null).map(({ p, v, key }) => ({
  fact: key,
  prompt: "Quelle phrase est juste ?",
  answer: cnSentence(p, v),
  wrong: (v.spell as readonly [string, string]).map((wrong) => `${p.text} ${p.be} ${wrong}${withObj(v.obj)}.`),
  hints: hints("Lis chaque phrase en entier.", "Regarde bien comment le verbe change avant -ing : une lettre double ou disparaît.", "Compare la fin du verbe dans les trois phrases."),
}));
const CN_PHRASE_NOW: QuestionRow[] = CN_ROWS.map(({ p, v, key }) => ({
  fact: key,
  prompt: "Quelle phrase dit ce qui se passe en ce moment ?",
  answer: cnSentence(p, v, " now"),
  wrong: [`${p.text} ${v.ing}${withObj(v.obj)} now.`, `${p.text} ${p.be} ${v.en}${withObj(v.obj)} now.`],
  hints: hints("Lis chaque phrase en entier.", "Le mot qui dit maintenant va avec le verbe être et le verbe en -ing.", "Cherche la phrase qui a les deux."),
}));
const CN_QCM = interleave(CN_PHRASE_POS, CN_PHRASE_SPELL, CN_PHRASE_NOW);

const CN_GAP_BE: GapRow[] = CN_ROWS.map(({ p, v, key }) => ({
  fact: key,
  text: `${p.text} ___ ${v.ing}${withObj(v.obj)}.`,
  answer: p.be,
  wrong: otherBes(p.be),
  hints: hints("Lis la phrase en entier.", "Le verbe être change de forme avec le sujet : cherche celle qui lui va.", firstLetter(p.be)),
}));
const CN_GAP_ING: GapRow[] = CN_ROWS.map(({ p, v, key }) => ({
  fact: key,
  text: `${p.text} ${p.be} ___${withObj(v.obj)}.`,
  answer: v.ing,
  wrong: [v.en, `${v.en}s`],
  hints: hints("Lis la phrase en entier.", "Après le verbe être, le verbe finit par -ing.", firstLetter(v.ing)),
}));
const CN_GAP_SPELL: GapRow[] = CN_ROWS.filter((row) => row.v.spell !== null).map(({ p, v, key }) => ({
  fact: key,
  text: `${p.text} ${p.be} ___${withObj(v.obj)}.`,
  answer: v.ing,
  wrong: v.spell as readonly [string, string],
  hints: hints("Lis la phrase en entier.", "Regarde bien comment le verbe change avant -ing : une lettre double ou disparaît.", firstLetter(v.ing)),
}));
/** « maintenant » appelle am, is ou are + -ing ; « tous les jours » appelle le présent simple. */
const CN_GAP_MARKER: GapRow[] = CN_ROWS.filter((_, index) => index % 2 === 0).flatMap(({ p, v, key }, index) => {
  const third = p.be === "is";
  const simple = third ? (v.en === "go" ? "goes" : `${v.en}s`) : v.en;
  return index % 2 === 0
    ? [{ fact: key, text: `${p.text} ___${withObj(v.obj)} now.`, answer: `${p.be} ${v.ing}`, wrong: [simple, v.ing], hints: hints("Lis la phrase en entier.", "Le mot qui dit maintenant appelle le verbe être, puis le verbe en -ing.", "Cherche la forme qui a les deux.") }]
    : [{ fact: key, text: `${p.text} ___${withObj(v.obj)} every day.`, answer: simple, wrong: [`${p.be} ${v.ing}`, v.ing], hints: hints("Lis la phrase en entier.", "Pour une habitude de chaque jour, on dit le verbe tout simple.", "Cherche la forme sans être et sans -ing.") }];
});
const CN_TROU = interleave(CN_GAP_BE, CN_GAP_ING, CN_GAP_SPELL, CN_GAP_MARKER);

const CN_WRITE_BE: WriteRow[] = CN_ROWS.map(({ p, v, key }) => ({
  fact: key,
  prompt: `Écris le verbe être qui manque. ${p.text} ___ ${v.ing}${withObj(v.obj)}.`,
  accepted: [p.be],
  hints: hints("Cherche le sujet de la phrase.", "Chaque sujet a sa forme du verbe être.", firstLetter(p.be)),
}));
const CN_WRITE_ING: WriteRow[] = CN_ROWS.map(({ p, v, key }) => ({
  fact: key,
  prompt: `${cnFrench(p, v)} Écris le verbe en -ing qui manque dans ${p.text} ${p.be} ___${withObj(v.obj)}.`,
  accepted: [v.ing],
  hints: hints("Pense à ce que dit la phrase française.", "Après le verbe être, le verbe finit par -ing.", firstLetter(v.ing)),
}));
const CN_ECRIRE = interleave(CN_WRITE_BE, CN_WRITE_ING);

const CN_ORDRE: OrderRow[] = interleave(
  CN_ROWS.filter((_, index) => index % 2 === 0).map(({ p, v, key }) => ordr(SENTENCE_PROMPT, wordsOf(cnSentence(p, v)), SENTENCE_HINTS, key)),
  CN_ROWS.filter((_, index) => index % 2 === 1).map(({ p, v, key }) => ordr(QUESTION_PROMPT, wordsOf(cnQuestion(p, v)), QUESTION_HINTS, key)),
  [
    ordr(QUESTION_PROMPT, wordsOf("What are you doing?"), QUESTION_HINTS, "cn-doing:you"),
    ordr(QUESTION_PROMPT, wordsOf("What is she doing?"), QUESTION_HINTS, "cn-doing:she"),
    ordr(QUESTION_PROMPT, wordsOf("What are they doing?"), QUESTION_HINTS, "cn-doing:they"),
    ordr(QUESTION_PROMPT, wordsOf("What is he doing?"), QUESTION_HINTS, "cn-doing:he"),
  ],
).filter((row) => row.sequence.length >= 3);

const CN_RELIER: LinkRow[] = interleave(
  CN_VERBS.map((_, i) => link("Relie chaque verbe à sa forme en -ing.", [0, 1, 2, 3].map((k) => CN_VERBS[(i + k) % 10]).map((v) => [v.en, v.ing] as const), `cn-formes:${i}`)),
  CN_SUBJECTS.filter((p) => p.text !== "It").flatMap((p) =>
    trios(CN_ROWS.filter((row) => row.p === p), 1).map((trio) =>
      link("Relie chaque phrase anglaise à la même phrase en français.", trio.map((row) => [cnSentence(row.p, row.v), cnFrench(row.p, row.v)] as const), `cn-phrases:${trio[0].key}`),
    ),
  ),
);

const CN_GLISSER = [
  ...sortRows(
    SORT_PROMPT,
    ["Habitude", "En ce moment"],
    ["I play football every day.", "We eat rice every day.", "They read a book every day.", "You drink water every day."],
    ["I am playing football now.", "We are eating rice now.", "They are reading a book now.", "You are drinking water now."],
    SORT_HINTS_EN,
    8,
  ),
  ...sortRows("Glisse chaque mot dans la bonne case.", ["On double la lettre", "On enlève le e"], ["running", "swimming"], ["writing", "dancing"], SORT_HINTS_EN, 8),
  ...sortRows("Glisse chaque sujet dans la bonne case.", ["is", "are"], ["He", "She", "It", "Awa"], ["You", "We", "They", "Awa and Moussa"], SORT_HINTS_EN, 8),
];

export const makeCm1EnCnPhrase: Make = (ctx) => ce2Question(ctx, "cm1-en-cn-phrase", "choisir la bonne phrase au présent continu", CN_QCM, 3);
export const makeCm1EnCnTrou: Make = (ctx) => ce2Gap(ctx, "cm1-en-cn-trou", "compléter une phrase au présent continu", CN_TROU, 2, 1);
export const makeCm1EnCnEcrire: Make = (ctx) => ce2Write(ctx, "cm1-en-cn-ecrire", "écrire am, is, are ou le verbe en -ing", CN_ECRIRE, 1, 2);
export const makeCm1EnCnOrdre: Make = (ctx) => ce2Order(ctx, "cm1-en-cn-ordre", "remettre les mots d'une phrase ou d'une question au présent continu", CN_ORDRE);
export const makeCm1EnCnRelier: Make = (ctx) => ce2Link(ctx, "cm1-en-cn-relier", "relier un verbe à sa forme en -ing ou une phrase à son sens", CN_RELIER);
export const makeCm1EnCnGlisser: Make = (ctx) => ce2Sort(ctx, "cm1-en-cn-glisser", "classer les habitudes, les actions en cours, l'orthographe du -ing et les sujets", CN_GLISSER, 2);
