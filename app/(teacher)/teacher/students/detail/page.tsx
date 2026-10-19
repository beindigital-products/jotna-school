"use client";

import { Suspense, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  UserCircle,
  BookOpen,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Clock,
} from "lucide-react";

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function TeacherStudentDetailPageInner() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";
  const studentId = id as Id<"profiles">;
  const router = useRouter();

  const profile = useQuery(api.profiles.getCurrentProfile);
  const teacherStudents = useQuery(api.profiles.getTeacherStudents);
  const stats = useQuery(api.students.getStudentStats, { studentId });
  const detail = useQuery(api.students.getStudentDetail, { studentId });
  const reports = useQuery(api.reports.listByStudent, { studentId });

  // Guard: make sure this teacher is linked to this student
  useEffect(() => {
    if (profile === undefined || teacherStudents === undefined) return;
    if (!profile) return;
    if (profile.role === "admin") return; // admin can view everything
    const linked = teacherStudents.some((s) => s._id === studentId);
    if (!linked) {
      router.replace("/teacher/students");
    }
  }, [profile, teacherStudents, studentId, router]);

  if (profile === undefined || stats === undefined || detail === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  if (!detail || !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <UserCircle className="h-12 w-12 text-gray-300" />
        <p className="mt-3 text-gray-500">Élève introuvable</p>
        <Link
          href="/teacher/students"
          className="mt-4 inline-flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700"
        >
          <ArrowLeft className="h-4 w-4" /> Retour
        </Link>
      </div>
    );
  }

  const student = detail.student;
  const correctRate =
    stats.totalExercises > 0
      ? Math.round(
          (detail.recentAttempts.filter((a) => a.isCorrect).length /
            Math.max(detail.recentAttempts.length, 1)) *
            100,
        )
      : 0;

  const totalTimeMin = Math.round(stats.totalTimeMs / 60000);

  return (
    <div className="space-y-6">
      <Link
        href="/teacher/students"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Mes élèves
      </Link>

      {/* Header */}
      <div className="flex items-center gap-4">
        {student.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={student.avatar}
            alt={student.name}
            className="h-14 w-14 rounded-full object-cover"
          />
        ) : (
          <UserCircle className="h-14 w-14 text-gray-300" />
        )}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{student.name}</h1>
          <p className="text-sm text-gray-500">Profil élève</p>
        </div>
      </div>

      {/* Stats */}
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <BookOpen className="h-4 w-4 text-emerald-600" />
            Exercices faits
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {stats.totalExercises}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            Taux de réussite
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {correctRate}%
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="h-4 w-4 text-emerald-600" />
            Temps passé
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {totalTimeMin} min
          </p>
        </div>
      </section>

      {/* Topic progress */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-900">
          Progression par matière
        </h2>
        {detail.subjectProgress.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
            Aucune progression enregistrée.
          </div>
        ) : (
          <div className="space-y-3">
            {detail.subjectProgress.map((sp) => {
              const pct =
                sp.totalTopics > 0
                  ? Math.round((sp.completedTopics / sp.totalTopics) * 100)
                  : 0;
              return (
                <div
                  key={sp.subjectId}
                  className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">
                      {sp.subjectName}
                    </span>
                    <span className="text-sm font-semibold text-emerald-600">
                      {pct}%
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {sp.completedTopics}/{sp.totalTopics} thématiques &middot;{" "}
                    {sp.correctExercises}/{sp.totalExercises} exercices
                    corrects
                  </p>
                  <div className="mt-2 h-2 rounded-full bg-gray-100">
                    <div
                      className="h-2 rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Reports */}
      {reports && reports.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-gray-900">
            Rapports par thématique
          </h2>
          <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white shadow-sm">
            {reports.map((r) => (
              <Link
                key={r._id}
                href={`/teacher/reports/detail?studentId=${studentId}&topicId=${r.topicId}`}
                className="flex items-center justify-between px-4 py-3 text-sm hover:bg-gray-50"
              >
                <div>
                  <p className="font-medium text-gray-900">{r.topicName}</p>
                  <p className="text-xs text-gray-500">{r.subjectName}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-emerald-600">
                    {Math.round(r.score * 100)}%
                  </span>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recent attempts */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-900">
          Tentatives récentes
        </h2>
        {detail.recentAttempts.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
            Aucune tentative pour le moment.
          </div>
        ) : (
          <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white shadow-sm">
            {detail.recentAttempts.map((a) => (
              <div
                key={a._id}
                className="flex items-start gap-3 px-4 py-3 text-sm"
              >
                {a.isCorrect ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
                ) : (
                  <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium text-gray-900">
                    {a.exercisePrompt || "—"}
                  </p>
                  <p className="text-xs text-gray-500">{a.topicName}</p>
                </div>
                <span className="shrink-0 text-xs text-gray-400">
                  {formatDate(a.submittedAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default function TeacherStudentDetailPage() {
  return (
    <Suspense fallback={null}>
      <TeacherStudentDetailPageInner />
    </Suspense>
  );
}
