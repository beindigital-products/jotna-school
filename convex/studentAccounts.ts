import { ConvexError, v } from "convex/values";
import { action, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { createAccount } from "@convex-dev/auth/server";
import type { Id } from "./_generated/dataModel";
import { visibleClassValidator } from "./curriculum";
import { normalizeCode } from "./importCodes";
import { buildChildLoginCode, cleanName } from "./openAccessRules";
import { secureRandomInt } from "./secureRandom";
import {
  activeStudentCount,
  callerProfileOrNull,
  canManageClass,
  CHILDREN_LIMIT,
  CLASS_STUDENTS_LIMIT,
  ensureStudentCodeFor,
  placeStudentInClass,
} from "./classroomHelpers";

// ---------------------------------------------------------------------------
// CRÉATION D'UN COMPTE ÉLÈVE PAR UN ADULTE — accès libre.
//
// Deux portes, une seule fonction :
//
// - un PARENT crée le compte de son enfant en choisissant son niveau. Un lien
//   `studentGuardians` (relation `parent`) est posé ;
// - un PROFESSEUR (ou le directeur de l'école) crée le compte dans une de ses
//   classes. L'enfant y est inscrit, et son niveau est celui de la classe.
//
// LE COMPTE SUIT LE MODÈLE DE L'IMPORT (`studentImportRun.ts`) : identifiant
// = code de connexion en minuscules, mot de passe = ce même code tel
// qu'imprimé. Un enfant ne retient pas deux secrets. Seul le préfixe change :
// le prénom au lieu de la classe (`openAccessRules.buildChildLoginCode`).
//
// UNE ACTION, PARCE QUE `createAccount` N'EXISTE QUE LÀ. Elle n'est donc pas
// transactionnelle : la mutation finale revérifie le droit de l'appelant. Si
// elle échoue, il reste un compte sans profil rattaché à personne, sans accès
// ni code élève : un déchet inerte, comme dans l'import.
// ---------------------------------------------------------------------------

/** Essais à quatre chiffres, puis à six, avant d'abandonner. */
const SHORT_ATTEMPTS = 8;
const LONG_ATTEMPTS = 6;

type Rights =
  | { ok: true; level: string }
  | { ok: false; message: string };

/**
 * L'appelant peut-il créer ce compte ? Lecture seule ; la mutation refait le
 * même contrôle avant d'écrire.
 */
export const creationRights = internalQuery({
  args: {
    level: v.optional(visibleClassValidator),
    schoolClassId: v.optional(v.id("schoolClasses")),
  },
  handler: async (ctx, args): Promise<Rights> => {
    const profile = await callerProfileOrNull(ctx);
    if (!profile) return { ok: false, message: "Connectez-vous pour continuer." };

    if (args.schoolClassId) {
      const schoolClass = await ctx.db.get(args.schoolClassId);
      if (!schoolClass || !(await canManageClass(ctx, profile, schoolClass))) {
        return { ok: false, message: "Classe introuvable." };
      }
      if ((await activeStudentCount(ctx, schoolClass._id)) >= CLASS_STUDENTS_LIMIT) {
        return {
          ok: false,
          message: `Cette classe compte déjà ${CLASS_STUDENTS_LIMIT} élèves. Créez une autre classe.`,
        };
      }
      return { ok: true, level: schoolClass.class };
    }

    if (profile.role !== "parent") {
      return {
        ok: false,
        message: "Créez le compte depuis une de vos classes.",
      };
    }
    if (!args.level) {
      return { ok: false, message: "Choisissez la classe de votre enfant." };
    }
    const links = await ctx.db
      .query("studentGuardians")
      .withIndex("by_guardianId", (q) => q.eq("guardianId", profile._id))
      .take(CHILDREN_LIMIT);
    if (links.length >= CHILDREN_LIMIT) {
      return { ok: false, message: "Vous avez atteint le nombre maximum d'enfants." };
    }
    return { ok: true, level: args.level };
  },
});

/** Ce code de connexion (normalisé) est-il déjà un identifiant ? */
export const loginCodeTaken = internalQuery({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.code))
      .first();
    return existing !== null;
  },
});

/**
 * Rattache le compte tout juste créé : niveau, code élève, et lien avec le
 * parent ou inscription dans la classe. Revérifie le droit de l'appelant.
 */
export const attachNewStudent = internalMutation({
  args: {
    userId: v.id("users"),
    level: v.optional(visibleClassValidator),
    schoolClassId: v.optional(v.id("schoolClasses")),
  },
  handler: async (ctx, args) => {
    const caller = await callerProfileOrNull(ctx);
    if (!caller) throw new ConvexError("Connectez-vous pour continuer.");

    const student = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();
    if (!student || student.role !== "student") {
      throw new ConvexError("Le compte élève n'a pas pu être finalisé.");
    }

    if (args.schoolClassId) {
      const schoolClass = await ctx.db.get(args.schoolClassId);
      if (!schoolClass || !(await canManageClass(ctx, caller, schoolClass))) {
        throw new ConvexError("Classe introuvable.");
      }
      await placeStudentInClass(ctx, {
        student,
        schoolClass,
        actorProfileId: caller._id,
      });
    } else {
      if (caller.role !== "parent" || !args.level) {
        throw new ConvexError("Choisissez la classe de votre enfant.");
      }
      await ctx.db.patch(student._id, { class: args.level });
      await ctx.db.insert("studentGuardians", {
        studentId: student._id,
        guardianId: caller._id,
        relation: "parent",
      });
    }

    const fresh = (await ctx.db.get(student._id)) ?? student;
    const studentCode = await ensureStudentCodeFor(ctx, fresh);
    return { studentId: student._id, studentCode };
  },
});

/**
 * Crée un compte élève. Rend le code de connexion EN CLAIR, à remettre à
 * l'enfant : c'est son identifiant et son mot de passe dans l'application.
 */
export const createStudent = action({
  args: {
    name: v.string(),
    level: v.optional(visibleClassValidator),
    schoolClassId: v.optional(v.id("schoolClasses")),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{
    studentId: Id<"profiles">;
    name: string;
    loginCode: string;
    studentCode: string;
  }> => {
    const name = cleanName(args.name);
    if (name === null) {
      throw new ConvexError("Saisissez le prénom et le nom de l'enfant.");
    }

    const rights = await ctx.runQuery(internal.studentAccounts.creationRights, {
      level: args.level,
      schoolClassId: args.schoolClassId,
    });
    if (!rights.ok) throw new ConvexError(rights.message);

    let loginCode: string | null = null;
    for (let i = 0; i < SHORT_ATTEMPTS + LONG_ATTEMPTS && !loginCode; i++) {
      const candidate = buildChildLoginCode(
        name,
        secureRandomInt,
        i < SHORT_ATTEMPTS ? 4 : 6,
      );
      const taken = await ctx.runQuery(internal.studentAccounts.loginCodeTaken, {
        code: normalizeCode(candidate),
      });
      if (!taken) loginCode = candidate;
    }
    if (!loginCode) {
      throw new ConvexError("Aucun code de connexion libre. Réessayez.");
    }

    // Identifiant en minuscules (la connexion passe par `profile()`, qui met
    // en minuscules), secret tel qu'imprimé. Voir `importCodes.normalizeCode`.
    const normalized = normalizeCode(loginCode);
    const { user } = await createAccount(ctx, {
      provider: "password",
      account: { id: normalized, secret: loginCode },
      profile: {
        email: normalized,
        name,
        role: "student",
      } as unknown as Parameters<typeof createAccount>[1]["profile"],
    });

    const attached = await ctx.runMutation(
      internal.studentAccounts.attachNewStudent,
      {
        userId: user._id,
        level: args.schoolClassId ? undefined : args.level,
        schoolClassId: args.schoolClassId,
      },
    );

    return {
      studentId: attached.studentId,
      name,
      loginCode,
      studentCode: attached.studentCode,
    };
  },
});
