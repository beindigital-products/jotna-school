import { ConvexError, v } from "convex/values";
import { mutation, query, type QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import {
  activeStaffRows,
  callerProfileOrNull,
  CLASSES_LIMIT,
  directedSchool,
} from "./classroomHelpers";
import { attachTeacherToSchool } from "./classrooms";

// ---------------------------------------------------------------------------
// L'ÉCOLE INVITE UN PROFESSEUR.
//
// Deux chemins lient un professeur à une école, et les deux finissent par la
// même ligne `schoolStaff` :
//
//  1. le professeur saisit le code école (`classrooms.joinSchoolWithCode`) ;
//  2. la direction saisit l'adresse d'un compte professeur, ici, et le
//     professeur accepte dans son espace.
//
// LE PROFESSEUR DOIT ACCEPTER. Entrer dans une école y déplace ses classes et
// ses élèves : une direction ne doit pas pouvoir s'approprier les classes
// d'un professeur en connaissant seulement son adresse.
//
// L'invitation vise un compte professeur qui existe. Elle ne crée pas de
// compte : tant que l'inscription demande un code d'invitation
// (`docs/comptes-et-acces.md`), un professeur sans compte reçoit le code
// école, par la direction, et le saisit après son inscription.
// ---------------------------------------------------------------------------

/** Invitations en attente lues pour une école ou pour un professeur. */
const PENDING_LIMIT = 50;

/** Une invitation en attente tombe d'elle-même après trente jours. */
const INVITATION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function isLive(createdAt: number, now: number): boolean {
  return now - createdAt < INVITATION_TTL_MS;
}

/** « CM1 A », ou `null` si l'invitation ne nomme pas de classe. */
async function classNameOf(
  ctx: QueryCtx,
  schoolClassId: Id<"schoolClasses"> | undefined,
): Promise<string | null> {
  if (!schoolClassId) return null;
  const schoolClass = await ctx.db.get(schoolClassId);
  return schoolClass ? `${schoolClass.class} ${schoolClass.label}` : null;
}

/** Invite un compte professeur, par son adresse, dans l'école du directeur. */
export const inviteTeacher = mutation({
  args: { email: v.string(), schoolClassId: v.optional(v.id("schoolClasses")) },
  handler: async (ctx, args) => {
    const director = await callerProfileOrNull(ctx);
    if (!director || director.role !== "directeur") {
      throw new ConvexError("Cet espace est réservé aux écoles.");
    }
    const school = await directedSchool(ctx, director._id);
    if (!school) throw new ConvexError("Créez d'abord votre école.");

    // DANS UNE ÉCOLE, UN PROFESSEUR EST LIÉ À UNE CLASSE. Dès que l'école a
    // des classes, l'invitation en nomme une ; une école qui n'en a pas encore
    // invite quand même, et attribue la classe ensuite depuis « Mon école ».
    const schoolClasses = await ctx.db
      .query("schoolClasses")
      .withIndex("by_school", (q) => q.eq("schoolId", school._id))
      .take(CLASSES_LIMIT);
    if (args.schoolClassId === undefined && schoolClasses.length > 0) {
      throw new ConvexError("Choisissez la classe de ce professeur.");
    }
    if (
      args.schoolClassId !== undefined &&
      !schoolClasses.some((c) => c._id === args.schoolClassId)
    ) {
      throw new ConvexError("Cette classe n'appartient pas à votre école.");
    }

    const email = args.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new ConvexError("Saisissez une adresse e-mail valide.");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .first();
    const teacher = user
      ? await ctx.db
          .query("profiles")
          .withIndex("by_userId", (q) => q.eq("userId", user._id))
          .unique()
      : null;
    if (!teacher || teacher.role !== "professeur") {
      throw new ConvexError(
        "Aucun compte professeur ne porte cette adresse. Si ce professeur " +
          "n'a pas encore de compte, donnez-lui le code école : il le " +
          "saisira après son inscription.",
      );
    }

    const staff = await activeStaffRows(ctx, teacher._id);
    if (staff.some((row) => row.schoolId === school._id)) {
      throw new ConvexError(`${teacher.name} fait déjà partie de votre école.`);
    }

    const now = Date.now();
    const pending = await ctx.db
      .query("schoolInvitations")
      .withIndex("by_school_and_status", (q) =>
        q.eq("schoolId", school._id).eq("status", "pending"),
      )
      .take(PENDING_LIMIT);
    const live = pending.filter((row) => isLive(row.createdAt, now));
    if (live.some((row) => row.teacherId === teacher._id)) {
      throw new ConvexError(`${teacher.name} a déjà une invitation en attente.`);
    }
    if (live.length >= PENDING_LIMIT) {
      throw new ConvexError(
        "Trop d'invitations en attente. Annulez-en avant d'en envoyer d'autres.",
      );
    }

    await ctx.db.insert("schoolInvitations", {
      schoolId: school._id,
      teacherId: teacher._id,
      invitedBy: director._id,
      schoolClassId: args.schoolClassId,
      status: "pending",
      createdAt: now,
    });
    return { teacherName: teacher.name };
  },
});

/** Les invitations en attente de l'école du directeur connecté. */
export const listForSchool = query({
  args: {},
  handler: async (ctx) => {
    const director = await callerProfileOrNull(ctx);
    if (!director || director.role !== "directeur") return [];
    const school = await directedSchool(ctx, director._id);
    if (!school) return [];

    const now = Date.now();
    const pending = await ctx.db
      .query("schoolInvitations")
      .withIndex("by_school_and_status", (q) =>
        q.eq("schoolId", school._id).eq("status", "pending"),
      )
      .take(PENDING_LIMIT);

    const rows = [];
    for (const invitation of pending) {
      if (!isLive(invitation.createdAt, now)) continue;
      const teacher = await ctx.db.get(invitation.teacherId);
      if (!teacher) continue;
      const user = await ctx.db.get(teacher.userId as Id<"users">);
      rows.push({
        _id: invitation._id,
        teacherName: teacher.name,
        teacherEmail: user?.email ?? null,
        className: await classNameOf(ctx, invitation.schoolClassId),
        createdAt: invitation.createdAt,
      });
    }
    return rows;
  },
});

/** La direction retire une invitation qui n'a pas encore reçu de réponse. */
export const cancel = mutation({
  args: { invitationId: v.id("schoolInvitations") },
  handler: async (ctx, args) => {
    const director = await callerProfileOrNull(ctx);
    if (!director || director.role !== "directeur") {
      throw new ConvexError("Cet espace est réservé aux écoles.");
    }
    const school = await directedSchool(ctx, director._id);
    const invitation = await ctx.db.get(args.invitationId);
    if (!school || !invitation || invitation.schoolId !== school._id) {
      throw new ConvexError("Invitation introuvable.");
    }
    if (invitation.status === "pending") {
      await ctx.db.patch(invitation._id, { status: "cancelled" });
    }
    return null;
  },
});

/** Les invitations en attente du professeur connecté. */
export const mine = query({
  args: {},
  handler: async (ctx) => {
    const teacher = await callerProfileOrNull(ctx);
    if (!teacher || teacher.role !== "professeur") return [];

    const now = Date.now();
    const pending = await ctx.db
      .query("schoolInvitations")
      .withIndex("by_teacher_and_status", (q) =>
        q.eq("teacherId", teacher._id).eq("status", "pending"),
      )
      .take(PENDING_LIMIT);

    const rows = [];
    for (const invitation of pending) {
      if (!isLive(invitation.createdAt, now)) continue;
      const school = await ctx.db.get(invitation.schoolId);
      if (!school || school.status === "suspended") continue;
      rows.push({
        _id: invitation._id,
        schoolName: school.name,
        schoolCity: school.city ?? null,
        className: await classNameOf(ctx, invitation.schoolClassId),
        createdAt: invitation.createdAt,
      });
    }
    return rows;
  },
});

/** Le professeur accepte ou refuse une invitation qui lui est adressée. */
export const respond = mutation({
  args: { invitationId: v.id("schoolInvitations"), accept: v.boolean() },
  handler: async (ctx, args) => {
    const teacher = await callerProfileOrNull(ctx);
    if (!teacher || teacher.role !== "professeur") {
      throw new ConvexError("Seul un compte professeur répond à une invitation.");
    }
    const invitation = await ctx.db.get(args.invitationId);
    if (
      !invitation ||
      invitation.teacherId !== teacher._id ||
      invitation.status !== "pending" ||
      !isLive(invitation.createdAt, Date.now())
    ) {
      throw new ConvexError("Cette invitation n'est plus valable.");
    }

    if (!args.accept) {
      await ctx.db.patch(invitation._id, { status: "declined" });
      return { joined: false, schoolName: null, movedClasses: 0 };
    }

    const school = await ctx.db.get(invitation.schoolId);
    if (!school || school.status === "suspended") {
      throw new ConvexError("Cette école n'est plus disponible.");
    }
    await ctx.db.patch(invitation._id, { status: "accepted" });

    const staff = await activeStaffRows(ctx, teacher._id);
    const alreadyIn = staff.some((row) => row.schoolId === school._id);
    const movedClasses = alreadyIn
      ? 0
      : await attachTeacherToSchool(ctx, teacher, school);

    // La classe promise par l'invitation, si elle est toujours dans l'école.
    if (invitation.schoolClassId) {
      const schoolClass = await ctx.db.get(invitation.schoolClassId);
      if (schoolClass && schoolClass.schoolId === school._id) {
        await ctx.db.patch(schoolClass._id, { teacherId: teacher._id });
      }
    }
    return { joined: true, schoolName: school.name, movedClasses };
  },
});
