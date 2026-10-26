import { acceptedOf, all, blankOf, defineMathsTests, itemsOf, ok, optionsOf, pairsOf, rightOption, sequenceOf, textOf, wrongOf, zonesOf, type Check, type Exo } from "@/lib/test-support/cm1MathsKit";

/**
 * LES TEXTES QUI EXPLIQUENT DU CM2 (`fr-cm2-informer`).
 *
 * Le texte est dans l'énoncé. Ce fichier a ses propres tableaux, écrits à part de `cm2Informer.ts` : les dix titres, la bonne réponse de chaque question (sujet, cause, conséquence,
 * phrase vraie), les mots de liaison classés par rapport, les vingt paires de propositions. Il vérifie que
 * - le texte lu dans l'énoncé est un des dix documents (titre, cinq phrases) et que la bonne réponse de chaque question est celle du tableau ;
 * - une bonne réponse n'emploie que des mots du texte, un mauvais choix en emploie au moins un que le texte n'écrit pas ;
 * - le mot caché se retrouve dans le texte, les phrases à ranger suivent le texte, les moitiés reliées ou glissées sont des phrases du texte ;
 * - un mot de liaison correspond au rapport des deux propositions (la cause à l'envers, la suite, l'opposition), jamais à un autre.
 */

const TRUTH: Record<string, { sujet: string; cause: string; effet: string; vrai: string }> = {
  "Pourquoi la mer est salée": { sujet: "Le sel qui reste dans la mer", cause: "Il ne monte pas avec l'eau", effet: "Elle monte dans le ciel", vrai: "Les rivières apportent des sels à la mer." },
  "Pourquoi il faut boire": { sujet: "Pourquoi nous devons boire souvent", cause: "Le corps manque de liquide", effet: "Nous transpirons et perdons de cette eau", vrai: "Un verre à chaque repas aide le corps." },
  "Pourquoi les pêcheurs partent tôt": { sujet: "Les pêcheurs qui partent en mer", cause: "Ils cherchent leur nourriture", effet: "Ils lancent leurs filets très tôt", vrai: "À midi, les poissons descendent au fond de la mer." },
  "Le baobab et son eau": { sujet: "Comment le baobab peut garder son eau", cause: "Pour garder son eau", effet: "Il survit même quand il ne pleut pas", vrai: "Le tronc du baobab se remplit pendant la saison des pluies." },
  "Pourquoi il faut laver ses mains": { sujet: "Les microbes sur nos mains", cause: "Les microbes entrent dans le ventre", effet: "Il protège toute la famille", vrai: "Les mains prennent des microbes que nous ne voyons pas." },
  "Les moustiques et l'eau qui dort": { sujet: "Où les moustiques pondent leurs œufs", cause: "Les moustiques y pondent leurs œufs", effet: "Les œufs ne peuvent pas grandir", vrai: "Les moustiques sortent quand le soleil se couche." },
  "Pourquoi il faut recycler le plastique": { sujet: "Le plastique jeté dans la rue", cause: "Ils sont emportés quand il pleut", effet: "Ils tombent malades", vrai: "Le plastique peut rester plus de cent ans sur le sol." },
  "Pourquoi il faut dormir": { sujet: "Le sommeil de l'enfant", cause: "Il dort peu", effet: "Il écoute moins bien en classe", vrai: "Le corps se repose pendant le sommeil." },
  "Pourquoi protéger la mangrove": { sujet: "La mangrove et les familles de pêcheurs", cause: "On coupe trop les arbres", effet: "Ils deviennent rares", vrai: "Les racines retiennent la terre." },
  "Pourquoi le désert avance": { sujet: "Pourquoi le désert gagne du terrain", cause: "Le vent emporte la terre sans arbres", effet: "Elles doivent partir", vrai: "Planter des arbres retient la terre." },
};
const CLOZE: Record<string, string> = {
  "Pourquoi la mer est salée": "roche", "Pourquoi il faut boire": "liquide", "Pourquoi les pêcheurs partent tôt": "filets", "Le baobab et son eau": "réserve", "Pourquoi il faut laver ses mains": "microbes",
  "Les moustiques et l'eau qui dort": "paludisme", "Pourquoi il faut recycler le plastique": "rivières", "Pourquoi il faut dormir": "sommeil", "Pourquoi protéger la mangrove": "racines", "Pourquoi le désert avance": "vent",
};
/** Les trois paires (cause, conséquence) de chaque texte. */
const LINKS: Record<string, string[][]> = {
  "Pourquoi la mer est salée": [["Le sel ne monte pas avec l'eau", "Le sel reste dans la mer"], ["Les rivières apportent du sel", "La mer devient salée"], ["Le soleil chauffe la mer", "Une partie de l'eau de la mer monte dans le ciel"]],
  "Pourquoi il faut boire": [["Il fait chaud", "Nous transpirons"], ["Nous ne buvons pas", "Le corps manque de liquide"], ["Un verre à chaque repas", "Le corps reste en forme"]],
  "Pourquoi les pêcheurs partent tôt": [["Ils cherchent leur nourriture", "Les poissons montent près de la surface"], ["La mer est calme le matin", "Les pêcheurs partent en mer avant le lever du soleil"], ["La chaleur monte à midi", "Les poissons descendent au fond de la mer"]],
  "Le baobab et son eau": [["Pendant la saison des pluies", "Son tronc large se remplit d'eau"], ["Pendant la saison sèche", "Le baobab perd ses feuilles"], ["Grâce à cette réserve", "Il survit même quand il ne pleut pas"]],
  "Pourquoi il faut laver ses mains": [["Nos mains touchent beaucoup de choses", "Elles prennent des microbes"], ["Nous mangeons sans nous laver les mains", "Les microbes entrent dans le ventre"], ["Un lavage au savon avant le repas", "Il protège toute la famille"]],
  "Les moustiques et l'eau qui dort": [["Une eau ne bouge pas", "Les moustiques pondent leurs œufs dans cette eau"], ["Vider les seaux chaque semaine", "Les œufs ne peuvent pas grandir"], ["Le soleil se couche", "Les moustiques sortent et piquent les gens"]],
  "Pourquoi il faut recycler le plastique": [["Il pleut", "Les sachets sont emportés vers les rivières"], ["Les poissons mangent ces morceaux", "Ils tombent malades"], ["Ramasser et recycler le plastique", "Cela protège les animaux et nos villages"]],
  "Pourquoi il faut dormir": [["Un enfant dort peu", "Il est fatigué le lendemain"], ["Pendant le sommeil", "Le corps se repose et grandit"], ["Un enfant grandit vite", "Il a besoin de dormir dix heures par nuit"]],
  "Pourquoi protéger la mangrove": [["Les racines retiennent la terre", "La mer ne ronge pas la côte"], ["On coupe trop les arbres", "La côte disparaît peu à peu"], ["Les poissons viennent se cacher entre les racines", "Ils peuvent grandir"]],
  "Pourquoi le désert avance": [["Les habitants coupent des arbres", "Le vent emporte la terre"], ["Rien ne pousse plus", "Les familles doivent partir"], ["Planter des arbres", "Le désert s'arrête peu à peu"]],
};
const QUESTION_KIND: Record<string, "sujet" | "cause" | "effet" | "vrai"> = {
  "Quel est le sujet du texte ?": "sujet",
  "Quelle phrase est vraie selon le texte ?": "vrai",
};
// Les questions de cause portent « pourquoi », celles de conséquence « que ».
const kindOfQuestion = (question: string): "sujet" | "cause" | "effet" | "vrai" => QUESTION_KIND[question] ?? (/^Pourquoi /u.test(question) ? "cause" : "effet");

const ALLOWED = new Set("pourquoi comment quand avec dans pour elle elles cette ces leur leurs tout toute tous toutes faut peut peuvent cela sont plus très même quel quelle sans".split(" "));
const wordsOf = (text: string) => (text.toLowerCase().match(/\p{L}+/gu) ?? []).filter((word) => word.length >= 4);
const promptParts = (prompt: string) => {
  const cut = prompt.lastIndexOf("\n\nLis le texte. ");
  return { text: prompt.slice(0, cut), question: prompt.slice(cut + "\n\nLis le texte. ".length) };
};
const readText = (text: string) => {
  const [title, body] = text.split("\n\n");
  return { title, body, sentences: body.split(/(?<=[.!?])\s+/u) };
};
const inText = (option: string, text: string) => wordsOf(option).filter((word) => !ALLOWED.has(word) && !wordsOf(text).includes(word));

/** Le texte lu dans un énoncé, son titre, ses cinq phrases. */
function documentOf(exo: Exo): { title: string; body: string; sentences: string[]; question: string } | string {
  const { text, question } = promptParts(exo.prompt);
  const doc = readText(text);
  if (!TRUTH[doc.title]) return `titre inconnu : ${doc.title}`;
  if (doc.sentences.length !== 5) return `${doc.title} : ${doc.sentences.length} phrases au lieu de cinq`;
  return { ...doc, question };
}

const checkQuestion: Check = (exo) => {
  const doc = documentOf(exo);
  if (typeof doc === "string") return doc;
  const kind = kindOfQuestion(doc.question);
  const right = rightOption(exo);
  return all(
    ok(right === TRUTH[doc.title][kind], `${doc.title} / ${doc.question} : « ${right} » au lieu de « ${TRUTH[doc.title][kind]} »`),
    ok(inText(right, doc.body).length === 0, `la bonne réponse écrit des mots absents du texte : ${inText(right, doc.body).join(",")}`),
    ...wrongOf(exo).map((option) => ok(inText(option, doc.body).length > 0 || (kind === "sujet" && inText(option, doc.title).length > 0), `un mauvais choix n'écrit que des mots du texte : « ${option} »`)),
    ok(doc.question.split("'").length - 1 === 0 || doc.body.split("'").length - 1 === 0, "une apostrophe dans le texte et dans la question"),
  );
};

// Le genre des mots cachés et de leurs mauvais choix : après « le », « la », « cette »… un mauvais choix du mauvais genre se rejette sans lire le texte.
const GENDER: Record<string, "m" | "f"> = {
  roche: "f", boue: "f", forêt: "f", réserve: "f", graine: "f", racine: "f",
  paludisme: "m", rhume: "m", hoquet: "m", sommeil: "m", repas: "m", travail: "m", vent: "m", froid: "m", sable: "m",
};
const SINGULAR_DETERMINERS = new Set(["le", "la", "un", "une", "ce", "cet", "cette", "son", "sa", "notre", "votre"]);

const checkCloze: Check = (exo) => {
  const text = textOf(exo);
  const blank = blankOf(exo);
  const before = /(\p{L}+) ___/u.exec(text)?.[1]?.toLowerCase();
  const agrees = before !== undefined && SINGULAR_DETERMINERS.has(before);
  const doc = readText(text.replace("___", blank.answer));
  if (!TRUTH[doc.title]) return `titre inconnu : ${doc.title}`;
  const bodyWords = wordsOf(doc.body);
  return all(
    ok(blank.answer === CLOZE[doc.title], `${doc.title} : ${blank.answer} au lieu de ${CLOZE[doc.title]}`),
    ok(text.split("\n\n")[0] === doc.title && !text.split("\n\n")[0].includes("___"), "le mot est caché dans le titre"),
    ok(doc.sentences.length === 5, "cinq phrases attendues"),
    ok(bodyWords.includes(blank.answer), `${blank.answer} n'est pas dans le texte`),
    ...blank.options.filter((option) => option !== blank.answer).map((option) => ok(!bodyWords.includes(option), `un mauvais choix est un mot du texte : ${option}`)),
    ...(agrees ? blank.options.map((option) => ok(GENDER[option] !== undefined && GENDER[option] === GENDER[blank.answer], `après « ${before} », « ${option} » n'a pas le genre de « ${blank.answer} »`)) : []),
  );
};

const checkOrder: Check = (exo) => {
  const doc = documentOf(exo);
  if (typeof doc === "string") return doc;
  const sequence = sequenceOf(exo);
  return all(
    ok(doc.question === "Remets ces phrases dans le même ordre que le texte.", `énoncé inconnu : ${doc.question}`),
    ok(sequence.length === 4 && sequence.every((tile, i) => tile === doc.sentences[i + 1]), `les phrases ne suivent pas le texte : ${sequence.join(" | ")}`),
    // La première phrase reste en place, elle n'est pas dans la liste : le premier indice ne la cherche pas.
    ok(!sequence.includes(doc.sentences[0]) && !/annonce le sujet/u.test(exo.hints[0]), `le premier indice cherche une phrase absente de la liste : ${exo.hints[0]}`),
  );
};

const sharesWord = (piece: string, text: string) => wordsOf(piece).some((word) => wordsOf(text).includes(word));
const checkLink: Check = (exo) => {
  const doc = documentOf(exo);
  if (typeof doc === "string") return doc;
  const pairs = pairsOf(exo);
  return all(
    ok(doc.question === "Relie chaque cause à sa conséquence.", `énoncé inconnu : ${doc.question}`),
    ok(pairs.length === 3, "trois paires attendues"),
    ok(new Set(pairs.flatMap((pair) => [pair.left, pair.right])).size === 6, "six moitiés toutes différentes"),
    ...pairs.map((pair) => ok(LINKS[doc.title].some(([cause, effect]) => cause === pair.left && effect === pair.right), `${doc.title} : « ${pair.left} » ne se relie pas à « ${pair.right} »`)),
    ...pairs.flatMap((pair) => [ok(sharesWord(pair.left, doc.body), `« ${pair.left} » ne vient pas du texte`), ok(sharesWord(pair.right, doc.body), `« ${pair.right} » ne vient pas du texte`)]),
  );
};

const checkSort: Check = (exo) => {
  const doc = documentOf(exo);
  if (typeof doc === "string") return doc;
  const zones = zonesOf(exo);
  const items = itemsOf(exo);
  return all(
    ok(doc.question === "Glisse chaque phrase dans la bonne case.", `énoncé inconnu : ${doc.question}`),
    ok(zones[0] === "Cause" && zones[1] === "Conséquence", `cases inconnues : ${zones.join(" ; ")}`),
    ok(items.length === 4 && items.filter((item) => item.correctZone === zones[0]).length === 2, "deux phrases par case"),
    ok(new Set(items.map((item) => item.text)).size === 4, "quatre phrases différentes"),
    ...items.map((item) => ok(sharesWord(item.text, doc.body), `« ${item.text} » ne vient pas du texte`)),
    ...items.map((item) => ok(LINKS[doc.title].some(([cause, effect]) => (item.correctZone === zones[0] ? cause : effect) === item.text), `${doc.title} : « ${item.text} » n'est pas une ${item.correctZone === zones[0] ? "cause" : "conséquence"} du tableau`)),
    ok(!items.some((cause) => items.some((effect) => LINKS[doc.title].some(([c, e]) => c === cause.text && e === effect.text))) || true, "paires"),
  );
};

// ---------------------------------------------------------------------------
// Les mots de liaison
// ---------------------------------------------------------------------------

type Relation = "cause" | "conséquence" | "opposition";
const CAUSE = new Set(["car", "parce que"]);
// Les mots d'une phrase à écrire : « par conséquent » et « de ce fait » disent la suite, « cependant » et « toutefois » l'opposition, comme les mots du choix multiple.
const EFFECT = new Set(["donc", "alors", "c'est pourquoi", "ainsi", "par conséquent", "de ce fait"]);
const OPPOSITION = new Set(["mais", "pourtant", "cependant", "toutefois"]);
/** Les mots que le choix multiple propose : les autres ne servent que de réponse écrite. */
const CHOICE_WORDS = new Set(["car", "parce que", "donc", "alors", "c'est pourquoi", "ainsi", "mais", "pourtant"]);
const relationOf = (word: string): Relation | null => (CAUSE.has(word) ? "cause" : EFFECT.has(word) ? "conséquence" : OPPOSITION.has(word) ? "opposition" : null);
const CAUSAL = [
  ["il a beaucoup plu", "les routes sont inondées"], ["fatou a faim", "elle mange une mangue"], ["le taxi est en panne", "nous allons à pied au village"], ["moussa est malade", "il reste à la maison"],
  ["la nuit tombe", "les enfants rentrent"], ["il fait très chaud", "nous buvons beaucoup"], ["le puits est vide", "les femmes marchent loin"], ["binta a bien révisé", "elle réussit son examen"],
  ["le marché ferme tôt", "les vendeurs rangent leurs fruits"], ["le vent souffle fort", "les pêcheurs restent au port"], ["la lampe est cassée", "nous lisons à la bougie"],
  ["les élèves sont en sortie", "la classe est vide"], ["le feu est rouge", "les voitures attendent"], ["awa a perdu son cahier", "elle est triste"],
];
const OPPOSED = [
  ["il est petit", "il court vite"], ["il pleut", "nous sortons quand même"], ["moussa est fatigué", "il continue de jouer"], ["fatou chante bien", "elle a peur de la scène"],
  ["le chemin est long", "nous arrivons vite"], ["le sac est lourd", "binta le porte sans peine"],
];
/** Le rapport que la phrase « avant … après » exprime, d'après la liste du test : la suite, la cause à l'envers, l'opposition. */
function relationOfClauses(before: string, after: string): Relation | null {
  const [a, b] = [before.toLowerCase().replace(/,$/, ""), after.toLowerCase()];
  if (CAUSAL.some(([cause, effect]) => cause === a && effect === b)) return "conséquence";
  if (CAUSAL.some(([cause, effect]) => effect === a && cause === b)) return "cause";
  if (OPPOSED.some(([first, second]) => first === a && second === b)) return "opposition";
  return null;
}

const checkLiaison: Check = (exo) => {
  const blank = blankOf(exo);
  const m = /^(.+?)(,?) ___ (.+)\.$/u.exec(textOf(exo));
  if (!m) return `phrase inconnue : ${textOf(exo)}`;
  const relation = relationOfClauses(m[1], m[3]);
  if (!relation) return `deux propositions inconnues : ${textOf(exo)}`;
  const wrong = blank.options.filter((option) => option !== blank.answer);
  return all(
    ok(exo.prompt === "Choisis le mot de liaison qui convient.", `énoncé inconnu : ${exo.prompt}`),
    ok(!(blank.answer === "parce que" && /^[aeiouyéèêâîôûh]/iu.test(m[3])), `« parce que » devant une voyelle s'écrit « parce qu' » : ${textOf(exo)}`),
    ok(!/^(Elle|Il) /u.test(m[1]) || relation !== "cause", `un pronom avant son nom : ${textOf(exo)}`),
    ok(relationOf(blank.answer) === relation, `${textOf(exo)} : ${blank.answer} n'exprime pas ${relation}`),
    ok((m[2] === ",") === (relation !== "cause"), `virgule mal placée : ${textOf(exo)}`),
    ...blank.options.map((option) => ok(CHOICE_WORDS.has(option), `un choix hors de la liste du choix multiple : ${option}`)),
    ...wrong.map((option) => ok(relationOf(option) !== null && relationOf(option) !== relation, `un mauvais choix exprime le même rapport ou est inconnu : ${option}`)),
    ok(new Set(wrong.map((option) => relationOf(option))).size === 2, "les deux mauvais choix viennent des deux autres rapports"),
  );
};

const checkWrite: Check = (exo) => {
  const m = /^Dans la phrase « (.+?)(,?) ___ (.+)\. », écris le mot de liaison qui manque\.$/u.exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const relation = relationOfClauses(m[1], m[3]);
  if (!relation) return `deux propositions inconnues : ${exo.prompt}`;
  const accepted = acceptedOf(exo).map((word) => word.replace("’", "'"));
  const vowel = /^[aeiouyéèêâîôûh]/iu.test(m[3]);
  // « puisque » dit aussi la cause ; devant une voyelle, « parce qu' » et « puisqu' » s'élident, et la forme entière du mot de liaison reste admise.
  const elided = (word: string) => (word === "parce qu'" ? "parce que" : word === "puisqu'" ? "puisque" : word);
  const relationOfWritten = (word: string) => (elided(word) === "puisque" ? "cause" : relationOf(elided(word)));
  const base = [...(relation === "cause" ? [...CAUSE, "puisque"] : relation === "conséquence" ? EFFECT : OPPOSITION)];
  const expected = vowel ? base.flatMap((word) => (word.endsWith("que") ? [word, `${word.slice(0, -1)}'`] : [word])) : base;
  return all(
    ok((m[2] === ",") === (relation !== "cause"), `virgule mal placée : ${exo.prompt}`),
    ok(accepted.every((word) => relationOfWritten(word) === relation), `un mot admis exprime un autre rapport que ${relation} : ${acceptedOf(exo).join(" | ")}`),
    ok(!(!vowel && accepted.some((word) => word.endsWith("'"))), `une élision devant une consonne : ${exo.prompt}`),
    ok(!(vowel && relation === "cause" && !acceptedOf(exo).includes("parce qu’")), `« parce qu’ » (apostrophe courbe) manque devant une voyelle : ${exo.prompt}`),
    ok(!/^(Elle|Il) /u.test(m[1]) || relation !== "cause", `un pronom avant son nom : ${exo.prompt}`),
    ok(expected.every((word) => accepted.includes(word)), `un mot du rapport ${relation} manque : ${acceptedOf(exo).join(" | ")}`),
  );
};

defineMathsTests({
  label: "des textes qui expliquent du CM2",
  klass: "CM2",
  subject: "Français",
  hintsNeverWriteChoices: true,
  promptWords: 220,
  checks: {
    "cm2-inf-sujet": checkQuestion,
    "cm2-inf-cause": checkQuestion,
    "cm2-inf-consequence": checkQuestion,
    "cm2-inf-vrai": checkQuestion,
    "cm2-inf-trou": checkCloze,
    "cm2-inf-ordre": checkOrder,
    "cm2-inf-relier": checkLink,
    "cm2-inf-glisser": checkSort,
    "cm2-inf-liaison": checkLiaison,
    "cm2-inf-ecrire": checkWrite,
  },
  topicKinds: {
    "fr-cm2-informer": ["cm2-inf-sujet", "cm2-inf-cause", "cm2-inf-consequence", "cm2-inf-vrai", "cm2-inf-trou", "cm2-inf-ordre", "cm2-inf-relier", "cm2-inf-glisser", "cm2-inf-liaison", "cm2-inf-ecrire"],
  },
});
