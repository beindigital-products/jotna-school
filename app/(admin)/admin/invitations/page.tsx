"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronRight,
  Link2,
  Loader2,
  Plus,
  Ticket,
} from "lucide-react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { INVITATION_MAX_USES } from "@/convex/invitationRules";
import { CodeChip } from "@/components/classroom/code-chip";
import { refusalMessage } from "@/lib/refusalMessage";
import { invitationLink } from "@/lib/signup";

/**
 * LES CODES D'INVITATION — qui peut créer un compte avant le lancement.
 *
 * Tant que Jotna School n'est pas lancé, le site annonce « Lancement
 * prochainement » et refuse toute inscription sans code. C'est ici que
 * l'équipe émet ces codes, les envoie (le code, ou le lien qui le porte),
 * les désactive, et voit qui s'en est servi.
 *
 * Le serveur garde chacune de ces fonctions (`convex/invitations.ts`) ; la
 * console elle-même est fermée aux autres rôles par `RoleGate`.
 */

type InvitationRow = FunctionReturnType<
  typeof api.invitations.list
>["invitations"][number];

const STATUS_LABEL: Record<InvitationRow["status"], string> = {
  active: "Actif",
  exhausted: "Utilisé",
  revoked: "Désactivé",
};

const STATUS_CLASS: Record<InvitationRow["status"], string> = {
  active: "bg-green-100 text-green-700",
  exhausted: "bg-gray-100 text-gray-700",
  revoked: "bg-red-100 text-red-700",
};

const ROLE_LABEL: Record<string, string> = {
  parent: "Parent",
  professeur: "Professeur",
  directeur: "École",
  student: "Élève",
  admin: "Admin",
};

/** « 5 octobre 2026 ». */
function formatDay(timestamp: number): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(timestamp);
}

/**
 * Copie le lien d'invitation : la personne invitée n'a rien à taper, elle
 * arrive sur le formulaire avec son code déjà reconnu.
 */
function CopyLinkButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(
        invitationLink(window.location.origin, code),
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* presse-papiers indisponible : le code reste lisible à l'écran */
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
    >
      {copied ? (
        <Check className="h-4 w-4 text-emerald-600" />
      ) : (
        <Link2 className="h-4 w-4" />
      )}
      {copied ? "Lien copié" : "Copier le lien"}
    </button>
  );
}

/** Les comptes créés avec un code — lus seulement quand la ligne est ouverte. */
function InvitationUses({ invitationId }: { invitationId: Id<"invitationCodes"> }) {
  const uses = useQuery(api.invitations.listUses, { invitationId });

  if (uses === undefined) {
    return <p className="text-sm text-gray-500">Chargement…</p>;
  }
  if (uses.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        Personne ne s&apos;est encore inscrit avec ce code.
      </p>
    );
  }
  return (
    <ul className="space-y-1.5">
      {uses.map((use) => (
        <li
          key={use.id}
          className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-sm"
        >
          <span className="font-medium text-gray-900">
            {use.name || "Compte supprimé"}
          </span>
          {use.email && (
            <span className="break-all text-gray-600">{use.email}</span>
          )}
          {use.role && (
            <span className="text-gray-500">
              {ROLE_LABEL[use.role] ?? use.role}
            </span>
          )}
          <span className="text-gray-400">{formatDay(use.usedAt)}</span>
        </li>
      ))}
    </ul>
  );
}

function InvitationCard({ invitation }: { invitation: InvitationRow }) {
  const setRevoked = useMutation(api.invitations.setRevoked);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const revoked = invitation.status === "revoked";

  async function toggleRevoked() {
    setBusy(true);
    setError(null);
    try {
      await setRevoked({ invitationId: invitation.id, revoked: !revoked });
    } catch (err) {
      setError(refusalMessage(err, "Le code n'a pas pu être modifié."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-gray-900">{invitation.label}</p>
          <p className="mt-0.5 text-xs text-gray-500">
            Créé le {formatDay(invitation.createdAt)}
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASS[invitation.status]}`}
        >
          {STATUS_LABEL[invitation.status]}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <CodeChip code={invitation.code} label="le code d'invitation" />
        {invitation.status === "active" && (
          <CopyLinkButton code={invitation.code} />
        )}
        {/* Un code qui a servi autant qu'il le pouvait n'ouvre déjà plus
            rien : le désactiver ne changerait rien, le bouton n'y est pas. */}
        {invitation.status !== "exhausted" && (
          <button
            type="button"
            onClick={toggleRevoked}
            disabled={busy}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${
              revoked
                ? "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                : "border-red-200 bg-white text-red-700 hover:bg-red-50"
            }`}
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {revoked ? "Réactiver" : "Désactiver"}
          </button>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-gray-900"
      >
        {open ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
        {invitation.useCount} inscription{invitation.useCount > 1 ? "s" : ""} sur{" "}
        {invitation.maxUses}
      </button>
      {open && (
        <div className="mt-2 rounded-lg bg-gray-50 p-3">
          <InvitationUses invitationId={invitation.id} />
        </div>
      )}
    </li>
  );
}

function CreateInvitationForm() {
  const create = useMutation(api.invitations.create);
  const [label, setLabel] = useState("");
  const [maxUses, setMaxUses] = useState("1");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ code: string; label: string } | null>(
    null,
  );

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const { code } = await create({ label, maxUses: Number(maxUses) });
      setCreated({ code, label: label.trim() });
      setLabel("");
      setMaxUses("1");
    } catch (err) {
      setError(refusalMessage(err, "Le code n'a pas pu être créé."));
    } finally {
      setIsSubmitting(false);
    }
  }

  const input =
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none";

  return (
    <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">
        Inviter quelqu&apos;un
      </h2>
      <form onSubmit={handleCreate} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_12rem]">
          <div>
            <label
              htmlFor="invitation-label"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Pour qui ?
            </label>
            <input
              id="invitation-label"
              type="text"
              required
              maxLength={80}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="ex : Mme Diop, École Les Manguiers"
              className={input}
            />
          </div>
          <div>
            <label
              htmlFor="invitation-max-uses"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Nombre de personnes
            </label>
            <input
              id="invitation-max-uses"
              type="number"
              required
              min={1}
              max={INVITATION_MAX_USES}
              step={1}
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              className={input}
            />
          </div>
        </div>
        <p className="text-xs text-gray-500">
          Le nom reste ici : la personne invitée ne le voit pas. Un code pour 1
          personne ne sert qu&apos;une fois ; mettez davantage pour inviter un
          groupe (les professeurs d&apos;une école, par exemple) avec un seul
          code.
        </p>

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Créer le code
        </button>
      </form>

      {created && (
        <div
          role="status"
          className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4"
        >
          <p className="text-sm font-semibold text-emerald-900">
            Code créé pour {created.label}
          </p>
          <p className="mt-1 text-sm text-emerald-800">
            Envoyez-lui le code, ou le lien : il ouvre directement le formulaire
            d&apos;inscription. Pour essayer le lien vous-même, ouvrez-le dans
            une fenêtre de navigation privée : ici, vous êtes déjà connecté.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <CodeChip code={created.code} size="lg" label="le code d'invitation" />
            <CopyLinkButton code={created.code} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminInvitationsPage() {
  const data = useQuery(api.invitations.list);

  if (data === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <span className="ml-3 text-gray-500">Chargement des codes...</span>
      </div>
    );
  }

  const { invitations, truncated } = data;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Codes d&apos;invitation
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Jotna School n&apos;est pas encore lancé : le site annonce « Lancement
          prochainement » et personne ne peut créer de compte, sauf les
          personnes à qui vous remettez un de ces codes.
        </p>
      </div>

      <CreateInvitationForm />

      {invitations.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
          <Ticket className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            Aucun code pour l&apos;instant
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Créez un code ci-dessus pour inviter une première personne.
          </p>
        </div>
      ) : (
        <>
          <p className="mb-3 text-sm text-gray-600">
            {invitations.length} code{invitations.length > 1 ? "s" : ""}
          </p>

          {truncated && (
            <div className="mb-3 flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                La liste dépasse ce que cet écran affiche : seuls les codes les
                plus récents sont visibles.
              </span>
            </div>
          )}

          <ul className="space-y-3">
            {invitations.map((invitation) => (
              <InvitationCard key={invitation.id} invitation={invitation} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
