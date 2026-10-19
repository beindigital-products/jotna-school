"use client";

import { Fragment, useCallback, useEffect, useState, type ReactNode } from "react";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { Check, Flag, ListChecks, Lock, Map as MapIcon, Play, RotateCcw, Sparkles, Star, Trophy } from "lucide-react";
import { useDailyQuests, useStudentActions, useStudentStats } from "@/hooks/use-student-data";
import { difficultyStage } from "@/convex/palierRules";
import { PALIER_SIZE } from "@/convex/paliers/scoring";
import { EXOS_PER_LEVEL, STARS_PER_EXERCISE, palierStarRating } from "@/convex/progressionRules";
import { JotnaLoader } from "@/components/jotna-loader";
import { BadgeShield } from "@/components/student/badge-icon";
import { ActionButton3D, useGameFeel } from "@/components/student/game-kit";
import { Coffre3D } from "@/components/student/game-kit/coque-coffre-3d";
import { FrostBar, useBareStatusBar } from "@/components/student/game/session-stage";
import { SpeechBubble } from "@/components/student/game/speech-bubble";
import { LevelUpOverlay } from "@/components/student/level-up-overlay";
import { Pio } from "@/components/student/pio";
import { SoundOptInDialog } from "@/components/student/sound-opt-in-dialog";
import { kidMessages } from "@/lib/kidCopy";
import { pickLine, pioSays } from "@/lib/pioCopy";
import { hasOptInBeenAsked, playBadge, preloadAll, setSoundEnabledLocal } from "@/lib/sounds";

// La fête « missions du jour faites » ne se joue qu'une fois par jour et par
// appareil : cette clé mémorise le dernier jour déjà fêté (commodité d'écran).
const QUESTS_CELEBRATED_KEY = "jotna:questsCelebratedDay";

/**
 * LA FIN D'UN PALIER — l'écran qui récompense, entre deux séances.
 *
 * Le jeu motive ENTRE les exercices (G3) : c'est ici que Pio parle, que les
 * étoiles se comptent, que le sentier de la thématique s'allume d'un cran et
 * que le prochain pas s'offre en un bouton. La séance, elle, reste sobre.
 *
 * Deux issues, une même scène. Palier validé : Pio fête, le COFFRE AU TRÉSOR
 * s'ouvre à ses pieds (`Coffre3D`, du bois et de l'or en CSS 3D), la lumière
 * en sort, l'éclat jaillit, les trois grandes étoiles tombent une à une, la
 * récolte se compte sous ses yeux, le palier suivant s'ouvre sur le sentier et
 * les confettis tombent (plafonnés par le niveau de l'appareil). Palier
 * manqué : Pio encourage, le coffre reste cadenassé devant lui, la jauge dit
 * combien d'étoiles manquent (un but, pas une note), et le bouton propose de
 * refaire les exercices ratés. Pas d'émoji dans les phrases : Pio est la
 * mascotte, il n'a pas besoin de cotillons dans le texte.
 *
 * CE QUI BOUGE : des `transform` et de l'`opacity`. Les jauges avancent en
 * `translateX` (une barre pleine largeur qui glisse dans sa rainure), plus en
 * `width` ; Pio a une ombre au sol peinte, pas un `drop-shadow` sur son clip.
 * Le décor du héros (ciel, soleil) est une couche rognée à part : le coffre,
 * en 3D, n'est jamais dans un parent `overflow: hidden` (Safari l'aplatirait).
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
  badgeId: string;
  badge: {
    name: string;
    description: string;
    icon: string;
    rarity: "common" | "rare" | "epic" | "legendary";
  };
};

const CONFETTI_COLORS = ["#f97316", "#fbbf24", "#6ab04c", "#38bdf8", "#ec4899"];

/**
 * Les comptes de l'écran, purs : le plafond d'étoiles sur les exercices
 * vraiment joués, le seuil ramené en étoiles (7 sur 10 → 21 sur 30), la
 * récolte bornée, ce qui manque.
 */
export function palierStars(result: Pick<PalierResultView, "starsTotal" | "exerciseCount" | "thresholdTenths">) {
  const exerciseCount = Math.max(1, Math.min(PALIER_SIZE, Math.round(result.exerciseCount)));
  const maxStars = exerciseCount * STARS_PER_EXERCISE;
  const threshold = Math.ceil((result.thresholdTenths / 10) * maxStars);
  const starsTotal = Math.max(0, Math.min(maxStars, result.starsTotal));
  return { exerciseCount, maxStars, threshold, starsTotal, missing: Math.max(0, threshold - starsTotal) };
}

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
  const { exerciseCount, maxStars, threshold, starsTotal, missing } = palierStars(result);
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
  // L'écran de fin remplace la scène de la séance là où elle était : si
  // l'enfant avait fait défiler la dernière question, Pio et sa bulle
  // arriveraient sous la barre d'état (vu sur le simulateur iPhone 17). D'un
  // coup : `scroll-behavior: smooth` de la page serait annulé par le
  // remplacement du contenu sur le WKWebView.
  useEffect(() => {
    if (window.scrollY > 0) window.scrollTo({ top: 0, behavior: "instant" });
  }, []);
  const sky = validated ? "#5db9f2" : "#f9a86b";
  const ground = validated ? "#f6c452" : "#ffe08a";

  return (
    <div className="mx-auto max-w-lg space-y-5 pb-4" data-palier-result={result.status}>
      <FrostBar />
      {/* LE CIEL MONTE JUSQU'À L'ENCOCHE. Le héros s'étend sous la barre
          d'état, d'un bord à l'autre, sans arrondi en haut : une seule
          surface, du bord de l'écran au sol. Le décor (dégradé, soleil) est
          une couche rognée derrière ; le contenu, et le coffre en 3D, sont
          devant, hors de tout `overflow: hidden`. */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative -mx-4 -mt-[env(safe-area-inset-top)] px-5 pb-5 pt-[calc(env(safe-area-inset-top)+1.25rem)] text-center"
      >
        <div
          aria-hidden
          className="savanna-motion absolute inset-0 overflow-hidden rounded-b-[2rem] shadow-2xl"
          style={{
            backgroundImage: `linear-gradient(180deg, ${sky} 0%, ${sky} env(safe-area-inset-top), ${ground} 100%)`,
          }}
        >
          {/* Le soleil derrière Pio. */}
          <div className="absolute left-1/2 top-[calc(env(safe-area-inset-top)+5rem)] h-60 w-60 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,247,194,0.95)_0%,rgba(255,210,63,0.6)_40%,rgba(255,176,32,0)_70%)] animate-[sun-pulse_4s_ease-in-out_infinite]" />
          {/* Le sable au pied de la scène, où Pio et le coffre sont posés. */}
          <div className="absolute inset-x-0 bottom-0 h-14 bg-[linear-gradient(180deg,rgba(233,168,58,0)_0%,rgba(233,168,58,0.45)_100%)]" />
        </div>

        <div className="relative">
          <SpeechBubble bubbleKey={bubble}>{bubble}</SpeechBubble>

          {/* Pio et le coffre, côte à côte sur le sable. */}
          <div className="mt-4 flex items-end justify-center gap-1 sm:gap-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.6, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 240, damping: 18, delay: 0.1 }}
              className="relative"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute bottom-0 left-1/2 h-5 w-32 -translate-x-1/2 rounded-[100%] bg-[radial-gradient(ellipse,rgba(60,30,0,0.4)_0%,rgba(60,30,0,0)_70%)]"
              />
              <Pio state={validated ? "cheer" : "encourage"} size={190} priority />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.7, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 220, damping: 18, delay: 0.3 }}
            >
              <Coffre3D open={validated} size={132} />
            </motion.div>
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.35 }}
            className="text-outline mt-1 font-display text-3xl font-extrabold text-white sm:text-4xl"
          >
            {validated ? `Palier ${palierIndex} validé` : `Palier ${palierIndex} manqué`}
          </motion.h1>
          <p className="text-outline mt-1 font-display text-lg font-bold text-white">{sub}</p>
        </div>
      </motion.section>

      {/* La même note que l'étape du sentier (`progressionRules.palierStarRating`). */}
      {validated && <BigStars count={palierStarRating(starsTotal, exerciseCount)} />}

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.4 }}
        className="rounded-3xl border-2 border-white bg-[#fff8e6] p-5 shadow-[0_6px_0_#d6c39a,0_18px_30px_-16px_rgba(60,30,0,0.5)]"
      >
        {/* Sur un écran étroit (344 px), le badge ne tient pas à côté du compte : il passe dessous au lieu de dépasser de la carte. */}
        <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-2">
          <div>
            <p className="font-display text-xs font-extrabold uppercase tracking-wider text-amber-900/60">
              Ta récolte d&apos;étoiles
            </p>
            <p className="mt-1 flex items-center gap-1.5 font-display text-amber-950">
              <Star className="h-9 w-9 fill-amber-400 text-amber-500" aria-hidden />
              <CountUp value={starsTotal} className="text-5xl font-extrabold leading-none" />
              <span className="self-end whitespace-nowrap pb-0.5 text-2xl font-extrabold text-amber-900/50">/ {maxStars}</span>
            </p>
            <span className="sr-only">{pioSays.starsWon(starsTotal)}</span>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border-2 border-white bg-[#fff7e0] px-3 py-1.5 font-display text-xs font-extrabold text-amber-900 shadow-[0_2px_0_#d6c39a]">
            <Flag className="h-3.5 w-3.5" aria-hidden />
            {pioSays.validatedFrom(threshold)}
          </span>
        </div>

        <StarsMeter value={starsTotal} threshold={threshold} max={maxStars} validated={validated} />

        {validated && extras.stats && (
          <div className="mt-4 border-t-2 border-dashed border-amber-200 pt-3">
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
            <Gauge pct={extras.stats.levelPct} className="h-3" delay={1.3} fill="bg-gradient-to-r from-lime-400 to-green-500" />
          </div>
        )}
      </motion.section>

      <TopicTrail topicName={topicName} palierIndex={palierIndex} palierCount={palierCount} validated={validated} />

      {extras.badge && (
        <motion.section
          initial={{ opacity: 0, scale: 0.9, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.9, type: "spring", stiffness: 180 }}
          className="rounded-3xl border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-fuchsia-50 p-5 shadow-[0_6px_0_#d8b4fe,0_18px_30px_-16px_rgba(60,30,0,0.4)]"
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
              <p className="font-display text-sm font-extrabold uppercase tracking-wider text-purple-700">Nouveau trophée</p>
              <p className="truncate font-display text-lg font-extrabold text-purple-900">{extras.badge.first.badge.name}</p>
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

      {validated && <QuestsDoneCard />}

      {!validated && regenerating && <JotnaLoader message={kidMessages.regenLoading} />}
      {!validated && !result.canRegen && !regenerating && capAlternatives}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.35 }}
        className="space-y-4"
      >
        {validated && nextPalierHref && (
          <ActionButton3D href={nextPalierHref} tone="orange" size="lg" shine icon={<Play className="h-6 w-6 fill-current" aria-hidden />}>
            Palier suivant
          </ActionButton3D>
        )}
        {topicDone && (
          <ActionButton3D href={trailHref} tone="green" size="lg" shine icon={<Trophy className="h-6 w-6" aria-hidden />}>
            Voir mon trésor
          </ActionButton3D>
        )}
        {!validated && result.canRegen && !regenerating && (
          <>
            <p className="text-center font-display text-base font-bold text-amber-900">{pioSays.regenInvite}</p>
            <ActionButton3D onClick={onRegen} tone="green" size="lg" shine icon={<RotateCcw className="h-6 w-6" aria-hidden />}>
              {pioSays.regenCta}
            </ActionButton3D>
          </>
        )}
        {!topicDone && (
          <ActionButton3D href={trailHref} tone="white" size="md" icon={<MapIcon className="h-5 w-5" aria-hidden />}>
            Retour au sentier
          </ActionButton3D>
        )}
      </motion.div>

      {extras.dialogs}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Les morceaux
// ---------------------------------------------------------------------------

/** Les trois grandes étoiles : chacune tombe en tournant, de la moitié de sa taille (jamais de zéro). */
function BigStars({ count }: { count: number }) {
  return (
    <div className="flex justify-center gap-2" aria-label={pioSays.victoryStars(count)} data-big-stars={count}>
      {[1, 2, 3].map((i) => (
        <motion.div
          key={i}
          initial={{ scale: 0.5, rotate: -40, opacity: 0, y: -16 }}
          animate={{ scale: 1, rotate: 0, opacity: 1, y: 0 }}
          transition={{ delay: 0.35 + i * 0.18, type: "spring", stiffness: 220, damping: 12 }}
        >
          <Star
            className={`h-16 w-16 drop-shadow-md ${i <= count ? "fill-amber-400 text-amber-500" : "fill-white/70 text-amber-200"}`}
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

/**
 * Une jauge qui se remplit en `translateX` : la barre fait toute la largeur
 * et glisse dans sa rainure rognée, son bout arrondi reste rond. Jamais de
 * `width` animée.
 */
function Gauge({
  pct,
  className = "",
  delay = 0.7,
  duration = 1,
  fill,
}: {
  pct: number;
  className?: string;
  delay?: number;
  duration?: number;
  fill: string;
}) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className={`overflow-hidden rounded-full bg-amber-100 shadow-inner ${className}`} aria-hidden>
      <motion.div
        data-gauge={clamped}
        initial={{ x: "-100%" }}
        animate={{ x: `${clamped - 100}%` }}
        transition={{ delay, duration, ease: "easeOut" }}
        className={`h-full w-full rounded-full ${fill}`}
      />
    </div>
  );
}

/** La jauge d'étoiles, avec le drapeau du seuil dessus. */
function StarsMeter({ value, threshold, max, validated }: { value: number; threshold: number; max: number; validated: boolean }) {
  const pct = (value / max) * 100;
  const thresholdPct = (threshold / max) * 100;
  return (
    <div className="relative mb-1 mt-5" aria-hidden>
      <Gauge
        pct={pct}
        className="h-5"
        fill={validated ? "bg-gradient-to-r from-amber-300 via-amber-400 to-orange-500" : "bg-gradient-to-r from-amber-300 to-orange-400"}
      />
      <div className="absolute -top-2 flex -translate-x-1/2 flex-col items-center" style={{ left: `${thresholdPct}%` }}>
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
      className="rounded-3xl border-2 border-white bg-[#fff7e0] p-4 shadow-[0_6px_0_#d6c39a,0_18px_30px_-16px_rgba(60,30,0,0.5)]"
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
                  className={`h-1.5 min-w-1.5 flex-1 rounded-full ${n <= done ? "bg-green-500" : "bg-amber-900/15"}`}
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
        initial={{ scale: 0.5 }}
        animate={{ scale: [0.5, 1.25, 1] }}
        transition={{ delay: 1.1, duration: 0.5, ease: "easeOut" }}
        className={`${base} border-amber-300 bg-gradient-to-b from-amber-300 to-orange-500 text-white shadow-[0_2px_0_#b45309,0_0_0_4px_rgba(251,191,36,0.4)]`}
      >
        <Star className="h-4 w-4 fill-current" aria-hidden />
      </motion.span>
    );
  }
  if (state === "done") {
    return (
      <span role="listitem" aria-label={label} className={`${base} border-white bg-gradient-to-b from-lime-400 to-green-600 text-white shadow-[0_2px_0_#166534]`}>
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
        className={`${base} border-orange-400 bg-white text-orange-600 shadow-[0_2px_0_#d6c39a,0_0_0_4px_rgba(251,146,60,0.3)]`}
      >
        {n}
      </motion.span>
    );
  }
  return (
    <span role="listitem" aria-label={label} className={`${base} border-amber-200 bg-amber-100 text-amber-400 shadow-[0_2px_0_#d6c39a]`}>
      <Lock className="h-3.5 w-3.5" aria-hidden />
    </span>
  );
}

// ---------------------------------------------------------------------------
// Les effets : confettis, trophées, niveau, son
// ---------------------------------------------------------------------------

/**
 * Deux salves, une de chaque côté, chacune au plafond du niveau (50 riche,
 * 16 sobre, 0 sous `prefers-reduced-motion`, D12) : la fête d'un palier vaut
 * deux bonnes réponses, pas 230 particules.
 */
function useVictoryConfetti(enabled: boolean) {
  const feel = useGameFeel();
  const particles = feel.budget.particles;
  useEffect(() => {
    if (!enabled || particles <= 0) return;
    let cancelled = false;
    import("canvas-confetti").then((mod) => {
      if (cancelled) return;
      const fire = (opts: object) => mod.default({ ...opts, particleCount: particles, colors: CONFETTI_COLORS, zIndex: 60 });
      fire({ spread: 70, angle: 60, origin: { x: 0, y: 0.55 } });
      fire({ spread: 70, angle: 120, origin: { x: 1, y: 0.55 } });
    });
    return () => {
      cancelled = true;
    };
  }, [enabled, particles]);
}

/**
 * MISSIONS DU JOUR RÉUSSIES — la carte qui félicite l'enfant en fin de palier
 * quand ses trois missions du jour sont toutes faites. Une fois par jour : une
 * garde `localStorage` par clé de jour évite de rejouer la fête à chaque palier
 * suivant. `getMyDaily` reflète déjà l'état d'APRÈS ce palier (les missions
 * s'accrochent dans `submitPalier`), donc la fête tombe pile au bon moment.
 */
function QuestsDoneCard() {
  const daily = useDailyQuests();
  // Le jour déjà fêté, capturé une seule fois au montage (avant toute écriture).
  const [celebratedAtMount] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      return localStorage.getItem(QUESTS_CELEBRATED_KEY);
    } catch {
      return null;
    }
  });

  const allDone = !!daily && !daily.pending && daily.allDone;
  const show = allDone && celebratedAtMount !== daily?.dayKey;

  // Mémoriser « fêté aujourd'hui » : un effet d'écriture pur, sans setState.
  useEffect(() => {
    if (!show || !daily) return;
    try {
      localStorage.setItem(QUESTS_CELEBRATED_KEY, daily.dayKey);
    } catch {
      // Stockage bloqué : tant pis, la fête pourra se rejouer une fois.
    }
  }, [show, daily]);

  if (!show || !daily) return null;

  return (
    <motion.section
      initial={{ opacity: 0, scale: 0.9, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: 0.7, type: "spring", stiffness: 180 }}
      className="rounded-3xl border-2 border-lime-300 bg-gradient-to-br from-lime-50 to-emerald-50 p-5 shadow-[0_6px_0_#86efac,0_18px_30px_-16px_rgba(60,30,0,0.4)]"
    >
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-lime-400 to-green-600 text-white shadow-[0_3px_0_#166534]">
          <ListChecks className="h-8 w-8" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display text-sm font-extrabold uppercase tracking-wider text-green-700">Missions du jour</p>
          <p className="font-display text-lg font-extrabold text-green-900">Toutes réussies&nbsp;! Bravo&nbsp;!</p>
          {daily.bonusStars > 0 && (
            <p className="text-xs font-bold text-green-700">
              + {daily.bonusStars} étoile{daily.bonusStars > 1 ? "s" : ""} bonus aujourd&apos;hui
            </p>
          )}
        </div>
      </div>
    </motion.section>
  );
}

/**
 * Ce que l'ancien écran de victoire séquençait : le trophée débloqué, puis
 * l'écran de niveau, puis la question du son. Instantanés pris à l'arrivée
 * (D25, D2b) : marquer « vu » côté serveur ne fait pas disparaître la carte.
 */
function useVictoryExtras(enabled: boolean) {
  // Le carnet se calcule sur l'appareil : le trophée mérité et le niveau
  // gagné sans réseau se fêtent ici, tout de suite. « Vu » s'écrit au journal.
  const stats = useStudentStats();
  const myStats = enabled ? stats : undefined;
  const { markBadgesSeen, markLevelSeen } = useStudentActions();
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
    markBadgesSeen(unseen.map((b) => b.badgeId));
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
    if (levelUp !== null) markLevelSeen(levelUp);
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
    stats: myStats ? { level, remaining, levelPct: Math.round((gained / EXOS_PER_LEVEL) * 100) } : null,
    badge: badges && badges.length > 0 ? { first: badges[0], others: badges.length - 1 } : null,
    dialogs: myStats ? (
      <>
        <SoundOptInDialog userId={myStats.student._id as string} open={optInOpen} onOpenChange={setOptInOpen} />
        {levelUp !== null && <LevelUpOverlay level={levelUp} open={levelUpOpen} onDismiss={dismissLevelUp} />}
      </>
    ) : null,
  };
}
