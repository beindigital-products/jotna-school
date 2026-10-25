/**
 * LES GABARITS D'ANGLAIS DU CM1, LES MOTS : les métiers, au marché, décrire une personne ou un objet
 * (`an-cm1-jobs`, `an-cm1-market`, `an-cm1-describe`).
 *
 * Le modèle écrivait ici « My father is driver », « two smalls dogs », « five hundreds francs », un métier pour un autre. Ici une phrase se DÉDUIT
 * d'un sujet, d'un mot et d'un complément pris dans des tables fermées : le petit mot a devant un métier, le pluriel du produit (-s ou -es),
 * le nombre écrit en lettres, l'adjectif placé AVANT le nom et jamais accordé. Les mauvais choix sont les fautes d'enfant de la fiche, jamais
 * une phrase qui serait juste aussi.
 *
 * Les thématiques ont DEUX, TROIS et TROIS paliers : chaque gabarit donne à chaque palier sa part de la liste (`ce2Outils`).
 *
 * HORS FICHE, À FAIRE RELIRE PAR UN PROFESSEUR D'ANGLAIS
 * - Les personnes (my father, my mother, my uncle, my aunt, my brother, my sister) et ce que fait chaque métier en français (« attrape des
 *   poissons », « coud des habits », « aide le médecin à l'hôpital »), le métier féminin (infirmière, agricultrice, commerçante).
 * - Au marché : les quantités de deux à six, les prix ronds de cent à mille francs, les mots mal écrits proposés (fourty, ninty, eightty…),
 *   « How much are the bananas? », « A kilo of fish, please. », « A kilo of bread, please. ».
 * - Décrire : les noms (ball, bag, book, house, dog, cat, hat), les couleurs (red, blue, green, black, brown), le français de chaque phrase.
 *
 * MODULE PUR (voir `types.ts`).
 */
import { ce2Gap, ce2Link, ce2Order, ce2Question, ce2Sort, ce2Write, hints, ordr, sortRows, type GapRow, type LinkRow, type OrderRow, type QuestionRow, type WriteRow } from "./ce2Outils";
import { QUESTION_HINTS, QUESTION_PROMPT, SENTENCE_HINTS, SENTENCE_PROMPT, SORT_HINTS_EN, SORT_PROMPT, apostrophes, firstLetter, interleave, link, trios, wordsOf } from "./cm1AnglaisOutils";
import type { GameContext, GeneratedGame } from "./shared";

type Make = (ctx: GameContext) => GeneratedGame;

// ===========================================================================
// LES MÉTIERS (an-cm1-jobs)
// ===========================================================================

type Job = { en: string; fr: string; frF: string; clue: string; confusable: readonly string[] };
const JOBS: readonly Job[] = [
  { en: "teacher", fr: "maître", frF: "maîtresse", clue: "enseigne aux élèves", confusable: [] },
  { en: "doctor", fr: "médecin", frF: "médecin", clue: "soigne les malades", confusable: ["nurse"] },
  { en: "nurse", fr: "infirmier", frF: "infirmière", clue: "aide le médecin à l'hôpital", confusable: ["doctor"] },
  { en: "farmer", fr: "agriculteur", frF: "agricultrice", clue: "cultive les champs", confusable: [] },
  { en: "fisherman", fr: "pêcheur", frF: "pêcheuse", clue: "attrape des poissons", confusable: [] },
  { en: "driver", fr: "chauffeur", frF: "chauffeuse", clue: "conduit une voiture", confusable: [] },
  { en: "tailor", fr: "tailleur", frF: "tailleuse", clue: "coud des habits", confusable: [] },
  { en: "trader", fr: "commerçant", frF: "commerçante", clue: "vend des produits au marché", confusable: [] },
  { en: "police officer", fr: "policier", frF: "policière", clue: "protège les gens", confusable: [] },
  { en: "student", fr: "élève", frF: "élève", clue: "apprend à l'école", confusable: [] },
];

type Person = { text: string; q: string; pron: string; fr: string; female: boolean };
const PERSONS: readonly Person[] = [
  { text: "My father", q: "your father", pron: "He", fr: "Mon père", female: false },
  { text: "My mother", q: "your mother", pron: "She", fr: "Ma mère", female: true },
  { text: "My uncle", q: "your uncle", pron: "He", fr: "Mon oncle", female: false },
  { text: "My aunt", q: "your aunt", pron: "She", fr: "Ma tante", female: true },
  { text: "My brother", q: "your brother", pron: "He", fr: "Mon frère", female: false },
  { text: "My sister", q: "your sister", pron: "She", fr: "Ma sœur", female: true },
];

type JbRow = { p: Person; j: Job; key: string };
/** Les personnes qui vont avec un métier : un pêcheur (fisherman) est un homme, un élève est un frère ou une sœur. */
const personsFor = (j: Job): readonly Person[] =>
  j.en === "fisherman" ? PERSONS.filter((p) => !p.female) : j.en === "student" ? PERSONS.filter((p) => p.text === "My brother" || p.text === "My sister") : PERSONS;
/** Vingt-huit lignes environ : chaque métier avec trois des personnes qui lui vont (deux pour l'élève). */
const JB_ROWS: readonly JbRow[] = JOBS.flatMap((j, ji) => {
  const allowed = personsFor(j);
  const count = Math.min(3, allowed.length);
  return Array.from({ length: count }, (_, k) => allowed[(ji + k * (allowed.length > 3 ? 2 : 1)) % allowed.length]).map((p) => ({ p, j, key: `jb:${j.en}:${p.text}` }));
}).filter((row, index, all) => all.findIndex((other) => other.key === row.key) === index);

const jbSentence = (p: Person, j: Job, subject = p.text, article = "a") => `${subject} is ${article === "" ? "" : `${article} `}${j.en}.`;
const jbFrench = (p: Person, j: Job) => `${p.fr} est ${p.female ? j.frF : j.fr}.`;
const jbClue = (p: Person, j: Job) => `${p.fr} ${j.clue}.`;
/** Deux autres métiers, sans un métier qui irait aussi à la description. */
const otherJobs = (j: Job, index: number) => {
  const others = JOBS.filter((other) => other !== j && !j.confusable.includes(other.en)).map((other) => other.en);
  return [others[(index * 2) % others.length], others[(index * 2 + 3) % others.length]];
};

const JB_PHRASE_POS: QuestionRow[] = JB_ROWS.map(({ p, j, key }) => ({
  fact: key,
  prompt: "Quelle phrase est juste ?",
  answer: jbSentence(p, j),
  wrong: [jbSentence(p, j, p.text, ""), `${p.text} a ${j.en}.`],
  hints: hints("Lis chaque phrase en entier.", "Devant un métier, au singulier, il faut un petit mot, et le verbe être avant lui.", "Cherche la phrase qui a les deux."),
}));
const JB_PHRASE_REPLY: QuestionRow[] = JB_ROWS.map(({ p, j, key }) => ({
  fact: key,
  prompt: `On te demande « What does ${p.q} do? ». Quelle est la bonne réponse ?`,
  answer: jbSentence(p, j, p.pron),
  wrong: [jbSentence(p, j, p.pron, ""), `${p.pron} are a ${j.en}.`],
  hints: hints("Lis la question, puis chaque réponse.", "La réponse dit le métier avec le verbe être et un petit mot devant.", "Cherche la phrase qui a les deux et un verbe qui va avec le sujet."),
}));
const JB_PHRASE_CLUE: QuestionRow[] = JB_ROWS.map(({ p, j, key }, index) => ({
  fact: key,
  prompt: `${jbClue(p, j)} Comment dit-on son métier en anglais ?`,
  answer: j.en,
  wrong: otherJobs(j, index),
  hints: hints("Lis la phrase française : elle dit ce que fait la personne.", "Cherche le métier qui fait cela.", firstLetter(j.en)),
}));
const JB_QCM = interleave(JB_PHRASE_POS, JB_PHRASE_REPLY, JB_PHRASE_CLUE);

const JB_GAP_ARTICLE: GapRow[] = JB_ROWS.map(({ p, j, key }) => ({
  fact: key,
  text: `${p.text} is ___ ${j.en}.`,
  answer: "a",
  wrong: ["an", "some"],
  hints: hints("Lis la phrase en entier.", "Devant un métier, au singulier, on met un petit mot d'une lettre.", "Ce petit mot est la première lettre de l'alphabet."),
}));
const JB_GAP_JOB: GapRow[] = JB_ROWS.map(({ p, j, key }, index) => ({
  fact: key,
  prompt: `${jbClue(p, j)} Complète la phrase en anglais.`,
  text: `${p.text} is a ___.`,
  answer: j.en,
  wrong: otherJobs(j, index),
  hints: hints("Lis la phrase française : elle dit ce que fait la personne.", "Cherche le métier qui fait cela.", firstLetter(j.en)),
}));
const JB_GAP_DOES: GapRow[] = PERSONS.map((p) => ({
  fact: `jb-does:${p.text}`,
  text: `What ___ ${p.q} do?`,
  answer: "does",
  wrong: ["do", "is"],
  hints: hints("Lis la phrase en entier.", "Avec un seul nom, la question utilise un petit mot d'aide.", "Ce petit mot commence par la lettre d."),
}));
const JB_TROU = interleave(JB_GAP_ARTICLE, JB_GAP_JOB, JB_GAP_DOES);

const JB_WRITE_JOB: WriteRow[] = JB_ROWS.map(({ p, j, key }) => ({
  fact: key,
  prompt: `${jbClue(p, j)} Écris le métier en anglais qui manque dans ${p.text} is a ___.`,
  accepted: [j.en],
  hints: hints("Lis la phrase française : elle dit ce que fait la personne.", "Cherche le métier qui fait cela.", firstLetter(j.en)),
}));
const JB_WRITE_ARTICLE: WriteRow[] = JB_ROWS.filter((_, index) => index % 2 === 0).map(({ p, j, key }) => ({
  fact: key,
  prompt: `Écris le petit mot qui manque. ${p.text} is ___ ${j.en}.`,
  accepted: ["a"],
  hints: hints("Lis la phrase en entier.", "Devant un métier, au singulier, on met un petit mot d'une lettre.", "Ce petit mot est la première lettre de l'alphabet."),
}));
const JB_WRITE_DOES: WriteRow[] = PERSONS.map((p) => ({
  fact: `jb-does:${p.text}`,
  prompt: `Écris le petit mot qui manque. What ___ ${p.q} do?`,
  accepted: ["does"],
  hints: hints("Lis la phrase en entier.", "Avec un seul nom, la question utilise un petit mot d'aide.", "Ce petit mot commence par la lettre d."),
}));
const JB_ECRIRE = interleave(JB_WRITE_JOB, JB_WRITE_ARTICLE, JB_WRITE_DOES);

const JB_ORDRE: OrderRow[] = interleave(
  JB_ROWS.filter((_, index) => index % 3 === 0).map(({ p, j, key }) => ordr(SENTENCE_PROMPT, wordsOf(jbSentence(p, j)), SENTENCE_HINTS, key)),
  PERSONS.map((p) => ordr(QUESTION_PROMPT, wordsOf(`What does ${p.q} do?`), QUESTION_HINTS, `jb-does:${p.text}`)),
  JB_ROWS.filter((_, index) => index % 3 === 1).map(({ p, j, key }) => ordr(SENTENCE_PROMPT, wordsOf(jbSentence(p, j, p.pron)), SENTENCE_HINTS, key)),
);

const JB_RELIER: LinkRow[] = interleave(
  JOBS.map((_, i) => link("Relie chaque métier anglais à son sens en français.", [0, 1, 2, 3].map((k) => JOBS[(i + k) % 10]).map((j) => [j.en, j.fr] as const), `jb-metiers:${i}`)),
  JOBS.map((_, i) => link("Relie chaque métier à ce qu'il fait.", [0, 1, 2].map((k) => JOBS[(i + k * 3) % 10]).map((j) => [j.en, j.clue] as const), `jb-actions:${i}`)),
  PERSONS.flatMap((p) =>
    trios(JB_ROWS.filter((row) => row.p === p), 2).map((trio) => link("Relie chaque phrase anglaise à la même phrase en français.", trio.map((row) => [jbSentence(row.p, row.j), jbFrench(row.p, row.j)] as const), `jb-phrases:${trio[0].key}`)),
  ),
);

const JB_GLISSER = [
  ...sortRows("Glisse chaque métier dans la bonne case.", ["Soigne les gens", "Travaille dehors"], ["doctor", "nurse"], ["farmer", "fisherman"], SORT_HINTS_EN, 8),
  ...sortRows("Glisse chaque personne dans la bonne case.", ["He", "She"], ["My father", "My uncle", "My brother"], ["My mother", "My aunt", "My sister"], SORT_HINTS_EN, 8),
  ...sortRows(
    SORT_PROMPT,
    ["Phrase juste", "Phrase fausse"],
    ["My father is a driver.", "She is a nurse.", "He is a farmer."],
    ["My father is driver.", "She is nurse.", "He is farmer."],
    SORT_HINTS_EN,
    8,
  ),
];

export const makeCm1EnJbPhrase: Make = (ctx) => ce2Question(ctx, "cm1-en-jb-phrase", "choisir la bonne phrase ou le bon métier en anglais", JB_QCM, 3);
export const makeCm1EnJbTrou: Make = (ctx) => ce2Gap(ctx, "cm1-en-jb-trou", "compléter une phrase sur un métier", JB_TROU, 2, 1);
export const makeCm1EnJbEcrire: Make = (ctx) => ce2Write(ctx, "cm1-en-jb-ecrire", "écrire le métier ou le petit mot qui manque", JB_ECRIRE, 1, 2);
export const makeCm1EnJbOrdre: Make = (ctx) => ce2Order(ctx, "cm1-en-jb-ordre", "remettre les mots d'une phrase ou d'une question sur un métier", JB_ORDRE);
export const makeCm1EnJbRelier: Make = (ctx) => ce2Link(ctx, "cm1-en-jb-relier", "relier un métier à son sens, à ce qu'il fait, ou une phrase à son sens", JB_RELIER);
export const makeCm1EnJbGlisser: Make = (ctx) => ce2Sort(ctx, "cm1-en-jb-glisser", "classer les métiers, les personnes et les phrases justes ou fausses", JB_GLISSER, 2);

// ===========================================================================
// AU MARCHÉ (an-cm1-market)
// ===========================================================================

type Product = { en: string; pl: string; fr: string; frPl: string; wrong: readonly [string, string]; plural: boolean };
const COUNTABLE: readonly Product[] = [
  { en: "mango", pl: "mangoes", fr: "mangue", frPl: "mangues", wrong: ["mango", "mangoies"], plural: true },
  { en: "banana", pl: "bananas", fr: "banane", frPl: "bananes", wrong: ["banana", "bananaes"], plural: true },
  { en: "tomato", pl: "tomatoes", fr: "tomate", frPl: "tomates", wrong: ["tomato", "tomatoies"], plural: true },
  { en: "onion", pl: "onions", fr: "oignon", frPl: "oignons", wrong: ["onion", "oniones"], plural: true },
  { en: "egg", pl: "eggs", fr: "œuf", frPl: "œufs", wrong: ["egg", "egges"], plural: true },
];
type Mass = { en: string; fr: string };
const MASSES: readonly Mass[] = [
  { en: "rice", fr: "riz" },
  { en: "fish", fr: "poisson" },
  { en: "bread", fr: "pain" },
];

const QUANTITIES: readonly (readonly [string, string])[] = [
  ["two", "deux"],
  ["three", "trois"],
  ["four", "quatre"],
  ["five", "cinq"],
  ["six", "six"],
];

type MkPlural = { product: Product; qty: readonly [string, string]; key: string };
/** Dix lignes : chaque produit avec deux quantités. */
const MK_PLURALS: readonly MkPlural[] = COUNTABLE.flatMap((product, i) => [0, 2].map((k) => ({ product, qty: QUANTITIES[(i + k) % 5], key: `mk-pl:${product.en}:${(i + k) % 5}` })));
const mkRequest = (row: MkPlural, plural = row.product.pl) => `I would like ${row.qty[0]} ${plural}, please.`;

type Num = { words: string; digits: string; misspell: readonly [string, string] };
const TENS: readonly Num[] = [
  { words: "twenty", digits: "20", misspell: ["twenti", "tewnty"] },
  { words: "thirty", digits: "30", misspell: ["thirthy", "thirtie"] },
  { words: "forty", digits: "40", misspell: ["fourty", "fortie"] },
  { words: "fifty", digits: "50", misspell: ["fivety", "fiftie"] },
  { words: "sixty", digits: "60", misspell: ["sixthy", "sixtie"] },
  { words: "seventy", digits: "70", misspell: ["seventee", "sevinty"] },
  { words: "eighty", digits: "80", misspell: ["eightty", "eigthy"] },
  { words: "ninety", digits: "90", misspell: ["ninty", "nintey"] },
];
const TEENS: readonly (readonly [string, string])[] = [
  ["thirteen", "13"],
  ["fourteen", "14"],
  ["fifteen", "15"],
  ["sixteen", "16"],
  ["seventeen", "17"],
  ["eighteen", "18"],
  ["nineteen", "19"],
];
const HUNDREDS: readonly Num[] = [
  { words: "one hundred", digits: "100", misspell: ["one hundreds", "one hundrad"] },
  { words: "two hundred", digits: "200", misspell: ["two hundreds", "two hundrad"] },
  { words: "three hundred", digits: "300", misspell: ["three hundreds", "three hundrad"] },
  { words: "four hundred", digits: "400", misspell: ["four hundreds", "four hundrad"] },
  { words: "five hundred", digits: "500", misspell: ["five hundreds", "five hundrad"] },
  { words: "six hundred", digits: "600", misspell: ["six hundreds", "six hundrad"] },
  { words: "seven hundred", digits: "700", misspell: ["seven hundreds", "seven hundrad"] },
  { words: "eight hundred", digits: "800", misspell: ["eight hundreds", "eight hundrad"] },
  { words: "nine hundred", digits: "900", misspell: ["nine hundreds", "nine hundrad"] },
  { words: "one thousand", digits: "1000", misspell: ["one thousands", "one thousend"] },
];
const NUMS = [...TENS, ...HUNDREDS];

const mkPrice = (n: Num, words = n.words, franc = "francs") => `It is ${words} ${franc}.`;

const MK_PHRASE_PLURAL: QuestionRow[] = MK_PLURALS.map((row) => ({
  fact: row.key,
  prompt: "Quelle phrase est juste ?",
  answer: mkRequest(row),
  wrong: row.product.wrong.map((wrong) => mkRequest(row, wrong)),
  hints: hints("Lis chaque phrase en entier.", "Quand il y en a plusieurs, le nom change à la fin.", "Compare la fin du nom dans les trois phrases."),
}));
const MK_PHRASE_PRICE: QuestionRow[] = HUNDREDS.map((n) => ({
  fact: `mk-prix:${n.digits}`,
  prompt: `Le prix est de ${n.digits} francs. Quelle phrase est juste ?`,
  answer: mkPrice(n),
  wrong: [mkPrice(n, n.misspell[0]), mkPrice(n, n.words, "franc")],
  hints: hints("Lis chaque phrase en entier.", "Un nombre de centaines ne prend pas de s, mais le nom de la monnaie, si.", "Compare la fin des mots dans les trois phrases."),
}));
const MK_PHRASE_TEEN: QuestionRow[] = TEENS.flatMap(([teen, digits]) => {
  const tens = TENS.find((t) => t.digits === `${digits.charAt(1)}0`) as Num;
  return [
    { fact: `mk-nombre:${teen}`, prompt: `Quel nombre est « ${teen} » ?`, answer: digits, wrong: [tens.digits, `${Number(digits) + 20}`], hints: hints("Lis le mot en entier, jusqu'à la fin.", "Les nombres de dix à dix-neuf finissent par -teen.", "Un nombre en -ty est une dizaine ronde.") },
    { fact: `mk-nombre:${tens.words}`, prompt: `Quel nombre est « ${tens.words} » ?`, answer: tens.digits, wrong: [digits, `${Number(tens.digits) + 3}`], hints: hints("Lis le mot en entier, jusqu'à la fin.", "Les dizaines rondes finissent par -ty.", "Un nombre en -teen est entre dix et dix-neuf.") },
  ];
});
const MK_PHRASE_SPELL: QuestionRow[] = TENS.map((n) => ({
  fact: `mk-ecrit:${n.words}`,
  prompt: `Comment s'écrit ${n.digits} en anglais ?`,
  answer: n.words,
  wrong: n.misspell,
  hints: hints("Lis chaque mot lettre par lettre.", "Le mot se termine par -ty, et il garde les lettres de son début.", "Compare les premières lettres dans les trois mots."),
}));
const MK_PHRASE_KILO: QuestionRow[] = MASSES.flatMap((m) => [
  { fact: `mk-kilo:${m.en}`, prompt: "Quelle phrase est juste ?", answer: `A kilo of ${m.en}, please.`, wrong: [`A kilo ${m.en}, please.`, `A kilo of a ${m.en}, please.`] as const, hints: hints("Lis chaque phrase en entier.", "Entre le poids et ce qu'on achète, il faut un petit mot de deux lettres.", "Compare les mots avant le nom dans les trois phrases.") },
  { fact: `mk-kilo:${m.en}`, prompt: "Quelle phrase est juste ?", answer: `I would like a kilo of ${m.en}, please.`, wrong: [`I would like a kilo ${m.en}, please.`, `I would likes a kilo of ${m.en}, please.`] as const, hints: hints("Lis chaque phrase en entier.", "Entre le poids et ce qu'on achète, il faut un petit mot de deux lettres.", "Le verbe de la demande ne prend pas de s.") },
]);
const MK_PHRASE_ASK: QuestionRow[] = ["it", ...COUNTABLE.slice(0, 3).map((p) => `the ${p.pl}`)].map((thing, i) => ({
  fact: `mk-prix-question:${i}`,
  prompt: "Comment demande-t-on le prix ?",
  answer: `How much ${i === 0 ? "is" : "are"} ${thing}?`,
  wrong: [`How many ${i === 0 ? "is" : "are"} ${thing}?`, `How much ${thing} ${i === 0 ? "is" : "are"}?`],
  hints: hints("Lis chaque phrase en entier.", "Pour un prix, on demande combien ça coûte, avec un petit mot qui ne se compte pas.", "Dans une question, le verbe vient avant ce dont on parle."),
}));
const MK_QCM = interleave(MK_PHRASE_PLURAL, MK_PHRASE_PRICE, MK_PHRASE_TEEN, MK_PHRASE_SPELL, MK_PHRASE_KILO, MK_PHRASE_ASK);

const MK_GAP_MUCH: GapRow[] = ["it", ...COUNTABLE.slice(0, 3).map((p) => `the ${p.pl}`)].map((thing, i) => ({
  fact: `mk-prix-question:${i}`,
  text: `How ___ ${i === 0 ? "is" : "are"} ${thing}?`,
  answer: "much",
  wrong: ["many", "long"],
  hints: hints("Lis la phrase en entier.", "Pour demander un prix, on demande combien ça coûte.", firstLetter("much")),
}));
const MK_GAP_OF: GapRow[] = MASSES.map((m) => ({
  fact: `mk-kilo:${m.en}`,
  text: `A kilo ___ ${m.en}, please.`,
  answer: "of",
  wrong: ["from", "for"],
  hints: hints("Lis la phrase en entier.", "Entre le poids et ce qu'on achète, il faut un petit mot de deux lettres.", firstLetter("of")),
}));
const MK_GAP_LIKE: GapRow[] = MK_PLURALS.filter((_, index) => index % 2 === 0).map((row) => ({
  fact: row.key,
  text: `I would ___ ${row.qty[0]} ${row.product.pl}, please.`,
  answer: "like",
  wrong: ["likes", "liking"],
  hints: hints("Lis la phrase en entier.", "Pour demander poliment, ce verbe reste tel quel après would.", firstLetter("like")),
}));
const MK_GAP_PLURAL: GapRow[] = MK_PLURALS.map((row) => ({
  fact: row.key,
  prompt: `Je voudrais ${row.qty[1]} ${row.product.frPl}, s'il vous plaît. Complète la phrase en anglais.`,
  text: `I would like ${row.qty[0]} ___, please.`,
  answer: row.product.pl,
  wrong: row.product.wrong,
  hints: hints("Lis la phrase française : elle dit combien et quoi.", "Quand il y en a plusieurs, le nom change à la fin.", firstLetter(row.product.pl)),
}));
const MK_GAP_HUNDRED: GapRow[] = HUNDREDS.map((n) => ({
  fact: `mk-prix:${n.digits}`,
  prompt: `C'est ${n.digits} francs. Complète la phrase en anglais.`,
  text: `It is ${n.words.split(" ")[0]} ___ francs.`,
  answer: n.words.split(" ")[1],
  wrong: [n.misspell[0].split(" ")[1], n.digits === "1000" ? "hundred" : "thousand"],
  hints: hints("Lis la phrase française : elle dit un prix rond.", "Un nombre de centaines ne prend pas de s.", firstLetter(n.words.split(" ")[1])),
}));
const MK_TROU = interleave(MK_GAP_MUCH, MK_GAP_OF, MK_GAP_LIKE, MK_GAP_PLURAL, MK_GAP_HUNDRED);

const MK_WRITE_NUMBER: WriteRow[] = NUMS.filter((n) => n.digits !== "1000").map((n) => ({
  fact: `mk-ecrit:${n.words}`,
  prompt: `Écris en anglais le nombre ${n.digits}.`,
  accepted: [n.words],
  hints: hints("Dis le nombre à voix basse, puis écris-le.", "Les dizaines rondes finissent par -ty ; une centaine s'écrit en deux mots.", firstLetter(n.words)),
}));
const MK_WRITE_PLURAL: WriteRow[] = MK_PLURALS.map((row) => ({
  fact: row.key,
  prompt: `Je voudrais ${row.qty[1]} ${row.product.frPl}, s'il vous plaît. Écris le mot anglais qui manque dans I would like ${row.qty[0]} ___, please.`,
  accepted: row.product.en === "mango" ? [row.product.pl, "mangos"] : [row.product.pl],
  hints: hints("Lis la phrase française : elle dit combien et quoi.", "Quand il y en a plusieurs, le nom change à la fin.", firstLetter(row.product.pl)),
}));
const MK_WRITE_MUCH: WriteRow[] = ["it", "the mangoes", "the bananas"].map((thing, i) => ({
  fact: `mk-prix-question:${i}`,
  prompt: `Écris le mot qui manque. How ___ ${i === 0 ? "is" : "are"} ${thing}?`,
  accepted: ["much"],
  hints: hints("Lis la phrase en entier.", "Pour demander un prix, on demande combien ça coûte.", firstLetter("much")),
}));
const MK_ECRIRE = interleave(MK_WRITE_NUMBER, MK_WRITE_PLURAL, MK_WRITE_MUCH);

const MK_ORDRE: OrderRow[] = interleave(
  MK_PLURALS.map((row) => ordr(SENTENCE_PROMPT, wordsOf(mkRequest(row)), SENTENCE_HINTS, row.key)),
  HUNDREDS.map((n) => ordr(SENTENCE_PROMPT, wordsOf(mkPrice(n)), SENTENCE_HINTS, `mk-prix:${n.digits}`)),
  ["it", ...COUNTABLE.slice(0, 3).map((p) => `the ${p.pl}`)].map((thing, i) => ordr(QUESTION_PROMPT, wordsOf(`How much ${i === 0 ? "is" : "are"} ${thing}?`), QUESTION_HINTS, `mk-prix-question:${i}`)),
  MASSES.map((m) => ordr(SENTENCE_PROMPT, wordsOf(`A kilo of ${m.en}, please.`), SENTENCE_HINTS, `mk-kilo:${m.en}`)),
);

const ALL_PAIRS_FR: readonly (readonly [string, string])[] = [...COUNTABLE.map((p) => [p.en, p.fr] as const), ...MASSES.map((m) => [m.en, m.fr] as const)];
const MK_RELIER: LinkRow[] = interleave(
  ALL_PAIRS_FR.map((_, i) => link("Relie chaque produit anglais à son sens en français.", [0, 1, 2, 3].map((k) => ALL_PAIRS_FR[(i + k) % ALL_PAIRS_FR.length]), `mk-produits:${i}`)),
  NUMS.map((_, i) => link("Relie chaque nombre anglais au même nombre en chiffres.", [0, 1, 2, 3].map((k) => NUMS[(i + k * 2) % NUMS.length]).map((n) => [n.words, n.digits] as const), `mk-nombres:${i}`)),
  COUNTABLE.map((_, i) => link("Relie chaque nom à son pluriel.", [0, 1, 2].map((k) => COUNTABLE[(i + k) % 5]).map((p) => [p.en, p.pl] as const), `mk-pluriels:${i}`)),
);

const MK_GLISSER = [
  ...sortRows("Glisse chaque nom dans la bonne case.", ["avec -s", "avec -es"], ["bananas", "onions", "eggs"], ["mangoes", "tomatoes"], SORT_HINTS_EN, 8),
  ...sortRows("Glisse chaque nombre dans la bonne case.", ["Dizaines", "Centaines"], ["twenty", "thirty", "forty", "fifty"], ["two hundred", "five hundred", "seven hundred", "nine hundred"], SORT_HINTS_EN, 8),
  ...sortRows(
    SORT_PROMPT,
    ["Phrase juste", "Phrase fausse"],
    ["I would like two mangoes, please.", "A kilo of rice, please.", "It is five hundred francs."],
    ["I would like two mango, please.", "A kilo rice, please.", "It is five hundreds francs."],
    SORT_HINTS_EN,
    8,
  ),
];

export const makeCm1EnMkPhrase: Make = (ctx) => ce2Question(ctx, "cm1-en-mk-phrase", "choisir la bonne phrase au marché : pluriel, prix, nombres, demande", MK_QCM, 3);
export const makeCm1EnMkTrou: Make = (ctx) => ce2Gap(ctx, "cm1-en-mk-trou", "compléter une phrase au marché", MK_TROU, 2, 1);
export const makeCm1EnMkEcrire: Make = (ctx) => ce2Write(ctx, "cm1-en-mk-ecrire", "écrire un nombre, un pluriel ou un mot du marché", MK_ECRIRE, 1, 2);
export const makeCm1EnMkOrdre: Make = (ctx) => ce2Order(ctx, "cm1-en-mk-ordre", "remettre les mots d'une demande, d'un prix ou d'une question au marché", MK_ORDRE);
export const makeCm1EnMkRelier: Make = (ctx) => ce2Link(ctx, "cm1-en-mk-relier", "relier un produit, un nombre ou un pluriel", MK_RELIER);
export const makeCm1EnMkGlisser: Make = (ctx) => ce2Sort(ctx, "cm1-en-mk-glisser", "classer les pluriels, les nombres et les phrases justes ou fausses", MK_GLISSER, 2);

// ===========================================================================
// DÉCRIRE UNE PERSONNE OU UN OBJET (an-cm1-describe)
// ===========================================================================

/** Une personne ou une chose, un adjectif, et la phrase française : « He is tall. » ↔ « Il est grand. ». */
type DsBe = { text: string; adj: string; fr: string; others: readonly [string, string] };
const DS_BE: readonly DsBe[] = [
  { text: "He", adj: "tall", fr: "Il est grand.", others: ["old", "sad"] },
  { text: "She", adj: "short", fr: "Elle est petite.", others: ["tall", "happy"] },
  { text: "My grandfather", adj: "old", fr: "Mon grand-père est vieux.", others: ["young", "new"] },
  { text: "Awa", adj: "young", fr: "Awa est jeune.", others: ["old", "strong"] },
  { text: "My mother", adj: "happy", fr: "Ma mère est contente.", others: ["sad", "strong"] },
  { text: "My friend", adj: "sad", fr: "Mon ami est triste.", others: ["happy", "tall"] },
  { text: "Moussa", adj: "strong", fr: "Moussa est fort.", others: ["sad", "young"] },
  { text: "She", adj: "beautiful", fr: "Elle est belle.", others: ["old", "sad"] },
  { text: "My bag", adj: "new", fr: "Mon sac est neuf.", others: ["old", "sad"] },
  { text: "He", adj: "happy", fr: "Il est content.", others: ["strong", "short"] },
  { text: "My sister", adj: "tall", fr: "Ma sœur est grande.", others: ["sad", "old"] },
  { text: "My brother", adj: "strong", fr: "Mon frère est fort.", others: ["happy", "new"] },
];
const dsBe = (row: DsBe, adj = row.adj) => `${row.text} is ${adj}.`;

type DsNoun = { size: string; color: string; noun: string; fr: string; frSize: string };
const DS_NOUNS: readonly DsNoun[] = [
  { size: "big", color: "red", noun: "ball", fr: "C'est un gros ballon rouge.", frSize: "gros" },
  { size: "small", color: "blue", noun: "bag", fr: "C'est un petit sac bleu.", frSize: "petit" },
  { size: "big", color: "green", noun: "book", fr: "C'est un gros livre vert.", frSize: "gros" },
  { size: "new", color: "black", noun: "hat", fr: "C'est un chapeau noir neuf.", frSize: "neuf" },
  { size: "big", color: "brown", noun: "dog", fr: "C'est un gros chien marron.", frSize: "gros" },
  { size: "small", color: "black", noun: "cat", fr: "C'est un petit chat noir.", frSize: "petit" },
  { size: "new", color: "red", noun: "house", fr: "C'est une maison rouge neuve.", frSize: "neuve" },
  { size: "new", color: "blue", noun: "ball", fr: "C'est un ballon bleu neuf.", frSize: "neuf" },
];
const dsNoun = (row: DsNoun) => `It is a ${row.size} ${row.color} ${row.noun}.`;

type DsPlural = { qty: readonly [string, string]; adj: string; noun: string };
const DS_PLURALS: readonly DsPlural[] = [
  { qty: ["two", "deux"], adj: "small", noun: "dog" },
  { qty: ["three", "trois"], adj: "big", noun: "ball" },
  { qty: ["two", "deux"], adj: "old", noun: "book" },
  { qty: ["four", "quatre"], adj: "new", noun: "bag" },
  { qty: ["two", "deux"], adj: "big", noun: "cat" },
  { qty: ["three", "trois"], adj: "small", noun: "hat" },
];
const dsPlural = (row: DsPlural) => `I have ${row.qty[0]} ${row.adj} ${row.noun}s.`;

type DsLook = { text: string; kind: "hair" | "eyes"; length?: string; color: string; fr: string };
const DS_LOOKS: readonly DsLook[] = [
  { text: "She", kind: "hair", length: "long", color: "black", fr: "Elle a de longs cheveux noirs." },
  { text: "He", kind: "hair", length: "short", color: "brown", fr: "Il a les cheveux courts et marron." },
  { text: "Awa", kind: "hair", length: "long", color: "brown", fr: "Awa a de longs cheveux marron." },
  { text: "Moussa", kind: "hair", length: "short", color: "black", fr: "Moussa a les cheveux courts et noirs." },
  { text: "My sister", kind: "hair", length: "short", color: "black", fr: "Ma sœur a les cheveux courts et noirs." },
  { text: "My mother", kind: "hair", length: "long", color: "black", fr: "Ma mère a de longs cheveux noirs." },
  { text: "She", kind: "eyes", color: "green", fr: "Elle a les yeux verts." },
  { text: "He", kind: "eyes", color: "brown", fr: "Il a les yeux marron." },
  { text: "Awa", kind: "eyes", color: "black", fr: "Awa a les yeux noirs." },
  { text: "Moussa", kind: "eyes", color: "blue", fr: "Moussa a les yeux bleus." },
  { text: "My brother", kind: "eyes", color: "green", fr: "Mon frère a les yeux verts." },
  { text: "My cousin", kind: "eyes", color: "brown", fr: "Mon cousin a les yeux marron." },
];
const dsLook = (row: DsLook) => (row.kind === "hair" ? `${row.text} has got ${row.length} ${row.color} hair.` : `${row.text} has got ${row.color} eyes.`);
const dsLookWrong = (row: DsLook): [string, string] =>
  row.kind === "hair"
    ? [`${row.text} has got hair ${row.length} ${row.color}.`, `${row.text} have got ${row.length} ${row.color} hair.`]
    : [`${row.text} has got eyes ${row.color}.`, `${row.text} have got ${row.color} eyes.`];

const DS_PHRASE_BE: QuestionRow[] = DS_BE.map((row, i) => ({
  fact: `ds-be:${i}`,
  prompt: "Quelle phrase est juste ?",
  answer: dsBe(row),
  wrong: [`${row.text} ${row.adj}.`, `${row.text} has ${row.adj}.`],
  hints: hints("Lis chaque phrase en entier.", "Pour décrire quelqu'un, on met le verbe être, puis le mot qui décrit.", "Cherche la phrase qui a les deux."),
}));
const DS_PHRASE_NOUN: QuestionRow[] = DS_NOUNS.map((row, i) => ({
  fact: `ds-nom:${i}`,
  prompt: "Quelle phrase est juste ?",
  answer: dsNoun(row),
  wrong: [`It is a ${row.noun} ${row.size} ${row.color}.`, `It is a ${row.size}s ${row.color} ${row.noun}.`],
  hints: hints("Lis chaque phrase en entier.", "En anglais, les mots qui décrivent se placent AVANT le nom.", "Ces mots ne prennent jamais de s."),
}));
const DS_PHRASE_PLURAL: QuestionRow[] = DS_PLURALS.map((row, i) => ({
  fact: `ds-pluriel:${i}`,
  prompt: "Quelle phrase est juste ?",
  answer: dsPlural(row),
  wrong: [`I have ${row.qty[0]} ${row.adj}s ${row.noun}s.`, `I have ${row.qty[0]} ${row.noun}s ${row.adj}.`],
  hints: hints("Lis chaque phrase en entier.", "Le mot qui décrit se place avant le nom et ne prend jamais de s.", "Seul le nom prend un s quand il y en a plusieurs."),
}));
const DS_PHRASE_LOOK: QuestionRow[] = DS_LOOKS.map((row, i) => ({
  fact: `ds-look:${i}`,
  prompt: "Quelle phrase est juste ?",
  answer: dsLook(row),
  wrong: dsLookWrong(row),
  hints: hints("Lis chaque phrase en entier.", "Les mots qui décrivent se placent avant le nom, et le verbe va avec le sujet.", "Compare l'ordre des mots dans les trois phrases."),
}));
const DS_QCM = interleave(DS_PHRASE_BE, DS_PHRASE_NOUN, DS_PHRASE_PLURAL, DS_PHRASE_LOOK);

const DS_GAP_BE: GapRow[] = DS_BE.map((row, i) => ({
  fact: `ds-be:${i}`,
  prompt: `${row.fr} Complète la phrase en anglais.`,
  text: `${row.text} is ___.`,
  answer: row.adj,
  wrong: row.others,
  hints: hints("Lis la phrase française : elle dit comment est la personne ou la chose.", "Cherche ce mot en anglais.", firstLetter(row.adj)),
}));
const DS_GAP_SIZE: GapRow[] = DS_NOUNS.map((row, i) => ({
  fact: `ds-nom:${i}`,
  prompt: `${row.fr} Complète la phrase en anglais.`,
  text: `It is a ___ ${row.color} ${row.noun}.`,
  answer: row.size,
  wrong: ["big", "small", "new"].filter((adj) => adj !== row.size),
  hints: hints("Lis la phrase française : elle dit comment est l'objet.", "Cherche ce mot en anglais.", firstLetter(row.size)),
}));
const DS_GAP_COLOR: GapRow[] = DS_NOUNS.map((row, i) => ({
  fact: `ds-nom:${i}`,
  prompt: `${row.fr} Complète la phrase en anglais.`,
  text: `It is a ${row.size} ___ ${row.noun}.`,
  answer: row.color,
  wrong: ["red", "blue", "green", "black", "brown"].filter((color) => color !== row.color).slice(i % 2, (i % 2) + 2),
  hints: hints("Lis la phrase française : elle dit la couleur.", "Cherche ce mot en anglais.", firstLetter(row.color)),
}));
const DS_GAP_PLURAL: GapRow[] = DS_PLURALS.map((row, i) => ({
  fact: `ds-pluriel:${i}`,
  text: `I have ${row.qty[0]} ___ ${row.noun}s.`,
  answer: row.adj,
  wrong: [`${row.adj}s`, `${row.adj}es`],
  hints: hints("Lis la phrase en entier.", "Le mot qui décrit ne prend jamais de s, même avec un nom au pluriel.", firstLetter(row.adj)),
}));
const DS_GAP_LOOK: GapRow[] = DS_LOOKS.map((row, i) => ({
  fact: `ds-look:${i}`,
  prompt: `${row.fr} Complète la phrase en anglais.`,
  text: row.kind === "hair" ? `${row.text} has got ___ ${row.color} hair.` : `${row.text} has got ___ eyes.`,
  answer: row.kind === "hair" ? (row.length as string) : row.color,
  wrong: row.kind === "hair" ? [row.length === "long" ? "short" : "long", "tall"] : ["brown", "black", "green", "blue"].filter((color) => color !== row.color).slice(0, 2),
  hints: hints("Lis la phrase française : elle dit comment sont les cheveux ou les yeux.", "Cherche ce mot en anglais.", firstLetter(row.kind === "hair" ? (row.length as string) : row.color)),
}));
const DS_TROU = interleave(DS_GAP_BE, DS_GAP_SIZE, DS_GAP_COLOR, DS_GAP_PLURAL, DS_GAP_LOOK);

const DS_WRITE_BE: WriteRow[] = DS_BE.map((row, i) => ({
  fact: `ds-be:${i}`,
  prompt: `${row.fr} Écris le mot anglais qui manque dans ${row.text} is ___.`,
  accepted: [row.adj],
  hints: hints("Lis la phrase française : elle dit comment est la personne ou la chose.", "Cherche ce mot en anglais.", firstLetter(row.adj)),
}));
const DS_WRITE_LOOK: WriteRow[] = DS_LOOKS.map((row, i) => ({
  fact: `ds-look:${i}`,
  prompt: `${row.fr} Écris le mot anglais qui manque dans ${row.kind === "hair" ? `${row.text} has got ___ ${row.color} hair.` : `${row.text} has got ___ eyes.`}`,
  accepted: [row.kind === "hair" ? (row.length as string) : row.color],
  hints: hints("Lis la phrase française : elle dit comment sont les cheveux ou les yeux.", "Cherche ce mot en anglais.", firstLetter(row.kind === "hair" ? (row.length as string) : row.color)),
}));
const DS_WRITE_NOUN: WriteRow[] = DS_NOUNS.filter((row) => apostrophes(`${row.fr} Écris le mot anglais qui manque dans It is a ___ ${row.color} ${row.noun}.`) <= 1).map((row, i) => ({
  fact: `ds-nom:${i}`,
  prompt: `${row.fr} Écris le mot anglais qui manque dans It is a ___ ${row.color} ${row.noun}.`,
  accepted: [row.size],
  hints: hints("Lis la phrase française : elle dit comment est l'objet.", "Cherche ce mot en anglais.", firstLetter(row.size)),
}));
const DS_ECRIRE = interleave(DS_WRITE_BE, DS_WRITE_LOOK, DS_WRITE_NOUN);

const DS_ORDRE: OrderRow[] = interleave(
  DS_BE.map((row, i) => ordr(SENTENCE_PROMPT, wordsOf(dsBe(row)), SENTENCE_HINTS, `ds-be:${i}`)),
  DS_NOUNS.map((row, i) => ordr(SENTENCE_PROMPT, wordsOf(dsNoun(row)), SENTENCE_HINTS, `ds-nom:${i}`)),
  DS_PLURALS.map((row, i) => ordr(SENTENCE_PROMPT, wordsOf(dsPlural(row)), SENTENCE_HINTS, `ds-pluriel:${i}`)),
  DS_LOOKS.map((row, i) => ordr(SENTENCE_PROMPT, wordsOf(dsLook(row)), SENTENCE_HINTS, `ds-look:${i}`)),
).filter((row) => row.sequence.length >= 3);

const DS_OPPOSITES: readonly (readonly [string, string])[] = [
  ["tall", "short"],
  ["big", "small"],
  ["happy", "sad"],
  ["old", "young"],
];
const DS_WORDS_FR: readonly (readonly [string, string])[] = [
  ["strong", "fort"],
  ["beautiful", "beau"],
  ["new", "neuf"],
  ["happy", "content"],
  ["sad", "triste"],
  ["young", "jeune"],
];
const DS_COLORS_FR: readonly (readonly [string, string])[] = [
  ["red", "rouge"],
  ["blue", "bleu"],
  ["green", "vert"],
  ["black", "noir"],
  ["brown", "marron"],
];
const DS_RELIER: LinkRow[] = interleave(
  [link("Relie chaque mot à son contraire.", DS_OPPOSITES, "ds-contraires:0"), ...[0, 1].map((i) => link("Relie chaque mot à son contraire.", DS_OPPOSITES.slice(i, i + 3), `ds-contraires:${i + 1}`))],
  [0, 1, 2].map((i) => link("Relie chaque mot anglais à son sens en français.", DS_WORDS_FR.slice(i, i + 4), `ds-mots:${i}`)),
  [0, 1, 2].map((i) => link("Relie chaque couleur anglaise à son sens en français.", DS_COLORS_FR.slice(i, i + 3), `ds-couleurs:${i}`)),
);

const DS_GLISSER = [
  ...sortRows("Glisse chaque mot dans la bonne case.", ["Grandeur", "Sentiment"], ["tall", "short", "big", "small"], ["happy", "sad"], SORT_HINTS_EN, 8),
  ...sortRows("Glisse chaque mot dans la bonne case.", ["Cheveux", "Yeux"], ["long", "short"], ["green", "blue"], SORT_HINTS_EN, 8),
  ...sortRows(
    SORT_PROMPT,
    ["Phrase juste", "Phrase fausse"],
    ["He is tall.", "It is a big red ball.", "I have two small dogs."],
    ["He tall.", "It is a ball big red.", "I have two smalls dogs."],
    SORT_HINTS_EN,
    8,
  ),
];

export const makeCm1EnDsPhrase: Make = (ctx) => ce2Question(ctx, "cm1-en-ds-phrase", "choisir la bonne phrase pour décrire : l'adjectif avant le nom, jamais accordé", DS_QCM, 3);
export const makeCm1EnDsTrou: Make = (ctx) => ce2Gap(ctx, "cm1-en-ds-trou", "compléter une phrase qui décrit", DS_TROU, 2, 1);
export const makeCm1EnDsEcrire: Make = (ctx) => ce2Write(ctx, "cm1-en-ds-ecrire", "écrire le mot qui décrit", DS_ECRIRE, 1, 2);
export const makeCm1EnDsOrdre: Make = (ctx) => ce2Order(ctx, "cm1-en-ds-ordre", "remettre les mots d'une phrase qui décrit", DS_ORDRE);
export const makeCm1EnDsRelier: Make = (ctx) => ce2Link(ctx, "cm1-en-ds-relier", "relier un mot qui décrit à son contraire ou à son sens", DS_RELIER);
export const makeCm1EnDsGlisser: Make = (ctx) => ce2Sort(ctx, "cm1-en-ds-glisser", "classer les mots qui décrivent et les phrases justes ou fausses", DS_GLISSER, 2);
