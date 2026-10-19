"use client";

import { SpeechBubble } from "@/components/student/game/speech-bubble";
import { Pio } from "@/components/student/pio";
import { useDeviceTier } from "@/hooks/use-device-tier";
import { HERO_BASE } from "./pio-moments";
import { usePioReactions } from "./pio-reactions";
import { useAfterLoad } from "./use-after-load";
import { useMediaQuery } from "./use-media-query";

/**
 * PIO, TOUT EN HAUT DE LA PAGE : le visiteur le voit avant même qu'un enfant ait
 * joué. Il fait coucou et réagit quand on le touche (`pio-reactions.ts`), comme
 * au camp de l'élève.
 *
 * DEUX PLACES, UN SEUL À L'ÉCRAN. Sur un grand écran, il se tient à côté de la
 * carte d'exercice (`CardPio`) ; sur un téléphone, où la carte est sous le
 * premier écran, il salue au-dessus du titre (`GreeterPio`). Le CSS cache
 * l'autre, et `animated` n'allume le clip que de celui qu'on voit.
 *
 * LÉGER D'ABORD. Le HTML pré-rendu et les appareils modestes ne reçoivent que
 * l'affiche WebP de la pose (45 Ko). Le clip animé (300 Ko à 1,5 Mo) ne se
 * charge que sur un appareil « full » (`use-device-tier.ts` : ni économiseur de
 * données, ni 2G, ni petite machine), une fois la page chargée, et jamais pour
 * qui a demandé moins de mouvement (`Pio` le respecte lui-même).
 */

/** Le seuil `lg` de Tailwind : en dessous, la carte d'exercice passe sous le titre. */
const DESKTOP = "(min-width: 1024px)";

function useHeroPio(forDesktop: boolean) {
  const tier = useDeviceTier();
  const loaded = useAfterLoad();
  const desktop = useMediaQuery(DESKTOP);
  const reactions = usePioReactions(HERO_BASE);
  const animated = tier === "full" && loaded && desktop === forDesktop && !reactions.reacting;
  return { ...reactions, animated };
}

/** Sur un grand écran : debout à côté de la carte, sa bulle au-dessus de lui. */
export function CardPio({ className = "" }: { className?: string }) {
  const { moment, tap, animated } = useHeroPio(true);

  return (
    <div className={`hidden flex-col items-center lg:flex ${className}`}>
      <SpeechBubble compact bubbleKey={moment.line}>
        {moment.line}
      </SpeechBubble>
      <button
        type="button"
        onClick={tap}
        aria-label="Faire réagir Pio"
        className="mt-4 cursor-pointer rounded-full outline-none focus-visible:ring-4 focus-visible:ring-amber-400"
      >
        <Pio
          state={moment.pose}
          size={240}
          lite
          animated={animated}
          className="drop-shadow-[0_14px_16px_rgba(60,30,0,0.28)]"
        />
      </button>
    </div>
  );
}

/** Sur un téléphone : au-dessus du titre, Pio fait coucou et sa bulle est à côté de lui. */
export function GreeterPio({ className = "" }: { className?: string }) {
  const { moment, tap, animated } = useHeroPio(false);

  return (
    <div className={`flex items-start justify-center gap-3 lg:hidden ${className}`}>
      <button
        type="button"
        onClick={tap}
        aria-label="Faire réagir Pio"
        className="flex-none cursor-pointer rounded-full outline-none focus-visible:ring-4 focus-visible:ring-amber-400"
      >
        <Pio
          state={moment.pose}
          size={132}
          lite
          animated={animated}
          className="drop-shadow-[0_10px_12px_rgba(60,30,0,0.25)]"
        />
      </button>
      <SpeechBubble compact tail="left" bubbleKey={moment.line} className="mt-4 ml-1 min-w-0">
        {moment.line}
      </SpeechBubble>
    </div>
  );
}
