"use client";

import { useState } from "react";
import ExercisePrompt from "./ExercisePrompt";
import { BrokenExercise, SubmitButton, type ExerciseScreenProps } from "./game-parts";
import type { ColorMixView, Paint } from "@/convex/paliers/games/types";

/**
 * L'ATELIER DES COULEURS — des pots de peinture à toucher.
 *
 * - « pick » : toucher le pot de la couleur demandée ;
 * - « result » : deux pots se versent dans le bol, l'enfant choisit ce qui
 *   en sort ;
 * - « pair » : une couleur à obtenir, l'enfant choisit les deux pots à
 *   mélanger. Le bol montre les deux peintures côte à côte, sans les mêler :
 *   le mélange se révèle quand la réponse est juste.
 */
export default function ColorMixExercise({
  prompt,
  payload,
  onSubmit,
  onSkip,
  disabled,
  isCorrect,
}: ExerciseScreenProps<Partial<ColorMixView>>) {
  const mode = payload?.mode;
  const choices = Array.isArray(payload?.choices) ? payload.choices.filter(isPaint) : [];
  const given = Array.isArray(payload?.given) ? payload.given.filter(isPaint) : [];
  const target = payload?.target && isPaint(payload.target) ? payload.target : null;
  const need = mode === "pair" ? 2 : 1;
  const [picked, setPicked] = useState<string[]>([]);

  const valid =
    (mode === "pick" || mode === "result" || mode === "pair") &&
    choices.length >= 2 &&
    (mode !== "result" || given.length === 2) &&
    (mode !== "pair" || target !== null);
  if (!valid) {
    return <BrokenExercise prompt={prompt} onSkip={onSkip} disabled={disabled} />;
  }

  const toggle = (name: string) => {
    if (disabled) return;
    setPicked((prev) => {
      if (prev.includes(name)) return prev.filter((n) => n !== name);
      if (need === 1) return [name];
      return prev.length >= need ? [prev[1], name] : [...prev, name];
    });
  };

  const paintOf = (name: string) => choices.find((c) => c.name === name);
  const bowl: Paint[] =
    mode === "result" ? given : mode === "pair" ? picked.map(paintOf).filter(isPaint) : [];
  // Le mélange se montre quand il est juste : en mode « pair », c'est la
  // couleur visée ; en mode « result », la couleur choisie.
  const revealed =
    isCorrect === true ? (mode === "pair" ? target : mode === "result" ? paintOf(picked[0] ?? "") ?? null : null) : null;

  return (
    <div className="space-y-6">
      <ExercisePrompt prompt={prompt} />

      {mode === "pair" && target && (
        <div className="flex items-center justify-center gap-3 rounded-2xl bg-amber-50 px-4 py-3">
          <span className="text-sm font-bold text-amber-900">À obtenir :</span>
          <PaintBlob paint={target} size={48} />
          <span className="text-lg font-extrabold text-amber-950">{target.name}</span>
        </div>
      )}

      {(mode === "result" || mode === "pair") && (
        <div className="flex items-center justify-center gap-3">
          {mode === "result" && (
            <>
              <PaintBlob paint={given[0]} size={52} label />
              <span className="text-3xl font-extrabold text-gray-400">+</span>
              <PaintBlob paint={given[1]} size={52} label />
              <span className="text-3xl font-extrabold text-gray-400">=</span>
            </>
          )}
          <Bowl paints={bowl} revealed={revealed} isCorrect={isCorrect} />
        </div>
      )}

      <div>
        <p className="mb-2 text-center text-sm font-bold text-gray-500">
          {mode === "pair" ? "Touche deux pots :" : "Touche le bon pot :"}
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          {choices.map((paint) => {
            const on = picked.includes(paint.name);
            return (
              <button
                key={paint.name}
                type="button"
                onClick={() => toggle(paint.name)}
                disabled={disabled}
                aria-pressed={on}
                aria-label={`Pot ${paint.name}`}
                className={`flex flex-col items-center gap-1.5 rounded-2xl border-3 px-3 py-2 transition-all active:scale-95 ${
                  on
                    ? isCorrect === false
                      ? "border-red-400 bg-red-50 animate-[shake_0.5s_ease-in-out]"
                      : "scale-105 border-gray-900 bg-white shadow-lg"
                    : "border-transparent bg-white hover:border-gray-200"
                } ${disabled ? "cursor-not-allowed opacity-80" : ""}`}
              >
                <PaintPot paint={paint} />
                <span className="text-sm font-bold text-gray-800">{paint.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <SubmitButton
        onClick={() => picked.length === need && onSubmit(JSON.stringify(picked))}
        disabled={disabled || picked.length !== need}
      />
    </div>
  );
}

function isPaint(value: unknown): value is Paint {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as Paint).name === "string" &&
    typeof (value as Paint).color === "string"
  );
}

/** Un pot de peinture : le corps du pot et sa couleur dedans. */
function PaintPot({ paint }: { paint: Paint }) {
  return (
    <span className="relative block h-16 w-14" aria-hidden>
      <span className="absolute inset-x-1 top-0 h-3 rounded-t-lg bg-gray-300" />
      <span
        className="absolute inset-x-0 bottom-0 top-2 rounded-b-2xl rounded-t-md border-2 border-gray-300"
        style={{ backgroundColor: paint.color }}
      />
    </span>
  );
}

function PaintBlob({ paint, size, label = false }: { paint: Paint; size: number; label?: boolean }) {
  return (
    <span className="flex flex-col items-center gap-1">
      <span
        className="block rounded-full border-2 border-gray-300 shadow-inner"
        style={{ width: size, height: size, backgroundColor: paint.color }}
        aria-hidden
      />
      {label && <span className="text-xs font-bold text-gray-600">{paint.name}</span>}
    </span>
  );
}

/** Le bol : les peintures versées, puis le mélange quand il est trouvé. */
function Bowl({
  paints,
  revealed,
  isCorrect,
}: {
  paints: Paint[];
  revealed: Paint | null;
  isCorrect: boolean | null;
}) {
  const fill = revealed
    ? revealed.color
    : paints.length === 2
      ? `linear-gradient(90deg, ${paints[0].color} 50%, ${paints[1].color} 50%)`
      : paints.length === 1
        ? paints[0].color
        : "#f3f4f6";
  return (
    <span className="flex flex-col items-center gap-1">
      <span
        className={`relative flex h-16 w-24 items-center justify-center overflow-hidden rounded-b-[3rem] rounded-t-md border-3 ${
          isCorrect === true ? "border-green-400 animate-[pop-in_0.45s_ease-out]" : "border-gray-300"
        }`}
        style={{ background: fill }}
        aria-label={revealed ? `Le mélange donne ${revealed.name}` : "Le bol de mélange"}
      >
        {!revealed && <span className="text-2xl font-extrabold text-gray-500/80">?</span>}
      </span>
      <span className="text-xs font-bold text-gray-600">{revealed ? revealed.name : "le bol"}</span>
    </span>
  );
}
