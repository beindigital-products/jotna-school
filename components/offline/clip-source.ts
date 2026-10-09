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
 */

import { useCallback } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { clipRequestKey, type ClipRequest } from "@/convex/offline/contract";
import { useOffline } from "./context";

/** Une adresse à jouer, `"not_configured"` sans voix branchée, `null` sinon. */
export type ClipLookup = string | "not_configured" | null;

function loadClips() {
  return import("@/lib/offline/clips");
}

export function useClipSource(): (request: ClipRequest) => Promise<ClipLookup> {
  const prepare = useAction(api.offline.voice.prepareClips);
  const { enabled, connected } = useOffline();

  return useCallback(
    async (request: ClipRequest): Promise<ClipLookup> => {
      const key = clipRequestKey(request);
      if (enabled) {
        try {
          const local = await (await loadClips()).clipUrl(key);
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
            void Promise.all([loadClips(), fetch(result.url)])
              .then(async ([clips, response]) => {
                if (!response.ok) return;
                await clips.saveClip(result.clipId, await response.blob(), [key]);
              })
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
