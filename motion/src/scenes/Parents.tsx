import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { ArrowLeft, BookOpen, CheckCircle2, ChevronDown, ChevronRight, Clock, Lock, Mail, Star, Ticket, Trophy } from "lucide-react";
import { C, FONT } from "../theme";
import { IN_OUT, OUT, progress, tween } from "../lib/anim";
import { Backdrop } from "../components/backdrop";
import { BrowserFrame } from "../components/frames";
import { ChapterText } from "../components/chapter";
import { ClickSounds, Cursor } from "../components/cursor";
import { ACCENT, DashButton, DashboardShell } from "../components/dashboard";
import { Avatar, Bar, Card, Pill, PopIn, Reveal } from "../components/ui";
import { VoiceCues } from "../voice";

const TEAL = ACCENT.parent;
const TEAL_50 = "#f0fdfa";
const TEAL_100 = "#cbfbf1";
const TEAL_700 = "#00786f";

const BROWSER = { left: 590, top: 96, width: 1250, height: 888 };
const K = 1.12;
const SHELL_W = BROWSER.width / K;
const SHELL_H = (BROWSER.height - 54) / K;
const OX = 256 + 32;
const OY = 64 + 32;

// Pages successives et images de bascule.
const TO_DASH = 122;
const TO_PROGRESS = 210;
const TO_REPORT = 292;

const press = (frame: number, at: number) => {
  const d = frame - at;
  return d >= -2 && d <= 5 ? 1 - Math.abs(d - 1) / 4 : 0;
};

const PageIn: React.FC<{ at: number; children: React.ReactNode }> = ({ at, children }) => {
  const frame = useCurrentFrame();
  const p = progress(frame, at, 12);
  return <div style={{ opacity: p, transform: `translateX(${(1 - p) * 30}px)` }}>{children}</div>;
};

const CodePage: React.FC = () => {
  const frame = useCurrentFrame();
  const code = "PIO-7C4K2M";
  const n = Math.max(0, Math.min(code.length, Math.floor((frame - 30) / 3)));
  return (
    <div style={{ width: 787 }}>
      <div style={{ fontSize: 24, fontWeight: 700 }}>Rattacher avec le code de l'école</div>
      <div style={{ fontSize: 14, color: C.muted, marginTop: 8, lineHeight: 1.55, maxWidth: 640 }}>
        L'école vous a remis un billet portant un code. Saisissez-le ici pour retrouver votre enfant dans votre espace.
      </div>
      <Card style={{ marginTop: 22 }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>Code du billet</div>
        <div
          style={{
            marginTop: 8,
            width: 360,
            height: 48,
            borderRadius: 10,
            border: `2px solid ${frame >= 28 ? TEAL : C.line2}`,
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "0 14px",
            fontFamily: "Menlo, monospace",
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: "0.06em",
            color: C.ink,
          }}
        >
          <Ticket size={18} color={TEAL} />
          {code.slice(0, n)}
          {n < code.length && frame >= 28 ? <span style={{ width: 2, height: 22, background: C.ink }} /> : null}
        </div>
        <div style={{ fontSize: 12, color: C.muted, marginTop: 8 }}>Le code ne contient ni O, ni I, ni zéro.</div>
        <DashButton color={TEAL} pressed={press(frame, 78)} style={{ marginTop: 14 }}>
          Vérifier le code
        </DashButton>
      </Card>
      {frame >= 82 ? (
        <PopIn at={82} from={0.9} origin="20% 0%">
          <div
            style={{
              marginTop: 16,
              borderRadius: 14,
              border: `2px solid ${TEAL}`,
              background: TEAL_50,
              padding: 20,
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <Avatar name="Awa Diop" size={56} from="#fbbf24" to="#f97316" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: TEAL_700, fontWeight: 600 }}>Ce code désigne</div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>Awa Diop</div>
              <div style={{ fontSize: 14, color: C.muted }}>CM1 A · École de démonstration Jotna</div>
            </div>
            <DashButton color={TEAL} pressed={press(frame, 110)}>
              Oui, c'est mon enfant
            </DashButton>
          </div>
        </PopIn>
      ) : null}
    </div>
  );
};

const Kid: React.FC<{ name: string; cls: string; reports: number; avg: string; from: string; to: string; pressed?: number }> = ({
  name,
  cls,
  reports,
  avg,
  from,
  to,
  pressed = 0,
}) => (
  <Card style={{ flex: 1 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <Avatar name={name} size={48} from={from} to={to} />
      <div>
        <div style={{ fontSize: 17, fontWeight: 700 }}>{name}</div>
        <div style={{ fontSize: 13, color: C.muted }}>
          {cls} · {reports} rapports disponibles
        </div>
      </div>
    </div>
    <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
      <div style={{ flex: 1, background: TEAL_50, borderRadius: 10, padding: "10px 12px" }}>
        <BookOpen size={16} color={TEAL} />
        <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>{reports}</div>
        <div style={{ fontSize: 12, color: C.muted }}>Rapports</div>
      </div>
      <div style={{ flex: 1, background: C.amber50, borderRadius: 10, padding: "10px 12px" }}>
        <Trophy size={16} color={C.amber600} />
        <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>{avg}</div>
        <div style={{ fontSize: 12, color: C.muted }}>Moyenne</div>
      </div>
    </div>
    <div
      style={{
        marginTop: 14,
        height: 38,
        borderRadius: 8,
        border: `1px solid ${C.line2}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        fontSize: 14,
        fontWeight: 600,
        color: TEAL_700,
        transform: `scale(${1 - pressed * 0.04})`,
      }}
    >
      Voir la progression <ChevronRight size={16} />
    </div>
  </Card>
);

const Dashboard: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <div style={{ width: 787 }}>
      <div style={{ fontSize: 24, fontWeight: 700 }}>Bonjour, Penda !</div>
      <div style={{ fontSize: 14, color: C.muted, marginTop: 4 }}>Suivez la progression de vos enfants depuis votre tableau de bord.</div>
      <div style={{ display: "flex", alignItems: "center", marginTop: 26, marginBottom: 14 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Mes enfants</div>
        <div style={{ marginLeft: "auto", fontSize: 14, color: TEAL, fontWeight: 600 }}>J'ai un code de l'école</div>
      </div>
      <div style={{ display: "flex", gap: 16 }}>
        <Reveal at={TO_DASH + 4} style={{ flex: 1, display: "flex" }}>
          <Kid name="Awa Diop" cls="CM1 A" reports={3} avg="86 %" from="#fbbf24" to="#f97316" pressed={press(frame, 200)} />
        </Reveal>
        <Reveal at={TO_DASH + 10} style={{ flex: 1, display: "flex" }}>
          <Kid name="Moussa Diop" cls="CE2" reports={2} avg="78 %" from="#38bdf8" to="#6366f1" />
        </Reveal>
      </div>
    </div>
  );
};

type Topic = { name: string; state: "done" | "next" | "locked"; score?: string };

const SubjectCard: React.FC<{ emoji: string; color: string; name: string; done: number; total: number; topics: Topic[]; start: number; reportPress?: number }> = ({
  emoji,
  color,
  name,
  done,
  total,
  topics,
  start,
  reportPress = 0,
}) => {
  const pct = Math.round((done / total) * 100);
  return (
    <Card style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
          {emoji}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 700 }}>{name}</div>
          <div style={{ fontSize: 13, color: C.muted }}>
            {done}/{total} thématiques terminées
          </div>
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: TEAL }}>{pct} %</div>
      </div>
      <Bar value={pct} start={start} duration={28} fill={TEAL} style={{ marginTop: 12 }} />
      <div style={{ marginTop: 10 }}>
        {topics.map((t, i) => (
          <Reveal key={t.name} at={start + 6 + i * 4} dy={8}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderTop: i ? `1px solid ${C.line}` : "none", fontSize: 14 }}>
              {t.state === "done" ? (
                <CheckCircle2 size={18} color="#16a34a" />
              ) : t.state === "next" ? (
                <Clock size={18} color={C.amber500} />
              ) : (
                <Lock size={18} color={C.faint} />
              )}
              <span style={{ fontWeight: 500, color: t.state === "locked" ? C.faint : C.ink }}>{t.name}</span>
              {t.score ? <span style={{ color: C.muted }}>· Score : {t.score}</span> : null}
              {t.state === "done" ? (
                <span
                  style={{
                    marginLeft: "auto",
                    color: TEAL,
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    transform: i === 0 ? `scale(${1 - reportPress * 0.08})` : undefined,
                  }}
                >
                  Rapport <ChevronRight size={15} />
                </span>
              ) : null}
            </div>
          </Reveal>
        ))}
      </div>
    </Card>
  );
};

const ProgressPage: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <div style={{ width: 787 }}>
      <div style={{ fontSize: 24, fontWeight: 700 }}>Progression</div>
      <div style={{ fontSize: 14, color: C.muted, marginTop: 4, marginBottom: 20 }}>Détail par matière et thématique</div>
      <SubjectCard
        emoji="🧮"
        color="#4f46e5"
        name="Mathématiques"
        done={2}
        total={6}
        start={TO_PROGRESS + 6}
        reportPress={press(frame, 282)}
        topics={[
          { name: "Les fractions", state: "done", score: "90 %" },
          { name: "La multiplication", state: "done", score: "85 %" },
          { name: "Les nombres décimaux", state: "next" },
          { name: "La division", state: "locked" },
        ]}
      />
      <SubjectCard
        emoji="📖"
        color="#db2777"
        name="Français"
        done={1}
        total={5}
        start={TO_PROGRESS + 14}
        topics={[
          { name: "La conjugaison au présent", state: "done", score: "80 %" },
          { name: "Les adjectifs", state: "next" },
        ]}
      />
    </div>
  );
};

const Stars: React.FC<{ n: number; at: number; size?: number }> = ({ n, at, size = 26 }) => (
  <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
    {[0, 1, 2].map((i) => (
      <PopIn key={i} at={at + i * 5} rotate={-30}>
        <Star size={size} color={C.amber400} fill={i < n ? C.amber400 : "none"} />
      </PopIn>
    ))}
  </div>
);

export const ParentReportPage: React.FC = () => (
  <div style={{ width: 787 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, color: C.muted }}>
      <ArrowLeft size={15} /> Retour à la progression
    </div>
    <div style={{ fontSize: 24, fontWeight: 700, marginTop: 12 }}>Rapport détaillé</div>
    <div style={{ fontSize: 14, color: C.muted, marginTop: 4 }}>Mathématiques — Les fractions</div>
    <Card style={{ marginTop: 18, textAlign: "center", padding: 22 }}>
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", color: C.muted }}>SCORE</div>
      <div style={{ fontSize: 52, fontWeight: 800, color: "#16a34a", lineHeight: 1.1 }}>90 %</div>
      <Stars n={3} at={TO_REPORT + 12} />
    </Card>
    <div style={{ display: "flex", gap: 14, marginTop: 14 }}>
      {[
        { title: "Points forts", items: ["Questions à choix multiples", "Glisser-déposer"], color: "#16a34a", bg: "#f0fdf4", mark: "✓" },
        { title: "Points à améliorer", items: ["Réponse courte"], color: C.amber600, bg: C.amber50, mark: "⚠" },
      ].map((b, i) => (
        <Reveal key={b.title} at={TO_REPORT + 18 + i * 6} style={{ flex: 1 }}>
          <div style={{ borderRadius: 12, background: b.bg, padding: 16, height: 120, boxSizing: "border-box" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: b.color }}>{b.title}</div>
            {b.items.map((it) => (
              <div key={it} style={{ fontSize: 14, marginTop: 8, display: "flex", gap: 8 }}>
                <span style={{ color: b.color, fontWeight: 700 }}>{b.mark}</span>
                {it}
              </div>
            ))}
          </div>
        </Reveal>
      ))}
    </div>
    <div style={{ display: "flex", gap: 18, marginTop: 14, fontSize: 13, color: C.muted }}>
      <span>Date : 5 octobre 2026</span>
      <span style={{ color: "#16a34a" }}>E-mail : Envoyé le 05/10/2026</span>
    </div>
  </div>
);

/** L'e-mail envoyé au parent quand l'enfant termine une thématique (lib/email-template.ts). */
const EmailCard: React.FC = () => (
  <div style={{ width: 430, borderRadius: 18, overflow: "hidden", background: "#fff", boxShadow: "0 40px 80px -30px rgba(17,24,39,0.5), 0 10px 30px -10px rgba(17,24,39,0.25)", fontFamily: FONT }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "#f8fafc", borderBottom: `1px solid ${C.line}` }}>
      <Mail size={18} color={TEAL} />
      <div style={{ fontSize: 13, color: C.slate, fontWeight: 600, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        [Jotna School] Rapport - Awa a terminé Les fractions
      </div>
    </div>
    <div style={{ background: "#0d9488", padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
      <Img src={staticFile("app/jotna-logo.png")} style={{ height: 38 }} />
      <div>
        <div style={{ color: "#fff", fontSize: 20, fontWeight: 700 }}>Jotna School</div>
        <div style={{ color: "#ccfbf1", fontSize: 13 }}>Rapport de progression</div>
      </div>
    </div>
    <div style={{ padding: "16px 20px" }}>
      <div style={{ fontSize: 11, color: C.muted, letterSpacing: "0.1em", fontWeight: 700 }}>ÉLÈVE</div>
      <div style={{ fontSize: 17, fontWeight: 700 }}>Awa Diop</div>
      <div style={{ display: "flex", gap: 24, marginTop: 10 }}>
        <div>
          <div style={{ fontSize: 11, color: C.muted, letterSpacing: "0.1em", fontWeight: 700 }}>MATIÈRE</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Mathématiques</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: C.muted, letterSpacing: "0.1em", fontWeight: 700 }}>THÉMATIQUE</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Les fractions</div>
        </div>
      </div>
      <div style={{ marginTop: 12, background: "#f9fafb", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 11, color: C.muted, letterSpacing: "0.1em", fontWeight: 700 }}>SCORE</span>
        <span style={{ fontSize: 28, fontWeight: 800, color: "#16a34a" }}>90 %</span>
        <span style={{ color: C.amber400, fontSize: 20, letterSpacing: 2 }}>★★★</span>
      </div>
    </div>
  </div>
);

const KidSwitcher: React.FC = () => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 6,
      padding: "6px 12px",
      borderRadius: 999,
      background: TEAL_50,
      border: `1px solid ${TEAL_100}`,
      color: TEAL_700,
      fontSize: 13,
      fontWeight: 600,
    }}
  >
    2 enfants <ChevronDown size={14} />
  </div>
);

export const ParentsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const enter = progress(frame, 0, 34, OUT);
  const rotY = -8 + (1 - enter) * -16 + Math.sin(frame / 55) * 0.6;
  const page = frame < TO_DASH ? 0 : frame < TO_PROGRESS ? 1 : frame < TO_REPORT ? 2 : 3;
  const active = page === 0 || page === 1 ? "Tableau de bord" : "Mes enfants";
  const url = ["parent/children/code", "parent/dashboard", "parent/children/progress", "parent/children/reports"][page];
  const mail = progress(frame, 318, 22, OUT);
  const pull = tween(frame, 312, 40, 1, 0.94, IN_OUT);
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <Backdrop tone="lime" />
      <ChapterText
        index="03"
        eyebrow="Les parents"
        title={["Suivre", "sans", { text: "surveiller", marker: "rgba(187,244,81,0.85)" }]}
        lead="Le billet remis par l'école suffit pour retrouver son enfant."
        bullets={[
          { text: "Rattachement avec le code de l'école", at: 112 },
          { text: "Progression par matière et thématique", at: 222 },
          { text: "Un rapport par thématique terminée", at: 300 },
          { text: "Le même rapport arrive par e-mail", at: 336 },
        ]}
        delay={8}
        width={440}
        size={60}
        accent={C.lime600}
        style={{ left: 110, top: 250 }}
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
            transform: `translateX(${(1 - enter) * 380}px) scale(${pull}) rotateY(${rotY}deg) rotateX(2deg)`,
            transformOrigin: "0% 50%",
          }}
        >
          <BrowserFrame width={BROWSER.width} height={BROWSER.height} url={`jotnaschool.com/${url}`} style={{ left: 0, top: 0 }}>
            <div style={{ position: "absolute", left: 0, top: 0, width: SHELL_W, height: SHELL_H, transform: `scale(${K})`, transformOrigin: "0 0" }}>
              <DashboardShell
                role="parent"
                active={active}
                user={{ name: "Penda Diop", email: "2 enfants rattachés" }}
                width={SHELL_W}
                height={SHELL_H}
                headerRight={<KidSwitcher />}
              >
                {page === 0 ? <CodePage /> : null}
                {page === 1 ? (
                  <PageIn at={TO_DASH}>
                    <Dashboard />
                  </PageIn>
                ) : null}
                {page === 2 ? (
                  <PageIn at={TO_PROGRESS}>
                    <ProgressPage />
                  </PageIn>
                ) : null}
                {page === 3 ? (
                  <PageIn at={TO_REPORT}>
                    <ParentReportPage />
                  </PageIn>
                ) : null}
              </DashboardShell>
              <Cursor
                path={[
                  { f: 50, x: 640, y: 480 },
                  { f: 72, x: OX + 95, y: OY + 262 },
                  { f: 100, x: OX + 640, y: OY + 380 },
                  { f: 106, x: OX + 660, y: OY + 386 },
                  { f: 180, x: OX + 300, y: OY + 380 },
                  { f: 194, x: OX + 190, y: OY + 330 },
                  { f: 262, x: OX + 600, y: OY + 160 },
                  { f: 276, x: OX + 745, y: OY + 182 },
                  { f: 300, x: OX + 680, y: OY + 300 },
                ]}
                clicks={[78, 110, 200, 282]}
                show={[50, 300]}
                scale={1 / K + 0.1}
              />
            </div>
          </BrowserFrame>
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 1430,
          top: 560,
          opacity: mail,
          transform: `translate(${(1 - mail) * 260}px, ${(1 - mail) * 40}px) rotate(${-3 + (1 - mail) * 6}deg)`,
        }}
      >
        <EmailCard />
      </div>
      <ClickSounds at={[78, 110, 200, 282]} />
      <VoiceCues scene="parents" />
    </AbsoluteFill>
  );
};
