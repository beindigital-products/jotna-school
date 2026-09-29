import { describe, it, expect } from "vitest";
import { verdictMessage } from "../arabic/copy";
import { BRAVOS, bravo, CONSIGNES, spokenConsigne } from "@/convex/arabic/consignes";

const ARABIC = /[؀-ۿ]/;

describe("les bravos de Pio", () => {
  it("disent tous une formule, « MashaAllah » le plus souvent", () => {
    for (const key of BRAVOS) {
      expect(CONSIGNES[key]).toMatch(/MashaAllah|Tabarakallah|Barakallahou fik/);
    }
    const mashaAllah = BRAVOS.filter((key) => CONSIGNES[key].includes("MashaAllah"));
    expect(mashaAllah.length).toBeGreaterThan(BRAVOS.length / 2);
  });

  it("varient d'une réussite à la suivante, sans hasard", () => {
    const suite = [0, 1, 2, 3, 4, 5].map(bravo);
    expect(new Set(suite).size).toBe(BRAVOS.length);
    expect(bravo(6)).toBe(bravo(0));
    expect(bravo(-1)).toBe(bravo(BRAVOS.length - 1));
  });
});

describe("spokenConsigne", () => {
  it("fait dire les formules en arabe, et le reste tel quel", () => {
    expect(spokenConsigne("bravo_1")).toBe("مَا شَاءَ اللَّه !");
    expect(spokenConsigne("bravo_2")).toBe("مَا شَاءَ اللَّه, c'est ça !");
    expect(spokenConsigne("bravo_5")).toBe("تَبَارَكَ اللَّه ! Continue comme ça.");
    expect(spokenConsigne("bravo_6")).toBe("بَارَكَ اللَّهُ فِيك, c'est parfait !");
  });

  it("laisse la bulle en lettres latines, pour l'adulte qui lit", () => {
    for (const key of Object.keys(CONSIGNES) as (keyof typeof CONSIGNES)[]) {
      expect(CONSIGNES[key]).not.toMatch(ARABIC);
    }
  });

  it("ne touche pas une consigne sans formule", () => {
    expect(spokenConsigne("repeat")).toBe(CONSIGNES.repeat);
  });
});

describe("verdictMessage", () => {
  it("écrit la réussite avec le bravo que Pio dit pour cette tentative", () => {
    expect(verdictMessage("ok", 0)).toBe(`${CONSIGNES[bravo(0)]} 🌟`);
    expect(verdictMessage("ok", 4)).toBe(`${CONSIGNES[bravo(4)]} 🌟`);
  });

  it("ne dit jamais « faux » quand ce n'est pas encore ça", () => {
    for (const verdict of ["close", "retry"] as const) {
      for (const attempt of [0, 1, 2]) {
        expect(verdictMessage(verdict, attempt)).not.toMatch(/faux|raté/i);
      }
    }
  });
});
