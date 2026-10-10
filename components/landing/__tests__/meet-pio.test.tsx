import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MotionGlobalConfig } from "framer-motion";

import { MeetPio } from "../meet-pio";
import { MEET_BASE, MOMENTS } from "../pio-moments";
import { REACTION_MS, TAP_LINES } from "../pio-reactions";

// Les entrées de la bulle sont animées : dans un test, elles se jouent d'un coup.
MotionGlobalConfig.skipAnimations = true;

/** L'appareil et l'écran, que les tests choisissent. */
const env = vi.hoisted(() => ({ tier: "full" as "lite" | "full", wide: true }));
vi.mock("@/hooks/use-device-tier", () => ({ useDeviceTier: () => env.tier }));
vi.mock("../use-media-query", () => ({ useMediaQuery: () => env.wide }));

/** Les observateurs créés par la page : un test peut dire « la section approche ». */
const observers: Array<() => void> = [];
const scrollIntoView = vi.fn();

beforeAll(() => {
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
  Element.prototype.scrollIntoView = scrollIntoView;
});
beforeEach(() => {
  vi.useFakeTimers();
  observers.length = 0;
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(private callback: IntersectionObserverCallback) {
        observers.push(() => this.callback([{ isIntersecting: true } as IntersectionObserverEntry], this as never));
      }
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    },
  );
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  scrollIntoView.mockClear();
  env.tier = "full";
  env.wide = true;
});

const sectionApproaches = () => act(() => observers.forEach((notify) => notify()));
/** Laisse le temps passer : la bulle sort avant que la suivante n'entre (`AnimatePresence`), image par image. */
const settle = (ms = 60) =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
const bubble = () => screen.getByRole("status").textContent;
const momentButton = (id: (typeof MOMENTS)[number]["id"]) => {
  const moment = MOMENTS.find((entry) => entry.id === id)!;
  return screen.getByRole("button", { name: new RegExp(moment.title.replaceAll(NBSP, " ")) });
};
const NBSP = " ";

describe("la section « Faites connaissance avec Pio »", () => {
  it("présente Pio, sa scène et les quatre moments où il parle à l'enfant", () => {
    render(<MeetPio />);
    expect(screen.getByRole("heading", { level: 2, name: "Faites connaissance avec Pio." })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Toucher Pio" })).toBeTruthy();
    for (const moment of MOMENTS) expect(momentButton(moment.id).getAttribute("aria-pressed")).toBe("false");
    expect(bubble()).toBe(MEET_BASE.line);
    expect(screen.getByRole("img", { name: "Pio te dit bonjour" })).toBeTruthy();
  });

  it("fait prendre à Pio la pose du moment choisi et lui fait dire sa phrase, la même que dans l'application", async () => {
    render(<MeetPio />);
    const labels = { reussite: "Pio célèbre avec toi", erreur: "Pio t'encourage", difficulte: "Pio te réconforte" } as const;
    for (const id of ["reussite", "erreur", "difficulte"] as const) {
      fireEvent.click(momentButton(id));
      await settle();
      expect(bubble()).toBe(MOMENTS.find((moment) => moment.id === id)!.line);
      expect(within(screen.getByRole("button", { name: "Toucher Pio" })).getByRole("img").getAttribute("aria-label")).toBe(labels[id]);
      expect(momentButton(id).getAttribute("aria-pressed")).toBe("true");
      // Un seul moment à la fois.
      expect(screen.getAllByRole("button", { pressed: true })).toHaveLength(1);
    }
  });

  it("revient à l'accueil de Pio quand on désélectionne le moment", async () => {
    render(<MeetPio />);
    fireEvent.click(momentButton("reussite"));
    fireEvent.click(momentButton("reussite"));
    await settle();
    expect(momentButton("reussite").getAttribute("aria-pressed")).toBe("false");
    expect(bubble()).toBe(MEET_BASE.line);
  });

  it("ramène la scène à l'écran quand on choisit un moment (sur un téléphone, la liste est dessous)", () => {
    render(<MeetPio />);
    fireEvent.click(momentButton("erreur"));
    expect(scrollIntoView).toHaveBeenCalledWith({ block: "nearest", behavior: "smooth" });
    scrollIntoView.mockClear();
    // Désélectionner ne fait pas défiler la page.
    fireEvent.click(momentButton("erreur"));
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it("réagit au toucher, puis reprend la pose du moment choisi", async () => {
    render(<MeetPio />);
    fireEvent.click(momentButton("difficulte"));
    await settle();
    fireEvent.click(screen.getByRole("button", { name: "Toucher Pio" }));
    await settle();
    expect(TAP_LINES).toContain(bubble());
    await settle(REACTION_MS);
    expect(bubble()).toBe(MOMENTS.find((moment) => moment.id === "difficulte")!.line);
  });
});

describe("ce que la section télécharge", () => {
  it("rien de lourd tant que la section est loin : l'affiche légère de Pio, la savane en CSS, pas de clip", () => {
    const { container } = render(<MeetPio />);
    expect(container.querySelector("video")).toBeNull();
    expect(container.querySelector("img[src*='hub-savanna']")).toBeNull();
    expect(container.querySelector("img[src='/images/pio/lite/hello.webp']")).not.toBeNull();
  });

  it("peint la savane et lance le clip quand la section approche, sur un appareil capable", () => {
    const { container } = render(<MeetPio />);
    sectionApproaches();
    expect(container.querySelector("img[src*='hub-savanna']")).not.toBeNull();
    expect(container.querySelector("video")).not.toBeNull();
  });

  it("garde l'affiche légère et la savane en CSS sur un appareil modeste, même tout près", () => {
    env.tier = "lite";
    const { container } = render(<MeetPio />);
    sectionApproaches();
    expect(container.querySelector("video")).toBeNull();
    expect(container.querySelector("img[src*='hub-savanna']")).toBeNull();
  });

  it("charge le clip d'un moment choisi, mais pas celui d'une réaction de deux secondes et demie", async () => {
    const { container } = render(<MeetPio />);
    sectionApproaches();

    fireEvent.click(momentButton("reussite"));
    expect(container.querySelector("video source[src='/videos/pio/cheer.webm']")).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Toucher Pio" }));
    await settle();
    expect(container.querySelector("video")).toBeNull();
    expect(container.querySelector("img[src^='/images/pio/lite/']")).not.toBeNull();

    await settle(REACTION_MS);
    expect(container.querySelector("video source[src='/videos/pio/cheer.webm']")).not.toBeNull();
  });
});
