/**
 * LE CAURI — la monnaie du Monde de Pio.
 *
 * Un coquillage ivoire, bombé, fendu d'une longue ouverture bordée de petites
 * dents : le cauri a longtemps servi de monnaie en Afrique de l'Ouest. Une
 * seule image pour tout le jeu et pour la vitrine (l'en-tête, le marché, le
 * coffre, la fin d'un palier, la page d'accueil) : l'enfant reconnaît ce qu'il
 * gagne sans le lire.
 *
 * C'est une image, pas un dessin vectoriel : l'ancien tracé (un ovale fendu
 * d'un trait) se lisait comme un grain de café. Elle vient du studio (modèle
 * `bfl/flux-3-image`, le coffre en référence de style), détourée par
 * `scripts/build-game-assets.mjs` comme un objet du marché, puis rangée dans
 * `public/images/` :
 *
 *   cauri-s.webp   128 px, pour toutes les icônes (jusqu'à 64 px affichés)
 *   cauri.webp     384 px, pour les grands formats (`large`)
 */
export const CAURI_IMAGE = "/images/cauri.webp";
export const CAURI_IMAGE_SMALL = "/images/cauri-s.webp";

export function CauriIcon({
  className = "h-6 w-6",
  large = false,
}: {
  className?: string;
  /** Au-delà de 64 px affichés : charge l'image de 384 px. */
  large?: boolean;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- petite icône ; `next/image` n'apporte rien sous export statique
    <img
      src={large ? CAURI_IMAGE : CAURI_IMAGE_SMALL}
      alt=""
      aria-hidden
      draggable={false}
      className={`inline-block select-none object-contain ${className}`}
    />
  );
}

/** « 12 cauris », « 1 cauri » : le mot accordé, pour les textes et les étiquettes lues. */
export function caurisLabel(amount: number): string {
  return `${amount} cauri${amount > 1 ? "s" : ""}`;
}
