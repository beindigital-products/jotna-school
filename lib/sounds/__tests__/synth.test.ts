import { afterEach, describe, expect, it, vi } from "vitest";
import { stopClip } from "../synth";

/**
 * WebKit met le contexte audio en « interrupted » (application passée en
 * arrière-plan, appel entrant) : il faut le reprendre comme un « suspended »,
 * sans quoi l'exercice d'écoute reste muet jusqu'au rechargement.
 */

function fakeContext(state: string) {
  const node = () => ({ connect: vi.fn(), disconnect: vi.fn(), gain: { value: 0, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() }, frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() }, start: vi.fn(), stop: vi.fn(), type: "" });
  const resume = vi.fn().mockResolvedValue(undefined);
  class FakeContext {
    state = state;
    currentTime = 0;
    sampleRate = 44100;
    destination = {};
    resume = resume;
    createGain = node;
    createOscillator = node;
  }
  return { FakeContext, resume };
}

describe("synthétiseur d'écoute — reprise du contexte audio", () => {
  afterEach(() => {
    stopClip();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  for (const state of ["suspended", "interrupted"]) {
    it(`reprend un contexte « ${state} » avant de jouer`, async () => {
      const { FakeContext, resume } = fakeContext(state);
      vi.stubGlobal("AudioContext", FakeContext);
      vi.resetModules();
      const synth = await import("../synth");
      const done = synth.playClip([{ f: 440, d: 10 }]);
      await vi.waitFor(() => expect(resume).toHaveBeenCalledTimes(1));
      synth.stopClip();
      await done;
    });
  }

  it("ne reprend pas un contexte déjà en marche", async () => {
    const { FakeContext, resume } = fakeContext("running");
    vi.stubGlobal("AudioContext", FakeContext);
    vi.resetModules();
    const synth = await import("../synth");
    const done = synth.playClip([{ f: 440, d: 10 }]);
    await new Promise((r) => setTimeout(r, 30));
    synth.stopClip();
    await done;
    expect(resume).not.toHaveBeenCalled();
  });
});
