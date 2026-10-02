import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

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

import ExercisePrompt from "../ExercisePrompt";
import { PromptReaderProvider } from "../prompt-reader";

const PROMPT = "Fais correspondre les mots avec leur son.";

function Session({ exerciseId, silenced = false }: { exerciseId: string; silenced?: boolean }) {
  return (
    <PromptReaderProvider exerciseId={exerciseId} silenced={silenced}>
      <ExercisePrompt prompt={PROMPT} />
    </PromptReaderProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  // Un son qui joue jusqu'à ce qu'on le coupe.
  mocks.playUrl.mockImplementation(() => new Promise<boolean>(() => {}));
});

describe("le lecteur de consignes", () => {
  it("dit la consigne toute seule quand l'exercice apparaît", async () => {
    mocks.findClip.mockResolvedValue("https://clip/1.mp3");
    render(<Session exerciseId="exercise1" />);

    await waitFor(() => expect(mocks.playUrl).toHaveBeenCalledWith("https://clip/1.mp3", 7, 1));
    expect(mocks.findClip).toHaveBeenCalledWith({ kind: "prompt", exerciseId: "exercise1" });
    expect(screen.getByRole("button", { name: "Écouter la consigne" })).toBeTruthy();
    expect(screen.getByText(PROMPT)).toBeTruthy();
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

  it("passe en gris sans voix, et réessaie au toucher", async () => {
    mocks.findClip.mockResolvedValue("not_configured");
    render(<Session exerciseId="exercise4" />);

    const retry = await screen.findByRole("button", { name: "Réessayer d'écouter la consigne" });
    expect(mocks.playUrl).not.toHaveBeenCalled();

    mocks.findClip.mockResolvedValue("https://clip/4.mp3");
    fireEvent.click(retry);
    await waitFor(() => expect(mocks.playUrl).toHaveBeenCalledWith("https://clip/4.mp3", 7, 1));
    expect(mocks.findClip).toHaveBeenCalledTimes(2);
  });

  it("sans réseau ni son dans le téléphone, passe en gris sans erreur", async () => {
    mocks.findClip.mockResolvedValue(null);
    render(<Session exerciseId="exercise5" />);
    expect(await screen.findByRole("button", { name: "Réessayer d'écouter la consigne" })).toBeTruthy();
    expect(mocks.playUrl).not.toHaveBeenCalled();
  });

  it("hors d'une classe qui apprend à lire, la consigne s'affiche sans bouton", () => {
    render(<ExercisePrompt prompt={PROMPT} />);
    expect(screen.getByText(PROMPT)).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });
});
