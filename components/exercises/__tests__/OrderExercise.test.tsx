import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import OrderExercise, { orderTileState } from "../OrderExercise";
import { PromptReaderProvider } from "../prompt-reader";

// Les confettis dessinent sur un canvas que jsdom n'a pas.
vi.mock("canvas-confetti", () => ({ default: vi.fn() }));
// Le lecteur de consignes ne cherche pas de son dans jsdom.
vi.mock("@/components/offline/clip-source", () => ({ useClipSource: () => vi.fn() }));

/**
 * LA MISE EN ORDRE : des marches numérotées, une poignée par tuile, et une
 * réponse qui part comme avant (la liste des textes dans l'ordre affiché).
 * Le glissé lui-même se joue dans `e2e/demo-touch.spec.ts`.
 */
const payload = { items: ["to", "ma", "te"] };

function setup(onSubmit = vi.fn(), isCorrect: boolean | null = null, disabled = false) {
  const view = render(
    <OrderExercise prompt="Remets les syllabes dans l'ordre." payload={payload} onSubmit={onSubmit} disabled={disabled} isCorrect={isCorrect} />,
  );
  return { ...view, onSubmit };
}

const handles = () => Array.from(document.querySelectorAll<HTMLElement>('[aria-roledescription="sortable"]'));
const tiles = () => Array.from(document.querySelectorAll<HTMLElement>(".gk-tile"));

describe("OrderExercise — l'escalier", () => {
  it("une marche numérotée et une poignée nommée par tuile", () => {
    const { container } = setup();
    expect(handles()).toHaveLength(3);
    for (const handle of handles()) {
      expect(handle.getAttribute("aria-label")).toMatch(/^Déplacer « (to|ma|te) »$/);
    }
    const numbers = Array.from(container.querySelectorAll(".gk-step")).map((step) => step.textContent?.trim());
    expect(numbers).toEqual(["1", "2", "3"]);
  });

  it("le libellé est le dernier enfant du nœud trié : la vitrine le lit par là", () => {
    setup();
    for (const handle of handles()) {
      const label = handle.parentElement?.lastElementChild?.textContent?.trim();
      expect(handle.getAttribute("aria-label")).toBe(`Déplacer « ${label} »`);
    }
  });

  it("envoie les textes dans l'ordre affiché", () => {
    const { onSubmit } = setup();
    const shown = handles().map((handle) => handle.parentElement?.lastElementChild?.textContent?.trim());
    fireEvent.click(screen.getByRole("button", { name: "Valider" }));
    expect(JSON.parse(onSubmit.mock.calls[0][0])).toEqual(shown);
    expect([...shown].sort()).toEqual(["ma", "te", "to"]);
  });

  it("juste : toutes les tuiles gonflent en vert ; faux : elles disent non en ambre, jamais en rouge", () => {
    const { rerender, container } = setup();
    expect(tiles().every((tile) => tile.getAttribute("data-state") === "repos")).toBe(true);

    rerender(<OrderExercise prompt="Remets." payload={payload} onSubmit={vi.fn()} disabled={true} isCorrect={true} />);
    expect(tiles().every((tile) => tile.getAttribute("data-state") === "juste")).toBe(true);
    expect(container.innerHTML).toContain("gk-pop");

    rerender(<OrderExercise prompt="Remets." payload={payload} onSubmit={vi.fn()} disabled={true} isCorrect={false} />);
    expect(tiles().every((tile) => tile.getAttribute("data-state") === "fausse")).toBe(true);
    expect(container.innerHTML).toContain("gk-shake-soft");
    expect(container.innerHTML).not.toMatch(/#dc2626|#ef4444|red-/);
  });

  it("corrigé, « Valider » est couché", () => {
    setup(vi.fn(), true, true);
    expect((screen.getByRole("button", { name: "Valider" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("un exercice à une seule tuile est cassé : on le saute", () => {
    const onSkip = vi.fn();
    render(<OrderExercise prompt="Remets." payload={{ items: ["seul"] }} onSubmit={vi.fn()} onSkip={onSkip} disabled={false} isCorrect={null} />);
    fireEvent.click(screen.getByRole("button", { name: "Suivant" }));
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it("pour un enfant qui apprend à lire, « Écouter » vient juste avant « Valider », dans la barre d'action", () => {
    const { container } = render(
      <PromptReaderProvider exerciseId="exo" silenced>
        <OrderExercise prompt="Remets." payload={payload} onSubmit={vi.fn()} disabled={false} isCorrect={null} />
      </PromptReaderProvider>,
    );
    const bar = container.querySelector("[data-scene-actions]");
    const names = [...bar!.querySelectorAll("button")].map((b) => b.getAttribute("aria-label") ?? b.textContent);
    expect(names).toEqual(["Écouter l'énoncé", "Valider"]);
    expect(bar!.nextElementSibling).toBeNull();
    // Les poignées restent trois, hors de la barre.
    expect(handles()).toHaveLength(3);
  });
});

describe("orderTileState — l'état d'une tuile", () => {
  it("le verdict prime, puis la prise", () => {
    expect(orderTileState(true, true)).toBe("juste");
    expect(orderTileState(false, false)).toBe("fausse");
    expect(orderTileState(null, true)).toBe("choisie");
    expect(orderTileState(null, false)).toBe("repos");
  });
});
