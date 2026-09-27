import { test, expect, Page } from "@playwright/test";

/**
 * E2E — Palier progression guard.
 *
 * Verifies that a student CANNOT skip paliers by manually changing the URL.
 * A fresh student who hasn't validated palier 1 must be blocked from palier 2+.
 */

const TOPIC_ID = "kx72jtwbh764f48mq0y63ht3hn85qs7p"; // Fractions CE2

async function registerFreshStudent(page: Page): Promise<void> {
  const ts = Date.now();
  const email = `guard-${ts}@jotna.test`;
  const password = "TestPass123!";

  await page.goto("/register");
  await page.locator('input[type="text"]').fill(`Guard ${ts}`);
  await page.locator('input[type="email"]').fill(email);
  const pwFields = page.locator('input[type="password"]');
  await pwFields.nth(0).fill(password);
  await pwFields.nth(1).fill(password);
  await page.locator("select").selectOption("student");
  await page
    .getByRole("button", { name: /Créer un compte|S'inscrire/i })
    .first()
    .click();

  await page.waitForFunction(
    () => !location.pathname.includes("/register"),
    { timeout: 30_000 },
  );
  if (page.url().includes("/login")) {
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page
      .getByRole("button", { name: /Se connecter/i })
      .first()
      .click();
    await page.waitForFunction(
      () => !location.pathname.includes("/login"),
      { timeout: 30_000 },
    );
  }
  await page.waitForTimeout(3000);
}

test.describe("Palier progression guard", () => {
  test("fresh student is blocked from accessing palier 2 directly", async ({
    page,
  }) => {
    test.setTimeout(120_000);

    await registerFreshStudent(page);

    // Go directly to palier 2 — should be blocked
    await page.goto(
      `/student/topics/session?id=${TOPIC_ID}&palier=2`,
    );
    await page.waitForTimeout(10_000);

    await page.screenshot({
      path: ".context/screenshots/guard-palier2-blocked.png",
      fullPage: true,
    });

    const body = (await page.textContent("body")) ?? "";
    console.log("Palier 2 body (first 500 chars):", body.slice(0, 500));

    // Should NOT see exercise UI (Question X/10, Valider button)
    const hasExercise =
      body.includes("Question 1/") && body.includes("Valider");
    expect(hasExercise).toBe(false);

    // Should see the block message from the server
    const hasBlockMessage =
      body.includes("valider le palier") ||
      body.includes("Encore une marche avant") ||
      body.includes("Reprendre le palier");
    expect(hasBlockMessage).toBe(true);

    await expect(
      page.getByRole("heading", { name: /Encore une marche avant/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Reprendre le palier 1/i }),
    ).toBeVisible();
  });

  test("fresh student is blocked from accessing palier 9 directly", async ({
    page,
  }) => {
    test.setTimeout(120_000);

    await registerFreshStudent(page);

    await page.goto(
      `/student/topics/session?id=${TOPIC_ID}&palier=9`,
    );
    await page.waitForTimeout(10_000);

    await page.screenshot({
      path: ".context/screenshots/guard-palier9-blocked.png",
      fullPage: true,
    });

    const body = (await page.textContent("body")) ?? "";
    console.log("Palier 9 body (first 500 chars):", body.slice(0, 500));

    const hasExercise =
      body.includes("Question 1/") && body.includes("Valider");
    expect(hasExercise).toBe(false);

    await expect(
      page.getByRole("heading", { name: /Encore une marche avant/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Reprendre le palier 8/i }),
    ).toBeVisible();
  });

  test("fresh student CAN access palier 1", async ({ page }) => {
    test.setTimeout(120_000);

    await registerFreshStudent(page);

    await page.goto(
      `/student/topics/session?id=${TOPIC_ID}&palier=1`,
    );
    await page.waitForTimeout(15_000);

    await page.screenshot({
      path: ".context/screenshots/guard-palier1-allowed.png",
      fullPage: true,
    });

    const body = (await page.textContent("body")) ?? "";
    console.log("Palier 1 body (first 500 chars):", body.slice(0, 500));

    // Should see exercise UI
    const hasExercise =
      body.includes("Question 1/") || body.includes("Valider");
    expect(hasExercise).toBe(true);

    let nativeDialogSeen = false;
    page.on("dialog", async (dialog) => {
      nativeDialogSeen = true;
      await dialog.dismiss();
    });
    await page
      .getByRole("button", { name: /Sauvegarder et quitter/i })
      .first()
      .click();
    expect(nativeDialogSeen).toBe(false);
    await expect(
      page.getByRole("heading", { name: /Tu veux quitter/i }),
    ).toBeVisible();
    await expect(
      page.getByText(/Ta progression est sauvegardée/i),
    ).toBeVisible();
    await page
      .getByRole("button", { name: /Continuer l'exercice/i })
      .click();
    await expect(
      page.getByRole("heading", { name: /Tu veux quitter/i }),
    ).toBeHidden();

    await page.locator("button.border-3").first().click();
    await page.getByRole("button", { name: /^Valider$/ }).click();
    await expect(page.getByText(/Question 2\/10/i)).toBeVisible({
      timeout: 10_000,
    });

    await page
      .getByRole("button", { name: /Sauvegarder et quitter/i })
      .first()
      .click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: /^Sauvegarder et quitter$/i })
      .click();
    await page.goto(`/student/topics/session?id=${TOPIC_ID}&palier=1`);
    await expect(page.getByText(/Question 2\/10/i)).toBeVisible({
      timeout: 30_000,
    });
  });
});
