import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";

// La récompense tire des confettis sur un canevas : pas de canevas dans jsdom.
vi.mock("canvas-confetti", () => ({ default: vi.fn() }));

const mocks = vi.hoisted(() => ({
  findClip: vi.fn(),
  playUrl: vi.fn(),
  stopPlaying: vi.fn(),
}));
// Ce que l'appareil dit au clip : son niveau, le mouvement réduit, un écran trop court.
const device = vi.hoisted(() => ({ tier: "full" as "full" | "lite", reduced: false }));

vi.mock("@/components/offline/clip-source", () => ({ useClipSource: () => mocks.findClip }));
vi.mock("@/lib/voice-player", () => ({
  newVoiceOwner: () => 7,
  playUrl: mocks.playUrl,
  stopPlaying: mocks.stopPlaying,
}));
vi.mock("@/hooks/use-device-tier", () => ({ useDeviceTier: () => device.tier }));
vi.mock("@/components/landing/use-media-query", () => ({ useMediaQuery: () => false }));
vi.mock("framer-motion", async (importOriginal) => ({
  ...(await importOriginal<typeof import("framer-motion")>()),
  useReducedMotion: () => device.reduced,
}));
vi.mock("@/lib/sounds", () => ({ getSoundEnabledLocal: () => false, play: vi.fn() }));

import QcmExercise from "../QcmExercise";
import { PromptReaderProvider } from "../prompt-reader";

/**
 * L'ORDRE D'UNE SCÈNE DU CI : la consigne, le CLIP, puis les propositions.
 *
 * Le clip ne part jamais pendant une voix (sur iOS, un son coupe une vidéo muette),
 * donc, sans rien d'autre, il partirait APRÈS les propositions, quand l'enfant a déjà
 * choisi. Le lecteur lui laisse la parole entre la consigne et les propositions
 * (`turn: "media"`). Le vrai lecteur et le vrai clip jouent ici ; seuls le serveur de
 * sons, le lecteur audio et l'élément vidéo sont simulés.
 */
type Play = { url: string; finish: (ok?: boolean) => void };
const plays: Play[] = [];
let videoPlay: ReturnType<typeof vi.spyOn>;

const SETTLE_MS = 700;
const AFTER_PROMPT_MS = 450;
const MEDIA_WAIT_MS = 9000;

const options = (tag: string) => [`le chat ${tag}`, `le chien ${tag}`, `la girafe ${tag}`];

function Scene({
  tag,
  scene = "po1",
  exerciseId = `ex-${tag}`,
  silenced = false,
}: {
  tag: string;
  scene?: string;
  exerciseId?: string;
  silenced?: boolean;
}) {
  return (
    <PromptReaderProvider exerciseId={exerciseId} tileVoice silenced={silenced}>
      <QcmExercise
        prompt="Ta grand-mère te parle. Que fais-tu ?"
        payload={{ options: options(tag), correctIndex: 0, scene }}
        onSubmit={() => {}}
        disabled={false}
        isCorrect={null}
      />
    </PromptReaderProvider>
  );
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  device.tier = "full";
  device.reduced = false;
  plays.length = 0;
  mocks.playUrl.mockImplementation(
    (url: string) =>
      new Promise<boolean>((resolve) => {
        plays.push({ url, finish: (ok = true) => resolve(ok) });
      }),
  );
  mocks.findClip.mockImplementation(async (request: { kind: string; text?: string; exerciseId?: string }) =>
    request.kind === "tile" ? `tile://${request.text}` : `prompt://${request.exerciseId}`,
  );
  // jsdom ne lit aucune vidéo : on regarde ce que le clip demande à l'élément.
  videoPlay = vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(() => Promise.resolve());
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

async function flush(ms = 0) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

/**
 * Deux tours : React ne rejoue ses effets qu'à la sortie de `act`. Un changement d'état de
 * la voix (le tour du clip) se voit au premier tour, la réaction du clip au second.
 */
async function turns() {
  await flush();
  await flush();
}

/** Termine tous les sons, un tour après l'autre, jusqu'à la fin de la file. */
async function drain() {
  for (let i = 0; i < 12; i++) {
    for (const play of plays) play.finish();
    await flush(1000);
  }
}

const urls = () => plays.map((play) => play.url);
const tileUrls = () => urls().filter((url) => url.startsWith("tile://"));
const video = () => document.querySelector("video") as HTMLVideoElement | null;
const clipState = () => document.querySelector("[data-scene-clip]")?.getAttribute("data-scene-state");
const ecouter = () => screen.getByRole("button", { name: /^Écouter l'énoncé/ });

describe("une scène du CI : la consigne, le clip, puis les propositions", () => {
  it("le clip joue entre la consigne et les propositions, et celles-ci attendent sa fin", async () => {
    render(<Scene tag="a" />);
    await flush(SETTLE_MS);
    // La voix parle la consigne : le clip est monté, il attend.
    expect(urls()).toEqual(["prompt://ex-a"]);
    expect(video()).not.toBeNull();
    expect(videoPlay).not.toHaveBeenCalled();
    expect(clipState()).toBe("attend");

    // La consigne finit : le clip a la parole, la file attend.
    plays[0].finish();
    await flush();
    expect(videoPlay).toHaveBeenCalledTimes(1);
    expect(clipState()).toBe("joue");
    await flush(5000);
    expect(tileUrls()).toEqual([]);

    // Le clip finit : un silence, puis la première proposition.
    act(() => void fireEvent.ended(video()!));
    await flush(AFTER_PROMPT_MS - 1);
    expect(tileUrls()).toEqual([]);
    await flush(1);
    expect(tileUrls()).toEqual(["tile://le chat a"]);
    expect(clipState()).toBe("fini");
  });

  it("n'attend pas un clip qui ne part pas seul : appareil sobre, ou mouvement réduit", async () => {
    for (const [tag, setup] of [
      ["b", () => (device.tier = "lite")],
      ["c", () => (device.reduced = true)],
    ] as const) {
      setup();
      const view = render(<Scene tag={tag} />);
      await flush(SETTLE_MS);
      plays[0].finish();
      await flush(AFTER_PROMPT_MS);
      expect(tileUrls(), tag).toEqual([`tile://le chat ${tag}`]);
      expect(videoPlay).not.toHaveBeenCalled();
      view.unmount();
      plays.length = 0;
      device.tier = "full";
      device.reduced = false;
    }
  });

  it("un clip qui n'arrive jamais ne tait pas la voix : neuf secondes au plus", async () => {
    render(<Scene tag="d" />);
    await flush(SETTLE_MS);
    plays[0].finish();
    await flush(MEDIA_WAIT_MS - 1);
    expect(tileUrls()).toEqual([]);
    await flush(1 + AFTER_PROMPT_MS);
    expect(tileUrls()).toEqual(["tile://le chat d"]);
  });

  it("un navigateur qui refuse la lecture automatique ne retient pas la voix", async () => {
    videoPlay.mockImplementation(() => Promise.reject(new Error("NotAllowedError")));
    render(<Scene tag="e" />);
    await flush(SETTLE_MS);
    plays[0].finish();
    await turns();
    await flush(AFTER_PROMPT_MS);
    // Le clip est refusé : le bouton rond le lancera, la file ne l'attend pas.
    expect(tileUrls()).toEqual(["tile://le chat e"]);
    expect(document.querySelector("[data-scene-tap]")).not.toBeNull();
  });

  it("un clip cassé ne retient pas la voix", async () => {
    render(<Scene tag="f" />);
    await flush(SETTLE_MS);
    plays[0].finish();
    await flush();
    act(() => void fireEvent.error(video()!));
    await turns();
    await flush(AFTER_PROMPT_MS);
    expect(tileUrls()).toEqual(["tile://le chat f"]);
  });

  it("« Écouter » ne rejoue pas le clip et ne se fait pas attendre une seconde fois", async () => {
    render(<Scene tag="g" />);
    await flush(SETTLE_MS);
    plays[0].finish();
    await flush();
    act(() => void fireEvent.ended(video()!));
    await turns();
    await flush(AFTER_PROMPT_MS);
    await drain();
    expect(tileUrls()).toHaveLength(3);
    const before = urls().length;
    videoPlay.mockClear();

    fireEvent.click(ecouter());
    await flush();
    expect(urls().at(-1)).toBe("prompt://ex-g");
    plays.at(-1)?.finish();
    await flush(AFTER_PROMPT_MS);
    // Aucune attente du clip : les propositions suivent la consigne.
    expect(urls().length).toBe(before + 2);
    expect(urls().at(-1)).toBe("tile://le chat g");
    expect(videoPlay).not.toHaveBeenCalled();
  });

  it("un toucher sur une proposition pendant le clip dit la tuile et coupe la file", async () => {
    render(<Scene tag="h" />);
    await flush(SETTLE_MS);
    plays[0].finish();
    await flush();
    expect(clipState()).toBe("joue");

    fireEvent.click(document.querySelector('[data-option="1"]') as HTMLElement);
    await flush();
    expect(tileUrls()).toEqual(["tile://le chien h"]);
    // La voix a la parole : le clip se met en pause, et ne la rend pas à la file.
    plays.at(-1)?.finish();
    await flush();
    act(() => void fireEvent.ended(video()!));
    await flush(5000);
    expect(tileUrls()).toEqual(["tile://le chien h"]);
  });

  it("se tait quand l'enfant a répondu pendant le clip", async () => {
    const view = render(<Scene tag="i" />);
    await flush(SETTLE_MS);
    plays[0].finish();
    await flush();
    expect(clipState()).toBe("joue");

    view.rerender(<Scene tag="i" silenced />);
    await flush();
    act(() => void fireEvent.ended(video()!));
    await turns();
    await flush(5000);
    expect(tileUrls()).toEqual([]);
  });
});
