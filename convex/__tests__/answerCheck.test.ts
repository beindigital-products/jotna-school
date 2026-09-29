import { describe, expect, it } from "vitest";
import { verifyDragDrop, verifyMatch } from "../paliers/answerCheck";

describe("verifyMatch — paires comparées en multi-ensemble", () => {
  // L'exercice de la capture du 29 septembre 2026 : deux mots ont le son « a ».
  const sons = {
    pairs: [
      { left: "mangue", right: "a" },
      { left: "yassa", right: "a" },
      { left: "bissap", right: "i" },
      { left: "lait", right: "é" },
    ],
  };

  it("accepte les deux mots reliés chacun à l'une des deux tuiles « a »", () => {
    const answer = JSON.stringify([
      { left: "bissap", right: "i" },
      { left: "lait", right: "é" },
      { left: "mangue", right: "a" },
      { left: "yassa", right: "a" },
    ]);
    expect(verifyMatch(answer, sons)).toBe(true);
  });

  it("refuse une paire répétée à la place d'une autre", () => {
    // L'ancienne comparaison par ensemble l'acceptait.
    const answer = JSON.stringify([
      { left: "mangue", right: "a" },
      { left: "mangue", right: "a" },
      { left: "bissap", right: "i" },
      { left: "lait", right: "é" },
    ]);
    expect(verifyMatch(answer, sons)).toBe(false);
  });

  it("refuse un mot relié à la mauvaise tuile", () => {
    const answer = JSON.stringify([
      { left: "mangue", right: "a" },
      { left: "yassa", right: "i" },
      { left: "bissap", right: "a" },
      { left: "lait", right: "é" },
    ]);
    expect(verifyMatch(answer, sons)).toBe(false);
  });

  it("refuse une réponse incomplète ou trop longue", () => {
    expect(verifyMatch(JSON.stringify([{ left: "lait", right: "é" }]), sons)).toBe(false);
    const tooMany = JSON.stringify([
      ...sons.pairs,
      { left: "lait", right: "é" },
    ]);
    expect(verifyMatch(tooMany, sons)).toBe(false);
  });

  it("refuse ce qui n'est pas une liste de paires", () => {
    expect(verifyMatch("pas du json", sons)).toBe(false);
    expect(verifyMatch(JSON.stringify({ left: "lait", right: "é" }), sons)).toBe(false);
    expect(verifyMatch(JSON.stringify([1, 2, 3, 4]), sons)).toBe(false);
    expect(
      verifyMatch(
        JSON.stringify([
          { left: "mangue" },
          { left: "yassa", right: "a" },
          { left: "bissap", right: "i" },
          { left: "lait", right: "é" },
        ]),
        sons,
      ),
    ).toBe(false);
  });

  it("ne confond pas deux paires dont les textes contiennent un séparateur", () => {
    const pairs = { pairs: [{ left: "a|||b", right: "c" }, { left: "x", right: "y" }] };
    const forged = JSON.stringify([
      { left: "a", right: "b|||c" },
      { left: "x", right: "y" },
    ]);
    expect(verifyMatch(forged, pairs)).toBe(false);
  });
});

describe("verifyDragDrop — les deux formes de réponse", () => {
  const banane = {
    items: [
      { text: "b", correctZone: "Consonnes" },
      { text: "a", correctZone: "Voyelles" },
      { text: "n", correctZone: "Consonnes" },
      { text: "a", correctZone: "Voyelles" },
      { text: "n", correctZone: "Consonnes" },
      { text: "e", correctZone: "Voyelles" },
    ],
  };

  it("accepte l'objet { étiquette: zone } quand les copies vont ensemble", () => {
    const answer = JSON.stringify({ b: "Consonnes", a: "Voyelles", n: "Consonnes", e: "Voyelles" });
    expect(verifyDragDrop(answer, banane)).toBe(true);
  });

  it("refuse l'objet quand une étiquette manque ou pointe ailleurs", () => {
    expect(
      verifyDragDrop(JSON.stringify({ b: "Consonnes", a: "Voyelles", n: "Consonnes" }), banane),
    ).toBe(false);
    expect(
      verifyDragDrop(
        JSON.stringify({ b: "Consonnes", a: "Consonnes", n: "Consonnes", e: "Voyelles" }),
        banane,
      ),
    ).toBe(false);
  });

  it("refuse, sous forme de tableau, deux copies posées dans deux zones", () => {
    const answer = JSON.stringify([
      { text: "b", zone: "Consonnes" },
      { text: "a", zone: "Voyelles" },
      { text: "n", zone: "Consonnes" },
      { text: "a", zone: "Consonnes" },
      { text: "n", zone: "Consonnes" },
      { text: "e", zone: "Voyelles" },
    ]);
    expect(verifyDragDrop(answer, banane)).toBe(false);
  });

  it("accepte le tableau quand l'exercice attend deux copies dans deux zones", () => {
    const split = {
      items: [
        { text: "la", correctZone: "Article" },
        { text: "la", correctZone: "Note de musique" },
      ],
    };
    const answer = JSON.stringify([
      { text: "la", zone: "Note de musique" },
      { text: "la", zone: "Article" },
    ]);
    expect(verifyDragDrop(answer, split)).toBe(true);
  });

  it("refuse un tableau incomplet ou mal formé", () => {
    expect(verifyDragDrop(JSON.stringify([{ text: "b", zone: "Consonnes" }]), banane)).toBe(false);
    expect(verifyDragDrop(JSON.stringify(banane.items), banane)).toBe(false);
    expect(verifyDragDrop("pas du json", banane)).toBe(false);
    expect(verifyDragDrop("null", banane)).toBe(false);
  });

  it("ne lit pas le prototype d'un objet de réponse", () => {
    const tricky = { items: [{ text: "constructor", correctZone: "Mots" }, { text: "x", correctZone: "Lettres" }] };
    expect(verifyDragDrop(JSON.stringify({ x: "Lettres" }), tricky)).toBe(false);
    expect(verifyDragDrop(JSON.stringify({ constructor: "Mots", x: "Lettres" }), tricky)).toBe(true);
  });
});
