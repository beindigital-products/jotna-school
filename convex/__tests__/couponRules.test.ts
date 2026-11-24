import { describe, expect, it } from "vitest";

import {
  buildCouponCode,
  cleanCouponDraft,
  couponStatus,
  decideCouponRedemption,
  describeCouponBenefit,
  freeAccessUntil,
  normalizeCouponCode,
  printableCouponCode,
  redemptionState,
  type CouponState,
} from "../couponRules";

const NOW = Date.UTC(2026, 10, 24, 12);
const DAY = 24 * 60 * 60 * 1000;

const baseInput = {
  label: "Rentrée parents",
  audience: "parent",
  benefitKind: "free_access",
  benefitValue: 30,
  maxUses: 100,
};

const activeCoupon: CouponState = { audience: "parent", maxUses: 2, useCount: 0 };

describe("code", () => {
  it("tire un code PROMO de huit symboles, lisible après stockage", () => {
    const printable = buildCouponCode(() => 0);
    expect(printable).toBe("PROMO-3333-3333");
    expect(printableCouponCode(normalizeCouponCode(printable))).toBe(printable);
  });

  it("ignore tirets, espaces, casse et accents", () => {
    expect(normalizeCouponCode(" promo-7c4k 2mqx. ")).toBe("promo7c4k2mqx");
    expect(normalizeCouponCode("Rentrée2027")).toBe("rentree2027");
    expect(normalizeCouponCode(42)).toBe("");
    expect(normalizeCouponCode("x".repeat(65))).toBe("");
  });

  it("affiche un code choisi en majuscules", () => {
    expect(printableCouponCode("rentree2027")).toBe("RENTREE2027");
  });
});

describe("cleanCouponDraft", () => {
  it("accepte un accès gratuit", () => {
    expect(cleanCouponDraft(baseInput, NOW)).toEqual({
      ok: true,
      draft: {
        label: "Rentrée parents",
        audience: "parent",
        benefit: { kind: "free_access", days: 30 },
        maxUses: 100,
        customCode: null,
        startsAt: undefined,
        expiresAt: undefined,
      },
    });
  });

  it("accepte une remise et normalise un code choisi", () => {
    const result = cleanCouponDraft(
      { ...baseInput, benefitKind: "percent", benefitValue: 20, customCode: "Rentrée-2027" },
      NOW,
    );
    expect(result.ok && result.draft.benefit).toEqual({ kind: "percent", percent: 20 });
    expect(result.ok && result.draft.customCode).toBe("rentree2027");
  });

  it.each([
    [{ label: "  " }, "nom"],
    [{ audience: "student" }, "à qui"],
    [{ benefitKind: "cadeau" }, "ce que donne"],
    [{ benefitValue: 0 }, "1 à 548 jours"],
    [{ benefitValue: 2.5 }, "1 à 548 jours"],
    [{ benefitKind: "percent", benefitValue: 120 }, "1 à 100 %"],
    [{ benefitKind: "amount", benefitValue: 50 }, "remise va de"],
    [{ maxUses: 0 }, "sert de 1"],
    [{ customCode: "ab" }, "4 à 24"],
    [{ expiresAt: NOW - 1 }, "déjà passée"],
    [{ startsAt: NOW + 5 * DAY, expiresAt: NOW + 2 * DAY }, "après le début"],
  ])("refuse %o", (patch, fragment) => {
    const result = cleanCouponDraft({ ...baseInput, ...patch }, NOW);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain(fragment);
  });
});

describe("couponStatus", () => {
  it("donne la priorité à la désactivation, puis à l'expiration", () => {
    expect(couponStatus({ ...activeCoupon, revokedAt: NOW, expiresAt: NOW - 1 }, NOW)).toBe(
      "revoked",
    );
    expect(couponStatus({ ...activeCoupon, expiresAt: NOW, useCount: 2 }, NOW)).toBe("expired");
    expect(couponStatus({ ...activeCoupon, useCount: 2 }, NOW)).toBe("exhausted");
    expect(couponStatus({ ...activeCoupon, startsAt: NOW + 1 }, NOW)).toBe("scheduled");
    expect(couponStatus(activeCoupon, NOW)).toBe("active");
  });
});

describe("decideCouponRedemption", () => {
  const decide = (patch: Partial<Parameters<typeof decideCouponRedemption>[0]>) =>
    decideCouponRedemption({
      coupon: activeCoupon,
      role: "parent",
      alreadyRedeemed: false,
      now: NOW,
      ...patch,
    });

  it("ouvre un coupon actif au bon public", () => {
    expect(decide({})).toEqual({ ok: true });
    expect(decide({ coupon: { ...activeCoupon, audience: "all" }, role: "directeur" })).toEqual({
      ok: true,
    });
  });

  it("refuse dans l'ordre utile", () => {
    expect(decide({ coupon: null })).toEqual({ ok: false, reason: "unknown" });
    expect(decide({ role: "student" })).toEqual({ ok: false, reason: "not_eligible" });
    expect(decide({ role: "admin" })).toEqual({ ok: false, reason: "not_eligible" });
    expect(decide({ role: null })).toEqual({ ok: false, reason: "not_eligible" });
    expect(decide({ role: "professeur" })).toEqual({ ok: false, reason: "wrong_audience" });
    expect(decide({ alreadyRedeemed: true })).toEqual({ ok: false, reason: "already_used" });
    expect(decide({ coupon: { ...activeCoupon, useCount: 2 } })).toEqual({
      ok: false,
      reason: "exhausted",
    });
    expect(decide({ coupon: { ...activeCoupon, revokedAt: NOW } })).toEqual({
      ok: false,
      reason: "revoked",
    });
  });
});

describe("avantage", () => {
  it("se dit en mots", () => {
    expect(describeCouponBenefit({ kind: "free_access", days: 1 })).toBe("Accès gratuit 1 jour");
    expect(describeCouponBenefit({ kind: "free_access", days: 30 })).toBe(
      "Accès gratuit 30 jours",
    );
    expect(describeCouponBenefit({ kind: "percent", percent: 20 })).toBe("Remise de 20 %");
    expect(describeCouponBenefit({ kind: "amount", amountFcfa: 5000 })).toMatch(
      /^Remise de 5\s000 FCFA$/,
    );
  });

  it("date la fin d'un accès gratuit, pas d'une remise", () => {
    expect(freeAccessUntil({ kind: "free_access", days: 30 }, NOW)).toBe(NOW + 30 * DAY);
    expect(freeAccessUntil({ kind: "percent", percent: 10 }, NOW)).toBeUndefined();
  });

  it("suit l'état d'une utilisation", () => {
    const access = { benefit: { kind: "free_access" as const, days: 1 }, accessUntil: NOW + 1 };
    expect(redemptionState(access, NOW)).toBe("access_running");
    expect(redemptionState(access, NOW + 1)).toBe("access_ended");
    const discount = { benefit: { kind: "amount" as const, amountFcfa: 1000 } };
    expect(redemptionState(discount, NOW)).toBe("discount_waiting");
    expect(redemptionState({ ...discount, appliedAt: NOW }, NOW)).toBe("discount_applied");
  });
});
