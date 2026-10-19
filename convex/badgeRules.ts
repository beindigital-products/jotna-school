/**
 * LES TROPHÉES, EN RÈGLES PURES.
 *
 * Un trophée est une ligne de la table `badges` : une condition (`condition`,
 * une clé de ce catalogue) et ses paramètres (`conditionParams`, un seuil,
 * une heure, une matière). Ce module dit, pour un instantané de l'élève
 * (`StudentSnapshot`), où il en est sur chaque trophée : la valeur atteinte,
 * la cible, et s'il est mérité. Le même calcul sert à l'attribution
 * (`badges.checkAndAward`, à chaque fin de palier), à la vitrine (barre de
 * progression sur les trophées fermés) et au texte du critère.
 *
 * Pourquoi ce module existe : l'ancien moteur ne connaissait que trois
 * conditions (`complete_topic`, `perfect_score`, `streak_3`), alors que le
 * catalogue en base en utilise une trentaine ; aucun trophée ne pouvait être
 * gagné. Les conditions que les données ne permettent pas encore de juger
 * (`teacher_kudos`) restent hors catalogue : un enfant ne doit pas courir
 * après un trophée impossible.
 *
 * Module pur, sans Convex, testé dans `convex/__tests__/badgeRules.test.ts`.
 */

export type SubjectSnapshot = {
  subjectId: string;
  name: string;
  /** Thématiques visibles pour l'élève dans cette matière. */
  topicCount: number;
  completedTopics: number;
  /** Thématiques avec une progression (au moins un palier fini). */
  startedTopics: number;
  /** Moyenne de `masteryLevel` (0 à 100) sur les thématiques commencées. */
  averageMastery: number;
};

export type StudentSnapshot = {
  /** Exercices résolus, toutes tentatives confondues. */
  correctExercisesTotal: number;
  /** Lignes d'essai réelles (les indices n'en sont pas). */
  attemptsTotal: number;
  /** Exercices résolus dès la première réponse. */
  firstTryCorrectTotal: number;
  /** Exercices résolus sans indice. */
  noHintCorrectTotal: number;
  /** Exercices résolus au n-ième essai ou plus tard, par n. */
  retrySuccessByMinAttempts: (minAttempts: number) => number;
  /** Bonnes réponses données en moins de `maxTimeMs` (temps connu seulement). */
  fastCorrectTotal: (maxTimeMs: number) => number;
  /** Plus longue suite de bonnes réponses rapides d'affilée. */
  fastCorrectStreak: (maxTimeMs: number) => number;
  /** Plus grand nombre de bonnes réponses dans une fenêtre glissante. */
  correctWithinWindow: (windowMs: number) => number;
  /** Bonnes réponses un samedi ou un dimanche. */
  weekendCorrectTotal: number;
  /** Essais donnés avant / à partir d'une heure (heure de Dakar). */
  attemptsBeforeHour: (hour: number) => number;
  attemptsFromHour: (hour: number) => number;
  /** Paliers distincts validés. */
  paliersValidated: number;
  completedTopics: number;
  /** Thématiques terminées sans aucune erreur. */
  perfectTopics: number;
  subjects: SubjectSnapshot[];
  streakCurrent: number;
  streakLongest: number;
  questsCompletedTotal: number;
  perfectQuestDays: number;
};

export type BadgeParams = Record<string, unknown>;

export type BadgeEvaluation = {
  /** Valeur atteinte par l'élève, dans l'unité de la cible. */
  value: number;
  target: number;
  deserved: boolean;
};

type Rule = {
  /** Paramètres par défaut quand le catalogue n'en pose pas. */
  defaults: BadgeParams;
  /** Libellé pour l'administration. */
  label: string;
  evaluate: (s: StudentSnapshot, p: BadgeParams) => { value: number; target: number };
  text: (p: BadgeParams, subjectName?: string) => string;
};

const num = (p: BadgeParams, key: string, fallback: number): number => {
  const v = p[key];
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
};

const plural = (n: number, one: string, many: string) => (n <= 1 ? one : many);

const RULES: Record<string, Rule> = {
  completed_topic_count: {
    defaults: { count: 1 },
    label: "Thématiques terminées",
    evaluate: (s, p) => ({ value: s.completedTopics, target: num(p, "count", 1) }),
    text: (p) => {
      const n = num(p, "count", 1);
      return n === 1 ? "Termine une thématique" : `Termine ${n} thématiques`;
    },
  },
  perfect_topic_count: {
    defaults: { count: 1 },
    label: "Thématiques sans erreur",
    evaluate: (s, p) => ({ value: s.perfectTopics, target: num(p, "count", 1) }),
    text: (p) => {
      const n = num(p, "count", 1);
      return n === 1 ? "Termine une thématique sans aucune erreur" : `Termine ${n} thématiques sans aucune erreur`;
    },
  },
  exercises_correct_total: {
    defaults: { count: 100 },
    label: "Exercices résolus",
    evaluate: (s, p) => ({ value: s.correctExercisesTotal, target: num(p, "count", 100) }),
    text: (p) => `Résous ${num(p, "count", 100)} exercices`,
  },
  correct_attempts_count: {
    defaults: { count: 50 },
    label: "Exercices résolus (volume)",
    evaluate: (s, p) => ({ value: s.correctExercisesTotal, target: num(p, "count", 50) }),
    text: (p) => `Résous ${num(p, "count", 50)} exercices`,
  },
  total_attempts_count: {
    defaults: { count: 200 },
    label: "Réponses données",
    evaluate: (s, p) => ({ value: s.attemptsTotal, target: num(p, "count", 200) }),
    text: (p) => `Donne ${num(p, "count", 200)} réponses, justes ou non`,
  },
  first_try_correct_count: {
    defaults: { count: 25 },
    label: "Réussites du premier coup",
    evaluate: (s, p) => ({ value: s.firstTryCorrectTotal, target: num(p, "count", 25) }),
    text: (p) => `Réussis ${num(p, "count", 25)} exercices du premier coup`,
  },
  correct_without_hints: {
    defaults: { count: 20 },
    label: "Réussites sans indice",
    evaluate: (s, p) => ({ value: s.noHintCorrectTotal, target: num(p, "count", 20) }),
    text: (p) => `Réussis ${num(p, "count", 20)} exercices sans indice`,
  },
  retry_success_count: {
    defaults: { minAttempts: 3, count: 5 },
    label: "Réussites après plusieurs essais",
    evaluate: (s, p) => ({
      value: s.retrySuccessByMinAttempts(num(p, "minAttempts", 3)),
      target: num(p, "count", 5),
    }),
    text: (p) =>
      `Réussis ${num(p, "count", 5)} exercices après au moins ${num(p, "minAttempts", 3)} essais`,
  },
  fast_correct_total: {
    defaults: { maxTimeMs: 20_000, count: 20 },
    label: "Bonnes réponses rapides",
    evaluate: (s, p) => ({ value: s.fastCorrectTotal(num(p, "maxTimeMs", 20_000)), target: num(p, "count", 20) }),
    text: (p) =>
      `Donne ${num(p, "count", 20)} bonnes réponses en moins de ${Math.round(num(p, "maxTimeMs", 20_000) / 1000)} secondes`,
  },
  fast_correct_streak: {
    defaults: { maxTimeMs: 15_000, count: 10 },
    label: "Bonnes réponses rapides d'affilée",
    evaluate: (s, p) => ({ value: s.fastCorrectStreak(num(p, "maxTimeMs", 15_000)), target: num(p, "count", 10) }),
    text: (p) =>
      `Enchaîne ${num(p, "count", 10)} bonnes réponses en moins de ${Math.round(num(p, "maxTimeMs", 15_000) / 1000)} secondes chacune`,
  },
  single_session_correct_count: {
    defaults: { windowMs: 3_600_000, count: 30 },
    label: "Bonnes réponses en une séance",
    evaluate: (s, p) => ({ value: s.correctWithinWindow(num(p, "windowMs", 3_600_000)), target: num(p, "count", 30) }),
    text: (p) =>
      `Donne ${num(p, "count", 30)} bonnes réponses en ${Math.round(num(p, "windowMs", 3_600_000) / 60_000)} minutes`,
  },
  weekend_correct_count: {
    defaults: { count: 10 },
    label: "Bonnes réponses le week-end",
    evaluate: (s, p) => ({ value: s.weekendCorrectTotal, target: num(p, "count", 10) }),
    text: (p) => `Donne ${num(p, "count", 10)} bonnes réponses un samedi ou un dimanche`,
  },
  attempt_before_hour: {
    defaults: { hour: 8, min: 5 },
    label: "Réponses tôt le matin",
    evaluate: (s, p) => ({ value: s.attemptsBeforeHour(num(p, "hour", 8)), target: num(p, "min", 5) }),
    text: (p) => {
      const n = num(p, "min", 5);
      return `Réponds ${n} ${plural(n, "fois", "fois")} avant ${num(p, "hour", 8)} h du matin`;
    },
  },
  early_bird: {
    defaults: { hour: 8, min: 1 },
    label: "Lève-tôt",
    evaluate: (s, p) => ({ value: s.attemptsBeforeHour(num(p, "hour", 8)), target: num(p, "min", 1) }),
    text: (p) => {
      const n = num(p, "min", 1);
      return n === 1 ? `Réponds une fois avant ${num(p, "hour", 8)} h du matin` : `Réponds ${n} fois avant ${num(p, "hour", 8)} h du matin`;
    },
  },
  attempt_after_hour: {
    defaults: { hour: 22, min: 5 },
    label: "Réponses tard le soir",
    evaluate: (s, p) => ({ value: s.attemptsFromHour(num(p, "hour", 22)), target: num(p, "min", 5) }),
    text: (p) => `Réponds ${num(p, "min", 5)} fois après ${num(p, "hour", 22)} h`,
  },
  paliers_validated_total: {
    defaults: { count: 1 },
    label: "Paliers validés",
    evaluate: (s, p) => ({ value: s.paliersValidated, target: num(p, "count", 1) }),
    text: (p) => {
      const n = num(p, "count", 1);
      return n === 1 ? "Valide ton premier palier" : `Valide ${n} paliers`;
    },
  },
  subjects_touched: {
    defaults: { count: 2 },
    label: "Matières commencées",
    evaluate: (s, p) => ({ value: s.subjects.filter((x) => x.startedTopics > 0).length, target: num(p, "count", 2) }),
    text: (p) => `Joue dans ${num(p, "count", 2)} matières différentes`,
  },
  subjects_started: {
    defaults: { count: 3 },
    label: "Matières commencées",
    evaluate: (s, p) => ({ value: s.subjects.filter((x) => x.startedTopics > 0).length, target: num(p, "count", 3) }),
    text: (p) => `Joue dans ${num(p, "count", 3)} matières différentes`,
  },
  subjects_completed: {
    defaults: { count: 2 },
    label: "Matières terminées",
    evaluate: (s, p) => ({ value: completedSubjects(s), target: num(p, "count", 2) }),
    text: (p) => {
      const n = num(p, "count", 2);
      return n === 1 ? "Termine toutes les thématiques d'une matière" : `Termine toutes les thématiques de ${n} matières`;
    },
  },
  subject_full_complete: {
    defaults: { count: 1 },
    label: "Matière entière terminée",
    evaluate: (s, p) => ({ value: completedSubjects(s), target: num(p, "count", 1) }),
    text: () => "Termine toutes les thématiques d'une matière",
  },
  subject_avg_mastery: {
    defaults: { minMastery: 80, minTopics: 3 },
    label: "Maîtrise d'une matière",
    evaluate: (s, p) => {
      const subject = s.subjects.find((x) => x.subjectId === p.subjectId);
      const minTopics = num(p, "minTopics", 3);
      if (!subject || subject.startedTopics < minTopics) return { value: 0, target: num(p, "minMastery", 80) };
      return { value: Math.round(subject.averageMastery), target: num(p, "minMastery", 80) };
    },
    text: (p, subjectName) =>
      `Garde une maîtrise de ${num(p, "minMastery", 80)} % ou plus sur ${num(p, "minTopics", 3)} thématiques${subjectName ? ` de ${subjectName}` : ""}`,
  },
  streak_days: {
    defaults: { count: 7 },
    label: "Jours de série",
    evaluate: (s, p) => ({ value: s.streakLongest, target: num(p, "count", 7) }),
    text: (p) => `Joue ${num(p, "count", 7)} jours de suite`,
  },
  consecutive_days_active: {
    defaults: { count: 3 },
    label: "Jours de série",
    evaluate: (s, p) => ({ value: s.streakLongest, target: num(p, "count", 3) }),
    text: (p) => `Joue ${num(p, "count", 3)} jours de suite`,
  },
  quests_completed_total: {
    defaults: { count: 1 },
    label: "Missions accomplies",
    evaluate: (s, p) => ({ value: s.questsCompletedTotal, target: num(p, "count", 1) }),
    text: (p) => {
      const n = num(p, "count", 1);
      return n === 1 ? "Accomplis ta première mission du jour" : `Accomplis ${n} missions du jour`;
    },
  },
  perfect_quest_days: {
    defaults: { count: 1 },
    label: "Journées de missions parfaites",
    evaluate: (s, p) => ({ value: s.perfectQuestDays, target: num(p, "count", 1) }),
    text: (p) => {
      const n = num(p, "count", 1);
      return n === 1 ? "Accomplis toutes les missions d'une journée" : `Accomplis toutes les missions de ${n} journées`;
    },
  },
  // Les trois clés de l'ancien moteur, gardées pour les badges créés avec.
  complete_topic: {
    defaults: { count: 1 },
    label: "Terminer une thématique",
    evaluate: (s) => ({ value: s.completedTopics, target: 1 }),
    text: () => "Termine une thématique",
  },
  perfect_score: {
    defaults: { count: 1 },
    label: "Thématique sans erreur",
    evaluate: (s) => ({ value: s.perfectTopics, target: 1 }),
    text: () => "Termine une thématique sans aucune erreur",
  },
  streak_3: {
    defaults: { count: 3 },
    label: "Trois thématiques",
    evaluate: (s) => ({ value: s.completedTopics, target: 3 }),
    text: () => "Termine trois thématiques",
  },
};

function completedSubjects(s: StudentSnapshot): number {
  return s.subjects.filter((x) => x.topicCount > 0 && x.completedTopics >= x.topicCount).length;
}

/** Les conditions que le moteur sait juger, pour l'administration. */
export const BADGE_CONDITIONS: ReadonlyArray<{ key: string; label: string }> = Object.entries(RULES).map(
  ([key, rule]) => ({ key, label: rule.label }),
);

export function isSupportedCondition(condition: string): boolean {
  return Object.prototype.hasOwnProperty.call(RULES, condition);
}

export function badgeParams(condition: string, raw: unknown): BadgeParams {
  const rule = RULES[condition];
  const given = raw && typeof raw === "object" ? (raw as BadgeParams) : {};
  return { ...(rule?.defaults ?? {}), ...given };
}

/**
 * Les paramètres d'un trophée. La matière liée au trophée (`subjectId` de la
 * ligne) vaut paramètre quand le catalogue ne la pose pas : sans elle, « Maître
 * de… » ne saurait pas quelle matière juger.
 */
function paramsOf(badge: { condition: string; conditionParams?: unknown; subjectId?: string }): BadgeParams {
  const params = badgeParams(badge.condition, badge.conditionParams);
  if (params.subjectId === undefined && badge.subjectId !== undefined) params.subjectId = badge.subjectId;
  return params;
}

/** Où en est l'élève sur ce trophée. `null` : condition que le moteur ne sait pas juger. */
export function evaluateBadge(
  badge: { condition: string; conditionParams?: unknown; subjectId?: string },
  snapshot: StudentSnapshot,
): BadgeEvaluation | null {
  const rule = RULES[badge.condition];
  if (!rule) return null;
  const { value, target } = rule.evaluate(snapshot, paramsOf(badge));
  return { value, target, deserved: target > 0 ? value >= target : false };
}

/** Le critère, en français, pour la vitrine et l'administration. */
export function conditionText(
  badge: { condition: string; conditionParams?: unknown },
  subjectName?: string,
): string {
  const rule = RULES[badge.condition];
  if (!rule) return "Continue à apprendre !";
  return rule.text(badgeParams(badge.condition, badge.conditionParams), subjectName);
}

// ---------------------------------------------------------------------------
// Construire l'instantané depuis des lignes brutes (pur, testable).
// ---------------------------------------------------------------------------

export type SnapshotAttemptRow = {
  palierAttemptId?: string;
  exerciseId: string;
  attemptNumber: number;
  isCorrect: boolean;
  hintsUsedCount: number;
  timeSpentMs: number;
  submittedAt: number;
};

export type SnapshotInput = {
  attempts: readonly SnapshotAttemptRow[];
  /** Paliers distincts validés. */
  paliersValidated: number;
  topics: readonly {
    topicId: string;
    subjectId: string;
    completed: boolean;
    perfect: boolean;
    started: boolean;
    masteryLevel: number;
  }[];
  subjects: readonly { subjectId: string; name: string; topicCount: number }[];
  streakCurrent: number;
  streakLongest: number;
  questsCompletedTotal: number;
  perfectQuestDays: number;
  /** Décalage horaire en heures pour l'heure locale (Dakar : 0). */
  utcOffsetHours?: number;
};

export function buildSnapshot(input: SnapshotInput): StudentSnapshot {
  const offset = input.utcOffsetHours ?? 0;
  const real = input.attempts.filter((a) => a.attemptNumber > 0).sort((a, b) => a.submittedAt - b.submittedAt);

  // Par exercice joué (dans une tentative de palier) : ses lignes.
  const byExercise = new Map<string, SnapshotAttemptRow[]>();
  for (const a of input.attempts) {
    const key = `${a.palierAttemptId ?? "solo"}:${a.exerciseId}`;
    const rows = byExercise.get(key);
    if (rows) rows.push(a);
    else byExercise.set(key, [a]);
  }
  let correctExercisesTotal = 0;
  let firstTryCorrectTotal = 0;
  let noHintCorrectTotal = 0;
  const correctOnAttempt: number[] = [];
  for (const rows of byExercise.values()) {
    const realRows = rows.filter((a) => a.attemptNumber > 0).sort((a, b) => a.attemptNumber - b.attemptNumber);
    const first = realRows.find((a) => a.isCorrect);
    if (!first) continue;
    correctExercisesTotal += 1;
    correctOnAttempt.push(first.attemptNumber);
    if (first.attemptNumber === 1) firstTryCorrectTotal += 1;
    if (rows.reduce((acc, a) => acc + a.hintsUsedCount, 0) === 0) noHintCorrectTotal += 1;
  }

  const correctReal = real.filter((a) => a.isCorrect);
  const localHour = (ts: number) => (((ts / 3_600_000 + offset) % 24) + 24) % 24;
  const localDay = (ts: number) => new Date(ts + offset * 3_600_000).getUTCDay();

  const subjects: SubjectSnapshot[] = input.subjects.map((subject) => {
    const topics = input.topics.filter((t) => t.subjectId === subject.subjectId);
    const started = topics.filter((t) => t.started);
    return {
      subjectId: subject.subjectId,
      name: subject.name,
      topicCount: subject.topicCount,
      completedTopics: topics.filter((t) => t.completed).length,
      startedTopics: started.length,
      averageMastery: started.length > 0 ? started.reduce((acc, t) => acc + t.masteryLevel, 0) / started.length : 0,
    };
  });

  return {
    correctExercisesTotal,
    attemptsTotal: real.length,
    firstTryCorrectTotal,
    noHintCorrectTotal,
    retrySuccessByMinAttempts: (min) => correctOnAttempt.filter((n) => n >= min).length,
    fastCorrectTotal: (max) => correctReal.filter((a) => a.timeSpentMs > 0 && a.timeSpentMs <= max).length,
    fastCorrectStreak: (max) => {
      let best = 0;
      let run = 0;
      for (const a of real) {
        if (a.isCorrect && a.timeSpentMs > 0 && a.timeSpentMs <= max) run += 1;
        else run = 0;
        if (run > best) best = run;
      }
      return best;
    },
    correctWithinWindow: (windowMs) => {
      let best = 0;
      let start = 0;
      for (let end = 0; end < correctReal.length; end++) {
        while (correctReal[end].submittedAt - correctReal[start].submittedAt > windowMs) start += 1;
        best = Math.max(best, end - start + 1);
      }
      return best;
    },
    weekendCorrectTotal: correctReal.filter((a) => {
      const day = localDay(a.submittedAt);
      return day === 0 || day === 6;
    }).length,
    attemptsBeforeHour: (hour) => real.filter((a) => localHour(a.submittedAt) < hour).length,
    attemptsFromHour: (hour) => real.filter((a) => localHour(a.submittedAt) >= hour).length,
    paliersValidated: input.paliersValidated,
    completedTopics: input.topics.filter((t) => t.completed).length,
    perfectTopics: input.topics.filter((t) => t.completed && t.perfect).length,
    subjects,
    streakCurrent: input.streakCurrent,
    streakLongest: input.streakLongest,
    questsCompletedTotal: input.questsCompletedTotal,
    perfectQuestDays: input.perfectQuestDays,
  };
}
