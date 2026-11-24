"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowRight,
  GraduationCap,
  Plus,
  RefreshCw,
  School,
  Users,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { VisibleClassName } from "@/convex/curriculum";
import { CodeChip } from "@/components/classroom/code-chip";
import { CLASS_OPTIONS } from "@/components/dashboard/class-options";
import {
  Button,
  ButtonLink,
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
  SectionTitle,
  SelectField,
  StatCard,
  plural,
  useAsyncAction,
  type SelectOption,
} from "@/components/dashboard/ui";

/**
 * TABLEAU DE BORD DE L'ÉCOLE.
 *
 * Trois blocs, dans l'ordre où une direction en a besoin : le code école à
 * partager, les professeurs qui l'ont saisi, puis les classes. Si l'école
 * n'existe pas encore (création interrompue à l'inscription), on la crée ici.
 */
export default function SchoolDashboardPage() {
  const data = useQuery(api.schoolSpace.mySchool);

  if (data === undefined) return <LoadingBlock />;
  if (data === null) {
    return (
      <EmptyState
        icon={School}
        title="Cet espace est réservé aux comptes école"
        description="Connectez-vous avec le compte de la direction pour gérer l'école."
      />
    );
  }
  if (data.school === null) return <CreateSchoolForm />;

  const { school, teachers, classes } = data;
  const studentTotal = classes.reduce((sum, c) => sum + c.studentCount, 0);
  const classesWithoutTeacher = classes.filter((c) => !c.teacherId).length;
  const teachersWithoutClass = teachers.filter(
    (t) => !classes.some((c) => c.teacherId === t.profileId),
  ).length;
  const teacherOptions: SelectOption[] = [
    { value: NO_TEACHER, label: "Sans professeur" },
    ...teachers.map((t) => ({ value: t.profileId as string, label: t.name })),
  ];

  return (
    <div className="space-y-8">
      <PageHeader title={school.name} description={school.city ?? undefined} />

      <section aria-label="Chiffres clés" className="grid grid-cols-3 gap-3">
        <StatCard icon={GraduationCap} label="Professeurs" value={teachers.length} />
        <StatCard icon={School} label="Classes" value={classes.length} />
        <StatCard icon={Users} label="Élèves" value={studentTotal} />
      </section>

      {(classesWithoutTeacher > 0 || teachersWithoutClass > 0) && (
        <Notice tone="warning">
          <p className="font-semibold">À compléter</p>
          <ul className="mt-1 list-disc pl-5">
            {classesWithoutTeacher > 0 && (
              <li>
                {plural(classesWithoutTeacher, "classe")} sans professeur :
                choisissez-en un dans la liste des classes.
              </li>
            )}
            {teachersWithoutClass > 0 && (
              <li>
                {plural(teachersWithoutClass, "professeur")} sans classe :
                attribuez une classe depuis la page « Professeurs ».
              </li>
            )}
          </ul>
        </Notice>
      )}

      <JoinCodeCard code={school.joinCode} />

      <Card className="flex flex-wrap items-center gap-3 p-5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-(--dash-soft) text-(--dash-strong)">
          <GraduationCap className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-stone-900">
            {teachers.length === 0
              ? "Aucun professeur pour l'instant"
              : plural(teachers.length, "professeur")}
          </h2>
          <p className="text-sm text-stone-600">
            Inviter un professeur, lui attribuer une classe, retirer ses accès.
          </p>
        </div>
        <ButtonLink href="/school/teachers" variant="secondary">
          Gérer les professeurs
          <ArrowRight className="h-4 w-4" aria-hidden />
        </ButtonLink>
      </Card>

      <section className="space-y-3" aria-labelledby="school-classes">
        <SectionTitle
          id="school-classes"
          action={
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
              {(close) => (
                <CreateClassForm teacherOptions={teacherOptions} close={close} />
              )}
            </FormDialog>
          }
        >
          Classes
        </SectionTitle>
        {classes.length === 0 ? (
          <EmptyState
            icon={School}
            title="Aucune classe pour l'instant"
            description="Créez vos classes avec le bouton « Nouvelle classe », ou laissez vos professeurs créer les leurs."
          />
        ) : (
          <Card className="overflow-hidden">
            <ul className="divide-y divide-stone-100">
              {classes.map((schoolClass) => (
                <ClassRow
                  key={schoolClass._id}
                  schoolClass={schoolClass}
                  teacherOptions={teacherOptions}
                />
              ))}
            </ul>
          </Card>
        )}
      </section>
    </div>
  );
}

/** La valeur de liste « sans professeur » : une liste shadcn n'a pas de valeur vide. */
const NO_TEACHER = "none";

function CreateSchoolForm() {
  const createMySchool = useMutation(api.schoolSpace.createMySchool);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const { busy, error, run } = useAsyncAction("L'école n'a pas pu être créée.");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await run(() => createMySchool({ name, city: city || undefined }));
  }

  return (
    <Card as="form" onSubmit={submit} className="mx-auto max-w-md space-y-4 p-6">
      <CardTitle icon={School} description="Une dernière étape avant d'inviter vos professeurs.">
        Votre école
      </CardTitle>
      <Field label="Nom de l'école" htmlFor="school-name">
        <Input
          id="school-name"
          type="text"
          required
          maxLength={80}
          autoComplete="organization"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </Field>
      <Field label="Ville (facultatif)" htmlFor="school-city">
        <Input
          id="school-city"
          type="text"
          maxLength={80}
          autoComplete="address-level2"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
      </Field>
      {error && <Notice tone="error">{error}</Notice>}
      <Button type="submit" busy={busy} className="w-full">
        Créer mon école
      </Button>
    </Card>
  );
}

function JoinCodeCard({ code }: { code: string | null }) {
  const regenerate = useMutation(api.schoolSpace.regenerateJoinCode);
  const create = useAsyncAction("Le code n'a pas pu être créé.");

  return (
    <Card as="section" aria-label="Code école" className="p-5">
      <CardTitle
        icon={School}
        description="Donnez ce code à vos professeurs. Ils créent leur compte professeur, puis le saisissent dans « Mes classes » pour rejoindre l'école."
      >
        Code école
      </CardTitle>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {code ? (
          <>
            <CodeChip code={code} size="lg" label="code école" />
            <ConfirmAction
              danger={false}
              trigger={
                <>
                  <RefreshCw className="h-4 w-4" aria-hidden />
                  Changer le code
                </>
              }
              message="L'ancien code ne marchera plus. Les professeurs déjà dans l'école y restent."
              confirmLabel="Changer le code"
              failMessage="Le code n'a pas pu être changé."
              onConfirm={() => regenerate({})}
            />
          </>
        ) : (
          <Button busy={create.busy} onClick={() => void create.run(() => regenerate({}))}>
            Créer un code école
          </Button>
        )}
      </div>
      {create.error && (
        <Notice tone="error" className="mt-3">
          {create.error}
        </Notice>
      )}
    </Card>
  );
}

function ClassRow({
  schoolClass,
  teacherOptions,
}: {
  schoolClass: {
    _id: Id<"schoolClasses">;
    class: string;
    label: string;
    teacherId: Id<"profiles"> | null;
    studentCount: number;
  };
  teacherOptions: SelectOption[];
}) {
  const assign = useMutation(api.schoolSpace.assignClassTeacher);
  const { busy, error, run } = useAsyncAction("Le professeur n'a pas pu être changé.");
  const name = `${schoolClass.class} ${schoolClass.label}`;

  return (
    <li className="px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1 basis-32">
          <p className="break-words font-medium text-stone-900">{name}</p>
          <p className="text-sm text-stone-600">
            {plural(schoolClass.studentCount, "élève")}
          </p>
          {!schoolClass.teacherId && (
            <span className="mt-1 inline-block rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
              Sans professeur
            </span>
          )}
        </div>
        <SelectField
          aria-label={`Professeur de la classe ${name}`}
          value={schoolClass.teacherId ?? NO_TEACHER}
          disabled={busy}
          options={teacherOptions}
          className="w-full sm:w-56"
          onValueChange={(next) =>
            void run(() =>
              assign({
                schoolClassId: schoolClass._id,
                teacherId:
                  next === NO_TEACHER ? undefined : (next as Id<"profiles">),
              }),
            )
          }
        />
        <ButtonLink
          href={`/school/classes/detail?id=${schoolClass._id}`}
          variant="secondary"
          aria-label={`Élèves de la classe ${name}`}
          className="w-full sm:w-auto"
        >
          Élèves
          <ArrowRight className="h-4 w-4" aria-hidden />
        </ButtonLink>
      </div>
      {error && (
        <Notice tone="error" className="mt-2">
          {error}
        </Notice>
      )}
    </li>
  );
}

function CreateClassForm({
  teacherOptions,
  close,
}: {
  teacherOptions: SelectOption[];
  close: () => void;
}) {
  const createClass = useMutation(api.schoolSpace.createSchoolClass);
  const [level, setLevel] = useState<VisibleClassName>("CP");
  const [label, setLabel] = useState("");
  const [teacherId, setTeacherId] = useState(NO_TEACHER);
  const { busy, error, run } = useAsyncAction("La classe n'a pas pu être créée.");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const done = await run(async () => {
      await createClass({
        class: level,
        label,
        teacherId:
          teacherId === NO_TEACHER ? undefined : (teacherId as Id<"profiles">),
      });
      return true;
    });
    if (done) close();
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-[8rem_1fr]">
        <Field label="Niveau" htmlFor="new-class-level">
          <SelectField
            id="new-class-level"
            value={level}
            onValueChange={setLevel}
            options={CLASS_OPTIONS}
          />
        </Field>
        <Field
          label="Nom"
          htmlFor="new-class-label"
          hint="A, B… Laissez vide pour « A »."
        >
          <Input
            id="new-class-label"
            type="text"
            maxLength={30}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="A"
          />
        </Field>
      </div>
      <Field
        label="Professeur"
        htmlFor="new-class-teacher"
        hint="Vous pouvez le choisir plus tard."
      >
        <SelectField
          id="new-class-teacher"
          value={teacherId}
          onValueChange={setTeacherId}
          options={teacherOptions}
        />
      </Field>
      {error && <Notice tone="error">{error}</Notice>}
      <DialogActions onCancel={close}>
        <Button type="submit" busy={busy}>
          Créer la classe
        </Button>
      </DialogActions>
    </form>
  );
}
