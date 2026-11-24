import { ConvexError, v } from "convex/values";
import { mutation, query, type MutationCtx } from "./_generated/server";
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
  STAFF_PER_PROFILE_LIMIT,
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
          // `null` : un cours particulier, dans l'espace personnel du professeur.
          schoolId: school && school.kind !== "personal" ? school._id : null,
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
      // Sans école nommée, la classe est un cours particulier : elle va dans
      // l'espace personnel du professeur, même s'il fait partie d'une école.
      // L'écran propose la destination quand il en a plusieurs.
      schoolId = await ensurePersonalSchool(ctx, profile);
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

    // RETIRÉ PAR L'ÉCOLE, IL NE REVIENT PAS PAR LE CODE. Sans ce refus, retirer
    // un professeur ne coupait rien : il connaît le code école et le
    // ressaisissait. La direction peut le réinviter, ou changer le code.
    const history = await ctx.db
      .query("schoolStaff")
      .withIndex("by_profile", (q) => q.eq("profileId", profile._id))
      .take(STAFF_PER_PROFILE_LIMIT);
    const exits = history
      .filter((row) => row.schoolId === school._id && row.status === "removed")
      .sort((a, b) => (b.removedAt ?? 0) - (a.removedAt ?? 0));
    if (exits[0]?.removedBy === "school") {
      throw new ConvexError(
        `La direction de ${school.name} vous a retiré de l'école. Pour y ` +
          "revenir, demandez-lui une invitation.",
      );
    }

    const movedClasses = await attachTeacherToSchool(ctx, profile, school);
    return { schoolName: school.name, movedClasses };
  },
});

/**
 * Quitte une école. Les classes du professeur y restent, sans professeur :
 * elles appartiennent à l'école, comme quand la direction le retire.
 */
export const leaveSchool = mutation({
  args: { schoolId: v.id("schools") },
  handler: async (ctx, args) => {
    const profile = await requireTeacher(ctx);
    const rows = await activeStaffRows(ctx, profile._id);
    const row = rows.find(
      (r) => r.schoolId === args.schoolId && r.staffRole === "professeur",
    );
    if (!row) throw new ConvexError("Vous ne faites pas partie de cette école.");
    await ctx.db.patch(row._id, {
      status: "removed",
      removedBy: "self",
      removedAt: Date.now(),
    });

    const classes = await ctx.db
      .query("schoolClasses")
      .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
      .take(CLASSES_LIMIT);
    for (const c of classes) {
      if (c.teacherId === profile._id) {
        await ctx.db.patch(c._id, { teacherId: undefined });
      }
    }
    return null;
  },
});


/**
 * Fait entrer un professeur dans une école. Rend le nombre de classes
 * déplacées : toujours zéro.
 *
 * SES COURS PARTICULIERS NE BOUGENT PAS. Les classes de son espace personnel
 * et leurs élèves restent à lui ; l'école ne les voit pas. Avant, entrer dans
 * une école y déplaçait toutes ses classes : un professeur qui suit des élèves
 * à titre privé les aurait remis à la direction en acceptant une invitation.
 * Dans l'école, il enseigne les classes que la direction lui attribue ou
 * qu'il y crée.
 *
 * Les deux chemins d'entrée passent ici : le code école saisi par le
 * professeur (`joinSchoolWithCode`) et l'invitation de la direction qu'il
 * accepte (`schoolInvitations.respond`). L'appelant a déjà vérifié que le
 * professeur n'est pas dans l'école.
 */
export async function attachTeacherToSchool(
  ctx: MutationCtx,
  profile: Doc<"profiles">,
  school: Doc<"schools">,
): Promise<number> {
  await ctx.db.insert("schoolStaff", {
    schoolId: school._id,
    profileId: profile._id,
    staffRole: "professeur",
    status: "active",
  });
  return 0;
}
