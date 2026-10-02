import { test, expect } from "@playwright/test";

/**
 * MVP-1 smoke tests — verify new routes and UI render without 5xx errors.
 *
 * Full E2E with auth flow + seed data is in `e2e/mvp1/` (to be added once
 * Convex testSeeds module is in place).
 */

test.describe("MVP-1 — smoke", () => {
  test("la landing page /  charge sans erreur", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBeLessThan(500);
  });

  test("/admin/ai-settings (route MVP-1) charge sans 5xx", async ({
    page,
  }) => {
    const response = await page.goto("/admin/ai-settings");
    expect(response?.status()).toBeLessThan(500);
  });

  test("le site n'a pas d'espace élève : /student/home répond 404", async ({ page }) => {
    // Les élèves n'apprennent que dans l'application iOS/Android (`lib/build-target.ts`).
    const response = await page.goto("/student/home");
    expect(response?.status()).toBe(404);
  });

  test("la page /login charge correctement", async ({ page }) => {
    const response = await page.goto("/login");
    expect(response?.status()).toBe(200);
    await expect(page.getByText(/Connexion|Se connecter/i).first()).toBeVisible();
  });

  test("la page /register charge correctement", async ({ page }) => {
    const response = await page.goto("/register");
    expect(response?.status()).toBe(200);
  });

  test("/parent/dashboard charge sans 5xx", async ({ page }) => {
    const response = await page.goto("/parent/dashboard");
    expect(response?.status()).toBeLessThan(500);
  });
});
