"use client";

import { useEffect, useMemo, useReducer, useRef, type ComponentProps } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Lightbulb, RotateCcw } from "lucide-react";

import DragDropExercise from "@/components/exercises/DragDropExercise";
import GameExercise, { isGameScreenType } from "@/components/exercises/GameExercise";
import MatchExercise from "@/components/exercises/MatchExercise";
import OrderExercise from "@/components/exercises/OrderExercise";
import QcmExercise from "@/components/exercises/QcmExercise";
import ShortAnswerExercise from "@/components/exercises/ShortAnswerExercise";
import { correctAnswerText, verifyAnswer } from "@/convex/paliers/exerciseRules";
import { pickLine, pioSays } from "@/lib/pioCopy";
import type { PlayableExercise } from "./demo-types";
import { viewOf } from "./playable";

/**
 * LE LECTEUR DE LA DÉMONSTRATION — un exercice de l'élève, joué sur la
 * vitrine, sans compte.
 *
 * C'EST L'ÉCRAN DE L'ÉLÈVE, pas une imitation : les composants de
 * `components/exercises` sont ceux de la séance (`online-session.tsx`,
 * `offline-session.tsx`), le payload leur arrive dans la même vue sans la
 * réponse (`sanitizePayload`, mélangé de la même façon) et la réponse est
 * jugée par la règle même du serveur et de l'appareil (`verifyAnswer`). Un
 * parent qui répond « faux » ici aurait eu « faux » dans l'application.
 *
 * CE QUI DIFFÈRE, PARCE QUE LA VITRINE N'EST PAS UNE SÉANCE :
 * - rien n'est enregistré, rien n'est envoyé : aucun réseau, aucun compte ;
 * - trois essais au lieu de cinq, puis la bonne réponse, au lieu d'une
 *   explication pas à pas qui demande le serveur ;
 * - la réaction de Pio est une bande sous l'exercice, pas une alerte plein
 *   écran qui couvrirait la page ;
 * - Pio est une petite image, pas un clip vidéo : la vitrine ne télécharge
 *   pas un mégaoctet pour fêter une réponse.
 *
 * LES INDICES SUIVENT LA RÈGLE DE LA SÉANCE : le premier s'ouvre après un
 * essai raté, le deuxième après deux, le troisième après quatre.
 */

const MAX_ATTEMPTS = 3;

/** Le temps pendant lequel « Pas tout à fait » reste affiché, avant de rendre la main. */
const WRONG_DISMISS_MS = 2600;

type Verdict = { correct: boolean; attemptsLeft: number };

type State = {
  attempts: number;
  verdict: Verdict | null;
  hintsShown: number;
  /** Change à « Réessayer » : l'écran de l'exercice repart de zéro. */
  round: number;
};

type Action =
  | { type: "answered"; correct: boolean }
  | { type: "dismiss" }
  | { type: "hint" }
  | { type: "retry" };

const INITIAL: State = { attempts: 0, verdict: null, hintsShown: 0, round: 0 };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "answered": {
      const attempts = state.attempts + 1;
      return {
        ...state,
        attempts,
        verdict: { correct: action.correct, attemptsLeft: Math.max(0, MAX_ATTEMPTS - attempts) },
      };
    }
    case "dismiss":
      return { ...state, verdict: null };
    case "hint":
      return { ...state, hintsShown: state.hintsShown + 1 };
    case "retry":
      return { ...INITIAL, round: state.round + 1 };
  }
}

/** Les indices qu'on a le droit d'ouvrir après `failed` essais ratés : 1, 2, puis 3. */
function hintsAllowed(failed: number): number {
  return failed >= 4 ? 3 : failed >= 2 ? 2 : failed >= 1 ? 1 : 0;
}

const SCENE = {
  right: {
    pose: "cheer",
    frame: "border-lime-300 bg-gradient-to-b from-lime-100 via-green-100 to-green-200",
    title: "text-green-950",
    sub: "text-green-900/80",
  },
  wrong: {
    pose: "encourage",
    frame: "border-amber-300 bg-gradient-to-b from-amber-50 via-amber-100 to-orange-200",
    title: "text-orange-950",
    sub: "text-orange-900/80",
  },
  out: {
    pose: "sad",
    frame: "border-sky-200 bg-gradient-to-b from-sky-50 via-white to-sky-100",
    title: "text-sky-950",
    sub: "text-sky-900/80",
  },
} as const;

export default function DemoPlayer({
  exercise,
  onAnother,
}: {
  exercise: PlayableExercise;
  /** « Un autre exemple » : absent quand la banque n'a qu'un exemple de ce type. */
  onAnother?: () => void;
}) {
  const [state, dispatch] = useReducer(reducer, INITIAL);
  const { verdict, attempts, hintsShown, round } = state;
  const reducedMotion = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);

  // La vue de l'élève : sans la réponse, mélangée comme la séance le fait.
  const view = useMemo(() => viewOf(exercise), [exercise]);

  // Un essai juste est le dernier : les essais ratés sont tous les autres.
  const failedAttempts = verdict?.correct ? attempts - 1 : attempts;
  const outOfAttempts = verdict !== null && !verdict.correct && verdict.attemptsLeft === 0;
  const done = verdict?.correct === true;
  const canHint =
    !verdict && failedAttempts > 0 && hintsShown < Math.min(hintsAllowed(failedAttempts), exercise.hints.length);

  // Un essai raté qui laisse des essais : l'alerte s'en va seule et rend la main.
  useEffect(() => {
    if (!verdict || verdict.correct || verdict.attemptsLeft === 0) return;
    const timer = setTimeout(() => dispatch({ type: "dismiss" }), WRONG_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [verdict]);

  // Des confettis pour une bonne réponse, partis de la carte (pas plein écran).
  useEffect(() => {
    if (!done || reducedMotion) return;
    let cancelled = false;
    const rect = cardRef.current?.getBoundingClientRect();
    import("canvas-confetti").then((mod) => {
      if (cancelled) return;
      mod.default({
        particleCount: 70,
        spread: 80,
        startVelocity: 32,
        gravity: 1.1,
        ticks: 150,
        zIndex: 40,
        origin: rect
          ? {
              x: (rect.left + rect.width / 2) / window.innerWidth,
              y: Math.min(0.9, (rect.top + rect.height * 0.35) / window.innerHeight),
            }
          : { x: 0.5, y: 0.5 },
        colors: ["#f97316", "#fbbf24", "#6ab04c", "#38bdf8", "#ec4899"],
      });
    });
    return () => {
      cancelled = true;
    };
  }, [done, reducedMotion]);

  const submit = (answer: string) => {
    dispatch({ type: "answered", correct: verifyAnswer(exercise, answer) });
  };

  const screen = (
    <ExerciseScreen
      key={round}
      exercise={exercise}
      view={view}
      disabled={verdict !== null}
      isCorrect={verdict ? verdict.correct : null}
      onSubmit={submit}
    />
  );

  const kind = done ? "right" : outOfAttempts ? "out" : "wrong";
  const answerText = outOfAttempts ? correctAnswerText(exercise) : null;
  const explanation =
    outOfAttempts && typeof exercise.payload.explanation === "string" ? exercise.payload.explanation : null;
  const seed = exercise.id.length + attempts;

  return (
    <div ref={cardRef} className="space-y-3">
      {/* La carte de l'exercice, comme dans la séance (`rounded-3xl bg-white`). */}
      <div className="rounded-3xl bg-white p-2.5 shadow-md ring-1 ring-amber-100 sm:p-5">{screen}</div>

      {canHint && (
        <button
          type="button"
          onClick={() => dispatch({ type: "hint" })}
          className="inline-flex items-center gap-2 rounded-xl bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-800 transition-colors hover:bg-amber-200"
        >
          <Lightbulb className="h-4 w-4" aria-hidden />
          Voir un indice
        </button>
      )}

      {hintsShown > 0 && (
        <ul className="space-y-2">
          {exercise.hints.slice(0, hintsShown).map((hint, index) => (
            <motion.li
              key={index}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
            >
              <span className="font-semibold">Indice {index + 1} :</span> {hint}
            </motion.li>
          ))}
        </ul>
      )}

      <AnimatePresence>
        {verdict && (
          <motion.div
            key={`${attempts}-${kind}`}
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ type: "spring", stiffness: 340, damping: 24 }}
            className={`flex items-center gap-3 rounded-2xl border-4 p-3 ${SCENE[kind].frame}`}
          >
            {/* Une petite image de Pio : le clip vidéo pèse plus d'un mégaoctet. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/images/pio/mini/${SCENE[kind].pose}.webp`}
              alt=""
              width={52}
              height={70}
              draggable={false}
              className="h-[70px] w-[52px] flex-none object-contain"
            />
            <div className="min-w-0">
              <p className={`font-display text-xl font-extrabold leading-tight ${SCENE[kind].title}`}>
                {kind === "right"
                  ? pickLine(pioSays.answerRight, seed)
                  : kind === "wrong"
                    ? pickLine(pioSays.answerWrong, seed)
                    : "Voici la bonne réponse"}
              </p>
              <p className={`mt-0.5 text-sm font-bold ${SCENE[kind].sub}`}>
                {kind === "right"
                  ? pickLine(pioSays.answerRightSub, seed + 1)
                  : kind === "wrong"
                    ? `${pickLine(pioSays.answerWrongSub, seed + 1)} ${pioSays.attemptsLeft(verdict.attemptsLeft)}.`
                    : (answerText ?? "Regarde bien le modèle, puis réessaie.")}
              </p>
              {explanation && <p className="mt-1 text-sm text-sky-900/80">{explanation}</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {(attempts > 0 || onAnother) && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          {attempts > 0 ? (
            <button
              type="button"
              onClick={() => dispatch({ type: "retry" })}
              className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50"
            >
              <RotateCcw className="size-4" aria-hidden />
              Réessayer
            </button>
          ) : (
            <span />
          )}
          {onAnother && (
            <button
              type="button"
              onClick={onAnother}
              className="inline-flex items-center gap-1.5 rounded-full bg-gray-900 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
            >
              Un autre exemple
              <ArrowRight className="size-4" aria-hidden />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/** L'aiguillage de la séance : les cinq types d'origine, puis la phrase à trous et les jeux. */
function ExerciseScreen({
  exercise,
  view,
  disabled,
  isCorrect,
  onSubmit,
}: {
  exercise: PlayableExercise;
  view: unknown;
  disabled: boolean;
  isCorrect: boolean | null;
  onSubmit: (answer: string) => void;
}) {
  const common = { prompt: exercise.prompt, disabled, isCorrect, onSubmit };
  switch (exercise.type) {
    case "qcm":
      return <QcmExercise {...common} payload={view as ComponentProps<typeof QcmExercise>["payload"]} />;
    case "short-answer":
      return (
        <ShortAnswerExercise
          {...common}
          payload={view as ComponentProps<typeof ShortAnswerExercise>["payload"]}
        />
      );
    case "match":
      return <MatchExercise {...common} payload={view as ComponentProps<typeof MatchExercise>["payload"]} />;
    case "order":
      return <OrderExercise {...common} payload={view as ComponentProps<typeof OrderExercise>["payload"]} />;
    case "drag-drop":
      return (
        <DragDropExercise {...common} payload={view as ComponentProps<typeof DragDropExercise>["payload"]} />
      );
    default:
      if (isGameScreenType(exercise.type)) {
        return <GameExercise {...common} type={exercise.type} payload={view} />;
      }
      return <p>Type d&apos;exercice non supporté</p>;
  }
}
