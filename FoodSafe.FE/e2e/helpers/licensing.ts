import {
  expect,
  test,
  type Browser,
  type Page,
} from "@playwright/test";
import { requestVerificationToken, signIn, signInAsAdmin } from "./auth";

const TEST_PASSWORD = process.env.E2E_TEST_USER_PASSWORD ?? "Admin@2026!";
export const PROVINCE_ORG_ID = "e2e00000-0000-4000-8010-000000000001";

export interface LicensingModuleConfig {
  featureId: string;
  title: string;
  endpoint: string;
  route: string;
  searchPlaceholder: string;
  numberField: string;
  numberPrefix: string;
  needsProduct?: boolean;
  buildCreatePayload: (
    businessId: string,
    number: string,
    extras: Record<string, string>,
  ) => Record<string, unknown>;
  fetchExtras?: (
    page: Page,
  ) => Promise<Record<string, string>>;
}

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
  entityId: string;
  number: string;
  extras: Record<string, string>;
}

async function createFixture(
  page: Page,
  headers: Record<string, string>,
  config: LicensingModuleConfig,
  suffix: string,
): Promise<Fixture> {
  const request = page.context().request;
  const businessResponse = await request.post("/api/v1/app/business", {
    headers,
    data: {
      organizationId: PROVINCE_ORG_ID,
      code: `${config.numberPrefix}-CS-${suffix}`,
      name: `Cơ sở kiểm chứng ${config.featureId} ${suffix}`,
      productGroupIds: [],
    },
  });
  expect(businessResponse.ok(), await businessResponse.text()).toBeTruthy();
  const business = (await businessResponse.json()) as { id: string };

  const extras = config.fetchExtras ? await config.fetchExtras(page) : {};
  if (config.needsProduct) {
    const productResponse = await request.post("/api/v1/app/product", {
      headers,
      data: {
        businessId: business.id,
        code: `${config.numberPrefix}-SP-${suffix}`,
        name: `Sản phẩm kiểm chứng ${suffix}`,
      },
    });
    expect(productResponse.ok(), await productResponse.text()).toBeTruthy();
    extras.productId = ((await productResponse.json()) as { id: string }).id;
  }
  const number = `${config.numberPrefix}-${suffix}`;
  const entityResponse = await request.post(`/api${config.endpoint}`, {
    headers,
    data: config.buildCreatePayload(business.id, number, extras),
  });
  expect(entityResponse.ok(), await entityResponse.text()).toBeTruthy();
  const entity = (await entityResponse.json()) as { id: string };

  return { businessId: business.id, entityId: entity.id, number, extras };
}

async function destroyFixture(
  page: Page,
  headers: Record<string, string>,
  config: LicensingModuleConfig,
  fixture: Fixture,
) {
  const request = page.context().request;
  await request.delete(`/api${config.endpoint}/${fixture.entityId}`, {
    headers,
    maxRedirects: 0,
  });
  if (fixture.extras.productId) {
    await request.delete(`/api/v1/app/product/${fixture.extras.productId}`, {
      headers,
      maxRedirects: 0,
    });
  }
  await request.delete(`/api/v1/app/business/${fixture.businessId}`, {
    headers,
    maxRedirects: 0,
  });
}

export function defineLicensingVerificationSuite(
  config: LicensingModuleConfig,
) {
  test.describe(`${config.title} verification (${config.featureId})`, () => {
    test.setTimeout(90_000);

    test("unauthenticated API access is rejected", async ({ request }) => {
      const response = await request.get(`/api${config.endpoint}`, {
        maxRedirects: 0,
      });
      expect([401, 302]).toContain(response.status());
      expect(response.ok()).toBeFalsy();
    });

    test("user without permission is denied", async ({ browser }) => {
      const { context, page } = await newSignedInPage(
        browser,
        "noperm@foodsafe.local",
      );
      try {
        const response = await page.context().request.get(
          `/api${config.endpoint}`,
          { maxRedirects: 0 },
        );
        expect([403, 302]).toContain(response.status());
        expect(response.ok()).toBeFalsy();
      } finally {
        await context.close();
      }
    });

    test("cross-organization record is hidden and blocked", async ({
      browser,
      page,
    }) => {
      await signInAsAdmin(page);
      const headers = await csrfHeaders(page);
      const suffix = Date.now().toString().slice(-8);
      const fixture = await createFixture(page, headers, config, suffix);

      const district = await newSignedInPage(
        browser,
        "district.staff@foodsafe.local",
      );
      try {
        const list = await district.page.context().request.get(
          `/api${config.endpoint}?Filter=${fixture.number}&MaxResultCount=10`,
        );
        expect(list.ok(), await list.text()).toBeTruthy();
        const payload = (await list.json()) as {
          items: Record<string, unknown>[];
        };
        expect(
          payload.items.filter(
            (x) => x[config.numberField] === fixture.number,
          ),
        ).toHaveLength(0);

        const detail = await district.page.context().request.get(
          `/api${config.endpoint}/${fixture.entityId}`,
          { maxRedirects: 0 },
        );
        expect([403, 302, 404]).toContain(detail.status());
        expect(detail.ok()).toBeFalsy();
      } finally {
        await district.context.close();
        await destroyFixture(page, headers, config, fixture);
      }
    });

    test("revoke workflow, duplicate number and validation", async ({
      page,
    }) => {
      await signInAsAdmin(page);
      const headers = await csrfHeaders(page);
      const suffix = Date.now().toString().slice(-8);
      const fixture = await createFixture(page, headers, config, suffix);
      const request = page.context().request;

      try {
        const duplicate = await request.post(`/api${config.endpoint}`, {
          headers,
          maxRedirects: 0,
          data: config.buildCreatePayload(
            fixture.businessId,
            fixture.number,
            fixture.extras,
          ),
        });
        expect(duplicate.ok()).toBeFalsy();

        const missingNumber = await request.post(`/api${config.endpoint}`, {
          headers,
          maxRedirects: 0,
          data: {
            ...config.buildCreatePayload(
              fixture.businessId,
              "",
              fixture.extras,
            ),
            [config.numberField]: undefined,
          },
        });
        expect(missingNumber.status()).toBe(400);

        const revoke = await request.post(
          `/api${config.endpoint}/${fixture.entityId}/revoke`,
          {
            headers,
            maxRedirects: 0,
            data: { reason: "Thu hồi kiểm chứng E2E" },
          },
        );
        expect(revoke.ok(), await revoke.text()).toBeTruthy();
        const revoked = (await revoke.json()) as {
          status?: number | string;
        };
        expect(String(revoked.status)).toMatch(/^(Revoked|3)$/);

        const doubleRevoke = await request.post(
          `/api${config.endpoint}/${fixture.entityId}/revoke`,
          {
            headers,
            maxRedirects: 0,
            data: { reason: "Thu hồi lần hai" },
          },
        );
        expect(doubleRevoke.ok()).toBeFalsy();
      } finally {
        await destroyFixture(page, headers, config, fixture);
      }
    });

    test("persistence after reload and empty state", async ({ page }) => {
      await signInAsAdmin(page);
      const headers = await csrfHeaders(page);
      const suffix = Date.now().toString().slice(-8);
      const fixture = await createFixture(page, headers, config, suffix);

      try {
        await page.goto(config.route);
        const search = page.getByPlaceholder(config.searchPlaceholder);
        await search.fill(fixture.number);
        await page.keyboard.press("Enter");
        await expect(page.getByText(fixture.number)).toBeVisible({
          timeout: 10_000,
        });

        await page.reload();
        await page
          .getByPlaceholder(config.searchPlaceholder)
          .fill(fixture.number);
        await page.keyboard.press("Enter");
        await expect(page.getByText(fixture.number)).toBeVisible({
          timeout: 10_000,
        });

        await page
          .getByPlaceholder(config.searchPlaceholder)
          .fill("KHONG-TON-TAI-XYZ-99999");
        await page.keyboard.press("Enter");
        await expect(
          page
            .locator(".ant-empty-description", { hasText: "Trống" })
            .first(),
        ).toBeVisible({ timeout: 10_000 });
      } finally {
        await destroyFixture(page, headers, config, fixture);
      }
    });
  });
}
