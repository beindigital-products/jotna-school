"use client";

import type { ComponentProps } from "react";
import ColorMixExercise from "./ColorMixExercise";
import FillBlankExercise from "./FillBlankExercise";
import ListenExercise from "./ListenExercise";
import PatternExercise from "./PatternExercise";
import PixelArtExercise from "./PixelArtExercise";

/**
 * L'AIGUILLAGE DES NOUVEAUX TYPES, partagé par la séance en ligne et la
 * séance sans réseau : la phrase à trous et les quatre jeux fabriqués par le
 * code (`convex/exerciseTypes.ts`). Les deux séances gardent leur propre
 * aiguillage pour les cinq types d'origine.
 */
export const GAME_SCREEN_TYPES = ["fill-blank", "pattern", "pixel-art", "listen", "color-mix"] as const;

export type GameScreenType = (typeof GAME_SCREEN_TYPES)[number];

export function isGameScreenType(type: string): type is GameScreenType {
  return (GAME_SCREEN_TYPES as readonly string[]).includes(type);
}

export default function GameExercise({
  type,
  prompt,
  payload,
  disabled,
  isCorrect,
  onSubmit,
  onSkip,
}: {
  type: GameScreenType;
  prompt: string;
  payload: unknown;
  disabled: boolean;
  isCorrect: boolean | null;
  onSubmit: (answer: string) => void;
  onSkip?: () => void;
}) {
  const common = { prompt, disabled, isCorrect, onSubmit, onSkip };
  switch (type) {
    case "fill-blank":
      return <FillBlankExercise {...common} payload={payload as ComponentProps<typeof FillBlankExercise>["payload"]} />;
    case "pattern":
      return <PatternExercise {...common} payload={payload as ComponentProps<typeof PatternExercise>["payload"]} />;
    case "pixel-art":
      return <PixelArtExercise {...common} payload={payload as ComponentProps<typeof PixelArtExercise>["payload"]} />;
    case "listen":
      return <ListenExercise {...common} payload={payload as ComponentProps<typeof ListenExercise>["payload"]} />;
    case "color-mix":
      return <ColorMixExercise {...common} payload={payload as ComponentProps<typeof ColorMixExercise>["payload"]} />;
  }
}
