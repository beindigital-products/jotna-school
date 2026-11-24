"use client";

/**
 * LA CARTE « CODE PROMO » des paramètres parent, professeur et école.
 *
 * La personne saisit un coupon reçu de l'équipe (`coupons.redeem`) et voit
 * ceux qu'elle a déjà utilisés (`coupons.myRedemptions`). Tant que
 * l'application est gratuite pour tous, l'avantage est enregistré et
 * s'appliquera au premier paiement : la carte le dit.
 */

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { BadgePercent } from "lucide-react";

import { api } from "@/convex/_generated/api";
import { REDEMPTION_STATE_LABELS } from "@/convex/couponRules";
import {
  Button,
  Card,
  CardTitle,
  Field,
  Input,
  Notice,
  formatDay,
  useAsyncAction,
} from "./ui";

export function CouponRedeemCard() {
  const redeem = useMutation(api.coupons.redeem);
  const redemptions = useQuery(api.coupons.myRedemptions);
  const [code, setCode] = useState("");
  const [done, setDone] = useState<string | null>(null);
  const { busy, error, run } = useAsyncAction("Le code n'a pas pu être utilisé.");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setDone(null);
    const result = await run(() => redeem({ code }));
    if (result) {
      setCode("");
      setDone(
        result.accessUntil
          ? `${result.benefitLabel}, jusqu'au ${formatDay(result.accessUntil)}.`
          : `${result.benefitLabel}, appliquée à votre prochain paiement.`,
      );
    }
  }

  return (
    <Card as="form" onSubmit={submit} className="space-y-4 p-5 sm:p-6">
      <CardTitle
        icon={BadgePercent}
        description="Vous avez reçu un code de l'équipe Jotna ? Saisissez-le ici."
      >
        Code promo
      </CardTitle>

      <Field label="Code" htmlFor="coupon-code-input">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id="coupon-code-input"
            value={code}
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            maxLength={64}
            placeholder="PROMO-XXXX-XXXX"
            onChange={(e) => {
              setCode(e.target.value);
              setDone(null);
            }}
          />
          <Button
            type="submit"
            busy={busy}
            disabled={code.trim() === ""}
            className="shrink-0"
          >
            Utiliser
          </Button>
        </div>
      </Field>

      {error && <Notice tone="error">{error}</Notice>}
      {done && <Notice tone="success">Code accepté : {done}</Notice>}

      {redemptions && redemptions.length > 0 && (
        <div className="border-t border-stone-100 pt-4">
          <p className="mb-2 text-sm font-medium text-stone-800">Vos codes</p>
          <ul className="space-y-2">
            {redemptions.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-baseline justify-between gap-2 text-sm"
              >
                <span className="text-stone-900">
                  {row.benefitLabel}
                  <span className="ml-2 font-mono text-xs text-stone-500">{row.code}</span>
                </span>
                <span className="text-stone-600">
                  {REDEMPTION_STATE_LABELS[row.state]}
                  {row.state === "access_running" && row.accessUntil
                    ? ` jusqu'au ${formatDay(row.accessUntil)}`
                    : ""}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-stone-500">
            L&apos;application est gratuite pendant le lancement. Votre avantage
            est enregistré et s&apos;appliquera quand les abonnements ouvriront.
          </p>
        </div>
      )}
    </Card>
  );
}
