"use client";

import {
  EXERCISE_IMAGES,
  exerciseImageIdOf,
  exerciseImageSrc,
  findExerciseImage,
  type ExerciseImage as CatalogueImage,
} from "@/lib/exercise-images";

/**
 * L'IMAGE D'UN ÉNONCÉ (« Quel animal vois-tu ? »), choisie dans le catalogue
 * fermé de `lib/exercise-images.ts`. Les fichiers sont ceux du site
 * (`public/exercices/`) : ils partent dans l'application, donc s'affichent
 * aussi hors ligne.
 *
 * La hauteur est bornée (10 rem sur téléphone) : l'image ne doit pas repousser
 * les options hors d'un petit écran. Un identifiant hors catalogue ne montre
 * rien ; un fichier absent se cache au lieu d'afficher une icône cassée.
 */
export function ExerciseImage({
  id,
  catalogue = EXERCISE_IMAGES,
}: {
  id: string;
  catalogue?: readonly CatalogueImage[];
}) {
  const image = findExerciseImage(id, catalogue);
  if (!image) return null;
  return (
    <figure className="flex justify-center">
      {/* Pas `next/image` : export statique, sans serveur d'optimisation. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={exerciseImageSrc(image.id)}
        alt={image.alt}
        width={512}
        height={512}
        decoding="async"
        draggable={false}
        onError={(event) => {
          event.currentTarget.style.display = "none";
        }}
        className="max-h-40 w-auto select-none rounded-2xl bg-white object-contain sm:max-h-56"
      />
    </figure>
  );
}

/** L'identifiant d'image d'un payload d'exercice, s'il est dans le catalogue. */
export function payloadImage(payload: unknown): string | undefined {
  return exerciseImageIdOf(payload) ?? undefined;
}
