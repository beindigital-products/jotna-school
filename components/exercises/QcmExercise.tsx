"use client";

import { useState } from "react";
import { AlertTriangle, Check, X } from "lucide-react";
import ExercisePrompt from "./ExercisePrompt";

interface QcmPayload {
  options?: string[];
  correctIndex?: number;
  explanation?: string;
}

interface QcmExerciseProps {
  prompt: string;
  payload: QcmPayload;
  onSubmit: (answer: string) => void;
  onSkip?: () => void;
  disabled: boolean;
  isCorrect: boolean | null;
}

const optionColors = [
  { bg: "bg-blue-100", border: "border-blue-300", text: "text-blue-800", badge: "bg-blue-500" },
  { bg: "bg-pink-100", border: "border-pink-300", text: "text-pink-800", badge: "bg-pink-500" },
  { bg: "bg-amber-100", border: "border-amber-300", text: "text-amber-800", badge: "bg-amber-500" },
  { bg: "bg-green-100", border: "border-green-300", text: "text-green-800", badge: "bg-green-500" },
  { bg: "bg-purple-100", border: "border-purple-300", text: "text-purple-800", badge: "bg-purple-500" },
  { bg: "bg-teal-100", border: "border-teal-300", text: "text-teal-800", badge: "bg-teal-500" },
];

export default function QcmExercise({
  prompt,
  payload,
  onSubmit,
  onSkip,
  disabled,
  isCorrect,
}: QcmExerciseProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const options = Array.isArray(payload?.options) ? payload.options.filter((o): o is string => typeof o === "string") : [];

  if (options.length < 2) {
    return (
      <div className="space-y-4">
        <ExercisePrompt prompt={prompt} />
        <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-amber-300 bg-amber-50 p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-amber-600" aria-hidden />
          <p className="font-bold text-amber-900">Cet exercice est cassé, on te le saute.</p>
          <p className="mt-1 text-sm text-amber-700">Pas de souci, ça ne te coûte rien.</p>
          <button onClick={() => onSkip?.()} disabled={disabled} className="mt-1 rounded-2xl bg-amber-500 px-6 py-2.5 text-base font-bold text-white shadow hover:bg-amber-600 disabled:opacity-50">Suivant</button>
        </div>
      </div>
    );
  }

  const handleSubmit = () => {
    if (selectedIndex !== null) {
      onSubmit(String(selectedIndex));
    }
  };

  return (
    <div className="space-y-6">
      <ExercisePrompt prompt={prompt} />

      <div className="space-y-3">
        {options.map((option, index) => {
          const color = optionColors[index % optionColors.length];
          const isSelected = selectedIndex === index;
          const showCorrectFeedback = isCorrect === true && isSelected;
          const showIncorrectFeedback = isCorrect === false && isSelected;

          return (
            <button
              key={index}
              onClick={() => !disabled && setSelectedIndex(index)}
              disabled={disabled}
              className={`
                flex w-full items-center gap-4 rounded-2xl border-3 px-5 py-4 text-left text-lg font-semibold transition-all duration-200
                ${showCorrectFeedback
                  ? "border-green-400 bg-green-100 text-green-800 scale-[1.02] shadow-lg shadow-green-200 animate-[pop-in_0.45s_ease-out]"
                  : showIncorrectFeedback
                    ? "border-red-400 bg-red-100 text-red-800 animate-[shake_0.5s_ease-in-out]"
                    : isSelected
                      ? `${color.border} ${color.bg} ${color.text} scale-[1.02] shadow-md`
                      : `border-gray-200 bg-white ${color.text} hover:${color.bg} hover:${color.border} hover:shadow-sm`
                }
                ${disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"}
              `}
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${
                  showCorrectFeedback
                    ? "bg-green-500"
                    : showIncorrectFeedback
                      ? "bg-red-500"
                      : isSelected
                        ? color.badge
                        : "bg-gray-300"
                }`}
              >
                {showCorrectFeedback ? (
                  <Check className="h-5 w-5" />
                ) : showIncorrectFeedback ? (
                  <X className="h-5 w-5" />
                ) : (
                  String.fromCharCode(65 + index)
                )}
              </span>
              <span>{option}</span>
            </button>
          );
        })}
      </div>

      <button
        onClick={handleSubmit}
        disabled={disabled || selectedIndex === null}
        className="w-full rounded-2xl bg-gradient-to-r from-orange-400 to-pink-500 px-6 py-4 text-lg font-bold text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        Valider
      </button>
    </div>
  );
}
