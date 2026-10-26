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

import DragDropExercise from "../DragDropExercise";
import FillBlankExercise from "../FillBlankExercise";
import MatchExercise from "../MatchExercise";
import OrderExercise from "../OrderExercise";
import { PromptReaderProvider } from "../prompt-reader";

/**
 * LA VOIX DES TUILES SUR LES AUTRES ÉCRANS (le QCM est dans `TileVoice.test.tsx`) :
 * association, mise en ordre, glisser-déposer et phrase à trous. Même doubles que
 * lui : le serveur de sons et le lecteur audio sont simulés, le test termine chaque
 * son quand il veut. Les textes changent à chaque test (le lecteur garde l'URL de
 * chaque tuile par son texte pour la durée de la page).
 */
type Play = { url: string; finish: (ok?: boolean) => void };
const plays: Play[] = [];

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  plays.length = 0;
  finished.clear();
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

async function flush(ms = 0) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

const urls = () => plays.map((play) => play.url);
const tileUrls = () => urls().filter((url) => url.startsWith("tile://"));

function inSession(exerciseId: string, screenNode: React.ReactNode, tileVoice = true) {
  return (
    <PromptReaderProvider exerciseId={exerciseId} tileVoice={tileVoice}>
      {screenNode}
    </PromptReaderProvider>
  );
}

/** Termine chaque son de la file l'un après l'autre, jusqu'à ce qu'elle se taise. */
async function playQueueToTheEnd() {
  for (let guard = 0; guard < 30; guard++) {
    await flush(1000);
    const playing = plays.filter((play) => !finished.has(play));
    if (playing.length === 0) return;
    for (const play of playing) {
      finished.add(play);
      play.finish();
    }
  }
}
const finished = new Set<Play>();

describe("l'association : la file lit les mots, et toucher un mot le redit", () => {
  const payload = (tag: string) => ({
    left: [`la vache ${tag}`, `la poule ${tag}`],
    right: [`le lait ${tag}`, `l'œuf ${tag}`],
  });
  const tile = (side: "left" | "right", index: number) =>
    document.querySelectorAll(`[data-side="${side}"]`)[index] as HTMLElement;

  function renderMatch(tag: string) {
    return render(
      inSession(
        `ex-${tag}`,
        <MatchExercise
          prompt="Associe chaque animal à ce qu'il donne."
          payload={payload(tag)}
          onSubmit={() => {}}
          disabled={false}
          isCorrect={null}
        />,
      ),
    );
  }

  it("lit la consigne, puis chaque mot des deux colonnes, dans l'ordre de l'écran", async () => {
    renderMatch("m1");
    await playQueueToTheEnd();
    expect(urls()).toEqual([
      "prompt://ex-m1",
      "tile://la vache m1",
      "tile://la poule m1",
      "tile://le lait m1",
      "tile://l'œuf m1",
    ]);
  });

  it("dit chaque mot touché, allume sa tuile, et la relie quand même", async () => {
    renderMatch("m2");
    await flush();
    plays[0].finish(false); // un toucher a coupé la file : ce test ne regarde que le toucher
    await flush(500);

    fireEvent.click(tile("left", 0));
    await flush();
    expect(tileUrls()).toEqual(["tile://la vache m2"]);
    expect(tile("left", 0).getAttribute("data-speaking")).toBe("true");
    expect(tile("right", 1).getAttribute("data-speaking")).toBeNull();
    plays.at(-1)?.finish();
    await flush();

    // La colonne de droite : le rang d'une tuile de droite suit celui de la gauche.
    fireEvent.click(tile("right", 1));
    await flush();
    expect(tileUrls()).toEqual(["tile://la vache m2", "tile://l'œuf m2"]);
    expect(tile("right", 1).getAttribute("data-speaking")).toBe("true");
    expect(tile("left", 0).getAttribute("data-speaking")).toBeNull();
    // Le lien se fait comme avant.
    expect(tile("left", 0).getAttribute("data-linked")).toBe("true");
    expect(tile("right", 1).getAttribute("data-linked")).toBe("true");
  });

  it("sans voix des tuiles, un toucher ne dit rien", async () => {
    render(
      inSession(
        "ex-m3",
        <MatchExercise
          prompt="Associe chaque animal à ce qu'il donne."
          payload={payload("m3")}
          onSubmit={() => {}}
          disabled={false}
          isCorrect={null}
        />,
        false,
      ),
    );
    await flush();
    plays[0].finish();
    fireEvent.click(tile("left", 0));
    await flush(500);
    expect(tileUrls()).toEqual([]);
    expect(tile("left", 0).getAttribute("data-speaking")).toBeNull();
  });
});

describe("la mise en ordre : la file lit les étiquettes, et toucher une étiquette la redit", () => {
  const payload = (tag: string) => ({ correctSequence: [`le matin ${tag}`, `le midi ${tag}`, `le soir ${tag}`] });

  function renderOrder(tag: string) {
    return render(
      inSession(
        `ex-${tag}`,
        <OrderExercise
          prompt="Remets la journée dans l'ordre."
          payload={payload(tag)}
          onSubmit={() => {}}
          disabled={false}
          isCorrect={null}
        />,
      ),
    );
  }

  it("lit la consigne, puis chaque étiquette à ranger", async () => {
    renderOrder("o0");
    await playQueueToTheEnd();
    expect(urls()[0]).toBe("prompt://ex-o0");
    expect(tileUrls().sort()).toEqual(["tile://le matin o0", "tile://le midi o0", "tile://le soir o0"]);
  });

  it("dit l'étiquette touchée et allume sa tuile, où qu'elle soit rangée", async () => {
    renderOrder("o1");
    await flush();
    plays[0].finish(false); // un toucher a coupé la file : ce test ne regarde que le toucher
    await flush(5000);
    expect(urls()).toEqual(["prompt://ex-o1"]);

    fireEvent.click(screen.getByText("le midi o1"));
    await flush();
    expect(tileUrls()).toEqual(["tile://le midi o1"]);
    const marche = screen.getByText("le midi o1").closest("li") as HTMLElement;
    expect(marche.querySelector("[data-tile-speaking]")).not.toBeNull();
    expect(document.querySelectorAll("[data-tile-speaking]")).toHaveLength(1);
  });

  it("un toucher sur la poignée ne dit rien : saisir l'étiquette la dit (début du glissé)", async () => {
    renderOrder("o2");
    await flush();
    plays[0].finish(false); // un toucher a coupé la file : ce test ne regarde que le toucher
    await flush(500);
    fireEvent.click(screen.getByLabelText("Déplacer « le soir o2 »"));
    await flush();
    expect(tileUrls()).toEqual([]);
  });

  it("saisir une étiquette par sa poignée la dit, et son anneau la suit", async () => {
    renderOrder("o3");
    await flush();
    plays[0].finish(false); // un toucher a coupé la file : ce test ne regarde que le toucher
    await flush(500);

    const poignee = screen.getByLabelText("Déplacer « le soir o3 »");
    act(() => {
      fireEvent.pointerDown(poignee, { isPrimary: true, button: 0, pointerId: 1, clientX: 5, clientY: 5 });
    });
    try {
      await flush();
      expect(tileUrls()).toEqual(["tile://le soir o3"]);
      const marche = screen.getByText("le soir o3").closest("li") as HTMLElement;
      expect(marche.querySelector("[data-tile-speaking]")).not.toBeNull();
    } finally {
      // Le doigt se lève ; dnd-kit garde ses écouteurs 50 ms de plus (voir DragDropPictures.test).
      act(() => {
        fireEvent.pointerUp(document, { isPrimary: true, pointerId: 1, clientX: 5, clientY: 5 });
      });
      await flush(80);
    }
  });
});

describe("le glisser-déposer : la file lit étiquettes et cases, et un toucher les redit", () => {
  const payload = (tag: string) => ({
    zones: [`la ferme ${tag}`, `la forêt ${tag}`],
    items: [{ text: `la vache ${tag}` }, { text: `le lion ${tag}` }],
  });
  const draggable = (text: string): HTMLElement => {
    const found = Array.from(document.querySelectorAll<HTMLElement>('[aria-roledescription="draggable"]')).find(
      (el) => el.textContent?.trim() === text,
    );
    if (!found) throw new Error(`étiquette « ${text} » introuvable`);
    return found;
  };
  const zone = (label: string) => screen.getByRole("heading", { name: label }).parentElement as HTMLElement;

  function renderDrag(tag: string) {
    return render(
      inSession(
        `ex-${tag}`,
        <DragDropExercise
          prompt="Range chaque animal chez lui."
          payload={payload(tag)}
          onSubmit={() => {}}
          disabled={false}
          isCorrect={null}
        />,
      ),
    );
  }

  it("lit la consigne, puis chaque étiquette et chaque case", async () => {
    renderDrag("d0");
    await playQueueToTheEnd();
    expect(urls()[0]).toBe("prompt://ex-d0");
    expect(tileUrls().sort()).toEqual(
      ["tile://la ferme d0", "tile://la forêt d0", "tile://la vache d0", "tile://le lion d0"].sort(),
    );
  });

  it("dit l'étiquette qu'on choisit, puis la pose dans la case sans rien redire", async () => {
    renderDrag("d1");
    await flush();
    plays[0].finish(false); // un toucher a coupé la file : ce test ne regarde que le toucher
    await flush(5000);
    expect(urls()).toEqual(["prompt://ex-d1"]);

    fireEvent.click(draggable("la vache d1"));
    await flush();
    expect(tileUrls()).toEqual(["tile://la vache d1"]);
    expect(draggable("la vache d1").querySelector("[data-tile-speaking]")).not.toBeNull();
    plays.at(-1)?.finish();
    await flush();

    // La case touchée avec une étiquette en main : elle l'y pose, c'est tout.
    fireEvent.click(zone("la ferme d1"));
    await flush();
    expect(zone("la ferme d1").textContent).toContain("la vache d1");
    expect(tileUrls()).toEqual(["tile://la vache d1"]);
  });

  it("dit le nom d'une case touchée quand aucune étiquette n'est en main, et allume sa plaque", async () => {
    renderDrag("d2");
    await flush();
    plays[0].finish(false); // un toucher a coupé la file : ce test ne regarde que le toucher
    await flush(500);

    fireEvent.click(zone("la forêt d2"));
    await flush();
    expect(tileUrls()).toEqual(["tile://la forêt d2"]);
    expect(zone("la forêt d2").getAttribute("data-speaking")).toBe("true");
    expect(zone("la ferme d2").getAttribute("data-speaking")).toBeNull();
  });

  it("saisir une étiquette au doigt la dit, et l'étiquette en l'air porte l'anneau", async () => {
    renderDrag("d4");
    await flush();
    plays[0].finish(false); // un toucher a coupé la file : ce test ne regarde que le toucher
    await flush(500);

    const lion = draggable("le lion d4");
    act(() => {
      fireEvent.pointerDown(lion, { isPrimary: true, button: 0, pointerId: 1, clientX: 20, clientY: 20 });
    });
    try {
      // Le doigt dépasse les 8 px du capteur : le glissé part.
      act(() => {
        fireEvent.pointerMove(document, { isPrimary: true, pointerId: 1, clientX: 40, clientY: 50 });
      });
      await flush();
      expect(tileUrls()).toEqual(["tile://le lion d4"]);
      const enLair = document.querySelector('[data-elevation="saisie"]') as HTMLElement;
      expect(enLair.querySelector("[data-tile-speaking]") ?? enLair.hasAttribute("data-speaking")).toBeTruthy();
    } finally {
      act(() => {
        fireEvent.pointerUp(document, { isPrimary: true, pointerId: 1, clientX: 40, clientY: 50 });
      });
      await flush(80);
    }
  });

  it("redit l'étiquette à chaque toucher, même pour la relâcher", async () => {
    renderDrag("d3");
    await flush();
    plays[0].finish(false); // un toucher a coupé la file : ce test ne regarde que le toucher
    await flush(500);
    fireEvent.click(draggable("le lion d3"));
    await flush();
    plays.at(-1)?.finish();
    await flush();
    fireEvent.click(draggable("le lion d3"));
    await flush();
    expect(tileUrls()).toEqual(["tile://le lion d3", "tile://le lion d3"]);
    expect(draggable("le lion d3").getAttribute("aria-pressed")).toBe("false");
  });
});

describe("la phrase à trous : la phrase, puis les mots, et un toucher les redit", () => {
  const payload = (tag: string) => ({
    text: `Le ___ miaule ${tag}.`,
    blanks: [{ options: [`chat ${tag}`, `chien ${tag}`] }],
  });

  function renderFill(tag: string) {
    return render(
      inSession(
        `ex-${tag}`,
        <FillBlankExercise
          prompt="Complète la phrase."
          payload={payload(tag)}
          onSubmit={() => {}}
          disabled={false}
          isCorrect={null}
        />,
      ),
    );
  }

  it("dit la consigne, la phrase (son trou est une pause), puis chaque mot proposé", async () => {
    const { container } = renderFill("f1");
    await flush();
    expect(urls()).toEqual(["prompt://ex-f1"]);
    plays[0].finish();
    await flush(450);
    expect(urls().at(-1)).toBe("tile://Le ___ miaule f1.");
    expect(container.querySelector("[data-sentence-speaking]")).not.toBeNull();

    plays.at(-1)?.finish();
    await flush(300);
    expect(urls().at(-1)).toBe("tile://chat f1");
    expect(container.querySelector("[data-sentence-speaking]")).toBeNull();
    expect(screen.getByRole("button", { name: "chat f1" }).getAttribute("data-speaking")).toBe("true");

    plays.at(-1)?.finish();
    await flush(300);
    expect(urls().at(-1)).toBe("tile://chien f1");
    expect(screen.getByRole("button", { name: "chien f1" }).getAttribute("data-speaking")).toBe("true");
  });

  it("choisir un mot le dit ; toucher la carte de la phrase la redit", async () => {
    const { container } = renderFill("f2");
    await flush();
    plays[0].finish();
    await flush(5000);
    for (const play of [...plays]) play.finish();
    await flush(2000);
    const before = urls().length;

    fireEvent.click(screen.getByRole("button", { name: "chien f2" }));
    await flush();
    expect(urls().length).toBe(before + 1);
    expect(urls().at(-1)).toBe("tile://chien f2");
    plays.at(-1)?.finish();
    await flush();

    // La carte de la phrase : un toucher hors des trous la redit.
    fireEvent.click(screen.getByText(/miaule f2/));
    await flush();
    expect(urls().at(-1)).toBe("tile://Le ___ miaule f2.");
    expect(container.querySelector("[data-sentence-speaking]")).not.toBeNull();
  });

  it("ne dit rien quand la phrase fait compléter un mot : ses tuiles sont des syllabes", async () => {
    render(
      inSession(
        "ex-f4",
        <FillBlankExercise
          prompt="Choisis la bonne réponse."
          payload={{ text: "ba___ne f4", blanks: [{ options: ["na f4", "ma f4"] }] }}
          onSubmit={() => {}}
          disabled={false}
          isCorrect={null}
        />,
      ),
    );
    await flush();
    plays[0].finish();
    await flush(5000);
    fireEvent.click(screen.getByRole("button", { name: "na f4" }));
    await flush();
    expect(tileUrls()).toEqual([]);
    expect(mocks.findClip.mock.calls.filter(([request]) => request.kind === "tile")).toEqual([]);
    expect(document.querySelector("[data-tile-speaking], [data-sentence-speaking]")).toBeNull();
  });

  it("toucher un trou ne redit pas la phrase : il a son propre geste", async () => {
    renderFill("f3");
    await flush();
    plays[0].finish();
    await flush(5000);
    for (const play of [...plays]) play.finish();
    await flush(2000);
    const before = urls().length;

    fireEvent.click(screen.getByRole("button", { name: /^Trou 1, vide$/ }));
    await flush();
    expect(urls().length).toBe(before);
  });
});
