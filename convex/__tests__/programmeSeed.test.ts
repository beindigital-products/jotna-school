import { describe, expect, it } from "vitest";
import { planProgrammeSeed, type DbSubjectRow, type DbTopicRow } from "../programme/seedPlan";
import { PROGRAMME, allProgrammeEntries } from "../programme";

const TOTAL = allProgrammeEntries().length;

/** La base de développement d'aujourd'hui, en résumé. */
function devDatabase(): { subjects: DbSubjectRow[]; topics: DbTopicRow[] } {
  const subjects: DbSubjectRow[] = [
    { _id: "math", name: "Mathématiques" },
    { _id: "fr", name: "Français" },
    { _id: "sci", name: "Sciences" },
    { _id: "hg", name: "Histoire-Géographie" },
    { _id: "en", name: "Anglais" },
    { _id: "ap", name: "Arts plastiques" },
    { _id: "mu", name: "Éducation musicale" },
    { _id: "emc", name: "EMC" },
    { _id: "philo", name: "Philosophie" },
  ];
  const topics: DbTopicRow[] = [];
  let n = 0;
  for (const klass of ["CI", "CP", "CE1", "CE2", "CM1", "CM2"]) {
    for (const subjectId of ["math", "fr"]) {
      for (let i = 0; i < 6; i++) {
        topics.push({ _id: `t${n++}`, subjectId, name: `${subjectId} ${klass} ${i}`, order: n, class: klass });
      }
    }
  }
  topics.push({ _id: "college", subjectId: "philo", name: "La conscience", order: 1, class: "Tle" });
  return { subjects, topics };
}

describe("le chargement du programme", () => {
  it("dans une base vide, crée les sept matières et toutes les thématiques", () => {
    const plan = planProgrammeSeed({ subjects: [], topics: [] });
    expect(plan.subjects.filter((s) => s.kind === "create")).toHaveLength(PROGRAMME.length);
    expect(plan.report.topicsToCreate).toBe(TOTAL);
    expect(plan.topics.every((t) => t.kind === "create")).toBe(true);
  });

  it("garde les mathématiques et le français déjà garnis, renomme les matières vides, en crée deux", () => {
    const plan = planProgrammeSeed(devDatabase());
    const byKey = Object.fromEntries(plan.subjects.map((s) => [s.key, s]));
    expect(byKey["mathematiques"]).toMatchObject({ kind: "use", subjectId: "math" });
    expect(byKey["francais"]).toMatchObject({ kind: "use", subjectId: "fr" });
    expect(byKey["eveil-scientifique"]).toMatchObject({ kind: "rename", subjectId: "sci", to: "Éveil scientifique" });
    expect(byKey["histoire"]).toMatchObject({ kind: "rename", subjectId: "hg", to: "Histoire" });
    expect(byKey["geographie"]).toMatchObject({ kind: "create", name: "Géographie" });
    expect(byKey["instruction-civique"]).toMatchObject({ kind: "rename", subjectId: "emc" });
    expect(byKey["education-artistique"]).toMatchObject({ kind: "rename", subjectId: "ap" });

    // Douze classes gardées (6 en maths, 6 en français), aucune thématique ajoutée.
    expect(plan.report.classesKept).toHaveLength(12);
    const created = plan.topics.filter((t) => t.kind === "create");
    expect(created.some((t) => t.kind === "create" && (t.subjectKey === "mathematiques" || t.subjectKey === "francais"))).toBe(false);
    const expected = PROGRAMME.filter((s) => s.key !== "mathematiques" && s.key !== "francais").reduce(
      (sum, s) => sum + Object.values(s.classes).reduce((n, list) => n + list.length, 0),
      0,
    );
    expect(plan.report.topicsToCreate).toBe(expected);

    // « Éducation musicale », vide, n'a plus de raison d'être.
    expect(plan.report.emptyLeftovers).toEqual([
      "Éducation musicale (vide, remplacée par « Éducation artistique »)",
    ]);
  });

  it("en mode « merge », complète les classes garnies et adopte une thématique du même nom", () => {
    const db = devDatabase();
    db.topics.push({ _id: "same", subjectId: "math", name: "Les nombres jusqu'à 10", order: 99, class: "CI" });
    const plan = planProgrammeSeed({ ...db, mode: "merge", only: ["mathematiques"] });
    expect(plan.report.classesKept).toHaveLength(0);
    expect(plan.topics).toContainEqual({
      kind: "adopt",
      topicId: "same",
      programmeKey: "ma-ci-nombres-10",
      name: "Les nombres jusqu'à 10",
    });
    expect(plan.subjects).toHaveLength(1);
  });

  it("relancé après un premier chargement, ne recrée rien", () => {
    const first = planProgrammeSeed({ subjects: [], topics: [] });
    const subjects: DbSubjectRow[] = first.subjects.map((s, i) => ({
      _id: `s${i}`,
      name: s.kind === "create" ? s.name : "?",
    }));
    const idOf = new Map(first.subjects.map((s, i) => [s.key, `s${i}`]));
    const topics: DbTopicRow[] = first.topics.map((t, i) =>
      t.kind === "create"
        ? { _id: `t${i}`, subjectId: idOf.get(t.subjectKey)!, name: t.topic.name, order: t.order, class: t.klass, programmeKey: t.topic.key }
        : { _id: `t${i}`, subjectId: "?", name: "?", order: 0 },
    );
    const second = planProgrammeSeed({ subjects, topics });
    expect(second.report.topicsToCreate).toBe(0);
    expect(second.report.topicsAlreadyLoaded).toBe(TOTAL);
    expect(second.subjects.every((s) => s.kind === "use")).toBe(true);
  });

  it("une thématique renommée par un administrateur reste reconnue par sa clé", () => {
    const db = { subjects: [{ _id: "h", name: "Histoire" }], topics: [] as DbTopicRow[] };
    db.topics.push({ _id: "x", subjectId: "h", name: "Les empires d'Afrique", order: 1, class: "CM2", programmeKey: "hi-cm2-empires" });
    const plan = planProgrammeSeed({ ...db, only: ["histoire"] });
    expect(plan.topics.some((t) => t.kind === "create" && t.topic.key === "hi-cm2-empires")).toBe(false);
    // La classe a déjà une thématique du programme : on complète, on ne la garde pas « à la main ».
    expect(plan.topics.some((t) => t.kind === "create" && t.topic.key === "hi-cm2-traite")).toBe(true);
  });

  it("place les nouvelles thématiques après celles qui existent", () => {
    const plan = planProgrammeSeed({
      subjects: [{ _id: "g", name: "Géographie" }],
      topics: [{ _id: "old", subjectId: "g", name: "Ancienne", order: 40, class: "Tle" }],
      only: ["geographie"],
    });
    const orders = plan.topics.flatMap((t) => (t.kind === "create" ? [t.order] : []));
    expect(Math.min(...orders)).toBe(41);
    expect(new Set(orders).size).toBe(orders.length);
  });

  it("une matière trouvée sous un ancien nom mais déjà garnie garde son nom", () => {
    const plan = planProgrammeSeed({
      subjects: [{ _id: "sci", name: "Sciences" }],
      topics: [{ _id: "a", subjectId: "sci", name: "Les volcans", order: 1, class: "CM2" }],
      only: ["eveil-scientifique"],
    });
    expect(plan.subjects[0]).toMatchObject({ kind: "use", subjectId: "sci", dbName: "Sciences" });
    // Le CM2 est garni à la main, les autres classes reçoivent le programme.
    expect(plan.report.classesKept).toEqual(["Sciences CM2 : 1 thématique existante gardée"]);
  });
});
