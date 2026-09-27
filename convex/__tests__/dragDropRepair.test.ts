import { describe, expect, it } from "vitest";
import { isGenericZoneLabel, repairDragDrop } from "../paliers/dragDropRepair";

const dd = (zones: string[], pairs: [string, string][]) => ({
  zones,
  items: pairs.map(([text, correctZone]) => ({ text, correctZone })),
});

describe("isGenericZoneLabel", () => {
  it("reconnaît un nom de boîte", () => {
    for (const z of ["Zone A", "Zone 1", "zone1", "ZONE B", "Case 2", "Boîte 3", "zone"]) {
      expect(isGenericZoneLabel(z), z).toBe(true);
    }
  });
  it("laisse une vraie étiquette", () => {
    for (const z of ["12", "Mangue", "a", "à", "COD", "Le", "7h", "1/2", "Zone industrielle"]) {
      expect(isGenericZoneLabel(z), z).toBe(false);
    }
  });
});

describe("repairDragDrop — le palier 5 de Multiplication", () => {
  it("des calculs sous « Zone A/B/C » : les zones prennent les résultats", () => {
    const outcome = repairDragDrop({
      prompt: "Associe chaque produit avec son résultat :",
      answerKey: "null",
      payload: dd(["Zone A", "Zone B", "Zone C"], [["2 × 6", "Zone A"], ["4 × 5", "Zone B"], ["3 × 7", "Zone C"]]),
    });
    expect(outcome).toEqual({
      kind: "relabeled",
      payload: dd(["12", "20", "21"], [["2 × 6", "12"], ["4 × 5", "20"], ["3 × 7", "21"]]),
      answerKey: "2 × 6 = 12, 4 × 5 = 20, 3 × 7 = 21",
    });
  });

  it("des lettres A/B sans lien avec les étiquettes, mais des calculs : résultats", () => {
    const outcome = repairDragDrop({
      prompt: "Associe les opérations aux résultats :",
      answerKey: "A, B",
      payload: dd(["A", "B"], [["3 + 3", "A"], ["2 × 4", "B"]]),
    });
    expect(outcome).toMatchObject({ kind: "relabeled", payload: { zones: ["6", "8"] } });
  });

  it("deux zones qui donneraient le même résultat : irréparable", () => {
    expect(
      repairDragDrop({
        prompt: "Associe :",
        answerKey: "",
        payload: dd(["Zone A", "Zone B"], [["2 × 6", "Zone A"], ["3 × 4", "Zone B"]]),
      }),
    ).toEqual({ kind: "unrepairable", reason: "generic_zones" });
  });
});

describe("repairDragDrop — remettre dans l'ordre", () => {
  it("les mots d'une phrase sous Zone 1..4, dans le désordre : un exercice order", () => {
    const outcome = repairDragDrop({
      prompt: "Place les mots dans l'ordre pour former une phrase correcte.",
      answerKey: "Khady joue au foot dans la cour.",
      payload: dd(
        ["Zone 1", "Zone 2", "Zone 3", "Zone 4"],
        [["joue", "Zone 2"], ["Khady", "Zone 1"], ["au foot", "Zone 3"], ["dans la cour", "Zone 4"]],
      ),
    });
    expect(outcome).toEqual({
      kind: "order",
      payload: { correctSequence: ["Khady", "joue", "au foot", "dans la cour"] },
      answerKey: "Khady joue au foot dans la cour",
    });
  });

  it("zone1..zone4 en minuscules, syllabes : order", () => {
    expect(
      repairDragDrop({
        prompt: "Mets ces syllabes pour former le mot 'Mafé'.",
        answerKey: "Mafé",
        payload: dd(["Zone 1", "Zone 2"], [["ma", "Zone 1"], ["fé", "Zone 2"]]),
      }),
    ).toMatchObject({ kind: "order", payload: { correctSequence: ["ma", "fé"] } });
  });

  it("des nombres à poser sur eux-mêmes, dans l'ordre : order, par valeur", () => {
    expect(
      repairDragDrop({
        prompt: "Mets les nombres dans l'ordre de 1 à 10.",
        answerKey: "1 à 10",
        payload: dd(
          ["1", "2", "3", "10"],
          [["3", "3"], ["1", "1"], ["10", "10"], ["2", "2"]],
        ),
      }),
    ).toMatchObject({ kind: "order", payload: { correctSequence: ["1", "2", "3", "10"] }, answerKey: "1, 2, 3, 10" });
  });

  it("ordre croissant sous Zone 1..3 : order", () => {
    expect(
      repairDragDrop({
        prompt: "Place les nombres suivants dans l'ordre croissant : 7, 2, 5.",
        answerKey: "2, 5, 7",
        payload: dd(["Zone 1", "Zone 2", "Zone 3"], [["2", "Zone 1"], ["5", "Zone 2"], ["7", "Zone 3"]]),
      }),
    ).toMatchObject({ kind: "order", payload: { correctSequence: ["2", "5", "7"] } });
  });

  it("un dialogue sous Zone 1..3 : order", () => {
    expect(
      repairDragDrop({
        prompt: "Déplacez les phrases pour former un dialogue correct.",
        answerKey: "",
        payload: dd(["Zone 1", "Zone 2", "Zone 3"], [["Bonjour.", "Zone 1"], ["Salut !", "Zone 2"], ["Ça va ?", "Zone 3"]]),
      }),
    ).toMatchObject({ kind: "order" });
  });
});

describe("repairDragDrop — étiquette identique à sa zone", () => {
  it("un homophone à choisir dans une phrase : QCM sur les zones", () => {
    expect(
      repairDragDrop({
        prompt: "Glisse le bon homophone dans la phrase : Mariama _____ (a, à) un beau collier.",
        answerKey: "a",
        payload: dd(["a", "à"], [["a", "a"], ["à", "à"]]),
      }),
    ).toEqual({ kind: "qcm", payload: { options: ["a", "à"], correctIndex: 0 }, answerKey: "a" });
  });

  it("la réponse du modèle avec des espaces et une majuscule : retrouvée", () => {
    expect(
      repairDragDrop({
        prompt: "Place les mots dans la bonne zone : 'Ousmane et Fatou ___ partie.' (on/ont)",
        answerKey: " Ont ",
        payload: dd(["on", "ont"], [["on", "on"], ["ont", "ont"]]),
      }),
    ).toMatchObject({ kind: "qcm", payload: { correctIndex: 1 } });
  });

  it("sans réponse unique parmi les zones : irréparable", () => {
    expect(
      repairDragDrop({
        prompt: "Associe les nombres aux images :",
        answerKey: "1, 2, 3, 4",
        payload: dd(["1", "2", "3", "4"], [["3", "3"], ["1", "1"], ["4", "4"], ["2", "2"]]),
      }),
    ).toEqual({ kind: "unrepairable", reason: "tautology" });
  });
});

describe("repairDragDrop — ce qu'on laisse, ce qu'on refuse", () => {
  it("un bon exercice reste tel quel", () => {
    expect(
      repairDragDrop({
        prompt: "Associe chaque aliment à son prix :",
        answerKey: "",
        payload: dd(["Mangue", "Yassa"], [["5 FCFA", "Mangue"], ["12 FCFA", "Yassa"]]),
      }),
    ).toEqual({ kind: "ok" });
  });

  it("les initiales en CI : des lettres qui sont de vraies étiquettes", () => {
    expect(
      repairDragDrop({
        prompt: "Associe chaque lettre avec un prénom.",
        answerKey: "",
        payload: dd(["I", "O", "A"], [["Ibrahima", "I"], ["Ousmane", "O"], ["Awa", "A"]]),
      }),
    ).toEqual({ kind: "ok" });
  });

  it("des lettres qui ne sont pas les initiales, sans calcul ni ordre : irréparable", () => {
    expect(
      repairDragDrop({
        prompt: "Fais correspondre les lettres avec les mots.",
        answerKey: "Arachide - A, Yassa - B, Mafè - C",
        payload: dd(["A", "B", "C"], [["Arachide", "A"], ["Yassa", "B"], ["Mafè", "C"]]),
      }),
    ).toEqual({ kind: "unrepairable", reason: "generic_zones" });
    expect(
      repairDragDrop({
        prompt: "Place les conjonctions dans les bonnes phrases.",
        answerKey: "",
        payload: dd(["A", "B", "C"], [["et", "A"], ["car", "B"], ["mais", "C"]]),
      }),
    ).toEqual({ kind: "unrepairable", reason: "generic_zones" });
  });

  it("une zone cible absente : remise d'aplomb si c'est la casse, sinon irréparable", () => {
    expect(
      repairDragDrop({
        prompt: "Glisse les déterminants :",
        answerKey: "",
        payload: dd(["Le", "La"], [["mil", "le"], ["mangue", " La "]]),
      }),
    ).toEqual({ kind: "cleaned", payload: dd(["Le", "La"], [["mil", "Le"], ["mangue", "La"]]) });
    expect(
      repairDragDrop({
        prompt: "Associe chaque nombre à son double.",
        answerKey: "",
        payload: dd(["1", "2", "3", "4"], [["2", "4"], ["3", "6"], ["1", "2"], ["4", "8"]]),
      }),
    ).toEqual({ kind: "unrepairable", reason: "zone_missing" });
  });

  it("moins de deux zones ou deux étiquettes : irréparable", () => {
    expect(repairDragDrop({ prompt: "", answerKey: "", payload: dd(["A"], [["x", "A"], ["y", "A"]]) })).toEqual({
      kind: "unrepairable",
      reason: "shape",
    });
    expect(repairDragDrop({ prompt: "", answerKey: "", payload: null })).toEqual({ kind: "unrepairable", reason: "shape" });
  });
});
