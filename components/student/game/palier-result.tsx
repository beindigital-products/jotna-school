"use client";

import { Fragment, useCallback, useEffect, useLayoutEffect, useState, type ReactNode } from "react";
import { useMutation, useQuery } from "convex/react";
import { animate, motion, useMotionValue, useScroll, useTransform } from "framer-motion";
import {
  Check,
  Flag,
  Lock,
  Map as MapIcon,
  Play,
  RotateCcw,
  Sparkles,
  Star,
  Trophy,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { difficultyStage } from "@/convex/palierRules";
import { PALIER_SIZE } from "@/convex/paliers/scoring";
import { JotnaLoader } from "@/components/jotna-loader";
import { BadgeShield } from "@/components/student/badge-icon";
import { GameButton } from "@/components/student/game/game-button";
import { SpeechBubble } from "@/components/student/game/speech-bubble";
import { LevelUpOverlay } from "@/components/student/level-up-overlay";
import { Pio } from "@/components/student/pio";
import { SoundOptInDialog } from "@/components/student/sound-opt-in-dialog";
import { kidMessages } from "@/lib/kidCopy";
import { pickLine, pioSays } from "@/lib/pioCopy";
import {
  hasOptInBeenAsked,
  playBadge,
  preloadAll,
  setSoundEnabledLocal,
} from "@/lib/sounds";

/**
 * LA FIN D'UN PALIER — l'écran qui récompense, entre deux séances.
 *
 * Le jeu motive ENTRE les exercices (G3) : c'est ici que Pio parle, que les
 * étoiles se comptent, que le sentier de la thématique s'allume d'un cran et
 * que le prochain pas s'offre en un bouton. La séance, elle, reste sobre.
 *
 * Deux issues, une même scène. Palier validé : Pio fête, la récolte se
 * compte sous ses yeux, le palier suivant s'ouvre sur le sentier et les
 * confettis tombent. Palier manqué : Pio encourage, la jauge dit combien
 * d'étoiles manquent (un but, pas une note), et le bouton propose de refaire
 * les exercices ratés. Pas d'émoji dans les phrases : Pio est la mascotte,
 * il n'a pas besoin de cotillons dans le texte.
 *
 * Les récompenses différées vivent ici aussi, comme sur l'ancien écran de
 * victoire : la carte du trophée débloqué (D25), l'écran de niveau (D2b/D24)
 * séquencé après le trophée, et la question du son (D20) posée après la
 * fête. Toutes coupées quand le palier est manqué.
 */
export type PalierResultView = {
  status: "validated" | "failed";
  /** Trois étoiles par exercice, au plus. */
  starsTotal: number;
  /** Exercices joués dans ce palier : dix, sauf quand le modèle en a rendu moins. */
  exerciseCount: number;
  /** Moyenne nécessaire pour valider, en dixièmes (7 sur 10). */
  thresholdTenths: number;
  canRegen: boolean;
};

type UnseenBadge = {
  badgeId: Id<"badges">;
  badge: {
    name: string;
    description: string;
    icon: string;
    rarity: "common" | "rare" | "epic" | "legendary";
  };
};

/** Reflète `students.EXOS_PER_LEVEL` — même valeur que dans le carnet. */
const EXOS_PER_LEVEL = 50;
const STARS_PER_EXERCISE = 3;
const CONFETTI_COLORS = ["#f97316", "#fbbf24", "#6ab04c", "#38bdf8", "#ec4899"];

export function PalierResultScreen({
  result,
  topicName,
  palierIndex,
  palierCount,
  nextPalierHref,
  trailHref,
  regenerating,
  onRegen,
  capAlternatives,
}: {
  result: PalierResultView;
  topicName: string;
  palierIndex: number;
  palierCount: number;
  /** Séance du palier suivant, ou `null` quand la thématique est finie. */
  nextPalierHref: string | null;
  trailHref: string;
  regenerating: boolean;
  onRegen: () => void;
  /** Ce qu'on propose quand il n'y a plus de nouvelle chance. */
  capAlternatives: ReactNode;
}) {
  const validated = result.status === "validated";
  const exerciseCount = Math.max(1, Math.min(PALIER_SIZE, Math.round(result.exerciseCount)));
  const maxStars = exerciseCount * STARS_PER_EXERCISE;
  // 7 sur 10 en moyenne, ramené en étoiles sur les exercices joués : 21 sur 30.
  const threshold = Math.ceil((result.thresholdTenths / 10) * maxStars);
  const starsTotal = Math.max(0, Math.min(maxStars, result.starsTotal));
  const missing = Math.max(0, threshold - starsTotal);
  const topicDone = validated && nextPalierHref === null;

  // Les phrases se tirent une fois à l'arrivée : un titre qui changerait au
  // re-rendu déconcerterait l'enfant, et la pureté du rendu interdit le hasard.
  const [seed] = useState(() => Math.floor(Date.now() / 60_000));
  const bubble = validated ? pickLine(pioSays.palierWon, seed) : pioSays.palierLost;
  const sub = validated
    ? topicDone
      ? pioSays.topicDone(topicName)
      : pioSays.palierWonSub(palierIndex + 1)
    : pioSays.palierLostSub(missing);

  useVictoryConfetti(validated);
  const extras = useVictoryExtras(validated);
  useBareStatusBar();
  const { scrollY } = useScroll();
  const frostOpacity = useTransform(scrollY, [24, 160], [0, 1]);
  const sky = validated ? "#5db9f2" : "#f9a86b";
  const ground = validated ? "#f6c452" : "#ffe08a";

  return (
    <div className="mx-auto max-w-lg space-y-5 pb-4">
      {/* LA BARRE GIVRÉE QUI VIENT AU DÉFILEMENT. Au repos, rien : le ciel
          du héros monte sous la barre d'état. Dès qu'on fait défiler, la
          barre crème des autres écrans apparaît en fondu au-dessus de ce qui
          passe dessous, comme un en-tête iOS qui se replie. Hors du flux, dans
          la racine (pas dans le héros, dont l'entrée est animée). */}
      <motion.div
        aria-hidden
        style={{ opacity: frostOpacity }}
        className="fixed inset-x-0 top-0 z-40 h-[env(safe-area-inset-top)] bg-[#fff7e0]/90 backdrop-blur-md"
      />
      {/* LE CIEL MONTE JUSQU'À L'ENCOCHE. Le héros s'étend sous la barre
          d'état, d'un bord à l'autre, sans arrondi en haut : une seule
          surface, du bord de l'écran au sol. Le dégradé ne commence qu'après
          la zone de l'encoche, pour que la couleur y soit pleine. Sur le
          web, la zone vaut zéro. */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative -mx-4 -mt-[env(safe-area-inset-top)] overflow-hidden rounded-b-[2rem] px-5 pb-6 pt-[calc(env(safe-area-inset-top)+1.25rem)] text-center shadow-2xl"
        style={{
          backgroundImage: `linear-gradient(180deg, ${sky} 0%, ${sky} env(safe-area-inset-top), ${ground} 100%)`,
        }}
      >
        {/* Le soleil derrière Pio. */}
        <div
          aria-hidden
          className="absolute left-1/2 top-[calc(env(safe-area-inset-top)+5rem)] h-60 w-60 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,247,194,0.95)_0%,rgba(255,210,63,0.6)_40%,rgba(255,176,32,0)_70%)] animate-[sun-pulse_4s_ease-in-out_infinite]"
        />
        <div className="relative">
          <SpeechBubble bubbleKey={bubble}>{bubble}</SpeechBubble>
          <motion.div
            initial={{ opacity: 0, scale: 0.6, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 240, damping: 18, delay: 0.1 }}
            className="mt-4 flex justify-center"
          >
            <Pio
              state={validated ? "cheer" : "encourage"}
              size={200}
              priority
              className="drop-shadow-[0_16px_20px_rgba(60,30,0,0.45)]"
            />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.35 }}
            className="text-outline mt-2 font-display text-3xl font-extrabold text-white sm:text-4xl"
          >
            {validated ? `Palier ${palierIndex} validé` : `Palier ${palierIndex} manqué`}
          </motion.h1>
          <p className="text-outline mt-1 font-display text-lg font-bold text-white">{sub}</p>
        </div>
      </motion.section>

      {validated && <BigStars count={bigStars(starsTotal, threshold, maxStars)} />}

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.4 }}
        className="rounded-3xl border-2 border-amber-200 bg-white p-5 shadow-lg"
      >
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="font-display text-xs font-extrabold uppercase tracking-wider text-amber-900/60">
              Ta récolte d&apos;étoiles
            </p>
            <p className="mt-1 flex items-center gap-1.5 font-display text-amber-950">
              <Star className="h-9 w-9 fill-amber-400 text-amber-500" aria-hidden />
              <CountUp value={starsTotal} className="text-5xl font-extrabold leading-none" />
              <span className="self-end pb-0.5 text-2xl font-extrabold text-amber-900/50">/ {maxStars}</span>
            </p>
            <span className="sr-only">{pioSays.starsWon(starsTotal)}</span>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border-2 border-amber-200 bg-[#fff7e0] px-3 py-1.5 font-display text-xs font-extrabold text-amber-900">
            <Flag className="h-3.5 w-3.5" aria-hidden />
            {pioSays.validatedFrom(threshold)}
          </span>
        </div>

        <StarsMeter value={starsTotal} threshold={threshold} max={maxStars} validated={validated} />

        {validated && extras.stats && (
          <div className="mt-4 border-t-2 border-dashed border-amber-100 pt-3">
            <div className="mb-1 flex items-center justify-between font-display text-xs font-extrabold text-amber-900/80">
              <span className="inline-flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" aria-hidden />
                Niveau {extras.stats.level}
              </span>
              <span>
                {extras.stats.remaining > 0
                  ? `${extras.stats.remaining} avant le niveau ${extras.stats.level + 1}`
                  : `Niveau ${extras.stats.level + 1} tout proche`}
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-amber-100 shadow-inner" aria-hidden>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${extras.stats.levelPct}%` }}
                transition={{ delay: 1.3, duration: 0.8, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-lime-400 to-green-500"
              />
            </div>
          </div>
        )}
      </motion.section>

      <TopicTrail
        topicName={topicName}
        palierIndex={palierIndex}
        palierCount={palierCount}
        validated={validated}
      />

      {extras.badge && (
        <motion.section
          initial={{ opacity: 0, scale: 0.9, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.9, type: "spring", stiffness: 180 }}
          className="rounded-3xl border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-fuchsia-50 p-5 shadow-md"
        >
          <div className="flex items-center gap-4">
            <div className="shrink-0">
              <BadgeShield
                iconName={extras.badge.first.badge.icon}
                badgeName={extras.badge.first.badge.name}
                tier={extras.badge.first.badge.rarity}
                locked={false}
                size={80}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-sm font-extrabold uppercase tracking-wider text-purple-700">
                Nouveau trophée
              </p>
              <p className="truncate font-display text-lg font-extrabold text-purple-900">
                {extras.badge.first.badge.name}
              </p>
              <p className="text-xs text-purple-700">{extras.badge.first.badge.description}</p>
            </div>
          </div>
          {extras.badge.others > 0 && (
            <p className="mt-3 text-center font-display text-xs font-extrabold text-purple-700">
              + {extras.badge.others} autre{extras.badge.others > 1 ? "s" : ""} dans ta salle des trophées
            </p>
          )}
        </motion.section>
      )}

      {!validated && regenerating && <JotnaLoader message={kidMessages.regenLoading} />}
      {!validated && !result.canRegen && !regenerating && capAlternatives}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.35 }}
        className="space-y-3"
      >
        {validated && nextPalierHref && (
          <GameButton
            href={nextPalierHref}
            tone="orange"
            size="lg"
            icon={<Play className="h-5 w-5 fill-current" aria-hidden />}
            className="w-full"
          >
            Palier suivant
          </GameButton>
        )}
        {topicDone && (
          <GameButton
            href={trailHref}
            tone="green"
            size="lg"
            icon={<Trophy className="h-5 w-5" aria-hidden />}
            className="w-full"
          >
            Voir mon trésor
          </GameButton>
        )}
        {!validated && result.canRegen && !regenerating && (
          <>
            <p className="text-center font-display text-base font-bold text-amber-900">
              {pioSays.regenInvite}
            </p>
            <GameButton
              onClick={onRegen}
              tone="green"
              size="lg"
              icon={<RotateCcw className="h-5 w-5" aria-hidden />}
              className="w-full"
            >
              {pioSays.regenCta}
            </GameButton>
          </>
        )}
        {!topicDone && (
          <GameButton
            href={trailHref}
            tone="white"
            size="md"
            icon={<MapIcon className="h-5 w-5" aria-hidden />}
            className="w-full"
          >
            Retour au sentier
          </GameButton>
        )}
      </motion.div>

      {extras.dialogs}
    </div>
  );
}

/**
 * En mode focus, `(student)/layout` pose une barre crème sous la barre
 * d'état. Ici, elle coupait le ciel du héros d'un trait, et une barre de la
 * couleur du ciel coupait le sol dès qu'on faisait défiler. Le temps de cet
 * écran, elle devient transparente : le héros passe dessous.
 */
function useBareStatusBar() {
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--focus-top-bg", "transparent");
    root.style.setProperty("--focus-top-blur", "none");
    return () => {
      root.style.removeProperty("--focus-top-bg");
      root.style.removeProperty("--focus-top-blur");
    };
  }, []);
}

// ---------------------------------------------------------------------------
// Les morceaux
// ---------------------------------------------------------------------------

/** Trois si l'enfant frôle le sans-faute, deux dès la validation, sinon une. */
function bigStars(starsTotal: number, threshold: number, maxStars: number): number {
  if (starsTotal >= maxStars * 0.9) return 3;
  if (starsTotal >= threshold) return 2;
  return 1;
}

function BigStars({ count }: { count: number }) {
  return (
    <div className="flex justify-center gap-2" aria-label={pioSays.victoryStars(count)}>
      {[1, 2, 3].map((i) => (
        <motion.div
          key={i}
          initial={{ scale: 0, rotate: -40 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.35 + i * 0.18, type: "spring", stiffness: 220, damping: 12 }}
        >
          <Star
            className={`h-16 w-16 drop-shadow-md ${
              i <= count ? "fill-amber-400 text-amber-500" : "fill-white/70 text-amber-200"
            }`}
            aria-hidden
          />
        </motion.div>
      ))}
    </div>
  );
}

/** Le nombre monte sous les yeux de l'enfant, sans état React : une valeur animée. */
function CountUp({ value, className }: { value: number; className?: string }) {
  const raw = useMotionValue(0);
  const rounded = useTransform(raw, (v) => Math.round(v));
  useEffect(() => {
    const controls = animate(raw, value, { duration: 1, delay: 0.7, ease: "easeOut" });
    return () => controls.stop();
  }, [raw, value]);
  return <motion.span className={className}>{rounded}</motion.span>;
}

/** La jauge d'étoiles, avec le drapeau du seuil dessus. */
function StarsMeter({
  value,
  threshold,
  max,
  validated,
}: {
  value: number;
  threshold: number;
  max: number;
  validated: boolean;
}) {
  const pct = (value / max) * 100;
  const thresholdPct = (threshold / max) * 100;
  return (
    <div className="relative mt-5 mb-1" aria-hidden>
      <div className="h-5 overflow-hidden rounded-full bg-amber-100 shadow-inner">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ delay: 0.7, duration: 1, ease: "easeOut" }}
          className={`h-full rounded-full ${
            validated
              ? "bg-gradient-to-r from-amber-300 via-amber-400 to-orange-500"
              : "bg-gradient-to-r from-orange-300 to-rose-400"
          }`}
        />
      </div>
      <div
        className="absolute -top-2 flex -translate-x-1/2 flex-col items-center"
        style={{ left: `${thresholdPct}%` }}
      >
        <span className="h-9 w-1.5 rounded-full bg-amber-950 shadow-sm" />
      </div>
    </div>
  );
}

/** Le sentier de la thématique : ce qui est franchi, ce qui vient de s'ouvrir. */
function TopicTrail({
  topicName,
  palierIndex,
  palierCount,
  validated,
}: {
  topicName: string;
  palierIndex: number;
  palierCount: number;
  validated: boolean;
}) {
  const count = Math.max(palierCount, palierIndex);
  const done = validated ? palierIndex : palierIndex - 1;
  const compact = count > 7;
  const dot = compact ? "h-7 w-7 text-xs" : "h-9 w-9 text-sm";
  const nextIndex = validated && palierIndex < count ? palierIndex + 1 : null;
  const footer = validated
    ? nextIndex !== null
      ? `${pioSays.nextStep} : Palier ${nextIndex} · ${pioSays.stage[difficultyStage(nextIndex, count)]}`
      : pioSays.trailTreasure
    : pioSays.lockedNext;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.75, duration: 0.4 }}
      className="rounded-3xl border-2 border-amber-200 bg-[#fff7e0] p-4 shadow-md"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="truncate font-display text-base font-extrabold text-amber-950">{topicName}</p>
        <p className="shrink-0 font-display text-xs font-extrabold text-amber-900/70">
          {done}/{count} paliers
        </p>
      </div>
      <div className="mt-3 flex items-center" role="list" aria-label="Paliers de la thématique">
        {Array.from({ length: count }, (_, i) => i + 1).map((n) => {
          const state: DotState =
            n <= done
              ? validated && n === palierIndex
                ? "just"
                : "done"
              : n === palierIndex
                ? "current"
                : n === nextIndex
                  ? "next"
                  : "locked";
          return (
            <Fragment key={n}>
              {n > 1 && (
                <span
                  aria-hidden
                  className={`h-1.5 min-w-1.5 flex-1 rounded-full ${
                    n <= done ? "bg-green-500" : "bg-amber-900/15"
                  }`}
                />
              )}
              <TrailDot n={n} state={state} sizeClass={dot} />
            </Fragment>
          );
        })}
        <span
          aria-hidden
          className={`h-1.5 min-w-1.5 flex-1 rounded-full ${done >= count ? "bg-green-500" : "bg-amber-900/15"}`}
        />
        <span
          aria-label={pioSays.trailTreasure}
          className={`flex shrink-0 items-center justify-center rounded-full border-2 ${dot} ${
            done >= count
              ? "border-amber-300 bg-gradient-to-b from-amber-200 to-amber-400 text-amber-900 shadow-[0_0_0_4px_rgba(251,191,36,0.35)]"
              : "border-amber-200 bg-white text-amber-300"
          }`}
        >
          <Trophy className="h-4 w-4" aria-hidden />
        </span>
      </div>
      <p className="mt-3 font-display text-sm font-bold text-amber-900">{footer}</p>
    </motion.section>
  );
}

type DotState = "done" | "just" | "current" | "next" | "locked";

function TrailDot({ n, state, sizeClass }: { n: number; state: DotState; sizeClass: string }) {
  const base = `flex shrink-0 items-center justify-center rounded-full border-2 font-display font-extrabold ${sizeClass}`;
  const label =
    state === "done" || state === "just"
      ? `Palier ${n}, validé`
      : state === "locked"
        ? `Palier ${n}, fermé`
        : `Palier ${n}, ouvert`;
  if (state === "just") {
    return (
      <motion.span
        role="listitem"
        aria-label={label}
        initial={{ scale: 0.4 }}
        animate={{ scale: [0.4, 1.25, 1] }}
        transition={{ delay: 1.1, duration: 0.5, ease: "easeOut" }}
        className={`${base} border-amber-300 bg-gradient-to-b from-amber-300 to-orange-500 text-white shadow-[0_0_0_4px_rgba(251,191,36,0.4)]`}
      >
        <Star className="h-4 w-4 fill-current" aria-hidden />
      </motion.span>
    );
  }
  if (state === "done") {
    return (
      <span role="listitem" aria-label={label} className={`${base} border-green-500 bg-green-500 text-white`}>
        <Check className="h-4 w-4" strokeWidth={3} aria-hidden />
      </span>
    );
  }
  if (state === "next" || state === "current") {
    return (
      <motion.span
        role="listitem"
        aria-label={label}
        animate={{ scale: [1, 1.12, 1] }}
        transition={{ delay: 1.6, duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        className={`${base} border-orange-400 bg-white text-orange-600 shadow-[0_0_0_4px_rgba(251,146,60,0.3)]`}
      >
        {n}
      </motion.span>
    );
  }
  return (
    <span role="listitem" aria-label={label} className={`${base} border-amber-200 bg-amber-100 text-amber-400`}>
      <Lock className="h-3.5 w-3.5" aria-hidden />
    </span>
  );
}

// ---------------------------------------------------------------------------
// Les effets : confettis, trophées, niveau, son
// ---------------------------------------------------------------------------

/** Trois salves, coupées sous `prefers-reduced-motion` (D12). */
function useVictoryConfetti(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    import("canvas-confetti").then((mod) => {
      if (cancelled) return;
      const fire = (opts: object) =>
        mod.default({ ...opts, colors: CONFETTI_COLORS, zIndex: 60 });
      fire({ particleCount: 80, spread: 70, angle: 60, origin: { x: 0, y: 0.55 } });
      fire({ particleCount: 80, spread: 70, angle: 120, origin: { x: 1, y: 0.55 } });
      timers.push(
        setTimeout(() => fire({ particleCount: 70, spread: 120, origin: { x: 0.5, y: 0.35 } }), 500),
      );
    });
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [enabled]);
}

/**
 * Ce que l'ancien écran de victoire séquençait : le trophée débloqué, puis
 * l'écran de niveau, puis la question du son. Instantanés pris à l'arrivée
 * (D25, D2b) : marquer « vu » côté serveur ne fait pas disparaître la carte.
 */
function useVictoryExtras(enabled: boolean) {
  const myStats = useQuery(api.students.getMyStats, enabled ? {} : "skip");
  const markBadgesSeen = useMutation(api.badges.markBadgesSeen);
  const markLevelSeen = useMutation(api.students.markLevelSeen);
  const [badges, setBadges] = useState<UnseenBadge[] | null>(null);
  const [levelUp, setLevelUp] = useState<number | null>(null);
  const [levelUpOpen, setLevelUpOpen] = useState(false);
  const [optInOpen, setOptInOpen] = useState(false);

  useEffect(() => {
    if (myStats?.soundEnabled !== undefined) setSoundEnabledLocal(myStats.soundEnabled === true);
    if (myStats?.soundEnabled === true) void preloadAll();
  }, [myStats?.soundEnabled]);

  // LES INSTANTANÉS ET LEURS MINUTEURS SONT DEUX EFFETS. Dans un seul, le
  // `setState` de l'instantané relançait l'effet, dont le nettoyage annulait
  // le minuteur qu'il venait d'armer : la fenêtre de niveau ne s'ouvrait
  // jamais, et le son du trophée ne partait pas. L'ancien écran de victoire
  // avait le même défaut.
  useEffect(() => {
    if (!myStats || badges !== null || myStats.unseenBadges.length === 0) return;
    const unseen = myStats.unseenBadges as UnseenBadge[];
    // eslint-disable-next-line react-hooks/set-state-in-effect -- instantané pris une fois à l'arrivée (D25)
    setBadges(unseen);
    void markBadgesSeen({ badgeIds: unseen.map((b) => b.badgeId) });
  }, [myStats, badges, markBadgesSeen]);

  useEffect(() => {
    if (!badges || badges.length === 0) return;
    const timer = setTimeout(() => void playBadge(), 800);
    return () => clearTimeout(timer);
  }, [badges]);

  useEffect(() => {
    if (!myStats || levelUp !== null || !myStats.unseenLevelUp) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- instantané pris une fois à l'arrivée (D2b)
    setLevelUp(myStats.unseenLevelUp.level);
  }, [myStats, levelUp]);

  // Le trophée d'abord, le niveau ensuite : les deux joies ne se superposent pas.
  const hasBadgeCard = badges !== null && badges.length > 0;
  useEffect(() => {
    if (levelUp === null) return;
    const timer = setTimeout(() => setLevelUpOpen(true), hasBadgeCard ? 2200 : 1400);
    return () => clearTimeout(timer);
  }, [levelUp, hasBadgeCard]);

  const dismissLevelUp = useCallback(() => {
    setLevelUpOpen(false);
    if (levelUp !== null) void markLevelSeen({ level: levelUp });
  }, [levelUp, markLevelSeen]);

  useEffect(() => {
    if (!myStats || myStats.soundOptInDecided) return;
    if (hasOptInBeenAsked(myStats.student._id as string)) return;
    const timer = setTimeout(() => setOptInOpen(true), 1600);
    return () => clearTimeout(timer);
  }, [myStats]);

  const level = myStats?.level ?? 1;
  const remaining = myStats?.exosToNextLevel ?? EXOS_PER_LEVEL;
  const gained = Math.max(0, Math.min(EXOS_PER_LEVEL, EXOS_PER_LEVEL - remaining));

  return {
    stats: myStats
      ? { level, remaining, levelPct: Math.round((gained / EXOS_PER_LEVEL) * 100) }
      : null,
    badge: badges && badges.length > 0 ? { first: badges[0], others: badges.length - 1 } : null,
    dialogs: myStats ? (
      <>
        <SoundOptInDialog
          userId={myStats.student._id as string}
          open={optInOpen}
          onOpenChange={setOptInOpen}
        />
        {levelUp !== null && (
          <LevelUpOverlay level={levelUp} open={levelUpOpen} onDismiss={dismissLevelUp} />
        )}
      </>
    ) : null,
  };
}
