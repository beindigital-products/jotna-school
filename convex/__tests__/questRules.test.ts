import { describe, it, expect } from "vitest";
import {
  ALL_DONE_BONUS,
  QUESTS_PER_DAY,
  STAR_PER_QUEST,
  allDone,
  applyActivity,
  bonusStarsFor,
  completedCount,
  pickDailyQuests,
  seedFrom,
} from "../questRules";

const SUBJECTS = [
  { id: "s1", name: "Mathématiques" },
  { id: "s2", name: "Français" },
];

describe("pickDailyQuests", () => {
  it("tire toujours trois missions, la première facile", () => {
    const quests = pickDailyQuests({ seed: "eleve-a|2026-09-27", subjects: SUBJECTS });
    expect(quests).toHaveLength(QUESTS_PER_DAY);
    expect(quests[0].type).toBe("do_exercises");
    expect(quests[0].target).toBeLessThanOrEqual(5);
    for (const q of quests) {
      expect(q.target).toBeGreaterThan(0);
      expect(q.progress).toBe(0);
      expect(q.completedAt).toBeUndefined();
      expect(q.label.length).toBeGreaterThan(0);
    }
  });

  it("est déterministe pour une même graine", () => {
    const a = pickDailyQuests({ seed: "eleve-a|2026-09-27", subjects: SUBJECTS });
    const b = pickDailyQuests({ seed: "eleve-a|2026-09-27", subjects: SUBJECTS });
    expect(a).toEqual(b);
  });

  it("change avec le jour ou l'élève", () => {
    // Sur trente jours, deux tirages identiques d'affilée seraient suspects.
    const days = Array.from({ length: 30 }, (_, i) =>
      JSON.stringify(pickDailyQuests({ seed: `eleve-a|2026-09-${String(i + 1).padStart(2, "0")}`, subjects: SUBJECTS })),
    );
    expect(new Set(days).size).toBeGreaterThan(5);
    expect(seedFrom("a")).not.toBe(seedFrom("b"));
  });

  it("colore la troisième mission par une matière quand il y en a", () => {
    const quests = pickDailyQuests({ seed: "x|2026-01-01", subjects: SUBJECTS });
    expect(quests[2].type).toBe("play_subject");
    expect(SUBJECTS.map((s) => s.id)).toContain(quests[2].subjectId);
    expect(quests[2].label).toContain(quests[2].subjectName ?? "");
  });

  it("retombe sur des étoiles sans aucune matière", () => {
    const quests = pickDailyQuests({ seed: "x|2026-01-01", subjects: [] });
    expect(quests[2].type).toBe("earn_stars");
  });
});

describe("applyActivity", () => {
  const base = pickDailyQuests({ seed: "t|2026-02-02", subjects: SUBJECTS });

  it("fait avancer les missions concernées, borne à la cible, date la fin une fois", () => {
    const easyTarget = base[0].target;
    const first = applyActivity(base, { exercises: easyTarget - 1, stars: 0, palierValidated: false }, 1000);
    expect(first.quests[0].progress).toBe(easyTarget - 1);
    expect(first.newlyCompleted).toHaveLength(0);

    const second = applyActivity(first.quests, { exercises: 50, stars: 0, palierValidated: false }, 2000);
    expect(second.quests[0].progress).toBe(easyTarget);
    expect(second.quests[0].completedAt).toBe(2000);
    expect(second.newlyCompleted.map((q) => q.key)).toContain("q1");

    // Une mission finie ne bouge plus, même avec de l'activité.
    const third = applyActivity(second.quests, { exercises: 99, stars: 0, palierValidated: false }, 3000);
    expect(third.quests[0].completedAt).toBe(2000);
    expect(third.newlyCompleted.find((q) => q.key === "q1")).toBeUndefined();
  });

  it("ne compte une matière que si c'est la bonne", () => {
    const subjectQuest = base[2];
    expect(subjectQuest.type).toBe("play_subject");
    const wrong = applyActivity(base, { exercises: 10, stars: 0, palierValidated: false, subjectId: "autre" }, 1);
    expect(wrong.quests[2].progress).toBe(0);
    const right = applyActivity(base, { exercises: 10, stars: 0, palierValidated: false, subjectId: subjectQuest.subjectId }, 1);
    expect(right.quests[2].completedAt).toBe(1);
  });
});

describe("récompense", () => {
  it("une étoile par mission, deux de plus quand tout est fait", () => {
    expect(bonusStarsFor(0, 3)).toBe(0);
    expect(bonusStarsFor(1, 3)).toBe(STAR_PER_QUEST);
    expect(bonusStarsFor(3, 3)).toBe(3 * STAR_PER_QUEST + ALL_DONE_BONUS);
  });

  it("allDone et completedCount se tiennent", () => {
    const quests = pickDailyQuests({ seed: "z|2026-03-03", subjects: SUBJECTS });
    expect(allDone(quests)).toBe(false);
    const done = applyActivity(quests, { exercises: 100, stars: 100, palierValidated: true, subjectId: quests[2].subjectId }, 5);
    expect(completedCount(done.quests)).toBe(3);
    expect(allDone(done.quests)).toBe(true);
  });
});
