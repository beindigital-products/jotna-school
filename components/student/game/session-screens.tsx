"use client";

import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, LockKeyhole, Sparkles } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import DragDropExercise from "@/components/exercises/DragDropExercise";
import GameExercise, { isGameScreenType } from "@/components/exercises/GameExercise";
import MatchExercise from "@/components/exercises/MatchExercise";
import OrderExercise from "@/components/exercises/OrderExercise";
import QcmExercise from "@/components/exercises/QcmExercise";
import ShortAnswerExercise from "@/components/exercises/ShortAnswerExercise";
import { ActionButton3D } from "@/components/student/game-kit";
import { Pio } from "@/components/student/pio";
import { StudentAlertDialog } from "@/components/student/student-alert-dialog";
import type { ExerciseType } from "@/convex/exerciseTypes";
import { kidMessages } from "@/lib/kidCopy";

/**
 * LES ÉCRANS AUTOUR DE LA SÉANCE, partagés par `online-session.tsx` et
 * `offline-session.tsx`, qui les dupliquaient ligne pour ligne :
 *
 *   - `ExerciseRenderer` : l'aiguillage d'un exercice vers son écran, sans
 *     toucher au contrat des composants (`prompt`, `payload`, `disabled`,
 *     `isCorrect`, `onSubmit`, `onSkip`) ;
 *   - `SceneAlertDialog` : les quatre alertes de la séance (quitter, parent
 *     prévenu, nouvelle chance refusée, accès fermé) ;
 *   - `LockedPalierScreen` : le palier qu'on ne peut pas encore ouvrir ;
 *   - `SessionNotice` : un message centré avec sa sortie (non connecté, aucun
 *     exercice, sac vide…).
 *
 * Tous dans la DA du Monde de Pio (crème, ambre, Fredoka, boutons épais) :
 * les dégradés orange-rose et les gris d'administration qu'ils portaient
 * n'existent nulle part ailleurs dans l'espace élève.
 */

/** Ce que la séance sait d'un exercice sans sa réponse : la même forme en ligne et sur l'appareil. */
export type StageExercise = {
  _id: string;
  type: ExerciseType;
  prompt: string;
  payload: Record<string, unknown>;
  hintsAvailable: number;
};

export type SceneAlert =
  | { type: "regen-error"; message: string }
  | { type: "access-blocked" }
  | { type: "parent-notified" }
  | { type: "quit-confirm" };

export function ExerciseRenderer({
  exo,
  disabled,
  isCorrect,
  onSubmit,
  onSkip,
}: {
  exo: StageExercise;
  disabled: boolean;
  isCorrect: boolean | null;
  onSubmit: (answer: string) => void;
  onSkip?: () => void;
}) {
  // Les écrans reçoivent le payload sans la réponse, tel quel : la
  // vérification se fait ailleurs (le serveur, ou la règle sur l'appareil).
  switch (exo.type) {
    case "qcm":
      return (
        <QcmExercise
          prompt={exo.prompt}
          payload={exo.payload as ComponentProps<typeof QcmExercise>["payload"]}
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
          payload={exo.payload as ComponentProps<typeof ShortAnswerExercise>["payload"]}
          disabled={disabled}
          isCorrect={isCorrect}
          onSubmit={onSubmit}
        />
      );
    case "match":
      return (
        <MatchExercise
          prompt={exo.prompt}
          payload={exo.payload as ComponentProps<typeof MatchExercise>["payload"]}
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
          payload={exo.payload as ComponentProps<typeof OrderExercise>["payload"]}
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
          payload={exo.payload as ComponentProps<typeof DragDropExercise>["payload"]}
          disabled={disabled}
          isCorrect={isCorrect}
          onSubmit={onSubmit}
          onSkip={onSkip}
        />
      );
    default:
      if (isGameScreenType(exo.type)) {
        return (
          <GameExercise
            type={exo.type}
            prompt={exo.prompt}
            payload={exo.payload}
            disabled={disabled}
            isCorrect={isCorrect}
            onSubmit={onSubmit}
            onSkip={onSkip}
          />
        );
      }
      return <p>Type d&apos;exercice non supporté</p>;
  }
}

export function SceneAlertDialog({
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

/**
 * Le palier verrouillé : une carte crème posée, Pio qui salue, les trois
 * marches (faite, fermée, après) et le bouton qui ramène au palier d'avant.
 */
export function LockedPalierScreen({
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
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className="relative w-full rounded-[2rem] border-4 border-amber-200 bg-[#fff8e6] px-5 py-7 text-center shadow-[0_8px_0_#d6c39a,0_24px_40px_-20px_rgba(60,30,0,0.5)] sm:px-8 sm:py-8"
      >
        <div className="mx-auto mb-3 flex h-36 w-36 items-center justify-center rounded-full border-4 border-white bg-[radial-gradient(circle,#fff7c2_0%,#ffd23f_55%,#f6c452_100%)] shadow-[inset_0_-8px_16px_rgba(0,0,0,0.12)]">
          <Pio state="hello" size={122} />
        </div>

        <div className="mb-3 inline-flex items-center gap-2 rounded-full border-2 border-white bg-amber-100 px-3 py-1 font-display text-xs font-extrabold uppercase tracking-wide text-amber-900 shadow-[0_2px_0_#d6c39a]">
          <LockKeyhole className="h-3.5 w-3.5" aria-hidden />
          Palier {currentPalier} verrouillé
        </div>

        <h1 className="font-display text-3xl font-extrabold leading-tight text-amber-950 sm:text-4xl">
          Encore une marche avant&nbsp;!
        </h1>
        <p className="mx-auto mt-3 max-w-md text-base font-semibold text-amber-900/80">
          Pio garde ce palier au chaud. Termine d&apos;abord le palier {previousPalier}, puis la suite
          s&apos;ouvrira.
        </p>

        <div className="mx-auto mt-6 grid max-w-md grid-cols-3 gap-2">
          <StepBubble active icon={<CheckCircle2 className="h-5 w-5" aria-hidden />} label={`Palier ${previousPalier}`} />
          <StepBubble active={false} icon={<LockKeyhole className="h-5 w-5" aria-hidden />} label={`Palier ${currentPalier}`} />
          <StepBubble active={false} icon={<Sparkles className="h-5 w-5" aria-hidden />} label="Après" />
        </div>

        <p className="mx-auto mt-5 max-w-md rounded-2xl border-2 border-white bg-white/70 px-4 py-3 text-xs font-medium text-amber-900/75">
          {message}
        </p>

        <div className="mt-6">
          <ActionButton3D
            onClick={onGoPrevious}
            size="md"
            icon={<ArrowLeft className="h-5 w-5" aria-hidden />}
            className="sm:mx-auto sm:max-w-sm"
          >
            Reprendre le palier {previousPalier}
          </ActionButton3D>
        </div>
      </motion.div>
    </div>
  );
}

function StepBubble({ active, icon, label }: { active: boolean; icon: ReactNode; label: string }) {
  return (
    <div
      className={`flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border-2 px-2 py-3 ${
        active
          ? "border-lime-300 bg-lime-50 text-green-800 shadow-[0_3px_0_#86efac]"
          : "border-amber-200 bg-white/70 text-amber-900/50"
      }`}
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm">{icon}</div>
      <p className="font-display text-xs font-extrabold">{label}</p>
    </div>
  );
}

/** Un message centré, dans la voix de Pio, avec ses sorties. */
export function SessionNotice({
  pio,
  title,
  body,
  children,
}: {
  /** La pose de Pio au-dessus du message ; absent = pas de Pio. */
  pio?: ComponentProps<typeof Pio>["state"];
  title?: string;
  body?: ReactNode;
  /** Les boutons. */
  children?: ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 py-12 text-center">
      {pio && <Pio state={pio} size={130} />}
      {title && <h2 className="font-display text-2xl font-extrabold text-amber-950">{title}</h2>}
      {body && <div className="max-w-sm text-base font-semibold text-amber-900/80">{body}</div>}
      {children && <div className="mt-2 flex w-full max-w-xs flex-col gap-3">{children}</div>}
    </div>
  );
}
