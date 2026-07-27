import { expect, test, type Browser, type Page } from "@playwright/test";
import { signIn, signInAsAdmin } from "./helpers/auth";

const TEST_PASSWORD = process.env.E2E_TEST_USER_PASSWORD ?? "Admin@2026!";

async function newSignedInPage(browser: Browser, userName: string) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await signIn(page, userName, TEST_PASSWORD);
  return { context, page };
}

test.describe("audit logs verification (F-021)", () => {
  test.setTimeout(60_000);

  test("unauthenticated API access is rejected", async ({ request }) => {
    const res = await request.get("/api/v1/app/audit-log", {
      maxRedirects: 0,
    });
    expect([401, 302]).toContain(res.status());
    expect(res.ok()).toBeFalsy();
  });

  test("user without audit-log permission is denied", async ({ browser }) => {
    const { context, page } = await newSignedInPage(
      browser,
      "noperm@foodsafe.local",
    );
    try {
      const res = await page.context().request.get("/api/v1/app/audit-log", {
        maxRedirects: 0,
      });
      expect([403, 302]).toContain(res.status());
      expect(res.ok()).toBeFalsy();
    } finally {
      await context.close();
    }
  });

  test("district staff without audit-log permission is denied", async ({
    browser,
  }) => {
    // AuditLogs is a province SystemAdmin function — district staff are denied.
    const { context, page } = await newSignedInPage(
      browser,
      "district.staff@foodsafe.local",
    );
    try {
      const res = await page.context().request.get("/api/v1/app/audit-log", {
        maxRedirects: 0,
      });
      expect([403, 302]).toContain(res.status());
      expect(res.ok()).toBeFalsy();
    } finally {
      await context.close();
    }
  });

  test("admin can list audit logs; prior test activity produces entries", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    const res = await page.context().request.get(
      "/api/v1/app/audit-log?MaxResultCount=20",
      { maxRedirects: 0 },
    );
    expect(res.ok(), await res.text()).toBeTruthy();
    const body = (await res.json()) as {
      items: { httpMethod: string; url: string }[];
      totalCount: number;
    };
    expect(Array.isArray(body.items)).toBeTruthy();
    // Prior E2E test runs write many audit entries
    expect(body.totalCount).toBeGreaterThan(0);
  });

  test("URL filter returns only matching entries", async ({ page }) => {
    await signInAsAdmin(page);
    const target = "/api/v1/app";
    const res = await page.context().request.get(
      `/api/v1/app/audit-log?Filter=${encodeURIComponent(target)}&MaxResultCount=10`,
      { maxRedirects: 0 },
    );
    expect(res.ok(), await res.text()).toBeTruthy();
    const body = (await res.json()) as {
      items: { url: string }[];
      totalCount: number;
    };
    // All returned items must have the filter string in their URL
    for (const item of body.items) {
      expect(item.url.toLowerCase()).toContain(target.toLowerCase());
    }
  });

  test("httpMethod filter returns only matching entries", async ({ page }) => {
    await signInAsAdmin(page);
    const res = await page.context().request.get(
      "/api/v1/app/audit-log?HttpMethod=POST&MaxResultCount=10",
      { maxRedirects: 0 },
    );
    expect(res.ok(), await res.text()).toBeTruthy();
    const body = (await res.json()) as {
      items: { httpMethod: string }[];
      totalCount: number;
    };
    for (const item of body.items) {
      expect(item.httpMethod.toUpperCase()).toBe("POST");
    }
  });

  test("UI: page loads with real data, URL search filters table", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    await page.goto("/administration/audit-logs");
    await expect(
      page.getByRole("heading", { name: "Nhật ký hoạt động" }),
    ).toBeVisible();

    // Table has rows from real prior activity
    const rows = page.locator("table tbody tr.ant-table-row");
    await expect(rows.first()).toBeVisible({ timeout: 10_000 });

    // Pagination summary shows total count
    await expect(page.getByText(/Tổng:?\s*\d+\s*bản ghi/)).toBeVisible();

    // URL filter produces at least one result
    await page.getByPlaceholder("Tìm theo URL").fill("/api/v1/app");
    await page.getByPlaceholder("Tìm theo URL").press("Enter");
    await expect(rows.first()).toBeVisible({ timeout: 10_000 });

    // Filter with non-existent URL produces empty state
    await page.getByPlaceholder("Tìm theo URL").fill("KHONG-TON-TAI-URL-XYZ-99999");
    await page.getByPlaceholder("Tìm theo URL").press("Enter");
    await expect(
      page.locator(".ant-empty-description").first(),
    ).toBeVisible({ timeout: 10_000 });
  });
});
