"use client";

import { useSyncExternalStore } from "react";

/**
 * FAIT-IL NUIT AU CAMP ? Le camp suit l'heure de Dakar, pas celle de
 * l'appareil : c'est le même jour que la série, les missions et le coffre
 * (`convex/streakRules.ts`), et tous les enfants voient le même ciel. Dakar est
 * à UTC+0 sans heure d'été : l'heure UTC est l'heure locale. La nuit va de
 * 19 heures à 6 heures.
 *
 * `useSyncExternalStore` plutôt qu'un état posé au montage : le HTML pré-rendu
 * dit « jour » (`getServerSnapshot`), l'appareil corrige après l'hydratation
 * sans désaccord, et une horloge relue toutes les cinq minutes fait tomber la
 * nuit pendant que l'enfant joue.
 */
export function isDakarNight(date: Date): boolean {
  const hour = date.getUTCHours();
  return hour >= 19 || hour < 6;
}

function subscribe(onChange: () => void) {
  const timer = setInterval(onChange, 5 * 60 * 1000);
  return () => clearInterval(timer);
}

function getSnapshot(): boolean {
  return isDakarNight(new Date());
}

function getServerSnapshot(): boolean {
  return false;
}

export function useDakarNight(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
