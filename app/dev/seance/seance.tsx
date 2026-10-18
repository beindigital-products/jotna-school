"use client";

import { Suspense, useCallback, useEffect, useMemo, useReducer, useRef, type ComponentProps } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence } from "framer-motion";

import { CapRegenAlternatives } from "@/components/cap-regen-alternatives";
import DragDropExercise from "@/components/exercises/DragDropExercise";
import GameExercise, { isGameScreenType } from "@/components/exercises/GameExercise";
import MatchExercise from "@/components/exercises/MatchExercise";
import OrderExercise from "@/components/exercises/OrderExercise";
import QcmExercise from "@/components/exercises/QcmExercise";
import ShortAnswerExercise from "@/components/exercises/ShortAnswerExercise";
import { PromptReaderProvider } from "@/components/exercises/prompt-reader";
import { AnswerFeedback } from "@/components/student/game/answer-feedback";
import { PalierResultScreen } from "@/components/student/game/palier-result";
import { SessionStage } from "@/components/student/game/session-stage";
import { verifyAnswer } from "@/convex/paliers/exerciseRules";
import { playCorrect } from "@/lib/sounds";
import { DevBar, DevButton, DevSelect, DevToggle, SessionShell } from "../session-shell";
import { buildSpecimens, isKind, KIND_LABELS, KINDS, type Kind, type Specimen } from "../exercices/specimens";

/**
 * LA SÉANCE FACTICE — la coque d'un palier avec des données inventées, pour
 * photographier et retoucher ce qui ENTOURE l'exercice : la vraie coque de
 * jeu de la séance (`SessionStage` : savane, en-tête de niveau, Pio, carte
 * posée), « Valider », la scène de réponse (`AnswerFeedback`) et l'écran de
 * fin (`PalierResultScreen`). Ce que montre `/dev/seance/` est ce que
 * montrent `online-session.tsx` et `offline-session.tsx`, au composant près.
 *
 * ELLE SE JOUE. Trois exercices de la galerie (`../exercices/specimens.ts`)
 * font un palier de poche : la réponse est jugée par la règle du serveur
 * (`verifyAnswer`), cinq essais comme en séance, la scène de Pio se montre
 * et s'efface aux mêmes temps que dans `online-session.tsx`, et la fin du
 * palier s'affiche avec un compte d'étoiles plausible. Rien ne part au
 * serveur ; rien n'est enregistré.
 *
 * ET ELLE SE FIGE, pour les captures : `?scene=` ouvre directement une scène,
 * sans minuteur.
 *   exercice (défaut) · bonne · mauvaise · plus-d-essai · fin-validee · fin-manquee
 *   &rm=1 mouvement réduit simulé · &barre=0 sans la barre de commande
 *   &exo=<type>  ouvre le palier sur CE type de la galerie (`KINDS` :
 *                qcm4, match, order, drag-drop, short-answer, pattern…) : c'est
 *                ainsi que `scripts/shoot-exercises.mjs --seance-types` mesure,
 *                pour chaque écran, si le premier écran tient avec le grand Pio.
 *   &voix=1      UNE VOIX QUI JOUE VRAIMENT : le lecteur de consignes reçoit un
 *                son local (`/sounds/badge.mp3`, 1,5 s) à la place de la
 *                consigne, et se comporte comme en séance (lecture automatique à
 *                l'arrivée de la carte, silence dès la réponse). Sans elle, le
 *                lecteur est muet (`silenced`) : les spécimens n'ont pas
 *                d'identifiant Convex. C'est ainsi qu'on vérifie, dans le
 *                webview iOS, que Pio montre son affiche pendant la voix et
 *                reprend son clip après (`session-stage.tsx`).
 *   &son=1       sur un écran de fin, un son part 2,5 s après l'arrivée, sous le
 *                clip « cheer » de Pio : la sonde (`&sonde=1`) dit si la vidéo
 *                le remarque, le film si sa couche s'éteint.
 */
const SCENES = ["exercice", "bonne", "mauvaise", "plus-d-essai", "fin-validee", "fin-manquee"] as const;
type Scene = (typeof SCENES)[number];

const SCENE_LABELS: Record<Scene, string> = {
  exercice: "Exercice (jouable)",
  bonne: "Bonne réponse",
  mauvaise: "Mauvaise réponse",
  "plus-d-essai": "Plus d'essai",
  "fin-validee": "Fin : palier validé",
  "fin-manquee": "Fin : palier manqué",
};

const TOPIC = "Les nombres jusqu'à 10";
const PALIER = 2;
const PALIER_COUNT = 3;
const MAX_ATTEMPTS = 5;
const STARS_PER_EXERCISE = 3;

function isScene(value: string | null): value is Scene {
  return (SCENES as readonly string[]).includes(value ?? "");
}

type Feedback = { correct: boolean; attemptsRemaining: number };

type State = {
  index: number;
  failed: number;
  stars: number;
  feedback: Feedback | null;
  done: boolean;
};

type Action = { type: "answered"; correct: boolean } | { type: "dismiss" } | { type: "next"; total: number } | { type: "reset" };

const INITIAL: State = { index: 0, failed: 0, stars: 0, feedback: null, done: false };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "answered": {
      const failed = action.correct ? state.failed : state.failed + 1;
      return {
        ...state,
        failed,
        feedback: { correct: action.correct, attemptsRemaining: Math.max(0, MAX_ATTEMPTS - failed) },
      };
    }
    case "dismiss":
      return { ...state, feedback: null };
    case "next": {
      // Trois étoiles sans faute, puis une de moins par essai raté, une au moins si c'est juste.
      const earned = state.feedback?.correct ? Math.max(1, STARS_PER_EXERCISE - state.failed) : 0;
      const stars = state.stars + earned;
      if (state.index >= action.total - 1) return { ...state, stars, feedback: null, done: true };
      return { index: state.index + 1, failed: 0, stars, feedback: null, done: false };
    }
    case "reset":
      return INITIAL;
  }
}

export function FakeSession() {
  return (
    <Suspense fallback={null}>
      <FakeSessionInner />
    </Suspense>
  );
}

function FakeSessionInner() {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const sceneParam = search.get("scene");
  const scene: Scene = isScene(sceneParam) ? sceneParam : "exercice";
  const reduced = search.get("rm") === "1";
  const bar = search.get("barre") !== "0";
  const exoParam = search.get("exo");
  const exo0: Kind = isKind(exoParam) ? exoParam : "qcm4";
  const voice = search.get("voix") === "1";

  const update = useCallback(
    (patch: { scene?: Scene; rm?: boolean; barre?: boolean; exo?: Kind }) => {
      const next = new URLSearchParams();
      const nextScene = patch.scene ?? scene;
      if (nextScene !== "exercice") next.set("scene", nextScene);
      if (patch.rm ?? reduced) next.set("rm", "1");
      if (!(patch.barre ?? bar)) next.set("barre", "0");
      const nextExo = patch.exo ?? exo0;
      if (nextExo !== "qcm4") next.set("exo", nextExo);
      const text = next.toString();
      router.replace(`${pathname}${text ? `?${text}` : ""}`, { scroll: false });
    },
    [router, pathname, scene, reduced, bar, exo0],
  );

  // Le palier de poche : un QCM, une association, une frise ; `?exo=` met un
  // autre type de la galerie en première question.
  const exercises = useMemo(() => {
    const all = buildSpecimens();
    const rest = [all.qcm4, all.match, all.pattern].filter((s) => s.kind !== exo0);
    return [all[exo0], ...rest].slice(0, 3);
  }, [exo0]);

  const [state, dispatch] = useReducer(reducer, INITIAL);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const frozen = scene !== "exercice";
  const total = exercises.length;
  const exo = exercises[Math.min(state.index, total - 1)];

  const submit = (answer: string) => {
    if (frozen) return;
    const correct = verifyAnswer(exo.exercise, answer);
    dispatch({ type: "answered", correct });
    if (timer.current) clearTimeout(timer.current);
    if (correct) {
      void playCorrect();
      // Le temps de voir la tuile, puis Pio fêter dans la scène de réponse,
      // qui arrive 650 ms après la tuile (`online-session.tsx`).
      timer.current = setTimeout(() => dispatch({ type: "next", total }), 2450);
    } else if (state.failed + 1 < MAX_ATTEMPTS) {
      timer.current = setTimeout(() => dispatch({ type: "dismiss" }), 3050);
    }
  };

  const devBar = bar && (
    <DevBar title="Séance factice">
      <DevSelect label="Scène" value={scene} onChange={(next) => update({ scene: next })} options={SCENES.map((value) => ({ value, label: SCENE_LABELS[value] }))} />
      <DevSelect
        label="Premier exercice"
        value={exo0}
        onChange={(next) => {
          dispatch({ type: "reset" });
          update({ exo: next });
        }}
        options={KINDS.map((value) => ({ value, label: KIND_LABELS[value] }))}
      />
      <DevToggle label="Mouvement réduit" checked={reduced} onChange={(rm) => update({ rm })} />
      <DevToggle label="Barre" checked={bar} onChange={(barre) => update({ barre })} />
      <DevButton onClick={() => dispatch({ type: "reset" })}>Recommencer</DevButton>
      <Link href="/dev/exercices/" className="min-h-9 rounded-md px-2 py-1.5 text-sm font-semibold text-amber-300 underline-offset-2 hover:underline">
        Galerie
      </Link>
    </DevBar>
  );

  // L'écran de fin : forcé par la scène, ou gagné en jouant.
  const ending: "validated" | "failed" | null =
    scene === "fin-validee" ? "validated" : scene === "fin-manquee" ? "failed" : state.done ? (state.stars >= Math.ceil(0.7 * total * STARS_PER_EXERCISE) ? "validated" : "failed") : null;

  // `&son=1` : un son part 2,5 s après l'écran de fin, PENDANT que le clip
  // « cheer » de Pio joue (la vraie fin n'en joue un que pour un trophée). C'est
  // la seule page où un son part sous un clip monté : avec `&sonde=1`, la
  // console dit si la vidéo le remarque (`[video] pause`…) et le film, si sa
  // couche s'éteint (`docs/pio-animations.md`, « L'affiche sous le clip »).
  const soundUnderClip = search.get("son") === "1";
  useEffect(() => {
    if (!soundUnderClip || !ending) return;
    const audio = new Audio("/sounds/badge.mp3");
    const stamp = () => (performance.now() / 1000).toFixed(3);
    const timer = setTimeout(() => {
      audio.play().then(
        () => console.log(`[son] joue t=${stamp()}`),
        (error: unknown) => console.log(`[son] refusé t=${stamp()} ${String(error)}`),
      );
    }, 2500);
    return () => {
      clearTimeout(timer);
      audio.pause();
    };
  }, [soundUnderClip, ending]);

  if (ending) {
    const exerciseCount = frozen ? 10 : total;
    const starsTotal = frozen ? (ending === "validated" ? 26 : 14) : state.stars;
    return (
      <SessionShell reduced={reduced}>
        {devBar}
        <PalierResultScreen
          result={{ status: ending, starsTotal, exerciseCount, thresholdTenths: 7, canRegen: ending === "failed" }}
          topicName={TOPIC}
          palierIndex={PALIER}
          palierCount={PALIER_COUNT}
          nextPalierHref={ending === "validated" ? "/dev/seance/" : null}
          trailHref="/dev/exercices/"
          regenerating={false}
          onRegen={() => {
            dispatch({ type: "reset" });
            update({ scene: "exercice" });
          }}
          capAlternatives={<CapRegenAlternatives onSeeCorrected={() => {}} previousPalierHref={null} onAskParent={() => {}} />}
        />
      </SessionShell>
    );
  }

  // La scène de réponse : celle du jeu, ou celle qu'on demande de figer.
  const feedback: Feedback | null = frozen
    ? scene === "bonne"
      ? { correct: true, attemptsRemaining: 4 }
      : scene === "mauvaise"
        ? { correct: false, attemptsRemaining: 3 }
        : { correct: false, attemptsRemaining: 0 }
    : state.feedback;
  const disabled = feedback !== null;
  const isLast = state.index >= total - 1;

  return (
    <SessionShell reduced={reduced}>
      {devBar}
      <SessionStage
        topicName={TOPIC}
        palierIndex={PALIER}
        questionIndex={state.index}
        total={total}
        failedAttempts={state.failed}
        stars={state.stars}
        outcome={feedback}
        sound={{ enabled: true, onToggle: () => {} }}
        onQuit={() => {}}
        exerciseKey={exo.exercise.id}
        overlay={
          <AnimatePresence>
            {feedback && (
              <AnswerFeedback
                key={`${exo.exercise.id}-${state.failed}-${feedback.correct ? "ok" : "ko"}-${scene}`}
                outcome={feedback}
                seed={state.index * 10 + state.failed}
                isLast={isLast}
                busy={false}
                onNext={() => dispatch({ type: "next", total })}
                onExplain={() => {}}
                onDismiss={() => {
                  if (frozen) return;
                  if (timer.current) clearTimeout(timer.current);
                  dispatch({ type: "dismiss" });
                }}
              />
            )}
          </AnimatePresence>
        }
      >
        {/* Muet par défaut (les spécimens n'ont pas de son) ; `?voix=1` joue un
            son local avec les silences de la vraie séance (`online-session.tsx`). */}
        <PromptReaderProvider
          exerciseId={exo.exercise.id}
          silenced={voice ? feedback !== null : true}
          clipUrl={voice ? "/sounds/badge.mp3" : undefined}
        >
          <Screen specimen={exo} disabled={disabled} isCorrect={feedback?.correct ?? null} onSubmit={submit} />
        </PromptReaderProvider>
      </SessionStage>
    </SessionShell>
  );
}

/** Les types de la galerie, par les composants de la séance (l'aiguillage d'`online-session.tsx`). */
function Screen({
  specimen,
  disabled,
  isCorrect,
  onSubmit,
}: {
  specimen: Specimen;
  disabled: boolean;
  isCorrect: boolean | null;
  onSubmit: (answer: string) => void;
}) {
  const { exercise, view } = specimen;
  const common = { prompt: exercise.prompt, disabled, isCorrect, onSubmit };
  switch (exercise.type) {
    case "qcm":
      return <QcmExercise {...common} payload={view as ComponentProps<typeof QcmExercise>["payload"]} />;
    case "match":
      return <MatchExercise {...common} payload={view as ComponentProps<typeof MatchExercise>["payload"]} />;
    case "order":
      return <OrderExercise {...common} payload={view as ComponentProps<typeof OrderExercise>["payload"]} />;
    case "drag-drop":
      return <DragDropExercise {...common} payload={view as ComponentProps<typeof DragDropExercise>["payload"]} />;
    case "short-answer":
      return <ShortAnswerExercise {...common} payload={view as ComponentProps<typeof ShortAnswerExercise>["payload"]} />;
    default:
      if (isGameScreenType(exercise.type)) {
        return <GameExercise {...common} type={exercise.type} payload={view} />;
      }
      return <p>Type d&apos;exercice non supporté</p>;
  }
}
