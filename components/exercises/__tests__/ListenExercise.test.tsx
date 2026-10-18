import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";

// La récompense tire des confettis sur un canevas : pas de canevas dans jsdom.
vi.mock("canvas-confetti", () => ({ default: vi.fn() }));

// Pas de Web Audio dans jsdom : le synthétiseur est un faux qui « joue » tant
// qu'on ne le résout pas.
const synth = vi.hoisted(() => ({
  canSynthesize: vi.fn(() => true),
  playClip: vi.fn(() => new Promise<void>(() => {})),
  stopClip: vi.fn(),
}));
vi.mock("@/lib/sounds/synth", () => synth);
// Le lecteur de consignes ne cherche pas de son dans jsdom.
vi.mock("@/components/offline/clip-source", () => ({ useClipSource: () => vi.fn() }));

import ListenExercise, { beatSchedule } from "../ListenExercise";
import { PromptReaderProvider } from "../prompt-reader";
import { ACTION_TONES, hexToRgb, paleTone } from "@/components/student/game-kit/tones";

// Deux sons : une note tenue, puis un rythme de deux coups séparés d'un silence.
const CLIPS = [
  { label: "Son 1", notes: [{ f: 440, d: 900 }] },
  { label: "Son 2", notes: [{ f: 180, d: 200, k: "drum" as const }, { f: 0, d: 100 }, { f: 180, d: 200, k: "drum" as const }] },
];
const PAYLOAD = { clips: CLIPS, options: ["Le son 1", "Le son 2"] };

function renderListen(overrides: Partial<React.ComponentProps<typeof ListenExercise>> = {}) {
  const onSubmit = vi.fn();
  const props = {
    prompt: "Écoute les deux sons. Lequel est le plus aigu ?",
    payload: PAYLOAD,
    onSubmit,
    disabled: false,
    isCorrect: null as boolean | null,
    ...overrides,
  };
  const view = render(<ListenExercise {...props} />);
  return { ...view, onSubmit, props };
}

const drum = (label: string) => screen.getByRole("button", { name: `Écouter : ${label}` });
const valider = () => screen.getByRole("button", { name: "Valider" }) as HTMLButtonElement;

beforeEach(() => {
  synth.canSynthesize.mockReturnValue(true);
  synth.playClip.mockImplementation(() => new Promise<void>(() => {}));
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("beatSchedule : les coups du tambour suivent la partition", () => {
  it("un coup par note jouée, pas pour les silences, avec sa durée", () => {
    expect(beatSchedule(CLIPS[1])).toEqual([
      { at: 0, hold: 200 },
      { at: 300, hold: 200 },
    ]);
    expect(beatSchedule(CLIPS[0])).toEqual([{ at: 0, hold: 900 }]);
  });

  it("plafonne le nombre de coups", () => {
    const notes = Array.from({ length: 60 }, () => ({ f: 200, d: 100 }));
    expect(beatSchedule({ label: "long", notes })).toHaveLength(32);
  });
});

describe("l'écoute : des tambours qui battent, la réponse part comme avant", () => {
  it("joue le son touché et fait battre la peau à chaque coup", () => {
    vi.useFakeTimers();
    renderListen();
    fireEvent.click(drum("Son 2"));
    expect(synth.playClip).toHaveBeenCalledWith(CLIPS[1].notes);
    expect(drum("Son 2").getAttribute("data-playing")).toBe("1");
    expect(drum("Son 1").getAttribute("data-playing")).toBe("0");

    // Premier coup à 50 ms (le départ du synthétiseur), second à 350 ms.
    act(() => {
      vi.advanceTimersByTime(60);
    });
    expect(drum("Son 2").getAttribute("data-beat")).toBe("0");
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(drum("Son 2").getAttribute("data-beat")).toBe("1");
  });

  it("note le son comme écouté quand il est fini", async () => {
    let finish: () => void = () => {};
    synth.playClip.mockImplementation(() => new Promise<void>((resolve) => (finish = resolve)));
    renderListen();
    fireEvent.click(drum("Son 1"));
    await act(async () => {
      finish();
    });
    expect(drum("Son 1").getAttribute("data-playing")).toBe("0");
    expect(drum("Son 1").textContent).toContain("Écouté");
  });

  it("choisit une tuile et envoie son index ; « Le son 1 / Le son 2 » tiennent sur une rangée", () => {
    const { onSubmit } = renderListen();
    expect(document.querySelector("[data-layout]")?.getAttribute("data-layout")).toBe("deux-colonnes");
    expect(valider().disabled).toBe(true);
    const second = screen.getByRole("button", { name: /^BLe son 2$/ });
    fireEvent.click(second);
    expect(second.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(valider());
    expect(onSubmit).toHaveBeenCalledWith("1");
  });

  it("colore la tuile jugée en vert ou en ambre, jamais en rouge", () => {
    const { rerender, props } = renderListen();
    fireEvent.click(screen.getByRole("button", { name: /^BLe son 2$/ }));
    rerender(<ListenExercise {...props} disabled isCorrect />);
    expect(document.querySelector('[data-option="1"]')?.getAttribute("data-state")).toBe("juste");
    rerender(<ListenExercise {...props} disabled isCorrect={false} />);
    expect(document.querySelector('[data-option="1"]')?.getAttribute("data-state")).toBe("fausse");
    expect(document.querySelector(".border-red-400")).toBeNull();
  });

  it("saute l'exercice quand l'appareil ne sait pas jouer les sons", () => {
    synth.canSynthesize.mockReturnValue(false);
    renderListen();
    fireEvent.click(drum("Son 1"));
    expect(screen.getByText("Cet appareil ne sait pas jouer les sons de l'exercice : on le saute.")).toBeTruthy();
  });

  it("coupe le son et le tambour quand l'écran disparaît", () => {
    const { unmount } = renderListen();
    fireEvent.click(drum("Son 1"));
    unmount();
    expect(synth.stopClip).toHaveBeenCalled();
  });

  it("pour un enfant qui apprend à lire, « Écouter l'énoncé » vient juste avant « Valider », distinct des tambours", () => {
    const { container } = render(
      <PromptReaderProvider exerciseId="exo" silenced>
        <ListenExercise prompt="Écoute les deux sons." payload={PAYLOAD} onSubmit={vi.fn()} disabled={false} isCorrect={null} />
      </PromptReaderProvider>,
    );
    const bar = container.querySelector("[data-scene-actions]");
    const names = [...bar!.querySelectorAll("button")].map((b) => b.getAttribute("aria-label") ?? b.textContent);
    expect(names).toEqual(["Écouter l'énoncé", "Valider"]);
    expect(bar!.nextElementSibling).toBeNull();
    // Les tambours gardent leur nom (le son à reconnaître) : trois « Écouter », un seul pour l'énoncé.
    expect(screen.getAllByRole("button", { name: /^Écouter/ })).toHaveLength(3);
    expect(drum("Son 1").closest("[data-scene-actions]")).toBeNull();
    // Un seul bouton bleu dans la barre : la face de « Valider », encore
    // désactivé (rien d'écouté), est l'orange-600 pâli en couleurs opaques
    // (`paleTone`), pas le ciel.
    const [r, g, b] = hexToRgb(paleTone(ACTION_TONES.orange).faceBottom);
    const valid = screen.getByRole("button", { name: "Valider" }).innerHTML;
    expect(valid).toContain(`rgb(${r}, ${g}, ${b})`);
    expect(valid).not.toContain("rgb(2, 132, 199)");
  });
});
