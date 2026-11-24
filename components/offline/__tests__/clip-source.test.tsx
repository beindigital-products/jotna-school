import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";

const mocks = vi.hoisted(() => ({ prepare: vi.fn(), offline: { enabled: false, connected: true } }));

vi.mock("convex/react", () => ({ useAction: () => mocks.prepare }));
vi.mock("../context", () => ({ useOffline: () => mocks.offline }));

import { useClipSource } from "../clip-source";

const REQUEST = { kind: "prompt", exerciseId: "exercise1" } as never;
const READY = { key: "prompt:exercise1", status: "ready", clipId: "c1", url: "https://clip/1.mp3" };
const PENDING = { key: "prompt:exercise1", status: "pending", reason: "provider_error" };

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

async function lookup() {
  const { result } = renderHook(() => useClipSource());
  const pending = result.current(REQUEST);
  await vi.runAllTimersAsync();
  return pending;
}

describe("la source des sons", () => {
  it("redemande un son que la synthèse n'a pas rendu du premier coup (pending)", async () => {
    mocks.prepare.mockResolvedValueOnce([PENDING]).mockResolvedValueOnce([READY]);
    expect(await lookup()).toBe("https://clip/1.mp3");
    expect(mocks.prepare).toHaveBeenCalledTimes(2);
  });

  it("redemande après une action perdue (connexion rétablie en vol)", async () => {
    mocks.prepare
      .mockRejectedValueOnce(new Error("Connection lost while action was in flight"))
      .mockResolvedValueOnce([READY]);
    expect(await lookup()).toBe("https://clip/1.mp3");
    expect(mocks.prepare).toHaveBeenCalledTimes(2);
  });

  it("s'arrête après trois essais et rend null, sans lever", async () => {
    mocks.prepare.mockResolvedValue([PENDING]);
    expect(await lookup()).toBeNull();
    expect(mocks.prepare).toHaveBeenCalledTimes(3);

    mocks.prepare.mockReset();
    mocks.prepare.mockRejectedValue(new Error("réseau"));
    expect(await lookup()).toBeNull();
    expect(mocks.prepare).toHaveBeenCalledTimes(3);
  });

  it("ne redemande pas un refus définitif", async () => {
    mocks.prepare.mockResolvedValue([{ key: "k", status: "unavailable", reason: "not_allowed" }]);
    expect(await lookup()).toBeNull();
    expect(mocks.prepare).toHaveBeenCalledTimes(1);

    mocks.prepare.mockReset();
    mocks.prepare.mockResolvedValue([{ key: "k", status: "unavailable", reason: "not_configured" }]);
    expect(await lookup()).toBe("not_configured");
    expect(mocks.prepare).toHaveBeenCalledTimes(1);
  });

  describe("les tuiles d'un écran : par lots, un appel à la fois", () => {
    const tile = (text: string) => ({ kind: "tile", exerciseId: "exercise1", text }) as never;
    const ready = (text: string) => ({ key: `tile:${text}`, status: "ready", clipId: `c-${text}`, url: `https://clip/${text}.mp3` });
    type Call = { requests: { text: string }[] };

    it("regroupe les tuiles demandées ensemble, quatre au plus par appel, dans l'ordre", async () => {
      mocks.prepare.mockImplementation(async ({ requests }: Call) => requests.map((r) => ready(r.text)));
      const { result } = renderHook(() => useClipSource());
      const texts = ["a1", "a2", "a3", "a4", "a5", "a6"];
      const lookups = texts.map((text) => result.current(tile(text)));
      await vi.runAllTimersAsync();
      expect(await Promise.all(lookups)).toEqual(texts.map((text) => `https://clip/${text}.mp3`));
      expect(mocks.prepare.mock.calls.map(([args]) => (args as Call).requests.map((r) => r.text))).toEqual([
        ["a1", "a2", "a3", "a4"],
        ["a5", "a6"],
      ]);
    });

    it("n'a jamais deux appels de tuiles en vol", async () => {
      let inFlight = 0;
      let most = 0;
      mocks.prepare.mockImplementation(async ({ requests }: Call) => {
        inFlight += 1;
        most = Math.max(most, inFlight);
        await new Promise((resolve) => setTimeout(resolve, 400));
        inFlight -= 1;
        return requests.map((r) => ready(r.text));
      });
      const { result } = renderHook(() => useClipSource());
      const lookups = ["b1", "b2", "b3", "b4", "b5", "b6", "b7", "b8", "b9"].map((text) => result.current(tile(text)));
      // Une tuile touchée pendant que les lots tournent prend son tour dans la file.
      await vi.advanceTimersByTimeAsync(300);
      lookups.push(result.current(tile("b10")));
      await vi.runAllTimersAsync();
      expect((await Promise.all(lookups)).every((url) => typeof url === "string")).toBe(true);
      expect(most).toBe(1);
    });

    it("la consigne ne passe pas par la file des tuiles : elle n'attend pas leur synthèse", async () => {
      mocks.prepare.mockImplementation(async ({ requests }: { requests: { kind: string; text?: string }[] }) => {
        if (requests[0].kind === "tile") await new Promise((resolve) => setTimeout(resolve, 5000));
        return requests.map((r) => (r.kind === "tile" ? ready(r.text as string) : READY));
      });
      const { result } = renderHook(() => useClipSource());
      void result.current(tile("c1"));
      let promptUrl: unknown = "en attente";
      void result.current(REQUEST).then((url) => (promptUrl = url));
      await vi.advanceTimersByTimeAsync(100);
      expect(promptUrl).toBe("https://clip/1.mp3");
      await vi.runAllTimersAsync();
    });

    it("redemande la seule tuile refusée d'un lot, pas les autres", async () => {
      let refused = false;
      mocks.prepare.mockImplementation(async ({ requests }: Call) =>
        requests.map((r) => {
          if (r.text === "d2" && !refused) {
            refused = true;
            return { key: "tile:d2", status: "pending", reason: "provider_error" };
          }
          return ready(r.text);
        }),
      );
      const { result } = renderHook(() => useClipSource());
      const lookups = ["d1", "d2", "d3"].map((text) => result.current(tile(text)));
      await vi.runAllTimersAsync();
      expect(await Promise.all(lookups)).toEqual(["https://clip/d1.mp3", "https://clip/d2.mp3", "https://clip/d3.mp3"]);
      expect(mocks.prepare.mock.calls.map(([args]) => (args as Call).requests.map((r) => r.text))).toEqual([
        ["d1", "d2", "d3"],
        ["d2"],
      ]);
    });

    it("un lot perdu en vol se redemande, et ne bloque pas la file", async () => {
      mocks.prepare
        .mockRejectedValueOnce(new Error("Connection lost while action was in flight"))
        .mockImplementation(async ({ requests }: Call) => requests.map((r) => ready(r.text)));
      const { result } = renderHook(() => useClipSource());
      const lookups = ["e1", "e2"].map((text) => result.current(tile(text)));
      await vi.runAllTimersAsync();
      expect(await Promise.all(lookups)).toEqual(["https://clip/e1.mp3", "https://clip/e2.mp3"]);
    });
  });
});
