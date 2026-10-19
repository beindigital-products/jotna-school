/**
 * Student streak module — Decisions D7, D7b, D7c (zero-shame copy is UI-side).
 *
 * Definitions:
 *   - "Activité" = at least one palierAttempt submitted in the day (validated
 *     or failed; "starting" alone doesn't count).
 *   - Day = calendar day in Africa/Dakar (UTC+0). Stored as YYYY-MM-DD.
 *   - Freeze = automatic 1-per-7-days. If a day passes with no activity but
 *     a freeze is available, the streak is preserved and freeze expires.
 *   - "Streak Enabled" = at least one parentSettings.streaksEnabled === true.
 *
 * Storage: under profiles.preferences.streak (no separate table, no schema
 * migration required — preferences is already v.optional(v.any()) per
 * schema.ts:46). See `students.ts` for the StudentStreakState type.
 */

import { internalMutation, mutation, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import { readStudentPreferences, type StudentPreferences } from "./students";
import { applyActivity, applyRollover, timestampToYmd, todayYmd } from "./streakRules";
import type { Doc, Id } from "./_generated/dataModel";
import { requireAccess } from "./access";

// Les dates et les transitions de la série sont pures, dans `streakRules.ts` :
// l'application qui joue sans réseau les applique aussi. Réexportées ici pour
// les lecteurs historiques et les tests.
export {
  addDaysYmd,
  applyActivity,
  applyRollover,
  daysBetween,
  timestampToYmd,
  todayYmd,
  type StreakTransition,
} from "./streakRules";

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Persist sound preference. Called from the kid UI after the first-run
 * dialog accepts/declines audio. D31 — idempotent: if the value matches what
 * is already stored, skip the patch entirely. Avoids cascading the heavy
 * getMyStats subscription invalidation on rage-clicks of the toggle.
 */
export const setSoundEnabled = mutation({
  args: { enabled: v.boolean() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Non authentifié");
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId as string))
      .unique();
    if (!profile || profile.role !== "student") {
      throw new Error("Profil élève introuvable");
    }

    // Paywall (spec §5.4) — mutation : lève si l'accès n'est pas ouvert.
    await requireAccess(ctx, profile);

    const prefs = readStudentPreferences(profile);
    if (prefs.soundEnabled === args.enabled) return; // Idempotent
    const next: StudentPreferences = { ...prefs, soundEnabled: args.enabled };
    await ctx.db.patch(profile._id, { preferences: next });
  },
});

/**
 * Internal: record a kid's daily activity (called from submitPalier).
 * D7 (revised) — streaks default ON. Skipped only if a linked parent has
 * explicitly opted out via parentSettings.streaksEnabled = false.
 */
export const recordKidActivity = internalMutation({
  args: {
    studentId: v.id("profiles"),
    /** Le moment de l'activité : maintenant, ou le jour d'un palier joué sans réseau. */
    at: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await recordStreakActivity(ctx, args.studentId, args.at ?? Date.now());
  },
});

/**
 * Fait avancer la série d'un élève pour une activité à l'instant `at`.
 *
 * Fonction ordinaire, appelée dans la transaction de qui termine un palier
 * (`palierAttempts.submitPalier`, la synchronisation `offline/sync.ts`) : un
 * palier joué sans réseau compte pour le jour où l'enfant l'a joué, pas pour
 * celui où le téléphone a retrouvé le réseau.
 */
export async function recordStreakActivity(
  ctx: MutationCtx,
  studentId: Id<"profiles">,
  at: number,
): Promise<void> {
  const profile = await ctx.db.get(studentId);
  if (!profile || profile.role !== "student") return;

  const parentSettings = await ctx.db
    .query("parentSettings")
    .withIndex("by_kid", (q) => q.eq("kidId", studentId))
    .take(10);
  const streaksEnabled = !parentSettings.some(
    (s) => s.streaksEnabled === false,
  );
  if (!streaksEnabled) return;

  const prefs = readStudentPreferences(profile);
  // Jamais dans le futur : une horloge de téléphone en avance ne crée pas
  // de jour de série.
  const transition = applyActivity(prefs.streak, timestampToYmd(Math.min(at, Date.now())));
  if (transition.next === transition.prev) return;
  const nextPrefs: StudentPreferences = {
    ...prefs,
    streak: transition.next,
  };
  await ctx.db.patch(studentId, { preferences: nextPrefs });
}

/**
 * Internal: daily streak rollover. Iterates students and resets streaks
 * whose lastActivityYmd is too old. Bounded — resumes via scheduler if
 * processing exceeds transaction limits.
 */
export const dailyStreakRollover = internalMutation({
  args: {
    cursor: v.optional(v.union(v.string(), v.null())),
    processed: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const today = todayYmd();
    const result = await ctx.db
      .query("profiles")
      .paginate({ numItems: 200, cursor: args.cursor ?? null });

    let processed = args.processed ?? 0;
    for (const profile of result.page) {
      if (profile.role !== "student") continue;
      // D7 (revised) — default ON; only an explicit parent opt-out skips.
      const parentSettings = await ctx.db
        .query("parentSettings")
        .withIndex("by_kid", (q) => q.eq("kidId", profile._id))
        .take(10);
      const streaksEnabled = !parentSettings.some(
        (s) => s.streaksEnabled === false,
      );
      if (!streaksEnabled) continue;

      const prefs = readStudentPreferences(profile);
      if (!prefs.streak) continue;

      const transition = applyRollover(prefs.streak, today);
      if (transition.next === transition.prev) continue;
      const nextPrefs: StudentPreferences = {
        ...prefs,
        streak: transition.next,
      };
      await ctx.db.patch(profile._id, { preferences: nextPrefs });
      processed += 1;
    }

    if (!result.isDone) {
      await ctx.scheduler.runAfter(0, internal.streak.dailyStreakRollover, {
        cursor: result.continueCursor,
        processed,
      });
    }
    return { processed, isDone: result.isDone };
  },
});

// Export internal helper type signature for hand-off from submitPalier.
export type RecordKidActivityArgs = { studentId: Id<"profiles"> };
export type _StudentDoc = Doc<"profiles">;
