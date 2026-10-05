"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  BookOpen,
  Calculator,
  FlaskConical,
  Globe2,
  type LucideIcon,
} from "lucide-react";

import {
  MasteryGaugeIcon,
  StreakFlameIcon,
  TrophyRibbonIcon,
} from "./landing-icons";
import { Section } from "./section";
import { NumberTicker } from "@/components/ui/number-ticker";

type BadgeItem = {
  icon: LucideIcon;
  label: string;
  unlocked: boolean;
};

const BADGES: BadgeItem[] = [
  { icon: Calculator, label: "Petit matheux", unlocked: true },
  { icon: BookOpen, label: "Lecteur curieux", unlocked: true },
  { icon: FlaskConical, label: "Apprenti savant", unlocked: false },
  { icon: Globe2, label: "Globe-trotteur", unlocked: false },
];

const MASTERY = [
  { name: "Les fractions", pct: 82, color: "bg-amber-500" },
  { name: "Conjugaison", pct: 54, color: "bg-orange-500" },
  { name: "Le vivant", pct: 31, color: "bg-lime-600" },
];

const STREAK_DAYS = [1, 2, 3, 4, 5, 6, 7];

function MasteryCard() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15%" });

  return (
    <article
      ref={ref}
      className="rounded-3xl border border-gray-100 bg-white p-6"
    >
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-[0_8px_18px_-8px_rgba(245,158,11,0.55)]">
          <MasteryGaugeIcon className="size-5" />
        </span>
        <div>
          <h3 className="text-lg font-extrabold text-gray-900">Maîtrise</h3>
          <p className="text-xs text-gray-500">Jauge par chapitre</p>
        </div>
      </div>
      <div className="mt-6 space-y-4">
        {MASTERY.map((row, i) => (
          <div key={row.name}>
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-gray-700">{row.name}</span>
              <span className="tabular-nums text-gray-900">
                <NumberTicker value={row.pct} duration={1.4} />%
              </span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-gray-100">
              <motion.div
                initial={{ width: "0%" }}
                animate={inView ? { width: `${row.pct}%` } : { width: "0%" }}
                transition={{
                  duration: 1.4,
                  delay: 0.2 + i * 0.18,
                  ease: [0.22, 0.61, 0.36, 1],
                }}
                className={`h-full rounded-full ${row.color}`}
              />
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function BadgesCard() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15%" });

  return (
    <article
      ref={ref}
      className="rounded-3xl border border-gray-100 bg-white p-6"
    >
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-amber-600 text-white shadow-[0_8px_18px_-8px_rgba(249,115,22,0.55)]">
          <TrophyRibbonIcon className="size-5" />
        </span>
        <div>
          <h3 className="text-lg font-extrabold text-gray-900">Badges</h3>
          <p className="text-xs text-gray-500">À collectionner</p>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-4 gap-2">
        {BADGES.map((b, i) => {
          const Icon = b.icon;
          return (
            <motion.div
              key={b.label}
              initial={{ opacity: 0, scale: 0.6, y: 12 }}
              animate={
                inView
                  ? { opacity: b.unlocked ? 1 : 0.55, scale: 1, y: 0 }
                  : { opacity: 0, scale: 0.6, y: 12 }
              }
              transition={{
                duration: 0.5,
                delay: 0.2 + i * 0.1,
                ease: [0.22, 0.61, 0.36, 1],
              }}
              className={
                b.unlocked
                  ? "flex flex-col items-center gap-1.5 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-center"
                  : "flex flex-col items-center gap-1.5 rounded-2xl border border-gray-100 bg-gray-50 p-3 text-center"
              }
            >
              <motion.span
                aria-hidden
                animate={
                  b.unlocked && inView
                    ? {
                        rotate: [0, -8, 8, 0],
                        transition: {
                          duration: 0.6,
                          delay: 0.6 + i * 0.1,
                          ease: "easeInOut",
                        },
                      }
                    : {}
                }
                className={
                  b.unlocked
                    ? "flex size-8 items-center justify-center rounded-xl bg-amber-100 text-amber-700"
                    : "flex size-8 items-center justify-center rounded-xl bg-gray-100 text-gray-500"
                }
              >
                <Icon className="size-4" />
              </motion.span>
              <span className="text-[10px] font-semibold leading-tight text-gray-700">
                {b.label}
              </span>
            </motion.div>
          );
        })}
      </div>
      <p className="mt-5 text-xs text-gray-500">
        Plus de 20 badges à débloquer au fil des chapitres.
      </p>
    </article>
  );
}

function StreakCard() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15%" });

  return (
    <article
      ref={ref}
      className="rounded-3xl border border-gray-100 bg-gradient-to-br from-lime-500 via-lime-600 to-emerald-700 p-6 text-white"
    >
      <div className="flex items-center gap-3">
        <motion.span
          animate={
            inView
              ? {
                  scale: [1, 1.15, 1],
                  transition: {
                    duration: 1.6,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  },
                }
              : {}
          }
          className="flex size-10 items-center justify-center rounded-xl bg-white/20 text-white"
        >
          <StreakFlameIcon className="size-5" />
        </motion.span>
        <div>
          <h3 className="text-lg font-extrabold">Série quotidienne</h3>
          <p className="text-xs text-white/70">Un peu chaque jour</p>
        </div>
      </div>
      <div className="mt-6 flex h-[72px] items-end gap-1.5">
        {STREAK_DAYS.map((d, i) => {
          const filled = d <= 5;
          const targetHeight = 16 + d * 6;
          return (
            <div
              key={d}
              className="flex flex-1 flex-col items-center gap-1"
            >
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={
                  inView
                    ? {
                        height: `${targetHeight}px`,
                        opacity: filled ? 0.95 : 0.35,
                      }
                    : { height: 0, opacity: 0 }
                }
                transition={{
                  duration: 0.7,
                  delay: 0.2 + i * 0.08,
                  ease: [0.22, 0.61, 0.36, 1],
                }}
                className="w-full rounded-md bg-white"
              />
              <span
                className={`text-[10px] font-semibold ${filled ? "" : "opacity-50"}`}
              >
                J{d}
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-5 text-sm font-semibold">
        <NumberTicker value={5} duration={0.8} /> jours d&apos;affilée —
        bravo&nbsp;!
      </p>
    </article>
  );
}

export function Gamification() {
  return (
    <Section
      id="gamification"
      eyebrow="Gamification"
      title="La motivation, intégrée au parcours."
      description="Rien d'artificiel : chaque récompense traduit une vraie compétence acquise."
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <MasteryCard />
        <BadgesCard />
        <StreakCard />
      </div>
    </Section>
  );
}
