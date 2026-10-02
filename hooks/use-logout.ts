"use client";

import { useCallback } from "react";
import { useAuthActions } from "@convex-dev/auth/react";

import { clearConvexAuthTokens, logout } from "@/lib/auth";
import { useOffline } from "@/components/offline/context";

/** Sans réponse du serveur au bout de ce délai, on déconnecte quand même l'appareil. */
const SIGN_OUT_TIMEOUT_MS = 5000;

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
 *
 * DANS L'APPLICATION, L'APPAREIL OUBLIE D'ABORD QUI ROUVRIR (`docs/hors-ligne.md`)
 * : sans cela, l'espace élève se rouvrirait sans réseau. Le travail pas encore
 * envoyé reste dans le téléphone, et part quand l'enfant se reconnecte. Sans
 * réseau, Convex ne peut pas fermer la session : on n'attend pas sa réponse
 * (la promesse resterait pendante jusqu'au retour du réseau), on efface les
 * jetons de l'appareil et on part.
 */
export function useLogout(): () => Promise<void> {
  const { signOut } = useAuthActions();
  const offline = useOffline();

  return useCallback(async () => {
    if (offline.enabled) {
      await offline.forgetCurrent();
      if (offline.connected) {
        await Promise.race([
          logout(signOut).catch(() => {}),
          new Promise<void>((resolve) => setTimeout(resolve, SIGN_OUT_TIMEOUT_MS)),
        ]);
      }
    } else {
      await logout(signOut);
    }
    clearConvexAuthTokens();
    window.location.href = "/login";
  }, [signOut, offline]);
}
