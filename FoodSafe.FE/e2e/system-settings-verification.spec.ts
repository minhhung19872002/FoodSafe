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

    // Editable configuration sections (FR-04-01..06)
    await expect(page.getByText("Chính sách mật khẩu")).toBeVisible();
    await expect(page.getByText("Độ dài tối thiểu")).toBeVisible();
    await expect(page.getByText("Độ dài tối đa")).toBeVisible();
    await expect(page.getByText("Yêu cầu chữ số")).toBeVisible();
    await expect(page.getByText("Khóa tài khoản")).toBeVisible();
    await expect(
      page.getByText("Số lần đăng nhập sai tối đa trước khi khóa"),
    ).toBeVisible();
    await expect(page.getByText("Cấu hình Email (SMTP)")).toBeVisible();
    await expect(page.getByText("Thông tin trang chủ")).toBeVisible();
    await expect(page.getByText("Giao diện")).toBeVisible();
    await expect(page.getByText("Logo ứng dụng")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Lưu cấu hình" }),
    ).toBeVisible();
  });

  test("settings page loads live configuration from the API", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    const settingsResponse = page.waitForResponse(
      (response) =>
        response.url().includes("/api/v1/app/system-settings") &&
        response.request().method() === "GET",
      { timeout: 15_000 },
    );
    await page.goto("/administration/settings");
    const response = await settingsResponse;
    expect(response.ok()).toBeTruthy();
    const body = (await response.json()) as {
      passwordRequiredLength: number;
      lockoutMaxFailedAttempts: number;
    };
    expect(body.passwordRequiredLength).toBeGreaterThanOrEqual(8);
    expect(body.lockoutMaxFailedAttempts).toBeGreaterThan(0);
    await expect(
      page.getByRole("heading", { name: "Cấu hình hệ thống" }),
    ).toBeVisible({ timeout: 10_000 });
  });
});
