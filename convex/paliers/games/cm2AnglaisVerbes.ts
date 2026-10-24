/**
 * LES GABARITS D'ANGLAIS DU CM2, LES VERBES : le verbe être au passé (was, were), le passé des verbes réguliers (-ed), le passé des verbes
 * irréguliers, le futur proche (going to) (`an-cm2-was-were`, `an-cm2-past-regular`, `an-cm2-past-irregular`, `an-cm2-going-to`).
 *
 * Le modèle écrivait ici « She were at home », « Did you played ? », « I goed to the market », « He is going to eats ». Ici une phrase se
 * DÉDUIT d'un sujet, d'un verbe, d'un complément et d'un repère de temps pris dans des tables fermées : was ou were, did suivi de l'infinitif,
 * am, is ou are devant going to sont ceux de la règle, et les mauvais choix sont les fautes d'enfant de la fiche (was pour were, le verbe au
 * passé après did, le passé régularisé « goed », le s ou le -ing après going to). Une phrase juste n'est jamais proposée comme mauvais choix.
 *
 * Les thématiques ont TROIS, QUATRE, QUATRE et TROIS paliers : chaque gabarit donne à chaque palier sa part de la liste (`ce2Outils`). Les
 * lignes sont mêlées (`cm2EnInterleave`) pour qu'un palier voie des phrases, des négations, des questions et des réponses.
 *
 * HORS FICHE, À FAIRE RELIRE PAR UN PROFESSEUR D'ANGLAIS
 * - Les compléments (at home, at the mosque, in the street ; play football, cook rice, help a friend, clean the house, listen to the radio ;
 *   buy a mango, make a cake, take the bus, come to the party), les prénoms (Awa, Moussa), « My friends », « It was hot / cold », et les repères
 *   de temps (last night, last Sunday).
 * - Le français de chaque phrase (« J'étais à la maison hier. », « Ils ont acheté une mangue il y a deux jours. », « Elle est allée au marché. »,
 *   « Je vais cuisiner du riz demain. ») ; le passé composé tient lieu de passé simple ; « allé, venu » ne sont donnés qu'à un sujet dont on connaît
 *   le genre (he, she, they, Awa, Moussa), jamais à I, you, we.
 * - Les fautes d'enfant des mauvais choix (« I goed », « He is going to plays ») ; le verbe seul « dance » sans complément.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { ce2Gap, ce2Link, ce2Order, ce2Question, ce2Sort, ce2Write, hints, ordr, sortRows, type GapRow, type LinkRow, type OrderRow, type QuestionRow, type WriteRow } from "./ce2Outils";
import {
  CM2_EN_QUESTION_HINTS,
  CM2_EN_QUESTION_PROMPT,
  CM2_EN_REPLY_HINTS,
  CM2_EN_SENTENCE_HINTS,
  CM2_EN_SENTENCE_PROMPT,
  CM2_EN_SORT_HINTS,
  CM2_EN_SORT_PROMPT,
  cm2EnApostrophes,
  cm2EnCap,
  cm2EnFirstLetter,
  cm2EnInterleave,
  cm2EnLink,
  cm2EnTrios,
  cm2EnWithObj,
  cm2EnWordsOf,
} from "./cm2AnglaisOutils";
import type { GameContext, GeneratedGame } from "./shared";

type Make = (ctx: GameContext) => GeneratedGame;
type Time = { en: string; fr: string };

/** Une phrase se range en 3 à 8 tuiles : moins, il n'y a rien à ranger ; plus, l'écran d'un enfant ne s'y retrouve pas. */
const tiles = (sentence: string) => sentence.split(" ").length >= 3 && sentence.split(" ").length <= 8;

/** Le verbe être au passé qui va avec le pronom d'une réponse courte : « Yes, I was. », « Yes, you were. ». */
const wasOrWere = (pronoun: string) => (["I", "he", "she", "it"].includes(pronoun) ? "was" : "were");
/** Le verbe être au présent qui va avec le pronom d'une réponse courte : « Yes, I am. », « Yes, you are. ». */
const amIsAre = (pronoun: string) => (pronoun === "I" ? "am" : ["he", "she", "it"].includes(pronoun) ? "is" : "are");
/** Un verbe être faux avec ce sujet, jamais une forme juste : « Is we », « Are he », « Am you ». */
const wrongBe = (be: string) => (be === "am" ? "is" : be === "is" ? "are" : "am");

/** Les huit sujets des temps du passé et du futur proche, avec leur français. */
type Subj = {
  t: string;
  q: string;
  ans: string;
  /** « J'ai », « Awa a » : l'auxiliaire du passé composé avec avoir. */
  av: string;
  /** « Il est », « Ils sont » : l'auxiliaire avec être, seulement quand le genre est connu. */
  etre: string | null;
  g: "m" | "f" | "p" | null;
  be: "am" | "is" | "are";
  /** « Je vais », « Nous allons » : le futur proche. */
  vaFr: string;
  third: boolean;
};
const SUBJ8: readonly Subj[] = [
  { t: "I", q: "I", ans: "you", av: "J'ai", etre: null, g: null, be: "am", vaFr: "Je vais", third: false },
  { t: "You", q: "you", ans: "I", av: "Tu as", etre: null, g: null, be: "are", vaFr: "Tu vas", third: false },
  { t: "He", q: "he", ans: "he", av: "Il a", etre: "Il est", g: "m", be: "is", vaFr: "Il va", third: true },
  { t: "She", q: "she", ans: "she", av: "Elle a", etre: "Elle est", g: "f", be: "is", vaFr: "Elle va", third: true },
  { t: "We", q: "we", ans: "we", av: "Nous avons", etre: null, g: null, be: "are", vaFr: "Nous allons", third: false },
  { t: "They", q: "they", ans: "they", av: "Ils ont", etre: "Ils sont", g: "p", be: "are", vaFr: "Ils vont", third: false },
  { t: "Awa", q: "Awa", ans: "she", av: "Awa a", etre: "Awa est", g: "f", be: "is", vaFr: "Awa va", third: true },
  { t: "Moussa", q: "Moussa", ans: "he", av: "Moussa a", etre: "Moussa est", g: "m", be: "is", vaFr: "Moussa va", third: true },
];

// ===========================================================================
// HIER : WAS ET WERE (an-cm2-was-were)
// ===========================================================================

type WvWho = { t: string; q: string; ans: string; be: "was" | "were"; present: string; fr: string; order: boolean };
const WV_WHO: readonly WvWho[] = [
  { t: "I", q: "I", ans: "you", be: "was", present: "am", fr: "J'étais", order: true },
  { t: "You", q: "you", ans: "I", be: "were", present: "are", fr: "Tu étais", order: true },
  { t: "He", q: "he", ans: "he", be: "was", present: "is", fr: "Il était", order: true },
  { t: "She", q: "she", ans: "she", be: "was", present: "is", fr: "Elle était", order: true },
  { t: "We", q: "we", ans: "we", be: "were", present: "are", fr: "Nous étions", order: true },
  { t: "They", q: "they", ans: "they", be: "were", present: "are", fr: "Ils étaient", order: true },
  { t: "Awa", q: "Awa", ans: "she", be: "was", present: "is", fr: "Awa était", order: true },
  { t: "Moussa", q: "Moussa", ans: "he", be: "was", present: "is", fr: "Moussa était", order: true },
  { t: "Awa and Moussa", q: "Awa and Moussa", ans: "they", be: "were", present: "are", fr: "Awa et Moussa étaient", order: false },
  { t: "My friends", q: "my friends", ans: "they", be: "were", present: "are", fr: "Mes amis étaient", order: true },
];
const WV_IT: WvWho = { t: "It", q: "it", ans: "it", be: "was", present: "is", fr: "Il faisait", order: true };
const WV_PLACES: readonly Time[] = [
  { en: "at home", fr: "à la maison" },
  { en: "at school", fr: "à l'école" },
  { en: "at the market", fr: "au marché" },
  { en: "in the garden", fr: "dans le jardin" },
  { en: "at the mosque", fr: "à la mosquée" },
  { en: "in the street", fr: "dans la rue" },
];
const WV_WEATHER: readonly Time[] = [
  { en: "hot", fr: "chaud" },
  { en: "cold", fr: "froid" },
];
const WV_TIMES: readonly Time[] = [
  { en: "yesterday", fr: "hier" },
  { en: "last night", fr: "hier soir" },
  { en: "last week", fr: "la semaine dernière" },
  { en: "last Sunday", fr: "dimanche dernier" },
];

type WvRow = { who: WvWho; comp: Time; time: Time; key: string };
const WV_ROWS: readonly WvRow[] = [
  ...WV_WHO.flatMap((who, wi) =>
    [0, 1, 2, 3].map((k) => ({ who, comp: WV_PLACES[(wi + k) % 6], time: WV_TIMES[(wi + k) % 4], key: `wv:${who.t}:${(wi + k) % 6}` })),
  ),
  ...[0, 1, 2, 3].map((k) => ({ who: WV_IT, comp: WV_WEATHER[k % 2], time: WV_TIMES[k], key: `wv:It:${k}` })),
];

const wvRest = (r: WvRow) => `${r.comp.en} ${r.time.en}`;
const wvPos = (r: WvRow) => `${r.who.t} ${r.who.be} ${wvRest(r)}.`;
const wvNeg = (r: WvRow) => `${r.who.t} ${r.who.be} not ${wvRest(r)}.`;
const wvQuestion = (r: WvRow) => `${cm2EnCap(r.who.be)} ${r.who.q} ${wvRest(r)}?`;
const wvYes = (r: WvRow) => `Yes, ${r.who.ans} ${wasOrWere(r.who.ans)}.`;
const wvNo = (r: WvRow) => `No, ${r.who.ans} ${wasOrWere(r.who.ans)} not.`;
const wvOther = (be: string) => (be === "was" ? "were" : "was");
const wvFrench = (r: WvRow) => `${r.who.fr} ${r.comp.fr} ${r.time.fr}.`;
const wvWithFrench = WV_ROWS.filter((r) => cm2EnApostrophes(wvFrench(r)) <= 1);
const wvLetters = (be: string) => hints("Lis la phrase en entier.", "Un repère de temps passé demande le verbe être au passé.", `Avec ce sujet, le verbe être a ${be === "was" ? "trois" : "quatre"} lettres.`);

const WV_PHRASE_POS: QuestionRow[] = WV_ROWS.map((r) => ({
  fact: r.key,
  prompt: "Quelle phrase est juste ?",
  answer: wvPos(r),
  wrong: [`${r.who.t} ${wvOther(r.who.be)} ${wvRest(r)}.`, `${r.who.t} ${r.who.present} ${wvRest(r)}.`],
  hints: wvLetters(r.who.be),
}));
const WV_PHRASE_NEG: QuestionRow[] = WV_ROWS.map((r) => ({
  fact: r.key,
  prompt: `Quelle phrase dit le contraire de « ${wvPos(r)} » ?`,
  answer: wvNeg(r),
  wrong: [`${r.who.t} ${r.who.be} no ${wvRest(r)}.`, `${r.who.t} did not ${r.who.be} ${wvRest(r)}.`],
  hints: hints("Pour dire le contraire, on ajoute un petit mot après le verbe être.", "Le petit mot de la négation vient juste après le verbe être.", "Ce petit mot s'écrit avec trois lettres."),
}));
const WV_PHRASE_QUESTION: QuestionRow[] = WV_ROWS.map((r) => ({
  fact: r.key,
  prompt: "Quelle question est juste ?",
  answer: wvQuestion(r),
  wrong: [`Did ${r.who.q} ${r.who.be} ${wvRest(r)}?`, `${cm2EnCap(r.who.present)} ${r.who.q} ${wvRest(r)}?`],
  hints: hints("Lis chaque question en entier.", "Dans une question, le verbe être passe avant le sujet.", "Un repère de temps passé demande le verbe être au passé."),
}));
const WV_PHRASE_REPLY: QuestionRow[] = WV_ROWS.map((r, index) => {
  const yes = index % 2 === 0;
  const ans = r.who.ans;
  const be = wasOrWere(ans);
  return {
    fact: r.key,
    prompt: `On te demande « ${wvQuestion(r)} ». Tu réponds ${yes ? "oui" : "non"}. Quelle est la bonne réponse ?`,
    answer: yes ? wvYes(r) : wvNo(r),
    wrong: yes ? [`Yes, ${ans} ${wvOther(be)}.`, `Yes, ${ans} did.`] : [`No, ${ans} ${wvOther(be)} not.`, `No, ${ans} did not.`],
    hints: CM2_EN_REPLY_HINTS,
  };
});
const WV_QCM = cm2EnInterleave(WV_PHRASE_POS, WV_PHRASE_NEG, WV_PHRASE_QUESTION, WV_PHRASE_REPLY);

const WV_GAP_POS: GapRow[] = WV_ROWS.map((r) => ({
  fact: r.key,
  text: `${r.who.t} ___ ${wvRest(r)}.`,
  answer: r.who.be,
  wrong: [wvOther(r.who.be), r.who.present],
  hints: wvLetters(r.who.be),
}));
const WV_GAP_NEG: GapRow[] = WV_ROWS.filter((_, i) => i % 2 === 0).map((r) => ({
  fact: r.key,
  text: `${r.who.t} ___ not ${wvRest(r)}.`,
  answer: r.who.be,
  wrong: [wvOther(r.who.be), r.who.present],
  hints: wvLetters(r.who.be),
}));
const WV_GAP_QUESTION: GapRow[] = WV_ROWS.filter((_, i) => i % 2 === 1).map((r) => ({
  fact: r.key,
  text: `___ ${r.who.q} ${wvRest(r)}?`,
  answer: cm2EnCap(r.who.be),
  wrong: ["Did", cm2EnCap(r.who.present)],
  hints: hints("Lis la question en entier.", "Une question sur hier commence par le verbe être au passé.", `Avec ce sujet, le verbe être a ${r.who.be === "was" ? "trois" : "quatre"} lettres.`),
}));
const WV_GAP_FRENCH: GapRow[] = wvWithFrench.map((r) => ({
  fact: r.key,
  prompt: `${wvFrench(r)} Complète la phrase en anglais.`,
  text: `${r.who.t} ___ ${wvRest(r)}.`,
  answer: r.who.be,
  wrong: [wvOther(r.who.be), r.who.present],
  hints: wvLetters(r.who.be),
}));
const WV_TROU = cm2EnInterleave(WV_GAP_POS, WV_GAP_NEG, WV_GAP_QUESTION, WV_GAP_FRENCH);

const WV_WRITE_FRENCH: WriteRow[] = wvWithFrench.map((r) => ({
  fact: r.key,
  prompt: `${wvFrench(r)} Écris le mot anglais qui manque dans ${r.who.t} ___ ${wvRest(r)}.`,
  accepted: [r.who.be],
  hints: wvLetters(r.who.be),
}));
const WV_WRITE_NEG: WriteRow[] = WV_ROWS.filter((_, i) => i % 2 === 0).map((r) => ({
  fact: r.key,
  prompt: `Écris le petit mot qui manque. ${r.who.t} ___ not ${wvRest(r)}.`,
  accepted: [r.who.be],
  hints: wvLetters(r.who.be),
}));
const WV_WRITE_QUESTION: WriteRow[] = WV_ROWS.filter((_, i) => i % 2 === 1).map((r) => ({
  fact: r.key,
  prompt: `Écris le premier mot de la question. ___ ${r.who.q} ${wvRest(r)}?`,
  accepted: [cm2EnCap(r.who.be), r.who.be],
  hints: hints("Lis la question en entier.", "Une question sur hier commence par le verbe être au passé.", `Avec ce sujet, le verbe être a ${r.who.be === "was" ? "trois" : "quatre"} lettres.`),
}));
const WV_ECRIRE = cm2EnInterleave(WV_WRITE_FRENCH, WV_WRITE_NEG, WV_WRITE_QUESTION);

const wvOrderable = WV_ROWS.filter((r) => r.who.order);
const WV_ORDRE: OrderRow[] = cm2EnInterleave(
  wvOrderable.filter((r) => tiles(wvPos(r))).map((r) => ordr(CM2_EN_SENTENCE_PROMPT, cm2EnWordsOf(wvPos(r)), CM2_EN_SENTENCE_HINTS, r.key)),
  wvOrderable.filter((r) => tiles(wvNeg(r))).map((r) => ordr(CM2_EN_SENTENCE_PROMPT, cm2EnWordsOf(wvNeg(r)), CM2_EN_SENTENCE_HINTS, r.key)),
  wvOrderable.filter((r) => tiles(wvQuestion(r))).map((r) => ordr(CM2_EN_QUESTION_PROMPT, cm2EnWordsOf(wvQuestion(r)), CM2_EN_QUESTION_HINTS, r.key)),
);

const WV_RELIER: LinkRow[] = cm2EnInterleave(
  cm2EnTrios(wvWithFrench, 4).map((trio) => cm2EnLink("Relie chaque phrase anglaise à la même phrase en français.", trio.map((r) => [wvPos(r), wvFrench(r)] as const), `wv-phrases:${trio[0].key}`)),
  [0, 1, 2, 3].map((i) => cm2EnLink("Relie chaque repère de temps à son sens.", [0, 1, 2].map((k) => WV_TIMES[(i + k) % 4]).map((t) => [t.en, t.fr] as const), `wv-temps:${i}`)),
  [0, 1, 2, 3, 4, 5].map((i) => cm2EnLink("Relie chaque lieu à son sens.", [0, 1, 2].map((k) => WV_PLACES[(i + k) % 6]).map((p) => [p.en, p.fr] as const), `wv-lieux:${i}`)),
);

const WV_GLISSER = [
  ...sortRows("Glisse chaque sujet dans la bonne case.", ["was", "were"], ["I", "He", "She", "It", "Awa", "Moussa"], ["You", "We", "They", "My friends", "Awa and Moussa"], CM2_EN_SORT_HINTS, 8),
  ...sortRows(
    CM2_EN_SORT_PROMPT,
    ["Phrase positive", "Phrase négative"],
    [0, 7, 14, 21, 28, 35].map((i) => wvPos(WV_ROWS[i])),
    [3, 10, 17, 24, 31, 38].map((i) => wvNeg(WV_ROWS[i])),
    CM2_EN_SORT_HINTS,
    8,
  ),
  ...sortRows(
    CM2_EN_SORT_PROMPT,
    ["Je demande", "Je réponds"],
    [1, 8, 15].map((i) => wvQuestion(WV_ROWS[i])),
    [2, 9, 16, 23].map((i) => (i % 2 === 0 ? wvYes(WV_ROWS[i]) : wvNo(WV_ROWS[i]))),
    CM2_EN_SORT_HINTS,
    6,
  ),
];

export const makeCm2EnWvPhrase: Make = (ctx) => ce2Question(ctx, "cm2-en-wv-phrase", "choisir la bonne phrase avec was ou were", WV_QCM, 3);
export const makeCm2EnWvTrou: Make = (ctx) => ce2Gap(ctx, "cm2-en-wv-trou", "compléter une phrase avec was ou were", WV_TROU, 2, 1);
export const makeCm2EnWvEcrire: Make = (ctx) => ce2Write(ctx, "cm2-en-wv-ecrire", "écrire was ou were", WV_ECRIRE, 1, 2);
export const makeCm2EnWvOrdre: Make = (ctx) => ce2Order(ctx, "cm2-en-wv-ordre", "remettre les mots d'une phrase ou d'une question avec was ou were", WV_ORDRE);
export const makeCm2EnWvRelier: Make = (ctx) => ce2Link(ctx, "cm2-en-wv-relier", "relier une phrase, un repère de temps ou un lieu à son sens en français", WV_RELIER);
export const makeCm2EnWvGlisser: Make = (ctx) => ce2Sort(ctx, "cm2-en-wv-glisser", "classer les sujets, les phrases positives et négatives, les questions et les réponses", WV_GLISSER, 2);

// ===========================================================================
// HIER : LE PASSÉ DES VERBES RÉGULIERS ET IRRÉGULIERS (an-cm2-past-regular, an-cm2-past-irregular)
// ===========================================================================

type PastVerb = {
  en: string;
  past: string;
  ing: string;
  obj: string;
  inf: string;
  /** Le participe du passé composé français (« joué ») ; « mangé du riz ». */
  pp: string;
  frObj: string;
  /** La forme que l'enfant écrit à tort (« goed »), sinon le passé de la règle posé après did. */
  naive?: string;
  /** Deux fautes d'orthographe du passé (« studyed »), pour le trou d'orthographe. */
  typo?: readonly [string, string];
  /** « allé, allée, allés » : les verbes qui se conjuguent avec être. */
  etre?: { m: string; f: string; p: string };
};
type PastRow = { s: Subj; v: PastVerb; time: Time; key: string };

const PAST_TIMES: readonly Time[] = [
  { en: "yesterday", fr: "hier" },
  { en: "last week", fr: "la semaine dernière" },
  { en: "two days ago", fr: "il y a deux jours" },
];

function pastTopic(tag: string, verbs: readonly PastVerb[], regular: boolean) {
  const rows: PastRow[] = verbs.flatMap((v, vi) => [0, 1, 2].map((k) => ({ s: SUBJ8[(vi + k * 3) % 8], v, time: PAST_TIMES[(vi + k) % 3], key: `${tag}:${v.en}:${SUBJ8[(vi + k * 3) % 8].t}` })));

  const tail = (r: PastRow) => `${cm2EnWithObj(r.v.obj)} ${r.time.en}`;
  const pos = (r: PastRow) => `${r.s.t} ${r.v.past}${tail(r)}.`;
  const neg = (r: PastRow) => `${r.s.t} did not ${r.v.en}${tail(r)}.`;
  const question = (r: PastRow) => `Did ${r.s.q} ${r.v.en}${tail(r)}?`;
  const yes = (r: PastRow) => `Yes, ${r.s.ans} did.`;
  const no = (r: PastRow) => `No, ${r.s.ans} did not.`;
  const french = (r: PastRow): string | null => {
    if (r.v.etre) return r.s.etre === null || r.s.g === null ? null : `${r.s.etre} ${r.v.etre[r.s.g]}${cm2EnWithObj(r.v.frObj)} ${r.time.fr}.`;
    return `${r.s.av} ${r.v.pp}${cm2EnWithObj(r.v.frObj)} ${r.time.fr}.`;
  };
  const withFrench = rows.filter((r) => {
    const text = french(r);
    return text !== null && cm2EnApostrophes(text) <= 1;
  });
  const fr = (r: PastRow) => french(r) as string;
  const form = regular
    ? hints("Lis la phrase en entier.", "Un repère de temps passé veut un verbe au passé.", "Le passé d'un verbe régulier finit par ed.")
    : hints("Lis la phrase en entier.", "Un repère de temps passé veut un verbe au passé.", "Ce verbe est irrégulier : son passé s'apprend par cœur.");
  const didHint = hints("Lis la phrase en entier.", "Pour dire non au passé, on met un petit mot, puis not, puis le verbe.", "Ce petit mot commence et finit par la même lettre.");

  const posWrong = (r: PastRow) => [`${r.s.t} ${r.v.en}${tail(r)}.`, r.v.naive ? `${r.s.t} ${r.v.naive}${tail(r)}.` : `${r.s.t} did ${r.v.past}${tail(r)}.`];
  const PHRASE_POS: QuestionRow[] = rows.map((r) => ({ fact: r.key, prompt: "Quelle phrase est juste ?", answer: pos(r), wrong: posWrong(r), hints: form }));
  const PHRASE_NEG: QuestionRow[] = rows.map((r) => ({
    fact: r.key,
    prompt: `Quelle phrase dit le contraire de « ${pos(r)} » ?`,
    answer: neg(r),
    wrong: [`${r.s.t} did not ${r.v.past}${tail(r)}.`, `${r.s.t} not ${r.v.past}${tail(r)}.`],
    hints: hints("Pour dire le contraire, on ajoute deux petits mots avant le verbe.", "Après ces deux petits mots, le verbe revient à sa forme de base.", "La bonne phrase a did, puis not, puis le verbe sans passé."),
  }));
  const PHRASE_QUESTION: QuestionRow[] = rows.map((r) => ({
    fact: r.key,
    prompt: "Quelle question est juste ?",
    answer: question(r),
    wrong: [`Did ${r.s.q} ${r.v.past}${tail(r)}?`, `Do ${r.s.q} ${r.v.en}${tail(r)}?`],
    hints: hints("Lis chaque question en entier.", "Une question sur hier commence par un petit mot du passé.", "Après le sujet, le verbe revient à sa forme de base."),
  }));
  const PHRASE_REPLY: QuestionRow[] = rows.map((r, index) => {
    const ok = index % 2 === 0;
    return {
      fact: r.key,
      prompt: `On te demande « ${question(r)} ». Tu réponds ${ok ? "oui" : "non"}. Quelle est la bonne réponse ?`,
      answer: ok ? yes(r) : no(r),
      wrong: ok ? [`Yes, ${r.s.ans} do.`, `Yes, ${r.s.ans} ${wasOrWere(r.s.ans)}.`] : [`No, ${r.s.ans} do not.`, `No, ${r.s.ans} did no.`],
      hints: CM2_EN_REPLY_HINTS,
    };
  });
  const QCM = cm2EnInterleave(PHRASE_POS, PHRASE_NEG, PHRASE_QUESTION, PHRASE_REPLY);

  const GAP_FORM: GapRow[] = rows.map((r) => ({
    fact: r.key,
    text: `${r.s.t} ___${tail(r)}.`,
    answer: r.v.past,
    wrong: [r.v.en, r.v.naive ?? r.v.ing],
    hints: form,
  }));
  const GAP_TYPO: GapRow[] = rows
    .filter((r) => r.v.typo)
    .map((r) => ({
      fact: r.key,
      text: `${r.s.t} ___${tail(r)}.`,
      answer: r.v.past,
      wrong: [r.v.typo![0], r.v.typo![1]],
      hints: hints("Lis la phrase en entier.", "Un repère de temps passé veut un verbe au passé.", cm2EnFirstLetter(r.v.past)),
    }));
  const GAP_AUX: GapRow[] = rows.filter((_, i) => i % 2 === 0).map((r) => ({ fact: r.key, text: `${r.s.t} ___ not ${r.v.en}${tail(r)}.`, answer: "did", wrong: ["do", "was"], hints: didHint }));
  const GAP_QUESTION: GapRow[] = rows
    .filter((_, i) => i % 2 === 1)
    .map((r) => ({
      fact: r.key,
      text: `___ ${r.s.q} ${r.v.en}${tail(r)}?`,
      answer: "Did",
      wrong: ["Do", "Does"],
      hints: hints("Lis la question en entier.", "Une question sur hier commence par un petit mot du passé.", "Ce petit mot commence et finit par la même lettre."),
    }));
  const GAP_BASE: GapRow[] = rows
    .filter((_, i) => i % 3 === 0)
    .map((r) => ({
      fact: r.key,
      text: `Did ${r.s.q} ___${tail(r)}?`,
      answer: r.v.en,
      wrong: [r.v.past, r.v.ing],
      hints: hints("Lis la question en entier.", "Après le petit mot du passé, le verbe revient à sa forme de base.", cm2EnFirstLetter(r.v.en)),
    }));
  const GAP_FRENCH: GapRow[] = withFrench.map((r) => ({
    fact: r.key,
    prompt: `${fr(r)} Complète la phrase en anglais.`,
    text: `${r.s.t} ___${tail(r)}.`,
    answer: r.v.past,
    wrong: [r.v.en, r.v.naive ?? r.v.ing],
    hints: form,
  }));
  const TROU = cm2EnInterleave(GAP_FORM, GAP_AUX, GAP_QUESTION, GAP_BASE, GAP_FRENCH, GAP_TYPO);

  const WRITE_FRENCH: WriteRow[] = withFrench.map((r) => ({
    fact: r.key,
    prompt: `${fr(r)} Écris le verbe anglais qui manque dans ${r.s.t} ___${tail(r)}.`,
    accepted: [r.v.past],
    hints: hints("Pense à ce que dit la phrase française.", "Un repère de temps passé veut un verbe au passé.", cm2EnFirstLetter(r.v.past)),
  }));
  const WRITE_AUX: WriteRow[] = rows.filter((_, i) => i % 2 === 0).map((r) => ({ fact: r.key, prompt: `Écris le petit mot qui manque. ${r.s.t} ___ not ${r.v.en}${tail(r)}.`, accepted: ["did"], hints: didHint }));
  const WRITE_BASE: WriteRow[] = rows
    .filter((_, i) => i % 2 === 1)
    .map((r) => ({
      fact: r.key,
      prompt: `Écris le verbe qui manque. Did ${r.s.q} ___${tail(r)}?`,
      accepted: [r.v.en],
      hints: hints("Lis la question en entier.", "Après le petit mot du passé, le verbe revient à sa forme de base.", cm2EnFirstLetter(r.v.en)),
    }));
  const ECRIRE = cm2EnInterleave(WRITE_FRENCH, WRITE_AUX, WRITE_BASE);

  const ORDRE: OrderRow[] = cm2EnInterleave(
    rows.filter((r) => tiles(pos(r))).map((r) => ordr(CM2_EN_SENTENCE_PROMPT, cm2EnWordsOf(pos(r)), CM2_EN_SENTENCE_HINTS, r.key)),
    rows.filter((r) => tiles(neg(r))).map((r) => ordr(CM2_EN_SENTENCE_PROMPT, cm2EnWordsOf(neg(r)), CM2_EN_SENTENCE_HINTS, r.key)),
    rows.filter((r) => tiles(question(r))).map((r) => ordr(CM2_EN_QUESTION_PROMPT, cm2EnWordsOf(question(r)), CM2_EN_QUESTION_HINTS, r.key)),
  );

  const RELIER: LinkRow[] = cm2EnInterleave(
    verbs.map((_, i) => cm2EnLink("Relie chaque verbe à sa forme du passé.", [0, 1, 2, 3].map((k) => verbs[(i + k) % verbs.length]).map((v) => [v.en, v.past] as const), `${tag}-passe:${i}`)),
    verbs.map((_, i) => cm2EnLink("Relie chaque verbe anglais à son sens en français.", [0, 1, 2, 3].map((k) => verbs[(i + k) % verbs.length]).map((v) => [v.en, v.inf] as const), `${tag}-sens:${i}`)),
    cm2EnTrios(withFrench, 2).map((trio) => cm2EnLink("Relie chaque phrase anglaise à la même phrase en français.", trio.map((r) => [pos(r), fr(r)] as const), `${tag}-phrases:${trio[0].key}`)),
    [0, 1, 2].map((i) => cm2EnLink("Relie chaque repère de temps à son sens.", PAST_TIMES.map((t) => [t.en, t.fr] as const), `${tag}-temps:${i}`)),
  );

  const GLISSER = [
    ...sortRows(
      "Glisse chaque verbe dans la bonne case.",
      ["Verbe de base", "Verbe au passé"],
      verbs.slice(0, 6).map((v) => v.en),
      verbs.slice(0, 6).map((v) => v.past),
      CM2_EN_SORT_HINTS,
      8,
    ),
    ...sortRows(CM2_EN_SORT_PROMPT, ["Phrase positive", "Phrase négative"], rows.filter((_, i) => i % 5 === 0).map(pos), rows.filter((_, i) => i % 5 === 2).map(neg), CM2_EN_SORT_HINTS, 8),
    ...sortRows(
      CM2_EN_SORT_PROMPT,
      ["Je demande", "Je réponds"],
      rows.filter((_, i) => i % 7 === 1).map(question),
      [yes(rows[1]), no(rows[2]), yes(rows[4]), no(rows[5])],
      CM2_EN_SORT_HINTS,
      6,
    ),
  ];

  return { rows, pos, QCM, TROU, ECRIRE, ORDRE, RELIER, GLISSER };
}

const PR_VERBS: readonly PastVerb[] = [
  { en: "play", past: "played", ing: "playing", obj: "football", inf: "jouer", pp: "joué", frObj: "au football" },
  { en: "watch", past: "watched", ing: "watching", obj: "television", inf: "regarder", pp: "regardé", frObj: "la télévision" },
  { en: "visit", past: "visited", ing: "visiting", obj: "the market", inf: "visiter", pp: "visité", frObj: "le marché" },
  { en: "walk", past: "walked", ing: "walking", obj: "in the garden", inf: "marcher", pp: "marché", frObj: "dans le jardin" },
  { en: "cook", past: "cooked", ing: "cooking", obj: "rice", inf: "cuisiner", pp: "cuisiné", frObj: "du riz" },
  { en: "help", past: "helped", ing: "helping", obj: "a friend", inf: "aider", pp: "aidé", frObj: "un ami" },
  { en: "clean", past: "cleaned", ing: "cleaning", obj: "the house", inf: "nettoyer", pp: "nettoyé", frObj: "la maison" },
  { en: "listen", past: "listened", ing: "listening", obj: "to the radio", inf: "écouter", pp: "écouté", frObj: "la radio" },
  { en: "study", past: "studied", ing: "studying", obj: "mathematics", inf: "étudier", pp: "étudié", frObj: "les mathématiques", typo: ["studyed", "studed"] },
  { en: "dance", past: "danced", ing: "dancing", obj: "", inf: "danser", pp: "dansé", frObj: "", typo: ["danceed", "dancd"] },
];
const PR = pastTopic("pr", PR_VERBS, true);

export const makeCm2EnPrPhrase: Make = (ctx) => ce2Question(ctx, "cm2-en-pr-phrase", "choisir la bonne phrase au passé avec un verbe régulier", PR.QCM, 3);
export const makeCm2EnPrTrou: Make = (ctx) => ce2Gap(ctx, "cm2-en-pr-trou", "compléter une phrase au passé avec un verbe régulier", PR.TROU, 2, 1);
export const makeCm2EnPrEcrire: Make = (ctx) => ce2Write(ctx, "cm2-en-pr-ecrire", "écrire le verbe au passé ou le petit mot did", PR.ECRIRE, 1, 2);
export const makeCm2EnPrOrdre: Make = (ctx) => ce2Order(ctx, "cm2-en-pr-ordre", "remettre les mots d'une phrase ou d'une question au passé", PR.ORDRE);
export const makeCm2EnPrRelier: Make = (ctx) => ce2Link(ctx, "cm2-en-pr-relier", "relier un verbe, une phrase ou un repère de temps à son passé ou à son sens", PR.RELIER);
export const makeCm2EnPrGlisser: Make = (ctx) => ce2Sort(ctx, "cm2-en-pr-glisser", "classer les verbes de base et au passé, les phrases positives et négatives, les questions et les réponses", PR.GLISSER, 2);

const PI_VERBS: readonly PastVerb[] = [
  { en: "go", past: "went", ing: "going", obj: "to the market", inf: "aller", pp: "allé", frObj: "au marché", naive: "goed", etre: { m: "allé", f: "allée", p: "allés" } },
  { en: "have", past: "had", ing: "having", obj: "breakfast", inf: "avoir", pp: "pris", frObj: "le petit déjeuner", naive: "haved" },
  { en: "see", past: "saw", ing: "seeing", obj: "Awa", inf: "voir", pp: "vu", frObj: "Awa", naive: "seed" },
  { en: "eat", past: "ate", ing: "eating", obj: "rice", inf: "manger", pp: "mangé", frObj: "du riz", naive: "eated" },
  { en: "drink", past: "drank", ing: "drinking", obj: "water", inf: "boire", pp: "bu", frObj: "de l'eau", naive: "drinked" },
  { en: "buy", past: "bought", ing: "buying", obj: "a mango", inf: "acheter", pp: "acheté", frObj: "une mangue", naive: "buyed" },
  { en: "come", past: "came", ing: "coming", obj: "to the party", inf: "venir", pp: "venu", frObj: "à la fête", naive: "comed", etre: { m: "venu", f: "venue", p: "venus" } },
  { en: "make", past: "made", ing: "making", obj: "a cake", inf: "faire", pp: "fait", frObj: "un gâteau", naive: "maked" },
  { en: "take", past: "took", ing: "taking", obj: "the bus", inf: "prendre", pp: "pris", frObj: "le bus", naive: "taked" },
  { en: "write", past: "wrote", ing: "writing", obj: "a letter", inf: "écrire", pp: "écrit", frObj: "une lettre", naive: "writed" },
];
const PI = pastTopic("pi", PI_VERBS, false);

export const makeCm2EnPiPhrase: Make = (ctx) => ce2Question(ctx, "cm2-en-pi-phrase", "choisir la bonne phrase au passé avec un verbe irrégulier", PI.QCM, 3);
export const makeCm2EnPiTrou: Make = (ctx) => ce2Gap(ctx, "cm2-en-pi-trou", "compléter une phrase au passé avec un verbe irrégulier", PI.TROU, 2, 1);
export const makeCm2EnPiEcrire: Make = (ctx) => ce2Write(ctx, "cm2-en-pi-ecrire", "écrire le passé d'un verbe irrégulier ou le petit mot did", PI.ECRIRE, 1, 2);
export const makeCm2EnPiOrdre: Make = (ctx) => ce2Order(ctx, "cm2-en-pi-ordre", "remettre les mots d'une phrase ou d'une question au passé", PI.ORDRE);
export const makeCm2EnPiRelier: Make = (ctx) => ce2Link(ctx, "cm2-en-pi-relier", "relier un verbe, une phrase ou un repère de temps à son passé ou à son sens", PI.RELIER);
export const makeCm2EnPiGlisser: Make = (ctx) => ce2Sort(ctx, "cm2-en-pi-glisser", "classer les verbes de base et au passé, les phrases positives et négatives, les questions et les réponses", PI.GLISSER, 2);

// ===========================================================================
// DEMAIN : ÊTRE GOING TO (an-cm2-going-to)
// ===========================================================================

type GtVerb = { en: string; s: string; ing: string; obj: string; inf: string; mine: boolean };
const GT_VERBS: readonly GtVerb[] = [
  { en: "play", s: "plays", ing: "playing", obj: "football", inf: "jouer au football", mine: false },
  { en: "watch", s: "watches", ing: "watching", obj: "television", inf: "regarder la télévision", mine: false },
  { en: "visit", s: "visits", ing: "visiting", obj: "my grandmother", inf: "rendre visite à ma grand-mère", mine: true },
  { en: "cook", s: "cooks", ing: "cooking", obj: "rice", inf: "cuisiner du riz", mine: false },
  { en: "help", s: "helps", ing: "helping", obj: "a friend", inf: "aider un ami", mine: false },
  { en: "read", s: "reads", ing: "reading", obj: "a book", inf: "lire un livre", mine: false },
  { en: "study", s: "studies", ing: "studying", obj: "mathematics", inf: "étudier les mathématiques", mine: false },
  { en: "clean", s: "cleans", ing: "cleaning", obj: "the house", inf: "nettoyer la maison", mine: false },
  { en: "eat", s: "eats", ing: "eating", obj: "mangoes", inf: "manger des mangues", mine: false },
  { en: "write", s: "writes", ing: "writing", obj: "a letter", inf: "écrire une lettre", mine: false },
  { en: "buy", s: "buys", ing: "buying", obj: "bread", inf: "acheter du pain", mine: false },
  { en: "listen", s: "listens", ing: "listening", obj: "to the radio", inf: "écouter la radio", mine: false },
];
const GT_TIMES: readonly Time[] = [
  { en: "tomorrow", fr: "demain" },
  { en: "tonight", fr: "ce soir" },
  { en: "next week", fr: "la semaine prochaine" },
  { en: "next month", fr: "le mois prochain" },
];
const GT_PAST_MARKERS = ["yesterday", "last week"] as const;

type GtRow = { s: Subj; v: GtVerb; time: Time; key: string };
const GT_ROWS: readonly GtRow[] = GT_VERBS.flatMap((v, vi) => [0, 1, 2].map((k) => ({ s: SUBJ8[(vi + k * 3) % 8], v, time: GT_TIMES[(vi + k) % 4], key: `gt:${v.en}:${SUBJ8[(vi + k * 3) % 8].t}` })));
const gtAsked = GT_ROWS.filter((r) => !r.v.mine);

const gtTail = (r: GtRow) => `${cm2EnWithObj(r.v.obj)} ${r.time.en}`;
const gtPos = (r: GtRow) => `${r.s.t} ${r.s.be} going to ${r.v.en}${gtTail(r)}.`;
const gtNeg = (r: GtRow) => `${r.s.t} ${r.s.be} not going to ${r.v.en}${gtTail(r)}.`;
const gtQuestion = (r: GtRow) => `${cm2EnCap(r.s.be)} ${r.s.q} going to ${r.v.en}${gtTail(r)}?`;
const gtWhat = (s: Subj) => `What ${s.be} ${s.q} going to do?`;
const gtYes = (r: GtRow) => `Yes, ${r.s.ans} ${amIsAre(r.s.ans)}.`;
const gtNo = (r: GtRow) => `No, ${r.s.ans} ${amIsAre(r.s.ans)} not.`;
const gtFrench = (r: GtRow) => `${r.s.vaFr} ${r.v.inf} ${r.time.fr}.`;
const gtFrenchOk = GT_ROWS.filter((r) => cm2EnApostrophes(gtFrench(r)) <= 1);
const otherBes = (be: string) => ["am", "is", "are"].filter((other) => other !== be);
/** Le dernier indice du verbe être au présent : sa première lettre et sa longueur (am, is, are). */
const beHint = (be: string) => `Avec ce sujet, le verbe être commence par la lettre ${be.charAt(0)} et a ${be.length === 2 ? "deux" : "trois"} lettres.`;
const gtForm = hints("Lis la phrase en entier.", "Après le futur proche, le verbe reste tel quel, sans s ni ing.", "Pour dire ce qu'on va faire, on met d'abord le verbe être qui va avec le sujet.");

const GT_PHRASE_POS: QuestionRow[] = GT_ROWS.map((r) => ({
  fact: r.key,
  prompt: "Quelle phrase est juste ?",
  answer: gtPos(r),
  wrong: [`${r.s.t} going to ${r.v.en}${gtTail(r)}.`, r.s.third ? `${r.s.t} ${r.s.be} going to ${r.v.s}${gtTail(r)}.` : `${r.s.t} ${r.s.be} going to ${r.v.ing}${gtTail(r)}.`],
  hints: gtForm,
}));
const GT_PHRASE_NEG: QuestionRow[] = GT_ROWS.map((r) => ({
  fact: r.key,
  prompt: `Quelle phrase dit le contraire de « ${gtPos(r)} » ?`,
  answer: gtNeg(r),
  wrong: [`${r.s.t} ${r.s.be} no going to ${r.v.en}${gtTail(r)}.`, `${r.s.t} ${r.s.be} not going ${r.v.en}${gtTail(r)}.`],
  hints: hints("Pour dire le contraire, on ajoute un petit mot après le verbe être.", "Le petit mot de la négation vient juste après le verbe être.", "Le petit mot to reste devant le verbe."),
}));
const GT_PHRASE_QUESTION: QuestionRow[] = gtAsked.map((r) => ({
  fact: r.key,
  prompt: "Quelle question est juste ?",
  answer: gtQuestion(r),
  wrong: [`Do ${r.s.q} going to ${r.v.en}${gtTail(r)}?`, `${cm2EnCap(wrongBe(r.s.be))} ${r.s.q} going to ${r.v.en}${gtTail(r)}?`],
  hints: hints("Lis chaque question en entier.", "Dans une question, le verbe être passe avant le sujet.", "Pour dire ce qu'on va faire, on met d'abord le verbe être qui va avec le sujet."),
}));
const GT_PHRASE_REPLY: QuestionRow[] = gtAsked.map((r, index) => {
  const ok = index % 2 === 0;
  const be = amIsAre(r.s.ans);
  return {
    fact: r.key,
    prompt: `On te demande « ${gtQuestion(r)} ». Tu réponds ${ok ? "oui" : "non"}. Quelle est la bonne réponse ?`,
    answer: ok ? gtYes(r) : gtNo(r),
    wrong: ok ? [`Yes, ${r.s.ans} do.`, `Yes, ${r.s.ans} ${wrongBe(be)}.`] : [`No, ${r.s.ans} do not.`, `No, ${r.s.ans} not.`],
    hints: CM2_EN_REPLY_HINTS,
  };
});
const GT_QCM = cm2EnInterleave(GT_PHRASE_POS, GT_PHRASE_NEG, GT_PHRASE_QUESTION, GT_PHRASE_REPLY);

const GT_GAP_BE: GapRow[] = GT_ROWS.map((r) => ({
  fact: r.key,
  text: `${r.s.t} ___ going to ${r.v.en}${gtTail(r)}.`,
  answer: r.s.be,
  wrong: otherBes(r.s.be),
  hints: hints("Lis la phrase en entier.", "Pour dire ce qu'on va faire, on met d'abord le verbe être qui va avec le sujet.", beHint(r.s.be)),
}));
const GT_GAP_VERB: GapRow[] = GT_ROWS.map((r) => ({
  fact: r.key,
  text: `${r.s.t} ${r.s.be} going to ___${cm2EnWithObj(r.v.obj)} ${r.time.en}.`,
  answer: r.v.en,
  wrong: [r.v.s, r.v.ing],
  hints: hints("Lis la phrase en entier.", "Après le futur proche, le verbe reste tel quel, sans s ni ing.", cm2EnFirstLetter(r.v.en)),
}));
const GT_GAP_MARKER: GapRow[] = gtFrenchOk.map((r) => ({
  fact: r.key,
  prompt: `${gtFrench(r)} Complète la phrase en anglais.`,
  text: `${r.s.t} ${r.s.be} going to ${r.v.en}${cm2EnWithObj(r.v.obj)} ___.`,
  answer: r.time.en,
  wrong: [...GT_PAST_MARKERS],
  hints: hints("Lis la phrase française : un mot dit quand.", "Ce qu'on va faire est devant nous, pas derrière.", "Cherche le repère de temps qui parle de demain ou plus tard."),
}));
const GT_GAP_WHAT: GapRow[] = SUBJ8.map((s) => ({
  fact: `gt-what:${s.t}`,
  text: `What ___ ${s.q} going to do?`,
  answer: s.be,
  wrong: otherBes(s.be),
  hints: hints("Lis la question en entier.", "Pour dire ce qu'on va faire, on met d'abord le verbe être qui va avec le sujet.", beHint(s.be)),
}));
const GT_TROU = cm2EnInterleave(GT_GAP_BE, GT_GAP_VERB, GT_GAP_MARKER, GT_GAP_WHAT);

const GT_WRITE_BE: WriteRow[] = GT_ROWS.filter((_, i) => i % 2 === 0).map((r) => ({
  fact: r.key,
  prompt: `Écris le petit mot qui manque. ${r.s.t} ___ going to ${r.v.en}${gtTail(r)}.`,
  accepted: [r.s.be],
  hints: hints("Lis la phrase en entier.", "Pour dire ce qu'on va faire, on met d'abord le verbe être qui va avec le sujet.", beHint(r.s.be)),
}));
const GT_WRITE_VERB: WriteRow[] = gtFrenchOk.map((r) => ({
  fact: r.key,
  prompt: `${gtFrench(r)} Écris le verbe anglais qui manque dans ${r.s.t} ${r.s.be} going to ___${cm2EnWithObj(r.v.obj)} ${r.time.en}.`,
  accepted: [r.v.en],
  hints: hints("Pense à ce que dit la phrase française.", "Après le futur proche, le verbe reste tel quel, sans s ni ing.", cm2EnFirstLetter(r.v.en)),
}));
const GT_WRITE_MARKER: WriteRow[] = gtFrenchOk
  .filter((_, i) => i % 3 === 0)
  .map((r) => ({
    fact: r.key,
    prompt: `${gtFrench(r)} Écris le repère de temps qui manque dans ${r.s.t} ${r.s.be} going to ${r.v.en}${cm2EnWithObj(r.v.obj)} ___.`,
    accepted: [r.time.en],
    hints: hints("Lis la phrase française : un mot dit quand.", "Ce repère de temps parle de demain ou plus tard.", cm2EnFirstLetter(r.time.en)),
  }));
const GT_ECRIRE = cm2EnInterleave(GT_WRITE_BE, GT_WRITE_VERB, GT_WRITE_MARKER);

const GT_ORDRE: OrderRow[] = cm2EnInterleave(
  GT_ROWS.filter((r) => tiles(gtPos(r))).map((r) => ordr(CM2_EN_SENTENCE_PROMPT, cm2EnWordsOf(gtPos(r)), CM2_EN_SENTENCE_HINTS, r.key)),
  GT_ROWS.filter((r) => tiles(gtNeg(r))).map((r) => ordr(CM2_EN_SENTENCE_PROMPT, cm2EnWordsOf(gtNeg(r)), CM2_EN_SENTENCE_HINTS, r.key)),
  gtAsked.filter((r) => tiles(gtQuestion(r))).map((r) => ordr(CM2_EN_QUESTION_PROMPT, cm2EnWordsOf(gtQuestion(r)), CM2_EN_QUESTION_HINTS, r.key)),
  SUBJ8.map((s) => ordr(CM2_EN_QUESTION_PROMPT, cm2EnWordsOf(gtWhat(s)), CM2_EN_QUESTION_HINTS, `gt-what:${s.t}`)),
);

const GT_RELIER: LinkRow[] = cm2EnInterleave(
  cm2EnTrios(gtFrenchOk, 3).map((trio) => cm2EnLink("Relie chaque phrase anglaise à la même phrase en français.", trio.map((r) => [gtPos(r), gtFrench(r)] as const), `gt-phrases:${trio[0].key}`)),
  [0, 1, 2, 3].map((i) => cm2EnLink("Relie chaque repère de temps à son sens.", GT_TIMES.map((t) => [t.en, t.fr] as const), `gt-temps:${i}`)),
  GT_VERBS.map((_, i) => cm2EnLink("Relie chaque verbe et son complément à son sens en français.", [0, 1, 2].map((k) => GT_VERBS[(i + k) % 12]).map((v) => [`${v.en} ${v.obj}`, v.inf] as const), `gt-verbes:${i}`)),
);

const GT_GLISSER = [
  ...sortRows("Glisse chaque sujet dans la bonne case.", ["is", "are"], ["He", "She", "Awa", "Moussa"], ["You", "We", "They", "My friends"], CM2_EN_SORT_HINTS, 8),
  ...sortRows(
    CM2_EN_SORT_PROMPT,
    ["Phrase positive", "Phrase négative"],
    GT_ROWS.filter((_, i) => i % 6 === 0).map(gtPos),
    GT_ROWS.filter((_, i) => i % 6 === 3).map(gtNeg),
    CM2_EN_SORT_HINTS,
    8,
  ),
  ...sortRows(
    CM2_EN_SORT_PROMPT,
    ["Futur", "Passé"],
    GT_ROWS.filter((_, i) => i % 9 === 0).map(gtPos),
    PR.rows.filter((_, i) => i % 9 === 4).map(PR.pos),
    CM2_EN_SORT_HINTS,
    8,
  ),
];

export const makeCm2EnGtPhrase: Make = (ctx) => ce2Question(ctx, "cm2-en-gt-phrase", "choisir la bonne phrase avec going to", GT_QCM, 3);
export const makeCm2EnGtTrou: Make = (ctx) => ce2Gap(ctx, "cm2-en-gt-trou", "compléter une phrase avec going to", GT_TROU, 2, 1);
export const makeCm2EnGtEcrire: Make = (ctx) => ce2Write(ctx, "cm2-en-gt-ecrire", "écrire le verbe être, le verbe ou le repère de temps d'une phrase avec going to", GT_ECRIRE, 1, 2);
export const makeCm2EnGtOrdre: Make = (ctx) => ce2Order(ctx, "cm2-en-gt-ordre", "remettre les mots d'une phrase ou d'une question avec going to", GT_ORDRE);
export const makeCm2EnGtRelier: Make = (ctx) => ce2Link(ctx, "cm2-en-gt-relier", "relier une phrase, un repère de temps ou un verbe à son sens en français", GT_RELIER);
export const makeCm2EnGtGlisser: Make = (ctx) => ce2Sort(ctx, "cm2-en-gt-glisser", "classer les sujets, les phrases positives et négatives, demain et hier", GT_GLISSER, 2);
