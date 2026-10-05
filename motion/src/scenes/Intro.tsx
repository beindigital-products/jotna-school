import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { Flame, GraduationCap, Heart, School, Smartphone, Trophy } from "lucide-react";
import { C, FONT } from "../theme";
import { pop, progress, tween } from "../lib/anim";
import { Backdrop } from "../components/backdrop";
import { Pio } from "../components/pio";
import { PopIn } from "../components/ui";
import { VoiceCues } from "../voice";

// Les trois mots du titre de la landing (components/landing/hero.tsx).
const WORDS = [
  { text: "un jeu", color: "rgba(255,210,48,0.8)", at: 30 },
  { text: "une aventure", color: "rgba(187,244,81,0.8)", at: 72 },
  { text: "un réflexe", color: "rgba(255,184,106,0.8)", at: 114 },
];

const SIZE = 96;

const RotatingWord: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "relative", height: SIZE * 1.12, perspective: 600 }}>
      {WORDS.map((w, i) => {
        const next = WORDS[i + 1];
        const p = progress(frame, w.at, 12);
        const q = next ? progress(frame, next.at - 9, 9) : 0;
        if (p <= 0 || q >= 1) return null;
        const marker = progress(frame, w.at + 6, 14);
        return (
          <div
            key={w.text}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              whiteSpace: "nowrap",
              opacity: p * (1 - q),
              transform: `translateY(${(1 - p) * 0.25 * SIZE - q * 0.25 * SIZE}px) rotateX(${(1 - p) * -35 + q * 35}deg)`,
              transformOrigin: "50% 60%",
            }}
          >
            <span style={{ position: "relative", display: "inline-block" }}>
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: SIZE * 0.06,
                  height: SIZE * 0.22,
                  borderRadius: SIZE,
                  background: w.color,
                  transform: `scaleX(${marker})`,
                  transformOrigin: "left center",
                }}
              />
              <span style={{ position: "relative" }}>{w.text}</span>
            </span>
            <span>.</span>
          </div>
        );
      })}
    </div>
  );
};

const ROLES = [
  { label: "L'école", icon: School, bg: C.orange100, fg: C.orange600 },
  { label: "Les professeurs", icon: GraduationCap, bg: C.amber100, fg: C.amber700 },
  { label: "Les parents", icon: Heart, bg: C.lime100, fg: C.lime600 },
  { label: "Les élèves · app iOS et Android", icon: Smartphone, bg: C.sky100, fg: C.sky600 },
];

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const logo = pop(frame, 4, { damping: 13, stiffness: 120 });
  const pioIn = progress(frame, 14, 24);
  const line1 = progress(frame, 20, 18);
  const glow = tween(frame, 10, 40, 0.4, 1);
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <Backdrop tone="warm" />
      <div
        style={{
          position: "absolute",
          left: 1000,
          top: 180,
          width: 900,
          height: 900,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,210,48,0.45), rgba(255,184,106,0.18) 45%, rgba(255,255,255,0) 70%)",
          transform: `scale(${glow})`,
        }}
      />
      <Img
        src={staticFile("app/jotna-logo.png")}
        style={{
          position: "absolute",
          left: 150,
          top: 96,
          width: 400,
          transform: `scale(${0.7 + 0.3 * logo}) rotate(${(1 - logo) * -6}deg)`,
          transformOrigin: "20% 60%",
          opacity: progress(frame, 4, 8),
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 150,
          top: 400,
          fontSize: SIZE,
          fontWeight: 800,
          letterSpacing: "-0.035em",
          lineHeight: 1.06,
          color: C.ink,
        }}
      >
        <div style={{ opacity: line1, transform: `translateY(${(1 - line1) * 30}px)` }}>Apprendre devient</div>
        <RotatingWord />
      </div>
      <div
        style={{
          position: "absolute",
          left: 154,
          top: 660,
          width: 960,
          fontSize: 28,
          lineHeight: 1.5,
          color: C.body,
          opacity: progress(frame, 92, 18),
          transform: `translateY(${(1 - progress(frame, 92, 18)) * 16}px)`,
        }}
      >
        Jotna School relie l'école, les professeurs, les parents et les élèves.
      </div>
      <div style={{ position: "absolute", left: 150, top: 790, display: "flex", gap: 14 }}>
        {ROLES.map((r, i) => {
          const Icon = r.icon;
          return (
            <PopIn key={r.label} at={104 + i * 6} from={0.7}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 18px 10px 10px",
                  borderRadius: 999,
                  background: "#fff",
                  border: `1px solid ${C.line2}`,
                  boxShadow: "0 8px 24px -12px rgba(17,24,39,0.25)",
                  fontSize: 21,
                  fontWeight: 600,
                  color: C.ink,
                }}
              >
                <span
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 19,
                    background: r.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon size={20} color={r.fg} strokeWidth={2.2} />
                </span>
                {r.label}
              </div>
            </PopIn>
          );
        })}
      </div>
      <div
        style={{
          position: "absolute",
          left: 1210,
          top: 290,
          opacity: pioIn,
          transform: `translateY(${(1 - pioIn) * 90}px)`,
        }}
      >
        <Pio pose="hello" height={820} />
      </div>
      <PopIn at={44} rotate={10} style={{ position: "absolute", left: 1530, top: 300 }}>
        <div
          style={{
            transform: "rotate(6deg)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 18px 12px 12px",
            borderRadius: 20,
            border: `1px solid ${C.amber200}`,
            background: "#fff",
            boxShadow: "0 18px 40px -16px rgba(17,24,39,0.35)",
          }}
        >
          <span style={{ width: 44, height: 44, borderRadius: 12, background: C.amber100, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Trophy size={24} color={C.amber600} />
          </span>
          <div>
            <div style={{ fontSize: 14, color: C.muted, fontWeight: 500 }}>Badge débloqué</div>
            <div style={{ fontSize: 20, color: C.ink, fontWeight: 700 }}>Petit matheux</div>
          </div>
        </div>
      </PopIn>
      <PopIn at={58} style={{ position: "absolute", left: 1090, top: 556 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 18px 12px 12px",
            borderRadius: 20,
            border: `1px solid ${C.line}`,
            background: "#fff",
            boxShadow: "0 18px 40px -16px rgba(17,24,39,0.35)",
          }}
        >
          <span style={{ width: 44, height: 44, borderRadius: 12, background: C.orange100, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Flame size={24} color={C.orange600} />
          </span>
          <div>
            <div style={{ fontSize: 14, color: C.muted, fontWeight: 500 }}>Série</div>
            <div style={{ fontSize: 20, color: C.ink, fontWeight: 700 }}>5 jours d'affilée</div>
          </div>
        </div>
      </PopIn>
      <VoiceCues scene="intro" />
    </AbsoluteFill>
  );
};
