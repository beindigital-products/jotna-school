"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { COFFRE_FERME, Coffre } from "@/components/student/game-kit/coffre";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { findCard, type CardRarity } from "@/convex/gameCatalog";
import { cardImageSrc } from "@/lib/game-assets";
import { getRarityLabel } from "@/lib/badges";
import { kidMessages } from "@/lib/kidCopy";
import { pioSays } from "@/lib/pioCopy";
import { cardTitle } from "./card-album";
import { CauriIcon } from "./cauri";
import { GameButton } from "./game-button";

/**
 * LE COFFRE DU JOUR — un coffre par jour de jeu, sur le camp.
 *
 * Il se mérite : il est `locked` tant que l'enfant n'a pas fini un palier
 * aujourd'hui, `ready` ensuite (`economy.getMyWallet`). L'effort d'abord, le
 * trésor ensuite. Ouvert, il donne des cauris et une carte de l'album ; une
 * carte que l'enfant a déjà se change en cauris.
 *
 * DEUX PIÈCES :
 *   - `ChestMedallion`, le médaillon posé à côté de Pio, comme ceux des
 *     modules de l'école. Prêt, il brille ; fermé, il porte un cadenas et Pio
 *     dit comment l'ouvrir.
 *   - `DailyChestOverlay`, la scène de l'ouverture : le coffre du jeu
 *     (`game-kit/coffre.tsx`, son clip et son éclat), puis ce qu'il contenait.
 *
 * COMPOSANTS DE PRÉSENTATION : le camp leur passe l'état et le geste
 * d'ouverture (`useWallet`, `useEconomyActions`) ; `/dev/jeu` leur en passe de
 * factices. L'ouverture demande le réseau (`online`).
 */
export type ChestContents = {
  cauris: number;
  cardId: string;
  duplicate: boolean;
  duplicateCauris: number;
};

export function ChestMedallion({
  ready,
  onPress,
  delay = 0.3,
}: {
  /** Le coffre est prêt à s'ouvrir ; sinon il est fermé à clé. */
  ready: boolean;
  onPress: () => void;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ scale: 0.4, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay, type: "spring", stiffness: 260, damping: 15 }}
    >
      <motion.div
        animate={ready ? { y: [0, -5, 0] } : { y: 0 }}
        transition={ready ? { duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: delay + 0.6 } : { duration: 0 }}
      >
        <button
          type="button"
          onClick={onPress}
          aria-label={ready ? `${pioSays.chestTitle} : prêt à ouvrir` : `${pioSays.chestTitle} : ${pioSays.chestLocked}`}
          className="group flex w-[78px] flex-col items-center gap-1.5 rounded-3xl outline-none focus-visible:ring-4 focus-visible:ring-white/80 sm:w-[100px]"
        >
          <span className="relative block h-[70px] w-[70px] sm:h-[88px] sm:w-[88px]">
            {ready && (
              <motion.span
                aria-hidden
                className="absolute -inset-3 rounded-full bg-[radial-gradient(circle,rgba(253,224,71,0.85)_0%,rgba(253,224,71,0.4)_45%,rgba(253,224,71,0)_70%)]"
                animate={{ opacity: [0.55, 1, 0.55], scale: [0.94, 1.06, 0.94] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
            <span
              className={`btn-chunky relative flex h-full w-full items-center justify-center overflow-hidden rounded-full border-[4px] border-white shadow-lg transition-transform group-active:scale-95 ${
                ready
                  ? "bg-[radial-gradient(circle_at_50%_35%,#fff7c2_0%,#fbbf24_100%)]"
                  : "bg-[radial-gradient(circle_at_50%_35%,#f5ecd5_0%,#d6c39a_100%)]"
              }`}
              style={{ "--btn-depth": ready ? "#b45309" : "#8a7a55" } as React.CSSProperties}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- petite vignette ; `next/image` n'apporte rien sous export statique */}
              <img
                src={COFFRE_FERME}
                alt=""
                draggable={false}
                className={`h-[82%] w-[82%] object-contain ${ready ? "" : "opacity-70 grayscale-[0.6]"}`}
              />
            </span>
            {ready ? (
              <span className="absolute -right-2 -top-1.5 rounded-full border-2 border-white bg-red-700 px-2 py-0.5 font-display text-[11px] font-extrabold leading-none text-white">
                Prêt
              </span>
            ) : (
              <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-amber-900 text-white">
                <Lock className="h-3 w-3" aria-hidden />
              </span>
            )}
          </span>
          <span className="text-outline text-center font-display text-[13px] font-extrabold leading-tight text-white sm:text-sm">
            {pioSays.chestTitle}
          </span>
        </button>
      </motion.div>
    </motion.div>
  );
}

const RARITY_TILE: Record<CardRarity, string> = {
  common: "border-amber-400 bg-[linear-gradient(180deg,#fffbeb_0%,#fde68a_100%)]",
  rare: "border-sky-500 bg-[linear-gradient(180deg,#f0f9ff_0%,#7dd3fc_100%)]",
  epic: "border-purple-500 bg-[linear-gradient(180deg,#faf5ff_0%,#d8b4fe_100%)]",
};

type Phase = "ready" | "opening" | "opened" | "failed";

/**
 * La scène de l'ouverture. Le camp la monte quand l'enfant touche le
 * médaillon et la démonte à la fermeture : chaque ouverture repart de zéro.
 */
export function DailyChestOverlay({
  onClose,
  onOpenChest,
  online,
}: {
  onClose: () => void;
  /** Ouvre le coffre côté serveur et rend ce qu'il contenait. */
  onOpenChest: () => Promise<ChestContents>;
  /** Le réseau est là : sans lui, le coffre attend. */
  online: boolean;
}) {
  const [phase, setPhase] = useState<Phase>("ready");
  const [contents, setContents] = useState<ChestContents | null>(null);

  async function open() {
    if (phase !== "ready" && phase !== "failed") return;
    if (!online) return;
    setPhase("opening");
    try {
      const got = await onOpenChest();
      setContents(got);
      setPhase("opened");
    } catch {
      setPhase("failed");
    }
  }

  const card = contents ? findCard(contents.cardId) : undefined;
  const headline =
    phase === "opened"
      ? pioSays.chestOpened
      : phase === "opening"
        ? pioSays.chestOpening
        : phase === "failed"
          ? pioSays.chestFailed
          : online
            ? pioSays.chestReady
            : kidMessages.offline.chestOnline;

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="max-w-md overflow-hidden border-0 bg-[radial-gradient(circle_at_50%_32%,#5b21b6_0%,#2e1065_58%,#1e1b4b_100%)] p-6 text-white">
        {/* Les rayons qui tournent derrière le coffre. */}
        <div aria-hidden className="savanna-motion pointer-events-none absolute left-1/2 top-[34%] h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2">
          <div
            className="h-full w-full animate-[spin_26s_linear_infinite] rounded-full bg-[repeating-conic-gradient(rgba(255,210,63,0.45)_0deg_9deg,rgba(255,210,63,0)_9deg_24deg)] transition-opacity duration-700 [mask-image:radial-gradient(circle,#000_12%,transparent_68%)]"
            style={{ opacity: phase === "opened" ? 1 : 0.4 }}
          />
        </div>

        <div className="relative flex flex-col items-center gap-4 text-center">
          <span className="rounded-full border-2 border-white bg-gradient-to-b from-amber-500 to-amber-700 px-4 py-1 font-display text-sm font-extrabold text-white shadow-[0_3px_0_#78350f]">
            {pioSays.chestTitle}
          </span>
          <DialogTitle className="text-outline text-3xl text-white">{headline}</DialogTitle>
          <DialogDescription className="sr-only">
            Un coffre par jour de jeu. Il contient des cauris et une carte de ton album.
          </DialogDescription>

          <button
            type="button"
            onClick={open}
            disabled={phase === "opening" || phase === "opened" || !online}
            aria-label={phase === "opened" ? "Le coffre est ouvert" : "Ouvrir le coffre"}
            className="gk-focus rounded-3xl p-2 disabled:cursor-default"
          >
            <Coffre open={phase === "opened"} size={176} startDelayMs={0} />
          </button>

          {phase === "opened" && contents && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4, type: "spring", stiffness: 240, damping: 20 }}
              className="flex w-full flex-col items-center gap-4"
            >
              <ul className="grid w-full grid-cols-2 gap-3">
                <li className="flex flex-col items-center justify-center gap-1 rounded-2xl border-[3px] border-amber-200 bg-[linear-gradient(180deg,#fffdf5_0%,#fff1cc_100%)] p-3 shadow-[0_5px_0_#d6b25e]">
                  <CauriIcon className="h-14 w-14" />
                  <span className="font-display text-2xl font-extrabold leading-none text-amber-950">
                    +{contents.cauris}
                  </span>
                  <span className="font-display text-sm font-bold text-amber-900">
                    {contents.cauris > 1 ? "cauris" : "cauri"}
                  </span>
                </li>
                {card && (
                  <li
                    className={`flex flex-col items-center gap-1 rounded-2xl border-[3px] p-2 shadow-[0_5px_0_rgba(0,0,0,0.35)] ${RARITY_TILE[card.rarity]}`}
                  >
                    <span className="block w-full overflow-hidden rounded-xl">
                      {/* eslint-disable-next-line @next/next/no-img-element -- vignette de carte ; `next/image` n'apporte rien sous export statique */}
                      <img
                        src={cardImageSrc(card.id, "full")}
                        alt=""
                        draggable={false}
                        className="aspect-square w-full object-cover"
                      />
                    </span>
                    <span className="font-display text-base font-extrabold leading-tight text-amber-950">
                      {cardTitle(card)}
                    </span>
                    <span className="rounded-full bg-amber-950 px-2.5 py-0.5 font-display text-xs font-extrabold text-white">
                      {contents.duplicate
                        ? `Carte ${getRarityLabel(card.rarity).toLowerCase()}`
                        : pioSays.chestNewCard}
                    </span>
                  </li>
                )}
              </ul>
              {contents.duplicate && (
                <p className="font-display text-base font-bold text-amber-100">
                  {pioSays.chestDuplicate(contents.duplicateCauris)}
                </p>
              )}
              <GameButton href="/student/tresors" tone="orange" size="lg" className="w-full">
                {pioSays.chestToTreasures}
              </GameButton>
            </motion.div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="gk-focus min-h-11 rounded-full px-4 font-display text-base font-extrabold text-violet-100 underline underline-offset-4"
          >
            {pioSays.chestBack}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
