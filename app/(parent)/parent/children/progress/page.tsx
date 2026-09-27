"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import {
  ArrowLeft,
  UserCircle,
  BookOpen,
  CheckCircle2,
  Clock,
  Lock,
  ChevronRight,
} from "lucide-react";

function ChildProgressPageInner() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";
  const childId = id as Id<"profiles">;

  return <ProgressContent childId={childId} />;
}

function ProgressContent({ childId }: { childId: Id<"profiles"> }) {
  // Fetch child profile (using getStudentProfile via direct DB query not available
  // from client, use getCurrentProfile pattern)
  const subjects = useQuery(api.subjects.list);
  const topics = useQuery(api.topics.listAll);
  const reports = useQuery(api.reports.listByStudent, { studentId: childId });

  if (!subjects || !topics) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
      </div>
    );
  }

  // Build a map of completed topic IDs
  const completedTopicIds = new Set(
    (reports ?? []).map((r) => r.topicId as string),
  );

  // Build a map of reports by topicId
  const reportsByTopic = new Map(
    (reports ?? []).map((r) => [r.topicId as string, r]),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/parent/dashboard"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Tableau de bord
        </Link>
        <div className="mt-3 flex items-center gap-3">
          <UserCircle className="h-10 w-10 text-gray-300" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Progression
            </h1>
            <p className="text-sm text-gray-500">
              Détail par matière et thématique
            </p>
          </div>
        </div>
      </div>

      {/* Subjects list */}
      {subjects.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-300 p-8 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">
            Aucune matière disponible.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {subjects.map((subject) => {
            const subjectTopics = topics.filter(
              (t) => t.subjectId === subject._id,
            );
            const completedCount = subjectTopics.filter((t) =>
              completedTopicIds.has(t._id as string),
            ).length;
            const progressPercent =
              subjectTopics.length > 0
                ? Math.round((completedCount / subjectTopics.length) * 100)
                : 0;

            return (
              <div
                key={subject._id}
                className="rounded-xl border border-gray-200 bg-white shadow-sm"
              >
                {/* Subject header */}
                <div className="border-b border-gray-100 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{subject.icon}</span>
                      <div>
                        <h2 className="font-semibold text-gray-900">
                          {subject.name}
                        </h2>
                        <p className="text-sm text-gray-500">
                          {completedCount}/{subjectTopics.length} thématiques
                          terminées
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-teal-600">
                      {progressPercent}%
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-3 h-2 rounded-full bg-gray-100">
                    <div
                      className="h-2 rounded-full bg-teal-500 transition-all"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Topics list */}
                <div className="divide-y divide-gray-50">
                  {subjectTopics.length === 0 ? (
                    <p className="p-4 text-sm text-gray-400">
                      Aucune thématique dans cette matière.
                    </p>
                  ) : (
                    subjectTopics.map((topic, idx) => {
                      const isCompleted = completedTopicIds.has(
                        topic._id as string,
                      );
                      const report = reportsByTopic.get(topic._id as string);
                      const scorePercent = report
                        ? Math.round(report.score * 100)
                        : null;

                      return (
                        <div
                          key={topic._id}
                          className="flex items-center justify-between px-4 py-3"
                        >
                          <div className="flex items-center gap-3">
                            {isCompleted ? (
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            ) : idx === 0 ||
                              completedTopicIds.has(
                                subjectTopics[idx - 1]?._id as string,
                              ) ? (
                              <Clock className="h-5 w-5 text-amber-500" />
                            ) : (
                              <Lock className="h-5 w-5 text-gray-300" />
                            )}
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {topic.name}
                              </p>
                              {scorePercent !== null && (
                                <p className="text-xs text-gray-500">
                                  Score : {scorePercent}%
                                </p>
                              )}
                            </div>
                          </div>

                          {isCompleted && report && (
                            <Link
                              href={`/parent/children/reports?id=${childId}&topicId=${topic._id}`}
                              className="flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700"
                            >
                              Rapport
                              <ChevronRight className="h-4 w-4" />
                            </Link>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ChildProgressPage() {
  return (
    <Suspense fallback={null}>
      <ChildProgressPageInner />
    </Suspense>
  );
}
