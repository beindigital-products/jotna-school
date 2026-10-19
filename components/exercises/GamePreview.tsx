"use client";

import { useState } from "react";
import GameExercise, { type GameScreenType } from "./GameExercise";
import { correctAnswerText, sanitizePayload, verifyAnswer } from "@/convex/paliers/exerciseRules";

/**
 * L'APERÇU D'UN NOUVEL EXERCICE POUR UN ADULTE : l'écran exact de l'enfant,
 * jouable, avec le verdict quand on valide et la bonne réponse en dessous.
 * Le payload complet passe par `sanitizePayload`, comme pour l'enfant : on
 * voit ce qu'il voit, pas la réponse.
 */
export default function GamePreview({
  type,
  prompt,
  payload,
}: {
  type: GameScreenType;
  prompt: string;
  payload: unknown;
}) {
  const [verdict, setVerdict] = useState<boolean | null>(null);
  const [attempt, setAttempt] = useState(0);
  const view = sanitizePayload(type, payload, "apercu", `essai-${attempt}`);
  const answer = correctAnswerText({ type, payload });

  return (
    <div className="space-y-4">
      <GameExercise
        key={`${attempt}:${JSON.stringify(payload)}`}
        type={type}
        prompt={prompt}
        payload={view}
        disabled={verdict !== null}
        isCorrect={verdict}
        onSubmit={(submitted) => setVerdict(verifyAnswer({ type, payload }, submitted))}
      />
      {verdict !== null && (
        <div
          className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold ${
            verdict ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
          }`}
        >
          <span>{verdict ? "Bonne réponse." : "Réponse fausse."}</span>
          <button
            type="button"
            onClick={() => {
              setVerdict(null);
              setAttempt((n) => n + 1);
            }}
            className="rounded-lg bg-white px-3 py-1 text-xs font-bold text-gray-700 shadow-sm"
          >
            Recommencer
          </button>
        </div>
      )}
      {answer && (
        <p className="rounded-xl bg-gray-100 px-4 py-2 text-xs text-gray-600">
          <span className="font-bold">Réponse attendue :</span> {answer}
        </p>
      )}
    </div>
  );
}
