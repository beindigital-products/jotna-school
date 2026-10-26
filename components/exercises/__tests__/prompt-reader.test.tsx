import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  findClip: vi.fn(),
  playUrl: vi.fn(),
  stopPlaying: vi.fn(),
  // Une autre source de sons à servir à la place de `findClip` (identité changée).
  source: { fn: null as null | ((request: unknown) => Promise<unknown>) },
}));

// La source des sons : le sac du téléphone d'abord, le serveur ensuite
// (`components/offline/clip-source.ts`). Ici, une seule fonction simulée.
vi.mock("@/components/offline/clip-source", () => ({
  useClipSource: () => mocks.source.fn ?? mocks.findClip,
}));
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
  mocks.source.fn = null;
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

    await waitFor(() => expect(mocks.playUrl).toHaveBeenCalledWith("https://clip/1.mp3", 7, 1, expect.any(Function)));
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
    await waitFor(() => expect(mocks.playUrl).toHaveBeenCalledWith("https://clip/4.mp3", 7, 1, expect.any(Function)));
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
    await waitFor(() => expect(mocks.playUrl).toHaveBeenCalledWith("/sounds/badge.mp3", 7, 1, expect.any(Function)));
    expect(mocks.findClip).not.toHaveBeenCalled();
    expect(ecouter().getAttribute("aria-pressed")).toBe("true");
  });

  it("ne coupe pas la voix quand la source des sons change pendant qu'elle parle", async () => {
    // Dans l'application, `connected` bascule à l'ouverture de la connexion
    // temps réel : `useClipSource` rend alors une nouvelle fonction.
    mocks.findClip.mockResolvedValue("https://clip/7.mp3");
    const { rerender } = render(<Session exerciseId="exercise7" />);
    await waitFor(() => expect(mocks.playUrl).toHaveBeenCalledTimes(1));

    mocks.source.fn = vi.fn(() => Promise.resolve("https://clip/7bis.mp3"));
    rerender(<Session exerciseId="exercise7" />);
    await act(async () => {});

    expect(mocks.playUrl).toHaveBeenCalledTimes(1);
    expect(mocks.stopPlaying).not.toHaveBeenCalledWith(7);
    expect(ecouter().getAttribute("aria-pressed")).toBe("true");
  });

  it("réessaie d'elle-même quand la source change et que la consigne n'était pas partie", async () => {
    mocks.findClip.mockResolvedValue(null);
    const { rerender } = render(<Session exerciseId="exercise8" />);
    await waitFor(() => expect(ecouter().getAttribute("data-listen-status")).toBe("unavailable"));
    expect(mocks.playUrl).not.toHaveBeenCalled();

    // Le réseau revient : la source des sons change, la consigne se dit.
    mocks.source.fn = vi.fn(() => Promise.resolve("https://clip/8.mp3"));
    rerender(<Session exerciseId="exercise8" />);
    await waitFor(() => expect(mocks.playUrl).toHaveBeenCalledWith("https://clip/8.mp3", 7, 1, expect.any(Function)));
  });
  describe("un son trouvé mais qui ne se joue pas", () => {
    /** Le premier appel échoue (`onFail`), les suivants jouent sans fin. */
    const failFirst = () => {
      let calls = 0;
      mocks.playUrl.mockImplementation((_url: string, _owner: number, _rate: number, onFail?: () => void) => {
        calls++;
        if (calls === 1) {
          onFail?.();
          return Promise.resolve(false);
        }
        return new Promise<boolean>(() => {});
      });
    };

    it("oublie l'adresse morte, redemande un son neuf (sans le sac du téléphone) et rejoue", async () => {
      failFirst();
      mocks.findClip.mockImplementation((_request: unknown, options?: { fresh?: boolean }) =>
        Promise.resolve(options?.fresh ? "https://clip/neuf.mp3" : "https://clip/mort.mp3"),
      );
      render(<Session exerciseId="exercise-mort" />);

      await waitFor(() =>
        expect(mocks.playUrl).toHaveBeenLastCalledWith("https://clip/neuf.mp3", 7, 1, expect.any(Function)),
      );
      expect(mocks.findClip).toHaveBeenLastCalledWith(
        { kind: "prompt", exerciseId: "exercise-mort" },
        { fresh: true },
      );
      expect(ecouter().getAttribute("aria-pressed")).toBe("true");
    });

    it("si le son neuf échoue aussi, le bouton passe en muet et un toucher réessaie", async () => {
      mocks.playUrl.mockImplementation((_url: string, _owner: number, _rate: number, onFail?: () => void) => {
        onFail?.();
        return Promise.resolve(false);
      });
      mocks.findClip.mockResolvedValue("https://clip/mort2.mp3");
      render(<Session exerciseId="exercise-mort2" />);

      await waitFor(() => expect(ecouter().getAttribute("data-listen-status")).toBe("unavailable"));
      // Une lecture, puis UN seul nouvel essai : pas de boucle.
      expect(mocks.playUrl).toHaveBeenCalledTimes(2);

      mocks.playUrl.mockImplementation(() => new Promise<boolean>(() => {}));
      fireEvent.click(ecouter());
      await waitFor(() => expect(ecouter().getAttribute("aria-pressed")).toBe("true"));
    });

    it("une coupure voulue n'est pas un échec : pas de nouvelle demande, retour au repos", async () => {
      mocks.playUrl.mockResolvedValue(false);
      mocks.findClip.mockResolvedValue("https://clip/coupe.mp3");
      render(<Session exerciseId="exercise-coupe" />);

      await waitFor(() => expect(ecouter().getAttribute("data-listen-status")).toBe("idle"));
      expect(mocks.playUrl).toHaveBeenCalledTimes(1);
      expect(mocks.findClip).toHaveBeenCalledTimes(1);
    });
  });
});
