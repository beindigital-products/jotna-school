import { describe, expect, it } from "vitest";

import { sanitizePayload, verifyAnswer } from "@/convex/paliers/exerciseRules";
import type { PlayableExercise } from "../demo/demo-types";
import { toPlayable, typeset, viewOf } from "../demo/playable";
import { match, order, qcm } from "../demo/bank-helpers";

const NBSP = " ";

describe("la typographie française des exercices", () => {
  it("ne coupe jamais un nombre à plusieurs tranches", () => {
    expect(typeset("1 200 000 000")).toBe(`1${NBSP}200${NBSP}000${NBSP}000`);
    expect(typeset("Range 64 250, 60 425 et 46 520.")).toBe(`Range 64${NBSP}250, 60${NBSP}425 et 46${NBSP}520.`);
  });

  it("garde le nombre et son unité ensemble", () => {
    expect(typeset("Un car roule à 60 km/h pendant 3 h.")).toBe(`Un car roule à 60${NBSP}km/h pendant 3${NBSP}h.`);
    expect(typeset("Il paie 500 F, soit 2 L de lait et 12 g de sel.")).toBe(
      `Il paie 500${NBSP}F, soit 2${NBSP}L de lait et 12${NBSP}g de sel.`,
    );
    expect(typeset("18 000 F")).toBe(`18${NBSP}000${NBSP}F`);
  });

  it("ne touche pas un nombre suivi d'un mot qui commence comme une unité", () => {
    for (const text of ["5 mangues", "2 maisons", "3 minutes", "4 grains", "6 heures", "7 Fatou"]) {
      expect(typeset(text), text).toBe(text);
    }
  });

  it("lie les guillemets français, le point d'interrogation, le point d'exclamation, le deux-points et le point-virgule", () => {
    expect(typeset("« Kilo » veut dire 1 000.")).toBe(`«${NBSP}Kilo${NBSP}» veut dire 1${NBSP}000.`);
    expect(typeset("Combien font 6 × 7 ?")).toBe(`Combien font 6 × 7${NBSP}?`);
    expect(typeset("Bravo ! Complète : ___ ; puis 20 : 4.")).toBe(`Bravo${NBSP}! Complète${NBSP}: ___${NBSP}; puis 20${NBSP}: 4.`);
  });

  it("laisse un texte sans cas particulier tel quel", () => {
    expect(typeset("Aïssatou a 3 mangues.")).toBe("Aïssatou a 3 mangues.");
    expect(typeset("")).toBe("");
  });

  it("traite la consigne, les indices, la thématique et TOUS les textes du payload de la même façon", () => {
    const item = order({
      topic: "Millions et milliards",
      stage: 3,
      prompt: "Remets ces nombres dans l'ordre : lequel d'abord ?",
      sequence: ["8 500 000", "12 000 000", "750 000 000"],
      hints: ["Compte les chiffres par tranches de 3.", "Un milliard, c'est 1 000 millions."],
    });
    const played = toPlayable(item, "mathematiques", "CM2");
    expect(played.prompt).toBe(`Remets ces nombres dans l'ordre${NBSP}: lequel d'abord${NBSP}?`);
    expect(played.hints[1]).toBe(`Un milliard, c'est 1${NBSP}000 millions.`);
    expect((played.payload as { correctSequence: string[] }).correctSequence).toEqual([
      `8${NBSP}500${NBSP}000`,
      `12${NBSP}000${NBSP}000`,
      `750${NBSP}000${NBSP}000`,
    ]);
    // La banque, elle, n'est pas modifiée : espaces ordinaires, lisibles dans le code.
    expect((item.payload as { correctSequence: string[] }).correctSequence[0]).toBe("8 500 000");
  });

  it("garde un QCM juste : la bonne réponse est toujours à sa place, et la correction la reconnaît", () => {
    const item = qcm({
      topic: "Acheter, vendre, gagner",
      stage: 2,
      prompt: "Quel est le bénéfice ?",
      options: ["39 500", "3 500", "3 000", "4 500"],
      answer: "3 500",
      hints: ["a", "b"],
    });
    const played = toPlayable(item, "mathematiques", "CM2");
    const payload = played.payload as { options: string[]; correctIndex: number };
    expect(payload.options[payload.correctIndex]).toBe(`3${NBSP}500`);
    expect(verifyAnswer(played, "1")).toBe(true);
    expect(verifyAnswer(played, "0")).toBe(false);
  });

  it("garde une association juste", () => {
    const item = match({
      topic: "Opérations sur les décimaux",
      stage: 2,
      prompt: "Relie.",
      pairs: [
        ["250 ÷ 1 000", "0,25"],
        ["3,5 × 10", "35"],
        ["1 km", "1 000 m"],
      ],
      hints: ["a", "b"],
    });
    const played = toPlayable(item, "mathematiques", "CM2");
    const pairs = (played.payload as { pairs: { left: string; right: string }[] }).pairs;
    expect(pairs[0].left).toBe(`250 ÷ 1${NBSP}000`);
    expect(pairs[2].right).toBe(`1${NBSP}000${NBSP}m`);
    expect(verifyAnswer(played, JSON.stringify(pairs))).toBe(true);
  });
});

describe("la vue de l'enfant : jamais des tuiles déjà rangées", () => {
  const exercise = (type: "order" | "match", id: string): PlayableExercise =>
    type === "order"
      ? {
          id,
          type,
          prompt: "Range.",
          payload: { correctSequence: ["a", "b", "c"] },
          hints: [],
          topic: "t",
          stage: 1,
        }
      : {
          id,
          type,
          prompt: "Relie.",
          payload: { pairs: [{ left: "1", right: "a" }, { left: "2", right: "b" }, { left: "3", right: "c" }] },
          hints: [],
          topic: "t",
          stage: 1,
        };

  /** Un identifiant dont le premier mélange est l'identité : le cas que `viewOf` doit éviter. */
  function unluckyId(type: "order" | "match"): string {
    for (let n = 0; n < 5000; n++) {
      const id = `unlucky-${n}`;
      const view = sanitizePayload(type, exercise(type, id).payload, id, "demo") as { items?: string[]; right?: string[] };
      const shuffled = type === "order" ? view.items : view.right;
      if (JSON.stringify(shuffled) === JSON.stringify(["a", "b", "c"])) return id;
    }
    throw new Error("aucun identifiant malchanceux trouvé");
  }

  it("mise en ordre : quand la graine rend le bon ordre, une autre graine prend le relais", () => {
    const played = exercise("order", unluckyId("order"));
    const view = viewOf(played) as { items: string[] };
    expect(view.items).not.toEqual(["a", "b", "c"]);
    expect([...view.items].sort()).toEqual(["a", "b", "c"]);
  });

  it("association : de même pour la colonne de droite", () => {
    const played = exercise("match", unluckyId("match"));
    const view = viewOf(played) as { right: string[] };
    expect(view.right).not.toEqual(["a", "b", "c"]);
    expect([...view.right].sort()).toEqual(["a", "b", "c"]);
  });

  it("rend toujours la même vue pour le même exercice", () => {
    const played = exercise("order", unluckyId("order"));
    expect(viewOf(played)).toEqual(viewOf(played));
  });

  it("ne montre jamais la réponse", () => {
    const text = JSON.stringify(viewOf(exercise("match", "x")));
    expect(text).not.toContain("pairs");
  });
});
