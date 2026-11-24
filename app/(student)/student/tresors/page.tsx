"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Layers, Trophy } from "lucide-react";
import { CardAlbum } from "@/components/student/game/card-album";
import { TrophyRoom } from "@/components/student/game/trophy-room";
import { Pio } from "@/components/student/pio";
import { useCardAlbum } from "@/hooks/use-student-data";
import { kidMessages } from "@/lib/kidCopy";
import { pioSays } from "@/lib/pioCopy";

/**
 * MES TRÉSORS — tout ce que l'enfant a gagné, en un seul lieu.
 *
 * Deux onglets, parce que ce sont deux façons de gagner : une CARTE sort d'un
 * coffre, un TROPHÉE se mérite par un exploit. Les mêler dans une seule grille
 * brouillerait la différence ; leur donner deux lieux viderait l'un des deux.
 * La Salle des trophées est celle d'avant (`TrophyRoom`), déplacée telle
 * quelle ; `/student/badges` renvoie ici, sur son onglet.
 *
 * L'ONGLET EST DANS L'ADRESSE (`?onglet=trophees`) : un lien peut ouvrir la
 * salle des trophées directement, et le bouton retour revient sur le bon
 * onglet. `useSearchParams` impose le `Suspense` sous export statique
 * (`docs/capacitor-ios.md`).
 *
 * LES CARTES SE LISENT EN LIGNE pour l'instant (`useCardAlbum`) ; les trophées
 * se lisent sur l'appareil, avec ou sans réseau, comme avant.
 */
type TabKey = "cartes" | "trophees";

const TABS: readonly { key: TabKey; label: string; icon: typeof Layers }[] = [
  { key: "cartes", label: pioSays.cardsTab, icon: Layers },
  { key: "trophees", label: pioSays.trophiesTab, icon: Trophy },
];

function Treasures() {
  const params = useSearchParams();
  const router = useRouter();
  const tab: TabKey = params.get("onglet") === "trophees" ? "trophees" : "cartes";
  const cards = useCardAlbum();

  function select(next: TabKey) {
    if (next === tab) return;
    router.replace(next === "cartes" ? "/student/tresors" : "/student/tresors?onglet=trophees", {
      scroll: false,
    });
  }

  return (
    <div className="space-y-5 px-4 pt-4 sm:px-0 sm:pt-6">
      <h1 className="font-display text-3xl font-extrabold text-amber-950">{pioSays.treasuresTitle}</h1>

      <div className="grid grid-cols-2 gap-3" role="tablist" aria-label={pioSays.treasuresTitle}>
        {TABS.map((item) => {
          const active = item.key === tab;
          return (
            <button
              key={item.key}
              type="button"
              role="tab"
              id={`onglet-${item.key}`}
              aria-selected={active}
              aria-controls={`panneau-${item.key}`}
              onClick={() => select(item.key)}
              style={{ "--btn-depth": active ? "#9a3412" : "#d6c39a" } as React.CSSProperties}
              className={`btn-chunky gk-focus flex min-h-14 items-center justify-center gap-2 rounded-2xl border-[3px] font-display text-lg font-extrabold ${
                active
                  ? "border-white bg-[linear-gradient(180deg,#f97316_0%,#c2410c_100%)] text-white [text-shadow:0_1px_0_rgb(0_0_0_/_0.25)]"
                  : "border-amber-200 bg-[#fff8e6] text-amber-900"
              }`}
            >
              <item.icon className="h-5 w-5" aria-hidden />
              {item.label}
            </button>
          );
        })}
      </div>

      <div role="tabpanel" id={`panneau-${tab}`} aria-labelledby={`onglet-${tab}`}>
        {tab === "trophees" ? (
          <TrophyRoom />
        ) : cards === undefined ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
            <Pio state="think" size={150} />
            <p className="font-display text-lg font-bold text-amber-900">J&apos;ouvre l&apos;album...</p>
          </div>
        ) : cards === null ? (
          <div className="flex flex-col items-center gap-3 rounded-3xl border-2 border-dashed border-amber-300 bg-white/70 p-8 text-center">
            <Pio state="idle" size={140} />
            <p className="font-display text-base font-bold text-amber-900">
              {kidMessages.offline.treasuresOnline}
            </p>
          </div>
        ) : (
          <CardAlbum owned={cards} />
        )}
      </div>
    </div>
  );
}

export default function StudentTreasuresPage() {
  return (
    <Suspense fallback={null}>
      <Treasures />
    </Suspense>
  );
}
