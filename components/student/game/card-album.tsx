"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CARDS, CARD_SERIES, type CardRarity, type GameCard } from "@/convex/gameCatalog";
import { cardImageSrc } from "@/lib/game-assets";
import { getRarityChipClass, getRarityLabel } from "@/lib/badges";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDeviceTier } from "@/hooks/use-device-tier";
import { pioSays } from "@/lib/pioCopy";

/**
 * L'ALBUM DE CARTES — ce que l'enfant collectionne.
 *
 * Une série par panneau, ses cartes dans l'ordre du catalogue
 * (`convex/gameCatalog.ts`). Une carte gagnée montre son image et son nom ;
 * une carte manquante garde sa place, en pointillé, avec un « ? » : l'enfant
 * voit combien il en reste sans savoir lesquelles. La rareté se lit au cadre
 * (ambre, bleu, violet), comme pour les trophées.
 *
 * Toucher une carte ouvre sa fiche : l'image en grand et son « savais-tu »,
 * une phrase vraie sur l'animal. Une carte se gagne dans le coffre du jour
 * (`daily-chest.tsx`).
 *
 * COMPOSANT DE PRÉSENTATION : il reçoit les cartes possédées et ne lit rien
 * lui-même. La page Trésors lui passe `useCardAlbum()` ; `/dev/jeu` lui passe
 * des cartes factices.
 */
export type OwnedCard = { cardId: string; obtainedAt: number };

const FRAME: Record<CardRarity, { face: string; depth: string; glow: string }> = {
  common: {
    face: "border-amber-400 bg-[linear-gradient(180deg,#fffbeb_0%,#fde68a_100%)]",
    depth: "#b45309",
    glow: "",
  },
  rare: {
    face: "border-sky-500 bg-[linear-gradient(180deg,#f0f9ff_0%,#7dd3fc_100%)]",
    depth: "#0369a1",
    glow: "shadow-[0_0_16px_rgba(56,189,248,0.6)]",
  },
  epic: {
    face: "border-purple-500 bg-[linear-gradient(180deg,#faf5ff_0%,#d8b4fe_100%)]",
    depth: "#6d28d9",
    glow: "shadow-[0_0_18px_rgba(168,85,247,0.65)]",
  },
};

/** « la girafe » → « La girafe » : le nom en tête de fiche ou sous l'image. */
export function cardTitle(card: GameCard): string {
  return card.name.charAt(0).toUpperCase() + card.name.slice(1);
}

export function CardAlbum({ owned }: { owned: readonly OwnedCard[] }) {
  const tier = useDeviceTier();
  const ownedAt = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of owned) map.set(row.cardId, row.obtainedAt);
    return map;
  }, [owned]);
  const [detail, setDetail] = useState<GameCard | null>(null);
  const detailOwned = detail ? ownedAt.has(detail.id) : false;

  return (
    <div className="space-y-6">
      {CARD_SERIES.map((series) => {
        const cards = CARDS.filter((card) => card.seriesId === series.id);
        const found = cards.filter((card) => ownedAt.has(card.id)).length;
        const pct = cards.length > 0 ? Math.round((found / cards.length) * 100) : 0;
        const done = found === cards.length && cards.length > 0;
        return (
          <section
            key={series.id}
            aria-label={series.title}
            className="rounded-[2rem] bg-[radial-gradient(circle_at_50%_0%,#1f7a43_0%,#14532d_55%,#0b3d20_100%)] p-4 shadow-xl sm:p-6"
          >
            <div className="rounded-2xl border-2 border-lime-200/40 bg-black/25 p-3 sm:p-4">
              <div className="flex items-end justify-between gap-3">
                <h2 className="font-display text-lg font-extrabold leading-tight text-white sm:text-xl">
                  {series.title}
                </h2>
                <p className="shrink-0 font-display text-sm font-extrabold text-amber-200">
                  {found} sur {cards.length}
                </p>
              </div>
              <div
                className="mt-2 h-3.5 overflow-hidden rounded-full border-2 border-white/50 bg-white/15"
                role="img"
                aria-label={`${found} cartes trouvées sur ${cards.length}`}
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-yellow-300 to-amber-400 transition-[width] duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
              {(done || found === 0) && (
                <p className="mt-2 font-display text-sm font-bold text-lime-100">
                  {done ? pioSays.albumDone : pioSays.albumEmpty}
                </p>
              )}
            </div>

            <ul className="mt-4 grid grid-cols-3 gap-2.5 sm:grid-cols-4 sm:gap-4 lg:grid-cols-5">
              {cards.map((card, i) => {
                const has = ownedAt.has(card.id);
                const frame = FRAME[card.rarity];
                return (
                  <li key={card.id}>
                    <motion.button
                      type="button"
                      onClick={() => setDetail(card)}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.04 * i, type: "spring", stiffness: 300, damping: 22 }}
                      whileTap={{ scale: 0.96 }}
                      aria-label={
                        has
                          ? `${cardTitle(card)}, carte ${getRarityLabel(card.rarity).toLowerCase()}`
                          : `${pioSays.cardMystery}, ${getRarityLabel(card.rarity).toLowerCase()}`
                      }
                      style={has ? ({ "--btn-depth": frame.depth } as React.CSSProperties) : undefined}
                      className={`gk-focus flex aspect-[3/4] w-full flex-col items-center rounded-2xl p-1.5 text-center ${
                        has
                          ? `btn-chunky border-[3px] ${frame.face} ${frame.glow}`
                          : "justify-center gap-1 border-[3px] border-dashed border-lime-200/50 bg-white/[0.07]"
                      }`}
                    >
                      {has ? (
                        <>
                          <span className="block w-full flex-1 overflow-hidden rounded-xl">
                            {/* eslint-disable-next-line @next/next/no-img-element -- vignette d'album ; `next/image` n'apporte rien sous export statique */}
                            <img
                              src={cardImageSrc(card.id, tier)}
                              alt=""
                              draggable={false}
                              loading="lazy"
                              className="h-full w-full object-cover"
                            />
                          </span>
                          <span className="mt-1 font-display text-[13px] font-extrabold leading-tight text-amber-950 sm:text-sm">
                            {cardTitle(card)}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="font-display text-4xl font-extrabold leading-none text-lime-200" aria-hidden>
                            ?
                          </span>
                          <span className="font-display text-xs font-bold text-lime-100">
                            {getRarityLabel(card.rarity)}
                          </span>
                        </>
                      )}
                    </motion.button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      {/* ── La fiche d'une carte ────────────────────────────────────────── */}
      <Dialog
        open={detail !== null}
        onOpenChange={(open) => {
          if (!open) setDetail(null);
        }}
      >
        <DialogContent>
          {detail && (
            <DialogHeader>
              {detailOwned ? (
                <span
                  className={`block w-48 overflow-hidden rounded-3xl border-4 ${FRAME[detail.rarity].face} ${FRAME[detail.rarity].glow}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- image de fiche ; `next/image` n'apporte rien sous export statique */}
                  <img
                    src={cardImageSrc(detail.id, "full")}
                    alt=""
                    draggable={false}
                    className="aspect-square w-full object-cover"
                  />
                </span>
              ) : (
                <span
                  aria-hidden
                  className="flex h-48 w-48 items-center justify-center rounded-3xl border-4 border-dashed border-amber-300 bg-amber-50 font-display text-7xl font-extrabold text-amber-400"
                >
                  ?
                </span>
              )}
              <DialogTitle>{detailOwned ? cardTitle(detail) : pioSays.cardMystery}</DialogTitle>
              <span
                className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${getRarityChipClass(detail.rarity)}`}
              >
                {getRarityLabel(detail.rarity)}
              </span>
              <DialogDescription>
                {detailOwned ? (
                  <>
                    <span className="block font-display text-sm font-extrabold text-amber-800">
                      {pioSays.cardFactTitle}
                    </span>
                    {detail.fact}
                  </>
                ) : (
                  pioSays.cardMysteryBody
                )}
              </DialogDescription>
              {detailOwned && (
                <p className="text-center text-xs font-semibold text-amber-700">
                  Trouvée le {new Date(ownedAt.get(detail.id) ?? 0).toLocaleDateString("fr-FR")}
                </p>
              )}
            </DialogHeader>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
