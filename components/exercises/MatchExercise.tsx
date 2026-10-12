"use client";

import { useState } from "react";
import { AlertTriangle, Link2 } from "lucide-react";
import ExercisePrompt from "./ExercisePrompt";
import { MATCH_HINT } from "@/convex/voice/speakable";
import { linkTiles, matchAnswer, type MatchLink } from "@/lib/exerciseAnswers";

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
 * ON PEUT COMMENCER PAR LA GAUCHE OU PAR LA DROITE : le premier toucher
 * choisit la tuile, le suivant, dans l'AUTRE colonne, la relie à elle. Un
 * toucher sur une tuile déjà reliée défait son lien.
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

/**
 * LES COULEURS D'UN LIEN : CELLES DU LOGO DE JOTNA SCHOOL, JAMAIS LE ROUGE.
 * Un lien rouge se lit « faux » : l'enfant croit s'être trompé alors qu'il
 * n'a pas encore validé. Le rose en est trop proche : il est écarté aussi.
 * Ciel, soleil (le J), feuille (le a), terre (le panneau), nuit (le mortier)
 * et sable : la palette `--color-savanna-*` de `app/globals.css`. Le rang du
 * lien choisit la teinte ; les deux tuiles d'un lien partagent la leur.
 */
const pairColors = [
  { left: "bg-savanna-sky border-savanna-sky-deep text-savanna-night", right: "bg-savanna-sky/40 border-savanna-sky-deep text-savanna-night", line: "text-savanna-sky-deep" },
  { left: "bg-orange-300 border-orange-500 text-savanna-night", right: "bg-orange-100 border-orange-400 text-savanna-night", line: "text-orange-500" },
  { left: "bg-savanna-leaf border-savanna-leaf-deep text-savanna-night", right: "bg-savanna-leaf/30 border-savanna-leaf-deep text-savanna-night", line: "text-savanna-leaf-deep" },
  { left: "bg-savanna-earth border-savanna-earth text-white", right: "bg-savanna-earth/20 border-savanna-earth text-savanna-night", line: "text-savanna-earth" },
  { left: "bg-savanna-night border-savanna-night text-white", right: "bg-savanna-night/15 border-savanna-night text-savanna-night", line: "text-savanna-night" },
  { left: "bg-savanna-sand border-savanna-sand-deep text-savanna-night", right: "bg-savanna-sand/40 border-savanna-sand-deep text-savanna-night", line: "text-savanna-sand-deep" },
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
  // La tuile choisie attend son partenaire dans l'autre colonne.
  const [selected, setSelected] = useState<{ side: keyof MatchLink; index: number } | null>(
    null,
  );
  const [links, setLinks] = useState<MatchLink[]>([]);

  const handleClick = (side: keyof MatchLink, index: number) => {
    if (disabled) return;
    // Une tuile reliée : on défait son lien.
    if (links.some((link) => link[side] === index)) {
      setLinks(links.filter((link) => link[side] !== index));
      setSelected(null);
      return;
    }
    // Rien de choisi, ou une tuile de la même colonne : on choisit celle-ci.
    if (selected === null || selected.side === side) {
      setSelected({ side, index });
      return;
    }
    // Une tuile de l'autre colonne : on relie.
    setLinks(
      side === "right"
        ? linkTiles(links, selected.index, index)
        : linkTiles(links, index, selected.index),
    );
    setSelected(null);
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
      <div className="space-y-2">
        <ExercisePrompt prompt={prompt} />
        <p className="text-base font-medium text-gray-600">{MATCH_HINT}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-6">
        {/* Left column — original order */}
        <div className="space-y-3">
          {left.map((item, index) => {
            const color = linkColor("left", index);
            const isActive = selected?.side === "left" && selected.index === index;
            return (
              <button
                key={index}
                onClick={() => handleClick("left", index)}
                disabled={disabled}
                className={`
                  w-full rounded-2xl border-3 px-2 py-3 text-center text-base font-bold hyphens-auto [overflow-wrap:anywhere] transition-all duration-200 sm:px-4 sm:py-4 sm:text-lg
                  ${color
                    ? `${color.left} shadow-md`
                    : isActive
                      ? "border-indigo-400 bg-indigo-100 text-indigo-900 scale-[1.03] shadow-md"
                      : "border-gray-200 bg-white text-gray-800 hover:border-indigo-300 hover:bg-indigo-50"
                  }
                  ${disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"}
                  ${selected?.side === "right" && !color ? "ring-2 ring-amber-300 ring-offset-2" : ""}
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
            const isActive = selected?.side === "right" && selected.index === index;
            return (
              <button
                key={index}
                onClick={() => handleClick("right", index)}
                disabled={disabled}
                className={`
                  w-full rounded-2xl border-3 px-2 py-3 text-center text-base font-bold hyphens-auto [overflow-wrap:anywhere] transition-all duration-200 sm:px-4 sm:py-4 sm:text-lg
                  ${color
                    ? `${color.right} shadow-md`
                    : isActive
                      ? "border-indigo-400 bg-indigo-100 text-indigo-900 scale-[1.03] shadow-md"
                      : "border-gray-200 bg-white text-gray-800 hover:border-amber-300 hover:bg-amber-50"
                  }
                  ${disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"}
                  ${selected?.side === "left" && !color ? "ring-2 ring-amber-300 ring-offset-2" : ""}
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
