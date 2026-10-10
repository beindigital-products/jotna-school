import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import PixelArtExercise from "../PixelArtExercise";

// Une symétrie de 4 × 4 : la moitié gauche est donnée, la droite est à peindre.
const payload = {
  mode: "symmetry" as const,
  width: 4,
  height: 4,
  palette: [{ key: "R", color: "#ef4444", name: "rouge" }],
  given: ["R...", "RR..", "RR..", "R..."],
  axis: "vertical" as const,
};

function renderSymmetry(isCorrect: boolean | null) {
  render(
    <PixelArtExercise
      prompt="Le trait rouge est un miroir. Complète le dessin pour qu'il soit symétrique."
      payload={payload}
      onSubmit={vi.fn()}
      disabled={isCorrect !== null}
      isCorrect={isCorrect}
    />,
  );
}

const cell = (name: string) => screen.getByRole("gridcell", { name });
const isPale = (el: HTMLElement) => el.className.includes("after:bg-white");

describe("PixelArtExercise — la symétrie", () => {
  it("pâlit la moitié donnée tant que l'enfant dessine", () => {
    renderSymmetry(null);
    expect(isPale(cell("Ligne 1, colonne 1, rouge"))).toBe(true);
    expect(cell("Ligne 1, colonne 2, vide").style.backgroundColor).toBe("rgb(243, 244, 246)");
    expect(isPale(cell("Ligne 1, colonne 3, vide"))).toBe(false);
  });

  it("une fois réussie, montre les deux moitiés des mêmes couleurs, sans voile", () => {
    renderSymmetry(true);
    for (const el of screen.getAllByRole("gridcell")) expect(isPale(el)).toBe(false);
    expect(cell("Ligne 1, colonne 2, vide").style.backgroundColor).toBe(
      cell("Ligne 1, colonne 3, vide").style.backgroundColor,
    );
    expect(screen.getByRole("grid").parentElement?.className).not.toContain("opacity-80");
  });

  it("garde le voile sur un dessin raté", () => {
    renderSymmetry(false);
    expect(isPale(cell("Ligne 1, colonne 1, rouge"))).toBe(true);
    expect(screen.getByRole("grid").parentElement?.className).toContain("opacity-80");
  });
});
