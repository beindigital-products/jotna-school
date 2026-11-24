"use client";

import { useState } from "react";
import { MotionConfig } from "framer-motion";
import { CampItems } from "@/components/student/game/camp-items";
import { CardAlbum, type OwnedCard } from "@/components/student/game/card-album";
import { CauriIcon } from "@/components/student/game/cauri";
import { ChestMedallion, DailyChestOverlay, type ChestContents } from "@/components/student/game/daily-chest";
import { GameButton } from "@/components/student/game/game-button";
import { MarketStall } from "@/components/student/game/market-stall";
import { SpeechBubble } from "@/components/student/game/speech-bubble";
import { Pio } from "@/components/student/pio";
import { SavannaBackdrop } from "@/components/student/world/savanna-backdrop";
import { rollChest } from "@/convex/economyRules";
import { CARDS, type ShopItem } from "@/convex/gameCatalog";
import { pioSays } from "@/lib/pioCopy";

/**
 * Le banc d'essai de `/dev/jeu` : une petite bourse en mémoire fait tourner
 * les vrais composants. Le coffre tire avec la vraie règle (`rollChest`), une
 * graine par ouverture.
 */
const START_CARDS: OwnedCard[] = [
  { cardId: "girafe", obtainedAt: Date.UTC(2026, 10, 20) },
  { cardId: "pelican", obtainedAt: Date.UTC(2026, 10, 21) },
  { cardId: "tortue", obtainedAt: Date.UTC(2026, 10, 22) },
];

export function JeuDemo() {
  const [night, setNight] = useState(false);
  const [cauris, setCauris] = useState(160);
  const [items, setItems] = useState<string[]>(["djembe"]);
  const [cards, setCards] = useState<OwnedCard[]>(START_CARDS);
  const [chestReady, setChestReady] = useState(true);
  const [chestOpen, setChestOpen] = useState(false);
  const [chestCount, setChestCount] = useState(1);
  const [notice, setNotice] = useState<string | null>(null);
  const [line, setLine] = useState("Bon retour ! Le coffre du jour est prêt.");

  function buy(item: ShopItem) {
    setCauris((value) => value - item.price);
    setItems((owned) => [...owned, item.id]);
    setNotice(pioSays.marketBought(item.name));
  }

  async function openChest(): Promise<ChestContents> {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const roll = rollChest({
      seed: `banc-d-essai|${chestCount}`,
      cards: CARDS,
      ownedCardIds: cards.map((card) => card.cardId),
    });
    setChestCount((n) => n + 1);
    setCauris((value) => value + roll.cauris + roll.duplicateCauris);
    if (!roll.duplicate) setCards((owned) => [...owned, { cardId: roll.cardId, obtainedAt: Date.now() }]);
    setChestReady(false);
    return roll;
  }

  return (
    <MotionConfig reducedMotion="user">
      <main className="mx-auto max-w-5xl space-y-10 bg-[linear-gradient(180deg,#bfe6fb_0%,#f9efd2_45%,#f6dfa4_100%)] pb-16">
        <header className="flex flex-wrap items-center justify-between gap-3 px-4 pt-6">
          <h1 className="font-display text-3xl font-extrabold text-amber-950">L&apos;économie du jeu</h1>
          <div className="flex flex-wrap items-center gap-2">
            <p className="flex h-11 items-center gap-1.5 rounded-full border-2 border-white bg-amber-950/85 pl-1.5 pr-3.5 font-display text-lg font-extrabold text-white">
              <CauriIcon className="h-8 w-8" />
              {cauris}
            </p>
            <GameButton tone="sky" size="md" onClick={() => setNight((value) => !value)}>
              {night ? "Jour" : "Nuit"}
            </GameButton>
            <GameButton tone="white" size="md" onClick={() => setChestReady((value) => !value)}>
              {chestReady ? "Fermer le coffre à clé" : "Préparer le coffre"}
            </GameButton>
            <GameButton tone="white" size="md" onClick={() => setCauris((value) => value + 50)}>
              +50 cauris
            </GameButton>
          </div>
        </header>

        <section aria-label="Le camp">
          <SavannaBackdrop variant="hub" night={night} minHeightClass="min-h-[560px] sm:min-h-[600px]">
            <div className="flex min-h-[560px] flex-col items-center justify-end px-4 pb-8 pt-6 sm:min-h-[600px] sm:pb-10">
              <SpeechBubble bubbleKey={line}>{line}</SpeechBubble>
              <div className="relative mt-6 w-full">
                <CampItems ownedItemIds={items} />
                <div className="relative z-10 mx-auto flex w-fit justify-center">
                  <Pio state="hello" size={272} className="drop-shadow-[0_18px_22px_rgba(60,30,0,0.45)]" />
                </div>
                <div className="absolute left-0 top-[38%] flex -translate-y-1/2 flex-col gap-4">
                  <ChestMedallion
                    ready={chestReady}
                    onPress={() => (chestReady ? setChestOpen(true) : setLine(pioSays.chestLocked))}
                  />
                </div>
              </div>
              <div className="mt-6 w-full max-w-sm">
                <GameButton tone="orange" size="lg" className="w-full">
                  Continuer l&apos;aventure
                </GameButton>
              </div>
            </div>
          </SavannaBackdrop>
        </section>

        <section aria-label="Le marché" className="px-4 sm:px-0">
          <MarketStall cauris={cauris} ownedItemIds={items} online busyId={null} notice={notice} onBuy={buy} />
        </section>

        <section aria-label="L'album" className="px-4 sm:px-0">
          <CardAlbum owned={cards} />
        </section>

        {chestOpen && <DailyChestOverlay onClose={() => setChestOpen(false)} onOpenChest={openChest} online />}
      </main>
    </MotionConfig>
  );
}
