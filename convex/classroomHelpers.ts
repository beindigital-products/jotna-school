import { getAuthUserId } from "@convex-dev/auth/server";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { normalizeCode } from "./importCodes";
import {
  buildSchoolJoinCode,
  buildStudentShareCode,
  printableLoginCode,
} from "./openAccessRules";
import { secureRandomInt } from "./secureRandom";

// ---------------------------------------------------------------------------
// ACCÈS LIBRE — aides partagées par `classrooms.ts`, `family.ts`,
// `schoolSpace.ts` et `studentAccounts.ts`. Aucune fonction Convex ici :
// seulement des lectures et écritures réutilisées, pour que la même règle
// (qui gère quelle classe, comment un élève change de classe) n'existe
// qu'une fois.
// ---------------------------------------------------------------------------

/** Lignes `schoolStaff` lues pour un profil : un adulte est dans peu d'écoles. */
export const STAFF_PER_PROFILE_LIMIT = 20;
/** Classes lues pour une école ou un professeur. */
export const CLASSES_LIMIT = 50;
/** Élèves actifs lus pour une classe. */
export const CLASS_STUDENTS_LIMIT = 60;
/** Enfants lus pour un parent. */
export const CHILDREN_LIMIT = 50;
/** Essais de tirage d'un code avant d'abandonner. */
const CODE_ATTEMPTS = 12;

/** Le profil de l'appelant, ou `null`. */
export async function callerProfileOrNull(
  ctx: QueryCtx | MutationCtx,
): Promise<Doc<"profiles"> | null> {
  const userId = await getAuthUserId(ctx);
  if (userId === null) return null;
  return await ctx.db
    .query("profiles")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique();
}

/** Les lignes `schoolStaff` ACTIVES d'un adulte. */
export async function activeStaffRows(
  ctx: QueryCtx | MutationCtx,
  profileId: Id<"profiles">,
): Promise<Doc<"schoolStaff">[]> {
  const rows = await ctx.db
    .query("schoolStaff")
    .withIndex("by_profile", (q) => q.eq("profileId", profileId))
    .take(STAFF_PER_PROFILE_LIMIT);
  return rows.filter((row) => row.status === "active");
}

/** Vrai si ce profil dirige cette école (ligne `directeur` active). */
export async function isDirecteurOf(
  ctx: QueryCtx | MutationCtx,
  profileId: Id<"profiles">,
  schoolId: Id<"schools">,
): Promise<boolean> {
  const rows = await activeStaffRows(ctx, profileId);
  return rows.some(
    (row) => row.schoolId === schoolId && row.staffRole === "directeur",
  );
}

/**
 * L'école que dirige ce profil, ou `null`. Un directeur auto-inscrit n'en a
 * qu'une ; on prend la première ligne active.
 */
export async function directedSchool(
  ctx: QueryCtx | MutationCtx,
  profileId: Id<"profiles">,
): Promise<Doc<"schools"> | null> {
  const rows = await activeStaffRows(ctx, profileId);
  const row = rows.find((r) => r.staffRole === "directeur");
  if (!row) return null;
  return await ctx.db.get(row.schoolId);
}

/**
 * Cet adulte gère-t-il cette classe ? Trois façons, pas une de plus :
 * l'admin, le professeur de la classe, le directeur de son école.
 */
export async function canManageClass(
  ctx: QueryCtx | MutationCtx,
  profile: Doc<"profiles">,
  schoolClass: Doc<"schoolClasses">,
): Promise<boolean> {
  if (profile.role === "admin") return true;
  if (schoolClass.teacherId === profile._id) return true;
  if (profile.role === "directeur") {
    return await isDirecteurOf(ctx, profile._id, schoolClass.schoolId);
  }
  return false;
}

/**
 * L'espace personnel d'un professeur sans école : il le crée au besoin.
 *
 * Une classe exige un `schoolId` (`schoolClasses`, `schoolMemberships`, le
 * journal). Plutôt que rendre ce champ optionnel partout, un professeur seul
 * reçoit une « école » `kind: "personal"` qu'il ne voit jamais comme telle.
 */
export async function ensurePersonalSchool(
  ctx: MutationCtx,
  profile: Doc<"profiles">,
): Promise<Id<"schools">> {
  const personal = await personalSchoolOf(ctx, profile._id);
  if (personal) return personal._id;

  const user = await ctx.db.get(profile.userId as Id<"users">);
  return await ctx.db.insert("schools", {
    name: `Classes de ${profile.name}`,
    contactName: profile.name,
    contactEmail: user?.email ?? "",
    status: "active",
    createdAt: Date.now(),
    kind: "personal",
    ownerProfileId: profile._id,
  });
}

/** L'espace personnel d'un professeur, s'il existe. */
export async function personalSchoolOf(
  ctx: QueryCtx | MutationCtx,
  profileId: Id<"profiles">,
): Promise<Doc<"schools"> | null> {
  const owned = await ctx.db
    .query("schools")
    .withIndex("by_ownerProfileId", (q) => q.eq("ownerProfileId", profileId))
    .take(10);
  return owned.find((s) => s.kind === "personal") ?? null;
}

/** Tire un code libre parmi `CODE_ATTEMPTS` essais, ou `null`. */
async function drawFree(
  build: () => string,
  taken: (normalized: string) => Promise<boolean>,
): Promise<string | null> {
  for (let attempt = 0; attempt < CODE_ATTEMPTS; attempt++) {
    const candidate = build();
    if (!(await taken(normalizeCode(candidate)))) return candidate;
  }
  return null;
}

/** Vrai si ce code élève (normalisé) est déjà porté par un profil. */
export async function studentCodeTaken(
  ctx: QueryCtx | MutationCtx,
  normalized: string,
): Promise<boolean> {
  const existing = await ctx.db
    .query("profiles")
    .withIndex("by_studentCode", (q) => q.eq("studentCode", normalized))
    .first();
  return existing !== null;
}

/** Tire un code élève libre (forme imprimable `ELV-…`), ou lève. */
export async function drawStudentCode(ctx: MutationCtx): Promise<string> {
  const code = await drawFree(
    () => buildStudentShareCode(secureRandomInt),
    (normalized) => studentCodeTaken(ctx, normalized),
  );
  if (code === null) throw new Error("Aucun code élève libre. Réessayez.");
  return code;
}

/** Tire un code école libre (forme imprimable `ECO-…`), ou lève. */
export async function drawSchoolJoinCode(ctx: MutationCtx): Promise<string> {
  const code = await drawFree(
    () => buildSchoolJoinCode(secureRandomInt),
    async (normalized) =>
      (await ctx.db
        .query("schools")
        .withIndex("by_joinCode", (q) => q.eq("joinCode", normalized))
        .first()) !== null,
  );
  if (code === null) throw new Error("Aucun code école libre. Réessayez.");
  return code;
}

/** Le code élève d'un enfant, posé au besoin. Rendu en majuscules. */
export async function ensureStudentCodeFor(
  ctx: MutationCtx,
  student: Doc<"profiles">,
): Promise<string> {
  if (student.studentCode) return student.studentCode.toUpperCase();
  const code = await drawStudentCode(ctx);
  await ctx.db.patch(student._id, { studentCode: normalizeCode(code) });
  return code;
}

/** Le code de connexion lisible d'un élève, ou `null` (compte à adresse). */
export async function loginCodeOf(
  ctx: QueryCtx | MutationCtx,
  student: Doc<"profiles">,
): Promise<string | null> {
  const user = await ctx.db.get(student.userId as Id<"users">);
  return printableLoginCode(user?.email);
}

export type PlacementResult =
  | { status: "already" }
  | { status: "placed"; moved: boolean };

/**
 * Met un élève dans une classe, d'où qu'il vienne.
 *
 * Garde l'invariant d'`enrollStudent` : UNE SEULE inscription active par
 * élève. Trois cas :
 *
 * - déjà dans cette classe : rien n'est écrit ;
 * - dans une autre classe de la MÊME école : changement de classe sur la même
 *   ligne (`transferred`), comme `schools.transferStudent` ;
 * - ailleurs, ou nulle part : les inscriptions actives sont libérées
 *   (`released`), puis une nouvelle est créée (`enrolled`).
 *
 * Le niveau du profil suit la classe, comme partout ailleurs. Chaque acte
 * laisse sa ligne `schoolMembershipEvents` dans la même transaction.
 *
 * Aucun contrôle de sièges : en accès libre il n'y a pas d'abonnement, et
 * `seatStateForSchool` rend `null` sans abonnement.
 */
export async function placeStudentInClass(
  ctx: MutationCtx,
  args: {
    student: Doc<"profiles">;
    schoolClass: Doc<"schoolClasses">;
    actorProfileId: Id<"profiles">;
  },
): Promise<PlacementResult> {
  const { student, schoolClass, actorProfileId } = args;
  const now = Date.now();

  const actives = await ctx.db
    .query("schoolMemberships")
    .withIndex("by_student_status", (q) =>
      q.eq("studentId", student._id).eq("status", "active"),
    )
    .take(4);

  if (actives.some((m) => m.schoolClassId === schoolClass._id)) {
    return { status: "already" };
  }

  const moved = actives.length > 0;
  const sameSchool =
    actives.length === 1 && actives[0].schoolId === schoolClass.schoolId
      ? actives[0]
      : null;

  if (sameSchool) {
    await ctx.db.patch(sameSchool._id, { schoolClassId: schoolClass._id });
    await ctx.db.insert("schoolMembershipEvents", {
      membershipId: sameSchool._id,
      studentId: student._id,
      schoolId: sameSchool.schoolId,
      kind: "transferred",
      actorProfileId,
      at: now,
      fromSchoolClassId: sameSchool.schoolClassId,
      toSchoolClassId: schoolClass._id,
    });
  } else {
    for (const membership of actives) {
      await ctx.db.patch(membership._id, {
        status: "released",
        releasedAt: now,
      });
      await ctx.db.insert("schoolMembershipEvents", {
        membershipId: membership._id,
        studentId: student._id,
        schoolId: membership.schoolId,
        kind: "released",
        actorProfileId,
        at: now,
      });
    }

    const membershipId = await ctx.db.insert("schoolMemberships", {
      schoolId: schoolClass.schoolId,
      studentId: student._id,
      schoolClassId: schoolClass._id,
      status: "active",
      enrolledAt: now,
    });
    await ctx.db.insert("schoolMembershipEvents", {
      membershipId,
      studentId: student._id,
      schoolId: schoolClass.schoolId,
      kind: "enrolled",
      actorProfileId,
      at: now,
      toSchoolClassId: schoolClass._id,
    });
  }

  if (student.class !== schoolClass.class) {
    await ctx.db.patch(student._id, { class: schoolClass.class });
  }

  return { status: "placed", moved };
}

/** Nombre d'élèves actifs d'une classe (borné à `CLASS_STUDENTS_LIMIT`). */
export async function activeStudentCount(
  ctx: QueryCtx | MutationCtx,
  schoolClassId: Id<"schoolClasses">,
): Promise<number> {
  const rows = await ctx.db
    .query("schoolMemberships")
    .withIndex("by_class_status", (q) =>
      q.eq("schoolClassId", schoolClassId).eq("status", "active"),
    )
    .take(CLASS_STUDENTS_LIMIT);
  return rows.length;
}

/** Vrai si une classe de même niveau et même libellé existe déjà dans l'école. */
export async function classExists(
  ctx: QueryCtx | MutationCtx,
  schoolId: Id<"schools">,
  level: Doc<"schoolClasses">["class"],
  label: string,
): Promise<boolean> {
  const siblings = await ctx.db
    .query("schoolClasses")
    .withIndex("by_school_class", (q) =>
      q.eq("schoolId", schoolId).eq("class", level),
    )
    .take(CLASSES_LIMIT);
  return siblings.some(
    (s) => s.label.toLowerCase() === label.toLowerCase(),
  );
}
