import { expect, test } from "@playwright/test";
import { signInAsAdmin } from "./helpers/auth";

test.describe("audit log viewer", () => {
  test.setTimeout(30_000);

  test("loads audit log table with real data and filters", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    await page.goto("/administration/audit-logs");
    await expect(
      page.getByRole("heading", { name: "Nhật ký hoạt động" }),
    ).toBeVisible();

    await expect(
      page.getByRole("columnheader", { name: "Thời gian", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Người dùng" }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Phương thức" }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "URL" }),
    ).toBeVisible();

    const rows = page.locator("table tbody tr.ant-table-row");
    await expect(rows.first()).toBeVisible({ timeout: 10_000 });

    const paginationInfo = page.getByText(/Hiển thị\s*\d+-\d+\/\d+/);
    await expect(paginationInfo).toBeVisible();

    await page.getByPlaceholder("Tìm theo URL").fill("/api/v1/app");
    await page.getByPlaceholder("Tìm theo URL").press("Enter");
    await expect(rows.first()).toBeVisible({ timeout: 10_000 });
  });
});
