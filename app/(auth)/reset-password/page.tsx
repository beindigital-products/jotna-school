"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function ResetPasswordForm() {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") ?? "";

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.set("email", email);
      formData.set("code", code);
      formData.set("newPassword", newPassword);
      formData.set("flow", "reset-verification");
      await signIn("password", formData);
  // `router.replace` ET NON `window.location.href` : dans l'application
  // Capacitor, une navigation de DOCUMENT recharge toujours la racine
  // `index.html`, quel que soit le chemin demandé
  // (`CapacitorRouter.route(for:)` renvoie `/index.html` pour tout chemin
  // sans extension). La redirection se perdait donc sur mobile, et l'écran
  // revenait à la connexion après une authentification pourtant réussie.
  // Une navigation interne de Next ne traverse pas ce routeur.
      router.replace("/post-auth");
    } catch {
      setError("Code invalide ou expiré. Demandez un nouveau code.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-center mb-2">
        Nouveau mot de passe
      </h1>
      <p className="text-center text-sm text-gray-600 mb-2">
        Entrez le code reçu par email et choisissez un nouveau mot de passe.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Code de vérification
        </label>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          required
          value={code}
          onChange={(e) => setCode(e.target.value.trim())}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 tracking-widest text-center font-mono"
          placeholder="123456"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Nouveau mot de passe
        </label>
        <input
          type="password"
          required
          minLength={6}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Confirmer le mot de passe
        </label>
        <input
          type="password"
          required
          minLength={6}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gray-900 text-white py-2.5 rounded-lg font-semibold hover:bg-gray-800 disabled:opacity-50 transition-colors"
      >
        {loading ? "Validation..." : "Réinitialiser le mot de passe"}
      </button>

      <p className="text-center text-sm text-gray-600">
        Pas reçu de code ?{" "}
        <Link
          href="/forgot-password"
          className="font-medium text-amber-700 hover:underline"
        >
          Renvoyer un code
        </Link>
      </p>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
