import { describe, expect, it } from "vitest";
import { ADJECTIVES as SOURCE_ADJECTIVES, ADJECTIVE_ROWS, LINK_ROWS, PARTICIPLES as SOURCE_PARTICIPLES, PARTICIPLE_ROWS, VERBS as SOURCE_VERBS, PLURALS, PLURAL_ROWS, SORT_ROWS, SUBJECT_LIST, SUBJECT_ROWS, VERB_ROWS, WRITE_ROWS } from "../paliers/games/cm1Accords";
import { acceptedOf, all, blankOf, defineMathsTests, itemsOf, ok, optionsOf, pairsOf, rightOption, textOf, wrongOf, zonesOf, type Check, type Exo } from "@/lib/test-support/cm1MathsKit";

/**
 * LES ACCORDS DU CM1 (`fr-cm1-accords`).
 *
 * Ce fichier a ses propres tables, écrites à part de `cm1Accords.ts` : les verbes à la 3e personne (singulier, pluriel), les noms avec leur genre et leur nombre, les adjectifs
 * et les participes à quatre formes, les pluriels de trente noms. Il RECALCULE l'accord : il lit le sujet (le nom chef, avant le « de » qui introduit un complément, ou la
 * suite du verbe quand la phrase commence par un lieu), en tire le genre et le nombre (le masculin l'emporte sur une coordination), et dit LA forme qui convient. Un mauvais
 * choix n'est jamais cette forme.
 */

type Agreement = "ms" | "fs" | "mp" | "fp";
const AT: Record<Agreement, number> = { ms: 0, fs: 1, mp: 2, fp: 3 };

// ---------------------------------------------------------------------------
// Les tables du test
// ---------------------------------------------------------------------------

const NAMES: Record<string, Agreement> = { awa: "fs", fatou: "fs", khady: "fs", mariama: "fs", moussa: "ms", omar: "ms", pape: "ms" };
const NOUNS: Record<string, Agreement> = {
  pagne: "ms", robe: "fs", poissons: "mp", fleurs: "fp", frère: "ms", sœur: "fs", cousins: "mp", cousines: "fp", cahier: "ms", maison: "fs", enfants: "mp", mangues: "fp",
  chat: "ms", mer: "fs", pêcheur: "ms", pêcheurs: "mp", maîtresse: "fs", élèves: "mp", femmes: "fp", chef: "ms", fille: "fs", filles: "fp", garçons: "mp", voisin: "ms",
  voisine: "fs", village: "ms", mère: "fs", fillettes: "fp", oiseaux: "mp", cahiers: "mp", chats: "mp", villageois: "mp", vagues: "fp", danseurs: "mp", chant: "ms", bruit: "ms",
  porte: "fs", groupe: "ms", maisons: "fp", mangue: "fs",
};
const COMPLEMENT_STARTS = new Set(["de", "du", "des", "que"]);
const PREPOSITIONS = new Set(["dans", "sur", "vers", "au", "sous", "chez"]);

/** Le genre et le nombre d'un groupe sujet : un prénom, un nom chef avant le complément, ou une coordination (le masculin l'emporte). */
function agreementOf(group: string): Agreement | null {
  const lower = group.toLowerCase().trim();
  if (lower.includes(" et ")) {
    const parts = lower.split(" et ").map(agreementOf);
    if (parts.some((part) => part === null)) return null;
    return parts.some((part) => part?.startsWith("m")) ? "mp" : "fp";
  }
  if (NAMES[lower]) return NAMES[lower];
  const tokens = lower.split(" ");
  const cut = tokens.findIndex((token, index) => index >= 1 && COMPLEMENT_STARTS.has(token));
  const head = cut < 0 ? tokens : tokens.slice(0, cut);
  return NOUNS[head[head.length - 1]] ?? null;
}
const isPlural = (agreement: Agreement) => agreement.endsWith("p");

const VERBS: Record<string, [string, string]> = {
  chanter: ["chante", "chantent"], jouer: ["joue", "jouent"], parler: ["parle", "parlent"], danser: ["danse", "dansent"], travailler: ["travaille", "travaillent"], marcher: ["marche", "marchent"],
  porter: ["porte", "portent"], regarder: ["regarde", "regardent"], écouter: ["écoute", "écoutent"], manger: ["mange", "mangent"], finir: ["finit", "finissent"], vendre: ["vend", "vendent"],
  prendre: ["prend", "prennent"], venir: ["vient", "viennent"], faire: ["fait", "font"], aller: ["va", "vont"], dire: ["dit", "disent"], lire: ["lit", "lisent"], voir: ["voit", "voient"], boire: ["boit", "boivent"],
};
const SECOND_PERSON: Record<string, string> = { chanter: "chantes", jouer: "joues", parler: "parles", danser: "danses", travailler: "travailles", marcher: "marches", porter: "portes", regarder: "regardes", écouter: "écoutes", manger: "manges", finir: "finis", vendre: "vends", prendre: "prends", venir: "viens", faire: "fais", aller: "vas", dire: "dis", lire: "lis", voir: "vois", boire: "bois" };
const ADJECTIVES: Record<string, string[]> = {
  joli: ["joli", "jolie", "jolis", "jolies"], grand: ["grand", "grande", "grands", "grandes"], petit: ["petit", "petite", "petits", "petites"], content: ["content", "contente", "contents", "contentes"],
  gentil: ["gentil", "gentille", "gentils", "gentilles"], lourd: ["lourd", "lourde", "lourds", "lourdes"], fatigué: ["fatigué", "fatiguée", "fatigués", "fatiguées"], mûr: ["mûr", "mûre", "mûrs", "mûres"],
  prêt: ["prêt", "prête", "prêts", "prêtes"], long: ["long", "longue", "longs", "longues"], blanc: ["blanc", "blanche", "blancs", "blanches"], beau: ["beau", "belle", "beaux", "belles"],
  nouveau: ["nouveau", "nouvelle", "nouveaux", "nouvelles"], heureux: ["heureux", "heureuse", "heureux", "heureuses"], vieux: ["vieux", "vieille", "vieux", "vieilles"], doux: ["doux", "douce", "doux", "douces"],
  frais: ["frais", "fraîche", "frais", "fraîches"],
};
const PARTICIPLES: Record<string, string[]> = {
  arriver: ["arrivé", "arrivée", "arrivés", "arrivées"], partir: ["parti", "partie", "partis", "parties"], venir: ["venu", "venue", "venus", "venues"], tomber: ["tombé", "tombée", "tombés", "tombées"],
  sortir: ["sorti", "sortie", "sortis", "sorties"], rester: ["resté", "restée", "restés", "restées"], entrer: ["entré", "entrée", "entrés", "entrées"], monter: ["monté", "montée", "montés", "montées"],
  descendre: ["descendu", "descendue", "descendus", "descendues"], aller: ["allé", "allée", "allés", "allées"],
};
const PLURAL: Record<string, string> = {
  chat: "chats", livre: "livres", bateau: "bateaux", gâteau: "gâteaux", oiseau: "oiseaux", cadeau: "cadeaux", cheval: "chevaux", journal: "journaux", animal: "animaux", canal: "canaux", hôpital: "hôpitaux", métal: "métaux",
  bijou: "bijoux", caillou: "cailloux", chou: "choux", genou: "genoux", hibou: "hiboux", joujou: "joujoux", trou: "trous", clou: "clous", sou: "sous", verrou: "verrous", cou: "cous", kangourou: "kangourous",
  jeu: "jeux", feu: "feux", neveu: "neveux", pneu: "pneus", tuyau: "tuyaux", noyau: "noyaux",
};

// ---------------------------------------------------------------------------
// Une vérification par gabarit
// ---------------------------------------------------------------------------

const checkVerb: Check = (exo) => {
  const m = textOf(exo).match(/^(.+?) ___ \((\p{L}+)\)(?: (.+))?\.$/u);
  if (!m) return `phrase à trou illisible : ${textOf(exo)}`;
  const [, before, inf, rest] = m;
  const inverted = PREPOSITIONS.has(before.split(" ")[0].toLowerCase());
  const subject = inverted ? rest : before;
  const agreement = agreementOf(subject ?? "");
  if (agreement === null || !(inf in VERBS)) return `sujet ou verbe inconnu : ${textOf(exo)}`;
  const expected = VERBS[inf][isPlural(agreement) ? 1 : 0];
  const { options, answer } = blankOf(exo);
  const forbidden = new Set([expected]);
  return all(
    ok(answer === expected, `le sujet « ${subject} » (${agreement}) demande ${expected}, pas ${answer}`),
    ok(options.filter((option) => option !== answer).every((option) => !forbidden.has(option) && VERBS[inf].concat(SECOND_PERSON[inf]).includes(option)), `un mauvais choix est la bonne forme ou n'est pas une forme du verbe : ${options.join(" | ")}`),
  );
};

/** Le groupe sujet, la copule et la forme à écrire. */
function copulaFrame(text: string): { subject: string; copula: string } | null {
  const m = text.match(/^(.+) (est|sont) (?:très )?___ \(/u);
  return m ? { subject: m[1], copula: m[2] } : null;
}

const checkAdjective: Check = (exo) => {
  const frame = copulaFrame(textOf(exo));
  const base = textOf(exo).match(/\((\p{L}+)\)\.$/u)?.[1] ?? "";
  if (!frame || !(base in ADJECTIVES)) return `phrase à trou illisible : ${textOf(exo)}`;
  const agreement = agreementOf(frame.subject);
  if (agreement === null) return `sujet inconnu : ${frame.subject}`;
  const expected = ADJECTIVES[base][AT[agreement]];
  const { options, answer } = blankOf(exo);
  return all(
    ok(frame.copula === (isPlural(agreement) ? "sont" : "est"), `le verbe être ne s'accorde pas : ${textOf(exo)}`),
    ok(answer === expected, `« ${frame.subject} » (${agreement}) demande ${expected}, pas ${answer}`),
    ok(options.filter((option) => option !== answer).every((option) => option !== expected && ADJECTIVES[base].includes(option)), `un mauvais choix est la bonne forme : ${options.join(" | ")}`),
  );
};

const checkParticiple: Check = (exo) => {
  const frame = copulaFrame(textOf(exo));
  const inf = textOf(exo).match(/\((\p{L}+)\)/u)?.[1] ?? "";
  if (!frame || !(inf in PARTICIPLES)) return `phrase à trou illisible : ${textOf(exo)}`;
  const agreement = agreementOf(frame.subject);
  if (agreement === null) return `sujet inconnu : ${frame.subject}`;
  const expected = PARTICIPLES[inf][AT[agreement]];
  const { options, answer } = blankOf(exo);
  return all(
    ok(frame.copula === (isPlural(agreement) ? "sont" : "est"), `le verbe être ne s'accorde pas : ${textOf(exo)}`),
    ok(answer === expected, `« ${frame.subject} » (${agreement}) demande ${expected}, pas ${answer}`),
    ok(options.filter((option) => option !== answer).every((option) => option !== expected && PARTICIPLES[inf].includes(option)), `un mauvais choix est la bonne forme : ${options.join(" | ")}`),
  );
};

const quoted = (prompt: string) => [...prompt.matchAll(/« ([^»]+) »/gu)].map((match) => match[1]);

const checkPlural: Check = (exo) => {
  const [word] = quoted(exo.prompt);
  const expected = PLURAL[word];
  return all(ok(expected !== undefined, `nom inconnu : ${word}`), ok(rightOption(exo) === expected, `le pluriel de ${word} est ${expected}, pas ${rightOption(exo)}`), ok(wrongOf(exo).every((option) => option !== expected), "un mauvais choix est le bon pluriel"));
};

const checkWrite: Check = (exo) => {
  const nounMatch = exo.prompt.match(/^Écris le pluriel du mot « (\p{L}+) »\.$/u);
  if (nounMatch) {
    const expected = PLURAL[nounMatch[1]];
    return all(ok(expected !== undefined && exo.answerKey === expected, `le pluriel de ${nounMatch[1]} est ${expected}, pas ${exo.answerKey}`), ok(acceptedOf(exo)[0] === exo.answerKey, "réponse admise"));
  }
  const adjectiveMatch = exo.prompt.match(/^Écris l'adjectif « (\p{L}+) » au (féminin|masculin) pluriel\.$/u);
  if (!adjectiveMatch || !(adjectiveMatch[1] in ADJECTIVES)) return `énoncé illisible : ${exo.prompt}`;
  const forms = ADJECTIVES[adjectiveMatch[1]];
  const expected = adjectiveMatch[2] === "féminin" ? forms[3] : forms[2];
  return all(ok(exo.answerKey === expected, `la réponse est ${expected}, pas ${exo.answerKey}`), ok(expected !== adjectiveMatch[1], "la réponse est écrite dans l'énoncé"), ok(acceptedOf(exo)[0] === exo.answerKey, "réponse admise"));
};

const checkLink: Check = (exo) => {
  const pairs = pairsOf(exo);
  return all(
    ok(pairs.every((pair) => PLURAL[pair.left] === pair.right), `une paire fausse : ${pairs.map((pair) => `${pair.left} ~ ${pair.right}`).join(" ; ")}`),
    ok(pairs.length === 3, "trois paires"),
  );
};

const checkSort: Check = (exo) => {
  const zones = zonesOf(exo);
  const items = itemsOf(exo);
  for (const item of items) {
    const plural = PLURAL[item.text];
    if (plural === undefined) return `nom inconnu : ${item.text}`;
    const zone = plural.endsWith("x") ? "Prend un x" : "Prend un s";
    if (zone !== item.correctZone) return `« ${item.text} » (${plural}) va dans ${zone}, pas ${item.correctZone}`;
  }
  return all(ok(zones.join("|") === "Prend un s|Prend un x", "cases"), ok(zones.every((zone) => items.filter((item) => item.correctZone === zone).length === 3), "trois noms par case"));
};

/** Le sujet d'un verbe dans une phrase : le groupe avant le complément, ou après le verbe quand la phrase commence par un lieu. */
function subjectOf(sentence: string, verbForm: string): string | null {
  const tokens = sentence.replace(/\.$/u, "").split(" ");
  const at = tokens.indexOf(verbForm);
  if (at < 0) return null;
  const inverted = PREPOSITIONS.has(tokens[0].toLowerCase());
  const region = inverted ? tokens.slice(at + 1) : tokens.slice(0, at);
  const cut = region.findIndex((token, index) => index >= 1 && COMPLEMENT_STARTS.has(token));
  return (cut < 0 ? region : region.slice(0, cut)).join(" ");
}

const checkSubject: Check = (exo) => {
  const [sentence, verbForm] = quoted(exo.prompt);
  const expected = subjectOf(sentence, verbForm);
  return all(
    ok(expected !== null && rightOption(exo) === expected, `le sujet de ${verbForm} est ${expected}, pas ${rightOption(exo)}`),
    ok(wrongOf(exo).every((option) => option !== expected && sentence.toLowerCase().includes((option.toLowerCase().split(" ").pop() as string))), `les autres choix sont des mots de la phrase : ${optionsOf(exo).join(" | ")}`),
  );
};

defineMathsTests({
  label: "du français du CM1 (les accords)",
  subject: "Français",
  hintsNeverWriteChoices: true,
  checks: {
    "cm1-acc-verbe": checkVerb,
    "cm1-acc-adjectif": checkAdjective,
    "cm1-acc-participe": checkParticiple,
    "cm1-acc-pluriel": checkPlural,
    "cm1-acc-ecrire": checkWrite,
    "cm1-acc-relier": checkLink,
    "cm1-acc-glisser": checkSort,
    "cm1-acc-sujet": checkSubject,
  },
  topicKinds: {
    "fr-cm1-accords": ["cm1-acc-verbe", "cm1-acc-adjectif", "cm1-acc-participe", "cm1-acc-pluriel", "cm1-acc-ecrire", "cm1-acc-relier", "cm1-acc-glisser", "cm1-acc-sujet"],
  },
});

describe("les tableaux des accords s'accordent avec ceux écrits à part", () => {
  it("chaque forme de chaque verbe, adjectif et participe est la même dans les deux tableaux", () => {
    expect(Object.keys(SOURCE_VERBS).sort()).toEqual(Object.keys(VERBS).sort());
    for (const [inf, forms] of Object.entries(SOURCE_VERBS)) expect([forms.one, forms.many, forms.you], inf).toEqual([VERBS[inf][0], VERBS[inf][1], SECOND_PERSON[inf]]);
    expect(Object.keys(SOURCE_ADJECTIVES).sort()).toEqual(Object.keys(ADJECTIVES).sort());
    for (const [base, forms] of Object.entries(SOURCE_ADJECTIVES)) expect([...forms], base).toEqual(ADJECTIVES[base]);
    expect(Object.keys(SOURCE_PARTICIPLES).sort()).toEqual(Object.keys(PARTICIPLES).sort());
    for (const [inf, forms] of Object.entries(SOURCE_PARTICIPLES)) expect([...forms], inf).toEqual(PARTICIPLES[inf]);
  });

  it("les trente noms et leur pluriel sont les mêmes dans les deux tableaux, avec deux fautes qui ne sont pas le pluriel", () => {
    expect(PLURALS).toHaveLength(30);
    for (const entry of PLURALS) {
      expect(PLURAL[entry.one], entry.one).toBe(entry.many);
      expect(entry.faults.every((fault) => fault !== entry.many && fault !== entry.one), entry.one).toBe(true);
      expect(new Set(entry.faults).size).toBe(2);
    }
    expect(Object.keys(PLURAL).sort()).toEqual(PLURALS.map((entry) => entry.one).sort());
  });

  it("les règles : les noms en -eau, -al, -eu, -au font -x sauf pneu ; les noms en -ou font -s sauf sept", () => {
    const x = ["bijou", "caillou", "chou", "genou", "hibou", "joujou"];
    for (const [one, many] of Object.entries(PLURAL)) {
      const expected = /(eau|al|au|eu)$/u.test(one) && one !== "pneu" ? `${one.replace(/al$/u, "au")}x` : /ou$/u.test(one) ? (x.includes(one) ? `${one}x` : `${one}s`) : `${one}s`;
      expect(many, one).toBe(expected);
    }
  });

  it("toutes les lignes de chaque tableau passent la vérification de leur gabarit", () => {
    const gapOf = (row: { text: string; answer: string; wrong: readonly string[] }) => ({ prompt: "Complète la phrase.", answerKey: row.answer, hints: [], payload: { text: row.text, blanks: [{ options: [row.answer, ...row.wrong], answer: row.answer }] } }) as Exo;
    const qcmOf = (row: { prompt: string; answer: string; wrong: readonly string[] }) => ({ prompt: row.prompt, answerKey: row.answer, hints: [], payload: { options: [row.answer, ...row.wrong], correctIndex: 0 } }) as Exo;
    for (const row of VERB_ROWS) expect(checkVerb(gapOf(row)), row.text).toBeNull();
    for (const row of ADJECTIVE_ROWS) expect(checkAdjective(gapOf(row)), row.text).toBeNull();
    for (const row of PARTICIPLE_ROWS) expect(checkParticiple(gapOf(row)), row.text).toBeNull();
    for (const row of PLURAL_ROWS) expect(checkPlural(qcmOf(row)), row.prompt).toBeNull();
    for (const row of SUBJECT_ROWS) expect(checkSubject(qcmOf(row)), row.prompt).toBeNull();
    for (const row of WRITE_ROWS) expect(checkWrite({ prompt: row.prompt, answerKey: row.accepted[0], hints: [], payload: { acceptedAnswers: [...row.accepted] } } as Exo), row.prompt).toBeNull();
    for (const row of LINK_ROWS) expect(checkLink({ prompt: row.prompt, answerKey: "", hints: [], payload: { pairs: row.pairs } } as Exo), row.prompt).toBeNull();
    for (const row of SORT_ROWS) expect(checkSort({ prompt: row.prompt, answerKey: "", hints: [], payload: { zones: [...row.zones], items: row.items.map((item) => ({ text: item.text, correctZone: item.zone })) } } as Exo), JSON.stringify(row.items)).toBeNull();
    for (const [name, rows] of [["verbe", VERB_ROWS], ["adjectif", ADJECTIVE_ROWS], ["participe", PARTICIPLE_ROWS], ["pluriel", PLURAL_ROWS], ["sujet", SUBJECT_ROWS], ["écrire", WRITE_ROWS], ["relier", LINK_ROWS], ["glisser", SORT_ROWS]] as const) {
      expect(rows.length, name).toBe(30);
    }
  });

  it("chaque ligne à trou a trois choix différents, et les sujets du tableau ont une longueur voisine", () => {
    for (const row of [...VERB_ROWS, ...ADJECTIVE_ROWS, ...PARTICIPLE_ROWS]) expect(new Set([row.answer, ...row.wrong]).size, row.text).toBe(3);
    for (const row of [...PLURAL_ROWS, ...SUBJECT_ROWS]) {
      expect(new Set([row.answer, ...row.wrong]).size, row.prompt).toBe(3);
      expect(row.answer.length, row.prompt).toBeLessThanOrEqual(2 * Math.max(...row.wrong.map((option) => option.length)));
    }
    expect(SUBJECT_LIST).toHaveLength(30);
  });

  it("aucune ligne en double dans un tableau", () => {
    for (const keys of [VERB_ROWS.map((row) => row.text), ADJECTIVE_ROWS.map((row) => row.text), PARTICIPLE_ROWS.map((row) => row.text), PLURAL_ROWS.map((row) => row.prompt), SUBJECT_ROWS.map((row) => row.prompt), WRITE_ROWS.map((row) => row.prompt), LINK_ROWS.map((row) => JSON.stringify(row.pairs)), SORT_ROWS.map((row) => JSON.stringify(row.items))]) {
      expect(new Set(keys).size).toBe(keys.length);
    }
  });
});

describe("les vérifications des accords voient un énoncé abîmé", () => {
  const gap = (text: string, options: string[], answer: string) => ({ type: "fill-blank", prompt: "x", answerKey: answer, hints: [], payload: { text, blanks: [{ options, answer }] } }) as Exo;
  const qcm = (prompt: string, options: string[], correctIndex: number) => ({ type: "qcm", prompt, answerKey: options[correctIndex], hints: [], payload: { options, correctIndex } }) as Exo;

  it("l'accord se fait avec le nom chef, pas avec le mot le plus proche", () => {
    expect(checkVerb(gap("Les enfants du village ___ (chanter) le soir.", ["chantent", "chante", "chantes"], "chantent"))).toBeNull();
    expect(checkVerb(gap("Les enfants du village ___ (chanter) le soir.", ["chantent", "chante", "chantes"], "chante"))).not.toBeNull();
    expect(checkVerb(gap("Le chef des pêcheurs ___ (parler) au village.", ["parle", "parlent", "parles"], "parle"))).toBeNull();
    expect(checkVerb(gap("Dans la cour ___ (jouer) les enfants.", ["jouent", "joue", "joues"], "jouent"))).toBeNull();
    expect(checkVerb(gap("Dans la cour ___ (jouer) les enfants.", ["jouent", "joue", "joues"], "joue"))).not.toBeNull();
  });

  it("le masculin l'emporte sur une coordination, le féminin seulement entre filles", () => {
    expect(checkAdjective(gap("Awa et Omar sont ___ (content).", ["contents", "contentes", "content"], "contents"))).toBeNull();
    expect(checkAdjective(gap("Awa et Omar sont ___ (content).", ["contents", "contentes", "content"], "contentes"))).not.toBeNull();
    expect(checkParticiple(gap("Awa et Fatou sont ___ (partir) tôt.", ["parties", "partis", "parti"], "parties"))).toBeNull();
    expect(checkParticiple(gap("Awa est ___ (partir) tôt.", ["parties", "partie", "parti"], "partie"))).toBeNull();
  });

  it("le pluriel : cheval en -aux, trou en -s, bijou en -x", () => {
    expect(checkPlural(qcm("Quel est le pluriel du mot « cheval » ?", ["chevaux", "chevals", "chevaus"], 0))).toBeNull();
    expect(checkPlural(qcm("Quel est le pluriel du mot « cheval » ?", ["chevaux", "chevals", "chevaus"], 1))).not.toBeNull();
    expect(checkPlural(qcm("Quel est le pluriel du mot « trou » ?", ["troux", "trous", "troues"], 1))).toBeNull();
    expect(checkPlural(qcm("Quel est le pluriel du mot « bijou » ?", ["bijous", "bijoux", "bijoues"], 0))).not.toBeNull();
  });

  it("le sujet : avant le complément du nom, ou après le verbe", () => {
    expect(checkSubject(qcm("Lis la phrase « Le chef des pêcheurs parle au village. ». Quel est le sujet du verbe « parle » ?", ["Le chef", "les pêcheurs", "le village"], 0))).toBeNull();
    expect(checkSubject(qcm("Lis la phrase « Le chef des pêcheurs parle au village. ». Quel est le sujet du verbe « parle » ?", ["Le chef", "les pêcheurs", "le village"], 1))).not.toBeNull();
    expect(checkSubject(qcm("Lis la phrase « Dans la cour jouent les enfants du village. ». Quel est le sujet du verbe « jouent » ?", ["les enfants", "la cour", "le village"], 0))).toBeNull();
  });
});
