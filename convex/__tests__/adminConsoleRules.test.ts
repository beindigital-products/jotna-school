import { describe, expect, it } from "vitest";

import {
  boundedCount,
  bucketSeries,
  countSince,
  dayKeyOf,
  deltaOf,
  distinctCount,
  distinctPerDay,
  funnelSteps,
  rateOf,
  splitPeriods,
  topBy,
  lastDayKeys,
  lastMonthKeys,
  monthKeyOf,
  percentChange,
  startOfMonth,
} from "../adminConsoleRules";

const NOW = Date.UTC(2026, 10, 24, 15, 30);

describe("dates de Dakar", () => {
  it("donne le jour et le mois UTC", () => {
    expect(dayKeyOf(NOW)).toBe("2026-11-24");
    expect(monthKeyOf(NOW)).toBe("2026-11");
    expect(startOfMonth(NOW)).toBe(Date.UTC(2026, 10, 1));
  });

  it("liste les derniers jours jusqu'à aujourd'hui", () => {
    expect(lastDayKeys(NOW, 3)).toEqual(["2026-11-22", "2026-11-23", "2026-11-24"]);
  });

  it("liste les derniers mois en passant l'année", () => {
    expect(lastMonthKeys(Date.UTC(2027, 0, 10), 3)).toEqual(["2026-11", "2026-12", "2027-01"]);
  });
});

describe("bucketSeries", () => {
  it("additionne par case et ignore ce qui sort", () => {
    const keys = ["2026-11-23", "2026-11-24"];
    const series = bucketSeries(
      keys,
      [
        { at: Date.UTC(2026, 10, 24, 1), value: 2 },
        { at: Date.UTC(2026, 10, 24, 23), value: 3 },
        { at: Date.UTC(2026, 10, 1), value: 99 },
      ],
      dayKeyOf,
    );
    expect(series).toEqual([
      { key: "2026-11-23", value: 0 },
      { key: "2026-11-24", value: 5 },
    ]);
  });
});

describe("comptages", () => {
  it("dit quand la borne est atteinte", () => {
    expect(boundedCount(12, 1000)).toEqual({ count: 12, capped: false });
    expect(boundedCount(1000, 1000)).toEqual({ count: 1000, capped: false });
    expect(boundedCount(1001, 1000)).toEqual({ count: 1000, capped: true });
  });

  it("compte depuis une date", () => {
    expect(countSince([1, 5, 10], 5)).toBe(2);
  });

  it("ne donne pas de % depuis zéro", () => {
    expect(percentChange(10, 0)).toBeNull();
    expect(percentChange(150, 100)).toBe(50);
    expect(percentChange(50, 100)).toBe(-50);
  });
});

describe("périodes et variations", () => {
  const DAY = 24 * 60 * 60 * 1000;

  it("répartit entre la période et celle d'avant", () => {
    const items = [NOW - DAY, NOW - 6 * DAY, NOW - 8 * DAY, NOW - 15 * DAY].map((at) => ({ at }));
    const { current, previous } = splitPeriods(items, NOW, 7);
    expect(current).toHaveLength(2);
    expect(previous).toHaveLength(1);
  });

  it("calcule la variation", () => {
    expect(deltaOf(12, 10)).toEqual({ current: 12, previous: 10, change: 20 });
    expect(deltaOf(3, 0).change).toBeNull();
  });

  it("compte les élèves différents, au total et par jour", () => {
    const items = [
      { at: Date.UTC(2026, 10, 24, 8), id: "a" },
      { at: Date.UTC(2026, 10, 24, 9), id: "a" },
      { at: Date.UTC(2026, 10, 24, 9), id: "b" },
      { at: Date.UTC(2026, 10, 23, 9), id: "a" },
    ];
    expect(distinctCount(items)).toBe(2);
    expect(distinctPerDay(["2026-11-23", "2026-11-24"], items)).toEqual([
      { key: "2026-11-23", value: 1 },
      { key: "2026-11-24", value: 2 },
    ]);
  });

  it("donne un taux, ou rien sans dénominateur", () => {
    expect(rateOf(1, 3)).toBe(33);
    expect(rateOf(0, 0)).toBeNull();
  });
});

describe("funnelSteps", () => {
  it("calcule la conversion et la largeur de chaque étape", () => {
    expect(
      funnelSteps([
        { label: "A", value: 200 },
        { label: "B", value: 50 },
        { label: "C", value: 0 },
        { label: "D", value: 0 },
      ]),
    ).toEqual([
      { label: "A", value: 200, conversion: null, share: 100 },
      { label: "B", value: 50, conversion: 25, share: 25 },
      { label: "C", value: 0, conversion: 0, share: 0 },
      { label: "D", value: 0, conversion: null, share: 0 },
    ]);
  });
});

describe("topBy", () => {
  it("classe du plus grand au plus petit, puis par nom", () => {
    const rows = [
      { name: "B", n: 2 },
      { name: "A", n: 2 },
      { name: "C", n: 9 },
    ];
    expect(topBy(rows, (r) => r.n, 2).map((r) => r.name)).toEqual(["C", "A"]);
  });
});
