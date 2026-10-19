import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

/**
 * Le déblocage se pose sur `document` À L'IMPORT : un seul import ici (ré-importer
 * le module empilerait des écouteurs d'instances précédentes).
 */
const plays: string[] = [];

beforeAll(() => {
  vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(function (this: HTMLMediaElement) {
    plays.push(this.src);
    return Promise.resolve();
  });
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
});
afterAll(() => vi.restoreAllMocks());

describe("le déblocage du lecteur de voix au premier toucher", () => {
  it("fait jouer un silence à l'élément une seule fois, puis ne touche plus à rien", async () => {
    const { playUrl, newVoiceOwner } = await import("../voice-player");
    expect(plays).toHaveLength(0);

    document.dispatchEvent(new Event("touchend", { bubbles: true }));
    expect(plays).toHaveLength(1);
    expect(plays[0].startsWith("data:audio/wav")).toBe(true);

    // Les touchers suivants ne rejouent pas le silence ; les sons, eux, jouent.
    document.dispatchEvent(new Event("click", { bubbles: true }));
    void playUrl("https://clip/a.mp3", newVoiceOwner(), 1);
    expect(plays).toHaveLength(2);
    expect(plays[1]).toBe("https://clip/a.mp3");
  });
});
