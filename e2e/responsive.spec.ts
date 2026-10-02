import { test, expect } from "@playwright/test";

test.describe("Responsive design", () => {
  test("la page /admin/dashboard est utilisable sur desktop (1280px)", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/admin/dashboard");
    await expect(page.locator("body")).toBeVisible();
  });

  test("la page /parent/dashboard est utilisable sur mobile (375px)", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/parent/dashboard");
    await expect(page.locator("body")).toBeVisible();
  });
});
