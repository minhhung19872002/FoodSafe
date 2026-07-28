/**
 * Server-side page-size selector (useTablePagination): the "X / trang" select
 * on the left of the pagination bar re-queries the backend with the new
 * MaxResultCount instead of slicing rows client-side.
 *
 * Real React → real HTTP → ASP.NET Core → EF Core → PostgreSQL. NO interception.
 */

import { expect, test } from "@playwright/test";
import { signInAsAdmin } from "./helpers/auth";

test("changing the page size re-queries the backend and widens the page", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await signInAsAdmin(page);

  await page.goto("/businesses");
  const rows = page.locator(".ant-table-tbody tr.ant-table-row");
  await expect(rows.first()).toBeVisible({ timeout: 10_000 });

  // Default page size stays 20; the seeded list spans more than one page.
  await expect(page.getByText(/Hiển thị 1-20\/\d+/)).toBeVisible();
  expect(await rows.count()).toBe(20);

  const sizeChanger = page.getByRole("combobox", {
    name: "kích thước trang",
  });
  await expect(sizeChanger).toBeVisible();

  // Global CSS pulls the size changer to the left of the pagination bar.
  const sizeChangerItem = page
    .locator(".ant-table-pagination li")
    .filter({ has: sizeChanger });
  await expect(sizeChangerItem).toHaveCSS("order", "-1");

  const requeried = page.waitForResponse(
    (response) =>
      response.url().includes("/api/v1/app/business") &&
      response.url().toLowerCase().includes("maxresultcount=50") &&
      response.ok(),
  );
  await sizeChanger.click();
  await page.getByRole("option", { name: "50 / trang" }).click();
  await requeried;

  await expect(page.getByText(/Hiển thị 1-\d+\/\d+/)).toBeVisible();
  await expect(async () => {
    const count = await rows.count();
    expect(count).toBeGreaterThan(20);
    expect(count).toBeLessThanOrEqual(50);
  }).toPass({ timeout: 10_000 });
});
