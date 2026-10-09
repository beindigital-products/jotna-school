"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import {
  UserCircle,
  Users,
  PenTool,
  FileText,
  FileBarChart,
  Plus,
  CheckCircle2,
  XCircle,
} from "lucide-react";

/**
 * Accès libre : un professeur qui vient de s'inscrire n'a ni classe ni élève.
 * Cet encart lui donne la première étape, puis disparaît.
 */
function GettingStarted() {
  const data = useQuery(api.classrooms.myClasses);
  if (!data || data.classes.length > 0) return null;
  return (
    <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
      <h2 className="font-semibold text-amber-900">Première étape : créez votre classe</h2>
      <p className="mt-1 text-sm text-amber-900/80">
        Ensuite, créez les comptes de vos élèves ou ajoutez-les avec le code
        élève que vous donnent leurs parents. Chaque élève se connecte dans
        l&apos;application avec son code.
      </p>
      <Link
        href="/teacher/classes"
        className="mt-3 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
      >
        <Plus className="h-4 w-4" />
        Créer une classe
      </Link>
    </section>
  );
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TeacherDashboardPage() {
  const profile = useQuery(api.profiles.getCurrentProfile);
  const students = useQuery(api.profiles.getTeacherStudents);
  const exercises = useQuery(api.exercises.listByTeacher);
  const uploads = useQuery(api.pdfUploads.listByTeacher);
  const reports = useQuery(api.reports.listByTeacher);
  const recentAttempts = useQuery(api.attempts.listByTeacherStudents, {
    limit: 5,
  });

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
        <h2 className="mt-3 text-lg font-semibold text-gray-900">
          Vous n&apos;êtes pas connecté
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Connectez-vous pour accéder à votre tableau de bord.
        </p>
        <Link
          href="/login"
          className="mt-4 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Se connecter
        </Link>
      </div>
    );
  }

  const publishedCount =
    exercises?.filter((e) => e.status === "published").length ?? 0;

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Bonjour, {profile.name} !
        </h1>
        <p className="mt-1 text-gray-500">
          Gérez vos exercices, vos élèves et consultez leurs résultats.
        </p>
      </div>

      <GettingStarted />

      {/* Stats cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <PenTool className="h-4 w-4 text-emerald-600" />
            Exercices publiés
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {exercises === undefined ? "—" : publishedCount}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Users className="h-4 w-4 text-emerald-600" />
            Mes élèves
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {students === undefined ? "—" : students.length}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <FileBarChart className="h-4 w-4 text-emerald-600" />
            Rapports générés
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {reports === undefined ? "—" : reports.length}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <FileText className="h-4 w-4 text-emerald-600" />
            PDFs importés
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {uploads === undefined ? "—" : uploads.length}
          </p>
        </div>
      </section>

      {/* Quick actions */}
      <section className="flex flex-wrap gap-3">
        <Link
          href="/teacher/pdf-uploads"
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          Ajouter un PDF
        </Link>
        <Link
          href="/teacher/exercises"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <PenTool className="h-4 w-4" />
          Créer un exercice
        </Link>
        <Link
          href="/teacher/students"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <Users className="h-4 w-4" />
          Voir mes élèves
        </Link>
      </section>

      {/* Recent activity */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Activité récente
        </h2>
        {recentAttempts === undefined ? (
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-400">
            Chargement...
          </div>
        ) : recentAttempts.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-gray-300 p-8 text-center">
            <p className="text-sm text-gray-500">
              Aucune activité récente pour le moment.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white shadow-sm">
            {recentAttempts.map((a) => (
              <div
                key={a._id}
                className="flex items-start gap-3 px-5 py-3 text-sm"
              >
                {a.isCorrect ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
                ) : (
                  <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium text-gray-900">
                    {a.studentName}
                  </p>
                  <p className="truncate text-gray-500">
                    {a.topicName} — {a.exercisePrompt}
                  </p>
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
