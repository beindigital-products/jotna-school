"use client";

import { GameMap, type MapNodeContext } from "@/components/student/world/game-map";
import { useFrameSize } from "@/components/student/world/use-frame-size";
import { worldLayoutFor, worldTrailFor } from "@/components/student/world/trail-geometry";
import { WorldNode, worldNodeSizeFor, type WorldZone } from "@/components/student/world/world-node";
import { WorldMapTitle } from "@/components/student/world/world-map-title";

/** Les huit matières du programme, avec leurs couleurs de catalogue et une progression variée. */
const ZONES: readonly WorldZone[] = [
  { _id: "z1", name: "Mathématiques", color: "#4f46e5", icon: "Calculator", completedPaliers: 14, totalPaliers: 14, startedTopics: 4 },
  { _id: "z2", name: "Français", color: "#db2777", icon: "Book", completedPaliers: 9, totalPaliers: 16, startedTopics: 3 },
  { _id: "z3", name: "Éveil scientifique", color: "#10b981", icon: "Flask", completedPaliers: 3, totalPaliers: 12, startedTopics: 1 },
  { _id: "z4", name: "Histoire", color: "#f59e0b", icon: "History", completedPaliers: 0, totalPaliers: 8, startedTopics: 0 },
  { _id: "z5", name: "Géographie", color: "#0ea5e9", icon: "Globe", completedPaliers: 1, totalPaliers: 8, startedTopics: 1 },
  { _id: "z6", name: "Instruction civique", color: "#6b7280", icon: "Users", completedPaliers: 0, totalPaliers: 7, startedTopics: 0 },
  { _id: "z7", name: "Éducation artistique", color: "#8b5cf6", icon: "Palette", completedPaliers: 0, totalPaliers: 10, startedTopics: 0 },
  { _id: "z8", name: "Anglais", color: "#ef4444", icon: "Languages", completedPaliers: 5, totalPaliers: 9, startedTopics: 2 },
];

export function CarteDemo() {
  const [frameRef, frame] = useFrameSize();
  const { horizontal, compact } = frame
    ? worldLayoutFor(frame.w, frame.h, ZONES.length)
    : { horizontal: false, compact: false };
  const layout = worldTrailFor(horizontal, compact, ZONES.length, frame ?? undefined);

  function renderNode(ctx: MapNodeContext) {
    const zone = ZONES[ctx.index];
    return <WorldNode key={zone._id} zone={zone} ctx={ctx} size={worldNodeSizeFor(horizontal, compact)} />;
  }

  return (
    <div className="min-h-dvh bg-[linear-gradient(180deg,#bfe6fb_0%,#f9efd2_45%,#f6dfa4_100%)] p-0 sm:p-4">
      <div ref={frameRef} className="h-dvh sm:h-[calc(100dvh-2rem)]">
        {frame && (
          <GameMap
            key={`${horizontal}-${compact}-${layout.swing}`}
            layout={layout}
            count={ZONES.length}
            initialPioIndex={1}
            currentIndex={1}
            onArrive={() => {}}
            poseAt={(i) => (ZONES[i].completedPaliers >= ZONES[i].totalPaliers ? "cheer" : "hello")}
            renderNode={renderNode}
            pioSize={horizontal ? (compact ? 96 : 112) : 104}
            className="h-full sm:rounded-[2rem] sm:shadow-2xl"
            hud={<WorldMapTitle zones={ZONES} />}
          />
        )}
      </div>
    </div>
  );
}
