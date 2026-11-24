import { describe, expect, it } from "vitest";
import {
  isCodeThrottled,
  MAX_FAILURES,
  recordCodeFailure,
  WINDOW_MS,
} from "../codeAttempts";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

/** Une base minimale : la seule table `codeAttempts`, avec son index par profil. */
function fakeCtx() {
  const rows: {
    _id: string;
    profileId: string;
    windowStart: number;
    failures: number;
  }[] = [];
  const ctx = {
    db: {
      query: () => ({
        withIndex: (_name: string, build: (q: { eq: (f: string, v: string) => string }) => string) => {
          const profileId = build({ eq: (_f, v) => v });
          return { first: async () => rows.find((r) => r.profileId === profileId) ?? null };
        },
      }),
      insert: async (_table: string, doc: Omit<(typeof rows)[number], "_id">) => {
        rows.push({ _id: `row${rows.length}`, ...doc });
      },
      patch: async (id: string, fields: Partial<(typeof rows)[number]>) => {
        Object.assign(rows.find((r) => r._id === id)!, fields);
      },
    },
  };
  return ctx as unknown as MutationCtx;
}

const teacher = "profile1" as Id<"profiles">;

describe("le frein sur les codes élèves", () => {
  it("laisse passer tant que les échecs restent sous la limite", async () => {
    const ctx = fakeCtx();
    for (let i = 0; i < MAX_FAILURES - 1; i++) await recordCodeFailure(ctx, teacher, 1000);
    expect(await isCodeThrottled(ctx, teacher, 1000)).toBe(false);
  });

  it("freine à la limite", async () => {
    const ctx = fakeCtx();
    for (let i = 0; i < MAX_FAILURES; i++) await recordCodeFailure(ctx, teacher, 1000);
    expect(await isCodeThrottled(ctx, teacher, 1000)).toBe(true);
  });

  it("libère quand la fenêtre est finie", async () => {
    const ctx = fakeCtx();
    for (let i = 0; i < MAX_FAILURES; i++) await recordCodeFailure(ctx, teacher, 1000);
    expect(await isCodeThrottled(ctx, teacher, 1000 + WINDOW_MS)).toBe(false);
  });

  it("repart de un échec dans une nouvelle fenêtre", async () => {
    const ctx = fakeCtx();
    for (let i = 0; i < MAX_FAILURES; i++) await recordCodeFailure(ctx, teacher, 1000);
    await recordCodeFailure(ctx, teacher, 1000 + WINDOW_MS);
    expect(await isCodeThrottled(ctx, teacher, 1000 + WINDOW_MS)).toBe(false);
  });

  it("ne freine pas un professeur qui n'a rien raté", async () => {
    expect(await isCodeThrottled(fakeCtx(), teacher, 1000)).toBe(false);
  });
});
