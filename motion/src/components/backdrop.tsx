import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C } from "../theme";
import { OUT, drift, progress, tween } from "../lib/anim";

type ShapeProps = {
  x: number;
  y: number;
  width: number;
  height: number;
  rotate: number;
  color: string;
  delay?: number;
  /** Décalage de phase du flottement, pour que les formes ne bougent pas ensemble. */
  phase?: number;
  /** Vitesse de la dérive horizontale lente (px par seconde). */
  slide?: number;
  opacity?: number;
};

/**
 * La forme « pilule » de la landing (components/landing/elegant-shape.tsx) :
 * un dégradé vers le transparent, un liseré blanc, un reflet au centre.
 * Elle tombe en tournant puis flotte doucement.
 */
export const ElegantShape: React.FC<ShapeProps> = ({
  x,
  y,
  width,
  height,
  rotate,
  color,
  delay = 0,
  phase = 0,
  slide = 0,
  opacity = 1,
}) => {
  const frame = useCurrentFrame();
  const enter = progress(frame, delay, 48, OUT);
  const fade = progress(frame, delay, 24);
  const fall = (1 - enter) * -150;
  const r = rotate - 15 * (1 - enter);
  const bob = drift(frame, 10, 7, phase);
  const dx = (frame / 30) * slide;
  return (
    <div
      style={{
        position: "absolute",
        left: x + dx,
        top: y + fall + bob,
        width,
        height,
        opacity: fade * opacity,
        transform: `rotate(${r}deg)`,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: height,
          background: `linear-gradient(90deg, ${color}, rgba(255,255,255,0))`,
          border: "2px solid rgba(255,255,255,0.45)",
          boxShadow: "0 8px 32px 0 rgba(255,200,80,0.18)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: height,
          background: "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.35), transparent 70%)",
        }}
      />
    </div>
  );
};

type BackdropProps = {
  /** Teinte dominante du halo central. */
  tone?: "warm" | "lime" | "sky" | "cream";
  shapes?: boolean;
  /** Décale l'entrée des formes (en images). */
  delay?: number;
  children?: React.ReactNode;
};

const HALOS: Record<NonNullable<BackdropProps["tone"]>, [string, string, string]> = {
  warm: ["rgba(253,230,138,0.75)", "rgba(254,215,170,0.6)", "rgba(217,249,157,0.55)"],
  lime: ["rgba(217,249,157,0.7)", "rgba(254,240,138,0.55)", "rgba(254,215,170,0.45)"],
  sky: ["rgba(186,230,253,0.65)", "rgba(254,240,138,0.45)", "rgba(217,249,157,0.45)"],
  cream: ["rgba(254,243,199,0.8)", "rgba(255,237,213,0.6)", "rgba(236,252,203,0.5)"],
};

/** Fond blanc chaud de la landing : halo flou, tache jaune, pilules en dérive. */
export const Backdrop: React.FC<BackdropProps> = ({ tone = "warm", shapes = true, delay = 0, children }) => {
  const frame = useCurrentFrame();
  const [a, b, c] = HALOS[tone];
  const breathe = 1 + Math.sin(frame / 45) * 0.04;
  const haloIn = tween(frame, delay, 30, 0.6, 1);
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: 960 - 560,
          top: -260,
          width: 1120,
          height: 1120,
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${a}, ${b} 50%, ${c})`,
          filter: "blur(110px)",
          transform: `scale(${breathe * haloIn})`,
          opacity: haloIn,
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 380,
          bottom: -200,
          width: 620,
          height: 620,
          borderRadius: "50%",
          background: "rgba(254,240,138,0.55)",
          filter: "blur(100px)",
          transform: `translateX(${Math.sin(frame / 60) * 40}px)`,
        }}
      />
      {shapes ? (
        <>
          <ElegantShape x={-140} y={150} width={640} height={160} rotate={12} color="rgba(251,191,36,0.42)" delay={delay + 4} phase={0} />
          <ElegantShape x={1430} y={700} width={500} height={130} rotate={-15} color="rgba(163,230,53,0.38)" delay={delay + 10} phase={1.4} />
          <ElegantShape x={180} y={900} width={340} height={92} rotate={-8} color="rgba(251,146,60,0.42)" delay={delay + 7} phase={2.1} />
          <ElegantShape x={1340} y={90} width={240} height={70} rotate={20} color="rgba(250,204,21,0.38)" delay={delay + 13} phase={3.3} />
        </>
      ) : null}
      {children}
    </AbsoluteFill>
  );
};
