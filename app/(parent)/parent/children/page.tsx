"use client";

import { useState } from "react";
import Link from "next/link";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { VISIBLE_CLASSES, type VisibleClassName } from "@/convex/curriculum";
import {
  ArrowRight,
  GraduationCap,
  KeyRound,
  Loader2,
  Smartphone,
  Ticket,
  UserCircle,
  UserPlus,
} from "lucide-react";
import { refusalMessage } from "@/lib/refusalMessage";
import { CodeChip } from "@/components/classroom/code-chip";

/**
 * MES ENFANTS — accès libre.
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mes enfants</h1>
        <p className="mt-1 text-sm text-gray-500">
          Créez le compte de vos enfants, puis suivez leurs progrès.
        </p>
      </div>

      <HowItWorks />

      {children === undefined ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : children === null ? null : (
        <>
          {children.length > 0 && (
            <div className="grid gap-4 lg:grid-cols-2">
              {children.map((child) => (
                <ChildCard key={child._id} child={child} />
              ))}
            </div>
          )}
          <AddChildForm first={children.length === 0} />
        </>
      )}

      <p className="text-sm text-gray-500">
        <Ticket className="mr-1 inline h-4 w-4" />
        L&apos;école de votre enfant vous a remis un billet avec un code PIO- ?{" "}
        <Link
          href="/parent/children/code"
          className="font-medium text-teal-700 hover:underline"
        >
          Saisissez-le ici
        </Link>
        .
      </p>
    </div>
  );
}

function HowItWorks() {
  const steps = [
    { icon: UserPlus, text: "Créez le compte de votre enfant (nom et classe)." },
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
      {steps.map(({ icon: Icon, text }, i) => (
        <li
          key={i}
          className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-lime-100 text-sm font-bold text-lime-800">
            {i + 1}
          </span>
          <span className="text-sm text-gray-700">
            <Icon className="mb-1 h-4 w-4 text-lime-700" />
            {text}
          </span>
        </li>
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
  const setChildLevel = useMutation(api.family.setChildLevel);
  const [busy, setBusy] = useState(false);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        {child.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={child.avatar} alt="" className="h-12 w-12 rounded-full object-cover" />
        ) : (
          <UserCircle className="h-12 w-12 text-gray-300" />
        )}
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-gray-900">{child.name}</h3>
          {child.classroom ? (
            <p className="text-sm text-gray-500">
              {child.classroom.name}
              {child.classroom.teacherName ? ` · ${child.classroom.teacherName}` : ""}
              {child.classroom.schoolName ? ` · ${child.classroom.schoolName}` : ""}
            </p>
          ) : (
            <label className="mt-0.5 flex items-center gap-2 text-sm text-gray-500">
              Classe :
              <select
                value={child.level ?? ""}
                onChange={(e) =>
                  setChildLevel({
                    studentId: child._id,
                    level: e.target.value as VisibleClassName,
                  })
                }
                className="rounded-md border border-gray-300 px-1.5 py-0.5 text-sm text-gray-800"
              >
                {!child.level && <option value="">À choisir</option>}
                {VISIBLE_CLASSES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-gray-500">
            <Smartphone className="h-3.5 w-3.5" />
            Code de connexion, pour votre enfant
          </p>
          <div className="mt-1">
            {child.loginCode ? (
              <CodeChip code={child.loginCode} label="code de connexion" />
            ) : (
              <span className="text-sm text-gray-500">
                Votre enfant se connecte avec son adresse email.
              </span>
            )}
          </div>
          {child.loginCode && (
            <p className="mt-1 text-xs text-gray-500">
              À taper deux fois dans l&apos;application : identifiant et mot de passe.
            </p>
          )}
        </div>

        <div>
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-gray-500">
            <KeyRound className="h-3.5 w-3.5" />
            Code élève, pour son professeur
          </p>
          <div className="mt-1">
            {child.studentCode ? (
              <CodeChip code={child.studentCode} label="code élève" />
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await ensureStudentCode({ studentId: child._id });
                  } finally {
                    setBusy(false);
                  }
                }}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Afficher le code élève
              </button>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {child.classroom
              ? "Pour changer de classe, donnez ce code au nouveau professeur."
              : "Le professeur le saisit pour ajouter votre enfant à sa classe."}
          </p>
        </div>
      </div>

      <Link
        href={`/parent/children/progress?id=${child._id}`}
        className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
      >
        Voir la progression
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function AddChildForm({ first }: { first: boolean }) {
  const createStudent = useAction(api.studentAccounts.createStudent);
  const [name, setName] = useState("");
  const [level, setLevel] = useState<VisibleClassName | "">("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ name: string; loginCode: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!level) {
      setError("Choisissez la classe de votre enfant.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await createStudent({ name, level });
      setCreated({ name: result.name, loginCode: result.loginCode });
      setName("");
      setLevel("");
    } catch (err) {
      setError(refusalMessage(err, "Le compte n'a pas pu être créé."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className={`rounded-xl border p-5 ${first ? "border-lime-300 bg-lime-50" : "border-gray-200 bg-white"}`}
    >
      <div className="flex items-center gap-2">
        <UserPlus className="h-5 w-5 text-lime-700" />
        <h2 className="font-semibold text-gray-900">
          {first ? "Créez le compte de votre premier enfant" : "Ajouter un enfant"}
        </h2>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <input
          type="text"
          required
          maxLength={80}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Prénom et nom"
          className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500"
        />
        <select
          required
          value={level}
          onChange={(e) => setLevel(e.target.value as VisibleClassName)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500"
          aria-label="Classe"
        >
          <option value="">Classe</option>
          {VISIBLE_CLASSES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {busy ? "Création..." : "Créer le compte"}
        </button>
      </div>
      <p className="mt-2 text-xs text-gray-500">
        La classe choisit les exercices adaptés. Elle se modifie ensuite si
        besoin.
      </p>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {created && (
        <div className="mt-3 rounded-lg bg-white p-3 text-sm text-gray-800 ring-1 ring-emerald-200">
          <p>
            Le compte de <strong>{created.name}</strong> est prêt. Son code de
            connexion pour l&apos;application :
          </p>
          <div className="mt-2">
            <CodeChip code={created.loginCode} size="lg" label="code de connexion" />
          </div>
        </div>
      )}
    </form>
  );
}
