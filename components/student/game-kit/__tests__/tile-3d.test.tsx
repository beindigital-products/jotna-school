import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ELEVATIONS, elevationFor, Tile3D, toneFor } from "../tile-3d";
import { TILE_CORRECT_TONE, TILE_WRONG_TONE, tileChosenTone, tileRestTone } from "../tones";
import { GameFeelProvider } from "../use-game-feel";

describe("elevationFor — l'élévation suit l'état", () => {
  it("choisie se soulève, le reste est posé, l'appelant peut forcer", () => {
    expect(elevationFor("repos")).toBe("posee");
    expect(elevationFor("choisie")).toBe("soulevee");
    expect(elevationFor("juste")).toBe("posee");
    expect(elevationFor("fausse")).toBe("posee");
    expect(elevationFor("repos", "saisie")).toBe("saisie");
  });

  it("l'échelle monte : plat, posée, soulevée, saisie", () => {
    expect(ELEVATIONS.plat.depth).toBe(0);
    expect(ELEVATIONS.posee.lift).toBe(0);
    expect(ELEVATIONS.soulevee.lift).toBeLessThan(ELEVATIONS.posee.lift);
    expect(ELEVATIONS.saisie.lift).toBeLessThan(ELEVATIONS.soulevee.lift);
    expect(ELEVATIONS.saisie.shadowY).toBeGreaterThan(ELEVATIONS.soulevee.shadowY);
    expect(ELEVATIONS.soulevee.shadowY).toBeGreaterThan(ELEVATIONS.posee.shadowY);
    // Plus la tuile monte, plus son ombre pâlit.
    expect(ELEVATIONS.saisie.shadowOpacity).toBeLessThan(ELEVATIONS.posee.shadowOpacity);
  });
});

describe("toneFor — la teinte suit l'état", () => {
  it("juste et fausse ignorent l'option ; repos et choisie la suivent", () => {
    expect(toneFor("juste", 3)).toBe(TILE_CORRECT_TONE);
    expect(toneFor("fausse", 3)).toBe(TILE_WRONG_TONE);
    expect(toneFor("repos", 2)).toEqual(tileRestTone(2));
    expect(toneFor("choisie", 2)).toEqual(tileChosenTone(2));
  });
});

describe("Tile3D — un bouton, avec sa sémantique", () => {
  it("rend un bouton nommé par son contenu, pressé quand il est choisi", () => {
    const { rerender } = render(
      <Tile3D onPress={() => {}} badge="A">
        la mangue
      </Tile3D>,
    );
    const button = screen.getByRole("button", { name: "la mangue" });
    expect(button.getAttribute("aria-pressed")).toBe("false");
    expect(button.getAttribute("data-state")).toBe("repos");
    expect(button.getAttribute("data-elevation")).toBe("posee");

    rerender(
      <Tile3D onPress={() => {}} badge="A" state="choisie">
        la mangue
      </Tile3D>,
    );
    expect(button.getAttribute("aria-pressed")).toBe("true");
    expect(button.getAttribute("data-elevation")).toBe("soulevee");
  });

  it("appelle onPress au toucher, pas quand elle est désactivée", () => {
    const onPress = vi.fn();
    const { rerender } = render(<Tile3D onPress={onPress}>la mangue</Tile3D>);
    fireEvent.click(screen.getByRole("button", { name: "la mangue" }));
    expect(onPress).toHaveBeenCalledTimes(1);

    rerender(
      <Tile3D onPress={onPress} disabled>
        la mangue
      </Tile3D>,
    );
    const button = screen.getByRole("button", { name: "la mangue" }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    fireEvent.click(button);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("juste gonfle, fausse secoue doucement : des classes d'animation, jamais de rouge", () => {
    const { container, rerender } = render(<Tile3D state="juste">7</Tile3D>);
    expect(container.innerHTML).toContain("gk-pop");
    rerender(<Tile3D state="fausse">7</Tile3D>);
    expect(container.innerHTML).toContain("gk-shake-soft");
    expect(container.innerHTML).not.toContain("gk-pop");
  });

  it("l'icône d'état remplace la pastille, ou se pose en coin quand il n'y en a pas", () => {
    const { container, rerender } = render(
      <Tile3D state="juste" badge="A">
        la mangue
      </Tile3D>,
    );
    expect(container.querySelector(".gk-tile-corner")).toBeNull();
    expect(container.querySelector("svg.lucide-check")).not.toBeNull();

    rerender(
      <Tile3D state="fausse" align="center">
        7
      </Tile3D>,
    );
    const corner = container.querySelector(".gk-tile-corner");
    expect(corner).not.toBeNull();
    expect(corner?.querySelector("svg.lucide-x")).not.toBeNull();

    rerender(
      <Tile3D state="repos" align="center">
        7
      </Tile3D>,
    );
    expect(container.querySelector(".gk-tile-corner")).toBeNull();
  });

  it("rend une div quand dnd-kit tient la sémantique", () => {
    render(
      <Tile3D as="div" role="option" aria-selected={false} elevation="saisie">
        une étiquette
      </Tile3D>,
    );
    const tile = screen.getByRole("option", { name: "une étiquette" });
    expect(tile.tagName).toBe("DIV");
    expect(tile.getAttribute("data-elevation")).toBe("saisie");
  });

  it("au niveau sobre, aucune écoute du doigt pour l'inclinaison", () => {
    render(
      <GameFeelProvider level="sobre">
        <Tile3D onPress={() => {}}>la mangue</Tile3D>
      </GameFeelProvider>,
    );
    const button = screen.getByRole("button", { name: "la mangue" });
    const object = button.querySelector(".gk-spring") as HTMLElement;
    fireEvent.pointerMove(button, { clientX: 10, clientY: 10 });
    expect(object.style.getPropertyValue("--gk-rx")).toBe("");
  });
});

describe("Tile3D — l'inclinaison par l'appareil (`useDeviceTilt`)", () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    delete (window as Window & { DeviceOrientationEvent?: unknown }).DeviceOrientationEvent;
  });

  /** jsdom n'a pas de capteur : l'événement, tel qu'un navigateur l'envoie. */
  class FakeOrientationEvent extends Event {
    beta: number | null;
    gamma: number | null;
    constructor(type: string, init: { beta?: number | null; gamma?: number | null } = {}) {
      super(type);
      this.beta = init.beta ?? null;
      this.gamma = init.gamma ?? null;
    }
  }
  const rootVar = (name: string) => document.documentElement.style.getPropertyValue(name);
  const tilt = (init: { beta: number | null; gamma: number | null }) =>
    window.dispatchEvent(new FakeOrientationEvent("deviceorientation", init));

  it("ignore un capteur absent, n'écrit que ce qui change, et se tait dès que la tuile part", () => {
    // Les tuiles des autres tests, encore montées, tiendraient l'écoute ouverte.
    cleanup();
    vi.useFakeTimers();
    Object.defineProperty(window, "DeviceOrientationEvent", { value: FakeOrientationEvent, configurable: true, writable: true });
    const setProperty = vi.spyOn(document.documentElement.style, "setProperty");
    const { unmount } = render(
      <GameFeelProvider level="riche">
        <Tile3D onPress={() => {}}>la mangue</Tile3D>
      </GameFeelProvider>,
    );
    // Chrome de bureau : un événement unique, sans mesure. Les tuiles restent droites.
    tilt({ beta: null, gamma: null });
    expect(rootVar("--gk-dev-rx")).toBe("");
    expect(rootVar("--gk-dev-ry")).toBe("");
    // Le téléphone tenu à 45°, un peu penché à droite.
    tilt({ beta: 45, gamma: 20 });
    expect(rootVar("--gk-dev-rx")).toBe("0deg");
    expect(rootVar("--gk-dev-ry")).toBe("2deg");
    const writes = setProperty.mock.calls.length;
    // La même mesure un dixième de seconde plus tard : rien à réécrire.
    vi.advanceTimersByTime(100);
    tilt({ beta: 45, gamma: 20 });
    expect(setProperty.mock.calls.length).toBe(writes);
    // Une autre mesure, bornée à 4° et arrondie au demi-degré.
    vi.advanceTimersByTime(100);
    tilt({ beta: -60, gamma: -7 });
    expect(rootVar("--gk-dev-rx")).toBe("4deg");
    expect(rootVar("--gk-dev-ry")).toBe("-0.5deg");
    // La tuile démontée : les variables s'effacent, plus rien n'est écouté.
    unmount();
    expect(rootVar("--gk-dev-rx")).toBe("");
    vi.advanceTimersByTime(100);
    tilt({ beta: 0, gamma: 0 });
    expect(rootVar("--gk-dev-rx")).toBe("");
    setProperty.mockRestore();
  });

  it("une savane sans tuile n'écoute pas l'appareil", async () => {
    cleanup();
    Object.defineProperty(window, "DeviceOrientationEvent", { value: FakeOrientationEvent, configurable: true, writable: true });
    const { StageBackdrop } = await import("../stage-backdrop");
    render(
      <GameFeelProvider level="riche">
        <StageBackdrop />
      </GameFeelProvider>,
    );
    tilt({ beta: 10, gamma: 10 });
    expect(rootVar("--gk-dev-rx")).toBe("");
  });
});
