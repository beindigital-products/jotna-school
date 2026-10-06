"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { VISIBLE_CLASSES, type VisibleClassName } from "@/convex/curriculum";
import { ArrowRight, Loader2, Plus, School, Users } from "lucide-react";
import { refusalMessage } from "@/lib/refusalMessage";

/**
 * MES CLASSES — le cœur de l'espace professeur en accès libre.
 *
 * Un professeur crée ses classes ici, puis y ajoute ses élèves (page de
 * détail). Avec le code de son école, il la rejoint : ses classes y passent.
 */
export default function TeacherClassesPage() {
  const data = useQuery(api.classrooms.myClasses);

  if (data === undefined) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }
  if (data === null) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mes classes</h1>
        <p className="mt-1 text-sm text-gray-500">
          Créez une classe, puis ajoutez-y vos élèves.
        </p>
      </div>

      {data.classes.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-300 p-8 text-center">
          <Users className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-2 font-medium text-gray-700">
            Vous n&apos;avez pas encore de classe.
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Commencez par en créer une ci-dessous.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.classes.map((c) => (
            <Link
              key={c._id}
              href={`/teacher/classes/detail?id=${c._id}`}
              className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <p className="text-lg font-semibold text-gray-900">
                {c.class} {c.label}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {c.studentCount} élève{c.studentCount !== 1 ? "s" : ""}
                {c.schoolName ? ` · ${c.schoolName}` : ""}
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-amber-700">
                Gérer les élèves
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <CreateClassCard schools={data.schools} />
        <JoinSchoolCard schools={data.schools} />
      </div>
    </div>
  );
}

function CreateClassCard({
  schools,
}: {
  schools: { _id: string; name: string }[];
}) {
  const createMyClass = useMutation(api.classrooms.createMyClass);
  const [level, setLevel] = useState<VisibleClassName>("CP");
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await createMyClass({ class: level, label });
      setLabel("");
    } catch (err) {
      setError(refusalMessage(err, "La classe n'a pas pu être créée."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-center gap-2">
        <Plus className="h-5 w-5 text-amber-600" />
        <h2 className="font-semibold text-gray-900">Nouvelle classe</h2>
      </div>
      <p className="mt-1 text-sm text-gray-500">
        {schools.length > 0
          ? `Elle sera rattachée à ${schools[0].name}.`
          : "Le niveau décide des exercices que verront les élèves."}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value as VisibleClassName)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
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
          placeholder="Nom (ex. A, B, Les lions)"
          className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
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

function JoinSchoolCard({
  schools,
}: {
  schools: { _id: string; name: string; role: string }[];
}) {
  const joinSchool = useMutation(api.classrooms.joinSchoolWithCode);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const preview = useQuery(
    api.classrooms.previewSchoolCode,
    code.trim().length >= 6 ? { code } : "skip",
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await joinSchool({ code });
      setDone(
        result.movedClasses > 0
          ? `Vous avez rejoint ${result.schoolName}. Vos classes y sont maintenant rattachées.`
          : `Vous avez rejoint ${result.schoolName}.`,
      );
      setCode("");
    } catch (err) {
      setError(refusalMessage(err, "Impossible de rejoindre cette école."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-center gap-2">
        <School className="h-5 w-5 text-sky-600" />
        <h2 className="font-semibold text-gray-900">Mon école</h2>
      </div>
      {schools.length > 0 ? (
        <p className="mt-1 text-sm text-gray-700">
          Vous faites partie de{" "}
          <strong>{schools.map((s) => s.name).join(", ")}</strong>.
        </p>
      ) : (
        <p className="mt-1 text-sm text-gray-500">
          Facultatif. Votre école utilise Jotna ? Saisissez le code que vous a
          donné la direction (il commence par ECO-).
        </p>
      )}
      <div className="mt-3 flex gap-2">
        <input
          type="text"
          autoCapitalize="characters"
          spellCheck={false}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="ECO-XXXXXX"
          className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
        <button
          type="submit"
          disabled={busy || preview?.status !== "ready"}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {busy ? "…" : "Rejoindre"}
        </button>
      </div>
      {preview?.status === "ready" && !done && (
        <p className="mt-2 text-sm text-gray-700">
          École trouvée : {preview.name}
          {preview.city ? ` (${preview.city})` : ""}.
        </p>
      )}
      {preview?.status === "unknown" && (
        <p className="mt-2 text-sm text-gray-500">Aucune école ne porte ce code.</p>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {done && <p className="mt-2 text-sm text-emerald-700">{done}</p>}
    </form>
  );
}
