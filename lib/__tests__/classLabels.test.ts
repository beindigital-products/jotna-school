import { describe, it, expect } from "vitest";
import { classLongName, schoolClassDisplay } from "../classLabels";

describe("schoolClassDisplay — « CM1 A » ou « CM1 »", () => {
  it("ajoute la lettre quand l'école distingue plusieurs classes", () => {
    expect(schoolClassDisplay("CM1", "A")).toBe("CM1 A");
  });

  it("retient le seul niveau pour une classe « unique »", () => {
    expect(schoolClassDisplay("CE2", "unique")).toBe("CE2");
    expect(schoolClassDisplay("CE2", "Unique")).toBe("CE2");
  });

  it("retient le seul niveau sans libellé", () => {
    expect(schoolClassDisplay("CI", "")).toBe("CI");
    expect(schoolClassDisplay("CI", "   ")).toBe("CI");
    expect(schoolClassDisplay("CI", null)).toBe("CI");
    expect(schoolClassDisplay("CI", undefined)).toBe("CI");
  });
});

describe("classLongName — le nom complet de chaque niveau", () => {
  it("couvre l'élémentaire servi aujourd'hui", () => {
    expect(classLongName("CI")).toBe("Cours d'initiation");
    expect(classLongName("CM2")).toBe("Cours moyen 2e année");
  });
});
