import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DEV_PAGES_ENABLED } from "../garde";
import { JeuDemo } from "./jeu-demo";

/**
 * L'ÉCONOMIE DU JEU SANS SERVEUR — `/dev/jeu`.
 *
 * Le camp (jour et nuit, objets posés, coffre du jour), l'étal du marché et
 * l'album de cartes, montés avec des données factices : on achète, on ouvre le
 * coffre, on regarde l'album se remplir, sans compte ni Convex. Les composants
 * sont ceux des vraies pages (`MarketStall`, `CardAlbum`, `DailyChestOverlay`,
 * `CampItems`) ; seules les données sont fausses. Même garde que les autres
 * pages de développement (`../garde.ts`).
 */
export const metadata: Metadata = {
  title: "L'économie du jeu",
  robots: { index: false, follow: false },
};

export default function JeuPage() {
  if (!DEV_PAGES_ENABLED) notFound();
  return <JeuDemo />;
}
