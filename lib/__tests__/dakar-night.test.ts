import { describe, expect, it } from "vitest";
import { isDakarNight } from "@/hooks/use-dakar-night";

const at = (hour: number, minute = 0) => new Date(Date.UTC(2026, 10, 24, hour, minute));

describe("la nuit au camp (heure de Dakar)", () => {
  it("il fait jour de 6 heures à 18 h 59", () => {
    expect(isDakarNight(at(6))).toBe(false);
    expect(isDakarNight(at(12))).toBe(false);
    expect(isDakarNight(at(18, 59))).toBe(false);
  });

  it("il fait nuit de 19 heures à 5 h 59", () => {
    expect(isDakarNight(at(19))).toBe(true);
    expect(isDakarNight(at(23, 30))).toBe(true);
    expect(isDakarNight(at(0))).toBe(true);
    expect(isDakarNight(at(5, 59))).toBe(true);
  });

  it("suit l'heure UTC, pas celle de l'appareil", () => {
    // 20 heures à Dakar, quel que soit le fuseau où le test tourne.
    expect(isDakarNight(new Date("2026-11-24T20:00:00Z"))).toBe(true);
    expect(isDakarNight(new Date("2026-11-24T10:00:00Z"))).toBe(false);
  });
});
