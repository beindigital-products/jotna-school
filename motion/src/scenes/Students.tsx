import React from "react";
import { AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Volume2 } from "lucide-react";
import { ARABIC, C, DISPLAY, FONT } from "../theme";
import { IN_OUT, OUT, pop, progress, tween } from "../lib/anim";
import { ChapterText } from "../components/chapter";
import { ClickSounds, Cursor } from "../components/cursor";
import { PhoneFrame } from "../components/frames";
import { PopIn } from "../components/ui";
import { STUDENT_TIMING, VoiceCues } from "../voice";
import {
  APP_VOICE_FRAMES,
  CampScreen,
  LessonScreen,
  PH,
  PW,
  QuranPathScreen,
  ResultScreen,
  SessionScreen,
  SplashScreen,
  TrailScreen,
} from "../screens/student";

const T = STUDENT_TIMING;
const Q = T.quran[0];
const L = T.lesson[0];

const TAP = {
  camp: 118,
  trailCard: 84,
  trailGo: 140,
  pick: 40,
  validate: 64,
  trophy: 66,
};

export const STUDENTS_FRAMES = T.total;

const ScreenIn: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const p = progress(frame, 0, 8);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: p, transform: `scale(${1.04 - 0.04 * p})` }}>{children}</div>
  );
};

const Shot: React.FC<{ at: readonly [number, number]; children: React.ReactNode }> = ({ at, children }) => (
  <Sequence from={at[0]} durationInFrames={at[1]} layout="none">
    <ScreenIn>{children}</ScreenIn>
  </Sequence>
);

/** Un doigt qui touche l'écran du téléphone (coordonnées en points iOS). */
const Tap: React.FC<{ at: number; x: number; y: number }> = ({ at, x, y }) => (
  <Cursor path={[{ f: at - 14, x: x + 30, y: y + 60 }, { f: at - 2, x, y }]} clicks={[at]} show={[at - 14, at + 14]} touch />
);

const Backgrounds: React.FC = () => {
  const frame = useCurrentFrame();
  const dusk = progress(frame, Q - 10, 30, IN_OUT);
  const drift = tween(frame, 0, STUDENTS_FRAMES, 1.08, 1.18);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Img
        src={staticFile("app/images/world/hub-savanna-wide.jpg")}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "blur(5px) saturate(1.05)", transform: `scale(${drift})` }}
      />
      <Img
        src={staticFile("app/images/coran/zone-arabie.jpg")}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "blur(8px)", opacity: dusk, transform: `scale(${drift})` }}
      />
      <AbsoluteFill
        style={{
          background: "linear-gradient(90deg, rgba(255,251,240,0.96) 0%, rgba(255,251,240,0.9) 30%, rgba(255,251,240,0.35) 52%, rgba(255,251,240,0) 70%)",
        }}
      />
    </AbsoluteFill>
  );
};

// Logos des plateformes, tracés de Simple Icons 16.34 (licence CC0) ; les marques
// appartiennent à Apple Inc. et à Google LLC. Le vert est celui de la charte Android.
const AppleLogo: React.FC<{ size: number; color?: string }> = ({ size, color = "#ffffff" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-label="Apple">
    <path
      fill={color}
      d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
    />
  </svg>
);

const AndroidLogo: React.FC<{ size: number; color?: string }> = ({ size, color = "#3DDC84" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-label="Android">
    <path
      fill={color}
      d="M18.4395 5.5586c-.675 1.1664-1.352 2.3318-2.0274 3.498-.0366-.0155-.0742-.0286-.1113-.043-1.8249-.6957-3.484-.8-4.42-.787-1.8551.0185-3.3544.4643-4.2597.8203-.084-.1494-1.7526-3.021-2.0215-3.4864a1.1451 1.1451 0 0 0-.1406-.1914c-.3312-.364-.9054-.4859-1.379-.203-.475.282-.7136.9361-.3886 1.5019 1.9466 3.3696-.0966-.2158 1.9473 3.3593.0172.031-.4946.2642-1.3926 1.0177C2.8987 12.176.452 14.772 0 18.9902h24c-.119-1.1108-.3686-2.099-.7461-3.0683-.7438-1.9118-1.8435-3.2928-2.7402-4.1836a12.1048 12.1048 0 0 0-2.1309-1.6875c.6594-1.122 1.312-2.2559 1.9649-3.3848.2077-.3615.1886-.7956-.0079-1.1191a1.1001 1.1001 0 0 0-.8515-.5332c-.5225-.0536-.9392.3128-1.0488.5449zm-.0391 8.461c.3944.5926.324 1.3306-.1563 1.6503-.4799.3197-1.188.0985-1.582-.4941-.3944-.5927-.324-1.3307.1563-1.6504.4727-.315 1.1812-.1086 1.582.4941zM7.207 13.5273c.4803.3197.5506 1.0577.1563 1.6504-.394.5926-1.1038.8138-1.584.4941-.48-.3197-.5503-1.0577-.1563-1.6504.4008-.6021 1.1087-.8106 1.584-.4941z"
    />
  </svg>
);

/** Pastille de plateforme : l'app élève existe sur iOS et sur Android. */
const PlatformBadge: React.FC<{ os: string; at: number }> = ({ os, at }) => (
  <PopIn at={at} from={0.7}>
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 20px 10px 14px",
        borderRadius: 16,
        background: C.ink,
        color: "#fff",
        boxShadow: "0 14px 30px -14px rgba(16,24,40,0.7)",
      }}
    >
      {os === "iOS" ? <AppleLogo size={30} /> : <AndroidLogo size={34} />}
      <div>
        <div style={{ fontSize: 13, opacity: 0.75, fontWeight: 500, lineHeight: 1.1 }}>Application</div>
        <div style={{ fontSize: 26, fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.01em" }}>{os}</div>
      </div>
    </div>
  </PopIn>
);

// Espace insécable des guillemets français (écrit par son code, pas en caractère invisible).
const NBSP = String.fromCharCode(160);

// Ce que dit la voix de l'application, sous-titré à côté du téléphone.
const LINES = [
  { at: Q + T.path.welcomeAt, frames: APP_VOICE_FRAMES.map_welcome, text: "Salam ! Voici le chemin du Coran. Touche le bouton vert pour commencer ta leçon." },
  { at: L + T.lessonCues.meetAt, frames: APP_VOICE_FRAMES.meet, text: "Voici une nouvelle lettre ! Écoute bien son nom." },
  { at: L + T.lessonCues.jimAt, frames: APP_VOICE_FRAMES.jim, text: "جِيم", arabic: true, note: "djîm, le nom de la lettre" },
  { at: L + T.lessonCues.repeatAt, frames: APP_VOICE_FRAMES.repeat, text: "À toi ! Appuie sur le micro, et dis-la bien fort." },
  { at: L + T.lessonCues.successAt + 2, frames: APP_VOICE_FRAMES.bravo_2, text: "MashaAllah, c'est ça !" },
];

const VoiceCaption: React.FC = () => {
  const frame = useCurrentFrame();
  const first = LINES[0].at - 8;
  if (frame < first) return null;
  const current = [...LINES].reverse().find((l) => frame >= l.at) ?? LINES[0];
  const speaking = frame >= current.at && frame < current.at + current.frames;
  const enter = pop(frame, first, { damping: 15, stiffness: 140 });
  const swap = progress(frame, current.at, 8);
  return (
    <div
      style={{
        position: "absolute",
        left: 1548,
        top: 360,
        width: 330,
        borderRadius: 26,
        background: "#ffffff",
        boxShadow: "0 30px 60px -24px rgba(17,24,39,0.45)",
        border: "1px solid rgba(17,24,39,0.06)",
        padding: "18px 20px 20px",
        transform: `scale(${0.8 + 0.2 * enter})`,
        opacity: Math.min(1, enter * 1.5),
        fontFamily: DISPLAY,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ width: 38, height: 38, borderRadius: 19, background: speaking ? "#059669" : "#d1fae5", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Volume2 size={20} color={speaking ? "#fff" : "#059669"} />
        </span>
        <span style={{ fontFamily: FONT, fontSize: 14, fontWeight: 700, letterSpacing: "0.06em", color: "#047857", textTransform: "uppercase", flex: 1 }}>
          La voix de l'app
        </span>
        <span style={{ display: "flex", gap: 3, alignItems: "center", height: 24 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              style={{
                width: 4,
                borderRadius: 2,
                background: "#059669",
                height: speaking ? 6 + Math.abs(Math.sin(frame / 2.6 + i * 1.7)) * 18 : 4,
                opacity: speaking ? 1 : 0.4,
              }}
            />
          ))}
        </span>
      </div>
      <div style={{ marginTop: 14, opacity: (speaking ? 1 : 0.55) * swap, transform: `translateY(${(1 - swap) * 8}px)` }}>
        {current.arabic ? (
          <>
            {/* Le ج d'Amiri descend sous la ligne : hauteur réservée, puis la légende. */}
            <div style={{ height: 92, display: "flex", alignItems: "flex-start", justifyContent: "center" }}>
              <span style={{ fontFamily: ARABIC, fontSize: 54, lineHeight: 1, color: C.ink }}>{current.text}</span>
            </div>
            <div style={{ fontSize: 17, fontWeight: 600, color: C.muted, textAlign: "center" }}>{current.note}</div>
          </>
        ) : (
          <div style={{ fontSize: 25, fontWeight: 600, lineHeight: 1.3, color: C.ink }}>{`«${NBSP}${current.text}${NBSP}»`}</div>
        )}
      </div>
    </div>
  );
};

export const StudentsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const enter = pop(frame, 0, { damping: 15, stiffness: 70 });
  const fade = progress(frame, 0, 10);
  // Petits rapprochements de caméra sur les moments forts.
  const zoom =
    1 +
    0.05 * progress(frame, T.session[0] + TAP.validate, 14, OUT) * (1 - progress(frame, T.session[0] + TAP.validate + 56, 20, IN_OUT)) +
    0.04 * progress(frame, T.result[0] + 10, 20, IN_OUT) * (1 - progress(frame, T.result[1] + T.result[0] - 20, 20, IN_OUT));
  const tilt = Math.sin(frame / 70) * 2.2;
  const scale = 1.1;
  const left = 1050;
  const top = 58;
  const lc = T.lessonCues;
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <Backgrounds />
      <ChapterText
        index="05"
        eyebrow="Les élèves"
        title={["Une", "app", "iOS", "et", { text: "Android", marker: "rgba(255,184,106,0.85)" }]}
        lead="Le Monde de Pio : chaque élève avance palier par palier, avec Pio."
        extra={
          <div style={{ display: "flex", gap: 14 }}>
            <PlatformBadge os="iOS" at={34} />
            <PlatformBadge os="Android" at={40} />
          </div>
        }
        bullets={[
          { text: "Le Camp et la carte des mondes", at: 70 },
          { text: "Des paliers de 10 exercices", at: T.trail[0] + 40 },
          { text: "Cinq formats d'exercices", at: T.session[0] + 20 },
          { text: "Étoiles, niveaux et trophées", at: T.result[0] + 20 },
          { text: "Arabe & Coran : consignes lues à voix haute", at: Q + 20 },
        ]}
        delay={10}
        width={520}
        size={70}
        accent={C.orange500}
        style={{ left: 110, top: 200 }}
      />
      <div style={{ position: "absolute", inset: 0, perspective: 2400 }}>
        <div
          style={{
            position: "absolute",
            left,
            top,
            width: (PW + 26) * scale,
            height: (PH + 26) * scale,
            opacity: fade,
            transform: `translateY(${(1 - enter) * 700}px) rotate(${(1 - enter) * 10}deg) rotateY(${-6 + tilt}deg) scale(${zoom})`,
            transformOrigin: "50% 60%",
          }}
        >
          <PhoneFrame scale={scale} style={{ left: 0, top: 0 }}>
            <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
              <Shot at={T.splash}>
                <SplashScreen />
              </Shot>
              <Shot at={T.camp}>
                <CampScreen tapAt={TAP.camp} />
                <Tap at={TAP.camp} x={200} y={581} />
              </Shot>
              <Shot at={T.trail}>
                <TrailScreen walkAt={10} cardAt={TAP.trailCard} tapAt={TAP.trailGo} />
                <Tap at={TAP.trailGo} x={200} y={680} />
              </Shot>
              <Shot at={T.session}>
                <SessionScreen pickAt={TAP.pick} validateAt={TAP.validate} />
                <Tap at={TAP.pick} x={230} y={272} />
                <Tap at={TAP.validate} x={200} y={583} />
              </Shot>
              <Shot at={T.result}>
                <ResultScreen trophyAt={TAP.trophy} />
              </Shot>
              <Shot at={T.quran}>
                <QuranPathScreen descendEnd={T.path.descendEnd} walkAt={T.path.walkAt} cardAt={T.path.cardAt} tapAt={T.path.tapAt} />
                <Tap at={T.path.tapAt} x={228} y={680} />
              </Shot>
              <Shot at={T.lesson}>
                <LessonScreen
                  meetAt={lc.meetAt}
                  jimAt={lc.jimAt}
                  repeatAt={lc.repeatAt}
                  micAt={lc.micAt}
                  verifyAt={lc.verifyAt}
                  successAt={lc.successAt}
                />
                <Tap at={lc.micAt} x={195} y={632} />
              </Shot>
            </div>
          </PhoneFrame>
        </div>
      </div>
      <VoiceCaption />
      <VoiceCues scene="students" />
      <Sequence from={T.session[0] + TAP.validate + 2} durationInFrames={50} layout="none">
        <Audio src={staticFile("app/sounds/correct.mp3")} volume={0.5} />
      </Sequence>
      <Sequence from={T.result[0] + TAP.trophy} durationInFrames={50} layout="none">
        <Audio src={staticFile("app/sounds/badge.mp3")} volume={0.45} />
      </Sequence>
      <Sequence from={L + lc.successAt} durationInFrames={50} layout="none">
        <Audio src={staticFile("app/sounds/correct.mp3")} volume={0.45} />
      </Sequence>
      <ClickSounds
        at={[T.camp[0] + TAP.camp, T.trail[0] + TAP.trailGo, T.session[0] + TAP.pick, T.session[0] + TAP.validate, Q + T.path.tapAt, L + lc.micAt]}
        volume={0.22}
      />
    </AbsoluteFill>
  );
};
