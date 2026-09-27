"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export function CallToAction() {
  return (
    <section className="px-5 py-20 sm:px-8 sm:py-24">
      <div className="relative mx-auto w-full max-w-5xl overflow-hidden rounded-[32px] bg-[#fdfbf0] shadow-[0_20px_60px_-30px_rgba(60,50,20,0.25)] ring-1 ring-amber-200/50">
        <NotebookLines />
        <MarginLines />
        <Doodles />

        <div className="relative px-6 py-20 text-center sm:px-12">
          <div className="flex flex-col items-center">
            <div className="flex h-10 items-center">
              <PostItBadge />
            </div>

            <div className="flex h-20 items-end">
              <h2 className="relative inline-block font-sans text-3xl font-extrabold leading-none tracking-tight text-gray-900 sm:text-5xl">
                Lance la première{" "}
                <span className="relative inline-block whitespace-nowrap">
                  <span className="relative z-10">session</span>
                  <Highlight />
                </span>
                .
              </h2>
            </div>

            <p className="mx-auto max-w-xl text-base leading-10 text-gray-600 sm:text-lg">
              Créer un compte, choisir une matière, et c&apos;est parti. Aucune
              carte bancaire, aucun téléchargement.
            </p>

            <div className="h-10" />

            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <PrimaryCTA />
              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center rounded-full border border-gray-300 bg-white px-6 py-3.5 text-base font-semibold text-gray-700 transition-colors hover:border-gray-400 hover:bg-gray-50 sm:w-auto"
              >
                J&apos;ai déjà un compte
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function NotebookLines() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundImage:
          "repeating-linear-gradient(to bottom, transparent 0, transparent 31px, rgba(96, 130, 200, 0.3) 31px, rgba(96, 130, 200, 0.3) 32px, transparent 32px, transparent 40px)",
      }}
    />
  );
}

function MarginLines() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0">
      <div className="absolute inset-y-0 left-[58px] w-[1.5px] bg-rose-400/55" />
      <div className="absolute inset-y-0 left-[63px] w-[1.5px] bg-rose-400/55" />
    </div>
  );
}

function PostItBadge() {
  return (
    <motion.span
      initial={{ opacity: 0, y: -8, rotate: -6 }}
      whileInView={{ opacity: 1, y: 0, rotate: -3 }}
      viewport={{ once: true, margin: "-15%" }}
      transition={{ duration: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
      className="inline-flex items-center gap-2 rounded-md bg-amber-200/90 px-3 py-1 text-xs font-semibold text-amber-900 shadow-[2px_3px_0_rgba(180,140,30,0.25)]"
    >
      <span className="size-1.5 rounded-full bg-emerald-500" />
      Prêt en 30 secondes
    </motion.span>
  );
}

function Highlight() {
  return (
    <motion.span
      aria-hidden
      initial={{ scaleX: 0, originX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true, margin: "-20%" }}
      transition={{ duration: 0.7, delay: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
      style={{ transformOrigin: "left center" }}
      className="absolute inset-x-[-2px] bottom-[6%] -z-0 h-[55%] rounded-sm bg-amber-300/70"
    />
  );
}

function Doodles() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 hidden sm:block"
    >
      <motion.svg
        initial={{ opacity: 0, rotate: -20 }}
        whileInView={{ opacity: 1, rotate: -8 }}
        viewport={{ once: true, margin: "-10%" }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="absolute left-[8%] top-[18%] size-12 text-amber-500"
        viewBox="0 0 48 48"
        fill="none"
      >
        <motion.path
          d="M24 6 L27.5 19 L41 19 L30.5 27 L34 40 L24 32 L14 40 L17.5 27 L7 19 L20.5 19 Z"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
        />
      </motion.svg>

      <motion.svg
        initial={{ opacity: 0, scale: 0.6 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-10%" }}
        transition={{ duration: 0.5, delay: 0.55 }}
        className="absolute right-[10%] top-[14%] size-11 text-rose-500"
        viewBox="0 0 48 48"
        fill="none"
      >
        <motion.path
          d="M8 28 L22 40 L40 8"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.6, delay: 0.7, ease: "easeOut" }}
        />
      </motion.svg>

      <motion.svg
        initial={{ opacity: 0, rotate: 10 }}
        whileInView={{ opacity: 1, rotate: 0 }}
        viewport={{ once: true, margin: "-10%" }}
        transition={{ duration: 0.6, delay: 0.9 }}
        className="absolute bottom-[14%] right-[18%] h-14 w-20 text-lime-600"
        viewBox="0 0 80 56"
        fill="none"
      >
        <motion.path
          d="M6 44 Q 30 10, 58 22 L 58 22"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.9, delay: 1, ease: "easeOut" }}
        />
        <motion.path
          d="M58 22 L50 16 M58 22 L52 30"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.4, delay: 1.7, ease: "easeOut" }}
        />
      </motion.svg>

      <motion.svg
        initial={{ opacity: 0, rotate: 15 }}
        whileInView={{ opacity: 1, rotate: 0 }}
        viewport={{ once: true, margin: "-10%" }}
        transition={{ duration: 0.6, delay: 1.1 }}
        className="absolute bottom-[22%] left-[14%] size-9 text-orange-500"
        viewBox="0 0 36 36"
        fill="none"
      >
        <motion.circle
          cx="18"
          cy="18"
          r="12"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.7, delay: 1.2, ease: "easeOut" }}
        />
      </motion.svg>
    </div>
  );
}

function PrimaryCTA() {
  return (
    <motion.div
      animate={{ y: [0, -2, 0] }}
      transition={{
        duration: 3.2,
        repeat: Number.POSITIVE_INFINITY,
        ease: "easeInOut",
      }}
      className="relative w-full sm:w-auto"
    >
      <motion.span
        aria-hidden
        animate={{ scale: [1, 1.08, 1], opacity: [0.35, 0.6, 0.35] }}
        transition={{
          duration: 2.8,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
        className="absolute inset-0 rounded-full bg-amber-300/50 blur-xl"
      />
      <Link
        href="/login"
        className="group relative inline-flex w-full items-center justify-center gap-2 rounded-full bg-gray-900 px-6 py-3.5 text-base font-semibold text-white shadow-[0_10px_30px_-10px_rgba(30,30,30,0.6)] transition-transform hover:-translate-y-0.5 active:scale-[0.98] sm:w-auto"
      >
        Se connecter
        <ArrowRight
          className="size-4 transition-transform group-hover:translate-x-0.5"
          aria-hidden
        />
      </Link>
    </motion.div>
  );
}
