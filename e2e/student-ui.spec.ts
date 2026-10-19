import { test, expect } from "@playwright/test";

test.describe("Espace Élève", () => {
  test("la page /student/home se charge", async ({ page }) => {
    const response = await page.goto("/student/home");
    expect(response?.status()).toBeLessThan(500);
  });

  test("la page /student/badges se charge", async ({ page }) => {
    const response = await page.goto("/student/badges");
    expect(response?.status()).toBeLessThan(500);
    await expect(page.locator("body")).toBeVisible();
  });

  test("la page /student/profil se charge", async ({ page }) => {
    const response = await page.goto("/student/profil");
    expect(response?.status()).toBeLessThan(500);
  });

  test("la navigation supérieure contient les liens principaux", async ({ page }) => {
    await page.goto("/student/home");
    // Les quatre lieux du Monde de Pio : Camp, Carte, Trophées, Carnet.
    await expect(page.getByRole("link", { name: /Camp/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Carte/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Trophées/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Carnet/i }).first()).toBeVisible();
  });
});
