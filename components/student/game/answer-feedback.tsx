"use client";

import { motion } from "framer-motion";
import { Lightbulb } from "lucide-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Pio, type PioState } from "@/components/student/pio";
import { kidMessages } from "@/lib/kidCopy";
import { pickLine, pioSays } from "@/lib/pioCopy";

/**
 * CE QUI SE PASSE QUAND ON RÉPOND — une alerte de jeu au milieu de l'écran,
 * pas un message de formulaire en bas de la carte.
 *
 * Trois issues, trois scènes. Bonne réponse : Pio fête, des étoiles
 * jaillissent, des confettis tombent, le téléphone vibre une fois ; l'alerte
 * s'en va seule et la question suivante arrive. Mauvaise réponse avec des
 * essais : Pio encourage, l'alerte arrive en tremblant, on dit combien
 * d'essais restent ; elle s'en va seule, ou d'un toucher. Plus d'essai : Pio
 * réconforte, et les deux boutons de suite (comprendre, passer) sont dedans.
 *
 * PORTÉE DANS `document.body` (`createPortal`). La carte d'exercice est une
 * `motion.div` transformée pendant son entrée : un `position: fixed` posé
 * dedans se serait calé sur la carte, pas sur l'écran. La racine reste une
 * `motion.div` pour que `AnimatePresence`, dans la séance, anime la sortie.
 *
 * LES PHRASES CHANGENT. `seed` vient de l'exercice et de l'essai en cours :
 * même exercice, même essai, même phrase (pas de tirage pendant le rendu),
 * mais l'enfant n'entend pas « Bravo ! » dix fois de suite.
 */
export type AnswerOutcome = { correct: boolean; attemptsRemaining: number };

type Kind = "right" | "wrong" | "out";

const SCENE: Record<
  Kind,
  { pose: PioState; frame: string; title: string; sub: string; glow: string }
> = {
  right: {
    pose: "cheer",
    frame: "border-lime-300 bg-gradient-to-b from-lime-100 via-green-100 to-green-200",
    title: "text-green-950",
    sub: "text-green-900/80",
    glow: "shadow-[0_0_0_10px_rgba(190,242,100,0.35),0_30px_60px_-20px_rgba(0,0,0,0.5)]",
  },
  wrong: {
    pose: "encourage",
    frame: "border-amber-300 bg-gradient-to-b from-amber-50 via-amber-100 to-orange-200",
    title: "text-orange-950",
    sub: "text-orange-900/80",
    glow: "shadow-[0_0_0_10px_rgba(253,186,116,0.35),0_30px_60px_-20px_rgba(0,0,0,0.5)]",
  },
  out: {
    pose: "sad",
    frame: "border-sky-200 bg-gradient-to-b from-sky-50 via-white to-sky-100",
    title: "text-sky-950",
    sub: "text-sky-900/80",
    glow: "shadow-[0_0_0_10px_rgba(186,230,253,0.4),0_30px_60px_-20px_rgba(0,0,0,0.5)]",
  },
};

const CONFETTI_COLORS = ["#f97316", "#fbbf24", "#6ab04c", "#38bdf8", "#ec4899"];

export function AnswerFeedback({
  outcome,
  seed,
  isLast,
  busy,
  onNext,
  onExplain,
  onDismiss,
}: {
  outcome: AnswerOutcome;
  /** Change avec l'exercice et l'essai : choisit la phrase sans hasard au rendu. */
  seed: number;
  isLast: boolean;
  busy: boolean;
  onNext: () => void;
  onExplain: () => void;
  /** Mauvaise réponse avec des essais : l'enfant ferme l'alerte d'un toucher. */
  onDismiss: () => void;
}) {
  const kind: Kind = outcome.correct
    ? "right"
    : outcome.attemptsRemaining > 0
      ? "wrong"
      : "out";
  const scene = SCENE[kind];

  const title =
    kind === "right"
      ? pickLine(pioSays.answerRight, seed)
      : kind === "wrong"
        ? pickLine(pioSays.answerWrong, seed)
        : pioSays.answerOut;
  const sub =
    kind === "right"
      ? pickLine(pioSays.answerRightSub, seed + 1)
      : kind === "wrong"
        ? pickLine(pioSays.answerWrongSub, seed + 1)
        : pioSays.answerOutSub;

  // Le corps du téléphone et les confettis : des effets, pas du rendu.
  useEffect(() => {
    if (typeof navigator !== "undefined") {
      navigator.vibrate?.(kind === "right" ? [12, 40, 12] : kind === "wrong" ? [40, 40, 40] : 60);
    }
    if (kind !== "right") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let cancelled = false;
    import("canvas-confetti").then((mod) => {
      if (cancelled) return;
      mod.default({
        particleCount: 90,
        spread: 90,
        startVelocity: 40,
        gravity: 1.1,
        ticks: 180,
        zIndex: 60,
        origin: { x: 0.5, y: 0.5 },
        colors: CONFETTI_COLORS,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [kind]);

  const dismissible = kind === "wrong";

  const overlay = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-amber-950/45 p-6 backdrop-blur-[2px]"
      onClick={dismissible ? onDismiss : undefined}
    >
      <motion.div
        role={kind === "out" ? "alertdialog" : "status"}
        aria-live="assertive"
        aria-modal={kind === "out" ? true : undefined}
        initial={{ opacity: 0, scale: 0.5, y: 40 }}
        animate={
          kind === "wrong"
            ? { opacity: 1, scale: 1, y: 0, rotate: [0, -4, 4, -3, 3, 0] }
            : { opacity: 1, scale: 1, y: 0 }
        }
        exit={{ opacity: 0, scale: 0.85, y: 20 }}
        transition={{
          type: "spring",
          stiffness: 340,
          damping: 22,
          rotate: { duration: 0.5, delay: 0.15, ease: "easeInOut" },
        }}
        onClick={(e) => e.stopPropagation()}
        className={`relative w-[min(92vw,24rem)] overflow-visible rounded-[2rem] border-4 px-5 pb-5 pt-4 text-center ${scene.frame} ${scene.glow}`}
      >
        {kind === "right" && <StarBurst />}

        <div className="relative -mt-16 mb-1 flex justify-center">
          <motion.div
            initial={{ scale: 0.7, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 16, delay: 0.05 }}
          >
            <Pio state={scene.pose} size={150} className="drop-shadow-[0_12px_14px_rgba(60,30,0,0.35)]" />
          </motion.div>
        </div>

        <p className={`font-display text-3xl font-extrabold leading-tight ${scene.title}`}>{title}</p>
        <p className={`mt-1 font-display text-lg font-bold ${scene.sub}`}>{sub}</p>

        {kind === "wrong" && (
          <>
            <span className="mt-3 inline-block rounded-full border-2 border-white bg-white/85 px-4 py-1.5 font-display text-base font-extrabold text-orange-900 shadow-sm">
              {pioSays.attemptsLeft(outcome.attemptsRemaining)}
            </span>
            <p className="mt-3 font-display text-xs font-bold text-orange-900/60">Touche pour réessayer</p>
          </>
        )}

        {kind === "out" && (
          <div className="mt-4 space-y-2.5">
            <button
              type="button"
              onClick={onExplain}
              disabled={busy}
              className="btn-chunky flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 border-white bg-gradient-to-b from-amber-50 to-amber-200 px-6 py-3 font-display text-base font-extrabold text-amber-900 disabled:opacity-60"
              style={{ "--btn-depth": "#c9a35a" } as React.CSSProperties}
            >
              <Lightbulb className="h-5 w-5" aria-hidden />
              Je veux comprendre
            </button>
            <button
              type="button"
              onClick={onNext}
              disabled={busy}
              className="btn-chunky flex min-h-14 w-full items-center justify-center rounded-2xl border-2 border-white bg-gradient-to-b from-amber-400 to-orange-500 px-6 py-3 font-display text-lg font-extrabold text-white disabled:opacity-60"
              style={{ "--btn-depth": "#b45309" } as React.CSSProperties}
            >
              {isLast ? (busy ? "..." : "Voir mon résultat") : kidMessages.cta.next}
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(overlay, document.body);
}

/** Huit étoiles qui partent du centre de l'alerte et s'éteignent. */
function StarBurst() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-visible">
      {Array.from({ length: 8 }, (_, i) => (
        <span
          key={i}
          className="absolute left-1/2 top-1/3 -ml-3 -mt-3 text-3xl animate-[star-burst_0.9s_ease-out_forwards]"
          style={{ "--angle": `${i * 45}deg`, animationDelay: `${(i % 4) * 40}ms` } as React.CSSProperties}
        >
          ⭐
        </span>
      ))}
    </div>
  );
}
