"use client";

/**
 * OÙ TROUVER UN SON DE PIO.
 *
 * Les lecteurs (`components/exercises/prompt-reader.tsx`,
 * `components/arabic/speech.ts`) demandent un son par sa référence : la
 * consigne d'un exercice, une lettre, un item de leçon. On cherche :
 *
 *   1. dans l'application, d'abord dans le sac de l'appareil
 *      (`lib/offline/clips.ts`) : il se joue sans réseau, c'est le cas
 *      ordinaire une fois le sac rempli ;
 *   2. sinon, et toujours sur le web, en ligne auprès du serveur
 *      (`offline/voice.prepareClips`) : il synthétise au besoin, on joue son
 *      adresse tout de suite, et l'application range le fichier dans le sac
 *      pour la prochaine fois ;
 *   3. sinon, rien : sans réseau, un son jamais téléchargé ne se joue pas,
 *      et le bouton passe en gris. L'exercice reste jouable.
 *
 * Le stockage de l'appareil se charge à la demande, dans l'application
 * seulement : le web ne le télécharge pas.
 *
 * LES TUILES SE DEMANDENT PAR PETITS LOTS, L'UN APRÈS L'AUTRE (`prepareTile`).
 * Quand un exercice apparaît, le lecteur demande la consigne et toutes les
 * propositions d'un coup. Avant le 24 novembre 2026, chaque tuile partait dans
 * son propre appel : six synthèses en même temps chez le fournisseur, qui en
 * refuse au-delà de sa limite de requêtes simultanées. Les tuiles refusées
 * restaient muettes, et Pio sautait des propositions, surtout la première fois
 * qu'un exercice était joué (ensuite le cache les sert). Les tuiles passent
 * maintenant par une seule file : un appel à la fois, quatre tuiles au plus par
 * appel, dans l'ordre de l'écran. La consigne garde son appel à elle, pour ne
 * pas attendre les tuiles. Deux synthèses en même temps au plus, par enfant.
 *
 * `fresh` saute le sac (étape 1) : le lecteur le demande quand le fichier du
 * téléphone n'a pas pu se jouer (abîmé, à moitié écrit). Le son revient du
 * serveur, et l'application le range par-dessus l'ancien : le sac se répare.
 */

import { useCallback } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { clipRequestKey, type ClipRequest, type ClipResult } from "@/convex/offline/contract";
import { useOffline } from "./context";

/** Une adresse à jouer, `"not_configured"` sans voix branchée, `null` sinon. */
export type ClipLookup = string | "not_configured" | null;

function loadClips() {
  return import("@/lib/offline/clips");
}

/**
 * Les pauses avant de redemander un son que le serveur n'a pas pu rendre.
 *
 * DEUX ÉCHECS SONT PASSAGERS, et ne méritent pas de rendre l'enfant muet :
 *   - `pending` : la synthèse du fournisseur a échoué (limite de requêtes
 *     simultanées d'ElevenLabs, quand le téléchargement des consignes de la
 *     classe tourne en même temps) ; le son est neuf, la deuxième demande
 *     aboutit ;
 *   - une exception : sur un téléphone, une action Convex en vol est perdue
 *     quand la connexion temps réel se rétablit (« Connection lost while
 *     action was in flight »). Les actions ne se rejouent pas d'elles-mêmes.
 * Avant, le bouton passait en « muet » à la première panne et ne repartait
 * qu'au toucher suivant : « ça marche une fois sur deux ». Un refus définitif
 * (`unavailable`) ne se redemande pas.
 */
const RETRY_DELAYS_MS = [700, 1800];

type PrepareClips = (args: { requests: ClipRequest[] }) => Promise<ClipResult[]>;

/** Les tuiles d'un appel, et l'attente qui laisse les demandes d'un même écran se regrouper. */
export const TILE_BATCH = 4;
const BATCH_WINDOW_MS = 25;

type WaitingTile = {
  request: ClipRequest;
  prepare: PrepareClips;
  resolve: (result: ClipResult | undefined) => void;
  reject: (error: unknown) => void;
};

const waitingTiles: WaitingTile[] = [];
let draining = false;
let drainTimer: ReturnType<typeof setTimeout> | null = null;

/** Vide la file des tuiles : un appel à la fois, dans l'ordre d'arrivée. */
async function drainTiles() {
  drainTimer = null;
  if (draining) return;
  draining = true;
  try {
    while (waitingTiles.length > 0) {
      const batch = waitingTiles.splice(0, TILE_BATCH);
      try {
        const results = await batch[0].prepare({ requests: batch.map((waiting) => waiting.request) });
        const byKey = new Map(results.map((result) => [result.key, result] as const));
        for (const waiting of batch) waiting.resolve(byKey.get(clipRequestKey(waiting.request)));
      } catch (error) {
        for (const waiting of batch) waiting.reject(error);
      }
    }
  } finally {
    draining = false;
  }
}

/** Une tuile, demandée avec ses voisines (voir l'en-tête). */
function prepareTile(prepare: PrepareClips, request: ClipRequest): Promise<ClipResult | undefined> {
  return new Promise((resolve, reject) => {
    waitingTiles.push({ request, prepare, resolve, reject });
    if (!draining && drainTimer === null) drainTimer = setTimeout(drainTiles, BATCH_WINDOW_MS);
  });
}

async function prepareOne(prepare: PrepareClips, request: ClipRequest): Promise<ClipResult | undefined> {
  if (request.kind === "tile") return prepareTile(prepare, request);
  const [result] = await prepare({ requests: [request] });
  return result;
}

async function prepareWithRetry(prepare: PrepareClips, request: ClipRequest) {
  for (let attempt = 0; ; attempt++) {
    const delay = RETRY_DELAYS_MS[attempt];
    try {
      const result = await prepareOne(prepare, request);
      if (result?.status !== "pending" || delay === undefined) return result;
    } catch (error) {
      if (delay === undefined) throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}

export type FindClip = (request: ClipRequest, options?: { fresh?: boolean }) => Promise<ClipLookup>;

export function useClipSource(): FindClip {
  const prepare = useAction(api.offline.voice.prepareClips);
  const { enabled, connected } = useOffline();

  return useCallback(
    async (request: ClipRequest, options?: { fresh?: boolean }): Promise<ClipLookup> => {
      const key = clipRequestKey(request);
      if (enabled) {
        if (!options?.fresh) {
          try {
            const local = await (await loadClips()).clipUrl(key);
            if (local) return local;
          } catch {
            // Stockage illisible : on tente le réseau.
          }
        }
        if (!connected) return null;
      }

      try {
        const result = await prepareWithRetry(prepare, request);
        if (!result) return null;
        if (result.status === "ready") {
          // Rangé pour la prochaine fois, sans retarder la lecture.
          if (enabled) {
            void Promise.all([loadClips(), fetch(result.url)])
              .then(async ([clips, response]) => {
                if (!response.ok) return;
                await clips.saveClip(result.clipId, await response.blob(), [key]);
              })
              .catch(() => {});
          }
          return result.url;
        }
        // L'icône « muet » ne dit pas pourquoi : la console, elle, le dit.
        console.warn("[voix] son indisponible", request.kind, result);
        return result.status === "unavailable" && result.reason === "not_configured"
          ? "not_configured"
          : null;
      } catch (error) {
        console.warn("[voix] l'appel au serveur a échoué", request.kind, error);
        return null;
      }
    },
    [prepare, enabled, connected],
  );
}
