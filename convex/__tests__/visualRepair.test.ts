import { describe, expect, it } from "vitest";
import { emojiFor, repairVisualPrompt } from "../paliers/visualRepair";

const qcm = (prompt: string, options: string[], correctIndex: number) => ({
  type: "qcm",
  prompt,
  payload: { options, correctIndex },
  answerKey: options[correctIndex],
});

describe("repairVisualPrompt — « Combien de mangues vois-tu ? » sans mangue", () => {
  it("ajoute autant d'émojis que la réponse", () => {
    const outcome = repairVisualPrompt(qcm("Combien de mangues vois-tu ?", ["3", "5", "7"], 1));
    expect(outcome).toEqual({
      kind: "repaired",
      prompt: "🥭🥭🥭🥭🥭\nCombien de mangues vois-tu ?",
      change: "added",
    });
  });

  it("lit la réponse d'une réponse courte", () => {
    const outcome = repairVisualPrompt({
      type: "short-answer",
      prompt: "Combien de poissons vois-tu ?",
      payload: { acceptedAnswers: ["4"] },
      answerKey: "4",
    });
    expect(outcome).toMatchObject({ kind: "repaired", prompt: "🐟🐟🐟🐟\nCombien de poissons vois-tu ?" });
  });

  it("écarte un objet sans émoji connu", () => {
    const outcome = repairVisualPrompt(qcm("Combien de calebasses vois-tu ?", ["3", "5", "7"], 1));
    expect(outcome).toEqual({ kind: "unrepairable", reason: "nothing_to_see" });
  });

  it("écarte une réponse qu'on ne sait pas dessiner", () => {
    const outcome = repairVisualPrompt(qcm("Combien de mangues vois-tu ?", ["40", "50", "70"], 1));
    expect(outcome).toEqual({ kind: "unrepairable", reason: "nothing_to_see" });
  });

  it("écarte un renvoi à une image absente", () => {
    for (const prompt of ["Quelle forme vois-tu ?", "Regarde le dessin ci-dessous : quel animal est-ce ?", "Que montre l'image ?"]) {
      expect(repairVisualPrompt(qcm(prompt, ["rond", "carré"], 0)), prompt).toEqual({
        kind: "unrepairable",
        reason: "nothing_to_see",
      });
    }
  });
});

describe("repairVisualPrompt — ce qui reste intact", () => {
  it("laisse une question illustrée à la bonne taille", () => {
    expect(repairVisualPrompt(qcm("🥭🥭🥭🥭🥭 Combien de mangues vois-tu ?", ["3", "5", "7"], 1))).toEqual({ kind: "ok" });
  });

  it("laisse un problème dont les nombres sont écrits", () => {
    expect(
      repairVisualPrompt(qcm("Aïssatou a 3 mangues. On lui en donne 2. Combien en a-t-elle ?", ["4", "5", "6"], 1)),
    ).toEqual({ kind: "ok" });
    expect(repairVisualPrompt(qcm("Combien de mangues y a-t-il dans 3 paniers de 4 ?", ["7", "12"], 1))).toEqual({
      kind: "ok",
    });
  });

  it("laisse une image portée par les options", () => {
    expect(repairVisualPrompt(qcm("Que vois-tu ?", ["🐶", "🐱"], 0))).toEqual({ kind: "ok" });
  });

  it("laisse une question de connaissance", () => {
    expect(repairVisualPrompt(qcm("Quelle est la capitale du Sénégal ?", ["Dakar", "Thiès"], 0))).toEqual({
      kind: "ok",
    });
  });

  it("ne confond pas un émoji de nom avec une rangée", () => {
    expect(repairVisualPrompt(qcm("Combien de 🥭 vois-tu ?", ["3", "5"], 1))).toEqual({ kind: "ok" });
  });
});

describe("repairVisualPrompt — la rangée ne dit pas la clé", () => {
  it("refait la rangée à la taille de la réponse", () => {
    const outcome = repairVisualPrompt(qcm("🥭🥭🥭 Combien de mangues vois-tu ?", ["3", "5", "7"], 1));
    expect(outcome).toEqual({
      kind: "repaired",
      prompt: "🥭🥭🥭🥭🥭 Combien de mangues vois-tu ?",
      change: "resized",
    });
  });
});

describe("emojiFor", () => {
  it("accepte pluriel, accents et ligature", () => {
    expect(emojiFor("mangues")).toBe("🥭");
    expect(emojiFor("Œufs")).toBe("🥚");
    expect(emojiFor("pastèques")).toBe("🍉");
    expect(emojiFor("calebasses")).toBeNull();
  });
});
