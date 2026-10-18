import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

vi.mock("@/components/offline/clip-source", () => ({ useClipSource: () => vi.fn() }));

import ExercisePrompt, { promptSizeClass } from "../ExercisePrompt";
import { PromptReaderProvider } from "../prompt-reader";

afterEach(cleanup);

/** Les paragraphes affichés, et si l'un d'eux est la carte de la citation. */
function shown(prompt: string) {
  const { container } = render(<ExercisePrompt prompt={prompt} />);
  const paragraphs = [...container.querySelectorAll("p")];
  return {
    texts: paragraphs.map((p) => p.textContent),
    card: paragraphs.find((p) => p.hasAttribute("data-prompt-quote"))?.textContent ?? null,
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

  it("pose une rangée d'émojis sur un socle sans toucher au texte, et colle la ponctuation qui suit au socle", () => {
    const row = [0x1f418, 0x1f41f, 0x1f34c].map((code) => String.fromCodePoint(code)).join(" ");
    const prompt = `Regarde la rangée ${row}. Lequel est au milieu ?`;
    const { container } = render(<ExercisePrompt prompt={prompt} />);
    const socle = container.querySelector(".gk-socle");
    expect(socle?.textContent).toBe(row);
    expect(socle?.className).toContain("text-4xl");
    expect(container.querySelector("p")?.textContent).toBe(prompt);
    // Le « . » ne part jamais seul en tête de ligne : il est dans le même `nowrap` que le socle.
    const glued = socle?.parentElement;
    expect(glued?.className).toContain("whitespace-nowrap");
    expect(glued?.textContent).toBe(`${row}.`);
  });

  it("ne coupe pas un mot à trait d'union, et laisse les autres mots en texte nu", () => {
    const prompt = "Aïssatou a 3 mangues. Combien en a-t-elle maintenant ?";
    const { container } = render(<ExercisePrompt prompt={prompt} />);
    const p = container.querySelector("p")!;
    expect(p.textContent).toBe(prompt);
    const nowrap = [...p.querySelectorAll("span")];
    expect(nowrap.map((s) => s.textContent)).toEqual(["a-t-elle"]);
    expect(nowrap[0].className).toContain("whitespace-nowrap");
    // Les nœuds de texte nus autour, pour `getByText`.
    expect([...p.childNodes].filter((n) => n.nodeType === Node.TEXT_NODE).map((n) => n.textContent)).toEqual([
      "Aïssatou a 3 mangues. Combien en ",
      " maintenant ?",
    ]);
    cleanup();
    // Sans trait d'union : un seul nœud de texte, rien d'enveloppé.
    const plain = render(<ExercisePrompt prompt="Combien de mangues ?" />);
    expect(plain.container.querySelector("p")?.querySelector("span")).toBeNull();
  });

  it("une citation courte (des syllabes) se lit en Fredoka extra-grasse, droite ; une longue en Poppins, droite", () => {
    const { container } = render(<ExercisePrompt prompt="Lis les syllabes : mi - te - mar." />);
    const quote = container.querySelector("[data-prompt-quote]")!;
    expect(quote.getAttribute("data-prompt-quote")).toBe("courte");
    expect(quote.className).toContain("font-display");
    expect(quote.className).toContain("font-extrabold");
    expect(quote.className).not.toContain("italic");
    cleanup();
    const long = render(<ExercisePrompt prompt="Trouve le temps du verbe : « Aujourd'hui, nous jouons au ballon dans la cour. »" />);
    const card = long.container.querySelector("[data-prompt-quote]")!;
    expect(card.getAttribute("data-prompt-quote")).toBe("longue");
    expect(card.className).not.toContain("italic");
    expect(card.className).not.toContain("font-display");
  });

  it("parle avec la voix de Pio : Fredoka, texte ambre, jamais gris", () => {
    const { container } = render(<ExercisePrompt prompt="Trouve le temps du verbe : « Aujourd'hui, nous jouons. »" />);
    const [instruction] = container.querySelectorAll("p");
    expect(instruction.className).toContain("font-display");
    expect(container.innerHTML).not.toMatch(/gray-\d|indigo-\d/);
  });

  it("grandit avec l'écran quand elle est courte, reste à 20 px quand elle est longue", () => {
    expect(promptSizeClass("Combien de mangues ?")).toBe("text-[clamp(1.25rem,5.6vw,1.625rem)]");
    // Longue : 20 px, et 18 px sur un écran court (le budget du premier écran).
    expect(promptSizeClass("Aïssatou a 3 mangues. On lui en donne 2 de plus. Combien en a-t-elle maintenant ?")).toBe(
      "text-xl [@media(max-height:667px)]:text-lg",
    );
    const { container } = render(<ExercisePrompt prompt="Combien de mangues ?" />);
    expect(container.querySelector("p")?.className).toContain("clamp(1.25rem,5.6vw,1.625rem)");
  });

  it("dans une classe qui apprend à lire, prend toute la largeur : aucun bouton devant elle", () => {
    const { container } = render(
      <PromptReaderProvider exerciseId="exo" silenced>
        <ExercisePrompt prompt="Combien de mangues ?" />
      </PromptReaderProvider>,
    );
    expect(screen.queryByRole("button")).toBeNull();
    expect(container.querySelector("[data-prompt-reading]")).not.toBeNull();
    expect(container.querySelector("p")?.textContent).toBe("Combien de mangues ?");
  });
});
