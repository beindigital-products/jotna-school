import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MotionGlobalConfig } from "framer-motion";

import { CardPio, GreeterPio } from "../hero-pio";
import { HERO_BASE } from "../pio-moments";
import { REACTION_MS, TAP_LINES } from "../pio-reactions";

// Les entrées de la bulle sont animées : dans un test, elles se jouent d'un coup.
MotionGlobalConfig.skipAnimations = true;

/** L'appareil et l'écran, que les tests choisissent. */
const env = vi.hoisted(() => ({ tier: "full" as "lite" | "full", desktop: true }));
vi.mock("@/hooks/use-device-tier", () => ({ useDeviceTier: () => env.tier }));
vi.mock("../use-media-query", () => ({ useMediaQuery: () => env.desktop }));

beforeAll(() => {
  // jsdom ne lit pas de vidéo : `play()` n'y est pas implémenté.
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
});
beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  env.tier = "full";
  env.desktop = true;
});

/** Laisse le temps passer : la bulle sort avant que la suivante n'entre (`AnimatePresence`), image par image. */
const settle = (ms = 60) =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });

/** La page a fini de charger : `useAfterLoad` laisse passer 600 ms. */
const pageLoaded = () => settle(700);

describe("Pio, tout en haut de la page", () => {
  it("fait coucou dans sa bulle, avec un bouton pour le faire réagir", () => {
    render(<CardPio />);
    expect(screen.getByRole("status").textContent).toBe(HERO_BASE.line);
    expect(screen.getByRole("button", { name: "Faire réagir Pio" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "Pio te dit bonjour" })).toBeTruthy();
  });

  it("n'a qu'une place à l'écran : à côté de la carte sur un grand écran, au-dessus du titre sur un téléphone", () => {
    const { container: card } = render(<CardPio />);
    expect((card.firstElementChild as HTMLElement).className).toMatch(/\bhidden\b.*\blg:flex\b/);
    const { container: greeter } = render(<GreeterPio />);
    expect((greeter.firstElementChild as HTMLElement).className).toMatch(/\blg:hidden\b/);
  });

  it("ne montre d'abord que l'affiche légère de la pose : ni clip, ni PNG d'un demi-mégaoctet", () => {
    const { container } = render(<CardPio />);
    expect(container.querySelector("video")).toBeNull();
    expect(container.querySelector("img")?.getAttribute("src")).toBe("/images/pio/lite/hello.webp");
  });

  it("lance le clip une fois la page chargée, sur un grand écran, dans la carte seulement", async () => {
    env.desktop = true;
    const card = render(<CardPio />);
    const greeter = render(<GreeterPio />);
    await pageLoaded();
    expect(card.container.querySelector("video")).not.toBeNull();
    expect(greeter.container.querySelector("video")).toBeNull();
  });

  it("lance le clip sur un téléphone dans le salut seulement : l'autre Pio n'est pas à l'écran, il ne se télécharge pas", async () => {
    env.desktop = false;
    const card = render(<CardPio />);
    const greeter = render(<GreeterPio />);
    await pageLoaded();
    expect(card.container.querySelector("video")).toBeNull();
    expect(greeter.container.querySelector("video")).not.toBeNull();
  });

  it("ne lance jamais de clip sur un appareil modeste (économiseur de données, 2G, petite machine)", async () => {
    env.tier = "lite";
    const { container } = render(<CardPio />);
    await pageLoaded();
    expect(container.querySelector("video")).toBeNull();
    expect(container.querySelector("img")?.getAttribute("src")).toBe("/images/pio/lite/hello.webp");
  });

  it("réagit au toucher en image fixe, puis reprend son clip : pas de mégaoctet pour deux secondes et demie", async () => {
    const { container } = render(<CardPio />);
    await pageLoaded();
    expect(container.querySelector("video")).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Faire réagir Pio" }));
    await settle();
    expect(container.querySelector("video")).toBeNull();
    expect(container.querySelector("img")?.getAttribute("src")).toMatch(/^\/images\/pio\/lite\/\w+\.webp$/);
    expect(TAP_LINES).toContain(screen.getByRole("status").textContent);

    await settle(REACTION_MS);
    expect(screen.getByRole("status").textContent).toBe(HERO_BASE.line);
    expect(container.querySelector("video")).not.toBeNull();
  });
});
