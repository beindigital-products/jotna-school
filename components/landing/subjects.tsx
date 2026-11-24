"use client";

import { useState } from "react";

import type { ProgrammeSubjectKey } from "@/convex/programme/types";

import { CARD, SHEET, WOOD } from "./landing-style";
import { LANDING_SUBJECTS } from "./landing-subjects";

/**
 * CHAQUE MATIÈRE EST UN MONDE : la section « Matières » montre la carte des
 * mondes de l'espace élève, avec ses vraies images (`public/images/world/mondes`),
 * à la place de huit cartes de texte. Un appui ouvre un monde.
 *
 * Les noms et les descriptions viennent de `landing-subjects.ts`, la liste
 * partagée avec la démo des exercices.
 */
const WORLD_IMAGE: Record<ProgrammeSubjectKey, string> = {
  francais: "francais",
  mathematiques: "maths",
  "eveil-scientifique": "sciences",
  histoire: "histoire",
  geographie: "geographie",
  "instruction-civique": "civique",
  "education-artistique": "arts",
  anglais: "anglais",
};

const CLASSES = ["CI", "CP", "CE1", "CE2", "CM1", "CM2"];

const ARABIC_LEVELS = [
  "L'alphabet : écouter, reconnaître, prononcer, écrire du doigt",
  "Les voyelles : les premières syllabes",
  "Assembler les lettres pour lire un mot",
  "Mes premiers mots",
  "Mes premières sourates, verset par verset",
  "Mémoriser, avec des révisions espacées",
];

const worldSrc = (key: ProgrammeSubjectKey, small = false) =>
  `/images/world/mondes/${WORLD_IMAGE[key]}${small ? "-s" : ""}.webp`;

export function Subjects() {
  const [selected, setSelected] = useState<ProgrammeSubjectKey>("mathematiques");
  const current = LANDING_SUBJECTS.find((s) => s.key === selected) ?? LANDING_SUBJECTS[0];

  return (
    <section id="matieres" className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#a5602c]">Les mondes à explorer</p>
        <h2 className="mt-3 text-balance font-display text-3xl font-bold leading-[1.1] text-[#2b1d0e] sm:text-[42px]">
          Chaque matière est un monde.
        </h2>
        <p className="mt-4 text-base leading-7 text-[#6b563f] sm:text-lg">
          Les sept matières du programme officiel sénégalais, du CI au CM2, et l&apos;anglais. Touchez un
          monde pour voir ce qu&apos;on y apprend.
        </p>
      </div>

      <div
        role="group"
        aria-label="Les mondes"
        className="mt-10 grid grid-cols-4 gap-x-1 gap-y-4 sm:gap-3 lg:grid-cols-8"
      >
        {LANDING_SUBJECTS.map((subject) => {
          const active = subject.key === selected;
          return (
            <button
              key={subject.key}
              type="button"
              aria-pressed={active}
              onClick={() => setSelected(subject.key)}
              className="group flex min-w-0 cursor-pointer flex-col items-center gap-1.5 rounded-2xl p-1 text-center font-display text-[10.5px] font-semibold leading-tight text-[#2b1d0e] outline-none focus-visible:ring-4 focus-visible:ring-[#1e2a4a]/60 sm:text-sm"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- vignette ronde ; `next/image` n'apporte rien sous export statique */}
              <img
                src={worldSrc(subject.key, true)}
                alt=""
                width={192}
                height={192}
                loading="lazy"
                className={`aspect-square h-auto w-full max-w-[76px] rounded-full border-[3px] object-cover transition-transform duration-200 group-hover:-translate-y-1 motion-reduce:transition-none sm:max-w-[112px] sm:border-[5px] ${
                  active
                    ? "scale-105 border-savanna-sun shadow-[0_5px_0_#c97f00]"
                    : "border-[#fffdf7] shadow-[0_5px_0_#ecd9ac]"
                }`}
              />
              {subject.title}
            </button>
          );
        })}
      </div>

      <div className={`mt-6 ${WOOD}`}>
        <div className={`${SHEET} grid items-center gap-5 sm:grid-cols-[200px_1fr] sm:gap-7`} aria-live="polite">
          {/* eslint-disable-next-line @next/next/no-img-element -- image du monde ; `next/image` n'apporte rien sous export statique */}
          <img
            key={current.key}
            src={worldSrc(current.key)}
            alt=""
            width={384}
            height={384}
            loading="lazy"
            className="mx-auto aspect-square h-auto w-full max-w-[200px] rounded-full object-cover"
          />
          <div className="min-w-0">
            <h3 className="font-display text-2xl font-bold text-[#2b1d0e] sm:text-3xl">{current.title}</h3>
            <p className="mt-2 text-base leading-7 text-[#2b1d0e]">{current.description}</p>
            <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Classes">
              {CLASSES.map((klass) => (
                <li key={klass} className="rounded-lg bg-[#fdeecb] px-2.5 py-1 text-sm font-semibold text-[#2b1d0e]">
                  {klass}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className={`${CARD} p-5 sm:p-6`}>
          <span className="inline-block rounded-full bg-[#e3f1d6] px-2.5 py-0.5 text-[11.5px] font-bold uppercase tracking-[0.08em] text-savanna-leaf-deep">
            Disponible
          </span>
          <h3 className="mt-2 font-display text-xl font-bold text-[#2b1d0e]">Arabe &amp; Coran</h3>
          <p className="mt-1 text-base leading-7 text-[#2b1d0e]">
            Un parcours en six niveaux pour apprendre à lire l&apos;arabe, de l&apos;alphabet jusqu&apos;aux
            premières sourates. Chaque niveau prépare le suivant.
          </p>
          <ol className="mt-3 grid gap-x-6 gap-y-2 text-sm leading-6 text-[#2b1d0e] sm:grid-cols-2">
            {ARABIC_LEVELS.map((level, i) => (
              <li key={level} className="flex gap-2.5">
                <span className="flex size-6 flex-none items-center justify-center rounded-full bg-[#e3f1d6] text-xs font-bold text-savanna-leaf-deep">
                  {i + 1}
                </span>
                <span>{level}</span>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-sm leading-6 text-[#6b563f]">
            Ce module est activé par l&apos;école : les élèves d&apos;une école qui ne l&apos;a pas demandé ne le
            voient pas.
          </p>
        </div>
        <div className={`${CARD} self-start p-5 sm:p-6`}>
          <span className="inline-block rounded-full bg-[#fdeecb] px-2.5 py-0.5 text-[11.5px] font-bold uppercase tracking-[0.08em] text-[#a5602c]">
            À venir
          </span>
          <h3 className="mt-2 font-display text-xl font-bold text-[#2b1d0e]">Autres langues</h3>
          <p className="mt-1 text-base leading-7 text-[#2b1d0e]">
            Espagnol, italien et d&apos;autres modules arriveront au fur et à mesure.
          </p>
        </div>
      </div>
    </section>
  );
}
