import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import MatchExercise from "../MatchExercise";

// L'exercice de la capture du 29 septembre 2026 : deux tuiles « a » à droite.
const payload = {
  left: ["mangue", "yassa", "bissap", "lait"],
  right: ["i", "a", "é", "a"],
};

function renderExercise(onSubmit = vi.fn()) {
  render(
    <MatchExercise
      prompt="Fais correspondre les mots avec leur son."
      payload={payload}
      onSubmit={onSubmit}
      disabled={false}
      isCorrect={null}
    />,
  );
  return onSubmit;
}

const tile = (name: string) => screen.getByRole("button", { name });
const aTiles = () => screen.getAllByRole("button", { name: "a" });
const isLinked = (button: HTMLElement) => !button.className.includes("border-gray-200");

describe("MatchExercise — deux tuiles au même texte", () => {
  it("relier le premier « a » laisse le second libre", () => {
    renderExercise();
    fireEvent.click(tile("mangue"));
    fireEvent.click(aTiles()[0]);

    const [first, second] = aTiles();
    expect(isLinked(first)).toBe(true);
    expect(isLinked(second)).toBe(false);
  });

  it("relie chaque mot à l'une des deux tuiles « a » et envoie les quatre paires", () => {
    const onSubmit = renderExercise();
    fireEvent.click(tile("bissap"));
    fireEvent.click(tile("i"));
    fireEvent.click(tile("lait"));
    fireEvent.click(tile("é"));
    fireEvent.click(tile("mangue"));
    fireEvent.click(aTiles()[0]);
    fireEvent.click(tile("yassa"));
    fireEvent.click(aTiles()[1]);

    const [first, second] = aTiles();
    expect(isLinked(first)).toBe(true);
    expect(isLinked(second)).toBe(true);
    // Deux liens, deux couleurs : les tuiles ne se confondent plus.
    expect(first.className).not.toBe(second.className);

    const submit = tile("Valider");
    expect((submit as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(submit);
    expect(JSON.parse(onSubmit.mock.calls[0][0])).toEqual([
      { left: "bissap", right: "i" },
      { left: "lait", right: "é" },
      { left: "mangue", right: "a" },
      { left: "yassa", right: "a" },
    ]);
  });

  it("toucher un mot relié défait seulement son lien", () => {
    renderExercise();
    fireEvent.click(tile("mangue"));
    fireEvent.click(aTiles()[0]);
    fireEvent.click(tile("yassa"));
    fireEvent.click(aTiles()[1]);

    fireEvent.click(tile("mangue"));

    const [first, second] = aTiles();
    expect(isLinked(first)).toBe(false);
    expect(isLinked(second)).toBe(true);
  });
});
