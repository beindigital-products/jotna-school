import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MotionGlobalConfig } from "framer-motion";
import { palierStarRating } from "@/convex/progressionRules";
import { PalierResultScreen, palierStars } from "../palier-result";

MotionGlobalConfig.skipAnimations = true;

vi.mock("@/hooks/use-device-tier", () => ({ useDeviceTier: () => "full" }));
vi.mock("@/lib/sounds", () => ({
  preloadAll: vi.fn(),
  getSoundEnabledLocal: () => false,
  play: vi.fn(),
  playBadge: vi.fn(),
  playLevelUp: vi.fn(),
  setSoundEnabledLocal: vi.fn(),
  hasOptInBeenAsked: () => true,
  markOptInAsked: vi.fn(),
}));
vi.mock("canvas-confetti", () => ({ default: vi.fn() }));
// Le carnet et les missions viennent de l'appareil ou du serveur : ici, rien n'est encore arrivé.
vi.mock("@/hooks/use-student-data", () => ({
  useDailyQuests: () => undefined,
  useStudentStats: () => undefined,
  useStudentActions: () => ({ markBadgesSeen: vi.fn(), markLevelSeen: vi.fn() }),
}));

beforeAll(() => {
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
});
afterEach(() => cleanup());

function renderResult(status: "validated" | "failed", extra: Partial<Parameters<typeof PalierResultScreen>[0]> = {}) {
  const onRegen = vi.fn();
  const utils = render(
    <PalierResultScreen
      result={{ status, starsTotal: status === "validated" ? 26 : 14, exerciseCount: 10, thresholdTenths: 7, canRegen: status === "failed" }}
      topicName="Les nombres jusqu'à 10"
      palierIndex={2}
      palierCount={3}
      nextPalierHref={status === "validated" ? "/student/topics/session?id=t&palier=3" : null}
      trailHref="/student/subjects?id=s"
      regenerating={false}
      onRegen={onRegen}
      capAlternatives={<p>alternatives</p>}
      {...extra}
    />,
  );
  return { ...utils, onRegen };
}

describe("palierStars — les comptes de l'écran", () => {
  it("ramène le seuil en étoiles sur les exercices joués, borne la récolte, dit ce qui manque", () => {
    expect(palierStars({ starsTotal: 26, exerciseCount: 10, thresholdTenths: 7 })).toEqual({
      exerciseCount: 10,
      maxStars: 30,
      threshold: 21,
      starsTotal: 26,
      missing: 0,
    });
    expect(palierStars({ starsTotal: 14, exerciseCount: 10, thresholdTenths: 7 }).missing).toBe(7);
    // Un palier de trois exercices (le modèle en a rendu moins) : 7 sur 9, pas 21.
    expect(palierStars({ starsTotal: 40, exerciseCount: 3, thresholdTenths: 7 })).toMatchObject({ maxStars: 9, threshold: 7, starsTotal: 9 });
  });
});

describe("PalierResultScreen — la fin d'un palier", () => {
  it("validé : Pio fête, le coffre s'ouvre, les étoiles comptent, le palier suivant s'offre", () => {
    const { container } = renderResult("validated");
    expect(screen.getByText("Palier 2 validé")).toBeTruthy();
    expect(screen.getByText("Le palier 3 vient de s'ouvrir.")).toBeTruthy();
    expect(screen.getByRole("img", { name: "Pio célèbre avec toi" })).toBeTruthy();
    const chest = screen.getByRole("img", { name: "Le coffre au trésor est ouvert" });
    expect(chest.querySelector("[data-lid]")?.getAttribute("data-lid")).toBe("ouvert");
    // La même note que l'étape du sentier : 26 sur 30 vaut deux grandes étoiles.
    expect(container.querySelector("[data-big-stars]")?.getAttribute("data-big-stars")).toBe(String(palierStarRating(26, 10)));
    expect(screen.getByText("/ 30")).toBeTruthy();
    expect(screen.getByText("Validé à partir de 21")).toBeTruthy();
    const next = screen.getByRole("link", { name: /Palier suivant/ });
    expect(next.getAttribute("href")).toBe("/student/topics/session?id=t&palier=3");
    expect(screen.getByRole("link", { name: /Retour au sentier/ })).toBeTruthy();
    // La jauge glisse en transform : jamais de largeur animée.
    const gauge = container.querySelector("[data-gauge]") as HTMLElement;
    expect(gauge.getAttribute("data-gauge")).toBe(String((26 / 30) * 100));
    expect(gauge.style.width).toBe("");
    expect(screen.queryByText("alternatives")).toBeNull();
  });

  it("manqué : le coffre reste cadenassé, la jauge dit ce qui manque, la nouvelle chance se propose", () => {
    const { onRegen } = renderResult("failed");
    expect(screen.getByText("Palier 2 manqué")).toBeTruthy();
    expect(screen.getByText("Il te manque 7 étoiles pour valider.")).toBeTruthy();
    expect(screen.getByRole("img", { name: "Pio t'encourage" })).toBeTruthy();
    const chest = screen.getByRole("img", { name: "Le coffre au trésor est fermé" });
    expect(chest.querySelector("[data-lid]")?.getAttribute("data-lid")).toBe("ferme");
    expect(chest.querySelector("svg.lucide-lock")).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Allez, on réessaie/ }));
    expect(onRegen).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("link", { name: /Palier suivant/ })).toBeNull();
  });

  it("manqué sans nouvelle chance : les trois alternatives prennent la place du bouton", () => {
    renderResult("failed", { result: { status: "failed", starsTotal: 14, exerciseCount: 10, thresholdTenths: 7, canRegen: false } });
    expect(screen.getByText("alternatives")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Allez, on réessaie/ })).toBeNull();
  });

  it("thématique finie : le trésor remplace le palier suivant", () => {
    renderResult("validated", { nextPalierHref: null });
    expect(screen.getByText("« Les nombres jusqu'à 10 » est terminée !")).toBeTruthy();
    expect(screen.getByRole("link", { name: /Voir mon trésor/ })).toBeTruthy();
    expect(screen.queryByRole("link", { name: /Retour au sentier/ })).toBeNull();
  });
});
