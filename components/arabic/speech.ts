"use client";

/**
 * LA VOIX DU MODULE CÔTÉ ÉCRAN — dire une suite de sons, un seul à la fois.
 *
 * UN ENFANT QUI NE SAIT PAS LIRE ÉCOUTE TOUT. Une consigne se dit donc en
 * plusieurs morceaux enchaînés : « Touche la lettre… » (français, voix des
 * consignes) puis « بَاء » (arabe, voix du parcours). `useSpeech().say()`
 * prend la liste, cherche les sons en parallèle (dans le téléphone d'abord
 * pour l'application, en ligne sur le web : `components/offline/clip-source.ts`,
 * et en cache ici), puis joue les morceaux l'un après l'autre.
 *
 * UN SEUL SON À LA FOIS, DANS TOUT LE MODULE. Toucher une lettre pendant que
 * Pio parle coupe Pio : deux voix superposées, c'est du bruit pour un enfant.
 * Le son en cours vit donc au niveau de la page, pas du composant
 * (`lib/voice-player.ts`, partagé avec le lecteur de consignes).
 *
 * CE QU'UN ÉCRAN LANCE, IL L'ARRÊTE EN PARTANT. Quand l'étape change, la
 * consigne de l'étape d'avant se tait — mais un composant n'arrête jamais le
 * son d'un autre : chaque lecture porte le jeton de celui qui l'a lancée.
 *
 * IL NE LÈVE JAMAIS. Sans clé, ou sans réseau pour un son jamais téléchargé,
 * la suite s'arrête en silence et `say` rend la raison : l'écran reste
 * utilisable, l'adulte lit la bulle.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { ConsigneKey } from "@/convex/arabic/consignes";
import { useClipSource } from "@/components/offline/clip-source";
import { newVoiceOwner, playUrl, stopPlaying } from "@/lib/voice-player";

export type SpeechRef =
  | { kind: "letterName"; letterKey: string }
  | {
      kind: "letterSyllable";
      letterKey: string;
      haraka: "fatha" | "kasra" | "damma";
    }
  | { kind: "lessonItem"; lessonKey: string; itemKey: string }
  | { kind: "instruction"; key: ConsigneKey }
  | { kind: "letterWord"; letterKey: string };

/** Raccourcis de lecture : `speech.consigne("repeat")`, `speech.letter("ba")`… */
export const speech = {
  consigne: (key: ConsigneKey): SpeechRef => ({ kind: "instruction", key }),
  letter: (letterKey: string): SpeechRef => ({ kind: "letterName", letterKey }),
  word: (letterKey: string): SpeechRef => ({ kind: "letterWord", letterKey }),
  item: (lessonKey: string, itemKey: string): SpeechRef => ({
    kind: "lessonItem",
    lessonKey,
    itemKey,
  }),
};

export type SayOutcome =
  | { ok: true }
  | { ok: false; reason: "not_configured" | "unavailable" | "interrupted" };

/** URL par référence, pour la durée de la page. */
const urlCache = new Map<string, string>();

export function useSpeech() {
  // Le téléphone d'abord : les sons du module sont téléchargés à l'avance
  // (`lib/offline/sync.ts`) et se jouent sans réseau. Un son qui manque se
  // demande au serveur s'il est joignable (`components/offline/clip-source.ts`).
  const findClip = useClipSource();
  const [speaking, setSpeaking] = useState(false);
  // L'identifiant de CE composant, tiré une fois : c'est lui qui dit à qui
  // appartient le son en cours.
  const [owner] = useState(newVoiceOwner);
  const tokenRef = useRef(0);

  const urlFor = useCallback(
    async (ref: SpeechRef): Promise<string | "not_configured" | null> => {
      const key = JSON.stringify(ref);
      const cached = urlCache.get(key);
      if (cached) return cached;
      const url = await findClip({ kind: "arabic", ref });
      if (url && url !== "not_configured") urlCache.set(key, url);
      return url;
    },
    [findClip],
  );

  const say = useCallback(
    async (refs: SpeechRef[], options?: { rate?: number }): Promise<SayOutcome> => {
      const token = ++tokenRef.current;
      stopPlaying();
      setSpeaking(true);
      try {
        const urls = await Promise.all(refs.map(urlFor));
        for (const url of urls) {
          if (tokenRef.current !== token) return { ok: false, reason: "interrupted" };
          if (url === "not_configured") return { ok: false, reason: "not_configured" };
          if (!url) return { ok: false, reason: "unavailable" };
          const finished = await playUrl(url, owner, options?.rate ?? 1);
          if (!finished) {
            return {
              ok: false,
              reason: tokenRef.current === token ? "unavailable" : "interrupted",
            };
          }
        }
        return { ok: true };
      } finally {
        if (tokenRef.current === token) setSpeaking(false);
      }
    },
    [owner, urlFor],
  );

  const stop = useCallback(() => {
    tokenRef.current++;
    stopPlaying(owner);
    setSpeaking(false);
  }, [owner]);

  // Le son que CE composant a lancé se tait quand il disparaît.
  useEffect(() => {
    const tokens = tokenRef;
    return () => {
      tokens.current++;
      stopPlaying(owner);
    };
  }, [owner]);

  return { say, stop, speaking };
}
