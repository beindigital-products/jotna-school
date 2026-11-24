"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { ChevronRight, GraduationCap, Search, Users } from "lucide-react";
import { api } from "@/convex/_generated/api";
import {
  ArabicPlacementList,
  PLACEMENT_NOTICE,
} from "@/components/arabic/placement-editor";
import {
  Avatar,
  ButtonLink,
  Card,
  CardTitle,
  EmptyState,
  Input,
  LoadingBlock,
  PageHeader,
  plural,
} from "@/components/dashboard/ui";

export default function TeacherStudentsPage() {
  const students = useQuery(api.profiles.getTeacherStudents);
  const [search, setSearch] = useState("");

  const needle = search.trim().toLocaleLowerCase("fr");
  // Les cours particuliers d'abord, puis école par école, puis par nom.
  const shown = (students ?? [])
    .filter((s) => s.name.toLocaleLowerCase("fr").includes(needle))
    .sort(
      (a, b) =>
        (a.schoolName ?? "").localeCompare(b.schoolName ?? "", "fr") ||
        (a.className ?? "").localeCompare(b.className ?? "", "fr") ||
        a.name.localeCompare(b.name, "fr"),
    );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mes élèves"
        description={
          students && students.length > 0
            ? `${plural(students.length, "élève")} dans vos classes.`
            : "Tous les élèves de vos classes."
        }
      />

      {students === undefined ? (
        <LoadingBlock />
      ) : students.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Aucun élève pour le moment"
          description="Ajoutez vos élèves depuis une de vos classes."
          action={<ButtonLink href="/teacher/classes">Mes classes</ButtonLink>}
        />
      ) : (
        <>
          {students.length > 6 && (
            <div className="relative max-w-sm">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500"
                aria-hidden
              />
              <Input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Chercher un élève"
                aria-label="Chercher un élève par son nom"
                className="pl-9"
              />
            </div>
          )}
          {shown.length === 0 ? (
            <p role="status" className="text-sm text-stone-600">
              Aucun élève ne correspond à « {search.trim()} ».
            </p>
          ) : (
            <Card className="overflow-hidden">
              <ul className="divide-y divide-stone-100">
                {shown.map((student) => (
                  <li key={student._id}>
                    <Link
                      href={`/teacher/students/detail?id=${student._id}`}
                      className="flex min-h-16 items-center gap-3 px-4 py-3 outline-none hover:bg-stone-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-(--dash-strong)"
                    >
                      <Avatar name={student.name} src={student.avatar} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="break-words font-medium text-stone-900">
                          {student.name}
                        </p>
                        <p className="text-sm text-stone-700">
                          {[
                            student.className,
                            student.schoolName ?? "Cours particulier",
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                        <p className="text-sm text-stone-600">
                          {plural(student.completedExercises, "exercice")} ·{" "}
                          {plural(
                            student.completedTopics,
                            "thématique terminée",
                            "thématiques terminées",
                          )}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-stone-400" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </>
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
    <Card as="section" className="p-5">
      <CardTitle icon={GraduationCap}>Niveau de mes élèves en arabe</CardTitle>
      <p className="mb-4 mt-2 text-sm text-stone-600">
        {PLACEMENT_NOTICE} Placer un élève <strong>ouvre</strong> des leçons, ne
        les valide pas : il garde ses étoiles à gagner, et peut revenir en
        arrière tout seul si vous le placez trop haut.
      </p>

      {roster === undefined || options === undefined ? (
        <LoadingBlock />
      ) : (
        <ArabicPlacementList students={roster.students} options={options} />
      )}
    </Card>
  );
}
