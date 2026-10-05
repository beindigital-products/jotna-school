import React from "react";
import { Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { ArrowLeft, Check, Flag, Lock, Map as MapIcon, NotebookPen, Play, Star, Tent, Trophy, Volume2, X } from "lucide-react";
import { ARABIC, C, DISPLAY, FONT } from "../theme";
import { OUT, pop, progress, tween } from "../lib/anim";
import { Pio } from "../components/pio";

// Écran en points iOS (390 × 844) ; zones sûres du haut et du bas.
export const PW = 390;
export const PH = 844;
const SAFE_TOP = 47;
const HEADER_H = SAFE_TOP + 64;
const NAV_H = 110;

const AMBER_950 = "#461901";
const CREAM = "#fff7e0";

const chunky = (depth: string) => `0 6px 0 0 ${depth}, 0 12px 20px -10px rgba(0,0,0,0.45)`;

const textOutline = "0 2px 0 rgba(70,25,1,0.55), 0 0 6px rgba(70,25,1,0.35)";

// Générateur pseudo-aléatoire déterministe (même rendu à chaque image).
const rand = (seed: number) => {
  let t = seed + 0x6d2b79f5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/* ───────────── Coque : en-tête, pastille de niveau, barre du bas ───────────── */

const LevelPill: React.FC<{ level: number; count: number }> = ({ level, count }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 7,
      padding: "3px 12px 3px 3px",
      borderRadius: 999,
      background: "linear-gradient(90deg, #ffb900, #ff6900)",
      border: "2px solid #fff",
      boxShadow: "0 4px 10px -4px rgba(180,83,9,0.6)",
      fontFamily: DISPLAY,
    }}
  >
    <div style={{ width: 32, height: 32, borderRadius: 16, background: "#fff", color: C.orange600, fontWeight: 700, fontSize: 17, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {level}
    </div>
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#fff", letterSpacing: "0.08em" }}>NIVEAU</div>
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <div style={{ width: 52, height: 6, borderRadius: 6, background: "rgba(0,0,0,0.25)", overflow: "hidden" }}>
          <div style={{ width: `${(count / 50) * 100}%`, height: "100%", background: C.lime300 }} />
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>{count}/50</span>
      </div>
    </div>
  </div>
);

export const AppHeader: React.FC<{ level?: number; count?: number }> = ({ level = 3, count = 38 }) => (
  <div
    style={{
      position: "absolute",
      top: 0,
      left: 0,
      width: PW,
      height: HEADER_H,
      background: "rgba(255,247,224,0.93)",
      borderBottom: "1px solid rgba(254,230,133,0.7)",
      zIndex: 20,
    }}
  >
    <Img src={staticFile("app/jotna-logo.png")} style={{ position: "absolute", left: 14, top: SAFE_TOP + 6, height: 52 }} />
    <div style={{ position: "absolute", right: 14, top: SAFE_TOP + 12 }}>
      <LevelPill level={level} count={count} />
    </div>
  </div>
);

const NAV = [
  { label: "Camp", icon: Tent },
  { label: "Carte", icon: MapIcon },
  { label: "Trophées", icon: Trophy },
  { label: "Carnet", icon: NotebookPen },
];

export const BottomNav: React.FC<{ active: number }> = ({ active }) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      bottom: 0,
      width: PW,
      height: NAV_H,
      background: "rgba(255,247,224,0.97)",
      borderTop: "2px solid rgba(255,210,48,0.7)",
      display: "flex",
      justifyContent: "space-around",
      paddingTop: 8,
      zIndex: 20,
      fontFamily: DISPLAY,
    }}
  >
    {NAV.map((n, i) => {
      const on = i === active;
      const Icon = n.icon;
      return (
        <div key={n.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, width: 80 }}>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: on ? "translateY(-8px)" : "none",
              background: on ? "linear-gradient(160deg, #ffd230, #ff6900)" : "transparent",
              boxShadow: on ? "0 0 0 4px #fff, 0 10px 18px -6px rgba(255,105,0,0.7)" : "none",
            }}
          >
            <Icon size={24} color={on ? "#fff" : "rgba(123,51,6,0.6)"} strokeWidth={2.4} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: on ? C.orange700 : "rgba(123,51,6,0.6)", marginTop: on ? -6 : 0 }}>{n.label}</span>
        </div>
      );
    })}
  </div>
);

const SpeechBubble: React.FC<{ children: React.ReactNode; style?: React.CSSProperties; border?: string; tail?: "down" | "left" }> = ({
  children,
  style,
  border = C.amber200,
  tail = "down",
}) => (
  <div
    style={{
      position: "absolute",
      background: "#fff",
      borderRadius: 22,
      border: `2px solid ${border}`,
      padding: "10px 14px",
      fontFamily: DISPLAY,
      fontWeight: 700,
      fontSize: 16,
      lineHeight: 1.3,
      color: AMBER_950,
      boxShadow: "0 10px 20px -10px rgba(70,25,1,0.45)",
      ...style,
    }}
  >
    {children}
    <div
      style={
        tail === "down"
          ? { position: "absolute", left: "50%", bottom: -9, width: 16, height: 16, background: "#fff", borderRight: `2px solid ${border}`, borderBottom: `2px solid ${border}`, transform: "translateX(-50%) rotate(45deg)" }
          : { position: "absolute", left: -9, top: 18, width: 16, height: 16, background: "#fff", borderLeft: `2px solid ${border}`, borderBottom: `2px solid ${border}`, transform: "rotate(45deg)" }
      }
    />
  </div>
);

const GameButton: React.FC<{ children: React.ReactNode; tone?: "orange" | "green"; style?: React.CSSProperties; pressed?: number }> = ({
  children,
  tone = "orange",
  style,
  pressed = 0,
}) => {
  const [g, depth] = tone === "orange" ? ["linear-gradient(180deg, #ffb900, #ff6900)", "#b45309"] : ["linear-gradient(180deg, #9ae600, #16a34a)", "#166534"];
  return (
    <div
      style={{
        height: 56,
        borderRadius: 18,
        background: g,
        boxShadow: pressed ? `0 1px 0 0 ${depth}` : chunky(depth),
        transform: `translateY(${pressed * 5}px)`,
        color: "#fff",
        fontFamily: DISPLAY,
        fontWeight: 700,
        fontSize: 19,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        textShadow: "0 1px 0 rgba(0,0,0,0.2)",
        ...style,
      }}
    >
      {children}
    </div>
  );
};

const pressAt = (frame: number, at: number) => {
  const d = frame - at;
  return d >= 0 && d <= 6 ? 1 - d / 6 : 0;
};

/* ───────────── Lancement ───────────── */

export const SplashScreen: React.FC = () => (
  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, #9ddcfa, #cad0a6 55%, #f6c453)" }}>
    <Img src={staticFile("app/jotna-logo.png")} style={{ position: "absolute", left: (PW - 250) / 2, top: 170, width: 250 }} />
    <div style={{ position: "absolute", left: (PW - 214) / 2, top: 420 }}>
      <Pio pose="hello" height={380} still />
    </div>
  </div>
);

/* ───────────── Le Camp ───────────── */

export const CampScreen: React.FC<{ tapAt: number }> = ({ tapAt }) => {
  const frame = useCurrentFrame();
  const bubble = progress(frame, 10, 12);
  const medal = pop(frame, 14);
  const heroTop = HEADER_H;
  const heroH = 560;
  return (
    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,#bfe6fb 0%,#f9efd2 45%,#f6dfa4 100%)", fontFamily: DISPLAY }}>
      <div style={{ position: "absolute", left: 0, top: heroTop, width: PW, height: heroH, overflow: "hidden" }}>
        <Img src={staticFile("app/images/world/hub-savanna-portrait.jpg")} style={{ position: "absolute", left: 0, top: -120, width: PW, height: (PW * 1844) / 853 }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(123,51,6,0.38))" }} />
      </div>
      <SpeechBubble style={{ left: 40, right: 40, top: heroTop + 108, textAlign: "center", opacity: bubble, transform: `translateY(${(1 - bubble) * 10}px)` }}>
        Bienvenue au camp, Awa ! Choisis un monde, on part explorer.
      </SpeechBubble>
      <div style={{ position: "absolute", left: (PW - 153) / 2, top: heroTop + heroH - 286, filter: "drop-shadow(0 18px 22px rgba(60,30,0,0.45))" }}>
        <Pio pose="hello" height={272} />
      </div>
      <div style={{ position: "absolute", left: 286, top: heroTop + heroH * 0.38, display: "flex", flexDirection: "column", alignItems: "center", transform: `scale(${medal}) translateY(${Math.sin(frame / 15) * 5}px)` }}>
        <div style={{ position: "absolute", top: -14, width: 98, height: 98, borderRadius: 49, background: "radial-gradient(circle, rgba(255,210,48,0.55), rgba(255,210,48,0) 70%)", transform: `scale(${1 + Math.sin(frame / 12.4) * 0.08})` }} />
        <Img
          src={staticFile("app/images/coran/medallion.jpg")}
          style={{ width: 70, height: 70, borderRadius: 35, border: "4px solid #fff", boxShadow: `0 5px 0 0 #15803d, 0 10px 16px -6px rgba(0,0,0,0.5)`, position: "relative" }}
        />
        <div style={{ marginTop: 8, fontSize: 13, fontWeight: 700, color: "#fff", textShadow: textOutline, whiteSpace: "nowrap", position: "relative" }}>Arabe & Coran</div>
      </div>
      <GameButton style={{ position: "absolute", left: 16, right: 16, top: heroTop + heroH - 118 }} pressed={pressAt(frame, tapAt)}>
        <Play size={20} fill="#fff" /> Continuer l'aventure
      </GameButton>
      <div style={{ position: "absolute", left: 0, right: 0, top: heroTop + heroH - 50, textAlign: "center", color: "#fff", fontSize: 14, fontWeight: 600, textShadow: textOutline }}>
        Mathématiques · Les fractions
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: heroTop + heroH - 27, display: "flex", justifyContent: "center", alignItems: "center", gap: 6, color: "#fff", fontSize: 13, fontWeight: 700, textShadow: textOutline }}>
        <MapIcon size={14} /> Voir la carte du monde
      </div>
      <div
        style={{
          position: "absolute",
          left: 12,
          right: 12,
          top: heroTop + heroH + 12,
          height: 160,
          borderRadius: 22,
          border: "4px solid rgba(180,83,9,0.7)",
          background: "repeating-linear-gradient(180deg, rgba(0,0,0,0.05) 0 2px, rgba(0,0,0,0) 2px 14px), linear-gradient(180deg, #c98240, #a5602c)",
          padding: "12px 14px",
          display: "flex",
          alignItems: "flex-start",
          gap: 8,
          color: "#fff",
          fontSize: 16,
          fontWeight: 700,
        }}
      >
        <span style={{ color: "#fde047" }}>📜</span> Mes missions du jour
        <span style={{ marginLeft: "auto", fontSize: 13, background: "rgba(255,255,255,0.25)", borderRadius: 999, padding: "2px 10px" }}>0/3</span>
      </div>
      <AppHeader />
      <BottomNav active={0} />
    </div>
  );
};

/* ───────────── Le sentier des paliers ───────────── */

const S = PW / 420;
const swingX = (i: number) => 210 + (i % 2 === 0 ? -1 : 1) * 92 * (0.82 + 0.18 * Math.abs(Math.sin(1.3 * i)));
const NODES = [0, 1, 2, 3, 4].map((i) => ({ x: swingX(i), y: 200 + i * 160 }));
const TREASURE = { x: 210, y: 200 + 5 * 160 };

const bezier = (a: { x: number; y: number }, b: { x: number; y: number }, t: number) => {
  const my = (a.y + b.y) / 2;
  const p = [a, { x: a.x, y: my }, { x: b.x, y: my }, b];
  const u = 1 - t;
  return {
    x: u * u * u * p[0].x + 3 * u * u * t * p[1].x + 3 * u * t * t * p[2].x + t * t * t * p[3].x,
    y: u * u * u * p[0].y + 3 * u * u * t * p[1].y + 3 * u * t * t * p[2].y + t * t * t * p[3].y,
  };
};

const pathD = (pts: { x: number; y: number }[]) =>
  pts.reduce((d, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const a = pts[i - 1];
    const my = (a.y + p.y) / 2;
    return `${d} C ${a.x} ${my}, ${p.x} ${my}, ${p.x} ${p.y}`;
  }, "");

type NodeState = "completed" | "in_progress" | "locked";

const TrailNode: React.FC<{ x: number; y: number; n: number; state: NodeState; stars?: number; glyph?: string; selected?: boolean }> = ({
  x,
  y,
  n,
  state,
  stars = 0,
  glyph,
  selected,
}) => {
  const frame = useCurrentFrame();
  const face =
    state === "completed"
      ? "linear-gradient(160deg, #9ae600, #16a34a)"
      : state === "in_progress"
        ? "linear-gradient(160deg, #ffd230, #ff6900)"
        : "linear-gradient(160deg, #e5e7eb, #99a1af)";
  const depth = state === "completed" ? "#166534" : state === "in_progress" ? "#b45309" : "#6a7282";
  const ring = (frame % 48) / 48;
  return (
    <div style={{ position: "absolute", left: x - 42, top: y - 42, width: 84, height: 84 }}>
      {state === "in_progress" ? (
        <div style={{ position: "absolute", inset: -6, borderRadius: 50, border: "4px solid #fff", transform: `scale(${1 + ring * 0.3})`, opacity: 1 - ring }} />
      ) : null}
      {selected ? <div style={{ position: "absolute", inset: -8, borderRadius: 50, border: "4px solid #7dd3fc" }} /> : null}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 42,
          background: face,
          border: "4px solid #fff",
          boxShadow: chunky(depth),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
        }}
      >
        {glyph && state !== "locked" ? (
          <span style={{ fontFamily: ARABIC, fontSize: 40, lineHeight: 1, marginTop: -6, textShadow: "0 2px 0 rgba(0,0,0,0.2)" }}>{glyph}</span>
        ) : state === "completed" ? (
          <Check size={40} strokeWidth={4} />
        ) : state === "in_progress" ? (
          <Play size={34} fill="#fff" strokeWidth={0} style={{ marginLeft: 5 }} />
        ) : (
          <Lock size={30} strokeWidth={3} />
        )}
      </div>
      <div
        style={{
          position: "absolute",
          right: -8,
          top: -8,
          width: 32,
          height: 32,
          borderRadius: 16,
          background: "#7b3306",
          border: "2px solid #fff",
          color: "#fff",
          fontFamily: DISPLAY,
          fontWeight: 700,
          fontSize: 15,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {n}
      </div>
      {state === "completed" && stars ? (
        <div style={{ position: "absolute", left: 6, right: 6, bottom: -26, height: 24, borderRadius: 12, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: 1, boxShadow: "0 3px 8px -3px rgba(0,0,0,0.35)" }}>
          {[0, 1, 2].map((s) => (
            <Star key={s} size={15} color={s < stars ? "#fdc700" : "#d1d5dc"} fill={s < stars ? "#fdc700" : "#d1d5dc"} />
          ))}
        </div>
      ) : null}
    </div>
  );
};

const TrailSvg: React.FC<{ pts: { x: number; y: number }[]; done: number; height: number }> = ({ pts, done, height }) => {
  const frame = useCurrentFrame();
  const d = pathD(pts);
  const doneD = pathD(pts.slice(0, done + 1));
  return (
    <svg width={420} height={height} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <path d={d} stroke="rgba(95,52,12,0.45)" strokeWidth={50} fill="none" strokeLinecap="round" style={{ filter: "blur(3px)" }} />
      <path d={d} stroke="#f4d078" strokeWidth={38} fill="none" strokeLinecap="round" />
      <path d={d} stroke="#fff4c9" strokeWidth={4} strokeDasharray="10 16" fill="none" strokeLinecap="round" />
      <path d={doneD} stroke="#5cb434" strokeWidth={14} strokeDasharray="1 24" strokeDashoffset={-(frame / 72) * 25} fill="none" strokeLinecap="round" />
    </svg>
  );
};

const Marker: React.FC<{ x: number; y: number }> = ({ x, y }) => {
  const frame = useCurrentFrame();
  const b = Math.abs(Math.sin((frame / 21) * Math.PI)) * 12;
  return (
    <div style={{ position: "absolute", left: x - 24, top: y - 118 - b, width: 48, height: 48, borderRadius: 24, background: C.orange500, border: "3px solid #fff", boxShadow: "0 6px 14px -4px rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width="20" height="14" viewBox="0 0 20 14">
        <path d="M2 2 L10 11 L18 2" stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
};

/** Pio marche sur le sentier : position le long de la courbe, décalée en bas à gauche du nœud. */
const walkPos = (a: { x: number; y: number }, b: { x: number; y: number }, t: number) => {
  const p = bezier(a, b, t);
  const off = t < 0.18 ? 1 - t / 0.18 : t > 0.82 ? (t - 0.82) / 0.18 : 0;
  return { x: p.x - 52 * off, y: p.y + 50 * off };
};

export const TrailScreen: React.FC<{ walkAt: number; cardAt: number; tapAt: number }> = ({ walkAt, cardAt, tapAt }) => {
  const frame = useCurrentFrame();
  const raw = interpolate(frame, [walkAt, walkAt + 64], [0, 1], { easing: Easing.bezier(0.3, 0, 0.7, 1), extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const walking = frame >= walkAt && frame < walkAt + 64;
  const pio = walkPos(NODES[1], NODES[2], raw);
  const camY = interpolate(raw, [0, 1], [NODES[1].y + 150, NODES[2].y + 110]);
  const viewTop = HEADER_H;
  const viewH = PH - HEADER_H - NAV_H;
  const ox = 0;
  const oy = viewTop + viewH / 2 - camY * S;
  const card = progress(frame, cardAt, 8, OUT);
  const tileH = (420 * 1844) / 853;
  const pioH = 94;
  const pioW = (pioH * 576) / 1024;
  return (
    <div style={{ position: "absolute", inset: 0, background: "#e9c46a", overflow: "hidden", fontFamily: DISPLAY }}>
      <div style={{ position: "absolute", left: ox, top: oy, width: 420, height: 1300, transform: `scale(${S})`, transformOrigin: "0 0" }}>
        {[0, 1].map((k) => (
          <Img
            key={k}
            src={staticFile("app/images/world/map-trail-bg.jpg")}
            style={{ position: "absolute", left: 0, top: k * tileH, width: 420, height: tileH, transform: k % 2 ? "scaleY(-1)" : undefined }}
          />
        ))}
        <TrailSvg pts={[...NODES, TREASURE]} done={walking || frame >= walkAt + 64 ? 2 : 1} height={1300} />
        <div style={{ position: "absolute", left: NODES[0].x - 70, top: NODES[0].y - 112, padding: "5px 12px 5px 5px", borderRadius: 999, background: "rgba(70,25,1,0.85)", border: "3px solid #fff", color: "#fff", fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ width: 24, height: 24, borderRadius: 12, background: C.amber400, color: AMBER_950, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>1</span>
          Les fractions
        </div>
        <TrailNode {...NODES[0]} n={1} state="completed" stars={3} />
        <TrailNode {...NODES[1]} n={2} state="completed" stars={2} />
        <TrailNode {...NODES[2]} n={3} state="in_progress" selected={frame >= cardAt} />
        <TrailNode {...NODES[3]} n={4} state="locked" />
        <TrailNode {...NODES[4]} n={5} state="locked" />
        <div style={{ position: "absolute", left: TREASURE.x - 36, top: TREASURE.y - 36, width: 72, height: 72, borderRadius: 18, background: "linear-gradient(160deg, #973c00, #7b3306)", border: "3px solid #fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: chunky("#461901") }}>
          <Trophy size={34} color="#fde68a" />
        </div>
        {walking ? <Marker {...NODES[2]} /> : null}
        <div style={{ position: "absolute", left: pio.x - pioW / 2, top: pio.y - pioH + 10, width: pioW, height: pioH }}>
          <div style={{ position: "absolute", left: 6, right: 6, bottom: 2, height: 12, borderRadius: "50%", background: "rgba(0,0,0,0.3)", filter: "blur(3px)" }} />
          <Pio pose={walking ? "walk" : "hello"} height={pioH} style={{ position: "absolute", left: 0, top: 0 }} />
        </div>
      </div>
      <div style={{ position: "absolute", left: 14, top: HEADER_H + 12, display: "flex", gap: 10, alignItems: "center", zIndex: 10 }}>
        <div style={{ width: 44, height: 44, borderRadius: 22, background: CREAM, boxShadow: chunky("#d6c39a"), display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ArrowLeft size={22} color={AMBER_950} strokeWidth={3} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 14px 5px 5px", borderRadius: 999, background: "linear-gradient(90deg, #4f46e5, #3730a3)", border: "2px solid #fff", color: "#fff", boxShadow: "0 6px 14px -6px rgba(0,0,0,0.5)" }}>
          <span style={{ width: 34, height: 34, borderRadius: 17, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19 }}>🧮</span>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Mathématiques</div>
            <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.9 }}>2/5 étapes · ★5</div>
          </div>
        </div>
      </div>
      {frame >= cardAt ? (
        <div
          style={{
            position: "absolute",
            left: 12,
            right: 12,
            bottom: NAV_H + 12,
            borderRadius: 24,
            background: "#fff",
            border: "3px solid #4f46e5",
            padding: 14,
            opacity: card,
            transform: `translateY(${(1 - card) * 40}px)`,
            boxShadow: "0 18px 40px -16px rgba(0,0,0,0.5)",
            zIndex: 15,
          }}
        >
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: "#4f46e5", color: "#fff", fontSize: 22, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>3</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#4f46e5", letterSpacing: "0.06em" }}>LES FRACTIONS</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: AMBER_950 }}>Palier 3/5 · Consolidation</div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.orange700, background: C.orange100, borderRadius: 999, padding: "4px 10px" }}>C'est ici !</span>
          </div>
          <GameButton tone="green" style={{ marginTop: 14 }} pressed={pressAt(frame, tapAt)}>
            C'est parti !
          </GameButton>
        </div>
      ) : null}
      <AppHeader />
      <BottomNav active={1} />
    </div>
  );
};

/* ───────────── Une question du palier ───────────── */

const OPTIONS = [
  { label: "¾", color: "#3b82f6" },
  { label: "⅔", color: "#ec4899" },
  { label: "⅛", color: "#f59e0b" },
  { label: "1", color: "#22c55e" },
];

const Confetti: React.FC<{ at: number; count?: number }> = ({ at, count = 70 }) => {
  const frame = useCurrentFrame();
  const t = (frame - at) / 30;
  if (t < 0 || t > 2.6) return null;
  const colors = ["#f97316", "#fbbf24", "#6ab04c", "#38bdf8", "#ec4899"];
  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const a = (-90 + (rand(i * 3 + 1) - 0.5) * 100) * (Math.PI / 180);
        const v = 520 + rand(i * 7 + 2) * 420;
        const x = PW / 2 + Math.cos(a) * v * t;
        const y = PH * 0.45 + Math.sin(a) * v * t + 0.5 * 900 * t * t;
        const r = rand(i * 11 + 3) * 720 * t;
        const w = 6 + rand(i * 13 + 4) * 6;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: w,
              height: w * 0.55,
              background: colors[i % colors.length],
              transform: `rotate(${r}deg)`,
              opacity: t > 2 ? 1 - (t - 2) / 0.6 : 1,
              zIndex: 40,
            }}
          />
        );
      })}
    </>
  );
};

const StarBurst: React.FC<{ at: number; x: number; y: number }> = ({ at, x, y }) => {
  const frame = useCurrentFrame();
  const p = progress(frame, at, 20, OUT);
  if (frame < at || p >= 1) return null;
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <div key={i} style={{ position: "absolute", left: x + Math.cos(a) * 120 * p - 12, top: y + Math.sin(a) * 120 * p - 12, fontSize: 24, opacity: 1 - p, zIndex: 45 }}>
            ⭐
          </div>
        );
      })}
    </>
  );
};

export const SessionScreen: React.FC<{ pickAt: number; validateAt: number }> = ({ pickAt, validateAt }) => {
  const frame = useCurrentFrame();
  const picked = frame >= pickAt;
  const fb = progress(frame, validateAt + 2, 10, OUT);
  const fbOut = progress(frame, validateAt + 58, 8);
  const showFb = frame >= validateAt + 2 && fbOut < 1;
  const fbPop = pop(frame, validateAt + 2);
  return (
    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,#bfe6fb 0%,#f9efd2 45%,#f6dfa4 100%)", fontFamily: DISPLAY }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, paddingTop: SAFE_TOP + 6, paddingBottom: 12, background: "rgba(255,247,224,0.96)", borderBottom: "1px solid rgba(254,230,133,0.8)", paddingLeft: 16, paddingRight: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 21, fontWeight: 700, color: AMBER_950 }}>Les fractions</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(70,25,1,0.65)" }}>Palier 3 · Question 4/10</div>
          </div>
          <div style={{ width: 44, height: 44, borderRadius: 22, background: "#fff", border: "2px solid #fde68a", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Volume2 size={20} color={C.amber700} />
          </div>
          <div style={{ width: 44, height: 44, borderRadius: 22, background: "#fff", border: "2px solid #fde68a", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={20} color={C.amber700} />
          </div>
        </div>
        <div style={{ height: 12, borderRadius: 6, background: "rgba(70,25,1,0.12)", marginTop: 10, overflow: "hidden" }}>
          <div style={{ width: `${tween(frame, validateAt + 4, 16, 30, 40)}%`, height: "100%", borderRadius: 6, background: "linear-gradient(90deg, #ff8904, #f6339a)" }} />
        </div>
      </div>
      <div style={{ position: "absolute", left: 14, right: 14, top: 168, borderRadius: 26, background: "#fff", padding: 20, boxShadow: "0 18px 40px -20px rgba(70,25,1,0.45)" }}>
        <div style={{ fontFamily: FONT, fontSize: 22, fontWeight: 700, color: C.ink }}>Combien fait ½ + ¼ ?</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 18 }}>
          {OPTIONS.map((o, i) => {
            const sel = picked && i === 0;
            const right = frame >= validateAt && i === 0;
            return (
              <div
                key={o.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 14px",
                  borderRadius: 18,
                  border: `2px solid ${right ? "#4ade80" : sel ? o.color : "#e5e7eb"}`,
                  background: right ? "#dcfce7" : sel ? `${o.color}14` : "#fff",
                  transform: `scale(${sel ? 1.02 : 1})`,
                }}
              >
                <span
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    background: right ? "#22c55e" : sel ? o.color : "#d1d5dc",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 18,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {right ? <Check size={22} strokeWidth={3.5} /> : "ABCD"[i]}
                </span>
                <span style={{ fontFamily: FONT, fontSize: 24, fontWeight: 700, color: C.ink }}>{o.label}</span>
              </div>
            );
          })}
        </div>
        <div
          style={{
            marginTop: 18,
            height: 54,
            borderRadius: 18,
            background: "linear-gradient(90deg, #ff8904, #f6339a)",
            color: "#fff",
            fontSize: 19,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: picked ? 1 : 0.55,
            transform: `scale(${1 - pressAt(frame, validateAt) * 0.04})`,
          }}
        >
          Valider
        </div>
      </div>
      {showFb ? (
        <div style={{ position: "absolute", inset: 0, background: `rgba(70,25,1,${0.45 * fb * (1 - fbOut)})`, zIndex: 30 }}>
          <div
            style={{
              position: "absolute",
              left: (PW - 340) / 2,
              top: 300,
              width: 340,
              borderRadius: 32,
              border: "4px solid #fff",
              background: "linear-gradient(160deg, #9ae600, #16a34a)",
              padding: "86px 20px 24px",
              textAlign: "center",
              color: "#fff",
              opacity: 1 - fbOut,
              transform: `scale(${0.7 + 0.3 * fbPop})`,
              boxShadow: "0 30px 60px -20px rgba(0,0,0,0.5)",
            }}
          >
            <div style={{ position: "absolute", left: (332 - 84) / 2, top: -90 }}>
              <Pio pose="cheer" height={150} />
            </div>
            <div style={{ fontSize: 34, fontWeight: 700, textShadow: "0 2px 0 rgba(0,0,0,0.2)" }}>Bravo !</div>
            <div style={{ fontSize: 18, fontWeight: 600, marginTop: 4 }}>Tu as tout compris.</div>
          </div>
          <StarBurst at={validateAt + 4} x={PW / 2} y={420} />
        </div>
      ) : null}
      <Confetti at={validateAt + 4} />
    </div>
  );
};

/* ───────────── Résultat du palier ───────────── */

const BadgeShield: React.FC<{ size?: number }> = ({ size = 80 }) => (
  <svg width={size} height={size * 1.15} viewBox="0 0 80 92">
    <defs>
      <linearGradient id="metal" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stopColor="#bfdbfe" />
        <stop offset="0.5" stopColor="#3b82f6" />
        <stop offset="1" stopColor="#1e3a8a" />
      </linearGradient>
      <linearGradient id="core" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#fbbf24" />
        <stop offset="1" stopColor="#f97316" />
      </linearGradient>
    </defs>
    <path d="M40 2 L76 14 V44 C76 66 60 82 40 90 C20 82 4 66 4 44 V14 Z" fill="url(#metal)" />
    <path d="M40 10 L68 19 V44 C68 61 56 74 40 81 C24 74 12 61 12 44 V19 Z" fill="url(#core)" />
    <g transform="translate(26 30)" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round">
      <rect x="0" y="0" width="28" height="32" rx="5" />
      <line x1="6" y1="8" x2="22" y2="8" />
      <line x1="7" y1="17" x2="7" y2="17.1" />
      <line x1="14" y1="17" x2="14" y2="17.1" />
      <line x1="21" y1="17" x2="21" y2="17.1" />
      <line x1="7" y1="25" x2="7" y2="25.1" />
      <line x1="14" y1="25" x2="14" y2="25.1" />
      <line x1="21" y1="25" x2="21" y2="25.1" />
    </g>
  </svg>
);

export const ResultScreen: React.FC<{ trophyAt: number }> = ({ trophyAt }) => {
  const frame = useCurrentFrame();
  const pioIn = pop(frame, 6, { damping: 12, stiffness: 140 });
  const count = Math.round(tween(frame, 22, 30, 0, 27, Easing.out(Easing.cubic)));
  const meter = tween(frame, 22, 30, 0, 90);
  return (
    <div style={{ position: "absolute", inset: 0, background: "#fff8e6", fontFamily: DISPLAY, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: PW, height: 380, background: "linear-gradient(180deg, #5db9f2, #9ddcfb 55%, #f6c452)" }}>
        <div style={{ position: "absolute", left: PW / 2 - 130, top: 90, width: 260, height: 260, borderRadius: 130, background: "radial-gradient(circle, rgba(255,247,194,0.95), rgba(255,210,63,0.35) 50%, rgba(255,210,63,0) 70%)", transform: `scale(${1 + Math.sin(frame / 14) * 0.05})` }} />
        <SpeechBubble style={{ left: 214, top: 82, fontSize: 15, opacity: progress(frame, 14, 10) }} tail="left">
          Palier validé !
        </SpeechBubble>
        <div style={{ position: "absolute", left: PW / 2 - 113 + 8, top: 92, transform: `scale(${pioIn})`, transformOrigin: "50% 100%" }}>
          <Pio pose="cheer" height={200} />
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 292, textAlign: "center", color: "#fff", fontSize: 30, fontWeight: 700, textShadow: textOutline }}>Palier 3 validé</div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 334, textAlign: "center", color: "#fff", fontSize: 15, fontWeight: 600, textShadow: textOutline }}>Le palier 4 vient de s'ouvrir.</div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 390, display: "flex", justifyContent: "center", gap: 10 }}>
        {[0, 1, 2].map((i) => {
          const p = pop(frame, 16 + i * 5, { damping: 10, stiffness: 160 });
          return (
            <div key={i} style={{ transform: `scale(${p}) rotate(${(1 - p) * -40}deg)`, marginTop: i === 1 ? -10 : 0 }}>
              <Star size={60} color="#e17100" fill="#fdc700" strokeWidth={1.5} />
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 14, right: 14, top: 470, borderRadius: 24, background: "#fff", border: "3px solid #fde68a", padding: "14px 16px" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.amber700, letterSpacing: "0.08em" }}>TA RÉCOLTE D'ÉTOILES</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 2 }}>
          <Star size={28} color="#e17100" fill="#fdc700" style={{ alignSelf: "center" }} />
          <span style={{ fontSize: 46, fontWeight: 700, color: AMBER_950, lineHeight: 1 }}>{count}</span>
          <span style={{ fontSize: 22, fontWeight: 700, color: "rgba(70,25,1,0.5)" }}>/ 30</span>
          <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, color: C.lime700, background: C.lime100, borderRadius: 999, padding: "4px 9px", alignSelf: "center" }}>
            <Flag size={12} /> Validé à partir de 21
          </span>
        </div>
        <div style={{ position: "relative", height: 12, borderRadius: 6, background: "#f3f4f6", marginTop: 10 }}>
          <div style={{ width: `${meter}%`, height: "100%", borderRadius: 6, background: "linear-gradient(90deg, #ffd230, #fe9a00)" }} />
          <div style={{ position: "absolute", left: "70%", top: -3, width: 3, height: 18, borderRadius: 2, background: AMBER_950 }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", marginTop: 10, fontSize: 13, fontWeight: 700, color: AMBER_950 }}>
          Niveau 3
          <span style={{ marginLeft: "auto", color: "rgba(70,25,1,0.6)" }}>12 avant le niveau 4</span>
        </div>
      </div>
      {frame >= trophyAt ? (
        <div
          style={{
            position: "absolute",
            left: 14,
            right: 14,
            top: 650,
            borderRadius: 24,
            background: "linear-gradient(135deg, #7c3aed, #a855f7)",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: 14,
            color: "#fff",
            transform: `scale(${pop(frame, trophyAt)})`,
            boxShadow: "0 18px 30px -14px rgba(124,58,237,0.7)",
          }}
        >
          <BadgeShield size={70} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", opacity: 0.85 }}>NOUVEAU TROPHÉE</div>
            <div style={{ fontSize: 21, fontWeight: 700 }}>Petit matheux</div>
            <span style={{ fontSize: 11, fontWeight: 700, background: "rgba(255,255,255,0.22)", borderRadius: 999, padding: "2px 8px" }}>Rare</span>
          </div>
        </div>
      ) : null}
      <Confetti at={4} count={60} />
    </div>
  );
};

/* ───────────── Arabe & Coran : le chemin jusqu'à la Kaaba ───────────── */

// Du bas vers le haut : le village sénégalais, le Sahara, l'Arabie au crépuscule.
const ZONES = ["zone-senegal", "zone-senegal-2", "zone-sahara", "zone-sahara", "zone-arabie", "zone-arabie-2"];
const ZONE_H = (420 * 1540) / 860;
const Q_ROW = 124;
const Q_BOTTOM = 440;
const Q_WORLD_H = Q_BOTTOM + 30 * Q_ROW + 510;
const qNode = (i: number) => ({ x: 210 + (i % 2 === 0 ? -1 : 1) * 94 * (0.82 + 0.18 * Math.abs(Math.sin(1.3 * i))), y: Q_WORLD_H - Q_BOTTOM - i * Q_ROW });
const GLYPHS = ["ا", "ج", "ذ", "ش", "ظ", "ق", "ن"];

const Twinkle: React.FC<{ x: number; y: number; i: number }> = ({ x, y, i }) => {
  const frame = useCurrentFrame();
  const o = 0.35 + 0.65 * Math.abs(Math.sin(frame / 18 + i));
  return <div style={{ position: "absolute", left: x, top: y, width: 4, height: 4, borderRadius: 2, background: "#fff", opacity: o, boxShadow: "0 0 6px #fff" }} />;
};

/** La carte de la leçon choisie sur le chemin (app/(student)/student/arabe/page.app.tsx, LessonCard). */
const LessonCard: React.FC<{ at: number; tapAt: number }> = ({ at, tapAt }) => {
  const frame = useCurrentFrame();
  const p = progress(frame, at, 8, OUT);
  if (frame < at) return null;
  const teal = "#0d9488";
  return (
    <div
      style={{
        position: "absolute",
        left: 12,
        right: 12,
        bottom: NAV_H + 12,
        borderRadius: 24,
        background: "#fff",
        border: `3px solid ${teal}`,
        padding: 14,
        opacity: p,
        transform: `translateY(${(1 - p) * 40}px)`,
        boxShadow: "0 18px 40px -16px rgba(0,0,0,0.55)",
        zIndex: 15,
        fontFamily: DISPLAY,
      }}
    >
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div style={{ width: 52, height: 52, borderRadius: 16, background: teal, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: ARABIC, fontSize: 34, lineHeight: 1 }}>
          <span style={{ marginTop: -10 }}>ج</span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: teal, letterSpacing: "0.06em" }}>NIVEAU 1 · L'ALPHABET</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: AMBER_950 }}>Lettres djîm → dâl</div>
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: C.amber800, background: C.amber100, borderRadius: 999, padding: "4px 10px" }}>L'étape du jour</span>
      </div>
      <div style={{ fontSize: 14, color: "rgba(70,25,1,0.75)", marginTop: 8, fontFamily: FONT }}>
        Entendre, reconnaître, prononcer et écrire{" "}
        <span style={{ fontFamily: ARABIC, fontSize: 18, direction: "rtl", unicodeBidi: "isolate", whiteSpace: "nowrap" }}>ج ح خ د</span>.
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 12, alignItems: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: 28, background: "linear-gradient(180deg, #34d399, #059669)", boxShadow: chunky("#065f46"), display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Volume2 size={24} color="#fff" />
        </div>
        <GameButton tone="green" style={{ flex: 1 }} pressed={pressAt(frame, tapAt)}>
          C'est parti !
        </GameButton>
      </div>
    </div>
  );
};

/**
 * Le chemin du Coran : la caméra part de la Kaaba, au bout du chemin, descend
 * jusqu'à Pio, qui marche vers la leçon 2 ; puis la carte de la leçon monte.
 */
export const QuranPathScreen: React.FC<{ descendEnd: number; walkAt: number; cardAt: number; tapAt: number }> = ({
  descendEnd,
  walkAt,
  cardAt,
  tapAt,
}) => {
  const frame = useCurrentFrame();
  const raw = interpolate(frame, [walkAt, walkAt + 60], [0, 1], { easing: Easing.bezier(0.3, 0, 0.7, 1), extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const walking = frame >= walkAt && frame < walkAt + 60;
  const a = qNode(0);
  const b = qNode(1);
  const pio = walkPos(a, b, raw);
  const viewTop = HEADER_H;
  const viewH = PH - HEADER_H - NAV_H;
  const startCam = a.y - 120;
  const descend = interpolate(frame, [14, descendEnd], [0, 1], { easing: Easing.bezier(0.65, 0, 0.35, 1), extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const followCam = interpolate(raw, [0, 1], [startCam, b.y - 60]);
  // Une fois la carte de leçon ouverte, on remonte un peu le cadre pour garder Pio visible au-dessus.
  const lift = progress(frame, cardAt, 14, OUT) * 110;
  const camY = 320 + (followCam - 320) * descend + lift;
  const oy = viewTop + viewH / 2 - camY * S;
  const pioH = 96;
  const pioW = (pioH * 576) / 1024;
  const pts = Array.from({ length: 31 }).map((_, i) => qNode(i));
  return (
    <div style={{ position: "absolute", inset: 0, background: "#0f0b2e", overflow: "hidden", fontFamily: DISPLAY }}>
      <div style={{ position: "absolute", left: 0, top: oy, width: 420, height: Q_WORLD_H, transform: `scale(${S})`, transformOrigin: "0 0" }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: 420, height: 1200, background: "linear-gradient(180deg, #0f0b2e, #1c1650 55%, #2a2266)" }} />
        {Array.from({ length: 12 }).map((_, i) => (
          <Twinkle key={i} x={20 + rand(i + 40) * 380} y={20 + rand(i + 90) * 260} i={i} />
        ))}
        <Img
          src={staticFile("app/images/coran/kaaba.jpg")}
          style={{ position: "absolute", left: 0, top: 150, width: 420, height: 353, WebkitMaskImage: "radial-gradient(ellipse 72% 70% at 50% 50%, #000 60%, transparent 100%)" }}
        />
        {ZONES.map((z, i) => {
          const top = Q_WORLD_H - ZONE_H - i * (ZONE_H - 110);
          const last = i === ZONES.length - 1;
          // Chaque tuile se fond dans celle du dessous ; la dernière se fond aussi dans le ciel.
          const mask = i === 0 ? undefined : last ? "linear-gradient(180deg, transparent, #000 110px, #000 calc(100% - 110px), transparent)" : "linear-gradient(180deg, #000 calc(100% - 110px), transparent)";
          return (
            <Img
              key={`${z}-${i}`}
              src={staticFile(`app/images/coran/${z}.jpg`)}
              style={{
                position: "absolute",
                left: 0,
                top,
                width: 420,
                height: ZONE_H,
                transform: i % 2 ? "scaleX(-1)" : undefined,
                WebkitMaskImage: mask,
              }}
            />
          );
        })}
        <TrailSvg pts={pts} done={walking || frame >= walkAt + 60 ? 1 : 0} height={Q_WORLD_H} />
        {pts.slice(0, 7).map((p, i) => (
          <TrailNode
            key={i}
            {...p}
            n={i + 1}
            state={i === 0 ? "completed" : i === 1 ? "in_progress" : "locked"}
            stars={i === 0 ? 3 : 0}
            glyph={GLYPHS[i]}
            selected={i === 1 && frame >= cardAt}
          />
        ))}
        <div style={{ position: "absolute", left: a.x - 44, top: a.y + 56, padding: "4px 12px", borderRadius: 999, background: "#fff", color: AMBER_950, fontSize: 14, fontWeight: 700 }}>🏁 Départ</div>
        <div style={{ position: "absolute", left: 120, top: 520, padding: "6px 14px", borderRadius: 999, background: "rgba(30,27,75,0.85)", border: "2px solid #fde68a", color: "#fff", fontSize: 15, fontWeight: 700 }}>
          🔒 Encore 29 leçons
        </div>
        {walking ? <Marker {...b} /> : null}
        <div style={{ position: "absolute", left: pio.x - pioW / 2, top: pio.y - pioH + 10, width: pioW, height: pioH }}>
          <Pio pose={walking ? "walkAway" : "salam"} outfit="boubou" height={pioH} style={{ position: "absolute", left: 0, top: 0 }} />
        </div>
      </div>
      <div style={{ position: "absolute", left: 14, top: HEADER_H + 12, display: "flex", gap: 10, alignItems: "center", zIndex: 10 }}>
        <div style={{ width: 44, height: 44, borderRadius: 22, background: CREAM, boxShadow: chunky("#d6c39a"), display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ArrowLeft size={22} color={AMBER_950} strokeWidth={3} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 14px 5px 5px", borderRadius: 999, background: "linear-gradient(90deg, #059669, #065f46)", border: "2px solid #fff", color: "#fff", boxShadow: "0 6px 14px -6px rgba(0,0,0,0.5)" }}>
          <Img src={staticFile("app/images/coran/medallion.jpg")} style={{ width: 34, height: 34, borderRadius: 17 }} />
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Arabe & Coran</div>
            <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.9 }}>1/30 leçons · ★3</div>
          </div>
        </div>
      </div>
      <LessonCard at={cardAt} tapAt={tapAt} />
      <AppHeader />
      <BottomNav active={0} />
    </div>
  );
};

/* ───────────── Une leçon d'arabe : rencontrer la lettre, la prononcer ───────────── */

type LessonTiming = {
  /** Débuts des répliques de la voix de l'application (images, dans la séquence). */
  meetAt: number;
  jimAt: number;
  repeatAt: number;
  micAt: number;
  verifyAt: number;
  successAt: number;
};

// Durées des répliques de la voix de l'application (images à 30 i/s), mesurées sur les fichiers.
export const APP_VOICE_FRAMES = { map_welcome: 142, meet: 80, jim: 30, repeat: 96, bravo_2: 60 } as const;

const Spinner: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <span
      style={{
        width: 20,
        height: 20,
        borderRadius: 10,
        border: "3px solid rgba(255,255,255,0.4)",
        borderTopColor: "#fff",
        transform: `rotate(${frame * 14}deg)`,
        display: "inline-block",
      }}
    />
  );
};

export const LessonScreen: React.FC<LessonTiming> = ({ meetAt, jimAt, repeatAt, micAt, verifyAt, successAt }) => {
  const frame = useCurrentFrame();
  const inside = (at: number, len: number) => frame >= at && frame < at + len;
  const speaking =
    inside(meetAt, APP_VOICE_FRAMES.meet) ||
    inside(jimAt, APP_VOICE_FRAMES.jim) ||
    inside(repeatAt, APP_VOICE_FRAMES.repeat) ||
    inside(successAt + 2, APP_VOICE_FRAMES.bravo_2);
  const listening = frame >= micAt && frame < verifyAt;
  const verifying = frame >= verifyAt && frame < successAt;
  const success = frame >= successAt;
  const ready = frame >= repeatAt;
  const bar = tween(frame, 0, 20, 8, 22) + tween(frame, successAt, 20, 0, 14);
  const bob = Math.sin(frame / 10) * 4;
  const jimPulse = inside(jimAt, APP_VOICE_FRAMES.jim) ? Math.sin(((frame - jimAt) / APP_VOICE_FRAMES.jim) * Math.PI) : 0;
  const bubble = success
    ? "MashaAllah, c'est ça !"
    : frame >= repeatAt
      ? "À toi ! Appuie sur le micro, et dis-la bien fort."
      : "Voici une nouvelle lettre ! Écoute bien son nom.";
  const pose = success ? "bravo" : listening ? "listen" : speaking ? "recite" : "idle";
  return (
    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, #ecfdf5, #fff8e6 60%)", fontFamily: DISPLAY }}>
      <div style={{ position: "absolute", left: 14, right: 14, top: SAFE_TOP + 10, display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 20, background: "#ffe4e6", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <X size={20} color="#e11d48" strokeWidth={3} />
        </div>
        <div style={{ flex: 1, position: "relative", height: 16, borderRadius: 8, background: "rgba(5,150,105,0.15)" }}>
          <div style={{ width: `${bar}%`, height: "100%", borderRadius: 8, background: "linear-gradient(90deg, #9ae600, #059669)" }} />
          <div style={{ position: "absolute", left: `calc(${bar}% - 22px)`, top: -14, width: 44, height: 44, borderRadius: 22, border: "3px solid #fff", overflow: "hidden", background: "#d1fae5", boxShadow: "0 4px 10px -4px rgba(0,0,0,0.4)" }}>
            <Img src={staticFile("app/images/pio/boubou/idle.png")} style={{ position: "absolute", width: 130, left: -43, top: -8 }} />
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, background: C.amber100, borderRadius: 999, padding: "4px 10px", color: C.amber800, fontWeight: 700, fontSize: 15 }}>
          <Star size={15} fill="#fdc700" color="#e17100" /> {success ? 3 : 2}
        </div>
      </div>
      <div style={{ position: "absolute", left: 0, top: 112 }}>
        <Pio pose={pose} outfit="boubou" height={176} />
      </div>
      <SpeechBubble border={speaking ? "#047857" : "#34d399"} tail="left" style={{ left: 104, right: 16, top: 150, fontSize: 16 }}>
        <span style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
          <span style={{ flex: 1 }}>{bubble}</span>
          <span
            style={{
              width: 30,
              height: 30,
              borderRadius: 15,
              flexShrink: 0,
              background: speaking ? "#059669" : "#d1fae5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Volume2 size={16} color={speaking ? "#fff" : "#059669"} />
          </span>
        </span>
      </SpeechBubble>
      <div style={{ position: "absolute", left: 16, right: 16, top: 330, display: "flex", gap: 12 }}>
        <div
          style={{
            flex: 1,
            height: 200,
            borderRadius: 26,
            background: "linear-gradient(160deg, #14b8a6, #0f766e)",
            boxShadow: `${chunky("#115e59")}${jimPulse > 0 ? `, 0 0 0 ${6 * jimPulse}px rgba(45,212,191,0.55)` : ""}`,
            color: "#fff",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            transform: `scale(${1 + jimPulse * 0.06 + (success ? Math.max(0, 1 - (frame - successAt) / 12) * 0.08 : 0)})`,
          }}
        >
          {/* Le ج d'Amiri descend loin sous la ligne : on lui réserve sa hauteur pour qu'il ne recouvre pas son nom. */}
          <div style={{ height: 118, display: "flex", alignItems: "flex-start", justifyContent: "center", overflow: "visible" }}>
            <span style={{ fontFamily: ARABIC, fontSize: 80, lineHeight: 1, marginTop: -8 }}>ج</span>
          </div>
          <span style={{ fontSize: 18, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
            <Volume2 size={18} /> djîm
          </span>
        </div>
        <div style={{ flex: 1, height: 200, borderRadius: 26, background: "linear-gradient(160deg, #ffd230, #fe9a00)", boxShadow: chunky("#b45309"), color: AMBER_950, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2 }}>
          <span style={{ fontSize: 58, transform: `translateY(${bob}px)` }}>🐫</span>
          <span style={{ fontFamily: ARABIC, fontSize: 32, fontWeight: 700, lineHeight: 1.5, marginBottom: 4 }}>جَمَل</span>
          <span style={{ fontSize: 15, fontWeight: 700 }}>le chameau</span>
        </div>
      </div>
      <div style={{ position: "absolute", left: 20, right: 20, top: 600, display: "flex", justifyContent: "center", opacity: ready ? 1 : 0.5 }}>
        <div
          style={{
            height: 64,
            padding: "0 24px",
            borderRadius: 32,
            display: "flex",
            alignItems: "center",
            gap: 10,
            color: "#fff",
            fontWeight: 700,
            fontSize: 18,
            whiteSpace: "nowrap",
            background: success
              ? "linear-gradient(180deg, #9ae600, #16a34a)"
              : listening
                ? "linear-gradient(180deg, #fb7185, #e11d48)"
                : verifying
                  ? "linear-gradient(180deg, #fdba74, #f97316)"
                  : "linear-gradient(180deg, #ffb900, #ff6900)",
            boxShadow: chunky(success ? "#166534" : listening ? "#9f1239" : "#b45309"),
            transform: `scale(${listening ? 1 + Math.sin(frame / 4) * 0.03 : 1})`,
          }}
        >
          {success ? (
            <>
              <Check size={22} strokeWidth={3.5} /> MashaAllah !
            </>
          ) : listening ? (
            <>
              Je t'écoute…
              <span style={{ display: "flex", gap: 3, alignItems: "center" }}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <span key={i} style={{ width: 4, borderRadius: 2, background: "#fff", height: 8 + Math.abs(Math.sin(frame / 3 + i * 1.3)) * 16 }} />
                ))}
              </span>
            </>
          ) : verifying ? (
            <>
              <Spinner /> Je vérifie ta prononciation…
            </>
          ) : (
            <>🎤 À toi ! Appuie et répète</>
          )}
        </div>
      </div>
      <div style={{ position: "absolute", right: 22, bottom: 50, width: 80, height: 80, borderRadius: 40, background: "linear-gradient(180deg, #9ae600, #16a34a)", boxShadow: chunky("#166534"), display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 38, fontWeight: 700, opacity: success ? 1 : 0.45, transform: `translateY(${success ? -Math.abs(Math.sin(frame / 8)) * 8 : 0}px)` }}>
        ➜
      </div>
      {success ? <StarBurst at={successAt + 2} x={PW / 2 - 90} y={430} /> : null}
    </div>
  );
};
