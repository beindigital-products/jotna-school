import { describe, expect, it } from "vitest";
import {
  acceptedForms,
  formatNumber,
  isFraction,
  isNumericForm,
  numericallyEqual,
  repairMathExercise,
  solveOrEvaluate,
} from "../paliers/mathRepair";

describe("solveOrEvaluate", () => {
  it.each([
    ["3 × 5 + 2", 17],
    ["10 − 2 × 3", 4],
    ["24 ÷ 6", 4],
    ["(3/4) + (1/2)", 1.25],
    ["2,5 + 1", 3.5],
    ["3 x 4", 12],
    ["3 * 2 + 1", 7],
    ["(8 ÷ 4) + (-3 × 2)", -4],
    ["3^2", 9],
    ["3² + 4²", 25],
    ["(-2)^2 - 4", 0],
    ["? × 6 = 24", 4],
    ["3 × ? = 21", 7],
    ["12 − ? = 5", 7],
    ["? + 3 = 10", 7],
    ["? − 4 = 6", 10],
    ["? ÷ 3 = 5", 15],
    ["20 ÷ ? = 4", 5],
    ["7 × 8 = ?", 56],
    ["? = 7 × 8", 56],
    ["___ × 6 = 24", 4],
    ["… + 3 = 10", 7],
    ["25 - x = 15", 10],
    ["1/2 + x = 3/4", 0.25],
    ["x × (1/3) = 2", 6],
    ["3 × 4 + ? = 15", 3],
    ["2 × ? + 4 = 10", 3],
    ["3 × ? + 2 = 14", 4],
    ["2 × (6 + ?) = 28", 8],
    ["2 × (5 + ?) = 30", 10],
    ["7 × 8 = 56", 56],
    ["7 × 8 = 54", 56],
    ["2 × 6 = 3 × 4", 12],
  ])("%s → %d", (expression, expected) => {
    expect(solveOrEvaluate(expression)).toBeCloseTo(expected, 6);
  });

  it.each([
    [""],
    ["? × ? = 24"],
    ["? × 0 = 5"],
    ["a + b"],
    ["12 = 4 = 3"],
    ["2 × 6 = 3 × 5"],
    ["2 × (6 + ?)"],
    ["4 × (2x + 3)"],
    ["π × 3² × 5"],
    ["-log(1e-7)"],
  ])("renonce sur %s", (expression) => {
    expect(solveOrEvaluate(expression)).toBeNull();
  });
});

describe("formes de réponse", () => {
  it("isNumericForm : un nombre, une unité au plus", () => {
    for (const ok of ["17", "-4", "2,5", "18 m", "60 cm³", "2000 FCFA", "60%", "1 000", "5,285714285714286"]) {
      expect(isNumericForm(ok), ok).toBe(true);
    }
    for (const ko of ["8x + 12", "2√3", "1/3", "3/2", "quinze", "", "x"]) {
      expect(isNumericForm(ko), ko).toBe(false);
    }
  });
  it("isFraction", () => {
    expect(isFraction("3/4")).toBe(true);
    expect(isFraction(" 1 / 2 ")).toBe(true);
    expect(isFraction("0.75")).toBe(false);
  });
  it("numericallyEqual : même nombre, formes différentes", () => {
    expect(numericallyEqual("18 m", "18")).toBe(true);
    expect(numericallyEqual("1600 FCFA", "1600")).toBe(true);
    expect(numericallyEqual("2,5", "2.5")).toBe(true);
    expect(numericallyEqual("60%", "0.6")).toBe(true);
    expect(numericallyEqual("1 000", "1000")).toBe(true);
    expect(numericallyEqual("0.33", "0.333")).toBe(true);
    expect(numericallyEqual("17", "15")).toBe(false);
    expect(numericallyEqual("1/2", "0.5")).toBe(false);
    expect(numericallyEqual("quinze", "15")).toBe(false);
  });
  it("formatNumber / acceptedForms", () => {
    expect(formatNumber(17)).toBe("17");
    expect(formatNumber(2.5)).toBe("2.5");
    expect(formatNumber(0.1 + 0.2)).toBe("0.3");
    expect(formatNumber(-0)).toBe("0");
    expect(acceptedForms(17)).toEqual(["17"]);
    expect(acceptedForms(2.5)).toEqual(["2.5", "2,5"]);
  });
});

describe("repairMathExercise — QCM", () => {
  const base = { type: "qcm", mathExpression: "3 × 5 + 2" };

  it("la question 6 du palier 2 : 17 était l'option 0, le modèle pointait 15", () => {
    const outcome = repairMathExercise({
      ...base,
      answerKey: "15",
      payload: { options: ["17", "15", "10"], correctIndex: 1, explanation: "on garde 15" },
    });
    expect(outcome).toEqual({
      kind: "repaired",
      computed: 17,
      previous: "15",
      answerKey: "17",
      payload: { options: ["17", "15", "10"], correctIndex: 0 },
      change: "option",
    });
  });

  it("« 5 × 6 » : clé 30 juste, index sur 36 : l'index bouge", () => {
    const outcome = repairMathExercise({
      type: "qcm",
      mathExpression: "5 × 6",
      answerKey: "30",
      payload: { options: ["30", "25", "35", "36"], correctIndex: 3 },
    });
    expect(outcome).toMatchObject({ kind: "repaired", change: "option", previous: "36", payload: { correctIndex: 0 } });
  });

  it("deux options qui valent le résultat : celle pointée reste", () => {
    expect(
      repairMathExercise({
        type: "qcm",
        mathExpression: "3/4 − 1/4",
        answerKey: "2/4",
        payload: { options: ["1/2", "2/4", "3/4"], correctIndex: 1 },
      }),
    ).toEqual({ kind: "ok", computed: 0.5 });
  });

  it("options avec unité : « 3 FCFA » vaut 3", () => {
    const outcome = repairMathExercise({
      type: "qcm",
      mathExpression: "15 - (2 × 6)",
      answerKey: "3 FCFA",
      payload: { options: ["3 FCFA", "9 FCFA", "5 FCFA"], correctIndex: 2 },
    });
    expect(outcome).toMatchObject({ kind: "repaired", change: "option", payload: { correctIndex: 0 } });
  });

  it("aucune option ne vaut le résultat : l'option pointée prend la valeur, unité comprise", () => {
    const outcome = repairMathExercise({
      type: "qcm",
      mathExpression: "4000 - (2 × 1200)",
      answerKey: "2000 FCFA",
      payload: { options: ["2000 FCFA", "2800 FCFA", "3000 FCFA"], correctIndex: 0 },
    });
    expect(outcome).toEqual({
      kind: "repaired",
      computed: 1600,
      previous: "2000 FCFA",
      answerKey: "1600",
      payload: { options: ["1600 FCFA", "2800 FCFA", "3000 FCFA"], correctIndex: 0 },
      change: "value",
    });
  });

  it("option juste, clé fausse : seule la clé change", () => {
    const outcome = repairMathExercise({
      ...base,
      answerKey: "15",
      payload: { options: ["17", "15", "10"], correctIndex: 0 },
    });
    expect(outcome).toMatchObject({ kind: "repaired", change: "key", answerKey: "17", payload: { correctIndex: 0 } });
  });

  it("tout est cohérent : ok, payload intact", () => {
    expect(
      repairMathExercise({
        ...base,
        answerKey: "17",
        payload: { options: ["17", "15", "10"], correctIndex: 0, explanation: "3 × 5 = 15, + 2 = 17" },
      }),
    ).toEqual({ kind: "ok", computed: 17 });
  });

  it("f(2) pour f(x) = 3x + 1 : l'expression est calculée, l'index corrigé", () => {
    const outcome = repairMathExercise({
      type: "qcm",
      mathExpression: "3 * 2 + 1",
      answerKey: "7",
      payload: { options: ["5", "6", "7", "8"], correctIndex: 1 },
    });
    expect(outcome).toMatchObject({ kind: "repaired", change: "option", payload: { correctIndex: 2 } });
  });
});

describe("repairMathExercise — réponse courte", () => {
  it("remplace une clé fausse et ses formes acceptées", () => {
    const outcome = repairMathExercise({
      type: "short-answer",
      mathExpression: "10 − 2 × 3",
      answerKey: "24",
      payload: { acceptedAnswers: ["24", "24,0"], explanation: "10 − 2 = 8, × 3 = 24" },
    });
    expect(outcome).toEqual({
      kind: "repaired",
      computed: 4,
      previous: "24",
      answerKey: "4",
      payload: { acceptedAnswers: ["4"] },
      change: "value",
    });
  });

  it("résout un trou : « ? × 6 = 24 » attend 4", () => {
    expect(
      repairMathExercise({
        type: "short-answer",
        mathExpression: "? × 6 = 24",
        answerKey: "4",
        payload: { acceptedAnswers: ["4"] },
      }),
    ).toEqual({ kind: "ok", computed: 4 });
    const wrong = repairMathExercise({
      type: "short-answer",
      mathExpression: "? × 6 = 24",
      answerKey: "6",
      payload: { acceptedAnswers: ["6"] },
    });
    expect(wrong).toMatchObject({ kind: "repaired", answerKey: "4" });
  });

  it("une forme acceptée fausse à côté de la bonne est retirée", () => {
    const outcome = repairMathExercise({
      type: "short-answer",
      mathExpression: "5 × 3",
      answerKey: "15",
      payload: { acceptedAnswers: ["15", "16"] },
    });
    expect(outcome).toMatchObject({ kind: "repaired", previous: "16", payload: { acceptedAnswers: ["15"] } });
  });

  it("un décimal accepte le point et la virgule", () => {
    const outcome = repairMathExercise({
      type: "short-answer",
      mathExpression: "5 ÷ 2",
      answerKey: "2",
      payload: { acceptedAnswers: ["2"] },
    });
    expect(outcome).toMatchObject({ kind: "repaired", payload: { acceptedAnswers: ["2.5", "2,5"] } });
  });

  it("les arrondis écrits par le modèle sont justes : « 0,33 » pour un tiers", () => {
    expect(
      repairMathExercise({
        type: "short-answer",
        mathExpression: "2/3 - 1/3",
        answerKey: "1/3",
        payload: { acceptedAnswers: ["1/3", "0.33"], tolerance: "0.01" },
      }),
    ).toEqual({ kind: "ok", computed: 1 / 3 });
    expect(
      repairMathExercise({
        type: "short-answer",
        mathExpression: "3.7 ÷ 0.7",
        answerKey: "5,285714285714286",
        payload: { acceptedAnswers: ["5,285714285714286", "5,29", "5,3"] },
      }).kind,
    ).toBe("ok");
    expect(
      repairMathExercise({
        type: "short-answer",
        mathExpression: "3 / (3 + 2)",
        answerKey: "0.6",
        payload: { acceptedAnswers: ["0.6", "60%"] },
      }).kind,
    ).toBe("ok");
  });

  it("une clé avec unité juste reste telle quelle", () => {
    expect(
      repairMathExercise({
        type: "short-answer",
        mathExpression: "2 × (7 + 2)",
        answerKey: "18 m",
        payload: { acceptedAnswers: ["18 m", "18"] },
      }),
    ).toEqual({ kind: "ok", computed: 18 });
  });
});

describe("repairMathExercise — ce qu'on laisse", () => {
  it("sans expression, type sans réponse numérique, clé non numérique ou algèbre : skipped", () => {
    expect(
      repairMathExercise({ type: "short-answer", mathExpression: null, answerKey: "4", payload: {} }).kind,
    ).toBe("skipped");
    expect(
      repairMathExercise({ type: "order", mathExpression: "1 + 1", answerKey: '["1","2"]', payload: {} }).kind,
    ).toBe("skipped");
    expect(
      repairMathExercise({ type: "short-answer", mathExpression: "1 + 1", answerKey: "deux", payload: {} }).kind,
    ).toBe("skipped");
    expect(
      repairMathExercise({
        type: "short-answer",
        mathExpression: "4 × (2x + 3)",
        answerKey: "8x + 12",
        payload: { acceptedAnswers: ["8x + 12"] },
      }).kind,
    ).toBe("skipped");
  });

  it("expression illisible : unrepairable, parse_error", () => {
    expect(
      repairMathExercise({
        type: "short-answer",
        mathExpression: "π × 3² × 5",
        answerKey: "141,3",
        payload: { acceptedAnswers: ["141,3"] },
      }),
    ).toEqual({ kind: "unrepairable", reason: "parse_error" });
  });

  it("clé en fraction qui diverge : unrepairable, fraction", () => {
    expect(
      repairMathExercise({
        type: "short-answer",
        mathExpression: "(1/2) + (1/4)",
        answerKey: "1/2",
        payload: { acceptedAnswers: ["1/2"] },
      }),
    ).toEqual({ kind: "unrepairable", reason: "fraction", computed: 0.75 });
  });

  it("clé en fraction juste : ok", () => {
    expect(
      repairMathExercise({
        type: "short-answer",
        mathExpression: "(1/2) + (1/4)",
        answerKey: "3/4",
        payload: { acceptedAnswers: ["3/4"] },
      }),
    ).toEqual({ kind: "ok", computed: 0.75 });
  });
});

describe("repairMathExercise — l'énoncé fait foi", () => {
  it("l'égalité à trou de l'énoncé se résout, même si l'expression est illisible", () => {
    expect(
      repairMathExercise({
        type: "short-answer",
        prompt: "Complète : 3 × 4 + ? = 15.",
        mathExpression: "3 × 4 + ? = 15",
        answerKey: "3",
        payload: { acceptedAnswers: ["3"] },
      }),
    ).toEqual({ kind: "ok", computed: 3 });
    expect(
      repairMathExercise({
        type: "short-answer",
        prompt: "Complète : ? × 4 = 24",
        mathExpression: "5 × 4 = 24",
        answerKey: "5",
        payload: { acceptedAnswers: ["5"] },
      }),
    ).toMatchObject({ kind: "repaired", computed: 6, answerKey: "6" });
    expect(
      repairMathExercise({
        type: "qcm",
        prompt: "Trouve le nombre : 3 × ? = 9 ?",
        mathExpression: "3 × 3",
        answerKey: "3",
        payload: { options: ["2", "3", "9"], correctIndex: 2 },
      }),
    ).toMatchObject({ kind: "repaired", change: "option", payload: { correctIndex: 1 } });
  });

  it("l'énoncé rempli par le modèle : cohérent, la clé reste", () => {
    expect(
      repairMathExercise({
        type: "short-answer",
        prompt: "Complète : ? × 4 = 16",
        mathExpression: "4 × 4 = 16",
        answerKey: "4",
        payload: { acceptedAnswers: ["4"] },
      }),
    ).toEqual({ kind: "ok", computed: 4 });
    expect(
      repairMathExercise({
        type: "short-answer",
        prompt: "Quel nombre multiplié par 4 donne 28 ?",
        mathExpression: "7 × 4 = 28",
        answerKey: "7",
        payload: { acceptedAnswers: ["7"] },
      }),
    ).toEqual({ kind: "ok", computed: 7 });
  });

  it("l'énoncé rempli et faux, trou inconnu : à relire", () => {
    expect(
      repairMathExercise({
        type: "short-answer",
        prompt: "Quel nombre multiplié par 4 donne 28 ?",
        mathExpression: "6 × 4 = 28",
        answerKey: "6",
        payload: { acceptedAnswers: ["6"] },
      }),
    ).toEqual({ kind: "unrepairable", reason: "inconsistent" });
  });

  it("problème en mots : une expression lue de gauche à droite compte", () => {
    expect(
      repairMathExercise({
        type: "short-answer",
        prompt: "Si le périmètre d'un rectangle est 24 cm et que sa longueur est 10 cm, quelle est sa largeur ?",
        mathExpression: "24 - 10 - 10 ÷ 2",
        answerKey: "2",
        payload: { acceptedAnswers: ["2"] },
      }),
    ).toEqual({ kind: "ok", computed: 2 });
  });

  it("énoncé en symboles : les priorités s'imposent", () => {
    expect(
      repairMathExercise({
        type: "short-answer",
        prompt: "Quel est le résultat de 10 − 2 × 3 ?",
        mathExpression: "10 − 2 × 3",
        answerKey: "24",
        payload: { acceptedAnswers: ["24"] },
      }),
    ).toMatchObject({ kind: "repaired", answerKey: "4" });
  });

  it("une tolérance déclarée est respectée", () => {
    expect(
      repairMathExercise({
        type: "short-answer",
        prompt: "Un produit coûte 8000 FCFA après une hausse de 20 %. Quel était son prix ?",
        mathExpression: "8000 / 1.20",
        answerKey: "6666 FCFA",
        payload: { acceptedAnswers: ["6666 FCFA"], tolerance: "1%" },
      }).kind,
    ).toBe("ok");
    expect(
      repairMathExercise({
        type: "short-answer",
        prompt: "Calcule la moyenne de 15, 17, 13 et 12.",
        mathExpression: "(15 + 17 + 13 + 12) / 4",
        answerKey: "14.25",
        payload: { acceptedAnswers: ["14.25", "14.3"], tolerance: "0.1" },
      }).kind,
    ).toBe("ok");
  });
});

describe("solveOrEvaluate — lectures de plus", () => {
  it.each([
    ["√36", 6],
    ["√(16) + 2", 6],
    ["3/4 ÷ 1/2", 1.5],
    ["5/6 + 1/3", 7 / 6],
    ["50g × 4", 200],
    ["3 cm × 4 cm", 12],
    ["30 = 2 × (10 + largeur)", 5],
    ["10 + largeur = 15", 5],
    ["4 × ? = 16", 4],
  ])("%s → %d", (expression, expected) => {
    expect(solveOrEvaluate(expression)).toBeCloseTo(expected, 6);
  });
  it("deux mots différents : on ne devine pas", () => {
    expect(solveOrEvaluate("2 × (longueur + largeur) = 30")).toBeNull();
  });
});

describe("repairMathExercise — quotient entier et trous", () => {
  it("un problème en mots avec une division : le quotient entier est la réponse", () => {
    expect(
      repairMathExercise({
        type: "qcm",
        prompt: "Ousmane a 10 FCFA et veut acheter des mangues à 3 FCFA chacune. Combien de mangues peut-il acheter ?",
        mathExpression: "10 ÷ 3",
        answerKey: "3 mangues",
        payload: { options: ["3 mangues", "4 mangues", "2 mangues"], correctIndex: 0 },
      }),
    ).toEqual({ kind: "ok", computed: 3 });
  });
  it("une expression à trou avec la clé comme opérande n'est pas un énoncé rempli", () => {
    expect(
      repairMathExercise({
        type: "short-answer",
        prompt: "Complète : 4 fois ? = 16",
        mathExpression: "4 × ? = 16",
        answerKey: "4",
        payload: { acceptedAnswers: ["4"] },
      }),
    ).toEqual({ kind: "ok", computed: 4 });
  });
  it("« Résous 3/4 ÷ 1/2 » : 3/2 est juste", () => {
    expect(
      repairMathExercise({
        type: "short-answer",
        prompt: "Résous 3/4 ÷ 1/2.",
        mathExpression: "3/4 ÷ 1/2",
        answerKey: "3/2",
        payload: { acceptedAnswers: ["3/2", "1,5"] },
      }),
    ).toEqual({ kind: "ok", computed: 1.5 });
  });
});
