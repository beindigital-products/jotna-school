import { Check } from "lucide-react";

import { BTN_SUN, SHEET, WOOD } from "./landing-style";
import { QuoteRequestButton } from "./quote-request";

/**
 * LES PRIX, DITS SUR LA PAGE (demande du propriétaire, 24 novembre 2026) :
 *
 *   - une famille paie 7 000 F CFA par mois et par enfant ;
 *   - une école demande un devis.
 *
 * Les mêmes mots sont dans les questions fréquentes (`faq.tsx`) : `PRICE_LABEL`
 * et `SCHOOL_PRICE_LABEL` sont les seuls endroits où les changer. Le devis se
 * demande par un formulaire (`quote-request.tsx`) : aucune adresse n'est affichée.
 *
 * Ce que les listes promettent est ce que le site dit déjà ailleurs.
 */
export const PRICE_LABEL = "7 000 F CFA par mois et par enfant";
export const SCHOOL_PRICE_LABEL = "sur devis";

const FAMILY = [
  "Tous les exercices de la classe de l'enfant",
  "Les sept matières du programme officiel sénégalais et l'anglais, du CI au CM2",
  "Le suivi des progrès, chapitre par chapitre",
  "Sur ordinateur, tablette et téléphone",
];

const SCHOOL = [
  "Toutes les classes de l'établissement sur un seul écran",
  "Un code école à partager avec les professeurs",
  "Chaque classe confiée à un professeur",
  "Des modules à activer, comme Arabe & Coran",
];

function Included({ items }: { items: string[] }) {
  return (
    <ul className="mt-6 space-y-2.5 text-left text-base leading-6 text-[#2b1d0e]">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <Check aria-hidden className="mt-0.5 size-5 flex-none text-savanna-leaf-deep" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function Pricing() {
  return (
    <section id="prix" className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#a5602c]">Les prix</p>
        <h2 className="mt-3 text-balance font-display text-3xl font-bold leading-[1.1] text-[#2b1d0e] sm:text-[42px]">
          Un prix par enfant, un devis pour les écoles.
        </h2>
      </div>

      <div className="mx-auto mt-10 grid max-w-4xl gap-6 md:grid-cols-2">
        <div className={`flex ${WOOD}`}>
          <div className={`${SHEET} flex flex-1 flex-col text-center`}>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#a5602c]">Pour les familles</p>
            <p className="mt-3 font-display text-4xl font-bold leading-none text-[#2b1d0e] sm:text-5xl">
              7&nbsp;000&nbsp;F&nbsp;CFA
            </p>
            <p className="mt-2 font-display text-lg font-semibold text-[#a5602c]">par mois et par enfant</p>
            <Included items={FAMILY} />
            <div className="mt-auto pt-7">
              <a href="#commencer" className={`w-full ${BTN_SUN}`}>
                Voir comment s&apos;inscrire
              </a>
            </div>
          </div>
        </div>

        <div className={`flex ${WOOD}`}>
          <div className={`${SHEET} flex flex-1 flex-col text-center`}>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#a5602c]">Pour les écoles</p>
            <p className="mt-3 font-display text-4xl font-bold leading-none text-[#2b1d0e] sm:text-5xl">
              Sur devis
            </p>
            <p className="mt-2 font-display text-lg font-semibold text-[#a5602c]">pour tout l&apos;établissement</p>
            <Included items={SCHOOL} />
            <div className="mt-auto pt-7">
              <QuoteRequestButton className="w-full" />
            </div>
          </div>
        </div>
      </div>

      <p className="mt-6 text-center text-sm leading-6 text-[#6b563f]">
        Les inscriptions ouvriront au lancement.
      </p>
    </section>
  );
}
