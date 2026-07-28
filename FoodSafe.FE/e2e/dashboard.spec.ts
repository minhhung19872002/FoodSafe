import { expect, test } from "@playwright/test";
import { signInAsAdmin } from "./helpers/auth";

test.describe("dashboard", () => {
  test.setTimeout(30_000);

  test("loads stat cards and license breakdown table", async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto("/");

    await expect(page.getByRole("heading", { name: /Xin chào/ })).toBeVisible();

    await expect(page.getByText("Cơ sở SXKD").first()).toBeVisible();
    await expect(page.getByText("Phân bố hồ sơ theo loại")).toBeVisible();
    await expect(page.getByText("Chi tiết theo loại hồ sơ")).toBeVisible();
  });
});
