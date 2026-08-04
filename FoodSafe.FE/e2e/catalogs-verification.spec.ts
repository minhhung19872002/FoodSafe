import { expect, test, type Browser, type Page } from "@playwright/test";
import { requestVerificationToken, signIn, signInAsAdmin } from "./helpers/auth";
import { activateTab } from "./helpers/tabs";

const TEST_PASSWORD = process.env.E2E_TEST_USER_PASSWORD ?? "Admin@2026!";

async function newSignedInPage(browser: Browser, userName: string) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await signIn(page, userName, TEST_PASSWORD);
  return { context, page };
}

async function csrfHeaders(page: Page) {
  return { RequestVerificationToken: await requestVerificationToken(page) };
}

test.describe("master catalogs verification (F-004)", () => {
  test.setTimeout(90_000);

  test("unauthenticated API access is rejected", async ({ request }) => {
    const res = await request.get(
      "/api/v1/app/master-catalog/document-types",
      { maxRedirects: 0 },
    );
    expect([401, 302]).toContain(res.status());
    expect(res.ok()).toBeFalsy();
  });

  test("user without Catalogs.View permission is denied", async ({
    browser,
  }) => {
    const { context, page } = await newSignedInPage(
      browser,
      "noperm@foodsafe.local",
    );
    try {
      const res = await page.context().request.get(
        "/api/v1/app/master-catalog/document-types",
        { maxRedirects: 0 },
      );
      expect([403, 302]).toContain(res.status());
      expect(res.ok()).toBeFalsy();
    } finally {
      await context.close();
    }
  });

  test("district staff with Catalogs.View can read catalogs", async ({
    browser,
  }) => {
    const { context, page } = await newSignedInPage(
      browser,
      "district.staff@foodsafe.local",
    );
    try {
      const res = await page.context().request.get(
        "/api/v1/app/master-catalog/business-types?MaxResultCount=100",
        { maxRedirects: 0 },
      );
      expect(res.ok(), await res.text()).toBeTruthy();
      const body = (await res.json()) as {
        items: unknown[];
        totalCount: number;
      };
      expect(typeof body.totalCount).toBe("number");
    } finally {
      await context.close();
    }
  });

  test("district staff without Catalogs.Create is denied to create", async ({
    browser,
  }) => {
    const { context, page } = await newSignedInPage(
      browser,
      "district.staff@foodsafe.local",
    );
    try {
      const headers = await csrfHeaders(page);
      const res = await page.context().request.post(
        "/api/v1/app/master-catalog/document-type",
        {
          headers,
          maxRedirects: 0,
          data: {
            code: "E2E-NOPERM-TEST",
            name: "Test no perm",
            sortOrder: 1,
            isActive: true,
          },
        },
      );
      expect([403, 302]).toContain(res.status());
      expect(res.ok()).toBeFalsy();
    } finally {
      await context.close();
    }
  });

  test("admin full CRUD lifecycle: document type catalog", async ({ page }) => {
    await signInAsAdmin(page);
    const headers = await csrfHeaders(page);
    const suffix = Date.now().toString().slice(-8);
    const code = `E2E-CAT-${suffix}`;
    const name = `Loại E2E ${suffix}`;

    // CREATE
    const createRes = await page.context().request.post(
      "/api/v1/app/master-catalog/document-type",
      {
        headers,
        data: { code, name, sortOrder: 1, isActive: true },
      },
    );
    expect(createRes.ok(), await createRes.text()).toBeTruthy();
    const created = (await createRes.json()) as { id: string; code: string };
    const id = created.id;
    expect(created.code).toBe(code);

    try {
      // LIST — find our entry
      const listRes = await page.context().request.get(
        `/api/v1/app/master-catalog/document-types?Filter=${code}&MaxResultCount=10`,
        { maxRedirects: 0 },
      );
      expect(listRes.ok()).toBeTruthy();
      const list = (await listRes.json()) as { items: { id: string }[] };
      expect(list.items.some((i) => i.id === id)).toBe(true);

      // UPDATE
      const updName = `${name} cập nhật`;
      const updateRes = await page.context().request.put(
        `/api/v1/app/master-catalog/${id}/document-type`,
        {
          headers,
          data: { code, name: updName, sortOrder: 2, isActive: true },
        },
      );
      expect(updateRes.ok(), await updateRes.text()).toBeTruthy();
      const updated = (await updateRes.json()) as { name: string };
      expect(updated.name).toBe(updName);

      // DELETE
      const delRes = await page.context().request.delete(
        `/api/v1/app/master-catalog/${id}/document-type`,
        { headers, maxRedirects: 0 },
      );
      expect(delRes.ok(), await delRes.text()).toBeTruthy();

      // After delete → not in list
      const afterDel = await page.context().request.get(
        `/api/v1/app/master-catalog/document-types?Filter=${code}&MaxResultCount=10`,
        { maxRedirects: 0 },
      );
      expect(afterDel.ok()).toBeTruthy();
      const afterList = (await afterDel.json()) as { items: { id: string }[] };
      expect(afterList.items.some((i) => i.id === id)).toBe(false);
    } catch (e) {
      await page.context().request.delete(
        `/api/v1/app/master-catalog/${id}/document-type`,
        { headers, maxRedirects: 0 },
      );
      throw e;
    }
  });

  test("multiple catalog types return data: countries and regions (seeded)", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    // Countries are seeded by MasterCatalogDataSeedContributor
    const ctRes = await page.context().request.get(
      "/api/v1/app/master-catalog/countries?MaxResultCount=100",
      { maxRedirects: 0 },
    );
    expect(ctRes.ok(), await ctRes.text()).toBeTruthy();
    const ctBody = (await ctRes.json()) as { totalCount: number };
    expect(ctBody.totalCount).toBeGreaterThan(0);

    // Regions are also seeded
    const rgRes = await page.context().request.get(
      "/api/v1/app/master-catalog/regions?MaxResultCount=100",
      { maxRedirects: 0 },
    );
    expect(rgRes.ok(), await rgRes.text()).toBeTruthy();
    const rgBody = (await rgRes.json()) as { totalCount: number };
    expect(rgBody.totalCount).toBeGreaterThan(0);
  });

  test("UI: catalog page loads and document-type CRUD visible after reload", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    await page.goto("/catalogs");
    await expect(
      page.getByRole("heading", { name: "Danh mục dùng chung" }),
    ).toBeVisible({ timeout: 10_000 });
    await activateTab(page, "Loại văn bản");

    const headers = await csrfHeaders(page);
    const suffix = Date.now().toString().slice(-8);
    const code = `E2E-UI-${suffix}`;

    // Create via API, verify shows in UI, reload persists
    const createRes = await page.context().request.post(
      "/api/v1/app/master-catalog/document-type",
      {
        headers,
        data: { code, name: `UI Test ${suffix}`, sortOrder: 99, isActive: true },
      },
    );
    expect(createRes.ok()).toBeTruthy();
    const id = ((await createRes.json()) as { id: string }).id;

    try {
      await page.reload();
      await activateTab(page, "Loại văn bản");
      await expect(page.getByRole("cell", { name: code })).toBeVisible({
        timeout: 10_000,
      });

      await page.reload();
      await activateTab(page, "Loại văn bản");
      await expect(page.getByRole("cell", { name: code })).toBeVisible({
        timeout: 10_000,
      });
    } finally {
      await page.context().request.delete(
        `/api/v1/app/master-catalog/${id}/document-type`,
        { headers, maxRedirects: 0 },
      );
    }
  });
});
