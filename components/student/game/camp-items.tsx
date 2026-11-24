"use client";

import { motion } from "framer-motion";
import { SHOP_ITEMS } from "@/convex/gameCatalog";
import { campItemImageSrc } from "@/lib/game-assets";

/**
 * LES OBJETS DU CAMP — ce que l'enfant a acheté au marché, posé autour de Pio.
 *
 * Chaque objet a sa place dans le catalogue (`ShopItem.spot`, en pourcentage
 * du cadre de Pio) : les objets du sol au pied de Pio, ceux du ciel au-dessus,
 * et la bande du milieu laissée au coffre du jour et aux modules de l'école.
 * Le cadre est borné à la largeur d'un téléphone : sur un grand écran, les
 * objets restent groupés autour de Pio au lieu de s'écarter avec la page.
 *
 * Décor seulement : rien ne se touche, tout passe DERRIÈRE Pio et ses
 * médaillons (`pointer-events-none`, pas de `z-index`). Un objet du ciel flotte
 * doucement ; `savanna-motion`, posé par le décor, coupe ce mouvement sous
 * `prefers-reduced-motion`.
 *
 * COMPOSANT DE PRÉSENTATION : le camp lui passe `useWallet().ownedItemIds`.
 */
export function CampItems({ ownedItemIds }: { ownedItemIds: readonly string[] }) {
  const owned = new Set(ownedItemIds);
  const items = SHOP_ITEMS.filter((item) => owned.has(item.id));
  if (items.length === 0) return null;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-y-0 left-1/2 w-full max-w-md -translate-x-1/2">
      {items.map((item, i) => {
        const inSky = item.spot.bottom >= 50;
        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + i * 0.1, type: "spring", stiffness: 260, damping: 16 }}
            className="absolute -translate-x-1/2"
            style={{ left: `${item.spot.x}%`, bottom: `${item.spot.bottom}%`, width: `${item.spot.width}%` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- objet détouré du décor ; `next/image` n'apporte rien sous export statique */}
            <img
              src={campItemImageSrc(item.id)}
              alt=""
              draggable={false}
              className={`w-full drop-shadow-[0_8px_8px_rgba(60,30,0,0.4)] ${
                inSky ? "animate-[float-slow_4.5s_ease-in-out_infinite]" : ""
              }`}
            />
          </motion.div>
        );
      })}
    </div>
  );
}
