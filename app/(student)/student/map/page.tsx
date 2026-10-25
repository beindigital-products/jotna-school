"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useWorldMap } from "@/hooks/use-student-data";
import { Pio } from "@/components/student/pio";
import { GameMap, type MapNodeContext } from "@/components/student/world/game-map";
import { useFrameSize } from "@/components/student/world/use-frame-size";
import { worldLayoutFor, worldTrailFor } from "@/components/student/world/trail-geometry";
import { WorldNode, worldNodeSizeFor } from "@/components/student/world/world-node";
import { WorldMapTitle } from "@/components/student/world/world-map-title";

/**
 * LA CARTE DU MONDE — chaque matière est une zone de la savane, le long
 * d'un sentier serpentin, dans une carte qu'on pince, qu'on fait glisser,
 * et sur laquelle Pio MARCHE.
 *
 * Toucher un monde ne l'ouvre pas tout de suite : Pio part de là où il est,
 * suit le sentier jusqu'au monde touché, le salue, et c'est alors que la
 * page s'ouvre. Il marche au rythme de ses pas, six secondes au plus (voir
 * `walkDuration`) : c'est un plaisir, pas une attente.
 *
 * Entièrement pilotée par les données : n'importe quel nombre de mondes tient,
 * et l'ordre est celui du catalogue. Un monde ne se verrouille pas — l'ordre
 * est une suggestion, pas une barrière (§5 de la conception de juillet).
 *
 * PIO SE SOUVIENT D'OÙ IL ÉTAIT. Le dernier monde atteint est gardé pour la
 * session : quand l'enfant revient du sentier d'une matière, Pio est encore
 * devant cette matière, pas téléporté au premier monde non fini.
 */
const MEMORY_KEY = "jotna.pio.map";

function rememberedIndex(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(MEMORY_KEY);
    const n = raw === null ? Number.NaN : Number(raw);
    return Number.isInteger(n) && n >= 0 ? n : null;
  } catch {
    return null;
  }
}

function remember(index: number) {
  try {
    sessionStorage.setItem(MEMORY_KEY, String(index));
  } catch {
    // Stockage indisponible : Pio repartira du monde en cours, et c'est bien.
  }
}

/** Le temps de saluer avant d'ouvrir le monde. */
const GREETING_MS = 420;

export default function WorldMapPage() {
  // Calculée sur l'appareil : la carte s'ouvre et avance sans réseau.
  const zones = useWorldMap();
  const router = useRouter();
  const [remembered] = useState(rememberedIndex);
  const [frameRef, frame] = useFrameSize();

  useEffect(() => {
    router.prefetch("/student/subjects");
  }, [router]);

  const count = zones?.length ?? 0;
  const currentIndex =
    zones && zones.length > 0
      ? Math.max(
          0,
          zones.findIndex((z) => z.completedTopics < z.totalTopics),
        )
      : null;
  // Un cadre large pose les mondes en serpentin ; un téléphone garde le sentier vertical.
  const { horizontal, compact } = frame
    ? worldLayoutFor(frame.w, frame.h, count)
    : { horizontal: false, compact: false };
  const layout = worldTrailFor(horizontal, compact, count, frame ?? undefined);

  const pioStart =
    remembered !== null && remembered < count ? remembered : (currentIndex ?? 0);

  function onArrive(index: number) {
    const zone = zones?.[index];
    if (!zone) return;
    remember(index);
    window.setTimeout(() => router.push(`/student/subjects?id=${zone._id}`), GREETING_MS);
  }

  function poseAt(index: number) {
    const zone = zones?.[index];
    return zone && zone.totalTopics > 0 && zone.completedTopics >= zone.totalTopics
      ? "cheer"
      : "hello";
  }

  function renderNode(ctx: MapNodeContext) {
    const zone = zones![ctx.index];
    return <WorldNode key={zone._id} zone={zone} ctx={ctx} size={worldNodeSizeFor(horizontal, compact)} />;
  }

  if (zones === undefined) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Pio state="think" size={160} />
      </div>
    );
  }

  if (!zones || zones.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <Pio state="think" size={160} />
        <p className="font-display text-xl font-extrabold text-amber-950">
          La carte est encore vierge.
        </p>
        <p className="font-display text-sm font-bold text-amber-900/70">
          Ton école prépare les premiers mondes.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={frameRef}
      className="h-[calc(100dvh-16rem)] min-h-[440px] sm:mt-1 sm:h-[calc(100dvh-11rem)] sm:max-h-[880px] [@media(max-height:500px)]:h-[calc(100dvh-4.5rem)] [@media(max-height:500px)]:min-h-0"
    >
      {frame && (
        <GameMap
          key={`${horizontal}-${compact}-${layout.swing}`}
          layout={layout}
          count={count}
          initialPioIndex={pioStart}
          currentIndex={currentIndex}
          onArrive={onArrive}
          poseAt={poseAt}
          renderNode={renderNode}
          pioSize={horizontal ? (compact ? 96 : 112) : 104}
          className="h-full sm:rounded-[2rem] sm:shadow-2xl"
          hud={<WorldMapTitle zones={zones} />}
        />
      )}
    </div>
  );
}
