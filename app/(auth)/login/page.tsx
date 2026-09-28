"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signIn("password", { email, password, flow: "signIn" });
  // `router.replace` ET NON `window.location.href` : dans l'application
  // Capacitor, une navigation de DOCUMENT recharge toujours la racine
  // `index.html`, quel que soit le chemin demandé
  // (`CapacitorRouter.route(for:)` renvoie `/index.html` pour tout chemin
  // sans extension). La redirection se perdait donc sur mobile, et l'écran
  // revenait à la connexion après une authentification pourtant réussie.
  // Une navigation interne de Next ne traverse pas ce routeur.
      router.replace("/post-auth");
    } catch {
      setError("Identifiant ou mot de passe incorrect");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-center mb-2">Se connecter</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">
          Email ou code de connexion
        </label>
        {/*
          `type="text"` ET NON `type="email"`, PARCE QU'UN ÉLÈVE N'A PAS
          D'ADRESSE. Son identifiant est le code imprimé sur son billet —
          `CM1A-9180` — et `studentImportRun` le pose tel quel comme
          identifiant de compte. Avec `type="email"`, la validation native du
          navigateur refusait la saisie avant tout appel réseau : « Enter an
          email address ». Aucun élève créé par une école ne pouvait se
          connecter, sur aucune plateforme.

          `autoCapitalize="none"` et `autoCorrect="off"` : sur mobile, le
          clavier mettait une majuscule initiale et corrigeait le code. La
          casse n'est pas le problème — `convex/auth.ts` met en minuscules à
          la connexion — mais une correction automatique, si.
        */}
        <input
          type="text"
          inputMode="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          Élève : saisissez le code de votre billet, comme mot de passe aussi.
        </p>
      </div>

      <div>
        <div className="flex items-baseline justify-between mb-1">
          <label className="block text-sm font-medium">Mot de passe</label>
          <Link
            href="/forgot-password"
            className="text-xs font-medium text-amber-700 hover:underline"
          >
            Mot de passe oublié ?
          </Link>
        </div>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gray-900 text-white py-2.5 rounded-lg font-semibold hover:bg-gray-800 disabled:opacity-50 transition-colors"
      >
        {loading ? "Connexion..." : "Se connecter"}
      </button>

      <p className="text-center text-sm text-gray-600">
        Parent avec un code de l&apos;école ?{" "}
        <Link href="/register" className="font-medium text-amber-700 hover:underline">
          Activer votre espace
        </Link>
      </p>
      <p className="text-center text-xs text-gray-500">
        Élèves et personnel : vos identifiants vous sont remis par votre
        établissement.
      </p>
    </form>
  );
}
