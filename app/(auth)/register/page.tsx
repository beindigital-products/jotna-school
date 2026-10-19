"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  GraduationCap,
  Heart,
  School,
  Ticket,
} from "lucide-react";
import type { RegisterParams } from "@/lib/auth";

/**
 * INSCRIPTION LIBRE — écoles, professeurs, parents.
 *
 * Deux étapes : choisir le type de compte, puis remplir un formulaire court.
 * Le serveur filtre le rôle (`convex/auth.ts`, `openAccessRules`) : jamais
 * d'élève ici. Un enfant reçoit son compte d'un parent ou d'un professeur et
 * se connecte dans l'application avec son code.
 *
 * `?role=directeur|professeur|parent` présélectionne le type, pour les
 * boutons de la page d'accueil.
 */

type AccountType = RegisterParams["role"];

const ACCOUNT_TYPES: {
  role: AccountType;
  title: string;
  description: string;
  icon: typeof School;
  accent: string;
}[] = [
  {
    role: "parent",
    title: "Parent",
    description: "Je crée le compte de mes enfants et je suis leurs progrès.",
    icon: Heart,
    accent: "bg-lime-100 text-lime-700",
  },
  {
    role: "professeur",
    title: "Professeur",
    description: "Je crée mes classes et j'y ajoute mes élèves.",
    icon: GraduationCap,
    accent: "bg-amber-100 text-amber-700",
  },
  {
    role: "directeur",
    title: "École",
    description: "J'inscris mon école et j'invite mes professeurs.",
    icon: School,
    accent: "bg-sky-100 text-sky-700",
  },
];

function isAccountType(value: string | null): value is AccountType {
  return value === "parent" || value === "professeur" || value === "directeur";
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterFlow />
    </Suspense>
  );
}

function RegisterFlow() {
  const params = useSearchParams();
  const preset = params.get("role");
  const [role, setRole] = useState<AccountType | null>(
    isAccountType(preset) ? preset : null,
  );

  if (role === null) return <ChooseAccountType onChoose={setRole} />;
  return <RegisterForm role={role} onBack={() => setRole(null)} />;
}

function ChooseAccountType({
  onChoose,
}: {
  onChoose: (role: AccountType) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Créer un compte</h1>
        <p className="mt-1 text-sm text-gray-600">
          Gratuit. Vous êtes :
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {ACCOUNT_TYPES.map(({ role, title, description, icon: Icon, accent }) => (
          <button
            key={role}
            type="button"
            onClick={() => onChoose(role)}
            className="flex items-center gap-4 rounded-xl border border-gray-200 p-4 text-left transition hover:border-gray-900 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${accent}`}
            >
              <Icon className="h-5 w-5" />
            </span>
            <span>
              <span className="block font-semibold text-gray-900">{title}</span>
              <span className="block text-sm text-gray-600">{description}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="rounded-lg bg-gray-50 px-4 py-3 text-xs text-gray-600">
        <strong className="font-semibold text-gray-800">Élève ?</strong> Tu
        n&apos;as rien à remplir ici. Ton parent ou ton professeur crée ton
        compte et te donne ton code pour te connecter dans l&apos;application.
      </div>

      <p className="text-center text-sm text-gray-600">
        Déjà un compte ?{" "}
        <Link href="/login" className="font-medium text-amber-700 hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}

function RegisterForm({
  role,
  onBack,
}: {
  role: AccountType;
  onBack: () => void;
}) {
  const { signIn } = useAuthActions();
  const createMySchool = useMutation(api.schoolSpace.createMySchool);
  const router = useRouter();

  const [schoolName, setSchoolName] = useState("");
  const [city, setCity] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const type = ACCOUNT_TYPES.find((t) => t.role === role)!;
  const isSchool = role === "directeur";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signIn("password", { flow: "signUp", email, password, name, role });
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      setError(
        /already exists|existe/i.test(message)
          ? "Un compte existe déjà avec cette adresse. Connectez-vous."
          : "Le compte n'a pas pu être créé. Vérifiez l'adresse et le mot de passe (6 caractères minimum).",
      );
      setLoading(false);
      return;
    }

    if (isSchool) {
      // Le compte existe déjà ; si l'école échoue ici, l'espace école
      // proposera de la créer à la première visite.
      try {
        await createMySchool({ name: schoolName, city: city || undefined });
      } catch {
        /* reprise dans /school/dashboard */
      }
    }

    // `router.replace` et non `window.location` : voir la page de connexion
    // (routeur Capacitor).
    router.replace("/post-auth");
  }

  const input =
    "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex w-fit items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Changer de type de compte
      </button>

      <div className="flex items-center gap-3">
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-full ${type.accent}`}
        >
          <type.icon className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-xl font-bold">Compte {type.title.toLowerCase()}</h1>
          <p className="text-sm text-gray-600">{type.description}</p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {isSchool && (
        <>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Nom de l&apos;école
            </label>
            <input
              type="text"
              required
              maxLength={80}
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              placeholder="École Les Manguiers"
              className={input}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Ville <span className="font-normal text-gray-400">(facultatif)</span>
            </label>
            <input
              type="text"
              maxLength={80}
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className={input}
            />
          </div>
        </>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium">
          {isSchool ? "Votre nom (direction)" : "Votre nom"}
        </label>
        <input
          type="text"
          required
          maxLength={80}
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={input}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Email</label>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={input}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Mot de passe</label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            required
            minLength={6}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`${input} pr-10`}
          />
          <button
            type="button"
            tabIndex={-1}
            aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-500">6 caractères minimum.</p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-gray-900 py-2.5 font-semibold text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
      >
        {loading ? "Création..." : "Créer mon compte"}
      </button>

      {role === "parent" && (
        <Link
          href="/register/code"
          className="inline-flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <Ticket className="h-4 w-4" />
          L&apos;école m&apos;a remis un code ? Utilisez-le ici
        </Link>
      )}

      <p className="text-center text-sm text-gray-600">
        Déjà un compte ?{" "}
        <Link href="/login" className="font-medium text-amber-700 hover:underline">
          Se connecter
        </Link>
      </p>
    </form>
  );
}
