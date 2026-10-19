"use client";

import { useSyncExternalStore } from "react";

/**
 * TIER D'APPAREIL — « lite » ou « full ».
 *
 * LE TERRAIN, C'EST DAKAR : des Android d'entrée de gamme, une donnée chère,
 * un réseau qui hésite. Le jeu doit y être entier — la savane, Pio, la carte —
 * mais pas au prix d'un écran qui rame ou d'un forfait qui fond. Ce hook dit
 * aux écrans jusqu'où aller : décors bitmap et parallaxe sur « full », décor
 * CSS et mouvements sobres sur « lite ». Personne n'a une expérience cassée ;
 * certains en ont une plus riche.
 *
 * LES SEUILS SONT CEUX DE LA CONCEPTION DE JUILLET (G5) : `saveData`,
 * `deviceMemory ≤ 2`, `hardwareConcurrency ≤ 3`. S'y ajoutent un réseau 2G
 * annoncé et `prefers-reduced-data`, qui disent la même chose autrement.
 *
 * L'INSTANTANÉ SERVEUR VAUT « lite », DÉLIBÉRÉMENT. Le HTML pré-rendu est
 * donc toujours la version légère : c'est ce qui arrive en premier sur un
 * réseau lent, et c'est lui qui peint. L'enrichissement vient APRÈS
 * l'hydratation, quand l'appareil s'est révélé capable. `useSyncExternalStore`
 * porte cette différence serveur/client sans désynchronisation d'hydratation
 * — même raison que `components/native-app-gate.tsx`.
 *
 * La décision est mémorisée pour la session : un appareil ne change pas de
 * catégorie entre deux écrans, et la relire à chaque montage ferait clignoter
 * les décors.
 */
export type DeviceTier = "lite" | "full";

const STORAGE_KEY = "jotna.deviceTier";

/** Rien à écouter : le tier ne change pas en cours de vie de la page. */
const noSubscribe = () => () => {};

type NavigatorHints = Navigator & {
  connection?: { saveData?: boolean; effectiveType?: string };
  deviceMemory?: number;
};

function detect(): DeviceTier {
  if (typeof window === "undefined") return "lite";

  try {
    const remembered = sessionStorage.getItem(STORAGE_KEY);
    if (remembered === "lite" || remembered === "full") return remembered;
  } catch {
    // Stockage indisponible (navigation privée, données bloquées) : on
    // détecte à chaque fois, sans mémoire, et ce n'est pas grave.
  }

  const nav = navigator as NavigatorHints;
  const saveData = nav.connection?.saveData === true;
  const slowNetwork = /(^|-)2g$/.test(nav.connection?.effectiveType ?? "");
  const lowMemory =
    typeof nav.deviceMemory === "number" && nav.deviceMemory <= 2;
  const fewCores =
    typeof navigator.hardwareConcurrency === "number" &&
    navigator.hardwareConcurrency <= 3;
  const reducedData =
    window.matchMedia?.("(prefers-reduced-data: reduce)")?.matches === true;

  const tier: DeviceTier =
    saveData || slowNetwork || lowMemory || fewCores || reducedData
      ? "lite"
      : "full";

  try {
    sessionStorage.setItem(STORAGE_KEY, tier);
  } catch {
    // Même tolérance qu'à la lecture.
  }
  return tier;
}

let cached: DeviceTier | null = null;

function getSnapshot(): DeviceTier {
  if (cached === null) cached = detect();
  return cached;
}

function getServerSnapshot(): DeviceTier {
  return "lite";
}

export function useDeviceTier(): DeviceTier {
  return useSyncExternalStore(noSubscribe, getSnapshot, getServerSnapshot);
}
