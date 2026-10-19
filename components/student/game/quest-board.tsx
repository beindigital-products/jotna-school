"use client";

import { BookOpen, Star, Flag, Compass, Check, ScrollText } from "lucide-react";
import { motion } from "framer-motion";
import { pioSays } from "@/lib/pioCopy";
import { useDailyQuests } from "@/hooks/use-student-data";

/**
 * LE PANNEAU DES MISSIONS — trois missions du jour, sur une planche de bois.
 *
 * LES MISSIONS SE TIRENT SUR L'APPAREIL (`hooks/use-student-data.ts`) : le
 * tirage est déterministe (élève, jour), donc le téléphone tire les mêmes
 * que le serveur, et elles avancent sans réseau à chaque fin de palier. Le
 * serveur crée sa ligne du jour à la synchronisation de la première séance.
 *
 * `null` = missions coupées par un parent, ou pas d'accès : le panneau
 * n'existe pas, sans message. Un enfant n'a pas à savoir qu'une option a été
 * refusée pour lui.
 */
const ICONS = {
  do_exercises: BookOpen,
  earn_stars: Star,
  validate_palier: Flag,
  play_subject: Compass,
} as const;

export function QuestBoard({ className = "" }: { className?: string }) {
  const daily = useDailyQuests();

  if (daily === null) return null;

  const quests = daily?.quests ?? [];
  const done = quests.filter((q) => q.completedAt !== undefined).length;

  return (
    <section
      aria-label={pioSays.questsIntro}
      className={`relative overflow-hidden rounded-[2rem] border-4 border-amber-700/70 bg-[linear-gradient(180deg,#c98240_0%,#a5602c_100%)] p-4 shadow-xl sm:p-5 ${className}`}
    >
      {/* Le grain du bois */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent 0 9px, rgba(0,0,0,0.18) 9px 10px)" }}
      />

      <div className="relative mb-3 flex items-center justify-between">
        <h2 className="text-outline flex items-center gap-2 font-display text-xl font-extrabold text-white">
          <ScrollText className="h-6 w-6 text-yellow-200" aria-hidden />
          {pioSays.questsIntro}
        </h2>
        {quests.length > 0 && (
          <span className="rounded-full bg-black/25 px-3 py-1 font-display text-sm font-extrabold text-yellow-100">
            {done}/{quests.length}
          </span>
        )}
      </div>

      {daily === undefined ? (
        <div className="relative space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-white/25" />
          ))}
        </div>
      ) : (
        <ul className="relative space-y-2">
          {quests.map((quest, i) => {
            const Icon = ICONS[quest.type];
            const finished = quest.completedAt !== undefined;
            const pct = Math.round((Math.min(quest.progress, quest.target) / quest.target) * 100);
            return (
              <motion.li
                key={quest.key}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`flex items-center gap-3 rounded-2xl border-2 p-3 ${
                  finished ? "border-lime-300 bg-lime-50" : "border-amber-200 bg-[#fff8e6]"
                }`}
              >
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                    finished ? "bg-gradient-to-b from-lime-400 to-green-600 text-white animate-[pop-in_0.5s_ease-out]" : "bg-amber-100 text-amber-800"
                  }`}
                  aria-hidden
                >
                  {finished ? <Check className="h-6 w-6" strokeWidth={3.5} /> : <Icon className="h-6 w-6" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`font-display text-base font-extrabold ${finished ? "text-green-900 line-through decoration-2" : "text-amber-950"}`}>
                    {quest.label}
                  </p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-amber-200/70" aria-hidden>
                      <div
                        className={`h-full rounded-full transition-[width] duration-700 ${finished ? "bg-green-500" : "bg-gradient-to-r from-amber-400 to-orange-500"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="font-display text-xs font-extrabold text-amber-900/80" aria-label={`${quest.progress} sur ${quest.target}`}>
                      {Math.min(quest.progress, quest.target)}/{quest.target}
                    </span>
                  </div>
                </div>
                <span className="inline-flex shrink-0 items-center gap-0.5 font-display text-sm font-extrabold text-amber-700" aria-label="Une étoile à gagner">
                  <Star className={`h-4 w-4 ${finished ? "fill-yellow-400 text-yellow-500" : "text-amber-400"}`} aria-hidden />1
                </span>
              </motion.li>
            );
          })}
        </ul>
      )}

      {daily && daily.allDone && (
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-outline relative mt-3 text-center font-display text-base font-extrabold text-yellow-100"
        >
          {pioSays.questsAllDone} +{daily.bonusStars} étoiles
        </motion.p>
      )}
    </section>
  );
}
