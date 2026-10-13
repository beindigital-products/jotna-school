import { describe, expect, it, vi } from "vitest";

// Un catalogue de test : le vrai est rempli quand les images sont fabriquées. Les
// fonctions d'origine gardent leur catalogue (vide) en valeur par défaut : on leur
// donne celui du test.
vi.mock("../../lib/exercise-images", async (importOriginal) => {
  const original = await importOriginal<typeof import("../../lib/exercise-images")>();
  const catalogue = [
    { id: "chat", alt: "Un chat assis", about: "un chat" },
    { id: "mangue", alt: "Une mangue mûre", about: "une mangue avec sa feuille" },
  ];
  return {
    ...original,
    EXERCISE_IMAGES: catalogue,
    findExerciseImage: (id: unknown, c = catalogue) => original.findExerciseImage(id, c),
    exerciseImageIdOf: (payload: unknown, c = catalogue) => original.exerciseImageIdOf(payload, c),
    exerciseImageCatalogueText: (c = catalogue) => original.exerciseImageCatalogueText(c),
  };
});

import { sanitizePayload } from "../paliers/exerciseRules";
import { auditExercise } from "../paliers/exerciseAudit";
import { guardVisuals, findMissingVisualOnScreen } from "../paliers/missingVisual";
import { buildPalierBaseSystemPrompt, imagesRule } from "../paliers/prompts";

const flat = (text: string) => text.replace(/\s+/g, " ");

describe("une image du catalogue est une scène à l'écran", () => {
  const qcm = { options: ["chat", "chien", "poule"], correctIndex: 0 };

  it("« Regarde l'image » passe quand l'exercice porte une image du catalogue", () => {
    expect(findMissingVisualOnScreen("Regarde l'image. Quel animal vois-tu ?", "qcm", qcm)).toBe(
      "points_at_absent_image",
    );
    expect(findMissingVisualOnScreen("Regarde l'image. Quel animal vois-tu ?", "qcm", { ...qcm, image: "chat" })).toBeNull();
  });

  it("un identifiant hors catalogue ne vaut pas une image", () => {
    expect(
      findMissingVisualOnScreen("Regarde l'image. Quel animal vois-tu ?", "qcm", { ...qcm, image: "licorne" }),
    ).toBe("points_at_absent_image");
  });

  it("l'image ne sert jamais à compter : « combien de billes as-tu » reste refusé", () => {
    expect(findMissingVisualOnScreen("Combien de billes as-tu ?", "short-answer", { acceptedAnswers: ["5"], image: "chat" })).toBe(
      "counts_what_is_not_there",
    );
  });

  it("garde les indices qui parlent de l'image quand elle est là, les retire sinon", () => {
    const base = {
      type: "qcm",
      prompt: "Quel animal vois-tu ?",
      answerKey: "chat",
      hints: ["Regarde l'image.", "Pense aux moustaches."],
      mathExpression: null,
    };
    expect(guardVisuals({ ...base, payload: { ...qcm, image: "chat" } })).toMatchObject({
      kind: "accepted",
      hints: ["Regarde l'image.", "Pense aux moustaches."],
    });
    expect(guardVisuals({ ...base, payload: qcm })).toMatchObject({
      kind: "accepted",
      hints: ["Pense aux moustaches."],
    });
  });

  it("le contrôleur ne signale plus de scène absente quand l'image est là", () => {
    const input = {
      type: "qcm",
      prompt: "Regarde l'image. Quel animal vois-tu ?",
      answerKey: "chat",
      hints: ["Regarde bien.", "Il miaule."],
    };
    const codes = (payload: unknown) => auditExercise({ ...input, payload }).map((d) => d.code);
    expect(codes(qcm)).toContain("visual_missing");
    expect(codes({ ...qcm, image: "chat" })).not.toContain("visual_missing");
  });
});

describe("l'image passe au joueur, et seulement si elle est du catalogue", () => {
  it("garde l'image d'un QCM, sans révéler la bonne réponse", () => {
    const safe = sanitizePayload("qcm", { options: ["chat", "chien"], correctIndex: 0, image: "chat" }, "e1", "s") as Record<string, unknown>;
    expect(safe).toEqual({ options: ["chat", "chien"], image: "chat" });
    expect(safe).not.toHaveProperty("correctIndex");
  });

  it("garde l'image quel que soit le type", () => {
    const safe = sanitizePayload("short-answer", { acceptedAnswers: ["chat"], image: "mangue" }, "e1", "s") as Record<string, unknown>;
    expect(safe.image).toBe("mangue");
    expect(safe).not.toHaveProperty("acceptedAnswers");
  });

  it("écarte un identifiant inconnu ou dangereux", () => {
    for (const image of ["licorne", "../../etc/passwd", 42, null]) {
      const safe = sanitizePayload("qcm", { options: ["a", "b"], correctIndex: 0, image }, "e1", "s") as Record<string, unknown>;
      expect(safe, String(image)).not.toHaveProperty("image");
    }
  });
});

describe("la consigne de génération dit au modèle quelles images il peut montrer", () => {
  it("liste le catalogue et ses limites", () => {
    const rule = flat(imagesRule());
    expect(rule).toContain("catalogue fermé");
    expect(rule).toContain("- chat : un chat");
    expect(rule).toContain("- mangue : une mangue avec sa feuille");
    expect(rule).toContain("Jamais d'image pour COMPTER");
  });

  it("est dans la consigne système des paliers", () => {
    const prompt = flat(buildPalierBaseSystemPrompt({ subject: "Français", topic: "Les animaux", class: "CI", palierIndex: 1 }));
    expect(prompt).toContain("- chat : un chat");
  });

  it("ne promet rien quand le catalogue est vide", () => {
    expect(imagesRule([])).toBe("");
  });
});
