"use client";

/**
 * PIO QUI PARLE — la consigne de chaque écran du module, dite à voix haute.
 *
 * UN ENFANT DÉBUTANT NE LIT PAS LA CONSIGNE : il l'ENTEND. Quand la ligne
 * apparaît (ou que sa consigne change), Pio la dit tout seul ; le gros bouton
 * 🔊 de la bulle la redit autant de fois que l'enfant veut. Le texte de la
 * bulle est le même que la voix (`convex/arabic/consignes.ts`), pour l'adulte
 * qui accompagne.
 *
 * LA LECTURE AUTOMATIQUE MARCHE DANS L'APPLICATION : la vue web de Capacitor
 * n'exige pas de geste pour jouer un son (`mediaTypesRequiringUserActionForPlayback`
 * vide). Dans un navigateur, elle peut être refusée ; le bouton 🔊 reste là.
 *
 * `say` VIDE = SILENCE, et c'est voulu : pendant que le micro écoute, Pio ne
 * doit rien dire — sa voix serait enregistrée avec celle de l'enfant. Passer
 * une consigne vide coupe la voix en cours.
 *
 * Pendant qu'il parle, Pio prend la pose `recite` en IMAGE FIXE : sur iOS, un
 * son interrompt la vidéo muette de Pio, qui disparaîtrait le temps d'une
 * phrase (`docs/pio-animations.md`).
 */

import { useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Volume2 } from "lucide-react";
import { Pio, type PioState } from "@/components/student/pio";
import { useSpeech, type SpeechRef } from "./speech";

export function CoachLine({
  pose,
  line,
  say: consigne = [],
  autoPlay = true,
  size = 96,
  animated = true,
}: {
  pose: PioState;
  line: string;
  /** Ce que Pio dit : une suite de sons (consigne française, lettre arabe…). */
  say?: SpeechRef[];
  autoPlay?: boolean;
  size?: number;
  animated?: boolean;
}) {
  const { say, stop, speaking } = useSpeech();
  const key = useMemo(() => JSON.stringify(consigne), [consigne]);

  useEffect(() => {
    const refs = JSON.parse(key) as SpeechRef[];
    if (refs.length === 0) {
      stop();
      return;
    }
    if (autoPlay) void say(refs);
  }, [key, autoPlay, say, stop]);

  const canReplay = consigne.length > 0;

  return (
    <div className="flex items-end gap-2">
      <Pio
        state={speaking ? "recite" : pose}
        outfit="boubou"
        size={size}
        animated={animated && !speaking}
        className="shrink-0"
      />
      <AnimatePresence mode="wait">
        <motion.div
          key={line}
          initial={{ opacity: 0, scale: 0.92, x: -6 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.2 }}
          className={`relative mb-6 flex flex-1 items-center gap-3 rounded-3xl border-[3px] bg-white py-3 pl-4 pr-3 shadow-md transition-colors ${
            speaking ? "border-emerald-400" : "border-emerald-200"
          }`}
        >
          <p role="status" className="flex-1 text-left font-display text-base font-bold leading-snug text-emerald-950">
            {line}
          </p>
          {canReplay && (
            <button
              type="button"
              onClick={() => void say(consigne)}
              aria-label="Écouter la consigne"
              className={`btn-chunky flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-[3px] border-white bg-gradient-to-b from-emerald-400 to-emerald-600 text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300 ${
                speaking ? "animate-pulse" : ""
              }`}
              style={{ "--btn-depth": "#065f46" } as React.CSSProperties}
            >
              <Volume2 className="h-6 w-6" strokeWidth={2.75} aria-hidden />
            </button>
          )}
          <span
            aria-hidden
            className={`absolute -left-[11px] bottom-5 h-4 w-4 rotate-45 border-b-[3px] border-l-[3px] bg-white transition-colors ${
              speaking ? "border-emerald-400" : "border-emerald-200"
            }`}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
