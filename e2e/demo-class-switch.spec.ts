import { test, expect } from "@playwright/test";

/**
 * CHANGER DE CLASSE DEVANT LA SECTION « EXERCICES » MONTRE LES NOUVELLES CARTES.
 *
 * Les cartes entrent par un fondu qui ne part qu'une fois (`StaggerContainer`,
 * `viewport.once`). Un visiteur qui arrive sur la section puis choisit une autre
 * classe gardait ce conteneur déjà « montré » : les nouvelles cartes naissaient
 * à `opacity: 0` et restaient invisibles, la page paraissait vide. Un test
 * unitaire ne le voit pas (pas d'IntersectionObserver dans jsdom) : on le joue
 * dans un vrai navigateur.
 */

test("après un changement de classe, les cartes de la classe sont visibles", async ({ page }) => {
  await page.goto("/");
  const section = page.locator("#exercices");
  await section.scrollIntoViewIfNeeded();

  const cards = section.locator('[role="group"]');
  // La classe affichée d'abord : ses cartes se montrent.
  await expect(cards.first().locator(".ring-amber-100")).toBeVisible({ timeout: 30_000 });
  await expect(cards.first()).toHaveCSS("opacity", "1");

  for (const klass of [/^CP/, /^CM2/, /^CI/]) {
    await page.getByRole("radio", { name: klass }).click();
    // `toHaveCSS` rejoue jusqu'à la fin du fondu (0,5 s) : opacité 1 sur chaque carte.
    await expect(cards.first().locator(".ring-amber-100")).toBeVisible({ timeout: 30_000 });
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(5);
    for (let i = 0; i < count; i++) {
      await cards.nth(i).scrollIntoViewIfNeeded();
      await expect(cards.nth(i)).toHaveCSS("opacity", "1");
    }
    await section.getByRole("radio", { name: klass }).scrollIntoViewIfNeeded();
  }
});

test("le changement de matière montre aussi ses cartes", async ({ page }) => {
  await page.goto("/");
  const section = page.locator("#exercices");
  await section.scrollIntoViewIfNeeded();
  const cards = section.locator('[role="group"]');
  await expect(cards.first().locator(".ring-amber-100")).toBeVisible({ timeout: 30_000 });

  await page.locator("#exercices-onglet-mathematiques").click();
  await expect(cards.first().locator(".ring-amber-100")).toBeVisible({ timeout: 30_000 });
  await cards.first().scrollIntoViewIfNeeded();
  await expect(cards.first()).toHaveCSS("opacity", "1");
});
