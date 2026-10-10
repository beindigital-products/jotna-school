import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { assertTargetedDeployment } from "../testSeedsSchool";
import type { ProgrammeSubjectKey } from "./types";
import { planProgrammeSeed, type DbTopicRow } from "./seedPlan";

// ---------------------------------------------------------------------------
// CHARGER LE PROGRAMME EN BASE — les matières du CI au CM2 (les sept du guide
// et l'anglais) et leurs thématiques (`convex/programme`).
//
// MODULE INTERNE, appelé depuis un terminal, comme la pré-génération :
//
//     npx convex run programme/seed:run '{"confirmDeployment":"<nom>","dryRun":true}'
//     npx convex run programme/seed:run '{"confirmDeployment":"<nom>"}'
//
// L'essai à blanc rend le plan sans rien écrire : les matières trouvées,
// renommées ou créées, le nombre de thématiques à créer, les classes gardées
// telles quelles. Les règles (rien n'est doublé, rien n'est supprimé, une
// classe garnie à la main est laissée) sont celles de `seedPlan.ts`.
//
// Relancer est sans danger : une thématique déjà chargée porte sa clé et
// n'est pas recréée. Ensuite, `paliers/pregen:run` remplit les paliers avant
// que les élèves n'arrivent (`docs/paliers-et-exercices.md`).
//
// `confirmDeployment` : la même garde que les jeux de test et la
// pré-génération. Écrire le programme dans la mauvaise base se répare mal.
// ---------------------------------------------------------------------------

export const run = internalMutation({
  args: {
    confirmDeployment: v.string(),
    dryRun: v.optional(v.boolean()),
    /** `fill` (défaut) : une classe déjà garnie à la main est laissée. `merge` : on complète. */
    mode: v.optional(v.union(v.literal("fill"), v.literal("merge"))),
    /** Les clés de matières à charger (« histoire », « education-artistique »…) ; toutes par défaut. */
    subjects: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    assertTargetedDeployment(args.confirmDeployment);

    const subjects = await ctx.db.query("subjects").take(200);
    const topics: DbTopicRow[] = [];
    for (const subject of subjects) {
      const rows = await ctx.db
        .query("topics")
        .withIndex("by_subjectId", (q) => q.eq("subjectId", subject._id))
        .take(2000);
      for (const row of rows) {
        topics.push({
          _id: row._id,
          subjectId: row.subjectId,
          name: row.name,
          order: row.order,
          class: row.class ?? null,
          programmeKey: row.programmeKey ?? null,
        });
      }
    }

    const plan = planProgrammeSeed({
      subjects: subjects.map((s) => ({ _id: s._id, name: s.name })),
      topics,
      mode: args.mode,
      only: args.subjects,
    });

    if (args.dryRun) return { dryRun: true, ...plan.report };

    const subjectIdByKey = new Map<ProgrammeSubjectKey, Id<"subjects">>();
    for (const step of plan.subjects) {
      switch (step.kind) {
        case "use":
          subjectIdByKey.set(step.key, step.subjectId as Id<"subjects">);
          break;
        case "rename":
          await ctx.db.patch(step.subjectId as Id<"subjects">, {
            name: step.to,
            icon: step.icon,
            color: step.color,
            order: step.order,
          });
          subjectIdByKey.set(step.key, step.subjectId as Id<"subjects">);
          break;
        case "create": {
          const id = await ctx.db.insert("subjects", {
            name: step.name,
            icon: step.icon,
            color: step.color,
            order: step.order,
          });
          subjectIdByKey.set(step.key, id);
          break;
        }
      }
    }

    for (const step of plan.topics) {
      if (step.kind === "adopt") {
        await ctx.db.patch(step.topicId as Id<"topics">, { programmeKey: step.programmeKey });
        continue;
      }
      const subjectId = subjectIdByKey.get(step.subjectKey);
      if (!subjectId) continue;
      await ctx.db.insert("topics", {
        subjectId,
        name: step.topic.name,
        description: step.topic.description,
        order: step.order,
        class: step.klass,
        programmeKey: step.topic.key,
        ...(step.topic.palierCount !== undefined ? { palierCount: step.topic.palierCount } : {}),
      });
    }

    return { dryRun: false, ...plan.report };
  },
});
