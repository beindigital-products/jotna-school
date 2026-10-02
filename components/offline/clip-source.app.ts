"use client";

/**
 * OÙ TROUVER UN SON DE PIO : D'ABORD DANS LE TÉLÉPHONE.
 *
 * Les lecteurs (`components/exercises/prompt-reader.tsx`,
 * `components/arabic/speech.ts`) demandent un son par sa référence — la
 * consigne d'un exercice, une lettre, un item de leçon. On cherche :
 *
 *   1. dans le sac de l'appareil (`lib/offline/clips.ts`) : il se joue sans
 *      réseau, c'est le cas ordinaire une fois le sac rempli ;
 *   2. sinon, en ligne, auprès du serveur (`offline/voice.prepareClips`) : il
 *      synthétise au besoin, on joue son adresse tout de suite, et on range
 *      le fichier dans le sac pour la prochaine fois ;
 *   3. sinon, rien : sans réseau, un son jamais téléchargé ne se joue pas,
 *      et le bouton passe en gris — l'exercice reste jouable.
 *
 * Ce fichier n'existe que dans l'application ; le site lit `clip-source.ts`.
 */

import { useCallback } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { clipRequestKey, type ClipRequest } from "@/convex/offline/contract";
import { clipUrl, saveClip } from "@/lib/offline/clips";
import type { ClipLookup } from "./clip-source";
import { useOffline } from "./context";

export function useClipSource(): (request: ClipRequest) => Promise<ClipLookup> {
  const prepare = useAction(api.offline.voice.prepareClips);
  const { enabled, connected } = useOffline();

  return useCallback(
    async (request: ClipRequest): Promise<ClipLookup> => {
      const key = clipRequestKey(request);
      if (enabled) {
        try {
          const local = await clipUrl(key);
          if (local) return local;
        } catch {
          // Stockage illisible : on tente le réseau.
        }
        if (!connected) return null;
      }

      try {
        const [result] = await prepare({ requests: [request] });
        if (!result) return null;
        if (result.status === "ready") {
          // Rangé pour la prochaine fois, sans retarder la lecture.
          if (enabled) {
            void fetch(result.url)
              .then((response) => (response.ok ? response.blob() : null))
              .then((blob) => (blob ? saveClip(result.clipId, blob, [key]) : undefined))
              .catch(() => {});
          }
          return result.url;
        }
        return result.status === "unavailable" && result.reason === "not_configured"
          ? "not_configured"
          : null;
      } catch {
        return null;
      }
    },
    [prepare, enabled, connected],
  );
}
