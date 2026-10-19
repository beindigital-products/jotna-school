/**
 * LES IMAGES DE TUILE DANS LES PAGES DE DÉVELOPPEMENT : le paramètre `images`
 * de la galerie des exercices et de la séance factice.
 *
 * En séance, un enfant de CI voit l'image de chaque chose nommée par une tuile
 * (`components/exercises/item-pictures.tsx`) et les autres classes ne la voient
 * pas : la séance pose `<ItemPicturesProvider enabled={isPictureTileClass(classe)}>`.
 * Les deux pages de développement font de même, avec la classe du spécimen
 * affiché (`Specimen.klass`), et ajoutent un interrupteur dans l'URL pour les
 * comparaisons avant / après et les captures :
 *
 *   (rien)     la porte de la classe décide, comme en séance : CI oui, CP et CE1 non
 *   &images=0  aucune image, quelle que soit la classe (l'écran d'avant)
 *   &images=1  des images, même pour une classe qui n'en a pas (un aperçu de ce que
 *              donnerait `PICTURE_TILE_CLASSES` élargi au CP, `lib/item-pictures.ts`)
 *
 * Ces deux fonctions sont pures : la galerie, la séance factice et leurs tests
 * lisent l'URL de la même façon.
 */
import { isPictureTileClass } from "@/lib/item-pictures";

/** Ce que l'URL dit des images : `false` (`images=0`), `true` (`images=1`), `null` quand elle n'en dit rien. */
export function readImagesFlag(search: { get(name: string): string | null }): boolean | null {
  const value = search.get("images");
  if (value === "0") return false;
  if (value === "1") return true;
  return null;
}

/** Les tuiles de ce spécimen montrent-elles leur image ? L'URL d'abord, sinon la porte de la classe. */
export function picturesEnabled(klass: string | undefined | null, flag: boolean | null): boolean {
  return flag ?? isPictureTileClass(klass);
}
