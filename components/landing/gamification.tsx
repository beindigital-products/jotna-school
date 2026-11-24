"use client";

import { useState } from "react";

import { CauriIcon } from "@/components/student/game/cauri";
import { campItemImageSrc, cardImageSrc } from "@/lib/game-assets";

import { CARD } from "./landing-style";

/**
 * CE QUE L'ENFANT GAGNE : les quatre récompenses du jeu, avec leurs images.
 * Les règles sont celles de `docs/economie-du-jeu.md` : les cauris se gagnent
 * en jouant (paliers, missions du jour, trophées, coffre) et ne s'achètent
 * jamais avec de l'argent ; le coffre du jour donne des cauris et une carte ;
 * le marché vend des objets pour le camp.
 *
 * Le coffre est un bouton : il s'ouvre et se referme, comme dans le jeu.
 */
const CARDS = ["flamant", "girafe", "lamantin"];

export function Gamification() {
  const [open, setOpen] = useState(false);

  return (
    <section id="recompenses" className="bg-[#fdeecb]">
      <div className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#a5602c]">Ce que l&apos;enfant gagne</p>
          <h2 className="mt-3 text-balance font-display text-3xl font-bold leading-[1.1] text-[#2b1d0e] sm:text-[42px]">
            Chaque récompense vient d&apos;un exercice réussi.
          </h2>
          <p className="mt-4 text-base leading-7 text-[#6b563f] sm:text-lg">
            Les cauris se gagnent en jouant. Ils ne s&apos;achètent jamais avec de l&apos;argent.
          </p>
        </div>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <li className={`${CARD} flex flex-col items-center p-5 text-center`}>
            <div className="flex h-32 items-center justify-center">
              <CauriIcon large className="h-24 w-24" />
            </div>
            <h3 className="mt-2 font-display text-xl font-bold text-[#2b1d0e]">Des cauris</h3>
            <p className="mt-1.5 text-[15px] leading-6 text-[#6b563f]">
              La monnaie du jeu. L&apos;enfant en gagne à chaque palier terminé, avec ses missions du jour et
              ses trophées.
            </p>
          </li>

          <li className={`${CARD} flex flex-col items-center p-5 text-center`}>
            <button
              type="button"
              aria-pressed={open}
              aria-label={open ? "Refermer le coffre" : "Ouvrir le coffre"}
              onClick={() => setOpen((o) => !o)}
              className="flex h-32 cursor-pointer items-center justify-center rounded-2xl outline-none transition-transform hover:scale-105 focus-visible:ring-4 focus-visible:ring-[#1e2a4a]/60 motion-reduce:transition-none"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- image du jeu ; `next/image` n'apporte rien sous export statique */}
              <img
                src={`/images/coffre/${open ? "ouvert" : "ferme"}.webp`}
                alt=""
                loading="lazy"
                className="h-auto max-h-32 w-auto"
              />
            </button>
            <h3 className="mt-2 font-display text-xl font-bold text-[#2b1d0e]">Le coffre du jour</h3>
            <p className="mt-1.5 text-[15px] leading-6 text-[#6b563f]">
              Un coffre à ouvrir chaque jour : des cauris et une carte à collectionner. Touchez-le.
            </p>
          </li>

          <li className={`${CARD} flex flex-col items-center p-5 text-center`}>
            <div className="flex h-32 items-center justify-center">
              {CARDS.map((id, i) => (
                // eslint-disable-next-line @next/next/no-img-element -- vignette de carte ; `next/image` n'apporte rien sous export statique
                <img
                  key={id}
                  src={cardImageSrc(id, "lite")}
                  alt=""
                  loading="lazy"
                  className={`-mx-2.5 aspect-square h-auto w-[78px] rounded-xl border-[3px] border-[#fffdf7] object-cover shadow-[0_3px_8px_rgba(43,29,14,0.3)] ${
                    i === 0 ? "-rotate-12" : i === 2 ? "rotate-12" : "z-10 -translate-y-1.5"
                  }`}
                />
              ))}
            </div>
            <h3 className="mt-2 font-display text-xl font-bold text-[#2b1d0e]">Des cartes à collectionner</h3>
            <p className="mt-1.5 text-[15px] leading-6 text-[#6b563f]">
              Flamant, girafe, lamantin : un album d&apos;animaux à compléter.
            </p>
          </li>

          <li className={`${CARD} flex flex-col items-center p-5 text-center`}>
            <div className="flex h-32 items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element -- objet détouré ; `next/image` n'apporte rien sous export statique */}
              <img src={campItemImageSrc("tente")} alt="" loading="lazy" className="h-auto max-h-32 w-auto" />
            </div>
            <h3 className="mt-2 font-display text-xl font-bold text-[#2b1d0e]">Le marché et le camp</h3>
            <p className="mt-1.5 text-[15px] leading-6 text-[#6b563f]">
              Avec ses cauris, l&apos;enfant achète des objets pour son camp : une tente, un djembé, un
              cerf-volant.
            </p>
          </li>
        </ul>

        <p className="mx-auto mt-8 max-w-2xl text-center text-[15px] leading-6 text-[#6b563f]">
          Et toujours : une jauge de maîtrise par chapitre, des badges à débloquer et une série quotidienne.
        </p>
      </div>
    </section>
  );
}
