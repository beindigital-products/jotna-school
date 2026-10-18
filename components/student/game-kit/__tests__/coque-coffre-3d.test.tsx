import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MotionGlobalConfig } from "framer-motion";
import { chestGeometry, Coffre3D, LID_OPEN_DEG } from "../coque-coffre-3d";
import { GameFeelProvider } from "../use-game-feel";

MotionGlobalConfig.skipAnimations = true;

vi.mock("@/hooks/use-device-tier", () => ({ useDeviceTier: () => "full" }));
vi.mock("@/lib/sounds", () => ({ getSoundEnabledLocal: () => false, play: vi.fn() }));
vi.mock("canvas-confetti", () => ({ default: vi.fn() }));

afterEach(() => cleanup());

describe("chestGeometry — les deux boîtes", () => {
  it("découle de la largeur : un corps plus large que haut, un couvercle plat", () => {
    const g = chestGeometry(150);
    expect(g.w).toBe(150);
    expect(g.h).toBeLessThan(g.w);
    expect(g.lidH).toBeLessThan(g.h);
    expect(g.box.width).toBeGreaterThan(g.w);
    // Positif : le bord avant du couvercle se LÈVE (un angle négatif le faisait
    // tomber derrière la caisse) ; au-delà de 90°, on voit son dessous.
    expect(LID_OPEN_DEG).toBeGreaterThan(90);
  });
});

describe("Coffre3D — un coffre en faces, pas en WebGL", () => {
  it("fermé : cadenassé, le couvercle baissé, rien ne jaillit", () => {
    render(<Coffre3D open={false} />);
    const chest = screen.getByRole("img", { name: "Le coffre au trésor est fermé" });
    expect(chest.getAttribute("data-open")).toBe("false");
    expect(chest.querySelector("[data-lid]")?.getAttribute("data-lid")).toBe("ferme");
    expect(chest.querySelector("svg.lucide-lock")).not.toBeNull();
    // Cinq faces au corps (pas de dessus : c'est l'ouverture), six au couvercle.
    expect(chest.querySelectorAll("[data-lid] span.absolute.border").length).toBe(6);
  });

  it("ouvert : le couvercle se lève, l'éclat de la récompense est posé au-dessus", () => {
    render(
      <GameFeelProvider level="riche">
        <Coffre3D open />
      </GameFeelProvider>,
    );
    const chest = screen.getByRole("img", { name: "Le coffre au trésor est ouvert" });
    expect(chest.querySelector("[data-lid]")?.getAttribute("data-lid")).toBe("ouvert");
    expect(chest.querySelector("svg.lucide-lock")).toBeNull();
    expect(chest.querySelector(".gk-reward")).not.toBeNull();
    // Ni rognage ni arrondi sur le conteneur 3D : Safari aplatirait la scène.
    expect(chest.className).toContain("overflow-visible");
    expect(chest.className).not.toContain("rounded");
  });
});
