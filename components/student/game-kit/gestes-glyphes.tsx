/**
 * LE CONTENU D'UNE TUILE QU'ON SAISIT — grand quand il se lit par l'image.
 *
 * Au CI, une tuile d'association ou une étiquette à glisser porte souvent une
 * rangée de mangues, une forme, un chiffre : pas un mot. Un enfant de six ans
 * ne lit pas, il reconnaît. Ce contenu-là s'affiche GRAND (28 px, les émojis
 * font alors 34 px environ) et espacé pour que les émojis d'une rangée ne se
 * touchent pas. Un mot ou une syllabe garde la taille de la tuile et peut se
 * couper n'importe où plutôt que de déborder (« bissap » dans une tuile
 * étroite).
 *
 * Pure fonction + un fragment : aucun hook, utilisable partout, testable.
 */

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
  if (isGlyphOnly(text)) {
    return <span className="inline-block text-[1.75rem] leading-[1.15] tracking-wide">{text}</span>;
  }
  return <span className="inline-block hyphens-auto [overflow-wrap:anywhere]">{text}</span>;
}
