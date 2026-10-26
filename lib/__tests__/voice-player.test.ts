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

describe("un son qui ne se joue pas (onFail)", () => {
  it("signale une lecture refusée pour une autre raison que la lecture automatique", async () => {
    playResult = () => Promise.reject(Object.assign(new Error("décodage"), { name: "NotSupportedError" }));
    const { playUrl, newVoiceOwner } = await import("../voice-player");
    const onFail = vi.fn();
    expect(await playUrl("https://clip/a.mp3", newVoiceOwner(), 1, onFail)).toBe(false);
    expect(onFail).toHaveBeenCalledTimes(1);
  });

  it("ne signale PAS un refus de lecture automatique : le toucher suivant jouera", async () => {
    playResult = () => Promise.reject(Object.assign(new Error("bloqué"), { name: "NotAllowedError" }));
    const { playUrl, newVoiceOwner } = await import("../voice-player");
    const onFail = vi.fn();
    expect(await playUrl("https://clip/a.mp3", newVoiceOwner(), 1, onFail)).toBe(false);
    expect(onFail).not.toHaveBeenCalled();
  });

  it("signale une erreur de l'élément (fichier abîmé, adresse morte)", async () => {
    const { playUrl, newVoiceOwner } = await import("../voice-player");
    const onFail = vi.fn();
    const result = playUrl("https://clip/a.mp3", newVoiceOwner(), 1, onFail);
    // L'élément est partagé et hors du DOM : on l'atteint par le `play` espionné.
    const audio = vi.mocked(HTMLMediaElement.prototype.play).mock.contexts[0] as HTMLAudioElement;
    audio.onerror?.(new Event("error"));
    expect(await result).toBe(false);
    expect(onFail).toHaveBeenCalledTimes(1);
  });

  it("ne signale PAS une coupure voulue", async () => {
    const { playUrl, stopPlaying, newVoiceOwner } = await import("../voice-player");
    const owner = newVoiceOwner();
    const onFail = vi.fn();
    const result = playUrl("https://clip/a.mp3", owner, 1, onFail);
    stopPlaying(owner);
    expect(await result).toBe(false);
    expect(onFail).not.toHaveBeenCalled();
  });

  it("signale un son qui ne démarre jamais, après le délai, et coupe l'élément", async () => {
    vi.useFakeTimers();
    try {
      const { playUrl, newVoiceOwner, START_TIMEOUT_MS } = await import("../voice-player");
      const onFail = vi.fn();
      // `play()` ne rend jamais : le fichier n'arrive pas.
      playResult = () => new Promise<void>(() => {});
      const result = playUrl("https://clip/a.mp3", newVoiceOwner(), 1, onFail);
      await vi.advanceTimersByTimeAsync(START_TIMEOUT_MS - 1);
      expect(onFail).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(2);
      expect(await result).toBe(false);
      expect(onFail).toHaveBeenCalledTimes(1);
      expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it("un son qui démarre (événement playing) n'est plus soumis au délai", async () => {
    vi.useFakeTimers();
    try {
      const { playUrl, newVoiceOwner, START_TIMEOUT_MS } = await import("../voice-player");
      const onFail = vi.fn();
      playResult = () => new Promise<void>(() => {});
      let settled = false;
      void playUrl("https://clip/a.mp3", newVoiceOwner(), 1, onFail).then(() => (settled = true));
      const audio = vi.mocked(HTMLMediaElement.prototype.play).mock.contexts[0] as HTMLAudioElement;
      audio.onplaying?.(new Event("playing"));
      await vi.advanceTimersByTimeAsync(START_TIMEOUT_MS * 2);
      expect(settled).toBe(false);
      expect(onFail).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });
});
