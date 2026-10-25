import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DEV_PAGES_ENABLED } from "../garde";
import { CarteDemo } from "./carte-demo";

/**
 * LA CARTE DU MONDE SANS SERVEUR — `/dev/carte`.
 *
 * Huit mondes factices (un terminé, deux en cours, un nouveau, un sans étape
 * franchie…) posés sur la vraie carte de jeu (`GameMap`, `WorldNode`), pour la
 * regarder à tous les zooms sans compte ni Convex. Même garde que les autres
 * pages de développement (`../garde.ts`).
 */
export const metadata: Metadata = {
  title: "La carte du monde",
  robots: { index: false, follow: false },
};

export default function CartePage() {
  if (!DEV_PAGES_ENABLED) notFound();
  return <CarteDemo />;
}
