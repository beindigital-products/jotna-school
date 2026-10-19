import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { visibleClassValidator } from "./curriculum";
import { normalizeCode } from "./importCodes";
import { cleanClassLabel, cleanName } from "./openAccessRules";
import {
  activeStaffRows,
  activeStudentCount,
  callerProfileOrNull,
  classExists,
  CLASSES_LIMIT,
  directedSchool,
  drawSchoolJoinCode,
} from "./classroomHelpers";

// ---------------------------------------------------------------------------
// L'ESPACE ÉCOLE — le compte `directeur`, accès libre.
//
// Une école crée son compte, puis son école (nom, ville). Elle reçoit un CODE
// ÉCOLE à partager avec ses professeurs, qui le saisissent dans leur espace
// (`classrooms.joinSchoolWithCode`). Elle voit ses professeurs et ses classes,
// crée des classes et les confie à un professeur. Les élèves, eux, sont
// ajoutés par les professeurs dans leurs classes.
// ---------------------------------------------------------------------------

/** Professeurs lus pour une école. */
const STAFF_LIMIT = 100;

async function requireDirecteur(ctx: MutationCtx): Promise<{
  profile: Doc<"profiles">;
  school: Doc<"schools">;
}> {
  const profile = await callerProfileOrNull(ctx);
  if (!profile || profile.role !== "directeur") {
    throw new ConvexError("Cet espace est réservé aux écoles.");
  }
  const school = await directedSchool(ctx, profile._id);
  if (!school) throw new ConvexError("Créez d'abord votre école.");
  return { profile, school };
}

/** L'école du directeur connecté, ses professeurs et ses classes. */
export const mySchool = query({
  args: {},
  handler: async (ctx) => {
    const profile = await callerProfileOrNull(ctx);
    if (!profile || profile.role !== "directeur") return null;

    const school = await directedSchool(ctx, profile._id);
    if (!school) return { school: null, teachers: [], classes: [] };

    const staff = await ctx.db
      .query("schoolStaff")
      .withIndex("by_school", (q) => q.eq("schoolId", school._id))
      .take(STAFF_LIMIT);

    const teachers = [];
    for (const row of staff) {
      if (row.status !== "active" || row.staffRole !== "professeur") continue;
      const teacher = await ctx.db.get(row.profileId);
      if (!teacher) continue;
      const user = await ctx.db.get(teacher.userId as Id<"users">);
      teachers.push({
        profileId: teacher._id,
        name: teacher.name,
        email: user?.email ?? null,
      });
    }
    teachers.sort((a, b) => a.name.localeCompare(b.name, "fr"));

    const classDocs = await ctx.db
      .query("schoolClasses")
      .withIndex("by_school", (q) => q.eq("schoolId", school._id))
      .take(CLASSES_LIMIT);
    const nameOf = new Map<string, string>(
      teachers.map((t) => [t.profileId as string, t.name]),
    );
    nameOf.set(profile._id, profile.name);

    const classes = await Promise.all(
      classDocs.map(async (c) => ({
        _id: c._id,
        class: c.class,
        label: c.label,
        teacherId: c.teacherId ?? null,
        teacherName: c.teacherId ? nameOf.get(c.teacherId) ?? null : null,
        studentCount: await activeStudentCount(ctx, c._id),
      })),
    );
    classes.sort((a, b) =>
      `${a.class} ${a.label}`.localeCompare(`${b.class} ${b.label}`, "fr"),
    );

    return {
      school: {
        _id: school._id,
        name: school.name,
        city: school.city ?? null,
        joinCode: school.joinCode ? school.joinCode.toUpperCase() : null,
      },
      teachers,
      classes,
    };
  },
});

/** Crée l'école du directeur connecté. Une seule par compte. */
export const createMySchool = mutation({
  args: { name: v.string(), city: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const profile = await callerProfileOrNull(ctx);
    if (!profile || profile.role !== "directeur") {
      throw new ConvexError("Seul un compte école peut créer une école.");
    }
    if (await directedSchool(ctx, profile._id)) {
      throw new ConvexError("Votre école existe déjà.");
    }
    const name = cleanName(args.name);
    if (name === null) throw new ConvexError("Saisissez le nom de l'école.");
    const city = args.city ? cleanName(args.city) : null;

    const user = await ctx.db.get(profile.userId as Id<"users">);
    const joinCode = await drawSchoolJoinCode(ctx);
    const schoolId = await ctx.db.insert("schools", {
      name,
      city: city ?? undefined,
      contactName: profile.name,
      contactEmail: user?.email ?? "",
      status: "active",
      createdAt: Date.now(),
      ownerProfileId: profile._id,
      joinCode: normalizeCode(joinCode),
    });
    await ctx.db.insert("schoolStaff", {
      schoolId,
      profileId: profile._id,
      staffRole: "directeur",
      status: "active",
    });
    return { schoolId, joinCode };
  },
});

/** Change le code école : l'ancien ne marche plus. */
export const regenerateJoinCode = mutation({
  args: {},
  handler: async (ctx) => {
    const { school } = await requireDirecteur(ctx);
    const joinCode = await drawSchoolJoinCode(ctx);
    await ctx.db.patch(school._id, { joinCode: normalizeCode(joinCode) });
    return joinCode;
  },
});

/** Vérifie qu'un professeur fait partie de l'école (ou est le directeur). */
async function assertTeacherOf(
  ctx: MutationCtx,
  school: Doc<"schools">,
  teacherId: Id<"profiles">,
): Promise<void> {
  const rows = await activeStaffRows(ctx, teacherId);
  if (!rows.some((row) => row.schoolId === school._id)) {
    throw new ConvexError("Ce professeur ne fait pas partie de votre école.");
  }
}

/** Crée une classe dans l'école, confiée ou non à un professeur. */
export const createSchoolClass = mutation({
  args: {
    class: visibleClassValidator,
    label: v.string(),
    teacherId: v.optional(v.id("profiles")),
  },
  handler: async (ctx, args) => {
    const { school } = await requireDirecteur(ctx);
    const label = cleanClassLabel(args.label);
    if (label === null) {
      throw new ConvexError("Le nom de la classe dépasse 30 caractères.");
    }
    if (await classExists(ctx, school._id, args.class, label)) {
      throw new ConvexError(
        `La classe ${args.class} ${label} existe déjà. Choisissez un autre nom.`,
      );
    }
    if (args.teacherId) await assertTeacherOf(ctx, school, args.teacherId);
    return await ctx.db.insert("schoolClasses", {
      schoolId: school._id,
      class: args.class,
      label,
      teacherId: args.teacherId,
    });
  },
});

/** Confie une classe à un professeur de l'école, ou la lui retire. */
export const assignClassTeacher = mutation({
  args: {
    schoolClassId: v.id("schoolClasses"),
    teacherId: v.optional(v.id("profiles")),
  },
  handler: async (ctx, args) => {
    const { school } = await requireDirecteur(ctx);
    const schoolClass = await ctx.db.get(args.schoolClassId);
    if (!schoolClass || schoolClass.schoolId !== school._id) {
      throw new ConvexError("Classe introuvable.");
    }
    if (args.teacherId) await assertTeacherOf(ctx, school, args.teacherId);
    await ctx.db.patch(schoolClass._id, { teacherId: args.teacherId });
    return null;
  },
});

/**
 * Retire un professeur de l'école. Ses classes restent dans l'école, sans
 * professeur, avec leurs élèves : la direction les confie à quelqu'un d'autre.
 */
export const removeTeacher = mutation({
  args: { profileId: v.id("profiles") },
  handler: async (ctx, args) => {
    const { school, profile } = await requireDirecteur(ctx);
    if (args.profileId === profile._id) {
      throw new ConvexError("Vous ne pouvez pas vous retirer vous-même.");
    }
    const rows = await activeStaffRows(ctx, args.profileId);
    const row = rows.find((r) => r.schoolId === school._id);
    if (!row) return null;
    await ctx.db.patch(row._id, { status: "removed" });

    const classes = await ctx.db
      .query("schoolClasses")
      .withIndex("by_school", (q) => q.eq("schoolId", school._id))
      .take(CLASSES_LIMIT);
    for (const c of classes) {
      if (c.teacherId === args.profileId) {
        await ctx.db.patch(c._id, { teacherId: undefined });
      }
    }
    return null;
  },
});
