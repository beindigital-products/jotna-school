"use client";

/**
 * LE CHEMIN DU CORAN — la carte du module, vue par l'enfant.
 *
 * Un jeu : trente étapes qui montent du village de l'enfant, au Sénégal,
 * jusqu'à la Kaaba, à La Mecque, en passant par le Sahara et l'Arabie au
 * crépuscule. Pio, dans son boubou du module, se tient sur l'étape du jour et
 * y marche quand l'enfant touche une autre étape ; la carte de l'étape se lève
 * alors en bas, avec LE bouton qui ouvre la leçon. Même mécanique que les
 * sentiers des matières (`components/student/world/game-map.tsx`), avec son
 * propre décor (`components/arabic/quran-journey.tsx`).
 *
 * Six niveaux, trente leçons, et une seule leçon ouverte à la fois
 * (`isLessonUnlocked`). Ce n'est pas une contrainte technique : on n'assemble
 * pas des lettres qu'on ne sait pas nommer, et laisser un enfant de six ans
 * choisir Al-Fātiḥa en premier écran, c'est le faire échouer.
 *
 * DEUX CHOSES PEUVENT OUVRIR PLUS LARGE, et aucune ne valide quoi que ce soit :
 * le PLACEMENT décidé par l'école (`path.placement.floorOrder`), qui ouvre le
 * parcours là où l'enfant en est déjà, et la RÉVISION d'une sourate mémorisée,
 * qui revient d'elle-même quand son échéance tombe. Une leçon ouverte par un
 * placement reste non faite et sans étoiles : cocher une case ne remplit pas
 * un cahier.
 *
 * LE CONTENU NE VIENT PAS DU SERVEUR. Les niveaux et les leçons sont du code
 * (`convex/arabic/curriculum.ts`), donc déjà dans le paquet de cette page ;
 * la requête ne rapporte que la PROGRESSION — ce que l'enfant a terminé et
 * avec combien d'étoiles.
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, BookOpenCheck, Lock, Play, Repeat, RotateCcw, Star, Volume2 } from "lucide-react";
import type { ConsigneKey } from "@/convex/arabic/consignes";
import { speech, useSpeech } from "@/components/arabic/speech";
import { api } from "@/convex/_generated/api";
import {
  ARABIC_LESSONS,
  TOTAL_LESSONS,
  getLevel,
  type ArabicLesson,
} from "@/convex/arabic/curriculum";
import { isLessonUnlocked, nextLessonKey } from "@/convex/arabic/progressRules";
import { hifzLessonKey } from "@/convex/arabic/hifz";
import { arabicCopy } from "@/lib/arabic/copy";
import { useDeviceTier } from "@/hooks/use-device-tier";
import { QuranLoader } from "@/components/arabic/quran-loader";
import { Pio, type PioState } from "@/components/student/pio";
import { GameButton } from "@/components/student/game/game-button";
import { GameMap, type MapNodeContext } from "@/components/student/world/game-map";
import { TrailNode, type TrailNodeStatus } from "@/components/student/world/trail";
import { QURAN_TRAIL } from "@/components/student/world/trail-geometry";
import {
  KAABA_INDEX,
  KAABA_POINT,
  KaabaNode,
  LevelRibbon,
  QURAN_POINTS,
  QuranBackdrop,
  StartMark,
  lessonGlyph,
} from "@/components/arabic/quran-journey";

const SHAKE_MS = 480;

type HifzState = {
  surahKey: string;
  nameFr: string;
  versesMemorized: number;
  ayahCount: number;
  dueAt: number | null;
  due: boolean;
  started: boolean;
};

/** La clé de session qui retient que Pio a déjà dit bonjour sur le chemin. */
const WELCOME_KEY = "jotna.coran.welcome";

export default function ArabePathPage() {
  const path = useQuery(api.arabic.lessons.getPath);
  const hifz = useQuery(api.arabic.memorization.getState);
  const tier = useDeviceTier();
  const { say } = useSpeech();

  // Pio dit bonjour UNE fois par session : à chaque retour sur la carte, ce
  // serait une rengaine. Le bouton 🔊 de la fiche le redit à volonté.
  const ready = path?.enabled === true;
  useEffect(() => {
    if (!ready) return;
    try {
      if (window.sessionStorage.getItem(WELCOME_KEY)) return;
      window.sessionStorage.setItem(WELCOME_KEY, "1");
    } catch {
      // Stockage refusé : on dit bonjour quand même, une fois de plus ne gêne pas.
    }
    void say([speech.consigne("map_welcome")]);
  }, [ready, say]);

  const [selected, setSelected] = useState<number | null>(null);
  const [shaking, setShaking] = useState<number | null>(null);
  const [showReviews, setShowReviews] = useState(false);

  const completed = useMemo(
    () =>
      new Set(
        (path?.progress ?? [])
          .filter((row) => row.status === "completed")
          .map((row) => row.lessonKey),
      ),
    [path],
  );

  const starsByLesson = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of path?.progress ?? []) map.set(row.lessonKey, row.stars);
    return map;
  }, [path]);

  const hifzBySurah = useMemo(() => {
    const surahs = (hifz?.surahs ?? []) as HifzState[];
    return new Map(surahs.map((surah) => [surah.surahKey, surah]));
  }, [hifz]);

  if (path === undefined) return <QuranLoader />;

  if (!path.enabled) {
    return (
      <div className="mx-4 max-w-md rounded-3xl border-2 border-amber-200 bg-white p-8 text-center shadow-sm sm:mx-auto">
        <Pio state="idle" outfit="boubou" size={120} className="mx-auto" />
        <h1 className="font-display mt-4 text-xl font-extrabold text-gray-900">
          {arabicCopy.notEnabled.title}
        </h1>
        <p className="mt-2 text-base text-gray-600">{arabicCopy.notEnabled.body}</p>
        <Link
          href="/student/home"
          className="mt-5 inline-block rounded-2xl bg-orange-500 px-5 py-2.5 text-base font-bold text-white"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    );
  }

  const floor = path.placement.floorOrder;
  const nextKey = nextLessonKey(completed, floor);
  const doneCount = completed.size;
  const allDone = doneCount >= TOTAL_LESSONS;
  const totalStars = [...starsByLesson.values()].reduce((sum, n) => sum + n, 0);
  const due = ((hifz?.surahs ?? []) as HifzState[]).filter((surah) => surah.due);

  const statusOf = (lesson: ArabicLesson): TrailNodeStatus => {
    if (completed.has(lesson.key)) return "completed";
    if (!allDone && lesson.key === nextKey) return "in_progress";
    return isLessonUnlocked(lesson.key, completed, floor) ? "available" : "locked";
  };

  const nextIndex = ARABIC_LESSONS.findIndex((lesson) => lesson.key === nextKey);
  const currentIndex = allDone ? KAABA_INDEX : Math.max(0, nextIndex);
  // Sans rien toucher, la carte montre l'étape du jour ; dès qu'il touche,
  // c'est l'enfant qui choisit. Dérivé, pas posé dans un effet.
  const shown = selected ?? currentIndex;

  function poseAt(index: number): PioState {
    if (index === KAABA_INDEX) return allDone ? "bravo" : "salam";
    const lesson = ARABIC_LESSONS[index];
    if (!lesson || !completed.has(lesson.key)) return "salam";
    // Le Coran n'est pas un jeu : sur une sourate faite, Pio salue, il
    // n'applaudit pas (`lib/arabic/copy.ts`).
    return lesson.kind === "coran" || lesson.kind === "hifz" ? "salam" : "bravo";
  }

  function shake(index: number) {
    setSelected(index);
    setShaking(index);
    window.setTimeout(() => setShaking(null), SHAKE_MS);
  }

  function renderNode(ctx: MapNodeContext) {
    if (ctx.index === KAABA_INDEX) {
      return (
        <KaabaNode
          key="kaaba"
          reached={allDone}
          remaining={TOTAL_LESSONS - doneCount}
          selected={shown === KAABA_INDEX}
          onSelect={() => {
            if (allDone) ctx.walkTo();
            else setSelected(KAABA_INDEX);
          }}
        />
      );
    }

    const lesson = ARABIC_LESSONS[ctx.index];
    const level = getLevel(lesson.levelKey);
    const status = statusOf(lesson);
    const firstOfLevel = ARABIC_LESSONS.findIndex((l) => l.levelKey === lesson.levelKey) === ctx.index;

    return (
      <div key={lesson.key}>
        {firstOfLevel && level && <LevelRibbon level={level} x={ctx.x} y={ctx.y} />}
        {ctx.index === 0 && <StartMark y={ctx.y} />}
        <TrailNode
          x={ctx.x}
          y={ctx.y}
          index={ctx.index}
          status={status}
          stars={starsByLesson.get(lesson.key) ?? 0}
          label={lesson.title}
          glyph={lessonGlyph(lesson)}
          selected={shown === ctx.index}
          shaking={shaking === ctx.index}
          onSelect={() => {
            if (status === "locked") {
              shake(ctx.index);
              return;
            }
            ctx.walkTo();
          }}
        />
      </div>
    );
  }

  const controlDepth = { "--btn-depth": "#c9a35a" } as React.CSSProperties;

  return (
    <GameMap
      layout={QURAN_TRAIL}
      count={QURAN_POINTS}
      initialPioIndex={currentIndex}
      currentIndex={currentIndex}
      onArrive={(index) => setSelected(index)}
      poseAt={poseAt}
      renderNode={renderNode}
      pioSize={96}
      outfit="boubou"
      endPoint={KAABA_POINT}
      backdrop={<QuranBackdrop tier={tier} />}
      frameImage="/images/coran/zone-sahara.jpg"
      className="h-[calc(100dvh-16rem)] min-h-[460px] sm:mt-1 sm:h-[calc(100dvh-11rem)] sm:max-h-[880px] sm:rounded-[2rem] sm:shadow-2xl"
      hud={
        <>
          {/* ── L'en-tête du chemin, collé au cadre ────────────────────── */}
          <div className="pointer-events-none absolute left-3 top-3 z-20 flex max-w-[calc(100%-5rem)] flex-col items-start gap-2">
            <div className="flex max-w-full items-center gap-2">
              <Link
                href="/student/home"
                aria-label="Retour au camp"
                className="btn-chunky pointer-events-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-[3px] border-white bg-gradient-to-b from-amber-50 to-amber-200 text-amber-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-300"
                style={controlDepth}
              >
                <ArrowLeft className="h-6 w-6" strokeWidth={3} aria-hidden />
              </Link>
              <div className="pointer-events-auto flex min-w-0 items-center gap-2.5 rounded-full border-[3px] border-white bg-gradient-to-br from-emerald-600 to-emerald-800 py-1 pl-1.5 pr-4 text-white shadow-lg">
                {/* eslint-disable-next-line @next/next/no-img-element -- vignette du module */}
                <img
                  src="/images/coran/medallion.jpg"
                  alt=""
                  className="h-9 w-9 shrink-0 rounded-full border-2 border-amber-200 object-cover"
                />
                <div className="min-w-0">
                  <h1 className="text-outline truncate font-display text-lg font-extrabold leading-tight">
                    {arabicCopy.moduleTitle}
                  </h1>
                  <p className="font-display text-xs font-bold opacity-95">
                    {doneCount}/{TOTAL_LESSONS} leçons
                    {totalStars > 0 && (
                      <>
                        {" · "}
                        <Star className="-mt-0.5 inline h-3.5 w-3.5 fill-yellow-300 text-yellow-300" aria-hidden />{" "}
                        {totalStars}
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="pointer-events-auto flex flex-wrap items-center gap-2 pl-[3.25rem]">
              <Link
                href="/student/arabe/alphabet"
                className="btn-chunky inline-flex h-9 items-center gap-1.5 rounded-full border-[3px] border-white bg-gradient-to-b from-teal-400 to-teal-600 px-3 font-display text-sm font-extrabold text-white"
                style={{ "--btn-depth": "#115e59" } as React.CSSProperties}
              >
                <span dir="rtl" lang="ar" className="font-arabic text-base leading-none" aria-hidden>
                  أ ب
                </span>
                Mon album
              </Link>
              {due.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowReviews((v) => !v)}
                  aria-expanded={showReviews}
                  className="btn-chunky inline-flex h-9 items-center gap-1.5 rounded-full border-[3px] border-white bg-gradient-to-b from-amber-400 to-amber-600 px-3 font-display text-sm font-extrabold text-white"
                  style={{ "--btn-depth": "#92400e" } as React.CSSProperties}
                >
                  <Repeat className="h-4 w-4" aria-hidden />
                  À réviser · {due.length}
                </button>
              )}
            </div>

            <AnimatePresence>
              {showReviews && due.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="pointer-events-auto ml-[3.25rem] max-w-[260px] rounded-2xl border-[3px] border-amber-300 bg-amber-50/95 p-3 shadow-xl"
                >
                  <p className="font-display text-sm font-extrabold text-amber-900">
                    {arabicCopy.memorize.due}
                  </p>
                  <ul className="mt-2 flex flex-col gap-1.5">
                    {due.map((surah) => (
                      <li key={surah.surahKey}>
                        <Link
                          href={`/student/arabe/lecon?key=${hifzLessonKey(surah.surahKey)}`}
                          className="flex min-h-10 items-center justify-between gap-2 rounded-xl bg-amber-600 px-3 py-2 font-display text-sm font-bold text-white"
                        >
                          {surah.nameFr}
                          <Play className="h-4 w-4 fill-current" aria-hidden />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── La carte de l'étape où Pio se tient ───────────────────── */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 p-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={shown}
                className="pointer-events-auto mx-auto max-w-lg"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 40 }}
                transition={{ duration: 0.22 }}
                onPointerDown={(e) => e.stopPropagation()}
              >
                {shown === KAABA_INDEX ? (
                  <KaabaCard reached={allDone} remaining={TOTAL_LESSONS - doneCount} />
                ) : (
                  <LessonCard
                    lesson={ARABIC_LESSONS[shown]}
                    status={statusOf(ARABIC_LESSONS[shown])}
                    stars={starsByLesson.get(ARABIC_LESSONS[shown].key) ?? 0}
                    firstEver={doneCount === 0}
                    hifz={
                      ARABIC_LESSONS[shown].surahKey
                        ? hifzBySurah.get(ARABIC_LESSONS[shown].surahKey ?? "")
                        : undefined
                    }
                    now={hifz?.now ?? 0}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </>
      }
    />
  );
}

function LessonCard({
  lesson,
  status,
  stars,
  firstEver,
  hifz,
  now,
}: {
  lesson: ArabicLesson;
  status: TrailNodeStatus;
  stars: number;
  firstEver: boolean;
  hifz: HifzState | undefined;
  now: number;
}) {
  const level = getLevel(lesson.levelKey);
  const color = level?.color ?? "#15803d";
  const isLocked = status === "locked";
  const isDone = status === "completed";
  const isCurrent = status === "in_progress";
  const glyph = lessonGlyph(lesson);
  const href = `/student/arabe/lecon?key=${lesson.key}`;

  return (
    <div
      className="rounded-3xl border-[3px] bg-white/95 p-4 shadow-xl backdrop-blur"
      style={{ borderColor: isLocked ? "#e5e7eb" : color }}
    >
      <div className="flex items-start gap-3">
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white"
          style={{ backgroundColor: isLocked ? "#9ca3af" : color }}
        >
          {isLocked ? (
            <Lock className="h-5 w-5" aria-hidden />
          ) : glyph ? (
            <span dir="rtl" lang="ar" className="font-arabic -mt-1 text-3xl leading-none" aria-hidden>
              {glyph}
            </span>
          ) : (
            <span className="text-2xl" aria-hidden>
              {level?.emoji}
            </span>
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p
            className="truncate font-display text-xs font-extrabold uppercase tracking-wide"
            style={{ color: isLocked ? "#6b7280" : color }}
          >
            Niveau {level?.order} · {level?.title}
          </p>
          <h2 className="font-display text-lg font-extrabold leading-tight text-amber-950">
            {lesson.title}
          </h2>
          <p className="mt-0.5 line-clamp-2 text-sm text-amber-900/80">{lesson.goalFr}</p>

          <div className="mt-2 flex flex-wrap items-center gap-2 font-display text-xs font-bold">
            {isDone && lesson.kind !== "hifz" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-green-800">
                Faite
                {stars > 0 && (
                  <>
                    {" · "}
                    <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" aria-hidden /> {stars}
                  </>
                )}
              </span>
            )}
            {isCurrent && (
              <span className="rounded-full bg-orange-100 px-2.5 py-1 text-orange-800">
                L&apos;étape du jour
              </span>
            )}
            {isLocked && (
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-600">
                {arabicCopy.lockedLesson}
              </span>
            )}
            {lesson.kind === "hifz" && hifz?.started && (
              <HifzNote state={hifz} now={now} />
            )}
          </div>
        </div>
        <SayButton consigne={isLocked ? "map_locked" : "map_welcome"} />
      </div>

      {!isLocked && (
        <div className="mt-3">
          <GameButton
            href={href}
            tone={isDone ? "white" : "green"}
            size="lg"
            className="w-full"
            icon={
              isDone ? (
                <RotateCcw className="h-5 w-5" aria-hidden />
              ) : (
                <Play className="h-5 w-5 fill-current" aria-hidden />
              )
            }
            ariaLabel={isDone ? `Refaire ${lesson.title}` : `Commencer ${lesson.title}`}
          >
            {isDone ? "Refaire la leçon" : isCurrent && !firstEver ? "Continuer" : "C'est parti !"}
          </GameButton>
        </div>
      )}
    </div>
  );
}

/** Le bouton 🔊 d'une fiche : un enfant qui ne lit pas encore l'entend. */
function SayButton({ consigne }: { consigne: ConsigneKey }) {
  const { say, speaking } = useSpeech();
  return (
    <button
      type="button"
      onClick={() => void say([speech.consigne(consigne)])}
      aria-label="Écouter la consigne"
      className={`btn-chunky flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-[3px] border-white bg-gradient-to-b from-emerald-400 to-emerald-600 text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300 ${
        speaking ? "animate-pulse" : ""
      }`}
      style={{ "--btn-depth": "#065f46" } as React.CSSProperties}
    >
      <Volume2 className="h-5 w-5" strokeWidth={2.75} aria-hidden />
    </button>
  );
}

/**
 * La carte de la Kaaba. Sobre, comme tout ce qui touche au Coran dans ce
 * module : on dit où l'enfant en est, on ne distribue pas de trophée.
 */
function KaabaCard({ reached, remaining }: { reached: boolean; remaining: number }) {
  return (
    <div className="rounded-3xl border-[3px] border-amber-300 bg-gradient-to-br from-indigo-950 via-violet-900 to-indigo-900 p-4 text-white shadow-xl">
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element -- vignette de la Kaaba */}
        <img
          src="/images/coran/medallion.jpg"
          alt=""
          className="h-16 w-16 shrink-0 rounded-2xl border-2 border-amber-300 object-cover"
        />
        <div className="min-w-0">
          <p className="font-display text-xs font-extrabold uppercase tracking-wide text-amber-300">
            Au bout du chemin
          </p>
          <h2 className="font-display text-lg font-extrabold leading-tight">
            {reached ? "Tu as fait tout le chemin jusqu'à la Kaaba" : "La Kaaba t'attend"}
          </h2>
          <p className="mt-0.5 text-sm text-white/85">
            {reached
              ? "Lettre après lettre, tu sais lire tes premières sourates. Continue de les réviser."
              : `Encore ${remaining} leçon${remaining > 1 ? "s" : ""}, lettre après lettre. Pio marche avec toi.`}
          </p>
        </div>
        <SayButton consigne={reached ? "map_kaaba_reached" : "map_kaaba"} />
      </div>
      {reached && (
        <div className="mt-3">
          <GameButton
            href="/student/arabe/alphabet"
            tone="white"
            size="lg"
            className="w-full"
            icon={<BookOpenCheck className="h-5 w-5" aria-hidden />}
          >
            Revoir l&apos;alphabet
          </GameButton>
        </div>
      )}
    </div>
  );
}

/**
 * L'état d'une sourate en mémorisation.
 *
 * PAS D'ÉTOILES ICI, ET C'EST VOULU. Les étoiles disent « c'est fait » ; une
 * sourate mémorisée n'est jamais finie, elle est seulement à jour. Ce que
 * l'enfant a besoin de lire est combien de versets tiennent et quand la
 * sourate revient — deux faits, pas une récompense.
 */
function HifzNote({ state, now }: { state: HifzState; now: number }) {
  const days = state.dueAt === null ? 0 : Math.ceil((state.dueAt - now) / 86_400_000);
  return (
    <>
      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-800">
        {arabicCopy.memorize.versesHeld(state.versesMemorized, state.ayahCount)}
      </span>
      <span
        className={
          state.due
            ? "rounded-full bg-amber-100 px-2.5 py-1 text-amber-800"
            : "rounded-full bg-gray-100 px-2.5 py-1 text-gray-500"
        }
      >
        {arabicCopy.memorize.reviewOn(days)}
      </span>
    </>
  );
}
