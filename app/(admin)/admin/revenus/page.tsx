"use client";

/**
 * REVENUS ET ABONNEMENTS — l'argent de la plateforme.
 *
 * Trois vues : les contrats (payé, total, retard), les échéances à relancer,
 * les derniers versements reçus (PayDunya, Bictorys ou constatés à la main).
 * Aujourd'hui, seuls les contrats d'école existent ; les abonnements des
 * familles et des professeurs viendront avec les paiements en ligne.
 *
 * Données : `adminConsole.revenue` et `adminConsole.overview`, gardées côté
 * serveur (`admin` seul). Encaisser ou activer un contrat se fait depuis la
 * fiche de l'école (`/admin/ecoles/detail`).
 */

import Link from "next/link";
import { useQuery } from "convex/react";
import { CircleDollarSign, HandCoins, Receipt, Wallet } from "lucide-react";

import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import {
  Card,
  ChoiceTabs,
  EmptyState,
  LoadingBlock,
  Notice,
  PageHeader,
  StatCard,
  formatDay,
} from "@/components/dashboard/ui";
import {
  SeriesBarChart,
  StatusPill,
  fcfa,
  type Tone,
} from "@/components/admin/console-ui";

const SUB_STATUS: Record<Doc<"subscriptions">["status"], { label: string; tone: Tone }> = {
  draft: { label: "Brouillon", tone: "neutral" },
  pending_payment: { label: "En attente de paiement", tone: "warning" },
  active: { label: "Actif", tone: "good" },
  past_due: { label: "En retard", tone: "critical" },
  expired: { label: "Expiré", tone: "neutral" },
  cancelled: { label: "Résilié", tone: "neutral" },
};

const PAYMENT_STATUS: Record<Doc<"payments">["status"], { label: string; tone: Tone }> = {
  initiated: { label: "Ouvert", tone: "info" },
  completed: { label: "Encaissé", tone: "good" },
  failed: { label: "Échoué", tone: "critical" },
  cancelled: { label: "Annulé", tone: "neutral" },
};

const PROVIDER_LABEL: Record<Doc<"payments">["provider"], string> = {
  paydunya: "PayDunya",
  bictorys: "Bictorys",
  manual: "Constaté à la main",
};

const TABLE = "w-full min-w-[640px] text-left text-sm";
const TH = "px-4 py-3 font-medium text-stone-600";
const TD = "px-4 py-3 align-top";

function SchoolLink({ name, schoolId }: { name: string; schoolId: string | null }) {
  if (!schoolId) return <span className="font-medium text-stone-900">{name}</span>;
  return (
    <Link
      href={`/admin/ecoles/detail?id=${schoolId}`}
      className="font-medium text-stone-900 underline-offset-2 hover:underline"
    >
      {name}
    </Link>
  );
}

export default function AdminRevenuePage() {
  const data = useQuery(api.adminConsole.revenue);
  const overview = useQuery(api.adminConsole.overview);

  if (data === undefined || overview === undefined) {
    return <LoadingBlock label="Chargement des revenus" />;
  }
  if (data === null || overview === null) {
    return <Notice tone="error">Cette page est réservée à l&apos;équipe Jotna.</Notice>;
  }

  const { revenue } = overview;

  const contracts =
    data.subscriptions.length === 0 ? (
      <EmptyState
        icon={Receipt}
        title="Aucun contrat pour l'instant"
        description="Un contrat s'enregistre depuis la fiche d'une école."
      />
    ) : (
      <Card className="overflow-x-auto">
        <table className={TABLE}>
          <thead className="border-b border-stone-200 bg-stone-50">
            <tr>
              <th scope="col" className={TH}>Client</th>
              <th scope="col" className={TH}>Statut</th>
              <th scope="col" className={`${TH} text-right`}>Places</th>
              <th scope="col" className={`${TH} text-right`}>Payé / total</th>
              <th scope="col" className={TH}>Période</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {data.subscriptions.map((sub) => (
              <tr key={sub.id}>
                <td className={TD}>
                  <SchoolLink name={sub.ownerName} schoolId={sub.schoolId} />
                  {sub.overdueFcfa > 0 && (
                    <p className="text-xs text-red-700">
                      {fcfa(sub.overdueFcfa)} en retard
                    </p>
                  )}
                </td>
                <td className={TD}>
                  <StatusPill tone={SUB_STATUS[sub.status].tone}>
                    {SUB_STATUS[sub.status].label}
                  </StatusPill>
                </td>
                <td className={`${TD} text-right tabular-nums`}>{sub.seats}</td>
                <td className={`${TD} text-right tabular-nums`}>
                  {fcfa(sub.paidFcfa)}
                  <span className="text-stone-500"> / {fcfa(sub.totalFcfa)}</span>
                </td>
                <td className={`${TD} text-stone-600`}>
                  Du {formatDay(sub.startsAt)} au {formatDay(sub.endsAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    );

  const due =
    data.due.length === 0 ? (
      <EmptyState icon={Wallet} title="Aucune échéance ouverte" />
    ) : (
      <Card className="overflow-x-auto">
        <table className={TABLE}>
          <thead className="border-b border-stone-200 bg-stone-50">
            <tr>
              <th scope="col" className={TH}>Client</th>
              <th scope="col" className={TH}>Tranche</th>
              <th scope="col" className={TH}>Échéance</th>
              <th scope="col" className={`${TH} text-right`}>Montant</th>
              <th scope="col" className={TH}>État</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {data.due.map((row) => (
              <tr key={row.id}>
                <td className={TD}>
                  <SchoolLink name={row.ownerName} schoolId={row.schoolId} />
                </td>
                <td className={`${TD} tabular-nums`}>n° {row.index}</td>
                <td className={TD}>{formatDay(row.dueAt)}</td>
                <td className={`${TD} text-right tabular-nums`}>{fcfa(row.amountFcfa)}</td>
                <td className={TD}>
                  <StatusPill tone={row.status === "overdue" ? "critical" : "info"}>
                    {row.status === "overdue" ? "En retard" : "À venir"}
                  </StatusPill>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    );

  const payments =
    data.payments.length === 0 ? (
      <EmptyState icon={HandCoins} title="Aucun versement reçu pour l'instant" />
    ) : (
      <Card className="overflow-x-auto">
        <table className={TABLE}>
          <thead className="border-b border-stone-200 bg-stone-50">
            <tr>
              <th scope="col" className={TH}>Date</th>
              <th scope="col" className={TH}>Client</th>
              <th scope="col" className={TH}>Moyen</th>
              <th scope="col" className={`${TH} text-right`}>Montant</th>
              <th scope="col" className={TH}>État</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {data.payments.map((p) => (
              <tr key={p.id}>
                <td className={`${TD} text-stone-600`}>{formatDay(p.at)}</td>
                <td className={`${TD} font-medium text-stone-900`}>{p.ownerName}</td>
                <td className={TD}>{PROVIDER_LABEL[p.provider]}</td>
                <td className={`${TD} text-right tabular-nums`}>{fcfa(p.amountFcfa)}</td>
                <td className={TD}>
                  <StatusPill tone={PAYMENT_STATUS[p.status].tone}>
                    {PAYMENT_STATUS[p.status].label}
                  </StatusPill>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Revenus et abonnements"
        description="Contrats, échéances et versements. Pour encaisser une tranche ou activer un contrat, ouvrez la fiche de l'école."
      />

      <section aria-label="Chiffres clés" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={CircleDollarSign}
          label="Encaissé au total"
          value={fcfa(revenue.collectedTotal)}
        />
        <StatCard
          icon={HandCoins}
          label="Encaissé ce mois"
          value={fcfa(revenue.collectedThisMonth)}
          hint={`Mois dernier : ${fcfa(revenue.collectedLastMonth)}`}
        />
        <StatCard icon={Wallet} label="À encaisser" value={fcfa(revenue.pendingFcfa)} />
        <StatCard
          icon={Receipt}
          label="En retard"
          value={fcfa(revenue.overdueFcfa)}
          hint={`${revenue.overdueCount} échéance${revenue.overdueCount > 1 ? "s" : ""}`}
        />
      </section>

      <Card className="space-y-4 p-5">
        <h2 className="font-semibold text-stone-900">Encaissé par mois, sur 12 mois</h2>
        <SeriesBarChart title="Montant encaissé" data={revenue.byMonth} formatValue={fcfa} />
      </Card>

      {data.truncated && (
        <Notice tone="warning">Seuls les contrats les plus récents sont affichés.</Notice>
      )}

      <ChoiceTabs
        tabs={[
          {
            value: "contracts",
            label: `Contrats (${data.subscriptions.length})`,
            content: contracts,
          },
          { value: "due", label: `Échéances (${data.due.length})`, content: due },
          {
            value: "payments",
            label: `Versements (${data.payments.length})`,
            content: payments,
          },
        ]}
      />

      <Notice tone="info">
        Les abonnements des familles et des professeurs, et les paiements en
        ligne Bictorys, s&apos;afficheront ici dès leur ouverture.
      </Notice>
    </div>
  );
}
