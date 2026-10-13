import { describe, expect, it } from "vitest";
import type { ActionCtx } from "../_generated/server";
import { allPalierIds } from "../paliers/pregen";

/** Un déploiement de 5 paliers servi par pages de 2 : le scan doit tous les rendre. */
function fakeCtx(total: number, pageSize: number) {
  const all = Array.from({ length: total }, (_, i) => `p${i}`);
  const calls: (string | null)[] = [];
  const ctx = {
    runQuery: async (_ref: unknown, args: { cursor: string | null; numItems: number }) => {
      calls.push(args.cursor);
      const start = args.cursor === null ? 0 : Number(args.cursor);
      const ids = all.slice(start, start + pageSize);
      const next = start + pageSize;
      return { ids, isDone: next >= total, cursor: String(next) };
    },
  };
  return { ctx: ctx as unknown as ActionCtx, calls };
}

describe("allPalierIds", () => {
  it("lit toutes les pages, sans plafond à 1 000", async () => {
    const { ctx, calls } = fakeCtx(1028, 200);
    const ids = await allPalierIds(ctx);
    expect(ids).toHaveLength(1028);
    expect(new Set(ids).size).toBe(1028);
    expect(calls).toEqual([null, "200", "400", "600", "800", "1000"]);
  });

  it("rend une liste vide pour un déploiement vide", async () => {
    const { ctx } = fakeCtx(0, 200);
    expect(await allPalierIds(ctx)).toEqual([]);
  });
});
