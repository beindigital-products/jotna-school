import { describe, expect, it } from "vitest";
import { ACK_GRACE_MS, buildModel, sessionIsDirty } from "../model";
import { gradeSession, type LocalLogEntry } from "../session-rules";
import type {
  ArabicSnapshot,
  ContentPack,
  LocalSession,
  OfflineData,
  OutboxEntry,
  PackExercise,
  Snapshot,
} from "../types";

// ---------------------------------------------------------------------------
// Un élève de CP, une matière, deux thématiques de trois paliers.
// ---------------------------------------------------------------------------

const NOW = Date.UTC(2026, 9, 2, 10, 0, 0);
const DAY = 24 * 60 * 60 * 1000;

const exerciseIds = (palier: string) => Array.from({ length: 10 }, (_, i) => `${palier}-ex${i + 1}`);

function snapshot(overrides: Partial<Snapshot> = {}): Snapshot {
  return {
    protocol: 1,
    serverTime: NOW - DAY,
    profile: {
      _id: "student1",
      userId: "user1",
      name: "Awa Diop",
      avatar: null,
      class: "CP",
      readsAloud: true,
    },
    access: { ok: true, endsAt: NOW + 90 * DAY },
    prefs: {
      soundEnabled: null,
      streak: null,
      lastSeenBadgeIds: [],
      lastSeenLevel: 1,
      questBonusStars: 0,
    },
    flags: { streaksEnabled: true, missionsEnabled: true },
    schooling: null,
    palierAttempts: [],
    topicProgress: [],
    earnedBadges: [],
    totalTimeMs: 0,
    missions: [],
    modules: [],
    contentVersion: "v1",
    ...overrides,
  } as unknown as Snapshot;
}

function content(): ContentPack {
  const paliers = ["t1", "t2"].flatMap((topic) =>
    [1, 2, 3].map((index) => ({
      _id: `${topic}-p${index}`,
      topicId: topic,
      subjectId: "math",
      class: "CP",
      palierIndex: index,
      status: "cached",
      generatedAt: NOW - 10 * DAY,
      expiresAt: NOW + 80 * DAY,
      exerciseIds: exerciseIds(`${topic}-p${index}`),
    })),
  );
  const exercises = paliers.flatMap((p) =>
    p.exerciseIds.map((id, i) => ({
      _id: id,
      palierId: p._id,
      order: i,
      type: "qcm",
      prompt: "Combien font 2 + 2 ?",
      payload: { options: ["3", "4"], correctIndex: 1 },
      hints: ["Compte sur tes doigts."],
      explanation: null,
    })),
  );
  return {
    protocol: 1,
    contentVersion: "v1",
    fetchedAt: NOW - DAY,
    class: "CP",
    subjects: [{ _id: "math", name: "Mathématiques", icon: "calculator", color: "#f59e0b", order: 1 }],
    playableSubjects: [{ id: "math", name: "Mathématiques" }],
    topics: [
      { _id: "t1", subjectId: "math", name: "Compter", description: "", order: 1, class: "CP", palierCount: null },
      { _id: "t2", subjectId: "math", name: "Additionner", description: "", order: 2, class: "CP", palierCount: null },
    ],
    paliers,
    exercises,
    badges: [
      {
        _id: "badge-first",
        name: "Premier palier",
        description: "Valide un palier",
        icon: "flag",
        condition: "paliers_validated_total",
        conditionParams: { count: 1 },
        subjectId: null,
        category: null,
        catalogKey: null,
        order: 1,
        rarity: "common",
        criteriaText: "Valide 1 palier",
        supported: true,
        visibility: null,
      },
    ],
  } as unknown as ContentPack;
}

function data(overrides: Partial<OfflineData> = {}): OfflineData {
  return {
    profileId: "student1",
    snapshot: snapshot(),
    snapshotReceivedAt: NOW - DAY,
    content: content(),
    badgeInputs: null,
    arabic: null,
    arabicReceivedAt: 0,
    sessions: [],
    outbox: [],
    localBadges: [],
    explanations: {},
    ...overrides,
  };
}

const correct = (id: string, at: number): LocalLogEntry => ({
  kind: "answer",
  exerciseId: id,
  answer: "1",
  correct: true,
  at,
  timeSpentMs: 3000,
});

/** Une séance finie sur l'appareil : toutes les réponses justes du premier coup. */
function finishedSession(palier: string, topic: string, index: number, at: number): LocalSession {
  const ids = exerciseIds(palier);
  const log = ids.map((id) => correct(id, at));
  return {
    sessionId: `session-${palier}`,
    palierId: palier,
    topicId: topic,
    subjectId: "math",
    palierIndex: index,
    startedAt: at - 60_000,
    exerciseIds: ids,
    log,
    finishedAt: at,
    grade: gradeSession(ids, log),
    exercises: [] as PackExercise[],
    sync: { pushedLogLength: 0, pushedExercises: "", pushedFinishedAt: null, serverAttemptId: null, ackedAt: null },
  };
}

describe("le monde de l'élève, sans rien fait", () => {
  it("ouvre le premier palier, ferme le reste, et propose de commencer", () => {
    const model = buildModel(data(), NOW);
    const trail = model.subjectMaps.get("math")!;
    expect(trail.topics[0].paliers.map((p) => p.status)).toEqual(["available", "locked", "locked"]);
    expect(trail.topics[1].status).toBe("locked");
    expect(model.nextStep).toMatchObject({ kind: "start", topicId: "t1", palierIndex: 1 });
    expect(model.worldMap[0]).toMatchObject({ totalTopics: 2, totalPaliers: 6, completedPaliers: 0 });
    expect(model.stats?.level).toBe(1);
  });
});

describe("un palier validé sans réseau", () => {
  const session = finishedSession("t1-p1", "t1", 1, NOW - 1000);
  const model = buildModel(data({ sessions: [session] }), NOW);

  it("allume l'étape, ouvre la suivante et la thématique d'après", () => {
    const trail = model.subjectMaps.get("math")!;
    expect(trail.topics[0].paliers.map((p) => p.status)).toEqual(["completed", "available", "locked"]);
    expect(trail.topics[0].paliers[0].stars).toBe(3);
    // Règle D4 : un palier validé ouvre la thématique suivante.
    expect(trail.topics[1].status).toBe("available");
    expect(model.nextStep).toMatchObject({ kind: "start", topicId: "t1", palierIndex: 2 });
  });

  it("fait monter le carnet : exercices, étoiles, série", () => {
    expect(model.stats?.totalCorrectExercises).toBe(10);
    expect(model.stats?.totalStars).toBeGreaterThanOrEqual(30);
    expect(model.stats?.currentStreak).toBe(1);
  });

  it("fait avancer les missions du jour", () => {
    const done = model.daily!.quests.filter((q) => q.progress > 0);
    expect(done.length).toBeGreaterThan(0);
  });

  it("mérite sur l'appareil le trophée du premier palier", () => {
    const withInputs = buildModel(
      data({
        sessions: [session],
        badgeInputs: { fetchedAt: NOW - DAY, attempts: [], questsCompletedTotal: 0, perfectQuestDays: 0, missionDays: [] },
      }),
      NOW,
    );
    expect(withInputs.deservedLocally).toContain("badge-first");
  });
});

describe("quand le serveur a reçu la séance", () => {
  const session = finishedSession("t1-p1", "t1", 1, NOW - 10 * 60_000);
  const pushed: LocalSession = {
    ...session,
    sync: {
      pushedLogLength: session.log.length,
      pushedExercises: session.exerciseIds.join(","),
      pushedFinishedAt: session.finishedAt!,
      serverAttemptId: "attempt1",
      ackedAt: NOW - 5 * 60_000,
    },
  };
  const serverRow = {
    _id: "attempt1",
    palierId: "t1-p1",
    topicId: "t1",
    subjectId: "math",
    palierIndex: 1,
    status: "validated",
    startedAt: session.startedAt,
    completedAt: session.finishedAt!,
    averageScore: 10,
    exerciseCount: 10,
    correctCount: 10,
    firstTryCount: 10,
    noHintCount: 10,
    hintsUsed: 0,
    starsTotal: 30,
    timeSpentMs: 30000,
    clientSessionId: session.sessionId,
  };
  const reflected = snapshot({
    palierAttempts: [serverRow],
    topicProgress: [
      {
        topicId: "t1",
        completedExercises: 10,
        correctExercises: 10,
        totalHintsUsed: 0,
        masteryLevel: 100,
        starsEarned: 30,
        completedAt: null,
      },
    ],
  } as unknown as Partial<Snapshot>);

  it("ne compte pas deux fois ce que le paquet reflète déjà", () => {
    expect(sessionIsDirty(pushed)).toBe(false);
    const model = buildModel(
      data({ snapshot: reflected, snapshotReceivedAt: NOW - 60_000, sessions: [pushed] }),
      NOW,
    );
    expect(model.stats?.totalCorrectExercises).toBe(10);
    expect(model.attempts.filter((a) => a.palierId === "t1-p1")).toHaveLength(1);
    expect(model.attempts[0].local).toBe(false);
  });

  it("garde la séance tant que le paquet date d'avant l'accusé de réception", () => {
    const model = buildModel(
      data({ snapshot: snapshot(), snapshotReceivedAt: NOW - 6 * 60_000, sessions: [pushed] }),
      NOW - 4 * 60_000,
    );
    expect(model.attempts.some((a) => a.local)).toBe(true);
    expect(model.stats?.totalCorrectExercises).toBe(10);
  });

  it("cesse de la superposer passé le délai de grâce", () => {
    const later = pushed.sync.ackedAt! + ACK_GRACE_MS + 1;
    const model = buildModel(
      data({ snapshot: reflected, snapshotReceivedAt: NOW - DAY, sessions: [pushed] }),
      later,
    );
    expect(model.attempts.every((a) => !a.local)).toBe(true);
  });
});

describe("les réglages pris sans réseau", () => {
  const entry: OutboxEntry = { seq: 1, event: { kind: "soundEnabled", id: "e1", at: NOW - 1000, enabled: true } };

  it("le son choisi l'emporte sur le paquet", () => {
    const model = buildModel(data({ outbox: [entry] }), NOW);
    expect(model.stats?.soundEnabled).toBe(true);
    expect(model.stats?.soundOptInDecided).toBe(true);
  });

  it("un niveau vu ne se refête pas", () => {
    const session = finishedSession("t1-p1", "t1", 1, NOW - 1000);
    const many = Array.from({ length: 5 }, (_, i) => finishedSession(`p${i}`, "t1", 1, NOW - 1000 - i));
    const before = buildModel(data({ sessions: [session, ...many] }), NOW);
    expect(before.stats?.unseenLevelUp).toEqual({ level: 2 });
    const seen: OutboxEntry = { seq: 2, event: { kind: "levelSeen", id: "e2", at: NOW, level: 2 } };
    const after = buildModel(data({ sessions: [session, ...many], outbox: [seen] }), NOW);
    expect(after.stats?.unseenLevelUp).toBeNull();
  });
});

describe("le module d'arabe sans réseau", () => {
  const arabic = {
    enabled: true,
    reason: "ok",
    placement: { level: null, surahKey: null, floorOrder: 0 },
    progress: [],
    hifz: [],
    mastery: {},
  } as unknown as ArabicSnapshot;

  it("une leçon jouée et finie sur l'appareil compte ses étoiles", () => {
    const attempts: OutboxEntry[] = [
      { seq: 1, event: { kind: "arabicAttempt", id: "a1", at: NOW - 5000, lessonKey: "alif-ba", drill: "recognizeName", itemKey: "alif", correct: true } },
      { seq: 2, event: { kind: "arabicAttempt", id: "a2", at: NOW - 4000, lessonKey: "alif-ba", drill: "write", itemKey: "alif", correct: true, score: 0.8 } },
      { seq: 3, event: { kind: "arabicLessonComplete", id: "c1", at: NOW - 3000, lessonKey: "alif-ba" } },
    ];
    const model = buildModel(data({ arabic, arabicReceivedAt: NOW - DAY, outbox: attempts }), NOW);
    const row = model.arabic!.path.progress.find((p) => p.lessonKey === "alif-ba");
    expect(row).toMatchObject({ status: "completed", stars: 3 });
    expect(model.arabic!.lessonState("alif-ba").mastery).toEqual({ "recognizeName:alif": 1, "write:alif": 0.8 });
  });
});
