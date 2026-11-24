"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";

import { LAUNCH_TITLE } from "@/components/launch/launch-copy";
import { SignupLink } from "@/components/launch/signup-gate";
import type { SignupRole } from "@/lib/signup";

import { CardPio, GreeterPio } from "./hero-pio";
import { BTN_PAPER, BTN_SUN, SEGMENT, SEGMENT_ITEM } from "./landing-style";

/**
 * LE HAUT DE LA PAGE SE PASSE AU CAMP DE PIO : le même décor de savane que
 * l'accueil de l'élève, en plein cadre. Le visiteur voit le jeu avant d'en lire
 * une ligne.
 *
 * TROIS LECTEURS, UN CHOIX. Un parent, un professeur et une école ne cherchent
 * pas la même chose : le sélecteur change la phrase, et le bouton d'inscription
 * emporte le rôle choisi (`SignupLink`, qui ouvre la pop-up « Lancement
 * prochainement » tant que le site n'est pas lancé).
 *
 * LE SOLEIL est un bouton : il fait tomber la nuit sur le camp. L'image de nuit
 * ne se télécharge qu'au premier appui.
 */
const DAY = "/images/world/hub-savanna-wide.jpg";
const NIGHT = "/images/world/hub-savanna-night-wide.jpg";

const ROLES: Array<{ role: SignupRole; label: string; pitch: string }> = [
  {
    role: "parent",
    label: "Parent",
    pitch:
      "Votre enfant s'exerce sur le programme de sa classe. Vous voyez ses progrès chapitre par chapitre, pour chacun de vos enfants.",
  },
  {
    role: "professeur",
    label: "Professeur",
    pitch:
      "Créez vos classes, ajoutez vos élèves avec leur code et repérez les difficultés qui reviennent.",
  },
  {
    role: "directeur",
    label: "École",
    pitch:
      "Inscrivez votre établissement, partagez le code école avec vos professeurs et suivez toutes les classes.",
  },
];

const PROOFS = ["Du CI au CM2", "Programme officiel sénégalais", "Ordinateur, tablette, téléphone"];

export function Hero() {
  const [role, setRole] = useState<SignupRole>("parent");
  const [night, setNight] = useState(false);
  const [nightSeen, setNightSeen] = useState(false);
  const current = ROLES.find((r) => r.role === role) ?? ROLES[0];

  // LE HÉROS REMPLIT L'ÉCRAN, moins la barre du menu (4 rem sur un téléphone,
  // 5 rem au-delà) : la section suivante commence au bord bas de la fenêtre,
  // pas au milieu. `svh` et non `vh` : la barre d'adresse d'un téléphone ne le
  // fait pas déborder.
  return (
    <section
      id="accueil"
      className="relative isolate flex min-h-[calc(100svh-4rem)] flex-col overflow-hidden bg-savanna-sky lg:min-h-[calc(100svh-5rem)]"
    >
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-cover bg-bottom"
        style={{ backgroundImage: `url(${DAY})` }}
      />
      {nightSeen ? (
        <div
          aria-hidden
          className={`absolute inset-0 -z-10 bg-cover bg-bottom transition-opacity duration-700 motion-reduce:transition-none ${night ? "opacity-100" : "opacity-0"}`}
          style={{ backgroundImage: `url(${NIGHT})` }}
        />
      ) : null}

      <button
        type="button"
        aria-pressed={night}
        aria-label={night ? "Faire revenir le jour sur le camp" : "Faire tomber la nuit sur le camp"}
        onClick={() => {
          setNightSeen(true);
          setNight((n) => !n);
        }}
        className={`absolute right-4 top-4 z-10 size-12 cursor-pointer rounded-full outline-none transition-transform hover:scale-110 focus-visible:ring-4 focus-visible:ring-white sm:right-8 sm:top-6 sm:size-14 ${
          night
            ? "bg-[radial-gradient(circle_at_35%_35%,#ffffff,#cfd8f5)] shadow-[0_0_0_7px_rgba(207,216,245,0.25)]"
            : "bg-[radial-gradient(circle_at_35%_35%,#fff3b0,#ffb020)] shadow-[0_0_0_7px_rgba(255,176,32,0.28)]"
        }`}
      />

      <div className="mx-auto grid w-full max-w-7xl flex-1 items-end gap-8 px-5 pt-10 sm:px-8 sm:pt-14 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="self-center pb-10 lg:pb-16">
          <span className="inline-flex items-center rounded-full bg-[#fffdf7] px-4 py-1.5 text-sm font-semibold text-[#2b1d0e] shadow-[0_3px_0_#ecd9ac]">
            {LAUNCH_TITLE}
          </span>

          <h1 className="mt-5 text-balance font-display text-[40px] font-bold leading-[1.05] text-white [-webkit-text-stroke:2px_#5e3112] [paint-order:stroke_fill] [text-shadow:0_4px_0_#5e3112,0_10px_18px_rgba(43,29,14,0.35)] sm:text-6xl lg:text-[72px]">
            Apprendre devient <span className="text-savanna-sun">une aventure.</span>
          </h1>

          <div className="mt-6 max-w-xl rounded-3xl bg-[#fffdf7]/92 p-4 shadow-[0_6px_0_rgba(94,49,18,0.22),0_18px_30px_-14px_rgba(43,29,14,0.45)] sm:p-5">
            <div role="group" aria-label="Je suis" className={`${SEGMENT} bg-[#fdeecb]`}>
              {ROLES.map((r) => (
                <button
                  key={r.role}
                  type="button"
                  aria-pressed={r.role === role}
                  onClick={() => setRole(r.role)}
                  className={`${SEGMENT_ITEM} cursor-pointer ${
                    r.role === role ? "bg-[#8a4b1f] text-[#fff8e7]" : "text-[#2b1d0e] hover:bg-[#f6dfae]"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <p aria-live="polite" className="mt-3 min-h-[4.5rem] text-base leading-6 text-[#2b1d0e] sm:min-h-[4.5rem]">
              {current.pitch}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <SignupLink signupRole={role} className={`group ${BTN_SUN}`}>
                S&apos;inscrire
                <ArrowRight className="size-5 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </SignupLink>
              <a href="#jouer" className={BTN_PAPER}>
                Essayer un exercice
              </a>
            </div>
          </div>

          <ul className="mt-5 flex flex-wrap gap-2 text-sm font-medium text-[#2b1d0e]">
            {PROOFS.map((proof) => (
              <li key={proof} className="rounded-full bg-[#fffdf7]/88 px-3 py-1">
                {proof}
              </li>
            ))}
          </ul>

          {/* SUR UN TÉLÉPHONE, PIO SALUE EN BAS : le visiteur lit d'abord le titre,
              le choix du rôle et les boutons ; la mascotte vient après les
              badges, sur le sable, avec sa bulle. Sur un grand écran, c'est
              `CardPio`, à droite. */}
          <GreeterPio className="mt-6" />
        </div>

        <CardPio className="self-end pb-6" />
      </div>
    </section>
  );
}
