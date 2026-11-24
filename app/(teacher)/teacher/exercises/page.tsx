"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import { useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FileText,
  Pencil,
  PencilLine,
  Plus,
  Trash2,
} from "lucide-react";
import {
  ButtonLink,
  Card,
  ConfirmAction,
  EmptyState,
  LoadingBlock,
  PageHeader,
  plural,
} from "@/components/dashboard/ui";
import { cn } from "@/lib/utils";

const TYPE_LABELS: Record<string, string> = {
  qcm: "QCM",
  "drag-drop": "Glisser-déposer",
  match: "Associer",
  order: "Ordonner",
  "short-answer": "Réponse courte",
  "fill-blank": "Phrase à trous",
  pattern: "Frise",
  "pixel-art": "Dessin",
  listen: "Écoute",
  "color-mix": "Couleurs",
};

type TeacherExercise = {
  _id: string;
  type: string;
  prompt: string;
  status: "draft" | "published";
  version: number;
  topicId: string;
  topicName: string;
  subjectId?: string;
  subjectName: string;
};

type SubjectGroup = {
  subjectName: string;
  topics: Record<string, { topicName: string; items: TeacherExercise[] }>;
};

/** Le statut, en mots et avec une icône : la couleur seule ne dit rien. */
function StatusBadge({ status }: { status: "draft" | "published" }) {
  const published = status === "published";
  const Icon = published ? CheckCircle2 : PencilLine;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
        published
          ? "bg-emerald-50 text-emerald-800"
          : "bg-amber-50 text-amber-900",
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {published ? "Publié" : "Brouillon"}
    </span>
  );
}

function groupBySubjectAndTopic(
  exercises: TeacherExercise[],
): Record<string, SubjectGroup> {
  const grouped: Record<string, SubjectGroup> = {};
  for (const ex of exercises) {
    const subjectKey = ex.subjectId ?? "none";
    grouped[subjectKey] ??= { subjectName: ex.subjectName, topics: {} };
    grouped[subjectKey].topics[ex.topicId] ??= {
      topicName: ex.topicName,
      items: [],
    };
    grouped[subjectKey].topics[ex.topicId].items.push(ex);
  }
  return grouped;
}

export default function TeacherExercisesPage() {
  // La coque garde déjà l'accès. Le profil ne sert ici qu'à savoir si le
  // compte est administrateur, seul rôle admis à supprimer une thématique.
  const profile = useQuery(api.profiles.getCurrentProfile);
  const exercises = useQuery(api.exercises.listByTeacher);
  const removeTopic = useMutation(api.topics.removeWithExercises);

  const [openSubjects, setOpenSubjects] = useState<Record<string, boolean>>({});
  const [openTopics, setOpenTopics] = useState<Record<string, boolean>>({});

  const isAdmin = profile?.role === "admin";
  const grouped = groupBySubjectAndTopic(
    (exercises ?? []) as TeacherExercise[],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mes exercices"
        description="Les exercices issus de vos imports PDF, classés par matière et par thématique."
        actions={
          <ButtonLink href="/teacher/pdf-uploads">
            <Plus className="h-4 w-4" aria-hidden />
            Ajouter des exercices
          </ButtonLink>
        }
      />

      {exercises === undefined ? (
        <LoadingBlock />
      ) : exercises.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Aucun exercice pour le moment"
          description="Importez un PDF : les exercices qu'il contient sont extraits automatiquement, puis vous les relisez avant de les publier."
          action={
            <ButtonLink href="/teacher/pdf-uploads">Importer un PDF</ButtonLink>
          }
        />
      ) : (
        <div className="space-y-3">
          {Object.entries(grouped).map(([subjectId, subject]) => {
            const isSubjectOpen = openSubjects[subjectId] ?? true;
            const subjectPanelId = `matiere-${subjectId}`;
            return (
              <Card key={subjectId} as="section" className="overflow-hidden">
                <h2>
                  <button
                    type="button"
                    aria-expanded={isSubjectOpen}
                    aria-controls={subjectPanelId}
                    onClick={() =>
                      setOpenSubjects((s) => ({
                        ...s,
                        [subjectId]: !isSubjectOpen,
                      }))
                    }
                    className="flex min-h-12 w-full items-center gap-2 px-4 py-2 text-left outline-none hover:bg-stone-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-(--dash-strong) sm:px-5"
                  >
                    {isSubjectOpen ? (
                      <ChevronDown
                        className="h-4 w-4 shrink-0 text-stone-500"
                        aria-hidden
                      />
                    ) : (
                      <ChevronRight
                        className="h-4 w-4 shrink-0 text-stone-500"
                        aria-hidden
                      />
                    )}
                    <span className="min-w-0 break-words font-semibold text-stone-900">
                      {subject.subjectName}
                    </span>
                  </button>
                </h2>

                {isSubjectOpen && (
                  <div
                    id={subjectPanelId}
                    className="divide-y divide-stone-100 border-t border-stone-100"
                  >
                    {Object.entries(subject.topics).map(([topicId, topic]) => {
                      const isTopicOpen = openTopics[topicId] ?? true;
                      const topicPanelId = `thematique-${topicId}`;
                      return (
                        <div key={topicId}>
                          <div className="flex flex-wrap items-center gap-x-2 px-2 sm:px-3">
                            <h3 className="min-w-0 flex-1">
                              <button
                                type="button"
                                aria-expanded={isTopicOpen}
                                aria-controls={topicPanelId}
                                onClick={() =>
                                  setOpenTopics((s) => ({
                                    ...s,
                                    [topicId]: !isTopicOpen,
                                  }))
                                }
                                className="flex min-h-11 w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm outline-none hover:bg-stone-50 focus-visible:ring-2 focus-visible:ring-(--dash-strong)"
                              >
                                {isTopicOpen ? (
                                  <ChevronDown
                                    className="h-4 w-4 shrink-0 text-stone-500"
                                    aria-hidden
                                  />
                                ) : (
                                  <ChevronRight
                                    className="h-4 w-4 shrink-0 text-stone-500"
                                    aria-hidden
                                  />
                                )}
                                <span className="min-w-0 break-words font-medium text-stone-800">
                                  {topic.topicName}
                                </span>
                                <span className="shrink-0 text-xs text-stone-500">
                                  {plural(topic.items.length, "exercice")}
                                </span>
                              </button>
                            </h3>
                            {/*
                              Réservé à l'administrateur, comme le serveur :
                              `topics.removeWithExercises` exige `callerIsAdmin`.
                              Un professeur ne voit pas un bouton que le serveur
                              lui refuserait.
                            */}
                            {isAdmin && (
                              <ConfirmAction
                                trigger={
                                  <Trash2 className="h-4 w-4" aria-hidden />
                                }
                                triggerLabel={`Supprimer la thématique ${topic.topicName} et ses exercices`}
                                message={`Supprimer « ${topic.topicName} » et ses ${plural(topic.items.length, "exercice")} ? Cette action est irréversible.`}
                                confirmLabel="Supprimer"
                                failMessage="Impossible de supprimer cette thématique."
                                onConfirm={() =>
                                  removeTopic({ id: topicId as Id<"topics"> })
                                }
                              />
                            )}
                          </div>

                          {isTopicOpen && (
                            <ul
                              id={topicPanelId}
                              className="divide-y divide-stone-100 bg-stone-50/60"
                            >
                              {topic.items.map((ex) => (
                                <li
                                  key={ex._id}
                                  className="flex items-center gap-2 py-2 pl-4 pr-2 sm:pl-10 sm:pr-3"
                                >
                                  <div className="min-w-0 flex-1">
                                    <p className="line-clamp-2 break-words text-sm text-stone-800">
                                      {ex.prompt}
                                    </p>
                                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                      <span className="inline-flex rounded-full bg-stone-200/70 px-2.5 py-1 text-xs font-medium text-stone-700">
                                        {TYPE_LABELS[ex.type] ?? ex.type}
                                      </span>
                                      <StatusBadge status={ex.status} />
                                    </div>
                                  </div>
                                  <Link
                                    href={`/teacher/exercises/edit?id=${ex._id}`}
                                    aria-label={`Modifier l'exercice : ${ex.prompt.slice(0, 60)}`}
                                    title="Modifier"
                                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-stone-600 outline-none hover:bg-(--dash-soft) hover:text-(--dash-strong) focus-visible:ring-2 focus-visible:ring-(--dash-strong)"
                                  >
                                    <Pencil className="h-4 w-4" aria-hidden />
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
