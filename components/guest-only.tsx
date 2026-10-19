"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useConvexAuth, useQuery } from "convex/react";
import { Loader2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { hasStoredConvexSession, roleHomePath, type Role } from "@/lib/auth";
import { useOffline } from "@/components/offline/context";
import { useBrowserOnline } from "@/components/offline/use-browser-online";

const noop = () => () => {};

/**
 * LES ÉCRANS DE CONNEXION NE SONT QUE POUR LES VISITEURS. Un compte déjà
 * connecté qui revient sur `/login`, `/register` ou `/forgot-password` repart
 * vers son espace : il doit se déconnecter pour revoir ces écrans.
 *
 * Le site est un export statique (application Capacitor comprise) : pas de
 * middleware, la garde se fait ici, côté client.
 *
 * LA DÉCISION SE PREND UNE FOIS, à l'arrivée. Ensuite, les formulaires
 * ouvrent eux-mêmes une session (inscription, puis création de l'école) et
 * partent vers `/post-auth` : la garde ne doit pas les interrompre en plein
 * milieu.
 *
 * Un compte connecté SANS rôle reste sur l'écran : `roleHomePath` le
 * renverrait sur `/login`, et la garde tournerait en boucle.
 */
export function GuestOnly({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isLoading, isAuthenticated } = useConvexAuth();
  const profile = useQuery(
    api.profiles.getCurrentProfile,
    isAuthenticated ? {} : "skip",
  );
  const offline = useOffline();
  const online = useBrowserOnline();
  // Faux au rendu statique : `localStorage` n'existe que dans le navigateur.
  const hydrated = useSyncExternalStore(noop, () => true, () => false);
  const [guest, setGuest] = useState(false);

  // `null` : on attend encore. `"guest"` : l'écran s'affiche. Sinon, le
  // chemin de l'espace où renvoyer le compte connecté.
  let verdict: string | null = null;
  if (!hydrated) {
    verdict = null;
  } else if (offline.enabled && offline.status === "booting") {
    verdict = null;
  } else if (offline.enabled && offline.status === "ready") {
    // Dans l'application, l'appareil se souvient d'un élève : il retrouve
    // son camp, comme après une connexion (`app/post-auth/page.tsx`).
    verdict = "/student/home";
  } else if (!hasStoredConvexSession()) {
    verdict = "guest";
  } else if (isLoading) {
    // Sans réseau, Convex ne confirmera rien : l'écran s'affiche.
    verdict = offline.enabled && !online ? "guest" : null;
  } else if (!isAuthenticated) {
    verdict = "guest";
  } else if (profile !== undefined) {
    const role = (profile?.role as Role | undefined) ?? null;
    verdict = role ? roleHomePath(role) : "guest";
  }

  // Une fois visiteur, toujours visiteur pour cette visite.
  if (verdict === "guest" && !guest) setGuest(true);

  const target = !guest && verdict !== "guest" ? verdict : null;
  useEffect(() => {
    if (target) router.replace(target);
  }, [target, router]);

  if (!guest && verdict !== "guest") {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    );
  }
  return <>{children}</>;
}
