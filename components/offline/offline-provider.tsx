/**
 * LE SITE WEB N'A PAS DE HORS-LIGNE : ce fournisseur ne fait rien.
 *
 * Aucun élève ne joue sur le site (`lib/build-target.ts`). L'application lit
 * à la place de ce fichier `offline-provider.app.tsx` (`next.config.ts`) :
 * le moteur, sa synchronisation et le stockage de l'appareil ne sont donc
 * pas embarqués dans le site, et `useOffline()` (`./context`) y rend la
 * valeur éteinte.
 */

import type { ReactNode } from "react";

export function OfflineProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
