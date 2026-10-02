"use client";

/**
 * LA SÉANCE D'UN PALIER — DIX EXERCICES, JOUÉS SUR L'APPAREIL.
 *
 * Depuis octobre 2026, la séance ne demande plus rien au réseau pendant
 * qu'elle se joue (`docs/hors-ligne.md`) :
 *
 *   - les exercices viennent du paquet de la classe, réponses comprises
 *     (`lib/offline/`), copiés dans la séance au premier geste ;
 *   - chaque réponse se juge sur le téléphone, avec la règle du serveur
 *     (`convex/paliers/exerciseRules.ts`) : la réaction est immédiate, même
 *     sur un réseau lent ;
 *   - chaque réponse et chaque indice s'écrivent dans le fichier de la
 *     séance avant d'être montrés : un téléphone qui s'éteint reprend où il
 *     était ;
 *   - la fin du palier se note comme le serveur la notera
 *     (`lib/offline/session-rules.ts`), puis la séance part au serveur dès
 *     qu'il est joignable, qui rejuge tout et range tentative, étoiles,
 *     thématique, série, missions et trophées (`convex/offline/sync.ts`).
 *
 * CE QUI DEMANDE ENCORE LE RÉSEAU, avec son repli :
 *   - un palier qui n'est pas encore dans le sac : en ligne, il se génère ici
 *     (`paliers.getBucket`) ; sans réseau, l'écran le dit et renvoie au
 *     sentier ;
 *   - la nouvelle chance aux exercices variés (IA) : sans réseau, on rejoue
 *     le palier ;
 *   - « Je veux comprendre » sans explication gardée : sans réseau, la bonne
 *     réponse et les indices (`ExplainStepByStep`).
 */

import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { useAction, useConvex } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Lightbulb,
  LockKeyhole,
  Sparkles,
  Volume2,
  VolumeX,
  WifiOff,
  X,
} from "lucide-react";
import { LostTrail } from "@/components/student/game/lost-trail";
import Link from "next/link";

import { JotnaLoader } from "@/components/jotna-loader";
import { playCorrect, setSoundEnabledLocal } from "@/lib/sounds";
import { PalierResultScreen } from "@/components/student/game/palier-result";
import { effectivePalierCount } from "@/convex/palierRules";
import { attemptsRemainingAfter } from "@/convex/paliers/scoring";
import {
  correctAnswerText,
  sanitizePayload,
  verifyAnswer,
} from "@/convex/paliers/exerciseRules";
import { CapRegenAlternatives } from "@/components/cap-regen-alternatives";
import { kidMessages } from "@/lib/kidCopy";
import { isAccessDenied } from "@/lib/accessCopy";
import { ExplainStepByStep } from "@/components/student/explain-step-by-step";
import { Pio } from "@/components/student/pio";
import { StudentAlertDialog } from "@/components/student/student-alert-dialog";
import { AnswerFeedback } from "@/components/student/game/answer-feedback";
import QcmExercise from "@/components/exercises/QcmExercise";
import ShortAnswerExercise from "@/components/exercises/ShortAnswerExercise";
import MatchExercise from "@/components/exercises/MatchExercise";
import OrderExercise from "@/components/exercises/OrderExercise";
import DragDropExercise from "@/components/exercises/DragDropExercise";
import { PromptReaderProvider } from "@/components/exercises/prompt-reader";
import { isReadingLearnerClass, type VisibleClassName } from "@/convex/curriculum";
import { motion, AnimatePresence } from "framer-motion";
import { refusalMessage } from "@/lib/refusalMessage";
import { useOffline, useOfflineModel } from "@/components/offline/context";
import { useSoundPreference, useStudentActions } from "@/hooks/use-student-data";
import { newSessionId } from "@/lib/offline/engine";
import {
  realAttemptsOn,
  rowsForExercise,
  sessionProgress,
  type LocalLogEntry,
  type SessionGrade,
} from "@/lib/offline/session-rules";
import type { OfflineModel } from "@/lib/offline/model";
import type { PackExercise, PackPalier } from "@/lib/offline/types";

type SanitizedExo = {
  _id: string;
  type: "qcm" | "drag-drop" | "match" | "order" | "short-answer";
  prompt: string;
  payload: Record<string, unknown>;
  hintsAvailable: number;
};

/** Le journal d'une séance qui n'a pas encore commencé. */
const NO_LOG: readonly LocalLogEntry[] = [];

type SceneAlert =
  | { type: "regen-error"; message: string }
  | { type: "access-blocked" }
  | { type: "parent-notified" }
  | { type: "quit-confirm" };

function TopicSessionPageInner() {
  const searchParams = useSearchParams();
  const topicId = searchParams.get("id") ?? "";
  const palierIndex = parseInt(searchParams.get("palier") ?? "1", 10);

  return <PalierSession key={`${topicId}-${palierIndex}`} topicId={topicId} palierIndex={palierIndex} />;
}

/** Le palier de rang `palierIndex` de la thématique, s'il est dans le sac. */
function palierInPack(model: OfflineModel, topicId: string, palierIndex: number): PackPalier | null {
  for (const palier of model.palierById.values()) {
    if (palier.topicId === topicId && palier.palierIndex === palierIndex) return palier;
  }
  return null;
}

/** Le palier précédent est-il validé (en ligne ou sur l'appareil) ? */
function palierValidated(model: OfflineModel, topicId: string, palierIndex: number): boolean {
  return model.attempts.some(
    (a) => a.topicId === topicId && a.palierIndex === palierIndex && a.status === "validated",
  );
}

function PalierSession({ topicId, palierIndex }: { topicId: string; palierIndex: number }) {
  const router = useRouter();
  const convex = useConvex();
  const { engine, sync, connected, confirmed, requestSync } = useOffline();
  const model = useOfflineModel();
  const getBucket = useAction(api.paliers.index.getBucket);
  const regenerate = useAction(api.paliers.index.regenerateFailedExercises);
  // D22 — quick-mute support during session focus mode
  const soundPref = useSoundPreference();
  const { setSoundEnabled } = useStudentActions();

  // La séance de ce palier : celle qu'on a ouverte ici, sinon celle laissée
  // en cours, sinon une séance à venir — elle naît au premier geste, avec cet
  // identifiant tiré d'avance (la graine du mélange des tuiles).
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const [draftId, setDraftId] = useState(newSessionId);
  // L'exercice affiché. `null` : celui où la séance en est (une reprise).
  const [shownIndex, setShownIndex] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{
    correct: boolean;
    attemptsRemaining: number;
  } | null>(null);
  const [hintShown, setHintShown] = useState<{
    text: string;
    index: number;
  } | null>(null);
  // La note de la séance finie ICI : l'écran de fin la garde, même si le
  // moteur range la séance entre-temps.
  const [result, setResult] = useState<{ sessionId: string; grade: SessionGrade } | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [capReached, setCapReached] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [sceneAlert, setSceneAlert] = useState<SceneAlert | null>(null);
  // Step-by-step explanation panel — opened when the kid taps
  // "Je veux comprendre" after exhausting all 5 attempts on an exercise.
  const [explainOpen, setExplainOpen] = useState(false);

  const topic = model?.topicsById.get(topicId) ?? null;
  const palier = model && topic ? palierInPack(model, topicId, palierIndex) : null;
  const locked =
    !!model && !!topic && palierIndex > 1 && !palierValidated(model, topicId, palierIndex - 1);

  // Lues dans le modèle (qui change à chaque geste), jamais gardées.
  const pinnedKey = result?.sessionId ?? pinnedId;
  const pinned = pinnedKey ? (model?.sessions.find((s) => s.sessionId === pinnedKey) ?? null) : null;
  const open =
    !pinned && palier && model
      ? (model.sessions
          .filter((s) => s.palierId === palier._id && s.finishedAt === undefined)
          .sort((a, b) => b.startedAt - a.startedAt)[0] ?? null)
      : null;
  const session = pinned ?? open;
  const sessionId = session?.sessionId ?? draftId;

  // Les exercices : ceux de la séance (copiés au départ), sinon ceux du sac.
  const fullExercises: PackExercise[] = (() => {
    if (session) {
      const byId = new Map(session.exercises.map((ex) => [ex._id, ex] as const));
      return session.exerciseIds
        .map((id) => byId.get(id) ?? model?.exerciseById.get(id))
        .filter((ex): ex is PackExercise => !!ex);
    }
    if (!palier || !model) return [];
    return palier.exerciseIds
      .map((id) => model.exerciseById.get(id as string))
      .filter((ex): ex is PackExercise => !!ex);
  })();
  const exercises: SanitizedExo[] = fullExercises.map((ex) => ({
    _id: ex._id,
    type: ex.type,
    prompt: ex.prompt,
    payload: sanitizePayload(ex.type, ex.payload, ex._id, sessionId) as Record<string, unknown>,
    hintsAvailable: ex.hints.length,
  }));

  const log = session?.log ?? NO_LOG;
  const progress = sessionProgress(
    fullExercises.map((ex) => ex._id),
    log,
  );
  const currentIndex = Math.min(shownIndex ?? progress.currentIndex, Math.max(0, exercises.length - 1));
  const exo = exercises[currentIndex];
  const exoRows = exo ? rowsForExercise(log, exo._id) : [];
  const failedAttemptsThisExo = exoRows.filter((r) => r.attemptNumber > 0 && !r.isCorrect).length;
  const hintsUsedThisExo = exoRows.reduce((acc, r) => acc + r.hintsUsedCount, 0);
  const grade =
    result?.grade ?? (session?.finishedAt !== undefined ? (session.grade ?? null) : null);

  // UNE SÉANCE REPRISE DONT TOUS LES EXERCICES SONT FAITS se note d'elle-même :
  // l'application s'est fermée juste avant le dernier « Suivant ». Seulement à
  // la reprise (aucun geste encore ici) : en cours de jeu, c'est « Suivant »
  // qui note, après la fête de la dernière réponse.
  const autoFinish =
    !!session &&
    shownIndex === null &&
    session.finishedAt === undefined &&
    progress.allDone &&
    log.length > 0;
  useEffect(() => {
    if (autoFinish && engine && session) {
      engine.finishSession(session.sessionId);
      requestSync();
    }
  }, [autoFinish, engine, session, requestSync]);

  // D29 — sync local sound memo with the preference for play() short-circuit.
  useEffect(() => {
    if (soundPref?.soundEnabled !== undefined) {
      setSoundEnabledLocal(soundPref.soundEnabled);
    }
  }, [soundPref?.soundEnabled]);

  const handleToggleSound = useCallback(() => {
    const next = !(soundPref?.soundEnabled ?? false);
    setSoundEnabledLocal(next);
    setSoundEnabled(next);
  }, [soundPref?.soundEnabled, setSoundEnabled]);

  /** La séance de l'écran, créée au premier geste si elle n'existe pas encore. */
  const ensureSession = useCallback((): string | null => {
    if (!engine || !topic || !palier) return null;
    if (session && session.finishedAt === undefined) return session.sessionId;
    const created = engine.startSession(palier, topic, fullExercises, draftId);
    setPinnedId(created.sessionId);
    // Le prochain départ aura son propre identifiant.
    setDraftId(newSessionId());
    return created.sessionId;
  }, [engine, topic, palier, session, fullExercises, draftId]);

  // UN PALIER QUI N'EST PAS DANS LE SAC se génère en ligne, comme avant la
  // séance hors ligne : le serveur le crée (`getBucket`), puis le contenu
  // de la classe se relit.
  const fetchPalier = useCallback(async () => {
    if (!topic || !sync || !topic.class) return;
    setGenerating(true);
    setGenerationError(null);
    try {
      await getBucket({
        subjectId: topic.subjectId,
        class: topic.class as VisibleClassName,
        topicId: topic._id,
        palierIndex,
      });
      await sync.refreshContent(true);
    } catch (err: unknown) {
      // Les refus que cet écran affiche sont des `ConvexError`, et
      // `refusalMessage` lit leur `data`.
      setGenerationError(
        isAccessDenied(err) ? kidMessages.accessNotOpen : refusalMessage(err, kidMessages.genFailed),
      );
    } finally {
      setGenerating(false);
    }
  }, [topic, sync, getBucket, palierIndex]);

  const canFetch = connected && confirmed && !!sync;
  const shouldFetch =
    !!model && !!topic && !locked && !palier && canFetch && !generating && generationError === null;
  useEffect(() => {
    if (!shouldFetch) return;
    const timer = setTimeout(() => void fetchPalier(), 0);
    return () => clearTimeout(timer);
  }, [shouldFetch, fetchPalier]);

  const handleQuit = useCallback(() => {
    setSceneAlert({ type: "quit-confirm" });
  }, []);

  const nextExoRef = useRef<() => void>(() => {});
  // Le moment où l'exercice courant est apparu : le temps de réponse rangé
  // dans la séance en découle (trophées de rapidité, temps du carnet).
  const exoShownAtRef = useRef<number>(0);
  useEffect(() => {
    exoShownAtRef.current = Date.now();
  }, [currentIndex, exo?._id]);
  // Le minuteur de l'alerte de réponse : gardé pour qu'une réponse suivante
  // ne se fasse pas effacer par le minuteur de la précédente.
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    },
    [],
  );

  const handleRequestHint = useCallback(() => {
    if (!exo || !engine) return;
    const full = fullExercises[currentIndex];
    if (!full || hintsUsedThisExo >= full.hints.length) return;
    const id = ensureSession();
    if (!id) return;
    engine.recordHint(id, exo._id, hintsUsedThisExo);
    setShownIndex(currentIndex);
    setHintShown({ text: full.hints[hintsUsedThisExo], index: hintsUsedThisExo });
  }, [exo, engine, fullExercises, currentIndex, hintsUsedThisExo, ensureSession]);

  const handleNextExo = useCallback(() => {
    if (exercises.length === 0) return;
    exoShownAtRef.current = Date.now();
    setFeedback(null);
    setHintShown(null);
    if (currentIndex < exercises.length - 1) {
      setShownIndex(currentIndex + 1);
      return;
    }
    // Fin du palier : la note se calcule ici, et la séance part au serveur.
    // Une séance déjà notée (reprise) n'est pas recréée : on montre sa note.
    if (!engine) return;
    if (session?.finishedAt !== undefined && session.grade) {
      setResult({ sessionId: session.sessionId, grade: session.grade });
      return;
    }
    const id = ensureSession();
    if (!id) return;
    const finished = engine.finishSession(id);
    if (finished) setResult({ sessionId: id, grade: finished });
    requestSync();
  }, [exercises.length, currentIndex, ensureSession, engine, requestSync, session]);

  useEffect(() => {
    nextExoRef.current = handleNextExo;
  }, [handleNextExo]);

  const handleSubmitAnswer = useCallback(
    (answer: string) => {
      if (!exo || !engine) return;
      const full = fullExercises[currentIndex];
      if (!full) return;
      const id = ensureSession();
      if (!id) return;
      const correct = verifyAnswer(full, answer);
      // Le journal à l'instant du geste, relu dans le moteur : pas celui du
      // dernier rendu.
      const attemptNumber = realAttemptsOn(engine.getSession(id)?.log ?? NO_LOG, exo._id) + 1;
      engine.recordAnswer(id, {
        exerciseId: exo._id,
        answer,
        correct,
        timeSpentMs: exoShownAtRef.current > 0 ? Math.max(0, Date.now() - exoShownAtRef.current) : 0,
      });
      exoShownAtRef.current = Date.now();
      // L'écran reste sur cet exercice le temps de la réaction.
      setShownIndex(currentIndex);
      const attemptsRemaining = attemptsRemainingAfter(attemptNumber);
      setFeedback({ correct, attemptsRemaining });
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
      if (correct) {
        void playCorrect();
        // Le temps de voir Pio fêter et les étoiles partir.
        feedbackTimer.current = setTimeout(() => nextExoRef.current(), 1800);
      } else if (attemptsRemaining > 0) {
        feedbackTimer.current = setTimeout(() => setFeedback(null), 2600);
      }
    },
    [exo, engine, fullExercises, currentIndex, ensureSession],
  );

  /** Rejouer le palier depuis le début, sur une séance neuve. */
  const replayPalier = useCallback(() => {
    if (!engine || !topic || !palier || !model) return;
    const packExercises = palier.exerciseIds
      .map((id) => model.exerciseById.get(id as string))
      .filter((ex): ex is PackExercise => !!ex);
    const fresh = engine.startSession(palier, topic, packExercises, newSessionId());
    setResult(null);
    setPinnedId(fresh.sessionId);
    setDraftId(newSessionId());
    setShownIndex(0);
    setFeedback(null);
    setHintShown(null);
  }, [engine, topic, palier, model]);

  // LA NOUVELLE CHANCE. En ligne : la séance part d'abord au serveur, qui
  // remplace les exercices ratés par des variations (IA) ; la séance reprend
  // sur la même tentative. Sans réseau, ou si l'IA ne répond pas : on rejoue
  // le palier.
  const handleRegen = useCallback(async () => {
    if (!engine || !session) return;
    setRegenerating(true);
    try {
      if (connected && confirmed && sync) {
        const serverAttemptId = await sync.pushSession(session.sessionId);
        if (serverAttemptId) {
          const res = await regenerate({
            palierAttemptId: serverAttemptId as Id<"palierAttempts">,
          });
          if (res.ok) {
            const data = await convex.query(api.offline.pack.attemptExercises, {
              palierAttemptId: serverAttemptId as Id<"palierAttempts">,
            });
            if (data && data.exercises.length > 0) {
              engine.reopenWithVariations(
                session.sessionId,
                data.exercises.map((ex) => ({ ...ex, _id: ex._id as string, palierId: ex.palierId as string })),
                data.exercises.map((ex) => ex._id as string),
              );
              setResult(null);
              setPinnedId(session.sessionId);
              setShownIndex(null);
              setFeedback(null);
              setHintShown(null);
              return;
            }
          } else if (res.reason === "REGEN_CAP_REACHED") {
            setCapReached(true);
            return;
          }
        }
      }
      replayPalier();
    } catch (err) {
      if (isAccessDenied(err)) {
        setSceneAlert({ type: "access-blocked" });
      } else {
        replayPalier();
      }
    } finally {
      setRegenerating(false);
    }
  }, [engine, session, connected, confirmed, sync, regenerate, convex, replayPalier]);

  // ==== RENDER ====

  if (model === undefined) {
    return <JotnaLoader className="min-h-[70dvh]" />;
  }
  if (model === null || !model.profile) {
    return (
      <CenteredCard>
        <h2 className="text-xl font-bold">Non connecté</h2>
        <p className="text-gray-500">Connecte-toi pour faire les exercices.</p>
        <Link
          href="/login"
          className="rounded-2xl bg-gradient-to-r from-orange-400 to-pink-500 px-6 py-3 text-base font-bold text-white shadow-lg"
        >
          Se connecter
        </Link>
      </CenteredCard>
    );
  }
  if (!topic) {
    return model.hasContent ? (
      <LostTrail kind="topic" />
    ) : (
      <CenteredCard>
        <WifiOff className="h-14 w-14 text-sky-400" aria-hidden />
        <p className="max-w-sm text-base font-semibold text-slate-600">{kidMessages.offline.packEmpty}</p>
        <button
          onClick={() => router.back()}
          className="rounded-2xl bg-gray-200 px-6 py-2 text-base font-semibold"
        >
          Retour
        </button>
      </CenteredCard>
    );
  }

  if (locked) {
    return (
      <LockedPalierScreen
        currentPalier={palierIndex}
        previousPalier={palierIndex - 1}
        message={`Tu dois d'abord valider le palier ${palierIndex - 1} avant de passer au suivant.`}
        onGoPrevious={() =>
          router.replace(`/student/topics/session?id=${topicId}&palier=${palierIndex - 1}`)
        }
      />
    );
  }

  if (!palier) {
    if (generationError) {
      return (
        <CenteredCard>
          <p className="text-base text-red-600">{generationError}</p>
          <button
            onClick={() => router.back()}
            className="rounded-2xl bg-gray-200 px-6 py-2 text-base font-semibold"
          >
            Retour
          </button>
        </CenteredCard>
      );
    }
    if (canFetch) return <JotnaLoader className="min-h-[70dvh]" />;
    return (
      <CenteredCard>
        <Pio state="think" size={130} />
        <h2 className="font-display text-xl font-extrabold text-slate-900">
          {kidMessages.offline.palierNotReadyTitle}
        </h2>
        <p className="max-w-sm text-base text-slate-600">{kidMessages.offline.palierNotReadyBody}</p>
        <button
          onClick={() => router.push(`/student/subjects?id=${topic.subjectId}`)}
          className="rounded-2xl bg-gradient-to-r from-orange-400 to-pink-500 px-6 py-3 text-base font-bold text-white shadow-lg"
        >
          Retour au sentier
        </button>
      </CenteredCard>
    );
  }

  if (exercises.length === 0) {
    return (
      <CenteredCard>
        <BookOpen className="h-16 w-16 text-gray-300" />
        <h2 className="text-xl font-bold">Aucun exercice disponible</h2>
        <button
          onClick={() => router.back()}
          className="rounded-2xl bg-gradient-to-r from-orange-400 to-pink-500 px-6 py-3 text-base font-bold text-white shadow-lg"
        >
          Retour
        </button>
      </CenteredCard>
    );
  }

  // L'ÉCRAN DE FIN DE PALIER : la scène de jeu, avec le sentier de la
  // thématique (`components/student/game/palier-result.tsx`). Le seuil
  // arrive en dixièmes (7 sur 10) ; l'écran parle en étoiles, sur le nombre
  // d'exercices vraiment joués (trois par exercice).
  if (grade) {
    const palierCount = effectivePalierCount(topic);
    const trailHref = `/student/subjects?id=${topic.subjectId}`;
    // La nouvelle chance : le serveur a le dernier mot (trois par semaine) ;
    // sans sa réponse, on l'offre — sans réseau, elle rejoue le palier.
    const canRegen =
      grade.status !== "validated" && !capReached && (session?.serverCanRegen ?? true);
    return (
      <>
        <PalierResultScreen
          result={{
            status: grade.status,
            starsTotal: grade.starsTotal,
            exerciseCount: grade.exerciseCount,
            thresholdTenths: grade.threshold,
            canRegen,
          }}
          topicName={topic.name ?? "Thématique"}
          palierIndex={palierIndex}
          palierCount={palierCount}
          nextPalierHref={
            palierIndex < palierCount
              ? `/student/topics/session?id=${topicId}&palier=${palierIndex + 1}`
              : null
          }
          trailHref={trailHref}
          regenerating={regenerating}
          onRegen={handleRegen}
          capAlternatives={
            <CapRegenAlternatives
              onSeeCorrected={replayPalier}
              previousPalierHref={
                palierIndex > 1
                  ? `/student/topics/session?id=${topicId}&palier=${palierIndex - 1}`
                  : null
              }
              onAskParent={() => {
                setSceneAlert({ type: "parent-notified" });
              }}
            />
          }
        />
        <SceneAlertDialog
          alert={sceneAlert}
          onClose={() => setSceneAlert(null)}
          onGoHome={() => {
            setSceneAlert(null);
            router.push("/student/home");
          }}
          onQuit={() => {
            setSceneAlert(null);
            router.push(trailHref);
          }}
        />
      </>
    );
  }

  // In-progress palier player
  const totalExos = exercises.length;
  const disabled = feedback !== null;
  const fullExo = fullExercises[currentIndex];
  // LE LECTEUR DE CONSIGNES : un enfant qui apprend à lire (CI, CP) entend la
  // consigne de chaque exercice (`components/exercises/prompt-reader.tsx`).
  // La classe est celle de l'enfant ; à défaut, celle de la thématique.
  const readsAloud = isReadingLearnerClass(model.profile.class ?? topic.class);
  const exerciseRenderer = (
    <ExerciseRenderer
      exo={exo}
      disabled={disabled}
      isCorrect={feedback?.correct ?? null}
      onSubmit={handleSubmitAnswer}
      onSkip={handleNextExo}
    />
  );

  return (
    <div className="relative mx-auto max-w-2xl pb-4">

      {/* LA BARRE DE SÉANCE. Collée sous la barre d'état (le fond crème
          derrière l'encoche est posé par `(student)/layout` en mode focus),
          elle reste visible quand un exercice long défile. Débordement
          `-mx-4` : le `main` du mode focus a 1rem de marge, la barre va
          d'un bord à l'autre. */}
      <div className="sticky top-[env(safe-area-inset-top)] z-20 -mx-4 mb-4 border-b border-amber-200/60 bg-[#fff7e0]/90 px-4 pb-2.5 pt-2 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-xl font-extrabold leading-tight text-amber-950">
              {topic.name ?? "Palier"}
            </p>
            <p className="mt-0.5 font-display text-sm font-bold text-amber-900/80">
              Palier {palierIndex} · Question {currentIndex + 1}/{totalExos}
              {fullExo?.isVariation && (
                <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                  Variation
                </span>
              )}
            </p>
          </div>
          {/* D22 — quick-mute. Only renders if the kid has decided about
              sounds (soundPref !== null + .soundEnabled defined). Hides for
              brand-new students who haven't seen the opt-in dialog yet. */}
          {soundPref && (
            <button
              type="button"
              onClick={handleToggleSound}
              aria-label={
                soundPref.soundEnabled
                  ? "Couper le son"
                  : "Activer le son"
              }
              aria-pressed={soundPref.soundEnabled}
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-amber-200 bg-white text-amber-900 shadow-sm transition-all hover:bg-amber-50"
            >
              {soundPref.soundEnabled ? (
                <Volume2 className="h-6 w-6" aria-hidden />
              ) : (
                <VolumeX className="h-6 w-6" aria-hidden />
              )}
            </button>
          )}
          <button
            type="button"
            onClick={handleQuit}
            aria-label={kidMessages.cta.quit}
            className="inline-flex h-12 min-w-12 shrink-0 items-center justify-center gap-1.5 rounded-full border-2 border-amber-200 bg-white px-3 font-display text-sm font-extrabold text-amber-900 shadow-sm hover:bg-amber-50"
          >
            <X className="h-6 w-6" strokeWidth={3} aria-hidden />
            <span className="hidden sm:inline">{kidMessages.cta.quit}</span>
          </button>
        </div>

        {/* Progress bar */}
        <div className="mt-2.5 h-3 w-full overflow-hidden rounded-full bg-amber-900/15">
          <motion.div
            initial={{ width: 0 }}
            animate={{
              width: `${((currentIndex + (feedback?.correct ? 1 : 0)) / totalExos) * 100}%`,
            }}
            className="h-full rounded-full bg-gradient-to-r from-orange-400 to-pink-500"
          />
        </div>
      </div>

      {/* Exercise */}
      <AnimatePresence mode="wait">
        <motion.div
          // LA CLÉ EST L'EXERCICE, PAS LA RÉPONSE. Avec la réponse dans la
          // clé, chaque « Bravo » ou « Pas tout à fait » remontait toute la
          // carte : l'exercice clignotait, le choix de l'enfant s'effaçait,
          // et rien ne pouvait s'animer. La carte ne change qu'au prochain
          // exercice ; la réaction se joue dedans.
          key={exo._id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="rounded-3xl bg-white p-6 shadow-md"
        >
          {/* La consigne se tait dès que l'enfant a répondu ou qu'une fenêtre
              s'ouvre par-dessus. */}
          {readsAloud ? (
            <PromptReaderProvider
              exerciseId={exo._id}
              silenced={feedback !== null || explainOpen || sceneAlert !== null}
            >
              {exerciseRenderer}
            </PromptReaderProvider>
          ) : (
            exerciseRenderer
          )}

          {/* Hints — progressive: first hint unlocks after 1 failed attempt,
              second after 2, third after 4. Only shown when the kid has failed
              at least once and isn't currently seeing feedback. */}
          {!feedback && failedAttemptsThisExo > 0 && exo.hintsAvailable > 0 && (
            <div className="mt-4 space-y-2">
              {hintsUsedThisExo < exo.hintsAvailable &&
                hintsUsedThisExo < (failedAttemptsThisExo >= 4 ? 3 : failedAttemptsThisExo >= 2 ? 2 : 1) && (
                <button
                  onClick={handleRequestHint}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-800 transition-all hover:bg-amber-200"
                >
                  <Lightbulb className="h-4 w-4" />
                  Voir un indice
                </button>
              )}
              {hintShown && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl bg-amber-50 border border-amber-200 p-3"
                >
                  <p className="text-sm text-amber-900">
                    <span className="font-semibold">
                      Indice {hintShown.index + 1} :
                    </span>{" "}
                    {hintShown.text}
                  </p>
                </motion.div>
              )}
            </div>
          )}

          {/* La réaction du jeu, en alerte au milieu de l'écran (portée dans
              le body). Bonne réponse : on passe seul à la suite. Mauvaise avec
              des essais : s'efface seule ou d'un toucher. Plus d'essai :
              reste, avec les deux boutons de suite. */}
          <AnimatePresence>
            {/* PENDANT L'EXPLICATION, L'ALERTE S'EFFACE : posée au-dessus de
                tout (portail, z-50), elle couvrait le panneau « Je veux
                comprendre » (z-40) et l'enfant ne voyait rien. Elle revient
                quand le panneau se ferme, avec ses boutons de suite. */}
            {feedback && !explainOpen && (
              <AnswerFeedback
                key={`${exo._id}-${failedAttemptsThisExo}-${feedback.correct ? "ok" : "ko"}`}
                outcome={feedback}
                seed={currentIndex * 10 + failedAttemptsThisExo}
                isLast={currentIndex >= totalExos - 1}
                busy={false}
                onNext={handleNextExo}
                onExplain={() => setExplainOpen(true)}
                onDismiss={() => {
                  if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
                  setFeedback(null);
                }}
              />
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>

      {/* Step-by-step pedagogical explanation overlay (kid clicked
          "Je veux comprendre" after exhausting all 5 attempts). The
          `key={exo._id}` forces a remount on exercise change so the
          loading state resets cleanly without setState-in-effect. */}
      {exo && (
        <ExplainStepByStep
          key={exo._id}
          exerciseId={exo._id}
          open={explainOpen}
          onClose={() => setExplainOpen(false)}
          fallback={
            fullExo
              ? { correctAnswer: correctAnswerText(fullExo), hints: fullExo.hints }
              : undefined
          }
        />
      )}
      <SceneAlertDialog
        alert={sceneAlert}
        onClose={() => setSceneAlert(null)}
        onGoHome={() => {
          setSceneAlert(null);
          router.push("/student/home");
        }}
        onQuit={() => {
          setSceneAlert(null);
          router.push(`/student/subjects?id=${topic.subjectId}`);
        }}
      />
    </div>
  );
}

// ===========================================================================
// Helpers
// ===========================================================================

function SceneAlertDialog({
  alert,
  onClose,
  onGoHome,
  onQuit,
}: {
  alert: SceneAlert | null;
  onClose: () => void;
  onGoHome: () => void;
  onQuit: () => void;
}) {
  if (alert?.type === "quit-confirm") {
    return (
      <StudentAlertDialog
        open
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
        tone="warning"
        label="Pause possible"
        title="Tu veux quitter ?"
        description="Ta progression est sauvegardée. Tu pourras reprendre plus tard."
        primaryLabel="Sauvegarder et quitter"
        onPrimary={onQuit}
        secondaryLabel="Continuer l'exercice"
        onSecondary={onClose}
      />
    );
  }

  if (alert?.type === "parent-notified") {
    return (
      <StudentAlertDialog
        open
        onOpenChange={(open) => {
          if (!open) onGoHome();
        }}
        tone="info"
        label="Message envoyé"
        title="Pio prévient ton parent"
        description="Ton parent va recevoir une notification pour t'aider à continuer."
        primaryLabel="Retour au camp"
        onPrimary={onGoHome}
      />
    );
  }

  if (alert?.type === "regen-error") {
    return (
      <StudentAlertDialog
        open
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
        tone="warning"
        label="Petit blocage"
        title="On réessaie dans un instant"
        description={alert.message}
        primaryLabel="J'ai compris"
        onPrimary={onClose}
      />
    );
  }

  if (alert?.type === "access-blocked") {
    return (
      <StudentAlertDialog
        open
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
        tone="info"
        label="Petit blocage"
        title="Message pour toi"
        description={kidMessages.accessNotOpen}
        primaryLabel="J'ai compris"
        onPrimary={onClose}
      />
    );
  }

  return null;
}

function LockedPalierScreen({
  currentPalier,
  previousPalier,
  message,
  onGoPrevious,
}: {
  currentPalier: number;
  previousPalier: number;
  message: string;
  onGoPrevious: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative w-full overflow-hidden rounded-3xl bg-gradient-to-br from-amber-300 via-orange-300 to-pink-400 p-1 shadow-2xl"
      >
        <div className="absolute left-8 top-8 h-8 w-8 rotate-12 rounded-lg bg-white/35" />
        <div className="absolute right-10 top-10 h-7 w-7 -rotate-12 rounded-md bg-sky-200/70" />
        <div className="absolute bottom-12 left-12 h-6 w-6 rotate-45 rounded-md bg-emerald-200/70" />

        <div className="relative rounded-[1.35rem] bg-white/92 px-5 py-7 text-center sm:px-8 sm:py-8">
          <div className="mx-auto mb-3 flex h-36 w-36 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-pink-100 shadow-inner">
            <Pio state="hello" size={122} />
          </div>

          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-orange-100 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-orange-700">
            <LockKeyhole className="h-3.5 w-3.5" aria-hidden />
            Palier {currentPalier} verrouillé
          </div>

          <h1 className="font-display text-3xl font-extrabold leading-tight text-slate-950 sm:text-4xl">
            Encore une marche avant !
          </h1>
          <p className="mx-auto mt-3 max-w-md text-base font-semibold text-slate-600">
            Pio garde ce palier au chaud. Termine d&apos;abord le palier{" "}
            {previousPalier}, puis la suite s&apos;ouvrira.
          </p>

          <div className="mx-auto mt-6 grid max-w-md grid-cols-3 gap-2">
            <StepBubble
              active
              icon={<CheckCircle2 className="h-5 w-5" aria-hidden />}
              label={`Palier ${previousPalier}`}
            />
            <StepBubble
              active={false}
              icon={<LockKeyhole className="h-5 w-5" aria-hidden />}
              label={`Palier ${currentPalier}`}
            />
            <StepBubble
              active={false}
              icon={<Sparkles className="h-5 w-5" aria-hidden />}
              label="Après"
            />
          </div>

          <p className="mx-auto mt-5 max-w-md rounded-2xl bg-slate-50 px-4 py-3 text-xs font-medium text-slate-500">
            {message}
          </p>

          <button
            type="button"
            onClick={onGoPrevious}
            className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-400 to-pink-500 px-6 py-3 text-base font-extrabold text-white shadow-lg transition-all hover:scale-[1.01] hover:shadow-xl sm:w-auto"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden />
            Reprendre le palier {previousPalier}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function StepBubble({
  active,
  icon,
  label,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div
      className={`flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border-2 px-2 py-3 ${
        active
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-50 text-slate-400"
      }`}
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm">
        {icon}
      </div>
      <p className="text-xs font-extrabold">{label}</p>
    </div>
  );
}

function CenteredCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-4 text-center">
      {children}
    </div>
  );
}

function ExerciseRenderer({
  exo,
  disabled,
  isCorrect,
  onSubmit,
  onSkip,
}: {
  exo: SanitizedExo;
  disabled: boolean;
  isCorrect: boolean | null;
  onSubmit: (answer: string) => void;
  onSkip?: () => void;
}) {
  // Existing components expect payloads with the answer fields; we pass the
  // sanitized payload as-is. They render UI without the answer, which is fine
  // because verification now happens server-side via mutation.
  switch (exo.type) {
    case "qcm":
      return (
        <QcmExercise
          prompt={exo.prompt}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          payload={exo.payload as any}
          disabled={disabled}
          isCorrect={isCorrect}
          onSubmit={onSubmit}
          onSkip={onSkip}
        />
      );
    case "short-answer":
      return (
        <ShortAnswerExercise
          prompt={exo.prompt}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          payload={exo.payload as any}
          disabled={disabled}
          isCorrect={isCorrect}
          onSubmit={onSubmit}
        />
      );
    case "match":
      return (
        <MatchExercise
          prompt={exo.prompt}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          payload={exo.payload as any}
          disabled={disabled}
          isCorrect={isCorrect}
          onSubmit={onSubmit}
          onSkip={onSkip}
        />
      );
    case "order":
      return (
        <OrderExercise
          prompt={exo.prompt}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          payload={exo.payload as any}
          disabled={disabled}
          isCorrect={isCorrect}
          onSubmit={onSubmit}
          onSkip={onSkip}
        />
      );
    case "drag-drop":
      return (
        <DragDropExercise
          prompt={exo.prompt}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          payload={exo.payload as any}
          disabled={disabled}
          isCorrect={isCorrect}
          onSubmit={onSubmit}
          onSkip={onSkip}
        />
      );
    default:
      return <p>Type d&apos;exercice non supporté</p>;
  }
}

export default function TopicSessionPage() {
  return (
    <Suspense fallback={null}>
      <TopicSessionPageInner />
    </Suspense>
  );
}
