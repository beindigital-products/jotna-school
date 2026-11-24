"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import {
  Clock,
  GraduationCap,
  History,
  School,
  UserMinus,
  UserPlus,
  X,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
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
  SectionTitle,
  SelectField,
  formatDay,
  plural,
  useAsyncAction,
  type SelectOption,
} from "@/components/dashboard/ui";

/**
 * LES PROFESSEURS DE L'ÉCOLE.
 *
 * La direction y voit qui enseigne chez elle et dans quelle classe, invite un
 * professeur, lui attribue une classe, et retire ses accès quand il quitte
 * l'école. Un professeur retiré perd ses classes d'école tout de suite, et ne
 * revient pas avec le code école : il lui faut une nouvelle invitation.
 */
export default function SchoolTeachersPage() {
  const data = useQuery(api.schoolSpace.mySchool);

  if (data === undefined) return <LoadingBlock />;
  if (!data || data.school === null) {
    return (
      <div className="space-y-6">
        <PageHeader title="Professeurs" />
        <EmptyState
          icon={School}
          title="Créez d'abord votre école"
          description="Les professeurs se gèrent une fois l'école créée."
          action={<ButtonLink href="/school/dashboard">Mon école</ButtonLink>}
        />
      </div>
    );
  }

  const { teachers, formerTeachers, classes } = data;
  const classOptions: SelectOption[] = classes.map((c) => ({
    value: c._id as string,
    label: `${c.class} ${c.label}${c.teacherName ? ` (${c.teacherName})` : " (sans professeur)"}`,
  }));
  const withoutClass = teachers.filter(
    (t) => !classes.some((c) => c.teacherId === t.profileId),
  ).length;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Professeurs"
        description="Qui enseigne dans votre école, dans quelle classe, et avec quels accès."
        actions={
          <FormDialog
            trigger={
              <>
                <UserPlus className="h-4 w-4" aria-hidden />
                Inviter un professeur
              </>
            }
            title="Inviter un professeur"
            description="Il doit déjà avoir un compte professeur. Il reçoit l'invitation dans son espace et choisit de l'accepter."
          >
            {(close) => (
              <InviteTeacherForm classOptions={classOptions} close={close} />
            )}
          </FormDialog>
        }
      />

      {withoutClass > 0 && (
        <Notice tone="warning">
          {plural(withoutClass, "professeur")} sans classe. Dans une école, un
          professeur est lié à une classe : attribuez-la dans la liste.
        </Notice>
      )}

      <section className="space-y-3" aria-labelledby="active-teachers">
        <SectionTitle id="active-teachers">
          Dans l&apos;école ({teachers.length})
        </SectionTitle>
        {teachers.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="Aucun professeur pour l'instant"
            description="Invitez un professeur avec le bouton ci-dessus, ou donnez-lui le code école : il le saisit dans son espace, page « Mes classes »."
          />
        ) : (
          <Card className="overflow-hidden">
            <ul className="divide-y divide-stone-100">
              {teachers.map((teacher) => (
                <TeacherRow
                  key={teacher.profileId}
                  teacher={teacher}
                  classNames={classes
                    .filter((c) => c.teacherId === teacher.profileId)
                    .map((c) => `${c.class} ${c.label}`)}
                  classOptions={classOptions}
                />
              ))}
            </ul>
          </Card>
        )}
      </section>

      <PendingInvitations />
      <FormerTeachers teachers={formerTeachers} classOptions={classOptions} />
    </div>
  );
}

type Teacher = { profileId: Id<"profiles">; name: string; email: string | null };

/** Les invitations envoyées, en attente de la réponse du professeur. */
function PendingInvitations() {
  const invitations = useQuery(api.schoolInvitations.listForSchool);
  const cancel = useMutation(api.schoolInvitations.cancel);

  if (!invitations || invitations.length === 0) return null;

  return (
    <Card as="section" aria-label="Invitations en attente" className="overflow-hidden">
      <h3 className="border-b border-stone-100 px-4 py-3 text-sm font-semibold text-stone-900">
        Invitations en attente de réponse
      </h3>
      <ul className="divide-y divide-stone-100">
        {invitations.map((invitation) => (
          <li key={invitation._id} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <Clock className="h-5 w-5 shrink-0 text-stone-500" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="break-words font-medium text-stone-900">
                {invitation.teacherName}
              </p>
              <p className="break-all text-sm text-stone-600">
                {[
                  invitation.className && `Classe ${invitation.className}`,
                  invitation.teacherEmail,
                  `invité le ${formatDay(invitation.createdAt)}`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
            <ConfirmAction
              trigger={<X className="h-4 w-4" aria-hidden />}
              triggerLabel={`Annuler l'invitation de ${invitation.teacherName}`}
              title={`Annuler l'invitation de ${invitation.teacherName} ?`}
              message="Le professeur ne la verra plus dans son espace."
              confirmLabel="Annuler l'invitation"
              failMessage="L'invitation n'a pas pu être annulée."
              onConfirm={() => cancel({ invitationId: invitation._id })}
            />
          </li>
        ))}
      </ul>
    </Card>
  );
}

/**
 * Inviter un professeur qui a déjà un compte. Il accepte dans son espace :
 * rien ne le lie à l'école sans son accord.
 */
function InviteTeacherForm({
  classOptions,
  close,
  initialEmail = "",
}: {
  classOptions: SelectOption[];
  close: () => void;
  /** L'adresse d'un ancien professeur que l'on réinvite. */
  initialEmail?: string;
}) {
  const invite = useMutation(api.schoolInvitations.inviteTeacher);
  const [email, setEmail] = useState(initialEmail);
  const [classId, setClassId] = useState("");
  const [sent, setSent] = useState<string | null>(null);
  const { busy, error, run } = useAsyncAction("L'invitation n'a pas pu être envoyée.");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const result = await run(() =>
      invite({
        email,
        schoolClassId: classId ? (classId as Id<"schoolClasses">) : undefined,
      }),
    );
    if (result) setSent(result.teacherName);
  }

  if (sent) {
    return (
      <div className="space-y-4">
        <Notice tone="success">
          Invitation envoyée à {sent}. Ce professeur la trouve dans son espace,
          page « Mes classes ». Elle reste dans « Invitations en attente » tant
          qu&apos;il n&apos;a pas répondu.
        </Notice>
        <DialogActions onCancel={close} cancelLabel="Fermer">
          <Button
            onClick={() => {
              setSent(null);
              setEmail("");
              setClassId("");
            }}
          >
            Inviter un autre professeur
          </Button>
        </DialogActions>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <Field label="Adresse e-mail du professeur" htmlFor="invite-teacher-email">
        <Input
          id="invite-teacher-email"
          type="email"
          autoComplete="off"
          inputMode="email"
          autoFocus={!initialEmail}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="prenom.nom@exemple.sn"
        />
      </Field>
      <Field
        label="Sa classe"
        htmlFor="invite-teacher-class"
        hint={
          classOptions.length === 0
            ? "Vous n'avez pas encore de classe : vous lui en attribuerez une ensuite."
            : "Elle lui est attribuée dès qu'il accepte."
        }
      >
        <SelectField
          id="invite-teacher-class"
          value={classId}
          onValueChange={setClassId}
          options={classOptions}
          disabled={classOptions.length === 0}
          placeholder={classOptions.length === 0 ? "Aucune classe" : "Choisir"}
        />
      </Field>
      {error && <Notice tone="error">{error}</Notice>}
      <DialogActions onCancel={close}>
        <Button type="submit" busy={busy}>
          Envoyer l&apos;invitation
        </Button>
      </DialogActions>
    </form>
  );
}

function TeacherRow({
  teacher,
  classNames,
  classOptions,
}: {
  teacher: Teacher;
  classNames: string[];
  classOptions: SelectOption[];
}) {
  const removeTeacher = useMutation(api.schoolSpace.removeTeacher);
  const assign = useMutation(api.schoolSpace.assignClassTeacher);
  const { busy, error, run } = useAsyncAction("La classe n'a pas pu être attribuée.");
  const withoutClass = classNames.length === 0;

  return (
    <li className="flex flex-wrap items-center gap-3 px-4 py-3">
      <GraduationCap className="h-5 w-5 shrink-0 text-(--dash-strong)" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="break-words font-medium text-stone-900">{teacher.name}</p>
        {teacher.email && (
          <p className="break-all text-sm text-stone-600">{teacher.email}</p>
        )}
        {withoutClass ? (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
              Sans classe
            </span>
            {classOptions.length > 0 ? (
              <SelectField
                aria-label={`Attribuer une classe à ${teacher.name}`}
                value=""
                disabled={busy}
                placeholder="Attribuer une classe"
                options={classOptions}
                className="w-full sm:w-64"
                onValueChange={(next) =>
                  void run(() =>
                    assign({
                      schoolClassId: next as Id<"schoolClasses">,
                      teacherId: teacher.profileId,
                    }),
                  )
                }
              />
            ) : (
              <span className="text-sm text-stone-600">
                Créez une classe pour la lui attribuer.
              </span>
            )}
          </div>
        ) : (
          <p className="text-sm text-stone-600">
            {classNames.length > 1 ? "Classes" : "Classe"} : {classNames.join(", ")}
          </p>
        )}
        {error && (
          <Notice tone="error" className="mt-2">
            {error}
          </Notice>
        )}
      </div>
      <ConfirmAction
        trigger={
          <>
            <UserMinus className="h-4 w-4" aria-hidden />
            Retirer
          </>
        }
        triggerLabel={`Retirer ${teacher.name} de l'école`}
        title={`Retirer ${teacher.name} de l'école ?`}
        message="Ce professeur perd tout de suite l'accès aux classes et aux élèves de l'école. Ses classes y restent, sans professeur. Son compte et ses cours particuliers ne sont pas touchés. Il ne pourra revenir que sur votre invitation."
        confirmLabel="Retirer ses accès"
        failMessage="Le professeur n'a pas pu être retiré."
        onConfirm={() => removeTeacher({ profileId: teacher.profileId })}
      />
    </li>
  );
}

/** Ceux qui ne sont plus dans l'école : la trace de leur départ. */
function FormerTeachers({
  teachers,
  classOptions,
}: {
  classOptions: SelectOption[];
  teachers: {
    profileId: Id<"profiles">;
    name: string;
    email: string | null;
    removedBy: "school" | "self";
    removedAt: number | null;
  }[];
}) {
  if (teachers.length === 0) return null;

  return (
    <section className="space-y-3" aria-labelledby="former-teachers">
      <SectionTitle id="former-teachers">Anciens professeurs</SectionTitle>
      <p className="text-sm text-stone-600">
        Ils n&apos;ont plus accès aux classes ni aux élèves de l&apos;école.
        Pour faire revenir l&apos;un d&apos;eux, réinvitez-le.
      </p>
      <Card className="overflow-hidden">
        <ul className="divide-y divide-stone-100">
          {teachers.map((teacher) => (
            <li key={teacher.profileId} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <History className="h-5 w-5 shrink-0 text-stone-500" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="break-words font-medium text-stone-900">
                  {teacher.name}
                </p>
                {teacher.email && (
                  <p className="break-all text-sm text-stone-600">{teacher.email}</p>
                )}
              </div>
              <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-700">
                {teacher.removedBy === "school"
                  ? "Accès retirés par l'école"
                  : "A quitté l'école"}
                {teacher.removedAt ? ` · ${formatDay(teacher.removedAt)}` : ""}
              </span>
              {teacher.email && (
                <FormDialog
                  triggerVariant="secondary"
                  trigger="Réinviter"
                  triggerLabel={`Réinviter ${teacher.name}`}
                  title={`Réinviter ${teacher.name}`}
                  description="Il reçoit l'invitation dans son espace et choisit de l'accepter."
                >
                  {(close) => (
                    <InviteTeacherForm
                      classOptions={classOptions}
                      close={close}
                      initialEmail={teacher.email ?? ""}
                    />
                  )}
                </FormDialog>
              )}
            </li>
          ))}
        </ul>
      </Card>
    </section>
  );
}
