/**
 * LE MONDE DE PIO, VU PAR UN ÉLÈVE — la carte, le sentier d'une matière et
 * « où reprendre », en règles pures.
 *
 * Ce que ces fonctions calculaient vivait dans les requêtes de `students.ts`,
 * mêlé aux lectures de la base. Elles en sont sorties pour que l'application,
 * qui joue sans réseau (`lib/offline/`), dessine la même carte et le même
 * sentier que le serveur, depuis les mêmes données : les requêtes lisent la
 * base puis appellent ici, l'application lit son paquet hors ligne puis
 * appelle ici. Une seule règle, deux lecteurs.
 *
 * Module pur : ni base, ni `ctx`. Les identifiants sont génériques, pour que
 * les requêtes gardent leurs types `Id<…>`.
 */
import {
  effectivePalierCount,
  isTopicComplete,
  nextPalierIndex,
  resolvePalierStatuses,
  type PalierStatus,
  type TopicLike,
} from "./palierRules";
import { palierStarRating } from "./progressionRules";
import type { ClassName } from "./curriculum";

// ---------------------------------------------------------------------------
// LA NOTE D'UN PALIER VALIDÉ SANS RÉSUMÉ. Une tentative notée depuis la
// remise en place de la progression porte ses étoiles exactes
// (`palierAttempts.starsTotal`), et sa note de une à trois étoiles est celle
// de l'écran de fin (`progressionRules.palierStarRating`). Une tentative
// d'avant, que `progression:rebuild` n'a pas encore résumée, n'a que sa
// moyenne : on en tire la note, comme avant.
//   - average >= 9 → 3 stars
//   - average >= 7 → 2 stars (PALIER_VALIDATION_THRESHOLD)
//   - average  < 7 → 1 star (only when defensively included)
// ---------------------------------------------------------------------------
export function approxStarsForValidatedPalier(averageScore: number): number {
  if (averageScore >= 9) return 3;
  if (averageScore >= 7) return 2;
  return 1;
}

// ---------------------------------------------------------------------------
// Topic status resolution (D4 — linear unlock chain).
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

export function resolveTopicStatuses(topics: TopicInput[]): TopicStatus[] {
  const sorted = [...topics].sort((a, b) => a.order - b.order);
  const statuses: TopicStatus[] = [];
  let prevPassedForUnlock = true;

  for (const topic of sorted) {
    const passedForUnlock = topic.isCompleted || topic.validatedPaliers >= 1;

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
// Les données, telles que les deux lecteurs les ont.
// ---------------------------------------------------------------------------

export type WorldSubject<SId extends string = string> = {
  _id: SId;
  name: string;
  icon: string;
  color: string;
  order: number;
};

export type WorldTopic<TId extends string = string, SId extends string = string> = TopicLike & {
  _id: TId;
  subjectId: SId;
  name: string;
  description: string;
  order: number;
  class?: ClassName | null;
};

/** La ligne `studentTopicProgress` d'une thématique, ce que la carte en lit. */
export type WorldTopicProgress = {
  topicId: string;
  completedAt?: number | null;
  completedExercises: number;
  correctExercises: number;
  starsEarned?: number;
};

/** Une tentative de palier, avec la position de son palier. */
export type WorldPalierAttempt<TId extends string = string> = {
  topicId: TId;
  palierIndex: number;
  status: string;
  averageScore?: number;
  starsTotal?: number;
  exerciseCount?: number;
};

export type PalierProgress = {
  /** Les index de paliers validés au moins une fois. */
  validated: Set<number>;
  /** Les index avec une tentative ouverte. */
  inProgress: Set<number>;
  /** La meilleure note (une à trois étoiles) par palier validé, celle de l'écran de fin. */
  bestRating: Map<number, number>;
};

export type PalierProgressByTopic<TId extends string = string> = {
  byTopic: Map<string, PalierProgress>;
  /** Le palier en cours le plus récent, pour « reprendre l'aventure ». */
  latestInProgress: { topicId: TId; palierIndex: number } | null;
};

const EMPTY_SET: ReadonlySet<number> = new Set();

/**
 * Les tentatives de palier de l'élève, regroupées par thématique.
 * `attemptsNewestFirst` : de la plus récente à la plus ancienne — la première
 * tentative ouverte rencontrée est celle où reprendre.
 */
export function palierProgressByTopic<TId extends string>(
  attemptsNewestFirst: readonly WorldPalierAttempt<TId>[],
): PalierProgressByTopic<TId> {
  const byTopic = new Map<string, PalierProgress>();
  let latestInProgress: PalierProgressByTopic<TId>["latestInProgress"] = null;
  for (const attempt of attemptsNewestFirst) {
    const key = attempt.topicId as string;
    const entry = byTopic.get(key) ?? {
      validated: new Set<number>(),
      inProgress: new Set<number>(),
      bestRating: new Map<number, number>(),
    };
    if (attempt.status === "validated") {
      entry.validated.add(attempt.palierIndex);
      const rating =
        attempt.starsTotal !== undefined && attempt.exerciseCount !== undefined
          ? palierStarRating(attempt.starsTotal, attempt.exerciseCount)
          : approxStarsForValidatedPalier(attempt.averageScore ?? 0);
      if (rating > (entry.bestRating.get(attempt.palierIndex) ?? 0)) {
        entry.bestRating.set(attempt.palierIndex, rating);
      }
    } else if (attempt.status === "in_progress") {
      entry.inProgress.add(attempt.palierIndex);
      if (latestInProgress === null) {
        latestInProgress = { topicId: attempt.topicId, palierIndex: attempt.palierIndex };
      }
    }
    byTopic.set(key, entry);
  }
  return { byTopic, latestInProgress };
}

export function countValidatedWithin(validated: ReadonlySet<number>, palierCount: number): number {
  let n = 0;
  for (let i = 1; i <= palierCount; i++) if (validated.has(i)) n += 1;
  return n;
}

export function topicInputFor(
  topic: WorldTopic,
  progress: WorldTopicProgress | undefined,
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
// LE SENTIER D'UNE MATIÈRE — `students.getStudentSubjectMap`.
// ---------------------------------------------------------------------------

export function buildSubjectMap<SId extends string, TId extends string>(input: {
  subject: WorldSubject<SId>;
  /** Les thématiques de la matière pour le niveau de l'élève, dans l'ordre. */
  topics: readonly WorldTopic<TId, SId>[];
  progressByTopicId: ReadonlyMap<string, WorldTopicProgress>;
  byTopic: ReadonlyMap<string, PalierProgress>;
}) {
  const { subject, topics, progressByTopicId, byTopic } = input;
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
    }).map((palierStatus: PalierStatus, idx) => {
      const index = idx + 1;
      const stars =
        palierStatus === "completed" ? (paliersDone?.bestRating.get(index) ?? 0) : 0;
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
      starsEarned: progress?.starsEarned ?? 0,
      completedExercises: progress?.completedExercises ?? 0,
      correctExercises: progress?.correctExercises ?? 0,
      paliers,
    };
  });

  // Les étoiles gagnées sur la matière, dans l'unité du carnet (trois par
  // exercice) ; chaque étape garde sa note de une à trois étoiles.
  const totalStars = orderedTopics.reduce((acc, t) => acc + t.starsEarned, 0);
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
    totalStars,
    totalPaliers,
    completedPaliers,
  };
}

export type SubjectMapView = ReturnType<typeof buildSubjectMap>;

// ---------------------------------------------------------------------------
// LA CARTE DES MONDES — `students.getMyWorldMap`.
// ---------------------------------------------------------------------------

export function buildWorldZone<SId extends string, TId extends string>(input: {
  subject: WorldSubject<SId>;
  topics: readonly WorldTopic<TId, SId>[];
  progressByTopic: ReadonlyMap<string, WorldTopicProgress>;
  byTopic: ReadonlyMap<string, PalierProgress>;
}) {
  const { subject, topics, progressByTopic, byTopic } = input;
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

  return {
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
  };
}

export type WorldZoneView = ReturnType<typeof buildWorldZone>;

// ---------------------------------------------------------------------------
// OÙ REPRENDRE — `students.getMyNextStep`.
// ---------------------------------------------------------------------------

type NextStepTarget<SId extends string, TId extends string> = {
  topicId: TId;
  topicName: string;
  palierIndex: number;
  subjectId: SId;
  subjectName: string;
  subjectColor: string;
};

export type NextStepView<SId extends string = string, TId extends string = string> =
  | ({ kind: "continue" } & NextStepTarget<SId, TId>)
  | ({ kind: "start" } & NextStepTarget<SId, TId>)
  | { kind: "explore" }
  | { kind: "empty" };

/**
 * Où reprendre l'aventure.
 *
 *   1. Un palier laissé EN COURS, le plus récent : on y retourne.
 *   2. Sinon, la première étape ouverte ou en cours, en parcourant les
 *      mondes dans l'ordre — les mêmes statuts que le sentier.
 *   3. Sinon, tout est franchi : on l'envoie admirer la carte.
 *
 * `subjects` : dans l'ordre, chacune avec ses thématiques pour le niveau de
 * l'élève. `latestInProgress` n'est suivi que si sa thématique y figure et
 * que le palier en est encore une étape.
 */
export function buildNextStep<SId extends string, TId extends string>(input: {
  subjects: readonly { subject: WorldSubject<SId>; topics: readonly WorldTopic<TId, SId>[] }[];
  latestInProgress: { topicId: TId; palierIndex: number } | null;
  progressByTopic: ReadonlyMap<string, WorldTopicProgress>;
  byTopic: ReadonlyMap<string, PalierProgress>;
}): NextStepView<SId, TId> {
  const { subjects, latestInProgress, progressByTopic, byTopic } = input;

  if (latestInProgress) {
    for (const { subject, topics } of subjects) {
      const topic = topics.find((t) => t._id === latestInProgress.topicId);
      if (topic && latestInProgress.palierIndex <= effectivePalierCount(topic)) {
        return {
          kind: "continue",
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

  let anySubject = false;
  for (const { subject, topics } of subjects) {
    if (topics.length === 0) continue;
    anySubject = true;

    const inputs: TopicInput[] = topics.map((t) =>
      topicInputFor(t, progressByTopic.get(t._id as string), byTopic.get(t._id as string)),
    );
    const statuses = resolveTopicStatuses(inputs);
    const idx = statuses.findIndex((st) => st === "in_progress" || st === "available");
    if (idx === -1) continue;

    const topic = topics[idx];
    const validated = byTopic.get(topic._id as string)?.validated ?? EMPTY_SET;
    return {
      kind: "start",
      topicId: topic._id,
      topicName: topic.name,
      palierIndex: nextPalierIndex(validated, effectivePalierCount(topic)),
      subjectId: subject._id,
      subjectName: subject.name,
      subjectColor: subject.color,
    };
  }

  return anySubject ? { kind: "explore" } : { kind: "empty" };
}
