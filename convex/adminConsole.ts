/**
 * La console du super admin : les chiffres de toute la plateforme.
 *
 * QUI APPELLE QUOI :
 *
 * - `overview`          — `/admin/dashboard` : comptes, écoles, revenus,
 *                         activité, croissance, IA ;
 * - `listAccounts`      — `/admin/comptes` : les comptes d'un rôle ;
 * - `revenue`           — `/admin/revenus` : contrats, échéances, versements ;
 * - `retention`         — `/admin/fidelisation` : abonnés, à risque, partis ;
 * - `listQuoteRequests` — `/admin/devis` : les demandes de devis des écoles.
 *
 * TOUTES SONT RÉSERVÉES À `admin` et rendent `null` (ou une liste vide) pour
 * tout autre appelant : une requête ne lève jamais (convention du dépôt).
 *
 * COMPTAGES BORNÉS. Convex n'a pas d'opérateur de comptage : la console lit
 * chaque table par un paquet borné et dit quand la borne est atteinte
 * (`BoundedCount.capped`, affiché « 1 000+ »). C'est juste avant le lancement,
 * où les tables sont petites. Quand une borne sera atteinte pour de bon, le
 * remède est un compteur dénormalisé tenu par les mutations, pas une borne
 * plus haute : une requête lit au plus 32 000 documents.
 *
 * Calculs purs (séries, sommes) dans `adminConsoleRules.ts`. Vue d'ensemble
 * de la console : `docs/console-admin.md`.
 */
import { ConvexError, v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query, type QueryCtx } from "./_generated/server";
import { callerIsAdmin } from "./access";
import {
  boundedCount,
  bucketSeries,
  countSince,
  DAY_MS,
  dayKeyOf,
  lastDayKeys,
  lastMonthKeys,
  monthKeyOf,
  startOfMonth,
  sumOf,
  type BoundedCount,
  type SeriesPoint,
} from "./adminConsoleRules";
import { couponStatus } from "./couponRules";
import {
  classifyCustomer,
  renewalCohorts,
  schoolYearOf,
  type CohortRow,
  type RetentionStatus,
  type RiskReason,
} from "./retentionRules";
import { decideInvitation } from "./invitationRules";
import { SPEND_SHARD_COUNT } from "./aiGateway/spendShards";

/** Les bornes de lecture, table par table. */
const CAP = {
  profilesPerRole: 1000,
  attempts: 2000,
  payments: 1000,
  installmentsPerStatus: 1000,
  subscriptionsPerStatus: 500,
  schools: 1000,
  classes: 1000,
  waitlist: 1000,
  quotes: 1000,
  invitations: 500,
  coupons: 500,
  wallets: 1000,
} as const;

const ROLES = ["student", "parent", "professeur", "directeur", "admin"] as const;
type Role = (typeof ROLES)[number];

type RoleStats = { total: BoundedCount; new7d: number; new30d: number };

/** Les profils d'un rôle, du plus récent au plus ancien, bornés. */
async function profilesOfRole(
  ctx: QueryCtx,
  role: Role,
  cap: number,
): Promise<Doc<"profiles">[]> {
  return await ctx.db
    .query("profiles")
    .withIndex("by_role", (q) => q.eq("role", role))
    .order("desc")
    .take(cap + 1);
}

/** Une école réelle, pas l'espace personnel d'un professeur sans école. */
function isRealSchool(school: Doc<"schools">): boolean {
  return school.kind !== "personal";
}

/** Le nom de l'école d'un contrat (`ownerType: "school"`), ou `null`. */
async function subscriptionSchool(
  ctx: QueryCtx,
  subscription: Doc<"subscriptions">,
): Promise<Doc<"schools"> | null> {
  if (subscription.ownerType !== "school") return null;
  const schoolId = ctx.db.normalizeId("schools", subscription.ownerId);
  return schoolId ? await ctx.db.get("schools", schoolId) : null;
}

// ── Vue d'ensemble ──────────────────────────────────────────────────────────

export type AdminOverview = {
  generatedAt: number;
  accounts: Record<Role, RoleStats>;
  signupsByDay: SeriesPoint[];
  schools: {
    total: number;
    active: number;
    prospect: number;
    suspended: number;
    personalSpaces: number;
    capped: boolean;
  };
  classes: BoundedCount;
  revenue: {
    collectedTotal: number;
    collectedThisMonth: number;
    collectedLastMonth: number;
    byMonth: SeriesPoint[];
    pendingFcfa: number;
    overdueFcfa: number;
    overdueCount: number;
    capped: boolean;
  };
  subscriptions: {
    active: number;
    pastDue: number;
    pendingPayment: number;
    seatsCovered: number;
  };
  activity: {
    answersByDay: SeriesPoint[];
    answers7d: number;
    activeStudents7d: number;
    capped: boolean;
  };
  growth: {
    waitlist: BoundedCount;
    quoteRequests30d: number;
    quoteRequests: BoundedCount;
    invitationsActive: number;
    couponsActive: number;
    couponUses: number;
  };
  ai: { month: string; costUsd: number; calls: number; budgetUsd: number | null };
  economy: { caurisInCirculation: number; wallets: BoundedCount };
};

export const overview = query({
  args: {},
  handler: async (ctx): Promise<AdminOverview | null> => {
    if (!(await callerIsAdmin(ctx))) return null;
    const now = Date.now();
    const since7 = now - 7 * DAY_MS;
    const since30 = now - 30 * DAY_MS;

    // Comptes, par rôle.
    const accounts = {} as Record<Role, RoleStats>;
    const signupTimes: number[] = [];
    for (const role of ROLES) {
      const rows = await profilesOfRole(ctx, role, CAP.profilesPerRole);
      const times = rows.slice(0, CAP.profilesPerRole).map((p) => p._creationTime);
      accounts[role] = {
        total: boundedCount(rows.length, CAP.profilesPerRole),
        new7d: countSince(times, since7),
        new30d: countSince(times, since30),
      };
      // L'équipe ne compte pas dans les inscriptions.
      if (role !== "admin") signupTimes.push(...times);
    }
    const signupsByDay = bucketSeries(
      lastDayKeys(now, 30),
      signupTimes.map((at) => ({ at, value: 1 })),
      dayKeyOf,
    );

    // Écoles et classes.
    const schoolRows = await ctx.db.query("schools").take(CAP.schools + 1);
    const schoolsRead = schoolRows.slice(0, CAP.schools);
    const realSchools = schoolsRead.filter(isRealSchool);
    const classRows = await ctx.db.query("schoolClasses").take(CAP.classes + 1);

    // Revenus : versements encaissés, échéances à venir et en retard.
    const paymentRows = await ctx.db
      .query("payments")
      .order("desc")
      .take(CAP.payments + 1);
    const completed = paymentRows
      .slice(0, CAP.payments)
      .filter((p) => p.status === "completed")
      .map((p) => ({ at: p.completedAt ?? p.createdAt, value: p.amountFcfa }));
    const monthStart = startOfMonth(now);
    const lastMonthStart = startOfMonth(monthStart - 1);
    const pending = await ctx.db
      .query("installments")
      .withIndex("by_status_dueAt", (q) => q.eq("status", "pending"))
      .take(CAP.installmentsPerStatus);
    const overdue = await ctx.db
      .query("installments")
      .withIndex("by_status_dueAt", (q) => q.eq("status", "overdue"))
      .take(CAP.installmentsPerStatus);

    // Contrats.
    const subsOf = (status: "active" | "past_due" | "pending_payment") =>
      ctx.db
        .query("subscriptions")
        .withIndex("by_status", (q) => q.eq("status", status))
        .take(CAP.subscriptionsPerStatus);
    const activeSubs = await subsOf("active");
    const pastDueSubs = await subsOf("past_due");
    const pendingSubs = await subsOf("pending_payment");
    const runningSubs = [...activeSubs, ...pastDueSubs].filter(
      (s) => s.startsAt <= now && now < s.endsAt,
    );

    // Activité : réponses d'élèves des 14 derniers jours, les plus récentes
    // d'abord, pour que les jours récents restent complets si la borne mord.
    const attemptRows = await ctx.db
      .query("attempts")
      .withIndex("by_creation_time", (q) =>
        q.gt("_creationTime", now - 14 * DAY_MS),
      )
      .order("desc")
      .take(CAP.attempts + 1);
    const attemptsRead = attemptRows.slice(0, CAP.attempts);
    const recentAttempts = attemptsRead.filter((a) => a._creationTime >= since7);

    // Croissance.
    const waitlistRows = await ctx.db.query("waitlistEntries").take(CAP.waitlist + 1);
    const quoteRows = await ctx.db
      .query("quoteRequests")
      .withIndex("by_createdAt")
      .order("desc")
      .take(CAP.quotes + 1);
    const invitationRows = await ctx.db.query("invitationCodes").take(CAP.invitations);
    const couponRows = await ctx.db.query("coupons").take(CAP.coupons);

    // IA : la dépense du mois, en temps constant (`aiSpendShards`).
    const month = monthKeyOf(now);
    const shards = await ctx.db
      .query("aiSpendShards")
      .withIndex("by_month_shard", (q) => q.eq("month", month))
      .take(SPEND_SHARD_COUNT);
    const settings = await ctx.db.query("settings").first();

    // Économie du jeu.
    const walletRows = await ctx.db.query("wallets").take(CAP.wallets + 1);

    return {
      generatedAt: now,
      accounts,
      signupsByDay,
      schools: {
        total: realSchools.length,
        active: realSchools.filter((s) => s.status === "active").length,
        prospect: realSchools.filter((s) => s.status === "prospect").length,
        suspended: realSchools.filter((s) => s.status === "suspended").length,
        personalSpaces: schoolsRead.length - realSchools.length,
        capped: schoolRows.length > CAP.schools,
      },
      classes: boundedCount(classRows.length, CAP.classes),
      revenue: {
        collectedTotal: sumOf(completed, (p) => p.value),
        collectedThisMonth: sumOf(
          completed.filter((p) => p.at >= monthStart),
          (p) => p.value,
        ),
        collectedLastMonth: sumOf(
          completed.filter((p) => p.at >= lastMonthStart && p.at < monthStart),
          (p) => p.value,
        ),
        byMonth: bucketSeries(lastMonthKeys(now, 12), completed, monthKeyOf),
        pendingFcfa: sumOf(pending, (i) => i.amountFcfa),
        overdueFcfa: sumOf(overdue, (i) => i.amountFcfa),
        overdueCount: overdue.length,
        capped: paymentRows.length > CAP.payments,
      },
      subscriptions: {
        active: activeSubs.length,
        pastDue: pastDueSubs.length,
        pendingPayment: pendingSubs.length,
        seatsCovered: sumOf(runningSubs, (s) => s.seatsPurchased),
      },
      activity: {
        answersByDay: bucketSeries(
          lastDayKeys(now, 14),
          attemptsRead.map((a) => ({ at: a._creationTime, value: 1 })),
          dayKeyOf,
        ),
        answers7d: recentAttempts.length,
        activeStudents7d: new Set(recentAttempts.map((a) => a.studentId)).size,
        capped: attemptRows.length > CAP.attempts,
      },
      growth: {
        waitlist: boundedCount(waitlistRows.length, CAP.waitlist),
        quoteRequests30d: countSince(
          quoteRows.slice(0, CAP.quotes).map((q) => q.createdAt),
          since30,
        ),
        quoteRequests: boundedCount(quoteRows.length, CAP.quotes),
        invitationsActive: invitationRows.filter((row) => decideInvitation(row).ok)
          .length,
        couponsActive: couponRows.filter((c) => couponStatus(c, now) === "active")
          .length,
        couponUses: sumOf(couponRows, (c) => c.useCount),
      },
      ai: {
        month,
        costUsd: sumOf(shards, (s) => s.costUsd),
        calls: sumOf(shards, (s) => s.calls),
        budgetUsd: settings?.aiMonthlyBudgetUsd ?? null,
      },
      economy: {
        caurisInCirculation: sumOf(walletRows.slice(0, CAP.wallets), (w) => w.cauris),
        wallets: boundedCount(walletRows.length, CAP.wallets),
      },
    };
  },
});

// ── Les comptes d'un rôle ───────────────────────────────────────────────────

const ACCOUNTS_LIMIT = 500;

export type AdminAccountRow = {
  id: Id<"profiles">;
  name: string;
  email: string | null;
  role: Role;
  createdAt: number;
  /** Une ligne de détail propre au rôle : « 2 enfants », « CM1 », l'école. */
  details: string[];
  /** Le lien vers la fiche, quand la console en a une. */
  href: string | null;
};

function plural(count: number, singular: string, pluralForm?: string): string {
  return `${count} ${count > 1 ? (pluralForm ?? `${singular}s`) : singular}`;
}

async function accountDetails(
  ctx: QueryCtx,
  profile: Doc<"profiles">,
): Promise<{ details: string[]; href: string | null }> {
  switch (profile.role) {
    case "parent": {
      const links = await ctx.db
        .query("studentGuardians")
        .withIndex("by_guardianId", (q) => q.eq("guardianId", profile._id))
        .take(50);
      return { details: [plural(links.length, "enfant")], href: null };
    }
    case "professeur": {
      const classes = await ctx.db
        .query("schoolClasses")
        .withIndex("by_teacher", (q) => q.eq("teacherId", profile._id))
        .take(50);
      const staff = await ctx.db
        .query("schoolStaff")
        .withIndex("by_profile", (q) => q.eq("profileId", profile._id))
        .take(10);
      const schoolNames: string[] = [];
      for (const row of staff) {
        if (row.status !== "active") continue;
        const school = await ctx.db.get("schools", row.schoolId);
        if (school && isRealSchool(school)) schoolNames.push(school.name);
      }
      return {
        details: [
          plural(classes.length, "classe"),
          schoolNames.length > 0 ? schoolNames.join(", ") : "Sans école",
        ],
        href: null,
      };
    }
    case "directeur": {
      const schools = await ctx.db
        .query("schools")
        .withIndex("by_ownerProfileId", (q) => q.eq("ownerProfileId", profile._id))
        .take(5);
      const school = schools.find(isRealSchool);
      return {
        details: [school ? school.name : "École pas encore créée"],
        href: school ? `/admin/ecoles/detail?id=${school._id}` : null,
      };
    }
    case "student": {
      const guardians = await ctx.db
        .query("studentGuardians")
        .withIndex("by_studentId", (q) => q.eq("studentId", profile._id))
        .take(10);
      return {
        details: [
          profile.class ?? "Sans classe",
          plural(guardians.length, "adulte lié", "adultes liés"),
        ],
        href: `/admin/eleves/detail?id=${profile._id}`,
      };
    }
    case "admin":
      return { details: ["Équipe Jotna"], href: null };
  }
}

/** Les comptes d'un rôle, des plus récents aux plus anciens — console `admin`. */
export const listAccounts = query({
  args: {
    role: v.union(
      v.literal("student"),
      v.literal("parent"),
      v.literal("professeur"),
      v.literal("directeur"),
      v.literal("admin"),
    ),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ accounts: AdminAccountRow[]; truncated: boolean }> => {
    if (!(await callerIsAdmin(ctx))) return { accounts: [], truncated: false };
    const rows = await profilesOfRole(ctx, args.role, ACCOUNTS_LIMIT);
    const accounts = await Promise.all(
      rows.slice(0, ACCOUNTS_LIMIT).map(async (profile) => {
        const userId = ctx.db.normalizeId("users", profile.userId);
        const user = userId ? await ctx.db.get("users", userId) : null;
        const { details, href } = await accountDetails(ctx, profile);
        // Un élève n'a pas d'adresse : son `users.email` est son code de
        // connexion, qui est aussi son mot de passe. On ne l'affiche pas.
        const email =
          profile.role === "student" || !user?.email?.includes("@")
            ? null
            : user.email;
        return {
          id: profile._id,
          name: profile.name,
          email,
          role: profile.role,
          createdAt: profile._creationTime,
          details,
          href,
        };
      }),
    );
    return { accounts, truncated: rows.length > ACCOUNTS_LIMIT };
  },
});

// ── Revenus ─────────────────────────────────────────────────────────────────

const SUBSCRIPTIONS_LIMIT = 200;
const RECENT_PAYMENTS_LIMIT = 100;
const DUE_LIMIT = 100;

export type AdminSubscriptionRow = {
  id: Id<"subscriptions">;
  ownerType: "school" | "parent";
  ownerName: string;
  schoolId: Id<"schools"> | null;
  status: Doc<"subscriptions">["status"];
  seats: number;
  totalFcfa: number;
  paidFcfa: number;
  overdueFcfa: number;
  startsAt: number;
  endsAt: number;
};

export type AdminPaymentRow = {
  id: Id<"payments">;
  ownerName: string;
  provider: Doc<"payments">["provider"];
  status: Doc<"payments">["status"];
  amountFcfa: number;
  at: number;
};

export type AdminDueRow = {
  id: Id<"installments">;
  ownerName: string;
  schoolId: Id<"schools"> | null;
  index: number;
  amountFcfa: number;
  dueAt: number;
  status: "pending" | "overdue";
};

export const revenue = query({
  args: {},
  handler: async (
    ctx,
  ): Promise<{
    subscriptions: AdminSubscriptionRow[];
    payments: AdminPaymentRow[];
    due: AdminDueRow[];
    truncated: boolean;
  } | null> => {
    if (!(await callerIsAdmin(ctx))) return null;

    const nameCache = new Map<string, { name: string; schoolId: Id<"schools"> | null }>();
    async function ownerOf(subscriptionId: Id<"subscriptions">) {
      const cached = nameCache.get(subscriptionId);
      if (cached) return cached;
      const subscription = await ctx.db.get("subscriptions", subscriptionId);
      let owner = { name: "Contrat introuvable", schoolId: null as Id<"schools"> | null };
      if (subscription) {
        const school = await subscriptionSchool(ctx, subscription);
        owner = school
          ? { name: school.name, schoolId: school._id }
          : { name: subscription.ownerType === "parent" ? "Famille" : "École supprimée", schoolId: null };
      }
      nameCache.set(subscriptionId, owner);
      return owner;
    }

    const subscriptionRows = await ctx.db
      .query("subscriptions")
      .order("desc")
      .take(SUBSCRIPTIONS_LIMIT + 1);
    const subscriptions = await Promise.all(
      subscriptionRows.slice(0, SUBSCRIPTIONS_LIMIT).map(async (sub) => {
        const owner = await ownerOf(sub._id);
        const installments = await ctx.db
          .query("installments")
          .withIndex("by_subscription_index", (q) => q.eq("subscriptionId", sub._id))
          .take(50);
        return {
          id: sub._id,
          ownerType: sub.ownerType,
          ownerName: owner.name,
          schoolId: owner.schoolId,
          status: sub.status,
          seats: sub.seatsPurchased,
          totalFcfa: sub.totalFcfa,
          paidFcfa: sumOf(
            installments.filter((i) => i.status === "paid"),
            (i) => i.amountFcfa,
          ),
          overdueFcfa: sumOf(
            installments.filter((i) => i.status === "overdue"),
            (i) => i.amountFcfa,
          ),
          startsAt: sub.startsAt,
          endsAt: sub.endsAt,
        };
      }),
    );

    const paymentRows = await ctx.db
      .query("payments")
      .order("desc")
      .take(RECENT_PAYMENTS_LIMIT);
    const payments = await Promise.all(
      paymentRows.map(async (p) => ({
        id: p._id,
        ownerName: (await ownerOf(p.subscriptionId)).name,
        provider: p.provider,
        status: p.status,
        amountFcfa: p.amountFcfa,
        at: p.completedAt ?? p.createdAt,
      })),
    );

    // Les échéances : en retard d'abord, puis les prochaines à venir.
    const overdue = await ctx.db
      .query("installments")
      .withIndex("by_status_dueAt", (q) => q.eq("status", "overdue"))
      .take(DUE_LIMIT);
    const pending = await ctx.db
      .query("installments")
      .withIndex("by_status_dueAt", (q) => q.eq("status", "pending"))
      .take(DUE_LIMIT);
    const due = await Promise.all(
      [...overdue, ...pending].slice(0, DUE_LIMIT).map(async (i) => {
        const owner = await ownerOf(i.subscriptionId);
        return {
          id: i._id,
          ownerName: owner.name,
          schoolId: owner.schoolId,
          index: i.index,
          amountFcfa: i.amountFcfa,
          dueAt: i.dueAt,
          status: i.status as "pending" | "overdue",
        };
      }),
    );

    return {
      subscriptions,
      payments,
      due,
      truncated: subscriptionRows.length > SUBSCRIPTIONS_LIMIT,
    };
  },
});

// ── Fidélisation : qui reste, qui part, qui est parti ───────────────────────

const RETENTION_SUBSCRIPTIONS_CAP = 2000;
const RETENTION_REDEMPTIONS_CAP = 1000;
const ENROLLED_CAP = 500;
/** Un accès gratuit qui finit dans moins de 14 jours : à relancer. */
const FREE_ACCESS_SOON_MS = 14 * DAY_MS;

export type RetentionCustomerRow = {
  key: string;
  ownerType: "school" | "parent";
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  href: string | null;
  status: RetentionStatus;
  riskReason: RiskReason | null;
  renewed: boolean;
  lastEndsAt: number | null;
  lastSeats: number;
  schoolYears: string[];
  lifetimeFcfa: number;
  /** Élèves encore inscrits dans l'école (borne : 500), `null` pour une famille. */
  studentsEnrolled: number | null;
};

export type FreeAccessRow = {
  id: Id<"couponRedemptions">;
  name: string;
  email: string | null;
  role: "parent" | "professeur" | "directeur";
  accessUntil: number;
  ended: boolean;
};

export type AdminRetention = {
  generatedAt: number;
  schoolYear: string;
  counts: Record<RetentionStatus, number>;
  customers: RetentionCustomerRow[];
  cohorts: CohortRow[];
  freeAccess: FreeAccessRow[];
  capped: boolean;
};

/**
 * Pour chaque client qui a signé un contrat (école aujourd'hui, famille
 * demain) : abonné, à risque, parti — règles dans `retentionRules.ts`. Plus
 * le taux de renouvellement par année scolaire, et les accès gratuits
 * (coupons) finis ou sur le point de finir.
 */
export const retention = query({
  args: {},
  handler: async (ctx): Promise<AdminRetention | null> => {
    if (!(await callerIsAdmin(ctx))) return null;
    const now = Date.now();

    const rows = await ctx.db.query("subscriptions").take(RETENTION_SUBSCRIPTIONS_CAP + 1);
    const byOwner = new Map<string, Doc<"subscriptions">[]>();
    for (const row of rows.slice(0, RETENTION_SUBSCRIPTIONS_CAP)) {
      const key = `${row.ownerType}:${row.ownerId}`;
      const list = byOwner.get(key);
      if (list) list.push(row);
      else byOwner.set(key, [row]);
    }

    const counts: Record<RetentionStatus, number> = {
      active: 0,
      at_risk: 0,
      churned: 0,
      pending: 0,
      prospect: 0,
    };
    const customers: RetentionCustomerRow[] = [];
    for (const [key, contracts] of byOwner) {
      const verdict = classifyCustomer(
        contracts.map((c) => ({
          status: c.status,
          startsAt: c.startsAt,
          endsAt: c.endsAt,
          seats: c.seatsPurchased,
          totalFcfa: c.totalFcfa,
        })),
        now,
      );
      counts[verdict.status] += 1;
      if (verdict.status === "prospect") continue;

      const first = contracts[0];
      let row: Omit<RetentionCustomerRow, keyof typeof verdict | "key" | "ownerType"> = {
        name: "Client introuvable",
        contactName: null,
        email: null,
        phone: null,
        href: null,
        studentsEnrolled: null,
      };
      const school = await subscriptionSchool(ctx, first);
      if (school) {
        const enrolled = await ctx.db
          .query("schoolMemberships")
          .withIndex("by_school_status", (q) =>
            q.eq("schoolId", school._id).eq("status", "active"),
          )
          .take(ENROLLED_CAP);
        row = {
          name: school.name,
          contactName: school.contactName,
          email: school.contactEmail,
          phone: school.contactPhone ?? null,
          href: `/admin/ecoles/detail?id=${school._id}`,
          studentsEnrolled: enrolled.length,
        };
      } else if (first.ownerType === "parent") {
        const profileId = ctx.db.normalizeId("profiles", first.ownerId);
        const profile = profileId ? await ctx.db.get("profiles", profileId) : null;
        const userId = profile ? ctx.db.normalizeId("users", profile.userId) : null;
        const user = userId ? await ctx.db.get("users", userId) : null;
        row = { ...row, name: profile?.name ?? "Famille", email: user?.email ?? null };
      }
      customers.push({ key, ownerType: first.ownerType, ...row, ...verdict });
    }

    // Les plus urgents d'abord : à risque, puis partis, puis le reste ;
    // dans chaque groupe, la fin de contrat la plus proche ou la plus récente.
    const order: Record<RetentionStatus, number> = {
      at_risk: 0,
      churned: 1,
      pending: 2,
      active: 3,
      prospect: 4,
    };
    customers.sort(
      (a, b) =>
        order[a.status] - order[b.status] ||
        (a.status === "churned"
          ? (b.lastEndsAt ?? 0) - (a.lastEndsAt ?? 0)
          : (a.lastEndsAt ?? 0) - (b.lastEndsAt ?? 0)),
    );

    // Les accès gratuits des coupons : finis, ou qui finissent bientôt.
    const redemptions = await ctx.db
      .query("couponRedemptions")
      .order("desc")
      .take(RETENTION_REDEMPTIONS_CAP);
    const freeAccess: FreeAccessRow[] = [];
    for (const r of redemptions) {
      if (r.accessUntil === undefined || r.accessUntil - now > FREE_ACCESS_SOON_MS) continue;
      const profile = await ctx.db.get("profiles", r.profileId);
      const userId = profile ? ctx.db.normalizeId("users", profile.userId) : null;
      const user = userId ? await ctx.db.get("users", userId) : null;
      freeAccess.push({
        id: r._id,
        name: profile?.name ?? "Compte supprimé",
        email: user?.email?.includes("@") ? user.email : null,
        role: r.role,
        accessUntil: r.accessUntil,
        ended: r.accessUntil <= now,
      });
    }
    freeAccess.sort((a, b) => a.accessUntil - b.accessUntil);

    return {
      generatedAt: now,
      schoolYear: schoolYearOf(now),
      counts,
      customers,
      cohorts: renewalCohorts(customers, now),
      freeAccess,
      capped: rows.length > RETENTION_SUBSCRIPTIONS_CAP,
    };
  },
});

// ── Demandes de devis ───────────────────────────────────────────────────────

const QUOTES_LIMIT = 200;

export const listQuoteRequests = query({
  args: {},
  handler: async (
    ctx,
  ): Promise<{ requests: Doc<"quoteRequests">[]; truncated: boolean }> => {
    if (!(await callerIsAdmin(ctx))) return { requests: [], truncated: false };
    const rows = await ctx.db
      .query("quoteRequests")
      .withIndex("by_createdAt")
      .order("desc")
      .take(QUOTES_LIMIT + 1);
    return { requests: rows.slice(0, QUOTES_LIMIT), truncated: rows.length > QUOTES_LIMIT };
  },
});

/** Le texte de la note de suivi : 1 000 caractères au plus. */
const QUOTE_NOTE_MAX = 1000;

/**
 * Suit une demande de devis : à traiter, contactée, gagnée, perdue, avec une
 * note de l'équipe. La note n'est jamais montrée à l'école. `note` absente :
 * la note en place reste ; chaîne vide : elle est effacée.
 */
export const setQuoteStatus = mutation({
  args: {
    requestId: v.id("quoteRequests"),
    status: v.union(
      v.literal("new"),
      v.literal("contacted"),
      v.literal("won"),
      v.literal("lost"),
    ),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<null> => {
    if (!(await callerIsAdmin(ctx))) throw new ConvexError("Rôle non autorisé");
    const request = await ctx.db.get("quoteRequests", args.requestId);
    if (request === null) throw new ConvexError("Demande introuvable");

    const note = args.note?.replace(/\s+\n/g, "\n").trim();
    if (note !== undefined && note.length > QUOTE_NOTE_MAX) {
      throw new ConvexError(`La note fait ${QUOTE_NOTE_MAX} caractères au plus.`);
    }
    await ctx.db.patch("quoteRequests", request._id, {
      status: args.status,
      statusAt: Date.now(),
      ...(note === undefined ? {} : { adminNote: note === "" ? undefined : note }),
    });
    return null;
  },
});
