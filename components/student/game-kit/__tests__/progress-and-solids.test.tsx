import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProgressTrack, stoneState, trailProgress } from "../progress-track";
import { cylinderPanels, panelLight, Solid3D } from "../solid-3d";
import { GameFeelProvider } from "../use-game-feel";

describe("ProgressTrack — la logique du sentier", () => {
  it("chaque pierre sait où elle en est", () => {
    expect(stoneState(0, 2)).toBe("passee");
    expect(stoneState(2, 2)).toBe("courante");
    expect(stoneState(3, 2)).toBe("a-venir");
  });

  it("le chemin foulé va de 0 à 1, et reste à 1 quand tout est fini", () => {
    expect(trailProgress(10, 0)).toBe(0);
    expect(trailProgress(10, 9)).toBe(1);
    expect(trailProgress(10, 10)).toBe(1);
    expect(trailProgress(1, 0)).toBe(1);
    expect(trailProgress(10, 3)).toBeCloseTo(3 / 9);
  });

  it("annonce la question, les essais et les étoiles en texte", () => {
    render(<ProgressTrack total={10} current={2} attemptsLeft={4} stars={7} />);
    const group = screen.getByRole("group", { name: "Progression de la séance" });
    expect(group.textContent).toContain("Question 3 sur 10.");
    expect(group.textContent).toContain("Encore 4 essais.");
    expect(group.textContent).toContain("7 étoiles gagnées.");
    expect(group.querySelectorAll("[data-stone]").length).toBe(10);
    expect(group.querySelectorAll("[data-stone='passee']").length).toBe(2);
    expect(group.querySelectorAll("[data-alive='true']").length).toBe(4);
    expect(group.querySelectorAll("[data-alive='false']").length).toBe(1);
  });

  it("au singulier aussi", () => {
    render(<ProgressTrack total={3} current={3} attemptsLeft={1} stars={1} />);
    const group = screen.getByRole("group", { name: "Progression de la séance" });
    expect(group.textContent).toContain("Séance terminée, 3 questions.");
    expect(group.textContent).toContain("Encore 1 essai.");
    expect(group.textContent).toContain("1 étoile gagnée.");
  });
});

describe("Solid3D — des faces, pas du WebGL", () => {
  it("un cube a six faces, un pavé aussi", () => {
    const { container, rerender } = render(<Solid3D kind="cube" spin={false} />);
    expect(container.querySelectorAll(".gk-3d > span").length).toBe(6);
    rerender(<Solid3D kind="pave" spin={false} />);
    expect(container.querySelectorAll(".gk-3d > span").length).toBe(6);
  });

  it("le cylindre a moins de panneaux au niveau sobre", () => {
    expect(cylinderPanels("riche")).toBeGreaterThan(cylinderPanels("sobre"));
    const { container } = render(
      <GameFeelProvider level="sobre">
        <Solid3D kind="cylindre" />
      </GameFeelProvider>,
    );
    // Les panneaux et les deux disques.
    expect(container.querySelectorAll(".gk-3d > span").length).toBe(cylinderPanels("sobre") + 2);
  });

  it("la lumière du cylindre est la plus forte face à la lampe et jamais nulle", () => {
    expect(panelLight(-40)).toBeCloseTo(1.17, 2);
    expect(panelLight(140)).toBeCloseTo(0.72, 2);
    expect(panelLight(20)).toBeGreaterThan(panelLight(140));
    expect(panelLight(50)).toBeGreaterThanOrEqual(0.72);
  });

  it("annonce ce qu'il est, et tourne seulement si le niveau le permet", () => {
    const { container, rerender } = render(
      <GameFeelProvider level="riche">
        <Solid3D kind="boule" />
      </GameFeelProvider>,
    );
    expect(screen.getByRole("img", { name: "une boule" })).toBeTruthy();
    expect(container.innerHTML).toContain("gk-roll");
    rerender(
      <GameFeelProvider level="sobre">
        <Solid3D kind="boule" />
      </GameFeelProvider>,
    );
    expect(container.innerHTML).not.toContain("gk-roll");
  });
});

describe("ProgressTrack — la série et le gain d'étoiles", () => {
  it("la flamme ne s'allume qu'à partir de deux réussites d'affilée, et le dit au lecteur d'écran", () => {
    const { container, rerender } = render(<ProgressTrack total={10} current={2} attemptsLeft={5} stars={3} combo={1} />);
    expect(container.querySelector("[data-combo]")).toBeNull();
    rerender(<ProgressTrack total={10} current={3} attemptsLeft={5} stars={6} combo={3} />);
    const flame = container.querySelector("[data-combo]");
    expect(flame?.textContent).toBe("×3");
    expect(screen.getByRole("group", { name: "Progression de la séance" }).textContent).toContain("3 bonnes réponses d'affilée.");
  });

  it("un gain fait gonfler le compteur et détache un « +3 » ; sans gain, rien", () => {
    const { container, rerender } = render(<ProgressTrack total={10} current={2} stars={3} gain={{ amount: 0, key: 0 }} />);
    expect(container.querySelector("[data-star-gain]")).toBeNull();
    expect(container.querySelector("[data-stars]")?.className).not.toContain("gk-pop");
    rerender(<ProgressTrack total={10} current={2} stars={6} gain={{ amount: 3, key: 1 }} />);
    expect(container.querySelector("[data-star-gain]")?.textContent).toBe("+3");
    expect(container.querySelector("[data-stars]")?.className).toContain("gk-pop");
  });

  it("sur le bois, les pierres à venir et les cœurs vidés passent en clair", () => {
    const { container } = render(<ProgressTrack total={3} current={0} attemptsLeft={4} attemptsMax={5} surface="wood" />);
    expect(container.querySelector("[data-surface='wood']")).not.toBeNull();
    expect(container.querySelector("[data-stone='a-venir']")?.className).toContain("#5b3516");
    expect(container.querySelector("[data-alive='false']")?.getAttribute("class")).toContain("text-white/55");
  });
});
