import { expect, test, type Browser, type Page } from "@playwright/test";
import {
  requestVerificationToken,
  signIn,
  signInAsAdmin,
} from "./helpers/auth";

const TEST_PASSWORD = process.env.E2E_TEST_USER_PASSWORD ?? "Admin@2026!";
const PROVINCE_ORG_ID = "e2e00000-0000-4000-8010-000000000001";
const DISTRICT_ORG_ID = "e2e00000-0000-4000-8010-000000000002";

async function newSignedInPage(browser: Browser, userName: string) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await signIn(page, userName, TEST_PASSWORD);
  return { context, page };
}

async function csrfHeaders(page: Page) {
  return {
    RequestVerificationToken: await requestVerificationToken(page),
  };
}

async function createBusiness(
  page: Page,
  headers: Record<string, string>,
  organizationId: string,
  code: string,
  name: string,
) {
  const response = await page.context().request.post("/api/v1/app/business", {
    headers,
    data: { organizationId, code, name, productGroupIds: [] },
  });
  expect(response.ok(), await response.text()).toBeTruthy();
  return (await response.json()) as { id: string };
}

async function deleteBusiness(
  page: Page,
  headers: Record<string, string>,
  id: string,
) {
  await page.context().request.delete(`/api/v1/app/business/${id}`, {
    headers,
    maxRedirects: 0,
  });
}

test.describe("businesses verification (F-006)", () => {
  test.setTimeout(90_000);

  test("unauthenticated API access is rejected", async ({ request }) => {
    const response = await request.get("/api/v1/app/business", {
      maxRedirects: 0,
    });
    expect([401, 302]).toContain(response.status());
    expect(response.ok()).toBeFalsy();
  });

  test("user without business permission is denied", async ({ browser }) => {
    const { context, page } = await newSignedInPage(
      browser,
      "noperm@foodsafe.local",
    );
    try {
      const response = await page.context().request.get(
        "/api/v1/app/business",
        { maxRedirects: 0 },
      );
      expect([403, 302]).toContain(response.status());
      expect(response.ok()).toBeFalsy();
    } finally {
      await context.close();
    }
  });

  test("client-supplied organizationId cannot bypass server scope", async ({
    browser,
  }) => {
    const district = await newSignedInPage(
      browser,
      "district.staff@foodsafe.local",
    );
    try {
      const headers = await csrfHeaders(district.page);
      const suffix = Date.now().toString().slice(-8);
      const bypassAttempt = await district.page.context().request.post(
        "/api/v1/app/business",
        {
          headers,
          maxRedirects: 0,
          data: {
            organizationId: PROVINCE_ORG_ID,
            code: `E2E-CSV-BYPASS-${suffix}`,
            name: "Cơ sở vượt phạm vi đơn vị",
            productGroupIds: [],
          },
        },
      );
      expect([403, 302]).toContain(bypassAttempt.status());
      expect(bypassAttempt.ok()).toBeFalsy();

      const ownOrg = await district.page.context().request.post(
        "/api/v1/app/business",
        {
          headers,
          maxRedirects: 0,
          data: {
            organizationId: DISTRICT_ORG_ID,
            code: `E2E-CSV-OWN-${suffix}`,
            name: `Cơ sở trong phạm vi ${suffix}`,
            productGroupIds: [],
          },
        },
      );
      expect(ownOrg.ok(), await ownOrg.text()).toBeTruthy();
      const created = (await ownOrg.json()) as { id: string };

      await district.page.context().request.delete(
        `/api/v1/app/business/${created.id}`,
        { headers, maxRedirects: 0 },
      );
    } finally {
      await district.context.close();
    }
  });

  test("cross-organization business is hidden, blocked and org change is rejected", async ({
    browser,
    page,
  }) => {
    await signInAsAdmin(page);
    const headers = await csrfHeaders(page);
    const suffix = Date.now().toString().slice(-8);
    const code = `E2E-CSV-SCOPE-${suffix}`;
    const name = `Cơ sở phạm vi tỉnh ${suffix}`;
    const business = await createBusiness(
      page,
      headers,
      PROVINCE_ORG_ID,
      code,
      name,
    );

    const district = await newSignedInPage(
      browser,
      "district.staff@foodsafe.local",
    );
    try {
      const list = await district.page.context().request.get(
        `/api/v1/app/business?Filter=${code}&MaxResultCount=10`,
      );
      expect(list.ok(), await list.text()).toBeTruthy();
      const payload = (await list.json()) as { items: { code?: string }[] };
      expect(payload.items.filter((x) => x.code === code)).toHaveLength(0);

      const detail = await district.page.context().request.get(
        `/api/v1/app/business/${business.id}`,
        { maxRedirects: 0 },
      );
      expect([403, 302, 404]).toContain(detail.status());
      expect(detail.ok()).toBeFalsy();

      const orgChange = await page.context().request.put(
        `/api/v1/app/business/${business.id}`,
        {
          headers,
          maxRedirects: 0,
          data: {
            organizationId: DISTRICT_ORG_ID,
            code,
            name,
            status: 1,
            productGroupIds: [],
          },
        },
      );
      expect([403, 302]).toContain(orgChange.status());
      expect(orgChange.ok()).toBeFalsy();
    } finally {
      await district.context.close();
      await deleteBusiness(page, headers, business.id);
    }
  });

  test("duplicate code prevention and server-side validation", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    const headers = await csrfHeaders(page);
    const suffix = Date.now().toString().slice(-8);
    const code = `E2E-CSV-DUP-${suffix}`;
    const business = await createBusiness(
      page,
      headers,
      PROVINCE_ORG_ID,
      code,
      `Cơ sở trùng mã ${suffix}`,
    );
    const request = page.context().request;

    try {
      const duplicate = await request.post("/api/v1/app/business", {
        headers,
        maxRedirects: 0,
        data: {
          organizationId: PROVINCE_ORG_ID,
          code,
          name: "Cơ sở trùng mã thứ hai",
          productGroupIds: [],
        },
      });
      expect(duplicate.ok()).toBeFalsy();

      const missingName = await request.post("/api/v1/app/business", {
        headers,
        maxRedirects: 0,
        data: {
          organizationId: PROVINCE_ORG_ID,
          code: `E2E-CSV-VAL-${suffix}`,
          productGroupIds: [],
        },
      });
      expect(missingName.status()).toBe(400);

      const badEmail = await request.post("/api/v1/app/business", {
        headers,
        maxRedirects: 0,
        data: {
          organizationId: PROVINCE_ORG_ID,
          code: `E2E-CSV-VAL2-${suffix}`,
          name: "Cơ sở email sai",
          contactEmail: "khong-phai-email",
          productGroupIds: [],
        },
      });
      expect(badEmail.status()).toBe(400);

      const badLatitude = await request.post("/api/v1/app/business", {
        headers,
        maxRedirects: 0,
        data: {
          organizationId: PROVINCE_ORG_ID,
          code: `E2E-CSV-VAL3-${suffix}`,
          name: "Cơ sở tọa độ sai",
          addressLatitude: 91,
          productGroupIds: [],
        },
      });
      expect(badLatitude.status()).toBe(400);
    } finally {
      await deleteBusiness(page, headers, business.id);
    }
  });

  test("persistence after reload and empty state", async ({ page }) => {
    await signInAsAdmin(page);
    const headers = await csrfHeaders(page);
    const suffix = Date.now().toString().slice(-8);
    const code = `E2E-CSV-UI-${suffix}`;
    const name = `Cơ sở giao diện ${suffix}`;
    const business = await createBusiness(
      page,
      headers,
      PROVINCE_ORG_ID,
      code,
      name,
    );

    try {
      await page.goto("/businesses");
      const search = page.getByPlaceholder("Tên, mã, MST hoặc địa chỉ");
      await search.fill(code);
      await page.keyboard.press("Enter");
      await expect(page.getByText(name)).toBeVisible({ timeout: 10_000 });

      await page.reload();
      await page.getByPlaceholder("Tên, mã, MST hoặc địa chỉ").fill(code);
      await page.keyboard.press("Enter");
      await expect(page.getByText(name)).toBeVisible({ timeout: 10_000 });

      await page
        .getByPlaceholder("Tên, mã, MST hoặc địa chỉ")
        .fill("KHONG-TON-TAI-XYZ-99999");
      await page.keyboard.press("Enter");
      await expect(
        page
          .locator(".ant-empty-description", { hasText: "Trống" })
          .first(),
      ).toBeVisible({ timeout: 10_000 });
    } finally {
      await deleteBusiness(page, headers, business.id);
    }
  });
});
