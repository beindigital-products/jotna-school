"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check, Lightbulb, Play, Volume2, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { MotionConfig } from "framer-motion";
import { Pio } from "@/components/student/pio";
import { SpeechBubble } from "@/components/student/game/speech-bubble";
import {
  ActionButton3D,
  GameFeelProvider,
  ProgressTrack,
  Reward,
  SceneActionBar,
  Solid3D,
  StageBackdrop,
  Tile3D,
  useGameFeel,
  type GameFeelLevel,
  type SceneListenStatus,
  type TileElevation,
  type TileState,
} from "@/components/student/game-kit";

/**
 * LA MONTRE — toutes les briques, tous les états, riche et sobre côte à côte.
 *
 * `?level=riche` ou `?level=sobre` fixe le niveau pour toute la page (sinon
 * l'appareil décide, comme en séance). Les deux boutons en haut changent
 * l'adresse. Le dernier bloc est l'écran type d'un exercice, jouable : on
 * choisit une tuile, on valide, la récompense jaillit ou la tuile dit non.
 */
export function KitShowcase() {
  const params = useSearchParams();
  const requested = params.get("level");
  const forced: GameFeelLevel | null = requested === "riche" || requested === "sobre" ? requested : null;

  const page = (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-[linear-gradient(180deg,#bfe6fb_0%,#f9efd2_45%,#f6dfa4_100%)] pb-[calc(env(safe-area-inset-bottom)+3rem)] pt-[env(safe-area-inset-top)] text-amber-950">
        <div className="mx-auto max-w-2xl px-4">
          <Header forced={forced} />
          <LevelBadge />
          <Section title="1. La tuile 3D" sub="Posée, choisie, juste, fausse, désactivée ; six teintes d'option ; trois élévations.">
            <TilesDemo />
          </Section>
          <Section title="2. Le bouton d'action" sub="Les teintes de GameButton, le reflet quand la réponse est prête, l'état occupé, l'état désactivé.">
            <ButtonsDemo />
          </Section>
          <Section title="2 bis. La barre d'action : Écouter puis Valider" sub="Le gros bouton bleu de l'énoncé dans ses quatre états (repos, chargement, lecture, sans voix), seul ou au-dessus de Valider ; sur un écran de 960 px ou moins (tous les téléphones debout), les deux sur une ligne.">
            <ActionBarDemo />
          </Section>
          <Section title="3. La piste de progression" sub="Dix pierres, le jeton qui avance, les cœurs des essais, les étoiles.">
            <ProgressDemo />
          </Section>
          <Section title="4. La récompense" sub="Anneau, étoiles en roue, pièces qui tournent, confettis plafonnés.">
            <RewardDemo />
          </Section>
          <Section title="5. Les solides" sub="Cube, pavé, cylindre, boule : des faces HTML dans un espace 3D, lumière peinte.">
            <SolidsDemo />
          </Section>
          <Section title="6. La scène et l'écran type" sub="Un exercice jouable, assemblé avec les briques ci-dessus.">
            <ScreenDemo />
          </Section>
        </div>
      </div>
    </MotionConfig>
  );

  return forced ? <GameFeelProvider level={forced}>{page}</GameFeelProvider> : page;
}

function Header({ forced }: { forced: GameFeelLevel | null }) {
  const tab = (level: GameFeelLevel | null, label: string) => {
    const active = forced === level;
    return (
      <Link
        href={level ? `/dev/kit/?level=${level}` : "/dev/kit/"}
        className={`rounded-full px-4 py-2 font-display text-sm font-extrabold transition-colors ${
          active ? "bg-orange-500 text-white shadow-md shadow-orange-300/60" : "bg-white/70 text-amber-900 hover:bg-white"
        }`}
        aria-current={active ? "page" : undefined}
      >
        {label}
      </Link>
    );
  };
  return (
    <header className="pt-6">
      <h1 className="font-display text-3xl font-extrabold">Boîte à outils du jeu</h1>
      <p className="mt-1 text-sm font-semibold text-amber-900/75">
        <code>components/student/game-kit</code> · page de développement
      </p>
      <nav aria-label="Niveau" className="mt-4 flex flex-wrap gap-2">
        {tab(null, "Appareil")}
        {tab("riche", "Riche")}
        {tab("sobre", "Sobre")}
      </nav>
    </header>
  );
}

function LevelBadge() {
  const feel = useGameFeel();
  return (
    // Le niveau et le mouvement réduit ne sont connus qu'après l'hydratation :
    // le texte peut différer du HTML pré-rendu, c'est attendu ici.
    <p
      suppressHydrationWarning
      className="mt-3 inline-flex items-center gap-2 rounded-full border-2 border-white bg-[#fff8e6] px-3 py-1 font-display text-xs font-extrabold text-amber-900 shadow-[0_2px_0_#d6c39a]"
    >
      Niveau {feel.level}
      {feel.reducedMotion && " · mouvement réduit"}
      {" · "}
      {feel.budget.particles} confettis · inclinaison {feel.budget.tilt ? "oui" : "non"} · dérive {feel.budget.drift ? "oui" : "non"}
    </p>
  );
}

function Section({ title, sub, children }: { title: string; sub: string; children: ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-2xl font-extrabold">{title}</h2>
      <p className="mt-1 text-sm font-semibold text-amber-900/75">{sub}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-3xl border-2 border-amber-200 bg-white p-4 shadow-lg ${className}`}>{children}</div>;
}

/* ── 1. Tuiles ─────────────────────────────────────────────────────────── */

const STATES: { state: TileState; label: string }[] = [
  { state: "repos", label: "Posée" },
  { state: "choisie", label: "Choisie" },
  { state: "juste", label: "Juste" },
  { state: "fausse", label: "Fausse" },
];

function TilesDemo() {
  const [picked, setPicked] = useState<number | null>(1);
  return (
    <div className="space-y-4">
      <Card>
        <p className="mb-3 font-display text-sm font-extrabold text-amber-900/70">Les états</p>
        <div className="space-y-4">
          {STATES.map(({ state, label }, i) => (
            <Tile3D key={state} state={state} tone={i} badge={String.fromCharCode(65 + i)} onPress={() => {}}>
              {label} : la mangue
            </Tile3D>
          ))}
          <Tile3D state="repos" tone={4} badge="E" disabled onPress={() => {}}>
            Désactivée : la banane
          </Tile3D>
        </div>
      </Card>

      <Card>
        <p className="mb-3 font-display text-sm font-extrabold text-amber-900/70">Jouable : touche une tuile</p>
        <div className="space-y-4">
          {["3 + 4 = 7", "3 + 4 = 8", "3 + 4 = 6"].map((text, i) => (
            <Tile3D key={text} state={picked === i ? "choisie" : "repos"} tone={i} badge={String.fromCharCode(65 + i)} onPress={() => setPicked(i)}>
              {text}
            </Tile3D>
          ))}
        </div>
      </Card>

      <Card>
        <p className="mb-3 font-display text-sm font-extrabold text-amber-900/70">Les élévations et les tailles</p>
        <div className="grid grid-cols-2 gap-4">
          {(["plat", "posee", "soulevee", "saisie"] as TileElevation[]).map((elevation, i) => (
            <Tile3D key={elevation} elevation={elevation} tone={(i + 2) % 6} align="center" onPress={() => {}}>
              {elevation}
            </Tile3D>
          ))}
        </div>
        <div className="mt-6 grid grid-cols-3 gap-4">
          <Tile3D tone="neutre" align="center" size="lg" onPress={() => {}}>
            <span className="text-3xl">🥭</span>
          </Tile3D>
          <Tile3D tone="neutre" align="center" size="lg" state="choisie" onPress={() => {}}>
            <span className="text-3xl">🍌</span>
          </Tile3D>
          <Tile3D tone="neutre" align="center" size="lg" state="juste" onPress={() => {}}>
            <span className="text-3xl">🍉</span>
          </Tile3D>
        </div>
        <div className="mt-6 grid grid-cols-6 gap-2">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Tile3D key={i} tone={i} state="choisie" align="center" onPress={() => {}}>
              {i + 1}
            </Tile3D>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ── 2. Boutons ────────────────────────────────────────────────────────── */

function ButtonsDemo() {
  const [busy, setBusy] = useState(false);
  return (
    <Card className="space-y-4">
      <ActionButton3D shine onClick={() => {}}>
        Valider
      </ActionButton3D>
      <ActionButton3D disabled onClick={() => {}}>
        Valider
      </ActionButton3D>
      <ActionButton3D
        busy={busy}
        onClick={() => {
          setBusy(true);
          setTimeout(() => setBusy(false), 1500);
        }}
      >
        Occupé 1,5 s au toucher
      </ActionButton3D>
      <div className="grid grid-cols-2 gap-4">
        <ActionButton3D tone="green" size="md" icon={<Play className="h-5 w-5 fill-current" aria-hidden />} onClick={() => {}}>
          Suivant
        </ActionButton3D>
        <ActionButton3D tone="sky" size="md" icon={<Volume2 className="h-5 w-5" aria-hidden />} onClick={() => {}}>
          Écouter
        </ActionButton3D>
        <ActionButton3D tone="white" size="md" icon={<Lightbulb className="h-5 w-5" aria-hidden />} onClick={() => {}}>
          Un indice
        </ActionButton3D>
        <ActionButton3D tone="red" size="md" icon={<X className="h-5 w-5" strokeWidth={3} aria-hidden />} onClick={() => {}}>
          Quitter
        </ActionButton3D>
      </div>
    </Card>
  );
}

/* ── 2 bis. La barre d'action ──────────────────────────────────────────── */

const LISTEN_STATES: { status: SceneListenStatus; label: string }[] = [
  { status: "idle", label: "repos" },
  { status: "loading", label: "chargement" },
  { status: "playing", label: "lecture (sert d'arrêt)" },
  { status: "unavailable", label: "sans voix" },
];

/** Les quatre états du bouton Écouter ; un toucher sur « lecture » le remet au repos, comme en séance. */
function ActionBarDemo() {
  const [status, setStatus] = useState<SceneListenStatus>("idle");
  return (
    <Card className="space-y-6">
      {LISTEN_STATES.map(({ status: s, label }) => (
        <div key={s} className="space-y-2">
          <p className="font-mono text-xs font-bold text-amber-950/70">{label}</p>
          <SceneActionBar listen={{ status: s, onPress: () => {} }}>
            <ActionButton3D shine onClick={() => {}} icon={<Check className="h-6 w-6" strokeWidth={3} aria-hidden />}>
              Valider
            </ActionButton3D>
          </SceneActionBar>
        </div>
      ))}
      <div className="space-y-2">
        <p className="font-mono text-xs font-bold text-amber-950/70">seul, sans Valider (réponse au toucher) ; touchez-le : repos, lecture, repos…</p>
        <SceneActionBar listen={{ status, onPress: () => setStatus((s) => (s === "playing" ? "idle" : "playing")) }} />
      </div>
    </Card>
  );
}

/* ── 3. Progression ────────────────────────────────────────────────────── */

function ProgressDemo() {
  const [current, setCurrent] = useState(2);
  const [left, setLeft] = useState(5);
  return (
    <Card className="space-y-6">
      <ProgressTrack total={10} current={current} missed={[1]} attemptsLeft={left} stars={current * 3 - 2} />
      <ProgressTrack total={5} current={0} attemptsLeft={5} />
      <ProgressTrack total={10} current={10} missed={[3, 7]} stars={24} />
      <div className="flex flex-wrap gap-3">
        <ActionButton3D size="md" tone="green" className="!w-auto" onClick={() => setCurrent((c) => Math.min(10, c + 1))}>
          Avancer
        </ActionButton3D>
        <ActionButton3D size="md" tone="white" className="!w-auto" onClick={() => setLeft((n) => Math.max(0, n - 1))}>
          Perdre un cœur
        </ActionButton3D>
        <ActionButton3D
          size="md"
          tone="white"
          className="!w-auto"
          onClick={() => {
            setCurrent(2);
            setLeft(5);
          }}
        >
          Remettre
        </ActionButton3D>
      </div>
    </Card>
  );
}

/* ── 4. Récompense ─────────────────────────────────────────────────────── */

function RewardDemo() {
  const [fire, setFire] = useState<number | null>(null);
  return (
    <Card>
      <div className="relative mx-auto flex h-56 max-w-sm items-center justify-center">
        <Tile3D state={fire ? "juste" : "repos"} tone={3} badge="C" align="center" className="!w-56" onPress={() => setFire((n) => (n ?? 0) + 1)}>
          Touche-moi
        </Tile3D>
        <Reward fire={fire} />
      </div>
      <p className="text-center text-xs font-semibold text-amber-900/70">
        Sans son ni vibration ici (<code>celebrate</code> absent) : en séance, <code>answer-feedback</code> les joue.
      </p>
    </Card>
  );
}

/* ── 5. Solides ────────────────────────────────────────────────────────── */

function SolidsDemo() {
  return (
    <Card>
      <div className="grid grid-cols-2 place-items-center gap-2">
        <Solid3D kind="cube" color="#f6c452" />
        <Solid3D kind="pave" color="#7ec8f5" />
        <Solid3D kind="cylindre" color="#6ab04c" />
        <Solid3D kind="boule" color="#f97316" />
      </div>
      <div className="mt-2 grid grid-cols-4 place-items-center gap-1">
        <Solid3D kind="cube" size={44} color="#a855f7" spin={false} />
        <Solid3D kind="pave" size={44} color="#ec4899" spin={false} />
        <Solid3D kind="cylindre" size={44} color="#14b8a6" spin={false} />
        <Solid3D kind="boule" size={44} color="#3b82f6" spin={false} />
      </div>
    </Card>
  );
}

/* ── 6. Écran type ─────────────────────────────────────────────────────── */

const OPTIONS = ["7", "8", "6", "9"];
const RIGHT = 0;

function ScreenDemo() {
  const [picked, setPicked] = useState<number | null>(null);
  const [verdict, setVerdict] = useState<boolean | null>(null);
  const [fire, setFire] = useState<number | null>(null);
  const [tries, setTries] = useState(5);
  const feel = useGameFeel();

  const stateOf = (i: number): TileState => {
    if (verdict !== null && picked === i) return verdict ? "juste" : "fausse";
    return picked === i ? "choisie" : "repos";
  };

  const validate = () => {
    if (picked === null) return;
    const ok = picked === RIGHT;
    setVerdict(ok);
    if (ok) {
      setFire((n) => (n ?? 0) + 1);
      feel.vibrate("correct");
    } else {
      setTries((t) => Math.max(0, t - 1));
      feel.vibrate("wrong");
      setTimeout(() => {
        setVerdict(null);
        setPicked(null);
      }, 1400);
    }
  };

  return (
    <StageBackdrop className="-mx-4 rounded-[2rem] sm:mx-0" horizon={72}>
      <div className="px-4 pb-6 pt-4">
        {/* L'en-tête : la piste, le son, la sortie. */}
        <div className="flex items-center gap-2 rounded-2xl border-2 border-white/70 bg-[#fff7e0]/90 px-3 py-2 shadow-md">
          <ProgressTrack total={10} current={verdict ? 3 : 2} attemptsLeft={tries} className="flex-1" />
          <button
            type="button"
            aria-label="Quitter"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-amber-200 bg-white text-amber-900 shadow-[0_2px_0_#d6c39a]"
          >
            <X className="h-5 w-5" strokeWidth={3} aria-hidden />
          </button>
        </div>

        {/* La scène : Pio et sa bulle. */}
        <div className="mt-3 flex items-end gap-2">
          <Pio state={verdict ? "cheer" : verdict === false ? "encourage" : "think"} size={96} animated={false} />
          <SpeechBubble bubbleKey={String(verdict)} tail="left" compact className="mb-6">
            {verdict ? "Bravo !" : verdict === false ? "Presque ! Réessaie." : "Compte bien avec moi."}
          </SpeechBubble>
        </div>

        {/* La carte : la consigne et les tuiles. */}
        <div className="relative mt-2 rounded-3xl border-2 border-white bg-[#fff8e6] p-4 shadow-[0_6px_0_#d6c39a,0_18px_30px_-16px_rgba(60,30,0,0.5)]">
          <p className="font-display text-xl font-extrabold leading-tight text-amber-950">Combien font 3 + 4 ?</p>
          <div className="mt-4 grid grid-cols-2 gap-4">
            {OPTIONS.map((text, i) => (
              <Tile3D
                key={text}
                state={stateOf(i)}
                tone={i}
                badge={String.fromCharCode(65 + i)}
                align="center"
                size="lg"
                disabled={verdict !== null}
                onPress={() => setPicked(i)}
              >
                {text}
              </Tile3D>
            ))}
          </div>
          <Reward fire={fire} />
        </div>

        {/* Le bouton : il appelle dès qu'une tuile est choisie. */}
        <div className="mt-5">
          {verdict ? (
            <ActionButton3D
              tone="green"
              icon={<Check className="h-6 w-6" strokeWidth={3} aria-hidden />}
              onClick={() => {
                setVerdict(null);
                setPicked(null);
                setTries(5);
              }}
            >
              Suivant
            </ActionButton3D>
          ) : (
            <ActionButton3D shine={picked !== null} disabled={picked === null || verdict !== null} onClick={validate}>
              Valider
            </ActionButton3D>
          )}
        </div>
      </div>
    </StageBackdrop>
  );
}
