import { test, expect, type Page } from "@playwright/test";

/**
 * LE BOUTON « REMONTER » NE RECOUVRE PLUS « VALIDER » SUR TÉLÉPHONE.
 *
 * Fixe en bas à droite, il cachait l'extrémité de « Valider » dans la
 * démonstration des exercices ; toucher cette zone remontait la page. Sur
 * téléphone il n'apparaît donc que quand on remonte la page, puis se retire ;
 * à partir de 640 px il reste affiché.
 */

const button = (page: Page) => page.getByRole("button", { name: "Remonter en haut de la page" });

/** Ouvre la page et attend qu'elle soit assez longue pour y défiler jusqu'à 2 000 px. */
async function open(page: Page) {
  await page.goto("/");
  await page.waitForFunction(() => document.documentElement.scrollHeight > 4_000);
  // L'écouteur de défilement est posé à l'hydratation.
  await page.waitForTimeout(500);
}

/** Défile d'un coup (la page est en `scroll-behavior: smooth`), vérifie qu'on y est, et laisse passer l'événement. */
async function scrollTo(page: Page, top: number) {
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), top);
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBe(top);
  await page.waitForTimeout(150);
}

test.describe("téléphone (375 px)", () => {
  test.use({ viewport: { width: 375, height: 667 }, hasTouch: true, isMobile: true });

  test("absent en descendant, présent en remontant, puis retiré", async ({ page }) => {
    await open(page);
    await scrollTo(page, 1500);
    await expect(button(page)).toHaveCount(0);
    await scrollTo(page, 1800);
    await expect(button(page)).toHaveCount(0);

    await scrollTo(page, 1400);
    await expect(button(page)).toBeVisible();

    // Sans défilement, il se retire : il ne reste pas sur « Valider ».
    await expect(button(page)).toHaveCount(0, { timeout: 6_000 });
  });

  test("se retire dès qu'on redescend, et ne s'affiche pas en haut de page", async ({ page }) => {
    await open(page);
    await scrollTo(page, 1500);
    await scrollTo(page, 1300);
    await expect(button(page)).toBeVisible();
    await scrollTo(page, 1600);
    await expect(button(page)).toHaveCount(0);

    await scrollTo(page, 300);
    await scrollTo(page, 100);
    await expect(button(page)).toHaveCount(0);
  });

  test("remonte la page quand on le touche", async ({ page }) => {
    await open(page);
    await scrollTo(page, 1500);
    await scrollTo(page, 1400);
    await button(page).tap();
    await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 5_000 }).toBeLessThan(5);
  });
});

test.describe("ordinateur (1280 px)", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("affiché dès que la page est longue, et il y reste", async ({ page }) => {
    await open(page);
    await expect(button(page)).toHaveCount(0);
    await scrollTo(page, 1500);
    await expect(button(page)).toBeVisible();
    await scrollTo(page, 1900);
    await expect(button(page)).toBeVisible();
    await page.waitForTimeout(3_000);
    await expect(button(page)).toBeVisible();
  });
});
