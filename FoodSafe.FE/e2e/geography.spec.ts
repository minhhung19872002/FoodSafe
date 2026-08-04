import { expect, test } from "@playwright/test";
import { signInAsAdmin } from "./helpers/auth";

test.describe("geographic catalogs", () => {
  test.setTimeout(30_000);

  /**
   * Two administrative levels only. The district tier was abolished by Luật
   * 72/2025/QH15 (effective 01/07/2025), so the page must expose exactly
   * Tỉnh/Thành phố and Xã/Phường — a district tab reappearing is a regression.
   */
  test("loads province and commune tabs with real seeded data", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    await page.goto("/geography");
    await expect(
      page.getByRole("heading", { name: "Địa bàn hành chính" }),
    ).toBeVisible();

    await expect(page.getByRole("tab")).toHaveCount(2);
    await expect(
      page.getByRole("tab", { name: "Tỉnh/Thành phố" }),
    ).toBeVisible();
    await expect(page.getByRole("tab", { name: "Xã/Phường" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Huyện/Quận" })).toHaveCount(0);

    await expect(
      page.getByRole("columnheader", { name: "Mã", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Tên địa bàn" }),
    ).toBeVisible();

    // Scope to the ACTIVE tab panel: antd keeps a visited tab's panel mounted
    // but hidden, so an unscoped row selector matches the previous tab's rows.
    // .ant-table-row also skips antd's hidden measure row.
    const rows = page
      .getByRole("tabpanel")
      .locator("tbody tr.ant-table-row");
    await expect(rows.first()).toBeVisible();

    await page.getByRole("tab", { name: "Xã/Phường" }).click();
    await expect(
      page.getByRole("columnheader", { name: "Loại" }),
    ).toBeVisible();
    await expect(rows.first()).toBeVisible();
    // The 54 Quảng Ninh units seeded per NQ 1679/NQ-UBTVQH15 include the two
    // special zones introduced by the same reform.
    await expect(page.getByText("Đặc khu Vân Đồn").first()).toBeVisible({
      timeout: 10_000,
    });
  });
});
