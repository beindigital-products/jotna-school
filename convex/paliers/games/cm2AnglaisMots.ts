/**
 * LES GABARITS D'ANGLAIS DU CM2, LES MOTS ET LES TEXTES : comparer (-er, -est, more, most), demander son chemin, poser des questions
 * (who, where, when, why, how many, how much) et lire un petit texte (`an-cm2-comparatives`, `an-cm2-directions`, `an-cm2-questions`,
 * `an-cm2-reading`).
 *
 * Le modèle écrivait ici « Awa is more taller than Modou », une indication de chemin qui ne mène nulle part, une question sans réponse
 * possible, un texte dont la question n'a pas de réponse. Ici chaque phrase se DÉDUIT d'une table fermée : l'adjectif et ses formes, le lieu
 * et son article, la question et sa réponse, le texte et ce qu'il dit. Les mauvais choix sont les fautes d'enfant de la fiche (« more taller »,
 * « beautifuler », « where are the market »), ou, pour un texte, ce que le texte ne dit pas.
 *
 * Les thématiques ont QUATRE, TROIS, TROIS et QUATRE paliers : chaque gabarit donne à chaque palier sa part de la liste (`ce2Outils`).
 *
 * LA LECTURE : le texte est recopié en entier dans l'énoncé de chaque exercice, entre « » ; il a trois à cinq phrases, sans aucune apostrophe,
 * écrit pour l'exercice (jamais copié). Les questions sont posées en français ; l'anglais est dans le texte, les phrases vrai ou faux et les
 * phrases à trou. Une réponse à écrire demande un nombre en chiffres : un mot du texte ne serait pas une réponse, il serait recopié.
 *
 * HORS FICHE, À FAIRE RELIRE PAR UN PROFESSEUR D'ANGLAIS
 * - Les adjectifs et leurs formes (tall, small, big, old, fast, beautiful, expensive, good), les noms propres (Awa, Modou, Fatou, Moussa) et
 *   les objets comparés (mango, banana, bag, hat, house, shop, book, pen) ; « This mango is the biggest. » ; « better » et « the best ».
 * - Les lieux (school, market, mosque, hospital, shop, bank, post office, bus station) et le français de chaque indication (« Il est entre la
 *   banque et l'école. », « en face de », « à côté de ») ; « Excuse me » et « Thank you » dans les dialogues.
 * - Les questions et leurs réponses (Who is she? / She is my mother., When is the match? / It is on Sunday.) et le français de chaque question.
 * - Les sept petits textes de lecture, leurs questions, leurs phrases vrai ou faux et leurs dialogues : tout est écrit pour l'exercice.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { ce2Gap, ce2Link, ce2Order, ce2Question, ce2Sort, ce2Write, hints, ordr, sortRows, type GapRow, type LinkRow, type OrderRow, type QuestionRow, type WriteRow } from "./ce2Outils";
import {
  CM2_EN_QUESTION_HINTS,
  CM2_EN_QUESTION_PROMPT,
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
  cm2EnWordsOf,
} from "./cm2AnglaisOutils";
import type { GameContext, GeneratedGame } from "./shared";

type Make = (ctx: GameContext) => GeneratedGame;

// ===========================================================================
// COMPARER (an-cm2-comparatives)
// ===========================================================================

type CpAdj = {
  en: string;
  comp: string;
  sup: string;
  long: boolean;
  /** Le comparatif et le superlatif faux d'une phrase (« more taller », « the most tallest »). */
  badComp: readonly [string, string];
  badSup: readonly [string, string];
  /** Le comparatif faux d'une définition (« more tall », « tallest »). */
  badForm: readonly [string, string];
  typoComp?: readonly [string, string];
  typoSup?: readonly [string, string];
  people: boolean;
  things: boolean;
  fr: string;
};

const CP_ADJ: readonly CpAdj[] = [
  { en: "tall", comp: "taller", sup: "the tallest", long: false, badComp: ["more taller", "tall"], badSup: ["the most tallest", "the tall"], badForm: ["more tall", "tallest"], people: true, things: false, fr: "grand" },
  { en: "small", comp: "smaller", sup: "the smallest", long: false, badComp: ["more smaller", "small"], badSup: ["the most smallest", "the small"], badForm: ["more small", "smallest"], people: true, things: true, fr: "petit" },
  { en: "big", comp: "bigger", sup: "the biggest", long: false, badComp: ["more bigger", "big"], badSup: ["the most biggest", "the big"], badForm: ["more big", "biggest"], typoComp: ["biger", "bigier"], typoSup: ["the bigest", "the bigiest"], people: false, things: true, fr: "gros" },
  { en: "old", comp: "older", sup: "the oldest", long: false, badComp: ["more older", "old"], badSup: ["the most oldest", "the old"], badForm: ["more old", "oldest"], people: true, things: true, fr: "vieux" },
  { en: "fast", comp: "faster", sup: "the fastest", long: false, badComp: ["more faster", "fast"], badSup: ["the most fastest", "the fast"], badForm: ["more fast", "fastest"], people: true, things: false, fr: "rapide" },
  { en: "beautiful", comp: "more beautiful", sup: "the most beautiful", long: true, badComp: ["beautifuler", "beautiful"], badSup: ["the beautifulest", "the beautiful"], badForm: ["beautifuler", "most beautiful"], people: true, things: true, fr: "beau" },
  { en: "expensive", comp: "more expensive", sup: "the most expensive", long: true, badComp: ["expensiver", "expensive"], badSup: ["the expensivest", "the expensive"], badForm: ["expensiver", "most expensive"], people: false, things: true, fr: "cher" },
  { en: "good", comp: "better", sup: "the best", long: false, badComp: ["gooder", "good"], badSup: ["the goodest", "the good"], badForm: ["gooder", "more good"], people: true, things: true, fr: "bon" },
];
const CP_PEOPLE: readonly (readonly [string, string])[] = [
  ["Awa", "Modou"],
  ["Fatou", "Moussa"],
  ["Moussa", "Awa"],
  ["Modou", "Fatou"],
];
const CP_THINGS: readonly (readonly [string, string])[] = [
  ["This mango", "the banana"],
  ["This bag", "the hat"],
  ["This house", "the shop"],
  ["This book", "the pen"],
];

type CpRow = { adj: CpAdj; kind: "comp" | "sup"; a: string; b: string; key: string };
const cpPool = (adj: CpAdj, k: number) => (adj.people && adj.things ? (k % 2 === 0 ? CP_PEOPLE : CP_THINGS) : adj.people ? CP_PEOPLE : CP_THINGS);
const CP_COMP: readonly CpRow[] = CP_ADJ.flatMap((adj, ai) =>
  [0, 1, 2].map((k) => ({ adj, kind: "comp" as const, a: cpPool(adj, k)[(ai + k) % 4][0], b: cpPool(adj, k)[(ai + k) % 4][1], key: `cp:${adj.en}:c${k}` })),
);
const CP_SUP: readonly CpRow[] = CP_ADJ.flatMap((adj, ai) => [0, 1].map((k) => ({ adj, kind: "sup" as const, a: cpPool(adj, k)[(ai + k) % 4][0], b: "", key: `cp:${adj.en}:s${k}` })));

const cpCompSentence = (r: CpRow, form = r.adj.comp) => `${r.a} is ${form} than ${r.b}.`;
const cpSupSentence = (r: CpRow, form = r.adj.sup) => `${r.a} is ${form}.`;
const cpCompHints = (adj: CpAdj) =>
  hints(
    "Lis la phrase en entier.",
    adj.long ? "Un mot long ne change pas : on met un petit mot devant." : adj.comp === "better" ? "Cet adjectif change complètement : il faut l'apprendre par cœur." : "Un mot court prend une fin et ne prend pas de petit mot devant.",
    adj.typoComp ? "Attention : la dernière lettre du mot est doublée." : "Compare la fin des trois formes proposées.",
  );
const cpSupHints = (adj: CpAdj) =>
  hints(
    "Lis la phrase en entier.",
    adj.long ? "Un mot long ne change pas : on met deux petits mots devant." : adj.sup === "the best" ? "Cet adjectif change complètement : il faut l'apprendre par cœur." : "Un mot court prend une fin, après le petit mot the.",
    adj.typoSup ? "Attention : la dernière lettre du mot est doublée." : "Compare la fin des trois formes proposées.",
  );

const CP_QCM_COMP: QuestionRow[] = CP_COMP.map((r) => ({
  fact: r.key,
  prompt: "Quelle phrase est juste ?",
  answer: cpCompSentence(r),
  wrong: [cpCompSentence(r, r.adj.badComp[0]), cpCompSentence(r, r.adj.badComp[1])],
  hints: cpCompHints(r.adj),
}));
const CP_QCM_SUP: QuestionRow[] = CP_SUP.map((r) => ({
  fact: r.key,
  prompt: "Quelle phrase est juste ?",
  answer: cpSupSentence(r),
  wrong: [cpSupSentence(r, r.adj.badSup[0]), cpSupSentence(r, r.adj.badSup[1])],
  hints: cpSupHints(r.adj),
}));
const CP_QCM_DEF_COMP: QuestionRow[] = CP_ADJ.map((adj) => ({
  fact: `cp:${adj.en}:dc`,
  prompt: `Quel est le comparatif de « ${adj.en} » ?`,
  answer: adj.comp,
  wrong: adj.badForm,
  hints: cpCompHints(adj),
}));
const CP_QCM_DEF_SUP: QuestionRow[] = CP_ADJ.map((adj) => ({
  fact: `cp:${adj.en}:ds`,
  prompt: `Quel est le superlatif de « ${adj.en} » ?`,
  answer: adj.sup,
  wrong: adj.badSup,
  hints: cpSupHints(adj),
}));
const CP_QCM = cm2EnInterleave(CP_QCM_COMP, CP_QCM_SUP, CP_QCM_DEF_COMP, CP_QCM_DEF_SUP);

const CP_GAP_COMP: GapRow[] = CP_COMP.map((r) => ({
  fact: r.key,
  prompt: `Complète avec le comparatif de « ${r.adj.en} ».`,
  text: `${r.a} is ___ than ${r.b}.`,
  answer: r.adj.comp,
  wrong: r.adj.badComp,
  hints: cpCompHints(r.adj),
}));
const CP_GAP_SUP: GapRow[] = CP_SUP.map((r) => ({
  fact: r.key,
  prompt: `Complète avec le superlatif de « ${r.adj.en} ».`,
  text: `${r.a} is ___.`,
  answer: r.adj.sup,
  wrong: r.adj.badSup,
  hints: cpSupHints(r.adj),
}));
const CP_GAP_TYPO: GapRow[] = [
  ...CP_COMP.filter((r) => r.adj.typoComp).map((r) => ({
    fact: r.key,
    prompt: `Complète avec le comparatif de « ${r.adj.en} ».`,
    text: `${r.a} is ___ than ${r.b}.`,
    answer: r.adj.comp,
    wrong: r.adj.typoComp as readonly [string, string],
    hints: cpCompHints(r.adj),
  })),
  ...CP_SUP.filter((r) => r.adj.typoSup).map((r) => ({
    fact: r.key,
    prompt: `Complète avec le superlatif de « ${r.adj.en} ».`,
    text: `${r.a} is ___.`,
    answer: r.adj.sup,
    wrong: r.adj.typoSup as readonly [string, string],
    hints: cpSupHints(r.adj),
  })),
];
const CP_TROU = cm2EnInterleave(CP_GAP_COMP, CP_GAP_SUP, CP_GAP_TYPO);

const CP_ECRIRE: WriteRow[] = cm2EnInterleave(
  CP_COMP.filter((r) => !r.adj.long).map((r) => ({
    fact: r.key,
    prompt: `Écris le comparatif de « ${r.adj.en} » dans ${r.a} is ___ than ${r.b}.`,
    accepted: [r.adj.comp],
    hints: hints("Lis la phrase en entier.", "Pense à la forme du mot quand on compare deux personnes ou deux choses.", cm2EnFirstLetter(r.adj.comp)),
  })),
  CP_SUP.filter((r) => !r.adj.long).map((r) => ({
    fact: r.key,
    prompt: `Écris le superlatif de « ${r.adj.en} » dans ${r.a} is the ___.`,
    accepted: [r.adj.sup.replace(/^the /, "")],
    hints: hints("Lis la phrase en entier.", "Pense à la forme du mot quand on dit le plus.", cm2EnFirstLetter(r.adj.sup.replace(/^the /, ""))),
  })),
  CP_COMP.filter((r) => r.adj.long).map((r) => ({
    fact: r.key,
    prompt: `Écris le petit mot qui manque. ${r.a} is ___ ${r.adj.en} than ${r.b}.`,
    accepted: ["more"],
    hints: hints("Lis la phrase en entier.", "Un mot long ne change pas : on met un petit mot devant.", "Ce petit mot a quatre lettres et finit par la lettre e."),
  })),
  CP_SUP.filter((r) => r.adj.long).map((r) => ({
    fact: r.key,
    prompt: `Écris le petit mot qui manque. ${r.a} is the ___ ${r.adj.en}.`,
    accepted: ["most"],
    hints: hints("Lis la phrase en entier.", "Un mot long ne change pas : on met deux petits mots devant.", "Ce petit mot a quatre lettres et finit par la lettre t."),
  })),
);

const CP_ORDRE: OrderRow[] = cm2EnInterleave(
  CP_COMP.map((r) => ordr(CM2_EN_SENTENCE_PROMPT, cm2EnWordsOf(cpCompSentence(r)), CM2_EN_SENTENCE_HINTS, r.key)),
  CP_SUP.map((r) => ordr(CM2_EN_SENTENCE_PROMPT, cm2EnWordsOf(cpSupSentence(r)), CM2_EN_SENTENCE_HINTS, r.key)),
);

const CP_RELIER: LinkRow[] = cm2EnInterleave(
  CP_ADJ.map((_, i) => cm2EnLink("Relie chaque mot à sa forme pour comparer.", [0, 1, 2, 3].map((k) => CP_ADJ[(i + 2 * k) % 8]).map((a) => [a.en, a.comp] as const), `cp-comp:${i}`)),
  CP_ADJ.map((_, i) => cm2EnLink("Relie chaque mot à sa forme pour dire le plus.", [0, 1, 2, 3].map((k) => CP_ADJ[(i + 2 * k + 1) % 8]).map((a) => [a.en, a.sup] as const), `cp-sup:${i}`)),
  CP_ADJ.map((_, i) => cm2EnLink("Relie chaque mot anglais à son sens en français.", [0, 1, 2, 3].map((k) => CP_ADJ[(i + 2 * k) % 8]).map((a) => [a.en, a.fr] as const), `cp-sens:${i}`)),
);

const CP_GLISSER = [
  ...sortRows("Glisse chaque mot dans la bonne case.", ["Mot court", "Mot long"], ["tall", "small", "big", "old", "fast"], ["beautiful", "expensive"], CM2_EN_SORT_HINTS, 4),
  ...sortRows(
    CM2_EN_SORT_PROMPT,
    ["Comparatif", "Superlatif"],
    ["taller", "bigger", "better", "more beautiful", "smaller", "older"],
    ["the tallest", "the biggest", "the best", "the most beautiful", "the smallest", "the oldest"],
    CM2_EN_SORT_HINTS,
    8,
  ),
  ...sortRows(
    "Glisse chaque phrase dans la bonne case.",
    ["Phrase juste", "Phrase fausse"],
    CP_COMP.filter((_, i) => i % 4 === 0).map((r) => cpCompSentence(r)),
    CP_COMP.filter((_, i) => i % 4 === 1).map((r) => cpCompSentence(r, r.adj.badComp[0])),
    CM2_EN_SORT_HINTS,
    8,
  ),
];

export const makeCm2EnCpPhrase: Make = (ctx) => ce2Question(ctx, "cm2-en-cp-phrase", "choisir la bonne forme pour comparer", CP_QCM, 3);
export const makeCm2EnCpTrou: Make = (ctx) => ce2Gap(ctx, "cm2-en-cp-trou", "compléter une phrase avec le comparatif ou le superlatif", CP_TROU, 2, 1);
export const makeCm2EnCpEcrire: Make = (ctx) => ce2Write(ctx, "cm2-en-cp-ecrire", "écrire le comparatif, le superlatif ou le petit mot more ou most", CP_ECRIRE, 1, 2);
export const makeCm2EnCpOrdre: Make = (ctx) => ce2Order(ctx, "cm2-en-cp-ordre", "remettre les mots d'une phrase qui compare", CP_ORDRE);
export const makeCm2EnCpRelier: Make = (ctx) => ce2Link(ctx, "cm2-en-cp-relier", "relier un adjectif à sa forme pour comparer ou à son sens", CP_RELIER);
export const makeCm2EnCpGlisser: Make = (ctx) => ce2Sort(ctx, "cm2-en-cp-glisser", "classer les mots courts et longs, les comparatifs et les superlatifs, les phrases justes et fausses", CP_GLISSER, 2);

// ===========================================================================
// DEMANDER SON CHEMIN (an-cm2-directions)
// ===========================================================================

type Place = { en: string; gloss: string; art: string; de: string };
const PLACES: readonly Place[] = [
  { en: "school", gloss: "école", art: "l'école", de: "de l'école" },
  { en: "market", gloss: "marché", art: "le marché", de: "du marché" },
  { en: "mosque", gloss: "mosquée", art: "la mosquée", de: "de la mosquée" },
  { en: "hospital", gloss: "hôpital", art: "l'hôpital", de: "de l'hôpital" },
  { en: "shop", gloss: "magasin", art: "le magasin", de: "du magasin" },
  { en: "bank", gloss: "banque", art: "la banque", de: "de la banque" },
  { en: "post office", gloss: "poste", art: "la poste", de: "de la poste" },
  { en: "bus station", gloss: "gare routière", art: "la gare routière", de: "de la gare routière" },
];
const ROUTES: readonly (readonly [string, string])[] = [
  ["Go straight on.", "Va tout droit."],
  ["Turn left.", "Tourne à gauche."],
  ["Turn right.", "Tourne à droite."],
  ["Go straight on and turn left.", "Va tout droit et tourne à gauche."],
  ["Go straight on and turn right.", "Va tout droit et tourne à droite."],
  ["Turn left and go straight on.", "Tourne à gauche et va tout droit."],
  ["Turn right and go straight on.", "Tourne à droite et va tout droit."],
];
const DR_WORDS: readonly (readonly [string, string])[] = [
  ["go straight on", "va tout droit"],
  ["turn left", "tourne à gauche"],
  ["turn right", "tourne à droite"],
  ["next to", "à côté de"],
  ["opposite", "en face de"],
  ["between", "entre"],
];

type Rel = "next" | "opp" | "between";
type DrRow = { rel: Rel; a: Place; b: Place; c: Place; key: string };
const DR_ROWS: readonly DrRow[] = PLACES.flatMap((a, i) => [
  { rel: "next" as const, a, b: PLACES[(i + 3) % 8], c: PLACES[(i + 3) % 8], key: `dr:next:${a.en}` },
  { rel: "opp" as const, a, b: PLACES[(i + 5) % 8], c: PLACES[(i + 5) % 8], key: `dr:opp:${a.en}` },
  { rel: "between" as const, a, b: PLACES[(i + 2) % 8], c: PLACES[(i + 6) % 8], key: `dr:between:${a.en}` },
]);
const drEn = (r: DrRow) =>
  r.rel === "next" ? `The ${r.a.en} is next to the ${r.b.en}.` : r.rel === "opp" ? `The ${r.a.en} is opposite the ${r.b.en}.` : `The ${r.a.en} is between the ${r.b.en} and the ${r.c.en}.`;
const drFr = (r: DrRow) =>
  r.rel === "next"
    ? `${cm2EnCap(r.a.art)} est à côté ${r.b.de}.`
    : r.rel === "opp"
      ? `${cm2EnCap(r.a.art)} est en face ${r.b.de}.`
      : `${cm2EnCap(r.a.art)} est entre ${r.b.art} et ${r.c.art}.`;
const drWithFrench = DR_ROWS.filter((r) => cm2EnApostrophes(drFr(r)) <= 1);
const drNextOpp = DR_ROWS.filter((r) => r.rel !== "between");

type AskRow = { a: Place; key: string };
const ASK_ROWS: readonly AskRow[] = PLACES.map((a) => ({ a, key: `dr:ask:${a.en}` }));
const askEn = (r: AskRow) => `Excuse me, where is the ${r.a.en}?`;
const askFr = (r: AskRow) => `Excusez-moi, où est ${r.a.art} ?`;

const DR_DIALOGUES: readonly (readonly string[])[] = PLACES.map((a, i) => [`Excuse me, where is the ${a.en}?`, ROUTES[3 + (i % 4)][0], "Thank you."]);

const DR_QCM_ASK: QuestionRow[] = ASK_ROWS.map((r) => ({
  fact: r.key,
  prompt: `Tu veux demander où est ${r.a.art}. Quelle phrase est juste ?`,
  answer: askEn(r),
  wrong: [`Excuse me, where are the ${r.a.en}?`, `Excuse me, is where the ${r.a.en}?`],
  hints: hints("Lis chaque phrase en entier.", "Pour demander un lieu, le premier mot a cinq lettres, puis vient le petit mot is.", "La phrase s'ouvre par deux petits mots de politesse."),
}));
const DR_QCM_POSITION: QuestionRow[] = drNextOpp.map((r) => {
  const other: DrRow = { ...r, rel: r.rel === "next" ? "opp" : "next" };
  const elsewhere: DrRow = { ...r, b: PLACES[(PLACES.indexOf(r.b) + 1) % 8] };
  return {
    fact: r.key,
    prompt: `Que veut dire « ${drEn(r)} » ?`,
    answer: drFr(r),
    wrong: [drFr(other), drFr(elsewhere)],
    hints: hints("Lis chaque phrase en entier.", "Repère le lieu, puis le petit mot qui dit où il est.", "Ne te laisse pas prendre par un lieu qui ressemble."),
  };
});
/** Deux autres chemins de la même longueur que le chemin i (les courts entre eux, les longs entre eux) : la bonne réponse ne se devine pas à sa longueur. */
const routeNeighbours = (i: number): number[] => {
  const others = (i < 3 ? [0, 1, 2] : [3, 4, 5, 6]).filter((j) => j !== i);
  return i < 3 ? others : [others[i % 3], others[(i + 1) % 3]];
};
const DR_QCM_ROUTE: QuestionRow[] = ROUTES.map(([en, fr], i) => ({
  fact: `dr:route:${i}`,
  prompt: `Quelle phrase veut dire « ${fr} » ?`,
  answer: en,
  wrong: routeNeighbours(i).map((j) => ROUTES[j][0]),
  hints: hints("Lis chaque phrase en entier.", "Repère le sens de chaque verbe : aller tout droit, tourner.", "Regarde de quel côté on tourne et dans quel ordre."),
}));
const DR_QCM = cm2EnInterleave(DR_QCM_ASK, DR_QCM_POSITION, DR_QCM_ROUTE);

const relWords = hints("Lis la phrase française, puis la phrase anglaise.", "Cherche le petit mot anglais qui dit où est le lieu.", "Regarde bien combien de lieux la phrase nomme.");
const DR_GAP_POSITION: GapRow[] = drWithFrench
  .filter((r) => r.rel !== "between")
  .map((r) => ({
    fact: r.key,
    prompt: `${drFr(r)} Complète la phrase en anglais.`,
    text: `The ${r.a.en} is ___ the ${r.b.en}.`,
    answer: r.rel === "next" ? "next to" : "opposite",
    wrong: r.rel === "next" ? ["opposite", "between"] : ["next to", "between"],
    hints: relWords,
  }));
const DR_GAP_BETWEEN: GapRow[] = drWithFrench
  .filter((r) => r.rel === "between")
  .map((r) => ({
    fact: r.key,
    prompt: `${drFr(r)} Complète la phrase en anglais.`,
    text: `The ${r.a.en} is ___ the ${r.b.en} and the ${r.c.en}.`,
    answer: "between",
    wrong: ["next to", "opposite"],
    hints: relWords,
  }));
const DR_GAP_ROUTE: GapRow[] = ROUTES.map(([en, fr], i) => {
  const side = /left/.test(en) ? "left" : /right/.test(en) ? "right" : "straight";
  return {
    fact: `dr:route:${i}`,
    prompt: `${fr} Complète la phrase en anglais.`,
    text: en.replace(side === "straight" ? "straight" : side, "___"),
    answer: side,
    wrong: ["left", "right", "straight"].filter((w) => w !== side),
    hints: hints("Lis la phrase française, puis la phrase anglaise.", "Cherche le mot anglais qui dit de quel côté ou comment aller.", cm2EnFirstLetter(side)),
  };
});
const DR_GAP_ASK: GapRow[] = ASK_ROWS.filter((r) => cm2EnApostrophes(askFr(r)) <= 1).map((r) => ({
  fact: r.key,
  prompt: `${askFr(r)} Complète la phrase en anglais.`,
  text: `Excuse me, ___ is the ${r.a.en}?`,
  answer: "where",
  wrong: ["who", "when"],
  hints: hints("Lis la phrase française, puis la phrase anglaise.", "Pour demander un lieu, il faut un mot qui commence par w.", "Ce mot a cinq lettres."),
}));
const DR_TROU = cm2EnInterleave(DR_GAP_POSITION, DR_GAP_BETWEEN, DR_GAP_ROUTE, DR_GAP_ASK);

const DR_WRITE_PLACE: WriteRow[] = PLACES.map((p) => ({
  fact: `dr:write:${p.en}`,
  prompt: `Comment dit-on « ${p.art} » en anglais ? Écris le nom du lieu.`,
  accepted: [p.en],
  hints: hints("Pense au mot français, puis cherche le mot anglais.", "C'est un lieu de la ville.", cm2EnFirstLetter(p.en)),
}));
const DR_WRITE_WORD: WriteRow[] = (
  [
    ["à gauche", "left"],
    ["à droite", "right"],
    ["en face de", "opposite"],
    ["entre", "between"],
    ["où", "where"],
  ] as const
).map(([fr, en]) => ({
  fact: `dr:write:${en}`,
  prompt: `Comment dit-on « ${fr} » en anglais ? Écris le mot.`,
  accepted: [en],
  hints: hints("Pense au mot français, puis cherche le mot anglais.", "C'est un mot court de l'anglais de la classe.", cm2EnFirstLetter(en)),
}));
const DR_WRITE_TWO: WriteRow[] = [
  { fact: "dr:write:next", prompt: "Comment dit-on « à côté de » en anglais ? Écris les deux mots.", accepted: ["next to"], hints: hints("Pense au mot français, puis cherche les mots anglais.", "Le premier mot veut dire suivant, le second est tout petit.", "Le premier mot commence par la lettre n.") },
  { fact: "dr:write:straight", prompt: "Va tout droit. Écris le mot qui manque dans Go ___ on.", accepted: ["straight"], hints: hints("Lis la phrase française, puis la phrase anglaise.", "Ce mot dit qu'on ne tourne pas.", "Le mot commence par la lettre s.") },
];
const DR_ECRIRE = cm2EnInterleave(DR_WRITE_PLACE, DR_WRITE_WORD, DR_WRITE_TWO);

const DR_ORDRE: OrderRow[] = cm2EnInterleave(
  ASK_ROWS.map((r) => ordr(CM2_EN_QUESTION_PROMPT, cm2EnWordsOf(askEn(r)), CM2_EN_QUESTION_HINTS, r.key)),
  drNextOpp.filter((r) => drEn(r).split(" ").length <= 8).map((r) => ordr(CM2_EN_SENTENCE_PROMPT, cm2EnWordsOf(drEn(r)), CM2_EN_SENTENCE_HINTS, r.key)),
  ROUTES.map(([en], i) => ({ en, i }))
    .filter(({ en }) => en.split(" ").length >= 3)
    .map(({ en, i }) => ordr(CM2_EN_SENTENCE_PROMPT, cm2EnWordsOf(en), CM2_EN_SENTENCE_HINTS, `dr:route:${i}`)),
  DR_DIALOGUES.map((lines, i) =>
    ordr("Remets ce dialogue dans l'ordre, de la première à la dernière phrase.", lines, hints("Un dialogue commence par une question.", "La réponse vient juste après la question.", "Le merci vient à la fin."), `dr:dialogue:${i}`),
  ),
);

const DR_RELIER: LinkRow[] = cm2EnInterleave(
  PLACES.map((_, i) => cm2EnLink("Relie chaque lieu à son sens en français.", [0, 1, 2, 3].map((k) => PLACES[(i + 2 * k) % 8]).map((p) => [p.en, p.gloss] as const), `dr-lieux:${i}`)),
  DR_WORDS.map((_, i) => cm2EnLink("Relie chaque indication à son sens en français.", [0, 1, 2].map((k) => DR_WORDS[(i + 2 * k) % 6]).map(([en, fr]) => [en, fr] as const), `dr-mots:${i}`)),
  cm2EnTrios(ROUTES.slice(1), 1).map((trio, i) => cm2EnLink("Relie chaque phrase anglaise à la même phrase en français.", trio.map(([en, fr]) => [en, fr] as const), `dr-routes:${i}`)),
  cm2EnTrios(drWithFrench, 2).map((trio) => cm2EnLink("Relie chaque phrase anglaise à la même phrase en français.", trio.map((r) => [drEn(r), drFr(r)] as const), `dr-places:${trio[0].key}`)),
);

const DR_GLISSER = [
  ...sortRows("Glisse chaque indication dans la bonne case.", ["Je me déplace", "Je situe un lieu"], ["go straight on", "turn left", "turn right"], ["next to", "opposite", "between"], CM2_EN_SORT_HINTS, 6),
  ...sortRows("Glisse chaque mot dans la bonne case.", ["Lieu", "Direction"], ["school", "market", "bank", "hospital", "mosque", "shop"], ["left", "right", "straight on"], CM2_EN_SORT_HINTS, 8),
  ...sortRows(
    CM2_EN_SORT_PROMPT,
    ["Je demande mon chemin", "Je donne le chemin"],
    ASK_ROWS.filter((_, i) => i % 3 === 0).map(askEn),
    ["Go straight on.", "Turn left.", "Turn right.", "Go straight on and turn left."],
    CM2_EN_SORT_HINTS,
    6,
  ),
];

export const makeCm2EnDrPhrase: Make = (ctx) => ce2Question(ctx, "cm2-en-dr-phrase", "choisir la bonne phrase pour demander ou donner son chemin", DR_QCM, 3);
export const makeCm2EnDrTrou: Make = (ctx) => ce2Gap(ctx, "cm2-en-dr-trou", "compléter une phrase qui situe un lieu ou donne un chemin", DR_TROU, 2, 1);
export const makeCm2EnDrEcrire: Make = (ctx) => ce2Write(ctx, "cm2-en-dr-ecrire", "écrire un lieu ou une indication de chemin en anglais", DR_ECRIRE, 1, 2);
export const makeCm2EnDrOrdre: Make = (ctx) => ce2Order(ctx, "cm2-en-dr-ordre", "remettre les mots d'une phrase de chemin ou les phrases d'un dialogue", DR_ORDRE);
export const makeCm2EnDrRelier: Make = (ctx) => ce2Link(ctx, "cm2-en-dr-relier", "relier un lieu, une indication ou une phrase à son sens en français", DR_RELIER);
export const makeCm2EnDrGlisser: Make = (ctx) => ce2Sort(ctx, "cm2-en-dr-glisser", "classer les indications, les lieux et les directions, les demandes et les réponses", DR_GLISSER, 2);

// ===========================================================================
// POSER DES QUESTIONS (an-cm2-questions)
// ===========================================================================

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
/** Le nom de la sorte de renseignement sur une case ou une paire : sans article, comme les autres étiquettes. */
const QS_LABEL: Record<QsType, string> = { personne: "Personne", lieu: "Lieu", moment: "Moment", raison: "Raison", nombre: "Nombre", prix: "Prix", chose: "Chose" };
const QS_WORD: Record<QsType, string> = { personne: "Who", lieu: "Where", moment: "When", raison: "Why", nombre: "How many", prix: "How much", chose: "What" };
type QsRow = { word: string; rest: string; a: string; type: QsType; fr: string };
const qsRow = (type: QsType, rest: string, a: string, fr: string): QsRow => ({ word: QS_WORD[type], rest, a, type, fr });
const QS_ROWS: readonly QsRow[] = [
  qsRow("personne", "is he?", "He is my brother.", "Qui est-il ?"),
  qsRow("lieu", "is the school?", "It is next to the market.", "Où est l'école ?"),
  qsRow("moment", "is your birthday?", "It is in May.", "Quand est ton anniversaire ?"),
  qsRow("raison", "are you sad?", "Because I am tired.", "Pourquoi es-tu triste ?"),
  qsRow("nombre", "books have you got?", "I have got five books.", "Combien de livres possèdes-tu ?"),
  qsRow("prix", "is it?", "It is five hundred francs.", "Combien ça coûte ?"),
  qsRow("chose", "is your name?", "My name is Awa.", "Quel est ton nom ?"),
  qsRow("personne", "is she?", "She is my mother.", "Qui est-elle ?"),
  qsRow("lieu", "are you?", "I am at home.", "Où es-tu ?"),
  qsRow("moment", "is the party?", "It is on Saturday.", "Quand est la fête ?"),
  qsRow("raison", "are you happy?", "Because it is my birthday.", "Pourquoi es-tu content ?"),
  qsRow("nombre", "pens have you got?", "I have got three pens.", "Combien de stylos possèdes-tu ?"),
  qsRow("prix", "is the book?", "It is two hundred francs.", "Combien coûte le livre ?"),
  qsRow("chose", "is this?", "It is a mango.", "C'est quoi ?"),
  qsRow("personne", "is your friend?", "My friend is Awa.", "Qui est ton ami ?"),
  qsRow("lieu", "is the bank?", "It is opposite the post office.", "Où est la banque ?"),
  qsRow("moment", "is the market?", "It is on Monday.", "Quand est le marché ?"),
  qsRow("raison", "is Moussa tired?", "Because he played football.", "Pourquoi Moussa est-il fatigué ?"),
  qsRow("nombre", "brothers have you got?", "I have got two brothers.", "Combien de frères as-tu ?"),
  qsRow("prix", "are the mangoes?", "They are three hundred francs.", "Combien coûtent les mangues ?"),
  qsRow("personne", "is Moussa?", "Moussa is my cousin.", "Qui est Moussa ?"),
  qsRow("lieu", "is Awa?", "She is at the mosque.", "Où est Awa ?"),
  qsRow("moment", "is the match?", "It is on Sunday.", "Quand est le match ?"),
  qsRow("raison", "is Awa happy?", "Because she is at home.", "Pourquoi Awa est-elle contente ?"),
  qsRow("nombre", "sisters have you got?", "I have got one sister.", "Combien de sœurs as-tu ?"),
  qsRow("prix", "is the bread?", "It is one hundred francs.", "Combien coûte le pain ?"),
];
const qsQuestion = (r: QsRow) => `${r.word} ${r.rest}`;
const qsKey = (r: QsRow) => `qs:${qsQuestion(r)}`;
const QS_WORDS = ["Who", "Where", "When", "Why", "What", "How many", "How much"] as const;
/** Deux mots interrogatifs qui ne sont pas celui de la question : « How many » et « How much » se confondent exprès. */
const qsWrongWords = (r: QsRow, index: number): [string, string] => {
  if (r.word === "How many") return ["How much", "What"];
  if (r.word === "How much") return ["How many", "What"];
  const others = ["Who", "Where", "When", "Why", "What"].filter((w) => w !== r.word);
  return [others[index % 4], others[(index + 1) % 4]];
};
const qsLowerFirst = (word: string) => word.toLowerCase();

/**
 * Deux éléments différents d'une liste, de longueur proche de la bonne réponse (elle ne se devine pas à sa longueur), pris à des places qui
 * changent d'une ligne à l'autre parmi les cinq les plus proches.
 */
const twoOthers = (list: readonly string[], index: number, target: string): [string, string] => {
  const near = [...new Set(list)].sort((a, b) => Math.abs(a.length - target.length) - Math.abs(b.length - target.length) || a.localeCompare(b)).slice(0, 5);
  return [near[index % 5], near[(index + 2) % 5]];
};
const QS_QCM_ANSWER: QuestionRow[] = QS_ROWS.map((r, i) => {
  const other = QS_ROWS.filter((o) => o.type !== r.type);
  return {
    fact: qsKey(r),
    prompt: `Quelle réponse va avec la question « ${qsQuestion(r)} » ?`,
    answer: r.a,
    wrong: twoOthers(other.map((o) => o.a), i, r.a),
    hints: hints("Lis la question, puis chaque réponse.", `La question demande ${QS_TYPE_FR[r.type]}.`, "Cherche la réponse qui donne cette sorte de renseignement."),
  };
});
const QS_QCM_WORD: QuestionRow[] = QS_ROWS.filter((_, i) => i < 14).map((r, i) => ({
  fact: qsKey(r),
  prompt: `Pour demander ${QS_TYPE_FR[r.type]}, quel mot choisis-tu ?`,
  answer: r.word,
  wrong: qsWrongWords(r, i),
  hints: hints("Pense à ce que tu veux savoir.", "Chaque mot interrogatif demande une sorte de renseignement.", cm2EnFirstLetter(r.word)),
}));
const QS_QCM_QUESTION: QuestionRow[] = QS_ROWS.map((r, i) => {
  // Un prix est aussi un nombre : « How much is it? » ne se propose jamais pour « un nombre », ni « How many… ? » pour « un prix ».
  const other = QS_ROWS.filter((o) => o.type !== r.type && o.word !== r.word && !(["nombre", "prix"].includes(r.type) && ["nombre", "prix"].includes(o.type)));
  return {
    fact: qsKey(r),
    prompt: `Quelle question demande ${QS_TYPE_FR[r.type]} ?`,
    answer: qsQuestion(r),
    wrong: twoOthers(other.map(qsQuestion), i, qsQuestion(r)),
    hints: hints("Lis chaque question en entier.", `Cherche le mot qui demande ${QS_TYPE_FR[r.type]}.`, "Les deux autres questions demandent autre chose."),
  };
});
const QS_QCM = cm2EnInterleave(QS_QCM_ANSWER, QS_QCM_WORD, QS_QCM_QUESTION);

const QS_GAP_WORD: GapRow[] = QS_ROWS.map((r, i) => ({
  fact: qsKey(r),
  prompt: `${r.fr} Complète la question en anglais.`,
  text: `___ ${r.rest}`,
  answer: r.word,
  wrong: qsWrongWords(r, i),
  hints: hints("Lis la question française, puis la phrase anglaise.", `La question demande ${QS_TYPE_FR[r.type]}.`, cm2EnFirstLetter(r.word)),
}));
const QS_GAP_BECAUSE: GapRow[] = QS_ROWS.filter((r) => r.type === "raison").map((r) => ({
  fact: qsKey(r),
  prompt: `On te demande « ${qsQuestion(r)} ». Complète la réponse.`,
  text: r.a.replace("Because", "___"),
  answer: "Because",
  wrong: ["When", "Where"],
  hints: hints("Lis la question, puis la réponse.", "Une raison commence par un mot qui veut dire parce que.", cm2EnFirstLetter("Because")),
}));
const QS_TROU = cm2EnInterleave(QS_GAP_WORD, QS_GAP_BECAUSE);

const QS_WRITE_WORD: WriteRow[] = QS_ROWS.filter((r) => r.type !== "chose").map((r) => ({
  fact: qsKey(r),
  prompt: `${r.fr} Écris le mot interrogatif qui manque dans ___ ${r.rest}`,
  accepted: [r.word, qsLowerFirst(r.word)],
  hints: hints("Lis la question française, puis la phrase anglaise.", `La question demande ${QS_TYPE_FR[r.type]}.`, cm2EnFirstLetter(r.word)),
}));
const QS_WRITE_TYPE: WriteRow[] = (["personne", "lieu", "moment", "raison", "nombre", "prix"] as const).map((type) => ({
  fact: `qs:type:${type}`,
  prompt: `Quel mot interrogatif demande ${QS_TYPE_FR[type]} ? Écris-le en anglais.`,
  accepted: [QS_WORD[type], qsLowerFirst(QS_WORD[type])],
  hints: hints("Pense à ce que tu veux savoir.", "Chaque mot interrogatif demande une sorte de renseignement.", cm2EnFirstLetter(QS_WORD[type])),
}));
const QS_ECRIRE = cm2EnInterleave(QS_WRITE_WORD, QS_WRITE_TYPE);

const QS_ORDRE: OrderRow[] = cm2EnInterleave(
  QS_ROWS.filter((_, i) => i % 2 === 0).map((r) => ordr(CM2_EN_QUESTION_PROMPT, cm2EnWordsOf(qsQuestion(r)), CM2_EN_QUESTION_HINTS, qsKey(r))),
  QS_ROWS.filter((_, i) => i % 2 === 1).map((r) => ordr(CM2_EN_SENTENCE_PROMPT, cm2EnWordsOf(r.a), CM2_EN_SENTENCE_HINTS, qsKey(r))),
);

const QS_RELIER: LinkRow[] = cm2EnInterleave(
  [0, 1, 2, 3, 4, 5].map((i) =>
    cm2EnLink(
      "Relie chaque mot interrogatif à ce qu'il demande.",
      [0, 1, 2, 3].map((k) => (["personne", "lieu", "moment", "raison", "nombre", "prix"] as const)[(i + k) % 6]).map((type) => [QS_WORD[type], QS_LABEL[type]] as const),
      `qs-mots:${i}`,
    ),
  ),
  cm2EnTrios(QS_ROWS.filter((r) => r.type !== "chose"), 1).map((trio, i) =>
    cm2EnLink("Relie chaque question à sa réponse.", trio.map((r) => [qsQuestion(r), r.a] as const), `qs-reponses:${i}`),
  ),
);

const typeOf = (type: QsType) => QS_ROWS.filter((r) => r.type === type).map(qsQuestion);
const QS_GLISSER = [
  ...sortRows("Glisse chaque question dans la bonne case.", [QS_LABEL.lieu, QS_LABEL.personne], typeOf("lieu"), typeOf("personne"), CM2_EN_SORT_HINTS, 6),
  ...sortRows("Glisse chaque question dans la bonne case.", [QS_LABEL.moment, QS_LABEL.nombre], typeOf("moment"), typeOf("nombre"), CM2_EN_SORT_HINTS, 6),
  ...sortRows("Glisse chaque question dans la bonne case.", [QS_LABEL.raison, QS_LABEL.prix], typeOf("raison"), typeOf("prix"), CM2_EN_SORT_HINTS, 6),
  ...sortRows(
    CM2_EN_SORT_PROMPT,
    ["Je demande", "Je réponds"],
    QS_ROWS.filter((_, i) => i % 5 === 0).map(qsQuestion),
    QS_ROWS.filter((_, i) => i % 5 === 2).map((r) => r.a),
    CM2_EN_SORT_HINTS,
    6,
  ),
];

export const makeCm2EnQsPhrase: Make = (ctx) => ce2Question(ctx, "cm2-en-qs-phrase", "associer une question à sa réponse ou à son mot interrogatif", QS_QCM, 3);
export const makeCm2EnQsTrou: Make = (ctx) => ce2Gap(ctx, "cm2-en-qs-trou", "compléter une question avec le bon mot interrogatif", QS_TROU, 2, 1);
export const makeCm2EnQsEcrire: Make = (ctx) => ce2Write(ctx, "cm2-en-qs-ecrire", "écrire un mot interrogatif", QS_ECRIRE, 1, 2);
export const makeCm2EnQsOrdre: Make = (ctx) => ce2Order(ctx, "cm2-en-qs-ordre", "remettre les mots d'une question ou d'une réponse", QS_ORDRE);
export const makeCm2EnQsRelier: Make = (ctx) => ce2Link(ctx, "cm2-en-qs-relier", "relier un mot interrogatif à ce qu'il demande, une question à sa réponse", QS_RELIER);
export const makeCm2EnQsGlisser: Make = (ctx) => ce2Sort(ctx, "cm2-en-qs-glisser", "classer les questions selon ce qu'elles demandent, les demandes et les réponses", QS_GLISSER, 2);

// ===========================================================================
// LIRE UN PETIT TEXTE (an-cm2-reading)
// ===========================================================================

type RdText = {
  en: string;
  qa: readonly { q: string; right: string; wrong: readonly [string, string] }[];
  yes: readonly string[];
  no: readonly string[];
  gap: readonly { text: string; answer: string; wrong: readonly [string, string] }[];
  num: readonly { q: string; n: number }[];
  pairs: readonly (readonly [string, string])[];
};

const RD_TEXTS: readonly RdText[] = [
  {
    en: "My name is Awa. I am ten years old. I live in Dakar with my mother and my brother. Every day I go to school.",
    qa: [
      { q: "Où habite Awa ?", right: "À Dakar", wrong: ["À Thiès", "À Saint-Louis"] },
      { q: "Avec qui Awa habite-t-elle ?", right: "Avec sa mère et son frère", wrong: ["Avec son père et sa sœur", "Avec sa tante et son oncle"] },
      { q: "Où Awa va-t-elle chaque jour ?", right: "À l'école", wrong: ["Au marché", "À la mosquée"] },
    ],
    yes: ["Awa is ten years old.", "Awa lives in Dakar.", "Awa lives with her mother and her brother.", "Awa goes to school every day."],
    no: ["Awa lives in Thiès.", "Awa goes to the market every day.", "Awa is eleven years old."],
    gap: [
      { text: "Awa lives in ___.", answer: "Dakar", wrong: ["Thiès", "Kaolack"] },
      { text: "Awa is ___ years old.", answer: "ten", wrong: ["nine", "eleven"] },
      { text: "Awa goes to ___ every day.", answer: "school", wrong: ["market", "mosque"] },
    ],
    num: [{ q: "Quel âge a Awa ?", n: 10 }],
    pairs: [
      ["Où habite Awa ?", "Dakar"],
      ["Quel âge a Awa ?", "Ten"],
      ["Où Awa va-t-elle chaque jour ?", "School"],
    ],
  },
  {
    en: "Moussa is eleven. He likes football. On Saturday he plays football with his friends. After the game, he drinks water and eats a mango.",
    qa: [
      { q: "Que fait Moussa le samedi ?", right: "Il joue au football", wrong: ["Il va au marché", "Il regarde la télévision"] },
      { q: "Qu'est-ce que Moussa aime ?", right: "Le football", wrong: ["La musique", "Les mathématiques"] },
      { q: "Que boit Moussa après le match ?", right: "De l'eau", wrong: ["Du lait", "Du jus"] },
    ],
    yes: ["Moussa is eleven.", "Moussa likes football.", "Moussa plays football on Saturday.", "Moussa eats a mango after the game."],
    no: ["Moussa likes mathematics.", "Moussa drinks milk after the game.", "Moussa is ten years old."],
    gap: [
      { text: "Moussa is ___ years old.", answer: "eleven", wrong: ["ten", "twelve"] },
      { text: "Moussa plays football on ___.", answer: "Saturday", wrong: ["Monday", "Sunday"] },
      { text: "After the game, Moussa drinks ___.", answer: "water", wrong: ["milk", "juice"] },
    ],
    num: [{ q: "Quel âge a Moussa ?", n: 11 }],
    pairs: [
      ["Quel âge a Moussa ?", "Eleven"],
      ["Quel jour joue-t-il au football ?", "Saturday"],
      ["Que mange-t-il après le match ?", "A mango"],
    ],
  },
  {
    en: "Fatou goes to the market with her mother. She buys three mangoes and two kilos of rice. The mangoes cost five hundred francs. Fatou is happy.",
    qa: [
      { q: "Où va Fatou ?", right: "Au marché", wrong: ["À l'école", "À la mosquée"] },
      { q: "Combien de mangues Fatou achète-t-elle ?", right: "Trois", wrong: ["Deux", "Cinq"] },
      { q: "Combien coûtent les mangues ?", right: "Cinq cents francs", wrong: ["Trois cents francs", "Deux cents francs"] },
    ],
    yes: ["Fatou goes to the market with her mother.", "Fatou buys three mangoes.", "Fatou buys two kilos of rice.", "Fatou is happy."],
    no: ["Fatou buys five mangoes.", "Fatou is sad.", "Fatou goes to school with her mother."],
    gap: [
      { text: "Fatou buys three ___.", answer: "mangoes", wrong: ["bananas", "onions"] },
      { text: "Fatou goes to the market with her ___.", answer: "mother", wrong: ["father", "brother"] },
      { text: "The mangoes cost five ___ francs.", answer: "hundred", wrong: ["thousand", "thirty"] },
    ],
    num: [
      { q: "Combien de mangues Fatou achète-t-elle ?", n: 3 },
      { q: "Combien de kilos de riz Fatou achète-t-elle ?", n: 2 },
      { q: "Combien coûtent les mangues, en francs ?", n: 500 },
    ],
    pairs: [
      ["Où va Fatou ?", "Market"],
      ["Avec qui va-t-elle ?", "Mother"],
      ["Que prend-elle en plus du riz ?", "Mangoes"],
    ],
  },
  {
    en: "Last Sunday we visited my grandmother. She cooked rice and fish. We ate in the garden. Then we played football.",
    qa: [
      { q: "Quand ont-ils rendu visite à la grand-mère ?", right: "Dimanche dernier", wrong: ["Hier soir", "La semaine dernière"] },
      { q: "Qu'a cuisiné la grand-mère ?", right: "Du riz et du poisson", wrong: ["Du pain et des œufs", "Des mangues et des oignons"] },
      { q: "Où ont-ils mangé ?", right: "Dans le jardin", wrong: ["À l'école", "Au marché"] },
    ],
    yes: ["We visited my grandmother.", "My grandmother cooked rice and fish.", "We ate in the garden.", "We played football."],
    no: ["We ate in the house.", "My grandmother cooked bread and eggs.", "We visited my grandmother last night."],
    gap: [
      { text: "We visited my ___.", answer: "grandmother", wrong: ["mother", "sister"] },
      { text: "We ate in the ___.", answer: "garden", wrong: ["market", "street"] },
      { text: "Then we played ___.", answer: "football", wrong: ["cards", "music"] },
    ],
    num: [],
    pairs: [
      ["Quel jour ont-ils rendu visite à la grand-mère ?", "Sunday"],
      ["Qui a cuisiné ?", "Grandmother"],
      ["Où ont-ils mangé ?", "Garden"],
    ],
  },
  {
    en: "The school is next to the market. The bank is opposite the school. The hospital is next to the bank.",
    qa: [
      { q: "Qu'est-ce qui est à côté du marché ?", right: "L'école", wrong: ["La banque", "L'hôpital"] },
      { q: "Que trouve-t-on en face de l'école ?", right: "La banque", wrong: ["Le marché", "L'hôpital"] },
      { q: "Où est l'hôpital ?", right: "À côté de la banque", wrong: ["En face de l'école", "À côté du marché"] },
    ],
    yes: ["The school is next to the market.", "The bank is opposite the school.", "The hospital is next to the bank."],
    no: ["The bank is next to the school.", "The market is opposite the bank.", "The hospital is opposite the school."],
    gap: [
      { text: "The school is next to the ___.", answer: "market", wrong: ["bank", "hospital"] },
      { text: "The bank is ___ the school.", answer: "opposite", wrong: ["next to", "between"] },
      { text: "The hospital is next to the ___.", answer: "bank", wrong: ["school", "market"] },
    ],
    num: [],
    pairs: [
      ["Qu'est-ce qui est à côté du marché ?", "School"],
      ["Que trouve-t-on en face de l'école ?", "Bank"],
      ["Qu'est-ce qui est à côté de la banque ?", "Hospital"],
    ],
  },
  {
    en: "Tomorrow is Saturday. I am going to help my father at the market. My sister is going to cook rice. In the evening, we are going to watch television.",
    qa: [
      { q: "Quel jour est demain ?", right: "Samedi", wrong: ["Dimanche", "Lundi"] },
      { q: "Que va cuisiner la sœur ?", right: "Du riz", wrong: ["Du poisson", "Du pain"] },
      { q: "Que vont faire les enfants le soir ?", right: "Regarder la télévision", wrong: ["Jouer au football", "Aller au marché"] },
    ],
    yes: ["Tomorrow is Saturday.", "I am going to help my father.", "My sister is going to cook rice.", "We are going to watch television."],
    no: ["Tomorrow is Sunday.", "My sister is going to cook fish.", "We are going to play football in the evening."],
    gap: [
      { text: "Tomorrow is ___.", answer: "Saturday", wrong: ["Sunday", "Monday"] },
      { text: "My sister is going to cook ___.", answer: "rice", wrong: ["fish", "bread"] },
      { text: "I am going to help my ___ at the market.", answer: "father", wrong: ["mother", "teacher"] },
    ],
    num: [],
    pairs: [
      ["Quel jour est demain ?", "Saturday"],
      ["Qui l'enfant va-t-il aider ?", "Father"],
      ["Que va cuisiner la sœur ?", "Rice"],
    ],
  },
  {
    en: "Yesterday I was at the mosque with my father. My mother was at home. We were hungry. We ate rice and fish.",
    qa: [
      { q: "Où étaient l'enfant et son père hier ?", right: "À la mosquée", wrong: ["Au marché", "À l'école"] },
      { q: "Où était la mère ?", right: "À la maison", wrong: ["Au marché", "Dans le jardin"] },
      { q: "Comment étaient-ils ?", right: "Ils avaient faim", wrong: ["Ils étaient tristes", "Ils avaient froid"] },
    ],
    yes: ["My mother was at home.", "We were hungry.", "We ate rice and fish.", "I was at the mosque with my father."],
    no: ["We were tired.", "I was at school yesterday.", "My mother was at the market."],
    gap: [
      { text: "My mother was ___.", answer: "at home", wrong: ["at school", "at the market"] },
      { text: "We were ___.", answer: "hungry", wrong: ["tired", "sad"] },
      { text: "We ate rice and ___.", answer: "fish", wrong: ["bread", "eggs"] },
    ],
    num: [],
    pairs: [
      ["Où était la mère ?", "Home"],
      ["Avec qui l'enfant était-il à la mosquée ?", "Father"],
      ["Qu'ont-ils mangé avec le riz ?", "Fish"],
    ],
  },
];

const RD_DIALOGUES: readonly (readonly string[])[] = [
  ["Hello, Moussa.", "Hello, Awa. How are you?", "I am fine, thank you."],
  ["Hello, Modou.", "Hello, Fatou. How are you?", "I am fine, thank you."],
  ["How much is the book?", "It is two hundred francs.", "I would like the book, please."],
  ["How much is the bag?", "It is five hundred francs.", "I would like the bag, please."],
  ["Where are you going?", "I am going to the market.", "What are you going to buy?", "I am going to buy rice."],
  ["Excuse me, where is the post office?", "It is opposite the bank.", "Thank you."],
  ["Hello, Fatou.", "Hello, Modou. What are you going to do tomorrow?", "I am going to visit my grandmother."],
  ["Why are you sad?", "Because I am tired.", "Go to bed, then."],
];

const lis = (t: RdText) => `Lis le texte. « ${t.en} »`;
const rdHints = hints("Lis le texte en entier, puis la question.", "Retrouve la phrase du texte qui parle de ce sujet.", "Ne choisis pas ce que tu devines : choisis ce que dit le texte.");
const rdKey = (index: number, part: string, i: number) => `rd:${index}:${part}:${i}`;

const RD_QCM: QuestionRow[] = RD_TEXTS.flatMap((t, ti) => t.qa.map((qa, i) => ({ fact: rdKey(ti, "qa", i), prompt: `${lis(t)} ${qa.q}`, answer: qa.right, wrong: qa.wrong, hints: rdHints })));
const RD_TROU: GapRow[] = RD_TEXTS.flatMap((t, ti) =>
  t.gap.map((g, i) => ({
    fact: rdKey(ti, "gap", i),
    prompt: `${lis(t)} Complète la phrase.`,
    text: g.text,
    answer: g.answer,
    wrong: g.wrong,
    hints: hints("Lis le texte en entier, puis la phrase.", "Retrouve la phrase du texte qui ressemble à celle-ci.", "Le mot qui manque est celui que le texte écrit."),
  })),
);
const RD_ECRIRE: WriteRow[] = RD_TEXTS.flatMap((t, ti) =>
  t.num.map((n, i) => ({
    fact: rdKey(ti, "num", i),
    prompt: `${lis(t)} ${n.q} Écris le nombre en chiffres.`,
    accepted: [String(n.n)],
    hints: hints("Lis le texte en entier.", "Le nombre est écrit en lettres, quelque part au milieu du texte.", "Écris-le avec des chiffres, pas avec des lettres."),
  })),
);
const RD_ORDRE: OrderRow[] = RD_DIALOGUES.map((lines, i) =>
  ordr("Remets ce dialogue dans l'ordre, de la première à la dernière phrase.", lines, hints("Un dialogue commence par une question ou un bonjour.", "La réponse vient juste après la question.", "La dernière phrase répond ou remercie."), `rd:dialogue:${i}`),
);
const RD_RELIER: LinkRow[] = RD_TEXTS.map((t, ti) => ({
  fact: `rd:${ti}:pairs`,
  prompt: `${lis(t)} Relie chaque question à sa réponse.`,
  pairs: t.pairs.map(([left, right]) => ({ left, right })),
  hints: hints("Lis le texte en entier, puis les questions.", "Les réponses sont des mots du texte.", "Commence par la question dont tu es sûr."),
}));
const RD_GLISSER = RD_TEXTS.flatMap((t) =>
  sortRows(`${lis(t)} Glisse chaque phrase dans la bonne case.`, ["True", "False"], t.yes, t.no, hints("Lis le texte en entier, puis chaque phrase.", "La première case est pour ce qui est vrai, la seconde pour ce qui est faux.", "Retrouve la phrase du texte qui parle du même sujet."), 6),
);

export const makeCm2EnRdPhrase: Make = (ctx) => ce2Question(ctx, "cm2-en-rd-phrase", "répondre à une question sur un petit texte anglais", RD_QCM, 3);
export const makeCm2EnRdTrou: Make = (ctx) => ce2Gap(ctx, "cm2-en-rd-trou", "compléter une phrase avec un mot d'un petit texte anglais", RD_TROU, 2, 1);
export const makeCm2EnRdEcrire: Make = (ctx) => ce2Write(ctx, "cm2-en-rd-ecrire", "écrire en chiffres un nombre d'un petit texte anglais", RD_ECRIRE, 1, 2);
export const makeCm2EnRdOrdre: Make = (ctx) => ce2Order(ctx, "cm2-en-rd-ordre", "remettre les phrases d'un petit dialogue anglais dans l'ordre", RD_ORDRE);
export const makeCm2EnRdRelier: Make = (ctx) => ce2Link(ctx, "cm2-en-rd-relier", "relier des questions françaises à leurs réponses dans un petit texte anglais", RD_RELIER);
export const makeCm2EnRdGlisser: Make = (ctx) => ce2Sort(ctx, "cm2-en-rd-glisser", "classer des phrases vraies ou fausses selon un petit texte anglais", RD_GLISSER, 2);
