import type { ExerciseType } from "@/convex/exerciseTypes";

/**
 * Les couleurs de chaque type d'exercice sur les cartes de la vitrine. Des
 * classes écrites en toutes lettres, pour que Tailwind les trouve.
 */
export const TYPE_STYLE: Record<ExerciseType, { tint: string; accent: string }> = {
  qcm: { tint: "from-amber-50 to-amber-100/60", accent: "text-amber-700" },
  "drag-drop": { tint: "from-orange-50 to-orange-100/60", accent: "text-orange-700" },
  match: { tint: "from-sky-50 to-sky-100/60", accent: "text-sky-700" },
  order: { tint: "from-lime-50 to-lime-100/60", accent: "text-lime-700" },
  "short-answer": { tint: "from-yellow-50 to-yellow-100/60", accent: "text-yellow-700" },
  "fill-blank": { tint: "from-violet-50 to-violet-100/60", accent: "text-violet-700" },
  pattern: { tint: "from-rose-50 to-rose-100/60", accent: "text-rose-700" },
  "pixel-art": { tint: "from-fuchsia-50 to-fuchsia-100/60", accent: "text-fuchsia-700" },
  listen: { tint: "from-cyan-50 to-cyan-100/60", accent: "text-cyan-700" },
  "color-mix": { tint: "from-emerald-50 to-emerald-100/60", accent: "text-emerald-700" },
};
