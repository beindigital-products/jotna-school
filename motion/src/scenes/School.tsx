import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import {
  ArrowLeft,
  BookOpenText,
  CheckCircle2,
  CreditCard,
  GraduationCap,
  Printer,
  Receipt,
  School,
  Upload,
  Users,
} from "lucide-react";
import { C, FONT } from "../theme";
import { IN_OUT, OUT, progress, tween } from "../lib/anim";
import { Backdrop } from "../components/backdrop";
import { BrowserFrame } from "../components/frames";
import { ChapterText } from "../components/chapter";
import { ClickSounds, Cursor } from "../components/cursor";
import { ACCENT, DashButton, DashboardShell } from "../components/dashboard";
import { Card, Pill, PopIn, Reveal } from "../components/ui";
import { VoiceCues } from "../voice";

const INDIGO = ACCENT.admin;
const INDIGO_50 = "#eef2ff";

const BROWSER = { left: 80, top: 96, width: 1250, height: 888 };
const K = 1.12;
const SHELL_W = BROWSER.width / K;
const SHELL_H = (BROWSER.height - 54) / K;
// Origine de la zone de contenu dans la coque (barre latérale 256, en-tête 64, marge 32).
const OX = 256 + 32;
const OY = 64 + 32;

const SWITCH = 268;

const scrollFiche = (f: number) => {
  let y = 0;
  for (const [at, to] of [
    [84, 300],
    [150, 640],
    [220, 870],
  ] as const) {
    y = interpolate(f, [at, at + 26], [y, to], { easing: IN_OUT, extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  }
  return y;
};

const SectionTitle: React.FC<{ icon: React.ReactNode; title: string; right?: React.ReactNode; y: number }> = ({ icon, title, right, y }) => (
  <div style={{ position: "absolute", left: 0, top: y, width: 787, display: "flex", alignItems: "center", gap: 8, fontSize: 18, fontWeight: 700 }}>
    {icon}
    {title}
    <div style={{ marginLeft: "auto" }}>{right}</div>
  </div>
);

const Tranche: React.FC<{ n: number; amount: string; when: string; paid?: boolean; pressed?: number; link?: number }> = ({
  n,
  amount,
  when,
  paid,
  pressed = 0,
  link = 0,
}) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderTop: `1px solid ${C.line}` }}>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 15, fontWeight: 600 }}>
        Tranche {n} · {amount}
      </div>
      <div style={{ fontSize: 13, color: C.muted }}>{when}</div>
      {link > 0 ? (
        <div style={{ fontSize: 13, color: INDIGO, fontWeight: 600, marginTop: 4, opacity: link }}>
          Ouvrir la page de paiement — {amount}
        </div>
      ) : null}
    </div>
    {paid ? (
      <Pill bg={C.emerald50} color={C.emerald700}>
        Réglée
      </Pill>
    ) : (
      <>
        <Pill bg={C.line} color={C.slate}>
          À payer
        </Pill>
        <DashButton color={INDIGO} pressed={pressed} style={{ height: 34 }}>
          Payer
        </DashButton>
      </>
    )}
  </div>
);

const press = (frame: number, at: number) => {
  const d = frame - at;
  return d >= -2 && d <= 5 ? 1 - Math.abs(d - 1) / 4 : 0;
};

/** La fiche école de la console (app/(admin)/admin/ecoles/detail/page.tsx). */
const Fiche: React.FC = () => {
  const frame = useCurrentFrame();
  const activated = frame >= 194;
  const levels = progress(frame, 200, 14);
  return (
    <div style={{ position: "relative", width: 787, height: 1200, fontFamily: FONT }}>
      <div style={{ position: "absolute", top: 0, display: "flex", alignItems: "center", gap: 6, fontSize: 14, color: C.muted }}>
        <ArrowLeft size={15} /> Écoles
      </div>
      <div style={{ position: "absolute", top: 30, display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: INDIGO_50, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <School size={24} color={INDIGO} />
        </div>
        <div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>École de démonstration Jotna</div>
          <div style={{ fontSize: 14, color: C.muted }}>Dakar · Awa Fall</div>
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          top: 106,
          width: 787,
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "14px 16px",
          borderRadius: 12,
          background: INDIGO_50,
          border: "1px solid #e0e7ff",
          fontSize: 14,
          color: "#372aac",
        }}
      >
        <Users size={17} color={INDIGO} />
        <span>
          <b>8 sièges occupés</b> pour 50 sièges au contrat — 42 sièges encore libres.
        </span>
      </div>

      <SectionTitle y={190} icon={<Receipt size={19} color={C.slate} />} title="Contrat" />
      <Card style={{ position: "absolute", top: 226, width: 787, boxSizing: "border-box" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ fontSize: 16, fontWeight: 600 }}>Du 1 septembre 2026 au 1 septembre 2027</div>
          <Pill bg={C.emerald50} color={C.emerald700} style={{ marginLeft: "auto" }} dot={C.emerald500}>
            Actif
          </Pill>
        </div>
        <div style={{ fontSize: 14, color: C.muted, marginTop: 6 }}>50 sièges au contrat · 250 000 FCFA au total sur la période</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, fontSize: 14, color: C.emerald700 }}>
          <CheckCircle2 size={16} /> Aujourd'hui, ce contrat ouvre l'accès des élèves inscrits.
        </div>
      </Card>

      <SectionTitle y={392} icon={<CreditCard size={19} color={C.slate} />} title="Échéancier" />
      <Card style={{ position: "absolute", top: 428, width: 787, boxSizing: "border-box", paddingBottom: 8 }}>
        <div style={{ display: "flex", gap: 22, fontSize: 14, color: C.muted, paddingBottom: 10 }}>
          <span>
            Contrat : <b style={{ color: C.ink }}>250 000 FCFA</b>
          </span>
          <span>
            Réglé : <b style={{ color: C.ink }}>83 334 FCFA</b>
          </span>
          <span>
            Reste dû : <b style={{ color: C.ink }}>166 666 FCFA</b>
          </span>
        </div>
        <Tranche n={1} amount="83 334 FCFA" when="Réglée le 1 septembre 2026" paid />
        <Tranche n={2} amount="83 333 FCFA" when="Exigible le 30 novembre 2026" pressed={press(frame, 128)} link={progress(frame, 132, 10)} />
        <Tranche n={3} amount="83 333 FCFA" when="Exigible le 28 février 2027" />
      </Card>

      <SectionTitle y={734} icon={<BookOpenText size={19} color={C.slate} />} title="Modules optionnels" />
      <Card style={{ position: "absolute", top: 770, width: 787, boxSizing: "border-box" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ fontSize: 30 }}>🕌</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Arabe & Coran</div>
            <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.45, maxWidth: 470 }}>
              Apprentissage de l'alphabet arabe (écoute, prononciation, écriture au doigt) puis lecture progressive de l'arabe et de
              sourates courtes.
            </div>
          </div>
          {activated ? (
            <PopIn at={194} from={0.8}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <Pill bg={C.emerald50} color={C.emerald700} dot={C.emerald500}>
                  Activé
                </Pill>
                <DashButton outline>Désactiver</DashButton>
              </div>
            </PopIn>
          ) : (
            <DashButton color={INDIGO} pressed={press(frame, 191)}>
              Activer pour cette école
            </DashButton>
          )}
        </div>
        <div
          style={{
            marginTop: 14,
            paddingTop: 12,
            borderTop: `1px solid ${C.line}`,
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 14,
            opacity: levels,
            height: 34 * levels,
            overflow: "hidden",
          }}
        >
          <span style={{ color: C.muted }}>Niveau des élèves en arabe</span>
          {["Débutant", "Intermédiaire", "Confirmé"].map((l, i) => (
            <Pill key={l} bg={i === 0 ? INDIGO_50 : C.line} color={i === 0 ? INDIGO : C.slate}>
              {l}
            </Pill>
          ))}
        </div>
      </Card>

      <SectionTitle
        y={986}
        icon={<GraduationCap size={19} color={C.slate} />}
        title="Classes"
        right={
          <DashButton color={INDIGO} icon={<Upload size={16} />} pressed={press(frame, 262)}>
            Importer des élèves
          </DashButton>
        }
      />
      <div style={{ position: "absolute", top: 1036, width: 787, display: "flex", gap: 16 }}>
        {[
          { c: "CM1 A", t: "Fatou Diop" },
          { c: "CM2 A", t: "Moussa Ndiaye" },
        ].map((k) => (
          <Card key={k.c} style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{k.c}</div>
            <div style={{ fontSize: 14, color: C.muted, marginTop: 4 }}>4 élèves inscrits · {k.t}</div>
            <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                    background: ["#c7d2fe", "#fde68a", "#bbf7d0", "#fbcfe8"][i],
                    border: "2px solid #fff",
                    marginLeft: i ? -10 : 0,
                  }}
                />
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

const LINES = ["Awa Diop, CM1 A", "Moussa Fall, CM1 A", "Fatou Sow, CM2 A", "Cheikh Ba, CM2 A"];
const TICKETS = [
  { name: "Awa Diop", cls: "CM1 A", student: "CM1A-4821", family: "PIO-7C4K2M" },
  { name: "Moussa Fall", cls: "CM1 A", student: "CM1A-5307", family: "PIO-H3QW8N" },
  { name: "Fatou Sow", cls: "CM2 A", student: "CM2A-2964", family: "PIO-T6RZ4P" },
  { name: "Cheikh Ba", cls: "CM2 A", student: "CM2A-8143", family: "PIO-K9VD2X" },
];
const TYPE_START = SWITCH + 22;
const CPS = 34;

/** La page d'import (app/(admin)/admin/ecoles/import/page.tsx) : une liste collée, des billets imprimables. */
export const SchoolImportPage: React.FC = () => {
  const frame = useCurrentFrame();
  const local = frame - TYPE_START;
  const full = LINES.join("\n");
  const typed = Math.max(0, Math.min(full.length, Math.floor((local / 30) * CPS)));
  const shown = full.slice(0, typed);
  const done = shown.split("\n").filter((l, i, arr) => i < arr.length - 1 || l.length === LINES[i]?.length).length;
  const recognized = typed === 0 ? 0 : Math.min(4, done);
  const imported = frame >= 366;
  return (
    <div style={{ position: "relative", width: 787, fontFamily: FONT }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 24, fontWeight: 700 }}>
        <Upload size={24} color={INDIGO} /> Importer des élèves
      </div>
      <div style={{ fontSize: 14, color: C.muted, marginTop: 8, lineHeight: 1.5, maxWidth: 720 }}>
        Une ligne par élève : <code style={{ background: C.line, padding: "1px 5px", borderRadius: 4 }}>Nom complet, CM1</code>, ou{" "}
        <code style={{ background: C.line, padding: "1px 5px", borderRadius: 4 }}>Nom complet, CM1 A</code>. Chaque élève reçoit un
        code de connexion et un code à remettre à sa famille.
      </div>
      <div
        style={{
          marginTop: 16,
          height: 132,
          borderRadius: 12,
          border: `1px solid ${C.line2}`,
          background: "#fff",
          padding: "12px 14px",
          fontFamily: "Menlo, monospace",
          fontSize: 15,
          lineHeight: "26px",
          color: C.ink,
          whiteSpace: "pre",
          boxShadow: "inset 0 1px 2px rgba(17,24,39,0.05)",
        }}
      >
        {shown}
        {frame >= TYPE_START && typed < full.length ? (
          <span style={{ display: "inline-block", width: 2, height: 18, background: C.ink, verticalAlign: "middle" }} />
        ) : null}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, color: C.emerald700, fontWeight: 600, opacity: recognized ? 1 : 0 }}>
          <CheckCircle2 size={16} /> {recognized} élève{recognized > 1 ? "s" : ""} reconnu{recognized > 1 ? "s" : ""}
        </div>
        <DashButton color={INDIGO} pressed={press(frame, 362)} style={{ marginLeft: "auto" }}>
          Importer {Math.max(1, recognized)} élève{recognized > 1 ? "s" : ""}
        </DashButton>
      </div>
      {imported ? (
        <Reveal at={366} style={{ marginTop: 22 }}>
          <div style={{ display: "flex", alignItems: "center", fontSize: 17, fontWeight: 700 }}>
            Dernier import — 4 / 4
            <DashButton outline icon={<Printer size={16} />} style={{ marginLeft: "auto" }}>
              Imprimer
            </DashButton>
          </div>
        </Reveal>
      ) : null}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 }}>
        {imported
          ? TICKETS.map((t, i) => (
              <PopIn key={t.name} at={374 + i * 7} from={0.85}>
                <div
                  style={{
                    border: `2px dashed ${C.line2}`,
                    borderRadius: 14,
                    padding: "12px 16px",
                    background: "#fff",
                    display: "flex",
                    gap: 16,
                    alignItems: "center",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>{t.name}</div>
                    <div style={{ fontSize: 13, color: C.muted }}>{t.cls}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Code de l'élève</div>
                    <div style={{ fontFamily: "Menlo, monospace", fontSize: 15, fontWeight: 700 }}>{t.student}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Code pour la famille</div>
                    <div style={{ fontFamily: "Menlo, monospace", fontSize: 15, fontWeight: 700, color: INDIGO }}>{t.family}</div>
                  </div>
                </div>
              </PopIn>
            ))
          : null}
      </div>
    </div>
  );
};

export const SchoolScene: React.FC = () => {
  const frame = useCurrentFrame();
  const enter = progress(frame, 0, 34, OUT);
  const onImport = frame >= SWITCH;
  const swap = progress(frame, SWITCH, 12);
  const scroll = onImport ? 0 : scrollFiche(frame);
  // Caméra : on se rapproche des billets à la fin.
  const zoom = tween(frame, 400, 50, 1, 1.18, IN_OUT);
  const zx = tween(frame, 400, 50, 0, -140, IN_OUT);
  const zy = tween(frame, 400, 50, 0, -170, IN_OUT);
  const rotY = 8 + (1 - enter) * 16 + Math.sin(frame / 55) * 0.6;
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <Backdrop tone="warm" />
      <ChapterText
        index="02"
        eyebrow="L'école"
        title={["Toute", "l'école", "sur", "une", "seule", { text: "fiche", marker: "rgba(255,184,106,0.8)" }]}
        lead="Contrat, échéancier, modules, classes et inscriptions au même endroit."
        bullets={[
          { text: "Paiement en 3 tranches", at: 130 },
          { text: "Modules au choix, comme Arabe & Coran", at: 196 },
          { text: "Import des élèves en une liste", at: 300 },
          { text: "Un code par élève, un code par famille", at: 386 },
        ]}
        delay={8}
        width={450}
        size={56}
        style={{ left: 1400, top: 236 }}
      />
      <div style={{ position: "absolute", inset: 0, perspective: 2200 }}>
        <div
          style={{
            position: "absolute",
            left: BROWSER.left,
            top: BROWSER.top,
            width: BROWSER.width,
            height: BROWSER.height,
            opacity: enter,
            transform: `translate(${(1 - enter) * -380 + zx}px, ${zy}px) scale(${zoom}) rotateY(${rotY}deg) rotateX(2deg)`,
            transformOrigin: "100% 50%",
          }}
        >
          <BrowserFrame
            width={BROWSER.width}
            height={BROWSER.height}
            url={onImport ? "jotnaschool.com/admin/ecoles/import" : "jotnaschool.com/admin/ecoles/detail"}
            style={{ left: 0, top: 0 }}
          >
            <div style={{ position: "absolute", left: 0, top: 0, width: SHELL_W, height: SHELL_H, transform: `scale(${K})`, transformOrigin: "0 0" }}>
              <DashboardShell role="admin" active="Écoles" user={{ name: "Équipe Jotna", email: "Administration" }} width={SHELL_W} height={SHELL_H} scroll={scroll}>
                {onImport ? (
                  <div style={{ opacity: swap, transform: `translateX(${(1 - swap) * 30}px)` }}>
                    <SchoolImportPage />
                  </div>
                ) : (
                  <Fiche />
                )}
              </DashboardShell>
              <Cursor
                path={[
                  { f: 96, x: 760, y: 420 },
                  { f: 120, x: OX + 750, y: OY + 428 + 104 - 300 + 34 },
                  { f: 168, x: OX + 700, y: OY + 600 - 640 },
                  { f: 184, x: OX + 690, y: OY + 770 + 40 - 640 },
                  { f: 236, x: OX + 640, y: OY + 700 - 870 + 300 },
                  { f: 256, x: OX + 700, y: OY + 986 + 18 - 870 },
                  { f: 300, x: OX + 600, y: OY + 240 },
                  { f: 352, x: OX + 712, y: OY + 266 },
                  { f: 400, x: OX + 640, y: OY + 470 },
                ]}
                clicks={[128, 191, 262, 362]}
                show={[96, 404]}
                scale={1 / K + 0.1}
              />
            </div>
          </BrowserFrame>
        </div>
      </div>
      <ClickSounds at={[128, 191, 262, 362]} />
      <VoiceCues scene="school" />
    </AbsoluteFill>
  );
};
