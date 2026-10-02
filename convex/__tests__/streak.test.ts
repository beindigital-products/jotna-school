import { describe, it, expect } from "vitest";
import {
  applyActivity,
  applyRollover,
  daysBetween,
  timestampToYmd,
  todayYmd,
  type StreakTransition,
} from "../streak";
import {
  approxStarsForValidatedPalier,
  computeLevel,
  exosToNextLevel,
  EXOS_PER_LEVEL,
} from "../students";

describe("streak — date helpers", () => {
  it("timestampToYmd produces YYYY-MM-DD in UTC (Africa/Dakar)", () => {
    // 2024-03-15T12:34:56Z
    expect(timestampToYmd(Date.UTC(2024, 2, 15, 12, 34, 56))).toBe(
      "2024-03-15",
    );
    // Edge: midnight UTC
    expect(timestampToYmd(Date.UTC(2024, 0, 1, 0, 0, 0))).toBe("2024-01-01");
  });

  it("daysBetween counts full UTC days", () => {
    expect(daysBetween("2024-01-01", "2024-01-01")).toBe(0);
    expect(daysBetween("2024-01-01", "2024-01-02")).toBe(1);
    expect(daysBetween("2024-01-01", "2024-01-08")).toBe(7);
    expect(daysBetween("2024-01-08", "2024-01-01")).toBe(-7);
    // Cross month boundary
    expect(daysBetween("2024-01-31", "2024-02-01")).toBe(1);
    // Leap year — 2024 has Feb 29
    expect(daysBetween("2024-02-28", "2024-03-01")).toBe(2);
  });

  it("todayYmd returns a valid YYYY-MM-DD", () => {
    const t = todayYmd();
    expect(t).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("streak — applyActivity", () => {
  it("first ever activity creates streak=1 with freeze available", () => {
    const t = applyActivity(undefined, "2024-01-01");
    expect(t.next.current).toBe(1);
    expect(t.next.longest).toBe(1);
    expect(t.next.lastActivityYmd).toBe("2024-01-01");
    expect(t.next.freezeAvailableUntilYmd).toBe("2024-01-08");
    expect(t.freezeUsed).toBe(false);
  });

  it("same-day activity is a noop", () => {
    const prev = {
      current: 5,
      longest: 5,
      lastActivityYmd: "2024-01-10",
      freezeAvailableUntilYmd: "2024-01-15",
    };
    const t = applyActivity(prev, "2024-01-10");
    expect(t.next).toBe(prev);
  });

  it("next-day activity increments streak (no freeze touched)", () => {
    const prev = {
      current: 3,
      longest: 5,
      lastActivityYmd: "2024-01-10",
      freezeAvailableUntilYmd: "2024-01-15",
    };
    const t = applyActivity(prev, "2024-01-11");
    expect(t.next.current).toBe(4);
    expect(t.next.longest).toBe(5); // unchanged
    expect(t.next.lastActivityYmd).toBe("2024-01-11");
    expect(t.next.freezeAvailableUntilYmd).toBe("2024-01-15");
    expect(t.freezeUsed).toBe(false);
  });

  it("next-day activity updates longest when current exceeds it", () => {
    const prev = {
      current: 5,
      longest: 5,
      lastActivityYmd: "2024-01-10",
    };
    const t = applyActivity(prev, "2024-01-11");
    expect(t.next.current).toBe(6);
    expect(t.next.longest).toBe(6);
  });

  it("2-day gap with freeze available consumes freeze, increments", () => {
    const prev = {
      current: 5,
      longest: 5,
      lastActivityYmd: "2024-01-10",
      freezeAvailableUntilYmd: "2024-01-15", // available
    };
    const t = applyActivity(prev, "2024-01-12");
    expect(t.next.current).toBe(6);
    expect(t.freezeUsed).toBe(true);
    // Freeze regenerates 7 days from today
    expect(t.next.freezeAvailableUntilYmd).toBe("2024-01-19");
  });

  it("2-day gap WITHOUT freeze resets streak to 1", () => {
    const prev = {
      current: 10,
      longest: 10,
      lastActivityYmd: "2024-01-10",
      // no freezeAvailableUntilYmd
    };
    const t = applyActivity(prev, "2024-01-12");
    expect(t.next.current).toBe(1);
    expect(t.next.longest).toBe(10); // preserved
    expect(t.freezeUsed).toBe(false);
  });

  it("2-day gap with EXPIRED freeze resets streak", () => {
    const prev = {
      current: 5,
      longest: 5,
      lastActivityYmd: "2024-01-10",
      freezeAvailableUntilYmd: "2024-01-09", // already expired
    };
    const t = applyActivity(prev, "2024-01-12");
    expect(t.next.current).toBe(1);
    expect(t.freezeUsed).toBe(false);
  });

  it("3-day gap resets even with freeze available", () => {
    const prev = {
      current: 5,
      longest: 5,
      lastActivityYmd: "2024-01-10",
      freezeAvailableUntilYmd: "2024-01-15",
    };
    const t = applyActivity(prev, "2024-01-13");
    expect(t.next.current).toBe(1);
    expect(t.freezeUsed).toBe(false);
  });
});

describe("streak — applyRollover (daily cron)", () => {
  it("no streak state yet is a noop", () => {
    const t = applyRollover(undefined, "2024-01-15");
    expect(t.next).toEqual({ current: 0, longest: 0 });
  });

  it("active today is preserved", () => {
    const prev = {
      current: 7,
      longest: 7,
      lastActivityYmd: "2024-01-15",
    };
    const t = applyRollover(prev, "2024-01-15");
    expect(t.next).toBe(prev);
  });

  it("active yesterday is preserved (still on time today)", () => {
    const prev = {
      current: 7,
      longest: 7,
      lastActivityYmd: "2024-01-14",
    };
    const t = applyRollover(prev, "2024-01-15");
    expect(t.next).toBe(prev);
  });

  it("2-day gap with freeze available is preserved", () => {
    const prev = {
      current: 7,
      longest: 7,
      lastActivityYmd: "2024-01-13",
      freezeAvailableUntilYmd: "2024-01-20",
    };
    const t = applyRollover(prev, "2024-01-15");
    expect(t.next).toBe(prev);
  });

  it("2-day gap WITHOUT freeze resets current to 0, preserves longest", () => {
    const prev = {
      current: 7,
      longest: 7,
      lastActivityYmd: "2024-01-13",
      // no freeze
    };
    const t = applyRollover(prev, "2024-01-15");
    expect(t.next.current).toBe(0);
    expect(t.next.longest).toBe(7);
  });

  it("3-day gap with freeze still resets (freeze covers 1 missed day max)", () => {
    const prev = {
      current: 7,
      longest: 7,
      lastActivityYmd: "2024-01-12",
      freezeAvailableUntilYmd: "2024-01-20",
    };
    const t = applyRollover(prev, "2024-01-15");
    expect(t.next.current).toBe(0);
    expect(t.next.longest).toBe(7);
  });
});

describe("streak — narrative scenario (typical week)", () => {
  it("active 5 weekdays, skip Sat with freeze, resume Sunday", () => {
    let s: StreakTransition["next"] | undefined;

    // Mon → Fri: increment 1..5
    s = applyActivity(s, "2024-03-04").next; // Mon
    expect(s.current).toBe(1);
    s = applyActivity(s, "2024-03-05").next; // Tue
    s = applyActivity(s, "2024-03-06").next; // Wed
    s = applyActivity(s, "2024-03-07").next; // Thu
    s = applyActivity(s, "2024-03-08").next; // Fri
    expect(s.current).toBe(5);
    expect(s.longest).toBe(5);

    // Skip Saturday (no activity).
    // Sunday — gap=2, freeze available (was set on day 1 = "2024-03-11", so still good on 2024-03-10).
    s = applyActivity(s, "2024-03-10").next; // Sun
    expect(s.current).toBe(6);
    expect(s.longest).toBe(6);
  });
});

// ---------------------------------------------------------------------------
// Level + stars helpers
// ---------------------------------------------------------------------------

describe("level helpers", () => {
  it("EXOS_PER_LEVEL is 50 (D3b)", () => {
    expect(EXOS_PER_LEVEL).toBe(50);
  });

  it("computeLevel: 0 correct → level 1", () => {
    expect(computeLevel(0)).toBe(1);
  });

  it("computeLevel: 49 correct → level 1", () => {
    expect(computeLevel(49)).toBe(1);
  });

  it("computeLevel: 50 correct → level 2", () => {
    expect(computeLevel(50)).toBe(2);
  });

  it("computeLevel: 500 correct → level 11", () => {
    expect(computeLevel(500)).toBe(11);
  });

  it("exosToNextLevel: 0 → 50", () => {
    expect(exosToNextLevel(0)).toBe(50);
  });

  it("exosToNextLevel: 49 → 1", () => {
    expect(exosToNextLevel(49)).toBe(1);
  });

  it("exosToNextLevel: 50 → 50 (just leveled up)", () => {
    expect(exosToNextLevel(50)).toBe(50);
  });
});

describe("approxStarsForValidatedPalier", () => {
  it("avg >= 9 → 3 stars", () => {
    expect(approxStarsForValidatedPalier(9)).toBe(3);
    expect(approxStarsForValidatedPalier(10)).toBe(3);
    expect(approxStarsForValidatedPalier(9.5)).toBe(3);
  });

  it("7 <= avg < 9 → 2 stars", () => {
    expect(approxStarsForValidatedPalier(7)).toBe(2);
    expect(approxStarsForValidatedPalier(8.99)).toBe(2);
  });

  it("avg < 7 → 1 star (defensive — shouldn't happen for validated)", () => {
    expect(approxStarsForValidatedPalier(0)).toBe(1);
    expect(approxStarsForValidatedPalier(6.99)).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// LES JOURS JOUÉS SANS RÉSEAU (`docs/hors-ligne.md`). La tâche de nuit ne les
// voit pas : elle peut casser une série qu'un palier joué hors ligne
// prolongeait. Rejoué à la synchronisation, ce jour rétablit la série.
// ---------------------------------------------------------------------------
describe("streak — activité rattrapée après une remise à zéro de nuit", () => {
  it("la tâche de nuit garde la série cassée dans `currentBeforeReset`", () => {
    const prev = {
      current: 5,
      longest: 5,
      lastActivityYmd: "2026-10-01",
      freezeAvailableUntilYmd: "2026-09-30",
    };
    const t = applyRollover(prev, "2026-10-03");
    expect(t.next.current).toBe(0);
    expect(t.next.currentBeforeReset).toBe(5);
  });

  it("un jour joué hors ligne le lendemain rétablit la série", () => {
    const rolled = {
      current: 0,
      longest: 5,
      lastActivityYmd: "2026-10-01",
      freezeAvailableUntilYmd: "2026-09-30",
      currentBeforeReset: 5,
    };
    const t = applyActivity(rolled, "2026-10-02");
    expect(t.next.current).toBe(6);
    expect(t.next.longest).toBe(6);
    expect(t.next.currentBeforeReset).toBeUndefined();
  });

  it("une vraie absence repart de un, même après une remise à zéro", () => {
    const rolled = {
      current: 0,
      longest: 5,
      lastActivityYmd: "2026-10-01",
      freezeAvailableUntilYmd: "2026-09-30",
      currentBeforeReset: 5,
    };
    expect(applyActivity(rolled, "2026-10-06").next.current).toBe(1);
  });

  it("la tâche de nuit ne réécrit pas une série déjà à zéro", () => {
    const zero = { current: 0, longest: 4, lastActivityYmd: "2026-09-01", currentBeforeReset: 4 };
    const t = applyRollover(zero, "2026-10-03");
    expect(t.next).toBe(zero);
  });
});
