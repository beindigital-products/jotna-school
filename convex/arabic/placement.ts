/**
 * LE PLACEMENT D'UN ÉLÈVE — ce que l'école déclare de son niveau.
 *
 * À QUOI ÇA SERT. Un module qui commence toujours par l'alif ne sert pas un
 * enfant qui lit déjà, et une école qui accueille des élèves venus d'une école
 * coranique en a plein ses classes. Le placement ouvre le parcours là où
 * l'enfant en est, au lieu de lui faire refaire sept leçons d'alphabet pour
 * atteindre la première sourate.
 *
 * CE QU'IL NE FAIT PAS, ET C'EST LA MOITIÉ DU SUJET :
 *
 *   - IL NE VALIDE RIEN. Placer un élève « confirmé » lui OUVRE l'alphabet,
 *     ça ne le lui fait pas passer. Ses leçons d'alphabet restent non faites,
 *     sans étoiles, et il peut les gagner s'il les fait. Cocher une case dans
 *     un tableau de bord ne remplit pas un cahier, et un module qui le
 *     prétendrait mentirait au parent qui lit la progression ;
 *
 *   - IL NE FERME RIEN. C'est un plancher, jamais un plafond
 *     (`progressRules.placementFloorOrder`). Un enfant placé trop haut redescend
 *     tout seul dans le parcours, sans qu'un adulte ait à reprendre la main —
 *     c'est la seule façon de rattraper un placement faux ;
 *
 *   - IL NE SUIT PAS L'ENFANT AILLEURS. La ligne porte son école. Un élève
 *     transféré est relu par sa NOUVELLE école, qui le placera elle-même : le
 *     jugement d'un directeur n'engage pas son confrère. La ligne n'est pas
 *     effacée pour autant — s'il revient, elle revaut.
 *
 * QUI ÉCRIT : la même garde que l'allumage du module
 * (`modules.callerAdministersSchool`) — un `admin`, ou le `directeur` rattaché
 * à CETTE école. Un professeur ne place pas : il voit l'élève tous les jours et
 * saurait mieux que personne, mais la porte d'un enseignement religieux se
 * tient au même niveau que son interrupteur.
 *
 * UNE REQUÊTE NE LÈVE JAMAIS (spec §5.4) ; une mutation lève des `ConvexError`
 * porteuses de phrases, que l'écran affiche.
 */

import { ConvexError, v } from "convex/values";
import {
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";
import { callerAdministersSchool } from "../modules";
import { ARABIC_LESSONS, getLesson } from "./curriculum";
import { SURAHS } from "./quran";
import { hifzRowsOf } from "./memorization";
import {
  placementFloorOrder,
  placementLevelValidator,
  type Placement,
  type PlacementLevel,
} from "./progressRules";

/** Élèves lus pour le tableau de bord d'une école. Au-delà, la liste est dite partielle. */
const SCHOOL_STUDENTS_LIMIT = 400;

/** Leçons lues pour un élève : le parcours en compte trente. */
const PROGRESS_ROWS_LIMIT = 100;

const UNKNOWN_NAME = "Élève";

/**
 * Le placement qui s'applique à cet élève DANS cette école, ou `null`.
 *
 * L'école est un argument, pas une déduction : la ligne d'une autre école ne
 * doit pas s'appliquer ici, et la seule façon de s'en assurer est de demander
 * celle où l'enfant est inscrit aujourd'hui.
 */
export async function placementFor(
  ctx: QueryCtx | MutationCtx,
  studentId: Id<"profiles">,
  schoolId: Id<"schools">,
): Promise<Doc<"arabicPlacement"> | null> {
  return await ctx.db
    .query("arabicPlacement")
    .withIndex("by_student_school", (q) =>
      q.eq("studentId", studentId).eq("schoolId", schoolId),
    )
    .unique();
}

/** La ligne de base ramenée à ce que `progressRules` sait lire. */
export function asPlacement(
  row: Doc<"arabicPlacement"> | null,
): Placement | null {
  if (!row) return null;
  return {
    level: row.level,
    startLessonKey: row.startLessonKey ?? null,
    surahKey: row.surahKey ?? null,
  };
}

// ---------------------------------------------------------------------------
// Requêtes — côté école
// ---------------------------------------------------------------------------

/**
 * Les élèves d'une école et leur placement.
 *
 * DÉLIBÉRÉMENT SANS LA PROGRESSION RÉELLE. La lire ici voudrait dire une
 * requête de progression PAR ÉLÈVE à chaque frappe dans le tableau de bord
 * d'une école de trois cents enfants — et ces lignes changent à chaque
 * exercice fait en classe, donc la souscription se réinvaliderait toute la
 * journée. Ce que l'école a DÉCLARÉ tient en deux lectures indexées ; ce que
 * l'élève a FAIT se demande élève par élève (`getStudentProgress`), au moment
 * où quelqu'un ouvre sa ligne.
 */
export const listForSchool = query({
  args: { schoolId: v.id("schools") },
  handler: async (ctx, args) => {
    if (!(await callerAdministersSchool(ctx, args.schoolId))) {
      return { students: [], truncated: false };
    }

    const memberships = await ctx.db
      .query("schoolMemberships")
      .withIndex("by_school_status", (q) =>
        q.eq("schoolId", args.schoolId).eq("status", "active"),
      )
      .take(SCHOOL_STUDENTS_LIMIT);

    const placements = await ctx.db
      .query("arabicPlacement")
      .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
      .take(SCHOOL_STUDENTS_LIMIT);

    const byStudent = new Map(
      placements.map((row) => [row.studentId as string, row]),
    );

    const students = await Promise.all(
      memberships.map(async (membership) => {
        const student = await ctx.db.get(membership.studentId);
        const placement = byStudent.get(membership.studentId as string);
        return {
          studentId: membership.studentId,
          name: student?.name ?? UNKNOWN_NAME,
          class: student?.class ?? null,
          level: (placement?.level ?? null) as PlacementLevel | null,
          startLessonKey: placement?.startLessonKey ?? null,
          surahKey: placement?.surahKey ?? null,
          updatedAt: placement?.updatedAt ?? null,
        };
      }),
    );

    return {
      students: students.sort((a, b) => a.name.localeCompare(b.name)),
      truncated: memberships.length === SCHOOL_STUDENTS_LIMIT,
    };
  },
});

/**
 * Ce qu'un élève a RÉELLEMENT fait — à côté de ce que l'école a déclaré.
 *
 * Les deux ensemble sont ce qui rend le tableau de bord utile : un enfant
 * placé « confirmé » qui n'a jamais dépassé la troisième leçon d'alphabet
 * n'est pas confirmé, et il n'y a que cette comparaison pour le voir.
 *
 * `lastCompleted` est la leçon terminée la PLUS AVANCÉE, pas la plus récente :
 * un enfant qui révise l'alphabet en mars n'est pas retombé au niveau 1.
 */
export const getStudentProgress = query({
  args: { studentId: v.id("profiles"), schoolId: v.id("schools") },
  handler: async (ctx, args) => {
    const empty = {
      found: false,
      completedCount: 0,
      lastCompleted: null as { key: string; title: string } | null,
      memorized: [] as { surahKey: string; nameFr: string; verses: number }[],
    };
    if (!(await callerAdministersSchool(ctx, args.schoolId))) return empty;

    const membership = await ctx.db
      .query("schoolMemberships")
      .withIndex("by_student_status", (q) =>
        q.eq("studentId", args.studentId).eq("status", "active"),
      )
      .first();
    // Un élève qu'on ne peut pas rattacher à CETTE école ne se lit pas d'ici :
    // le tableau de bord d'une école ne doit pas devenir une fenêtre sur les
    // enfants d'une autre.
    if (!membership || membership.schoolId !== args.schoolId) return empty;

    const rows = await ctx.db
      .query("arabicLessonProgress")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .take(PROGRESS_ROWS_LIMIT);

    const completed = rows.filter((row) => row.status === "completed");
    let best: { key: string; title: string; order: number } | null = null;
    for (const row of completed) {
      const lesson = getLesson(row.lessonKey);
      if (!lesson) continue;
      if (!best || lesson.order > best.order) {
        best = { key: lesson.key, title: lesson.title, order: lesson.order };
      }
    }

    const hifz = await hifzRowsOf(ctx, args.studentId);
    const surahName = new Map(SURAHS.map((surah) => [surah.key, surah.nameFr]));

    return {
      found: true,
      completedCount: completed.length,
      lastCompleted: best ? { key: best.key, title: best.title } : null,
      memorized: hifz
        .filter((row) => row.versesMemorized > 0)
        .map((row) => ({
          surahKey: row.surahKey,
          nameFr: surahName.get(row.surahKey) ?? row.surahKey,
          verses: row.versesMemorized,
        })),
    };
  },
});

// ---------------------------------------------------------------------------
// Côté élève
// ---------------------------------------------------------------------------

/**
 * Le placement de cet élève, résolu depuis l'école où il est inscrit.
 *
 * PAS UNE REQUÊTE, mais une fonction : le parcours (`lessons.getPath`) a déjà
 * besoin du profil et sert déjà une souscription. Une requête de plus voudrait
 * dire un abonnement de plus sur des lignes qui changent une fois par an.
 *
 * Rend le PLANCHER en plus de ce qui a été déclaré, pour que « intermédiaire »
 * ne soit interprété qu'à un seul endroit du dépôt.
 */
export async function placementForStudent(
  ctx: QueryCtx,
  studentId: Id<"profiles">,
): Promise<{
  level: PlacementLevel | null;
  surahKey: string | null;
  floorOrder: number;
}> {
  const membership = await ctx.db
    .query("schoolMemberships")
    .withIndex("by_student_status", (q) =>
      q.eq("studentId", studentId).eq("status", "active"),
    )
    .first();
  if (!membership) return { level: null, surahKey: null, floorOrder: 0 };

  const row = await placementFor(ctx, studentId, membership.schoolId);
  const placement = asPlacement(row);
  return {
    level: row?.level ?? null,
    surahKey: row?.surahKey ?? null,
    floorOrder: placementFloorOrder(placement),
  };
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Place un élève, ou corrige son placement.
 *
 * IDEMPOTENTE : replacer réécrit la ligne, n'en empile pas une seconde.
 *
 * LES DEUX REPÈRES SONT VÉRIFIÉS À L'ÉCRITURE. Une clé de leçon ou de sourate
 * qui ne désigne rien serait acceptée en silence et ne produirait aucun
 * plancher — le directeur croirait avoir placé l'enfant, et l'enfant
 * retrouverait l'alif. On refuse, avec une phrase.
 */
export const setForStudent = mutation({
  args: {
    schoolId: v.id("schools"),
    studentId: v.id("profiles"),
    level: placementLevelValidator,
    startLessonKey: v.optional(v.string()),
    surahKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const actor = await callerAdministersSchool(ctx, args.schoolId);
    if (!actor) throw new ConvexError("Rôle non autorisé");

    const student = await ctx.db.get(args.studentId);
    if (!student || student.role !== "student") {
      throw new ConvexError("Élève introuvable");
    }

    const membership = await ctx.db
      .query("schoolMemberships")
      .withIndex("by_student_status", (q) =>
        q.eq("studentId", args.studentId).eq("status", "active"),
      )
      .first();
    if (!membership || membership.schoolId !== args.schoolId) {
      throw new ConvexError("Cet élève n'est pas inscrit dans cette école");
    }

    if (args.startLessonKey && !getLesson(args.startLessonKey)) {
      throw new ConvexError("Leçon introuvable");
    }
    if (
      args.surahKey &&
      !SURAHS.some((surah) => surah.key === args.surahKey)
    ) {
      throw new ConvexError("Sourate introuvable");
    }

    const now = Date.now();
    const existing = await placementFor(ctx, args.studentId, args.schoolId);
    const fields = {
      level: args.level,
      ...(args.startLessonKey
        ? { startLessonKey: args.startLessonKey }
        : { startLessonKey: undefined }),
      ...(args.surahKey ? { surahKey: args.surahKey } : { surahKey: undefined }),
      updatedBy: actor._id,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, fields);
      return null;
    }

    await ctx.db.insert("arabicPlacement", {
      studentId: args.studentId,
      schoolId: args.schoolId,
      ...fields,
    });
    return null;
  },
});

/**
 * Retire le placement d'un élève — il repart de la règle séquentielle.
 *
 * ON EFFACE VRAIMENT LA LIGNE ici, contrairement à `modules.setForSchool` qui
 * garde une ligne éteinte. La différence tient à ce que la trace sert : savoir
 * QUI a coupé un module pour toute une école répond à une question qu'on se
 * pose vraiment ; garder « plus placé depuis mardi » pour un enfant n'en
 * répond aucune, et laisserait un jugement sur un élève traîner en base après
 * que l'école l'a retiré.
 *
 * AUCUNE PROGRESSION N'EST TOUCHÉE : ce que l'enfant a fait lui reste, les
 * leçons ouvertes par son travail le restent. Seul le plancher disparaît.
 */
export const clearForStudent = mutation({
  args: { schoolId: v.id("schools"), studentId: v.id("profiles") },
  handler: async (ctx, args) => {
    const actor = await callerAdministersSchool(ctx, args.schoolId);
    if (!actor) throw new ConvexError("Rôle non autorisé");

    const existing = await placementFor(ctx, args.studentId, args.schoolId);
    if (existing) await ctx.db.delete(existing._id);
    return null;
  },
});

// ---------------------------------------------------------------------------
// Le catalogue que l'écran d'école propose
// ---------------------------------------------------------------------------

/**
 * Les leçons et les sourates choisissables, pour remplir les listes déroulantes
 * du tableau de bord.
 *
 * SERVIE PAR UNE REQUÊTE plutôt que lue depuis le paquet de l'écran, parce que
 * l'écran d'administration n'importe rien du module aujourd'hui et qu'un
 * tableau de bord d'école n'a pas à embarquer l'alphabet arabe pour afficher
 * trois listes. Elle ne lit pas la base : elle rend du contenu déjà en code.
 */
export const options = query({
  args: {},
  handler: async () => ({
    lessons: ARABIC_LESSONS.map((lesson) => ({
      key: lesson.key,
      title: lesson.title,
      levelKey: lesson.levelKey,
      order: lesson.order,
    })),
    surahs: SURAHS.map((surah) => ({
      key: surah.key,
      nameFr: surah.nameFr,
      ayahCount: surah.ayahs.length,
    })),
  }),
});
