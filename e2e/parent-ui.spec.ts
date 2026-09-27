import { test, expect } from "@playwright/test";

test.describe("Espace Parent", () => {
  test("la page /parent/dashboard se charge", async ({ page }) => {
    const response = await page.goto("/parent/dashboard");
    expect(response?.status()).toBeLessThan(500);
  });

  // `/parent/children/add` a disparu avec le passage au B2B : un parent ne
  // cree plus de compte eleve, il saisit le code remis par l'ecole.
  test("la page /parent/children/code contient un formulaire", async ({ page }) => {
    await page.goto("/parent/children/code");
    await expect(page.locator("main form, main input").first()).toBeVisible();
  });

  test("la page /parent/settings se charge", async ({ page }) => {
    const response = await page.goto("/parent/settings");
    expect(response?.status()).toBeLessThan(500);
  });
});
