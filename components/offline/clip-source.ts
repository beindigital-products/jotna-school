/**
 * LE SITE WEB NE JOUE PAS LES SONS DE PIO.
 *
 * Les lecteurs (`components/exercises/prompt-reader.tsx`,
 * `components/arabic/speech.ts`) ne servent que l'espace élève, dans
 * l'application, qui lit à la place de ce fichier `clip-source.app.ts`
 * (`next.config.ts`). Le site importe ces lecteurs sans jamais en ouvrir un
 * (l'aperçu d'un exercice chez l'administrateur) : ici, aucun son ne se
 * trouve, et le stockage de l'appareil n'est pas embarqué.
 */

import type { ClipRequest } from "@/convex/offline/contract";

/** Une adresse à jouer, `"not_configured"` sans voix branchée, `null` sinon. */
export type ClipLookup = string | "not_configured" | null;

async function noClip(): Promise<ClipLookup> {
  return null;
}

export function useClipSource(): (request: ClipRequest) => Promise<ClipLookup> {
  return noClip;
}
