import { describe, expect, it } from "vitest";
import {
  BADGE_CONDITIONS,
  badgeParams,
  buildSnapshot,
  conditionText,
  evaluateBadge,
  isSupportedCondition,
  type SnapshotAttemptRow,
  type SnapshotInput,
} from "../badgeRules";

// Lundi 2026-09-28 à 10 h UTC (Dakar : UTC).
const MONDAY_10H = Date.UTC(2026, 8, 28, 10, 0, 0);

let seq = 0;
const attempt = (
  isCorrect: boolean,
  extra: Partial<SnapshotAttemptRow> = {},
): SnapshotAttemptRow => ({
  palierAttemptId: "pa1",
  exerciseId: `ex${++seq}`,
  attemptNumber: 1,
  isCorrect,
  hintsUsedCount: 0,
  timeSpentMs: 0,
  submittedAt: MONDAY_10H + seq * 60_000,
  ...extra,
});

const base = (over: Partial<SnapshotInput> = {}): SnapshotInput => ({
  attempts: [],
  paliersValidated: 0,
  topics: [],
  subjects: [],
  streakCurrent: 0,
  streakLongest: 0,
  questsCompletedTotal: 0,
  perfectQuestDays: 0,
  ...over,
});

describe("le catalogue des conditions", () => {
  it("connaît toutes les conditions du catalogue en base, sauf les félicitations du prof", () => {
    const inBase = [
      "completed_topic_count", "perfect_topic_count", "correct_attempts_count", "total_attempts_count",
      "consecutive_days_active", "correct_without_hints", "first_try_correct_count", "retry_success_count",
      "fast_correct_streak", "fast_correct_total", "subjects_touched", "subjects_completed",
      "attempt_before_hour", "attempt_after_hour", "weekend_correct_count", "single_session_correct_count",
      "subject_avg_mastery", "quests_completed_total", "perfect_quest_days", "paliers_validated_total",
      "subjects_started", "subject_full_complete", "streak_days", "early_bird", "exercises_correct_total",
      "complete_topic", "perfect_score", "streak_3",
    ];
    for (const key of inBase) expect(isSupportedCondition(key), key).toBe(true);
    expect(isSupportedCondition("teacher_kudos")).toBe(false);
    expect(BADGE_CONDITIONS.map((c) => c.key)).toEqual(expect.arrayContaining(inBase));
  });

  it("les paramètres du catalogue complètent les défauts", () => {
    expect(badgeParams("paliers_validated_total", { count: 10 })).toEqual({ count: 10 });
    expect(badgeParams("retry_success_count", { minAttempts: 3 })).toEqual({ minAttempts: 3, count: 5 });
    expect(badgeParams("fast_correct_total", null)).toEqual({ maxTimeMs: 20_000, count: 20 });
  });

  it("écrit le critère en français", () => {
    expect(conditionText({ condition: "paliers_validated_total", conditionParams: { count: 1 } })).toBe("Valide ton premier palier");
    expect(conditionText({ condition: "paliers_validated_total", conditionParams: { count: 10 } })).toBe("Valide 10 paliers");
    expect(conditionText({ condition: "subject_avg_mastery", conditionParams: {} }, "Mathématiques")).toBe(
      "Garde une maîtrise de 80 % ou plus sur 3 thématiques de Mathématiques",
    );
    expect(conditionText({ condition: "teacher_kudos" })).toBe("Continue à apprendre !");
    expect(evaluateBadge({ condition: "teacher_kudos" }, buildSnapshot(base()))).toBeNull();
  });
});

describe("buildSnapshot", () => {
  it("compte les exercices résolus par tentative, du premier coup, sans indice, après plusieurs essais", () => {
    seq = 0;
    const s = buildSnapshot(
      base({
        attempts: [
          attempt(true, { exerciseId: "a", timeSpentMs: 5000 }),
          attempt(false, { exerciseId: "b" }),
          { ...attempt(false, { exerciseId: "b" }), attemptNumber: 0, hintsUsedCount: 1 },
          attempt(true, { exerciseId: "b", attemptNumber: 2, timeSpentMs: 30_000 }),
          attempt(false, { exerciseId: "c" }),
          attempt(false, { exerciseId: "c", attemptNumber: 2 }),
          attempt(true, { exerciseId: "c", attemptNumber: 3, timeSpentMs: 8000 }),
          // Le même exercice rejoué dans une autre tentative compte à nouveau.
          attempt(true, { exerciseId: "a", palierAttemptId: "pa2", timeSpentMs: 3000 }),
        ],
      }),
    );
    expect(s.correctExercisesTotal).toBe(4);
    expect(s.attemptsTotal).toBe(7);
    expect(s.firstTryCorrectTotal).toBe(2);
    expect(s.noHintCorrectTotal).toBe(3);
    expect(s.retrySuccessByMinAttempts(2)).toBe(2);
    expect(s.retrySuccessByMinAttempts(3)).toBe(1);
    expect(s.fastCorrectTotal(10_000)).toBe(3);
    expect(s.fastCorrectStreak(10_000)).toBe(2);
  });

  it("les fenêtres, le week-end et les heures", () => {
    seq = 0;
    const saturday = Date.UTC(2026, 8, 26, 23, 30, 0); // samedi 23 h 30
    const s = buildSnapshot(
      base({
        attempts: [
          attempt(true, { submittedAt: MONDAY_10H }),
          attempt(true, { submittedAt: MONDAY_10H + 20 * 60_000 }),
          attempt(true, { submittedAt: MONDAY_10H + 50 * 60_000 }),
          attempt(true, { submittedAt: MONDAY_10H + 3 * 3_600_000 }),
          attempt(true, { submittedAt: saturday }),
          attempt(false, { submittedAt: Date.UTC(2026, 8, 29, 6, 15, 0) }), // mardi 6 h 15
        ],
      }),
    );
    expect(s.correctWithinWindow(3_600_000)).toBe(3);
    expect(s.weekendCorrectTotal).toBe(1);
    expect(s.attemptsBeforeHour(8)).toBe(1);
    expect(s.attemptsFromHour(22)).toBe(1);
  });

  it("les matières : commencées, terminées, maîtrise moyenne", () => {
    const s = buildSnapshot(
      base({
        topics: [
          { topicId: "t1", subjectId: "maths", completed: true, perfect: true, started: true, masteryLevel: 90 },
          { topicId: "t2", subjectId: "maths", completed: true, perfect: false, started: true, masteryLevel: 70 },
          { topicId: "t3", subjectId: "maths", completed: false, perfect: false, started: false, masteryLevel: 0 },
          { topicId: "t4", subjectId: "fr", completed: false, perfect: false, started: true, masteryLevel: 100 },
        ],
        subjects: [
          { subjectId: "maths", name: "Mathématiques", topicCount: 3 },
          { subjectId: "fr", name: "Français", topicCount: 2 },
          { subjectId: "svt", name: "Sciences", topicCount: 4 },
        ],
      }),
    );
    expect(s.completedTopics).toBe(2);
    expect(s.perfectTopics).toBe(1);
    expect(s.subjects.map((x) => [x.name, x.startedTopics, x.completedTopics, x.averageMastery])).toEqual([
      ["Mathématiques", 2, 2, 80],
      ["Français", 1, 0, 100],
      ["Sciences", 0, 0, 0],
    ]);
  });
});

describe("evaluateBadge — le parcours d'Aminata", () => {
  it("six paliers validés : « Premiers pas de lion » oui, « Grimpeur » non, avec la progression", () => {
    const s = buildSnapshot(base({ paliersValidated: 6 }));
    expect(evaluateBadge({ condition: "paliers_validated_total", conditionParams: { count: 1 } }, s)).toEqual({
      value: 6,
      target: 1,
      deserved: true,
    });
    expect(evaluateBadge({ condition: "paliers_validated_total", conditionParams: { count: 10 } }, s)).toEqual({
      value: 6,
      target: 10,
      deserved: false,
    });
  });

  it("une matière maîtrisée demande assez de thématiques commencées", () => {
    const topics = [1, 2, 3].map((i) => ({
      topicId: `t${i}`,
      subjectId: "maths",
      completed: true,
      perfect: false,
      started: true,
      masteryLevel: 85,
    }));
    const subjects = [{ subjectId: "maths", name: "Mathématiques", topicCount: 5 }];
    const badge = { condition: "subject_avg_mastery", conditionParams: { subjectId: "maths" } };
    expect(evaluateBadge(badge, buildSnapshot(base({ topics: topics.slice(0, 2), subjects })))).toMatchObject({ deserved: false, value: 0 });
    expect(evaluateBadge(badge, buildSnapshot(base({ topics, subjects })))).toEqual({ value: 85, target: 80, deserved: true });
  });

  it("la matière liée au trophée sert quand ses paramètres ne la nomment pas", () => {
    const topics = [1, 2, 3].map((i) => ({
      topicId: `t${i}`,
      subjectId: "maths",
      completed: true,
      perfect: false,
      started: true,
      masteryLevel: 85,
    }));
    const s = buildSnapshot(base({ topics, subjects: [{ subjectId: "maths", name: "Mathématiques", topicCount: 5 }] }));
    expect(evaluateBadge({ condition: "subject_avg_mastery", conditionParams: {} }, s)).toMatchObject({ deserved: false, value: 0 });
    expect(evaluateBadge({ condition: "subject_avg_mastery", conditionParams: {}, subjectId: "maths" }, s)).toEqual({
      value: 85,
      target: 80,
      deserved: true,
    });
    // Les paramètres gardent la main : la matière qu'ils nomment n'est pas remplacée.
    expect(
      evaluateBadge({ condition: "subject_avg_mastery", conditionParams: { subjectId: "francais" }, subjectId: "maths" }, s),
    ).toMatchObject({ deserved: false });
  });

  it("une matière entière terminée", () => {
    const subjects = [{ subjectId: "maths", name: "Mathématiques", topicCount: 2 }];
    const topics = [
      { topicId: "t1", subjectId: "maths", completed: true, perfect: false, started: true, masteryLevel: 80 },
      { topicId: "t2", subjectId: "maths", completed: true, perfect: false, started: true, masteryLevel: 80 },
    ];
    expect(evaluateBadge({ condition: "subject_full_complete" }, buildSnapshot(base({ topics, subjects })))).toMatchObject({ deserved: true });
    expect(evaluateBadge({ condition: "subjects_completed", conditionParams: { count: 2 } }, buildSnapshot(base({ topics, subjects })))).toMatchObject({
      value: 1,
      deserved: false,
    });
  });

  it("série, missions, anciennes clés", () => {
    const s = buildSnapshot(base({ streakLongest: 7, questsCompletedTotal: 12, perfectQuestDays: 1, topics: [
      { topicId: "t1", subjectId: "m", completed: true, perfect: true, started: true, masteryLevel: 100 },
    ] }));
    expect(evaluateBadge({ condition: "streak_days", conditionParams: { count: 7 } }, s)?.deserved).toBe(true);
    expect(evaluateBadge({ condition: "streak_days", conditionParams: { count: 30 } }, s)?.deserved).toBe(false);
    expect(evaluateBadge({ condition: "quests_completed_total", conditionParams: { count: 10 } }, s)?.deserved).toBe(true);
    expect(evaluateBadge({ condition: "perfect_quest_days", conditionParams: { count: 7 } }, s)?.deserved).toBe(false);
    expect(evaluateBadge({ condition: "complete_topic" }, s)?.deserved).toBe(true);
    expect(evaluateBadge({ condition: "perfect_score" }, s)?.deserved).toBe(true);
    expect(evaluateBadge({ condition: "streak_3" }, s)?.deserved).toBe(false);
  });
});
