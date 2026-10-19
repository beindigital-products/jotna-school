import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ExerciseGallery } from "../gallery";

/**
 * LA GALERIE POSE LE FOURNISSEUR D'IMAGES COMME LA SÉANCE : la porte de la classe du spécimen
 * (`isPictureTileClass`), sauf si l'URL en décide (`?images=0|1`).
 *
 * Les écrans d'exercice sont remplacés par une sonde qui lit la porte (`useItemPicturesEnabled`) :
 * ce que le test prouve est ce que le fournisseur de la galerie ouvre ou ferme, quel que soit
 * l'usage que les écrans en font.
 */

const url = vi.hoisted(() => ({ search: new URLSearchParams() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => "/dev/exercices/",
  useSearchParams: () => url.search,
}));
// Le lecteur de consigne (CI et CP) demande ses clips à Convex : ici, personne à qui les demander.
vi.mock("@/components/offline/clip-source", () => ({ useClipSource: () => vi.fn() }));

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

afterEach(cleanup);

/** Ouvre la galerie sur ce paramètre d'URL et rend la porte vue par l'écran, et la marque de la carte. */
function gallery(query: string) {
  url.search = new URLSearchParams(`${query}&barre=0`);
  const { container } = render(<ExerciseGallery />);
  const card = container.querySelector("[data-specimen]");
  return { door: screen.getByTestId("porte").textContent, mark: card?.getAttribute("data-pictures"), card };
}

describe("la galerie des exercices et les images de tuile", () => {
  it("ouvre la porte pour un spécimen de CI, comme la séance", () => {
    expect(gallery("type=qcm4")).toMatchObject({ door: "images", mark: "1" });
    cleanup();
    expect(gallery("type=qcm-intrus")).toMatchObject({ door: "images", mark: "1" });
  });

  it("la ferme pour un spécimen de CP (la réponse courte des billes), comme la séance", () => {
    const shown = gallery("type=short-answer");
    expect(shown.card?.getAttribute("data-specimen")).toBe("short-answer");
    expect(shown).toMatchObject({ door: "sans images", mark: "0" });
  });

  it("images=0 la ferme même pour le CI : c'est l'écran d'avant", () => {
    expect(gallery("type=qcm4&images=0")).toMatchObject({ door: "sans images", mark: "0" });
  });

  it("images=1 l'ouvre même pour le CP : un aperçu du CP élargi", () => {
    expect(gallery("type=short-answer&images=1")).toMatchObject({ door: "images", mark: "1" });
  });

  it("un paramètre qu'elle ne connaît pas laisse la classe décider", () => {
    expect(gallery("type=qcm4&images=oui")).toMatchObject({ door: "images", mark: "1" });
    cleanup();
    expect(gallery("type=short-answer&images=oui")).toMatchObject({ door: "sans images", mark: "0" });
  });
});
