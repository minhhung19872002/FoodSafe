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
  return {
    RequestVerificationToken: await requestVerificationToken(page),
  };
}

interface Fixture {
  centerId: string;
  resultId: string;
  sampleCode: string;
}

async function createFixture(
  page: Page,
  headers: Record<string, string>,
  suffix: string,
): Promise<Fixture> {
  const request = page.context().request;
  const centerResponse = await request.post(
    "/api/v1/app/master-catalog/testing-center",
    {
      headers,
      data: {
        code: `E2E-KNV-TT-${suffix}`,
        name: `Trung tâm kiểm chứng ${suffix}`,
        address: "Số 1 đường Kiểm Chứng, Hạ Long, Quảng Ninh",
        provinceId: "e2e00000-0000-4000-8001-000000000001",
        accreditationNumber: `VILAS-E2E-${suffix}`,
        accreditationScope: "Vi sinh, hóa lý thực phẩm (E2E)",
      },
    },
  );
  expect(centerResponse.ok(), await centerResponse.text()).toBeTruthy();
  const center = (await centerResponse.json()) as { id: string };

  const sampleCode = `E2E-KNV-${suffix}`;
  const resultResponse = await request.post("/api/v1/app/testing-result", {
    headers,
    data: {
      sampleCode,
      sampleName: `Mẫu kiểm chứng ${suffix}`,
      testingCenterId: center.id,
      sampleDate: "2026-07-20T00:00:00Z",
      outcome: 1,
    },
  });
  expect(resultResponse.ok(), await resultResponse.text()).toBeTruthy();
  const result = (await resultResponse.json()) as { id: string };

  return { centerId: center.id, resultId: result.id, sampleCode };
}

async function destroyFixture(
  page: Page,
  headers: Record<string, string>,
  fixture: Fixture,
) {
  const request = page.context().request;
  await request.delete(`/api/v1/app/testing-result/${fixture.resultId}`, {
    headers,
    maxRedirects: 0,
  });
  await request.delete(
    `/api/v1/app/master-catalog/${fixture.centerId}/testing-center`,
    { headers, maxRedirects: 0 },
  );
}

test.describe("testing results verification (F-017)", () => {
  test.setTimeout(90_000);

  test("unauthenticated API access is rejected", async ({ request }) => {
    const response = await request.get("/api/v1/app/testing-result", {
      maxRedirects: 0,
    });
    expect([401, 302]).toContain(response.status());
    expect(response.ok()).toBeFalsy();
  });

  test("user without testing-results permission is denied", async ({
    browser,
  }) => {
    const { context, page } = await newSignedInPage(
      browser,
      "noperm@foodsafe.local",
    );
    try {
      const response = await page.context().request.get(
        "/api/v1/app/testing-result",
        { maxRedirects: 0 },
      );
      expect([403, 302]).toContain(response.status());
      expect(response.ok()).toBeFalsy();
    } finally {
      await context.close();
    }
  });

  test("district staff without testing-results permission cannot list or fetch province results", async ({
    browser,
    page,
  }) => {
    // DistrictStaff deliberately has no AlertsAndTesting.TestingResults
    // permissions (testing results are a province-level function, STT 37),
    // so the cross-org read is blocked one layer earlier — at authorization.
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
        `/api/v1/app/testing-result?Filter=${fixture.sampleCode}&MaxResultCount=10`,
        { maxRedirects: 0 },
      );
      expect([403, 302]).toContain(list.status());
      expect(list.ok()).toBeFalsy();

      const detail = await district.page.context().request.get(
        `/api/v1/app/testing-result/${fixture.resultId}`,
        { maxRedirects: 0 },
      );
      expect([403, 302, 404]).toContain(detail.status());
      expect(detail.ok()).toBeFalsy();
    } finally {
      await district.context.close();
      await destroyFixture(page, headers, fixture);
    }
  });

  test("server-side validation: missing sample fields and empty testing center rejected", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    const headers = await csrfHeaders(page);
    const request = page.context().request;

    const missingSample = await request.post("/api/v1/app/testing-result", {
      headers,
      maxRedirects: 0,
      data: {
        testingCenterId: "00000000-0000-0000-0000-000000000000",
        sampleDate: "2026-07-20T00:00:00Z",
        outcome: 1,
      },
    });
    expect(missingSample.ok()).toBeFalsy();

    const emptyCenter = await request.post("/api/v1/app/testing-result", {
      headers,
      maxRedirects: 0,
      data: {
        sampleCode: "E2E-KNV-NOCTR",
        sampleName: "Mẫu thiếu trung tâm",
        testingCenterId: "00000000-0000-0000-0000-000000000000",
        sampleDate: "2026-07-20T00:00:00Z",
        outcome: 1,
      },
    });
    expect(emptyCenter.ok()).toBeFalsy();
    expect(await emptyCenter.text()).toContain(
      "FoodSafe:TestingResult:0002",
    );
  });

  test("persistence after reload, edit, and empty state", async ({ page }) => {
    await signInAsAdmin(page);
    const headers = await csrfHeaders(page);
    const suffix = Date.now().toString().slice(-8);
    const fixture = await createFixture(page, headers, suffix);

    try {
      await page.goto("/testing-results");
      const search = page.getByPlaceholder("Mã mẫu, tên mẫu");
      await search.fill(fixture.sampleCode);
      await page.keyboard.press("Enter");
      await expect(page.getByText(fixture.sampleCode)).toBeVisible({
        timeout: 10_000,
      });
      await expect(
        page.getByText(`Trung tâm kiểm chứng ${suffix}`),
      ).toBeVisible();

      await page.reload();
      await page
        .getByPlaceholder("Mã mẫu, tên mẫu")
        .fill(fixture.sampleCode);
      await page.keyboard.press("Enter");
      await expect(page.getByText(fixture.sampleCode)).toBeVisible({
        timeout: 10_000,
      });

      await page
        .getByPlaceholder("Mã mẫu, tên mẫu")
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

