import { v } from "convex/values";
import { internalAction, internalMutation, internalQuery } from "../_generated/server";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import {
  VISIBLE_CLASSES,
  isHiddenClass,
  visibleClassValidator,
  type VisibleClassName,
} from "../curriculum";
import { effectivePalierCount } from "../palierRules";
import { assertTargetedDeployment } from "../testSeedsSchool";
import { generateBucketCore, isBaseExercise } from "./index";
import { repairMathExercise } from "./mathRepair";
import { repairDragDrop as repairDragDropExercise } from "./dragDropRepair";
import { PALIER_SIZE } from "./scoring";

// ---------------------------------------------------------------------------
// PRÉ-GÉNÉRER LES EXERCICES — remplir les paliers avant que l'élève n'arrive.
//
// Sans ce script, chaque palier se génère à la première ouverture par un
// élève : vingt secondes d'attente devant un écran, et une école qui découvre
// le contenu en même temps que l'enfant. Ici, on parcourt les thématiques des
// niveaux demandés et on génère tout palier manquant ou périmé, par le MÊME
// chemin que l'élève (`generateBucketCore`) : même consigne, même vérification
// arithmétique, même table. Le contenu est marqué `preGenerated`.
//
// MODULE INTERNE, appelé depuis un terminal, comme `testSeedsSchool` :
//
//     npx convex run paliers/pregen:run '{"confirmDeployment":"<nom>","dryRun":true}'
//     npx convex run paliers/pregen:run '{"confirmDeployment":"<nom>","classes":["CM1","CM2"],"limit":12}'
//
// `dryRun` compte ce qui manque et estime le coût sans rien générer. Sans
// `classes`, tout l'élémentaire. `limit` borne une exécution (une action
// Convex vit dix minutes au plus) : relancer jusqu'à `remaining: 0`.
//
// LA DÉPENSE EST RÉELLE : chaque palier est un appel au modèle, imputé à
// personne (`userId` absent : appel système) et compté dans le budget mensuel
// de la passerelle. D'où `confirmDeployment`, la même garde que les jeux de
// données de test.
// ---------------------------------------------------------------------------

/**
 * Ordre de grandeur d'un palier avec le modèle par défaut (`gpt-4o-mini`), en
 * dollars : 0,00094 mesuré le 27 septembre 2026 (858 jetons en entrée, 1 354
 * en sortie). Arrondi au-dessus, pour une estimation qui ne surprend pas.
 */
const ESTIMATED_COST_PER_BUCKET_USD = 0.0015;

type PlanItem = {
  subjectId: Id<"subjects">;
  subjectName: string;
  topicId: Id<"topics">;
  topicName: string;
  class: VisibleClassName;
  palierIndex: number;
  palierCount: number;
};

type Plan = {
  plan: PlanItem[];
  alreadyCached: number;
  topicsWithoutClass: string[];
};

/**
 * Ce qu'il reste à générer : chaque (thématique, palier) sans palier en
 * cache frais, pour les niveaux demandés.
 */
export const listPlan = internalQuery({
  args: {
    classes: v.array(visibleClassValidator),
    subjectIds: v.optional(v.array(v.id("subjects"))),
  },
  handler: async (ctx, args): Promise<Plan> => {
    const wanted = new Set<string>(args.classes);
    const subjects = (await ctx.db.query("subjects").take(50))
      .filter((s) => !args.subjectIds || args.subjectIds.includes(s._id))
      .sort((a, b) => a.order - b.order);

    const now = Date.now();
    const plan: PlanItem[] = [];
    const topicsWithoutClass: string[] = [];
    let alreadyCached = 0;

    for (const subject of subjects) {
      const topics = (
        await ctx.db
          .query("topics")
          .withIndex("by_subjectId", (q) => q.eq("subjectId", subject._id))
          .take(1000)
      )
        .filter((t) => !isHiddenClass(t.class))
        .sort((a, b) => a.order - b.order);

      for (const topic of topics) {
        if (!topic.class) {
          topicsWithoutClass.push(`${subject.name} / ${topic.name}`);
          continue;
        }
        if (!wanted.has(topic.class)) continue;
        const cls = topic.class as VisibleClassName;
        const palierCount = effectivePalierCount(topic);
        for (let palierIndex = 1; palierIndex <= palierCount; palierIndex++) {
          const existing = await ctx.db
            .query("paliers")
            .withIndex("by_bucket", (q) =>
              q
                .eq("subjectId", subject._id)
                .eq("class", cls)
                .eq("topicId", topic._id)
                .eq("palierIndex", palierIndex),
            )
            .first();
          if (existing && existing.status === "cached" && existing.expiresAt > now) {
            alreadyCached += 1;
            continue;
          }
          plan.push({
            subjectId: subject._id,
            subjectName: subject.name,
            topicId: topic._id,
            topicName: topic.name,
            class: cls,
            palierIndex,
            palierCount,
          });
        }
      }
    }
    return { plan, alreadyCached, topicsWithoutClass };
  },
});

type BucketOutcome = PlanItem & {
  ok: boolean;
  cacheHit?: boolean;
  qaStatus?: string;
  error?: string;
};

type RunSummary = {
  dryRun: boolean;
  toGenerate: number;
  alreadyCached: number;
  estimatedCostUsd: number;
  topicsWithoutClass: string[];
  sample?: PlanItem[];
  generated?: number;
  pendingHuman?: number;
  failed?: BucketOutcome[];
  remaining?: number;
};

export const run = internalAction({
  args: {
    confirmDeployment: v.string(),
    classes: v.optional(v.array(visibleClassValidator)),
    subjectIds: v.optional(v.array(v.id("subjects"))),
    /** Paliers générés au plus par exécution (1 à 40, 10 par défaut). */
    limit: v.optional(v.number()),
    /** Générations menées de front (1 à 5, 3 par défaut). */
    concurrency: v.optional(v.number()),
    dryRun: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<RunSummary> => {
    assertTargetedDeployment(args.confirmDeployment);

    const classes = args.classes ?? [...VISIBLE_CLASSES];
    const { plan, alreadyCached, topicsWithoutClass }: Plan = await ctx.runQuery(
      internal.paliers.pregen.listPlan,
      { classes, subjectIds: args.subjectIds },
    );
    const estimatedCostUsd =
      Math.round(plan.length * ESTIMATED_COST_PER_BUCKET_USD * 100) / 100;

    if (args.dryRun) {
      return {
        dryRun: true,
        toGenerate: plan.length,
        alreadyCached,
        estimatedCostUsd,
        topicsWithoutClass,
        sample: plan.slice(0, 8),
      };
    }

    const limit = Math.max(1, Math.min(args.limit ?? 10, 40));
    const concurrency = Math.max(1, Math.min(args.concurrency ?? 3, 5));
    const batch = plan.slice(0, limit);
    const outcomes: BucketOutcome[] = [];

    // Quelques générations de front : le modèle accepte plusieurs appels, et
    // une action ne vit que dix minutes.
    let cursor = 0;
    async function worker() {
      while (cursor < batch.length) {
        const item = batch[cursor++];
        try {
          const result = await generateBucketCore(ctx, {
            subjectId: item.subjectId,
            class: item.class,
            topicId: item.topicId,
            palierIndex: item.palierIndex,
            preGenerated: true,
          });
          outcomes.push({
            ...item,
            ok: true,
            cacheHit: result.cacheHit,
            qaStatus: result.qaStatus,
          });
        } catch (error) {
          outcomes.push({
            ...item,
            ok: false,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }
    await Promise.all(Array.from({ length: concurrency }, () => worker()));

    return {
      dryRun: false,
      toGenerate: plan.length,
      alreadyCached,
      estimatedCostUsd,
      topicsWithoutClass,
      generated: outcomes.filter((o) => o.ok && !o.cacheHit).length,
      pendingHuman: outcomes.filter((o) => o.ok && o.qaStatus === "pending_human").length,
      failed: outcomes.filter((o) => !o.ok),
      remaining: plan.length - batch.length,
    };
  },
});

/**
 * NETTOYER LES DOUBLONS D'UNE RÉGÉNÉRATION. Avant que `insertGeneratedExercises`
 * ne fasse le ménage, un palier périmé puis régénéré cumulait deux jeux
 * d'exercices. Pour chaque palier en cache qui porte plus de dix exercices de
 * base, on ne garde que la dernière génération : ceux créés après
 * `generatedAt`. `dryRun` compte sans supprimer.
 *
 *     npx convex run paliers/pregen:dedupe '{"confirmDeployment":"<nom>","dryRun":true}'
 */
export const dedupe = internalMutation({
  args: { confirmDeployment: v.string(), dryRun: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    assertTargetedDeployment(args.confirmDeployment);
    const paliers = await ctx.db.query("paliers").take(1000);
    let paliersTouched = 0;
    let exercisesDeleted = 0;
    for (const palier of paliers) {
      if (palier.status !== "cached") continue;
      const base = (
        await ctx.db
          .query("exercises")
          .withIndex("by_palierId", (q) => q.eq("palierId", palier._id))
          .take(200)
      ).filter(isBaseExercise);
      if (base.length <= PALIER_SIZE) continue;
      const stale = base.filter((ex) => ex._creationTime < palier.generatedAt);
      if (stale.length === 0) continue;
      paliersTouched += 1;
      exercisesDeleted += stale.length;
      if (!args.dryRun) {
        for (const ex of stale) await ctx.db.delete(ex._id);
      }
    }
    return {
      dryRun: args.dryRun === true,
      paliersScanned: paliers.length,
      paliersTouched,
      exercisesDeleted,
    };
  },
});

/**
 * MARQUER DES PALIERS À REFAIRE. Quand la consigne de génération change (un
 * mix d'écritures, une règle de plus), le contenu déjà en cache ne la
 * reflète pas : on passe les paliers visés en `stale`, et `run` les
 * régénère par le même chemin, en remplaçant leurs exercices. Les élèves
 * avec une tentative ouverte dessus la reprennent sur les nouveaux
 * exercices : à réserver au développement ou à une rentrée.
 *
 *     npx convex run paliers/pregen:invalidate '{"confirmDeployment":"<nom>","subjectIds":["..."],"classes":["CM1"]}'
 */
export const invalidate = internalMutation({
  args: {
    confirmDeployment: v.string(),
    subjectIds: v.optional(v.array(v.id("subjects"))),
    classes: v.optional(v.array(visibleClassValidator)),
    dryRun: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    assertTargetedDeployment(args.confirmDeployment);
    const wantedClasses = args.classes ? new Set<string>(args.classes) : null;
    const wantedSubjects = args.subjectIds ? new Set<string>(args.subjectIds) : null;
    const paliers = await ctx.db.query("paliers").take(1000);
    let invalidated = 0;
    for (const palier of paliers) {
      if (palier.status !== "cached") continue;
      if (isHiddenClass(palier.class)) continue;
      if (wantedClasses && !wantedClasses.has(palier.class)) continue;
      if (wantedSubjects && !wantedSubjects.has(palier.subjectId as string)) continue;
      invalidated += 1;
      if (!args.dryRun) await ctx.db.patch(palier._id, { status: "stale" });
    }
    return { dryRun: args.dryRun === true, paliersScanned: paliers.length, invalidated };
  },
});

// ---------------------------------------------------------------------------
// RÉPARER LES RÉPONSES ATTENDUES DÉJÀ EN BASE.
//
// Les paliers générés avant `paliers/mathRepair.ts` servent la réponse du
// modèle telle quelle, fausse une fois sur dix dès que deux opérations se
// combinent (« Combien font 3 fois 5 plus 2 ? » attendait 15). On repasse
// chaque exercice qui porte une expression : la valeur calculée remplace la
// clé qui diverge, exactement comme à la génération, et le palier est
// requalifié (`pending_human` seulement s'il reste un exercice à relire).
//
//     npx convex run paliers/pregen:repairMath '{"confirmDeployment":"<nom>","dryRun":true}'
//     npx convex run paliers/pregen:repairMath '{"confirmDeployment":"<nom>"}'
//
// Sans appel au modèle : ne coûte rien, se relance sans risque.
// ---------------------------------------------------------------------------

type RepairSample = {
  exerciseId: Id<"exercises">;
  prompt: string;
  /** Ce que l'exercice tenait pour juste. */
  previous: string;
  computed: string;
  change: "option" | "value" | "key";
};

type RepairBatch = {
  checked: number;
  repaired: number;
  unrepairable: number;
  cleared: number;
  paliersRequalified: number;
  samples: RepairSample[];
};

type RepairSummary = RepairBatch & { dryRun: boolean; paliersScanned: number };

const REPAIR_BATCH = 25;
const REPAIR_SAMPLES = 20;

export const listPalierIds = internalQuery({
  args: {},
  handler: async (ctx): Promise<Id<"paliers">[]> => {
    const paliers = await ctx.db.query("paliers").take(1000);
    return paliers.map((p) => p._id);
  },
});

export const repairMath = internalAction({
  args: { confirmDeployment: v.string(), dryRun: v.optional(v.boolean()) },
  handler: async (ctx, args): Promise<RepairSummary> => {
    assertTargetedDeployment(args.confirmDeployment);
    const dryRun = args.dryRun === true;
    const palierIds: Id<"paliers">[] = await ctx.runQuery(internal.paliers.pregen.listPalierIds, {});
    const totals: RepairSummary = {
      dryRun,
      paliersScanned: palierIds.length,
      checked: 0,
      repaired: 0,
      unrepairable: 0,
      cleared: 0,
      paliersRequalified: 0,
      samples: [],
    };
    for (let i = 0; i < palierIds.length; i += REPAIR_BATCH) {
      const batch: RepairBatch = await ctx.runMutation(
        internal.paliers.pregen.repairMathForPaliers,
        { palierIds: palierIds.slice(i, i + REPAIR_BATCH), dryRun },
      );
      totals.checked += batch.checked;
      totals.repaired += batch.repaired;
      totals.unrepairable += batch.unrepairable;
      totals.cleared += batch.cleared;
      totals.paliersRequalified += batch.paliersRequalified;
      for (const sample of batch.samples) {
        if (totals.samples.length < REPAIR_SAMPLES) totals.samples.push(sample);
      }
    }
    return totals;
  },
});

export const repairMathForPaliers = internalMutation({
  args: { palierIds: v.array(v.id("paliers")), dryRun: v.boolean() },
  handler: async (ctx, args): Promise<RepairBatch> => {
    const batch: RepairBatch = {
      checked: 0,
      repaired: 0,
      unrepairable: 0,
      cleared: 0,
      paliersRequalified: 0,
      samples: [],
    };
    for (const palierId of args.palierIds) {
      const palier = await ctx.db.get(palierId);
      if (!palier) continue;
      const exercises = await ctx.db
        .query("exercises")
        .withIndex("by_palierId", (q) => q.eq("palierId", palierId))
        .take(200);
      let flagged = 0;
      for (const ex of exercises) {
        const outcome = repairMathExercise({
          type: ex.type,
          prompt: ex.prompt,
          payload: ex.payload,
          answerKey: ex.answerKey,
          mathExpression: ex.mathExpression,
        });
        if (outcome.kind === "skipped") {
          if (ex.needsManualReview === true) flagged += 1;
          continue;
        }
        batch.checked += 1;
        if (outcome.kind === "repaired") {
          batch.repaired += 1;
          if (batch.samples.length < REPAIR_SAMPLES) {
            batch.samples.push({
              exerciseId: ex._id,
              prompt: ex.prompt,
              previous: outcome.previous,
              computed: outcome.answerKey,
              change: outcome.change,
            });
          }
          if (!args.dryRun) {
            await ctx.db.patch(ex._id, {
              payload: outcome.payload,
              answerKey: outcome.answerKey,
              needsManualReview: false,
            });
          }
        } else if (outcome.kind === "unrepairable") {
          batch.unrepairable += 1;
          flagged += 1;
          if (!args.dryRun && ex.needsManualReview !== true) {
            await ctx.db.patch(ex._id, { needsManualReview: true });
          }
        } else if (ex.needsManualReview === true) {
          // Juste, mais signalé : un trou que l'ancien vérificateur ne
          // savait pas lire. Le signal tombe.
          batch.cleared += 1;
          if (!args.dryRun) await ctx.db.patch(ex._id, { needsManualReview: false });
        }
      }
      // Un humain qui a tranché garde le dernier mot.
      if (palier.qaStatus !== "pending_human" && palier.qaStatus !== "auto_ok") continue;
      const next = flagged > 0 ? "pending_human" : "auto_ok";
      if (next !== palier.qaStatus) {
        batch.paliersRequalified += 1;
        if (!args.dryRun) await ctx.db.patch(palierId, { qaStatus: next });
      }
    }
    return batch;
  },
});

// ---------------------------------------------------------------------------
// RÉPARER LES GLISSER-DÉPOSER DÉJÀ EN BASE.
//
// Même logique que la génération (`paliers/dragDropRepair.ts`) : un exercice
// réparable est réécrit sur place (zones relabellisées, ou converti en
// `order` ou en `qcm`) ; un exercice irréparable est signalé et son palier
// repasse en `stale`, pour être régénéré à la prochaine ouverture ou par
// `pregen:run`. Un élève avec une tentative ouverte sur un palier régénéré la
// reprend sur les nouveaux exercices : à réserver au développement ou à une
// rentrée.
//
//     npx convex run paliers/pregen:repairDragDrop '{"confirmDeployment":"<nom>","dryRun":true}'
//     npx convex run paliers/pregen:repairDragDrop '{"confirmDeployment":"<nom>"}'
//
// Sans appel au modèle.
// ---------------------------------------------------------------------------

type DragDropSample = {
  exerciseId: Id<"exercises">;
  prompt: string;
  outcome: string;
};

type DragDropBatch = {
  checked: number;
  relabeled: number;
  toOrder: number;
  toQcm: number;
  toMatch: number;
  cleaned: number;
  unrepairable: number;
  paliersInvalidated: number;
  samples: DragDropSample[];
};

type DragDropSummary = DragDropBatch & { dryRun: boolean; paliersScanned: number };

export const repairDragDrop = internalAction({
  args: { confirmDeployment: v.string(), dryRun: v.optional(v.boolean()) },
  handler: async (ctx, args): Promise<DragDropSummary> => {
    assertTargetedDeployment(args.confirmDeployment);
    const dryRun = args.dryRun === true;
    const palierIds: Id<"paliers">[] = await ctx.runQuery(internal.paliers.pregen.listPalierIds, {});
    const totals: DragDropSummary = {
      dryRun,
      paliersScanned: palierIds.length,
      checked: 0,
      relabeled: 0,
      toOrder: 0,
      toQcm: 0,
      toMatch: 0,
      cleaned: 0,
      unrepairable: 0,
      paliersInvalidated: 0,
      samples: [],
    };
    for (let i = 0; i < palierIds.length; i += REPAIR_BATCH) {
      const batch: DragDropBatch = await ctx.runMutation(
        internal.paliers.pregen.repairDragDropForPaliers,
        { palierIds: palierIds.slice(i, i + REPAIR_BATCH), dryRun },
      );
      totals.checked += batch.checked;
      totals.relabeled += batch.relabeled;
      totals.toOrder += batch.toOrder;
      totals.toQcm += batch.toQcm;
      totals.toMatch += batch.toMatch;
      totals.cleaned += batch.cleaned;
      totals.unrepairable += batch.unrepairable;
      totals.paliersInvalidated += batch.paliersInvalidated;
      for (const sample of batch.samples) {
        if (totals.samples.length < REPAIR_SAMPLES) totals.samples.push(sample);
      }
    }
    return totals;
  },
});

export const repairDragDropForPaliers = internalMutation({
  args: { palierIds: v.array(v.id("paliers")), dryRun: v.boolean() },
  handler: async (ctx, args): Promise<DragDropBatch> => {
    const batch: DragDropBatch = {
      checked: 0,
      relabeled: 0,
      toOrder: 0,
      toQcm: 0,
      toMatch: 0,
      cleaned: 0,
      unrepairable: 0,
      paliersInvalidated: 0,
      samples: [],
    };
    for (const palierId of args.palierIds) {
      const palier = await ctx.db.get(palierId);
      if (!palier) continue;
      const exercises = await ctx.db
        .query("exercises")
        .withIndex("by_palierId", (q) => q.eq("palierId", palierId))
        .take(200);
      let broken = 0;
      for (const ex of exercises) {
        if (ex.type !== "drag-drop") continue;
        batch.checked += 1;
        const outcome = repairDragDropExercise({ prompt: ex.prompt, payload: ex.payload, answerKey: ex.answerKey });
        if (outcome.kind === "ok") continue;
        const label =
          outcome.kind === "unrepairable" ? `unrepairable:${outcome.reason}` : outcome.kind;
        if (batch.samples.length < REPAIR_SAMPLES) {
          batch.samples.push({ exerciseId: ex._id, prompt: ex.prompt, outcome: label });
        }
        if (outcome.kind === "unrepairable") {
          batch.unrepairable += 1;
          broken += 1;
          if (!args.dryRun && ex.needsManualReview !== true) {
            await ctx.db.patch(ex._id, { needsManualReview: true });
          }
          continue;
        }
        if (outcome.kind === "relabeled") batch.relabeled += 1;
        else if (outcome.kind === "order") batch.toOrder += 1;
        else if (outcome.kind === "qcm") batch.toQcm += 1;
        else if (outcome.kind === "match") batch.toMatch += 1;
        else batch.cleaned += 1;
        if (args.dryRun) continue;
        await ctx.db.patch(ex._id, {
          type:
            outcome.kind === "order" || outcome.kind === "qcm" || outcome.kind === "match"
              ? outcome.kind
              : "drag-drop",
          payload: outcome.payload,
          ...(outcome.kind === "cleaned" ? {} : { answerKey: outcome.answerKey }),
          needsManualReview: false,
        });
      }
      // Un exercice injouable : tout le palier est refait, par le même
      // chemin que l'expiration, dès la prochaine ouverture ou par `run`.
      if (broken > 0 && palier.status === "cached") {
        batch.paliersInvalidated += 1;
        if (!args.dryRun) await ctx.db.patch(palierId, { status: "stale" });
      }
    }
    return batch;
  },
});
