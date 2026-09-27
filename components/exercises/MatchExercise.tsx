"use client";

import { useState } from "react";
import { AlertTriangle, Link2 } from "lucide-react";
import ExercisePrompt from "./ExercisePrompt";

/**
 * Server contract — the sanitized payload sent by `getExercisesForPalier`
 * (see convex/paliers/index.ts → sanitizePayload case "match"):
 *   { left:  string[]   // original order, kid pairs FROM these
 *     right: string[] } // already shuffled deterministically server-side
 *
 * The submission expected by `verifyMatch` is
 *   JSON.stringify([{ left, right }, …])
 * matching the kid's connections.
 */
interface MatchPayload {
  left?: string[];
  right?: string[];
}

interface MatchExerciseProps {
  prompt: string;
  payload: MatchPayload;
  onSubmit: (answer: string) => void;
  onSkip?: () => void;
  disabled: boolean;
  isCorrect: boolean | null;
}

const pairColors = [
  { left: "bg-blue-200 border-blue-400 text-blue-900", right: "bg-blue-100 border-blue-300 text-blue-800", line: "text-blue-400" },
  { left: "bg-pink-200 border-pink-400 text-pink-900", right: "bg-pink-100 border-pink-300 text-pink-800", line: "text-pink-400" },
  { left: "bg-amber-200 border-amber-400 text-amber-900", right: "bg-amber-100 border-amber-300 text-amber-800", line: "text-amber-400" },
  { left: "bg-green-200 border-green-400 text-green-900", right: "bg-green-100 border-green-300 text-green-800", line: "text-green-400" },
  { left: "bg-purple-200 border-purple-400 text-purple-900", right: "bg-purple-100 border-purple-300 text-purple-800", line: "text-purple-400" },
  { left: "bg-teal-200 border-teal-400 text-teal-900", right: "bg-teal-100 border-teal-300 text-teal-800", line: "text-teal-400" },
];

export default function MatchExercise({
  prompt,
  payload,
  onSubmit,
  onSkip,
  disabled,
}: MatchExerciseProps) {
  const left = Array.isArray(payload?.left) ? payload.left : [];
  const right = Array.isArray(payload?.right) ? payload.right : [];
  const malformed = left.length === 0 || right.length !== left.length;

  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [connectedPairs, setConnectedPairs] = useState<
    { left: string; right: string }[]
  >([]);

  const handleLeftClick = (item: string) => {
    if (disabled) return;
    if (connectedPairs.some((p) => p.left === item)) {
      setConnectedPairs(connectedPairs.filter((p) => p.left !== item));
      return;
    }
    setSelectedLeft(item);
  };

  const handleRightClick = (item: string) => {
    if (disabled || !selectedLeft) return;
    const filtered = connectedPairs.filter(
      (p) => p.left !== selectedLeft && p.right !== item,
    );
    filtered.push({ left: selectedLeft, right: item });
    setConnectedPairs(filtered);
    setSelectedLeft(null);
  };

  const getLeftColor = (item: string) => {
    const pairIndex = connectedPairs.findIndex((p) => p.left === item);
    if (pairIndex >= 0) return pairColors[pairIndex % pairColors.length];
    return null;
  };

  const getRightColor = (item: string) => {
    const pairIndex = connectedPairs.findIndex((p) => p.right === item);
    if (pairIndex >= 0) return pairColors[pairIndex % pairColors.length];
    return null;
  };

  const handleSubmit = () => {
    onSubmit(JSON.stringify(connectedPairs));
  };

  // True soft-fail — should be vanishingly rare now that the contract is
  // wired correctly. Keep the safety net for future schema drift.
  if (malformed) {
    if (typeof window !== "undefined") {
      // eslint-disable-next-line no-console
      console.error(
        "[MatchExercise] payload missing or mismatched 'left'/'right'; soft-fail. payload =",
        payload,
      );
    }
    return (
      <div className="space-y-4">
        <ExercisePrompt prompt={prompt} />
        <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-amber-300 bg-amber-50 p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-amber-600" aria-hidden />
          <div>
            <p className="font-bold text-amber-900">
              Cet exercice est cassé, on te le saute.
            </p>
            <p className="mt-1 text-sm text-amber-700">
              Pas de souci, ça ne te coûte rien.
            </p>
          </div>
          <button
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

  return (
    <div className="space-y-6">
      <ExercisePrompt prompt={prompt} />

      <div className="grid grid-cols-2 gap-6">
        {/* Left column — original order */}
        <div className="space-y-3">
          {left.map((item) => {
            const color = getLeftColor(item);
            const isActive = selectedLeft === item;
            return (
              <button
                key={item}
                onClick={() => handleLeftClick(item)}
                disabled={disabled}
                className={`
                  w-full rounded-2xl border-3 px-4 py-4 text-center text-lg font-bold transition-all duration-200
                  ${color
                    ? `${color.left} shadow-md`
                    : isActive
                      ? "border-indigo-400 bg-indigo-100 text-indigo-900 scale-[1.03] shadow-md"
                      : "border-gray-200 bg-white text-gray-800 hover:border-indigo-300 hover:bg-indigo-50"
                  }
                  ${disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"}
                `}
              >
                {item}
              </button>
            );
          })}
        </div>

        {/* Right column — server-shuffled */}
        <div className="space-y-3">
          {right.map((item) => {
            const color = getRightColor(item);
            return (
              <button
                key={item}
                onClick={() => handleRightClick(item)}
                disabled={disabled}
                className={`
                  w-full rounded-2xl border-3 px-4 py-4 text-center text-lg font-bold transition-all duration-200
                  ${color
                    ? `${color.right} shadow-md`
                    : "border-gray-200 bg-white text-gray-800 hover:border-amber-300 hover:bg-amber-50"
                  }
                  ${disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"}
                  ${selectedLeft && !color ? "ring-2 ring-amber-300 ring-offset-2" : ""}
                `}
              >
                {item}
              </button>
            );
          })}
        </div>
      </div>

      {/* Connected pairs indicator */}
      {connectedPairs.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {connectedPairs.map((pair, i) => {
            const color = pairColors[i % pairColors.length];
            return (
              <span
                key={`${pair.left}-${pair.right}`}
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold ${color.line} bg-white border`}
              >
                {pair.left} <Link2 className="h-3 w-3" /> {pair.right}
              </span>
            );
          })}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={disabled || connectedPairs.length !== left.length}
        className="w-full rounded-2xl bg-gradient-to-r from-orange-400 to-pink-500 px-6 py-4 text-lg font-bold text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        Valider
      </button>
    </div>
  );
}
