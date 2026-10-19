import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";

export const WIPE_FRAMES = 26;
/** Image de la transition où l'écran est entièrement couvert : on coupe là. */
export const WIPE_CUT = 13;

const STRIPE = 150;
const SLAB = 3800;
const STRIPES = ["#fcd34d", "#fb923c", "#a3e635"];

/**
 * Passage d'un plan à l'autre : une large pilule crème bordée des bandes
 * ambre, orange et citron vert balaie l'écran en diagonale. Elle couvre
 * tout l'écran autour de l'image `WIPE_CUT`, où le plan change.
 */
export const BrandWipe: React.FC = () => {
  const frame = useCurrentFrame();
  const total = STRIPE * STRIPES.length * 2 + SLAB;
  const center = interpolate(frame, [0, WIPE_CUT * 2], [-3200, 1920 + 3200], {
    easing: Easing.inOut(Easing.sin),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const order = [...STRIPES, null, ...[...STRIPES].reverse()];
  return (
    <AbsoluteFill style={{ overflow: "hidden", pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: center - total / 2,
          top: 540 - 1700,
          width: total,
          height: 3400,
          display: "flex",
          transform: "rotate(-24deg)",
          transformOrigin: "50% 50%",
        }}
      >
        {order.map((c, i) =>
          c === null ? (
            <div
              key={i}
              style={{
                width: SLAB,
                height: "100%",
                background: "linear-gradient(90deg, #fffbeb, #ffffff 40%, #fff7ed)",
              }}
            />
          ) : (
            <div key={i} style={{ width: STRIPE, height: "100%", background: c }} />
          ),
        )}
      </div>
    </AbsoluteFill>
  );
};
