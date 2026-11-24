import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";

// ---------------------------------------------------------------------------
// LE FREIN SUR LES CODES ÉLÈVES.
//
// Un code élève ELV- ouvre une classe à qui le connaît, et il rend le prénom
// de l'enfant. Sans frein, un professeur inscrit en essayait des milliers par
// seconde (une requête de lecture n'écrit rien, donc ne compte rien). La
// vérification est donc une MUTATION : elle compte les échecs, et refuse au-delà
// de dix par fenêtre de dix minutes.
//
// Seuls les échecs comptent. Un professeur qui ajoute vingt élèves avec leurs
// vingt bons codes n'est jamais freiné.
// ---------------------------------------------------------------------------

/** Échecs permis par fenêtre. */
export const MAX_FAILURES = 10;

/** Durée d'une fenêtre. */
export const WINDOW_MS = 10 * 60 * 1000;

/** Vrai quand ce professeur a épuisé ses essais ratés de la fenêtre en cours. */
export async function isCodeThrottled(
  ctx: MutationCtx,
  profileId: Id<"profiles">,
  now: number,
): Promise<boolean> {
  const row = await ctx.db
    .query("codeAttempts")
    .withIndex("by_profile", (q) => q.eq("profileId", profileId))
    .first();
  if (!row || now - row.windowStart >= WINDOW_MS) return false;
  return row.failures >= MAX_FAILURES;
}

/** Compte un échec. Ouvre une nouvelle fenêtre quand l'ancienne est finie. */
export async function recordCodeFailure(
  ctx: MutationCtx,
  profileId: Id<"profiles">,
  now: number,
): Promise<void> {
  const row = await ctx.db
    .query("codeAttempts")
    .withIndex("by_profile", (q) => q.eq("profileId", profileId))
    .first();
  if (!row) {
    await ctx.db.insert("codeAttempts", { profileId, windowStart: now, failures: 1 });
    return;
  }
  if (now - row.windowStart >= WINDOW_MS) {
    await ctx.db.patch(row._id, { windowStart: now, failures: 1 });
    return;
  }
  await ctx.db.patch(row._id, { failures: row.failures + 1 });
}
