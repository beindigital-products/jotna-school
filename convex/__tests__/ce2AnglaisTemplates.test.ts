import { describe, expect, it, vi } from "vitest";
import { auditExercise } from "../paliers/exerciseAudit";
import { GAME_KINDS, generateGames, regenerateGame, type GameKind } from "../paliers/games";
import { makeContext, type GameLevel } from "../paliers/games/shared";
import { topicUsesModel } from "../paliers/pregen";
import { allProgrammeEntries } from "../programme";
import { PALIER_SIZE } from "../paliers/scoring";

// Ces tests jouent des milliers de tirages : sur le serveur de CI, chargé, l'un d'eux dépasse les 5 secondes par défaut.
vi.setConfig({ testTimeout: 60_000 });

/**
 * L'ANGLAIS DU CE2 : être, avoir, pouvoir, la maison, les mois, le temps, l'heure (`an-ce2-*`).
 *
 * Chaque test RECALCULE la bonne réponse avec ses propres tables, écrites à part : le verbe être, avoir et can de chaque sujet, le pluriel régulier,
 * le français de chaque phrase, les mois et leurs voisins, les jours de chaque mois, les saisons du Sénégal, l'heure pile et la demie. Un gabarit
 * dont la réponse contredit sa règle, ou qui sort du tiers de son palier, échoue. À la fin, des MUTATIONS : on abîme la bonne réponse d'un exercice
 * juste, et chaque vérification doit le voir.
 */

const LEVELS: GameLevel[] = [1, 2, 3, 4];
const draws = LEVELS.flatMap((level) => Array.from({ length: 60 }, (_, n) => ({ level, seed: `ce2en:${level}:${n}` })));
const make = (kind: GameKind, d: { level: GameLevel; seed: string }) => GAME_KINDS[kind].make(makeContext("CE2", d.level, `${kind}:${d.seed}`));

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
const levelOf = (exo: Exo) => (exo.payload.game as { level: GameLevel }).level;

const apostrophes = (text: string) => (text.match(/'/g) ?? []).length;
const wordCount = (text: string) => text.split(/\s+/).filter((token) => /[\p{L}\p{N}]/u.test(token)).length;
const same = (a: readonly string[], b: readonly string[]) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());
const fold = (text: string) => text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

type Check = (exo: Exo) => string | null;
const ok = (condition: boolean, message: string) => (condition ? null : message);
const all = (...results: (string | null)[]) => results.find((result) => result !== null) ?? null;
const esc = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const alt = (items: readonly string[]) => [...items].sort((a, b) => b.length - a.length).map(esc).join("|");
const cap = (text: string) => `${text.charAt(0).toUpperCase()}${text.slice(1)}`;
const lowerFirst = (text: string) => `${text.charAt(0).toLowerCase()}${text.slice(1)}`;

// ===========================================================================
// LES SUJETS ET LEURS TROIS TIERS
// ===========================================================================

type Subj = { text: string; be: string; have: string; ans: string; plural: boolean; frSub: string; frVerb: string; frHave: string };
const S = (text: string, be: string, have: string, ans: string, plural: boolean, frSub: string, frVerb: string, frHave: string): Subj => ({ text, be, have, ans, plural, frSub, frVerb, frHave });

const BANDS3: Subj[][] = [
  [
    S("I", "am", "have", "you", false, "Je", "sais", "J'ai"),
    S("You", "are", "have", "I", false, "Tu", "sais", "Tu as"),
    S("He", "is", "has", "he", false, "Il", "sait", "Il a"),
    S("She", "is", "has", "she", false, "Elle", "sait", "Elle a"),
    S("We", "are", "have", "we", true, "Nous", "savons", "Nous avons"),
    S("They", "are", "have", "they", true, "Ils", "savent", "Ils ont"),
  ],
  [
    S("Awa", "is", "has", "she", false, "Awa", "sait", "Awa a"),
    S("Moussa", "is", "has", "he", false, "Moussa", "sait", "Moussa a"),
    S("Aminata", "is", "has", "she", false, "Aminata", "sait", "Aminata a"),
    S("Awa and Moussa", "are", "have", "they", true, "Awa et Moussa", "savent", "Awa et Moussa ont"),
    S("Fatou and Ibrahima", "are", "have", "they", true, "Fatou et Ibrahima", "savent", "Fatou et Ibrahima ont"),
    S("Cheikh and Omar", "are", "have", "they", true, "Cheikh et Omar", "savent", "Cheikh et Omar ont"),
  ],
  [
    S("My brother", "is", "has", "he", false, "Mon frère", "sait", "Mon frère a"),
    S("My mother", "is", "has", "she", false, "Ma mère", "sait", "Ma mère a"),
    S("My cousin", "is", "has", "he", false, "Mon cousin", "sait", "Mon cousin a"),
    S("My friends", "are", "have", "they", true, "Mes amis", "savent", "Mes amis ont"),
    S("My parents", "are", "have", "they", true, "Mes parents", "savent", "Mes parents ont"),
    S("The girls", "are", "have", "they", true, "Les filles", "savent", "Les filles ont"),
  ],
];
const SUBJECTS = BANDS3.flat();
const band3 = (level: GameLevel) => (level === 1 ? 0 : level === 2 ? 1 : 2);
const subjectByText = (text: string) => SUBJECTS.find((subject) => subject.text === text);
/** Le sujet au milieu d'une question : « Am I », « Is my brother », « Are Awa and Moussa ». */
const qOf = (subject: Subj) => (subject.text === "I" || /^(Awa|Moussa|Aminata|Fatou|Cheikh)/.test(subject.text) ? subject.text : lowerFirst(subject.text));
const subjectByQ = (q: string) => SUBJECTS.find((subject) => qOf(subject) === q);
const bandOfSubject = (subject: Subj) => BANDS3.findIndex((band) => band.includes(subject));
const SUBJ = alt(SUBJECTS.map((subject) => subject.text));
const Q = alt(SUBJECTS.map(qOf));
const ansBe = (ans: string) => (ans === "I" ? "am" : ans === "he" || ans === "she" || ans === "it" ? "is" : "are");
const ansHave = (ans: string) => (ans === "he" || ans === "she" || ans === "it" ? "has" : "have");

const QUESTION_PROMPT = "Remets les mots dans l'ordre pour écrire une question.";
const reply = (yes: boolean, ans: string, verb: string, negation = "not") => (yes ? `Yes, ${ans} ${verb}.` : `No, ${ans} ${verb} ${negation}.`);

// ===========================================================================
// ÊTRE
// ===========================================================================

const PRED_SG = ["a student", "a teacher", "a doctor", "happy", "tired", "hungry", "at home", "at school"];
const PRED_PL = ["students", "teachers", "doctors", "happy", "tired", "hungry", "at home", "at school"];
const PRED = alt([...new Set([...PRED_SG, ...PRED_PL])]);
const predOk = (subject: Subj, pred: string) => (subject.plural ? PRED_PL : PRED_SG).includes(pred);

const beSubjectOk = (subject: Subj | undefined, pred: string, level: GameLevel): string | null =>
  subject === undefined ? "sujet inconnu" : all(ok(bandOfSubject(subject) === band3(level), `« ${subject.text} » au palier ${level}`), ok(predOk(subject, pred), `« ${pred} » avec « ${subject.text} »`));

const checkBeGap: Check = (exo) => {
  const m = new RegExp(`^(${SUBJ}) ___ (${PRED})\\.$`).exec(textOf(exo));
  if (!m) return `phrase inconnue : ${textOf(exo)}`;
  const subject = subjectByText(m[1]);
  return all(beSubjectOk(subject, m[2], levelOf(exo)), ok(exo.prompt === "Complète la phrase.", exo.prompt), ok(blankOf(exo).answer === subject!.be, `${textOf(exo)} : ${blankOf(exo).answer}, pas ${subject!.be}`), ok(same(blankOf(exo).options, ["am", "is", "are"]), blankOf(exo).options.join(" | ")));
};

const checkBePhrase: Check = (exo) => {
  const m = new RegExp(`^(${SUBJ}) (am|is|are) (${PRED})\\.$`).exec(rightOption(exo));
  if (!m) return `phrase inconnue : ${rightOption(exo)}`;
  const subject = subjectByText(m[1]);
  const expectedWrong = ["am", "is", "are"].filter((verb) => verb !== m[2]).map((verb) => `${m[1]} ${verb} ${m[3]}.`);
  return all(
    beSubjectOk(subject, m[3], levelOf(exo)),
    ok(exo.prompt === "Quelle phrase est juste ?", exo.prompt),
    ok(m[2] === subject!.be, `${rightOption(exo)} : ${subject!.be} attendu`),
    ok(same(wrongOf(exo), expectedWrong), `mauvais choix : ${wrongOf(exo).join(" | ")}`),
  );
};

const checkBeNeg: Check = (exo) => {
  const m = new RegExp(`^Quelle phrase dit le contraire de « (${SUBJ}) (am|is|are) (${PRED})\\. » \\?$`).exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const subject = subjectByText(m[1]);
  const other = ["am", "is", "are"].filter((verb) => verb !== m[2])[0];
  return all(
    beSubjectOk(subject, m[3], levelOf(exo)),
    ok(m[2] === subject!.be, "le verbe de la phrase donnée"),
    ok(rightOption(exo) === `${m[1]} ${m[2]} not ${m[3]}.`, `${exo.prompt} : ${rightOption(exo)}`),
    ok(wrongOf(exo).includes(`${m[1]} ${m[2]} ${m[3]}.`), "la phrase donnée est un mauvais choix"),
    ok(wrongOf(exo).includes(`${m[1]} ${other} not ${m[3]}.`) || wrongOf(exo).some((option) => option.includes(" not ") && !option.includes(` ${m[2]} not `)), "un mauvais verbe avec not"),
  );
};

const checkBeQuestion: Check = (exo) => {
  const m = new RegExp(`^(Am|Is|Are) (${Q}) (${PRED})\\?$`).exec(sequenceOf(exo).join(" "));
  if (!m) return `question inconnue : ${sequenceOf(exo).join(" ")}`;
  const subject = subjectByQ(m[2]);
  return all(beSubjectOk(subject, m[3], levelOf(exo)), ok(exo.prompt === QUESTION_PROMPT, exo.prompt), ok(m[1] === cap(subject!.be), `${sequenceOf(exo).join(" ")} : ${cap(subject!.be)} attendu`));
};

const checkBeReply: Check = (exo) => {
  const m = new RegExp(`^On te demande « (Am|Is|Are) (${Q}) (${PRED})\\? ». Tu réponds (oui|non)\\. Quelle est la bonne réponse \\?$`).exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const subject = subjectByQ(m[2]);
  const yes = m[4] === "oui";
  const be = ansBe(subject!.ans);
  const wrongBe = be === "is" ? "are" : "is";
  return all(
    beSubjectOk(subject, m[3], levelOf(exo)),
    ok(m[1] === cap(subject!.be), "le verbe de la question"),
    ok(rightOption(exo) === reply(yes, subject!.ans, be), `${exo.prompt} : ${rightOption(exo)}, pas ${reply(yes, subject!.ans, be)}`),
    ok(same(wrongOf(exo), [reply(yes, subject!.ans, wrongBe), reply(!yes, subject!.ans, be)]), `mauvais choix : ${wrongOf(exo).join(" | ")}`),
  );
};

const BE_SORT: [string[], string[]][] = [
  [["He", "She", "It"], ["You", "We", "They"]],
  [["Awa", "Moussa", "Aminata"], ["Awa and Moussa", "Fatou and Ibrahima", "Cheikh and Omar"]],
  [["My brother", "My mother", "The cat"], ["My friends", "My parents", "The girls"]],
];
const checkBeSort: Check = (exo) => {
  const [singular, plural] = BE_SORT[band3(levelOf(exo))];
  const items = itemsOf(exo);
  return all(
    ok(same(zonesOf(exo), ["is", "are"]), zonesOf(exo).join(", ")),
    ok(items.length === (levelOf(exo) <= 2 ? 4 : 5), `${items.length} étiquettes`),
    ...items.map((item) => ok(item.correctZone === (singular.includes(item.text) ? "is" : plural.includes(item.text) ? "are" : "?"), `${item.text} dans « ${item.correctZone} »`)),
    ok(items.some((item) => item.correctZone === "is") && items.some((item) => item.correctZone === "are"), "les deux cases sont servies"),
  );
};

const checkBeWrite: Check = (exo) => {
  const m = new RegExp(`^Écris le verbe être qui manque\\. (${SUBJ}) ___ (${PRED})\\.$`).exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const subject = subjectByText(m[1]);
  return all(beSubjectOk(subject, m[2], levelOf(exo)), ok(acceptedOf(exo).length === 1 && acceptedOf(exo)[0] === subject!.be, `${exo.prompt} : ${acceptedOf(exo)}`));
};

// ===========================================================================
// AVOIR
// ===========================================================================

const NOUNS: Record<string, [string, boolean]> = { brother: ["frère", false], sister: ["sœur", true], pen: ["stylo", false], book: ["livre", false], bag: ["sac", false], ruler: ["règle", true], cat: ["chat", false], dog: ["chien", false] };
const NUMS: Record<string, [number, string]> = { two: [2, "deux"], three: [3, "trois"], four: [4, "quatre"], five: [5, "cinq"], six: [6, "six"], seven: [7, "sept"], ten: [10, "dix"], twelve: [12, "douze"], fifteen: [15, "quinze"] };
const NOUN = Object.keys(NOUNS).join("|");
const NUM = Object.keys(NUMS).join("|");
const OBJ = `(?:a (?:${NOUN})|(?:${NUM}) (?:${NOUN})s)`;

/** Un objet de la phrase : sa traduction française, et la faute d'accord. */
function objectOf(text: string): { fr: string; wrong: string } | null {
  let m = new RegExp(`^a (${NOUN})$`).exec(text);
  if (m) return { fr: `${NOUNS[m[1]][1] ? "une" : "un"} ${NOUNS[m[1]][0]}`, wrong: `a ${m[1]}s` };
  m = new RegExp(`^(${NUM}) (${NOUN})s$`).exec(text);
  if (m) return { fr: `${NUMS[m[1]][1]} ${NOUNS[m[2]][0]}s`, wrong: `${m[1]} ${m[2]}` };
  return null;
}

const hgSubjectOk = (subject: Subj | undefined, level: GameLevel): string | null => (subject === undefined ? "sujet inconnu" : ok(bandOfSubject(subject) === band3(level), `« ${subject.text} » au palier ${level}`));

const checkHgGap: Check = (exo) => {
  const m = new RegExp(`^(${SUBJ}) ___ got (${OBJ})\\.$`).exec(textOf(exo));
  if (!m) return `phrase inconnue : ${textOf(exo)}`;
  const subject = subjectByText(m[1]);
  return all(hgSubjectOk(subject, levelOf(exo)), ok(blankOf(exo).answer === subject!.have, `${textOf(exo)} : ${blankOf(exo).answer}, pas ${subject!.have}`), ok(same(blankOf(exo).options, ["has", "have", "is"]), blankOf(exo).options.join(" | ")));
};

const checkHgPhrase: Check = (exo) => {
  const m = new RegExp(`^(${SUBJ}) (have|has) got (${OBJ})\\.$`).exec(rightOption(exo));
  if (!m) return `phrase inconnue : ${rightOption(exo)}`;
  const subject = subjectByText(m[1]);
  const object = objectOf(m[3])!;
  return all(
    hgSubjectOk(subject, levelOf(exo)),
    ok(m[2] === subject!.have, `${rightOption(exo)} : ${subject!.have} attendu`),
    ok(same(wrongOf(exo), [`${m[1]} ${m[2] === "have" ? "has" : "have"} got ${m[3]}.`, `${m[1]} ${m[2]} got ${object.wrong}.`]), `mauvais choix : ${wrongOf(exo).join(" | ")}`),
  );
};

const checkHgNeg: Check = (exo) => {
  const m = new RegExp(`^Quelle phrase dit le contraire de « (${SUBJ}) (have|has) got (${OBJ})\\. » \\?$`).exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const subject = subjectByText(m[1]);
  return all(
    hgSubjectOk(subject, levelOf(exo)),
    ok(m[2] === subject!.have, "le verbe de la phrase donnée"),
    ok(rightOption(exo) === `${m[1]} ${m[2]} not got ${m[3]}.`, `${exo.prompt} : ${rightOption(exo)}`),
    ok(same(wrongOf(exo), [`${m[1]} ${m[2]} got ${m[3]}.`, `${m[1]} ${m[2] === "have" ? "has" : "have"} not got ${m[3]}.`]), `mauvais choix : ${wrongOf(exo).join(" | ")}`),
  );
};

const checkHgQuestion: Check = (exo) => {
  const m = new RegExp(`^(Have|Has) (${Q}) got (${OBJ})\\?$`).exec(sequenceOf(exo).join(" "));
  if (!m) return `question inconnue : ${sequenceOf(exo).join(" ")}`;
  const subject = subjectByQ(m[2]);
  return all(hgSubjectOk(subject, levelOf(exo)), ok(exo.prompt === QUESTION_PROMPT, exo.prompt), ok(m[1] === cap(subject!.have), `${sequenceOf(exo).join(" ")} : ${cap(subject!.have)} attendu`));
};

const checkHgReply: Check = (exo) => {
  const m = new RegExp(`^On te demande « (Have|Has) (${Q}) got (${OBJ})\\? ». Tu réponds (oui|non)\\. Quelle est la bonne réponse \\?$`).exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const subject = subjectByQ(m[2]);
  const yes = m[4] === "oui";
  const have = ansHave(subject!.ans);
  const wrongHave = have === "has" ? "have" : "has";
  return all(
    hgSubjectOk(subject, levelOf(exo)),
    ok(m[1] === cap(subject!.have), "le verbe de la question"),
    ok(rightOption(exo) === reply(yes, subject!.ans, have), `${exo.prompt} : ${rightOption(exo)}, pas ${reply(yes, subject!.ans, have)}`),
    ok(same(wrongOf(exo), [reply(yes, subject!.ans, wrongHave), reply(!yes, subject!.ans, have)]), `mauvais choix : ${wrongOf(exo).join(" | ")}`),
  );
};

const checkHgLinks: Check = (exo) => {
  const pairs = pairsOf(exo);
  return all(
    ok(pairs.length === 3, "trois paires"),
    ok(exo.prompt === "Relie chaque phrase anglaise à la même phrase en français.", exo.prompt),
    ...pairs.map((pair) => {
      const m = new RegExp(`^(${SUBJ}) (have|has) got (${OBJ})\\.$`).exec(pair.left);
      if (!m) return `phrase inconnue : ${pair.left}`;
      const subject = subjectByText(m[1])!;
      return all(hgSubjectOk(subject, levelOf(exo)), ok(m[2] === subject.have, pair.left), ok(pair.right === `${subject.frHave} ${objectOf(m[3])!.fr}.`, `${pair.left} ~ ${pair.right}`));
    }),
  );
};

const HG_SORT: [string[], string[]][] = [
  [["He", "She", "It"], ["I", "You", "We", "They"]],
  [["Awa", "Moussa", "Aminata"], ["Awa and Moussa", "Fatou and Ibrahima", "Cheikh and Omar"]],
  [["My brother", "My mother", "My cousin"], ["My friends", "My parents", "The girls"]],
];
const checkHgSort: Check = (exo) => {
  const [has, have] = HG_SORT[band3(levelOf(exo))];
  const items = itemsOf(exo);
  return all(
    ok(same(zonesOf(exo), ["has got", "have got"]), zonesOf(exo).join(", ")),
    ok(items.length === (levelOf(exo) <= 2 ? 4 : 5), `${items.length} étiquettes`),
    ...items.map((item) => ok(item.correctZone === (has.includes(item.text) ? "has got" : have.includes(item.text) ? "have got" : "?"), `${item.text} dans « ${item.correctZone} »`)),
    ok(items.some((item) => item.correctZone === "has got") && items.some((item) => item.correctZone === "have got"), "les deux cases sont servies"),
  );
};

const checkHgWrite: Check = (exo) => {
  const m = new RegExp(`^Écris le mot qui manque\\. (${SUBJ}) ___ got (${OBJ})\\.$`).exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const subject = subjectByText(m[1]);
  return all(hgSubjectOk(subject, levelOf(exo)), ok(acceptedOf(exo).length === 1 && acceptedOf(exo)[0] === subject!.have, `${exo.prompt} : ${acceptedOf(exo)}`));
};

// ===========================================================================
// POUVOIR
// ===========================================================================

const VERBS: Record<string, string> = { run: "courir", jump: "sauter", swim: "nager", sing: "chanter", dance: "danser", read: "lire", write: "écrire", draw: "dessiner", cook: "cuisiner", climb: "grimper" };
const VERB = Object.keys(VERBS).join("|");
const INF = Object.values(VERBS).join("|");
const FRSUB = alt(SUBJECTS.map((subject) => subject.frSub));

/** Une phrase française de can, positive ou négative : le sujet et le verbe anglais qu'elle dit, ou rien. */
function parseCanFrench(text: string): { subject: Subj; verb: string; negative: boolean } | null {
  const m = new RegExp(`^(${FRSUB}) (ne )?(sais|sait|savons|savent)( pas)? (${INF})$`).exec(text);
  if (!m) return null;
  const subject = SUBJECTS.find((candidate) => candidate.frSub === m[1] && candidate.frVerb === m[3]);
  const verb = Object.keys(VERBS).find((key) => VERBS[key] === m[5]);
  if (!subject || !verb || !!m[2] !== !!m[4]) return null;
  return { subject, verb, negative: !!m[2] };
}

const canSubjectOk = (subject: Subj | undefined, level: GameLevel): string | null => (subject === undefined ? "sujet inconnu" : ok(bandOfSubject(subject) === band3(level), `« ${subject.text} » au palier ${level}`));
const canErrors = (subject: string, verb: string) => [`${subject} cans ${verb}.`, `${subject} can ${verb}s.`, `${subject} can to ${verb}.`];

const checkCanFrench: Check = (exo) => {
  const m = /^Comment dit-on « (.+) » en anglais \?$/.exec(exo.prompt);
  const parsed = m ? parseCanFrench(m[1]) : null;
  if (!parsed || parsed.negative) return `énoncé inconnu : ${exo.prompt}`;
  const { subject, verb } = parsed;
  const errors = canErrors(subject.text, verb);
  return all(canSubjectOk(subject, levelOf(exo)), ok(rightOption(exo) === `${subject.text} can ${verb}.`, `${exo.prompt} : ${rightOption(exo)}`), ok(wrongOf(exo).length === 2 && wrongOf(exo).every((option) => errors.includes(option)), `mauvais choix : ${wrongOf(exo).join(" | ")}`));
};

const checkCanPhrase: Check = (exo) => {
  const m = new RegExp(`^(${SUBJ}) can (${VERB})\\.$`).exec(rightOption(exo));
  if (!m) return `phrase inconnue : ${rightOption(exo)}`;
  const errors = canErrors(m[1], m[2]);
  return all(canSubjectOk(subjectByText(m[1]), levelOf(exo)), ok(exo.prompt === "Quelle phrase est juste ?", exo.prompt), ok(wrongOf(exo).length === 2 && wrongOf(exo).every((option) => errors.includes(option)), `mauvais choix : ${wrongOf(exo).join(" | ")}`));
};

const checkCanNeg: Check = (exo) => {
  const m = /^Comment dit-on « (.+) » en anglais \?$/.exec(exo.prompt);
  const parsed = m ? parseCanFrench(m[1]) : null;
  if (!parsed || !parsed.negative) return `énoncé inconnu : ${exo.prompt}`;
  const { subject, verb } = parsed;
  return all(
    canSubjectOk(subject, levelOf(exo)),
    ok(rightOption(exo) === `${subject.text} cannot ${verb}.`, `${exo.prompt} : ${rightOption(exo)}`),
    ok(same(wrongOf(exo), [`${subject.text} not can ${verb}.`, `${subject.text} cannot ${verb}s.`]), `mauvais choix : ${wrongOf(exo).join(" | ")}`),
  );
};

const checkCanGap: Check = (exo) => {
  const text = textOf(exo);
  let m = new RegExp(`^(${SUBJ}) can ___\\.$`).exec(text);
  if (m) {
    const french = /^(.+)\. Complète la phrase en anglais\.$/.exec(exo.prompt);
    const parsed = french ? parseCanFrench(french[1]) : null;
    if (!parsed || parsed.negative) return `énoncé inconnu : ${exo.prompt}`;
    return all(
      canSubjectOk(parsed.subject, levelOf(exo)),
      ok(parsed.subject.text === m[1], "le sujet du français et de l'anglais"),
      ok(blankOf(exo).answer === parsed.verb, `${exo.prompt} : ${blankOf(exo).answer}, pas ${parsed.verb}`),
      ok(blankOf(exo).options.every((option) => option in VERBS), blankOf(exo).options.join(" | ")),
    );
  }
  m = new RegExp(`^(${SUBJ}) ___ (${VERB})\\.$`).exec(text);
  if (!m) return `phrase inconnue : ${text}`;
  return all(canSubjectOk(subjectByText(m[1]), levelOf(exo)), ok(exo.prompt === "Complète la phrase.", exo.prompt), ok(blankOf(exo).answer === "can", `${text} : ${blankOf(exo).answer}`), ok(same(blankOf(exo).options, ["can", "cans", "can to"]), blankOf(exo).options.join(" | ")));
};

const checkCanQuestion: Check = (exo) => {
  const m = new RegExp(`^Can (${Q}) (${VERB})\\?$`).exec(sequenceOf(exo).join(" "));
  if (!m) return `question inconnue : ${sequenceOf(exo).join(" ")}`;
  return all(canSubjectOk(subjectByQ(m[1]), levelOf(exo)), ok(exo.prompt === QUESTION_PROMPT, exo.prompt));
};

const checkCanReply: Check = (exo) => {
  const m = new RegExp(`^On te demande « Can (${Q}) (${VERB})\\? ». Tu réponds (oui|non)\\. Quelle est la bonne réponse \\?$`).exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const subject = subjectByQ(m[1]);
  const yes = m[3] === "oui";
  const right = yes ? `Yes, ${subject!.ans} can.` : `No, ${subject!.ans} cannot.`;
  const wrong = yes ? [`Yes, ${subject!.ans} cans.`, `No, ${subject!.ans} cannot.`] : [`No, ${subject!.ans} not can.`, `Yes, ${subject!.ans} can.`];
  return all(canSubjectOk(subject, levelOf(exo)), ok(rightOption(exo) === right, `${exo.prompt} : ${rightOption(exo)}, pas ${right}`), ok(same(wrongOf(exo), wrong), `mauvais choix : ${wrongOf(exo).join(" | ")}`));
};

const checkCanLinks: Check = (exo) =>
  all(
    ok(pairsOf(exo).length === 3, "trois paires"),
    ok(exo.prompt === "Relie chaque verbe anglais à son sens en français.", exo.prompt),
    ...pairsOf(exo).map((pair) => ok(VERBS[pair.left] === pair.right, `${pair.left} ~ ${pair.right}`)),
  );

const checkCanSort: Check = (exo) => {
  const items = itemsOf(exo);
  return all(
    ok(same(zonesOf(exo), ["can", "cannot"]), zonesOf(exo).join(", ")),
    ok(items.length === (levelOf(exo) <= 2 ? 4 : 5), `${items.length} étiquettes`),
    ...items.map((item) => {
      const m = new RegExp(`^(${SUBJ}) (can|cannot) (${VERB})\\.$`).exec(item.text);
      if (!m) return `phrase inconnue : ${item.text}`;
      return all(canSubjectOk(subjectByText(m[1]), levelOf(exo)), ok(item.correctZone === m[2], `${item.text} dans « ${item.correctZone} »`));
    }),
    ok(items.some((item) => item.correctZone === "can") && items.some((item) => item.correctZone === "cannot"), "les deux cases sont servies"),
  );
};

const checkCanWrite: Check = (exo) => {
  const m = new RegExp(`^(.+)\\. Écris le verbe anglais qui manque dans (${SUBJ}) can ___\\.$`).exec(exo.prompt);
  const parsed = m ? parseCanFrench(m[1]) : null;
  if (!m || !parsed || parsed.negative) return `énoncé inconnu : ${exo.prompt}`;
  return all(canSubjectOk(parsed.subject, levelOf(exo)), ok(parsed.subject.text === m[2], "le sujet du français et de l'anglais"), ok(acceptedOf(exo).length === 1 && acceptedOf(exo)[0] === parsed.verb, `${exo.prompt} : ${acceptedOf(exo)}`));
};

// ===========================================================================
// LA MAISON
// ===========================================================================

const PREPS = ["in", "on", "under", "behind", "next to", "in front of"];
const PREP_OF_FR: Record<string, string> = { dans: "in", sur: "on", sous: "under", derrière: "behind", devant: "in front of" };
const PLACE_OF_FR: Record<string, string> = {
  "la cuisine": "kitchen",
  "la chambre": "bedroom",
  "la salle de bain": "bathroom",
  "le salon": "living room",
  "la maison": "house",
  "le lit": "bed",
  "la table": "table",
  "la chaise": "chair",
  "la télé": "TV",
};
const PLACE_OF_DE: Record<string, string> = {
  "de la cuisine": "kitchen",
  "de la chambre": "bedroom",
  "de la salle de bain": "bathroom",
  "du salon": "living room",
  "de la maison": "house",
  "du lit": "bed",
  "de la table": "table",
  "de la chaise": "chair",
  "de la télé": "TV",
};
const THING_OF_FR: Record<string, string> = { "Le chat": "cat", "Le sac": "bag" };
const PREPS_BY_BAND: string[][] = [["in", "on", "under"], ["behind", "in", "under", "on"], ["next to", "behind", "under", "in", "on"], ["in front of", "in", "behind", "on", "under"]];
const FR_SCENE = new RegExp(`^(${alt(Object.keys(THING_OF_FR))}) est (?:(${alt(Object.keys(PREP_OF_FR))}) (${alt(Object.keys(PLACE_OF_FR))})|à côté (${alt(Object.keys(PLACE_OF_DE))}))\\.$`);

/** Une phrase française de lieu : la chose, la préposition anglaise, le lieu anglais. */
function parseScene(text: string): { thing: string; prep: string; place: string } | null {
  const m = FR_SCENE.exec(text);
  if (!m) return null;
  return { thing: THING_OF_FR[m[1]], prep: m[2] ? PREP_OF_FR[m[2]] : "next to", place: m[2] ? PLACE_OF_FR[m[3]] : PLACE_OF_DE[m[4]] };
}
const band4 = (level: GameLevel) => level - 1;
const sceneEn = (scene: { thing: string; prep: string; place: string }, prep = scene.prep) => `The ${scene.thing} is ${prep} the ${scene.place}.`;
const sceneBandOk = (scene: { prep: string } | null, level: GameLevel): string | null => (scene === null ? "phrase française inconnue" : ok(PREPS_BY_BAND[band4(level)].includes(scene.prep), `« ${scene.prep} » au palier ${level}`));

const checkHomePhrase: Check = (exo) => {
  const m = /^(.+\.) Quelle phrase dit la même chose en anglais \?$/.exec(exo.prompt);
  const scene = m ? parseScene(m[1]) : null;
  if (!scene) return `énoncé inconnu : ${exo.prompt}`;
  return all(
    sceneBandOk(scene, levelOf(exo)),
    ok(rightOption(exo) === sceneEn(scene), `${exo.prompt} : ${rightOption(exo)}, pas ${sceneEn(scene)}`),
    ok(wrongOf(exo).length === 2 && wrongOf(exo).every((option) => PREPS.some((prep) => prep !== scene.prep && option === sceneEn(scene, prep))), `mauvais choix : ${wrongOf(exo).join(" | ")}`),
  );
};

const checkHomeWhere: Check = (exo) => {
  const m = /^(.+\.) On te demande « Where is the (cat|bag)\? ». Que réponds-tu \?$/.exec(exo.prompt);
  const scene = m ? parseScene(m[1]) : null;
  if (!scene || !m) return `énoncé inconnu : ${exo.prompt}`;
  const reply = (prep: string) => `It is ${prep} the ${scene.place}.`;
  return all(
    sceneBandOk(scene, levelOf(exo)),
    ok(m[2] === scene.thing, "la chose de la question et de la phrase"),
    ok(rightOption(exo) === reply(scene.prep), `${exo.prompt} : ${rightOption(exo)}`),
    ok(wrongOf(exo).length === 2 && wrongOf(exo).every((option) => PREPS.some((prep) => prep !== scene.prep && option === reply(prep))), `mauvais choix : ${wrongOf(exo).join(" | ")}`),
  );
};

const checkHomeGap: Check = (exo) => {
  const m = /^(.+\.) Complète la phrase en anglais\.$/.exec(exo.prompt);
  const scene = m ? parseScene(m[1]) : null;
  if (!scene) return `énoncé inconnu : ${exo.prompt}`;
  return all(
    sceneBandOk(scene, levelOf(exo)),
    ok(textOf(exo) === `The ${scene.thing} is ___ the ${scene.place}.`, textOf(exo)),
    ok(blankOf(exo).answer === scene.prep, `${exo.prompt} : ${blankOf(exo).answer}, pas ${scene.prep}`),
    ok(blankOf(exo).options.every((option) => PREPS.includes(option)), blankOf(exo).options.join(" | ")),
  );
};

const checkHomeOrder: Check = (exo) => {
  const m = /^Remets les mots dans l'ordre pour dire « (.+\.) ».$/.exec(exo.prompt);
  const scene = m ? parseScene(m[1]) : null;
  if (!scene) return `énoncé inconnu : ${exo.prompt}`;
  return all(sceneBandOk(scene, levelOf(exo)), ok(sequenceOf(exo).join(" ") === sceneEn(scene), `${exo.prompt} : ${sequenceOf(exo).join(" ")}`));
};

const HOME_WORDS: [string, string, string][] = [
  ["house", "maison", "la maison"],
  ["kitchen", "cuisine", "la cuisine"],
  ["bedroom", "chambre", "la chambre"],
  ["bathroom", "salle de bain", "la salle de bain"],
  ["living room", "salon", "le salon"],
  ["bed", "lit", "le lit"],
  ["table", "table", "la table"],
  ["chair", "chaise", "la chaise"],
  ["TV", "télé", "la télé"],
  ["cat", "chat", "le chat"],
  ["bag", "sac", "le sac"],
];
/** Les mots de chaque palier : onze mots coupés en quatre quarts (2, 3, 3, 3). */
const HOME_WORD_BANDS = [["house", "kitchen"], ["bedroom", "bathroom", "living room"], ["bed", "table", "chair"], ["TV", "cat", "bag"]];
const checkHomeWord: Check = (exo) => {
  const m = /^Comment dit-on « (.+) » en anglais \?$/.exec(exo.prompt);
  const word = HOME_WORDS.find((entry) => entry[2] === m?.[1]);
  if (!word) return `énoncé inconnu : ${exo.prompt}`;
  return all(ok(rightOption(exo) === word[0], `${exo.prompt} : ${rightOption(exo)}`), ok(HOME_WORD_BANDS[band4(levelOf(exo))].includes(word[0]), `« ${word[0]} » au palier ${levelOf(exo)}`), ok(optionsOf(exo).every((option) => HOME_WORDS.some((entry) => entry[0] === option)), optionsOf(exo).join(" | ")));
};

const checkHomeLinks: Check = (exo) =>
  all(
    ok(pairsOf(exo).length === 3, "trois paires"),
    ok(exo.prompt === "Relie chaque mot anglais à son sens en français.", exo.prompt),
    ...pairsOf(exo).map((pair) => ok(pair.left !== "table" && HOME_WORDS.some((entry) => entry[0] === pair.left && entry[1] === pair.right), `${pair.left} ~ ${pair.right}`)),
  );

const ROOMS = ["kitchen", "bedroom", "bathroom", "living room"];
const OBJECTS = ["bed", "table", "chair", "TV", "bag"];
const checkHomeSort: Check = (exo) => {
  const items = itemsOf(exo);
  return all(
    ok(same(zonesOf(exo), ["Pièce", "Objet"]), zonesOf(exo).join(", ")),
    ok(items.length === (levelOf(exo) <= 2 ? 4 : 5), `${items.length} étiquettes`),
    ...items.map((item) => ok(item.correctZone === (ROOMS.includes(item.text) ? "Pièce" : OBJECTS.includes(item.text) ? "Objet" : "?"), `${item.text} dans « ${item.correctZone} »`)),
    ok(items.some((item) => item.correctZone === "Pièce") && items.some((item) => item.correctZone === "Objet"), "les deux cases sont servies"),
  );
};

const checkHomeWrite: Check = (exo) => {
  const m = /^(.+\.) Écris le petit mot anglais qui manque dans The (cat|bag) is ___ the (.+)\.$/.exec(exo.prompt);
  const scene = m ? parseScene(m[1]) : null;
  if (!scene || !m) return `énoncé inconnu : ${exo.prompt}`;
  return all(
    sceneBandOk(scene, levelOf(exo)),
    ok(m[2] === scene.thing && m[3] === scene.place, "la chose et le lieu du français et de l'anglais"),
    ok(!scene.prep.includes(" "), "une préposition d'un seul mot"),
    ok(acceptedOf(exo).length === 1 && acceptedOf(exo)[0] === scene.prep, `${exo.prompt} : ${acceptedOf(exo)}`),
  );
};

// ===========================================================================
// LES MOIS
// ===========================================================================

const MONTHS: [string, string][] = [
  ["January", "janvier"],
  ["February", "février"],
  ["March", "mars"],
  ["April", "avril"],
  ["May", "mai"],
  ["June", "juin"],
  ["July", "juillet"],
  ["August", "août"],
  ["September", "septembre"],
  ["October", "octobre"],
  ["November", "novembre"],
  ["December", "décembre"],
];
const EN_MONTHS = MONTHS.map((month) => month[0]);
const monthIndex = (english: string) => EN_MONTHS.indexOf(english);
const frenchIndex = (french: string) => MONTHS.findIndex((month) => month[1] === french);
const band2 = (level: GameLevel) => (level <= 2 ? 0 : 1);
const inSemester = (index: number, level: GameLevel) => Math.floor(index / 6) === band2(level);
const MONTH = alt(EN_MONTHS);
const MONTH_FR = alt(MONTHS.map((month) => month[1]));

const checkMonthsWord: Check = (exo) => {
  const m = new RegExp(`^Comment dit-on « (${MONTH_FR}) » en anglais \\?$`).exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const index = frenchIndex(m[1]);
  return all(ok(rightOption(exo) === EN_MONTHS[index], `${exo.prompt} : ${rightOption(exo)}`), ok(inSemester(index, levelOf(exo)), `« ${m[1]} » au palier ${levelOf(exo)}`), ok(optionsOf(exo).every((option) => EN_MONTHS.includes(option)), optionsOf(exo).join(" | ")));
};

const checkMonthsNeighbour: Check = (exo) => {
  const m = new RegExp(`^Quel mois vient (après|avant) (${MONTH}) \\?$`).exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const index = monthIndex(m[2]);
  const after = m[1] === "après";
  const target = after ? index + 1 : index - 1;
  return all(
    ok(inSemester(index, levelOf(exo)), `« ${m[2]} » au palier ${levelOf(exo)}`),
    ok(target >= 0 && target <= 11, "un mois qui existe dans la même année"),
    ok(rightOption(exo) === EN_MONTHS[target], `${exo.prompt} : ${rightOption(exo)}, pas ${EN_MONTHS[target]}`),
    ok(wrongOf(exo).every((option) => EN_MONTHS.includes(option) && option !== m[2]), `mauvais choix : ${wrongOf(exo).join(" | ")}`),
  );
};

const checkMonthsBirthday: Check = (exo) => {
  const m = new RegExp(`^Mon anniversaire est en (${MONTH_FR})\\. Que dis-tu en anglais \\?$`).exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const index = frenchIndex(m[1]);
  const en = EN_MONTHS[index];
  return all(ok(inSemester(index, levelOf(exo)), `« ${m[1]} » au palier ${levelOf(exo)}`), ok(rightOption(exo) === `My birthday is in ${en}.`, `${exo.prompt} : ${rightOption(exo)}`), ok(same(wrongOf(exo), [`My birthday is on ${en}.`, `My birthday is at ${en}.`]), `mauvais choix : ${wrongOf(exo).join(" | ")}`));
};

const checkMonthsGap: Check = (exo) => {
  const text = textOf(exo);
  let m = new RegExp(`^My birthday is ___ (${MONTH})\\.$`).exec(text);
  if (m) {
    const french = new RegExp(`^Mon anniversaire est en (${MONTH_FR})\\. Complète la phrase en anglais\\.$`).exec(exo.prompt);
    return all(ok(!!french && frenchIndex(french[1]) === monthIndex(m[1]), exo.prompt), ok(inSemester(monthIndex(m[1]), levelOf(exo)), `« ${m[1]} » au palier ${levelOf(exo)}`), ok(blankOf(exo).answer === "in" && same(blankOf(exo).options, ["in", "on", "at"]), `${text} : ${blankOf(exo).answer}`));
  }
  m = new RegExp(`^(?:(${MONTH}), )?(?:___|(${MONTH})), (?:(${MONTH})|___)(?:, (${MONTH}))?$`).exec(text);
  const parts = text.split(", ");
  if (parts.length !== 3 || !parts.includes("___")) return `phrase inconnue : ${text}`;
  const blank = parts.indexOf("___");
  const known = parts.filter((part) => part !== "___").map(monthIndex);
  let expected: number;
  if (blank === 0) expected = known[0] - 1;
  else if (blank === 1) expected = known[0] + 1;
  else expected = known[1] + 1;
  const consecutive = blank === 1 ? known[1] === known[0] + 2 : known[1] === known[0] + 1;
  return all(
    ok(exo.prompt === "Quel mois manque ?", exo.prompt),
    ok(consecutive, `des mois qui ne se suivent pas : ${text}`),
    ok(blankOf(exo).answer === EN_MONTHS[expected], `${text} : ${blankOf(exo).answer}, pas ${EN_MONTHS[expected]}`),
    ok(inSemester(expected, levelOf(exo)), `« ${EN_MONTHS[expected]} » au palier ${levelOf(exo)}`),
    ok(blankOf(exo).options.every((option) => EN_MONTHS.includes(option) && !parts.includes(option) || option === blankOf(exo).answer), blankOf(exo).options.join(" | ")),
  );
};

const checkMonthsOrder: Check = (exo) => {
  const indexes = sequenceOf(exo).map(monthIndex);
  const start = indexes[0];
  const allowed = band2(levelOf(exo)) === 0 ? [0, 1, 2, 3] : [5, 6, 7, 8];
  return all(
    ok(exo.prompt === "Remets ces mois dans l'ordre.", exo.prompt),
    ok(indexes.length === 4 && indexes.every((index, i) => index === start + i), `des mois qui ne se suivent pas : ${sequenceOf(exo).join(" ")}`),
    ok(allowed.includes(start), `départ ${sequenceOf(exo)[0]} au palier ${levelOf(exo)}`),
  );
};

const checkMonthsLinks: Check = (exo) =>
  all(
    ok(pairsOf(exo).length === 3, "trois paires"),
    ok(exo.prompt === "Relie chaque mois anglais à son nom en français.", exo.prompt),
    ...pairsOf(exo).map((pair) => ok(MONTHS.some((month) => month[0] === pair.left && month[1] === pair.right), `${pair.left} ~ ${pair.right}`)),
  );

const D31 = ["January", "March", "May", "July", "August", "October", "December"];
const D30 = ["April", "June", "September", "November"];
const checkMonthsSort: Check = (exo) => {
  const items = itemsOf(exo);
  return all(
    ok(same(zonesOf(exo), ["31 jours", "30 jours"]), zonesOf(exo).join(", ")),
    ok(items.length === (levelOf(exo) <= 2 ? 4 : 5), `${items.length} étiquettes`),
    ...items.map((item) => ok(item.correctZone === (D31.includes(item.text) ? "31 jours" : D30.includes(item.text) ? "30 jours" : "?"), `${item.text} dans « ${item.correctZone} »`)),
    ok(!items.some((item) => item.text === "February"), "février n'est jamais classé"),
    ok(items.some((item) => item.correctZone === "31 jours") && items.some((item) => item.correctZone === "30 jours"), "les deux cases sont servies"),
  );
};

const checkMonthsWrite: Check = (exo) => {
  const m = new RegExp(`^Écris en anglais le mois qui vient (après|avant) (${MONTH})\\.$`).exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const index = monthIndex(m[2]);
  const target = m[1] === "après" ? index + 1 : index - 1;
  return all(ok(inSemester(index, levelOf(exo)), `« ${m[2]} » au palier ${levelOf(exo)}`), ok(target >= 0 && target <= 11, "un mois dans la même année"), ok(acceptedOf(exo).length === 1 && acceptedOf(exo)[0] === EN_MONTHS[target], `${exo.prompt} : ${acceptedOf(exo)}`));
};

// ===========================================================================
// LE TEMPS QU'IL FAIT
// ===========================================================================

const WEATHERS: [string, string, string][] = [
  ["sunny", "ensoleillé", "Il y a du soleil."],
  ["rainy", "pluvieux", "Il pleut."],
  ["hot", "chaud", "Il fait chaud."],
  ["windy", "venteux", "Il y a du vent."],
  ["cloudy", "nuageux", "Il y a des nuages."],
  ["cold", "froid", "Il fait froid."],
];
const WEATHER_EN = WEATHERS.map((weather) => weather[0]);
const weatherBandOk = (word: string, level: GameLevel) => Math.floor(WEATHER_EN.indexOf(word) / 3) === band2(level);
const todayFr = (phrase: string) => `${phrase.slice(0, -1)} aujourd'hui.`;
const WEATHER_PHRASES = [...WEATHERS.map((weather) => weather[2]), ...WEATHERS.map((weather) => todayFr(weather[2]))];
const weatherOfPhrase = (phrase: string): { weather: [string, string, string]; today: boolean } | null => {
  const plain = WEATHERS.find((weather) => weather[2] === phrase);
  if (plain) return { weather: plain, today: false };
  const today = WEATHERS.find((weather) => todayFr(weather[2]) === phrase);
  return today ? { weather: today, today: true } : null;
};
const FR_PHRASE = alt(WEATHER_PHRASES);

const checkWeatherWord: Check = (exo) => {
  const m = /^Comment dit-on « (.+) » en anglais \?$/.exec(exo.prompt);
  const weather = WEATHERS.find((entry) => entry[1] === m?.[1]);
  if (!weather) return `énoncé inconnu : ${exo.prompt}`;
  return all(ok(rightOption(exo) === weather[0], `${exo.prompt} : ${rightOption(exo)}`), ok(weatherBandOk(weather[0], levelOf(exo)), `« ${weather[0]} » au palier ${levelOf(exo)}`), ok(optionsOf(exo).every((option) => WEATHER_EN.includes(option)), optionsOf(exo).join(" | ")));
};

const checkWeatherPhrase: Check = (exo) => {
  const m = new RegExp(`^(${FR_PHRASE}) Quelle phrase dit la même chose en anglais \\?$`).exec(exo.prompt);
  const found = m ? weatherOfPhrase(m[1]) : null;
  if (!found) return `énoncé inconnu : ${exo.prompt}`;
  const sentence = (word: string) => `It is ${word}${found.today ? " today" : ""}.`;
  return all(
    ok(weatherBandOk(found.weather[0], levelOf(exo)), `« ${found.weather[0]} » au palier ${levelOf(exo)}`),
    ok(rightOption(exo) === sentence(found.weather[0]), `${exo.prompt} : ${rightOption(exo)}`),
    ok(wrongOf(exo).length === 2 && wrongOf(exo).every((option) => WEATHER_EN.some((word) => word !== found.weather[0] && option === sentence(word))), `mauvais choix : ${wrongOf(exo).join(" | ")}`),
  );
};

const checkWeatherReply: Check = (exo) => {
  const m = new RegExp(`^(${alt(WEATHERS.map((weather) => weather[2]))}) On te demande « What is the weather like\\? ». Que réponds-tu \\?$`).exec(exo.prompt);
  const found = m ? weatherOfPhrase(m[1]) : null;
  if (!found) return `énoncé inconnu : ${exo.prompt}`;
  return all(
    ok(weatherBandOk(found.weather[0], levelOf(exo)), `« ${found.weather[0]} » au palier ${levelOf(exo)}`),
    ok(rightOption(exo) === `It is ${found.weather[0]}.`, `${exo.prompt} : ${rightOption(exo)}`),
    ok(wrongOf(exo).length === 2 && wrongOf(exo).every((option) => WEATHER_EN.some((word) => word !== found.weather[0] && option === `It is ${word}.`)), `mauvais choix : ${wrongOf(exo).join(" | ")}`),
  );
};

const checkWeatherGap: Check = (exo) => {
  const m = new RegExp(`^(${FR_PHRASE}) Complète la phrase en anglais\\.$`).exec(exo.prompt);
  const found = m ? weatherOfPhrase(m[1]) : null;
  if (!found) return `énoncé inconnu : ${exo.prompt}`;
  return all(
    ok(weatherBandOk(found.weather[0], levelOf(exo)), `« ${found.weather[0]} » au palier ${levelOf(exo)}`),
    ok(textOf(exo) === `It is ___${found.today ? " today" : ""}.`, textOf(exo)),
    ok(blankOf(exo).answer === found.weather[0], `${exo.prompt} : ${blankOf(exo).answer}`),
    ok(blankOf(exo).options.every((option) => WEATHER_EN.includes(option)), blankOf(exo).options.join(" | ")),
  );
};

const checkWeatherOrder: Check = (exo) => {
  const m = /^Remets les mots dans l'ordre pour dire « (.+) ».$/.exec(exo.prompt);
  const weather = WEATHERS.find((entry) => entry[2] === m?.[1]);
  if (!weather) return `énoncé inconnu : ${exo.prompt}`;
  return all(ok(weatherBandOk(weather[0], levelOf(exo)), `« ${weather[0]} » au palier ${levelOf(exo)}`), ok(sequenceOf(exo).join(" ") === `It is ${weather[0]}.`, `${exo.prompt} : ${sequenceOf(exo).join(" ")}`));
};

const checkWeatherLinks: Check = (exo) =>
  all(
    ok(pairsOf(exo).length === 3, "trois paires"),
    ok(exo.prompt === "Relie chaque mot anglais à son sens en français.", exo.prompt),
    ...pairsOf(exo).map((pair) => ok(WEATHERS.some((weather) => weather[0] === pair.left && weather[1] === pair.right), `${pair.left} ~ ${pair.right}`)),
  );

const RAINY = ["July", "August", "September"];
const DRY = ["December", "January", "February", "March", "April"];
const SEASON_ROWS = [
  ["July", true], ["January", false], ["August", true], ["February", false],
  ["September", true], ["December", false], ["March", false], ["April", false],
] as const;

const checkWeatherSeason: Check = (exo) => {
  const m = new RegExp(`^En (${MONTH_FR}), au Sénégal, c'est la (saison des pluies|saison sèche)\\. Que dis-tu en anglais \\?$`).exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const month = EN_MONTHS[frenchIndex(m[1])];
  const rainy = m[2] === "saison des pluies";
  const name = rainy ? "rainy" : "dry";
  const index = SEASON_ROWS.findIndex(([row]) => row === month);
  return all(
    ok(rainy ? RAINY.includes(month) : DRY.includes(month), `${month} n'est pas un mois de la ${m[2]}`),
    ok(index >= 0 && (index < 4 ? band2(levelOf(exo)) === 0 : band2(levelOf(exo)) === 1), `« ${month} » au palier ${levelOf(exo)}`),
    ok(rightOption(exo) === `It is the ${name} season in ${month}.`, `${exo.prompt} : ${rightOption(exo)}`),
    ok(wrongOf(exo).length === 2 && wrongOf(exo).includes(`It is the ${rainy ? "dry" : "rainy"} season in ${month}.`), `mauvais choix : ${wrongOf(exo).join(" | ")}`),
    ok(wrongOf(exo).every((option) => option !== rightOption(exo)) && wrongOf(exo).some((option) => new RegExp(`^It is the ${name} season in (?!${month})`).test(option)), "un mois de l'autre saison pour la même saison"),
  );
};

const checkWeatherSort: Check = (exo) => {
  const items = itemsOf(exo);
  return all(
    ok(same(zonesOf(exo), ["Saison sèche", "Saison des pluies"]), zonesOf(exo).join(", ")),
    ok(items.length === (levelOf(exo) <= 2 ? 4 : 5), `${items.length} étiquettes`),
    ...items.map((item) => ok(item.correctZone === (DRY.includes(item.text) ? "Saison sèche" : RAINY.includes(item.text) ? "Saison des pluies" : "?"), `${item.text} dans « ${item.correctZone} »`)),
    ok(items.some((item) => item.correctZone === "Saison sèche") && items.some((item) => item.correctZone === "Saison des pluies"), "les deux cases sont servies"),
    ok(!items.some((item) => ["May", "June", "October", "November"].includes(item.text)), "les mois de passage ne sont jamais posés"),
  );
};

const checkWeatherWrite: Check = (exo) => {
  const m = new RegExp(`^(${alt(WEATHERS.map((weather) => weather[2]))}) Écris le mot anglais qui manque dans It is ___\\.$`).exec(exo.prompt);
  const found = m ? weatherOfPhrase(m[1]) : null;
  if (!found) return `énoncé inconnu : ${exo.prompt}`;
  return all(ok(weatherBandOk(found.weather[0], levelOf(exo)), `« ${found.weather[0]} » au palier ${levelOf(exo)}`), ok(acceptedOf(exo).length === 1 && acceptedOf(exo)[0] === found.weather[0], `${exo.prompt} : ${acceptedOf(exo)}`));
};

// ===========================================================================
// L'HEURE
// ===========================================================================

const NUMBER_WORDS = ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
const NW = NUMBER_WORDS.join("|");
const hourBandOk = (hour: number, level: GameLevel) => Math.floor((hour - 1) / 4) === band3(level);
const clockSentence = (hour: number, half: boolean) => (half ? `It is half past ${NUMBER_WORDS[hour - 1]}.` : `It is ${NUMBER_WORDS[hour - 1]} o'clock.`);
const clockDigits = (hour: number, half: boolean) => `${hour}:${half ? "30" : "00"}`;
const nextHour = (hour: number) => (hour % 12) + 1;
const frenchHour = /^Il est (\d+) h(?: (30))?\./;

const checkClockPhrase: Check = (exo) => {
  const m = /^Il est (\d+) h(?: (30))?\. Quelle phrase dit l'heure \?$/.exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const [hour, half] = [Number(m[1]), m[2] === "30"];
  return all(
    ok(hour >= 1 && hour <= 12 && hourBandOk(hour, levelOf(exo)), `${hour} h au palier ${levelOf(exo)}`),
    ok(rightOption(exo) === clockSentence(hour, half), `${exo.prompt} : ${rightOption(exo)}`),
    ok(same(wrongOf(exo), [clockSentence(hour, !half), clockSentence(nextHour(hour), half)]), `mauvais choix : ${wrongOf(exo).join(" | ")}`),
  );
};

const checkClockDigits: Check = (exo) => {
  const m = new RegExp(`^Quelle heure dit la phrase « It is (?:(${NW}) o'clock|half past (${NW}))\\. » \\?$`).exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const half = m[2] !== undefined;
  const hour = NUMBER_WORDS.indexOf(m[1] ?? m[2]) + 1;
  return all(
    ok(hourBandOk(hour, levelOf(exo)), `${hour} h au palier ${levelOf(exo)}`),
    ok(rightOption(exo) === clockDigits(hour, half), `${exo.prompt} : ${rightOption(exo)}`),
    ok(same(wrongOf(exo), [clockDigits(hour, !half), clockDigits(nextHour(hour), half)]), `mauvais choix : ${wrongOf(exo).join(" | ")}`),
  );
};

const checkClockGap: Check = (exo) => {
  const m = /^Il est (\d+) h(?: (30))?\. Complète la phrase en anglais\.$/.exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const [hour, half] = [Number(m[1]), m[2] === "30"];
  return all(
    ok(hourBandOk(hour, levelOf(exo)), `${hour} h au palier ${levelOf(exo)}`),
    ok(textOf(exo) === (half ? "It is half past ___." : "It is ___ o'clock."), textOf(exo)),
    ok(blankOf(exo).answer === NUMBER_WORDS[hour - 1], `${exo.prompt} : ${blankOf(exo).answer}`),
    ok(blankOf(exo).options.every((option) => NUMBER_WORDS.includes(option)), blankOf(exo).options.join(" | ")),
  );
};

const CLOCK_QUESTION_PROMPTS = ["Quelle question demande l'heure ?", "Pour savoir quelle heure il est, que demandes-tu ?", "Tu veux connaître l'heure. Que demandes-tu en anglais ?"];
const checkClockQuestion: Check = (exo) =>
  all(
    ok(exo.prompt === CLOCK_QUESTION_PROMPTS[band3(levelOf(exo))], `énoncé du palier : ${exo.prompt}`),
    ok(rightOption(exo) === "What time is it?", rightOption(exo)),
    ok(wrongOf(exo).length === 2 && wrongOf(exo).every((option) => ["How old are you?", "What is your name?", "Where are you from?", "How are you?"].includes(option)), `mauvais choix : ${wrongOf(exo).join(" | ")}`),
  );

const parseClockSentence = (text: string): { hour: number; half: boolean } | null => {
  const m = new RegExp(`^It is (?:(${NW}) o'clock|half past (${NW}))\\.$`).exec(text);
  return m ? { hour: NUMBER_WORDS.indexOf(m[1] ?? m[2]) + 1, half: m[2] !== undefined } : null;
};

const checkClockLinks: Check = (exo) =>
  all(
    ok(pairsOf(exo).length === 3, "trois paires"),
    ok(exo.prompt === "Relie chaque heure à la phrase qui la dit.", exo.prompt),
    ...pairsOf(exo).map((pair) => {
      const time = parseClockSentence(pair.right);
      return time === null ? `phrase inconnue : ${pair.right}` : all(ok(pair.left === clockDigits(time.hour, time.half), `${pair.left} ~ ${pair.right}`), ok(hourBandOk(time.hour, levelOf(exo)), `${time.hour} h au palier ${levelOf(exo)}`));
    }),
  );

const CLOCK_STARTS: [number, boolean][][] = [[[1, false], [2, false], [3, false]], [[5, false], [6, false], [7, false]], [[8, true], [9, true], [10, true]]] as unknown as [number, boolean][][];
const checkClockOrder: Check = (exo) => {
  const times = sequenceOf(exo).map(parseClockSentence);
  if (times.some((time) => time === null)) return `phrase inconnue : ${sequenceOf(exo).join(" | ")}`;
  const steps = times as { hour: number; half: boolean }[];
  const minutes = steps.map((time) => time.hour * 60 + (time.half ? 30 : 0));
  const start = steps[0];
  return all(
    ok(exo.prompt === "Range ces heures de la plus petite à la plus grande.", exo.prompt),
    ok(steps.length === 4 && minutes.every((value, i) => value === minutes[0] + 30 * i), `des heures qui ne se suivent pas : ${sequenceOf(exo).join(" | ")}`),
    ok(CLOCK_STARTS[band3(levelOf(exo))].some(([hour, half]) => hour === start.hour && half === start.half), `départ ${sequenceOf(exo)[0]} au palier ${levelOf(exo)}`),
    ok(minutes[3] <= 12 * 60, "pas plus de douze heures"),
  );
};

const checkClockSort: Check = (exo) => {
  const items = itemsOf(exo);
  return all(
    ok(same(zonesOf(exo), ["o'clock", "half past"]), zonesOf(exo).join(", ")),
    ok(items.length === (levelOf(exo) <= 2 ? 4 : 5), `${items.length} étiquettes`),
    ...items.map((item) => {
      const m = /^(\d+):(00|30)$/.exec(item.text);
      if (!m) return `heure inconnue : ${item.text}`;
      return all(ok(hourBandOk(Number(m[1]), levelOf(exo)), `${m[1]} h au palier ${levelOf(exo)}`), ok(item.correctZone === (m[2] === "00" ? "o'clock" : "half past"), `${item.text} dans « ${item.correctZone} »`));
    }),
    ok(items.some((item) => item.correctZone === "o'clock") && items.some((item) => item.correctZone === "half past"), "les deux cases sont servies"),
  );
};

const checkClockWrite: Check = (exo) => {
  const m = /^Il est (\d+) h(?: (30))?\. Écris en anglais le nombre qui manque dans (It is half past ___\.|It is ___ o'clock\.)$/.exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const [hour, half] = [Number(m[1]), m[2] === "30"];
  return all(
    ok(hourBandOk(hour, levelOf(exo)), `${hour} h au palier ${levelOf(exo)}`),
    ok((m[3] === "It is half past ___.") === half, "la façon de dire l'heure"),
    ok(acceptedOf(exo).length === 1 && acceptedOf(exo)[0] === NUMBER_WORDS[hour - 1], `${exo.prompt} : ${acceptedOf(exo)}`),
  );
};

void frenchHour;

// ===========================================================================
// LES VÉRIFICATIONS, PAR GABARIT
// ===========================================================================

const CHECKS: Record<string, Check> = {
  "ce2-en-be-trou": checkBeGap,
  "ce2-en-be-phrase": checkBePhrase,
  "ce2-en-be-neg": checkBeNeg,
  "ce2-en-be-question": checkBeQuestion,
  "ce2-en-be-reponse": checkBeReply,
  "ce2-en-be-glisser": checkBeSort,
  "ce2-en-be-ecrire": checkBeWrite,
  "ce2-en-hg-trou": checkHgGap,
  "ce2-en-hg-phrase": checkHgPhrase,
  "ce2-en-hg-neg": checkHgNeg,
  "ce2-en-hg-question": checkHgQuestion,
  "ce2-en-hg-reponse": checkHgReply,
  "ce2-en-hg-relier": checkHgLinks,
  "ce2-en-hg-glisser": checkHgSort,
  "ce2-en-hg-ecrire": checkHgWrite,
  "ce2-en-can-fr": checkCanFrench,
  "ce2-en-can-phrase": checkCanPhrase,
  "ce2-en-can-neg": checkCanNeg,
  "ce2-en-can-trou": checkCanGap,
  "ce2-en-can-question": checkCanQuestion,
  "ce2-en-can-reponse": checkCanReply,
  "ce2-en-can-relier": checkCanLinks,
  "ce2-en-can-glisser": checkCanSort,
  "ce2-en-can-ecrire": checkCanWrite,
  "ce2-en-home-phrase": checkHomePhrase,
  "ce2-en-home-ou": checkHomeWhere,
  "ce2-en-home-trou": checkHomeGap,
  "ce2-en-home-ordre": checkHomeOrder,
  "ce2-en-home-mot": checkHomeWord,
  "ce2-en-home-relier": checkHomeLinks,
  "ce2-en-home-glisser": checkHomeSort,
  "ce2-en-home-ecrire": checkHomeWrite,
  "ce2-en-months-mot": checkMonthsWord,
  "ce2-en-months-voisin": checkMonthsNeighbour,
  "ce2-en-months-anniversaire": checkMonthsBirthday,
  "ce2-en-months-trou": checkMonthsGap,
  "ce2-en-months-ordre": checkMonthsOrder,
  "ce2-en-months-relier": checkMonthsLinks,
  "ce2-en-months-glisser": checkMonthsSort,
  "ce2-en-months-ecrire": checkMonthsWrite,
  "ce2-en-weather-mot": checkWeatherWord,
  "ce2-en-weather-phrase": checkWeatherPhrase,
  "ce2-en-weather-question": checkWeatherReply,
  "ce2-en-weather-trou": checkWeatherGap,
  "ce2-en-weather-ordre": checkWeatherOrder,
  "ce2-en-weather-relier": checkWeatherLinks,
  "ce2-en-weather-saison": checkWeatherSeason,
  "ce2-en-weather-glisser": checkWeatherSort,
  "ce2-en-weather-ecrire": checkWeatherWrite,
  "ce2-en-clock-phrase": checkClockPhrase,
  "ce2-en-clock-heure": checkClockDigits,
  "ce2-en-clock-trou": checkClockGap,
  "ce2-en-clock-question": checkClockQuestion,
  "ce2-en-clock-relier": checkClockLinks,
  "ce2-en-clock-ordre": checkClockOrder,
  "ce2-en-clock-glisser": checkClockSort,
  "ce2-en-clock-ecrire": checkClockWrite,
};

const KINDS = Object.keys(CHECKS) as GameKind[];
const TOPIC_KINDS: Record<string, string[]> = {
  "an-ce2-be": ["trou", "phrase", "neg", "question", "reponse", "glisser", "ecrire"].map((k) => `ce2-en-be-${k}`),
  "an-ce2-have-got": ["trou", "phrase", "neg", "question", "reponse", "relier", "glisser", "ecrire"].map((k) => `ce2-en-hg-${k}`),
  "an-ce2-can": ["fr", "phrase", "neg", "trou", "question", "reponse", "relier", "glisser", "ecrire"].map((k) => `ce2-en-can-${k}`),
  "an-ce2-home": ["phrase", "ou", "trou", "ordre", "mot", "relier", "glisser", "ecrire"].map((k) => `ce2-en-home-${k}`),
  "an-ce2-months": ["mot", "voisin", "anniversaire", "trou", "ordre", "relier", "glisser", "ecrire"].map((k) => `ce2-en-months-${k}`),
  "an-ce2-weather": ["mot", "phrase", "question", "trou", "ordre", "relier", "saison", "glisser", "ecrire"].map((k) => `ce2-en-weather-${k}`),
  "an-ce2-clock": ["phrase", "heure", "trou", "question", "relier", "ordre", "glisser", "ecrire"].map((k) => `ce2-en-clock-${k}`),
};
const PALIERS: Record<string, number> = { "an-ce2-be": 3, "an-ce2-have-got": 3, "an-ce2-can": 3, "an-ce2-home": 4, "an-ce2-months": 2, "an-ce2-weather": 2, "an-ce2-clock": 3 };
const TOPIC_KEYS = Object.keys(TOPIC_KINDS);
const entryOf = (key: string) => allProgrammeEntries().find((entry) => entry.topic.key === key)!;
const topicOf = (key: string) => entryOf(key).topic;
/** Les niveaux joués par une thématique : 1, 2 et 4 pour trois paliers, 1 et 4 pour deux, 1 à 4 pour quatre. */
const levelsOf = (key: string): GameLevel[] => (PALIERS[key] === 3 ? [1, 2, 4] : PALIERS[key] === 2 ? [1, 4] : [1, 2, 3, 4]);
const topicOfKind = (kind: string) => TOPIC_KEYS.find((key) => TOPIC_KINDS[key].includes(kind))!;

describe("chaque gabarit d'anglais du CE2 a sa vérification", () => {
  it("couvre exactement les cinquante-sept gabarits, tous rangés dans une thématique", () => {
    expect(KINDS).toHaveLength(57);
    expect([...new Set(Object.values(TOPIC_KINDS).flat())].sort()).toEqual([...KINDS].sort());
    for (const kind of KINDS) expect(Object.keys(GAME_KINDS), kind).toContain(kind);
  });
});

describe("les gabarits d'anglais du CE2 recalculent juste, depuis des règles et des tables écrites à part", () => {
  for (const kind of KINDS) {
    it(`${kind} : la bonne réponse se lit dans la règle, aux paliers de sa thématique`, () => {
      for (const d of draws.filter((draw) => levelsOf(topicOfKind(kind)).includes(draw.level))) {
        const exo = make(kind, d) as unknown as Exo;
        expect(CHECKS[kind](exo), `${kind} niveau ${d.level} : ${exo.prompt} ${exo.payload.text ?? ""}`).toBeNull();
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
      for (const d of draws.filter((draw, i) => i % 4 === 0 && levelsOf(topicOfKind(kind)).includes(draw.level))) {
        const exo = make(kind, d) as unknown as Exo;
        const broken = mutate(kind, exo);
        if (!broken) continue;
        mutated += 1;
        expect(CHECKS[kind](broken), `${kind} niveau ${d.level} : ${exo.prompt}`).not.toBeNull();
      }
      expect(mutated, kind).toBeGreaterThan(0);
    });
  }

  it("voient aussi un énoncé abîmé : un verbe être qui ne va pas au sujet, un « have » pour un « has », un « s » à can, un mois de la mauvaise saison, une demie prise pour une heure pile", () => {
    const qcm = (prompt: string, options: string[], correctIndex: number, level: number) =>
      ({ type: "qcm", prompt, answerKey: options[correctIndex], hints: [], payload: { options, correctIndex, game: { kind: "x", level } } }) as Exo;
    expect(CHECKS["ce2-en-be-phrase"](qcm("Quelle phrase est juste ?", ["She is happy.", "She am happy.", "She are happy."], 0, 1))).toBeNull();
    expect(CHECKS["ce2-en-be-phrase"](qcm("Quelle phrase est juste ?", ["She am happy.", "She is happy.", "She are happy."], 0, 1))).not.toBeNull();
    expect(CHECKS["ce2-en-hg-phrase"](qcm("Quelle phrase est juste ?", ["He has got two brothers.", "He have got two brothers.", "He has got two brother."], 0, 1))).toBeNull();
    expect(CHECKS["ce2-en-hg-phrase"](qcm("Quelle phrase est juste ?", ["He have got two brothers.", "He has got two brothers.", "He has got two brother."], 0, 1))).not.toBeNull();
    expect(CHECKS["ce2-en-can-phrase"](qcm("Quelle phrase est juste ?", ["She can run.", "She cans run.", "She can runs."], 0, 1))).toBeNull();
    expect(CHECKS["ce2-en-can-phrase"](qcm("Quelle phrase est juste ?", ["She cans run.", "She can run.", "She can runs."], 0, 1))).not.toBeNull();
    expect(CHECKS["ce2-en-weather-saison"](qcm("En juillet, au Sénégal, c'est la saison des pluies. Que dis-tu en anglais ?", ["It is the rainy season in July.", "It is the dry season in July.", "It is the rainy season in January."], 0, 1))).toBeNull();
    expect(CHECKS["ce2-en-weather-saison"](qcm("En juillet, au Sénégal, c'est la saison sèche. Que dis-tu en anglais ?", ["It is the dry season in July.", "It is the rainy season in July.", "It is the dry season in January."], 0, 1))).not.toBeNull();
    expect(CHECKS["ce2-en-clock-phrase"](qcm("Il est 3 h 30. Quelle phrase dit l'heure ?", ["It is half past three.", "It is three o'clock.", "It is half past four."], 0, 1))).toBeNull();
    expect(CHECKS["ce2-en-clock-phrase"](qcm("Il est 3 h 30. Quelle phrase dit l'heure ?", ["It is three o'clock.", "It is half past three.", "It is half past four."], 0, 1))).not.toBeNull();
    expect(CHECKS["ce2-en-home-phrase"](qcm("Le chat est sous la table. Quelle phrase dit la même chose en anglais ?", ["The cat is under the table.", "The cat is on the table.", "The cat is behind the table."], 0, 1))).toBeNull();
    expect(CHECKS["ce2-en-home-phrase"](qcm("Le chat est sous la table. Quelle phrase dit la même chose en anglais ?", ["The cat is on the table.", "The cat is under the table.", "The cat is behind the table."], 0, 1))).not.toBeNull();
    expect(CHECKS["ce2-en-months-voisin"](qcm("Quel mois vient après March ?", ["April", "February", "May"], 0, 1))).toBeNull();
    expect(CHECKS["ce2-en-months-voisin"](qcm("Quel mois vient après March ?", ["May", "April", "February"], 0, 1))).not.toBeNull();
  });
});

// ===========================================================================
// LES RÈGLES COMMUNES
// ===========================================================================

describe("tous les gabarits d'anglais du CE2", () => {
  const exos = KINDS.flatMap((kind) =>
    draws.filter((draw, i) => i % 3 === 0 && levelsOf(topicOfKind(kind)).includes(draw.level)).map((d) => ({ kind, exo: make(kind, d) as unknown as Exo })),
  );

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

  it("n'écrivent aucun émoji, ni dans un énoncé, ni sur une tuile, ni dans un indice, et aucun sélecteur de variation", () => {
    for (const { kind, exo } of exos) {
      expect(/\p{Extended_Pictographic}/u.test(exo.prompt), `${kind} : ${exo.prompt}`).toBe(false);
      for (const text of texts(exo)) {
        expect(text.includes(String.fromCodePoint(0xfe0f)), `${kind} : « ${text} »`).toBe(false);
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
        for (const pair of pairs) expect(fold(pair.left), `${kind} : ${pair.left}`).not.toBe(fold(pair.right));
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
      const words = new Set(
        answers.flatMap((answer) =>
          fold(answer)
            .split(/[^a-z]+/)
            .filter((word) => word.length >= 4),
        ),
      );
      for (const hint of exo.hints) {
        expect(hint, `${kind} : « ${hint} » écrit un chiffre`).not.toMatch(/\d/);
        const hintWords = fold(hint).split(/[^a-z]+/);
        for (const word of words) expect(hintWords, `${kind} : « ${hint} » écrit « ${word} »`).not.toContain(word);
      }
    }
  });

  it("donnent trois indices différents, et se refont à l'identique avec la même graine", () => {
    for (const kind of KINDS) {
      const a = GAME_KINDS[kind].make(makeContext("CE2", 2, "graine"));
      const b = GAME_KINDS[kind].make(makeContext("CE2", 2, "graine"));
      expect(a).toEqual(b);
      expect(a.hints).toHaveLength(3);
      expect(new Set(a.hints).size, kind).toBe(3);
    }
  });

  it("passent le contrôleur au CE2 sans aucun défaut, à tous les niveaux", () => {
    for (const { kind, exo } of exos) {
      const defects = auditExercise({
        type: GAME_KINDS[kind].type,
        prompt: exo.prompt,
        payload: exo.payload,
        answerKey: exo.answerKey,
        hints: exo.hints,
        class: "CE2",
        subject: "Anglais",
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

  it("ne mettent jamais une étiquette de glissé ou un mot de choix d'un mot avec un article français en tête", () => {
    for (const { kind, exo } of exos) {
      const tiles = [...(exo.payload.items ? itemsOf(exo).map((item) => item.text) : []), ...(exo.payload.options && !/\s/u.test(rightOption(exo)) ? optionsOf(exo) : [])];
      for (const text of tiles) expect(text, `${kind} : « ${text} »`).not.toMatch(/^(?:le|la|les|l'|un|une|des|du|de la|de l') /iu);
    }
  });
});

// ===========================================================================
// LES THÉMATIQUES DU PROGRAMME
// ===========================================================================

describe("les sept thématiques d'anglais du CE2", () => {
  it("remplissent les dix places du palier, avec des jeux connus, sans appeler le modèle", () => {
    for (const key of TOPIC_KEYS) {
      const specs = topicOf(key).games ?? [];
      expect(specs.reduce((sum, spec) => sum + spec.count, 0), key).toBe(PALIER_SIZE);
      expect([...new Set(specs.map((spec) => spec.kind as string))].sort(), key).toEqual([...TOPIC_KINDS[key]].sort());
      expect(new Set(specs.map((spec) => GAME_KINDS[spec.kind].type)).size, key).toBeGreaterThanOrEqual(4);
      for (const spec of specs) expect(Object.keys(GAME_KINDS), `${key} : ${spec.kind}`).toContain(spec.kind);
      expect(topicUsesModel(key), key).toBe(false);
    }
  });

  it("sont celles du CE2, et gardent leur clé et leur nombre de paliers", () => {
    for (const key of TOPIC_KEYS) {
      expect(entryOf(key).klass, key).toBe("CE2");
      expect(topicOf(key).palierCount, key).toBe(PALIERS[key] === 4 ? undefined : PALIERS[key]);
    }
    expect(TOPIC_KEYS).toHaveLength(7);
  });

  it("fabriquent des paliers entiers, de dix exercices, qui passent le contrôleur et la règle, à chacun de leurs paliers", () => {
    for (const key of TOPIC_KEYS) {
      const count = PALIERS[key];
      for (let n = 0; n < 30; n++) {
        for (let palierIndex = 1; palierIndex <= count; palierIndex++) {
          const paliers = generateGames(topicOf(key).games ?? [], { klass: "CE2", palierIndex, palierCount: count, seed: `${key}:${n}:${palierIndex}` });
          expect(paliers, `${key} palier ${palierIndex}`).toHaveLength(PALIER_SIZE);
          const questions = paliers.map((game) => `${game.prompt}|${JSON.stringify(game.payload)}`);
          expect(new Set(questions).size, `${key} #${n} palier ${palierIndex}`).toBe(questions.length);
          expect(new Set(paliers.map((game) => game.type)).size, `${key} palier ${palierIndex}`).toBeGreaterThanOrEqual(4);
          for (const game of paliers) {
            const defects = auditExercise({ type: game.type, prompt: game.prompt, payload: game.payload, answerKey: game.answerKey, hints: game.hints, class: "CE2", subject: "Anglais" });
            expect(defects, `${key} palier ${palierIndex} : ${game.prompt}`).toEqual([]);
            const kind = (game.payload.game as { kind: string }).kind;
            expect(CHECKS[kind](game as unknown as Exo), `${key} palier ${palierIndex} ${kind} : ${game.prompt} ${game.payload.text ?? ""}`).toBeNull();
          }
        }
      }
    }
  });

  it("ne posent pas, dans un palier, deux phrases à trou qui se complètent par le même mot, ni deux fois la même question d'un même gabarit", () => {
    for (const key of TOPIC_KEYS) {
      for (let n = 0; n < 60; n++) {
        for (let palierIndex = 1; palierIndex <= PALIERS[key]; palierIndex++) {
          const paliers = generateGames(topicOf(key).games ?? [], { klass: "CE2", palierIndex, palierCount: PALIERS[key], seed: `variete:${key}:${n}:${palierIndex}` });
          const gaps = paliers.filter((game) => game.type === "fill-blank" && (game.payload.game as { kind: string }).kind.endsWith("-trou"));
          const keys = gaps.map((game) => `${(game.payload.game as { kind: string }).kind}|${(game.payload.blanks as { answer: string }[])[0].answer}|${game.prompt}|${game.payload.text}`);
          expect(new Set(keys).size, `${key} palier ${palierIndex}`).toBe(keys.length);
          const questions = paliers.map((game) => `${(game.payload.game as { kind: string }).kind}|${game.prompt}|${game.answerKey}`);
          expect(new Set(questions).size, `${key} palier ${palierIndex}`).toBe(questions.length);
        }
      }
    }
  });

  it("ne reposent presque jamais la même question à deux paliers d'une même thématique", () => {
    for (const key of TOPIC_KEYS) {
      let repeated = 0;
      let total = 0;
      for (let n = 0; n < 60; n++) {
        const seen = new Set<string>();
        for (let palierIndex = 1; palierIndex <= PALIERS[key]; palierIndex++) {
          const paliers = generateGames(topicOf(key).games ?? [], { klass: "CE2", palierIndex, palierCount: PALIERS[key], seed: `revue:${key}:${n}:${palierIndex}` });
          const questions = paliers.map((game) => `${game.prompt}|${game.answerKey}|${game.type === "fill-blank" ? game.payload.text : ""}`);
          for (const question of questions) {
            total += 1;
            if (seen.has(question)) repeated += 1;
          }
          for (const question of questions) seen.add(question);
        }
      }
      expect(repeated / total, `${key} : ${repeated} questions revues sur ${total}`).toBeLessThan(0.03);
    }
  });

  it("gardent de quoi servir la démo du site : un gabarit du type de chaque exercice de la banque", () => {
    const typesOf = (key: string) => new Set((topicOf(key).games ?? []).map((spec) => GAME_KINDS[spec.kind].type));
    for (const key of TOPIC_KEYS) {
      for (const type of ["qcm", "fill-blank", "short-answer", "drag-drop"]) expect(typesOf(key).has(type as never), `${key} : ${type}`).toBe(true);
    }
  });

  it("refont chaque exercice raté par le code, sans le modèle", () => {
    for (const key of TOPIC_KEYS) {
      for (const kind of TOPIC_KINDS[key]) {
        const again = regenerateGame({ kind, level: 4 }, "CE2", `reprise:${key}:${kind}`);
        expect(again, kind).not.toBeNull();
        expect((again!.payload.game as { kind: string }).kind, kind).toBe(kind);
      }
    }
  });
});
