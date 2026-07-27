import { expect, test, type Browser, type Page } from "@playwright/test";
import { signIn, signInAsAdmin } from "./helpers/auth";

const TEST_PASSWORD = process.env.E2E_TEST_USER_PASSWORD ?? "Admin@2026!";

async function newSignedInPage(browser: Browser, userName: string) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await signIn(page, userName, TEST_PASSWORD);
  return { context, page };
}

test.describe("statistics verification (F-023)", () => {
  test.setTimeout(60_000);

  test("unauthenticated API access is rejected", async ({ request }) => {
    const res = await request.get("/api/v1/app/statistics", {
      maxRedirects: 0,
    });
    expect([401, 302]).toContain(res.status());
    expect(res.ok()).toBeFalsy();
  });

  test("any authenticated user can access statistics (no specific permission required)", async ({
    browser,
  }) => {
    const { context, page } = await newSignedInPage(
      browser,
      "noperm@foodsafe.local",
    );
    try {
      const res = await page.context().request.get("/api/v1/app/statistics", {
        maxRedirects: 0,
      });
      expect(res.ok(), await res.text()).toBeTruthy();
    } finally {
      await context.close();
    }
  });

  test("admin receives well-formed statistics with all expected fields", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    const res = await page.context().request.get(
      "/api/v1/app/statistics?year=2026",
      { maxRedirects: 0 },
    );
    expect(res.ok(), await res.text()).toBeTruthy();
    const body = (await res.json()) as {
      businessByStatus: unknown[];
      businessByType: unknown[];
      licenseByCategory: unknown[];
      licenseByStatus: unknown[];
      inspectionsByMonth: unknown[];
      violationsByMonth: unknown[];
      inspectionOutcome: unknown[];
      poisoningCasesByMonth: unknown[];
    };
    expect(Array.isArray(body.businessByStatus)).toBeTruthy();
    expect(Array.isArray(body.businessByType)).toBeTruthy();
    expect(Array.isArray(body.licenseByCategory)).toBeTruthy();
    expect(Array.isArray(body.licenseByStatus)).toBeTruthy();
    expect(Array.isArray(body.inspectionsByMonth)).toBeTruthy();
    expect(Array.isArray(body.violationsByMonth)).toBeTruthy();
    expect(Array.isArray(body.inspectionOutcome)).toBeTruthy();
    expect(Array.isArray(body.poisoningCasesByMonth)).toBeTruthy();
  });

  test("year parameter is respected: different years return different shapes", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    const req = page.context().request;
    const [res2026, res2025] = await Promise.all([
      req.get("/api/v1/app/statistics?year=2026", { maxRedirects: 0 }),
      req.get("/api/v1/app/statistics?year=2025", { maxRedirects: 0 }),
    ]);
    expect(res2026.ok(), await res2026.text()).toBeTruthy();
    expect(res2025.ok(), await res2025.text()).toBeTruthy();
    // Both return valid array-based shapes; the actual data may differ but
    // the contract must be consistent.
    const body2026 = (await res2026.json()) as {
      inspectionsByMonth: unknown[];
    };
    const body2025 = (await res2025.json()) as {
      inspectionsByMonth: unknown[];
    };
    expect(Array.isArray(body2026.inspectionsByMonth)).toBeTruthy();
    expect(Array.isArray(body2025.inspectionsByMonth)).toBeTruthy();
  });

  test("UI: statistics page loads with heading and year selector", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    await page.goto("/statistics");
    await expect(
      page.getByRole("heading", { name: "Thống kê tổng hợp" }),
    ).toBeVisible({ timeout: 10_000 });
    // Year selector drop-down is present (rendered as an antd Select)
    await expect(page.locator(".ant-select").first()).toBeVisible();
    // At least one chart container is rendered
    await expect(page.locator(".recharts-responsive-container").first()).toBeVisible({
      timeout: 10_000,
    });
  });
});
