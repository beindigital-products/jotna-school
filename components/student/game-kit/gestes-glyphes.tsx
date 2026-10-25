/**
 * LE CONTENU D'UNE TUILE QU'ON SAISIT — grand quand il se lit par l'image.
 *
 * Au CI, une tuile d'association ou une étiquette à glisser porte souvent une
 * rangée de mangues, une forme, un chiffre : pas un mot. Un enfant de six ans
 * ne lit pas, il reconnaît. Ce contenu-là s'affiche GRAND (28 px, les émojis
 * font alors 34 px environ) et espacé pour que les émojis d'une rangée ne se
 * touchent pas. Un mot ou une syllabe garde la taille de la tuile et peut se
 * couper n'importe où plutôt que de déborder (« bissap » dans une tuile
 * étroite), mais SEULEMENT s'il ne tient pas sur sa ligne : pas d'`hyphens: auto`,
 * qui coupait aussi des mots qui tiennent (« parta- ⏎ gés », « pen- ⏎ dant » dans
 * les « relier » de problèmes, audit visuel d'octobre 2026), comme `Tile3D`.
 *
 * LE TEXTE AFFICHÉ EST COMPOSÉ (`typesetTile`) : l'espace avant « ? ! : ; » est
 * insécable, un calcul ne se coupe pas autour de ses opérateurs. Le texte reçu,
 * lui, ne change pas : c'est lui que l'écran compare et envoie.
 *
 * Pure fonction + un fragment : aucun hook, utilisable partout, testable.
 */

import { isClockEmoji } from "./choix-texte";
import { typesetTile } from "./tile-typeset";

/** Longueur au-delà de laquelle une suite de glyphes redevient du texte courant. */
const MAX_GLYPHS = 16;

/**
 * Vrai quand un texte n'a aucune lettre : des émojis, des chiffres, des
 * formes, un petit calcul (« 3 + 4 »). Faux pour un mot, une syllabe, une
 * phrase, et pour une rangée trop longue pour tenir en grand.
 */
export function isGlyphOnly(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  if (/\p{L}/u.test(trimmed)) return false;
  return Array.from(trimmed).length <= MAX_GLYPHS;
}

export function TileGlyphs({ text }: { text: string }) {
  // Un cadran d'horloge seul : ses aiguilles ne se lisent pas à 34 px, il fait 48 px (une tuile d'association de trois paires tient encore).
  if (isClockEmoji(text.trim())) {
    return <span className="inline-block text-[3rem] leading-none">{text}</span>;
  }
  if (isGlyphOnly(text)) {
    return <span className="inline-block text-[1.75rem] leading-[1.15] tracking-wide">{typesetTile(text)}</span>;
  }
  return <span className="inline-block [overflow-wrap:anywhere]">{typesetTile(text)}</span>;
}
