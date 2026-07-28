import { expect, test } from "@playwright/test";
import { signInAsAdmin } from "./helpers/auth";

test.describe("statistics page", () => {
  test.setTimeout(30_000);

  test("loads charts with year selector", async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto("/statistics");

    await expect(
      page.getByRole("heading", { name: "Thống kê tổng hợp" }),
    ).toBeVisible();

    await expect(page.getByText("Cơ sở theo trạng thái")).toBeVisible();
    await expect(
      page.getByText("Giấy phép / Chứng nhận theo loại"),
    ).toBeVisible();

    // The page now carries a year selector and an organisation selector, so
    // the bare combobox role is ambiguous — assert on both explicitly.
    await expect(page.getByRole("combobox")).toHaveCount(2);
    await expect(page.getByRole("combobox").first()).toBeVisible();
  });
});
