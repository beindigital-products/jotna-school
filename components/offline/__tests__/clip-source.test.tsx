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
});
