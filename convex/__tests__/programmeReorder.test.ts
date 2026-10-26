import { describe, expect, it } from "vitest";
import { PROGRAMME, allProgrammeEntries } from "../programme";
import { planReorder, programmeOrder, type ReorderTopicRow } from "../programme/reorderPlan";
import { planProgrammeSeed, type DbTopicRow } from "../programme/seedPlan";

/**
 * LA REMISE EN ORDRE DU PROGRAMME (`programme/reorder.ts`, `reorderPlan.ts`).
 *
 * Le chargement du programme ne fait que créer les thématiques manquantes, à la suite des autres. Sur une base qui a déjà
 * l'anglais d'avant la version 2, les treize thématiques nouvelles se seraient placées APRÈS « Hello! Goodbye! ». Ces tests
 * jouent cette base-là : l'ancien anglais (38 thématiques dans l'ancien ordre), une thématique ajoutée à la main entre deux, le
 * chargement, puis la remise en ordre.
 */

const ANGLAIS = PROGRAMME.find((subject) => subject.key === "anglais")!;

/** L'anglais d'avant la version 2, classe par classe, dans l'ordre où le chargement l'avait créé (docs/programme-anglais-v2.md, section 1). */
const OLD_ENGLISH: Record<string, string[]> = {
  CI: ["an-ci-hello", "an-ci-colours", "an-ci-numbers", "an-ci-animals", "an-ci-fruits"],
  CP: ["an-cp-family", "an-cp-body", "an-cp-classroom", "an-cp-numbers-20", "an-cp-food"],
  CE1: ["an-ce1-who", "an-ce1-days", "an-ce1-a-an", "an-ce1-clothes", "an-ce1-likes", "an-ce1-commands"],
  CE2: ["an-ce2-be", "an-ce2-have-got", "an-ce2-can", "an-ce2-home", "an-ce2-months", "an-ce2-weather", "an-ce2-clock"],
  CM1: ["an-cm1-present-simple", "an-cm1-he-she-it", "an-cm1-routine", "an-cm1-continuous", "an-cm1-jobs", "an-cm1-market", "an-cm1-describe"],
  CM2: [
    "an-cm2-was-were",
    "an-cm2-past-regular",
    "an-cm2-past-irregular",
    "an-cm2-going-to",
    "an-cm2-comparatives",
    "an-cm2-directions",
    "an-cm2-questions",
    "an-cm2-reading",
  ],
};
const NEW_KEYS = programmeOrder(ANGLAIS)
  .map((entry) => entry.key)
  .filter((key) => !Object.values(OLD_ENGLISH).flat().includes(key));

/** La base : l'ancien anglais (rangs 1 à 39, avec un trou à 20 pour une thématique ajoutée à la main), et une autre matière. */
function oldDatabase(): DbTopicRow[] {
  const rows: DbTopicRow[] = [];
  let order = 0;
  for (const [klass, keys] of Object.entries(OLD_ENGLISH)) {
    for (const key of keys) {
      order += 1;
      if (order === 20) order += 1;
      rows.push({ _id: `id-${key}`, subjectId: "en", name: key, order, class: klass, programmeKey: key });
    }
  }
  rows.push({ _id: "by-hand", subjectId: "en", name: "Ma thématique à la main", order: 20, class: "CE1", programmeKey: null });
  rows.push({ _id: "histoire-1", subjectId: "hist", name: "Une thématique d'histoire", order: 1, class: "CI", programmeKey: "hi-ci-journee" });
  rows.push({ _id: "histoire-2", subjectId: "hist", name: "Une autre", order: 2, class: "CI", programmeKey: "hi-ci-ordre" });
  return rows;
}

/** Joue le chargement : les thématiques créées rejoignent la base avec le rang que le chargement leur donne. */
function afterSeed(rows: DbTopicRow[]): DbTopicRow[] {
  const plan = planProgrammeSeed({
    subjects: [
      { _id: "en", name: "Anglais" },
      { _id: "hist", name: "Histoire" },
    ],
    topics: rows,
    only: ["anglais"],
  });
  const created = plan.topics.flatMap((step) =>
    step.kind === "create"
      ? [{ _id: `id-${step.topic.key}`, subjectId: "en", name: step.topic.name, order: step.order, class: step.klass, programmeKey: step.topic.key }]
      : [],
  );
  return [...rows, ...created];
}

const apply = (rows: readonly ReorderTopicRow[], moves: { topicId: string; to: number }[]): ReorderTopicRow[] =>
  rows.map((row) => {
    const move = moves.find((candidate) => candidate.topicId === row._id);
    return move ? { ...row, order: move.to } : { ...row };
  });

const isEnglish = (row: ReorderTopicRow) => row._id === "by-hand" || row.programmeKey?.startsWith("an-");
const keysOf = (rows: readonly ReorderTopicRow[], klass: string) =>
  rows
    .filter((row) => row.class === klass && row.programmeKey?.startsWith("an-"))
    .sort((a, b) => a.order - b.order)
    .map((row) => row.programmeKey);

describe("la remise en ordre du programme", () => {
  it("part d'un vrai problème : après le chargement, l'alphabet vient APRÈS « Hello! Goodbye! »", () => {
    const rows = afterSeed(oldDatabase());
    const ci = keysOf(rows, "CI");
    expect(ci.indexOf("an-ci-abc-1")).toBeGreaterThan(ci.indexOf("an-ci-hello"));
    expect(ci.slice(0, 2)).toEqual(["an-ci-hello", "an-ci-colours"]);
    expect(NEW_KEYS).toHaveLength(13);
  });

  it("signale les treize thématiques absentes avant le chargement, sans rien déplacer d'autre", () => {
    const plan = planReorder({ subject: ANGLAIS, topics: oldDatabase() });
    expect([...plan.missing].sort()).toEqual([...NEW_KEYS].sort());
    expect(plan.loaded).toBe(38);
    expect(plan.notInProgramme).toEqual([]);
  });

  it("remet toutes les classes dans l'ordre du programme, après le chargement", () => {
    const rows = afterSeed(oldDatabase());
    const plan = planReorder({ subject: ANGLAIS, topics: rows });
    expect(plan.missing).toEqual([]);
    expect(plan.loaded).toBe(51);
    expect(plan.moves.length).toBeGreaterThan(0);
    const after = apply(rows, plan.moves);
    for (const klass of ["CI", "CP", "CE1", "CE2", "CM1", "CM2"] as const) {
      expect(keysOf(after, klass), klass).toEqual(ANGLAIS.classes[klass].map((topic) => topic.key));
    }
    expect(keysOf(after, "CI").slice(0, 4)).toEqual(["an-ci-abc-1", "an-ci-abc-2", "an-ci-abc-3", "an-ci-hello"]);
    expect(keysOf(after, "CM2")[0]).toBe("an-cm2-questions");
    expect(keysOf(after, "CE1")[0]).toBe("an-ce1-spell");
  });

  it("garde les classes dans l'ordre du CI au CM2 sur l'ensemble de la matière", () => {
    const rows = afterSeed(oldDatabase());
    const after = apply(rows, planReorder({ subject: ANGLAIS, topics: rows }).moves);
    const sequence = after
      .filter((row) => row.programmeKey?.startsWith("an-"))
      .sort((a, b) => a.order - b.order)
      .map((row) => row.programmeKey);
    expect(sequence).toEqual(programmeOrder(ANGLAIS).map((entry) => entry.key));
  });

  it("réutilise les rangs existants : aucun rang inventé ni en double, la thématique faite à la main ne bouge pas", () => {
    const rows = afterSeed(oldDatabase());
    const plan = planReorder({ subject: ANGLAIS, topics: rows });
    const after = apply(rows, plan.moves);
    const ordersOf = (list: readonly ReorderTopicRow[]) => list.filter(isEnglish).map((row) => row.order);
    expect([...ordersOf(after)].sort((a, b) => a - b)).toEqual([...ordersOf(rows)].sort((a, b) => a - b));
    expect(new Set(ordersOf(after)).size).toBe(ordersOf(after).length);
    expect(after.find((row) => row._id === "by-hand")?.order).toBe(20);
    expect(plan.moves.some((move) => move.topicId === "by-hand")).toBe(false);
  });

  it("n'écrit que des rangs : chaque déplacement va d'un rang à un autre rang déjà pris par une thématique du programme", () => {
    const rows = afterSeed(oldDatabase());
    const taken = new Set(rows.filter((row) => row.programmeKey?.startsWith("an-")).map((row) => row.order));
    for (const move of planReorder({ subject: ANGLAIS, topics: rows }).moves) {
      expect(taken.has(move.from), move.programmeKey).toBe(true);
      expect(taken.has(move.to), move.programmeKey).toBe(true);
      expect(move.from).not.toBe(move.to);
    }
  });

  it("est sans effet quand on la rejoue", () => {
    const rows = afterSeed(oldDatabase());
    const once = apply(rows, planReorder({ subject: ANGLAIS, topics: rows }).moves);
    const again = planReorder({ subject: ANGLAIS, topics: once });
    expect(again.moves).toEqual([]);
    expect(again.unchanged).toBe(51);
  });

  it("ne déplace rien dans une base chargée d'un coup, qui est déjà dans l'ordre", () => {
    const plan = planProgrammeSeed({ subjects: [], topics: [], only: ["anglais"] });
    const rows: ReorderTopicRow[] = plan.topics.flatMap((step) =>
      step.kind === "create" ? [{ _id: `id-${step.topic.key}`, order: step.order, class: step.klass, programmeKey: step.topic.key }] : [],
    );
    expect(rows).toHaveLength(51);
    expect(planReorder({ subject: ANGLAIS, topics: rows }).moves).toEqual([]);
  });

  it("ne touche pas aux autres matières, même quand leur base contient des rangs voisins", () => {
    const rows = afterSeed(oldDatabase());
    const plan = planReorder({ subject: ANGLAIS, topics: rows });
    expect(plan.moves.some((move) => move.topicId.startsWith("histoire"))).toBe(false);
    const histoire = PROGRAMME.find((subject) => subject.key === "histoire")!;
    const other = planReorder({ subject: histoire, topics: rows });
    expect(other.moves.some((move) => move.topicId.startsWith("id-an-"))).toBe(false);
    expect(other.loaded).toBe(2);
  });

  it("signale une thématique en base qui n'est plus au programme, et la laisse où elle est", () => {
    const rows: ReorderTopicRow[] = [...afterSeed(oldDatabase()), { _id: "old", order: 99, class: "CM1", programmeKey: "an-cm1-disparu" }];
    const plan = planReorder({ subject: ANGLAIS, topics: rows });
    expect(plan.notInProgramme).toEqual(["an-cm1-disparu"]);
    expect(plan.moves.some((move) => move.topicId === "old")).toBe(false);
  });

  it("lit l'ordre du programme du CI au CM2, 51 clés pour l'anglais", () => {
    const order = programmeOrder(ANGLAIS);
    expect(order).toHaveLength(51);
    expect(order[0]).toEqual({ key: "an-ci-abc-1", klass: "CI" });
    expect(order.at(-1)).toEqual({ key: "an-cm2-reading", klass: "CM2" });
    expect(allProgrammeEntries().filter((entry) => entry.topic.key.startsWith("an-"))).toHaveLength(order.length);
  });
});
