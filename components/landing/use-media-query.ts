"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * VRAI QUAND LA REQUÊTE DE MÉDIA S'APPLIQUE. Le pré-rendu et le premier rendu
 * de l'hydratation disent « faux » : la page n'a pas d'écran à interroger, et
 * les deux doivent être identiques (même raison que `hooks/use-device-tier.ts`).
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (notify: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", notify);
      return () => list.removeEventListener("change", notify);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}
