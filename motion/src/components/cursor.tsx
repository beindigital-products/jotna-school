import React from "react";
import { Audio, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { IN_OUT, progress } from "../lib/anim";

export type CursorKey = { f: number; x: number; y: number };

type Props = {
  /** Positions clés (image, x, y) ; le pointeur glisse de l'une à l'autre. */
  path: CursorKey[];
  /** Images où le pointeur clique. */
  clicks?: number[];
  /** Apparition et disparition (images). */
  show?: [number, number];
  /** Doigt (cercle) pour le téléphone au lieu de la flèche. */
  touch?: boolean;
  scale?: number;
};

const positionAt = (frame: number, path: CursorKey[]) => {
  if (frame <= path[0].f) return path[0];
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];
    if (frame <= b.f) {
      const t = interpolate(frame, [a.f, b.f], [0, 1], { easing: IN_OUT });
      return { f: frame, x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    }
  }
  return path[path.length - 1];
};

/** Pointeur de souris (ou doigt) qui se déplace et clique, avec onde au clic. */
export const Cursor: React.FC<Props> = ({ path, clicks = [], show, touch = false, scale = 1 }) => {
  const frame = useCurrentFrame();
  const { x, y } = positionAt(frame, path);
  const visible = show
    ? Math.min(progress(frame, show[0], 8), 1 - progress(frame, show[1] - 8, 8))
    : 1;
  // Enfoncement bref à chaque clic.
  let press = 0;
  for (const c of clicks) {
    const d = frame - c;
    if (d >= -3 && d <= 6) press = Math.max(press, d < 0 ? (d + 3) / 3 : 1 - d / 6);
  }
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", pointerEvents: "none", opacity: visible }}>
      {clicks.map((c) => {
        const p = progress(frame, c, 18);
        if (frame < c || p >= 1) return null;
        const at = positionAt(c, path);
        const size = (touch ? 70 : 54) * scale;
        return (
          <div
            key={c}
            style={{
              position: "absolute",
              left: at.x - size / 2,
              top: at.y - size / 2,
              width: size,
              height: size,
              borderRadius: "50%",
              border: `${3 * scale}px solid rgba(249,115,22,${0.8 * (1 - p)})`,
              background: `rgba(251,191,36,${0.18 * (1 - p)})`,
              transform: `scale(${0.4 + p * 1.2})`,
            }}
          />
        );
      })}
      {touch ? (
        <div
          style={{
            position: "absolute",
            left: x - 26 * scale,
            top: y - 26 * scale,
            width: 52 * scale,
            height: 52 * scale,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.55)",
            border: `${2.5 * scale}px solid rgba(255,255,255,0.95)`,
            boxShadow: "0 6px 18px rgba(17,24,39,0.25)",
            transform: `scale(${1 - press * 0.22})`,
          }}
        />
      ) : (
        <svg
          width={34 * scale}
          height={40 * scale}
          viewBox="0 0 34 40"
          style={{
            position: "absolute",
            left: x - 4 * scale,
            top: y - 3 * scale,
            transform: `scale(${1 - press * 0.15})`,
            transformOrigin: "4px 3px",
            filter: "drop-shadow(0 4px 6px rgba(17,24,39,0.3))",
          }}
        >
          <path
            d="M4 3 L4 31 L11.5 24.5 L16.2 35.5 L21 33.4 L16.4 22.6 L26.5 22.6 Z"
            fill="#111827"
            stroke="#ffffff"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  );
};

/** Petit clic sonore à chaque image donnée (son synthétisé, public/sfx/click.wav). */
export const ClickSounds: React.FC<{ at: number[]; volume?: number }> = ({ at, volume = 0.3 }) => (
  <>
    {at.map((f) => (
      <Sequence key={f} from={f} durationInFrames={6} layout="none">
        <Audio src={staticFile("sfx/click.wav")} volume={volume} />
      </Sequence>
    ))}
  </>
);
