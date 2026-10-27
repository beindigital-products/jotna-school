/**
 * COPIER LE CACHE AUDIO D'UN DÉPLOIEMENT À L'AUTRE : la décision, sans réseau ni base.
 *
 * Le développement et la production ont chacun leur cache de sons (`arabicAudioClips`). Préchauffer la production
 * repaie donc à ElevenLabs ce que le développement a déjà. `voice/cacheCopy.ts` recopie les fichiers au lieu de les
 * resynthétiser ; ce module décide, ligne par ligne, ce qui peut l'être.
 *
 * MODULE PUR : testé sans base (`convex/__tests__/voiceCacheCopy.test.ts`).
 *
 * CE QUI SE COPIE, ET RIEN D'AUTRE :
 *   - une ligne dont la clé est bien « voix | modèle | texte » : une ligne trafiquée ne range pas un autre texte sous
 *     la clé d'un texte que les enfants entendent ;
 *   - une voix et un modèle que la CIBLE lirait vraiment (`allowedVoices`, tirés de sa configuration) : un son d'une
 *     autre voix n'est jamais demandé là-bas, il resterait inutilisé ;
 *   - un fichier de taille plausible (pas vide, pas énorme) ;
 *   - une adresse sûre : `https` et un hôte `*.convex.cloud` (ou l'hôte de la cible elle-même, pour les essais en local).
 *     L'action fait un `fetch` de cette adresse ; sans cette liste, elle irait chercher n'importe quoi.
 *   - ce que la cible n'a pas déjà : jamais d'écrasement.
 */
import { MIN_AUDIO_BYTES, clipCacheKey } from "./elevenlabs";

/** Un son de la source : sa ligne de cache et l'adresse de son fichier. */
export type SourceClip = {
  cacheKey: string;
  text: string;
  voiceId: string;
  modelId: string;
  bytes: number;
  url: string | null;
};

/** Au-delà, ce n'est pas un son de Pio (le plus long fait quelques dizaines de Ko). */
export const MAX_COPY_BYTES = 3_000_000;

/** La clé « voix | modèle » d'une voix. */
export function voiceKey(voiceId: string, modelId: string): string {
  return `${voiceId}|${modelId}`;
}

/** Une adresse de fichier que l'action a le droit d'aller chercher. */
export function isAllowedSourceUrl(url: string, targetHost: string | null): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.username !== "" || parsed.password !== "") return false;
  if (targetHost !== null && parsed.host === targetHost) return parsed.protocol === "https:" || parsed.protocol === "http:";
  return parsed.protocol === "https:" && parsed.port === "" && parsed.hostname.endsWith(".convex.cloud");
}

export type CopyPlan = {
  toCopy: SourceClip[];
  alreadyCached: number;
  otherVoice: number;
  badKey: number;
  badSize: number;
  noUrl: number;
  badUrl: number;
  duplicate: number;
};

export function planCopy(args: {
  clips: readonly SourceClip[];
  /** `voiceKey(voiceId, modelId)` de chaque voix que la cible lit. */
  allowedVoices: ReadonlySet<string>;
  /** Les clés que la cible a déjà. */
  cached: ReadonlySet<string>;
  /** L'hôte de la cible (`CONVEX_CLOUD_URL`), accepté comme source pour les essais en local. */
  targetHost: string | null;
}): CopyPlan {
  const plan: CopyPlan = { toCopy: [], alreadyCached: 0, otherVoice: 0, badKey: 0, badSize: 0, noUrl: 0, badUrl: 0, duplicate: 0 };
  const seen = new Set<string>();
  for (const clip of args.clips) {
    if (seen.has(clip.cacheKey)) {
      plan.duplicate += 1;
      continue;
    }
    seen.add(clip.cacheKey);
    if (clip.cacheKey !== clipCacheKey(clip.voiceId, clip.modelId, clip.text)) {
      plan.badKey += 1;
    } else if (!args.allowedVoices.has(voiceKey(clip.voiceId, clip.modelId))) {
      plan.otherVoice += 1;
    } else if (args.cached.has(clip.cacheKey)) {
      plan.alreadyCached += 1;
    } else if (!Number.isFinite(clip.bytes) || clip.bytes < MIN_AUDIO_BYTES || clip.bytes > MAX_COPY_BYTES) {
      plan.badSize += 1;
    } else if (clip.url === null) {
      plan.noUrl += 1;
    } else if (!isAllowedSourceUrl(clip.url, args.targetHost)) {
      plan.badUrl += 1;
    } else {
      plan.toCopy.push(clip);
    }
  }
  return plan;
}
