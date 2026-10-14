import { describe, expect, it } from "vitest";
import {
  countedEmojis,
  findMissingVisual,
  findMissingVisualOnScreen,
  guardVisuals,
  repairEmojiCount,
  withoutDanglingHints,
} from "../paliers/missingVisual";

describe("findMissingVisual : une question sans sa scène", () => {
  it("écarte « Combien de billes as-tu ? » : le palier 2 du CI du 12 octobre 2026", () => {
    expect(findMissingVisual("Combien de billes as-tu ?")).toBe("counts_what_is_not_there");
  });

  it("écarte les autres façons de faire compter ce qui n'est pas là", () => {
    for (const prompt of [
      "Combien de mangues vois-tu ?",
      "Combien d'oiseaux comptes-tu ?",
      "Combien de poissons y a-t-il ici ?",
      "Combien de ballons ai-je ?",
    ]) {
      expect(findMissingVisual(prompt), prompt).toBe("counts_what_is_not_there");
    }
  });

  it("écarte un renvoi à une image, un dessin ou un « ci-dessous » absents", () => {
    for (const prompt of [
      "Regarde l'image. Quel animal vois-tu ?",
      "Observe le dessin et choisis la bonne réponse.",
      "Quelle est la forme ci-dessous ?",
      "Sur l'image, de quelle couleur est la mangue ?",
      "Observe la carte du Sénégal. Où est Dakar ?",
      "Voici un dessin. Combien de côtés a la figure ?",
      "Regarde tes billes. Combien sont rouges ?",
    ]) {
      expect(findMissingVisual(prompt), prompt).toBe("points_at_absent_image");
    }
  });

  it("laisse « ci-dessous » dans un glisser-déposer, un appariement ou un ordre : ce sont les tuiles", () => {
    const tiles = { zones: ["Périmètre", "Aire"], items: [{ text: "20 cm", correctZone: "Périmètre" }, { text: "24 cm²", correctZone: "Aire" }] };
    const prompt = "Assigne les valeurs ci-dessous aux bonnes zones : Périmètre et Aire.";
    expect(findMissingVisualOnScreen(prompt, "drag-drop", tiles)).toBeNull();
    expect(findMissingVisualOnScreen("Relie les mots ci-dessus à leur définition.", "match", { pairs: [] })).toBeNull();
    // Ailleurs, « ci-dessous » renvoie à ce qui devrait suivre l'énoncé.
    expect(findMissingVisualOnScreen("Quelle est la forme ci-dessous ?", "qcm", { options: ["rond", "carré"] })).toBe("points_at_absent_image");
    // Un dessin à regarder reste absent, tuiles ou non.
    expect(findMissingVisualOnScreen("Regarde le dessin ci-dessous et place les objets.", "drag-drop", tiles)).toBe("points_at_absent_image");
  });

  it("laisse une image à produire ou à décrire (« ce que l'illustrateur doit montrer dans une image »)", () => {
    expect(findMissingVisual("Donne deux éléments que l'illustrateur doit montrer dans une image de la cour de récréation.")).toBeNull();
    expect(findMissingVisual("Que faut-il dessiner dans un dessin de la mer ?")).toBeNull();
    expect(findMissingVisual("Dans l'image, quelle est la couleur de la mangue ?")).toBe("points_at_absent_image");
    expect(findMissingVisual("Sur une image, de quelle couleur est la mangue ?")).toBe("points_at_absent_image");
  });

  it("garde une question dont la scène est dessinée en émojis", () => {
    expect(findMissingVisual("Combien de billes vois-tu ? 🔵🔵🔵🔵🔵")).toBeNull();
    expect(findMissingVisual("Regarde l'image : 🍎🍎🍌. Combien de pommes ?")).toBeNull();
  });

  it("garde une question dont les données sont écrites", () => {
    expect(findMissingVisual("Awa a 5 billes. Combien de billes a-t-elle ?")).toBeNull();
    expect(findMissingVisual("Tu as 8 billes. Combien de billes as-tu ?")).toBeNull();
    expect(findMissingVisual("Tu as cinq mangues. Combien de mangues as-tu ?")).toBeNull();
  });

  it("garde un fait qu'on sait sans rien voir", () => {
    for (const prompt of [
      "Combien de jours y a-t-il dans une semaine ?",
      "Combien de pattes a un chat ?",
      "Combien de côtés a un carré ?",
      "Combien de doigts as-tu sur une main ?",
      "Regarde ta main. Combien de doigts vois-tu ?",
      "Qu'écrit-on sur la carte d'identité ?",
      "Quel est le titre du roi du Cayor ?",
    ]) {
      expect(findMissingVisual(prompt), prompt).toBeNull();
    }
  });

  it("ne confond pas une histoire avec une consigne", () => {
    for (const prompt of [
      "Fatou compte ses mangues et en trouve douze. Combien en a-t-elle ?",
      "Awa regarde ses billes. Elle en a 7, elle en perd 2. Combien lui en reste-t-il ?",
      "Regarde les options. Laquelle est un nombre pair ?",
      "Observe la phrase : « Awa mange du riz. » Quel est le verbe ?",
      "Dans le dessin animé, Modou court. Que fait-il ?",
    ]) {
      expect(findMissingVisual(prompt), prompt).toBeNull();
    }
  });
});

describe("withoutDanglingHints : les indices qui renvoient à une scène absente", () => {
  it("retire « Regarde tes billes. » quand rien n'est dessiné", () => {
    expect(
      withoutDanglingHints("Combien de billes y a-t-il dans le sac ?", [
        "Regarde tes billes.",
        "Compte-les une par une.",
        "Observe le dessin ci-dessus.",
      ]),
    ).toEqual(["Compte-les une par une."]);
  });

  it("garde tous les indices d'une scène dessinée", () => {
    const hints = ["Regarde tes billes.", "Compte-les une par une."];
    expect(withoutDanglingHints("Combien de billes vois-tu ? 🔵🔵🔵", hints)).toEqual(hints);
  });
});

describe("countedEmojis : les objets dessinés à compter", () => {
  it("compte une rangée unique d'objets identiques", () => {
    expect(countedEmojis("Combien de billes vois-tu ? 🔵🔵🔵🔵🔵")).toBe(5);
    expect(countedEmojis("Combien de mangues ? 🥭 🥭 🥭")).toBe(3);
    // Les sélecteurs de variante ne comptent pas pour un objet de plus.
    expect(countedEmojis("Combien de cœurs ? ❤️❤️❤️❤️")).toBe(4);
  });

  it("ne compte pas l'émoji qui tient lieu de nom dans la question", () => {
    expect(countedEmojis("Combien de 🍎 vois-tu ? 🍎🍎🍎🍎")).toBe(4);
  });

  it("renonce quand le compte serait ambigu", () => {
    expect(countedEmojis("Combien de fruits ? 🍎🍎🍌")).toBeNull();
    expect(countedEmojis("Combien en tout ? 🍎🍎 et 🍎🍎🍎")).toBeNull();
    expect(countedEmojis("Awa a 3 pommes 🍎🍎🍎 et en reçoit 2. Combien ?")).toBeNull();
    expect(countedEmojis("Quelle est la couleur ? 🔵🔵🔵")).toBeNull();
    expect(countedEmojis("Combien ? 🍎")).toBeNull();
  });
});

describe("repairEmojiCount : la réponse attendue est le nombre d'émojis écrits", () => {
  const prompt = "Combien de billes vois-tu ? 🔵🔵🔵🔵🔵";

  it("laisse une réponse courte juste", () => {
    expect(
      repairEmojiCount({ type: "short-answer", prompt, payload: { acceptedAnswers: ["5"] }, answerKey: "5" }),
    ).toEqual({ kind: "ok", counted: 5 });
  });

  it("corrige une réponse courte fausse : le modèle compte mal ses émojis", () => {
    const outcome = repairEmojiCount({
      type: "short-answer",
      prompt,
      payload: { acceptedAnswers: ["6"], explanation: "Il y a 6 billes." },
      answerKey: "6",
    });
    expect(outcome).toEqual({
      kind: "repaired",
      counted: 5,
      previous: "6",
      answerKey: "5",
      payload: { acceptedAnswers: ["5"] },
    });
  });

  it("laisse un QCM juste", () => {
    expect(
      repairEmojiCount({
        type: "qcm",
        prompt,
        payload: { options: ["4", "5", "6"], correctIndex: 1 },
        answerKey: "5",
      }),
    ).toEqual({ kind: "ok", counted: 5 });
  });

  it("déplace l'index d'un QCM vers l'option qui vaut le compte", () => {
    const outcome = repairEmojiCount({
      type: "qcm",
      prompt,
      payload: { options: ["4", "5 billes", "6"], correctIndex: 2 },
      answerKey: "6",
    });
    expect(outcome).toMatchObject({
      kind: "repaired",
      answerKey: "5 billes",
      payload: { options: ["4", "5 billes", "6"], correctIndex: 1 },
    });
  });

  it("déclare irréparable un QCM dont aucune option ne vaut le compte", () => {
    expect(
      repairEmojiCount({
        type: "qcm",
        prompt,
        payload: { options: ["3", "4", "6"], correctIndex: 2 },
        answerKey: "6",
      }),
    ).toEqual({ kind: "unrepairable", counted: 5 });
  });

  it("ne touche pas ce qui n'est pas un compte numérique", () => {
    expect(
      repairEmojiCount({ type: "order", prompt, payload: { correctSequence: ["a"] }, answerKey: "a" }),
    ).toEqual({ kind: "skipped" });
    expect(
      repairEmojiCount({
        type: "qcm",
        prompt,
        payload: { options: ["peu", "beaucoup"], correctIndex: 0 },
        answerKey: "peu",
      }),
    ).toEqual({ kind: "skipped" });
  });
});

describe("guardVisuals : ce que la génération fait d'un exercice du modèle", () => {
  const base = {
    type: "short-answer",
    payload: { acceptedAnswers: ["5"] },
    answerKey: "5",
    hints: ["Regarde tes billes.", "Compte-les une par une."],
    mathExpression: null,
  };

  it("écarte l'exercice de la capture : « Combien de billes as-tu ? », indice « Regarde tes billes »", () => {
    expect(guardVisuals({ ...base, prompt: "Combien de billes as-tu ?" })).toEqual({
      kind: "rejected",
      reason: "counts_what_is_not_there",
    });
  });

  it("garde le même exercice une fois les billes dessinées", () => {
    const outcome = guardVisuals({ ...base, prompt: "Combien de billes vois-tu ? 🔵🔵🔵🔵🔵" });
    expect(outcome).toMatchObject({ kind: "accepted", answerKey: "5", recounted: false, hints: base.hints });
  });

  it("retire un indice pendant d'un exercice sinon valable", () => {
    const outcome = guardVisuals({
      ...base,
      prompt: "Combien de pattes a un chat ?",
      answerKey: "4",
      payload: { acceptedAnswers: ["4"] },
    });
    expect(outcome).toMatchObject({ kind: "accepted", hints: ["Compte-les une par une."] });
  });

  it("recompte les émojis et défait l'expression du modèle qui portait la même erreur", () => {
    const outcome = guardVisuals({
      ...base,
      prompt: "Combien de billes vois-tu ? 🔵🔵🔵🔵🔵",
      answerKey: "6",
      payload: { acceptedAnswers: ["6"] },
      mathExpression: "6",
    });
    expect(outcome).toMatchObject({
      kind: "accepted",
      answerKey: "5",
      payload: { acceptedAnswers: ["5"] },
      mathExpression: null,
      recounted: true,
    });
  });

  it("écarte un QCM dont aucune option ne vaut le nombre d'émojis", () => {
    expect(
      guardVisuals({
        ...base,
        type: "qcm",
        prompt: "Combien de billes vois-tu ? 🔵🔵🔵🔵🔵",
        payload: { options: ["3", "4", "6"], correctIndex: 2 },
        answerKey: "6",
      }),
    ).toEqual({ kind: "rejected", reason: "miscounted" });
  });
});
