import { defineTemplateTests } from "@/lib/test-support/cm1TestKit";

/**
 * L'ANGLAIS DU CM1 : sept thématiques, quarante-deux gabarits (`cm1AnglaisVerbes.ts`, `cm1AnglaisMots.ts`).
 *
 * Le moteur des vérifications est dans `lib/test-support/cm1TestKit.ts`. Ce fichier ne lit AUCUNE table des sources : il refait, avec ses propres
 * règles et ses propres tables, TOUTES les phrases justes de ces thématiques (le s de he, she, it ; do not ou does not ; am, is ou are + -ing ; at ou in ;
 * le pluriel ; l'adjectif avant le nom) et leurs phrases françaises. Un exercice est juste quand sa bonne réponse est dans ce jeu de phrases justes,
 * qu'aucun mauvais choix n'y est, que la phrase française de la consigne est bien celle de la phrase anglaise, et que les paires et les cases sont
 * celles de ces tables.
 */

const KINDS_OF = (prefix: string) => [`${prefix}-phrase`, `${prefix}-trou`, `${prefix}-ecrire`, `${prefix}-ordre`, `${prefix}-relier`, `${prefix}-glisser`];
const TOPIC_KINDS: Record<string, readonly string[]> = {
  "an-cm1-present-simple": KINDS_OF("cm1-en-ps"),
  "an-cm1-he-she-it": KINDS_OF("cm1-en-hs"),
  "an-cm1-routine": KINDS_OF("cm1-en-rt"),
  "an-cm1-continuous": KINDS_OF("cm1-en-cn"),
  "an-cm1-jobs": KINDS_OF("cm1-en-jb"),
  "an-cm1-market": KINDS_OF("cm1-en-mk"),
  "an-cm1-describe": KINDS_OF("cm1-en-ds"),
};
const COUNTS: Record<string, number> = {
  "an-cm1-present-simple": 4,
  "an-cm1-he-she-it": 4,
  "an-cm1-routine": 3,
  "an-cm1-continuous": 4,
  "an-cm1-jobs": 2,
  "an-cm1-market": 3,
  "an-cm1-describe": 3,
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

/** Toutes les phrases, questions et réponses courtes justes. */
const VALID = new Set<string>();
/** Une phrase anglaise juste et les phrases françaises qui la disent. */
const FR = new Map<string, Set<string>>();
/** Une phrase et sa négation. */
const NEG = new Map<string, string>();
/** Une question et ses deux réponses courtes. */
const REPLY = new Map<string, { yes: string; no: string }>();
/** Les paires de mots justes : « gauche|droite ». */
const GLOSS = new Set<string>();
/** Une description française de métier et son métier. */
const CLUE_JOB = new Map<string, string>();
/** Un nombre écrit en lettres et en chiffres. */
const NUMBER = new Map<string, string>();

const sp = (...parts: string[]) => parts.filter((part) => part !== "").join(" ");
const vowel = (word: string) => /^[aeiouéèê]/i.test(word);
const add = (en: string) => VALID.add(en);
const addFr = (en: string, fr: string) => {
  VALID.add(en);
  const set = FR.get(en) ?? new Set<string>();
  set.add(fr);
  FR.set(en, set);
};
const gloss = (left: string, right: string) => GLOSS.add(`${left}|${right}`);
const sForm = (verb: string) => (verb === "have" ? "has" : /(s|sh|ch|o|x|z)$/.test(verb) ? `${verb}es` : `${verb}s`);

// ----- le présent simple : I, you, we, they
const PS_SUBJ = [
  { t: "I", q: "I", ans: "you", fr: "Je" },
  { t: "You", q: "you", ans: "I", fr: "Tu" },
  { t: "We", q: "we", ans: "we", fr: "Nous" },
  { t: "They", q: "they", ans: "they", fr: "Ils" },
];
const PS_VERB: { v: string; obj: string; forms: string[]; frObj: string; inf: string }[] = [
  { v: "play", obj: "football", forms: ["joue", "joues", "jouons", "jouent"], frObj: "au football", inf: "jouer" },
  { v: "eat", obj: "rice", forms: ["mange", "manges", "mangeons", "mangent"], frObj: "du riz", inf: "manger" },
  { v: "drink", obj: "water", forms: ["bois", "bois", "buvons", "boivent"], frObj: "de l'eau", inf: "boire" },
  { v: "read", obj: "a book", forms: ["lis", "lis", "lisons", "lisent"], frObj: "un livre", inf: "lire" },
  { v: "write", obj: "a letter", forms: ["écris", "écris", "écrivons", "écrivent"], frObj: "une lettre", inf: "écrire" },
  { v: "watch", obj: "television", forms: ["regarde", "regardes", "regardons", "regardent"], frObj: "la télévision", inf: "regarder" },
  { v: "like", obj: "mangoes", forms: ["aime", "aimes", "aimons", "aiment"], frObj: "les mangues", inf: "aimer" },
  { v: "go", obj: "to school", forms: ["vais", "vas", "allons", "vont"], frObj: "à l'école", inf: "aller" },
  { v: "have", obj: "breakfast", forms: ["prends", "prends", "prenons", "prennent"], frObj: "le petit déjeuner", inf: "avoir" },
  { v: "study", obj: "mathematics", forms: ["étudie", "étudies", "étudions", "étudient"], frObj: "les mathématiques", inf: "étudier" },
];
const ADVERBS: [string, string][] = [
  ["always", "toujours"],
  ["usually", "en général"],
  ["sometimes", "parfois"],
  ["never", "jamais"],
];
PS_SUBJ.forEach((s, si) =>
  PS_VERB.forEach((w) => {
    const form = w.forms[si];
    const frSubject = si === 0 && vowel(form) ? `J'${form}` : `${s.fr} ${form}`;
    const pos = `${s.t} ${w.v} ${w.obj}.`;
    addFr(pos, `${frSubject} ${w.frObj}.`);
    const neg = `${s.t} do not ${w.v} ${w.obj}.`;
    NEG.set(pos, neg);
    add(neg);
    const question = `Do ${s.q} ${w.v} ${w.obj}?`;
    add(question);
    const yes = `Yes, ${s.ans} do.`;
    const no = `No, ${s.ans} do not.`;
    add(yes);
    add(no);
    REPLY.set(question, { yes, no });
    for (const [adv, advFr] of ADVERBS) {
      addFr(`${s.t} ${adv} ${w.v} ${w.obj}.`, adv === "never" ? `${s.fr} ${vowel(form) ? "n'" : "ne "}${form} jamais ${w.frObj}.` : `${frSubject} ${advFr} ${w.frObj}.`);
    }
  }),
);
PS_VERB.forEach((w) => gloss(w.v, w.inf));
ADVERBS.forEach(([en, fr]) => gloss(en, fr));

// ----- he, she, it
const HS_SUBJ = [
  { t: "He", q: "he", ans: "he", fr: "Il" },
  { t: "She", q: "she", ans: "she", fr: "Elle" },
  { t: "It", q: "it", ans: "it", fr: "Il" },
  { t: "Awa", q: "Awa", ans: "she", fr: "Awa" },
  { t: "Moussa", q: "Moussa", ans: "he", fr: "Moussa" },
];
const HS_VERB: { v: string; obj: string; fr: string; frObj: string }[] = [
  { v: "play", obj: "football", fr: "joue", frObj: "au football" },
  { v: "eat", obj: "rice", fr: "mange", frObj: "du riz" },
  { v: "read", obj: "a book", fr: "lit", frObj: "un livre" },
  { v: "watch", obj: "television", fr: "regarde", frObj: "la télévision" },
  { v: "go", obj: "to school", fr: "va", frObj: "à l'école" },
  { v: "have", obj: "breakfast", fr: "prend", frObj: "le petit déjeuner" },
  { v: "drink", obj: "water", fr: "boit", frObj: "de l'eau" },
  { v: "write", obj: "a letter", fr: "écrit", frObj: "une lettre" },
  { v: "sleep", obj: "", fr: "dort", frObj: "" },
];
HS_SUBJ.forEach((s) =>
  HS_VERB.forEach((w) => {
    const pos = `${sp(s.t, sForm(w.v), w.obj)}.`;
    addFr(pos, `${sp(s.fr, w.fr, w.frObj)}.`);
    const neg = `${sp(s.t, "does not", w.v, w.obj)}.`;
    NEG.set(pos, neg);
    add(neg);
    const question = `${sp("Does", s.q, w.v, w.obj)}?`;
    add(question);
    const yes = `Yes, ${s.ans} does.`;
    const no = `No, ${s.ans} does not.`;
    add(yes);
    add(no);
    REPLY.set(question, { yes, no });
  }),
);
HS_VERB.forEach((w) => gloss(w.v, sForm(w.v)));

// ----- la routine
const RT_STEM: [string, string][] = [
  ["I get up", "Je me lève"],
  ["I have breakfast", "Je prends le petit déjeuner"],
  ["I go to school", "Je vais à l'école"],
  ["I play football", "Je joue au football"],
  ["I read a book", "Je lis un livre"],
  ["I have lunch", "Je prends le déjeuner"],
  ["I do my homework", "Je fais mes devoirs"],
  ["I watch television", "Je regarde la télévision"],
  ["I go to bed", "Je me couche"],
  ["I sleep", "Je dors"],
];
const RT_CLOCK: [string, string, string][] = [
  ["one", "une heure", "1"],
  ["five", "cinq heures", "5"],
  ["six", "six heures", "6"],
  ["seven", "sept heures", "7"],
  ["eight", "huit heures", "8"],
  ["nine", "neuf heures", "9"],
];
const RT_MOMENT: [string, string][] = [
  ["the morning", "le matin"],
  ["the afternoon", "l'après-midi"],
  ["the evening", "le soir"],
];
RT_STEM.forEach(([en, fr]) => {
  addFr(`${en}.`, `${fr}.`);
  RT_CLOCK.forEach(([time, timeFr]) => addFr(`${en} at ${time} o'clock.`, `${fr} à ${timeFr}.`));
  RT_MOMENT.forEach(([moment, momentFr]) => addFr(`${en} in ${moment}.`, `${fr} ${momentFr}.`));
  addFr(`${en} at night.`, `${fr} la nuit.`);
});
RT_CLOCK.forEach(([time, , digit]) => gloss(`${time} o'clock`, `${digit}:00`));
[...RT_MOMENT, ["night", "la nuit"] as [string, string]].forEach(([en, fr]) => gloss(en, fr));
/** Les moments d'une journée dans l'ordre. */
const DAY = ["I get up at six o'clock.", "I have breakfast.", "I go to school.", "I have lunch.", "I do my homework.", "I go to bed at nine o'clock."];

// ----- le présent continu
const CN_SUBJ = [
  { t: "I", be: "am", q: "I", fr: "Je suis" },
  { t: "You", be: "are", q: "you", fr: "Tu es" },
  { t: "He", be: "is", q: "he", fr: "Il est" },
  { t: "She", be: "is", q: "she", fr: "Elle est" },
  { t: "It", be: "is", q: "it", fr: "Il est" },
  { t: "We", be: "are", q: "we", fr: "Nous sommes" },
  { t: "They", be: "are", q: "they", fr: "Ils sont" },
  { t: "Awa", be: "is", q: "Awa", fr: "Awa est" },
];
const CN_VERB: { v: string; ing: string; obj: string; inf: string; frObj: string }[] = [
  { v: "read", ing: "reading", obj: "a book", inf: "lire", frObj: "un livre" },
  { v: "cook", ing: "cooking", obj: "rice", inf: "cuisiner", frObj: "du riz" },
  { v: "play", ing: "playing", obj: "football", inf: "jouer", frObj: "au football" },
  { v: "eat", ing: "eating", obj: "bread", inf: "manger", frObj: "du pain" },
  { v: "drink", ing: "drinking", obj: "water", inf: "boire", frObj: "de l'eau" },
  { v: "write", ing: "writing", obj: "a letter", inf: "écrire", frObj: "une lettre" },
  { v: "run", ing: "running", obj: "", inf: "courir", frObj: "" },
  { v: "swim", ing: "swimming", obj: "", inf: "nager", frObj: "" },
  { v: "dance", ing: "dancing", obj: "", inf: "danser", frObj: "" },
  { v: "sleep", ing: "sleeping", obj: "", inf: "dormir", frObj: "" },
  { v: "eat", ing: "eating", obj: "rice", inf: "manger", frObj: "du riz" },
];
CN_SUBJ.forEach((s) => {
  add(`What ${s.be} ${s.q} doing?`);
  CN_VERB.forEach((w) => {
    addFr(`${sp(s.t, s.be, w.ing, w.obj)}.`, `${sp(s.fr, "en train", vowel(w.inf) ? `d'${w.inf}` : `de ${w.inf}`, w.frObj)}.`);
    add(`${sp(s.t, s.be, w.ing, w.obj, "now")}.`);
    add(`${sp(s.be.charAt(0).toUpperCase() + s.be.slice(1), s.q, w.ing, w.obj)}?`);
    add(`${sp(s.t, s.be === "is" ? sForm(w.v) : w.v, w.obj, "every day")}.`);
  });
});
CN_VERB.forEach((w) => gloss(w.v, w.ing));

// ----- les métiers
const JB_JOB: [string, string, string, string][] = [
  ["teacher", "maître", "maîtresse", "enseigne aux élèves"],
  ["doctor", "médecin", "médecin", "soigne les malades"],
  ["nurse", "infirmier", "infirmière", "aide le médecin à l'hôpital"],
  ["farmer", "agriculteur", "agricultrice", "cultive les champs"],
  ["fisherman", "pêcheur", "pêcheuse", "attrape des poissons"],
  ["driver", "chauffeur", "chauffeuse", "conduit une voiture"],
  ["tailor", "tailleur", "tailleuse", "coud des habits"],
  ["trader", "commerçant", "commerçante", "vend des produits au marché"],
  ["police officer", "policier", "policière", "protège les gens"],
  ["student", "élève", "élève", "apprend à l'école"],
];
const JB_PERSON: { t: string; q: string; pron: string; fr: string; female: boolean }[] = [
  { t: "My father", q: "your father", pron: "He", fr: "Mon père", female: false },
  { t: "My mother", q: "your mother", pron: "She", fr: "Ma mère", female: true },
  { t: "My uncle", q: "your uncle", pron: "He", fr: "Mon oncle", female: false },
  { t: "My aunt", q: "your aunt", pron: "She", fr: "Ma tante", female: true },
  { t: "My brother", q: "your brother", pron: "He", fr: "Mon frère", female: false },
  { t: "My sister", q: "your sister", pron: "She", fr: "Ma sœur", female: true },
];
JB_PERSON.forEach((p) => {
  add(`What does ${p.q} do?`);
  JB_JOB.forEach(([job, masculine, feminine, clue]) => {
    addFr(`${p.t} is a ${job}.`, `${p.fr} est ${p.female ? feminine : masculine}.`);
    addFr(`${p.t} is a ${job}.`, `${p.fr} ${clue}.`);
    CLUE_JOB.set(`${p.fr} ${clue}.`, job);
    addFr(`${p.pron} is a ${job}.`, `${p.pron === "He" ? "Il" : "Elle"} est ${p.female ? feminine : masculine}.`);
  });
});
JB_JOB.forEach(([job, masculine, , clue]) => {
  gloss(job, masculine);
  gloss(job, clue);
});

// ----- au marché
const MK_COUNT: [string, string, string, string][] = [
  ["mango", "mangoes", "mangue", "mangues"],
  ["banana", "bananas", "banane", "bananes"],
  ["tomato", "tomatoes", "tomate", "tomates"],
  ["onion", "onions", "oignon", "oignons"],
  ["egg", "eggs", "œuf", "œufs"],
];
const MK_MASS: [string, string][] = [
  ["rice", "riz"],
  ["fish", "poisson"],
  ["bread", "pain"],
];
const MK_QTY: [string, string][] = [
  ["two", "deux"],
  ["three", "trois"],
  ["four", "quatre"],
  ["five", "cinq"],
  ["six", "six"],
];
MK_COUNT.forEach(([single, plural, frSingle, frPlural]) => {
  MK_QTY.forEach(([qty, qtyFr]) => addFr(`I would like ${qty} ${plural}, please.`, `Je voudrais ${qtyFr} ${frPlural}, s'il vous plaît.`));
  add(`How much are the ${plural}?`);
  gloss(single, frSingle);
  gloss(single, plural);
});
MK_MASS.forEach(([mass, frMass]) => {
  add(`A kilo of ${mass}, please.`);
  add(`I would like a kilo of ${mass}, please.`);
  gloss(mass, frMass);
});
add("How much is it?");
const MK_NUM: [string, string][] = [
  ["twenty", "20"],
  ["thirty", "30"],
  ["forty", "40"],
  ["fifty", "50"],
  ["sixty", "60"],
  ["seventy", "70"],
  ["eighty", "80"],
  ["ninety", "90"],
  ["thirteen", "13"],
  ["fourteen", "14"],
  ["fifteen", "15"],
  ["sixteen", "16"],
  ["seventeen", "17"],
  ["eighteen", "18"],
  ["nineteen", "19"],
  ["one hundred", "100"],
  ["two hundred", "200"],
  ["three hundred", "300"],
  ["four hundred", "400"],
  ["five hundred", "500"],
  ["six hundred", "600"],
  ["seven hundred", "700"],
  ["eight hundred", "800"],
  ["nine hundred", "900"],
  ["one thousand", "1000"],
];
MK_NUM.forEach(([words, digits]) => {
  NUMBER.set(words, digits);
  gloss(words, digits);
  addFr(`It is ${words} francs.`, `C'est ${digits} francs.`);
  addFr(`It is ${words} francs.`, `Le prix est de ${digits} francs.`);
});

// ----- décrire
const DS_SUBJ: [string, string, boolean][] = [
  ["He", "Il", false],
  ["She", "Elle", true],
  ["My grandfather", "Mon grand-père", false],
  ["Awa", "Awa", true],
  ["My mother", "Ma mère", true],
  ["My friend", "Mon ami", false],
  ["Moussa", "Moussa", false],
  ["My bag", "Mon sac", false],
  ["My sister", "Ma sœur", true],
  ["My brother", "Mon frère", false],
];
const DS_ADJ: [string, string, string][] = [
  ["tall", "grand", "grande"],
  ["short", "petit", "petite"],
  ["old", "vieux", "vieille"],
  ["young", "jeune", "jeune"],
  ["happy", "content", "contente"],
  ["sad", "triste", "triste"],
  ["strong", "fort", "forte"],
  ["beautiful", "beau", "belle"],
  ["new", "neuf", "neuve"],
];
DS_SUBJ.forEach(([subject, frSubject, female]) => DS_ADJ.forEach(([adj, masculine, feminine]) => addFr(`${subject} is ${adj}.`, `${frSubject} est ${female ? feminine : masculine}.`)));
const DS_SIZE = ["big", "small", "old", "new"];
/** Devant « a », une taille qui ne commence pas par une voyelle (« an old » serait une autre phrase). */
const DS_SIZE_A = ["big", "small", "new"];
const DS_COLOR = ["red", "blue", "green", "black", "brown"];
const DS_NOUN = ["ball", "bag", "book", "hat", "dog", "cat", "house"];
DS_SIZE_A.forEach((size) => DS_COLOR.forEach((color) => DS_NOUN.forEach((noun) => add(`It is a ${size} ${color} ${noun}.`))));
(
  [
    ["It is a big red ball.", "C'est un gros ballon rouge."],
    ["It is a small blue bag.", "C'est un petit sac bleu."],
    ["It is a big green book.", "C'est un gros livre vert."],
    ["It is a new black hat.", "C'est un chapeau noir neuf."],
    ["It is a big brown dog.", "C'est un gros chien marron."],
    ["It is a small black cat.", "C'est un petit chat noir."],
    ["It is a new red house.", "C'est une maison rouge neuve."],
    ["It is a new blue ball.", "C'est un ballon bleu neuf."],
  ] as [string, string][]
).forEach(([en, fr]) => addFr(en, fr));
["two", "three", "four"].forEach((qty) => DS_SIZE.forEach((adj) => ["dog", "cat", "book", "bag", "ball", "hat"].forEach((noun) => add(`I have ${qty} ${adj} ${noun}s.`))));
["She", "He", "Awa", "Moussa", "My sister", "My mother", "My brother", "My cousin"].forEach((subject) => {
  ["long", "short"].forEach((length) => ["black", "brown"].forEach((color) => add(`${subject} has got ${length} ${color} hair.`)));
  ["green", "brown", "black", "blue"].forEach((color) => add(`${subject} has got ${color} eyes.`));
});
(
  [
    ["She has got long black hair.", "Elle a de longs cheveux noirs."],
    ["He has got short brown hair.", "Il a les cheveux courts et marron."],
    ["Awa has got long brown hair.", "Awa a de longs cheveux marron."],
    ["Moussa has got short black hair.", "Moussa a les cheveux courts et noirs."],
    ["My sister has got short black hair.", "Ma sœur a les cheveux courts et noirs."],
    ["My mother has got long black hair.", "Ma mère a de longs cheveux noirs."],
    ["She has got green eyes.", "Elle a les yeux verts."],
    ["He has got brown eyes.", "Il a les yeux marron."],
    ["Awa has got black eyes.", "Awa a les yeux noirs."],
    ["Moussa has got blue eyes.", "Moussa a les yeux bleus."],
    ["My brother has got green eyes.", "Mon frère a les yeux verts."],
    ["My cousin has got brown eyes.", "Mon cousin a les yeux marron."],
  ] as [string, string][]
).forEach(([en, fr]) => addFr(en, fr));
(
  [
    ["tall", "short"],
    ["big", "small"],
    ["happy", "sad"],
    ["old", "young"],
    ["strong", "fort"],
    ["beautiful", "beau"],
    ["new", "neuf"],
    ["happy", "content"],
    ["sad", "triste"],
    ["young", "jeune"],
    ["red", "rouge"],
    ["blue", "bleu"],
    ["green", "vert"],
    ["black", "noir"],
    ["brown", "marron"],
  ] as [string, string][]
).forEach(([left, right]) => gloss(left, right));

// ===========================================================================
// LES JUGES
// ===========================================================================

const ok = (condition: boolean, message: string) => (condition ? null : message);
const all = (...results: (string | null)[]) => results.find((result) => result !== null) ?? null;
const filled = (text: string, option: string) => text.replace("___", option);
const frOf = (en: string) => FR.get(en) ?? new Set<string>();

/** Pas d'autre ordre des mêmes tuiles qui donne une phrase juste. */
function onlyOrder(tiles: readonly string[]): boolean {
  const target = tiles.join(" ");
  const seen = new Set<string>();
  const walk = (rest: string[], built: string[]): boolean => {
    if (rest.length === 0) {
      const sentence = built.join(" ");
      return sentence === target || !VALID.has(sentence);
    }
    for (let i = 0; i < rest.length; i++) {
      const key = `${built.join(" ")}|${rest[i]}|${rest.length}`;
      if (seen.has(key)) continue;
      seen.add(key);
      if (!walk([...rest.slice(0, i), ...rest.slice(i + 1)], [...built, rest[i]])) return false;
    }
    return true;
  };
  return walk([...tiles], []);
}

const checkPhrase = (exo: Exo): string | null => {
  const right = rightOption(exo);
  const wrongs = optionsOf(exo).filter((option) => option !== right);
  const { prompt } = exo;
  const notValid = () => all(...wrongs.map((wrong) => ok(!VALID.has(wrong), `« ${wrong} » est juste aussi (${prompt})`)));
  if (prompt === "Quelle phrase est juste ?" || prompt === "Quelle phrase dit ce qui se passe en ce moment ?" || prompt === "Comment demande-t-on le prix ?") {
    return all(
      ok(VALID.has(right), `« ${right} » n'est pas juste (${prompt})`),
      prompt === "Quelle phrase dit ce qui se passe en ce moment ?" ? ok(/ now\.$/.test(right), `« ${right} » ne dit pas maintenant`) : null,
      notValid(),
    );
  }
  let m = /^Quelle phrase dit le contraire de « (.+) » \?$/.exec(prompt);
  if (m) return all(ok(NEG.get(m[1]) === right, `le contraire de « ${m[1]} » est « ${NEG.get(m[1])} », pas « ${right} »`), notValid());
  m = /^On te demande « (.+) ». Tu réponds (oui|non)\. Quelle est la bonne réponse \?$/.exec(prompt);
  if (m) {
    const reply = REPLY.get(m[1]);
    if (!reply) return `question inconnue : ${m[1]}`;
    const expected = m[2] === "oui" ? reply.yes : reply.no;
    return all(ok(right === expected, `réponse attendue « ${expected} », pas « ${right} »`), ok(wrongs.every((wrong) => wrong !== expected), "la bonne réponse est aussi un mauvais choix"));
  }
  m = /^On te demande « What does (.+) do\? ». Quelle est la bonne réponse \?$/.exec(prompt);
  if (m) {
    const person = JB_PERSON.find((p) => p.q === m![1]);
    if (!person) return `personne inconnue : ${m[1]}`;
    return all(ok(VALID.has(right) && right.startsWith(`${person.pron} is a `), `« ${right} » ne répond pas pour ${m[1]}`), notValid());
  }
  m = /^Que veut dire « (.+) » \?$/.exec(prompt);
  if (m) return all(ok(frOf(m[1]).has(right), `« ${m[1]} » ne veut pas dire « ${right} »`), ...wrongs.map((wrong) => ok(!frOf(m![1]).has(wrong), `« ${m![1]} » veut dire aussi « ${wrong} »`)));
  m = /^(.+\.) Comment dit-on son métier en anglais \?$/.exec(prompt);
  if (m) {
    const job = CLUE_JOB.get(m[1]);
    const confusable = job === "doctor" ? ["nurse"] : job === "nurse" ? ["doctor"] : [];
    return all(ok(job === right, `« ${m[1]} » est ${job}, pas ${right}`), ...wrongs.map((wrong) => ok(wrong !== job && !confusable.includes(wrong), `« ${wrong} » irait aussi à « ${m![1]} »`)));
  }
  m = /^Quel nombre est « (.+) » \?$/.exec(prompt);
  if (m) return all(ok(NUMBER.get(m[1]) === right, `« ${m[1]} » est ${NUMBER.get(m[1])}, pas ${right}`), ...wrongs.map((wrong) => ok(wrong !== right, "doublon")));
  m = /^Comment s'écrit (\d+) en anglais \?$/.exec(prompt);
  if (m) {
    const words = [...NUMBER.entries()].find(([, digits]) => digits === m![1])?.[0];
    return all(ok(words === right, `${m[1]} s'écrit « ${words} », pas « ${right} »`), ...wrongs.map((wrong) => ok(!NUMBER.has(wrong), `« ${wrong} » est un vrai nombre`)));
  }
  m = /^Le prix est de (\d+) francs\. Quelle phrase est juste \?$/.exec(prompt);
  if (m) return all(ok(frOf(right).has(`Le prix est de ${m[1]} francs.`), `« ${right} » ne dit pas ${m[1]} francs`), notValid());
  return `énoncé inconnu : ${prompt}`;
};

const checkGap = (exo: Exo): string | null => {
  const blank = blankOf(exo);
  const text = textOf(exo);
  const cue = exo.prompt === "Complète la phrase." ? null : exo.prompt.replace(/ Complète la phrase en anglais\.$/, "");
  if (cue === exo.prompt) return `consigne inconnue : ${exo.prompt}`;
  const right = filled(text, blank.answer);
  const wrongs = blank.options.filter((option) => option !== blank.answer).map((option) => filled(text, option));
  return all(
    ok(VALID.has(right), `« ${right} » n'est pas juste`),
    cue === null ? null : ok(frOf(right).has(cue), `« ${right} » ne dit pas « ${cue} »`),
    ...wrongs.map((wrong) => (cue === null ? ok(!VALID.has(wrong), `« ${wrong} » est juste aussi`) : ok(!frOf(wrong).has(cue), `« ${wrong} » dit aussi « ${cue} »`))),
  );
};

const checkWrite = (exo: Exo): string | null => {
  const accepted = acceptedOf(exo);
  if (accepted[0] !== exo.answerKey) return `la première écriture admise n'est pas la réponse : ${exo.prompt}`;
  let m = /^Écris en anglais le nombre (\d+)\.$/.exec(exo.prompt);
  if (m) {
    const words = [...NUMBER.entries()].find(([, digits]) => digits === m![1])?.[0];
    return ok(words === accepted[0], `${m[1]} s'écrit « ${words} », pas « ${accepted[0]} »`);
  }
  let cue: string | null = null;
  let english: string;
  m = /^(.+?\.) Écris (.+?) dans (.+)$/.exec(exo.prompt);
  const plain = /^Écris (?:le|la) [^.]+\. (.+)$/.exec(exo.prompt);
  if (m) {
    cue = m[1];
    english = m[3];
  } else if (plain) {
    english = plain[1];
  } else {
    return `consigne inconnue : ${exo.prompt}`;
  }
  const sentence = filled(english, accepted[0]);
  return all(ok(VALID.has(sentence), `« ${sentence} » n'est pas juste`), cue === null ? null : ok(frOf(sentence).has(cue), `« ${sentence} » ne dit pas « ${cue} »`));
};

const checkOrder = (exo: Exo): string | null => {
  const tiles = sequenceOf(exo);
  if (exo.prompt === "Range ces moments d'une journée, du premier au dernier.") {
    const ranks = tiles.map((tile) => DAY.indexOf(tile));
    return ok(ranks.every((rank) => rank >= 0) && ranks.every((rank, i) => i === 0 || rank > ranks[i - 1]), `journée dans le désordre : ${tiles.join(" / ")}`);
  }
  const sentence = tiles.join(" ");
  const isQuestion = sentence.endsWith("?");
  return all(
    ok(VALID.has(sentence), `« ${sentence} » n'est pas juste`),
    ok(exo.prompt === (isQuestion ? "Remets les mots dans l'ordre pour écrire une question." : "Remets les mots dans l'ordre pour écrire une phrase."), `consigne : ${exo.prompt}`),
    ok(tiles.length >= 3 && tiles.length <= 7, `${tiles.length} tuiles`),
    ok(onlyOrder(tiles), `« ${sentence} » n'est pas le seul ordre`),
  );
};

const checkLink = (exo: Exo): string | null =>
  all(
    ...pairsOf(exo).map((pair) => {
      const sentence = pair.left.endsWith(".") && VALID.has(pair.left);
      return ok(sentence ? frOf(pair.left).has(pair.right) : GLOSS.has(`${pair.left}|${pair.right}`), `paire fausse : ${pair.left} ~ ${pair.right} (${exo.prompt})`);
    }),
  );

const SETS = (...words: string[]) => (text: string) => words.includes(text);
const ZONE: Record<string, (text: string) => boolean> = {
  "Phrase positive": (t) => VALID.has(t) && !/ not /.test(t),
  "Phrase négative": (t) => VALID.has(t) && / not /.test(t),
  "Je demande": (t) => VALID.has(t) && t.endsWith("?"),
  "Je réponds": (t) => VALID.has(t) && /^(Yes|No), /.test(t),
  "avec -s": SETS("plays", "eats", "reads", "drinks", "writes", "sleeps", "bananas", "onions", "eggs", "oranges"),
  "avec -es": SETS("watches", "goes", "mangoes", "tomatoes"),
  do: SETS("I", "You", "We", "They"),
  does: SETS("He", "She", "It", "Awa"),
  "Phrase juste": (t) => VALID.has(t),
  "Phrase fausse": (t) => !VALID.has(t),
  at: (t) => /o'clock$/.test(t) || t === "night",
  in: (t) => /^the (morning|afternoon|evening)$/.test(t),
  "Le matin": SETS("I get up at six o'clock.", "I have breakfast.", "I go to school."),
  "Le soir et la nuit": SETS("I do my homework.", "I go to bed at nine o'clock.", "I sleep at night."),
  Habitude: (t) => VALID.has(t) && / every day\.$/.test(t),
  "En ce moment": (t) => VALID.has(t) && / now\.$/.test(t),
  "On double la lettre": SETS("running", "swimming"),
  "On enlève le e": SETS("writing", "dancing"),
  is: SETS("He", "She", "It", "Awa"),
  are: SETS("You", "We", "They", "Awa and Moussa"),
  "Soigne les gens": SETS("doctor", "nurse"),
  "Travaille dehors": SETS("farmer", "fisherman"),
  He: SETS("My father", "My uncle", "My brother"),
  She: SETS("My mother", "My aunt", "My sister"),
  Dizaines: (t) => /ty$/.test(t),
  Centaines: (t) => /hundred$/.test(t),
  Grandeur: SETS("tall", "short", "big", "small"),
  Sentiment: SETS("happy", "sad"),
  Cheveux: SETS("long", "short"),
  Yeux: SETS("green", "blue"),
};

const checkSort = (exo: Exo): string | null => {
  const [first, second] = zonesOf(exo);
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

defineTemplateTests({
  label: "de l'anglais du CM1",
  klass: "CM1",
  count: COUNTS,
  draws: 200,
  topicKinds: TOPIC_KINDS,
  expectedKinds: 42,
  topicCount: 7,
  kindPattern: /^cm1-en-/,
  check: (kind, exo) => CHECKS[kind.split("-").pop() as string](exo as Exo),
});
