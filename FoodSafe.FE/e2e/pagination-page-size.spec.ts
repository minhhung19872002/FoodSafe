/**
 * Server-side page-size selector (useTablePagination): the "X / trang" select
 * on the left of the pagination bar re-queries the backend with the new
 * MaxResultCount instead of slicing rows client-side.
 *
 * Real React → real HTTP → ASP.NET Core → EF Core → PostgreSQL. NO interception.
 *
 * The test seeds its own cohort so the list provably spans more than one page
 * of 20 regardless of how much reference data the environment happens to hold.
 */

import { expect, test, type Page } from "@playwright/test";
import { requestVerificationToken, signInAsAdmin } from "./helpers/auth";

const PROVINCE_ORG_ID = "e2e00000-0000-4000-8010-000000000001";
const PAGE_SIZE = 20;
/** Enough rows that the second page exists even on an otherwise empty database. */
const COHORT_SIZE = 6;

interface SeededBusiness {
  id: string;
}

async function businessCount(page: Page): Promise<number> {
  const response = await page
    .context()
    .request.get("/api/v1/app/business?MaxResultCount=1");
  expect(response.ok(), await response.text()).toBeTruthy();
  return ((await response.json()) as { totalCount: number }).totalCount;
}

test("changing the page size re-queries the backend and widens the page", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await signInAsAdmin(page);

  const headers = {
    RequestVerificationToken: await requestVerificationToken(page),
  };
  const suffix = Date.now().toString().slice(-9);
  const cohort: SeededBusiness[] = [];

  // Top the list up past a full page so both assertions below are deterministic.
  const existing = await businessCount(page);
  const needed = Math.max(COHORT_SIZE, PAGE_SIZE + 1 - existing);
  for (let index = 0; index < needed; index++) {
    const response = await page.context().request.post("/api/v1/app/business", {
      headers,
      data: {
        organizationId: PROVINCE_ORG_ID,
        code: `E2E-PSIZE-${suffix}-${index}`,
        name: `Cơ sở phân trang ${suffix} ${index}`,
        productGroupIds: [],
      },
    });
    expect(response.ok(), await response.text()).toBeTruthy();
    cohort.push((await response.json()) as SeededBusiness);
  }

  try {
    await page.goto("/businesses");
    const rows = page.locator(".ant-table-tbody tr.ant-table-row");
    await expect(rows.first()).toBeVisible({ timeout: 10_000 });

    // Default page size stays 20; the list now provably spans more than one page.
    await expect(page.getByText(/Hiển thị 1-20\/\d+/)).toBeVisible();
    expect(await rows.count()).toBe(PAGE_SIZE);

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
      expect(count).toBeGreaterThan(PAGE_SIZE);
      expect(count).toBeLessThanOrEqual(50);
    }).toPass({ timeout: 10_000 });
  } finally {
    for (const seeded of cohort) {
      await page
        .context()
        .request.delete(`/api/v1/app/business/${seeded.id}`, {
          headers,
          maxRedirects: 0,
        })
        .catch(() => undefined);
    }
  }
});
