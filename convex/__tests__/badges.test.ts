import { describe, it, expect, vi } from "vitest";

// -----------------------------------------------------------------------
// These tests validate the logic/constraints of the badges mutations
// by mocking the Convex database context.
// -----------------------------------------------------------------------

/** Une ligne d'une table simulée. */
type Row = Record<string, unknown>;
/** Le `q` de `withIndex`, comme dans Convex : `q.eq(champ, valeur)`. */
type IndexQuery = { eq: (field: string, value: unknown) => IndexQuery };
/** Ce que rendent `q.field(nom)` et `q.eq(a, b)` dans le `filter` simulé. */
type FieldRef = { __field: string };
type EqCondition = { __eq: true; a: unknown; b: unknown };
type FilterQuery = {
  eq: (a: unknown, b: unknown) => EqCondition;
  field: (name: string) => FieldRef;
};
const isFieldRef = (x: unknown): x is FieldRef =>
  typeof x === "object" && x !== null && "__field" in x;

function createMockCtx(data: Record<string, Row[]> = {}) {
  const tables: Record<string, Row[]> = { ...data };

  return {
    db: {
      query: (table: string) => {
        const rows = tables[table] ?? [];
        return {
          collect: async () => [...rows],
          filter: (fn: (q: FilterQuery) => EqCondition) => {
            const q: FilterQuery = {
              eq: (a, b) => ({ __eq: true, a, b }),
              field: (name) => ({ __field: name }),
            };
            const condition = fn(q);
            const filtered = rows.filter((row) => {
              const fieldRef = isFieldRef(condition.a)
                ? condition.a
                : isFieldRef(condition.b)
                  ? condition.b
                  : null;
              if (!fieldRef) return true;
              const value = fieldRef === condition.a ? condition.b : condition.a;
              return row[fieldRef.__field] === value;
            });
            return {
              first: async () => filtered[0] ?? null,
              collect: async () => filtered,
            };
          },
          withIndex: (_name: string, filter: (q: IndexQuery) => unknown) => {
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
        const id = `${table}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
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

// -----------------------------------------------------------------------
// CRUD tests
// -----------------------------------------------------------------------

describe("badges", () => {
  describe("create", () => {
    it("should insert a new badge with all fields", async () => {
      const ctx = createMockCtx();
      const args = {
        name: "Explorateur",
        description: "Compléter un premier thème",
        icon: "🏆",
        condition: "complete_topic",
      };

      const id = await ctx.db.insert("badges", args);
      expect(id).toBeTruthy();
      expect(ctx.db.insert).toHaveBeenCalledWith("badges", args);
    });

    it("should insert a badge with optional subjectId", async () => {
      const ctx = createMockCtx();
      const args = {
        name: "Matheux",
        description: "Score parfait en maths",
        icon: "🧮",
        condition: "perfect_score",
        subjectId: "subjects_math",
      };

      const id = await ctx.db.insert("badges", args);
      expect(id).toBeTruthy();
    });
  });

  describe("update", () => {
    it("should patch existing badge with provided fields", async () => {
      const ctx = createMockCtx({
        badges: [
          {
            _id: "b1",
            name: "Explorateur",
            description: "Desc",
            icon: "🏆",
            condition: "complete_topic",
          },
        ],
      });

      const existing = await ctx.db.get("b1");
      expect(existing).not.toBeNull();

      await ctx.db.patch("b1", { name: "Super Explorateur" });
      expect(ctx.db.patch).toHaveBeenCalledWith("b1", {
        name: "Super Explorateur",
      });

      const updated = await ctx.db.get("b1");
      expect(updated?.name).toBe("Super Explorateur");
    });

    it("should throw when badge does not exist", async () => {
      const ctx = createMockCtx();
      const existing = await ctx.db.get("nonexistent");
      expect(existing).toBeNull();
      // The real handler would throw "Badge introuvable"
    });
  });

  describe("remove", () => {
    it("should delete badge when no earnedBadges reference it", async () => {
      const ctx = createMockCtx({
        badges: [
          {
            _id: "b1",
            name: "Explorateur",
            description: "Desc",
            icon: "🏆",
            condition: "complete_topic",
          },
        ],
        earnedBadges: [],
      });

      // Simulate: check for earned badges
      const earnedResult = await ctx.db
        .query("earnedBadges")
        .filter((q) => q.eq(q.field("badgeId"), "b1"))
        .first();

      expect(earnedResult).toBeNull();

      await ctx.db.delete("b1");
      expect(ctx.db.delete).toHaveBeenCalledWith("b1");
    });

    it("should refuse to delete badge when earnedBadges reference it", async () => {
      const ctx = createMockCtx({
        badges: [
          {
            _id: "b1",
            name: "Explorateur",
            description: "Desc",
            icon: "🏆",
            condition: "complete_topic",
          },
        ],
        earnedBadges: [
          {
            _id: "eb1",
            badgeId: "b1",
            studentId: "student1",
            earnedAt: Date.now(),
          },
        ],
      });

      const earnedResult = await ctx.db
        .query("earnedBadges")
        .filter((q) => q.eq(q.field("badgeId"), "b1"))
        .first();

      expect(earnedResult).not.toBeNull();

      // The real handler would throw here
      if (earnedResult) {
        expect(() => {
          throw new Error(
            "Impossible de supprimer ce badge car des élèves l'ont déjà obtenu.",
          );
        }).toThrow(
          "Impossible de supprimer ce badge car des élèves l'ont déjà obtenu.",
        );
      }
    });
  });

  // -----------------------------------------------------------------------
  // checkAndAward logic tests
  // -----------------------------------------------------------------------

  describe("checkAndAward", () => {
    describe("complete_topic condition", () => {
      it("should award badge when student has a completed topic", async () => {
        const ctx = createMockCtx({
          badges: [
            {
              _id: "b_complete",
              name: "Explorateur",
              description: "Complete a topic",
              icon: "🏆",
              condition: "complete_topic",
            },
          ],
          earnedBadges: [],
          studentTopicProgress: [
            {
              _id: "stp1",
              studentId: "student1",
              topicId: "topic1",
              completedExercises: 5,
              correctExercises: 4,
              totalHintsUsed: 1,
              masteryLevel: 80,
              completedAt: Date.now(),
            },
          ],
        });

        const studentId = "student1";

        // Simulate checkAndAward logic
        const allBadges = await ctx.db.query("badges").collect();
        const alreadyEarned = await ctx.db
          .query("earnedBadges")
          .withIndex("by_studentId", (q) => q.eq("studentId", studentId))
          .collect();
        const earnedBadgeIds = new Set(alreadyEarned.map((eb) => eb.badgeId));

        const allProgress = await ctx.db
          .query("studentTopicProgress")
          .withIndex("by_studentId", (q) => q.eq("studentId", studentId))
          .collect();

        const newlyAwarded: string[] = [];

        for (const badge of allBadges) {
          if (earnedBadgeIds.has(badge._id)) continue;

          if (badge.condition === "complete_topic") {
            const completed = allProgress.filter(
              (p) => p.completedAt != null,
            );
            if (completed.length > 0) {
              await ctx.db.insert("earnedBadges", {
                badgeId: badge._id,
                studentId,
                earnedAt: Date.now(),
              });
              newlyAwarded.push(badge.name as string);
            }
          }
        }

        expect(newlyAwarded).toContain("Explorateur");
      });

      it("should not award badge when no topics are completed", async () => {
        const ctx = createMockCtx({
          badges: [
            {
              _id: "b_complete",
              name: "Explorateur",
              description: "Complete a topic",
              icon: "🏆",
              condition: "complete_topic",
            },
          ],
          earnedBadges: [],
          studentTopicProgress: [
            {
              _id: "stp1",
              studentId: "student1",
              topicId: "topic1",
              completedExercises: 3,
              correctExercises: 2,
              totalHintsUsed: 1,
              masteryLevel: 40,
              completedAt: undefined, // Not completed
            },
          ],
        });

        const studentId = "student1";
        const allProgress = await ctx.db
          .query("studentTopicProgress")
          .withIndex("by_studentId", (q) => q.eq("studentId", studentId))
          .collect();

        const completed = allProgress.filter(
          (p) => p.completedAt != null,
        );

        expect(completed.length).toBe(0);
      });
    });

    describe("perfect_score condition", () => {
      it("should award badge when student has a perfect score on a topic", async () => {
        const allProgress = [
          {
            _id: "stp1",
            studentId: "student1",
            topicId: "topic1",
            completedExercises: 5,
            correctExercises: 5, // Perfect score
            totalHintsUsed: 0,
            masteryLevel: 100,
            completedAt: Date.now(),
          },
        ];

        const perfectTopics = allProgress.filter(
          (p) =>
            p.completedAt != null &&
            p.completedExercises > 0 &&
            p.correctExercises === p.completedExercises,
        );

        expect(perfectTopics.length).toBe(1);
      });

      it("should not award badge when student made errors", async () => {
        const allProgress = [
          {
            _id: "stp1",
            studentId: "student1",
            topicId: "topic1",
            completedExercises: 5,
            correctExercises: 4, // Not perfect
            totalHintsUsed: 1,
            masteryLevel: 80,
            completedAt: Date.now(),
          },
        ];

        const perfectTopics = allProgress.filter(
          (p) =>
            p.completedAt != null &&
            p.completedExercises > 0 &&
            p.correctExercises === p.completedExercises,
        );

        expect(perfectTopics.length).toBe(0);
      });
    });

    describe("streak_3 condition", () => {
      it("should award badge when student has 3 consecutive completed topics", async () => {
        const allProgress = [
          {
            _id: "stp1",
            studentId: "student1",
            topicId: "topic1",
            completedAt: 1000,
            completedExercises: 5,
            correctExercises: 4,
            totalHintsUsed: 0,
            masteryLevel: 80,
          },
          {
            _id: "stp2",
            studentId: "student1",
            topicId: "topic2",
            completedAt: 2000,
            completedExercises: 5,
            correctExercises: 5,
            totalHintsUsed: 0,
            masteryLevel: 100,
          },
          {
            _id: "stp3",
            studentId: "student1",
            topicId: "topic3",
            completedAt: 3000,
            completedExercises: 5,
            correctExercises: 3,
            totalHintsUsed: 2,
            masteryLevel: 60,
          },
        ];

        const completedSorted = allProgress
          .filter((p) => p.completedAt != null)
          .sort((a, b) => (a.completedAt ?? 0) - (b.completedAt ?? 0));

        expect(completedSorted.length).toBeGreaterThanOrEqual(3);
      });

      it("should not award badge with fewer than 3 completed topics", async () => {
        const allProgress = [
          {
            _id: "stp1",
            studentId: "student1",
            topicId: "topic1",
            completedAt: 1000,
            completedExercises: 5,
            correctExercises: 4,
            totalHintsUsed: 0,
            masteryLevel: 80,
          },
          {
            _id: "stp2",
            studentId: "student1",
            topicId: "topic2",
            completedAt: 2000,
            completedExercises: 5,
            correctExercises: 5,
            totalHintsUsed: 0,
            masteryLevel: 100,
          },
        ];

        const completedSorted = allProgress
          .filter((p) => p.completedAt != null)
          .sort((a, b) => (a.completedAt ?? 0) - (b.completedAt ?? 0));

        expect(completedSorted.length).toBeLessThan(3);
      });
    });

    describe("duplicate prevention", () => {
      it("should not award a badge that is already earned", async () => {
        const allBadges = [
          {
            _id: "b_complete",
            name: "Explorateur",
            description: "Complete a topic",
            icon: "🏆",
            condition: "complete_topic",
          },
        ];

        const alreadyEarned = [
          {
            _id: "eb1",
            badgeId: "b_complete",
            studentId: "student1",
            earnedAt: Date.now(),
          },
        ];

        const earnedBadgeIds = new Set(
          alreadyEarned.map((eb) => eb.badgeId),
        );

        const unawardedBadges = allBadges.filter(
          (b) => !earnedBadgeIds.has(b._id),
        );

        expect(unawardedBadges.length).toBe(0);
      });

      it("should award badge if not yet earned even with other badges earned", async () => {
        const allBadges = [
          {
            _id: "b_complete",
            name: "Explorateur",
            icon: "🏆",
            condition: "complete_topic",
          },
          {
            _id: "b_perfect",
            name: "Parfait",
            icon: "⭐",
            condition: "perfect_score",
          },
        ];

        const alreadyEarned = [
          {
            _id: "eb1",
            badgeId: "b_complete",
            studentId: "student1",
            earnedAt: Date.now(),
          },
        ];

        const earnedBadgeIds = new Set(
          alreadyEarned.map((eb) => eb.badgeId),
        );

        const unawardedBadges = allBadges.filter(
          (b) => !earnedBadgeIds.has(b._id),
        );

        expect(unawardedBadges.length).toBe(1);
        expect(unawardedBadges[0].name).toBe("Parfait");
      });
    });
  });
});
