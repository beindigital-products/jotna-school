"use client";

/**
 * LE HORS-LIGNE DANS L'ARBRE REACT — qui joue sur cet appareil, et ce qui se
 * passe quand le réseau est là.
 *
 * L'ESPACE ÉLÈVE NE DÉPEND PLUS DU RÉSEAU. Il lit le moteur local
 * (`lib/offline/engine.ts`) : ce que l'appareil sait de l'enfant, plus ce
 * qu'il a fait depuis. Le réseau, quand il est là, sert à trois choses :
 * confirmer qui est connecté, rafraîchir le paquet, envoyer le journal.
 *
 * QUI JOUE ICI. Un enfant qui s'est connecté une fois sur cet appareil y est
 * retenu (`device.json`) : l'application le rouvre sans réseau, sans attendre
 * que Convex confirme sa session — ce qu'il ne peut pas faire hors ligne.
 * Dès que le serveur répond, c'est lui qui dit qui est connecté : un autre
 * élève prend la place, un adulte n'ouvre pas l'espace élève.
 *
 * CE FOURNISSEUR NE SE CHARGE QUE DANS LA COQUE NATIVE (iOS, Android) :
 * `offline-provider.tsx` l'importe à la demande, quand `useNativeAppOrUnknown`
 * reconnaît l'application. Sur le web, ni lui ni le moteur, sa
 * synchronisation et le stockage de l'appareil ne se téléchargent : rien ne
 * s'écrit, et les pages élève lisent Convex (`hooks/use-student-data.ts`).
 * Les écrans lisent le contexte par `./context`.
 *
 * Le mode d'emploi complet : `docs/hors-ligne.md`.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useConvex, useConvexAuth, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { OfflineEngine, readDevice, writeDevice, type DeviceState } from "@/lib/offline/engine";
import { OfflineSync, type DownloadProgress } from "@/lib/offline/sync";
import { useIsNativeApp } from "@/hooks/use-native-app";
import {
  OFFLINE_OFF,
  OfflineContext,
  noopSubscribe,
  zero,
  type OfflineContextValue,
  type OfflineStatus,
} from "./context";

/** Vrai tant que la connexion temps réel de Convex est ouverte. */
function useConvexConnected(): boolean {
  const convex = useConvex();
  const subscribe = useCallback(
    (onChange: () => void) => convex.subscribeToConnectionState(() => onChange()),
    [convex],
  );
  const read = useCallback(() => convex.connectionState().isWebSocketConnected, [convex]);
  return useSyncExternalStore(subscribe, read, () => false);
}

export function NativeOfflineProvider({ children }: { children: ReactNode }) {
  // Monté après l'hydratation, dans la coque native seulement : toujours vrai
  // ici. La garde reste au cas où un écran le monterait ailleurs.
  const native = useIsNativeApp();
  const convex = useConvex();
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const connected = useConvexConnected();
  const serverSnapshot = useQuery(
    api.offline.pack.snapshot,
    native && isAuthenticated ? {} : "skip",
  );

  const [booted, setBooted] = useState(false);
  const [engine, setEngine] = useState<OfflineEngine | null>(null);
  const engineRef = useRef<OfflineEngine | null>(null);
  const deviceRef = useRef<DeviceState>({ current: null, profiles: {} });
  const opening = useRef<Promise<OfflineEngine> | null>(null);

  const openEngine = useCallback(async (profileId: string) => {
    if (engineRef.current?.profileId === profileId) return engineRef.current;
    if (opening.current) {
      const pending = await opening.current;
      if (pending.profileId === profileId) return pending;
    }
    const promise = OfflineEngine.open(profileId);
    opening.current = promise;
    const opened = await promise;
    if (opening.current === promise) opening.current = null;
    engineRef.current = opened;
    setEngine(opened);
    return opened;
  }, []);

  // 1. L'APPAREIL SE RELIT : quel élève rouvrir sans attendre le réseau.
  useEffect(() => {
    if (!native) return;
    let cancelled = false;
    void (async () => {
      try {
        const device = await readDevice();
        deviceRef.current = device;
        if (device.current) await openEngine(device.current);
      } catch (error) {
        console.error("[hors-ligne] relecture de l'appareil impossible", error);
      } finally {
        if (!cancelled) setBooted(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [native, openEngine]);

  // En développement, le moteur se lit depuis la console (`__jotnaOffline`).
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    (window as unknown as { __jotnaOffline?: OfflineEngine | null }).__jotnaOffline = engine;
  }, [engine]);

  // 2. LE SERVEUR DIT QUI EST CONNECTÉ, et apporte la progression à jour.
  useEffect(() => {
    if (!booted || !serverSnapshot) return;
    const profileId = serverSnapshot.profile._id as string;
    void (async () => {
      const current = await openEngine(profileId);
      current.setSnapshot(serverSnapshot);
      const device = deviceRef.current;
      const next: DeviceState = {
        current: profileId,
        profiles: {
          ...device.profiles,
          [profileId]: {
            name: serverSnapshot.profile.name,
            class: serverSnapshot.profile.class ?? null,
            lastOnlineAt: Date.now(),
          },
        },
      };
      deviceRef.current = next;
      await writeDevice(next).catch(() => {});
    })();
  }, [booted, serverSnapshot, openEngine]);

  // 3. LE MODULE D'ARABE, quand l'école l'a allumé.
  const engineVersion = useSyncExternalStore(
    engine?.subscribe ?? noopSubscribe,
    engine?.getVersion ?? zero,
    zero,
  );
  const arabicOn = useMemo(
    () => engine?.snapshot?.modules.some((m) => m.key === "arabe_coran" && m.enabled) ?? false,
    // eslint-disable-next-line react-hooks/exhaustive-deps -- le moteur change de version, pas d'identité
    [engine, engineVersion],
  );
  const serverArabic = useQuery(
    api.offline.pack.arabicSnapshot,
    isAuthenticated && arabicOn ? {} : "skip",
  );
  useEffect(() => {
    if (!engine || !serverArabic || !serverSnapshot) return;
    if (serverSnapshot.profile._id !== engine.profileId) return;
    engine.setArabic(serverArabic);
  }, [engine, serverArabic, serverSnapshot]);

  // Le serveur reconnaît-il l'élève du moteur ?
  const confirmed =
    !!engine && !!serverSnapshot && serverSnapshot.profile._id === engine.profileId;
  // Un adulte connecté sur l'appareil : pas d'espace élève.
  const adultSignedIn = isAuthenticated && serverSnapshot === null;
  // Plus de session du tout (déconnecté, ou jeton effacé) : on joue encore
  // hors ligne, mais il faudra se reconnecter quand le réseau sera là.
  const signedOut = !authLoading && !isAuthenticated;

  // 4. LA SYNCHRONISATION, quand le serveur est joignable et reconnaît l'élève.
  const sync = useMemo(() => (engine ? new OfflineSync(convex, engine) : null), [convex, engine]);
  const canSync = connected && confirmed && sync !== null;
  const [preparing, setPreparing] = useState(false);
  const [clips, setClips] = useState<DownloadProgress | null>(null);
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runFlush = useCallback(async () => {
    if (!sync) return;
    const { applied } = await sync.flush();
    if (applied > 0) await sync.refreshBadgeInputs().catch(() => {});
  }, [sync]);

  const requestSync = useCallback(() => {
    if (!canSync) return;
    if (flushTimer.current) clearTimeout(flushTimer.current);
    flushTimer.current = setTimeout(() => void runFlush(), 1200);
  }, [canSync, runFlush]);

  // Chaque geste enregistré part au plus tôt quand le réseau est là.
  useEffect(() => {
    if (!canSync || !engine) return;
    void runFlush();
    const unsubscribe = engine.subscribe(() => {
      if (engine.pendingCount() > 0) requestSync();
    });
    const interval = setInterval(() => void runFlush(), 60_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") void runFlush();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      unsubscribe();
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      if (flushTimer.current) clearTimeout(flushTimer.current);
    };
  }, [canSync, engine, runFlush, requestSync]);

  // LE SAC DE VOYAGE : le contenu, la voix de Pio, les paliers manquants.
  // Une préparation à la fois ; une demande pendant qu'elle tourne la relance
  // à la fin (le contenu a changé, le réseau est revenu).
  const contentVersion = engine?.snapshot?.contentVersion ?? null;
  const preparation = useRef<{ running: boolean; again: boolean }>({ running: false, again: false });
  useEffect(() => {
    if (!canSync || !sync || !engine) return;
    const state = preparation.current;
    if (state.running) {
      state.again = true;
      return;
    }
    state.running = true;
    void (async () => {
      setPreparing(true);
      try {
        do {
          state.again = false;
          await sync.refreshContent();
          if (!engine.badgeInputs) await sync.refreshBadgeInputs();
          // La voix d'abord : le contenu déjà là se joue alors sans réseau.
          await sync.downloadClips(setClips);
          await sync.preparePaliers();
          await sync.downloadClips(setClips);
        } while (state.again);
      } catch (error) {
        console.warn("[hors-ligne] préparation du sac interrompue", error);
      } finally {
        state.running = false;
        setPreparing(false);
      }
    })();
  }, [canSync, sync, engine, contentVersion]);

  // Les trophées mérités sur l'appareil se rangent dès qu'on les voit.
  useEffect(() => {
    if (!engine) return;
    const deserved = engine.model().deservedLocally;
    if (deserved.length > 0) engine.recordLocalBadges(deserved);
  }, [engine, engineVersion]);

  const forgetCurrent = useCallback(async () => {
    const device = deviceRef.current;
    const next: DeviceState = { ...device, current: null };
    deviceRef.current = next;
    await writeDevice(next).catch(() => {});
    engineRef.current = null;
    setEngine(null);
  }, []);

  // Le serveur a nommé un élève dont le moteur s'ouvre encore ; ou la session
  // se vérifie en ligne alors que l'appareil n'a personne à rouvrir.
  const switching =
    !!serverSnapshot && (!engine || engine.profileId !== (serverSnapshot.profile._id as string));
  const waitingForServer =
    !engine && connected && (authLoading || (isAuthenticated && serverSnapshot === undefined));
  const status: OfflineStatus =
    !booted || switching || waitingForServer
      ? "booting"
      : engine && !adultSignedIn
        ? "ready"
        : "none";

  const value = useMemo<OfflineContextValue>(
    () => ({
      enabled: true,
      status,
      engine,
      sync,
      connected,
      confirmed,
      signedOut,
      preparing,
      clips,
      requestSync,
      forgetCurrent,
    }),
    [status, engine, sync, connected, confirmed, signedOut, preparing, clips, requestSync, forgetCurrent],
  );

  return (
    <OfflineContext.Provider value={native ? value : OFFLINE_OFF}>{children}</OfflineContext.Provider>
  );
}
