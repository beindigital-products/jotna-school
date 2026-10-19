import { ConvexError, v } from "convex/values";
import { action, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { createAccount } from "@convex-dev/auth/server";
import { callerIsAdmin } from "./access";

// ---------------------------------------------------------------------------
// CRÉATION DES COMPTES DU PERSONNEL — directeur et professeur.
//
// POURQUOI CE MODULE EXISTE MAINTENANT. Jotna est vendu aux écoles : c'est
// l'équipe qui ouvre un établissement, pas l'établissement qui s'inscrit.
// Jusqu'ici ces deux rôles se posaient « hors de l'application », à la main
// sur le déploiement — tenable quand personne n'avait encore vendu, intenable
// dès la deuxième école. `schools.addStaff` ne comble pas le trou : il exige
// `profile.role === staffRole` et RATTACHE un profil existant, il ne le crée
// pas. Il fallait donc un chemin qui crée.
//
// `callerIsAdmin` ET RIEN D'AUTRE. Créer un directeur, c'est donner la main
// sur une école entière et sur les dossiers de ses élèves. La garde est la
// même que celle de `schools.createSchool`, et pour la même raison.
//
// `admin` N'EST PAS PROVISIONNABLE ICI, et `decideProvisionedRole` le refuse
// de toute façon : l'argument `staffRole` ne propose que les deux rôles
// d'école. Un administrateur qui en fabrique un autre transformerait une
// compromission de compte en compromission de plateforme.
//
// LE MOT DE PASSE EST CHOISI PAR L'APPELANT, pas engendré ici. L'équipe le
// transmet à l'école par le canal qu'elle juge bon, et la personne le change
// ensuite par « mot de passe oublié » — un directeur a une vraie adresse de
// courriel, contrairement à un élève à code. Engendrer un secret ici
// obligerait à l'afficher, donc à le journaliser quelque part.
// ---------------------------------------------------------------------------

/** Rattachements lus pour un profil : une personne sert une ou deux écoles. */
const STAFF_PER_PROFILE_LIMIT = 20;

/**
 * L'appelant est-il administrateur ?
 *
 * Une action ne porte pas de `QueryCtx`, donc elle ne peut pas appeler
 * `callerIsAdmin` elle-même. L'identité de la session traverse `ctx.runQuery`,
 * ce détour ne l'affaiblit donc pas.
 */
export const callerIsAdminCheck = internalQuery({
  args: {},
  handler: async (ctx) => await callerIsAdmin(ctx),
});

/**
 * Rattache à son école le profil qu'on vient de créer.
 *
 * Reprend la logique de `schools.addStaff` — même table, même idempotence —
 * mais part de `userId` : le profil vient d'être inséré par
 * `createOrUpdateUser`, et l'action qui appelle ici n'a que l'identifiant
 * d'utilisateur rendu par `createAccount`.
 */
export const attachProvisionedStaff = internalMutation({
  args: {
    schoolId: v.id("schools"),
    staffUserId: v.id("users"),
    staffRole: v.union(v.literal("directeur"), v.literal("professeur")),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.staffUserId))
      .unique();
    if (!profile) throw new ConvexError("Profil introuvable");

    const existing = await ctx.db
      .query("schoolStaff")
      .withIndex("by_profile", (q) => q.eq("profileId", profile._id))
      .take(STAFF_PER_PROFILE_LIMIT);
    const row = existing.find((r) => r.schoolId === args.schoolId);

    if (row) {
      await ctx.db.patch(row._id, {
        staffRole: args.staffRole,
        status: "active",
      });
      return { profileId: profile._id, staffId: row._id };
    }

    const staffId = await ctx.db.insert("schoolStaff", {
      schoolId: args.schoolId,
      profileId: profile._id,
      staffRole: args.staffRole,
      status: "active",
    });
    return { profileId: profile._id, staffId };
  },
});

/** L'école existe-t-elle ? Lue avant de créer un compte qui la nommerait. */
export const schoolExists = internalQuery({
  args: { schoolId: v.id("schools") },
  handler: async (ctx, args) => (await ctx.db.get(args.schoolId)) !== null,
});

/**
 * Crée le compte d'un directeur ou d'un professeur, et le rattache à l'école.
 *
 * L'ORDRE EST IMPOSÉ : `createAccount` n'existe que dans une `action`, et une
 * action ne porte pas de transaction. Le compte naît d'abord, le rattachement
 * suit. Si le rattachement échoue, le compte existe sans école — il ne voit
 * alors aucun élève, et `schools.addStaff` le rattache après coup depuis le
 * back-office. On vérifie donc l'école AVANT de créer, pour que ce cas reste
 * théorique.
 */
export const provisionStaffAccount = action({
  args: {
    schoolId: v.id("schools"),
    name: v.string(),
    email: v.string(),
    password: v.string(),
    staffRole: v.union(v.literal("directeur"), v.literal("professeur")),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ profileId: string; staffId: string }> => {
    if (!(await ctx.runQuery(internal.staffAccounts.callerIsAdminCheck, {}))) {
      throw new ConvexError("Rôle non autorisé");
    }

    const name = args.name.trim();
    if (name === "") throw new ConvexError("Le nom est obligatoire.");

    const email = args.email.trim().toLowerCase();
    if (email === "") {
      throw new ConvexError("L'adresse de courriel est obligatoire.");
    }
    if (args.password.length < 6) {
      throw new ConvexError(
        "Le mot de passe doit contenir au moins 6 caractères.",
      );
    }

    if (
      !(await ctx.runQuery(internal.staffAccounts.schoolExists, {
        schoolId: args.schoolId,
      }))
    ) {
      throw new ConvexError("École introuvable");
    }

    let user;
    try {
      ({ user } = await createAccount(ctx, {
        provider: "password",
        account: { id: email, secret: args.password },
        profile: {
          email,
          name,
          role: args.staffRole,
        } as unknown as Parameters<typeof createAccount>[1]["profile"],
      }));
    } catch {
      // Comme pour `parentLink.signUpWithCode` : l'adresse déjà prise est la
      // seule cause que la personne devant l'écran peut corriger. Un compte
      // qui existe déjà se rattache par `schools.addStaff`.
      throw new ConvexError(
        "Cette adresse est déjà utilisée. Si la personne a déjà un compte, " +
          "rattachez-la depuis la fiche de l'école.",
      );
    }

    return await ctx.runMutation(
      internal.staffAccounts.attachProvisionedStaff,
      {
        schoolId: args.schoolId,
        staffUserId: user._id,
        staffRole: args.staffRole,
      },
    );
  },
});
