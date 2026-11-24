"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AccountSettings } from "@/components/dashboard/account-settings";
import { SwitchRow } from "@/components/dashboard/ui";
import { useServerFormSync } from "@/hooks/use-server-form-sync";

/** Préférence d'envoi des bulletins, vraie tant que le parent ne l'a pas coupée. */
function receiveReportsOf(profile: { preferences?: unknown }): boolean {
  const prefs = profile.preferences as { receiveReports?: boolean } | undefined;
  return prefs?.receiveReports ?? true;
}

export default function ParentSettingsPage() {
  const profile = useQuery(api.profiles.getCurrentProfile);
  const [receiveReports, setReceiveReports] = useState(true);

  // La case reprend la préférence du serveur quand elle change.
  useServerFormSync(
    profile,
    (p) => String(receiveReportsOf(p)),
    (p) => setReceiveReports(receiveReportsOf(p)),
  );

  return (
    <AccountSettings
      description="Votre nom et la réception des rapports par e-mail."
      extraPatch={{ receiveReports }}
    >
      <div className="border-t border-stone-100 pt-5">
        <h2 className="font-semibold text-stone-900">E-mails</h2>
        <div className="mt-3">
          <SwitchRow
            id="receive-reports"
            checked={receiveReports}
            onCheckedChange={setReceiveReports}
            label="Recevoir les rapports par e-mail"
            description="Un e-mail chaque fois qu'un de vos enfants termine une thématique."
          />
        </div>
      </div>
    </AccountSettings>
  );
}
