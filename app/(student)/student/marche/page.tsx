"use client";

import { useState } from "react";
import { MarketStall } from "@/components/student/game/market-stall";
import { Pio } from "@/components/student/pio";
import type { ShopItem } from "@/convex/gameCatalog";
import { useEconomyActions, useWallet } from "@/hooks/use-student-data";
import { kidMessages } from "@/lib/kidCopy";
import { pioSays } from "@/lib/pioCopy";
import { getSoundEnabledLocal, playCorrect } from "@/lib/sounds";

/**
 * LE MARCHÉ DE PIO — où les cauris se dépensent.
 *
 * La page lit la bourse (`useWallet`) et passe l'achat à l'étal
 * (`MarketStall`). Le prix n'est jamais envoyé par l'écran : le serveur le lit
 * dans le catalogue (`economy.buyItem`). Un achat réussi se voit tout de suite
 * (la bourse est une requête vivante) et s'entend, si l'enfant a accepté les
 * sons.
 *
 * EN LIGNE SEULEMENT pour l'instant : sans réseau, dans l'application, la
 * bourse n'arrive pas et Pio le dit, sans parler d'erreur.
 */
export default function StudentMarketPage() {
  const wallet = useWallet();
  const { online, buyItem } = useEconomyActions();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function buy(item: ShopItem) {
    if (busyId) return;
    setBusyId(item.id);
    setNotice(null);
    try {
      await buyItem(item.id);
      setNotice(pioSays.marketBought(item.name));
      if (getSoundEnabledLocal()) void playCorrect();
      try {
        navigator.vibrate?.(12);
      } catch {
        // Pas de vibreur : l'objet est acheté quand même.
      }
    } catch {
      setNotice(pioSays.marketFailed);
    } finally {
      setBusyId(null);
    }
  }

  if (wallet === undefined) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <Pio state="think" size={150} />
        <p className="font-display text-lg font-bold text-amber-900">J&apos;installe l&apos;étal...</p>
      </div>
    );
  }

  if (wallet === null) {
    return (
      <div className="px-4 pt-4 sm:px-0 sm:pt-6">
        <div className="flex flex-col items-center gap-3 rounded-3xl border-2 border-dashed border-amber-300 bg-white/70 p-8 text-center">
          <Pio state="idle" size={140} />
          <h1 className="font-display text-2xl font-extrabold text-amber-950">{pioSays.marketTitle}</h1>
          <p className="font-display text-base font-bold text-amber-900">{kidMessages.offline.marketOnline}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 sm:px-0 sm:pt-6">
      <MarketStall
        cauris={wallet.cauris}
        ownedItemIds={wallet.ownedItemIds}
        online={online}
        busyId={busyId}
        notice={notice}
        onBuy={buy}
      />
    </div>
  );
}
