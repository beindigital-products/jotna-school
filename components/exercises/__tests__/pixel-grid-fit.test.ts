import { describe, expect, it } from "vitest";
import {
  CONTROLS_COLUMN,
  CONTROLS_GAP,
  CONTROLS_HEIGHT,
  FRAME,
  GRID_GAP,
  MAX_CELL,
  MIN_CELL,
  fitGrid,
  type GridFit,
} from "../pixel-grid-fit";

type Case = { cols: number; rows: number; model: boolean; controls: boolean; width: number; height: number };

/** La place que prennent les quadrillages avec ces cases, comme l'écran les pose. */
function zone(fit: GridFit, { cols, rows, model, controls }: Case) {
  const drawing = { w: fit.cell * cols + FRAME, h: fit.cell * rows + FRAME };
  if (!model) return drawing;
  const frame = { w: fit.modelCell * cols + FRAME, h: fit.modelCell * rows + FRAME };
  if (fit.sideBySide) {
    const column = {
      w: Math.max(frame.w, controls ? CONTROLS_COLUMN : 0),
      h: frame.h + (controls ? CONTROLS_HEIGHT : 0),
    };
    return { w: column.w + GRID_GAP + drawing.w, h: Math.max(column.h, drawing.h) };
  }
  const row = frame.w + (controls ? CONTROLS_GAP + CONTROLS_COLUMN : 0);
  return { w: Math.max(row, drawing.w), h: frame.h + GRID_GAP + drawing.h };
}

// Les tailles des motifs (4 à 9 cases de côté), les cartes d'exercice d'un
// téléphone de 320 à 430 px de large et d'un grand écran, et des hauteurs
// libres de la plus courte à l'illimitée.
const CASES: Case[] = [];
for (const cols of [4, 5, 6, 7, 8, 9])
  for (const rows of [4, 5, 6, 7, 8])
    for (const [model, controls] of [
      [false, false],
      [true, false],
      [true, true],
    ] as const)
      for (const width of [240, 280, 310, 350, 624])
        for (const height of [150, 250, 350, 450, 600, Infinity])
          CASES.push({ cols, rows, model, controls, width, height });

describe("la taille des cases d'un dessin sur quadrillage", () => {
  it("ne déborde jamais en largeur", () => {
    for (const c of CASES) expect(zone(fitGrid(c), c).w, JSON.stringify(c)).toBeLessThanOrEqual(c.width);
  });

  it("tient dans la hauteur libre tant que les cases restent assez grandes pour un doigt", () => {
    for (const c of CASES) {
      const fit = fitGrid(c);
      if (fit.cell > MIN_CELL) expect(zone(fit, c).h, JSON.stringify(c)).toBeLessThanOrEqual(c.height);
    }
  });

  it("garde des cases d'au moins 26 px quand la largeur le permet, quitte à défiler", () => {
    for (const c of CASES) {
      const fit = fitGrid(c);
      expect(fit.cell).toBeLessThanOrEqual(MAX_CELL);
      if ((c.width - FRAME) / c.cols >= MIN_CELL) expect(fit.cell, JSON.stringify(c)).toBeGreaterThanOrEqual(MIN_CELL);
    }
  });

  it("empile le modèle au-dessus du dessin sur un téléphone, les met côte à côte sur grand écran", () => {
    const copy = { cols: 8, rows: 8, model: true, controls: false };
    const phone = fitGrid({ ...copy, width: 310, height: 390 });
    expect(phone.sideBySide).toBe(false);
    expect(phone.cell).toBeGreaterThanOrEqual(28);
    expect(phone.modelCell).toBeGreaterThanOrEqual(12);

    const desktop = fitGrid({ ...copy, width: 624, height: 600 });
    expect(desktop).toEqual({ cell: MAX_CELL, modelCell: 22, sideBySide: true });
  });

  it("sans modèle, le dessin prend la largeur du téléphone", () => {
    expect(fitGrid({ cols: 8, rows: 7, model: false, controls: false, width: 310, height: 500 }).cell).toBe(37);
  });
});
