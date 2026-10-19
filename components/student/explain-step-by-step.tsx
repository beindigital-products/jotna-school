"use client";

import { useEffect, useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Lightbulb, Loader2, X } from "lucide-react";
import { Pio } from "@/components/student/pio";
import { useOffline } from "@/components/offline/context";
import { kidMessages } from "@/lib/kidCopy";

type Explanation = {
  intro: string;
  steps: string[];
  conclusion: string;
};

type Status =
  | { kind: "loading" }
  | { kind: "ready"; explanation: Explanation; cached: boolean }
  | { kind: "error"; kidMessage: string };

/**
 * Step-by-step pedagogical explanation panel. Shown when a kid taps
 * "Je veux comprendre" after exhausting all 5 attempts on an exercise.
 *
 * Lifecycle:
 *   - an explanation already on the device (in the offline pack, or asked
 *     before) → shown at once, without network;
 *   - otherwise, online → call api.explainMistake.explainExercise, and keep
 *     the answer on the device for next time;
 *   - otherwise, offline → the right answer and the hints, which the device
 *     has (`fallback`): the AI can't be asked without network;
 *   - loading → Pio "thinking" + spinner
 *   - ready → intro + numbered steps + conclusion + "J'ai compris"
 *   - error → kid-friendly message + "Tant pis" CTA
 */
export function ExplainStepByStep({
  exerciseId,
  open,
  onClose,
  fallback,
}: {
  exerciseId: string;
  open: boolean;
  onClose: () => void;
  /** Ce que l'appareil sait de l'exercice, pour expliquer sans réseau. */
  fallback?: { correctAnswer: string | null; hints: readonly string[] };
}) {
  const [status, setStatus] = useState<Status>({ kind: "loading" });
  const explainExercise = useAction(api.explainMistake.explainExercise);
  const { engine, connected } = useOffline();
  const stored = engine?.explanationFor(exerciseId) ?? null;
  const offline = !stored && !connected;

  // Lazy initializer pattern keeps the loading reset out of the effect body
  // (`react-hooks/set-state-in-effect` lint). Parent should pass a stable
  // `key={exerciseId}` so the component fully remounts when the kid moves on.
  useEffect(() => {
    if (!open || stored || offline) return;
    let cancelled = false;

    explainExercise({ exerciseId: exerciseId as Id<"exercises"> })
      .then((res) => {
        if (cancelled) return;
        if (res.ok) {
          engine?.saveExplanation(exerciseId, res.explanation);
          setStatus({
            kind: "ready",
            explanation: res.explanation,
            cached: res.cached,
          });
        } else {
          setStatus({ kind: "error", kidMessage: res.kidMessage });
        }
      })
      .catch(() => {
        if (cancelled) return;
        setStatus({
          kind: "error",
          kidMessage: "Une connexion lente, peut-être ? Réessaie dans un instant.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [open, exerciseId, explainExercise, stored, offline, engine]);

  // SANS RÉSEAU NI EXPLICATION GARDÉE : les indices, puis la bonne réponse.
  const offlineExplanation: Explanation | null =
    offline && fallback && (fallback.hints.length > 0 || fallback.correctAnswer)
      ? {
          intro: kidMessages.offline.explainOffline,
          steps: [...fallback.hints],
          conclusion: fallback.correctAnswer
            ? `La bonne réponse : ${fallback.correctAnswer}`
            : "Demande à un adulte de regarder avec toi.",
        }
      : null;
  const shown: Status = stored
    ? { kind: "ready", explanation: stored, cached: true }
    : offline
      ? offlineExplanation
        ? { kind: "ready", explanation: offlineExplanation, cached: true }
        : { kind: "error", kidMessage: kidMessages.offline.explainOffline }
      : status;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="explain-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          role="dialog"
          aria-label="Explication pas à pas"
        >
          <motion.div
            initial={{ y: 40, scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 30, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>

            <div className="overflow-y-auto px-5 pb-5 pt-6 sm:px-6 sm:pt-7">
              {shown.kind === "loading" && (
                <div className="flex flex-col items-center gap-4 py-8 text-center">
                  <Pio state="hello" size={88} />
                  <div className="flex items-center gap-2 text-base font-semibold text-slate-700">
                    <Loader2
                      className="h-4 w-4 animate-spin text-orange-500"
                      aria-hidden
                    />
                    Pio prépare l&apos;explication…
                  </div>
                  <p className="max-w-xs text-sm text-slate-500">
                    Ça prend quelques secondes.
                  </p>
                </div>
              )}

              {shown.kind === "error" && (
                <div className="flex flex-col items-center gap-4 py-6 text-center">
                  <Pio state="sad" size={88} />
                  <p className="text-base font-semibold text-slate-700">
                    {shown.kidMessage}
                  </p>
                  <button
                    type="button"
                    onClick={onClose}
                    className="mt-2 inline-flex min-h-12 items-center justify-center rounded-2xl bg-slate-200 px-6 py-3 text-base font-bold text-slate-700 hover:bg-slate-300"
                  >
                    Tant pis, je passe
                  </button>
                </div>
              )}

              {shown.kind === "ready" && (
                <ExplanationContent
                  explanation={shown.explanation}
                  onClose={onClose}
                />
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ExplanationContent({
  explanation,
  onClose,
}: {
  explanation: Explanation;
  onClose: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center gap-3 text-center">
        <Pio state="hello" size={72} />
        <div className="flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-700">
          <Lightbulb className="h-3.5 w-3.5" aria-hidden />
          Pas à pas
        </div>
      </div>

      <p className="text-center font-display text-base font-semibold text-slate-800">
        {explanation.intro}
      </p>

      <ol className="space-y-3">
        {explanation.steps.map((step, idx) => (
          <motion.li
            key={idx}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.08, duration: 0.25 }}
            className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-pink-500 font-display text-sm font-extrabold text-white shadow">
              {idx + 1}
            </span>
            <p className="flex-1 self-center text-sm leading-snug text-slate-700">
              {step}
            </p>
          </motion.li>
        ))}
      </ol>

      <div className="rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 p-3 text-center">
        <p className="text-sm font-semibold text-amber-800">
          {explanation.conclusion}
        </p>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-400 to-pink-500 px-6 py-3 text-base font-bold text-white shadow-lg transition-all hover:scale-[1.01]"
      >
        <CheckCircle2 className="h-5 w-5" aria-hidden />
        J&apos;ai compris !
      </button>
    </div>
  );
}
