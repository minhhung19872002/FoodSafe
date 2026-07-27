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

  test("all three geographic levels return seeded data", async ({ page }) => {
    await signInAsAdmin(page);

    // Known seeded IDs from E2eTestDataSeedContributor
    const PROVINCE_QN_ID = "e2e00000-0000-4000-8001-000000000001";
    const DISTRICT_HL_ID = "e2e00000-0000-4000-8002-000000000001";

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

    // Districts — provinceId is a route segment: GET /districts/{provinceId}
    const distRes = await page.context().request.get(
      `/api/v1/app/geographic-catalog/districts/${PROVINCE_QN_ID}`,
      { maxRedirects: 0 },
    );
    expect(distRes.ok(), `districts status=${distRes.status()}: ${await distRes.text()}`).toBeTruthy();
    const distBody = (await distRes.json()) as {
      items: { id: string; name: string }[];
    };
    expect(distBody.items.length).toBeGreaterThan(0);
    const hasHL = distBody.items.some((d) => d.id === DISTRICT_HL_ID);
    expect(hasHL, "Hạ Long district should be seeded").toBeTruthy();

    // Communes — districtId is a route segment: GET /communes/{districtId}
    const comRes = await page.context().request.get(
      `/api/v1/app/geographic-catalog/communes/${DISTRICT_HL_ID}`,
      { maxRedirects: 0 },
    );
    expect(comRes.ok(), `communes status=${comRes.status()}: ${await comRes.text()}`).toBeTruthy();
    const comBody = (await comRes.json()) as { items: { id: string }[] };
    expect(comBody.items.length).toBeGreaterThan(0);
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

  test("UI: all three geographic tabs load with correct column headers", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    await page.goto("/geography");
    await expect(
      page.getByRole("heading", { name: "Địa bàn hành chính" }),
    ).toBeVisible({ timeout: 10_000 });

    // Provinces tab (default) — must have data rows
    const table = page.getByRole("table");
    await expect(table.locator("tbody tr").first()).toBeVisible({
      timeout: 10_000,
    });
    await expect(
      table.getByRole("columnheader", { name: "Mã" }),
    ).toBeVisible();
    await expect(
      table.getByRole("columnheader", { name: "Tên địa bàn" }),
    ).toBeVisible();

    // Districts tab — shows empty list until province selected
    await page.getByRole("tab", { name: "Huyện/Quận" }).click();
    await expect(
      table.getByRole("columnheader", { name: "Loại" }),
    ).toBeVisible({ timeout: 5_000 });

    // Communes tab — shows empty list until district selected
    await page.getByRole("tab", { name: "Xã/Phường" }).click();
    await expect(
      table.getByRole("columnheader", { name: "Loại" }),
    ).toBeVisible({ timeout: 5_000 });

    // Reload — returns to provinces tab with data
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "Địa bàn hành chính" }),
    ).toBeVisible({ timeout: 10_000 });
    await expect(table.locator("tbody tr").first()).toBeVisible({
      timeout: 10_000,
    });
  });
});
