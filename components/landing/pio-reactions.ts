"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { PioState } from "@/components/student/pio";
import { pickLine, pioSays } from "@/lib/pioCopy";
import { typeset } from "./typeset";

/**
 * PIO RÉAGIT AU TOUCHER, sur la page d'accueil comme au camp de l'élève
 * (`app/(student)/student/home/page.tsx`) : chaque toucher change sa pose et sa
 * réplique, puis il reprend sa pose de départ. Cinq touchers en deux secondes :
 * la réaction secrète. C'est inutile, et c'est exactement pour cela qu'on y
 * revient.
 *
 * Ses répliques sont celles de `lib/pioCopy.ts`, la même voix que dans
 * l'application : le visiteur entend ce que l'enfant entendra. Passées par
 * `typeset`, pour que « ! » et « ? » ne passent jamais seuls à la ligne.
 */

/** Ce que Pio fait et dit : sa pose, et la phrase de sa bulle. */
export type PioMoment = { pose: PioState; line: string };

/** Les poses d'un toucher : celles du camp. */
export const TAP_POSES: readonly PioState[] = ["hello", "cheer", "amazed", "encourage"];

/** Ses répliques au toucher : celles du camp, sauf celle qui parle du camp, que la page d'accueil n'a pas. */
export const TAP_LINES: readonly string[] = pioSays.tapReactions
  .filter((line) => !/\bcamp\b/.test(line))
  .map(typeset);

/** La réplique de la réaction secrète. */
export const SECRET_LINE = typeset(pioSays.secret);

const TAP_WINDOW_MS = 2000;
const SECRET_TAPS = 5;
/** Combien de temps une réaction dure avant que Pio reprenne sa pose de départ. */
export const REACTION_MS = 2500;

/** Une valeur de la liste, au hasard, autre que `previous` quand la liste le permet. */
function pickOther<T extends string>(values: readonly T[], previous: string | undefined): T {
  const others = values.filter((value) => value !== previous);
  return pickLine(others.length > 0 ? others : values) as T;
}

/**
 * La pose et la réplique à afficher : celles de départ, remplacées pendant
 * `REACTION_MS` par la réaction au dernier toucher.
 *
 * `reacting` dit qu'une réaction est à l'écran : elle dure deux secondes et
 * demie, moins que le temps de charger un clip d'un mégaoctet. On y montre donc
 * l'affiche de la pose, instantanée, et le clip est pour les poses qui restent.
 */
export function usePioReactions(base: PioMoment): { moment: PioMoment; tap: () => void; reacting: boolean } {
  const [reaction, setReaction] = useState<PioMoment | null>(null);
  const taps = useRef<number[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // La dernière réaction : un toucher qui ne changerait rien laisserait croire que Pio n'a pas bougé.
  const last = useRef<PioMoment | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const tap = useCallback(() => {
    const now = Date.now();
    taps.current = [...taps.current.filter((time) => now - time < TAP_WINDOW_MS), now];
    const secret = taps.current.length >= SECRET_TAPS;
    if (secret) taps.current = [];

    const next: PioMoment = secret
      ? { pose: "cheer", line: SECRET_LINE }
      : {
          pose: pickOther(TAP_POSES, last.current?.pose),
          line: pickOther(TAP_LINES, last.current?.line),
        };
    last.current = next;
    setReaction(next);

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setReaction(null), REACTION_MS);
  }, []);

  return { moment: reaction ?? base, tap, reacting: reaction !== null };
}
