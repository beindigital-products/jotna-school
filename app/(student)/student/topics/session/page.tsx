"use client";

/**
 * LA SÉANCE D'UN PALIER : EN LIGNE SUR LE WEB, SUR L'APPAREIL DANS L'APPLICATION.
 *
 * Sur le web, chaque geste part au serveur (`./online-session.tsx`). Dans
 * l'application iOS/Android, la séance se joue sans réseau et part au
 * serveur quand il revient (`./offline-session.tsx`, `docs/hors-ligne.md`).
 * La séance hors ligne se charge à la demande : le web ne la télécharge pas.
 */

import { lazy, Suspense } from "react";
import { useOffline } from "@/components/offline/context";
import { OnlineSession } from "./online-session";

const OfflineSession = lazy(() =>
  import("./offline-session").then((m) => ({ default: m.OfflineSession })),
);

export default function TopicSessionPage() {
  const { enabled } = useOffline();
  if (!enabled) return <OnlineSession />;
  return (
    <Suspense fallback={null}>
      <OfflineSession />
    </Suspense>
  );
}
