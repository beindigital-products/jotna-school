"use client";

/**
 * LE BOUTON « ÉCOUTER » — la brique la plus utilisée du module.
 *
 * Il fait dire une référence du parcours (lettre, syllabe, mot, verset,
 * consigne) par le lecteur partagé (`./speech.ts`) : cache des URL, un seul
 * son à la fois dans le module, arrêt quand le bouton disparaît.
 *
 * IL IGNORE LE RÉGLAGE « SONS » DE L'ESPACE ÉLÈVE, et c'est voulu : ce réglage
 * (`lib/sounds`) coupe les bruitages de récompense, qui sont un ornement. Ici,
 * le son EST la leçon — couper la voix reviendrait à retirer le tableau de la
 * classe.
 *
 * IL NE LÈVE JAMAIS. Sans clé de synthèse, sans réseau, ou si le fournisseur
 * refuse, il affiche une ligne sobre et la leçon continue : on peut apprendre
 * à écrire une lettre sans l'entendre, et un module qui s'arrête parce qu'une
 * API est muette ne sert personne.
 */

import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { arabicCopy } from "@/lib/arabic/copy";
import { useSpeech, type SpeechRef } from "./speech";

export type { SpeechRef } from "./speech";

export function ListenButton({
  speechRef,
  label,
  variant = "primary",
  className = "",
  onUnavailable,
  rate = 1,
  onPlayingChange,
}: {
  speechRef: SpeechRef;
  label?: string;
  variant?: "primary" | "ghost" | "chip";
  className?: string;
  onUnavailable?: (reason: string) => void;
  /**
   * La vitesse de lecture. `0.7` : l'écoute LENTE du coach, le même clip joué
   * plus doucement (le navigateur garde la hauteur de la voix) — pas de
   * second appel au serveur, pas de second fichier.
   */
  rate?: number;
  /** Prévient l'appelant quand la voix commence et s'arrête (Pio parle). */
  onPlayingChange?: (playing: boolean) => void;
}) {
  const { say, speaking } = useSpeech();
  const [played, setPlayed] = useState(false);
  const [unavailable, setUnavailable] = useState<"not_configured" | "unavailable" | null>(null);

  useEffect(() => {
    onPlayingChange?.(speaking);
  }, [onPlayingChange, speaking]);

  async function handleClick() {
    const outcome = await say([speechRef], { rate });
    if (outcome.ok) {
      setPlayed(true);
      return;
    }
    if (outcome.reason === "interrupted") return;
    setUnavailable(outcome.reason);
    onUnavailable?.(outcome.reason);
  }

  if (unavailable) {
    return (
      <span
        className={`inline-flex items-center gap-2 rounded-2xl bg-gray-100 px-3 py-2 text-sm font-medium text-gray-500 ${className}`}
      >
        <VolumeX className="h-4 w-4" aria-hidden />
        {unavailable === "not_configured"
          ? arabicCopy.listen.notConfigured
          : arabicCopy.listen.unavailable}
      </span>
    );
  }

  const text = label ?? (played ? arabicCopy.listen.replay : arabicCopy.listen.idle);

  const styles =
    variant === "primary"
      ? "bg-teal-600 text-white shadow-md shadow-teal-200 hover:bg-teal-700"
      : variant === "chip"
        ? "bg-white text-teal-700 border-2 border-teal-200 hover:border-teal-400"
        : "text-teal-700 hover:bg-teal-50";

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={`${arabicCopy.listen.idle} — ${describe(speechRef)}`}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-base font-bold transition-all ${styles} ${className}`}
    >
      <Volume2 className={`h-5 w-5 ${speaking ? "animate-pulse" : ""}`} aria-hidden />
      <span>{text}</span>
    </button>
  );
}

/** Libellé d'accessibilité — un lecteur d'écran ne voit pas l'arabe affiché. */
function describe(ref: SpeechRef): string {
  if (ref.kind === "letterName") return `nom de la lettre ${ref.letterKey}`;
  if (ref.kind === "letterSyllable") {
    return `lettre ${ref.letterKey} avec la ${ref.haraka}`;
  }
  if (ref.kind === "letterWord") return `le mot de la lettre ${ref.letterKey}`;
  if (ref.kind === "instruction") return "la consigne";
  return "le texte de la leçon";
}
