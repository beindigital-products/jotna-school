/**
 * LA PROGRESSION, CÔTÉ BASE : résumer une tentative de palier, recalculer la
 * thématique, et rattraper l'existant.
 *
 * Les règles sont dans `progressionRules.ts` (pur). Ici, ce qui lit et écrit
 * la base : `summarizeAttempt` résume une tentative depuis ses lignes
 * d'essai, `syncTopicProgress` recalcule `studentTopicProgress` depuis toutes
 * les tentatives finies de l'élève sur la thématique (compteurs, maîtrise,
 * franchissement), et `rebuild` rattrape les tentatives d'avant, qui n'ont
 * pas de résumé.
 *
 *     npx convex run progression:rebuild '{"confirmDeployment":"<nom>","dryRun":true}'
 *     npx convex run progression:rebuild '{"confirmDeployment":"<nom>"}'
 *
 * À lancer une fois après le déploiement de ce module, sur chaque
 * déploiement : sans lui, les élèves d'avant gardent une jauge à zéro.
 */
import { v } from "convex/values";
import { internalMutation, type MutationCtx, type QueryCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { effectivePalierCount, isTopicComplete } from "./palierRules";
import {
  isFinished,
  summarizePalier,
  topicProgressFrom,
  type PalierSummary,
} from "./progressionRules";
import { assertTargetedDeployment } from "./testSeedsSchool";

/**
 * Les exercices d'une tentative, dans l'ordre : ceux du palier, moins ceux
 * remplacés par une variation propre à la tentative, plus ces variations.
 */
export async function loadFinalExercisesForAttempt(
  ctx: QueryCtx | MutationCtx,
  palierAttempt: Doc<"palierAttempts">,
): Promise<Doc<"exercises">[]> {
  const exosByAttempt = await ctx.db
    .query("exercises")
    .withIndex("by_palierAttemptId", (q) => q.eq("palierAttemptId", palierAttempt._id))
    .take(50);
  const variationOriginalIds = new Set(
    exosByAttempt.map((e) => e.originalExerciseId).filter(Boolean) as Id<"exercises">[],
  );
  const exosByPalier = await ctx.db
    .query("exercises")
    .withIndex("by_palierId", (q) => q.eq("palierId", palierAttempt.palierId))
    .take(50);

  const finalExos: Doc<"exercises">[] = [];
  for (const ex of exosByPalier) {
    if (!variationOriginalIds.has(ex._id)) finalExos.push(ex);
  }
  for (const ex of exosByAttempt) finalExos.push(ex);
  finalExos.sort((a, b) => a.order - b.order);
  return finalExos;
}

/** Le résumé d'une tentative, depuis ses lignes d'essai. */
export async function summarizeAttempt(
  ctx: QueryCtx | MutationCtx,
  attempt: Doc<"palierAttempts">,
): Promise<PalierSummary> {
  const exercises = await loadFinalExercisesForAttempt(ctx, attempt);
  const rowsPerExercise = [];
  for (const ex of exercises) {
    const rows = await ctx.db
      .query("attempts")
      .withIndex("by_palierAttempt_exercise", (q) =>
        q.eq("palierAttemptId", attempt._id).eq("exerciseId", ex._id),
      )
      .take(100);
    rowsPerExercise.push(rows);
  }
  return summarizePalier(rowsPerExercise);
}

/**
 * Recalcule `studentTopicProgress` pour une thématique de l'élève, depuis
 * ses tentatives finies : exercices faits et résolus, indices, maîtrise, et
 * le franchissement quand tous les paliers sont validés. Idempotent.
 */
export async function syncTopicProgress(
  ctx: MutationCtx,
  studentId: Id<"profiles">,
  topicId: Id<"topics">,
): Promise<void> {
  const topic = await ctx.db.get(topicId);
  if (!topic) return;
  const paliers = await ctx.db
    .query("paliers")
    .withIndex("by_topic_class", (q) => q.eq("topicId", topicId))
    .take(100);
  const indexByPalierId = new Map(paliers.map((p) => [p._id as string, p.palierIndex] as const));

  const attempts = (
    await ctx.db
      .query("palierAttempts")
      .withIndex("by_user", (q) => q.eq("userId", studentId))
      .take(500)
  ).filter((a) => indexByPalierId.has(a.palierId as string));

  const counters = topicProgressFrom(
    attempts.map((a) => ({
      palierId: a.palierId as string,
      status: a.status,
      averageScore: a.averageScore,
      exerciseCount: a.exerciseCount,
      correctCount: a.correctCount,
      hintsUsed: a.hintsUsed,
      starsTotal: a.starsTotal,
    })),
  );

  const validated = new Set<number>();
  for (const a of attempts) {
    if (a.status === "validated") validated.add(indexByPalierId.get(a.palierId as string)!);
  }
  const complete = isTopicComplete(validated, effectivePalierCount(topic));

  const existing = await ctx.db
    .query("studentTopicProgress")
    .withIndex("by_studentId_topicId", (q) => q.eq("studentId", studentId).eq("topicId", topicId))
    .unique();
  const now = Date.now();
  if (existing) {
    // Une thématique déjà franchie garde sa date.
    const completedAt = existing.completedAt ?? (complete ? now : undefined);
    const unchanged =
      existing.completedExercises === counters.completedExercises &&
      existing.correctExercises === counters.correctExercises &&
      existing.totalHintsUsed === counters.totalHintsUsed &&
      existing.masteryLevel === counters.masteryLevel &&
      existing.completedAt === completedAt;
    if (unchanged) return;
    await ctx.db.patch(existing._id, { ...counters, completedAt });
    return;
  }
  // Rien de fini : rien à écrire, la ligne naîtra à la première fin de palier.
  if (attempts.every((a) => !isFinished(a)) && !complete) return;
  await ctx.db.insert("studentTopicProgress", {
    studentId,
    topicId,
    ...counters,
    completedAt: complete ? now : undefined,
  });
}

/** Les champs de résumé, tels qu'on les pose sur `palierAttempts`. */
export function summaryPatch(summary: PalierSummary) {
  return {
    exerciseCount: summary.exerciseCount,
    correctCount: summary.correctCount,
    firstTryCount: summary.firstTryCount,
    noHintCount: summary.noHintCount,
    hintsUsed: summary.hintsUsed,
    starsTotal: summary.starsTotal,
    timeSpentMs: summary.timeSpentMs,
  };
}

/**
 * RATTRAPER L'EXISTANT. Les tentatives finies sans résumé en reçoivent un,
 * les thématiques touchées sont recalculées, et les trophées de chaque élève
 * sont réexaminés. Par lots (`limit`, 200 par défaut) : relancer jusqu'à
 * `remaining: 0`.
 */
export const rebuild = internalMutation({
  args: {
    confirmDeployment: v.string(),
    dryRun: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    assertTargetedDeployment(args.confirmDeployment);
    const dryRun = args.dryRun === true;
    const limit = Math.max(1, Math.min(500, args.limit ?? 200));

    const all = await ctx.db.query("palierAttempts").take(5000);
    const pending = all.filter((a) => isFinished(a) && a.exerciseCount === undefined);
    const batch = pending.slice(0, limit);

    const touched = new Map<string, { studentId: Id<"profiles">; topicId: Id<"topics"> }>();
    let summarized = 0;
    for (const attempt of batch) {
      const summary = await summarizeAttempt(ctx, attempt);
      summarized += 1;
      if (!dryRun) await ctx.db.patch(attempt._id, summaryPatch(summary));
      const palier = await ctx.db.get(attempt.palierId);
      if (palier) {
        touched.set(`${attempt.userId}:${palier.topicId}`, { studentId: attempt.userId, topicId: palier.topicId });
      }
    }

    const students = new Set<string>();
    if (!dryRun) {
      for (const { studentId, topicId } of touched.values()) {
        await syncTopicProgress(ctx, studentId, topicId);
        students.add(studentId as string);
      }
      for (const studentId of students) {
        await ctx.scheduler.runAfter(0, internal.badges.checkAndAward, {
          studentId: studentId as Id<"profiles">,
        });
      }
    }

    return {
      dryRun,
      attemptsScanned: all.length,
      summarized,
      topicsSynced: dryRun ? 0 : touched.size,
      studentsChecked: dryRun ? 0 : students.size,
      remaining: pending.length - batch.length,
    };
  },
});
