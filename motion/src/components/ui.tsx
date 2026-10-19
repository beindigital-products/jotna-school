import React from "react";
import { useCurrentFrame } from "remotion";
import { C, FONT, SHADOW } from "../theme";
import { pop, progress, tween } from "../lib/anim";

/** Carte blanche des tableaux de bord : `rounded-xl border border-gray-200 bg-white shadow-sm`. */
export const Card: React.FC<{ children: React.ReactNode; style?: React.CSSProperties; pad?: number }> = ({
  children,
  style,
  pad = 20,
}) => (
  <div
    style={{
      background: C.bg,
      borderRadius: 14,
      border: `1px solid ${C.line2}`,
      boxShadow: "0 1px 2px rgba(17,24,39,0.05)",
      padding: pad,
      ...style,
    }}
  >
    {children}
  </div>
);

export const Pill: React.FC<{
  children: React.ReactNode;
  bg: string;
  color: string;
  style?: React.CSSProperties;
  size?: number;
  dot?: string;
}> = ({ children, bg, color, style, size = 13, dot }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: `${size * 0.3}px ${size * 0.8}px`,
      borderRadius: 999,
      background: bg,
      color,
      fontSize: size,
      fontWeight: 600,
      whiteSpace: "nowrap",
      fontFamily: FONT,
      ...style,
    }}
  >
    {dot ? <span style={{ width: size * 0.45, height: size * 0.45, borderRadius: 9, background: dot }} /> : null}
    {children}
  </span>
);

/** Barre de progression qui se remplit entre `start` et `start + duration`. */
export const Bar: React.FC<{
  value: number;
  start: number;
  duration?: number;
  height?: number;
  track?: string;
  fill: string;
  style?: React.CSSProperties;
  from?: number;
}> = ({ value, start, duration = 30, height = 8, track = C.line, fill, style, from = 0 }) => {
  const frame = useCurrentFrame();
  const w = tween(frame, start, duration, from, value);
  return (
    <div style={{ height, borderRadius: height, background: track, overflow: "hidden", ...style }}>
      <div style={{ width: `${w}%`, height: "100%", borderRadius: height, background: fill }} />
    </div>
  );
};

/** Avatar rond à initiales sur dégradé, comme `UserMenu` et les listes d'élèves. */
export const Avatar: React.FC<{ name: string; size?: number; from?: string; to?: string; style?: React.CSSProperties }> = ({
  name,
  size = 36,
  from = "#818cf8",
  to = "#2dd4bf",
  style,
}) => {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size,
        background: `linear-gradient(135deg, ${from}, ${to})`,
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: size * 0.38,
        fontFamily: FONT,
        flexShrink: 0,
        ...style,
      }}
    >
      {initials}
    </div>
  );
};

/** Carré d'icône teinté (bg-amber-100 text-amber-700, etc.). */
export const IconTile: React.FC<{ children: React.ReactNode; bg: string; color: string; size?: number; radius?: number; style?: React.CSSProperties }> = ({
  children,
  bg,
  color,
  size = 40,
  radius = 10,
  style,
}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: radius,
      background: bg,
      color,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      ...style,
    }}
  >
    {children}
  </div>
);

/** Élément qui surgit avec un ressort (badge débloqué, notification…). */
export const PopIn: React.FC<{
  at: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
  from?: number;
  rotate?: number;
  origin?: string;
}> = ({ at, children, style, from = 0.6, rotate = 0, origin = "50% 50%" }) => {
  const frame = useCurrentFrame();
  const p = pop(frame, at);
  const o = progress(frame, at, 8);
  return (
    <div
      style={{
        opacity: o,
        transform: `scale(${from + (1 - from) * p}) rotate(${rotate * (1 - p)}deg)`,
        transformOrigin: origin,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** Apparition en fondu montant pour un bloc d'interface. */
export const Reveal: React.FC<{ at: number; children: React.ReactNode; style?: React.CSSProperties; dy?: number; dx?: number; duration?: number }> = ({
  at,
  children,
  style,
  dy = 16,
  dx = 0,
  duration = 14,
}) => {
  const frame = useCurrentFrame();
  const p = progress(frame, at, duration);
  return (
    <div style={{ opacity: p, transform: `translate(${(1 - p) * dx}px, ${(1 - p) * dy}px)`, ...style }}>{children}</div>
  );
};

/** Texte qui se tape caractère par caractère. */
export const Typed: React.FC<{ text: string; start: number; cps?: number; caret?: boolean; style?: React.CSSProperties }> = ({
  text,
  start,
  cps = 28,
  caret = true,
  style,
}) => {
  const frame = useCurrentFrame();
  const n = Math.max(0, Math.min(text.length, Math.floor(((frame - start) / 30) * cps)));
  const typing = frame >= start && n < text.length;
  const blink = Math.floor(frame / 15) % 2 === 0;
  return (
    <span style={{ whiteSpace: "pre", ...style }}>
      {text.slice(0, n)}
      {caret && (typing || (frame >= start && blink)) ? (
        <span style={{ display: "inline-block", width: 2, height: "1.1em", background: C.ink, verticalAlign: "text-bottom", marginLeft: 1 }} />
      ) : null}
    </span>
  );
};

export const floatShadow = SHADOW.float;
