"use client";

import { useState } from "react";
import ExercisePrompt from "./ExercisePrompt";
import { BrokenExercise, SubmitButton, type ExerciseScreenProps } from "./game-parts";
import type { PatternView } from "@/convex/paliers/games/types";

/**
 * LA FRISE À COMPLÉTER — une suite qui se répète, des cases vides.
 * L'enfant touche un jeton de la boîte : il se pose dans la case qui
 * clignote, puis la case vide suivante s'allume. Toucher une case remplie
 * la vide.
 */
export default function PatternExercise({
  prompt,
  payload,
  onSubmit,
  onSkip,
  disabled,
  isCorrect,
}: ExerciseScreenProps<Partial<PatternView>>) {
  const sequence = Array.isArray(payload?.sequence) ? payload.sequence : [];
  const options = Array.isArray(payload?.options)
    ? payload.options.filter((o): o is string => typeof o === "string")
    : [];
  const blankIndexes = sequence.flatMap((token, i) => (token === null ? [i] : []));
  const [filled, setFilled] = useState<(string | null)[]>(() => blankIndexes.map(() => null));
  const [active, setActive] = useState(0);

  if (sequence.length < 3 || blankIndexes.length === 0 || options.length < 2) {
    return <BrokenExercise prompt={prompt} onSkip={onSkip} disabled={disabled} />;
  }

  const place = (token: string) => {
    if (disabled) return;
    const next = [...filled];
    next[active] = token;
    setFilled(next);
    const following = next.findIndex((value, i) => value === null && i !== active);
    if (following !== -1) setActive(following);
  };

  const clear = (blank: number) => {
    if (disabled) return;
    const next = [...filled];
    next[blank] = null;
    setFilled(next);
    setActive(blank);
  };

  const complete = filled.every((token) => token !== null);
  // Un nombre se lit mieux en tuile large ; un émoji, en tuile carrée.
  const wide = sequence.some((token) => typeof token === "string" && token.length > 2) ||
    options.some((o) => o.length > 2);

  return (
    <div className="space-y-6">
      <ExercisePrompt prompt={prompt} />

      <div
        className={`flex flex-wrap items-center justify-center gap-2 rounded-2xl border-3 p-4 ${
          isCorrect === true
            ? "border-green-400 bg-green-50 animate-[pop-in_0.45s_ease-out]"
            : isCorrect === false
              ? "border-red-400 bg-red-50 animate-[shake_0.5s_ease-in-out]"
              : "border-amber-200 bg-amber-50/60"
        }`}
      >
        {sequence.map((token, i) => {
          const blank = blankIndexes.indexOf(i);
          const base = `flex h-14 ${wide ? "min-w-[4.5rem] px-2" : "w-14"} items-center justify-center rounded-xl text-3xl font-extrabold`;
          if (blank === -1) {
            return (
              <span key={i} className={`${base} bg-white shadow-sm ${wide ? "text-xl text-gray-800" : ""}`}>
                {token}
              </span>
            );
          }
          const value = filled[blank];
          return (
            <button
              key={i}
              type="button"
              onClick={() => (value ? clear(blank) : setActive(blank))}
              disabled={disabled}
              aria-label={value ? `Case ${blank + 1} : ${value}, toucher pour la vider` : `Case vide ${blank + 1}`}
              className={`${base} border-3 border-dashed transition-all ${
                blank === active && !value && !disabled
                  ? "animate-pulse border-orange-400 bg-orange-50"
                  : value
                    ? "border-indigo-300 bg-white"
                    : "border-gray-300 bg-white/70"
              } ${wide ? "text-xl text-gray-800" : ""}`}
            >
              {value ?? <span className="text-2xl text-gray-300">?</span>}
            </button>
          );
        })}
      </div>

      <div>
        <p className="mb-2 text-sm font-bold text-gray-500">Touche le bon morceau :</p>
        <div className="flex flex-wrap justify-center gap-3">
          {options.map((token) => (
            <button
              key={token}
              type="button"
              onClick={() => place(token)}
              disabled={disabled}
              aria-label={`Placer ${token}`}
              className={`flex h-16 ${wide ? "min-w-[5rem] px-3 text-2xl" : "w-16 text-4xl"} items-center justify-center rounded-2xl border-3 border-gray-200 bg-white font-extrabold text-gray-800 shadow-sm transition-all hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md active:scale-95 ${
                disabled ? "cursor-not-allowed opacity-70" : ""
              }`}
            >
              {token}
            </button>
          ))}
        </div>
      </div>

      <SubmitButton onClick={() => complete && onSubmit(JSON.stringify(filled))} disabled={disabled || !complete} />
    </div>
  );
}
