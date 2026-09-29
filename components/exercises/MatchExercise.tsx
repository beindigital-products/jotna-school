"use client";

import { useState } from "react";
import { AlertTriangle, Link2 } from "lucide-react";
import ExercisePrompt from "./ExercisePrompt";
import {
  linkTiles,
  matchAnswer,
  unlinkLeft,
  type MatchLink,
} from "@/lib/exerciseAnswers";

/**
 * Server contract — the sanitized payload sent by `getExercisesForPalier`
 * (see convex/paliers/index.ts → sanitizePayload case "match"):
 *   { left:  string[]   // original order, kid pairs FROM these
 *     right: string[] } // already shuffled deterministically server-side
 *
 * The submission expected by `verifyMatch` is
 *   JSON.stringify([{ left, right }, …])
 * matching the kid's connections.
 *
 * UNE TUILE EST SA POSITION, PAS SON TEXTE. Deux tuiles peuvent se ressembler
 * (« a » deux fois : mangue et yassa ont le même son). Suivies par leur
 * texte, relier l'une colorait les deux et le second mot restait sans
 * partenaire. Les liens retiennent donc des indices (`lib/exerciseAnswers.ts`).
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

  // Des INDICES dans `left` et `right`, jamais des textes (voir l'en-tête).
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [links, setLinks] = useState<MatchLink[]>([]);

  const handleLeftClick = (index: number) => {
    if (disabled) return;
    if (links.some((link) => link.left === index)) {
      setLinks(unlinkLeft(links, index));
      return;
    }
    setSelectedLeft(index);
  };

  const handleRightClick = (index: number) => {
    if (disabled || selectedLeft === null) return;
    setLinks(linkTiles(links, selectedLeft, index));
    setSelectedLeft(null);
  };

  /** La couleur d'une tuile reliée : celle du rang de son lien. */
  const linkColor = (side: keyof MatchLink, index: number) => {
    const rank = links.findIndex((link) => link[side] === index);
    return rank >= 0 ? pairColors[rank % pairColors.length] : null;
  };

  const handleSubmit = () => {
    onSubmit(matchAnswer(left, right, links));
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
          {left.map((item, index) => {
            const color = linkColor("left", index);
            const isActive = selectedLeft === index;
            return (
              <button
                key={index}
                onClick={() => handleLeftClick(index)}
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
          {right.map((item, index) => {
            const color = linkColor("right", index);
            return (
              <button
                key={index}
                onClick={() => handleRightClick(index)}
                disabled={disabled}
                className={`
                  w-full rounded-2xl border-3 px-4 py-4 text-center text-lg font-bold transition-all duration-200
                  ${color
                    ? `${color.right} shadow-md`
                    : "border-gray-200 bg-white text-gray-800 hover:border-amber-300 hover:bg-amber-50"
                  }
                  ${disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"}
                  ${selectedLeft !== null && !color ? "ring-2 ring-amber-300 ring-offset-2" : ""}
                `}
              >
                {item}
              </button>
            );
          })}
        </div>
      </div>

      {/* Connected pairs indicator */}
      {links.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {links.map((link, rank) => {
            const color = pairColors[rank % pairColors.length];
            return (
              <span
                key={`${link.left}-${link.right}`}
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold ${color.line} bg-white border`}
              >
                {left[link.left]} <Link2 className="h-3 w-3" /> {right[link.right]}
              </span>
            );
          })}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={disabled || links.length !== left.length}
        className="w-full rounded-2xl bg-gradient-to-r from-orange-400 to-pink-500 px-6 py-4 text-lg font-bold text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        Valider
      </button>
    </div>
  );
}
