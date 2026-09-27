import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Doc, Id } from "./_generated/dataModel";
import { isHiddenClass } from "./curriculum";
import {
  effectivePalierCount,
  isTopicComplete,
  nextPalierIndex,
  resolvePalierStatuses,
} from "./palierRules";
import type { QueryCtx } from "./_generated/server";
import { getConditionText, normalizeRarity } from "./badges";
import {
  callerIsAdmin,
  callerMayReadStudent,
  checkAccess,
  requireAccess,
} from "./access";

// ---------------------------------------------------------------------------
// Star approximation helper.
//
// Per Decision D3c + scoring.ts: true stars are computed per-exercise (0..3
// each, summed to 0..30 per palier). Recomputing that for every historical
// palierAttempt would require N attempt reads × M exercises = expensive.
//
// For aggregate UI surfaces (topic header, subject map, profile total) we use
// a 1..3 crown-style approximation derived from the palier's averageScore:
//   - average >= 9 → 3 stars
//   - average >= 7 → 2 stars (PALIER_VALIDATION_THRESHOLD)
//   - average  < 7 → 1 star (only when defensively included)
// Actual per-exercise stars are still rendered exactly inside the session UI.
// ---------------------------------------------------------------------------
export function approxStarsForValidatedPalier(averageScore: number): number {
  if (averageScore >= 9) return 3;
  if (averageScore >= 7) return 2;
  return 1;
}

// ---------------------------------------------------------------------------
// Level helpers (Decision D3b)
// ---------------------------------------------------------------------------
export const EXOS_PER_LEVEL = 50;
export function computeLevel(totalCorrectExercises: number): number {
  return Math.floor(totalCorrectExercises / EXOS_PER_LEVEL) + 1;
}
export function exosToNextLevel(totalCorrectExercises: number): number {
  return EXOS_PER_LEVEL - (totalCorrectExercises % EXOS_PER_LEVEL);
}

// ---------------------------------------------------------------------------
// Student preferences shape (stored under profiles.preferences, v.any()).
// ---------------------------------------------------------------------------
export type StudentStreakState = {
  current: number;
  longest: number;
  lastActivityYmd?: string;
  freezeAvailableUntilYmd?: string;
};
export type StudentPreferences = {
  soundEnabled?: boolean;
  streak?: StudentStreakState;
  // D25/D21 — server-side memo of which earned badges the student has seen on
  // /complete. Diff against earnedBadges → unseenBadges in getMyStats. Capped
  // rolling at 100 entries (Guardian C4) inside markBadgesSeen.
  lastSeenBadgeIds?: string[];
  // D2b/D24 — server-side memo of the highest level the student has been
  // shown the celebration overlay for. Diff against computeLevel(...) →
  // unseenLevelUp in getMyStats. Always monotonically increasing.
  lastSeenLevel?: number;
  // Missions du jour (quests.ts) — étoiles de mission gagnées, à vie, bornées
  // par `questRules.QUEST_BONUS_CAP`. `getMyStats.totalStars` les ajoute.
  questBonusStars?: number;
};
export function readStudentPreferences(
  profile: Doc<"profiles">,
): StudentPreferences {
  return (profile.preferences as StudentPreferences | undefined) ?? {};
}

// ---------------------------------------------------------------------------
// Topic status resolution (D4 — linear unlock chain).
// Extracted as a pure function so the logic is unit-testable.
// ---------------------------------------------------------------------------
export type TopicInput = {
  id: string;
  order: number;
  isCompleted: boolean;
  validatedPaliers: number;
  hasInProgress: boolean;
  completedExercises: number;
};

export type TopicStatus = "locked" | "available" | "in_progress" | "completed";

export function resolveTopicStatuses(
  topics: TopicInput[],
): TopicStatus[] {
  const sorted = [...topics].sort((a, b) => a.order - b.order);
  const statuses: TopicStatus[] = [];
  let prevPassedForUnlock = true;

  for (const topic of sorted) {
    const passedForUnlock =
      topic.isCompleted || topic.validatedPaliers >= 1;

    let status: TopicStatus;
    if (!prevPassedForUnlock) {
      status = "locked";
    } else if (topic.isCompleted) {
      status = "completed";
    } else if (
      topic.hasInProgress ||
      topic.validatedPaliers > 0 ||
      topic.completedExercises > 0
    ) {
      status = "in_progress";
    } else {
      status = "available";
    }

    statuses.push(status);
    prevPassedForUnlock = passedForUnlock;
  }

  return statuses;
}

// ---------------------------------------------------------------------------
// CE QUE L'ÉLÈVE VOIT, ET OÙ IL EN EST — partagé par la carte, le sentier,
// le camp.
//
// LE NIVEAU DE L'ÉLÈVE FILTRE LE CATALOGUE (décision D10 de la spec, enfin
// réalisée). Un élève de CM1 ne voit que les thématiques de CM1 ; sans niveau
// sur le profil (ancienne donnée), il voit tout l'élémentaire, comme avant.
// Une thématique sans niveau n'est jamais montrée à un élève qui en a un :
// la séance la refuserait de toute façon.
//
// LA PROGRESSION SE LIT PAR PALIER. Le nombre de paliers d'une thématique est
// dynamique (`palierRules`), et une thématique est franchie quand tous ses
// paliers le sont — `studentTopicProgress.completedAt` en est la trace posée
// par `palierAttempts.submitPalier`, et le calcul depuis les tentatives la
// double pour les données d'avant.
// ---------------------------------------------------------------------------
const EMPTY_SET: ReadonlySet<number> = new Set();

async function topicsForStudent(
  ctx: QueryCtx,
  subjectId: Id<"subjects">,
  profile: Doc<"profiles">,
): Promise<Doc<"topics">[]> {
  const all = await ctx.db
    .query("topics")
    .withIndex("by_subjectId", (q) => q.eq("subjectId", subjectId))
    .take(1000);
  const studentClass =
    profile.class && !isHiddenClass(profile.class) ? profile.class : null;
  return all
    .filter((t) => !isHiddenClass(t.class))
    .filter((t) => studentClass === null || t.class === studentClass)
    .sort((a, b) => a.order - b.order);
}

async function loadTopicProgress(
  ctx: QueryCtx,
  studentId: Id<"profiles">,
): Promise<Map<string, Doc<"studentTopicProgress">>> {
  const rows = await ctx.db
    .query("studentTopicProgress")
    .withIndex("by_studentId", (q) => q.eq("studentId", studentId))
    .take(500);
  return new Map(rows.map((p) => [p.topicId as string, p] as const));
}

type PalierProgress = {
  /** Les index de paliers validés au moins une fois. */
  validated: Set<number>;
  /** Les index avec une tentative ouverte. */
  inProgress: Set<number>;
  /** La meilleure moyenne par palier validé, pour les étoiles. */
  bestScore: Map<number, number>;
};

type PalierProgressByTopic = {
  byTopic: Map<string, PalierProgress>;
  /** Le palier en cours le plus récent, pour « reprendre l'aventure ». */
  latestInProgress: { topicId: Id<"topics">; palierIndex: number } | null;
};

/**
 * Les tentatives de palier de l'élève, regroupées par thématique. Une lecture
 * bornée : au plus 500 tentatives, et une résolution par palier distinct.
 */
async function loadPalierProgress(
  ctx: QueryCtx,
  studentId: Id<"profiles">,
): Promise<PalierProgressByTopic> {
  const attempts = await ctx.db
    .query("palierAttempts")
    .withIndex("by_user", (q) => q.eq("userId", studentId))
    .order("desc")
    .take(500);

  const palierIds = Array.from(
    new Set(attempts.map((a) => a.palierId as string)),
  ) as Id<"paliers">[];
  const palierById = new Map<string, Doc<"paliers">>();
  await Promise.all(
    palierIds.map(async (pid) => {
      const palier = await ctx.db.get(pid);
      if (palier) palierById.set(pid as string, palier);
    }),
  );

  const byTopic = new Map<string, PalierProgress>();
  let latestInProgress: PalierProgressByTopic["latestInProgress"] = null;
  for (const attempt of attempts) {
    const palier = palierById.get(attempt.palierId as string);
    if (!palier) continue;
    const key = palier.topicId as string;
    const entry = byTopic.get(key) ?? {
      validated: new Set<number>(),
      inProgress: new Set<number>(),
      bestScore: new Map<number, number>(),
    };
    if (attempt.status === "validated") {
      entry.validated.add(palier.palierIndex);
      const score = attempt.averageScore ?? 0;
      if (score > (entry.bestScore.get(palier.palierIndex) ?? -1)) {
        entry.bestScore.set(palier.palierIndex, score);
      }
    } else if (attempt.status === "in_progress") {
      entry.inProgress.add(palier.palierIndex);
      if (latestInProgress === null) {
        latestInProgress = { topicId: palier.topicId, palierIndex: palier.palierIndex };
      }
    }
    byTopic.set(key, entry);
  }
  return { byTopic, latestInProgress };
}

function countValidatedWithin(validated: ReadonlySet<number>, palierCount: number): number {
  let n = 0;
  for (let i = 1; i <= palierCount; i++) if (validated.has(i)) n += 1;
  return n;
}

function topicInputFor(
  topic: Doc<"topics">,
  progress: Doc<"studentTopicProgress"> | undefined,
  paliers: PalierProgress | undefined,
): TopicInput {
  const palierCount = effectivePalierCount(topic);
  const validated = paliers?.validated ?? EMPTY_SET;
  return {
    id: topic._id as string,
    order: topic.order,
    isCompleted: progress?.completedAt != null || isTopicComplete(validated, palierCount),
    validatedPaliers: countValidatedWithin(validated, palierCount),
    hasInProgress: (paliers?.inProgress.size ?? 0) > 0,
    completedExercises: progress?.completedExercises ?? 0,
  };
}

// ---------------------------------------------------------------------------
// Queries for admin student management
// ---------------------------------------------------------------------------

/**
 * Annuaire des élèves de la plateforme — écran d'administration.
 *
 * Garde de RÔLE et non de paywall : cette lecture rend jusqu'à 1000 profils
 * d'élèves (nom, `userId`, `preferences`), sans aucun rapport avec le droit
 * d'accès de qui que ce soit. Ni `blockedStudent` ni `requireAccess` n'ont de
 * sens ici — ils jugent l'abonnement d'un élève, pas la qualité de l'appelant.
 *
 * `admin` seul : son unique appelant est `app/(admin)/admin/eleves/page.tsx`,
 * et lister tous les élèves de la plateforme dépasse ce dont un professeur a
 * besoin (ses élèves à lui passent par `profiles.getTeacherStudents`).
 *
 * Une requête ne lève jamais : [] pour tout autre appelant.
 */
export const listStudents = query({
  args: {},
  handler: async (ctx) => {
    if (!(await callerIsAdmin(ctx))) return [];

    const profiles = await ctx.db.query("profiles").take(1000);
    const students = profiles.filter((p) => p.role === "student");

    const results = [];
    for (const student of students) {
      // Count completed topics
      const progress = await ctx.db
        .query("studentTopicProgress")
        .withIndex("by_studentId", (q) => q.eq("studentId", student._id))
        .take(200);
      const completedTopics = progress.filter((p) => p.completedAt != null).length;

      // Count badges
      const earnedBadges = await ctx.db
        .query("earnedBadges")
        .withIndex("by_studentId", (q) => q.eq("studentId", student._id))
        .take(100);

      results.push({
        ...student,
        completedTopics,
        badgeCount: earnedBadges.length,
      });
    }

    return results;
  },
});

/**
 * Dossier complet d'un élève — écrans administration et professeur.
 *
 * Garde de LIEN et non de paywall : progression par matière, badges et dix
 * dernières tentatives d'un élève nommé en argument. `blockedStudent` et
 * `requireAccess` jugeraient l'abonnement, pas le droit de l'appelant sur cet
 * élève-là.
 *
 * `callerMayReadStudent` et non `callerIsStaff` : le garde de rôle autorisait
 * tout le personnel à lire le dossier de N'IMPORTE QUEL élève. La page
 * enseignant vérifiait bien le lien, mais côté client seulement
 * (`app/(teacher)/teacher/students/[id]/page.tsx`) — une redirection est du
 * confort, pas une autorisation. Cette vérification client reste en place ;
 * ici est le verrou. Un `admin` continue de tout voir, donc
 * `app/(admin)/admin/eleves/[id]` ne régresse pas.
 *
 * Une requête ne lève jamais : null pour tout autre appelant.
 */
export const getStudentDetail = query({
  args: { studentId: v.id("profiles") },
  handler: async (ctx, args) => {
    if (!(await callerMayReadStudent(ctx, args.studentId))) return null;

    const student = await ctx.db.get(args.studentId);
    if (!student || student.role !== "student") {
      return null;
    }

    // Get all progress entries
    const progress = await ctx.db
      .query("studentTopicProgress")
      .withIndex("by_studentId", (q) => q.eq("studentId", args.studentId))
      .take(200);

    // Get subject progress with topic info
    const subjectProgress: Record<
      string,
      {
        subjectId: string;
        subjectName: string;
        subjectColor: string;
        totalTopics: number;
        completedTopics: number;
        totalExercises: number;
        correctExercises: number;
      }
    > = {};

    for (const p of progress) {
      const topic = await ctx.db.get(p.topicId);
      if (!topic) continue;
      const subject = await ctx.db.get(topic.subjectId);
      if (!subject) continue;

      if (!subjectProgress[subject._id]) {
        // Count total topics in subject
        // Les niveaux masqués ne comptent pas dans le total : l'élève ne
        // peut pas les travailler, les inclure afficherait une progression
        // qu'aucun travail ne ferait monter (`convex/curriculum.ts`).
        const allTopics = (
          await ctx.db
            .query("topics")
            .withIndex("by_subjectId", (q) => q.eq("subjectId", subject._id))
            .take(1000)
        ).filter((topic) => !isHiddenClass(topic.class));

        subjectProgress[subject._id] = {
          subjectId: subject._id,
          subjectName: subject.name,
          subjectColor: subject.color,
          totalTopics: allTopics.length,
          completedTopics: 0,
          totalExercises: 0,
          correctExercises: 0,
        };
      }

      subjectProgress[subject._id].totalExercises += p.completedExercises;
      subjectProgress[subject._id].correctExercises += p.correctExercises;
      if (p.completedAt != null) {
        subjectProgress[subject._id].completedTopics += 1;
      }
    }

    // Get earned badges
    const earnedBadges = await ctx.db
      .query("earnedBadges")
      .withIndex("by_studentId", (q) => q.eq("studentId", args.studentId))
      .take(100);

    const badgesWithInfo = [];
    for (const eb of earnedBadges) {
      const badge = await ctx.db.get(eb.badgeId);
      if (badge) {
        badgesWithInfo.push({ ...eb, badge });
      }
    }

    // Get recent attempts (last 10) — use desc order + take to avoid loading all
    const sortedAttempts = await ctx.db
      .query("attempts")
      .withIndex("by_studentId", (q) => q.eq("studentId", args.studentId))
      .order("desc")
      .take(10);

    const attemptsWithInfo = [];
    for (const attempt of sortedAttempts) {
      const exercise = await ctx.db.get(attempt.exerciseId);
      let topicName = "";
      if (exercise) {
        const topic = await ctx.db.get(exercise.topicId);
        topicName = topic?.name ?? "";
      }
      attemptsWithInfo.push({
        ...attempt,
        exercisePrompt: exercise?.prompt ?? "",
        exerciseType: exercise?.type ?? "",
        topicName,
      });
    }

    return {
      student,
      subjectProgress: Object.values(subjectProgress),
      earnedBadges: badgesWithInfo,
      recentAttempts: attemptsWithInfo,
    };
  },
});

/**
 * Auth-scoped wrapper: returns stats for the currently-logged-in student.
 * Used by the student's profile page and home — the client doesn't have to
 * pass (and possibly spoof) a studentId.
 *
 * Decision D3b — `level` derived from totalCorrectExercises (50 / level).
 * Decision D3c — `totalStars` approximated from validated palierAttempts.
 * Decision D7  — `streaksEnabled` reflects ANY parentSettings.streaksEnabled
 *                = true. Default OFF when no settings exist (wellbeing).
 *                When OFF, streak fields are returned as zeros so the UI
 *                can hide the surface entirely.
 * Decision D6  — `soundEnabled` from profiles.preferences (default false).
 */
export const getMyStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId as string))
      .unique();
    if (!profile || profile.role !== "student") return null;

    // Paywall (spec §5.4) — même valeur de retour que le garde-fou de rôle
    // ci-dessus : une requête ne lève jamais.
    const access = await checkAccess(ctx, profile);
    if (!access.ok) return null;

    const studentId = profile._id;

    const progress = await ctx.db
      .query("studentTopicProgress")
      .withIndex("by_studentId", (q) => q.eq("studentId", studentId))
      .take(200);
    const completedTopics = progress.filter((p) => p.completedAt != null).length;
    const totalExercises = progress.reduce(
      (s, p) => s + p.completedExercises,
      0,
    );
    const totalCorrectExercises = progress.reduce(
      (s, p) => s + p.correctExercises,
      0,
    );

    const earnedBadges = await ctx.db
      .query("earnedBadges")
      .withIndex("by_studentId", (q) => q.eq("studentId", studentId))
      .take(100);
    const badgesWithInfo = [];
    for (const eb of earnedBadges) {
      const badge = await ctx.db.get(eb.badgeId);
      if (badge) {
        // D10 — normalize rarity at the read boundary so the client always
        // receives the typed enum value.
        badgesWithInfo.push({
          ...eb,
          badge: {
            ...badge,
            rarity: normalizeRarity(badge.rarity),
            criteriaText: getConditionText(badge.condition),
          },
        });
      }
    }

    const attempts = await ctx.db
      .query("attempts")
      .withIndex("by_studentId", (q) => q.eq("studentId", studentId))
      .take(1000);
    const totalTimeMs = attempts.reduce((s, a) => s + a.timeSpentMs, 0);

    // D3c — total stars approximated from validated palierAttempts.
    const palierAttempts = await ctx.db
      .query("palierAttempts")
      .withIndex("by_user", (q) => q.eq("userId", studentId))
      .take(500);
    const totalStars = palierAttempts.reduce((acc, a) => {
      if (a.status !== "validated") return acc;
      return acc + approxStarsForValidatedPalier(a.averageScore ?? 0);
    }, 0);

    const subjectCounts: Record<string, { name: string; count: number }> = {};
    for (const p of progress) {
      if (p.completedAt == null) continue;
      const topic = await ctx.db.get(p.topicId);
      if (!topic) continue;
      const subject = await ctx.db.get(topic.subjectId);
      if (!subject) continue;
      if (!subjectCounts[subject._id]) {
        subjectCounts[subject._id] = { name: subject.name, count: 0 };
      }
      subjectCounts[subject._id].count += 1;
    }
    const favoriteSubject =
      Object.values(subjectCounts).sort((a, b) => b.count - a.count)[0]?.name ??
      null;

    // D7 (revised) — Streaks default ON for everyone (matches Duolingo
    // baseline). Parents can opt OUT via parentSettings.streaksEnabled = false.
    // Strict respect: if ANY linked parent has explicitly set false, streak
    // is disabled (the more conservative parent's wishes win).
    // No parent linked ⇒ default ON (autonomous student case).
    const parentSettings = await ctx.db
      .query("parentSettings")
      .withIndex("by_kid", (q) => q.eq("kidId", studentId))
      .take(10);
    const streaksEnabled = !parentSettings.some(
      (s) => s.streaksEnabled === false,
    );

    const prefs = readStudentPreferences(profile);
    const soundEnabled = prefs.soundEnabled === true;
    const soundOptInDecided = prefs.soundEnabled !== undefined;
    const streak = streaksEnabled
      ? (prefs.streak ?? {
          current: 0,
          longest: 0,
          lastActivityYmd: undefined,
          freezeAvailableUntilYmd: undefined,
        })
      : { current: 0, longest: 0 };

    // D25 — unseenBadges = earnedBadges minus prefs.lastSeenBadgeIds. The
    // /complete page reveals these in a "Nouveau badge !" card and then calls
    // markBadgesSeen so subsequent loads don't replay the celebration.
    const seen = new Set(prefs.lastSeenBadgeIds ?? []);
    const unseenBadges = badgesWithInfo
      .filter((b) => !seen.has(b.badgeId as string))
      .sort((a, b) => b.earnedAt - a.earnedAt);

    // D2b/D24 — unseenLevelUp signals the /complete page to show the level-up
    // overlay + play sound. Once shown, the page calls markLevelSeen and the
    // value resets to null until the kid earns the next level.
    const currentLevel = computeLevel(totalCorrectExercises);
    const unseenLevelUp =
      currentLevel > (prefs.lastSeenLevel ?? 1)
        ? { level: currentLevel }
        : null;

    return {
      student: profile,
      completedTopics,
      totalExercises,
      totalCorrectExercises,
      badgeCount: earnedBadges.length,
      totalTimeMs,
      favoriteSubject,
      recentBadges: badgesWithInfo
        .sort((a, b) => b.earnedAt - a.earnedAt)
        .slice(0, 3),
      // D3b — level
      level: computeLevel(totalCorrectExercises),
      exosToNextLevel: exosToNextLevel(totalCorrectExercises),
      // D3c — total stars, plus les étoiles de mission (quests.ts).
      totalStars: totalStars + (prefs.questBonusStars ?? 0),
      // D7 — streak
      streaksEnabled,
      currentStreak: streak.current,
      longestStreak: streak.longest,
      // D6 — sound
      soundEnabled,
      // D20/D21 — drives "should we show the opt-in dialog?" check (false ⇒
      // student has never been asked, regardless of which device they use).
      soundOptInDecided,
      // D25 — unseen badges drive the badge unlock card on /complete
      unseenBadges,
      // D2b/D24 — unseen level-up drives the LevelUpOverlay on /complete
      unseenLevelUp,
    };
  },
});

/**
 * D2b/D24 — Mark a given level as "seen" by the kid (after the LevelUpOverlay
 * has been shown). Idempotent and monotonic: only patches if the incoming
 * level is strictly greater than the stored one. Avoids both useless writes
 * and the regression case where an older overlay re-render would lower the
 * watermark.
 */
export const markLevelSeen = mutation({
  args: { level: v.number() },
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
    const current = prefs.lastSeenLevel ?? 1;
    if (args.level <= current) return; // Idempotent + monotonic.
    const next: StudentPreferences = { ...prefs, lastSeenLevel: args.level };
    await ctx.db.patch(profile._id, { preferences: next });
  },
});

/**
 * Lightweight version of getMyStats just for the sound preference.
 * Used by the session page to power the quick-mute icon (D22) without
 * subscribing to the heavy ~1810-doc-read getMyStats query during exercises.
 */
export const getMySoundEnabled = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId as string))
      .unique();
    if (!profile || profile.role !== "student") return null;

    // Paywall (spec §5.4) — même valeur de retour que le garde-fou de rôle
    // ci-dessus.
    const access = await checkAccess(ctx, profile);
    if (!access.ok) return null;

    const prefs = readStudentPreferences(profile);
    return { soundEnabled: prefs.soundEnabled === true };
  },
});

/**
 * Auth-scoped: return badges earned by the currently-logged-in student.
 */
export const getMyEarnedBadges = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId as string))
      .unique();
    if (!profile || profile.role !== "student") return [];

    // Paywall (spec §5.4) — même valeur de retour que le garde-fou de rôle
    // ci-dessus.
    const access = await checkAccess(ctx, profile);
    if (!access.ok) return [];

    const earned = await ctx.db
      .query("earnedBadges")
      .withIndex("by_studentId", (q) => q.eq("studentId", profile._id))
      .take(100);
    return earned.map((e) => ({
      _id: e._id,
      badgeId: e.badgeId as string,
      earnedAt: e.earnedAt,
    }));
  },
});

/**
 * Statistiques agrégées d'un élève — écran professeur.
 *
 * Garde de LIEN et non de paywall, même raisonnement que `getStudentDetail`
 * ci-dessus, réserve comprise : le garde de rôle qui vivait ici rendait les
 * statistiques de n'importe quel élève à n'importe quel membre du personnel.
 *
 * Appelée par `app/(teacher)/teacher/students/[id]`, dont la vérification de
 * lien côté client reste en place — elle redirige proprement, elle ne protège
 * rien.
 *
 * Une requête ne lève jamais : null pour tout autre appelant.
 */
export const getStudentStats = query({
  args: { studentId: v.id("profiles") },
  handler: async (ctx, args) => {
    if (!(await callerMayReadStudent(ctx, args.studentId))) return null;

    const student = await ctx.db.get(args.studentId);
    if (!student || student.role !== "student") {
      return null;
    }

    // Get progress
    const progress = await ctx.db
      .query("studentTopicProgress")
      .withIndex("by_studentId", (q) => q.eq("studentId", args.studentId))
      .take(200);

    const completedTopics = progress.filter((p) => p.completedAt != null).length;
    const totalExercises = progress.reduce((s, p) => s + p.completedExercises, 0);

    // Get badges
    const earnedBadges = await ctx.db
      .query("earnedBadges")
      .withIndex("by_studentId", (q) => q.eq("studentId", args.studentId))
      .take(100);

    const badgesWithInfo = [];
    for (const eb of earnedBadges) {
      const badge = await ctx.db.get(eb.badgeId);
      if (badge) {
        badgesWithInfo.push({ ...eb, badge });
      }
    }

    // Get total time spent from attempts
    const attempts = await ctx.db
      .query("attempts")
      .withIndex("by_studentId", (q) => q.eq("studentId", args.studentId))
      .take(1000);

    const totalTimeMs = attempts.reduce((s, a) => s + a.timeSpentMs, 0);

    // Find favorite subject (most completed topics)
    const subjectCounts: Record<string, { name: string; count: number }> = {};
    for (const p of progress) {
      if (p.completedAt == null) continue;
      const topic = await ctx.db.get(p.topicId);
      if (!topic) continue;
      const subject = await ctx.db.get(topic.subjectId);
      if (!subject) continue;
      if (!subjectCounts[subject._id]) {
        subjectCounts[subject._id] = { name: subject.name, count: 0 };
      }
      subjectCounts[subject._id].count += 1;
    }

    const favoriteSubject = Object.values(subjectCounts).sort(
      (a, b) => b.count - a.count,
    )[0]?.name ?? null;

    return {
      student,
      completedTopics,
      totalExercises,
      badgeCount: earnedBadges.length,
      totalTimeMs,
      favoriteSubject,
      recentBadges: badgesWithInfo
        .sort((a, b) => b.earnedAt - a.earnedAt)
        .slice(0, 3),
    };
  },
});

/**
 * Auth-scoped: subject "path map" for the current student.
 *
 * Returns the subject + ordered topics with per-topic status:
 *   - locked       — previous topic not yet passed
 *   - available    — unlocked, no progress
 *   - in_progress  — at least one palier started or one validated, not all done
 *   - completed    — studentTopicProgress.completedAt set
 *
 * Linear unlock rule (D4): topic N+1 is reachable as soon as topic N has at
 * least one validated palier OR studentTopicProgress.completedAt set.
 * (`completedAt` is the canonical signal but is rarely set in current data,
 * so the "1 validated palier" heuristic prevents kids from being stuck.)
 *
 * Read amplification: O(topics) + O(unique paliers attempted by this user).
 * For a typical student this is < 50 doc reads per call.
 */
export const getStudentSubjectMap = query({
  args: { subjectId: v.id("subjects") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId as string))
      .unique();
    if (!profile || profile.role !== "student") return null;

    // Paywall (spec §5.4) — même valeur de retour que le garde-fou de rôle
    // ci-dessus.
    const access = await checkAccess(ctx, profile);
    if (!access.ok) return null;

    const studentId = profile._id;

    const subject = await ctx.db.get(args.subjectId);
    if (!subject) return null;

    const topics = await topicsForStudent(ctx, args.subjectId, profile);
    const progressByTopicId = await loadTopicProgress(ctx, studentId);
    const { byTopic } = await loadPalierProgress(ctx, studentId);

    const topicInputs: TopicInput[] = topics.map((topic) =>
      topicInputFor(
        topic,
        progressByTopicId.get(topic._id as string),
        byTopic.get(topic._id as string),
      ),
    );
    const statuses = resolveTopicStatuses(topicInputs);

    const orderedTopics = topics.map((topic, i) => {
      const paliersDone = byTopic.get(topic._id as string);
      const validated = paliersDone?.validated ?? EMPTY_SET;
      const inProgress = paliersDone?.inProgress ?? EMPTY_SET;
      const progress = progressByTopicId.get(topic._id as string);
      const palierCount = effectivePalierCount(topic);
      const status = statuses[i];

      // Chaque palier est une étape du sentier, avec son état et ses étoiles.
      const paliers = resolvePalierStatuses({
        topicLocked: status === "locked",
        palierCount,
        validated,
        inProgress,
      }).map((palierStatus, idx) => {
        const index = idx + 1;
        const stars =
          palierStatus === "completed"
            ? approxStarsForValidatedPalier(paliersDone?.bestScore.get(index) ?? 0)
            : 0;
        return { index, status: palierStatus, stars };
      });

      return {
        _id: topic._id,
        name: topic.name,
        description: topic.description,
        order: topic.order,
        class: topic.class ?? null,
        status,
        palierCount,
        validatedPaliers: countValidatedWithin(validated, palierCount),
        nextPalierIndex: nextPalierIndex(validated, palierCount),
        starsApprox: paliers.reduce((acc, p) => acc + p.stars, 0),
        completedExercises: progress?.completedExercises ?? 0,
        correctExercises: progress?.correctExercises ?? 0,
        paliers,
      };
    });

    const totalStarsApprox = orderedTopics.reduce(
      (acc, t) => acc + t.starsApprox,
      0,
    );
    const totalPaliers = orderedTopics.reduce((acc, t) => acc + t.palierCount, 0);
    const completedPaliers = orderedTopics.reduce(
      (acc, t) => acc + t.paliers.filter((p) => p.status === "completed").length,
      0,
    );

    return {
      subject: {
        _id: subject._id,
        name: subject.name,
        icon: subject.icon,
        color: subject.color,
      },
      topics: orderedTopics,
      totalStarsApprox,
      totalPaliers,
      completedPaliers,
    };
  },
});

// ---------------------------------------------------------------------------
// LE MONDE DE PIO — deux lectures pour le camp et la carte.
//
// `getMyWorldMap` : les matières vues comme des mondes, avec la part du
// chemin déjà faite dans chacun. `getMyNextStep` : où reprendre, pour que le
// bouton « Continuer l'aventure » du camp mène toujours quelque part.
//
// TOUTES DEUX SONT DÉRIVÉES DE LA SESSION, sans argument : l'élève ne lit que
// lui-même, comme `getMyStats`. Même garde de rôle, même paywall, même
// convention — une requête ne lève jamais, elle rend `null` ou vide.
// ---------------------------------------------------------------------------

/**
 * Les mondes de l'élève : chaque matière avec ses étapes visibles et la part
 * franchie. Une matière sans étape jouable pour son niveau n'apparaît pas —
 * même règle que `subjects.list`, calculée ici sans lui emprunter son
 * helper, parce que celui-ci sert aussi des adultes qui voient tout.
 */
export const getMyWorldMap = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId as string))
      .unique();
    if (!profile || profile.role !== "student") return null;
    const access = await checkAccess(ctx, profile);
    if (!access.ok) return null;

    const subjects = (await ctx.db.query("subjects").take(50)).sort(
      (a, b) => a.order - b.order,
    );
    const progressByTopic = await loadTopicProgress(ctx, profile._id);
    const { byTopic } = await loadPalierProgress(ctx, profile._id);

    const zones = [];
    for (const subject of subjects) {
      const topics = await topicsForStudent(ctx, subject._id, profile);
      if (topics.length === 0) continue;

      let completedTopics = 0;
      let startedTopics = 0;
      let totalPaliers = 0;
      let completedPaliers = 0;
      for (const t of topics) {
        const palierCount = effectivePalierCount(t);
        const validated = byTopic.get(t._id as string)?.validated ?? EMPTY_SET;
        const p = progressByTopic.get(t._id as string);
        const done = p?.completedAt != null || isTopicComplete(validated, palierCount);
        totalPaliers += palierCount;
        completedPaliers += done ? palierCount : countValidatedWithin(validated, palierCount);
        if (done) completedTopics += 1;
        else if (validated.size > 0 || (p?.completedExercises ?? 0) > 0) startedTopics += 1;
      }

      zones.push({
        _id: subject._id,
        name: subject.name,
        color: subject.color,
        icon: subject.icon,
        order: subject.order,
        totalTopics: topics.length,
        completedTopics,
        startedTopics,
        totalPaliers,
        completedPaliers,
      });
    }
    return zones;
  },
});

/**
 * Où reprendre l'aventure.
 *
 *   1. Un palier laissé EN COURS, le plus récent : on y retourne. C'est la
 *      promesse du bouton — « là où tu t'es arrêté », pas « au début de la
 *      première matière ».
 *   2. Sinon, la première étape ouverte ou en cours, en parcourant les
 *      mondes dans l'ordre — les mêmes statuts que le sentier
 *      (`resolveTopicStatuses`), pour ne jamais envoyer l'enfant sur une
 *      étape que le sentier montre fermée.
 *   3. Sinon, tout est franchi : on l'envoie admirer la carte.
 */
export const getMyNextStep = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId as string))
      .unique();
    if (!profile || profile.role !== "student") return null;
    const access = await checkAccess(ctx, profile);
    if (!access.ok) return null;
    const studentId = profile._id;

    const { byTopic, latestInProgress } = await loadPalierProgress(ctx, studentId);
    const studentClass =
      profile.class && !isHiddenClass(profile.class) ? profile.class : null;

    // 1. Le palier en cours le plus récent, s'il est encore dans le catalogue
    //    de l'élève.
    if (latestInProgress) {
      const topic = await ctx.db.get(latestInProgress.topicId);
      if (
        topic &&
        !isHiddenClass(topic.class) &&
        (studentClass === null || topic.class === studentClass) &&
        latestInProgress.palierIndex <= effectivePalierCount(topic)
      ) {
        const subject = await ctx.db.get(topic.subjectId);
        if (subject) {
          return {
            kind: "continue" as const,
            topicId: topic._id,
            topicName: topic.name,
            palierIndex: latestInProgress.palierIndex,
            subjectId: subject._id,
            subjectName: subject.name,
            subjectColor: subject.color,
          };
        }
      }
    }

    // 2. La première étape ouverte, mondes dans l'ordre.
    const progressByTopic = await loadTopicProgress(ctx, studentId);
    const subjects = (await ctx.db.query("subjects").take(50)).sort(
      (a, b) => a.order - b.order,
    );
    let anySubject = false;
    for (const subject of subjects) {
      const topics = await topicsForStudent(ctx, subject._id, profile);
      if (topics.length === 0) continue;
      anySubject = true;

      const inputs: TopicInput[] = topics.map((t) =>
        topicInputFor(t, progressByTopic.get(t._id as string), byTopic.get(t._id as string)),
      );
      const statuses = resolveTopicStatuses(inputs);
      const idx = statuses.findIndex(
        (st) => st === "in_progress" || st === "available",
      );
      if (idx === -1) continue;

      const topic = topics[idx];
      const validated = byTopic.get(topic._id as string)?.validated ?? EMPTY_SET;
      return {
        kind: "start" as const,
        topicId: topic._id,
        topicName: topic.name,
        palierIndex: nextPalierIndex(validated, effectivePalierCount(topic)),
        subjectId: subject._id,
        subjectName: subject.name,
        subjectColor: subject.color,
      };
    }

    // 3. Rien d'ouvert : tout est franchi, ou il n'y a rien à jouer.
    return { kind: anySubject ? ("explore" as const) : ("empty" as const) };
  },
});
