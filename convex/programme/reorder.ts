import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { assertTargetedDeployment } from "../testSeedsSchool";
import { PROGRAMME } from "./index";
import { planReorder, type ReorderTopicRow } from "./reorderPlan";

// ---------------------------------------------------------------------------
// REMETTRE LES THÉMATIQUES DU PROGRAMME DANS L'ORDRE DU FICHIER — après un
// chargement (`seed.ts`), qui ne fait que créer les thématiques manquantes, à
// la suite des autres.
//
// MODULE INTERNE, appelé depuis un terminal, comme le chargement et la
// pré-génération :
//
//     npx convex run programme/reorder:run '{"confirmDeployment":"<nom>","subjects":["anglais"],"dryRun":true}'
//     npx convex run programme/reorder:run '{"confirmDeployment":"<nom>","subjects":["anglais"]}'
//
// L'essai à blanc rend le plan sans rien écrire : combien de thématiques
// changent de rang, lesquelles (de quel rang à quel rang), lesquelles du
// programme manquent en base. La règle est celle de `reorderPlan.ts` : les
// rangs déjà pris par les thématiques du programme sont redistribués dans
// l'ordre du fichier, aucun rang n'est inventé, rejouer ne change plus rien.
//
// `subjects` est OBLIGATOIRE (« anglais », « histoire »…) : on ne remet jamais
// toutes les matières en ordre d'un coup, un administrateur a pu en déplacer
// une à la main. Seul `order` est écrit ; ni le nom, ni la description, ni les
// paliers, ni la progression des élèves (qui suit `topicId`) ne changent.
// ---------------------------------------------------------------------------

export const run = internalMutation({
  args: {
    confirmDeployment: v.string(),
    /** Les clés de matières à remettre en ordre (obligatoire). */
    subjects: v.array(v.string()),
    dryRun: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    assertTargetedDeployment(args.confirmDeployment);
    if (args.subjects.length === 0) throw new Error("`subjects` est vide : nommer au moins une matière (« anglais »).");
    const known = new Set<string>(PROGRAMME.map((subject) => subject.key));
    const unknown = args.subjects.filter((key) => !known.has(key));
    if (unknown.length > 0) throw new Error(`Matière inconnue : ${unknown.join(", ")}.`);

    const rows = await ctx.db.query("topics").take(5000);
    const topics: ReorderTopicRow[] = rows.map((row) => ({ _id: row._id, order: row.order, class: row.class ?? null, programmeKey: row.programmeKey ?? null }));

    const plans = PROGRAMME.filter((subject) => args.subjects.includes(subject.key)).map((subject) => planReorder({ subject, topics }));

    const report = plans.map((plan) => ({
      subject: plan.subject,
      loaded: plan.loaded,
      toMove: plan.moves.length,
      unchanged: plan.unchanged,
      missing: plan.missing,
      notInProgramme: plan.notInProgramme,
      moves: plan.moves.slice(0, 80).map((move) => `${move.klass} ${move.programmeKey} : ${move.from} -> ${move.to}`),
    }));

    if (args.dryRun) return { dryRun: true, plans: report };

    // Les rangs sont réutilisés d'une thématique à l'autre : aucune contrainte d'unicité, donc l'ordre d'écriture est sans importance.
    for (const plan of plans) {
      for (const move of plan.moves) await ctx.db.patch(move.topicId as Id<"topics">, { order: move.to });
    }
    return { dryRun: false, plans: report };
  },
});
