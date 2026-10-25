"use client";

import { motion, useTransform } from "framer-motion";
import { pioSays } from "@/lib/pioCopy";
import { BiomeMedallion, sideColor } from "./biome-medallion";
import type { MapNodeContext } from "./game-map";
import { useCounterScale, useMapScale } from "./map-viewport";

/**
 * UN MONDE SUR LA CARTE — le socle de la matière, et sa plaque dessous.
 *
 * Ce qu'il faut pour le dessiner : la matière (`WorldZone`, ce que rend
 * `students.getMyWorldMap`) et le contexte que `GameMap` donne à chaque étape.
 * Extrait de la page de carte pour que la page de démo (`app/dev/carte`) montre
 * exactement le même nœud, sans serveur.
 *
 * LISIBLE À TOUT ZOOM. Dézoomé à 0,4, un socle de 128 pixels n'en fait plus
 * que 50 et une plaque de 15 pixels de texte devient illisible. Le médaillon se
 * recalibre donc contre le zoom (`useCounterScale`) : il grossit à moitié.
 * Deux plaques se partagent le travail, en fondu l'une dans l'autre selon le
 * zoom :
 *   - de près, la grande plaque SOUS le socle (numéro, nom, barre) ;
 *   - de loin, une petite plaque SUR LE CÔTÉ LIBRE du socle (le côté qui
 *     regarde hors du sentier), à taille d'écran constante. Le monde dézoomé
 *     est une colonne étroite au milieu d'un grand cadre : les côtés sont vides,
 *     le dessous est le sentier. Une plaque dessous recouvrirait le monde voisin.
 * Au zoom normal, rien ne bouge.
 */
export type WorldZone = {
  _id: string;
  name: string;
  color: string;
  icon: string;
  completedPaliers: number;
  totalPaliers: number;
  startedTopics: number;
};

export const WORLD_NODE_SIZE = 128;

/**
 * Sur une route couchée (cadre large), il y a de la place : les mondes peints
 * sont plus grands, pour qu'on lise la scène (un boulier, un phare) d'un coup d'œil.
 */
export function worldNodeSizeFor(horizontal: boolean, compact = false): number {
  if (!horizontal) return WORLD_NODE_SIZE;
  return compact ? 144 : 160;
}

export function WorldNode({
  zone,
  ctx,
  size = WORLD_NODE_SIZE,
}: {
  zone: WorldZone;
  ctx: MapNodeContext;
  size?: number;
}) {
  const side = ctx.side;
  const zoom = useMapScale();
  // Une route couchée a de grands socles et peu de hauteur : ils regrossissent à peine.
  const medal = useCounterScale({ cap: side === 0 ? 1.12 : 1.6, power: 0.6 });
  // De près : la plaque du dessous, un peu agrandie quand le zoom baisse.
  const below = useCounterScale({ cap: 1.35 });
  const belowShift = useTransform(medal, (m) => ((m - 1) * size) / 2);
  // De loin : la plaque du côté, exactement à la taille d'un texte à l'écran.
  const aside = useCounterScale({ cap: 3 });
  const asideShift = useTransform([medal, aside] as const, ([m, a]: readonly number[]) => (size / 2) * m - 12 * a);
  // 0 de près, 1 de loin : le fondu entre les deux plaques (autour de 0,6).
  // Une route couchée n'a pas de côté libre : la plaque reste dessous.
  const far = useTransform(zoom, (z) => (side === 0 ? 0 : Math.min(1, Math.max(0, (0.72 - z) / 0.2))));
  const nearOpacity = useTransform(far, (f) => 1 - f);
  const x = useTransform(asideShift, (v) => (side < 0 ? -v : v));
  const pct = zone.totalPaliers > 0 ? Math.round((zone.completedPaliers / zone.totalPaliers) * 100) : 0;
  const fresh = zone.completedPaliers === 0 && zone.startedTopics === 0;
  const done = pct >= 100;
  const accent = zone.color;

  return (
    <div
      className="absolute z-10"
      style={{ left: ctx.x, top: ctx.y, width: size, height: size, transform: "translate(-50%, -50%)" }}
    >
      <button
        type="button"
        onClick={ctx.walkTo}
        className="group relative block h-full w-full rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white"
        aria-label={`${zone.name} : ${zone.completedPaliers} étape${zone.completedPaliers > 1 ? "s" : ""} sur ${zone.totalPaliers}${ctx.isPioHere ? ", Pio est ici" : ""}`}
      >
        <motion.span
          className="block rounded-full transition-transform duration-150 group-active:scale-95"
          style={{ scale: medal }}
        >
          <span
            className={`block rounded-full ${
              ctx.isPioHere ? "shadow-[0_0_0_6px_rgba(255,255,255,0.8),0_0_0_12px_rgba(255,255,255,0.3)]" : ""
            }`}
          >
            <BiomeMedallion
              index={ctx.index}
              color={zone.color}
              icon={zone.icon}
              label={zone.name}
              progressPct={pct}
              size={size}
              showLabel={false}
            />
          </span>
        </motion.span>

        {/* La plaque : numéro, nom, barre de progression */}
        <motion.span
          aria-hidden
          className="absolute left-1/2 flex w-max max-w-[210px] -translate-x-1/2 flex-col gap-1 rounded-2xl border-[3px] border-white bg-gradient-to-b from-[#fffaf0] to-[#fde9b4] px-3 pb-1.5 pt-1.5 text-amber-950 shadow-[0_4px_0_0_#c9a35a,0_10px_14px_-6px_rgba(60,30,0,0.55)]"
          style={{ top: size + 16, y: belowShift, scale: below, opacity: nearOpacity, transformOrigin: "50% 0%" }}
        >
          <span className="flex items-center gap-2">
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-white font-display text-xs font-extrabold text-white"
              style={{ backgroundColor: accent, boxShadow: `0 2px 0 0 ${sideColor(accent, 0.6, "#78350f")}` }}
            >
              {ctx.index + 1}
            </span>
            <span className="truncate font-display text-[15px] font-extrabold leading-tight">{zone.name}</span>
          </span>
          {fresh ? (
            <span className="text-center font-display text-[11px] font-extrabold uppercase tracking-wide text-amber-800">
              {pioSays.zoneNew}
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <span className="relative h-2.5 min-w-14 flex-1 overflow-hidden rounded-full bg-amber-900/15 shadow-[inset_0_1px_2px_rgba(60,30,0,0.35)]">
                <span
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    width: `${Math.max(8, pct)}%`,
                    background: `linear-gradient(180deg, ${sideColor(accent, 1.3, accent)}, ${accent})`,
                  }}
                />
              </span>
              <span className="font-display text-[11px] font-extrabold tabular-nums text-amber-900">
                {done ? "Terminé" : `${zone.completedPaliers}/${zone.totalPaliers}`}
              </span>
            </span>
          )}
        </motion.span>

        {/* La plaque du côté libre, de loin : le nom et la jauge, à taille d'écran constante */}
        <motion.span
          aria-hidden
          className="absolute top-1/2 z-10 flex w-max max-w-[112px] flex-col gap-1 rounded-xl border-[3px] border-white bg-gradient-to-b from-[#fffaf0] to-[#fde9b4] px-2 py-1 text-amber-950 shadow-[0_3px_0_0_#c9a35a,0_8px_10px_-5px_rgba(60,30,0,0.55)]"
          style={{
            [side < 0 ? "right" : "left"]: "50%",
            x,
            y: "-50%",
            scale: aside,
            opacity: far,
            transformOrigin: side < 0 ? "100% 50%" : "0% 50%",
            pointerEvents: "none",
          }}
        >
          <span
            className="absolute -left-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white font-display text-[10px] font-extrabold text-white"
            style={{ backgroundColor: accent }}
          >
            {ctx.index + 1}
          </span>
          <span className="pl-1 font-display text-[11px] font-extrabold leading-[1.1]">{zone.name}</span>
          <span className="relative h-2 overflow-hidden rounded-full bg-amber-900/15 shadow-[inset_0_1px_2px_rgba(60,30,0,0.35)]">
            <span
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                width: fresh ? "0%" : `${Math.max(10, pct)}%`,
                background: `linear-gradient(180deg, ${sideColor(accent, 1.3, accent)}, ${accent})`,
              }}
            />
          </span>
        </motion.span>
      </button>
    </div>
  );
}
