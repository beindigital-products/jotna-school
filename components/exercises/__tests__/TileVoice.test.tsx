import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";

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

/** Un son lancé par le lecteur, que le test termine quand il veut (`ok: false` : on l'a coupé). */
type Play = { url: string; finish: (ok?: boolean) => void };
const plays: Play[] = [];

/**
 * Les tuiles changent à chaque test : le lecteur garde l'URL de chaque tuile PAR
 * SON TEXTE pour la durée de la page (`urlByTile`), un texte repris d'un test à
 * l'autre ne redemanderait rien.
 */
const options = (tag: string) => [`le chat ${tag}`, `le chien ${tag}`, `la girafe ${tag}`];

function Screen({
  tag,
  exerciseId = `ex-${tag}`,
  prompt = "Ta grand-mère te parle. Que fais-tu ?",
  silenced = false,
  tileVoice = true,
  clipUrl,
}: {
  tag: string;
  exerciseId?: string;
  prompt?: string;
  silenced?: boolean;
  tileVoice?: boolean;
  clipUrl?: string;
}) {
  return (
    <PromptReaderProvider exerciseId={exerciseId} silenced={silenced} tileVoice={tileVoice} clipUrl={clipUrl}>
      <QcmExercise
        prompt={prompt}
        payload={{ options: options(tag), correctIndex: 0 }}
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
  mocks.playUrl.mockImplementation(
    (url: string) =>
      new Promise<boolean>((resolve) => {
        plays.push({ url, finish: (ok = true) => resolve(ok) });
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

/** Laisse passer `ms` millisecondes et tout ce que les promesses en attente ont à faire. */
async function flush(ms = 0) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

const optionButton = (index: number) => document.querySelector(`[data-option="${index}"]`) as HTMLElement;
/** Les rangs des tuiles qui portent l'anneau de la voix. */
const ringed = () =>
  [0, 1, 2].filter((index) => optionButton(index)?.querySelector("[data-tile-speaking]") !== null);
const urls = () => plays.map((play) => play.url);
const ecouter = () => screen.getByRole("button", { name: /^Écouter l'énoncé/ });
const tileRequests = () =>
  mocks.findClip.mock.calls.map(([request]) => request).filter((request) => request.kind === "tile");

describe("la voix des tuiles : les propositions se disent après la consigne", () => {
  it("dit la consigne, puis chaque proposition dans l'ordre de l'écran, et allume celle qui parle", async () => {
    render(<Screen tag="a" />);
    await flush();
    expect(urls()).toEqual(["prompt://ex-a"]);
    expect(ringed()).toEqual([]);

    // La consigne finit : un silence, puis la première proposition.
    plays[0].finish();
    await flush(449);
    expect(urls()).toEqual(["prompt://ex-a"]);
    await flush(1);
    expect(urls()).toEqual(["prompt://ex-a", "tile://le chat a"]);
    expect(ringed()).toEqual([0]);
    expect(optionButton(0).getAttribute("data-speaking")).toBe("true");

    plays[1].finish();
    await flush(300);
    expect(urls().at(-1)).toBe("tile://le chien a");
    expect(ringed()).toEqual([1]);

    plays[2].finish();
    await flush(300);
    expect(urls().at(-1)).toBe("tile://la girafe a");
    expect(ringed()).toEqual([2]);

    // La dernière finie : plus d'anneau, le bouton se repose.
    plays[3].finish();
    await flush();
    expect(ringed()).toEqual([]);
    expect(ecouter().getAttribute("aria-pressed")).toBe("false");
    expect(urls()).toHaveLength(4);
  });

  it("si une autre voix coupe la consigne, la file ne parle pas par-dessus", async () => {
    render(<Screen tag="a2" />);
    await flush();
    // La consigne est coupée sans que le lecteur l'ait demandé (une autre voix prend la place).
    plays[0].finish(false);
    await flush(3000);
    expect(urls()).toEqual(["prompt://ex-a2"]);
    expect(ringed()).toEqual([]);
    expect(ecouter().getAttribute("aria-pressed")).toBe("false");
  });

  it("demande chaque tuile au serveur avec son exercice et son texte, une seule fois", async () => {
    render(<Screen tag="b" />);
    await flush();
    expect(tileRequests()).toEqual(
      options("b").map((text) => ({ kind: "tile", exerciseId: "ex-b", text })),
    );
    // La consigne part la première dans la file des demandes.
    expect(mocks.findClip.mock.calls[0][0]).toEqual({ kind: "prompt", exerciseId: "ex-b" });
  });

  it("fait venir dans l'écran la tuile qui parle (elle peut être sous le dock), du minimum", async () => {
    const scrollIntoView = vi.fn();
    const original = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = scrollIntoView;
    try {
      render(<Screen tag="s" />);
      await flush();
      expect(scrollIntoView).not.toHaveBeenCalled();
      plays[0].finish();
      await flush(450);
      expect(ringed()).toEqual([0]);
      expect(scrollIntoView).toHaveBeenCalledTimes(1);
      expect(scrollIntoView.mock.instances[0]).toBe(optionButton(0));
      expect(scrollIntoView).toHaveBeenCalledWith({ block: "nearest", inline: "nearest" });

      plays[1].finish();
      await flush(300);
      expect(scrollIntoView).toHaveBeenCalledTimes(2);
      expect(scrollIntoView.mock.instances[1]).toBe(optionButton(1));
    } finally {
      Element.prototype.scrollIntoView = original;
    }
  });

  it("le halo derrière l'énoncé brille pour la consigne, pas pour une proposition", async () => {
    const { container } = render(<Screen tag="c" />);
    await flush();
    const halo = () => container.querySelector("[data-prompt-reading]")?.getAttribute("data-prompt-reading");
    expect(halo()).toBe("1");
    plays[0].finish();
    await flush(450);
    expect(ringed()).toEqual([0]);
    expect(halo()).toBe("0");
  });

  it("ne demande rien et n'allume rien pour une tuile sans voix (émojis, lettre seule)", async () => {
    const apples = String.fromCodePoint(0x1f34e).repeat(2);
    render(
      <PromptReaderProvider exerciseId="ex-v" tileVoice>
        <QcmExercise
          prompt="Combien de pommes ?"
          payload={{ options: [apples, "5", "m"], correctIndex: 1 }}
          onSubmit={() => {}}
          disabled={false}
          isCorrect={null}
        />
      </PromptReaderProvider>,
    );
    await flush();
    plays[0].finish();
    await flush(450);
    // Seul « 5 » se dit : les pommes et la lettre seule n'entrent pas dans la file.
    expect(urls()).toEqual(["prompt://ex-v", "tile://5"]);
    expect(ringed()).toEqual([1]);
    expect(tileRequests().map((request) => request.text)).toEqual(["5"]);

    plays[1].finish();
    await flush(2000);
    expect(urls()).toHaveLength(2);

    // Un toucher sur une tuile sans voix ne coupe rien et n'allume rien.
    fireEvent.click(optionButton(2));
    await flush();
    expect(ringed()).toEqual([]);
    expect(urls()).toHaveLength(2);
    expect(optionButton(2).getAttribute("aria-pressed")).toBe("true");
    expect(tileRequests().map((request) => request.text)).toEqual(["5"]);
  });

  it("passe en silence une tuile sans son et dit les autres", async () => {
    mocks.findClip.mockImplementation(async (request: { kind: string; text?: string; exerciseId?: string }) => {
      if (request.kind === "prompt") return `prompt://${request.exerciseId}`;
      return request.text === "le chien d" ? null : `tile://${request.text}`;
    });
    render(<Screen tag="d" />);
    await flush();
    plays[0].finish();
    await flush(450);
    plays[1].finish();
    await flush(300);
    // « le chien d » n'a pas de son : la file saute à la suivante.
    await flush(300);
    expect(urls()).toEqual(["prompt://ex-d", "tile://le chat d", "tile://la girafe d"]);
    expect(ringed()).toEqual([2]);
  });

  it("deux exercices qui proposent le même mot ne demandent son son qu'une fois", async () => {
    const first = render(<Screen tag="e" exerciseId="ex-e1" />);
    await flush();
    expect(tileRequests()).toHaveLength(3);
    first.unmount();

    render(<Screen tag="e" exerciseId="ex-e2" />);
    await flush();
    expect(tileRequests()).toHaveLength(3);
    // Le mot est déjà là : il se dit quand même dans le deuxième exercice.
    plays.at(-1)?.finish();
    await flush(450);
    expect(urls().at(-1)).toBe("tile://le chat e");
  });

  it("sur une page de développement, toutes les tuiles jouent le son donné", async () => {
    render(<Screen tag="f" clipUrl="/sounds/test.mp3" />);
    await flush();
    expect(mocks.findClip).not.toHaveBeenCalled();
    plays[0].finish();
    await flush(450);
    expect(urls()).toEqual(["/sounds/test.mp3", "/sounds/test.mp3"]);
    expect(ringed()).toEqual([0]);
  });
});

describe("la voix des tuiles : un toucher choisit ET dit", () => {
  it("dit la tuile touchée, la choisit, et coupe la file qui parlait", async () => {
    render(<Screen tag="g" />);
    await flush();
    // La consigne parle : l'enfant n'attend pas, il touche la troisième tuile.
    fireEvent.click(optionButton(2));
    expect(mocks.stopPlaying).toHaveBeenCalled();
    // L'anneau s'allume tout de suite, avant même que le son soit là.
    expect(ringed()).toEqual([2]);
    expect(optionButton(2).getAttribute("aria-pressed")).toBe("true");
    await flush();
    expect(urls().at(-1)).toBe("tile://la girafe g");

    // La consigne coupée rend la main : la file ne repart pas derrière.
    plays[0].finish(false);
    await flush(2000);
    expect(urls()).toEqual(["prompt://ex-g", "tile://la girafe g"]);
  });

  it("redit la tuile à un second toucher, sans redemander son son", async () => {
    render(<Screen tag="h" />);
    await flush();
    plays[0].finish();
    await flush(5000);
    // La file est finie (tous les sons ont été lancés, le test les termine).
    for (const play of [...plays]) play.finish();
    await flush(2000);
    const before = urls().length;

    fireEvent.click(optionButton(1));
    await flush();
    expect(urls().length).toBe(before + 1);
    expect(urls().at(-1)).toBe("tile://le chien h");
    plays.at(-1)?.finish();
    await flush();
    expect(ringed()).toEqual([]);

    fireEvent.click(optionButton(1));
    await flush();
    expect(urls().length).toBe(before + 2);
    expect(urls().at(-1)).toBe("tile://le chien h");
    expect(optionButton(1).getAttribute("aria-pressed")).toBe("true");
    expect(tileRequests().filter((request) => request.text === "le chien h")).toHaveLength(1);
  });

  it("une tuile sans son reste au repos, sans bruit, et se choisit quand même", async () => {
    mocks.findClip.mockImplementation(async (request: { kind: string; text?: string; exerciseId?: string }) =>
      request.kind === "prompt" ? `prompt://${request.exerciseId}` : null,
    );
    render(<Screen tag="i" />);
    await flush();
    plays[0].finish();
    await flush(3000);
    expect(urls()).toEqual(["prompt://ex-i"]);

    fireEvent.click(optionButton(0));
    await flush();
    expect(ringed()).toEqual([]);
    expect(optionButton(0).getAttribute("aria-pressed")).toBe("true");
    expect(urls()).toEqual(["prompt://ex-i"]);
  });

  it("« Écouter » relit tout depuis la consigne, il n'arrête pas un mot dit au toucher", async () => {
    render(<Screen tag="j" />);
    await flush();
    plays[0].finish();
    await flush(5000);
    for (const play of [...plays]) play.finish();
    await flush(2000);

    fireEvent.click(optionButton(1));
    await flush();
    expect(urls().at(-1)).toBe("tile://le chien j");
    const stopsBefore = mocks.stopPlaying.mock.calls.filter(([owner]) => owner === 7).length;

    fireEvent.click(ecouter());
    await flush();
    expect(urls().at(-1)).toBe("prompt://ex-j");
    expect(mocks.stopPlaying.mock.calls.filter(([owner]) => owner === 7)).toHaveLength(stopsBefore);
    expect(ringed()).toEqual([]);
  });

  it("« Écouter » arrête la consigne et la file quand elles parlent", async () => {
    render(<Screen tag="k" />);
    await flush();
    plays[0].finish();
    await flush(450);
    expect(ringed()).toEqual([0]);

    fireEvent.click(ecouter());
    expect(mocks.stopPlaying).toHaveBeenLastCalledWith(7);
    expect(ringed()).toEqual([]);
    // Le son coupé rend la main : la file ne reprend pas la parole.
    plays[1].finish(false);
    await flush(3000);
    expect(urls()).toHaveLength(2);
  });

  it("se tait dès que l'enfant a répondu, même au milieu des propositions", async () => {
    const { rerender } = render(<Screen tag="l" />);
    await flush();
    plays[0].finish();
    await flush(450);
    expect(ringed()).toEqual([0]);

    rerender(<Screen tag="l" silenced />);
    expect(mocks.stopPlaying).toHaveBeenCalledWith(7);
    plays[1].finish(false);
    await flush(3000);
    expect(urls()).toHaveLength(2);
    expect(ringed()).toEqual([]);
  });
});

describe("la voix des tuiles : quand elle reste éteinte, rien ne change", () => {
  it("sans `tileVoice` (autre classe, anglais) : la consigne seule, aucun anneau, aucune demande de tuile", async () => {
    render(<Screen tag="m" tileVoice={false} />);
    await flush();
    plays[0].finish();
    await flush(5000);
    expect(urls()).toEqual(["prompt://ex-m"]);

    fireEvent.click(optionButton(0));
    await flush();
    expect(urls()).toEqual(["prompt://ex-m"]);
    expect(ringed()).toEqual([]);
    expect(tileRequests()).toEqual([]);
    expect(optionButton(0).getAttribute("aria-pressed")).toBe("true");
  });

  it("quand l'énoncé demande de lire ou de décoder, la tuile dite serait la réponse : on ne la dit pas", async () => {
    for (const [tag, prompt] of [
      ["n", "Lis le mot et choisis la bonne image."],
      ["o", "Quel mot commence par la syllabe « cha » ?"],
      ["p", "Comment dit-on « chat » en anglais ?"],
    ]) {
      const view = render(<Screen tag={tag} prompt={prompt} />);
      await flush();
      plays[0]?.finish();
      await flush(5000);
      fireEvent.click(optionButton(0));
      await flush();
      expect(tileRequests()).toEqual([]);
      expect(ringed()).toEqual([]);
      expect(urls().filter((url) => url.startsWith("tile://"))).toEqual([]);
      view.unmount();
      plays.length = 0;
      mocks.findClip.mockClear();
    }
  });
});
