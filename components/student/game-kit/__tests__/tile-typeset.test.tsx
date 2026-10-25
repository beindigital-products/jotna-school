import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { TileGlyphs } from "../gestes-glyphes";
import { typesetTile } from "../tile-typeset";

afterEach(cleanup);

const NBSP = " ";
const withoutNbsp = (text: string | null | undefined) => (text ?? "").replaceAll(NBSP, " ");

/**
 * LA TYPOGRAPHIE DES TUILES (audit visuel d'octobre 2026) : un « ! », un « ? », un
 * « : » ou un « ; » ne commence plus une ligne dans une tuile, un calcul ne se coupe
 * plus autour d'un opérateur, et le texte d'origine se retrouve à l'identique une
 * fois les insécables repliées.
 */
describe("typesetTile", () => {
  it("rend insécable l'espace avant ? ! : ;", () => {
    expect(typesetTile("Viens manger chez moi demain !")).toBe(`Viens manger chez moi demain${NBSP}!`);
    expect(typesetTile("Tu viens ?")).toBe(`Tu viens${NBSP}?`);
    expect(typesetTile("Attention : danger ; recule.")).toBe(`Attention${NBSP}: danger${NBSP}; recule.`);
  });

  it("garde un calcul d'un seul tenant : « (22 + 13) ÷ 5 »", () => {
    expect(typesetTile("(22 + 13) ÷ 5")).toBe(`(22${NBSP}+${NBSP}13)${NBSP}÷${NBSP}5`);
    expect(typesetTile("40 × 4 − 60 − 10")).toBe(`40${NBSP}×${NBSP}4${NBSP}−${NBSP}60${NBSP}−${NBSP}10`);
    expect(typesetTile("2 000 − (3 × 100 + 4 × 200)")).not.toMatch(/ /);
    expect(typesetTile("20 : 4 = ?")).toBe(`20${NBSP}:${NBSP}4${NBSP}=${NBSP}?`);
  });

  it("ne touche ni aux mots, ni aux traits d'union, ni à un texte sans signe", () => {
    for (const text of ["la mangue", "l'arc-en-ciel", "Penda - Awa", "3 mangues", "", "🥭 🥭 🥭"]) {
      expect(typesetTile(text)).toBe(text);
    }
  });

  it("replié, le texte composé est le texte d'origine", () => {
    for (const text of ["Viens manger chez moi demain !", "(22 + 13) ÷ 5", "« Bonjour ! » : dit-il ; puis 1 200 F."]) {
      expect(withoutNbsp(typesetTile(text))).toBe(text);
    }
  });
});

describe("TileGlyphs", () => {
  it("compose le texte d'une tuile, sans césure automatique", () => {
    const { container } = render(<TileGlyphs text="Viens manger chez moi demain !" />);
    const span = container.querySelector("span") as HTMLElement;
    expect(span.textContent).toBe(`Viens manger chez moi demain${NBSP}!`);
    expect(span.className).not.toContain("hyphens-auto");
    expect(span.className).toContain("[overflow-wrap:anywhere]");
  });

  it("un petit calcul reste un glyphe, et ne se coupe pas", () => {
    const { container } = render(<TileGlyphs text="3 + 4" />);
    expect(container.textContent).toBe(`3${NBSP}+${NBSP}4`);
    expect(container.querySelector("span")?.className).toContain("text-[1.75rem]");
  });
});
