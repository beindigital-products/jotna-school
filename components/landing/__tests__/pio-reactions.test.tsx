import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";

import { REACTION_MS, SECRET_LINE, TAP_LINES, TAP_POSES, usePioReactions, type PioMoment } from "../pio-reactions";

const BASE: PioMoment = { pose: "hello", line: "Salut !" };

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-10T12:00:00Z"));
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("Pio réagit au toucher", () => {
  it("part de sa pose et de sa réplique de départ, sans réaction", () => {
    const { result } = renderHook(() => usePioReactions(BASE));
    expect(result.current.moment).toEqual(BASE);
    expect(result.current.reacting).toBe(false);
  });

  it("prend une pose et une réplique du camp à chaque toucher, puis reprend son départ", () => {
    const { result } = renderHook(() => usePioReactions(BASE));
    act(() => result.current.tap());
    expect(result.current.reacting).toBe(true);
    expect(TAP_POSES).toContain(result.current.moment.pose);
    expect(TAP_LINES).toContain(result.current.moment.line);

    act(() => {
      vi.advanceTimersByTime(REACTION_MS - 1);
    });
    expect(result.current.reacting).toBe(true);
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current.reacting).toBe(false);
    expect(result.current.moment).toEqual(BASE);
  });

  it("ne répète jamais la même pose ni la même réplique deux touchers de suite", () => {
    const { result } = renderHook(() => usePioReactions(BASE));
    let previous: PioMoment | null = null;
    // Un toucher toutes les trois secondes : jamais de secret, et assez de tirages pour que le hasard se trahisse.
    for (let i = 0; i < 60; i++) {
      act(() => {
        vi.advanceTimersByTime(3000);
        result.current.tap();
      });
      if (previous) {
        expect(result.current.moment.pose).not.toBe(previous.pose);
        expect(result.current.moment.line).not.toBe(previous.line);
      }
      previous = result.current.moment;
    }
  });

  it("garde la réaction du dernier toucher : un second toucher relance les deux secondes et demie", () => {
    const { result } = renderHook(() => usePioReactions(BASE));
    act(() => result.current.tap());
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    act(() => result.current.tap());
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.reacting).toBe(true);
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current.reacting).toBe(false);
  });

  it("cinq touchers en deux secondes : la réaction secrète", () => {
    const { result } = renderHook(() => usePioReactions(BASE));
    for (let i = 0; i < 4; i++) {
      act(() => {
        result.current.tap();
        vi.advanceTimersByTime(300);
      });
      expect(result.current.moment.line).not.toBe(SECRET_LINE);
    }
    act(() => result.current.tap());
    expect(result.current.moment).toEqual({ pose: "cheer", line: SECRET_LINE });
  });

  it("pas de secret pour des touchers espacés : il faut cinq touchers dans une fenêtre de deux secondes", () => {
    const { result } = renderHook(() => usePioReactions(BASE));
    for (let i = 0; i < 12; i++) {
      act(() => {
        result.current.tap();
        // Neuf cents millisecondes d'écart : trois touchers seulement tiennent dans la fenêtre.
        vi.advanceTimersByTime(900);
      });
      expect(result.current.moment.line, `toucher ${i + 1}`).not.toBe(SECRET_LINE);
    }
  });

  it("après le secret, il faut cinq nouveaux touchers pour le retrouver", () => {
    const { result } = renderHook(() => usePioReactions(BASE));
    const rapidTaps = (count: number) => {
      for (let i = 0; i < count; i++) {
        act(() => {
          result.current.tap();
          vi.advanceTimersByTime(100);
        });
      }
    };
    rapidTaps(5);
    expect(result.current.moment.line).toBe(SECRET_LINE);
    rapidTaps(4);
    expect(result.current.moment.line).not.toBe(SECRET_LINE);
    rapidTaps(1);
    expect(result.current.moment.line).toBe(SECRET_LINE);
  });

  it("ne change plus rien une fois démonté : la minuterie est retirée", () => {
    const { result, unmount } = renderHook(() => usePioReactions(BASE));
    act(() => result.current.tap());
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
