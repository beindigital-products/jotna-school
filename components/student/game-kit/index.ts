/**
 * LA BOÎTE À OUTILS DU JEU — ce que les écrans d'exercice assemblent.
 *
 * Mode d'emploi et direction artistique : `docs/direction-jeu-exercices.md`.
 * Page de montre : `app/dev/kit` (développement, ou
 * `NEXT_PUBLIC_EXERCISE_GALLERY=1`).
 */
export { ActionButton3D } from "./action-button-3d";
export {
  budgetFor,
  decideGameFeelLevel,
  HAPTICS,
  MAX_ANIMATED_LAYERS,
  type GameFeelBudget,
  type GameFeelLevel,
  type GameFeelSignals,
  type HapticName,
} from "./game-feel";
export { ProgressTrack, stoneState, trailProgress, type StoneState } from "./progress-track";
export { burstLayers, Reward } from "./reward";
export {
  LISTEN_LABEL,
  LISTEN_MUTED_LABEL,
  ListenButton,
  SceneActionBar,
  type SceneListen,
  type SceneListenStatus,
} from "./scene-action-bar";
export { keyboardInset, SceneDockProvider, useKeyboardInset, useSceneDock, type SceneDock } from "./scene-dock";
export { cylinderPanels, panelLight, Solid3D, type SolidKind } from "./solid-3d";
export { StageBackdrop } from "./stage-backdrop";
export {
  ELEVATIONS,
  elevationFor,
  Tile3D,
  toneFor,
  type TileElevation,
  type TileState,
  type TileTone,
} from "./tile-3d";
export {
  ACTION_TONES,
  contrastRatio,
  GESTURE_ACCENT,
  gestureAccentColor,
  OPTION_TONE_COUNT,
  shade,
  TILE_CORRECT_TONE,
  TILE_NEUTRAL_TONE,
  TILE_WRONG_TONE,
  tileChosenTone,
  tileRestTone,
  type ActionToneName,
  type GestureFamily,
  type SurfaceTone,
} from "./tones";
export { GameFeelProvider, useGameFeel, type GameFeel } from "./use-game-feel";
export { useMotionWillChange } from "./use-motion-will-change";
