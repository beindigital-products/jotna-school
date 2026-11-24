"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { type Id } from "@/convex/_generated/dataModel";
import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { refusalMessage } from "@/lib/refusalMessage";
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Clock,
  Eye,
  FileText,
  Send,
  Trash2,
  Upload,
  type LucideIcon,
} from "lucide-react";
import {
  Button,
  Card,
  CardTitle,
  ConfirmAction,
  EmptyState,
  Field,
  LoadingBlock,
  Notice,
  PageHeader,
  SectionTitle,
  formatDayTime,
  SelectField,
} from "@/components/dashboard/ui";
import { cn } from "@/lib/utils";

// Le statut se lit dans le mot et l'icône ; la teinte ne fait que l'appuyer.
const STATUS_CONFIG: Record<
  string,
  { label: string; tone: string; icon: LucideIcon }
> = {
  uploaded: {
    label: "Extraction en cours",
    tone: "bg-amber-50 text-amber-900",
    icon: Clock,
  },
  extracted: {
    label: "Extrait",
    tone: "bg-sky-50 text-sky-900",
    icon: CheckCircle2,
  },
  reviewed: {
    label: "Relu",
    tone: "bg-stone-100 text-stone-800",
    icon: Eye,
  },
  published: {
    label: "Publié",
    tone: "bg-emerald-50 text-emerald-800",
    icon: Send,
  },
};

const ERROR_STATUS = {
  label: "Erreur",
  tone: "bg-red-50 text-red-800",
  icon: AlertCircle,
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function extractionFailed(raw: unknown): boolean {
  return typeof raw === "object" && raw !== null && "error" in raw;
}

/** Certains téléphones ne donnent pas de type au fichier : l'extension tranche. */
function isPdf(file: File): boolean {
  return (
    file.type === "application/pdf" ||
    (file.type === "" && file.name.toLowerCase().endsWith(".pdf"))
  );
}

export default function TeacherPdfUploadsPage() {
  const router = useRouter();
  const uploads = useQuery(api.pdfUploads.listByTeacher);
  const subjects = useQuery(api.subjects.list);
  const generateUploadUrl = useMutation(api.pdfUploads.generateUploadUrl);
  const createUpload = useMutation(api.pdfUploads.create);
  const removeUpload = useMutation(api.pdfUploads.remove);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (file: File) => {
    if (!selectedSubjectId) {
      setError("Choisissez une matière avant d'envoyer un fichier.");
      return;
    }
    if (!isPdf(file)) {
      setError("Seuls les fichiers PDF sont acceptés.");
      return;
    }

    setError(null);
    setIsUploading(true);
    setUploadProgress("Préparation de l'envoi");

    try {
      const uploadUrl = await generateUploadUrl();
      setUploadProgress("Envoi du fichier");

      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": "application/pdf" },
        body: file,
      });

      if (!result.ok) {
        throw new Error("Erreur lors de l'envoi du fichier.");
      }

      const { storageId } = await result.json();
      setUploadProgress("Enregistrement de l'import");

      const uploadId = await createUpload({
        storageId,
        originalFilename: file.name,
        mimeType: "application/pdf",
        size: file.size,
        subjectId: selectedSubjectId as Id<"subjects">,
      });

      // Vers le détail : le professeur y suit l'extraction, puis relit et
      // publie les exercices produits.
      router.push(`/teacher/pdf-uploads/detail?id=${uploadId}`);
    } catch (err) {
      setError(
        refusalMessage(
          err,
          "Le fichier n'a pas pu être envoyé. Vérifiez votre connexion, puis réessayez.",
        ),
      );
    } finally {
      // Vidé dans tous les cas : sans cela, rechoisir le même fichier après
      // un échec ne déclenche aucun nouvel envoi.
      if (fileInputRef.current) fileInputRef.current.value = "";
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleUpload(file);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mes imports PDF"
        description="Importez un PDF d'exercices : ils en sont extraits automatiquement, puis vous les relisez avant de les publier."
      />

      <Card as="section" className="space-y-4 p-4 sm:p-6">
        <CardTitle
          icon={Upload}
          description="Choisissez la matière, puis le fichier. L'extraction démarre dès l'envoi."
        >
          Nouvel import
        </CardTitle>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Field
            label="Matière"
            htmlFor="subject-select"
            className="w-full sm:w-64"
          >
            <SelectField
              id="subject-select"
              value={selectedSubjectId}
              onValueChange={(next) => {
                setSelectedSubjectId(next);
                setError(null);
              }}
              disabled={isUploading || subjects === undefined}
              placeholder={
                subjects === undefined ? "Chargement…" : "Choisir une matière"
              }
              options={(subjects ?? []).map((s) => ({
                value: s._id as string,
                label: s.name,
              }))}
            />
          </Field>

          {/*
            Le champ fichier reste hors du parcours clavier : c'est le bouton,
            atteignable et annoncé comme tel, qui l'ouvre.
          */}
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            onChange={handleFileChange}
            className="hidden"
            tabIndex={-1}
            aria-hidden
          />
          <Button
            busy={isUploading}
            disabled={!selectedSubjectId}
            aria-describedby={
              selectedSubjectId ? undefined : "import-pdf-aide"
            }
            onClick={() => fileInputRef.current?.click()}
            className="w-full sm:w-auto"
          >
            {!isUploading && <Upload className="h-4 w-4" aria-hidden />}
            {isUploading ? "Envoi en cours" : "Importer un PDF"}
          </Button>
        </div>

        {!selectedSubjectId && (
          <p id="import-pdf-aide" className="text-sm text-stone-600">
            Choisissez d&apos;abord une matière pour activer l&apos;import.
          </p>
        )}

        {uploadProgress && <Notice tone="info">{uploadProgress}…</Notice>}

        {error && (
          <Notice tone="error">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="min-w-0 break-words">{error}</span>
              <button
                type="button"
                onClick={() => setError(null)}
                className="inline-flex min-h-11 items-center rounded-lg px-2 font-semibold underline outline-none focus-visible:ring-2 focus-visible:ring-red-700"
              >
                Fermer
              </button>
            </div>
          </Notice>
        )}
      </Card>

      <section aria-labelledby="fichiers-importes" className="space-y-3">
        <SectionTitle id="fichiers-importes">Fichiers importés</SectionTitle>

        {uploads === undefined && <LoadingBlock />}

        {uploads && uploads.length === 0 && (
          <EmptyState
            icon={FileText}
            title="Aucun PDF importé"
            description="Importez votre premier fichier PDF pour commencer."
          />
        )}

        {uploads && uploads.length > 0 && (
          <ul className="space-y-3">
            {uploads.map((upload) => {
              const status = extractionFailed(upload.extractedRaw)
                ? ERROR_STATUS
                : (STATUS_CONFIG[upload.status] ?? {
                    label: upload.status,
                    tone: "bg-stone-100 text-stone-800",
                    icon: FileText,
                  });
              const StatusIcon = status.icon;

              return (
                <Card
                  as="li"
                  key={upload._id}
                  className="flex flex-wrap items-center gap-x-2 gap-y-1 p-2 sm:p-3"
                >
                  <Link
                    href={`/teacher/pdf-uploads/detail?id=${upload._id}`}
                    className="flex min-h-11 min-w-0 flex-1 basis-56 items-center gap-3 rounded-xl p-2 outline-none hover:bg-stone-50 focus-visible:ring-2 focus-visible:ring-(--dash-strong)"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-(--dash-soft) text-(--dash-strong)">
                      <FileText className="h-5 w-5" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block break-words font-semibold text-stone-900">
                        {upload.originalFilename}
                      </span>
                      <span className="mt-0.5 block text-sm text-stone-600">
                        {upload.subjectName} · {formatFileSize(upload.size)} ·{" "}
                        {formatDayTime(upload._creationTime)}
                      </span>
                      <span
                        className={cn(
                          "mt-1.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                          status.tone,
                        )}
                      >
                        <StatusIcon className="h-3.5 w-3.5" aria-hidden />
                        {status.label}
                      </span>
                    </span>
                    <ChevronRight
                      className="h-4 w-4 shrink-0 text-stone-400"
                      aria-hidden
                    />
                  </Link>
                  <ConfirmAction
                    trigger={<Trash2 className="h-4 w-4" aria-hidden />}
                    triggerLabel={`Supprimer l'import ${upload.originalFilename}`}
                    message="Supprimer ce PDF et tous les exercices qu'il a produits ?"
                    confirmLabel="Supprimer"
                    failMessage="L'import n'a pas pu être supprimé."
                    onConfirm={() => removeUpload({ id: upload._id })}
                  />
                </Card>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
