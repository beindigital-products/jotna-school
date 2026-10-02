/**
 * LES SONS DU HORS-LIGNE — préparer d'un coup la voix de Pio pour le téléphone.
 *
 * Les versions précédentes de l'application demandaient un son à la fois
 * (`voice/exercisePrompt.speak`, `arabic/voice.speak`, gardées pour elles).
 * Sans réseau, plus rien ne se demande : l'application télécharge donc à
 * l'avance, quand elle a du réseau, la consigne de chaque
 * exercice de la classe pour un enfant qui apprend à lire (CI, CP), et tous
 * les sons du module d'arabe quand son école l'a allumé
 * (`lib/offline/clips.ts`). Cette action lui rend l'adresse de chacun.
 *
 * MÊMES GARDES, MÊME CACHE, MÊME VOIX que la synthèse à la demande. Les
 * références sont celles que les écrans envoient déjà — un exercice, une
 * lettre, un item de leçon — jamais un texte libre. Un son déjà synthétisé
 * pour un autre enfant est servi tel quel (`arabicAudioClips`) ; un son neuf
 * est synthétisé ici, au plus `MAX_NEW_PER_CALL` par appel, et compté dans
 * `arabicVoiceUsage` comme les autres. Le reste répond `pending` :
 * l'application rappelle, jusqu'à ce que tout soit prêt.
 *
 * QUI PEUT DEMANDER QUOI :
 *   - la consigne d'un exercice : un élève dont l'accès est ouvert, d'une
 *     classe qui apprend à lire, sur un exercice d'un palier de SA classe —
 *     ou d'une variation de SA tentative ;
 *   - un son d'arabe : un élève dont l'école a allumé le module.
 *
 * RUNTIME PAR DÉFAUT, sans `"use node"` : `fetch`, le stockage et la
 * configuration (`voice/elevenlabs.ts`) suffisent. Le fichier tient donc
 * aussi ses requêtes internes.
 */
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { action, internalQuery } from "../_generated/server";
import { internal } from "../_generated/api";
import type { Doc, Id } from "../_generated/dataModel";
import { checkAccess } from "../access";
import { topicOpenTo } from "../accessRules";
import { isReadingLearnerClass } from "../curriculum";
import { moduleAccessForProfile } from "../modules";
import { resolveSpeech } from "../arabic/speechText";
import { speakablePrompt } from "../voice/speakable";
import { clipCacheKey, synthesize, voiceConfig } from "../voice/elevenlabs";
import { clipRequestKey, clipRequestValidator, type ClipResult } from "./contract";

/** Une synthèse prend une à deux secondes : douze tiennent largement dans un appel. */
const MAX_NEW_PER_CALL = 12;
/** Les références d'un appel ; l'application découpe en lots. */
const MAX_REQUESTS = 400;

type PlannedClip =
  | { key: string; ok: true; text: string; lang: "fr" | "ar" }
  | { key: string; ok: false; reason: string };

/** Ce que chaque référence fait dire, si l'appelant a le droit de l'entendre. */
export const plan = internalQuery({
  args: { userId: v.string(), requests: v.array(clipRequestValidator) },
  handler: async (
    ctx,
    args,
  ): Promise<{ studentId: Id<"profiles"> | null; clips: PlannedClip[] }> => {
    const refuse = (reason: string) => ({
      studentId: null,
      clips: args.requests.map((r) => ({ key: clipRequestKey(r), ok: false as const, reason })),
    });

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();
    if (!profile || profile.role !== "student") return refuse("not_allowed");
    const access = await checkAccess(ctx, profile);
    if (!access.ok) return refuse("not_allowed");

    const readsAloud = isReadingLearnerClass(profile.class);
    const arabicEnabled = (await moduleAccessForProfile(ctx, profile, "arabe_coran")).enabled;
    const caller = { role: profile.role, studentClass: profile.class ?? null };

    const palierCache = new Map<string, Doc<"paliers"> | null>();
    const palierOf = async (id: Id<"paliers">) => {
      if (!palierCache.has(id)) palierCache.set(id, await ctx.db.get(id));
      return palierCache.get(id) ?? null;
    };

    const clips: PlannedClip[] = [];
    for (const request of args.requests) {
      const key = clipRequestKey(request);
      if (request.kind === "arabic") {
        if (!arabicEnabled) {
          clips.push({ key, ok: false, reason: "not_allowed" });
          continue;
        }
        const speech = resolveSpeech(request.ref);
        clips.push(
          speech
            ? { key, ok: true, text: speech.text, lang: speech.lang }
            : { key, ok: false, reason: "unknown_text" },
        );
        continue;
      }

      if (!readsAloud) {
        clips.push({ key, ok: false, reason: "not_allowed" });
        continue;
      }
      const exercise = await ctx.db.get(request.exerciseId);
      if (!exercise || !exercise.palierId) {
        clips.push({ key, ok: false, reason: "unknown_text" });
        continue;
      }
      const palier = await palierOf(exercise.palierId);
      let allowed = palier !== null && topicOpenTo(caller, palier.class);
      if (allowed && exercise.palierAttemptId) {
        const attempt = await ctx.db.get(exercise.palierAttemptId);
        allowed = attempt?.userId === profile._id;
      }
      if (!allowed) {
        clips.push({ key, ok: false, reason: "not_allowed" });
        continue;
      }
      const text = speakablePrompt(exercise.prompt);
      clips.push(text ? { key, ok: true, text, lang: "fr" } : { key, ok: false, reason: "unknown_text" });
    }
    return { studentId: profile._id, clips };
  },
});

/** Les sons déjà synthétisés, par clé de cache, avec leur adresse. */
export const findMany = internalQuery({
  args: { cacheKeys: v.array(v.string()) },
  handler: async (ctx, args) => {
    const out: Record<string, { storageId: Id<"_storage">; url: string }> = {};
    for (const cacheKey of args.cacheKeys) {
      if (out[cacheKey]) continue;
      const row = await ctx.db
        .query("arabicAudioClips")
        .withIndex("by_cacheKey", (q) => q.eq("cacheKey", cacheKey))
        .unique();
      if (!row) continue;
      const url = await ctx.storage.getUrl(row.storageId);
      if (url) out[cacheKey] = { storageId: row.storageId, url };
    }
    return out;
  },
});

export const prepareClips = action({
  args: { requests: v.array(clipRequestValidator) },
  handler: async (ctx, args): Promise<ClipResult[]> => {
    const requests = args.requests.slice(0, MAX_REQUESTS);
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return requests.map((r) => ({ key: clipRequestKey(r), status: "unavailable", reason: "not_allowed" }));
    }

    const planned: { studentId: Id<"profiles"> | null; clips: PlannedClip[] } = await ctx.runQuery(
      internal.offline.voice.plan,
      { userId: userId as string, requests },
    );

    const config = voiceConfig();
    if (!config) {
      return planned.clips.map((clip) => ({
        key: clip.key,
        status: "unavailable",
        reason: clip.ok ? "not_configured" : clip.reason,
      }));
    }

    const voiceFor = (lang: "fr" | "ar") => (lang === "fr" ? config.frVoiceId : config.voiceId);
    const cacheKeys = planned.clips.map((clip) =>
      clip.ok ? clipCacheKey(voiceFor(clip.lang), config.ttsModel, clip.text) : null,
    );
    const found: Record<string, { storageId: Id<"_storage">; url: string }> = await ctx.runQuery(
      internal.offline.voice.findMany,
      { cacheKeys: cacheKeys.filter((k): k is string => k !== null) },
    );

    const results: ClipResult[] = [];
    let synthesized = 0;
    let charsBilled = 0;
    for (let i = 0; i < planned.clips.length; i++) {
      const clip = planned.clips[i];
      const cacheKey = cacheKeys[i];
      if (!clip.ok || cacheKey === null) {
        results.push({ key: clip.key, status: "unavailable", reason: clip.ok ? "unknown_text" : clip.reason });
        continue;
      }
      const hit = found[cacheKey];
      if (hit) {
        results.push({ key: clip.key, status: "ready", clipId: hit.storageId, url: hit.url });
        continue;
      }
      if (synthesized >= MAX_NEW_PER_CALL) {
        results.push({ key: clip.key, status: "pending" });
        continue;
      }

      synthesized += 1;
      const voiceId = voiceFor(clip.lang);
      let audio: Blob;
      try {
        audio = await synthesize(clip.text, config, voiceId);
      } catch (error) {
        console.error("[hors-ligne] synthèse vocale en échec", error);
        results.push({ key: clip.key, status: "pending", reason: "provider_error" });
        continue;
      }
      const storageId = await ctx.storage.store(audio);
      const saved: { storageId: Id<"_storage"> } = await ctx.runMutation(internal.arabic.db.saveClip, {
        cacheKey,
        text: clip.text,
        voiceId,
        modelId: config.ttsModel,
        storageId,
        bytes: audio.size,
      });
      charsBilled += clip.text.length;
      const url = await ctx.storage.getUrl(saved.storageId);
      if (!url) {
        results.push({ key: clip.key, status: "pending", reason: "provider_error" });
        continue;
      }
      found[cacheKey] = { storageId: saved.storageId, url };
      results.push({ key: clip.key, status: "ready", clipId: saved.storageId, url });
    }

    if (charsBilled > 0 && planned.studentId) {
      await ctx.runMutation(internal.arabic.db.addTtsChars, {
        studentId: planned.studentId,
        chars: charsBilled,
      });
    }
    return results;
  },
});
