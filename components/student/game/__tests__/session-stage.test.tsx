import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MotionGlobalConfig } from "framer-motion";
import { SubmitButton } from "@/components/exercises/game-parts";
import { coachLine, SessionStage, starsEarned } from "../session-stage";

// Les entrées de la carte et de la bulle sont animées : dans un test, d'un coup.
MotionGlobalConfig.skipAnimations = true;

/** L'appareil, et le lecteur de consignes actif, que les tests choisissent. */
const device = vi.hoisted(() => ({ tier: "full" as "lite" | "full" }));
const voice = vi.hoisted(() => ({
  reader: null as null | { status: "idle" | "loading" | "playing" | "unavailable"; read: () => void; stop: () => void },
}));
vi.mock("@/hooks/use-device-tier", () => ({ useDeviceTier: () => device.tier }));
vi.mock("@/components/offline/clip-source", () => ({ useClipSource: () => vi.fn() }));
vi.mock("@/components/exercises/prompt-reader", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/components/exercises/prompt-reader")>()),
  useActivePromptReader: () => voice.reader,
}));
// Pas de Howler dans jsdom : le son est un module muet.
vi.mock("@/lib/sounds", () => ({
  preloadAll: vi.fn(),
  getSoundEnabledLocal: () => false,
  play: vi.fn(),
}));

beforeAll(() => {
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  device.tier = "full";
  voice.reader = null;
});

describe("coachLine — la phrase de Pio pendant que l'enfant cherche", () => {
  it("ouvre la séance, annonce la dernière question, et entre deux essais compte ce qui reste", () => {
    const retry = coachLine({ questionIndex: 2, total: 10, failedAttempts: 2, seed: 3 });
    expect(retry.text).toContain("Encore 3 essais");
    expect(coachLine({ questionIndex: 0, total: 10, failedAttempts: 0, seed: 0 })).toEqual({ text: "C'est parti !" });
    expect(coachLine({ questionIndex: 9, total: 10, failedAttempts: 0, seed: 0 })).toEqual({ text: "Dernière question !" });
    const middle = coachLine({ questionIndex: 4, total: 10, failedAttempts: 0, seed: 0 });
    expect(middle.text.length).toBeGreaterThan(0);
  });
});

describe("starsEarned — la grille du serveur, en étoiles", () => {
  it("3 du premier coup, 2 au deuxième, 1 au troisième, 0 ensuite ; un indice coûte", () => {
    expect(starsEarned(0, 0)).toBe(3);
    expect(starsEarned(1, 0)).toBe(2);
    expect(starsEarned(2, 0)).toBe(1);
    expect(starsEarned(3, 0)).toBe(0);
    expect(starsEarned(0, 2)).toBe(2);
  });
});

function renderStage(overrides: Partial<Parameters<typeof SessionStage>[0]> = {}) {
  const onQuit = vi.fn();
  const onAsk = vi.fn();
  const onToggle = vi.fn();
  const utils = render(
    <SessionStage
      topicName="Les nombres jusqu'à 10"
      palierIndex={2}
      questionIndex={1}
      total={10}
      failedAttempts={2}
      stars={4}
      outcome={null}
      sound={{ enabled: true, onToggle }}
      onQuit={onQuit}
      exerciseKey="exo-1"
      hint={{ canAsk: true, onAsk, shown: null }}
      {...overrides}
    >
      <p>Combien font 3 + 4 ?</p>
    </SessionStage>,
  );
  return { ...utils, onQuit, onAsk, onToggle };
}

describe("SessionStage — la coque d'une séance", () => {
  it("affiche la question, le sentier, les cœurs et les étoiles, et garde les commandes", () => {
    const { onQuit, onToggle } = renderStage();
    expect(screen.getByText("Les nombres jusqu'à 10")).toBeTruthy();
    expect(screen.getByText(/Palier 2 · Question 2\/10/)).toBeTruthy();
    const track = screen.getByRole("group", { name: "Progression de la séance" });
    expect(track.textContent).toContain("Question 2 sur 10.");
    expect(track.textContent).toContain("Encore 3 essais.");
    expect(track.textContent).toContain("4 étoiles gagnées.");
    expect(track.querySelectorAll("[data-alive='false']").length).toBe(2);

    const sound = screen.getByRole("button", { name: "Couper les sons du jeu" });
    // Une note de musique, pas un haut-parleur : le haut-parleur est le signe d'« Écouter l'énoncé ».
    expect(sound.querySelector("svg.lucide-music")).not.toBeNull();
    expect(sound.querySelector("svg.lucide-volume-2")).toBeNull();
    expect(sound.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(sound);
    expect(onToggle).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Sauvegarder et quitter" }));
    expect(onQuit).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Combien font 3 + 4 ?")).toBeTruthy();
  });

  it("Pio montre la question en grand, puis s'efface avec sa bulle pendant la scène de réponse (un seul Pio à l'écran), sans jamais être animé par du code", () => {
    const { container, rerender } = renderStage();
    const row = container.querySelector("[data-coach-pose]")!;
    expect(row.getAttribute("data-coach-pose")).toBe("ask");
    expect(row.getAttribute("data-coach-hidden")).toBeNull();
    expect(row.className).not.toContain("invisible");
    // Sa taille suit la hauteur de l'écran : une longueur CSS, pas des pixels fixes.
    const pio = screen.getByRole("img", { name: "Pio te montre la question" });
    expect(pio.style.height).toBe("var(--stage-pio)");
    expect(pio.style.width).toBe("calc(var(--stage-pio) * 0.715)");
    const scene = container.querySelector("[data-question-scene]");
    // 28 % de la hauteur utile : l'écran moins l'encoche (62 px sur un iPhone 17).
    expect(scene?.className).toContain("clamp(120px,calc((100svh_-_env(safe-area-inset-top,0px))*0.28),280px)");
    // Sur un écran court (601 à 667 px), 17 %, entre 104 et 124 px.
    expect(scene?.className).toContain("[@media(max-height:667px)_and_(min-height:601px)]:supports-[height:1svh]:[--stage-pio:clamp(104px,calc((100svh_-_env(safe-area-inset-top,0px))*0.17),124px)]");
    expect(scene?.className).toContain("[@media(max-height:480px)]:[--stage-pio:112px]");
    // En paysage, Pio et sa bulle passent en colonne à gauche de la carte.
    expect(scene?.className).toContain("[@media(max-height:480px)]:flex");
    // La savane peinte du camp sur un appareil « full » (statique) ; le décor CSS en dessous pour la suite de la page.
    expect(container.querySelector(".gk-stage")?.getAttribute("data-painted")).toBe("1");
    expect(container.querySelector(".gk-stage img")?.getAttribute("src")).toBe("/images/world/hub-savanna-portrait.jpg");
    // Sans voix à relire, Pio est une image, pas un bouton.
    expect(screen.queryByRole("button", { name: "Écouter l'énoncé" })).toBeNull();
    rerender(
      <SessionStage
        topicName="T"
        palierIndex={1}
        questionIndex={0}
        total={3}
        failedAttempts={0}
        outcome={{ correct: true, attemptsRemaining: 5 }}
        onQuit={() => {}}
        exerciseKey="exo-1"
      >
        <p>x</p>
      </SessionStage>,
    );
    // La scène de réponse porte le Pio de l'issue et son « Bravo ! » : le grand
    // Pio garde son affiche « ask » (rien à échanger dans l'image du verdict)
    // et sa rangée s'efface (opacité, puis `visibility`), hors de la tabulation.
    const reacting = container.querySelector("[data-coach-pose]")!;
    expect(reacting.getAttribute("data-coach-pose")).toBe("ask");
    expect(reacting.getAttribute("data-coach-hidden")).toBe("1");
    expect(reacting.className).toContain("invisible");
    expect(reacting.className).toContain("opacity-0");
    expect(reacting.hasAttribute("inert")).toBe(true);
    expect(container.querySelector("[data-question-scene] img")?.getAttribute("src")).toBe("/images/pio/lite/ask.webp");
    // Une bonne réponse : la pierre passe déjà au vert et le jeton avance.
    const track = screen.getByRole("group", { name: "Progression de la séance" });
    expect(track.querySelectorAll("[data-stone='passee']").length).toBe(1);
  });

  it("joue le clip « ask » une fois la carte posée, sur un appareil capable ; l'affiche pendant la réaction", () => {
    vi.useFakeTimers();
    // Les affiches demandées en avance (`preloadPioPosters` : une `Image` par URL).
    const requested: string[] = [];
    vi.stubGlobal(
      "Image",
      class {
        set src(value: string) {
          requested.push(value);
        }
      },
    );
    const { container, rerender } = renderStage();
    // Le temps que la carte arrive : l'affiche légère, pas de vidéo, et rien d'autre demandé.
    expect(container.querySelector("video")).toBeNull();
    expect(container.querySelector("[data-question-scene] img")?.getAttribute("src")).toBe("/images/pio/lite/ask.webp");
    expect(requested).toEqual([]);
    act(() => {
      vi.advanceTimersByTime(700);
    });
    expect(container.querySelector("[data-coach-clip]")?.getAttribute("data-coach-clip")).toBe("1");
    // La carte posée : les affiches des poses de la réaction sont demandées, pour
    // que le verdict ne laisse pas un trou à la place de Pio.
    expect(requested).toEqual(["/images/pio/lite/cheer.webp", "/images/pio/lite/encourage.webp", "/images/pio/lite/sad.webp"]);
    const video = container.querySelector("video");
    expect(video?.getAttribute("poster")).toBe("/images/pio/lite/ask.webp");
    expect(video?.querySelector("source")?.getAttribute("src")).toBe("/videos/pio/ask.mov");
    // L'affiche reste peinte sous le clip : sur iOS, la couche vidéo s'éteint
    // d'elle-même dès qu'un son part (le verdict, la voix).
    expect(container.querySelector("[data-question-scene] img")?.getAttribute("src")).toBe("/images/pio/lite/ask.webp");
    // Le clip déborde en haut, à l'échelle de la hauteur de Pio.
    expect(video?.style.top).toBe("calc(var(--stage-pio) * -0.16)");

    // La réponse donnée : le clip se démonte (le son coupe le clip sur iOS), l'affiche « ask » reste sous le fondu.
    rerender(
      <SessionStage topicName="T" palierIndex={1} questionIndex={1} total={10} failedAttempts={2} outcome={{ correct: false, attemptsRemaining: 3 }} onQuit={() => {}} exerciseKey="exo-1">
        <p>x</p>
      </SessionStage>,
    );
    expect(container.querySelector("video")).toBeNull();
    expect(container.querySelector("[data-question-scene] img")?.getAttribute("src")).toBe("/images/pio/lite/ask.webp");
  });

  it("le clip s'arrête de lui-même après vingt secondes : Pio reste sur son affiche", () => {
    vi.useFakeTimers();
    const { container, rerender } = renderStage();
    act(() => {
      vi.advanceTimersByTime(700);
    });
    expect(container.querySelector("video")).not.toBeNull();
    expect(container.querySelector("[data-coach-phase]")?.getAttribute("data-coach-phase")).toBe("posee");
    act(() => {
      vi.advanceTimersByTime(19_999);
    });
    expect(container.querySelector("video")).not.toBeNull();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    // Le calme : l'affiche « ask » seule, le décodage s'arrête.
    expect(container.querySelector("video")).toBeNull();
    expect(container.querySelector("[data-coach-clip]")?.getAttribute("data-coach-clip")).toBe("0");
    expect(container.querySelector("[data-coach-phase]")?.getAttribute("data-coach-phase")).toBe("calme");
    expect(container.querySelector("[data-question-scene] img")?.getAttribute("src")).toBe("/images/pio/lite/ask.webp");

    // La carte suivante repart du début : le clip rejoue une fois posée.
    rerender(
      <SessionStage topicName="T" palierIndex={1} questionIndex={2} total={10} failedAttempts={0} outcome={null} onQuit={() => {}} exerciseKey="exo-2">
        <p>x</p>
      </SessionStage>,
    );
    expect(container.querySelector("[data-coach-phase]")?.getAttribute("data-coach-phase")).toBe("arrive");
    act(() => {
      vi.advanceTimersByTime(700);
    });
    expect(container.querySelector("video")).not.toBeNull();
  });

  it("le calme attend que le doigt se lève : pas de démontage du clip sous un glissé", () => {
    vi.useFakeTimers();
    const { container } = renderStage();
    act(() => {
      vi.advanceTimersByTime(700);
    });
    expect(container.querySelector("video")).not.toBeNull();
    // Un doigt posé (un glissé en cours) quand l'échéance tombe : le clip reste.
    act(() => {
      document.dispatchEvent(new Event("pointerdown"));
      vi.advanceTimersByTime(20_000);
    });
    expect(container.querySelector("video")).not.toBeNull();
    expect(container.querySelector("[data-coach-phase]")?.getAttribute("data-coach-phase")).toBe("posee");
    // Le doigt levé : le calme, aussitôt.
    act(() => {
      document.dispatchEvent(new Event("pointerup"));
    });
    expect(container.querySelector("video")).toBeNull();
    expect(container.querySelector("[data-coach-phase]")?.getAttribute("data-coach-phase")).toBe("calme");
  });

  it("sur un appareil modeste, Pio reste l'affiche, et la savane reste en CSS", () => {
    vi.useFakeTimers();
    device.tier = "lite";
    const { container } = renderStage();
    expect(container.querySelector(".gk-stage")?.getAttribute("data-painted")).toBeNull();
    expect(container.querySelector(".gk-stage img")).toBeNull();
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(container.querySelector("video")).toBeNull();
    expect(container.querySelector("[data-coach-clip]")?.getAttribute("data-coach-clip")).toBe("0");
  });

  it("avec une voix : Pio se touche pour relire l'énoncé, arrête si elle parle, et montre l'affiche pendant", () => {
    vi.useFakeTimers();
    const read = vi.fn();
    const stop = vi.fn();
    voice.reader = { status: "idle", read, stop };
    const { container, rerender } = renderStage();
    const pio = screen.getByRole("button", { name: "Écouter l'énoncé" });
    expect(pio.getAttribute("aria-pressed")).toBe("false");
    expect(pio.querySelector("[role='img']")).not.toBeNull();
    fireEvent.click(pio);
    expect(read).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(700);
    });
    expect(container.querySelector("video")).not.toBeNull();

    // Sans son à jouer, le bouton le dit (un lecteur d'écran n'entend pas le même bouton).
    voice.reader = { status: "unavailable", read, stop };
    rerender(
      <SessionStage topicName="T" palierIndex={2} questionIndex={1} total={10} failedAttempts={2} stars={4} outcome={null} onQuit={() => {}} exerciseKey="exo-1">
        <p>x</p>
      </SessionStage>,
    );
    expect(screen.getByRole("button", { name: /Écouter l'énoncé : le son manque/ })).toBeTruthy();

    // La voix parle : l'affiche remplace le clip, et le toucher arrête.
    voice.reader = { status: "playing", read, stop };
    rerender(
      <SessionStage topicName="T" palierIndex={2} questionIndex={1} total={10} failedAttempts={2} stars={4} outcome={null} onQuit={() => {}} exerciseKey="exo-1">
        <p>x</p>
      </SessionStage>,
    );
    expect(container.querySelector("video")).toBeNull();
    const talking = screen.getByRole("button", { name: "Écouter l'énoncé" });
    expect(talking.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(talking);
    expect(stop).toHaveBeenCalledTimes(1);
  });

  it("propose l'indice dans la carte, puis le montre", () => {
    const { onAsk, rerender } = renderStage();
    fireEvent.click(screen.getByRole("button", { name: "Voir un indice" }));
    expect(onAsk).toHaveBeenCalledTimes(1);
    rerender(
      <SessionStage
        topicName="T"
        palierIndex={1}
        questionIndex={1}
        total={10}
        failedAttempts={2}
        outcome={null}
        onQuit={() => {}}
        exerciseKey="exo-1"
        hint={{ canAsk: false, onAsk, shown: { text: "Compte les mangues une par une.", index: 0 } }}
      >
        <p>x</p>
      </SessionStage>,
    );
    expect(screen.queryByRole("button", { name: "Voir un indice" })).toBeNull();
    expect(screen.getByText(/Compte les mangues une par une\./)).toBeTruthy();
    expect(screen.getByText(/Indice 1/)).toBeTruthy();
  });

  it("la barre d'action de l'exercice est collée en bas : dans le dock de la coque, après le contenu, et la carte garde l'indice", () => {
    const onClick = vi.fn();
    const { container } = render(
      <SessionStage topicName="T" palierIndex={1} questionIndex={1} total={10} failedAttempts={2} outcome={null} onQuit={() => {}} exerciseKey="exo-1" hint={{ canAsk: true, onAsk: () => {}, shown: null }}>
        <SubmitButton onClick={onClick} disabled={false} />
      </SessionStage>,
    );
    const root = container.querySelector<HTMLElement>("[data-session-stage]")!;
    const dock = screen.getByRole("group", { name: "Actions de l'exercice" });
    const card = container.querySelector("[data-exercise-card]")!;
    // Valider vit dans le dock, pas dans la carte ; l'indice reste dans la carte.
    expect(card.querySelector("[data-scene-actions]")).toBeNull();
    expect(dock.querySelector("[data-scene-actions]")).not.toBeNull();
    const valider = screen.getByRole("button", { name: "Valider" }) as HTMLButtonElement;
    expect(dock.contains(valider)).toBe(true);
    expect(card.contains(screen.getByRole("button", { name: "Voir un indice" }))).toBe(true);
    expect(valider.disabled).toBe(false);
    fireEvent.click(valider);
    expect(onClick).toHaveBeenCalledTimes(1);
    // Le dock vient après la carte dans le DOM (tabulation : contenu, puis dock) ; il est fixé au bas de l'écran.
    expect(card.compareDocumentPosition(dock) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(dock.className).toContain("fixed");
    expect(dock.className).toContain("bottom-0");
    // La coque réserve la hauteur du dock en bas de son contenu (mesurée : 0 dans jsdom).
    expect(root.style.getPropertyValue("--dock-h")).toBe("0px");
    expect(container.querySelector<HTMLElement>("[data-session-hud]")!.parentElement!.style.paddingBottom).toContain("var(--dock-h");
  });

  it("sans décision sur le son, pas de bouton ; la bannière réseau n'apparaît que si on la demande", () => {
    const { container, rerender } = renderStage({ sound: null });
    expect(screen.queryByRole("button", { name: /les sons du jeu/ })).toBeNull();
    expect(container.querySelector("[data-session-hud]")?.className).not.toContain("backdrop-blur");
    expect(screen.queryByText(/perdu la connexion/)).toBeNull();
    rerender(
      <SessionStage topicName="T" palierIndex={1} questionIndex={0} total={3} failedAttempts={0} outcome={null} onQuit={() => {}} exerciseKey="e" networkLost>
        <p>x</p>
      </SessionStage>,
    );
    expect(screen.getByText(/perdu la connexion/)).toBeTruthy();
  });
});
