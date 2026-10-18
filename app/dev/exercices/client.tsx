"use client";

import dynamic from "next/dynamic";

/**
 * LA GALERIE NE SE PRÉ-REND PAS. Les écrans d'exercice ne sont jamais rendus
 * côté serveur dans l'application (la séance les reçoit de Convex, dans le
 * navigateur) : certains tirent au sort au montage (`OrderExercise` mélange ses
 * tuiles) ou numérotent leurs attributs d'accessibilité (dnd-kit), et un HTML
 * pré-rendu ne pourrait pas coïncider avec le client. Montée côté client
 * seulement, la galerie montre l'écran tel que l'enfant l'a, sans erreur
 * d'hydratation.
 */
export const ExerciseGalleryClient = dynamic(() => import("./gallery").then((m) => m.ExerciseGallery), {
  ssr: false,
});
