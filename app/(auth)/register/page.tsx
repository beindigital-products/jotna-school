"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Ticket } from "lucide-react";
import { refusalMessage } from "@/lib/refusalMessage";

/**
 * L'ENTRÉE D'UN PARENT, ET LA SEULE.
 *
 * CET ÉCRAN N'INSCRIT PLUS PERSONNE LIBREMENT. Il proposait un menu de rôles
 * et créait le compte demandé en trente secondes ; Jotna se vend aux écoles,
 * donc `convex/auth.ts` refuse maintenant `flow: "signUp"` et aucun formulaire
 * ne peut plus ouvrir un compte de sa propre initiative.
 *
 * CE QUI AUTORISE, C'EST LE CODE — celui imprimé sur le billet que l'école
 * remet à la famille, émis pour un élève nommé, à usage unique et daté. Le
 * serveur le vérifie AVANT de créer quoi que ce soit
 * (`parentLink.signUpWithCode`).
 *
 * LA CONNEXION SUIT LA CRÉATION, dans la foulée. L'action serveur crée le
 * compte mais n'ouvre pas de session : sans ce second appel, la famille
 * devrait retaper les mêmes identifiants sur l'écran d'à côté.
 *
 * NI ÉLÈVE NI PERSONNEL ICI. Un élève reçoit un code de connexion de son
 * école et entre par `/login`. Un directeur ou un professeur reçoit ses
 * identifiants de l'équipe Jotna (`schools.provisionStaffAccount`).
 */
export default function ParentActivationPage() {
  const { signIn } = useAuthActions();
  const signUpWithCode = useAction(api.parentLink.signUpWithCode);
  const router = useRouter();

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    try {
      await signUpWithCode({ code, name, email, password });
    } catch (err) {
      // Le serveur distingue code inconnu, code déjà utilisé et code expiré :
      // trois gestes différents pour la famille. On affiche sa phrase.
      setError(
        refusalMessage(err, "Ce code n'a pas pu être utilisé."),
      );
      setLoading(false);
      return;
    }

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
      // Le compte EXISTE : seule la session a échoué. On envoie vers la
      // connexion plutôt que de laisser croire que rien n'a été créé.
      setError(
        "Votre compte est créé, mais la connexion a échoué. " +
          "Connectez-vous avec l'adresse et le mot de passe que vous venez " +
          "de choisir.",
      );
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-center mb-1">
        Activer votre espace parent
      </h1>
      <p className="text-center text-sm text-gray-600 mb-2">
        Saisissez le code inscrit sur le billet remis par l&apos;école de votre
        enfant.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">
          Code de l&apos;école
        </label>
        <div className="relative">
          <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            required
            autoCapitalize="characters"
            spellCheck={false}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="fam-xxxxxx"
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg font-mono tracking-wide focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Le code ne contient ni O, ni I, ni zéro.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Votre nom</label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </div>

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
        <label className="block text-sm font-medium mb-1">Mot de passe</label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            required
            minLength={6}
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

      <div>
        <label className="block text-sm font-medium mb-1">
          Confirmer le mot de passe
        </label>
        <div className="relative">
          <input
            type={showConfirmPassword ? "text" : "password"}
            required
            minLength={6}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gray-900 text-white py-2.5 rounded-lg font-semibold hover:bg-gray-800 disabled:opacity-50 transition-colors"
      >
        {loading ? "Activation..." : "Activer mon espace"}
      </button>

      <p className="text-center text-sm text-gray-600">
        Déjà un compte ?{" "}
        <Link
          href="/login"
          className="font-medium text-amber-700 hover:underline"
        >
          Se connecter
        </Link>
      </p>
      <p className="text-center text-xs text-gray-500">
        Élève, professeur ou directeur : vos identifiants vous sont remis par
        votre école. Connectez-vous directement.
      </p>
    </form>
  );
}
