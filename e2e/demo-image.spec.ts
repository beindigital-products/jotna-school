import { test, expect } from "@playwright/test";

/**
 * LA DÉMONSTRATION MONTRE UNE IMAGE D'ÉNONCÉ.
 *
 * Au CI en éveil scientifique, la phrase à trous « La mangue est ___ du
 * manguier » porte `image: "mangue"` (`components/landing/demo/bank/`). L'enfant
 * de CI ne lit pas la phrase : l'image lui montre de quoi elle parle. On vérifie
 * dans un vrai navigateur que l'image se charge, qu'elle est au-dessus de la
 * consigne, et que l'exercice reste jouable (mauvaise réponse refusée, bonne
 * acceptée).
 */
test("l'exercice à image du CI s'affiche et se joue", async ({ page }) => {
  await page.goto("/");
  const tab = page.locator('[id^="exercices-onglet-"]').filter({ hasText: /veil/i });
  await tab.scrollIntoViewIfNeeded();
  await tab.click();
  await page.getByRole("radio", { name: /^CI/ }).click();

  const card = page.locator('#exercices [role="group"]').filter({ hasText: "manguier" });
  const image = card.getByRole("img", { name: "Une mangue" });
  await expect(image).toBeVisible({ timeout: 30_000 });
  await expect.poll(() => image.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth)).toBeGreaterThan(0);

  // L'image est au-dessus de la consigne.
  const imageBox = (await image.boundingBox())!;
  const promptBox = (await card.getByText("Complète la phrase avec le bon mot.").boundingBox())!;
  expect(imageBox.y + imageBox.height).toBeLessThanOrEqual(promptBox.y + 1);

  const play = async (word: string) => {
    await card.getByRole("button", { name: /Trou 1/ }).click();
    await card.getByRole("button", { name: word, exact: true }).click();
    await card.getByRole("button", { name: "Valider", exact: true }).click();
  };
  // L'annonce du résultat est propre à chaque réponse, contrairement au texte de la
  // carte (« …pour que la phrase soit juste »). La carte garde celle de l'erreur à
  // côté de celle de la réussite : on cible chaque annonce par son texte.
  const announced = (text: string) => card.getByRole("status").filter({ hasText: text });
  await play("la racine");
  await expect(announced("pas celle-là")).toBeVisible();
  await expect(announced("Bien joué")).toHaveCount(0);
  await card.getByRole("button", { name: /Réessayer/ }).click();
  await play("le fruit");
  await expect(announced("Bien joué")).toBeVisible();
});
