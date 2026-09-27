import { describe, it, expect } from "vitest";
import {
  computeExerciseScore,
  computePalierScore,
  scoreExerciseFromAttempts,
  scoreToStars,
  scoreToStarsSingle,
  PALIER_SIZE,
  PALIER_VALIDATION_THRESHOLD,
  MAX_ATTEMPTS_PER_EXERCISE,
  countRealAttempts,
  attemptsRemainingAfter,
} from "../paliers/scoring";

describe("scoring constants", () => {
  it("PALIER_SIZE locked to 10 (Decision 50)", () =>
    expect(PALIER_SIZE).toBe(10));
  it("threshold 7 (Decision 13)", () =>
    expect(PALIER_VALIDATION_THRESHOLD).toBe(7));
  it("max attempts 5", () => expect(MAX_ATTEMPTS_PER_EXERCISE).toBe(5));
});

describe("computeExerciseScore — base grid (Decision 12)", () => {
  it.each([
    [1, 10],
    [2, 7],
    [3, 4],
    [4, 1],
    [5, 1],
  ])("attempt=%d, 0 hints → %d", (a, exp) =>
    expect(
      computeExerciseScore({
        isCorrect: true,
        correctOnAttempt: a,
        hintsUsedCount: 0,
      }),
    ).toBe(exp),
  );
  it("isCorrect=false → 0", () => {
    expect(
      computeExerciseScore({ isCorrect: false, hintsUsedCount: 0 }),
    ).toBe(0);
    expect(
      computeExerciseScore({ isCorrect: false, hintsUsedCount: 5 }),
    ).toBe(0);
  });
});

describe("computeExerciseScore — hint deduction matrix (Decision 51)", () => {
  it.each<[number, number, number]>([
    [1, 0, 10],
    [1, 1, 9],
    [1, 2, 8],
    [1, 3, 7],
    [2, 0, 7],
    [2, 1, 6],
    [2, 2, 5],
    [2, 3, 4],
    [3, 0, 4],
    [3, 1, 3],
    [3, 2, 2],
    [3, 3, 1],
    [4, 0, 1],
    [4, 1, 0],
    [4, 2, 0],
    [4, 3, 0],
    [5, 0, 1],
    [5, 1, 0],
    [5, 3, 0],
  ])("attempt=%d, hints=%d → %d", (a, h, exp) => {
    expect(
      computeExerciseScore({
        isCorrect: true,
        correctOnAttempt: a,
        hintsUsedCount: h,
      }),
    ).toBe(exp);
  });
  it("never below 0", () =>
    expect(
      computeExerciseScore({
        isCorrect: true,
        correctOnAttempt: 1,
        hintsUsedCount: 999,
      }),
    ).toBe(0));
  it("negative hints clamped to 0", () =>
    expect(
      computeExerciseScore({
        isCorrect: true,
        correctOnAttempt: 1,
        hintsUsedCount: -3,
      }),
    ).toBe(10));
});

describe("computeExerciseScore — defensive clamps", () => {
  it("attempt=0 → 10 (treated as 1)", () =>
    expect(
      computeExerciseScore({
        isCorrect: true,
        correctOnAttempt: 0,
        hintsUsedCount: 0,
      }),
    ).toBe(10));
  it("attempt>5 → 1 (clamped)", () =>
    expect(
      computeExerciseScore({
        isCorrect: true,
        correctOnAttempt: 99,
        hintsUsedCount: 0,
      }),
    ).toBe(1));
  it("undefined attempt defaults to 1", () =>
    expect(
      computeExerciseScore({ isCorrect: true, hintsUsedCount: 0 }),
    ).toBe(10));
});

describe("scoreExerciseFromAttempts", () => {
  it("empty → 0", () =>
    expect(scoreExerciseFromAttempts([])).toEqual({
      score: 0,
      correctOnAttempt: null,
    }));
  it("never correct → 0", () => {
    const r = scoreExerciseFromAttempts([
      { attemptNumber: 1, isCorrect: false, hintsUsedCount: 0 },
      { attemptNumber: 2, isCorrect: false, hintsUsedCount: 1 },
    ]);
    expect(r.score).toBe(0);
    expect(r.correctOnAttempt).toBeNull();
  });
  it("correct on 2 with 1 hint → 6", () => {
    const r = scoreExerciseFromAttempts([
      { attemptNumber: 1, isCorrect: false, hintsUsedCount: 1 },
      { attemptNumber: 2, isCorrect: true, hintsUsedCount: 0 },
    ]);
    expect(r.score).toBe(6);
    expect(r.correctOnAttempt).toBe(2);
  });
  it("unsorted attempts find correct min", () => {
    const r = scoreExerciseFromAttempts([
      { attemptNumber: 3, isCorrect: true, hintsUsedCount: 0 },
      { attemptNumber: 1, isCorrect: false, hintsUsedCount: 0 },
      { attemptNumber: 2, isCorrect: false, hintsUsedCount: 0 },
    ]);
    expect(r.correctOnAttempt).toBe(3);
    expect(r.score).toBe(4);
  });
});

describe("computePalierScore — TDD spec §10", () => {
  const ten = (s: number[]) => {
    if (s.length !== 10) throw new Error("len");
    return s;
  };
  it("10× score 10 → 10 validated", () => {
    const r = computePalierScore({
      exerciseScores: ten([10, 10, 10, 10, 10, 10, 10, 10, 10, 10]),
    });
    expect(r.average).toBe(10);
    expect(r.status).toBe("validated");
    expect(r.starsTotal).toBe(30);
  });
  it("10× score 7 → 7.0 validated (edge)", () => {
    const r = computePalierScore({
      exerciseScores: ten([7, 7, 7, 7, 7, 7, 7, 7, 7, 7]),
    });
    expect(r.average).toBe(7);
    expect(r.status).toBe("validated");
    expect(r.starsTotal).toBe(20);
  });
  it("10× score 6 → 6.0 failed (edge)", () => {
    const r = computePalierScore({
      exerciseScores: ten([6, 6, 6, 6, 6, 6, 6, 6, 6, 6]),
    });
    expect(r.status).toBe("failed");
  });
  it("7×10 + 3×0 → 7.0 validated, 3 failedIds", () => {
    const r = computePalierScore({
      exerciseScores: ten([10, 10, 10, 10, 10, 10, 10, 0, 0, 0]),
      exerciseIds: [
        "e0",
        "e1",
        "e2",
        "e3",
        "e4",
        "e5",
        "e6",
        "e7",
        "e8",
        "e9",
      ],
    });
    expect(r.average).toBe(7);
    expect(r.status).toBe("validated");
    expect(r.failedExerciseIds).toEqual(["e7", "e8", "e9"]);
  });
  it("5×10 + 5×4 → 7.0 validated", () => {
    const r = computePalierScore({
      exerciseScores: ten([10, 10, 10, 10, 10, 4, 4, 4, 4, 4]),
    });
    expect(r.average).toBe(7);
    expect(r.status).toBe("validated");
  });
  it("avg 6.999 → failed", () => {
    const r = computePalierScore({
      exerciseScores: ten([6.99, 7, 7, 7, 7, 7, 7, 7, 7, 7]),
    });
    expect(r.status).toBe("failed");
  });
  it("avg 7.1 → validated", () => {
    const r = computePalierScore({
      exerciseScores: ten([8, 7, 7, 7, 7, 7, 7, 7, 7, 7]),
    });
    expect(r.status).toBe("validated");
  });
  it("all-fail 0 → failed", () => {
    const r = computePalierScore({
      exerciseScores: ten([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
    });
    expect(r.average).toBe(0);
    expect(r.status).toBe("failed");
    expect(r.starsTotal).toBe(0);
  });
});

describe("scoreToStars (Decision 81)", () => {
  it.each([
    [10, 3],
    [9, 3],
    [8, 2],
    [7, 2],
    [6, 2],
    [5, 1],
    [4, 1],
    [3, 1],
    [2, 0],
    [0, 0],
  ])("score %d → %d stars", (s, exp) =>
    expect(scoreToStarsSingle(s)).toBe(exp),
  );
  it("sums per-exo", () => expect(scoreToStars([10, 6, 4, 0])).toBe(6));
});

describe("countRealAttempts / attemptsRemainingAfter — un indice n'est pas un essai", () => {
  const wrong = (n: number) => ({ attemptNumber: n });
  const hint = () => ({ attemptNumber: 0 });

  it("ignore les lignes d'indice", () => {
    expect(countRealAttempts([])).toBe(0);
    expect(countRealAttempts([hint()])).toBe(0);
    expect(countRealAttempts([wrong(1), hint(), wrong(2), hint(), hint()])).toBe(2);
  });

  it("décompte 4, 3, 2, 1, 0 quel que soit le nombre d'indices entre deux essais", () => {
    const rows: { attemptNumber: number }[] = [];
    const seen: number[] = [];
    for (let i = 1; i <= MAX_ATTEMPTS_PER_EXERCISE; i++) {
      const attemptNumber = countRealAttempts(rows) + 1;
      rows.push(wrong(attemptNumber), hint());
      seen.push(attemptsRemainingAfter(attemptNumber));
    }
    expect(seen).toEqual([4, 3, 2, 1, 0]);
  });

  it("jamais négatif", () => expect(attemptsRemainingAfter(9)).toBe(0));
});
