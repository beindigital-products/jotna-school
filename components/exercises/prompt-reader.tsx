"use client";

/**
 * LE LECTEUR DE CONSIGNES — Pio lit la consigne de l'exercice à voix haute.
 *
 * POUR LES CLASSES OÙ L'ON APPREND À LIRE (CI, CP : `isReadingLearnerClass`,
 * `convex/curriculum.ts`). Un enfant de six ans ne lit pas encore « Fais
 * correspondre les mots avec leur son » : il l'entend. La séance entoure
 * l'exercice de `PromptReaderProvider` ; `ExercisePrompt` y trouve le lecteur
 * et pose le bouton 🔊 devant la consigne. Hors de ces classes, pas de
 * fournisseur : la consigne s'affiche comme avant.
 *
 * QUAND L'EXERCICE APPARAÎT, LA CONSIGNE SE DIT TOUTE SEULE ; le bouton la
 * redit autant de fois que l'enfant veut. Elle se tait dès que l'enfant a
 * répondu (`silenced`), et quand l'exercice s'en va.
 *
 * LA VOIX EST CELLE DE PIO, ET ELLE EST DANS LE TÉLÉPHONE. L'application
 * télécharge à l'avance la consigne de chaque exercice de la classe
 * (`lib/offline/sync.ts`) : elle se dit sans réseau. Un son qui manque se
 * demande au serveur quand il est joignable (`components/offline/clip-source.ts`),
 * qui ne reçoit qu'une référence et lit lui-même le texte dans l'exercice. La
 * lecture automatique marche dans l'application (la vue web de Capacitor joue
 * un son sans geste préalable, voir `components/arabic/coach.tsx`).
 *
 * IL IGNORE LE RÉGLAGE « SONS », comme `components/arabic/listen-button.tsx` :
 * ce réglage coupe les bruitages de récompense ; ici, la voix EST la
 * consigne.
 *
 * IL NE LÈVE JAMAIS. Sans clé, ou sans réseau pour un son jamais téléchargé,
 * le bouton passe en « muet » et l'exercice reste jouable ; un toucher réessaie.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Volume2, VolumeX } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";
import { useClipSource } from "@/components/offline/clip-source";
import { newVoiceOwner, playUrl, stopPlaying } from "@/lib/voice-player";

type ReaderStatus = "idle" | "loading" | "playing" | "unavailable";

export type PromptReader = {
  status: ReaderStatus;
  /** Dit la consigne depuis le début, en coupant ce qui joue. */
  read: () => void;
};

const PromptReaderContext = createContext<PromptReader | null>(null);

/** Le lecteur de l'exercice affiché, ou `null` si la consigne ne se lit pas. */
export function usePromptReader(): PromptReader | null {
  return useContext(PromptReaderContext);
}

/**
 * L'URL de chaque consigne, obtenue ou en cours, pour la durée de la page.
 * Garder la PROMESSE évite deux appels quand l'écran demande deux fois de
 * suite ; un échec ne se garde pas, pour que le toucher suivant réessaie.
 */
const urlByExercise = new Map<string, Promise<string | null>>();

export function PromptReaderProvider({
  exerciseId,
  silenced = false,
  children,
}: {
  exerciseId: string;
  /** Vrai quand la consigne doit se taire : l'enfant a répondu, une fenêtre est ouverte. */
  silenced?: boolean;
  children: ReactNode;
}) {
  const findClip = useClipSource();
  const [status, setStatus] = useState<ReaderStatus>("idle");
  // L'identifiant de CE lecteur : c'est lui qui dit à qui appartient le son.
  const [owner] = useState(newVoiceOwner);
  const tokenRef = useRef(0);

  const urlFor = useCallback((): Promise<string | null> => {
    const cached = urlByExercise.get(exerciseId);
    if (cached) return cached;
    const pending = findClip({ kind: "prompt", exerciseId: exerciseId as Id<"exercises"> })
      .then((url) => (url && url !== "not_configured" ? url : null))
      .catch(() => null);
    urlByExercise.set(exerciseId, pending);
    void pending.then((url) => {
      if (!url) urlByExercise.delete(exerciseId);
    });
    return pending;
  }, [exerciseId, findClip]);

  // Le silence demandé, lu par une lecture qui attendait son URL.
  const silencedRef = useRef(silenced);

  const read = useCallback(async () => {
    const token = ++tokenRef.current;
    stopPlaying();
    setStatus("loading");
    const url = await urlFor();
    if (tokenRef.current !== token) return;
    if (!url) {
      setStatus("unavailable");
      return;
    }
    if (silencedRef.current) {
      setStatus("idle");
      return;
    }
    setStatus("playing");
    // Rend la main quand le son finit OU qu'on le coupe (`stopPlaying`).
    await playUrl(url, owner, 1);
    if (tokenRef.current === token) setStatus("idle");
  }, [owner, urlFor]);

  // UNE FOIS PAR EXERCICE : la carte de l'exercice porte sa clé, donc ce
  // lecteur naît avec lui et meurt avec lui. Un exercice qui s'affiche alors
  // que la séance se tait (une reprise sous une fenêtre) ne parle pas.
  const autoRead = useRef(!silenced);
  useEffect(() => {
    if (autoRead.current) void read();
    const tokens = tokenRef;
    return () => {
      tokens.current++;
      stopPlaying(owner);
    };
  }, [read, owner]);

  // SE TAIRE, C'EST COUPER LE SON — rien d'autre. La lecture en cours s'en
  // aperçoit (`playUrl` rend la main, ou `silencedRef` après le chargement)
  // et remet elle-même le bouton au repos.
  useEffect(() => {
    silencedRef.current = silenced;
    if (silenced) stopPlaying(owner);
  }, [silenced, owner]);

  const value = useMemo<PromptReader>(
    () => ({ status, read: () => void read() }),
    [status, read],
  );

  return (
    <PromptReaderContext.Provider value={value}>{children}</PromptReaderContext.Provider>
  );
}

/** Le gros bouton 🔊 posé devant la consigne. */
export function PromptReaderButton({ reader }: { reader: PromptReader }) {
  const busy = reader.status === "loading" || reader.status === "playing";
  const muted = reader.status === "unavailable";

  return (
    <button
      type="button"
      onClick={reader.read}
      aria-label={muted ? "Réessayer d'écouter la consigne" : "Écouter la consigne"}
      className={`btn-chunky flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-[3px] border-white text-white focus-visible:outline-none focus-visible:ring-4 ${
        muted
          ? "bg-gradient-to-b from-gray-300 to-gray-400 focus-visible:ring-gray-300"
          : "bg-gradient-to-b from-sky-400 to-sky-600 focus-visible:ring-sky-300"
      } ${busy ? "animate-pulse" : ""}`}
      style={{ "--btn-depth": muted ? "#6b7280" : "#075985" } as React.CSSProperties}
    >
      {muted ? (
        <VolumeX className="h-7 w-7" strokeWidth={2.75} aria-hidden />
      ) : (
        <Volume2 className="h-7 w-7" strokeWidth={2.75} aria-hidden />
      )}
    </button>
  );
}
