"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

import { ExerciseTypes } from "./exercise-types";
import { BTN_PAPER } from "./landing-style";

/**
 * LA GRANDE DÉMO, REPLIÉE. « Essayez comme un élève » (`exercise-types.tsx`)
 * est le meilleur argument de la vitrine, mais elle mesure plus de quatre
 * écrans sur un téléphone. Le mini-jeu (`quick-play.tsx`) donne le goût en
 * trente secondes ; ici, un bouton ouvre toute la démo, par matière et par
 * classe, pour qui veut aller plus loin.
 *
 * Fermée, la démo n'est pas montée : ses banques d'exercices ne se chargent
 * pas. Un lien vers `#exercices` (le bouton de fin du mini-jeu, un lien
 * partagé) l'ouvre.
 */
export function FullDemo() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const openFromHash = () => {
      if (window.location.hash === "#exercices") setOpen(true);
    };
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, []);

  if (open) return <ExerciseTypes />;

  return (
    <section id="exercices" className="mx-auto w-full max-w-3xl px-5 py-12 text-center sm:px-8">
      <h2 className="text-balance font-display text-2xl font-bold text-[#2b1d0e] sm:text-3xl">
        Envie d&apos;essayer la classe de votre enfant ?
      </h2>
      <p className="mt-3 text-base leading-7 text-[#6b563f]">
        Huit matières, six classes, de vrais exercices à jouer ici, sans créer de compte.
      </p>
      <button
        type="button"
        aria-expanded={false}
        onClick={() => setOpen(true)}
        className={`mt-5 cursor-pointer ${BTN_PAPER}`}
      >
        Voir tous les exercices
        <ChevronDown className="size-5" aria-hidden />
      </button>
    </section>
  );
}
