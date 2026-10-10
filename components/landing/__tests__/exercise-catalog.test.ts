import { describe, expect, it } from "vitest";

import {
  AI_EXERCISE_TYPES,
  EXERCISE_TYPES,
  GAME_EXERCISE_TYPES,
  type ExerciseType,
} from "@/convex/exerciseTypes";
import { GAME_KINDS } from "@/convex/paliers/games";
import { buildPalierBasePrompt } from "@/convex/paliers/prompts";
import { PROGRAMME } from "@/convex/programme";
import { CATALOG, TYPE_INFO, type CatalogEntry, type Example } from "../exercise-catalog";
import { LANDING_SUBJECTS } from "../landing-subjects";

const kindsOf = (entries: CatalogEntry[]): ExerciseType[] => entries.map((entry) => entry.example.kind);

/** Les types que le modèle a le droit d'écrire pour une matière : la ligne de sa consigne. */
function authorizedFor(subjectName: string): ExerciseType[] {
  const prompt = buildPalierBasePrompt({
    subject: subjectName,
    topic: "essai",
    class: "CE1",
    palierIndex: 1,
  });
  const line = /Types autorisés : ([^.\n]+)\./.exec(prompt);
  if (!line) throw new Error(`Pas de ligne « Types autorisés » pour ${subjectName}`);
  return line[1].split(",").map((type) => type.trim() as ExerciseType);
}

/** Les types de jeu que le programme demande vraiment, thématique par thématique. */
function gameTypesOf(subject: (typeof PROGRAMME)[number]): ExerciseType[] {
  const types = new Set<ExerciseType>();
  for (const topics of Object.values(subject.classes)) {
    for (const topic of topics) {
      for (const spec of topic.games ?? []) types.add(GAME_KINDS[spec.kind].type);
    }
  }
  return [...types];
}

describe("la vitrine : les matières", () => {
  it("montre les matières du programme, avec leur nom, dans leur ordre", () => {
    expect(LANDING_SUBJECTS.map((subject) => subject.key)).toEqual(PROGRAMME.map((subject) => subject.key));
    expect(LANDING_SUBJECTS.map((subject) => subject.title)).toEqual(PROGRAMME.map((subject) => subject.name));
  });

  it("a un catalogue d'exercices pour chacune", () => {
    expect(Object.keys(CATALOG).sort()).toEqual(LANDING_SUBJECTS.map((subject) => subject.key).sort());
  });

  it("dit chaque type d'exercice du serveur, et rien d'autre", () => {
    expect(Object.keys(TYPE_INFO).sort()).toEqual([...EXERCISE_TYPES].sort());
  });
});

describe("la vitrine : les exercices de chaque matière sont ceux que l'application sait produire", () => {
  for (const subject of PROGRAMME) {
    describe(subject.name, () => {
      const catalog = CATALOG[subject.key];

      it("montre exactement les types que le modèle a le droit d'écrire pour cette matière", () => {
        expect([...kindsOf(catalog.exercises)].sort()).toEqual([...authorizedFor(subject.name)].sort());
        for (const kind of kindsOf(catalog.exercises)) expect(AI_EXERCISE_TYPES).toContain(kind);
      });

      it("montre exactement les jeux que le programme demande à ses thématiques", () => {
        expect([...kindsOf(catalog.games)].sort()).toEqual([...gameTypesOf(subject)].sort());
        for (const kind of kindsOf(catalog.games)) expect(GAME_EXERCISE_TYPES).toContain(kind);
      });

      it("ne montre pas deux fois le même type", () => {
        const kinds = [...kindsOf(catalog.exercises), ...kindsOf(catalog.games)];
        expect(new Set(kinds).size).toBe(kinds.length);
      });
    });
  }

  it("garde la phrase à trous hors des mathématiques : un calcul à trou s'y écrit en réponse courte", () => {
    expect(kindsOf(CATALOG.mathematiques.exercises)).not.toContain("fill-blank");
    expect(kindsOf(CATALOG.francais.exercises)).toContain("fill-blank");
  });

  it("ne promet d'écoute et d'atelier des couleurs qu'à l'éducation artistique", () => {
    for (const subject of PROGRAMME) {
      const games = kindsOf(CATALOG[subject.key].games);
      const isArts = subject.key === "education-artistique";
      expect(games.includes("listen")).toBe(isArts);
      expect(games.includes("color-mix")).toBe(isArts);
    }
  });
});

// ---------------------------------------------------------------------------
// Les exemples joués par les cartes : une faute dans un exemple se verrait.
// ---------------------------------------------------------------------------

const allExamples: { subject: string; example: Example }[] = PROGRAMME.flatMap((subject) =>
  [...CATALOG[subject.key].exercises, ...CATALOG[subject.key].games].map((entry) => ({
    subject: subject.name,
    example: entry.example,
  })),
);

/** « 6 × 7 » ou « 20 ÷ 4 », calculés. */
function calculate(expression: string): number | null {
  const found = /^(\d+) ([×÷]) (\d+)$/.exec(expression.trim());
  if (!found) return null;
  const [, left, sign, right] = found;
  return sign === "×" ? Number(left) * Number(right) : Number(left) / Number(right);
}

describe("la vitrine : les exemples des cartes", () => {
  it("ont une bonne réponse parmi les propositions", () => {
    for (const { subject, example } of allExamples) {
      const label = `${subject} / ${example.kind}`;
      if (example.kind === "qcm") {
        expect(example.options[example.correct], label).toBeDefined();
        expect(new Set(example.options).size, label).toBe(4);
      }
      if (example.kind === "fill-blank") {
        expect(example.options[example.correct], label).toBeDefined();
        expect(new Set(example.options).size, label).toBe(3);
      }
      if (example.kind === "listen") expect(example.options[example.correct], label).toBeDefined();
      if (example.kind === "pattern") {
        expect(example.options, label).toContain(example.answer);
        expect(example.sequence.filter((token) => token === null), label).toHaveLength(1);
      }
    }
  });

  it("ont des étiquettes et des paires distinctes", () => {
    for (const { subject, example } of allExamples) {
      const label = `${subject} / ${example.kind}`;
      if (example.kind === "drag-drop") expect(example.items[0], label).not.toBe(example.items[1]);
      if (example.kind === "match") {
        const sides = example.pairs.flat();
        expect(new Set(sides).size, label).toBe(sides.length);
      }
      if (example.kind === "order") {
        expect(example.items.length, label).toBeGreaterThanOrEqual(3);
        expect(new Set(example.items).size, label).toBe(example.items.length);
      }
    }
  });

  it("sont justes en mathématiques : les calculs tombent juste", () => {
    const { exercises, games } = CATALOG.mathematiques;
    const qcm = exercises.map((entry) => entry.example).find((example) => example.kind === "qcm");
    const short = exercises.map((entry) => entry.example).find((example) => example.kind === "short-answer");
    const match = exercises.map((entry) => entry.example).find((example) => example.kind === "match");
    const order = exercises.map((entry) => entry.example).find((example) => example.kind === "order");
    const pattern = games.map((entry) => entry.example).find((example) => example.kind === "pattern");

    if (qcm?.kind !== "qcm" || short?.kind !== "short-answer" || match?.kind !== "match") throw new Error("exemple absent");
    expect(Number(qcm.options[qcm.correct])).toBe(calculate(qcm.question.replace(/ = \?$/, "")));
    expect(Number(short.answer)).toBe(calculate(short.question.replace(/^Combien font /, "").replace(/ \?$/, "")));
    for (const [left, right] of match.pairs) expect(Number(right)).toBe(calculate(left));

    // Les nombres à ranger le sont du plus petit au plus grand ; la suite garde son pas.
    if (order?.kind !== "order" || pattern?.kind !== "pattern") throw new Error("exemple absent");
    const ranked = order.items.map(Number);
    expect([...ranked].sort((a, b) => a - b)).toEqual(ranked);
    const numbers = pattern.sequence.map((token) => (token === null ? Number(pattern.answer) : Number(token)));
    const steps = new Set(numbers.slice(1).map((value, i) => value - numbers[i]));
    expect(steps.size).toBe(1);
  });

  it("mélangent bleu et jaune pour obtenir du vert, comme l'atelier des couleurs", () => {
    const mix = CATALOG["education-artistique"].games
      .map((entry) => entry.example)
      .find((example) => example.kind === "color-mix");
    if (mix?.kind !== "color-mix") throw new Error("exemple absent");
    expect([mix.a.name, mix.b.name].sort()).toEqual(["bleu", "jaune"]);
    expect(mix.result.name).toBe("vert");
  });
});
