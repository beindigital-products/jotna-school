"use client";

/**
 * LA FICHE D'UN ÉLÈVE, vue par un adulte : son parent ou son professeur.
 *
 * Les deux espaces lisent les mêmes requêtes (`students.getStudentStats`,
 * `students.getStudentDetail`, `reports.listByStudent`), que le serveur ne
 * rend qu'à un tuteur de l'enfant ou au professeur de sa classe. Hors de
 * portée, elles rendent `null` : la fiche dit « introuvable », sans plus.
 */

import { useQuery } from "convex/react";
import {
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  Target,
  UserRound,
  XCircle,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  Avatar,
  Card,
  EmptyState,
  LoadingBlock,
  PageHeader,
  ProgressBar,
  SectionTitle,
  StatCard,
  formatDayTime,
} from "./ui";
import { ReportList, type ReportRow } from "./report-views";

/** « 45 min », « 2 h 05 ». */
export function formatDuration(ms: number): string {
  const minutes = Math.max(0, Math.round(ms / 60000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `${hours} h ${String(minutes % 60).padStart(2, "0")}`;
}

export function StudentOverview({
  studentId,
  back,
  reportHref,
}: {
  studentId: string | null;
  back: { href: string; label: string };
  reportHref: (report: ReportRow) => string;
}) {
  const args = studentId ? { studentId: studentId as Id<"profiles"> } : "skip";
  const stats = useQuery(api.students.getStudentStats, args);
  const detail = useQuery(api.students.getStudentDetail, args);
  const reports = useQuery(api.reports.listByStudent, args);

  if (studentId && (stats === undefined || detail === undefined)) {
    return <LoadingBlock />;
  }

  if (!stats || !detail) {
    return (
      <div className="space-y-6">
        <PageHeader title="Élève" back={back} />
        <EmptyState
          icon={UserRound}
          title="Élève introuvable"
          description="Cette fiche n'existe pas, ou vous n'y avez pas accès."
        />
      </div>
    );
  }

  const student = detail.student;
  const answered = detail.subjectProgress.reduce(
    (sum, subject) => sum + subject.totalExercises,
    0,
  );
  const correct = detail.subjectProgress.reduce(
    (sum, subject) => sum + subject.correctExercises,
    0,
  );
  const successRate = answered > 0 ? Math.round((correct / answered) * 100) : null;

  return (
    <div className="space-y-8">
      <PageHeader
        back={back}
        title={
          <span className="flex items-center gap-3">
            <Avatar name={student.name} src={student.avatar} size="lg" />
            <span className="min-w-0 break-words">{student.name}</span>
          </span>
        }
        description={
          [student.class, stats.favoriteSubject && `Matière préférée : ${stats.favoriteSubject}`]
            .filter(Boolean)
            .join(" · ") || undefined
        }
      />

      <section aria-label="Chiffres clés" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={BookOpen} label="Exercices faits" value={stats.totalExercises} />
        <StatCard
          icon={Target}
          label="Réussite"
          value={successRate === null ? "—" : `${successRate} %`}
          hint={successRate === null ? "Pas encore d'exercice" : undefined}
        />
        <StatCard icon={Clock} label="Temps passé" value={formatDuration(stats.totalTimeMs)} />
        <StatCard icon={Award} label="Badges" value={stats.badgeCount} />
      </section>

      <section className="space-y-3">
        <SectionTitle>Progression par matière</SectionTitle>
        {detail.subjectProgress.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="Pas encore de progression"
            description="Elle s'affiche dès le premier exercice fait dans l'application."
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {detail.subjectProgress.map((subject) => {
              const percent =
                subject.totalTopics > 0
                  ? Math.round((subject.completedTopics / subject.totalTopics) * 100)
                  : 0;
              return (
                <Card key={subject.subjectId} className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="min-w-0 truncate font-medium text-stone-900">
                      {subject.subjectName}
                    </span>
                    <span className="shrink-0 text-sm font-semibold tabular-nums text-stone-700">
                      {percent} %
                    </span>
                  </div>
                  <div className="mt-2">
                    <ProgressBar value={percent} label={`Progression en ${subject.subjectName}`} />
                  </div>
                  <p className="mt-2 text-xs text-stone-600">
                    {subject.completedTopics} sur {subject.totalTopics} thématiques
                    terminées · {subject.correctExercises} bonnes réponses sur{" "}
                    {subject.totalExercises}
                  </p>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {detail.earnedBadges.length > 0 && (
        <section className="space-y-3">
          <SectionTitle>Badges gagnés</SectionTitle>
          <ul className="flex flex-wrap gap-2">
            {detail.earnedBadges.map((earned) => (
              <li
                key={earned._id}
                title={earned.badge.description}
                className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-800"
              >
                <span aria-hidden>{earned.badge.icon}</span>
                {earned.badge.name}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-3">
        <SectionTitle>Rapports par thématique</SectionTitle>
        {reports === undefined ? (
          <LoadingBlock />
        ) : (
          <ReportList
            reports={[...reports].sort((a, b) => b._creationTime - a._creationTime)}
            hrefFor={reportHref}
            emptyHint="Un rapport est créé chaque fois qu'une thématique est terminée."
          />
        )}
      </section>

      <section className="space-y-3">
        <SectionTitle>Dernières réponses</SectionTitle>
        {detail.recentAttempts.length === 0 ? (
          <EmptyState icon={Clock} title="Aucune réponse pour le moment" />
        ) : (
          <Card className="overflow-hidden">
            <ul className="divide-y divide-stone-100">
              {detail.recentAttempts.map((attempt) => (
                <li key={attempt._id} className="flex items-start gap-3 px-4 py-3 text-sm">
                  {attempt.isCorrect ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
                  ) : (
                    <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 font-medium text-stone-900">
                      <span className="sr-only">
                        {attempt.isCorrect ? "Bonne réponse : " : "Mauvaise réponse : "}
                      </span>
                      {attempt.exercisePrompt || "Exercice"}
                    </p>
                    <p className="truncate text-xs text-stone-600">
                      {[attempt.topicName, formatDayTime(attempt.submittedAt)]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>
    </div>
  );
}
