"use client";

import { useState } from "react";
import Link from "next/link";
import { useAction, useMutation, useQuery } from "convex/react";
import {
  Pencil,
  Printer,
  RefreshCw,
  Smartphone,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { VisibleClassName } from "@/convex/curriculum";
import { CLASS_OPTIONS } from "@/components/dashboard/class-options";
import {
  Button,
  Card,
  ChoiceTabs,
  ConfirmAction,
  DialogActions,
  EmptyState,
  Field,
  FormDialog,
  LoadingBlock,
  Notice,
  PageHeader,
  Input,
  SelectField,
  plural,
  useAsyncAction,
} from "@/components/dashboard/ui";
import { CodeChip } from "./code-chip";

/**
 * UNE CLASSE ET SES ÉLÈVES — partagé par l'espace professeur et l'espace
 * école. Deux façons d'ajouter un élève, côte à côte :
 *
 * - créer son compte ici (l'enfant n'a encore rien) ;
 * - saisir le code élève que donne la famille (l'enfant a déjà un compte,
 *   créé par ses parents).
 *
 * Le code de connexion de chaque élève est affiché : c'est le professeur qui
 * le remet à l'enfant, qui le tape deux fois dans l'application.
 */
export function ClassDetail({
  schoolClassId,
  backHref,
  studentHref,
}: {
  schoolClassId: string | null;
  backHref: string;
  /** L'adresse de la fiche d'un élève. Absente : le nom n'est pas un lien. */
  studentHref?: (studentId: string) => string;
}) {
  const detail = useQuery(
    api.classrooms.classDetail,
    schoolClassId
      ? { schoolClassId: schoolClassId as Id<"schoolClasses"> }
      : "skip",
  );
  const back = { href: backHref, label: "Retour aux classes" };

  if (schoolClassId && detail === undefined) return <LoadingBlock />;

  if (!schoolClassId || !detail) {
    return (
      <div className="space-y-6">
        <PageHeader title="Classe" back={back} />
        <EmptyState
          icon={Users}
          title="Classe introuvable"
          description="Cette classe n'existe pas, ou vous n'y avez pas accès."
        />
      </div>
    );
  }

  const classId = schoolClassId as Id<"schoolClasses">;

  return (
    <div className="space-y-6">
      <PageHeader
        back={back}
        title={`${detail.class} ${detail.label}`}
        description={[
          detail.schoolName,
          detail.teacherName && `Professeur : ${detail.teacherName}`,
          plural(detail.students.length, "élève"),
        ]
          .filter(Boolean)
          .join(" · ")}
        actions={
          <>
            {!detail.full && (
              <FormDialog
                trigger={
                  <>
                    <UserPlus className="h-4 w-4" aria-hidden />
                    Ajouter un élève
                  </>
                }
                title="Ajouter un élève"
                description={`Dans la classe ${detail.class} ${detail.label}.`}
              >
                {(close) => (
                  <ChoiceTabs
                    tabs={[
                      {
                        value: "create",
                        label: "Nouveau compte",
                        content: (
                          <CreateStudentForm schoolClassId={classId} close={close} />
                        ),
                      },
                      {
                        value: "code",
                        label: "Déjà un compte",
                        content: (
                          <AddByCodeForm schoolClassId={classId} close={close} />
                        ),
                      },
                    ]}
                  />
                )}
              </FormDialog>
            )}
            {detail.students.length > 0 && (
              <Button variant="secondary" onClick={() => window.print()}>
                <Printer className="h-4 w-4" aria-hidden />
                Imprimer les codes
              </Button>
            )}
            <FormDialog
              triggerVariant="secondary"
              trigger={
                <>
                  <Pencil className="h-4 w-4" aria-hidden />
                  Modifier
                </>
              }
              triggerLabel="Modifier le nom ou le niveau de la classe"
              title="Modifier la classe"
              description="Changer le niveau change les exercices que voient les élèves de la classe."
            >
              {(close) => (
                <RenameClassForm
                  schoolClassId={classId}
                  level={detail.class as VisibleClassName}
                  label={detail.label}
                  close={close}
                />
              )}
            </FormDialog>
          </>
        }
      />

      {detail.full && (
        <Notice tone="warning" className="print:hidden">
          Cette classe a atteint son nombre maximal d&apos;élèves. Retirez un
          élève pour en ajouter un autre.
        </Notice>
      )}

      <Card as="section" aria-label="Élèves de la classe" className="overflow-hidden">
        <div className="flex items-start gap-3 border-b border-stone-100 p-4 print:hidden">
          <Smartphone className="mt-0.5 h-5 w-5 shrink-0 text-(--dash-strong)" aria-hidden />
          <p className="text-sm text-stone-700">
            Chaque élève se connecte dans l&apos;application Jotna School avec
            son <strong>code de connexion</strong>, tapé deux fois : comme
            identifiant et comme mot de passe.
          </p>
        </div>

        {detail.students.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="mx-auto h-10 w-10 text-stone-400" aria-hidden />
            <p className="mt-2 text-sm text-stone-600">
              Aucun élève pour l&apos;instant. Ajoutez le premier avec le
              bouton « Ajouter un élève ».
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-stone-100">
            {detail.students.map((student) => (
              <StudentRow
                key={student.membershipId}
                student={student}
                href={studentHref?.(student.studentId)}
              />
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function StudentRow({
  student,
  href,
}: {
  student: {
    studentId: Id<"profiles">;
    membershipId: Id<"schoolMemberships">;
    name: string;
    loginCode: string | null;
    hasFamily: boolean;
  };
  href?: string;
}) {
  const removeStudent = useMutation(api.classrooms.removeStudent);
  const resetCode = useAction(api.studentCredentials.resetStudentLoginCode);

  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 print:break-inside-avoid">
      <div className="min-w-0 flex-1 basis-40">
        {href ? (
          <Link
            href={href}
            className="break-words font-medium text-stone-900 underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-(--dash-strong)"
          >
            {student.name}
          </Link>
        ) : (
          <p className="break-words font-medium text-stone-900">{student.name}</p>
        )}
        <p className="text-xs text-stone-600 print:hidden">
          {student.hasFamily ? "Famille connectée" : "Pas encore de parent lié"}
        </p>
      </div>
      {student.loginCode ? (
        <CodeChip code={student.loginCode} size="sm" label={`code de connexion de ${student.name}`} />
      ) : (
        <span className="text-xs text-stone-600">Connexion par e-mail</span>
      )}
      <div className="flex flex-wrap items-center print:hidden">
        {student.loginCode && (
          <ConfirmAction
            danger={false}
            trigger={<RefreshCw className="h-4 w-4" aria-hidden />}
            triggerLabel={`Donner un nouveau code de connexion à ${student.name}`}
            message="L'ancien code ne marchera plus, et l'élève sera déconnecté."
            confirmLabel="Nouveau code"
            failMessage="Le code n'a pas pu être changé."
            onConfirm={() => resetCode({ studentId: student.studentId })}
          />
        )}
        <ConfirmAction
          trigger={<UserMinus className="h-4 w-4" aria-hidden />}
          triggerLabel={`Retirer ${student.name} de la classe`}
          message="Son compte et ses progrès sont conservés."
          confirmLabel="Retirer de la classe"
          failMessage="L'élève n'a pas pu être retiré."
          onConfirm={() => removeStudent({ membershipId: student.membershipId })}
        />
      </div>
    </li>
  );
}

function CreateStudentForm({
  schoolClassId,
  close,
}: {
  schoolClassId: Id<"schoolClasses">;
  close: () => void;
}) {
  const createStudent = useAction(api.studentAccounts.createStudent);
  const [name, setName] = useState("");
  const [created, setCreated] = useState<{ name: string; loginCode: string } | null>(null);
  const { busy, error, run } = useAsyncAction("Le compte n'a pas pu être créé.");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const result = await run(() => createStudent({ name, schoolClassId }));
    if (!result) return;
    setCreated({ name: result.name, loginCode: result.loginCode });
    setName("");
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <p className="text-sm text-stone-600">
        Pour un enfant qui n&apos;a pas encore de compte. Il reçoit un code de
        connexion.
      </p>
      {created && (
        <Notice tone="success">
          <p>
            Compte de <strong>{created.name}</strong> créé. Son code de
            connexion :
          </p>
          <div className="mt-2">
            <CodeChip code={created.loginCode} size="lg" label="code de connexion" />
          </div>
        </Notice>
      )}
      <Field
        label={created ? "Élève suivant" : "Prénom et nom"}
        htmlFor="new-student-name"
      >
        <Input
          id="new-student-name"
          type="text"
          maxLength={80}
          autoComplete="off"
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </Field>
      {error && <Notice tone="error">{error}</Notice>}
      <DialogActions onCancel={close} cancelLabel={created ? "Terminé" : "Annuler"}>
        <Button type="submit" busy={busy}>
          Créer le compte
        </Button>
      </DialogActions>
    </form>
  );
}

type CodeCheck =
  | { status: "ready"; name: string; alreadyHere: boolean; inAnotherClass: boolean }
  | { status: "unknown" }
  | { status: "limited" };

/**
 * Ajouter un enfant qui a déjà un compte, avec son code élève, en deux temps :
 * on vérifie le code (le prénom de l'enfant s'affiche), puis on confirme.
 * Chaque vérification est comptée côté serveur, et les codes qui n'existent
 * pas sont freinés : plus de recherche à chaque lettre tapée.
 */
function AddByCodeForm({
  schoolClassId,
  close,
}: {
  schoolClassId: Id<"schoolClasses">;
  close: () => void;
}) {
  const checkStudentCode = useMutation(api.classrooms.checkStudentCode);
  const addStudentByCode = useMutation(api.classrooms.addStudentByCode);
  const [code, setCode] = useState("");
  const [checked, setChecked] = useState<CodeCheck | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [refusal, setRefusal] = useState<string | null>(null);
  const check = useAsyncAction("Le code n'a pas pu être vérifié.");
  const add = useAsyncAction("L'élève n'a pas pu être ajouté.");

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setDone(null);
    setRefusal(null);
    const result = await check.run(() => checkStudentCode({ code, schoolClassId }));
    if (result) setChecked(result);
  }

  async function confirm() {
    setRefusal(null);
    const result = await add.run(() => addStudentByCode({ code, schoolClassId }));
    if (!result) return;
    if (result.status !== "added") {
      setRefusal(result.message);
      setChecked(null);
      return;
    }
    setDone(
      result.moved
        ? `${result.name} a rejoint votre classe et quitté son ancienne classe.`
        : `${result.name} a rejoint votre classe.`,
    );
    setChecked(null);
    setCode("");
  }

  return (
    <form onSubmit={verify} noValidate className="space-y-4">
      <p className="text-sm text-stone-600">
        Demandez son code élève à sa famille. Il commence par ELV-. Le code ne
        sert qu&apos;une fois : la famille en reçoit un nouveau ensuite.
      </p>
      {done && <Notice tone="success">{done}</Notice>}
      <Field label="Code élève" htmlFor="student-code">
        <Input
          id="student-code"
          type="text"
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setChecked(null);
            setDone(null);
            setRefusal(null);
          }}
          placeholder="ELV-XXXXXX"
          className="font-mono uppercase tracking-wide"
        />
      </Field>
      <div aria-live="polite" className="space-y-2">
        {checked?.status === "ready" && (
          <Notice tone={checked.alreadyHere ? "warning" : "info"}>
            {checked.alreadyHere
              ? `${checked.name} est déjà dans cette classe.`
              : checked.inAnotherClass
                ? `${checked.name} est dans une autre classe : il passera dans la vôtre.`
                : `Élève trouvé : ${checked.name}.`}
          </Notice>
        )}
        {checked?.status === "unknown" && (
          <Notice tone="error">
            Ce code élève n&apos;existe pas. Vérifiez-le avec la famille : il
            commence par ELV- et ne contient ni O, ni I, ni zéro.
          </Notice>
        )}
        {checked?.status === "limited" && (
          <Notice tone="warning">
            Trop d&apos;essais avec des codes qui n&apos;existent pas. Patientez
            dix minutes, puis demandez le bon code à la famille.
          </Notice>
        )}
        {refusal && <Notice tone="error">{refusal}</Notice>}
      </div>
      {check.error && <Notice tone="error">{check.error}</Notice>}
      {add.error && <Notice tone="error">{add.error}</Notice>}
      <DialogActions onCancel={close} cancelLabel={done ? "Terminé" : "Annuler"}>
        {checked?.status === "ready" && !checked.alreadyHere ? (
          <Button onClick={confirm} busy={add.busy}>
            Ajouter {checked.name}
          </Button>
        ) : (
          <Button type="submit" busy={check.busy} disabled={code.trim().length < 6}>
            Vérifier le code
          </Button>
        )}
      </DialogActions>
    </form>
  );
}

/** Renommer la classe ou changer son niveau. Le niveau des élèves suit. */
function RenameClassForm({
  schoolClassId,
  level: currentLevel,
  label: currentLabel,
  close,
}: {
  schoolClassId: Id<"schoolClasses">;
  level: VisibleClassName;
  label: string;
  close: () => void;
}) {
  const updateClass = useMutation(api.classrooms.updateClass);
  const [level, setLevel] = useState(currentLevel);
  const [label, setLabel] = useState(currentLabel);
  const { busy, error, run } = useAsyncAction("La classe n'a pas pu être modifiée.");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const done = await run(async () => {
      await updateClass({ schoolClassId, class: level, label });
      return true;
    });
    if (done) close();
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-[8rem_1fr]">
        <Field label="Niveau" htmlFor="edit-class-level">
          <SelectField
            id="edit-class-level"
            value={level}
            onValueChange={setLevel}
            options={CLASS_OPTIONS}
          />
        </Field>
        <Field label="Nom" htmlFor="edit-class-label">
          <Input
            id="edit-class-label"
            type="text"
            maxLength={30}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
        </Field>
      </div>
      {error && <Notice tone="error">{error}</Notice>}
      <DialogActions onCancel={close}>
        <Button type="submit" busy={busy}>
          Enregistrer
        </Button>
      </DialogActions>
    </form>
  );
}
