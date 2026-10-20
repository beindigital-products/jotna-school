/**
 * LES CLIPS DES SCÈNES DE L'INSTRUCTION CIVIQUE : UN CATALOGUE FERMÉ, FABRIQUÉ À L'AVANCE.
 *
 * Chaque scène du CI (`convex/paliers/games/civique.ts` : « Ta grand-mère te
 * parle. », « Le feu est rouge pour toi. ») a un petit clip de cinq secondes
 * qui montre la SITUATION, jamais le bon geste : un enfant de six ans ne lit
 * pas encore la phrase, il voit ce qui arrive. Le gabarit `civ-situation` pose
 * l'identifiant de la scène dans `payload.scene` ; l'écran joue
 * `/videos/scenes/<id>.mp4` au-dessus de l'énoncé, avec son affiche
 * `/images/scenes/<id>.webp` (la première image du clip).
 *
 * Les fichiers sont ceux du site (`public/`) : ils partent dans l'application,
 * donc ils jouent aussi hors ligne. Un identifiant hors catalogue ne montre rien.
 *
 * AJOUTER OU REFAIRE UN CLIP : `docs/scenes-civiques-clips.md`. Le test
 * `__tests__/scene-clips.test.ts` vérifie qu'une scène a son clip et son affiche,
 * et qu'aucun fichier n'est orphelin.
 *
 * Module pur, sans dépendance : il sert à l'écran, à la validation du payload
 * et aux tests.
 */

/** Une scène du CI, par l'identifiant qu'elle porte dans `civique.ts`. */
export const SCENE_CLIP_IDS = [
  // Bonjour, merci, pardon : respecter les grandes personnes, se tenir propre, prendre soin de ses affaires.
  "po1",
  "po2",
  "po3",
  "po4",
  "po5",
  "po6",
  "po7",
  "po8",
  "po9",
  "po10",
  "po11",
  // À l'école.
  "ec1",
  "ec2",
  "ec3",
  "ec4",
  "ec5",
  "ec6",
  "ec7",
  "ec8",
  "ec9",
  "ec10",
  // S'entraider, jouer ensemble.
  "en1",
  "en2",
  "en3",
  "en4",
  "en5",
  "en6",
  "en7",
  "en8",
  "en9",
  "en10",
  // La route.
  "ro1",
  "ro2",
  "ro3",
  "ro4",
  "ro5",
  "ro6",
  "ro7",
  "ro8",
  "ro9",
  "ro10",
] as const;

export type SceneClipId = (typeof SCENE_CLIP_IDS)[number];

/** Où les fichiers sont servis (`public/videos/scenes/`, `public/images/scenes/`). */
export const SCENE_CLIP_VIDEO_DIR = "/videos/scenes";
export const SCENE_CLIP_POSTER_DIR = "/images/scenes";

/** Les lettres d'un thème et un numéro : c'est aussi le nom des fichiers. */
export const SCENE_CLIP_ID = /^(po|ec|en|ro)[1-9][0-9]?$/;

export function isSceneClipId(id: unknown): id is SceneClipId {
  return typeof id === "string" && SCENE_CLIP_ID.test(id) && (SCENE_CLIP_IDS as readonly string[]).includes(id);
}

/** Le clip : un MP4 H.264 sans piste son (la voix de Pio lit l'énoncé, un son de plus la couvrirait). */
export function sceneClipSrc(id: SceneClipId): string {
  return `${SCENE_CLIP_VIDEO_DIR}/${id}.mp4`;
}

/** L'affiche : la première image du clip, au pixel près. */
export function sceneClipPoster(id: SceneClipId): string {
  return `${SCENE_CLIP_POSTER_DIR}/${id}.webp`;
}

/** L'identifiant de scène d'un payload, à condition qu'il soit dans le catalogue. */
export function sceneClipIdOf(payload: unknown): SceneClipId | null {
  if (!payload || typeof payload !== "object") return null;
  const scene = (payload as Record<string, unknown>).scene;
  return isSceneClipId(scene) ? scene : null;
}
