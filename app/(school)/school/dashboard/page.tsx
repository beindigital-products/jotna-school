"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { VISIBLE_CLASSES, type VisibleClassName } from "@/convex/curriculum";
import {
  ArrowRight,
  GraduationCap,
  Loader2,
  Plus,
  RefreshCw,
  School,
  UserMinus,
} from "lucide-react";
import { refusalMessage } from "@/lib/refusalMessage";
import { CodeChip } from "@/components/classroom/code-chip";

/**
 * TABLEAU DE BORD DE L'ÉCOLE.
 *
 * Trois blocs, dans l'ordre où une direction en a besoin : le code école à
 * partager, les professeurs qui l'ont saisi, puis les classes. Si l'école
 * n'existe pas encore (création interrompue à l'inscription), on la crée ici.
 */
export default function SchoolDashboardPage() {
  const data = useQuery(api.schoolSpace.mySchool);

  if (data === undefined) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }
  if (data === null) return null;
  if (data.school === null) return <CreateSchoolForm />;

  const { school, teachers, classes } = data;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{school.name}</h1>
        <p className="mt-1 text-sm text-gray-500">
          {[school.city, `${teachers.length} professeur${teachers.length !== 1 ? "s" : ""}`, `${classes.length} classe${classes.length !== 1 ? "s" : ""}`]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>

      <JoinCodeCard code={school.joinCode} />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Professeurs</h2>
        {teachers.length === 0 ? (
          <p className="rounded-xl border-2 border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
            Aucun professeur pour l&apos;instant. Partagez le code école
            ci-dessus : chaque professeur le saisit dans son espace, rubrique
            « Mes classes ».
          </p>
        ) : (
          <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
            {teachers.map((t) => (
              <TeacherRow key={t.profileId} teacher={t} />
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Classes</h2>
        {classes.length > 0 && (
          <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
            {classes.map((c) => (
              <ClassRow key={c._id} schoolClass={c} teachers={teachers} />
            ))}
          </ul>
        )}
        <CreateClassForm teachers={teachers} />
      </section>
    </div>
  );
}

function CreateSchoolForm() {
  const createMySchool = useMutation(api.schoolSpace.createMySchool);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await createMySchool({ name, city: city || undefined });
    } catch (err) {
      setError(refusalMessage(err, "L'école n'a pas pu être créée."));
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="mx-auto max-w-md space-y-4 rounded-2xl border border-gray-200 bg-white p-6"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-sky-700">
          <School className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-lg font-bold text-gray-900">Votre école</h1>
          <p className="text-sm text-gray-500">Une dernière étape.</p>
        </div>
      </div>
      <input
        type="text"
        required
        maxLength={80}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nom de l'école"
        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
      />
      <input
        type="text"
        maxLength={80}
        value={city}
        onChange={(e) => setCity(e.target.value)}
        placeholder="Ville (facultatif)"
        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-lg bg-gray-900 py-2.5 font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {busy ? "Création..." : "Créer mon école"}
      </button>
    </form>
  );
}

function JoinCodeCard({ code }: { code: string | null }) {
  const regenerate = useMutation(api.schoolSpace.regenerateJoinCode);
  const [confirming, setConfirming] = useState(false);

  return (
    <section className="rounded-xl border border-sky-200 bg-sky-50 p-5">
      <h2 className="font-semibold text-sky-900">Code école</h2>
      <p className="mt-1 text-sm text-sky-900/80">
        Donnez ce code à vos professeurs. Ils créent leur compte professeur,
        puis le saisissent dans « Mes classes » pour rejoindre l&apos;école.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        {code ? (
          <CodeChip code={code} size="lg" label="code école" />
        ) : (
          <span className="text-sm text-sky-900/70">Aucun code pour l&apos;instant.</span>
        )}
        {confirming ? (
          <span className="flex items-center gap-2 text-sm">
            <span className="text-sky-900">L&apos;ancien code ne marchera plus.</span>
            <button
              type="button"
              onClick={async () => {
                await regenerate({});
                setConfirming(false);
              }}
              className="rounded-md bg-sky-700 px-2.5 py-1 text-xs font-medium text-white hover:bg-sky-800"
            >
              Changer
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="text-xs text-sky-900/70 hover:text-sky-900"
            >
              Annuler
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="inline-flex items-center gap-1 text-sm text-sky-800 hover:underline"
          >
            <RefreshCw className="h-4 w-4" />
            {code ? "Changer le code" : "Créer un code"}
          </button>
        )}
      </div>
    </section>
  );
}

type Teacher = { profileId: Id<"profiles">; name: string; email: string | null };

function TeacherRow({ teacher }: { teacher: Teacher }) {
  const removeTeacher = useMutation(api.schoolSpace.removeTeacher);
  const [confirming, setConfirming] = useState(false);

  return (
    <li className="flex flex-wrap items-center gap-3 px-4 py-3">
      <GraduationCap className="h-5 w-5 text-amber-600" />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-gray-900">{teacher.name}</p>
        {teacher.email && <p className="text-xs text-gray-500">{teacher.email}</p>}
      </div>
      {confirming ? (
        <span className="flex items-center gap-2">
          <button
            type="button"
            onClick={async () => {
              await removeTeacher({ profileId: teacher.profileId });
              setConfirming(false);
            }}
            className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700"
          >
            Retirer de l&apos;école
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="text-xs text-gray-500 hover:text-gray-800"
          >
            Annuler
          </button>
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-600"
          title="Retirer de l'école (ses classes restent dans l'école)"
          aria-label={`Retirer ${teacher.name} de l'école`}
        >
          <UserMinus className="h-4 w-4" />
        </button>
      )}
    </li>
  );
}

function ClassRow({
  schoolClass,
  teachers,
}: {
  schoolClass: {
    _id: Id<"schoolClasses">;
    class: string;
    label: string;
    teacherId: Id<"profiles"> | null;
    studentCount: number;
  };
  teachers: Teacher[];
}) {
  const assign = useMutation(api.schoolSpace.assignClassTeacher);

  return (
    <li className="flex flex-wrap items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="font-medium text-gray-900">
          {schoolClass.class} {schoolClass.label}
        </p>
        <p className="text-xs text-gray-500">
          {schoolClass.studentCount} élève{schoolClass.studentCount !== 1 ? "s" : ""}
        </p>
      </div>
      <select
        value={schoolClass.teacherId ?? ""}
        onChange={(e) =>
          assign({
            schoolClassId: schoolClass._id,
            teacherId: e.target.value
              ? (e.target.value as Id<"profiles">)
              : undefined,
          })
        }
        className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
        aria-label="Professeur de la classe"
      >
        <option value="">Sans professeur</option>
        {teachers.map((t) => (
          <option key={t.profileId} value={t.profileId}>
            {t.name}
          </option>
        ))}
      </select>
      <Link
        href={`/school/classes/detail?id=${schoolClass._id}`}
        className="inline-flex items-center gap-1 text-sm font-medium text-sky-700 hover:underline"
      >
        Élèves
        <ArrowRight className="h-4 w-4" />
      </Link>
    </li>
  );
}

function CreateClassForm({ teachers }: { teachers: Teacher[] }) {
  const createClass = useMutation(api.schoolSpace.createSchoolClass);
  const [level, setLevel] = useState<VisibleClassName>("CP");
  const [label, setLabel] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await createClass({
        class: level,
        label,
        teacherId: teacherId ? (teacherId as Id<"profiles">) : undefined,
      });
      setLabel("");
    } catch (err) {
      setError(refusalMessage(err, "La classe n'a pas pu être créée."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-2">
        <Plus className="h-4 w-4 text-sky-600" />
        <span className="text-sm font-semibold text-gray-900">Nouvelle classe</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value as VisibleClassName)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          aria-label="Niveau"
        >
          {VISIBLE_CLASSES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input
          type="text"
          maxLength={30}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Nom (ex. A, B)"
          className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <select
          value={teacherId}
          onChange={(e) => setTeacherId(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          aria-label="Professeur"
        >
          <option value="">Sans professeur</option>
          {teachers.map((t) => (
            <option key={t.profileId} value={t.profileId}>
              {t.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {busy ? "…" : "Créer"}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </form>
  );
}
