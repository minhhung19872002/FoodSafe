import { expect, test, type Browser, type Page } from "@playwright/test";
import { requestVerificationToken, signIn, signInAsAdmin } from "./helpers/auth";

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

test.describe("organizations verification (F-003)", () => {
  test.setTimeout(90_000);

  test("unauthenticated API access is rejected", async ({ request }) => {
    const res = await request.get("/api/v1/app/organization", {
      maxRedirects: 0,
    });
    expect([401, 302]).toContain(res.status());
    expect(res.ok()).toBeFalsy();
  });

  test("user without Organizations.View permission is denied", async ({
    browser,
  }) => {
    const { context, page } = await newSignedInPage(
      browser,
      "noperm@foodsafe.local",
    );
    try {
      const res = await page.context().request.get("/api/v1/app/organization", {
        maxRedirects: 0,
      });
      expect([403, 302]).toContain(res.status());
      expect(res.ok()).toBeFalsy();
    } finally {
      await context.close();
    }
  });

  test("district staff with Organizations.View gets scoped list", async ({
    browser,
  }) => {
    const { context, page } = await newSignedInPage(
      browser,
      "district.staff@foodsafe.local",
    );
    try {
      const res = await page.context().request.get(
        "/api/v1/app/organization?MaxResultCount=100",
        { maxRedirects: 0 },
      );
      expect(res.ok(), await res.text()).toBeTruthy();
      const body = (await res.json()) as { items: unknown[]; totalCount: number };
      // Scoped result — contains only organizations in their scope
      expect(typeof body.totalCount).toBe("number");
    } finally {
      await context.close();
    }
  });

  test("admin can create, read, update, delete organization", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    const headers = await csrfHeaders(page);
    const suffix = Date.now().toString().slice(-8);
    const code = `E2E-ORG-${suffix}`;
    const name = `Tổ chức E2E ${suffix}`;

    // CREATE
    const createRes = await page.context().request.post(
      "/api/v1/app/organization",
      {
        headers,
        data: {
          code,
          name,
          level: 1,
          parentId: null,
          provinceId: "e2e00000-0000-4000-8001-000000000001",
          districtId: null,
          communeId: null,
          address: null,
          phone: null,
          email: null,
          leaderName: null,
          isActive: true,
        },
      },
    );
    expect(createRes.ok(), await createRes.text()).toBeTruthy();
    const created = (await createRes.json()) as { id: string; code: string };
    const orgId = created.id;
    expect(created.code).toBe(code);

    try {
      // GET by id
      const getRes = await page.context().request.get(
        `/api/v1/app/organization/${orgId}`,
        { maxRedirects: 0 },
      );
      expect(getRes.ok(), await getRes.text()).toBeTruthy();
      const dto = (await getRes.json()) as { name: string };
      expect(dto.name).toBe(name);

      // UPDATE
      const updatedName = `${name} cập nhật`;
      const updateRes = await page.context().request.put(
        `/api/v1/app/organization/${orgId}`,
        {
          headers,
          data: {
            code,
            name: updatedName,
            level: 1,
            parentId: null,
            provinceId: "e2e00000-0000-4000-8001-000000000001",
            districtId: null,
            communeId: null,
            address: null,
            phone: null,
            email: null,
            leaderName: null,
            isActive: true,
          },
        },
      );
      expect(updateRes.ok(), await updateRes.text()).toBeTruthy();
      const updated = (await updateRes.json()) as { name: string };
      expect(updated.name).toBe(updatedName);

      // DELETE
      const delRes = await page.context().request.delete(
        `/api/v1/app/organization/${orgId}`,
        { headers, maxRedirects: 0 },
      );
      expect(delRes.ok(), await delRes.text()).toBeTruthy();

      // GET after delete → not found
      const afterDel = await page.context().request.get(
        `/api/v1/app/organization/${orgId}`,
        { maxRedirects: 0 },
      );
      expect(afterDel.ok()).toBeFalsy();
    } catch (e) {
      // Ensure cleanup even on failure
      await page.context().request.delete(
        `/api/v1/app/organization/${orgId}`,
        { headers, maxRedirects: 0 },
      );
      throw e;
    }
  });

  test("duplicate org code is rejected with 400", async ({ page }) => {
    await signInAsAdmin(page);
    const headers = await csrfHeaders(page);
    const suffix = Date.now().toString().slice(-8);
    const code = `E2E-DUP-${suffix}`;

    const first = await page.context().request.post("/api/v1/app/organization", {
      headers,
      data: {
        code,
        name: `Org Gốc ${suffix}`,
        level: 1,
        parentId: null,
        provinceId: "e2e00000-0000-4000-8001-000000000001",
        districtId: null,
        communeId: null,
        address: null,
        phone: null,
        email: null,
        leaderName: null,
        isActive: true,
      },
    });
    expect(first.ok(), await first.text()).toBeTruthy();
    const firstId = ((await first.json()) as { id: string }).id;

    try {
      // Attempt duplicate
      const dup = await page.context().request.post("/api/v1/app/organization", {
        headers,
        maxRedirects: 0,
        data: {
          code,
          name: "Tên khác",
          level: 1,
          parentId: null,
          provinceId: "e2e00000-0000-4000-8001-000000000001",
          districtId: null,
          communeId: null,
          address: null,
          phone: null,
          email: null,
          leaderName: null,
          isActive: true,
        },
      });
      expect(dup.ok()).toBeFalsy();
    } finally {
      await page.context().request.delete(
        `/api/v1/app/organization/${firstId}`,
        { headers, maxRedirects: 0 },
      );
    }
  });

  test("org scope isolation: district.staff cannot see admin E2E org", async ({
    page,
    browser,
  }) => {
    await signInAsAdmin(page);
    const adminHeaders = await csrfHeaders(page);
    const suffix = Date.now().toString().slice(-8);
    const code = `E2E-SCOPE-${suffix}`;

    const createRes = await page.context().request.post(
      "/api/v1/app/organization",
      {
        headers: adminHeaders,
        data: {
          code,
          name: `Org Kiểm tra scope ${suffix}`,
          level: 1,
          parentId: null,
          provinceId: "e2e00000-0000-4000-8001-000000000001",
          districtId: null,
          communeId: null,
          address: null,
          phone: null,
          email: null,
          leaderName: null,
          isActive: true,
        },
      },
    );
    expect(createRes.ok()).toBeTruthy();
    const newOrgId = ((await createRes.json()) as { id: string }).id;

    try {
      // district.staff queries by code — should not find admin's new org
      const { context: staffCtx, page: staffPage } = await newSignedInPage(
        browser,
        "district.staff@foodsafe.local",
      );
      try {
        const staffRes = await staffPage.context().request.get(
          `/api/v1/app/organization?Filter=${code}&MaxResultCount=100`,
          { maxRedirects: 0 },
        );
        expect(staffRes.ok()).toBeTruthy();
        const body = (await staffRes.json()) as {
          items: { id: string }[];
        };
        const found = body.items.some((o) => o.id === newOrgId);
        expect(found).toBe(false);
      } finally {
        await staffCtx.close();
      }
    } finally {
      await page.context().request.delete(
        `/api/v1/app/organization/${newOrgId}`,
        { headers: adminHeaders, maxRedirects: 0 },
      );
    }
  });

  test("UI: seeded organizations visible and persist after reload", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    await page.goto("/organizations");
    await expect(
      page.getByRole("heading", { name: "Quản lý đơn vị" }),
    ).toBeVisible({ timeout: 10_000 });
    const table = page.getByRole("table");
    await expect(
      table.getByRole("cell", { name: "CCATVSTP-QN" }),
    ).toBeVisible({ timeout: 10_000 });
    // Reload persists
    await page.reload();
    await expect(
      table.getByRole("cell", { name: "CCATVSTP-QN" }),
    ).toBeVisible({ timeout: 10_000 });
  });
});
