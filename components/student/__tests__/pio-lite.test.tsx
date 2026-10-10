import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MotionGlobalConfig } from "framer-motion";

import { Pio, pioPosterSrc, type PioState } from "../pio";
import { SpeechBubble } from "../game/speech-bubble";
import { SavannaBackdrop } from "../world/savanna-backdrop";

// Les entrées et sorties de la bulle sont animées : dans un test, elles se jouent d'un coup.
MotionGlobalConfig.skipAnimations = true;

/** Le tier de l'appareil, que les tests choisissent. */
const device = vi.hoisted(() => ({ tier: "full" as "lite" | "full" }));
vi.mock("@/hooks/use-device-tier", () => ({ useDeviceTier: () => device.tier }));

beforeAll(() => {
  // jsdom ne lit pas de vidéo : `play()` n'y est pas implémenté.
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
});
afterEach(() => {
  cleanup();
  device.tier = "full";
});

describe("les affiches légères de Pio (`lite`)", () => {
  it("sert le WebP léger de la pose, et le PNG d'origine sans `lite`", () => {
    expect(pioPosterSrc("hello", "classic", true)).toBe("/images/pio/lite/hello.webp");
    expect(pioPosterSrc("hello", "classic")).toBe("/images/pio/hello.png");
    expect(pioPosterSrc("hello", "classic", false)).toBe("/images/pio/hello.png");
  });

  it("part de la pose calme pour la marche, comme avant", () => {
    expect(pioPosterSrc("walk", "classic", true)).toBe("/images/pio/lite/idle.webp");
    expect(pioPosterSrc("walk", "classic")).toBe("/images/pio/idle.png");
  });

  it("une pose absente de la tenue retombe sur la plus proche, avec son affiche légère", () => {
    // Le salut du boubou n'existe pas dans la tenue de tous les jours : c'est « hello ».
    expect(pioPosterSrc("salam", "classic", true)).toBe("/images/pio/lite/hello.webp");
  });

  it("le boubou n'a pas d'affiche légère : il garde ses PNG", () => {
    expect(pioPosterSrc("salam", "boubou", true)).toBe("/images/pio/boubou/salam.png");
    expect(pioPosterSrc("salam", "boubou")).toBe("/images/pio/boubou/salam.png");
  });

  it("affiche la pose en image légère quand le clip ne joue pas", () => {
    render(<Pio state="cheer" lite animated={false} />);
    expect(screen.getByRole("img", { name: "Pio célèbre avec toi" })).toBeTruthy();
    const image = document.querySelector("img");
    expect(image?.getAttribute("src")).toBe("/images/pio/lite/cheer.webp");
    expect(document.querySelector("video")).toBeNull();
  });

  it("garde le PNG d'origine par défaut : l'espace élève ne change pas", () => {
    render(<Pio state="cheer" animated={false} />);
    expect(document.querySelector("img")?.getAttribute("src")).toBe("/images/pio/cheer.png");
  });

  it("pose l'affiche légère sur le clip, le temps de son chargement", () => {
    render(<Pio state="hello" lite />);
    const video = document.querySelector("video");
    expect(video?.getAttribute("poster")).toBe("/images/pio/lite/hello.webp");
    // Les clips, eux, ne changent pas.
    expect([...document.querySelectorAll("source")].map((source) => source.getAttribute("src"))).toEqual([
      "/videos/pio/hello.mov",
      "/videos/pio/hello.webm",
    ]);
  });

  it("a une affiche légère pour chaque pose de la tenue de tous les jours", () => {
    const poses: PioState[] = ["idle", "hello", "cheer", "sad", "amazed", "encourage", "think", "sleep", "walk"];
    for (const pose of poses) expect(pioPosterSrc(pose, "classic", true), pose).toMatch(/^\/images\/pio\/lite\/\w+\.webp$/);
  });
});

describe("la bulle de Pio", () => {
  it("garde sa taille d'origine par défaut, queue vers le bas", () => {
    render(<SpeechBubble bubbleKey="a">Coucou !</SpeechBubble>);
    const bubble = screen.getByRole("status");
    expect(bubble.className).toContain("max-w-[19rem]");
    expect(bubble.className).not.toContain("text-balance");
    expect(bubble.querySelector("span")?.className).toContain("-bottom-2.5");
  });

  it("peut être compacte, pour un petit Pio, et pointer sa queue vers la gauche", () => {
    render(
      <SpeechBubble bubbleKey="a" compact tail="left">
        Coucou !
      </SpeechBubble>,
    );
    const bubble = screen.getByRole("status");
    expect(bubble.className).toContain("max-w-[14rem]");
    // Les lignes d'une bulle compacte sont équilibrées : « Touche-moi » ne se coupe pas au tiret.
    expect(bubble.className).toContain("text-balance");
    expect(bubble.querySelector("span")?.className).toContain("-left-2.5");
  });
});

describe("le décor de la savane", () => {
  it("peint la scène sur un appareil capable", () => {
    const { container } = render(<SavannaBackdrop>x</SavannaBackdrop>);
    expect(container.querySelector("img[src*='hub-savanna']")).not.toBeNull();
  });

  it("n'en charge pas le bitmap tant que l'appelant ne le demande pas (`painted={false}`)", () => {
    const { container } = render(<SavannaBackdrop painted={false}>x</SavannaBackdrop>);
    expect(container.querySelector("img")).toBeNull();
    // Le décor CSS tient la place : un soleil, des collines, un sol.
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("garde le décor CSS sur un appareil modeste, peint ou non", () => {
    device.tier = "lite";
    const { container } = render(<SavannaBackdrop painted>x</SavannaBackdrop>);
    expect(container.querySelector("img")).toBeNull();
  });
});
