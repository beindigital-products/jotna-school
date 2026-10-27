/**
 * PRÉCHAUFFER LA VOIX DES TUILES — synthétiser d'avance les sons que les enfants du CI vont demander.
 *
 * Sans ce script, le premier enfant qui rencontre un mot attend sa synthèse, une
 * à deux secondes (`offline/voice:prepareClips`), avant que le cache ne serve
 * tous les autres. Ici, on parcourt les paliers prêts des classes demandées, on
 * relève ce que la voix dirait (`voice/warmTexts.ts`, la même décision que le
 * serveur), et on synthétise ce que le cache n'a pas encore. Même voix, même
 * modèle, même cache (`arabicAudioClips`) que la voix à la demande : un son
 * préchauffé est servi tel quel.
 *
 * MODULE INTERNE, appelé depuis un terminal, comme `paliers/pregen` :
 *
 *     npx convex run --prod voice/warm:warmTileVoice '{"confirmDeployment":"<nom>","dryRun":true}'
 *     npx convex run --prod voice/warm:warmTileVoice '{"confirmDeployment":"<nom>","programmeKeys":["sc-ci-milieu"],"limit":10}'
 *
 * `dryRun` compte les textes, ceux qui manquent au cache, leurs caractères et le
 * coût estimé, sans rien synthétiser. `programmeKeys` borne aux thématiques
 * voulues (sans lui : toutes celles des classes demandées, le CI par défaut).
 * `withPrompts` dit aussi les consignes. `limit` borne les sons neufs d'une
 * exécution (une action Convex vit dix minutes au plus) : relancer jusqu'à
 * `remaining: 0`.
 *
 * LA DÉPENSE EST RÉELLE : chaque son neuf est un appel à ElevenLabs, imputé à
 * aucun élève (le compteur par élève de `arabicVoiceUsage` n'est pas touché).
 * D'où `confirmDeployment`, la même garde que `paliers/pregen`.
 */
import { v } from "convex/values";
import { internalAction, internalQuery } from "../_generated/server";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { visibleClassValidator, type VisibleClassName } from "../curriculum";
import { assertTargetedDeployment } from "../testSeedsSchool";
import { clipCacheKey, synthesize, voiceConfig, voiceFor } from "./elevenlabs";
import { estimatedCostUsd, spokenClipsOf, withoutEmbedded, type WarmClip } from "./warmTexts";

/** Paliers lus par appel : cent paliers et leurs exercices tiennent largement dans une requête. */
const PAGE = 100;
/** Clés de cache vérifiées par appel. */
const LOOKUP_CHUNK = 200;
/** Sons neufs d'une exécution quand `limit` n'est pas donné : environ une minute de synthèse. */
const DEFAULT_LIMIT = 60;
const MAX_LIMIT = 400;
/** Synthèses en même temps : un petit nombre, le compte ElevenLabs limite la simultanéité. */
const PARALLEL = 3;
const DEFAULT_CLASSES: VisibleClassName[] = ["CI"];

type TextsPage = { clips: WarmClip[]; paliers: number; exercises: number; isDone: boolean; cursor: string };

export type WarmSummary = {
  dryRun: boolean;
  /** Les paliers prêts lus et leurs exercices publiés. */
  paliers: number;
  exercises: number;
  /** Les textes différents que la voix dirait, ceux que le cache a déjà, ceux qui lui manquent. */
  texts: number;
  /** Les textes que l'application embarque (`lib/voice-static`) : écartés, le serveur n'a pas à les synthétiser. */
  embedded: number;
  alreadyCached: number;
  missing: number;
  missingChars: number;
  estimatedCostUsd: number;
  /** Les sons neufs de cette exécution (aucun à blanc), leurs caractères, les échecs et ce qui reste à faire. */
  synthesized: number;
  synthesizedChars: number;
  failed: string[];
  remaining: number;
};

/**
 * Les textes que la voix dirait pour une page de paliers. Seuls comptent les
 * paliers prêts (`cached`) : un palier invalidé sera refait, ses sons seraient
 * pour rien. Seuls comptent les exercices que l'enfant voit : publiés, du palier
 * lui-même (ni variation d'une tentative, ni exercice personnalisé).
 */
export const textsPage = internalQuery({
  args: {
    cursor: v.union(v.string(), v.null()),
    numItems: v.number(),
    classes: v.array(visibleClassValidator),
    programmeKeys: v.optional(v.array(v.string())),
    withPrompts: v.boolean(),
  },
  handler: async (ctx, args): Promise<TextsPage> => {
    const page = await ctx.db.query("paliers").paginate({ cursor: args.cursor, numItems: args.numItems });
    const classes = new Set<string>(args.classes);
    const keys = args.programmeKeys ? new Set(args.programmeKeys) : null;
    const programmeKeyOf = new Map<Id<"topics">, string | null>();
    const subjectNameOf = new Map<Id<"subjects">, string | null>();
    const clips = new Map<string, WarmClip>();
    let paliers = 0;
    let exercises = 0;

    for (const palier of page.page) {
      if (palier.status !== "cached" || !classes.has(palier.class)) continue;
      if (!programmeKeyOf.has(palier.topicId)) {
        programmeKeyOf.set(palier.topicId, (await ctx.db.get(palier.topicId))?.programmeKey ?? null);
      }
      const programmeKey = programmeKeyOf.get(palier.topicId) ?? null;
      if (keys && (programmeKey === null || !keys.has(programmeKey))) continue;
      if (!subjectNameOf.has(palier.subjectId)) {
        subjectNameOf.set(palier.subjectId, (await ctx.db.get(palier.subjectId))?.name ?? null);
      }
      const subjectName = subjectNameOf.get(palier.subjectId) ?? null;

      paliers += 1;
      const rows = await ctx.db
        .query("exercises")
        .withIndex("by_palierId", (q) => q.eq("palierId", palier._id))
        .collect();
      for (const row of rows) {
        if (row.status !== "published" || row.personalizedFor || row.palierAttemptId || row.needsManualReview) continue;
        exercises += 1;
        const spoken = spokenClipsOf({
          learnerClass: palier.class,
          topic: { programmeKey, subjectName },
          exercise: { type: row.type, prompt: row.prompt, payload: row.payload },
          withPrompt: args.withPrompts,
        });
        for (const clip of spoken) clips.set(`${clip.lang}|${clip.text}`, clip);
      }
    }
    return { clips: [...clips.values()], paliers, exercises, isDone: page.isDone, cursor: page.continueCursor };
  },
});

/** Celles de ces clés que le cache audio a déjà. */
export const cachedKeys = internalQuery({
  args: { cacheKeys: v.array(v.string()) },
  handler: async (ctx, args): Promise<string[]> => {
    const found: string[] = [];
    for (const cacheKey of args.cacheKeys) {
      const row = await ctx.db
        .query("arabicAudioClips")
        .withIndex("by_cacheKey", (q) => q.eq("cacheKey", cacheKey))
        .first();
      if (row) found.push(cacheKey);
    }
    return found;
  },
});

export const warmTileVoice = internalAction({
  args: {
    confirmDeployment: v.string(),
    classes: v.optional(v.array(visibleClassValidator)),
    programmeKeys: v.optional(v.array(v.string())),
    withPrompts: v.optional(v.boolean()),
    dryRun: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<WarmSummary> => {
    assertTargetedDeployment(args.confirmDeployment);
    const config = voiceConfig();
    if (!config) {
      throw new Error("ELEVENLABS_API_KEY n'est pas réglée sur ce déploiement : la voix est éteinte, rien à préchauffer.");
    }
    const dryRun = args.dryRun === true;
    const limit = Math.min(MAX_LIMIT, Math.max(0, Math.floor(args.limit ?? DEFAULT_LIMIT)));

    // Ce que la voix dirait. Les paliers se lisent par pages : la table n'est pas bornée.
    const found = new Map<string, WarmClip>();
    let paliers = 0;
    let exercises = 0;
    let cursor: string | null = null;
    for (;;) {
      const page: TextsPage = await ctx.runQuery(internal.voice.warm.textsPage, {
        cursor,
        numItems: PAGE,
        classes: args.classes ?? DEFAULT_CLASSES,
        ...(args.programmeKeys ? { programmeKeys: args.programmeKeys } : {}),
        withPrompts: args.withPrompts === true,
      });
      for (const clip of page.clips) found.set(`${clip.lang}|${clip.text}`, clip);
      paliers += page.paliers;
      exercises += page.exercises;
      if (page.isDone) break;
      cursor = page.cursor;
    }

    // Ce que le cache a déjà : la clé porte la voix ET le modèle, comme à la demande.
    const everything = [...found.values()].sort((a, b) => a.text.localeCompare(b.text) || a.lang.localeCompare(b.lang));
    // Un son que l'application embarque (`lib/voice-static`) ne passe jamais par le cache du serveur : le payer ici serait
    // un crédit perdu. Seule une version de l'application qui ne les embarque pas les demanderait, à la demande.
    const { kept: all, embedded } = withoutEmbedded(everything);
    const keyOf = (clip: WarmClip) => {
      const voice = voiceFor(config, clip.lang);
      return clipCacheKey(voice.voiceId, voice.modelId, clip.text);
    };
    const cached = new Set<string>();
    for (let i = 0; i < all.length; i += LOOKUP_CHUNK) {
      const hits: string[] = await ctx.runQuery(internal.voice.warm.cachedKeys, {
        cacheKeys: all.slice(i, i + LOOKUP_CHUNK).map(keyOf),
      });
      for (const key of hits) cached.add(key);
    }
    const missing = all.filter((clip) => !cached.has(keyOf(clip)));
    const missingChars = missing.reduce((sum, clip) => sum + clip.text.length, 0);

    const summary: WarmSummary = {
      dryRun,
      paliers,
      exercises,
      texts: all.length,
      embedded,
      alreadyCached: all.length - missing.length,
      missing: missing.length,
      missingChars,
      estimatedCostUsd: estimatedCostUsd(missingChars),
      synthesized: 0,
      synthesizedChars: 0,
      failed: [],
      remaining: missing.length,
    };
    if (dryRun) return summary;

    const todo = missing.slice(0, limit);
    for (let i = 0; i < todo.length; i += PARALLEL) {
      const results = await Promise.all(
        todo.slice(i, i + PARALLEL).map(async (clip) => {
          const { text } = clip;
          const voice = voiceFor(config, clip.lang);
          try {
            const audio = await synthesize(text, config, voice);
            const storageId = await ctx.storage.store(audio);
            await ctx.runMutation(internal.arabic.db.saveClip, {
              cacheKey: keyOf(clip),
              text,
              voiceId: voice.voiceId,
              modelId: voice.modelId,
              storageId,
              bytes: audio.size,
            });
            return { text, ok: true };
          } catch (error) {
            console.error("[préchauffage] synthèse en échec", text, error);
            return { text, ok: false };
          }
        }),
      );
      for (const result of results) {
        if (result.ok) {
          summary.synthesized += 1;
          summary.synthesizedChars += result.text.length;
        } else {
          summary.failed.push(result.text);
        }
      }
    }
    summary.remaining = missing.length - summary.synthesized;
    return summary;
  },
});
