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
  "forme-nom",
  "forme-coins",
  "solide-nom",
  "classer-formes",
  "rangee-position",
  "rangee-ordinal",
  "intrus",
  "appartient",
  "couleur-objet",
  "comparer-mesure",
  "animaux-ordre",
  "moment-journee",
  "jour-voisin",
  "image-compter",
  "image-qui",
  "tableau-case",
  "tableau-nombre",
  "image-donnee",
  "probleme-donnee",
  "donnee-ou-question",
  "probleme-question",
  "donnee-inutile",
  "probleme-inutile",
  // Le temps et l'espace de l'histoire et de la géographie du CI (`games/temps.ts`, `games/espace.ts`).
  "jours-ordre",
  "jour-manquant",
  "jour-ecole-repos",
  "jour-rang",
  "jours-relier",
  "jour-relatif",
  "jour-hier-demain",
  "jour-trou",
  "temps-ordre",
  "activite-moment",
  "moment-ordre",
  "activite-ordre",
  "moment-voisin",
  "activite-moments",
  "cycle-ordre",
  "avant-apres",
  "avant-apres-glisser",
  "grandir-relier",
  "sur-sous",
  "devant-derriere",
  "position-glisser",
  "file-ordre",
  "a-cote",
  "entre",
  "pres-loin",
  "rangee-voisin",
  "doigt-direction",
  "doigt-relier",
  "gauche-droite-glisser",
  "rangee-copie",
  "repere-glisser",
  "repere-qcm",
  "repere-intrus",
  "repere-trajet",
  "grille-position",
  "grille-ligne-colonne",
  "grille-trou",
  "pion-deplacement",
  "grille-glisser",

  // Le français du CI (`games/phrases.ts`, `games/politesse.ts`) : leur matière est « Français ».
  "phrase-ordre",
  "phrase-ecrite",
  "phrase-mots-compter",
  "phrase-mot-place",
  "politesse-situation",
  "politesse-besoin",
  "politesse-relier",
  "politesse-glisser",
  "politesse-trou",
  "politesse-rencontre",

  // L'anglais du CI (`games/anglaisCi.ts`) : leur matière est « Anglais ».
  "animal-mot",
  "animal-francais",
  "animal-relier",
  "animal-glisser",
  "animal-intrus",
  "fruit-mot",
  "fruit-francais",
  "fruit-relier",
  "fruit-glisser",
  "fruit-intrus",
  "couleur-mot",
  "couleur-chose",
  "couleur-francais",
  "couleur-relier",
  "couleur-glisser",
  "couleur-phrase",
  "compte-mot",
  "compte-chiffre",
  "compte-dessins",
  "compte-relier",
  "compte-relier-dessins",
  "compte-ordre",
  "compte-suivant",
  "compte-suite",
  "compte-glisser",
  "salut-francais",
  "salut-dessin",
  "salut-situation",
  "salut-relier",
  "salut-glisser",
  "salut-prenom",
  "salut-trou",
  "salut-trou-dessin",
  "salut-rencontre",

  // L'instruction civique du CI (`games/civique.ts`) : leur matière est « Instruction civique ».
  "civ-situation",
  "civ-glisser",
  "civ-intrus",
  "civ-relier",
  "civ-ordre",
  "civ-trou",
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
  "forme-nom",
  "forme-coins",
  "solide-nom",
  "classer-formes",
  "rangee-position",
  "rangee-ordinal",
  "intrus",
  "appartient",
  "couleur-objet",
  "comparer-mesure",
  "animaux-ordre",
  "moment-journee",
  "jour-voisin",
  "image-compter",
  "image-qui",
  "tableau-case",
  "tableau-nombre",
  "image-donnee",
  "probleme-donnee",
  "donnee-ou-question",
  "probleme-question",
  "donnee-inutile",
  "probleme-inutile",
]);

/** Les gabarits du temps (`games/temps.ts`) : leur matière est « Histoire ». */
const HISTORY_KINDS = new Set<string>([
  "jours-ordre",
  "jour-manquant",
  "jour-ecole-repos",
  "jour-rang",
  "jours-relier",
  "jour-relatif",
  "jour-hier-demain",
  "jour-trou",
  "temps-ordre",
  "activite-moment",
  "moment-ordre",
  "activite-ordre",
  "moment-voisin",
  "activite-moments",
  "cycle-ordre",
  "avant-apres",
  "avant-apres-glisser",
  "grandir-relier",
]);

/** Les gabarits de l'espace (`games/espace.ts`) : leur matière est « Géographie ». */
const GEOGRAPHY_KINDS = new Set<string>([
  "sur-sous",
  "devant-derriere",
  "position-glisser",
  "file-ordre",
  "a-cote",
  "entre",
  "pres-loin",
  "rangee-voisin",
  "doigt-direction",
  "doigt-relier",
  "gauche-droite-glisser",
  "rangee-copie",
  "repere-glisser",
  "repere-qcm",
  "repere-intrus",
  "repere-trajet",
  "grille-position",
  "grille-ligne-colonne",
  "grille-trou",
  "pion-deplacement",
  "grille-glisser",
]);

/** Les gabarits de l'anglais du CI (`games/anglaisCi.ts`) : leur matière est « Anglais ». */
const ENGLISH_KINDS = new Set<string>([
  "animal-mot",
  "animal-francais",
  "animal-relier",
  "animal-glisser",
  "animal-intrus",
  "fruit-mot",
  "fruit-francais",
  "fruit-relier",
  "fruit-glisser",
  "fruit-intrus",
  "couleur-mot",
  "couleur-chose",
  "couleur-francais",
  "couleur-relier",
  "couleur-glisser",
  "couleur-phrase",
  "compte-mot",
  "compte-chiffre",
  "compte-dessins",
  "compte-relier",
  "compte-relier-dessins",
  "compte-ordre",
  "compte-suivant",
  "compte-suite",
  "compte-glisser",
  "salut-francais",
  "salut-dessin",
  "salut-situation",
  "salut-relier",
  "salut-glisser",
  "salut-prenom",
  "salut-trou",
  "salut-trou-dessin",
  "salut-rencontre",
]);

/** Les gabarits de l'instruction civique du CI (`games/civique.ts`) : leur matière est « Instruction civique ». */
const CIVICS_KINDS = new Set<string>(["civ-situation", "civ-glisser", "civ-intrus", "civ-relier", "civ-ordre", "civ-trou"]);

/** La matière que le contrôleur reçoit pour un gabarit : celle de la thématique qui le demande. */
const subjectOfKind = (kind: string) =>
  MATH_KINDS.has(kind)
    ? "Mathématiques"
    : HISTORY_KINDS.has(kind)
      ? "Histoire"
      : GEOGRAPHY_KINDS.has(kind)
        ? "Géographie"
        : ENGLISH_KINDS.has(kind)
          ? "Anglais"
          : CIVICS_KINDS.has(kind)
            ? "Instruction civique"
            : "Français";

/** La matière d'une thématique du programme, lue sur le préfixe de sa clé. */
const subjectOfTopic = (key: string) =>
  key.startsWith("ma-")
    ? "Mathématiques"
    : key.startsWith("hi-")
      ? "Histoire"
      : key.startsWith("ge-")
        ? "Géographie"
        : key.startsWith("an-")
          ? "Anglais"
          : key.startsWith("ci-")
            ? "Instruction civique"
            : "Français";

const CLASSIC_TYPES = new Set<string>(["qcm", "order", "match", "drag-drop", "fill-blank"]);

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
    case "drag-drop":
      return JSON.stringify(Object.fromEntries((p.items as { text: string; correctZone: string }[]).map((item) => [item.text, item.correctZone])));
    case "short-answer":
      return String((p.acceptedAnswers as string[])[0]);
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
      const subject = subjectOfKind(kind);
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
          // Deux QCM aux mêmes choix dans un autre ordre sont le même exercice : les choix sont triés.
          const keys = games.map((g) => {
            const content = g.payload.sequence ?? g.payload.pairs ?? g.payload.correctSequence ?? g.payload.options;
            return `${g.prompt}|${Array.isArray(content) && g.type !== "pattern" ? JSON.stringify([...content].map((x) => JSON.stringify(x)).sort()) : JSON.stringify(content)}`;
          });
          expect(new Set(keys).size, `${key} p${palierIndex} #${n} : ${keys.join(" ## ")}`).toBe(keys.length);
          // ... et la même question n'est jamais reposée avec d'autres mauvais choix (énoncé + bonne réponse).
          const questions = games.filter((g) => g.type === "qcm").map((g) => `${g.prompt}|${g.answerKey}`);
          expect(new Set(questions).size, `${key} p${palierIndex} #${n} : ${questions.join(" ## ")}`).toBe(questions.length);
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

describe("les gabarits de géométrie, de tri et de mesure recalculent juste, depuis une table de faits écrite à part", () => {
  const SHAPE_OF: Record<string, string> = { "⬛": "carré", "⬜": "carré", "🔲": "carré", "🔳": "carré", "🔴": "rond", "🔵": "rond", "⚫": "rond", "⚪": "rond", "🔺": "triangle", "🔻": "triangle" };
  const SOLID_OF: Record<string, string> = { "🎲": "cube", "🧱": "pavé", "🥫": "cylindre", "🧻": "cylindre", "🔋": "cylindre", "⚽": "boule", "🏀": "boule", "⚾": "boule", "🎾": "boule" };
  const FAMILY_OF: Record<string, string> = {
    ...Object.fromEntries(["🥭", "🍌", "🍉", "🍍", "🍎", "🍊", "🍋"].map((e) => [e, "fruit"])),
    ...Object.fromEntries(["🐔", "🐑", "🐄", "🐟", "🐈", "🐕", "🐘", "🦒"].map((e) => [e, "animal"])),
    ...Object.fromEntries(["👗", "👕", "👖", "👒", "🧦"].map((e) => [e, "vêtement"])),
    ...Object.fromEntries(["🚗", "🚌", "🚲", "⛵", "🛵"].map((e) => [e, "véhicule"])),
    ...Object.fromEntries(["📏", "📚", "🎒", "📒"].map((e) => [e, "école"])),
  };
  const COLOR_OF: Record<string, string> = { "🍎": "rouge", "🍓": "rouge", "🍅": "rouge", "🍌": "jaune", "🍋": "jaune", "🥒": "vert", "🥦": "vert", "🍊": "orange", "🥕": "orange", "🍆": "violet" };
  const WEIGHT_RANK: Record<string, number> = { "🐜": 0, "🐭": 1, "🐔": 2, "🐕": 3, "🐑": 4, "🐄": 5, "🐘": 6 };
  const SIZE_RANK: Record<string, number> = { "🐜": 0, "🐭": 1, "🐔": 2, "🐕": 3, "🐄": 4, "🦒": 5 };
  const DAYS_ORDER = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
  const MOMENT_OF_CLUE: [string, string][] = [
    ["se lève", "le matin"], ["coq chante", "le matin"], ["tout en haut du ciel", "midi"], ["haut et il fait très chaud", "midi"],
    ["se couche", "le soir"], ["rentrent à la maison", "le soir"], ["tout noir et tout le monde dort", "la nuit"], ["lune brille", "la nuit"],
  ];

  const pictographs = (text: string) => Array.from(text.matchAll(/\p{Extended_Pictographic}/gu)).map((m) => m[0]);
  const optionsOf = (exo: { payload: Record<string, unknown> }) => exo.payload.options as string[];
  const rightOption = (exo: { payload: Record<string, unknown> }) => optionsOf(exo)[exo.payload.correctIndex as number];
  const emojiOfOption = (option: string) => pictographs(option)[0];
  const draws = LEVELS.flatMap((level) => Array.from({ length: 80 }, (_, n) => ({ level, seed: `fait:${level}:${n}` })));
  const make = (kind: GameKind, d: (typeof draws)[number]) => GAME_KINDS[kind].make(makeContext("CI", d.level, `${kind}:${d.seed}`));
  const ARTICLE = (word: string) => (word === "boule" ? "la boule" : `le ${word}`);

  it("le nom d'une forme, ses coins et le nom d'un solide sont ceux de l'objet dessiné", () => {
    const CORNERS: Record<string, number> = { carré: 4, rectangle: 4, triangle: 3, rond: 0 };
    for (const d of draws) {
      const name = make("forme-nom", d);
      const shape = SHAPE_OF[pictographs(name.prompt)[0]];
      expect(rightOption(name), name.prompt).toBe(`le ${shape}`);
      expect(new Set(optionsOf(name)).size, name.prompt).toBe(3);
      // Un carré est un rectangle particulier : « rectangle » ne se propose jamais pour lui.
      if (shape === "carré") expect(optionsOf(name).join(), name.prompt).not.toContain("rectangle");

      const corners = make("forme-coins", d);
      const form = /a un (\p{L}+) \?/u.exec(corners.prompt)![1];
      expect(Number(rightOption(corners)), corners.prompt).toBe(CORNERS[form]);
      expect(new Set(optionsOf(corners)).size, corners.prompt).toBe(3);

      const solid = make("solide-nom", d);
      const kind = SOLID_OF[pictographs(solid.prompt)[0]];
      expect(rightOption(solid), solid.prompt).toBe(ARTICLE(kind));
      expect(new Set(optionsOf(solid)).size, solid.prompt).toBe(3);
      // Un cube est un pavé particulier : ni « le pavé » pour le dé, ni « le cube » pour la brique.
      if (kind === "cube") expect(optionsOf(solid).join(), solid.prompt).not.toContain("pavé");
      if (kind === "pavé") expect(optionsOf(solid).join(), solid.prompt).not.toContain("cube");
    }
  });

  it("classe chaque forme dans la case de son nom, et aucune case n'est vide", () => {
    const PLURAL: Record<string, string> = { carré: "Carrés", rond: "Ronds", triangle: "Triangles" };
    for (const d of draws) {
      const exo = make("classer-formes", d);
      const items = exo.payload.items as { text: string; correctZone: string }[];
      const zones = exo.payload.zones as string[];
      expect(new Set(items.map((item) => item.text)).size, exo.answerKey).toBe(items.length);
      for (const item of items) expect(item.correctZone, item.text).toBe(PLURAL[SHAPE_OF[item.text]]);
      for (const zone of zones) expect(items.some((item) => item.correctZone === zone), `${zone} : ${exo.answerKey}`).toBe(true);
      expect(new Set(zones).size).toBe(zones.length);
      expect(zones.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("repère le bon dessin dans une rangée : gauche, droite, milieu, entre, et le rang", () => {
    const RANK: Record<string, number> = { premier: 0, deuxième: 1, troisième: 2, dernier: 3 };
    for (const d of draws) {
      const position = make("rangee-position", d);
      const row = pictographs(/Regarde la rangée (.*?)\. /u.exec(position.prompt)![1]);
      expect(new Set(row).size, position.prompt).toBe(3);
      // « Lequel » et non « Qui » (un fruit n'est pas quelqu'un), et plus de « entre » (la voix de Pio ne dit pas les émojis).
      expect(position.prompt, position.prompt).toMatch(/Lequel est (à gauche|à droite|au milieu) \?$/);
      if (d.level === 1) expect(position.prompt, position.prompt).not.toContain("au milieu");
      const target = /à gauche/.test(position.prompt) ? row[0] : /à droite/.test(position.prompt) ? row[2] : row[1];
      expect(emojiOfOption(rightOption(position)), position.prompt).toBe(target);
      expect(optionsOf(position).map(emojiOfOption).sort(), position.prompt).toEqual([...row].sort());

      const ordinal = make("rangee-ordinal", d);
      const row4 = pictographs(/Regarde la rangée (.*?)\. /u.exec(ordinal.prompt)![1]);
      expect(row4.length, ordinal.prompt).toBe(d.level === 1 ? 3 : 4);
      expect(new Set(row4).size, ordinal.prompt).toBe(row4.length);
      expect(ordinal.prompt, ordinal.prompt).toMatch(/^Regarde la rangée .*\. Lequel est le \p{L}+, en lisant de gauche à droite \?$/u);
      const word = /le (premier|deuxième|troisième|dernier),/u.exec(ordinal.prompt)![1];
      const rank = word === "dernier" ? row4.length - 1 : RANK[word];
      expect(emojiOfOption(rightOption(ordinal)), ordinal.prompt).toBe(row4[rank]);
      expect(optionsOf(ordinal).map(emojiOfOption).sort(), ordinal.prompt).toEqual([...row4].sort());
    }
  });

  it("l'intrus est le seul d'une autre famille, « est-ce un fruit ? » dit la vérité, la couleur est celle du dessin", () => {
    const QUESTION: Record<string, string> = { "un fruit": "fruit", "un animal": "animal", "un vêtement": "vêtement", "un véhicule": "véhicule", "un objet de l'école": "école" };
    for (const d of draws) {
      const odd = make("intrus", d);
      const families = optionsOf(odd).map((option) => FAMILY_OF[emojiOfOption(option)]);
      const odds = optionsOf(odd).filter((_, i) => families.filter((f) => f === families[i]).length === 1);
      expect(odds, odd.prompt).toHaveLength(1);
      expect(rightOption(odd), odd.prompt).toBe(odds[0]);
      expect(new Set(families).size, odd.prompt).toBe(2);
      expect(families.length, odd.prompt).toBe(d.level >= 3 ? 5 : 4);

      const belongs = make("appartient", d);
      const asked = QUESTION[/Est-ce (.*?) \?/u.exec(belongs.prompt)![1]];
      expect(rightOption(belongs), belongs.prompt).toBe(FAMILY_OF[pictographs(belongs.prompt)[0]] === asked ? "Oui" : "Non");
      expect(new Set(optionsOf(belongs)).size).toBe(2);

      const color = make("couleur-objet", d);
      const wanted = /Qu'est-ce qui est (\p{L}+) \?/u.exec(color.prompt)![1];
      const colors = optionsOf(color).map((option) => COLOR_OF[emojiOfOption(option)]);
      expect(COLOR_OF[emojiOfOption(rightOption(color))], color.prompt).toBe(wanted);
      expect(colors.filter((c) => c === wanted), color.prompt).toHaveLength(1);
      expect(new Set(colors).size, color.prompt).toBe(colors.length);
      expect(colors.length, color.prompt).toBe(d.level >= 3 ? 4 : 3);
      // Le nom de la couleur n'est jamais un des mots du choix : « l'orange » ne répond pas à « orange ».
      for (const option of optionsOf(color)) expect(option.toLowerCase(), color.prompt).not.toContain(wanted);
    }
  });

  it("le plus lourd, le plus léger, le plus grand, le plus petit et le rangement suivent les rangs, espacés d'au moins deux crans", () => {
    const spaced = (ranks: number[]) => [...ranks].sort((a, b) => a - b).every((r, i, all) => i === 0 || r - all[i - 1] >= 2);
    for (const d of draws) {
      const exo = make("comparer-mesure", d);
      const adjective = /le plus (\p{L}+) \?/u.exec(exo.prompt)![1];
      const rankOf = adjective === "lourd" || adjective === "léger" ? WEIGHT_RANK : SIZE_RANK;
      const ranks = optionsOf(exo).map((option) => rankOf[emojiOfOption(option)]);
      expect(ranks.every((r) => r !== undefined), exo.prompt).toBe(true);
      expect(spaced(ranks), `${exo.prompt} ${optionsOf(exo).join(", ")}`).toBe(true);
      // Premier palier : deux animaux très différents (trois crans) ; ensuite trois, espacés de deux crans.
      expect(ranks.length, exo.prompt).toBe(d.level === 1 ? 2 : 3);
      if (d.level === 1) expect(Math.abs(ranks[0] - ranks[1]), exo.prompt).toBeGreaterThanOrEqual(3);
      const chosen = rankOf[emojiOfOption(rightOption(exo))];
      expect(chosen, exo.prompt).toBe(adjective === "lourd" || adjective === "grand" ? Math.max(...ranks) : Math.min(...ranks));

      const order = make("animaux-ordre", d);
      expect(["Mets ces animaux dans l'ordre, du plus petit au plus grand.", "Mets ces animaux dans l'ordre, du plus léger au plus lourd."], order.prompt).toContain(order.prompt);
      const sequence = (order.payload.correctSequence as string[]).map((item) => rankOf2(order.prompt)[emojiOfOption(item)]);
      expect(sequence.every((r) => r !== undefined), order.prompt).toBe(true);
      expect(sequence, order.prompt).toEqual([...sequence].sort((a, b) => a - b));
      expect(spaced(sequence), order.prompt).toBe(true);
    }
    function rankOf2(prompt: string) {
      return /léger/.test(prompt) ? WEIGHT_RANK : SIZE_RANK;
    }
  });

  it("le moment de la journée va avec l'indice, le jour voisin est celui de la semaine", () => {
    for (const d of draws) {
      const moment = make("moment-journee", d);
      const expected = MOMENT_OF_CLUE.filter(([clue]) => moment.prompt.includes(clue)).map(([, label]) => label);
      expect(new Set(expected).size, moment.prompt).toBe(1);
      expect(rightOption(moment), moment.prompt).toBe(expected[0]);
      expect(new Set(optionsOf(moment)).size, moment.prompt).toBe(3);
      // Le soir et la nuit ne se proposent jamais ensemble, et l'énoncé n'écrit jamais le nom d'un autre moment.
      expect(optionsOf(moment).includes("le soir") && optionsOf(moment).includes("la nuit"), moment.prompt).toBe(false);
      for (const label of ["le matin", "midi", "le soir", "la nuit"]) {
        if (label !== expected[0]) expect(moment.prompt.toLowerCase(), moment.prompt).not.toContain(label.replace(/^l[ea] /, ""));
      }

      const day = make("jour-voisin", d);
      const [, which, name] = /juste (après|avant) (\p{L}+) \?/u.exec(day.prompt)!;
      const i = DAYS_ORDER.indexOf(name);
      expect(rightOption(day), day.prompt).toBe(DAYS_ORDER[(i + (which === "après" ? 1 : 6)) % 7]);
      expect(optionsOf(day), day.prompt).not.toContain(name);
      if (d.level === 1) expect(which, day.prompt).toBe("après");
      expect(new Set(optionsOf(day)).size, day.prompt).toBe(3);
    }
  });
});

describe("les gabarits de géométrie, de tri et de mesure : libellés, indices, équilibre des réponses", () => {
  /** Ce que l'enfant lit sous chaque dessin : écrit à part de `things.ts`, pour attraper un nom qui contredit l'image. */
  const LABEL_OF: Record<string, string> = {
    "🥭": "la mangue", "🍌": "la banane", "🍉": "la pastèque", "🍍": "l'ananas", "🍎": "la pomme", "🍊": "l'orange", "🍋": "le citron",
    "🐔": "la poule", "🐑": "le mouton", "🐄": "la vache", "🐟": "le poisson", "🐈": "le chat", "🐕": "le chien", "🐘": "l'éléphant", "🦒": "la girafe",
    "👗": "la robe", "👕": "le tee-shirt", "👖": "le pantalon", "👒": "le chapeau", "🧦": "la chaussette",
    "🚗": "la voiture", "🚌": "le bus", "🚲": "le vélo", "⛵": "le bateau", "🛵": "le scooter",
    "📏": "la règle", "📚": "les livres", "🎒": "le cartable", "📒": "le cahier",
    "🍓": "la fraise", "🍅": "la tomate", "🥒": "le concombre", "🥦": "le brocoli", "🥕": "la carotte", "🍆": "l'aubergine",
    "🐜": "la fourmi", "🐭": "la souris",
  };
  const draws = LEVELS.flatMap((level) => Array.from({ length: 80 }, (_, n) => ({ level, seed: `lib:${level}:${n}` })));
  const make = (kind: GameKind, d: (typeof draws)[number]) => GAME_KINDS[kind].make(makeContext("CI", d.level, `${kind}:${d.seed}`));
  const KINDS = ["rangee-position", "rangee-ordinal", "intrus", "couleur-objet", "comparer-mesure"] as const;

  it("écrit sous chaque dessin le nom qui lui va", () => {
    for (const d of draws) {
      for (const kind of KINDS) {
        const exo = make(kind, d);
        for (const option of exo.payload.options as string[]) {
          const [emoji, ...rest] = option.split(" ");
          expect(rest.join(" "), `${kind} : ${option}`).toBe(LABEL_OF[emoji]);
        }
      }
      for (const option of make("animaux-ordre", d).payload.correctSequence as string[]) {
        const [emoji, ...rest] = option.split(" ");
        expect(rest.join(" "), option).toBe(LABEL_OF[emoji]);
      }
    }
  });

  it("n'écrit dans aucun indice le nom de la bonne réponse", () => {
    const ALL = ["rangee-position", "rangee-ordinal", "intrus", "appartient", "couleur-objet", "comparer-mesure", "animaux-ordre", "moment-journee", "jour-voisin", "forme-nom", "forme-coins", "solide-nom", "classer-formes"] as const;
    for (const d of draws) {
      for (const kind of ALL) {
        const exo = make(kind, d);
        // Le nom sans l'article (« poule », « carré », « mardi ») et l'émoji de la bonne réponse.
        const words = exo.answerKey
          .replace(/\p{Extended_Pictographic}/gu, "")
          .split(/[,;→]/)
          .flatMap((part) => part.trim().replace(/^(le|la|les|l')\s*/u, "").split(" "))
          .filter((word) => word.length >= 4);
        for (const hint of exo.hints) {
          for (const word of words) expect(hint.toLowerCase(), `${kind} : ${hint}`).not.toContain(word.toLowerCase());
        }
      }
    }
  });

  it("ne met pas toujours la bonne réponse au même endroit, et mélange Oui et Non", () => {
    for (const kind of ["rangee-position", "intrus", "comparer-mesure", "moment-journee", "jour-voisin"] as const) {
      const positions = new Set<number>();
      for (const d of draws) positions.add(make(kind, d).payload.correctIndex as number);
      expect(positions.size, kind).toBeGreaterThanOrEqual(2);
    }
    let yes = 0;
    for (const d of draws) if (make("appartient", d).answerKey === "Oui") yes++;
    expect(yes / draws.length).toBeGreaterThan(0.3);
    expect(yes / draws.length).toBeLessThan(0.7);
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
  // Le CI seulement : les thématiques du CP qui empruntent un gabarit du CI sont jugées à leur classe
  // (`cpHistoryGeographyTemplates.test.ts`), avec la consigne et le contrôleur du CP.
  const entries = allProgrammeEntries().filter(
    (e) => e.klass === "CI" && e.topic.games?.some((g) => (TEMPLATES as readonly string[]).includes(g.kind)),
  );

  it("est branché sur trente-deux thématiques du CI", () => {
    expect(entries.map((e) => e.topic.key).sort()).toEqual(
      [
        "fr-ci-alphabet",
        "fr-ci-phrases",
        "fr-ci-politesse",
        "fr-ci-sons-1",
        "fr-ci-sons-2",
        "fr-ci-sons-3",
        "fr-ci-sons-4",
        "ma-ci-calcul-10",
        "ma-ci-nombres-10",
        "ma-ci-nombres-20",
        "ma-ci-trier",
        "ma-ci-espace",
        "ma-ci-formes",
        "ma-ci-mesures",
        "ma-ci-problemes",
        "hi-ci-journee",
        "hi-ci-ordre",
        "hi-ci-hier-demain",
        "hi-ci-semaine",
        "ge-ci-position",
        "ge-ci-lateralite",
        "ge-ci-reperes",
        "ge-ci-quadrillage",
        "an-ci-hello",
        "an-ci-colours",
        "an-ci-numbers",
        "an-ci-animals",
        "an-ci-fruits",
        "ci-ci-politesse",
        "ci-ci-ecole",
        "ci-ci-entraide",
        "ci-ci-route",
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
      "fr-ci-phrases",
      "fr-ci-politesse",
      "ma-ci-nombres-10",
      "ma-ci-calcul-10",
      "ma-ci-nombres-20",
      "ma-ci-trier",
      "ma-ci-espace",
      "ma-ci-formes",
      "ma-ci-mesures",
      "ma-ci-problemes",
      "hi-ci-journee",
      "hi-ci-ordre",
      "hi-ci-hier-demain",
      "hi-ci-semaine",
      "ge-ci-position",
      "ge-ci-lateralite",
      "ge-ci-reperes",
      "ge-ci-quadrillage",
      "an-ci-hello",
      "an-ci-colours",
      "an-ci-numbers",
      "an-ci-animals",
      "an-ci-fruits",
      "ci-ci-politesse",
      "ci-ci-ecole",
      "ci-ci-entraide",
      "ci-ci-route",
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
        const subject = subjectOfTopic(entry.topic.key);
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
    "fr-ci-phrases",
    "fr-ci-politesse",
    "ma-ci-nombres-10",
    "ma-ci-calcul-10",
    "ma-ci-nombres-20",
    "ma-ci-trier",
    "ma-ci-espace",
    "ma-ci-formes",
    "ma-ci-mesures",
    "ma-ci-problemes",
    "hi-ci-journee",
    "hi-ci-ordre",
    "hi-ci-hier-demain",
    "hi-ci-semaine",
    "ge-ci-position",
    "ge-ci-lateralite",
    "ge-ci-reperes",
    "ge-ci-quadrillage",
    "an-ci-hello",
    "an-ci-colours",
    "an-ci-numbers",
    "an-ci-animals",
    "an-ci-fruits",
    "ci-ci-politesse",
    "ci-ci-ecole",
    "ci-ci-entraide",
    "ci-ci-route",
    "sc-ci-milieu",
    "sc-ci-animaux",
    "sc-ci-plantes",
    "sc-ci-hygiene",
    "sc-ci-outils",
    "ar-ci-couleurs",
    "ar-ci-formes",
    "ar-ci-frises",
    "ar-ci-mimes",
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
    // Tout le CI, tout le CP et tout le CE1 sont faits par le code : l'exemple d'une thématique écrite par le modèle vient de l'anglais du CM1.
    expect(topicUsesModel("ma-ce1-mesures")).toBe(false);
    expect(topicUsesModel("ar-ci-mimes")).toBe(false);
    expect(topicUsesModel("an-cm1-present-simple")).toBe(true);
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
        const batch = shapeBatch(raw as Parameters<typeof shapeBatch>[0], { class: "CI", subject: subjectOfTopic(key) });
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
