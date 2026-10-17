import { v } from "convex/values";
import {
  internalAction,
  internalMutation,
  internalQuery,
  type ActionCtx,
} from "../_generated/server";
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
import { gameCount } from "./games";
import { programmeTopic } from "../programme";
import { repairMathExercise } from "./mathRepair";
import { repairDragDrop as repairDragDropExercise } from "./dragDropRepair";
import { auditExercise, isBlocking } from "./exerciseAudit";
import { repairVisualPrompt } from "./visualRepair";
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
// LA DÉPENSE EST RÉELLE : chaque palier, sauf ceux que le code fabrique seul
// (`topicUsesModel`), est un appel au modèle, imputé à personne (`userId`
// absent : appel système) et compté dans le budget mensuel de la passerelle.
// D'où `confirmDeployment`, la même garde que les jeux de données de test.
// ---------------------------------------------------------------------------

/**
 * Ordre de grandeur d'un palier avec le modèle par défaut (`gpt-4o-mini`), en
 * dollars : 0,00094 mesuré le 27 septembre 2026 (858 jetons en entrée, 1 354
 * en sortie). Arrondi au-dessus, pour une estimation qui ne surprend pas.
 */
const ESTIMATED_COST_PER_BUCKET_USD = 0.0015;

/**
 * Un palier de cette thématique appelle-t-il le modèle ? Pas quand sa fiche du
 * programme le remplit de jeux et de gabarits (`paliers/games`) : « Grave ou
 * aigu ? », et les « Les sons… » du CI depuis le dixième gabarit. Son palier se
 * fabrique sans un jeton, donc sans dépense à confirmer.
 */
export function topicUsesModel(programmeKey: string | null | undefined): boolean {
  return gameCount(programmeTopic(programmeKey)?.topic.games) < PALIER_SIZE;
}

type PlanItem = {
  subjectId: Id<"subjects">;
  subjectName: string;
  topicId: Id<"topics">;
  topicName: string;
  class: VisibleClassName;
  palierIndex: number;
  palierCount: number;
  /** Faux pour un palier tout en gabarits ou en jeux : il ne coûte rien. */
  usesModel: boolean;
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
            usesModel: topicUsesModel(topic.programmeKey),
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
  /** Parmi eux, les paliers que le code fabrique seul, sans appel au modèle. */
  withoutModel: number;
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
    const withoutModel = plan.filter((item) => !item.usesModel).length;
    const estimatedCostUsd =
      Math.round((plan.length - withoutModel) * ESTIMATED_COST_PER_BUCKET_USD * 100) / 100;

    if (args.dryRun) {
      return {
        dryRun: true,
        toGenerate: plan.length,
        withoutModel,
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
      withoutModel,
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

export type InvalidateFilters = {
  classes: ReadonlySet<string> | null;
  subjects: ReadonlySet<string> | null;
  topics: ReadonlySet<string> | null;
};

/** Ce palier est-il à passer en `stale` ? Seuls les paliers en cache, d'une classe visible, qui passent tous les filtres. */
export function shouldInvalidate(
  palier: { status: string; class: string; subjectId: string; topicId: string },
  filters: InvalidateFilters,
): boolean {
  if (palier.status !== "cached") return false;
  if (isHiddenClass(palier.class)) return false;
  if (filters.classes && !filters.classes.has(palier.class)) return false;
  if (filters.subjects && !filters.subjects.has(palier.subjectId)) return false;
  if (filters.topics && !filters.topics.has(palier.topicId)) return false;
  return true;
}

/**
 * MARQUER DES PALIERS À REFAIRE. Quand la consigne de génération change (un
 * mix d'écritures, une règle de plus), le contenu déjà en cache ne la
 * reflète pas : on passe les paliers visés en `stale`, et `run` les
 * régénère par le même chemin, en remplaçant leurs exercices. Les élèves
 * avec une tentative ouverte dessus la reprennent sur les nouveaux
 * exercices : à réserver au développement ou à une rentrée.
 *
 *     npx convex run paliers/pregen:invalidate '{"confirmDeployment":"<nom>","subjectIds":["..."],"classes":["CM1"]}'
 *
 * `programmeKeys` vise des thématiques précises (`fr-ci-sons-1`, `ma-ci-calcul-10`)
 * : quand une fiche du programme gagne des gabarits (`paliers/games`), seuls
 * ses paliers sont à refaire, pas toute une classe. Les filtres se cumulent.
 * `dryRun` compte et nomme les thématiques sans rien écrire.
 *
 *     npx convex run paliers/pregen:invalidate '{"confirmDeployment":"<nom>","programmeKeys":["fr-ci-sons-1"],"dryRun":true}'
 */
/**
 * Le nombre de paliers par thématique, en LISTE. Un objet « nom → nombre » ne
 * passe pas : Convex refuse les accents dans un nom de champ (« jusqu'à »), et
 * le nom d'une thématique en porte.
 */
export function countByTopic(names: readonly string[]): { topic: string; paliers: number }[] {
  const counts = new Map<string, number>();
  for (const name of names) counts.set(name, (counts.get(name) ?? 0) + 1);
  return Array.from(counts, ([topic, paliers]) => ({ topic, paliers })).sort((a, b) => a.topic.localeCompare(b.topic, "fr"));
}

export const invalidate = internalMutation({
  args: {
    confirmDeployment: v.string(),
    subjectIds: v.optional(v.array(v.id("subjects"))),
    classes: v.optional(v.array(visibleClassValidator)),
    programmeKeys: v.optional(v.array(v.string())),
    dryRun: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    assertTargetedDeployment(args.confirmDeployment);
    // Les thématiques visées par leur clé de programme : lues une fois, pas une fois par palier.
    let topicNames = new Map<string, string>();
    if (args.programmeKeys) {
      const wanted = new Set(args.programmeKeys);
      const topics = await ctx.db.query("topics").take(1000);
      topicNames = new Map(
        topics.filter((t) => t.programmeKey && wanted.has(t.programmeKey)).map((t) => [t._id as string, t.name]),
      );
    }
    const filters: InvalidateFilters = {
      classes: args.classes ? new Set<string>(args.classes) : null,
      subjects: args.subjectIds ? new Set<string>(args.subjectIds) : null,
      topics: args.programmeKeys ? new Set(topicNames.keys()) : null,
    };
    const paliers = await ctx.db.query("paliers").take(1000);
    let invalidated = 0;
    const touched: string[] = [];
    for (const palier of paliers) {
      if (!shouldInvalidate({ ...palier, subjectId: palier.subjectId as string, topicId: palier.topicId as string }, filters)) {
        continue;
      }
      invalidated += 1;
      const name = topicNames.get(palier.topicId as string);
      if (name) touched.push(name);
      if (!args.dryRun) await ctx.db.patch(palier._id, { status: "stale" });
    }
    return {
      dryRun: args.dryRun === true,
      paliersScanned: paliers.length,
      topicsMatched: topicNames.size,
      invalidated,
      ...(args.programmeKeys ? { byTopic: countByTopic(touched) } : {}),
    };
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

const PALIER_PAGE = 200;

/**
 * Tous les paliers du déploiement, page après page (`listPalierPage`, plus bas).
 * `take(1000)` s'arrêtait en silence au millième palier : la prod en compte
 * 1 028, et les réparations ne voyaient pas les derniers.
 */
export async function allPalierIds(ctx: ActionCtx): Promise<Id<"paliers">[]> {
  const ids: Id<"paliers">[] = [];
  let cursor: string | null = null;
  for (;;) {
    const page: { ids: Id<"paliers">[]; isDone: boolean; cursor: string } = await ctx.runQuery(
      internal.paliers.pregen.listPalierPage,
      { cursor, numItems: PALIER_PAGE },
    );
    ids.push(...page.ids);
    if (page.isDone) return ids;
    cursor = page.cursor;
  }
}

export const repairMath = internalAction({
  args: { confirmDeployment: v.string(), dryRun: v.optional(v.boolean()) },
  handler: async (ctx, args): Promise<RepairSummary> => {
    assertTargetedDeployment(args.confirmDeployment);
    const dryRun = args.dryRun === true;
    const palierIds = await allPalierIds(ctx);
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
    const palierIds = await allPalierIds(ctx);
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

// ---------------------------------------------------------------------------
// RÉPARER LES ÉNONCÉS QUI PARLENT D'UNE IMAGE ABSENTE.
//
// « Combien de mangues vois-tu ? » sans une mangue à l'écran : voir
// `paliers/visualRepair.ts`. Un énoncé réparable reçoit ses émojis sur place ;
// un énoncé irréparable est signalé et son palier repasse en `stale`, pour
// être régénéré à la prochaine ouverture ou par `pregen:run`.
//
//     npx convex run paliers/pregen:repairVisual '{"confirmDeployment":"<nom>","dryRun":true}'
//     npx convex run paliers/pregen:repairVisual '{"confirmDeployment":"<nom>"}'
//
// Sans appel au modèle.
// ---------------------------------------------------------------------------

type VisualSample = {
  exerciseId: Id<"exercises">;
  prompt: string;
  outcome: string;
};

type VisualBatch = {
  checked: number;
  added: number;
  resized: number;
  pictures: number;
  unrepairable: number;
  paliersInvalidated: number;
  samples: VisualSample[];
};

type VisualSummary = VisualBatch & { dryRun: boolean; paliersScanned: number };

export const repairVisual = internalAction({
  args: { confirmDeployment: v.string(), dryRun: v.optional(v.boolean()) },
  handler: async (ctx, args): Promise<VisualSummary> => {
    assertTargetedDeployment(args.confirmDeployment);
    const dryRun = args.dryRun === true;
    const palierIds = await allPalierIds(ctx);
    const totals: VisualSummary = {
      dryRun,
      paliersScanned: palierIds.length,
      checked: 0,
      added: 0,
      resized: 0,
      pictures: 0,
      unrepairable: 0,
      paliersInvalidated: 0,
      samples: [],
    };
    for (let i = 0; i < palierIds.length; i += REPAIR_BATCH) {
      const batch: VisualBatch = await ctx.runMutation(
        internal.paliers.pregen.repairVisualForPaliers,
        { palierIds: palierIds.slice(i, i + REPAIR_BATCH), dryRun },
      );
      totals.checked += batch.checked;
      totals.added += batch.added;
      totals.resized += batch.resized;
      totals.pictures += batch.pictures;
      totals.unrepairable += batch.unrepairable;
      totals.paliersInvalidated += batch.paliersInvalidated;
      for (const sample of batch.samples) {
        if (totals.samples.length < REPAIR_SAMPLES) totals.samples.push(sample);
      }
    }
    return totals;
  },
});

export const repairVisualForPaliers = internalMutation({
  args: { palierIds: v.array(v.id("paliers")), dryRun: v.boolean() },
  handler: async (ctx, args): Promise<VisualBatch> => {
    const batch: VisualBatch = {
      checked: 0,
      added: 0,
      resized: 0,
      pictures: 0,
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
        batch.checked += 1;
        const outcome = repairVisualPrompt({
          type: ex.type,
          prompt: ex.prompt,
          payload: ex.payload,
          answerKey: ex.answerKey,
        });
        if (outcome.kind === "ok") continue;
        const label =
          outcome.kind === "unrepairable" ? `unrepairable:${outcome.reason}` : outcome.change;
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
        if (outcome.change === "added") batch.added += 1;
        else if (outcome.change === "resized") batch.resized += 1;
        else batch.pictures += 1;
        if (!args.dryRun) {
          await ctx.db.patch(ex._id, {
            prompt: outcome.prompt,
            ...(outcome.payload !== undefined ? { payload: outcome.payload } : {}),
          });
        }
      }
      // Un énoncé injouable : tout le palier est refait, par le même chemin
      // que l'expiration, dès la prochaine ouverture ou par `run`.
      if (broken > 0 && palier.status === "cached") {
        batch.paliersInvalidated += 1;
        if (!args.dryRun) await ctx.db.patch(palierId, { status: "stale" });
      }
    }
    return batch;
  },
});

// ---------------------------------------------------------------------------
// AUDITER CHAQUE EXERCICE DÉJÀ EN BASE.
//
// Le contrôleur structurel (`paliers/exerciseAudit.ts`) qui écarte les exercices
// défectueux à la génération, passé sur TOUS les exercices des paliers : phrase
// coupée, scène absente, option « Toutes les réponses », bonne réponse qui ne
// figure pas parmi les options, glisser-déposer sans zone… Un exercice avec un
// défaut `blocking` est marqué `needsManualReview` et son palier repasse en
// `stale` (régénéré à la prochaine ouverture ou par `pregen:run`) ; les
// avertissements sont comptés et listés, rien de plus. `dryRun` ne touche à
// rien. Sans appel au modèle. Un élève avec une tentative ouverte sur un palier
// invalidé la reprend sur les nouveaux exercices : à réserver au développement
// ou à une rentrée.
//
//     npx convex run paliers/pregen:auditExercises '{"confirmDeployment":"<nom>","dryRun":true}'
//     npx convex run paliers/pregen:auditExercises '{"confirmDeployment":"<nom>","dryRun":true,"limitSamples":2000}'
//     npx convex run paliers/pregen:auditExercises '{"confirmDeployment":"<nom>"}'
//
// Le résumé donne le nombre d'exercices vérifiés, les comptes par code de
// défaut, les paliers touchés et `limitSamples` exemples (30 par défaut, 2 000
// au plus) : les exercices à défaut `blocking` d'abord, avec leur identifiant,
// leur énoncé et leurs codes. À lancer APRÈS `repairMath`, `repairDragDrop` et
// `repairVisual`, qui réparent sur place ce que l'audit ne ferait qu'écarter.
// ---------------------------------------------------------------------------

const AUDIT_BATCH = 25;
const AUDIT_DEFAULT_SAMPLES = 30;
const AUDIT_MAX_SAMPLES = 2000;

type AuditSample = {
  exerciseId: Id<"exercises">;
  palierId: Id<"paliers">;
  class: string;
  subject: string;
  type: string;
  prompt: string;
  /** Au moins un défaut bloquant : le palier est refait. */
  blocking: boolean;
  /** Tous les codes de défaut de l'exercice. */
  codes: string[];
  /** Ceux qui rendent l'exercice injouable. */
  blockingCodes: string[];
};

type AuditBatch = {
  checked: number;
  exercisesWithDefects: number;
  blockingExercises: number;
  warningOnlyExercises: number;
  byCode: Record<string, number>;
  paliersTouched: number;
  paliersInvalidated: number;
  samples: AuditSample[];
};

type AuditSummary = AuditBatch & { dryRun: boolean; paliersScanned: number; samplesTruncated: boolean };

export const listPalierPage = internalQuery({
  args: { cursor: v.union(v.string(), v.null()), numItems: v.number() },
  handler: async (ctx, args) => {
    const page = await ctx.db.query("paliers").paginate({ cursor: args.cursor, numItems: args.numItems });
    return { ids: page.page.map((palier) => palier._id), isDone: page.isDone, cursor: page.continueCursor };
  },
});

export const auditExercises = internalAction({
  args: {
    confirmDeployment: v.string(),
    dryRun: v.optional(v.boolean()),
    limitSamples: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<AuditSummary> => {
    assertTargetedDeployment(args.confirmDeployment);
    const dryRun = args.dryRun === true;
    const limit = Math.min(
      AUDIT_MAX_SAMPLES,
      Math.max(0, Math.floor(args.limitSamples ?? AUDIT_DEFAULT_SAMPLES)),
    );
    const totals: AuditSummary = {
      dryRun,
      paliersScanned: 0,
      checked: 0,
      exercisesWithDefects: 0,
      blockingExercises: 0,
      warningOnlyExercises: 0,
      byCode: {},
      paliersTouched: 0,
      paliersInvalidated: 0,
      samples: [],
      samplesTruncated: false,
    };
    const blockingSamples: AuditSample[] = [];
    const otherSamples: AuditSample[] = [];
    // Les paliers se lisent par pages : la table n'est pas bornée.
    let cursor: string | null = null;
    for (;;) {
      const page: { ids: Id<"paliers">[]; isDone: boolean; cursor: string } = await ctx.runQuery(
        internal.paliers.pregen.listPalierPage,
        { cursor, numItems: AUDIT_BATCH },
      );
      if (page.ids.length > 0) {
        const batch: AuditBatch = await ctx.runMutation(internal.paliers.pregen.auditExercisesForPaliers, {
          palierIds: page.ids,
          dryRun,
          limitSamples: limit,
        });
        totals.paliersScanned += page.ids.length;
        totals.checked += batch.checked;
        totals.exercisesWithDefects += batch.exercisesWithDefects;
        totals.blockingExercises += batch.blockingExercises;
        totals.warningOnlyExercises += batch.warningOnlyExercises;
        totals.paliersTouched += batch.paliersTouched;
        totals.paliersInvalidated += batch.paliersInvalidated;
        for (const [code, count] of Object.entries(batch.byCode)) {
          totals.byCode[code] = (totals.byCode[code] ?? 0) + count;
        }
        for (const sample of batch.samples) {
          const kept = sample.blocking ? blockingSamples : otherSamples;
          if (kept.length < limit) kept.push(sample);
        }
      }
      if (page.isDone) break;
      cursor = page.cursor;
    }
    // Les exercices injouables d'abord : ce sont eux que le client lira en premier.
    totals.samplesTruncated = totals.exercisesWithDefects > limit;
    totals.samples = [...blockingSamples, ...otherSamples].slice(0, limit);
    totals.byCode = Object.fromEntries(Object.entries(totals.byCode).sort((a, b) => b[1] - a[1]));
    return totals;
  },
});

export const auditExercisesForPaliers = internalMutation({
  args: { palierIds: v.array(v.id("paliers")), dryRun: v.boolean(), limitSamples: v.number() },
  handler: async (ctx, args): Promise<AuditBatch> => {
    const batch: AuditBatch = {
      checked: 0,
      exercisesWithDefects: 0,
      blockingExercises: 0,
      warningOnlyExercises: 0,
      byCode: {},
      paliersTouched: 0,
      paliersInvalidated: 0,
      samples: [],
    };
    const blockingSamples: AuditSample[] = [];
    const warningSamples: AuditSample[] = [];
    for (const palierId of args.palierIds) {
      const palier = await ctx.db.get(palierId);
      if (!palier) continue;
      const subject = await ctx.db.get(palier.subjectId);
      const exercises = await ctx.db
        .query("exercises")
        .withIndex("by_palierId", (q) => q.eq("palierId", palierId))
        .take(200);
      let broken = 0;
      for (const ex of exercises) {
        batch.checked += 1;
        const defects = auditExercise({
          type: ex.type,
          prompt: ex.prompt,
          payload: ex.payload,
          answerKey: ex.answerKey,
          hints: ex.hints,
          class: palier.class,
          subject: subject?.name ?? null,
        });
        if (defects.length === 0) continue;
        batch.exercisesWithDefects += 1;
        for (const defect of defects) batch.byCode[defect.code] = (batch.byCode[defect.code] ?? 0) + 1;
        const blocking = defects.some(isBlocking);
        if (blocking) {
          batch.blockingExercises += 1;
          broken += 1;
          if (!args.dryRun && ex.needsManualReview !== true) {
            await ctx.db.patch(ex._id, { needsManualReview: true });
          }
        } else {
          batch.warningOnlyExercises += 1;
        }
        const target = blocking ? blockingSamples : warningSamples;
        if (target.length < args.limitSamples) {
          target.push({
            exerciseId: ex._id,
            palierId,
            class: palier.class,
            subject: subject?.name ?? "",
            type: ex.type,
            prompt: ex.prompt.length > 300 ? `${ex.prompt.slice(0, 299)}…` : ex.prompt,
            blocking,
            codes: defects.map((defect) => defect.code),
            blockingCodes: defects.filter(isBlocking).map((defect) => defect.code),
          });
        }
      }
      if (broken > 0) {
        batch.paliersTouched += 1;
        if (palier.status === "cached") {
          batch.paliersInvalidated += 1;
          if (!args.dryRun) await ctx.db.patch(palierId, { status: "stale" });
        }
      }
    }
    batch.samples = [...blockingSamples, ...warningSamples].slice(0, args.limitSamples * 2);
    return batch;
  },
});

// ---------------------------------------------------------------------------
// CORRIGER DES EXERCICES PRÉCIS DÉJÀ EN BASE.
//
// Ce que `repairMath`, `repairDragDrop` et `repairVisual` ne savent pas réparer
// (une option écrite deux fois, une clé qui désigne la mauvaise option, des
// zones « Zone A ») se réécrit exercice par exercice. Chaque correction passe
// par le contrôleur (`auditExercise`) AVANT d'être écrite : une correction qui
// garde un défaut bloquant est refusée. Un exercice corrigé perd
// `needsManualReview`. Un palier sans exercice bloquant, encore valide
// (`expiresAt` dans le futur) et rendu `stale` repasse en `cached` : il est
// servi tel quel, sans régénération ni appel au modèle. Un palier expiré se
// régénère de toute façon à l'ouverture : son statut reste tel quel. Le
// `qaStatus` d'un palier corrigé suit les exercices encore signalés, comme
// `repairMath`. `dryRun` ne touche à rien.
//
//     npx convex run paliers/pregen:applyExerciseFixes "$(cat fixes.json)"
//
// avec `{"confirmDeployment":"<nom>","dryRun":true,"fixes":[{"exerciseId":"…",
// "prompt":"…","payload":{…},"answerKey":"…","mathExpression":"…"}]}` : seuls
// les champs donnés changent.
// ---------------------------------------------------------------------------

type ExerciseFixResult = {
  exerciseId: Id<"exercises">;
  outcome: "fixed" | "refused" | "missing";
  /** Les défauts bloquants qui restent, quand la correction est refusée. */
  blockingAfter: string[];
};

type ExerciseFixSummary = {
  dryRun: boolean;
  fixed: number;
  refused: number;
  missing: number;
  paliersTouched: number;
  paliersRestored: number;
  paliersExpired: number;
  paliersStillBroken: number;
  paliersRequalified: number;
  results: ExerciseFixResult[];
};

const exerciseFix = v.object({
  exerciseId: v.id("exercises"),
  prompt: v.optional(v.string()),
  payload: v.optional(v.any()),
  answerKey: v.optional(v.string()),
  mathExpression: v.optional(v.string()),
});

export const applyExerciseFixesToDb = internalMutation({
  args: { dryRun: v.boolean(), fixes: v.array(exerciseFix) },
  handler: async (ctx, args): Promise<ExerciseFixSummary> => {
    const summary: ExerciseFixSummary = {
      dryRun: args.dryRun,
      fixed: 0,
      refused: 0,
      missing: 0,
      paliersTouched: 0,
      paliersRestored: 0,
      paliersExpired: 0,
      paliersStillBroken: 0,
      paliersRequalified: 0,
      results: [],
    };
    const corrected = new Map<
      Id<"exercises">,
      { prompt: string; payload: unknown; answerKey: string }
    >();
    const touched = new Set<Id<"paliers">>();
    for (const fix of args.fixes) {
      const ex = await ctx.db.get(fix.exerciseId);
      const palier = ex?.palierId ? await ctx.db.get(ex.palierId) : null;
      if (!ex || !palier) {
        summary.missing += 1;
        summary.results.push({ exerciseId: fix.exerciseId, outcome: "missing", blockingAfter: [] });
        continue;
      }
      const subject = await ctx.db.get(palier.subjectId);
      const next = {
        prompt: fix.prompt ?? ex.prompt,
        payload: fix.payload ?? ex.payload,
        answerKey: fix.answerKey ?? ex.answerKey,
      };
      const blockingAfter = auditExercise({
        type: ex.type,
        ...next,
        hints: ex.hints,
        class: palier.class,
        subject: subject?.name ?? null,
      })
        .filter(isBlocking)
        .map((defect) => defect.code);
      if (blockingAfter.length > 0) {
        summary.refused += 1;
        summary.results.push({ exerciseId: ex._id, outcome: "refused", blockingAfter });
        continue;
      }
      corrected.set(ex._id, next);
      touched.add(palier._id);
      summary.fixed += 1;
      summary.results.push({ exerciseId: ex._id, outcome: "fixed", blockingAfter: [] });
      if (!args.dryRun) {
        await ctx.db.patch(ex._id, {
          ...next,
          ...(fix.mathExpression !== undefined ? { mathExpression: fix.mathExpression } : {}),
          needsManualReview: false,
        });
      }
    }

    const now = Date.now();
    for (const palierId of touched) {
      const palier = await ctx.db.get(palierId);
      if (!palier) continue;
      summary.paliersTouched += 1;
      const subject = await ctx.db.get(palier.subjectId);
      const exercises = await ctx.db
        .query("exercises")
        .withIndex("by_palierId", (q) => q.eq("palierId", palierId))
        .take(200);
      let broken = 0;
      let flagged = 0;
      for (const ex of exercises) {
        const override = corrected.get(ex._id);
        const defects = auditExercise({
          type: ex.type,
          prompt: override?.prompt ?? ex.prompt,
          payload: override?.payload ?? ex.payload,
          answerKey: override?.answerKey ?? ex.answerKey,
          hints: ex.hints,
          class: palier.class,
          subject: subject?.name ?? null,
        });
        if (defects.some(isBlocking)) broken += 1;
        if (override ? false : ex.needsManualReview === true) flagged += 1;
      }
      if (broken > 0) {
        summary.paliersStillBroken += 1;
        continue;
      }
      if (palier.expiresAt <= now) {
        summary.paliersExpired += 1;
      } else if (palier.status === "stale") {
        summary.paliersRestored += 1;
        if (!args.dryRun) await ctx.db.patch(palierId, { status: "cached" });
      }
      // Un humain qui a tranché garde le dernier mot.
      if (palier.qaStatus === "pending_human" || palier.qaStatus === "auto_ok") {
        const next = flagged > 0 ? "pending_human" : "auto_ok";
        if (next !== palier.qaStatus) {
          summary.paliersRequalified += 1;
          if (!args.dryRun) await ctx.db.patch(palierId, { qaStatus: next });
        }
      }
    }
    return summary;
  },
});

export const applyExerciseFixes = internalAction({
  args: { confirmDeployment: v.string(), dryRun: v.optional(v.boolean()), fixes: v.array(exerciseFix) },
  handler: async (ctx, args): Promise<ExerciseFixSummary> => {
    assertTargetedDeployment(args.confirmDeployment);
    return await ctx.runMutation(internal.paliers.pregen.applyExerciseFixesToDb, {
      dryRun: args.dryRun === true,
      fixes: args.fixes,
    });
  },
});
