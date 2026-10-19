import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import {
  CheckCircle2,
  ChevronRight,
  FileBarChart,
  FileText,
  Loader2,
  PenTool,
  Pencil,
  Plus,
  Upload,
  Users,
  XCircle,
} from "lucide-react";
import { C, FONT } from "../theme";
import { IN_OUT, OUT, countUp, progress } from "../lib/anim";
import { Backdrop } from "../components/backdrop";
import { BrowserFrame } from "../components/frames";
import { ChapterText } from "../components/chapter";
import { ClickSounds, Cursor } from "../components/cursor";
import { ACCENT, DashButton, DashboardShell } from "../components/dashboard";
import { Avatar, Card, Pill, PopIn, Reveal } from "../components/ui";
import { VoiceCues } from "../voice";

const EMERALD = ACCENT.teacher;

const BROWSER = { left: 80, top: 96, width: 1250, height: 888 };
const K = 1.12;
const SHELL_W = BROWSER.width / K;
const SHELL_H = (BROWSER.height - 54) / K;
const OX = 256 + 32;
const OY = 64 + 32;

const TO_PDF = 92;
const TO_DETAIL = 164;
const EXTRACTED = 214;
const PUBLISH = 296;
const TO_STUDENTS = 338;

const press = (frame: number, at: number) => {
  const d = frame - at;
  return d >= -2 && d <= 5 ? 1 - Math.abs(d - 1) / 4 : 0;
};

const PageIn: React.FC<{ at: number; children: React.ReactNode }> = ({ at, children }) => {
  const frame = useCurrentFrame();
  const p = progress(frame, at, 12);
  return <div style={{ opacity: p, transform: `translateX(${(1 - p) * 30}px)` }}>{children}</div>;
};

const Kpi: React.FC<{ icon: React.ReactNode; label: string; value: number; at: number }> = ({ icon, label, value, at }) => {
  const frame = useCurrentFrame();
  return (
    <Card style={{ flex: 1 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {icon}
        <span style={{ fontSize: 14, color: C.muted }}>{label}</span>
      </div>
      <div style={{ fontSize: 32, fontWeight: 700, marginTop: 8, fontVariantNumeric: "tabular-nums" }}>{countUp(frame, at, 30, value)}</div>
    </Card>
  );
};

const ACTIVITY = [
  { ok: true, who: "Awa Diop", what: "Les fractions — Combien fait ½ + ¼ ?", when: "5 oct., 14:32" },
  { ok: true, who: "Moussa Fall", what: "La multiplication — Calcule 24 × 3.", when: "5 oct., 14:18" },
  { ok: false, who: "Aminata Sow", what: "Les fractions — Range ces fractions du plus petit au plus grand.", when: "5 oct., 13:57" },
  { ok: true, who: "Ibrahima Ba", what: "Les fractions — Relie chaque fraction à son dessin.", when: "5 oct., 13:40" },
];

const Dashboard: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <div style={{ width: 787 }}>
      <div style={{ fontSize: 24, fontWeight: 700 }}>Bonjour, Fatou !</div>
      <div style={{ fontSize: 14, color: C.muted, marginTop: 4 }}>Gérez vos exercices, vos élèves et consultez leurs résultats.</div>
      <div style={{ display: "flex", gap: 14, marginTop: 22 }}>
        <Kpi icon={<PenTool size={18} color={EMERALD} />} label="Exercices publiés" value={48} at={14} />
        <Kpi icon={<Users size={18} color={EMERALD} />} label="Mes élèves" value={6} at={18} />
        <Kpi icon={<FileBarChart size={18} color={EMERALD} />} label="Rapports générés" value={23} at={22} />
        <Kpi icon={<FileText size={18} color={EMERALD} />} label="PDFs importés" value={4} at={26} />
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <DashButton color={EMERALD} icon={<Plus size={16} />} pressed={press(frame, 84)}>
          Ajouter un PDF
        </DashButton>
        <DashButton outline icon={<PenTool size={16} />}>
          Créer un exercice
        </DashButton>
        <DashButton outline icon={<Users size={16} />}>
          Voir mes élèves
        </DashButton>
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, marginTop: 28, marginBottom: 8 }}>Activité récente</div>
      <Card pad={0}>
        {ACTIVITY.map((a, i) => (
          <Reveal key={a.who} at={30 + i * 5} dy={10}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 18px", borderTop: i ? `1px solid ${C.line}` : "none", fontSize: 14 }}>
              {a.ok ? <CheckCircle2 size={18} color="#22c55e" /> : <XCircle size={18} color="#f87171" />}
              <b style={{ fontWeight: 600 }}>{a.who}</b>
              <span style={{ color: C.muted, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.what}</span>
              <span style={{ color: C.faint, fontSize: 13 }}>{a.when}</span>
            </div>
          </Reveal>
        ))}
      </Card>
    </div>
  );
};

const PdfPage: React.FC = () => {
  const frame = useCurrentFrame();
  const uploading = frame >= 122;
  const bar = progress(frame, 122, 30);
  const msg = frame < 140 ? "Envoi du fichier..." : "Création de l'enregistrement...";
  return (
    <div style={{ width: 787 }}>
      <div style={{ fontSize: 24, fontWeight: 700 }}>Mes imports PDF</div>
      <div style={{ fontSize: 14, color: C.muted, marginTop: 4 }}>Importez des PDFs pour générer automatiquement des exercices via l'IA.</div>
      <div
        style={{
          marginTop: 22,
          borderRadius: 14,
          border: `2px dashed ${uploading ? EMERALD : "#d1d5dc"}`,
          background: uploading ? "#f0fdf4" : "#fff",
          padding: 22,
          display: "flex",
          gap: 24,
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Matière</div>
          <div
            style={{
              marginTop: 8,
              width: 250,
              height: 40,
              borderRadius: 8,
              border: `1px solid ${C.line2}`,
              display: "flex",
              alignItems: "center",
              padding: "0 12px",
              fontSize: 14,
              justifyContent: "space-between",
            }}
          >
            Mathématiques <ChevronRight size={15} style={{ transform: "rotate(90deg)" }} />
          </div>
          <DashButton color={EMERALD} icon={<Upload size={16} />} pressed={press(frame, 118)} style={{ marginTop: 14 }}>
            Importer un PDF
          </DashButton>
        </div>
        <div style={{ flex: 1, minHeight: 120, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {uploading ? (
            <PopIn at={122} from={0.8}>
              <div style={{ width: 330, borderRadius: 12, background: "#fff", border: `1px solid ${C.line2}`, padding: 14, boxShadow: "0 10px 30px -14px rgba(17,24,39,0.3)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <FileText size={22} color="#ef4444" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>Fractions-CM1.pdf</div>
                    <div style={{ fontSize: 12, color: C.muted }}>1.2 Mo · {msg}</div>
                  </div>
                </div>
                <div style={{ height: 6, borderRadius: 6, background: C.line, marginTop: 12, overflow: "hidden" }}>
                  <div style={{ width: `${bar * 100}%`, height: "100%", background: EMERALD }} />
                </div>
              </div>
            </PopIn>
          ) : (
            <div style={{ color: C.faint, fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
              <Upload size={18} /> Sélectionnez d'abord une matière
            </div>
          )}
        </div>
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, marginTop: 26, marginBottom: 10 }}>Fichiers importés</div>
      <Card pad={0}>
        {[
          ["Conjugaison-CM1.pdf", "Français", "0.8 Mo", "Publié", "#dcfce7", "#15803d"],
          ["Le-vivant-CM1.pdf", "Sciences", "2.1 Mo", "Relu", "#e0e7ff", "#4338ca"],
        ].map(([f, m, t, st, bg, fg], i) => (
          <div key={f} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 18px", borderTop: i ? `1px solid ${C.line}` : "none", fontSize: 14 }}>
            <FileText size={18} color="#ef4444" />
            <span style={{ fontWeight: 600, flex: 1 }}>{f}</span>
            <span style={{ color: C.muted, width: 110 }}>{m}</span>
            <span style={{ color: C.muted, width: 70 }}>{t}</span>
            <Pill bg={bg} color={fg}>
              {st}
            </Pill>
          </div>
        ))}
      </Card>
    </div>
  );
};

const TYPES: Record<string, [string, string]> = {
  QCM: ["#dbeafe", "#1d4ed8"],
  "Glisser-déposer": ["#f3e8ff", "#7e22ce"],
  Association: ["#fef3c6", "#b45309"],
  "Remise en ordre": ["#dcfce7", "#15803d"],
  "Réponse courte": ["#ffe4e6", "#be123c"],
};

const GENERATED = [
  { type: "QCM", prompt: "Combien fait ½ + ¼ ?", answer: "¾" },
  { type: "Glisser-déposer", prompt: "Classe ces fractions : plus petites ou plus grandes que 1.", answer: "¾, ½ | 5/4, 3/2" },
  { type: "Association", prompt: "Relie chaque fraction à son dessin.", answer: "½ ↔ ◐" },
  { type: "Remise en ordre", prompt: "Range du plus petit au plus grand : ¾, ¼, ½.", answer: "¼, ½, ¾" },
  { type: "Réponse courte", prompt: "Quelle fraction représente 3 parts sur 8 ?", answer: "3/8" },
  { type: "QCM", prompt: "Quelle fraction est égale à 2/4 ?", answer: "½" },
];

const Stepper: React.FC = () => {
  const frame = useCurrentFrame();
  const steps = ["Importé", "Extrait", "Relu", "Publié"];
  const reached = [TO_DETAIL, EXTRACTED, EXTRACTED + 30, PUBLISH + 4];
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {steps.map((s, i) => {
        const on = progress(frame, reached[i], 10);
        const line = i < steps.length - 1 ? progress(frame, reached[i + 1] - 12, 12) : 0;
        return (
          <React.Fragment key={s}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, width: 90 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  background: on > 0.5 ? EMERALD : "#fff",
                  border: `2px solid ${on > 0.5 ? EMERALD : C.line2}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: `scale(${1 + Math.sin(on * Math.PI) * 0.18})`,
                  color: "#fff",
                }}
              >
                {on > 0.5 ? <CheckCircle2 size={18} /> : <span style={{ color: C.faint, fontSize: 13, fontWeight: 700 }}>{i + 1}</span>}
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: on > 0.5 ? C.ink : C.faint }}>{s}</span>
            </div>
            {i < steps.length - 1 ? (
              <div style={{ flex: 1, height: 3, background: C.line2, borderRadius: 3, marginBottom: 22, overflow: "hidden" }}>
                <div style={{ width: `${line * 100}%`, height: "100%", background: EMERALD }} />
              </div>
            ) : null}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export const TeacherPdfDetail: React.FC = () => {
  const frame = useCurrentFrame();
  const extracted = frame >= EXTRACTED;
  const published = frame >= PUBLISH + 2;
  const scroll = interpolate(frame, [EXTRACTED + 20, EXTRACTED + 44], [0, 150], { easing: IN_OUT, extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const spin = (frame * 12) % 360;
  return (
    <div style={{ width: 787, transform: `translateY(${-scroll}px)` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <FileText size={24} color="#ef4444" />
        </div>
        <div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>Fractions-CM1.pdf</div>
          <div style={{ fontSize: 14, color: C.muted }}>Import PDF #a1b2c3</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 18 }}>
        {[
          ["Taille", "1.2 Mo"],
          ["Matière", "Mathématiques"],
          ["Date d'import", "5 oct. 2026"],
          ["Exercices", extracted ? "12" : "—"],
        ].map(([l, v]) => (
          <Card key={l} style={{ flex: 1, padding: 14 }}>
            <div style={{ fontSize: 12, color: C.muted }}>{l}</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>{v}</div>
          </Card>
        ))}
      </div>
      <Card style={{ marginTop: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Progression</div>
        <Stepper />
      </Card>
      <div
        style={{
          marginTop: 14,
          borderRadius: 12,
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          background: extracted ? "#f0fdf4" : "#fefce8",
          border: `1px solid ${extracted ? "#bbf7d0" : "#fef08a"}`,
          fontSize: 14,
        }}
      >
        {extracted ? (
          <CheckCircle2 size={20} color="#16a34a" />
        ) : (
          <Loader2 size={20} color="#ca8a04" style={{ transform: `rotate(${spin}deg)` }} />
        )}
        <div>
          <div style={{ fontWeight: 700, color: extracted ? "#15803d" : "#a16207" }}>{extracted ? "Extraction terminée" : "Extraction en cours"}</div>
          <div style={{ color: extracted ? "#166534" : "#854d0e" }}>
            {extracted
              ? "12 exercice(s) généré(s) le 5 octobre 2026 à 14:32"
              : "L'IA analyse le document et extrait les exercices. Cela peut prendre quelques minutes."}
          </div>
        </div>
      </div>
      {published ? (
        <PopIn at={PUBLISH + 2} from={0.9}>
          <div style={{ marginTop: 12, borderRadius: 12, padding: "12px 16px", background: EMERALD, color: "#fff", fontSize: 14, fontWeight: 600, display: "flex", gap: 10, alignItems: "center" }}>
            <CheckCircle2 size={18} /> 12 exercice(s) publié(s) avec succès.
          </div>
        </PopIn>
      ) : null}
      {extracted ? (
        <div style={{ marginTop: 18 }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>Exercices générés (12)</div>
              <div style={{ fontSize: 13, color: C.muted }}>{published ? "12 publié(s) · 0 brouillon(s)" : "0 publié(s) · 12 brouillon(s)"}</div>
            </div>
            <DashButton color={EMERALD} pressed={press(frame, PUBLISH)} style={{ marginLeft: "auto" }}>
              Publier tous les exercices
            </DashButton>
          </div>
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
            {GENERATED.map((g, i) => {
              const [bg, fg] = TYPES[g.type];
              const flip = progress(frame, PUBLISH + 4 + i * 3, 8);
              return (
                <Reveal key={i} at={EXTRACTED + 6 + i * 5} dy={12}>
                  <Card style={{ padding: "11px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: "#ecfdf5", color: EMERALD, fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {i + 1}
                    </div>
                    <Pill bg={bg} color={fg} size={12}>
                      {g.type}
                    </Pill>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{g.prompt}</div>
                      <div style={{ fontSize: 12, color: C.muted }}>Réponse : {g.answer}</div>
                    </div>
                    <div style={{ position: "relative", width: 82, height: 24 }}>
                      <Pill bg="#fef9c3" color="#a16207" size={12} style={{ position: "absolute", right: 0, opacity: 1 - flip }}>
                        Brouillon
                      </Pill>
                      <Pill bg="#dcfce7" color="#15803d" size={12} style={{ position: "absolute", right: 0, opacity: flip, transform: `scale(${0.8 + flip * 0.2})` }}>
                        Publié
                      </Pill>
                    </div>
                    <Pencil size={15} color={C.faint} />
                  </Card>
                </Reveal>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
};

const STUDENTS = [
  { name: "Awa Diop", ex: 45, th: 2, from: "#fbbf24", to: "#f97316" },
  { name: "Moussa Fall", ex: 38, th: 2, from: "#38bdf8", to: "#6366f1" },
  { name: "Aminata Sow", ex: 41, th: 1, from: "#f472b6", to: "#a855f7" },
  { name: "Ibrahima Ba", ex: 29, th: 1, from: "#34d399", to: "#0ea5e9" },
  { name: "Mariama Diallo", ex: 52, th: 3, from: "#facc15", to: "#84cc16" },
  { name: "Cheikh Faye", ex: 33, th: 1, from: "#fb7185", to: "#f59e0b" },
];

const StudentsPage: React.FC = () => (
  <div style={{ width: 787 }}>
    <div style={{ fontSize: 24, fontWeight: 700 }}>Mes élèves</div>
    <div style={{ fontSize: 14, color: C.muted, marginTop: 4, marginBottom: 18 }}>Les élèves qui vous sont associés comme professeur.</div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
      {STUDENTS.map((s, i) => (
        <PopIn key={s.name} at={TO_STUDENTS + 6 + i * 4} from={0.88}>
          <Card style={{ padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Avatar name={s.name} size={40} from={s.from} to={s.to} />
              <div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{s.name}</div>
                <div style={{ fontSize: 12, color: C.muted }}>
                  {s.th} thématique{s.th > 1 ? "s" : ""} terminée{s.th > 1 ? "s" : ""}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <div style={{ flex: 1, background: "#ecfdf5", borderRadius: 8, padding: "8px 10px" }}>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{s.ex}</div>
                <div style={{ fontSize: 11, color: C.muted }}>Exercices</div>
              </div>
              <div style={{ flex: 1, background: C.amber50, borderRadius: 8, padding: "8px 10px" }}>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{s.th}</div>
                <div style={{ fontSize: 11, color: C.muted }}>Thématiques</div>
              </div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: EMERALD, marginTop: 10 }}>Voir le détail →</div>
          </Card>
        </PopIn>
      ))}
    </div>
  </div>
);

export const TeachersScene: React.FC = () => {
  const frame = useCurrentFrame();
  const enter = progress(frame, 0, 34, OUT);
  const rotY = 8 + (1 - enter) * 16 + Math.sin(frame / 55) * 0.6;
  const page = frame < TO_PDF ? 0 : frame < TO_DETAIL ? 1 : frame < TO_STUDENTS ? 2 : 3;
  const url = ["teacher/dashboard", "teacher/pdf-uploads", "teacher/pdf-uploads/detail", "teacher/students"][page];
  const active = page === 3 ? "Mes élèves" : "Tableau de bord";
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <Backdrop tone="warm" />
      <ChapterText
        index="04"
        eyebrow="Les professeurs"
        title={["Un", "PDF", "devient", "des", { text: "exercices", marker: "rgba(255,210,48,0.85)" }]}
        lead="L'IA lit la fiche et propose les exercices. Le professeur relit, puis publie."
        bullets={[
          { text: "Import d'une fiche PDF", at: 124 },
          { text: "Exercices générés par l'IA", at: 220 },
          { text: "Relecture avant publication", at: 298 },
          { text: "Suivi de chaque élève", at: 344 },
        ]}
        delay={8}
        width={450}
        size={60}
        accent={C.amber600}
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
            transform: `translateX(${(1 - enter) * -380}px) rotateY(${rotY}deg) rotateX(2deg)`,
            transformOrigin: "100% 50%",
          }}
        >
          <BrowserFrame width={BROWSER.width} height={BROWSER.height} url={`jotnaschool.com/${url}`} style={{ left: 0, top: 0 }}>
            <div style={{ position: "absolute", left: 0, top: 0, width: SHELL_W, height: SHELL_H, transform: `scale(${K})`, transformOrigin: "0 0" }}>
              <DashboardShell role="teacher" active={active} user={{ name: "Fatou Diop", email: "Professeure · CM1 A" }} width={SHELL_W} height={SHELL_H}>
                {page === 0 ? <Dashboard /> : null}
                {page === 1 ? (
                  <PageIn at={TO_PDF}>
                    <PdfPage />
                  </PageIn>
                ) : null}
                {page === 2 ? (
                  <PageIn at={TO_DETAIL}>
                    <TeacherPdfDetail />
                  </PageIn>
                ) : null}
                {page === 3 ? (
                  <PageIn at={TO_STUDENTS}>
                    <StudentsPage />
                  </PageIn>
                ) : null}
              </DashboardShell>
              <Cursor
                path={[
                  { f: 50, x: 700, y: 520 },
                  { f: 78, x: OX + 76, y: OY + 230 },
                  { f: 106, x: OX + 200, y: OY + 230 },
                  { f: 114, x: OX + 84, y: OY + 210 },
                  { f: 200, x: OX + 520, y: OY + 320 },
                  { f: 288, x: OX + 680, y: OY + 377 - 150 },
                  { f: 330, x: OX + 560, y: OY + 420 },
                ]}
                clicks={[84, 118, PUBLISH]}
                show={[50, 334]}
                scale={1 / K + 0.1}
              />
            </div>
          </BrowserFrame>
        </div>
      </div>
      <ClickSounds at={[84, 118, PUBLISH]} />
      <VoiceCues scene="teachers" />
    </AbsoluteFill>
  );
};

