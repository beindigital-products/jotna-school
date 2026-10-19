import React from "react";
import { C, FONT, SHADOW } from "../theme";

type BrowserProps = {
  width: number;
  height: number;
  url: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
};

const BAR = 54;

/** Fenêtre de navigateur sobre : pastilles, barre d'adresse, contenu rogné. */
export const BrowserFrame: React.FC<BrowserProps> = ({ width, height, url, children, style }) => (
  <div
    style={{
      position: "absolute",
      width,
      height,
      borderRadius: 22,
      overflow: "hidden",
      background: C.bg,
      boxShadow: SHADOW.float,
      border: "1px solid rgba(17,24,39,0.08)",
      fontFamily: FONT,
      ...style,
    }}
  >
    <div
      style={{
        height: BAR,
        display: "flex",
        alignItems: "center",
        padding: "0 22px",
        gap: 10,
        background: "#f8f8f7",
        borderBottom: "1px solid rgba(17,24,39,0.07)",
      }}
    >
      {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
        <span key={c} style={{ width: 14, height: 14, borderRadius: 7, background: c }} />
      ))}
      <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
        <div
          style={{
            minWidth: 420,
            height: 34,
            borderRadius: 10,
            background: "#ffffff",
            border: "1px solid rgba(17,24,39,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            color: C.slate,
            fontSize: 16,
            fontWeight: 500,
            padding: "0 18px",
          }}
        >
          <svg width="13" height="15" viewBox="0 0 13 15" fill="none">
            <rect x="1" y="6.5" width="11" height="7.5" rx="2" fill={C.muted} />
            <path d="M3.5 6.5V4.5a3 3 0 0 1 6 0v2" stroke={C.muted} strokeWidth="1.6" />
          </svg>
          {url}
        </div>
      </div>
      <span style={{ width: 66 }} />
    </div>
    <div style={{ position: "absolute", top: BAR, left: 0, right: 0, bottom: 0, overflow: "hidden" }}>
      {children}
    </div>
  </div>
);

export const BROWSER_BAR = BAR;

type PhoneProps = {
  /** Largeur de l'écran en points iOS ; le cadre est mis à l'échelle par `scale`. */
  scale?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
  statusDark?: boolean;
};

export const PHONE_W = 390;
export const PHONE_H = 844;

/**
 * Un téléphone générique (proportions d'un iPhone récent, 390 × 844 points).
 * Le contenu est dessiné en points puis agrandi d'un bloc par `scale`.
 */
export const PhoneFrame: React.FC<PhoneProps> = ({ scale = 1, children, style, statusDark = true }) => {
  const bezel = 13;
  const w = PHONE_W + bezel * 2;
  const h = PHONE_H + bezel * 2;
  const ink = statusDark ? "#0b1020" : "#ffffff";
  return (
    <div
      style={{
        position: "absolute",
        width: w,
        height: h,
        transform: `scale(${scale})`,
        transformOrigin: "top left",
        fontFamily: FONT,
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 68,
          background: "linear-gradient(145deg, #2b2f38, #0d0f14 60%, #23262d)",
          boxShadow: "0 50px 100px -30px rgba(17,24,39,0.55), 0 18px 40px -18px rgba(17,24,39,0.4), inset 0 0 0 2px rgba(255,255,255,0.08)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: bezel,
          top: bezel,
          width: PHONE_W,
          height: PHONE_H,
          borderRadius: 55,
          overflow: "hidden",
          background: "#ffffff",
        }}
      >
        {children}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 54,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "6px 34px 0 42px",
            color: ink,
            fontSize: 16,
            fontWeight: 600,
            zIndex: 50,
            pointerEvents: "none",
          }}
        >
          <span style={{ letterSpacing: -0.2 }}>9:41</span>
          <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <svg width="18" height="12" viewBox="0 0 18 12">
              {[0, 1, 2, 3].map((i) => (
                <rect key={i} x={i * 4.6} y={9 - i * 3} width="3.2" height={3 + i * 3} rx="0.8" fill={ink} />
              ))}
            </svg>
            <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
              <path d="M8 11.2l2.2-2.6a3.2 3.2 0 0 0-4.4 0L8 11.2z" fill={ink} />
              <path d="M3.6 6.6a6.3 6.3 0 0 1 8.8 0" stroke={ink} strokeWidth="1.7" strokeLinecap="round" />
              <path d="M1.2 3.9a9.8 9.8 0 0 1 13.6 0" stroke={ink} strokeWidth="1.7" strokeLinecap="round" />
            </svg>
            <svg width="27" height="13" viewBox="0 0 27 13" fill="none">
              <rect x="0.6" y="0.6" width="22.8" height="11.8" rx="3.6" stroke={ink} strokeOpacity="0.45" strokeWidth="1.2" />
              <rect x="2.4" y="2.4" width="17" height="8.2" rx="2.2" fill={ink} />
              <path d="M25 4.4v4.2c.9-.3 1.4-1.1 1.4-2.1s-.5-1.8-1.4-2.1z" fill={ink} fillOpacity="0.45" />
            </svg>
          </span>
        </div>
        <div
          style={{
            position: "absolute",
            top: 11,
            left: PHONE_W / 2 - 62,
            width: 124,
            height: 36,
            borderRadius: 18,
            background: "#000",
            zIndex: 60,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 8,
            left: PHONE_W / 2 - 70,
            width: 140,
            height: 5,
            borderRadius: 3,
            background: statusDark ? "rgba(11,16,32,0.85)" : "rgba(255,255,255,0.9)",
            zIndex: 60,
          }}
        />
      </div>
    </div>
  );
};
