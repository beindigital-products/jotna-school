"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * LA BULLE DE PIO — ce qu'il dit, au-dessus de lui.
 *
 * Une bulle de bande dessinée, blanche, avec sa queue vers le bas : l'enfant
 * sait d'où vient la phrase sans lire de nom. Le texte change avec une
 * petite entrée, jamais en clignotant : `AnimatePresence` sur la clé du
 * texte fait sortir l'ancienne bulle avant de poser la nouvelle.
 */
export function SpeechBubble({
  children,
  bubbleKey,
  className = "",
}: {
  children: ReactNode;
  /** Change quand le texte change : déclenche l'animation d'entrée. */
  bubbleKey: string;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={bubbleKey}
          initial={{ opacity: 0, y: 6, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.98 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          role="status"
          aria-live="polite"
          className="relative mx-auto max-w-[19rem] rounded-3xl border-2 border-amber-200 bg-white px-5 py-3 text-center font-display text-base font-bold leading-snug text-amber-950 shadow-[0_8px_24px_-10px_rgba(0,0,0,0.35)] sm:max-w-sm sm:text-lg"
        >
          {children}
          {/* La queue de la bulle, tournée vers Pio. */}
          <span
            aria-hidden
            className="absolute -bottom-2.5 left-1/2 h-5 w-5 -translate-x-1/2 rotate-45 rounded-sm border-b-2 border-r-2 border-amber-200 bg-white"
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
