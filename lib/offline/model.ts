/**
 * CE QUE L'ENFANT VOIT, CALCULÉ SUR L'APPAREIL.
 *
 * Le paquet (`convex/offline/pack.ts`) dit où en était l'enfant au dernier
 * passage du réseau. Le journal (`OfflineData.sessions`, `.outbox`) dit ce
 * qu'il a fait depuis, et que le serveur n'a pas encore reflété. Ce module
 * superpose l'un à l'autre et rend les mêmes vues que les requêtes du serveur
 * — même forme, mêmes règles (`convex/worldRules.ts`, `progressionRules.ts`,
 * `questRules.ts`, `streakRules.ts`, `badgeRules.ts`) — pour que chaque écran
 * puisse lire l'un ou l'autre sans le savoir.
 *
 * QUAND LE JOURNAL CESSE DE COMPTER. Une entrée envoyée au serveur reste
 * superposée jusqu'à ce qu'un paquet arrivé APRÈS son accusé de réception la
 * reflète. Sans cela, l'étape validée disparaîtrait de la carte le temps que
 * le paquet suive, puis reviendrait.
 *
 * Module pur : ni React, ni réseau, ni fichier. Testé dans
 * `lib/offline/__tests__/model.test.ts`.
 */
import {
  buildNextStep,
  buildSubjectMap,
  buildWorldZone,
  palierProgressByTopic,
  type WorldPalierAttempt,
  type WorldTopicProgress,
} from "@/convex/worldRules";
import { effectivePalierCount, isTopicComplete } from "@/convex/palierRules";
import {
  computeLevel,
  exosToNextLevel,
  topicProgressFrom,
  type PalierAttemptLike,
} from "@/convex/progressionRules";
import {
  applyActivity as applyStreakActivity,
  applyRollover,
  timestampToYmd,
  type StudentStreakState,
} from "@/convex/streakRules";
import {
  allDone as allQuestsDone,
  applyActivity as applyQuestActivity,
  bonusStarsFor,
  completedCount,
  pickDailyQuests,
  type Quest,
} from "@/convex/questRules";
import { buildSnapshot, evaluateBadge } from "@/convex/badgeRules";
import { badgeSnapshotInput } from "@/convex/badgeSnapshotRules";
import { lessonScore, starsFor } from "@/convex/arabic/progressRules";
import { hifzStates, isDue } from "@/convex/arabic/hifz";
import { logTimeMs, rowsForExercise } from "./session-rules";
import type {
  LocalSession,
  OfflineData,
  OutboxEntry,
  PackBadge,
  PackExercise,
  PackPalier,
  PackTopic,
  Snapshot,
} from "./types";

// ===========================================================================
// LES TENTATIVES DE PALIER, SERVEUR ET APPAREIL MÊLÉS
// ===========================================================================

export type EffectiveAttempt = WorldPalierAttempt & {
  palierId: string;
  subjectId: string;
  startedAt: number;
  completedAt: number | null;
  correctCount?: number;
  firstTryCount?: number;
  noHintCount?: number;
  hintsUsed?: number;
  timeSpentMs?: number;
  clientSessionId: string | null;
  /** Vrai quand la ligne vient d'une séance pas encore reflétée par le serveur. */
  local: boolean;
};

/**
 * Au-delà, une entrée accusée par le serveur cesse d'être superposée au
 * paquet même si aucun paquet plus récent n'est arrivé : le serveur l'a
 * reçue, et le paquet suivant la montrera.
 */
export const ACK_GRACE_MS = 2 * 60_000;

/**
 * Trente jours, la durée d'une session de connexion : un accès ouvert qui n'a
 * pas été revu par le serveur depuis plus longtemps se revérifie en ligne
 * (`components/offline/student-gate.tsx`). Sans cette borne, une école qui ne
 * paie plus garderait ses élèves sans fin tant qu'ils restent hors ligne.
 */
export const OFFLINE_ACCESS_GRACE_MS = 30 * 24 * 60 * 60 * 1000;

export function exercisesKey(ids: readonly string[]): string {
  return ids.join(",");
}

/** La séance a-t-elle quelque chose que le serveur n'a pas reçu ? */
export function sessionIsDirty(session: LocalSession): boolean {
  return (
    session.log.length > session.sync.pushedLogLength ||
    exercisesKey(session.exerciseIds) !== session.sync.pushedExercises ||
    (session.finishedAt !== undefined && session.sync.pushedFinishedAt !== session.finishedAt)
  );
}

type ServerAttempt = Snapshot["palierAttempts"][number];

/**
 * La séance l'emporte-t-elle sur la ligne du serveur ? Oui tant que le serveur
 * n'a pas tout reçu, ou que le paquet date d'avant son accusé de réception.
 */
export function sessionOverrides(
  session: LocalSession,
  server: ServerAttempt | undefined,
  snapshotReceivedAt: number,
  now: number,
): boolean {
  if (!server) return true;
  if (sessionIsDirty(session)) return true;
  if (session.sync.ackedAt === null) return true;
  if (now - session.sync.ackedAt > ACK_GRACE_MS) return false;
  return snapshotReceivedAt <= session.sync.ackedAt;
}

/** Une entrée du journal compte-t-elle encore, face à un paquet arrivé à `receivedAt` ? */
export function entryOverlays(entry: OutboxEntry, receivedAt: number, now: number): boolean {
  if (entry.ackedAt === undefined) return true;
  if (now - entry.ackedAt > ACK_GRACE_MS) return false;
  return receivedAt <= entry.ackedAt;
}

function fromServer(row: ServerAttempt): EffectiveAttempt {
  return {
    palierId: row.palierId,
    topicId: row.topicId,
    subjectId: row.subjectId,
    palierIndex: row.palierIndex,
    status: row.status,
    startedAt: row.startedAt,
    completedAt: row.completedAt,
    averageScore: row.averageScore ?? undefined,
    starsTotal: row.starsTotal ?? undefined,
    exerciseCount: row.exerciseCount ?? undefined,
    correctCount: row.correctCount ?? undefined,
    firstTryCount: row.firstTryCount ?? undefined,
    noHintCount: row.noHintCount ?? undefined,
    hintsUsed: row.hintsUsed ?? undefined,
    timeSpentMs: row.timeSpentMs ?? undefined,
    clientSessionId: row.clientSessionId,
    local: false,
  };
}

function fromSession(session: LocalSession): EffectiveAttempt {
  const grade = session.finishedAt !== undefined ? session.grade : undefined;
  return {
    palierId: session.palierId,
    topicId: session.topicId,
    subjectId: session.subjectId,
    palierIndex: session.palierIndex,
    status: grade ? grade.status : "in_progress",
    startedAt: session.startedAt,
    completedAt: session.finishedAt ?? null,
    averageScore: grade?.average,
    starsTotal: grade?.summary.starsTotal,
    exerciseCount: grade?.summary.exerciseCount,
    correctCount: grade?.summary.correctCount,
    firstTryCount: grade?.summary.firstTryCount,
    noHintCount: grade?.summary.noHintCount,
    hintsUsed: grade?.summary.hintsUsed,
    timeSpentMs: grade?.summary.timeSpentMs,
    clientSessionId: session.sessionId,
    local: true,
  };
}

function asLike(a: EffectiveAttempt): PalierAttemptLike {
  return {
    palierId: a.palierId,
    status: a.status,
    averageScore: a.averageScore,
    exerciseCount: a.exerciseCount,
    correctCount: a.correctCount,
    hintsUsed: a.hintsUsed,
    starsTotal: a.starsTotal,
  };
}

// ===========================================================================
// LE MODÈLE
// ===========================================================================

export type EffectiveTopicProgress = WorldTopicProgress & {
  totalHintsUsed: number;
  masteryLevel: number;
};

export type OfflineModel = ReturnType<typeof buildModel>;

/**
 * Tout ce que les écrans lisent, en une passe. `now` est l'heure de
 * l'appareil : le jour des missions, la série, les échéances de révision.
 */
export function buildModel(data: OfflineData, now: number) {
  const snapshot = data.snapshot;
  const content = data.content;
  const today = timestampToYmd(now);

  const topics: PackTopic[] = content?.topics ?? [];
  const topicsById = new Map(topics.map((t) => [t._id as string, t] as const));
  const subjects = content?.subjects ?? [];
  const palierById = new Map<string, PackPalier>((content?.paliers ?? []).map((p) => [p._id as string, p]));
  const exerciseById = new Map<string, PackExercise>();
  for (const ex of content?.exercises ?? []) exerciseById.set(ex._id as string, ex as PackExercise);
  for (const session of data.sessions) {
    for (const ex of session.exercises ?? []) exerciseById.set(ex._id, ex);
  }

  // --- Les tentatives ---------------------------------------------------------
  const serverRows = snapshot?.palierAttempts ?? [];
  const serverByClient = new Map<string, ServerAttempt>();
  for (const row of serverRows) {
    if (row.clientSessionId) serverByClient.set(row.clientSessionId, row);
  }
  const overriding = data.sessions.filter((s) =>
    sessionOverrides(s, serverByClient.get(s.sessionId), data.snapshotReceivedAt, now),
  );
  const overridden = new Set(overriding.map((s) => s.sessionId));
  const attempts: EffectiveAttempt[] = [];
  for (const row of serverRows) {
    if (row.clientSessionId && overridden.has(row.clientSessionId)) continue;
    attempts.push(fromServer(row));
  }
  for (const session of overriding) attempts.push(fromSession(session));
  attempts.sort((a, b) => b.startedAt - a.startedAt);

  /** Les séances finies sur l'appareil que le serveur ne reflète pas encore, dans l'ordre. */
  const pendingFinished = overriding
    .filter((s) => s.finishedAt !== undefined && s.grade)
    .sort((a, b) => a.finishedAt! - b.finishedAt!);

  // --- La progression des thématiques ----------------------------------------
  const progress = new Map<string, EffectiveTopicProgress>();
  for (const p of snapshot?.topicProgress ?? []) {
    progress.set(p.topicId as string, {
      topicId: p.topicId as string,
      completedAt: p.completedAt,
      completedExercises: p.completedExercises,
      correctExercises: p.correctExercises,
      starsEarned: p.starsEarned ?? undefined,
      totalHintsUsed: p.totalHintsUsed,
      masteryLevel: p.masteryLevel,
    });
  }
  const touchedTopics = new Set(pendingFinished.map((s) => s.topicId));
  for (const topicId of touchedTopics) {
    const topic = topicsById.get(topicId);
    const onTopic = attempts.filter((a) => a.topicId === topicId);
    const counters = topicProgressFrom(onTopic.map(asLike));
    const validated = new Set(onTopic.filter((a) => a.status === "validated").map((a) => a.palierIndex));
    const complete = topic ? isTopicComplete(validated, effectivePalierCount(topic)) : false;
    const existing = progress.get(topicId);
    const lastFinish = Math.max(
      ...pendingFinished.filter((s) => s.topicId === topicId).map((s) => s.finishedAt!),
    );
    progress.set(topicId, {
      topicId,
      ...counters,
      completedAt: existing?.completedAt ?? (complete ? lastFinish : null),
    });
  }

  const { byTopic, latestInProgress } = palierProgressByTopic(attempts);

  // --- La carte, les sentiers, où reprendre -----------------------------------
  const worlds = subjects.map((subject) => ({
    subject: {
      _id: subject._id as string,
      name: subject.name,
      icon: subject.icon,
      color: subject.color,
      order: subject.order,
    },
    topics: topics
      .filter((t) => t.subjectId === subject._id)
      .sort((a, b) => a.order - b.order)
      .map((t) => ({
        _id: t._id as string,
        subjectId: t.subjectId as string,
        name: t.name,
        description: t.description,
        order: t.order,
        class: t.class,
        palierCount: t.palierCount,
      })),
  }));

  const worldMap = worlds
    .filter((w) => w.topics.length > 0)
    .map((w) => buildWorldZone({ subject: w.subject, topics: w.topics, progressByTopic: progress, byTopic }));

  const subjectMaps = new Map(
    worlds.map((w) => [
      w.subject._id,
      buildSubjectMap({ subject: w.subject, topics: w.topics, progressByTopicId: progress, byTopic }),
    ]),
  );

  const nextStep = buildNextStep({ subjects: worlds, latestInProgress, progressByTopic: progress, byTopic });

  // --- Les réglages ------------------------------------------------------------
  const overlayPrefs = data.outbox.filter((e) => entryOverlays(e, data.snapshotReceivedAt, now));
  let soundEnabled: boolean | null = snapshot?.prefs.soundEnabled ?? null;
  let lastSeenLevel = snapshot?.prefs.lastSeenLevel ?? 1;
  const seenBadges = new Set<string>(snapshot?.prefs.lastSeenBadgeIds ?? []);
  for (const entry of overlayPrefs) {
    const event = entry.event;
    if (event.kind === "soundEnabled") soundEnabled = event.enabled;
    if (event.kind === "levelSeen") lastSeenLevel = Math.max(lastSeenLevel, event.level);
    if (event.kind === "badgesSeen") for (const id of event.badgeIds) seenBadges.add(id);
  }

  // --- La série ------------------------------------------------------------------
  const streaksEnabled = snapshot?.flags.streaksEnabled ?? true;
  let streak: StudentStreakState | undefined = (snapshot?.prefs.streak as StudentStreakState | null) ?? undefined;
  if (streaksEnabled) {
    for (const session of pendingFinished) {
      streak = applyStreakActivity(streak, timestampToYmd(Math.min(session.finishedAt!, now))).next;
    }
  }
  // La tâche de nuit du serveur ne passe pas sans réseau : on l'applique à
  // l'affichage, comme elle l'aurait fait.
  const shownStreak = streaksEnabled && streak ? applyRollover(streak, today).next : undefined;

  // --- Les missions du jour ----------------------------------------------------
  const missionsEnabled = snapshot?.flags.missionsEnabled ?? true;
  const playable = content?.playableSubjects ?? [];
  const questDays = new Map<string, { quests: Quest[]; baseBonus: number; baseCompleted: number; basePerfect: boolean }>();
  const dayRow = (dayKey: string) => {
    let row = questDays.get(dayKey);
    if (!row) {
      const stored = snapshot?.missions.find((m) => m.dayKey === dayKey);
      const quests: Quest[] = stored
        ? stored.quests.map((q) => ({
            key: q.key,
            type: q.type,
            label: q.label,
            target: q.target,
            progress: q.progress,
            completedAt: q.completedAt ?? undefined,
            subjectId: (q.subjectId as string | null) ?? undefined,
            subjectName: q.subjectName ?? undefined,
          }))
        : pickDailyQuests({ seed: `${data.profileId}|${dayKey}`, subjects: playable });
      row = {
        quests,
        baseBonus: stored?.bonusStars ?? 0,
        baseCompleted: completedCount(quests),
        basePerfect: allQuestsDone(quests),
      };
      questDays.set(dayKey, row);
    }
    return row;
  };
  let questBonusGained = 0;
  let questsNewlyCompleted = 0;
  let perfectDaysGained = 0;
  if (missionsEnabled) {
    for (const session of pendingFinished) {
      const when = Math.min(session.finishedAt!, now);
      const row = dayRow(timestampToYmd(when));
      row.quests = applyQuestActivity(
        row.quests,
        {
          exercises: session.grade!.exerciseCount,
          stars: session.grade!.starsTotal,
          palierValidated: session.grade!.status === "validated",
          subjectId: session.subjectId,
        },
        when,
      ).quests;
    }
    for (const row of questDays.values()) {
      const owed = bonusStarsFor(completedCount(row.quests), row.quests.length);
      questBonusGained += Math.max(0, owed - row.baseBonus);
      questsNewlyCompleted += Math.max(0, completedCount(row.quests) - row.baseCompleted);
      if (!row.basePerfect && allQuestsDone(row.quests)) perfectDaysGained += 1;
    }
  }
  const todayRow = missionsEnabled && snapshot?.access.ok !== false ? dayRow(today) : null;
  const daily = todayRow
    ? {
        dayKey: today,
        pending: false as const,
        quests: todayRow.quests.map((q) => ({
          key: q.key,
          type: q.type,
          label: q.label,
          target: q.target,
          progress: q.progress,
          completedAt: q.completedAt,
          subjectId: q.subjectId,
          subjectName: q.subjectName,
        })),
        bonusStars: bonusStarsFor(completedCount(todayRow.quests), todayRow.quests.length),
        allDone: allQuestsDone(todayRow.quests),
      }
    : null;

  // --- Les trophées ------------------------------------------------------------
  const badgeCatalog: PackBadge[] = content?.badges ?? [];
  const badgeById = new Map(badgeCatalog.map((b) => [b._id as string, b] as const));
  const serverEarned = new Map<string, number>();
  for (const eb of snapshot?.earnedBadges ?? []) serverEarned.set(eb.badgeId as string, eb.earnedAt);
  const earned = new Map(serverEarned);
  for (const lb of data.localBadges) if (!earned.has(lb.badgeId)) earned.set(lb.badgeId, lb.earnedAt);

  const badgeSnapshot =
    data.badgeInputs && content
      ? buildSnapshot(
          badgeSnapshotInput({
            attempts: [
              ...data.badgeInputs.attempts.map((a) => ({
                palierAttemptId: a.palierAttemptId ?? undefined,
                exerciseId: a.exerciseId,
                attemptNumber: a.attemptNumber,
                isCorrect: a.isCorrect,
                hintsUsedCount: a.hintsUsedCount,
                timeSpentMs: a.timeSpentMs,
                submittedAt: a.submittedAt,
              })),
              ...localAttemptRows(data.sessions, data.badgeInputs.fetchedAt),
            ],
            palierAttempts: attempts.map((a) => ({
              palierId: a.palierId,
              status: a.status,
              exerciseCount: a.exerciseCount,
              firstTryCount: a.firstTryCount,
              topicId: a.topicId,
              palierIndex: a.palierIndex,
            })),
            topicProgress: [...progress.values()].map((p) => ({
              topicId: p.topicId,
              completedAt: p.completedAt,
              completedExercises: p.completedExercises,
              masteryLevel: p.masteryLevel,
            })),
            subjects: worlds.map((w) => ({
              subjectId: w.subject._id,
              name: w.subject.name,
              topics: w.topics.map((t) => ({ topicId: t._id, palierCount: t.palierCount, class: t.class })),
            })),
            streakCurrent: shownStreak?.current ?? 0,
            streakLongest: shownStreak?.longest ?? 0,
            questsCompletedTotal: data.badgeInputs.questsCompletedTotal + questsNewlyCompleted,
            perfectQuestDays: data.badgeInputs.perfectQuestDays + perfectDaysGained,
          }),
        )
      : null;

  const badgeProgress: { badgeId: string; value: number; target: number; deserved: boolean }[] = [];
  const deservedLocally: string[] = [];
  if (badgeSnapshot) {
    for (const badge of badgeCatalog) {
      const evaluation = evaluateBadge(
        { condition: badge.condition, conditionParams: badge.conditionParams ?? undefined },
        badgeSnapshot,
      );
      if (!evaluation) continue;
      badgeProgress.push({
        badgeId: badge._id as string,
        value: evaluation.value,
        target: evaluation.target,
        deserved: evaluation.deserved,
      });
      if (evaluation.deserved && !earned.has(badge._id as string)) deservedLocally.push(badge._id as string);
    }
  }

  const earnedList = [...earned.entries()]
    .map(([badgeId, earnedAt]) => ({
      // Un trophée ne se gagne qu'une fois : son identifiant suffit comme clé.
      _id: badgeId,
      badgeId,
      earnedAt,
      badge: badgeById.get(badgeId) ?? null,
    }))
    .filter((e): e is { _id: string; badgeId: string; earnedAt: number; badge: PackBadge } => e.badge !== null)
    .sort((a, b) => b.earnedAt - a.earnedAt);

  // --- Le carnet (`students.getMyStats`) ----------------------------------------
  const progressRows = [...progress.values()];
  const totalExercises = progressRows.reduce((s, p) => s + p.completedExercises, 0);
  const totalCorrectExercises = progressRows.reduce((s, p) => s + p.correctExercises, 0);
  const topicStars = progressRows.reduce((s, p) => s + (p.starsEarned ?? 0), 0);
  const subjectCounts = new Map<string, { name: string; count: number }>();
  for (const p of progressRows) {
    if (p.completedAt == null) continue;
    const topic = topicsById.get(p.topicId);
    const subject = topic ? subjects.find((s) => s._id === topic.subjectId) : undefined;
    if (!subject) continue;
    const entry = subjectCounts.get(subject._id as string) ?? { name: subject.name, count: 0 };
    entry.count += 1;
    subjectCounts.set(subject._id as string, entry);
  }
  const favoriteSubject = [...subjectCounts.values()].sort((a, b) => b.count - a.count)[0]?.name ?? null;
  const level = computeLevel(totalCorrectExercises);
  const unseenBadges = earnedList.filter((e) => !seenBadges.has(e.badgeId));
  const pendingTime = data.sessions.reduce(
    (s, session) => s + logTimeMs(session.log, session.sync.pushedLogLength),
    0,
  );

  const stats = snapshot
    ? {
        student: {
          _id: snapshot.profile._id as string,
          name: snapshot.profile.name,
          avatar: snapshot.profile.avatar ?? undefined,
          class: snapshot.profile.class ?? undefined,
        },
        class: snapshot.profile.class,
        schooling: snapshot.schooling,
        completedTopics: progressRows.filter((p) => p.completedAt != null).length,
        totalExercises,
        totalCorrectExercises,
        badgeCount: earned.size,
        totalTimeMs: snapshot.totalTimeMs + pendingTime,
        favoriteSubject,
        recentBadges: earnedList.slice(0, 3),
        level,
        exosToNextLevel: exosToNextLevel(totalCorrectExercises),
        totalStars: topicStars + (snapshot.prefs.questBonusStars ?? 0) + questBonusGained,
        streaksEnabled,
        currentStreak: streaksEnabled ? (shownStreak?.current ?? 0) : 0,
        longestStreak: streaksEnabled ? (shownStreak?.longest ?? 0) : 0,
        soundEnabled: soundEnabled === true,
        soundOptInDecided: soundEnabled !== null,
        unseenBadges,
        unseenLevelUp: level > lastSeenLevel ? { level } : null,
      }
    : null;

  // --- Le module d'arabe ----------------------------------------------------------
  const arabic = buildArabic(data, now);

  return {
    profileId: data.profileId,
    hasSnapshot: snapshot !== null,
    hasContent: content !== null,
    access: snapshot?.access ?? null,
    /** Le dernier passage du serveur date de plus de `OFFLINE_ACCESS_GRACE_MS`. */
    accessNeedsCheck: snapshot !== null && now - snapshot.serverTime > OFFLINE_ACCESS_GRACE_MS,
    modules: snapshot?.modules ?? [],
    readsAloud: snapshot?.profile.readsAloud ?? false,
    profile: snapshot?.profile ?? null,
    stats,
    worldMap,
    subjectMaps,
    nextStep,
    daily,
    soundEnabled,
    attempts,
    /** Les séances de palier gardées sur l'appareil (en cours, ou finies pas encore reflétées). */
    sessions: data.sessions,
    topicsById,
    palierById,
    exerciseById,
    badgeCatalog,
    earned: earnedList,
    badgeProgress,
    deservedLocally,
    arabic,
  };
}

/** Les lignes d'essai des séances de l'appareil que `badgeInputs` ne connaît pas encore. */
function localAttemptRows(sessions: readonly LocalSession[], since: number) {
  const rows = [];
  for (const session of sessions) {
    for (const exerciseId of session.exerciseIds) {
      for (const row of rowsForExercise(session.log, exerciseId)) {
        if (row.submittedAt <= since) continue;
        rows.push({
          palierAttemptId: `local:${session.sessionId}`,
          exerciseId,
          attemptNumber: row.attemptNumber,
          isCorrect: row.isCorrect,
          hintsUsedCount: row.hintsUsedCount,
          timeSpentMs: row.timeSpentMs,
          submittedAt: row.submittedAt,
        });
      }
    }
  }
  return rows;
}

// ===========================================================================
// LE MODULE D'ARABE — `arabic.lessons.getPath`, `memorization.getState`,
// `lessons.getLessonState`, avec ce que l'appareil a fait depuis.
// ===========================================================================

type ArabicProgressRow = {
  lessonKey: string;
  status: "in_progress" | "completed";
  stars: number;
  bestScore: number;
  drillsDone: string[];
  startedAt: number;
  completedAt: number | null;
};

function buildArabic(data: OfflineData, now: number) {
  const snap = data.arabic;
  if (!snap) return null;

  const mastery: Record<string, Record<string, number>> = {};
  for (const [lessonKey, items] of Object.entries(snap.mastery)) mastery[lessonKey] = { ...items };
  const rows = new Map<string, ArabicProgressRow>(
    snap.progress.map((row) => [row.lessonKey, { ...row, drillsDone: [...row.drillsDone] }]),
  );

  for (const entry of data.outbox) {
    if (!entryOverlays(entry, data.arabicReceivedAt, now)) continue;
    const event = entry.event;
    if (event.kind === "arabicAttempt") {
      const lesson = (mastery[event.lessonKey] ??= {});
      const key = `${event.drill}:${event.itemKey}`;
      const value = typeof event.score === "number" ? event.score : event.correct ? 1 : 0;
      if (lesson[key] === undefined || value > lesson[key]) lesson[key] = value;
      const row = rows.get(event.lessonKey);
      if (!row) {
        rows.set(event.lessonKey, {
          lessonKey: event.lessonKey,
          status: "in_progress",
          stars: 0,
          bestScore: 0,
          drillsDone: [event.drill],
          startedAt: event.at,
          completedAt: null,
        });
      } else if (!row.drillsDone.includes(event.drill)) {
        row.drillsDone.push(event.drill);
      }
    } else if (event.kind === "arabicLessonComplete") {
      const items = mastery[event.lessonKey] ?? {};
      const values = Object.entries(items).map(([key, value]) => {
        const sep = key.indexOf(":");
        return { drill: key.slice(0, sep), itemKey: key.slice(sep + 1), correct: value >= 1, score: value };
      });
      if (values.length === 0) continue;
      const score = lessonScore(values);
      const stars = starsFor(score);
      const row = rows.get(event.lessonKey);
      rows.set(event.lessonKey, {
        lessonKey: event.lessonKey,
        status: "completed",
        stars: Math.max(row?.stars ?? 0, stars),
        bestScore: Math.max(row?.bestScore ?? 0, score),
        drillsDone: row?.drillsDone ?? [...new Set(values.map((v) => v.drill))],
        startedAt: row?.startedAt ?? event.at,
        completedAt: row?.completedAt ?? event.at,
      });
    }
  }

  const progress = [...rows.values()];
  return {
    enabled: snap.enabled,
    reason: snap.reason,
    placement: snap.placement,
    path: {
      enabled: snap.enabled,
      reason: snap.reason,
      isStudent: true,
      progress: progress.map((row) => ({
        lessonKey: row.lessonKey,
        status: row.status,
        stars: row.stars,
        bestScore: row.bestScore,
        completedAt: row.completedAt,
      })),
      placement: snap.placement,
    },
    hifz: {
      enabled: snap.enabled,
      now,
      surahs: hifzStates(snap.hifz, now),
      dueCount: snap.hifz.filter((row) => isDue(row.dueAt, now)).length,
    },
    lessonState(lessonKey: string) {
      const row = rows.get(lessonKey);
      return {
        enabled: snap.enabled,
        status: row?.status ?? null,
        stars: row?.stars ?? 0,
        bestScore: row?.bestScore ?? 0,
        drillsDone: row?.drillsDone ?? [],
        mastery: mastery[lessonKey] ?? {},
      };
    },
  };
}
