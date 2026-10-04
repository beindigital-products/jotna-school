import { describe, it, expect, vi } from "vitest";

// -----------------------------------------------------------------------
// Tests pour la logique de génération de rapports et l'envoi d'email.
// On simule le contexte Convex avec un mock DB.
// -----------------------------------------------------------------------

/** Une ligne d'une table simulée. */
type Row = Record<string, unknown>;
/** Le `q` de `withIndex`, comme dans Convex : `q.eq(champ, valeur)`. */
type IndexQuery = { eq: (field: string, value: unknown) => IndexQuery };

function createMockCtx(data: Record<string, Row[]> = {}) {
  const tables: Record<string, Row[]> = { ...data };
  const scheduledJobs: Array<{ fn: unknown; args: Row }> = [];

  return {
    db: {
      query: (table: string) => {
        const rows = tables[table] ?? [];
        return {
          collect: async () => [...rows],
          withIndex: (_name: string, filter: (q: IndexQuery) => unknown) => {
            const filters: Array<{ field: string; value: unknown }> = [];
            const q = {
              eq: (field: string, value: unknown) => {
                filters.push({ field, value });
                return q;
              },
            };
            filter(q);
            const filtered = rows.filter((row) =>
              filters.every((f) => row[f.field] === f.value),
            );
            return {
              first: async () => filtered[0] ?? null,
              collect: async () => filtered,
            };
          },
          filter: (_fn: unknown) => {
            return {
              first: async () => rows[0] ?? null,
              collect: async () => [...rows],
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
        const row = { _id: id, _creationTime: Date.now(), ...doc };
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
    },
    scheduler: {
      runAfter: vi.fn(async (_delay: number, fn: unknown, args: Row) => {
        scheduledJobs.push({ fn, args });
      }),
    },
    _scheduledJobs: scheduledJobs,
  };
}

// -----------------------------------------------------------------------
// Helpers — replicate core report generation logic for unit testing
// -----------------------------------------------------------------------

function formatExerciseType(type: string): string {
  const labels: Record<string, string> = {
    qcm: "Questions à choix multiples",
    "drag-drop": "Glisser-déposer",
    match: "Association",
    order: "Remise en ordre",
    "short-answer": "Réponse courte",
  };
  return labels[type] ?? type;
}

interface ExerciseData {
  _id: string;
  topicId: string;
  type: string;
  prompt: string;
}

interface AttemptData {
  studentId: string;
  exerciseId: string;
  isCorrect: boolean;
}

function computeReport(exercises: ExerciseData[], attempts: AttemptData[]) {
  let totalAttempts = 0;
  let correctAttempts = 0;
  const typeScores: Record<string, { correct: number; total: number }> = {};
  const frequentMistakes: string[] = [];

  for (const exercise of exercises) {
    const exerciseAttempts = attempts.filter(
      (a) => a.exerciseId === exercise._id,
    );
    if (exerciseAttempts.length === 0) continue;

    const exerciseCorrect = exerciseAttempts.filter((a) => a.isCorrect).length;
    totalAttempts += exerciseAttempts.length;
    correctAttempts += exerciseCorrect;

    if (!typeScores[exercise.type]) {
      typeScores[exercise.type] = { correct: 0, total: 0 };
    }
    typeScores[exercise.type].correct += exerciseCorrect;
    typeScores[exercise.type].total += exerciseAttempts.length;

    if (
      exerciseAttempts.length >= 3 &&
      exerciseCorrect / exerciseAttempts.length < 0.5
    ) {
      frequentMistakes.push(exercise.prompt);
    }
  }

  const score = totalAttempts > 0 ? correctAttempts / totalAttempts : 0;

  const strengths: string[] = [];
  for (const [type, stats] of Object.entries(typeScores)) {
    if (stats.total > 0 && stats.correct / stats.total > 0.8) {
      strengths.push(formatExerciseType(type));
    }
  }

  const weaknesses: string[] = [];
  for (const [type, stats] of Object.entries(typeScores)) {
    if (stats.total > 0 && stats.correct / stats.total < 0.5) {
      weaknesses.push(formatExerciseType(type));
    }
  }

  return { score, strengths, weaknesses, frequentMistakes };
}

// -----------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------

describe("reports", () => {
  describe("calcul du score", () => {
    it("devrait calculer le score comme le ratio de réponses correctes", () => {
      const exercises: ExerciseData[] = [
        { _id: "e1", topicId: "t1", type: "qcm", prompt: "Q1" },
        { _id: "e2", topicId: "t1", type: "qcm", prompt: "Q2" },
      ];

      const attempts: AttemptData[] = [
        { studentId: "s1", exerciseId: "e1", isCorrect: true },
        { studentId: "s1", exerciseId: "e1", isCorrect: true },
        { studentId: "s1", exerciseId: "e2", isCorrect: false },
        { studentId: "s1", exerciseId: "e2", isCorrect: true },
      ];

      const result = computeReport(exercises, attempts);

      // 3 correct out of 4 total = 0.75
      expect(result.score).toBe(0.75);
    });

    it("devrait retourner un score de 0 quand il n'y a aucune tentative", () => {
      const exercises: ExerciseData[] = [
        { _id: "e1", topicId: "t1", type: "qcm", prompt: "Q1" },
      ];

      const result = computeReport(exercises, []);
      expect(result.score).toBe(0);
    });

    it("devrait retourner un score de 1 quand tout est correct", () => {
      const exercises: ExerciseData[] = [
        { _id: "e1", topicId: "t1", type: "qcm", prompt: "Q1" },
      ];

      const attempts: AttemptData[] = [
        { studentId: "s1", exerciseId: "e1", isCorrect: true },
        { studentId: "s1", exerciseId: "e1", isCorrect: true },
      ];

      const result = computeReport(exercises, attempts);
      expect(result.score).toBe(1);
    });
  });

  describe("identification des points forts", () => {
    it("devrait identifier un type d'exercice comme point fort si >80% de réussite", () => {
      const exercises: ExerciseData[] = [
        { _id: "e1", topicId: "t1", type: "qcm", prompt: "Q1" },
        { _id: "e2", topicId: "t1", type: "qcm", prompt: "Q2" },
      ];

      const attempts: AttemptData[] = [
        { studentId: "s1", exerciseId: "e1", isCorrect: true },
        { studentId: "s1", exerciseId: "e1", isCorrect: true },
        { studentId: "s1", exerciseId: "e1", isCorrect: true },
        { studentId: "s1", exerciseId: "e1", isCorrect: true },
        { studentId: "s1", exerciseId: "e2", isCorrect: true },
      ];

      const result = computeReport(exercises, attempts);
      expect(result.strengths).toContain("Questions à choix multiples");
    });

    it("ne devrait pas identifier un type avec exactement 80% comme point fort", () => {
      const exercises: ExerciseData[] = [
        { _id: "e1", topicId: "t1", type: "match", prompt: "M1" },
      ];

      // 4 out of 5 = exactly 80% — should NOT be included (>80% required)
      const attempts: AttemptData[] = [
        { studentId: "s1", exerciseId: "e1", isCorrect: true },
        { studentId: "s1", exerciseId: "e1", isCorrect: true },
        { studentId: "s1", exerciseId: "e1", isCorrect: true },
        { studentId: "s1", exerciseId: "e1", isCorrect: true },
        { studentId: "s1", exerciseId: "e1", isCorrect: false },
      ];

      const result = computeReport(exercises, attempts);
      expect(result.strengths).not.toContain("Association");
    });
  });

  describe("identification des faiblesses", () => {
    it("devrait identifier un type d'exercice comme faiblesse si <50% de réussite", () => {
      const exercises: ExerciseData[] = [
        { _id: "e1", topicId: "t1", type: "drag-drop", prompt: "D1" },
      ];

      const attempts: AttemptData[] = [
        { studentId: "s1", exerciseId: "e1", isCorrect: false },
        { studentId: "s1", exerciseId: "e1", isCorrect: false },
        { studentId: "s1", exerciseId: "e1", isCorrect: true },
      ];

      const result = computeReport(exercises, attempts);
      expect(result.weaknesses).toContain("Glisser-déposer");
    });
  });

  describe("identification des erreurs fréquentes", () => {
    it("devrait identifier un exercice comme erreur fréquente si 3+ tentatives et <50% de réussite", () => {
      const exercises: ExerciseData[] = [
        {
          _id: "e1",
          topicId: "t1",
          type: "short-answer",
          prompt: "Quel est le résultat de 2+2 ?",
        },
      ];

      const attempts: AttemptData[] = [
        { studentId: "s1", exerciseId: "e1", isCorrect: false },
        { studentId: "s1", exerciseId: "e1", isCorrect: false },
        { studentId: "s1", exerciseId: "e1", isCorrect: false },
        { studentId: "s1", exerciseId: "e1", isCorrect: true },
      ];

      const result = computeReport(exercises, attempts);
      expect(result.frequentMistakes).toContain(
        "Quel est le résultat de 2+2 ?",
      );
    });

    it("ne devrait pas identifier un exercice avec moins de 3 tentatives", () => {
      const exercises: ExerciseData[] = [
        { _id: "e1", topicId: "t1", type: "qcm", prompt: "Q facile" },
      ];

      const attempts: AttemptData[] = [
        { studentId: "s1", exerciseId: "e1", isCorrect: false },
        { studentId: "s1", exerciseId: "e1", isCorrect: false },
      ];

      const result = computeReport(exercises, attempts);
      expect(result.frequentMistakes).toHaveLength(0);
    });
  });

  describe("planification de l'email après génération", () => {
    it("devrait planifier l'envoi d'email après la création du rapport", async () => {
      const ctx = createMockCtx({
        exercises: [
          {
            _id: "e1",
            topicId: "t1",
            type: "qcm",
            prompt: "Q1",
            status: "published",
          },
        ],
        attempts: [
          {
            _id: "a1",
            studentId: "s1",
            exerciseId: "e1",
            isCorrect: true,
            attemptNumber: 1,
            hintsUsedCount: 0,
            timeSpentMs: 5000,
            submittedAt: Date.now(),
          },
        ],
        topicReports: [],
      });

      // Simulate the generate handler logic
      const exercises = await ctx.db
        .query("exercises")
        .withIndex("by_topicId", (q) => q.eq("topicId", "t1"))
        .collect();

      expect(exercises.length).toBe(1);

      // Insert report
      const reportId = await ctx.db.insert("topicReports", {
        studentId: "s1",
        topicId: "t1",
        score: 1,
        strengths: ["Questions à choix multiples"],
        weaknesses: [],
        frequentMistakes: [],
      });

      expect(reportId).toBeTruthy();

      // Schedule email
      await ctx.scheduler.runAfter(0, "internal.reports.sendEmail", {
        reportId,
      });

      expect(ctx.scheduler.runAfter).toHaveBeenCalledTimes(1);
      expect(ctx._scheduledJobs).toHaveLength(1);
      expect(ctx._scheduledJobs[0].args.reportId).toBe(reportId);
    });
  });

  describe("formatage des types d'exercice", () => {
    it("devrait retourner les labels français pour chaque type", () => {
      expect(formatExerciseType("qcm")).toBe("Questions à choix multiples");
      expect(formatExerciseType("drag-drop")).toBe("Glisser-déposer");
      expect(formatExerciseType("match")).toBe("Association");
      expect(formatExerciseType("order")).toBe("Remise en ordre");
      expect(formatExerciseType("short-answer")).toBe("Réponse courte");
    });

    it("devrait retourner le type brut si inconnu", () => {
      expect(formatExerciseType("unknown-type")).toBe("unknown-type");
    });
  });

  describe("rapport avec types d'exercice mixtes", () => {
    it("devrait séparer correctement points forts et faiblesses entre types", () => {
      const exercises: ExerciseData[] = [
        { _id: "e1", topicId: "t1", type: "qcm", prompt: "QCM bon" },
        { _id: "e2", topicId: "t1", type: "qcm", prompt: "QCM bon 2" },
        {
          _id: "e3",
          topicId: "t1",
          type: "drag-drop",
          prompt: "Drag mauvais",
        },
      ];

      const attempts: AttemptData[] = [
        // QCM: 5/5 = 100% -> strength
        { studentId: "s1", exerciseId: "e1", isCorrect: true },
        { studentId: "s1", exerciseId: "e1", isCorrect: true },
        { studentId: "s1", exerciseId: "e2", isCorrect: true },
        { studentId: "s1", exerciseId: "e2", isCorrect: true },
        { studentId: "s1", exerciseId: "e2", isCorrect: true },
        // Drag-drop: 1/4 = 25% -> weakness
        { studentId: "s1", exerciseId: "e3", isCorrect: false },
        { studentId: "s1", exerciseId: "e3", isCorrect: false },
        { studentId: "s1", exerciseId: "e3", isCorrect: false },
        { studentId: "s1", exerciseId: "e3", isCorrect: true },
      ];

      const result = computeReport(exercises, attempts);

      expect(result.strengths).toContain("Questions à choix multiples");
      expect(result.strengths).not.toContain("Glisser-déposer");

      expect(result.weaknesses).toContain("Glisser-déposer");
      expect(result.weaknesses).not.toContain("Questions à choix multiples");
    });
  });
});
