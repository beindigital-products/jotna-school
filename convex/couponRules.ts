/**
 * Coupons — règles PURES, sans aucun import Convex.
 *
 * Un coupon est un code que l'équipe émet depuis la console (`/admin/coupons`)
 * pour un public : les parents, les professeurs, les écoles, ou tout le monde.
 * La personne le saisit dans ses paramètres (`coupons.redeem`), et le coupon
 * lui donne un AVANTAGE :
 *
 * - `free_access` : un accès gratuit pendant un nombre de jours ;
 * - `percent`     : une remise en pourcentage sur un paiement ;
 * - `amount`      : une remise en francs CFA sur un paiement.
 *
 * CE QUE LE COUPON FAIT AUJOURD'HUI. Tant que l'accès libre est allumé
 * (`accessRules.FREE_ACCESS`), tout est déjà gratuit et aucun paiement famille
 * ou professeur n'existe : l'utilisation est ENREGISTRÉE (qui, quand, quel
 * avantage, jusqu'à quand), et c'est ce registre que les futurs paiements
 * liront pour appliquer la remise ou ouvrir l'accès. Rien ici ne touche à
 * `accessRules.decideAccess`.
 *
 * Même découpage que `invitationRules`, `openAccessRules` et `waitlistRules` :
 * ce qui décide vit ici, testé, et `coupons.ts` lit et écrit.
 *
 * CE N'EST PAS UN CODE D'INVITATION. Un code d'invitation (`JOTNA-…`) ouvre une
 * INSCRIPTION avant le lancement ; un coupon (`PROMO-…`, ou un mot choisi par
 * l'équipe comme `RENTREE2027`) se saisit par un compte qui existe déjà.
 */

type RandomInt = (minInclusive: number, maxInclusive: number) => number;

// ── Public et avantage ──────────────────────────────────────────────────────

/** Qui peut utiliser le coupon. `directeur` est le compte d'une école. */
export const COUPON_AUDIENCES = ["all", "parent", "professeur", "directeur"] as const;
export type CouponAudience = (typeof COUPON_AUDIENCES)[number];

export const COUPON_AUDIENCE_LABELS: Record<CouponAudience, string> = {
  all: "Tout le monde",
  parent: "Parents",
  professeur: "Professeurs",
  directeur: "Écoles",
};

/** Les rôles qui peuvent saisir un coupon. Jamais un élève, jamais un admin. */
export const COUPON_ROLES = ["parent", "professeur", "directeur"] as const;
export type CouponRole = (typeof COUPON_ROLES)[number];

export type CouponBenefit =
  | { kind: "free_access"; days: number }
  | { kind: "percent"; percent: number }
  | { kind: "amount"; amountFcfa: number };

export type CouponBenefitKind = CouponBenefit["kind"];

export const COUPON_BENEFIT_KIND_LABELS: Record<CouponBenefitKind, string> = {
  free_access: "Accès gratuit",
  percent: "Remise en %",
  amount: "Remise en FCFA",
};

/** Bornes des saisies de la console. */
export const COUPON_LIMITS = {
  /** Un an et demi d'accès gratuit au plus : au-delà, c'est un compte offert. */
  maxDays: 548,
  maxPercent: 100,
  minAmountFcfa: 100,
  /** Un abonnement d'école dépasse rarement ce montant. */
  maxAmountFcfa: 10_000_000,
  maxUses: 10_000,
  labelMax: 80,
  customCodeMin: 4,
  customCodeMax: 24,
} as const;

/** « 1 000 », avec l'espace des milliers. */
export function formatFcfa(value: number): string {
  return `${new Intl.NumberFormat("fr-FR").format(value)} FCFA`;
}

/** L'avantage en mots : « Accès gratuit 30 jours », « Remise de 20 % ». */
export function describeCouponBenefit(benefit: CouponBenefit): string {
  switch (benefit.kind) {
    case "free_access":
      return `Accès gratuit ${benefit.days} jour${benefit.days > 1 ? "s" : ""}`;
    case "percent":
      return benefit.percent === 100
        ? "Gratuit (remise de 100 %)"
        : `Remise de ${benefit.percent} %`;
    case "amount":
      return `Remise de ${formatFcfa(benefit.amountFcfa)}`;
  }
}

// ── Le code ─────────────────────────────────────────────────────────────────

const PREFIX = "PROMO";
/** Le même alphabet que les autres codes du dépôt, sans les paires confondues. */
const ALPHABET = "34679ABCDEFGHJKMNPQRTUVWXY";
const BODY_LENGTH = 8;

/**
 * Un code tiré au sort, forme imprimable `PROMO-7C4K-2MQX`. Huit symboles,
 * comme les codes d'invitation : `coupons.redeem` exige une session, mais un
 * code court se devinerait quand même à force d'essais.
 */
export function buildCouponCode(randomInt: RandomInt): string {
  let body = "";
  for (let i = 0; i < BODY_LENGTH; i++) {
    body += ALPHABET[randomInt(0, ALPHABET.length - 1)];
  }
  return `${PREFIX}-${body.slice(0, 4)}-${body.slice(4)}`;
}

const RAW_CODE_MAX = 64;

/**
 * La forme qui se compare et se stocke : lettres et chiffres, en minuscules,
 * sans accents. Tirets, espaces et ponctuation d'un code recopié depuis un
 * message ne comptent pas. Rend `""` pour une saisie vide ou démesurée.
 */
export function normalizeCouponCode(raw: unknown): string {
  if (typeof raw !== "string" || raw.length > RAW_CODE_MAX) return "";
  return raw
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/** La forme affichée : `PROMO-7C4K-2MQX` pour un code tiré, majuscules sinon. */
export function printableCouponCode(normalized: string): string {
  const upper = normalized.toUpperCase();
  if (upper.startsWith(PREFIX) && upper.length === PREFIX.length + BODY_LENGTH) {
    const body = upper.slice(PREFIX.length);
    return `${PREFIX}-${body.slice(0, 4)}-${body.slice(4)}`;
  }
  return upper;
}

// ── La saisie de la console ─────────────────────────────────────────────────

export type CouponDraftInput = {
  label: string;
  audience: string;
  benefitKind: string;
  /** Jours, pourcentage ou montant, selon `benefitKind`. */
  benefitValue: number;
  maxUses: number;
  /** Code choisi par l'équipe ; vide pour un code tiré au sort. */
  customCode?: string;
  startsAt?: number;
  expiresAt?: number;
};

export type CouponDraft = {
  label: string;
  audience: CouponAudience;
  benefit: CouponBenefit;
  maxUses: number;
  /** Forme normalisée, ou `null` pour un tirage. */
  customCode: string | null;
  startsAt?: number;
  expiresAt?: number;
};

function isWholeInRange(value: number, min: number, max: number): boolean {
  return Number.isInteger(value) && value >= min && value <= max;
}

/**
 * Vérifie la saisie de la console. Rend le coupon prêt à écrire, ou la phrase
 * à afficher. `now` sert seulement à refuser une fin déjà passée.
 */
export function cleanCouponDraft(
  input: CouponDraftInput,
  now: number,
): { ok: true; draft: CouponDraft } | { ok: false; message: string } {
  const label = input.label.replace(/\s+/g, " ").trim();
  if (label.length === 0 || label.length > COUPON_LIMITS.labelMax) {
    return {
      ok: false,
      message: `Donnez un nom au coupon (${COUPON_LIMITS.labelMax} caractères au plus).`,
    };
  }

  if (!(COUPON_AUDIENCES as readonly string[]).includes(input.audience)) {
    return { ok: false, message: "Choisissez à qui s'adresse le coupon." };
  }
  const audience = input.audience as CouponAudience;

  let benefit: CouponBenefit;
  const value = input.benefitValue;
  switch (input.benefitKind) {
    case "free_access":
      if (!isWholeInRange(value, 1, COUPON_LIMITS.maxDays)) {
        return {
          ok: false,
          message: `L'accès gratuit dure de 1 à ${COUPON_LIMITS.maxDays} jours.`,
        };
      }
      benefit = { kind: "free_access", days: value };
      break;
    case "percent":
      if (!isWholeInRange(value, 1, COUPON_LIMITS.maxPercent)) {
        return { ok: false, message: "La remise va de 1 à 100 %." };
      }
      benefit = { kind: "percent", percent: value };
      break;
    case "amount":
      if (
        !isWholeInRange(value, COUPON_LIMITS.minAmountFcfa, COUPON_LIMITS.maxAmountFcfa)
      ) {
        return {
          ok: false,
          message: `La remise va de ${formatFcfa(COUPON_LIMITS.minAmountFcfa)} à ${formatFcfa(COUPON_LIMITS.maxAmountFcfa)}.`,
        };
      }
      benefit = { kind: "amount", amountFcfa: value };
      break;
    default:
      return { ok: false, message: "Choisissez ce que donne le coupon." };
  }

  if (!isWholeInRange(input.maxUses, 1, COUPON_LIMITS.maxUses)) {
    return {
      ok: false,
      message: `Un coupon sert de 1 à ${new Intl.NumberFormat("fr-FR").format(COUPON_LIMITS.maxUses)} fois.`,
    };
  }

  let customCode: string | null = null;
  const rawCustom = (input.customCode ?? "").trim();
  if (rawCustom !== "") {
    const normalized = normalizeCouponCode(rawCustom);
    if (
      normalized.length < COUPON_LIMITS.customCodeMin ||
      normalized.length > COUPON_LIMITS.customCodeMax
    ) {
      return {
        ok: false,
        message: `Un code choisi a de ${COUPON_LIMITS.customCodeMin} à ${COUPON_LIMITS.customCodeMax} lettres ou chiffres.`,
      };
    }
    customCode = normalized;
  }

  if (input.expiresAt !== undefined) {
    if (input.expiresAt <= now) {
      return { ok: false, message: "La date de fin est déjà passée." };
    }
    if (input.startsAt !== undefined && input.expiresAt <= input.startsAt) {
      return { ok: false, message: "La fin doit venir après le début." };
    }
  }

  return {
    ok: true,
    draft: {
      label,
      audience,
      benefit,
      maxUses: input.maxUses,
      customCode,
      startsAt: input.startsAt,
      expiresAt: input.expiresAt,
    },
  };
}

// ── L'état d'un coupon et son utilisation ───────────────────────────────────

export type CouponState = {
  audience: CouponAudience;
  maxUses: number;
  useCount: number;
  revokedAt?: number;
  startsAt?: number;
  expiresAt?: number;
};

export type CouponStatus =
  | "active"
  | "scheduled"
  | "expired"
  | "exhausted"
  | "revoked";

export const COUPON_STATUS_LABELS: Record<CouponStatus, string> = {
  active: "Actif",
  scheduled: "Programmé",
  expired: "Expiré",
  exhausted: "Épuisé",
  revoked: "Désactivé",
};

/** L'état d'un coupon pour la console. La désactivation prime sur tout. */
export function couponStatus(coupon: CouponState, now: number): CouponStatus {
  if (coupon.revokedAt !== undefined) return "revoked";
  if (coupon.expiresAt !== undefined && now >= coupon.expiresAt) return "expired";
  if (coupon.useCount >= coupon.maxUses) return "exhausted";
  if (coupon.startsAt !== undefined && now < coupon.startsAt) return "scheduled";
  return "active";
}

export type CouponRefusal =
  | "missing"
  | "unknown"
  | "not_eligible"
  | "wrong_audience"
  | "already_used"
  | "scheduled"
  | "expired"
  | "exhausted"
  | "revoked";

export const COUPON_REFUSALS: Record<CouponRefusal, string> = {
  missing: "Saisissez un code.",
  unknown: "Ce code n'existe pas. Vérifiez qu'il est bien recopié.",
  not_eligible: "Ce type de compte ne peut pas utiliser de coupon.",
  wrong_audience: "Ce code n'est pas prévu pour ce type de compte.",
  already_used: "Vous avez déjà utilisé ce code.",
  scheduled: "Ce code n'est pas encore valable.",
  expired: "Ce code a expiré.",
  exhausted: "Ce code a déjà été utilisé autant de fois que prévu.",
  revoked: "Ce code n'est plus valable.",
};

/**
 * Ce compte peut-il utiliser ce coupon maintenant ?
 *
 * L'ordre des refus suit ce qui aide la personne : un code inconnu d'abord,
 * puis ce qui tient à son compte, puis ce qui tient au coupon.
 */
export function decideCouponRedemption(input: {
  coupon: CouponState | null;
  role: string | null;
  alreadyRedeemed: boolean;
  now: number;
}): { ok: true } | { ok: false; reason: CouponRefusal } {
  const { coupon, role } = input;
  if (coupon === null) return { ok: false, reason: "unknown" };
  if (role === null || !(COUPON_ROLES as readonly string[]).includes(role)) {
    return { ok: false, reason: "not_eligible" };
  }
  if (coupon.audience !== "all" && coupon.audience !== role) {
    return { ok: false, reason: "wrong_audience" };
  }
  if (input.alreadyRedeemed) return { ok: false, reason: "already_used" };

  const status = couponStatus(coupon, input.now);
  if (status !== "active") return { ok: false, reason: status };
  return { ok: true };
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Jusqu'à quand court un accès gratuit pris maintenant, ou `undefined` pour
 * une remise (elle attend un paiement, elle n'a pas de durée).
 */
export function freeAccessUntil(
  benefit: CouponBenefit,
  now: number,
): number | undefined {
  return benefit.kind === "free_access" ? now + benefit.days * DAY_MS : undefined;
}

/** Ce qu'il reste d'une utilisation, côté compte. */
export type RedemptionState =
  | "access_running"
  | "access_ended"
  | "discount_waiting"
  | "discount_applied";

export const REDEMPTION_STATE_LABELS: Record<RedemptionState, string> = {
  access_running: "En cours",
  access_ended: "Terminé",
  discount_waiting: "À appliquer au prochain paiement",
  discount_applied: "Appliquée",
};

export function redemptionState(
  redemption: { benefit: CouponBenefit; accessUntil?: number; appliedAt?: number },
  now: number,
): RedemptionState {
  if (redemption.benefit.kind === "free_access") {
    return redemption.accessUntil !== undefined && now < redemption.accessUntil
      ? "access_running"
      : "access_ended";
  }
  return redemption.appliedAt !== undefined ? "discount_applied" : "discount_waiting";
}
