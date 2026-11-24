"use client";

import { Suspense, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useSearchParams } from "next/navigation";
import { FileQuestion, Plus, Save, X } from "lucide-react";
import { useServerFormSync } from "@/hooks/use-server-form-sync";
import type { ExerciseType } from "@/convex/exerciseTypes";
import {
  Button,
  ButtonLink,
  Card,
  EmptyState,
  Field,
  LoadingBlock,
  Notice,
  PageHeader,
  Input,
  SelectField,
  Textarea,
  useAsyncAction,
} from "@/components/dashboard/ui";

// Éditeur volontairement court : type, énoncé et indices. Le contenu détaillé
// (options, paires, zones) se modifie dans l'éditeur de l'administration.

const BACK = { href: "/teacher/exercises", label: "Mes exercices" };
const MAX_HINTS = 3;

// Un exercice fabriqué par le code (frise, dessin, écoute, couleurs) garde
// son type : il apparaît dans la liste pour que le choix affiché soit juste.
const TYPE_OPTIONS: { value: ExerciseType; label: string }[] = [
  { value: "qcm", label: "QCM" },
  { value: "drag-drop", label: "Glisser-déposer" },
  { value: "match", label: "Associer" },
  { value: "order", label: "Ordonner" },
  { value: "short-answer", label: "Réponse courte" },
  { value: "fill-blank", label: "Phrase à trous" },
  { value: "pattern", label: "Frise (jeu)" },
  { value: "pixel-art", label: "Dessin sur quadrillage (jeu)" },
  { value: "listen", label: "Écoute (jeu)" },
  { value: "color-mix", label: "Atelier des couleurs (jeu)" },
];

function NotFound({ title }: { title: string }) {
  return (
    <div className="space-y-6">
      <PageHeader title="Modifier l'exercice" back={BACK} />
      <EmptyState
        icon={FileQuestion}
        title={title}
        description="Il a peut-être été supprimé, ou il ne vient pas de l'un de vos imports."
        action={
          <ButtonLink href={BACK.href} variant="secondary">
            Retour à mes exercices
          </ButtonLink>
        }
      />
    </div>
  );
}

function TeacherExerciseEditPageInner() {
  const searchParams = useSearchParams();
  // Sans identifiant, la lecture est sautée : une chaîne vide passée comme
  // identifiant Convex fait lever la requête et tombe la page.
  const id = searchParams.get("id") ?? "";
  const exerciseId = id as Id<"exercises">;
  const exercise = useQuery(
    api.exercises.getById,
    id ? { id: exerciseId } : "skip",
  );
  const updateExercise = useMutation(api.exercises.update);

  const [type, setType] = useState<ExerciseType>("qcm");
  const [prompt, setPrompt] = useState("");
  const [hints, setHints] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const { busy, error, run } = useAsyncAction(
    "L'exercice n'a pas pu être enregistré.",
  );

  // Rempli quand l'exercice arrive, puis de nouveau seulement si la page passe à un
  // autre document : les modifications en cours ne sont jamais écrasées.
  useServerFormSync(
    exercise,
    (e) => e._id,
    (e) => {
      setType(e.type);
      setPrompt(e.prompt);
      setHints(e.hints);
    },
  );

  if (!id) return <NotFound title="Aucun exercice n'est désigné" />;

  if (exercise === undefined) {
    return (
      <div className="space-y-6">
        <PageHeader title="Modifier l'exercice" back={BACK} />
        <LoadingBlock />
      </div>
    );
  }

  if (exercise === null) return <NotFound title="Exercice introuvable" />;

  const promptIsEmpty = prompt.trim() === "";

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setSaved(false);
    const done = await run(async () => {
      await updateExercise({ id: exerciseId, type, prompt, hints });
      return true;
    });
    if (done) setSaved(true);
  }

  return (
    <form onSubmit={handleSave} className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Modifier l'exercice"
        description={`Version ${exercise.version} · ${
          exercise.status === "published" ? "Publié" : "Brouillon"
        }`}
        back={BACK}
      />

      <Card className="space-y-5 p-4 sm:p-6">
        <Field label="Type d'exercice" htmlFor="exercise-type">
          <SelectField
            id="exercise-type"
            value={type}
            onValueChange={(next) => {
              setType(next);
              setSaved(false);
            }}
            options={TYPE_OPTIONS}
          />
        </Field>

        <Field label="Énoncé" htmlFor="exercise-prompt">
          <Textarea
            id="exercise-prompt"
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              setSaved(false);
            }}
            rows={4}
            required
            placeholder="Écrivez l'énoncé de l'exercice"
          />
        </Field>

        <fieldset className="space-y-2">
          <legend className="mb-1 block text-sm font-medium text-stone-800">
            Indices ({MAX_HINTS} au plus)
          </legend>
          {hints.length === 0 && (
            <p className="text-sm text-stone-500">Aucun indice.</p>
          )}
          {hints.map((hint, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                type="text"
                value={hint}
                aria-label={`Indice ${index + 1}`}
                onChange={(e) => {
                  const next = [...hints];
                  next[index] = e.target.value;
                  setHints(next);
                  setSaved(false);
                }}
                placeholder={`Indice ${index + 1}`}
              />
              <button
                type="button"
                aria-label={`Retirer l'indice ${index + 1}`}
                title="Retirer cet indice"
                onClick={() => {
                  setHints(hints.filter((_, i) => i !== index));
                  setSaved(false);
                }}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-stone-500 outline-none hover:bg-red-50 hover:text-red-700 focus-visible:ring-2 focus-visible:ring-(--dash-strong)"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
          ))}
          {hints.length < MAX_HINTS && (
            <Button
              variant="ghost"
              className="-ml-2"
              onClick={() => {
                setHints([...hints, ""]);
                setSaved(false);
              }}
            >
              <Plus className="h-4 w-4" aria-hidden />
              Ajouter un indice
            </Button>
          )}
        </fieldset>

        <p className="rounded-xl bg-stone-100 p-3 text-sm text-stone-600">
          Pour modifier le contenu détaillé (options, paires, zones),
          demandez à un administrateur l&apos;accès à l&apos;éditeur complet.
        </p>
      </Card>

      {error && <Notice tone="error">{error}</Notice>}
      {saved && <Notice tone="success">Modifications enregistrées.</Notice>}

      <div className="flex flex-wrap justify-end gap-2">
        <ButtonLink href={BACK.href} variant="secondary">
          Annuler
        </ButtonLink>
        <Button type="submit" busy={busy} disabled={promptIsEmpty}>
          {!busy && <Save className="h-4 w-4" aria-hidden />}
          Enregistrer
        </Button>
      </div>
    </form>
  );
}

export default function TeacherExerciseEditPage() {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <TeacherExerciseEditPageInner />
    </Suspense>
  );
}
