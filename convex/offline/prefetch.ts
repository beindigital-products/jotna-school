/**
 * REMPLIR LES PALIERS DE LA CLASSE AVANT QUE L'ENFANT N'EN AIT BESOIN.
 *
 * En ligne, un palier se génère à sa première ouverture (`paliers.getBucket`).
 * Sans réseau, un palier jamais généré ne se joue pas : l'application appelle
 * donc ceci quand elle a du réseau (`lib/offline/sync.ts`), pour que chaque
 * palier de la classe de l'enfant existe avant qu'il ne parte sans connexion.
 *
 * LE MÊME CHEMIN QUE L'ÉLÈVE ET QUE LA PRÉ-GÉNÉRATION (`generateBucketCore`) :
 * même consigne, même vérification arithmétique, même cache. Le contenu d'une
 * classe est PARTAGÉ par toutes les écoles : ce qu'un enfant fait générer ici,
 * les autres le trouvent prêt. La dépense est imputée à l'élève, comme une
 * génération à l'ouverture.
 *
 * BORNÉ : quelques paliers par appel (une génération prend une quinzaine de
 * secondes), seulement ceux de SA classe, seulement ceux qui manquent ou ont
 * expiré. L'application rappelle tant qu'il en reste ; une fois la classe
 * remplie, l'appel ne coûte qu'une lecture.
 */
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { action, internalQuery } from "../_generated/server";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { isHiddenClass, type VisibleClassName } from "../curriculum";
import { effectivePalierCount } from "../palierRules";
import { generateBucketCore } from "../paliers";

/** Paliers générés par appel : trois générations tiennent en moins d'une minute. */
const MAX_PER_CALL = 3;

/**
 * Une génération qui vient d'échouer (budget, modèle indisponible) laisse sa
 * ligne en `stale`, datée de l'échec. On ne la retente pas avant ce délai :
 * sans lui, chaque élève de la classe relancerait la même génération perdue.
 */
const RETRY_AFTER_FAILURE_MS = 30 * 60 * 1000;

type Target = {
  subjectId: Id<"subjects">;
  topicId: Id<"topics">;
  palierIndex: number;
};

/** Les paliers de la classe de l'élève qui manquent, ont expiré ou sont périmés. */
export const missingPaliers = internalQuery({
  args: { profileId: v.id("profiles") },
  handler: async (ctx, args): Promise<{ class: VisibleClassName | null; targets: Target[] }> => {
    const profile = await ctx.db.get(args.profileId);
    const studentClass = profile?.class;
    if (!profile || !studentClass || isHiddenClass(studentClass)) {
      return { class: null, targets: [] };
    }
    const now = Date.now();
    const subjects = (await ctx.db.query("subjects").take(50)).sort((a, b) => a.order - b.order);
    const targets: Target[] = [];
    for (const subject of subjects) {
      const topics = (
        await ctx.db
          .query("topics")
          .withIndex("by_subjectId_class", (q) =>
            q.eq("subjectId", subject._id).eq("class", studentClass),
          )
          .take(200)
      ).sort((a, b) => a.order - b.order);
      for (const topic of topics) {
        const count = effectivePalierCount(topic);
        const paliers = await ctx.db
          .query("paliers")
          .withIndex("by_topic_class", (q) => q.eq("topicId", topic._id).eq("class", studentClass))
          .take(20);
        for (let index = 1; index <= count; index++) {
          const palier = paliers.find((p) => p.palierIndex === index);
          // « generating » : un autre appel s'en occupe déjà.
          if (palier && palier.status === "generating") continue;
          if (palier && palier.status === "cached" && palier.expiresAt > now) continue;
          if (palier && palier.status === "stale" && now - palier.generatedAt < RETRY_AFTER_FAILURE_MS) {
            continue;
          }
          targets.push({ subjectId: subject._id, topicId: topic._id, palierIndex: index });
        }
      }
    }
    return { class: studentClass as VisibleClassName, targets };
  },
});

export const preparePaliers = action({
  args: {},
  handler: async (
    ctx,
  ): Promise<{ generated: number; failed: number; remaining: number }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { generated: 0, failed: 0, remaining: 0 };
    const profile = await ctx.runQuery(internal.paliers.index.getProfileByUserId, {
      userId: userId as string,
    });
    if (!profile || profile.role !== "student") return { generated: 0, failed: 0, remaining: 0 };
    const access = await ctx.runQuery(internal.access.getAccessStateForProfile, {
      profileId: profile._id,
    });
    if (!access.ok) return { generated: 0, failed: 0, remaining: 0 };

    const { class: studentClass, targets } = await ctx.runQuery(
      internal.offline.prefetch.missingPaliers,
      { profileId: profile._id },
    );
    if (!studentClass || targets.length === 0) return { generated: 0, failed: 0, remaining: 0 };

    let generated = 0;
    let failed = 0;
    for (const target of targets.slice(0, MAX_PER_CALL)) {
      try {
        await generateBucketCore(ctx, {
          subjectId: target.subjectId,
          class: studentClass,
          topicId: target.topicId,
          palierIndex: target.palierIndex,
          userId: profile._id,
        });
        generated += 1;
      } catch (error) {
        // Budget IA atteint, modèle indisponible : le palier reste à
        // générer, l'application rappellera plus tard.
        console.error("[hors-ligne] génération d'un palier en échec", error);
        failed += 1;
      }
    }
    return {
      generated,
      failed,
      remaining: Math.max(0, targets.length - generated),
    };
  },
});
