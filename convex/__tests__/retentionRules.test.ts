import { describe, expect, it } from "vitest";

import {
  classifyCustomer,
  nextSchoolYear,
  renewalCohorts,
  schoolYearOf,
  type Contract,
} from "../retentionRules";

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2027, 2, 15); // 15 mars 2027, année 2026-2027

function contract(patch: Partial<Contract>): Contract {
  return {
    status: "active",
    startsAt: Date.UTC(2026, 9, 1),
    endsAt: Date.UTC(2027, 6, 31),
    seats: 50,
    totalFcfa: 250_000,
    ...patch,
  };
}

describe("année scolaire", () => {
  it("commence le 1er septembre", () => {
    expect(schoolYearOf(Date.UTC(2026, 8, 1))).toBe("2026-2027");
    expect(schoolYearOf(Date.UTC(2026, 7, 31))).toBe("2025-2026");
    expect(schoolYearOf(Date.UTC(2027, 1, 10))).toBe("2026-2027");
    expect(nextSchoolYear("2026-2027")).toBe("2027-2028");
  });
});

describe("classifyCustomer", () => {
  it("abonné, loin de la fin", () => {
    expect(classifyCustomer([contract({})], NOW)).toMatchObject({
      status: "active",
      riskReason: null,
      renewed: false,
      lastSeats: 50,
      schoolYears: ["2026-2027"],
      lifetimeFcfa: 250_000,
    });
  });

  it("en retard de paiement : à risque", () => {
    expect(classifyCustomer([contract({ status: "past_due" })], NOW)).toMatchObject({
      status: "at_risk",
      riskReason: "past_due",
    });
  });

  it("fin dans moins de 60 jours sans suite : à risque, sauf renouvelé", () => {
    const ending = contract({ endsAt: NOW + 30 * DAY });
    expect(classifyCustomer([ending], NOW)).toMatchObject({
      status: "at_risk",
      riskReason: "ending_soon",
    });
    const next = contract({
      status: "pending_payment",
      startsAt: NOW + 31 * DAY,
      endsAt: NOW + 400 * DAY,
    });
    expect(classifyCustomer([ending, next], NOW)).toMatchObject({
      status: "active",
      renewed: true,
    });
  });

  it("parti : dernier contrat fini, rien après", () => {
    const old = contract({ startsAt: Date.UTC(2025, 9, 1), endsAt: Date.UTC(2026, 6, 31) });
    expect(classifyCustomer([old], NOW)).toMatchObject({
      status: "churned",
      lastEndsAt: Date.UTC(2026, 6, 31),
      schoolYears: ["2025-2026"],
    });
  });

  it("un contrat jamais payé ne fait pas un client", () => {
    expect(classifyCustomer([contract({ status: "pending_payment" })], NOW).status).toBe(
      "pending",
    );
    expect(classifyCustomer([contract({ status: "draft" })], NOW).status).toBe("prospect");
  });
});

describe("renewalCohorts", () => {
  it("calcule le taux des années finies seulement", () => {
    const rows = renewalCohorts(
      [
        { schoolYears: ["2025-2026", "2026-2027"] },
        { schoolYears: ["2025-2026"] },
        { schoolYears: ["2026-2027"] },
      ],
      NOW,
    );
    expect(rows).toEqual([
      { schoolYear: "2025-2026", customers: 2, renewed: 1, renewalRate: 50 },
      { schoolYear: "2026-2027", customers: 2, renewed: 0, renewalRate: null },
    ]);
  });
});
