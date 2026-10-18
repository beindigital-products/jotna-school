"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { GameFeelBudget } from "./game-feel";
import { useGameFeel } from "./use-game-feel";

/**
 * LA RÉCOMPENSE — ce qui jaillit d'une bonne réponse.
 *
 * Trois choses, en même temps, pendant une seconde : un anneau de lumière
 * qui s'ouvre, des étoiles d'or qui partent en roue, des pièces qui montent
 * en tournant sur leur axe. Par-dessus, deux images plus tard, une pluie de
 * confettis `canvas-confetti`, plafonnée par le budget du niveau (50 riche,
 * 16 sobre, 0 sous `prefers-reduced-motion`, où rien ne jaillit : la tuile
 * verte et la voix de Pio portent le message).
 *
 * TOUT EST EN `transform` ET `opacity`, et tout DISPARAÎT du DOM après 1,3 s :
 * les couches ne s'accumulent pas d'une question à l'autre. Les étoiles sont
 * des SVG, pas des émojis : un émoji dans une couche qui part d'une petite
 * échelle peut rester vide sur iOS.
 *
 * `fire` déclenche : chaque nouvelle valeur (un compteur, l'identifiant de
 * l'exercice) rejoue l'éclat. `null` ne fait rien. `celebrate` ajoute le son
 * « correct » et la vibration ; par défaut non, parce que
 * `answer-feedback.tsx` les joue déjà et qu'un enfant ne doit pas vibrer deux
 * fois pour une réponse.
 *
 * Se pose dans un parent `relative`, prend toute sa surface, ne capte aucun
 * toucher.
 */
const BURST_MS = 1300;
/** Le retard des confettis sur le reste de l'éclat : deux images, le temps que les couches soient posées. */
const CONFETTI_DELAY_MS = 90;

type Burst = { id: number; ring: boolean; stars: number; coins: number };

/**
 * Ce qu'un éclat contient à ce niveau. Sous `prefers-reduced-motion`, rien :
 * le CSS coupe les animations, et un anneau sans animation resterait peint
 * au milieu de la carte comme un cercle jaune immobile.
 */
export function burstLayers(budget: GameFeelBudget, reducedMotion: boolean): Omit<Burst, "id"> {
  if (reducedMotion) return { ring: false, stars: 0, coins: 0 };
  return { ring: true, stars: budget.stars, coins: budget.coins };
}

export function Reward({
  fire,
  celebrate = false,
  className = "",
  onDone,
}: {
  /** Change de valeur pour rejouer l'éclat ; `null` ou `undefined` : rien. */
  fire: number | string | null | undefined;
  /** Joue aussi le son « correct » et la vibration. */
  celebrate?: boolean;
  className?: string;
  onDone?: () => void;
}) {
  const feel = useGameFeel();
  const rootRef = useRef<HTMLDivElement>(null);
  const [burst, setBurst] = useState<Burst | null>(null);

  // Un nouveau `fire` ouvre un éclat : état ajusté pendant le rendu, comme
  // React le recommande, plutôt qu'un `setState` dans un effet.
  const [lastFire, setLastFire] = useState(fire);
  if (fire !== lastFire) {
    setLastFire(fire);
    if (fire !== null && fire !== undefined) {
      setBurst({ id: (burst?.id ?? 0) + 1, ...burstLayers(feel.budget, feel.reducedMotion) });
    }
  }

  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  // Le module des confettis se charge PENDANT que l'enfant cherche, pas au
  // moment du verdict : son premier `import()` (requête, analyse) tombait
  // dans la même image que la tuile qui gonfle et l'alerte qui arrive, et
  // c'est là que le WKWebView gelait. Inutile quand le budget ne tire rien.
  const particles = feel.budget.particles;
  useEffect(() => {
    if (particles > 0) void import("canvas-confetti").catch(() => {});
  }, [particles]);

  // Les effets d'un éclat : la fête du téléphone, les confettis, puis le rangement.
  useEffect(() => {
    if (!burst) return;
    const { id } = burst;
    const { particles } = feel.budget;

    if (celebrate) {
      feel.vibrate("correct");
      feel.sound("correct");
    }

    let cancelled = false;
    // Les confettis partent quelques images APRÈS l'anneau, les étoiles et les
    // pièces : leur toile plein écran, créée au moment du tir, coûtait une
    // centaine de millisecondes au WKWebView dans la même image que les
    // quinze couches de l'éclat et la tuile qui gonfle (mesuré sur le
    // simulateur iPhone 17). Étalés sur deux images, les deux coûts ne
    // s'additionnent plus, et l'œil voit l'éclat puis la pluie.
    let confetti: ReturnType<typeof setTimeout> | null = null;
    if (particles > 0) {
      const origin = confettiOrigin(rootRef.current);
      confetti = setTimeout(() => {
        import("canvas-confetti").then((mod) => {
          if (cancelled) return;
          mod.default({
            particleCount: particles,
            spread: 75,
            startVelocity: 32,
            gravity: 1.1,
            ticks: 150,
            scalar: 0.9,
            zIndex: 60,
            origin,
            colors: CONFETTI_COLORS,
          });
        });
      }, CONFETTI_DELAY_MS);
    }

    const timer = setTimeout(() => {
      setBurst((b) => (b?.id === id ? null : b));
      onDoneRef.current?.();
    }, BURST_MS);
    return () => {
      cancelled = true;
      if (confetti) clearTimeout(confetti);
      clearTimeout(timer);
    };
  }, [burst, celebrate, feel]);

  return (
    <div
      ref={rootRef}
      aria-hidden
      className={`gk-reward gk-motion pointer-events-none absolute inset-0 overflow-visible ${className}`}
    >
      {burst && (
        <div key={burst.id} className="absolute left-1/2 top-1/2 h-0 w-0">
          {/* L'anneau de lumière. */}
          {burst.ring && (
            <span className="absolute -left-10 -top-10 h-20 w-20 rounded-full border-4 border-[#ffd23f] animate-[gk-ring_0.6s_ease-out_forwards]" />
          )}
          {/* Les étoiles, en roue. */}
          {Array.from({ length: burst.stars }, (_, i) => (
            <StarSprite key={`s${i}`} index={i} count={burst.stars} />
          ))}
          {/* Les pièces, qui montent en tournant. */}
          {Array.from({ length: burst.coins }, (_, i) => (
            <Coin key={`c${i}`} index={i} count={burst.coins} />
          ))}
        </div>
      )}
    </div>
  );
}

/* Les couleurs de fête du Monde de Pio (`answer-feedback.tsx`). */
const CONFETTI_COLORS = ["#f97316", "#fbbf24", "#6ab04c", "#38bdf8", "#ec4899"];

/** Où partent les confettis : le centre de la brique, en fractions de l'écran. */
function confettiOrigin(el: HTMLElement | null): { x: number; y: number } {
  if (!el || typeof window === "undefined") return { x: 0.5, y: 0.5 };
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return { x: 0.5, y: 0.5 };
  return {
    x: Math.max(0, Math.min(1, (rect.left + rect.width / 2) / window.innerWidth)),
    y: Math.max(0, Math.min(1, (rect.top + rect.height / 2) / window.innerHeight)),
  };
}

function StarSprite({ index, count }: { index: number; count: number }) {
  const style = {
    "--a": `${Math.round((index * 360) / count)}deg`,
    "--d": `${index % 2 === 0 ? 96 : 72}px`,
    animationDelay: `${(index % 3) * 40}ms`,
  } as CSSProperties;
  return (
    <svg
      viewBox="0 0 24 24"
      className="absolute -left-3 -top-3 h-6 w-6 animate-[gk-star-fly_0.9s_ease-out_forwards]"
      style={style}
    >
      <path
        d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.4l-5.9 3.2 1.3-6.6L2.5 9.4l6.6-.8z"
        fill="#ffd23f"
        stroke="#e9a83a"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Une pièce d'or : un disque qui tourne sur son axe en montant. Un seul
 * disque, pas deux dans un espace `preserve-3d` : chaque espace 3D ouvert au
 * moment de l'éclat coûtait au WKWebView (quatre pièces : près de 90 ms de
 * plus sur l'image du verdict, mesuré sur le simulateur iPhone 17). La
 * tranche se devine par l'anneau cuivré et la perspective du `rotateY`.
 */
function Coin({ index, count }: { index: number; count: number }) {
  const spread = count > 1 ? index / (count - 1) - 0.5 : 0;
  const style = {
    "--x": `${Math.round(spread * 120)}px`,
    "--y": `${-110 - (index % 2) * 30}px`,
    animationDelay: `${index * 70}ms`,
  } as CSSProperties;
  return (
    <span className="absolute -left-3.5 -top-3.5 h-7 w-7 animate-[gk-coin-rise_1.1s_ease-out_forwards]" style={style}>
      <span className="block h-full w-full animate-[gk-spin-y_0.8s_linear_infinite]">
        {/* La face : or franc, un anneau cuivré, un éclat en haut à gauche. */}
        <span
          className="absolute inset-0 rounded-full border-2 border-[#b45309]/70 shadow-[inset_0_0_0_3px_rgb(255_210_63_/_0.9)]"
          style={{ backgroundImage: "radial-gradient(circle at 35% 30%, #ffe27a 0%, #ffb020 45%, #e9a83a 100%)" }}
        />
      </span>
    </span>
  );
}
