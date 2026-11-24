/**
 * Le tableau de bord du super admin, côté métier : ce qui bouge, ce qui est à
 * traiter, où l'on perd du monde, qui joue.
 *
 * `adminConsole.overview` donne les TOTAUX de la plateforme ; ce fichier donne
 * le reste de `/admin/dashboard` :
 *
 * - `pulse`      — les indicateurs d'une période (7, 30 ou 90 jours) et leur
 *                  variation par rapport à la période d'avant ;
 * - `todo`       — la liste « à traiter », la plus urgente d'abord ;
 * - `funnel`     — les entonnoirs : adultes, élèves, écoles ;
 * - `engagement` — qui joue : par niveau, par école, et les écoles muettes ;
 * - `feed`       — les derniers événements.
 *
 * Cinq requêtes plutôt qu'une : chaque bloc de l'écran se charge seul, et une
 * écriture dans une table ne recalcule que les blocs qui la lisent.
 *
 * TOUTES SONT RÉSERVÉES À `admin` et rendent `null` pour tout autre appelant.
 * Lectures bornées, comme dans `adminConsole.ts` ; calculs purs dans
 * `adminConsoleRules.ts`.
 *
 * « SÉANCE » = une ligne `palierAttempts` : un élève a ouvert un palier. Un
 * élève est ACTIF sur une période s'il y a ouvert au moins une séance.
 */
import { v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import { query, type QueryCtx } from "./_generated/server";
import { callerIsAdmin } from "./access";
import {
  DAY_MS,
  bucketSeries,
  dayKeyOf,
  deltaOf,
  distinctCount,
  distinctPerDay,
  funnelSteps,
  lastDayKeys,
  monthKeyOf,
  periodWindow,
  rateOf,
  splitPeriods,
  sumOf,
  topBy,
  type Delta,
  type FunnelStep,
  type SeriesPoint,
} from "./adminConsoleRules";
import { VISIBLE_CLASSES } from "./curriculum";
import { describeCouponBenefit } from "./couponRules";
import { SPEND_SHARD_COUNT } from "./aiGateway/spendShards";

const CAP = {
  signups: 3000,
  sessions: 4000,
  payments: 1000,
  studentsForFunnel: 1000,
  adultsPerRole: 500,
  schools: 1000,
  subscriptions: 2000,
  quotes: 500,
  invitations: 500,
  waitlist: 1000,
} as const;

const periodValidator = v.union(v.literal(7), v.literal(30), v.literal(90));

/** Les séances ouvertes depuis `since`, les plus récentes d'abord. */
async function sessionsSince(ctx: QueryCtx, since: number) {
  const rows = await ctx.db
    .query("palierAttempts")
    .withIndex("by_creation_time", (q) => q.gt("_creationTime", since))
    .order("desc")
    .take(CAP.sessions + 1);
  return { rows: rows.slice(0, CAP.sessions), capped: rows.length > CAP.sessions };
}

function isRealSchool(school: Doc<"schools">): boolean {
  return school.kind !== "personal";
}

/** Part des séances JUGÉES qui sont validées. En cours et abandonnées ne comptent pas. */
function successRate(sessions: readonly Doc<"palierAttempts">[]): number | null {
  const validated = sessions.filter((s) => s.status === "validated").length;
  const failed = sessions.filter(
    (s) => s.status === "failed" || s.status === "regen_failed",
  ).length;
  return rateOf(validated, validated + failed);
}

// ── Le pouls : une période et sa variation ──────────────────────────────────

export type AdminPulse = {
  days: 7 | 30 | 90;
  signups: Delta;
  activeStudents: Delta;
  sessions: Delta;
  collectedFcfa: Delta;
  successRate: { current: number | null; previous: number | null };
  series: { signups: SeriesPoint[]; activeStudents: SeriesPoint[] };
  capped: boolean;
};

export const pulse = query({
  args: { days: periodValidator },
  handler: async (ctx, args): Promise<AdminPulse | null> => {
    if (!(await callerIsAdmin(ctx))) return null;
    const now = Date.now();
    const { days } = args;
    const { previousSince } = periodWindow(now, days);

    // Inscriptions, équipe exclue.
    const profileRows = await ctx.db
      .query("profiles")
      .withIndex("by_creation_time", (q) => q.gt("_creationTime", previousSince))
      .order("desc")
      .take(CAP.signups + 1);
    const signups = splitPeriods(
      profileRows
        .slice(0, CAP.signups)
        .filter((p) => p.role !== "admin")
        .map((p) => ({ at: p._creationTime })),
      now,
      days,
    );

    // Séances et élèves actifs.
    const sessions = await sessionsSince(ctx, previousSince);
    const played = splitPeriods(
      sessions.rows.map((s) => ({ at: s._creationTime, id: s.userId as string, row: s })),
      now,
      days,
    );

    // Argent encaissé.
    const paymentRows = await ctx.db.query("payments").order("desc").take(CAP.payments);
    const paid = splitPeriods(
      paymentRows
        .filter((p) => p.status === "completed")
        .map((p) => ({ at: p.completedAt ?? p.createdAt, value: p.amountFcfa })),
      now,
      days,
    );

    const keys = lastDayKeys(now, days);
    return {
      days,
      signups: deltaOf(signups.current.length, signups.previous.length),
      activeStudents: deltaOf(distinctCount(played.current), distinctCount(played.previous)),
      sessions: deltaOf(played.current.length, played.previous.length),
      collectedFcfa: deltaOf(
        sumOf(paid.current, (p) => p.value),
        sumOf(paid.previous, (p) => p.value),
      ),
      successRate: {
        current: successRate(played.current.map((p) => p.row)),
        previous: successRate(played.previous.map((p) => p.row)),
      },
      series: {
        signups: bucketSeries(
          keys,
          signups.current.map((s) => ({ at: s.at, value: 1 })),
          dayKeyOf,
        ),
        activeStudents: distinctPerDay(keys, played.current),
      },
      capped: profileRows.length > CAP.signups || sessions.capped,
    };
  },
});

// ── À traiter ───────────────────────────────────────────────────────────────

export type TodoSeverity = "critical" | "warning" | "info";

export type TodoItem = {
  key: string;
  severity: TodoSeverity;
  count: number;
  title: string;
  detail: string;
  href: string;
};

const SEVERITY_ORDER: Record<TodoSeverity, number> = { critical: 0, warning: 1, info: 2 };

const fcfa = (value: number) => `${new Intl.NumberFormat("fr-FR").format(value)} FCFA`;
const plural = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`;

/**
 * Ce qui attend une action de l'équipe, le plus urgent d'abord. Une liste
 * vide veut dire : rien à traiter.
 */
export const todo = query({
  args: {},
  handler: async (ctx): Promise<TodoItem[] | null> => {
    if (!(await callerIsAdmin(ctx))) return null;
    const now = Date.now();
    const items: TodoItem[] = [];

    // 1. Échéances en retard : l'école est coupée 21 jours après la plus ancienne.
    const overdue = await ctx.db
      .query("installments")
      .withIndex("by_status_dueAt", (q) => q.eq("status", "overdue"))
      .take(200);
    if (overdue.length > 0) {
      items.push({
        key: "overdue",
        severity: "critical",
        count: overdue.length,
        title: plural(overdue.length, "échéance en retard", "échéances en retard"),
        detail: `${fcfa(sumOf(overdue, (i) => i.amountFcfa))} à relancer. Les élèves sont coupés 21 jours après l'échéance.`,
        href: "/admin/revenus",
      });
    }

    // 2. Contrats signés, pas encore payés.
    const pendingSubs = await ctx.db
      .query("subscriptions")
      .withIndex("by_status", (q) => q.eq("status", "pending_payment"))
      .take(200);
    if (pendingSubs.length > 0) {
      items.push({
        key: "pending_contracts",
        severity: "warning",
        count: pendingSubs.length,
        title: plural(
          pendingSubs.length,
          "contrat en attente de paiement",
          "contrats en attente de paiement",
        ),
        detail: `${fcfa(sumOf(pendingSubs, (s) => s.totalFcfa))} signés. L'accès de l'école s'ouvre au premier versement.`,
        href: "/admin/revenus",
      });
    }

    // 3. Contrats qui finissent dans 60 jours.
    const ending = await ctx.db
      .query("subscriptions")
      .withIndex("by_endsAt", (q) => q.gt("endsAt", now).lt("endsAt", now + 60 * DAY_MS))
      .take(200);
    const endingActive = ending.filter(
      (s) => s.status === "active" || s.status === "past_due",
    );
    if (endingActive.length > 0) {
      items.push({
        key: "ending_contracts",
        severity: "warning",
        count: endingActive.length,
        title: plural(
          endingActive.length,
          "contrat finit dans moins de 60 jours",
          "contrats finissent dans moins de 60 jours",
        ),
        detail: "À relancer avant la fin pour le renouvellement.",
        href: "/admin/fidelisation",
      });
    }

    // 4. Demandes de devis sans réponse.
    const quotes = await ctx.db
      .query("quoteRequests")
      .withIndex("by_createdAt")
      .order("desc")
      .take(CAP.quotes);
    const newQuotes = quotes.filter((q) => (q.status ?? "new") === "new");
    if (newQuotes.length > 0) {
      const oldest = Math.min(...newQuotes.map((q) => q.createdAt));
      const waitingDays = Math.floor((now - oldest) / DAY_MS);
      items.push({
        key: "new_quotes",
        severity: waitingDays >= 3 ? "critical" : "warning",
        count: newQuotes.length,
        title: plural(
          newQuotes.length,
          "demande de devis à traiter",
          "demandes de devis à traiter",
        ),
        detail:
          waitingDays >= 1
            ? `La plus ancienne attend depuis ${plural(waitingDays, "jour", "jours")}.`
            : "Reçue aujourd'hui.",
        href: "/admin/devis",
      });
    }

    // 5. Écoles encore « prospect ».
    const prospects = await ctx.db
      .query("schools")
      .withIndex("by_status", (q) => q.eq("status", "prospect"))
      .take(200);
    const realProspects = prospects.filter(isRealSchool);
    if (realProspects.length > 0) {
      items.push({
        key: "prospects",
        severity: "info",
        count: realProspects.length,
        title: plural(
          realProspects.length,
          "école prospect sans contrat",
          "écoles prospects sans contrat",
        ),
        detail: "Créées dans la console, pas encore signées.",
        href: "/admin/ecoles",
      });
    }

    // 6. Budget IA du mois.
    const month = monthKeyOf(now);
    const shards = await ctx.db
      .query("aiSpendShards")
      .withIndex("by_month_shard", (q) => q.eq("month", month))
      .take(SPEND_SHARD_COUNT);
    const settings = await ctx.db.query("settings").first();
    const budget = settings?.aiMonthlyBudgetUsd ?? null;
    const spent = sumOf(shards, (s) => s.costUsd);
    if (budget !== null && budget > 0 && spent / budget >= 0.8) {
      const share = Math.round((spent / budget) * 100);
      items.push({
        key: "ai_budget",
        severity: share >= 100 ? "critical" : "warning",
        count: share,
        title: `Budget IA du mois utilisé à ${share} %`,
        detail: `${spent.toFixed(2)} $ sur ${budget} $. Au-delà, les générations sont refusées.`,
        href: "/admin/ai-settings",
      });
    }

    // 7. Accès gratuits (coupons) qui finissent dans 14 jours.
    const redemptions = await ctx.db.query("couponRedemptions").order("desc").take(500);
    const endingAccess = redemptions.filter(
      (r) =>
        r.accessUntil !== undefined &&
        r.accessUntil > now &&
        r.accessUntil - now <= 14 * DAY_MS,
    );
    if (endingAccess.length > 0) {
      items.push({
        key: "free_access_ending",
        severity: "info",
        count: endingAccess.length,
        title: plural(
          endingAccess.length,
          "accès gratuit finit dans 14 jours",
          "accès gratuits finissent dans 14 jours",
        ),
        detail: "Le moment de proposer la suite.",
        href: "/admin/fidelisation",
      });
    }

    return items.sort(
      (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || b.count - a.count,
    );
  },
});

// ── Entonnoirs ──────────────────────────────────────────────────────────────

export type AdminFunnel = {
  adults: FunnelStep[];
  students: FunnelStep[];
  schools: FunnelStep[];
  waitlist: {
    total: number;
    ecole: number;
    parent: number;
    professeur: number;
    capped: boolean;
  };
  capped: boolean;
};

async function roleProfiles(ctx: QueryCtx, role: Doc<"profiles">["role"], cap: number) {
  return await ctx.db
    .query("profiles")
    .withIndex("by_role", (q) => q.eq("role", role))
    .order("desc")
    .take(cap + 1);
}

export const funnel = query({
  args: {},
  handler: async (ctx): Promise<AdminFunnel | null> => {
    if (!(await callerIsAdmin(ctx))) return null;
    const now = Date.now();
    let capped = false;

    // ADULTES : de l'invitation au compte qui sert.
    const invitations = await ctx.db.query("invitationCodes").take(CAP.invitations);
    const parents = await roleProfiles(ctx, "parent", CAP.adultsPerRole);
    const teachers = await roleProfiles(ctx, "professeur", CAP.adultsPerRole);
    const directors = await roleProfiles(ctx, "directeur", CAP.adultsPerRole);
    for (const list of [parents, teachers, directors]) {
      if (list.length > CAP.adultsPerRole) capped = true;
    }
    const adults = [parents, teachers, directors].map((l) => l.slice(0, CAP.adultsPerRole));

    // Un compte « sert » quand il a fait le premier geste de son rôle : un
    // parent a un enfant, un professeur une classe, une école son école.
    let activated = 0;
    for (const parent of adults[0]) {
      const child = await ctx.db
        .query("studentGuardians")
        .withIndex("by_guardianId", (q) => q.eq("guardianId", parent._id))
        .first();
      if (child) activated += 1;
    }
    for (const teacher of adults[1]) {
      const klass = await ctx.db
        .query("schoolClasses")
        .withIndex("by_teacher", (q) => q.eq("teacherId", teacher._id))
        .first();
      if (klass) activated += 1;
    }
    for (const director of adults[2]) {
      const schools = await ctx.db
        .query("schools")
        .withIndex("by_ownerProfileId", (q) => q.eq("ownerProfileId", director._id))
        .take(5);
      if (schools.some(isRealSchool)) activated += 1;
    }

    // ÉLÈVES : du compte créé à l'élève qui joue.
    const studentRows = await roleProfiles(ctx, "student", CAP.studentsForFunnel);
    if (studentRows.length > CAP.studentsForFunnel) capped = true;
    const students = studentRows.slice(0, CAP.studentsForFunnel);
    let everPlayed = 0;
    for (const student of students) {
      const first = await ctx.db
        .query("palierAttempts")
        .withIndex("by_user", (q) => q.eq("userId", student._id))
        .first();
      if (first) everPlayed += 1;
    }
    const recent = await sessionsSince(ctx, now - 30 * DAY_MS);
    if (recent.capped) capped = true;
    const active30 = new Set(recent.rows.map((s) => s.userId as string)).size;
    const active7 = new Set(
      recent.rows
        .filter((s) => s._creationTime >= now - 7 * DAY_MS)
        .map((s) => s.userId as string),
    ).size;

    // ÉCOLES : du devis au contrat payé.
    const quotes = await ctx.db.query("quoteRequests").take(CAP.quotes);
    const schoolRows = await ctx.db.query("schools").take(CAP.schools);
    const realSchools = schoolRows.filter(isRealSchool);
    const subs = await ctx.db.query("subscriptions").take(CAP.subscriptions);
    const schoolSubs = subs.filter((s) => s.ownerType === "school");
    const signed = new Set(
      schoolSubs.filter((s) => s.status !== "draft").map((s) => s.ownerId),
    ).size;
    const paying = new Set(
      schoolSubs
        .filter((s) => s.status === "active" || s.status === "past_due")
        .map((s) => s.ownerId),
    ).size;

    const waitlistRows = await ctx.db.query("waitlistEntries").take(CAP.waitlist + 1);
    const waitlist = waitlistRows.slice(0, CAP.waitlist);

    return {
      adults: funnelSteps([
        { label: "Places d'invitation émises", value: sumOf(invitations, (i) => i.maxUses) },
        {
          label: "Comptes adultes créés",
          value: adults[0].length + adults[1].length + adults[2].length,
        },
        { label: "Comptes qui servent", value: activated },
      ]),
      students: funnelSteps([
        { label: "Comptes élèves", value: students.length },
        { label: "Ont joué au moins une fois", value: everPlayed },
        { label: "Actifs sur 30 jours", value: active30 },
        { label: "Actifs sur 7 jours", value: active7 },
      ]),
      schools: funnelSteps([
        { label: "Demandes de devis", value: quotes.length },
        { label: "Écoles créées", value: realSchools.length },
        { label: "Contrat signé", value: signed },
        { label: "Contrat payé", value: paying },
      ]),
      waitlist: {
        total: waitlist.length,
        ecole: waitlist.filter((w) => w.audience === "ecole").length,
        parent: waitlist.filter((w) => w.audience === "parent").length,
        professeur: waitlist.filter((w) => w.audience === "professeur").length,
        capped: waitlistRows.length > CAP.waitlist,
      },
      capped,
    };
  },
});

// ── Engagement : qui joue ───────────────────────────────────────────────────

export type ClassEngagement = {
  class: string;
  activeStudents: number;
  sessions: number;
  successRate: number | null;
};

export type SchoolEngagement = {
  id: Id<"schools">;
  name: string;
  activeStudents: number;
  sessions: number;
};

export type AdminEngagement = {
  days: 7 | 30 | 90;
  byClass: ClassEngagement[];
  /** Élèves actifs sans école : créés par un parent, ou classe d'un professeur seul. */
  outsideSchools: { activeStudents: number; sessions: number };
  topSchools: SchoolEngagement[];
  /** Écoles réelles avec des élèves inscrits, et aucune séance sur la période. */
  quietSchools: { id: Id<"schools">; name: string }[];
  quietSchoolCount: number;
  capped: boolean;
};

export const engagement = query({
  args: { days: periodValidator },
  handler: async (ctx, args): Promise<AdminEngagement | null> => {
    if (!(await callerIsAdmin(ctx))) return null;
    const now = Date.now();
    const { rows, capped } = await sessionsSince(ctx, now - args.days * DAY_MS);

    const byStudent = new Map<string, Doc<"palierAttempts">[]>();
    for (const row of rows) {
      const list = byStudent.get(row.userId);
      if (list) list.push(row);
      else byStudent.set(row.userId, [row]);
    }

    const classStats = new Map<
      string,
      { students: number; sessions: Doc<"palierAttempts">[] }
    >(VISIBLE_CLASSES.map((c) => [c, { students: 0, sessions: [] }]));
    const schoolStats = new Map<Id<"schools">, { students: number; sessions: number }>();
    const outside = { activeStudents: 0, sessions: 0 };

    // Une lecture par élève actif : son niveau, et son école s'il en a une.
    for (const [studentId, sessions] of byStudent) {
      const profile = await ctx.db.get("profiles", studentId as Id<"profiles">);
      const klass = profile?.class ? classStats.get(profile.class) : undefined;
      if (klass) {
        klass.students += 1;
        klass.sessions.push(...sessions);
      }
      const membership = await ctx.db
        .query("schoolMemberships")
        .withIndex("by_student_status", (q) =>
          q.eq("studentId", studentId as Id<"profiles">).eq("status", "active"),
        )
        .first();
      const school = membership ? await ctx.db.get("schools", membership.schoolId) : null;
      if (school && isRealSchool(school)) {
        const stat = schoolStats.get(school._id) ?? { students: 0, sessions: 0 };
        stat.students += 1;
        stat.sessions += sessions.length;
        schoolStats.set(school._id, stat);
      } else {
        outside.activeStudents += 1;
        outside.sessions += sessions.length;
      }
    }

    // Écoles réelles : celles qui jouent, et celles qui ont des inscrits et se taisent.
    const schoolRows = (await ctx.db.query("schools").take(CAP.schools)).filter(isRealSchool);
    const playing: SchoolEngagement[] = [];
    const quiet: { id: Id<"schools">; name: string }[] = [];
    for (const school of schoolRows) {
      const stat = schoolStats.get(school._id);
      if (stat) {
        playing.push({
          id: school._id,
          name: school.name,
          activeStudents: stat.students,
          sessions: stat.sessions,
        });
        continue;
      }
      const enrolled = await ctx.db
        .query("schoolMemberships")
        .withIndex("by_school_status", (q) =>
          q.eq("schoolId", school._id).eq("status", "active"),
        )
        .first();
      if (enrolled) quiet.push({ id: school._id, name: school.name });
    }

    return {
      days: args.days,
      byClass: VISIBLE_CLASSES.map((c) => {
        const stat = classStats.get(c)!;
        return {
          class: c,
          activeStudents: stat.students,
          sessions: stat.sessions.length,
          successRate: successRate(stat.sessions),
        };
      }),
      outsideSchools: outside,
      topSchools: topBy(playing, (s) => s.activeStudents, 5),
      quietSchools: quiet.sort((a, b) => a.name.localeCompare(b.name)).slice(0, 8),
      quietSchoolCount: quiet.length,
      capped,
    };
  },
});

// ── Derniers événements ─────────────────────────────────────────────────────

export type FeedItem = {
  key: string;
  kind: "signup" | "quote" | "coupon" | "payment" | "school";
  title: string;
  detail: string;
  at: number;
  href: string | null;
};

const ROLE_LABEL: Record<Doc<"profiles">["role"], string> = {
  admin: "équipe",
  parent: "parent",
  professeur: "professeur",
  directeur: "école",
  student: "élève",
};

/** Les derniers événements de la plateforme, du plus récent au plus ancien. */
export const feed = query({
  args: {},
  handler: async (ctx): Promise<FeedItem[] | null> => {
    if (!(await callerIsAdmin(ctx))) return null;
    const items: FeedItem[] = [];

    // Les élèves arrivent par dizaines à chaque import : le fil ne garde que
    // les adultes, qui sont des inscriptions décidées.
    const profiles = await ctx.db.query("profiles").order("desc").take(80);
    const adults = profiles.filter((p) => p.role !== "student" && p.role !== "admin");
    for (const p of adults.slice(0, 8)) {
      items.push({
        key: `signup:${p._id}`,
        kind: "signup",
        title: p.name,
        detail: `Nouveau compte ${ROLE_LABEL[p.role]}`,
        at: p._creationTime,
        href: "/admin/comptes",
      });
    }

    const quotes = await ctx.db
      .query("quoteRequests")
      .withIndex("by_createdAt")
      .order("desc")
      .take(5);
    for (const q of quotes) {
      items.push({
        key: `quote:${q._id}`,
        kind: "quote",
        title: q.schoolName,
        detail: `Demande de devis, ${q.studentCount} élèves, ${q.city}`,
        at: q.createdAt,
        href: "/admin/devis",
      });
    }

    const redemptions = await ctx.db.query("couponRedemptions").order("desc").take(5);
    for (const r of redemptions) {
      const profile = await ctx.db.get("profiles", r.profileId);
      items.push({
        key: `coupon:${r._id}`,
        kind: "coupon",
        title: profile?.name ?? "Compte supprimé",
        detail: `Coupon utilisé : ${describeCouponBenefit(r.benefit).toLowerCase()}`,
        at: r.at,
        href: "/admin/coupons",
      });
    }

    const payments = await ctx.db.query("payments").order("desc").take(20);
    for (const p of payments.filter((row) => row.status === "completed").slice(0, 5)) {
      const sub = await ctx.db.get("subscriptions", p.subscriptionId);
      const schoolId =
        sub?.ownerType === "school" ? ctx.db.normalizeId("schools", sub.ownerId) : null;
      const school = schoolId ? await ctx.db.get("schools", schoolId) : null;
      items.push({
        key: `payment:${p._id}`,
        kind: "payment",
        title: school?.name ?? "Versement",
        detail: `Versement encaissé : ${fcfa(p.amountFcfa)}`,
        at: p.completedAt ?? p.createdAt,
        href: "/admin/revenus",
      });
    }

    const schools = await ctx.db.query("schools").order("desc").take(20);
    for (const s of schools.filter(isRealSchool).slice(0, 4)) {
      items.push({
        key: `school:${s._id}`,
        kind: "school",
        title: s.name,
        detail: s.city ? `École créée, ${s.city}` : "École créée",
        at: s._creationTime,
        href: `/admin/ecoles/detail?id=${s._id}`,
      });
    }

    return items.sort((a, b) => b.at - a.at).slice(0, 8);
  },
});
