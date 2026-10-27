import { describe, expect, it } from "vitest";
import { clipCacheKey } from "../voice/elevenlabs";
import {
  MAX_COPY_BYTES,
  isAllowedSourceUrl,
  planCopy,
  voiceKey,
  type SourceClip,
} from "../voice/cacheCopyPlan";

/**
 * COPIER LE CACHE AUDIO D'UN DÉPLOIEMENT À L'AUTRE (`voice/cacheCopy.ts`, `cacheCopyPlan.ts`).
 *
 * La copie ne passe par aucun appel à ElevenLabs, mais elle FAIT un `fetch` sur des adresses qu'une autre base lui donne et
 * range des sons que des enfants entendront. Ces tests tiennent les garde-fous : quelles lignes, quelles adresses, jamais
 * d'écrasement.
 */

const VOICE = "voice-en";
const MODEL = "model-en";
const URL_OK = "https://happy-capybara-123.convex.cloud/api/storage/abc";

function clip(over: Partial<SourceClip> = {}): SourceClip {
  const text = over.text ?? "bee";
  const voiceId = over.voiceId ?? VOICE;
  const modelId = over.modelId ?? MODEL;
  return {
    cacheKey: clipCacheKey(voiceId, modelId, text),
    text,
    voiceId,
    modelId,
    bytes: 20_000,
    url: URL_OK,
    ...over,
  };
}

const allowedVoices = new Set([voiceKey(VOICE, MODEL), voiceKey("voice-fr", "model-fr")]);
const plan = (clips: SourceClip[], over: { cached?: string[]; targetHost?: string | null } = {}) =>
  planCopy({ clips, allowedVoices, cached: new Set(over.cached ?? []), targetHost: over.targetHost ?? null });

describe("les adresses que l'import a le droit de télécharger", () => {
  it("accepte https sur un hôte convex.cloud", () => {
    expect(isAllowedSourceUrl(URL_OK, null)).toBe(true);
    expect(isAllowedSourceUrl("https://a.b.convex.cloud/api/storage/x", null)).toBe(true);
  });

  it("refuse tout le reste : http, autre hôte, hôte qui ressemble, identifiants, port, texte qui n'est pas une adresse", () => {
    for (const url of [
      "http://happy-capybara-123.convex.cloud/api/storage/abc",
      "https://example.com/a.mp3",
      "https://convex.cloud.evil.com/a.mp3",
      "https://evilconvex.cloud/a.mp3",
      "https://user:pass@happy-capybara-123.convex.cloud/a.mp3",
      "https://happy-capybara-123.convex.cloud:8443/a.mp3",
      "https://169.254.169.254/latest/meta-data",
      "http://localhost:3210/api/storage/x",
      "file:///etc/passwd",
      "javascript:alert(1)",
      "not a url",
      "",
    ]) {
      expect(isAllowedSourceUrl(url, null), url).toBe(false);
    }
  });

  it("accepte l'hôte de la cible elle-même, pour un essai en local, et seulement lui", () => {
    expect(isAllowedSourceUrl("http://127.0.0.1:3210/api/storage/x", "127.0.0.1:3210")).toBe(true);
    expect(isAllowedSourceUrl("http://127.0.0.1:3211/api/storage/x", "127.0.0.1:3210")).toBe(false);
    expect(isAllowedSourceUrl("http://127.0.0.1:3210/api/storage/x", null)).toBe(false);
  });
});

describe("le plan de copie", () => {
  it("copie un son sain d'une voix que la cible lit", () => {
    const result = plan([clip()]);
    expect(result.toCopy.map((entry) => entry.text)).toEqual(["bee"]);
    expect(result.alreadyCached + result.otherVoice + result.badKey + result.badSize + result.noUrl + result.badUrl).toBe(0);
  });

  it("ne remplace jamais un son que la cible a déjà", () => {
    const existing = clip({ text: "see" });
    const result = plan([clip(), existing], { cached: [existing.cacheKey] });
    expect(result.toCopy.map((entry) => entry.text)).toEqual(["bee"]);
    expect(result.alreadyCached).toBe(1);
  });

  it("ne copie pas une voix ou un modèle que la cible ne lit pas", () => {
    const result = plan([clip(), clip({ voiceId: "autre-voix" }), clip({ modelId: "autre-modele" })]);
    expect(result.toCopy).toHaveLength(1);
    expect(result.otherVoice).toBe(2);
  });

  it("refuse une ligne dont la clé n'est pas « voix | modèle | texte »", () => {
    // Une ligne trafiquée rangerait un autre texte sous la clé d'un texte que les enfants entendent.
    const forged = { ...clip({ text: "bee" }), cacheKey: clipCacheKey(VOICE, MODEL, "see") };
    const result = plan([forged]);
    expect(result.toCopy).toEqual([]);
    expect(result.badKey).toBe(1);
  });

  it("refuse un fichier vide, énorme ou de taille absurde", () => {
    const result = plan([
      clip({ text: "a1", bytes: 0 }),
      clip({ text: "a2", bytes: 999 }),
      clip({ text: "a3", bytes: MAX_COPY_BYTES + 1 }),
      clip({ text: "a4", bytes: Number.NaN }),
      clip({ text: "a5", bytes: Number.POSITIVE_INFINITY }),
      clip({ text: "a6", bytes: MAX_COPY_BYTES }),
    ]);
    expect(result.toCopy.map((entry) => entry.text)).toEqual(["a6"]);
    expect(result.badSize).toBe(5);
  });

  it("compte à part un son sans adresse et un son dont l'adresse est refusée, sans télécharger ni l'un ni l'autre", () => {
    const result = plan([clip({ text: "a1", url: null }), clip({ text: "a2", url: "https://example.com/a.mp3" })]);
    expect(result.toCopy).toEqual([]);
    expect(result.noUrl).toBe(1);
    expect(result.badUrl).toBe(1);
  });

  it("ne copie qu'une fois une clé reçue deux fois", () => {
    const result = plan([clip(), clip()]);
    expect(result.toCopy).toHaveLength(1);
    expect(result.duplicate).toBe(1);
  });

  it("range chaque ligne dans une seule case : le total est le nombre de lignes reçues", () => {
    const clips = [
      clip({ text: "ok" }),
      clip({ text: "dup" }),
      clip({ text: "dup" }),
      clip({ text: "voix", voiceId: "x" }),
      clip({ text: "taille", bytes: 1 }),
      clip({ text: "nourl", url: null }),
      clip({ text: "badurl", url: "http://example.com/a.mp3" }),
      clip({ text: "cache" }),
    ];
    const result = plan(clips, { cached: [clipCacheKey(VOICE, MODEL, "cache")] });
    const total =
      result.toCopy.length +
      result.alreadyCached +
      result.otherVoice +
      result.badKey +
      result.badSize +
      result.noUrl +
      result.badUrl +
      result.duplicate;
    expect(total).toBe(clips.length);
  });
});
