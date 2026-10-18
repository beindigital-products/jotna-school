"use client";

import { motion } from "framer-motion";
import { useCallback, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import { useGameFeel } from "./use-game-feel";

/**
 * LE JETON QUI VOLE — un mot saisi qui va se poser dans son trou.
 *
 * Dans la phrase à trous, l'enfant touche un mot ; le mot ne « s'inscrit »
 * pas : un jeton part de la tuile touchée, traverse la carte avec un ressort
 * (`stiffness 340, damping 22`, la courbe de l'alerte de réponse) et se pose
 * dans le trou, qui le révèle alors d'un `gk-pop`. Une seule couche animée,
 * en `transform` et `opacity`, retirée du DOM à l'arrivée.
 *
 * LES POSITIONS SONT RELATIVES À LA RACINE DE L'ÉCRAN, pas à la fenêtre : la
 * carte de la séance est une `motion.div` transformée pendant son entrée, et
 * un `position: fixed` dedans se calerait sur elle. On mesure donc le départ
 * et l'arrivée avec `getBoundingClientRect` et on soustrait la racine, qui
 * doit être `relative`.
 *
 * PAS DE VOL quand l'enfant a demandé moins de mouvement (`budget.springs`
 * faux) ni quand une boîte mesure zéro (jsdom, un élément caché) : le trou se
 * remplit d'un coup, `onLand` est appelé tout de suite.
 */
type Box = { x: number; y: number; w: number; h: number };

export type TokenFlight = {
  id: number;
  text: string;
  from: Box;
  to: Box;
};

function boxOf(element: Element, root: Element): Box | null {
  const r = element.getBoundingClientRect();
  const base = root.getBoundingClientRect();
  if (r.width === 0 || r.height === 0) return null;
  return { x: r.left - base.left, y: r.top - base.top, w: r.width, h: r.height };
}

/**
 * Tient le vol en cours. `fly(text, from, to)` mesure et lance ; `landed`
 * se déclenche à l'arrivée (ou tout de suite si rien ne vole). Le `rootRef`
 * est l'élément `relative` dans lequel le jeton est rendu.
 */
export function useTokenFlight(rootRef: RefObject<HTMLElement | null>, onLand: () => void) {
  const feel = useGameFeel();
  const [flight, setFlight] = useState<TokenFlight | null>(null);

  const fly = useCallback(
    (text: string, from: Element | null, to: Element | null) => {
      const root = rootRef.current;
      if (!feel.budget.springs || !root || !from || !to) {
        onLand();
        return;
      }
      const a = boxOf(from, root);
      const b = boxOf(to, root);
      if (!a || !b) {
        onLand();
        return;
      }
      setFlight((current) => ({ id: (current?.id ?? 0) + 1, text, from: a, to: b }));
    },
    [feel.budget.springs, onLand, rootRef],
  );

  const land = useCallback(() => {
    setFlight(null);
    onLand();
  }, [onLand]);

  return { flight, fly, land };
}

/** Le jeton en vol : à poser dans la racine `relative`, après le reste. */
export function FlyingToken({
  flight,
  onLand,
  className = "",
  children,
}: {
  flight: TokenFlight | null;
  onLand: () => void;
  /** L'habillage du jeton : la face du trou rempli, pour qu'il ait l'air de s'y fondre. */
  className?: string;
  children?: ReactNode;
}) {
  if (!flight) return null;
  const { from, to } = flight;
  // Le jeton part à la taille de la tuile et arrive à celle du trou, centre
  // sur centre ; l'échelle garde ses proportions.
  const scale = Math.min(to.h / from.h, 1.2);
  const dx = to.x + to.w / 2 - (from.x + from.w / 2);
  const dy = to.y + to.h / 2 - (from.y + from.h / 2);
  const style: CSSProperties = { left: from.x, top: from.y, width: from.w, height: from.h };

  return (
    <motion.span
      key={flight.id}
      aria-hidden
      className={`pointer-events-none absolute z-10 flex items-center justify-center rounded-xl font-display text-lg font-extrabold ${className}`}
      style={style}
      initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
      animate={{ x: dx, y: dy, scale, opacity: 1 }}
      // `restDelta` et `restSpeed` : le ressort se déclare posé dès qu'il est à
      // un demi-pixel et presque immobile. Avec les seuils par défaut (un
      // centième de pixel), le jeton restait planté sur le trou, en grand,
      // pendant 400 ms avant que le trou ne le révèle (filmé sur le simulateur
      // iPhone 17) : l'arrivée se voyait deux fois.
      transition={{ type: "spring", stiffness: 340, damping: 22, mass: 0.9, restDelta: 0.5, restSpeed: 20 }}
      onAnimationComplete={onLand}
    >
      {children ?? flight.text}
    </motion.span>
  );
}
