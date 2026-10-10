import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";

import { ExerciseTypes } from "../exercise-types";

// Les cartes apparaissent au défilement (`whileInView`) : jsdom n'a pas d'observateur.
beforeAll(() => {
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    },
  );
});
afterEach(cleanup);

const CLASSIC = [
  "Questions à choix multiples",
  "Classer par le geste",
  "Relier les paires",
  "Remettre en ordre",
  "Écrire la réponse",
];
const FILL_BLANK = "Compléter la phrase";

const panel = () => screen.getByRole("tabpanel");
const cardTitles = () => within(panel()).getAllByRole("heading", { level: 4 }).map((title) => title.textContent);
const choose = (name: string) => fireEvent.click(screen.getByRole("tab", { name }));

describe("la section « Exercices » : les matières, puis leurs types d'exercices", () => {
  it("présente les huit matières en onglets, le français d'abord", () => {
    render(<ExerciseTypes />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs.map((tab) => tab.textContent)).toEqual([
      "Français",
      "Mathématiques",
      "Éveil scientifique",
      "Histoire",
      "Géographie",
      "Instruction civique",
      "Éducation artistique",
      "Anglais",
    ]);
    expect(tabs.filter((tab) => tab.getAttribute("aria-selected") === "true")).toEqual([tabs[0]]);
  });

  it("montre au français ses six types d'exercices, sans jeu", () => {
    render(<ExerciseTypes />);
    expect(cardTitles()).toEqual([...CLASSIC, FILL_BLANK]);
    expect(within(panel()).getByText("6 types d'exercices")).toBeTruthy();
    expect(within(panel()).queryByText("Les jeux")).toBeNull();
  });

  it("montre aux mathématiques cinq exercices et deux jeux, sans phrase à trous", () => {
    render(<ExerciseTypes />);
    choose("Mathématiques");
    expect(cardTitles()).toEqual([...CLASSIC, "Continuer la suite", "Dessiner sur quadrillage"]);
    expect(cardTitles()).not.toContain(FILL_BLANK);
    expect(within(panel()).getByText("5 types d'exercices · 2 types de jeux")).toBeTruthy();
    expect(within(panel()).getByText("Les jeux")).toBeTruthy();
  });

  it("garde l'écoute et l'atelier des couleurs pour l'éducation artistique", () => {
    render(<ExerciseTypes />);
    choose("Éducation artistique");
    expect(cardTitles()).toContain("Écouter et reconnaître");
    expect(cardTitles()).toContain("L'atelier des couleurs");
    expect(cardTitles()).toHaveLength(10);

    choose("Histoire");
    expect(cardTitles()).toEqual([...CLASSIC, FILL_BLANK]);
    expect(cardTitles()).not.toContain("Écouter et reconnaître");
  });

  it("accorde « jeu » au singulier quand la matière n'en a qu'un", () => {
    render(<ExerciseTypes />);
    choose("Géographie");
    expect(within(panel()).getByText("6 types d'exercices · 1 type de jeu")).toBeTruthy();
    expect(cardTitles()).toContain("Dessiner sur quadrillage");
  });

  it("relie le panneau à l'onglet choisi", () => {
    render(<ExerciseTypes />);
    choose("Anglais");
    const selected = screen.getByRole("tab", { selected: true });
    expect(selected.textContent).toBe("Anglais");
    expect(panel().getAttribute("aria-labelledby")).toBe(selected.id);
    expect(within(panel()).getByRole("heading", { level: 3 }).textContent).toBe("Anglais");
  });

  it("se parcourt au clavier : flèches, Début et Fin", () => {
    render(<ExerciseTypes />);
    const tablist = screen.getByRole("tablist", { name: "Matières" });

    fireEvent.keyDown(tablist, { key: "ArrowRight" });
    expect(screen.getByRole("tab", { selected: true }).textContent).toBe("Mathématiques");

    fireEvent.keyDown(tablist, { key: "End" });
    expect(screen.getByRole("tab", { selected: true }).textContent).toBe("Anglais");

    fireEvent.keyDown(tablist, { key: "ArrowRight" });
    expect(screen.getByRole("tab", { selected: true }).textContent).toBe("Français");

    fireEvent.keyDown(tablist, { key: "ArrowLeft" });
    expect(screen.getByRole("tab", { selected: true }).textContent).toBe("Anglais");

    fireEvent.keyDown(tablist, { key: "Home" });
    expect(screen.getByRole("tab", { selected: true }).textContent).toBe("Français");
  });

  it("ne laisse qu'un onglet dans l'ordre de tabulation", () => {
    render(<ExerciseTypes />);
    const tabbable = screen.getAllByRole("tab").filter((tab) => tab.tabIndex === 0);
    expect(tabbable).toHaveLength(1);
  });
});
