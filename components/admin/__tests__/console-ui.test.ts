import { describe, expect, it } from "vitest";

import { boundedLabel, seriesKeyLabel, toCsv } from "../console-ui";

describe("toCsv", () => {
  it("sépare par des points-virgules et met chaque cellule entre guillemets", () => {
    expect(toCsv(["Nom", "Places"], [["École A", 50]])).toBe(
      '"Nom";"Places"\r\n"École A";"50"',
    );
  });

  it("double les guillemets et garde les retours à la ligne dans la cellule", () => {
    expect(toCsv(["Note"], [['Dit "oui"\nrappeler']])).toBe(
      '"Note"\r\n"Dit ""oui""\nrappeler"',
    );
  });

  it("désarme une cellule qu'un tableur lirait comme une formule", () => {
    expect(toCsv(["Nom"], [["=HYPERLINK(1)"], ["+221 77"], ["-1"], ["@x"]])).toBe(
      '"Nom"\r\n"\'=HYPERLINK(1)"\r\n"\'+221 77"\r\n"\'-1"\r\n"\'@x"',
    );
  });

  it("écrit une cellule vide pour une valeur absente", () => {
    expect(toCsv(["A", "B"], [[null, undefined]])).toBe('"A";"B"\r\n"";""');
  });
});

describe("libellés", () => {
  it("marque un comptage borné", () => {
    expect(boundedLabel({ count: 12, capped: false })).toBe("12");
    expect(boundedLabel({ count: 1000, capped: true })).toMatch(/^1\s000\+$/);
  });

  it("nomme un jour et un mois", () => {
    expect(seriesKeyLabel("2026-11-24")).toBe("24 nov.");
    expect(seriesKeyLabel("2026-11")).toBe("nov. 26");
  });
});
