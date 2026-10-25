"use client";

import { Map as MapIcon, Star } from "lucide-react";
import { pioSays } from "@/lib/pioCopy";

/**
 * LA BANNIÈRE DE LA CARTE — collée au cadre, en haut à gauche : le nom du lieu,
 * la consigne, et la progression de toute l'aventure en une jauge.
 *
 * Même matière que les plaques des mondes et les boutons du jeu : une face
 * crème, un liseré blanc, un flanc épais. Le total compte les étapes de TOUS
 * les mondes : un enfant voit d'un coup d'œil ce qu'il a déjà parcouru, sans
 * ouvrir chaque monde.
 */
export function WorldMapTitle({
  zones,
}: {
  zones: ReadonlyArray<{ completedPaliers: number; totalPaliers: number }>;
}) {
  const done = zones.reduce((n, z) => n + z.completedPaliers, 0);
  const total = zones.reduce((n, z) => n + z.totalPaliers, 0);
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="pointer-events-none absolute left-3 top-3 z-20 max-w-[calc(100%-4.75rem)]">
      <div className="flex flex-col gap-1.5 rounded-2xl border-[3px] border-white bg-gradient-to-b from-[#fffaf0] to-[#fde9b4] py-2 pl-2 pr-4 text-amber-950 shadow-[0_4px_0_0_#c9a35a,0_12px_18px_-8px_rgba(60,30,0,0.55)]">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-[3px] border-white bg-gradient-to-b from-amber-400 to-orange-500 text-white shadow-[0_3px_0_0_#b45309] sm:h-10 sm:w-10">
            <MapIcon className="h-5 w-5" strokeWidth={3} aria-hidden />
          </span>
          <div className="min-w-0">
            <h1 className="font-display text-lg font-extrabold leading-tight sm:text-2xl [@media(max-height:500px)]:text-lg">
              {pioSays.mapTitle}
            </h1>
            <p className="hidden font-display text-sm font-bold text-amber-900/80 sm:block [@media(max-height:500px)]:hidden">
              {pioSays.mapTap}
            </p>
            {/* À l'horizontale, la jauge cède la place à un compte : la bannière tient sur une ligne. */}
            {total > 0 && (
              <p className="hidden items-center gap-1 font-display text-xs font-extrabold tabular-nums text-amber-900 [@media(max-height:500px)]:flex">
                <Star className="h-4 w-4 fill-yellow-400 text-amber-500" strokeWidth={2} aria-hidden />
                {done}/{total} étapes
              </p>
            )}
          </div>
        </div>

        {total > 0 && (
          <div className="flex items-center gap-2 pl-0.5 [@media(max-height:500px)]:hidden">
            <Star className="h-5 w-5 shrink-0 fill-yellow-400 text-amber-500" strokeWidth={2} aria-hidden />
            <span className="relative h-2.5 min-w-16 flex-1 overflow-hidden rounded-full bg-amber-900/15 shadow-[inset_0_1px_2px_rgba(60,30,0,0.35)]">
              <span
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-b from-yellow-200 to-amber-400"
                style={{ width: `${Math.max(pct > 0 ? 8 : 0, pct)}%` }}
              />
            </span>
            <span className="font-display text-xs font-extrabold tabular-nums text-amber-900 sm:text-sm">
              {done}/{total} étapes
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
