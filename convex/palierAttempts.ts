/**
 * Palier-aware attempt mutations + queries.
 *
 * Decisions: 12, 13, 50, 51, 52, 59, 61 (security: never leak correctAnswer),
 *            75 (deterministic shuffle uses match/order/drag-drop verifier).
 *
 * Lives outside `paliers/` because Convex's file-based routing places this
 * under `api.palierAttempts.*` — easier for the client to import.
 */

import { v } from "convex/values";
import { mutation, query, type MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import {
  attemptsRemainingAfter,
  computePalierScore,
  countRealAttempts,
  MAX_ATTEMPTS_PER_EXERCISE,
  PALIER_VALIDATION_THRESHOLD,
  scoreExerciseFromAttempts,
} from "./paliers/scoring";
import { shuffleDeterministic, verifyAnswer } from "./paliers/exerciseRules";
import { internal } from "./_generated/api";
import { checkAccess, requireAccess } from "./access";
import { finalExerciseIdsForAttempt, summaryPatch, syncTopicProgress } from "./progression";
import { summarizePalier } from "./progressionRules";
import { recordStreakActivity } from "./streak";
import { recordQuestActivity } from "./quests";

// ===========================================================================
// Verification — la règle vit dans `paliers/exerciseRules.ts`, partagée avec
// l'application qui joue un palier sans réseau. Jamais de bonne réponse
// rendue au client par ces mutations (Décision 61).
// ===========================================================================

// ===========================================================================
// MUTATIONS
// ===========================================================================

export const verifyAttempt = mutation({
  args: {
    exerciseId: v.id("exercises"),
    palierAttemptId: v.id("palierAttempts"),
    userAnswer: v.string(),
    timeSpentMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Non authentifié");
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId as string))
      .unique();
    if (!profile) throw new Error("Profil introuvable");

    // Paywall (spec §5.4) — une mutation lève, l'appelant attrape.
    await requireAccess(ctx, profile);

    const exercise = await ctx.db.get(args.exerciseId);
    if (!exercise) throw new Error("Exercice introuvable");

    const attempt = await ctx.db.get(args.palierAttemptId);
    if (!attempt) throw new Error("Tentative introuvable");
    if (attempt.userId !== profile._id) throw new Error("Accès refusé");
    // Une tentative notée ne prend plus de réponse (voir `submitPalier`).
    if (attempt.status !== "in_progress") throw new Error("Tentative terminée");

    // How many times has the kid attempted this exo in this palierAttempt?
    const previous = await ctx.db
      .query("attempts")
      .withIndex("by_palierAttempt_exercise", (q) =>
        q.eq("palierAttemptId", args.palierAttemptId).eq("exerciseId", args.exerciseId),
      )
      .take(100);

    // Les lignes d'indice (`attemptNumber: 0`) ne comptent pas : voir
    // `countRealAttempts`. Les compter sautait un essai après chaque indice.
    const attemptNumber = countRealAttempts(previous) + 1;
    const hintsUsedCount = previous.reduce((acc, a) => acc + a.hintsUsedCount, 0);

    const isCorrect = verifyByType(exercise, args.userAnswer);

    await ctx.db.insert("attempts", {
      studentId: profile._id,
      exerciseId: args.exerciseId,
      submittedAnswer: args.userAnswer,
      isCorrect,
      attemptNumber,
      hintsUsedCount: 0, // hint usage is tracked on the requestHint mutation directly
      // Le temps passé sur l'exercice, tel que l'écran l'a mesuré ; borné,
      // un téléphone posé sur la table n'est pas une heure de réflexion.
      timeSpentMs: Math.max(0, Math.min(args.timeSpentMs ?? 0, 10 * 60_000)),
      submittedAt: Date.now(),
      palierAttemptId: args.palierAttemptId,
    });

    // Server-only feedback. We DO NOT return the correct answer — Decision 61.
    return {
      isCorrect,
      attemptNumber,
      hintsUsedSoFar: hintsUsedCount,
      attemptsRemaining: attemptsRemainingAfter(attemptNumber),
    };
  },
});

export const requestHint = mutation({
  args: {
    exerciseId: v.id("exercises"),
    palierAttemptId: v.id("palierAttempts"),
    hintIndex: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Non authentifié");
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId as string))
      .unique();
    if (!profile) throw new Error("Profil introuvable");

    // Paywall (spec §5.4) — une mutation lève, l'appelant attrape.
    await requireAccess(ctx, profile);

    const exercise = await ctx.db.get(args.exerciseId);
    if (!exercise) throw new Error("Exercice introuvable");
    if (!Array.isArray(exercise.hints)) throw new Error("Aucun indice disponible");
    if (args.hintIndex < 0 || args.hintIndex >= exercise.hints.length) {
      throw new Error("Index d'indice invalide");
    }

    const attempt = await ctx.db.get(args.palierAttemptId);
    if (!attempt) throw new Error("Tentative introuvable");
    if (attempt.userId !== profile._id) throw new Error("Accès refusé");
    // Une tentative notée ne prend plus de réponse (voir `submitPalier`).
    if (attempt.status !== "in_progress") throw new Error("Tentative terminée");

    // Track the hint with a synthetic non-correct attempt row so the score
    // function can later deduct it. We add 1 hint and isCorrect=false so it's
    // ignored by `firstCorrect` lookup but counted in totalHints.
    await ctx.db.insert("attempts", {
      studentId: profile._id,
      exerciseId: args.exerciseId,
      submittedAnswer: `__HINT_${args.hintIndex}`,
      isCorrect: false,
      attemptNumber: 0, // sentinel: not a real attempt
      hintsUsedCount: 1,
      timeSpentMs: 0,
      submittedAt: Date.now(),
      palierAttemptId: args.palierAttemptId,
    });

    return {
      hint: exercise.hints[args.hintIndex],
      hintIndex: args.hintIndex,
      totalHints: exercise.hints.length,
    };
  },
});

export const submitPalier = mutation({
  args: { palierAttemptId: v.id("palierAttempts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Non authentifié");
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId as string))
      .unique();
    if (!profile) throw new Error("Profil introuvable");

    // Paywall (spec §5.4) — une mutation lève, l'appelant attrape.
    await requireAccess(ctx, profile);

    const palierAttempt = await ctx.db.get(args.palierAttemptId);
    if (!palierAttempt) throw new Error("Tentative introuvable");
    if (palierAttempt.userId !== profile._id) throw new Error("Accès refusé");

    return await finishPalierAttempt(ctx, profile, palierAttempt, {
      at: Date.now(),
      scheduleBadges: true,
    });
  },
});

export type PalierFinishResult = {
  status: "validated" | "failed";
  average: number;
  starsTotal: number;
  threshold: number;
  exerciseCount: number;
  failedCount: number;
  canRegen: boolean;
  cumulativeRegens: number;
};

/**
 * NOTER UNE TENTATIVE DE PALIER ET EN TIRER TOUT CE QUI EN DÉCOULE : le
 * résumé, la progression de la thématique, le bulletin, les trophées, la série
 * et les missions du jour.
 *
 * Fonction ordinaire, partagée par `submitPalier` (une séance jouée en ligne
 * d'ancienne manière) et la synchronisation (`offline/sync.ts`, une séance
 * jouée sur l'appareil, avec ou sans réseau). `at` est le moment où l'enfant a
 * fini : maintenant, ou le jour où il a joué sans réseau. La série et les
 * missions comptent ce jour-là.
 *
 * `scheduleBadges` : la synchronisation rejoue souvent plusieurs paliers d'un
 * coup et réexamine les trophées une seule fois, à la fin.
 */
export async function finishPalierAttempt(
  ctx: MutationCtx,
  profile: Doc<"profiles">,
  palierAttempt: Doc<"palierAttempts">,
  options: { at: number; scheduleBadges: boolean },
): Promise<PalierFinishResult> {
  const finalExerciseIds = await finalExerciseIdsForAttempt(ctx, palierAttempt);

  if (finalExerciseIds.length === 0) {
    throw new Error("Palier vide");
  }

  // Compute per-exo scores from attempts attached to this palierAttempt.
  const exerciseIds: string[] = [];
  const scores: number[] = [];
  const rowsPerExercise: Doc<"attempts">[][] = [];
  for (const exerciseId of finalExerciseIds) {
    const attempts = await ctx.db
      .query("attempts")
      .withIndex("by_palierAttempt_exercise", (q) =>
        q
          .eq("palierAttemptId", palierAttempt._id)
          .eq("exerciseId", exerciseId),
      )
      .take(100);
    rowsPerExercise.push(attempts);
    const realAttempts = attempts.filter((a) => a.attemptNumber > 0);
    const totalHints = attempts.reduce((acc, a) => acc + a.hintsUsedCount, 0);
    const { score } = scoreExerciseFromAttempts(
      realAttempts.map((a) => ({
        attemptNumber: a.attemptNumber,
        isCorrect: a.isCorrect,
        // We bake the *total* hints into the first attempt so
        // `scoreExerciseFromAttempts` accounts for them. Other rows = 0.
        hintsUsedCount: a === realAttempts[0] ? totalHints : 0,
      })),
    );
    exerciseIds.push(exerciseId);
    scores.push(score);
  }

  const result = computePalierScore({
    exerciseScores: scores,
    exerciseIds,
  });

  const failedIds = (result.failedExerciseIds ?? []) as Id<"exercises">[];
  const isValidated = result.status === "validated";

  // Cumulative regen check (Decision 60) — UI uses canRegen flag.
  const history = await ctx.db
    .query("palierAttemptHistory")
    .withIndex("by_user_palier", (q) =>
      q.eq("userId", profile._id).eq("palierId", palierAttempt.palierId),
    )
    .unique();
  const cumulativeRegens =
    history && Date.now() - history.lastRegenAt < 7 * 24 * 60 * 60 * 1000
      ? history.regenCount
      : 0;

  const response: PalierFinishResult = {
    status: isValidated ? "validated" : "failed",
    average: result.average,
    starsTotal: result.starsTotal,
    threshold: PALIER_VALIDATION_THRESHOLD,
    // Un palier n'a pas toujours dix exercices (le modèle en rend parfois
    // neuf de valides) : l'écran de fin compte ses étoiles sur ce nombre.
    exerciseCount: exerciseIds.length,
    failedCount: failedIds.length,
    canRegen: !isValidated && cumulativeRegens < 3,
    cumulativeRegens,
  };

  // UNE TENTATIVE SE TERMINE UNE FOIS. Un second envoi (double appui,
  // réseau qui rejoue, retour arrière) trouve la tentative déjà notée : il
  // rend le même résultat sans rien réécrire, sinon la série et les
  // missions avanceraient une seconde fois. Après une nouvelle chance,
  // `regenerateFailedExercises` remet la tentative `in_progress`, et elle se
  // note de nouveau. `verifyAttempt` refuse toute réponse entre les deux :
  // le recalcul ci-dessus rend donc ce qui a été rangé.
  if (palierAttempt.status !== "in_progress") return response;

  // LE RÉSUMÉ DE LA TENTATIVE (`progressionRules.summarizePalier`) : ce
  // que la jauge de niveau, les étoiles du camp et les trophées liront.
  const summary = summarizePalier(rowsPerExercise);
  await ctx.db.patch(palierAttempt._id, {
    status: isValidated ? "validated" : "failed",
    averageScore: result.average,
    failedExerciseIds: failedIds,
    completedAt: options.at,
    ...summaryPatch(summary),
  });

  // LA PROGRESSION DE LA THÉMATIQUE se recalcule depuis toutes les
  // tentatives finies de l'élève dessus (exercices faits et résolus,
  // indices, maîtrise), et la thématique est franchie quand son dernier
  // palier l'est. C'est ici, seul endroit où un palier se termine, que
  // `studentTopicProgress` s'écrit ; la carte, le camp, les bulletins et la
  // jauge de niveau le lisent.
  const palierDoc = await ctx.db.get(palierAttempt.palierId);
  if (palierDoc) {
    const { newlyCompleted } = await syncTopicProgress(
      ctx,
      profile._id,
      palierDoc.topicId,
      options.at,
    );
    // LE BULLETIN naît quand la thématique est franchie, une fois
    // (`reports.generate`) ; il part aux tuteurs qui le veulent.
    if (newlyCompleted) {
      await ctx.scheduler.runAfter(0, internal.reports.generate, {
        studentId: profile._id,
        topicId: palierDoc.topicId,
      });
    }
  }

  // LES TROPHÉES sont réexaminés après coup (`badges.checkAndAward`) :
  // l'écran de fin, abonné aux statistiques, les voit arriver.
  if (options.scheduleBadges) {
    await ctx.scheduler.runAfter(0, internal.badges.checkAndAward, {
      studentId: profile._id,
    });
  }

  // D7 — la série du jour où l'enfant a joué (no-op si les séries sont
  // coupées par un parent).
  await recordStreakActivity(ctx, profile._id, options.at);

  // Missions du jour (quests.ts) — même point d'accroche que la série :
  // une fin de palier fait avancer les missions. La matière vient du
  // palier ; sans elle, seules les missions sans matière avancent.
  const questTopic = palierDoc ? await ctx.db.get(palierDoc.topicId) : null;
  await recordQuestActivity(
    ctx,
    profile._id,
    {
      exercises: exerciseIds.length,
      stars: result.starsTotal,
      palierValidated: isValidated,
      subjectId: questTopic?.subjectId,
    },
    options.at,
  );

  return response;
}

// ===========================================================================
// QUERIES
// ===========================================================================

export const getMyAttempt = query({
  args: { palierAttemptId: v.id("palierAttempts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId as string))
      .unique();
    if (!profile) return null;

    // Paywall (spec §5.4) — une requête ne lève jamais : elle retourne la
    // même valeur vide que pour un profil invalide.
    const access = await checkAccess(ctx, profile);
    if (!access.ok) return null;

    const attempt = await ctx.db.get(args.palierAttemptId);
    if (!attempt || attempt.userId !== profile._id) return null;
    return attempt;
  },
});

export const getProgressForPalierAttempt = query({
  args: { palierAttemptId: v.id("palierAttempts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId as string))
      .unique();
    if (!profile) return null;

    // Paywall (spec §5.4) — une requête ne lève jamais : elle retourne la
    // même valeur vide que pour un profil invalide.
    const access = await checkAccess(ctx, profile);
    if (!access.ok) return null;

    const palierAttempt = await ctx.db.get(args.palierAttemptId);
    if (!palierAttempt) return null;
    if (palierAttempt.userId !== profile._id) return null;

    const finalExos = await finalExerciseIdsForAttempt(ctx, palierAttempt);
    if (finalExos.length === 0) {
      return {
        currentIndex: 0,
        completedCount: 0,
        totalCount: 0,
        failedAttemptsThisExo: 0,
        hintsUsedThisExo: 0,
      };
    }

    let currentIndex = finalExos.length - 1;
    let completedCount = 0;
    const attemptsByExercise = new Map<string, Doc<"attempts">[]>();

    for (let i = 0; i < finalExos.length; i++) {
      const exerciseId = finalExos[i];
      const rows = await ctx.db
        .query("attempts")
        .withIndex("by_palierAttempt_exercise", (q) =>
          q.eq("palierAttemptId", args.palierAttemptId).eq("exerciseId", exerciseId),
        )
        .take(100);
      attemptsByExercise.set(String(exerciseId), rows);

      const realAttempts = rows.filter((a) => a.attemptNumber > 0);
      const isCompleted =
        realAttempts.some((a) => a.isCorrect) ||
        realAttempts.length >= MAX_ATTEMPTS_PER_EXERCISE;
      if (isCompleted) {
        completedCount += 1;
        continue;
      }
      currentIndex = i;
      break;
    }

    const currentExercise = finalExos[currentIndex];
    const currentRows = attemptsByExercise.get(String(currentExercise)) ?? [];
    const currentRealAttempts = currentRows.filter((a) => a.attemptNumber > 0);

    return {
      currentIndex,
      completedCount,
      totalCount: finalExos.length,
      failedAttemptsThisExo: currentRealAttempts.filter((a) => !a.isCorrect)
        .length,
      hintsUsedThisExo: currentRows.reduce(
        (acc, a) => acc + a.hintsUsedCount,
        0,
      ),
    };
  },
});

export const listMyAttempts = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId as string))
      .unique();
    if (!profile) return [];

    // Paywall (spec §5.4) — une requête ne lève jamais : elle retourne la
    // même valeur vide que pour un profil invalide.
    const access = await checkAccess(ctx, profile);
    if (!access.ok) return [];

    const limit = args.limit ?? 20;
    return await ctx.db
      .query("palierAttempts")
      .withIndex("by_user", (q) => q.eq("userId", profile._id))
      .order("desc")
      .take(limit);
  },
});

// Helper used in tests
export { verifyByType };

function verifyByType(exercise: Doc<"exercises">, submitted: string): boolean {
  return verifyAnswer(exercise, submitted);
}

// Re-export for tests / settings-driven shuffle preview
export { shuffleDeterministic };
