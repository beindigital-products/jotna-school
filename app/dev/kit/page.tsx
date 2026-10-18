import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DEV_PAGES_ENABLED } from "../garde";
import { KitShowcase } from "./kit-showcase";

/**
 * LA PAGE DE MONTRE DE LA BOÎTE À OUTILS — `/dev/kit`.
 *
 * Chaque brique de `components/student/game-kit/`, dans chacun de ses états,
 * au niveau « riche » et au niveau « sobre », pour la regarder avant de
 * l'employer dans un écran d'exercice. Même garde que la galerie des
 * exercices (`../garde.ts`) : en développement, ou avec
 * `NEXT_PUBLIC_EXERCISE_GALLERY=1` ; sinon la page rend la 404. Son code
 * reste dans l'export (25 Ko, inerte : voir `../garde.ts`).
 */
export const metadata: Metadata = {
  title: "Boîte à outils du jeu",
  robots: { index: false, follow: false },
};

export default function KitPage() {
  if (!DEV_PAGES_ENABLED) notFound();
  return (
    <Suspense fallback={null}>
      <KitShowcase />
    </Suspense>
  );
}
