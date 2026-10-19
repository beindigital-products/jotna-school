"use client";

import { useState } from "react";
import Link from "next/link";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  ArrowLeft,
  KeyRound,
  Loader2,
  Printer,
  Smartphone,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react";
import { refusalMessage } from "@/lib/refusalMessage";
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
}: {
  schoolClassId: Id<"schoolClasses">;
  backHref: string;
}) {
  const detail = useQuery(api.classrooms.classDetail, { schoolClassId });

  if (detail === undefined) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }
  if (detail === null) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-gray-200 bg-white p-8 text-center">
        <p className="text-sm text-gray-600">
          Cette classe n&apos;existe pas, ou vous n&apos;y avez pas accès.
        </p>
        <Link href={backHref} className="mt-4 inline-block text-sm font-medium text-amber-700 hover:underline">
          Retour
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux classes
        </Link>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {detail.class} {detail.label}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {[detail.schoolName, detail.teacherName && `Professeur : ${detail.teacherName}`]
              .filter(Boolean)
              .join(" · ") || "Votre classe"}
            {" · "}
            {detail.students.length} élève{detail.students.length !== 1 ? "s" : ""}
          </p>
        </div>
        {detail.students.length > 0 && (
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 print:hidden"
          >
            <Printer className="h-4 w-4" />
            Imprimer les codes
          </button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 print:hidden">
        <CreateStudentCard schoolClassId={schoolClassId} disabled={detail.full} />
        <AddByCodeCard schoolClassId={schoolClassId} disabled={detail.full} />
      </div>

      <section className="rounded-xl border border-gray-200 bg-white">
        <div className="flex items-start gap-3 border-b border-gray-100 p-4 print:hidden">
          <Smartphone className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <p className="text-sm text-gray-600">
            Chaque élève se connecte dans l&apos;application Jotna School avec
            son <strong>code de connexion</strong>, tapé deux fois : comme
            identifiant et comme mot de passe.
          </p>
        </div>

        {detail.students.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-2 text-sm text-gray-500">
              Aucun élève pour l&apos;instant. Créez un compte ou ajoutez un
              élève avec son code.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {detail.students.map((s) => (
              <StudentRow key={s.membershipId} student={s} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StudentRow({
  student,
}: {
  student: {
    membershipId: Id<"schoolMemberships">;
    name: string;
    loginCode: string | null;
    hasFamily: boolean;
  };
}) {
  const removeStudent = useMutation(api.classrooms.removeStudent);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  return (
    <li className="flex flex-wrap items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="font-medium text-gray-900">{student.name}</p>
        <p className="text-xs text-gray-500 print:hidden">
          {student.hasFamily ? "Famille connectée" : "Pas encore de parent lié"}
        </p>
      </div>
      {student.loginCode ? (
        <CodeChip code={student.loginCode} size="sm" label="code de connexion" />
      ) : (
        <span className="text-xs text-gray-400">Connexion par email</span>
      )}
      <div className="print:hidden">
        {confirming ? (
          <span className="flex items-center gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await removeStudent({ membershipId: student.membershipId });
                } finally {
                  setBusy(false);
                  setConfirming(false);
                }
              }}
              className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              Retirer
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
            title="Retirer de la classe (le compte de l'élève est conservé)"
            aria-label={`Retirer ${student.name} de la classe`}
          >
            <UserMinus className="h-4 w-4" />
          </button>
        )}
      </div>
    </li>
  );
}

function CreateStudentCard({
  schoolClassId,
  disabled,
}: {
  schoolClassId: Id<"schoolClasses">;
  disabled: boolean;
}) {
  const createStudent = useAction(api.studentAccounts.createStudent);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ name: string; loginCode: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await createStudent({ name, schoolClassId });
      setCreated({ name: result.name, loginCode: result.loginCode });
      setName("");
    } catch (err) {
      setError(refusalMessage(err, "Le compte n'a pas pu être créé."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-center gap-2">
        <UserPlus className="h-5 w-5 text-amber-600" />
        <h2 className="font-semibold text-gray-900">Créer un compte élève</h2>
      </div>
      <p className="mt-1 text-sm text-gray-500">
        Pour un enfant qui n&apos;a pas encore de compte.
      </p>
      <form onSubmit={submit} className="mt-3 flex gap-2">
        <input
          type="text"
          required
          maxLength={80}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Prénom et nom"
          disabled={disabled}
          className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
        <button
          type="submit"
          disabled={busy || disabled}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {busy ? "…" : "Créer"}
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {created && (
        <div className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900">
          <p>
            Compte de <strong>{created.name}</strong> créé. Son code de
            connexion :
          </p>
          <div className="mt-2">
            <CodeChip code={created.loginCode} size="lg" label="code de connexion" />
          </div>
        </div>
      )}
    </div>
  );
}

function AddByCodeCard({
  schoolClassId,
  disabled,
}: {
  schoolClassId: Id<"schoolClasses">;
  disabled: boolean;
}) {
  const addStudentByCode = useMutation(api.classrooms.addStudentByCode);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const preview = useQuery(
    api.classrooms.previewStudentCode,
    code.trim().length >= 6 ? { code, schoolClassId } : "skip",
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setDone(null);
    try {
      const result = await addStudentByCode({ code, schoolClassId });
      setDone(
        result.moved
          ? `${result.name} a rejoint votre classe (et quitté son ancienne classe).`
          : `${result.name} a rejoint votre classe.`,
      );
      setCode("");
    } catch (err) {
      setError(refusalMessage(err, "L'élève n'a pas pu être ajouté."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-center gap-2">
        <KeyRound className="h-5 w-5 text-lime-600" />
        <h2 className="font-semibold text-gray-900">Ajouter avec un code élève</h2>
      </div>
      <p className="mt-1 text-sm text-gray-500">
        L&apos;enfant a déjà un compte ? Demandez son code élève à sa famille
        (il commence par ELV-).
      </p>
      <form onSubmit={submit} className="mt-3 flex gap-2">
        <input
          type="text"
          required
          autoCapitalize="characters"
          spellCheck={false}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="ELV-XXXXXX"
          disabled={disabled}
          className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-lime-500"
        />
        <button
          type="submit"
          disabled={busy || disabled || preview?.status !== "ready" || preview.alreadyHere}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {busy ? "…" : "Ajouter"}
        </button>
      </form>
      {preview?.status === "ready" && !done && (
        <p className="mt-2 text-sm text-gray-700">
          {preview.alreadyHere
            ? `${preview.name} est déjà dans cette classe.`
            : preview.inAnotherClass
              ? `${preview.name} est dans une autre classe : il passera dans la vôtre.`
              : `Élève trouvé : ${preview.name}.`}
        </p>
      )}
      {preview?.status === "unknown" && (
        <p className="mt-2 text-sm text-gray-500">Aucun élève ne porte ce code.</p>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {done && <p className="mt-2 text-sm text-emerald-700">{done}</p>}
    </div>
  );
}
