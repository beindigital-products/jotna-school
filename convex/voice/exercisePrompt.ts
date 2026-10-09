/**
 * LE LECTEUR DE CONSIGNES — Pio dit la consigne d'un exercice à voix haute.
 *
 * POUR QUI : les élèves des classes où l'on apprend à lire (CI, CP —
 * `isReadingLearnerClass`, `convex/curriculum.ts`). Ils ne lisent pas encore
 * « Fais correspondre les mots avec leur son » : ils l'entendent. L'écran
 * (`components/exercises/prompt-reader.tsx`) la fait dire à chaque exercice
 * et la redit quand l'enfant touche le haut-parleur.
 *
 * ON NE SYNTHÉTISE QUE CE QUE L'EXERCICE CONTIENT. L'action prend une
 * RÉFÉRENCE — l'exercice et la tentative de palier de l'élève —, jamais un
 * texte : exposer « dis ce que je te donne » ferait de ce dépôt un
 * générateur de voix gratuit (même règle que `convex/arabic/voice.ts`).
 * `promptToRead` vérifie que l'élève joue ce palier et que l'exercice en
 * fait partie, puis rend le texte à dire (`speakable.ts`).
 *
 * MIS EN CACHE COMME L'ARABE : même voix (`elevenlabs.ts`), même table
 * (`arabicAudioClips`), même compteur de caractères facturés
 * (`arabicVoiceUsage`). Une consigne n'est synthétisée qu'une fois pour tous
 * les enfants ; les paliers étant pré-générés, la dépense s'éteint d'elle-même.
 *
 * RUNTIME PAR DÉFAUT, sans `"use node"` : la synthèse n'a besoin que de
 * `fetch` et du stockage. Le fichier tient donc aussi sa requête interne.
 *
 * IL NE LÈVE JAMAIS. Sans clé, sans réseau, l'action rend « indisponible » :
 * l'exercice reste jouable, l'adulte qui accompagne lit le texte.
 */

import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { action, internalQuery } from "../_generated/server";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { checkAccess } from "../access";
import { isReadingLearnerClass } from "../curriculum";
import { clipCacheKey, synthesize, voiceConfig, voiceFor } from "./elevenlabs";
import { speakablePrompt } from "./speakable";

type PromptTarget =
  | { ok: true; text: string; studentId: Id<"profiles"> }
  | { ok: false; reason: "not_allowed" | "unknown_text" };

type SpeakResult =
  | { status: "ready"; url: string; cached: boolean }
  | {
      status: "unavailable";
      reason: "not_configured" | "not_allowed" | "unknown_text" | "provider_error";
    };

/**
 * Le texte à dire, si l'appelant a le droit de l'entendre.
 *
 * INTERNE : reçoit l'utilisateur établi par `speak`. Les gardes sont celles
 * de `paliers.index.getExercisesForPalier`, qui a montré l'exercice à
 * l'écran — un élève, dont l'accès est ouvert, propriétaire de la tentative,
 * et un exercice du palier (ou de la tentative, après une régénération) —,
 * plus la classe : seuls les enfants qui apprennent à lire font parler Pio.
 * La classe est celle de l'ENFANT ; à défaut, celle du palier.
 */
export const promptToRead = internalQuery({
  args: {
    userId: v.string(),
    exerciseId: v.id("exercises"),
    palierAttemptId: v.id("palierAttempts"),
  },
  handler: async (ctx, args): Promise<PromptTarget> => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();
    if (!profile || profile.role !== "student") {
      return { ok: false, reason: "not_allowed" };
    }
    const access = await checkAccess(ctx, profile);
    if (!access.ok) return { ok: false, reason: "not_allowed" };

    const attempt = await ctx.db.get(args.palierAttemptId);
    if (!attempt || attempt.userId !== profile._id) {
      return { ok: false, reason: "not_allowed" };
    }
    const palier = await ctx.db.get(attempt.palierId);
    if (!isReadingLearnerClass(profile.class ?? palier?.class)) {
      return { ok: false, reason: "not_allowed" };
    }

    const exercise = await ctx.db.get(args.exerciseId);
    const inPalier =
      exercise !== null &&
      (exercise.palierId === attempt.palierId ||
        exercise.palierAttemptId === attempt._id);
    if (!exercise || !inPalier) return { ok: false, reason: "unknown_text" };

    const text = speakablePrompt(exercise.prompt);
    if (!text) return { ok: false, reason: "unknown_text" };
    return { ok: true, text, studentId: profile._id };
  },
});

export const speak = action({
  args: {
    exerciseId: v.id("exercises"),
    palierAttemptId: v.id("palierAttempts"),
  },
  handler: async (ctx, args): Promise<SpeakResult> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { status: "unavailable", reason: "not_allowed" };

    const target: PromptTarget = await ctx.runQuery(
      internal.voice.exercisePrompt.promptToRead,
      {
        userId: userId as string,
        exerciseId: args.exerciseId,
        palierAttemptId: args.palierAttemptId,
      },
    );
    if (!target.ok) return { status: "unavailable", reason: target.reason };

    const config = voiceConfig();
    if (!config) return { status: "unavailable", reason: "not_configured" };
    // La voix des consignes françaises : celle de Pio, sauf réglage.
    const voice = voiceFor(config, "fr");
    const cacheKey = clipCacheKey(voice.voiceId, voice.modelId, target.text);

    const cached = await ctx.runQuery(internal.arabic.db.findClip, { cacheKey });
    if (cached) {
      const url = await ctx.storage.getUrl(cached.storageId);
      if (url) return { status: "ready", url, cached: true };
      // Le fichier a disparu du stockage sans que la ligne suive : on
      // resynthétise plutôt que de rendre une URL morte.
    }

    let audio: Blob;
    try {
      audio = await synthesize(target.text, config, voice);
    } catch (error) {
      console.error("[consigne] synthèse vocale en échec", error);
      return { status: "unavailable", reason: "provider_error" };
    }

    const storageId = await ctx.storage.store(audio);
    const saved: { storageId: Id<"_storage"> } = await ctx.runMutation(
      internal.arabic.db.saveClip,
      {
        cacheKey,
        text: target.text,
        voiceId: voice.voiceId,
        modelId: voice.modelId,
        storageId,
        bytes: audio.size,
      },
    );
    await ctx.runMutation(internal.arabic.db.addTtsChars, {
      studentId: target.studentId,
      chars: target.text.length,
    });

    const url = await ctx.storage.getUrl(saved.storageId);
    if (!url) return { status: "unavailable", reason: "provider_error" };
    return { status: "ready", url, cached: false };
  },
});
