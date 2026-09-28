"use client";

import { Check, Lock, Play, Star } from "lucide-react";
import { motion } from "framer-motion";

/**
 * UNE ÉTAPE SUR LE SENTIER — un gros bouton rond, lisible d'un coup d'œil,
 * posé en coordonnées-monde sur la carte de jeu (`game-map.tsx`).
 *
 *   ✓ vert     = franchie, avec ses étoiles
 *   ▶ orange   = en cours, anneau qui pulse : « c'est ici »
 *   ▶ ambre    = ouverte, jamais commencée
 *   🔒 gris    = fermée, en attendant l'étape d'avant
 *
 * La géométrie du sentier vit dans `trail-geometry.ts` ; ici, seulement le
 * dessin d'un nœud. `x` et `y` sont le centre du nœud dans le monde.
 */
export type TrailNodeStatus = "locked" | "available" | "in_progress" | "completed";

export const TRAIL_NODE_SIZE = 84;

export function TrailNode({
  x,
  y,
  index,
  status,
  stars,
  label,
  selected,
  shaking = false,
  onSelect,
}: {
  x: number;
  y: number;
  index: number;
  status: TrailNodeStatus;
  stars: number;
  label: string;
  selected: boolean;
  /** Le nœud fermé qu'on vient de toucher : il dit non de la tête. */
  shaking?: boolean;
  onSelect: () => void;
}) {
  const isCurrent = status === "in_progress";
  const isDone = status === "completed";
  const isLocked = status === "locked";

  const face = isDone
    ? "bg-gradient-to-b from-lime-400 to-green-600 text-white"
    : isCurrent
      ? "bg-gradient-to-b from-amber-300 to-orange-500 text-white"
      : isLocked
        ? "bg-gradient-to-b from-gray-200 to-gray-400 text-gray-600"
        : "bg-gradient-to-b from-yellow-200 to-amber-400 text-amber-900";

  const depth = isDone
    ? "#166534"
    : isCurrent
      ? "#b45309"
      : isLocked
        ? "#6b7280"
        : "#b45309";

  return (
    <div
      className="absolute z-10"
      style={{ left: x, top: y, width: TRAIL_NODE_SIZE, height: TRAIL_NODE_SIZE, transform: "translate(-50%, -50%)" }}
    >
      <motion.button
        type="button"
        onClick={onSelect}
        aria-label={`Étape ${index + 1} : ${label}, ${
          isDone
            ? `franchie, ${stars} étoile${stars > 1 ? "s" : ""}`
            : isCurrent
              ? "en cours"
              : isLocked
                ? "fermée"
                : "ouverte"
        }`}
        aria-pressed={selected}
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: Math.min(index, 8) * 0.04, type: "spring", stiffness: 260, damping: 18 }}
        whileTap={{ scale: 0.94 }}
        className={`relative block h-full w-full rounded-full focus-visible:outline-none ${
          shaking ? "animate-[head-shake_0.45s_ease-in-out]" : ""
        }`}
      >
        {/* L'anneau qui pulse sur l'étape courante */}
        {isCurrent && (
          <span
            aria-hidden
            className="absolute inset-0 -m-2.5 rounded-full border-4 border-white/85 animate-[twinkle_1.6s_ease-in-out_infinite]"
          />
        )}
        <span
          className={`btn-chunky flex h-full w-full items-center justify-center rounded-full border-4 border-white font-display text-2xl font-extrabold ${face} ${
            selected ? "ring-4 ring-sky-300" : ""
          }`}
          style={{ "--btn-depth": depth } as React.CSSProperties}
        >
          {isDone ? (
            <Check className="h-10 w-10" strokeWidth={3.5} aria-hidden />
          ) : isLocked ? (
            <Lock className="h-8 w-8" aria-hidden />
          ) : (
            <Play className="h-9 w-9 fill-current" aria-hidden />
          )}
        </span>

        {/* Les étoiles d'une étape franchie */}
        {isDone && stars > 0 && (
          <span
            aria-hidden
            className="absolute -bottom-3.5 left-1/2 flex -translate-x-1/2 gap-0.5 rounded-full border-2 border-white bg-white px-1.5 py-0.5 shadow"
          >
            {[1, 2, 3].map((s) => (
              <Star
                key={s}
                className={`h-4 w-4 ${
                  s <= stars ? "fill-yellow-400 text-yellow-500" : "text-gray-300"
                }`}
              />
            ))}
          </span>
        )}

        {/* Le numéro de l'étape, en haut à droite : Pio se tient en bas à gauche */}
        <span
          aria-hidden
          className="absolute -right-2.5 -top-2.5 flex h-8 w-8 items-center justify-center rounded-full border-[3px] border-white bg-amber-900 font-display text-sm font-extrabold text-white shadow"
        >
          {index + 1}
        </span>
      </motion.button>
    </div>
  );
}
