// Refait la capture pleine page de la landing utilisée par la scène « Le site ».
// Prérequis : le site tourne en local (`pnpm dev` à la racine du dépôt).
// Usage : node scripts/capture-landing.mjs [url]   (défaut : http://localhost:3000/)
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "../../node_modules/@playwright/test/index.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, "..", "public", "shots", "landing-full.png");
const url = process.argv[2] ?? "http://localhost:3000/";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: "networkidle" });
// Masque le badge de développement de Next.js.
await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
// Fait défiler la page pour déclencher les animations « à l'apparition ».
const height = await page.evaluate(() => document.body.scrollHeight);
for (let y = 0; y < height; y += 300) {
  await page.evaluate((top) => window.scrollTo(0, top), y);
  await page.waitForTimeout(300);
}
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(2500);
await page.screenshot({ path: out, fullPage: true });
const sections = await page.evaluate(() =>
  Array.from(document.querySelectorAll("section, footer")).map((s) => ({
    id: s.id,
    top: Math.round(s.getBoundingClientRect().top + window.scrollY),
  })),
);
console.log(`Capture écrite dans ${out}`);
console.log("Haut des sections (px CSS), à reporter dans src/scenes/Landing.tsx :", JSON.stringify(sections));
await browser.close();
