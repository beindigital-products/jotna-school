"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";

/**
 * LA BULLE DE PIO — ce qu'il dit, au-dessus de lui.
 *
 * Une bulle de bande dessinée, blanche, avec sa queue vers le bas : l'enfant
 * sait d'où vient la phrase sans lire de nom. Le texte change avec une
 * petite entrée, jamais en clignotant : `AnimatePresence` sur la clé du
 * texte fait sortir l'ancienne bulle avant de poser la nouvelle.
 *
 * Posée, comme les cartes du Monde de Pio : un flanc crème de 3 px sous le
 * bord ambre, et l'ombre douce de toujours. La queue reste une pointe
 * tournée, sans flanc : elle sort du bord, pas de la table.
 */
export function SpeechBubble({
  children,
  bubbleKey,
  className = "",
  style,
  compact = false,
  tail = "bottom",
  align = "center",
}: {
  children: ReactNode;
  /** Change quand le texte change : déclenche l'animation d'entrée. */
  bubbleKey: string;
  className?: string;
  /** Une marge calculée (la scène de la question la cale sur la taille de Pio). */
  style?: CSSProperties;
  /** Une bulle plus petite, pour un Pio de petite taille (la page d'accueil). */
  compact?: boolean;
  /** Où pointe la queue : vers le bas (Pio dessous) ou vers la gauche (Pio à côté). */
  tail?: "bottom" | "left";
  /** Centrée dans sa place (défaut), ou collée au début (à côté d'un Pio à gauche). */
  align?: "center" | "start";
}) {
  return (
    <div className={`relative ${className}`} style={style}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={bubbleKey}
          initial={{ opacity: 0, y: 6, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.98 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          role="status"
          aria-live="polite"
          className={`relative rounded-3xl border-2 border-amber-200 bg-white font-display font-bold leading-snug text-amber-950 shadow-[0_3px_0_#d6c39a,0_8px_24px_-10px_rgba(0,0,0,0.35)] ${
            align === "center" ? "mx-auto text-center" : "mr-auto text-left"
          } ${
            compact
              ? "max-w-[14rem] text-balance px-4 py-2.5 text-sm sm:max-w-[16rem] sm:text-base"
              : "max-w-[19rem] px-5 py-3 text-base sm:max-w-sm sm:text-lg"
          }`}
        >
          {children}
          {/* La queue de la bulle, tournée vers Pio (`data-tail` : la coque de
              la séance la cache quand la bulle passe sous Pio, en paysage). */}
          <span
            aria-hidden
            data-tail
            className={
              tail === "left"
                ? "absolute -left-2.5 top-1/2 h-5 w-5 -translate-y-1/2 rotate-45 rounded-sm border-b-2 border-l-2 border-amber-200 bg-white"
                : "absolute -bottom-2.5 left-1/2 h-5 w-5 -translate-x-1/2 rotate-45 rounded-sm border-b-2 border-r-2 border-amber-200 bg-white"
            }
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
