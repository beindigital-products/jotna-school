"use client";

import { useMotionValue, type MotionValue } from "framer-motion";
import { useCallback, useMemo } from "react";

/**
 * `will-change` LE TEMPS D'UN MOUVEMENT framer-motion, et pas une image de plus.
 *
 * Un ressort framer-motion écrit `transform` (ou `opacity`) dans le style à
 * chaque image, depuis JavaScript. Pour le navigateur, ce n'est pas une
 * animation : c'est un style qui change, et sans couche propre l'élément est
 * REPEINT à chaque image. Sur une grande surface (la carte de l'exercice, la
 * scène de réponse et son voile), cela fait quarante rastérisations d'une
 * carte pleine d'ombres et d'émojis en six cents millisecondes. Mesuré dans
 * le WebView Android (émulateur Pixel, 18 octobre 2026, trace Chromium) : la
 * rastérisation occupait le processeur graphique sans discontinuer pendant
 * toute l'entrée de la scène de réponse ; avec une couche, la carte est
 * peinte une fois et seul son transform bouge (265 tuiles rastérisées au
 * verdict, 183 avec les couches ; sur un vrai GPU, l'écart est le même en
 * proportion). Le WKWebView fait pareil (sortie de la carte repeinte entière,
 * notée par la mesure iPhone).
 *
 * POURQUOI PAS UN `will-change` PERMANENT : il fait de l'élément le bloc
 * conteneur de ses descendants `position: fixed` (l'`DragOverlay` de dnd-kit
 * vit dans la carte) et garde une couche en mémoire pour rien entre deux
 * questions. Ici la couche n'existe que pendant le mouvement, moment où
 * l'élément est de toute façon transformé (donc déjà bloc conteneur) : aucun
 * effet de bord nouveau. `useWillChange` de framer-motion pose la valeur à
 * vie dès la première animation ; d'où ce petit crochet.
 *
 * Usage, sur un `motion.div` :
 *
 *   const { willChange, onAnimationStart, onAnimationComplete } = useMotionWillChange();
 *   <motion.div style={{ willChange }} onAnimationStart={onAnimationStart} onAnimationComplete={onAnimationComplete} … />
 *
 * `onAnimationStart` se déclenche aussi pour la sortie d'`AnimatePresence` :
 * la couche revient le temps que la carte parte. Si le composant a déjà un
 * `onAnimationComplete`, enchaîner les deux.
 */
export function useMotionWillChange(properties: "transform" | "opacity" | "transform, opacity" = "transform"): {
  willChange: MotionValue<string>;
  onAnimationStart: () => void;
  onAnimationComplete: () => void;
} {
  const willChange = useMotionValue("auto");
  const onAnimationStart = useCallback(() => willChange.set(properties), [willChange, properties]);
  const onAnimationComplete = useCallback(() => willChange.set("auto"), [willChange]);
  return useMemo(
    () => ({ willChange, onAnimationStart, onAnimationComplete }),
    [willChange, onAnimationStart, onAnimationComplete],
  );
}
