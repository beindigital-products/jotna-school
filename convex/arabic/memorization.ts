/**
 * LA MÉMORISATION, CÔTÉ BASE — ce qui est su, et ce qui doit revenir.
 *
 * Les règles vivent dans `hifz.ts` (pur, testé) ; ce fichier ne fait que les
 * appliquer à ce qui est écrit, et il n'écrit qu'à un seul endroit.
 *
 * L'ÉCHELON NE SE REÇOIT PAS DU CLIENT. `applyOutcome` est appelée depuis
 * `completeLesson`, qui a déjà calculé la note de la séance À PARTIR DES
 * TENTATIVES ÉCRITES — elles-mêmes posées par le serveur après transcription
 * (`voice.verifyPronunciation`). Aucun chemin ne permet à un écran d'annoncer
 * « c'est mémorisé » : entre l'enfant qui récite et la ligne qui repousse la
 * sourate de trois mois, il n'y a que du code serveur.
 *
 * ON NE REDESCEND JAMAIS `versesMemorized`. Une séance ratée fait redescendre
 * l'ÉCHELON — la sourate revient plus tôt — mais pas le nombre de versets
 * tenus : ils ont été récités un jour, et le dire faux parce qu'un micro a mal
 * entendu serait effacer le travail de l'enfant sur un accident de machine.
 * L'échelon, lui, est fait pour bouger dans les deux sens : c'est son travail.
 */

import {
  query,
  type MutationCtx,
  type QueryCtx,
} from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";
import { callerProfile } from "../access";
import { moduleAccessForProfile } from "../modules";
import { SURAHS } from "./quran";
import {
  hifzStates,
  isDue,
  linkPointOf,
  nextDueAt,
  nextStrength,
  surahKeyOfHifzLesson,
  versesMemorizedFrom,
  type HifzRow,
} from "./hifz";
import { RECITATION_CLOSE, RECITATION_OK } from "./matching";

const MODULE_KEY = "arabe_coran" as const;

/** Le parcours compte six sourates ; 50 laisse la place à un second recueil. */
const HIFZ_ROWS_LIMIT = 50;

/** La ligne de mémorisation d'une sourate, ou `null`. */
async function hifzRow(
  ctx: QueryCtx | MutationCtx,
  studentId: Id<"profiles">,
  surahKey: string,
): Promise<Doc<"arabicHifz"> | null> {
  return await ctx.db
    .query("arabicHifz")
    .withIndex("by_student_surah", (q) =>
      q.eq("studentId", studentId).eq("surahKey", surahKey),
    )
    .unique();
}

/**
 * Ce que l'élève a mémorisé, et ce qui est à revoir.
 *
 * REND TOUTES LES SOURATES, celles jamais ouvertes comprises : un écran de
 * mémorisation doit montrer ce qu'il reste autant que ce qui est acquis.
 *
 * `now` est pris ICI et renvoyé : l'écran doit comparer les échéances au même
 * instant que le serveur, sinon une sourate due à la seconde près clignote
 * entre « à réviser » et « plus tard » selon l'horloge du téléphone.
 */
export const getState = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const profile = await callerProfile(ctx);
    const access = await moduleAccessForProfile(ctx, profile, MODULE_KEY);

    if (!access.enabled || !profile || profile.role !== "student") {
      return {
        enabled: access.enabled,
        now,
        surahs: hifzStates([], now),
        dueCount: 0,
      };
    }

    const rows = await ctx.db
      .query("arabicHifz")
      .withIndex("by_student", (q) => q.eq("studentId", profile._id))
      .take(HIFZ_ROWS_LIMIT);

    const asRows: HifzRow[] = rows.map((row) => ({
      surahKey: row.surahKey,
      strength: row.strength,
      versesMemorized: row.versesMemorized,
      dueAt: row.dueAt,
      lastReviewedAt: row.lastReviewedAt,
    }));

    return {
      enabled: true,
      now,
      surahs: hifzStates(asRows, now),
      dueCount: asRows.filter((row) => isDue(row.dueAt, now)).length,
    };
  },
});

/**
 * Enregistre le résultat d'une séance de mémorisation.
 *
 * Appelée par `completeLesson` — jamais exposée : rien ici ne doit pouvoir
 * être déclenché par un client. Elle ne fait rien si la leçon n'est pas une
 * leçon de mémorisation, pour que l'appelant n'ait pas à le vérifier.
 *
 * L'ÉCHELON BOUGE SUR LA LIAISON, PAS SUR LA MOYENNE DE LA SÉANCE. C'est le
 * point délicat du fichier, et il vaut la peine d'être dit : `completeLesson`
 * lit TOUTES les tentatives de la leçon, depuis toujours. En moyenner la note
 * ferait qu'une révision impeccable resterait plombée par un verset peiné six
 * semaines plus tôt — la sourate ne monterait jamais d'échelon, et reviendrait
 * tous les jours jusqu'à l'écœurement. On prend donc la tentative qui a
 * vraiment testé la mémorisation : la PLUS GRANDE liaison tentée, dans sa
 * version la plus récente. C'est l'exercice où l'enfant enchaîne sans qu'on lui
 * donne le départ, et c'est le seul qui dise s'il sait la sourate.
 *
 * AUCUNE LIAISON TENTÉE — l'enfant a passé l'étape, ou la séance s'est arrêtée
 * avant — et l'échelon NE BOUGE PAS. Ni montée (rien ne l'a prouvé) ni
 * descente (rien ne l'a infirmé) : passer un exercice ne doit pas coûter ce
 * qu'un oubli coûte. Les versets tenus, eux, s'enregistrent quand même.
 *
 * ON NE REDESCEND JAMAIS `versesMemorized`. Une séance ratée fait redescendre
 * l'échelon — la sourate revient plus tôt — mais pas le nombre de versets
 * tenus : ils ont été récités un jour, et le dire faux parce qu'un micro a mal
 * entendu serait effacer le travail de l'enfant.
 */
export async function applyOutcome(
  ctx: MutationCtx,
  args: {
    studentId: Id<"profiles">;
    lessonKey: string;
    attempts: readonly {
      itemKey: string;
      score?: number;
      at: number;
    }[];
    now: number;
  },
): Promise<{ surahKey: string; strength: number; dueAt: number } | null> {
  const surahKey = surahKeyOfHifzLesson(args.lessonKey);
  if (!surahKey) return null;
  if (!SURAHS.some((surah) => surah.key === surahKey)) return null;

  // La plus grande liaison tentée, prise à sa tentative la plus récente.
  let chained: { upTo: number; at: number; score: number } | null = null;
  for (const attempt of args.attempts) {
    const upTo = linkPointOf(surahKey, attempt.itemKey);
    if (upTo === null) continue;
    const candidate = { upTo, at: attempt.at, score: attempt.score ?? 0 };
    if (
      !chained ||
      candidate.upTo > chained.upTo ||
      (candidate.upTo === chained.upTo && candidate.at > chained.at)
    ) {
      chained = candidate;
    }
  }

  const passed = new Set(
    args.attempts
      .filter((attempt) => (attempt.score ?? 0) >= RECITATION_OK)
      .map((attempt) => attempt.itemKey),
  );
  const verses = versesMemorizedFrom(surahKey, passed);

  const existing = await hifzRow(ctx, args.studentId, surahKey);
  const verdict: "ok" | "close" | "retry" = !chained
    ? "close" // Rien à conclure : `nextStrength` laisse l'échelon en place.
    : chained.score >= RECITATION_OK
      ? "ok"
      : chained.score >= RECITATION_CLOSE
        ? "close"
        : "retry";

  const strength = nextStrength(existing?.strength ?? 0, verdict);
  const dueAt = nextDueAt(strength, args.now);

  if (existing) {
    await ctx.db.patch(existing._id, {
      strength,
      versesMemorized: Math.max(existing.versesMemorized, verses),
      lastScore: chained?.score ?? existing.lastScore,
      lastVerdict: verdict,
      lastReviewedAt: args.now,
      dueAt,
    });
  } else {
    await ctx.db.insert("arabicHifz", {
      studentId: args.studentId,
      surahKey,
      strength,
      versesMemorized: verses,
      lastScore: chained?.score ?? 0,
      lastVerdict: verdict,
      lastReviewedAt: args.now,
      dueAt,
      createdAt: args.now,
    });
  }

  return { surahKey, strength, dueAt };
}

/** Les lignes de mémorisation d'un élève — lecture partagée avec le placement. */
export async function hifzRowsOf(
  ctx: QueryCtx,
  studentId: Id<"profiles">,
): Promise<Doc<"arabicHifz">[]> {
  return await ctx.db
    .query("arabicHifz")
    .withIndex("by_student", (q) => q.eq("studentId", studentId))
    .take(HIFZ_ROWS_LIMIT);
}
