import { afterEach, describe, expect, it, vi } from "vitest";
import {
  MIN_AUDIO_BYTES,
  isTransientSynthesisError,
  synthesize,
  synthesizeWithRetry,
  voiceFor,
  type VoiceConfig,
} from "../voice/elevenlabs";

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

/**
 * Le fournisseur limite les synthèses simultanées d'un compte : un 429 est un
 * refus d'un instant. Sans nouvelle demande, la proposition restait muette.
 */
describe("synthesizeWithRetry", () => {
  const voice = voiceFor(config, "fr");
  const sound = () => new Response("a".repeat(MIN_AUDIO_BYTES + 1), { status: 200 });
  const refusal = (status: number) => new Response("refus", { status });

  function answers(...responses: (Response | Error)[]) {
    const fetchMock = vi.fn();
    for (const response of responses) {
      if (response instanceof Error) fetchMock.mockRejectedValueOnce(response);
      else fetchMock.mockResolvedValueOnce(response);
    }
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  }

  it("redemande après un 429 (trop de synthèses en même temps) et rend le son", async () => {
    const fetchMock = answers(refusal(429), sound());
    const audio = await synthesizeWithRetry("le chat", config, voice, [0, 0]);
    expect(audio.size).toBe(MIN_AUDIO_BYTES + 1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("redemande après une panne du fournisseur (5xx) ou du réseau", async () => {
    const fetchMock = answers(refusal(503), new TypeError("fetch failed"), sound());
    const audio = await synthesizeWithRetry("le chat", config, voice, [0, 0]);
    expect(audio.size).toBe(MIN_AUDIO_BYTES + 1);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("s'arrête après deux nouvelles demandes et laisse remonter le refus", async () => {
    const fetchMock = answers(refusal(429), refusal(429), refusal(429), sound());
    await expect(synthesizeWithRetry("le chat", config, voice, [0, 0])).rejects.toThrow(/elevenlabs tts 429/);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("ne redemande pas un refus définitif (clé, texte) ni un son vide", async () => {
    let fetchMock = answers(refusal(401), sound());
    await expect(synthesizeWithRetry("le chat", config, voice, [0, 0])).rejects.toThrow(/elevenlabs tts 401/);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    fetchMock = answers(new Response("", { status: 200 }), sound());
    await expect(synthesizeWithRetry("le chat", config, voice, [0, 0])).rejects.toThrow(/vide ou tronqué/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("classe les refus : passager ou définitif", () => {
    expect(isTransientSynthesisError(Object.assign(new Error("x"), { status: 429 }))).toBe(true);
    expect(isTransientSynthesisError(Object.assign(new Error("x"), { status: 500 }))).toBe(true);
    expect(isTransientSynthesisError(new TypeError("fetch failed"))).toBe(true);
    expect(isTransientSynthesisError(Object.assign(new Error("x"), { status: 400 }))).toBe(false);
    expect(isTransientSynthesisError(new Error("elevenlabs tts: son vide ou tronqué (0 octets)"))).toBe(false);
  });
});
