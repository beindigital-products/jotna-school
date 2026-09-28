"use client";

import Link from "next/link";
import type { ReactNode } from "react";

/**
 * LE BOUTON DE JEU — épais, coloré, qui s'enfonce quand on appuie.
 *
 * Un bouton plat dit « formulaire ». Un bouton avec une épaisseur dit
 * « appuie-moi », et c'est ce qu'un enfant de huit ans attend d'un jeu. La
 * mécanique est dans l'utilitaire `btn-chunky` de `globals.css` ; ici, les
 * teintes et les tailles.
 *
 * `href` rend un lien, sinon un bouton : même apparence, sémantique juste.
 */
type Tone = "orange" | "green" | "sky" | "white" | "red";
type Size = "md" | "lg";

const TONES: Record<Tone, { face: string; depth: string }> = {
  orange: {
    face: "bg-gradient-to-b from-amber-400 to-orange-500 text-white",
    depth: "#b45309",
  },
  green: {
    face: "bg-gradient-to-b from-lime-400 to-green-600 text-white",
    depth: "#166534",
  },
  sky: {
    face: "bg-gradient-to-b from-sky-300 to-sky-500 text-white",
    depth: "#0369a1",
  },
  white: {
    face: "bg-white text-amber-900",
    depth: "#d6c39a",
  },
  // Rouge doux : l'action qui sort du jeu (se déconnecter). Distincte des tons
  // d'action « dans le jeu », sans être alarmante pour un enfant.
  red: {
    face: "bg-gradient-to-b from-rose-400 to-red-600 text-white",
    depth: "#991b1b",
  },
};

const SIZES: Record<Size, string> = {
  md: "min-h-12 px-5 py-2.5 text-base",
  lg: "min-h-14 px-7 py-3.5 text-lg",
};

type Props = {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  tone?: Tone;
  size?: Size;
  icon?: ReactNode;
  className?: string;
  ariaLabel?: string;
  disabled?: boolean;
};

export function GameButton({
  children,
  href,
  onClick,
  tone = "orange",
  size = "md",
  icon,
  className = "",
  ariaLabel,
  disabled = false,
}: Props) {
  const t = TONES[tone];
  const classes = `btn-chunky inline-flex items-center justify-center gap-2 rounded-2xl font-display font-extrabold tracking-wide select-none ${t.face} ${SIZES[size]} ${
    disabled ? "opacity-60 pointer-events-none" : ""
  } ${className}`;
  const style = { "--btn-depth": t.depth } as React.CSSProperties;

  if (href && !disabled) {
    return (
      <Link href={href} className={classes} style={style} aria-label={ariaLabel}>
        {icon}
        <span>{children}</span>
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={classes}
      style={style}
      aria-label={ariaLabel}
      disabled={disabled}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}
