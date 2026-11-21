import React from "react";
import { AbsoluteFill, Audio, Img, Sequence, Series, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Check, Heart, Mail, School, Sparkles, Volume2 } from "lucide-react";
import { C, DISPLAY, FONT } from "../theme";
import { OUT, drift, pop, progress, tween } from "../lib/anim";
import { Backdrop } from "../components/backdrop";
import { BrandWipe, WIPE_CUT, WIPE_FRAMES } from "../components/wipe";
import { AndroidFrame, PhoneFrame } from "../components/frames";
import { ClickSounds, Cursor } from "../components/cursor";
import { Eyebrow, Headline, Lead } from "../components/typography";
import { Pio } from "../components/pio";
import { AndroidLogo, AppleLogo, PlatformBadge } from "../scenes/Students";
import { CampScreen, PH, PW, QuranPathScreen, ResultScreen, SessionScreen, TrailScreen } from "../screens/student";

/*
 * PUBLICITÉ « JOTNA, C'EST GRATUIT » (16:9, environ 51 s).
 *
 * Les voix (ElevenLabs, « Rachel », eleven_v4) sont dans audio-src/voice-ad/ ;
 * les durées ci-dessous sont leurs durées mesurées, arrondies au-dessus, en
 * images à 30 i/s. Un texte régénéré change sa durée : la corriger ici.
 */

export const AD_SCENES = {
  hook: 120,
  phones: 380,
  quran: 270,
  everyone: 270,
  free: 296,
  end: 270,
} as const;
export const AD_TOTAL_FRAMES = Object.values(AD_SCENES).reduce((a, b) => a + b, 0);

type Cue = { scene: keyof typeof AD_SCENES; at: number; file: string; frames: number; kind: "narration" | "app" };
export const AD_CUES: Cue[] = [
  { scene: "hook", at: 22, file: "voice-ad/a01_accroche", frames: 65, kind: "narration" },
  { scene: "phones", at: 14, file: "voice-ad/a02_app", frames: 159, kind: "narration" },
  { scene: "phones", at: 190, file: "voice-ad/a03_paliers", frames: 161, kind: "narration" },
  { scene: "quran", at: 14, file: "voice-ad/a04_arabe", frames: 89, kind: "narration" },
  { scene: "quran", at: 112, file: "voice-app/map_welcome", frames: 142, kind: "app" },
  { scene: "everyone", at: 14, file: "voice-ad/a05_tous", frames: 228, kind: "narration" },
  { scene: "free", at: 16, file: "voice-ad/a06_gratuit", frames: 240, kind: "narration" },
  { scene: "end", at: 22, file: "voice-ad/a07_fin", frames: 195, kind: "narration" },
];

const order = Object.keys(AD_SCENES) as (keyof typeof AD_SCENES)[];
const starts = order.reduce<Record<string, number>>((acc, id, i) => ({ ...acc, [id]: i === 0 ? 0 : acc[order[i - 1]] + AD_SCENES[order[i - 1]] }), {});
const boundaries = order.slice(1).map((id) => starts[id]);

const Voices: React.FC<{ scene: keyof typeof AD_SCENES }> = ({ scene }) => (
  <>
    {AD_CUES.filter((c) => c.scene === scene).map((c) => (
      <Sequence key={c.file} from={c.at} durationInFrames={c.frames + 4} layout="none">
        <Audio src={staticFile(`audio/${c.file}.mp3`)} volume={1} />
      </Sequence>
    ))}
  </>
);

// Musique discrète : 0,16 en continu (vers -32 LUFS), 0,07 sous une voix.
const MUSIC_BASE = 0.16;
const MUSIC_UNDER_VOICE = 0.07;
const musicVolume = (f: number) => {
  let duck = 0;
  for (const c of AD_CUES) {
    const a = starts[c.scene] + c.at;
    const b = a + c.frames;
    duck = Math.max(duck, interpolate(f, [a - 8, a, b, b + 14], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  }
  return MUSIC_BASE + (MUSIC_UNDER_VOICE - MUSIC_BASE) * duck;
};

/* ───────────── 1. Accroche ───────────── */

const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const logo = pop(frame, 4, { damping: 14, stiffness: 120 });
  const pioIn = progress(frame, 8, 24, OUT);
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <Backdrop tone="warm" delay={0} />
      <Img
        src={staticFile("app/jotna-logo.png")}
        style={{ position: "absolute", left: 110, top: 70, width: 250, opacity: progress(frame, 4, 8), transform: `scale(${0.7 + 0.3 * logo})`, transformOrigin: "left center" }}
      />
      <div style={{ position: "absolute", left: 110, top: 330 }}>
        <Headline
          words={["Et", "si", "apprendre", "devenait", { text: "un jeu ?", marker: "rgba(255,210,48,0.85)" }]}
          dot={false}
          delay={10}
          size={118}
          stagger={5}
          maxWidth={1200}
        />
      </div>
      <div style={{ position: "absolute", left: 1380, top: 260, opacity: pioIn, transform: `translateY(${(1 - pioIn) * 120}px)` }}>
        <Pio pose="hello" height={700} />
      </div>
    </AbsoluteFill>
  );
};

/* ───────────── 2. Les téléphones : Android et iPhone ───────────── */

const Tap: React.FC<{ at: number; x: number; y: number }> = ({ at, x, y }) => (
  <Cursor path={[{ f: at - 14, x: x + 30, y: y + 60 }, { f: at - 2, x, y }]} clicks={[at]} show={[at - 14, at + 14]} touch />
);

const ScreenIn: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const p = progress(frame, 0, 8);
  return <div style={{ position: "absolute", inset: 0, opacity: p, transform: `scale(${1.04 - 0.04 * p})` }}>{children}</div>;
};

const Shot: React.FC<{ from: number; frames: number; children: React.ReactNode }> = ({ from, frames, children }) => (
  <Sequence from={from} durationInFrames={frames} layout="none">
    <ScreenIn>{children}</ScreenIn>
  </Sequence>
);

const PhoneStage: React.FC<{ left: number; top: number; scale: number; enterAt: number; tilt: number; phase: number; children: React.ReactNode }> = ({
  left,
  top,
  scale,
  enterAt,
  tilt,
  phase,
  children,
}) => {
  const frame = useCurrentFrame();
  const enter = pop(frame, enterAt, { damping: 15, stiffness: 70 });
  return (
    <div
      style={{
        position: "absolute",
        left,
        top: top + drift(frame, 7, 4.5, phase),
        width: (PW + 26) * scale,
        height: (PH + 26) * scale,
        opacity: progress(frame, enterAt, 10),
        transform: `translateY(${(1 - enter) * 700}px) rotate(${(1 - enter) * 10 + tilt}deg)`,
        transformOrigin: "50% 60%",
      }}
    >
      {children}
    </div>
  );
};

const Phones: React.FC = () => {
  const S = 0.9;
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <Backdrop tone="sky" delay={0} />
      <div style={{ position: "absolute", left: 110, top: 230, width: 800 }}>
        <Eyebrow text="L'application des enfants" delay={6} />
        <div style={{ marginTop: 22 }}>
          <Headline
            words={["Sur", { text: "Android", marker: "rgba(163,230,53,0.75)" }, "et", { text: "iPhone", marker: "rgba(255,184,106,0.85)" }]}
            delay={10}
            size={104}
            stagger={5}
            maxWidth={700}
          />
        </div>
        <Lead delay={34} size={32} maxWidth={640} style={{ marginTop: 34 }}>
          Palier par palier, avec Pio : des étoiles, des niveaux et des trophées.
        </Lead>
        <div style={{ display: "flex", gap: 16, marginTop: 40 }}>
          <PlatformBadge os="Android" at={24} />
          <PlatformBadge os="iOS" at={30} />
        </div>
      </div>

      <PhoneStage left={1010} top={110} scale={S} enterAt={6} tilt={-2.5} phase={0}>
        <PhoneFrame scale={S} style={{ left: 0, top: 0 }}>
          <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
            <Shot from={0} frames={176}>
              <TrailScreen walkAt={10} cardAt={84} tapAt={140} />
              <Tap at={140} x={200} y={680} />
            </Shot>
            <Shot from={170} frames={210}>
              <SessionScreen pickAt={40} validateAt={64} />
              <Tap at={40} x={230} y={272} />
              <Tap at={64} x={200} y={583} />
            </Shot>
          </div>
        </PhoneFrame>
      </PhoneStage>

      <PhoneStage left={1440} top={150} scale={S} enterAt={14} tilt={2.5} phase={2}>
        <AndroidFrame scale={S} style={{ left: 0, top: 0 }}>
          <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
            <Shot from={0} frames={158}>
              <CampScreen tapAt={118} />
              <Tap at={118} x={200} y={581} />
            </Shot>
            <Shot from={150} frames={230}>
              <ResultScreen trophyAt={66} />
            </Shot>
          </div>
        </AndroidFrame>
      </PhoneStage>

      <Voices scene="phones" />
      <Sequence from={170 + 66} durationInFrames={50} layout="none">
        <Audio src={staticFile("app/sounds/correct.mp3")} volume={0.5} />
      </Sequence>
      <Sequence from={150 + 66} durationInFrames={50} layout="none">
        <Audio src={staticFile("app/sounds/badge.mp3")} volume={0.45} />
      </Sequence>
      <ClickSounds at={[118, 140, 170 + 40, 170 + 64]} volume={0.22} />
    </AbsoluteFill>
  );
};

/* ───────────── 3. L'application parle, même en arabe ───────────── */

const SALAM_LINE = "Salam ! Voici le chemin du Coran. Touche le bouton vert pour commencer ta leçon.";
const NBSP = String.fromCharCode(160);

const VoiceBubble: React.FC<{ at: number; frames: number }> = ({ at, frames }) => {
  const frame = useCurrentFrame();
  const enter = pop(frame, at - 6, { damping: 15, stiffness: 140 });
  const speaking = frame >= at && frame < at + frames;
  return (
    <div
      style={{
        position: "absolute",
        left: 1010,
        top: 180,
        width: 360,
        borderRadius: 26,
        background: "#ffffff",
        boxShadow: "0 30px 60px -24px rgba(17,24,39,0.45)",
        border: "1px solid rgba(17,24,39,0.06)",
        padding: "18px 20px 22px",
        transform: `scale(${0.8 + 0.2 * enter})`,
        opacity: Math.min(1, enter * 1.5),
        fontFamily: DISPLAY,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ width: 38, height: 38, borderRadius: 19, background: speaking ? "#059669" : "#d1fae5", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Volume2 size={20} color={speaking ? "#fff" : "#059669"} />
        </span>
        <span style={{ fontFamily: FONT, fontSize: 14, fontWeight: 700, letterSpacing: "0.06em", color: "#047857", textTransform: "uppercase", flex: 1 }}>La voix de l'app</span>
        <span style={{ display: "flex", gap: 3, alignItems: "center", height: 24 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} style={{ width: 4, borderRadius: 2, background: "#059669", height: speaking ? 6 + Math.abs(Math.sin(frame / 2.6 + i * 1.7)) * 18 : 4, opacity: speaking ? 1 : 0.4 }} />
          ))}
        </span>
      </div>
      <div style={{ marginTop: 14, fontSize: 26, fontWeight: 600, lineHeight: 1.3, color: C.ink, opacity: progress(frame, at, 8) }}>{`«${NBSP}${SALAM_LINE}${NBSP}»`}</div>
    </div>
  );
};

const Quran: React.FC = () => {
  const frame = useCurrentFrame();
  const welcome = AD_CUES.find((c) => c.scene === "quran" && c.kind === "app")!;
  const S = 1.0;
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <AbsoluteFill style={{ overflow: "hidden" }}>
        <Img
          src={staticFile("app/images/coran/zone-arabie.jpg")}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "blur(8px)", transform: `scale(${tween(frame, 0, 270, 1.08, 1.16)})` }}
        />
        <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(255,251,240,0.96) 0%, rgba(255,251,240,0.9) 32%, rgba(255,251,240,0.3) 56%, rgba(255,251,240,0) 72%)" }} />
      </AbsoluteFill>
      <div style={{ position: "absolute", left: 110, top: 270, width: 700 }}>
        <Eyebrow text="Arabe & Coran" delay={6} />
        <div style={{ marginTop: 22 }}>
          <Headline words={["Elle", "leur", { text: "parle", marker: "rgba(255,184,106,0.85)" }]} delay={10} size={110} stagger={5} maxWidth={700} />
        </div>
        <Lead delay={30} size={32} maxWidth={620} style={{ marginTop: 32 }}>
          Chaque consigne est lue à voix haute, en français comme en arabe.
        </Lead>
      </div>
      <PhoneStage left={1440} top={80} scale={S} enterAt={4} tilt={0} phase={1}>
        <PhoneFrame scale={S} style={{ left: 0, top: 0 }}>
          <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
            <ScreenIn>
              <QuranPathScreen descendEnd={70} walkAt={130} cardAt={196} tapAt={240} />
            </ScreenIn>
          </div>
        </PhoneFrame>
      </PhoneStage>
      <VoiceBubble at={welcome.at} frames={welcome.frames} />
      <Voices scene="quran" />
    </AbsoluteFill>
  );
};

/* ───────────── 4. Tout le monde y gagne ───────────── */

const ROLES = [
  { label: "Les parents", caption: "Suivent les progrès de leur enfant", icon: Heart, tint: C.lime100, fg: C.lime600, at: 14 },
  { label: "Les professeurs", caption: "Créent leurs exercices avec l'IA", icon: Sparkles, tint: C.amber100, fg: C.amber700, at: 84 },
  { label: "L'école", caption: "Organise ses classes et ses élèves", icon: School, tint: C.orange100, fg: C.orange600, at: 168 },
];

const Everyone: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <Backdrop tone="lime" delay={0} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 120, display: "flex", justifyContent: "center" }}>
        <Headline
          words={["Toute", "l'école", { text: "avance", marker: "rgba(187,244,81,0.85)" }, "ensemble"]}
          delay={4}
          size={92}
          stagger={5}
          align="center"
          maxWidth={1500}
        />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 420, display: "flex", justifyContent: "center", gap: 48 }}>
        {ROLES.map((r, i) => {
          const p = pop(frame, r.at, { damping: 14, stiffness: 120 });
          const Icon = r.icon;
          return (
            <div
              key={r.label}
              style={{
                width: 500,
                height: 420,
                borderRadius: 40,
                background: `linear-gradient(150deg, #ffffff, ${r.tint})`,
                border: "1px solid rgba(17,24,39,0.06)",
                boxShadow: "0 36px 70px -32px rgba(17,24,39,0.4)",
                padding: 44,
                opacity: Math.min(1, p * 1.5),
                transform: `translateY(${(1 - p) * 90}px) scale(${0.8 + 0.2 * p}) rotate(${(i - 1) * 1.2}deg)`,
              }}
            >
              <span style={{ width: 96, height: 96, borderRadius: 28, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 12px 24px -12px rgba(17,24,39,0.4)" }}>
                <Icon size={52} color={r.fg} strokeWidth={2.2} />
              </span>
              <div style={{ marginTop: 34, fontSize: 52, fontWeight: 800, letterSpacing: "-0.03em", color: C.ink }}>{r.label}</div>
              <div style={{ marginTop: 14, fontSize: 30, lineHeight: 1.35, color: C.body }}>{r.caption}</div>
            </div>
          );
        })}
      </div>
      <Voices scene="everyone" />
    </AbsoluteFill>
  );
};

/* ───────────── 5. Gratuit ───────────── */

const CONFETTI = [
  { x: 180, y: 160, s: 34, c: "#fde047" },
  { x: 1700, y: 200, s: 44, c: "#bbf451" },
  { x: 300, y: 820, s: 52, c: "#ffffff" },
  { x: 1560, y: 860, s: 36, c: "#fde047" },
  { x: 940, y: 90, s: 28, c: "#ffffff" },
  { x: 1780, y: 520, s: 30, c: "#ffffff" },
  { x: 110, y: 470, s: 38, c: "#bbf451" },
];

const Free: React.FC = () => {
  const frame = useCurrentFrame();
  const word = pop(frame, 8, { damping: 11, stiffness: 120, mass: 0.9 });
  const sub = progress(frame, 70, 18, OUT);
  const pioIn = progress(frame, 24, 22, OUT);
  return (
    <AbsoluteFill style={{ fontFamily: FONT, background: `linear-gradient(135deg, ${C.amber400}, ${C.orange500} 70%, ${C.orange600})`, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: -200, top: 360, width: 900, height: 900, borderRadius: "50%", background: "rgba(255,255,255,0.14)", filter: "blur(10px)" }} />
      {CONFETTI.map((c, i) => {
        const p = pop(frame, 14 + i * 3, { damping: 10, stiffness: 140 });
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: c.x,
              top: c.y + drift(frame, 10, 3 + (i % 3), i),
              width: c.s,
              height: c.s,
              borderRadius: i % 2 ? c.s : 8,
              background: c.c,
              opacity: 0.9,
              transform: `scale(${p}) rotate(${i * 25 + frame * 0.6}deg)`,
            }}
          />
        );
      })}
      <div style={{ position: "absolute", left: 0, right: 0, top: 150, textAlign: "center", color: "#fff", fontSize: 44, fontWeight: 700, letterSpacing: "0.02em", opacity: progress(frame, 2, 12) }}>
        Et le meilleur ?
      </div>
      <div style={{ position: "absolute", left: 110, right: 110, top: 250, textAlign: "center" }}>
        <div
          style={{
            display: "inline-block",
            fontFamily: DISPLAY,
            fontWeight: 700,
            fontSize: 330,
            lineHeight: 1,
            letterSpacing: "-0.02em",
            color: "#ffffff",
            textShadow: "0 18px 0 rgba(151,60,0,0.35)",
            transform: `scale(${0.4 + 0.6 * word}) rotate(${(1 - word) * -8 - 3}deg)`,
            opacity: Math.min(1, word * 2),
          }}
        >
          GRATUIT
        </div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 590, textAlign: "center", color: "#fff", fontSize: 40, fontWeight: 700, opacity: progress(frame, 40, 14, OUT) }}>
        pendant le lancement, pour l'année scolaire 2026-2027
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 680, display: "flex", justifyContent: "center", gap: 22, opacity: sub, transform: `translateY(${(1 - sub) * 24}px)` }}>
        {["Les écoles", "Les professeurs", "Les parents"].map((t, i) => (
          <div key={t} style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 30px", borderRadius: 999, background: "#fff", color: C.ink, fontSize: 34, fontWeight: 700, boxShadow: "0 18px 36px -18px rgba(151,60,0,0.6)", transform: `translateY(${Math.sin((frame + i * 9) / 12) * 3}px)` }}>
            <span style={{ width: 38, height: 38, borderRadius: 19, background: C.lime400, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Check size={24} color="#fff" strokeWidth={4} />
            </span>
            {t}
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 830, display: "flex", justifyContent: "center", alignItems: "center", gap: 18, color: "#fff", fontSize: 30, fontWeight: 600, opacity: progress(frame, 100, 18, OUT) }}>
        <AndroidLogo size={34} color="#fff" /> Android <span style={{ opacity: 0.6 }}>·</span> <AppleLogo size={30} /> iPhone
      </div>
      <div style={{ position: "absolute", left: 1480, top: 470, opacity: pioIn, transform: `translateY(${(1 - pioIn) * 90}px)` }}>
        <Pio pose="cheer" height={560} />
      </div>
      <Voices scene="free" />
    </AbsoluteFill>
  );
};

/* ───────────── 6. Fin ───────────── */

const End: React.FC = () => {
  const frame = useCurrentFrame();
  const logo = pop(frame, 20, { damping: 13, stiffness: 120 });
  const cta = pop(frame, 126, { damping: 12, stiffness: 140 });
  const url = progress(frame, 150, 16, OUT);
  const mail = progress(frame, 176, 16, OUT);
  const pioIn = progress(frame, 40, 22, OUT);
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <Backdrop tone="warm" delay={6} />
      <Img
        src={staticFile("app/jotna-logo.png")}
        style={{ position: "absolute", left: 960 - 250, top: 70, width: 500, opacity: progress(frame, 20, 8), transform: `scale(${0.6 + 0.4 * logo}) rotate(${(1 - logo) * -5}deg)` }}
      />
      <div style={{ position: "absolute", left: 0, right: 0, top: 410, display: "flex", justifyContent: "center" }}>
        <Headline words={["Apprendre", "devient", { text: "un réflexe", marker: "rgba(255,184,106,0.85)" }]} delay={64} size={98} stagger={6} align="center" maxWidth={1600} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 640, display: "flex", justifyContent: "center", opacity: Math.min(1, cta * 1.5), transform: `scale(${0.7 + 0.3 * cta})` }}>
        <div style={{ padding: "20px 46px", borderRadius: 999, background: `linear-gradient(90deg, ${C.orange500}, ${C.amber400})`, color: "#fff", fontSize: 44, fontWeight: 800, boxShadow: "0 24px 50px -20px rgba(245,73,0,0.7)" }}>
          Créez votre compte gratuit
        </div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 800, display: "flex", justifyContent: "center", opacity: url, transform: `translateY(${(1 - url) * 20}px)` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 34px", borderRadius: 999, background: C.ink, color: "#fff", fontSize: 38, fontWeight: 700, boxShadow: "0 18px 40px -16px rgba(16,24,40,0.7)" }}>
          jotnaschool.com
          <span style={{ opacity: 0.4 }}>|</span>
          <AndroidLogo size={34} /> <AppleLogo size={30} />
        </div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 925, display: "flex", justifyContent: "center", alignItems: "center", gap: 10, fontSize: 24, color: C.body, opacity: mail }}>
        <Mail size={22} /> contact@jotnaschool.com
      </div>
      <div style={{ position: "absolute", left: 1450, top: 470, opacity: pioIn, transform: `translateY(${(1 - pioIn) * 80}px)` }}>
        <Pio pose="cheer" height={560} />
      </div>
      <Voices scene="end" />
    </AbsoluteFill>
  );
};

/* ───────────── Montage ───────────── */

const COMPONENTS: Record<keyof typeof AD_SCENES, React.FC> = { hook: Hook, phones: Phones, quran: Quran, everyone: Everyone, free: Free, end: End };

export const Ad: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#ffffff" }}>
    <Series>
      {order.map((id) => {
        const Scene = COMPONENTS[id];
        return (
          <Series.Sequence key={id} durationInFrames={AD_SCENES[id]}>
            <Scene />
          </Series.Sequence>
        );
      })}
    </Series>
    {boundaries.map((b) => (
      <Sequence key={b} from={b - WIPE_CUT} durationInFrames={WIPE_FRAMES}>
        <BrandWipe />
        <Audio src={staticFile("sfx/whoosh.wav")} volume={0.7} />
      </Sequence>
    ))}
    <Audio src={staticFile("audio/music/lets-play-africa-ad.mp3")} volume={musicVolume} />
  </AbsoluteFill>
);
