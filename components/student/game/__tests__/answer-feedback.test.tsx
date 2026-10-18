import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, type RenderResult } from "@testing-library/react";
import { MotionGlobalConfig } from "framer-motion";
import type { ComponentProps } from "react";
import { pioSays } from "@/lib/pioCopy";
import { AnswerFeedback, outcomeKind, REVEAL_MS, revealDelayMs } from "../answer-feedback";

MotionGlobalConfig.skipAnimations = true;

vi.mock("@/hooks/use-device-tier", () => ({ useDeviceTier: () => "full" }));
vi.mock("@/lib/sounds", () => ({
  preloadAll: vi.fn(),
  getSoundEnabledLocal: () => false,
  play: vi.fn(),
}));
// Pas de toile dans jsdom : les confettis sont un module muet.
vi.mock("canvas-confetti", () => ({ default: vi.fn() }));

const vibrate = vi.fn();
beforeAll(() => {
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
  Object.defineProperty(navigator, "vibrate", { value: vibrate, configurable: true, writable: true });
});
afterEach(() => {
  cleanup();
  vibrate.mockClear();
  vi.useRealTimers();
});

const noop = () => {};

/** La scène, une fois le temps laissé à la tuile écoulé (`REVEAL_MS`). */
function renderRevealed(props: ComponentProps<typeof AnswerFeedback>): RenderResult {
  vi.useFakeTimers();
  const utils = render(<AnswerFeedback {...props} />);
  act(() => {
    vi.advanceTimersByTime(700);
  });
  return utils;
}

/** La même scène, re-rendue après son délai. */
function rerenderRevealed(utils: RenderResult, props: ComponentProps<typeof AnswerFeedback>) {
  utils.rerender(<AnswerFeedback {...props} />);
  act(() => {
    vi.advanceTimersByTime(700);
  });
}

describe("outcomeKind — trois issues", () => {
  it("juste, presque, plus d'essai", () => {
    expect(outcomeKind({ correct: true, attemptsRemaining: 4 })).toBe("right");
    expect(outcomeKind({ correct: false, attemptsRemaining: 2 })).toBe("wrong");
    expect(outcomeKind({ correct: false, attemptsRemaining: 0 })).toBe("out");
  });
});

describe("AnswerFeedback — la scène de réponse", () => {
  it("attend que la tuile ait joué : 650 ms sur une bonne réponse, 450 sur une erreur, rien sous le mouvement réduit", () => {
    expect(REVEAL_MS).toEqual({ right: 650, wrong: 450, out: 450 });
    expect(revealDelayMs({ correct: true, attemptsRemaining: 4 }, false)).toBe(650);
    expect(revealDelayMs({ correct: false, attemptsRemaining: 2 }, false)).toBe(450);
    expect(revealDelayMs({ correct: false, attemptsRemaining: 0 }, true)).toBe(0);
    // Avant le délai : la vibration est partie avec la tuile, mais ni voile ni scène dans le body.
    vi.useFakeTimers();
    const { baseElement } = render(
      <AnswerFeedback outcome={{ correct: true, attemptsRemaining: 4 }} seed={0} isLast={false} busy={false} onNext={noop} onExplain={noop} onDismiss={noop} />,
    );
    expect(vibrate).toHaveBeenCalledTimes(1);
    expect(baseElement.querySelector("[data-answer-feedback]")).toBeNull();
    act(() => {
      vi.advanceTimersByTime(649);
    });
    expect(baseElement.querySelector("[data-answer-feedback]")).toBeNull();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(baseElement.querySelector("[data-answer-feedback='right']")).not.toBeNull();
  });

  it("bonne réponse : Pio fête, aucun second éclat dans la scène, une seule vibration", () => {
    const { baseElement } = renderRevealed({ outcome: { correct: true, attemptsRemaining: 4 }, seed: 0, isLast: false, busy: false, onNext: noop, onExplain: noop, onDismiss: noop });
    const scene = screen.getByRole("status");
    expect(scene.textContent).toContain(pioSays.answerRight[0]);
    expect(screen.getByRole("img", { name: "Pio célèbre avec toi" })).toBeTruthy();
    // Un seul tir par réponse : l'éclat est celui de l'écran d'exercice, dans la carte.
    expect(baseElement.querySelector(".gk-reward")).toBeNull();
    expect(vibrate).toHaveBeenCalledTimes(1);
    expect(vibrate).toHaveBeenCalledWith([12, 40, 12]);
    // Plus d'étoiles émoji qui partent de zéro, plus de flou de fond.
    expect(baseElement.innerHTML).not.toContain("⭐");
    expect(baseElement.innerHTML).not.toContain("backdrop-blur");
  });

  it("juste mais mal écrit : la bonne graphie reste un bravo", () => {
    renderRevealed({ outcome: { correct: true, attemptsRemaining: 4, spelling: "mangue" }, seed: 0, isLast: false, busy: false, onNext: noop, onExplain: noop, onDismiss: noop });
    expect(screen.getByText(/Attention, tu as mal écrit/)).toBeTruthy();
    expect(screen.getByText("mangue")).toBeTruthy();
  });

  it("pas tout à fait : les cœurs comptent, la scène se ferme d'un toucher, aucun rouge", () => {
    const onDismiss = vi.fn();
    const { baseElement } = renderRevealed({ outcome: { correct: false, attemptsRemaining: 3 }, seed: 1, isLast: false, busy: false, onNext: noop, onExplain: noop, onDismiss });
    expect(screen.getByText("Encore 3 essais")).toBeTruthy();
    expect(baseElement.querySelectorAll("[data-attempt-hearts] [data-alive='true']").length).toBe(3);
    expect(baseElement.querySelectorAll("[data-attempt-hearts] [data-alive='false']").length).toBe(2);
    expect(vibrate).toHaveBeenCalledWith([40, 40, 40]);
    expect(baseElement.innerHTML).not.toMatch(/red-\d/);
    fireEvent.click(baseElement.querySelector("[data-answer-feedback='wrong']") as HTMLElement);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("plus d'essai : une alerte modale avec les deux suites, « … » quand ça charge", () => {
    const onNext = vi.fn();
    const onExplain = vi.fn();
    const utils = renderRevealed({ outcome: { correct: false, attemptsRemaining: 0 }, seed: 2, isLast: false, busy: false, onNext, onExplain, onDismiss: noop });
    expect(screen.getByRole("alertdialog")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Je veux comprendre" }));
    expect(onExplain).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Suivant" }));
    expect(onNext).toHaveBeenCalledTimes(1);
    expect(vibrate).toHaveBeenCalledWith(60);

    rerenderRevealed(utils, { outcome: { correct: false, attemptsRemaining: 0 }, seed: 2, isLast: true, busy: true, onNext, onExplain, onDismiss: noop });
    expect(screen.queryByText("Voir mon résultat")).toBeNull();
    expect(screen.getByText("…")).toBeTruthy();
    const next = screen.getByRole("button", { name: "…" }) as HTMLButtonElement;
    expect(next.disabled).toBe(true);
  });
});
