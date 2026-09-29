import { describe, expect, it } from "vitest";
import {
  dragDropAnswer,
  linkTiles,
  matchAnswer,
  unlinkLeft,
  type MatchLink,
} from "../exerciseAnswers";
import { verifyDragDrop, verifyMatch } from "@/convex/paliers/answerCheck";

// L'écran de la capture du 29 septembre 2026, colonne de droite mélangée.
const left = ["mangue", "yassa", "bissap", "lait"];
const right = ["i", "a", "é", "a"];

describe("linkTiles — une tuile est sa position", () => {
  it("relie le second « a » sans défaire le premier", () => {
    let links: MatchLink[] = [];
    links = linkTiles(links, 0, 1); // mangue – premier a
    links = linkTiles(links, 1, 3); // yassa – second a
    expect(links).toEqual([
      { left: 0, right: 1 },
      { left: 1, right: 3 },
    ]);
  });

  it("déplace le lien d'un mot relié une seconde fois", () => {
    const links = linkTiles([{ left: 0, right: 1 }], 0, 3);
    expect(links).toEqual([{ left: 0, right: 3 }]);
  });

  it("reprend une tuile de droite déjà prise pour le nouveau mot", () => {
    const links = linkTiles([{ left: 0, right: 1 }], 1, 1);
    expect(links).toEqual([{ left: 1, right: 1 }]);
  });

  it("défait le lien d'un mot", () => {
    expect(unlinkLeft([{ left: 0, right: 1 }, { left: 1, right: 3 }], 0)).toEqual([
      { left: 1, right: 3 },
    ]);
  });
});

describe("matchAnswer — l'écran et le serveur s'entendent", () => {
  const pairs = {
    pairs: [
      { left: "mangue", right: "a" },
      { left: "yassa", right: "a" },
      { left: "bissap", right: "i" },
      { left: "lait", right: "é" },
    ],
  };

  it("rend une réponse juste quand chaque mot a son « a »", () => {
    let links: MatchLink[] = [];
    links = linkTiles(links, 2, 0); // bissap – i
    links = linkTiles(links, 3, 2); // lait – é
    links = linkTiles(links, 0, 1); // mangue – a
    links = linkTiles(links, 1, 3); // yassa – a
    const answer = matchAnswer(left, right, links);
    expect(JSON.parse(answer)).toEqual([
      { left: "bissap", right: "i" },
      { left: "lait", right: "é" },
      { left: "mangue", right: "a" },
      { left: "yassa", right: "a" },
    ]);
    expect(verifyMatch(answer, pairs)).toBe(true);
  });

  it("rend une réponse fausse quand un mot a la mauvaise tuile", () => {
    let links: MatchLink[] = [];
    links = linkTiles(links, 2, 1); // bissap – a
    links = linkTiles(links, 3, 2); // lait – é
    links = linkTiles(links, 0, 3); // mangue – a
    links = linkTiles(links, 1, 0); // yassa – i
    expect(verifyMatch(matchAnswer(left, right, links), pairs)).toBe(false);
  });
});

describe("dragDropAnswer", () => {
  const texts = ["b", "a", "n", "a", "n", "e"];
  const items = {
    items: [
      { text: "b", correctZone: "Consonnes" },
      { text: "a", correctZone: "Voyelles" },
      { text: "n", correctZone: "Consonnes" },
      { text: "a", correctZone: "Voyelles" },
      { text: "n", correctZone: "Consonnes" },
      { text: "e", correctZone: "Voyelles" },
    ],
  };

  it("garde l'objet { étiquette: zone } quand les copies sont ensemble", () => {
    const answer = dragDropAnswer(texts, [
      "Consonnes",
      "Voyelles",
      "Consonnes",
      "Voyelles",
      "Consonnes",
      "Voyelles",
    ]);
    expect(JSON.parse(answer)).toEqual({ b: "Consonnes", a: "Voyelles", n: "Consonnes", e: "Voyelles" });
    expect(verifyDragDrop(answer, items)).toBe(true);
  });

  it("passe au tableau quand deux copies sont dans deux zones", () => {
    const answer = dragDropAnswer(texts, [
      "Consonnes",
      "Voyelles",
      "Consonnes",
      "Consonnes",
      "Consonnes",
      "Voyelles",
    ]);
    expect(Array.isArray(JSON.parse(answer))).toBe(true);
    expect(verifyDragDrop(answer, items)).toBe(false);
  });

  it("n'envoie pas les étiquettes pas encore posées", () => {
    expect(JSON.parse(dragDropAnswer(["x", "y"], ["Zone 1", null]))).toEqual({ x: "Zone 1" });
  });
});
