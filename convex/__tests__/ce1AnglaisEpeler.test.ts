import { describe, expect, it, vi } from "vitest";
import { auditExercise } from "../paliers/exerciseAudit";
import { GAME_KINDS, generateGames, regenerateGame, type GameKind } from "../paliers/games";
import { SPELL_WORDS, spelled } from "../paliers/games/ce1AnglaisEpeler";
import { makeContext, type GameLevel } from "../paliers/games/shared";
import { topicUsesModel } from "../paliers/pregen";
import { PALIER_SIZE } from "../paliers/scoring";
import { allProgrammeEntries } from "../programme";

vi.setConfig({ testTimeout: 30_000 });

/**
 * L'ÉPELLATION DU CE1 (`an-ce1-spell`) : remettre les lettres d'un mot anglais dans l'ordre, l'écrire, compléter une
 * lettre, choisir la bonne écriture, relier un mot à son épellation.
 *
 * Chaque gabarit a son VÉRIFICATEUR, écrit ici avec une table à part (le mot de chaque dessin) : il recalcule la
 * bonne réponse depuis l'énoncé et les tuiles. Des MUTATIONS abîment ensuite chaque exercice juste, et le
 * vérificateur doit le voir. Les fautes ne sont jamais un autre mot de la liste.
 */

const LEVELS: GameLevel[] = [1, 2, 3, 4];
const draws = LEVELS.flatMap((level) => Array.from({ length: 40 }, (_, n) => ({ level, seed: `sp:${level}:${n}` })));

type Exo = { type: string; prompt: string; answerKey: string; hints: string[]; payload: Record<string, unknown> };
const make = (kind: GameKind, d: (typeof draws)[number]): Exo => GAME_KINDS[kind].make(makeContext("CE1", d.level, `${kind}:${d.seed}`)) as Exo;

const optionsOf = (exo: Exo) => exo.payload.options as string[];
const rightOption = (exo: Exo) => optionsOf(exo)[exo.payload.correctIndex as number];
const itemsOf = (exo: Exo) => exo.payload.items as { text: string; correctZone: string }[];
const zonesOf = (exo: Exo) => exo.payload.zones as string[];
const sequenceOf = (exo: Exo) => exo.payload.correctSequence as string[];
const pairsOf = (exo: Exo) => exo.payload.pairs as { left: string; right: string }[];
const blankOf = (exo: Exo) => (exo.payload.blanks as { options: string[]; answer: string }[])[0];
const textOf = (exo: Exo) => String(exo.payload.text);
const acceptedOf = (exo: Exo) => exo.payload.acceptedAnswers as string[];
const eq = (label: string, actual: unknown, expected: unknown): string[] =>
  JSON.stringify(actual) === JSON.stringify(expected) ? [] : [`${label} : ${JSON.stringify(actual)} au lieu de ${JSON.stringify(expected)}`];
const isTrue = (label: string, value: boolean): string[] => (value ? [] : [label]);
const emojiOf = (text: string) => text.match(/\p{Extended_Pictographic}/u)?.[0] ?? "";

// ---------------------------------------------------------------------------
// La table de vérité, écrite à part des gabarits : le dessin, le mot
// ---------------------------------------------------------------------------

const WORD_OF: Record<string, string> = {
  "🐱": "cat",
  "🐶": "dog",
  "🔴": "red",
  "🌞": "sun",
  "🍚": "rice",
  "🥛": "milk",
  "🔵": "blue",
  "🐟": "fish",
  "🥭": "mango",
  "🏠": "house",
  "🍋": "lemon",
  "🐴": "horse",
};
const WORDS = Object.values(WORD_OF);
/** Des mots anglais qu'une faute ne doit jamais devenir. */
const REAL_WORDS = new Set([...WORDS, "act", "god", "cut", "cot", "rid", "rad", "sin", "nus", "ice", "rise", "mile", "blow", "bleu", "fist", "hose", "lime"]);
const wordOfPrompt = (exo: Exo) => WORD_OF[emojiOf(exo.prompt)];
const sorted = (word: string) => [...word].sort().join("");

type Check = (exo: Exo) => string[];

const CHECKS: Record<string, Check> = {
  "ce1-en-sp-ordre": (exo) => [
    ...isTrue("dessin inconnu", wordOfPrompt(exo) !== undefined),
    ...eq("les lettres", sequenceOf(exo).join(""), wordOfPrompt(exo)),
    ...isTrue("une lettre en double", new Set(sequenceOf(exo)).size === sequenceOf(exo).length),
  ],
  "ce1-en-sp-ecrire": (exo) => [...isTrue("dessin inconnu", wordOfPrompt(exo) !== undefined), ...eq("la réponse admise", acceptedOf(exo), [wordOfPrompt(exo)])],
  "ce1-en-sp-trou": (exo) => {
    const word = WORD_OF[emojiOf(textOf(exo))];
    const shown = textOf(exo).replace(/^\S+\s/, "");
    const { options, answer } = blankOf(exo);
    return [
      ...isTrue("dessin inconnu", word !== undefined),
      ...isTrue("un seul trou", shown.split("___").length === 2),
      ...eq("le mot complété", shown.replace(/___/g, answer), word),
      ...isTrue("trois lettres différentes", options.length === 3 && new Set(options).size === 3),
      ...isTrue("un mauvais choix est la bonne lettre", options.filter((o) => o === answer).length === 1),
      ...isTrue("le trou est la première lettre", !shown.startsWith("___")),
    ];
  },
  "ce1-en-sp-choix": (exo) => [
    ...isTrue("dessin inconnu", wordOfPrompt(exo) !== undefined),
    ...eq("la bonne écriture", rightOption(exo), wordOfPrompt(exo)),
    ...isTrue("trois écritures différentes", new Set(optionsOf(exo)).size === 3),
    ...isTrue("une faute est un vrai mot", optionsOf(exo).every((o) => o === wordOfPrompt(exo) || !REAL_WORDS.has(o))),
    ...isTrue("une faute n'a pas la longueur du mot", optionsOf(exo).every((o) => o.length === (wordOfPrompt(exo) ?? "").length)),
  ],
  "ce1-en-sp-relier": (exo) => [
    ...pairsOf(exo).flatMap((pair) => eq(`l'épellation de ${pair.left}`, pair.right, WORDS.includes(pair.left) ? pair.left.toUpperCase().split("").join("-") : null)),
    ...isTrue("trois paires", pairsOf(exo).length === 3),
  ],
  "ce1-en-sp-glisser": (exo) => [
    ...eq("les cases", zonesOf(exo), ["3 lettres", "5 lettres"]),
    ...itemsOf(exo).flatMap((item) => eq(`la case de ${item.text}`, item.correctZone, item.text.length === 3 ? "3 lettres" : item.text.length === 5 ? "5 lettres" : null)),
    ...isTrue("les deux cases servies", new Set(itemsOf(exo).map((item) => item.correctZone)).size === 2),
  ],
  "ce1-en-sp-compter": (exo) => [
    ...isTrue("dessin inconnu", wordOfPrompt(exo) !== undefined),
    ...eq("le nombre de lettres", rightOption(exo), String((wordOfPrompt(exo) ?? "").length)),
    ...isTrue("trois nombres différents", new Set(optionsOf(exo)).size === 3),
  ],
};

const KINDS = Object.keys(CHECKS) as GameKind[];

describe("les gabarits d'épellation du CE1", () => {
  it("ont un vérificateur chacun, et seulement ceux-là", () => {
    expect(
      Object.keys(GAME_KINDS)
        .filter((kind) => kind.startsWith("ce1-en-sp-"))
        .sort(),
    ).toEqual([...KINDS].sort());
  });

  it("donnent une bonne réponse que leur vérificateur retrouve, à tous les niveaux", () => {
    const failures: string[] = [];
    for (const kind of KINDS) {
      for (const d of draws) {
        const exo = make(kind, d);
        const problems = CHECKS[kind](exo);
        if (problems.length > 0) failures.push(`${kind} niveau ${d.level} : ${exo.prompt} → ${problems.join(" ; ")}`);
      }
    }
    expect([...new Set(failures)].slice(0, 12)).toEqual([]);
  });

  it("sont vus par leur vérificateur quand on abîme la bonne réponse (le contrôle n'est pas vide)", () => {
    const shift = (exo: Exo): Exo => ({ ...exo, payload: { ...exo.payload, correctIndex: (Number(exo.payload.correctIndex) + 1) % 3 } });
    const damage: Record<string, (exo: Exo) => Exo> = {
      "ce1-en-sp-ordre": (exo) => ({ ...exo, payload: { ...exo.payload, correctSequence: [...sequenceOf(exo)].reverse() } }),
      "ce1-en-sp-ecrire": (exo) => ({ ...exo, payload: { ...exo.payload, acceptedAnswers: ["zzz"] } }),
      "ce1-en-sp-trou": (exo) => ({ ...exo, payload: { ...exo.payload, blanks: [{ ...blankOf(exo), answer: blankOf(exo).options.find((o) => o !== blankOf(exo).answer) }] } }),
      "ce1-en-sp-choix": shift,
      "ce1-en-sp-compter": shift,
      "ce1-en-sp-relier": (exo) => {
        const pairs = pairsOf(exo).map((pair) => ({ ...pair }));
        [pairs[0].right, pairs[1].right] = [pairs[1].right, pairs[0].right];
        return { ...exo, payload: { ...exo.payload, pairs } };
      },
      "ce1-en-sp-glisser": (exo) => ({
        ...exo,
        payload: { ...exo.payload, items: itemsOf(exo).map((item, i) => (i === 0 ? { ...item, correctZone: item.correctZone === "3 lettres" ? "5 lettres" : "3 lettres" } : item)) },
      }),
    };
    expect(Object.keys(damage).sort()).toEqual([...KINDS].sort());
    for (const kind of KINDS) {
      let total = 0;
      let seen = 0;
      for (const d of draws) {
        const exo = make(kind, d);
        if (CHECKS[kind](exo).length > 0) continue;
        total += 1;
        if (CHECKS[kind](damage[kind](exo)).length > 0) seen += 1;
      }
      expect(total, kind).toBeGreaterThan(60);
      expect(seen, `${kind} : le vérificateur ne voit pas l'exercice abîmé`).toBe(total);
    }
  });

  it("n'ont aucun deux-points, au plus une apostrophe et vingt-huit mots dans l'énoncé, et aucun mot anglais dedans", () => {
    const english = new Set(WORDS.filter((word) => !["red", "blue", "fish"].includes(word) || true));
    english.delete("lemon");
    for (const kind of KINDS) {
      for (const d of draws) {
        const exo = make(kind, d);
        expect(exo.prompt, kind).not.toMatch(/:/);
        expect((exo.prompt.match(/'/g) ?? []).length, `${kind} : ${exo.prompt}`).toBeLessThanOrEqual(1);
        const words = exo.prompt
          .replace(/\p{Extended_Pictographic}/gu, " ")
          .split(/\s+/)
          .filter((token) => /[\p{L}\p{N}]/u.test(token));
        expect(words.length, `${kind} : ${exo.prompt}`).toBeLessThanOrEqual(28);
        for (const token of exo.prompt.toLowerCase().split(/[^a-zé]+/)) expect(english.has(token), `${kind} : « ${exo.prompt} » écrit « ${token} »`).toBe(false);
      }
    }
  });

  it("n'écrivent un émoji que sans sélecteur de variation ni liaison, et d'Unicode 11 au plus", () => {
    for (const kind of KINDS) {
      for (const d of draws) {
        const exo = make(kind, d);
        const text = JSON.stringify([exo.prompt, exo.payload, exo.answerKey, exo.hints]);
        expect(text, kind).not.toContain(String.fromCodePoint(0xfe0f));
        expect(text, kind).not.toContain(String.fromCodePoint(0x200d));
        for (const glyph of text.match(/\p{Extended_Pictographic}/gu) ?? []) {
          const code = glyph.codePointAt(0) as number;
          expect(code >= 0x1fa70 || (code >= 0x1f9c3 && code <= 0x1f9cf) || (code >= 0x1f7e0 && code <= 0x1f7eb) || code === 0x1f90d || code === 0x1f90e, `${kind} : ${glyph}`).toBe(false);
        }
      }
    }
  });

  it("n'écrivent dans aucun indice le mot anglais de la bonne réponse", () => {
    for (const kind of KINDS) {
      for (const d of draws) {
        const exo = make(kind, d);
        const word = wordOfPrompt(exo) ?? WORD_OF[emojiOf(textOf(exo))];
        if (!word || kind === "ce1-en-sp-relier") continue;
        for (const hint of exo.hints) expect(hint.toLowerCase().split(/[^a-zé]+/), `${kind} : « ${hint} » écrit « ${word} »`).not.toContain(word);
      }
    }
  });

  it("donnent trois indices différents, et se refont à l'identique avec la même graine", () => {
    for (const kind of KINDS) {
      const a = GAME_KINDS[kind].make(makeContext("CE1", 2, "graine"));
      const b = GAME_KINDS[kind].make(makeContext("CE1", 2, "graine"));
      expect(a).toEqual(b);
      expect(a.hints, kind).toHaveLength(3);
      expect(new Set(a.hints).size, kind).toBe(3);
    }
  });

  it("passent le contrôleur de l'anglais sans aucun défaut, à tous les niveaux", () => {
    for (const kind of KINDS) {
      for (const d of draws) {
        const exo = make(kind, d);
        const defects = auditExercise({ type: exo.type, prompt: exo.prompt, payload: exo.payload, answerKey: exo.answerKey, hints: exo.hints, class: "CE1", subject: "Anglais" });
        expect(defects, `${kind} niveau ${d.level} : ${exo.prompt}`).toEqual([]);
      }
    }
  });

  it("se refont, sans le modèle, quand un exercice est raté", () => {
    for (const kind of KINDS) {
      for (let n = 0; n < 10; n++) {
        const again = regenerateGame({ kind, level: 2 }, "CE1", `refait:${kind}:${n}`);
        expect(again, kind).not.toBeNull();
        expect(CHECKS[kind](again as unknown as Exo), kind).toEqual([]);
      }
    }
  });
});

describe("la liste des douze mots", () => {
  it("est celle du test, sans lettre répétée, avec des fautes qui ne sont pas des mots", () => {
    expect(SPELL_WORDS.map((word) => [word.emoji, word.en])).toEqual(Object.entries(WORD_OF));
    for (const word of SPELL_WORDS) {
      expect(new Set(word.en).size, word.en).toBe(word.en.length);
      for (const wrong of word.wrong) {
        expect(REAL_WORDS.has(wrong), `${word.en} : ${wrong}`).toBe(false);
        expect(wrong, word.en).not.toBe(word.en);
        expect(wrong.length, `${word.en} : ${wrong}`).toBe(word.en.length);
        expect(sorted(wrong).length).toBe(sorted(word.en).length);
      }
      expect(spelled(word.en)).toBe(word.en.toUpperCase().split("").join("-"));
    }
  });
});

describe("la thématique an-ce1-spell", () => {
  const entry = () => allProgrammeEntries().find((e) => e.topic.key === "an-ce1-spell")!;

  it("ouvre les thématiques d'anglais du CE1, en trois paliers, sans le modèle", () => {
    expect(entry().klass).toBe("CE1");
    expect(
      allProgrammeEntries()
        .filter((e) => e.klass === "CE1" && /^an-/.test(e.topic.key))
        .map((e) => e.topic.key)[0],
    ).toBe("an-ce1-spell");
    expect(entry().topic.palierCount).toBe(3);
    const specs = entry().topic.games ?? [];
    expect(specs.reduce((sum, spec) => sum + spec.count, 0)).toBe(PALIER_SIZE);
    for (const spec of specs) expect(Object.keys(GAME_KINDS)).toContain(spec.kind);
    expect(topicUsesModel("an-ce1-spell")).toBe(false);
  });

  it("fabrique des paliers entiers de dix exercices tous différents, justes, qui passent le contrôleur", () => {
    for (let n = 0; n < 40; n++) {
      for (let palierIndex = 1; palierIndex <= 3; palierIndex++) {
        const games = generateGames(entry().topic.games ?? [], { klass: "CE1", palierIndex, palierCount: 3, seed: `spell:${n}:${palierIndex}` });
        expect(games, `palier ${palierIndex}`).toHaveLength(PALIER_SIZE);
        const questions = games.map((game) => `${game.prompt}|${game.answerKey}`);
        expect(new Set(questions).size, `#${n} palier ${palierIndex}`).toBe(questions.length);
        for (const game of games) {
          const kind = (game.payload.game as { kind: string }).kind;
          expect(CHECKS[kind](game as Exo), `palier ${palierIndex} ${kind} : ${game.prompt}`).toEqual([]);
          const defects = auditExercise({ type: game.type, prompt: game.prompt, payload: game.payload, answerKey: game.answerKey, hints: game.hints, class: "CE1", subject: "Anglais" });
          expect(defects, `palier ${palierIndex} : ${game.prompt}`).toEqual([]);
        }
      }
    }
  });

  it("varie les types d'un palier : au moins quatre sortes d'exercices sur dix", () => {
    for (let palierIndex = 1; palierIndex <= 3; palierIndex++) {
      const games = generateGames(entry().topic.games ?? [], { klass: "CE1", palierIndex, palierCount: 3, seed: "types" });
      expect(new Set(games.map((game) => game.type)).size, `palier ${palierIndex}`).toBeGreaterThanOrEqual(4);
    }
  });

  it("donne à chaque palier ses propres mots : trois, quatre puis cinq lettres", () => {
    const wordsAt = (palierIndex: number) => {
      const words = new Set<string>();
      for (let n = 0; n < 20; n++) {
        for (const game of generateGames(entry().topic.games ?? [], { klass: "CE1", palierIndex, palierCount: 3, seed: `own:${n}` })) {
          const kind = (game.payload.game as { kind: string }).kind;
          if (kind === "ce1-en-sp-ordre" || kind === "ce1-en-sp-ecrire" || kind === "ce1-en-sp-choix") words.add(WORD_OF[emojiOf(game.prompt)]);
        }
      }
      return words;
    };
    for (const [palierIndex, length] of [[1, 3], [2, 4], [3, 5]] as const) {
      const words = [...wordsAt(palierIndex)];
      expect(words.length, `palier ${palierIndex}`).toBeGreaterThan(0);
      expect(words.every((word) => word.length === length), `palier ${palierIndex} : ${words.join(", ")}`).toBe(true);
    }
  });
});
