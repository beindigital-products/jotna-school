"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Map as MapIcon, Tent } from "lucide-react";
import { Pio } from "@/components/student/pio";
import { GameButton } from "@/components/student/game/game-button";
import { pioSays } from "@/lib/pioCopy";

/**
 * LE SENTIER PERDU — ce que voit l'enfant quand un monde ou une thématique ne
 * s'ouvre pas.
 *
 * Plusieurs causes derrière le même écran, et l'enfant n'a pas à les
 * distinguer : l'identifiant ne désigne rien, ou il appartient à une autre
 * classe (`accessRules.topicOpenTo` fait répondre `topics.getById` comme pour
 * une thématique absente). Dans tous les cas, il faut lui rendre un chemin,
 * pas un code d'erreur : un bout de carte au trésor où le sentier s'efface,
 * Pio qui cherche à la loupe, et deux sorties vers le camp et la carte.
 *
 * Les anciens écrans n'avaient qu'un titre et, pour la séance, aucun bouton :
 * l'enfant restait coincé, sans autre issue que le retour du téléphone.
 */
export function LostTrail({ kind }: { kind: "world" | "topic" }) {
  const reducedMotion = useReducedMotion();
  const copy = pioSays.lostTrail[kind];

  return (
    <div className="mx-auto flex min-h-[70dvh] max-w-md items-center justify-center px-4 py-10">
      <motion.div
        initial={reducedMotion ? false : { opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className="relative w-full overflow-hidden rounded-[2rem] border-4 border-amber-200 bg-[#fff8e6] shadow-xl"
      >
        {/* Le bout de carte : ciel, collines, sentier qui s'efface, « ? » au bout. */}
        <div className="relative h-48 overflow-hidden border-b-4 border-dashed border-amber-200 bg-[linear-gradient(180deg,#bfe6fb_0%,#f9efd2_75%)]">
          <svg
            aria-hidden
            viewBox="0 0 320 192"
            className="absolute inset-0 h-full w-full"
            preserveAspectRatio="xMidYMax slice"
          >
            <defs>
              <linearGradient id="lost-trail-fade" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="#b45309" stopOpacity="0.9" />
                <stop offset="65%" stopColor="#b45309" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#b45309" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Nuages */}
            <g fill="#ffffff" opacity="0.85">
              <ellipse cx="214" cy="30" rx="22" ry="8" />
              <ellipse cx="230" cy="25" rx="14" ry="8" />
              <ellipse cx="150" cy="96" rx="18" ry="6" />
            </g>
            {/* Collines */}
            <path d="M0 150 Q60 112 124 140 T244 126 T320 138 V192 H0 Z" fill="#a7d98b" />
            <path d="M0 168 Q84 142 164 164 T320 158 V192 H0 Z" fill="#8cc873" />
            {/* Le sentier, qui s'efface avant d'arriver */}
            <path
              d="M112 176 C150 166 156 132 196 124 S246 92 262 70"
              fill="none"
              stroke="url(#lost-trail-fade)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray="2 14"
            />
            {/* Rose des vents */}
            <g transform="translate(290 28)" opacity="0.75">
              <circle r="15" fill="#fff8e6" stroke="#d6a45a" strokeWidth="2" />
              <path d="M0 -12 L3 0 L0 12 L-3 0 Z" fill="#b45309" />
              <path d="M-12 0 L0 -3 L12 0 L0 3 Z" fill="#d6a45a" />
            </g>
          </svg>

          {/* Le « ? » au bout du sentier */}
          <motion.div
            aria-hidden
            className="absolute left-[72%] top-[28%] flex h-12 w-12 items-center justify-center rounded-full border-4 border-white bg-gradient-to-b from-sky-300 to-sky-500 font-display text-2xl font-extrabold text-white shadow-lg"
            animate={reducedMotion ? undefined : { y: [0, -6, 0], rotate: [0, -6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            ?
          </motion.div>

          {/* Pio cherche, à la loupe */}
          <div className="absolute bottom-1 left-3">
            <Pio state="think" size={108} />
          </div>

          {/* Sa bulle, au-dessus de lui, la queue tournée vers sa tête */}
          <motion.p
            initial={reducedMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.25, ease: "easeOut" }}
            className="absolute left-3 top-3 max-w-[62%] rounded-2xl border-2 border-amber-200 bg-white px-3.5 py-2 font-display text-sm font-bold leading-snug text-amber-950 shadow-md"
          >
            {copy.bubble}
            <span
              aria-hidden
              className="absolute -bottom-2 left-12 h-3.5 w-3.5 rotate-45 rounded-sm border-b-2 border-r-2 border-amber-200 bg-white"
            />
          </motion.p>
        </div>

        {/* Le texte et les deux sorties */}
        <div className="px-6 pb-7 pt-5 text-center">
          <h2 className="font-display text-2xl font-extrabold text-amber-950">
            {copy.title}
          </h2>
          <p className="mx-auto mt-2 max-w-xs text-sm font-semibold text-amber-900/75">
            {pioSays.lostTrail.body}
          </p>

          <div className="mt-6 flex flex-col gap-4">
            <GameButton
              href="/student/map"
              size="lg"
              icon={<MapIcon className="h-5 w-5" aria-hidden />}
              className="w-full"
            >
              {pioSays.lostTrail.toMap}
            </GameButton>
            <GameButton
              href="/student/home"
              tone="white"
              icon={<Tent className="h-5 w-5" aria-hidden />}
              className="w-full border-2 border-amber-200"
            >
              {pioSays.lostTrail.toCamp}
            </GameButton>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
