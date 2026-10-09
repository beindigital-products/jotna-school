"use client";

/**
 * CE QUE LES ÉCRANS SAVENT DU HORS-LIGNE : le contexte, sans le moteur.
 *
 * Le fournisseur qui le remplit ne se charge que dans l'application
 * (`native-offline-provider.tsx`) ; sur le web, personne ne le remplit et
 * `useOffline()` rend la valeur par défaut, éteinte. Ce fichier n'importe du
 * moteur que des TYPES : le web peut le lire sans télécharger le moteur.
 */

import { createContext, useContext, useMemo, useSyncExternalStore } from "react";
import type { OfflineEngine } from "@/lib/offline/engine";
import type { DownloadProgress, OfflineSync } from "@/lib/offline/sync";
import type { OfflineModel } from "@/lib/offline/model";

export type OfflineStatus = "booting" | "none" | "ready";

export type OfflineContextValue = {
  /** Faux sur le web : l'espace élève y lit Convex, sans hors-ligne. */
  enabled: boolean;
  /** `booting` : l'appareil se relit ; `none` : personne à ouvrir ; `ready` : l'élève est là. */
  status: OfflineStatus;
  engine: OfflineEngine | null;
  sync: OfflineSync | null;
  /** Vrai quand Convex est joignable (la connexion temps réel est ouverte). */
  connected: boolean;
  /** Vrai quand le serveur a confirmé que l'élève du moteur est bien connecté. */
  confirmed: boolean;
  /** Vrai quand la session de connexion a disparu : il faudra se reconnecter en ligne. */
  signedOut: boolean;
  preparing: boolean;
  clips: DownloadProgress | null;
  /** Demande un envoi du journal au plus tôt. */
  requestSync: () => void;
  /** À la déconnexion : l'appareil oublie quel élève rouvrir (son journal est gardé). */
  forgetCurrent: () => Promise<void>;
};

export const OfflineContext = createContext<OfflineContextValue | null>(null);

/**
 * Le hors-ligne éteint : sur le web. `connected` y reste vrai, car le web n'a
 * pas de mode sans réseau : ses écrans se comportent comme en ligne.
 */
export const OFFLINE_OFF: OfflineContextValue = {
  enabled: false,
  status: "none",
  engine: null,
  sync: null,
  connected: true,
  confirmed: false,
  signedOut: false,
  preparing: false,
  clips: null,
  requestSync: () => {},
  forgetCurrent: async () => {},
};

/** Dans l'application, le temps que le moteur se télécharge : on attend. */
export const OFFLINE_BOOTING: OfflineContextValue = {
  ...OFFLINE_OFF,
  enabled: true,
  status: "booting",
  connected: false,
};

export function useOffline(): OfflineContextValue {
  return useContext(OfflineContext) ?? OFFLINE_OFF;
}

export function noopSubscribe(): () => void {
  return () => {};
}

export function zero(): number {
  return 0;
}

/**
 * Les vues de l'élève, recalculées à chaque geste. `undefined` tant que
 * l'appareil se relit, `null` quand personne n'est là.
 */
export function useOfflineModel(): OfflineModel | null | undefined {
  const { engine, status } = useOffline();
  const version = useSyncExternalStore(
    engine?.subscribe ?? noopSubscribe,
    engine?.getVersion ?? zero,
    zero,
  );
  return useMemo(() => {
    if (status === "booting") return undefined;
    if (!engine || status !== "ready") return null;
    return engine.model();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `version` dit quand le moteur a changé
  }, [engine, status, version]);
}
