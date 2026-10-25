"use client";

import { forwardRef, type ReactNode } from "react";
import { typesetTile } from "./tile-typeset";
import { shade, TILE_CORRECT_TONE, TILE_WRONG_TONE, tileChosenTone, tileRestTone, type SurfaceTone } from "./tones";

/**
 * LES CASES OÙ L'ON POSE — ce qui reçoit une tuile qu'on glisse.
 *
 * Trois objets, tous peints (dégradés, flancs décalés, ombres fixes), tous
 * dans les teintes de la boîte à outils (`tones.ts`), aucun ne bouge seul :
 *
 * - `StepNumber` : la pierre numérotée d'une marche de la mise en ordre, un
 *   jeton épais dans la couleur de son rang (1, 2, 3…). Les numéros ne bougent
 *   jamais : ce sont les tuiles qui changent de marche.
 * - `StepSlot` : le creux d'une marche, révélé quand sa tuile se soulève. Il
 *   prend toute l'empreinte de la tuile, flanc compris, pour que rien ne
 *   dépasse au repos.
 * - `DropBox` : une boîte du glisser-déposer, vue de face et un peu de
 *   dessus : une paroi du fond en perspective (`rotateX` sur une bande
 *   décorative, le parent donne la perspective), des parois latérales
 *   ombrées, un intérieur clair, une lèvre avant, un flanc de 6 px et une
 *   ombre sur la table. Elle S'ALLUME quand une étiquette la cherche
 *   (une couche de lueur dont seule l'opacité change) et S'ENFONCE quand
 *   l'étiquette passe au-dessus (3 px de transform). Son étiquette (`h4`)
 *   est une plaque accrochée à la paroi du fond.
 *
 * LE CONTRAT DU DOM DE `DropBox` EST TENU PAR LES TESTS : la racine est le
 * nœud que dnd-kit mesure (`ref`) et que l'enfant touche (`onClick`) ; le
 * `h4` est son enfant direct (la galerie, la vitrine et les tests prennent
 * `h4.parentElement` pour la case) ; les étiquettes posées sont ses
 * descendantes. Rien de 3D ne porte `overflow: hidden` ET `preserve-3d`.
 *
 * UNE BOÎTE QUI NOMME UNE CHOSE PEUT MONTRER SON IMAGE (`picture`, une pastille
 * d'imagier que l'écran fournit) : elle se pose dans la plaque, devant le nom,
 * et la plaque passe en `flex-wrap` : l'image et le nom tiennent sur une ligne
 * quand la boîte est large (292 px, trois boîtes empilées) et se rangent l'un sous
 * l'autre quand elle est étroite (138 px, deux ou trois boîtes côte à côte), sans
 * que l'écran ait à le dire. Le `h4` reste l'enfant direct de la boîte, et son nom
 * accessible reste le nom : l'image est décorative (`alt` vide). Sans `picture`,
 * la plaque est celle d'avant, au caractère près.
 */

type CaseState = "repos" | "juste" | "fausse";

function caseTone(tone: number, state: CaseState): SurfaceTone {
  if (state === "juste") return TILE_CORRECT_TONE;
  if (state === "fausse") return TILE_WRONG_TONE;
  return tileChosenTone(tone);
}

/** La pierre numérotée d'une marche : un jeton épais, de 56 px, dans la couleur du rang. */
export function StepNumber({ n, tone, state = "repos" }: { n: number; tone: number; state?: CaseState }) {
  const colors = caseTone(tone, state);
  const text = state === "repos" ? tileRestTone(tone).badgeText : colors.badgeText;
  return (
    <span aria-hidden className="gk-step relative block h-14 w-14 shrink-0 select-none">
      {/* L'ombre sur la table. */}
      <span className="absolute inset-0 rounded-full shadow-[0_5px_10px_rgb(60_30_0_/_0.45)] opacity-35" style={{ transform: "translateY(4px)" }} />
      {/* Le flanc. */}
      <span className="absolute inset-0 rounded-full" style={{ backgroundColor: colors.badge, transform: "translateY(4px)" }} />
      {/* La face, éclairée en haut à gauche. */}
      <span
        className="absolute inset-0 flex items-center justify-center rounded-full border-2 border-white/70 font-display text-2xl font-extrabold shadow-[inset_0_2px_0_rgb(255_255_255_/_0.55),inset_0_-3px_0_rgb(0_0_0_/_0.12)]"
        style={{
          backgroundImage: `radial-gradient(circle at 35% 30%, ${shade(colors.flank, 1.3)} 0%, ${colors.flank} 58%, ${colors.badge} 100%)`,
          color: text,
          textShadow: text === "#ffffff" ? "0 1px 0 rgb(0 0 0 / 0.25)" : undefined,
        }}
      >
        {n}
      </span>
    </span>
  );
}

/** Le creux d'une marche : l'empreinte de la tuile, flanc compris (5 px). */
export function StepSlot({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`gk-slot pointer-events-none absolute inset-x-0 top-0 -bottom-[5px] rounded-2xl border-2 border-dashed border-[#d6c39a] bg-[#fff1cc] shadow-[inset_0_3px_6px_rgb(60_30_0_/_0.14)] ${className}`}
    />
  );
}

/* L'épaisseur d'une boîte, en pixels. */
const BOX_DEPTH = 6;

export const DropBox = forwardRef<
  HTMLDivElement,
  {
    /** L'index de la case (0 à 5) : sa couleur d'option. */
    tone: number;
    /** Le nom de la boîte, tel que la donnée l'écrit : la plaque le compose (`typesetTile`). */
    label: string;
    /** Une image qui nomme la boîte, posée dans la plaque devant son nom (voir l'en-tête). */
    picture?: ReactNode;
    /** Une étiquette est choisie ailleurs : la boîte s'allume, un toucher l'y pose. */
    armed: boolean;
    /** Une étiquette glissée passe au-dessus : la boîte s'enfonce et s'allume. */
    over: boolean;
    /** Pio dit le nom de la boîte (voix des tuiles, CI) : sa plaque s'entoure d'un contour ciel. */
    speaking?: boolean;
    state?: CaseState;
    onClick?: () => void;
    children: ReactNode;
    className?: string;
  }
>(function DropBox({ tone, label, picture, armed, over, speaking = false, state = "repos", onClick, children, className = "" }, ref) {
  const colors = caseTone(tone, state);
  const lit = armed || over;
  // Après le verdict, l'intérieur pâlit : les étiquettes vertes ou ambre
  // restent lisibles sur une boîte de la même famille.
  const inner = state === "repos" ? colors.faceTop : shade(colors.faceTop, 1.5);
  return (
    <div
      ref={ref}
      onClick={onClick}
      data-armed={armed || undefined}
      data-over={over || undefined}
      data-speaking={speaking || undefined}
      data-state={state}
      className={`gk-box gk-motion relative rounded-3xl transition-transform duration-150 ease-out ${
        over ? "translate-y-[3px] scale-[0.99]" : ""
      } ${armed ? "cursor-pointer" : ""} ${className}`}
    >
      {/* L'ombre sur la table : une couche fixe, qui pâlit quand la boîte s'enfonce. */}
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-0 rounded-3xl shadow-[0_10px_18px_rgb(60_30_0_/_0.5)] transition-opacity duration-150 ${
          over ? "opacity-25" : "opacity-45"
        }`}
        style={{ transform: `translateY(${BOX_DEPTH}px)` }}
      />
      {/* Le flanc : l'épaisseur de la boîte. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-3xl"
        style={{ backgroundColor: colors.badge, transform: `translateY(${BOX_DEPTH}px)` }}
      />
      {/* La peinture de l'intérieur : la paroi du fond en perspective, les parois, la lèvre, la lueur. */}
      <span
        aria-hidden
        className="gk-perspective pointer-events-none absolute inset-0 overflow-hidden rounded-3xl border-2 border-white/70"
        style={{ backgroundImage: `linear-gradient(180deg, ${colors.faceBottom} 0%, ${inner} 55%, ${inner} 100%)` }}
      >
        <span
          className="absolute inset-x-0 top-0 h-9 origin-bottom shadow-[inset_0_-3px_0_rgb(255_255_255_/_0.35)]"
          style={{
            backgroundImage: `linear-gradient(180deg, ${colors.badge} 0%, ${colors.flank} 100%)`,
            transform: "rotateX(48deg)",
          }}
        />
        <span className="absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-black/10 to-transparent" />
        <span className="absolute inset-y-0 right-0 w-4 bg-gradient-to-l from-black/10 to-transparent" />
        <span
          className="absolute inset-x-0 bottom-0 h-3.5 shadow-[inset_0_2px_0_rgb(255_255_255_/_0.5)]"
          style={{ backgroundColor: colors.flank }}
        />
        <span
          className={`absolute inset-0 rounded-3xl shadow-[inset_0_0_0_4px_#fbbf24,inset_0_0_28px_rgb(251_191_36_/_0.6)] transition-opacity duration-200 ${
            lit ? "opacity-100" : "opacity-0"
          }`}
        />
      </span>
      {/* La plaque : le nom de la boîte, accroché à la paroi du fond. */}
      <h4
        className={`relative mx-auto mt-1.5 w-fit max-w-[calc(100%-1.5rem)] rounded-xl border-2 border-white/80 bg-[#fff8e6] px-4 py-1.5 text-center font-display text-lg font-extrabold leading-tight shadow-[0_3px_0_#d6c39a] [overflow-wrap:anywhere]${
          picture ? " flex flex-wrap items-center justify-center gap-x-2 gap-y-1" : ""
        }${speaking ? " outline outline-4 outline-offset-2 outline-sky-500" : ""}`}
        style={{ color: colors.text }}
      >
        {picture}
        {typesetTile(label)}
      </h4>
      {/* Les étiquettes posées, dans la boîte. */}
      <div className="relative flex min-h-[4rem] flex-wrap items-start justify-center gap-3 px-3 pb-5 pt-2.5">{children}</div>
    </div>
  );
});
