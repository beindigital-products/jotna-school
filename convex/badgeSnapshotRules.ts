/**
 * L'INSTANTANÉ D'UN ÉLÈVE POUR JUGER SES TROPHÉES — depuis des données
 * simples, sans base.
 *
 * `badges.buildStudentSnapshot` lit la base puis appelle ici ; l'application
 * qui joue sans réseau (`lib/offline/`) appelle ici avec son paquet et ses
 * séances du jour : un trophée mérité sur le téléphone l'est pour la même
 * raison que sur le serveur, qui l'attribue pour de bon à la synchronisation.
 *
 * Module pur, comme `badgeRules.ts` qu'il prépare.
 */
import type { SnapshotAttemptRow, SnapshotInput } from "./badgeRules";
import { effectivePalierCount, isTopicComplete, type TopicLike } from "./palierRules";
import { isFinished, isFlawless } from "./progressionRules";

export type BadgeSnapshotRaw = {
  /** Les lignes d'essai récentes (les indices compris), les plus récentes d'abord ou non. */
  attempts: readonly SnapshotAttemptRow[];
  /** Les tentatives de palier, avec la place de leur palier quand elle est connue. */
  palierAttempts: readonly {
    palierId: string;
    status: string;
    exerciseCount?: number;
    firstTryCount?: number;
    topicId: string | null;
    palierIndex: number | null;
  }[];
  topicProgress: readonly {
    topicId: string;
    completedAt?: number | null;
    completedExercises: number;
    masteryLevel: number;
  }[];
  /** Les matières dans l'ordre, chacune avec SES thématiques pour le niveau de l'élève. */
  subjects: readonly {
    subjectId: string;
    name: string;
    topics: readonly (TopicLike & { topicId: string })[];
  }[];
  streakCurrent: number;
  streakLongest: number;
  questsCompletedTotal: number;
  perfectQuestDays: number;
};

export function badgeSnapshotInput(raw: BadgeSnapshotRaw): SnapshotInput {
  const validatedPaliers = new Set<string>();
  const startedTopics = new Set<string>();
  // UNE THÉMATIQUE SANS FAUTE : chacun de ses paliers a été validé au moins
  // une fois sans erreur, chaque exercice réussi à la première réponse.
  const flawlessByTopic = new Map<string, Set<number>>();
  for (const a of raw.palierAttempts) {
    if (a.status === "validated") validatedPaliers.add(a.palierId);
    if (isFinished(a) && a.topicId) startedTopics.add(a.topicId);
    if (a.status !== "validated" || !isFlawless(a) || !a.topicId || a.palierIndex === null) continue;
    const indices = flawlessByTopic.get(a.topicId) ?? new Set<number>();
    indices.add(a.palierIndex);
    flawlessByTopic.set(a.topicId, indices);
  }

  const progressByTopic = new Map(raw.topicProgress.map((p) => [p.topicId, p] as const));
  const topics: SnapshotInput["topics"][number][] = [];
  const subjects: SnapshotInput["subjects"][number][] = [];
  for (const subject of raw.subjects) {
    subjects.push({ subjectId: subject.subjectId, name: subject.name, topicCount: subject.topics.length });
    for (const topic of subject.topics) {
      const p = progressByTopic.get(topic.topicId);
      const completed = p?.completedAt != null;
      topics.push({
        topicId: topic.topicId,
        subjectId: subject.subjectId,
        completed,
        perfect:
          completed &&
          isTopicComplete(flawlessByTopic.get(topic.topicId) ?? new Set<number>(), effectivePalierCount(topic)),
        started: startedTopics.has(topic.topicId) || (p?.completedExercises ?? 0) > 0,
        masteryLevel: p?.masteryLevel ?? 0,
      });
    }
  }

  return {
    attempts: raw.attempts,
    paliersValidated: validatedPaliers.size,
    topics,
    subjects,
    streakCurrent: raw.streakCurrent,
    streakLongest: raw.streakLongest,
    questsCompletedTotal: raw.questsCompletedTotal,
    perfectQuestDays: raw.perfectQuestDays,
    // Le Sénégal vit à l'heure UTC : les trophées du matin et du soir aussi.
    utcOffsetHours: 0,
  };
}
