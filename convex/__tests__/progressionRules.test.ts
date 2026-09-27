import { describe, expect, it } from "vitest";
import {
  EXOS_PER_LEVEL,
  bestStarsByPalier,
  computeLevel,
  exosToNextLevel,
  isFirstTry,
  starsFallback,
  summarizePalier,
  topicProgressFrom,
  totalStarsOf,
  type AttemptRow,
} from "../progressionRules";

const row = (attemptNumber: number, isCorrect: boolean, extra: Partial<AttemptRow> = {}): AttemptRow => ({
  attemptNumber,
  isCorrect,
  hintsUsedCount: 0,
  timeSpentMs: 0,
  submittedAt: 0,
  ...extra,
});
const hint = (): AttemptRow => row(0, false, { hintsUsedCount: 1 });

describe("niveau", () => {
  it("cinquante bonnes réponses par niveau", () => {
    expect(EXOS_PER_LEVEL).toBe(50);
    expect(computeLevel(0)).toBe(1);
    expect(computeLevel(49)).toBe(1);
    expect(computeLevel(50)).toBe(2);
    expect(computeLevel(57)).toBe(2);
    expect(exosToNextLevel(0)).toBe(50);
    expect(exosToNextLevel(57)).toBe(43);
    expect(computeLevel(-3)).toBe(1);
  });
});

describe("summarizePalier", () => {
  it("compte les exercices résolus, du premier coup, sans indice, et les étoiles", () => {
    const summary = summarizePalier([
      [row(1, true, { timeSpentMs: 4000 })],
      [row(1, false), hint(), row(2, true, { timeSpentMs: 9000 })],
      [row(1, false), row(2, false), row(3, true)],
      [row(1, false), row(2, false), row(3, false), row(4, false), row(5, false)],
    ]);
    expect(summary).toEqual({
      exerciseCount: 4,
      correctCount: 3,
      firstTryCount: 1,
      noHintCount: 2,
      hintsUsed: 1,
      // 10 → 3 étoiles, 7 − 1 indice = 6 → 2, 4 → 1, 0 → 0
      starsTotal: 6,
      timeSpentMs: 13000,
      averageScore: (10 + 6 + 4 + 0) / 4,
    });
  });

  it("un palier sans exercice", () => {
    expect(summarizePalier([]).averageScore).toBe(0);
    expect(summarizePalier([]).exerciseCount).toBe(0);
  });

  it("isFirstTry lit la première ligne d'essai, pas les indices", () => {
    expect(isFirstTry([hint(), row(1, true)])).toBe(true);
    expect(isFirstTry([row(2, true), row(1, false)])).toBe(false);
    expect(isFirstTry([hint()])).toBe(false);
  });
});

describe("étoiles", () => {
  it("garde le meilleur score par palier, jamais la somme des rejeux", () => {
    const best = bestStarsByPalier([
      { palierId: "a", status: "validated", starsTotal: 24 },
      { palierId: "a", status: "validated", starsTotal: 30 },
      { palierId: "a", status: "failed", starsTotal: 12 },
      { palierId: "b", status: "failed", starsTotal: 15 },
      { palierId: "c", status: "in_progress", starsTotal: 99 },
    ]);
    expect([...best.entries()]).toEqual([
      ["a", 30],
      ["b", 15],
    ]);
    expect(totalStarsOf([{ palierId: "a", status: "validated", starsTotal: 30 }, { palierId: "b", status: "validated", starsTotal: 27 }])).toBe(57);
  });

  it("une tentative ancienne sans résumé : la moyenne donne l'étoile par exercice", () => {
    expect(starsFallback({ palierId: "a", status: "validated", averageScore: 9.2 })).toBe(30);
    expect(starsFallback({ palierId: "a", status: "validated", averageScore: 7 })).toBe(20);
    expect(starsFallback({ palierId: "a", status: "validated" })).toBe(0);
    expect(starsFallback({ palierId: "a", status: "validated", averageScore: 9, starsTotal: 25 })).toBe(25);
  });
});

describe("topicProgressFrom", () => {
  it("additionne les tentatives finies et garde la meilleure maîtrise validée", () => {
    expect(
      topicProgressFrom([
        { palierId: "a", status: "validated", averageScore: 8.4, exerciseCount: 10, correctCount: 9, hintsUsed: 2 },
        { palierId: "b", status: "failed", averageScore: 5, exerciseCount: 10, correctCount: 6, hintsUsed: 3 },
        { palierId: "b", status: "validated", averageScore: 9, exerciseCount: 9, correctCount: 9, hintsUsed: 0 },
        { palierId: "c", status: "in_progress", exerciseCount: 10, correctCount: 4 },
      ]),
    ).toEqual({ completedExercises: 29, correctExercises: 24, totalHintsUsed: 5, masteryLevel: 90 });
  });

  it("une tentative ancienne sans compteurs ne compte rien mais garde sa maîtrise", () => {
    expect(topicProgressFrom([{ palierId: "a", status: "validated", averageScore: 8 }])).toEqual({
      completedExercises: 0,
      correctExercises: 0,
      totalHintsUsed: 0,
      masteryLevel: 80,
    });
  });
});
