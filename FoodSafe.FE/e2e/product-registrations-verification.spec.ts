import { expect, test, type Browser, type Page } from "@playwright/test";
import {
  requestVerificationToken,
  signIn,
  signInAsAdmin,
} from "./helpers/auth";

const TEST_PASSWORD = process.env.E2E_TEST_USER_PASSWORD ?? "Admin@2026!";
const PROVINCE_ORG_ID = "e2e00000-0000-4000-8010-000000000001";

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

interface Fixture {
  businessId: string;
  productId: string;
  registrationId: string;
  registrationNumber: string;
}

async function createFixture(
  page: Page,
  headers: Record<string, string>,
  suffix: string,
): Promise<Fixture> {
  const request = page.context().request;
  const businessResponse = await request.post("/api/v1/app/business", {
    headers,
    data: {
      organizationId: PROVINCE_ORG_ID,
      code: `E2E-DKCB-CS-${suffix}`,
      name: `Cơ sở đăng ký công bố ${suffix}`,
      productGroupIds: [],
    },
  });
  expect(businessResponse.ok(), await businessResponse.text()).toBeTruthy();
  const business = (await businessResponse.json()) as { id: string };

  const productResponse = await request.post("/api/v1/app/product", {
    headers,
    data: {
      businessId: business.id,
      code: `E2E-DKCB-SP-${suffix}`,
      name: `Sản phẩm đăng ký ${suffix}`,
    },
  });
  expect(productResponse.ok(), await productResponse.text()).toBeTruthy();
  const product = (await productResponse.json()) as { id: string };

  const registrationNumber = `E2E-DKCB-${suffix}`;
  const registrationResponse = await request.post(
    "/api/v1/app/product-registration",
    {
      headers,
      data: {
        businessId: business.id,
        productId: product.id,
        registrationNumber,
        registrationDate: "2026-07-01",
        productName: `Sản phẩm đăng ký ${suffix}`,
      },
    },
  );
  expect(
    registrationResponse.ok(),
    await registrationResponse.text(),
  ).toBeTruthy();
  const registration = (await registrationResponse.json()) as { id: string };

  return {
    businessId: business.id,
    productId: product.id,
    registrationId: registration.id,
    registrationNumber,
  };
}

async function destroyFixture(
  page: Page,
  headers: Record<string, string>,
  fixture: Fixture,
) {
  const request = page.context().request;
  await request.delete(
    `/api/v1/app/product-registration/${fixture.registrationId}`,
    { headers, maxRedirects: 0 },
  );
  await request.delete(`/api/v1/app/product/${fixture.productId}`, {
    headers,
    maxRedirects: 0,
  });
  await request.delete(`/api/v1/app/business/${fixture.businessId}`, {
    headers,
    maxRedirects: 0,
  });
}

test.describe("product registrations verification (F-008)", () => {
  test.setTimeout(90_000);

  test("unauthenticated API access is rejected", async ({ request }) => {
    const response = await request.get("/api/v1/app/product-registration", {
      maxRedirects: 0,
    });
    expect([401, 302]).toContain(response.status());
    expect(response.ok()).toBeFalsy();
  });

  test("user without registration permission is denied", async ({
    browser,
  }) => {
    const { context, page } = await newSignedInPage(
      browser,
      "noperm@foodsafe.local",
    );
    try {
      const response = await page.context().request.get(
        "/api/v1/app/product-registration",
        { maxRedirects: 0 },
      );
      expect([403, 302]).toContain(response.status());
      expect(response.ok()).toBeFalsy();
    } finally {
      await context.close();
    }
  });

  test("cross-organization registration is hidden and blocked", async ({
    browser,
    page,
  }) => {
    await signInAsAdmin(page);
    const headers = await csrfHeaders(page);
    const suffix = Date.now().toString().slice(-8);
    const fixture = await createFixture(page, headers, suffix);

    const district = await newSignedInPage(
      browser,
      "district.staff@foodsafe.local",
    );
    try {
      const list = await district.page.context().request.get(
        `/api/v1/app/product-registration?Filter=${fixture.registrationNumber}&MaxResultCount=10`,
      );
      expect(list.ok(), await list.text()).toBeTruthy();
      const payload = (await list.json()) as {
        items: { registrationNumber?: string }[];
      };
      expect(
        payload.items.filter(
          (x) => x.registrationNumber === fixture.registrationNumber,
        ),
      ).toHaveLength(0);

      const detail = await district.page.context().request.get(
        `/api/v1/app/product-registration/${fixture.registrationId}`,
        { maxRedirects: 0 },
      );
      expect([403, 302, 404]).toContain(detail.status());
      expect(detail.ok()).toBeFalsy();
    } finally {
      await district.context.close();
      await destroyFixture(page, headers, fixture);
    }
  });

  test("revoke workflow, duplicate number and validation", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    const headers = await csrfHeaders(page);
    const suffix = Date.now().toString().slice(-8);
    const fixture = await createFixture(page, headers, suffix);
    const request = page.context().request;

    try {
      const duplicate = await request.post(
        "/api/v1/app/product-registration",
        {
          headers,
          maxRedirects: 0,
          data: {
            businessId: fixture.businessId,
            productId: fixture.productId,
            registrationNumber: fixture.registrationNumber,
            registrationDate: "2026-07-02",
            productName: "Bản sao trùng số đăng ký",
          },
        },
      );
      expect(duplicate.ok()).toBeFalsy();

      const missingNumber = await request.post(
        "/api/v1/app/product-registration",
        {
          headers,
          maxRedirects: 0,
          data: {
            businessId: fixture.businessId,
            productId: fixture.productId,
            registrationDate: "2026-07-02",
            productName: "Thiếu số đăng ký",
          },
        },
      );
      expect(missingNumber.status()).toBe(400);

      const revoke = await request.post(
        `/api/v1/app/product-registration/${fixture.registrationId}/revoke`,
        {
          headers,
          maxRedirects: 0,
          data: { reason: "Thu hồi kiểm chứng E2E" },
        },
      );
      expect(revoke.ok(), await revoke.text()).toBeTruthy();
      const revoked = (await revoke.json()) as { status?: number | string };
      expect(String(revoked.status)).toMatch(/^(Revoked|3)$/);

      const doubleRevoke = await request.post(
        `/api/v1/app/product-registration/${fixture.registrationId}/revoke`,
        {
          headers,
          maxRedirects: 0,
          data: { reason: "Thu hồi lần hai" },
        },
      );
      expect(doubleRevoke.ok()).toBeFalsy();
    } finally {
      await destroyFixture(page, headers, fixture);
    }
  });

  test("persistence after reload and empty state", async ({ page }) => {
    await signInAsAdmin(page);
    const headers = await csrfHeaders(page);
    const suffix = Date.now().toString().slice(-8);
    const fixture = await createFixture(page, headers, suffix);

    try {
      await page.goto("/product-registrations");
      const searchBox = page.getByPlaceholder(
        "Số đăng ký, tiếp nhận, sản phẩm",
      );
      await searchBox.fill(fixture.registrationNumber);
      await page.keyboard.press("Enter");
      await expect(
        page.getByText(fixture.registrationNumber),
      ).toBeVisible({ timeout: 10_000 });

      await page.reload();
      await page
        .getByPlaceholder("Số đăng ký, tiếp nhận, sản phẩm")
        .fill(fixture.registrationNumber);
      await page.keyboard.press("Enter");
      await expect(
        page.getByText(fixture.registrationNumber),
      ).toBeVisible({ timeout: 10_000 });

      await page
        .getByPlaceholder("Số đăng ký, tiếp nhận, sản phẩm")
        .fill("KHONG-TON-TAI-XYZ-99999");
      await page.keyboard.press("Enter");
      await expect(
        page
          .locator(".ant-empty-description", { hasText: "Trống" })
          .first(),
      ).toBeVisible({ timeout: 10_000 });
    } finally {
      await destroyFixture(page, headers, fixture);
    }
  });
});
