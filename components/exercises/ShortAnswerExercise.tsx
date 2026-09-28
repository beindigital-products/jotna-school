"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import ExercisePrompt from "./ExercisePrompt";

interface ShortAnswerPayload {
  acceptedAnswers?: string[];
  tolerance?: string | null;
  /** Posé par le serveur (`paliers.sanitizePayload`) : le clavier à ouvrir. */
  inputMode?: "numeric" | "decimal" | "text";
}

interface ShortAnswerExerciseProps {
  prompt: string;
  payload: ShortAnswerPayload;
  onSubmit: (answer: string) => void;
  disabled: boolean;
  isCorrect: boolean | null;
}

export default function ShortAnswerExercise({
  prompt,
  payload,
  onSubmit,
  disabled,
  isCorrect,
}: ShortAnswerExerciseProps) {
  const [answer, setAnswer] = useState("");
  // LE CLAVIER SUIT LA RÉPONSE ATTENDUE. Un enfant qui doit taper « 18 » n'a
  // pas à chercher les chiffres sur un clavier de lettres : `inputMode`
  // ouvre le pavé numérique (ou décimal) sur iOS et Android, sans
  // contraindre la valeur — la vérification reste côté serveur.
  const mode = payload?.inputMode ?? "text";
  const placeholder =
    mode === "numeric" || mode === "decimal" ? "Tape le nombre ici..." : "Tape ta réponse ici...";

  const handleSubmit = () => {
    if (answer.trim()) {
      onSubmit(answer);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !disabled && answer.trim()) {
      handleSubmit();
    }
  };

  return (
    <div className="space-y-6">
      <ExercisePrompt prompt={prompt} />

      <div className="relative">
        <Pencil className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400" />
        <input
          type="text"
          inputMode={mode}
          pattern={mode === "numeric" ? "-?[0-9]*" : undefined}
          autoComplete="off"
          autoCorrect={mode === "text" ? "on" : "off"}
          autoCapitalize={mode === "text" ? "sentences" : "off"}
          enterKeyHint="done"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          className={`
            w-full rounded-2xl border-3 pl-14 pr-5 py-5 text-xl font-semibold transition-all
            ${isCorrect === true
              ? "border-green-400 bg-green-50 text-green-800"
              : isCorrect === false
                ? "border-red-400 bg-red-50 text-red-800"
                : "border-gray-200 bg-white text-gray-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
            }
            placeholder-gray-400
            ${disabled ? "cursor-not-allowed opacity-70" : ""}
          `}
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={disabled || !answer.trim()}
        className="w-full rounded-2xl bg-gradient-to-r from-orange-400 to-pink-500 px-6 py-4 text-lg font-bold text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        Valider
      </button>
    </div>
  );
}
