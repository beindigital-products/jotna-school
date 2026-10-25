import { describe, expect, it } from "vitest";
import { ASK_ROWS, CLOZE_ROWS, COUNT_ROWS, LINK_ROWS, ORDER_ROWS, SORT_ROWS, STORIES, TENSE_ROWS, TITLE_ROWS, TRUE_ROWS, WORD_ROWS } from "../paliers/games/cm1Recit";
import { acceptedOf, all, blankOf, defineMathsTests, itemsOf, ok, optionsOf, pairsOf, rightOption, sequenceOf, textOf, wrongOf, zonesOf, type Check, type Exo } from "@/lib/test-support/cm1MathsKit";

/**
 * LES RÉCITS DU CM1 (`fr-cm1-recit`).
 *
 * Le texte d'un récit est dans l'énoncé. Ce fichier le relit : il en tire ses phrases, ses mots, ses temps de verbe (tableau écrit à part), et vérifie que
 * - la bonne réponse d'une question est écrite dans la phrase du texte qui contient le mot-clé de la question, et qu'aucun mauvais choix ne l'est ;
 * - les événements à remettre dans l'ordre se retrouvent dans le texte, dans cet ordre ;
 * - le verbe dont on demande le temps est dans le texte, et son temps est celui du tableau du test ;
 * - la phrase vraie est prouvée par un passage du texte, les fausses par l'absence d'un mot du texte ;
 * - le mot de la phrase à trou revient ailleurs dans le texte, les mauvais choix n'y sont jamais ;
 * - le nombre de phrases et le nombre de fois qu'un mot est écrit sont recomptés avec la ponctuation et les mots du texte ;
 * - un titre est celui d'un tableau écrit à part, et un portrait celui d'une phrase qui décrit.
 */

const sentencesOf = (text: string) => text.split(/(?<=[.!?])\s+/u);
const fold = (text: string) => text.toLowerCase();
const promptParts = (prompt: string) => {
  const cut = prompt.lastIndexOf("\n\n");
  return { text: prompt.slice(0, cut), question: prompt.slice(cut + 2).replace(/^Lis le texte\. /u, "") };
};
const sameText = (text: string) => STORIES.find((story) => story.text === text);

/** Les verbes dont le temps est demandé, avec leur temps : écrits à part. */
const TENSES: Record<string, string> = {
  pousse: "Présent", porte: "Présent", "se dressait": "Imparfait", "a rencontré": "Passé composé", dansaient: "Imparfait", croise: "Présent", "a surpris": "Passé composé", vivait: "Imparfait", "a donné": "Passé composé", regardait: "Imparfait",
};
const TITLES = [
  ["Tôt le matin, Mamadou", "Une matinée de pêche"], ["Fatou va au marché", "Fatou au marché"], ["Autrefois, un énorme baobab", "Le baobab du village"], ["Un jour, le lièvre rusé", "Le lièvre et le lion"],
  ["Samedi soir, tout le village", "La fête du village"], ["Chaque matin, Mariama", "Mariama au puits"], ["Hier soir, Moussa", "Le voleur de mangues"], ["Il y a longtemps, Cheikh", "La pirogue de Cheikh"],
  ["La maîtresse a organisé", "Le concours de dessin"], ["Cette nuit-là, Khady", "La nuit des étoiles"],
] as const;
const titleOf = (text: string) => TITLES.find(([start]) => text.startsWith(start))?.[1];
/** Les phrases qui décrivent, écrites à part : un être ou un avoir à l'imparfait ou au présent, sans action. */
const PORTRAITS = new Set([
  "Le ciel est rose et la brume flotte sur la rivière.", "Le fleuve est large et très calme.", "Sa grand-mère est fatiguée mais souriante.", "Le marché est bruyant et très coloré.", "Il était très vieux et très haut.",
  "Son tronc était gris et ses branches étaient larges.", "La rivière était large et profonde.", "Le lion, gros et fier, avait très faim.", "La nuit était chaude et claire.", "Samedi soir, tout le village était en fête.",
  "Le chemin est long et sablonneux.", "Le soleil est déjà brûlant.", "Le voleur était petit et maigre.", "La nuit était sombre et silencieuse.", "Le ciel était gris et lourd.",
  "Le vent soufflait fort et les vagues étaient grandes.", "Le silence était total dans la classe.", "Après une heure, le concours était terminé.", "La nuit était douce et le village était calme.", "Il était vieux et très doux.",
]);
const BE_OR_HAVE = /(?<![\p{L}])(est|sont|était|étaient|avait|avaient)(?![\p{L}])/u;

const askOf = (question: string) => STORIES.flatMap((story) => [...story.asks, story.word]).find((entry) => entry.question === question);

// ---------------------------------------------------------------------------
// Une vérification par gabarit
// ---------------------------------------------------------------------------

/** La bonne réponse est dans la phrase du pivot, les mauvais choix n'y sont pas. */
function checkAnswerInSentence(exo: Exo): string | null {
  const { text, question } = promptParts(exo.prompt);
  const entry = askOf(question);
  if (!entry || !sameText(text)) return `question inconnue : ${question}`;
  const sentence = sentencesOf(text).find((candidate) => candidate.includes(entry.pivot));
  if (!sentence) return `aucune phrase ne contient « ${entry.pivot} »`;
  return all(
    ok(fold(sentence).includes(fold(rightOption(exo))), `la phrase « ${sentence} » ne contient pas « ${rightOption(exo)} »`),
    ok(wrongOf(exo).every((option) => !fold(sentence).includes(fold(option))), `un mauvais choix est écrit dans la phrase : ${optionsOf(exo).join(" | ")}`),
    ok(sentencesOf(text).filter((candidate) => candidate.includes(entry.pivot)).length >= 1, "pivot"),
  );
}

const checkOrder: Check = (exo) => {
  const { text, question } = promptParts(exo.prompt);
  const tiles = sequenceOf(exo);
  const positions = tiles.map((tile) => fold(text).indexOf(fold(tile)));
  return all(
    ok(question === "Remets les événements dans l'ordre du récit." && sameText(text) !== undefined, "énoncé inattendu"),
    ok(tiles.length === 4 && positions.every((position) => position >= 0), `une tuile n'est pas dans le texte : ${tiles.join(" / ")}`),
    ok(positions.every((position, index) => index === 0 || position > positions[index - 1]), `les tuiles ne suivent pas le texte : ${positions.join(", ")}`),
  );
};

const checkTense: Check = (exo) => {
  const { text, question } = promptParts(exo.prompt);
  const verb = question.match(/« ([^»]+) »/u)?.[1] ?? "";
  return all(
    ok(fold(text).includes(fold(verb)), `le verbe ${verb} n'est pas dans le texte`),
    ok(TENSES[verb] !== undefined && rightOption(exo) === TENSES[verb], `« ${verb} » est ${TENSES[verb]}, pas ${rightOption(exo)}`),
    ok(wrongOf(exo).every((option) => option !== TENSES[verb]), "un mauvais choix est le bon temps"),
  );
};

const checkTrue: Check = (exo) => {
  const { text, question } = promptParts(exo.prompt);
  const story = sameText(text);
  if (!story || question !== "Quelle phrase est vraie d'après le texte ?") return "énoncé inattendu";
  return all(
    ok(story.statement.right === rightOption(exo), `la phrase vraie est « ${story.statement.right} »`),
    ok(fold(text).includes(fold(story.statement.evidence)), `la preuve « ${story.statement.evidence} » n'est pas dans le texte`),
    ok(story.statement.absent.every((word) => !fold(text).includes(fold(word))), `un mot qui contredit est dans le texte : ${story.statement.absent.join(", ")}`),
    ok(wrongOf(exo).every((option) => story.statement.wrong.includes(option as never)), "les mauvais choix sont les phrases fausses du récit"),
  );
};

const checkTitle: Check = (exo) => {
  const { text } = promptParts(exo.prompt);
  const title = titleOf(text);
  const allTitles = TITLES.map(([, name]) => name);
  return all(
    ok(title !== undefined && rightOption(exo) === title, `le titre du texte est ${title}, pas ${rightOption(exo)}`),
    ok(wrongOf(exo).every((option) => allTitles.includes(option as never) && option !== title), `un mauvais choix n'est pas le titre d'un autre récit : ${optionsOf(exo).join(" | ")}`),
  );
};

const checkGap: Check = (exo) => {
  const { options, answer } = blankOf(exo);
  const filled = textOf(exo).replace("___", answer);
  const story = sameText(filled);
  if (!story) return "le texte rempli n'est pas un récit";
  const rest = textOf(exo).replace("___", "");
  const count = (word: string) => (fold(rest).match(new RegExp(`(?<![\\p{L}-])${word}(?![\\p{L}-])`, "gu")) ?? []).length;
  return all(
    ok(exo.prompt === "Complète le texte avec le bon mot.", "énoncé inattendu"),
    ok(count(fold(answer)) >= 1, `« ${answer} » ne revient pas ailleurs dans le texte`),
    ok(options.filter((option) => option !== answer).every((option) => !fold(story.text).includes(fold(option))), `un mauvais choix est écrit dans le texte : ${options.join(" | ")}`),
  );
};

const checkCount: Check = (exo) => {
  const { text, question } = promptParts(exo.prompt);
  const sentences = question === "Combien de phrases a ce texte ?" ? String(sentencesOf(text).length) : null;
  const word = question.match(/^Combien de fois le mot « ([^»]+) » est-il écrit dans ce texte \?$/u)?.[1];
  const times = word ? String((fold(text).match(new RegExp(`(?<![\\p{L}-])${fold(word)}(?![\\p{L}-])`, "gu")) ?? []).length) : null;
  const expected = sentences ?? times;
  return all(
    ok(sameText(text) !== undefined && expected !== null, `question illisible : ${question}`),
    ok(exo.answerKey === expected, `la réponse est ${expected}, pas ${exo.answerKey}`),
    ok(acceptedOf(exo)[0] === exo.answerKey && !/\d/u.test(text), "réponse admise, aucun chiffre dans le texte"),
  );
};

const checkLink: Check = (exo) => {
  const { text } = promptParts(exo.prompt);
  const pairs = pairsOf(exo);
  const sentences = sentencesOf(text);
  return all(
    ok(sameText(text) !== undefined && pairs.length === 3, "trois paires d'un récit"),
    ok(pairs.every((pair) => sentences.some((sentence) => fold(sentence).includes(fold(pair.left)) && sentence.includes(pair.right))), `une paire ne se lit pas dans une phrase du texte : ${pairs.map((pair) => `${pair.left} ~ ${pair.right}`).join(" ; ")}`),
    ok(new Set(pairs.map((pair) => pair.left)).size === 3, "trois débuts différents"),
  );
};

const checkSort: Check = (exo) => {
  const zones = zonesOf(exo);
  const items = itemsOf(exo);
  const sentences = new Set(STORIES.flatMap((story) => sentencesOf(story.text)));
  for (const item of items) {
    if (!sentences.has(item.text)) return `« ${item.text} » n'est pas une phrase d'un récit`;
    const portrait = PORTRAITS.has(item.text);
    if (portrait !== (item.correctZone === "Description")) return `« ${item.text} » est ${portrait ? "un portrait" : "une action"}, pas ${item.correctZone}`;
    if (portrait && !BE_OR_HAVE.test(item.text)) return `un portrait sans être ni avoir : ${item.text}`;
  }
  return all(ok(zones.join("|") === "Action|Description", "cases"), ok(zones.every((zone) => items.filter((item) => item.correctZone === zone).length === 3), "trois phrases par case"));
};

defineMathsTests({
  label: "du français du CM1 (les récits)",
  subject: "Français",
  hintsNeverWriteChoices: true,
  promptWords: 150,
  checks: {
    "cm1-rec-question": checkAnswerInSentence,
    "cm1-rec-mot": checkAnswerInSentence,
    "cm1-rec-ordre": checkOrder,
    "cm1-rec-temps": checkTense,
    "cm1-rec-vrai": checkTrue,
    "cm1-rec-titre": checkTitle,
    "cm1-rec-trou": checkGap,
    "cm1-rec-compte": checkCount,
    "cm1-rec-relier": checkLink,
    "cm1-rec-glisser": checkSort,
  },
  topicKinds: {
    "fr-cm1-recit": ["cm1-rec-question", "cm1-rec-mot", "cm1-rec-ordre", "cm1-rec-temps", "cm1-rec-vrai", "cm1-rec-titre", "cm1-rec-trou", "cm1-rec-compte", "cm1-rec-relier", "cm1-rec-glisser"],
  },
});

describe("les dix récits s'accordent avec les règles écrites à part", () => {
  it("dix récits de sept à neuf phrases, de cent mots au plus, sans apostrophe droite, sans deux-points, sans chiffre", () => {
    expect(STORIES).toHaveLength(10);
    for (const story of STORIES) {
      const sentences = sentencesOf(story.text);
      expect(sentences.length, story.title).toBeGreaterThanOrEqual(6);
      expect(sentences.length, story.title).toBeLessThanOrEqual(9);
      expect(story.text.split(/\s+/u).length, story.title).toBeLessThanOrEqual(100);
      expect(story.text, story.title).not.toMatch(/['\d:]/u);
      expect(titleOf(story.text), story.title).toBe(story.title);
    }
  });

  it("l'imparfait d'un verbe en -er garde le e seulement après un g (« mangeait », jamais « rameait »)", () => {
    const everything = STORIES.map((story) => JSON.stringify(story)).join(" ");
    expect(everything.match(/\p{L}*[^g\s]eai(?:s|t|ent)\b/gu) ?? []).toEqual([]);
  });

  it("chaque question a son mot-clé dans une phrase qui contient la bonne réponse et aucun mauvais choix", () => {
    for (const story of STORIES) {
      for (const entry of [...story.asks, story.word]) {
        const sentence = sentencesOf(story.text).find((candidate) => candidate.includes(entry.pivot));
        expect(sentence, entry.question).toBeDefined();
        expect(fold(sentence as string).includes(fold(entry.answer)), entry.question).toBe(true);
        for (const wrong of entry.wrong) expect(fold(sentence as string).includes(fold(wrong)), `${entry.question} ${wrong}`).toBe(false);
      }
    }
  });

  it("chaque verbe dont on demande le temps est dans le texte, avec le temps du tableau écrit à part", () => {
    for (const story of STORIES) {
      expect(fold(story.text).includes(fold(story.verb[0])), story.title).toBe(true);
      expect(TENSES[story.verb[0]], story.title).toBe(story.verb[1]);
    }
  });

  it("les quatre événements suivent le texte, la preuve est dans le texte, les mots qui contredisent n'y sont pas", () => {
    for (const story of STORIES) {
      const positions = story.order.map((fragment) => fold(story.text).indexOf(fold(fragment)));
      expect(positions.every((position) => position >= 0), story.title).toBe(true);
      expect(positions, story.title).toEqual([...positions].sort((a, b) => a - b));
      expect(fold(story.text).includes(fold(story.statement.evidence)), story.title).toBe(true);
      for (const word of story.statement.absent) expect(fold(story.text).includes(fold(word)), `${story.title} ${word}`).toBe(false);
    }
  });

  it("le mot à retrouver revient dans le texte, les mauvais choix n'y sont pas ; les couples se lisent dans une phrase", () => {
    for (const story of STORIES) {
      const times = (fold(story.text).match(new RegExp(`(?<![\\p{L}-])${fold(story.cloze.word)}(?![\\p{L}-])`, "gu")) ?? []).length;
      expect(times, story.title).toBeGreaterThanOrEqual(2);
      for (const wrong of story.cloze.wrong) expect(fold(story.text).includes(fold(wrong)), `${story.title} ${wrong}`).toBe(false);
      for (const [left, right] of story.pairs) expect(sentencesOf(story.text).some((sentence) => fold(sentence).includes(fold(left)) && sentence.includes(right)), `${story.title} ${left}`).toBe(true);
    }
  });

  it("les actions et les portraits sont des phrases du texte, rangés comme le tableau du test les range", () => {
    for (const story of STORIES) {
      const sentences = sentencesOf(story.text);
      for (const action of story.actions) {
        expect(sentences, action).toContain(action);
        expect(PORTRAITS.has(action), action).toBe(false);
      }
      for (const portrait of story.portraits) {
        expect(sentences, portrait).toContain(portrait);
        expect(PORTRAITS.has(portrait), portrait).toBe(true);
        expect(BE_OR_HAVE.test(portrait), portrait).toBe(true);
      }
    }
    expect(PORTRAITS.size).toBe(20);
  });

  it("toutes les lignes de chaque tableau passent la vérification de leur gabarit", () => {
    const qcmOf = (row: { prompt: string; answer: string; wrong: readonly string[] }) => ({ prompt: row.prompt, answerKey: row.answer, hints: [], payload: { options: [row.answer, ...row.wrong], correctIndex: 0 } }) as Exo;
    expect(ASK_ROWS).toHaveLength(30);
    for (const row of [...ASK_ROWS, ...WORD_ROWS]) {
      expect(new Set([row.answer, ...row.wrong]).size, row.prompt).toBe(3);
      expect(checkAnswerInSentence(qcmOf(row)), row.prompt).toBeNull();
    }
    for (const row of TENSE_ROWS) expect(checkTense(qcmOf(row)), row.prompt).toBeNull();
    for (const row of TRUE_ROWS) expect(checkTrue(qcmOf(row)), row.prompt).toBeNull();
    for (const row of TITLE_ROWS) {
      expect(checkTitle(qcmOf(row)), row.prompt).toBeNull();
      expect(row.answer.length).toBeLessThanOrEqual(2 * Math.max(...row.wrong.map((option) => option.length)));
    }
    for (const row of CLOZE_ROWS) expect(checkGap({ prompt: "Complète le texte avec le bon mot.", answerKey: row.answer, hints: [], payload: { text: row.text, blanks: [{ options: [row.answer, ...row.wrong], answer: row.answer }] } } as Exo), row.text).toBeNull();
    for (const row of ORDER_ROWS) expect(checkOrder({ prompt: row.prompt, answerKey: "", hints: [], payload: { correctSequence: [...row.sequence] } } as Exo), row.prompt).toBeNull();
    for (const row of COUNT_ROWS) expect(checkCount({ prompt: row.prompt, answerKey: row.accepted[0], hints: [], payload: { acceptedAnswers: [...row.accepted] } } as Exo), row.prompt).toBeNull();
    for (const row of LINK_ROWS) expect(checkLink({ prompt: row.prompt, answerKey: "", hints: [], payload: { pairs: row.pairs } } as Exo), row.prompt).toBeNull();
    for (const row of SORT_ROWS) expect(checkSort({ prompt: row.prompt, answerKey: "", hints: [], payload: { zones: [...row.zones], items: row.items.map((item) => ({ text: item.text, correctZone: item.zone })) } } as Exo), JSON.stringify(row.items)).toBeNull();
    expect(COUNT_ROWS).toHaveLength(20);
    expect(SORT_ROWS).toHaveLength(30);
  });

  it("aucune ligne en double dans un tableau", () => {
    for (const keys of [ASK_ROWS.map((r) => r.prompt), WORD_ROWS.map((r) => r.prompt), COUNT_ROWS.map((r) => r.prompt), SORT_ROWS.map((r) => JSON.stringify(r.items)), TITLE_ROWS.map((r) => r.prompt)]) {
      expect(new Set(keys).size).toBe(keys.length);
    }
  });
});

describe("les vérifications des récits voient un énoncé abîmé", () => {
  const story = STORIES[0];
  const qcm = (question: string, options: string[], correctIndex: number) => ({ type: "qcm", prompt: `${story.text}\n\nLis le texte. ${question}`, answerKey: options[correctIndex], hints: [], payload: { options, correctIndex } }) as Exo;

  it("la réponse est dans la phrase du pivot", () => {
    expect(checkAnswerInSentence(qcm("Où Mamadou pousse-t-il sa pirogue ?", ["sur le fleuve", "sur la plage", "dans la mer"], 0))).toBeNull();
    expect(checkAnswerInSentence(qcm("Où Mamadou pousse-t-il sa pirogue ?", ["sur le fleuve", "sur la plage", "dans la mer"], 1))).not.toBeNull();
  });

  it("le temps du verbe et le titre", () => {
    expect(checkTense(qcm("À quel temps est écrit le verbe « pousse » dans le texte ?", ["Présent", "Imparfait", "Passé composé"], 0))).toBeNull();
    expect(checkTense(qcm("À quel temps est écrit le verbe « pousse » dans le texte ?", ["Présent", "Imparfait", "Passé composé"], 1))).not.toBeNull();
    expect(checkTitle(qcm("Quel titre convient le mieux à ce texte ?", ["Une matinée de pêche", "Fatou au marché", "La nuit des étoiles"], 1))).not.toBeNull();
  });

  it("l'ordre des événements suit le texte", () => {
    const tiles = (list: string[]) => ({ prompt: `${story.text}\n\nLis le texte. Remets les événements dans l'ordre du récit.`, answerKey: "", hints: [], payload: { correctSequence: list } }) as Exo;
    expect(checkOrder(tiles(story.order.map((fragment) => fragment.charAt(0).toUpperCase() + fragment.slice(1))))).toBeNull();
    expect(checkOrder(tiles([story.order[1], story.order[0], story.order[2], story.order[3]]))).not.toBeNull();
  });

  it("le nombre de phrases et de mots est recompté", () => {
    const count = (question: string, answer: string) => ({ prompt: `${story.text}\n\nLis le texte. ${question}`, answerKey: answer, hints: [], payload: { acceptedAnswers: [answer] } }) as Exo;
    expect(checkCount(count("Combien de phrases a ce texte ?", "7"))).toBeNull();
    expect(checkCount(count("Combien de phrases a ce texte ?", "6"))).not.toBeNull();
    expect(checkCount(count("Combien de fois le mot « pirogue » est-il écrit dans ce texte ?", "2"))).toBeNull();
  });
});
