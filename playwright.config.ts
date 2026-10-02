import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Disable Same-Site cookie restrictions for cross-origin Convex Auth in dev
        launchOptions: {
          args: [
            "--disable-features=SameSiteByDefaultCookies,CookiesWithoutSameSiteMustBeSecure",
            "--disable-web-security",
          ],
        },
        ignoreHTTPSErrors: true,
      },
    },
  ],
  webServer: {
    // Le site web : école, professeurs, parents. L'espace élève n'existe que
    // dans l'application iOS/Android et ne s'ouvre dans aucun navigateur
    // (`lib/build-target.ts`) : il se teste sur simulateur ou téléphone.
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
