"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import {
  UserCircle,
  Users,
  BookOpen,
  ArrowRight,
  GraduationCap,
  Loader2,
} from "lucide-react";
import {
  ArabicPlacementList,
  PLACEMENT_NOTICE,
} from "@/components/arabic/placement-editor";

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
          Tous les élèves de vos classes.
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
            Aucun élève pour le moment. Ajoutez vos élèves depuis une de vos
            classes.
          </p>
          <Link
            href="/teacher/classes"
            className="mt-4 inline-block rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Mes classes
          </Link>
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

      <ArabicPlacementSection />
    </div>
  );
}

/**
 * LE PLACEMENT EN ARABE, pour les élèves de ce professeur.
 *
 * NE S'AFFICHE QUE SI SON ÉCOLE A ALLUMÉ LE MODULE. `modules.getMine` répond
 * pour le personnel comme pour les élèves — allumé dès qu'UNE des écoles du
 * professeur l'a allumé — donc un enseignant dont aucune école n'enseigne
 * l'arabe ne voit rien, pas même un bloc vide.
 *
 * LE PROFESSEUR PLACE SES ÉLÈVES, PAS CEUX DE L'ÉCOLE. `listForTeacher` les
 * résout par ses classes (`schoolClasses.teacherId`), la même arête que « Mes
 * élèves » juste au-dessus : les deux listes disent donc toujours la même
 * chose, et la garde du serveur (`placementRules.mayPlaceStudent`) vérifie le
 * même lien à l'écriture.
 */
function ArabicPlacementSection() {
  const modules = useQuery(api.modules.getMine);
  const roster = useQuery(api.arabic.placement.listForTeacher);
  const options = useQuery(api.arabic.placement.options);

  const enabled = modules?.some(
    (module_) => module_.key === "arabe_coran" && module_.enabled,
  );
  if (!enabled) return null;

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-1 flex items-center gap-2">
        <GraduationCap className="h-5 w-5 text-gray-400" />
        <h2 className="font-semibold text-gray-900">
          Niveau de mes élèves en arabe
        </h2>
      </div>
      <p className="mb-4 text-sm text-gray-500">
        {PLACEMENT_NOTICE} Placer un élève <strong>ouvre</strong> des leçons, ne
        les valide pas — il garde ses étoiles à gagner, et peut revenir en
        arrière tout seul si vous le placez trop haut.
      </p>

      {roster === undefined || options === undefined ? (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Chargement...
        </div>
      ) : (
        <ArabicPlacementList students={roster.students} options={options} />
      )}
    </section>
  );
}
