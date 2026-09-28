/**
 * Jeu de données MVP-1 pour le développement local et les tests Playwright —
 * MODULE INTERNE.
 *
 * SES DEUX FONCTIONS ÉTAIENT PUBLIQUES ET NE DEMANDAIENT RIEN. Un module
 * d'ensemencement n'a pas d'écran, donc personne ne relisait sa surface ; il
 * était pourtant exposé au réseau public au même titre que le reste de l'API.
 *
 * `debugStatus` était le plus grave, et c'était une `query` — donc sans même
 * l'obstacle d'une écriture. Elle faisait `users.collect()` et rendait les NOMS
 * et ADRESSES DE COURRIEL d'utilisateurs réels (`latestUsers`), dans une
 * application destinée à des enfants, dont le schéma cite la loi sénégalaise
 * 2008-12 sur les données personnelles. Un appelant NON AUTHENTIFIÉ connaissant
 * l'URL du déploiement les obtenait d'un seul appel.
 *
 * `seedMvp1` insérait une matière, deux thématiques et le singleton `settings`
 * sans aucun contrôle — alors que `subjects.create` et `topics.create`, qui
 * écrivent exactement les mêmes tables, exigent toutes deux `callerIsAdmin`.
 * Une garde de rôle posée ici n'aurait pas convenu pour autant : l'appelant
 * légitime est une personne devant un terminal, sans session ni profil, donc
 * l'exigence d'un `admin` aurait rendu la fonction inutilisable par le seul
 * chemin qui la justifie. C'est le raisonnement déjà tenu pour
 * `subjects.seedDefaults` et `resetContent.wipeAll` : un outil de développement
 * ne se garde pas, il se retire de la surface.
 *
 * CONSÉQUENCE ASSUMÉE, IDENTIQUE À CELLE DE SES DEUX PRÉCÉDENTS : plus aucun
 * appelant, et une fonction interne ne s'appelle que depuis une autre fonction
 * Convex. Tant que personne ne les câble, elles ne s'exécutent pas.
 *
 * TROIS SPECS PLAYWRIGHT ANNONÇAIENT `seedMvp1` COMME PRÉ-REQUIS
 * (`e2e/mvp1-full-flow`, `mvp1-real-topic`, `mvp1-smoke`). Aucune n'est jouée
 * par la CI — `.github/workflows/ci.yml` ne lance pas Playwright — donc ce
 * changement ne casse aucune marche automatique ; il déplace un geste manuel.
 * Le chemin de remplacement est l'interface d'administration, qui écrit ces
 * mêmes tables et existe : `/admin/subjects` crée la matière,
 * `/admin/subjects/[id]` les thématiques. Aucune ligne de commande n'est
 * proposée ici en échange : les consignes Convex de ce dépôt affirment qu'une
 * fonction interne « ne peut être appelée que par une autre fonction Convex »
 * (`convex/_generated/ai/guidelines.md`), et aucun déploiement n'est joignable
 * depuis cet environnement pour vérifier ce que l'outil en ligne fait vraiment.
 * Mieux vaut pas de commande qu'une commande que le prochain lecteur devra
 * vérifier lui-même — c'est déjà pour cela que la ligne d'usage de `wipeAll` a
 * été retirée plutôt que réécrite.
 *
 * Idempotent : relançable sans dupliquer. Ne crée AUCUN utilisateur — les
 * comptes se créent par /register.
 */

import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { visibleClassValidator } from "./curriculum";

/**
 * État du déploiement — aiUsage récents, paliers, compteurs, trois derniers
 * comptes. INTERNE : elle nomme des personnes réelles, voir l'en-tête.
 */
export const debugStatus = internalQuery({
  args: {},
  handler: async (ctx) => {
    const aiUsage = await ctx.db.query("aiUsage").order("desc").take(10);
    const paliers = await ctx.db.query("paliers").collect();
    const exercises = await ctx.db.query("exercises").take(5);
    const users = await ctx.db.query("users").collect();
    const profiles = await ctx.db.query("profiles").collect();
    return {
      recentAiUsage: aiUsage.map((r) => ({
        purpose: r.purpose,
        status: r.status,
        modelUsed: r.modelUsed,
        costUsd: r.costUsd,
        latencyMs: r.latencyMs,
        errorMessage: r.errorMessage,
        traceId: r.traceId,
        createdAt: new Date(r.createdAt).toISOString(),
      })),
      paliersCount: paliers.length,
      paliers: paliers.map((p) => ({
        _id: p._id,
        status: p.status,
        qaStatus: p.qaStatus,
        generatedAt: p.generatedAt
          ? new Date(p.generatedAt).toISOString()
          : null,
      })),
      exercisesCount: exercises.length,
      usersCount: users.length,
      profilesCount: profiles.length,
      latestUsers: users.slice(-3).map((u) => ({
        email: u.email,
        name: u.name,
      })),
    };
  },
});

export const seedMvp1 = internalMutation({
  args: {},
  handler: async (ctx) => {
    // 1. Subject Mathématiques
    const subjects = await ctx.db.query("subjects").collect();
    let mathsId: Id<"subjects">;
    const existingMaths = subjects.find(
      (s) => s.name.toLowerCase().includes("math"),
    );
    if (existingMaths) {
      mathsId = existingMaths._id;
    } else {
      mathsId = await ctx.db.insert("subjects", {
        name: "Mathématiques",
        icon: "Calculator",
        color: "#4f46e5",
        order: 1,
      });
    }

    // 2. Topics with class field
    const topicsToCreate: Array<{
      name: string;
      class: "CI" | "CP" | "CE1" | "CE2" | "CM1" | "CM2";
      description: string;
    }> = [
      {
        name: "Fractions",
        class: "CE2",
        description: "Découverte des fractions simples",
      },
      {
        name: "Multiplication",
        class: "CM1",
        description: "Tables et multiplications à 2 chiffres",
      },
    ];

    const existingTopics = await ctx.db
      .query("topics")
      .withIndex("by_subjectId", (q) => q.eq("subjectId", mathsId))
      .collect();

    const created: Array<{ topic: string; class: string; id: string }> = [];
    const skipped: string[] = [];

    let order = existingTopics.length;
    for (const t of topicsToCreate) {
      const exists = existingTopics.find(
        (et) => et.name === t.name && et.class === t.class,
      );
      if (exists) {
        skipped.push(`${t.name} (${t.class})`);
        continue;
      }
      const id = await ctx.db.insert("topics", {
        subjectId: mathsId,
        name: t.name,
        order: ++order,
        description: t.description,
        class: t.class,
      });
      created.push({ topic: t.name, class: t.class, id });
    }

    // Ensure settings singleton exists
    const existingSettings = await ctx.db
      .query("settings")
      .withIndex("by_singleton", (q) => q.eq("singleton", "settings"))
      .unique();
    if (!existingSettings) {
      await ctx.db.insert("settings", {
        singleton: "settings",
        aiMonthlyBudgetUsd: 100,
        economyMode: false,
        dailyMoreLimitPerKid: 3,
        updatedAt: Date.now(),
      });
    }

    return {
      mathsId,
      topicsCreated: created,
      topicsSkipped: skipped,
      settingsExisted: !!existingSettings,
    };
  },
});

/**
 * Inscrit un élève déjà enregistré (par /register) dans une école de
 * développement — pour vérifier à l'écran ce qu'un enfant scolarisé voit.
 *
 * Crée, s'ils manquent : une école « active », une classe du niveau demandé
 * (libellé « A »), un profil de professeur rattaché à la classe, et un
 * abonnement « active » d'un an pour dix sièges. Puis pose l'inscription
 * active de l'élève et aligne `profiles.class` sur la classe, exactement
 * comme `schools.enrollStudent`. Sans abonnement, `decideAccess` rendrait
 * `no_subscription` et l'enfant verrait le paywall.
 *
 * INTERNE, comme le reste du module : un outil de terminal, sans écran.
 * Idempotent sur l'école, la classe et le professeur ; refuse un élève qui a
 * déjà une inscription active, comme la vraie mutation.
 */
export const enrollStudentInDevSchool = internalMutation({
  args: {
    studentEmail: v.string(),
    class: visibleClassValidator,
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.studentEmail))
      .unique();
    if (!user) throw new Error(`Aucun compte pour ${args.studentEmail}`);
    const student = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", user._id as string))
      .unique();
    if (!student || student.role !== "student") {
      throw new Error(`${args.studentEmail} n'est pas un profil élève`);
    }

    const existing = await ctx.db
      .query("schoolMemberships")
      .withIndex("by_student_status", (q) =>
        q.eq("studentId", student._id).eq("status", "active"),
      )
      .first();
    if (existing) throw new Error("Cet élève a déjà une inscription active");

    const now = Date.now();
    const SCHOOL_NAME = "École Seydou Nourou Tall";

    let school = (await ctx.db.query("schools").take(100)).find(
      (s) => s.name === SCHOOL_NAME,
    );
    if (!school) {
      const schoolId = await ctx.db.insert("schools", {
        name: SCHOOL_NAME,
        city: "Dakar",
        contactName: "Direction",
        contactEmail: "direction@example.test",
        status: "active",
        createdAt: now,
      });
      school = (await ctx.db.get(schoolId))!;
    }

    let teacher = (await ctx.db.query("profiles").take(500)).find(
      (p) => p.role === "professeur" && p.name === "Mme Fatou Ndiaye",
    );
    if (!teacher) {
      const teacherId = await ctx.db.insert("profiles", {
        userId: `dev-seed-teacher-${school._id}`,
        role: "professeur",
        name: "Mme Fatou Ndiaye",
      });
      teacher = (await ctx.db.get(teacherId))!;
    }

    let schoolClass = await ctx.db
      .query("schoolClasses")
      .withIndex("by_school_class", (q) =>
        q.eq("schoolId", school._id).eq("class", args.class),
      )
      .first();
    if (!schoolClass) {
      const classId = await ctx.db.insert("schoolClasses", {
        schoolId: school._id,
        class: args.class,
        label: "A",
        teacherId: teacher._id,
      });
      schoolClass = (await ctx.db.get(classId))!;
    }

    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_owner", (q) =>
        q.eq("ownerType", "school").eq("ownerId", school._id as string),
      )
      .first();
    if (!subscription) {
      const oneYear = 365 * 24 * 60 * 60 * 1000;
      await ctx.db.insert("subscriptions", {
        ownerType: "school",
        ownerId: school._id as string,
        seatsPurchased: 10,
        pricePerSeatFcfa: 5000,
        totalFcfa: 50000,
        startsAt: now - 24 * 60 * 60 * 1000,
        endsAt: now + oneYear,
        status: "active",
        createdAt: now,
      });
    }

    const membershipId = await ctx.db.insert("schoolMemberships", {
      schoolId: school._id,
      studentId: student._id,
      schoolClassId: schoolClass._id,
      status: "active",
      enrolledAt: now,
    });
    if (student.class !== schoolClass.class) {
      await ctx.db.patch(student._id, { class: schoolClass.class });
    }

    return {
      membershipId,
      school: school.name,
      class: `${schoolClass.class} ${schoolClass.label}`,
      teacher: teacher.name,
    };
  },
});
