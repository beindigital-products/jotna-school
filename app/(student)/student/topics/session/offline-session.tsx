"use client";

/**
 * LA SÉANCE D'UN PALIER — DIX EXERCICES, JOUÉS SUR L'APPAREIL.
 *
 * Dans l'application seulement (`./page.tsx`) : sur le web, la séance se joue
 * en ligne (`./online-session.tsx`).
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

import {
  Suspense,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useAction, useConvex } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useRouter, useSearchParams } from "next/navigation";
import { BookOpen, WifiOff } from "lucide-react";
import { LostTrail } from "@/components/student/game/lost-trail";

import { JotnaLoader } from "@/components/jotna-loader";
import { playCorrect, setSoundEnabledLocal } from "@/lib/sounds";
import { PalierResultScreen } from "@/components/student/game/palier-result";
import { effectivePalierCount } from "@/convex/palierRules";
import {
  attemptsRemainingAfter,
  MAX_ATTEMPTS_PER_EXERCISE,
  scoreExerciseFromAttempts,
  scoreToStarsSingle,
} from "@/convex/paliers/scoring";
import {
  correctAnswerText,
  sanitizePayload,
  spellingNote,
  verifyAnswer,
} from "@/convex/paliers/exerciseRules";
import { CapRegenAlternatives } from "@/components/cap-regen-alternatives";
import { kidMessages } from "@/lib/kidCopy";
import { isAccessDenied } from "@/lib/accessCopy";
import { ExplainStepByStep } from "@/components/student/explain-step-by-step";
import { AnswerFeedback } from "@/components/student/game/answer-feedback";
import { ActionButton3D } from "@/components/student/game-kit";
import { SessionStage } from "@/components/student/game/session-stage";
import {
  ExerciseRenderer,
  LockedPalierScreen,
  SceneAlertDialog,
  SessionNotice,
  type SceneAlert,
  type StageExercise,
} from "@/components/student/game/session-screens";
import { PromptReaderProvider } from "@/components/exercises/prompt-reader";
import { isReadingLearnerClass, type VisibleClassName } from "@/convex/curriculum";
import { AnimatePresence } from "framer-motion";
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

type SanitizedExo = StageExercise;

/** Le journal d'une séance qui n'a pas encore commencé. */
const NO_LOG: readonly LocalLogEntry[] = [];

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
    spelling?: string;
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
  // L'EN-TÊTE DE JEU se relit dans le journal, reprise comprise : les étoiles
  // déjà gagnées (la grille du serveur, exercice par exercice) et les
  // exercices passés sans réussite (pierres ambre du sentier).
  const starsSoFar = fullExercises.reduce((acc, ex) => {
    const rows = rowsForExercise(log, ex._id);
    if (!rows.some((r) => r.isCorrect)) return acc;
    return acc + scoreToStarsSingle(scoreExerciseFromAttempts(rows).score);
  }, 0);
  const missed = fullExercises.flatMap((ex, i) => {
    const real = rowsForExercise(log, ex._id).filter((r) => r.attemptNumber > 0);
    return real.length >= MAX_ATTEMPTS_PER_EXERCISE && !real.some((r) => r.isCorrect) ? [i] : [];
  });
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
      const spelling = correct ? (spellingNote(full, answer) ?? undefined) : undefined;
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
      setFeedback({ correct, attemptsRemaining, spelling });
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
      if (correct) {
        void playCorrect();
        // Le temps de voir la tuile gonfler et l'éclat partir, PUIS Pio fêter
        // dans la scène de réponse (elle arrive 650 ms après la tuile,
        // `answer-feedback.tsx`) : 2 450 ms, soit 1 800 ms de scène comme
        // avant. Plus long quand il faut lire la bonne graphie.
        feedbackTimer.current = setTimeout(() => nextExoRef.current(), spelling ? 5000 : 2450);
      } else if (attemptsRemaining > 0) {
        // La tuile secoue la tête (450 ms), puis la scène reste 2 600 ms.
        feedbackTimer.current = setTimeout(() => setFeedback(null), 3050);
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
      <SessionNotice pio="hello" title="Non connecté" body="Connecte-toi pour faire les exercices.">
        <ActionButton3D href="/login" size="md">
          Se connecter
        </ActionButton3D>
      </SessionNotice>
    );
  }
  if (!topic) {
    return model.hasContent ? (
      <LostTrail kind="topic" />
    ) : (
      <SessionNotice pio="think" body={kidMessages.offline.packEmpty}>
        <WifiOff className="mx-auto h-10 w-10 text-sky-500" aria-hidden />
        <ActionButton3D tone="white" size="md" onClick={() => router.back()}>
          Retour
        </ActionButton3D>
      </SessionNotice>
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
        <SessionNotice pio="think" body={generationError}>
          <ActionButton3D tone="white" size="md" onClick={() => router.back()}>
            Retour
          </ActionButton3D>
        </SessionNotice>
      );
    }
    if (canFetch) return <JotnaLoader className="min-h-[70dvh]" />;
    return (
      <SessionNotice
        pio="think"
        title={kidMessages.offline.palierNotReadyTitle}
        body={kidMessages.offline.palierNotReadyBody}
      >
        <ActionButton3D size="md" onClick={() => router.push(`/student/subjects?id=${topic.subjectId}`)}>
          Retour au sentier
        </ActionButton3D>
      </SessionNotice>
    );
  }

  if (exercises.length === 0) {
    return (
      <SessionNotice pio="think" title="Aucun exercice disponible">
        <BookOpen className="mx-auto h-10 w-10 text-amber-300" aria-hidden />
        <ActionButton3D size="md" onClick={() => router.back()}>
          Retour
        </ActionButton3D>
      </SessionNotice>
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

  // Les indices sont progressifs : le premier après 1 essai raté, le
  // deuxième après 2, le troisième après 4. Rien pendant la réaction.
  const hintCap = failedAttemptsThisExo >= 4 ? 3 : failedAttemptsThisExo >= 2 ? 2 : 1;
  const canAskHint =
    !feedback &&
    failedAttemptsThisExo > 0 &&
    exo.hintsAvailable > 0 &&
    hintsUsedThisExo < exo.hintsAvailable &&
    hintsUsedThisExo < hintCap;

  return (
    <>
      {/* LA COQUE DE JEU (`components/student/game/session-stage.tsx`), la
          même que la séance en ligne : la savane, l'en-tête de niveau
          (sentier, cœurs, étoiles, son, sortie), Pio et sa bulle, la carte
          posée. LA CLÉ DE LA CARTE EST L'EXERCICE, PAS LA RÉPONSE : avec la
          réponse dans la clé, chaque « Bravo » ou « Pas tout à fait »
          remontait toute la carte et le choix de l'enfant s'effaçait. */}
      <SessionStage
        topicName={topic.name ?? "Palier"}
        palierIndex={palierIndex}
        questionIndex={currentIndex}
        total={totalExos}
        missed={missed}
        failedAttempts={failedAttemptsThisExo}
        stars={starsSoFar}
        outcome={feedback}
        isVariation={fullExo?.isVariation === true}
        // D22 — le son se coupe d'un toucher ; le bouton n'existe que si
        // l'enfant a déjà décidé pour les sons (`soundPref` non nul).
        sound={soundPref ? { enabled: soundPref.soundEnabled, onToggle: handleToggleSound } : null}
        onQuit={handleQuit}
        exerciseKey={exo._id}
        hint={{ canAsk: canAskHint, onAsk: handleRequestHint, shown: feedback ? null : hintShown }}
        overlay={
          /* La réaction du jeu, en alerte au milieu de l'écran (portée dans
             le body). Bonne réponse : on passe seul à la suite. Mauvaise avec
             des essais : s'efface seule ou d'un toucher. Plus d'essai :
             reste, avec les deux boutons de suite. PENDANT L'EXPLICATION,
             L'ALERTE S'EFFACE : posée au-dessus de tout (portail, z-50), elle
             couvrait le panneau « Je veux comprendre » (z-40). Elle revient
             quand le panneau se ferme, avec ses boutons de suite. */
          <AnimatePresence>
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
        }
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
      </SessionStage>

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
    </>
  );
}

export function OfflineSession() {
  return (
    <Suspense fallback={null}>
      <TopicSessionPageInner />
    </Suspense>
  );
}
