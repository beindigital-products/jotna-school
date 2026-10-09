"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { roleHomePath, type Role } from "@/lib/auth";
import { Pio } from "@/components/student/pio";

/**
 * LE CHARGEMENT DU JEU. C'est le premier écran de l'application native après
 * la connexion : il porte les couleurs du monde de Pio plutôt qu'un chapeau
 * gris, et il écarte l'encoche et la barre d'accueil du téléphone (l'écran
 * est entier sous `viewportFit: cover`), même si son contenu est centré.
 */
function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#bfe6fb_0%,#f9efd2_45%,#f6dfa4_100%)] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <div className="flex flex-col items-center gap-4">
        <Pio state="think" size={170} priority />
        <p className="font-display text-lg font-extrabold text-amber-950">
          Connexion en cours…
        </p>
      </div>
    </div>
  );
}

/**
 * Une session vient d'être ouverte : Convex Auth a écrit le jeton, mais le
 * serveur ne l'a pas encore confirmé. Pendant ces quelques centaines de
 * millisecondes, `isAuthenticated` vaut `false` alors que `isLoading` aussi :
 * sans cette garde, l'écran renvoyait l'élève sur `/login` juste après une
 * connexion réussie (observé sur le web, plus lent que le webview natif).
 */
function hasStoredSession(): boolean {
  try {
    return Object.keys(localStorage).some((k) => k.startsWith("__convexAuthJWT_"));
  } catch {
    return false;
  }
}

/** Au plus cette durée d'attente de la confirmation du serveur. */
const CONFIRM_TIMEOUT_MS = 8000;

export default function PostAuthPage() {
  const router = useRouter();
  const { isLoading, isAuthenticated } = useConvexAuth();
  const profile = useQuery(
    api.profiles.getCurrentProfile,
    isAuthenticated ? {} : "skip",
  );

  // `router.replace` ET NON `window.location.href`, SUR LES DEUX BRANCHES.
  // Dans l'application Capacitor, une navigation de DOCUMENT recharge
  // toujours la racine `index.html` quel que soit le chemin demandé —
  // `CapacitorRouter.route(for:)` renvoie `/index.html` pour tout chemin sans
  // extension. Cet écran envoyait donc l'élève sur la vitrine au lieu de son
  // accueil, et la connexion paraissait avoir échoué alors qu'elle avait
  // réussi. Une navigation interne de Next ne traverse pas ce routeur, et se
  // comporte à l'identique sur le web.
  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      if (!hasStoredSession()) {
        router.replace("/login");
        return;
      }
      const timer = setTimeout(() => router.replace("/login"), CONFIRM_TIMEOUT_MS);
      return () => clearTimeout(timer);
    }

    if (profile === undefined) return;

    router.replace(roleHomePath((profile?.role as Role) ?? null));
  }, [isLoading, isAuthenticated, profile, router]);

  return <LoadingScreen />;
}
