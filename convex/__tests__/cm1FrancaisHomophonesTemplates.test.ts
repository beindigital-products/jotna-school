import { describe, expect, it } from "vitest";
import { BANK, ERROR_ROWS, FAMILIES, GAP_ROWS, LINK_ROWS, PHRASE_ROWS, SORT_ROWS, TRICK_ROWS, WRITE_ROWS, type Family } from "../paliers/games/cm1Homophones";
import { acceptedOf, all, blankOf, defineMathsTests, itemsOf, ok, optionsOf, pairsOf, rightOption, textOf, wrongOf, zonesOf, type Check, type Exo } from "@/lib/test-support/cm1MathsKit";

/**
 * LES HOMOPHONES GRAMMATICAUX DU CM1 (`fr-cm1-homophones`).
 *
 * Ce fichier a ses propres règles, écrites à part de `cm1Homophones.ts` : pour un trou dans une phrase, il regarde le mot d'avant, le mot d'après et la place du trou
 * (début de phrase, après une virgule) et dit LES SEULS mots de la famille qui conviennent. Un lexique écrit à part range les mots voisins : prénoms, noms au singulier
 * et au pluriel avec leur genre, adjectifs, participes, verbes, prépositions. Une phrase dont le trou n'a pas exactement UN mot qui convient est refusée ; une phrase dont
 * un mot voisin est inconnu aussi. Chaque question est RECALCULÉE avec ces règles : le trou, la phrase bien écrite, le mot mal écrit, le mot à écrire, le glissé, l'astuce.
 */

const FAMILY_LIST = Object.keys(FAMILIES) as Family[];

// ---------------------------------------------------------------------------
// Le lexique des mots voisins
// ---------------------------------------------------------------------------

const NAMES = new Set(["awa", "moussa", "fatou", "omar", "pape", "khady", "mariama"]);
/** Chaque nom commun avec son genre (m, f) et son nombre (s, p). */
const NOUN: Record<string, "ms" | "fs" | "mp" | "fp"> = {
  chat: "ms", chef: "ms", frère: "ms", cahier: "ms", ballon: "ms", thé: "ms", lait: "ms", livre: "ms", garçon: "ms", filet: "ms", village: "ms", matin: "ms", riz: "ms", mil: "ms",
  soupe: "fs", maison: "fs", voiture: "fs", maîtresse: "fs", plage: "fs", natte: "fs",
  enfants: "mp", pêcheurs: "mp", cousins: "mp", villageois: "mp", élèves: "mp", parents: "mp", livres: "mp", cahiers: "mp", poissons: "mp", sœurs: "fp",
  mangues: "fp", cousines: "fp", mains: "fp", dents: "fp", affaires: "fp", clés: "fp", chaussures: "fp",
};
const ADJ = new Set(["fatigué", "grand", "fort", "mûres", "gentilles", "chaude", "calme", "petit", "petits", "beau", "belles", "rouge", "verte", "bleue"]);
const ADV = new Set(["très", "tôt"]);
const PREP = new Set(["sur", "dans", "en"]);
const PARTICIPLE = new Set(["lancé", "fini", "partis", "vu", "lu", "perdu"]);
const VERB = new Set(["va", "parle", "pense", "lave", "range", "cherche", "lit", "embrasse", "brosse", "paraît", "mange", "danse", "rentre", "promène", "couchent", "connais", "ouvrent", "aiment", "rangent", "lavent", "cherchent", "pleut", "court"]);
const VERB_AFTER_ON = new Set(["mange", "danse", "rentre"]);
const REFLEXIVE = new Set(["lave", "promène", "couchent"]);
const TO_VERBS = new Set(["va", "parle", "pense", "joue", "donne", "ressemble", "répond", "téléphone", "obéit", "sourit", "arrive"]);
const PLACES = new Set(["maison", "village", "ville", "endroit", "école", "quartier"]);
const POSSESSED = new Set(["mains", "parents", "dents", "cheveux", "jambes"]);
const DET = new Set(["un", "une", "des", "le", "la", "les", "mon", "ma", "mes", "ton", "ta", "tes", "son", "sa", "ses", "du", "ce", "cet", "cette", "ces", "leur", "leurs", "deux"]);

const isSingularNoun = (word?: string) => word !== undefined && (NOUN[word] === "ms" || NOUN[word] === "fs");
const isPluralNoun = (word?: string) => word !== undefined && (NOUN[word] === "mp" || NOUN[word] === "fp");
const isMasculineSingular = (word?: string) => word !== undefined && NOUN[word] === "ms";
const isSubject3S = (word?: string) => word !== undefined && (NAMES.has(word) || ["il", "elle", "on"].includes(word) || isSingularNoun(word));
const isPluralSubject = (word?: string) => word !== undefined && (["ils", "elles"].includes(word) || isPluralNoun(word));
/** Une catégorie pour coordonner deux mots : « Awa et Moussa », « du thé ou du lait », « grand et fort ». */
function coordinationOf(word: string | undefined, before: string | undefined): "N" | "A" | null {
  if (word === undefined) return null;
  if (NAMES.has(word) || NOUN[word] !== undefined || DET.has(word)) return "N";
  if (ADJ.has(word)) return before !== undefined && DET.has(before) ? "N" : "A";
  return null;
}

type Context = { word?: string; before?: string; after?: string; next?: string; afterNext?: string; first: string; atStart: boolean; comma: boolean };
/** Les mots de la famille qui conviennent au trou : exactement ce que les règles écrites à part en disent. */
function valid(family: Family, c: Context): string[] {
  const out: string[] = [];
  const add = (condition: boolean, word: string) => {
    if (condition) out.push(word);
  };
  const { word: prev, next, afterNext } = c;
  const adjectiveThenNoun = (predicate: (w?: string) => boolean) => predicate(next) || (next !== undefined && ADJ.has(next) && predicate(afterNext));
  switch (family) {
    case "a/à":
      add(isSubject3S(prev), "a");
      add(prev !== undefined && TO_VERBS.has(prev), "à");
      add(prev === "tu", "as");
      break;
    case "et/est":
      add(isSubject3S(prev) && next !== undefined && (ADJ.has(next) || ADV.has(next) || PREP.has(next) || PARTICIPLE.has(next)), "est");
      add(coordinationOf(prev, c.before) !== null && coordinationOf(prev, c.before) === coordinationOf(next, prev), "et");
      add(prev === "tu", "es");
      break;
    case "on/ont":
      add(isPluralSubject(prev) && next !== undefined && (PARTICIPLE.has(next) || DET.has(next)), "ont");
      add(next !== undefined && VERB_AFTER_ON.has(next) && (c.atStart || c.comma || ["alors", "quand", "si", "puis", "ensuite"].includes(prev ?? "")), "on");
      break;
    case "son/sont":
      add(isPluralSubject(prev) && next !== undefined && (ADJ.has(next) || PARTICIPLE.has(next) || PREP.has(next) || ADV.has(next)), "sont");
      add(prev !== undefined && VERB.has(prev) && adjectiveThenNoun(isMasculineSingular), "son");
      break;
    case "ou/où":
      add(c.atStart || (prev !== undefined && PLACES.has(prev)), "où");
      add(!c.atStart && !(prev !== undefined && PLACES.has(prev)) && coordinationOf(prev, c.before) !== null && coordinationOf(prev, c.before) === coordinationOf(next, prev), "ou");
      add(prev !== undefined && TO_VERBS.has(prev) && isMasculineSingular(next), "au");
      break;
    case "ces/ses":
      add(c.atStart && adjectiveThenNoun(isPluralNoun), "ces");
      add(!c.atStart && (NAMES.has(c.first) || ["il", "elle"].includes(c.first)) && prev !== undefined && VERB.has(prev) && next !== undefined && POSSESSED.has(next), "ses");
      add(adjectiveThenNoun(isMasculineSingular), "ce");
      break;
    case "ce/se":
      add(next !== undefined && REFLEXIVE.has(next), "se");
      add(adjectiveThenNoun(isMasculineSingular), "ce");
      add(c.first === "je" && next !== undefined && VERB.has(next) && next !== "connais", "me");
      break;
    case "leur/leurs":
      add(adjectiveThenNoun(isPluralNoun), "leurs");
      add(adjectiveThenNoun(isSingularNoun), "leur");
      break;
    case "mais/mes":
      add(c.comma, "mais");
      add(!c.comma && adjectiveThenNoun(isPluralNoun), "mes");
      add(prev === "je" && next !== undefined && DET.has(next), "mets");
      break;
    case "la/l'a/là":
      add(next !== undefined && ["!", ".", "?"].includes(next), "là");
      add(isSubject3S(prev) && next !== undefined && PARTICIPLE.has(next), "l'a");
      add(adjectiveThenNoun((w) => w !== undefined && NOUN[w] === "fs"), "la");
      break;
  }
  return out;
}

const tokensOf = (text: string): string[] => text.match(/[\p{L}'’-]+|___|[?!.,]/gu) ?? [];
const WORD = /^[\p{L}'’-]+$/u;
/** Les mots voisins du trou (ou du mot à l'indice donné), en minuscules. */
function contextAt(tokens: string[], at: number): Context {
  const lower = tokens.map((token) => token.toLowerCase());
  const words = (from: number, step: number) => {
    const found: string[] = [];
    for (let i = from; i >= 0 && i < lower.length && found.length < 2; i += step) if (WORD.test(lower[i]) || ["!", ".", "?"].includes(lower[i])) found.push(lower[i]);
    return found;
  };
  const before = words(at - 1, -1);
  const after = words(at + 1, 1);
  return { word: before[0], before: before[1], next: after[0], afterNext: after[1], first: lower[0], atStart: at === 0, comma: lower[at - 1] === ",", after: after[0] };
}
/** Les familles où un mot figure : « ce » est dans ce/se et dans ces/ses. */
const familiesOfWord = (word: string): Family[] => FAMILY_LIST.filter((family) => FAMILIES[family].includes(word.toLowerCase()));
const familyOfWord = (word: string): Family | undefined => familiesOfWord(word)[0];
const familyOfOptions = (options: readonly string[]): Family | undefined => FAMILY_LIST.find((family) => [...FAMILIES[family]].sort().join("|") === [...options].sort().join("|"));

/** Les mots de la famille qui conviennent au trou d'une phrase à trou. */
function validForGap(text: string, family: Family): string[] {
  const tokens = tokensOf(text);
  const at = tokens.indexOf("___");
  return at < 0 ? [] : valid(family, contextAt(tokens, at));
}

// ---------------------------------------------------------------------------
// Une vérification par gabarit
// ---------------------------------------------------------------------------

const checkGap: Check = (exo) => {
  const { options, answer } = blankOf(exo);
  const family = familyOfOptions(options);
  const found = family ? validForGap(textOf(exo), family) : [];
  return all(
    ok(family !== undefined, `les trois choix ne sont pas une famille : ${options.join(" | ")}`),
    ok((textOf(exo).match(/___/gu) ?? []).length === 1, "un seul trou"),
    ok(found.length === 1 && found[0] === answer, `les mots qui conviennent à « ${textOf(exo)} » sont ${found.join(", ") || "aucun"}, pas ${answer}`),
  );
};

/** Les trois phrases d'un choix ne diffèrent que par le mot de la famille. */
function differingIndex(options: string[]): { index: number; tokens: string[][] } | null {
  const tokens = options.map(tokensOf);
  if (tokens.some((line) => line.length !== tokens[0].length)) return null;
  const at = tokens[0].findIndex((_, i) => tokens.some((line) => line[i].toLowerCase() !== tokens[0][i].toLowerCase()));
  return at < 0 ? null : { index: at, tokens };
}

const checkPhrase: Check = (exo) => {
  const options = optionsOf(exo);
  const diff = differingIndex(options);
  if (!diff) return `les trois phrases ne diffèrent pas par un mot : ${options.join(" | ")}`;
  const words = diff.tokens.map((line) => line[diff.index]);
  const family = familyOfOptions(words.map((word) => word.toLowerCase()));
  if (!family) return `les trois mots ne sont pas une famille : ${words.join(", ")}`;
  const found = valid(family, contextAt(diff.tokens[0], diff.index));
  const rightWord = diff.tokens[exo.payload.correctIndex as number][diff.index].toLowerCase();
  return all(ok(found.length === 1 && found[0] === rightWord, `la phrase juste a ${rightWord} ; les règles disent ${found.join(", ") || "aucun mot"} (${options.join(" | ")})`), ok(exo.prompt === "Quelle phrase est bien écrite ?", "énoncé inattendu"));
};

const checkError: Check = (exo) => {
  const sentence = exo.prompt.match(/« (.+) »/u)?.[1] ?? "";
  const tokens = tokensOf(sentence);
  const wrong = rightOption(exo);
  const at = tokens.findIndex((token) => token === wrong);
  if (at < 0 || familiesOfWord(wrong).length === 0) return `le mot « ${wrong} » n'est pas une famille dans « ${sentence} »`;
  // Le mot est mal écrit si, dans une famille où il figure, un seul AUTRE mot convient au trou.
  const misspelled = familiesOfWord(wrong).some((family) => {
    const found = valid(family, contextAt(tokens, at));
    return found.length === 1 && found[0] !== wrong.toLowerCase();
  });
  return all(
    ok(misspelled, `« ${wrong} » est correct dans « ${sentence} »`),
    ok(wrongOf(exo).every((word) => tokens.includes(word) && familiesOfWord(word).length === 0), `les autres choix sont des mots de la phrase hors famille : ${optionsOf(exo).join(" | ")}`),
  );
};

const checkWrite: Check = (exo) => {
  const sentence = exo.prompt.match(/« (.+) »/u)?.[1] ?? "";
  const answer = exo.answerKey;
  const fitting = familiesOfWord(answer).filter((family) => {
    const found = validForGap(sentence, family);
    return found.length === 1 && found[0] === answer;
  });
  return all(ok(fitting.length > 0, `aucune famille de « ${answer} » n'a ce seul mot pour « ${sentence} »`), ok(acceptedOf(exo)[0] === answer, "réponse admise"));
};

const checkSort: Check = (exo) => {
  const zones = zonesOf(exo);
  const items = itemsOf(exo);
  const family = FAMILY_LIST.find((candidate) => zones.every((zone) => FAMILIES[candidate].includes(zone)));
  if (!family) return `les deux cases ne sont pas de la même famille : ${zones.join(", ")}`;
  for (const item of items) {
    const found = validForGap(item.text, family);
    if (found.length !== 1 || found[0] !== item.correctZone) return `« ${item.text} » va dans ${found.join(", ") || "aucune case"}, pas ${item.correctZone}`;
  }
  return all(ok(zones.length === 2 && new Set(zones).size === 2, "deux cases"), ok(zones.every((zone) => items.filter((item) => item.correctZone === zone).length === 2), "deux phrases par case"));
};

/** Le mot qui prend la place d'un homophone pour vérifier. */
const TRICK: Record<string, string> = { a: "avait", est: "était", ont: "avaient", sont: "étaient", "l'a": "l'avait", son: "mon", ses: "mes", mes: "tes", on: "il", et: "et puis", ou: "ou bien", se: "me" };
const TRICK_GROUP = (trick: string) => (["avait", "était", "avaient", "étaient", "l'avait"].includes(trick) ? "verbe" : ["mon", "mes", "tes"].includes(trick) ? "déterminant" : "autre");

const checkTrick: Check = (exo) => {
  const [sentence, word] = [...exo.prompt.matchAll(/« ([^»]+) »/gu)].map((match) => match[1]);
  const tokens = tokensOf(sentence);
  const at = tokens.findIndex((token) => token.toLowerCase() === word);
  const family = familyOfWord(word);
  const found = family && at >= 0 ? valid(family, contextAt(tokens, at)) : [];
  const trick = TRICK[word];
  return all(
    ok(trick !== undefined, `pas d'astuce pour ${word}`),
    ok(found.length === 1 && found[0] === word, `« ${word} » ne convient pas seul dans « ${sentence} » (${found.join(", ") || "aucun"})`),
    ok(rightOption(exo) === trick, `l'astuce de ${word} est ${trick}, pas ${rightOption(exo)}`),
    ok(wrongOf(exo).every((option) => option !== trick && TRICK_GROUP(option) !== TRICK_GROUP(trick) && Object.values(TRICK).includes(option)), `un mauvais choix est de la même famille d'astuces : ${optionsOf(exo).join(" | ")}`),
  );
};

const checkLink: Check = (exo) => {
  const pairs = pairsOf(exo);
  const lefts = pairs.map((pair) => pair.left);
  return all(
    ok(pairs.every((pair) => TRICK[pair.left] === pair.right), `une paire fausse : ${pairs.map((pair) => `${pair.left} ~ ${pair.right}`).join(" ; ")}`),
    ok(pairs.length === 3 && new Set(pairs.map((pair) => pair.right)).size === 3, "trois remplaçants différents"),
    ok(!(lefts.includes("ses") && lefts.includes("mes")), "ses et mes acceptent tous deux tes"),
  );
};

defineMathsTests({
  label: "du français du CM1 (les homophones)",
  subject: "Français",
  hintsNeverWriteChoices: true,
  checks: {
    "cm1-hom-trou": checkGap,
    "cm1-hom-phrase": checkPhrase,
    "cm1-hom-erreur": checkError,
    "cm1-hom-ecrire": checkWrite,
    "cm1-hom-glisser": checkSort,
    "cm1-hom-astuce": checkTrick,
    "cm1-hom-relier": checkLink,
  },
  topicKinds: {
    "fr-cm1-homophones": ["cm1-hom-trou", "cm1-hom-phrase", "cm1-hom-erreur", "cm1-hom-ecrire", "cm1-hom-glisser", "cm1-hom-astuce", "cm1-hom-relier"],
  },
});

describe("la banque de phrases s'accorde avec les règles écrites à part", () => {
  it("soixante phrases, six par famille, deux familles par palier", () => {
    expect(BANK).toHaveLength(60);
    for (const family of FAMILY_LIST) expect(BANK.filter((entry) => entry.family === family), family).toHaveLength(6);
    FAMILY_LIST.forEach((family, index) => {
      const first = BANK.findIndex((entry) => entry.family === family);
      expect(Math.floor(first / 12), family).toBe(Math.floor(index / 2));
    });
  });

  it("chaque phrase n'a qu'un mot de sa famille qui convienne, celui de la banque", () => {
    for (const entry of BANK) {
      expect((entry.text.match(/___/gu) ?? []).length, entry.text).toBe(1);
      expect(FAMILIES[entry.family], entry.text).toContain(entry.answer);
      expect(validForGap(entry.text, entry.family), entry.text).toEqual([entry.answer]);
    }
  });

  it("les trois mots de chaque famille sont différents", () => {
    for (const family of FAMILY_LIST) expect(new Set(FAMILIES[family]).size, family).toBe(3);
  });

  it("toutes les lignes de chaque tableau passent la vérification de leur gabarit", () => {
    const gapOf = (row: { text: string; answer: string; wrong: readonly string[] }) => ({ prompt: "Complète la phrase.", answerKey: row.answer, hints: [], payload: { text: row.text, blanks: [{ options: [row.answer, ...row.wrong], answer: row.answer }] } }) as Exo;
    const qcmOf = (row: { prompt: string; answer: string; wrong: readonly string[] }) => ({ prompt: row.prompt, answerKey: row.answer, hints: [], payload: { options: [row.answer, ...row.wrong], correctIndex: 0 } }) as Exo;
    for (const row of GAP_ROWS) expect(checkGap(gapOf(row)), row.text).toBeNull();
    for (const row of PHRASE_ROWS) expect(checkPhrase(qcmOf(row)), row.answer).toBeNull();
    for (const row of ERROR_ROWS) expect(checkError(qcmOf(row)), row.prompt).toBeNull();
    for (const row of TRICK_ROWS) expect(checkTrick(qcmOf(row)), row.prompt).toBeNull();
    for (const row of WRITE_ROWS) expect(checkWrite({ prompt: row.prompt, answerKey: row.accepted[0], hints: [], payload: { acceptedAnswers: [...row.accepted] } } as Exo), row.prompt).toBeNull();
    for (const row of SORT_ROWS) expect(checkSort({ prompt: row.prompt, answerKey: "", hints: [], payload: { zones: [...row.zones], items: row.items.map((item) => ({ text: item.text, correctZone: item.zone })) } } as Exo), JSON.stringify(row.items)).toBeNull();
    for (const row of LINK_ROWS) expect(checkLink({ prompt: row.prompt, answerKey: "", hints: [], payload: { pairs: row.pairs } } as Exo), JSON.stringify(row.pairs)).toBeNull();
    expect(GAP_ROWS).toHaveLength(60);
    expect(SORT_ROWS).toHaveLength(30);
    expect(LINK_ROWS).toHaveLength(30);
  });

  it("une phrase écrite commence par une majuscule, même quand le trou ouvre la phrase", () => {
    for (const row of PHRASE_ROWS) for (const sentence of [row.answer, ...row.wrong]) expect(sentence.charAt(0), sentence).toBe(sentence.charAt(0).toUpperCase());
  });

  it("les tableaux n'ont pas de ligne en double", () => {
    for (const rows of [GAP_ROWS.map((row) => row.text), PHRASE_ROWS.map((row) => row.answer), ERROR_ROWS.map((row) => row.prompt), TRICK_ROWS.map((row) => row.prompt), WRITE_ROWS.map((row) => row.prompt)]) expect(new Set(rows).size).toBe(rows.length);
    const sorts = SORT_ROWS.map((row) => JSON.stringify(row.items));
    expect(new Set(sorts).size).toBe(sorts.length);
  });
});

describe("les vérifications des homophones voient un énoncé abîmé", () => {
  const gap = (text: string, options: string[], answer: string) => ({ type: "fill-blank", prompt: "x", answerKey: answer, hints: [], payload: { text, blanks: [{ options, answer }] } }) as Exo;
  const qcm = (prompt: string, options: string[], correctIndex: number) => ({ type: "qcm", prompt, answerKey: options[correctIndex], hints: [], payload: { options, correctIndex } }) as Exo;

  it("a et à : le sujet d'avant dit a, le verbe d'aller dit à", () => {
    expect(checkGap(gap("Awa ___ un beau livre.", ["a", "à", "as"], "a"))).toBeNull();
    expect(checkGap(gap("Awa ___ un beau livre.", ["a", "à", "as"], "à"))).not.toBeNull();
    expect(checkGap(gap("Moussa va ___ Dakar.", ["a", "à", "as"], "à"))).toBeNull();
  });

  it("une phrase où deux mots conviennent est refusée", () => {
    // « Le chat ___ le roi » : est (le roi, un nom) n'est pas dans les règles, mais « et » ne convient pas non plus : aucun mot ne passe.
    expect(checkGap(gap("Le chef ___ le maître.", ["et", "est", "es"], "est"))).not.toBeNull();
  });

  it("ces ouvre la phrase, ses suit un verbe dont le sujet possède", () => {
    expect(checkGap(gap("___ enfants jouent dans la cour.", ["ces", "ses", "ce"], "ces"))).toBeNull();
    expect(checkGap(gap("Omar embrasse ___ parents.", ["ces", "ses", "ce"], "ses"))).toBeNull();
    expect(checkGap(gap("Omar embrasse ___ parents.", ["ces", "ses", "ce"], "ces"))).not.toBeNull();
  });

  it("la phrase bien écrite et le mot mal écrit", () => {
    expect(checkPhrase(qcm("Quelle phrase est bien écrite ?", ["Moussa va à Dakar.", "Moussa va a Dakar.", "Moussa va as Dakar."], 0))).toBeNull();
    expect(checkPhrase(qcm("Quelle phrase est bien écrite ?", ["Moussa va à Dakar.", "Moussa va a Dakar.", "Moussa va as Dakar."], 1))).not.toBeNull();
    expect(checkError(qcm("Quel mot est mal écrit dans la phrase « Awa à un beau livre. » ?", ["à", "Awa", "livre"], 0))).toBeNull();
    expect(checkError(qcm("Quel mot est mal écrit dans la phrase « Awa a un beau livre. » ?", ["a", "Awa", "livre"], 0))).not.toBeNull();
  });

  it("l'astuce de remplacement", () => {
    expect(checkTrick(qcm("Dans la phrase « Awa a un beau livre. », par quel mot peut-on remplacer « a » pour vérifier ?", ["avait", "mon", "il"], 0))).toBeNull();
    expect(checkTrick(qcm("Dans la phrase « Awa a un beau livre. », par quel mot peut-on remplacer « a » pour vérifier ?", ["avait", "était", "il"], 0))).not.toBeNull();
    expect(checkLink({ prompt: "x", answerKey: "", hints: [], payload: { pairs: [{ left: "ses", right: "mes" }, { left: "mes", right: "tes" }, { left: "a", right: "avait" }] } } as Exo)).not.toBeNull();
  });
});
