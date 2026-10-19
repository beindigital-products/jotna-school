import { describe, expect, it } from "vitest";
import { auditExercise } from "../paliers/exerciseAudit";
import { GAME_KINDS, generateGames, type GameKind } from "../paliers/games";
import { LONG_SENTENCES, MEDIUM_SENTENCES, SHORT_SENTENCES } from "../paliers/games/phrases";
import { FEELINGS, FORMULAS, SITUATIONS } from "../paliers/games/politesse";
import { makeContext, type GameLevel } from "../paliers/games/shared";
import { LEXICON } from "../paliers/games/words";
import { topicUsesModel } from "../paliers/pregen";
import { PALIER_SIZE } from "../paliers/scoring";
import { allProgrammeEntries } from "../programme";

/**
 * LES GABARITS DU FRANÇAIS DU CI : les premières phrases (`fr-ci-phrases`) et la politesse (`fr-ci-politesse`).
 *
 * Chaque test RECALCULE la bonne réponse depuis l'énoncé et les tuiles, avec ses propres tables écrites à part :
 * les genres des noms et une petite grammaire (pour prouver qu'une phrase n'a qu'un seul ordre), la formule de
 * chaque situation, ce que dit un enfant qui a soif. Un gabarit dont la réponse contredit sa table échoue.
 * L'échantillon que le modèle avait écrit comptait seize exercices faux sur trente en phrases et sept sur
 * vingt-neuf en politesse (une case nommée comme la réponse, « Ousmane lis un livre », « s'il te plaît » dit
 * deux fois dans une même phrase, « S'il te plaît » rangé dans « Remerciements »).
 */

const LEVELS: GameLevel[] = [1, 2, 3, 4];
const draws = LEVELS.flatMap((level) => Array.from({ length: 60 }, (_, n) => ({ level, seed: `fr:${level}:${n}` })));
/** Un tirage sur deux : cent vingt tirages qui couvrent les quatre niveaux. */
const spread = draws.filter((_, i) => i % 2 === 0);
const make = (kind: GameKind, d: (typeof draws)[number]) => GAME_KINDS[kind].make(makeContext("CI", d.level, `${kind}:${d.seed}`));

type Exo = { prompt: string; answerKey: string; hints: string[]; payload: Record<string, unknown> };
const optionsOf = (exo: Exo) => exo.payload.options as string[];
const rightOption = (exo: Exo) => optionsOf(exo)[exo.payload.correctIndex as number];
const itemsOf = (exo: Exo) => exo.payload.items as { text: string; correctZone: string }[];
const zonesOf = (exo: Exo) => exo.payload.zones as string[];
const sequenceOf = (exo: Exo) => exo.payload.correctSequence as string[];
const pairsOf = (exo: Exo) => exo.payload.pairs as { left: string; right: string }[];
const blankOf = (exo: Exo) => (exo.payload.blanks as { options: string[]; answer: string }[])[0];

const fold = (text: string) => text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
const apostrophes = (text: string) => (text.match(/'/g) ?? []).length;
const permutations = <T>(items: T[]): T[][] =>
  items.length <= 1 ? [items] : items.flatMap((item, i) => permutations([...items.slice(0, i), ...items.slice(i + 1)]).map((rest) => [item, ...rest]));

const VARIATION_SELECTOR = String.fromCodePoint(0xfe0f);
const JOINER = String.fromCodePoint(0x200d);

const PHRASE_KINDS = ["phrase-ordre", "phrase-ecrite", "phrase-mots-compter", "phrase-mot-place"] as const satisfies readonly GameKind[];
const POLITESSE_KINDS = [
  "politesse-situation",
  "politesse-besoin",
  "politesse-relier",
  "politesse-glisser",
  "politesse-trou",
  "politesse-rencontre",
] as const satisfies readonly GameKind[];
const NEW_KINDS: readonly GameKind[] = [...PHRASE_KINDS, ...POLITESSE_KINDS];

// ---------------------------------------------------------------------------
// Les tables de vérité des phrases, écrites à part des gabarits
// ---------------------------------------------------------------------------

/** Les mots-outils qu'une phrase peut employer en plus du vocabulaire du CI. */
const FUNCTION_WORDS = ["a", "un", "une", "le", "la", "du", "son", "sa", "est", "boit", "mange", "voit", "lave", "met", "roule", "joue", "dort", "sur", "dans", "maman"];
const VOCABULARY = new Set([...LEXICON.map((entry) => fold(entry.word)), ...FUNCTION_WORDS]);

const GENDER: Record<string, "m" | "f"> = {
  lit: "m",
  ballon: "m",
  sac: "m",
  radio: "f",
  auto: "f",
  moto: "f",
  robe: "f",
  cafe: "m",
  bebe: "m",
  rat: "m",
  poule: "f",
  foulard: "m",
  mouton: "m",
  bateau: "m",
  tomate: "f",
  bonbon: "m",
  olive: "f",
  salon: "m",
};
const NAMES = ["lola", "toto", "modou", "penda", "papa", "tata", "maman"];

/** « un » et « le » vont avec un nom masculin, « une » et « la » avec un féminin, « son » aussi devant une voyelle (« son auto »). */
function agrees(det: string, noun: string): boolean {
  const gender = GENDER[noun];
  if (!gender) return false;
  if (["un", "le", "du"].includes(det)) return gender === "m";
  if (["une", "la", "sa"].includes(det)) return gender === "f";
  if (det === "son") return gender === "m" || /^[aeiouh]/.test(noun);
  return false;
}

const VERB_USES: Record<string, ("objet" | "adjectif" | "lieu" | "seul")[]> = {
  a: ["objet"],
  boit: ["objet", "seul"],
  mange: ["objet"],
  voit: ["objet"],
  lave: ["objet"],
  met: ["objet"],
  roule: ["lieu"],
  joue: ["lieu"],
  dort: ["lieu", "seul"],
  est: ["adjectif"],
};

/** La petite grammaire : quatre formes de phrase, avec l'accord du déterminant et de son nom. */
function isSentence(words: string[]): boolean {
  const w = words.map((word) => fold(word.replace(/\.$/, "")));
  if (NAMES.includes(w[0]) && VERB_USES[w[1]]) {
    const uses = VERB_USES[w[1]];
    if (w.length === 4 && uses.includes("objet")) return agrees(w[2], w[3]);
    if (w.length === 3 && uses.includes("adjectif")) return w[2] === "malade";
    if (w.length === 5 && uses.includes("lieu")) return ["sur", "dans"].includes(w[2]) && agrees(w[3], w[4]);
    return false;
  }
  if (["le", "la", "un", "une"].includes(w[0]) && w.length === 3 && agrees(w[0], w[1]) && VERB_USES[w[2]]?.includes("seul")) return true;
  return false;
}

/** Les ordres des mots qui font une phrase : la majuscule ouvre, le point ferme, la grammaire accepte. */
const validOrders = (tiles: string[]) =>
  permutations(tiles).filter((order) => /^\p{Lu}/u.test(order[0]) && order[order.length - 1].endsWith(".") && isSentence(order));

const ALL_SENTENCES = [...SHORT_SENTENCES, ...MEDIUM_SENTENCES, ...LONG_SENTENCES];
const sentenceSizeOf = (level: GameLevel) => (level <= 1 ? SHORT_SENTENCES : level === 2 ? MEDIUM_SENTENCES : LONG_SENTENCES);

describe("la table des phrases", () => {
  it("n'écrit que des mots que l'enfant a lus, sans apostrophe, une seule majuscule, un point, trois à six mots", () => {
    for (const sentence of ALL_SENTENCES) {
      const words = sentence.split(" ");
      expect(words.length, sentence).toBeGreaterThanOrEqual(3);
      expect(words.length, sentence).toBeLessThanOrEqual(6);
      expect(sentence, sentence).toMatch(/^\p{Lu}[^\p{Lu}]*\.$/u);
      expect(sentence, sentence).not.toContain("'");
      for (const word of words) expect(VOCABULARY.has(fold(word.replace(/\.$/, ""))), `${sentence} : « ${word} »`).toBe(true);
      // Deux tuiles identiques se confondraient.
      expect(new Set(words.map((word) => fold(word.replace(/\.$/, "")))).size, sentence).toBe(words.length);
    }
  });

  it("n'a pas deux fois la même phrase, et assez de phrases par niveau pour dix exercices sans répétition", () => {
    expect(new Set(ALL_SENTENCES).size).toBe(ALL_SENTENCES.length);
    for (const size of [SHORT_SENTENCES, MEDIUM_SENTENCES, LONG_SENTENCES]) expect(size.length).toBeGreaterThanOrEqual(12);
  });

  it("n'a qu'une manière de ranger les mots de chaque phrase, et c'est la bonne", () => {
    for (const sentence of ALL_SENTENCES) {
      const orders = validOrders(sentence.split(" "));
      expect(orders.map((order) => order.join(" ")), sentence).toEqual([sentence]);
    }
  });
});

describe("les gabarits des premières phrases recalculent juste", () => {
  it("phrase-ordre : les mots d'une phrase de la table, un seul ordre possible, qui est la bonne réponse", () => {
    for (const d of draws) {
      const exo = make("phrase-ordre", d);
      const sequence = sequenceOf(exo);
      expect(sentenceSizeOf(d.level), exo.answerKey).toContain(exo.answerKey);
      expect(sequence.join(" ")).toBe(exo.answerKey);
      expect(sequence.length).toBeGreaterThanOrEqual(3);
      // Même en mélangeant les tuiles, un seul ordre fait une phrase : celui de la réponse.
      expect(validOrders([...sequence].reverse()).map((order) => order.join(" "))).toEqual([exo.answerKey]);
      expect(exo.prompt).toContain("phrase");
    }
  });

  it("phrase-ordre : trois tirages d'un palier ne répètent pas une phrase", () => {
    for (const level of LEVELS) {
      for (let n = 0; n < 30; n++) {
        const ctx = makeContext("CI", level, `palier:${level}:${n}`);
        const seen = new Set<string>();
        for (let i = 0; i < 3; i++) seen.add(GAME_KINDS["phrase-ordre"].make(ctx).answerKey);
        expect(seen.size, `niveau ${level} #${n}`).toBe(3);
      }
    }
  });

  it("phrase-ecrite : une seule phrase a la majuscule ET le point ET aucune majuscule au milieu, et c'est la bonne réponse", () => {
    const startsCapital = (text: string) => /^\p{Lu}/u.test(text);
    const endsPoint = (text: string) => text.endsWith(".");
    const capitalInside = (text: string) => /\s\p{Lu}/u.test(text);
    for (const d of draws) {
      const exo = make("phrase-ecrite", d);
      const options = optionsOf(exo);
      expect(options).toHaveLength(3);
      // Les trois options sont la même phrase : seul leur soin d'écriture change.
      const wordsOf = (text: string) => fold(text).replace(/[.,]/g, "");
      expect(new Set(options.map(wordsOf)).size, exo.prompt).toBe(1);
      let good: string[];
      if (exo.prompt === "Quelle phrase commence par une majuscule ?") {
        expect(d.level).toBeLessThanOrEqual(1);
        good = options.filter(startsCapital);
      } else if (exo.prompt === "Quelle phrase finit par un point ?") {
        expect(d.level).toBeLessThanOrEqual(1);
        good = options.filter(endsPoint);
      } else {
        expect(exo.prompt).toBe("Quelle phrase est bien écrite ?");
        good = options.filter((option) => startsCapital(option) && endsPoint(option) && !capitalInside(option));
      }
      expect(good, `${exo.prompt} : ${options.join(" | ")}`).toEqual([rightOption(exo)]);
      expect(exo.answerKey).toBe(rightOption(exo));
      expect(ALL_SENTENCES).toContain(rightOption(exo));
    }
  });

  it("phrase-ecrite : au premier palier on ne regarde qu'une chose, ensuite la phrase entière", () => {
    const prompts = (level: GameLevel) => new Set(draws.filter((d) => d.level === level).map((d) => make("phrase-ecrite", d).prompt));
    expect(prompts(1)).toEqual(new Set(["Quelle phrase commence par une majuscule ?", "Quelle phrase finit par un point ?"]));
    expect(prompts(2)).toEqual(new Set(["Quelle phrase est bien écrite ?"]));
    expect(prompts(4)).toEqual(new Set(["Quelle phrase est bien écrite ?"]));
  });

  it("phrase-mots-compter : le nombre de mots de la phrase citée, avec des nombres tous différents", () => {
    for (const d of draws) {
      const exo = make("phrase-mots-compter", d);
      const sentence = /« (.+) »/.exec(exo.prompt)?.[1] as string;
      expect(ALL_SENTENCES).toContain(sentence);
      const count = sentence.split(" ").length;
      expect(rightOption(exo)).toBe(String(count));
      expect(exo.answerKey).toBe(String(count));
      const numbers = optionsOf(exo).map(Number);
      expect(new Set(numbers).size).toBe(numbers.length);
      for (const n of numbers) expect(n).toBeGreaterThanOrEqual(1);
    }
  });

  it("phrase-mot-place : le premier ou le dernier mot de la phrase citée, parmi trois mots de cette phrase", () => {
    for (const d of draws) {
      const exo = make("phrase-mot-place", d);
      const match = /^Quel est le (premier|dernier) mot de la phrase « (.+) » \?$/.exec(exo.prompt);
      expect(match, exo.prompt).not.toBeNull();
      const words = (match![2] as string).split(" ").map((word) => word.replace(/\.$/, ""));
      expect(ALL_SENTENCES).toContain(match![2]);
      const expected = match![1] === "premier" ? words[0] : words[words.length - 1];
      expect(rightOption(exo)).toBe(expected);
      for (const option of optionsOf(exo)) expect(words, exo.prompt).toContain(option);
    }
  });
});

// ---------------------------------------------------------------------------
// Les tables de vérité de la politesse
// ---------------------------------------------------------------------------

const FORMULA_TILE: Record<string, string> = {
  bonjour: "😊 Bonjour",
  aurevoir: "👋 Au revoir",
  merci: "🙏 Merci",
  svp: "🤲 S'il te plaît",
  pardon: "😔 Pardon",
  permission: "✋ Est-ce que je peux ?",
};
/** Les formules offertes à chaque niveau : trois, quatre, puis les six. */
const FORMULAS_AT: Record<number, string[]> = {
  1: ["bonjour", "aurevoir", "merci"],
  2: ["bonjour", "aurevoir", "merci", "svp"],
  3: ["bonjour", "aurevoir", "merci", "svp", "pardon", "permission"],
  4: ["bonjour", "aurevoir", "merci", "svp", "pardon", "permission"],
};
const FORMULA_OF_TILE = Object.fromEntries(Object.entries(FORMULA_TILE).map(([id, tile]) => [tile, id]));

/** Pour chaque situation : LA formule qui lui va, son étiquette courte, et les formules qui iraient aussi. */
const TRUTH: Record<string, { formula: string; tile: string; also: string[] }> = {
  "Tu arrives à l'école le matin.": { formula: "bonjour", tile: "🏫 J'arrive à l'école", also: [] },
  "Tu vois ton ami en arrivant.": { formula: "bonjour", tile: "🧒 Je vois mon ami", also: [] },
  "Tu entres dans la classe.": { formula: "bonjour", tile: "🔔 J'entre dans la classe", also: [] },
  "Tu croises ta voisine.": { formula: "bonjour", tile: "👵 Je croise ma voisine", also: [] },
  "Ton grand-père arrive chez toi.": { formula: "bonjour", tile: "👴 Grand-père arrive", also: [] },
  "Tu rencontres le directeur dans la cour.": { formula: "bonjour", tile: "👨 Je vois le directeur", also: [] },
  "Tu arrives chez ta tante.": { formula: "bonjour", tile: "🏡 J'arrive chez ma tante", also: [] },
  "Tu pars de l'école.": { formula: "aurevoir", tile: "🎒 Je pars de l'école", also: [] },
  "La classe est finie, tu rentres chez toi.": { formula: "aurevoir", tile: "🏠 Je rentre à la maison", also: [] },
  "Ton ami s'en va.": { formula: "aurevoir", tile: "🚶 Mon ami s'en va", also: [] },
  "Tu quittes la maîtresse en fin de journée.": { formula: "aurevoir", tile: "🌇 Je quitte la maîtresse", also: [] },
  "Ton oncle repart en voyage.": { formula: "aurevoir", tile: "🚌 Mon oncle repart", also: [] },
  "Tes amis rentrent chez eux.": { formula: "aurevoir", tile: "👥 Mes amis rentrent", also: [] },
  "Tu sors de chez ta tante.": { formula: "aurevoir", tile: "🚲 Je pars de chez ma tante", also: [] },
  "Le car s'en va.": { formula: "aurevoir", tile: "🚐 Le car s'en va", also: [] },
  "On te donne un cadeau.": { formula: "merci", tile: "🎁 On me donne un cadeau", also: [] },
  "Ton ami t'aide.": { formula: "merci", tile: "🤝 Mon ami m'aide", also: [] },
  "La maîtresse te donne un cahier.": { formula: "merci", tile: "📒 On me donne un cahier", also: [] },
  "Maman te sert à manger.": { formula: "merci", tile: "🍲 Maman me sert à manger", also: [] },
  "Un monsieur te tient la porte.": { formula: "merci", tile: "🚪 On me tient la porte", also: [] },
  "Ton ami te prête son crayon.": { formula: "merci", tile: "📝 On me prête un crayon", also: [] },
  "Ton oncle te donne un jus.": { formula: "merci", tile: "🍹 On me donne un jus", also: [] },
  "Ta tante te donne une mangue.": { formula: "merci", tile: "🥭 On me donne une mangue", also: [] },
  "Tu veux de l'eau.": { formula: "svp", tile: "🥤 Je veux de l'eau", also: ["permission"] },
  "Tu veux un bonbon.": { formula: "svp", tile: "🍬 Je veux un bonbon", also: ["permission"] },
  "Tu veux une banane.": { formula: "svp", tile: "🍌 Je veux une banane", also: ["permission"] },
  "Tu demandes du pain à papa.": { formula: "svp", tile: "🍞 Je demande du pain", also: ["permission"] },
  "Tu marches sur le pied de ton ami.": { formula: "pardon", tile: "🦶 Je marche sur son pied", also: [] },
  "Tu casses le jouet de ton ami.": { formula: "pardon", tile: "🧸 Je casse son jouet", also: [] },
  "Tu bouscules ton ami sans le vouloir.": { formula: "pardon", tile: "💥 Je bouscule mon ami", also: [] },
  "Tu renverses l'eau de ton ami.": { formula: "pardon", tile: "💦 Je renverse son eau", also: [] },
  "Tu veux sortir de la classe.": { formula: "permission", tile: "🏃 Je veux sortir", also: ["svp"] },
  "Tu veux jouer avec le ballon de ton ami.": { formula: "permission", tile: "⚽ Je veux son ballon", also: ["svp"] },
  "Tu veux aller boire de l'eau.": { formula: "permission", tile: "🚰 Je veux aller boire", also: ["svp"] },
  "Tu veux t'asseoir à côté de ton ami.": { formula: "permission", tile: "💺 Je veux m'asseoir", also: ["svp"] },
};
const SITUATION_OF_TILE = Object.fromEntries(Object.entries(TRUTH).map(([text, entry]) => [entry.tile, { text, ...entry }]));

/** Ce que dit un enfant dans chaque situation de ressenti, et le niveau où elle apparaît. */
const FEELING_TRUTH: Record<string, { tile: string; stage: number }> = {
  "Il fait très chaud et tu veux boire.": { tile: "🥛 J'ai soif", stage: 1 },
  "Tu n'as rien mangé depuis ce matin.": { tile: "🍚 J'ai faim", stage: 1 },
  "Tu as reçu un beau cadeau.": { tile: "😀 Je suis content", stage: 1 },
  "Ton jouet est cassé.": { tile: "😢 Je suis triste", stage: 2 },
  "Il est tard et tes yeux se ferment.": { tile: "😴 J'ai sommeil", stage: 3 },
  "Un gros chien aboie très fort.": { tile: "😨 J'ai peur", stage: 3 },
};
const stageOfLevel = (level: number) => (level <= 1 ? 1 : level === 2 ? 2 : 3);

describe("les tables de la politesse", () => {
  it("disent la même chose que celles des gabarits : mêmes formules, mêmes situations, mêmes étiquettes", () => {
    expect(Object.fromEntries(FORMULAS.map((formula) => [formula.id, `${formula.emoji} ${formula.label}`]))).toEqual(FORMULA_TILE);
    expect(SITUATIONS.map((situation) => situation.text).sort()).toEqual(Object.keys(TRUTH).sort());
    for (const situation of SITUATIONS) {
      const truth = TRUTH[situation.text];
      expect(situation.formula, situation.text).toBe(truth.formula);
      expect(`${situation.emoji} ${situation.short}`, situation.text).toBe(truth.tile);
      expect(situation.also ?? [], situation.text).toEqual(truth.also);
    }
    expect(FEELINGS.map((feeling) => feeling.situation).sort()).toEqual(Object.keys(FEELING_TRUTH).sort());
    for (const feeling of FEELINGS) {
      expect(`${feeling.emoji} ${feeling.label}`, feeling.situation).toBe(FEELING_TRUTH[feeling.situation].tile);
      expect(feeling.stage, feeling.situation).toBe(FEELING_TRUTH[feeling.situation].stage);
    }
  });

  it("donnent à chaque formule, situation et sentiment son propre émoji, ancien et sans sélecteur de variation", () => {
    const emojis = [
      ...FORMULAS.map((formula) => formula.emoji),
      ...SITUATIONS.map((situation) => situation.emoji),
      ...FEELINGS.map((feeling) => feeling.emoji),
    ];
    // Deux étiquettes au même dessin se confondraient.
    expect(new Set(emojis).size).toBe(emojis.length);
    for (const emoji of emojis) {
      expect(Array.from(emoji), emoji).toHaveLength(1);
      expect(emoji).toMatch(/^\p{Extended_Pictographic}$/u);
      const code = emoji.codePointAt(0) as number;
      // Rien d'Unicode 12 ou plus : un téléphone ancien montre une case vide.
      expect(code >= 0x1fa70 || (code >= 0x1f9c3 && code <= 0x1f9cf) || (code >= 0x1f7e0 && code <= 0x1f7eb), emoji).toBe(false);
    }
  });

  it("ne disent jamais la formule dans la situation, et n'ont qu'une formule qui lui va (les autres sont dans `also`)", () => {
    for (const situation of SITUATIONS) {
      const words = fold(situation.text).split(/[^a-z]+/);
      for (const formula of FORMULAS) {
        for (const word of fold(formula.label).split(/[^a-z]+/).filter((token) => token.length >= 4)) {
          expect(words, `${situation.text} dit « ${word} »`).not.toContain(word);
        }
      }
      expect(apostrophes(situation.text), situation.text).toBeLessThanOrEqual(1);
      expect(situation.text, situation.text).not.toContain(":");
      expect(situation.short.length, situation.short).toBeLessThanOrEqual(30);
    }
  });

  it("a assez de situations pour que dix exercices d'un palier n'en répètent pas trop", () => {
    for (const formula of FORMULAS) {
      const count = SITUATIONS.filter((situation) => situation.formula === formula.id).length;
      expect(count, formula.id).toBeGreaterThanOrEqual(4);
    }
    for (const id of ["bonjour", "aurevoir", "merci"]) {
      expect(SITUATIONS.filter((situation) => situation.formula === id).length, id).toBeGreaterThanOrEqual(7);
    }
  });
});

describe("les gabarits de la politesse recalculent juste", () => {
  it("politesse-situation : la formule de la situation est la seule bonne réponse, les autres ne vont pas et sont du niveau", () => {
    for (const d of draws) {
      const exo = make("politesse-situation", d);
      const text = exo.prompt.replace(/ Que dis-tu \?$/, "");
      const truth = TRUTH[text];
      expect(truth, exo.prompt).toBeDefined();
      expect(rightOption(exo), exo.prompt).toBe(FORMULA_TILE[truth.formula]);
      expect(exo.answerKey).toBe(rightOption(exo));
      expect(optionsOf(exo)).toHaveLength(3);
      for (const option of optionsOf(exo)) {
        const id = FORMULA_OF_TILE[option];
        expect(FORMULAS_AT[d.level], `${exo.prompt} : ${option}`).toContain(id);
        if (option !== rightOption(exo)) expect(truth.also, `${exo.prompt} : ${option} irait aussi`).not.toContain(id);
      }
    }
  });

  it("politesse-trou : la phrase dit la situation sans la formule, et le trou n'a qu'une bonne formule", () => {
    for (const d of draws) {
      const exo = make("politesse-trou", d);
      const text = exo.payload.text as string;
      expect(text.match(/___/g), text).toHaveLength(1);
      expect(text.endsWith(" Tu dis ___ !"), text).toBe(true);
      const situation = text.replace(/ Tu dis ___ !$/, "");
      const truth = TRUTH[situation];
      expect(truth, text).toBeDefined();
      const { options, answer } = blankOf(exo);
      expect(answer, text).toBe(FORMULA_TILE[truth.formula]);
      expect(exo.answerKey).toBe(answer);
      // La formule à trouver n'est écrite nulle part dans la phrase : le modèle l'écrivait deux fois.
      for (const option of options) {
        const label = option.split(" ").slice(1).join(" ");
        expect(fold(text), text).not.toContain(fold(label));
        if (option !== answer) expect(truth.also, `${text} : ${option} irait aussi`).not.toContain(FORMULA_OF_TILE[option]);
        expect(FORMULAS_AT[d.level], option).toContain(FORMULA_OF_TILE[option]);
      }
    }
  });

  it("politesse-besoin : ce que dit un enfant qui a soif, faim, peur…, avec des sentiments du niveau", () => {
    for (const d of draws) {
      const exo = make("politesse-besoin", d);
      const situation = exo.prompt.replace(/ Que dis-tu \?$/, "");
      const truth = FEELING_TRUTH[situation];
      expect(truth, exo.prompt).toBeDefined();
      expect(rightOption(exo), exo.prompt).toBe(truth.tile);
      expect(exo.answerKey).toBe(truth.tile);
      expect(truth.stage, exo.prompt).toBeLessThanOrEqual(stageOfLevel(d.level));
      for (const option of optionsOf(exo)) {
        const entry = Object.values(FEELING_TRUTH).find((candidate) => candidate.tile === option);
        expect(entry, option).toBeDefined();
        expect(entry!.stage, option).toBeLessThanOrEqual(stageOfLevel(d.level));
      }
    }
  });

  it("politesse-relier : chaque formule est reliée à la situation qui lui va, sans deux fois la même formule ni formules jumelles", () => {
    for (const d of draws) {
      const exo = make("politesse-relier", d);
      const pairs = pairsOf(exo);
      expect(pairs).toHaveLength(d.level >= 3 ? 4 : 3);
      const formulas = pairs.map((pair) => FORMULA_OF_TILE[pair.left]);
      expect(new Set(formulas).size, exo.answerKey).toBe(pairs.length);
      expect(new Set(pairs.map((pair) => pair.right)).size).toBe(pairs.length);
      for (const pair of pairs) {
        const situation = SITUATION_OF_TILE[pair.right];
        expect(situation, pair.right).toBeDefined();
        expect(situation.formula, `${pair.left} ~ ${pair.right}`).toBe(FORMULA_OF_TILE[pair.left]);
        expect(FORMULAS_AT[d.level]).toContain(situation.formula);
      }
      // Deux formules qui vont à la même demande ne sont jamais ensemble : l'enfant ne saurait pas laquelle relier.
      expect(formulas.includes("svp") && formulas.includes("permission"), exo.answerKey).toBe(false);
    }
  });

  it("politesse-glisser : chaque situation est sous la formule qui lui va, chaque case en a une ou deux", () => {
    for (const d of draws) {
      const exo = make("politesse-glisser", d);
      const zones = zonesOf(exo);
      const items = itemsOf(exo);
      expect(zones).toHaveLength(d.level <= 1 ? 2 : 3);
      expect(items).toHaveLength(d.level <= 1 ? 3 : d.level === 2 ? 4 : 5);
      for (const item of items) {
        const situation = SITUATION_OF_TILE[item.text];
        expect(situation, item.text).toBeDefined();
        expect(item.correctZone, item.text).toBe(FORMULA_TILE[situation.formula]);
        expect(zones).toContain(item.correctZone);
      }
      for (const zone of zones) {
        const inside = items.filter((item) => item.correctZone === zone).length;
        expect(inside, zone).toBeGreaterThanOrEqual(1);
        expect(inside, zone).toBeLessThanOrEqual(2);
      }
      const ids = zones.map((zone) => FORMULA_OF_TILE[zone]);
      expect(ids.includes("svp") && ids.includes("permission")).toBe(false);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("politesse-rencontre : on salue, on dit son nom, on part, dans cet ordre", () => {
    const names = new Set<string>();
    for (const d of draws) {
      const exo = make("politesse-rencontre", d);
      const [hello, name, bye] = sequenceOf(exo);
      expect(sequenceOf(exo)).toHaveLength(3);
      expect(hello).toBe("😊 Bonjour");
      expect(name).toMatch(/^🙋 Je m'appelle (Awa|Moussa|Fatou|Cheikh|Aminata|Modou)$/u);
      expect(bye).toBe("👋 Au revoir");
      names.add(name);
      expect(exo.prompt).toBe("Mets les paroles dans l'ordre de la rencontre.");
    }
    expect(names.size).toBeGreaterThanOrEqual(4);
  });
});

// ---------------------------------------------------------------------------
// Ce que tous les gabarits du français du CI ont en commun
// ---------------------------------------------------------------------------

describe("tous les gabarits du français du CI", () => {
  const exos = NEW_KINDS.flatMap((kind) => spread.map((d) => ({ kind, exo: make(kind, d) })));

  it("ne mettent aucun deux-points ni plus d'une apostrophe dans l'énoncé, et tiennent en vingt mots", () => {
    for (const { kind, exo } of exos) {
      expect(exo.prompt, kind).not.toMatch(/:/);
      expect(apostrophes(exo.prompt), `${kind} : ${exo.prompt}`).toBeLessThanOrEqual(1);
      const words = exo.prompt
        .replace(/\p{Extended_Pictographic}/gu, " ")
        .split(/\s+/)
        .filter((token) => /[\p{L}\p{N}]/u.test(token));
      expect(words.length, `${kind} : ${exo.prompt}`).toBeLessThanOrEqual(20);
    }
  });

  it("n'écrivent un émoji que sans sélecteur de variation (Unicode 11 au plus, un appareil ancien montre sinon un carré)", () => {
    for (const { kind, exo } of exos) {
      const text = JSON.stringify([exo.prompt, exo.payload, exo.answerKey, exo.hints]);
      expect(text, kind).not.toContain(VARIATION_SELECTOR);
      expect(text, kind).not.toContain(JOINER);
    }
  });

  it("proposent des choix tous différents, dont un seul est la bonne réponse", () => {
    for (const { kind, exo } of exos) {
      if (exo.payload.options) {
        const options = optionsOf(exo);
        expect(new Set(options).size, `${kind} : ${exo.prompt}`).toBe(options.length);
        expect(options.length, `${kind} : ${exo.prompt}`).toBeGreaterThanOrEqual(3);
        expect(options.filter((option) => option === rightOption(exo)), `${kind} : ${exo.prompt}`).toHaveLength(1);
      }
      if (exo.payload.blanks) {
        const { options, answer } = blankOf(exo);
        expect(new Set(options).size, `${kind} : ${exo.payload.text}`).toBe(options.length);
        expect(options.filter((option) => option === answer), `${kind} : ${exo.payload.text}`).toHaveLength(1);
      }
      if (exo.payload.items) {
        const items = itemsOf(exo);
        expect(new Set(items.map((item) => item.text)).size, `${kind} : ${exo.prompt}`).toBe(items.length);
        for (const zone of zonesOf(exo)) expect(items.some((item) => item.correctZone === zone), `${kind} : ${zone}`).toBe(true);
      }
      if (exo.payload.correctSequence) {
        const sequence = sequenceOf(exo);
        expect(new Set(sequence).size, `${kind} : ${exo.prompt}`).toBe(sequence.length);
        expect(sequence.length, kind).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it("n'écrivent dans aucun indice un mot de la bonne réponse ni d'une étiquette à placer", () => {
    for (const { kind, exo } of exos) {
      const answers: string[] = [];
      if (exo.payload.options) answers.push(rightOption(exo));
      if (exo.payload.blanks) answers.push(blankOf(exo).answer);
      if (exo.payload.correctSequence) answers.push(...sequenceOf(exo));
      if (exo.payload.pairs) answers.push(...pairsOf(exo).flatMap((pair) => [pair.left, pair.right]));
      if (exo.payload.items) answers.push(...itemsOf(exo).map((item) => item.text));
      const words = new Set(
        answers.flatMap((answer) =>
          fold(answer.replace(/\p{Extended_Pictographic}/gu, " "))
            .split(/[^a-z]+/)
            .filter((word) => word.length >= 4 && !["chaque", "dans", "sont", "avec"].includes(word)),
        ),
      );
      for (const hint of exo.hints) {
        const hintWords = fold(hint).split(/[^a-z]+/);
        for (const word of words) expect(hintWords, `${kind} : « ${hint} » écrit « ${word} »`).not.toContain(word);
      }
    }
  });

  it("donnent trois indices différents, et se refont à l'identique avec la même graine", () => {
    for (const kind of NEW_KINDS) {
      const a = GAME_KINDS[kind].make(makeContext("CI", 2, "graine"));
      const b = GAME_KINDS[kind].make(makeContext("CI", 2, "graine"));
      expect(a).toEqual(b);
      expect(a.hints).toHaveLength(3);
      expect(new Set(a.hints).size, kind).toBe(3);
    }
  });

  it("passent le contrôleur du français sans aucun défaut, à tous les niveaux", () => {
    for (const { kind, exo } of exos) {
      const defects = auditExercise({
        type: GAME_KINDS[kind].type,
        prompt: exo.prompt,
        payload: exo.payload,
        answerKey: exo.answerKey,
        hints: exo.hints,
        class: "CI",
        subject: "Français",
      });
      expect(defects, `${kind} : ${exo.prompt}`).toEqual([]);
    }
  });
});

describe("les deux thématiques de français du CI", () => {
  const KEYS = ["fr-ci-phrases", "fr-ci-politesse"];
  const topicOf = (key: string) => allProgrammeEntries().find((e) => e.topic.key === key)!.topic;

  it("remplissent les dix places du palier, avec des jeux connus, sans appeler le modèle", () => {
    for (const key of KEYS) {
      const specs = topicOf(key).games ?? [];
      expect(
        specs.reduce((sum, spec) => sum + spec.count, 0),
        key,
      ).toBe(PALIER_SIZE);
      for (const spec of specs) expect(Object.keys(GAME_KINDS), `${key} : ${spec.kind}`).toContain(spec.kind);
      expect(topicUsesModel(key), key).toBe(false);
    }
    // Les phrases à trou sont tirées de la table relue à la main, avec tout le vocabulaire du CI.
    expect(topicOf("fr-ci-phrases").games).toContainEqual({ kind: "phrase-trou", count: 2, vocabulary: "mots-4" });
  });

  it("fabriquent des paliers entiers, de dix exercices tous différents, qui passent le contrôleur", () => {
    for (const key of KEYS) {
      for (let n = 0; n < 40; n++) {
        for (const palierIndex of [1, 2, 3]) {
          const games = generateGames(topicOf(key).games ?? [], { klass: "CI", palierIndex, palierCount: 3, seed: `${key}:${n}:${palierIndex}` });
          expect(games, `${key} palier ${palierIndex}`).toHaveLength(PALIER_SIZE);
          const questions = games.map((game) => `${game.prompt}|${game.answerKey}`);
          expect(new Set(questions).size, `${key} #${n} palier ${palierIndex}`).toBe(questions.length);
          for (const game of games) {
            const defects = auditExercise({
              type: game.type,
              prompt: game.prompt,
              payload: game.payload,
              answerKey: game.answerKey,
              hints: game.hints,
              class: "CI",
              subject: "Français",
            });
            expect(defects, `${key} palier ${palierIndex} : ${game.prompt}`).toEqual([]);
          }
        }
      }
    }
  });

  it("varient les types d'un palier : au moins trois sortes d'exercices sur dix", () => {
    for (const key of KEYS) {
      for (const palierIndex of [1, 2, 3]) {
        const games = generateGames(topicOf(key).games ?? [], { klass: "CI", palierIndex, palierCount: 3, seed: key });
        expect(new Set(games.map((game) => game.type)).size, `${key} palier ${palierIndex}`).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it("ne répètent pas une phrase dans un palier de « Mes premières phrases »", () => {
    for (let n = 0; n < 40; n++) {
      for (const palierIndex of [1, 2, 3]) {
        const games = generateGames(topicOf("fr-ci-phrases").games ?? [], { klass: "CI", palierIndex, palierCount: 3, seed: `phrases:${n}:${palierIndex}` });
        const sentences = games.flatMap((game) => {
          const kind = (game.payload.game as { kind: string }).kind;
          if (kind === "phrase-ordre" || kind === "phrase-ecrite") return [game.answerKey];
          if (kind === "phrase-mots-compter" || kind === "phrase-mot-place") return [/« (.+) »/.exec(game.prompt)?.[1] as string];
          return [];
        });
        expect(new Set(sentences).size, `#${n} palier ${palierIndex} : ${sentences.join(" | ")}`).toBe(sentences.length);
      }
    }
  });
});
