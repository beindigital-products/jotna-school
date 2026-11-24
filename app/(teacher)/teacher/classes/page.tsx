"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowRight,
  Plus,
  School,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { VisibleClassName } from "@/convex/curriculum";
import { CLASS_OPTIONS } from "@/components/dashboard/class-options";
import {
  Button,
  Card,
  CardTitle,
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
  plural,
  useAsyncAction,
} from "@/components/dashboard/ui";

/**
 * MES CLASSES — le cœur de l'espace professeur.
 *
 * La page liste les classes, rangées par propriétaire : les cours particuliers
 * du professeur, puis chaque école dont il fait partie. Créer une classe et
 * rejoindre une école s'ouvrent par les boutons du haut.
 */
export default function TeacherClassesPage() {
  const data = useQuery(api.classrooms.myClasses);

  if (data === undefined) return <LoadingBlock />;

  const classes = data?.classes ?? [];
  const schools = data?.schools ?? [];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Mes classes"
        description="Vos classes et leurs élèves."
        actions={
          <>
            <FormDialog
              trigger={
                <>
                  <Plus className="h-4 w-4" aria-hidden />
                  Nouvelle classe
                </>
              }
              title="Nouvelle classe"
              description="Le niveau décide des exercices que verront les élèves."
            >
              {(close) => <CreateClassForm schools={schools} close={close} />}
            </FormDialog>
            <FormDialog
              triggerVariant="secondary"
              trigger={
                <>
                  <School className="h-4 w-4" aria-hidden />
                  Rejoindre une école
                </>
              }
              title="Rejoindre une école"
              description="Votre école utilise Jotna ? Saisissez le code que vous a donné la direction. Il commence par ECO-."
            >
              {(close) => <JoinSchoolForm close={close} />}
            </FormDialog>
          </>
        }
      />

      <SchoolInvitations />

      {classes.length === 0 && schools.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Vous n'avez pas encore de classe"
          description="Créez la première avec le bouton « Nouvelle classe » : choisissez son niveau et donnez-lui un nom."
        />
      ) : (
        <>
          {/* Un groupe par propriétaire : les cours particuliers du professeur,
              puis chaque école. Sans école, un seul groupe, sans titre. */}
          <ClassGroup
            title={schools.length > 0 ? "Mes cours particuliers" : null}
            hint="Ces classes sont à vous. Aucune école ne les voit."
            icon={UserRound}
            classes={classes.filter((c) => c.schoolId === null)}
            emptyText="Aucun cours particulier. Créez une classe et choisissez « Mes cours particuliers »."
          />
          {schools.map((school) => (
            <ClassGroup
              key={school._id}
              title={school.name}
              hint="Classes de l'école. La direction les voit et peut les gérer."
              icon={School}
              classes={classes.filter((c) => c.schoolId === school._id)}
              emptyText="L'école ne vous a pas encore attribué de classe. Demandez-le à la direction."
              action={
                school.role === "professeur" ? (
                  <LeaveSchool schoolId={school._id} name={school.name} />
                ) : undefined
              }
            />
          ))}
        </>
      )}
    </div>
  );
}

function LeaveSchool({ schoolId, name }: { schoolId: Id<"schools">; name: string }) {
  const leaveSchool = useMutation(api.classrooms.leaveSchool);
  return (
    <ConfirmAction
      trigger="Quitter l'école"
      triggerLabel={`Quitter ${name}`}
      title={`Quitter ${name} ?`}
      message="Les classes de l'école y restent, sans professeur, et vous ne verrez plus leurs élèves. Vos cours particuliers ne changent pas."
      confirmLabel="Quitter l'école"
      failMessage="Vous n'avez pas pu quitter cette école."
      onConfirm={() => leaveSchool({ schoolId })}
    />
  );
}

type TeacherClass = {
  _id: Id<"schoolClasses">;
  class: string;
  label: string;
  schoolId: Id<"schools"> | null;
  studentCount: number;
};

function ClassGroup({
  title,
  hint,
  icon: Icon,
  classes,
  emptyText,
  action,
}: {
  title: string | null;
  hint: string;
  icon: LucideIcon;
  classes: TeacherClass[];
  emptyText: string;
  action?: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      {title && (
        <div className="flex flex-wrap items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-(--dash-soft) text-(--dash-strong)">
            <Icon className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1 basis-48">
            <h2 className="break-words text-lg font-semibold text-stone-900">
              {title}
            </h2>
            <p className="text-sm text-stone-600">{hint}</p>
          </div>
          {action}
        </div>
      )}
      {classes.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-stone-300 px-4 py-5 text-sm text-stone-600">
          {emptyText}
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {classes.map((c) => (
            <li key={c._id}>
              <Link
                href={`/teacher/classes/detail?id=${c._id}`}
                className="group block h-full rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-(--dash-strong) focus-visible:ring-offset-2"
              >
                <Card className="h-full p-5 transition-shadow group-hover:shadow-md">
                  <p className="break-words text-lg font-semibold text-stone-900">
                    {c.class} {c.label}
                  </p>
                  <p className="mt-1 text-sm text-stone-600">
                    {plural(c.studentCount, "élève")}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-(--dash-strong)">
                    Gérer les élèves
                    <ArrowRight
                      className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </span>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** La valeur de liste « mes cours particuliers » : hors de toute école. */
const PRIVATE = "private";

function CreateClassForm({
  schools,
  close,
}: {
  schools: { _id: Id<"schools">; name: string }[];
  close: () => void;
}) {
  const createMyClass = useMutation(api.classrooms.createMyClass);
  const [level, setLevel] = useState<VisibleClassName>("CP");
  const [label, setLabel] = useState("");
  const [destination, setDestination] = useState<string>(PRIVATE);
  const { busy, error, run } = useAsyncAction("La classe n'a pas pu être créée.");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const done = await run(async () => {
      await createMyClass({
        class: level,
        label,
        schoolId:
          destination === PRIVATE ? undefined : (destination as Id<"schools">),
      });
      return true;
    });
    if (done) close();
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-[8rem_1fr]">
        <Field label="Niveau" htmlFor="class-level">
          <SelectField
            id="class-level"
            value={level}
            onValueChange={setLevel}
            options={CLASS_OPTIONS}
          />
        </Field>
        <Field
          label="Nom"
          htmlFor="class-label"
          hint="A, B, Les lions… Laissez vide pour « A »."
        >
          <Input
            id="class-label"
            type="text"
            maxLength={30}
            autoFocus
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="A"
          />
        </Field>
      </div>
      {schools.length > 0 && (
        <Field
          label="Cette classe est pour"
          htmlFor="class-destination"
          hint="Un cours particulier est à vous : aucune école ne le voit."
        >
          <SelectField
            id="class-destination"
            value={destination}
            onValueChange={setDestination}
            options={[
              { value: PRIVATE, label: "Mes cours particuliers" },
              ...schools.map((s) => ({ value: s._id as string, label: s.name })),
            ]}
          />
        </Field>
      )}
      {error && <Notice tone="error">{error}</Notice>}
      <DialogActions onCancel={close}>
        <Button type="submit" busy={busy}>
          Créer la classe
        </Button>
      </DialogActions>
    </form>
  );
}

/** Les invitations d'écoles en attente : le professeur accepte ou refuse. */
function SchoolInvitations() {
  const invitations = useQuery(api.schoolInvitations.mine);
  const respond = useMutation(api.schoolInvitations.respond);
  const [joined, setJoined] = useState<string | null>(null);
  const { busy, error, run } = useAsyncAction("La réponse n'a pas pu être enregistrée.");

  if ((!invitations || invitations.length === 0) && !joined && !error) return null;

  return (
    <section aria-label="Invitations d'écoles" className="space-y-3">
      {(invitations ?? []).map((invitation) => (
        <Card key={invitation._id} className="p-5">
          <CardTitle
            icon={School}
            description="En acceptant, vous enseignez dans cette école. Vos cours particuliers restent à vous : l'école ne les voit pas."
          >
            {invitation.schoolName}
            {invitation.schoolCity ? ` (${invitation.schoolCity})` : ""} vous
            invite à la rejoindre
            {invitation.className ? `, pour la classe ${invitation.className}` : ""}
          </CardTitle>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              busy={busy}
              onClick={async () => {
                const result = await run(() =>
                  respond({ invitationId: invitation._id, accept: true }),
                );
                if (result?.joined) setJoined(result.schoolName);
              }}
            >
              Accepter
            </Button>
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() =>
                void run(() =>
                  respond({ invitationId: invitation._id, accept: false }),
                )
              }
            >
              Refuser
            </Button>
          </div>
        </Card>
      ))}
      {error && <Notice tone="error">{error}</Notice>}
      {joined && <Notice tone="success">Vous avez rejoint {joined}.</Notice>}
    </section>
  );
}

function JoinSchoolForm({ close }: { close: () => void }) {
  const joinSchool = useMutation(api.classrooms.joinSchoolWithCode);
  const [code, setCode] = useState("");
  const [done, setDone] = useState<string | null>(null);
  const { busy, error, run } = useAsyncAction("Impossible de rejoindre cette école.");
  const preview = useQuery(
    api.classrooms.previewSchoolCode,
    code.trim().length >= 6 ? { code } : "skip",
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const result = await run(() => joinSchool({ code }));
    if (result) setDone(result.schoolName);
  }

  if (done) {
    return (
      <div className="space-y-4">
        <Notice tone="success">
          Vous avez rejoint {done}. Vos cours particuliers restent à vous. La
          direction vous attribue maintenant une classe.
        </Notice>
        <DialogActions onCancel={close} cancelLabel="Fermer" />
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <Field label="Code école" htmlFor="school-code">
        <Input
          id="school-code"
          type="text"
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="ECO-XXXXXX"
          className="font-mono uppercase tracking-wide"
        />
      </Field>
      <div aria-live="polite">
        {preview?.status === "ready" && (
          <Notice tone="info">
            École trouvée : {preview.name}
            {preview.city ? ` (${preview.city})` : ""}.
          </Notice>
        )}
        {preview?.status === "unknown" && (
          <p className="text-sm text-stone-600">Aucune école ne porte ce code.</p>
        )}
      </div>
      {error && <Notice tone="error">{error}</Notice>}
      <DialogActions onCancel={close}>
        <Button type="submit" busy={busy} disabled={preview?.status !== "ready"}>
          Rejoindre
        </Button>
      </DialogActions>
    </form>
  );
}
