"use client";

import { useId, useState, type FormEvent } from "react";
import { useConvex } from "convex/react";
import { ArrowRight, Loader2, Ticket } from "lucide-react";

import { api } from "@/convex/_generated/api";

/**
 * LA PORTE DES PERSONNES INVITÉES : la saisie du code d'invitation.
 *
 * Jotna School n'est pas encore lancé (demande du propriétaire, 12 novembre
 * 2026) : le site garde ses boutons d'inscription, mais qui s'en sert lit
 * l'annonce du lancement (`launch-copy.ts`) au lieu d'un formulaire. Seules
 * les personnes à qui l'équipe a remis un code d'invitation vont plus loin,
 * par ce champ.
 *
 * Deux écrans le portent : la pop-up ouverte par les boutons d'inscription
 * (`signup-gate.tsx`) et la page `/register` elle-même, pour qui y arrive par
 * son adresse.
 *
 * CE N'EST PAS CE QUI FERME L'INSCRIPTION. Un écran se contourne ; le refus
 * qui compte est celui du serveur (`convex/auth.ts`, `convex/invitations.ts`).
 *
 * LE CODE EST VÉRIFIÉ AVANT D'ALLER PLUS LOIN (`invitations.check`), pour que
 * la personne sache tout de suite s'il est bon, et pourquoi il ne l'est pas :
 * le serveur écrit la phrase, on l'affiche telle quelle. Cette lecture ne
 * réserve rien ; le serveur revérifie à la création du compte.
 *
 * `autoCapitalize` et `spellCheck` : sur un téléphone, le clavier corrigerait
 * le code. La casse et les tirets ne comptent pas, le serveur les ignore.
 */
export function InvitationCodeForm({
  onAccepted,
  initialCode = "",
  initialError = null,
}: {
  /** Appelé avec le code tel que saisi, une fois que le serveur l'a reconnu. */
  onAccepted: (code: string) => void;
  /** Un code déjà présenté (lien d'invitation), à corriger sur place. */
  initialCode?: string;
  /** Pourquoi ce code déjà présenté a été refusé. */
  initialError?: string | null;
}) {
  const convex = useConvex();
  const inputId = useId();
  const errorId = useId();
  const [code, setCode] = useState(initialCode);
  const [error, setError] = useState<string | null>(initialError);
  const [checking, setChecking] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setChecking(true);
    try {
      const result = await convex.query(api.invitations.check, { code });
      if (result.ok) {
        // Le bouton reste en attente : l'appelant passe à l'écran suivant, et
        // un second clic pendant ce passage ne doit rien relancer.
        onAccepted(code.trim());
        return;
      }
      setError(result.message);
    } catch {
      setError(
        "Le code n'a pas pu être vérifié. Vérifiez votre connexion et réessayez.",
      );
    }
    setChecking(false);
  }

  return (
    // `@container` : le champ et son bouton se mettent côte à côte quand LE
    // FORMULAIRE est assez large, pas l'écran. Dans la pop-up il l'est ; dans
    // la carte étroite de `/register` il ne l'est jamais, même sur un grand
    // écran, et le code n'y tiendrait pas à côté du bouton.
    <form
      onSubmit={handleSubmit}
      className="@container rounded-2xl bg-amber-50 p-4 text-left ring-1 ring-amber-100 sm:p-5"
    >
      <label
        htmlFor={inputId}
        className="flex items-center gap-2 text-sm font-bold text-amber-950"
      >
        <Ticket className="size-4 flex-none text-amber-700" aria-hidden />
        Vous avez reçu un code d&apos;invitation ?
      </label>
      <p className="mt-1 text-sm leading-6 text-amber-900/80">
        Saisissez-le pour créer votre compte dès maintenant.
      </p>

      <div className="mt-3 flex flex-col gap-2 @sm:flex-row">
        <input
          id={inputId}
          type="text"
          required
          autoComplete="off"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          placeholder="JOTNA-XXXX-XXXX"
          value={code}
          onChange={(event) => {
            setCode(event.target.value);
            setError(null);
          }}
          aria-invalid={error !== null}
          aria-describedby={error !== null ? errorId : undefined}
          className="h-12 w-full min-w-0 rounded-xl border border-amber-200 bg-white px-4 font-mono text-base tracking-wide text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-300 @sm:flex-1"
        />
        <button
          type="submit"
          disabled={checking}
          className="group inline-flex h-12 flex-none items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 text-base font-semibold text-white transition-all hover:bg-gray-800 active:scale-[0.98] disabled:cursor-wait disabled:opacity-70"
        >
          Continuer
          {checking ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <ArrowRight
              className="size-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          )}
        </button>
      </div>

      {error !== null && (
        <p
          id={errorId}
          role="alert"
          className="mt-3 text-sm font-medium leading-6 text-red-700"
        >
          {error}
        </p>
      )}
    </form>
  );
}
