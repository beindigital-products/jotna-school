"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { BADGE_CONDITIONS, badgeParams, isSupportedCondition } from "@/convex/badgeRules";
import { Award, Plus, Pencil, Trash2 } from "lucide-react";

import {
  Button,
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
  SelectField,
  Textarea,
  useAsyncAction,
} from "@/components/dashboard/ui";
import { StatusPill } from "@/components/admin/console-ui";

type BadgeRow = FunctionReturnType<typeof api.badges.list>[number];
type SubjectRow = FunctionReturnType<typeof api.subjects.list>[number];

// Les conditions que le moteur sait attribuer (`convex/badgeRules.ts`).
const CONDITION_LABELS: Record<string, string> = Object.fromEntries(
  BADGE_CONDITIONS.map((c) => [c.key, c.label]),
);

const CONDITION_OPTIONS = BADGE_CONDITIONS.map((c) => ({
  value: c.key as string,
  label: c.label,
}));

/** Le choix « aucune matière » : la liste déroulante n'a pas d'option vide. */
const ALL_SUBJECTS = "all";

/** Le formulaire d'un badge : création, ou modification quand `badge` est donné. */
function BadgeForm({
  badge,
  subjects,
  close,
}: {
  badge?: BadgeRow;
  subjects: SubjectRow[] | undefined;
  close: () => void;
}) {
  const createBadge = useMutation(api.badges.create);
  const updateBadge = useMutation(api.badges.update);

  const initialCount = badge
    ? badgeParams(badge.condition, badge.conditionParams).count
    : undefined;
  const [name, setName] = useState(badge?.name ?? "");
  const [description, setDescription] = useState(badge?.description ?? "");
  const [icon, setIcon] = useState(badge?.icon ?? "");
  const [condition, setCondition] = useState<string>(
    badge?.condition ?? "paliers_validated_total",
  );
  const [threshold, setThreshold] = useState(
    typeof initialCount === "number" ? String(initialCount) : "",
  );
  const [subjectId, setSubjectId] = useState<string>(badge?.subjectId ?? "");
  const [invalid, setInvalid] = useState<string | null>(null);
  const { busy, error, run } = useAsyncAction("Erreur lors de l'opération");

  // Un badge ancien peut porter une condition que le moteur ne connaît plus :
  // elle reste affichée, et le serveur la refuse à l'enregistrement.
  const conditionOptions = isSupportedCondition(condition)
    ? CONDITION_OPTIONS
    : [...CONDITION_OPTIONS, { value: condition, label: condition }];

  const subjectOptions = [
    { value: ALL_SUBJECTS, label: "Toutes les matières" },
    ...(subjects ?? []).map((s) => ({ value: s._id as string, label: s.name })),
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Le serveur ne contrôle pas ces champs : l'écran les exige, comme le
    // faisait la validation du navigateur, mais dit pourquoi dans la page.
    if (name === "" || icon === "" || description === "") {
      setInvalid("Renseignez le nom, l'icône et la description.");
      return;
    }
    setInvalid(null);
    // Le seuil saisi complète les paramètres par défaut de la condition ;
    // une matière liée sert aussi de paramètre (maîtrise d'une matière).
    const conditionParams = {
      ...badgeParams(condition, undefined),
      ...(threshold.trim() !== "" && Number.isFinite(Number(threshold)) ? { count: Number(threshold) } : {}),
      ...(subjectId ? { subjectId } : {}),
    };
    const fields = {
      name,
      description,
      icon,
      condition,
      conditionParams,
      subjectId: subjectId ? (subjectId as Id<"subjects">) : undefined,
    };
    const done = await run(async () => {
      if (badge) {
        await updateBadge({ id: badge._id, ...fields });
      } else {
        await createBadge(fields);
      }
      return true;
    });
    if (done) close();
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nom" htmlFor="badge-name">
          <Input
            id="badge-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ex: Explorateur"
          />
        </Field>
        <Field label="Icône (emoji ou nom Lucide)" htmlFor="badge-icon">
          <Input
            id="badge-icon"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            placeholder="ex: 🏆 ou Trophy"
          />
        </Field>
        <Field label="Description" htmlFor="badge-description" className="sm:col-span-2">
          <Textarea
            id="badge-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Description du badge..."
            className="min-h-16 resize-none"
          />
        </Field>
        <Field label="Condition" htmlFor="badge-condition" className="sm:col-span-2">
          <SelectField
            id="badge-condition"
            value={condition}
            onValueChange={setCondition}
            options={conditionOptions}
          />
        </Field>
        <Field
          label="Seuil (optionnel)"
          htmlFor="badge-threshold"
          hint="Vide : le seuil par défaut de la condition. Les autres réglages (temps, heure) gardent leurs défauts."
        >
          <Input
            id="badge-threshold"
            type="number"
            inputMode="numeric"
            min={1}
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            placeholder={String(badgeParams(condition, undefined).count ?? "")}
          />
        </Field>
        <Field label="Matière (optionnel)" htmlFor="badge-subject">
          <SelectField
            id="badge-subject"
            value={subjectId === "" ? ALL_SUBJECTS : subjectId}
            onValueChange={(next) =>
              setSubjectId(next === ALL_SUBJECTS ? "" : next)
            }
            options={subjectOptions}
          />
        </Field>
      </div>

      {(invalid ?? error) && <Notice tone="error">{invalid ?? error}</Notice>}

      <DialogActions onCancel={close}>
        <Button type="submit" busy={busy}>
          {badge ? "Enregistrer" : "Créer"}
        </Button>
      </DialogActions>
    </form>
  );
}

function BadgeCard({
  badge,
  subjects,
}: {
  badge: BadgeRow;
  subjects: SubjectRow[] | undefined;
}) {
  const removeBadge = useMutation(api.badges.remove);
  const linkedSubject = subjects?.find((s) => s._id === badge.subjectId);

  return (
    <Card as="li" className="flex flex-col p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-2xl">
          {badge.icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-stone-900">{badge.name}</p>
          <p className="mt-0.5 line-clamp-2 text-sm text-stone-600">
            {badge.description}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <StatusPill tone="info">
          {CONDITION_LABELS[badge.condition] ?? badge.condition}
        </StatusPill>
        {!isSupportedCondition(badge.condition) && (
          <StatusPill tone="critical">
            Condition inconnue : jamais attribué
          </StatusPill>
        )}
        {linkedSubject && (
          <span
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
            style={{ backgroundColor: linkedSubject.color }}
          >
            {linkedSubject.name}
          </span>
        )}
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
        <FormDialog
          triggerVariant="secondary"
          triggerLabel={`Modifier le badge ${badge.name}`}
          trigger={
            <>
              <Pencil className="h-4 w-4" aria-hidden />
              Modifier
            </>
          }
          title="Modifier le badge"
        >
          {(close) => <BadgeForm badge={badge} subjects={subjects} close={close} />}
        </FormDialog>
        <ConfirmAction
          trigger={
            <>
              <Trash2 className="h-4 w-4" aria-hidden />
              Supprimer
            </>
          }
          triggerLabel={`Supprimer le badge ${badge.name}`}
          title={`Supprimer le badge « ${badge.name} » ?`}
          confirmLabel="Supprimer"
          onConfirm={() => removeBadge({ id: badge._id })}
          failMessage="Erreur lors de la suppression"
        />
      </div>
    </Card>
  );
}

export default function AdminBadgesPage() {
  const badges = useQuery(api.badges.list);
  const subjects = useQuery(api.subjects.list);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Badges"
        description="Gérez les badges et récompenses des élèves"
        actions={
          <FormDialog
            trigger={
              <>
                <Plus className="h-4 w-4" aria-hidden />
                Ajouter un badge
              </>
            }
            title="Nouveau badge"
          >
            {(close) => <BadgeForm subjects={subjects} close={close} />}
          </FormDialog>
        }
      />

      {badges === undefined ? (
        <LoadingBlock label="Chargement des badges" />
      ) : badges.length === 0 ? (
        <EmptyState
          icon={Award}
          title="Aucun badge"
          description="Commencez par créer un badge pour motiver vos élèves."
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {badges.map((badge) => (
            <BadgeCard key={badge._id} badge={badge} subjects={subjects} />
          ))}
        </ul>
      )}
    </div>
  );
}
