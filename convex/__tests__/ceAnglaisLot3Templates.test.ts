import { describe, expect, it, vi } from "vitest";
import { auditExercise } from "../paliers/exerciseAudit";
import { GAME_KINDS, generateGames, regenerateGame, type GameKind } from "../paliers/games";
import { NUMBERS, distractors, toWords } from "../paliers/games/ce2AnglaisNombres";
import { PLURAL_WORDS, OWNERS, THINGS } from "../paliers/games/ce1AnglaisGrammaire";
import { makeContext, type GameLevel } from "../paliers/games/shared";
import { topicUsesModel } from "../paliers/pregen";
import { PALIER_SIZE } from "../paliers/scoring";
import { allProgrammeEntries } from "../programme";

vi.setConfig({ testTimeout: 60_000 });

/**
 * LE LOT 3 DU PROGRAMME D'ANGLAIS (`docs/programme-anglais-v2.md`) : un ou plusieurs (`an-ce1-plural`), mon, ton, son
 * (`an-ce1-possessives`) et les nombres de 20 à 100 (`an-ce2-numbers-100`).
 *
 * Chaque gabarit a son VÉRIFICATEUR, écrit ici avec ses propres tables (le pluriel de chaque mot, le possessif de chaque sujet,
 * un convertisseur de nombres en anglais écrit à part de celui du gabarit) : il recalcule la bonne réponse depuis l'énoncé et
 * les tuiles. Des MUTATIONS abîment ensuite chaque exercice juste, et le vérificateur doit le voir.
 */

const LEVELS: GameLevel[] = [1, 2, 3, 4];
const draws = LEVELS.flatMap((level) => Array.from({ length: 40 }, (_, n) => ({ level, seed: `l3:${level}:${n}` })));

type Exo = { type: string; prompt: string; answerKey: string; hints: string[]; payload: Record<string, unknown> };
type Klass = "CE1" | "CE2";
const make = (kind: GameKind, klass: Klass, d: (typeof draws)[number]): Exo => GAME_KINDS[kind].make(makeContext(klass, d.level, `${kind}:${d.seed}`)) as Exo;

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
const emojisOf = (text: string) => text.match(/\p{Extended_Pictographic}/gu) ?? [];
const three = (options: string[]) => isTrue(`trois choix différents : ${JSON.stringify(options)}`, options.length === 3 && new Set(options).size === 3);

type Check = (exo: Exo) => string[];
type Group = { klass: Klass; checks: Record<string, Check>; damage: Record<string, (exo: Exo) => Exo> };

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
const wrongWrite = (exo: Exo): Exo => ({ ...exo, payload: { ...exo.payload, acceptedAnswers: ["zzz"] } });
const flipFirst = (a: string, b: string) => (exo: Exo): Exo => ({
  ...exo,
  payload: { ...exo.payload, items: itemsOf(exo).map((item, i) => (i === 0 ? { ...item, correctZone: item.correctZone === a ? b : a } : item)) },
});

// ===========================================================================
// UN OU PLUSIEURS
// ===========================================================================

const NUMBER_WORD = ["zero", "one", "two", "three", "four", "five"];
const PLURAL: Record<string, { en: string; plural: string }> = Object.fromEntries(
  [
    ["🐱", "cat", "cats"], ["🐶", "dog", "dogs"], ["📖", "book", "books"], ["🍌", "banana", "bananas"], ["🎒", "bag", "bags"], ["🍎", "apple", "apples"],
    ["🥚", "egg", "eggs"], ["🐦", "bird", "birds"], ["🐐", "goat", "goats"], ["🦁", "lion", "lions"], ["🐟", "fish", "fish"], ["🐑", "sheep", "sheep"],
  ].map(([emoji, en, plural]) => [emoji, { en, plural }]),
);
/** Ce que dit un groupe de dessins : « one cat », « three cats », « two fish ». */
const wordOf = (emoji: string | undefined) => (emoji === undefined ? undefined : PLURAL[emoji]);
const phraseOf = (emojis: string[]) => {
  const word = PLURAL[emojis[0] as string];
  return emojis.length === 1 ? `one ${word.en}` : `${NUMBER_WORD[emojis.length]} ${word.plural}`;
};
const groupOfPrompt = (exo: Exo) => emojisOf(exo.prompt.split("\n").slice(1).join("\n"));
const REAL_PLURAL_PHRASES = new Set<string>(
  Object.values(PLURAL).flatMap((word) => [1, 2, 3, 4, 5].map((n) => (n === 1 ? `one ${word.en}` : `${NUMBER_WORD[n]} ${word.plural}`))),
);

const PLURAL_CHECKS: Record<string, Check> = {
  "ce1-en-pl-choix": (exo) => {
    const group = groupOfPrompt(exo);
    return [
      ...isTrue("dessin inconnu", group.length > 0 && wordOf(group[0]) !== undefined),
      ...eq("la bonne écriture", rightOption(exo), phraseOf(group)),
      ...three(optionsOf(exo)),
      ...isTrue("un mauvais choix décrit aussi le dessin", optionsOf(exo).filter((o) => o === phraseOf(group)).length === 1),
    ];
  },
  "ce1-en-pl-trou": (exo) => {
    const [emojiPart, ...rest] = textOf(exo).split(" ");
    const group = emojisOf(emojiPart);
    const word = wordOf(group[0]);
    const { options, answer } = blankOf(exo);
    return [
      ...isTrue("dessin inconnu", word !== undefined),
      ...eq("le nombre écrit", rest[0], group.length === 1 ? "one" : NUMBER_WORD[group.length]),
      ...eq("le nom", answer, group.length === 1 ? word?.en : word?.plural),
      ...three(options),
    ];
  },
  "ce1-en-pl-ecrire": (exo) => {
    const group = groupOfPrompt(exo);
    return [...isTrue("dessin inconnu", group.length > 1 && wordOf(group[0]) !== undefined), ...eq("la réponse admise", acceptedOf(exo), [wordOf(group[0])?.plural])];
  },
  "ce1-en-pl-relier": (exo) => [
    ...pairsOf(exo).flatMap((pair) => {
      const group = emojisOf(pair.right);
      return isTrue(`dessin inconnu : ${pair.right}`, group.length > 0 && new Set(group).size === 1 && wordOf(group[0]) !== undefined).concat(eq(`la phrase de ${pair.right}`, pair.left, phraseOf(group)));
    }),
    ...isTrue("trois paires", pairsOf(exo).length === 3),
  ],
  "ce1-en-pl-glisser": (exo) => [
    ...eq("les cases", zonesOf(exo), ["Singulier", "Pluriel"]),
    ...itemsOf(exo).flatMap((item) => eq(`la case de ${item.text}`, item.correctZone, item.text.startsWith("one ") ? "Singulier" : "Pluriel")),
    ...isTrue("les deux cases servies", new Set(itemsOf(exo).map((item) => item.correctZone)).size === 2),
    ...itemsOf(exo).flatMap((item) => isTrue(`${item.text} n'est pas une phrase de la liste`, REAL_PLURAL_PHRASES.has(item.text))),
  ],
  "ce1-en-pl-phrase": (exo) => {
    const sequence = sequenceOf(exo);
    const noun = sequence[2]?.replace(/\./g, "");
    const known = Object.values(PLURAL).map((word) => word.plural);
    return [...eq("les deux premiers mots", sequence.slice(0, 2), ["I", "like"]), ...isTrue(`${noun} n'est pas un pluriel de la liste`, known.includes(noun)), ...isTrue("le point", sequence[2]?.endsWith(".") === true)];
  },
};
const PLURAL_DAMAGE: Record<string, (exo: Exo) => Exo> = {
  "ce1-en-pl-choix": shift,
  "ce1-en-pl-trou": wrongBlank,
  "ce1-en-pl-ecrire": wrongWrite,
  "ce1-en-pl-relier": swapPairs,
  "ce1-en-pl-glisser": flipFirst("Singulier", "Pluriel"),
  "ce1-en-pl-phrase": (exo) => ({ ...exo, payload: { ...exo.payload, correctSequence: ["like", "I", ...sequenceOf(exo).slice(2)] } }),
};

// ===========================================================================
// MON, TON, SON
// ===========================================================================

const POSSESSIVE_OF: Record<string, string> = { I: "my", you: "your", he: "his", she: "her" };
const BOYS = new Set(["Modou", "Omar", "Cheikh", "Moussa"]);
const GIRLS = new Set(["Awa", "Fatou", "Aminata"]);
const OBJECTS = ["bag", "book", "dog", "cat", "house", "pen"];
const FAMILY = ["mother", "father", "brother", "sister"];
const COLOURS = new Set(["red", "blue", "brown", "black", "white", "green"]);
const subjectOfPrompt = (exo: Exo) => /« (I|you|he|she) »/.exec(exo.prompt)?.[1] ?? "";
/** Le prénom d'une question « le sac d'Awa » ou « le livre de Modou ». */
const nameOfQuestion = (question: string) => /\b(?:d'|de )([A-Z]\w+)$/.exec(question)?.[1] ?? "";

const POSS_CHECKS: Record<string, Check> = {
  "ce1-en-poss-trou": (exo) => {
    const subject = subjectOfPrompt(exo);
    const match = /^(I|You|He|She) (am|are|is) (\w+)\. ___ (\w+) is (\w+)\.$/.exec(textOf(exo));
    const { options, answer } = blankOf(exo);
    if (!match) return [`la phrase « ${textOf(exo)} » n'a pas la forme attendue`];
    const name = match[3];
    return [
      ...eq("le sujet de la phrase", match[1] === "I" ? "I" : match[1].toLowerCase(), subject),
      ...eq("le verbe", match[2], subject === "I" ? "am" : subject === "you" ? "are" : "is"),
      ...eq("le possessif", answer, POSSESSIVE_OF[subject]),
      ...three(options),
      ...isTrue("le prénom ne va pas avec le sujet", subject === "he" ? BOYS.has(name) : subject === "she" ? GIRLS.has(name) : true),
      ...isTrue(`${match[4]} n'est pas un objet de la liste`, OBJECTS.includes(match[4])),
      ...isTrue(`${match[5]} n'est pas une couleur de la liste`, COLOURS.has(match[5])),
    ];
  },
  "ce1-en-poss-choix": (exo) => {
    const question = /« (.+) »/.exec(exo.prompt)?.[1] ?? "";
    const name = nameOfQuestion(question);
    const noun = rightOption(exo).split(" ")[1];
    const expected = /^(mon|ma) /.test(question) ? "my" : /^(ton|ta) /.test(question) ? "your" : BOYS.has(name) ? "his" : GIRLS.has(name) ? "her" : "?";
    return [
      ...eq("la bonne écriture", rightOption(exo), `${expected} ${noun}`),
      ...isTrue(`${noun} n'est pas un objet de la liste`, OBJECTS.includes(noun)),
      ...three(optionsOf(exo)),
      ...isTrue("les trois choix ont le même nom", optionsOf(exo).every((option) => option.split(" ")[1] === noun)),
    ];
  },
  "ce1-en-poss-ecrire": (exo) => {
    const subject = /Il va avec « (I|you|he|she) »/.exec(exo.prompt)?.[1] ?? "";
    return [...eq("la réponse admise", acceptedOf(exo), [POSSESSIVE_OF[subject]]), ...isTrue("la phrase a un trou", /___/.test(exo.prompt))];
  },
  "ce1-en-poss-relier": (exo) => [
    ...pairsOf(exo).flatMap((pair) => eq(`le possessif de ${pair.left}`, pair.right, POSSESSIVE_OF[pair.left] ?? null)),
    ...isTrue("trois paires", pairsOf(exo).length === 3),
  ],
  "ce1-en-poss-glisser": (exo) => [
    ...eq("les cases", zonesOf(exo), ["À un garçon", "À une fille"]),
    ...itemsOf(exo).flatMap((item) => eq(`la case de ${item.text}`, item.correctZone, item.text.startsWith("his ") ? "À un garçon" : item.text.startsWith("her ") ? "À une fille" : null)),
    ...isTrue("les deux cases servies", new Set(itemsOf(exo).map((item) => item.correctZone)).size === 2),
  ],
  "ce1-en-poss-phrase": (exo) => {
    const sequence = sequenceOf(exo);
    const noun = sequence[3]?.replace(/\./g, "");
    return [
      ...eq("This is", sequence.slice(0, 2), ["This", "is"]),
      ...isTrue(`${sequence[2]} n'est pas un possessif`, Object.values(POSSESSIVE_OF).includes(sequence[2])),
      ...isTrue(`${noun} n'est pas un nom de la liste`, [...OBJECTS, ...FAMILY].includes(noun)),
    ];
  },
};
const POSS_DAMAGE: Record<string, (exo: Exo) => Exo> = {
  "ce1-en-poss-trou": wrongBlank,
  "ce1-en-poss-choix": shift,
  "ce1-en-poss-ecrire": wrongWrite,
  "ce1-en-poss-relier": swapPairs,
  "ce1-en-poss-glisser": flipFirst("À un garçon", "À une fille"),
  "ce1-en-poss-phrase": reverse,
};

// ===========================================================================
// LES NOMBRES DE 20 À 100
// ===========================================================================

/** Un convertisseur écrit à part de celui du gabarit : une table de tous les mots, de 13 à 100. */
const WORDS: Record<number, string> = {};
{
  const unit = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
  const ten: Record<number, string> = { 2: "twenty", 3: "thirty", 4: "forty", 5: "fifty", 6: "sixty", 7: "seventy", 8: "eighty", 9: "ninety" };
  const teen = ["thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
  teen.forEach((word, i) => (WORDS[13 + i] = word));
  for (let n = 20; n <= 99; n++) WORDS[n] = n % 10 === 0 ? ten[n / 10] : `${ten[Math.floor(n / 10)]}-${unit[n % 10]}`;
  WORDS[100] = "one hundred";
}
const NUMBER_OF_WORD = new Map(Object.entries(WORDS).map(([n, word]) => [word, Number(n)] as const));
const quoted = (prompt: string) => /« ([^»]+) »/.exec(prompt)?.[1] ?? "";

const NUM_CHECKS: Record<string, Check> = {
  "ce2-en-num-mot": (exo) => {
    const n = NUMBER_OF_WORD.get(quoted(exo.prompt));
    return [
      ...isTrue("nombre inconnu", n !== undefined),
      ...eq("les chiffres", rightOption(exo), String(n)),
      ...three(optionsOf(exo)),
      ...isTrue("un choix hors de 13 à 100", optionsOf(exo).every((o) => Number(o) >= 13 && Number(o) <= 100)),
    ];
  },
  "ce2-en-num-chiffre": (exo) => {
    const n = Number(/Comment écrit-on (\d+) en anglais/.exec(exo.prompt)?.[1]);
    return [...eq("l'écriture", rightOption(exo), WORDS[n]), ...three(optionsOf(exo)), ...isTrue("un choix n'est pas un nombre", optionsOf(exo).every((o) => NUMBER_OF_WORD.has(o)))];
  },
  "ce2-en-num-ecrire": (exo) => {
    const n = Number(/Écris (\d+) en lettres/.exec(exo.prompt)?.[1]);
    const accepted = acceptedOf(exo);
    return [
      ...isTrue("la bonne écriture n'est pas la première", accepted[0] === WORDS[n]),
      ...isTrue("une écriture admise est fausse", accepted.every((a) => a === WORDS[n] || a === WORDS[n].replace(/-/g, " ") || (n === 100 && a === "a hundred"))),
    ];
  },
  "ce2-en-num-relier": (exo) => [
    ...pairsOf(exo).flatMap((pair) => eq(`les chiffres de ${pair.left}`, NUMBER_OF_WORD.get(pair.left), Number(pair.right))),
    ...isTrue("trois paires", pairsOf(exo).length === 3),
  ],
  "ce2-en-num-ordre": (exo) => {
    const numbers = sequenceOf(exo).map((word) => NUMBER_OF_WORD.get(word));
    return [
      ...isTrue("un nombre inconnu", numbers.every((n) => n !== undefined)),
      ...isTrue("pas du plus petit au plus grand", numbers.every((n, i) => i === 0 || (n as number) > (numbers[i - 1] as number))),
      ...isTrue("trois nombres", numbers.length === 3),
    ];
  },
  "ce2-en-num-suite": (exo) => {
    const parts = textOf(exo).split(", ");
    const hole = parts.indexOf("___");
    const nums = parts.map((part) => (part === "___" ? null : (NUMBER_OF_WORD.get(part) ?? NaN)));
    const diffs = nums.slice(1).flatMap((n, i) => (n !== null && nums[i] !== null ? [(n as number) - (nums[i] as number)] : []));
    const step = diffs[0];
    const expected = hole === 0 ? (nums[1] as number) - step : hole === 3 ? (nums[2] as number) + step : (nums[hole - 1] as number) + step;
    const { options, answer } = blankOf(exo);
    return [
      ...isTrue("un seul trou dans une suite de quatre", parts.filter((p) => p === "___").length === 1 && parts.length === 4),
      ...isTrue("un mot inconnu", nums.every((n) => n === null || !Number.isNaN(n))),
      ...isTrue("les écarts ne sont pas les mêmes", diffs.length > 0 && new Set(diffs).size === 1 && step > 0),
      ...eq("le nombre caché", NUMBER_OF_WORD.get(answer), expected),
      ...three(options),
    ];
  },
  "ce2-en-num-glisser": (exo) => [
    ...eq("les cases", zonesOf(exo), ["Finit par -teen", "Finit par -ty"]),
    ...itemsOf(exo).flatMap((item) => eq(`la case de ${item.text}`, item.correctZone, item.text.endsWith("teen") ? "Finit par -teen" : item.text.endsWith("ty") ? "Finit par -ty" : null)),
    ...isTrue("les deux cases servies", new Set(itemsOf(exo).map((item) => item.correctZone)).size === 2),
  ],
};
const NUM_DAMAGE: Record<string, (exo: Exo) => Exo> = {
  "ce2-en-num-mot": shift,
  "ce2-en-num-chiffre": shift,
  "ce2-en-num-ecrire": wrongWrite,
  "ce2-en-num-relier": swapPairs,
  "ce2-en-num-ordre": reverse,
  "ce2-en-num-suite": wrongBlank,
  "ce2-en-num-glisser": flipFirst("Finit par -teen", "Finit par -ty"),
};

const GROUPS: Group[] = [
  { klass: "CE1", checks: { ...PLURAL_CHECKS, ...POSS_CHECKS }, damage: { ...PLURAL_DAMAGE, ...POSS_DAMAGE } },
  { klass: "CE2", checks: NUM_CHECKS, damage: NUM_DAMAGE },
];

describe.each(GROUPS)("les gabarits du lot 3 ($klass)", ({ klass, checks, damage }) => {
  const KINDS = Object.keys(checks) as GameKind[];

  it("ont un vérificateur chacun, et chacun a son exercice abîmé", () => {
    expect(Object.keys(damage).sort()).toEqual([...KINDS].sort());
    for (const kind of KINDS) expect(Object.keys(GAME_KINDS), kind).toContain(kind);
  });

  it("donnent une bonne réponse que leur vérificateur retrouve, à tous les niveaux", () => {
    const failures: string[] = [];
    for (const kind of KINDS) {
      for (const d of draws) {
        const exo = make(kind, klass, d);
        const problems = checks[kind](exo);
        if (problems.length > 0) failures.push(`${kind} niveau ${d.level} : ${exo.prompt.replace(/\n/g, " ")} → ${problems.join(" ; ")}`);
      }
    }
    expect([...new Set(failures)].slice(0, 12)).toEqual([]);
  });

  it("sont vus par leur vérificateur quand on abîme la bonne réponse (le contrôle n'est pas vide)", () => {
    for (const kind of KINDS) {
      let total = 0;
      let seen = 0;
      for (const d of draws) {
        const exo = make(kind, klass, d);
        if (checks[kind](exo).length > 0) continue;
        total += 1;
        if (checks[kind](damage[kind](exo)).length > 0) seen += 1;
      }
      expect(total, kind).toBeGreaterThan(40);
      expect(seen, `${kind} : le vérificateur ne voit pas l'exercice abîmé`).toBe(total);
    }
  });

  it("n'ont aucun deux-points, au plus une apostrophe et vingt-huit mots dans l'énoncé", () => {
    for (const kind of KINDS) {
      for (const d of draws) {
        const exo = make(kind, klass, d);
        expect(exo.prompt, kind).not.toMatch(/:/);
        expect((exo.prompt.match(/'/g) ?? []).length, `${kind} : ${exo.prompt}`).toBeLessThanOrEqual(1);
        const words = exo.prompt
          .replace(/\p{Extended_Pictographic}/gu, " ")
          .split(/\s+/)
          .filter((token) => /[\p{L}\p{N}]/u.test(token));
        expect(words.length, `${kind} : ${exo.prompt}`).toBeLessThanOrEqual(28);
      }
    }
  });

  it("n'écrivent un émoji que sans sélecteur de variation ni liaison, et d'Unicode 11 au plus", () => {
    for (const kind of KINDS) {
      for (const d of draws) {
        const exo = make(kind, klass, d);
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

  it("donnent trois indices différents, qui n'écrivent pas la bonne réponse, et se refont à l'identique avec la même graine", () => {
    for (const kind of KINDS) {
      const a = GAME_KINDS[kind].make(makeContext(klass, 2, "graine"));
      const b = GAME_KINDS[kind].make(makeContext(klass, 2, "graine"));
      expect(a).toEqual(b);
      expect(a.hints, kind).toHaveLength(3);
      expect(new Set(a.hints).size, kind).toBe(3);
      for (const d of draws.slice(0, 80)) {
        const exo = make(kind, klass, d);
        const answer = String(exo.answerKey);
        if (answer.length < 4 || /^\d+$/.test(answer)) continue;
        for (const hint of exo.hints) expect(hint.toLowerCase(), `${kind} : « ${hint} » écrit « ${answer} »`).not.toContain(answer.toLowerCase());
      }
    }
  });

  it("passent le contrôleur de l'anglais sans aucun défaut, à tous les niveaux", () => {
    for (const kind of KINDS) {
      for (const d of draws) {
        const exo = make(kind, klass, d);
        const defects = auditExercise({ type: exo.type, prompt: exo.prompt, payload: exo.payload, answerKey: exo.answerKey, hints: exo.hints, class: klass, subject: "Anglais" });
        expect(defects, `${kind} niveau ${d.level} : ${exo.prompt}`).toEqual([]);
      }
    }
  });

  it("se refont, sans le modèle, quand un exercice est raté", () => {
    for (const kind of KINDS) {
      for (let n = 0; n < 10; n++) {
        const again = regenerateGame({ kind, level: 2 }, klass, `refait:${kind}:${n}`);
        expect(again, kind).not.toBeNull();
        expect(checks[kind](again as unknown as Exo), kind).toEqual([]);
      }
    }
  });
});

describe("les listes du lot 3", () => {
  it("donnent à chaque dessin un mot et un pluriel que le test connaît aussi", () => {
    expect(PLURAL_WORDS.map((word) => [word.emoji, word.en, word.plural])).toEqual(Object.entries(PLURAL).map(([emoji, word]) => [emoji, word.en, word.plural]));
  });

  it("donnent à chaque sujet son possessif, et aux objets leurs noms", () => {
    expect(Object.fromEntries(OWNERS.map((owner) => [owner.subject, owner.possessive]))).toEqual(POSSESSIVE_OF);
    expect(THINGS.map((thing) => thing.en)).toEqual(OBJECTS);
    for (const owner of OWNERS) {
      if (owner.subject === "he") for (const name of owner.names) expect(BOYS.has(name), name).toBe(true);
      if (owner.subject === "she") for (const name of owner.names) expect(GIRLS.has(name), name).toBe(true);
    }
  });

  it("écrivent les nombres comme le test, de 13 à 100, et gardent des mauvais choix qui sont d'autres nombres", () => {
    for (let n = 13; n <= 100; n++) expect(toWords(n), String(n)).toBe(WORDS[n]);
    expect(() => toWords(12)).toThrow();
    for (const n of NUMBERS) {
      const [a, b] = distractors(n);
      expect(new Set([n, a, b]).size, String(n)).toBe(3);
      for (const wrong of [a, b]) expect(wrong >= 13 && wrong <= 100, `${n} : ${wrong}`).toBe(true);
    }
    expect(NUMBERS).toHaveLength(27);
  });

  it("proposent, pour une dizaine, son nombre en -teen parmi les mauvais choix", () => {
    expect(distractors(30)).toContain(13);
    expect(distractors(40)).toContain(14);
    expect(distractors(37)).toContain(73);
  });
});

// ===========================================================================
// LES THÉMATIQUES DU PROGRAMME
// ===========================================================================

describe("les trois thématiques du lot 3", () => {
  const TOPICS = [
    { key: "an-ce1-plural", klass: "CE1" as const },
    { key: "an-ce1-possessives", klass: "CE1" as const },
    { key: "an-ce2-numbers-100", klass: "CE2" as const },
  ];
  const entryOf = (key: string) => allProgrammeEntries().find((e) => e.topic.key === key)!;
  const allChecks: Record<string, Check> = { ...PLURAL_CHECKS, ...POSS_CHECKS, ...NUM_CHECKS };

  it("sont dans la bonne classe, dans l'ordre du plan, en trois paliers, sans le modèle", () => {
    const ce1 = allProgrammeEntries()
      .filter((e) => e.klass === "CE1" && /^an-/.test(e.topic.key))
      .map((e) => e.topic.key);
    expect(ce1.slice(0, 6)).toEqual(["an-ce1-spell", "an-ce1-who", "an-ce1-days", "an-ce1-a-an", "an-ce1-plural", "an-ce1-possessives"]);
    const ce2 = allProgrammeEntries().filter((e) => e.klass === "CE2" && /^an-/.test(e.topic.key));
    expect(ce2[0].topic.key).toBe("an-ce2-numbers-100");
    for (const { key, klass } of TOPICS) {
      expect(entryOf(key).klass, key).toBe(klass);
      expect(entryOf(key).topic.palierCount, key).toBe(3);
      const specs = entryOf(key).topic.games ?? [];
      expect(specs.reduce((sum, spec) => sum + spec.count, 0), key).toBe(PALIER_SIZE);
      for (const spec of specs) expect(Object.keys(GAME_KINDS), `${key} : ${spec.kind}`).toContain(spec.kind);
      expect(topicUsesModel(key), key).toBe(false);
    }
  });

  it("fabriquent des paliers entiers de dix exercices tous différents, justes, qui passent le contrôleur", () => {
    for (const { key, klass } of TOPICS) {
      for (let n = 0; n < 30; n++) {
        for (let palierIndex = 1; palierIndex <= 3; palierIndex++) {
          const games = generateGames(entryOf(key).topic.games ?? [], { klass, palierIndex, palierCount: 3, seed: `${key}:${n}:${palierIndex}` });
          expect(games, `${key} palier ${palierIndex}`).toHaveLength(PALIER_SIZE);
          const questions = games.map((game) => `${game.prompt}|${game.answerKey}`);
          expect(new Set(questions).size, `${key} #${n} palier ${palierIndex}`).toBe(questions.length);
          for (const game of games) {
            const kind = (game.payload.game as { kind: string }).kind;
            expect(allChecks[kind](game as Exo), `${key} palier ${palierIndex} ${kind} : ${game.prompt}`).toEqual([]);
            const defects = auditExercise({ type: game.type, prompt: game.prompt, payload: game.payload, answerKey: game.answerKey, hints: game.hints, class: klass, subject: "Anglais" });
            expect(defects, `${key} palier ${palierIndex} : ${game.prompt}`).toEqual([]);
          }
        }
      }
    }
  });

  it("varient les types d'un palier : au moins quatre sortes d'exercices sur dix", () => {
    for (const { key, klass } of TOPICS) {
      for (let palierIndex = 1; palierIndex <= 3; palierIndex++) {
        const games = generateGames(entryOf(key).topic.games ?? [], { klass, palierIndex, palierCount: 3, seed: key });
        expect(new Set(games.map((game) => game.type)).size, `${key} palier ${palierIndex}`).toBeGreaterThanOrEqual(4);
      }
    }
  });

  it("gardent fish et sheep pour le troisième palier du pluriel, et les dizaines, puis les nombres composés, pour les paliers des nombres", () => {
    const wordsAt = (palierIndex: number) => {
      const found = new Set<string>();
      for (let n = 0; n < 30; n++) {
        for (const game of generateGames(entryOf("an-ce1-plural").topic.games ?? [], { klass: "CE1", palierIndex, palierCount: 3, seed: `irr:${n}` })) {
          const kind = (game.payload.game as { kind: string }).kind;
          if (["ce1-en-pl-choix", "ce1-en-pl-ecrire", "ce1-en-pl-trou"].includes(kind)) {
            const source = kind === "ce1-en-pl-trou" ? textOf(game as Exo) : game.prompt;
            for (const emoji of emojisOf(source)) found.add(PLURAL[emoji].en);
          }
        }
      }
      return found;
    };
    for (const palierIndex of [1, 2]) {
      const found = wordsAt(palierIndex);
      expect(found.has("fish") || found.has("sheep"), `palier ${palierIndex}`).toBe(false);
    }
    expect(wordsAt(3).has("fish")).toBe(true);

    const numbersAt = (palierIndex: number) => {
      const found = new Set<number>();
      for (let n = 0; n < 30; n++) {
        for (const game of generateGames(entryOf("an-ce2-numbers-100").topic.games ?? [], { klass: "CE2", palierIndex, palierCount: 3, seed: `num:${n}` })) {
          const kind = (game.payload.game as { kind: string }).kind;
          if (kind === "ce2-en-num-chiffre") found.add(Number(/(\d+)/.exec(game.prompt)![1]));
        }
      }
      return found;
    };
    expect([...numbersAt(1)].every((n) => n % 10 === 0)).toBe(true);
    expect([...numbersAt(2)].every((n) => n > 20 && n < 60 && n % 10 !== 0)).toBe(true);
    expect([...numbersAt(3)].every((n) => n > 60 && n < 100 && n % 10 !== 0)).toBe(true);
  });
});
