import { describe, expect, it, vi } from "vitest";

// Un catalogue de test (le vrai est rempli quand les images sont fabriquées) : les
// fonctions d'origine gardent leur catalogue vide en valeur par défaut, on leur
// donne celui du test.
vi.mock("../../lib/exercise-images", async (importOriginal) => {
  const original = await importOriginal<typeof import("../../lib/exercise-images")>();
  const catalogue = [{ id: "chat", alt: "Un chat assis", about: "un chat" }];
  return {
    ...original,
    EXERCISE_IMAGES: catalogue,
    findExerciseImage: (id: unknown, c = catalogue) => original.findExerciseImage(id, c),
    exerciseImageIdOf: (payload: unknown, c = catalogue) => original.exerciseImageIdOf(payload, c),
    exerciseImageCatalogueText: (c = catalogue) => original.exerciseImageCatalogueText(c),
  };
});

import { repairVisualPrompt } from "../paliers/visualRepair";
import { guardVisuals } from "../paliers/missingVisual";

/**
 * LES DEUX MÉCANISMES, DANS L'ORDRE DE `toPersistedShape` : la réparation de
 * `visualRepair.ts` d'abord, le garde-fou de `missingVisual.ts` ensuite. Le
 * garde-fou seul écarterait un comptage que la réparation sait sauver.
 */
function pipeline(input: { type: string; prompt: string; payload: unknown; answerKey: string; hints?: string[] }) {
  let { prompt, payload } = input;
  const visual = repairVisualPrompt({ type: input.type, prompt, payload, answerKey: input.answerKey });
  if (visual.kind === "unrepairable") return { kind: "rejected" as const, by: "visualRepair" };
  if (visual.kind === "repaired") {
    prompt = visual.prompt;
    if (visual.payload !== undefined) payload = visual.payload;
  }
  const guarded = guardVisuals({
    type: input.type,
    prompt,
    payload,
    answerKey: input.answerKey,
    hints: input.hints ?? [],
    mathExpression: null,
  });
  if (guarded.kind === "rejected") return { kind: "rejected" as const, by: "guardVisuals", reason: guarded.reason };
  return { kind: "accepted" as const, prompt, payload: guarded.payload };
}

const qcm = (options: string[], correctIndex: number) => ({ options, correctIndex });

describe("réparer d'abord, écarter ensuite", () => {
  it("sauve « Combien de mangues vois-tu ? » : la réparation écrit les émojis, le garde-fou les laisse passer", () => {
    const outcome = pipeline({
      type: "qcm",
      prompt: "Combien de mangues vois-tu ?",
      payload: qcm(["3", "5", "7", "9"], 1),
      answerKey: "5",
    });
    expect(outcome.kind).toBe("accepted");
    if (outcome.kind === "accepted") expect(outcome.prompt).toContain("🥭🥭🥭🥭🥭");
  });

  it("écarte « Combien de billes as-tu ? » : aucun émoji de bille, la réparation n'y touche pas, le garde-fou l'écarte", () => {
    expect(
      pipeline({ type: "short-answer", prompt: "Combien de billes as-tu ?", payload: { acceptedAnswers: ["5"] }, answerKey: "5" }),
    ).toMatchObject({ kind: "rejected", by: "guardVisuals", reason: "counts_what_is_not_there" });
  });

  it("écarte « Regarde tes billes. Combien sont rouges ? » : une scène qui n'existe pas", () => {
    expect(
      pipeline({ type: "qcm", prompt: "Regarde tes billes. Combien sont rouges ?", payload: qcm(["1", "2", "3", "4"], 1), answerKey: "2" }),
    ).toMatchObject({ kind: "rejected" });
  });
});

describe("une image du catalogue est une scène pour les deux mécanismes", () => {
  const prompt = "Quel animal vois-tu ?";

  it("sans image, « Quel animal vois-tu ? » est écarté", () => {
    expect(pipeline({ type: "qcm", prompt, payload: qcm(["chat", "chien", "poule", "vache"], 0), answerKey: "chat" }).kind).toBe("rejected");
  });

  it("avec une image du catalogue, il passe", () => {
    expect(
      pipeline({ type: "qcm", prompt, payload: { ...qcm(["chat", "chien", "poule", "vache"], 0), image: "chat" }, answerKey: "chat" }),
    ).toMatchObject({ kind: "accepted" });
  });

  it("une image hors catalogue ne vaut rien", () => {
    expect(
      pipeline({ type: "qcm", prompt, payload: { ...qcm(["chat", "chien", "poule", "vache"], 0), image: "licorne" }, answerKey: "chat" }).kind,
    ).toBe("rejected");
  });

  it("l'image ne sert pas à compter : « Combien de mangues vois-tu ? » reçoit ses émojis, l'image n'y change rien", () => {
    const outcome = pipeline({
      type: "qcm",
      prompt: "Combien de mangues vois-tu ?",
      payload: { ...qcm(["3", "5", "7", "9"], 1), image: "chat" },
      answerKey: "5",
    });
    expect(outcome.kind).toBe("accepted");
    if (outcome.kind === "accepted") expect(outcome.prompt).toContain("🥭🥭🥭🥭🥭");
  });
});
