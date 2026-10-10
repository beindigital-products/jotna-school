import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";

import DemoCards from "../demo/demo-cards";
import { classicTypesFor, gamesFor } from "../demo/demo-matrix";
import { DEMO_CLASSES } from "../demo/demo-types";
import { PROGRAMME } from "@/convex/programme";

// Les confettis dessinent sur un canvas : jsdom n'en a pas.
vi.mock("canvas-confetti", () => ({ default: vi.fn() }));

beforeAll(() => {
  // Les cartes apparaissent au défilement (`whileInView`) : jsdom n'a pas d'observateur.
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

/**
 * CHAQUE CARTE DE CHAQUE MATIÈRE ET DE CHAQUE CLASSE, AFFICHÉE PAR LES VRAIS
 * ÉCRANS DE L'ÉLÈVE. Un exercice dont le payload n'a pas la forme que l'écran
 * attend s'y annonce « cassé, on te le saute » : cette fumée le verrait. Elle
 * vérifie aussi que chaque carte que la classe propose est bien là, avec son
 * bouton de validation (les écrans de jeu et d'exercice en ont tous un).
 */
describe("la vitrine affiche chaque carte avec les écrans de l'élève", () => {
  for (const subject of PROGRAMME) {
    for (const klass of DEMO_CLASSES) {
      it(`${subject.name} · ${klass}`, async () => {
        const { container } = render(<DemoCards subject={subject.key} klass={klass} />);
        const expected = classicTypesFor(subject.key, klass).length + gamesFor(subject.key, klass).length;

        await waitFor(() => expect(container.querySelectorAll("[aria-hidden].animate-pulse")).toHaveLength(0), {
          timeout: 20_000,
        });
        const cards = screen.getAllByRole("group");
        expect(cards).toHaveLength(expected);
        for (const card of cards) {
          // Un écran qui reçoit un payload invalide ne montre pas de consigne mais « Cet exercice est cassé ».
          expect(within(card).queryByText(/Cet exercice est cassé/)).toBeNull();
          expect(within(card).getAllByRole("button", { name: "Valider" }).length).toBeGreaterThan(0);
        }
      }, 30_000);
    }
  }
});
