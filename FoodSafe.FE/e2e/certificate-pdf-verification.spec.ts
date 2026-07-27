/**
 * F-034: Certificate PDF Download
 *
 * Verifies that:
 *  1. The public certificate search endpoints return `id` for each record.
 *  2. The 5 certificate PDF endpoints return valid application/pdf bytes.
 *  3. The public portal UI shows a "Tải PDF" link for certificate types that
 *     have a PDF endpoint (not for ad-registrations).
 *
 * No API interception — all requests go to the real stack.
 */

import { test, expect, type Page } from "@playwright/test";
import { signInAsAdmin, requestVerificationToken } from "./helpers/auth";

const PROVINCE_ORG_ID = "e2e00000-0000-4000-8010-000000000001";
const STAMP = `PD${Date.now().toString(36).slice(-6).toUpperCase()}`;

// ── helpers ──────────────────────────────────────────────────────────────────

async function csrfHeaders(page: Page) {
  return { RequestVerificationToken: await requestVerificationToken(page) };
}

async function createBusiness(page: Page, suffix: string): Promise<string> {
  const headers = await csrfHeaders(page);
  const resp = await page.context().request.post("/api/v1/app/business", {
    headers,
    data: {
      organizationId: PROVINCE_ORG_ID,
      code: `PDF-CS-${suffix}`,
      name: `Cơ sở PDF Test ${suffix}`,
      productGroupIds: [],
    },
  });
  expect(resp.ok(), `create business: ${await resp.text()}`).toBeTruthy();
  return ((await resp.json()) as { id: string }).id;
}

// ── tests ────────────────────────────────────────────────────────────────────

test.describe("F-034: Certificate PDF Download", () => {
  let adminPage: Page;
  let businessId: string;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({ baseURL: "http://127.0.0.1:8080" });
    adminPage = await context.newPage();
    await adminPage.goto("http://127.0.0.1:8080");
    await signInAsAdmin(adminPage);
    businessId = await createBusiness(adminPage, STAMP);
  });

  test.afterAll(async () => {
    await adminPage.context().close();
  });

  // ── API: PDF bytes ───────────────────────────────────────────────────────

  test("eligibility certificate — PDF endpoint returns valid PDF", async () => {
    const headers = await csrfHeaders(adminPage);

    // Create the certificate
    const certResp = await adminPage.context().request.post(
      "/api/v1/app/eligibility-certificate",
      {
        headers,
        data: {
          businessId,
          certificateNumber: `EC-PDF-${STAMP}`,
          issueDate: "2025-01-01",
          certifyingAuthority: "Chi cục ATVSTP Quảng Ninh",
        },
      }
    );
    expect(certResp.ok(), await certResp.text()).toBeTruthy();
    const certId = ((await certResp.json()) as { id: string }).id;

    // Verify public search returns id
    const searchResp = await adminPage.context().request.get(
      `/api/v1/public/eligibility-certificates/search?Keyword=EC-PDF-${STAMP}&MaxResultCount=1`
    );
    expect(searchResp.ok()).toBeTruthy();
    const searchBody = await searchResp.json();
    expect(searchBody.totalCount).toBeGreaterThan(0);
    expect(searchBody.items[0].id).toBe(certId);

    // Download PDF (anonymous — public endpoint)
    const pdfResp = await adminPage.context().request.get(
      `/api/v1/public/eligibility-certificates/${certId}/pdf`
    );
    expect(pdfResp.status()).toBe(200);
    expect(pdfResp.headers()["content-type"]).toContain("application/pdf");
    const body = await pdfResp.body();
    expect(body.length).toBeGreaterThan(1000);
    expect(body.subarray(0, 4).toString("ascii")).toBe("%PDF");
  });

  test("self-declaration — PDF endpoint returns valid PDF", async () => {
    const headers = await csrfHeaders(adminPage);

    const sdResp = await adminPage.context().request.post(
      "/api/v1/app/self-declaration",
      {
        headers,
        data: {
          businessId,
          declarationNumber: `SD-PDF-${STAMP}`,
          productName: `Sản phẩm PDF ${STAMP}`,
          declarationDate: "2025-01-01",
          organizationId: PROVINCE_ORG_ID,
        },
      }
    );
    expect(sdResp.ok(), await sdResp.text()).toBeTruthy();
    const sdId = ((await sdResp.json()) as { id: string }).id;

    const pdfResp = await adminPage.context().request.get(
      `/api/v1/public/self-declarations/${sdId}/pdf`
    );
    expect(pdfResp.status()).toBe(200);
    expect(pdfResp.headers()["content-type"]).toContain("application/pdf");
    const body = await pdfResp.body();
    expect(body.subarray(0, 4).toString("ascii")).toBe("%PDF");
  });

  test("product-registration — PDF endpoint returns valid PDF", async () => {
    const headers = await csrfHeaders(adminPage);

    const prResp = await adminPage.context().request.post(
      "/api/v1/app/product-registration",
      {
        headers,
        data: {
          businessId,
          registrationNumber: `PR-PDF-${STAMP}`,
          productName: `Sản phẩm đăng ký ${STAMP}`,
          registrationDate: "2025-01-01",
          organizationId: PROVINCE_ORG_ID,
        },
      }
    );
    expect(prResp.ok(), await prResp.text()).toBeTruthy();
    const prId = ((await prResp.json()) as { id: string }).id;

    const pdfResp = await adminPage.context().request.get(
      `/api/v1/public/product-registrations/${prId}/pdf`
    );
    expect(pdfResp.status()).toBe(200);
    expect(pdfResp.headers()["content-type"]).toContain("application/pdf");
    const body = await pdfResp.body();
    expect(body.subarray(0, 4).toString("ascii")).toBe("%PDF");
  });

  test("CFS certificate — PDF endpoint returns valid PDF", async () => {
    const headers = await csrfHeaders(adminPage);

    // Get a country option for CFS
    const countriesResp = await adminPage.context().request.get(
      "/api/v1/app/cfs-certificate/country-options"
    );
    expect(countriesResp.ok()).toBeTruthy();
    const countries = (await countriesResp.json()) as { id: string }[];
    const countryId = countries[0]?.id ?? "";

    const cfsResp = await adminPage.context().request.post(
      "/api/v1/app/cfs-certificate",
      {
        headers,
        data: {
          businessId,
          certificateNumber: `CFS-PDF-${STAMP}`,
          issueDate: "2025-01-01",
          destinationCountryId: countryId,
        },
      }
    );
    expect(cfsResp.ok(), await cfsResp.text()).toBeTruthy();
    const cfsId = ((await cfsResp.json()) as { id: string }).id;

    const pdfResp = await adminPage.context().request.get(
      `/api/v1/public/cfs-certificates/${cfsId}/pdf`
    );
    expect(pdfResp.status()).toBe(200);
    expect(pdfResp.headers()["content-type"]).toContain("application/pdf");
    const body = await pdfResp.body();
    expect(body.subarray(0, 4).toString("ascii")).toBe("%PDF");
  });

  test("export-food certificate — PDF endpoint returns valid PDF", async () => {
    const headers = await csrfHeaders(adminPage);

    const efResp = await adminPage.context().request.post(
      "/api/v1/app/export-food-certificate",
      {
        headers,
        data: {
          businessId,
          certificateNumber: `EF-PDF-${STAMP}`,
          issueDate: "2025-01-01",
        },
      }
    );
    expect(efResp.ok(), await efResp.text()).toBeTruthy();
    const efId = ((await efResp.json()) as { id: string }).id;

    const pdfResp = await adminPage.context().request.get(
      `/api/v1/public/export-food-certificates/${efId}/pdf`
    );
    expect(pdfResp.status()).toBe(200);
    expect(pdfResp.headers()["content-type"]).toContain("application/pdf");
    const body = await pdfResp.body();
    expect(body.subarray(0, 4).toString("ascii")).toBe("%PDF");
  });

  test("unknown certificate ID — returns error (not 200)", async () => {
    const fakeId = "00000000-0000-0000-0000-000000000099";
    const resp = await adminPage.context().request.get(
      `/api/v1/public/eligibility-certificates/${fakeId}/pdf`
    );
    // Dev mode: UserFriendlyException reaches developer exception page → 500
    // Prod mode: ABP exception handler converts UserFriendlyException → 403
    // Either way it must not be 200 (success)
    expect(resp.status()).not.toBe(200);
    expect(resp.headers()["content-type"]).not.toContain("application/pdf");
  });

  // ── UI: Tải PDF button visibility ────────────────────────────────────────

  test("certificate search page shows Tải PDF link for eligibility certs", async ({
    browser,
  }) => {
    const publicCtx = await browser.newContext();
    const publicPage = await publicCtx.newPage();

    await publicPage.goto("http://127.0.0.1:8080/tra-cuu-giay-phep");
    await publicPage.waitForLoadState("networkidle");

    // Search for the cert we created
    await publicPage
      .locator('input[placeholder*="Số giấy phép"], input[placeholder*="cơ sở"]')
      .first()
      .fill(`EC-PDF-${STAMP}`);
    await publicPage.keyboard.press("Enter");
    await publicPage.waitForLoadState("networkidle");

    const pdfLinks = publicPage.locator('a:has-text("Tải PDF")');
    await expect(pdfLinks.first()).toBeVisible({ timeout: 10000 });

    const href = await pdfLinks.first().getAttribute("href");
    expect(href).toMatch(
      /\/api\/v1\/public\/eligibility-certificates\/[0-9a-f-]+\/pdf/
    );

    await publicCtx.close();
  });

  test("ad-registrations tab — active tabpanel has no Tải PDF link", async ({
    browser,
  }) => {
    const publicCtx = await browser.newContext();
    const publicPage = await publicCtx.newPage();

    await publicPage.goto("http://127.0.0.1:8080/tra-cuu-giay-phep");
    await publicPage.waitForLoadState("networkidle");

    // Click the ad-registrations tab
    await publicPage.click('div[role="tab"]:has-text("Đăng ký quảng cáo")');
    await publicPage.waitForLoadState("networkidle");

    // Other tabs stay in DOM (hidden) when switching — only check visible links
    const visiblePdfLinks = publicPage.locator('a:has-text("Tải PDF"):visible');
    await expect(visiblePdfLinks).toHaveCount(0);

    await publicCtx.close();
  });
});
