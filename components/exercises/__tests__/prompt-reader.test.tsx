import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { Id } from "@/convex/_generated/dataModel";

const mocks = vi.hoisted(() => ({
  speak: vi.fn(),
  playUrl: vi.fn(),
  stopPlaying: vi.fn(),
}));

vi.mock("convex/react", () => ({ useAction: () => mocks.speak }));
vi.mock("@/lib/voice-player", () => ({
  newVoiceOwner: () => 7,
  playUrl: mocks.playUrl,
  stopPlaying: mocks.stopPlaying,
}));

import ExercisePrompt from "../ExercisePrompt";
import { PromptReaderProvider } from "../prompt-reader";

const PROMPT = "Fais correspondre les mots avec leur son.";
const attempt = "palierAttempt1" as Id<"palierAttempts">;

function Session({ exerciseId, silenced = false }: { exerciseId: string; silenced?: boolean }) {
  return (
    <PromptReaderProvider
      exerciseId={exerciseId as Id<"exercises">}
      palierAttemptId={attempt}
      silenced={silenced}
    >
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
    mocks.speak.mockResolvedValue({ status: "ready", url: "https://clip/1.mp3", cached: true });
    render(<Session exerciseId="exercise1" />);

    await waitFor(() => expect(mocks.playUrl).toHaveBeenCalledWith("https://clip/1.mp3", 7, 1));
    expect(mocks.speak).toHaveBeenCalledWith({ exerciseId: "exercise1", palierAttemptId: attempt });
    expect(screen.getByRole("button", { name: "Écouter la consigne" })).toBeTruthy();
    expect(screen.getByText(PROMPT)).toBeTruthy();
  });

  it("se tait dès que l'enfant a répondu", async () => {
    mocks.speak.mockResolvedValue({ status: "ready", url: "https://clip/2.mp3", cached: true });
    const { rerender } = render(<Session exerciseId="exercise2" />);
    await waitFor(() => expect(mocks.playUrl).toHaveBeenCalled());

    rerender(<Session exerciseId="exercise2" silenced />);
    expect(mocks.stopPlaying).toHaveBeenCalledWith(7);
  });

  it("ne parle pas d'elle-même sous une fenêtre déjà ouverte", async () => {
    mocks.speak.mockResolvedValue({ status: "ready", url: "https://clip/3.mp3", cached: true });
    render(<Session exerciseId="exercise3" silenced />);
    await act(async () => {});
    expect(mocks.speak).not.toHaveBeenCalled();
  });

  it("passe en gris sans voix, et réessaie au toucher", async () => {
    mocks.speak.mockResolvedValue({ status: "unavailable", reason: "not_configured" });
    render(<Session exerciseId="exercise4" />);

    const retry = await screen.findByRole("button", { name: "Réessayer d'écouter la consigne" });
    expect(mocks.playUrl).not.toHaveBeenCalled();

    mocks.speak.mockResolvedValue({ status: "ready", url: "https://clip/4.mp3", cached: false });
    fireEvent.click(retry);
    await waitFor(() => expect(mocks.playUrl).toHaveBeenCalledWith("https://clip/4.mp3", 7, 1));
    expect(mocks.speak).toHaveBeenCalledTimes(2);
  });

  it("hors d'une classe qui apprend à lire, la consigne s'affiche sans bouton", () => {
    render(<ExercisePrompt prompt={PROMPT} />);
    expect(screen.getByText(PROMPT)).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });
});
