import { acceptedOf, all, blankOf, defineMathsTests, itemsOf, ok, optionsOf, pairsOf, rightOption, sequenceOf, textOf, wrongOf, zonesOf, type Check } from "@/lib/test-support/cm1MathsKit";

/**
 * LE CONDITIONNEL ET LE SUBJONCTIF DU CM2 (`fr-cm2-modes`).
 *
 * Ce fichier a son propre tableau de conjugaison, écrit à part de `cm2Modes.ts` : quinze verbes, leur indicatif présent, leur imparfait, leur futur, leur
 * conditionnel présent, leur subjonctif présent et leur impératif, tapés en toutes lettres (aucune règle de construction n'est reprise des sources). Il RELIT chaque
 * phrase : le sujet donne la personne, le complément donne le verbe, le mode se lit dans le début de la phrase (« si le temps était beau », « il faut que », un
 * ordre sans sujet), et la forme écrite doit être celle du tableau. Un mauvais choix ne doit jamais être la forme qu'attend la phrase.
 */

type V = { comp: string; p: string[]; i: string[]; f: string[]; c: string[]; s: string[]; imp: string[] | null };
const w = (text: string) => text.split(" ");
const v = (comp: string, p: string, i: string, f: string, c: string, s: string, imp: string | null): V => ({ comp, p: w(p), i: w(i), f: w(f), c: w(c), s: w(s), imp: imp ? w(imp) : null });

const TABLE: Record<string, V> = {
  chanter: v("une chanson", "chante chantes chante chantons chantez chantent", "chantais chantais chantait chantions chantiez chantaient", "chanterai chanteras chantera chanterons chanterez chanteront", "chanterais chanterais chanterait chanterions chanteriez chanteraient", "chante chantes chante chantions chantiez chantent", "chante chantons chantez"),
  jouer: v("au ballon", "joue joues joue jouons jouez jouent", "jouais jouais jouait jouions jouiez jouaient", "jouerai joueras jouera jouerons jouerez joueront", "jouerais jouerais jouerait jouerions joueriez joueraient", "joue joues joue jouions jouiez jouent", "joue jouons jouez"),
  manger: v("du riz", "mange manges mange mangeons mangez mangent", "mangeais mangeais mangeait mangions mangiez mangeaient", "mangerai mangeras mangera mangerons mangerez mangeront", "mangerais mangerais mangerait mangerions mangeriez mangeraient", "mange manges mange mangions mangiez mangent", "mange mangeons mangez"),
  finir: v("le devoir", "finis finis finit finissons finissez finissent", "finissais finissais finissait finissions finissiez finissaient", "finirai finiras finira finirons finirez finiront", "finirais finirais finirait finirions finiriez finiraient", "finisse finisses finisse finissions finissiez finissent", "finis finissons finissez"),
  choisir: v("un cadeau", "choisis choisis choisit choisissons choisissez choisissent", "choisissais choisissais choisissait choisissions choisissiez choisissaient", "choisirai choisiras choisira choisirons choisirez choisiront", "choisirais choisirais choisirait choisirions choisiriez choisiraient", "choisisse choisisses choisisse choisissions choisissiez choisissent", "choisis choisissons choisissez"),
  être: v("au village", "suis es est sommes êtes sont", "étais étais était étions étiez étaient", "serai seras sera serons serez seront", "serais serais serait serions seriez seraient", "sois sois soit soyons soyez soient", "sois soyons soyez"),
  avoir: v("un beau cadeau", "ai as a avons avez ont", "avais avais avait avions aviez avaient", "aurai auras aura aurons aurez auront", "aurais aurais aurait aurions auriez auraient", "aie aies ait ayons ayez aient", "aie ayons ayez"),
  aller: v("au marché", "vais vas va allons allez vont", "allais allais allait allions alliez allaient", "irai iras ira irons irez iront", "irais irais irait irions iriez iraient", "aille ailles aille allions alliez aillent", "va allons allez"),
  faire: v("un gâteau", "fais fais fait faisons faites font", "faisais faisais faisait faisions faisiez faisaient", "ferai feras fera ferons ferez feront", "ferais ferais ferait ferions feriez feraient", "fasse fasses fasse fassions fassiez fassent", "fais faisons faites"),
  prendre: v("le car", "prends prends prend prenons prenez prennent", "prenais prenais prenait prenions preniez prenaient", "prendrai prendras prendra prendrons prendrez prendront", "prendrais prendrais prendrait prendrions prendriez prendraient", "prenne prennes prenne prenions preniez prennent", "prends prenons prenez"),
  venir: v("chez nous", "viens viens vient venons venez viennent", "venais venais venait venions veniez venaient", "viendrai viendras viendra viendrons viendrez viendront", "viendrais viendrais viendrait viendrions viendriez viendraient", "vienne viennes vienne venions veniez viennent", "viens venons venez"),
  voir: v("un oiseau", "vois vois voit voyons voyez voient", "voyais voyais voyait voyions voyiez voyaient", "verrai verras verra verrons verrez verront", "verrais verrais verrait verrions verriez verraient", "voie voies voie voyions voyiez voient", "vois voyons voyez"),
  dire: v("bonjour", "dis dis dit disons dites disent", "disais disais disait disions disiez disaient", "dirai diras dira dirons direz diront", "dirais dirais dirait dirions diriez diraient", "dise dises dise disions disiez disent", "dis disons dites"),
  pouvoir: v("nager dans la mer", "peux peux peut pouvons pouvez peuvent", "pouvais pouvais pouvait pouvions pouviez pouvaient", "pourrai pourras pourra pourrons pourrez pourront", "pourrais pourrais pourrait pourrions pourriez pourraient", "puisse puisses puisse puissions puissiez puissent", null),
  savoir: v("nager", "sais sais sait savons savez savent", "savais savais savait savions saviez savaient", "saurai sauras saura saurons saurez sauront", "saurais saurais saurait saurions sauriez sauraient", "sache saches sache sachions sachiez sachent", "sache sachons sachez"),
};
const INFS = Object.keys(TABLE);
const infOfComp = (rest: string): { inf: string; form: string } | null => {
  for (const inf of INFS) {
    const suffix = ` ${TABLE[inf].comp}`;
    if (rest.endsWith(suffix)) return { inf, form: rest.slice(0, -suffix.length) };
  }
  return null;
};

const SINGULAR_NAMES = ["moussa", "fatou", "modou", "binta", "sidy", "khady", "cheikh", "mariama"];
const PLURAL_NAMES = ["les enfants", "les pêcheurs", "moussa et fatou", "les élèves", "mes cousins", "binta et sidy"];
const PLAIN: Record<string, number> = { "je ": 0, "j'": 0, "tu ": 1, "il ": 2, "nous ": 3, "vous ": 4, "ils ": 5 };
const WITH_QUE: Record<string, number> = { "que je ": 0, "que j'": 0, "que tu ": 1, "qu'il ": 2, "que nous ": 3, "que vous ": 4, "qu'ils ": 5 };
for (const name of SINGULAR_NAMES) {
  PLAIN[`${name} `] = 2;
  WITH_QUE[`que ${name} `] = 2;
}
for (const name of PLURAL_NAMES) {
  PLAIN[`${name} `] = 5;
  WITH_QUE[`que ${name} `] = 5;
}
const LEADS = (que: boolean) => Object.keys(que ? WITH_QUE : PLAIN).sort((a, b) => b.length - a.length);
/** Le sujet qui ouvre `text` (en minuscules), sa personne et le reste. */
function readLead(text: string, que: boolean): { person: number; rest: string; lead: string } | null {
  const lower = text.toLowerCase();
  for (const lead of LEADS(que)) if (lower.startsWith(lead)) return { person: (que ? WITH_QUE : PLAIN)[lead], rest: text.slice(lead.length), lead };
  return null;
}
const elisionOk = (lead: string, form: string) => !/(j'|^que j')$/.test(lead.trimEnd() + (lead.endsWith(" ") ? "" : "")) || /^[aeiouyéèêâîôûh]/i.test(form);
const vowel = (form: string) => /^[aeiouyéèêâîôûh]/i.test(form);
/** « je » devant une consonne, « j' » devant une voyelle : le sujet et la forme s'accordent. */
const leadMatchesForm = (lead: string, form: string) => (lead.endsWith("j'") ? vowel(form) : lead.endsWith("je ") ? !vowel(form) : true);

const FRAMES = [/^Il faut (.+)\.$/, /^Papa répète pour (.+)\.$/, /^Maman prépare le repas pour (.+)\.$/];
const frameCore = (sentence: string): string | null => {
  for (const frame of FRAMES) {
    const m = frame.exec(sentence);
    if (m) return m[1];
  }
  return null;
};
/** Une phrase au subjonctif : « Il faut que nous chantions une chanson. » donne le verbe, la personne et la forme écrite. */
function readSubjunctive(sentence: string): { inf: string; person: number; form: string; lead: string } | null {
  const core = frameCore(sentence);
  if (core === null) return null;
  const lead = readLead(core, true);
  if (!lead) return null;
  const found = infOfComp(lead.rest);
  return found ? { inf: found.inf, person: lead.person, form: found.form, lead: lead.lead } : null;
}
const IF_CLAUSE = /^Si le temps (était|serait) beau, (.+)\.$/;
/** Une phrase avec « si » : l'imparfait ou le conditionnel après « si », puis le verbe de l'autre partie. */
function readConditional(sentence: string): { ifForm: string; inf: string; person: number; form: string; lead: string } | null {
  const m = IF_CLAUSE.exec(sentence);
  if (!m) return null;
  const lead = readLead(m[2], false);
  if (!lead) return null;
  const found = infOfComp(lead.rest);
  return found ? { ifForm: m[1], inf: found.inf, person: lead.person, form: found.form, lead: lead.lead } : null;
}
/** Une phrase simple (indicatif, conditionnel sans « si ») ou un ordre : « Tu chantes une chanson. » / « Chante une chanson ! ». */
function readPlain(sentence: string): { inf: string; person: number; form: string; lead: string } | null {
  const body = sentence.replace(/\.$/, "");
  const lead = readLead(body, false);
  if (!lead) return null;
  const found = infOfComp(lead.rest);
  return found ? { inf: found.inf, person: lead.person, form: found.form, lead: lead.lead } : null;
}
function readImperative(sentence: string): { inf: string; form: string } | null {
  if (!sentence.endsWith(" !")) return null;
  const body = sentence.slice(0, -2);
  const found = infOfComp(body);
  return found ? { inf: found.inf, form: found.form.toLowerCase() } : null;
}

const PRONOUN_TO_PERSON: Record<string, number> = { je: 0, tu: 1, il: 2, nous: 3, vous: 4, ils: 5 };
const QUE_TO_PERSON: Record<string, number> = { "que je": 0, "que tu": 1, "qu'il": 2, "que nous": 3, "que vous": 4, "qu'ils": 5 };
const LABELS = ["Indicatif", "Conditionnel", "Subjonctif", "Impératif"];

const checkGap: Check = (exo) => {
  const text = textOf(exo);
  const m = /^(.*) \((\p{L}+)\)$/u.exec(text);
  if (!m) return `phrase à trou inconnue : ${text}`;
  const inf = m[2];
  if (!(inf in TABLE)) return `un verbe hors du tableau : ${inf}`;
  const { answer, options } = blankOf(exo);
  const blank = m[1];
  // Le conditionnel : « Si le temps était beau, … ___ … » ; le subjonctif : une amorce puis « que … ___ ».
  const cond = /^Si le temps était beau, (.*)___ (.+)\.$/.exec(blank);
  const frame = /^(?:Il faut|Papa répète pour|Maman prépare le repas pour) (.*)___ (.+)\.$/.exec(blank);
  if (cond) {
    const lead = readLead(`${cond[1]}x`, false);
    if (!lead) return `sujet inconnu : ${blank}`;
    const expected = TABLE[inf].c[lead.person];
    return all(
      ok(cond[2] === TABLE[inf].comp, `le complément de ${inf} : ${cond[2]}`),
      ok(answer === expected, `${text} : ${answer}, pas ${expected}`),
      ok(leadMatchesForm(cond[1], expected), `l'élision de « ${cond[1]} » devant ${expected}`),
      ok(options.length === 3 && options.filter((o) => o !== answer).every((o) => o !== expected && (o === TABLE[inf].f[lead.person] || o === TABLE[inf].p[lead.person])), `un mauvais choix qui n'est ni le futur ni le présent de la personne : ${options.join(" ; ")}`),
    );
  }
  if (frame) {
    const lead = readLead(`${frame[1]}x`, true);
    if (!lead) return `sujet inconnu : ${blank}`;
    const expected = TABLE[inf].s[lead.person];
    const bad = [TABLE[inf].p[lead.person], TABLE[inf].c[lead.person], TABLE[inf].f[lead.person]].filter((form) => form !== expected);
    return all(
      ok(frame[2] === TABLE[inf].comp, `le complément de ${inf} : ${frame[2]}`),
      ok(answer === expected, `${text} : ${answer}, pas ${expected}`),
      ok(leadMatchesForm(frame[1], expected), `l'élision de « ${frame[1]} » devant ${expected}`),
      ok(options.length === 3 && options.filter((o) => o !== answer).every((o) => bad.includes(o)), `un mauvais choix qui peut être juste : ${options.join(" ; ")}`),
    );
  }
  return `phrase à trou inconnue : ${text}`;
};

const MODE_PROMPT = /^Dans la phrase « (.+) », à quel mode est le verbe « (.+) » \?$/u;
const checkMode: Check = (exo) => {
  const m = MODE_PROMPT.exec(exo.prompt);
  if (!m) return `énoncé inconnu : ${exo.prompt}`;
  const [, sentence, verb] = m;
  let mode: string;
  let expected: string;
  const cond = readConditional(sentence);
  const subj = readSubjunctive(sentence);
  const imp = readImperative(sentence);
  if (cond) {
    mode = "Conditionnel";
    expected = TABLE[cond.inf].c[cond.person];
    if (cond.ifForm !== "était" || !leadMatchesForm(cond.lead, cond.form)) return `phrase à « si » mal écrite : ${sentence}`;
    if (cond.form !== expected) return `${sentence} : la forme est ${cond.form}, pas ${expected}`;
  } else if (subj) {
    mode = "Subjonctif";
    expected = TABLE[subj.inf].s[subj.person];
    if (subj.form !== expected || !leadMatchesForm(subj.lead, subj.form)) return `${sentence} : la forme est ${subj.form}, pas ${expected}`;
  } else if (imp) {
    mode = "Impératif";
    expected = imp.form;
    const forms = TABLE[imp.inf].imp;
    if (!forms || !forms.includes(imp.form)) return `${sentence} : ${imp.form} n'est pas un impératif de ${imp.inf}`;
  } else {
    const plain = readPlain(sentence);
    if (!plain) return `phrase inconnue : ${sentence}`;
    mode = "Indicatif";
    expected = TABLE[plain.inf].p[plain.person];
    if (plain.form !== expected || !leadMatchesForm(plain.lead, plain.form)) return `${sentence} : la forme est ${plain.form}, pas ${expected}`;
  }
  return all(
    ok(verb === expected, `le verbe demandé est « ${verb} », la phrase écrit « ${expected} »`),
    ok(rightOption(exo) === mode, `${exo.prompt} : ${rightOption(exo)}, pas ${mode}`),
    ok(optionsOf(exo).length === 3 && new Set(optionsOf(exo)).size === 3 && optionsOf(exo).every((o) => LABELS.includes(o)), `des choix qui ne sont pas des modes : ${optionsOf(exo).join(" ; ")}`),
  );
};

const checkWrite: Check = (exo) => {
  const cond = /^Écris le verbe (\p{L}+) au conditionnel présent avec « (je|tu|il|nous|vous|ils) »\.$/u.exec(exo.prompt);
  const subj = /^Écris le verbe (\p{L}+) au subjonctif présent avec « (que je|que tu|qu'il|que nous|que vous|qu'ils) »\.$/u.exec(exo.prompt);
  if (!cond && !subj) return `énoncé inconnu : ${exo.prompt}`;
  const inf = (cond ?? subj)![1];
  if (!(inf in TABLE)) return `un verbe hors du tableau : ${inf}`;
  const expected = cond ? TABLE[inf].c[PRONOUN_TO_PERSON[cond[2]]] : TABLE[inf].s[QUE_TO_PERSON[subj![2]]];
  return all(ok(exo.answerKey === expected, `${exo.prompt} : ${exo.answerKey}, pas ${expected}`), ok(acceptedOf(exo).length === 1 && acceptedOf(exo)[0] === expected, `les réponses admises : ${acceptedOf(exo).join(" ; ")}`));
};

const checkForm: Check = (exo) => {
  const cond = /^Quelle est la forme du verbe (\p{L}+) au conditionnel présent avec « (je|tu|il|nous|vous|ils) » \?$/u.exec(exo.prompt);
  const subj = /^Quelle est la forme du verbe (\p{L}+) au subjonctif présent avec « (que je|que tu|qu'il|que nous|que vous|qu'ils) » \?$/u.exec(exo.prompt);
  if (!cond && !subj) return `énoncé inconnu : ${exo.prompt}`;
  const inf = (cond ?? subj)![1];
  if (!(inf in TABLE)) return `un verbe hors du tableau : ${inf}`;
  const person = cond ? PRONOUN_TO_PERSON[cond[2]] : QUE_TO_PERSON[subj![2]];
  const expected = cond ? TABLE[inf].c[person] : TABLE[inf].s[person];
  const bad = cond ? [TABLE[inf].f[person], TABLE[inf].i[person]] : [TABLE[inf].p[person], TABLE[inf].c[person], TABLE[inf].f[person]];
  return all(
    ok(rightOption(exo) === expected, `${exo.prompt} : ${rightOption(exo)}, pas ${expected}`),
    ok(wrongOf(exo).length === 2 && wrongOf(exo).every((o) => o !== expected && bad.includes(o)), `un mauvais choix qui peut être juste ou hors du tableau : ${wrongOf(exo).join(" ; ")}`),
  );
};

const checkConditionalSentence: Check = (exo) => {
  const parsed = optionsOf(exo).map(readConditional);
  if (exo.prompt !== "Quelle phrase est correcte ?" || parsed.some((p) => p === null)) return `options inconnues : ${optionsOf(exo).join(" | ")}`;
  const read = parsed as NonNullable<ReturnType<typeof readConditional>>[];
  const first = read[0];
  const valid = read.map((p) => p.ifForm === "était" && p.form === TABLE[p.inf].c[p.person]);
  return all(
    ok(read.every((p) => p.inf === first.inf && p.person === first.person), "les trois phrases ne parlent pas du même verbe et de la même personne"),
    ok(valid.filter(Boolean).length === 1, `${valid.filter(Boolean).length} phrases justes parmi ${optionsOf(exo).join(" | ")}`),
    ok(valid[exo.payload.correctIndex as number] === true, `la bonne réponse n'est pas la phrase juste : ${rightOption(exo)}`),
    ok(read.every((p) => leadMatchesForm(p.lead, p.form)), "une élision de « je » fausse"),
    ok(read.filter((p) => p.ifForm === "serait").length === 1 && read.filter((p) => p.form === TABLE[first.inf].f[first.person]).length === 1, "les deux fautes attendues : « si » + conditionnel, « si » + futur"),
  );
};

const checkSubjunctiveSentence: Check = (exo) => {
  const parsed = optionsOf(exo).map(readSubjunctive);
  if (exo.prompt !== "Quelle phrase est correcte ?" || parsed.some((p) => p === null)) return `options inconnues : ${optionsOf(exo).join(" | ")}`;
  const read = parsed as NonNullable<ReturnType<typeof readSubjunctive>>[];
  const first = read[0];
  const valid = read.map((p) => p.form === TABLE[p.inf].s[p.person]);
  const frames = new Set(optionsOf(exo).map((option) => option.split(" que ")[0].split(" pour ")[0].split(" qu'")[0]));
  return all(
    ok(read.every((p) => p.inf === first.inf && p.person === first.person), "les trois phrases ne parlent pas du même verbe et de la même personne"),
    ok(valid.filter(Boolean).length === 1, `${valid.filter(Boolean).length} phrases justes parmi ${optionsOf(exo).join(" | ")}`),
    ok(valid[exo.payload.correctIndex as number] === true, `la bonne réponse n'est pas la phrase juste : ${rightOption(exo)}`),
    ok(read.every((p) => leadMatchesForm(p.lead, p.form)), "une élision de « que je » fausse"),
    ok(frames.size === 1, "les trois phrases n'ont pas la même amorce"),
    ok(read.filter((p) => !valid[read.indexOf(p)]).every((p) => [TABLE[p.inf].p[p.person], TABLE[p.inf].c[p.person], TABLE[p.inf].f[p.person]].includes(p.form)), "un mauvais choix qui n'est ni l'indicatif, ni le conditionnel, ni le futur"),
  );
};

const checkOrder: Check = (exo) => {
  const m = /^Range ces formes du verbe (\p{L}+) (au subjonctif présent|au conditionnel présent) selon la personne, de je à ils\.$/u.exec(exo.prompt);
  if (!m || !(m[1] in TABLE)) return `énoncé inconnu : ${exo.prompt}`;
  const subj = m[2] === "au subjonctif présent";
  const persons: number[] = [];
  for (const tile of sequenceOf(exo)) {
    const mm = subj ? /^(que je|que j'|que tu|qu'ils|qu'il|que nous|que vous) ?(.+)$/.exec(tile) : /^(ils|il|nous|vous|tu|j'|je) ?(.+)$/.exec(tile);
    if (!mm) return `une tuile inconnue : ${tile}`;
    const person = subj ? (mm[1] === "que j'" ? 0 : QUE_TO_PERSON[mm[1]]) : mm[1] === "j'" ? 0 : PRONOUN_TO_PERSON[mm[1]];
    const expected = subj ? TABLE[m[1]].s[person] : TABLE[m[1]].c[person];
    if (mm[2] !== expected) return `${tile} : ${mm[2]}, pas ${expected}`;
    persons.push(person);
  }
  return all(ok(persons.length === 4 && new Set(persons).size === 4, "quatre personnes différentes"), ok(persons.every((p, i) => i === 0 || persons[i - 1] < p), `l'ordre des personnes ${persons.join(" ")}`));
};

const checkLink: Check = (exo) => {
  const pairs = pairsOf(exo);
  const seen = new Set<string>();
  const checks = pairs.map((pair) => {
    const imp = readImperative(pair.left);
    const subj = readSubjunctive(pair.left);
    let mode: string;
    let inf: string;
    let person: number;
    if (imp) {
      mode = "Impératif";
      inf = imp.inf;
      person = TABLE[inf].imp?.indexOf(imp.form) === 2 ? 4 : 1;
      if (!TABLE[inf].imp?.includes(imp.form)) return `${pair.left} : pas un impératif`;
    } else if (subj) {
      mode = "Subjonctif";
      inf = subj.inf;
      person = subj.person;
      if (subj.form !== TABLE[inf].s[person]) return `${pair.left} : ${subj.form} n'est pas le subjonctif`;
    } else {
      const plain = readPlain(pair.left);
      if (!plain) return `phrase inconnue : ${pair.left}`;
      inf = plain.inf;
      person = plain.person;
      if (plain.form === TABLE[inf].p[person]) mode = "Indicatif";
      else if (plain.form === TABLE[inf].c[person]) mode = "Conditionnel";
      else return `${pair.left} : ${plain.form} n'est ni l'indicatif ni le conditionnel`;
    }
    seen.add(`${inf}|${person}`);
    return ok(pair.right === mode, `${pair.left} est relié à ${pair.right}, pas à ${mode}`);
  });
  return all(...checks, ok(pairs.length === 3 && new Set(pairs.map((pair) => pair.right)).size === 3 && pairs.every((pair) => LABELS.includes(pair.right)), "trois modes différents"), ok(seen.size === 1, `les trois phrases ne parlent pas du même verbe et de la même personne : ${[...seen].join(" ; ")}`));
};

const checkSort: Check = (exo) => {
  const zones = zonesOf(exo);
  const items = itemsOf(exo);
  const results = items.map((item) => {
    const isQue = item.text.startsWith("que ") || item.text.startsWith("qu'");
    const mm = isQue ? /^(que je|que j'|que tu|qu'ils|qu'il|que nous|que vous) ?(.+)$/.exec(item.text) : /^(ils|il|nous|vous|tu|j'|je) ?(.+)$/.exec(item.text);
    if (!mm) return `une tuile inconnue : ${item.text}`;
    const person = isQue ? (mm[1] === "que j'" ? 0 : QUE_TO_PERSON[mm[1]]) : mm[1] === "j'" ? 0 : PRONOUN_TO_PERSON[mm[1]];
    const form = mm[2];
    const table = isQue ? "s" : "c";
    const found = INFS.some((inf) => TABLE[inf][table][person] === form);
    if (!found) return `${item.text} : ${form} n'est pas une forme du tableau`;
    // Une forme du subjonctif n'est jamais posée sans « que » : le conditionnel sert aux tuiles sans « que ».
    return ok(item.correctZone === (isQue ? "Subjonctif présent" : "Conditionnel présent"), `${item.text} est rangé dans « ${item.correctZone} »`);
  });
  return all(ok(zones[0] === "Conditionnel présent" && zones[1] === "Subjonctif présent", `cases inconnues : ${zones.join(" ; ")}`), ok(items.length === 4 && items.filter((i) => i.correctZone === zones[0]).length === 2, "deux formes par case"), ...results);
};

const checkOdd: Check = (exo) => {
  const m = /^Parmi ces formes du verbe (\p{L}+), laquelle n'est pas au conditionnel présent \?$/u.exec(exo.prompt);
  if (!m || !(m[1] in TABLE)) return `énoncé inconnu : ${exo.prompt}`;
  const inf = m[1];
  const read = (tile: string) => {
    const mm = /^(ils|il|nous|vous|tu|j'|je) ?(.+)$/.exec(tile);
    return mm ? { person: mm[1] === "j'" ? 0 : PRONOUN_TO_PERSON[mm[1]], form: mm[2] } : null;
  };
  const tiles = optionsOf(exo).map(read);
  if (tiles.some((t) => t === null)) return `une tuile inconnue : ${optionsOf(exo).join(" | ")}`;
  const isCond = (t: NonNullable<ReturnType<typeof read>>) => t.form === TABLE[inf].c[t.person];
  const isFuture = (t: NonNullable<ReturnType<typeof read>>) => t.form === TABLE[inf].f[t.person];
  const all3 = tiles as NonNullable<ReturnType<typeof read>>[];
  return all(
    ok(all3.filter(isCond).length === 2 && all3.filter(isFuture).length === 1, `deux conditionnels et un futur attendus : ${optionsOf(exo).join(" | ")}`),
    ok(isFuture(all3[exo.payload.correctIndex as number]), `la bonne réponse n'est pas le futur : ${rightOption(exo)}`),
    ok(new Set(all3.map((t) => t.person)).size === 3, "trois personnes différentes"),
  );
};

defineMathsTests({
  label: "du conditionnel et du subjonctif du CM2",
  klass: "CM2",
  subject: "Français",
  hintsNeverWriteChoices: true,
  checks: {
    "cm2-mod-trou": checkGap,
    "cm2-mod-mode": checkMode,
    "cm2-mod-ecrire": checkWrite,
    "cm2-mod-forme": checkForm,
    "cm2-mod-conditionnel": checkConditionalSentence,
    "cm2-mod-subjonctif": checkSubjunctiveSentence,
    "cm2-mod-ranger": checkOrder,
    "cm2-mod-relier": checkLink,
    "cm2-mod-glisser": checkSort,
    "cm2-mod-intrus": checkOdd,
  },
  topicKinds: {
    "fr-cm2-modes": ["cm2-mod-trou", "cm2-mod-mode", "cm2-mod-ecrire", "cm2-mod-forme", "cm2-mod-conditionnel", "cm2-mod-subjonctif", "cm2-mod-ranger", "cm2-mod-relier", "cm2-mod-glisser", "cm2-mod-intrus"],
  },
});
