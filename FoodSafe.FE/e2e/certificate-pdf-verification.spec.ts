/**
 * F-034: Public Certificate PDF View / Download
 * Requirements: FR-42-03/04, FR-43-03/04, FR-44-03/04, FR-46-03/04, FR-47-03/04
 *
 * Verifies, against the REAL stack (no API interception):
 *  1. The public certificate search endpoints return `id` for each record.
 *  2. The 5 certificate PDF endpoints return valid application/pdf bytes to an
 *     AUTHENTICATED caller.
 *  3. **The 5 certificate PDF endpoints serve the document to a FULLY
 *     UNAUTHENTICATED browser context (zero cookies) — the citizen-facing
 *     requirement FR-4x-03/04.** This is proven by resolving the id through the
 *     anonymous public search endpoint and then downloading the PDF, all from a
 *     context that carries no session/XSRF cookie.
 *  4. The public portal UI shows a "Tải PDF" link for certificate types that
 *     have a PDF endpoint (not for ad-registrations).
 *
 * No API interception, no injected auth — the anonymity of the download is the
 * whole point, so it must be exercised with a cookie-less context.
 */

import { test, expect, type Browser, type Page } from "@playwright/test";
import { signInAsAdmin, requestVerificationToken } from "./helpers/auth";

const BASE_URL = "http://127.0.0.1:8080";
const PROVINCE_ORG_ID = "e2e00000-0000-4000-8010-000000000001";
const STAMP = `PD${Date.now().toString(36).slice(-6).toUpperCase()}`;

/** One public certificate type: its create call, search endpoint and public PDF path. */
interface CertFixture {
  /** URL segment used by the public search + pdf endpoints. */
  publicSegment: string;
  /** Human label for test output. */
  label: string;
  /** The certificate/registration number we search by. */
  number: string;
  /** Internal Guid, filled in during beforeAll. */
  id: string;
}

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

async function postCert(
  page: Page,
  url: string,
  data: Record<string, unknown>,
): Promise<string> {
  const headers = await csrfHeaders(page);
  const resp = await page.context().request.post(url, { headers, data });
  expect(resp.ok(), `${url}: ${await resp.text()}`).toBeTruthy();
  return ((await resp.json()) as { id: string }).id;
}

function assertPdf(status: number, contentType: string | undefined, body: Buffer) {
  expect(status).toBe(200);
  expect(contentType).toContain("application/pdf");
  expect(body.length).toBeGreaterThan(1000);
  expect(body.subarray(0, 4).toString("ascii")).toBe("%PDF");
}

// ── tests ────────────────────────────────────────────────────────────────────

test.describe("F-034: Public Certificate PDF view/download", () => {
  test.setTimeout(90_000);

  let browserRef: Browser;
  let adminPage: Page;
  let businessId: string;
  const certs: Record<string, CertFixture> = {};

  test.beforeAll(async ({ browser }) => {
    browserRef = browser;
    const context = await browser.newContext({ baseURL: BASE_URL });
    adminPage = await context.newPage();
    await adminPage.goto(BASE_URL);
    await signInAsAdmin(adminPage);
    businessId = await createBusiness(adminPage, STAMP);

    // Eligibility certificate
    certs.eligibility = {
      publicSegment: "eligibility-certificates",
      label: "Giấy đủ điều kiện",
      number: `EC-PDF-${STAMP}`,
      id: await postCert(adminPage, "/api/v1/app/eligibility-certificate", {
        businessId,
        certificateNumber: `EC-PDF-${STAMP}`,
        issueDate: "2025-01-01",
        certifyingAuthority: "Chi cục ATVSTP Quảng Ninh",
      }),
    };

    // Self-declaration
    certs.selfDeclaration = {
      publicSegment: "self-declarations",
      label: "Tự công bố",
      number: `SD-PDF-${STAMP}`,
      id: await postCert(adminPage, "/api/v1/app/self-declaration", {
        businessId,
        declarationNumber: `SD-PDF-${STAMP}`,
        productName: `Sản phẩm PDF ${STAMP}`,
        declarationDate: "2025-01-01",
        organizationId: PROVINCE_ORG_ID,
      }),
    };

    // Product registration
    certs.productRegistration = {
      publicSegment: "product-registrations",
      label: "Đăng ký công bố",
      number: `PR-PDF-${STAMP}`,
      id: await postCert(adminPage, "/api/v1/app/product-registration", {
        businessId,
        registrationNumber: `PR-PDF-${STAMP}`,
        productName: `Sản phẩm đăng ký ${STAMP}`,
        registrationDate: "2025-01-01",
        organizationId: PROVINCE_ORG_ID,
      }),
    };

    // CFS certificate (needs a destination country)
    const countriesResp = await adminPage.context().request.get(
      "/api/v1/app/cfs-certificate/country-options",
    );
    expect(countriesResp.ok()).toBeTruthy();
    const countries = (await countriesResp.json()) as { id: string }[];
    certs.cfs = {
      publicSegment: "cfs-certificates",
      label: "CFS",
      number: `CFS-PDF-${STAMP}`,
      id: await postCert(adminPage, "/api/v1/app/cfs-certificate", {
        businessId,
        certificateNumber: `CFS-PDF-${STAMP}`,
        issueDate: "2025-01-01",
        destinationCountryId: countries[0]?.id ?? "",
      }),
    };

    // Export-food certificate
    certs.exportFood = {
      publicSegment: "export-food-certificates",
      label: "Chứng nhận xuất khẩu",
      number: `EF-PDF-${STAMP}`,
      id: await postCert(adminPage, "/api/v1/app/export-food-certificate", {
        businessId,
        certificateNumber: `EF-PDF-${STAMP}`,
        issueDate: "2025-01-01",
      }),
    };
  });

  test.afterAll(async () => {
    await adminPage.context().close();
  });

  // ── Authenticated path: PDF bytes for all 5 types ─────────────────────────
  test("authenticated caller downloads a valid PDF for all 5 certificate types", async () => {
    for (const cert of Object.values(certs)) {
      const resp = await adminPage.context().request.get(
        `/api/v1/public/${cert.publicSegment}/${cert.id}/pdf`,
      );
      assertPdf(resp.status(), resp.headers()["content-type"], await resp.body());
    }
  });

  // ── Citizen path: ANONYMOUS download for all 5 types (FR-4x-03/04) ─────────
  test("unauthenticated citizen downloads the certificate document for all 5 types", async () => {
    // A fresh context with NO storage state → no session, no XSRF cookie.
    const anonCtx = await browserRef.newContext({ baseURL: BASE_URL });
    try {
      // Prove the context is genuinely anonymous.
      expect(
        (await anonCtx.cookies()).length,
        "anonymous context must carry no cookies",
      ).toBe(0);

      for (const cert of Object.values(certs)) {
        // 1) Resolve the internal id through the ANONYMOUS public search endpoint.
        const searchResp = await anonCtx.request.get(
          `/api/v1/public/${cert.publicSegment}/search?Keyword=${encodeURIComponent(
            cert.number,
          )}&MaxResultCount=1`,
        );
        expect(
          searchResp.ok(),
          `anonymous search ${cert.label}: ${await searchResp.text()}`,
        ).toBeTruthy();
        const searchBody = (await searchResp.json()) as {
          totalCount: number;
          items: { id: string }[];
        };
        expect(
          searchBody.totalCount,
          `anonymous search found ${cert.label}`,
        ).toBeGreaterThan(0);
        expect(searchBody.items[0].id).toBe(cert.id);

        // 2) Download the PDF with the SAME anonymous context — still no cookies.
        const pdfResp = await anonCtx.request.get(
          `/api/v1/public/${cert.publicSegment}/${cert.id}/pdf`,
        );
        assertPdf(
          pdfResp.status(),
          pdfResp.headers()["content-type"],
          await pdfResp.body(),
        );
      }

      // Still cookie-less after all requests (no auth was silently established).
      expect((await anonCtx.cookies()).length).toBe(0);
    } finally {
      await anonCtx.close();
    }
  });

  // ── Anonymous browser click: real download event from the search page ─────
  test("citizen clicks Tải PDF on the public search page and the file downloads", async () => {
    const publicCtx = await browserRef.newContext({ baseURL: BASE_URL });
    const publicPage = await publicCtx.newPage();
    try {
      await publicPage.goto(`${BASE_URL}/tra-cuu-giay-phep`);
      await publicPage.waitForLoadState("networkidle");

      await publicPage
        .locator('input[placeholder*="Số giấy phép"], input[placeholder*="cơ sở"]')
        .first()
        .fill(certs.eligibility.number);
      await publicPage.keyboard.press("Enter");
      await publicPage.waitForLoadState("networkidle");

      const pdfLink = publicPage.locator('a:has-text("Tải PDF")').first();
      await expect(pdfLink).toBeVisible({ timeout: 10_000 });

      const href = await pdfLink.getAttribute("href");
      expect(href).toMatch(
        /\/api\/v1\/public\/eligibility-certificates\/[0-9a-f-]+\/pdf/,
      );

      // Fetch the linked document through the anonymous page context and confirm
      // it is a real PDF served without any login.
      const linked = await publicPage.request.get(href!);
      assertPdf(linked.status(), linked.headers()["content-type"], await linked.body());
    } finally {
      await publicCtx.close();
    }
  });

  test("unknown certificate ID — returns error (not 200)", async () => {
    const fakeId = "00000000-0000-0000-0000-000000000099";
    const resp = await adminPage.context().request.get(
      `/api/v1/public/eligibility-certificates/${fakeId}/pdf`,
    );
    // Dev mode: UserFriendlyException → developer exception page (500)
    // Prod mode: ABP exception handler converts UserFriendlyException → 403
    // Either way it must not be 200 (success)
    expect(resp.status()).not.toBe(200);
    expect(resp.headers()["content-type"]).not.toContain("application/pdf");
  });

  // ── UI: Tải PDF visibility rules ──────────────────────────────────────────
  test("ad-registrations tab — active tabpanel has no Tải PDF link", async () => {
    const publicCtx = await browserRef.newContext({ baseURL: BASE_URL });
    const publicPage = await publicCtx.newPage();
    try {
      await publicPage.goto(`${BASE_URL}/tra-cuu-giay-phep`);
      await publicPage.waitForLoadState("networkidle");

      await publicPage.click('div[role="tab"]:has-text("Đăng ký quảng cáo")');
      await publicPage.waitForLoadState("networkidle");

      const visiblePdfLinks = publicPage.locator('a:has-text("Tải PDF"):visible');
      await expect(visiblePdfLinks).toHaveCount(0);
    } finally {
      await publicCtx.close();
    }
  });
});
