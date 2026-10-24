import { describe, expect, it } from "vitest";
import { CLOZE_ROWS, COUNT_ROWS, DOCS, HEADING_ROWS, INFO_ROWS, KIND_ROWS, LINK_ROWS, ORDER_ROWS, SORT_ROWS, TRUE_ROWS, VERB_ROWS } from "../paliers/games/cm1Informer";
import { acceptedOf, all, blankOf, defineMathsTests, itemsOf, ok, optionsOf, pairsOf, rightOption, sequenceOf, textOf, wrongOf, zonesOf, type Check, type Exo } from "@/lib/test-support/cm1MathsKit";

/**
 * LES TEXTES QUI EXPLIQUENT ET QUI INFORMENT DU CM1 (`fr-cm1-informer`).
 *
 * Le texte est dans l'énoncé. Ce fichier l'analyse lui-même : la première ligne est le titre, une ligne sans point final est un intertitre, une ligne à point final est un paragraphe ;
 * une phrase est un ordre quand son premier mot (après « Premièrement », « Puis », « Ensuite », « Enfin ») est un verbe à l'impératif d'une liste écrite à part. Il vérifie que
 * - le genre d'un document est celui du tableau du test, et qu'un document injonctif a bien des ordres, un document informatif aucun ;
 * - la bonne réponse d'une question est dans la phrase du texte qui contient le mot-clé, les mauvais choix n'y sont pas ;
 * - les étapes suivent le texte, l'intertitre juste est celui qui est juste au-dessus du passage, le nombre de phrases est recompté ;
 * - une phrase glissée ou proposée comme « ordre » commence par un impératif, une « information » non.
 */

const TITLES: Record<string, string> = {
  "La bouillie de mil": "Recette", "Le baobab": "Fiche documentaire", "Le jeu du mouchoir": "Règle de jeu", "Le fleuve Sénégal": "Fiche documentaire", "La lampe solaire": "Notice",
  "Les abeilles": "Article", "Le jus de bissap": "Recette", "Le lion": "Fiche documentaire", "La marelle": "Règle de jeu", "La saison des pluies": "Article",
};
const INJUNCTIVE_KINDS = new Set(["Recette", "Règle de jeu", "Notice"]);
const IMPERATIVES = new Set(words("chauffe verse laisse ajoute forme tourne dépose cours pose vérifie appuie éteins lave fais trace prends lance saute reviens ramasse sers"));
function words(text: string) {
  return text.split(" ");
}
const fold = (text: string) => text.toLowerCase();
const sentencesOf = (text: string) => text.split(/(?<=[.!?])\s+/u).filter((sentence) => sentence.length > 0);
const promptParts = (prompt: string) => {
  const cut = prompt.lastIndexOf("\n\n");
  return { text: prompt.slice(0, cut), question: prompt.slice(cut + 2).replace(/^Lis le texte\. /u, "") };
};
const isParagraph = (line: string) => /[.!?]$/u.test(line);
/** Le titre, puis chaque intertitre avec le paragraphe qui le suit. */
function parse(text: string): { title: string; sections: { heading: string; paragraph: string }[] } | null {
  const lines = text.split("\n").filter((line) => line.length > 0);
  const [title, ...rest] = lines;
  if (!title || isParagraph(title) || rest.length % 2 !== 0) return null;
  const sections: { heading: string; paragraph: string }[] = [];
  for (let i = 0; i < rest.length; i += 2) {
    if (isParagraph(rest[i]) || !isParagraph(rest[i + 1])) return null;
    sections.push({ heading: rest[i], paragraph: rest[i + 1] });
  }
  return { title, sections };
}
const stripConnective = (sentence: string) => sentence.replace(/^(?:Premièrement, |Puis |Ensuite, |Enfin, )/u, "");
const isOrder = (sentence: string) => IMPERATIVES.has(fold(stripConnective(sentence).split(" ")[0]));
const docOf = (text: string) => DOCS.find((doc) => text.startsWith(`${doc.title}\n\n`));
const askOf = (question: string) => DOCS.map((doc) => doc.info).find((entry) => entry.question === question);

// ---------------------------------------------------------------------------
// Une vérification par gabarit
// ---------------------------------------------------------------------------

const checkKind: Check = (exo) => {
  const { text } = promptParts(exo.prompt);
  const parsed = parse(text);
  if (!parsed) return "texte illisible";
  const orders = parsed.sections.flatMap((section) => sentencesOf(section.paragraph)).filter(isOrder).length;
  return all(
    ok(TITLES[parsed.title] === rightOption(exo), `« ${parsed.title} » est ${TITLES[parsed.title]}, pas ${rightOption(exo)}`),
    ok(INJUNCTIVE_KINDS.has(rightOption(exo)) ? orders >= 3 : orders === 0, `${orders} ordres dans un texte de genre ${rightOption(exo)}`),
    ok(wrongOf(exo).every((option) => option !== rightOption(exo)) && new Set(optionsOf(exo)).size === 3, "trois genres"),
    // Un article et une fiche documentaire se présentent de la même façon : un élève ne peut pas les départager, ils ne sont jamais proposés ensemble.
    ok(!(optionsOf(exo).includes("Article") && optionsOf(exo).includes("Fiche documentaire")), `deux genres informatifs côte à côte : ${optionsOf(exo).join(" | ")}`),
  );
};

const checkInfo: Check = (exo) => {
  const { text, question } = promptParts(exo.prompt);
  const entry = askOf(question);
  if (!entry) return `question inconnue : ${question}`;
  const sentence = sentencesOf(parse(text)?.sections.map((section) => section.paragraph).join(" ") ?? "").find((candidate) => candidate.includes(entry.pivot));
  if (!sentence) return `aucune phrase ne contient « ${entry.pivot} »`;
  return all(
    ok(fold(sentence).includes(fold(rightOption(exo))), `la phrase « ${sentence} » ne contient pas « ${rightOption(exo)} »`),
    ok(wrongOf(exo).every((option) => !fold(sentence).includes(fold(option))), `un mauvais choix est écrit dans la phrase : ${optionsOf(exo).join(" | ")}`),
  );
};

const checkOrder: Check = (exo) => {
  const { text, question } = promptParts(exo.prompt);
  const tiles = sequenceOf(exo);
  const positions = tiles.map((tile) => fold(text).indexOf(fold(tile)));
  const doc = docOf(text);
  return all(
    ok(question === "Remets les étapes dans l'ordre du texte." && doc !== undefined && INJUNCTIVE_KINDS.has(TITLES[doc.title]), "énoncé ou genre inattendu"),
    ok(tiles.length === 4 && positions.every((position) => position >= 0), `une tuile n'est pas dans le texte : ${tiles.join(" / ")}`),
    ok(positions.every((position, index) => index === 0 || position > positions[index - 1]), `les tuiles ne suivent pas le texte : ${positions.join(", ")}`),
    ok(tiles.every((tile) => IMPERATIVES.has(fold(tile.split(" ")[0]))), "chaque étape commence par un impératif"),
  );
};

const checkHeading: Check = (exo) => {
  const { text, question } = promptParts(exo.prompt);
  const parsed = parse(text);
  const doc = docOf(text);
  if (!parsed || !doc || doc.where.question !== question) return "énoncé inattendu";
  const section = parsed.sections.find((candidate) => fold(candidate.paragraph).includes(fold(doc.where.fragment)));
  return all(
    ok(section !== undefined && section.heading === rightOption(exo), `le passage est sous « ${section?.heading} », pas sous « ${rightOption(exo)} »`),
    ok(wrongOf(exo).every((option) => option !== section?.heading), "un mauvais choix est le bon intertitre"),
  );
};

const checkTrue: Check = (exo) => {
  const { text, question } = promptParts(exo.prompt);
  const doc = docOf(text);
  if (!doc || question !== "Quelle phrase est vraie d'après le texte ?") return "énoncé inattendu";
  return all(
    ok(doc.statement.right === rightOption(exo), `la phrase vraie est « ${doc.statement.right} »`),
    ok(fold(text).includes(fold(doc.statement.evidence)), `la preuve « ${doc.statement.evidence} » n'est pas dans le texte`),
    ok(doc.statement.absent.every((word) => !fold(text).includes(fold(word))), `un mot qui contredit est dans le texte : ${doc.statement.absent.join(", ")}`),
    ok(wrongOf(exo).every((option) => (doc.statement.wrong as readonly string[]).includes(option)), "les mauvais choix sont les phrases fausses du document"),
  );
};

const checkGap: Check = (exo) => {
  const { options, answer } = blankOf(exo);
  const filled = textOf(exo).replace("___", answer);
  const doc = docOf(filled);
  if (!doc) return "le texte rempli n'est pas un document";
  const lines = filled.split("\n");
  const body = textOf(exo).split("\n").slice(1).join("\n");
  return all(
    ok(exo.prompt === "Complète le texte avec le bon mot.", "énoncé inattendu"),
    ok(!lines[0].includes(answer) || body.includes("___"), "le trou est dans le corps du texte"),
    ok((fold(body.replace("___", "")).match(new RegExp(`(?<![\\p{L}-])${fold(answer)}(?![\\p{L}-])`, "gu")) ?? []).length + (fold(lines[0]).includes(fold(answer)) ? 1 : 0) >= 1, `« ${answer} » ne revient pas ailleurs dans le texte`),
    ok(options.filter((option) => option !== answer).every((option) => !fold(filled).includes(fold(option))), `un mauvais choix est écrit dans le texte : ${options.join(" | ")}`),
  );
};

const checkCount: Check = (exo) => {
  const { text, question } = promptParts(exo.prompt);
  const parsed = parse(text);
  if (!parsed) return "texte illisible";
  const total = parsed.sections.reduce((sum, section) => sum + sentencesOf(section.paragraph).length, 0);
  const paragraph = question.match(/^Combien de phrases a le paragraphe « ([^»]+) » \?$/u)?.[1];
  const expected = question === "Combien de phrases a ce texte ?" ? total : paragraph ? sentencesOf(parsed.sections.find((section) => section.heading === paragraph)?.paragraph ?? "").length : null;
  return all(
    ok(expected !== null && String(expected) === exo.answerKey, `la réponse est ${expected}, pas ${exo.answerKey}`),
    ok(acceptedOf(exo)[0] === exo.answerKey && !/\d/u.test(text), "réponse admise, aucun chiffre dans le texte"),
  );
};

const checkLink: Check = (exo) => {
  const { text } = promptParts(exo.prompt);
  const parsed = parse(text);
  const pairs = pairsOf(exo);
  const sentences = parsed?.sections.flatMap((section) => sentencesOf(section.paragraph)) ?? [];
  return all(
    ok(parsed !== null && pairs.length === 3, "trois paires d'un document"),
    ok(pairs.every((pair) => sentences.some((sentence) => fold(sentence).includes(fold(pair.left)) && sentence.includes(pair.right))), `une paire ne se lit pas dans une phrase du texte : ${pairs.map((pair) => `${pair.left} ~ ${pair.right}`).join(" ; ")}`),
    ok(new Set(pairs.map((pair) => pair.left)).size === 3, "trois débuts différents"),
  );
};

const ALL_SENTENCES = new Set(DOCS.flatMap((doc) => doc.sections.flatMap((section) => sentencesOf(section.text))));
const checkSort: Check = (exo) => {
  const zones = zonesOf(exo);
  const items = itemsOf(exo);
  for (const item of items) {
    if (!ALL_SENTENCES.has(item.text)) return `« ${item.text} » n'est pas une phrase d'un document`;
    if (isOrder(item.text) !== (item.correctZone === "Ordre")) return `« ${item.text} » ${isOrder(item.text) ? "est un ordre" : "n'est pas un ordre"}, pas ${item.correctZone}`;
  }
  return all(ok(zones.join("|") === "Ordre|Information", "cases"), ok(zones.every((zone) => items.filter((item) => item.correctZone === zone).length === 3), "trois phrases par case"));
};

const checkVerb: Check = (exo) => {
  const options = optionsOf(exo);
  return all(
    ok(options.every((option) => ALL_SENTENCES.has(option)), `une option n'est pas une phrase d'un document : ${options.join(" | ")}`),
    ok(isOrder(rightOption(exo)), `« ${rightOption(exo)} » ne donne pas un ordre`),
    ok(wrongOf(exo).every((option) => !isOrder(option)), `un mauvais choix donne un ordre : ${options.join(" | ")}`),
  );
};

defineMathsTests({
  label: "du français du CM1 (les textes qui informent)",
  subject: "Français",
  hintsNeverWriteChoices: true,
  promptWords: 150,
  checks: {
    "cm1-inf-type": checkKind,
    "cm1-inf-info": checkInfo,
    "cm1-inf-ordre": checkOrder,
    "cm1-inf-titre": checkHeading,
    "cm1-inf-vrai": checkTrue,
    "cm1-inf-trou": checkGap,
    "cm1-inf-compte": checkCount,
    "cm1-inf-relier": checkLink,
    "cm1-inf-glisser": checkSort,
    "cm1-inf-verbe": checkVerb,
  },
  topicKinds: {
    "fr-cm1-informer": ["cm1-inf-type", "cm1-inf-info", "cm1-inf-ordre", "cm1-inf-titre", "cm1-inf-vrai", "cm1-inf-trou", "cm1-inf-compte", "cm1-inf-relier", "cm1-inf-glisser", "cm1-inf-verbe"],
  },
});

describe("les dix documents s'accordent avec les règles écrites à part", () => {
  const textFor = (doc: (typeof DOCS)[number]) => [doc.title, ...doc.sections.map((section) => `${section.heading}\n${section.text}`)].join("\n\n");

  it("dix documents lisibles : un titre, deux intertitres, deux paragraphes, sans apostrophe droite, sans deux-points, sans chiffre, de cent mots au plus", () => {
    expect(DOCS).toHaveLength(10);
    for (const doc of DOCS) {
      const text = textFor(doc);
      const parsed = parse(text);
      expect(parsed, doc.title).not.toBeNull();
      expect(parsed?.sections, doc.title).toHaveLength(2);
      expect(text, doc.title).not.toMatch(/['\d:]/u);
      expect(text.split(/\s+/u).length, doc.title).toBeLessThanOrEqual(100);
      expect(TITLES[doc.title], doc.title).toBe(doc.kind);
    }
  });

  it("un document injonctif a des étapes qui suivent le texte et quatre ordres ; un document informatif n'a aucun ordre et quatre informations", () => {
    for (const doc of DOCS) {
      const text = textFor(doc);
      const orders = doc.sentences.filter(isOrder);
      if (INJUNCTIVE_KINDS.has(doc.kind)) {
        expect(doc.steps, doc.title).toHaveLength(4);
        const positions = doc.steps.map((step) => fold(text).indexOf(fold(step)));
        expect(positions.every((position) => position >= 0), doc.title).toBe(true);
        expect(positions, doc.title).toEqual([...positions].sort((a, b) => a - b));
        expect(orders, doc.title).toHaveLength(4);
      } else {
        expect(doc.steps, doc.title).toHaveLength(0);
        expect(orders, doc.title).toHaveLength(0);
      }
      for (const sentence of doc.sentences) expect(sentencesOf(parse(text)?.sections.map((section) => section.paragraph).join(" ") ?? ""), sentence).toContain(sentence);
    }
  });

  it("chaque information, chaque intertitre, chaque preuve et chaque couple se lisent dans le texte", () => {
    for (const doc of DOCS) {
      const parsed = parse(textFor(doc)) as NonNullable<ReturnType<typeof parse>>;
      const sentences = parsed.sections.flatMap((section) => sentencesOf(section.paragraph));
      const sentence = sentences.find((candidate) => candidate.includes(doc.info.pivot));
      expect(sentence, doc.info.question).toBeDefined();
      expect(fold(sentence as string).includes(fold(doc.info.answer)), doc.info.question).toBe(true);
      for (const wrong of doc.info.wrong) expect(fold(sentence as string).includes(fold(wrong)), `${doc.info.question} ${wrong}`).toBe(false);
      const section = parsed.sections.find((candidate) => fold(candidate.paragraph).includes(fold(doc.where.fragment)));
      expect(section?.heading, doc.where.question).toBe(doc.where.heading);
      expect(doc.where.wrong.includes(doc.where.heading), doc.where.question).toBe(false);
      expect(fold(textFor(doc)).includes(fold(doc.statement.evidence)), doc.title).toBe(true);
      for (const word of doc.statement.absent) expect(fold(textFor(doc)).includes(fold(word)), `${doc.title} ${word}`).toBe(false);
      for (const [left, right] of doc.pairs) expect(sentences.some((candidate) => fold(candidate).includes(fold(left)) && candidate.includes(right)), `${doc.title} ${left}`).toBe(true);
      const times = (fold(textFor(doc)).match(new RegExp(`(?<![\\p{L}-])${fold(doc.cloze.word)}(?![\\p{L}-])`, "gu")) ?? []).length;
      expect(times, doc.title).toBeGreaterThanOrEqual(2);
      for (const wrong of doc.cloze.wrong) expect(fold(textFor(doc)).includes(fold(wrong)), `${doc.title} ${wrong}`).toBe(false);
    }
  });

  it("toutes les lignes de chaque tableau passent la vérification de leur gabarit", () => {
    const qcmOf = (row: { prompt: string; answer: string; wrong: readonly string[] }) => ({ prompt: row.prompt, answerKey: row.answer, hints: [], payload: { options: [row.answer, ...row.wrong], correctIndex: 0 } }) as Exo;
    const rowsOf: [string, readonly { prompt: string; answer: string; wrong: readonly string[] }[], Check][] = [
      ["type", KIND_ROWS, checkKind], ["info", INFO_ROWS, checkInfo], ["intertitre", HEADING_ROWS, checkHeading], ["vrai", TRUE_ROWS, checkTrue], ["verbe", VERB_ROWS, checkVerb],
    ];
    for (const [name, rows, check] of rowsOf) {
      for (const row of rows) {
        expect(new Set([row.answer, ...row.wrong]).size, `${name} : ${row.prompt}`).toBe(3);
        expect(check(qcmOf(row)), `${name} : ${row.answer}`).toBeNull();
        expect(row.answer.length, `${name} : ${row.answer}`).toBeLessThanOrEqual(2 * Math.max(...row.wrong.map((option) => option.length)));
      }
    }
    expect(VERB_ROWS).toHaveLength(15);
    for (const row of CLOZE_ROWS) expect(checkGap({ prompt: "Complète le texte avec le bon mot.", answerKey: row.answer, hints: [], payload: { text: row.text, blanks: [{ options: [row.answer, ...row.wrong], answer: row.answer }] } } as Exo), row.text).toBeNull();
    for (const row of ORDER_ROWS) expect(checkOrder({ prompt: row.prompt, answerKey: "", hints: [], payload: { correctSequence: [...row.sequence] } } as Exo), row.prompt).toBeNull();
    for (const row of COUNT_ROWS) expect(checkCount({ prompt: row.prompt, answerKey: row.accepted[0], hints: [], payload: { acceptedAnswers: [...row.accepted] } } as Exo), row.prompt).toBeNull();
    for (const row of LINK_ROWS) expect(checkLink({ prompt: row.prompt, answerKey: "", hints: [], payload: { pairs: row.pairs } } as Exo), row.prompt).toBeNull();
    for (const row of SORT_ROWS) expect(checkSort({ prompt: row.prompt, answerKey: "", hints: [], payload: { zones: [...row.zones], items: row.items.map((item) => ({ text: item.text, correctZone: item.zone })) } } as Exo), JSON.stringify(row.items)).toBeNull();
    expect(ORDER_ROWS).toHaveLength(5);
    expect(COUNT_ROWS).toHaveLength(20);
    expect(SORT_ROWS).toHaveLength(30);
  });

  it("aucune ligne en double dans un tableau", () => {
    for (const keys of [KIND_ROWS.map((r) => r.prompt), INFO_ROWS.map((r) => r.prompt), HEADING_ROWS.map((r) => r.prompt), VERB_ROWS.map((r) => `${r.prompt}|${r.answer}`), COUNT_ROWS.map((r) => r.prompt), SORT_ROWS.map((r) => JSON.stringify(r.items))]) {
      expect(new Set(keys).size).toBe(keys.length);
    }
  });
});

describe("les vérifications des textes voient un énoncé abîmé", () => {
  const doc = DOCS[0];
  const text = [doc.title, ...doc.sections.map((section) => `${section.heading}\n${section.text}`)].join("\n\n");
  const qcm = (question: string, options: string[], correctIndex: number) => ({ type: "qcm", prompt: `${text}\n\nLis le texte. ${question}`, answerKey: options[correctIndex], hints: [], payload: { options, correctIndex } }) as Exo;

  it("le genre, l'information, l'intertitre", () => {
    expect(checkKind(qcm("Quel est le type de ce texte ?", ["Recette", "Article", "Notice"], 0))).toBeNull();
    expect(checkKind(qcm("Quel est le type de ce texte ?", ["Recette", "Article", "Notice"], 1))).not.toBeNull();
    expect(checkKind(qcm("Quel est le type de ce texte ?", ["Recette", "Article", "Fiche documentaire"], 0))).not.toBeNull();
    expect(checkInfo(qcm("Que faut-il chauffer en premier ?", ["le lait", "la farine", "le sucre"], 0))).toBeNull();
    expect(checkInfo(qcm("Que faut-il chauffer en premier ?", ["le lait", "la farine", "le sucre"], 1))).not.toBeNull();
    expect(checkHeading(qcm("Sous quel intertitre lit-on la liste des produits ?", ["Les ingrédients", "La préparation", "Le goût"], 1))).not.toBeNull();
  });

  it("un ordre commence par un impératif", () => {
    const verb = (options: string[], correctIndex: number) => ({ type: "qcm", prompt: "Dans quelle phrase le verbe donne-t-il un ordre ?", answerKey: options[correctIndex], hints: [], payload: { options, correctIndex } }) as Exo;
    expect(checkVerb(verb(["Puis verse la farine en remuant.", "Le baobab est un arbre immense.", "Ses rives donnent du riz et du mil."], 0))).toBeNull();
    expect(checkVerb(verb(["Puis verse la farine en remuant.", "Le baobab est un arbre immense.", "Ses rives donnent du riz et du mil."], 1))).not.toBeNull();
  });

  it("les étapes suivent le texte", () => {
    const tiles = (list: string[]) => ({ prompt: `${text}\n\nLis le texte. Remets les étapes dans l'ordre du texte.`, answerKey: "", hints: [], payload: { correctSequence: list } }) as Exo;
    expect(checkOrder(tiles(doc.steps.map((step) => step.charAt(0).toUpperCase() + step.slice(1))))).toBeNull();
    expect(checkOrder(tiles([doc.steps[1], doc.steps[0], doc.steps[2], doc.steps[3]]))).not.toBeNull();
  });
});
