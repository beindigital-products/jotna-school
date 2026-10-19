import React from "react";
import { useCurrentFrame } from "remotion";
import { Check } from "lucide-react";
import { C, FONT } from "../theme";
import { pop, progress } from "../lib/anim";
import { Eyebrow, Headline, Lead } from "./typography";

type Word = string | { text: string; marker?: string; color?: string };

export type Bullet = { text: string; at: number };

type Props = {
  index: string;
  eyebrow: string;
  title: Word[];
  lead?: string;
  bullets?: Bullet[];
  delay?: number;
  width?: number;
  accent?: string;
  size?: number;
  style?: React.CSSProperties;
  /** Bloc libre posé entre la phrase et les puces (badges, par exemple). */
  extra?: React.ReactNode;
};

/**
 * Colonne de texte d'un chapitre : numéro, sur-titre, titre, phrase, puis
 * des puces qui se cochent au moment où l'interface montre la fonction.
 */
export const ChapterText: React.FC<Props> = ({
  index,
  eyebrow,
  title,
  lead,
  bullets = [],
  delay = 0,
  width = 520,
  accent = C.orange500,
  size = 60,
  style,
  extra,
}) => {
  const frame = useCurrentFrame();
  const lineP = progress(frame, delay, 20);
  // La puce la plus récente reste en avant, les autres s'estompent un peu.
  const shown = bullets.filter((b) => frame >= b.at);
  const latest = shown.length ? shown[shown.length - 1].at : -1;
  return (
    <div style={{ position: "absolute", width, fontFamily: FONT, ...style }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22 }}>
        <span
          style={{
            fontSize: 20,
            fontWeight: 800,
            color: accent,
            opacity: lineP,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {index}
        </span>
        <span style={{ width: 46 * lineP, height: 3, borderRadius: 3, background: accent }} />
        <Eyebrow text={eyebrow} delay={delay + 4} size={20} />
      </div>
      <Headline words={title} delay={delay + 8} size={size} stagger={3} maxWidth={width} />
      {lead ? (
        <Lead delay={delay + 22} size={23} maxWidth={width - 20} style={{ marginTop: 22 }}>
          {lead}
        </Lead>
      ) : null}
      {extra ? <div style={{ marginTop: 24 }}>{extra}</div> : null}
      <div style={{ marginTop: extra ? 28 : 34, display: "flex", flexDirection: "column", gap: 16 }}>
        {bullets.map((b) => {
          if (frame < b.at - 2) return null;
          const p = progress(frame, b.at, 14);
          const check = pop(frame, b.at + 2);
          const current = b.at === latest;
          return (
            <div
              key={b.text}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                opacity: p * (current ? 1 : 0.62),
                transform: `translateX(${(1 - p) * -24}px)`,
              }}
            >
              <span
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  background: current ? accent : C.line,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: `scale(${check})`,
                  flexShrink: 0,
                }}
              >
                <Check size={19} color={current ? "#fff" : C.muted} strokeWidth={3} />
              </span>
              <span style={{ fontSize: 22, fontWeight: current ? 600 : 500, color: C.ink, lineHeight: 1.3 }}>{b.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
