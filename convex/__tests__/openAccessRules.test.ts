import { describe, expect, it } from "vitest";
import {
  buildChildLoginCode,
  buildSchoolJoinCode,
  buildStudentShareCode,
  cleanClassLabel,
  cleanName,
  decideSelfSignupRole,
  printableLoginCode,
} from "../openAccessRules";

const lowest = (min: number) => min;
const highest = (_min: number, max: number) => max;

describe("decideSelfSignupRole", () => {
  it("accepte école, professeur et parent", () => {
    expect(decideSelfSignupRole("directeur")).toBe("directeur");
    expect(decideSelfSignupRole("professeur")).toBe("professeur");
    expect(decideSelfSignupRole("parent")).toBe("parent");
  });

  it("refuse élève, admin et les valeurs inconnues", () => {
    expect(decideSelfSignupRole("student")).toBeNull();
    expect(decideSelfSignupRole("admin")).toBeNull();
    expect(decideSelfSignupRole("")).toBeNull();
    expect(decideSelfSignupRole(undefined)).toBeNull();
    expect(decideSelfSignupRole(42)).toBeNull();
  });
});

describe("codes partagés", () => {
  it("préfixe le code élève par ELV et le code école par ECO", () => {
    expect(buildStudentShareCode(lowest)).toBe("ELV-333333");
    expect(buildSchoolJoinCode(highest)).toBe("ECO-YYYYYY");
  });
});

describe("buildChildLoginCode", () => {
  it("prend le prénom sans accents, coupé à six lettres", () => {
    expect(buildChildLoginCode("Awa Diop", lowest)).toBe("AWA-1000");
    expect(buildChildLoginCode("  Éléonore Sarr", lowest)).toBe("ELEONO-1000");
    expect(buildChildLoginCode("Mame-Diarra Fall", highest)).toBe("MAMEDI-9999");
  });

  it("retombe sur ELEVE sans lettre exploitable", () => {
    expect(buildChildLoginCode("", lowest)).toBe("ELEVE-1000");
    expect(buildChildLoginCode("123", lowest)).toBe("ELEVE-1000");
  });

  it("passe à six chiffres sur demande", () => {
    expect(buildChildLoginCode("Awa", lowest, 6)).toBe("AWA-100000");
  });
});

describe("printableLoginCode", () => {
  it("rend le code en majuscules pour un compte élève", () => {
    expect(printableLoginCode("awa-4821")).toBe("AWA-4821");
  });

  it("ne montre jamais une vraie adresse", () => {
    expect(printableLoginCode("parent@example.com")).toBeNull();
    expect(printableLoginCode(undefined)).toBeNull();
  });
});

describe("nettoyage des saisies", () => {
  it("réduit les espaces et refuse le vide", () => {
    expect(cleanName("  Awa   Diop ")).toBe("Awa Diop");
    expect(cleanName("   ")).toBeNull();
    expect(cleanName("x".repeat(81))).toBeNull();
  });

  it("donne A à un libellé de classe vide", () => {
    expect(cleanClassLabel("")).toBe("A");
    expect(cleanClassLabel(" Les lions ")).toBe("Les lions");
    expect(cleanClassLabel("x".repeat(31))).toBeNull();
  });
});
