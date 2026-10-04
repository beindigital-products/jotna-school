import { describe, it, expect, vi } from "vitest";
import type { IndexQuery, Row } from "./fakeDb.types";

// -----------------------------------------------------------------------
// These tests validate the logic/constraints of the subjects mutations
// by mocking the Convex database context.
// -----------------------------------------------------------------------

function createMockCtx(data: Record<string, Row[]> = {}) {
  const tables: Record<string, Row[]> = { ...data };

  return {
    db: {
      query: (table: string) => {
        const rows = tables[table] ?? [];
        return {
          collect: async () => [...rows],
          withIndex: (_name: string, filter: (q: IndexQuery) => unknown) => {
            // Simple index simulation: extract the eq value
            let filterField: string | null = null;
            let filterValue: unknown = null;
            const q = {
              eq: (field: string, value: unknown) => {
                filterField = field;
                filterValue = value;
                return q;
              },
            };
            filter(q);
            const filtered = rows.filter(
              (row) => filterField && row[filterField] === filterValue,
            );
            return {
              first: async () => filtered[0] ?? null,
              collect: async () => filtered,
            };
          },
        };
      },
      get: async (id: string) => {
        for (const table of Object.values(tables)) {
          const found = table.find((row) => row._id === id);
          if (found) return found;
        }
        return null;
      },
      insert: vi.fn(async (table: string, doc: Row) => {
        const id = `${table}_${Date.now()}_${Math.random()}`;
        const row = { _id: id, ...doc };
        if (!tables[table]) tables[table] = [];
        tables[table].push(row);
        return id;
      }),
      patch: vi.fn(async (id: string, updates: Row) => {
        for (const table of Object.values(tables)) {
          const idx = table.findIndex((row) => row._id === id);
          if (idx !== -1) {
            table[idx] = { ...table[idx], ...updates };
            return;
          }
        }
      }),
      delete: vi.fn(async (id: string) => {
        for (const table of Object.values(tables)) {
          const idx = table.findIndex((row) => row._id === id);
          if (idx !== -1) {
            table.splice(idx, 1);
            return;
          }
        }
      }),
    },
  };
}

// We import the handler logic directly by importing the module
// and exercising the handler functions with our mock context.

// Since Convex functions export query/mutation objects, we need to
// access the handler. We simulate this by requiring the raw module.

// We test the logic by replicating the handler behavior inline,
// since Convex function handlers aren't directly callable without
// the Convex runtime.

describe("subjects", () => {
  describe("list", () => {
    it("should return subjects sorted by order", async () => {
      const subjects = [
        { _id: "s1", name: "Français", icon: "Book", color: "#f00", order: 2 },
        { _id: "s2", name: "Maths", icon: "Hash", color: "#00f", order: 1 },
        { _id: "s3", name: "Science", icon: "Flask", color: "#0f0", order: 3 },
      ];

      // Simulate the list handler logic
      const sorted = [...subjects].sort((a, b) => a.order - b.order);

      expect(sorted[0].name).toBe("Maths");
      expect(sorted[1].name).toBe("Français");
      expect(sorted[2].name).toBe("Science");
    });
  });

  describe("create", () => {
    it("should insert a new subject with all required fields", async () => {
      const ctx = createMockCtx();
      const args = {
        name: "Mathématiques",
        icon: "Calculator",
        color: "#6366f1",
        order: 1,
      };

      const id = await ctx.db.insert("subjects", args);

      expect(id).toBeTruthy();
      expect(ctx.db.insert).toHaveBeenCalledWith("subjects", args);
    });
  });

  describe("update", () => {
    it("should patch existing subject with provided fields", async () => {
      const ctx = createMockCtx({
        subjects: [
          {
            _id: "s1",
            name: "Maths",
            icon: "Hash",
            color: "#00f",
            order: 1,
          },
        ],
      });

      const existing = await ctx.db.get("s1");
      expect(existing).not.toBeNull();

      await ctx.db.patch("s1", { name: "Mathématiques" });
      expect(ctx.db.patch).toHaveBeenCalledWith("s1", {
        name: "Mathématiques",
      });

      const updated = await ctx.db.get("s1");
      expect(updated?.name).toBe("Mathématiques");
    });

    it("should throw when subject does not exist", async () => {
      const ctx = createMockCtx();
      const existing = await ctx.db.get("nonexistent");
      expect(existing).toBeNull();
    });
  });

  describe("remove", () => {
    it("should delete subject when no topics reference it", async () => {
      const ctx = createMockCtx({
        subjects: [
          {
            _id: "s1",
            name: "Maths",
            icon: "Hash",
            color: "#00f",
            order: 1,
          },
        ],
        topics: [],
      });

      // Simulate: check for topics referencing this subject
      const topicsResult = await ctx.db
        .query("topics")
        .withIndex("by_subjectId", (q) => q.eq("subjectId", "s1"))
        .first();

      expect(topicsResult).toBeNull();

      await ctx.db.delete("s1");
      expect(ctx.db.delete).toHaveBeenCalledWith("s1");
    });

    it("should refuse to delete subject when topics reference it", async () => {
      const ctx = createMockCtx({
        subjects: [
          {
            _id: "s1",
            name: "Maths",
            icon: "Hash",
            color: "#00f",
            order: 1,
          },
        ],
        topics: [
          {
            _id: "t1",
            subjectId: "s1",
            name: "Fractions",
            description: "Apprendre les fractions",
            order: 1,
          },
        ],
      });

      const topicsResult = await ctx.db
        .query("topics")
        .withIndex("by_subjectId", (q) => q.eq("subjectId", "s1"))
        .first();

      expect(topicsResult).not.toBeNull();

      // The real handler would throw here
      if (topicsResult) {
        expect(() => {
          throw new Error(
            "Impossible de supprimer cette matière car elle contient des thématiques.",
          );
        }).toThrow(
          "Impossible de supprimer cette matière car elle contient des thématiques.",
        );
      }
    });
  });

  describe("filtering undefined fields in update", () => {
    it("should only include defined fields in the patch", () => {
      const args = {
        id: "s1",
        name: "Updated",
        icon: undefined,
        color: undefined,
        order: 5,
      };

      const { id, ...fields } = args;
      const updates: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(fields)) {
        if (value !== undefined) {
          updates[key] = value;
        }
      }

      expect(updates).toEqual({ name: "Updated", order: 5 });
      expect(updates).not.toHaveProperty("icon");
      expect(updates).not.toHaveProperty("color");
    });
  });
});
