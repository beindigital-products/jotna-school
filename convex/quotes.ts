/**
 * La demande de devis d'une école : la vitrine l'envoie, l'équipe la reçoit par
 * courriel.
 *
 * Les règles (champs obligatoires, forme de l'adresse et du numéro, bornes)
 * vivent dans `quoteRules.ts`, pur et testé. L'envoi du courriel est dans
 * `quotesEmail.ts` (action Node, Resend).
 */
import { ConvexError, v } from "convex/values";

import { internal } from "./_generated/api";
import { internalMutation, internalQuery, mutation } from "./_generated/server";
import {
  cleanQuoteRequest,
  QUOTE_MAX_PER_EMAIL_PER_DAY,
  QUOTE_MAX_PER_HOUR,
  quoteRequestFields,
} from "./quoteRules";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/**
 * Enregistre une demande et planifie son courriel — APPELÉE SANS CONNEXION, par
 * un visiteur de la vitrine.
 *
 * LA DEMANDE EST ÉCRITE AVANT D'ÊTRE ENVOYÉE. Si Resend refuse le courriel, la
 * ligne reste dans `quoteRequests`, sans `emailedAt` : rien n'est perdu.
 *
 * DEUX FREINS, parce que n'importe qui peut appeler cette mutation et que
 * chaque appel envoie un courriel : trois demandes par adresse et par jour,
 * trente par heure en tout. Les deux lectures sont bornées par `take`.
 */
export const request = mutation({
  args: quoteRequestFields,
  handler: async (ctx, args) => {
    const checked = cleanQuoteRequest(args);
    if (!checked.ok) {
      throw new ConvexError({ field: checked.field, message: checked.message });
    }
    const value = checked.value;
    const now = Date.now();

    const sameEmail = await ctx.db
      .query("quoteRequests")
      .withIndex("by_email_and_createdAt", (q) =>
        q.eq("email", value.email).gt("createdAt", now - DAY),
      )
      .take(QUOTE_MAX_PER_EMAIL_PER_DAY);
    if (sameEmail.length >= QUOTE_MAX_PER_EMAIL_PER_DAY) {
      throw new ConvexError({
        field: "email",
        message: "Nous avons déjà reçu vos demandes. Nous vous répondons très vite.",
      });
    }

    const lastHour = await ctx.db
      .query("quoteRequests")
      .withIndex("by_createdAt", (q) => q.gt("createdAt", now - HOUR))
      .take(QUOTE_MAX_PER_HOUR);
    if (lastHour.length >= QUOTE_MAX_PER_HOUR) {
      throw new ConvexError({
        field: "message",
        message: "Trop de demandes en ce moment. Réessayez dans une heure.",
      });
    }

    const requestId = await ctx.db.insert("quoteRequests", { ...value, createdAt: now });
    await ctx.scheduler.runAfter(0, internal.quotesEmail.send, { requestId });
    return null;
  },
});

/** La demande, pour l'action qui l'envoie. */
export const getForEmail = internalQuery({
  args: { requestId: v.id("quoteRequests") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.requestId);
  },
});

/** Note que le courriel est parti. */
export const markEmailed = internalMutation({
  args: { requestId: v.id("quoteRequests") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.requestId, { emailedAt: Date.now() });
    return null;
  },
});
