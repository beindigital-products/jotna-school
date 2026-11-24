"use client";

import { useState } from "react";

import { SEGMENT, SEGMENT_ITEM, WOOD } from "./landing-style";

/**
 * TROIS ESPACES D'ADULTE, UN ONGLET CHACUN : parent, professeur, école. L'école
 * a le sien, comme les deux autres : c'est elle qui partage le code école et
 * active les modules.
 *
 * LES APERÇUS SONT DES EXEMPLES, dessinés ici avec des noms et des chiffres
 * inventés, et étiquetés « Exemple d'écran ». Ils montrent ce que l'adulte
 * suit ; ce ne sont pas des captures de l'application.
 */
type Row = { title: string; chip: string; warn?: boolean; detail: string; percent?: number };

type Space = { id: string; label: string; title: string; points: string[]; screen: string; rows: Row[] };

const SPACES: Space[] = [
  {
    id: "parent",
    label: "Parent",
    title: "Suivre sans surveiller",
    points: [
      "Un seul compte pour tous vos enfants",
      "Des rapports clairs, chapitre par chapitre",
      "Une notification quand un badge est gagné",
      "Un temps d'écran maîtrisé",
    ],
    screen: "Espace parent",
    rows: [
      { title: "Awa · CE2", chip: "Badge : Petit matheux", detail: "Les fractions", percent: 68 },
      { title: "Modou · CP", chip: "Série : 5 jours", detail: "Lire les syllabes", percent: 39 },
    ],
  },
  {
    id: "professeur",
    label: "Professeur",
    title: "Guider toute la classe",
    points: [
      "Vos classes créées en quelques clics",
      "Un élève ajouté avec son code élève",
      "Le suivi de chaque élève",
      "Les difficultés qui reviennent, repérées pour vous",
      "Des contenus validés avant publication",
    ],
    screen: "Classe CE2 A",
    rows: [
      { title: "Difficulté qui revient", chip: "4 élèves", warn: true, detail: "Les fractions : additionner un demi et un quart" },
      { title: "Awa D.", chip: "En avance", detail: "Conjugaison", percent: 82 },
      { title: "Ibrahima S.", chip: "À accompagner", warn: true, detail: "Les fractions", percent: 22 },
    ],
  },
  {
    id: "ecole",
    label: "École",
    title: "Voir toute l'école",
    points: [
      "Votre établissement inscrit par le directeur",
      "Un code école à partager avec les professeurs",
      "Toutes les classes sur un seul écran",
      "Chaque classe confiée à un professeur",
      "Des modules à activer, comme Arabe & Coran",
    ],
    screen: "Mon école",
    rows: [
      { title: "CI A", chip: "Mme Ndiaye", detail: "28 élèves" },
      { title: "CE2 A", chip: "M. Fall", detail: "31 élèves" },
      { title: "CM2 B", chip: "À confier", warn: true, detail: "Aucun professeur pour le moment" },
    ],
  },
];

export function ForWhom() {
  const [selected, setSelected] = useState(SPACES[0].id);
  const space = SPACES.find((s) => s.id === selected) ?? SPACES[0];

  return (
    <section id="pour-qui" className="bg-[#e3f1d6]">
      <div className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#a5602c]">Pour les adultes</p>
          <h2 className="mt-3 text-balance font-display text-3xl font-bold leading-[1.1] text-[#2b1d0e] sm:text-[42px]">
            L&apos;enfant joue. Vous suivez ses progrès.
          </h2>
          <p className="mt-4 text-base leading-7 text-[#6b563f] sm:text-lg">
            Chaque rôle dispose de son espace.
          </p>
        </div>

        <div className="mt-8 flex justify-center">
          <div role="group" aria-label="Espace" className={`${SEGMENT} bg-savanna-leaf-deep/15`}>
            {SPACES.map((s) => (
              <button
                key={s.id}
                type="button"
                aria-pressed={s.id === selected}
                onClick={() => setSelected(s.id)}
                className={`${SEGMENT_ITEM} cursor-pointer text-[#2b1d0e] ${
                  s.id === selected ? "bg-savanna-sun" : "hover:bg-savanna-leaf-deep/10"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 grid items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]" aria-live="polite">
          <div>
            <h3 className="font-display text-2xl font-bold text-[#2b1d0e] sm:text-3xl">{space.title}</h3>
            <ul className="mt-4 space-y-2.5 text-base leading-6 text-[#2b1d0e]">
              {space.points.map((point) => (
                <li key={point} className="flex gap-3">
                  <span
                    aria-hidden
                    className="mt-1 size-4 flex-none rounded-full bg-savanna-leaf-deep shadow-[inset_0_0_0_4px_#e3f1d6,0_0_0_2px_#3f8a2f]"
                  />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className={WOOD}>
            <div className="grid gap-3 rounded-[14px] bg-[#fffdf7] p-4 text-sm text-[#2b1d0e]">
              <div className="flex items-center gap-3">
                <p className="font-display text-base font-semibold">{space.screen}</p>
                <span className="ml-auto rounded-lg border border-dashed border-[#6b563f] px-2 py-0.5 text-xs font-medium text-[#6b563f]">
                  Exemple d&apos;écran
                </span>
              </div>
              {space.rows.map((row) => (
                <div key={row.title} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2 rounded-xl bg-[#fff8e7] px-3 py-2.5">
                  <p className="min-w-0 font-semibold">{row.title}</p>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      row.warn ? "bg-[#fbe6c8] text-[#8a5200]" : "bg-[#e3f1d6] text-savanna-leaf-deep"
                    }`}
                  >
                    {row.chip}
                  </span>
                  <p className="min-w-0">{row.detail}</p>
                  <span className="tabular-nums">{row.percent === undefined ? "" : `${row.percent} %`}</span>
                  {row.percent === undefined ? null : (
                    <div className="col-span-2 h-2 overflow-hidden rounded-full bg-[#ecd9ac]">
                      <div className="h-full rounded-full bg-savanna-sun" style={{ width: `${row.percent}%` }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
