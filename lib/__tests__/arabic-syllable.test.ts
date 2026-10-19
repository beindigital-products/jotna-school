import { describe, expect, it } from "vitest";
import {
  ARABIC_LETTERS,
  HARAKAT,
  getLetter,
  syllableFr,
  type ArabicLetterKey,
} from "@/convex/arabic/alphabet";

const letter = (key: ArabicLetterKey) => {
  const found = getLetter(key);
  if (!found) throw new Error(`lettre inconnue : ${key}`);
  return found;
};

describe("syllableFr — la syllabe écrite pour un lecteur francophone", () => {
  it("alif ne porte que la voyelle : a, i, ou", () => {
    expect(HARAKAT.map((h) => syllableFr(letter("alif"), h.key))).toEqual(["a", "i", "ou"]);
  });

  it("colle la consonne et la voyelle", () => {
    expect(syllableFr(letter("ba"), "fatha")).toBe("ba");
    expect(syllableFr(letter("ba"), "kasra")).toBe("bi");
    expect(syllableFr(letter("ba"), "damma")).toBe("bou");
    expect(syllableFr(letter("shin"), "fatha")).toBe("cha");
  });

  it("ne garde que la lettre d'une description longue", () => {
    expect(syllableFr(letter("ra"), "fatha")).toBe("ra");
    expect(syllableFr(letter("waw"), "fatha")).toBe("wa");
    expect(syllableFr(letter("ya"), "damma")).toBe("you");
    expect(syllableFr(letter("sad"), "kasra")).toBe("si");
  });

  it("ne laisse jamais de parenthèse, de barre ni d'espace", () => {
    for (const entry of ARABIC_LETTERS) {
      for (const h of HARAKAT) {
        expect(syllableFr(entry, h.key)).toMatch(/^[^\s()/]+$/);
      }
    }
  });
});
