import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MIN_AUDIO_BYTES, voiceConfig, voiceFor } from "@/convex/voice/elevenlabs";
import { speakableTile } from "@/convex/voice/tiles";
import {
  resetStaticVoiceFailures,
  staticTileFailed,
  staticTileUrl,
  staticVoiceManifest,
  staticVoiceUrl,
} from "@/lib/voice-static";
import { STATIC_VOICE_TOPICS, staticVoiceTexts } from "@/lib/voice-static/set";

/**
 * LES SONS EMBARQUÉS : la table (`lib/voice-static/manifest.ts`), les fichiers (`public/voix/`) et la liste calculée
 * (`lib/voice-static/set.ts`) doivent dire la même chose. Si l'un des trois dérive, un enfant entend un mot manquant,
 * une autre voix, ou rien.
 */

const VOIX = join(process.cwd(), "public/voix");
const manifest = staticVoiceManifest();
const fileOf = (text: string) =>
  `${createHash("sha1").update(`${manifest.voiceId}|${manifest.modelId}|${text}`).digest("hex").slice(0, 16)}.mp3`;

afterEach(() => {
  resetStaticVoiceFailures();
  vi.unstubAllEnvs();
});

describe("la table des sons embarqués", () => {
  it("dit avec la voix et le modèle que le serveur lit pour l'anglais", () => {
    // La configuration par défaut du serveur : seule la clé est donnée, aucune voix ni modèle réglés.
    for (const name of ["ELEVENLABS_VOICE_ID", "ELEVENLABS_FR_VOICE_ID", "ELEVENLABS_EN_VOICE_ID", "ELEVENLABS_EN_MODEL_ID"]) {
      vi.stubEnv(name, undefined as unknown as string);
    }
    vi.stubEnv("ELEVENLABS_API_KEY", "test");
    const config = voiceConfig();
    expect(config).not.toBeNull();
    const voice = voiceFor(config!, "en");
    expect({ voiceId: manifest.voiceId, modelId: manifest.modelId }).toEqual({ voiceId: voice.voiceId, modelId: voice.modelId });
  });

  it("a un fichier pour chaque ligne, et un nom qui est l'empreinte de « voix | modèle | texte »", () => {
    const entries = Object.entries(manifest.clips);
    expect(entries.length).toBeGreaterThan(250);
    for (const [text, file] of entries) {
      expect(file, text).toBe(fileOf(text));
      expect(existsSync(join(VOIX, file)), text).toBe(true);
    }
  });

  it("ne garde que de vrais mp3, ni vides ni énormes", () => {
    for (const file of Object.values(manifest.clips)) {
      const bytes = readFileSync(join(VOIX, file));
      expect(bytes.length, file).toBeGreaterThanOrEqual(MIN_AUDIO_BYTES);
      expect(bytes.length, file).toBeLessThan(300_000);
      // Un mp3 commence par une étiquette ID3 ou par un cadre (11 bits à 1).
      const idTag = bytes.subarray(0, 3).toString("latin1") === "ID3";
      const frame = bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0;
      expect(idTag || frame, file).toBe(true);
    }
  });

  it("n'a aucun fichier orphelin dans public/voix", () => {
    const used = new Set(Object.values(manifest.clips));
    const files = readdirSync(VOIX).filter((name) => !name.startsWith("."));
    expect(files.filter((name) => !used.has(name))).toEqual([]);
    // Et l'ensemble reste léger : l'application le porte pour toujours.
    const total = files.reduce((sum, name) => sum + statSync(join(VOIX, name)).size, 0);
    expect(total).toBeLessThan(12 * 1024 * 1024);
  });

  it("couvre tous les textes de la liste calculée", () => {
    const texts = staticVoiceTexts(60);
    expect(texts.length).toBeGreaterThan(200);
    expect(texts.filter((text) => manifest.clips[text] === undefined)).toEqual([]);
  });

  it("couvre presque tout ce que des tirages jamais vus disent (le reste passe par le serveur)", () => {
    const unseen = staticVoiceTexts(40, "static-voice-test-never-built");
    const missing = unseen.filter((text) => manifest.clips[text] === undefined);
    expect(missing.length / unseen.length, missing.join(" | ")).toBeLessThan(0.03);
  });

  it("ne garde dans la table que des textes de la liste (rien d'ancien après un changement de nom de lettre)", () => {
    const texts = new Set(staticVoiceTexts());
    expect(Object.keys(manifest.clips).filter((text) => !texts.has(text))).toEqual([]);
  });

  it("ne parle que des six thématiques d'alphabet", () => {
    expect([...STATIC_VOICE_TOPICS].sort()).toEqual(["an-ci-abc-1", "an-ci-abc-2", "an-ci-abc-3", "an-cp-abc", "an-cp-name", "an-cp-sounds"]);
  });
});

describe("la recherche d'un son embarqué", () => {
  it("trouve une lettre seule d'une thématique d'anglais, sous le nom que la voix dirait", () => {
    expect(speakableTile("B", "en", true)).toBe("bee");
    expect(staticTileUrl("B", true)).toBe(`/voix/${manifest.clips["bee"]}`);
    expect(staticTileUrl("H", true)).toBe(`/voix/${manifest.clips["Aitch."]}`);
  });

  it("ne trouve rien hors d'une thématique d'anglais : le même texte se dirait en français", () => {
    expect(staticTileUrl("B", false)).toBeNull();
    expect(staticTileUrl("banana", false)).toBeNull();
  });

  it("ne trouve rien pour un texte inconnu, ni pour un nom de propriété de l'objet", () => {
    for (const text of ["inconnu de la table", "constructor", "__proto__", "toString", ""]) {
      expect(staticVoiceUrl(text), text).toBeNull();
    }
    expect(staticVoiceUrl(null)).toBeNull();
  });

  it("oublie un son qui ne s'est pas joué : les demandes suivantes vont au serveur", () => {
    expect(staticTileUrl("B", true)).not.toBeNull();
    staticTileFailed("B", true);
    expect(staticTileUrl("B", true)).toBeNull();
    // Un autre son n'est pas touché.
    expect(staticTileUrl("C", true)).not.toBeNull();
    // Hors anglais, un échec n'efface rien.
    staticTileFailed("C", false);
    expect(staticTileUrl("C", true)).not.toBeNull();
  });
});
