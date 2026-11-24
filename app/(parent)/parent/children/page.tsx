"use client";

import { useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import {
  ArrowRight,
  GraduationCap,
  KeyRound,
  RefreshCw,
  Smartphone,
  Ticket,
  UserPlus,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { VisibleClassName } from "@/convex/curriculum";
import { CLASS_OPTIONS } from "@/components/dashboard/class-options";
import { CodeChip } from "@/components/classroom/code-chip";
import {
  Avatar,
  Button,
  ButtonLink,
  Card,
  ChoiceTabs,
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
  useAsyncAction,
} from "@/components/dashboard/ui";

/**
 * MES ENFANTS.
 *
 * Le parent crée ici le compte de chaque enfant. Chaque carte montre les deux
 * codes, avec leur usage écrit à côté pour qu'on ne les confonde pas :
 *
 * - le CODE DE CONNEXION, que l'enfant tape dans l'application ;
 * - le CODE ÉLÈVE, que le parent donne au professeur pour que l'enfant
 *   rejoigne sa classe.
 */
export default function ParentChildrenPage() {
  const children = useQuery(api.family.myChildren);
  const kids = children ?? [];

  const addChild = (
    <FormDialog
      trigger={
        <>
          <UserPlus className="h-4 w-4" aria-hidden />
          Ajouter un enfant
        </>
      }
      title="Ajouter un enfant"
      description="Créez son compte, ou retrouvez celui que son école a déjà créé."
    >
      {(close) => (
        <ChoiceTabs
          tabs={[
            {
              value: "create",
              label: "Nouveau compte",
              content: <AddChildForm close={close} />,
            },
            {
              value: "ticket",
              label: "Billet de l'école",
              content: <SchoolTicket />,
            },
          ]}
        />
      )}
    </FormDialog>
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Mes enfants"
        description="Les comptes de vos enfants et leurs codes."
        actions={kids.length > 0 ? addChild : undefined}
      />

      {children === undefined ? (
        <LoadingBlock />
      ) : kids.length === 0 ? (
        <>
          <HowItWorks />
          <EmptyState
            icon={UserPlus}
            title="Ajoutez votre premier enfant"
            description="Créez son compte en une minute : son nom et sa classe suffisent."
            action={addChild}
          />
        </>
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {kids.map((child) => (
            <ChildCard key={child._id} child={child} />
          ))}
        </ul>
      )}
    </div>
  );
}

/** Le billet remis par l'école : il rattache un compte que l'école a créé. */
function SchoolTicket() {
  return (
    <div className="space-y-4">
      <p className="flex items-start gap-3 text-sm text-stone-700">
        <Ticket className="mt-0.5 h-5 w-5 shrink-0 text-(--dash-strong)" aria-hidden />
        L&apos;école vous a remis un billet avec un code qui commence par PIO- ?
        Il rattache à votre espace le compte que l&apos;école a créé pour votre
        enfant. Vous n&apos;avez pas de compte à créer.
      </p>
      <ButtonLink href="/parent/children/code" className="w-full sm:w-auto">
        Saisir le code du billet
        <ArrowRight className="h-4 w-4" aria-hidden />
      </ButtonLink>
    </div>
  );
}

function HowItWorks() {
  const steps = [
    { icon: UserPlus, text: "Créez le compte de votre enfant : son nom et sa classe." },
    {
      icon: Smartphone,
      text: "Il se connecte dans l'application Jotna School avec son code de connexion.",
    },
    {
      icon: GraduationCap,
      text: "Son professeur utilise Jotna ? Donnez-lui le code élève.",
    },
  ];
  return (
    <ol className="grid gap-3 sm:grid-cols-3">
      {steps.map(({ icon: Icon, text }, index) => (
        <Card as="li" key={index} className="flex items-start gap-3 p-4">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-(--dash-soft) text-sm font-bold text-(--dash-strong)">
            {index + 1}
          </span>
          <span className="text-sm text-stone-700">
            <Icon className="mb-1 h-4 w-4 text-(--dash-strong)" aria-hidden />
            {text}
          </span>
        </Card>
      ))}
    </ol>
  );
}

type Child = {
  _id: Id<"profiles">;
  name: string;
  avatar: string | null;
  level: string | null;
  loginCode: string | null;
  studentCode: string | null;
  classroom: {
    name: string;
    teacherName: string | null;
    schoolName: string | null;
  } | null;
};

function ChildCard({ child }: { child: Child }) {
  const ensureStudentCode = useMutation(api.family.ensureStudentCode);
  const regenerateStudentCode = useMutation(api.family.regenerateStudentCode);
  const setChildLevel = useMutation(api.family.setChildLevel);
  const code = useAsyncAction("Le code élève n'a pas pu être affiché.");
  const level = useAsyncAction("La classe n'a pas pu être changée.");
  const levelId = `level-${child._id}`;

  return (
    <Card as="li" className="flex flex-col p-5">
      <div className="flex items-start gap-3">
        <Avatar name={child.name} src={child.avatar} />
        <div className="min-w-0 flex-1">
          <h2 className="break-words font-semibold text-stone-900">{child.name}</h2>
          {child.classroom ? (
            <p className="text-sm text-stone-600">
              {[child.classroom.name, child.classroom.teacherName, child.classroom.schoolName]
                .filter(Boolean)
                .join(" · ")}
            </p>
          ) : (
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <label htmlFor={levelId} className="text-sm text-stone-600">
                Classe
              </label>
              <SelectField
                id={levelId}
                value={(child.level as VisibleClassName | null) ?? ""}
                disabled={level.busy}
                placeholder="À choisir"
                onValueChange={(next) =>
                  void level.run(() =>
                    setChildLevel({ studentId: child._id, level: next }),
                  )
                }
                options={CLASS_OPTIONS}
                className="w-32"
              />
            </div>
          )}
          {level.error && (
            <Notice tone="error" className="mt-2">
              {level.error}
            </Notice>
          )}
        </div>
      </div>

      <dl className="mt-4 space-y-4">
        <div className="rounded-xl bg-stone-50 p-3">
          <dt className="flex items-center gap-1.5 text-sm font-semibold text-stone-900">
            <Smartphone className="h-4 w-4 text-(--dash-strong)" aria-hidden />
            Code de connexion, pour votre enfant
          </dt>
          <dd className="mt-2">
            {child.loginCode ? (
              <>
                <CodeChip code={child.loginCode} label="code de connexion" />
                <p className="mt-1.5 text-xs text-stone-600">
                  À taper deux fois dans l&apos;application : comme identifiant
                  et comme mot de passe.
                </p>
              </>
            ) : (
              <p className="text-sm text-stone-600">
                Votre enfant se connecte avec son adresse e-mail.
              </p>
            )}
          </dd>
        </div>

        <div className="rounded-xl bg-stone-50 p-3">
          <dt className="flex items-center gap-1.5 text-sm font-semibold text-stone-900">
            <KeyRound className="h-4 w-4 text-(--dash-strong)" aria-hidden />
            Code élève, pour son professeur
          </dt>
          <dd className="mt-2">
            {child.studentCode ? (
              <div className="flex flex-wrap items-center gap-2">
                <CodeChip code={child.studentCode} label="code élève" />
                <ConfirmAction
                  danger={false}
                  trigger={
                    <>
                      <RefreshCw className="h-4 w-4" aria-hidden />
                      Changer
                    </>
                  }
                  message="L'ancien code élève ne marchera plus."
                  confirmLabel="Changer le code"
                  failMessage="Le code élève n'a pas pu être changé."
                  onConfirm={() => regenerateStudentCode({ studentId: child._id })}
                />
              </div>
            ) : (
              <Button
                variant="secondary"
                busy={code.busy}
                onClick={() =>
                  void code.run(() => ensureStudentCode({ studentId: child._id }))
                }
              >
                Afficher le code élève
              </Button>
            )}
            {code.error && (
              <Notice tone="error" className="mt-2">
                {code.error}
              </Notice>
            )}
            <p className="mt-1.5 text-xs text-stone-600">
              {child.classroom
                ? "Pour changer de classe, donnez ce code au nouveau professeur."
                : "Le professeur le saisit pour ajouter votre enfant à sa classe."}
            </p>
          </dd>
        </div>
      </dl>

      <ButtonLink
        href={`/parent/children/progress?id=${child._id}`}
        variant="secondary"
        className="mt-4 w-full"
      >
        Voir la progression
        <ArrowRight className="h-4 w-4" aria-hidden />
      </ButtonLink>
    </Card>
  );
}

function AddChildForm({ close }: { close: () => void }) {
  const createStudent = useAction(api.studentAccounts.createStudent);
  const [name, setName] = useState("");
  const [level, setLevel] = useState<VisibleClassName | "">("");
  const [created, setCreated] = useState<{ name: string; loginCode: string } | null>(null);
  const [missingLevel, setMissingLevel] = useState(false);
  const { busy, error, run } = useAsyncAction("Le compte n'a pas pu être créé.");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!level) {
      setMissingLevel(true);
      return;
    }
    setMissingLevel(false);
    const result = await run(() => createStudent({ name, level }));
    if (result) setCreated({ name: result.name, loginCode: result.loginCode });
  }

  if (created) {
    return (
      <div className="space-y-4">
        <Notice tone="success">
          <p>
            Le compte de <strong>{created.name}</strong> est prêt. Son code de
            connexion pour l&apos;application :
          </p>
          <div className="mt-2">
            <CodeChip code={created.loginCode} size="lg" label="code de connexion" />
          </div>
          <p className="mt-2">
            Votre enfant le tape deux fois : comme identifiant et comme mot de
            passe. Vous le retrouvez à tout moment sur cette page.
          </p>
        </Notice>
        <DialogActions onCancel={close} cancelLabel="Terminé" />
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <Field label="Prénom et nom" htmlFor="child-name">
        <Input
          id="child-name"
          type="text"
          maxLength={80}
          autoComplete="off"
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </Field>
      <Field
        label="Classe"
        htmlFor="child-level"
        hint="Elle choisit les exercices adaptés. Elle se modifie ensuite si besoin."
      >
        <SelectField
          id="child-level"
          value={level}
          onValueChange={setLevel}
          options={CLASS_OPTIONS}
        />
      </Field>
      {missingLevel && !level && (
        <Notice tone="error">Choisissez la classe de votre enfant.</Notice>
      )}
      {error && <Notice tone="error">{error}</Notice>}
      <DialogActions onCancel={close}>
        <Button type="submit" busy={busy}>
          Créer le compte
        </Button>
      </DialogActions>
    </form>
  );
}
