/**
 * LA TAILLE DES CASES D'UN DESSIN SUR QUADRILLAGE.
 *
 * Le modèle, le quadrillage, la palette et « Valider » doivent tenir dans
 * l'écran d'un téléphone sans défiler : le doigt qui fait défiler sur le
 * quadrillage y peint, et un enfant qui ne voit pas « Valider » ne le cherche
 * pas toujours. Les cases prennent donc la place libre, en largeur comme en
 * hauteur, dans ces limites :
 *
 * - 44 px au plus, une cible confortable pour un doigt ;
 * - 26 px au moins tant que la largeur le permet : plus petit, le doigt d'un
 *   enfant déborde sur la case voisine, et mieux vaut alors défiler un peu ;
 * - le modèle, qu'on regarde sans le toucher, a des cases moitié moins
 *   grandes, entre 8 et 26 px.
 *
 * Sur un écran large, le modèle passe à gauche du dessin plutôt qu'au-dessus,
 * dès que les cases y restent confortables.
 */

export const MAX_CELL = 44;
export const MIN_CELL = 26;
const MAX_MODEL_CELL = 26;
const MIN_MODEL_CELL = 8;
/** Côte à côte dès que les cases y gardent cette taille, même si empilées elles seraient plus grandes. */
const COMFORT_CELL = 36;

/** Le cadre d'un quadrillage : bordure de 3 px et marge de 4 px, de chaque côté. */
export const FRAME = 14;
/** L'écart entre le modèle et le dessin (`gap-4`). */
export const GRID_GAP = 16;
/** La colonne des boutons du jeu de mémoire (`w-28`), à droite du modèle ou dessous. */
export const CONTROLS_COLUMN = 112;
/** Son écart au modèle (`gap-3`). */
export const CONTROLS_GAP = 12;
/** Sa hauteur sous le modèle, écart compris : un bouton sur deux lignes. */
export const CONTROLS_HEIGHT = 64;

export type GridFit = {
  /** Côté d'une case du dessin, en px. */
  cell: number;
  /** Côté d'une case du modèle, en px (0 sans modèle). */
  modelCell: number;
  /** Le modèle à gauche du dessin plutôt qu'au-dessus. */
  sideBySide: boolean;
};

export function fitGrid({
  cols,
  rows,
  model,
  controls,
  width,
  height,
}: {
  cols: number;
  rows: number;
  /** Un modèle s'affiche à côté du dessin (reproduire, mémoire). */
  model: boolean;
  /** Les boutons du jeu de mémoire accompagnent le modèle. */
  controls: boolean;
  /** Largeur libre, en px. */
  width: number;
  /** Hauteur libre pour les quadrillages, en px (`Infinity` tant qu'elle n'est pas mesurée). */
  height: number;
}): GridFit {
  if (!model) {
    return { cell: cellSize((width - FRAME) / cols, (height - FRAME) / rows), modelCell: 0, sideBySide: false };
  }

  // Empilés : le modèle au-dessus, ses boutons à sa droite.
  const stackedCell = cellSize((width - FRAME) / cols, (height - 2 * FRAME - GRID_GAP) / (rows * 1.5));
  const stacked: GridFit = {
    cell: stackedCell,
    modelCell: modelCellSize(
      stackedCell,
      (width - FRAME - (controls ? CONTROLS_COLUMN + CONTROLS_GAP : 0)) / cols,
      (height - 2 * FRAME - GRID_GAP - stackedCell * rows) / rows,
    ),
    sideBySide: false,
  };

  // Côte à côte : le modèle à gauche, ses boutons dessous (la colonne a au
  // moins leur largeur).
  const sideCell = cellSize(
    Math.min(
      (width - 2 * FRAME - GRID_GAP) / (cols * 1.5),
      controls ? (width - FRAME - GRID_GAP - CONTROLS_COLUMN) / cols : Infinity,
    ),
    (height - FRAME) / rows,
  );
  const side: GridFit = {
    cell: sideCell,
    modelCell: modelCellSize(
      sideCell,
      (width - 2 * FRAME - GRID_GAP - sideCell * cols) / cols,
      (Math.max(height, sideCell * rows + FRAME) - FRAME - (controls ? CONTROLS_HEIGHT : 0)) / rows,
    ),
    sideBySide: true,
  };

  return side.cell >= Math.min(stacked.cell, COMFORT_CELL) ? side : stacked;
}

/** La largeur ne se négocie pas (un quadrillage qui déborde est coupé) ; la hauteur si, jusqu'à `MIN_CELL`. */
function cellSize(byWidth: number, byHeight: number): number {
  return Math.max(1, Math.min(MAX_CELL, Math.floor(byWidth), Math.max(MIN_CELL, Math.floor(byHeight))));
}

function modelCellSize(cell: number, byWidth: number, byHeight: number): number {
  const wanted = Math.min(MAX_MODEL_CELL, Math.floor(cell / 2), Math.max(MIN_MODEL_CELL, Math.floor(byHeight)));
  return Math.max(1, Math.min(wanted, Math.floor(byWidth)));
}
