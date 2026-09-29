/**
 * LA PROGRESSION, CÔTÉ BASE : résumer une tentative de palier, recalculer la
 * thématique, et rattraper l'existant.
 *
 * Les règles sont dans `progressionRules.ts` (pur). Ici, ce qui lit et écrit
 * la base : `summarizeAttempt` résume une tentative depuis ses lignes
 * d'essai, `syncTopicProgress` recalcule `studentTopicProgress` depuis toutes
 * les tentatives finies de l'élève sur la thématique (compteurs, maîtrise,
 * étoiles, franchissement), et `rebuild` rattrape l'existant.
 *
 *     npx convex run progression:rebuild '{"confirmDeployment":"<nom>","dryRun":true}'
 *     npx convex run progression:rebuild '{"confirmDeployment":"<nom>"}'
 *
 * À lancer une fois après le déploiement de ce module, sur chaque
 * déploiement : sans lui, les élèves d'avant gardent une jauge à zéro.
 * La seconde commande traite une page et planifie la suivante.
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
 * ses tentatives finies : exercices faits et résolus, indices, maîtrise,
 * étoiles, et le franchissement quand tous les paliers sont validés.
 * Idempotent. `newlyCompleted` dit que la thématique vient d'être franchie
 * par cet appel : c'est le moment du bulletin.
 *
 * Les tentatives se lisent palier par palier (`by_user_palier`). Une lecture
 * bornée de toutes celles de l'élève cesserait de voir les plus récentes
 * passé la borne, et la jauge de niveau s'arrêterait de monter.
 */
export async function syncTopicProgress(
  ctx: MutationCtx,
  studentId: Id<"profiles">,
  topicId: Id<"topics">,
): Promise<{ newlyCompleted: boolean }> {
  const topic = await ctx.db.get(topicId);
  if (!topic) return { newlyCompleted: false };
  const paliers = await ctx.db
    .query("paliers")
    .withIndex("by_topic_class", (q) => q.eq("topicId", topicId))
    .take(100);
  const indexByPalierId = new Map(paliers.map((p) => [p._id as string, p.palierIndex] as const));

  const attempts: Doc<"palierAttempts">[] = [];
  for (const palier of paliers) {
    const rows = await ctx.db
      .query("palierAttempts")
      .withIndex("by_user_palier", (q) => q.eq("userId", studentId).eq("palierId", palier._id))
      .take(200);
    attempts.push(...rows);
  }

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
    const newlyCompleted = existing.completedAt == null && completedAt !== undefined;
    const unchanged =
      existing.completedExercises === counters.completedExercises &&
      existing.correctExercises === counters.correctExercises &&
      existing.totalHintsUsed === counters.totalHintsUsed &&
      existing.masteryLevel === counters.masteryLevel &&
      existing.starsEarned === counters.starsEarned &&
      existing.completedAt === completedAt;
    if (!unchanged) await ctx.db.patch(existing._id, { ...counters, completedAt });
    return { newlyCompleted };
  }
  // Rien de fini : rien à écrire, la ligne naîtra à la première fin de palier.
  if (attempts.every((a) => !isFinished(a)) && !complete) return { newlyCompleted: false };
  await ctx.db.insert("studentTopicProgress", {
    studentId,
    topicId,
    ...counters,
    completedAt: complete ? now : undefined,
  });
  return { newlyCompleted: complete };
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
 * RATTRAPER L'EXISTANT. Toutes les tentatives de palier sont parcourues, par
 * pages (`pageSize`, 50 par défaut) : une tentative finie sans résumé en
 * reçoit un, chaque thématique où l'élève a fini un palier est recalculée
 * (compteurs, maîtrise, étoiles, franchissement), et les trophées de chaque
 * élève sont réexaminés. La page suivante se planifie d'elle-même.
 *
 * Toutes les thématiques, pas seulement celles d'une tentative sans résumé :
 * une tentative résumée peut porter sur une thématique dont les compteurs
 * n'ont pas été tenus à jour. Aucun bulletin n'est produit ici : une
 * thématique franchie avant le rattrapage n'écrit pas aux parents.
 *
 * `dryRun` compte sans rien écrire, sur les 5 000 premières tentatives.
 */
export const rebuild = internalMutation({
  args: {
    confirmDeployment: v.string(),
    dryRun: v.optional(v.boolean()),
    cursor: v.optional(v.union(v.string(), v.null())),
    pageSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    assertTargetedDeployment(args.confirmDeployment);

    if (args.dryRun === true) {
      const all = await ctx.db.query("palierAttempts").take(5000);
      const finished = all.filter(isFinished);
      return {
        dryRun: true,
        attemptsScanned: all.length,
        truncated: all.length === 5000,
        finished: finished.length,
        toSummarize: finished.filter((a) => a.exerciseCount === undefined).length,
        students: new Set(finished.map((a) => a.userId as string)).size,
      };
    }

    const pageSize = Math.max(1, Math.min(200, args.pageSize ?? 50));
    const page = await ctx.db
      .query("palierAttempts")
      .paginate({ numItems: pageSize, cursor: args.cursor ?? null });

    const touched = new Map<string, { studentId: Id<"profiles">; topicId: Id<"topics"> }>();
    let summarized = 0;
    for (const attempt of page.page) {
      if (!isFinished(attempt)) continue;
      if (attempt.exerciseCount === undefined) {
        await ctx.db.patch(attempt._id, summaryPatch(await summarizeAttempt(ctx, attempt)));
        summarized += 1;
      }
      const palier = await ctx.db.get(attempt.palierId);
      if (palier) {
        touched.set(`${attempt.userId}:${palier.topicId}`, { studentId: attempt.userId, topicId: palier.topicId });
      }
    }

    const students = new Set<Id<"profiles">>();
    for (const { studentId, topicId } of touched.values()) {
      await syncTopicProgress(ctx, studentId, topicId);
      students.add(studentId);
    }
    for (const studentId of students) {
      await ctx.scheduler.runAfter(0, internal.badges.checkAndAward, { studentId });
    }
    if (!page.isDone) {
      await ctx.scheduler.runAfter(0, internal.progression.rebuild, {
        confirmDeployment: args.confirmDeployment,
        cursor: page.continueCursor,
        pageSize,
      });
    }

    return {
      dryRun: false,
      attemptsScanned: page.page.length,
      summarized,
      topicsSynced: touched.size,
      studentsChecked: students.size,
      isDone: page.isDone,
    };
  },
});
