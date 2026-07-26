import { expect, test } from "@playwright/test";
import { signInAsAdmin } from "./helpers/auth";

test.describe("system settings page", () => {
  test.setTimeout(30_000);

  test("displays system configuration sections", async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto("/administration/settings");

    await expect(
      page.getByRole("heading", { name: "Cấu hình hệ thống" }),
    ).toBeVisible();

    await expect(page.getByText("Mật khẩu tối thiểu")).toBeVisible();
    await expect(page.getByText("Chữ hoa")).toBeVisible();
    await expect(page.getByText("Chữ thường")).toBeVisible();
    await expect(page.getByText("Chữ số")).toBeVisible();
    await expect(page.getByText("Ký tự đặc biệt")).toBeVisible();
  });
});
