import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

// Un catalogue de test : le vrai est rempli quand les images sont fabriquées. Les
// fonctions d'origine gardent leur catalogue (vide) en valeur par défaut : on leur
// donne celui du test.
vi.mock("@/lib/exercise-images", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/exercise-images")>();
  const catalogue = [
    { id: "chat", alt: "Un chat assis", about: "un chat" },
  ];
  return {
    ...original,
    EXERCISE_IMAGES: catalogue,
    findExerciseImage: (id: unknown, c = catalogue) => original.findExerciseImage(id, c),
    exerciseImageIdOf: (payload: unknown, c = catalogue) => original.exerciseImageIdOf(payload, c),
    exerciseImageCatalogueText: (c = catalogue) => original.exerciseImageCatalogueText(c),
  };
});

import ExercisePrompt from "../ExercisePrompt";
import QcmExercise from "../QcmExercise";

/**
 * Le paragraphe de la consigne, par son texte entier : « vois-tu » est tenu en
 * `nowrap` dans un `span` (`ExercisePrompt`), et `getByText` ne lit que les
 * nœuds de texte propres d'un élément.
 */
const squeeze = (text: string) => text.trim().replace(/\s+/g, " ");
const byPrompt = (text: string) =>
  screen.getByText((_, element) => element?.tagName === "P" && squeeze(element.textContent ?? "") === squeeze(text));

describe("l'image d'un énoncé", () => {
  it("s'affiche au-dessus de la consigne, avec son texte alternatif", () => {
    const { container } = render(<ExercisePrompt prompt="Quel animal vois-tu ?" image="chat" />);
    const image = screen.getByRole("img", { name: "Un chat assis" }) as HTMLImageElement;
    expect(image.getAttribute("src")).toBe("/exercices/chat.webp");
    const prompt = byPrompt("Quel animal vois-tu ?");
    expect(
      image.compareDocumentPosition(prompt) & Node.DOCUMENT_POSITION_FOLLOWING,
      "l'image précède la consigne",
    ).toBeTruthy();
    expect(container.querySelectorAll("img")).toHaveLength(1);
  });

  it("a une hauteur bornée : elle ne repousse pas les options hors d'un petit écran", () => {
    render(<ExercisePrompt prompt="Quel animal vois-tu ?" image="chat" />);
    expect(screen.getByRole("img").className).toContain("max-h-40");
  });

  it("ne change rien au DOM d'une consigne sans image", () => {
    const { container } = render(<ExercisePrompt prompt="Quel animal miaule ?" />);
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("figure")).toBeNull();
  });

  it("n'affiche rien pour un identifiant hors catalogue", () => {
    const { container } = render(<ExercisePrompt prompt="Quel animal vois-tu ?" image="licorne" />);
    expect(container.querySelector("img")).toBeNull();
    expect(byPrompt("Quel animal vois-tu ?")).not.toBeNull();
  });

  it("se cache si le fichier manque, au lieu d'une icône cassée", () => {
    render(<ExercisePrompt prompt="Quel animal vois-tu ?" image="chat" />);
    const image = screen.getByRole("img") as HTMLImageElement;
    fireEvent.error(image);
    expect(image.style.display).toBe("none");
  });

  it("passe par les écrans d'exercice : un QCM montre l'image de son payload", () => {
    render(
      <QcmExercise
        prompt="Quel animal vois-tu ?"
        payload={{ options: ["chat", "chien"], image: "chat" }}
        onSubmit={vi.fn()}
        disabled={false}
        isCorrect={null}
      />,
    );
    expect(screen.getByRole("img", { name: "Un chat assis" })).toBeTruthy();
  });
});
