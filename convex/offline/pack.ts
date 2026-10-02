/**
 * LE PAQUET HORS LIGNE — tout ce que l'application doit avoir sur le téléphone
 * pour que l'enfant joue sans réseau (`docs/hors-ligne.md`).
 *
 * Trois lectures, de poids et de rythme différents :
 *
 *   - `snapshot` : où en est l'enfant. Profil, réglages, accès, tentatives de
 *     palier résumées, progression des thématiques, trophées gagnés,
 *     missions, série, module d'arabe. Légère, l'application s'y ABONNE quand
 *     elle a du réseau : une fin de palier synchronisée, un trophée attribué,
 *     un placement d'arabe posé par le maître arrivent d'eux-mêmes.
 *   - `content` : ce qu'il y a à jouer. Les matières, les thématiques de SA
 *     classe, leurs paliers générés et leurs exercices COMPLETS — réponses et
 *     indices compris : sans réseau, c'est l'appareil qui juge (la règle est
 *     `paliers/exerciseRules.ts`, et le serveur rejuge tout à la
 *     synchronisation). Lourde, lue d'un coup, quand `snapshot.contentVersion`
 *     change ou une fois par jour.
 *   - `badgeInputs` : de quoi juger les trophées sur l'appareil. Les lignes
 *     d'essai récentes ; lue d'un coup après chaque synchronisation.
 *
 * UN ÉLÈVE NE LIT QUE LUI-MÊME, dérivé de la session, comme `getMyStats`. Une
 * requête ne lève jamais : `null` pour qui n'est pas un élève.
 *
 * LE PAYWALL N'EST PAS UN FILTRE ICI, C'EST UNE DONNÉE. `snapshot.access` dit
 * à l'application si l'accès est ouvert et jusqu'à quand ; c'est elle qui
 * ferme l'espace hors ligne quand il ne l'est plus (`lib/offline/access.ts`).
 * `content` et `badgeInputs`, eux, ne servent qu'à un accès ouvert.
 */
import { v } from "convex/values";
import { query, type QueryCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";
import { callerProfile, checkAccess } from "../access";
import { isHiddenClass, isReadingLearnerClass } from "../curriculum";
import { describeBadge } from "../badges";
import { moduleAccessForProfile } from "../modules";
import { MODULES } from "../moduleCatalog";
import { placementForStudent } from "../arabic/placement";
import { playableSubjects } from "../quests";
import { readStudentPreferences } from "../students";
import { timestampToYmd, addDaysYmd } from "../streakRules";
import { OFFLINE_PROTOCOL } from "./contract";

const ARABIC_MODULE = "arabe_coran" as const;

/** Les tentatives de palier lues : les mêmes bornes que `students.getMyStats`. */
const PALIER_ATTEMPTS_LIMIT = 500;
const TOPIC_PROGRESS_LIMIT = 500;
const EARNED_BADGES_LIMIT = 200;
/** Les essais lus pour le temps passé, comme le carnet (`getMyStats`). */
const TIME_ATTEMPTS_LIMIT = 1000;
/** Les essais lus pour juger les trophées, comme `badges.buildStudentSnapshot`. */
const BADGE_ATTEMPTS_LIMIT = 4000;

async function studentProfile(ctx: QueryCtx): Promise<Doc<"profiles"> | null> {
  const profile = await callerProfile(ctx);
  if (!profile || profile.role !== "student") return null;
  return profile;
}

/** Les thématiques de la classe de l'élève, toutes matières, dans l'ordre. */
async function classTopics(ctx: QueryCtx, profile: Doc<"profiles">) {
  const studentClass = profile.class;
  if (!studentClass || isHiddenClass(studentClass)) return [];
  const subjects = await ctx.db.query("subjects").take(50);
  const topics: Doc<"topics">[] = [];
  for (const subject of subjects) {
    const rows = await ctx.db
      .query("topics")
      .withIndex("by_subjectId_class", (q) =>
        q.eq("subjectId", subject._id).eq("class", studentClass),
      )
      .take(200);
    topics.push(...rows);
  }
  return topics.sort((a, b) => a.order - b.order);
}

/** Les paliers générés de ces thématiques, pour la classe de l'élève. */
async function classPaliers(ctx: QueryCtx, topics: readonly Doc<"topics">[], className: string) {
  const out: Doc<"paliers">[] = [];
  for (const topic of topics) {
    const rows = await ctx.db
      .query("paliers")
      .withIndex("by_topic_class", (q) =>
        q.eq("topicId", topic._id).eq("class", className as Doc<"paliers">["class"]),
      )
      .take(20);
    out.push(...rows);
  }
  return out;
}

/**
 * L'empreinte du contenu de la classe : change quand une thématique, un
 * nombre de paliers ou un palier PRÊT change. L'application ne retélécharge
 * `content` que lorsqu'elle bouge. FNV-1a, comme ailleurs dans ce dépôt.
 *
 * Seuls les paliers `cached` comptent : une génération qui échoue réécrit sa
 * ligne (`stale`, nouvelle date) sans rien produire à jouer, et compter ces
 * lignes faisait relire tout le contenu — puis relancer la préparation des
 * paliers, qui échouait encore — en boucle.
 */
function contentFingerprint(
  className: string,
  topics: readonly Doc<"topics">[],
  paliers: readonly Doc<"paliers">[],
): string {
  return fingerprint([
    className,
    ...topics.map((t) => `${t._id}:${t.order}:${t.palierCount ?? ""}:${t.name}`),
    ...paliers
      .filter((p) => p.status === "cached")
      .map((p) => `${p._id}:${p.generatedAt}`),
  ]);
}

function fingerprint(parts: readonly string[]): string {
  let h = 0x811c9dc5;
  for (const part of parts) {
    for (let i = 0; i < part.length; i++) {
      h ^= part.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    h ^= 0x2c;
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

// ===========================================================================
// snapshot — où en est l'enfant
// ===========================================================================

export const snapshot = query({
  args: {},
  handler: async (ctx) => {
    const profile = await studentProfile(ctx);
    if (!profile) return null;
    const studentId = profile._id;
    const now = Date.now();

    const access = await checkAccess(ctx, profile);

    // Les réglages des parents : le plus prudent l'emporte (série, missions).
    const parentSettings = await ctx.db
      .query("parentSettings")
      .withIndex("by_kid", (q) => q.eq("kidId", studentId))
      .take(10);
    const streaksEnabled = !parentSettings.some((s) => s.streaksEnabled === false);
    const missionsEnabled = !parentSettings.some((s) => s.dailyMissionEnabled === false);

    const prefs = readStudentPreferences(profile);

    // Les tentatives de palier, résumées, avec la place de leur palier.
    const attempts = await ctx.db
      .query("palierAttempts")
      .withIndex("by_user", (q) => q.eq("userId", studentId))
      .order("desc")
      .take(PALIER_ATTEMPTS_LIMIT);
    const palierById = new Map<string, Doc<"paliers"> | null>();
    for (const attempt of attempts) {
      const key = attempt.palierId as string;
      if (!palierById.has(key)) palierById.set(key, await ctx.db.get(attempt.palierId));
    }
    const palierAttempts = [];
    for (const attempt of attempts) {
      const palier = palierById.get(attempt.palierId as string);
      if (!palier) continue;
      palierAttempts.push({
        _id: attempt._id,
        palierId: attempt.palierId,
        topicId: palier.topicId,
        subjectId: palier.subjectId,
        palierIndex: palier.palierIndex,
        status: attempt.status,
        startedAt: attempt.startedAt,
        completedAt: attempt.completedAt ?? null,
        averageScore: attempt.averageScore ?? null,
        exerciseCount: attempt.exerciseCount ?? null,
        correctCount: attempt.correctCount ?? null,
        firstTryCount: attempt.firstTryCount ?? null,
        noHintCount: attempt.noHintCount ?? null,
        hintsUsed: attempt.hintsUsed ?? null,
        starsTotal: attempt.starsTotal ?? null,
        timeSpentMs: attempt.timeSpentMs ?? null,
        clientSessionId: attempt.clientSessionId ?? null,
      });
    }

    const topicProgress = (
      await ctx.db
        .query("studentTopicProgress")
        .withIndex("by_studentId", (q) => q.eq("studentId", studentId))
        .take(TOPIC_PROGRESS_LIMIT)
    ).map((p) => ({
      topicId: p.topicId,
      completedExercises: p.completedExercises,
      correctExercises: p.correctExercises,
      totalHintsUsed: p.totalHintsUsed,
      masteryLevel: p.masteryLevel,
      starsEarned: p.starsEarned ?? null,
      completedAt: p.completedAt ?? null,
    }));

    const earnedBadges = (
      await ctx.db
        .query("earnedBadges")
        .withIndex("by_studentId", (q) => q.eq("studentId", studentId))
        .take(EARNED_BADGES_LIMIT)
    ).map((eb) => ({ badgeId: eb.badgeId, earnedAt: eb.earnedAt }));

    // Le temps passé, comme le carnet : la somme des mille derniers essais.
    const timeRows = await ctx.db
      .query("attempts")
      .withIndex("by_studentId", (q) => q.eq("studentId", studentId))
      .take(TIME_ATTEMPTS_LIMIT);
    const totalTimeMs = timeRows.reduce((s, a) => s + a.timeSpentMs, 0);

    // Les missions des derniers jours : celles du jour, et celles des jours
    // qu'un enfant a pu jouer sans réseau depuis.
    const today = timestampToYmd(now);
    const missionRows = await ctx.db
      .query("dailyMissions")
      .withIndex("by_student_day", (q) =>
        q.eq("studentId", studentId).gte("dayKey", addDaysYmd(today, -7)),
      )
      .take(10);
    const missions = missionRows.map((row) => ({
      dayKey: row.dayKey,
      quests: row.quests.map((q) => ({
        key: q.key,
        type: q.type,
        label: q.label,
        target: q.target,
        progress: q.progress,
        completedAt: q.completedAt ?? null,
        subjectId: q.subjectId ?? null,
        subjectName: q.subjectName ?? null,
      })),
      bonusStars: row.bonusStars,
    }));

    // L'école, telle que l'enfant la voit (le carnet).
    const membership = await ctx.db
      .query("schoolMemberships")
      .withIndex("by_student_status", (q) => q.eq("studentId", studentId).eq("status", "active"))
      .first();
    let schooling: {
      schoolName: string;
      class: Doc<"schoolClasses">["class"];
      classLabel: string;
      teacherName: string | null;
    } | null = null;
    if (membership) {
      const [school, schoolClass] = await Promise.all([
        ctx.db.get(membership.schoolId),
        ctx.db.get(membership.schoolClassId),
      ]);
      if (school && schoolClass) {
        const teacher = schoolClass.teacherId ? await ctx.db.get(schoolClass.teacherId) : null;
        schooling = {
          schoolName: school.name,
          class: schoolClass.class,
          classLabel: schoolClass.label,
          teacherName: teacher?.name ?? null,
        };
      }
    }

    // Les modules de l'école (`modules.getMine`), et l'état du module d'arabe.
    const modules = [];
    for (const descriptor of MODULES) {
      const moduleAccess = await moduleAccessForProfile(ctx, profile, descriptor.key);
      modules.push({
        key: descriptor.key,
        title: descriptor.title,
        summary: descriptor.summary,
        emoji: descriptor.emoji,
        color: descriptor.color,
        href: descriptor.studentHref,
        enabled: moduleAccess.enabled,
      });
    }
    // L'empreinte du contenu de la classe : `content` se relit quand elle change.
    const topics = await classTopics(ctx, profile);
    const paliers = profile.class ? await classPaliers(ctx, topics, profile.class) : [];
    const contentVersion = contentFingerprint(profile.class ?? "", topics, paliers);

    return {
      protocol: OFFLINE_PROTOCOL,
      serverTime: now,
      profile: {
        _id: profile._id,
        userId: profile.userId,
        name: profile.name,
        avatar: profile.avatar ?? null,
        class: profile.class ?? null,
        readsAloud: isReadingLearnerClass(profile.class),
      },
      access:
        access.ok
          ? { ok: true as const, endsAt: access.endsAt }
          : { ok: false as const, reason: access.reason },
      prefs: {
        soundEnabled: prefs.soundEnabled ?? null,
        streak: prefs.streak ?? null,
        lastSeenBadgeIds: prefs.lastSeenBadgeIds ?? [],
        lastSeenLevel: prefs.lastSeenLevel ?? 1,
        questBonusStars: prefs.questBonusStars ?? 0,
      },
      flags: { streaksEnabled, missionsEnabled },
      schooling,
      palierAttempts,
      topicProgress,
      earnedBadges,
      totalTimeMs,
      missions,
      modules,
      contentVersion,
    };
  },
});

// ===========================================================================
// arabicSnapshot — où en est l'enfant dans le module « Arabe & Coran »
// ===========================================================================

/**
 * À part du reste, parce qu'elle ne sert qu'aux élèves dont l'école a allumé
 * le module, et qu'elle bouge à chaque exercice d'une leçon. Rend ce que
 * `arabic.lessons.getPath`, `arabic.memorization.getState` et
 * `arabic.lessons.getLessonState` rendent, pour toutes les leçons d'un coup :
 * l'appareil n'a pas à revenir demander leçon par leçon.
 *
 * `mastery` : par leçon, la meilleure note de chaque exercice (« famille:item
 * » → 0..1), soit tout ce que `progressRules.lessonScore` lit pour noter une
 * leçon — l'appareil la note sans réseau sans connaître chaque essai.
 */
export const arabicSnapshot = query({
  args: {},
  handler: async (ctx) => {
    const profile = await studentProfile(ctx);
    if (!profile) return null;
    const studentId = profile._id;
    const access = await moduleAccessForProfile(ctx, profile, ARABIC_MODULE);
    if (!access.enabled) {
      return {
        enabled: false,
        reason: access.reason,
        placement: { level: null, surahKey: null, floorOrder: 0 },
        progress: [],
        hifz: [],
        mastery: {} as Record<string, Record<string, number>>,
      };
    }

    const progressRows = await ctx.db
      .query("arabicLessonProgress")
      .withIndex("by_student", (q) => q.eq("studentId", studentId))
      .take(100);
    const hifzRows = await ctx.db
      .query("arabicHifz")
      .withIndex("by_student", (q) => q.eq("studentId", studentId))
      .take(50);

    const mastery: Record<string, Record<string, number>> = {};
    const attempts = await ctx.db
      .query("arabicAttempts")
      .withIndex("by_student_at", (q) => q.eq("studentId", studentId))
      .order("desc")
      .take(4000);
    for (const attempt of attempts) {
      const lesson = (mastery[attempt.lessonKey] ??= {});
      const key = `${attempt.drill}:${attempt.itemKey}`;
      const value =
        typeof attempt.score === "number" ? attempt.score : attempt.correct ? 1 : 0;
      if (lesson[key] === undefined || value > lesson[key]) lesson[key] = value;
    }

    return {
      enabled: true,
      reason: access.reason,
      placement: await placementForStudent(ctx, studentId),
      progress: progressRows.map((row) => ({
        lessonKey: row.lessonKey,
        status: row.status,
        stars: row.stars,
        bestScore: row.bestScore,
        drillsDone: row.drillsDone,
        startedAt: row.startedAt,
        completedAt: row.completedAt ?? null,
      })),
      hifz: hifzRows.map((row) => ({
        surahKey: row.surahKey,
        strength: row.strength,
        versesMemorized: row.versesMemorized,
        dueAt: row.dueAt,
        lastReviewedAt: row.lastReviewedAt,
      })),
      mastery,
    };
  },
});

// ===========================================================================
// content — ce qu'il y a à jouer
// ===========================================================================

export const content = query({
  args: {},
  handler: async (ctx) => {
    const profile = await studentProfile(ctx);
    if (!profile) return null;
    const access = await checkAccess(ctx, profile);
    if (!access.ok) return null;
    const studentClass = profile.class;
    if (!studentClass || isHiddenClass(studentClass)) return null;

    const subjects = (await ctx.db.query("subjects").take(50)).sort((a, b) => a.order - b.order);
    const topics = await classTopics(ctx, profile);
    const paliers = await classPaliers(ctx, topics, studentClass);

    const contentVersion = contentFingerprint(studentClass, topics, paliers);

    // Les exercices de base de chaque palier (ni variation d'une tentative,
    // ni personnalisé) : ceux que `paliers.getExercisesForPalier` sert en
    // premier à tout élève de la classe.
    const exercises: {
      _id: Id<"exercises">;
      palierId: Id<"paliers">;
      order: number;
      type: Doc<"exercises">["type"];
      prompt: string;
      payload: unknown;
      hints: string[];
      explanation: { intro: string; steps: string[]; conclusion: string } | null;
    }[] = [];
    const palierRows = [];
    for (const palier of paliers) {
      const rows = (
        await ctx.db
          .query("exercises")
          .withIndex("by_palierId", (q) => q.eq("palierId", palier._id))
          .take(50)
      ).filter(
        (ex) =>
          ex.palierAttemptId === undefined &&
          ex.isVariation !== true &&
          ex.personalizedFor === undefined,
      );
      rows.sort((a, b) => a.order - b.order);
      // Un palier en cours de génération n'a pas encore d'exercices à lui :
      // il ne se joue pas sans réseau.
      if (rows.length === 0) continue;
      for (const ex of rows) {
        const explanation = await ctx.db
          .query("exerciseExplanations")
          .withIndex("by_exercise", (q) => q.eq("exerciseId", ex._id))
          .unique();
        exercises.push({
          _id: ex._id,
          palierId: palier._id,
          order: ex.order,
          type: ex.type,
          prompt: ex.prompt,
          payload: ex.payload,
          hints: ex.hints,
          explanation: explanation
            ? {
                intro: explanation.intro,
                steps: explanation.steps,
                conclusion: explanation.conclusion,
              }
            : null,
        });
      }
      palierRows.push({
        _id: palier._id,
        topicId: palier.topicId,
        subjectId: palier.subjectId,
        class: palier.class,
        palierIndex: palier.palierIndex,
        status: palier.status,
        generatedAt: palier.generatedAt,
        expiresAt: palier.expiresAt,
        exerciseIds: rows.map((ex) => ex._id),
      });
    }

    // Le catalogue des trophées, tel que la vitrine le montre.
    const badges = await Promise.all(
      (await ctx.db.query("badges").take(200)).map((b) => describeBadge(ctx, b)),
    );

    return {
      protocol: OFFLINE_PROTOCOL,
      contentVersion,
      fetchedAt: Date.now(),
      class: studentClass,
      subjects: subjects.map((s) => ({
        _id: s._id,
        name: s.name,
        icon: s.icon,
        color: s.color,
        order: s.order,
      })),
      // Les matières que les missions du jour peuvent nommer (`quests.ts`).
      playableSubjects: await playableSubjects(ctx),
      topics: topics.map((t) => ({
        _id: t._id,
        subjectId: t.subjectId,
        name: t.name,
        description: t.description,
        order: t.order,
        class: t.class ?? null,
        palierCount: t.palierCount ?? null,
      })),
      paliers: palierRows,
      exercises,
      badges: badges.map((b) => ({
        _id: b._id,
        name: b.name,
        description: b.description,
        icon: b.icon,
        condition: b.condition,
        conditionParams: b.conditionParams ?? null,
        subjectId: b.subjectId ?? null,
        category: b.category ?? null,
        catalogKey: b.catalogKey ?? null,
        order: b.order ?? null,
        rarity: b.rarity,
        criteriaText: b.criteriaText,
        supported: b.supported,
        visibility: b.visibility ?? null,
      })),
    };
  },
});

// ===========================================================================
// badgeInputs — de quoi juger les trophées sur l'appareil
// ===========================================================================

export const badgeInputs = query({
  args: {},
  handler: async (ctx) => {
    const profile = await studentProfile(ctx);
    if (!profile) return null;
    const access = await checkAccess(ctx, profile);
    if (!access.ok) return null;
    const studentId = profile._id;

    const attempts = await ctx.db
      .query("attempts")
      .withIndex("by_studentId", (q) => q.eq("studentId", studentId))
      .order("desc")
      .take(BADGE_ATTEMPTS_LIMIT);

    const missions = await ctx.db
      .query("dailyMissions")
      .withIndex("by_student_day", (q) => q.eq("studentId", studentId))
      .take(400);
    let questsCompletedTotal = 0;
    let perfectQuestDays = 0;
    const missionDays: string[] = [];
    for (const day of missions) {
      const done = day.quests.filter((q) => q.completedAt !== undefined).length;
      questsCompletedTotal += done;
      if (day.quests.length > 0 && done === day.quests.length) perfectQuestDays += 1;
      missionDays.push(day.dayKey);
    }

    return {
      fetchedAt: Date.now(),
      attempts: attempts.map((a) => ({
        palierAttemptId: (a.palierAttemptId as string | undefined) ?? null,
        exerciseId: a.exerciseId as string,
        attemptNumber: a.attemptNumber,
        isCorrect: a.isCorrect,
        hintsUsedCount: a.hintsUsedCount,
        timeSpentMs: a.timeSpentMs,
        submittedAt: a.submittedAt,
      })),
      questsCompletedTotal,
      perfectQuestDays,
      missionDays,
    };
  },
});

// ===========================================================================
// attemptExercises — les exercices d'une tentative après une nouvelle chance
// ===========================================================================

/**
 * Les exercices COMPLETS d'une tentative de l'élève, dans l'ordre : ceux du
 * palier, moins ceux qu'une nouvelle chance a remplacés, plus leurs
 * variations. Après `paliers.regenerateFailedExercises`, l'application en a
 * besoin pour continuer la séance sur l'appareil — variations comprises,
 * réponses comprises, comme le reste du paquet.
 */
export const attemptExercises = query({
  args: { palierAttemptId: v.id("palierAttempts") },
  handler: async (ctx, args) => {
    const profile = await studentProfile(ctx);
    if (!profile) return null;
    const access = await checkAccess(ctx, profile);
    if (!access.ok) return null;

    const attempt = await ctx.db.get(args.palierAttemptId);
    if (!attempt || attempt.userId !== profile._id) return null;

    const ids =
      attempt.playedExerciseIds && attempt.playedExerciseIds.length > 0
        ? attempt.playedExerciseIds
        : null;
    let docs: Doc<"exercises">[];
    if (ids) {
      docs = [];
      for (const id of ids) {
        const doc = await ctx.db.get(id);
        if (doc) docs.push(doc);
      }
    } else {
      const byAttempt = await ctx.db
        .query("exercises")
        .withIndex("by_palierAttemptId", (q) => q.eq("palierAttemptId", attempt._id))
        .take(50);
      const replaced = new Set(byAttempt.map((e) => e.originalExerciseId).filter(Boolean));
      const byPalier = await ctx.db
        .query("exercises")
        .withIndex("by_palierId", (q) => q.eq("palierId", attempt.palierId))
        .take(50);
      docs = [
        ...byPalier.filter(
          (e) => e.palierAttemptId === undefined && !e.isVariation && !replaced.has(e._id),
        ),
        ...byAttempt,
      ].sort((a, b) => a.order - b.order);
    }

    return {
      palierAttemptId: attempt._id,
      status: attempt.status,
      exercises: docs.map((ex) => ({
        _id: ex._id,
        palierId: attempt.palierId,
        order: ex.order,
        type: ex.type,
        prompt: ex.prompt,
        payload: ex.payload,
        hints: ex.hints,
        isVariation: ex.isVariation === true,
        explanation: null,
      })),
    };
  },
});
