/**
 * Les codes d'invitation : l'équipe les émet, l'inscription les consomme.
 *
 * AVANT LE LANCEMENT, aucun compte ne naît d'un formulaire public sans l'un de
 * ces codes. Les règles (forme du code, motifs de refus, phrases) vivent dans
 * `invitationRules.ts`, pur et testé ; ce fichier lit et écrit.
 *
 * QUI APPELLE QUOI :
 *
 * - `check`            — la pop-up du site et `/register`, SANS CONNEXION :
 *                        ce code ouvre-t-il une inscription ?
 * - `redeemInvitation` — `createOrUpdateUser` (`convex/auth.ts`), dans la
 *                        transaction qui crée le compte ;
 * - `list`, `listUses`, `create`, `setRevoked` — la console `admin`
 *                        (`/admin/invitations`) ;
 * - `issue`            — interne, pour un déploiement neuf (voir plus bas).
 */
import { ConvexError, v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import {
  internalMutation,
  mutation,
  query,
  type MutationCtx,
} from "./_generated/server";
import { callerAdminProfile, callerIsAdmin } from "./access";
import {
  buildInvitationCode,
  cleanInvitationMaxUses,
  decideInvitation,
  INVITATION_MAX_USES,
  INVITATION_REFUSALS,
  normalizeInvitationCode,
  printableInvitationCode,
  type InvitationRefusal,
} from "./invitationRules";
import { cleanName, NAME_MAX } from "./openAccessRules";
import { secureRandomInt } from "./secureRandom";

/** Ce que `check` répond : ouvert, ou refusé avec la phrase à afficher. */
type InvitationCheck =
  | { ok: true }
  | { ok: false; reason: InvitationRefusal; message: string };

function refusal(reason: InvitationRefusal): InvitationCheck {
  return { ok: false, reason, message: INVITATION_REFUSALS[reason] };
}

/**
 * Ce code ouvre-t-il une inscription ? — APPELÉE SANS CONNEXION.
 *
 * ELLE NE CONSOMME RIEN ET NE PROMET RIEN. C'est une lecture, pour que la
 * pop-up réponde avant que la personne ait rempli un formulaire. Le contrôle
 * qui compte est refait par `redeemInvitation`, dans la transaction qui crée
 * le compte : entre les deux, un autre a pu prendre la dernière place.
 *
 * ELLE NE REND NI LE LIBELLÉ NI LE COMPTE D'USAGES : le libellé est une note
 * de l'équipe (« pour qui »), et un code juste ne donne pas le droit de la
 * lire.
 *
 * `.first()` et non `.unique()` : une requête ne lève jamais (convention du
 * dépôt). L'unicité est vérifiée à l'émission.
 */
export const check = query({
  args: { code: v.string() },
  handler: async (ctx, args): Promise<InvitationCheck> => {
    const code = normalizeInvitationCode(args.code);
    if (code === "") return refusal("missing");

    const invitation = await ctx.db
      .query("invitationCodes")
      .withIndex("by_code", (q) => q.eq("code", code))
      .first();
    const decision = decideInvitation(invitation);
    return decision.ok ? { ok: true } : refusal(decision.reason);
  },
});

/**
 * Consomme une place du code pour le compte qui vient d'être créé, ou LÈVE.
 *
 * À APPELER DANS LA MUTATION QUI CRÉE LE COMPTE, et nulle part ailleurs.
 * Convex annule toutes les écritures d'une mutation qui lève : un code
 * refusé ici défait donc aussi l'utilisateur et le profil insérés juste
 * avant. Il n'existe aucun état où le compte est né sans que la place soit
 * comptée, ni l'inverse.
 *
 * DEUX INSCRIPTIONS SIMULTANÉES sur la dernière place n'entrent pas toutes
 * les deux : une mutation Convex est une transaction sérialisable, et la
 * seconde, dont la lecture de `by_code` est invalidée par la première,
 * rejoue, lit le compteur à jour et lève.
 *
 * `.unique()` ici, contrairement à `check` : c'est l'endroit où un doublon de
 * code doit se faire entendre plutôt que de laisser entrer.
 */
export async function redeemInvitation(
  ctx: MutationCtx,
  args: { code: string; userId: Id<"users"> },
): Promise<void> {
  if (args.code === "") throw new ConvexError(INVITATION_REFUSALS.missing);

  const invitation = await ctx.db
    .query("invitationCodes")
    .withIndex("by_code", (q) => q.eq("code", args.code))
    .unique();
  if (invitation === null) throw new ConvexError(INVITATION_REFUSALS.unknown);
  const decision = decideInvitation(invitation);
  if (!decision.ok) throw new ConvexError(INVITATION_REFUSALS[decision.reason]);

  await ctx.db.patch("invitationCodes", invitation._id, {
    useCount: invitation.useCount + 1,
  });
  await ctx.db.insert("invitationUses", {
    invitationId: invitation._id,
    userId: args.userId,
  });
}

/** Essais pour tirer un code libre. Sur 209 milliards de valeurs, un suffit. */
const CODE_ATTEMPTS = 5;

/** Insère un code neuf et rend sa forme imprimable. */
async function insertInvitation(
  ctx: MutationCtx,
  args: { label: string; maxUses: number; createdBy?: Id<"profiles"> },
): Promise<string> {
  const label = cleanName(args.label);
  if (label === null) {
    throw new ConvexError(
      `Indiquez pour qui est ce code (${NAME_MAX} caractères au plus).`,
    );
  }
  const maxUses = cleanInvitationMaxUses(args.maxUses);
  if (maxUses === null) {
    throw new ConvexError(
      `Un code laisse entrer de 1 à ${INVITATION_MAX_USES} personnes.`,
    );
  }

  for (let attempt = 0; attempt < CODE_ATTEMPTS; attempt++) {
    const printable = buildInvitationCode(secureRandomInt);
    const code = normalizeInvitationCode(printable);
    const taken = await ctx.db
      .query("invitationCodes")
      .withIndex("by_code", (q) => q.eq("code", code))
      .first();
    if (taken !== null) continue;

    await ctx.db.insert("invitationCodes", {
      code,
      label,
      maxUses,
      useCount: 0,
      createdBy: args.createdBy,
    });
    return printable;
  }
  throw new ConvexError("Aucun code libre n'a pu être tiré. Réessayez.");
}

/**
 * Émet un code — console `admin`.
 *
 * `callerAdminProfile` et non `callerIsAdmin` : le code garde le nom de celui
 * qui l'a émis, même règle que les journaux de `schools.ts`.
 */
export const create = mutation({
  args: { label: v.string(), maxUses: v.number() },
  handler: async (ctx, args): Promise<{ code: string }> => {
    const admin = await callerAdminProfile(ctx);
    if (admin === null) throw new ConvexError("Rôle non autorisé");

    const code = await insertInvitation(ctx, {
      label: args.label,
      maxUses: args.maxUses,
      createdBy: admin._id,
    });
    return { code };
  },
});

/**
 * Émet un code SANS console — pour un déploiement neuf.
 *
 * Sur une base vide il n'y a pas encore d'administrateur, donc personne pour
 * ouvrir `/admin/invitations`, et sans code personne ne s'inscrit. Cette
 * mutation interne rompt le cercle : elle ne se lance que depuis le tableau
 * de bord Convex ou la ligne de commande, par qui tient déjà le déploiement.
 *
 *     npx convex run invitations:issue '{"label":"Équipe Jotna","maxUses":1}'
 */
export const issue = internalMutation({
  args: { label: v.string(), maxUses: v.number() },
  handler: async (ctx, args): Promise<{ code: string }> => {
    return { code: await insertInvitation(ctx, args) };
  },
});

/** Désactive un code, ou le réactive — console `admin`. Les usages restent. */
export const setRevoked = mutation({
  args: { invitationId: v.id("invitationCodes"), revoked: v.boolean() },
  handler: async (ctx, args): Promise<null> => {
    if (!(await callerIsAdmin(ctx))) throw new ConvexError("Rôle non autorisé");

    const invitation = await ctx.db.get("invitationCodes", args.invitationId);
    if (invitation === null) throw new ConvexError("Code introuvable");

    // Déjà dans l'état demandé : rien à écrire, et la date de la première
    // désactivation reste celle de la première.
    if ((invitation.revokedAt !== undefined) === args.revoked) return null;

    await ctx.db.patch("invitationCodes", invitation._id, {
      revokedAt: args.revoked ? Date.now() : undefined,
    });
    return null;
  },
});

/** Ce que l'écran d'administration lit au plus, des plus récents aux plus anciens. */
const LIST_LIMIT = 200;

type InvitationRow = {
  id: Id<"invitationCodes">;
  code: string;
  label: string;
  maxUses: number;
  useCount: number;
  status: "active" | "revoked" | "exhausted";
  createdAt: number;
};

/**
 * Les codes émis, des plus récents aux plus anciens — console `admin`.
 *
 * Une liste vide pour tout autre rôle, comme `waitlist.list` : la console est
 * déjà fermée aux autres par `RoleGate`, et cette garde-ci est celle qui
 * protège les codes.
 */
export const list = query({
  args: {},
  handler: async (
    ctx,
  ): Promise<{ invitations: InvitationRow[]; truncated: boolean }> => {
    if (!(await callerIsAdmin(ctx))) {
      return { invitations: [], truncated: false };
    }

    const rows = await ctx.db
      .query("invitationCodes")
      .order("desc")
      .take(LIST_LIMIT + 1);

    return {
      invitations: rows.slice(0, LIST_LIMIT).map((row) => {
        const decision = decideInvitation(row);
        return {
          id: row._id,
          code: printableInvitationCode(row.code),
          label: row.label,
          maxUses: row.maxUses,
          useCount: row.useCount,
          // `decideInvitation` ne rend ni « missing » ni « unknown » pour une
          // ligne lue en base : il reste « désactivé » ou « épuisé ».
          status: decision.ok
            ? "active"
            : decision.reason === "revoked"
              ? "revoked"
              : "exhausted",
          createdAt: row._creationTime,
        };
      }),
      truncated: rows.length > LIST_LIMIT,
    };
  },
});

type InvitationUseRow = {
  id: Id<"invitationUses">;
  name: string;
  email: string | null;
  role: string | null;
  usedAt: number;
};

/**
 * Les comptes créés avec un code, du plus récent au plus ancien — console
 * `admin`. Borné par `INVITATION_MAX_USES` : un code n'a jamais plus d'usages.
 *
 * Un compte supprimé depuis garde sa ligne, sans nom : la place a bien été
 * prise, et l'effacer ferait mentir le compteur.
 */
export const listUses = query({
  args: { invitationId: v.id("invitationCodes") },
  handler: async (ctx, args): Promise<InvitationUseRow[]> => {
    if (!(await callerIsAdmin(ctx))) return [];

    const uses = await ctx.db
      .query("invitationUses")
      .withIndex("by_invitationId", (q) =>
        q.eq("invitationId", args.invitationId),
      )
      .order("desc")
      .take(INVITATION_MAX_USES);

    return await Promise.all(
      uses.map(async (use) => {
        const user = await ctx.db.get("users", use.userId);
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_userId", (q) => q.eq("userId", use.userId))
          .first();
        return {
          id: use._id,
          name: profile?.name ?? user?.name ?? "",
          email: user?.email ?? null,
          role: profile?.role ?? null,
          usedAt: use._creationTime,
        };
      }),
    );
  },
});
