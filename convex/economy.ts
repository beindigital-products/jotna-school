import { ConvexError, v } from "convex/values";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Doc, Id } from "./_generated/dataModel";
import { checkAccess, requireAccess } from "./access";
import { timestampToYmd, todayYmd } from "./streakRules";
import { CARDS, findShopItem } from "./gameCatalog";
import {
  DAILY_PALIER_CAP,
  WALLET_CAP,
  capGain,
  caurisForBadge,
  caurisForPalier,
  caurisForQuests,
  owedGain,
  rollChest,
} from "./economyRules";

// ---------------------------------------------------------------------------
// L'ÉCONOMIE DU JEU — les cauris, le coffre du jour, les cartes, le marché.
//
// LES CAURIS se gagnent à trois endroits déjà existants, où ce fichier est
// appelé comme une fonction ordinaire, dans la même transaction :
//   - `palierAttempts.finishPalierAttempt` (une fin de palier, jouée en ligne
//     ou rejouée par la synchronisation de l'application) → `rewardPalier` ;
//   - `quests.recordQuestActivity` (les missions du jour) → `rewardQuests` ;
//   - `badges.checkAndAward` (un trophée gagné) → `rewardBadge`.
// Et à un endroit nouveau : `openDailyChest`, le coffre du jour.
//
// RIEN N'EST PAYÉ DEUX FOIS. Chaque gain porte une clé (`refKey`) et le journal
// `cauriLedger` dit ce que cette clé a déjà rapporté : on ne verse que la
// différence. Une tentative notée une seconde fois après une nouvelle chance
// ne rapporte que les étoiles gagnées en plus.
//
// LE SOLDE vit dans `wallets`, à part du profil (voir le schéma). Les règles
// de calcul sont dans `economyRules.ts`, le catalogue dans `gameCatalog.ts`.
//
// DANS L'APPLICATION SANS RÉSEAU, les gains d'un palier arrivent à la
// synchronisation ; le coffre et le marché demandent le réseau.
// Voir `docs/economie-du-jeu.md`.
// ---------------------------------------------------------------------------

type LedgerReason = Doc<"cauriLedger">["reason"];

async function studentFromSession(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) return null;
  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_userId", (q) => q.eq("userId", userId as string))
    .unique();
  if (!profile || profile.role !== "student") return null;
  return profile;
}

async function walletOf(ctx: QueryCtx | MutationCtx, studentId: Id<"profiles">) {
  return await ctx.db
    .query("wallets")
    .withIndex("by_student", (q) => q.eq("studentId", studentId))
    .unique();
}

/** Ce qu'une clé a déjà rapporté (la somme de ses lignes au journal). */
async function paidFor(ctx: QueryCtx | MutationCtx, studentId: Id<"profiles">, refKey: string) {
  const rows = await ctx.db
    .query("cauriLedger")
    .withIndex("by_student_ref", (q) => q.eq("studentId", studentId).eq("refKey", refKey))
    .take(50);
  return rows.reduce((sum, row) => sum + row.amount, 0);
}

/** Ajoute (ou retire, si `amount` est négatif) au solde, borné. */
async function moveWallet(ctx: MutationCtx, studentId: Id<"profiles">, amount: number, at: number) {
  const wallet = await walletOf(ctx, studentId);
  const earned = Math.max(0, amount);
  if (!wallet) {
    await ctx.db.insert("wallets", {
      studentId,
      cauris: Math.min(WALLET_CAP, Math.max(0, amount)),
      earnedTotal: earned,
      updatedAt: at,
    });
    return;
  }
  await ctx.db.patch(wallet._id, {
    cauris: Math.min(WALLET_CAP, Math.max(0, wallet.cauris + amount)),
    earnedTotal: wallet.earnedTotal + earned,
    updatedAt: at,
  });
}

/**
 * VERSER DES CAURIS pour que la clé `refKey` ait rapporté `target` en tout.
 * Rend ce qui a été versé cette fois (0 si tout l'était déjà). `dailyCap`
 * borne ce que la raison `reason` rapporte dans la journée de `at`.
 */
export async function creditCauris(
  ctx: MutationCtx,
  studentId: Id<"profiles">,
  input: { refKey: string; target: number; reason: LedgerReason; at: number; dailyCap?: number },
): Promise<number> {
  // Jamais dans le futur : une horloge de téléphone en avance ne crée pas de
  // journée (même règle que les missions).
  const when = Math.min(input.at, Date.now());
  const dayKey = timestampToYmd(when);

  let gain = owedGain(await paidFor(ctx, studentId, input.refKey), input.target);
  if (gain > 0 && input.dailyCap !== undefined) {
    const today = await ctx.db
      .query("cauriLedger")
      .withIndex("by_student_day", (q) => q.eq("studentId", studentId).eq("dayKey", dayKey))
      .take(500);
    const already = today
      .filter((row) => row.reason === input.reason)
      .reduce((sum, row) => sum + row.amount, 0);
    gain = capGain(already, gain, input.dailyCap);
  }
  if (gain <= 0) return 0;

  await ctx.db.insert("cauriLedger", {
    studentId,
    dayKey,
    amount: gain,
    reason: input.reason,
    refKey: input.refKey,
    at: when,
  });
  await moveWallet(ctx, studentId, gain, when);
  return gain;
}

/** Une fin de palier. Rend les cauris versés pour cette notation. */
export async function rewardPalier(
  ctx: MutationCtx,
  studentId: Id<"profiles">,
  attemptId: Id<"palierAttempts">,
  outcome: { stars: number; validated: boolean },
  at: number,
): Promise<number> {
  return await creditCauris(ctx, studentId, {
    refKey: `palier:${attemptId}`,
    target: caurisForPalier(outcome),
    reason: "palier",
    at,
    dailyCap: DAILY_PALIER_CAP,
  });
}

/** Les missions du jour `dayKey`, pour `completed` missions faites sur `total`. */
export async function rewardQuests(
  ctx: MutationCtx,
  studentId: Id<"profiles">,
  dayKey: string,
  completed: number,
  total: number,
  at: number,
): Promise<number> {
  return await creditCauris(ctx, studentId, {
    refKey: `quests:${dayKey}`,
    target: caurisForQuests(completed, total),
    reason: "quests",
    at,
  });
}

/** Un trophée gagné. */
export async function rewardBadge(
  ctx: MutationCtx,
  studentId: Id<"profiles">,
  badgeId: Id<"badges">,
  rarity: string | undefined,
  at: number,
): Promise<number> {
  return await creditCauris(ctx, studentId, {
    refKey: `badge:${badgeId}`,
    target: caurisForBadge(rarity),
    reason: "badge",
    at,
  });
}

/** L'enfant a-t-il fini un palier le jour `dayKey` ? C'est ce qui prépare le coffre. */
async function playedOn(ctx: QueryCtx | MutationCtx, studentId: Id<"profiles">, dayKey: string) {
  const recent = await ctx.db
    .query("palierAttempts")
    .withIndex("by_user", (q) => q.eq("userId", studentId))
    .order("desc")
    .take(20);
  return recent.some(
    (attempt) => attempt.completedAt !== undefined && timestampToYmd(attempt.completedAt) === dayKey,
  );
}

async function chestOf(ctx: QueryCtx | MutationCtx, studentId: Id<"profiles">, dayKey: string) {
  return await ctx.db
    .query("dailyChests")
    .withIndex("by_student_day", (q) => q.eq("studentId", studentId).eq("dayKey", dayKey))
    .unique();
}

function chestContents(row: Doc<"dailyChests">) {
  return {
    cauris: row.cauris,
    cardId: row.cardId,
    duplicate: row.duplicate,
    duplicateCauris: row.duplicateCauris,
  };
}

/**
 * LA BOURSE DE L'ÉLÈVE : son solde, l'état du coffre du jour et les objets du
 * marché qu'il possède (le camp les pose dans sa scène). `null` = pas un
 * élève, ou pas d'accès.
 *
 * Le coffre est `locked` tant que l'enfant n'a pas fini un palier aujourd'hui,
 * `ready` ensuite, `opened` une fois ouvert (avec ce qu'il contenait).
 */
export const getMyWallet = query({
  args: {},
  handler: async (ctx) => {
    const profile = await studentFromSession(ctx);
    if (!profile) return null;
    const access = await checkAccess(ctx, profile);
    if (!access.ok) return null;

    const dayKey = todayYmd();
    const wallet = await walletOf(ctx, profile._id);
    const opened = await chestOf(ctx, profile._id, dayKey);
    const items = await ctx.db
      .query("studentItems")
      .withIndex("by_student", (q) => q.eq("studentId", profile._id))
      .take(200);

    const chest = opened
      ? { state: "opened" as const, ...chestContents(opened) }
      : (await playedOn(ctx, profile._id, dayKey))
        ? { state: "ready" as const }
        : { state: "locked" as const };

    return {
      cauris: wallet?.cauris ?? 0,
      dayKey,
      chest,
      ownedItemIds: items.map((item) => item.itemId),
    };
  },
});

/** Les cartes de l'album de l'élève. `null` = pas un élève, ou pas d'accès. */
export const getMyCards = query({
  args: {},
  handler: async (ctx) => {
    const profile = await studentFromSession(ctx);
    if (!profile) return null;
    const access = await checkAccess(ctx, profile);
    if (!access.ok) return null;

    const rows = await ctx.db
      .query("studentCards")
      .withIndex("by_student", (q) => q.eq("studentId", profile._id))
      .take(500);
    return rows.map((row) => ({ cardId: row.cardId, obtainedAt: row.obtainedAt }));
  },
});

/**
 * OUVRIR LE COFFRE DU JOUR. Un coffre par jour, prêt dès qu'un palier a été
 * fini ce jour-là. Un second appel rend le même coffre sans rien verser.
 */
export const openDailyChest = mutation({
  args: {},
  handler: async (ctx) => {
    const profile = await studentFromSession(ctx);
    if (!profile) throw new Error("Profil élève introuvable");
    await requireAccess(ctx, profile);

    const now = Date.now();
    const dayKey = timestampToYmd(now);
    const already = await chestOf(ctx, profile._id, dayKey);
    if (already) return chestContents(already);

    if (!(await playedOn(ctx, profile._id, dayKey))) {
      throw new ConvexError({ code: "CHEST_NOT_READY" });
    }

    const owned = await ctx.db
      .query("studentCards")
      .withIndex("by_student", (q) => q.eq("studentId", profile._id))
      .take(500);
    const roll = rollChest({
      seed: `${profile._id}|${dayKey}`,
      cards: CARDS,
      ownedCardIds: owned.map((row) => row.cardId),
    });

    await ctx.db.insert("dailyChests", {
      studentId: profile._id,
      dayKey,
      openedAt: now,
      cauris: roll.cauris,
      cardId: roll.cardId,
      duplicate: roll.duplicate,
      duplicateCauris: roll.duplicateCauris,
    });
    await creditCauris(ctx, profile._id, {
      refKey: `chest:${dayKey}`,
      target: roll.cauris,
      reason: "chest",
      at: now,
    });
    if (roll.duplicate) {
      await creditCauris(ctx, profile._id, {
        refKey: `chest-card:${dayKey}`,
        target: roll.duplicateCauris,
        reason: "duplicate_card",
        at: now,
      });
    } else {
      await ctx.db.insert("studentCards", {
        studentId: profile._id,
        cardId: roll.cardId,
        obtainedAt: now,
        source: "chest",
      });
    }

    return {
      cauris: roll.cauris,
      cardId: roll.cardId,
      duplicate: roll.duplicate,
      duplicateCauris: roll.duplicateCauris,
    };
  },
});

/**
 * ACHETER UN OBJET DU MARCHÉ. Le prix vient du catalogue, jamais de l'écran.
 * Un objet déjà possédé ne se rachète pas (l'appel ne coûte rien).
 */
export const buyItem = mutation({
  args: { itemId: v.string() },
  handler: async (ctx, args) => {
    const profile = await studentFromSession(ctx);
    if (!profile) throw new Error("Profil élève introuvable");
    await requireAccess(ctx, profile);

    const item = findShopItem(args.itemId);
    if (!item) throw new ConvexError({ code: "UNKNOWN_ITEM" });

    const wallet = await walletOf(ctx, profile._id);
    const balance = wallet?.cauris ?? 0;
    const owned = await ctx.db
      .query("studentItems")
      .withIndex("by_student_item", (q) => q.eq("studentId", profile._id).eq("itemId", item.id))
      .unique();
    if (owned) return { cauris: balance, alreadyOwned: true };

    if (balance < item.price) {
      throw new ConvexError({ code: "NOT_ENOUGH_CAURIS", missing: item.price - balance });
    }

    const now = Date.now();
    await ctx.db.insert("cauriLedger", {
      studentId: profile._id,
      dayKey: timestampToYmd(now),
      amount: -item.price,
      reason: "purchase",
      refKey: `buy:${item.id}`,
      at: now,
    });
    await moveWallet(ctx, profile._id, -item.price, now);
    await ctx.db.insert("studentItems", {
      studentId: profile._id,
      itemId: item.id,
      boughtAt: now,
    });
    return { cauris: balance - item.price, alreadyOwned: false };
  },
});
