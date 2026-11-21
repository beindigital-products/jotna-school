import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { C, DISPLAY, FONT } from "../theme";
import { Pio } from "../components/pio";
import { POSTS } from "./Social";

/*
 * Cartes des carrousels (Instagram, Facebook, TikTok photo) : 1080 × 1350.
 * Une carte = un texte court, un fond de la charte, Pio en pied. La première
 * porte le logo, la dernière l'appel à créer un compte.
 */

export const SLIDE_W = 1080;
export const SLIDE_H = 1350;

const POSES = ["hello", "cheer", "think", "amazed", "encourage", "cheer", "idle"] as const;

export const SocialSlide: React.FC<{ id: string; index: number }> = ({ id, index }) => {
  const post = POSTS.find((p) => p.id === id);
  const slide = post?.slides?.[index];
  if (!post || !slide) throw new Error(`Carte inconnue : ${id} #${index}`);
  const last = index === (post.slides?.length ?? 1) - 1;
  const first = index === 0;
  const accent = slide.accent ?? C.orange500;
  return (
    <AbsoluteFill style={{ fontFamily: FONT, background: `linear-gradient(165deg, #fff8ec, #fde7a8 55%, #ffd6a7)`, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: -200, top: 760, width: 700, height: 700, borderRadius: "50%", background: "rgba(254,215,170,0.6)", filter: "blur(90px)" }} />
      <div style={{ position: "absolute", right: -200, top: -100, width: 640, height: 640, borderRadius: "50%", background: "rgba(217,249,157,0.6)", filter: "blur(90px)" }} />
      <div style={{ position: "absolute", left: 0, top: 0, width: 26, height: "100%", background: accent }} />
      {first || last ? (
        <Img src={staticFile("app/jotna-logo.png")} style={{ position: "absolute", left: 80, top: 70, width: first ? 330 : 260 }} />
      ) : (
        <div style={{ position: "absolute", left: 80, top: 90, fontFamily: DISPLAY, fontWeight: 700, fontSize: 44, color: accent }}>
          {index} / {(post.slides?.length ?? 1) - 1}
        </div>
      )}
      <div style={{ position: "absolute", left: 80, right: 80, top: first ? 420 : 300, fontWeight: 800, fontSize: first ? 104 : 96, lineHeight: 1.05, letterSpacing: "-0.035em", color: C.ink }}>{slide.title}</div>
      {slide.body ? (
        <div style={{ position: "absolute", left: 80, right: 330, top: first ? 860 : 780, fontWeight: 500, fontSize: 52, lineHeight: 1.3, color: C.body }}>{slide.body}</div>
      ) : null}
      {last ? (
        <div style={{ position: "absolute", left: 80, bottom: 90, padding: "24px 52px", borderRadius: 999, background: `linear-gradient(90deg, ${C.orange500}, ${C.amber400})`, color: "#fff", fontWeight: 800, fontSize: 48 }}>jotnaschool.com</div>
      ) : (
        <div style={{ position: "absolute", left: 80, bottom: 90, width: 600, fontWeight: 700, fontSize: 30, lineHeight: 1.25, color: C.muted }}>Jotna School · gratuit pendant le lancement pour l'année scolaire 2026-2027</div>
      )}
      <div style={{ position: "absolute", right: -30, bottom: 20 }}>
        <Pio pose={POSES[index % POSES.length]} still height={640} />
      </div>
    </AbsoluteFill>
  );
};
