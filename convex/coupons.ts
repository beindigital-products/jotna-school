/**
 * Les coupons : l'équipe les émet, les comptes adultes les utilisent.
 *
 * Règles (forme du code, saisie, motifs de refus, phrases) dans
 * `couponRules.ts`, pur et testé ; ce fichier lit et écrit.
 *
 * QUI APPELLE QUOI :
 *
 * - `create`, `list`, `setRevoked`, `listRedemptions` — la console `admin`
 *   (`/admin/coupons`) ;
 * - `redeem`, `myRedemptions` — la carte « Code promo » des paramètres parent,
 *   professeur et école (`components/dashboard/account-settings.tsx`).
 *
 * L'AVANTAGE N'AGIT PAS ENCORE SUR L'ACCÈS : voir l'en-tête de `couponRules.ts`.
 */
import { ConvexError, v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx } from "./_generated/server";
import { callerAdminProfile, callerIsAdmin, callerProfile } from "./access";
import {
  buildCouponCode,
  cleanCouponDraft,
  COUPON_REFUSALS,
  couponStatus,
  decideCouponRedemption,
  describeCouponBenefit,
  freeAccessUntil,
  normalizeCouponCode,
  printableCouponCode,
  redemptionState,
  type CouponAudience,
  type CouponBenefit,
  type CouponRole,
  type CouponStatus,
  type RedemptionState,
} from "./couponRules";
import { secureRandomInt } from "./secureRandom";

/** Essais pour tirer un code libre. Sur 209 milliards de valeurs, un suffit. */
const CODE_ATTEMPTS = 5;

/** Ce que la console lit au plus, des plus récents aux plus anciens. */
const LIST_LIMIT = 300;
const REDEMPTIONS_LIMIT = 500;

// ── Console admin ───────────────────────────────────────────────────────────

/** Émet un coupon. Le code est tiré au sort, sauf si l'équipe en choisit un. */
export const create = mutation({
  args: {
    label: v.string(),
    audience: v.string(),
    benefitKind: v.string(),
    benefitValue: v.number(),
    maxUses: v.number(),
    customCode: v.optional(v.string()),
    startsAt: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<{ code: string }> => {
    const admin = await callerAdminProfile(ctx);
    if (admin === null) throw new ConvexError("Rôle non autorisé");

    const cleaned = cleanCouponDraft(args, Date.now());
    if (!cleaned.ok) throw new ConvexError(cleaned.message);
    const { draft } = cleaned;

    let code: string | null = null;
    if (draft.customCode !== null) {
      const taken = await ctx.db
        .query("coupons")
        .withIndex("by_code", (q) => q.eq("code", draft.customCode!))
        .first();
      if (taken !== null) {
        throw new ConvexError("Ce code existe déjà. Choisissez-en un autre.");
      }
      code = draft.customCode;
    } else {
      for (let attempt = 0; attempt < CODE_ATTEMPTS && code === null; attempt++) {
        const candidate = normalizeCouponCode(buildCouponCode(secureRandomInt));
        const taken = await ctx.db
          .query("coupons")
          .withIndex("by_code", (q) => q.eq("code", candidate))
          .first();
        if (taken === null) code = candidate;
      }
      if (code === null) {
        throw new ConvexError("Aucun code libre n'a pu être tiré. Réessayez.");
      }
    }

    await ctx.db.insert("coupons", {
      code,
      label: draft.label,
      audience: draft.audience,
      benefit: draft.benefit,
      maxUses: draft.maxUses,
      useCount: 0,
      startsAt: draft.startsAt,
      expiresAt: draft.expiresAt,
      createdBy: admin._id,
    });
    return { code: printableCouponCode(code) };
  },
});

/** Désactive un coupon, ou le réactive. Les utilisations passées restent. */
export const setRevoked = mutation({
  args: { couponId: v.id("coupons"), revoked: v.boolean() },
  handler: async (ctx, args): Promise<null> => {
    if (!(await callerIsAdmin(ctx))) throw new ConvexError("Rôle non autorisé");
    const coupon = await ctx.db.get("coupons", args.couponId);
    if (coupon === null) throw new ConvexError("Coupon introuvable");
    if ((coupon.revokedAt !== undefined) === args.revoked) return null;
    await ctx.db.patch("coupons", coupon._id, {
      revokedAt: args.revoked ? Date.now() : undefined,
    });
    return null;
  },
});

type CouponRow = {
  id: Id<"coupons">;
  code: string;
  label: string;
  audience: CouponAudience;
  benefit: CouponBenefit;
  benefitLabel: string;
  maxUses: number;
  useCount: number;
  startsAt: number | null;
  expiresAt: number | null;
  status: CouponStatus;
  createdAt: number;
};

/** Les coupons émis — console `admin`. Liste vide pour tout autre rôle. */
export const list = query({
  args: {},
  handler: async (ctx): Promise<{ coupons: CouponRow[]; truncated: boolean }> => {
    if (!(await callerIsAdmin(ctx))) return { coupons: [], truncated: false };
    const now = Date.now();
    const rows = await ctx.db.query("coupons").order("desc").take(LIST_LIMIT + 1);
    return {
      coupons: rows.slice(0, LIST_LIMIT).map((row) => ({
        id: row._id,
        code: printableCouponCode(row.code),
        label: row.label,
        audience: row.audience,
        benefit: row.benefit,
        benefitLabel: describeCouponBenefit(row.benefit),
        maxUses: row.maxUses,
        useCount: row.useCount,
        startsAt: row.startsAt ?? null,
        expiresAt: row.expiresAt ?? null,
        status: couponStatus(row, now),
        createdAt: row._creationTime,
      })),
      truncated: rows.length > LIST_LIMIT,
    };
  },
});

type RedemptionRow = {
  id: Id<"couponRedemptions">;
  name: string;
  email: string | null;
  role: CouponRole;
  schoolName: string | null;
  at: number;
  state: RedemptionState;
  accessUntil: number | null;
};

/** Qui a utilisé un coupon, du plus récent au plus ancien — console `admin`. */
export const listRedemptions = query({
  args: { couponId: v.id("coupons") },
  handler: async (ctx, args): Promise<RedemptionRow[]> => {
    if (!(await callerIsAdmin(ctx))) return [];
    const now = Date.now();
    const rows = await ctx.db
      .query("couponRedemptions")
      .withIndex("by_couponId", (q) => q.eq("couponId", args.couponId))
      .order("desc")
      .take(REDEMPTIONS_LIMIT);

    return await Promise.all(
      rows.map(async (row) => {
        const profile = await ctx.db.get("profiles", row.profileId);
        const user = profile
          ? await ctx.db.get("users", profile.userId as Id<"users">)
          : null;
        const school = row.schoolId ? await ctx.db.get("schools", row.schoolId) : null;
        return {
          id: row._id,
          name: profile?.name ?? "Compte supprimé",
          email: user?.email ?? null,
          role: row.role,
          schoolName: school?.name ?? null,
          at: row.at,
          state: redemptionState(row, now),
          accessUntil: row.accessUntil ?? null,
        };
      }),
    );
  },
});

// ── Côté compte ─────────────────────────────────────────────────────────────

/** L'école d'un compte `directeur` : celle qu'il a créée, hors espace personnel. */
async function ownedSchoolId(
  ctx: MutationCtx,
  profile: Doc<"profiles">,
): Promise<Id<"schools"> | undefined> {
  if (profile.role !== "directeur") return undefined;
  const schools = await ctx.db
    .query("schools")
    .withIndex("by_ownerProfileId", (q) => q.eq("ownerProfileId", profile._id))
    .take(5);
  return schools.find((school) => school.kind !== "personal")?._id;
}

/**
 * Utilise un coupon pour le compte connecté, ou LÈVE avec la phrase à
 * afficher. Le compteur et la ligne d'utilisation s'écrivent dans la même
 * transaction : deux comptes sur la dernière place n'entrent pas tous les deux.
 */
export const redeem = mutation({
  args: { code: v.string() },
  handler: async (
    ctx,
    args,
  ): Promise<{ benefitLabel: string; accessUntil: number | null }> => {
    const code = normalizeCouponCode(args.code);
    if (code === "") throw new ConvexError(COUPON_REFUSALS.missing);

    const profile = await callerProfile(ctx);
    const coupon = await ctx.db
      .query("coupons")
      .withIndex("by_code", (q) => q.eq("code", code))
      .unique();

    const already =
      profile !== null && coupon !== null
        ? await ctx.db
            .query("couponRedemptions")
            .withIndex("by_profileId_and_couponId", (q) =>
              q.eq("profileId", profile._id).eq("couponId", coupon._id),
            )
            .first()
        : null;

    const now = Date.now();
    const decision = decideCouponRedemption({
      coupon,
      role: profile?.role ?? null,
      alreadyRedeemed: already !== null,
      now,
    });
    if (!decision.ok) throw new ConvexError(COUPON_REFUSALS[decision.reason]);
    // La règle a refusé tout `null` et tout rôle hors de `COUPON_ROLES`.
    const caller = profile!;
    const found = coupon!;

    const accessUntil = freeAccessUntil(found.benefit, now);
    await ctx.db.patch("coupons", found._id, { useCount: found.useCount + 1 });
    await ctx.db.insert("couponRedemptions", {
      couponId: found._id,
      profileId: caller._id,
      role: caller.role as CouponRole,
      schoolId: await ownedSchoolId(ctx, caller),
      benefit: found.benefit,
      at: now,
      accessUntil,
    });
    return {
      benefitLabel: describeCouponBenefit(found.benefit),
      accessUntil: accessUntil ?? null,
    };
  },
});

// Pas de `label` : c'est une note de l'équipe (« pour qui »), comme celui des
// codes d'invitation. Le compte voit le code et l'avantage.
type MyRedemptionRow = {
  id: Id<"couponRedemptions">;
  code: string;
  benefitLabel: string;
  at: number;
  state: RedemptionState;
  accessUntil: number | null;
};

/** Les coupons utilisés par le compte connecté. */
export const myRedemptions = query({
  args: {},
  handler: async (ctx): Promise<MyRedemptionRow[]> => {
    const profile = await callerProfile(ctx);
    if (profile === null) return [];
    const now = Date.now();
    const rows = await ctx.db
      .query("couponRedemptions")
      .withIndex("by_profileId", (q) => q.eq("profileId", profile._id))
      .order("desc")
      .take(50);
    return await Promise.all(
      rows.map(async (row) => {
        const coupon = await ctx.db.get("coupons", row.couponId);
        return {
          id: row._id,
          code: coupon ? printableCouponCode(coupon.code) : "",
          benefitLabel: describeCouponBenefit(row.benefit),
          at: row.at,
          state: redemptionState(row, now),
          accessUntil: row.accessUntil ?? null,
        };
      }),
    );
  },
});
