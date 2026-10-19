import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MotionGlobalConfig } from "framer-motion";
import {
  CADRE,
  COFFRE_CLIP,
  COFFRE_FERME,
  COFFRE_OUVERT,
  Coffre,
  coffreGeometry,
  ECLAT_MS,
  LUEUR_MS,
  OUVERTURE_MS,
  preloadCoffre,
} from "../coffre";
import { GameFeelProvider } from "../use-game-feel";

MotionGlobalConfig.skipAnimations = true;

// `prefers-reduced-motion` : framer-motion le lit, le test le pilote.
const motionPref = vi.hoisted(() => ({ reduced: false }));
vi.mock("framer-motion", async (importOriginal) => {
  const actual = await importOriginal<typeof import("framer-motion")>();
  return { ...actual, useReducedMotion: () => motionPref.reduced };
});
vi.mock("@/hooks/use-device-tier", () => ({ useDeviceTier: () => "full" }));
vi.mock("@/lib/sounds", () => ({ getSoundEnabledLocal: () => false, play: vi.fn() }));
vi.mock("canvas-confetti", () => ({ default: vi.fn() }));

const DELAY = 600;

beforeEach(() => {
  motionPref.reduced = false;
  vi.useFakeTimers();
  // jsdom n'implémente pas la lecture : elle réussit, et c'est le test qui joue les événements.
  vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(() => Promise.resolve());
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

/** Les deux images fixes, dans l'ordre du rendu : le fermé puis l'ouvert. */
function stills(chest: HTMLElement) {
  const [closed, open] = Array.from(chest.querySelectorAll("img"));
  return { closed, open };
}

function chestOf() {
  return screen.getByRole("img", { name: /coffre au trésor/ });
}

function rich(ui: React.ReactElement) {
  return render(<GameFeelProvider level="riche">{ui}</GameFeelProvider>);
}

describe("coffreGeometry — le cadre du clip", () => {
  it("rend le cadre tel quel pour une caisse de la largeur du cadre", () => {
    const g = coffreGeometry(CADRE.caisse);
    expect(g).toEqual({ width: CADRE.width, height: CADRE.height, pied: CADRE.pied });
  });

  it("garde les proportions quand la caisse rétrécit, et déborde de la caisse", () => {
    const g = coffreGeometry(132);
    expect(g.width).toBe(178);
    expect(g.height).toBe(174);
    expect(g.pied).toBe(10);
    // Le couvercle ouvert déborde : l'élément est plus large que la caisse.
    expect(g.width).toBeGreaterThan(132);
  });
});

describe("Coffre — palier manqué : le coffre reste fermé", () => {
  it("montre le coffre fermé, sans vidéo, sans éclat", () => {
    rich(<Coffre open={false} />);
    const chest = chestOf();
    expect(chest.getAttribute("aria-label")).toBe("Le coffre au trésor est fermé");
    expect(chest.getAttribute("data-open")).toBe("false");
    expect(chest.getAttribute("data-phase")).toBe("ferme");
    expect(chest.querySelector("video")).toBeNull();
    const { closed, open } = stills(chest);
    expect(closed.getAttribute("src")).toBe(COFFRE_FERME);
    expect(closed.style.opacity).toBe("1");
    expect(open.style.opacity).toBe("0");
    // Le temps passe : rien ne s'ouvre, rien ne jaillit.
    act(() => void vi.advanceTimersByTime(10_000));
    expect(chest.getAttribute("data-phase")).toBe("ferme");
    expect(chest.querySelector(".gk-reward span.rounded-full")).toBeNull();
  });

  it("ramène le bas de la caisse au bas de l'élément, pour se poser à côté de Pio", () => {
    rich(<Coffre open={false} size={132} />);
    const chest = chestOf();
    expect(chest.style.marginBottom).toBe("-10px");
    expect(chest.style.width).toBe("178px");
    expect(chest.className).toContain("overflow-visible");
  });
});

describe("Coffre — palier validé : un clip, puis l'image du coffre ouvert", () => {
  it("lance le clip une fois, sans boucle, avec les deux formats et l'affiche du coffre fermé", () => {
    rich(<Coffre open />);
    const chest = chestOf();
    expect(chest.getAttribute("aria-label")).toBe("Le coffre au trésor est ouvert");
    expect(chest.getAttribute("data-phase")).toBe("ouverture");

    const video = chest.querySelector("video") as HTMLVideoElement;
    expect(video).not.toBeNull();
    expect(video.hasAttribute("loop")).toBe(false);
    expect(video.getAttribute("poster")).toBe(COFFRE_FERME);
    expect(video.muted).toBe(true);
    expect(video.getAttribute("playsinline")).not.toBeNull();
    const sources = Array.from(video.querySelectorAll("source")).map((s) => [s.getAttribute("src"), s.getAttribute("type")]);
    expect(sources).toEqual([
      [COFFRE_CLIP.mov, 'video/quicktime; codecs="hvc1"'],
      [COFFRE_CLIP.webm, 'video/webm; codecs="vp9"'],
    ]);

    // Pendant le clip, aucune image fixe : le coffre fermé dessous ferait un couvercle fantôme.
    const { closed, open } = stills(chest);
    expect(closed.style.opacity).toBe("0");
    expect(open.style.opacity).toBe("0");

    // Le clip ne part qu'après le retard demandé.
    const play = HTMLMediaElement.prototype.play as unknown as ReturnType<typeof vi.fn>;
    expect(play).not.toHaveBeenCalled();
    act(() => void vi.advanceTimersByTime(DELAY));
    expect(play).toHaveBeenCalledTimes(1);
  });

  it("à la fin du clip, la vidéo est retirée et l'image du coffre ouvert reste seule", () => {
    rich(<Coffre open />);
    const chest = chestOf();
    act(() => void vi.advanceTimersByTime(DELAY));
    fireEvent.playing(chest.querySelector("video") as HTMLVideoElement);
    fireEvent.ended(chest.querySelector("video") as HTMLVideoElement);

    expect(chest.getAttribute("data-phase")).toBe("ouvert");
    expect(chest.querySelector("video")).toBeNull();
    const { closed, open } = stills(chest);
    expect(open.getAttribute("src")).toBe(COFFRE_OUVERT);
    expect(open.style.opacity).toBe("1");
    expect(closed.style.opacity).toBe("0");
  });

  it("l'éclat part quand le couvercle est levé, pas avant ; la lueur monte avant lui", () => {
    rich(<Coffre open />);
    const chest = chestOf();
    act(() => void vi.advanceTimersByTime(DELAY));
    fireEvent.playing(chest.querySelector("video") as HTMLVideoElement);

    act(() => void vi.advanceTimersByTime(ECLAT_MS - 1));
    expect(chest.querySelector(".gk-reward span.rounded-full")).toBeNull();
    act(() => void vi.advanceTimersByTime(1));
    expect(chest.querySelector(".gk-reward span.rounded-full")).not.toBeNull();
    // La lueur précède l'éclat (elle monte avec le couvercle).
    expect(LUEUR_MS).toBeLessThan(ECLAT_MS);
  });

  it("burst=false : le couvercle se lève, rien ne jaillit", () => {
    rich(<Coffre open burst={false} />);
    const chest = chestOf();
    act(() => void vi.advanceTimersByTime(DELAY));
    fireEvent.playing(chest.querySelector("video") as HTMLVideoElement);
    act(() => void vi.advanceTimersByTime(ECLAT_MS + 500));
    expect(chest.querySelector(".gk-reward span.rounded-full")).toBeNull();
  });

  it("les scintillements brillent sur le tas d'or une fois la lueur montée, au niveau riche", () => {
    rich(<Coffre open />);
    const chest = chestOf();
    act(() => void vi.advanceTimersByTime(DELAY));
    fireEvent.playing(chest.querySelector("video") as HTMLVideoElement);
    expect(chest.querySelectorAll("svg[data-scintillement]").length).toBe(0);
    act(() => void vi.advanceTimersByTime(LUEUR_MS));
    expect(chest.querySelectorAll("svg[data-scintillement]").length).toBe(5);
  });
});

describe("Coffre — les filets : il finit toujours ouvert", () => {
  it("lecture refusée (lecture automatique, économie d'énergie) : il s'ouvre sur l'image fixe", async () => {
    vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(() => Promise.reject(new Error("NotAllowedError")));
    rich(<Coffre open />);
    const chest = chestOf();
    await act(async () => {
      vi.advanceTimersByTime(DELAY);
      await Promise.resolve();
    });
    expect(chest.getAttribute("data-phase")).toBe("ouvert");
    expect(chest.querySelector("video")).toBeNull();
  });

  it("première image qui ne vient pas : on se passe du clip après le délai de démarrage", () => {
    rich(<Coffre open />);
    const chest = chestOf();
    act(() => void vi.advanceTimersByTime(DELAY + 1400));
    expect(chest.getAttribute("data-phase")).toBe("ouverture");
    act(() => void vi.advanceTimersByTime(200));
    expect(chest.getAttribute("data-phase")).toBe("ouvert");
    expect(chest.querySelector("video")).toBeNull();
  });

  it("aucune source lisible : il s'ouvre aussitôt sur l'image fixe", () => {
    rich(<Coffre open />);
    const chest = chestOf();
    const last = chest.querySelectorAll("source")[1];
    fireEvent.error(last);
    expect(chest.getAttribute("data-phase")).toBe("ouvert");
  });

  it("à l'heure nominale de la fin du clip, l'image ouverte prend le relais sans attendre `ended` (un son éteint la couche vidéo sur iOS)", () => {
    rich(<Coffre open />);
    const chest = chestOf();
    act(() => void vi.advanceTimersByTime(DELAY));
    const video = chest.querySelector("video") as HTMLVideoElement;
    fireEvent.playing(video);
    // `playing` revient après chaque mise en mémoire tampon : le minuteur ne repart pas.
    act(() => void vi.advanceTimersByTime(1000));
    fireEvent.playing(video);
    act(() => void vi.advanceTimersByTime(OUVERTURE_MS - 1000 + 79));
    expect(chest.getAttribute("data-phase")).toBe("ouverture");
    act(() => void vi.advanceTimersByTime(1));
    expect(chest.getAttribute("data-phase")).toBe("ouvert");
    expect(chest.querySelector("video")).toBeNull();
    expect(stills(chest).open.style.opacity).toBe("1");
  });
});

describe("preloadCoffre — l'arrivée du coffre se prépare pendant les dernières questions", () => {
  it("demande les deux images et le clip du format lisible, une seule fois par page", () => {
    // Le paramètre est typé : sans lui, `mock.calls` est un tuple vide et `calls[0]?.[0]` ne compile pas.
    const fetchMock = vi.fn((_url: string) => Promise.resolve({} as Response));
    vi.stubGlobal("fetch", fetchMock);
    const first = preloadCoffre();
    // jsdom ne lit ni HEVC ni VP9 : le premier format est celui du `canPlayType` vide, le VP9.
    expect(first).toEqual([COFFRE_FERME, COFFRE_OUVERT, COFFRE_CLIP.webm]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(COFFRE_CLIP.webm);
    // Une seconde demande ne refait rien.
    expect(preloadCoffre()).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
  });
});

describe("Coffre — appareils sobres et mouvement réduit", () => {
  it("niveau sobre : pas de vidéo, un fondu du fermé à l'ouvert, pas de scintillements", () => {
    render(
      <GameFeelProvider level="sobre">
        <Coffre open />
      </GameFeelProvider>,
    );
    const chest = chestOf();
    expect(chest.querySelector("video")).toBeNull();
    expect(stills(chest).closed.style.opacity).toBe("1");
    act(() => void vi.advanceTimersByTime(200));
    expect(chest.getAttribute("data-phase")).toBe("ouvert");
    expect(stills(chest).open.style.opacity).toBe("1");
    expect(stills(chest).closed.style.opacity).toBe("0");
    act(() => void vi.advanceTimersByTime(3000));
    expect(chest.querySelectorAll("svg[data-scintillement]").length).toBe(0);
  });

  it("mouvement réduit : le coffre est ouvert d'emblée, sans clip, sans éclat", () => {
    motionPref.reduced = true;
    rich(<Coffre open />);
    const chest = chestOf();
    expect(chest.getAttribute("data-phase")).toBe("ouvert");
    expect(chest.querySelector("video")).toBeNull();
    expect(stills(chest).open.style.opacity).toBe("1");
    act(() => void vi.advanceTimersByTime(3000));
    expect(chest.querySelector(".gk-reward span.rounded-full")).toBeNull();
    expect(chest.querySelectorAll("svg[data-scintillement]").length).toBe(0);
  });
});
