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

interface EndpointFixture {
  id: string;
  name: string;
}

async function createEndpoint(
  page: Page,
  headers: Record<string, string>,
  name: string,
): Promise<EndpointFixture> {
  const response = await page.context().request.post(
    "/api/v1/app/api-endpoint",
    {
      headers,
      data: {
        name,
        url: "https://api.example.gov.vn/e2e-test",
        httpMethod: "GET",
        externalSystem: "Bộ Y tế",
        authType: 1,
        description: "E2E verification fixture",
      },
    },
  );
  expect(response.ok(), `createEndpoint failed: ${await response.text()}`).toBeTruthy();
  const body = (await response.json()) as { id: string };
  return { id: body.id, name };
}

async function deleteEndpoint(
  page: Page,
  headers: Record<string, string>,
  id: string,
) {
  await page.context().request.delete(`/api/v1/app/api-endpoint/${id}`, {
    headers,
    maxRedirects: 0,
  });
}

test.describe("data integration verification (F-019)", () => {
  test.setTimeout(90_000);

  test("unauthenticated API access is rejected", async ({ request }) => {
    const res = await request.get("/api/v1/app/api-endpoint", { maxRedirects: 0 });
    expect([401, 302]).toContain(res.status());
    expect(res.ok()).toBeFalsy();
  });

  test("user without data-integration permission is denied", async ({ browser }) => {
    const { context, page } = await newSignedInPage(browser, "noperm@foodsafe.local");
    try {
      const res = await page.context().request.get("/api/v1/app/api-endpoint", {
        maxRedirects: 0,
      });
      expect([403, 302]).toContain(res.status());
      expect(res.ok()).toBeFalsy();
    } finally {
      await context.close();
    }
  });

  test("district staff without data-integration permission cannot access endpoints or call log", async ({
    browser,
  }) => {
    // DataIntegration is a province-level function — district staff have no
    // DataIntegration.ApiEndpoints.View or DataIntegration.CallHistory.View permissions.
    const { context, page } = await newSignedInPage(
      browser,
      "district.staff@foodsafe.local",
    );
    try {
      const endpointList = await page.context().request.get(
        "/api/v1/app/api-endpoint",
        { maxRedirects: 0 },
      );
      expect([403, 302]).toContain(endpointList.status());
      expect(endpointList.ok()).toBeFalsy();

      const callLog = await page.context().request.get(
        "/api/v1/app/api-call-log",
        { maxRedirects: 0 },
      );
      expect([403, 302]).toContain(callLog.status());
      expect(callLog.ok()).toBeFalsy();
    } finally {
      await context.close();
    }
  });

  test("full CRUD lifecycle: create, read, update, toggle-status, delete", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    const headers = await csrfHeaders(page);
    const suffix = Date.now().toString().slice(-8);
    const name = `E2E-API-V-${suffix}`;
    const fixture = await createEndpoint(page, headers, name);

    try {
      // GET by id — verify persisted fields
      const get = await page.context().request.get(
        `/api/v1/app/api-endpoint/${fixture.id}`,
        { maxRedirects: 0 },
      );
      expect(get.ok(), await get.text()).toBeTruthy();
      const dto = (await get.json()) as {
        name: string;
        httpMethod: string;
        externalSystem: string;
        status: number | string;
        authType: number | string;
      };
      expect(dto.name).toBe(name);
      expect(dto.httpMethod).toBe("GET");
      expect(dto.externalSystem).toBe("Bộ Y tế");
      expect(String(dto.status)).toMatch(/^(Active|1)$/);
      expect(String(dto.authType)).toMatch(/^(None|1)$/);

      // UPDATE
      const updated = await page.context().request.put(
        `/api/v1/app/api-endpoint/${fixture.id}`,
        {
          headers,
          maxRedirects: 0,
          data: {
            name: `${name}-updated`,
            url: "https://api.example.gov.vn/e2e-updated",
            httpMethod: "POST",
            externalSystem: "Sở Nông nghiệp",
            authType: 2,
            description: "Cập nhật kiểm chứng E2E",
          },
        },
      );
      expect(updated.ok(), await updated.text()).toBeTruthy();
      const updatedDto = (await updated.json()) as {
        name: string;
        httpMethod: string;
      };
      expect(updatedDto.name).toBe(`${name}-updated`);
      expect(updatedDto.httpMethod).toBe("POST");

      // TOGGLE-STATUS: Active → Inactive
      const toggleOff = await page.context().request.post(
        `/api/v1/app/api-endpoint/${fixture.id}/toggle-status`,
        { headers, maxRedirects: 0 },
      );
      expect(toggleOff.ok(), await toggleOff.text()).toBeTruthy();

      const afterToggleOff = (await (await page.context().request.get(
        `/api/v1/app/api-endpoint/${fixture.id}`,
      )).json()) as { status: number | string };
      expect(String(afterToggleOff.status)).toMatch(/^(Inactive|2)$/);

      // TOGGLE-STATUS: Inactive → Active
      const toggleOn = await page.context().request.post(
        `/api/v1/app/api-endpoint/${fixture.id}/toggle-status`,
        { headers, maxRedirects: 0 },
      );
      expect(toggleOn.ok(), await toggleOn.text()).toBeTruthy();

      const afterToggleOn = (await (await page.context().request.get(
        `/api/v1/app/api-endpoint/${fixture.id}`,
      )).json()) as { status: number | string };
      expect(String(afterToggleOn.status)).toMatch(/^(Active|1)$/);

      // DELETE
      const del = await page.context().request.delete(
        `/api/v1/app/api-endpoint/${fixture.id}`,
        { headers, maxRedirects: 0 },
      );
      expect(del.ok(), await del.text()).toBeTruthy();

      // GET after delete → not found
      const afterDelete = await page.context().request.get(
        `/api/v1/app/api-endpoint/${fixture.id}`,
        { maxRedirects: 0 },
      );
      expect(afterDelete.ok()).toBeFalsy();
    } catch (err) {
      // best-effort cleanup on test failure
      await deleteEndpoint(page, headers, fixture.id);
      throw err;
    }
  });

  test("server-side validation rejects incomplete or invalid input", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    const headers = await csrfHeaders(page);
    const req = page.context().request;

    // Missing name
    const missingName = await req.post("/api/v1/app/api-endpoint", {
      headers,
      maxRedirects: 0,
      data: {
        url: "https://api.example.gov.vn/test",
        httpMethod: "GET",
        externalSystem: "Bộ Y tế",
        authType: 1,
      },
    });
    expect(missingName.ok()).toBeFalsy();

    // Missing URL
    const missingUrl = await req.post("/api/v1/app/api-endpoint", {
      headers,
      maxRedirects: 0,
      data: {
        name: "E2E-API-NOVAL-URL",
        httpMethod: "GET",
        externalSystem: "Bộ Y tế",
        authType: 1,
      },
    });
    expect(missingUrl.ok()).toBeFalsy();

    // Missing HttpMethod
    const missingMethod = await req.post("/api/v1/app/api-endpoint", {
      headers,
      maxRedirects: 0,
      data: {
        name: "E2E-API-NOVAL-METHOD",
        url: "https://api.example.gov.vn/test",
        externalSystem: "Bộ Y tế",
        authType: 1,
      },
    });
    expect(missingMethod.ok()).toBeFalsy();

    // Missing ExternalSystem
    const missingSystem = await req.post("/api/v1/app/api-endpoint", {
      headers,
      maxRedirects: 0,
      data: {
        name: "E2E-API-NOVAL-SYS",
        url: "https://api.example.gov.vn/test",
        httpMethod: "GET",
        authType: 1,
      },
    });
    expect(missingSystem.ok()).toBeFalsy();
  });

  test("call history is readable by authorized user", async ({ page }) => {
    await signInAsAdmin(page);
    const res = await page.context().request.get("/api/v1/app/api-call-log", {
      maxRedirects: 0,
    });
    expect(res.ok(), await res.text()).toBeTruthy();
    const body = (await res.json()) as { items: unknown[]; totalCount: number };
    expect(Array.isArray(body.items)).toBeTruthy();
    expect(typeof body.totalCount).toBe("number");
  });

  test("persistence after reload and empty state (UI)", async ({ page }) => {
    await signInAsAdmin(page);
    const headers = await csrfHeaders(page);
    const suffix = Date.now().toString().slice(-8);
    const name = `E2E-API-UI-${suffix}`;
    const fixture = await createEndpoint(page, headers, name);

    try {
      await page.goto("/data-integration");
      const search = page.getByPlaceholder("Tên, URL, hệ thống");
      await search.fill(name);
      await page.keyboard.press("Enter");
      await expect(page.getByText(name)).toBeVisible({ timeout: 10_000 });

      // Reload — data persists
      await page.reload();
      await page.getByPlaceholder("Tên, URL, hệ thống").fill(name);
      await page.keyboard.press("Enter");
      await expect(page.getByText(name)).toBeVisible({ timeout: 10_000 });

      // Empty state — search for a name that cannot exist
      await page.getByPlaceholder("Tên, URL, hệ thống").fill("KHONG-TON-TAI-XYZ-99999");
      await page.keyboard.press("Enter");
      await expect(
        page.locator(".ant-empty-description").first(),
      ).toBeVisible({ timeout: 10_000 });
    } finally {
      await deleteEndpoint(page, headers, fixture.id);
    }
  });
});
