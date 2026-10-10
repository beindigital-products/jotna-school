import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";

import { ExerciseTypes } from "../exercise-types";

/**
 * LE LOT DES EXERCICES QUI N'ARRIVE PAS (le réseau tombe, un fichier manque) :
 * la section le dit et propose de réessayer ; la page d'accueil ne casse pas.
 */
const lot = vi.hoisted(() => ({ available: false }));

// Le lot des cartes : indisponible d'abord, puis disponible (un composant minimal suffit ici).
vi.mock("../demo/demo-cards", () => {
  if (!lot.available) throw new Error("Failed to fetch dynamically imported module");
  return { default: () => <p>Les exercices sont arrivés.</p> };
});

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

describe("la section « Exercices » : quand le lot des exercices n'arrive pas", () => {
  it("garde la page, dit ce qui s'est passé, puis charge au « Réessayer »", async () => {
    render(<ExerciseTypes />);

    // Le visiteur choisit une matière : le chargement part, et échoue.
    await act(async () => {
      fireEvent.click(screen.getByRole("tab", { name: "Histoire" }));
    });
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("Les exercices n'ont pas pu se charger.");
    // Le reste de la section est intact : onglets, classes, lien d'inscription.
    expect(screen.getAllByRole("tab")).toHaveLength(8);
    expect(screen.getAllByRole("radio")).toHaveLength(6);
    expect(screen.getByRole("link", { name: "S'inscrire" })).toBeTruthy();

    // Le réseau revient : « Réessayer » charge les exercices.
    lot.available = true;
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    });
    expect(await screen.findByText("Les exercices sont arrivés.")).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
