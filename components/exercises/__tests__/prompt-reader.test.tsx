import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  findClip: vi.fn(),
  playUrl: vi.fn(),
  stopPlaying: vi.fn(),
}));

// La source des sons : le sac du téléphone d'abord, le serveur ensuite
// (`components/offline/clip-source.ts`). Ici, une seule fonction simulée.
vi.mock("@/components/offline/clip-source", () => ({ useClipSource: () => mocks.findClip }));
vi.mock("@/lib/voice-player", () => ({
  newVoiceOwner: () => 7,
  playUrl: mocks.playUrl,
  stopPlaying: mocks.stopPlaying,
}));
vi.mock("@/hooks/use-device-tier", () => ({ useDeviceTier: () => "full" }));
vi.mock("@/lib/sounds", () => ({ getSoundEnabledLocal: () => false, play: vi.fn() }));

import ExercisePrompt from "../ExercisePrompt";
import { ExerciseActions } from "../game-parts";
import { PromptReaderProvider, useActivePromptReader } from "../prompt-reader";

const PROMPT = "Fais correspondre les mots avec leur son.";

/** L'exercice comme en séance : l'énoncé, puis la barre d'action en bas de la carte. */
function Session({ exerciseId, silenced = false }: { exerciseId: string; silenced?: boolean }) {
  return (
    <PromptReaderProvider exerciseId={exerciseId} silenced={silenced}>
      <ExercisePrompt prompt={PROMPT} />
      <ExerciseActions />
    </PromptReaderProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  // Un son qui joue jusqu'à ce qu'on le coupe.
  mocks.playUrl.mockImplementation(() => new Promise<boolean>(() => {}));
});
afterEach(cleanup);

// Sans son à jouer, le nom du bouton le dit (« … : le son manque, touche pour relancer »).
const ecouter = () => screen.getByRole("button", { name: /^Écouter l'énoncé/ });

describe("le lecteur de consignes", () => {
  it("dit la consigne toute seule quand l'exercice apparaît, le bouton Écouter en bas", async () => {
    mocks.findClip.mockResolvedValue("https://clip/1.mp3");
    const { container } = render(<Session exerciseId="exercise1" />);

    await waitFor(() => expect(mocks.playUrl).toHaveBeenCalledWith("https://clip/1.mp3", 7, 1));
    expect(mocks.findClip).toHaveBeenCalledWith({ kind: "prompt", exerciseId: "exercise1" });
    expect(ecouter().getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByText(PROMPT)).toBeTruthy();
    // L'énoncé prend toute la largeur : aucun bouton avant lui, le halo s'allume derrière.
    const prompt = container.querySelector("[data-prompt-reading]");
    expect(prompt?.getAttribute("data-prompt-reading")).toBe("1");
    expect(prompt?.querySelector("button")).toBeNull();
    expect(prompt!.compareDocumentPosition(ecouter()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("un toucher pendant la lecture l'arrête ; un autre la relit", async () => {
    mocks.findClip.mockResolvedValue("https://clip/1b.mp3");
    render(<Session exerciseId="exercise1b" />);
    await waitFor(() => expect(ecouter().getAttribute("aria-pressed")).toBe("true"));

    fireEvent.click(ecouter());
    expect(mocks.stopPlaying).toHaveBeenLastCalledWith(7);
    expect(ecouter().getAttribute("aria-pressed")).toBe("false");
    expect(ecouter().getAttribute("data-listen-status")).toBe("idle");

    fireEvent.click(ecouter());
    await waitFor(() => expect(mocks.playUrl).toHaveBeenCalledTimes(2));
  });

  it("se tait dès que l'enfant a répondu", async () => {
    mocks.findClip.mockResolvedValue("https://clip/2.mp3");
    const { rerender } = render(<Session exerciseId="exercise2" />);
    await waitFor(() => expect(mocks.playUrl).toHaveBeenCalled());

    rerender(<Session exerciseId="exercise2" silenced />);
    expect(mocks.stopPlaying).toHaveBeenCalledWith(7);
  });

  it("ne parle pas d'elle-même sous une fenêtre déjà ouverte", async () => {
    mocks.findClip.mockResolvedValue("https://clip/3.mp3");
    render(<Session exerciseId="exercise3" silenced />);
    await act(async () => {});
    expect(mocks.findClip).not.toHaveBeenCalled();
  });

  it("passe en muet sans voix (un nom qui le dit, haut-parleur barré), et réessaie au toucher", async () => {
    mocks.findClip.mockResolvedValue("not_configured");
    render(<Session exerciseId="exercise4" />);

    await waitFor(() => expect(ecouter().getAttribute("data-listen-status")).toBe("unavailable"));
    expect(mocks.playUrl).not.toHaveBeenCalled();

    mocks.findClip.mockResolvedValue("https://clip/4.mp3");
    fireEvent.click(ecouter());
    await waitFor(() => expect(mocks.playUrl).toHaveBeenCalledWith("https://clip/4.mp3", 7, 1));
    expect(mocks.findClip).toHaveBeenCalledTimes(2);
  });

  it("sans réseau ni son dans le téléphone, passe en muet sans erreur", async () => {
    mocks.findClip.mockResolvedValue(null);
    render(<Session exerciseId="exercise5" />);
    await waitFor(() => expect(ecouter().getAttribute("data-listen-status")).toBe("unavailable"));
    expect(mocks.playUrl).not.toHaveBeenCalled();
  });

  it("hors d'une classe qui apprend à lire, la consigne s'affiche sans bouton et la barre est vide", () => {
    render(
      <>
        <ExercisePrompt prompt={PROMPT} />
        <ExerciseActions />
      </>,
    );
    expect(screen.getByText(PROMPT)).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("publie le lecteur actif hors de l'arbre, pour la coque de la séance, et le retire en partant", async () => {
    mocks.findClip.mockResolvedValue("https://clip/6.mp3");
    const outside = renderHook(() => useActivePromptReader());
    expect(outside.result.current).toBeNull();

    const session = render(<Session exerciseId="exercise6" />);
    await waitFor(() => expect(outside.result.current?.status).toBe("playing"));

    act(() => outside.result.current!.stop());
    expect(mocks.stopPlaying).toHaveBeenLastCalledWith(7);
    await waitFor(() => expect(outside.result.current?.status).toBe("idle"));

    session.unmount();
    expect(outside.result.current).toBeNull();
  });

  it("`clipUrl` (pages de développement) joue l'adresse donnée sans demander le son au serveur", async () => {
    mocks.findClip.mockResolvedValue("https://clip/jamais.mp3");
    render(
      <PromptReaderProvider exerciseId="specimen-sans-id" clipUrl="/sounds/badge.mp3">
        <ExerciseActions />
      </PromptReaderProvider>,
    );
    await waitFor(() => expect(mocks.playUrl).toHaveBeenCalledWith("/sounds/badge.mp3", 7, 1));
    expect(mocks.findClip).not.toHaveBeenCalled();
    expect(ecouter().getAttribute("aria-pressed")).toBe("true");
  });
});
