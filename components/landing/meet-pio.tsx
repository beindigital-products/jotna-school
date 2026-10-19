"use client";

import { useRef, useState, type ComponentType } from "react";
import { useReducedMotion } from "framer-motion";
import { HeartHandshake, PartyPopper, ThumbsUp, Hand, Volume2, type LucideProps } from "lucide-react";

import { SpeechBubble } from "@/components/student/game/speech-bubble";
import { Pio } from "@/components/student/pio";
import { SavannaBackdrop } from "@/components/student/world/savanna-backdrop";
import { useDeviceTier } from "@/hooks/use-device-tier";
import { cn } from "@/lib/utils";
import { Section } from "./section";
import { MEET_BASE, MOMENTS, type MomentId } from "./pio-moments";
import { usePioReactions } from "./pio-reactions";
import { useMediaQuery } from "./use-media-query";
import { useNearViewport } from "./use-near-viewport";

/**
 * FAIRE CONNAISSANCE AVEC PIO, avant que l'enfant ne joue. La mascotte de
 * Jotna School tient ici dans une savane (celle du camp de l'élève), et on peut
 * jouer avec lui : le toucher le fait réagir, et chacun des quatre moments où
 * il parle à l'enfant le fait prendre sa pose et dire sa phrase, la même que
 * dans l'application.
 *
 * LÉGER D'ABORD, comme `hero-pio.tsx` : l'affiche WebP de la pose d'abord, le
 * clip seulement sur un appareil « full », quand la section approche et pour une
 * pose qui dure (un moment choisi) ; la savane peinte (250 Ko) attend elle aussi
 * d'approcher (`painted`), et un appareil modeste a la savane en CSS.
 */

const ICONS: Record<MomentId, ComponentType<LucideProps>> = {
  accueil: Hand,
  reussite: PartyPopper,
  erreur: ThumbsUp,
  difficulte: HeartHandshake,
};

const ICON_TINT: Record<MomentId, string> = {
  accueil: "from-amber-400 to-orange-500",
  reussite: "from-lime-500 to-emerald-600",
  erreur: "from-orange-400 to-amber-600",
  difficulte: "from-sky-500 to-indigo-600",
};

export function MeetPio() {
  const [chosen, setChosen] = useState<MomentId | null>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  // Un peu d'avance : la savane peinte (250 Ko) et le clip sont prêts quand la scène arrive à l'écran.
  const near = useNearViewport(sceneRef, "600px 0px");
  const tier = useDeviceTier();
  const reducedMotion = useReducedMotion();
  // Pio est un clip à taille fixe : sur un petit écran on le prend plus petit, la scène moins haute.
  const wide = useMediaQuery("(min-width: 640px)");

  const story = MOMENTS.find((moment) => moment.id === chosen);
  const { moment, tap, reacting } = usePioReactions(story ?? MEET_BASE);
  const animated = tier === "full" && near && !reacting;

  const choose = (id: MomentId) => {
    const next = chosen === id ? null : id;
    setChosen(next);
    // Sur un téléphone, la liste est sous la scène : on ramène Pio à l'écran pour qu'on le voie réagir.
    if (next) sceneRef.current?.scrollIntoView({ block: "nearest", behavior: reducedMotion ? "auto" : "smooth" });
  };

  return (
    <Section
      id="pio"
      eyebrow="La mascotte"
      title="Faites connaissance avec Pio."
      description="Pio est un lionceau explorateur : il accompagne l'enfant à chaque exercice. Il ne gronde jamais, il encourage, donne un indice et fête chaque progrès. Touchez-le, ou choisissez un moment, pour le voir réagir."
    >
      <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
        <div ref={sceneRef}>
          <SavannaBackdrop
            painted={near}
            className="rounded-[2rem] shadow-xl"
            minHeightClass="min-h-[420px] sm:min-h-[520px]"
          >
            <div className="flex min-h-[420px] flex-col items-center justify-end px-4 pb-7 pt-5 sm:min-h-[520px] sm:pb-8 sm:pt-6">
              <SpeechBubble bubbleKey={moment.line}>{moment.line}</SpeechBubble>
              <button
                type="button"
                onClick={tap}
                aria-label="Toucher Pio"
                className="mt-6 cursor-pointer rounded-full outline-none focus-visible:ring-4 focus-visible:ring-white/80"
              >
                <Pio
                  state={moment.pose}
                  size={wide ? 290 : 240}
                  lite
                  animated={animated}
                  className="drop-shadow-[0_18px_22px_rgba(60,30,0,0.45)]"
                />
              </button>
            </div>
          </SavannaBackdrop>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-gray-500">
            Ce que Pio fait pour l&apos;enfant
          </h3>
          <ul className="mt-4 space-y-2.5 sm:space-y-3">
            {MOMENTS.map((item) => {
              const Icon = ICONS[item.id];
              const active = chosen === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => choose(item.id)}
                    className={cn(
                      "flex w-full cursor-pointer items-start gap-3 rounded-3xl border p-4 text-left transition-all sm:gap-4 sm:p-5",
                      "outline-none focus-visible:ring-4 focus-visible:ring-amber-300",
                      active
                        ? "border-amber-300 bg-amber-50 shadow-md ring-1 ring-amber-200"
                        : "border-gray-100 bg-white hover:border-amber-200 hover:shadow-md",
                    )}
                  >
                    <span
                      aria-hidden
                      className={`flex size-10 flex-none items-center justify-center rounded-2xl bg-gradient-to-br text-white sm:size-11 ${ICON_TINT[item.id]}`}
                    >
                      <Icon className="size-5" />
                    </span>
                    <span>
                      <span className="block text-base font-extrabold text-gray-900 sm:text-lg">{item.title}</span>
                      <span className="mt-1 block text-sm leading-6 text-gray-600">{item.text}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="mt-5 flex items-start gap-2 text-sm leading-6 text-gray-600">
            <Volume2 className="mt-0.5 size-4 flex-none text-amber-700" aria-hidden />
            <span>
              Aux plus petits (CI et CP), Pio lit aussi chaque consigne à voix haute.
            </span>
          </p>
        </div>
      </div>
    </Section>
  );
}
