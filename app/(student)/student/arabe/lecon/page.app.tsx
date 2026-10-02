"use client";

/**
 * LA SÉANCE — une leçon, pour un enfant qui ne sait pas encore lire.
 *
 * TOUT SE FAIT À L'OREILLE ET AU DOIGT (décision du 28 septembre 2026).
 * Chaque étape a sa consigne DITE par Pio (`components/arabic/coach.tsx`),
 * redite par le bouton 🔊 ; les jeux se jouent en touchant de gros objets
 * (`components/arabic/drills.tsx`) ; aucune étape ne demande de lire du
 * français. La progression se voit : Pio avance sur la barre du haut, et le
 * gros bouton ➜ rebondit quand on peut continuer.
 *
 * CETTE PAGE NE DÉCIDE DE RIEN. La suite des étapes vient de `buildSession`
 * (`lib/arabic/session.ts`), les règles d'étoiles du serveur, le contenu du
 * curriculum. Elle déroule, elle affiche, elle enregistre.
 *
 * QUI ENREGISTRE QUOI, ET POURQUOI C'EST SÉPARÉ :
 *   - les jeux notés SUR L'APPAREIL (ballons, images, points, tracé) passent
 *     par `recordAttempt`, qui marque la tentative « device » ; la note est
 *     celle du PREMIER geste, même si l'enfant finit toujours par réussir ;
 *   - la PRONONCIATION est enregistrée par l'action qui a entendu l'enfant
 *     (`arabic.voice.verifyPronunciation`), côté serveur, et cette page n'y
 *     touche pas. Enregistrer ici en plus compterait chaque répétition deux
 *     fois.
 *
 * LA LEÇON EST DANS LA QUERY (`?key=…`), PAS DANS UN SEGMENT `[key]` : le
 * bundle est exporté en statique pour Capacitor (`output: "export"`).
 *
 * ON NE BLOQUE JAMAIS UN ENFANT. Le petit bouton « passer » est toujours là :
 * micro refusé, lettre qui ne vient pas ce jour-là. Passer coûte au plus une
 * étoile ; rester coincé ferait quitter le module.
 */

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Map as MapIcon, SkipForward, Star, X } from "lucide-react";
import { useArabicPath, useHifzState, useStudentActions } from "@/hooks/use-student-data";
import { useOffline } from "@/components/offline/context";
import { getLetter, type ArabicLetterKey } from "@/convex/arabic/alphabet";
import { ARABIC_LESSONS, getLesson, type DrillKind } from "@/convex/arabic/curriculum";
import { bravo, CONSIGNES } from "@/convex/arabic/consignes";
import { LETTER_WORDS } from "@/convex/arabic/letterWords";
import { isLessonUnlocked } from "@/convex/arabic/progressRules";
import { buildSession, seedFromKey, type SessionStep } from "@/lib/arabic/session";
import { arabicCopy } from "@/lib/arabic/copy";
import { getSoundEnabledLocal, play } from "@/lib/sounds";
import { ArabicGlyph } from "@/components/arabic/arabic-glyph";
import { MaskedText } from "@/components/arabic/masked-text";
import { ListenButton } from "@/components/arabic/listen-button";
import { RecordButton } from "@/components/arabic/record-button";
import { TracingCanvas } from "@/components/arabic/tracing-canvas";
import { BalloonPick, DotsGame, MatchPictures, MeetLetter } from "@/components/arabic/drills";
import { CoachLine } from "@/components/arabic/coach";
import { PronounceCoach } from "@/components/arabic/pronounce-coach";
import { speech, useSpeech } from "@/components/arabic/speech";
import { QuranLoader } from "@/components/arabic/quran-loader";
import { Pio } from "@/components/student/pio";
import { GameButton } from "@/components/student/game/game-button";

type RecordAttempt = (
  drill: DrillKind,
  itemKey: string,
  correct: boolean,
  score?: number,
  verdict?: "ok" | "close" | "retry",
) => void;

function ArabicLessonPageInner() {
  const searchParams = useSearchParams();
  const lessonKey = searchParams.get("key") ?? "";
  const lesson = getLesson(lessonKey);

  // LE PARCOURS SE LIT SUR L'APPAREIL (`hooks/use-student-data.ts`), et les
  // tentatives comme la fin de la leçon s'écrivent à son journal : la leçon
  // se joue sans réseau, et part au serveur au retour du réseau.
  const path = useArabicPath();
  // LA SÉANCE DE MÉMORISATION REPREND OÙ L'ENFANT S'EST ARRÊTÉ : c'est la
  // seule qui dépende d'un état serveur. La lecture est posée pour toutes les
  // leçons (un hook conditionnel n'existe pas).
  const hifz = useHifzState();
  const { recordArabicAttempt, completeArabicLesson } = useStudentActions();
  const { engine } = useOffline();

  const versesMemorized = useMemo(() => {
    if (!lesson?.surahKey || !hifz) return 0;
    return hifz.surahs.find((entry) => entry.surahKey === lesson.surahKey)?.versesMemorized ?? 0;
  }, [hifz, lesson]);

  const steps = useMemo(
    () => (lesson ? buildSession(lesson, { versesMemorized }) : []),
    [lesson, versesMemorized],
  );
  const [index, setIndex] = useState(0);
  const [stepDone, setStepDone] = useState(false);
  const [tries, setTries] = useState(0);
  const [result, setResult] = useState<{ stars: number; score: number } | null>(null);
  const completing = useRef(false);

  const step = steps[index];
  const atEnd = steps.length > 0 && index >= steps.length;

  // La clôture part d'elle-même à la dernière étape : demander un clic de plus
  // à un enfant qui vient de finir, c'est risquer qu'il parte sans ses étoiles.
  // Les étoiles se calculent sur l'appareil, avec la règle du serveur
  // (`progressRules.lessonScore`), qui les recalcule à la synchronisation.
  useEffect(() => {
    if (!atEnd || completing.current || !lesson) return;
    completing.current = true;
    completeArabicLesson(lessonKey);
    void Promise.resolve().then(() => {
      const state = engine?.model().arabic?.lessonState(lessonKey);
      setResult({ stars: Math.max(1, state?.stars ?? 1), score: state?.bestScore ?? 0 });
    });
  }, [atEnd, completeArabicLesson, lesson, lessonKey, engine]);

  const advance = useCallback(() => {
    setStepDone(false);
    setTries(0);
    setIndex((current) => current + 1);
  }, []);

  const markDone = useCallback(() => setStepDone(true), []);

  const record: RecordAttempt = useCallback(
    (drill, itemKey, correct, score, verdict) => {
      recordArabicAttempt({
        lessonKey,
        drill,
        itemKey,
        correct,
        ...(score !== undefined ? { score } : {}),
        ...(verdict !== undefined ? { verdict } : {}),
      });
    },
    [lessonKey, recordArabicAttempt],
  );

  if (!lesson) return <NotFound />;
  if (path === undefined) return <QuranLoader message={arabicCopy.loading.lesson} />;
  if (lesson.kind === "hifz" && hifz === undefined) {
    return <QuranLoader message={arabicCopy.loading.lesson} />;
  }

  if (!path || !path.enabled) {
    return <Centered title={arabicCopy.notEnabled.title}>{arabicCopy.notEnabled.body}</Centered>;
  }

  const completed = new Set(
    path.progress.filter((row) => row.status === "completed").map((r) => r.lessonKey),
  );
  if (!isLessonUnlocked(lessonKey, completed, path.placement.floorOrder)) {
    return (
      <Centered title="Cette leçon n'est pas encore ouverte">{arabicCopy.lockedLesson}</Centered>
    );
  }

  if (result) return <LessonSummary lessonKey={lessonKey} stars={result.stars} />;
  if (!step) return <QuranLoader message={arabicCopy.loading.lesson} />;

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-2xl flex-col gap-4 px-4 pb-4 pt-1 sm:px-0">
      <KidHeader done={index} total={steps.length} />

      <main className="flex-1">
        <StepView
          key={`${index}:${step.kind}:${step.itemKey}`}
          step={step}
          lessonKey={lessonKey}
          round={index}
          tries={tries}
          record={record}
          onVoiceOutcome={() => {
            setTries((n) => n + 1);
            setStepDone(true);
          }}
          onDone={markDone}
          onNext={advance}
        />
      </main>

      {/* Une rencontre ou une écoute n'est pas notée : on continue quand on veut. */}
      <KidFooter
        done={stepDone || step.kind === "discoverLetter" || step.kind === "discoverItem"}
        onNext={advance}
      />
    </div>
  );
}

export default function ArabicLessonPage() {
  return (
    <Suspense fallback={<QuranLoader message={arabicCopy.loading.lesson} />}>
      <ArabicLessonPageInner />
    </Suspense>
  );
}

// ---------------------------------------------------------------------------
// Le cadre : Pio qui avance, le bouton qui rebondit
// ---------------------------------------------------------------------------

function KidHeader({ done, total }: { done: number; total: number }) {
  const pct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
  return (
    <header className="flex items-center gap-3">
      <Link
        href="/student/arabe"
        aria-label="Quitter la leçon, revenir au chemin"
        className="btn-chunky flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-[3px] border-white bg-gradient-to-b from-rose-300 to-rose-500 text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-200"
        style={{ "--btn-depth": "#9f1239" } as React.CSSProperties}
      >
        <X className="h-6 w-6" strokeWidth={3} aria-hidden />
      </Link>

      {/* La barre du chemin de la leçon : Pio y avance d'une étape à l'autre. */}
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
        aria-label="Avancée de la leçon"
        className="relative h-5 flex-1 rounded-full bg-amber-100 shadow-inner"
      >
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-lime-400 to-emerald-500"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4 }}
        />
        <motion.span
          aria-hidden
          className="absolute top-1/2"
          initial={false}
          animate={{ left: `${pct}%` }}
          transition={{ duration: 0.4 }}
          style={{ translateX: "-50%", translateY: "-50%" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- petite tête de Pio */}
          <img
            src="/images/pio/boubou/idle.png"
            alt=""
            className="h-11 w-11 rounded-full border-[3px] border-white bg-emerald-100 object-cover object-[50%_6%] shadow-md"
          />
        </motion.span>
      </div>

      <span className="flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-3 py-1.5 font-display text-base font-extrabold text-amber-800 shadow-inner">
        <Star className="h-5 w-5 fill-amber-400 text-amber-500" aria-hidden />
        {done}
      </span>
    </header>
  );
}

function KidFooter({ done, onNext }: { done: boolean; onNext: () => void }) {
  return (
    <footer className="sticky bottom-3 flex items-end justify-between">
      <button
        type="button"
        onClick={onNext}
        aria-label="Passer cette étape"
        className="flex h-11 w-11 items-center justify-center rounded-full bg-white/80 text-gray-400 shadow-sm hover:text-gray-600"
      >
        <SkipForward className="h-5 w-5" aria-hidden />
      </button>
      <AnimatePresence>
        {done && (
          <motion.button
            type="button"
            onClick={onNext}
            aria-label="Continuer"
            initial={{ scale: 0 }}
            animate={{ scale: 1, y: [0, -8, 0] }}
            exit={{ scale: 0 }}
            transition={{ scale: { type: "spring", stiffness: 300, damping: 15 }, y: { duration: 1.1, repeat: Infinity } }}
            className="btn-chunky flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-gradient-to-b from-lime-400 to-green-600 text-white shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-lime-200"
            style={{ "--btn-depth": "#166534" } as React.CSSProperties}
          >
            <ArrowRight className="h-10 w-10" strokeWidth={3.5} aria-hidden />
          </motion.button>
        )}
      </AnimatePresence>
    </footer>
  );
}

// ---------------------------------------------------------------------------
// Les étapes
// ---------------------------------------------------------------------------

type StepProps = {
  step: SessionStep;
  lessonKey: string;
  round: number;
  tries: number;
  record: RecordAttempt;
  onVoiceOutcome: () => void;
  onDone: () => void;
  onNext: () => void;
};

function StepView(props: StepProps) {
  const { step } = props;
  switch (step.kind) {
    case "discoverLetter":
      return <DiscoverLetterStep {...props} letterKey={step.itemKey} />;
    case "pronounce": {
      const letter = getLetter(step.itemKey);
      if (!letter) return null;
      return (
        <PronounceCoach
          lessonKey={props.lessonKey}
          letter={letter}
          onOutcome={props.onVoiceOutcome}
          onNext={props.onNext}
        />
      );
    }
    case "recognizeGlyph":
      return (
        <div className="space-y-4">
          <CoachLine
            pose="recite"
            line={`${CONSIGNES.find_letter}…`}
            say={[speech.consigne("find_letter"), speech.letter(step.itemKey)]}
          />
          <BalloonPick
            options={step.options}
            target={step.itemKey}
            round={props.round}
            renderLabel={(key) => (
              <ArabicGlyph text={getLetter(key)?.isolated ?? ""} className="h-20 w-20" />
            )}
            ariaLabel={(key) => `La lettre ${getLetter(key)?.nameFr ?? key}`}
            onFirstAnswer={(correct) => props.record("recognizeGlyph", step.itemKey, correct)}
            onSolved={props.onNext}
          />
        </div>
      );
    case "pickSyllable": {
      const lesson = getLesson(props.lessonKey);
      const arOf = (key: string) => lesson?.items.find((item) => item.key === key)?.ar ?? "";
      return (
        <div className="space-y-4">
          <CoachLine
            pose="recite"
            line={`${CONSIGNES.find_syllable}…`}
            say={[speech.consigne("find_syllable"), speech.item(props.lessonKey, step.itemKey)]}
          />
          <BalloonPick
            options={step.options}
            target={step.itemKey}
            round={props.round}
            renderLabel={(key) => <ArabicGlyph text={arOf(key)} className="h-20 w-20" />}
            ariaLabel={(key) => `Le son ${key}`}
            onFirstAnswer={(correct) => props.record("recognizeGlyph", step.itemKey, correct)}
            onSolved={props.onNext}
          />
        </div>
      );
    }
    case "matchPictures":
      return (
        <div className="space-y-4">
          <CoachLine pose="recite" line={CONSIGNES.match} say={[speech.consigne("match")]} />
          <MatchPictures
            letters={step.letters}
            seed={seedFromKey(`${props.lessonKey}:match`)}
            onPairAnswer={(letterKey, correct) => props.record("recognizeName", letterKey, correct)}
            onSolved={props.onNext}
          />
        </div>
      );
    case "dots":
      return (
        <div className="space-y-4">
          <CoachLine pose="recite" line={CONSIGNES.dots} say={[speech.consigne("dots")]} />
          <DotsGame
            letterKey={step.itemKey}
            options={step.options}
            round={props.round}
            onFirstAnswer={(correct) => props.record("dots", step.itemKey, correct)}
            onSolved={props.onNext}
          />
        </div>
      );
    case "write":
      return <WriteStep {...props} letterKey={step.itemKey} />;
    case "discoverItem":
    case "read":
      return <ReadingStep {...props} itemKey={step.itemKey} reading={step.kind === "read"} />;
    case "recite":
      return <ReciteStep {...props} itemKey={step.itemKey} mask={step.mask} />;
    default:
      return null;
  }
}

function DiscoverLetterStep({ letterKey }: StepProps & { letterKey: ArabicLetterKey }) {
  return (
    <div className="space-y-5">
      <CoachLine
        pose="recite"
        line={CONSIGNES.meet}
        say={[
          speech.consigne("meet"),
          speech.letter(letterKey),
          speech.consigne("meet_like"),
          speech.word(letterKey),
        ]}
      />
      <MeetLetter letterKey={letterKey} />
      <p className="text-center text-sm font-semibold text-emerald-900/70">{CONSIGNES.meet_tap}</p>
    </div>
  );
}

function WriteStep({ letterKey, record, onDone }: StepProps & { letterKey: ArabicLetterKey }) {
  const { say } = useSpeech();
  const letter = getLetter(letterKey);
  if (!letter) return null;
  return (
    <div className="space-y-4">
      <CoachLine pose="recite" line={CONSIGNES.trace} say={[speech.consigne("trace")]} />
      {/* Le doigt qui montre le sens : de la droite vers la gauche. */}
      <div aria-hidden className="relative mx-auto h-10 w-40">
        <motion.span
          className="absolute top-0 text-4xl"
          animate={{ left: ["80%", "0%"], opacity: [0, 1, 1, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          👈
        </motion.span>
      </div>
      <TracingCanvas
        glyph={letter.isolated}
        showInstruction={false}
        onValidate={(outcome) => {
          record("write", letterKey, outcome.verdict !== "retry", outcome.score, outcome.verdict);
          if (outcome.verdict !== "retry") {
            if (getSoundEnabledLocal()) void play("correct");
            void say([speech.consigne("trace_done")]);
          }
          onDone();
        }}
      />
    </div>
  );
}

function ReadingStep({
  itemKey,
  reading,
  lessonKey,
  tries,
  onVoiceOutcome,
}: StepProps & { itemKey: string; reading: boolean }) {
  const { say } = useSpeech();
  const lesson = getLesson(lessonKey);
  const item = lesson?.items.find((entry) => entry.key === itemKey);
  const isQuran = lesson?.kind === "coran";
  if (!item) return null;

  const listenKey = isQuran ? "quran_listen" : "listen_item";
  const readKey = isQuran ? "quran_read" : "read_item";

  return (
    <div className="space-y-5 text-center">
      <CoachLine
        // Sur un verset, Pio reste sobre : il salue et il écoute.
        pose={reading ? "listen" : isQuran ? "salam" : "recite"}
        line={CONSIGNES[reading ? readKey : listenKey]}
        say={
          reading
            ? [speech.consigne(readKey)]
            : [speech.consigne(listenKey), speech.item(lessonKey, itemKey)]
        }
      />
      <p
        dir="rtl"
        lang="ar"
        className="font-arabic rounded-[2rem] border-4 border-white bg-white px-5 py-8 text-5xl leading-[1.9] text-gray-900 shadow-lg"
      >
        {item.ar}
      </p>
      {item.translit && <p className="text-xl font-extrabold text-teal-700">{item.translit}</p>}
      {item.fr && <p className="text-base font-medium text-gray-500">{item.fr}</p>}
      {reading && (
        <>
          <ListenButton variant="chip" speechRef={speech.item(lessonKey, itemKey)} label="Écouter Pio" />
          <RecordButton
            key={`${lessonKey}:${itemKey}:read`}
            lessonKey={lessonKey}
            itemKey={itemKey}
            drill="read"
            attemptIndex={tries}
            onOutcome={(outcome) => {
              // La réussite se DIT, avec le bravo que la ligne de verdict écrit.
              if (outcome.verdict === "ok") void say([speech.consigne(bravo(tries))]);
              onVoiceOutcome();
            }}
            // Sans internet : l'enfant s'est réécouté, il peut continuer.
            onPracticed={onVoiceOutcome}
          />
        </>
      )}
    </div>
  );
}

function ReciteStep({
  itemKey,
  mask,
  lessonKey,
  tries,
  onVoiceOutcome,
}: StepProps & { itemKey: string; mask: "full" | "hints" | "hidden" }) {
  const { say } = useSpeech();
  const lesson = getLesson(lessonKey);
  const item = lesson?.items.find((entry) => entry.key === itemKey);
  if (!item) return null;
  return (
    <div className="space-y-5 text-center">
      <CoachLine
        pose="salam"
        line={CONSIGNES.recite}
        say={[speech.consigne("recite"), speech.item(lessonKey, itemKey)]}
      />
      {item.fr && <p className="text-base font-medium text-gray-500">{item.fr}</p>}
      <MaskedText text={item.ar} mask={mask} />
      <RecordButton
        key={`${lessonKey}:${itemKey}:recite`}
        lessonKey={lessonKey}
        itemKey={itemKey}
        drill="recite"
        attemptIndex={tries}
        onOutcome={(outcome) => {
          if (outcome.verdict === "ok") void say([speech.consigne(bravo(tries))]);
          onVoiceOutcome();
        }}
        onPracticed={onVoiceOutcome}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// La fin de la leçon
// ---------------------------------------------------------------------------

function LessonSummary({ lessonKey, stars }: { lessonKey: string; stars: number }) {
  const { say } = useSpeech();
  const current = ARABIC_LESSONS.findIndex((item) => item.key === lessonKey);
  const lesson = current >= 0 ? ARABIC_LESSONS[current] : undefined;
  const next = current >= 0 ? ARABIC_LESSONS[current + 1] : undefined;
  // Le Coran n'est pas un jeu (`lib/arabic/copy.ts`) : après une sourate,
  // Pio salue, main sur le cœur, et on dit « c'est lu » ; après des lettres,
  // il applaudit et l'enfant gagne ses autocollants.
  const sober = lesson?.kind === "coran" || lesson?.kind === "hifz";
  const stickers = lesson?.kind === "alphabet" ? (lesson.letters as ArabicLetterKey[]) : [];

  useEffect(() => {
    if (!sober && getSoundEnabledLocal()) void play("badge");
    void say([speech.consigne(sober ? "lesson_done_quran" : "lesson_done")]);
  }, [say, sober]);

  return (
    // La carte au MILIEU de l'écran, en hauteur comme en largeur : le `main`
    // du mode focus a déjà écarté l'encoche et la barre d'accueil
    // (app/(student)/layout.app.tsx), on centre dans ce qui reste.
    <div className="flex min-h-[calc(100dvh_-_env(safe-area-inset-top)_-_env(safe-area-inset-bottom)_-_1.5rem)] items-center justify-center px-4 py-4 sm:px-0">
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-[2rem] border-4 border-white bg-gradient-to-b from-amber-50 to-white p-6 text-center shadow-xl"
      >
        <Pio state={sober ? "salam" : "bravo"} outfit="boubou" size={170} className="mx-auto" />
        <h1 className="font-display mt-2 text-3xl font-extrabold text-emerald-900">
          {sober ? "C'est lu !" : "MashaAllah !"}
        </h1>

        {!sober && (
          <div className="mt-3 flex justify-center gap-2">
            {[1, 2, 3].map((n) => (
              <motion.span
                key={n}
                initial={{ scale: 0, rotate: -40 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.3 + n * 0.25, type: "spring", stiffness: 260, damping: 12 }}
              >
                <Star
                  className={`h-14 w-14 ${n <= stars ? "fill-amber-400 text-amber-500" : "text-gray-200"}`}
                  aria-hidden
                />
              </motion.span>
            ))}
          </div>
        )}

        {stickers.length > 0 && (
          <div className="mt-5">
            <p className="font-display text-sm font-extrabold uppercase tracking-wide text-amber-800">
              Nouveaux autocollants
            </p>
            {/* Comme dans l'album : la lettre au centre du rond, son image en
                pastille dans le coin. La pastille n'entre qu'en fondu — un émoji
                qui part d'une échelle nulle peut rester blanc dans la vue web
                d'iOS (un seul des quatre s'affichait le 29 septembre 2026). */}
            <div dir="rtl" className="mt-3 flex justify-center gap-3">
              {stickers.map((key, i) => (
                <div key={key} className="relative">
                  <motion.span
                    initial={{ opacity: 0, scale: 0.6, y: 16 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: 1.2 + i * 0.2, type: "spring", stiffness: 260, damping: 14 }}
                    className="flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-full border-[3px] border-white bg-gradient-to-b from-amber-200 to-amber-400 text-amber-950 shadow-md"
                  >
                    <ArabicGlyph text={getLetter(key)?.isolated ?? ""} fill={0.62} className="h-full w-full" />
                  </motion.span>
                  <motion.span
                    aria-hidden
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 + i * 0.2, duration: 0.3 }}
                    className="absolute -right-1.5 -top-1.5 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-white text-lg leading-none shadow"
                  >
                    {LETTER_WORDS[key].emoji}
                  </motion.span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3">
          {next && (
            <GameButton
              href={`/student/arabe/lecon?key=${next.key}`}
              tone="green"
              size="lg"
              className="w-full"
              icon={<ArrowRight className="h-6 w-6" aria-hidden />}
              ariaLabel="Leçon suivante"
            >
              Leçon suivante
            </GameButton>
          )}
          <GameButton
            href="/student/arabe"
            tone="white"
            size="lg"
            className="w-full"
            icon={<MapIcon className="h-6 w-6" aria-hidden />}
            ariaLabel="Revenir au chemin"
          >
            Le chemin
          </GameButton>
        </div>
      </motion.div>
    </div>
  );
}

function Centered({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-4 max-w-md rounded-3xl border-2 border-amber-200 bg-white p-8 text-center shadow-sm sm:mx-auto">
      <Pio state="encourage" outfit="boubou" size={120} className="mx-auto" />
      <h1 className="font-display mt-3 text-xl font-extrabold text-gray-900">{title}</h1>
      <p className="mt-2 text-base text-gray-600">{children}</p>
      <Link
        href="/student/arabe"
        className="mt-5 inline-block rounded-2xl bg-teal-600 px-5 py-2.5 text-base font-bold text-white"
      >
        Le chemin
      </Link>
    </div>
  );
}

function NotFound() {
  return (
    <Centered title="Leçon introuvable">
      Cette leçon n&apos;existe pas (ou plus). Reviens au chemin pour choisir la suivante.
    </Centered>
  );
}
