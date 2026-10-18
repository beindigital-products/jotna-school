import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import PixelArtExercise from "../PixelArtExercise";
import { PromptReaderProvider } from "../prompt-reader";

// Le lecteur de consignes ne cherche pas de son dans jsdom.
vi.mock("@/components/offline/clip-source", () => ({ useClipSource: () => vi.fn() }));

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
    // Le sable à l'ombre (`#f3ead3`) sous la moitié verrouillée, le sable clair ailleurs.
    expect(cell("Ligne 1, colonne 2, vide").style.backgroundColor).toBe("rgb(243, 234, 211)");
    expect(isPale(cell("Ligne 1, colonne 3, vide"))).toBe(false);
    expect(cell("Ligne 1, colonne 3, vide").style.backgroundColor).toBe("rgb(255, 253, 247)");
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

  it("une case que l'enfant peint rebondit en apparaissant ; la moitié donnée, non", () => {
    renderSymmetry(null);
    const grid = screen.getByRole("grid");
    // jsdom ne mesure rien : on donne au quadrillage la taille de ses 4 × 4 cases de 40 px.
    grid.getBoundingClientRect = () =>
      ({ left: 0, top: 0, right: 160, bottom: 160, width: 160, height: 160, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;

    const givenPaint = cell("Ligne 1, colonne 1, rouge").querySelector("[data-paint]");
    expect(givenPaint).not.toBeNull();
    expect(givenPaint?.className).not.toContain("gk-pop");

    // Un doigt posé au milieu de la case ligne 1, colonne 4.
    fireEvent.pointerDown(grid, { clientX: 140, clientY: 20, pointerId: 1, pointerType: "touch", button: 0, buttons: 1 });
    fireEvent.pointerUp(grid, { clientX: 140, clientY: 20, pointerId: 1, pointerType: "touch", button: 0, buttons: 0 });
    const painted = cell("Ligne 1, colonne 4, rouge").querySelector("[data-paint]");
    expect(painted).not.toBeNull();
    expect(painted?.className).toContain("gk-pop");

    // La case verrouillée ne se peint pas, même touchée.
    fireEvent.pointerDown(grid, { clientX: 60, clientY: 20, pointerId: 1, pointerType: "touch", button: 0, buttons: 1 });
    expect(cell("Ligne 1, colonne 2, vide")).toBeTruthy();
  });

  it("pour un enfant qui apprend à lire, « Écouter » vient juste avant « Valider », après la palette", () => {
    const { container } = render(
      <PromptReaderProvider exerciseId="exo" silenced>
        <PixelArtExercise prompt="Complète le dessin." payload={payload} onSubmit={vi.fn()} disabled={false} isCorrect={null} />
      </PromptReaderProvider>,
    );
    const bar = container.querySelector("[data-scene-actions]");
    const names = [...bar!.querySelectorAll("button")].map((b) => b.getAttribute("aria-label") ?? b.textContent);
    expect(names).toEqual(["Écouter l'énoncé", "Valider"]);
    // La barre est le dernier bloc : la mesure de la place libre la compte avec la palette.
    expect(bar!.nextElementSibling).toBeNull();
    expect(screen.getByRole("button", { name: "Gomme" }).compareDocumentPosition(bar!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
