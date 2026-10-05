import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { ArrowRight } from "lucide-react";
import { C, FONT } from "../theme";
import { IN_OUT, OUT, progress, tween } from "../lib/anim";
import { Backdrop } from "../components/backdrop";
import { BrowserFrame } from "../components/frames";
import { ChapterText } from "../components/chapter";
import { ClickSounds, Cursor } from "../components/cursor";
import { VoiceCues } from "../voice";

// Capture pleine page de la landing (1440 px de large, échelle 2), prise sur
// le serveur de dev avec Playwright. Hauteurs des sections relevées au même moment.
const PAGE_W = 1440;
const PAGE_H = 5615;

const BROWSER = { left: 600, top: 108, width: 1236, height: 864 };
const K = BROWSER.width / PAGE_W;

const LINKS = ["Accueil", "Comment ça marche", "Exercices", "Pour qui", "FAQ"];

// Défilements successifs (image de départ, durée, position en px CSS).
const SCROLLS = [
  { at: 72, to: 700 },
  { at: 130, to: 1340 },
  { at: 186, to: 2400 },
  { at: 244, to: 3110 },
];

const scrollAt = (frame: number) => {
  let y = 0;
  for (const s of SCROLLS) {
    y = interpolate(frame, [s.at, s.at + 26], [y, s.to], {
      easing: IN_OUT,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  }
  return y;
};

const activeLink = (frame: number) => (frame < 72 ? 0 : frame < 130 ? 1 : frame < 186 ? 2 : 3);

/** Barre de navigation recréée (components/landing/navbar.tsx), collée en haut comme sur le site. */
const Navbar: React.FC<{ active: number; since: number }> = ({ active, since }) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: PAGE_W,
        height: 97,
        background: "rgba(255,255,255,0.97)",
        borderBottom: `1px solid ${C.line}`,
        fontFamily: FONT,
      }}
    >
      <div
        style={{
          width: 1280,
          margin: "0 auto",
          height: 96,
          padding: "0 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Img src={staticFile("app/jotna-logo.png")} style={{ height: 80, width: "auto" }} />
        <div style={{ display: "flex", gap: 32, fontSize: 16, fontWeight: 500 }}>
          {LINKS.map((l, i) => {
            const on = i === active;
            const grow = on ? progress(frame, since, 12) : 0;
            return (
              <div key={l} style={{ position: "relative", padding: "6px 0", color: on ? C.ink : "#4a5565" }}>
                {l}
                <span
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: -2,
                    height: 2,
                    borderRadius: 2,
                    background: C.amber500,
                    transform: `scaleX(${i === 0 && since === 0 ? 1 : grow})`,
                  }}
                />
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ padding: "10px 20px", fontSize: 16, fontWeight: 600, color: C.slate }}>Se connecter</div>
          <div
            style={{
              padding: "10px 20px",
              fontSize: 16,
              fontWeight: 600,
              color: "#fff",
              background: C.ink,
              borderRadius: 999,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            Se connecter <ArrowRight size={16} />
          </div>
        </div>
      </div>
    </div>
  );
};

export const Landing: React.FC = () => {
  const frame = useCurrentFrame();
  const enter = progress(frame, 0, 34, OUT);
  const y = scrollAt(frame);
  const active = activeLink(frame);
  const since = [0, 72, 130, 186][active];
  const rotY = -9 + (1 - enter) * -16 + Math.sin(frame / 50) * 0.6;
  // Légère avancée de caméra sur toute la scène.
  const push = tween(frame, 0, 360, 1, 1.035);
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <Backdrop tone="cream" />
      <ChapterText
        index="01"
        eyebrow="Le site"
        title={["Jotna,", "expliqué", "en", "une", { text: "page", marker: "rgba(255,210,48,0.8)" }]}
        lead="La méthode, les exercices et l'espace de chacun, sur jotnaschool.com."
        bullets={[
          { text: "Trois étapes pour démarrer", at: 84 },
          { text: "Cinq formats d'exercices", at: 142 },
          { text: "Un espace pour chaque rôle", at: 198 },
          { text: "Maîtrise, badges et séries", at: 256 },
        ]}
        delay={6}
        width={440}
        size={58}
        style={{ left: 110, top: 250 }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          perspective: 2200,
          transform: `scale(${push})`,
          transformOrigin: "75% 50%",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: BROWSER.left,
            top: BROWSER.top,
            width: BROWSER.width,
            height: BROWSER.height,
            opacity: enter,
            transform: `translateX(${(1 - enter) * 380}px) rotateY(${rotY}deg) rotateX(2deg)`,
            transformOrigin: "0% 50%",
          }}
        >
          <BrowserFrame width={BROWSER.width} height={BROWSER.height} url="jotnaschool.com" style={{ left: 0, top: 0 }}>
            <div style={{ position: "absolute", left: 0, top: 0, width: PAGE_W, height: PAGE_H, transform: `scale(${K})`, transformOrigin: "0 0" }}>
              <Img
                src={staticFile("shots/landing-full.png")}
                style={{ position: "absolute", left: 0, top: -y, width: PAGE_W, height: PAGE_H }}
              />
              <Navbar active={active} since={since} />
              <Cursor
                path={[
                  { f: 46, x: 760, y: 520 },
                  { f: 66, x: 531, y: 50 },
                  { f: 116, x: 600, y: 120 },
                  { f: 124, x: 688, y: 50 },
                  { f: 172, x: 760, y: 130 },
                  { f: 180, x: 790, y: 50 },
                  { f: 226, x: 900, y: 520 },
                  { f: 330, x: 980, y: 560 },
                ]}
                clicks={[69, 127, 183]}
                show={[46, 336]}
                scale={1.15}
              />
            </div>
          </BrowserFrame>
        </div>
      </div>
      <ClickSounds at={[69, 127, 183]} />
      <VoiceCues scene="landing" />
    </AbsoluteFill>
  );
};
