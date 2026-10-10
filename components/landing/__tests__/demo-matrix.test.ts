import { describe, expect, it } from "vitest";

import { VISIBLE_CLASSES } from "@/convex/curriculum";
import { AI_EXERCISE_TYPES, EXERCISE_TYPES, GAME_EXERCISE_TYPES, type ExerciseType } from "@/convex/exerciseTypes";
import { GAME_KINDS, type GameKind } from "@/convex/paliers/games";
import { buildPalierBasePrompt } from "@/convex/paliers/prompts";
import { PROGRAMME } from "@/convex/programme";
import { TYPE_INFO, SUBJECT_PRACTICE } from "../exercise-catalog";
import { LANDING_SUBJECTS } from "../landing-subjects";
import {
  CLASSIC_BY_SUBJECT,
  GAMES_BY_SUBJECT,
  classicTypesFor,
  gamesFor,
  type GameOffer,
} from "../demo/demo-matrix";
import { CLASS_AGES, DEMO_CLASSES } from "../demo/demo-types";

/**
 * LA MATRICE DE LA VITRINE (matière × classe) CONTRE CE QUE L'APPLICATION FAIT :
 * la table écrite à la main ne peut pas s'écarter du programme ni des règles de
 * génération. Les mêmes calculs, refaits ici depuis les sources.
 */

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

/** Les jeux d'une classe, refaits depuis le programme : par type, dans l'ordre où le programme les cite. */
function gamesOfProgramme(subject: (typeof PROGRAMME)[number], klass: (typeof DEMO_CLASSES)[number]): GameOffer[] {
  const offers = new Map<GameOffer["type"], { kind: GameKind; topic: string }[]>();
  for (const topic of subject.classes[klass]) {
    for (const spec of topic.games ?? []) {
      const type = GAME_KINDS[spec.kind].type as GameOffer["type"];
      const options = offers.get(type) ?? [];
      if (!options.some((option) => option.kind === spec.kind)) options.push({ kind: spec.kind, topic: topic.name });
      offers.set(type, options);
    }
  }
  return [...offers].map(([type, options]) => ({ type, options }));
}

describe("la vitrine : les classes", () => {
  it("propose les six classes de l'élémentaire, du CI au CM2", () => {
    expect([...DEMO_CLASSES]).toEqual([...VISIBLE_CLASSES]);
    expect(Object.keys(CLASS_AGES)).toEqual([...DEMO_CLASSES]);
  });
});

describe("la vitrine : les matières et les types", () => {
  it("montre les matières du programme, avec leur nom, dans leur ordre", () => {
    expect(LANDING_SUBJECTS.map((subject) => subject.key)).toEqual(PROGRAMME.map((subject) => subject.key));
    expect(LANDING_SUBJECTS.map((subject) => subject.title)).toEqual(PROGRAMME.map((subject) => subject.name));
  });

  it("dit la pratique de chaque matière", () => {
    expect(Object.keys(SUBJECT_PRACTICE).sort()).toEqual(PROGRAMME.map((subject) => subject.key).sort());
  });

  it("dit chaque type d'exercice du serveur, et rien d'autre", () => {
    expect(Object.keys(TYPE_INFO).sort()).toEqual([...EXERCISE_TYPES].sort());
  });
});

describe("la vitrine : les exercices de chaque classe sont ceux que l'application sait produire", () => {
  for (const subject of PROGRAMME) {
    describe(subject.name, () => {
      it("montre exactement les types que le modèle a le droit d'écrire pour cette matière", () => {
        expect([...CLASSIC_BY_SUBJECT[subject.key]].sort()).toEqual([...authorizedFor(subject.name)].sort());
        for (const type of CLASSIC_BY_SUBJECT[subject.key]) expect(AI_EXERCISE_TYPES).toContain(type);
      });

      for (const klass of DEMO_CLASSES) {
        it(`${klass} : les exercices écrits et les jeux du programme de la classe, rien d'autre`, () => {
          const classic = classicTypesFor(subject.key, klass);
          // Pas de réponse à taper au CI : l'enfant n'écrit pas encore au clavier.
          expect(classic.includes("short-answer")).toBe(klass !== "CI");
          expect(new Set(classic).size).toBe(classic.length);

          const games = gamesFor(subject.key, klass);
          expect(games).toEqual(gamesOfProgramme(subject, klass));
          for (const offer of games) {
            expect(GAME_EXERCISE_TYPES).toContain(offer.type);
            for (const option of offer.options) expect(GAME_KINDS[option.kind].type).toBe(offer.type);
          }
        });
      }
    });
  }

  it("garde la phrase à trous hors des mathématiques : un calcul à trou s'y écrit en réponse courte", () => {
    expect(CLASSIC_BY_SUBJECT.mathematiques).not.toContain("fill-blank");
    expect(CLASSIC_BY_SUBJECT.francais).toContain("fill-blank");
  });

  it("ne promet d'écoute et d'atelier des couleurs qu'à l'éducation artistique", () => {
    for (const subject of PROGRAMME) {
      const types = DEMO_CLASSES.flatMap((klass) => gamesFor(subject.key, klass).map((offer) => offer.type));
      const isArts = subject.key === "education-artistique";
      expect(types.includes("listen")).toBe(isArts);
      expect(types.includes("color-mix")).toBe(isArts);
    }
  });

  it("n'oublie aucun jeu du programme", () => {
    // Chaque jeu que le programme cite, quelque part, est montré quelque part.
    const cited = new Set<GameKind>();
    const shown = new Set<GameKind>();
    for (const subject of PROGRAMME) {
      for (const klass of DEMO_CLASSES) {
        for (const topic of subject.classes[klass]) for (const spec of topic.games ?? []) cited.add(spec.kind);
        for (const offer of gamesFor(subject.key, klass)) for (const option of offer.options) shown.add(option.kind);
      }
    }
    expect([...shown].sort()).toEqual([...cited].sort());
    expect(GAMES_BY_SUBJECT).toBeDefined();
  });
});
