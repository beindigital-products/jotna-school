import { describe, expect, it, vi } from "vitest";
import { auditExercise } from "../paliers/exerciseAudit";
import { GAME_KINDS, generateGames, regenerateGame, type GameKind } from "../paliers/games";
import { KEY_WORDS, SHORT_WORDS, SPELLED_NAMES } from "../paliers/games/anglaisAlphabet";
import { makeContext, type GameLevel } from "../paliers/games/shared";
import { topicUsesModel } from "../paliers/pregen";
import { PALIER_SIZE } from "../paliers/scoring";
import { allProgrammeEntries } from "../programme";
import { LETTER_NAMES, englishLetters, promptForbidsTileVoice, speakableTile, tileClipVerdict, tileLanguage } from "../voice/tiles";

vi.setConfig({ testTimeout: 30_000 });

/**
 * L'ALPHABET ANGLAIS DU CI ET DU CP : les trois thématiques du CI (A à I, J à R, S à Z) et les trois du CP
 * (l'alphabet, les premiers sons, je me présente).
 *
 * Le programme commençait par « hello » : l'enfant n'avait jamais entendu le nom d'une lettre. Ces tests tiennent
 * la nouvelle leçon. Chaque gabarit a son VÉRIFICATEUR, écrit ici avec ses propres tables (la lettre de chaque
 * mot, son dessin, les voyelles) : il recalcule la bonne réponse depuis l'énoncé et les tuiles. Des MUTATIONS
 * abîment ensuite chaque exercice juste, et le vérificateur doit le voir. La voix est testée avec : une lettre
 * seule se dit « bee » en anglais, et reste muette hors de l'alphabet.
 */

const LEVELS: GameLevel[] = [1, 2, 3, 4];
const RANGES = ["a-i", "j-r", "s-z", "a-z"] as const;
const draws = LEVELS.flatMap((level) => Array.from({ length: 40 }, (_, n) => ({ level, seed: `abc:${level}:${n}` })));

type Exo = { type: string; prompt: string; answerKey: string; hints: string[]; payload: Record<string, unknown> };
const make = (kind: GameKind, klass: "CI" | "CP", d: (typeof draws)[number], vocabulary?: string): Exo =>
  GAME_KINDS[kind].make(makeContext(klass, d.level, `${kind}:${d.seed}`, new Set(), vocabulary)) as Exo;

const optionsOf = (exo: Exo) => exo.payload.options as string[];
const rightOption = (exo: Exo) => optionsOf(exo)[exo.payload.correctIndex as number];
const itemsOf = (exo: Exo) => exo.payload.items as { text: string; correctZone: string }[];
const zonesOf = (exo: Exo) => exo.payload.zones as string[];
const sequenceOf = (exo: Exo) => exo.payload.correctSequence as string[];
const pairsOf = (exo: Exo) => exo.payload.pairs as { left: string; right: string }[];
const blankOf = (exo: Exo) => (exo.payload.blanks as { options: string[]; answer: string }[])[0];
const textOf = (exo: Exo) => String(exo.payload.text);
const eq = (label: string, actual: unknown, expected: unknown): string[] =>
  JSON.stringify(actual) === JSON.stringify(expected) ? [] : [`${label} : ${JSON.stringify(actual)} au lieu de ${JSON.stringify(expected)}`];
const isTrue = (label: string, value: boolean): string[] => (value ? [] : [label]);
const ABC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const letterIndex = (letter: string) => ABC.indexOf(letter);
const emojiOf = (text: string) => text.match(/\p{Extended_Pictographic}/u)?.[0] ?? "";
const stripEmoji = (text: string) => text.replace(/\p{Extended_Pictographic}/gu, "").replace(/\s+/g, " ").trim();

// ---------------------------------------------------------------------------
// Les tables de vérité, écrites à part des gabarits : la lettre, le mot, son dessin
// ---------------------------------------------------------------------------

const WORD: Record<string, [string, string]> = {
  A: ["apple", "🍎"],
  B: ["banana", "🍌"],
  C: ["cat", "🐱"],
  D: ["dog", "🐶"],
  E: ["egg", "🥚"],
  F: ["fish", "🐟"],
  G: ["goat", "🐐"],
  H: ["house", "🏠"],
  I: ["ice cream", "🍦"],
  J: ["jeans", "👖"],
  K: ["key", "🔑"],
  L: ["lion", "🦁"],
  M: ["mango", "🥭"],
  N: ["nose", "👃"],
  O: ["orange", "🍊"],
  P: ["pig", "🐷"],
  Q: ["queen", "👸"],
  R: ["rice", "🍚"],
  S: ["sun", "🌞"],
  T: ["tree", "🌳"],
  U: ["umbrella", "🌂"],
  V: ["van", "🚐"],
  W: ["water", "💧"],
  Y: ["yam", "🍠"],
  Z: ["zebra", "🦓"],
};
const LETTER_OF_WORD = new Map(Object.entries(WORD).map(([letter, [word]]) => [word, letter] as const));
const WORD_OF_EMOJI = new Map(Object.entries(WORD).map(([, [word, emoji]]) => [emoji, word] as const));
const SHORT: Record<string, string> = { cat: "🐱", dog: "🐶", sun: "🌞", pig: "🐷", key: "🔑", box: "📦" };
const tile = (letter: string) => `${WORD[letter][1]} ${WORD[letter][0]}`;
const rangeOf = (vocabulary: string | undefined): string[] => {
  const match = /^([a-z])-([a-z])$/.exec(vocabulary ?? "");
  const all = [...ABC];
  return match ? all.slice(letterIndex(match[1].toUpperCase()), letterIndex(match[2].toUpperCase()) + 1) : all;
};
const VOWELS = ["A", "E", "I", "O", "U"];
const NAMES = ["Idy", "Sow", "Omar", "Diop", "Gaye", "Binta", "Khady", "Demba", "Salif", "Fatou", "Aliou", "Mbaye", "Thiam", "Seydou", "Lamine", "Ndiaye"];

type Check = (exo: Exo, vocabulary?: string) => string[];

const CHECKS: Record<string, Check> = {
  "abc-mot-dessin": (exo, vocabulary) => {
    const word = WORD_OF_EMOJI.get(emojiOf(exo.prompt));
    return [
      ...isTrue("le dessin de l'énoncé n'est pas un mot-image", word !== undefined),
      ...eq("la bonne réponse", rightOption(exo), word),
      ...isTrue("des mots hors de la plage", optionsOf(exo).every((o) => rangeOf(vocabulary).includes(LETTER_OF_WORD.get(o) ?? "?"))),
      ...isTrue("trois choix différents", new Set(optionsOf(exo)).size === 3),
    ];
  },
  "abc-relier-mot": (exo, vocabulary) => {
    const pairs = pairsOf(exo);
    return [
      ...pairs.flatMap((pair) => eq(`la paire ${pair.left}`, pair.right, WORD[pair.left] ? tile(pair.left) : null)),
      ...isTrue("des lettres hors de la plage", pairs.every((pair) => rangeOf(vocabulary).includes(pair.left))),
      ...isTrue("deux lettres pareilles", new Set(pairs.map((pair) => pair.left)).size === pairs.length),
      ...isTrue("au moins trois paires", pairs.length >= 3),
    ];
  },
  "abc-pour": (exo, vocabulary) => {
    const match = /^([A-Z]) is for ___\.$/.exec(textOf(exo));
    if (!match) return [`la phrase « ${textOf(exo)} » n'est pas « X is for ___. »`];
    const letter = match[1];
    const { options, answer } = blankOf(exo);
    const starting = options.filter((option) => LETTER_OF_WORD.get(stripEmoji(option)) === letter);
    return [
      ...eq("la bonne réponse", answer, WORD[letter] ? tile(letter) : null),
      ...eq("un seul choix commence par la lettre", starting, [answer]),
      ...isTrue("trois choix", options.length === 3 && new Set(options).size === 3),
      ...isTrue("la lettre est hors de la plage", rangeOf(vocabulary).includes(letter)),
    ];
  },
  "abc-ordre": (exo, vocabulary) => {
    const sequence = sequenceOf(exo);
    const consecutive = sequence.every((letter, i) => i === 0 || letterIndex(letter) === letterIndex(sequence[i - 1]) + 1);
    return [
      ...isTrue(`${sequence.join("")} ne se suit pas`, consecutive),
      ...isTrue("des lettres hors de la plage", sequence.every((letter) => rangeOf(vocabulary).includes(letter))),
      ...isTrue("entre trois et cinq lettres", sequence.length >= 3 && sequence.length <= 5),
    ];
  },
  "abc-manquante": (exo, vocabulary) => {
    const parts = textOf(exo).split(", ");
    const gapAt = parts.indexOf("___");
    if (gapAt < 0 || parts.filter((part) => part === "___").length !== 1) return ["un seul trou attendu"];
    const known = parts.filter((part) => part !== "___");
    const before = gapAt > 0 ? letterIndex(parts[gapAt - 1]) : letterIndex(parts[gapAt + 1]) - 2;
    const expected = ABC[before + 1];
    const { options, answer } = blankOf(exo);
    return [
      ...eq("la lettre qui manque", answer, expected),
      ...isTrue("la suite se suit", known.every((letter, i) => i === 0 || letterIndex(letter) > letterIndex(known[i - 1]))),
      ...isTrue("un mauvais choix est dans la suite", options.filter((option) => known.includes(option)).length === 0),
      ...isTrue("trois choix", options.length === 3 && new Set(options).size === 3),
      ...isTrue("le trou est hors de la plage", rangeOf(vocabulary).includes(answer)),
    ];
  },
  "abc-majuscule": (exo, vocabulary) => {
    const pairs = pairsOf(exo);
    const lefts = pairs.map((pair) => pair.left);
    return [
      ...pairs.flatMap((pair) => eq(`la petite lettre de ${pair.left}`, pair.right, pair.left.toLowerCase())),
      ...isTrue("I et L ensemble", !(lefts.includes("I") && lefts.includes("L"))),
      ...isTrue("des lettres hors de la plage", lefts.every((letter) => rangeOf(vocabulary).includes(letter))),
      ...isTrue("au moins trois paires", pairs.length >= 3),
    ];
  },
  "abc-premiere": (exo, vocabulary) => {
    const word = WORD_OF_EMOJI.get(emojiOf(exo.prompt));
    const letter = word ? LETTER_OF_WORD.get(word) : undefined;
    return [
      ...isTrue("le dessin n'est pas un mot-image", letter !== undefined),
      ...eq("la bonne réponse", rightOption(exo), letter),
      ...isTrue("trois lettres différentes", new Set(optionsOf(exo)).size === 3),
      ...isTrue("une lettre hors de la plage", optionsOf(exo).every((option) => rangeOf(vocabulary).includes(option))),
    ];
  },
  "abc-voyelle": (exo) => [
    ...eq("les cases", zonesOf(exo), ["Voyelles", "Consonnes"]),
    ...itemsOf(exo).flatMap((item) => eq(`la case de ${item.text}`, item.correctZone, VOWELS.includes(item.text) ? "Voyelles" : "Consonnes")),
    ...isTrue("le Y sert à un tri", !itemsOf(exo).some((item) => item.text === "Y")),
    ...isTrue("les deux cases servies", new Set(itemsOf(exo).map((item) => item.correctZone)).size === 2),
    ...isTrue("des lettres en double", new Set(itemsOf(exo).map((item) => item.text)).size === itemsOf(exo).length),
  ],
  "abc-mots-courts": (exo) => [
    ...pairsOf(exo).flatMap((pair) => eq(`le dessin de ${pair.right}`, SHORT[pair.right], pair.left)),
    ...isTrue("au moins trois paires", pairsOf(exo).length >= 3),
  ],
  "abc-mots-ordre": (exo) => {
    const sequence = sequenceOf(exo);
    const letters = sequence.map((word) => LETTER_OF_WORD.get(word));
    return [
      ...isTrue("un mot hors liste", letters.every((letter) => letter !== undefined)),
      ...isTrue("les mots ne sont pas rangés", letters.every((letter, i) => i === 0 || letterIndex(letter as string) > letterIndex(letters[i - 1] as string))),
      ...isTrue("trois ou quatre mots", sequence.length >= 3 && sequence.length <= 4),
    ];
  },
  "abc-epeler": (exo) => {
    const name = /« ([^»]+) »/.exec(exo.prompt)?.[1] ?? "";
    return [
      ...isTrue(`« ${name} » n'est pas un prénom de la liste`, NAMES.includes(name)),
      ...eq("les lettres", sequenceOf(exo), name.toUpperCase().split("")),
      ...isTrue("une lettre en double", new Set(sequenceOf(exo)).size === sequenceOf(exo).length),
    ];
  },
  "abc-epeler-choix": (exo) => {
    const name = /« ([^»]+) »/.exec(exo.prompt)?.[1] ?? "";
    const right = name.toUpperCase().split("").join("-");
    const wrong = optionsOf(exo).filter((option) => option !== right);
    return [
      ...isTrue(`« ${name} » n'est pas un prénom de la liste`, NAMES.includes(name)),
      ...eq("la bonne épellation", rightOption(exo), right),
      ...isTrue("deux autres épellations", wrong.length === 2 && new Set(wrong).size === 2),
      ...wrong.flatMap((option) => isTrue(`${option} n'a pas les mêmes lettres`, option.split("-").sort().join("") === right.split("-").sort().join(""))),
    ];
  },
};

const KINDS = Object.keys(CHECKS) as GameKind[];
/** Les jeux sans plage de lettres : les mots courts et les prénoms. */
const PLAIN: GameKind[] = ["abc-mots-courts", "abc-epeler", "abc-epeler-choix"];
const vocabularyOf = (kind: GameKind) => (PLAIN.includes(kind) ? undefined : "a-z");

describe("les gabarits d'alphabet anglais", () => {
  it("ont un vérificateur chacun, et seulement ceux-là", () => {
    const abc = Object.keys(GAME_KINDS)
      .filter((kind) => kind.startsWith("abc-"))
      .sort();
    expect(abc).toEqual([...KINDS].sort());
  });

  it("donnent une bonne réponse que leur vérificateur retrouve, sur chaque plage et à tous les niveaux", () => {
    const failures: string[] = [];
    for (const kind of KINDS) {
      const vocabularies = PLAIN.includes(kind) ? [undefined] : [...RANGES];
      for (const vocabulary of vocabularies) {
        for (const d of draws) {
          for (const klass of ["CI", "CP"] as const) {
            const exo = make(kind, klass, d, vocabulary);
            const problems = CHECKS[kind](exo, vocabulary);
            if (problems.length > 0) failures.push(`${kind} ${vocabulary ?? ""} niveau ${d.level} : ${exo.prompt} → ${problems.join(" ; ")}`);
          }
        }
      }
    }
    expect([...new Set(failures)].slice(0, 12)).toEqual([]);
  });

  it("sont vus par leur vérificateur quand on abîme la bonne réponse (le contrôle n'est pas vide)", () => {
    const shift = (exo: Exo): Exo => ({ ...exo, payload: { ...exo.payload, correctIndex: (Number(exo.payload.correctIndex) + 1) % 3 } });
    const swapPairs = (exo: Exo): Exo => {
      const pairs = pairsOf(exo).map((pair) => ({ ...pair }));
      [pairs[0].right, pairs[1].right] = [pairs[1].right, pairs[0].right];
      return { ...exo, payload: { ...exo.payload, pairs } };
    };
    const wrongBlank = (exo: Exo): Exo => ({
      ...exo,
      payload: { ...exo.payload, blanks: [{ ...blankOf(exo), answer: blankOf(exo).options.find((option) => option !== blankOf(exo).answer) }] },
    });
    const reverse = (exo: Exo): Exo => ({ ...exo, payload: { ...exo.payload, correctSequence: [...sequenceOf(exo)].reverse() } });
    const damage: Record<string, (exo: Exo) => Exo> = {
      "abc-mot-dessin": shift,
      "abc-premiere": shift,
      "abc-epeler-choix": shift,
      "abc-relier-mot": swapPairs,
      "abc-majuscule": swapPairs,
      "abc-mots-courts": swapPairs,
      "abc-pour": wrongBlank,
      "abc-manquante": wrongBlank,
      "abc-ordre": reverse,
      "abc-mots-ordre": reverse,
      "abc-epeler": reverse,
      "abc-voyelle": (exo) => ({
        ...exo,
        payload: { ...exo.payload, items: itemsOf(exo).map((item, i) => (i === 0 ? { ...item, correctZone: item.correctZone === "Voyelles" ? "Consonnes" : "Voyelles" } : item)) },
      }),
    };
    expect(Object.keys(damage).sort()).toEqual([...KINDS].sort());
    for (const kind of KINDS) {
      let seen = 0;
      let total = 0;
      for (const d of draws) {
        const vocabulary = vocabularyOf(kind);
        const exo = make(kind, "CP", d, vocabulary);
        if (CHECKS[kind](exo, vocabulary).length > 0) continue;
        total += 1;
        if (CHECKS[kind](damage[kind](exo), vocabulary).length > 0) seen += 1;
      }
      expect(total, kind).toBeGreaterThan(100);
      expect(seen, `${kind} : le vérificateur ne voit pas l'exercice abîmé`).toBe(total);
    }
  });

  it("n'ont aucune lettre ni aucun mot anglais dans l'énoncé, aucun deux-points, au plus une apostrophe et vingt mots", () => {
    const english = new Set<string>(["apple", "banana", "cat", "dog", "egg", "fish", "goat", "house", "jeans", "key", "mango", "nose", "pig", "queen", "rice", "sun", "tree", "van", "water", "yam", "zebra", "box"]);
    for (const kind of KINDS) {
      for (const d of draws.slice(0, 80)) {
        const exo = make(kind, "CI", d, vocabularyOf(kind));
        expect(exo.prompt, kind).not.toMatch(/:/);
        expect((exo.prompt.match(/'/g) ?? []).length, `${kind} : ${exo.prompt}`).toBeLessThanOrEqual(1);
        const words = exo.prompt
          .replace(/\p{Extended_Pictographic}/gu, " ")
          .split(/\s+/)
          .filter((token) => /[\p{L}\p{N}]/u.test(token));
        expect(words.length, `${kind} : ${exo.prompt}`).toBeLessThanOrEqual(20);
        // Le prénom épelé est entre guillemets français, c'est un nom propre : on le retire avant de chercher.
        const sentence = exo.prompt.replace(/« [^»]+ »/g, " ");
        expect(sentence, `${kind} : une lettre seule dans l'énoncé`).not.toMatch(/(?<![\p{L}'])[A-Z](?![\p{L}])/u);
        for (const token of sentence.toLowerCase().split(/[^a-zé]+/)) expect(english.has(token), `${kind} : « ${exo.prompt} » écrit « ${token} »`).toBe(false);
      }
    }
  });

  it("n'écrivent un émoji que sans sélecteur de variation ni liaison, et d'Unicode 11 au plus", () => {
    for (const kind of KINDS) {
      for (const d of draws.slice(0, 80)) {
        const exo = make(kind, "CI", d, vocabularyOf(kind));
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
      for (const d of draws.slice(0, 80)) {
        const exo = make(kind, "CP", d, vocabularyOf(kind));
        const answers = new Set<string>();
        if (exo.payload.blanks) answers.add(stripEmoji(blankOf(exo).answer));
        if (kind === "abc-mot-dessin") answers.add(rightOption(exo));
        for (const answer of answers) {
          if (answer.length < 3) continue;
          for (const hint of exo.hints) expect(hint.toLowerCase(), `${kind} : « ${hint} » écrit « ${answer} »`).not.toContain(answer.toLowerCase());
        }
      }
    }
  });

  it("donnent trois indices différents, et se refont à l'identique avec la même graine", () => {
    for (const kind of KINDS) {
      const a = GAME_KINDS[kind].make(makeContext("CP", 2, "graine", new Set(), "a-z"));
      const b = GAME_KINDS[kind].make(makeContext("CP", 2, "graine", new Set(), "a-z"));
      expect(a).toEqual(b);
      expect(a.hints, kind).toHaveLength(3);
      expect(new Set(a.hints).size, kind).toBe(3);
    }
  });

  it("passent le contrôleur de l'anglais sans aucun défaut, à tous les niveaux", () => {
    for (const kind of KINDS) {
      for (const klass of ["CI", "CP"] as const) {
        for (const d of draws.slice(0, 80)) {
          const exo = make(kind, klass, d, vocabularyOf(kind));
          const defects = auditExercise({ type: exo.type, prompt: exo.prompt, payload: exo.payload, answerKey: exo.answerKey, hints: exo.hints, class: klass, subject: "Anglais" });
          expect(defects, `${kind} ${klass} niveau ${d.level} : ${exo.prompt}`).toEqual([]);
        }
      }
    }
  });

  it("gardent la plage de la fiche quand on refait un exercice raté", () => {
    for (const range of ["a-i", "j-r", "s-z"]) {
      for (const kind of ["abc-relier-mot", "abc-pour", "abc-ordre", "abc-manquante", "abc-premiere"] as GameKind[]) {
        const origin = { kind, level: 2, vocabulary: range };
        for (let n = 0; n < 20; n++) {
          const again = regenerateGame(origin, "CI", `refait:${kind}:${n}`);
          expect(again, kind).not.toBeNull();
          expect(CHECKS[kind](again as unknown as Exo, range), `${kind} ${range}`).toEqual([]);
        }
      }
    }
  });
});

describe("les listes de l'alphabet", () => {
  it("donnent à chacune des 25 lettres un seul mot-image, que le test connaît aussi", () => {
    expect(KEY_WORDS.map((word) => [word.letter, word.en, word.emoji])).toEqual(Object.entries(WORD).map(([letter, [word, emoji]]) => [letter, word, emoji]));
    expect(KEY_WORDS.every((word) => word.en[0].toUpperCase() === word.letter)).toBe(true);
    expect(new Set(KEY_WORDS.map((word) => word.emoji)).size).toBe(KEY_WORDS.length);
    expect(Object.fromEntries(SHORT_WORDS.map((word) => [word.en, word.emoji]))).toEqual(SHORT);
    expect([...SPELLED_NAMES]).toEqual(NAMES);
    for (const name of NAMES) expect(new Set(name.toUpperCase()).size, name).toBe(name.length);
  });
});

// ===========================================================================
// LE PROGRAMME : L'ALPHABET VIENT AVANT « HELLO »
// ===========================================================================

describe("les six thématiques d'alphabet", () => {
  const CI_KEYS = ["an-ci-abc-1", "an-ci-abc-2", "an-ci-abc-3"];
  const CP_KEYS = ["an-cp-abc", "an-cp-sounds", "an-cp-name"];
  const topicOf = (key: string) => allProgrammeEntries().find((e) => e.topic.key === key)!.topic;
  const entriesOf = (klass: string) => allProgrammeEntries().filter((e) => e.klass === klass && /^an-/.test(e.topic.key));
  const klassOf = (key: string) => (key.startsWith("an-ci") ? "CI" : "CP");

  it("ouvrent le programme d'anglais du CI et du CP : aucune salutation avant l'alphabet", () => {
    expect(
      entriesOf("CI")
        .map((e) => e.topic.key)
        .slice(0, 4),
    ).toEqual([...CI_KEYS, "an-ci-hello"]);
    expect(
      entriesOf("CP")
        .map((e) => e.topic.key)
        .slice(0, 3),
    ).toEqual(CP_KEYS);
    for (const key of [...CI_KEYS, "an-cp-abc", "an-cp-sounds"]) {
      expect(topicOf(key).description, key).not.toMatch(/hello|thank you|goodbye|please|sorry/i);
    }
  });

  it("couvrent les 26 lettres au CI, chacune dans une seule thématique", () => {
    const covered = CI_KEYS.flatMap((key) => {
      const ranges = new Set((topicOf(key).games ?? []).map((spec) => spec.vocabulary));
      expect(ranges.size, key).toBe(1);
      return rangeOf([...ranges][0]);
    });
    expect(covered.join("")).toBe(ABC);
  });

  it("remplissent les dix places du palier, avec des jeux connus, sans appeler le modèle", () => {
    for (const key of [...CI_KEYS, ...CP_KEYS]) {
      const specs = topicOf(key).games ?? [];
      expect(specs.reduce((sum, spec) => sum + spec.count, 0), key).toBe(PALIER_SIZE);
      for (const spec of specs) expect(Object.keys(GAME_KINDS), `${key} : ${spec.kind}`).toContain(spec.kind);
      expect(topicUsesModel(key), key).toBe(false);
    }
  });

  it("fabriquent des paliers entiers de dix exercices tous différents, justes, qui passent le contrôleur", () => {
    for (const key of [...CI_KEYS, ...CP_KEYS]) {
      const klass = klassOf(key);
      const count = topicOf(key).palierCount ?? 3;
      for (let n = 0; n < 25; n++) {
        for (let palierIndex = 1; palierIndex <= count; palierIndex++) {
          const games = generateGames(topicOf(key).games ?? [], { klass, palierIndex, palierCount: count, seed: `${key}:${n}:${palierIndex}`, windowed: topicOf(key).byLevel });
          expect(games, `${key} palier ${palierIndex}`).toHaveLength(PALIER_SIZE);
          const questions = games.map((game) => `${game.prompt}|${game.answerKey}`);
          expect(new Set(questions).size, `${key} #${n} palier ${palierIndex}`).toBe(questions.length);
          for (const game of games) {
            const origin = game.payload.game as { kind: string; vocabulary?: string };
            if (CHECKS[origin.kind]) expect(CHECKS[origin.kind](game as Exo, origin.vocabulary), `${key} ${origin.kind} : ${game.prompt}`).toEqual([]);
            const defects = auditExercise({ type: game.type, prompt: game.prompt, payload: game.payload, answerKey: game.answerKey, hints: game.hints, class: klass, subject: "Anglais" });
            expect(defects, `${key} palier ${palierIndex} : ${game.prompt}`).toEqual([]);
          }
        }
      }
    }
  });

  it("varient les types d'un palier : au moins trois sortes d'exercices sur dix", () => {
    for (const key of [...CI_KEYS, ...CP_KEYS]) {
      const count = topicOf(key).palierCount ?? 3;
      for (let palierIndex = 1; palierIndex <= count; palierIndex++) {
        const games = generateGames(topicOf(key).games ?? [], { klass: klassOf(key), palierIndex, palierCount: count, seed: key });
        expect(new Set(games.map((game) => game.type)).size, `${key} palier ${palierIndex}`).toBeGreaterThanOrEqual(3);
      }
    }
  });
});

// ===========================================================================
// LA VOIX : LE NOM ANGLAIS DES LETTRES
// ===========================================================================

describe("la voix des lettres", () => {
  it("dit le nom anglais d'une majuscule, d'un prénom épelé, d'une suite de lettres et de « B is for »", () => {
    expect(englishLetters("B")).toBe("bee");
    expect(englishLetters("W")).toBe("double you");
    expect(englishLetters("Z")).toBe("zed");
    expect(englishLetters("F-A-T-O-U")).toBe("eff, ei, tee, oh, you");
    expect(englishLetters("A, B, ___, D")).toBe("ei, bee, blank, dee");
    expect(englishLetters("___, B, C")).toBe("blank, bee, see");
    expect(englishLetters("B is for ___.")).toBe("bee is for ___.");
  });

  // Essai de la vraie voix du 26 octobre 2026 (voir `LETTER_NAMES`) : ces trois choix ne se défont pas sans refaire l'essai.
  it("garde les trois écritures que l'essai de la vraie voix a départagées", () => {
    // « ay » était dit comme la lettre I ; « ei » est dit comme la lettre A.
    expect(englishLetters("A")).toBe("ei");
    expect(englishLetters("A, B, C")).toBe("ei, bee, see");
    expect(Object.values(LETTER_NAMES)).not.toContain("ay");
    // « aitch » seul était relu « Aichi » : seul, H se dit « Aitch. » ; en suite et dans un prénom, « aitch » passe.
    expect(englishLetters("H")).toBe("Aitch.");
    expect(englishLetters("G, H, I")).toBe("jee, aitch, eye");
    expect(englishLetters("H-A")).toBe("aitch, ei");
    // La pause « … » est sautée par la voix : le trou d'une suite est dit « blank » (une phrase à trous garde la pause).
    expect(englishLetters("D, ___, F")).toBe("dee, blank, eff");
    expect(englishLetters("H is for ___.")).toBe("aitch is for ___.");
  });

  it("ne prend pour une lettre ni une minuscule (l'article « a »), ni un mot, ni une phrase", () => {
    for (const text of ["a", "b", "dog", "A dog", "I am Awa.", "It is a dog.", "", "AB", "A-b"]) expect(englishLetters(text), text).toBeNull();
  });

  it("dit une lettre seule en anglais dans l'alphabet, et la laisse muette partout ailleurs", () => {
    expect(speakableTile("B", "en", true)).toBe("bee");
    expect(speakableTile("B", "en", false)).toBeNull();
    expect(speakableTile("B", "fr", true)).toBeNull();
    expect(speakableTile("b", "en", true)).toBeNull();
    expect(speakableTile("F-A-T-O-U", "en", true)).toBe("eff, ei, tee, oh, you");
    expect(speakableTile("chat")).toBe("chat");
  });

  it("ne déchiffre pas du français : « Lis le mot » et « la syllabe » restent muets, « lettre » et « épeler » parlent en anglais", () => {
    expect(promptForbidsTileVoice("Relie chaque lettre au mot qui commence par elle.", true)).toBe(false);
    expect(promptForbidsTileVoice("Remets les lettres dans l'ordre pour épeler « Fatou ».", true)).toBe(false);
    expect(promptForbidsTileVoice("Relie chaque grande lettre à sa petite lettre.", true)).toBe(false);
    expect(promptForbidsTileVoice("Relie chaque lettre au mot qui commence par elle.", false)).toBe(true);
    expect(promptForbidsTileVoice("Lis le mot.", true)).toBe(true);
    expect(promptForbidsTileVoice("Quel mot commence par la syllabe « pou » ?", true)).toBe(true);
    expect(promptForbidsTileVoice("Complète : ___ngue", true)).toBe(true);
  });

  it("dit en anglais les lettres D et L, qui sont aussi des mots français", () => {
    const topic = { programmeKey: "an-cp-abc" };
    const exercise = { type: "qcm", prompt: "Quelle lettre commence le mot anglais de ce dessin ?", payload: { options: ["D", "L", "M"] } };
    for (const text of ["D", "L", "M"]) expect(tileLanguage({ topic, exercise, text }), text).toBe("en");
  });

  it("font dire à chaque tuile de lettre son nom anglais, sur tous les gabarits, aux deux classes", () => {
    const heard = new Set<string>();
    for (const kind of KINDS) {
      for (const klass of ["CI", "CP"] as const) {
        for (const d of draws.slice(0, 60)) {
          const exo = make(kind, klass, d, vocabularyOf(kind));
          const exercise = { type: exo.type, prompt: exo.prompt, payload: exo.payload };
          const options = exo.type === "qcm" ? optionsOf(exo) : exo.type === "fill-blank" ? blankOf(exo).options : [];
          for (const text of options) {
            if (!/^[A-Z]$/.test(text)) continue;
            const verdict = tileClipVerdict({ learnerClass: klass, topic: { programmeKey: `an-${klass.toLowerCase()}-abc` }, exercise, text });
            expect(verdict.ok, `${kind} : ${text}`).toBe(true);
            if (verdict.ok) {
              expect(verdict.lang).toBe("en");
              expect(verdict.text).toBe(englishLetters(text));
              heard.add(text);
            }
          }
        }
      }
    }
    expect(heard.size).toBeGreaterThanOrEqual(24);
  });

  it("garde muettes les tuiles du CE1 et au-delà : l'alphabet ne change pas les classes sans voix", () => {
    const exercise = { type: "qcm", prompt: "Quelle lettre ?", payload: { options: ["B", "C", "D"] } };
    const verdict = tileClipVerdict({ learnerClass: "CE1", topic: { programmeKey: "an-ce1-who" }, exercise, text: "B" });
    expect(verdict.ok).toBe(false);
  });
});
