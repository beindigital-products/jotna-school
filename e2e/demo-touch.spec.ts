import { test, expect, type CDPSession, type Locator, type Page } from "@playwright/test";

/**
 * LES EXERCICES DE LA DÉMONSTRATION, AU DOIGT.
 *
 * Un glisser-déposer et une mise en ordre se jouent au doigt sur téléphone et
 * sur tablette : si l'étiquette ou la poignée n'a pas `touch-action: none`, le
 * navigateur prend le geste pour un défilement, annule le glisser
 * (`pointercancel`) et la tuile ne bouge jamais. La souris, elle, ne montre
 * pas le défaut : on envoie donc de VRAIS événements tactiles (CDP,
 * `Input.dispatchTouchEvent`), pas des clics.
 *
 * ÉMULATION CHROMIUM : viewport, écran tactile et user-agent d'iPhone, mais le
 * moteur est Blink, pas WebKit. Ce test garde la règle de `touch-action` ; il
 * ne dit rien de Safari.
 */

const IPHONE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1";

test.use({
  viewport: { width: 375, height: 667 },
  hasTouch: true,
  isMobile: true,
  deviceScaleFactor: 2,
  userAgent: IPHONE_UA,
});

type Point = { x: number; y: number };

async function centerOf(locator: Locator): Promise<Point> {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  if (!box) throw new Error("élément sans boîte");
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

/** Un doigt qui se pose en `from`, glisse jusqu'en `to`, attend, puis se lève. */
async function swipe(cdp: CDPSession, from: Point, to: Point) {
  const steps = 14;
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ ...from, id: 0 }] });
  for (let i = 1; i <= steps; i++) {
    const point = { x: from.x + ((to.x - from.x) * i) / steps, y: from.y + ((to.y - from.y) * i) / steps };
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ ...point, id: 0 }] });
    await new Promise((resolve) => setTimeout(resolve, 14));
  }
  await new Promise((resolve) => setTimeout(resolve, 150));
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
}

/** Ouvre la démonstration sur « Histoire » en CE2 et rend la carte au titre donné. */
async function openCard(page: Page, title: string): Promise<Locator> {
  await page.goto("/");
  const tab = page.locator("#exercices-onglet-histoire");
  await tab.scrollIntoViewIfNeeded();
  await tab.tap();
  await page.getByRole("radio", { name: /^CE2/ }).tap();
  const card = page.locator('#exercices [role="group"]').filter({ has: page.getByRole("heading", { name: title }) });
  await expect(card.locator(".ring-amber-100")).toBeVisible({ timeout: 30_000 });
  // Le défilement doux de la page (`scroll-behavior: smooth`) se termine avant le geste.
  await card.scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  return card;
}

test.describe("Démonstration des exercices au doigt (émulation Chromium, pas WebKit)", () => {
  test("mise en ordre : glisser la poignée d'une tuile la déplace", async ({ page }) => {
    const card = await openCard(page, "Remettre en ordre");
    const cdp = await page.context().newCDPSession(page);
    const handles = card.locator('[aria-roledescription="sortable"]');
    const labels = () =>
      handles.evaluateAll((all) => all.map((h) => h.parentElement?.lastElementChild?.textContent ?? ""));

    const before = await labels();
    expect(before.length).toBeGreaterThanOrEqual(3);
    // La poignée est une cible de doigt : 44 px au moins.
    const box = await handles.last().boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);

    // La dernière tuile monte tout en haut.
    const from = await centerOf(handles.last());
    const topRow = await centerOf(handles.first().locator("xpath=.."));
    await swipe(cdp, from, { x: from.x, y: topRow.y });

    await expect.poll(labels).toEqual([before[before.length - 1], ...before.slice(0, -1)]);
  });

  test("glisser-déposer : une étiquette posée au doigt entre dans sa zone", async ({ page }) => {
    const card = await openCard(page, "Classer par le geste");
    const cdp = await page.context().newCDPSession(page);
    const bin = card.locator(".border-dashed [aria-roledescription=draggable]");
    const zone = card.locator(".ring-amber-100 h4").first().locator("xpath=..");
    const inZone = zone.locator("[aria-roledescription=draggable]");

    const total = await bin.count();
    expect(total).toBeGreaterThanOrEqual(2);
    const item = bin.first();
    const label = (await item.textContent()) ?? "";

    // Étiquette et zone dans l'écran en même temps : on cale la page sur leur milieu.
    const a = (await item.boundingBox())!;
    const z = (await zone.boundingBox())!;
    await page.evaluate(
      ([top, bottom]) => window.scrollBy({ top: (top + bottom) / 2 - window.innerHeight / 2, behavior: "instant" }),
      [Math.min(a.y, z.y), Math.max(a.y + a.height, z.y + z.height)],
    );
    await page.waitForTimeout(150);
    const from = await centerOf(item);
    const to = await centerOf(zone);
    await swipe(cdp, from, to);

    await expect(bin).toHaveCount(total - 1);
    await expect(inZone.filter({ hasText: label.trim() })).toHaveCount(1);
  });

  test("les boutons de la carte ont une cible de 44 px au moins", async ({ page }) => {
    const card = await openCard(page, "Questions à choix multiples");
    const screen = card.locator(".ring-amber-100");
    // Une mauvaise réponse : l'indice et « Réessayer » apparaissent.
    await screen.getByRole("button", { name: /^A/ }).first().tap();
    await screen.getByRole("button", { name: "Valider", exact: true }).tap();
    const retry = card.getByRole("button", { name: /Réessayer/ });
    await expect(retry).toBeVisible();
    // Bonne ou fausse, on ne sait pas laquelle : on ne vérifie que les boutons montrés.
    for (const name of [/Réessayer/, /Un autre exemple/, /Voir un indice/]) {
      const button = card.getByRole("button", { name });
      if ((await button.count()) === 0) continue;
      const size = await button.first().boundingBox();
      expect(size!.height, String(name)).toBeGreaterThanOrEqual(44);
    }
  });
});
