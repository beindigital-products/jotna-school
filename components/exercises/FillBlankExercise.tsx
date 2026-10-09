"use client";

import { useState } from "react";
import ExercisePrompt from "./ExercisePrompt";
import { BrokenExercise, SubmitButton, verdictClasses, type ExerciseScreenProps } from "./game-parts";
import { splitBlanks, type FillBlankView } from "@/convex/paliers/games/types";

/**
 * LA PHRASE À TROUS — l'enfant touche un trou, puis le mot qui va dedans.
 * Le trou suivant s'ouvre tout seul ; toucher un trou rempli permet de
 * changer d'avis. La réponse part en tableau, un mot par trou.
 */
export default function FillBlankExercise({
  prompt,
  payload,
  onSubmit,
  onSkip,
  disabled,
  isCorrect,
}: ExerciseScreenProps<Partial<FillBlankView>>) {
  const text = typeof payload?.text === "string" ? payload.text : "";
  const blanks = Array.isArray(payload?.blanks) ? payload.blanks : [];
  const parts = splitBlanks(text);
  const [chosen, setChosen] = useState<(string | null)[]>(() => blanks.map(() => null));
  const [active, setActive] = useState(0);

  if (!text || blanks.length === 0 || parts.length !== blanks.length + 1) {
    return <BrokenExercise prompt={prompt} onSkip={onSkip} disabled={disabled} />;
  }

  const choose = (word: string) => {
    if (disabled) return;
    const next = [...chosen];
    next[active] = word;
    setChosen(next);
    // Le prochain trou encore vide, sinon on reste où l'on est.
    const following = next.findIndex((value, i) => value === null && i !== active);
    if (following !== -1) setActive(following);
  };

  const complete = chosen.every((value) => value !== null);
  const options = blanks[active]?.options ?? [];

  return (
    <div className="space-y-6">
      <ExercisePrompt prompt={prompt} />

      <div className={`rounded-2xl border-3 px-5 py-5 text-xl font-semibold leading-[2.6rem] text-gray-900 ${verdictClasses(isCorrect)}`}>
        {parts.map((part, i) => (
          <span key={i}>
            {part}
            {i < blanks.length && (
              <button
                type="button"
                onClick={() => !disabled && setActive(i)}
                disabled={disabled}
                aria-label={chosen[i] ? `Trou ${i + 1} : ${chosen[i]}` : `Trou ${i + 1}, vide`}
                className={`mx-1 inline-flex min-w-[4.5rem] items-center justify-center rounded-xl border-2 border-dashed px-3 py-0.5 align-middle text-lg font-bold transition-all ${
                  i === active && !disabled
                    ? "border-indigo-500 bg-indigo-50 text-indigo-800 ring-2 ring-indigo-200"
                    : chosen[i]
                      ? "border-indigo-300 bg-white text-indigo-800"
                      : "border-gray-300 bg-gray-50 text-gray-400"
                }`}
              >
                {chosen[i] ?? "?"}
              </button>
            )}
          </span>
        ))}
      </div>

      <div>
        <p className="mb-2 text-sm font-bold text-gray-500">
          {blanks.length > 1 ? `Trou ${active + 1} : choisis le bon mot` : "Choisis le bon mot"}
        </p>
        <div className="flex flex-wrap gap-3">
          {options.map((word) => (
            <button
              key={word}
              type="button"
              onClick={() => choose(word)}
              disabled={disabled}
              className={`rounded-2xl border-3 px-5 py-3 text-lg font-bold transition-all ${
                chosen[active] === word
                  ? "border-indigo-400 bg-indigo-100 text-indigo-900 scale-[1.03] shadow-md"
                  : "border-gray-200 bg-white text-gray-800 hover:border-indigo-300 hover:bg-indigo-50"
              } ${disabled ? "cursor-not-allowed opacity-70" : ""}`}
            >
              {word}
            </button>
          ))}
        </div>
      </div>

      <SubmitButton
        onClick={() => complete && onSubmit(JSON.stringify(chosen))}
        disabled={disabled || !complete}
      />
    </div>
  );
}
