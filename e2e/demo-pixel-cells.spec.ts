import { test, expect } from "@playwright/test";

/**
 * LE DESSIN SUR QUADRILLAGE DE LA DÉMONSTRATION A DES CASES DE DOIGT.
 *
 * L'écran cale la taille des cases sur la hauteur libre de l'écran, mesurée
 * depuis le haut de l'exercice. Dans la séance, l'exercice est en haut de la
 * page ; dans la vitrine, la carte est des milliers de pixels plus bas : la
 * mesure partait du haut de la PAGE, trouvait une hauteur négative et
 * réduisait toujours les cases à leur minimum (26 px), même sur un écran de
 * bureau ou de tablette. Les cases d'une carte de la vitrine ne dépendent plus
 * de la hauteur de l'écran.
 */

for (const [name, viewport] of [
  ["bureau 1280×800", { width: 1280, height: 800 }],
  ["tablette 820×1180", { width: 820, height: 1180 }],
] as const) {
  test(`cases de 36 px au moins, ${name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await page.locator("#exercices").scrollIntoViewIfNeeded();
    await page.locator("#exercices-onglet-education-artistique").click();
    await page.getByRole("radio", { name: /^CE2/ }).click();
    const card = page
      .locator('#exercices [role="group"]')
      .filter({ has: page.getByRole("heading", { name: "Dessiner sur quadrillage" }) })
      .first();
    const cell = card.locator('[role="gridcell"]').first();
    await expect(cell).toBeAttached({ timeout: 30_000 });
    await cell.scrollIntoViewIfNeeded();
    await expect.poll(async () => (await cell.boundingBox())?.width ?? 0).toBeGreaterThanOrEqual(36);
  });
}
