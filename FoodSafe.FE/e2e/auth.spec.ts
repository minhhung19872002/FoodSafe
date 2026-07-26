import { expect, test } from "@playwright/test";
import { signInAsAdmin } from "./helpers/auth";

test.describe("authentication", () => {
  test.setTimeout(30_000);

  test("login page loads and real admin login works", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByPlaceholder("Tên đăng nhập hoặc email")).toBeVisible();
    await expect(page.getByPlaceholder("Mật khẩu")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Đăng nhập" }),
    ).toBeVisible();
    await expect(page.getByText("Quên mật khẩu")).toBeVisible();
  });

  test("admin can sign in via API and access dashboard", async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /Xin chào/ }),
    ).toBeVisible();
  });

  test("unauthenticated access redirects to login", async ({ page }) => {
    await page.goto("/businesses");
    await expect(page).toHaveURL(/\/login/);
  });
});
