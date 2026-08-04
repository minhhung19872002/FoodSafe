import { expect, test, type Browser } from "@playwright/test";
import { signIn, signInAsAdmin } from "./helpers/auth";

const TEST_PASSWORD = process.env.E2E_TEST_USER_PASSWORD ?? "Admin@2026!";

async function newSignedInPage(browser: Browser, userName: string) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await signIn(page, userName, TEST_PASSWORD);
  return { context, page };
}

test.describe("geographic catalogs verification (F-005)", () => {
  test.setTimeout(60_000);

  test("unauthenticated API access is rejected", async ({ request }) => {
    const res = await request.get("/api/v1/app/geographic-catalog/provinces", {
      maxRedirects: 0,
    });
    expect([401, 302]).toContain(res.status());
    expect(res.ok()).toBeFalsy();
  });

  test("user without GeographicCatalogs.View permission is denied", async ({
    browser,
  }) => {
    const { context, page } = await newSignedInPage(
      browser,
      "noperm@foodsafe.local",
    );
    try {
      const res = await page.context().request.get(
        "/api/v1/app/geographic-catalog/provinces",
        { maxRedirects: 0 },
      );
      expect([403, 302]).toContain(res.status());
      expect(res.ok()).toBeFalsy();
    } finally {
      await context.close();
    }
  });

  test("district staff with GeographicCatalogs.View can list provinces", async ({
    browser,
  }) => {
    const { context, page } = await newSignedInPage(
      browser,
      "district.staff@foodsafe.local",
    );
    try {
      const res = await page.context().request.get(
        "/api/v1/app/geographic-catalog/provinces",
        { maxRedirects: 0 },
      );
      expect(res.ok(), await res.text()).toBeTruthy();
      // ListResultDto has items array (no totalCount pagination field)
      const body = (await res.json()) as { items: { id: string; name: string }[] };
      expect(Array.isArray(body.items)).toBe(true);
    } finally {
      await context.close();
    }
  });

  /**
   * Two levels only since Luật 72/2025/QH15 removed the district tier: the
   * districts endpoint is gone and communes hang directly off a province.
   */
  test("both geographic levels return seeded data", async ({ page }) => {
    await signInAsAdmin(page);

    // Known seeded ID from E2eTestDataSeedContributor
    const PROVINCE_QN_ID = "e2e00000-0000-4000-8001-000000000001";

    // Provinces — ListResultDto (no totalCount pagination), seeded with Quảng Ninh
    const provRes = await page.context().request.get(
      "/api/v1/app/geographic-catalog/provinces",
      { maxRedirects: 0 },
    );
    expect(provRes.ok(), `provinces: ${await provRes.text()}`).toBeTruthy();
    const provBody = (await provRes.json()) as {
      items: { id: string; code: string; name: string }[];
    };
    expect(provBody.items.length).toBeGreaterThan(0);
    const hasQN = provBody.items.some((p) => p.id === PROVINCE_QN_ID);
    expect(hasQN, "Quảng Ninh province should be seeded").toBeTruthy();

    // Communes now hang off the province directly.
    const comRes = await page.context().request.get(
      `/api/v1/app/geographic-catalog/communes-by-province/${PROVINCE_QN_ID}`,
      { maxRedirects: 0 },
    );
    expect(
      comRes.ok(),
      `communes status=${comRes.status()}: ${await comRes.text()}`,
    ).toBeTruthy();
    const comBody = (await comRes.json()) as {
      items: { id: string; name: string; code: string }[];
    };
    expect(comBody.items.length).toBeGreaterThan(0);

    // The abolished district endpoint must stay gone.
    const distRes = await page.context().request.get(
      `/api/v1/app/geographic-catalog/districts/${PROVINCE_QN_ID}`,
      { maxRedirects: 0 },
    );
    expect(distRes.status()).toBe(404);
  });

  test("activeOnly flag filters inactive entries", async ({ page }) => {
    await signInAsAdmin(page);
    // Both true (default) and false should return valid list responses
    const activeRes = await page.context().request.get(
      "/api/v1/app/geographic-catalog/provinces?activeOnly=true",
      { maxRedirects: 0 },
    );
    expect(activeRes.ok()).toBeTruthy();
    const activeBody = (await activeRes.json()) as { items: unknown[] };
    expect(Array.isArray(activeBody.items)).toBe(true);

    const allRes = await page.context().request.get(
      "/api/v1/app/geographic-catalog/provinces?activeOnly=false",
      { maxRedirects: 0 },
    );
    expect(allRes.ok()).toBeTruthy();
    const allBody = (await allRes.json()) as { items: unknown[] };
    // allRes should have >= activeRes (inactive includes active + inactive)
    expect(allBody.items.length).toBeGreaterThanOrEqual(activeBody.items.length);
  });

  test("UI: both geographic tabs load with correct column headers", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    await page.goto("/geography");
    await expect(
      page.getByRole("heading", { name: "Địa bàn hành chính" }),
    ).toBeVisible({ timeout: 10_000 });

    // Exactly two tiers — a reappearing district tab is a regression.
    await expect(page.getByRole("tab")).toHaveCount(2);

    // Scope to the ACTIVE tab panel: antd keeps a visited tab's panel mounted
    // but hidden, so an unscoped row selector matches the previous tab's rows.
    const rows = page
      .getByRole("tabpanel")
      .locator("tbody tr.ant-table-row");
    await expect(rows.first()).toBeVisible({ timeout: 10_000 });
    await expect(
      page.getByRole("columnheader", { name: "Mã", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Tên địa bàn" }),
    ).toBeVisible();

    // Communes tab — seeded with the 54 Quảng Ninh units (NQ 1679).
    await page.getByRole("tab", { name: "Xã/Phường" }).click();
    await expect(
      page.getByRole("columnheader", { name: "Loại" }),
    ).toBeVisible({ timeout: 5_000 });
    await expect(rows.first()).toBeVisible({ timeout: 10_000 });

    // Reload — returns to the provinces tab with data.
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "Địa bàn hành chính" }),
    ).toBeVisible({ timeout: 10_000 });
    await expect(rows.first()).toBeVisible({ timeout: 10_000 });
  });
});
