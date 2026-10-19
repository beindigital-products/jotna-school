"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Award,
  BookCheck,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";

function StudentDetailPageInner() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";
  const data = useQuery(api.students.getStudentDetail, {
    studentId: id as Id<"profiles">,
  });

  if (data === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <span className="ml-3 text-gray-500">Chargement...</span>
      </div>
    );
  }

  if (data === null) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-xl font-semibold text-gray-900">
          Élève introuvable
        </h2>
        <Link
          href="/admin/eleves"
          className="mt-4 inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux élèves
        </Link>
      </div>
    );
  }

  const { student, subjectProgress, earnedBadges, recentAttempts } = data;

  return (
    <div>
      {/* Back link */}
      <Link
        href="/admin/eleves"
        className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux élèves
      </Link>

      {/* Student header */}
      <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 text-xl font-bold text-white">
            {student.name
              .split(" ")
              .map((w: string) => w[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{student.name}</h1>
            <p className="mt-1 text-sm text-gray-500">
              Rôle : {student.role === "student" ? "Élève" : student.role}
            </p>
          </div>
        </div>
      </div>

      {/* Progress by subject */}
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-bold text-gray-900">
          Progression par matière
        </h2>
        {subjectProgress.length === 0 ? (
          <p className="text-sm text-gray-500">Aucune progression enregistrée.</p>
        ) : (
          <div className="space-y-4">
            {subjectProgress.map((sp) => {
              const pct =
                sp.totalTopics > 0
                  ? Math.round((sp.completedTopics / sp.totalTopics) * 100)
                  : 0;
              return (
                <div
                  key={sp.subjectId}
                  className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">
                      {sp.subjectName}
                    </h3>
                    <span className="text-sm text-gray-500">
                      {sp.completedTopics}/{sp.totalTopics} thèmes &middot;{" "}
                      {sp.correctExercises}/{sp.totalExercises} exercices
                      corrects
                    </span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: sp.subjectColor,
                      }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-400">{pct}% complété</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Earned badges */}
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-bold text-gray-900 flex items-center gap-2">
          <Award className="h-5 w-5 text-yellow-500" />
          Badges obtenus ({earnedBadges.length})
        </h2>
        {earnedBadges.length === 0 ? (
          <p className="text-sm text-gray-500">Aucun badge obtenu pour le moment.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {earnedBadges.map((eb) => (
              <div
                key={eb._id}
                className="flex flex-col items-center rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-center"
              >
                <span className="text-3xl">{eb.badge.icon}</span>
                <p className="mt-2 text-sm font-medium text-gray-900">
                  {eb.badge.name}
                </p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {new Date(eb.earnedAt).toLocaleDateString("fr-FR")}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent attempts */}
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-bold text-gray-900 flex items-center gap-2">
          <Clock className="h-5 w-5 text-gray-400" />
          Activité récente
        </h2>
        {recentAttempts.length === 0 ? (
          <p className="text-sm text-gray-500">Aucune activité récente.</p>
        ) : (
          <div className="space-y-2">
            {recentAttempts.map((attempt) => (
              <div
                key={attempt._id}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  {attempt.isCorrect ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-400" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                      {attempt.exercisePrompt}
                    </p>
                    <p className="text-xs text-gray-500">
                      {attempt.topicName} &middot; {attempt.exerciseType} &middot;
                      Tentative {attempt.attemptNumber}
                    </p>
                  </div>
                </div>
                <div className="text-right text-xs text-gray-400">
                  <p>
                    {new Date(attempt.submittedAt).toLocaleDateString("fr-FR")}
                  </p>
                  <p>
                    {Math.round(attempt.timeSpentMs / 1000)}s &middot;{" "}
                    {attempt.hintsUsedCount} indice
                    {attempt.hintsUsedCount !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Link to topic reports */}
      <div className="flex items-center gap-3">
        <BookCheck className="h-5 w-5 text-indigo-500" />
        <span className="text-sm text-gray-500">
          Consultez les rapports détaillés dans la section Matières pour chaque
          thème.
        </span>
      </div>
    </div>
  );
}

export default function StudentDetailPage() {
  return (
    <Suspense fallback={null}>
      <StudentDetailPageInner />
    </Suspense>
  );
}
