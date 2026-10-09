"use client";

import { useEffect, useState } from "react";
import { Check, Play, Volume2, X } from "lucide-react";
import ExercisePrompt from "./ExercisePrompt";
import { BrokenExercise, SubmitButton, type ExerciseScreenProps } from "./game-parts";
import type { ListenView } from "@/convex/paliers/games/types";
import { canSynthesize, playClip, stopClip } from "@/lib/sounds/synth";

/**
 * L'ÉCOUTE — l'enfant joue chaque son autant qu'il veut, puis choisit.
 * Les sons sont synthétisés par l'appareil (`lib/sounds/synth.ts`) : rien à
 * télécharger, rien à attendre, et cela marche sans réseau.
 */
export default function ListenExercise({
  prompt,
  payload,
  onSubmit,
  onSkip,
  disabled,
  isCorrect,
}: ExerciseScreenProps<Partial<ListenView>>) {
  const clips = Array.isArray(payload?.clips) ? payload.clips : [];
  const options = Array.isArray(payload?.options)
    ? payload.options.filter((o): o is string => typeof o === "string")
    : [];
  const [playing, setPlaying] = useState<number | null>(null);
  const [heard, setHeard] = useState<Set<number>>(() => new Set());
  const [selected, setSelected] = useState<number | null>(null);
  // Vérifié au premier toucher, pas au rendu : le rendu serveur ne connaît
  // pas l'audio de l'appareil, et l'écran ne doit pas changer à l'hydratation.
  const [unsupported, setUnsupported] = useState(false);

  // Un son qui joue encore quand l'exercice change se tait.
  useEffect(() => () => stopClip(), []);

  if (clips.length === 0 || options.length < 2) {
    return <BrokenExercise prompt={prompt} onSkip={onSkip} disabled={disabled} />;
  }
  if (unsupported) {
    return (
      <BrokenExercise
        prompt={prompt}
        onSkip={onSkip}
        disabled={disabled}
        message="Cet appareil ne sait pas jouer les sons de l'exercice : on le saute."
      />
    );
  }

  const listen = async (index: number) => {
    if (!canSynthesize()) {
      setUnsupported(true);
      return;
    }
    setPlaying(index);
    await playClip(clips[index].notes);
    setHeard((prev) => new Set(prev).add(index));
    setPlaying((current) => (current === index ? null : current));
  };

  return (
    <div className="space-y-6">
      <ExercisePrompt prompt={prompt} />

      <div className="flex flex-wrap items-center justify-center gap-4 rounded-2xl bg-sky-50 p-4">
        {clips.map((clip, i) => (
          <button
            key={i}
            type="button"
            onClick={() => void listen(i)}
            aria-label={`Écouter : ${clip.label}`}
            className={`flex min-w-[7.5rem] flex-col items-center gap-2 rounded-3xl border-3 px-4 py-3 font-bold transition-all active:scale-95 ${
              playing === i
                ? "scale-105 border-sky-500 bg-white text-sky-800 shadow-lg"
                : "border-sky-200 bg-white text-sky-900 shadow-sm hover:border-sky-400"
            }`}
          >
            <span
              className={`flex h-14 w-14 items-center justify-center rounded-full text-white ${
                playing === i ? "animate-pulse bg-sky-500" : "bg-sky-400"
              }`}
            >
              {playing === i ? <Volume2 className="h-7 w-7" aria-hidden /> : <Play className="h-7 w-7 translate-x-0.5" aria-hidden />}
            </span>
            <span className="text-base">{clip.label}</span>
            {heard.has(i) && <span className="text-xs font-semibold text-sky-600">Écouté ✓</span>}
          </button>
        ))}
      </div>
      <p className="text-center text-xs font-semibold text-gray-500">Monte le son de l&apos;appareil, puis touche un bouton pour écouter.</p>

      <div className="space-y-3">
        {options.map((option, index) => {
          const isSelected = selected === index;
          const right = isCorrect === true && isSelected;
          const wrong = isCorrect === false && isSelected;
          return (
            <button
              key={index}
              type="button"
              onClick={() => !disabled && setSelected(index)}
              disabled={disabled}
              className={`flex w-full items-center gap-4 rounded-2xl border-3 px-5 py-4 text-left text-lg font-semibold transition-all ${
                right
                  ? "scale-[1.02] border-green-400 bg-green-100 text-green-800 animate-[pop-in_0.45s_ease-out]"
                  : wrong
                    ? "border-red-400 bg-red-100 text-red-800 animate-[shake_0.5s_ease-in-out]"
                    : isSelected
                      ? "scale-[1.02] border-indigo-300 bg-indigo-50 text-indigo-900 shadow-md"
                      : "border-gray-200 bg-white text-gray-800 hover:border-indigo-200"
              } ${disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${
                  right ? "bg-green-500" : wrong ? "bg-red-500" : isSelected ? "bg-indigo-500" : "bg-gray-300"
                }`}
              >
                {right ? <Check className="h-5 w-5" /> : wrong ? <X className="h-5 w-5" /> : String.fromCharCode(65 + index)}
              </span>
              <span>{option}</span>
            </button>
          );
        })}
      </div>

      <SubmitButton
        onClick={() => selected !== null && onSubmit(String(selected))}
        disabled={disabled || selected === null}
      />
    </div>
  );
}
