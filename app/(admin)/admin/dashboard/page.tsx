"use client";

/**
 * LE TABLEAU DE BORD DU SUPER ADMIN.
 *
 * L'écran répond, dans cet ordre, aux questions de quelqu'un qui pilote
 * Jotna School :
 *
 * 1. Qu'est-ce que je dois traiter aujourd'hui ?        → « À traiter »
 * 2. Est-ce que ça monte ou ça descend ?                → indicateurs de la
 *    période, comparés à la période d'avant, et leurs courbes
 * 3. Où est-ce que je perds du monde ?                  → les trois entonnoirs
 * 4. Qui joue vraiment, et qui ne joue pas ?            → par niveau, par école
 * 5. Où en est l'argent, et qui risque de partir ?      → revenus, fidélisation
 * 6. Que vient-il de se passer ?                        → derniers événements
 * 7. Où en est la plateforme ?                          → totaux, IA, jeu
 *
 * Chaque bloc a sa requête (`convex/adminPulse.ts`, `adminConsole.ts`) et se
 * charge seul. Tout est gardé côté serveur : `admin` seulement.
 */

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import {
  AlertTriangle,
  BadgePercent,
  Bot,
  Building2,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Filter,
  Gamepad2,
  GraduationCap,
  HandCoins,
  HeartHandshake,
  History,
  Info,
  School,
  ShieldAlert,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { api } from "@/convex/_generated/api";
import type { TodoSeverity } from "@/convex/adminPulse";
import {
  ButtonLink,
  Card,
  CardTitle,
  LoadingBlock,
  Notice,
  PageHeader,
  ProgressBar,
  formatDayTime,
} from "@/components/dashboard/ui";
import {
  BarList,
  FunnelBars,
  KpiCard,
  MetricRow,
  PeriodSwitch,
  SeriesBarChart,
  boundedLabel,
  fcfa,
  formatNumber,
} from "@/components/admin/console-ui";
import { cn } from "@/lib/utils";

type Period = 7 | 30 | 90;

const PERIODS: { value: Period; label: string }[] = [
  { value: 7, label: "7 jours" },
  { value: 30, label: "30 jours" },
  { value: 90, label: "90 jours" },
];

/** Un bloc qui charge garde sa place : la page ne saute pas à l'arrivée des chiffres. */
function BlockLoading({ className }: { className?: string }) {
  return (
    <Card className={cn("flex min-h-40 items-center justify-center p-5", className)}>
      <span role="status" className="text-sm text-stone-500">
        Chargement…
      </span>
    </Card>
  );
}

// ── 1. À traiter ────────────────────────────────────────────────────────────

const SEVERITY: Record<TodoSeverity, { label: string; icon: LucideIcon; tone: string }> = {
  critical: { label: "Urgent", icon: ShieldAlert, tone: "bg-red-50 text-red-800" },
  warning: { label: "À faire", icon: AlertTriangle, tone: "bg-amber-50 text-amber-900" },
  info: { label: "À suivre", icon: Info, tone: "bg-sky-50 text-sky-900" },
};

function TodoBlock() {
  const items = useQuery(api.adminPulse.todo);
  if (items === undefined) return <BlockLoading />;
  if (items === null) return null;

  if (items.length === 0) {
    return (
      <Card className="flex items-center gap-3 p-5">
        <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-700" aria-hidden />
        <div>
          <h2 className="font-semibold text-stone-900">Rien à traiter</h2>
          <p className="text-sm text-stone-600">
            Aucun retard de paiement, aucun devis en attente, aucun contrat qui finit
            bientôt.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card as="section" aria-labelledby="todo-title" className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-5 pt-5">
        <h2 id="todo-title" className="text-lg font-semibold text-stone-900">
          À traiter
        </h2>
        <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-semibold text-stone-700">
          {items.length} sujet{items.length > 1 ? "s" : ""}
        </span>
      </div>
      <ul className="mt-3 divide-y divide-stone-100">
        {items.map((item) => {
          const severity = SEVERITY[item.severity];
          const Icon = severity.icon;
          return (
            <li key={item.key}>
              <Link
                href={item.href}
                className="flex min-h-14 items-center gap-3 px-5 py-3 outline-none hover:bg-stone-50 focus-visible:bg-stone-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-(--dash-strong)"
              >
                <span
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                    severity.tone,
                  )}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                  {severity.label}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-stone-900">{item.title}</span>
                  <span className="block text-sm text-stone-600">{item.detail}</span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-stone-400" aria-hidden />
              </Link>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

// ── 2. La période : indicateurs et courbes ──────────────────────────────────

function PulseBlock({ days }: { days: Period }) {
  const data = useQuery(api.adminPulse.pulse, { days });
  if (data === undefined) return <LoadingBlock label="Calcul de la période" />;
  if (data === null) return null;

  const rate = data.successRate;
  return (
    <section aria-label={`Indicateurs sur ${days} jours`} className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          icon={UserPlus}
          label="Nouveaux comptes"
          value={formatNumber(data.signups.current)}
          change={data.signups.change}
          previous={data.signups.previous}
          previousLabel={formatNumber(data.signups.previous)}
        />
        <KpiCard
          icon={GraduationCap}
          label="Élèves actifs"
          value={formatNumber(data.activeStudents.current)}
          change={data.activeStudents.change}
          previous={data.activeStudents.previous}
          previousLabel={formatNumber(data.activeStudents.previous)}
          hint="Au moins une séance jouée"
        />
        <KpiCard
          icon={Gamepad2}
          label="Séances jouées"
          value={formatNumber(data.sessions.current)}
          change={data.sessions.change}
          previous={data.sessions.previous}
          previousLabel={formatNumber(data.sessions.previous)}
          hint={
            rate.current === null
              ? "Aucune séance terminée"
              : `${rate.current} % de séances réussies`
          }
        />
        <KpiCard
          icon={CircleDollarSign}
          label="Encaissé"
          value={fcfa(data.collectedFcfa.current)}
          change={data.collectedFcfa.change}
          previous={data.collectedFcfa.previous}
          previousLabel={fcfa(data.collectedFcfa.previous)}
        />
      </div>

      {data.capped && (
        <Notice tone="warning">
          La période dépasse ce que le tableau de bord lit d&apos;un coup : ces chiffres
          sont un minimum.
        </Notice>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-4 p-5">
          <CardTitle icon={GraduationCap} description="Élèves différents qui ont joué, jour par jour">
            Élèves actifs par jour
          </CardTitle>
          <SeriesBarChart title="Élèves actifs" data={data.series.activeStudents} />
        </Card>
        <Card className="space-y-4 p-5">
          <CardTitle icon={UserPlus} description="Tous les rôles, équipe exclue">
            Inscriptions par jour
          </CardTitle>
          <SeriesBarChart title="Nouveaux comptes" data={data.series.signups} />
        </Card>
      </div>
    </section>
  );
}

// ── 3. Les entonnoirs ───────────────────────────────────────────────────────

function FunnelBlock() {
  const data = useQuery(api.adminPulse.funnel);
  if (data === undefined) return <BlockLoading />;
  if (data === null) return null;

  const { waitlist } = data;
  return (
    <section aria-labelledby="funnel-title" className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="funnel-title" className="text-lg font-semibold text-stone-900">
          Où l&apos;on perd du monde
        </h2>
        <p className="text-sm text-stone-600">
          Liste d&apos;attente : {formatNumber(waitlist.total)}
          {waitlist.capped ? "+" : ""} adresses ({waitlist.ecole} écoles, {waitlist.parent}{" "}
          parents, {waitlist.professeur} professeurs).{" "}
          <Link href="/admin/liste-attente" className="font-medium text-(--dash-strong) underline">
            Voir
          </Link>
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="space-y-4 p-5">
          <CardTitle
            icon={Filter}
            description="Un compte « sert » quand le parent a un enfant, le professeur une classe, l'école son école."
          >
            Adultes
          </CardTitle>
          <FunnelBars steps={data.adults} />
        </Card>
        <Card className="space-y-4 p-5">
          <CardTitle icon={GraduationCap} description="Du compte créé à l'élève qui revient jouer.">
            Élèves
          </CardTitle>
          <FunnelBars steps={data.students} />
        </Card>
        <Card className="space-y-4 p-5">
          <CardTitle icon={Building2} description="Du devis reçu au contrat payé.">
            Écoles
          </CardTitle>
          <FunnelBars steps={data.schools} />
        </Card>
      </div>
      {data.capped && (
        <Notice tone="warning">
          Les entonnoirs sont calculés sur les comptes les plus récents seulement.
        </Notice>
      )}
    </section>
  );
}

// ── 4. Qui joue ─────────────────────────────────────────────────────────────

function EngagementBlock({ days }: { days: Period }) {
  const data = useQuery(api.adminPulse.engagement, { days });
  if (data === undefined) return <BlockLoading />;
  if (data === null) return null;

  const anyone = data.byClass.some((row) => row.activeStudents > 0);
  return (
    <section aria-labelledby="engagement-title" className="space-y-3">
      <h2 id="engagement-title" className="text-lg font-semibold text-stone-900">
        Qui joue, sur {days} jours
      </h2>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="space-y-4 p-5">
          <CardTitle icon={Users} description="Élèves actifs par niveau, et part de séances réussies">
            Par niveau
          </CardTitle>
          {anyone ? (
            <BarList
              valueLabel="élèves actifs"
              rows={data.byClass.map((row) => ({
                label: row.class,
                value: row.activeStudents,
                detail: row.successRate === null ? undefined : `${row.successRate} % réussies`,
              }))}
            />
          ) : (
            <p className="text-sm text-stone-600">Aucun élève n&apos;a joué sur la période.</p>
          )}
        </Card>

        <Card className="space-y-3 p-5">
          <CardTitle icon={School} description="Classées par élèves actifs">
            Écoles les plus actives
          </CardTitle>
          {data.topSchools.length === 0 ? (
            <p className="text-sm text-stone-600">
              Aucune école n&apos;a d&apos;élève actif sur la période.
            </p>
          ) : (
            <ol className="divide-y divide-stone-100">
              {data.topSchools.map((school) => (
                <li key={school.id}>
                  <Link
                    href={`/admin/ecoles/detail?id=${school.id}`}
                    className="flex min-h-11 items-center justify-between gap-3 py-2 text-sm outline-none hover:underline focus-visible:ring-2 focus-visible:ring-(--dash-strong)"
                  >
                    <span className="min-w-0 truncate font-medium text-stone-900">
                      {school.name}
                    </span>
                    <span className="shrink-0 tabular-nums text-stone-700">
                      {school.activeStudents} élèves, {school.sessions} séances
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
          <p className="border-t border-stone-100 pt-3 text-xs text-stone-500">
            Hors école (enfants de parents, classes de professeurs seuls) :{" "}
            {data.outsideSchools.activeStudents} élèves actifs,{" "}
            {data.outsideSchools.sessions} séances.
          </p>
        </Card>

        <Card className="space-y-3 p-5">
          <CardTitle
            icon={AlertTriangle}
            description="Des élèves inscrits, et aucune séance sur la période"
          >
            Écoles silencieuses
          </CardTitle>
          {data.quietSchoolCount === 0 ? (
            <p className="text-sm text-stone-600">
              Toutes les écoles qui ont des élèves inscrits ont joué.
            </p>
          ) : (
            <>
              <p className="text-2xl font-bold tabular-nums text-stone-900">
                {data.quietSchoolCount}
              </p>
              <ul className="divide-y divide-stone-100">
                {data.quietSchools.map((school) => (
                  <li key={school.id}>
                    <Link
                      href={`/admin/ecoles/detail?id=${school.id}`}
                      className="flex min-h-11 items-center justify-between gap-2 py-2 text-sm font-medium text-stone-900 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-(--dash-strong)"
                    >
                      <span className="min-w-0 truncate">{school.name}</span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-stone-400" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
              {data.quietSchoolCount > data.quietSchools.length && (
                <p className="text-xs text-stone-500">
                  Et {data.quietSchoolCount - data.quietSchools.length} autres.
                </p>
              )}
              <p className="text-xs text-stone-500">
                Une école qui ne joue pas ne renouvelle pas : à appeler en premier.
              </p>
            </>
          )}
        </Card>
      </div>
    </section>
  );
}

// ── 5. Argent et fidélisation ───────────────────────────────────────────────

function RetentionCard() {
  const data = useQuery(api.adminConsole.retention);
  if (data === undefined) return <BlockLoading />;
  if (data === null) return null;
  const lastClosed = [...data.cohorts].reverse().find((c) => c.renewalRate !== null);
  return (
    <Card className="p-5">
      <CardTitle icon={HeartHandshake} description={`Année scolaire ${data.schoolYear}`}>
        Fidélisation
      </CardTitle>
      <div className="mt-3 divide-y divide-stone-100">
        <MetricRow label="Clients abonnés" value={data.counts.active + data.counts.at_risk} />
        <MetricRow
          label="À risque"
          hint="Retard, ou fin dans 60 jours"
          value={data.counts.at_risk}
        />
        <MetricRow label="Partis" value={data.counts.churned} />
        <MetricRow
          label="Renouvellement"
          hint={lastClosed ? `Année ${lastClosed.schoolYear}` : "Aucune année finie"}
          value={lastClosed ? `${lastClosed.renewalRate} %` : "—"}
        />
      </div>
      <ButtonLink href="/admin/fidelisation" variant="secondary" className="mt-3 w-full">
        Voir qui relancer
      </ButtonLink>
    </Card>
  );
}

// ── 6. Derniers événements ──────────────────────────────────────────────────

const FEED_ICON: Record<string, LucideIcon> = {
  signup: UserPlus,
  quote: Building2,
  coupon: BadgePercent,
  payment: HandCoins,
  school: School,
};

function FeedBlock() {
  const items = useQuery(api.adminPulse.feed);
  if (items === undefined) return <BlockLoading />;
  if (items === null) return null;
  return (
    <Card className="p-5">
      <CardTitle icon={History} description="Inscriptions d'adultes, devis, coupons, versements, écoles">
        Derniers événements
      </CardTitle>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-stone-600">Rien pour l&apos;instant.</p>
      ) : (
        <ul className="mt-3 divide-y divide-stone-100">
          {items.map((item) => {
            const Icon = FEED_ICON[item.kind] ?? History;
            const body = (
              <>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-600">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-stone-900">
                    {item.title}
                  </span>
                  <span className="block truncate text-xs text-stone-600">{item.detail}</span>
                </span>
                <span className="shrink-0 text-xs text-stone-500">{formatDayTime(item.at)}</span>
              </>
            );
            return (
              <li key={item.key}>
                {item.href ? (
                  <Link
                    href={item.href}
                    className="flex min-h-12 items-center gap-3 py-2 outline-none hover:bg-stone-50 focus-visible:ring-2 focus-visible:ring-(--dash-strong)"
                  >
                    {body}
                  </Link>
                ) : (
                  <div className="flex min-h-12 items-center gap-3 py-2">{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

// ── 5 et 7. Argent, totaux, plateforme ──────────────────────────────────────

const ROLE_ROWS = [
  { role: "student", label: "Élèves" },
  { role: "parent", label: "Parents" },
  { role: "professeur", label: "Professeurs" },
  { role: "directeur", label: "Comptes école" },
  { role: "admin", label: "Équipe" },
] as const;

function TotalsBlock() {
  const data = useQuery(api.adminConsole.overview);
  if (data === undefined) return <LoadingBlock label="Calcul des totaux" />;
  if (data === null) return null;

  const { accounts, revenue, subscriptions, schools, growth, ai } = data;
  const aiShare =
    ai.budgetUsd && ai.budgetUsd > 0 ? Math.round((ai.costUsd / ai.budgetUsd) * 100) : null;

  return (
    <>
      <section aria-labelledby="money-title" className="space-y-3">
        <h2 id="money-title" className="text-lg font-semibold text-stone-900">
          Argent et fidélisation
        </h2>
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="space-y-4 p-5 lg:col-span-2">
            <CardTitle
              icon={HandCoins}
              description={`Total encaissé : ${fcfa(revenue.collectedTotal)}. À encaisser : ${fcfa(revenue.pendingFcfa)}. En retard : ${fcfa(revenue.overdueFcfa)}.`}
            >
              Revenus encaissés par mois, sur 12 mois
            </CardTitle>
            <SeriesBarChart
              title="Montant encaissé"
              data={revenue.byMonth}
              formatValue={fcfa}
              height={200}
            />
            <div className="flex flex-wrap gap-2">
              <ButtonLink href="/admin/revenus" variant="secondary">
                <Wallet className="h-4 w-4" aria-hidden />
                Contrats et échéances
              </ButtonLink>
              <ButtonLink href="/admin/coupons" variant="secondary">
                <BadgePercent className="h-4 w-4" aria-hidden />
                Coupons
              </ButtonLink>
            </div>
          </Card>
          <RetentionCard />
        </div>
      </section>

      <section aria-labelledby="platform-title" className="space-y-3">
        <h2 id="platform-title" className="text-lg font-semibold text-stone-900">
          La plateforme aujourd&apos;hui
        </h2>
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="p-5">
            <CardTitle icon={Users} description="Total des comptes, par rôle">
              Comptes
            </CardTitle>
            <div className="mt-3 divide-y divide-stone-100">
              {ROLE_ROWS.map(({ role, label }) => (
                <MetricRow key={role} label={label} value={boundedLabel(accounts[role].total)} />
              ))}
            </div>
            <ButtonLink href="/admin/comptes" variant="secondary" className="mt-3 w-full">
              Voir tous les comptes
            </ButtonLink>
          </Card>

          <Card className="p-5">
            <CardTitle icon={School} description="Écoles réelles, hors espaces personnels">
              Écoles et contrats
            </CardTitle>
            <div className="mt-3 divide-y divide-stone-100">
              <MetricRow
                label="Écoles"
                hint={`${schools.active} actives, ${schools.prospect} prospects, ${schools.suspended} suspendues`}
                value={formatNumber(schools.total)}
              />
              <MetricRow
                label="Professeurs sans école"
                hint="Espaces personnels"
                value={schools.personalSpaces}
              />
              <MetricRow label="Classes" value={boundedLabel(data.classes)} />
              <MetricRow
                label="Contrats actifs"
                hint={`${subscriptions.pastDue} en retard, ${subscriptions.pendingPayment} non payés`}
                value={subscriptions.active}
              />
              <MetricRow
                label="Places payées en cours"
                value={formatNumber(subscriptions.seatsCovered)}
              />
            </div>
            <ButtonLink href="/admin/ecoles" variant="secondary" className="mt-3 w-full">
              Voir les écoles
            </ButtonLink>
          </Card>

          <Card className="p-5">
            <CardTitle icon={Bot} description={`Mois ${ai.month}`}>
              IA, accès et jeu
            </CardTitle>
            <div className="mt-3 space-y-3">
              <div>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="text-stone-700">Budget IA du mois</span>
                  <span className="font-semibold tabular-nums text-stone-900">
                    {ai.costUsd.toFixed(2)} $
                    {ai.budgetUsd !== null ? ` / ${ai.budgetUsd} $` : ""}
                  </span>
                </div>
                {aiShare !== null && (
                  <div className="mt-1.5">
                    <ProgressBar value={aiShare} label={`Budget IA utilisé à ${aiShare} %`} />
                  </div>
                )}
                <p className="mt-1 text-xs text-stone-500">
                  {formatNumber(ai.calls)} appels
                  {aiShare !== null ? `, ${aiShare} % du budget` : ""}
                </p>
              </div>
              <div className="divide-y divide-stone-100 border-t border-stone-100">
                <MetricRow
                  label="Codes d'invitation actifs"
                  value={growth.invitationsActive}
                />
                <MetricRow
                  label="Coupons actifs"
                  hint={`${formatNumber(growth.couponUses)} utilisations`}
                  value={growth.couponsActive}
                />
                <MetricRow
                  label="Cauris en circulation"
                  hint={`${boundedLabel(data.economy.wallets)} porte-monnaie`}
                  value={formatNumber(data.economy.caurisInCirculation)}
                />
              </div>
            </div>
          </Card>
        </div>
      </section>
    </>
  );
}

// ── La page ─────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const [days, setDays] = useState<Period>(30);
  const profile = useQuery(api.profiles.getCurrentProfile);

  if (profile === undefined) return <LoadingBlock />;
  if (profile === null || profile.role !== "admin") {
    return (
      <Notice tone="error">Ce tableau de bord est réservé à l&apos;équipe Jotna.</Notice>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader
        title="Tableau de bord"
        description="Ce qu'il faut traiter, ce qui bouge, qui joue, et où en est l'argent."
        actions={
          <PeriodSwitch value={days} onChange={setDays} options={PERIODS} />
        }
      />

      <TodoBlock />

      <div className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-stone-900">
          <TrendingUp className="h-5 w-5 text-(--dash-strong)" aria-hidden />
          Les {days} derniers jours, comparés aux {days} jours d&apos;avant
        </h2>
        <PulseBlock days={days} />
      </div>

      <FunnelBlock />
      <EngagementBlock days={days} />
      <TotalsBlock />
      <FeedBlock />
    </div>
  );
}
