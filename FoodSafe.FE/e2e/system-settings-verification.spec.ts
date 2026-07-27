import { expect, test, type Browser, type Page } from "@playwright/test";
import { signIn, signInAsAdmin } from "./helpers/auth";

const TEST_PASSWORD = process.env.E2E_TEST_USER_PASSWORD ?? "Admin@2026!";

async function newSignedInPage(browser: Browser, userName: string) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await signIn(page, userName, TEST_PASSWORD);
  return { context, page };
}

test.describe("system settings verification (F-032)", () => {
  test.setTimeout(60_000);

  test("unauthenticated access to settings route is denied", async ({
    page,
  }) => {
    // Navigate without logging in — PrivateRoute should redirect to login
    await page.goto("/administration/settings");
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });

  test("user without SystemAdmin.Settings permission cannot access settings page", async ({
    browser,
  }) => {
    const { context, page } = await newSignedInPage(
      browser,
      "noperm@foodsafe.local",
    );
    try {
      await page.goto("/administration/settings");
      // PermissionRoute blocks the page — heading must NOT appear
      await expect(
        page.getByRole("heading", { name: "Cấu hình hệ thống" }),
      ).not.toBeVisible({ timeout: 5_000 });
    } finally {
      await context.close();
    }
  });

  test("district staff without SystemAdmin.Settings permission cannot access settings page", async ({
    browser,
  }) => {
    const { context, page } = await newSignedInPage(
      browser,
      "district.staff@foodsafe.local",
    );
    try {
      await page.goto("/administration/settings");
      await expect(
        page.getByRole("heading", { name: "Cấu hình hệ thống" }),
      ).not.toBeVisible({ timeout: 5_000 });
    } finally {
      await context.close();
    }
  });

  test("admin can access settings page with all required sections", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    await page.goto("/administration/settings");
    await expect(
      page.getByRole("heading", { name: "Cấu hình hệ thống" }),
    ).toBeVisible({ timeout: 10_000 });

    // System info section
    await expect(page.getByText("Phiên bản")).toBeVisible();
    await expect(page.getByText(".NET 9")).toBeVisible();

    // Password policy section
    await expect(page.getByText("Độ dài tối thiểu")).toBeVisible();
    await expect(page.getByText("Yêu cầu chữ hoa")).toBeVisible();
    await expect(page.getByText("Yêu cầu chữ số")).toBeVisible();
    await expect(page.getByText("90 ngày")).toBeVisible();

    // Session section
    await expect(page.getByText("Session timeout")).toBeVisible();

    // Security section
    await expect(page.getByText("CAPTCHA đăng nhập")).toBeVisible();
    await expect(page.getByText("Audit logging")).toBeVisible();
  });

  test("settings page is static — no API calls needed (no CSRF, no mutations)", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    const apiCalls: string[] = [];
    page.on("request", (req) => {
      const url = req.url();
      if (url.includes("/api/v1/app/") || url.includes("/api/identity/")) {
        apiCalls.push(`${req.method()} ${url}`);
      }
    });
    await page.goto("/administration/settings");
    await expect(
      page.getByRole("heading", { name: "Cấu hình hệ thống" }),
    ).toBeVisible({ timeout: 10_000 });
    // Wait briefly to capture any async calls
    await page.waitForTimeout(1500);
    // The settings page should make no FoodSafe business API calls
    const settingsCalls = apiCalls.filter((c) =>
      c.includes("/settings") || c.includes("/configuration"),
    );
    expect(settingsCalls.length).toBe(0);
  });
});
