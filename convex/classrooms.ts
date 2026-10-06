import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { visibleClassValidator } from "./curriculum";
import { normalizeCode } from "./importCodes";
import { cleanClassLabel } from "./openAccessRules";
import {
  activeStaffRows,
  activeStudentCount,
  callerProfileOrNull,
  canManageClass,
  classExists,
  CLASS_STUDENTS_LIMIT,
  CLASSES_LIMIT,
  ensurePersonalSchool,
  loginCodeOf,
  personalSchoolOf,
  placeStudentInClass,
} from "./classroomHelpers";

// ---------------------------------------------------------------------------
// LES CLASSES D'UN PROFESSEUR — accès libre (`convex/openAccessRules.ts`).
//
// Un professeur crée ses classes, y crée des comptes élèves
// (`studentAccounts.createStudent`) ou y ajoute un enfant existant avec le
// CODE ÉLÈVE que lui donne la famille. Seul, ses classes vivent dans son
// espace personnel ; avec le CODE ÉCOLE, il rejoint une école et ses classes
// y passent.
//
// TOUTES LES GARDES SONT DES GARDES DE LIEN : être le professeur de CETTE
// classe, ou le directeur de SON école (`classroomHelpers.canManageClass`).
// Le rôle seul n'autorise rien, puisque n'importe qui peut désormais
// s'inscrire comme professeur.
// ---------------------------------------------------------------------------

const TEACHING_ROLES = new Set(["professeur", "directeur", "admin"]);

async function requireTeacher(
  ctx: Parameters<typeof callerProfileOrNull>[0],
): Promise<Doc<"profiles">> {
  const profile = await callerProfileOrNull(ctx);
  if (!profile) throw new ConvexError("Connectez-vous pour continuer.");
  if (!TEACHING_ROLES.has(profile.role)) {
    throw new ConvexError("Cet espace est réservé aux professeurs.");
  }
  return profile;
}

/**
 * Les classes du professeur connecté, et les écoles dont il fait partie.
 *
 * Une classe d'espace personnel rend `schoolName: null` : l'écran n'affiche
 * pas d'école quand il n'y en a pas.
 */
export const myClasses = query({
  args: {},
  handler: async (ctx) => {
    const profile = await callerProfileOrNull(ctx);
    if (!profile || !TEACHING_ROLES.has(profile.role)) return null;

    const classes = await ctx.db
      .query("schoolClasses")
      .withIndex("by_teacher", (q) => q.eq("teacherId", profile._id))
      .take(CLASSES_LIMIT);

    const schoolCache = new Map<string, Doc<"schools"> | null>();
    const schoolOf = async (id: Id<"schools">) => {
      if (!schoolCache.has(id)) schoolCache.set(id, await ctx.db.get(id));
      return schoolCache.get(id) ?? null;
    };

    const rows = await Promise.all(
      classes.map(async (c) => {
        const school = await schoolOf(c.schoolId);
        return {
          _id: c._id,
          class: c.class,
          label: c.label,
          schoolName:
            school && school.kind !== "personal" ? school.name : null,
          studentCount: await activeStudentCount(ctx, c._id),
        };
      }),
    );
    rows.sort((a, b) =>
      `${a.class} ${a.label}`.localeCompare(`${b.class} ${b.label}`, "fr"),
    );

    const staff = await activeStaffRows(ctx, profile._id);
    const schools: { _id: Id<"schools">; name: string; role: string }[] = [];
    for (const row of staff) {
      const school = await schoolOf(row.schoolId);
      if (school && school.kind !== "personal") {
        schools.push({ _id: school._id, name: school.name, role: row.staffRole });
      }
    }

    return { classes: rows, schools };
  },
});

/**
 * Crée une classe pour le professeur connecté.
 *
 * OÙ VA LA CLASSE : dans l'école demandée (s'il en fait partie), sinon dans
 * sa première école, sinon dans son espace personnel.
 */
export const createMyClass = mutation({
  args: {
    class: visibleClassValidator,
    label: v.string(),
    schoolId: v.optional(v.id("schools")),
  },
  handler: async (ctx, args) => {
    const profile = await requireTeacher(ctx);

    const label = cleanClassLabel(args.label);
    if (label === null) {
      throw new ConvexError("Le nom de la classe dépasse 30 caractères.");
    }

    const staff = await activeStaffRows(ctx, profile._id);
    let schoolId: Id<"schools">;
    if (args.schoolId) {
      if (!staff.some((row) => row.schoolId === args.schoolId)) {
        throw new ConvexError("Vous ne faites pas partie de cette école.");
      }
      schoolId = args.schoolId;
    } else {
      let firstReal: Id<"schools"> | null = null;
      for (const row of staff) {
        const school = await ctx.db.get(row.schoolId);
        if (school && school.kind !== "personal") {
          firstReal = school._id;
          break;
        }
      }
      schoolId = firstReal ?? (await ensurePersonalSchool(ctx, profile));
    }

    if (await classExists(ctx, schoolId, args.class, label)) {
      throw new ConvexError(
        `La classe ${args.class} ${label} existe déjà. Choisissez un autre nom.`,
      );
    }

    return await ctx.db.insert("schoolClasses", {
      schoolId,
      class: args.class,
      label,
      teacherId: profile._id,
    });
  },
});

/** Renomme une classe ou change son niveau. Le niveau des élèves suit. */
export const updateClass = mutation({
  args: {
    schoolClassId: v.id("schoolClasses"),
    class: visibleClassValidator,
    label: v.string(),
  },
  handler: async (ctx, args) => {
    const profile = await requireTeacher(ctx);
    const schoolClass = await ctx.db.get(args.schoolClassId);
    if (!schoolClass || !(await canManageClass(ctx, profile, schoolClass))) {
      throw new ConvexError("Classe introuvable.");
    }
    const label = cleanClassLabel(args.label);
    if (label === null) {
      throw new ConvexError("Le nom de la classe dépasse 30 caractères.");
    }
    const unchanged =
      schoolClass.class === args.class &&
      schoolClass.label.toLowerCase() === label.toLowerCase();
    if (
      !unchanged &&
      (await classExists(ctx, schoolClass.schoolId, args.class, label))
    ) {
      throw new ConvexError(
        `La classe ${args.class} ${label} existe déjà. Choisissez un autre nom.`,
      );
    }
    await ctx.db.patch(schoolClass._id, { class: args.class, label });

    if (schoolClass.class !== args.class) {
      const memberships = await ctx.db
        .query("schoolMemberships")
        .withIndex("by_class_status", (q) =>
          q.eq("schoolClassId", schoolClass._id).eq("status", "active"),
        )
        .take(CLASS_STUDENTS_LIMIT);
      for (const m of memberships) {
        await ctx.db.patch(m.studentId, { class: args.class });
      }
    }
    return null;
  },
});

/**
 * Une classe et ses élèves, avec leur code de connexion.
 *
 * Le code de connexion est montré au professeur, parce qu'il est celui qui le
 * remet à l'enfant en classe. Le code élève, lui, n'a rien à faire ici : il
 * sert à la famille pour ajouter l'enfant ailleurs.
 */
export const classDetail = query({
  args: { schoolClassId: v.id("schoolClasses") },
  handler: async (ctx, args) => {
    const profile = await callerProfileOrNull(ctx);
    if (!profile) return null;
    const schoolClass = await ctx.db.get(args.schoolClassId);
    if (!schoolClass || !(await canManageClass(ctx, profile, schoolClass))) {
      return null;
    }

    const school = await ctx.db.get(schoolClass.schoolId);
    const teacher = schoolClass.teacherId
      ? await ctx.db.get(schoolClass.teacherId)
      : null;

    const memberships = await ctx.db
      .query("schoolMemberships")
      .withIndex("by_class_status", (q) =>
        q.eq("schoolClassId", schoolClass._id).eq("status", "active"),
      )
      .take(CLASS_STUDENTS_LIMIT);

    const students = [];
    for (const m of memberships) {
      const student = await ctx.db.get(m.studentId);
      if (!student) continue;
      const guardians = await ctx.db
        .query("studentGuardians")
        .withIndex("by_studentId", (q) => q.eq("studentId", student._id))
        .take(5);
      students.push({
        studentId: student._id,
        membershipId: m._id,
        name: student.name,
        loginCode: await loginCodeOf(ctx, student),
        hasFamily: guardians.some((g) => g.relation !== "professeur"),
      });
    }
    students.sort((a, b) => a.name.localeCompare(b.name, "fr"));

    return {
      _id: schoolClass._id,
      class: schoolClass.class,
      label: schoolClass.label,
      schoolName: school && school.kind !== "personal" ? school.name : null,
      teacherName: teacher?.name ?? null,
      students,
      full: students.length >= CLASS_STUDENTS_LIMIT,
    };
  },
});

/**
 * Regarde un code élève avant de l'utiliser : le professeur voit le prénom
 * de l'enfant et sait s'il quitte une autre classe. Ne lève jamais.
 */
export const previewStudentCode = query({
  args: { code: v.string(), schoolClassId: v.id("schoolClasses") },
  handler: async (ctx, args) => {
    const profile = await callerProfileOrNull(ctx);
    if (!profile || !TEACHING_ROLES.has(profile.role)) return null;

    const normalized = normalizeCode(args.code);
    if (normalized.length < 6) return null;

    const student = await ctx.db
      .query("profiles")
      .withIndex("by_studentCode", (q) => q.eq("studentCode", normalized))
      .first();
    if (!student || student.role !== "student") {
      return { status: "unknown" as const };
    }

    const active = await ctx.db
      .query("schoolMemberships")
      .withIndex("by_student_status", (q) =>
        q.eq("studentId", student._id).eq("status", "active"),
      )
      .first();

    return {
      status: "ready" as const,
      name: student.name,
      level: student.class ?? null,
      alreadyHere: active?.schoolClassId === args.schoolClassId,
      inAnotherClass: !!active && active.schoolClassId !== args.schoolClassId,
    };
  },
});

/** Ajoute un enfant existant à une classe avec son code élève. */
export const addStudentByCode = mutation({
  args: { code: v.string(), schoolClassId: v.id("schoolClasses") },
  handler: async (ctx, args) => {
    const profile = await requireTeacher(ctx);
    const schoolClass = await ctx.db.get(args.schoolClassId);
    if (!schoolClass || !(await canManageClass(ctx, profile, schoolClass))) {
      throw new ConvexError("Classe introuvable.");
    }

    const normalized = normalizeCode(args.code);
    const student = normalized
      ? await ctx.db
          .query("profiles")
          .withIndex("by_studentCode", (q) => q.eq("studentCode", normalized))
          .unique()
      : null;
    if (!student || student.role !== "student") {
      throw new ConvexError(
        "Ce code élève n'existe pas. Vérifiez-le avec la famille : il " +
          "commence par ELV- et ne contient ni O, ni I, ni zéro.",
      );
    }

    if ((await activeStudentCount(ctx, schoolClass._id)) >= CLASS_STUDENTS_LIMIT) {
      throw new ConvexError(
        `Cette classe compte déjà ${CLASS_STUDENTS_LIMIT} élèves. Créez une autre classe.`,
      );
    }

    const result = await placeStudentInClass(ctx, {
      student,
      schoolClass,
      actorProfileId: profile._id,
    });
    if (result.status === "already") {
      throw new ConvexError(`${student.name} est déjà dans cette classe.`);
    }
    return { name: student.name, moved: result.moved };
  },
});

/**
 * Retire un élève de la classe. Son compte reste : la famille le garde, et il
 * continue à jouer à son niveau (accès libre). Seul le lien avec la classe
 * disparaît.
 */
export const removeStudent = mutation({
  args: { membershipId: v.id("schoolMemberships") },
  handler: async (ctx, args) => {
    const profile = await requireTeacher(ctx);
    const membership = await ctx.db.get(args.membershipId);
    if (!membership || membership.status !== "active") return null;
    const schoolClass = await ctx.db.get(membership.schoolClassId);
    if (!schoolClass || !(await canManageClass(ctx, profile, schoolClass))) {
      throw new ConvexError("Classe introuvable.");
    }
    const now = Date.now();
    await ctx.db.patch(membership._id, { status: "released", releasedAt: now });
    await ctx.db.insert("schoolMembershipEvents", {
      membershipId: membership._id,
      studentId: membership.studentId,
      schoolId: membership.schoolId,
      kind: "released",
      actorProfileId: profile._id,
      at: now,
    });
    return null;
  },
});

/** Le nom de l'école derrière un code école, avant de la rejoindre. */
export const previewSchoolCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const profile = await callerProfileOrNull(ctx);
    if (!profile) return null;
    const normalized = normalizeCode(args.code);
    if (normalized.length < 6) return null;
    const school = await ctx.db
      .query("schools")
      .withIndex("by_joinCode", (q) => q.eq("joinCode", normalized))
      .first();
    if (!school || school.status === "suspended") {
      return { status: "unknown" as const };
    }
    return {
      status: "ready" as const,
      name: school.name,
      city: school.city ?? null,
    };
  },
});

/**
 * Rejoint une école avec son code. Les classes de l'espace personnel du
 * professeur passent dans l'école, avec leurs élèves.
 *
 * Une classe dont le nom existe déjà dans l'école est renommée avec le nom
 * du professeur (« CM1 A (Mme Diop) ») plutôt que refusée : deux classes de
 * même nom ne se distinguent sur aucun écran.
 */
export const joinSchoolWithCode = mutation({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const profile = await requireTeacher(ctx);
    if (profile.role !== "professeur") {
      throw new ConvexError("Seul un compte professeur peut rejoindre une école.");
    }

    const normalized = normalizeCode(args.code);
    const school = normalized
      ? await ctx.db
          .query("schools")
          .withIndex("by_joinCode", (q) => q.eq("joinCode", normalized))
          .unique()
      : null;
    if (!school || school.status === "suspended") {
      throw new ConvexError(
        "Ce code école n'existe pas. Demandez-le à la direction : il " +
          "commence par ECO-.",
      );
    }

    const staff = await activeStaffRows(ctx, profile._id);
    if (staff.some((row) => row.schoolId === school._id)) {
      throw new ConvexError(`Vous faites déjà partie de ${school.name}.`);
    }

    await ctx.db.insert("schoolStaff", {
      schoolId: school._id,
      profileId: profile._id,
      staffRole: "professeur",
      status: "active",
    });

    let movedClasses = 0;
    const personal = await personalSchoolOf(ctx, profile._id);
    if (personal) {
      const classes = await ctx.db
        .query("schoolClasses")
        .withIndex("by_school", (q) => q.eq("schoolId", personal._id))
        .take(CLASSES_LIMIT);
      for (const c of classes) {
        let label = c.label;
        if (await classExists(ctx, school._id, c.class, label)) {
          label = `${c.label} (${profile.name})`.slice(0, 60);
        }
        await ctx.db.patch(c._id, { schoolId: school._id, label });
        const memberships = await ctx.db
          .query("schoolMemberships")
          .withIndex("by_class_status", (q) =>
            q.eq("schoolClassId", c._id).eq("status", "active"),
          )
          .take(CLASS_STUDENTS_LIMIT);
        for (const m of memberships) {
          await ctx.db.patch(m._id, { schoolId: school._id });
        }
        movedClasses++;
      }
    }

    return { schoolName: school.name, movedClasses };
  },
});
