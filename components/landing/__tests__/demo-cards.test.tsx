import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";

import DemoCards from "../demo/demo-cards";
import { BANK as mathematiques } from "../demo/bank/mathematiques";
import { classicTypesFor, gamesFor } from "../demo/demo-matrix";

// Les confettis dessinent sur un canvas : jsdom n'en a pas.
vi.mock("canvas-confetti", () => ({ default: vi.fn() }));

/** Le réseau qui tombe : la banque de la matière n'arrive pas, puis arrive. */
const network = vi.hoisted(() => ({ down: false }));
vi.mock("../demo/bank", async (importOriginal) => {
  const real = await importOriginal<typeof import("../demo/bank")>();
  return {
    ...real,
    peekBank: (subject: Parameters<typeof real.peekBank>[0]) => (network.down ? undefined : real.peekBank(subject)),
    loadBank: (subject: Parameters<typeof real.loadBank>[0]) =>
      network.down ? Promise.reject(new Error("réseau")) : real.loadBank(subject),
  };
});

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
afterEach(() => {
  cleanup();
  network.down = false;
});

const titles = (container: HTMLElement) =>
  within(container)
    .getAllByRole("group")
    .map((card) => document.getElementById(card.getAttribute("aria-labelledby") ?? "")?.textContent);

describe("les cartes jouables d'une matière et d'une classe", () => {
  it("montre d'abord les cartes vides, puis un exercice de la banque par type", async () => {
    const { container } = render(<DemoCards subject="mathematiques" klass="CE2" />);
    // En attendant la banque : une carte vide par type, tout de suite.
    expect(container.querySelectorAll("[aria-hidden].animate-pulse").length).toBe(
      classicTypesFor("mathematiques", "CE2").length + gamesFor("mathematiques", "CE2").length,
    );

    const qcm = mathematiques.CE2.find((item) => item.type === "qcm")!;
    expect(await screen.findByText(qcm.prompt)).toBeTruthy();
    expect(container.querySelectorAll("[aria-hidden].animate-pulse")).toHaveLength(0);
    expect(titles(container)).toEqual([
      "Questions à choix multiples",
      "Classer par le geste",
      "Relier les paires",
      "Remettre en ordre",
      "Écrire la réponse",
      "Continuer la suite",
      "Dessiner sur quadrillage",
    ]);
    // Deux rubriques : les exercices écrits, puis les jeux fabriqués par le code.
    expect(screen.getByText("Les exercices")).toBeTruthy();
    expect(screen.getByText("Les jeux")).toBeTruthy();
  });

  it("dit la thématique du programme et le niveau sur chaque carte", async () => {
    const { container } = render(<DemoCards subject="mathematiques" klass="CE2" />);
    await screen.findByText(mathematiques.CE2[0].prompt);
    // (Deux cartes peuvent partir de la même thématique : le glisser-déposer et le jeu de symétrie.)
    for (const item of mathematiques.CE2) expect(within(container).getAllByText(item.topic).length).toBeGreaterThan(0);
    // Un exercice de niveau 4 est « Maîtrise » : la réponse courte de CE2.
    expect(within(container).getAllByText("Maîtrise").length).toBeGreaterThan(0);
  });

  it("montre le jeu que le programme donne à la classe : le dessin au CM1, pas de suite de nombres", async () => {
    const { container } = render(<DemoCards subject="mathematiques" klass="CM1" />);
    await screen.findByText(mathematiques.CM1[0].prompt);
    expect(screen.getByText("Les jeux")).toBeTruthy();
    expect(titles(container)).toContain("Dessiner sur quadrillage");
    expect(titles(container)).not.toContain("Continuer la suite");
  });

  it("n'a ni rubrique « Les jeux » ni intitulé « Les exercices » quand la matière n'a pas de jeu", async () => {
    const { container } = render(<DemoCards subject="histoire" klass="CE1" />);
    await waitFor(() => expect(container.querySelectorAll("[aria-hidden].animate-pulse")).toHaveLength(0));
    expect(screen.queryByText("Les jeux")).toBeNull();
    expect(screen.queryByText("Les exercices")).toBeNull();
  });

  it("« Un autre exemple » change le jeu et monte la difficulté d'un cran", async () => {
    const { container } = render(<DemoCards subject="mathematiques" klass="CE2" />);
    await screen.findByText(mathematiques.CE2[0].prompt);
    const card = () => screen.getByRole("group", { name: "Continuer la suite" });
    // Le premier exemple est de niveau « consolidation ».
    expect(within(card()).getByText("Consolidation")).toBeTruthy();

    await act(async () => {
      fireEvent.click(within(card()).getByRole("button", { name: /Un autre exemple/ }));
    });
    expect(within(card()).getByText("Approfondissement")).toBeTruthy();

    await act(async () => {
      fireEvent.click(within(card()).getByRole("button", { name: /Un autre exemple/ }));
    });
    expect(within(card()).getByText("Maîtrise")).toBeTruthy();

    await act(async () => {
      fireEvent.click(within(card()).getByRole("button", { name: /Un autre exemple/ }));
    });
    // On recommence par le début de l'échelle.
    expect(within(card()).getByText("Découverte")).toBeTruthy();
    expect(titles(container)).toHaveLength(7);
  });

  it("repart de zéro quand on change de classe : les cartes du CP, pas celles du CE2", async () => {
    const { rerender } = render(<DemoCards subject="mathematiques" klass="CE2" />);
    await screen.findByText(mathematiques.CE2[0].prompt);

    rerender(<DemoCards subject="mathematiques" klass="CP" />);
    expect(await screen.findByText(mathematiques.CP[0].prompt)).toBeTruthy();
    expect(screen.queryByText(mathematiques.CE2[0].prompt)).toBeNull();
  });

  it("dit que les exercices n'ont pas pu se charger, puis les charge au « Réessayer »", async () => {
    network.down = true;
    render(<DemoCards subject="mathematiques" klass="CE2" />);
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("Les exercices n'ont pas pu se charger.");

    network.down = false;
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    });
    expect(await screen.findByText(mathematiques.CE2[0].prompt)).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
