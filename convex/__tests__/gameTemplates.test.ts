import { describe, expect, it } from "vitest";
import { auditExercise } from "../paliers/exerciseAudit";
import { verifyAnswer } from "../paliers/exerciseRules";
import {
  GAME_KINDS,
  TEMPLATE_RETRIES,
  gameCount,
  gameOriginOf,
  generateGames,
  isGameKind,
  regenerateGame,
  type GameKind,
} from "../paliers/games";
import { makeContext, type GameLevel } from "../paliers/games/shared";
import { shapeBatch } from "../paliers";
import { LEXICON, SENTENCES, stageOf } from "../paliers/games/words";
import { KNOWN_WORDS } from "../paliers/knownWords";
import { PALIER_SIZE, SPARE_AI_EXERCISES, exercisesToRequest, hasEnoughValidExercises } from "../paliers/scoring";
import { countByTopic, shouldInvalidate, topicUsesModel } from "../paliers/pregen";
import { allProgrammeEntries } from "../programme";

/**
 * LES GABARITS DE MOTS ET DE DÉNOMBREMENT : des exercices classiques écrits par
 * le code. Ils doivent passer le contrôleur sans un seul défaut, se corriger
 * avec la règle de toujours, et ne jamais se tromper de découpe ni de compte.
 */

const TEMPLATES = [
  "syllabes-ordre",
  "lettres-ordre",
  "syllabe-initiale",
  "lettre-initiale",
  "syllabes-compter",
  "syllabe-manquante",
  "lettre-manquante",
  "phrase-trou",
  "syllabe-finale",
  "lettres-compter",
  "mot-syllabe",
  "syllabe-mot",
  "mot-image",
  "majuscule-minuscule",
  "compter-emojis",
  "ajouter-emojis",
  "enlever-emojis",
  "rangee-plus-moins",
  "nombre-groupe",
  "nombre-voisin",
  "nombre-plus-grand",
  "nombre-en-lettres",
  "nombres-ordre",
  "double-moitie",
  "complement",
  "calcul-ecrit",
  "dizaine-unites",
] as const satisfies readonly GameKind[];

/** Les gabarits de calcul : leur matière est « Mathématiques ». */
const MATH_KINDS = new Set<string>([
  "compter-emojis",
  "ajouter-emojis",
  "enlever-emojis",
  "rangee-plus-moins",
  "nombre-groupe",
  "nombre-voisin",
  "nombre-plus-grand",
  "nombre-en-lettres",
  "nombres-ordre",
  "double-moitie",
  "complement",
  "calcul-ecrit",
  "dizaine-unites",
]);

const CLASSIC_TYPES = new Set<string>(["qcm", "order", "match", "fill-blank"]);

const LEVELS: GameLevel[] = [1, 2, 3, 4];
const VOCABULARIES = [undefined, "mots-1", "mots-2", "mots-3", "mots-4"] as const;
const fold = (text: string) => text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
const emojisIn = (text: string) => Array.from(text.matchAll(/\p{Extended_Pictographic}/gu)).length;

/** La réponse juste d'un exercice fabriqué, dans la forme que l'écran envoie. */
function rightAnswer(exo: { type: string; payload: Record<string, unknown> }): string {
  const p = exo.payload;
  switch (exo.type) {
    case "qcm":
      return String(p.correctIndex);
    case "order":
      return JSON.stringify(p.correctSequence);
    case "match":
      return JSON.stringify(p.pairs);
    case "fill-blank":
      return JSON.stringify((p.blanks as { answer: string }[]).map((b) => b.answer));
    default:
      throw new Error(`type inattendu : ${exo.type}`);
  }
}

describe("le vocabulaire des gabarits de mots", () => {
  it("découpe chaque mot en syllabes qui le réécrivent", () => {
    for (const entry of LEXICON) {
      expect(entry.syllables.join(""), entry.word).toBe(entry.word);
    }
  });

  it("ne contient que des mots de la liste fermée du CI et du CP", () => {
    for (const entry of LEXICON) {
      expect(KNOWN_WORDS.has(fold(entry.word)), entry.word).toBe(true);
    }
  });

  it("n'a pas deux fois le même mot ni le même émoji", () => {
    const words = LEXICON.map((e) => e.word);
    expect(new Set(words).size).toBe(words.length);
    const emojis = LEXICON.flatMap((e) => (e.emoji ? [e.emoji] : []));
    expect(new Set(emojis).size).toBe(emojis.length);
  });

  it("comprend « mots-N » comme les mots vus jusqu'au palier N", () => {
    expect(stageOf("mots-2")).toBe(2);
    expect(stageOf(undefined)).toBe(4);
    expect(stageOf("autre")).toBe(4);
  });
});

describe.each(TEMPLATES)("le gabarit « %s »", (kind) => {
  const cases = LEVELS.flatMap((level) =>
    VOCABULARIES.flatMap((vocabulary) =>
      [0, 1, 2, 3, 4].map((n) => ({ level, vocabulary, seed: `${kind}:${level}:${vocabulary ?? "tous"}:${n}` })),
    ),
  );

  it("passe le contrôleur sans aucun défaut", () => {
    for (const { level, vocabulary, seed } of cases) {
      const exo = GAME_KINDS[kind].make(makeContext("CI", level, seed, undefined, vocabulary));
      const subject = MATH_KINDS.has(kind) ? "Mathématiques" : "Français";
      const defects = auditExercise({
        type: exo.type,
        prompt: exo.prompt,
        payload: exo.payload,
        answerKey: exo.answerKey,
        hints: exo.hints,
        class: "CI",
        subject,
      });
      expect(defects, `${seed} : ${exo.prompt}`).toEqual([]);
    }
  });

  it("se corrige juste avec la bonne réponse, faux avec une autre", () => {
    for (const { level, vocabulary, seed } of cases) {
      const exo = GAME_KINDS[kind].make(makeContext("CI", level, seed, undefined, vocabulary));
      expect(verifyAnswer(exo, rightAnswer(exo)), `${seed} : ${exo.prompt}`).toBe(true);
      if (exo.type === "qcm") {
        const options = exo.payload.options as string[];
        const wrongIndex = options.findIndex((_, i) => i !== exo.payload.correctIndex);
        expect(verifyAnswer(exo, String(wrongIndex)), seed).toBe(false);
      }
    }
  });

  it("refait les mêmes exercices avec la même graine", () => {
    const a = GAME_KINDS[kind].make(makeContext("CI", 2, "graine", undefined, "mots-3"));
    const b = GAME_KINDS[kind].make(makeContext("CI", 2, "graine", undefined, "mots-3"));
    expect(a).toEqual(b);
  });

  it("donne trois indices différents", () => {
    for (const { level, vocabulary, seed } of cases) {
      const exo = GAME_KINDS[kind].make(makeContext("CI", level, seed, undefined, vocabulary));
      expect(exo.hints).toHaveLength(3);
      expect(new Set(exo.hints).size).toBe(3);
    }
  });
});

describe("les gabarits de mots tiennent leur vocabulaire", () => {
  it("ne citent que des mots du palier de lecture demandé", () => {
    for (const kind of ["syllabe-initiale", "lettre-initiale", "syllabes-compter"] as const) {
      for (let n = 0; n < 15; n++) {
        const exo = GAME_KINDS[kind].make(makeContext("CI", 1, `v1:${kind}:${n}`, undefined, "mots-1"));
        const word = /« ([^»]+) »/.exec(exo.prompt)?.[1] ?? "";
        const entry = LEXICON.find((e) => e.word === word);
        expect(entry, `${kind} : ${exo.prompt}`).toBeDefined();
        expect(entry!.stage, word).toBe(1);
      }
    }
  });

  it("ne proposent jamais, comme mauvais choix, une pièce qui forme un mot", () => {
    for (const kind of ["syllabe-manquante", "lettre-manquante"] as const) {
      for (let n = 0; n < 40; n++) {
        const exo = GAME_KINDS[kind].make(makeContext("CI", 2, `trou:${kind}:${n}`, undefined, "mots-4"));
        const text = exo.payload.text as string;
        const blank = (exo.payload.blanks as { options: string[]; answer: string }[])[0];
        for (const option of blank.options) {
          const isWord = KNOWN_WORDS.has(fold(text.replace("___", option)));
          expect(isWord, `${text} avec ${option}`).toBe(option === blank.answer);
        }
      }
    }
  });

  it("ne donnent jamais deux syllabes qui commencent le même mot", () => {
    for (let n = 0; n < 40; n++) {
      const exo = GAME_KINDS["syllabe-initiale"].make(makeContext("CI", 2, `init:${n}`, undefined, "mots-4"));
      const word = /« ([^»]+) »/.exec(exo.prompt)![1];
      const options = exo.payload.options as string[];
      expect(
        options.filter((s) => word.startsWith(s)),
        `${word} : ${options.join(", ")}`,
      ).toHaveLength(1);
    }
  });

  it("relient des syllabes et des mots qui ne se confondent pas", () => {
    for (let n = 0; n < 40; n++) {
      const exo = GAME_KINDS["syllabe-mot"].make(makeContext("CI", 2, `lien:${n}`, undefined, "mots-4"));
      const pairs = exo.payload.pairs as { left: string; right: string }[];
      for (const pair of pairs) {
        expect(
          pairs.filter((other) => other.right.startsWith(pair.left)),
          `${pair.left} dans ${pairs.map((p) => p.right).join(", ")}`,
        ).toHaveLength(1);
      }
    }
  });
});

describe("la phrase à trou n'a qu'une bonne réponse", () => {
  it("écrit chaque phrase avec un seul trou, pour un mot du vocabulaire", () => {
    for (const sentence of SENTENCES) {
      expect(LEXICON.some((e) => e.word === sentence.word), sentence.word).toBe(true);
      expect(sentence.text.split("___").length - 1, sentence.text).toBe(1);
      for (const other of sentence.also ?? []) {
        expect(LEXICON.some((e) => e.word === other), `${sentence.word} : ${other}`).toBe(true);
        expect(other, sentence.word).not.toBe(sentence.word);
      }
    }
    const words = SENTENCES.map((s) => s.word);
    expect(new Set(words).size).toBe(words.length);
  });

  it("ne propose jamais un mot qui irait aussi, ni un mot déjà écrit dans la phrase", () => {
    for (let n = 0; n < 200; n++) {
      const vocabulary = ["mots-1", "mots-2", "mots-3", "mots-4"][n % 4];
      const exo = GAME_KINDS["phrase-trou"].make(makeContext("CI", 2, `phrase:${n}`, undefined, vocabulary));
      const text = exo.payload.text as string;
      const sentence = SENTENCES.find((s) => s.text === text)!;
      const blank = (exo.payload.blanks as { options: string[]; answer: string }[])[0];
      expect(blank.answer, text).toBe(sentence.word);
      expect(blank.options, text).toHaveLength(3);
      for (const option of blank.options.filter((o) => o !== sentence.word)) {
        expect(sentence.also ?? [], `${text} avec ${option}`).not.toContain(option);
        expect(fold(text), `${text} avec ${option}`).not.toMatch(new RegExp(`(?<![a-z])${fold(option)}(?![a-z])`));
      }
    }
  });

  it("ne cite que des mots du palier de lecture demandé", () => {
    for (let n = 0; n < 60; n++) {
      const exo = GAME_KINDS["phrase-trou"].make(makeContext("CI", 2, `stade:${n}`, undefined, "mots-2"));
      const blank = (exo.payload.blanks as { options: string[]; answer: string }[])[0];
      for (const option of blank.options) {
        expect(LEXICON.find((e) => e.word === option)?.stage, `${exo.payload.text} : ${option}`).toBeLessThanOrEqual(2);
      }
    }
  });
});

describe("les gabarits de fin de mot et de lettres comptent juste", () => {
  it("ne propose jamais, comme mauvais choix, une syllabe qui finit le mot", () => {
    for (let n = 0; n < 200; n++) {
      const exo = GAME_KINDS["syllabe-finale"].make(makeContext("CI", 2, `fin:${n}`, undefined, ["mots-1", "mots-2", "mots-3", "mots-4"][n % 4]));
      const word = /« ([^»]+) »/.exec(exo.prompt)![1];
      const entry = LEXICON.find((e) => e.word === word)!;
      const options = exo.payload.options as string[];
      expect(options, word).toHaveLength(3);
      expect(options.filter((s) => word.endsWith(s)), `${word} : ${options.join(", ")}`).toEqual([entry.syllables[entry.syllables.length - 1]]);
      // L'indice nomme la première syllabe : elle ne doit pas être la réponse.
      expect(entry.syllables[0], word).not.toBe(exo.answerKey);
    }
  });

  it("compte les lettres du mot, accents compris", () => {
    for (let n = 0; n < 60; n++) {
      const exo = GAME_KINDS["lettres-compter"].make(makeContext("CI", 2, `lettres:${n}`, undefined, ["mots-1", "mots-4"][n % 2]));
      const word = /« ([^»]+) »/.exec(exo.prompt)![1];
      expect(Number(exo.answerKey), word).toBe(Array.from(word).length);
      expect((exo.payload.options as string[]).every((o) => Number(o) >= 1)).toBe(true);
    }
  });
});

describe("le gabarit « mot-syllabe » n'a qu'une bonne réponse", () => {
  /** Ce qu'un mot fait entendre au début : sans accents, et « au », « eau » comme « o ». */
  const sound = (text: string) => fold(text).replace(/^(?:eau|au)/, "o");
  const begins = (word: string, syllable: string) =>
    fold(word).startsWith(fold(syllable)) || sound(word).startsWith(sound(syllable));
  const syllableOf = (prompt: string) => /« ([^»]+) »/.exec(prompt)![1];
  const targets = LEXICON.filter((entry) => entry.syllables.length >= 2);

  /** Impose le mot cherché : tous les autres ont déjà servi, `pickWord` ne laisse que lui. */
  function forced(target: string, seed: string, vocabulary: string | undefined) {
    const used = new Set(LEXICON.map((entry) => entry.word).filter((word) => word !== target));
    return GAME_KINDS["mot-syllabe"].make(makeContext("CI", 2, seed, used, vocabulary));
  }

  it("n'a qu'un mot qui commence par la syllabe, pour chaque mot du vocabulaire et chaque palier de lecture", () => {
    for (const target of targets) {
      for (const vocabulary of VOCABULARIES.filter((v) => stageOf(v) >= target.stage)) {
        for (let n = 0; n < 25; n++) {
          const exo = forced(target.word, `unique:${target.word}:${n}`, vocabulary);
          const label = `${target.word} (${vocabulary ?? "tous"}) : ${exo.prompt}`;
          expect(exo.answerKey, label).toBe(target.word);
          const syllable = syllableOf(exo.prompt);
          expect(syllable, label).toBe(target.syllables[0]);
          const options = exo.payload.options as string[];
          expect(new Set(options).size, label).toBe(3);
          expect(options[exo.payload.correctIndex as number], label).toBe(target.word);
          expect(
            options.filter((option) => begins(option, syllable)),
            `${label} : ${options.join(", ")}`,
          ).toEqual([target.word]);
          // Les mauvais choix sont des mots que l'enfant a déjà vus.
          for (const option of options) {
            expect(LEXICON.find((entry) => entry.word === option)?.stage, `${label} : ${option}`).toBeLessThanOrEqual(
              stageOf(vocabulary),
            );
          }
        }
      }
    }
  });

  it("écarte « ballon » pour « ba », « loupe » pour « lo », « olive » pour « au » : à l'écrit comme à l'oreille", () => {
    const lookAlikes: Record<string, string[]> = {
      bateau: ["ballon"],
      lola: ["loupe"],
      auto: ["olive", "eau"],
      olive: ["auto", "eau"],
      été: ["élève", "eau"],
      élève: ["été", "eau"],
      savon: ["salon"],
      salon: ["savon"],
      tomate: ["toto"],
      toto: ["tomate"],
    };
    for (const [target, never] of Object.entries(lookAlikes)) {
      for (let n = 0; n < 60; n++) {
        const options = forced(target, `ressemble:${target}:${n}`, "mots-4").payload.options as string[];
        for (const word of never) expect(options, `${target} : ${options.join(", ")}`).not.toContain(word);
      }
    }
  });

  it("ne dessine pas la réponse et ne l'écrit dans aucun indice", () => {
    for (let n = 0; n < 200; n++) {
      const vocabulary = VOCABULARIES[n % VOCABULARIES.length];
      const level = (1 + (n % 4)) as GameLevel;
      const exo = GAME_KINDS["mot-syllabe"].make(makeContext("CI", level, `indices:${n}`, undefined, vocabulary));
      expect(emojisIn(exo.prompt), exo.prompt).toBe(0);
      for (const hint of exo.hints) {
        for (const option of exo.payload.options as string[]) {
          expect(fold(hint), `${exo.prompt} : « ${hint} » écrit « ${option} »`).not.toMatch(
            new RegExp(`(?<![a-z])${fold(option)}(?![a-z])`),
          );
        }
      }
    }
  });

  it("varie le mot cherché d'un tirage à l'autre", () => {
    const answers = new Set<string>();
    for (let n = 0; n < 60; n++) {
      answers.add(GAME_KINDS["mot-syllabe"].make(makeContext("CI", 2, `varie:${n}`, undefined, "mots-4")).answerKey);
    }
    expect(answers.size).toBeGreaterThanOrEqual(8);
  });
});

describe("le gabarit « majuscule-minuscule » relie chaque lettre à SA majuscule", () => {
  it("donne quatre paires distinctes, sans accent, dont chaque majuscule est celle de sa minuscule", () => {
    for (let n = 0; n < 300; n++) {
      const vocabulary = [undefined, "mots-1", "mots-2", "mots-3", "mots-4"][n % 5];
      const exo = GAME_KINDS["majuscule-minuscule"].make(makeContext("CI", ((n % 4) + 1) as GameLevel, `maj:${n}`, undefined, vocabulary));
      const pairs = exo.payload.pairs as { left: string; right: string }[];
      expect(pairs, exo.answerKey).toHaveLength(4);
      expect(new Set(pairs.map((p) => p.left)).size, exo.answerKey).toBe(4);
      expect(new Set(pairs.map((p) => p.right)).size, exo.answerKey).toBe(4);
      for (const pair of pairs) {
        expect(pair.left, exo.answerKey).toMatch(/^[a-z]$/);
        expect(pair.right, exo.answerKey).toBe(pair.left.toUpperCase());
      }
    }
  });

  it("ne met jamais « i » et « l » ensemble : la majuscule « I » ressemble au « l »", () => {
    for (let n = 0; n < 400; n++) {
      const exo = GAME_KINDS["majuscule-minuscule"].make(makeContext("CI", 2, `il:${n}`, undefined, "mots-1"));
      const lefts = (exo.payload.pairs as { left: string }[]).map((p) => p.left);
      expect(lefts.includes("i") && lefts.includes("l"), lefts.join(", ")).toBe(false);
    }
  });
});

describe("les indices ne donnent jamais la réponse", () => {
  it("n'écrit pas la première pièce comme dernière pièce quand elle est la réponse (tata, toto, été)", () => {
    for (const kind of ["syllabe-initiale", "lettre-initiale"] as const) {
      for (let n = 0; n < 200; n++) {
        const exo = GAME_KINDS[kind].make(makeContext("CI", 2, `indice:${kind}:${n}`, undefined, ["mots-1", "mots-3", "mots-4"][n % 3]));
        for (const hint of exo.hints) {
          expect(hint, `${exo.prompt} : ${hint}`).not.toContain(`« ${exo.answerKey} »`);
        }
      }
    }
  });
});

describe("la phrase à trou a de quoi varier au premier palier", () => {
  it("compte au moins trois phrases dont le mot est vu dès le premier palier de lecture", () => {
    const stageOne = SENTENCES.filter((s) => LEXICON.find((e) => e.word === s.word)!.stage === 1);
    expect(stageOne.length).toBeGreaterThanOrEqual(3);
  });
});

describe("les gabarits de nombres recalculent juste, depuis l'énoncé", () => {
  const WORDS = ["zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf", "vingt"];
  const emojiCount = (text: string) => Array.from(text.matchAll(/\p{Extended_Pictographic}/gu)).length;
  const optionsOf = (exo: { payload: Record<string, unknown> }) => exo.payload.options as string[];
  const rightOption = (exo: { payload: Record<string, unknown> }) => optionsOf(exo)[exo.payload.correctIndex as number];
  const draws = [10, 20].flatMap((cap) =>
    LEVELS.flatMap((level) => Array.from({ length: 60 }, (_, n) => ({ cap, level, vocabulary: `nombres-${cap}`, seed: `calc:${cap}:${level}:${n}` }))),
  );
  const make = (kind: GameKind, d: (typeof draws)[number]) => GAME_KINDS[kind].make(makeContext("CI", d.level, `${kind}:${d.seed}`, undefined, d.vocabulary));
  const numbersIn = (text: string) => Array.from(text.matchAll(/\d+/g)).map(Number);

  it("le voisin, le double, la moitié, le complément, le calcul et la dizaine sont ceux de l'énoncé", () => {
    for (const d of draws) {
      const neighbour = make("nombre-voisin", d);
      const [n] = numbersIn(neighbour.prompt);
      expect(Number(rightOption(neighbour)), neighbour.prompt).toBe(/après/.test(neighbour.prompt) ? n + 1 : n - 1);

      const doubleHalf = make("double-moitie", d);
      const [m] = numbersIn(doubleHalf.prompt);
      expect(Number(rightOption(doubleHalf)), doubleHalf.prompt).toBe(/double/.test(doubleHalf.prompt) ? m * 2 : m / 2);

      const complement = make("complement", d);
      const [from, to] = numbersIn(complement.prompt);
      expect(Number(rightOption(complement)), complement.prompt).toBe(to - from);

      const calc = make("calcul-ecrit", d);
      const [a, b] = numbersIn(calc.prompt);
      expect(Number(rightOption(calc)), calc.prompt).toBe(calc.prompt.includes("+") ? a + b : a - b);

      const tens = make("dizaine-unites", d);
      expect(Number(rightOption(tens)), tens.prompt).toBe(numbersIn(tens.prompt)[0] - 10);

      const words = make("nombre-en-lettres", d);
      const written = /« ([^»]+) »/.exec(words.prompt)![1];
      expect(Number(rightOption(words)), words.prompt).toBe(WORDS.indexOf(written));
    }
  });

  it("le plus grand et le plus petit sont bien le plus grand et le plus petit", () => {
    for (const d of draws) {
      const exo = make("nombre-plus-grand", d);
      const options = optionsOf(exo).map(Number);
      expect(new Set(options).size, exo.prompt).toBe(3);
      expect(Number(rightOption(exo)), exo.prompt).toBe(/plus grand/.test(exo.prompt) ? Math.max(...options) : Math.min(...options));
    }
  });

  it("compte les dessins de chaque rangée et de chaque groupe, et range les nombres dans l'ordre demandé", () => {
    for (const d of draws) {
      const rows = make("rangee-plus-moins", d);
      const counts = optionsOf(rows).map(emojiCount);
      expect(new Set(counts).size, rows.prompt).toBe(3);
      expect(emojiCount(rightOption(rows)), rows.prompt).toBe(/le plus/.test(rows.prompt) ? Math.max(...counts) : Math.min(...counts));

      const groups = make("nombre-groupe", d);
      const pairs = groups.payload.pairs as { left: string; right: string }[];
      expect(new Set(pairs.map((p) => p.left)).size, groups.answerKey).toBe(3);
      for (const pair of pairs) expect(emojiCount(pair.right), groups.answerKey).toBe(Number(pair.left));

      const order = make("nombres-ordre", d);
      const sequence = (order.payload.correctSequence as string[]).map(Number);
      expect(new Set(sequence).size, order.prompt).toBe(4);
      const ascending = /petit au plus grand/.test(order.prompt);
      expect(sequence, order.prompt).toEqual([...sequence].sort((x, y) => (ascending ? x - y : y - x)));
    }
  });

  it("une seule option vaut la bonne réponse, et aucun nombre ne dépasse celui de la fiche", () => {
    const qcmKinds = ["nombre-voisin", "nombre-plus-grand", "nombre-en-lettres", "double-moitie", "complement", "calcul-ecrit", "dizaine-unites"] as const;
    for (const d of draws) {
      for (const kind of qcmKinds) {
        const exo = make(kind, d);
        expect(optionsOf(exo).filter((o) => o === exo.answerKey), exo.prompt).toHaveLength(1);
        expect(rightOption(exo), exo.prompt).toBe(exo.answerKey);
        // La dizaine et les unités sont de onze à dix-neuf, quelle que soit la fiche.
        const cap = kind === "dizaine-unites" ? 20 : d.cap;
        for (const n of [...numbersIn(exo.prompt), ...optionsOf(exo).map(Number)]) expect(n, `${exo.prompt} : ${n}`).toBeLessThanOrEqual(cap);
      }
    }
  });

  it("n'écrit jamais un chiffre dans un indice : une réponse de nombre s'y lirait", () => {
    for (const d of draws) {
      for (const kind of ["nombre-voisin", "nombre-plus-grand", "nombre-en-lettres", "double-moitie", "complement", "calcul-ecrit", "dizaine-unites", "nombres-ordre", "nombre-groupe", "rangee-plus-moins"] as const) {
        for (const hint of make(kind, d).hints) expect(hint, `${kind} : ${hint}`).not.toMatch(/\d/);
      }
    }
  });

  it("une suite de nombres de la fiche « jusqu'à 10 » ne dépasse pas 10, et garde son plafond quand on la refait", () => {
    for (let n = 0; n < 200; n++) {
      const suite = GAME_KINDS["suite-nombres"].make(makeContext("CI", ((n % 4) + 1) as GameLevel, `suite:${n}`, undefined, "nombres-10"));
      const shown = (suite.payload.sequence as (string | null)[]).filter((x): x is string => x !== null).map(Number);
      const options = (suite.payload.options as string[]).map(Number);
      for (const value of [...shown, ...options]) expect(value, suite.answerKey).toBeLessThanOrEqual(10);
      expect(gameOriginOf(suite.payload)).toEqual({ kind: "suite-nombres", level: ((n % 4) + 1) as GameLevel, vocabulary: "nombres-10" });
    }
  });
});

describe("les paliers de nombres du CI tiennent leur fiche", () => {
  const TOPICS = [
    { key: "ma-ci-nombres-10", cap: 10 },
    { key: "ma-ci-calcul-10", cap: 10 },
    { key: "ma-ci-nombres-20", cap: 20 },
  ] as const;
  /** Les gabarits qui lisent le plafond de la fiche : sans `vocabulary`, ils retomberaient sur 10 ou sur la classe. */
  const NEEDS_CAP = ["suite-nombres", "nombre-voisin", "nombre-plus-grand", "nombre-en-lettres", "nombres-ordre", "double-moitie", "complement", "calcul-ecrit", "dizaine-unites"];
  const topicOf = (key: string) => allProgrammeEntries().find((e) => e.topic.key === key)!.topic;
  const numbersIn = (text: string) => Array.from(text.matchAll(/\d+/g)).map(Number);
  const palier = (key: string, palierIndex: number, palierCount: number, n: number) =>
    generateGames(topicOf(key).games ?? [], { klass: "CI", palierIndex, palierCount, seed: `fiche:${key}:${palierIndex}:${palierCount}:${n}` });

  it("donne à chaque gabarit de nombres le plafond de sa fiche", () => {
    for (const { key, cap } of TOPICS) {
      for (const spec of topicOf(key).games ?? []) {
        if (NEEDS_CAP.includes(spec.kind)) expect(spec.vocabulary, `${key} : ${spec.kind}`).toBe(`nombres-${cap}`);
      }
    }
  });

  it("ne montre aucun nombre au-delà du plafond de la fiche, ni en énoncé, ni en options, ni en suite", () => {
    for (const { key, cap } of TOPICS) {
      for (const [palierIndex, palierCount] of [[1, 3], [2, 3], [3, 3], [4, 5], [1, 5]] as const) {
        for (let n = 0; n < 80; n++) {
          for (const exo of palier(key, palierIndex, palierCount, n)) {
            const shown = [
              ...numbersIn(exo.prompt),
              ...(Array.isArray(exo.payload.options) ? (exo.payload.options as string[]).flatMap((o) => numbersIn(o)) : []),
              ...(Array.isArray(exo.payload.sequence) ? (exo.payload.sequence as (string | null)[]).flatMap((x) => (x ? numbersIn(x) : [])) : []),
              ...(Array.isArray(exo.payload.pairs) ? (exo.payload.pairs as { left: string }[]).flatMap((p) => numbersIn(p.left)) : []),
              ...(Array.isArray(exo.payload.correctSequence) ? (exo.payload.correctSequence as string[]).flatMap((x) => numbersIn(x)) : []),
            ];
            for (const value of shown) expect(value, `${key} p${palierIndex}/${palierCount} : ${exo.prompt}`).toBeLessThanOrEqual(cap);
          }
        }
      }
    }
  });

  it("garde dans chaque suite de nombres la plage de sa fiche, au moins deux options et une seule bonne réponse par case", () => {
    for (const { key, cap } of TOPICS.filter((t) => t.key !== "ma-ci-calcul-10")) {
      for (const [palierIndex, palierCount] of [[1, 3], [2, 3], [3, 3], [4, 5], [1, 5]] as const) {
        for (let n = 0; n < 150; n++) {
          for (const exo of palier(key, palierIndex, palierCount, n).filter((g) => g.type === "pattern")) {
            const sequence = exo.payload.sequence as (string | null)[];
            const options = exo.payload.options as string[];
            const answers = exo.payload.answers as string[];
            const where = `${key} p${palierIndex}/${palierCount} : ${JSON.stringify(sequence)} ${options.join("/")}`;
            expect(options.length, where).toBeGreaterThanOrEqual(2);
            expect(new Set(options).size, where).toBe(options.length);
            expect(answers.every((answer) => options.includes(answer)), where).toBe(true);
            // Une option qui n'est pas une réponse n'est ni dans la suite montrée, ni une autre réponse.
            for (const option of options.filter((o) => !answers.includes(o))) expect(sequence, where).not.toContain(option);
            const values = [...sequence.filter((x): x is string => x !== null), ...answers].map(Number);
            expect(Math.min(...values), where).toBeGreaterThanOrEqual(cap === 20 ? 10 : 0);
            expect(Math.max(...values), where).toBeLessThanOrEqual(cap);
          }
        }
      }
    }
  });

  it("ne sert jamais deux exercices identiques dans un palier, ni deux suites identiques", () => {
    for (const { key } of TOPICS) {
      for (const [palierIndex, palierCount] of [[1, 3], [2, 3], [3, 3]] as const) {
        for (let n = 0; n < 200; n++) {
          const games = palier(key, palierIndex, palierCount, n);
          const keys = games.map((g) => `${g.prompt}|${JSON.stringify(g.payload.sequence ?? g.payload.pairs ?? g.payload.correctSequence ?? g.payload.options)}`);
          expect(new Set(keys).size, `${key} p${palierIndex} #${n} : ${keys.join(" ## ")}`).toBe(keys.length);
        }
      }
    }
  });

  it("donne à chaque QCM de nombres au moins deux options distinctes, dont une seule vaut la bonne réponse", () => {
    for (const { key } of TOPICS) {
      for (let n = 0; n < 150; n++) {
        for (const exo of palier(key, 2, 3, n).filter((g) => g.type === "qcm")) {
          const options = exo.payload.options as string[];
          expect(options.length, exo.prompt).toBeGreaterThanOrEqual(2);
          expect(new Set(options).size, exo.prompt).toBe(options.length);
          expect(options.filter((o) => o === exo.answerKey), exo.prompt).toHaveLength(1);
        }
      }
    }
  });

  it("compose la dizaine dans « de 11 à 20 » (10 + n, n − 10) sans jamais passer la dizaine", () => {
    for (let n = 0; n < 300; n++) {
      const level = ((n % 4) + 1) as GameLevel;
      const exo = GAME_KINDS["calcul-ecrit"].make(makeContext("CI", level, `compose:${n}`, undefined, "nombres-20"));
      const [a, b] = numbersIn(exo.prompt);
      if (exo.prompt.includes("+")) {
        expect([a, b], exo.prompt).toEqual([10, b]);
        expect(b, exo.prompt).toBeLessThan(10);
        expect(exo.answerKey, exo.prompt).toBe(String(10 + b));
      } else {
        expect(b, exo.prompt).toBe(10);
        expect(a, exo.prompt).toBeGreaterThan(10);
        expect(a, exo.prompt).toBeLessThan(20);
        expect(exo.answerKey, exo.prompt).toBe(String(a - 10));
      }
    }
  });

  it("garde « une dizaine et des unités » entre onze et dix-neuf", () => {
    for (let n = 0; n < 400; n++) {
      const exo = GAME_KINDS["dizaine-unites"].make(makeContext("CI", ((n % 4) + 1) as GameLevel, `dizaine:${n}`, undefined, "nombres-20"));
      const [shown] = numbersIn(exo.prompt);
      expect(shown, exo.prompt).toBeGreaterThanOrEqual(11);
      expect(shown, exo.prompt).toBeLessThanOrEqual(19);
    }
  });

  it("ne propose jamais, dans un dénombrement d'émojis, un mauvais choix au-delà de 10", () => {
    for (const kind of ["compter-emojis", "ajouter-emojis", "enlever-emojis"] as const) {
      for (let n = 0; n < 300; n++) {
        const exo = GAME_KINDS[kind].make(makeContext("CI", ((n % 4) + 1) as GameLevel, `emojis:${kind}:${n}`));
        for (const option of exo.payload.options as string[]) expect(Number(option), exo.prompt).toBeLessThanOrEqual(10);
      }
    }
  });
});

describe("les gabarits de dénombrement comptent juste", () => {
  it("fait compter exactement autant d'émojis que la réponse", () => {
    for (let n = 0; n < 40; n++) {
      const exo = GAME_KINDS["compter-emojis"].make(makeContext("CI", 3, `compte:${n}`));
      expect(emojisIn(exo.prompt), exo.prompt).toBe(Number(exo.answerKey));
      expect(emojisIn(exo.prompt)).toBeLessThanOrEqual(10);
    }
  });

  it("additionne et soustrait les deux rangées", () => {
    for (let n = 0; n < 40; n++) {
      const add = GAME_KINDS["ajouter-emojis"].make(makeContext("CI", 4, `plus:${n}`));
      const [left, right] = add.prompt.split("?")[1].split("+").map(emojisIn);
      expect(left + right, add.prompt).toBe(Number(add.answerKey));

      const less = GAME_KINDS["enlever-emojis"].make(makeContext("CI", 4, `moins:${n}`));
      const [start, removed] = less.prompt.split("?")[1].split("−").map(emojisIn);
      expect(start - removed, less.prompt).toBe(Number(less.answerKey));
      expect(Number(less.answerKey)).toBeGreaterThanOrEqual(1);
    }
  });

  it("ne dépasse pas 5 objets au premier palier", () => {
    for (let n = 0; n < 30; n++) {
      const exo = GAME_KINDS["compter-emojis"].make(makeContext("CI", 1, `petit:${n}`));
      expect(Number(exo.answerKey)).toBeLessThanOrEqual(5);
    }
  });
});

describe("les gabarits dans le programme du CI", () => {
  const entries = allProgrammeEntries().filter((e) =>
    e.topic.games?.some((g) => (TEMPLATES as readonly string[]).includes(g.kind)),
  );

  it("est branché sur huit thématiques du CI", () => {
    expect(entries.map((e) => e.topic.key).sort()).toEqual(
      [
        "fr-ci-alphabet",
        "fr-ci-sons-1",
        "fr-ci-sons-2",
        "fr-ci-sons-3",
        "fr-ci-sons-4",
        "ma-ci-calcul-10",
        "ma-ci-nombres-10",
        "ma-ci-nombres-20",
      ].sort(),
    );
  });

  it("ne demande que des jeux connus, et dix gabarits par palier en lecture et en nombres du CI", () => {
    const withoutModel = [
      "fr-ci-sons-1",
      "fr-ci-sons-2",
      "fr-ci-sons-3",
      "fr-ci-sons-4",
      "fr-ci-alphabet",
      "ma-ci-nombres-10",
      "ma-ci-calcul-10",
      "ma-ci-nombres-20",
    ];
    for (const entry of entries) {
      for (const spec of entry.topic.games ?? []) {
        expect(isGameKind(spec.kind), `${entry.topic.key} : ${spec.kind}`).toBe(true);
      }
      const total = (entry.topic.games ?? []).reduce((sum, spec) => sum + spec.count, 0);
      expect(total, entry.topic.key).toBe(PALIER_SIZE);
    }
    // Toutes les thématiques branchées sur des gabarits sont celles-là : dix gabarits, plus aucun exercice du modèle.
    expect(entries.map((entry) => entry.topic.key).sort()).toEqual([...withoutModel].sort());
  });

  it("fabrique des paliers entiers qui passent le contrôleur", () => {
    for (const entry of entries) {
      for (let palierIndex = 1; palierIndex <= 4; palierIndex++) {
        const games = generateGames(entry.topic.games ?? [], {
          klass: "CI",
          palierIndex,
          palierCount: 4,
          seed: `${entry.topic.key}:${palierIndex}`,
        });
        const subject = entry.topic.key.startsWith("ma-") ? "Mathématiques" : "Français";
        for (const exo of games) {
          const defects = auditExercise({
            type: exo.type,
            prompt: exo.prompt,
            payload: exo.payload,
            answerKey: exo.answerKey,
            hints: exo.hints,
            class: "CI",
            subject,
          });
          expect(defects, `${entry.topic.key} palier ${palierIndex} : ${exo.prompt}`).toEqual([]);
        }
      }
    }
  });
});

describe("refaire un gabarit raté", () => {
  it("garde le vocabulaire et le type dans l'origine du payload", () => {
    const exo = GAME_KINDS["syllabe-initiale"].make(makeContext("CI", 2, "origine", undefined, "mots-2"));
    expect(gameOriginOf(exo.payload)).toEqual({ kind: "syllabe-initiale", level: 2, vocabulary: "mots-2" });
  });

  it("refait le même gabarit, au même vocabulaire, avec une autre graine", () => {
    const origin = { kind: "syllabe-initiale", level: 1, vocabulary: "mots-1" };
    const again = regenerateGame(origin, "CI", "autre graine");
    expect(again?.type).toBe("qcm");
    const word = /« ([^»]+) »/.exec(again!.prompt)![1];
    expect(LEXICON.find((e) => e.word === word)?.stage).toBe(1);
  });
});

describe("marquer à refaire les paliers d'une thématique (pregen:invalidate)", () => {
  const palier = { status: "cached", class: "CI", subjectId: "s1", topicId: "t1" };
  const none = { classes: null, subjects: null, topics: null };

  it("prend un palier en cache quand aucun filtre ne l'écarte", () => {
    expect(shouldInvalidate(palier, none)).toBe(true);
  });

  it("laisse un palier déjà périmé ou en cours de génération", () => {
    expect(shouldInvalidate({ ...palier, status: "stale" }, none)).toBe(false);
    expect(shouldInvalidate({ ...palier, status: "generating" }, none)).toBe(false);
  });

  it("ne vise que les thématiques demandées", () => {
    const topics = new Set(["t1", "t2"]);
    expect(shouldInvalidate(palier, { ...none, topics })).toBe(true);
    expect(shouldInvalidate({ ...palier, topicId: "t9" }, { ...none, topics })).toBe(false);
    // Aucune thématique trouvée pour les clés demandées : rien n'est invalidé, pas tout.
    expect(shouldInvalidate(palier, { ...none, topics: new Set() })).toBe(false);
  });

  it("cumule les filtres de classe, de matière et de thématique", () => {
    const filters = { classes: new Set(["CI"]), subjects: new Set(["s1"]), topics: new Set(["t1"]) };
    expect(shouldInvalidate(palier, filters)).toBe(true);
    expect(shouldInvalidate({ ...palier, class: "CP" }, filters)).toBe(false);
    expect(shouldInvalidate({ ...palier, subjectId: "s2" }, filters)).toBe(false);
  });
});

describe("le résumé de pregen:invalidate", () => {
  it("compte les paliers par thématique en liste, sans nom de champ accentué", () => {
    const summary = countByTopic(["Ajouter et enlever jusqu'à 10", "Les sons a, i, o, l, t", "Ajouter et enlever jusqu'à 10"]);
    expect(summary).toEqual([
      { topic: "Ajouter et enlever jusqu'à 10", paliers: 2 },
      { topic: "Les sons a, i, o, l, t", paliers: 1 },
    ]);
    // Convex refuse un nom de champ hors ASCII : les clés du résumé sont fixes.
    for (const entry of summary) expect(Object.keys(entry)).toEqual(["topic", "paliers"]);
  });

  it("rend une liste vide quand rien n'est touché", () => {
    expect(countByTopic([])).toEqual([]);
  });
});

/** Le mot que chaque exercice fabriqué fait travailler, énoncé ou réponse : de quoi compter les répétitions d'un palier. */
function wordsOfPalier(games: ReturnType<typeof generateGames>): string[] {
  return games.flatMap((game) => {
    const kind = gameOriginOf(game.payload)?.kind;
    if (kind === "mot-syllabe" || kind === "phrase-trou" || kind === "syllabe-manquante" || kind === "lettre-manquante") {
      return [game.answerKey];
    }
    if (kind === "syllabes-ordre" || kind === "lettres-ordre") return [(game.payload.correctSequence as string[]).join("")];
    return /« ([^»]+) »/.exec(game.prompt)?.[1] ?? [];
  });
}

describe("dix gabarits dans un palier : plus aucun exercice du modèle en lecture et en nombres du CI", () => {
  const keys = [
    "fr-ci-sons-1",
    "fr-ci-sons-2",
    "fr-ci-sons-3",
    "fr-ci-sons-4",
    "fr-ci-alphabet",
    "ma-ci-nombres-10",
    "ma-ci-calcul-10",
    "ma-ci-nombres-20",
  ];
  const topicOf = (key: string) => allProgrammeEntries().find((e) => e.topic.key === key)!.topic;

  it("remplit les dix places du palier avec dix gabarits (« mot-syllabe » en fr-ci-sons-2 à 4)", () => {
    for (const key of keys) {
      const specs = topicOf(key).games ?? [];
      expect(gameCount(specs), key).toBe(PALIER_SIZE);
      const wordStart = specs.filter((spec) => spec.kind === "mot-syllabe");
      if (["fr-ci-sons-2", "fr-ci-sons-3", "fr-ci-sons-4"].includes(key)) {
        expect(wordStart, key).toEqual([{ kind: "mot-syllabe", count: 1, vocabulary: `mots-${key.slice(-1)}` }]);
      } else {
        expect(wordStart, key).toEqual([]);
      }
      for (const palierIndex of [1, 2, 3]) {
        const games = generateGames(specs, { klass: "CI", palierIndex, palierCount: 3, seed: `${key}:${palierIndex}` });
        expect(games, `${key} palier ${palierIndex}`).toHaveLength(PALIER_SIZE);
      }
    }
  });

  it("ne demande rien au modèle : zéro exercice à écrire, zéro réserve, aucun palier refusé faute d'exercices valides", () => {
    for (const key of keys) {
      const aiCount = PALIER_SIZE - gameCount(topicOf(key).games);
      expect(aiCount, key).toBe(0);
      expect(exercisesToRequest(aiCount), key).toBe(0);
      // `hasEnoughValidExercises` n'est jamais appelée (le bloc du modèle est sauté), mais elle le tolérerait.
      expect(hasEnoughValidExercises(0, aiCount), key).toBe(true);
    }
  });

  it("annonce ces paliers comme gratuits à la pré-génération, et les autres comme payants", () => {
    for (const key of keys) expect(topicUsesModel(key), key).toBe(false);
    expect(topicUsesModel("ar-ci-grave-aigu")).toBe(false);
    expect(topicUsesModel("ma-ci-mesures")).toBe(true);
    expect(topicUsesModel("ma-ci-problemes")).toBe(true);
    expect(topicUsesModel("fr-ci-phrases")).toBe(true);
    expect(topicUsesModel("hi-cm2-empires")).toBe(true);
    // Sans fiche du programme (thématique faite à la main), le modèle écrit tout.
    expect(topicUsesModel(null)).toBe(true);
    expect(topicUsesModel(undefined)).toBe(true);
    expect(topicUsesModel("inconnue")).toBe(true);
  });

  it("tire un autre exercice quand le contrôleur en refuse un, et abandonne le gabarit après les essais", () => {
    for (const key of keys) {
      const specs = topicOf(key).games ?? [];
      const options = { klass: "CI" as const, palierIndex: 2, palierCount: 3, seed: key };

      // Seuls les types classiques passent par le contrôleur : une suite de nombres (« pattern ») n'y passe pas.
      const classic = specs.filter((spec) => CLASSIC_TYPES.has(GAME_KINDS[spec.kind].type)).reduce((sum, spec) => sum + spec.count, 0);

      // Le premier tirage de chaque gabarit est refusé, le second accepté.
      let calls = 0;
      const retried = generateGames(specs, { ...options, accept: () => ++calls % 2 === 0 });
      expect(retried, key).toHaveLength(PALIER_SIZE);
      expect(calls, key).toBe(2 * classic);

      // Un contrôleur qui refuse tout : aucun gabarit classique servi, le modèle écrirait leurs places.
      calls = 0;
      const none = generateGames(specs, { ...options, accept: () => (calls++, false) });
      expect(none, key).toHaveLength(PALIER_SIZE - classic);
      expect(none.every((game) => !CLASSIC_TYPES.has(game.type)), key).toBe(true);
      expect(calls, key).toBe((TEMPLATE_RETRIES + 1) * classic);

      // Sans refus, les exercices sont ceux d'avant : la première graine est inchangée.
      expect(generateGames(specs, { ...options, accept: () => true }), key).toEqual(generateGames(specs, options));
    }
  });

  it("ne soumet pas au contrôleur les quatre jeux (frise, dessin, écoute, couleurs)", () => {
    const listen = topicOf("ar-ci-grave-aigu");
    let calls = 0;
    const games = generateGames(listen.games ?? [], {
      klass: "CI",
      palierIndex: 1,
      palierCount: 3,
      seed: "ecoute",
      accept: () => (calls++, false),
    });
    expect(games).toHaveLength(PALIER_SIZE);
    expect(calls).toBe(0);
  });

  it("refait un gabarit raté avec le contrôleur, et rend null quand il refuse tous les tirages", () => {
    const origin = { kind: "mot-syllabe", level: 2, vocabulary: "mots-3" };
    const again = regenerateGame(origin, "CI", "reprise", () => true);
    expect(again?.type).toBe("qcm");
    expect(gameOriginOf(again!.payload)).toEqual(origin);
    let calls = 0;
    expect(regenerateGame(origin, "CI", "reprise", () => (calls++, false))).toBeNull();
    expect(calls).toBe(TEMPLATE_RETRIES + 1);
  });

  it("garde ses dix exercices après le filtre de toPersistedShape, comme ceux du modèle (lecture)", () => {
    // Les gabarits de calcul ne passent jamais par ce filtre, qui répare les calculs du modèle (et écarte des
    // sommes d'émojis exactes) : ils passent par le contrôleur `accept`, vérifié par le test précédent.
    for (const key of keys.filter((k) => !k.startsWith("ma-"))) {
      for (const palierIndex of [1, 2, 3]) {
        // Le modèle n'écrit que les types classiques : une suite de nombres (« pattern ») ne passe pas par ce filtre.
        const games = generateGames(topicOf(key).games ?? [], { klass: "CI", palierIndex, palierCount: 3, seed: `${key}:p${palierIndex}` }).filter(
          (game) => CLASSIC_TYPES.has(game.type),
        );
        const raw = games.map((game) => ({
          type: game.type,
          statement: game.prompt,
          payload: game.payload,
          correctAnswer: game.answerKey,
          hints: game.hints,
        }));
        const batch = shapeBatch(raw as Parameters<typeof shapeBatch>[0], { class: "CI", subject: "Français" });
        expect(batch.exos, `${key} palier ${palierIndex}`).toHaveLength(games.length);
        expect(batch.audit.rejected, key).toBe(0);
        expect(batch.audit.warned, key).toBe(0);
      }
    }
  });
});

describe("sept gabarits dans un palier de dix", () => {
  it("demande au modèle deux exercices de réserve, jamais pour un palier tout écrit par lui", () => {
    expect(exercisesToRequest(3)).toBe(3 + SPARE_AI_EXERCISES);
    expect(exercisesToRequest(5)).toBe(7);
    expect(exercisesToRequest(10)).toBe(10);
    expect(exercisesToRequest(0)).toBe(0);
    // Trois sur trois à garder : sans réserve, un exercice écarté ferait échouer le palier.
    expect(hasEnoughValidExercises(2, 3)).toBe(false);
    expect(hasEnoughValidExercises(3, 3)).toBe(true);
  });

  it("varie les mots d'un palier : au plus un mot en double, autant que le vocabulaire l'impose au premier palier", () => {
    // Les mots comptés sont ceux de l'énoncé ET ceux de la réponse (`wordsOfPalier`) : « mot-syllabe »
    // cache son mot dans les options, un trou ne l'écrit pas dans l'énoncé.
    for (const key of ["fr-ci-sons-1", "fr-ci-sons-2", "fr-ci-sons-3", "fr-ci-sons-4", "fr-ci-alphabet"]) {
      const entry = allProgrammeEntries().find((e) => e.topic.key === key)!;
      for (let n = 0; n < 40; n++) {
        for (const palierIndex of [1, 2, 3]) {
          const games = generateGames(entry.topic.games ?? [], { klass: "CI", palierIndex, palierCount: 3, seed: `${key}:${n}:${palierIndex}` });
          const words = wordsOfPalier(games);
          const duplicates = words.length - new Set(words).size;
          // Au premier palier de lecture le vocabulaire n'a que 7 mots pour 10 gabarits : au moins 3 doublons, pas un de plus.
          const stage = stageOf(entry.topic.games?.[0]?.vocabulary);
          const vocabulary = LEXICON.filter((word) => word.stage <= stage).length;
          expect(duplicates, `${key} #${n} palier ${palierIndex} : ${words.join(", ")}`).toBeLessThanOrEqual(
            Math.max(1, words.length - vocabulary),
          );
        }
      }
    }
  });
});
