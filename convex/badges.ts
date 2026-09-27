import { query, mutation, internalMutation, type MutationCtx, type QueryCtx } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { readStudentPreferences, topicsForStudent, type StudentPreferences } from "./students";
import {
  buildSnapshot,
  conditionText,
  evaluateBadge,
  isSupportedCondition,
  type StudentSnapshot,
} from "./badgeRules";
import { isFinished } from "./progressionRules";
import { assertTargetedDeployment } from "./testSeedsSchool";
import {
  catalogReadable,
  blockedStudent,
  callerIsAdmin,
  requireAccess,
} from "./access";

// ---------------------------------------------------------------------------
// D10 — Rarity tier normalization. The schema currently widens
// `badges.rarity` as `v.optional(v.string())` (legacy free-form). Phase B
// narrows it to a strict enum via the widen-migrate-narrow pattern:
//   1. (already done) Widen accepts any string.
//   2. Run `internal.badges.normalizeRarities` once in production.
//   3. Narrow the validator in schema.ts to the strict union below.
// All read paths use `normalizeRarity()` so the UI always sees the typed value.
// ---------------------------------------------------------------------------

export const RARITY_TIERS = ["common", "rare", "epic", "legendary"] as const;
export type RarityTier = (typeof RARITY_TIERS)[number];
const RARITY_SET = new Set<string>(RARITY_TIERS);

export function normalizeRarity(raw: string | undefined | null): RarityTier {
  if (!raw) return "common";
  const lower = raw.toLowerCase().trim();
  if (RARITY_SET.has(lower)) return lower as RarityTier;
  // Legacy aliases — observed in seeded data and admin UI shorthand.
  if (lower === "uncommon" || lower === "bronze" || lower === "argent") {
    return "rare";
  }
  if (lower === "or" || lower === "gold") return "epic";
  if (lower === "diamond" || lower === "diamant" || lower === "platinum") {
    return "legendary";
  }
  return "common";
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Le critère d'un trophée, en français, depuis sa condition et ses
 * paramètres (`badgeRules.conditionText`). Sans paramètres : les défauts de
 * la règle.
 */
export function getConditionText(condition: string, conditionParams?: unknown): string {
  return conditionText({ condition, conditionParams });
}

/** La fiche d'un trophée telle que les écrans la lisent : rareté normalisée, critère, jugeable ou non. */
export async function describeBadge(ctx: QueryCtx | MutationCtx, badge: Doc<"badges">) {
  const subject = badge.subjectId ? await ctx.db.get(badge.subjectId) : null;
  return {
    ...badge,
    rarity: normalizeRarity(badge.rarity),
    criteriaText: conditionText(badge, subject?.name),
    // Une condition que le moteur ne sait pas juger (`teacher_kudos`) : la
    // vitrine de l'élève ne la montre pas, l'administration la signale.
    supported: isSupportedCondition(badge.condition),
  };
}

// ---------------------------------------------------------------------------
// `list` et `getById` — IDENTITÉ ET DROIT D'ACCÈS, en une seule décision.
//
// `catalogReadable` (`access.ts`) réunit les deux, et c'est bien DEUX questions
// qu'il pose, pas une :
//
// 1. L'IDENTITÉ. Le paywall seul ne suffit pas : `blockedStudent` rend false
//    pour un appelant NON authentifié, par conception — il ne doit bloquer ni
//    un adulte ni un visiteur. Sans exigence de profil, il se contournait en
//    RETIRANT simplement le jeton de session.
// 2. Le DROIT D'ACCÈS (paywall, spec §5.4). Lecture partagée avec
//    l'administration : seul un élève sans droit valide est bloqué.
//
// La première ne remplace pas la seconde — un élève impayé a bien un profil.
// Tous les appelants sont des écrans authentifiés (élève, admin) ; `getById`
// n'en a aucun.
//
// LES DEUX SE POSAIENT EN DEUX APPELS, donc en DEUX résolutions du profil par
// abonnement, et en deux fois la surface d'invalidation — `profiles.preferences`
// est réécrit à chaque série, badge ou réglage de son. Une lecture, deux
// questions, même réponse qu'avant.
//
// Une requête ne lève jamais : même valeur vide que le chemin nominal.
// C'est le même couple que `listMyEarned` plus bas, qui établit son identité
// lui-même puisqu'il a besoin du profil pour travailler.
// ---------------------------------------------------------------------------

export const list = query({
  args: {},
  handler: async (ctx) => {
    // Identité ET paywall en une lecture — voir `catalogReadable`.
    if (!(await catalogReadable(ctx))) return [];

    const rows = await ctx.db.query("badges").take(200);
    return await Promise.all(rows.map((b) => describeBadge(ctx, b)));
  },
});

export const getById = query({
  args: { id: v.id("badges") },
  handler: async (ctx, args) => {
    // Identité ET paywall en une lecture — voir `catalogReadable`.
    if (!(await catalogReadable(ctx))) return null;

    return await ctx.db.get(args.id);
  },
});

/**
 * Badges obtenus par l'élève de la SESSION, avec leur fiche complète.
 *
 * Renommée : elle s'appelait `listEarnedByStudent` et prenait `studentId` en
 * argument, sans jamais vérifier l'appelant — n'importe qui pouvait lire les
 * badges de n'importe quel `Id<"profiles">`. L'élève est désormais dérivé de
 * la session ; son unique appelant y passait déjà son propre profil, donc le
 * retrait de l'argument ne change aucun comportement légitime. Le nom
 * « ByStudent » aurait menti une fois l'argument parti : plus aucun élève
 * n'est nommé, c'est celui de la session.
 *
 * Une requête ne lève jamais : [] si l'appelant n'est pas authentifié ou n'a
 * pas de profil.
 */
export const listMyEarned = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!profile) return [];

    // Paywall (spec §5.4) — distinct du garde ci-dessus, qui n'établit que
    // l'identité. blockedStudent(ctx) résout le profil de L'APPELANT et ne
    // bloque que s'il s'agit d'un élève sans droit valide : jamais un adulte,
    // cette lecture étant aussi partagée avec l'administration et les
    // professeurs.
    if (await blockedStudent(ctx)) return [];

    const earned = await ctx.db
      .query("earnedBadges")
      .withIndex("by_studentId", (q) => q.eq("studentId", profile._id))
      .take(100);

    // Join with badges table for full info
    const results = [];
    for (const eb of earned) {
      const badge = await ctx.db.get(eb.badgeId);
      if (badge) {
        results.push({ ...eb, badge: await describeBadge(ctx, badge) });
      }
    }
    return results;
  },
});

// ---------------------------------------------------------------------------
// Mutations
//
// `create`, `update` et `remove` — garde de RÔLE, pas garde de paywall. Ces
// trois écritures définissent le catalogue de badges lui-même et n'ont rien à
// voir avec le droit d'accès d'un élève : `blockedStudent` et `requireAccess`
// jugent un abonnement, pas la qualité de l'appelant. `admin` seul, leur
// unique appelant étant `app/(admin)/admin/badges/page.tsx`.
//
// Une mutation peut lever, et le garde est la toute première instruction :
// rien n'est lu avant d'avoir établi le rôle. Un seul message pour tous les
// refus de rôle, comme `profiles.linkChild`.
//
// CES REFUS SONT DES `ConvexError`, PARCE QU'UN LECTEUR LES AFFICHE. La règle
// se juge au LECTEUR, jamais au module : hors développement Convex occulte le
// `message` d'une erreur, et seul `data` est transmis TEL QUEL, donc un refus
// qu'un écran montre doit voyager par là. Les écrans le lisent avec
// `refusalMessage` (`lib/refusalMessage.ts`). Sans cette bascule leur repli
// serait INATTEIGNABLE — ils attrapent en `err instanceof Error`, test que
// toute erreur passe puisque `ConvexError` étend `Error` — et l'administrateur
// lirait un message enveloppé et vidé à la place de la phrase écrite ici.
//
// `markBadgesSeen` est l'exception, et elle confirme la règle : elle n'a PAS de
// lecteur — `void markBadgesSeen(…)`, sans capture — et c'est un ÉLÈVE qui
// l'appelle, à qui la spec §5.4 interdit de montrer un motif technique. Ses
// deux refus restent donc des `Error` ordinaires, et elle garde son
// `requireAccess` : c'est l'élève lui-même qui écrit, sur son propre profil.
// Ce paywall lève un `ConvexError` par cohérence avec les autres appelants de
// `requireAccess`, non parce qu'un lecteur le traduirait — ICI PERSONNE NE LE
// LIT. Les mots d'enfant existent bien (`kidMessages`, via `isAccessDenied`),
// mais sur l'écran de session, pas sur ce chemin-ci.
// ---------------------------------------------------------------------------

export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    icon: v.string(),
    condition: v.string(),
    conditionParams: v.optional(v.any()),
    rarity: v.optional(v.string()),
    subjectId: v.optional(v.id("subjects")),
  },
  handler: async (ctx, args) => {
    if (!(await callerIsAdmin(ctx))) throw new ConvexError("Rôle non autorisé");
    if (!isSupportedCondition(args.condition)) {
      throw new ConvexError("Condition inconnue : le moteur ne saurait pas l'attribuer");
    }

    return await ctx.db.insert("badges", {
      name: args.name,
      description: args.description,
      icon: args.icon,
      condition: args.condition,
      conditionType: args.condition,
      conditionParams: args.conditionParams ?? {},
      rarity: normalizeRarity(args.rarity),
      subjectId: args.subjectId,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("badges"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    condition: v.optional(v.string()),
    conditionParams: v.optional(v.any()),
    rarity: v.optional(v.string()),
    subjectId: v.optional(v.id("subjects")),
  },
  handler: async (ctx, args) => {
    if (!(await callerIsAdmin(ctx))) throw new ConvexError("Rôle non autorisé");

    const { id, ...fields } = args;
    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new ConvexError("Badge introuvable");
    }
    if (fields.condition !== undefined && !isSupportedCondition(fields.condition)) {
      throw new ConvexError("Condition inconnue : le moteur ne saurait pas l'attribuer");
    }
    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) {
        updates[key] = key === "rarity" ? normalizeRarity(value as string) : value;
      }
    }
    if (fields.condition !== undefined) updates.conditionType = fields.condition;
    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("badges") },
  handler: async (ctx, args) => {
    if (!(await callerIsAdmin(ctx))) throw new ConvexError("Rôle non autorisé");

    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new ConvexError("Badge introuvable");
    }

    // Check if any earnedBadges reference this badge.
    // Par `by_badgeId` : en `.filter()`, `.first()` ne court-circuite que sur
    // une correspondance, donc le cas qui AUTORISE la suppression — aucun élève
    // ne l'a obtenu — était précisément celui qui parcourait toute la table.
    const earned = await ctx.db
      .query("earnedBadges")
      .withIndex("by_badgeId", (q) => q.eq("badgeId", args.id))
      .first();
    if (earned) {
      throw new ConvexError(
        "Impossible de supprimer ce badge car des élèves l'ont déjà obtenu.",
      );
    }

    await ctx.db.delete(args.id);
  },
});

// ---------------------------------------------------------------------------
// D25 — Mark earned badges as "seen" by the kid (after the /complete page
// renders the unlock card). Idempotent: re-calls with already-seen IDs are a
// no-op (early return without a db.patch). Caps the rolling list at 100
// entries (Guardian C4) — a student earning 100+ unique badges is far beyond
// MVP scope, but the cap keeps preferences bounded.
// ---------------------------------------------------------------------------

const LAST_SEEN_BADGE_IDS_CAP = 100;

export const markBadgesSeen = mutation({
  args: { badgeIds: v.array(v.id("badges")) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Non authentifié");
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId as string))
      .unique();
    if (!profile || profile.role !== "student") {
      throw new Error("Profil élève introuvable");
    }

    // Paywall (spec §5.4) — mutation : lève si l'accès n'est pas ouvert.
    await requireAccess(ctx, profile);

    if (args.badgeIds.length === 0) return;

    const prefs = readStudentPreferences(profile);
    const current = prefs.lastSeenBadgeIds ?? [];
    const incoming = args.badgeIds.map((id) => id as string);
    const currentSet = new Set(current);
    const additions = incoming.filter((id) => !currentSet.has(id));
    if (additions.length === 0) return; // Idempotent — nothing new to record.

    const merged = [...current, ...additions].slice(-LAST_SEEN_BADGE_IDS_CAP);
    const next: StudentPreferences = { ...prefs, lastSeenBadgeIds: merged };
    await ctx.db.patch(profile._id, { preferences: next });
  },
});

// ---------------------------------------------------------------------------
// D10 step 2 — Migration: normalize all badges.rarity values to the strict
// enum so the schema can be narrowed (step 3) without rejecting any rows.
// Idempotent + paginated. Run once via `npx convex run badges:normalizeRarities`
// before bumping schema.ts to the strict union validator.
// ---------------------------------------------------------------------------
export const normalizeRarities = internalMutation({
  args: {
    cursor: v.optional(v.union(v.string(), v.null())),
    patched: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const result = await ctx.db
      .query("badges")
      .paginate({ numItems: 100, cursor: args.cursor ?? null });

    let patched = args.patched ?? 0;
    for (const badge of result.page) {
      const next = normalizeRarity(badge.rarity);
      if (badge.rarity === next) continue; // No-op when already normalized.
      await ctx.db.patch(badge._id, { rarity: next });
      patched += 1;
    }

    if (!result.isDone) {
      await ctx.scheduler.runAfter(0, internal.badges.normalizeRarities, {
        cursor: result.continueCursor,
        patched,
      });
    }
    return { patched, isDone: result.isDone };
  },
});

// ---------------------------------------------------------------------------
// L'ATTRIBUTION DES TROPHÉES.
//
// À chaque fin de palier (`palierAttempts.submitPalier`, par le planificateur)
// et après un rattrapage (`progression:rebuild`), on prend un instantané de
// l'élève et on juge chaque trophée du catalogue avec `badgeRules`. La même
// lecture sert à la vitrine (`getMyBadgeProgress`) : l'enfant voit où il en
// est sur ce qu'il n'a pas encore.
// ---------------------------------------------------------------------------

/**
 * L'instantané d'un élève : ses lignes d'essai, ses tentatives de palier,
 * sa progression par thématique et par matière (thématiques visibles pour son
 * niveau), ses missions, sa série. Borné : 4 000 lignes d'essai, 500
 * tentatives, 400 journées de missions.
 */
export async function buildStudentSnapshot(
  ctx: QueryCtx | MutationCtx,
  profile: Doc<"profiles">,
): Promise<StudentSnapshot> {
  const studentId = profile._id;
  const attempts = await ctx.db
    .query("attempts")
    .withIndex("by_studentId", (q) => q.eq("studentId", studentId))
    .take(4000);
  const palierAttempts = await ctx.db
    .query("palierAttempts")
    .withIndex("by_user", (q) => q.eq("userId", studentId))
    .take(500);

  const validatedPaliers = new Set<string>();
  const finishedPaliers = new Set<string>();
  for (const a of palierAttempts) {
    if (a.status === "validated") validatedPaliers.add(a.palierId as string);
    if (isFinished(a)) finishedPaliers.add(a.palierId as string);
  }
  const startedTopics = new Set<string>();
  for (const palierId of finishedPaliers) {
    const palier = await ctx.db.get(palierId as Id<"paliers">);
    if (palier) startedTopics.add(palier.topicId as string);
  }

  const progressRows = await ctx.db
    .query("studentTopicProgress")
    .withIndex("by_studentId", (q) => q.eq("studentId", studentId))
    .take(500);
  const progressByTopic = new Map(progressRows.map((p) => [p.topicId as string, p] as const));

  const subjects = (await ctx.db.query("subjects").take(50)).sort((a, b) => a.order - b.order);
  const topicRows: Parameters<typeof buildSnapshot>[0]["topics"][number][] = [];
  const subjectRows: Parameters<typeof buildSnapshot>[0]["subjects"][number][] = [];
  for (const subject of subjects) {
    const topics = await topicsForStudent(ctx, subject._id, profile);
    subjectRows.push({ subjectId: subject._id as string, name: subject.name, topicCount: topics.length });
    for (const topic of topics) {
      const p = progressByTopic.get(topic._id as string);
      const completed = p?.completedAt != null;
      topicRows.push({
        topicId: topic._id as string,
        subjectId: subject._id as string,
        completed,
        perfect: completed && !!p && p.completedExercises > 0 && p.correctExercises === p.completedExercises,
        started: startedTopics.has(topic._id as string) || (p?.completedExercises ?? 0) > 0,
        masteryLevel: p?.masteryLevel ?? 0,
      });
    }
  }

  const missions = await ctx.db
    .query("dailyMissions")
    .withIndex("by_student_day", (q) => q.eq("studentId", studentId))
    .take(400);
  let questsCompletedTotal = 0;
  let perfectQuestDays = 0;
  for (const day of missions) {
    const done = day.quests.filter((q) => q.completedAt !== undefined).length;
    questsCompletedTotal += done;
    if (day.quests.length > 0 && done === day.quests.length) perfectQuestDays += 1;
  }

  const prefs = readStudentPreferences(profile);
  return buildSnapshot({
    attempts: attempts.map((a) => ({
      palierAttemptId: a.palierAttemptId as string | undefined,
      exerciseId: a.exerciseId as string,
      attemptNumber: a.attemptNumber,
      isCorrect: a.isCorrect,
      hintsUsedCount: a.hintsUsedCount,
      timeSpentMs: a.timeSpentMs,
      submittedAt: a.submittedAt,
    })),
    paliersValidated: validatedPaliers.size,
    topics: topicRows,
    subjects: subjectRows,
    streakCurrent: prefs.streak?.current ?? 0,
    streakLongest: prefs.streak?.longest ?? 0,
    questsCompletedTotal,
    perfectQuestDays,
    // Le Sénégal vit à l'heure UTC : les trophées du matin et du soir aussi.
    utcOffsetHours: 0,
  });
}

export const checkAndAward = internalMutation({
  args: {
    studentId: v.id("profiles"),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.studentId);
    if (!profile || profile.role !== "student") return [];

    const allBadges = await ctx.db.query("badges").take(200);
    const alreadyEarned = await ctx.db
      .query("earnedBadges")
      .withIndex("by_studentId", (q) => q.eq("studentId", args.studentId))
      .take(200);
    const earnedBadgeIds = new Set(alreadyEarned.map((eb) => eb.badgeId as string));
    const snapshot = await buildStudentSnapshot(ctx, profile);

    const newlyAwarded: Array<{ badgeId: string; name: string; description: string; icon: string }> = [];
    for (const badge of allBadges) {
      if (earnedBadgeIds.has(badge._id as string)) continue;
      const evaluation = evaluateBadge(badge, snapshot);
      if (!evaluation?.deserved) continue;
      await ctx.db.insert("earnedBadges", {
        badgeId: badge._id,
        studentId: args.studentId,
        earnedAt: Date.now(),
        progressValue: evaluation.value,
      });
      newlyAwarded.push({
        badgeId: badge._id as string,
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
      });
    }
    return newlyAwarded;
  },
});

/**
 * Où en est l'élève de la session sur chaque trophée : la valeur atteinte et
 * la cible, pour la barre de progression de la vitrine. Les conditions que
 * le moteur ne sait pas juger n'y figurent pas.
 */
export const getMyBadgeProgress = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!profile || profile.role !== "student") return [];
    if (await blockedStudent(ctx)) return [];

    const allBadges = await ctx.db.query("badges").take(200);
    const snapshot = await buildStudentSnapshot(ctx, profile);
    const out: Array<{ badgeId: Id<"badges">; value: number; target: number; deserved: boolean }> = [];
    for (const badge of allBadges) {
      const evaluation = evaluateBadge(badge, snapshot);
      if (!evaluation) continue;
      out.push({ badgeId: badge._id, value: evaluation.value, target: evaluation.target, deserved: evaluation.deserved });
    }
    return out;
  },
});

/**
 * METTRE LES SEUILS DU CATALOGUE D'APLOMB. Le premier catalogue a été posé
 * avec des paramètres vides sur des trophées qui devraient se distinguer par
 * leur seuil (« Sans-faute » et « Série parfaite » partagent une condition).
 * Par clé de catalogue, on complète les paramètres manquants ; ce qui est
 * déjà posé n'est pas touché.
 *
 *     npx convex run badges:normalizeCatalog '{"confirmDeployment":"<nom>","dryRun":true}'
 */
const CATALOG_PARAMS: Record<string, Record<string, unknown>> = {
  mastery_perfect_series: { count: 3 },
  streak_daily: { count: 3 },
  streak_unstoppable: { count: 14 },
  volume_calculator: { count: 50 },
  volume_warrior: { count: 200 },
  behavior_no_hint: { count: 20 },
  behavior_first_try: { count: 25 },
  behavior_persistent: { minAttempts: 3, count: 5 },
  speed_speedster: { maxTimeMs: 20_000, count: 20 },
  speed_lightning: { count: 10, maxTimeMs: 15_000 },
  exploration_adventurer: { count: 2 },
  exploration_polymath: { count: 2 },
  secret_weekend_warrior: { count: 10 },
  secret_marathoner: { windowMs: 3_600_000, count: 30 },
  gaming_early_bird: { hour: 8, min: 1 },
};

export const normalizeCatalog = internalMutation({
  args: { confirmDeployment: v.string(), dryRun: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    assertTargetedDeployment(args.confirmDeployment);
    const badges = await ctx.db.query("badges").take(200);
    const patched: string[] = [];
    const unsupported: string[] = [];
    for (const badge of badges) {
      if (!isSupportedCondition(badge.condition)) unsupported.push(badge.name);
      const wanted =
        (badge.catalogKey && CATALOG_PARAMS[badge.catalogKey]) ||
        (badge.condition === "subject_avg_mastery" ? { minMastery: 80, minTopics: 3 } : null);
      if (!wanted) continue;
      const current =
        badge.conditionParams && typeof badge.conditionParams === "object"
          ? (badge.conditionParams as Record<string, unknown>)
          : {};
      const next = { ...wanted, ...current };
      if (JSON.stringify(next) === JSON.stringify(current)) continue;
      patched.push(`${badge.name}: ${JSON.stringify(next)}`);
      if (args.dryRun !== true) {
        await ctx.db.patch(badge._id, { conditionParams: next, conditionType: badge.condition });
      }
    }
    return { dryRun: args.dryRun === true, patched, unsupported };
  },
});
