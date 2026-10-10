import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";

import ExercisePrompt from "../ExercisePrompt";

afterEach(cleanup);

/** Les paragraphes affichés, et si l'un d'eux est la carte de la citation (en italique). */
function shown(prompt: string) {
  const { container } = render(<ExercisePrompt prompt={prompt} />);
  const paragraphs = [...container.querySelectorAll("p")];
  return {
    texts: paragraphs.map((p) => p.textContent),
    card: paragraphs.find((p) => p.className.includes("italic"))?.textContent ?? null,
  };
}

describe("la consigne d'un exercice : on n'en perd jamais un mot", () => {
  it("met en carte la citation qui TERMINE la consigne (guillemets français)", () => {
    const { texts, card } = shown("Trouve le temps du verbe : « Aujourd'hui, nous jouons. »");
    expect(texts).toEqual(["Trouve le temps du verbe", "Aujourd'hui, nous jouons."]);
    expect(card).toBe("Aujourd'hui, nous jouons.");
  });

  it("met en carte la citation entre guillemets droits, même avec une apostrophe dedans", () => {
    const { texts, card } = shown('Trouve le temps du verbe : "Aujourd\'hui, nous jouons."');
    expect(texts).toEqual(["Trouve le temps du verbe", "Aujourd'hui, nous jouons."]);
    expect(card).toBe("Aujourd'hui, nous jouons.");
  });

  it("garde la ponctuation finale après la citation sans la perdre ni la mettre en carte", () => {
    const { card } = shown("Complète la phrase « Demain, nous ___ au ballon. » ?");
    expect(card).toBe("Demain, nous ___ au ballon.");
  });

  it("montre la consigne EN ENTIER quand du texte suit la citation", () => {
    const prompt =
      "Lis : « Fatou se lève tôt. Elle va au puits avec sa grande sœur. » Avec qui Fatou va-t-elle au puits ?";
    const { texts, card } = shown(prompt);
    expect(texts).toEqual([prompt]);
    expect(card).toBeNull();
  });

  it("montre la consigne EN ENTIER quand elle a deux citations", () => {
    const prompt = "Dans « Modou mange la mangue », quel pronom remplace « la mangue » ?";
    const { texts, card } = shown(prompt);
    expect(texts).toEqual([prompt]);
    expect(card).toBeNull();
  });

  it("ne prend pas l'apostrophe pour un guillemet", () => {
    const prompt = "Aïssatou a 3 mangues. Elle va à l'école d'abord, puis au marché de l'ouest.";
    const { texts, card } = shown(prompt);
    expect(texts).toEqual([prompt]);
    expect(card).toBeNull();
  });

  it("garde le deux-points devant une phrase à lire ou à compléter", () => {
    const { texts, card } = shown("Complète avec le verbe au futur simple : Demain, nous ___ (jouer) au ballon.");
    expect(texts).toEqual(["Complète avec le verbe au futur simple", "Demain, nous ___ (jouer) au ballon."]);
    expect(card).toBe("Demain, nous ___ (jouer) au ballon.");
  });

  it("ne coupe pas une consigne courte ni sans citation", () => {
    for (const prompt of ["Quel est le résultat ?", "Relie chaque mot à son contraire.", "Choisis : a ou b ?"]) {
      expect(shown(prompt).texts, prompt).toEqual([prompt]);
      cleanup();
    }
  });
});
