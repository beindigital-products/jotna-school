"use client";

/**
 * LES EFFETS DU JEU DES BALLONS (`drills.BalloonPick`).
 *
 * `BalloonPop` : le bon ballon éclate. Un éclair, une onde de choc, des
 * lambeaux de sa couleur et des confettis qui retombent. La lettre, elle,
 * n'éclate pas : `BalloonPick` la garde, la fait grandir et briller, parce que
 * c'est elle que l'enfant a trouvée.
 *
 * `AirPuffs` : le ballon faux se dégonfle, l'air s'échappe du nœud en petites
 * bouffées. Rien ne dit « faux » : le ballon s'affaisse, c'est tout.
 *
 * DES ANIMATIONS CSS, PAS FRAMER-MOTION (`app/globals.css`, `balloon-*`).
 * Framer anime ces trajectoires depuis le fil JavaScript, et ce fil est pris
 * au moment de l'éclatement (le son, la voix) : dans le simulateur, les
 * éclats restaient figés au centre un quart de seconde. En CSS, ils tournent
 * sur le compositeur. Chaque éclat
 * porte sa trajectoire en variables (`--x`, `--y`…) et reste invisible
 * jusqu'à son départ (`opacity: 0` hors animation, `forwards` sans
 * `backwards`).
 *
 * Formes dessinées, pas d'émoji : dans la vue web d'iOS, un émoji qui part de
 * l'échelle 0 peut ne jamais s'afficher. Les tirages viennent d'un générateur
 * à graine (`seed`) : le rendu reste pur, et un même ballon éclate toujours
 * de la même façon. Sous `prefers-reduced-motion`, rien ne vole.
 */

import { useMemo, type CSSProperties } from "react";
import { useReducedMotion } from "framer-motion";

/**
 * L'instant où l'enveloppe crève, après son dernier gonflement (secondes).
 * Les éclats partent à ce moment-là ; nés plus tôt, ils se voyaient au centre
 * du ballon encore entier, comme une bille à l'intérieur. `BalloonPick` règle
 * l'enveloppe, la lettre, la voix et le son sur la même valeur.
 */
export const BURST_DELAY = 0.14;

/** Les couleurs des confettis, communes à tous les ballons. */
const CONFETTI_COLORS = ["#fbbf24", "#f472b6", "#38bdf8", "#34d399", "#a78bfa", "#fb923c", "#ffffff"];

/** Un générateur pseudo-aléatoire à graine (mulberry32). */
function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const between = (random: () => number, min: number, max: number) => min + random() * (max - min);

/** Une graine stable tirée d'un texte (FNV-1a) : un ballon, une question. */
export function seedOf(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Un style avec des variables CSS (`--x`…), que `CSSProperties` ne connaît pas. */
type FxStyle = CSSProperties & Record<`--${string}`, string>;

const px = (value: number) => `${value.toFixed(1)}px`;

/**
 * Un éclat centré sur son point de départ, invisible tant qu'il n'est pas
 * parti. Chacun a son calque (`will-change`) : le compositeur le déplace sans
 * le redessiner, ce qui compte sur un téléphone modeste.
 */
function piece(width: number, height: number, animation: string, extra: FxStyle = {}): FxStyle {
  return {
    width,
    height,
    marginLeft: -width / 2,
    marginTop: -height / 2,
    opacity: 0,
    willChange: "transform, opacity",
    animation,
    ...extra,
  };
}

function popParticles(seed: number) {
  const random = seeded(seed);
  const shreds = Array.from({ length: 10 }, (_, i) => {
    const angle = (i / 10) * Math.PI * 2 + between(random, -0.25, 0.25);
    const distance = between(random, 62, 112);
    const y = Math.sin(angle) * distance * 0.85;
    return {
      x: Math.cos(angle) * distance,
      y,
      fall: y + between(random, 30, 60),
      rotate: between(random, -540, 540),
      w: between(random, 10, 18),
      h: between(random, 6, 11),
      radius: `${between(random, 20, 60)}% ${between(random, 40, 80)}% ${between(random, 20, 60)}% ${between(random, 40, 80)}%`,
    };
  });
  const confetti = Array.from({ length: 22 }, (_, i) => {
    // Surtout vers le haut, un peu sur les côtés : ils montent, puis retombent.
    const angle = -Math.PI / 2 + between(random, -1.25, 1.25);
    const distance = between(random, 90, 170);
    const round = random() < 0.3;
    const peak = Math.sin(angle) * distance;
    return {
      x: Math.cos(angle) * distance,
      peak,
      fall: peak + between(random, 110, 190),
      rotate: between(random, -720, 720),
      w: round ? 7 : between(random, 5, 8),
      h: round ? 7 : between(random, 9, 13),
      round,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      duration: between(random, 1.1, 1.45),
      delay: between(random, 0, 0.08),
    };
  });
  const sparkles = Array.from({ length: 6 }, (_, i) => {
    const angle = (i / 6) * Math.PI * 2 + between(random, -0.3, 0.3);
    const distance = between(random, 52, 72);
    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance - 12,
      size: between(random, 14, 22),
      delay: 0.15 + i * 0.07,
    };
  });
  return { shreds, confetti, sparkles };
}

/** Une étoile à quatre branches, pour les éclats qui scintillent autour de la lettre. */
function SparkleShape({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden className="block">
      <path
        d="M12 0C13 7 17 11 24 12C17 13 13 17 12 24C11 17 7 13 0 12C7 11 11 7 12 0Z"
        fill="#fde047"
        stroke="#ffffff"
        strokeWidth="1.2"
      />
    </svg>
  );
}

/**
 * L'éclatement, centré sur le ballon. `color` est la teinte du caoutchouc,
 * `light` celle de l'onde de choc.
 */
export function BalloonPop({
  show,
  color,
  light,
  seed,
}: {
  show: boolean;
  color: string;
  light: string;
  seed: number;
}) {
  const reduce = useReducedMotion();
  const { shreds, confetti, sparkles } = useMemo(() => popParticles(seed), [seed]);
  if (!show || reduce) return null;

  return (
    <span aria-hidden className="pointer-events-none absolute left-1/2 top-16 z-20 h-0 w-0">
      {/* L'éclair : le « pop » qu'on voit. */}
      <span
        className="absolute block rounded-full"
        style={piece(128, 128, `balloon-flash 0.3s ease-out ${BURST_DELAY}s forwards`, {
          background: "radial-gradient(circle, #fffbeb 0%, rgba(255,255,255,0.85) 30%, rgba(255,255,255,0) 68%)",
        })}
      />
      {/* L'onde de choc. */}
      <span
        className="absolute block rounded-full"
        style={piece(100, 100, `balloon-ring 0.55s ease-out ${BURST_DELAY}s forwards`, {
          border: `4px solid ${light}`,
        })}
      />
      {/* Les lambeaux du ballon : ils partent, tournent et retombent. */}
      {shreds.map((shred, i) => (
        <span
          key={`shred-${i}`}
          className="absolute block"
          style={piece(shred.w, shred.h, `balloon-shred 0.75s linear ${BURST_DELAY}s forwards`, {
            background: color,
            borderRadius: shred.radius,
            "--x": px(shred.x),
            "--y": px(shred.y),
            "--fall": px(shred.fall),
            "--r": `${shred.rotate.toFixed(0)}deg`,
          })}
        />
      ))}
      {/* Les confettis : ils montent, puis la pesanteur les reprend. */}
      {confetti.map((bit, i) => (
        <span
          key={`confetti-${i}`}
          className={`absolute block ${bit.round ? "rounded-full" : "rounded-[2px]"}`}
          style={piece(
            bit.w,
            bit.h,
            `balloon-confetti ${bit.duration.toFixed(2)}s linear ${(BURST_DELAY + bit.delay).toFixed(2)}s forwards`,
            {
              background: bit.color,
              boxShadow: bit.color === "#ffffff" ? "0 0 0 1px rgba(251,191,36,0.6)" : undefined,
              "--x": px(bit.x),
              "--x2": px(bit.x * 1.15),
              "--peak": px(bit.peak),
              "--fall": px(bit.fall),
              "--r": `${bit.rotate.toFixed(0)}deg`,
            },
          )}
        />
      ))}
      {/* Les éclats qui scintillent autour de la lettre libérée. */}
      {sparkles.map((sparkle, i) => (
        <span
          key={`sparkle-${i}`}
          className="absolute block"
          style={piece(
            sparkle.size,
            sparkle.size,
            `balloon-sparkle 0.75s ease-out ${(BURST_DELAY + sparkle.delay).toFixed(2)}s forwards`,
            { "--x": px(sparkle.x), "--y": px(sparkle.y) },
          )}
        >
          <SparkleShape size={sparkle.size} />
        </span>
      ))}
    </span>
  );
}

/** L'air qui s'échappe du nœud d'un ballon qui se dégonfle. */
export function AirPuffs({ show, seed }: { show: boolean; seed: number }) {
  const reduce = useReducedMotion();
  const puffs = useMemo(() => {
    const random = seeded(seed * 7919 + 1);
    return Array.from({ length: 6 }, (_, i) => {
      const side = i % 2 === 0 ? -1 : 1;
      return {
        x: side * between(random, 16, 40),
        y: between(random, 16, 36),
        size: between(random, 13, 21),
        delay: 0.25 + i * 0.08,
      };
    });
  }, [seed]);
  if (!show || reduce) return null;

  return (
    <span aria-hidden className="pointer-events-none absolute left-1/2 top-[8.25rem] z-20 h-0 w-0">
      {puffs.map((puff, i) => (
        <span
          key={i}
          className="absolute block rounded-full bg-white/90"
          style={piece(puff.size, puff.size, `balloon-puff 0.8s ease-out ${puff.delay.toFixed(2)}s forwards`, {
            boxShadow: "0 0 0 2px rgba(148,163,184,0.5)",
            "--x": px(puff.x),
            "--y": px(puff.y),
          })}
        />
      ))}
    </span>
  );
}
