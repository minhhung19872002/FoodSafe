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

    // The period filters (year / quarter / month), the organisation filter and
    // the custom date range are the page's real controls — assert on each
    // rather than on a fragile combobox count.
    const header = page.locator(".page-container > div").first();
    await expect(header.getByRole("combobox").first()).toBeVisible();
    await expect(header.getByText(/^Năm \d{4}$/)).toBeVisible();
    // antd renders Select placeholders as text, not input placeholders.
    await expect(header.getByText("Chọn quý")).toBeVisible();
    await expect(header.getByText("Chọn tháng")).toBeVisible();
    await expect(header.getByPlaceholder("Từ ngày")).toBeVisible();
    await expect(header.getByPlaceholder("Đến ngày")).toBeVisible();

    // Changing the year must re-query the backend, not just repaint labels.
    const statsRequest = page.waitForResponse(
      (response) =>
        response.url().includes("/v1/app/statistics") && response.status() === 200,
    );
    await header.getByRole("combobox").first().click();
    await page
      .locator(".ant-select-dropdown:not(.ant-select-dropdown-hidden)")
      .getByText(`Năm ${new Date().getFullYear() - 1}`)
      .click();
    await statsRequest;
  });
});
