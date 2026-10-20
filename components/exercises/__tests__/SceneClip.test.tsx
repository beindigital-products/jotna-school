import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Ce que l'appareil et la séance disent à la scène : le tier, le mouvement réduit, la voix.
const device = vi.hoisted(() => ({ tier: "full" as "full" | "lite", reduced: false, short: false, voice: null as null | { status: string } }));
vi.mock("@/hooks/use-device-tier", () => ({ useDeviceTier: () => device.tier }));
vi.mock("@/components/landing/use-media-query", () => ({ useMediaQuery: () => device.short }));
vi.mock("framer-motion", async (importOriginal) => ({ ...(await importOriginal<typeof import("framer-motion")>()), useReducedMotion: () => device.reduced }));
vi.mock("../prompt-reader", () => ({ usePromptReader: () => device.voice, useTileVoice: () => null }));

import ExercisePrompt from "../ExercisePrompt";
import QcmExercise from "../QcmExercise";
import { SceneClip, payloadScene } from "../SceneClip";

const SETTLE_MS = 700;

let play: ReturnType<typeof vi.spyOn>;
let pause: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.useFakeTimers();
  device.tier = "full";
  device.reduced = false;
  device.short = false;
  device.voice = null;
  // jsdom ne lit aucune vidéo : on regarde ce que la scène demande à l'élément.
  play = vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(() => Promise.resolve());
  pause = vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const settle = () => act(() => void vi.advanceTimersByTime(SETTLE_MS));
const figure = (container: HTMLElement) => container.querySelector("figure") as HTMLElement;
const video = (container: HTMLElement) => container.querySelector("video") as HTMLVideoElement | null;
const poster = (container: HTMLElement) => container.querySelector("img") as HTMLImageElement | null;

describe("le clip d'une scène : sur un appareil capable", () => {
  it("montre l'affiche d'abord, sans vidéo : la carte n'a pas fini de se poser", () => {
    const { container } = render(<SceneClip id="po1" />);
    expect(poster(container)?.getAttribute("src")).toBe("/images/scenes/po1.webp");
    expect(video(container)).toBeNull();
    expect(figure(container).getAttribute("data-scene-state")).toBe("affiche");
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("monte la vidéo une fois la carte posée, muette, sans boucle, et la lance", () => {
    const { container } = render(<SceneClip id="po1" />);
    settle();
    const clip = video(container)!;
    expect(clip).not.toBeNull();
    expect(clip.getAttribute("src")).toBe("/videos/scenes/po1.mp4");
    expect(clip.getAttribute("poster")).toBe("/images/scenes/po1.webp");
    expect(clip.muted).toBe(true);
    expect(clip.hasAttribute("playsinline")).toBe(true);
    expect(clip.hasAttribute("loop"), "pas de boucle : rien ne raccorde la fin au début").toBe(false);
    expect(clip.getAttribute("aria-hidden")).toBe("true");
    expect(play).toHaveBeenCalledTimes(1);
    expect(figure(container).getAttribute("data-scene-state")).toBe("joue");
    // L'affiche reste sous la vidéo : si la couche vidéo s'éteint, l'enfant la voit.
    expect(poster(container)).not.toBeNull();
  });

  it("n'offre aucun bouton tant que le clip joue", () => {
    render(<SceneClip id="po1" />);
    settle();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("attend que la voix ait lu l'énoncé, puis se lance", () => {
    device.voice = { status: "playing" };
    const { container, rerender } = render(<SceneClip id="ec3" />);
    settle();
    expect(video(container)).not.toBeNull();
    expect(play, "la voix parle : pas de lecture").not.toHaveBeenCalled();
    expect(figure(container).getAttribute("data-scene-state")).toBe("attend");
    device.voice = { status: "idle" };
    rerender(<SceneClip id="ec3" />);
    expect(play).toHaveBeenCalledTimes(1);
    expect(figure(container).getAttribute("data-scene-state")).toBe("joue");
  });

  it("attend aussi pendant que la voix charge, et se met en pause si l'enfant la relance", () => {
    device.voice = { status: "loading" };
    const { container, rerender } = render(<SceneClip id="ec3" />);
    settle();
    expect(play).not.toHaveBeenCalled();
    device.voice = { status: "idle" };
    rerender(<SceneClip id="ec3" />);
    expect(play).toHaveBeenCalledTimes(1);
    pause.mockClear();
    device.voice = { status: "playing" };
    rerender(<SceneClip id="ec3" />);
    expect(pause).toHaveBeenCalled();
    expect(video(container), "la vidéo reste montée").not.toBeNull();
  });

  it("joue quand la voix n'a aucun son à dire", () => {
    device.voice = { status: "unavailable" };
    render(<SceneClip id="ro9" />);
    settle();
    expect(play).toHaveBeenCalledTimes(1);
  });

  it("propose de revoir la scène quand le clip est fini, et la rejoue depuis le début", () => {
    const { container } = render(<SceneClip id="po1" />);
    settle();
    const clip = video(container)!;
    clip.currentTime = 4;
    fireEvent.ended(clip);
    expect(figure(container).getAttribute("data-scene-state")).toBe("fini");
    expect(pause).toHaveBeenCalled();
    play.mockClear();
    fireEvent.click(screen.getByRole("button", { name: "Revoir la scène" }));
    expect(clip.currentTime).toBe(0);
    // Le toucher lance la lecture dans le geste, et l'effet la relance à l'état suivant : sans effet sur une vidéo qui joue.
    expect(play).toHaveBeenCalled();
    expect(figure(container).getAttribute("data-scene-state")).toBe("joue");
    expect(screen.queryByRole("button")).toBeNull();
  });
});

describe("le clip d'une scène : quand le navigateur refuse la lecture automatique", () => {
  it("offre le bouton, et le toucher lance la vidéo dans le geste", async () => {
    play.mockImplementation(() => Promise.reject(new Error("NotAllowedError")));
    const { container } = render(<SceneClip id="ro1" />);
    settle();
    await act(async () => {
      await Promise.resolve();
    });
    expect(video(container), "la vidéo est montée, à l'arrêt").not.toBeNull();
    const button = screen.getByRole("button", { name: "Voir la scène" });

    play.mockClear();
    play.mockImplementation(() => Promise.resolve());
    fireEvent.click(button);
    expect(play, "le toucher lance la lecture lui-même").toHaveBeenCalled();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("ne lance rien sous la voix : la vidéo reprend à son silence", () => {
    device.tier = "lite";
    device.voice = { status: "playing" };
    render(<SceneClip id="ro1" />);
    settle();
    fireEvent.click(screen.getByRole("button", { name: "Voir la scène" }));
    expect(play).not.toHaveBeenCalled();
  });
});

describe("le clip d'une scène : sur un appareil sobre", () => {
  const sober = [
    ["un appareil modeste (tier « lite »)", () => (device.tier = "lite")],
    ["un enfant qui a demandé moins de mouvement", () => (device.reduced = true)],
  ] as const;

  for (const [name, configure] of sober) {
    it(`${name} : l'affiche seule, rien n'est téléchargé, un bouton lance la scène`, () => {
      configure();
      const { container } = render(<SceneClip id="ro1" />);
      settle();
      expect(video(container), "pas de vidéo sans toucher").toBeNull();
      expect(play).not.toHaveBeenCalled();
      expect(poster(container)?.getAttribute("src")).toBe("/images/scenes/ro1.webp");

      fireEvent.click(screen.getByRole("button", { name: "Voir la scène" }));
      expect(video(container)?.getAttribute("src")).toBe("/videos/scenes/ro1.mp4");
      expect(play).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole("button")).toBeNull();
    });
  }
});

describe("le clip d'une scène : quand un fichier manque", () => {
  it("laisse l'affiche si la vidéo ne se lit pas, sans bouton qui ne ferait rien", () => {
    const { container } = render(<SceneClip id="po1" />);
    settle();
    fireEvent.error(video(container)!);
    expect(video(container)).toBeNull();
    expect(poster(container)).not.toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("cache tout le présentoir si l'affiche manque, au lieu d'une icône cassée", () => {
    const { container } = render(<SceneClip id="po1" />);
    fireEvent.error(poster(container)!);
    expect(container.querySelector("figure")).toBeNull();
  });
});

describe("le clip d'une scène : le cadre", () => {
  it("a une hauteur bornée qui suit l'écran : il ne repousse pas les tuiles hors d'un petit écran", () => {
    const { container } = render(<SceneClip id="po1" />);
    const frame = poster(container)!.parentElement!;
    expect(frame.className).toContain("aspect-[3/2]");
    // Des paliers qui s'excluent, du plus haut au plus bas : tablette, 10 rem, 9 rem, 6,5 rem, téléphone couché.
    for (const rule of [
      "h-40",
      "[@media(min-width:640px)_and_(min-height:961px)]:h-56",
      "[@media(max-height:960px)_and_(min-height:668px)]:h-36",
      "[@media(max-height:667px)_and_(min-height:601px)]:h-[6.5rem]",
      "[@media(max-height:480px)]:h-20",
    ]) {
      expect(frame.className, rule).toContain(rule);
    }
  });

  it("n'a pas de clip sur un écran de 481 à 600 px de haut : la première tuile passerait sous le dock", () => {
    device.short = true;
    const { container } = render(<SceneClip id="po1" />);
    settle();
    expect(container.querySelector("figure")).toBeNull();
    expect(container.querySelector("video")).toBeNull();
    expect(play).not.toHaveBeenCalled();
  });

  it("est décoratif pour un lecteur d'écran : l'énoncé dit la même chose", () => {
    const { container } = render(<SceneClip id="po1" />);
    settle();
    expect(poster(container)!.getAttribute("alt")).toBe("");
    expect(poster(container)!.getAttribute("aria-hidden")).toBe("true");
    expect(video(container)!.getAttribute("tabindex")).toBe("-1");
  });
});

describe("la scène dans un énoncé", () => {
  const byPrompt = (text: string) =>
    screen.getByText((_, element) => element?.tagName === "P" && (element.textContent ?? "").replace(/\s+/g, " ").trim() === text);

  it("lit la scène d'un payload, ou rien", () => {
    expect(payloadScene({ options: ["a", "b"], scene: "ro9" })).toBe("ro9");
    expect(payloadScene({ scene: "licorne" })).toBeUndefined();
    expect(payloadScene({})).toBeUndefined();
    expect(payloadScene(null)).toBeUndefined();
  });

  it("passe AU-DESSUS de la consigne", () => {
    const { container } = render(<ExercisePrompt prompt="Ta grand-mère te parle. Que fais-tu ?" scene="po1" />);
    const prompt = byPrompt("Ta grand-mère te parle. Que fais-tu ?");
    expect(container.querySelector('figure[data-scene-clip="po1"]')).not.toBeNull();
    expect(figure(container).compareDocumentPosition(prompt) & Node.DOCUMENT_POSITION_FOLLOWING, "le clip précède la consigne").toBeTruthy();
  });

  it("se range à côté du clip dans un téléphone couché, au-dessus partout ailleurs", () => {
    const { container } = render(<ExercisePrompt prompt="Que fais-tu ?" scene="po1" />);
    const wrapper = figure(container).parentElement!;
    expect(wrapper.className).toContain("[@media(max-height:480px)]:flex");
    expect(wrapper.className).toContain("[@media(max-height:480px)]:space-y-0");
    expect(wrapper.className).toContain("space-y-4");
    expect(figure(container).className).toContain("[@media(max-height:480px)]:shrink-0");
  });

  it("ne montre rien pour une scène hors catalogue, et ne change rien au DOM sans scène", () => {
    const unknown = render(<ExercisePrompt prompt="Que fais-tu ?" scene="licorne" />);
    expect(unknown.container.querySelector("figure")).toBeNull();
    unknown.unmount();
    const without = render(<ExercisePrompt prompt="Que fais-tu ?" />);
    expect(without.container.querySelector("figure")).toBeNull();
    expect(without.container.querySelector("img")).toBeNull();
  });

  it("garde l'image d'énoncé quand l'exercice en a une aussi", () => {
    const { container } = render(<ExercisePrompt prompt="Que fais-tu ?" scene="po1" image="inconnue" />);
    expect(container.querySelectorAll("figure")).toHaveLength(1);
  });

  it("s'affiche dans le QCM de la situation, avant les tuiles", () => {
    const payload = { options: ["👂 J'écoute ma grand-mère calmement", "😛 Je tire la langue à ma grand-mère", "🙉 Je n'écoute pas ma grand-mère"], correctIndex: 0, scene: "po1" };
    const { container } = render(<QcmExercise prompt="Ta grand-mère te parle. Que fais-tu ?" payload={payload} onSubmit={vi.fn()} disabled={false} isCorrect={null} />);
    const clip = container.querySelector('figure[data-scene-clip="po1"]')!;
    expect(clip).not.toBeNull();
    const firstTile = screen.getAllByRole("button", { name: /^[A-C]/ })[0];
    expect(clip.compareDocumentPosition(firstTile) & Node.DOCUMENT_POSITION_FOLLOWING, "le clip précède les tuiles").toBeTruthy();
  });

  it("n'ajoute rien à un QCM sans scène", () => {
    const { container } = render(<QcmExercise prompt="Combien de mangues ?" payload={{ options: ["4", "6", "5", "1"], correctIndex: 2 }} onSubmit={vi.fn()} disabled={false} isCorrect={null} />);
    expect(container.querySelector("figure")).toBeNull();
  });
});
