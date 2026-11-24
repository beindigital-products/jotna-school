"use client";

/**
 * LES DEMANDES DE DEVIS des écoles, envoyées depuis la vitrine
 * (`quotes.request`), et leur SUIVI COMMERCIAL : à traiter, contactée,
 * gagnée, perdue, avec une note de l'équipe.
 *
 * L'équipe reçoit aussi chaque demande par courriel ; ici, elle les retrouve
 * toutes, y compris celles dont le courriel n'est pas parti.
 *
 * Données : `adminConsole.listQuoteRequests` et `setQuoteStatus`, gardées
 * côté serveur.
 */

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Download, FileText, Mail, PencilLine, Phone } from "lucide-react";

import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { QUOTE_SCHOOL_TYPE_LABELS } from "@/convex/quoteRules";
import {
  Button,
  Card,
  ChoiceTabs,
  DialogActions,
  EmptyState,
  Field,
  FormDialog,
  LoadingBlock,
  Notice,
  PageHeader,
  Pagination,
  usePagination,
  SelectField,
  Textarea,
  formatDay,
  formatDayTime,
  useAsyncAction,
} from "@/components/dashboard/ui";
import {
  StatusPill,
  downloadCsv,
  formatNumber,
  type Tone,
} from "@/components/admin/console-ui";

type QuoteRequest = Doc<"quoteRequests">;
type QuoteStatus = NonNullable<QuoteRequest["status"]>;

const STATUS: Record<QuoteStatus, { label: string; tone: Tone }> = {
  new: { label: "À traiter", tone: "warning" },
  contacted: { label: "Contactée", tone: "info" },
  won: { label: "Gagnée", tone: "good" },
  lost: { label: "Perdue", tone: "neutral" },
};

const STATUS_OPTIONS = (Object.keys(STATUS) as QuoteStatus[]).map((value) => ({
  value,
  label: STATUS[value].label,
}));

const statusOf = (request: QuoteRequest): QuoteStatus => request.status ?? "new";

function FollowUpForm({ request, close }: { request: QuoteRequest; close: () => void }) {
  const setQuoteStatus = useMutation(api.adminConsole.setQuoteStatus);
  const [status, setStatus] = useState<QuoteStatus>(statusOf(request));
  const [note, setNote] = useState(request.adminNote ?? "");
  const { busy, error, run } = useAsyncAction("Le suivi n'a pas pu être enregistré.");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const done = await run(async () => {
      await setQuoteStatus({ requestId: request._id, status, note });
      return true;
    });
    if (done) close();
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <Field label="Où en est cette demande ?" htmlFor="quote-status">
        <SelectField
          id="quote-status"
          value={status}
          onValueChange={setStatus}
          options={STATUS_OPTIONS}
        />
      </Field>
      <Field
        label="Note de suivi"
        htmlFor="quote-note"
        hint="Pour l'équipe seulement : qui a appelé, ce qui a été dit, la prochaine étape."
      >
        <Textarea
          id="quote-note"
          value={note}
          maxLength={1000}
          onChange={(e) => setNote(e.target.value)}
          placeholder="ex : appelée le 3 décembre, veut une démonstration en janvier"
        />
      </Field>
      {error && <Notice tone="error">{error}</Notice>}
      <DialogActions onCancel={close}>
        <Button type="submit" busy={busy}>
          Enregistrer
        </Button>
      </DialogActions>
    </form>
  );
}

function RequestCard({ request }: { request: QuoteRequest }) {
  const status = STATUS[statusOf(request)];
  return (
    <Card as="li" className="space-y-3 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-stone-900">{request.schoolName}</p>
          <p className="text-sm text-stone-600">
            {request.city} · {QUOTE_SCHOOL_TYPE_LABELS[request.schoolType]} · reçue le{" "}
            {formatDayTime(request.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {request.emailedAt === undefined && (
            <StatusPill tone="critical">Courriel non envoyé</StatusPill>
          )}
          <StatusPill tone={status.tone}>{status.label}</StatusPill>
        </div>
      </div>

      <p className="text-sm text-stone-800">
        {formatNumber(request.studentCount)} élèves, {request.classCount} classes, niveaux{" "}
        {request.levels.join(", ")}
        {request.wantsArabic ? ", avec le module arabe" : ""}.
        {request.startWhen ? ` Démarrage souhaité : ${request.startWhen}.` : ""}
      </p>

      {request.message && (
        <p className="rounded-xl bg-stone-50 px-3 py-2 text-sm whitespace-pre-line text-stone-700">
          {request.message}
        </p>
      )}

      {request.adminNote && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm whitespace-pre-line text-amber-950">
          <span className="font-semibold">Suivi</span>
          {request.statusAt ? ` (${formatDay(request.statusAt)})` : ""} : {request.adminNote}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-stone-100 pt-3 text-sm">
        <span className="font-medium text-stone-900">
          {request.contactName}
          <span className="font-normal text-stone-600">, {request.contactRole}</span>
        </span>
        <a
          href={`mailto:${request.email}?subject=${encodeURIComponent("Votre demande de devis Jotna School")}`}
          className="inline-flex min-h-11 items-center gap-1.5 break-all text-(--dash-strong) underline-offset-2 hover:underline"
        >
          <Mail className="h-4 w-4 shrink-0" aria-hidden />
          {request.email}
        </a>
        <a
          href={`tel:${request.phone}`}
          className="inline-flex min-h-11 items-center gap-1.5 text-(--dash-strong) underline-offset-2 hover:underline"
        >
          <Phone className="h-4 w-4" aria-hidden />
          {request.phone}
        </a>
        <span className="ml-auto">
          <FormDialog
            triggerVariant="secondary"
            trigger={
              <>
                <PencilLine className="h-4 w-4" aria-hidden />
                Suivi
              </>
            }
            triggerLabel={`Suivi de la demande de ${request.schoolName}`}
            title={`Suivi : ${request.schoolName}`}
            description="Notez où en est la demande. L'école ne voit rien de ceci."
          >
            {(close) => <FollowUpForm request={request} close={close} />}
          </FormDialog>
        </span>
      </div>
    </Card>
  );
}

function RequestList({ requests, empty }: { requests: QuoteRequest[]; empty: string }) {
  const pagination = usePagination(requests);
  if (requests.length === 0) return <EmptyState icon={FileText} title={empty} />;
  return (
    <div className="space-y-3">
      <ul className="space-y-3">
        {pagination.pageItems.map((request) => (
          <RequestCard key={request._id} request={request} />
        ))}
      </ul>
      <Pagination pagination={pagination} label="demandes de devis" />
    </div>
  );
}

function exportCsv(requests: QuoteRequest[]) {
  downloadCsv(
    "demandes-de-devis.csv",
    [
      "Reçue le",
      "École",
      "Ville",
      "Type",
      "Élèves",
      "Classes",
      "Niveaux",
      "Arabe",
      "Contact",
      "Fonction",
      "E-mail",
      "Téléphone",
      "Statut",
      "Note de suivi",
    ],
    requests.map((r) => [
      formatDay(r.createdAt),
      r.schoolName,
      r.city,
      QUOTE_SCHOOL_TYPE_LABELS[r.schoolType],
      r.studentCount,
      r.classCount,
      r.levels.join(" "),
      r.wantsArabic ? "oui" : "non",
      r.contactName,
      r.contactRole,
      r.email,
      r.phone,
      STATUS[statusOf(r)].label,
      r.adminNote ?? "",
    ]),
  );
}

export default function AdminQuoteRequestsPage() {
  const data = useQuery(api.adminConsole.listQuoteRequests);

  const by = (status: QuoteStatus) =>
    (data?.requests ?? []).filter((request) => statusOf(request) === status);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Demandes de devis"
        description="Les écoles qui ont demandé un devis depuis le site, et où en est chacune."
        actions={
          data && data.requests.length > 0 ? (
            <Button variant="secondary" onClick={() => exportCsv(data.requests)}>
              <Download className="h-4 w-4" aria-hidden />
              Exporter en CSV
            </Button>
          ) : undefined
        }
      />

      {data === undefined ? (
        <LoadingBlock label="Chargement des demandes" />
      ) : data.requests.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Aucune demande pour l'instant"
          description="Les demandes envoyées depuis le bouton « Demander un devis » du site arrivent ici."
        />
      ) : (
        <>
          {data.truncated && (
            <Notice tone="warning">
              Seules les demandes les plus récentes sont affichées.
            </Notice>
          )}
          <ChoiceTabs
            tabs={[
              {
                value: "new",
                label: `À traiter (${by("new").length})`,
                content: (
                  <RequestList requests={by("new")} empty="Toutes les demandes sont traitées" />
                ),
              },
              {
                value: "contacted",
                label: `Contactées (${by("contacted").length})`,
                content: (
                  <RequestList requests={by("contacted")} empty="Aucune demande en cours" />
                ),
              },
              {
                value: "won",
                label: `Gagnées (${by("won").length})`,
                content: <RequestList requests={by("won")} empty="Aucune demande gagnée" />,
              },
              {
                value: "lost",
                label: `Perdues (${by("lost").length})`,
                content: <RequestList requests={by("lost")} empty="Aucune demande perdue" />,
              },
            ]}
          />
        </>
      )}
    </div>
  );
}
