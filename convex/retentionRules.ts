/**
 * Fidélisation — règles PURES, sans aucun import Convex.
 *
 * La console du super admin (`/admin/fidelisation`, `adminConsole.retention`)
 * veut savoir, pour chaque client qui a signé un jour un contrat (une école
 * aujourd'hui, une famille ou un professeur demain) : est-il encore abonné,
 * en passe de partir, ou parti ? Et, année scolaire après année scolaire,
 * combien de clients renouvellent.
 *
 * Ce fichier ne lit rien : `adminConsole.ts` regroupe les lignes
 * `subscriptions` par client et les passe ici.
 *
 * L'ANNÉE SCOLAIRE commence le 1er septembre (heure de Dakar, UTC) : un contrat
 * qui démarre en octobre 2026 appartient à « 2026-2027 », un contrat de
 * février 2027 aussi.
 */

export const DAY_MS = 24 * 60 * 60 * 1000;

/** Fin de contrat sans renouvellement à moins de 60 jours : à relancer. */
export const RENEWAL_WINDOW_MS = 60 * DAY_MS;

/** Mois (0 = janvier) où commence l'année scolaire. */
const SCHOOL_YEAR_START_MONTH = 8;

/** « 2026-2027 » pour une date. */
export function schoolYearOf(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getUTCFullYear();
  const start = date.getUTCMonth() >= SCHOOL_YEAR_START_MONTH ? year : year - 1;
  return `${start}-${start + 1}`;
}

/** L'année scolaire suivante : « 2026-2027 » donne « 2027-2028 ». */
export function nextSchoolYear(key: string): string {
  const start = Number(key.slice(0, 4)) + 1;
  return `${start}-${start + 1}`;
}

export type ContractStatus =
  | "draft"
  | "pending_payment"
  | "active"
  | "past_due"
  | "expired"
  | "cancelled";

export type Contract = {
  status: ContractStatus;
  startsAt: number;
  endsAt: number;
  seats: number;
  totalFcfa: number;
};

/**
 * Un contrat a-t-il été un VRAI abonnement ? Oui s'il a été actif à un
 * moment : `active` et `past_due` (le statut ne repasse pas à `expired` à la
 * fin, l'expiration se lit sur `endsAt`), et `expired` ou `cancelled` s'ils
 * sont un jour écrits. Un brouillon ou un contrat jamais payé ne fait pas
 * d'un prospect un client.
 */
export function wasSubscribed(contract: Contract): boolean {
  return (
    contract.status === "active" ||
    contract.status === "past_due" ||
    contract.status === "expired" ||
    contract.status === "cancelled"
  );
}

/**
 * - `active`   : un contrat court, payé ou dans sa grâce, et rien ne presse ;
 * - `at_risk`  : il court, mais en retard de paiement, ou il finit dans moins
 *                de 60 jours sans contrat suivant ;
 * - `churned`  : il a été abonné, son dernier contrat est fini, aucun autre
 *                ne court ni n'est prévu ;
 * - `pending`  : il n'a que des contrats signés et pas encore payés ;
 * - `prospect` : rien d'autre (brouillon seulement).
 */
export type RetentionStatus = "active" | "at_risk" | "churned" | "pending" | "prospect";

export type RiskReason = "past_due" | "ending_soon";

export type CustomerRetention = {
  status: RetentionStatus;
  riskReason: RiskReason | null;
  /** Un contrat qui commence plus tard est déjà signé (payé ou non). */
  renewed: boolean;
  /** Fin du dernier contrat d'abonnement, ou `null`. */
  lastEndsAt: number | null;
  /** Places du contrat le plus récent (en cours, sinon le dernier fini). */
  lastSeats: number;
  /** Années scolaires où le client a été abonné, de la plus ancienne. */
  schoolYears: string[];
  /** Montant total signé sur ses vrais abonnements. */
  lifetimeFcfa: number;
};

export function classifyCustomer(
  contracts: readonly Contract[],
  now: number,
): CustomerRetention {
  const subscribed = contracts.filter(wasSubscribed);
  const running = subscribed.filter((c) => c.startsAt <= now && now < c.endsAt);
  const future = contracts.filter(
    (c) => c.startsAt > now && c.status !== "draft" && c.status !== "cancelled",
  );
  const past = subscribed.filter((c) => c.endsAt <= now);

  const byStart = [...subscribed].sort((a, b) => b.startsAt - a.startsAt);
  const latest = running[0] ?? byStart.find((c) => c.endsAt <= now) ?? byStart[0];
  const base = {
    renewed: future.length > 0,
    lastEndsAt: byStart.length > 0 ? Math.max(...byStart.map((c) => c.endsAt)) : null,
    lastSeats: latest?.seats ?? 0,
    schoolYears: [...new Set(subscribed.map((c) => schoolYearOf(c.startsAt)))].sort(),
    lifetimeFcfa: subscribed.reduce((sum, c) => sum + c.totalFcfa, 0),
  };

  if (running.length > 0) {
    if (running.some((c) => c.status === "past_due")) {
      return { ...base, status: "at_risk", riskReason: "past_due" };
    }
    const endsAt = Math.max(...running.map((c) => c.endsAt));
    if (future.length === 0 && endsAt - now <= RENEWAL_WINDOW_MS) {
      return { ...base, status: "at_risk", riskReason: "ending_soon" };
    }
    return { ...base, status: "active", riskReason: null };
  }
  if (past.length > 0) {
    // Fini, mais un contrat suivant est déjà signé : un renouvellement.
    return future.length === 0
      ? { ...base, status: "churned", riskReason: null }
      : { ...base, status: "active", riskReason: null };
  }
  if (contracts.some((c) => c.status === "pending_payment")) {
    return { ...base, status: "pending", riskReason: null };
  }
  return { ...base, status: "prospect", riskReason: null };
}

export type CohortRow = {
  schoolYear: string;
  /** Clients abonnés cette année-là. */
  customers: number;
  /** Parmi eux, ceux qui sont abonnés l'année suivante. */
  renewed: number;
  /** `renewed / customers` en %, ou `null` tant que l'année n'est pas finie. */
  renewalRate: number | null;
};

/**
 * Taux de renouvellement par année scolaire. L'année en cours n'a pas encore
 * de taux : on ne sait pas qui renouvellera.
 */
export function renewalCohorts(
  customers: readonly { schoolYears: readonly string[] }[],
  now: number,
): CohortRow[] {
  const current = schoolYearOf(now);
  const years = new Set<string>();
  for (const customer of customers) for (const y of customer.schoolYears) years.add(y);
  return [...years].sort().map((schoolYear) => {
    const cohort = customers.filter((c) => c.schoolYears.includes(schoolYear));
    const next = nextSchoolYear(schoolYear);
    const renewed = cohort.filter((c) => c.schoolYears.includes(next)).length;
    return {
      schoolYear,
      customers: cohort.length,
      renewed,
      renewalRate:
        schoolYear < current && cohort.length > 0
          ? Math.round((renewed / cohort.length) * 100)
          : null,
    };
  });
}
