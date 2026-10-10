"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Calculator, CheckCircle2 } from "lucide-react";

import { ElegantShape } from "./elegant-shape";
import { StreakFlameIcon, TrophyRibbonIcon } from "./landing-icons";

export function Hero() {
  return (
    <section
      id="accueil"
      className="relative overflow-hidden px-5 pt-16 pb-24 sm:px-8 sm:pt-24 sm:pb-32"
    >
      <BackgroundGradients />

      <div className="relative mx-auto grid w-full max-w-7xl items-center gap-14 lg:grid-cols-[1.1fr_1fr]">
        <div className="text-center lg:text-left">
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800"
          >
            <span
              aria-hidden
              className="size-1.5 rounded-full bg-emerald-500"
            />
            Gratuit, ouvert aux écoles, professeurs et parents
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="mt-5 font-sans text-4xl font-extrabold leading-[1.05] tracking-tight text-gray-900 sm:text-5xl lg:text-[56px]"
          >
            Apprendre devient <RotatingWord />.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-5 max-w-xl text-lg leading-8 text-gray-600 lg:mx-0 lg:max-w-lg mx-auto"
          >
            Des exercices interactifs, des badges à collectionner et un suivi
            clair pour les parents. Jotna aide les enfants à progresser en
            maths, français et bien plus — à leur rythme.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start"
          >
            <Link
              href="/register"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-gray-900 px-6 py-3.5 text-base font-semibold text-white shadow-sm transition-all hover:bg-gray-800 active:scale-[0.98] sm:w-auto"
            >
              Créer un compte gratuit
              <ArrowRight
                className="size-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
            <a
              href="#comment"
              className="inline-flex w-full items-center justify-center rounded-full border border-gray-200 bg-white px-6 py-3.5 text-base font-semibold text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50 sm:w-auto"
            >
              Voir comment ça marche
            </a>
          </motion.div>

          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-gray-500 lg:justify-start"
          >
            {[
              "Adapté CP → CM2",
              "Rapports parents",
              "Sur ordinateur, tablette et mobile",
            ].map((item) => (
              <li key={item} className="inline-flex items-center gap-1.5">
                <CheckCircle2
                  className="size-4 text-emerald-500"
                  aria-hidden
                />
                {item}
              </li>
            ))}
          </motion.ul>
        </div>

        <HeroVisual />
      </div>
    </section>
  );
}

const ROTATING_WORDS = [
  { text: "un jeu", color: "bg-amber-300/80" },
  { text: "une aventure", color: "bg-lime-300/80" },
  { text: "un réflexe", color: "bg-orange-300/80" },
];

function RotatingWord() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((current) => (current + 1) % ROTATING_WORDS.length);
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  const current = ROTATING_WORDS[index];

  return (
    <span className="relative inline-block align-baseline">
      <AnimatePresence mode="wait">
        <motion.span
          key={current.text}
          initial={{ opacity: 0, y: "0.25em", rotateX: -35 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          exit={{ opacity: 0, y: "-0.25em", rotateX: 35 }}
          transition={{ duration: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
          className="relative inline-block whitespace-nowrap"
          style={{ transformStyle: "preserve-3d" }}
        >
          <span className="relative z-10">{current.text}</span>
          <motion.span
            aria-hidden
            layout
            className={`absolute inset-x-0 bottom-1 -z-0 h-3 rounded-full ${current.color}`}
          />
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function BackgroundGradients() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-24 left-1/2 size-[520px] -translate-x-1/2 rounded-full bg-gradient-to-br from-amber-200/60 via-orange-200/50 to-lime-200/50 blur-3xl" />
      <div className="absolute -bottom-20 right-1/4 size-[320px] rounded-full bg-yellow-200/50 blur-3xl" />

      <ElegantShape
        delay={0.3}
        width={420}
        height={110}
        rotate={12}
        gradient="from-amber-400/40"
        className="left-[-8%] top-[12%] md:left-[-3%]"
      />
      <ElegantShape
        delay={0.5}
        width={320}
        height={90}
        rotate={-15}
        gradient="from-lime-400/35"
        className="right-[-4%] top-[65%] md:right-[2%]"
      />
      <ElegantShape
        delay={0.4}
        width={220}
        height={60}
        rotate={-8}
        gradient="from-orange-400/40"
        className="left-[8%] bottom-[6%] md:left-[12%]"
      />
      <ElegantShape
        delay={0.6}
        width={150}
        height={45}
        rotate={20}
        gradient="from-yellow-400/35"
        className="right-[18%] top-[8%] md:right-[22%]"
      />
    </div>
  );
}

function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-md lg:mx-0">
      <motion.div
        initial={{ opacity: 0, y: 20, rotate: -1 }}
        animate={{ opacity: 1, y: 0, rotate: -1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="relative rounded-3xl border border-gray-100 bg-white p-6 shadow-[0_20px_60px_-20px_rgba(245,192,38,0.35)]"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className="flex size-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700"
            >
              <Calculator className="size-5" />
            </span>
            <div>
              <p className="text-xs font-medium text-gray-500">Mathématiques</p>
              <p className="text-sm font-bold text-gray-900">Les fractions</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            En cours
          </span>
        </div>

        <p className="mt-5 text-base font-semibold text-gray-900">
          Combien fait <span className="text-amber-700">½ + ¼</span> ?
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {[
            { label: "¾", correct: true },
            { label: "⅔", correct: false },
            { label: "⅛", correct: false },
            { label: "1", correct: false },
          ].map((opt) => (
            <div
              key={opt.label}
              className={
                opt.correct
                  ? "flex items-center justify-between rounded-xl border-2 border-emerald-400 bg-emerald-50 px-3 py-2.5 text-sm font-bold text-emerald-700"
                  : "flex items-center justify-between rounded-xl border-2 border-gray-100 bg-white px-3 py-2.5 text-sm font-semibold text-gray-700"
              }
            >
              <span>{opt.label}</span>
              {opt.correct && (
                <CheckCircle2 className="size-4 text-emerald-500" aria-hidden />
              )}
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between text-xs font-semibold">
          <span className="text-gray-500">Maîtrise du chapitre</span>
          <span className="text-gray-900">68 %</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "68%" }}
            transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-lime-500"
          />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8, rotate: 10 }}
        animate={{ opacity: 1, scale: 1, rotate: 6 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.8 }}
        className="absolute -right-2 -top-4 flex items-center gap-2 rounded-2xl border border-amber-200 bg-white px-3 py-2 shadow-lg sm:-right-4 sm:-top-6"
      >
        <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-400 to-amber-600 text-white shadow-[0_6px_14px_-6px_rgba(249,115,22,0.6)]">
          <TrophyRibbonIcon className="size-4" />
        </span>
        <div className="pr-1">
          <p className="text-[10px] font-medium text-gray-500">
            Badge débloqué
          </p>
          <p className="text-xs font-bold text-gray-900">Petit matheux</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1 }}
        className="absolute -bottom-5 left-2 flex items-center gap-2 rounded-2xl border border-gray-100 bg-white px-3 py-2 shadow-lg sm:-left-6"
      >
        <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-rose-500 text-white shadow-[0_6px_14px_-6px_rgba(244,63,94,0.55)]">
          <StreakFlameIcon className="size-4" />
        </span>
        <div className="pr-1">
          <p className="text-[10px] font-medium text-gray-500">Série</p>
          <p className="text-xs font-bold text-gray-900">5 jours d&apos;affilée</p>
        </div>
      </motion.div>
    </div>
  );
}
