"use client";

import { useCallback } from "react";
import { useAuthActions } from "@convex-dev/auth/react";

import { clearConvexAuthTokens, logout } from "@/lib/auth";

/**
 * La déconnexion, une seule fois pour toute l'application.
 *
 * Trois gestes qui vont ensemble et que chaque écran recopiait : invalider la
 * session côté Convex Auth, effacer les jetons mis en cache dans
 * `localStorage`, puis recharger sur `/login`.
 *
 * LA SEULE NAVIGATION DE DOCUMENT QUI RESTE, ET ELLE EST VOULUE : un
 * rechargement complet jette l'état en mémoire, ce qu'une navigation interne
 * de Next conserverait. Dans l'application Capacitor elle atterrit sur la
 * racine — `CapacitorRouter` sert `/index.html` pour tout chemin sans
 * extension — d'où `NativeAppGate` renvoie aussitôt sur /login. Les deux
 * plateformes finissent donc au même endroit, déconnectées.
 */
export function useLogout(): () => Promise<void> {
  const { signOut } = useAuthActions();

  return useCallback(async () => {
    await logout(signOut);
    clearConvexAuthTokens();
    // Rechargement complet voulu (voir plus haut) : la règle de Next propose
    // `router.push`, qui garderait l'état en mémoire de l'utilisateur sortant.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/login";
  }, [signOut]);
}
