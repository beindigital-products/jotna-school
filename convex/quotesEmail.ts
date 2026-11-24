"use node";

import { v } from "convex/values";
import { Resend } from "resend";

import { EMAIL_FROM } from "../lib/email-brand";
import { generateQuoteRequestEmailHtml } from "../lib/quote-request-email-template";
import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import { internalAction } from "./_generated/server";

/**
 * OÙ ARRIVENT LES DEMANDES DE DEVIS.
 *
 * `QUOTE_REQUEST_TO`, posée sur le déploiement (`npx convex env set`), décide.
 * Sans elle, la demande part à l'adresse de contact du pied de page, sur le
 * domaine que nous possédons (`lib/email-brand.ts`). Une demande contient le
 * nom, l'adresse et le numéro d'une personne : elle ne doit jamais partir vers
 * un domaine qui n'est pas le nôtre.
 */
const DEFAULT_QUOTE_REQUEST_TO = "contact@jotnaschool.com";

/**
 * Envoie à l'équipe le courriel d'une demande de devis.
 *
 * `replyTo` porte l'adresse de l'école : « Répondre » écrit à la bonne
 * personne. Un envoi refusé laisse la demande en base, sans `emailedAt`.
 */
export const send = internalAction({
  args: { requestId: v.id("quoteRequests") },
  handler: async (ctx, args) => {
    const request: Doc<"quoteRequests"> | null = await ctx.runQuery(
      internal.quotes.getForEmail,
      { requestId: args.requestId },
    );
    if (request === null) return { sent: false, reason: "not_found" };

    if (!process.env.RESEND_API_KEY) {
      console.warn("RESEND_API_KEY not set, quote request stored but not emailed");
      return { sent: false, reason: "no_api_key" };
    }

    const to = process.env.QUOTE_REQUEST_TO?.trim() || DEFAULT_QUOTE_REQUEST_TO;
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      replyTo: request.email,
      subject: `[Jotna School] Demande de devis : ${request.schoolName} (${request.city})`,
      html: generateQuoteRequestEmailHtml({ logoUrl: process.env.EMAIL_LOGO_URL, request }),
    });
    if (error) {
      console.error("Quote request email refused:", error.message);
      return { sent: false, reason: "refused" };
    }

    await ctx.runMutation(internal.quotes.markEmailed, { requestId: args.requestId });
    return { sent: true };
  },
});
