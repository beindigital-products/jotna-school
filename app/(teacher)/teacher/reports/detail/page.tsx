"use client";

import { Suspense, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Star,
  Mail,
  Calendar,
} from "lucide-react";

function TeacherReportDetailPageInner() {
  const searchParams = useSearchParams();
  const studentId = searchParams.get("studentId") ?? "";
  const topicId = searchParams.get("topicId") ?? "";
  const sid = studentId as Id<"profiles">;

  const router = useRouter();
  const profile = useQuery(api.profiles.getCurrentProfile);
  const teacherStudents = useQuery(api.profiles.getTeacherStudents);
  const reports = useQuery(api.reports.listByStudent, { studentId: sid });

  useEffect(() => {
    if (profile === undefined || teacherStudents === undefined) return;
    if (!profile) return;
    if (profile.role === "admin") return;
    const linked = teacherStudents.some((s) => s._id === sid);
    if (!linked) {
      router.replace("/teacher/students");
    }
  }, [profile, teacherStudents, sid, router]);

  const report = reports?.find((r) => r.topicId === topicId);

  if (reports === undefined || profile === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="space-y-4">
        <Link
          href={`/teacher/students/detail?id=${sid}`}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à l&apos;élève
        </Link>
        <div className="rounded-xl border-2 border-dashed border-gray-300 p-8 text-center">
          <p className="text-gray-500">
            Aucun rapport trouvé pour cette thématique.
          </p>
        </div>
      </div>
    );
  }

  const scorePercent = Math.round(report.score * 100);
  const stars = scorePercent >= 80 ? 3 : scorePercent >= 50 ? 2 : 1;
  const scoreColor =
    scorePercent >= 80
      ? "text-green-600"
      : scorePercent >= 50
        ? "text-amber-600"
        : "text-red-600";

  const reportDate = report._creationTime
    ? new Date(report._creationTime).toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href={`/teacher/students/detail?id=${sid}`}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à l&apos;élève
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-gray-900">
          Rapport détaillé
        </h1>
        <p className="mt-1 text-gray-500">
          {report.subjectName} — {report.topicName}
        </p>
      </div>

      {/* Score */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
        <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
          Score
        </p>
        <p className={`mt-2 text-5xl font-bold ${scoreColor}`}>
          {scorePercent}%
        </p>
        <div className="mt-3 flex justify-center gap-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <Star
              key={i}
              className={`h-7 w-7 ${
                i < stars
                  ? "fill-amber-400 text-amber-400"
                  : "text-gray-200"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          Points forts
        </h2>
        {report.strengths.length > 0 ? (
          <ul className="space-y-2">
            {report.strengths.map((s, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-green-700"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-400" />
                {s}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-400">
            Aucun point fort identifié pour le moment.
          </p>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          Points à améliorer
        </h2>
        {report.weaknesses.length > 0 ? (
          <ul className="space-y-2">
            {report.weaknesses.map((w, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-amber-700"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                {w}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-400">Aucune difficulté identifiée.</p>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
          <XCircle className="h-5 w-5 text-red-500" />
          Erreurs fréquentes
        </h2>
        {report.frequentMistakes.length > 0 ? (
          <ul className="space-y-2">
            {report.frequentMistakes.map((m, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-red-700"
              >
                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                <span className="italic">&laquo; {m} &raquo;</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-400">Aucune erreur fréquente.</p>
        )}
      </div>

      <div className="flex flex-wrap gap-4 rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-600 shadow-sm">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span>Date : {reportDate}</span>
        </div>
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-gray-400" />
          <span>
            E-mail :{" "}
            {report.emailSentAt ? (
              <span className="text-green-600">
                Envoyé le{" "}
                {new Date(report.emailSentAt).toLocaleDateString("fr-FR")}
              </span>
            ) : (
              <span className="text-gray-400">Non envoyé</span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function TeacherReportDetailPage() {
  return (
    <Suspense fallback={null}>
      <TeacherReportDetailPageInner />
    </Suspense>
  );
}
