"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import {
  Users,
  Loader2,
  Award,
  BookCheck,
  ChevronRight,
} from "lucide-react";

export default function AdminStudentsPage() {
  const students = useQuery(api.students.listStudents);

  if (students === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <span className="ml-3 text-gray-500">Chargement des élèves...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Élèves</h1>
        <p className="mt-1 text-sm text-gray-500">
          Suivez la progression de vos élèves
        </p>
      </div>

      {students.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            Aucun élève
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Les élèves apparaîtront ici une fois inscrits.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {students.map((student) => (
            <Link
              key={student._id}
              href={`/admin/eleves/detail?id=${student._id}`}
              className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-indigo-200"
            >
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 text-sm font-bold text-white">
                  {student.name
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {student.name}
                  </h3>
                  <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <BookCheck className="h-3.5 w-3.5" />
                      {student.completedTopics} thème
                      {student.completedTopics !== 1 ? "s" : ""} complété
                      {student.completedTopics !== 1 ? "s" : ""}
                    </span>
                    <span className="flex items-center gap-1">
                      <Award className="h-3.5 w-3.5" />
                      {student.badgeCount} badge
                      {student.badgeCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
