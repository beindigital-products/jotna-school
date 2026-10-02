"use client";

/**
 * LA PASTILLE DU RÉSEAU, dans l'en-tête de l'espace élève.
 *
 * Elle ne dit jamais « erreur » : sans internet, l'enfant joue quand même, et
 * tout ce qu'il fait reste dans son téléphone. Elle dit seulement ce qui se
 * passe, en mots d'enfant :
 *
 *   - sans internet : un nuage barré et « Sans internet » ;
 *   - le sac se remplit (paliers, voix de Pio) : un sac et son pourcentage ;
 *   - sinon : rien. Une application qui marche n'a rien à annoncer.
 */

import { Backpack, CloudOff } from "lucide-react";
import { useOffline } from "@/components/offline/context";
import { kidMessages } from "@/lib/kidCopy";

export function OfflineBadge() {
  const { status, connected, preparing, clips } = useOffline();
  if (status !== "ready") return null;

  if (!connected) {
    return (
      <span
        role="status"
        title={kidMessages.offline.saved}
        className="inline-flex h-9 items-center gap-1.5 rounded-full border-2 border-white bg-sky-100 px-2.5 font-display text-xs font-extrabold text-sky-800 shadow-sm"
      >
        <CloudOff className="h-4 w-4" aria-hidden />
        <span className="hidden sm:inline">{kidMessages.offline.badge}</span>
        <span className="sr-only sm:hidden">{kidMessages.offline.badge}</span>
      </span>
    );
  }

  if (preparing && clips && clips.total > 0 && clips.done < clips.total) {
    const pct = Math.min(99, Math.round((clips.done / clips.total) * 100));
    return (
      <span
        role="status"
        className="inline-flex h-9 items-center gap-1.5 rounded-full border-2 border-white bg-amber-100 px-2.5 font-display text-xs font-extrabold text-amber-800 shadow-sm"
        aria-label={kidMessages.offline.backpack(pct)}
      >
        <Backpack className="h-4 w-4" aria-hidden />
        <span>{pct} %</span>
      </span>
    );
  }

  return null;
}
