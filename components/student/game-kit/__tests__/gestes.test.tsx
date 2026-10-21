import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { CableOverlay, cablePath } from "../gestes-cables";
import { DropBox, StepNumber, StepSlot } from "../gestes-cases";
import { isGlyphOnly, TileGlyphs } from "../gestes-glyphes";
import { GameFeelProvider } from "../use-game-feel";

describe("cablePath — la courbe d'un câble", () => {
  it("part de la prise de gauche, arrive à celle de droite, avec des tangentes horizontales", () => {
    const d = cablePath({ x: 10, y: 20 }, { x: 110, y: 60 });
    expect(d.startsWith("M 10 20 C ")).toBe(true);
    expect(d.endsWith(" 110 60")).toBe(true);
    // Le renflement vaut la moitié de la distance : les points de contrôle sont à 60 et à 60.
    expect(d).toBe("M 10 20 C 60 26, 60 66, 110 60");
  });

  it("garde un renflement minimal quand les prises sont proches", () => {
    const d = cablePath({ x: 0, y: 0 }, { x: 10, y: 0 });
    expect(d).toBe("M 0 0 C 18 6, -8 6, 10 0");
  });
});

describe("CableOverlay — ce qui est dessiné", () => {
  it("un groupe par câble, une prise par point, l'état de la prise dans le DOM", () => {
    const tone = { main: "#ec4899", dark: "#be185d" };
    const { container } = render(
      <GameFeelProvider level="riche">
        <CableOverlay
          cables={[{ id: "0-1", from: { x: 0, y: 0 }, to: { x: 100, y: 40 }, tone }]}
          sockets={[
            { id: "l0", at: { x: 0, y: 0 }, mode: "relie", tone },
            { id: "r0", at: { x: 100, y: 0 }, mode: "appel" },
            { id: "r1", at: { x: 100, y: 40 }, mode: "libre" },
          ]}
        />
      </GameFeelProvider>,
    );
    expect(container.querySelectorAll("[data-cable]")).toHaveLength(1);
    // Quatre traits par câble : lueur, contour, câble, reflet.
    expect(container.querySelectorAll("[data-cable] path")).toHaveLength(4);
    expect(container.querySelector('[data-socket="appel"]')).not.toBeNull();
    // Au niveau riche, la prise qui appelle flotte ; au repos rien ne bouge.
    expect(container.querySelector('[data-socket="appel"]')?.innerHTML).toContain("gk-bob");
    expect(container.querySelector('[data-socket="libre"]')?.innerHTML).not.toContain("gk-bob");
    expect(container.querySelector("svg")?.getAttribute("class")).toContain("gk-motion");
  });

  it("au niveau sobre, la prise qui appelle ne flotte pas", () => {
    const { container } = render(
      <GameFeelProvider level="sobre">
        <CableOverlay cables={[]} sockets={[{ id: "r0", at: { x: 1, y: 1 }, mode: "appel" }]} />
      </GameFeelProvider>,
    );
    expect(container.innerHTML).not.toContain("gk-bob");
  });
});

describe("DropBox, StepNumber, StepSlot — les cases", () => {
  it("la boîte : son titre est son enfant direct, ses étiquettes sont dedans, elle dit si elle est allumée", () => {
    const { rerender } = render(
      <DropBox tone={0} label="Ronds" armed={false} over={false}>
        <span>une bille</span>
      </DropBox>,
    );
    const heading = screen.getByRole("heading", { name: "Ronds" });
    const box = heading.parentElement as HTMLElement;
    expect(box.getAttribute("data-armed")).toBeNull();
    expect(box.textContent).toContain("une bille");

    rerender(
      <DropBox tone={0} label="Ronds" armed over={false} state="juste">
        <span>une bille</span>
      </DropBox>,
    );
    expect(box.getAttribute("data-armed")).toBe("true");
    expect(box.getAttribute("data-state")).toBe("juste");
  });

  it("une boîte qui nomme une chose pose son image dans la plaque, devant le nom ; le titre reste l'enfant direct de la boîte", () => {
    render(
      <DropBox tone={0} label="La poule" picture={<span data-testid="pastille" />} armed={false} over={false}>
        <span />
      </DropBox>,
    );
    const heading = screen.getByRole("heading", { name: "La poule" });
    expect(heading.parentElement?.className).toContain("gk-box");
    expect(heading.firstElementChild).toBe(screen.getByTestId("pastille"));
    expect(heading.textContent).toBe("La poule");
    // L'image et le nom se rangent sur une ligne si la plaque est large, l'un sous l'autre sinon.
    expect(heading.className).toContain("flex-wrap");
  });

  it("sans image, la plaque est celle d'avant, au caractère près", () => {
    render(
      <DropBox tone={0} label="Ronds" armed={false} over={false}>
        <span />
      </DropBox>,
    );
    expect(screen.getByRole("heading", { name: "Ronds" }).className).toBe(
      "relative mx-auto mt-1.5 w-fit max-w-[calc(100%-1.5rem)] rounded-xl border-2 border-white/80 bg-[#fff8e6] px-4 py-1.5 text-center font-display text-lg font-extrabold leading-tight shadow-[0_3px_0_#d6c39a] [overflow-wrap:anywhere]",
    );
  });

  it("la boîte survolée s'enfonce (transform seulement)", () => {
    render(
      <DropBox tone={1} label="Carrés" armed={false} over>
        <span />
      </DropBox>,
    );
    const box = screen.getByRole("heading", { name: "Carrés" }).parentElement as HTMLElement;
    expect(box.className).toContain("translate-y-[3px]");
    expect(box.getAttribute("data-over")).toBe("true");
  });

  it("la pierre montre son numéro ; le creux est décoratif", () => {
    const { container } = render(
      <>
        <StepNumber n={3} tone={2} />
        <StepSlot />
      </>,
    );
    expect(container.querySelector(".gk-step")?.textContent).toBe("3");
    expect(container.querySelector(".gk-slot")?.getAttribute("aria-hidden")).toBe("true");
  });
});

describe("isGlyphOnly et TileGlyphs — grand quand ça se lit par l'image", () => {
  it("des émojis, des chiffres, une forme : oui ; un mot, une syllabe, une longue rangée : non", () => {
    expect(isGlyphOnly("🥭🥭🥭")).toBe(true);
    expect(isGlyphOnly("2")).toBe(true);
    expect(isGlyphOnly("3 + 4")).toBe(true);
    expect(isGlyphOnly("ma")).toBe(false);
    expect(isGlyphOnly("bissap")).toBe(false);
    expect(isGlyphOnly("")).toBe(false);
    expect(isGlyphOnly("🥭".repeat(17))).toBe(false);
  });

  it("un cadran d'horloge seul se dessine plus grand : ses aiguilles ne se lisent pas à 34 px", () => {
    const clock = String.fromCodePoint(0x1f566);
    const { container, rerender } = render(<TileGlyphs text={clock} />);
    expect(container.innerHTML).toContain("text-[3rem]");
    expect(container.innerHTML).not.toContain("text-[1.75rem]");
    // Deux cadrans ou un autre émoji gardent la taille des glyphes.
    rerender(<TileGlyphs text={`${clock}${clock}`} />);
    expect(container.innerHTML).toContain("text-[1.75rem]");
    rerender(<TileGlyphs text={String.fromCodePoint(0x1f414)} />);
    expect(container.innerHTML).toContain("text-[1.75rem]");
  });

  it("le contenu grand porte la taille, le mot garde la coupure douce", () => {
    const { container, rerender } = render(<TileGlyphs text="🐔🍌" />);
    expect(container.innerHTML).toContain("text-[1.75rem]");
    rerender(<TileGlyphs text="bissap" />);
    expect(container.innerHTML).not.toContain("text-[1.75rem]");
    expect(container.innerHTML).toContain("overflow-wrap:anywhere");
  });
});
