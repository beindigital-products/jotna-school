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
import { mutation, query } from "./_generated/server";
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
import { numericallyEqual } from "./paliers/mathRepair";
import { shuffleDeterministic } from "./paliers";
import { internal } from "./_generated/api";
import { checkAccess, requireAccess } from "./access";
import { loadFinalExercisesForAttempt, summaryPatch, syncTopicProgress } from "./progression";
import { summarizePalier } from "./progressionRules";

// ===========================================================================
// Verification helpers — server-side only, never expose correctAnswer.
// ===========================================================================

function verifyQcm(submitted: string, payload: { correctIndex: number }): boolean {
  return parseInt(submitted, 10) === payload.correctIndex;
}

function verifyMatch(
  submitted: string,
  payload: { pairs: { left: string; right: string }[] },
): boolean {
  try {
    const arr: { left: string; right: string }[] = JSON.parse(submitted);
    if (arr.length !== payload.pairs.length) return false;
    const correct = new Set(payload.pairs.map((p) => `${p.left}|||${p.right}`));
    for (const pair of arr) {
      if (!correct.has(`${pair.left}|||${pair.right}`)) return false;
    }
    return true;
  } catch {
    return false;
  }
}

function verifyOrder(submitted: string, payload: { correctSequence: string[] }): boolean {
  try {
    const arr: string[] = JSON.parse(submitted);
    if (arr.length !== payload.correctSequence.length) return false;
    return arr.every((it, i) => it === payload.correctSequence[i]);
  } catch {
    return false;
  }
}

function verifyDragDrop(
  submitted: string,
  payload: { items: { text: string; correctZone: string }[] },
): boolean {
  try {
    const map: Record<string, string> = JSON.parse(submitted);
    for (const item of payload.items) {
      if (map[item.text] !== item.correctZone) return false;
    }
    return true;
  } catch {
    return false;
  }
}

function verifyShortAnswer(
  submitted: string,
  payload: { acceptedAnswers: string[] },
): boolean {
  // « 2,5 » et « 2.5 », « 1 000 » et « 1000 » : la même réponse. On compare
  // des formes canoniques, sans exiger du modèle toutes les variantes. Et
  // « 18 m » vaut « 18 », « 60% » vaut « 0,6 » : deux formes numériques qui
  // disent le même nombre (`numericallyEqual`). Une fraction, elle, se
  // compare à l'identique : « 1/2 » n'accepte pas « 0,5 ».
  const norm = canonicalAnswer(submitted);
  return payload.acceptedAnswers.some(
    (a) => canonicalAnswer(a) === norm || numericallyEqual(a, submitted),
  );
}

function canonicalAnswer(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/(\d)[\s\u00a0\u202f]+(?=\d)/g, "$1")
    .replace(/(\d),(\d)/g, "$1.$2")
    .replace(/\s+/g, " ");
}

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

    const finalExos = await loadFinalExercisesForAttempt(ctx, palierAttempt);

    if (finalExos.length === 0) {
      throw new Error("Palier vide");
    }

    // Compute per-exo scores from attempts attached to this palierAttempt.
    const exerciseIds: string[] = [];
    const scores: number[] = [];
    const rowsPerExercise: Doc<"attempts">[][] = [];
    for (const ex of finalExos) {
      const attempts = await ctx.db
        .query("attempts")
        .withIndex("by_palierAttempt_exercise", (q) =>
          q
            .eq("palierAttemptId", args.palierAttemptId)
            .eq("exerciseId", ex._id),
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
      exerciseIds.push(ex._id);
      scores.push(score);
    }

    const result = computePalierScore({
      exerciseScores: scores,
      exerciseIds,
    });

    const failedIds = (result.failedExerciseIds ?? []) as Id<"exercises">[];
    const isValidated = result.status === "validated";

    // LE RÉSUMÉ DE LA TENTATIVE (`progressionRules.summarizePalier`) : ce
    // que la jauge de niveau, les étoiles du camp et les trophées liront.
    const summary = summarizePalier(rowsPerExercise);
    await ctx.db.patch(args.palierAttemptId, {
      status: isValidated ? "validated" : "failed",
      averageScore: result.average,
      failedExerciseIds: failedIds,
      completedAt: Date.now(),
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
      await syncTopicProgress(ctx, profile._id, palierDoc.topicId);
    }

    // LES TROPHÉES sont réexaminés après coup (`badges.checkAndAward`) :
    // l'écran de fin, abonné aux statistiques, les voit arriver.
    await ctx.scheduler.runAfter(0, internal.badges.checkAndAward, {
      studentId: profile._id,
    });

    // D7 — record daily activity for streak (no-op if streaks disabled).
    await ctx.runMutation(internal.streak.recordKidActivity, {
      studentId: profile._id,
    });

    // Missions du jour (quests.ts) — même point d'accroche que la série :
    // une fin de palier fait avancer les missions. La matière vient du
    // palier ; sans elle, seules les missions sans matière avancent.
    const questPalier = await ctx.db.get(palierAttempt.palierId);
    const questTopic = questPalier ? await ctx.db.get(questPalier.topicId) : null;
    await ctx.runMutation(internal.quests.recordActivity, {
      studentId: profile._id,
      exercises: exerciseIds.length,
      stars: result.starsTotal,
      palierValidated: isValidated,
      subjectId: questTopic?.subjectId,
    });

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

    return {
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
  },
});

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

    const finalExos = await loadFinalExercisesForAttempt(ctx, palierAttempt);
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
      const ex = finalExos[i];
      const rows = await ctx.db
        .query("attempts")
        .withIndex("by_palierAttempt_exercise", (q) =>
          q.eq("palierAttemptId", args.palierAttemptId).eq("exerciseId", ex._id),
        )
        .take(100);
      attemptsByExercise.set(String(ex._id), rows);

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
    const currentRows = attemptsByExercise.get(String(currentExercise._id)) ?? [];
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
  switch (exercise.type) {
    case "qcm":
      return verifyQcm(submitted, exercise.payload as { correctIndex: number });
    case "match":
      return verifyMatch(submitted, exercise.payload as { pairs: { left: string; right: string }[] });
    case "order":
      return verifyOrder(submitted, exercise.payload as { correctSequence: string[] });
    case "drag-drop":
      return verifyDragDrop(
        submitted,
        exercise.payload as { items: { text: string; correctZone: string }[] },
      );
    case "short-answer":
      return verifyShortAnswer(submitted, exercise.payload as { acceptedAnswers: string[] });
    default:
      return false;
  }
}

// Re-export for tests / settings-driven shuffle preview
export { shuffleDeterministic };
