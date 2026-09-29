"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import { api } from "@/convex/_generated/api";
import { getModule } from "@/convex/moduleCatalog";
import Link from "next/link";
import { Play, Map as MapIcon, Flame, Compass } from "lucide-react";
import { Pio, type PioState } from "@/components/student/pio";
import { SavannaBackdrop } from "@/components/student/world/savanna-backdrop";
import { BiomeMedallion } from "@/components/student/world/biome-medallion";
import { GameButton } from "@/components/student/game/game-button";
import { SpeechBubble } from "@/components/student/game/speech-bubble";
import { QuestBoard } from "@/components/student/game/quest-board";
import { pioSays, pickLine } from "@/lib/pioCopy";
import { getSoundEnabledLocal, playCorrect } from "@/lib/sounds";

/**
 * LE CAMP DE PIO — l'accueil de l'élève, et l'écran du « wow ».
 *
 * Trois plans, de l'arrière vers l'avant : la savane peinte, Pio grandeur
 * nature qui parle et réagit au doigt, un seul gros bouton qui reprend
 * l'aventure là où elle s'est arrêtée. Dessous, les mondes — les matières —
 * en médaillons de biomes avec leur anneau de progression.
 *
 * PIO RÉAGIT AU TOUCHER. Chaque tape change sa pose et sa réplique, joue le
 * petit son de réussite si l'enfant a accepté les sons, et vibre brièvement
 * sur les appareils qui savent. Cinq tapes en deux secondes : la réaction
 * secrète. C'est inutile, et c'est exactement pour cela qu'un enfant y
 * revient.
 *
 * LA RÉPLIQUE DU JOUR EST STABLE : tirée avec le numéro du jour comme graine,
 * elle ne change pas à chaque rendu. Une tape la remplace deux secondes et
 * demie, puis elle revient.
 *
 * COLD START SANS ZÉROS (D8) : ni compteur, ni série, ni progression à zéro.
 * Pio souhaite la bienvenue et le bouton dit « Commencer l'aventure ».
 */
const TAP_WINDOW_MS = 2000;
const SECRET_TAPS = 5;
const TAP_POSES: PioState[] = ["hello", "cheer", "amazed", "encourage"];

export default function StudentHomePage() {
  const stats = useQuery(api.students.getMyStats);
  const zones = useQuery(api.students.getMyWorldMap);
  const next = useQuery(api.students.getMyNextStep);

  const loading = stats === undefined || zones === undefined || next === undefined;

  const firstName = (stats?.student.name ?? "").split(" ")[0] || "";
  const isColdStart =
    !!stats &&
    (stats.totalExercises ?? 0) === 0 &&
    (stats.totalStars ?? 0) === 0 &&
    (!stats.streaksEnabled || (stats.currentStreak ?? 0) === 0);
  const streakAlive =
    stats?.streaksEnabled === true && (stats.currentStreak ?? 0) > 0;

  // --- Ce que dit Pio, et comment il se tient -------------------------------
  // Tirée UNE fois au montage : la règle de pureté du compilateur React
  // interdit `Date.now()` pendant le rendu, et une réplique qui changerait à
  // chaque re-rendu déconcerterait l'enfant.
  const [dayKey] = useState(() => Math.floor(Date.now() / 86_400_000));
  const baseLine = (() => {
    if (!stats) return "";
    if (isColdStart) return pioSays.coldStart(firstName);
    if (next && next.kind === "continue") return pioSays.continueTopic(next.topicName);
    if (streakAlive) return pioSays.streakAlive(stats.currentStreak);
    if (next && next.kind === "explore") return pickLine(pioSays.allDone, dayKey);
    return pickLine(pioSays.comeBack, dayKey);
  })();
  const basePose: PioState = isColdStart ? "hello" : streakAlive ? "cheer" : "idle";

  const [tapLine, setTapLine] = useState<string | null>(null);
  const [tapPose, setTapPose] = useState<PioState | null>(null);
  const tapTimes = useRef<number[]>([]);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    },
    [],
  );

  function tapPio() {
    const now = Date.now();
    tapTimes.current = [...tapTimes.current.filter((t) => now - t < TAP_WINDOW_MS), now];
    const secret = tapTimes.current.length >= SECRET_TAPS;
    if (secret) tapTimes.current = [];

    setTapPose(secret ? "cheer" : TAP_POSES[Math.floor(Math.random() * TAP_POSES.length)]);
    setTapLine(secret ? pioSays.secret : pickLine(pioSays.tapReactions));

    if (getSoundEnabledLocal()) void playCorrect();
    try {
      navigator.vibrate?.(secret ? [20, 40, 20] : 12);
    } catch {
      // Pas de vibreur : tant pis, Pio bouge quand même.
    }

    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => {
      setTapLine(null);
      setTapPose(null);
    }, 2500);
  }

  const line = tapLine ?? baseLine;
  const pose = tapPose ?? basePose;

  // --- Le bouton principal ----------------------------------------------------
  const cta = (() => {
    if (!next || next.kind === "empty") {
      return { href: "/student/map", label: "Explorer la carte", icon: <MapIcon className="h-6 w-6" aria-hidden /> };
    }
    if (next.kind === "explore") {
      return { href: "/student/map", label: "Admirer la carte", icon: <Compass className="h-6 w-6" aria-hidden /> };
    }
    const href = `/student/topics/session?id=${next.topicId}&palier=${next.palierIndex}`;
    return {
      href,
      label: next.kind === "continue" ? "Continuer l'aventure" : isColdStart ? "Commencer l'aventure" : "Reprendre l'aventure",
      icon: <Play className="h-6 w-6 fill-current" aria-hidden />,
    };
  })();

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* ── Le camp ─────────────────────────────────────────────────────── */}
      <SavannaBackdrop variant="hub" minHeightClass="min-h-[560px] sm:min-h-[600px]">
        <div className="flex min-h-[560px] flex-col items-center justify-end px-4 pb-8 pt-6 sm:min-h-[600px] sm:pb-10">
          {/* La bulle, puis Pio, puis le bouton : l'ordre du regard. */}
          {loading ? (
            <SpeechBubble bubbleKey="loading">Je prépare le camp...</SpeechBubble>
          ) : (
            <SpeechBubble bubbleKey={line}>{line}</SpeechBubble>
          )}

          {/* Pio au centre, les modules de l'école de part et d'autre. */}
          <div className="relative mt-6 w-full">
            <div className="flex justify-center">
              <button
                type="button"
                onClick={tapPio}
                aria-label="Toucher Pio"
                className="rounded-full outline-none focus-visible:ring-4 focus-visible:ring-white/80"
              >
                <Pio
                  state={loading ? "think" : pose}
                  size={272}
                  priority
                  className="drop-shadow-[0_18px_22px_rgba(60,30,0,0.45)]"
                />
              </button>
            </div>
            <SideModules />
          </div>

          <div className="mt-6 flex w-full max-w-sm flex-col items-center gap-3">
            <GameButton
              href={loading ? undefined : cta.href}
              disabled={loading}
              tone="orange"
              size="lg"
              icon={cta.icon}
              className="w-full"
            >
              {loading ? "Un instant..." : cta.label}
            </GameButton>

            {!loading && next && (next.kind === "continue" || next.kind === "start") && (
              <p className="text-outline font-display text-sm font-bold text-white/95">
                {next.subjectName} · {next.topicName}
              </p>
            )}

            <Link
              href="/student/map"
              className="text-outline mt-1 inline-flex items-center gap-1.5 font-display text-base font-extrabold text-white underline-offset-4 hover:underline"
            >
              <MapIcon className="h-4 w-4" aria-hidden />
              Voir la carte du monde
            </Link>
          </div>
        </div>
      </SavannaBackdrop>

      {/* ── Les missions du jour ────────────────────────────────────────── */}
      <section className="px-4 sm:px-0">
        <QuestBoard />
      </section>

      {/* ── La série, si elle vit ───────────────────────────────────────── */}
      {streakAlive && stats && (
        <section className="px-4 sm:px-0">
          <StreakRibbon currentStreak={stats.currentStreak} longestStreak={stats.longestStreak} />
        </section>
      )}

      {/* ── Mes mondes ──────────────────────────────────────────────────── */}
      <section className="px-4 sm:px-0">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-display text-2xl font-extrabold text-amber-950 sm:text-3xl">
            Mes mondes
          </h2>
          <Link
            href="/student/map"
            className="font-display text-sm font-bold text-orange-700 underline-offset-4 hover:underline"
          >
            Toute la carte
          </Link>
        </div>

        {zones === undefined ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-40 animate-pulse rounded-3xl bg-white/50" />
            ))}
          </div>
        ) : !zones || zones.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-amber-300 bg-white/60 p-10 text-center">
            <p className="font-display text-lg font-bold text-amber-900">
              Aucun monde ouvert pour le moment.
            </p>
            <p className="mt-1 text-sm text-amber-800/80">
              Ton école prépare la carte. Reviens bientôt.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-2 gap-y-6 sm:grid-cols-3 sm:gap-6">
            {zones.map((zone, i) => {
              const pct =
                zone.totalPaliers > 0
                  ? Math.round((zone.completedPaliers / zone.totalPaliers) * 100)
                  : 0;
              return (
                <Link
                  key={zone._id}
                  href={`/student/subjects?id=${zone._id}`}
                  className="group flex flex-col items-center rounded-3xl p-2 transition-transform hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-300 active:scale-[0.98]"
                  aria-label={`${zone.name} : ${zone.completedPaliers} étape${zone.completedPaliers > 1 ? "s" : ""} sur ${zone.totalPaliers}`}
                >
                  <BiomeMedallion
                    index={i}
                    color={zone.color}
                    icon={zone.icon}
                    label={zone.name}
                    progressPct={pct}
                    size={116}
                  />
                  <p className="mt-0.5 text-xs font-bold text-amber-900/70">
                    {zone.completedPaliers === 0 && zone.startedTopics === 0
                      ? "À découvrir"
                      : `${zone.completedPaliers}/${zone.totalPaliers} étapes`}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

/**
 * LES MODULES OPTIONNELS DE L'ÉCOLE, DE PART ET D'AUTRE DE PIO — aujourd'hui
 * « Arabe & Coran ».
 *
 * UNE IMAGE RONDE ET UN TITRE, RIEN D'AUTRE. Le propriétaire l'a voulu ainsi :
 * pas de phrase d'explication sur l'accueil, l'illustration dit ce qu'est le
 * module. Le premier se pose à droite de Pio, le suivant à gauche, et ainsi de
 * suite ; chaque côté empile les siens. Le deuxième module n'aura rien à
 * inventer.
 *
 * NE REND RIEN quand l'école n'en a allumé aucun : ni titre, ni place vide.
 * Un enfant dont l'école n'a pas pris l'arabe ne doit pas voir où il aurait
 * été — c'est la règle du catalogue (`convex/moduleCatalog.ts`), tenue
 * jusqu'à l'écran.
 *
 * SA PROPRE REQUÊTE, plutôt qu'une donnée descendue de l'accueil : l'accueil
 * n'a pas à attendre cette réponse pour dessiner Pio. Les médaillons sont posés
 * en absolu : leur arrivée ne décale rien.
 *
 * IL N'Y A PAS D'ONGLET pour ce module (voir l'en-tête de
 * `app/(student)/layout.app.tsx`) : ce médaillon est la porte d'entrée.
 */
function SideModules() {
  const modules = useQuery(api.modules.getMine);
  const open = (modules ?? []).filter((module_) => module_.enabled);
  if (open.length === 0) return null;

  const right = open.filter((_, i) => i % 2 === 0);
  const left = open.filter((_, i) => i % 2 === 1);

  return (
    <>
      {left.length > 0 && (
        <div className="absolute left-0 top-[38%] flex -translate-y-1/2 flex-col gap-4">
          {left.map((module_, i) => (
            <ModuleMedallion key={module_.key} module_={module_} delay={0.35 + i * 0.12} />
          ))}
        </div>
      )}
      {right.length > 0 && (
        <div className="absolute right-0 top-[38%] flex -translate-y-1/2 flex-col gap-4">
          {right.map((module_, i) => (
            <ModuleMedallion key={module_.key} module_={module_} delay={0.25 + i * 0.12} />
          ))}
        </div>
      )}
    </>
  );
}

function ModuleMedallion({
  module_,
  delay,
}: {
  module_: { key: string; title: string; href: string; color: string };
  delay: number;
}) {
  const image = getModule(module_.key)?.medallion;
  return (
    <motion.div
      initial={{ scale: 0.4, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay, type: "spring", stiffness: 260, damping: 15 }}
    >
      <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: delay + 0.6 }}
      >
        <Link
          href={module_.href}
          aria-label={`Ouvrir le module ${module_.title}`}
          className="group flex w-[78px] flex-col items-center gap-1.5 rounded-3xl outline-none focus-visible:ring-4 focus-visible:ring-white/80 sm:w-[100px]"
        >
          <span className="relative block h-[70px] w-[70px] sm:h-[88px] sm:w-[88px]">
            {/* Le halo doré qui respire : « ici, il y a quelque chose ». */}
            <motion.span
              aria-hidden
              className="absolute -inset-3 rounded-full bg-[radial-gradient(circle,rgba(253,224,71,0.8)_0%,rgba(253,224,71,0.35)_45%,rgba(253,224,71,0)_70%)]"
              animate={{ opacity: [0.55, 1, 0.55], scale: [0.94, 1.06, 0.94] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
            />
            <span
              className="btn-chunky relative block h-full w-full overflow-hidden rounded-full border-[4px] border-white bg-white shadow-lg transition-transform group-active:scale-95"
              style={{ "--btn-depth": module_.color } as React.CSSProperties}
            >
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element -- petite vignette ; `next/image` n'apporte rien sous export statique
                <img src={image} alt="" draggable={false} className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-3xl" style={{ backgroundColor: module_.color }}>
                  ✨
                </span>
              )}
            </span>
          </span>
          <span className="text-outline text-center font-display text-[13px] font-extrabold leading-tight text-white sm:text-sm">
            {module_.title}
          </span>
        </Link>
      </motion.div>
    </motion.div>
  );
}

/**
 * D7 — la série de la semaine, lundi à dimanche. Trois états par jour :
 * actif (dans la série), aujourd'hui (surligné, activité ou pas), vide.
 * D7c — jamais « perdu » : une série rompue s'efface, elle n'accuse pas.
 */
function StreakRibbon({
  currentStreak,
  longestStreak,
}: {
  currentStreak: number;
  longestStreak: number;
}) {
  const today = new Date();
  const todayDow = (today.getDay() + 6) % 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - todayDow);
  monday.setHours(0, 0, 0, 0);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const streakStart = new Date(today);
  streakStart.setDate(today.getDate() - (currentStreak - 1));
  streakStart.setHours(0, 0, 0, 0);
  const todayDay = new Date(today);
  todayDay.setHours(0, 0, 0, 0);

  const labels = ["L", "M", "M", "J", "V", "S", "D"];

  return (
    <div className="rounded-3xl border-2 border-orange-200 bg-white/90 p-4 shadow-sm backdrop-blur">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="h-6 w-6 fill-orange-500 text-orange-500" aria-hidden />
          <span className="font-display text-lg font-extrabold text-amber-950">
            {currentStreak} jour{currentStreak > 1 ? "s" : ""} de série
          </span>
        </div>
        {longestStreak > currentStreak && (
          <span className="text-xs font-bold text-amber-800/70">record : {longestStreak}</span>
        )}
      </div>
      <div className="flex items-center justify-between gap-1.5 sm:gap-2">
        {days.map((d, i) => {
          const isToday = d.getTime() === todayDay.getTime();
          const isActive = d.getTime() >= streakStart.getTime() && d.getTime() <= todayDay.getTime();
          return (
            <div
              key={i}
              className="flex flex-1 flex-col items-center gap-1.5"
              aria-label={isActive ? `${labels[i]} actif` : isToday ? `${labels[i]} aujourd'hui` : `${labels[i]} en pause`}
            >
              <span className={`font-display text-xs font-extrabold ${isToday ? "text-orange-700" : "text-amber-900/50"}`}>
                {labels[i]}
              </span>
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full border-2 sm:h-10 sm:w-10 ${
                  isActive
                    ? "border-orange-300 bg-gradient-to-b from-amber-200 to-orange-300"
                    : isToday
                      ? "border-orange-400 bg-white"
                      : "border-amber-100 bg-amber-50"
                }`}
              >
                {isActive ? (
                  <Flame className="h-4 w-4 fill-orange-600 text-orange-600" aria-hidden />
                ) : (
                  <span className={`text-base font-bold ${isToday ? "text-orange-400" : "text-amber-200"}`}>·</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
