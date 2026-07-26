import { expect, test } from "@playwright/test";
import { signInAsAdmin } from "./helpers/auth";

test.describe("geographic catalogs", () => {
  test.setTimeout(30_000);

  test("loads province, district and commune tabs with data", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    await page.goto("/geography");
    await expect(
      page.getByRole("heading", { name: "Địa bàn hành chính" }),
    ).toBeVisible();

    await expect(
      page.getByRole("tab", { name: "Tỉnh/Thành phố" }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Mã" }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Tên địa bàn" }),
    ).toBeVisible();

    const provinceRows = page.getByRole("table").locator("tbody tr");
    await expect(provinceRows.first()).toBeVisible();

    await page.getByRole("tab", { name: "Huyện/Quận" }).click();
    await expect(
      page.getByRole("columnheader", { name: "Loại" }),
    ).toBeVisible();

    await page.getByRole("tab", { name: "Xã/Phường" }).click();
    await expect(
      page.getByRole("columnheader", { name: "Loại" }),
    ).toBeVisible();
  });
});
