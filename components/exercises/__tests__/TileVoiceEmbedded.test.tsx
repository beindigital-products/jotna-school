import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";

// La récompense tire des confettis sur un canevas : pas de canevas dans jsdom.
vi.mock("canvas-confetti", () => ({ default: vi.fn() }));

const mocks = vi.hoisted(() => ({
  findClip: vi.fn(),
  playUrl: vi.fn(),
  stopPlaying: vi.fn(),
}));

vi.mock("@/components/offline/clip-source", () => ({ useClipSource: () => mocks.findClip }));
vi.mock("@/lib/voice-player", () => ({
  newVoiceOwner: () => 7,
  playUrl: mocks.playUrl,
  stopPlaying: mocks.stopPlaying,
}));
vi.mock("@/hooks/use-device-tier", () => ({ useDeviceTier: () => "full" }));
vi.mock("@/lib/sounds", () => ({ getSoundEnabledLocal: () => false, play: vi.fn() }));

import QcmExercise from "../QcmExercise";
import { PromptReaderProvider } from "../prompt-reader";
import { resetStaticVoiceFailures, staticVoiceManifest } from "@/lib/voice-static";

/**
 * LES SONS EMBARQUÉS (`lib/voice-static`) : le lecteur les joue AVANT le serveur, dans une thématique d'anglais. Ni
 * réseau ni crédit : `findClip` (le serveur) n'est même pas appelé pour une tuile que l'application connaît.
 */

type Play = { url: string; finish: (ok?: boolean) => void; fail: () => void };
const plays: Play[] = [];
const embedded = (spoken: string) => `/voix/${staticVoiceManifest().clips[spoken]}`;

function Screen({
  tag,
  options,
  englishTopic,
  prompt = "Quelle lettre vient après la lettre A ?",
}: {
  tag: string;
  options: string[];
  englishTopic: boolean;
  prompt?: string;
}) {
  return (
    <PromptReaderProvider exerciseId={`ex-${tag}`} silenced={false} tileVoice englishTopic={englishTopic}>
      <QcmExercise
        prompt={prompt}
        payload={{ options, correctIndex: 0 }}
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
  plays.length = 0;
  resetStaticVoiceFailures();
  mocks.playUrl.mockImplementation(
    (url: string, _owner: number, _rate: number, onFail?: () => void) =>
      new Promise<boolean>((resolve) => {
        plays.push({
          url,
          finish: (ok = true) => resolve(ok),
          fail: () => {
            onFail?.();
            resolve(false);
          },
        });
      }),
  );
  mocks.findClip.mockImplementation(async (request: { kind: string; text?: string; exerciseId?: string }) =>
    request.kind === "tile" ? `tile://${request.text}` : `prompt://${request.exerciseId}`,
  );
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

async function flush(ms = 0) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}
const urls = () => plays.map((play) => play.url);
const tileRequests = () =>
  mocks.findClip.mock.calls.map(([request]) => request).filter((request) => request.kind === "tile");
const optionButton = (index: number) => document.querySelector(`[data-option="${index}"]`) as HTMLElement;

describe("les sons embarqués dans l'application", () => {
  it("la table des sons existe : elle porte la voix et le modèle, et dit « bee », « see », « dee »", () => {
    const manifest = staticVoiceManifest();
    expect(manifest.voiceId).not.toBe("");
    expect(manifest.modelId).not.toBe("");
    for (const spoken of ["bee", "see", "dee"]) expect(manifest.clips[spoken], spoken).toMatch(/^[0-9a-f]{16}\.mp3$/);
  });

  it("dit les lettres avec les sons embarqués, après la consigne du serveur, sans rien demander au serveur pour elles", async () => {
    render(<Screen tag="a" options={["B", "C", "D"]} englishTopic />);
    await flush();
    expect(urls()).toEqual(["prompt://ex-a"]);

    plays[0].finish();
    await flush(450);
    expect(urls().at(-1)).toBe(embedded("bee"));
    plays[1].finish();
    await flush(300);
    expect(urls().at(-1)).toBe(embedded("see"));
    plays[2].finish();
    await flush(300);
    expect(urls().at(-1)).toBe(embedded("dee"));

    expect(tileRequests()).toEqual([]);
  });

  it("un texte que l'application ne connaît pas va au serveur, comme avant", async () => {
    render(<Screen tag="b" options={["B", "mot inconnu de la table", "D"]} englishTopic />);
    await flush();
    plays[0].finish();
    await flush(450);
    expect(urls().at(-1)).toBe(embedded("bee"));
    plays[1].finish();
    await flush(300);
    expect(urls().at(-1)).toBe("tile://mot inconnu de la table");
    expect(tileRequests().map((request) => request.text)).toEqual(["mot inconnu de la table"]);
  });

  it("hors d'une thématique d'anglais, un mot de la table va quand même au serveur (autre voix, autre langue)", async () => {
    // Hors anglais, « lettre » dans l'énoncé couperait la voix des tuiles : une consigne ordinaire.
    render(<Screen tag="c" options={["banana", "pomme", "poire"]} englishTopic={false} prompt="Quel fruit choisis-tu ?" />);
    await flush();
    plays[0].finish();
    await flush(450);
    expect(urls().at(-1)).toBe("tile://banana");
    expect(urls().some((url) => url.startsWith("/voix/"))).toBe(false);
  });

  it("un son embarqué qui ne se joue pas est oublié : le toucher suivant passe par le serveur", async () => {
    render(<Screen tag="d" options={["B", "C", "D"]} englishTopic />);
    await flush();
    plays[0].finish();
    await flush(450);
    // « bee » s'est joué depuis l'application, et le fichier est mort.
    expect(urls().at(-1)).toBe(embedded("bee"));
    plays[1].fail();
    await flush(300);

    // Le toucher sur la tuile « B » redit le son, cette fois depuis le serveur.
    for (const play of [...plays]) play.finish();
    await flush(2000);
    fireEvent.click(optionButton(0));
    await flush();
    expect(urls().at(-1)).toBe("tile://B");
    expect(tileRequests().map((request) => request.text)).toContain("B");
  });
});
