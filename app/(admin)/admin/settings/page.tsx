"use client";

import { AccountSettings } from "@/components/dashboard/account-settings";

/** Le compte de l'administrateur connecté : son nom, son adresse, la déconnexion. */
export default function AdminSettingsPage() {
  return <AccountSettings description="Votre nom et votre compte d'administrateur." />;
}
