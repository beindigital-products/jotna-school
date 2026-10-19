import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  EXERCISE_IMAGES,
  EXERCISE_IMAGE_ID,
  exerciseImageCatalogueText,
  exerciseImageIdOf,
  exerciseImageSrc,
  findExerciseImage,
  type ExerciseImage,
} from "../exercise-images";

const sample: ExerciseImage[] = [
  { id: "chat", alt: "Un chat assis", about: "un chat" },
  { id: "pirogue-coloree", alt: "Une pirogue de pêcheur", about: "une pirogue sénégalaise" },
];

describe("catalogue des images d'énoncé : les fonctions", () => {
  it("retrouve une image par son identifiant, et seulement si le catalogue la porte", () => {
    expect(findExerciseImage("chat", sample)?.alt).toBe("Un chat assis");
    expect(findExerciseImage("chien", sample)).toBeNull();
    expect(findExerciseImage(42, sample)).toBeNull();
    expect(findExerciseImage(undefined, sample)).toBeNull();
  });

  it("refuse un identifiant qui n'est pas un nom de fichier sûr", () => {
    for (const id of ["../secret", "Chat", "chat.webp", "a/b", "chat ", "-chat", ""]) {
      expect(findExerciseImage(id, [{ id, alt: "x", about: "x" }]), id).toBeNull();
    }
  });

  it("lit l'image d'un payload, ou rien", () => {
    expect(exerciseImageIdOf({ options: ["a", "b"], image: "chat" }, sample)).toBe("chat");
    expect(exerciseImageIdOf({ image: "inconnue" }, sample)).toBeNull();
    expect(exerciseImageIdOf({ options: [] }, sample)).toBeNull();
    expect(exerciseImageIdOf(null, sample)).toBeNull();
    expect(exerciseImageIdOf("chat", sample)).toBeNull();
  });

  it("sert l'image depuis les fichiers du site, et dit le catalogue au modèle", () => {
    expect(exerciseImageSrc("chat")).toBe("/exercices/chat.webp");
    expect(exerciseImageCatalogueText(sample)).toBe("- chat : un chat\n- pirogue-coloree : une pirogue sénégalaise");
    expect(exerciseImageCatalogueText([])).toBe("");
  });
});

/**
 * UNE ENTRÉE, UN FICHIER. Le catalogue promet au modèle des images ; un fichier
 * absent afficherait une question sans scène, le défaut même qu'on corrige.
 */
describe("catalogue des images d'énoncé : les fichiers", () => {
  const dir = join(process.cwd(), "public", "exercices");
  const files = existsSync(dir) ? readdirSync(dir).filter((name) => name.endsWith(".webp")) : [];

  it("chaque entrée a un identifiant sûr, unique, un texte alternatif et un sujet", () => {
    const ids = EXERCISE_IMAGES.map((image) => image.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const image of EXERCISE_IMAGES) {
      expect(image.id, image.id).toMatch(EXERCISE_IMAGE_ID);
      expect(image.alt.trim().length, `${image.id} : alt`).toBeGreaterThan(2);
      expect(image.about.trim().length, `${image.id} : about`).toBeGreaterThan(2);
      expect(image.alt, `${image.id} : alt`).not.toMatch(/^(image|photo|dessin) de/i);
    }
  });

  it("chaque entrée a son fichier public/exercices/<id>.webp", () => {
    for (const image of EXERCISE_IMAGES) expect(files, image.id).toContain(`${image.id}.webp`);
  });

  it("chaque fichier a son entrée : pas d'image orpheline", () => {
    const known = new Set(EXERCISE_IMAGES.map((image) => `${image.id}.webp`));
    for (const file of files) expect(known.has(file), file).toBe(true);
  });
});
