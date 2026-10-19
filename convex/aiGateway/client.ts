/**
 * Accès au modèle : Vercel AI Gateway d'abord, OpenAI direct en repli.
 *
 * La passerelle Vercel parle le protocole OpenAI. Le SDK `openai` reste donc le
 * client, seuls l'URL de base, la clé et le nom du modèle changent. Les erreurs
 * (`APIError`, `APIConnectionError`…) gardent la même forme, et
 * `isRetryableFailure` continue de s'appliquer sans retouche.
 *
 * Sans `AI_GATEWAY_API_KEY`, on retombe sur `OPENAI_API_KEY` en direct : un
 * déploiement qui n'a pas encore la clé de la passerelle ne casse pas.
 *
 * Module pur, sans import Convex.
 */

import OpenAI from "openai";

export const AI_GATEWAY_BASE_URL = "https://ai-gateway.vercel.sh/v1";

export type AiClientConfig = {
  apiKey: string;
  baseURL?: string;
  viaGateway: boolean;
};

export function resolveAiClientConfig(
  env: Record<string, string | undefined> = process.env,
): AiClientConfig | null {
  const gatewayKey = env.AI_GATEWAY_API_KEY;
  if (gatewayKey) {
    return { apiKey: gatewayKey, baseURL: AI_GATEWAY_BASE_URL, viaGateway: true };
  }
  const openaiKey = env.OPENAI_API_KEY;
  if (openaiKey) return { apiKey: openaiKey, viaGateway: false };
  return null;
}

export function createAiClient(config: AiClientConfig): OpenAI {
  return new OpenAI({ apiKey: config.apiKey, baseURL: config.baseURL });
}

/**
 * Nom du modèle côté fournisseur. La passerelle veut `fournisseur/modèle`;
 * le registre et les surcharges de `settings.modelOverrides` gardent le nom nu
 * (`gpt-4o-mini`), qui sert aussi de clé de tarif. Un nom déjà préfixé passe tel quel.
 */
export function providerModelId(model: string, viaGateway: boolean): string {
  if (!viaGateway || model.includes("/")) return model;
  return `openai/${model}`;
}
