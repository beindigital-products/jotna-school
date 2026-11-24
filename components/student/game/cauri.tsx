/**
 * LE CAURI — la monnaie du Monde de Pio, dessinée.
 *
 * Un coquillage crème fendu d'un sillon brun : le cauri a longtemps servi de
 * monnaie en Afrique de l'Ouest. Une seule icône pour tout le jeu (l'en-tête,
 * le marché, le coffre, la fin d'un palier) : l'enfant reconnaît ce qu'il
 * gagne sans le lire. En SVG, donc nette à toutes les tailles et sans fichier.
 */
export function CauriIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <ellipse cx="12" cy="12" rx="8" ry="10.5" fill="#fff3d6" stroke="#b7791f" strokeWidth="1.5" />
      <path d="M12 3.5c-2 3-2 14 0 17c2-3 2-14 0-17z" fill="#7a4a23" />
    </svg>
  );
}

/** « 12 cauris », « 1 cauri » : le mot accordé, pour les textes et les étiquettes lues. */
export function caurisLabel(amount: number): string {
  return `${amount} cauri${amount > 1 ? "s" : ""}`;
}
