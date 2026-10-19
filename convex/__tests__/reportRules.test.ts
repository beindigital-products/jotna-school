import { describe, expect, it } from "vitest";
import { buildTopicReport, formatExerciseType } from "../reportRules";

const answers = (...results: boolean[]) => results.map((isCorrect) => ({ isCorrect }));

describe("buildTopicReport", () => {
  it("le score est la part des bonnes réponses parmi les réponses données", () => {
    const report = buildTopicReport([
      { type: "qcm", prompt: "2 + 2 ?", answers: answers(true) },
      { type: "qcm", prompt: "3 × 4 ?", answers: answers(false, true) },
      { type: "short-answer", prompt: "10 − 7 ?", answers: answers(false, false, false, true) },
    ]);
    expect(report?.score).toBeCloseTo(3 / 7);
  });

  it("les forces et les faiblesses sont des types d'exercice, en français", () => {
    const report = buildTopicReport([
      { type: "qcm", prompt: "a", answers: answers(true, true, true, true, true) },
      { type: "order", prompt: "b", answers: answers(true, false, false) },
      { type: "match", prompt: "c", answers: answers(true, false) },
    ]);
    expect(report?.strengths).toEqual(["Questions à choix multiples"]);
    expect(report?.weaknesses).toEqual(["Remise en ordre"]);
  });

  it("une erreur fréquente : trois réponses ou plus, une majorité fausses, un énoncé une fois", () => {
    const report = buildTopicReport([
      { type: "qcm", prompt: "Combien de côtés a un carré ?", answers: answers(false, false, true) },
      { type: "qcm", prompt: "Combien de côtés a un carré ?", answers: answers(false, false, false) },
      { type: "qcm", prompt: "5 + 5 ?", answers: answers(false, true) },
      { type: "qcm", prompt: "6 + 6 ?", answers: answers(false, true, true) },
    ]);
    expect(report?.frequentMistakes).toEqual(["Combien de côtés a un carré ?"]);
  });

  it("sans réponse, pas de bulletin", () => {
    expect(buildTopicReport([])).toBeNull();
    expect(buildTopicReport([{ type: "qcm", prompt: "a", answers: [] }])).toBeNull();
  });

  it("un type inconnu garde sa clé", () => {
    expect(formatExerciseType("drag-drop")).toBe("Glisser-déposer");
    expect(formatExerciseType("nouveau")).toBe("nouveau");
  });
});
