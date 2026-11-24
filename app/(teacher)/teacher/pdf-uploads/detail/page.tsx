"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { type Id } from "@/convex/_generated/dataModel";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Eye,
  FileQuestion,
  HardDrive,
  PenTool,
  PencilLine,
  RefreshCw,
  Send,
} from "lucide-react";
import {
  Button,
  ButtonLink,
  Card,
  ConfirmAction,
  EmptyState,
  LoadingBlock,
  Notice,
  PageHeader,
  StatCard,
  formatDayTime,
  plural,
  useAsyncAction,
} from "@/components/dashboard/ui";
import { cn } from "@/lib/utils";

const BACK = { href: "/teacher/pdf-uploads", label: "Mes imports PDF" };

const STATUS_STEPS = [
  { key: "uploaded", label: "Importé", icon: Clock },
  { key: "extracted", label: "Extrait", icon: CheckCircle2 },
  { key: "reviewed", label: "Relu", icon: Eye },
  { key: "published", label: "Publié", icon: Send },
] as const;

const EXERCISE_TYPE_LABELS: Record<string, string> = {
  qcm: "QCM",
  "drag-drop": "Glisser-déposer",
  match: "Association",
  order: "Remise en ordre",
  "short-answer": "Réponse courte",
  "fill-blank": "Phrase à trous",
  pattern: "Frise",
  "pixel-art": "Dessin",
  listen: "Écoute",
  "color-mix": "Couleurs",
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function extractionError(raw: unknown): string | null {
  if (typeof raw !== "object" || raw === null || !("error" in raw)) return null;
  return String(raw.error);
}

function NotFound({ title }: { title: string }) {
  return (
    <div className="space-y-6">
      <PageHeader title="Import PDF" back={BACK} />
      <EmptyState
        icon={FileQuestion}
        title={title}
        description="Ce fichier n'existe pas, a été supprimé, ou ne fait pas partie de vos imports."
        action={
          <ButtonLink href={BACK.href} variant="secondary">
            Retour à mes imports
          </ButtonLink>
        }
      />
    </div>
  );
}

/** Le statut d'un exercice, en mots et avec une icône. */
function StatusBadge({ status }: { status: "draft" | "published" }) {
  const published = status === "published";
  const Icon = published ? CheckCircle2 : PencilLine;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
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

/** Les quatre étapes de l'import. L'état de chacune se lit aussi sans couleur. */
function Progress({
  currentIndex,
  failed,
}: {
  currentIndex: number;
  failed: boolean;
}) {
  return (
    <ol className="grid grid-cols-4 gap-1">
      {STATUS_STEPS.map((step, index) => {
        const isCurrent = index === currentIndex;
        const errored = failed && isCurrent;
        const done = index <= currentIndex && !failed;
        const StepIcon = errored ? AlertCircle : done ? Check : step.icon;
        const state = errored
          ? "en erreur"
          : done
            ? "terminé"
            : "à venir";
        return (
          <li
            key={step.key}
            aria-current={isCurrent ? "step" : undefined}
            className="flex min-w-0 flex-col items-center gap-1 text-center"
          >
            <span
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full border-2",
                errored
                  ? "border-red-700 bg-red-50 text-red-700"
                  : done
                    ? "border-(--dash-strong) bg-(--dash-strong) text-white"
                    : "border-dashed border-stone-300 bg-white text-stone-500",
              )}
            >
              <StepIcon className="h-5 w-5" aria-hidden />
            </span>
            <span
              className={cn(
                "max-w-full break-words text-xs font-medium",
                errored
                  ? "text-red-700"
                  : done
                    ? "text-stone-900"
                    : "text-stone-500",
              )}
            >
              {errored ? "Erreur" : step.label}
              <span className="sr-only">
                {errored ? ` à l'étape ${step.label}` : ` : ${state}`}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function TeacherPdfUploadDetailPageInner() {
  const searchParams = useSearchParams();
  // Sans identifiant, la lecture est sautée : une chaîne vide passée comme
  // identifiant Convex fait lever la requête et tombe la page.
  const id = searchParams.get("id") ?? "";
  const uploadId = id as Id<"pdfUploads">;
  // Le serveur rend `null` pour l'import d'un autre professeur : pas besoin
  // de relire le profil ici pour le renvoyer.
  const upload = useQuery(api.pdfUploads.getById, id ? { id: uploadId } : "skip");
  const publishExercise = useMutation(api.exercises.publish);
  const publishAll = useMutation(api.exercises.publishAllFromUpload);
  const retryExtraction = useMutation(api.pdfUploads.retryExtraction);

  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [publishMsg, setPublishMsg] = useState<string | null>(null);
  const publishOne = useAsyncAction(
    "Cet exercice n'a pas pu être publié.",
  );
  const retry = useAsyncAction("L'extraction n'a pas pu être relancée.");

  if (!id) return <NotFound title="Aucun import n'est désigné" />;

  if (upload === undefined) {
    return (
      <div className="space-y-6">
        <PageHeader title="Import PDF" back={BACK} />
        <LoadingBlock />
      </div>
    );
  }

  if (upload === null) return <NotFound title="PDF introuvable" />;

  const errorMessage = extractionError(upload.extractedRaw);
  const failed = errorMessage !== null;
  const currentStepIndex = STATUS_STEPS.findIndex(
    (s) => s.key === upload.status,
  );
  const exercises = upload.exercises ?? [];
  const drafts = exercises.filter((e) => e.status === "draft");
  const publishedCount = exercises.length - drafts.length;

  const handlePublishOne = async (exerciseId: Id<"exercises">) => {
    setPublishingId(exerciseId);
    setPublishMsg(null);
    await publishOne.run(() => publishExercise({ id: exerciseId }));
    setPublishingId(null);
  };

  const handlePublishAll = async () => {
    setPublishMsg(null);
    publishOne.clearError();
    // Un refus remonte à `ConfirmAction`, qui l'affiche sous ses boutons.
    const res = await publishAll({ uploadId });
    setPublishMsg(`${plural(res.published, "exercice publié", "exercices publiés")}.`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={<span className="break-words">{upload.originalFilename}</span>}
        description={`Import PDF nº ${id.slice(-6)}`}
        back={BACK}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={HardDrive}
          label="Taille"
          value={<span className="text-lg">{formatFileSize(upload.size)}</span>}
        />
        <StatCard
          icon={BookOpen}
          label="Matière"
          value={
            <span className="break-words text-lg">{upload.subjectName}</span>
          }
        />
        <StatCard
          icon={Calendar}
          label="Date d'import"
          value={
            <span className="text-lg">
              {formatDayTime(upload._creationTime)}
            </span>
          }
        />
        <StatCard
          icon={PenTool}
          label="Exercices"
          value={upload.exercisesCount}
        />
      </div>

      <Card as="section" className="space-y-4 p-4 sm:p-6">
        <h2 className="font-semibold text-stone-900">Progression</h2>
        <Progress currentIndex={currentStepIndex} failed={failed} />
      </Card>

      {failed && (
        <Notice tone="error" className="space-y-3 p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
            <div className="min-w-0">
              <p className="font-semibold">L&apos;extraction a échoué</p>
              <p className="mt-1 break-words">{errorMessage}</p>
            </div>
          </div>
          <Button
            variant="secondary"
            busy={retry.busy}
            onClick={() => void retry.run(() => retryExtraction({ id: uploadId }))}
          >
            {!retry.busy && <RefreshCw className="h-4 w-4" aria-hidden />}
            Relancer l&apos;extraction
          </Button>
          {retry.error && <p className="font-semibold">{retry.error}</p>}
        </Notice>
      )}

      {upload.extractedAt && !failed && (
        <Notice tone="success" className="flex items-start gap-2 p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          <div className="min-w-0">
            <p className="font-semibold">Extraction terminée</p>
            <p className="mt-0.5">
              {plural(
                upload.exercisesCount,
                "exercice extrait",
                "exercices extraits",
              )}{" "}
              le {formatDayTime(upload.extractedAt)}.
            </p>
          </div>
        </Notice>
      )}

      {upload.status === "uploaded" && !failed && (
        <Notice tone="warning" className="flex items-start gap-2 p-4">
          <Clock className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          <div className="min-w-0">
            <p className="font-semibold">Extraction en cours</p>
            <p className="mt-0.5">
              Le document est analysé et ses exercices sont extraits. Cela
              peut prendre quelques minutes ; cette page se met à jour seule.
            </p>
          </div>
        </Notice>
      )}

      {exercises.length > 0 && (
        <Card as="section" className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 p-4 sm:px-6">
            <div className="min-w-0">
              <h2 className="font-semibold text-stone-900">
                Exercices extraits ({upload.exercisesCount})
              </h2>
              <p className="mt-0.5 text-sm text-stone-600">
                {plural(publishedCount, "publié")} ·{" "}
                {plural(drafts.length, "brouillon")}
              </p>
            </div>
            {drafts.length > 0 && (
              <ConfirmAction
                danger={false}
                trigger={
                  <>
                    <Send className="h-4 w-4" aria-hidden />
                    Publier tous les brouillons
                  </>
                }
                message={`Publier ${
                  drafts.length > 1
                    ? `les ${drafts.length} brouillons`
                    : "le brouillon"
                } ? Les élèves pourront les recevoir.`}
                confirmLabel="Publier"
                failMessage="Les exercices n'ont pas pu être publiés."
                onConfirm={handlePublishAll}
              />
            )}
          </div>

          {(publishMsg || publishOne.error) && (
            <div className="border-b border-stone-200 p-3 sm:px-6">
              {publishOne.error ? (
                <Notice tone="error">{publishOne.error}</Notice>
              ) : (
                <Notice tone="success">{publishMsg}</Notice>
              )}
            </div>
          )}

          <ol className="divide-y divide-stone-100">
            {exercises.map((exercise, index) => (
              <li
                key={exercise._id}
                className="flex flex-wrap items-start gap-3 p-4 sm:px-6"
              >
                <span
                  aria-hidden
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-(--dash-soft) text-sm font-semibold text-(--dash-strong)"
                >
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1 basis-48">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-700">
                      {EXERCISE_TYPE_LABELS[exercise.type] ?? exercise.type}
                    </span>
                    <StatusBadge status={exercise.status} />
                  </div>
                  <p className="mt-1.5 break-words text-sm text-stone-900">
                    {exercise.prompt}
                  </p>
                  <p className="mt-0.5 break-words text-sm text-stone-600">
                    Réponse : {exercise.answerKey}
                  </p>
                </div>
                <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                  <ButtonLink
                    href={`/teacher/exercises/edit?id=${exercise._id}`}
                    variant="secondary"
                    aria-label={`Modifier l'exercice ${index + 1}`}
                  >
                    Modifier
                  </ButtonLink>
                  {exercise.status === "draft" && (
                    <Button
                      busy={publishingId === exercise._id}
                      disabled={publishingId !== null}
                      aria-label={`Publier l'exercice ${index + 1}`}
                      onClick={() => void handlePublishOne(exercise._id)}
                    >
                      {publishingId !== exercise._id && (
                        <Send className="h-4 w-4" aria-hidden />
                      )}
                      Publier
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </Card>
      )}

      {upload.status !== "uploaded" && !failed && exercises.length === 0 && (
        <EmptyState
          icon={FileQuestion}
          title="Aucun exercice trouvé dans ce PDF"
          description="Le document a été lu, mais aucun exercice n'y a été reconnu. Essayez avec un autre fichier."
        />
      )}
    </div>
  );
}

export default function TeacherPdfUploadDetailPage() {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <TeacherPdfUploadDetailPageInner />
    </Suspense>
  );
}
