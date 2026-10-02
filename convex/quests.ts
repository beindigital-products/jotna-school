import { v } from "convex/values";
import { internalMutation, mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Doc, Id } from "./_generated/dataModel";
import { checkAccess, requireAccess } from "./access";
import { isHiddenClass } from "./curriculum";
import { timestampToYmd, todayYmd } from "./streakRules";
import { readStudentPreferences, type StudentPreferences } from "./students";
import {
  QUEST_BONUS_CAP,
  allDone,
  applyActivity,
  bonusStarsFor,
  completedCount,
  pickDailyQuests,
  type Quest,
} from "./questRules";

// ---------------------------------------------------------------------------
// LES MISSIONS DU JOUR — lecture, création, progression.
//
// Une ligne `dailyMissions` par (élève, jour). Elle naît au premier passage au
// camp (`ensureDaily`) OU à la première fin de palier de la journée
// (`recordActivity`) — les deux se rejoignent sur la même clé, la même
// graine, donc les mêmes missions. Un enfant qui joue avant d'avoir ouvert le
// camp trouve ses missions déjà avancées.
//
// GATING PARENT (G10) : `parentSettings.dailyMissionEnabled`. Un seul parent
// à `false` suffit à couper — le parent le plus prudent l'emporte, comme pour
// la série. Sans parent rattaché, c'est ouvert.
//
// LE JOUR EST CELUI DE LA SÉRIE : `todayYmd()` de `streak.ts`, pour qu'une
// mission et un jour de série ne se contredisent jamais à minuit.
// ---------------------------------------------------------------------------

async function studentFromSession(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) return null;
  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_userId", (q) => q.eq("userId", userId as string))
    .unique();
  if (!profile || profile.role !== "student") return null;
  return profile;
}

async function missionsEnabledFor(ctx: QueryCtx | MutationCtx, studentId: Id<"profiles">) {
  const settings = await ctx.db
    .query("parentSettings")
    .withIndex("by_kid", (q) => q.eq("kidId", studentId))
    .take(10);
  return !settings.some((s) => s.dailyMissionEnabled === false);
}

/** Les matières jouables : au moins une étape visible pour ce niveau. */
export async function playableSubjects(ctx: QueryCtx | MutationCtx) {
  const subjects = (await ctx.db.query("subjects").take(50)).sort((a, b) => a.order - b.order);
  const out: { id: string; name: string }[] = [];
  for (const subject of subjects) {
    const topics = await ctx.db
      .query("topics")
      .withIndex("by_subjectId", (q) => q.eq("subjectId", subject._id))
      .take(30);
    if (topics.some((t) => !isHiddenClass(t.class))) {
      out.push({ id: subject._id as string, name: subject.name });
    }
  }
  return out;
}

async function todayRow(ctx: QueryCtx | MutationCtx, studentId: Id<"profiles">, dayKey: string) {
  return await ctx.db
    .query("dailyMissions")
    .withIndex("by_student_day", (q) => q.eq("studentId", studentId).eq("dayKey", dayKey))
    .unique();
}

/** Crée la ligne du jour si elle manque. Idempotent par la clé. */
async function ensureRow(ctx: MutationCtx, studentId: Id<"profiles">, dayKey: string) {
  const existing = await todayRow(ctx, studentId, dayKey);
  if (existing) return existing;

  const quests = pickDailyQuests({
    seed: `${studentId}|${dayKey}`,
    subjects: await playableSubjects(ctx),
  });
  const id = await ctx.db.insert("dailyMissions", {
    studentId,
    dayKey,
    quests: quests.map(toStored),
    bonusStars: 0,
    createdAt: Date.now(),
  });
  return (await ctx.db.get(id))!;
}

type StoredQuest = Doc<"dailyMissions">["quests"][number];

function toStored(q: Quest): StoredQuest {
  return {
    key: q.key,
    type: q.type,
    label: q.label,
    target: q.target,
    progress: q.progress,
    completedAt: q.completedAt,
    subjectId: q.subjectId as Id<"subjects"> | undefined,
    subjectName: q.subjectName,
  };
}

function fromStored(q: StoredQuest): Quest {
  return { ...q, subjectId: q.subjectId as string | undefined };
}

/**
 * Les missions du jour de l'élève. `null` = désactivées ou pas d'accès ;
 * `pending: true` = pas encore créées (le camp appelle `ensureDaily`).
 */
export const getMyDaily = query({
  args: {},
  handler: async (ctx) => {
    const profile = await studentFromSession(ctx);
    if (!profile) return null;
    const access = await checkAccess(ctx, profile);
    if (!access.ok) return null;
    if (!(await missionsEnabledFor(ctx, profile._id))) return null;

    const dayKey = todayYmd();
    const row = await todayRow(ctx, profile._id, dayKey);
    if (!row) return { dayKey, pending: true as const, quests: [] as StoredQuest[], bonusStars: 0, allDone: false };

    return {
      dayKey,
      pending: false as const,
      quests: row.quests,
      bonusStars: row.bonusStars,
      allDone: allDone(row.quests.map(fromStored)),
    };
  },
});

/** Le camp l'appelle au montage. Sans effet si la ligne existe déjà. */
export const ensureDaily = mutation({
  args: {},
  handler: async (ctx) => {
    const profile = await studentFromSession(ctx);
    if (!profile) return null;
    await requireAccess(ctx, profile);
    if (!(await missionsEnabledFor(ctx, profile._id))) return null;
    const row = await ensureRow(ctx, profile._id, todayYmd());
    return row._id;
  },
});

/**
 * Une fin de palier fait avancer les missions. Appelée par
 * `palierAttempts.submitPalier`, au même endroit que la série.
 *
 * LES ÉTOILES DE MISSION VONT DANS LES PRÉFÉRENCES DE L'ÉLÈVE
 * (`questBonusStars`), bornées, et `getMyStats.totalStars` les ajoute : un
 * agrégat de vie en une lecture, sans balayer les jours passés.
 */
export const recordActivity = internalMutation({
  args: {
    studentId: v.id("profiles"),
    exercises: v.number(),
    stars: v.number(),
    palierValidated: v.boolean(),
    subjectId: v.optional(v.id("subjects")),
    /** Le moment de la fin de palier : maintenant, ou celui d'un palier joué sans réseau. */
    at: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await recordQuestActivity(
      ctx,
      args.studentId,
      {
        exercises: args.exercises,
        stars: args.stars,
        palierValidated: args.palierValidated,
        subjectId: args.subjectId,
      },
      args.at ?? Date.now(),
    );
  },
});

/**
 * Fait avancer les missions du jour de `at` — fonction ordinaire, appelée dans
 * la transaction qui termine le palier. Un palier joué sans réseau un mardi
 * avance les missions du mardi, même rejoué le jeudi : la ligne de ce jour-là
 * naît au besoin, avec les missions que le camp aurait tirées ce jour-là (même
 * graine).
 */
export async function recordQuestActivity(
  ctx: MutationCtx,
  studentId: Id<"profiles">,
  activity: {
    exercises: number;
    stars: number;
    palierValidated: boolean;
    subjectId?: Id<"subjects">;
  },
  at: number,
) {
  const profile = await ctx.db.get(studentId);
  if (!profile || profile.role !== "student") return;
  if (!(await missionsEnabledFor(ctx, studentId))) return;

  // Jamais dans le futur : une horloge de téléphone en avance ne crée pas de
  // journée de missions.
  const when = Math.min(at, Date.now());
  const dayKey = timestampToYmd(when);
  const row = await ensureRow(ctx, studentId, dayKey);
  const before = row.quests.map(fromStored);
  const { quests, newlyCompleted } = applyActivity(
    before,
    {
      exercises: activity.exercises,
      stars: activity.stars,
      palierValidated: activity.palierValidated,
      subjectId: activity.subjectId as string | undefined,
    },
    when,
  );

  // Rien n'a bougé : pas d'écriture, pas de réveil des abonnés.
  const changed = quests.some((q, i) => q.progress !== before[i].progress || q.completedAt !== before[i].completedAt);
  if (!changed) return;

  const owed = bonusStarsFor(completedCount(quests), quests.length);
  const gained = Math.max(0, owed - row.bonusStars);

  await ctx.db.patch(row._id, {
    quests: quests.map(toStored),
    bonusStars: owed,
  });

  if (gained > 0) {
    const fresh = (await ctx.db.get(studentId)) ?? profile;
    const prefs = readStudentPreferences(fresh);
    const next: StudentPreferences = {
      ...prefs,
      questBonusStars: Math.min(QUEST_BONUS_CAP, (prefs.questBonusStars ?? 0) + gained),
    };
    await ctx.db.patch(studentId, { preferences: next });
  }

  return { newlyCompleted: newlyCompleted.map((q) => q.key), gained };
}
