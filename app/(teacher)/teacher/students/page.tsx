"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { UserCircle, Users, BookOpen, ArrowRight } from "lucide-react";

export default function TeacherStudentsPage() {
  const profile = useQuery(api.profiles.getCurrentProfile);
  const students = useQuery(api.profiles.getTeacherStudents);

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
        <h1 className="text-2xl font-bold text-gray-900">Mes élèves</h1>
        <p className="mt-1 text-sm text-gray-500">
          Les élèves qui vous sont associés comme professeur.
        </p>
      </div>

      {students === undefined ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
        </div>
      ) : students.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-300 p-8 text-center">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">
            Aucun élève associé pour le moment.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {students.map((student) => (
            <div
              key={student._id}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                {student.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={student.avatar}
                    alt={student.name}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <UserCircle className="h-12 w-12 text-gray-300" />
                )}
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {student.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {student.completedTopics} thématique
                    {student.completedTopics !== 1 ? "s" : ""} terminée
                    {student.completedTopics !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-emerald-50 p-3 text-center">
                  <BookOpen className="mx-auto h-5 w-5 text-emerald-600" />
                  <p className="mt-1 text-lg font-bold text-emerald-700">
                    {student.completedExercises}
                  </p>
                  <p className="text-xs text-emerald-600">Exercices</p>
                </div>
                <div className="rounded-lg bg-amber-50 p-3 text-center">
                  <Users className="mx-auto h-5 w-5 text-amber-600" />
                  <p className="mt-1 text-lg font-bold text-amber-700">
                    {student.completedTopics}
                  </p>
                  <p className="text-xs text-amber-600">Thématiques</p>
                </div>
              </div>

              <Link
                href={`/teacher/students/detail?id=${student._id}`}
                className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                Voir le détail
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
