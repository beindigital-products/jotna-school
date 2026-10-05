/**
 * Règles de la liste d'attente — fonctions PURES.
 *
 * Jotna School n'ouvre à la vente qu'à la rentrée 2027-2028. D'ici là, le site
 * n'encaisse rien : la vitrine recueille les adresses des écoles, des parents
 * et des professeurs qui veulent être prévenus de l'ouverture.
 *
 * Aucune lecture de base ici : `waitlist.join` passe la saisie brute et écrit
 * ce que ces fonctions rendent. Même découpage que linkRules.ts (pur, testé) /
 * profiles.ts (I/O).
 */
import { v, type Infer } from "convex/values";

/**
 * Qui s'inscrit, fermé au schéma. L'école vient en premier : c'est elle qui
 * achète, et la relance de la rentrée 2027 ne s'écrira pas de la même façon
 * pour une direction que pour une famille.
 */
export const waitlistAudienceValidator = v.union(
  v.literal("ecole"),
  v.literal("parent"),
  v.literal("professeur"),
);

export type WaitlistAudience = Infer<typeof waitlistAudienceValidator>;

/** RFC 5321 : une adresse complète ne dépasse pas 254 caractères. */
export const MAX_EMAIL_LENGTH = 254;

/**
 * L'adresse telle qu'on la stocke, ou `null` si elle n'en a pas la forme.
 *
 * EN MINUSCULES, comme `auth.ts` et `parentLink.ts` : « Awa@Ecole.sn » et
 * « awa@ecole.sn » désignent la même boîte, et l'index qui écarte les doublons
 * compare des chaînes exactes.
 *
 * LA FORME SEULEMENT, et c'est voulu : une partie locale, une arobase, un
 * domaine qui contient un point, aucun espace. Seul un courriel reçu prouve
 * qu'une adresse existe ; une expression plus stricte refuserait des adresses
 * valides sans rien prouver de plus.
 */
export function normalizeWaitlistEmail(raw: string): string | null {
  const email = raw.trim().toLowerCase();
  if (email.length > MAX_EMAIL_LENGTH) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}
