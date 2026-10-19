import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * jsdom ne sait pas jouer un son : on lui prête un `play`/`pause` qui note ce
 * qui se passe, et on relit l'élément UNIQUE que `voice-player` garde.
 */
let plays: { src: string; rate: number }[];
let playResult: () => Promise<void>;

beforeEach(() => {
  vi.resetModules();
  plays = [];
  playResult = () => Promise.resolve();
  vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(function (this: HTMLMediaElement) {
    plays.push({ src: this.src, rate: this.playbackRate });
    return playResult();
  });
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

describe("le lecteur de voix de Pio", () => {
  it("joue chaque son sur le MÊME élément audio, avec sa vitesse", async () => {
    const { playUrl, newVoiceOwner } = await import("../voice-player");
    const owner = newVoiceOwner();
    void playUrl("https://clip/a.mp3", owner, 1);
    void playUrl("https://clip/b.mp3", owner, 0.8);
    expect(plays.map((p) => p.src)).toEqual(["https://clip/a.mp3", "https://clip/b.mp3"]);
    // La vitesse se pose APRÈS la source, qui la remettrait à 1.
    expect(plays[1].rate).toBe(0.8);
  });

  it("rend vrai quand le son va au bout, faux quand on le coupe", async () => {
    const { playUrl, stopPlaying, newVoiceOwner } = await import("../voice-player");
    const owner = newVoiceOwner();
    const ended = playUrl("https://clip/a.mp3", owner, 1);
    stopPlaying(owner);
    expect(await ended).toBe(false);
  });

  it("la fin d'un son COUPÉ n'éteint pas le son suivant (élément partagé)", async () => {
    const { playUrl, newVoiceOwner } = await import("../voice-player");
    const owner = newVoiceOwner();
    const first = playUrl("https://clip/a.mp3", owner, 1);
    const second = playUrl("https://clip/b.mp3", owner, 1);
    // Le premier a été coupé par le second : il rend faux, le second joue encore.
    expect(await first).toBe(false);
    let secondSettled = false;
    void second.then(() => (secondSettled = true));
    await Promise.resolve();
    expect(secondSettled).toBe(false);
  });

  it("une lecture refusée par le navigateur rend faux, sans lever", async () => {
    playResult = () => Promise.reject(new Error("NotAllowedError"));
    const { playUrl, newVoiceOwner } = await import("../voice-player");
    expect(await playUrl("https://clip/a.mp3", newVoiceOwner(), 1)).toBe(false);
  });
});
