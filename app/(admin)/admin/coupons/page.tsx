"use client";

/**
 * LES COUPONS — accès gratuits et remises pour les parents, les professeurs
 * et les écoles.
 *
 * La page liste et montre ; créer un coupon s'ouvre dans une boîte de
 * dialogue. Le serveur garde chacune de ces fonctions (`convex/coupons.ts`),
 * les règles vivent dans `convex/couponRules.ts`.
 */

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { BadgePercent, ChevronDown, ChevronRight, Plus } from "lucide-react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  COUPON_AUDIENCES,
  COUPON_AUDIENCE_LABELS,
  COUPON_LIMITS,
  COUPON_STATUS_LABELS,
  REDEMPTION_STATE_LABELS,
  type CouponAudience,
  type CouponBenefitKind,
  type CouponStatus,
} from "@/convex/couponRules";
import { CodeChip } from "@/components/classroom/code-chip";
import {
  Button,
  Card,
  ConfirmAction,
  DateField,
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
  SelectField,
  formatDay,
  useAsyncAction,
} from "@/components/dashboard/ui";
import { StatusPill, formatNumber, type Tone } from "@/components/admin/console-ui";

type CouponRow = FunctionReturnType<typeof api.coupons.list>["coupons"][number];

const STATUS_TONE: Record<CouponStatus, Tone> = {
  active: "good",
  scheduled: "info",
  expired: "neutral",
  exhausted: "neutral",
  revoked: "critical",
};

const ROLE_LABEL: Record<string, string> = {
  parent: "Parent",
  professeur: "Professeur",
  directeur: "École",
};

const AUDIENCE_OPTIONS = COUPON_AUDIENCES.map((value) => ({
  value,
  label: COUPON_AUDIENCE_LABELS[value],
}));

const BENEFIT_OPTIONS: { value: CouponBenefitKind; label: string }[] = [
  { value: "free_access", label: "Accès gratuit (en jours)" },
  { value: "percent", label: "Remise en pourcentage" },
  { value: "amount", label: "Remise en FCFA" },
];

const BENEFIT_FIELD: Record<
  CouponBenefitKind,
  { label: string; hint: string; initial: string }
> = {
  free_access: {
    label: "Durée de l'accès gratuit (jours)",
    hint: `De 1 à ${COUPON_LIMITS.maxDays} jours, comptés à partir du jour où le code est saisi.`,
    initial: "30",
  },
  percent: {
    label: "Remise (%)",
    hint: "De 1 à 100 %. 100 % rend le paiement gratuit.",
    initial: "20",
  },
  amount: {
    label: "Remise (FCFA)",
    hint: `À partir de ${COUPON_LIMITS.minAmountFcfa} FCFA, déduits du prochain paiement.`,
    initial: "5000",
  },
};

/** Un jour « AAAA-MM-JJ » à minuit ou en fin de journée, heure de Dakar (UTC). */
function dayBoundary(value: string, end: boolean): number | undefined {
  if (!value) return undefined;
  const at = Date.parse(`${value}T${end ? "23:59:59" : "00:00:00"}Z`);
  return Number.isNaN(at) ? undefined : at;
}

function CreateCouponForm({
  close,
  onCreated,
}: {
  close: () => void;
  onCreated: (created: { code: string; label: string }) => void;
}) {
  const create = useMutation(api.coupons.create);
  const [label, setLabel] = useState("");
  const [audience, setAudience] = useState<CouponAudience>("parent");
  const [benefitKind, setBenefitKind] = useState<CouponBenefitKind>("free_access");
  const [benefitValue, setBenefitValue] = useState(BENEFIT_FIELD.free_access.initial);
  const [maxUses, setMaxUses] = useState("50");
  const [customCode, setCustomCode] = useState("");
  const [startsOn, setStartsOn] = useState("");
  const [endsOn, setEndsOn] = useState("");
  const { busy, error, run } = useAsyncAction("Le coupon n'a pas pu être créé.");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const result = await run(() =>
      create({
        label,
        audience,
        benefitKind,
        benefitValue: Number(benefitValue),
        maxUses: Number(maxUses),
        customCode: customCode.trim() || undefined,
        startsAt: dayBoundary(startsOn, false),
        expiresAt: dayBoundary(endsOn, true),
      }),
    );
    if (result) {
      onCreated({ code: result.code, label: label.trim() });
      close();
    }
  }

  const field = BENEFIT_FIELD[benefitKind];

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <Field
        label="Nom du coupon"
        htmlFor="coupon-label"
        hint="Il reste dans la console : la personne ne le voit pas."
      >
        <Input
          id="coupon-label"
          value={label}
          maxLength={COUPON_LIMITS.labelMax}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="ex : Rentrée 2027, parents"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Pour qui ?" htmlFor="coupon-audience">
          <SelectField
            id="coupon-audience"
            value={audience}
            onValueChange={setAudience}
            options={AUDIENCE_OPTIONS}
          />
        </Field>
        <Field label="Ce que donne le coupon" htmlFor="coupon-kind">
          <SelectField
            id="coupon-kind"
            value={benefitKind}
            onValueChange={(next) => {
              setBenefitKind(next);
              setBenefitValue(BENEFIT_FIELD[next].initial);
            }}
            options={BENEFIT_OPTIONS}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={field.label} htmlFor="coupon-value" hint={field.hint}>
          <Input
            id="coupon-value"
            type="number"
            inputMode="numeric"
            min={1}
            value={benefitValue}
            onChange={(e) => setBenefitValue(e.target.value)}
          />
        </Field>
        <Field
          label="Nombre d'utilisations"
          htmlFor="coupon-uses"
          hint="Chaque compte ne l'utilise qu'une fois."
        >
          <Input
            id="coupon-uses"
            type="number"
            inputMode="numeric"
            min={1}
            max={COUPON_LIMITS.maxUses}
            value={maxUses}
            onChange={(e) => setMaxUses(e.target.value)}
          />
        </Field>
      </div>

      <Field
        label="Code (facultatif)"
        htmlFor="coupon-code"
        hint="Laissez vide pour un code tiré au sort (PROMO-XXXX-XXXX). Sinon, de 4 à 24 lettres ou chiffres."
      >
        <Input
          id="coupon-code"
          value={customCode}
          maxLength={40}
          autoCapitalize="characters"
          onChange={(e) => setCustomCode(e.target.value)}
          placeholder="RENTREE2027"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Valable à partir du (facultatif)" htmlFor="coupon-start">
          <DateField id="coupon-start" value={startsOn} onChange={setStartsOn} />
        </Field>
        <Field label="Valable jusqu'au (facultatif)" htmlFor="coupon-end">
          <DateField id="coupon-end" value={endsOn} onChange={setEndsOn} disablePast />
        </Field>
      </div>

      {error && <Notice tone="error">{error}</Notice>}

      <DialogActions onCancel={close}>
        <Button type="submit" busy={busy}>
          Créer le coupon
        </Button>
      </DialogActions>
    </form>
  );
}

function Redemptions({ couponId }: { couponId: Id<"coupons"> }) {
  const rows = useQuery(api.coupons.listRedemptions, { couponId });
  if (rows === undefined) {
    return <p className="py-2 text-sm text-stone-500">Chargement…</p>;
  }
  if (rows.length === 0) {
    return (
      <p className="py-2 text-sm text-stone-600">
        Personne n&apos;a encore utilisé ce coupon.
      </p>
    );
  }
  return (
    <ul className="divide-y divide-stone-200">
      {rows.map((row) => (
        <li
          key={row.id}
          className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2 text-sm"
        >
          <span className="font-medium text-stone-900">{row.name}</span>
          {row.email && <span className="break-all text-stone-600">{row.email}</span>}
          <span className="text-stone-500">
            {ROLE_LABEL[row.role] ?? row.role}
            {row.schoolName ? `, ${row.schoolName}` : ""}
          </span>
          <span className="text-stone-500">le {formatDay(row.at)}</span>
          <StatusPill tone={row.state === "access_running" ? "good" : "neutral"}>
            {REDEMPTION_STATE_LABELS[row.state]}
            {row.accessUntil && row.state === "access_running"
              ? ` jusqu'au ${formatDay(row.accessUntil)}`
              : ""}
          </StatusPill>
        </li>
      ))}
    </ul>
  );
}

function CouponCard({ coupon }: { coupon: CouponRow }) {
  const setRevoked = useMutation(api.coupons.setRevoked);
  const [open, setOpen] = useState(false);
  const revoked = coupon.status === "revoked";

  const validity = [
    coupon.startsAt ? `à partir du ${formatDay(coupon.startsAt)}` : null,
    coupon.expiresAt ? `jusqu'au ${formatDay(coupon.expiresAt)}` : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <Card as="li" className="p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-stone-900">{coupon.label}</p>
          <p className="mt-0.5 text-sm text-stone-700">
            {coupon.benefitLabel}, pour : {COUPON_AUDIENCE_LABELS[coupon.audience].toLowerCase()}
          </p>
          <p className="mt-0.5 text-xs text-stone-500">
            Créé le {formatDay(coupon.createdAt)}.{" "}
            {validity ? `Valable ${validity}.` : "Sans date limite."}
          </p>
        </div>
        <StatusPill tone={STATUS_TONE[coupon.status]}>
          {COUPON_STATUS_LABELS[coupon.status]}
        </StatusPill>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <CodeChip code={coupon.code} label="le code du coupon" />
        <ConfirmAction
          trigger={revoked ? "Réactiver" : "Désactiver"}
          danger={!revoked}
          title={revoked ? "Réactiver ce coupon ?" : "Désactiver ce coupon ?"}
          message={
            revoked
              ? "Le code pourra de nouveau être saisi."
              : "Le code ne pourra plus être saisi. Les comptes qui l'ont déjà utilisé gardent leur avantage."
          }
          confirmLabel={revoked ? "Réactiver" : "Désactiver"}
          onConfirm={() => setRevoked({ couponId: coupon.id, revoked: !revoked })}
          failMessage="Le coupon n'a pas pu être modifié."
        />
      </div>

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
        {formatNumber(coupon.useCount)} utilisation{coupon.useCount > 1 ? "s" : ""} sur{" "}
        {formatNumber(coupon.maxUses)}
      </button>
      {open && (
        <div className="mt-1 rounded-xl bg-stone-50 px-3 py-1">
          <Redemptions couponId={coupon.id} />
        </div>
      )}
    </Card>
  );
}

export default function AdminCouponsPage() {
  const data = useQuery(api.coupons.list);
  const [created, setCreated] = useState<{ code: string; label: string } | null>(null);
  const pagination = usePagination(data?.coupons ?? []);

  const createButton = (
    <FormDialog
      trigger={
        <>
          <Plus className="h-4 w-4" aria-hidden />
          Nouveau coupon
        </>
      }
      title="Nouveau coupon"
      description="Un accès gratuit ou une remise, pour les parents, les professeurs, les écoles ou tout le monde."
    >
      {(close) => <CreateCouponForm close={close} onCreated={setCreated} />}
    </FormDialog>
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Coupons"
        description="Offrez un accès gratuit ou une remise. La personne saisit le code dans ses paramètres."
        actions={createButton}
      />

      <Notice tone="info">
        Tant que l&apos;accès libre est en place, l&apos;application est déjà
        gratuite pour tous. Chaque coupon utilisé est enregistré avec son
        avantage, et s&apos;appliquera quand les paiements en ligne ouvriront.
      </Notice>

      {created && (
        <Card className="space-y-3 border-emerald-200 bg-emerald-50 p-5">
          <p className="font-semibold text-emerald-900">
            Coupon créé : {created.label}
          </p>
          <p className="text-sm text-emerald-900">
            Envoyez ce code. La personne le saisit dans Paramètres, carte « Code promo ».
          </p>
          <CodeChip code={created.code} size="lg" label="le code du coupon" />
        </Card>
      )}

      {data === undefined ? (
        <LoadingBlock label="Chargement des coupons" />
      ) : data.coupons.length === 0 ? (
        <EmptyState
          icon={BadgePercent}
          title="Aucun coupon pour l'instant"
          description="Par exemple : un mois offert aux professeurs, ou une remise de rentrée pour les écoles."
        />
      ) : (
        <>
          {data.truncated && (
            <Notice tone="warning">
              Seuls les coupons les plus récents sont affichés.
            </Notice>
          )}
          <ul className="space-y-3">
            {pagination.pageItems.map((coupon) => (
              <CouponCard key={coupon.id} coupon={coupon} />
            ))}
          </ul>
          <Pagination pagination={pagination} label="coupons" />
        </>
      )}
    </div>
  );
}
