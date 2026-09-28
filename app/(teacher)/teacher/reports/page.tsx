"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { FileBarChart, ChevronRight, UserCircle } from "lucide-react";

export default function TeacherReportsPage() {
  const profile = useQuery(api.profiles.getCurrentProfile);
  const reports = useQuery(api.reports.listByTeacher);

  if (profile === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  if (profile === null) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <UserCircle className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-3 text-sm text-gray-500">Non connecté</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Rapports</h1>
        <p className="mt-1 text-sm text-gray-500">
          Les rapports générés pour vos élèves.
        </p>
      </div>

      {reports === undefined ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
        </div>
      ) : reports.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-300 p-8 text-center">
          <FileBarChart className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">
            Aucun rapport disponible pour le moment.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reports.map((r) => {
            const scorePercent = Math.round(r.score * 100);
            const scoreColor =
              scorePercent >= 80
                ? "text-green-600"
                : scorePercent >= 50
                  ? "text-amber-600"
                  : "text-red-600";

            return (
              <Link
                key={r._id}
                href={`/teacher/reports/detail?studentId=${r.studentId}&topicId=${r.topicId}`}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {r.studentName}
                    </p>
                    <p className="text-xs text-gray-500">{r.subjectName}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
                <p className="mt-3 text-sm text-gray-700">{r.topicName}</p>
                <div className="mt-3 flex items-end justify-between">
                  <span className={`text-2xl font-bold ${scoreColor}`}>
                    {scorePercent}%
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(r._creationTime).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
