"use client";

import { Delete } from "lucide-react";
import { Tile3D } from "./tile-3d";

/**
 * LE PAVÉ NUMÉRIQUE DU JEU — de grosses touches posées dans la carte.
 *
 * Une réponse en chiffres (« Combien a-t-elle de billes ? ») ne passe plus par
 * le clavier du téléphone, qui monte sur la moitié de l'écran et cache le
 * champ et le bouton Valider. Les chiffres sont des tuiles épaisses
 * (`Tile3D`, 56 px au moins, crème, le flanc et l'ombre d'une touche), rangées
 * comme sur un téléphone : 1 2 3 en haut, 0 en bas, la touche qui efface à
 * droite, crème elle aussi avec une icône ambre (la teinte du sable, pas du
 * rouge). En mode décimal, une virgule en bas à gauche, comme le pavé
 * français.
 *
 * Il ne tient aucun état : l'écran lui donne `onKey` (un caractère) et
 * `onBackspace`, et garde la valeur dans son champ, que le serveur vérifie.
 * Chaque touche vibre « tap » par la tuile ; rien d'autre ne bouge.
 */
export function NumPad({
  onKey,
  onBackspace,
  decimal = false,
  disabled = false,
  className = "",
}: {
  /** Un caractère tapé : un chiffre, ou la virgule en mode décimal. */
  onKey: (key: string) => void;
  onBackspace: () => void;
  /** Ajoute la touche virgule. */
  decimal?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const digit = (value: string) => (
    <Tile3D
      key={value}
      tone="neutre"
      align="center"
      size="md"
      disabled={disabled}
      onPress={() => onKey(value)}
      aria-label={`Chiffre ${value}`}
    >
      <span className="block text-2xl leading-none">{value}</span>
    </Tile3D>
  );

  // Pas de `role="group"` : la vitrine compte ses cartes d'exercice par ce
  // rôle, et un pavé en aurait fait une carte de plus. Chaque touche porte
  // son propre nom (« Chiffre 7 ») ; `data-pave` sert aux tests.
  return (
    <div data-pave="chiffres" className={`grid grid-cols-3 gap-2 sm:gap-3 ${className}`}>
      {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map(digit)}
      {decimal ? (
        <Tile3D tone="neutre" align="center" size="md" disabled={disabled} onPress={() => onKey(",")} aria-label="Virgule">
          <span className="block text-2xl leading-none">,</span>
        </Tile3D>
      ) : (
        // La case vide en bas à gauche : la grille garde sa forme de pavé.
        <span aria-hidden />
      )}
      {digit("0")}
      <Tile3D tone="neutre" align="center" size="md" disabled={disabled} onPress={onBackspace} aria-label="Effacer le dernier chiffre">
        {/* L'icône en ambre (`amber-700`, le flanc du bouton orange) : la touche qui range, pas une alerte. */}
        <span className="block text-[#b45309]">
          <Delete className="mx-auto h-7 w-7" strokeWidth={2.5} aria-hidden />
        </span>
      </Tile3D>
    </div>
  );
}
