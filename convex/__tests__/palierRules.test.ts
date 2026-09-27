import { describe, expect, it } from "vitest";
import {
  DEFAULT_PALIERS_BY_CLASS,
  FALLBACK_PALIER_COUNT,
  MAX_PALIERS_PER_TOPIC,
  defaultPalierCount,
  difficultyStage,
  effectivePalierCount,
  exercisesForTopic,
  isTopicComplete,
  isValidPalierCount,
  nextPalierIndex,
  resolvePalierStatuses,
} from "../palierRules";
import { PALIER_SIZE } from "../paliers/scoring";

describe("nombre de paliers par thématique", () => {
  it("suit le niveau : 3 en CI/CP, 4 en CE, 5 en CM", () => {
    expect(defaultPalierCount("CI")).toBe(3);
    expect(defaultPalierCount("CP")).toBe(3);
    expect(defaultPalierCount("CE1")).toBe(4);
    expect(defaultPalierCount("CE2")).toBe(4);
    expect(defaultPalierCount("CM1")).toBe(5);
    expect(defaultPalierCount("CM2")).toBe(5);
  });

  it("retombe sur le milieu de l'échelle sans niveau ou pour un niveau masqué", () => {
    expect(defaultPalierCount(null)).toBe(FALLBACK_PALIER_COUNT);
    expect(defaultPalierCount(undefined)).toBe(FALLBACK_PALIER_COUNT);
    expect(defaultPalierCount("6e")).toBe(FALLBACK_PALIER_COUNT);
  });

  it("ne dépasse jamais dix, la borne du schéma", () => {
    for (const n of Object.values(DEFAULT_PALIERS_BY_CLASS)) {
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(MAX_PALIERS_PER_TOPIC);
    }
  });

  it("préfère la valeur posée sur la thématique quand elle est valable", () => {
    expect(effectivePalierCount({ class: "CM1", palierCount: 8 })).toBe(8);
    expect(effectivePalierCount({ class: "CM1", palierCount: 0 })).toBe(5);
    expect(effectivePalierCount({ class: "CM1", palierCount: 11 })).toBe(5);
    expect(effectivePalierCount({ class: "CM1", palierCount: 2.5 })).toBe(5);
    expect(effectivePalierCount({ class: "CP" })).toBe(3);
  });

  it("compte dix exercices par palier", () => {
    expect(exercisesForTopic({ class: "CM2" })).toBe(5 * PALIER_SIZE);
    expect(exercisesForTopic({ class: "CI", palierCount: 2 })).toBe(20);
  });

  it("valide un entier entre 1 et 10", () => {
    expect(isValidPalierCount(1)).toBe(true);
    expect(isValidPalierCount(10)).toBe(true);
    expect(isValidPalierCount(0)).toBe(false);
    expect(isValidPalierCount(11)).toBe(false);
    expect(isValidPalierCount(3.3)).toBe(false);
    expect(isValidPalierCount("3")).toBe(false);
    expect(isValidPalierCount(null)).toBe(false);
  });
});

describe("échelle de difficulté relative", () => {
  it("retrouve l'ancienne grille avec dix paliers", () => {
    const stages = Array.from({ length: 10 }, (_, i) => difficultyStage(i + 1, 10));
    expect(stages).toEqual([
      "decouverte",
      "decouverte",
      "decouverte",
      "consolidation",
      "consolidation",
      "consolidation",
      "approfondissement",
      "approfondissement",
      "approfondissement",
      "maitrise",
    ]);
  });

  it("commence par une découverte et finit par la maîtrise, quel que soit le nombre", () => {
    for (const n of [2, 3, 4, 5, 7]) {
      expect(difficultyStage(1, n)).toBe("decouverte");
      expect(difficultyStage(n, n)).toBe("maitrise");
    }
  });

  it("place les paliers du milieu par position", () => {
    expect(Array.from({ length: 3 }, (_, i) => difficultyStage(i + 1, 3))).toEqual([
      "decouverte",
      "consolidation",
      "maitrise",
    ]);
    expect(Array.from({ length: 4 }, (_, i) => difficultyStage(i + 1, 4))).toEqual([
      "decouverte",
      "consolidation",
      "approfondissement",
      "maitrise",
    ]);
    expect(Array.from({ length: 5 }, (_, i) => difficultyStage(i + 1, 5))).toEqual([
      "decouverte",
      "consolidation",
      "consolidation",
      "approfondissement",
      "maitrise",
    ]);
  });

  it("un seul palier fait tout : maîtrise", () => {
    expect(difficultyStage(1, 1)).toBe("maitrise");
  });
});

describe("état des paliers d'une thématique", () => {
  it("ouvre le premier palier d'une thématique ouverte", () => {
    expect(
      resolvePalierStatuses({
        topicLocked: false,
        palierCount: 3,
        validated: new Set(),
        inProgress: new Set(),
      }),
    ).toEqual(["available", "locked", "locked"]);
  });

  it("verrouille tout quand la thématique est fermée", () => {
    expect(
      resolvePalierStatuses({
        topicLocked: true,
        palierCount: 3,
        validated: new Set([1]),
        inProgress: new Set(),
      }),
    ).toEqual(["locked", "locked", "locked"]);
  });

  it("ouvre le suivant d'un palier validé, et montre celui en cours", () => {
    expect(
      resolvePalierStatuses({
        topicLocked: false,
        palierCount: 4,
        validated: new Set([1]),
        inProgress: new Set([2]),
      }),
    ).toEqual(["completed", "in_progress", "locked", "locked"]);
    expect(
      resolvePalierStatuses({
        topicLocked: false,
        palierCount: 4,
        validated: new Set([1, 2]),
        inProgress: new Set(),
      }),
    ).toEqual(["completed", "completed", "available", "locked"]);
  });

  it("dit si la thématique est finie et quel palier vient ensuite", () => {
    expect(isTopicComplete(new Set([1, 2, 3]), 3)).toBe(true);
    expect(isTopicComplete(new Set([1, 3]), 3)).toBe(false);
    expect(isTopicComplete(new Set(), 0)).toBe(false);
    expect(nextPalierIndex(new Set(), 3)).toBe(1);
    expect(nextPalierIndex(new Set([1]), 3)).toBe(2);
    expect(nextPalierIndex(new Set([1, 3]), 3)).toBe(2);
    expect(nextPalierIndex(new Set([1, 2, 3]), 3)).toBe(3);
  });
});
