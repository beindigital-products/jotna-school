import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import DragDropExercise from "../DragDropExercise";
import OrderExercise from "../OrderExercise";

/**
 * AU DOIGT, UN GLISSÉ NE BOUGE QUE SI LA CIBLE DIT `touch-action: none`.
 *
 * Sinon le navigateur (Safari sur iPhone et iPad, Chrome sur Android) prend le
 * glisser pour un défilement de la page et annule le geste : la tuile ne bouge
 * jamais. Le bureau, à la souris, n'en montre rien, d'où ce garde-fou. Le vrai
 * geste tactile se joue dans `e2e/demo-touch.spec.ts`.
 */

describe("glisser-déposer et mise en ordre : prise au doigt", () => {
  it("chaque étiquette du glisser-déposer est `touch-none` et ne se sélectionne pas", () => {
    const { container } = render(
      <DragDropExercise
        prompt="Classe chaque mot."
        payload={{ zones: ["Jour", "Nuit"], items: [{ text: "soleil" }, { text: "lune" }] }}
        onSubmit={vi.fn()}
        disabled={false}
        isCorrect={null}
      />,
    );
    const items = container.querySelectorAll('[aria-roledescription="draggable"]');
    expect(items).toHaveLength(2);
    for (const item of items) {
      expect(item.className).toContain("touch-none");
      expect(item.className).toContain("select-none");
    }
  });

  it("chaque poignée de la mise en ordre est `touch-none` et fait 44 px (h-11 w-11)", () => {
    const { container } = render(
      <OrderExercise
        prompt="Range les mots."
        payload={{ items: ["un", "deux", "trois"] }}
        onSubmit={vi.fn()}
        disabled={false}
        isCorrect={null}
      />,
    );
    const handles = container.querySelectorAll('[aria-roledescription="sortable"]');
    expect(handles).toHaveLength(3);
    for (const handle of handles) {
      expect(handle.className).toContain("touch-none");
      expect(handle.className).toContain("select-none");
      expect(handle.className).toContain("h-11");
      expect(handle.className).toContain("w-11");
    }
  });
});
