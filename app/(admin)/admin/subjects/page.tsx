"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";
import { BookOpen, Pencil, Trash2, Plus } from "lucide-react";

import {
  Button,
  ButtonLink,
  Card,
  ConfirmAction,
  DialogActions,
  EmptyState,
  Field,
  FormDialog,
  Input,
  LoadingBlock,
  Notice,
  PageHeader,
  useAsyncAction,
} from "@/components/dashboard/ui";

type SubjectRow = FunctionReturnType<typeof api.subjects.list>[number];

/** Des couleurs prêtes à choisir, à la place du sélecteur du navigateur. */
const COLOR_PRESETS = [
  "#6366f1",
  "#2563eb",
  "#0891b2",
  "#059669",
  "#ca8a04",
  "#ea580c",
  "#dc2626",
  "#db2777",
  "#9333ea",
];

function CreateSubjectForm({ close }: { close: () => void }) {
  const createSubject = useMutation(api.subjects.create);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("BookOpen");
  const [color, setColor] = useState("#6366f1");
  const [order, setOrder] = useState(0);
  const [invalid, setInvalid] = useState<string | null>(null);
  const { busy, error, run } = useAsyncAction("Erreur lors de la création");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    // Le serveur ne contrôle pas ces champs : l'écran les exige, comme le
    // faisait la validation du navigateur, mais dit pourquoi dans la page.
    if (name === "" || icon === "") {
      setInvalid("Renseignez le nom et l'icône.");
      return;
    }
    setInvalid(null);
    const created = await run(() => createSubject({ name, icon, color, order }));
    if (created) close();
  };

  return (
    <form onSubmit={handleCreate} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nom" htmlFor="subject-name">
          <Input
            id="subject-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ex: Mathématiques"
          />
        </Field>
        <Field label="Icône" htmlFor="subject-icon">
          <Input
            id="subject-icon"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            placeholder="ex: BookOpen"
          />
        </Field>
        <Field label="Couleur" htmlFor="subject-color" className="sm:col-span-2">
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="h-11 w-11 shrink-0 rounded-xl border border-stone-300"
              style={{ backgroundColor: color }}
            />
            <Input
              id="subject-color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {COLOR_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setColor(preset)}
                aria-label={`Choisir la couleur ${preset}`}
                aria-pressed={color.toLowerCase() === preset}
                className="h-9 w-9 rounded-lg border border-stone-300 outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-(--dash-strong) aria-pressed:ring-2 aria-pressed:ring-stone-900"
                style={{ backgroundColor: preset }}
              />
            ))}
          </div>
        </Field>
        <Field label="Ordre" htmlFor="subject-order">
          <Input
            id="subject-order"
            type="number"
            inputMode="numeric"
            value={order}
            onChange={(e) => setOrder(Number(e.target.value))}
          />
        </Field>
      </div>

      {(invalid ?? error) && <Notice tone="error">{invalid ?? error}</Notice>}

      <DialogActions onCancel={close}>
        <Button type="submit" busy={busy}>
          Créer
        </Button>
      </DialogActions>
    </form>
  );
}

function SubjectCard({ subject }: { subject: SubjectRow }) {
  const removeSubject = useMutation(api.subjects.remove);
  const topics = useQuery(api.topics.listBySubject, {
    subjectId: subject._id,
  });
  const topicCount = topics?.length ?? 0;

  return (
    <Card as="li" className="flex flex-col p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
            style={{ backgroundColor: subject.color }}
          >
            {subject.icon.slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-stone-900">{subject.name}</p>
            <p className="text-sm text-stone-600">
              {topicCount} thématique{topicCount !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <span
          className="h-4 w-4 shrink-0 rounded-full border border-stone-200"
          style={{ backgroundColor: subject.color }}
          title={subject.color}
        />
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
        <ButtonLink
          href={`/admin/subjects/detail?id=${subject._id}`}
          variant="secondary"
          aria-label={`Modifier la matière ${subject.name}`}
        >
          <Pencil className="h-4 w-4" aria-hidden />
          Modifier
        </ButtonLink>
        <ConfirmAction
          trigger={
            <>
              <Trash2 className="h-4 w-4" aria-hidden />
              Supprimer
            </>
          }
          triggerLabel={`Supprimer la matière ${subject.name}`}
          title={`Supprimer la matière « ${subject.name} » ?`}
          confirmLabel="Supprimer"
          onConfirm={() => removeSubject({ id: subject._id })}
          failMessage="Erreur lors de la suppression"
        />
      </div>
    </Card>
  );
}

export default function SubjectsPage() {
  const subjects = useQuery(api.subjects.list);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Matières"
        description="Gérez les matières du programme scolaire"
        actions={
          <FormDialog
            trigger={
              <>
                <Plus className="h-4 w-4" aria-hidden />
                Ajouter une matière
              </>
            }
            title="Nouvelle matière"
          >
            {(close) => <CreateSubjectForm close={close} />}
          </FormDialog>
        }
      />

      {subjects === undefined ? (
        <LoadingBlock label="Chargement des matières" />
      ) : subjects.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Aucune matière"
          description="Commencez par ajouter une matière au programme."
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject) => (
            <SubjectCard key={subject._id} subject={subject} />
          ))}
        </ul>
      )}
    </div>
  );
}
