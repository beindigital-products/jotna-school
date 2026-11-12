import { describe, expect, it } from "vitest";
import {
  buildInvitationCode,
  cleanInvitationMaxUses,
  decideInvitation,
  INVITATION_MAX_USES,
  INVITATION_REFUSALS,
  normalizeInvitationCode,
  printableInvitationCode,
  SELF_SIGNUP_INVITATION_FIELD,
  selfSignupInvitation,
} from "../invitationRules";
import { uniformInt } from "../secureRandom";

const lowest = (min: number) => min;
const highest = (_min: number, max: number) => max;

describe("buildInvitationCode — le code remis à la personne", () => {
  it("a la forme JOTNA-XXXX-XXXX", () => {
    expect(buildInvitationCode(lowest)).toBe("JOTNA-3333-3333");
    expect(buildInvitationCode(highest)).toBe("JOTNA-YYYY-YYYY");
  });

  it("ne tire que dans l'alphabet sans caractères ambigus", () => {
    // Un générateur déterministe qui parcourt toute la plage : chaque symbole
    // de l'alphabet sort au moins une fois.
    let seed = 1;
    const next = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed;
    };
    const randomInt = (min: number, max: number) =>
      min + uniformInt(max - min + 1, next);

    const seen = new Set<string>();
    for (let i = 0; i < 400; i++) {
      const code = buildInvitationCode(randomInt);
      expect(code).toMatch(/^JOTNA-[34679ABCDEFGHJKMNPQRTUVWXY]{4}-[34679ABCDEFGHJKMNPQRTUVWXY]{4}$/);
      for (const symbol of code.slice("JOTNA-".length).replace("-", "")) {
        seen.add(symbol);
      }
    }
    expect([...seen].sort().join("")).toBe("34679ABCDEFGHJKMNPQRTUVWXY");
  });
});

describe("normalizeInvitationCode — la forme comparée et stockée", () => {
  it("ne garde que lettres et chiffres, en minuscules", () => {
    expect(normalizeInvitationCode("JOTNA-7C4K-2MQX")).toBe("jotna7c4k2mqx");
  });

  it("rend la même chaîne quelle que soit la façon de recopier le code", () => {
    // Ce que la personne colle depuis une messagerie : espaces, tirets
    // manquants ou typographiques, guillemets, gras, point final.
    for (const typed of [
      "jotna-7c4k-2mqx",
      "  JOTNA 7C4K 2MQX  ",
      "JOTNA7C4K2MQX",
      "JOTNA–7C4K–2MQX",
      "« JOTNA-7C4K-2MQX ».",
      "*JOTNA-7C4K-2MQX*",
      "Jotna-7c4k-2mqx\n",
    ]) {
      expect(normalizeInvitationCode(typed)).toBe("jotna7c4k2mqx");
    }
  });

  it("rend une chaîne vide pour une saisie vide, démesurée ou qui n'est pas du texte", () => {
    expect(normalizeInvitationCode("")).toBe("");
    expect(normalizeInvitationCode("  - ")).toBe("");
    expect(normalizeInvitationCode("A".repeat(65))).toBe("");
    expect(normalizeInvitationCode(undefined)).toBe("");
    expect(normalizeInvitationCode(null)).toBe("");
    expect(normalizeInvitationCode(42)).toBe("");
    expect(normalizeInvitationCode({ code: "JOTNA-7C4K-2MQX" })).toBe("");
  });

  it("fait l'aller-retour avec la forme imprimable", () => {
    const printable = buildInvitationCode(highest);
    expect(printableInvitationCode(normalizeInvitationCode(printable))).toBe(
      printable,
    );
  });
});

describe("printableInvitationCode — la forme affichée", () => {
  it("remet les tirets et les majuscules", () => {
    expect(printableInvitationCode("jotna7c4k2mqx")).toBe("JOTNA-7C4K-2MQX");
  });

  it("laisse en majuscules ce qui n'a pas la forme d'un code émis ici", () => {
    expect(printableInvitationCode("pilote2026")).toBe("PILOTE2026");
    expect(printableInvitationCode("jotna7c4k")).toBe("JOTNA7C4K");
  });
});

describe("decideInvitation — ce code ouvre-t-il encore une inscription ?", () => {
  it("accepte un code actif qui a encore une place", () => {
    expect(decideInvitation({ maxUses: 1, useCount: 0 })).toEqual({ ok: true });
    expect(decideInvitation({ maxUses: 20, useCount: 19 })).toEqual({
      ok: true,
    });
  });

  it("refuse un code inconnu", () => {
    expect(decideInvitation(null)).toEqual({ ok: false, reason: "unknown" });
  });

  it("refuse un code épuisé, à la limite comme au-delà", () => {
    expect(decideInvitation({ maxUses: 1, useCount: 1 })).toEqual({
      ok: false,
      reason: "exhausted",
    });
    expect(decideInvitation({ maxUses: 3, useCount: 7 })).toEqual({
      ok: false,
      reason: "exhausted",
    });
  });

  it("refuse un code désactivé, même s'il lui reste des places", () => {
    expect(
      decideInvitation({ maxUses: 10, useCount: 2, revokedAt: 1_700_000_000_000 }),
    ).toEqual({ ok: false, reason: "revoked" });
  });

  it("dit « désactivé » avant « épuisé » : c'est la décision de l'équipe", () => {
    expect(
      decideInvitation({ maxUses: 1, useCount: 1, revokedAt: 1_700_000_000_000 }),
    ).toEqual({ ok: false, reason: "revoked" });
  });
});

describe("INVITATION_REFUSALS — la phrase affichée", () => {
  it("a une phrase distincte et non vide pour chaque motif", () => {
    const sentences = Object.values(INVITATION_REFUSALS);
    expect(sentences).toHaveLength(4);
    expect(new Set(sentences).size).toBe(4);
    for (const sentence of sentences) expect(sentence.length).toBeGreaterThan(20);
  });

  it("annonce le lancement à qui n'a pas de code", () => {
    expect(INVITATION_REFUSALS.missing).toMatch(/pas encore en ligne/);
    expect(INVITATION_REFUSALS.missing).toMatch(/code d'invitation/);
  });
});

describe("selfSignupInvitation — inscription publique ou provisionnement ?", () => {
  it("rend `null` pour un compte provisionné : il ne porte pas la marque", () => {
    // Ce que `createAccount` reçoit de `studentImportRun`, `studentAccounts`,
    // `parentLink.signUpWithCode` et `staffAccounts`.
    expect(
      selfSignupInvitation({ email: "awa-4821", name: "Awa", role: "student" }),
    ).toBeNull();
    expect(selfSignupInvitation({})).toBeNull();
  });

  it("rend le code normalisé d'une inscription publique", () => {
    expect(
      selfSignupInvitation({
        email: "parent@exemple.sn",
        role: "parent",
        [SELF_SIGNUP_INVITATION_FIELD]: "JOTNA-7C4K-2MQX",
      }),
    ).toBe("jotna7c4k2mqx");
  });

  it("rend un code VIDE, pas une absence, quand la marque est là sans code valable", () => {
    // Vide veut dire « inscription publique sans code » : elle sera refusée.
    // `null` l'aurait fait passer pour un provisionnement, sans contrôle.
    for (const value of ["", "   ", undefined, null, 0, false, {}]) {
      expect(
        selfSignupInvitation({ [SELF_SIGNUP_INVITATION_FIELD]: value }),
      ).toBe("");
    }
  });
});

describe("cleanInvitationMaxUses — combien de personnes un code laisse entrer", () => {
  it("accepte un entier de 1 à la limite", () => {
    expect(cleanInvitationMaxUses(1)).toBe(1);
    expect(cleanInvitationMaxUses(30)).toBe(30);
    expect(cleanInvitationMaxUses(INVITATION_MAX_USES)).toBe(
      INVITATION_MAX_USES,
    );
  });

  it("refuse zéro, les négatifs, les décimaux et ce qui dépasse", () => {
    for (const value of [
      0,
      -1,
      1.5,
      INVITATION_MAX_USES + 1,
      Number.NaN,
      Number.POSITIVE_INFINITY,
    ]) {
      expect(cleanInvitationMaxUses(value)).toBeNull();
    }
  });
});
