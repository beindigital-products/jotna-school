import { describe, expect, it } from "vitest";
import { budgetFor, decideGameFeelLevel, HAPTICS, MAX_ANIMATED_LAYERS } from "../game-feel";
import { burstLayers } from "../reward";

describe("decideGameFeelLevel — riche ou sobre", () => {
  it("un appareil sans signal défavorable est riche", () => {
    expect(decideGameFeelLevel({})).toBe("riche");
    expect(decideGameFeelLevel({ tier: "full", hardwareConcurrency: 8, deviceMemory: 4 })).toBe("riche");
  });

  it("trois cœurs ou moins : sobre (seuil G5)", () => {
    expect(decideGameFeelLevel({ hardwareConcurrency: 3 })).toBe("sobre");
    expect(decideGameFeelLevel({ hardwareConcurrency: 4 })).toBe("riche");
  });

  it("deux gigaoctets ou moins : sobre", () => {
    expect(decideGameFeelLevel({ deviceMemory: 2 })).toBe("sobre");
    expect(decideGameFeelLevel({ deviceMemory: 3 })).toBe("riche");
  });

  it("économie de données, tier lite, mouvement réduit : sobre", () => {
    expect(decideGameFeelLevel({ saveData: true })).toBe("sobre");
    expect(decideGameFeelLevel({ tier: "lite" })).toBe("sobre");
    expect(decideGameFeelLevel({ tier: "full", reducedMotion: true })).toBe("sobre");
  });
});

describe("budgetFor — ce qu'un niveau dépense", () => {
  it("riche : inclinaison, dérive, 50 confettis", () => {
    const b = budgetFor("riche", false);
    expect(b.tilt).toBe(true);
    expect(b.drift).toBe(true);
    expect(b.particles).toBe(50);
    expect(b.stars + b.coins * 3 + 1).toBeLessThanOrEqual(MAX_ANIMATED_LAYERS);
  });

  it("sobre : la même profondeur, rien qui bouge en continu, moins de particules", () => {
    const b = budgetFor("sobre", false);
    expect(b.tilt).toBe(false);
    expect(b.drift).toBe(false);
    expect(b.particles).toBeLessThan(budgetFor("riche", false).particles);
    expect(b.springs).toBe(true);
  });

  it("mouvement réduit : aucune particule, aucun ressort, quel que soit le niveau", () => {
    for (const level of ["riche", "sobre"] as const) {
      const b = budgetFor(level, true);
      expect(b.particles).toBe(0);
      expect(b.stars).toBe(0);
      expect(b.coins).toBe(0);
      expect(b.tilt).toBe(false);
      expect(b.drift).toBe(false);
      expect(b.springs).toBe(false);
    }
  });
});

describe("burstLayers — ce qu'un éclat de récompense contient", () => {
  it("riche et sobre : l'anneau et le budget d'étoiles et de pièces", () => {
    expect(burstLayers(budgetFor("riche", false), false)).toEqual({ ring: true, stars: 10, coins: 4 });
    expect(burstLayers(budgetFor("sobre", false), false)).toEqual({ ring: true, stars: 6, coins: 2 });
  });

  it("mouvement réduit : rien, pas même l'anneau (il resterait peint, immobile)", () => {
    expect(burstLayers(budgetFor("riche", true), true)).toEqual({ ring: false, stars: 0, coins: 0 });
  });
});

describe("HAPTICS — les vibrations de answer-feedback, à l'identique", () => {
  it("juste, faux, plus d'essai", () => {
    expect(HAPTICS.correct).toEqual([12, 40, 12]);
    expect(HAPTICS.wrong).toEqual([40, 40, 40]);
    expect(HAPTICS.out).toBe(60);
  });
});
