import { expect, test, type Browser, type Page } from "@playwright/test";
import {
  requestVerificationToken,
  signIn,
  signInAsAdmin,
} from "./helpers/auth";

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

interface RoleFixture {
  id: string;
  name: string;
  concurrencyStamp: string;
}

async function createRole(
  page: Page,
  headers: Record<string, string>,
  name: string,
): Promise<RoleFixture> {
  const res = await page.context().request.post(
    "/api/v1/administration/roles",
    {
      headers,
      data: { name, description: "Vai trò kiểm chứng E2E" },
    },
  );
  expect(res.ok(), `createRole failed: ${await res.text()}`).toBeTruthy();
  const body = (await res.json()) as {
    id: string;
    name: string;
    concurrencyStamp: string;
  };
  return { id: body.id, name: body.name, concurrencyStamp: body.concurrencyStamp };
}

async function deleteRole(
  page: Page,
  headers: Record<string, string>,
  id: string,
) {
  await page.context().request.delete(
    `/api/v1/administration/roles/${id}`,
    { headers, maxRedirects: 0 },
  );
}

test.describe("identity administration verification (F-020)", () => {
  test.setTimeout(90_000);

  test("unauthenticated API access is rejected", async ({ request }) => {
    const usersRes = await request.get("/api/v1/administration/users", {
      maxRedirects: 0,
    });
    expect([401, 302]).toContain(usersRes.status());
    expect(usersRes.ok()).toBeFalsy();

    const rolesRes = await request.get("/api/v1/administration/roles", {
      maxRedirects: 0,
    });
    expect([401, 302]).toContain(rolesRes.status());
    expect(rolesRes.ok()).toBeFalsy();
  });

  test("user without identity-admin permission is denied", async ({
    browser,
  }) => {
    const { context, page } = await newSignedInPage(
      browser,
      "noperm@foodsafe.local",
    );
    try {
      const usersRes = await page.context().request.get(
        "/api/v1/administration/users",
        { maxRedirects: 0 },
      );
      expect([403, 302]).toContain(usersRes.status());
      expect(usersRes.ok()).toBeFalsy();

      const rolesRes = await page.context().request.get(
        "/api/v1/administration/roles",
        { maxRedirects: 0 },
      );
      expect([403, 302]).toContain(rolesRes.status());
      expect(rolesRes.ok()).toBeFalsy();
    } finally {
      await context.close();
    }
  });

  test("district staff without identity-admin permission is denied", async ({
    browser,
  }) => {
    // SystemAdmin is a province-level function — district staff have no
    // FoodSafe.SystemAdmin.* permissions.
    const { context, page } = await newSignedInPage(
      browser,
      "district.staff@foodsafe.local",
    );
    try {
      const res = await page.context().request.get(
        "/api/v1/administration/users",
        { maxRedirects: 0 },
      );
      expect([403, 302]).toContain(res.status());
      expect(res.ok()).toBeFalsy();
    } finally {
      await context.close();
    }
  });

  test("role CRUD lifecycle: create, read, update (concurrency stamp), delete", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    const headers = await csrfHeaders(page);
    const suffix = Date.now().toString().slice(-8);
    const name = `E2E-ROLE-V-${suffix}`;
    const fixture = await createRole(page, headers, name);

    try {
      // GET by id — verify persisted fields
      const get = await page.context().request.get(
        `/api/v1/administration/roles/${fixture.id}`,
        { maxRedirects: 0 },
      );
      expect(get.ok(), await get.text()).toBeTruthy();
      const dto = (await get.json()) as {
        name: string;
        description: string;
        concurrencyStamp: string;
      };
      expect(dto.name).toBe(name);
      expect(dto.description).toBe("Vai trò kiểm chứng E2E");
      expect(dto.concurrencyStamp).toBeTruthy();

      // UPDATE — requires concurrencyStamp from GET
      const updated = await page.context().request.put(
        `/api/v1/administration/roles/${fixture.id}`,
        {
          headers,
          maxRedirects: 0,
          data: {
            name,
            description: "Mô tả đã cập nhật E2E",
            isActive: true,
            concurrencyStamp: dto.concurrencyStamp,
          },
        },
      );
      expect(updated.ok(), await updated.text()).toBeTruthy();
      const updatedDto = (await updated.json()) as { description: string };
      expect(updatedDto.description).toBe("Mô tả đã cập nhật E2E");

      // GET after update — description persisted
      const getAfterUpdate = await page.context().request.get(
        `/api/v1/administration/roles/${fixture.id}`,
      );
      const afterUpdate = (await getAfterUpdate.json()) as {
        description: string;
      };
      expect(afterUpdate.description).toBe("Mô tả đã cập nhật E2E");

      // DELETE
      const del = await page.context().request.delete(
        `/api/v1/administration/roles/${fixture.id}`,
        { headers, maxRedirects: 0 },
      );
      expect(del.ok(), await del.text()).toBeTruthy();

      // GET after delete — not found
      const afterDelete = await page.context().request.get(
        `/api/v1/administration/roles/${fixture.id}`,
        { maxRedirects: 0 },
      );
      expect(afterDelete.ok()).toBeFalsy();
    } catch (err) {
      await deleteRole(page, headers, fixture.id);
      throw err;
    }
  });

  test("server-side validation: missing role name is rejected", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    const headers = await csrfHeaders(page);

    const missingName = await page.context().request.post(
      "/api/v1/administration/roles",
      {
        headers,
        maxRedirects: 0,
        data: { description: "Không có tên" },
      },
    );
    expect(missingName.ok()).toBeFalsy();
  });

  test("user list is accessible to admin and contains seeded accounts", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    const res = await page.context().request.get(
      "/api/v1/administration/users?MaxResultCount=50",
      { maxRedirects: 0 },
    );
    expect(res.ok(), await res.text()).toBeTruthy();
    const body = (await res.json()) as {
      items: { userName: string }[];
      totalCount: number;
    };
    expect(Array.isArray(body.items)).toBeTruthy();
    expect(body.totalCount).toBeGreaterThan(0);
    // Seeded test accounts must be present
    const userNames = body.items.map((u) => u.userName.toLowerCase());
    expect(userNames.some((u) => u.includes("admin"))).toBeTruthy();
  });

  test("persistence after reload and empty state (UI — roles tab)", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    const headers = await csrfHeaders(page);
    const suffix = Date.now().toString().slice(-8);
    const name = `E2E-ROLE-UI-${suffix}`;
    const fixture = await createRole(page, headers, name);

    try {
      await page.goto("/administration/identity");
      await page.getByRole("tab", { name: "Vai trò và quyền" }).click();

      const search = page.getByPlaceholder("Tên hoặc mô tả vai trò");
      await search.fill(name);
      await page.keyboard.press("Enter");
      await expect(page.getByText(name)).toBeVisible({ timeout: 10_000 });

      // Reload — data persists
      await page.reload();
      await page.getByRole("tab", { name: "Vai trò và quyền" }).click();
      await page.getByPlaceholder("Tên hoặc mô tả vai trò").fill(name);
      await page.keyboard.press("Enter");
      await expect(page.getByText(name)).toBeVisible({ timeout: 10_000 });

      // Empty state
      await page.getByPlaceholder("Tên hoặc mô tả vai trò").fill("KHONG-TON-TAI-XYZ-99999");
      await page.keyboard.press("Enter");
      await expect(
        page.locator(".ant-empty-description").first(),
      ).toBeVisible({ timeout: 10_000 });
    } finally {
      await deleteRole(page, headers, fixture.id);
    }
  });
});
