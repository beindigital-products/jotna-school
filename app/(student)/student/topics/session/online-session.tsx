"use client";

/**
 * LA SÉANCE D'UN PALIER SUR LE WEB : chaque réponse, chaque indice et la fin
 * du palier partent au serveur, qui juge et range tout.
 *
 * Le web n'a pas de hors-ligne (`docs/hors-ligne.md`). Dans l'application, la
 * séance se joue sur l'appareil (`./offline-session.tsx`) ; `./page.tsx`
 * choisit.
 */

import {
  Suspense,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useQuery, useMutation, useAction, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useRouter, useSearchParams } from "next/navigation";
import { BookOpen } from "lucide-react";
import { LostTrail } from "@/components/student/game/lost-trail";

import { JotnaLoader } from "@/components/jotna-loader";
import { playCorrect, setSoundEnabledLocal } from "@/lib/sounds";
import { PalierResultScreen } from "@/components/student/game/palier-result";
import { effectivePalierCount } from "@/convex/palierRules";
import { CapRegenAlternatives } from "@/components/cap-regen-alternatives";
import { kidMessages } from "@/lib/kidCopy";
import { isAccessDenied } from "@/lib/accessCopy";
import { ExplainStepByStep } from "@/components/student/explain-step-by-step";
import { AnswerFeedback } from "@/components/student/game/answer-feedback";
import { ActionButton3D } from "@/components/student/game-kit";
import { SessionStage, starsEarned } from "@/components/student/game/session-stage";
import {
  ExerciseRenderer,
  LockedPalierScreen,
  SceneAlertDialog,
  SessionNotice,
  type SceneAlert,
  type StageExercise,
} from "@/components/student/game/session-screens";
import { ItemPicturesProvider } from "@/components/exercises/item-pictures";
import { PromptReaderProvider } from "@/components/exercises/prompt-reader";
import { isReadingLearnerClass } from "@/convex/curriculum";
import { isEnglishTopic, isTileVoiceClass } from "@/convex/voice/tiles";
import { isPictureTileClass } from "@/lib/item-pictures";
import { AnimatePresence } from "framer-motion";
import { refusalMessage } from "@/lib/refusalMessage";

type SanitizedExo = StageExercise & {
  _id: Id<"exercises">;
  palierAttemptId: Id<"palierAttempts">;
  isVariation: boolean;
};

type PalierResult = {
  status: "validated" | "failed";
  average: number;
  starsTotal: number;
  threshold: number;
  exerciseCount?: number;
  failedCount: number;
  canRegen: boolean;
  cumulativeRegens: number;
};

type AttemptProgress = {
  currentIndex: number;
  completedCount: number;
  totalCount: number;
  failedAttemptsThisExo: number;
  hintsUsedThisExo: number;
};

function TopicSessionPageInner() {
  const searchParams = useSearchParams();
  const topicId = searchParams.get("id") ?? "";
  const palierIndex = parseInt(searchParams.get("palier") ?? "1", 10);

  return <PalierSession key={`${topicId}-${palierIndex}`} topicId={topicId} palierIndex={palierIndex} />;
}

function PalierSession({ topicId, palierIndex }: { topicId: string; palierIndex: number }) {
  const router = useRouter();

  // Wait for Convex auth before querying profile (Decision 99 — anti race-condition)
  const { isLoading: authLoading, isAuthenticated } = useConvexAuth();
  const profile = useQuery(
    api.profiles.getCurrentProfile,
    isAuthenticated ? {} : "skip",
  );
  const topic = useQuery(api.topics.getById, {
    id: topicId as Id<"topics">,
  });

  const getBucket = useAction(api.paliers.index.getBucket);
  const startAttempt = useMutation(api.paliers.index.startPalierAttempt);
  const verifyAttempt = useMutation(api.palierAttempts.verifyAttempt);
  const requestHint = useMutation(api.palierAttempts.requestHint);
  const submitPalier = useMutation(api.palierAttempts.submitPalier);
  const regenerate = useAction(api.paliers.index.regenerateFailedExercises);
  // D22 — quick-mute support during session focus mode
  const soundPref = useQuery(api.students.getMySoundEnabled);
  const setSoundEnabled = useMutation(api.streak.setSoundEnabled);

  // Bootstrap state
  const [palierAttemptId, setPalierAttemptId] =
    useState<Id<"palierAttempts"> | null>(null);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const [bootstrapping, setBootstrapping] = useState(false);

  // Load exercises (only when palierAttemptId ready)
  const exercises = useQuery(
    api.paliers.index.getExercisesForPalier,
    palierAttemptId ? { palierAttemptId } : "skip",
  ) as SanitizedExo[] | null | undefined;
  const attemptProgress = useQuery(
    api.palierAttempts.getProgressForPalierAttempt,
    palierAttemptId ? { palierAttemptId } : "skip",
  ) as AttemptProgress | null | undefined;

  // Palier loop state
  const [localCurrentIndex, setLocalCurrentIndex] = useState(0);
  const [feedback, setFeedback] = useState<{
    correct: boolean;
    attemptsRemaining: number;
    spelling?: string;
  } | null>(null);
  const [hintShown, setHintShown] = useState<{
    text: string;
    index: number;
  } | null>(null);
  const [localHintsUsedThisExo, setLocalHintsUsedThisExo] = useState(0);
  const [localFailedAttemptsThisExo, setLocalFailedAttemptsThisExo] =
    useState(0);
  const [palierResult, setPalierResult] = useState<PalierResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [sceneAlert, setSceneAlert] = useState<SceneAlert | null>(null);
  const [localStateAttemptId, setLocalStateAttemptId] =
    useState<Id<"palierAttempts"> | null>(null);
  // Step-by-step explanation panel — opened when the kid taps
  // "Je veux comprendre" after exhausting all 5 attempts on an exercise.
  const [explainOpen, setExplainOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  // L'EN-TÊTE DE JEU : les étoiles gagnées depuis l'arrivée sur cette séance
  // (la grille du serveur, `starsEarned`) et les exercices passés sans
  // réussite (pierres ambre du sentier). Le serveur ne renvoie pas ces deux
  // comptes pendant la séance (`getProgressForPalierAttempt` ne dit que
  // l'exercice courant : son index, ses essais ratés, ses indices) : une
  // reprise repart donc de zéro à l'écran, la note finale, elle, vient du
  // serveur. La séance sur l'appareil, qui a le journal entier sous la main,
  // les relit, reprise comprise (`offline-session.tsx`) ; aligner le web
  // demande une requête serveur de plus, hors de cet atelier.
  const [starsSoFar, setStarsSoFar] = useState(0);
  const [missed, setMissed] = useState<number[]>([]);

  // Network status (Decision 90)
  useEffect(() => {
    const update = () => setIsOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  // D29 — sync local sound memo with server preference for play() short-circuit.
  useEffect(() => {
    if (soundPref?.soundEnabled !== undefined) {
      setSoundEnabledLocal(soundPref.soundEnabled);
    }
  }, [soundPref?.soundEnabled]);

  const handleToggleSound = useCallback(async () => {
    const next = !(soundPref?.soundEnabled ?? false);
    setSoundEnabledLocal(next);
    try {
      await setSoundEnabled({ enabled: next });
    } catch {
      // Mutation will queue offline; UI reflects optimistic state via memo.
    }
  }, [soundPref?.soundEnabled, setSoundEnabled]);

  // Bootstrap : getBucket → startAttempt
  useEffect(() => {
    if (!topic || palierAttemptId || bootstrapping || bootstrapError) return;
    (async () => {
      setBootstrapping(true);
      setBootstrapError(null);
      try {
        if (!topic.class) {
          setBootstrapError(
            "Cette thématique n'a pas encore de classe assignée.",
          );
          return;
        }
        const bucket = await getBucket({
          subjectId: topic.subjectId,
          class: topic.class as
            | "CI"
            | "CP"
            | "CE1"
            | "CE2"
            | "CM1"
            | "CM2",
          topicId: topicId as Id<"topics">,
          palierIndex,
        });
        const attemptId = await startAttempt({ palierId: bucket.palierId });
        setPalierAttemptId(attemptId);
      } catch (err: unknown) {
        // La rustine qui vivait ici — une expression régulière sur
        // « Uncaught Error: » pour désenvelopper le message — traitait le
        // symptôme. La cause est corrigée à la source : les refus que cet écran
        // affiche sont des `ConvexError`, et `refusalMessage` lit leur `data`.
        setBootstrapError(
          isAccessDenied(err)
            ? kidMessages.accessNotOpen
            : refusalMessage(err, "Erreur inconnue"),
        );
      } finally {
        setBootstrapping(false);
      }
    })();
  }, [
    topic,
    palierAttemptId,
    bootstrapping,
    bootstrapError,
    getBucket,
    startAttempt,
    topicId,
    palierIndex,
  ]);

  const shouldUseServerProgress =
    palierAttemptId !== null &&
    localStateAttemptId !== palierAttemptId &&
    attemptProgress !== null &&
    attemptProgress !== undefined;
  const currentIndex = shouldUseServerProgress
    ? attemptProgress.currentIndex
    : localCurrentIndex;
  const hintsUsedThisExo = shouldUseServerProgress
    ? attemptProgress.hintsUsedThisExo
    : localHintsUsedThisExo;
  const failedAttemptsThisExo = shouldUseServerProgress
    ? attemptProgress.failedAttemptsThisExo
    : localFailedAttemptsThisExo;

  const handleQuit = useCallback(() => {
    setSceneAlert({ type: "quit-confirm" });
  }, []);

  const nextExoRef = useRef<() => void>(() => {});
  // Le moment où l'exercice courant est apparu : le temps de réponse envoyé
  // au serveur en découle (trophées de rapidité, temps du carnet).
  const exoShownAtRef = useRef<number>(0);
  useEffect(() => {
    exoShownAtRef.current = Date.now();
  }, [currentIndex, exercises]);
  // Le minuteur de l'alerte de réponse : gardé pour qu'une réponse suivante
  // ne se fasse pas effacer par le minuteur de la précédente.
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    },
    [],
  );

  const handleRequestHint = useCallback(async () => {
    if (!exercises || !palierAttemptId) return;
    const exo = exercises[currentIndex];
    if (!exo) return;
    if (hintsUsedThisExo >= exo.hintsAvailable) return;
    try {
      const res = await requestHint({
        exerciseId: exo._id,
        palierAttemptId,
        hintIndex: hintsUsedThisExo,
      });
      // Même copie que dans `handleSubmitAnswer` : l'état local part de la
      // progression serveur, sinon un indice ramenait à la question 1.
      setLocalCurrentIndex(currentIndex);
      setLocalFailedAttemptsThisExo(failedAttemptsThisExo);
      setLocalStateAttemptId(palierAttemptId);
      setHintShown({ text: res.hint, index: res.hintIndex });
      setLocalHintsUsedThisExo(hintsUsedThisExo + 1);
    } catch (err) {
      if (isAccessDenied(err)) {
        setSceneAlert({ type: "access-blocked" });
      } else {
        console.error(err);
      }
    }
  }, [
    exercises,
    palierAttemptId,
    currentIndex,
    hintsUsedThisExo,
    failedAttemptsThisExo,
    requestHint,
  ]);

  const handleNextExo = useCallback(async () => {
    if (!exercises) return;
    exoShownAtRef.current = Date.now();
    if (palierAttemptId) setLocalStateAttemptId(palierAttemptId);
    // Passé sans réussite : la pierre du sentier reste ambre.
    if (feedback && !feedback.correct && feedback.attemptsRemaining === 0) {
      setMissed((list) => (list.includes(currentIndex) ? list : [...list, currentIndex]));
    }
    setFeedback(null);
    setHintShown(null);
    setLocalHintsUsedThisExo(0);
    setLocalFailedAttemptsThisExo(0);
    if (currentIndex < exercises.length - 1) {
      setLocalCurrentIndex(currentIndex + 1);
      return;
    }
    // End of palier — submit
    if (!palierAttemptId) return;
    setSubmitting(true);
    try {
      const res = await submitPalier({ palierAttemptId });
      setPalierResult(res as PalierResult);
    } catch (err) {
      if (isAccessDenied(err)) {
        setSceneAlert({ type: "access-blocked" });
      } else {
        console.error(err);
      }
    } finally {
      setSubmitting(false);
    }
  }, [exercises, currentIndex, palierAttemptId, submitPalier, feedback]);

  useEffect(() => {
    nextExoRef.current = handleNextExo;
  }, [handleNextExo]);

  const handleSubmitAnswer = useCallback(
    async (answer: string) => {
      if (!exercises || !palierAttemptId) return;
      const exo = exercises[currentIndex];
      if (!exo) return;
      try {
        const res = await verifyAttempt({
          exerciseId: exo._id,
          palierAttemptId,
          userAnswer: answer,
          timeSpentMs: exoShownAtRef.current > 0 ? Math.max(0, Date.now() - exoShownAtRef.current) : 0,
        });
        exoShownAtRef.current = Date.now();
        setFeedback({
          correct: res.isCorrect,
          attemptsRemaining: res.attemptsRemaining,
          spelling: res.spelling,
        });
        // REPRISE D'UNE SÉANCE : jusqu'ici, l'écran suivait la progression
        // serveur (question 3, deux indices...). Passer en état local sans
        // le recopier ramenait l'enfant à la question 1 dès sa première
        // réponse. On copie d'abord, on bascule ensuite.
        setLocalCurrentIndex(currentIndex);
        setLocalHintsUsedThisExo(hintsUsedThisExo);
        if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
        if (res.isCorrect) {
          setLocalStateAttemptId(palierAttemptId);
          setStarsSoFar((stars) => stars + starsEarned(failedAttemptsThisExo, hintsUsedThisExo));
          void playCorrect();
          // Le temps de voir la tuile gonfler et l'éclat partir, PUIS Pio
          // fêter dans la scène de réponse (elle arrive 650 ms après la
          // tuile, `answer-feedback.tsx`) : 2 450 ms, soit 1 800 ms de scène
          // comme avant. Plus long quand il faut lire la bonne graphie.
          feedbackTimer.current = setTimeout(() => nextExoRef.current(), res.spelling ? 5000 : 2450);
        } else {
          setLocalStateAttemptId(palierAttemptId);
          setLocalFailedAttemptsThisExo(failedAttemptsThisExo + 1);
          if (res.attemptsRemaining > 0) {
            // La tuile secoue la tête (450 ms), puis la scène reste 2 600 ms.
            feedbackTimer.current = setTimeout(() => setFeedback(null), 3050);
          }
        }
      } catch (err) {
        if (isAccessDenied(err)) {
          setSceneAlert({ type: "access-blocked" });
        } else {
          console.error(err);
        }
      }
    },
    [
      exercises,
      palierAttemptId,
      currentIndex,
      hintsUsedThisExo,
      failedAttemptsThisExo,
      verifyAttempt,
    ],
  );

  const handleRegen = useCallback(async () => {
    if (!palierAttemptId) return;
    setRegenerating(true);
    try {
      await regenerate({ palierAttemptId });
      setPalierResult(null);
      setLocalStateAttemptId(palierAttemptId);
      setLocalCurrentIndex(0);
      setFeedback(null);
      setHintShown(null);
      setLocalHintsUsedThisExo(0);
      setLocalFailedAttemptsThisExo(0);
      setStarsSoFar(0);
      setMissed([]);
    } catch (err) {
      if (isAccessDenied(err)) {
        setSceneAlert({ type: "access-blocked" });
      } else {
        setSceneAlert({
          type: "regen-error",
          message: refusalMessage(err, "Erreur"),
        });
      }
    } finally {
      setRegenerating(false);
    }
  }, [palierAttemptId, regenerate]);

  // ==== RENDER ====

  // Loading states — wait for auth resolution AND queries
  if (authLoading || (isAuthenticated && profile === undefined) || topic === undefined) {
    return <JotnaLoader className="min-h-[70dvh]" />;
  }
  if (!isAuthenticated || profile === null) {
    return (
      <SessionNotice pio="hello" title="Non connecté" body="Connecte-toi pour faire les exercices.">
        <ActionButton3D href="/login" size="md">
          Se connecter
        </ActionButton3D>
      </SessionNotice>
    );
  }
  if (!topic) {
    return <LostTrail kind="topic" />;
  }

  if (bootstrapError) {
    const isPalierLocked = bootstrapError.includes("valider le palier");
    if (isPalierLocked && palierIndex > 1) {
      return (
        <LockedPalierScreen
          currentPalier={palierIndex}
          previousPalier={palierIndex - 1}
          message={bootstrapError}
          onGoPrevious={() =>
            router.replace(
              `/student/topics/session?id=${topicId}&palier=${palierIndex - 1}`,
            )
          }
        />
      );
    }

    return (
      <SessionNotice pio="think" body={bootstrapError}>
        <ActionButton3D tone="white" size="md" onClick={() => router.back()}>
          Retour
        </ActionButton3D>
      </SessionNotice>
    );
  }

  if (
    !palierAttemptId ||
    exercises === undefined ||
    attemptProgress === undefined
  ) {
    return <JotnaLoader className="min-h-[70dvh]" />;
  }
  if (exercises === null || exercises.length === 0) {
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
  if (palierResult) {
    const palierCount = effectivePalierCount(topic);
    const trailHref = topic.subjectId
      ? `/student/subjects?id=${topic.subjectId}`
      : "/student/map";
    return (
      <>
        <PalierResultScreen
          result={{
            status: palierResult.status,
            starsTotal: palierResult.starsTotal,
            exerciseCount: palierResult.exerciseCount ?? exercises.length,
            thresholdTenths: palierResult.threshold,
            canRegen: palierResult.canRegen,
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
              onSeeCorrected={() =>
                router.push(`/student/topics/session?id=${topicId}&palier=${palierIndex}&review=1`)
              }
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
  const exo = exercises[currentIndex];
  const totalExos = exercises.length;
  const disabled = feedback !== null;
  // LE LECTEUR DE CONSIGNES : un enfant qui apprend à lire (CI, CP) entend la
  // consigne de chaque exercice (`components/exercises/prompt-reader.tsx`).
  // La classe est celle de l'enfant ; à défaut, celle de la thématique.
  // LES IMAGES DE TUILE se règlent sur la MÊME classe : un enfant de CI, qui ne
  // lit pas encore « Lion » ni « midi », voit l'image de chaque chose nommée
  // (`components/exercises/item-pictures.tsx`, `lib/item-pictures.ts`). Rien ne
  // change dans la donnée : le texte des tuiles et la réponse envoyée restent
  // ceux du serveur.
  const learnerClass = profile?.class ?? topic.class;
  const readsAloud = isReadingLearnerClass(learnerClass);
  const showsPictures = isPictureTileClass(learnerClass);
  // LA VOIX DES TUILES : un enfant de CI entend aussi les propositions, et la
  // proposition qu'il touche (`convex/voice/tiles.ts`). Pas en anglais : un mot
  // anglais lu par la voix française serait faux. Le serveur refuse de toute façon.
  const speaksTiles = isTileVoiceClass(learnerClass) && !isEnglishTopic({ programmeKey: topic.programmeKey });
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
      {/* LA COQUE DE JEU (`components/student/game/session-stage.tsx`) : la
          savane, l'en-tête de niveau (sentier, cœurs, étoiles, son, sortie),
          Pio et sa bulle, la carte posée. LA CLÉ DE LA CARTE EST L'EXERCICE,
          PAS LA RÉPONSE : avec la réponse dans la clé, chaque « Bravo » ou
          « Pas tout à fait » remontait toute la carte, l'exercice clignotait
          et le choix de l'enfant s'effaçait. La réaction se joue dedans. */}
      <SessionStage
        topicName={topic.name ?? "Palier"}
        palierIndex={palierIndex}
        questionIndex={currentIndex}
        total={totalExos}
        missed={missed}
        failedAttempts={failedAttemptsThisExo}
        stars={starsSoFar}
        outcome={feedback}
        isVariation={exo?.isVariation === true}
        // D22 — le son se coupe d'un toucher ; le bouton n'existe que si
        // l'enfant a déjà décidé pour les sons (`soundPref` non nul).
        sound={soundPref ? { enabled: soundPref.soundEnabled, onToggle: handleToggleSound } : null}
        onQuit={handleQuit}
        networkLost={!isOnline}
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
                busy={submitting}
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
            s'ouvre par-dessus. Le fournisseur d'images est posé pour toutes
            les classes, `enabled` faux hors CI : ni DOM ni état de plus, et la
            forme de l'arbre ne dépend pas de la classe. */}
        <ItemPicturesProvider enabled={showsPictures}>
          {readsAloud ? (
            <PromptReaderProvider
              exerciseId={exo._id}
              silenced={feedback !== null || explainOpen || sceneAlert !== null}
              tileVoice={speaksTiles}
            >
              {exerciseRenderer}
            </PromptReaderProvider>
          ) : (
            exerciseRenderer
          )}
        </ItemPicturesProvider>
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
          if (topic?.subjectId) {
            router.push(`/student/subjects?id=${topic.subjectId}`);
          } else {
            router.push("/student/home");
          }
        }}
      />
    </>
  );
}

export function OnlineSession() {
  return (
    <Suspense fallback={null}>
      <TopicSessionPageInner />
    </Suspense>
  );
}
