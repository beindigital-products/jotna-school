import { describe, expect, it } from "vitest";
import { auditExercise } from "../paliers/exerciseAudit";
import { verifyAnswer } from "../paliers/exerciseRules";
import { GAME_KINDS, gameOriginOf, generateGames, isGameKind, regenerateGame, type GameKind } from "../paliers/games";
import { makeContext, type GameLevel } from "../paliers/games/shared";
import { LEXICON, stageOf } from "../paliers/games/words";
import { KNOWN_WORDS } from "../paliers/knownWords";
import { shouldInvalidate } from "../paliers/pregen";
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
  "syllabe-mot",
  "mot-image",
  "compter-emojis",
  "ajouter-emojis",
  "enlever-emojis",
] as const satisfies readonly GameKind[];

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
      const subject = kind.includes("emojis") ? "Mathématiques" : "Français";
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

  it("est branché sur sept thématiques du CI", () => {
    expect(entries.map((e) => e.topic.key).sort()).toEqual(
      [
        "fr-ci-alphabet",
        "fr-ci-sons-1",
        "fr-ci-sons-2",
        "fr-ci-sons-3",
        "fr-ci-sons-4",
        "ma-ci-calcul-10",
        "ma-ci-nombres-10",
      ].sort(),
    );
  });

  it("ne demande que des jeux connus, et jamais plus de cinq par palier", () => {
    for (const entry of entries) {
      for (const spec of entry.topic.games ?? []) {
        expect(isGameKind(spec.kind), `${entry.topic.key} : ${spec.kind}`).toBe(true);
      }
      const total = (entry.topic.games ?? []).reduce((sum, spec) => sum + spec.count, 0);
      expect(total, entry.topic.key).toBeLessThanOrEqual(5);
    }
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
