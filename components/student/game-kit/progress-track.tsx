"use client";

import { Check, Flame, Heart, Star } from "lucide-react";
import { useLayoutEffect, useRef } from "react";
import { useGameFeel } from "./use-game-feel";

/**
 * LA PISTE DE PROGRESSION — le sentier d'une séance, en haut de l'écran.
 *
 * Une séance de dix exercices était une barre orange-rose qui s'étirait. Ici
 * c'est un bout de sentier, comme sur la carte du Monde de Pio : dix pierres,
 * un jeton doré posé sur la pierre du moment, les pierres franchies passées
 * au vert avec leur coche, celles qui attendent en crème. Le jeton AVANCE
 * d'une pierre à l'autre d'un ressort (600 ms), il ne saute pas ; au niveau
 * « riche », il flotte en attendant la réponse.
 *
 * SOUS LE SENTIER, LES ESSAIS en cœurs : cinq au plus
 * (`MAX_ATTEMPTS_PER_EXERCISE`), un cœur se vide à chaque essai manqué, sans
 * secousse ni rouge vif. Un enfant de six ans lit les cœurs sans lire les
 * chiffres. À droite, si on les lui donne, les étoiles déjà gagnées dans la
 * séance. Le sentier a toute la largeur à lui : dix pierres et un jeton ne
 * tiennent pas sur la moitié d'un écran de téléphone.
 *
 * LA POSITION DU JETON EST MESURÉE, pas calculée en pourcentage : les
 * pierres sont des enfants d'une rangée `flex`, le jeton lit la position de
 * la pierre courante (`offsetLeft`) et s'y déplace en `transform`
 * (`translateX`), la seule propriété qu'on anime. Un `ResizeObserver` refait
 * la mesure quand la rangée change de largeur (rotation de la tablette).
 *
 * Ce qui est annoncé : « Question 3 sur 10 », « Encore 4 essais », les
 * étoiles, en texte, pour un lecteur d'écran ; le visuel est `aria-hidden`.
 *
 * SUR LE BOIS (`surface="wood"`, 24 novembre 2026) : l'en-tête de la séance
 * est une planche, comme celle des missions du camp. Les pierres à venir, le
 * pointillé et les cœurs vidés y passent en clair pour rester lisibles ; les
 * pierres franchies, le jeton et le chemin doré ne changent pas.
 *
 * LA SÉRIE ET LE GAIN (`combo`, `gain`, `components/student/game/session-juice.tsx`) :
 * à partir de deux bonnes réponses du premier coup d'affilée, une flamme
 * « ×3 » s'allume à gauche des étoiles et gonfle à chaque réussite (`gk-pop`) ;
 * quand une réponse rapporte des étoiles, le compteur gonfle et un « +3 »
 * s'en détache (`gk-plus-rise`). Deux couches de plus, le temps d'une seconde,
 * en `transform` et en `opacity`.
 */
export type TrackSurface = "cream" | "wood";

/** Les étoiles que la dernière réponse vient de rapporter ; `key` rejoue l'animation. */
export type TrackGain = { amount: number; key: number };

/** À partir de combien de réussites d'affilée la flamme s'affiche. */
const COMBO_SHOWN_FROM = 2;
export type StoneState = "passee" | "courante" | "a-venir";

export function stoneState(index: number, current: number): StoneState {
  if (index < current) return "passee";
  if (index === current) return "courante";
  return "a-venir";
}

const TOKEN = 32;

export function ProgressTrack({
  total,
  current,
  missed = [],
  attemptsLeft,
  attemptsMax = 5,
  stars,
  combo = 0,
  gain,
  surface = "cream",
  className = "",
}: {
  /** Bonnes réponses du premier coup, d'affilée : la flamme s'allume à partir de deux. */
  combo?: number;
  /** Les étoiles que la dernière réponse vient de rapporter : le compteur gonfle. */
  gain?: TrackGain;
  /** Sur quoi le sentier est posé : la crème (défaut) ou la planche de bois de la séance. */
  surface?: TrackSurface;
  /** Nombre d'exercices de la séance. */
  total: number;
  /** Index (base 0) de l'exercice en cours ; `total` quand tout est fini. */
  current: number;
  /** Les index des exercices passés sans réussite : leur pierre reste ambre, sans coche. */
  missed?: readonly number[];
  /** Essais restants sur l'exercice en cours ; absent = pas de cœurs. */
  attemptsLeft?: number;
  attemptsMax?: number;
  /** Étoiles gagnées depuis le début de la séance ; absent = pas de compteur. */
  stars?: number;
  className?: string;
}) {
  const feel = useGameFeel();
  const count = Math.max(1, Math.floor(total));
  const cur = Math.max(0, Math.min(count, Math.floor(current)));
  const done = cur >= count;

  const rowRef = useRef<HTMLDivElement>(null);
  const tokenRef = useRef<HTMLDivElement>(null);
  const stoneRefs = useRef<(HTMLSpanElement | null)[]>([]);

  // La mesure écrit directement le `transform` du jeton : pas d'état React,
  // donc pas de second rendu à chaque question ni à chaque redimensionnement.
  useLayoutEffect(() => {
    const row = rowRef.current;
    const token = tokenRef.current;
    if (!row || !token) return;
    const measure = () => {
      const stone = stoneRefs.current[Math.min(cur, count - 1)];
      if (!stone) return;
      const x = stone.offsetLeft + stone.offsetWidth / 2 - TOKEN / 2;
      token.style.transform = `translate(${x}px, -50%)`;
      token.style.opacity = "1";
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(row);
    return () => observer.disconnect();
  }, [cur, count]);

  const progress = trailProgress(count, cur);
  const wood = surface === "wood";
  const streak = Math.max(0, Math.floor(combo));
  const gained = gain && gain.amount > 0 ? gain : null;
  const hearts =
    attemptsLeft === undefined
      ? null
      : Array.from({ length: Math.max(1, attemptsMax) }, (_, i) => i < attemptsLeft);

  return (
    <div
      role="group"
      aria-label="Progression de la séance"
      className={`gk-progress gk-motion flex flex-col gap-1 ${className}`}
      data-surface={surface}
    >
      <span className="sr-only">
        {done ? `Séance terminée, ${count} questions.` : `Question ${cur + 1} sur ${count}.`}
        {attemptsLeft !== undefined && ` ${attemptsLeft === 1 ? "Encore 1 essai." : `Encore ${attemptsLeft} essais.`}`}
        {stars !== undefined && ` ${stars === 1 ? "1 étoile gagnée." : `${stars} étoiles gagnées.`}`}
        {streak >= COMBO_SHOWN_FROM && ` ${streak} bonnes réponses d'affilée.`}
      </span>

      {/* Le sentier et ses pierres. */}
      <div ref={rowRef} aria-hidden className="relative w-full" style={{ height: TOKEN + 4 }}>
        {/* Le tracé : des pointillés terre, puis le chemin déjà foulé, ambre. */}
        <div
          className={`absolute inset-x-3 top-1/2 h-[3px] -translate-y-1/2 rounded-full border-t-[3px] border-dashed ${
            wood ? "border-[#fff1cc]/45" : "border-[#a5602c]/40"
          }`}
        />
        <div
          className="absolute inset-x-3 top-1/2 h-[5px] -translate-y-1/2 origin-left rounded-full bg-gradient-to-r from-[#f6c452] to-[#e9a83a] shadow-[0_1px_0_rgb(0_0_0_/_0.12)] transition-transform duration-[600ms] ease-out"
          style={{ transform: `translateY(-50%) scaleX(${progress})` }}
        />
        {/* Les pierres. */}
        <div className="absolute inset-0 flex items-center justify-between">
          {Array.from({ length: count }, (_, i) => {
            const state = stoneState(i, cur);
            const missedHere = missed.includes(i);
            return (
              <span
                key={i}
                ref={(el) => {
                  stoneRefs.current[i] = el;
                }}
                data-stone={state}
                className={`relative flex items-center justify-center rounded-full border-2 transition-transform duration-300 ${
                  state === "passee"
                    ? missedHere
                      ? "h-5 w-5 border-white bg-gradient-to-b from-[#fde68a] to-[#f59e0b] shadow-[0_2px_0_#b45309]"
                      : "h-[22px] w-[22px] border-white bg-gradient-to-b from-[#a3e635] to-[#16a34a] text-white shadow-[0_2px_0_#166534]"
                    : state === "courante"
                      ? "h-4 w-4 border-[#e9a83a] bg-[#fff1cc]"
                      : wood
                        ? "h-4 w-4 border-[#f3dca8] bg-[#fff8e6] shadow-[0_2px_0_#5b3516]"
                        : "h-4 w-4 border-[#d6c39a] bg-[#fff8e6] shadow-[0_2px_0_#d6c39a]"
                }`}
              >
                {state === "passee" && !missedHere && <Check className="h-3.5 w-3.5" strokeWidth={4} />}
              </span>
            );
          })}
        </div>
        {/* Le jeton doré, posé sur la pierre du moment. */}
        <div
          ref={tokenRef}
          data-token
          className="gk-spring absolute left-0 top-1/2 opacity-0 transition-transform duration-[600ms]"
          style={{ transform: "translate(0px, -50%)", width: TOKEN, height: TOKEN }}
        >
          <span
            className={`relative block h-full w-full ${feel.budget.drift ? "animate-[gk-bob_2.2s_ease-in-out_infinite]" : ""}`}
          >
            <span className="absolute inset-0 translate-y-[3px] rounded-full bg-[#b45309]" />
            <span
              className="gk-face-light absolute inset-0 flex items-center justify-center rounded-full border-2 border-white/80 text-white"
              style={{ backgroundImage: "linear-gradient(180deg,#ffd23f 0%,#f59e0b 100%)" }}
            >
              <Star className="h-4 w-4 fill-white/90 drop-shadow-[0_1px_0_rgb(0_0_0_/_0.2)]" aria-hidden />
            </span>
          </span>
        </div>
      </div>

      {(hearts || stars !== undefined) && (
        <div aria-hidden className="flex items-center justify-between gap-3 px-1">
          {/* Les cœurs des essais. */}
          {hearts ? (
            <div className="flex items-center gap-0.5">
              {hearts.map((alive, i) => (
                // En pixels (le texte agrandi ne grandit pas les cœurs) ; la
                // transition liste `scale` : en Tailwind v4, `scale-75` écrit la
                // propriété `scale`, et une liste `transform, opacity` ne
                // l'animait pas (le cœur se vidait d'un coup).
                <Heart
                  key={i}
                  data-alive={alive}
                  className={`h-[20px] w-[20px] transition-[transform,scale,opacity] duration-300 ${
                    alive
                      ? wood
                        ? "fill-[#fb7185] text-white drop-shadow-[0_1px_0_rgb(0_0_0_/_0.3)]"
                        : "fill-[#fb7185] text-[#e11d48] drop-shadow-[0_1px_0_rgb(0_0_0_/_0.15)]"
                      : wood
                        ? "scale-75 fill-transparent text-white/55 opacity-80"
                        : "scale-75 fill-transparent text-[#78350f]/35 opacity-70"
                  }`}
                  strokeWidth={2.5}
                />
              ))}
            </div>
          ) : (
            <span />
          )}

          <div className="flex shrink-0 items-center gap-1.5">
            {/* La série : une flamme, à partir de deux réussites du premier coup d'affilée.
                La clé est le compte : à chaque réussite, la pastille est remontée et gonfle. */}
            {streak >= COMBO_SHOWN_FROM && (
              <span
                key={streak}
                data-combo={streak}
                className="inline-flex items-center gap-0.5 rounded-full border-2 border-white bg-[#c2410c] px-[8px] py-[2px] font-display text-sm font-extrabold text-white shadow-[0_2px_0_#7c2d12] animate-[gk-pop_0.45s_ease-out]"
              >
                <Flame className="h-[16px] w-[16px] fill-[#fde047] text-[#fff7c2]" />
                ×{streak}
              </span>
            )}

            {/* Les étoiles de la séance. Un gain : le compteur gonfle, un « +3 » s'en détache. */}
            {stars !== undefined && (
              <span className="relative inline-flex">
                <span
                  key={gained ? gained.key : "repos"}
                  data-stars={stars}
                  className={`inline-flex items-center gap-1 rounded-full border-2 border-white bg-[#fff8e6] px-[10px] py-[2px] font-display text-sm font-extrabold text-[#78350f] ${
                    wood ? "shadow-[0_2px_0_#5b3516]" : "shadow-[0_2px_0_#d6c39a]"
                  } ${gained ? "animate-[gk-pop_0.45s_ease-out]" : ""}`}
                >
                  <Star className="h-[16px] w-[16px] fill-[#ffd23f] text-[#e9a83a]" />
                  {stars}
                </span>
                {gained && (
                  <span
                    key={`gain-${gained.key}`}
                    data-star-gain={gained.amount}
                    className="text-outline pointer-events-none absolute -top-[18px] right-[6px] font-display text-base font-extrabold leading-none text-[#ffd23f] animate-[gk-plus-rise_1.2s_ease-out_both]"
                  >
                    +{gained.amount}
                  </span>
                )}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** La part (0..1) du sentier déjà foulée : la même formule que le tracé ambre. */
export function trailProgress(total: number, current: number): number {
  const count = Math.max(1, Math.floor(total));
  const cur = Math.max(0, Math.min(count, Math.floor(current)));
  return count > 1 ? Math.min(cur, count - 1) / (count - 1) : 1;
}
