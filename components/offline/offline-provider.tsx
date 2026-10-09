"use client";

/**
 * LE HORS-LIGNE N'EXISTE QUE DANS L'APPLICATION.
 *
 * Le même build sert le web et l'application iOS/Android. Dans la coque
 * native, ce fournisseur télécharge le moteur (`native-offline-provider.tsx`)
 * et l'espace élève joue sans réseau (`docs/hors-ligne.md`). Sur le web, il
 * ne charge rien : `useOffline()` y rend la valeur éteinte (`./context`), et
 * les pages élève lisent Convex (`hooks/use-student-data.ts`).
 *
 * Pendant le pré-rendu et l'hydratation, la plateforme n'est pas encore lue :
 * le HTML reste celui du web. Dans l'application, l'arbre se remonte ensuite
 * une fois sous le moteur, pendant que la garde de l'espace élève attend
 * (`./student-gate.tsx`).
 */

import { lazy, Suspense, type ReactNode } from "react";
import { useNativeAppOrUnknown } from "@/hooks/use-native-app";
import { OFFLINE_BOOTING, OfflineContext } from "./context";

const NativeOfflineProvider = lazy(() =>
  import("./native-offline-provider").then((m) => ({ default: m.NativeOfflineProvider })),
);

export function OfflineProvider({ children }: { children: ReactNode }) {
  const native = useNativeAppOrUnknown();
  if (native !== true) return <>{children}</>;
  return (
    <Suspense
      fallback={<OfflineContext.Provider value={OFFLINE_BOOTING}>{children}</OfflineContext.Provider>}
    >
      <NativeOfflineProvider>{children}</NativeOfflineProvider>
    </Suspense>
  );
}
