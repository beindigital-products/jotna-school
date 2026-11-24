"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * L'ANCIENNE ADRESSE DE LA SALLE DES TROPHÉES.
 *
 * La salle vit maintenant dans « Mes trésors », sous l'onglet Trophées
 * (`app/(student)/student/tresors/page.tsx`, `TrophyRoom`). Cette page reste
 * pour les liens déjà donnés : elle y renvoie. Sous export statique il n'y a
 * pas de redirection côté serveur, et `router.replace` (jamais
 * `window.location`, voir `docs/capacitor-ios.md`) ne laisse pas l'ancienne
 * adresse dans l'historique.
 */
export default function StudentBadgesPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/student/tresors?onglet=trophees");
  }, [router]);
  return null;
}
