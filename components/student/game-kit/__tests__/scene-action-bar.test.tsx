import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ActionButton3D } from "../action-button-3d";
import { ListenButton, SceneActionBar, type SceneListen } from "../scene-action-bar";

vi.mock("@/hooks/use-device-tier", () => ({ useDeviceTier: () => "full" }));
vi.mock("@/lib/sounds", () => ({ getSoundEnabledLocal: () => false, play: vi.fn() }));

afterEach(cleanup);

// Le seuil d'une ligne : 960 px de haut ou moins (tous les téléphones debout, une tablette couchée ; voir le composant).
const SHORT = "[@media(max-height:960px)]";
// Sous 340 px de large, le mot ne tient plus à côté de Valider : le carré.
const SHORT_NARROW = "[@media(max-height:960px)_and_(max-width:339px)]";
const NARROW = "[@media(max-width:339px)]";

function listen(status: SceneListen["status"] = "idle", onPress = vi.fn()): SceneListen {
  return { status, onPress };
}

describe("SceneActionBar — Écouter juste au-dessus de Valider", () => {
  it("ne rend rien sans voix ni bouton principal", () => {
    const { container } = render(<SceneActionBar />);
    expect(container.innerHTML).toBe("");
  });

  it("pose Écouter AVANT Valider, et les met sur une ligne sur un téléphone (960 px de haut ou moins)", () => {
    const { container } = render(
      <SceneActionBar listen={listen()}>
        <ActionButton3D onClick={() => {}}>Valider</ActionButton3D>
      </SceneActionBar>,
    );
    const buttons = screen.getAllByRole("button");
    expect(buttons.map((b) => b.getAttribute("aria-label") ?? b.textContent)).toEqual(["Écouter l'énoncé", "Valider"]);
    const bar = container.querySelector("[data-scene-actions]");
    expect(bar?.className).toContain(`${SHORT}:flex-row`);
    // Sur une ligne, Écouter garde SON MOT sur 42 % de la largeur ; Valider prend le reste.
    // Le carré de 64 px sans le mot, seulement sous 340 px de large.
    const ecouter = screen.getByRole("button", { name: "Écouter l'énoncé" });
    expect(ecouter.className).toContain(`${SHORT}:w-[42%]`);
    expect(ecouter.className).not.toContain(`${SHORT}:w-16`);
    expect(ecouter.className).toContain(`${SHORT_NARROW}:w-16`);
    expect(screen.getByText("Écouter").className).not.toContain(`${SHORT}:hidden`);
    expect(screen.getByText("Écouter").className).toContain(`${SHORT_NARROW}:hidden`);
    expect(screen.getByRole("button", { name: "Valider" }).parentElement?.className).toContain("flex-1");
  });

  it("`row` : une ligne à toute hauteur, Écouter avec son mot puis Valider (sous un pavé de touches)", () => {
    const { container } = render(
      <SceneActionBar listen={listen()} row>
        <ActionButton3D onClick={() => {}}>Valider</ActionButton3D>
      </SceneActionBar>,
    );
    const bar = container.querySelector("[data-scene-actions]")!;
    expect(bar.getAttribute("data-row")).toBe("1");
    expect(bar.className).toContain("flex-row");
    expect(bar.className).not.toContain(`${SHORT}:flex-row`);
    const ecouter = screen.getByRole("button", { name: "Écouter l'énoncé" });
    expect(ecouter.className).toContain("w-[42%]");
    expect(ecouter.className).toContain(`${NARROW}:w-16`);
    // Le mot se cache sous 340 px de large, et quand le bouton lui-même est trop
    // étroit pour lui (texte agrandi : requête de conteneur sur le bouton).
    expect(ecouter.className).toContain("@container");
    const word = screen.getByText("Écouter").className;
    expect(word).toContain(`${NARROW}:hidden`);
    expect(word).toContain("@max-[8.5rem]:hidden");
    expect(word).not.toContain(SHORT);
    // Sans Valider, `row` ne change rien : Écouter garde sa colonne et son mot.
    cleanup();
    const alone = render(<SceneActionBar listen={listen()} row />);
    expect(alone.container.querySelector("[data-scene-actions]")?.getAttribute("data-row")).toBeNull();
    expect(screen.getByText("Écouter").className).not.toContain("hidden");
  });

  it("sans Valider, Écouter se pose seul, pleine largeur, avec son mot", () => {
    const { container } = render(<SceneActionBar listen={listen()} />);
    expect(container.querySelector("[data-scene-actions]")?.className).not.toContain(`${SHORT}:flex-row`);
    const ecouter = screen.getByRole("button", { name: "Écouter l'énoncé" });
    expect(ecouter.className).not.toContain(`${SHORT}:w-[42%]`);
    expect(screen.getByText("Écouter").className).not.toContain("hidden");
  });

  it("sans voix, ne rend que le bouton principal (les plus grands, les aperçus)", () => {
    render(
      <SceneActionBar listen={null}>
        <ActionButton3D onClick={() => {}}>Valider</ActionButton3D>
      </SceneActionBar>,
    );
    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(screen.queryByRole("button", { name: "Écouter l'énoncé" })).toBeNull();
  });
});

describe("ListenButton — le gros bouton bleu", () => {
  it("l'icône d'abord, le mot ensuite ; un toucher appelle la voix", () => {
    const onPress = vi.fn();
    render(<ListenButton listen={listen("idle", onPress)} />);
    const button = screen.getByRole("button", { name: "Écouter l'énoncé" });
    expect(button.getAttribute("aria-pressed")).toBe("false");
    expect(button.getAttribute("data-listen-status")).toBe("idle");
    // Le haut-parleur précède le mot dans le DOM : le CI lit l'icône, pas le mot.
    const word = screen.getByText("Écouter");
    const icon = button.querySelector("svg");
    expect(icon).not.toBeNull();
    expect(icon!.compareDocumentPosition(word) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    fireEvent.click(button);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("pendant la lecture : barres qui battent (transform seulement), enfoncé, et sert d'arrêt", () => {
    const onPress = vi.fn();
    const { container } = render(<ListenButton listen={listen("playing", onPress)} />);
    const button = screen.getByRole("button", { name: "Écouter l'énoncé" });
    expect(button.getAttribute("aria-pressed")).toBe("true");
    const bars = container.querySelector("[data-voice-bars]");
    expect(bars?.children).toHaveLength(4);
    expect(bars?.firstElementChild?.className).toContain("origin-bottom");
    expect(bars?.firstElementChild?.className).toContain("gk-voice");
    expect(container.innerHTML).not.toMatch(/animate-\[(?!gk-voice)/);
    fireEvent.click(button);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("sans voix : crème, haut-parleur barré, un nom qui le dit, jamais gris", () => {
    const { container } = render(<ListenButton listen={listen("unavailable")} />);
    // Un lecteur d'écran n'entend pas le même bouton qu'avec une voix ; sans le
    // mot « réessayer » (un test de bout en bout clique le premier `/Réessayer/`).
    const button = screen.getByRole("button", { name: "Écouter l'énoncé : le son manque, touche pour relancer" });
    expect(button.getAttribute("aria-label")).not.toMatch(/réessayer/i);
    expect(button.getAttribute("data-listen-status")).toBe("unavailable");
    expect(container.querySelector("svg.lucide-volume-x")).not.toBeNull();
    expect(container.innerHTML).not.toMatch(/gray-\d|slate-\d/);
    // La face du bouton d'action « écouter » : ciel au repos, crème (`#fff1cc`) sans voix.
    expect(container.innerHTML).toContain("rgb(255, 241, 204)");
    cleanup();
    const sky = render(<ListenButton listen={listen("idle")} />);
    expect(sky.container.innerHTML).toContain("rgb(2, 132, 199)");
  });

  it("au chargement, la face respire par son opacité", () => {
    const { container } = render(<ListenButton listen={listen("loading")} />);
    expect(container.querySelector(".animate-pulse")).not.toBeNull();
  });
});
