import { test, expect } from "@playwright/test";
import { EXERCISE_IMAGES, exerciseImageSrc } from "../lib/exercise-images";

/**
 * CHAQUE IMAGE DU CATALOGUE EST SERVIE.
 *
 * Le catalogue (`lib/exercise-images.ts`) promet des images au modèle qui écrit
 * les exercices. Un fichier absent ou servi pour autre chose qu'une image
 * afficherait une question sans scène, le défaut même que ces images corrigent.
 * Le test unitaire vérifie que chaque entrée a son fichier sur le disque ; ici,
 * le site le sert vraiment, avec le bon type.
 */
test.describe("images d'énoncé servies par le site", () => {
  for (const image of EXERCISE_IMAGES) {
    test(`${image.id}`, async ({ request }) => {
      const response = await request.get(exerciseImageSrc(image.id));
      expect(response.status()).toBe(200);
      expect(response.headers()["content-type"]).toContain("image/webp");
      expect((await response.body()).length).toBeGreaterThan(1_000);
    });
  }
});
