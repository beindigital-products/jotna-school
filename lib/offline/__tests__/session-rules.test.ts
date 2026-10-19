import { describe, expect, it } from "vitest";
import {
  gradeSession,
  logTimeMs,
  realAttemptsOn,
  rowsForExercise,
  sessionProgress,
  type LocalLogEntry,
} from "../session-rules";
import { computePalierScore, scoreExerciseFromAttempts } from "@/convex/paliers/scoring";
import { summarizePalier } from "@/convex/progressionRules";

const answer = (exerciseId: string, correct: boolean, at = 1, timeSpentMs = 4000): LocalLogEntry => ({
  kind: "answer",
  exerciseId,
  answer: correct ? "ok" : "ko",
  correct,
  at,
  timeSpentMs,
});
const hint = (exerciseId: string, hintIndex: number, at = 1): LocalLogEntry => ({
  kind: "hint",
  exerciseId,
  hintIndex,
  at,
});

const TEN = Array.from({ length: 10 }, (_, i) => `ex${i + 1}`);

describe("les lignes d'essai d'une séance", () => {
  it("numérote les réponses, range les indices en ligne sentinelle, comme le serveur", () => {
    const log = [answer("a", false), hint("a", 0), answer("a", true), answer("b", true)];
    const rows = rowsForExercise(log, "a");
    expect(rows.map((r) => [r.attemptNumber, r.isCorrect, r.hintsUsedCount])).toEqual([
      [1, false, 0],
      [0, false, 1],
      [2, true, 0],
    ]);
    expect(realAttemptsOn(log, "a")).toBe(2);
  });

  it("ignore une sixième réponse, comme la synchronisation qui borne à cinq", () => {
    const log = Array.from({ length: 6 }, () => answer("a", false));
    expect(rowsForExercise(log, "a")).toHaveLength(5);
  });

  it("borne le temps d'un geste à dix minutes", () => {
    expect(logTimeMs([answer("a", true, 1, 3_600_000)])).toBe(600_000);
    expect(logTimeMs([answer("a", true, 1, 1000), answer("b", true, 1, 2000)], 1)).toBe(2000);
  });
});

describe("où en est l'enfant", () => {
  it("reprend au premier exercice ni réussi ni épuisé", () => {
    const log = [
      answer("ex1", true),
      ...Array.from({ length: 5 }, () => answer("ex2", false)),
      answer("ex3", false),
      hint("ex3", 0),
    ];
    const progress = sessionProgress(TEN, log);
    expect(progress.currentIndex).toBe(2);
    expect(progress.completedCount).toBe(2);
    expect(progress.failedAttemptsThisExo).toBe(1);
    expect(progress.hintsUsedThisExo).toBe(1);
    expect(progress.allDone).toBe(false);
  });

  it("dit quand tout est fait", () => {
    const log = TEN.map((id) => answer(id, true));
    expect(sessionProgress(TEN, log).allDone).toBe(true);
    expect(sessionProgress(TEN, []).allDone).toBe(false);
  });
});

describe("la note du palier, sur l'appareil comme sur le serveur", () => {
  it("dix réponses justes du premier coup : validé, trente étoiles", () => {
    const grade = gradeSession(TEN, TEN.map((id) => answer(id, true)));
    expect(grade.status).toBe("validated");
    expect(grade.starsTotal).toBe(30);
    expect(grade.average).toBe(10);
    expect(grade.failedExerciseIds).toEqual([]);
    expect(grade.summary.firstTryCount).toBe(10);
  });

  it("calcule ce que `finishPalierAttempt` calcule depuis les mêmes lignes", () => {
    const log: LocalLogEntry[] = [
      answer("ex1", false),
      hint("ex1", 0),
      answer("ex1", true),
      answer("ex2", true),
      ...Array.from({ length: 5 }, () => answer("ex3", false)),
      hint("ex4", 0),
      hint("ex4", 1),
      answer("ex4", true),
      ...TEN.slice(4).map((id) => answer(id, true)),
    ];
    const grade = gradeSession(TEN, log);

    // Le calcul du serveur, recopié : le total des indices sur le premier essai.
    const rowsPerExercise = TEN.map((id) => rowsForExercise(log, id));
    const scores = rowsPerExercise.map((rows) => {
      const real = rows.filter((r) => r.attemptNumber > 0);
      const hints = rows.reduce((acc, r) => acc + r.hintsUsedCount, 0);
      return scoreExerciseFromAttempts(
        real.map((r, i) => ({ attemptNumber: r.attemptNumber, isCorrect: r.isCorrect, hintsUsedCount: i === 0 ? hints : 0 })),
      ).score;
    });
    const server = computePalierScore({ exerciseScores: scores, exerciseIds: TEN });
    expect(grade.status).toBe(server.status);
    expect(grade.average).toBe(server.average);
    expect(grade.starsTotal).toBe(server.starsTotal);
    expect(grade.failedExerciseIds).toEqual(server.failedExerciseIds);
    expect(grade.summary).toEqual(summarizePalier(rowsPerExercise));
    // ex1 : 2e essai (7) moins un indice = 6 ; ex3 : jamais réussi = 0.
    expect(scores[0]).toBe(6);
    expect(scores[2]).toBe(0);
    expect(grade.failedExerciseIds).toContain("ex3");
  });

  it("un exercice passé sans réponse compte zéro, comme sur le serveur", () => {
    const grade = gradeSession(["a", "b"], [answer("a", true)]);
    expect(grade.average).toBe(5);
    expect(grade.status).toBe("failed");
    expect(grade.failedExerciseIds).toEqual(["b"]);
  });
});
