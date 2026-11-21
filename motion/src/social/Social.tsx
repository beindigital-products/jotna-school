import React, { createContext, useContext } from "react";
import { AbsoluteFill, Audio, Img, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Check } from "lucide-react";
import { ARABIC, C, DISPLAY, FONT, FPS } from "../theme";
import { OUT, drift, pop, progress } from "../lib/anim";
import { Pio } from "../components/pio";
import { AndroidFrame, PhoneFrame } from "../components/frames";
import { CampScreen, PH, PW, QuranPathScreen, ResultScreen, SessionScreen, TrailScreen } from "../screens/student";
import type { Beat, Post, VoiceLine } from "./types";
import posts from "./posts.json";
import durations from "./durations.json";

/*
 * Moteur des vidéos verticales (1080 × 1920) pour TikTok, Reels et Facebook.
 * Une publication = une suite de plans ; la durée de chaque plan vient des
 * voix (durations.json, écrit par scripts/social-voices.mjs). Les zones
 * recouvertes par les applications (haut 170 px, bas 420 px, droite 130 px)
 * restent libres de texte important.
 */

export const SOCIAL_W = 1080;
export const SOCIAL_H = 1920;
export const POSTS = posts as unknown as Post[];

const DUR = durations as Record<string, number>;

// Même clé que scripts/social-voices.mjs : un petit hachage du texte.
export const voiceKey = (v: VoiceLine) => {
  const s = `${v.who ?? "rachel"}|${v.model ?? "v4"}|${v.text}`;
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return `v${h.toString(36)}`;
};

const voiceFrames = (v: VoiceLine) => Math.ceil((DUR[voiceKey(v)] ?? 2.5) * FPS);

export type TimedBeat = { beat: Beat; from: number; frames: number; voices: { v: VoiceLine; at: number; frames: number }[] };

export const timeline = (post: Post): { beats: TimedBeat[]; total: number } => {
  let cursor = 0;
  const beats = post.beats.map((beat) => {
    let t = Math.round(0.35 * FPS);
    const voices = (beat.voices ?? []).map((v) => {
      t += Math.round((v.pause ?? 0) * FPS);
      const frames = voiceFrames(v);
      const at = t;
      t += frames + Math.round(0.12 * FPS);
      return { v, at, frames };
    });
    const frames = Math.max(Math.round((beat.min ?? 2.2) * FPS), t + Math.round((beat.tail ?? 0.5) * FPS));
    const out = { beat, from: cursor, frames, voices };
    cursor += frames;
    return out;
  });
  return { beats, total: cursor };
};

export const postFrames = (post: Post) => timeline(post).total;

/** Vrai sur les plans à fond nuit (vidéos du Coran) : les textes posés directement sur le fond passent en clair. */
const DarkCtx = createContext(false);
const useInk = (light: string = "#ffffff", dark: string = C.ink) => (useContext(DarkCtx) ? light : dark);

/* ───────────── Fonds ───────────── */

const TONES: Record<string, [string, string, string]> = {
  warm: ["#fff8ec", "#fde7a8", "#ffd6a7"],
  lime: ["#f7fee7", "#e3f9a8", "#fef3c6"],
  sky: ["#f0f9ff", "#c4e8fb", "#fef3c6"],
  cream: ["#fffdf8", "#fff1d6", "#ffe0bd"],
  night: ["#1e2a4a", "#2a2266", "#0f0b2e"],
};

const Bg: React.FC<{ tone?: string }> = ({ tone = "warm" }) => {
  const frame = useCurrentFrame();
  const [a, b, c] = TONES[tone] ?? TONES.warm;
  return (
    <AbsoluteFill style={{ background: `linear-gradient(170deg, ${a}, ${b} 55%, ${c})`, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: -220 + Math.sin(frame / 50) * 40, top: 1050, width: 760, height: 760, borderRadius: "50%", background: tone === "night" ? "rgba(139,92,246,0.25)" : "rgba(254,215,170,0.55)", filter: "blur(90px)" }} />
      <div style={{ position: "absolute", right: -240, top: 100 + Math.cos(frame / 60) * 40, width: 700, height: 700, borderRadius: "50%", background: tone === "night" ? "rgba(253,224,71,0.16)" : "rgba(217,249,157,0.55)", filter: "blur(90px)" }} />
    </AbsoluteFill>
  );
};

/* ───────────── Briques ───────────── */

const Title: React.FC<{ text: string; size?: number; at?: number; color?: string; marker?: string; top?: number }> = ({ text, size = 86, at = 0, color: colorProp, marker, top = 210 }) => {
  const frame = useCurrentFrame();
  const color = colorProp ?? useInk();
  // Une espace insécable avant « ? », « ! », « : » : le signe reste collé à son mot.
  const words = text.replace(/ ([?!:])/g, String.fromCharCode(160) + "$1").split(" ");
  return (
    <div style={{ position: "absolute", left: 70, right: 210, top, fontFamily: FONT, fontWeight: 800, fontSize: size, letterSpacing: "-0.035em", lineHeight: 1.06, color, display: "flex", flexWrap: "wrap", columnGap: size * 0.24 }}>
      {words.map((w, i) => {
        const p = progress(frame, at + i * 3, 18, OUT);
        const isMark = Boolean(marker) && i >= words.length - 2 && words.length > 3;
        return (
          <span key={i} style={{ position: "relative", opacity: p, transform: `translateY(${(1 - p) * size * 0.5}px) rotate(${(1 - p) * 4}deg)`, display: "inline-block", whiteSpace: "nowrap" }}>
            {isMark ? <span style={{ position: "absolute", left: 0, right: 0, bottom: size * 0.05, height: size * 0.22, borderRadius: size, background: marker, zIndex: 0 }} /> : null}
            <span style={{ position: "relative", zIndex: 1 }}>{w}</span>
          </span>
        );
      })}
    </div>
  );
};

const Bubble: React.FC<{ text: string; at?: number; top: number; left?: number; width?: number; size?: number }> = ({ text, at = 6, top, left = 70, width = 780, size = 54 }) => {
  const frame = useCurrentFrame();
  const p = pop(frame, at, { damping: 14, stiffness: 140 });
  return (
    <div style={{ position: "absolute", left, top, width, padding: "34px 40px", borderRadius: 44, background: "#fff", boxShadow: "0 30px 60px -26px rgba(17,24,39,0.45)", border: "1px solid rgba(17,24,39,0.06)", fontFamily: DISPLAY, fontWeight: 600, fontSize: size, lineHeight: 1.22, color: C.ink, transform: `scale(${0.8 + 0.2 * p})`, transformOrigin: "30% 100%", opacity: Math.min(1, p * 1.6) }}>
      {text}
    </div>
  );
};

const PioStage: React.FC<{ pose: Parameters<typeof Pio>[0]["pose"]; outfit?: "classic" | "boubou"; height?: number; right?: number; bottom?: number; at?: number }> = ({ pose, outfit = "classic", height = 980, right = 20, bottom = 380, at = 2 }) => {
  const frame = useCurrentFrame();
  const p = progress(frame, at, 22, OUT);
  return (
    <div style={{ position: "absolute", right, bottom: bottom - (1 - p) * 160, opacity: p }}>
      <Pio pose={pose} outfit={outfit} height={height} />
    </div>
  );
};

/** Pio qui pointe le bout du nez en haut à droite, pour les plans de texte. */
const PioPeek: React.FC<{ pose: Parameters<typeof Pio>[0]["pose"] }> = ({ pose }) => {
  const frame = useCurrentFrame();
  const p = progress(frame, 6, 20, OUT);
  return (
    <div style={{ position: "absolute", right: -30, top: 90 - (1 - p) * 200, opacity: p }}>
      <Pio pose={pose} height={420} />
    </div>
  );
};

const Hook: React.FC<{ beat: Extract<Beat, { kind: "hook" }> }> = ({ beat }) => {
  const frame = useCurrentFrame();
  return (
    <>
      {beat.kicker ? (
        <div style={{ position: "absolute", left: 70, top: 170, fontFamily: FONT, fontWeight: 700, fontSize: 34, letterSpacing: "0.12em", textTransform: "uppercase", color: useInk("#fde68a", C.orange700), opacity: progress(frame, 0, 12) }}>{beat.kicker}</div>
      ) : null}
      <Title text={beat.title} size={104} at={4} marker={beat.marker ?? "rgba(255,210,48,0.85)"} top={250} />
      <PioStage pose={beat.pose ?? "hello"} outfit={beat.outfit} height={900} bottom={360} at={8} />
    </>
  );
};

const PioBeat: React.FC<{ beat: Extract<Beat, { kind: "pio" }> }> = ({ beat }) => (
  <>
    {beat.title ? <Title text={beat.title} size={72} at={2} top={200} /> : null}
    {beat.text ? <Bubble text={beat.text} top={beat.title ? 520 : 300} /> : null}
    <PioStage pose={beat.pose} outfit={beat.outfit} height={1000} bottom={340} />
  </>
);

const ScreenIn: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const p = progress(frame, 0, 8);
  return <div style={{ position: "absolute", inset: 0, opacity: p, transform: `scale(${1.04 - 0.04 * p})` }}>{children}</div>;
};

const PhoneBeat: React.FC<{ beat: Extract<Beat, { kind: "phone" }> }> = ({ beat }) => {
  const frame = useCurrentFrame();
  const S = 1.18;
  const enter = pop(frame, 4, { damping: 15, stiffness: 70 });
  const Frame = beat.os === "android" ? AndroidFrame : PhoneFrame;
  const screen =
    beat.screen === "camp" ? <CampScreen tapAt={9999} /> :
    beat.screen === "trail" ? <TrailScreen walkAt={10} cardAt={9999} tapAt={9999} /> :
    beat.screen === "session" ? <SessionScreen pickAt={40} validateAt={70} /> :
    beat.screen === "result" ? <ResultScreen trophyAt={40} /> :
    <QuranPathScreen descendEnd={60} walkAt={9999} cardAt={9999} tapAt={9999} />;
  return (
    <>
      {beat.title ? <Title text={beat.title} size={72} at={2} top={190} /> : null}
      {beat.caption ? (
        <div style={{ position: "absolute", left: 70, right: 210, top: 395, fontFamily: FONT, fontWeight: 600, fontSize: 40, color: useInk("#e5e7eb", C.body), opacity: progress(frame, 14, 14) }}>{beat.caption}</div>
      ) : null}
      <div style={{ position: "absolute", left: (SOCIAL_W - (PW + 26) * S) / 2 - 20, top: 460 + drift(frame, 8, 4.5) + (1 - enter) * 600, width: (PW + 26) * S, height: (PH + 26) * S, transform: `rotate(${(1 - enter) * 8}deg)`, opacity: progress(frame, 4, 10) }}>
        <Frame scale={S} style={{ left: 0, top: 0 }}>
          <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
            <ScreenIn>{screen}</ScreenIn>
          </div>
        </Frame>
      </div>
    </>
  );
};

const spanOf = (timed: TimedBeat, n: number) => {
  const first = timed.voices[0]?.at ?? 20;
  const last = timed.voices.at(-1);
  const end = last ? last.at + last.frames : first + 60;
  return { first, span: Math.max(20, (end - first) / n) };
};

const Bullets: React.FC<{ beat: Extract<Beat, { kind: "bullets" }>; timed: TimedBeat }> = ({ beat, timed }) => {
  const frame = useCurrentFrame();
  const { first, span } = spanOf(timed, beat.items.length);
  return (
    <>
      <PioPeek pose="idle" />
      <Title text={beat.title} size={78} at={2} top={210} />
      <div style={{ position: "absolute", left: 70, right: 130, top: 620, display: "flex", flexDirection: "column", gap: 22 }}>
        {beat.items.map((it, i) => {
          const p = pop(frame, first + i * span - 6, { damping: 14, stiffness: 130 });
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 26, padding: "20px 30px", borderRadius: 36, background: "#fff", boxShadow: "0 24px 50px -28px rgba(17,24,39,0.4)", border: "1px solid rgba(17,24,39,0.06)", opacity: Math.min(1, p * 1.6), transform: `translateX(${(1 - p) * -120}px)` }}>
              <span style={{ width: 84, height: 84, borderRadius: 26, background: C.amber100, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 46, flexShrink: 0 }}>{it.icon ?? "✓"}</span>
              <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 42, lineHeight: 1.15, color: C.ink }}>{it.text}</span>
            </div>
          );
        })}
      </div>
    </>
  );
};

const Steps: React.FC<{ beat: Extract<Beat, { kind: "steps" }>; timed: TimedBeat }> = ({ beat, timed }) => {
  const frame = useCurrentFrame();
  const { first, span } = spanOf(timed, beat.items.length);
  return (
    <>
      <PioPeek pose="think" />
      <Title text={beat.title} size={76} at={2} top={210} />
      <div style={{ position: "absolute", left: 70, right: 130, top: 640, display: "flex", flexDirection: "column", gap: 26 }}>
        {beat.items.map((it, i) => {
          const p = pop(frame, first + i * span - 6, { damping: 14, stiffness: 130 });
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 28, padding: "28px 34px", borderRadius: 40, background: "#fff", boxShadow: "0 24px 50px -28px rgba(17,24,39,0.4)", border: "1px solid rgba(17,24,39,0.06)", opacity: Math.min(1, p * 1.6), transform: `translateY(${(1 - p) * 80}px)` }}>
              <span style={{ width: 88, height: 88, borderRadius: 44, background: `linear-gradient(135deg, ${C.orange500}, ${C.amber400})`, color: "#fff", fontFamily: DISPLAY, fontWeight: 700, fontSize: 52, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</span>
              <span>
                <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 44, lineHeight: 1.15, color: C.ink }}>{it.text}</div>
                {it.sub ? <div style={{ fontFamily: FONT, fontSize: 32, color: C.body, marginTop: 6 }}>{it.sub}</div> : null}
              </span>
            </div>
          );
        })}
      </div>
    </>
  );
};

const Stat: React.FC<{ beat: Extract<Beat, { kind: "stat" }> }> = ({ beat }) => {
  const frame = useCurrentFrame();
  const p = pop(frame, 6, { damping: 11, stiffness: 120 });
  return (
    <>
      <div style={{ position: "absolute", left: 0, right: 0, top: 480, textAlign: "center", fontFamily: DISPLAY, fontWeight: 700, fontSize: 340, lineHeight: 1, color: C.orange500, transform: `scale(${0.5 + 0.5 * p})`, opacity: Math.min(1, p * 2), textShadow: "0 14px 0 rgba(151,60,0,0.15)" }}>{beat.value}</div>
      <div style={{ position: "absolute", left: 70, right: 70, top: 880, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 70, lineHeight: 1.1, color: useInk(), letterSpacing: "-0.03em", opacity: progress(frame, 16, 14) }}>{beat.label}</div>
      {beat.sub ? <div style={{ position: "absolute", left: 90, right: 310, top: 1010, textAlign: "center", fontFamily: FONT, fontSize: 36, lineHeight: 1.35, color: useInk("#e5e7eb", C.body), opacity: progress(frame, 28, 14) }}>{beat.sub}</div> : null}
      <PioStage pose="cheer" height={480} right={-10} bottom={440} at={10} />
    </>
  );
};

const Quiz: React.FC<{ beat: Extract<Beat, { kind: "quiz" }>; timed: TimedBeat }> = ({ beat, timed }) => {
  const frame = useCurrentFrame();
  const dark = useContext(DarkCtx);
  const revealAt = timed.voices[1]?.at ?? timed.frames - 60;
  const revealed = frame >= revealAt;
  const rev = pop(frame, revealAt, { damping: 12, stiffness: 140 });
  const seconds = Math.max(0, Math.ceil((revealAt - frame) / FPS));
  return (
    <>
      <div style={{ position: "absolute", left: 60, right: 120, top: 200, padding: "36px 40px", borderRadius: 44, background: "#fff", boxShadow: "0 30px 60px -28px rgba(17,24,39,0.4)", fontFamily: DISPLAY, fontWeight: 700, fontSize: 70, lineHeight: 1.15, color: C.ink, opacity: progress(frame, 0, 12), border: "1px solid rgba(17,24,39,0.06)" }}>{beat.question}</div>
      <div style={{ position: "absolute", left: 60, right: 120, top: 580, display: "flex", flexDirection: "column", gap: 22 }}>
        {beat.options.map((o, i) => {
          const p = pop(frame, 14 + i * 5, { damping: 14, stiffness: 140 });
          const good = revealed && i === beat.answer;
          const bad = revealed && i !== beat.answer;
          const fade = bad && dark;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 24, padding: "26px 32px", borderRadius: 36, border: `4px solid ${good ? "#22c55e" : "rgba(17,24,39,0.08)"}`, background: good ? "#dcfce7" : fade ? "rgba(255,255,255,0.14)" : "#fff", opacity: (bad && !dark ? 0.45 : 1) * Math.min(1, p * 1.6), transform: `scale(${(0.85 + 0.15 * p) * (good ? 1 + 0.05 * rev : 1)})`, boxShadow: "0 18px 40px -26px rgba(17,24,39,0.4)" }}>
              <span style={{ width: 76, height: 76, borderRadius: 38, background: good ? "#22c55e" : C.amber100, color: good ? "#fff" : C.amber800, fontFamily: DISPLAY, fontWeight: 700, fontSize: 46, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{good ? <Check size={46} strokeWidth={4} /> : "ABCD"[i]}</span>
              <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 52, color: fade ? "#cbd5e1" : C.ink }}>{o}</span>
            </div>
          );
        })}
      </div>
      {!revealed ? (
        <div style={{ position: "absolute", left: 60, top: 1230, display: "flex", alignItems: "center", gap: 18, fontFamily: FONT, fontWeight: 800, fontSize: 46, color: useInk("#fdba74", C.orange600) }}>
          <span style={{ width: 90, height: 90, borderRadius: 45, background: C.orange500, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: DISPLAY, fontSize: 56 }}>{seconds}</span>
          {beat.hint ?? "Réfléchis…"}
        </div>
      ) : (
        <div style={{ position: "absolute", left: 60, right: 380, top: 1230, fontFamily: FONT, fontWeight: 700, fontSize: 42, lineHeight: 1.25, color: useInk("#6ee7b7", C.emerald700), opacity: Math.min(1, rev * 1.5) }}>{beat.explain}</div>
      )}
      <PioStage pose={revealed ? "cheer" : "think"} height={500} right={-30} bottom={330} at={4} />
    </>
  );
};

const Board: React.FC<{ beat: Extract<Beat, { kind: "board" }>; timed: TimedBeat }> = ({ beat, timed }) => {
  const frame = useCurrentFrame();
  const { first, span } = spanOf(timed, beat.lines.length);
  return (
    <>
      <Title text={beat.title} size={74} at={2} top={230} />
      <div style={{ position: "absolute", left: 60, right: 120, top: 560, display: "flex", flexDirection: "column", gap: 22 }}>
        {beat.lines.map((l, i) => {
          const p = pop(frame, first + i * span - 6, { damping: 14, stiffness: 130 });
          return (
            <div key={i} style={{ padding: l.big ? "22px 34px" : "20px 34px", borderRadius: 34, background: l.big ? "#fff7ed" : "#ffffff", border: `3px solid ${l.big ? "#fdba74" : "rgba(17,24,39,0.07)"}`, boxShadow: "0 20px 44px -28px rgba(17,24,39,0.4)", opacity: Math.min(1, p * 1.6), transform: `translateX(${(1 - p) * -110}px)`, fontFamily: l.big ? DISPLAY : FONT, fontWeight: l.big ? 700 : 600, fontSize: l.big ? 66 : 42, lineHeight: 1.18, color: l.big ? C.orange600 : C.ink }}>
              {l.text}
            </div>
          );
        })}
      </div>
      <PioPeek pose="think" />
    </>
  );
};

/** Fin des vidéos pour enfants : un au revoir, sans appel à s'inscrire. */
const Outro: React.FC<{ beat: Extract<Beat, { kind: "outro" }> }> = ({ beat }) => {
  const frame = useCurrentFrame();
  const t = pop(frame, 4, { damping: 11, stiffness: 120 });
  return (
    <>
      <div style={{ position: "absolute", left: 60, right: 140, top: 330, textAlign: "center", fontFamily: DISPLAY, fontWeight: 700, fontSize: 118, lineHeight: 1.05, color: useInk("#fcd34d", C.orange600), transform: `scale(${0.6 + 0.4 * t}) rotate(${(1 - t) * -4}deg)`, opacity: Math.min(1, t * 2), textShadow: "0 10px 0 rgba(151,60,0,0.15)" }}>
        {beat.line ?? "À la prochaine vidéo !"}
      </div>
      <PioStage pose="cheer" height={900} right={80} bottom={330} at={6} />
    </>
  );
};

const Letter: React.FC<{ beat: Extract<Beat, { kind: "letter" }> }> = ({ beat }) => {
  const frame = useCurrentFrame();
  const p = pop(frame, 6, { damping: 12, stiffness: 110 });
  return (
    <>
      <div style={{ position: "absolute", left: 160, right: 160, top: 260, height: 800, borderRadius: 70, background: "#fff", boxShadow: "0 40px 80px -36px rgba(17,24,39,0.5)", display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${0.7 + 0.3 * p})`, opacity: Math.min(1, p * 2), border: "6px solid #fde68a" }}>
        <span style={{ fontFamily: ARABIC, fontSize: 400, lineHeight: 1.2, color: C.ink, marginTop: -30 }}>{beat.glyph}</span>
      </div>
      <div style={{ position: "absolute", left: 60, right: 60, top: 1100, textAlign: "center", fontFamily: DISPLAY, fontWeight: 700, fontSize: 96, color: "#fde68a", opacity: progress(frame, 18, 14) }}>{beat.name}</div>
      {beat.sound ? <div style={{ position: "absolute", left: 60, right: 60, top: 1230, textAlign: "center", fontFamily: FONT, fontWeight: 600, fontSize: 44, color: "#e5e7eb", opacity: progress(frame, 26, 14) }}>{beat.sound}</div> : null}
      <PioStage pose="recite" outfit="boubou" height={520} right={-30} bottom={400} at={10} />
    </>
  );
};

const CONFETTI = [
  { x: 120, y: 180, s: 40, c: "#fde047" }, { x: 900, y: 260, s: 52, c: "#bbf451" }, { x: 80, y: 1100, s: 46, c: "#ffffff" },
  { x: 930, y: 1180, s: 38, c: "#fde047" }, { x: 520, y: 140, s: 30, c: "#ffffff" }, { x: 960, y: 700, s: 34, c: "#ffffff" },
];

const Free: React.FC<{ beat: Extract<Beat, { kind: "free" }> }> = ({ beat }) => {
  const frame = useCurrentFrame();
  const word = pop(frame, 6, { damping: 11, stiffness: 120, mass: 0.9 });
  const subs = beat.sub ?? ["Les écoles", "Les professeurs", "Les parents"];
  return (
    <>
      <AbsoluteFill style={{ background: `linear-gradient(160deg, ${C.amber400}, ${C.orange500} 70%, ${C.orange600})` }} />
      {CONFETTI.map((c, i) => {
        const p = pop(frame, 10 + i * 3, { damping: 10, stiffness: 140 });
        return <div key={i} style={{ position: "absolute", left: c.x, top: c.y + drift(frame, 10, 3 + (i % 3), i), width: c.s, height: c.s, borderRadius: i % 2 ? c.s : 10, background: c.c, opacity: 0.9, transform: `scale(${p}) rotate(${i * 25 + frame * 0.6}deg)` }} />;
      })}
      <div style={{ position: "absolute", left: 0, right: 0, top: 290, textAlign: "center", fontFamily: DISPLAY, fontWeight: 600, fontSize: 64, color: "#fff", opacity: progress(frame, 0, 10) }}>Et le meilleur ?</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 400, textAlign: "center", fontFamily: DISPLAY, fontWeight: 700, fontSize: 224, lineHeight: 1, color: "#fff", textShadow: "0 14px 0 rgba(151,60,0,0.35)", transform: `scale(${0.4 + 0.6 * word}) rotate(${(1 - word) * -8 - 3}deg)`, opacity: Math.min(1, word * 2) }}>GRATUIT</div>
      <div style={{ position: "absolute", left: 60, right: 140, top: 700, textAlign: "center", fontFamily: FONT, fontWeight: 700, fontSize: 38, lineHeight: 1.25, color: "#fff", whiteSpace: "pre-line", opacity: progress(frame, 22, 12) }}>pendant le lancement{"\n"}pour l'année scolaire 2026-2027</div>
      <div style={{ position: "absolute", left: 90, right: 150, top: 850, display: "flex", flexDirection: "column", gap: 16 }}>
        {subs.map((t, i) => {
          const p = pop(frame, 30 + i * 8, { damping: 14, stiffness: 140 });
          return (
            <div key={t} style={{ display: "flex", alignItems: "center", gap: 20, padding: "16px 30px", borderRadius: 999, background: "#fff", color: C.ink, fontFamily: FONT, fontWeight: 700, fontSize: 42, opacity: Math.min(1, p * 1.6), transform: `translateX(${(1 - p) * -140}px)`, boxShadow: "0 18px 36px -18px rgba(151,60,0,0.6)", alignSelf: "flex-start" }}>
              <span style={{ width: 46, height: 46, borderRadius: 23, background: C.lime400, display: "flex", alignItems: "center", justifyContent: "center" }}><Check size={34} color="#fff" strokeWidth={4} /></span>
              {t}
            </div>
          );
        })}
      </div>
      <PioStage pose="cheer" height={620} right={-30} bottom={400} at={26} />
    </>
  );
};

const Cta: React.FC<{ beat: Extract<Beat, { kind: "cta" }> }> = ({ beat }) => {
  const frame = useCurrentFrame();
  const logo = pop(frame, 4, { damping: 13, stiffness: 120 });
  const cta = pop(frame, 30, { damping: 12, stiffness: 140 });
  const url = progress(frame, 46, 14, OUT);
  return (
    <>
      <Img src={staticFile("app/jotna-logo.png")} style={{ position: "absolute", left: 220, top: 190, width: 640, opacity: progress(frame, 4, 8), transform: `scale(${0.6 + 0.4 * logo}) rotate(${(1 - logo) * -5}deg)` }} />
      <div style={{ position: "absolute", left: 70, right: 70, top: 730, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 86, letterSpacing: "-0.035em", lineHeight: 1.06, color: C.ink, opacity: progress(frame, 14, 14) }}>{beat.line ?? "Apprendre devient un réflexe."}</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1000, display: "flex", justifyContent: "center", opacity: Math.min(1, cta * 1.5), transform: `scale(${0.7 + 0.3 * cta})` }}>
        <div style={{ padding: "26px 56px", borderRadius: 999, background: `linear-gradient(90deg, ${C.orange500}, ${C.amber400})`, color: "#fff", fontFamily: FONT, fontSize: 52, fontWeight: 800, boxShadow: "0 24px 50px -20px rgba(245,73,0,0.7)" }}>{beat.button ?? "Créez votre compte gratuit"}</div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1160, display: "flex", justifyContent: "center", opacity: url }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "20px 40px", borderRadius: 999, background: C.ink, color: "#fff", fontFamily: FONT, fontSize: 46, fontWeight: 700 }}>
          jotnaschool.com
        </div>
      </div>
      <PioStage pose="cheer" height={560} right={-20} bottom={330} at={34} />
    </>
  );
};

/** Bandeau « CM1 · Mathématiques » : l'enfant voit tout de suite si le cours est pour lui. */
const LevelChip: React.FC<{ text: string; tone?: string }> = ({ text, tone }) => {
  const frame = useCurrentFrame();
  const p = pop(frame, 2, { damping: 14, stiffness: 140 });
  const night = tone === "night";
  return (
    <div style={{ position: "absolute", left: 60, top: 158, padding: "12px 30px", borderRadius: 999, background: night ? "#fde68a" : C.ink, color: night ? C.ink : "#fff", fontFamily: DISPLAY, fontWeight: 700, fontSize: 38, letterSpacing: "0.01em", transform: `scale(${0.7 + 0.3 * p})`, transformOrigin: "left center", opacity: Math.min(1, p * 2), boxShadow: "0 14px 30px -16px rgba(16,24,40,0.6)" }}>
      {text}
    </div>
  );
};

const BeatView: React.FC<{ timed: TimedBeat; level?: string }> = ({ timed, level }) => {
  const b = timed.beat;
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      {b.kind !== "free" ? <Bg tone={b.tone ?? (b.kind === "letter" || b.kind === "board" && false ? "night" : "warm")} /> : null}
      <DarkCtx.Provider value={b.tone === "night"}>
      <AbsoluteFill style={{ transform: level ? "translateY(70px)" : undefined }}>
      {b.kind === "hook" ? <Hook beat={b} /> : null}
      {b.kind === "pio" ? <PioBeat beat={b} /> : null}
      {b.kind === "phone" ? <PhoneBeat beat={b} /> : null}
      {b.kind === "bullets" ? <Bullets beat={b} timed={timed} /> : null}
      {b.kind === "steps" ? <Steps beat={b} timed={timed} /> : null}
      {b.kind === "stat" ? <Stat beat={b} /> : null}
      {b.kind === "quiz" ? <Quiz beat={b} timed={timed} /> : null}
      {b.kind === "board" ? <Board beat={b} timed={timed} /> : null}
      {b.kind === "outro" ? <Outro beat={b} /> : null}
      {b.kind === "letter" ? <Letter beat={b} /> : null}
      {b.kind === "free" ? <Free beat={b} /> : null}
      {b.kind === "cta" ? <Cta beat={b} /> : null}
      </AbsoluteFill>
      </DarkCtx.Provider>
      {level ? <LevelChip text={level} tone={b.tone} /> : null}
      {timed.voices.map((x, i) => (
        <Sequence key={i} from={x.at} durationInFrames={x.frames + 6} layout="none">
          <Audio src={staticFile(`audio/social/${voiceKey(x.v)}.mp3`)} volume={1} />
        </Sequence>
      ))}
      <Sequence from={0} durationInFrames={20} layout="none">
        <Audio src={staticFile("sfx/whoosh.wav")} volume={0.35} />
      </Sequence>
    </AbsoluteFill>
  );
};

const musicVolume = (f: number, all: { at: number; frames: number }[]) => {
  let duck = 0;
  for (const c of all) duck = Math.max(duck, interpolate(f, [c.at - 8, c.at, c.at + c.frames, c.at + c.frames + 14], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  return 0.16 + (0.07 - 0.16) * duck;
};

export const Social: React.FC<{ id: string }> = ({ id }) => {
  const post = POSTS.find((p) => p.id === id);
  if (!post) throw new Error(`Publication inconnue : ${id}`);
  const { beats, total } = timeline(post);
  const allVoices = beats.flatMap((b) => b.voices.map((v) => ({ at: b.from + v.at, frames: v.frames })));
  const fadeOut = (f: number) => interpolate(f, [total - 45, total], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ backgroundColor: "#fff" }}>
      {beats.map((b, i) => (
        <Sequence key={i} from={b.from} durationInFrames={b.frames}>
          <BeatView timed={b} level={post.level} />
        </Sequence>
      ))}
      {post.music === "none" ? null : <Audio src={staticFile("audio/music/lets-play-africa-social.mp3")} volume={(f) => musicVolume(f, allVoices) * fadeOut(f)} loop />}
    </AbsoluteFill>
  );
};
