/**
 * La liste d'attente : la vitrine y inscrit, la console d'administration la lit.
 *
 * Jotna School ouvre à la vente à la rentrée 2027-2028. Jusque-là, le site ne
 * propose aucun paiement, et les visiteurs qui veulent être prévenus laissent
 * leur adresse ici. Les règles (forme de l'adresse, profils admis) vivent dans
 * `waitlistRules.ts`, pur et testé.
 */
import { ConvexError, v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { callerIsAdmin } from "./access";
import {
  normalizeWaitlistEmail,
  waitlistAudienceValidator,
  type WaitlistAudience,
} from "./waitlistRules";

type WaitlistRow = {
  id: Id<"waitlistEntries">;
  email: string;
  audience: WaitlistAudience;
  createdAt: number;
};

/**
 * Inscrit une adresse — APPELÉE SANS CONNEXION, par un visiteur de la vitrine.
 *
 * LA MÊME RÉPONSE, que l'adresse soit nouvelle ou déjà inscrite. Dire « déjà
 * sur la liste » permettrait à n'importe qui de vérifier si une adresse donnée
 * s'y trouve.
 *
 * LA PREMIÈRE INSCRIPTION FAIT FOI, profil compris : sa date dit depuis quand
 * la personne attend, et une seconde saisie ne la rajeunit pas.
 *
 * DEUX ENVOIS SIMULTANÉS de la même adresse ne font pas deux lignes : une
 * mutation Convex est une transaction sérialisable, et la seconde, dont la
 * lecture de `by_email` est invalidée par la première, rejoue et trouve la
 * ligne déjà écrite.
 */
export const join = mutation({
  args: { email: v.string(), audience: waitlistAudienceValidator },
  handler: async (ctx, args) => {
    const email = normalizeWaitlistEmail(args.email);
    if (email === null) {
      throw new ConvexError("Cette adresse e-mail n'est pas valide.");
    }

    const existing = await ctx.db
      .query("waitlistEntries")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    if (existing === null) {
      await ctx.db.insert("waitlistEntries", {
        email,
        audience: args.audience,
        createdAt: Date.now(),
      });
    }
    return null;
  },
});

/** Ce que l'écran d'administration lit au plus, des plus récentes aux plus anciennes. */
const LIST_LIMIT = 2000;

/**
 * Les inscriptions, des plus récentes aux plus anciennes — console `admin`.
 *
 * Une liste vide pour tout autre rôle, comme `students.listStudents` : la
 * console est déjà fermée aux autres par `RoleGate`, et cette garde-ci est
 * celle qui protège les adresses.
 *
 * `truncated` dit qu'il en existe au-delà de `LIST_LIMIT` : l'écran l'annonce,
 * plutôt que de laisser croire que l'export CSV contient tout.
 */
export const list = query({
  args: {},
  handler: async (
    ctx,
  ): Promise<{ entries: WaitlistRow[]; truncated: boolean }> => {
    if (!(await callerIsAdmin(ctx))) return { entries: [], truncated: false };

    const rows = await ctx.db
      .query("waitlistEntries")
      .order("desc")
      .take(LIST_LIMIT + 1);

    return {
      entries: rows.slice(0, LIST_LIMIT).map((row) => ({
        id: row._id,
        email: row.email,
        audience: row.audience,
        createdAt: row.createdAt,
      })),
      truncated: rows.length > LIST_LIMIT,
    };
  },
});
