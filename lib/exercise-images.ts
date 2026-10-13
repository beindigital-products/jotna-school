/**
 * LES IMAGES D'ÉNONCÉ : UN CATALOGUE FERMÉ, FABRIQUÉ À L'AVANCE.
 *
 * Certaines questions demandent une image (« Quel animal vois-tu ? »). L'écran
 * de l'enfant n'affiche que le texte : sans image, la question est
 * incompréhensible (« Combien de billes as-tu ? », 12 octobre 2026).
 *
 * Le modèle qui écrit les exercices ne CRÉE pas d'image : le serveur de
 * production n'a pas accès au studio d'images. Il CHOISIT dans ce catalogue,
 * par identifiant, dans `payload.image` ; l'écran affiche
 * `/exercices/<id>.webp` au-dessus de l'énoncé. Les fichiers sont des fichiers
 * du site (`public/exercices/`) : ils partent dans l'application, donc ils
 * s'affichent aussi hors ligne.
 *
 * Un identifiant hors catalogue est écarté (le champ tombe, et l'énoncé qui
 * renvoie à une image est alors refusé comme avant : `paliers/missingVisual.ts`).
 *
 * LES IMAGES NE SERVENT PAS À COMPTER : un générateur d'images ne sait pas
 * dessiner « exactement 7 billes ». Le comptage reste en émojis, vérifiés par
 * le code. Les images servent à reconnaître : un animal, un fruit, un objet.
 *
 * AJOUTER UNE IMAGE : voir `docs/paliers-et-exercices.md`, section « Des images
 * dans l'énoncé ». Le test `__tests__/exercise-images.test.ts` vérifie que
 * chaque entrée a son fichier, et chaque fichier son entrée.
 *
 * Module pur, sans dépendance : il sert à l'écran, à la validation des
 * exercices, à la consigne de génération et aux tests.
 */

export type ExerciseImage = {
  /** Minuscules, chiffres et tirets : c'est aussi le nom du fichier. */
  id: string;
  /** Ce que lit un lecteur d'écran. Court, en français, sans dire « image de ». */
  alt: string;
  /** Ce que le modèle lit pour choisir : le sujet, en une phrase. */
  about: string;
};

/** Les images fabriquées. Une entrée = un fichier `public/exercices/<id>.webp`. */
export const EXERCISE_IMAGES: readonly ExerciseImage[] = [];

/** Où les fichiers sont servis (dossier `public/exercices/`). */
export const EXERCISE_IMAGE_DIR = "/exercices";

export const EXERCISE_IMAGE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function exerciseImageSrc(id: string): string {
  return `${EXERCISE_IMAGE_DIR}/${id}.webp`;
}

/** L'image du catalogue qui porte cet identifiant, ou `null`. */
export function findExerciseImage(
  id: unknown,
  catalogue: readonly ExerciseImage[] = EXERCISE_IMAGES,
): ExerciseImage | null {
  if (typeof id !== "string" || !EXERCISE_IMAGE_ID.test(id)) return null;
  return catalogue.find((image) => image.id === id) ?? null;
}

/** L'identifiant d'image d'un payload, à condition qu'il soit dans le catalogue. */
export function exerciseImageIdOf(
  payload: unknown,
  catalogue: readonly ExerciseImage[] = EXERCISE_IMAGES,
): string | null {
  if (!payload || typeof payload !== "object") return null;
  return findExerciseImage((payload as Record<string, unknown>).image, catalogue)?.id ?? null;
}

/** Le catalogue tel que le modèle le lit : un identifiant et son sujet par ligne. */
export function exerciseImageCatalogueText(
  catalogue: readonly ExerciseImage[] = EXERCISE_IMAGES,
): string {
  return catalogue.map((image) => `- ${image.id} : ${image.about}`).join("\n");
}
