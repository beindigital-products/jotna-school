import { describe, it, expect } from "vitest";
import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { creditCauris, rewardBadge, rewardPalier, rewardQuests } from "../economy";
import { DAILY_PALIER_CAP, caurisForBadge, caurisForPalier, caurisForQuests } from "../economyRules";
import type { IndexQuery, Row } from "./fakeDb.types";

// Une base en mémoire, juste assez pour `economy.ts` : des tables, des index
// lus par égalité, `take`, `unique`, `insert`, `patch`. Elle exerce le VRAI
// code du versement (pas une copie) : ce qui est testé ici est ce qui tourne.
function fakeCtx() {
  const tables: Record<string, Row[]> = {};
  let serial = 0;
  const db = {
    query(table: string) {
      let rows = tables[table] ?? [];
      const chain = {
        withIndex(_name: string, build: (q: IndexQuery) => IndexQuery) {
          const wanted: [string, unknown][] = [];
          const q: IndexQuery = {
            eq(field, value) {
              wanted.push([field, value]);
              return q;
            },
          };
          build(q);
          rows = rows.filter((row) => wanted.every(([field, value]) => row[field] === value));
          return chain;
        },
        order() {
          return chain;
        },
        async take(count: number) {
          return rows.slice(0, count);
        },
        async unique() {
          if (rows.length > 1) throw new Error("plusieurs lignes pour une lecture unique");
          return rows[0] ?? null;
        },
      };
      return chain;
    },
    async insert(table: string, doc: Row) {
      const _id = `${table}:${++serial}`;
      (tables[table] ??= []).push({ _id, ...doc });
      return _id;
    },
    async patch(id: string, patch: Row) {
      for (const rows of Object.values(tables)) {
        const row = rows.find((candidate) => candidate._id === id);
        if (row) Object.assign(row, patch);
      }
    },
  };
  const wallet = () => (tables.wallets ?? [])[0];
  const ledger = () => tables.cauriLedger ?? [];
  return { ctx: { db } as unknown as MutationCtx, wallet, ledger };
}

const student = "profiles:eleve" as Id<"profiles">;
const attempt = (n: number) => `palierAttempts:${n}` as Id<"palierAttempts">;
const badge = (n: number) => `badges:${n}` as Id<"badges">;
// Des jours passés : `creditCauris` ne compte jamais une date du futur.
const day1 = Date.UTC(2026, 9, 5, 10);
const day2 = Date.UTC(2026, 9, 6, 10);

describe("creditCauris — verser sans jamais payer deux fois", () => {
  it("verse, ouvre la bourse et tient le journal", async () => {
    const { ctx, wallet, ledger } = fakeCtx();
    const gained = await creditCauris(ctx, student, { refKey: "chest:2026-10-05", target: 25, reason: "chest", at: day1 });
    expect(gained).toBe(25);
    expect(wallet()).toMatchObject({ studentId: student, cauris: 25, earnedTotal: 25 });
    expect(ledger()).toHaveLength(1);
    expect(ledger()[0]).toMatchObject({ amount: 25, reason: "chest", dayKey: "2026-10-05", refKey: "chest:2026-10-05" });
  });

  it("un second appel pour la même clé ne verse rien", async () => {
    const { ctx, wallet, ledger } = fakeCtx();
    await creditCauris(ctx, student, { refKey: "chest:2026-10-05", target: 25, reason: "chest", at: day1 });
    const again = await creditCauris(ctx, student, { refKey: "chest:2026-10-05", target: 25, reason: "chest", at: day1 });
    expect(again).toBe(0);
    expect(wallet()!.cauris).toBe(25);
    expect(ledger()).toHaveLength(1);
  });

  it("ne verse que la différence quand la cible monte", async () => {
    const { ctx, wallet } = fakeCtx();
    await creditCauris(ctx, student, { refKey: "quests:2026-10-05", target: 5, reason: "quests", at: day1 });
    const more = await creditCauris(ctx, student, { refKey: "quests:2026-10-05", target: 25, reason: "quests", at: day1 });
    expect(more).toBe(20);
    expect(wallet()!.cauris).toBe(25);
  });

  it("ne reprend rien quand la cible baisse", async () => {
    const { ctx, wallet } = fakeCtx();
    await creditCauris(ctx, student, { refKey: "quests:2026-10-05", target: 25, reason: "quests", at: day1 });
    const less = await creditCauris(ctx, student, { refKey: "quests:2026-10-05", target: 5, reason: "quests", at: day1 });
    expect(less).toBe(0);
    expect(wallet()!.cauris).toBe(25);
  });

  it("range un gain daté du futur au jour d'aujourd'hui, jamais au-delà", async () => {
    const { ctx, ledger } = fakeCtx();
    const inAYear = Date.now() + 365 * 86_400_000;
    await creditCauris(ctx, student, { refKey: "chest:futur", target: 15, reason: "chest", at: inAYear });
    expect(ledger()[0].at as number).toBeLessThanOrEqual(Date.now());
  });
});

describe("rewardPalier — les cauris d'une fin de palier", () => {
  it("paie les étoiles et le bonus du palier validé", async () => {
    const { ctx, wallet } = fakeCtx();
    const gained = await rewardPalier(ctx, student, attempt(1), { stars: 24, validated: true }, day1);
    expect(gained).toBe(caurisForPalier({ stars: 24, validated: true }));
    expect(wallet()!.cauris).toBe(gained);
  });

  it("la même tentative notée deux fois n'est payée qu'une fois", async () => {
    const { ctx, wallet } = fakeCtx();
    const first = await rewardPalier(ctx, student, attempt(1), { stars: 24, validated: true }, day1);
    const second = await rewardPalier(ctx, student, attempt(1), { stars: 24, validated: true }, day1);
    expect(second).toBe(0);
    expect(wallet()!.cauris).toBe(first);
  });

  it("après une nouvelle chance, seules les étoiles gagnées en plus sont payées", async () => {
    const { ctx, wallet } = fakeCtx();
    await rewardPalier(ctx, student, attempt(1), { stars: 14, validated: false }, day1);
    const second = await rewardPalier(ctx, student, attempt(1), { stars: 22, validated: true }, day1);
    expect(second).toBe(caurisForPalier({ stars: 22, validated: true }) - 14);
    expect(wallet()!.cauris).toBe(caurisForPalier({ stars: 22, validated: true }));
  });

  it("s'arrête au plafond du jour, et repart le lendemain", async () => {
    const { ctx, wallet } = fakeCtx();
    const perPalier = caurisForPalier({ stars: 30, validated: true });
    let paid = 0;
    for (let n = 1; n <= 6; n++) {
      paid += await rewardPalier(ctx, student, attempt(n), { stars: 30, validated: true }, day1);
    }
    expect(perPalier * 6).toBeGreaterThan(DAILY_PALIER_CAP);
    expect(paid).toBe(DAILY_PALIER_CAP);
    expect(wallet()!.cauris).toBe(DAILY_PALIER_CAP);

    const nextDay = await rewardPalier(ctx, student, attempt(7), { stars: 30, validated: true }, day2);
    expect(nextDay).toBe(perPalier);
  });

  it("le plafond des paliers ne retient pas les missions ni les trophées", async () => {
    const { ctx, wallet } = fakeCtx();
    for (let n = 1; n <= 6; n++) {
      await rewardPalier(ctx, student, attempt(n), { stars: 30, validated: true }, day1);
    }
    const quests = await rewardQuests(ctx, student, "2026-10-05", 3, 3, day1);
    const trophy = await rewardBadge(ctx, student, badge(1), "rare", day1);
    expect(quests).toBe(caurisForQuests(3, 3));
    expect(trophy).toBe(caurisForBadge("rare"));
    expect(wallet()!.cauris).toBe(DAILY_PALIER_CAP + quests + trophy);
  });
});

describe("rewardQuests et rewardBadge", () => {
  it("les missions se paient au fil de la journée, sans doublon", async () => {
    const { ctx, wallet } = fakeCtx();
    expect(await rewardQuests(ctx, student, "2026-10-05", 1, 3, day1)).toBe(caurisForQuests(1, 3));
    expect(await rewardQuests(ctx, student, "2026-10-05", 1, 3, day1)).toBe(0);
    expect(await rewardQuests(ctx, student, "2026-10-05", 3, 3, day1)).toBe(caurisForQuests(3, 3) - caurisForQuests(1, 3));
    expect(wallet()!.cauris).toBe(caurisForQuests(3, 3));
  });

  it("un trophée ne rapporte qu'une fois", async () => {
    const { ctx, wallet } = fakeCtx();
    expect(await rewardBadge(ctx, student, badge(1), "epic", day1)).toBe(caurisForBadge("epic"));
    expect(await rewardBadge(ctx, student, badge(1), "epic", day2)).toBe(0);
    expect(await rewardBadge(ctx, student, badge(2), undefined, day2)).toBe(caurisForBadge("common"));
    expect(wallet()!.cauris).toBe(caurisForBadge("epic") + caurisForBadge("common"));
    expect(wallet()!.earnedTotal).toBe(wallet()!.cauris);
  });
});
