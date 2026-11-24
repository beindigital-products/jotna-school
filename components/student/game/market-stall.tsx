"use client";

import { motion } from "framer-motion";
import { Check, Tent } from "lucide-react";
import { SHOP_ITEMS, type ShopItem } from "@/convex/gameCatalog";
import { campItemImageSrc } from "@/lib/game-assets";
import { getRarityChipClass, getRarityLabel } from "@/lib/badges";
import { kidMessages } from "@/lib/kidCopy";
import { pioSays } from "@/lib/pioCopy";
import { CauriIcon, caurisLabel } from "./cauri";
import { GameButton } from "./game-button";

/**
 * L'ÉTAL DU MARCHÉ — ce que l'enfant peut s'offrir avec ses cauris.
 *
 * Une toile rayée, une enseigne de bois, le solde bien en vue, puis les objets
 * du catalogue (`convex/gameCatalog.ts`). Chaque objet dit lui-même où en est
 * l'enfant : « Acheter » quand il a assez, « Encore 12 cauris » quand il lui
 * en manque, « Posé au camp » quand il l'a déjà. Pas de compte à rebours, pas
 * d'offre qui expire : rien ne presse un enfant ici, et les cauris ne
 * s'achètent jamais avec de l'argent.
 *
 * COMPOSANT DE PRÉSENTATION : la page Marché lui passe le solde et le geste
 * d'achat (`useWallet`, `useEconomyActions`) ; `/dev/jeu` lui en passe de
 * factices. L'achat demande le réseau (`online`).
 */
export function MarketStall({
  cauris,
  ownedItemIds,
  online,
  busyId,
  notice,
  onBuy,
}: {
  cauris: number;
  ownedItemIds: readonly string[];
  /** Le réseau est là : sans lui, on regarde mais on n'achète pas. */
  online: boolean;
  /** L'objet dont l'achat est en cours. */
  busyId: string | null;
  /** Ce que Pio annonce après un achat, ou quand il a échoué. */
  notice: string | null;
  onBuy: (item: ShopItem) => void;
}) {
  const owned = new Set(ownedItemIds);

  return (
    <div className="overflow-hidden rounded-[2rem] bg-[linear-gradient(180deg,#fde9b0_0%,#f6c452_100%)] shadow-xl">
      {/* ── La toile de l'étal et son enseigne ──────────────────────────── */}
      <div className="relative">
        <div
          aria-hidden
          className="h-20 bg-[repeating-linear-gradient(90deg,#ea580c_0_40px,#fff7e0_40px_80px)] shadow-[inset_0_-10px_14px_-8px_rgba(124,45,18,0.45)]"
        />
        <div
          aria-hidden
          className="h-5 bg-[radial-gradient(circle_at_50%_0,#c2410c_0_19px,transparent_20px)] bg-[length:40px_20px] bg-repeat-x drop-shadow-[0_4px_3px_rgba(124,45,18,0.35)]"
        />
        <div className="absolute inset-x-4 top-4 flex items-center justify-between gap-3">
          <h1 className="rounded-2xl border-[3px] border-[#7a4a23] bg-[linear-gradient(180deg,#c98240_0%,#a5602c_100%)] px-4 py-1.5 font-display text-xl font-extrabold text-white shadow-[0_4px_0_#5b3516] [text-shadow:0_2px_0_rgb(0_0_0_/_0.3)] sm:text-2xl">
            {pioSays.marketTitle}
          </h1>
          <p
            className="flex h-11 items-center gap-1.5 rounded-full border-2 border-white/50 bg-amber-950/80 pl-1.5 pr-3.5 font-display text-lg font-extrabold text-white"
            aria-label={`Tu as ${caurisLabel(cauris)}`}
          >
            <CauriIcon className="h-8 w-8" />
            {cauris}
          </p>
        </div>
      </div>

      <div className="space-y-4 p-4 sm:p-6">
        <p className="font-display text-base font-bold text-amber-950">{pioSays.marketIntro}</p>

        {!online && (
          <p className="rounded-2xl border-2 border-amber-300 bg-[#fff8e6] px-4 py-3 font-display text-base font-bold text-amber-900">
            {kidMessages.offline.marketOnline}
          </p>
        )}

        <p role="status" aria-live="polite" className={notice ? "rounded-2xl border-2 border-lime-300 bg-lime-100 px-4 py-3 font-display text-base font-extrabold text-green-950" : "sr-only"}>
          {notice ?? ""}
        </p>

        <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {SHOP_ITEMS.map((item, i) => {
            const has = owned.has(item.id);
            const missing = Math.max(0, item.price - cauris);
            return (
              <motion.li
                key={item.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 * i, type: "spring", stiffness: 280, damping: 22 }}
                className="flex flex-col gap-2 rounded-3xl border-[3px] border-amber-200 bg-[linear-gradient(180deg,#fffdf5_0%,#fff1cc_100%)] p-3 shadow-[0_6px_0_#d6b25e,0_16px_18px_-12px_rgba(60,30,0,0.45)]"
              >
                <div className="relative flex aspect-[4/3] items-center justify-center rounded-2xl bg-[radial-gradient(circle_at_50%_40%,#fff7c2_0%,#fde68a_70%)]">
                  {/* eslint-disable-next-line @next/next/no-img-element -- objet détouré ; `next/image` n'apporte rien sous export statique */}
                  <img
                    src={campItemImageSrc(item.id)}
                    alt=""
                    draggable={false}
                    loading="lazy"
                    className="absolute inset-[7%] h-[86%] w-[86%] object-contain drop-shadow-[0_8px_8px_rgba(60,30,0,0.35)]"
                  />
                  {item.rarity !== "common" && (
                    <span className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wide ${getRarityChipClass(item.rarity)}`}>
                      {getRarityLabel(item.rarity)}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="font-display text-lg font-extrabold leading-tight text-amber-950">{item.name}</h2>
                  <p className="text-sm font-medium leading-snug text-amber-900">{item.description}</p>
                </div>
                {has ? (
                  <p className="flex min-h-12 items-center justify-center gap-1.5 rounded-2xl bg-green-700 px-2 font-display text-sm font-extrabold text-white sm:text-base">
                    <Check className="h-5 w-5" aria-hidden />
                    {pioSays.marketOwned}
                  </p>
                ) : missing > 0 ? (
                  <p className="flex min-h-12 items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-amber-400 px-2 text-center font-display text-sm font-extrabold text-amber-900">
                    <CauriIcon className="h-5 w-5 shrink-0" />
                    {pioSays.marketMissing(missing)}
                  </p>
                ) : (
                  <GameButton
                    tone="green"
                    size="md"
                    className="w-full"
                    disabled={!online || busyId !== null}
                    onClick={() => onBuy(item)}
                    ariaLabel={`${pioSays.marketBuy} ${item.name} pour ${caurisLabel(item.price)}`}
                    icon={<CauriIcon className="h-6 w-6" />}
                  >
                    {busyId === item.id ? "..." : `${item.price}`}
                  </GameButton>
                )}
              </motion.li>
            );
          })}
        </ul>

        {owned.size > 0 && (
          <GameButton href="/student/home" tone="white" size="md" icon={<Tent className="h-5 w-5" aria-hidden />}>
            {pioSays.marketSeeCamp}
          </GameButton>
        )}
      </div>
    </div>
  );
}
