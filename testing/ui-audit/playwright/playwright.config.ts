import { defineConfig, devices } from "@playwright/test";

/**
 * Cấu hình riêng cho UI audit — tách khỏi suite e2e nghiệp vụ của FoodSafe.FE.
 * Chạy từ FoodSafe.FE (nơi có node_modules):
 *   npx playwright test --config=..\testing\ui-audit\playwright\playwright.config.ts
 */
export default defineConfig({
  testDir: ".",
  outputDir: ".results/artifacts",
  globalSetup: "./global-setup",
  fullyParallel: true,
  workers: 4,
  retries: 0,
  timeout: 90_000,
  reporter: [["list"], ["json", { outputFile: ".results/report.json" }]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://127.0.0.1:8080",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    viewport: { width: 1920, height: 1080 },
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1920, height: 1080 },
      },
    },
  ],
});
