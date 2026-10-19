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
 * ELLE EST POSÉE SUR UN PRÉSENTOIR : un cadre blanc épais (flanc crème de
 * 5 px, comme une tuile) et, dessous, une dalle de sable ovale qui fait
 * l'ombre au sol. Tout est peint, rien ne bouge : c'est l'objet que l'enfant
 * regarde avant de répondre.
 *
 * La hauteur est bornée (10 rem sur téléphone) : l'image ne doit pas repousser
 * les options hors d'un petit écran. Un identifiant hors catalogue ne montre
 * rien ; un fichier absent cache tout le présentoir au lieu d'afficher une
 * icône cassée dans un cadre vide.
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
      <span className="relative inline-flex flex-col items-center">
        {/* Le cadre : une face blanche épaisse, le flanc crème des tuiles. */}
        <span className="relative z-[1] rounded-2xl border-[3px] border-white bg-white p-1 shadow-[0_5px_0_#d6c39a,0_12px_18px_-12px_rgba(60,30,0,0.5)]">
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
              const figure = event.currentTarget.closest("figure");
              if (figure) figure.style.display = "none";
            }}
            className="max-h-40 w-auto select-none rounded-xl bg-white object-contain sm:max-h-56"
          />
        </span>
        {/* La dalle de sable : l'ombre au sol, peinte. */}
        <span
          aria-hidden
          className="-mt-2 h-4 w-[82%] rounded-[50%] bg-[linear-gradient(180deg,#f2c95e_0%,#e0a63d_100%)] shadow-[0_3px_0_#c9a35a]"
        />
      </span>
    </figure>
  );
}

/** L'identifiant d'image d'un payload d'exercice, s'il est dans le catalogue. */
export function payloadImage(payload: unknown): string | undefined {
  return exerciseImageIdOf(payload) ?? undefined;
}
