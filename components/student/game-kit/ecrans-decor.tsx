"use client";

import { Check, X } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { shade } from "./tones";
import { useGameFeel } from "./use-game-feel";

/**
 * LE DÉCOR DES ÉCRANS DE JEU — ce que la frise, l'atelier des couleurs,
 * l'écoute et le dessin sur quadrillage posent sur la table.
 *
 * Quatre matières du Monde de Pio, et rien d'autre : la planche de bois des
 * missions (`#c98240` vers `#a5602c`, grain en `repeating-linear-gradient`,
 * flanc `#7a4a23`), le sable des cartes (`#fff7e0` vers `#f9efd2`, flanc
 * `#d6c39a`), la peinture épaisse (une pastille dont la face est éclairée en
 * haut à gauche et dont le flanc est la même couleur assombrie par `shade`),
 * et les deux médaillons du verdict (vert pour juste, orange pour « presque »,
 * jamais rouge).
 *
 * Tout est peint en statique : dégradés, flancs décalés, ombres fixes. Ce qui
 * bouge est un `transform` ou une `opacity`, coupé sous
 * `prefers-reduced-motion` par la classe `gk-motion` posée à la racine de
 * chaque écran. Aucune de ces briques ne touche aux props des composants
 * d'exercice : elles s'habillent dessous.
 */

/* ── Les matières ────────────────────────────────────────────────────────── */

/** Le grain du bois : de fines lames claires sur le dégradé de la planche. */
const WOOD_FACE =
  "repeating-linear-gradient(90deg, rgba(255,255,255,0.07) 0 2px, rgba(255,255,255,0) 2px 11px), linear-gradient(180deg, #d08a46 0%, #c98240 45%, #a5602c 100%)";

/** Le sable d'une table de jeu : crème en haut, un peu plus chaud en bas. */
const SAND_FACE = "linear-gradient(180deg, #fff7e0 0%, #f9efd2 100%)";

/**
 * Une planche de bois : une étagère pour les pots, la boîte des perles. Flanc
 * de 6 px, ombre sur la table, grain. Le contenu se pose dessus.
 */
export function WoodPlank({
  children,
  className = "",
  contentClassName = "",
}: {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 translate-y-[8px] rounded-3xl opacity-40 shadow-[0_8px_18px_rgb(60_30_0_/_0.6)]"
      />
      <span aria-hidden className="absolute inset-0 translate-y-[6px] rounded-3xl bg-[#7a4a23]" />
      <div
        className={`relative rounded-3xl border-2 border-[#e7b77a]/70 shadow-[inset_0_2px_0_rgb(255_255_255_/_0.35),inset_0_-2px_0_rgb(0_0_0_/_0.12)] ${contentClassName}`}
        style={{ backgroundImage: WOOD_FACE }}
      >
        {children}
      </div>
    </div>
  );
}

/** Une étagère mince : la barre de bois sur laquelle les pots sont debout. */
export function Shelf({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`block h-5 rounded-xl border border-[#e7b77a]/60 shadow-[0_6px_0_#7a4a23,0_14px_20px_-12px_rgba(60,30,0,0.6)] ${className}`}
      style={{ backgroundImage: WOOD_FACE }}
    />
  );
}

/**
 * Une table de sable : la zone de jeu posée dans la carte (la guirlande, les
 * tambours, le laboratoire). Elle prend la couleur du verdict : citron vert
 * et un gonflement quand c'est juste, ambre et un « non » de la tête quand
 * c'est faux. Parent `relative` : la récompense peut s'y poser.
 */
export function SandTable({
  children,
  verdict = null,
  className = "",
}: {
  children: ReactNode;
  verdict?: boolean | null;
  className?: string;
}) {
  const frame =
    verdict === true
      ? "border-lime-300 bg-[linear-gradient(180deg,#f7fee7_0%,#dcfce7_100%)] shadow-[inset_0_2px_0_rgb(255_255_255_/_0.8),0_5px_0_#16a34a,0_14px_24px_-14px_rgba(60,30,0,0.5)] animate-[gk-pop_0.45s_ease-out]"
      : verdict === false
        ? "border-amber-300 bg-[linear-gradient(180deg,#fffbeb_0%,#ffedd5_100%)] shadow-[inset_0_2px_0_rgb(255_255_255_/_0.8),0_5px_0_#ea580c,0_14px_24px_-14px_rgba(60,30,0,0.5)] animate-[gk-shake-soft_0.45s_ease-in-out]"
        : "border-white shadow-[inset_0_2px_0_rgb(255_255_255_/_0.8),0_5px_0_#d6c39a,0_14px_24px_-14px_rgba(60,30,0,0.5)]";
  return (
    <div
      className={`relative rounded-3xl border-2 ${frame} ${className}`}
      style={verdict === null ? { backgroundImage: SAND_FACE } : undefined}
      data-verdict={verdict === null ? "aucun" : verdict ? "juste" : "faux"}
    >
      {children}
    </div>
  );
}

/** La légende d'une zone (« Touche le bon pot : »), dans la voix de Pio. */
export function Caption({ children, onWood = false, className = "" }: { children: ReactNode; onWood?: boolean; className?: string }) {
  return (
    <p
      className={`font-display text-sm font-extrabold tracking-wide ${
        onWood ? "text-[#fff7e0] text-outline" : "text-amber-900/75"
      } ${className}`}
    >
      {children}
    </p>
  );
}

/* ── La peinture ─────────────────────────────────────────────────────────── */

/**
 * Une pastille de peinture épaisse : la pâte bombée (éclairée en haut à
 * gauche), un flanc de la même couleur assombrie, l'ombre sur la table. Un
 * anneau rose (l'accent « dessiner ») l'entoure quand elle est choisie, et
 * elle se soulève un peu. `children` : un numéro de coloriage magique, une
 * icône. Décorative : l'appelant tient le bouton et son nom.
 */
export function PaintBlob({
  color,
  size = 44,
  selected = false,
  children,
  className = "",
}: {
  color: string;
  size?: number;
  selected?: boolean;
  children?: ReactNode;
  className?: string;
}) {
  const face: CSSProperties = {
    backgroundImage: `radial-gradient(circle at 34% 28%, ${shade(color, 1.45)} 0%, ${color} 48%, ${shade(color, 0.82)} 100%)`,
  };
  const depth = Math.max(3, Math.round(size / 11));
  return (
    <span
      aria-hidden
      className={`relative block shrink-0 ${className}`}
      style={{ width: size, height: size, "--gk-depth": `${depth}px` } as CSSProperties}
    >
      {/* L'ombre sur la table, qui s'éloigne quand la pastille se soulève. */}
      <span
        className={`absolute inset-0 rounded-full shadow-[0_5px_10px_rgb(60_30_0_/_0.5)] will-change-transform transition-[transform,translate,opacity] duration-200 ease-out ${
          selected ? "translate-y-[9px] opacity-25" : "translate-y-[4px] opacity-35"
        }`}
      />
      {/* L'objet : il se soulève et grossit un peu quand on le tient. */}
      <span
        className={`gk-spring absolute inset-0 transition-transform duration-[220ms] ${
          selected ? "-translate-y-[3px] scale-[1.08]" : ""
        }`}
      >
        <span className="absolute inset-0 rounded-full" style={{ backgroundColor: shade(color, 0.6), transform: `translateY(${depth}px)` }} />
        <span className="absolute inset-0 flex items-center justify-center rounded-full border-2 border-white/80 ring-1 ring-black/10" style={face}>
          <span className="absolute left-[18%] top-[12%] h-[22%] w-[34%] rounded-full bg-white/60" />
          {children && <span className="relative">{children}</span>}
        </span>
      </span>
      {/* L'anneau du choix : peint une fois, seule son opacité change. */}
      <span
        className={`absolute -inset-1.5 rounded-full border-[3px] border-[#ec4899] transition-opacity duration-200 ${
          selected ? "opacity-100" : "opacity-0"
        }`}
      />
    </span>
  );
}

/* ── Le verdict ──────────────────────────────────────────────────────────── */

/**
 * Le médaillon posé sur le coin d'un objet jugé : la coche verte, ou la croix
 * orange de « presque ». Entre en fondu, jamais depuis `scale(0)`.
 */
export function VerdictMedal({ verdict, className = "" }: { verdict: boolean | null; className?: string }) {
  if (verdict === null) return null;
  return (
    <span
      aria-hidden
      className={`absolute -right-2 -top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-white shadow-[0_2px_0_rgb(0_0_0_/_0.18)] ${
        verdict ? "bg-[#22c55e]" : "bg-[#f97316]"
      } ${className}`}
    >
      {verdict ? <Check className="h-4 w-4" strokeWidth={3.5} /> : <X className="h-4 w-4" strokeWidth={3.5} />}
    </span>
  );
}

/* ── Un petit bouton épais ───────────────────────────────────────────────── */

type PillTone = "orange" | "sky" | "white";

const PILL_TONES: Record<PillTone, { face: string; flank: string; text: string; border: string }> = {
  orange: { face: "linear-gradient(180deg, #fbbf24 0%, #ea580c 100%)", flank: "#b45309", text: "#ffffff", border: "rgba(255,255,255,0.6)" },
  sky: { face: "linear-gradient(180deg, #7dd3fc 0%, #0284c7 100%)", flank: "#0369a1", text: "#ffffff", border: "rgba(255,255,255,0.6)" },
  white: { face: "linear-gradient(180deg, #ffffff 0%, #fff1cc 100%)", flank: "#d6c39a", text: "#78350f", border: "rgba(255,255,255,0.9)" },
};

/**
 * Un petit bouton épais pour les outils d'un jeu (la gomme, « Revoir 3
 * secondes »), là où le grand `ActionButton3D` ne tient pas : 4 px de flanc,
 * une face en dégradé, l'appui qui enfonce. `round` : un disque de 56 px pour
 * une icône seule. `pressed` : l'outil tenu (la gomme choisie), enfoncé et
 * cerclé.
 */
export function PillButton3D({
  children,
  onClick,
  tone = "white",
  icon,
  round = false,
  pressed,
  disabled = false,
  ariaLabel,
  title,
  className = "",
}: {
  children?: ReactNode;
  onClick: () => void;
  tone?: PillTone;
  icon?: ReactNode;
  round?: boolean;
  pressed?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  title?: string;
  className?: string;
}) {
  const feel = useGameFeel();
  const colors = PILL_TONES[tone];
  const depth = pressed ? 1 : 4;
  const shape = round ? "h-14 w-14 rounded-full" : "min-h-12 rounded-2xl px-3 py-2";
  return (
    <button
      type="button"
      onClick={() => {
        if (disabled) return;
        feel.vibrate("tap");
        onClick();
      }}
      disabled={disabled}
      aria-pressed={pressed}
      aria-label={ariaLabel}
      title={title}
      className={`group relative inline-block shrink-0 select-none font-display text-sm font-extrabold leading-tight gk-focus ${shape} ${
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
      } ${className}`}
      style={{ "--gk-depth": `${depth}px` } as CSSProperties}
    >
      <span
        aria-hidden
        className={`absolute inset-0 shadow-[0_5px_10px_rgb(60_30_0_/_0.45)] ${round ? "rounded-full" : "rounded-2xl"} ${
          pressed ? "translate-y-[2px] opacity-20" : "translate-y-[5px] opacity-30"
        }`}
      />
      <span
        aria-hidden
        className={`absolute inset-0 ${round ? "rounded-full" : "rounded-2xl"}`}
        style={{ backgroundColor: colors.flank, transform: `translateY(${depth}px)` }}
      />
      <span
        className={`gk-face-light relative flex h-full w-full items-center justify-center gap-1.5 border-2 transition-transform duration-[90ms] ease-out ${
          round ? "rounded-full" : "rounded-2xl"
        } ${pressed ? "translate-y-[3px]" : ""} ${disabled ? "" : "group-active:translate-y-[calc(var(--gk-depth)_-_1px)]"}`}
        style={{ backgroundImage: colors.face, color: colors.text, borderColor: colors.border }}
      >
        {icon}
        {children}
      </span>
      {pressed && (
        <span aria-hidden className={`pointer-events-none absolute -inset-1 border-[3px] border-[#ec4899] ${round ? "rounded-full" : "rounded-[1.25rem]"}`} />
      )}
    </button>
  );
}
