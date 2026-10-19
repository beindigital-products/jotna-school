import { Easing, interpolate, spring } from "remotion";
import { FPS } from "../theme";

// Courbes partagées. `OUT` est celle des formes de la landing (elegant-shape.tsx).
export const OUT = Easing.bezier(0.23, 0.86, 0.39, 0.96);
export const SNAP = Easing.bezier(0.22, 1, 0.36, 1);
export const IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);
export const IN = Easing.bezier(0.55, 0, 1, 0.45);

/** Secondes vers images. */
export const s = (seconds: number) => Math.round(seconds * FPS);

/** Interpolation bornée entre deux images, avec courbe. */
export const tween = (
  frame: number,
  start: number,
  duration: number,
  from: number,
  to: number,
  easing: (t: number) => number = SNAP,
) =>
  interpolate(frame, [start, start + Math.max(1, duration)], [from, to], {
    easing,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

/** Progression 0 → 1 entre `start` et `start + duration`. */
export const progress = (
  frame: number,
  start: number,
  duration: number,
  easing: (t: number) => number = SNAP,
) => tween(frame, start, duration, 0, 1, easing);

export const SPRING = {
  smooth: { damping: 200 },
  snappy: { damping: 20, stiffness: 200 },
  pop: { damping: 12, stiffness: 180, mass: 0.8 },
  soft: { damping: 16, stiffness: 90 },
} as const;

export const pop = (
  frame: number,
  delay: number,
  config: { damping?: number; stiffness?: number; mass?: number } = SPRING.pop,
) => spring({ frame: frame - delay, fps: FPS, config });

/** Apparition « monte et s'éclaire » : style prêt à poser. */
export const rise = (frame: number, delay: number, distance = 28, duration = 18) => {
  const p = progress(frame, delay, duration);
  return {
    opacity: p,
    transform: `translateY(${(1 - p) * distance}px)`,
  } as const;
};

/** Disparition en fin de plan. */
export const fadeOutAt = (frame: number, start: number, duration = 10) =>
  1 - progress(frame, start, duration, IN_OUT);

/** Compteur qui défile jusqu'à `value`. */
export const countUp = (frame: number, start: number, duration: number, value: number) =>
  Math.round(tween(frame, start, duration, 0, value, Easing.out(Easing.cubic)));

/** Petit flottement continu (en px), pour les cartes posées. */
export const drift = (frame: number, amplitude = 6, period = 4, phase = 0) =>
  Math.sin(((frame / FPS) * Math.PI * 2) / period + phase) * amplitude;

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
