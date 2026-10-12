import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import DragDropExercise from "../DragDropExercise";

/**
 * TOUCHER L'ÉTIQUETTE, PUIS TOUCHER LA CASE : l'autre façon de jouer un
 * glisser-déposer.
 *
 * À 375×667, la moitié des cartes de la démonstration ont une étiquette et sa
 * case qui ne tiennent pas ensemble à l'écran ; un glissé qui approche du bord
 * fait défiler la page sous le doigt. Le toucher ne dépend pas de la taille de
 * l'écran. Le glissé lui-même se joue dans `e2e/demo-touch.spec.ts`.
 */

const payload = { zones: ["Jour", "Nuit"], items: [{ text: "soleil" }, { text: "lune" }, { text: "étoile" }] };

function setup(onSubmit = vi.fn()) {
  const view = render(
    <DragDropExercise
      prompt="Classe chaque mot."
      payload={payload}
      onSubmit={onSubmit}
      disabled={false}
      isCorrect={null}
    />,
  );
  const zone = (label: string) => screen.getByRole("heading", { name: label }).parentElement as HTMLElement;
  const item = (text: string) => screen.getByText(text, { selector: '[aria-roledescription="draggable"]' });
  return { ...view, zone, item, onSubmit };
}

describe("glisser-déposer : toucher l'étiquette, puis la case", () => {
  it("pose l'étiquette choisie dans la case touchée", () => {
    const { zone, item } = setup();
    fireEvent.click(item("soleil"));
    fireEvent.click(zone("Jour"));
    expect(zone("Jour").textContent).toContain("soleil");
  });

  it("dit quelle étiquette est choisie et où la poser", () => {
    const { item } = setup();
    expect(screen.queryByText(/Ou touche l.étiquette, puis la case/i)).not.toBeNull();
    fireEvent.click(item("lune"));
    expect(item("lune").getAttribute("aria-pressed")).toBe("true");
    expect(screen.queryByText(/Touche la case où poser « lune »/)).not.toBeNull();
  });

  it("toucher deux fois la même étiquette la relâche", () => {
    const { zone, item } = setup();
    fireEvent.click(item("soleil"));
    fireEvent.click(item("soleil"));
    expect(item("soleil").getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(zone("Jour"));
    expect(zone("Jour").textContent).not.toContain("soleil");
  });

  it("toucher une autre étiquette change le choix", () => {
    const { zone, item } = setup();
    fireEvent.click(item("soleil"));
    fireEvent.click(item("lune"));
    fireEvent.click(zone("Nuit"));
    expect(zone("Nuit").textContent).toContain("lune");
    expect(zone("Nuit").textContent).not.toContain("soleil");
  });

  it("une case ne réagit pas au toucher quand aucune étiquette n'est choisie", () => {
    const { zone } = setup();
    fireEvent.click(zone("Jour"));
    expect(zone("Jour").textContent).not.toContain("soleil");
  });

  it("déplace une étiquette déjà posée vers une autre case", () => {
    const { zone, item } = setup();
    fireEvent.click(item("soleil"));
    fireEvent.click(zone("Jour"));
    fireEvent.click(item("soleil"));
    fireEvent.click(zone("Nuit"));
    expect(zone("Nuit").textContent).toContain("soleil");
    expect(zone("Jour").textContent).not.toContain("soleil");
  });

  it("toucher une étiquette déjà posée ne la repose pas dans sa propre case", () => {
    const { zone, item } = setup();
    fireEvent.click(item("soleil"));
    fireEvent.click(zone("Jour"));
    fireEvent.click(item("soleil"));
    expect(item("soleil").getAttribute("aria-pressed")).toBe("true");
    expect(zone("Jour").textContent).toContain("soleil");
  });

  it("toucher une étiquette déjà posée, alors qu'une autre est choisie, pose la choisie dans cette case", () => {
    const { zone, item } = setup();
    fireEvent.click(item("soleil"));
    fireEvent.click(zone("Jour"));
    // Le centre d'une case pleine tombe sur une étiquette : c'est toucher la case.
    fireEvent.click(item("lune"));
    fireEvent.click(item("soleil"));
    expect(zone("Jour").textContent).toContain("lune");
    expect(zone("Jour").textContent).toContain("soleil");
    expect(item("lune").getAttribute("aria-pressed")).toBe("false");
  });

  it("toucher une autre étiquette de la même case change le choix", () => {
    const { zone, item } = setup();
    fireEvent.click(item("soleil"));
    fireEvent.click(zone("Jour"));
    fireEvent.click(item("lune"));
    fireEvent.click(zone("Jour"));
    fireEvent.click(item("soleil"));
    fireEvent.click(item("lune"));
    expect(item("lune").getAttribute("aria-pressed")).toBe("true");
    expect(item("soleil").getAttribute("aria-pressed")).toBe("false");
  });

  it("se joue au clavier : Entrée choisit l'étiquette, puis on touche la case", () => {
    const { zone, item } = setup();
    fireEvent.keyDown(item("étoile"), { key: "Enter" });
    expect(item("étoile").getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(zone("Nuit"));
    expect(zone("Nuit").textContent).toContain("étoile");
  });

  it("envoie la réponse une fois toutes les étiquettes posées par toucher", () => {
    const { zone, item, onSubmit } = setup();
    expect((screen.getByRole("button", { name: "Valider" }) as HTMLButtonElement).disabled).toBe(true);
    for (const [text, where] of [
      ["soleil", "Jour"],
      ["lune", "Nuit"],
      ["étoile", "Nuit"],
    ]) {
      fireEvent.click(item(text));
      fireEvent.click(zone(where));
    }
    fireEvent.click(screen.getByRole("button", { name: "Valider" }));
    expect(onSubmit).toHaveBeenCalledWith(JSON.stringify({ soleil: "Jour", lune: "Nuit", étoile: "Nuit" }));
  });

  it("ne choisit rien une fois l'exercice corrigé", () => {
    render(
      <DragDropExercise prompt="Classe." payload={payload} onSubmit={vi.fn()} disabled={true} isCorrect={false} />,
    );
    const soleil = screen.getByText("soleil", { selector: '[aria-roledescription="draggable"]' });
    fireEvent.click(soleil);
    expect(soleil.getAttribute("aria-pressed")).toBe("false");
  });
});
