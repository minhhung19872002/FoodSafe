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

    const yearSelector = page.getByRole("combobox");
    await expect(yearSelector).toBeVisible();
  });
});
