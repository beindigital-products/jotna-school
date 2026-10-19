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
/**
 * Fabriquées le 13 octobre 2026 avec le studio (`recraft/recraft-v4.1`), style
 * « illustration plate pour enfants » : un sujet, fond blanc, sans texte. Chaque
 * image a été regardée ; le chien, l'éléphant et la mangue ont été refaits (un
 * chien pris pour un ourson, un éléphant pris pour un tapir, une mangue prise pour
 * un piment). La pirogue se lit comme un bateau : ne pas lui demander de se
 * distinguer d'une barque.
 */
export const EXERCISE_IMAGES: readonly ExerciseImage[] = [
  { id: "ballon", alt: "Un ballon de football", about: "un ballon de football noir et blanc" },
  { id: "banane", alt: "Une banane", about: "une banane jaune" },
  { id: "baobab", alt: "Un baobab", about: "un baobab, arbre à gros tronc et à cime plate" },
  { id: "chat", alt: "Un chat assis", about: "un chat orange assis" },
  { id: "chien", alt: "Un chien assis", about: "un chien brun et blanc aux oreilles tombantes, assis" },
  { id: "crayon", alt: "Un crayon", about: "un crayon jaune avec une gomme rose" },
  { id: "elephant", alt: "Un éléphant", about: "un éléphant gris, grandes oreilles et longue trompe" },
  { id: "lion", alt: "Un lion", about: "un lion à la grande crinière, assis" },
  { id: "livre", alt: "Un livre fermé", about: "un livre fermé à couverture rouge, sans titre" },
  { id: "maison", alt: "Une petite maison", about: "une petite maison au toit rouge" },
  { id: "mangue", alt: "Une mangue", about: "une mangue jaune-orangé avec sa feuille" },
  { id: "mouton", alt: "Un mouton", about: "un mouton à la laine épaisse" },
  { id: "orange", alt: "Une orange", about: "une orange avec sa feuille" },
  { id: "pasteque", alt: "Une tranche de pastèque", about: "une tranche de pastèque rouge à pépins noirs" },
  { id: "pirogue", alt: "Une pirogue", about: "une pirogue, bateau de pêcheur coloré, sans eau ni personne" },
  { id: "poisson", alt: "Un poisson", about: "un poisson orange vu de côté" },
  { id: "poule", alt: "Une poule", about: "une poule jaune, debout" },
  { id: "soleil", alt: "Le soleil", about: "le soleil jaune et ses rayons, sans visage" },
  { id: "vache", alt: "Une vache", about: "une vache rouge à cornes, debout" },
  { id: "voiture", alt: "Une voiture", about: "une petite voiture orange vue de côté" },
];

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
