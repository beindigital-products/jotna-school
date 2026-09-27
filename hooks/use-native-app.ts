"use client";

import { useSyncExternalStore } from "react";
import { Capacitor } from "@capacitor/core";

/** Rien à écouter : la plateforme ne change pas en cours de vie de la page. */
const noSubscribe = () => () => {};

/**
 * Vrai dans l'application Capacitor (iOS, Android), faux sur le web.
 *
 * `useSyncExternalStore` plutôt qu'un état posé dans un effet : la
 * plateforme n'est connue que du client, la lire pendant le rendu
 * désynchroniserait l'hydratation. L'instantané serveur vaut `false`, donc
 * le HTML pré-rendu est celui du web ; le client dit la vérité après
 * hydratation. Voir `components/native-app-gate.tsx` pour le contexte.
 */
export function useIsNativeApp(): boolean {
  return useSyncExternalStore(
    noSubscribe,
    () => Capacitor.isNativePlatform(),
    () => false,
  );
}
