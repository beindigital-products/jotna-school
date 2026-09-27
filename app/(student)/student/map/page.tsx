"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Pio } from "@/components/student/pio";
import { BiomeMedallion } from "@/components/student/world/biome-medallion";
import { GameMap, type MapNodeContext } from "@/components/student/world/game-map";
import { WORLD_TRAIL } from "@/components/student/world/trail-geometry";
import { pioSays } from "@/lib/pioCopy";

/**
 * LA CARTE DU MONDE — chaque matière est une zone de la savane, le long
 * d'un sentier serpentin, dans une carte qu'on pince, qu'on fait glisser,
 * et sur laquelle Pio MARCHE.
 *
 * Toucher un monde ne l'ouvre pas tout de suite : Pio part de là où il est,
 * suit le sentier jusqu'au monde touché, le salue, et c'est alors que la
 * page s'ouvre. La marche est courte (moins de deux secondes et demie, voir
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

const MEDALLION = 128;

export default function WorldMapPage() {
  const zones = useQuery(api.students.getMyWorldMap);
  const router = useRouter();
  const [remembered] = useState(rememberedIndex);

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
    // Les étapes d'un monde sont ses paliers : c'est ce que le sentier montre.
    const pct =
      zone.totalPaliers > 0
        ? Math.round((zone.completedPaliers / zone.totalPaliers) * 100)
        : 0;
    const fresh = zone.completedPaliers === 0 && zone.startedTopics === 0;

    return (
      <div
        key={zone._id}
        className="absolute z-10"
        style={{ left: ctx.x, top: ctx.y, width: MEDALLION, height: MEDALLION, transform: "translate(-50%, -50%)" }}
      >
        <button
          type="button"
          onClick={ctx.walkTo}
          className="group relative block h-full w-full rounded-full transition-transform focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white active:scale-95"
          aria-label={`${zone.name} : ${zone.completedPaliers} étape${zone.completedPaliers > 1 ? "s" : ""} sur ${zone.totalPaliers}${ctx.isPioHere ? ", Pio est ici" : ""}`}
        >
          {/* Le nom du monde, sur une plaque au-dessus */}
          <span className="absolute -top-13 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border-[3px] border-white bg-amber-950 px-4 py-1.5 font-display text-[15px] font-extrabold text-white shadow-lg">
            {zone.name}
          </span>

          <span
            className={`block rounded-full ${
              ctx.isPioHere ? "ring-[5px] ring-white shadow-[0_0_0_10px_rgba(255,255,255,0.35)]" : ""
            }`}
          >
            <BiomeMedallion
              index={ctx.index}
              color={zone.color}
              icon={zone.icon}
              label={zone.name}
              progressPct={pct}
              size={MEDALLION}
              showLabel={false}
            />
          </span>

          {/* Le numéro du monde, en haut à droite : Pio se tient en bas à gauche */}
          <span
            aria-hidden
            className="absolute -right-1 -top-1 flex h-9 w-9 items-center justify-center rounded-full border-[3px] border-white bg-amber-900 font-display text-base font-extrabold text-white shadow"
          >
            {ctx.index + 1}
          </span>

          {/* La progression, sous le médaillon */}
          <span
            aria-hidden
            className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border-2 border-amber-900/15 bg-white px-3 py-1 font-display text-xs font-extrabold text-amber-950 shadow-md"
          >
            {fresh ? pioSays.zoneNew : `${zone.completedPaliers}/${zone.totalPaliers} étapes`}
          </span>
        </button>
      </div>
    );
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
    <GameMap
      layout={WORLD_TRAIL}
      count={count}
      initialPioIndex={pioStart}
      currentIndex={currentIndex}
      onArrive={onArrive}
      poseAt={poseAt}
      renderNode={renderNode}
      pioSize={104}
      className="h-[calc(100dvh-16rem)] min-h-[440px] sm:mt-1 sm:h-[calc(100dvh-11rem)] sm:max-h-[880px] sm:rounded-[2rem] sm:shadow-2xl"
      hud={
        <div className="pointer-events-none absolute left-3 top-3 z-20 max-w-[calc(100%-5rem)]">
          <div className="rounded-2xl border-[3px] border-white bg-amber-950/85 px-4 py-2 text-white shadow-lg backdrop-blur-sm">
            <h1 className="font-display text-xl font-extrabold leading-tight sm:text-2xl">
              {pioSays.mapTitle}
            </h1>
            <p className="font-display text-xs font-bold text-amber-100 sm:text-sm">
              {pioSays.mapTap}
            </p>
          </div>
        </div>
      }
    />
  );
}
