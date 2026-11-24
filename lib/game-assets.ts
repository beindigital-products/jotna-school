/**
 * LES IMAGES DU JEU : où trouver la carte d'un album et l'objet d'un marché.
 *
 * Les identifiants sont ceux de `convex/gameCatalog.ts` ; les fichiers sont
 * fabriqués par `scripts/build-game-assets.mjs`, et
 * `lib/__tests__/game-assets.test.ts` vérifie que chaque entrée du catalogue a
 * les siens. Sur un appareil « lite » (`hooks/use-device-tier.ts`), une carte
 * se charge en 256 pixels au lieu de 512.
 */
import type { DeviceTier } from "@/hooks/use-device-tier";

export function cardImageSrc(cardId: string, tier: DeviceTier = "full"): string {
  return `/images/cartes/${cardId}${tier === "lite" ? "-s" : ""}.webp`;
}

export function campItemImageSrc(itemId: string): string {
  return `/images/camp/${itemId}.webp`;
}

/** Le camp de nuit, cadré comme le camp de jour (`savanna-backdrop.tsx`). */
export const CAMP_NIGHT_PORTRAIT = "/images/world/hub-savanna-night-portrait.jpg";
export const CAMP_NIGHT_WIDE = "/images/world/hub-savanna-night-wide.jpg";
