import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { visibleClassValidator } from "./curriculum";
import { normalizeCode } from "./importCodes";
import {
  callerProfileOrNull,
  canManageClass,
  CHILDREN_LIMIT,
  drawStudentCode,
  ensureStudentCodeFor,
  loginCodeOf,
} from "./classroomHelpers";

// ---------------------------------------------------------------------------
// L'ESPACE FAMILLE — accès libre (`convex/openAccessRules.ts`).
//
// Un parent voit, pour chaque enfant : son niveau, sa classe s'il en a une,
// son CODE DE CONNEXION (à donner à l'enfant pour l'application) et son CODE
// ÉLÈVE (à donner au professeur pour rejoindre sa classe). La création du
// compte d'un enfant est dans `studentAccounts.createStudent`.
// ---------------------------------------------------------------------------

/** Vrai si ce profil porte un lien de tutelle vers cet élève. */
async function isGuardianOf(
  ctx: QueryCtx | MutationCtx,
  guardianId: Id<"profiles">,
  studentId: Id<"profiles">,
): Promise<boolean> {
  const links = await ctx.db
    .query("studentGuardians")
    .withIndex("by_studentId", (q) => q.eq("studentId", studentId))
    .take(20);
  return links.some((l) => l.guardianId === guardianId);
}

/** Les enfants du parent connecté, avec ce qu'il doit savoir de chacun. */
export const myChildren = query({
  args: {},
  handler: async (ctx) => {
    const profile = await callerProfileOrNull(ctx);
    if (!profile) return null;

    const links = await ctx.db
      .query("studentGuardians")
      .withIndex("by_guardianId", (q) => q.eq("guardianId", profile._id))
      .take(CHILDREN_LIMIT);

    const children = [];
    for (const link of links) {
      const student = await ctx.db.get(link.studentId);
      if (!student || student.role !== "student") continue;

      const membership = await ctx.db
        .query("schoolMemberships")
        .withIndex("by_student_status", (q) =>
          q.eq("studentId", student._id).eq("status", "active"),
        )
        .first();

      let classroom: {
        name: string;
        teacherName: string | null;
        schoolName: string | null;
      } | null = null;
      if (membership) {
        const schoolClass = await ctx.db.get(membership.schoolClassId);
        if (schoolClass) {
          const [teacher, school] = await Promise.all([
            schoolClass.teacherId ? ctx.db.get(schoolClass.teacherId) : null,
            ctx.db.get(schoolClass.schoolId),
          ]);
          classroom = {
            name: `${schoolClass.class} ${schoolClass.label}`,
            teacherName: teacher?.name ?? null,
            schoolName:
              school && school.kind !== "personal" ? school.name : null,
          };
        }
      }

      children.push({
        _id: student._id,
        name: student.name,
        avatar: student.avatar ?? null,
        level: student.class ?? null,
        loginCode: await loginCodeOf(ctx, student),
        studentCode: student.studentCode
          ? student.studentCode.toUpperCase()
          : null,
        classroom,
      });
    }

    children.sort((a, b) => a.name.localeCompare(b.name, "fr"));
    return children;
  },
});

/**
 * Pose le code élève d'un enfant qui n'en a pas encore (compte créé avant
 * l'accès libre, par l'import d'une école). Le parent ou un adulte qui gère
 * sa classe peut le demander.
 */
export const ensureStudentCode = mutation({
  args: { studentId: v.id("profiles") },
  handler: async (ctx, args): Promise<string> => {
    const caller = await callerProfileOrNull(ctx);
    if (!caller) throw new ConvexError("Connectez-vous pour continuer.");
    const student = await ctx.db.get(args.studentId);
    if (!student || student.role !== "student") {
      throw new ConvexError("Enfant introuvable.");
    }
    if (!(await mayHandle(ctx, caller, student))) {
      throw new ConvexError("Enfant introuvable.");
    }
    return await ensureStudentCodeFor(ctx, student);
  },
});

/**
 * Remplace le code élève. L'ancien ne marche plus : à utiliser si le code a
 * circulé plus loin que prévu. Parent seulement.
 */
export const regenerateStudentCode = mutation({
  args: { studentId: v.id("profiles") },
  handler: async (ctx, args): Promise<string> => {
    const caller = await callerProfileOrNull(ctx);
    if (!caller) throw new ConvexError("Connectez-vous pour continuer.");
    if (!(await isGuardianOf(ctx, caller._id, args.studentId))) {
      throw new ConvexError("Enfant introuvable.");
    }
    const code = await drawStudentCode(ctx);
    await ctx.db.patch(args.studentId, { studentCode: normalizeCode(code) });
    return code;
  },
});

/**
 * Change le niveau d'un enfant qui n'est dans aucune classe. Dans une classe,
 * c'est la classe qui fixe le niveau : le parent ne peut pas le contredire.
 */
export const setChildLevel = mutation({
  args: { studentId: v.id("profiles"), level: visibleClassValidator },
  handler: async (ctx, args) => {
    const caller = await callerProfileOrNull(ctx);
    if (!caller) throw new ConvexError("Connectez-vous pour continuer.");
    if (!(await isGuardianOf(ctx, caller._id, args.studentId))) {
      throw new ConvexError("Enfant introuvable.");
    }
    const membership = await ctx.db
      .query("schoolMemberships")
      .withIndex("by_student_status", (q) =>
        q.eq("studentId", args.studentId).eq("status", "active"),
      )
      .first();
    if (membership) {
      throw new ConvexError(
        "Votre enfant est dans une classe : c'est son professeur qui fixe son niveau.",
      );
    }
    await ctx.db.patch(args.studentId, { class: args.level });
    return null;
  },
});

/** Le parent de l'enfant, ou un adulte qui gère sa classe active. */
async function mayHandle(
  ctx: MutationCtx,
  caller: Doc<"profiles">,
  student: Doc<"profiles">,
): Promise<boolean> {
  if (caller.role === "admin") return true;
  if (await isGuardianOf(ctx, caller._id, student._id)) return true;
  const memberships = await ctx.db
    .query("schoolMemberships")
    .withIndex("by_student_status", (q) =>
      q.eq("studentId", student._id).eq("status", "active"),
    )
    .take(4);
  for (const m of memberships) {
    const schoolClass = await ctx.db.get(m.schoolClassId);
    if (schoolClass && (await canManageClass(ctx, caller, schoolClass))) {
      return true;
    }
  }
  return false;
}
