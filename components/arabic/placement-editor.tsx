"use client";

/**
 * L'ÉDITEUR DE PLACEMENT — partagé par la fiche d'école et l'espace professeur.
 *
 * DEUX ÉCRANS, UN SEUL COMPOSANT, et ce n'est pas une économie de lignes :
 * c'est la seule façon de garantir qu'un directeur et un professeur voient le
 * MÊME avertissement (« placer ouvre, ne valide pas »), les mêmes libellés de
 * niveau et la même comparaison entre ce qui est déclaré et ce qui est fait.
 * Deux copies auraient fini par en dire deux choses, et c'est la phrase du
 * milieu qu'on aurait perdue.
 *
 * CHAQUE LIGNE PORTE SON ÉCOLE. La fiche d'école n'en a qu'une, l'espace
 * professeur peut en servir deux — un enseignant rattaché à deux écoles a des
 * élèves des deux. Demander l'école au composant plutôt qu'à chaque ligne
 * aurait obligé l'écran professeur à trancher pour lui.
 *
 * LA PROGRESSION RÉELLE N'EST LUE QUE LIGNE OUVERTE. La charger pour trois
 * cents élèves ferait d'un tableau de bord une souscription qui se
 * réinvalide à chaque exercice fait en classe ; ce qui est déclaré tient en
 * deux lectures indexées, ce qui est fait se demande élève par élève.
 */

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Loader2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import {
  PLACEMENT_LEVELS,
  type PlacementLevel,
} from "@/convex/arabic/progressRules";
import { refusalMessage } from "@/lib/refusalMessage";

/** Une ligne, quelle que soit la requête qui l'a produite. */
export interface PlacementStudent {
  studentId: Id<"profiles">;
  schoolId: Doc<"schools">["_id"];
  name: string;
  level: PlacementLevel | null;
  startLessonKey: string | null;
  surahKey: string | null;
}

export interface PlacementCatalog {
  lessons: { key: string; title: string; order: number }[];
  surahs: { key: string; nameFr: string; ayahCount: number }[];
}

export function ArabicPlacementList({
  students,
  options,
  truncated = false,
}: {
  students: readonly PlacementStudent[];
  options: PlacementCatalog;
  truncated?: boolean;
}) {
  const [open, setOpen] = useState<Id<"profiles"> | null>(null);

  if (students.length === 0) {
    return <p className="text-sm text-gray-500">Aucun élève pour le moment.</p>;
  }

  return (
    <>
      {truncated && (
        <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-2 text-sm text-amber-800">
          La liste est partielle : seuls les premiers élèves sont affichés.
        </p>
      )}
      <ul className="divide-y divide-gray-100">
        {students.map((student) => (
          <PlacementRow
            key={student.studentId}
            student={student}
            options={options}
            open={open === student.studentId}
            onToggle={() =>
              setOpen((current) =>
                current === student.studentId ? null : student.studentId,
              )
            }
          />
        ))}
      </ul>
    </>
  );
}

/** La phrase qui dit, partout pareil, ce que placer fait et ne fait pas. */
export const PLACEMENT_NOTICE =
  "Indiquez où chaque élève en est : le parcours s'ouvre jusque-là au lieu de recommencer à l'alphabet.";

function PlacementRow({
  student,
  options,
  open,
  onToggle,
}: {
  student: PlacementStudent;
  options: PlacementCatalog;
  open: boolean;
  onToggle: () => void;
}) {
  const setForStudent = useMutation(api.arabic.placement.setForStudent);
  const clearForStudent = useMutation(api.arabic.placement.clearForStudent);
  const progress = useQuery(
    api.arabic.placement.getStudentProgress,
    open
      ? { studentId: student.studentId, schoolId: student.schoolId }
      : "skip",
  );

  const [level, setLevel] = useState<PlacementLevel>(
    student.level ?? "debutant",
  );
  const [lessonKey, setLessonKey] = useState(student.startLessonKey ?? "");
  const [surahKey, setSurahKey] = useState(student.surahKey ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const run = async (action: () => Promise<unknown>, fallback: string) => {
    setPending(true);
    setError(null);
    setSaved(false);
    try {
      await action();
      setSaved(true);
    } catch (err) {
      setError(refusalMessage(err, fallback));
    } finally {
      setPending(false);
    }
  };

  const currentLabel = student.level
    ? (PLACEMENT_LEVELS.find((entry) => entry.key === student.level)?.label ??
      student.level)
    : "Non placé — commence à l'alphabet";

  return (
    <li className="py-3">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <span className="min-w-0">
          <span className="block truncate font-medium text-gray-900">
            {student.name}
          </span>
          <span className="block text-sm text-gray-500">{currentLabel}</span>
        </span>
        <span className="shrink-0 text-sm font-medium text-indigo-600">
          {open ? "Fermer" : "Modifier"}
        </span>
      </button>

      {open && (
        <div className="mt-3 space-y-3 rounded-lg bg-gray-50 p-3">
          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-700">
              {error}
            </p>
          )}
          {saved && !error && (
            <p className="rounded-lg border border-green-200 bg-green-50 p-2 text-sm text-green-700">
              Enregistré.
            </p>
          )}

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-gray-700">
                Niveau
              </span>
              <select
                value={level}
                onChange={(event) =>
                  setLevel(event.target.value as PlacementLevel)
                }
                className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
              >
                {PLACEMENT_LEVELS.map((entry) => (
                  <option key={entry.key} value={entry.key}>
                    {entry.label}
                  </option>
                ))}
              </select>
              <span className="mt-1 block text-xs text-gray-500">
                {PLACEMENT_LEVELS.find((entry) => entry.key === level)?.hint}
              </span>
            </label>

            <label className="block text-sm">
              <span className="mb-1 block font-medium text-gray-700">
                Leçon où il s&apos;est arrêté
              </span>
              <select
                value={lessonKey}
                onChange={(event) => setLessonKey(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
              >
                <option value="">— non précisé —</option>
                {options.lessons.map((lesson) => (
                  <option key={lesson.key} value={lesson.key}>
                    {lesson.order}. {lesson.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className="mb-1 block font-medium text-gray-700">
                Sourate en cours
              </span>
              <select
                value={surahKey}
                onChange={(event) => setSurahKey(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
              >
                <option value="">— non précisé —</option>
                {options.surahs.map((surah) => (
                  <option key={surah.key} value={surah.key}>
                    {surah.nameFr} ({surah.ayahCount} versets)
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-3 text-sm">
            <p className="mb-1 font-medium text-gray-700">
              Ce que l&apos;élève a réellement fait
            </p>
            {progress === undefined ? (
              <span className="flex items-center gap-2 text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Chargement...
              </span>
            ) : !progress.found ? (
              <span className="text-gray-500">Aucune donnée.</span>
            ) : (
              <ul className="space-y-0.5 text-gray-600">
                <li>
                  {progress.completedCount} leçon
                  {progress.completedCount > 1 ? "s" : ""} terminée
                  {progress.completedCount > 1 ? "s" : ""}
                  {progress.lastCompleted &&
                    ` · la plus avancée : ${progress.lastCompleted.title}`}
                </li>
                <li>
                  {progress.memorized.length === 0
                    ? "Aucune sourate en mémorisation."
                    : progress.memorized
                        .map(
                          (entry) =>
                            `${entry.nameFr} : ${entry.verses} verset${entry.verses > 1 ? "s" : ""}`,
                        )
                        .join(" · ")}
                </li>
              </ul>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                run(
                  () =>
                    setForStudent({
                      schoolId: student.schoolId,
                      studentId: student.studentId,
                      level,
                      ...(lessonKey ? { startLessonKey: lessonKey } : {}),
                      ...(surahKey ? { surahKey } : {}),
                    }),
                  "Impossible d'enregistrer ce placement",
                )
              }
              disabled={pending}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              Enregistrer
            </button>
            {student.level && (
              <button
                type="button"
                onClick={() =>
                  run(async () => {
                    await clearForStudent({
                      schoolId: student.schoolId,
                      studentId: student.studentId,
                    });
                    setLevel("debutant");
                    setLessonKey("");
                    setSurahKey("");
                  }, "Impossible de retirer ce placement")
                }
                disabled={pending}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Retirer le placement
              </button>
            )}
          </div>
        </div>
      )}
    </li>
  );
}
