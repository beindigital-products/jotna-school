import { describe, expect, it } from "vitest";
import { ATTRIBUTE_LIST, ATTRIBUTE_ROWS, CC_LIST, CC_ROWS, CORPUS, DECLARATIVE, EXCLAMATIVE, FONCTION_ROWS, FORM_ROWS, IMPERATIVE, INTERROGATIVE, LINK_ROWS, NATURE_ROWS, NEGATIVE, PRONOUN_ROWS, SORT_ROWS, TYPE_ROWS, VOCABULARY, WRITE_ROWS } from "../paliers/games/cm1Grammaire";
import { acceptedOf, all, blankOf, defineMathsTests, itemsOf, ok, optionsOf, pairsOf, rightOption, textOf, wrongOf, zonesOf, type Check, type Exo } from "@/lib/test-support/cm1MathsKit";

/**
 * LA GRAMMAIRE DU CM1 (`fr-cm1-grammaire`).
 *
 * Ce fichier a sa propre analyse de phrase, écrite à part de `cm1Grammaire.ts` : il lit une phrase (la ponctuation et le premier mot disent son type, « ne … pas »
 * dit sa forme), y cherche le verbe dans une liste de formes, le sujet qui le précède, puis range ce qui le suit : un groupe qui commence par un déterminant est le
 * COD, un groupe en à, au, aux est le COI si le verbe se construit avec à (sinon un lieu), un groupe en dans, sous, sur, chez, devant, vers un lieu, en avec ou
 * un adverbe en -ment une manière, un mot comme « hier » un temps ; après est, devient, semble, tout est l'attribut. Un lexique écrit à part donne la nature
 * des mots demandés (un seul sens par mot). Chaque question est RECALCULÉE avec ces règles, jamais relue dans le gabarit.
 */

type Kind = "déclarative" | "interrogative" | "exclamative" | "impérative";
type Nature = "Nom" | "Déterminant" | "Adjectif" | "Verbe" | "Adverbe" | "Pronom";

// ---------------------------------------------------------------------------
// Le lexique : un seul sens par mot
// ---------------------------------------------------------------------------

const LEXICON: Record<Nature, string[]> = {
  Nom: [
    ...["awa", "moussa", "omar", "fatou", "pape", "khady", "mariama"],
    ...["mangue", "mangues", "filet", "enfants", "enfant", "chanson", "pêcheur", "seau", "sœur", "repas", "télévision", "femmes", "chef", "riz", "vaisselle", "baobab", "cour", "mer"],
    ...["légumes", "joie", "marché", "maître", "élèves", "tante", "maîtresse", "lion", "frère", "cahier", "paysage", "film", "oiseaux", "voisins", "radio"],
    ...["natte", "pagne", "école", "champ", "puits", "voisin", "village", "poisson", "pirogue", "maison"],
  ],
  Déterminant: ["un", "une", "des", "le", "la", "les", "mon", "ma", "mes", "ton", "ta", "tes", "son", "sa", "ses", "notre", "nos", "ce", "cet", "cette", "ces", "du", "leur", "leurs"],
  Adjectif: ["contente", "fatigué", "mûres", "grand", "beau", "petite", "petits", "bon", "délicieux", "vieux", "joli", "content", "gentil", "heureux", "courageux", "tranquille", "lent", "bruyant", "calme", "belle", "fatiguée", "immense", "lourdes", "attentifs", "pressée", "frais", "fraîches", "gentilles", "chaude", "énormes", "magnifique", "grands", "longue", "brûlant", "jolies", "propre", "fières"],
  Verbe: ["donne", "mange", "chantent", "prépare", "regarde", "vendent", "dort", "jouent", "vend", "voit", "est", "sont", "devient", "irons", "parle", "répond", "téléphone", "obéissent", "mangeons", "écoutes", "répare", "prends", "viens", "lisent", "écoutent", "raconte", "rentre", "cherche", "sourit"],
  Adverbe: ["hier", "demain", "doucement", "bien", "joliment", "rapidement", "gentiment", "souvent", "lentement", "toujours", "vite", "rarement", "bientôt", "très"],
  Pronom: ["je", "tu", "il", "elle", "nous", "vous", "ils", "elles"],
};
const NATURE_OF = new Map<string, Nature>();
for (const [nature, words] of Object.entries(LEXICON) as [Nature, string[]][]) {
  for (const word of words) {
    if (NATURE_OF.has(word) && NATURE_OF.get(word) !== nature) throw new Error(`le lexique donne deux natures à « ${word} »`);
    NATURE_OF.set(word, nature);
  }
}
const natureOf = (word: string): Nature | undefined => NATURE_OF.get(word.toLowerCase());

// ---------------------------------------------------------------------------
// L'analyse d'une phrase
// ---------------------------------------------------------------------------

const DET = new Set(LEXICON.Déterminant);
const PLACE_PREPOSITIONS = new Set(["dans", "sous", "sur", "chez", "devant", "vers"]);
const MANNER_ADVERBS = new Set(["doucement", "rapidement", "lentement", "joliment", "gentiment", "poliment", "attentivement", "bien"]);
const TIME_ADVERBS = new Set(["souvent", "toujours", "rarement", "bientôt", "hier", "demain"]);
const TIME_HEAD = /^(hier soir|hier matin|hier|demain|après-demain|ce matin|ce soir|le soir|chaque matin|samedi|plus tard|tous les jours)$/iu;
const COPULAS = new Set(["est", "sont", "devient", "deviennent", "semble", "semblent", "reste", "restent", "paraît", "paraissent"]);
const COI_VERBS = new Set(["parle", "parlent", "répond", "téléphone", "obéissent", "obéit", "écrit", "sourit"]);
const IMPERATIVES = new Set(["prends", "viens", "ferme", "range", "écoute", "mange", "lave", "finis"]);
const VERB_FORMS = new Set([
  ...["mange", "mangent", "mangeons", "lance", "chantent", "chante", "porte", "prépare", "préparent", "regarde", "vendent", "vend", "donne", "dort", "jouent", "danse", "marche"],
  ...["irons", "parle", "répond", "téléphone", "obéissent", "obéit", "voit", "est", "sont", "devient", "semble", "écoutes", "écoutent", "répare", "lit", "lisent", "lave", "lavent"],
  ...["raconte", "attend", "range", "rentre", "rentrent", "travaille", "écrit", "voyage", "prend", "cherche", "sourit", "parlent", "reste", "restent", "paraît", "deviennent", "dormons", "brille"],
]);
const AUX = new Set(["a", "ont", "avons"]);
const PARTICIPLES = new Set(["lavé", "vu", "préparé", "mangé"]);
const NEGATIONS = new Set(["pas", "plus", "jamais"]);
const BOUNDARIES = new Set(["à", "au", "aux", "avec", ...PLACE_PREPOSITIONS, ...MANNER_ADVERBS, ...TIME_ADVERBS]);

type Analysis = { kind: Kind; negative: boolean; subject?: string; verb: string; cod?: string; coi?: string; attribute?: string; cc: [string, string][] };
function analyse(text: string): Analysis | string {
  const last = text.slice(-1);
  let body = text.replace(/\s*[.!?]$/u, "");
  const first = body.split(" ")[0].toLowerCase();
  const kind: Kind = last === "?" ? "interrogative" : IMPERATIVES.has(first) ? "impérative" : last === "!" && ["comme", "que", "quel", "quelle"].includes(first) ? "exclamative" : "déclarative";
  const negative = /(?:^|\s)(?:ne|n')/u.test(body) && /\b(?:pas|plus|jamais)\b/u.test(body);
  const cc: [string, string][] = [];
  const comma = body.indexOf(", ");
  if (comma > 0 && TIME_HEAD.test(body.slice(0, comma))) {
    cc.push([body.slice(0, comma), "temps"]);
    body = body.slice(comma + 2);
  }
  let tokens = body.replace(/\bn'/gu, "ne ").split(" ");
  if (kind === "exclamative" && ["comme", "que"].includes(tokens[0].toLowerCase())) tokens = tokens.slice(1);
  let at = -1;
  let length = 1;
  if (kind === "impérative") at = 0;
  else {
    for (let i = 0; i < tokens.length; i++) {
      if (AUX.has(tokens[i]) && PARTICIPLES.has(tokens[i + 1])) {
        at = i;
        length = 2;
        break;
      }
      if (VERB_FORMS.has(tokens[i].toLowerCase())) {
        at = i;
        break;
      }
    }
  }
  if (at < 0) return `verbe introuvable : ${text}`;
  const subjectTokens = tokens.slice(0, at).filter((token) => token !== "ne");
  const verb = tokens.slice(at, at + length).join(" ");
  const after = tokens.slice(at + length).filter((token) => !(negative && NEGATIONS.has(token)));
  const result: Analysis = { kind, negative, subject: subjectTokens.length > 0 ? subjectTokens.join(" ") : undefined, verb, cc };
  const verbEnd = tokens[at + length - 1].toLowerCase();
  if (COPULAS.has(verbEnd)) {
    result.attribute = after.join(" ");
    return result;
  }
  for (let i = 0; i < after.length; ) {
    const head = after[i].toLowerCase();
    if (MANNER_ADVERBS.has(head)) {
      cc.push([after[i], "manière"]);
      i += 1;
      continue;
    }
    if (TIME_ADVERBS.has(head)) {
      cc.push([after[i], "temps"]);
      i += 1;
      continue;
    }
    let j = i + 1;
    while (j < after.length && !BOUNDARIES.has(after[j].toLowerCase())) j++;
    const group = after.slice(i, j).join(" ");
    // « ne … pas de seau » : le « de » de la négation introduit un COD.
    if (DET.has(head) || head === "de") result.cod = group;
    else if (["à", "au", "aux"].includes(head)) {
      if (COI_VERBS.has(verbEnd)) result.coi = group;
      else cc.push([group, "lieu"]);
    } else if (head === "avec") cc.push([group, "manière"]);
    else if (PLACE_PREPOSITIONS.has(head)) cc.push([group, "lieu"]);
    else return `groupe inconnu : ${group} dans ${text}`;
    i = j;
  }
  return result;
}

const FUNCTION_LABEL = { sujet: "Sujet", cod: "COD", coi: "COI", attribut: "Attribut du sujet", cc: "Complément circonstanciel" };
/** Le groupe demandé et sa fonction, d'après l'analyse. */
function functionOf(text: string, group: string): string | null {
  const a = analyse(text);
  if (typeof a === "string") return null;
  if (a.subject === group) return FUNCTION_LABEL.sujet;
  if (a.cod === group) return FUNCTION_LABEL.cod;
  if (a.coi === group) return FUNCTION_LABEL.coi;
  if (a.attribute === group) return FUNCTION_LABEL.attribut;
  if (a.cc.some(([cc]) => cc === group)) return FUNCTION_LABEL.cc;
  return null;
}

// Le genre et le nombre, pour le pronom du sujet et le pronom du complément.
const MASCULINE_NAMES = new Set(["moussa", "omar", "pape"]);
const FEMININE_NAMES = new Set(["awa", "fatou", "khady", "mariama"]);
const NOUN_GENDER: Record<string, "m" | "f"> = { enfants: "m", femmes: "f", élèves: "m", pêcheurs: "m", oiseaux: "m", mangues: "f", poissons: "m", amies: "f", parents: "m", cousins: "m", étoiles: "f", assiettes: "f", villageois: "m" };
const SINGULAR_MASCULINE = new Set(["un", "le", "mon", "ton", "son", "ce", "cet", "du", "notre"]);
const SINGULAR_FEMININE = new Set(["une", "la", "ma", "ta", "sa", "cette"]);
const PLURAL_DETERMINERS = new Set(["des", "les", "mes", "tes", "ses", "ces", "nos", "leurs"]);
function subjectPronoun(subject: string): string | null {
  const lower = subject.toLowerCase();
  if (["je", "tu", "il", "elle", "nous", "vous", "ils", "elles"].includes(lower)) return null;
  if (lower.includes(" et ")) {
    const names = lower.split(" et ");
    return names.every((name) => FEMININE_NAMES.has(name)) ? "elles" : "ils";
  }
  if (MASCULINE_NAMES.has(lower)) return "il";
  if (FEMININE_NAMES.has(lower)) return "elle";
  const words = lower.split(" ");
  if (PLURAL_DETERMINERS.has(words[0])) return NOUN_GENDER[words[words.length - 1]] === "f" ? "elles" : "ils";
  if (SINGULAR_MASCULINE.has(words[0])) return "il";
  if (SINGULAR_FEMININE.has(words[0])) return "elle";
  return null;
}
function complementPronoun(group: string, kind: "cod" | "coi"): string | null {
  const words = group.toLowerCase().split(" ");
  if (kind === "coi") return words[0] === "aux" || (words[0] === "à" && PLURAL_DETERMINERS.has(words[1])) ? "leur" : "lui";
  if (PLURAL_DETERMINERS.has(words[0])) return "les";
  if (SINGULAR_MASCULINE.has(words[0])) return "le";
  if (SINGULAR_FEMININE.has(words[0])) return "la";
  return null;
}
const INFINITIVES: Record<string, string> = {
  mange: "manger", lance: "lancer", chantent: "chanter", chante: "chanter", porte: "porter", prépare: "préparer", regarde: "regarder", vendent: "vendre", vend: "vendre", donne: "donner",
  "a lavé": "laver", dort: "dormir", jouent: "jouer", danse: "danser", marche: "marcher", irons: "aller", parle: "parler", répond: "répondre", téléphone: "téléphoner", obéissent: "obéir",
  voit: "voir", est: "être", sont: "être", devient: "devenir", prends: "prendre", viens: "venir", mangeons: "manger", "ont préparé": "préparer", écoutes: "écouter", répare: "réparer",
};

const quotedAll = (prompt: string) => [...prompt.matchAll(/« ([^»]+) »/gu)].map((match) => match[1]);

// ---------------------------------------------------------------------------
// Une vérification par gabarit
// ---------------------------------------------------------------------------

const checkNature: Check = (exo) => {
  const [word, sentence] = quotedAll(exo.prompt);
  const nature = natureOf(word);
  return all(
    ok(nature !== undefined, `mot absent du lexique : ${word}`),
    ok(sentence.split(/[ ,.!?]+/u).includes(word), `le mot n'est pas dans la phrase : ${exo.prompt}`),
    ok(rightOption(exo) === nature, `« ${word} » est ${nature}, pas ${rightOption(exo)}`),
    ok(wrongOf(exo).every((option) => option !== nature), "un mauvais choix est la bonne nature"),
  );
};

const checkFunction: Check = (exo) => {
  const [sentence, group] = quotedAll(exo.prompt);
  const fonction = functionOf(sentence, group);
  return all(ok(fonction !== null, `groupe introuvable : ${exo.prompt}`), ok(rightOption(exo) === fonction, `« ${group} » est ${fonction}, pas ${rightOption(exo)}`), ok(wrongOf(exo).every((option) => option !== fonction), "un mauvais choix est la bonne fonction"));
};

const checkCc: Check = (exo) => {
  const [sentence, group] = quotedAll(exo.prompt);
  const a = analyse(sentence);
  if (typeof a === "string") return a;
  const found = a.cc.filter(([text]) => text === group);
  return all(
    ok(found.length === 1, `complément introuvable : ${exo.prompt}`),
    ok(a.cc.length === 1, `plus d'un complément circonstanciel dans la phrase : ${sentence}`),
    ok(rightOption(exo) === `Complément de ${found[0]?.[1]}`, `« ${group} » est de type ${found[0]?.[1]}, pas ${rightOption(exo)}`),
    ok(new Set(optionsOf(exo)).size === 3, "trois types"),
  );
};

const kindOfSentence = (text: string): Kind | null => {
  const a = analyse(text);
  if (typeof a !== "string") return a.kind;
  // Une phrase sans verbe de la liste (« Quelle belle journée ! », « Où va le pêcheur ? ») se lit à sa ponctuation.
  const first = text.split(" ")[0].toLowerCase();
  if (text.endsWith("?")) return "interrogative";
  if (text.endsWith("!") && ["comme", "que", "quel", "quelle"].includes(first)) return "exclamative";
  return null;
};
const isNegative = (text: string) => /(?:^|\s)(?:ne|n')/u.test(text) && /\b(?:pas|plus|jamais)\b/u.test(text);

const checkType: Check = (exo) => {
  const wanted = exo.prompt.match(/^Quelle phrase est (\p{L}+) \?$/u)?.[1];
  return all(
    ok(wanted !== undefined, `énoncé illisible : ${exo.prompt}`),
    ok(kindOfSentence(rightOption(exo)) === wanted, `« ${rightOption(exo)} » n'est pas ${wanted}`),
    ok(wrongOf(exo).every((text) => kindOfSentence(text) !== null && kindOfSentence(text) !== wanted), `un mauvais choix est ${wanted} : ${optionsOf(exo).join(" | ")}`),
  );
};

const checkForm: Check = (exo) => {
  const wanted = exo.prompt.match(/^Quelle phrase est à la forme (négative|affirmative) \?$/u)?.[1];
  const negative = wanted === "négative";
  return all(
    ok(wanted !== undefined, `énoncé illisible : ${exo.prompt}`),
    ok(isNegative(rightOption(exo)) === negative, `« ${rightOption(exo)} » n'est pas ${wanted}`),
    ok(wrongOf(exo).every((text) => isNegative(text) !== negative), `un mauvais choix est ${wanted}`),
  );
};

const checkAttribute: Check = (exo) => {
  const [sentence] = quotedAll(exo.prompt);
  const a = analyse(sentence);
  if (typeof a === "string") return a;
  return all(
    ok(COPULAS.has(a.verb.toLowerCase()), `le verbe n'est pas un verbe d'état : ${a.verb}`),
    ok(a.attribute !== undefined && natureOf(a.attribute) === "Adjectif", `l'attribut n'est pas un adjectif connu : ${a.attribute}`),
    ok(rightOption(exo) === a.attribute, `l'attribut est ${a.attribute}, pas ${rightOption(exo)}`),
    ok(wrongOf(exo).includes(a.subject as string) && wrongOf(exo).includes(a.verb), "les mauvais choix sont le sujet et le verbe"),
  );
};

const checkPronoun: Check = (exo) => {
  const m = textOf(exo).match(/^(.+?\.) (\p{L}+) ___ (\p{L}+)\.$/u);
  if (!m) return `phrase à trou illisible : ${textOf(exo)}`;
  const a = analyse(m[1]);
  if (typeof a === "string") return a;
  const { options, answer } = blankOf(exo);
  const complement = a.cod !== undefined ? ([a.cod, "cod"] as const) : a.coi !== undefined ? ([a.coi, "coi"] as const) : null;
  if (complement === null) return `aucun complément à remplacer : ${m[1]}`;
  const expected = complementPronoun(complement[0], complement[1]);
  return all(
    ok(a.cc.length === 0 && a.attribute === undefined && !a.negative && !(a.cod !== undefined && a.coi !== undefined), `plusieurs compléments : ${m[1]}`),
    ok(answer === expected, `le pronom est ${expected}, pas ${answer}`),
    ok(m[2].toLowerCase() === subjectPronoun(a.subject as string), `le sujet « ${a.subject} » se remplace par ${subjectPronoun(a.subject as string)}, pas ${m[2]}`),
    ok(m[3] === a.verb, `le verbe est ${a.verb}, pas ${m[3]}`),
    ok(!/^[aeiouyéèêâîôûh]/iu.test(m[3]) || complement[1] === "coi", "un pronom le, la devant une voyelle s'élide"),
    ok(options.filter((option) => option === expected).length === 1, "une seule bonne réponse"),
  );
};

const checkWrite: Check = (exo) => {
  const [sentence] = quotedAll(exo.prompt);
  const a = analyse(sentence);
  if (typeof a === "string") return a;
  if (exo.prompt.startsWith("Écris l'infinitif")) {
    const expected = INFINITIVES[a.verb.toLowerCase()];
    return all(ok(expected !== undefined, `infinitif inconnu : ${a.verb}`), ok(exo.answerKey === expected, `l'infinitif de ${a.verb} est ${expected}, pas ${exo.answerKey}`), ok(acceptedOf(exo)[0] === expected, "réponse admise"));
  }
  const expected = subjectPronoun(a.subject as string);
  return all(
    ok(exo.prompt.startsWith("Quel pronom personnel remplace le sujet dans la phrase"), "énoncé inattendu"),
    ok(expected !== null, `sujet sans pronom : ${a.subject}`),
    ok(exo.answerKey === expected, `le pronom est ${expected}, pas ${exo.answerKey}`),
  );
};

const checkLink: Check = (exo) => {
  const [sentence] = quotedAll(exo.prompt);
  const words = sentence.split(/[ ,.!?]+/u);
  const pairs = pairsOf(exo);
  for (const pair of pairs) {
    if (!words.includes(pair.left)) return `« ${pair.left} » n'est pas dans la phrase`;
    if (natureOf(pair.left) !== pair.right) return `« ${pair.left} » est ${natureOf(pair.left)}, pas ${pair.right}`;
  }
  return ok(pairs.length === 3 && new Set(pairs.map((pair) => pair.right)).size === 3, "trois mots de trois natures");
};

const checkSort: Check = (exo) => {
  const zones = zonesOf(exo);
  const items = itemsOf(exo);
  const wordSort = zones.every((zone) => (zone as Nature) in LEXICON);
  for (const item of items) {
    if (wordSort) {
      if (natureOf(item.text) !== item.correctZone) return `« ${item.text} » est ${natureOf(item.text)}, pas ${item.correctZone}`;
    } else if (zones.includes("Affirmative")) {
      if ((isNegative(item.text) ? "Négative" : "Affirmative") !== item.correctZone) return `« ${item.text} » n'est pas ${item.correctZone}`;
    } else {
      const kind = kindOfSentence(item.text);
      if (kind === null || kind[0].toUpperCase() + kind.slice(1) !== item.correctZone) return `« ${item.text} » n'est pas ${item.correctZone}`;
    }
  }
  return all(
    ok(zones.length === 2 && new Set(zones).size === 2, `cases : ${zones.join(", ")}`),
    ok(zones.every((zone) => items.filter((item) => item.correctZone === zone).length === 3), "trois étiquettes par case"),
  );
};

defineMathsTests({
  label: "du français du CM1 (la grammaire)",
  subject: "Français",
  hintsNeverWriteChoices: true,
  checks: {
    "cm1-gra-nature": checkNature,
    "cm1-gra-fonction": checkFunction,
    "cm1-gra-cc": checkCc,
    "cm1-gra-type": checkType,
    "cm1-gra-forme": checkForm,
    "cm1-gra-attribut": checkAttribute,
    "cm1-gra-pronom": checkPronoun,
    "cm1-gra-ecrire": checkWrite,
    "cm1-gra-relier": checkLink,
    "cm1-gra-glisser": checkSort,
  },
  topicKinds: {
    "fr-cm1-grammaire": ["cm1-gra-nature", "cm1-gra-fonction", "cm1-gra-cc", "cm1-gra-type", "cm1-gra-forme", "cm1-gra-attribut", "cm1-gra-pronom", "cm1-gra-ecrire", "cm1-gra-relier", "cm1-gra-glisser"],
  },
});

// ---------------------------------------------------------------------------
// Les tableaux eux-mêmes, relus avec l'analyse du test
// ---------------------------------------------------------------------------

describe("le corpus de phrases s'accorde avec l'analyse écrite à part", () => {
  it("chaque phrase du corpus a le type, la forme, le sujet, le verbe, le COD, le COI, l'attribut et les compléments que l'analyse trouve", () => {
    for (const sentence of CORPUS) {
      const a = analyse(sentence.text);
      expect(typeof a, sentence.text).not.toBe("string");
      const found = a as Analysis;
      expect(found.kind, sentence.text).toBe(sentence.kind);
      expect(found.negative, sentence.text).toBe(sentence.negative);
      expect(found.subject, sentence.text).toBe(sentence.subject);
      expect(found.verb, sentence.text).toBe(sentence.verb);
      expect(found.cod, sentence.text).toBe(sentence.cod);
      expect(found.coi, sentence.text).toBe(sentence.coi);
      expect(found.attribute, sentence.text).toBe(sentence.attribute);
      expect(found.cc, sentence.text).toEqual(sentence.cc.map(([text, kind]) => [text, kind]));
    }
  });

  it("chaque mot demandé a la nature que le lexique lui donne, et se lit dans sa phrase", () => {
    for (const sentence of CORPUS) {
      const tokens = sentence.text.split(/[ ,.!?]+/u);
      for (const [word, nature] of sentence.words) {
        expect(tokens, `${word} dans ${sentence.text}`).toContain(word);
        expect(natureOf(word), `${word} dans ${sentence.text}`).toBe(nature);
      }
    }
  });

  it("une phrase impérative n'a pas de sujet ; les autres en ont un", () => {
    for (const sentence of CORPUS) expect(sentence.subject === undefined, sentence.text).toBe(sentence.kind === "impérative");
  });

  it("les phrases rangées par type et par forme ont bien le type et la forme de leur liste", () => {
    for (const text of DECLARATIVE) expect([kindOfSentence(text), isNegative(text)], text).toEqual(["déclarative", false]);
    for (const text of NEGATIVE) expect([kindOfSentence(text), isNegative(text)], text).toEqual(["déclarative", true]);
    for (const text of INTERROGATIVE) expect(kindOfSentence(text), text).toBe("interrogative");
    for (const text of EXCLAMATIVE) expect(kindOfSentence(text), text).toBe("exclamative");
    for (const text of IMPERATIVE) expect(kindOfSentence(text), text).toBe("impérative");
  });

  it("les trente compléments circonstanciels sont les seuls de leur phrase, avec le sens que l'analyse leur trouve", () => {
    expect(CC_LIST).toHaveLength(30);
    for (const entry of CC_LIST) {
      const a = analyse(entry.text) as Analysis;
      expect(typeof a, entry.text).not.toBe("string");
      expect(a.cc, entry.text).toEqual([[entry.group, entry.kind]]);
    }
  });

  it("les trente attributs sont des adjectifs derrière un verbe d'état", () => {
    expect(ATTRIBUTE_LIST).toHaveLength(30);
    for (const entry of ATTRIBUTE_LIST) {
      const a = analyse(entry.text) as Analysis;
      expect(typeof a, entry.text).not.toBe("string");
      expect([a.subject, a.verb, a.attribute], entry.text).toEqual([entry.subject, entry.verb, entry.attribute]);
      expect(COPULAS.has(a.verb), entry.text).toBe(true);
    }
  });

  it("les trente phrases du pronom ne remplacent qu'un complément, avec le pronom du genre et du nombre", () => {
    expect(PRONOUN_ROWS).toHaveLength(30);
    for (const row of PRONOUN_ROWS) {
      const exo = { prompt: "Complète avec le bon pronom.", answerKey: row.answer, hints: [], payload: { text: row.text, blanks: [{ options: [row.answer, ...row.wrong], answer: row.answer }] } } as Exo;
      expect(checkPronoun(exo), row.text).toBeNull();
    }
  });

  it("les mots des glissés n'ont qu'une nature dans le lexique, celle de leur liste", () => {
    for (const [nature, words] of Object.entries(VOCABULARY)) {
      for (const word of words) expect(natureOf(word), `${word} (${nature})`).toBe(nature);
      expect(new Set(words).size).toBe(words.length);
    }
  });
});

describe("les vérifications de grammaire voient un énoncé abîmé", () => {
  const qcm = (prompt: string, options: string[], correctIndex: number) => ({ type: "qcm", prompt, answerKey: options[correctIndex], hints: [], payload: { options, correctIndex, game: { kind: "x", level: 3 } } }) as Exo;

  it("la fonction d'un groupe se lit dans la phrase", () => {
    const prompt = "Dans la phrase « Awa parle à Moussa. », quelle est la fonction du groupe « à Moussa » ?";
    expect(checkFunction(qcm(prompt, ["COI", "COD", "Sujet"], 0))).toBeNull();
    expect(checkFunction(qcm(prompt, ["COI", "COD", "Sujet"], 1))).not.toBeNull();
    expect(checkFunction(qcm("Dans la phrase « Demain, nous irons au marché. », quelle est la fonction du groupe « au marché » ?", ["Complément circonstanciel", "COI", "Sujet"], 1))).not.toBeNull();
  });

  it("un complément en à est un COI avec parler, un lieu avec aller", () => {
    expect(functionOf("Awa parle à Moussa.", "à Moussa")).toBe("COI");
    expect(functionOf("Demain, nous irons au marché.", "au marché")).toBe("Complément circonstanciel");
  });

  it("le pronom du COD suit le genre et le nombre du groupe", () => {
    expect(complementPronoun("une mangue", "cod")).toBe("la");
    expect(complementPronoun("le riz", "cod")).toBe("le");
    expect(complementPronoun("ses livres", "cod")).toBe("les");
    expect(complementPronoun("aux élèves", "coi")).toBe("leur");
    expect(complementPronoun("à sa tante", "coi")).toBe("lui");
  });

  it("une phrase interrogative ou négative est reconnue", () => {
    expect(kindOfSentence("Où va le pêcheur ?")).toBe("interrogative");
    expect(isNegative("Omar ne mange pas le riz.")).toBe(true);
    expect(isNegative("Omar mange le riz.")).toBe(false);
    expect(checkType(qcm("Quelle phrase est interrogative ?", ["Où va le pêcheur ?", "Prends ton cahier !", "Omar mange le riz."], 1))).not.toBeNull();
    expect(checkForm(qcm("Quelle phrase est à la forme négative ?", ["Omar mange le riz.", "Omar ne mange pas le riz.", "Awa lit un livre."], 1))).toBeNull();
    expect(checkForm(qcm("Quelle phrase est à la forme négative ?", ["Omar mange le riz.", "Omar ne mange pas le riz.", "Awa lit un livre."], 0))).not.toBeNull();
  });
});

describe("toutes les lignes des tableaux, pas seulement celles que les tirages ont rencontrées", () => {
  const qcmOf = (row: { prompt: string; answer: string; wrong: readonly string[] }) =>
    ({ prompt: row.prompt, answerKey: row.answer, hints: [], payload: { options: [row.answer, ...row.wrong], correctIndex: 0, game: { kind: "x", level: 3 } } }) as Exo;
  const qcmRows: [string, readonly { prompt: string; answer: string; wrong: readonly string[] }[], Check][] = [
    ["nature", NATURE_ROWS, checkNature],
    ["fonction", FONCTION_ROWS, checkFunction],
    ["cc", CC_ROWS, checkCc],
    ["type", TYPE_ROWS, checkType],
    ["forme", FORM_ROWS, checkForm],
    ["attribut", ATTRIBUTE_ROWS, checkAttribute],
  ];

  it("chaque tableau de QCM a trente lignes, de trois choix différents, qui passent la vérification", () => {
    for (const [name, rows, check] of qcmRows) {
      expect(rows, name).toHaveLength(30);
      rows.forEach((row) => {
        expect(new Set([row.answer, ...row.wrong]).size, `${name} : ${row.prompt}`).toBe(3);
        expect(check(qcmOf(row)), `${name} : ${row.prompt} ${row.answer}`).toBeNull();
        // Le contrôleur voit une bonne option plus de deux fois plus longue que la plus longue des autres.
        expect(row.answer.length, `${name} : ${row.prompt}`).toBeLessThanOrEqual(2 * Math.max(...row.wrong.map((option) => option.length)));
      });
    }
  });

  it("les lignes à écrire, à relier et à glisser passent la vérification", () => {
    expect(WRITE_ROWS).toHaveLength(30);
    expect(LINK_ROWS).toHaveLength(30);
    expect(SORT_ROWS).toHaveLength(30);
    for (const row of WRITE_ROWS) expect(checkWrite({ prompt: row.prompt, answerKey: row.accepted[0], hints: [], payload: { acceptedAnswers: [...row.accepted] } } as Exo), row.prompt).toBeNull();
    for (const row of LINK_ROWS) expect(checkLink({ prompt: row.prompt, answerKey: "", hints: [], payload: { pairs: row.pairs } } as Exo), row.prompt).toBeNull();
    for (const row of SORT_ROWS) expect(checkSort({ prompt: row.prompt, answerKey: "", hints: [], payload: { zones: [...row.zones], items: row.items.map((item) => ({ text: item.text, correctZone: item.zone })) } } as Exo), JSON.stringify(row.items)).toBeNull();
  });

  it("une même question ne revient pas d'un palier à l'autre dans un même tableau", () => {
    for (const [name, rows] of qcmRows) {
      const keys = rows.map((row) => `${row.prompt}|${row.answer}`);
      expect(new Set(keys).size, name).toBe(keys.length);
    }
    const sorts = SORT_ROWS.map((row) => JSON.stringify(row.items));
    expect(new Set(sorts).size).toBe(sorts.length);
  });
});
