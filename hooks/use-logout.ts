"use client";

import { useCallback } from "react";
import { useAuthActions } from "@convex-dev/auth/react";

import { clearConvexAuthTokens, logout } from "@/lib/auth";

/**
 * La déconnexion, une seule fois pour toute l'application.
 *
 * Trois gestes qui vont ensemble et que chaque écran recopiait : invalider la
 * session côté Convex Auth, effacer les jetons mis en cache dans
 * `localStorage`, puis recharger sur `/login` (un rechargement complet, et non
 * une navigation client, pour que le client Convex reparte sans jeton).
 */
export function useLogout(): () => Promise<void> {
  const { signOut } = useAuthActions();

  return useCallback(async () => {
    await logout(signOut);
    clearConvexAuthTokens();
    window.location.href = "/login";
  }, [signOut]);
}
