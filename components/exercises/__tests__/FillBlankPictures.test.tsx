import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

vi.mock("canvas-confetti", () => ({ default: vi.fn() }));
// Le lecteur de consignes ne cherche pas de son dans jsdom.
vi.mock("@/components/offline/clip-source", () => ({ useClipSource: () => vi.fn() }));

import FillBlankExercise from "../FillBlankExercise";
import { ItemPicturesProvider } from "../item-pictures";

afterEach(cleanup);

const NBSP = " ";
const withoutNbsp = (text: string | null | undefined) => (text ?? "").replaceAll(NBSP, " ");

/**
 * LE TEXTE À TROUS EN CI : UNE OPTION QUI NOMME UNE CHOSE MONTRE SON IMAGE.
 *
 * L'audit visuel d'octobre 2026 a vu 53 textes à trous du CI proposer « le balai /
 * les ciseaux / l'arrosoir » ou « le lion / le soleil / le cartable » sans une
 * image : `FillBlankExercise` n'en montrait aucune. Ces tests tiennent la règle
 * permanente du dépôt (AGENTS.md) : l'image est là, avec le mot ; l'écran la retire
 * quand elle donnerait la réponse ; hors CI rien ne change ; le mot envoyé reste le
 * texte d'origine. Et la typographie : un « ! » ne commence jamais une ligne.
 */

type Blanks = { text: string; blanks: { options: string[] }[]; image?: string };

const TOOLS: Blanks = {
  text: "Pour balayer la cour, je prends ___.",
  blanks: [{ options: ["le balai", "les ciseaux", "l'arrosoir"] }],
};

function renderBlanks(
  payload: Blanks,
  options: { gate?: "ouverte" | "fermee" | "absente"; prompt?: string; onSubmit?: (answer: string) => void } = {},
) {
  const { gate = "ouverte", prompt = "Complète la phrase.", onSubmit = vi.fn() } = options;
  const exercise = <FillBlankExercise prompt={prompt} payload={payload} onSubmit={onSubmit} disabled={false} isCorrect={null} />;
  const wrap = (children: ReactNode) =>
    gate === "absente" ? children : <ItemPicturesProvider enabled={gate === "ouverte"}>{children}</ItemPicturesProvider>;
  return { onSubmit, ...render(wrap(exercise)) };
}

const option = (name: string) => screen.getByRole("button", { name: new RegExp(`^${name}$`) });
const stickers = (root: ParentNode) => [...root.querySelectorAll("[data-item-picture]")].map((el) => el.getAttribute("data-item-picture"));
const valider = () => screen.getByRole("button", { name: "Valider" });

describe("le texte à trous du CI : les options montrent leur image", () => {
  it("« le balai », « les ciseaux », « l'arrosoir » : chaque option a sa pastille, et garde son mot", () => {
    renderBlanks(TOOLS);
    expect(stickers(option("le balai"))).toEqual(["balai"]);
    expect(stickers(option("les ciseaux"))).toEqual(["ciseaux"]);
    expect(stickers(option("l'arrosoir"))).toEqual(["arrosoir"]);
    expect(option("le balai").textContent).toBe("le balai");
  });

  it("le trou rempli garde la pastille devant le mot, et la réponse part en texte d'origine", () => {
    const { onSubmit } = renderBlanks(TOOLS);
    fireEvent.click(option("le balai"));
    const hole = screen.getByRole("button", { name: /^Trou 1 : le balai$/ });
    expect(stickers(hole)).toEqual(["balai"]);
    expect(hole.textContent).toBe("le balai");
    fireEvent.click(valider());
    expect(onSubmit).toHaveBeenCalledWith(JSON.stringify(["le balai"]));
  });

  it("hors CI (porte fermée ou absente), aucune image", () => {
    for (const gate of ["fermee", "absente"] as const) {
      const { container, unmount } = renderBlanks(TOOLS, { gate });
      expect(stickers(container)).toEqual([]);
      unmount();
    }
  });

  it("l'émoji de la chose dans la phrase donnerait la réponse : l'écran retire toutes les images", () => {
    const { container } = renderBlanks({ ...TOOLS, text: "Pour balayer la cour 🧹, je prends ___." });
    expect(stickers(container)).toEqual([]);
  });

  it("l'énoncé demande de décoder (« syllabe ») : aucune image", () => {
    const { container } = renderBlanks({ text: "toma___", blanks: [{ options: ["lo", "te", "lit"] }] }, { prompt: "Trouve la syllabe qui manque." });
    expect(stickers(container)).toEqual([]);
  });

  it("une option sans image désignerait celle qui en a une : aucune image (« papa, lit, toto »)", () => {
    const { container } = renderBlanks({ text: "Je dors dans mon ___.", blanks: [{ options: ["papa", "lit", "toto"] }] });
    expect(stickers(container)).toEqual([]);
  });

  it("chaque trou se résout à part : le second trou montre ses images quand on y arrive", () => {
    const { container } = renderBlanks({
      text: "Je pile le mil avec ___. Je coupe le papier avec ___.",
      blanks: [{ options: ["le pilon", "le balai"] }, { options: ["les ciseaux", "le marteau"] }],
    });
    expect(stickers(container)).toEqual(["pilon", "balai"]);
    fireEvent.click(option("le pilon"));
    expect(stickers(option("les ciseaux"))).toEqual(["ciseaux"]);
    expect(stickers(option("le marteau"))).toEqual(["marteau"]);
  });
});

describe("le texte à trous : la typographie des tuiles et de la phrase", () => {
  const INVITE: Blanks = {
    text: "Awa, ___ vite à la maison ! (aller)",
    blanks: [{ options: ["viens", "venez"] }],
  };

  it("l'espace avant « ! » est insécable dans la phrase, sans changer le texte lu", () => {
    const { container } = renderBlanks(INVITE, { gate: "absente" });
    const sentence = container.querySelector("[class*='leading-[4.25rem]']") as HTMLElement;
    expect(sentence.textContent).toContain(`maison${NBSP}!`);
    expect(withoutNbsp(sentence.textContent)).toBe("Awa, ? vite à la maison ! (aller)");
  });

  it("un signe qui suit un trou reste collé à lui", () => {
    const { container } = renderBlanks({ text: "Tu arrives à l'école. Tu dis ___ !", blanks: [{ options: ["Bonjour", "Au revoir"] }] }, { gate: "absente" });
    const hole = screen.getByRole("button", { name: /^Trou 1, vide$/ });
    const glued = hole.parentElement as HTMLElement;
    expect(glued.className).toContain("whitespace-nowrap");
    expect(glued.textContent).toBe(`?${NBSP}!`);
    // Le « ! » n'est écrit qu'une fois : le morceau qui suit le trou l'a cédé.
    expect(withoutNbsp(container.querySelector("[class*='leading-[4.25rem]']")?.textContent)).toBe("Tu arrives à l'école. Tu dis ? !");
  });

  it("une option avec « ! » est composée à l'écran, et part telle quelle", () => {
    const { onSubmit } = renderBlanks(
      { text: "Ton ami s'en va. Tu dis : ___", blanks: [{ options: ["Au revoir !", "Bonjour !"] }] },
      { gate: "absente" },
    );
    const tile = screen.getAllByRole("button").find((button) => withoutNbsp(button.textContent) === "Au revoir !") as HTMLElement;
    expect(tile.textContent).toBe(`Au revoir${NBSP}!`);
    fireEvent.click(tile);
    expect(screen.getByRole("button", { name: /^Trou 1 : Au revoir !$/ }).textContent).toBe(`Au revoir${NBSP}!`);
    fireEvent.click(valider());
    expect(onSubmit).toHaveBeenCalledWith(JSON.stringify(["Au revoir !"]));
  });
});
