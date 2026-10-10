import { describe, expect, it } from "vitest";
import {
  AI_GATEWAY_BASE_URL,
  providerModelId,
  resolveAiClientConfig,
} from "../aiGateway/client";

describe("resolveAiClientConfig", () => {
  it("prend la passerelle Vercel quand sa clé existe, même avec une clé OpenAI", () => {
    expect(
      resolveAiClientConfig({ AI_GATEWAY_API_KEY: "gw", OPENAI_API_KEY: "oa" }),
    ).toEqual({ apiKey: "gw", baseURL: AI_GATEWAY_BASE_URL, viaGateway: true });
  });

  it("retombe sur OpenAI direct sans clé de passerelle", () => {
    expect(resolveAiClientConfig({ OPENAI_API_KEY: "oa" })).toEqual({
      apiKey: "oa",
      viaGateway: false,
    });
  });

  it("renvoie null sans aucune clé", () => {
    expect(resolveAiClientConfig({})).toBeNull();
  });
});

describe("providerModelId", () => {
  it("préfixe le modèle nu pour la passerelle", () => {
    expect(providerModelId("gpt-4o-mini", true)).toBe("openai/gpt-4o-mini");
  });

  it("laisse un modèle déjà préfixé", () => {
    expect(providerModelId("anthropic/claude-haiku-4.5", true)).toBe(
      "anthropic/claude-haiku-4.5",
    );
  });

  it("ne touche pas au nom en direct", () => {
    expect(providerModelId("gpt-4o-mini", false)).toBe("gpt-4o-mini");
  });
});
