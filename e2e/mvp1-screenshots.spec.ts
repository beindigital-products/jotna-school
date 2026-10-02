import { test } from "@playwright/test";

test.describe("MVP-1 — visual screenshots", () => {
  test("admin AI settings page", async ({ page }) => {
    await page.goto("/admin/ai-settings");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: ".context/screenshots/admin-ai-settings.png",
      fullPage: true,
    });
  });

  test("landing page", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: ".context/screenshots/landing.png",
      fullPage: true,
    });
  });
});
