import { expect, test, type Browser, type Page } from "@playwright/test";
import { signIn, signInAsAdmin } from "./helpers/auth";

const TEST_PASSWORD = process.env.E2E_TEST_USER_PASSWORD ?? "Admin@2026!";

async function newSignedInPage(browser: Browser, userName: string) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await signIn(page, userName, TEST_PASSWORD);
  return { context, page };
}

test.describe("dashboard verification (F-022)", () => {
  test.setTimeout(60_000);

  test("unauthenticated API access is rejected", async ({ request }) => {
    const res = await request.get("/api/v1/app/dashboard/stats", {
      maxRedirects: 0,
    });
    expect([401, 302]).toContain(res.status());
    expect(res.ok()).toBeFalsy();
  });

  test("any authenticated user can access dashboard stats (no specific permission required)", async ({
    browser,
  }) => {
    // Dashboard is guarded by [Authorize] only — any valid login suffices.
    const { context, page } = await newSignedInPage(
      browser,
      "noperm@foodsafe.local",
    );
    try {
      const res = await page.context().request.get(
        "/api/v1/app/dashboard/stats",
        { maxRedirects: 0 },
      );
      expect(res.ok(), await res.text()).toBeTruthy();
    } finally {
      await context.close();
    }
  });

  test("admin receives well-formed stats with all expected fields", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    const res = await page.context().request.get(
      "/api/v1/app/dashboard/stats",
      { maxRedirects: 0 },
    );
    expect(res.ok(), await res.text()).toBeTruthy();
    const body = (await res.json()) as {
      totalBusinesses: number;
      activeBusinesses: number;
      totalSelfDeclarations: number;
      totalInspectionPlans: number;
      totalAlerts: number;
      licenseBreakdown: unknown[];
      recentActivities: unknown[];
    };
    expect(typeof body.totalBusinesses).toBe("number");
    expect(typeof body.activeBusinesses).toBe("number");
    expect(typeof body.totalSelfDeclarations).toBe("number");
    expect(typeof body.totalInspectionPlans).toBe("number");
    expect(typeof body.totalAlerts).toBe("number");
    expect(Array.isArray(body.licenseBreakdown)).toBeTruthy();
    expect(Array.isArray(body.recentActivities)).toBeTruthy();
    // Prior E2E test runs created entities — totals should be positive
    expect(body.totalBusinesses).toBeGreaterThan(0);
  });

  test("district staff receives scoped stats (totalBusinesses ≥ 0)", async ({
    browser,
  }) => {
    // district.staff is scoped to their org — may see 0 if no businesses in their org,
    // but the endpoint must respond 200 (authentication-only gate).
    const { context, page } = await newSignedInPage(
      browser,
      "district.staff@foodsafe.local",
    );
    try {
      const res = await page.context().request.get(
        "/api/v1/app/dashboard/stats",
        { maxRedirects: 0 },
      );
      expect(res.ok(), await res.text()).toBeTruthy();
      const body = (await res.json()) as { totalBusinesses: number };
      expect(typeof body.totalBusinesses).toBe("number");
      expect(body.totalBusinesses).toBeGreaterThanOrEqual(0);
    } finally {
      await context.close();
    }
  });

  test("UI: dashboard page loads with greeting, stat cards, and license breakdown", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    await page.goto("/dashboard");
    await expect(
      page.getByRole("heading", { name: /Xin chào/ }),
    ).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Cơ sở SXKD")).toBeVisible();
    await expect(page.getByText("Phân bố hồ sơ theo loại")).toBeVisible();
    await expect(page.getByText("Chi tiết theo loại hồ sơ")).toBeVisible();
  });
});
