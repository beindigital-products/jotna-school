/**
 * COPIER LE CACHE AUDIO D'UN DÉPLOIEMENT À L'AUTRE, SANS APPELER ELEVENLABS.
 *
 * Chaque déploiement a son propre cache de sons (`arabicAudioClips`, rangé par `arabic/db.ts`). Le développement a déjà
 * payé ses sons ; la production, non. Au lieu de resynthétiser, on recopie les fichiers :
 *
 *     pnpm voix:copier --from dev --to prod --confirm <nom de la production>            à blanc (le défaut)
 *     pnpm voix:copier --from dev --to prod --confirm <nom de la production> --apply     copie pour de bon
 *
 * Deux fonctions INTERNES, appelées par `scripts/copier-cache-voix.mjs` avec `npx convex run` :
 *   - `listClips`, sur la SOURCE : une page de lignes de cache avec l'adresse de chaque fichier. Elle ne modifie rien.
 *   - `importClips`, sur la CIBLE : télécharge les fichiers que la cible n'a pas, les range dans son stockage et ajoute
 *     la ligne de cache (`saveClip`, la même mutation que la synthèse). Garde `confirmDeployment`, comme `paliers/pregen`.
 *
 * AUCUN APPEL À ELEVENLABS, DONC AUCUN CRÉDIT. Les décisions (quelles lignes, quelles adresses) sont dans
 * `cacheCopyPlan.ts`, testées sans base. En particulier : seules les voix et les modèles que la cible lit sont copiés, une
 * ligne n'écrase jamais une ligne existante, et l'adresse doit être un hôte Convex.
 *
 * RUNTIME PAR DÉFAUT, sans `"use node"` : `fetch` et le stockage suffisent.
 */
import { v } from "convex/values";
import { internalAction, internalQuery } from "../_generated/server";
import { internal } from "../_generated/api";
import { assertTargetedDeployment } from "../testSeedsSchool";
import { MIN_AUDIO_BYTES, voiceConfig, voiceFor, type SpeechLang } from "./elevenlabs";
import { MAX_COPY_BYTES, isAllowedSourceUrl, planCopy, voiceKey, type SourceClip } from "./cacheCopyPlan";

/** Lignes lues par page : chacune demande l'adresse d'un fichier. */
const MAX_PAGE = 200;
/** Lignes acceptées par appel d'import : chacune est un téléchargement. */
const MAX_IMPORT = 200;
/** Téléchargements en même temps. */
const PARALLEL = 4;

export type ListPage = { clips: SourceClip[]; isDone: boolean; cursor: string };

/** SOURCE : une page du cache, avec l'adresse de chaque fichier. */
export const listClips = internalQuery({
  args: { cursor: v.union(v.string(), v.null()), numItems: v.number() },
  handler: async (ctx, args): Promise<ListPage> => {
    const numItems = Math.min(Math.max(Math.floor(args.numItems), 1), MAX_PAGE);
    const page = await ctx.db.query("arabicAudioClips").paginate({ cursor: args.cursor, numItems });
    const clips: SourceClip[] = await Promise.all(
      page.page.map(async (row) => ({
        cacheKey: row.cacheKey,
        text: row.text,
        voiceId: row.voiceId,
        modelId: row.modelId,
        bytes: row.bytes,
        url: await ctx.storage.getUrl(row.storageId),
      })),
    );
    return { clips, isDone: page.isDone, cursor: page.continueCursor };
  },
});

export type CopySummary = {
  dryRun: boolean;
  received: number;
  toCopy: number;
  alreadyCached: number;
  otherVoice: number;
  badKey: number;
  badSize: number;
  noUrl: number;
  badUrl: number;
  duplicate: number;
  copied: number;
  failed: string[];
};

const sourceClip = v.object({
  cacheKey: v.string(),
  text: v.string(),
  voiceId: v.string(),
  modelId: v.string(),
  bytes: v.number(),
  url: v.union(v.string(), v.null()),
});

function hostOf(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

/** CIBLE : range les sons que la cible n'a pas. À blanc, ne fait que compter. */
export const importClips = internalAction({
  args: { confirmDeployment: v.string(), dryRun: v.optional(v.boolean()), clips: v.array(sourceClip) },
  handler: async (ctx, args): Promise<CopySummary> => {
    assertTargetedDeployment(args.confirmDeployment);
    if (args.clips.length > MAX_IMPORT) {
      throw new Error(`Trop de lignes d'un coup (${args.clips.length}) : ${MAX_IMPORT} au plus par appel.`);
    }
    // Sans configuration, on ne sait pas quelles voix la cible lit : rien ne se copie au hasard.
    const config = voiceConfig();
    if (!config) throw new Error("ELEVENLABS_API_KEY absente de la cible : on ne sait pas quelles voix elle lit.");
    const allowedVoices = new Set(
      (["fr", "ar", "en"] as SpeechLang[]).map((lang) => {
        const voice = voiceFor(config, lang);
        return voiceKey(voice.voiceId, voice.modelId);
      }),
    );
    const hits: string[] = await ctx.runQuery(internal.voice.warm.cachedKeys, { cacheKeys: args.clips.map((clip) => clip.cacheKey) });
    const targetHost = hostOf(process.env.CONVEX_CLOUD_URL);
    const plan = planCopy({ clips: args.clips, allowedVoices, cached: new Set(hits), targetHost });

    const summary: CopySummary = {
      dryRun: args.dryRun === true,
      received: args.clips.length,
      toCopy: plan.toCopy.length,
      alreadyCached: plan.alreadyCached,
      otherVoice: plan.otherVoice,
      badKey: plan.badKey,
      badSize: plan.badSize,
      noUrl: plan.noUrl,
      badUrl: plan.badUrl,
      duplicate: plan.duplicate,
      copied: 0,
      failed: [],
    };
    if (summary.dryRun) return summary;

    for (let at = 0; at < plan.toCopy.length; at += PARALLEL) {
      const results = await Promise.all(
        plan.toCopy.slice(at, at + PARALLEL).map(async (clip) => {
          try {
            const response = await fetch(clip.url as string);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            // Une redirection ne sort pas de la liste des hôtes permis.
            if (!isAllowedSourceUrl(response.url, targetHost)) throw new Error("adresse finale refusée");
            const type = response.headers.get("content-type") ?? "";
            if (!/^audio\//i.test(type) && !/^application\/octet-stream/i.test(type)) throw new Error(`type ${type}`);
            const audio = await response.blob();
            if (audio.size < MIN_AUDIO_BYTES || audio.size > MAX_COPY_BYTES) throw new Error(`taille ${audio.size}`);
            const storageId = await ctx.storage.store(audio);
            await ctx.runMutation(internal.arabic.db.saveClip, {
              cacheKey: clip.cacheKey,
              text: clip.text,
              voiceId: clip.voiceId,
              modelId: clip.modelId,
              storageId,
              bytes: audio.size,
            });
            return { ok: true as const, text: clip.text };
          } catch (error) {
            console.error("[copie du cache] échec", clip.text, error);
            return { ok: false as const, text: clip.text };
          }
        }),
      );
      for (const result of results) {
        if (result.ok) summary.copied += 1;
        else summary.failed.push(result.text);
      }
    }
    return summary;
  },
});
