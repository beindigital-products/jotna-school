import { v } from "convex/values";
import {
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { createAccount } from "@convex-dev/auth/server";
import type { Id } from "./_generated/dataModel";

// ---------------------------------------------------------------------------
// UNE ÉCOLE DE TEST COMPLÈTE — école, contrat, personnel, classes, élèves.
//
// MODULE INTERNE, comme `testSeeds.ts` et pour la même raison : un outil de
// développement ne se garde pas par un rôle, il se retire de la surface
// publique. L'appelant légitime est une personne devant un terminal, sans
// session ni profil ; exiger un `admin` rendrait la fonction inutilisable par
// le seul chemin qui la justifie.
//
//     npx convex run testSeedsSchool:seedTestSchool '{"confirmDeployment":"<nom-du-déploiement>"}'
//
// IL PASSE PAR LE VRAI PIPELINE D'IMPORT pour les élèves. Réécrire ici la
// création de comptes aurait produit des élèves qui ressemblent à ceux d'une
// école sans en être : `studentImportRun.processBatch` tire les codes, crée
// les comptes, inscrit en classe, journalise l'acte et émet le code parent.
// Un jeu de test qui contourne tout cela ne teste que lui-même.
//
// CE QU'IL CONTOURNE QUAND MÊME, ET POURQUOI. Il insère le travail d'import
// directement au lieu d'appeler `studentImport.openImport` : cette mutation
// exige une session de personnel et vérifie les sièges du contrat. Aucune des
// deux n'est disponible depuis la ligne de commande, et le contrôle de sièges
// porte sur un contrat que ce script vient lui-même d'écrire.
//
// LES MOTS DE PASSE SONT EN CLAIR ET LISIBLES, délibérément : ce sont des
// comptes de démonstration sur un déploiement de développement. Le script les
// rend en sortie, c'est tout leur intérêt. Ne le lancez jamais sur production
// — `assertTargetedDeployment` ci-dessous existe pour cela.
//
// IDEMPOTENT PAR LE NOM : relancé, il crée une école portant un suffixe
// différent plutôt que d'écraser la précédente. Rien n'est supprimé.
// ---------------------------------------------------------------------------

/** Ce que l'école de test contient, en clair, pour la sortie du script. */
const SCHOOL_NAME = "École de démonstration Jotna";
const STAFF_PASSWORD = "jotna2026";

const CLASSES = [
  { class: "CM1" as const, label: "A" },
  { class: "CM2" as const, label: "A" },
];

const TEACHERS = [
  { name: "Fatou Diop", email: "prof.cm1@demo-jotna.sn", classIndex: 0 },
  { name: "Moussa Ndiaye", email: "prof.cm2@demo-jotna.sn", classIndex: 1 },
];

const DIRECTOR = {
  name: "Awa Fall",
  email: "directeur@demo-jotna.sn",
};

const STUDENTS = [
  { name: "Aminata Sow", classIndex: 0 },
  { name: "Ibrahima Ba", classIndex: 0 },
  { name: "Mariama Diallo", classIndex: 0 },
  { name: "Cheikh Faye", classIndex: 0 },
  { name: "Ndeye Gueye", classIndex: 1 },
  { name: "Ousmane Sarr", classIndex: 1 },
  { name: "Adama Camara", classIndex: 1 },
  { name: "Bineta Thiam", classIndex: 1 },
];

const YEAR_MS = 365 * 24 * 60 * 60 * 1000;

/**
 * Refuse de travailler sur un déploiement que l'appelant n'a pas nommé.
 *
 * Même garde que `resetDeployment.wipeEverything`, et pour la même raison :
 * `npx convex run` sans `--prod` vise le développement, mais une garantie qui
 * repose sur l'attention de celui qui tape n'est pas une garantie. Ce script
 * crée des comptes dont le mot de passe est écrit dans ce fichier.
 */
export function assertTargetedDeployment(confirmDeployment: string) {
  const actual = process.env.CONVEX_CLOUD_URL ?? "";
  if (confirmDeployment.trim() === "") {
    throw new Error(
      "Nommez le déploiement visé : " +
        '{"confirmDeployment":"<nom>"}. Déploiement courant : ' +
        actual,
    );
  }
  if (!actual.includes(confirmDeployment.trim())) {
    throw new Error(
      `Ce déploiement est ${actual}, pas « ${confirmDeployment} ». ` +
        "Rien n'a été écrit.",
    );
  }
}

/** L'école, son contrat et ses classes — une seule transaction. */
export const createSchoolShell = internalMutation({
  args: { suffix: v.string() },
  handler: async (ctx, args) => {
    const now = Date.now();

    const schoolId = await ctx.db.insert("schools", {
      name: `${SCHOOL_NAME} ${args.suffix}`,
      city: "Dakar",
      contactName: DIRECTOR.name,
      contactEmail: DIRECTOR.email,
      contactPhone: "+221 77 000 00 00",
      ninea: "0000000000000",
      status: "active",
      createdAt: now,
    });

    // UN CONTRAT ACTIF, SANS QUOI LES ÉLÈVES SONT BLOQUÉS. `decideAccess`
    // refuse `no_subscription` puis `expired` : un jeu de test sans contrat
    // courant produirait huit élèves qui ne peuvent ouvrir aucun exercice, et
    // la panne se lirait comme un bug du contenu.
    await ctx.db.insert("subscriptions", {
      ownerType: "school",
      ownerId: schoolId,
      seatsPurchased: 50,
      pricePerSeatFcfa: 5000,
      totalFcfa: 250000,
      startsAt: now - 24 * 60 * 60 * 1000,
      endsAt: now + YEAR_MS,
      status: "active",
      createdAt: now,
    });

    const classIds: Id<"schoolClasses">[] = [];
    for (const c of CLASSES) {
      classIds.push(
        await ctx.db.insert("schoolClasses", {
          schoolId,
          class: c.class,
          label: c.label,
        }),
      );
    }

    return { schoolId, classIds };
  },
});

/** Rattache un compte du personnel, et lui confie sa classe s'il en a une. */
export const attachSeededStaff = internalMutation({
  args: {
    schoolId: v.id("schools"),
    staffUserId: v.id("users"),
    staffRole: v.union(v.literal("directeur"), v.literal("professeur")),
    schoolClassId: v.optional(v.id("schoolClasses")),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.staffUserId))
      .unique();
    if (!profile) throw new Error("Profil du personnel introuvable");

    await ctx.db.insert("schoolStaff", {
      schoolId: args.schoolId,
      profileId: profile._id,
      staffRole: args.staffRole,
      status: "active",
    });

    // LE LIEN QUI DONNE LA VUE SUR LES ÉLÈVES PASSE PAR LA CLASSE, pas par
    // `schoolStaff` : `access.studentIdsTaughtBy` part de
    // `schoolClasses.teacherId`. Un professeur rattaché mais sans classe ne
    // verrait aucun élève, et le jeu de test paraîtrait vide.
    if (args.schoolClassId) {
      await ctx.db.patch(args.schoolClassId, { teacherId: profile._id });
    }

    return profile._id;
  },
});

/** Ouvre le travail d'import et ses lignes, sans passer par l'écran. */
export const openSeededImport = internalMutation({
  args: {
    schoolId: v.id("schools"),
    directorProfileId: v.id("profiles"),
    rows: v.array(
      v.object({ name: v.string(), schoolClassId: v.id("schoolClasses") }),
    ),
  },
  handler: async (ctx, args) => {
    const jobId = await ctx.db.insert("studentImportJobs", {
      schoolId: args.schoolId,
      createdBy: args.directorProfileId,
      totalRows: args.rows.length,
      processedRows: 0,
      status: "pending",
      startedAt: Date.now(),
    });

    for (const row of args.rows) {
      await ctx.db.insert("studentImportRows", {
        jobId,
        schoolClassId: row.schoolClassId,
        name: row.name,
        status: "pending",
      });
    }

    return jobId;
  },
});

/** Les identifiants produits, relus une fois l'import terminé. */
export const seededCredentials = internalQuery({
  args: { jobId: v.id("studentImportJobs") },
  handler: async (ctx, args) => {
    // `by_job_status` et non `by_job` : l'index est composé, et son PRÉFIXE
    // suffit pour prendre toutes les lignes du travail, quel que soit leur
    // état. On veut aussi celles qui ont échoué — c'est justement ce qu'il
    // faut lire quand le jeu de test paraît incomplet.
    const rows = await ctx.db
      .query("studentImportRows")
      .withIndex("by_job_status", (q) => q.eq("jobId", args.jobId))
      .collect();

    const out = [];
    for (const row of rows) {
      // UN CODE PAR ÉLÈVE, PAR L'INDEX. Un `.collect()` sur toute la table
      // `parentLinkCodes` grandirait avec chaque école du déploiement, ce que
      // les consignes Convex du dépôt interdisent — et la borne manquerait
      // le jour où elle compterait.
      const code = row.studentId
        ? await ctx.db
            .query("parentLinkCodes")
            .withIndex("by_student", (q) => q.eq("studentId", row.studentId!))
            .first()
        : null;

      out.push({
        name: row.name,
        status: row.status,
        loginCode: row.loginCode ?? null,
        failureReason: row.failureReason ?? null,
        parentCode: code?.code ?? null,
      });
    }
    return out;
  },
});

/**
 * Crée l'école de test entière et rend tous les identifiants.
 *
 * L'ordre importe : l'école et ses classes d'abord, le directeur ensuite
 * (l'import a besoin de son profil comme auteur), les professeurs, puis les
 * élèves par le pipeline d'import.
 */
type SeededStaff = {
  email: string;
  name: string;
  role: "directeur" | "professeur";
  profileId: Id<"profiles">;
};

type SeededStudent = {
  name: string;
  status: string;
  loginCode: string | null;
  failureReason: string | null;
  parentCode: string | null;
};

export type SeedResult = {
  school: string;
  schoolId: Id<"schools">;
  motDePasseDuPersonnel: string;
  directeur: { nom: string; email: string };
  professeurs: { nom: string; email: string }[];
  eleves: SeededStudent[];
  note: string;
};

// LES ANNOTATIONS DE TYPE CI-DESSOUS NE SONT PAS DU CONFORT. Une action qui
// appelle ses propres mutations par `internal.*` se référence indirectement
// elle-même : TypeScript ne peut pas inférer son retour et abandonne en
// `any` (TS7022/TS7023). Les consignes Convex du dépôt le disent — un
// `handler` d'action annote son retour.
export const seedTestSchool = internalAction({
  args: { confirmDeployment: v.string() },
  handler: async (ctx, args): Promise<SeedResult> => {
    assertTargetedDeployment(args.confirmDeployment);

    const suffix = new Date().toISOString().slice(0, 16).replace("T", " ");

    const { schoolId, classIds }: {
      schoolId: Id<"schools">;
      classIds: Id<"schoolClasses">[];
    } = await ctx.runMutation(internal.testSeedsSchool.createSchoolShell, {
      suffix,
    });

    async function provision(
      name: string,
      email: string,
      role: "directeur" | "professeur",
      schoolClassId?: Id<"schoolClasses">,
    ): Promise<SeededStaff> {
      // L'adresse porte le suffixe : relancer le script ne doit pas buter sur
      // un compte déjà pris, et chaque jeu de test garde ses propres accès.
      const unique = email.replace("@", `+${suffix.replace(/\D/g, "")}@`);
      const { user } = await createAccount(ctx, {
        provider: "password",
        account: { id: unique, secret: STAFF_PASSWORD },
        profile: { email: unique, name, role } as unknown as Parameters<
          typeof createAccount
        >[1]["profile"],
      });
      const profileId: Id<"profiles"> = await ctx.runMutation(
        internal.testSeedsSchool.attachSeededStaff,
        { schoolId, staffUserId: user._id, staffRole: role, schoolClassId },
      );
      return { email: unique, name, role, profileId };
    }

    const director = await provision(
      DIRECTOR.name,
      DIRECTOR.email,
      "directeur",
    );

    const teachers: SeededStaff[] = [];
    for (const t of TEACHERS) {
      teachers.push(
        await provision(t.name, t.email, "professeur", classIds[t.classIndex]),
      );
    }

    const jobId: Id<"studentImportJobs"> = await ctx.runMutation(
      internal.testSeedsSchool.openSeededImport,
      {
        schoolId,
        directorProfileId: director.profileId,
        rows: STUDENTS.map((s) => ({
          name: s.name,
          schoolClassId: classIds[s.classIndex],
        })),
      },
    );

    // Appel DIRECT et non planifié : une action lancée depuis la ligne de
    // commande doit rendre les identifiants, pas une promesse de les avoir
    // écrits quelque part. `processBatch` se replanifie seul au-delà d'un lot,
    // mais huit élèves tiennent dans le premier.
    await ctx.runAction(internal.studentImportRun.processBatch, { jobId });

    const students: SeededStudent[] = await ctx.runQuery(
      internal.testSeedsSchool.seededCredentials,
      { jobId },
    );

    return {
      school: `${SCHOOL_NAME} ${suffix}`,
      schoolId,
      motDePasseDuPersonnel: STAFF_PASSWORD,
      directeur: { nom: director.name, email: director.email },
      professeurs: teachers.map((t) => ({ nom: t.name, email: t.email })),
      eleves: students,
      note:
        "L'élève se connecte avec son code de connexion, saisi à la fois " +
        "comme identifiant et comme mot de passe. Le parent active son " +
        "espace sur /register avec le code parent.",
    };
  },
});
