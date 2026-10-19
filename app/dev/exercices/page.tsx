import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DEV_PAGES_ENABLED } from "../garde";
import { ExerciseGalleryClient } from "./client";

/**
 * `/dev/exercices/` — la galerie des écrans d'exercice (voir `./gallery.tsx`).
 * Développement seulement, ou `NEXT_PUBLIC_EXERCISE_GALLERY=1` (`../garde.ts`).
 */
export const metadata: Metadata = {
  title: "Galerie des exercices (dev)",
  robots: { index: false, follow: false },
};

export default function ExerciseGalleryPage() {
  if (!DEV_PAGES_ENABLED) notFound();
  return <ExerciseGalleryClient />;
}
