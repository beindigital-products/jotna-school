import { describe, it, expect } from "vitest";
import { MAX_EMAIL_LENGTH, normalizeWaitlistEmail } from "../waitlistRules";

describe("normalizeWaitlistEmail — l'adresse stockée", () => {
  it("met en minuscules et retire les espaces autour", () => {
    expect(normalizeWaitlistEmail("  Awa.Diop@Ecole.SN \n")).toBe(
      "awa.diop@ecole.sn",
    );
  });

  it("rend la même chaîne pour deux saisies d'une même adresse", () => {
    // C'est ce qui permet à l'index `by_email` d'écarter le doublon.
    expect(normalizeWaitlistEmail("Parent@Exemple.com")).toBe(
      normalizeWaitlistEmail("parent@exemple.com "),
    );
  });

  it("accepte les formes courantes : point, plus, tiret, sous-domaine", () => {
    for (const email of [
      "a.b@exemple.sn",
      "prenom+jotna@exemple.com",
      "direction-ecole@mail.exemple.org",
    ]) {
      expect(normalizeWaitlistEmail(email)).toBe(email);
    }
  });
});

describe("normalizeWaitlistEmail — refus", () => {
  it("refuse une saisie vide ou faite d'espaces", () => {
    expect(normalizeWaitlistEmail("")).toBeNull();
    expect(normalizeWaitlistEmail("   ")).toBeNull();
  });

  it("refuse ce qui n'a pas la forme d'une adresse", () => {
    for (const email of [
      "awa",
      "awa@",
      "@ecole.sn",
      "awa@ecole",
      "awa@@ecole.sn",
      "awa diop@ecole.sn",
    ]) {
      expect(normalizeWaitlistEmail(email)).toBeNull();
    }
  });

  it("refuse au-delà de 254 caractères, accepte la limite", () => {
    const domain = "@exemple.sn";
    const atLimit = "a".repeat(MAX_EMAIL_LENGTH - domain.length) + domain;
    expect(normalizeWaitlistEmail(atLimit)).toBe(atLimit);
    expect(normalizeWaitlistEmail(`a${atLimit}`)).toBeNull();
  });
});
