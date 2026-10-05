import React from "react";
import { useCurrentFrame } from "remotion";
import { C, FONT } from "../theme";
import { OUT, SNAP, progress, tween } from "../lib/anim";

/** Sur-titre orange en capitales espacées, comme « COMMENT ÇA MARCHE » sur la landing. */
export const Eyebrow: React.FC<{ text: string; delay?: number; color?: string; size?: number; style?: React.CSSProperties }> = ({
  text,
  delay = 0,
  color = C.orange700,
  size = 22,
  style,
}) => {
  const frame = useCurrentFrame();
  const p = progress(frame, delay, 20);
  return (
    <div
      style={{
        fontFamily: FONT,
        fontSize: size,
        fontWeight: 700,
        letterSpacing: `${0.12 + (1 - p) * 0.25}em`,
        textTransform: "uppercase",
        color,
        opacity: p,
        ...style,
      }}
    >
      {text}
    </div>
  );
};

type Word = string | { text: string; marker?: string; color?: string };

type HeadlineProps = {
  words: Word[];
  delay?: number;
  size?: number;
  stagger?: number;
  color?: string;
  align?: "left" | "center";
  /** Point final orange, posé après le dernier mot. */
  dot?: boolean;
  dotColor?: string;
  lineHeight?: number;
  maxWidth?: number;
  style?: React.CSSProperties;
  weight?: number;
  font?: string;
};

/**
 * Titre de la landing (Poppins 800, interlettrage serré) dont les mots montent
 * l'un après l'autre. Un mot peut porter un surligneur qui se trace dessous.
 */
export const Headline: React.FC<HeadlineProps> = ({
  words,
  delay = 0,
  size = 84,
  stagger = 4,
  color = C.ink,
  align = "left",
  dot = true,
  dotColor = C.ink,
  lineHeight = 1.06,
  maxWidth,
  style,
  weight = 800,
  font = FONT,
}) => {
  const frame = useCurrentFrame();
  const last = words.length - 1;
  return (
    <div
      style={{
        fontFamily: font,
        fontSize: size,
        fontWeight: weight,
        letterSpacing: "-0.035em",
        lineHeight,
        color,
        textAlign: align,
        maxWidth,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: align === "center" ? "center" : "flex-start",
        columnGap: size * 0.26,
        ...style,
      }}
    >
      {words.map((w, i) => {
        const word = typeof w === "string" ? { text: w } : w;
        const start = delay + i * stagger;
        const p = progress(frame, start, 22, OUT);
        const markerP = progress(frame, start + 10, 18, SNAP);
        return (
          <span
            key={`${word.text}-${i}`}
            style={{
              display: "inline-block",
              position: "relative",
              opacity: p,
              transform: `translateY(${(1 - p) * size * 0.55}px) rotate(${(1 - p) * 4}deg)`,
              color: word.color ?? color,
              whiteSpace: "nowrap",
            }}
          >
            {word.marker ? (
              <span
                style={{
                  position: "absolute",
                  left: -size * 0.04,
                  right: -size * 0.04,
                  bottom: size * 0.06,
                  height: size * 0.24,
                  borderRadius: size,
                  background: word.marker,
                  transform: `scaleX(${markerP})`,
                  transformOrigin: "left center",
                  zIndex: 0,
                }}
              />
            ) : null}
            <span style={{ position: "relative", zIndex: 1 }}>{word.text}</span>
            {dot && i === last ? (
              <span
                style={{
                  position: "relative",
                  zIndex: 1,
                  color: dotColor,
                  display: "inline-block",
                  transform: `scale(${tween(frame, start + 12, 10, 0, 1)})`,
                }}
              >
                .
              </span>
            ) : null}
          </span>
        );
      })}
    </div>
  );
};

/** Paragraphe d'accompagnement qui apparaît en fondu montant. */
export const Lead: React.FC<{ children: React.ReactNode; delay?: number; size?: number; color?: string; maxWidth?: number; align?: "left" | "center"; style?: React.CSSProperties }> = ({
  children,
  delay = 0,
  size = 30,
  color = C.muted,
  maxWidth = 900,
  align = "left",
  style,
}) => {
  const frame = useCurrentFrame();
  const p = progress(frame, delay, 22);
  return (
    <div
      style={{
        fontFamily: FONT,
        fontSize: size,
        lineHeight: 1.5,
        fontWeight: 400,
        color,
        maxWidth,
        textAlign: align,
        opacity: p,
        transform: `translateY(${(1 - p) * 18}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
