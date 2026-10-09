"use client";

import { AlertTriangle } from "lucide-react";
import ExercisePrompt from "./ExercisePrompt";

/**
 * Les pièces communes des nouveaux exercices (phrase à trous, frise,
 * dessin, écoute, couleurs) : le bouton Valider et l'exercice cassé, à
 * l'identique des types classiques.
 */

export function SubmitButton({
  onClick,
  disabled,
  label = "Valider",
}: {
  onClick: () => void;
  disabled: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-2xl bg-gradient-to-r from-orange-400 to-pink-500 px-6 py-4 text-lg font-bold text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
    >
      {label}
    </button>
  );
}

/** Un exercice illisible ne bloque jamais l'enfant : on le saute, sans pénalité. */
export function BrokenExercise({
  prompt,
  onSkip,
  disabled,
  message = "Cet exercice est cassé, on te le saute.",
}: {
  prompt: string;
  onSkip?: () => void;
  disabled: boolean;
  message?: string;
}) {
  return (
    <div className="space-y-4">
      <ExercisePrompt prompt={prompt} />
      <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-amber-300 bg-amber-50 p-6 text-center">
        <AlertTriangle className="h-8 w-8 text-amber-600" aria-hidden />
        <p className="font-bold text-amber-900">{message}</p>
        <p className="mt-1 text-sm text-amber-700">Pas de souci, ça ne te coûte rien.</p>
        <button
          type="button"
          onClick={() => onSkip?.()}
          disabled={disabled}
          className="mt-1 rounded-2xl bg-amber-500 px-6 py-2.5 text-base font-bold text-white shadow hover:bg-amber-600 disabled:opacity-50"
        >
          Suivant
        </button>
      </div>
    </div>
  );
}

/** La bordure d'une zone de réponse selon le verdict : vert, rouge, ou neutre. */
export function verdictClasses(isCorrect: boolean | null): string {
  if (isCorrect === true) return "border-green-400 bg-green-50 animate-[pop-in_0.45s_ease-out]";
  if (isCorrect === false) return "border-red-400 bg-red-50 animate-[shake_0.5s_ease-in-out]";
  return "border-gray-200 bg-white";
}

/** Les props communes des écrans d'exercice. */
export type ExerciseScreenProps<P> = {
  prompt: string;
  payload: P;
  onSubmit: (answer: string) => void;
  onSkip?: () => void;
  disabled: boolean;
  isCorrect: boolean | null;
};
