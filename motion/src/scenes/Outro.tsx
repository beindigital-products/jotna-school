import React from "react";
import { AbsoluteFill, Freeze, Img, staticFile, useCurrentFrame } from "remotion";
import { Globe, GraduationCap, Heart, Mail, School, Smartphone } from "lucide-react";
import { C, FONT } from "../theme";
import { IN_OUT, OUT, pop, progress } from "../lib/anim";
import { Backdrop } from "../components/backdrop";
import { BrowserFrame, PhoneFrame } from "../components/frames";
import { DashboardShell, type Role } from "../components/dashboard";
import { Headline } from "../components/typography";
import { Pio } from "../components/pio";
import { SchoolImportPage } from "./School";
import { TeacherPdfDetail } from "./Teachers";
import { ParentReportPage } from "./Parents";
import { PH, PW, ResultScreen } from "../screens/student";
import { VoiceCues } from "../voice";

export const OUTRO_FRAMES = 270;

const BW = 1250;
const BH = 888;
const K = 1.12;

/** Vignette figée d'un espace web : le navigateur, la coque du rôle, une page. */
const BrowserThumb: React.FC<{ role: Role; active: string; url: string; user: { name: string; email: string }; freeze: number; children: React.ReactNode }> = ({
  role,
  active,
  url,
  user,
  freeze,
  children,
}) => (
  <div style={{ position: "relative", width: BW, height: BH }}>
    <BrowserFrame width={BW} height={BH} url={url} style={{ left: 0, top: 0 }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: BW / K, height: (BH - 54) / K, transform: `scale(${K})`, transformOrigin: "0 0" }}>
        <Freeze frame={freeze}>
          <DashboardShell role={role} active={active} user={user} width={BW / K} height={(BH - 54) / K}>
            {children}
          </DashboardShell>
        </Freeze>
      </div>
    </BrowserFrame>
  </div>
);

const CELLS = [
  { label: "L'école", caption: "Contrat, classes et inscriptions", icon: School, tint: C.orange100, fg: C.orange600, x: 90, y: 70 },
  { label: "Les parents", caption: "Progression et rapports", icon: Heart, tint: C.lime100, fg: C.lime600, x: 980, y: 70 },
  { label: "Les professeurs", caption: "Exercices générés par l'IA", icon: GraduationCap, tint: C.amber100, fg: C.amber700, x: 90, y: 560 },
  { label: "Les élèves", caption: "Application iOS et Android", icon: Smartphone, tint: C.sky100, fg: C.sky600, x: 980, y: 560 },
];

const CELL_W = 850;
const CELL_H = 450;
const THUMB = 0.52;

const Recap: React.FC = () => {
  const frame = useCurrentFrame();
  const out = progress(frame, 84, 22, IN_OUT);
  return (
    <AbsoluteFill>
      {CELLS.map((c, i) => {
        const p = pop(frame, 2 + i * 5, { damping: 16, stiffness: 120 });
        const Icon = c.icon;
        const cx = c.x + CELL_W / 2;
        const cy = c.y + CELL_H / 2;
        const toCenter = out;
        return (
          <div
            key={c.label}
            style={{
              position: "absolute",
              left: c.x,
              top: c.y,
              width: CELL_W,
              height: CELL_H,
              borderRadius: 34,
              background: `linear-gradient(140deg, #ffffff, ${c.tint})`,
              border: "1px solid rgba(17,24,39,0.06)",
              boxShadow: "0 30px 60px -30px rgba(17,24,39,0.35)",
              overflow: "hidden",
              opacity: Math.min(1, p * 1.4) * (1 - toCenter),
              transform: `translate(${(960 - cx) * toCenter * 0.6}px, ${(540 - cy) * toCenter * 0.6}px) scale(${(0.7 + 0.3 * p) * (1 - 0.35 * toCenter)})`,
            }}
          >
            <div style={{ position: "absolute", left: 34, top: 34, display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 52, height: 52, borderRadius: 16, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 14px -8px rgba(17,24,39,0.4)" }}>
                <Icon size={28} color={c.fg} strokeWidth={2.2} />
              </span>
              <div>
                <div style={{ fontSize: 32, fontWeight: 800, color: C.ink, letterSpacing: "-0.02em" }}>{c.label}</div>
                <div style={{ fontSize: 19, color: C.body }}>{c.caption}</div>
              </div>
            </div>
            {i === 3 ? (
              <div style={{ position: "absolute", left: 470, top: 96, width: (PW + 26) * 0.7, height: (PH + 26) * 0.7, transform: "rotate(-5deg)" }}>
                <PhoneFrame scale={0.7} style={{ left: 0, top: 0 }}>
                  <Freeze frame={118}>
                    <ResultScreen trophyAt={66} />
                  </Freeze>
                </PhoneFrame>
              </div>
            ) : (
              <div style={{ position: "absolute", left: 250, top: 128, width: BW * THUMB, height: BH * THUMB, transform: `rotate(${i === 1 ? 3 : -3}deg)`, filter: "drop-shadow(0 20px 30px rgba(17,24,39,0.25))" }}>
                <div style={{ transform: `scale(${THUMB})`, transformOrigin: "0 0" }}>
                  {i === 0 ? (
                    <BrowserThumb role="admin" active="Écoles" url="jotnaschool.com/admin/ecoles/import" user={{ name: "Équipe Jotna", email: "Administration" }} freeze={445}>
                      <SchoolImportPage />
                    </BrowserThumb>
                  ) : i === 1 ? (
                    <BrowserThumb role="parent" active="Mes enfants" url="jotnaschool.com/parent/children/reports" user={{ name: "Penda Diop", email: "2 enfants rattachés" }} freeze={380}>
                      <ParentReportPage />
                    </BrowserThumb>
                  ) : (
                    <BrowserThumb role="teacher" active="Tableau de bord" url="jotnaschool.com/teacher/pdf-uploads/detail" user={{ name: "Fatou Diop", email: "Professeure · CM1 A" }} freeze={334}>
                      <TeacherPdfDetail />
                    </BrowserThumb>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const logo = pop(frame, 96, { damping: 13, stiffness: 120 });
  const url = progress(frame, 150, 16, OUT);
  const mail = progress(frame, 160, 16, OUT);
  const pioIn = progress(frame, 118, 22, OUT);
  return (
    <AbsoluteFill>
      <Img
        src={staticFile("app/jotna-logo.png")}
        style={{
          position: "absolute",
          left: 960 - 230,
          top: 70,
          width: 460,
          opacity: progress(frame, 96, 8),
          transform: `scale(${0.6 + 0.4 * logo}) rotate(${(1 - logo) * -5}deg)`,
        }}
      />
      <div style={{ position: "absolute", left: 0, right: 0, top: 420, display: "flex", justifyContent: "center" }}>
        <Headline
          words={["Apprendre", "devient", { text: "un réflexe", marker: "rgba(255,184,106,0.85)" }]}
          delay={108}
          size={96}
          stagger={5}
          align="center"
          maxWidth={1100}
        />
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 690,
          display: "flex",
          justifyContent: "center",
          opacity: url,
          transform: `translateY(${(1 - url) * 20}px)`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 30px", borderRadius: 999, background: C.ink, color: "#fff", fontSize: 32, fontWeight: 700, boxShadow: "0 18px 40px -16px rgba(16,24,40,0.7)" }}>
          <Globe size={30} /> jotnaschool.com
        </div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 800, display: "flex", justifyContent: "center", alignItems: "center", gap: 10, fontSize: 24, color: C.body, opacity: mail }}>
        <Mail size={22} /> contact@jotnaschool.com
      </div>
      <div style={{ position: "absolute", left: 1440, top: 470, opacity: pioIn, transform: `translateY(${(1 - pioIn) * 80}px)` }}>
        <Pio pose="cheer" height={560} />
      </div>
    </AbsoluteFill>
  );
};

export const Outro: React.FC = () => (
  <AbsoluteFill style={{ fontFamily: FONT }}>
    <Backdrop tone="warm" delay={80} />
    <Recap />
    <EndCard />
    <VoiceCues scene="outro" />
  </AbsoluteFill>
);
