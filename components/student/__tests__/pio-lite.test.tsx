import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MotionGlobalConfig } from "framer-motion";

import { isPioState, isPioStill, Pio, pioClipSources, pioPosterSrc, preloadPioPosters, type PioState } from "../pio";
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
  vi.unstubAllGlobals();
  device.tier = "full";
});

describe("preloadPioPosters — les affiches demandées en avance", () => {
  it("demande une `Image` par pose, une seule fois par URL, avec l'affiche de la tenue", () => {
    const requested: string[] = [];
    vi.stubGlobal(
      "Image",
      class {
        set src(value: string) {
          requested.push(value);
        }
      },
    );
    expect(preloadPioPosters(["cheer", "encourage", "sad"], { lite: true })).toEqual([
      "/images/pio/lite/cheer.webp",
      "/images/pio/lite/encourage.webp",
      "/images/pio/lite/sad.webp",
    ]);
    expect(requested).toHaveLength(3);
    // Déjà demandées : rien ne repart, même d'un autre écran.
    expect(preloadPioPosters(["cheer", "sad"], { lite: true })).toEqual([]);
    expect(requested).toHaveLength(3);
    // Une autre affiche (le PNG d'origine, la marche qui part de la pose calme) : une requête de plus.
    expect(preloadPioPosters(["walk"])).toEqual(["/images/pio/idle.png"]);
    expect(requested).toHaveLength(4);
  });
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

  it("pose l'affiche légère sur le clip, le temps de son chargement, et RIEN sous un clip qui bouge", () => {
    render(<Pio state="hello" lite />);
    const video = document.querySelector("video");
    expect(video?.getAttribute("poster")).toBe("/images/pio/lite/hello.webp");
    // « hello » fait coucou : une affiche peinte sous lui ferait un Pio en double.
    expect(document.querySelector("img")).toBeNull();
    // Les clips, eux, ne changent pas.
    expect([...document.querySelectorAll("source")].map((source) => source.getAttribute("src"))).toEqual([
      "/videos/pio/hello.mov",
      "/videos/pio/hello.webm",
    ]);
  });

  it("garde l'affiche SOUS le clip d'une pose quasi immobile (« ask »), décodée sur place", () => {
    render(<Pio state="ask" lite />);
    const video = document.querySelector("video")!;
    expect(video.getAttribute("poster")).toBe("/images/pio/lite/ask.webp");
    // Sur iOS, la couche vidéo du clip HEVC s'éteint d'elle-même dès qu'un son
    // part : l'affiche, montée sous la vidéo, prend le relais dans la même image.
    const image = document.querySelector("img")!;
    expect(image.getAttribute("src")).toBe("/images/pio/lite/ask.webp");
    expect(image.getAttribute("decoding")).toBe("sync");
    expect(image.compareDocumentPosition(video) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("a une affiche légère pour chaque pose de la tenue de tous les jours", () => {
    const poses: PioState[] = ["idle", "hello", "cheer", "sad", "amazed", "encourage", "think", "sleep", "ask", "walk"];
    for (const pose of poses) expect(pioPosterSrc(pose, "classic", true), pose).toMatch(/^\/images\/pio\/lite\/\w+\.webp$/);
  });
});

describe("les poses quasi immobiles (`still`) : l'affiche sous le clip, pour elles seules", () => {
  it("« ask » l'est ; les poses qui bougent (cheer, hello, walk) ne le sont pas", () => {
    expect(isPioStill("ask")).toBe(true);
    for (const pose of ["cheer", "hello", "walk", "idle", "encourage", "sad"] as const) expect(isPioStill(pose), pose).toBe(false);
  });

  it("se décide sur la pose réellement jouée : « ask » en boubou est « idle », qui bouge", () => {
    expect(isPioStill("ask", "boubou")).toBe(false);
  });

  it("une pose qui bouge n'a pas d'affiche sous son clip, même en pleine taille", () => {
    render(<Pio state="cheer" size={190} />);
    expect(document.querySelector("video")).not.toBeNull();
    expect(document.querySelector("img")).toBeNull();
  });

  it("sans clip (animated={false}), l'affiche est là quelle que soit la pose", () => {
    render(<Pio state="cheer" animated={false} />);
    expect(document.querySelector("video")).toBeNull();
    expect(document.querySelector("img")?.getAttribute("src")).toBe("/images/pio/cheer.png");
  });
});

describe("la pose « ask » : Pio montre la question", () => {
  it("existe dans la tenue de tous les jours, affiche, affiche légère et clip", () => {
    expect(isPioState("ask")).toBe(true);
    expect(pioPosterSrc("ask", "classic")).toBe("/images/pio/ask.png");
    expect(pioPosterSrc("ask", "classic", true)).toBe("/images/pio/lite/ask.webp");
    expect(pioClipSources("ask")).toEqual({ mov: "/videos/pio/ask.mov", webm: "/videos/pio/ask.webm" });
  });

  it("en boubou, retombe sur une pose calme de la MÊME tenue : Pio ne change pas d'habits", () => {
    expect(pioPosterSrc("ask", "boubou")).toBe("/images/pio/boubou/idle.png");
    expect(pioClipSources("ask", "boubou")).toEqual({ mov: "/videos/pio/boubou/idle.mov", webm: "/videos/pio/boubou/idle.webm" });
  });

  it("se nomme pour un lecteur d'écran", () => {
    render(<Pio state="ask" animated={false} />);
    expect(screen.getByRole("img", { name: "Pio te montre la question" })).toBeTruthy();
  });
});

describe("la taille de Pio : des pixels, ou une longueur CSS", () => {
  it("en pixels, rien ne change : 96 px de haut, 69 px de large, le clip à l'échelle", () => {
    render(<Pio state="idle" size={96} />);
    const root = screen.getByRole("img");
    expect(root.style.height).toBe("96px");
    expect(root.style.width).toBe("69px");
    const video = document.querySelector("video") as HTMLVideoElement;
    expect(video.style.width).toBe("69px");
    expect(video.style.height).toBe("123px");
    expect(video.style.top).toBe("-15px");
  });

  it("en longueur CSS, la largeur et la géométrie du clip suivent en calc()", () => {
    // Une variable plutôt qu'un `clamp(... svh ...)` : jsdom ne connaît pas `svh` et jetterait la valeur.
    render(<Pio state="ask" size="var(--stage-pio)" />);
    const root = screen.getByRole("img");
    expect(root.style.height).toBe("var(--stage-pio)");
    expect(root.style.width).toBe("calc(var(--stage-pio) * 0.715)");
    const video = document.querySelector("video") as HTMLVideoElement;
    expect(video.style.width).toBe("calc(var(--stage-pio) * 0.72)");
    expect(video.style.height).toBe("calc(var(--stage-pio) * 1.28)");
    expect(video.style.top).toBe("calc(var(--stage-pio) * -0.16)");
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
