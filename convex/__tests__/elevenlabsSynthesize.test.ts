import { afterEach, describe, expect, it, vi } from "vitest";
import { MIN_AUDIO_BYTES, synthesize, voiceFor, type VoiceConfig } from "../voice/elevenlabs";

/**
 * Un « 200 » sans son ne doit jamais atteindre le cache : il serait servi à
 * tous les enfants, et la consigne resterait muette pour toujours.
 */
const config: VoiceConfig = {
  apiKey: "cle-de-test",
  voiceId: "voix",
  frVoiceId: "voix-fr",
  enVoiceId: "voix-en",
  enTtsModel: "modele-en",
  ttsModel: "modele",
  frTtsModel: "modele-fr",
  sttModel: "stt",
  sttLanguage: "ara",
  speed: null,
};

/** Un corps de `size` octets (des « a » : ce test ne décode rien). */
function answer(size: number, status = 200) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("a".repeat(size), { status })));
}

afterEach(() => vi.unstubAllGlobals());

describe("voiceFor", () => {
  it("donne à l'anglais sa voix et son modèle, donc sa propre clé de cache", () => {
    const fr = voiceFor(config, "fr");
    const en = voiceFor(config, "en");
    expect(en).toEqual({ lang: "en", voiceId: "voix-en", modelId: "modele-en" });
    expect(`${en.voiceId}|${en.modelId}`).not.toBe(`${fr.voiceId}|${fr.modelId}`);
  });
});

describe("synthesize", () => {
  const voice = voiceFor(config, "fr");

  it("rend le son quand le fournisseur en envoie un", async () => {
    answer(MIN_AUDIO_BYTES + 1);
    const audio = await synthesize("Bonjour", config, voice);
    expect(audio.size).toBe(MIN_AUDIO_BYTES + 1);
  });

  it("refuse un corps vide", async () => {
    answer(0);
    await expect(synthesize("Bonjour", config, voice)).rejects.toThrow(/vide ou tronqué/);
  });

  it("refuse un son trop court pour en être un", async () => {
    answer(MIN_AUDIO_BYTES - 1);
    await expect(synthesize("Bonjour", config, voice)).rejects.toThrow(/vide ou tronqué/);
  });

  it("garde le refus du fournisseur", async () => {
    answer(5, 429);
    await expect(synthesize("Bonjour", config, voice)).rejects.toThrow(/elevenlabs tts 429/);
  });
});
