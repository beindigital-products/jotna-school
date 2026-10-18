"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { ACTION_TONES, paleTone, type ActionToneName } from "./tones";
import { useGameFeel } from "./use-game-feel";

/**
 * LE BOUTON D'ACTION 3D — « Valider », en plus abouti que `btn-chunky`.
 *
 * `GameButton` (`btn-chunky`) est le bouton du camp et de la carte : une face
 * en dégradé, 6 px d'épaisseur, il s'enfonce. Celui-ci est le même objet,
 * poussé d'un cran pour la séance, où il est LE geste qui compte :
 *
 * - 8 px d'épaisseur en `lg`, un flanc en couleur pleine et un biseau clair
 *   sur le bord haut de la face (`gk-face-light`), pour que la lumière
 *   vienne d'en haut comme sur les tuiles ;
 * - une ombre sur la table, couche séparée, qui se rapproche à l'appui ;
 * - un reflet qui balaie la face toutes les 2,4 s quand `shine` est vrai
 *   (l'enfant a répondu, le bouton l'appelle), au niveau « riche » seulement ;
 * - désactivé : il s'aplatit (3 px) et pâlit, sans passer en gris : un enfant
 *   doit comprendre « pas encore », pas « cassé ». Il pâlit en COULEURS
 *   OPAQUES (`paleTone`), pas par une opacité : à 0,6, les tuiles qui
 *   défilaient sous le dock se lisaient dans Valider ;
 * - `busy` : le texte devient « … » comme dans `answer-feedback.tsx`.
 *
 * Mêmes teintes que `GameButton` (`ACTION_TONES`), même `href` optionnel qui
 * rend un lien, même sémantique. Le libellé est en Fredoka extra-gras, avec un
 * léger relief sombre sous les lettres pour tenir sur l'orange.
 *
 * LE TEXTE AGRANDI : les hauteurs minimales sont en pixels (64 px en `lg`,
 * 56 en `md`, les cibles du jeu) et les marges latérales petites : le bouton
 * prend toute sa largeur, le libellé est centré, et une marge de 2 rem ne
 * servait qu'à faire déborder « Valider » de sa face à 200 % (« Valide »,
 * relu le 18 octobre 2026). La face ne rogne plus rien : le reflet qui balaie
 * a son propre cadre rogné.
 */
type Size = "md" | "lg";

const SIZES: Record<Size, { depth: number; classes: string }> = {
  md: { depth: 6, classes: "min-h-[56px] px-4 py-2 text-lg" },
  lg: { depth: 8, classes: "min-h-[64px] px-4 py-2 text-xl [@media(max-height:480px)]:min-h-[56px]" },
};

const DISABLED_DEPTH = 3;

export function ActionButton3D({
  children,
  onClick,
  href,
  tone = "orange",
  size = "lg",
  icon,
  disabled = false,
  busy = false,
  shine = false,
  type = "button",
  ariaLabel,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  /** Rend un lien, comme `GameButton`. */
  href?: string;
  tone?: ActionToneName;
  size?: Size;
  icon?: ReactNode;
  disabled?: boolean;
  /** L'action est en cours : le libellé devient « … » et le bouton ne répond plus. */
  busy?: boolean;
  /** Le reflet qui balaie la face : quand la réponse est prête à être validée. */
  shine?: boolean;
  type?: "button" | "submit";
  ariaLabel?: string;
  className?: string;
}) {
  const feel = useGameFeel();
  const { depth: fullDepth, classes } = SIZES[size];
  const inactive = disabled || busy;
  const colors = inactive ? paleTone(ACTION_TONES[tone]) : ACTION_TONES[tone];
  const depth = inactive ? DISABLED_DEPTH : fullDepth;
  const shining = shine && !inactive && feel.rich;

  const rootStyle = { "--gk-depth": `${depth}px` } as CSSProperties;
  // Le bouton pâlit par les couleurs de son flanc et de sa face, jamais par
  // une opacité sur sa racine : elle obligeait le WKWebView à recomposer tout
  // le bouton, ombre comprise, à chaque changement d'état (chaque option
  // touchée le réveille), et laissait voir ce qui passait dessous.
  const rootClass = `gk-action gk-motion group relative block w-full select-none rounded-2xl font-display font-extrabold tracking-wide gk-focus ${
    inactive ? "cursor-not-allowed" : "cursor-pointer"
  } ${className}`;

  const body = (
    <>
      {/* L'ombre sur la table. */}
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-0 rounded-2xl shadow-[0_8px_18px_rgb(60_30_0_/_0.5)] will-change-transform transition-[transform,translate,opacity] duration-150 ease-out ${
          inactive ? "opacity-20" : "opacity-35 group-active:opacity-25 group-active:translate-y-[2px]"
        }`}
        style={{ transform: `translateY(${depth + 2}px)` }}
      />
      {/* Le flanc. */}
      <span
        aria-hidden
        className="absolute inset-0 rounded-2xl transition-transform duration-150"
        style={{ backgroundColor: colors.flank, transform: `translateY(${depth}px)` }}
      />
      {/* La face. */}
      <span
        className={`gk-face-light relative flex items-center justify-center gap-2.5 rounded-2xl border-2 border-white/60 transition-[transform,translate] duration-[90ms] ease-out ${
          inactive ? "" : "group-active:translate-y-[calc(var(--gk-depth)_-_1px)]"
        } ${classes}`}
        style={{
          backgroundImage: `linear-gradient(180deg, ${colors.faceTop} 0%, ${colors.faceBottom} 100%)`,
          color: colors.text,
          textShadow: tone === "white" || inactive ? undefined : "0 1px 0 rgb(0 0 0 / 0.22)",
        }}
      >
        {/* Le reflet du haut, statique. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-2 top-[3px] h-[42%] rounded-xl bg-gradient-to-b from-white/45 to-white/0"
        />
        {/* Le reflet qui balaie, quand le bouton appelle : dans son propre cadre
            rogné, pour que la face, elle, ne rogne jamais son libellé. */}
        {shining && (
          <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
            <span className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-white/0 via-white/45 to-white/0 animate-[gk-shine_2.4s_ease-in-out_infinite]" />
          </span>
        )}
        {icon && <span className="relative shrink-0">{icon}</span>}
        <span className="relative min-w-0">{busy ? "…" : children}</span>
      </span>
    </>
  );

  if (href && !inactive) {
    return (
      <Link href={href} className={rootClass} style={rootStyle} aria-label={ariaLabel}>
        {body}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={() => {
        if (inactive) return;
        feel.vibrate("select");
        onClick?.();
      }}
      className={rootClass}
      style={rootStyle}
      aria-label={ariaLabel}
      aria-busy={busy || undefined}
      disabled={inactive}
    >
      {body}
    </button>
  );
}
