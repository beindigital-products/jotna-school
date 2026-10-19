"use client";

import { useSyncExternalStore } from "react";

/**
 * Ce que l'appareil dit de son réseau (`navigator.onLine`). Moins fin que la
 * connexion à Convex (`useOffline().connected`), qui met une seconde à
 * s'ouvrir au démarrage : celui-ci répond tout de suite « pas de réseau du
 * tout », ce qui suffit pour ne pas faire attendre un écran de connexion.
 */
export function useBrowserOnline(): boolean {
  return useSyncExternalStore(subscribe, read, () => true);
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

function read(): boolean {
  return typeof navigator === "undefined" ? true : navigator.onLine;
}
