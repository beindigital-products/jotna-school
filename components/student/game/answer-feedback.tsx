"use client";

import { motion } from "framer-motion";
import { Heart, Lightbulb } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ActionButton3D, useGameFeel, useMotionWillChange } from "@/components/student/game-kit";
import { Pio, type PioState } from "@/components/student/pio";
import { MAX_ATTEMPTS_PER_EXERCISE } from "@/convex/paliers/scoring";
import { kidMessages } from "@/lib/kidCopy";
import { pickLine, pioSays } from "@/lib/pioCopy";

/**
 * CE QUI SE PASSE QUAND ON RÉPOND — une alerte de jeu au milieu de l'écran,
 * pas un message de formulaire en bas de la carte.
 *
 * Trois issues, trois scènes. Bonne réponse : Pio fête pendant que la
 * récompense de l'écran d'exercice jaillit de la carte, sous la scène
 * (`Reward` : anneau, étoiles d'or en roue, pièces qui tournent, confettis
 * plafonnés par le niveau de l'appareil ; un seul éclat par réponse), le
 * téléphone vibre une fois ; l'alerte s'en va seule et la question suivante
 * arrive. Mauvaise réponse avec des essais : Pio
 * encourage, la scène arrive et dit non d'un petit mouvement (cinq
 * millimètres, pas une gifle), les cœurs montrent ce qui reste ; elle s'en
 * va seule, ou d'un toucher. Plus d'essai : Pio réconforte, et les deux
 * boutons de suite (comprendre, passer) sont dedans, épais comme le reste
 * du jeu. Rien de rouge : à six ans, l'erreur est une étape.
 *
 * LA SCÈNE EST POSÉE : bordure de 4 px, un flanc de 8 px dans la teinte de
 * l'issue, le halo de la DA et une ombre courte sur la table (un flou de
 * 22 px : à 60 px, l'ombre d'une carte de 384 px se peignait en 180 px de
 * flou à l'échelle 3 du téléphone, au moment même où la scène arrive) ; Pio
 * y est L'AFFICHE LÉGÈRE de sa pose (`animated={false} lite`), pas le clip :
 * monter un `<video>` HEVC alpha dans l'image du verdict, pendant que la
 * tuile gonfle et que l'éclat part, gelait le WKWebView du simulateur
 * iPhone 17 plusieurs centaines de millisecondes ; une image WebP de 40 Ko
 * se pose sans qu'on la sente. Son ombre au sol est peinte (une ellipse),
 * pas un `drop-shadow`. Le voile derrière n'a plus de `backdrop-filter` : un
 * flou sous une entrée en fondu coûte 100 ms par image sur le WKWebView.
 *
 * PORTÉE DANS `document.body` (`createPortal`). La carte d'exercice est une
 * `motion.div` transformée pendant son entrée : un `position: fixed` posé
 * dedans se serait calé sur la carte, pas sur l'écran. La racine reste une
 * `motion.div` pour que `AnimatePresence`, dans la séance, anime la sortie.
 *
 * ELLE ARRIVE APRÈS LA TUILE, PAS AVEC ELLE (`REVEAL_MS`). Au verdict, la
 * grammaire de la réponse se joue dans la carte : la tuile juste gonfle en
 * vert et l'éclat part (anneau, étoiles, pièces), la tuile fausse passe à
 * l'ambre et secoue la tête. La scène arrivait dans la même image, avec son
 * voile sombre : les étoiles et les pièces sortaient grisées, et la tuile
 * fausse était cachée sous l'alerte puis remise au repos quand l'alerte
 * s'effaçait, sans que l'enfant ait vu laquelle était fausse (relu le
 * 18 octobre 2026, captures à 200 et 250 ms). La scène attend donc 650 ms sur
 * une bonne réponse (le gonflement dure 450 ms, l'anneau 600) et 450 ms sur
 * une erreur (la secousse) ; la vibration, elle, part tout de suite, avec la
 * tuile. Rien n'est monté avant : pas de voile à opacité nulle dans l'image du
 * verdict, celle où le WKWebView gelait déjà (`Reward`). Les séances tiennent
 * compte de ce retard dans le temps qu'elles laissent à la scène
 * (`online-session.tsx`, `offline-session.tsx`). Sous `prefers-reduced-motion`,
 * ni gonflement ni secousse : pas d'attente.
 *
 * LES PHRASES CHANGENT. `seed` vient de l'exercice et de l'essai en cours :
 * même exercice, même essai, même phrase (pas de tirage pendant le rendu),
 * mais l'enfant n'entend pas « Bravo ! » dix fois de suite.
 *
 * UNE RÉPONSE JUSTE MAL ÉCRITE reste un bravo : la scène est la même, avec en
 * plus « Attention, tu as mal écrit » et la bonne graphie. L'enfant apprend à
 * écrire, on ne lui retire pas sa réponse pour une lettre.
 */
export type AnswerOutcome = {
  correct: boolean;
  attemptsRemaining: number;
  /** Réponse validée mais mal écrite : la bonne graphie, montrée à l'enfant. */
  spelling?: string;
};

type Kind = "right" | "wrong" | "out";

/** L'issue d'une réponse, pour la scène et pour la coque. */
export function outcomeKind(outcome: AnswerOutcome): Kind {
  if (outcome.correct) return "right";
  return outcome.attemptsRemaining > 0 ? "wrong" : "out";
}

/**
 * Le temps laissé à la tuile avant que la scène arrive : le gonflement de la
 * tuile juste et le départ de l'éclat (`gk-pop` 450 ms, `gk-ring` 600 ms), la
 * secousse de la tuile fausse (`gk-shake-soft` 450 ms).
 */
export const REVEAL_MS: Record<Kind, number> = { right: 650, wrong: 450, out: 450 };

/** Le retard de la scène pour une issue, en millisecondes ; 0 sous `prefers-reduced-motion`. */
export function revealDelayMs(outcome: AnswerOutcome, reducedMotion: boolean): number {
  return reducedMotion ? 0 : REVEAL_MS[outcomeKind(outcome)];
}

const SCENE: Record<
  Kind,
  { pose: PioState; frame: string; flank: string; title: string; sub: string; glow: string }
> = {
  right: {
    pose: "cheer",
    frame: "border-lime-300 bg-gradient-to-b from-lime-100 via-green-100 to-green-200",
    flank: "#16a34a",
    title: "text-green-950",
    sub: "text-green-900/80",
    glow: "rgba(190,242,100,0.35)",
  },
  wrong: {
    pose: "encourage",
    frame: "border-amber-300 bg-gradient-to-b from-amber-50 via-amber-100 to-orange-200",
    flank: "#ea580c",
    title: "text-orange-950",
    sub: "text-orange-900/80",
    glow: "rgba(253,186,116,0.35)",
  },
  out: {
    pose: "sad",
    frame: "border-sky-200 bg-gradient-to-b from-sky-50 via-white to-sky-100",
    flank: "#38bdf8",
    title: "text-sky-950",
    sub: "text-sky-900/80",
    glow: "rgba(186,230,253,0.4)",
  },
};

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
  const feel = useGameFeel();
  const kind = outcomeKind(outcome);
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

  // Le corps du téléphone, une fois par réponse (`Reward` ne vibre pas), tout
  // de suite : avec la tuile, pas avec la scène.
  const vibrate = feel.vibrate;
  useEffect(() => {
    vibrate(kind === "right" ? "correct" : kind === "wrong" ? "wrong" : "out");
  }, [kind, vibrate]);

  // La scène n'est montée qu'une fois la tuile jouée (voir l'en-tête).
  const delay = revealDelayMs(outcome, feel.reducedMotion);
  const [revealed, setRevealed] = useState(delay === 0);
  useEffect(() => {
    if (delay === 0) return;
    const timer = setTimeout(() => setRevealed(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const dismissible = kind === "wrong";
  const springs = feel.budget.springs;

  // Trois couches le temps du mouvement, pas une image de plus (voile, scène,
  // Pio) : sans elles, le ressort repeignait la scène entière, ombres et
  // affiche comprises, à chaque image, et le WebView Android rastérisait sans
  // relâche pendant toute l'entrée (`use-motion-will-change.ts`).
  const veil = useMotionWillChange("opacity");
  const card = useMotionWillChange();
  const mascot = useMotionWillChange();

  const overlay = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      style={{ willChange: veil.willChange }}
      onAnimationStart={veil.onAnimationStart}
      onAnimationComplete={veil.onAnimationComplete}
      className="fixed inset-0 z-50 flex items-center justify-center bg-amber-950/50 p-6"
      onClick={dismissible ? onDismiss : undefined}
      data-answer-feedback={kind}
    >
      <motion.div
        role={kind === "out" ? "alertdialog" : "status"}
        aria-live="assertive"
        aria-modal={kind === "out" ? true : undefined}
        initial={{ opacity: 0, scale: 0.6, y: 40 }}
        animate={
          kind === "wrong" && springs
            ? { opacity: 1, scale: 1, y: 0, x: [0, -5, 5, -3, 3, 0], rotate: [0, -0.6, 0.6, -0.4, 0] }
            : { opacity: 1, scale: 1, y: 0 }
        }
        exit={{ opacity: 0, scale: 0.85, y: 20 }}
        transition={{
          type: "spring",
          stiffness: 340,
          damping: 22,
          x: { duration: 0.45, delay: 0.18, ease: "easeInOut" },
          rotate: { duration: 0.45, delay: 0.18, ease: "easeInOut" },
        }}
        onAnimationStart={card.onAnimationStart}
        onAnimationComplete={card.onAnimationComplete}
        onClick={(e) => e.stopPropagation()}
        className={`relative w-[min(92vw,24rem)] overflow-visible rounded-[2rem] border-4 px-5 pb-5 pt-4 text-center ${scene.frame}`}
        style={{
          willChange: card.willChange,
          boxShadow: `0 8px 0 0 ${scene.flank}, 0 0 0 10px ${scene.glow}, 0 14px 22px -12px rgba(0,0,0,0.5)`,
        }}
      >
        {/* PAS D'ÉCLAT ICI : « un seul tir par réponse »
            (`docs/direction-jeu-exercices.md`, budgets). L'écran d'exercice
            tire le sien dans la carte au moment du verdict : ses confettis
            passent au-dessus du voile, ses étoiles se voient à travers. Un
            second éclat dans la scène ajoutait neuf couches et une toile de
            confettis dans l'image même où la scène arrive, celle où le
            WKWebView gelait déjà (mesuré sur le simulateur iPhone 17). */}

        {/* Pio, au-dessus de la scène, son ombre peinte sur le bord. */}
        <div className="relative -mt-16 mb-1 flex justify-center">
          <span
            aria-hidden
            className="pointer-events-none absolute bottom-1 left-1/2 h-4 w-28 -translate-x-1/2 rounded-[100%] bg-[radial-gradient(ellipse,rgba(60,30,0,0.35)_0%,rgba(60,30,0,0)_70%)]"
          />
          <motion.div
            initial={{ scale: 0.7, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 16, delay: 0.05 }}
            style={{ willChange: mascot.willChange }}
            onAnimationStart={mascot.onAnimationStart}
            onAnimationComplete={mascot.onAnimationComplete}
          >
            <Pio state={scene.pose} size={150} animated={false} lite />
          </motion.div>
        </div>

        <p className={`relative font-display text-3xl font-extrabold leading-tight ${scene.title}`}>{title}</p>
        <p className={`relative mt-1 font-display text-lg font-bold ${scene.sub}`}>{sub}</p>

        {kind === "right" && outcome.spelling && (
          <p className="relative mt-3 rounded-2xl border-2 border-white bg-white/85 px-4 py-2 font-display text-base font-extrabold text-green-950 shadow-[0_3px_0_#d6c39a]">
            Attention, tu as mal écrit.
            <span className="mt-0.5 block text-xl">
              On écrit&nbsp;: <span className="text-orange-600">{outcome.spelling}</span>
            </span>
          </p>
        )}

        {kind === "wrong" && (
          <>
            <AttemptHearts left={outcome.attemptsRemaining} />
            <span className="relative mt-2 inline-block rounded-full border-2 border-white bg-white/85 px-4 py-1.5 font-display text-base font-extrabold text-orange-900 shadow-[0_3px_0_#d6c39a]">
              {pioSays.attemptsLeft(outcome.attemptsRemaining)}
            </span>
            <p className="relative mt-3 font-display text-xs font-bold text-orange-900/60">Touche pour réessayer</p>
          </>
        )}

        {kind === "out" && (
          <div className="relative mt-5 space-y-3">
            <ActionButton3D
              tone="white"
              size="md"
              onClick={onExplain}
              disabled={busy}
              icon={<Lightbulb className="h-5 w-5 text-amber-500" aria-hidden />}
            >
              Je veux comprendre
            </ActionButton3D>
            <ActionButton3D onClick={onNext} busy={busy} size="lg">
              {isLast ? "Voir mon résultat" : kidMessages.cta.next}
            </ActionButton3D>
          </div>
        )}
      </motion.div>
    </motion.div>
  );

  if (typeof document === "undefined" || !revealed) return null;
  return createPortal(overlay, document.body);
}

/**
 * Les essais qui restent, en cœurs : les mêmes que dans l'en-tête de la
 * séance, pleins ou vidés. Un enfant de six ans les lit sans lire le chiffre
 * (la pastille en dessous le dit en toutes lettres).
 */
function AttemptHearts({ left }: { left: number }) {
  return (
    <div aria-hidden className="relative mt-3 flex items-center justify-center gap-1" data-attempt-hearts>
      {Array.from({ length: MAX_ATTEMPTS_PER_EXERCISE }, (_, i) => {
        const alive = i < left;
        return (
          <Heart
            key={i}
            data-alive={alive}
            className={`h-6 w-6 ${
              alive
                ? "fill-[#fb7185] text-[#e11d48] drop-shadow-[0_1px_0_rgb(0_0_0_/_0.15)]"
                : "scale-75 fill-transparent text-[#78350f]/35 opacity-70"
            }`}
            strokeWidth={2.5}
          />
        );
      })}
    </div>
  );
}
