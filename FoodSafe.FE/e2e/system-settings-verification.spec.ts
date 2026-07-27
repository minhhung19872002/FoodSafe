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
    await expect(
      page.getByText("Chính sách mật khẩu", { exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Độ dài tối thiểu", { exact: true })).toBeVisible();
    await expect(page.getByText("Độ dài tối đa", { exact: true })).toBeVisible();
    await expect(page.getByText("Yêu cầu chữ số", { exact: true })).toBeVisible();
    await expect(
      page.getByText("Khóa tài khoản", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Số lần đăng nhập sai tối đa trước khi khóa"),
    ).toBeVisible();
    await expect(
      page.getByText("Cấu hình Email (SMTP)", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Thông tin trang chủ", { exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Giao diện", { exact: true })).toBeVisible();
    await expect(
      page.getByText("Logo ứng dụng", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Lưu cấu hình" }),
    ).toBeVisible();
  });

  test("settings page loads live configuration from the API", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    const response = await page
      .context()
      .request.get("/api/v1/app/system-settings");
    expect(response.ok(), await response.text()).toBeTruthy();
    const body = (await response.json()) as {
      passwordRequiredLength: number;
      passwordMaxLength: number;
      lockoutMaxFailedAttempts: number;
      smtpHost?: string;
    };
    expect(body.passwordRequiredLength).toBeGreaterThan(0);
    expect(body.passwordMaxLength).toBeGreaterThanOrEqual(
      body.passwordRequiredLength,
    );
    expect(body.lockoutMaxFailedAttempts).toBeGreaterThan(0);

    // The form is populated from the same API values
    await page.goto("/administration/settings");
    await expect(
      page.getByRole("heading", { name: "Cấu hình hệ thống" }),
    ).toBeVisible({ timeout: 10_000 });
    if (body.smtpHost) {
      await expect(page.locator("input#smtpHost")).toHaveValue(
        body.smtpHost,
        { timeout: 10_000 },
      );
    }
  });
});
