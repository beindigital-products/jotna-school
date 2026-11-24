"use client";

/**
 * FIDÉLISATION — qui reste abonné, qui risque de partir, qui est parti.
 *
 * Utile toute l'année, hors année scolaire comprise : c'est entre juillet et
 * la rentrée que les clients partis se reconquièrent. Chaque client a son
 * contact et ses chiffres (années d'abonnement, places, montant signé, élèves
 * encore inscrits) pour préparer la relance.
 *
 * Données : `adminConsole.retention` (règles dans `convex/retentionRules.ts`),
 * gardée côté serveur (`admin` seul).
 */

import Link from "next/link";
import { useQuery } from "convex/react";
import {
  AlertTriangle,
  BadgePercent,
  CalendarClock,
  Download,
  HeartHandshake,
  Mail,
  Phone,
  Repeat,
  UserMinus,
  Users,
} from "lucide-react";

import { api } from "@/convex/_generated/api";
import type { AdminRetention, RetentionCustomerRow } from "@/convex/adminConsole";
import {
  Button,
  ButtonLink,
  Card,
  CardTitle,
  ChoiceTabs,
  EmptyState,
  LoadingBlock,
  Notice,
  PageHeader,
  Pagination,
  usePagination,
  StatCard,
  formatDay,
} from "@/components/dashboard/ui";
import { StatusPill, downloadCsv, fcfa, type Tone } from "@/components/admin/console-ui";

const STATUS: Record<RetentionCustomerRow["status"], { label: string; tone: Tone }> = {
  active: { label: "Abonné", tone: "good" },
  at_risk: { label: "À risque", tone: "warning" },
  churned: { label: "Parti", tone: "critical" },
  pending: { label: "Signé, pas payé", tone: "info" },
  prospect: { label: "Prospect", tone: "neutral" },
};

const ROLE_LABEL: Record<string, string> = {
  parent: "Parent",
  professeur: "Professeur",
  directeur: "École",
};

function reasonText(row: RetentionCustomerRow): string | null {
  if (row.riskReason === "past_due") return "Paiement en retard";
  if (row.riskReason === "ending_soon" && row.lastEndsAt) {
    return `Contrat qui finit le ${formatDay(row.lastEndsAt)}, pas encore renouvelé`;
  }
  if (row.status === "churned" && row.lastEndsAt) {
    return `Parti depuis le ${formatDay(row.lastEndsAt)}`;
  }
  if (row.renewed) return "Déjà renouvelé pour la suite";
  return null;
}

function mailSubject(row: RetentionCustomerRow): string {
  return row.status === "churned"
    ? "Jotna School : vous revoir à la rentrée"
    : "Jotna School : votre abonnement";
}

function CustomerCard({ row }: { row: RetentionCustomerRow }) {
  const reason = reasonText(row);
  return (
    <Card as="li" className="space-y-3 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          {row.href ? (
            <Link
              href={row.href}
              className="font-semibold text-stone-900 underline-offset-2 hover:underline"
            >
              {row.name}
            </Link>
          ) : (
            <p className="font-semibold text-stone-900">{row.name}</p>
          )}
          {reason && <p className="text-sm text-stone-700">{reason}</p>}
        </div>
        <StatusPill tone={STATUS[row.status].tone}>{STATUS[row.status].label}</StatusPill>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-xs text-stone-500">Années abonnées</dt>
          <dd className="font-medium text-stone-900">
            {row.schoolYears.length > 0 ? row.schoolYears.join(", ") : "Aucune"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-stone-500">Places</dt>
          <dd className="font-medium tabular-nums text-stone-900">{row.lastSeats}</dd>
        </div>
        <div>
          <dt className="text-xs text-stone-500">Montant signé</dt>
          <dd className="font-medium tabular-nums text-stone-900">
            {fcfa(row.lifetimeFcfa)}
          </dd>
        </div>
        {row.studentsEnrolled !== null && (
          <div>
            <dt className="text-xs text-stone-500">Élèves encore inscrits</dt>
            <dd className="font-medium tabular-nums text-stone-900">
              {row.studentsEnrolled >= 500 ? "500+" : row.studentsEnrolled}
            </dd>
          </div>
        )}
      </dl>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-stone-100 pt-3 text-sm">
        {row.contactName && (
          <span className="font-medium text-stone-900">{row.contactName}</span>
        )}
        {row.email && (
          <a
            href={`mailto:${row.email}?subject=${encodeURIComponent(mailSubject(row))}`}
            className="inline-flex min-h-11 items-center gap-1.5 break-all text-(--dash-strong) underline-offset-2 hover:underline"
          >
            <Mail className="h-4 w-4 shrink-0" aria-hidden />
            {row.email}
          </a>
        )}
        {row.phone && (
          <a
            href={`tel:${row.phone}`}
            className="inline-flex min-h-11 items-center gap-1.5 text-(--dash-strong) underline-offset-2 hover:underline"
          >
            <Phone className="h-4 w-4" aria-hidden />
            {row.phone}
          </a>
        )}
      </div>
    </Card>
  );
}

function CustomerList({ rows, empty }: { rows: RetentionCustomerRow[]; empty: string }) {
  const pagination = usePagination(rows);
  if (rows.length === 0) return <EmptyState icon={Users} title={empty} />;
  return (
    <div className="space-y-3">
      <ul className="space-y-3">
        {pagination.pageItems.map((row) => (
          <CustomerCard key={row.key} row={row} />
        ))}
      </ul>
      <Pagination pagination={pagination} label="clients" />
    </div>
  );
}

function FreeAccessList({ rows }: { rows: AdminRetention["freeAccess"] }) {
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={BadgePercent}
        title="Aucun accès gratuit fini ou sur le point de finir"
        description="Les comptes qui ont utilisé un coupon d'accès gratuit apparaissent ici dans les 14 jours avant la fin de leur période, puis après."
      />
    );
  }
  return (
    <Card className="overflow-hidden">
      <ul className="divide-y divide-stone-100">
        {rows.map((row) => (
          <li
            key={row.id}
            className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-sm"
          >
            <span className="font-medium text-stone-900">{row.name}</span>
            <span className="text-stone-500">{ROLE_LABEL[row.role] ?? row.role}</span>
            {row.email && (
              <a
                href={`mailto:${row.email}?subject=${encodeURIComponent("Jotna School : la suite après votre accès gratuit")}`}
                className="inline-flex min-h-11 items-center gap-1.5 break-all text-(--dash-strong) underline-offset-2 hover:underline"
              >
                <Mail className="h-4 w-4 shrink-0" aria-hidden />
                {row.email}
              </a>
            )}
            <span className="ml-auto">
              <StatusPill tone={row.ended ? "critical" : "warning"}>
                {row.ended ? "Fini le" : "Finit le"} {formatDay(row.accessUntil)}
              </StatusPill>
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default function AdminRetentionPage() {
  const data = useQuery(api.adminConsole.retention);

  if (data === undefined) return <LoadingBlock label="Calcul de la fidélisation" />;
  if (data === null) {
    return <Notice tone="error">Cette page est réservée à l&apos;équipe Jotna.</Notice>;
  }

  const atRisk = data.customers.filter((c) => c.status === "at_risk");
  const churned = data.customers.filter((c) => c.status === "churned");
  const subscribed = data.customers.filter(
    (c) => c.status === "active" || c.status === "at_risk",
  );
  const lastClosed = [...data.cohorts].reverse().find((c) => c.renewalRate !== null);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Fidélisation"
        description={`Qui reste, qui risque de partir, qui est parti. Année scolaire en cours : ${data.schoolYear}.`}
        actions={
          <>
            {data.customers.length > 0 && (
              <Button
                variant="secondary"
                onClick={() =>
                  downloadCsv(
                    "fidelisation.csv",
                    [
                      "Client",
                      "État",
                      "Contact",
                      "E-mail",
                      "Téléphone",
                      "Fin du dernier contrat",
                      "Années abonnées",
                      "Places",
                      "Montant signé (FCFA)",
                      "Élèves encore inscrits",
                    ],
                    data.customers.map((c) => [
                      c.name,
                      STATUS[c.status].label,
                      c.contactName ?? "",
                      c.email ?? "",
                      c.phone ?? "",
                      c.lastEndsAt ? formatDay(c.lastEndsAt) : "",
                      c.schoolYears.join(" "),
                      c.lastSeats,
                      c.lifetimeFcfa,
                      c.studentsEnrolled ?? "",
                    ]),
                  )
                }
              >
                <Download className="h-4 w-4" aria-hidden />
                Exporter en CSV
              </Button>
            )}
            <ButtonLink href="/admin/coupons" variant="secondary">
              <BadgePercent className="h-4 w-4" aria-hidden />
              Offre de retour
            </ButtonLink>
          </>
        }
      />

      <section aria-label="Chiffres clés" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Abonnés"
          value={data.counts.active + data.counts.at_risk}
        />
        <StatCard
          icon={AlertTriangle}
          label="À risque"
          value={data.counts.at_risk}
          hint="Retard, ou fin dans 60 jours"
        />
        <StatCard icon={UserMinus} label="Partis" value={data.counts.churned} />
        <StatCard
          icon={Repeat}
          label="Renouvellement"
          value={lastClosed ? `${lastClosed.renewalRate} %` : "—"}
          hint={
            lastClosed
              ? `Année ${lastClosed.schoolYear}`
              : "Aucune année scolaire finie pour l'instant"
          }
        />
      </section>

      {data.capped && (
        <Notice tone="warning">
          Seuls les 2 000 premiers contrats sont lus : les chiffres sont partiels.
        </Notice>
      )}

      <Card className="p-5">
        <CardTitle
          icon={HeartHandshake}
          description="Ce que la console permet déjà, dans l'ordre où le faire."
        >
          Comment les garder
        </CardTitle>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-stone-700">
          <li>
            <strong className="text-stone-900">Relancer avant la fin.</strong> Les
            clients « à risque » finissent leur contrat dans moins de 60 jours sans
            l&apos;avoir renouvelé. Un appel en mai vaut mieux qu&apos;une relance
            en septembre.
          </li>
          <li>
            <strong className="text-stone-900">Traiter les retards tout de suite.</strong>{" "}
            Une école en retard garde l&apos;accès 21 jours, puis ses élèves sont
            coupés. Les échéances sont dans{" "}
            <Link
              href="/admin/revenus"
              className="font-medium text-(--dash-strong) underline"
            >
              Revenus
            </Link>
            .
          </li>
          <li>
            <strong className="text-stone-900">Faire une offre de retour.</strong> Un
            coupon pour les écoles (remise ou mois offert), avec une date de fin, à
            envoyer aux clients partis avant la rentrée.
          </li>
          <li>
            <strong className="text-stone-900">
              S&apos;appuyer sur les élèves encore inscrits.
            </strong>{" "}
            Une école partie dont les élèves sont toujours inscrits a des comptes
            prêts : il suffit de rouvrir le contrat.
          </li>
          <li>
            <strong className="text-stone-900">Convertir les accès gratuits.</strong>{" "}
            Les comptes dont l&apos;accès offert par coupon se termine sont dans le
            dernier onglet.
          </li>
        </ol>
      </Card>

      <ChoiceTabs
        tabs={[
          {
            value: "risk",
            label: `À risque (${atRisk.length})`,
            content: <CustomerList rows={atRisk} empty="Aucun client à risque" />,
          },
          {
            value: "churned",
            label: `Partis (${churned.length})`,
            content: <CustomerList rows={churned} empty="Aucun client parti" />,
          },
          {
            value: "subscribed",
            label: `Abonnés (${subscribed.length})`,
            content: (
              <CustomerList rows={subscribed} empty="Aucun abonné pour l'instant" />
            ),
          },
          {
            value: "free",
            label: `Accès gratuits (${data.freeAccess.length})`,
            content: <FreeAccessList rows={data.freeAccess} />,
          },
        ]}
      />

      <Card className="overflow-x-auto">
        <div className="p-5 pb-0">
          <CardTitle
            icon={CalendarClock}
            description="Parmi les clients abonnés une année, combien le sont l'année suivante."
          >
            Renouvellement par année scolaire
          </CardTitle>
        </div>
        {data.cohorts.length === 0 ? (
          <p className="p-5 text-sm text-stone-600">
            Aucun abonnement pour l&apos;instant.
          </p>
        ) : (
          <table className="mt-3 w-full min-w-[480px] text-left text-sm">
            <thead className="border-y border-stone-200 bg-stone-50">
              <tr>
                <th scope="col" className="px-5 py-3 font-medium text-stone-600">
                  Année
                </th>
                <th scope="col" className="px-5 py-3 text-right font-medium text-stone-600">
                  Clients
                </th>
                <th scope="col" className="px-5 py-3 text-right font-medium text-stone-600">
                  Ont renouvelé
                </th>
                <th scope="col" className="px-5 py-3 text-right font-medium text-stone-600">
                  Taux
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {data.cohorts.map((row) => (
                <tr key={row.schoolYear}>
                  <td className="px-5 py-3 font-medium text-stone-900">{row.schoolYear}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{row.customers}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{row.renewed}</td>
                  <td className="px-5 py-3 text-right tabular-nums">
                    {row.renewalRate === null ? "En cours" : `${row.renewalRate} %`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Notice tone="info">
        Aujourd&apos;hui, seules les écoles ont des contrats. Les familles et les
        professeurs abonnés apparaîtront ici dès l&apos;ouverture de leurs
        abonnements : le calcul est déjà prêt pour eux.
      </Notice>
    </div>
  );
}
