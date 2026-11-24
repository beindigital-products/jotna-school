"use client";

/**
 * LES PARAMÈTRES DU COMPTE, communs aux trois espaces : le nom, l'adresse de
 * connexion (lecture seule), la carte « Code promo » (`coupon-redeem.tsx`),
 * puis la déconnexion. Un espace ajoute ses propres
 * réglages par `children` (les e-mails du parent) et les enregistre par
 * `extraPatch`.
 */

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { LogOut, Save, UserRound } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { useLogout } from "@/hooks/use-logout";
import { useServerFormSync } from "@/hooks/use-server-form-sync";
import {
  Button,
  Card,
  CardTitle,
  Field,
  LoadingBlock,
  Notice,
  PageHeader,
  Input,
  useAsyncAction,
} from "./ui";
import { CouponRedeemCard } from "./coupon-redeem";

export function AccountSettings({
  description,
  extraPatch,
  children,
  after,
}: {
  description: string;
  /** Les champs propres à l'espace, envoyés avec le nom. */
  extraPatch?: { receiveReports?: boolean };
  /** Des réglages de plus, dans le formulaire. */
  children?: React.ReactNode;
  /** Des cartes de plus, sous le formulaire. */
  after?: React.ReactNode;
}) {
  const profile = useQuery(api.profiles.getCurrentProfile);
  const updateProfile = useMutation(api.profiles.updateProfile);
  const logout = useLogout();

  const [name, setName] = useState("");
  const [saved, setSaved] = useState(false);
  const { busy, error, run } = useAsyncAction("Erreur lors de l'enregistrement.");

  // Le formulaire reprend le nom du serveur quand il change.
  useServerFormSync(
    profile,
    (p) => p.name,
    (p) => setName(p.name),
  );

  if (!profile) return <LoadingBlock />;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false);
    // Le serveur écrit le profil de la session : pas de cible en argument.
    const done = await run(async () => {
      await updateProfile({ name, ...extraPatch });
      return true;
    });
    if (done) setSaved(true);
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader title="Paramètres" description={description} />

      <Card as="form" onSubmit={handleSave} className="space-y-5 p-5 sm:p-6">
        <CardTitle icon={UserRound}>Mon compte</CardTitle>

        <Field label="Nom" htmlFor="settings-name">
          <Input
            id="settings-name"
            type="text"
            required
            maxLength={80}
            autoComplete="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setSaved(false);
            }}
          />
        </Field>

        {profile.email && (
          <div>
            <p className="mb-1 text-sm font-medium text-stone-800">
              Adresse e-mail
            </p>
            <p className="break-all rounded-xl bg-stone-100 px-3 py-2.5 text-sm text-stone-700">
              {profile.email}
            </p>
            <p className="mt-1 text-xs text-stone-500">
              Elle sert à vous connecter. Elle ne se modifie pas ici.
            </p>
          </div>
        )}

        {children}

        <div className="flex flex-wrap items-center gap-3 border-t border-stone-100 pt-5">
          <Button type="submit" busy={busy}>
            {!busy && <Save className="h-4 w-4" aria-hidden />}
            Enregistrer
          </Button>
          {saved && <Notice tone="success">Modifications enregistrées.</Notice>}
          {error && <Notice tone="error">{error}</Notice>}
        </div>
      </Card>

      {after}

      {/* Un administrateur émet les coupons, il n'en utilise pas. */}
      {profile.role !== "admin" && <CouponRedeemCard />}

      <Card className="flex flex-wrap items-center justify-between gap-3 p-5 sm:p-6">
        <div>
          <h2 className="font-semibold text-stone-900">Session</h2>
          <p className="text-sm text-stone-600">
            Déconnectez-vous sur un appareil partagé.
          </p>
        </div>
        <Button variant="secondary" onClick={logout}>
          <LogOut className="h-4 w-4" aria-hidden />
          Se déconnecter
        </Button>
      </Card>
    </div>
  );
}
