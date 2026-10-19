import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MotionGlobalConfig } from "framer-motion";
import { FakeSession } from "../seance";

/**
 * LA SÉANCE FACTICE POSE LE FOURNISSEUR D'IMAGES COMME LA VRAIE SÉANCE : la porte de la classe
 * de l'exercice affiché (`isPictureTileClass`), sauf si l'URL en décide (`?images=0|1`).
 *
 * Les écrans d'exercice sont remplacés par une sonde qui lit la porte (`useItemPicturesEnabled`).
 * La coque de jeu (`SessionStage`), elle, est la vraie.
 */

// Les entrées de la carte et de la bulle sont animées : dans un test, d'un coup.
MotionGlobalConfig.skipAnimations = true;

const url = vi.hoisted(() => ({ search: new URLSearchParams() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => "/dev/seance/",
  useSearchParams: () => url.search,
}));
vi.mock("@/hooks/use-device-tier", () => ({ useDeviceTier: () => "full" }));
vi.mock("@/components/offline/clip-source", () => ({ useClipSource: () => vi.fn() }));
// Pas de Howler dans jsdom : le son est un module muet.
vi.mock("@/lib/sounds", () => ({
  preloadAll: vi.fn(),
  getSoundEnabledLocal: () => false,
  play: vi.fn(),
  playCorrect: vi.fn(),
}));
vi.mock("@/components/exercises/QcmExercise", async () => {
  const { useItemPicturesEnabled } = await import("@/components/exercises/item-pictures");
  function Door() {
    return <p data-testid="porte">{useItemPicturesEnabled() ? "images" : "sans images"}</p>;
  }
  return { default: Door };
});
vi.mock("@/components/exercises/ShortAnswerExercise", async () => {
  const { useItemPicturesEnabled } = await import("@/components/exercises/item-pictures");
  function Door() {
    return <p data-testid="porte">{useItemPicturesEnabled() ? "images" : "sans images"}</p>;
  }
  return { default: Door };
});

beforeAll(() => {
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
});
afterEach(cleanup);

/** Ouvre la séance factice sur ce paramètre d'URL et rend la porte vue par la première question. */
function session(query: string) {
  url.search = new URLSearchParams(`${query}&barre=0`);
  render(<FakeSession />);
  return screen.getByTestId("porte").textContent;
}

describe("la séance factice et les images de tuile", () => {
  it("ouvre la porte pour un exercice de CI, comme la vraie séance", () => {
    expect(session("exo=qcm4")).toBe("images");
    cleanup();
    expect(session("exo=qcm-intrus")).toBe("images");
  });

  it("la ferme pour un exercice de CP, comme la vraie séance", () => {
    expect(session("exo=short-answer")).toBe("sans images");
  });

  it("images=0 la ferme même pour le CI : c'est l'écran d'avant", () => {
    expect(session("exo=qcm4&images=0")).toBe("sans images");
  });

  it("images=1 l'ouvre même pour le CP : un aperçu du CP élargi", () => {
    expect(session("exo=short-answer&images=1")).toBe("images");
  });

  it("un paramètre qu'elle ne connaît pas laisse la classe décider", () => {
    expect(session("exo=qcm4&images=oui")).toBe("images");
    cleanup();
    expect(session("exo=short-answer&images=oui")).toBe("sans images");
  });
});
