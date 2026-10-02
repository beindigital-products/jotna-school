/**
 * LA SYNCHRONISATION — rejouer ici ce que l'enfant a fait sur l'appareil.
 *
 * L'application joue d'abord sur le téléphone, avec ou sans réseau
 * (`lib/offline/`), et range chaque geste qui compte dans un journal : une
 * séance de palier, une tentative ou une fin de leçon d'arabe, un réglage.
 * Quand le réseau est là, elle envoie le journal ici, UNE ENTRÉE PAR APPEL et
 * dans l'ordre : une entrée est une transaction, et la fin du palier 2 n'est
 * jamais rejouée avant celle du palier 1.
 *
 * LE SERVEUR RESTE L'ARBITRE. L'appareil a jugé les réponses avec la même
 * règle (`paliers/exerciseRules.ts`) ; on rejuge ici chaque réponse dont
 * l'exercice existe encore, et c'est ce verdict qui s'écrit. Les étoiles, la
 * thématique, le bulletin, les trophées, la série et les missions se
 * calculent par les MÊMES fonctions que la séance en ligne
 * (`palierAttempts.finishPalierAttempt`), à la date où l'enfant a joué.
 *
 * REJOUER NE DOUBLE RIEN. Un envoi peut repartir — accusé perdu, application
 * fermée trop tôt. Chaque entrée porte un identifiant d'appareil, retrouvé
 * avant d'écrire : la séance par `palierAttempts.clientSessionId` (et
 * `syncedLogLength` pour ce qui en est déjà écrit), la tentative d'arabe par
 * `arabicAttempts.clientEventId`, la fin de leçon par `offlineReceipts`.
 *
 * LE PAYWALL NE BLOQUE PAS LA SYNCHRONISATION. L'application ne laisse jouer
 * sans réseau qu'un enfant dont l'accès était ouvert (`lib/offline/model.ts`)
 * : ce qu'il a fait pendant ce temps est son travail, et il s'écrit même si
 * l'abonnement de l'école a expiré depuis. Le rejouer reste réservé à un
 * élève authentifié, sur sa propre classe.
 */
import { mutation, type MutationCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";
import { callerProfile } from "../access";
import { topicOpenTo } from "../accessRules";
import { effectivePalierCount } from "../palierRules";
import { finishPalierAttempt } from "../palierAttempts";
import { MAX_ATTEMPTS_PER_EXERCISE, countRealAttempts } from "../paliers/scoring";
import { verifyAnswer } from "../paliers/exerciseRules";
import { readStudentPreferences, type StudentPreferences } from "../students";
import { closeLesson, insertDeviceAttempt, isLessonItem } from "../arabic/lessons";
import { getLesson } from "../arabic/curriculum";
import {
  MAX_EVENT_AGE_MS,
  offlineEventValidator,
  type OfflineEvent,
  type OfflineEventResult,
} from "./contract";

/** Un geste ne dure pas dix minutes : au-delà, le téléphone était posé. */
const MAX_TIME_SPENT_MS = 10 * 60_000;
/** Un palier compte dix exercices ; une séance plus longue n'en est pas une. */
const MAX_SESSION_EXERCISES = 50;
const MAX_SESSION_LOG = 500;
/** Comme `badges.markBadgesSeen`. */
const LAST_SEEN_BADGE_IDS_CAP = 100;

export const apply = mutation({
  args: { event: offlineEventValidator },
  handler: async (ctx, args): Promise<OfflineEventResult> => {
    const profile = await callerProfile(ctx);
    // Une entrée sans élève derrière n'est pas refusée pour de bon : la
    // session a pu expirer, et l'enfant se reconnectera. On lève ; l'appareil
    // garde l'entrée et réessaiera.
    if (!profile || profile.role !== "student") {
      throw new Error("Élève non authentifié");
    }

    const now = Date.now();
    const event = args.event;
    if (event.at < now - MAX_EVENT_AGE_MS) {
      return { status: "rejected", reason: "too_old" };
    }

    switch (event.kind) {
      case "palierSession":
        return await applyPalierSession(ctx, profile, event, now);
      case "arabicAttempt":
        return await applyArabicAttempt(ctx, profile, event, now);
      case "arabicLessonComplete":
        return await applyLessonComplete(ctx, profile, event, now);
      case "soundEnabled":
        return await patchPrefs(ctx, profile, (prefs) =>
          prefs.soundEnabled === event.enabled ? null : { ...prefs, soundEnabled: event.enabled },
        );
      case "levelSeen":
        return await patchPrefs(ctx, profile, (prefs) =>
          event.level <= (prefs.lastSeenLevel ?? 1) ? null : { ...prefs, lastSeenLevel: event.level },
        );
      case "badgesSeen":
        return await patchPrefs(ctx, profile, (prefs) => {
          const current = prefs.lastSeenBadgeIds ?? [];
          const known = new Set(current);
          const additions = event.badgeIds.map((id) => id as string).filter((id) => !known.has(id));
          if (additions.length === 0) return null;
          return {
            ...prefs,
            lastSeenBadgeIds: [...current, ...additions].slice(-LAST_SEEN_BADGE_IDS_CAP),
          };
        });
    }
  },
});

/** Une date d'appareil, ramenée dans ce qui est possible : jamais dans le futur. */
function clampTime(at: number, now: number): number {
  if (!Number.isFinite(at)) return now;
  return Math.max(now - MAX_EVENT_AGE_MS, Math.min(at, now));
}

// ===========================================================================
// UNE SÉANCE DE PALIER
// ===========================================================================

async function applyPalierSession(
  ctx: MutationCtx,
  profile: Doc<"profiles">,
  event: Extract<OfflineEvent, { kind: "palierSession" }>,
  now: number,
): Promise<OfflineEventResult> {
  const session = event.session;
  if (session.exerciseIds.length === 0 || session.exerciseIds.length > MAX_SESSION_EXERCISES) {
    return { status: "rejected", reason: "bad_exercises" };
  }
  if (session.log.length > MAX_SESSION_LOG) {
    return { status: "rejected", reason: "log_too_long" };
  }

  const palier = await ctx.db.get(session.palierId);
  if (!palier) return { status: "rejected", reason: "palier_not_found" };
  const topic = await ctx.db.get(palier.topicId);
  // La classe de l'élève, jugée sur la thématique et sur le palier, comme
  // `paliers.startPalierAttempt`.
  const caller = { role: profile.role, studentClass: profile.class ?? null };
  if (!topic || !topicOpenTo(caller, topic.class) || !topicOpenTo(caller, palier.class)) {
    return { status: "rejected", reason: "wrong_class" };
  }
  if (palier.palierIndex > effectivePalierCount(topic)) {
    return { status: "rejected", reason: "palier_out_of_topic" };
  }

  let attempt = await ctx.db
    .query("palierAttempts")
    .withIndex("by_user_clientSession", (q) =>
      q.eq("userId", profile._id).eq("clientSessionId", session.sessionId),
    )
    .unique();
  if (attempt && attempt.palierId !== session.palierId) {
    return { status: "rejected", reason: "session_mismatch" };
  }

  // Les exercices nommés par la séance. Un exercice qui existe doit être de
  // ce palier — ou une variation de CETTE tentative. Un exercice disparu (le
  // palier a été régénéré depuis) reste accepté : ses lignes d'essai
  // s'écrivent avec le verdict de l'appareil.
  const ids = new Set<string>(session.exerciseIds as string[]);
  for (const entry of session.log) ids.add(entry.exerciseId as string);
  const docs = new Map<string, Doc<"exercises"> | null>();
  for (const id of ids) docs.set(id, await ctx.db.get(id as Id<"exercises">));
  const belongs = (id: string): boolean => {
    const doc = docs.get(id);
    if (!doc) return true;
    if (doc.palierId !== session.palierId) return false;
    return doc.palierAttemptId === undefined || doc.palierAttemptId === attempt?._id;
  };
  const played = session.exerciseIds.filter((id) => belongs(id as string));
  if (played.length === 0) return { status: "rejected", reason: "bad_exercises" };

  if (!attempt) {
    const id = await ctx.db.insert("palierAttempts", {
      userId: profile._id,
      palierId: session.palierId,
      startedAt: clampTime(session.startedAt, now),
      status: "in_progress",
      regenCount: 0,
      clientSessionId: session.sessionId,
      playedExerciseIds: played,
      syncedLogLength: 0,
    });
    attempt = (await ctx.db.get(id))!;
  }

  const result: OfflineEventResult & { status: "applied" | "duplicate" } = {
    status: "duplicate",
    palierAttemptId: attempt._id,
  };

  // Une tentative déjà notée ne prend plus rien : le reste du journal est
  // d'avant la note. Une nouvelle chance (`regenerateFailedExercises`) la
  // remet `in_progress`, et la suite s'écrit de nouveau.
  if (attempt.status === "in_progress") {
    if (!sameIds(attempt.playedExerciseIds, played)) {
      await ctx.db.patch(attempt._id, { playedExerciseIds: played });
      result.status = "applied";
    }

    const already = attempt.syncedLogLength ?? 0;
    if (session.log.length > already) {
      const playedSet = new Set(played as string[]);
      const realCounts = new Map<string, number>();
      for (let i = already; i < session.log.length; i++) {
        const entry = session.log[i];
        const exerciseId = entry.exerciseId as string;
        if (!playedSet.has(exerciseId)) continue;
        if (!realCounts.has(exerciseId)) {
          const rows = await ctx.db
            .query("attempts")
            .withIndex("by_palierAttempt_exercise", (q) =>
              q.eq("palierAttemptId", attempt!._id).eq("exerciseId", entry.exerciseId),
            )
            .take(100);
          realCounts.set(exerciseId, countRealAttempts(rows));
        }
        const doc = docs.get(exerciseId) ?? null;
        const at = clampTime(entry.at, now);

        if (entry.kind === "answer") {
          const real = realCounts.get(exerciseId)!;
          if (real >= MAX_ATTEMPTS_PER_EXERCISE) continue;
          await ctx.db.insert("attempts", {
            studentId: profile._id,
            exerciseId: entry.exerciseId,
            submittedAnswer: entry.answer,
            isCorrect: doc ? verifyAnswer(doc, entry.answer) : entry.correct,
            attemptNumber: real + 1,
            hintsUsedCount: 0,
            timeSpentMs: Math.max(0, Math.min(entry.timeSpentMs, MAX_TIME_SPENT_MS)),
            submittedAt: at,
            palierAttemptId: attempt._id,
          });
          realCounts.set(exerciseId, real + 1);
        } else {
          if (doc && (entry.hintIndex < 0 || entry.hintIndex >= doc.hints.length)) continue;
          // Même ligne sentinelle que `palierAttempts.requestHint`.
          await ctx.db.insert("attempts", {
            studentId: profile._id,
            exerciseId: entry.exerciseId,
            submittedAnswer: `__HINT_${entry.hintIndex}`,
            isCorrect: false,
            attemptNumber: 0,
            hintsUsedCount: 1,
            timeSpentMs: 0,
            submittedAt: at,
            palierAttemptId: attempt._id,
          });
        }
      }
      await ctx.db.patch(attempt._id, { syncedLogLength: session.log.length });
      result.status = "applied";
    }
  }

  if (session.finishedAt !== undefined) {
    const fresh = (await ctx.db.get(attempt._id))!;
    const wasOpen = fresh.status === "in_progress";
    const graded = await finishPalierAttempt(ctx, profile, fresh, {
      at: clampTime(session.finishedAt, now),
      scheduleBadges: true,
    });
    if (wasOpen) result.status = "applied";
    result.palier = {
      status: graded.status,
      starsTotal: graded.starsTotal,
      exerciseCount: graded.exerciseCount,
      canRegen: graded.canRegen,
    };
  }

  return result;
}

function sameIds(
  a: readonly Id<"exercises">[] | undefined,
  b: readonly Id<"exercises">[],
): boolean {
  if (!a || a.length !== b.length) return false;
  return a.every((id, i) => id === b[i]);
}

// ===========================================================================
// LE MODULE D'ARABE
// ===========================================================================

async function applyArabicAttempt(
  ctx: MutationCtx,
  profile: Doc<"profiles">,
  event: Extract<OfflineEvent, { kind: "arabicAttempt" }>,
  now: number,
): Promise<OfflineEventResult> {
  if (!isLessonItem(event.lessonKey, event.itemKey)) {
    return { status: "rejected", reason: "unknown_item" };
  }
  // La prononciation, la lecture et la récitation se jugent sur le serveur,
  // après transcription : jamais depuis l'appareil.
  if (event.drill === "pronounce" || event.drill === "read" || event.drill === "recite") {
    return { status: "rejected", reason: "server_judged_drill" };
  }
  const existing = await ctx.db
    .query("arabicAttempts")
    .withIndex("by_student_clientEvent", (q) =>
      q.eq("studentId", profile._id).eq("clientEventId", event.id),
    )
    .first();
  if (existing) return { status: "duplicate" };

  await insertDeviceAttempt(
    ctx,
    profile._id,
    {
      lessonKey: event.lessonKey,
      drill: event.drill,
      itemKey: event.itemKey,
      correct: event.correct,
      score: event.score,
      verdict: event.verdict,
    },
    clampTime(event.at, now),
    event.id,
  );
  return { status: "applied" };
}

async function applyLessonComplete(
  ctx: MutationCtx,
  profile: Doc<"profiles">,
  event: Extract<OfflineEvent, { kind: "arabicLessonComplete" }>,
  now: number,
): Promise<OfflineEventResult> {
  if (!getLesson(event.lessonKey)) return { status: "rejected", reason: "unknown_lesson" };
  const receipt = await ctx.db
    .query("offlineReceipts")
    .withIndex("by_student_event", (q) => q.eq("studentId", profile._id).eq("eventId", event.id))
    .unique();
  if (receipt) return { status: "duplicate" };

  const outcome = await closeLesson(ctx, profile._id, event.lessonKey, clampTime(event.at, now));
  if (!outcome) return { status: "rejected", reason: "no_attempts" };
  await ctx.db.insert("offlineReceipts", {
    studentId: profile._id,
    eventId: event.id,
    kind: event.kind,
    appliedAt: now,
  });
  return { status: "applied" };
}

// ===========================================================================
// LES RÉGLAGES — idempotents par nature : on n'écrit que ce qui change.
// ===========================================================================

async function patchPrefs(
  ctx: MutationCtx,
  profile: Doc<"profiles">,
  next: (prefs: StudentPreferences) => StudentPreferences | null,
): Promise<OfflineEventResult> {
  const updated = next(readStudentPreferences(profile));
  if (!updated) return { status: "duplicate" };
  await ctx.db.patch(profile._id, { preferences: updated });
  return { status: "applied" };
}
