import { describe, expect, it, vi } from "vitest";
import { auditExercise } from "../paliers/exerciseAudit";
import { GAME_KINDS, generateGames, regenerateGame, type GameKind } from "../paliers/games";
import { makeContext, type GameLevel } from "../paliers/games/shared";
import { topicUsesModel } from "../paliers/pregen";
import { allProgrammeEntries } from "../programme";
import { PALIER_SIZE } from "../paliers/scoring";

// Ces tests jouent des milliers de tirages : sur le serveur de CI, chargé, l'un d'eux dépasse les 5 secondes par défaut.
vi.setConfig({ testTimeout: 30_000 });

/**
 * LES HOMOPHONES DU CE1 : a ou à, et ou est, on ou ont, l'astuce (avait, était, avaient), l'accord du verbe, le signe qui termine une phrase.
 *
 * Chaque test RECALCULE la bonne réponse avec ses propres tables, écrites à part : les phrases justes, le mot juste de chacune, les trois formes
 * de chaque verbe (un sujet, « tu », plusieurs sujets), le signe de chaque sorte de phrase. Un gabarit dont la réponse contredit sa règle échoue.
 * À la fin, des MUTATIONS : on abîme la bonne réponse d'un exercice juste, et chaque vérification doit le voir.
 */

const LEVELS: GameLevel[] = [1, 2, 3, 4];
const draws = LEVELS.flatMap((level) => Array.from({ length: 60 }, (_, n) => ({ level, seed: `homo:${level}:${n}` })));
const make = (kind: GameKind, d: { level: GameLevel; seed: string }) => GAME_KINDS[kind].make(makeContext("CE1", d.level, `${kind}:${d.seed}`));

type Exo = { type?: string; prompt: string; answerKey: string; hints: string[]; payload: Record<string, unknown> };
const optionsOf = (exo: Exo) => exo.payload.options as string[];
const rightOption = (exo: Exo) => optionsOf(exo)[exo.payload.correctIndex as number];
const wrongOf = (exo: Exo) => optionsOf(exo).filter((option) => option !== rightOption(exo));
const itemsOf = (exo: Exo) => exo.payload.items as { text: string; correctZone: string }[];
const zonesOf = (exo: Exo) => exo.payload.zones as string[];
const pairsOf = (exo: Exo) => exo.payload.pairs as { left: string; right: string }[];
const blankOf = (exo: Exo) => (exo.payload.blanks as { options: string[]; answer: string }[])[0];
const textOf = (exo: Exo) => String(exo.payload.text);
const acceptedOf = (exo: Exo) => exo.payload.acceptedAnswers as string[];

const fold = (text: string) => text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
const apostrophes = (text: string) => (text.match(/'/g) ?? []).length;
const wordCount = (text: string) => text.split(/\s+/).filter((token) => /[\p{L}\p{N}]/u.test(token)).length;
const same = (a: readonly string[], b: readonly string[]) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());

type Check = (exo: Exo) => string | null;
const ok = (condition: boolean, message: string) => (condition ? null : message);
const all = (...results: (string | null)[]) => results.find((result) => result !== null) ?? null;
const words = (text: string) => text.replace(/[.,!?]/g, "").split(/\s+/).filter(Boolean);

// ===========================================================================
// LES TABLES, ÉCRITES À PART
// ===========================================================================

/** Pour chaque mot juste, les deux mots faux que le gabarit propose : jamais un mot qui irait aussi. */
const WRONG_WORDS: Record<string, string[]> = { a: ["à", "as"], à: ["a", "as"], est: ["et", "es"], et: ["est", "es"], on: ["ont", "en"], ont: ["on", "en"] };

type Row = readonly [string, string];
const A_TABLE: readonly Row[] = [
  ["Awa ___ un beau cahier.", "a"],
  ["Moussa va ___ l'école.", "à"],
  ["Fatou ___ une robe bleue.", "a"],
  ["Les enfants jouent ___ cache-cache.", "à"],
  ["Le chat ___ faim.", "a"],
  ["Nous allons ___ la plage.", "à"],
  ["Aminata ___ un petit frère.", "a"],
  ["Le car part ___ midi.", "à"],
  ["Mon oncle ___ un grand bateau.", "a"],
  ["Je donne un cadeau ___ Mariama.", "à"],
  ["Omar ___ mangé du riz ce matin.", "a"],
  ["Le marché est ___ côté de la mosquée.", "à"],
];
const ET_TABLE: readonly Row[] = [
  ["Moussa ___ grand.", "est"],
  ["Awa mange du riz ___ du poisson.", "et"],
  ["Le chat ___ sur la natte.", "est"],
  ["Fatou ___ Aminata jouent.", "et"],
  ["Ma maman ___ au marché.", "est"],
  ["J'ai un cahier ___ un stylo.", "et"],
  ["Le ciel ___ bleu.", "est"],
  ["Le chien court ___ saute.", "et"],
  ["La mangue ___ très sucrée.", "est"],
  ["Il chante ___ il danse.", "et"],
  ["Cheikh ___ content de sa note.", "est"],
  ["Nous lavons le riz ___ nous le mettons dans la marmite.", "et"],
];
const ON_TABLE: readonly Row[] = [
  ["Les filles ___ des robes neuves.", "ont"],
  ["Au marché, ___ achète des mangues.", "on"],
  ["Moussa et Awa ___ un chat.", "ont"],
  ["À midi, ___ mange du poisson.", "on"],
  ["Les élèves ___ leurs cahiers.", "ont"],
  ["Dans la classe, ___ écoute la maîtresse.", "on"],
  ["Mes cousins ___ une grande case.", "ont"],
  ["Le soir, ___ regarde les étoiles.", "on"],
  ["Ils ___ gagné le match.", "ont"],
  ["Quand il fait chaud, ___ boit de l'eau.", "on"],
  ["Les pêcheurs ___ attrapé des poissons.", "ont"],
  ["À la récréation, ___ joue au ballon.", "on"],
];

const gapChecker =
  (table: readonly Row[]): Check =>
  (exo) => {
    const row = table.find(([text, answer]) => text === textOf(exo) && answer === blankOf(exo).answer);
    if (!row) return `phrase inconnue : ${textOf(exo)} → ${blankOf(exo).answer}`;
    return all(
      ok(same(blankOf(exo).options, [row[1], ...WRONG_WORDS[row[1]]]), `les choix : ${blankOf(exo).options.join(" | ")}`),
      ok(exo.prompt === "Complète la phrase.", exo.prompt),
    );
  };

// L'astuce : le mot qu'on essaie à la place de a, de est, de ont.
const SUBSTITUTE: Record<string, string> = { a: "avait", est: "était", ont: "avaient" };
const TRICK_SENTENCES: Record<string, readonly string[]> = {
  a: ["Awa a un chat.", "Le chat a faim.", "Mon oncle a un bateau.", "Omar a mangé du riz."],
  est: ["Moussa est grand.", "Le ciel est bleu.", "La mangue est sucrée.", "Cheikh est content."],
  ont: ["Les filles ont des robes.", "Mes cousins ont une case.", "Ils ont gagné le match.", "Les pêcheurs ont attrapé un poisson."],
};

const checkTrick: Check = (exo) => {
  const match = /^Quel mot peut remplacer le mot (a|est|ont) dans « (.+) » \?$/u.exec(exo.prompt);
  if (!match) return `énoncé inconnu : ${exo.prompt}`;
  const [, word, sentence] = match;
  return all(
    ok(TRICK_SENTENCES[word].includes(sentence), `phrase inconnue : ${sentence}`),
    ok(words(sentence).includes(word), `le mot ${word} n'est pas dans la phrase`),
    ok(rightOption(exo) === SUBSTITUTE[word], `${word} se remplace par ${SUBSTITUTE[word]}, pas par ${rightOption(exo)}`),
    ok(same(optionsOf(exo), ["avait", "était", "avaient"]), optionsOf(exo).join(" | ")),
  );
};

// La phrase bien écrite : la phrase juste et ses deux fautes.
const WRITTEN_TABLE: readonly Row[] = [
  ["Awa ___ un grand panier.", "a"],
  ["Moussa ___ Awa sont amis.", "et"],
  ["Les garçons ___ soif.", "ont"],
  ["Mariama va ___ la pêche.", "à"],
  ["Le riz ___ chaud.", "est"],
  ["Dans la cour, ___ joue.", "on"],
  ["Le vendeur ___ vendu des mangues.", "a"],
  ["Nous mangeons du pain ___ du fromage.", "et"],
  ["Mes frères ___ un ballon.", "ont"],
  ["Ma grand-mère pense ___ nous.", "à"],
  ["Ce garçon ___ très fort.", "est"],
  ["Le soir, ___ dort dans sa case.", "on"],
];
const checkWritten: Check = (exo) => {
  const row = WRITTEN_TABLE.find(([text, answer]) => text.replace("___", answer) === rightOption(exo));
  if (!row) return `phrase juste inconnue : ${rightOption(exo)}`;
  const faults = WRONG_WORDS[row[1]].map((word) => row[0].replace("___", word));
  return all(
    ok(exo.prompt === "Quelle phrase est bien écrite ?", exo.prompt),
    ok(same(wrongOf(exo), faults), `les fautes : ${wrongOf(exo).join(" | ")}`),
    ok(optionsOf(exo).every((option) => /^[A-ZÉÀ].*\.$/u.test(option)), "majuscule et point"),
  );
};

// L'accord du verbe : les trois formes de chaque verbe (un sujet, tu, plusieurs sujets).
const FORMS: readonly (readonly [string, string, string])[] = [
  ["joue", "joues", "jouent"],
  ["mange", "manges", "mangent"],
  ["chante", "chantes", "chantent"],
  ["danse", "danses", "dansent"],
  ["marche", "marches", "marchent"],
  ["compte", "comptes", "comptent"],
  ["range", "ranges", "rangent"],
  ["écoute", "écoutes", "écoutent"],
  ["lave", "laves", "lavent"],
  ["lance", "lances", "lancent"],
];
const AGREE_TEXTS = [
  "Moussa ___ au ballon.",
  "Les enfants ___ dans la cour.",
  "Tu ___ du riz.",
  "Awa ___ une chanson.",
  "Les filles ___ ensemble.",
  "Tu ___ bien.",
  "Mes amis ___ au marché.",
  "Le vendeur ___ les pièces.",
  "Tu ___ ton cahier.",
  "Les élèves ___ la maîtresse.",
  "Mon grand frère ___ le riz.",
  "Les pêcheurs ___ leur filet.",
];
/** La personne du sujet : 0 un seul sujet, 1 « tu », 2 plusieurs sujets. */
const personOf = (text: string) => (/^Tu /u.test(text) ? 1 : /^(?:Les|Mes|Ses|Elles|Ils) /u.test(text) ? 2 : 0);
const checkAgree: Check = (exo) => {
  const forms = FORMS.find((candidate) => candidate.includes(blankOf(exo).answer));
  if (!forms) return `verbe inconnu : ${blankOf(exo).answer}`;
  return all(
    ok(AGREE_TEXTS.includes(textOf(exo)), `phrase inconnue : ${textOf(exo)}`),
    ok(forms[personOf(textOf(exo))] === blankOf(exo).answer, `${textOf(exo)} → ${blankOf(exo).answer}, la règle dit ${forms[personOf(textOf(exo))]}`),
    ok(same(blankOf(exo).options, forms), `les choix : ${blankOf(exo).options.join(" | ")}`),
  );
};

// Le signe de fin : il se choisit sur ce que la phrase fait.
const SIGN_OF: Record<string, string> = { "pose une question": "point d'interrogation", "raconte quelque chose": "point", "crie la joie": "point d'exclamation" };
const SIGN_SENTENCES: Record<string, readonly string[]> = {
  "pose une question": ["Où vas-tu", "Qui joue avec moi", "Pourquoi pleures-tu", "Quand part le car"],
  "raconte quelque chose": ["Awa mange du riz", "Le chat dort sur la natte", "Moussa joue au ballon", "Nous allons au marché"],
  "crie la joie": ["Nous avons gagné", "Tu as réussi", "Quel beau cadeau", "Le voilà enfin"],
};
const checkSign: Check = (exo) => {
  const match = /^Quel signe termine cette phrase qui (.+?) \? « (.+) »$/u.exec(exo.prompt);
  if (!match) return `énoncé inconnu : ${exo.prompt}`;
  const [, kind, sentence] = match;
  if (!SIGN_OF[kind]) return `sorte de phrase inconnue : ${kind}`;
  return all(
    ok(SIGN_SENTENCES[kind].includes(sentence), `phrase inconnue : ${sentence}`),
    ok(kind !== "pose une question" || /^(?:Où|Qui|Pourquoi|Quand|Comment|Combien) /u.test(sentence), "une question commence par un mot interrogatif"),
    ok(rightOption(exo) === SIGN_OF[kind], `une phrase qui ${kind} se termine par le ${SIGN_OF[kind]}, pas par le ${rightOption(exo)}`),
    ok(same(optionsOf(exo), ["point", "point d'interrogation", "point d'exclamation"]), optionsOf(exo).join(" | ")),
  );
};

// Écrire le mot : jamais a ou à.
const WRITE_TABLE: readonly Row[] = [
  ["Le pain ___ chaud.", "est"],
  ["Awa ___ Moussa chantent.", "et"],
  ["Les chats ___ faim.", "ont"],
  ["Au marché, ___ vend des fruits.", "on"],
  ["Ma tante ___ gentille.", "est"],
  ["Le chat ___ le chien dorment.", "et"],
  ["Les enfants ___ un ballon.", "ont"],
  ["Le dimanche, ___ va à la mosquée.", "on"],
  ["Ce garçon ___ très rapide.", "est"],
  ["Fatou lit un livre ___ range sa case.", "et"],
  ["Elles ___ fini leur travail.", "ont"],
  ["Le soir, ___ rentre à la maison.", "on"],
];
const checkWrite: Check = (exo) => {
  const match = /^Écris le mot qui manque dans « (.+) »$/u.exec(exo.prompt);
  if (!match) return `énoncé inconnu : ${exo.prompt}`;
  const row = WRITE_TABLE.find(([text]) => text === match[1]);
  if (!row) return `phrase inconnue : ${match[1]}`;
  return all(
    ok(same(acceptedOf(exo), [row[1]]), `réponses admises : ${acceptedOf(exo).join(" | ")}`),
    ok(exo.answerKey === row[1], exo.answerKey),
    ok(!["a", "à"].includes(row[1]), "a et à ne s'écrivent pas au clavier"),
  );
};

// Relier : une phrase par mot, où un seul des six mots va.
const LINK_SENTENCE: Record<string, string> = {
  "Le singe ___ soif.": "a",
  "Il pense ___ sa maman.": "à",
  "Le riz ___ le poisson sont chauds.": "et",
  "Le garçon ___ fatigué.": "est",
  "Après l'école, ___ rentre à la case.": "on",
  "Les poules ___ des poussins.": "ont",
};
const checkLink: Check = (exo) => {
  for (const pair of pairsOf(exo)) if (LINK_SENTENCE[pair.left] !== pair.right) return `« ${pair.left} » relié à « ${pair.right} »`;
  const rights = pairsOf(exo).map((pair) => pair.right);
  return all(
    ok(pairsOf(exo).length === 3, "trois paires"),
    ok(!(rights.includes("a") && rights.includes("à")), "jamais a avec à : le contrôleur efface l'accent"),
    ok(exo.prompt === "Relie chaque phrase au mot qui complète son trou.", exo.prompt),
  );
};

// Glisser : six phrases par mot.
const BINS: Record<string, readonly string[]> = {
  a: ["Ma sœur ___ un chat noir.", "Le maître ___ une règle.", "Awa ___ très peur.", "Mon père ___ un vélo.", "Elle ___ cassé son stylo.", "Le chien ___ un os."],
  à: ["Nous parlons ___ la maîtresse.", "Le bus part ___ huit heures.", "Tu joues ___ la corde.", "Je vais ___ la pêche.", "Elle écrit ___ son oncle.", "Ils rentrent ___ la maison."],
  et: ["Moussa ___ Fatou lisent.", "Je mange du pain ___ du beurre.", "Il court ___ il saute.", "La rue ___ la place sont vides.", "Elle rit ___ elle chante.", "Le soleil ___ la lune brillent."],
  est: ["Le chat ___ noir.", "Mon frère ___ au lit.", "La nuit ___ calme.", "Ce fruit ___ mûr.", "Elle ___ en retard.", "Le lac ___ profond."],
  on: ["Ce soir, ___ chante.", "À la fête, ___ danse.", "Chez moi, ___ mange tôt.", "Au village, ___ se connaît.", "Sous l'arbre, ___ s'assoit.", "Le matin, ___ se lève."],
  ont: ["Mes sœurs ___ un chien.", "Les chats ___ soif.", "Elles ___ peur du noir.", "Les vaches ___ du lait.", "Ils ___ une grande case.", "Les oiseaux ___ des ailes."],
};
const PAIRS_OF_ZONES: readonly (readonly [string, string])[] = [
  ["a", "à"],
  ["est", "et"],
  ["on", "ont"],
];
const checkSort: Check = (exo) => {
  const zones = zonesOf(exo);
  if (!PAIRS_OF_ZONES.some((pair) => same(pair, zones))) return `cases ${zones.join(" | ")}`;
  for (const item of itemsOf(exo)) if (!BINS[item.correctZone]?.includes(item.text)) return `« ${item.text} » rangé dans « ${item.correctZone} », la table dit autre chose`;
  return all(
    ok(zones.every((zone) => itemsOf(exo).some((item) => item.correctZone === zone)), "chaque case reçoit au moins une phrase"),
    ok(itemsOf(exo).length >= 4 && itemsOf(exo).length <= 5, `${itemsOf(exo).length} phrases`),
  );
};

const CHECKS: Record<string, Check> = {
  "ce1-fr-homo-a": gapChecker(A_TABLE),
  "ce1-fr-homo-et": gapChecker(ET_TABLE),
  "ce1-fr-homo-on": gapChecker(ON_TABLE),
  "ce1-fr-homo-astuce": checkTrick,
  "ce1-fr-homo-phrase": checkWritten,
  "ce1-fr-homo-accord": checkAgree,
  "ce1-fr-homo-signe": checkSign,
  "ce1-fr-homo-ecrire": checkWrite,
  "ce1-fr-homo-relier": checkLink,
  "ce1-fr-homo-glisser": checkSort,
};

const KINDS = Object.keys(CHECKS) as GameKind[];
const TOPIC_KEY = "fr-ce1-homophones";
const entry = allProgrammeEntries().find((candidate) => candidate.topic.key === TOPIC_KEY)!;
const games = () => entry.topic.games ?? [];

describe("chaque gabarit des homophones du CE1 a sa vérification", () => {
  it("couvre exactement les dix gabarits de la thématique", () => {
    expect(KINDS).toHaveLength(10);
    expect([...games().map((spec) => spec.kind as string)].sort()).toEqual([...KINDS].sort());
    for (const kind of KINDS) expect(Object.keys(GAME_KINDS), kind).toContain(kind);
  });
});

describe("les gabarits des homophones recalculent juste, depuis des tables et des règles écrites à part", () => {
  for (const kind of KINDS) {
    it(`${kind} : la bonne réponse se lit dans la règle, à tous les niveaux`, () => {
      for (const d of draws) {
        const exo = make(kind, d) as unknown as Exo;
        expect(CHECKS[kind](exo), `${kind} niveau ${d.level} : ${exo.prompt}`).toBeNull();
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
      for (const d of draws.filter((_, i) => i % 4 === 0)) {
        const exo = make(kind, d) as unknown as Exo;
        const broken = mutate(kind, exo);
        if (!broken) continue;
        mutated += 1;
        expect(CHECKS[kind](broken), `${kind} niveau ${d.level} : ${exo.prompt}`).not.toBeNull();
      }
      expect(mutated, kind).toBeGreaterThan(0);
    });
  }

  it("voient aussi un énoncé abîmé : un « tu » avec « mange », « est » dans « il chante ___ il danse », un point pour une question", () => {
    const gap = (text: string, answer: string, options: string[]) => ({ type: "fill-blank", prompt: "Complète la phrase.", answerKey: answer, hints: [], payload: { text, blanks: [{ options, answer }] } }) as Exo;
    expect(CHECKS["ce1-fr-homo-accord"](gap("Tu ___ du riz.", "mange", ["mange", "manges", "mangent"]))).not.toBeNull();
    expect(CHECKS["ce1-fr-homo-et"](gap("Il chante ___ il danse.", "est", ["est", "et", "es"]))).not.toBeNull();
    expect(CHECKS["ce1-fr-homo-a"](gap("Moussa va ___ l'école.", "a", ["a", "à", "as"]))).not.toBeNull();
    const sign = { type: "qcm", prompt: "Quel signe termine cette phrase qui pose une question ? « Où vas-tu »", answerKey: "point", hints: [], payload: { options: ["point", "point d'interrogation", "point d'exclamation"], correctIndex: 0 } } as Exo;
    expect(CHECKS["ce1-fr-homo-signe"](sign)).not.toBeNull();
    const trick = { type: "qcm", prompt: "Quel mot peut remplacer le mot est dans « Moussa est grand. » ?", answerKey: "avait", hints: [], payload: { options: ["avait", "était", "avaient"], correctIndex: 0 } } as Exo;
    expect(CHECKS["ce1-fr-homo-astuce"](trick)).not.toBeNull();
  });
});

// ===========================================================================
// LES RÈGLES COMMUNES
// ===========================================================================

describe("tous les gabarits des homophones du CE1", () => {
  const exos = KINDS.flatMap((kind) => draws.filter((_, i) => i % 3 === 0).map((d) => ({ kind, exo: make(kind, d) as unknown as Exo })));

  const texts = (exo: Exo): string[] => {
    const out = [...exo.hints];
    if (exo.payload.options) out.push(...optionsOf(exo));
    if (exo.payload.blanks) out.push(textOf(exo), ...blankOf(exo).options);
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

  it("n'écrivent aucun émoji, ni dans un énoncé, ni sur une tuile, ni dans un indice, et aucun U+FE0F", () => {
    for (const { kind, exo } of exos) {
      expect(/\p{Extended_Pictographic}/u.test(exo.prompt), `${kind} : ${exo.prompt}`).toBe(false);
      for (const text of texts(exo)) {
        expect(text.includes("\uFE0F"), `${kind} : « ${text} »`).toBe(false);
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
      }
    }
  });

  it("n'écrivent dans aucun indice un chiffre, ni un mot de quatre lettres ou plus de la bonne réponse, d'un choix ou d'une étiquette", () => {
    for (const { kind, exo } of exos) {
      const answers: string[] = [];
      if (exo.payload.options) answers.push(...optionsOf(exo));
      if (exo.payload.blanks) answers.push(...blankOf(exo).options);
      if (exo.payload.pairs) answers.push(...pairsOf(exo).flatMap((pair) => [pair.left, pair.right]));
      if (exo.payload.items) answers.push(...itemsOf(exo).map((item) => item.text), ...zonesOf(exo));
      if (exo.payload.acceptedAnswers) answers.push(...acceptedOf(exo));
      const forbidden = new Set(
        answers.flatMap((answer) =>
          fold(answer)
            .split(/[^a-z]+/)
            .filter((word) => word.length >= 4),
        ),
      );
      for (const hint of exo.hints) {
        expect(hint, `${kind} : « ${hint} » écrit un chiffre`).not.toMatch(/\d/);
        const hintWords = fold(hint).split(/[^a-z]+/);
        for (const word of forbidden) expect(hintWords, `${kind} : « ${hint} » écrit « ${word} »`).not.toContain(word);
      }
    }
  });

  it("donnent trois indices différents, et se refont à l'identique avec la même graine", () => {
    for (const kind of KINDS) {
      const a = GAME_KINDS[kind].make(makeContext("CE1", 2, "graine"));
      const b = GAME_KINDS[kind].make(makeContext("CE1", 2, "graine"));
      expect(a).toEqual(b);
      expect(a.hints).toHaveLength(3);
      expect(new Set(a.hints).size, kind).toBe(3);
    }
  });

  it("passent le contrôleur au CE1 sans aucun défaut, à tous les niveaux", () => {
    for (const { kind, exo } of exos) {
      const defects = auditExercise({
        type: GAME_KINDS[kind].type,
        prompt: exo.prompt,
        payload: exo.payload,
        answerKey: exo.answerKey,
        hints: exo.hints,
        class: "CE1",
        subject: "Français",
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
});

// ===========================================================================
// LA THÉMATIQUE DU PROGRAMME
// ===========================================================================

describe("la thématique a/à, et/est, on/ont du CE1", () => {
  it("remplit les dix places du palier, avec des jeux connus, sans appeler le modèle", () => {
    expect(games().reduce((sum, spec) => sum + spec.count, 0)).toBe(PALIER_SIZE);
    for (const spec of games()) {
      expect(Object.keys(GAME_KINDS), spec.kind).toContain(spec.kind);
      expect(spec.vocabulary, spec.kind).toBeUndefined();
    }
    expect(topicUsesModel(TOPIC_KEY)).toBe(false);
  });

  it("est celle du CE1, à quatre paliers, et garde sa clé", () => {
    expect(entry.klass).toBe("CE1");
    expect(entry.topic.palierCount).toBeUndefined();
    expect(entry.topic.name).toBe("a/à, et/est, on/ont");
  });

  it("fabrique des paliers entiers, de dix exercices, qui passent le contrôleur et la règle, aux quatre paliers", () => {
    for (let n = 0; n < 60; n++) {
      for (const palierIndex of [1, 2, 3, 4]) {
        const paliers = generateGames(games(), { klass: "CE1", palierIndex, palierCount: 4, seed: `${TOPIC_KEY}:${n}:${palierIndex}` });
        expect(paliers, `palier ${palierIndex}`).toHaveLength(PALIER_SIZE);
        const questions = paliers.map((game) => `${game.prompt}|${JSON.stringify(game.payload)}`);
        expect(new Set(questions).size, `#${n} palier ${palierIndex}`).toBe(questions.length);
        expect(new Set(paliers.map((game) => game.type)).size, `palier ${palierIndex}`).toBeGreaterThanOrEqual(4);
        for (const game of paliers) {
          const defects = auditExercise({ type: game.type, prompt: game.prompt, payload: game.payload, answerKey: game.answerKey, hints: game.hints, class: "CE1", subject: "Français" });
          expect(defects, `palier ${palierIndex} : ${game.prompt}`).toEqual([]);
          const kind = (game.payload.game as { kind: string }).kind;
          expect(CHECKS[kind](game as unknown as Exo), `palier ${palierIndex} ${kind} : ${game.prompt}`).toBeNull();
        }
      }
    }
  });

  it("ne pose pas, dans un palier, deux phrases à trou qui se complètent par le même mot", () => {
    for (let n = 0; n < 60; n++) {
      for (const palierIndex of [1, 2, 3, 4]) {
        const paliers = generateGames(games(), { klass: "CE1", palierIndex, palierCount: 4, seed: `gap:${n}:${palierIndex}` });
        const answers = paliers.filter((game) => game.type === "fill-blank").map((game) => (game.payload.blanks as { answer: string }[])[0].answer);
        expect(new Set(answers).size, `palier ${palierIndex} : ${answers.join(" ")}`).toBe(answers.length);
      }
    }
  });

  it("n'associe jamais « a » et « à » dans un même appariement (le contrôleur efface l'accent)", () => {
    for (let n = 0; n < 250; n++) {
      for (const level of LEVELS) {
        const exo = GAME_KINDS["ce1-fr-homo-relier"].make(makeContext("CE1", level, `relier:${level}:${n}`));
        const rights = (exo.payload.pairs as { right: string }[]).map((pair) => pair.right);
        expect(rights.includes("a") && rights.includes("à"), rights.join(" ")).toBe(false);
      }
    }
  });

  it("sert toutes les lignes de ses tableaux : aucune n'est perdue entre les paliers", () => {
    // Le nombre de questions différentes que chaque gabarit pose, sur les quatre paliers de la thématique et assez de graines.
    const EXPECTED: Record<string, number> = {
      "ce1-fr-homo-a": 12,
      "ce1-fr-homo-et": 12,
      "ce1-fr-homo-on": 12,
      "ce1-fr-homo-astuce": 12,
      "ce1-fr-homo-phrase": 12,
      "ce1-fr-homo-accord": 12,
      "ce1-fr-homo-signe": 12,
      "ce1-fr-homo-ecrire": 12,
    };
    const seen: Record<string, Set<string>> = {};
    const trios = new Set<string>();
    const tiles = new Set<string>();
    for (let n = 0; n < 250; n++) {
      for (const palierIndex of [1, 2, 3, 4]) {
        for (const game of generateGames(games(), { klass: "CE1", palierIndex, palierCount: 4, seed: `row:${n}:${palierIndex}` })) {
          const kind = (game.payload.game as { kind: string }).kind;
          if (EXPECTED[kind]) (seen[kind] ??= new Set()).add(`${game.prompt}|${game.answerKey}|${game.type === "fill-blank" ? String(game.payload.text) : ""}`);
          if (kind === "ce1-fr-homo-relier") trios.add((game.payload.pairs as { left: string }[]).map((pair) => pair.left).sort().join("|"));
          if (kind === "ce1-fr-homo-glisser") for (const item of game.payload.items as { text: string }[]) tiles.add(item.text);
        }
      }
    }
    for (const [kind, count] of Object.entries(EXPECTED)) expect(seen[kind]?.size, kind).toBe(count);
    // Six phrases, vingt trios, dont quatre réunissent a et à : seize trios servis.
    expect(trios.size).toBe(16);
    expect([...tiles].sort()).toEqual(Object.values(BINS).flat().sort());
  });

  it("ne repose presque jamais la même question à deux paliers", () => {
    let repeated = 0;
    let total = 0;
    for (let n = 0; n < 60; n++) {
      const before = new Set<string>();
      for (const palierIndex of [1, 2, 3, 4]) {
        const paliers = generateGames(games(), { klass: "CE1", palierIndex, palierCount: 4, seed: `var:${n}:${palierIndex}` });
        const here = paliers.map((game) => `${game.prompt}|${game.type === "fill-blank" ? String(game.payload.text) : ""}|${game.answerKey}`);
        for (const question of here) {
          total += 1;
          if (before.has(question)) repeated += 1;
        }
        here.forEach((question) => before.add(question));
      }
    }
    expect(repeated / total).toBeLessThan(0.02);
  });

  it("garde de quoi servir la démo du site : un gabarit du type de chaque exercice de la banque", () => {
    const types = new Set(games().map((spec) => GAME_KINDS[spec.kind].type));
    for (const type of ["fill-blank", "qcm", "match", "drag-drop", "short-answer"]) expect(types.has(type as never), type).toBe(true);
  });

  it("refait chaque exercice raté par le code, sans le modèle", () => {
    for (const kind of KINDS) {
      const again = regenerateGame({ kind, level: 3 }, "CE1", `reprise:${kind}`);
      expect(again, kind).not.toBeNull();
      expect(again!.type, kind).toBe(GAME_KINDS[kind].type);
    }
  });
});
