import { describe, expect, it } from "vitest";
import { PICTURE_TILE_CLASSES } from "@/lib/item-pictures";
import { picturesEnabled, readImagesFlag } from "../images";

const search = (query: string) => new URLSearchParams(query);

describe("readImagesFlag : ce que l'URL dit des images", () => {
  it("lit 0 comme faux, 1 comme vrai", () => {
    expect(readImagesFlag(search("images=0"))).toBe(false);
    expect(readImagesFlag(search("images=1"))).toBe(true);
    expect(readImagesFlag(search("type=qcm4&images=0&barre=0"))).toBe(false);
  });

  it("n'en dit rien sans le paramètre, ni avec une valeur qu'il ne connaît pas", () => {
    expect(readImagesFlag(search(""))).toBeNull();
    expect(readImagesFlag(search("type=qcm4"))).toBeNull();
    expect(readImagesFlag(search("images="))).toBeNull();
    expect(readImagesFlag(search("images=oui"))).toBeNull();
    expect(readImagesFlag(search("images=2"))).toBeNull();
  });
});

describe("picturesEnabled : la porte de la classe, sauf si l'URL en décide", () => {
  it("sans paramètre, le CI voit les images, le CP et le CE1 non, comme en séance", () => {
    expect(picturesEnabled("CI", null)).toBe(true);
    expect(picturesEnabled("CP", null)).toBe(false);
    expect(picturesEnabled("CE1", null)).toBe(false);
    for (const klass of ["CE2", "CM1", "CM2"]) expect(picturesEnabled(klass, null)).toBe(false);
  });

  it("suit PICTURE_TILE_CLASSES : élargir la liste au CP ouvre la porte au CP, sans toucher aux pages", () => {
    for (const klass of ["CI", "CP", "CE1", "CE2", "CM1", "CM2"]) {
      expect(picturesEnabled(klass, null), klass).toBe((PICTURE_TILE_CLASSES as readonly string[]).includes(klass));
    }
  });

  it("images=0 les coupe partout, même au CI", () => {
    expect(picturesEnabled("CI", false)).toBe(false);
    expect(picturesEnabled("CP", false)).toBe(false);
  });

  it("images=1 les montre partout, même au CP et au CE1", () => {
    expect(picturesEnabled("CI", true)).toBe(true);
    expect(picturesEnabled("CP", true)).toBe(true);
    expect(picturesEnabled("CE1", true)).toBe(true);
  });

  it("une classe absente n'ouvre pas la porte", () => {
    expect(picturesEnabled(undefined, null)).toBe(false);
    expect(picturesEnabled(null, null)).toBe(false);
    expect(picturesEnabled("", null)).toBe(false);
  });
});
