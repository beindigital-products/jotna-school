/**
 * Codes d'invitation — règles PURES, sans aucun import Convex.
 *
 * AVANT LE LANCEMENT, PERSONNE NE CRÉE DE COMPTE SANS CODE (demande du
 * propriétaire, 12 novembre 2026). Le site annonce « Lancement
 * prochainement » ; seules les personnes à qui l'équipe a remis un code
 * d'invitation passent le formulaire d'inscription.
 *
 * Même découpage que `openAccessRules`, `roleRules` et `waitlistRules` : ce
 * dépôt n'utilise pas `convex-test` et vitest tourne en `jsdom`, donc ce qui
 * décide vit ici, testé, et les enveloppes Convex (`invitations.ts`,
 * `auth.ts`) lisent et écrivent.
 *
 * CE QUE CE CODE N'EST PAS. Trois autres familles de codes circulent déjà, et
 * aucune n'ouvre une inscription : le code de connexion d'un élève
 * (`AWA-4821`), le code élève (`ELV-…`) et le code école (`ECO-…`). Le billet
 * parent d'une école (`PIO-…`) crée bien un compte, mais par son propre
 * chemin (`parentLink.signUpWithCode`) et pour un enfant nommé.
 */

type RandomInt = (minInclusive: number, maxInclusive: number) => number;

/** Ce qui précède le tirage : dit d'où vient le code à qui le reçoit. */
const PREFIX = "JOTNA";

/**
 * Le même alphabet que les codes parent et les codes partagés
 * (`importCodes.buildParentCode`, `openAccessRules`) : sans `0 O 1 I L 5 S 2
 * Z 8`, les paires qu'un message recopié à la main confond.
 */
const ALPHABET = "34679ABCDEFGHJKMNPQRTUVWXY";

/** Symboles tirés, affichés en deux groupes de quatre. */
const BODY_LENGTH = 8;

/**
 * Un code d'invitation neuf, sous sa forme imprimable — `JOTNA-7C4K-2MQX`.
 *
 * HUIT SYMBOLES, ET PAS SIX COMME LES AUTRES CODES. `invitations.check` répond
 * à n'importe qui, sans session et sans limite de débit : c'est ce qui permet
 * à la pop-up de dire tout de suite si un code est bon. Avec six symboles
 * (309 millions de valeurs) et une centaine de codes en circulation, un
 * balayage à deux cents essais par seconde en trouverait plusieurs par jour.
 * Huit symboles font 209 milliards de valeurs : le même balayage en trouve un
 * tous les quatre mois, pour un compte gratuit que rien ne distingue d'un
 * autre.
 *
 * `randomInt` est injecté, comme partout dans ce dépôt : une fonction pure ne
 * tire pas au sort toute seule, et l'appelant branche `secureRandomInt`.
 */
export function buildInvitationCode(randomInt: RandomInt): string {
  let body = "";
  for (let i = 0; i < BODY_LENGTH; i++) {
    body += ALPHABET[randomInt(0, ALPHABET.length - 1)];
  }
  return `${PREFIX}-${body.slice(0, 4)}-${body.slice(4)}`;
}

/** Au-delà, ce n'est pas un code : on ne l'envoie pas chercher dans l'index. */
const RAW_CODE_MAX = 64;

/**
 * La forme sous laquelle un code SE COMPARE et SE STOCKE : lettres et chiffres
 * seulement, en minuscules — `jotna7c4k2mqx`.
 *
 * LES TIRETS NE COMPTENT PAS, ni rien de ce qui entoure un code collé depuis
 * une messagerie : espaces, guillemets, point final, astérisques du gras. La
 * personne a reçu son code dans un message et le recopie comme elle le voit ;
 * refuser « JOTNA 7C4K 2MQX » pour un tiret manquant la renverrait demander un
 * code qu'elle a déjà.
 *
 * Rend `""` pour une saisie vide ou démesurée : l'appelant y lit « pas de
 * code », jamais « code inconnu ».
 */
export function normalizeInvitationCode(raw: unknown): string {
  if (typeof raw !== "string" || raw.length > RAW_CODE_MAX) return "";
  return raw.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * La forme qu'on AFFICHE et qu'on recopie, à partir de la forme stockée —
 * `JOTNA-7C4K-2MQX`. Une valeur qui n'a pas la forme d'un code émis ici
 * ressort simplement en majuscules.
 */
export function printableInvitationCode(normalized: string): string {
  const upper = normalized.toUpperCase();
  if (
    !upper.startsWith(PREFIX) ||
    upper.length !== PREFIX.length + BODY_LENGTH
  ) {
    return upper;
  }
  const body = upper.slice(PREFIX.length);
  return `${PREFIX}-${body.slice(0, 4)}-${body.slice(4)}`;
}

/** Ce qu'il faut lire d'un code pour décider s'il ouvre encore une inscription. */
export type InvitationState = {
  maxUses: number;
  useCount: number;
  revokedAt?: number;
};

/**
 * Pourquoi une inscription est refusée.
 *
 * - `missing`   : aucun code — le visiteur ordinaire, avant le lancement ;
 * - `unknown`   : un code qui n'a jamais été émis (ou une faute de frappe) ;
 * - `revoked`   : l'équipe l'a désactivé ;
 * - `exhausted` : il a déjà servi autant de fois qu'il le pouvait.
 */
export type InvitationRefusal = "missing" | "unknown" | "revoked" | "exhausted";

export type InvitationDecision =
  | { ok: true }
  | { ok: false; reason: InvitationRefusal };

/**
 * Ce code ouvre-t-il encore une inscription ?
 *
 * `null` est un code que l'index ne connaît pas. LA DÉSACTIVATION PASSE AVANT
 * LE COMPTE : un code désactivé puis épuisé se lit « désactivé », qui est la
 * décision de l'équipe et pas un accident d'usage.
 */
export function decideInvitation(
  invitation: InvitationState | null,
): InvitationDecision {
  if (invitation === null) return { ok: false, reason: "unknown" };
  if (invitation.revokedAt !== undefined) {
    return { ok: false, reason: "revoked" };
  }
  if (invitation.useCount >= invitation.maxUses) {
    return { ok: false, reason: "exhausted" };
  }
  return { ok: true };
}

/**
 * La phrase que lit la personne, pour chaque motif de refus.
 *
 * LES REFUS SE DISTINGUENT, comme ceux du billet parent
 * (`parentLink.CLAIM_REFUSALS`) : retaper, ou redemander un code, ne sont pas
 * le même geste. Rien n'est divulgué pour autant — ces réponses ne valent que
 * pour qui tient déjà un code.
 */
export const INVITATION_REFUSALS: Record<InvitationRefusal, string> = {
  missing:
    "Jotna School n'est pas encore en ligne : le lancement est en cours. " +
    "Pour créer un compte dès maintenant, il faut un code d'invitation.",
  unknown:
    "Ce code d'invitation n'existe pas. Vérifiez qu'il est saisi en " +
    "entier, tel que vous l'avez reçu.",
  revoked:
    "Ce code d'invitation n'est plus actif. Demandez-en un nouveau à la " +
    "personne qui vous l'a remis.",
  exhausted:
    "Ce code d'invitation a déjà été utilisé. Demandez-en un nouveau à la " +
    "personne qui vous l'a remis.",
};

/**
 * Le champ que `Password.profile()` joint au profil d'une INSCRIPTION
 * PUBLIQUE, et que `createOrUpdateUser` relit (`convex/auth.ts`).
 *
 * SA PRÉSENCE EST LA MARQUE, SA VALEUR EST LE CODE. Un compte provisionné
 * côté serveur (`createAccount` : import d'école, élève créé par un adulte,
 * personnel créé par un admin, billet parent) construit son profil lui-même
 * et ne porte jamais ce champ ; un formulaire public passe toujours par
 * `profile()`, qui le pose toujours, même vide.
 */
export const SELF_SIGNUP_INVITATION_FIELD = "selfSignupInvitation";

/**
 * Le code d'invitation (normalisé) d'une inscription publique, ou `null`
 * quand le compte vient d'un provisionnement — qui n'en demande pas.
 *
 * Une marque d'un autre type qu'une chaîne compte comme un code VIDE, pas
 * comme une absence : dans le doute, c'est une inscription publique, et elle
 * sera refusée faute de code.
 */
export function selfSignupInvitation(
  profile: Record<string, unknown>,
): string | null {
  if (!(SELF_SIGNUP_INVITATION_FIELD in profile)) return null;
  return normalizeInvitationCode(profile[SELF_SIGNUP_INVITATION_FIELD]);
}

/** Au-delà, ce n'est plus une invitation : c'est une inscription ouverte. */
export const INVITATION_MAX_USES = 500;

/**
 * Le nombre de personnes qu'un code laisse entrer, ou `null` s'il est hors
 * bornes : un entier, de 1 à `INVITATION_MAX_USES`.
 */
export function cleanInvitationMaxUses(raw: number): number | null {
  if (!Number.isInteger(raw)) return null;
  if (raw < 1 || raw > INVITATION_MAX_USES) return null;
  return raw;
}
