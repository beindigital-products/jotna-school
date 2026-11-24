"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Link2,
  Plus,
  Ticket,
} from "lucide-react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { INVITATION_MAX_USES } from "@/convex/invitationRules";
import { CodeChip } from "@/components/classroom/code-chip";
import {
  Button,
  Card,
  DialogActions,
  EmptyState,
  Field,
  FormDialog,
  Input,
  LoadingBlock,
  Notice,
  PageHeader,
  Pagination,
  usePagination,
  useAsyncAction,
} from "@/components/dashboard/ui";
import { StatusPill, type Tone } from "@/components/admin/console-ui";
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

const STATUS_TONE: Record<InvitationRow["status"], Tone> = {
  active: "good",
  exhausted: "neutral",
  revoked: "critical",
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
    <Button variant="secondary" onClick={copy}>
      {copied ? (
        <Check className="h-4 w-4 text-emerald-600" aria-hidden />
      ) : (
        <Link2 className="h-4 w-4" aria-hidden />
      )}
      {copied ? "Lien copié" : "Copier le lien"}
    </Button>
  );
}

/** Les comptes créés avec un code — lus seulement quand la ligne est ouverte. */
function InvitationUses({ invitationId }: { invitationId: Id<"invitationCodes"> }) {
  const uses = useQuery(api.invitations.listUses, { invitationId });

  if (uses === undefined) {
    return <p className="py-2 text-sm text-stone-500">Chargement…</p>;
  }
  if (uses.length === 0) {
    return (
      <p className="py-2 text-sm text-stone-600">
        Personne ne s&apos;est encore inscrit avec ce code.
      </p>
    );
  }
  return (
    <ul className="divide-y divide-stone-200">
      {uses.map((use) => (
        <li
          key={use.id}
          className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2 text-sm"
        >
          <span className="font-medium text-stone-900">
            {use.name || "Compte supprimé"}
          </span>
          {use.email && (
            <span className="break-all text-stone-600">{use.email}</span>
          )}
          {use.role && (
            <span className="text-stone-500">
              {ROLE_LABEL[use.role] ?? use.role}
            </span>
          )}
          <span className="text-stone-500">{formatDay(use.usedAt)}</span>
        </li>
      ))}
    </ul>
  );
}

function InvitationCard({ invitation }: { invitation: InvitationRow }) {
  const setRevoked = useMutation(api.invitations.setRevoked);
  const [open, setOpen] = useState(false);
  const { busy, error, run } = useAsyncAction(
    "Le code n'a pas pu être modifié.",
  );

  const revoked = invitation.status === "revoked";

  return (
    <Card as="li" className="p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-stone-900">{invitation.label}</p>
          <p className="mt-0.5 text-xs text-stone-500">
            Créé le {formatDay(invitation.createdAt)}
          </p>
        </div>
        <StatusPill tone={STATUS_TONE[invitation.status]}>
          {STATUS_LABEL[invitation.status]}
        </StatusPill>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <CodeChip code={invitation.code} label="le code d'invitation" />
        {invitation.status === "active" && (
          <CopyLinkButton code={invitation.code} />
        )}
        {/* Un code qui a servi autant qu'il le pouvait n'ouvre déjà plus
            rien : le désactiver ne changerait rien, le bouton n'y est pas. */}
        {invitation.status !== "exhausted" && (
          <Button
            variant="ghost"
            busy={busy}
            className={revoked ? undefined : "text-red-700 hover:bg-red-50 hover:text-red-800"}
            onClick={() =>
              run(() =>
                setRevoked({ invitationId: invitation.id, revoked: !revoked }),
              )
            }
          >
            {revoked ? "Réactiver" : "Désactiver"}
          </Button>
        )}
      </div>

      {error && (
        <Notice tone="error" className="mt-2">
          {error}
        </Notice>
      )}

      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="mt-2 inline-flex min-h-11 items-center gap-1 rounded-lg text-sm font-medium text-stone-700 outline-none hover:text-stone-900 focus-visible:ring-2 focus-visible:ring-(--dash-strong)"
      >
        {open ? (
          <ChevronDown className="h-4 w-4" aria-hidden />
        ) : (
          <ChevronRight className="h-4 w-4" aria-hidden />
        )}
        {invitation.useCount} inscription{invitation.useCount > 1 ? "s" : ""} sur{" "}
        {invitation.maxUses}
      </button>
      {open && (
        <div className="mt-1 rounded-xl bg-stone-50 px-3 py-1">
          <InvitationUses invitationId={invitation.id} />
        </div>
      )}
    </Card>
  );
}

type Created = { code: string; label: string };

function CreateInvitationForm({
  close,
  onCreated,
}: {
  close: () => void;
  onCreated: (created: Created) => void;
}) {
  const create = useMutation(api.invitations.create);
  const [label, setLabel] = useState("");
  const [maxUses, setMaxUses] = useState("1");
  const { busy, error, run } = useAsyncAction("Le code n'a pas pu être créé.");

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    const result = await run(() =>
      create({ label, maxUses: Number(maxUses) }),
    );
    if (result) {
      onCreated({ code: result.code, label: label.trim() });
      close();
    }
  }

  return (
    <form onSubmit={handleCreate} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-[1fr_12rem]">
        <Field label="Pour qui ?" htmlFor="invitation-label">
          <Input
            id="invitation-label"
            maxLength={80}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="ex : Mme Diop, École Les Manguiers"
          />
        </Field>
        <Field label="Nombre de personnes" htmlFor="invitation-max-uses">
          <Input
            id="invitation-max-uses"
            type="number"
            inputMode="numeric"
            min={1}
            max={INVITATION_MAX_USES}
            step={1}
            value={maxUses}
            onChange={(e) => setMaxUses(e.target.value)}
          />
        </Field>
      </div>
      <p className="text-xs text-stone-500">
        Le nom reste ici : la personne invitée ne le voit pas. Un code pour 1
        personne ne sert qu&apos;une fois ; mettez davantage pour inviter un
        groupe (les professeurs d&apos;une école, par exemple) avec un seul
        code.
      </p>

      {error && <Notice tone="error">{error}</Notice>}

      <DialogActions onCancel={close}>
        <Button type="submit" busy={busy}>
          Créer le code
        </Button>
      </DialogActions>
    </form>
  );
}

export default function AdminInvitationsPage() {
  const data = useQuery(api.invitations.list);
  const [created, setCreated] = useState<Created | null>(null);
  const pagination = usePagination(data?.invitations ?? []);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Codes d'invitation"
        description="Jotna School n'est pas encore lancé : le site annonce « Lancement prochainement » et personne ne peut créer de compte, sauf les personnes à qui vous remettez un de ces codes."
        actions={
          <FormDialog
            trigger={
              <>
                <Plus className="h-4 w-4" aria-hidden />
                Inviter quelqu&apos;un
              </>
            }
            title="Inviter quelqu'un"
          >
            {(close) => (
              <CreateInvitationForm close={close} onCreated={setCreated} />
            )}
          </FormDialog>
        }
      />

      {created && (
        <Card
          role="status"
          className="space-y-3 border-emerald-200 bg-emerald-50 p-5"
        >
          <p className="font-semibold text-emerald-900">
            Code créé pour {created.label}
          </p>
          <p className="text-sm text-emerald-900">
            Envoyez-lui le code, ou le lien : il ouvre directement le formulaire
            d&apos;inscription. Pour essayer le lien vous-même, ouvrez-le dans
            une fenêtre de navigation privée : ici, vous êtes déjà connecté.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <CodeChip code={created.code} size="lg" label="le code d'invitation" />
            <CopyLinkButton code={created.code} />
          </div>
        </Card>
      )}

      {data === undefined ? (
        <LoadingBlock label="Chargement des codes" />
      ) : data.invitations.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title="Aucun code pour l'instant"
          description="Créez un code avec le bouton « Inviter quelqu'un » pour inviter une première personne."
        />
      ) : (
        <>
          <p className="text-sm text-stone-600">
            {data.invitations.length} code
            {data.invitations.length > 1 ? "s" : ""}
          </p>

          {data.truncated && (
            <Notice tone="warning">
              La liste dépasse ce que cet écran affiche : seuls les codes les
              plus récents sont visibles.
            </Notice>
          )}

          <ul className="space-y-3">
            {pagination.pageItems.map((invitation) => (
              <InvitationCard key={invitation.id} invitation={invitation} />
            ))}
          </ul>
          <Pagination pagination={pagination} label="codes d'invitation" />
        </>
      )}
    </div>
  );
}
