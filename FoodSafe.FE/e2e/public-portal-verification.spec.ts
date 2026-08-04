/**
 * Public Portal Verification (FR-41 .. FR-49)
 *
 * Covers all sub-requirements of the public information portal:
 *   FR-41  — General directory search (business + product)
 *   FR-42  — Eligibility certificate search
 *   FR-43  — Self-declaration search
 *   FR-44  — Product registration search
 *   FR-45  — Warned businesses
 *   FR-46  — CFS certificate search
 *   FR-47  — Export-food certificate search
 *   FR-48  — Public news, public alerts, citizen alert submission
 *   FR-49  — Public administrative documents
 *
 * Strategy:
 *   1. Admin creates entities via authenticated API.
 *   2. Anonymous client verifies them via public (AllowAnonymous) API.
 *   3. UI smoke tests confirm each portal route loads without errors.
 *   4. No page.route() / MSW / fake auth used anywhere.
 */

import { expect, test, type Page } from "@playwright/test";
import { requestVerificationToken, signInAsAdmin } from "./helpers/auth";

const PROVINCE_ORG_ID = "e2e00000-0000-4000-8010-000000000001";
const STAMP = `PV${Date.now().toString(36).slice(-6).toUpperCase()}`;

async function csrfHeaders(page: Page) {
  return { RequestVerificationToken: await requestVerificationToken(page) };
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

async function createBusiness(
  page: Page,
  headers: Record<string, string>,
  code: string,
  name: string,
): Promise<string> {
  const res = await page.context().request.post("/api/v1/app/business", {
    headers,
    data: { organizationId: PROVINCE_ORG_ID, code, name, productGroupIds: [] },
  });
  expect(res.ok(), `createBusiness: ${await res.text()}`).toBeTruthy();
  return ((await res.json()) as { id: string }).id;
}

async function deleteBusiness(page: Page, headers: Record<string, string>, id: string) {
  await page.context().request.delete(`/api/v1/app/business/${id}`, { headers, maxRedirects: 0 });
}

async function createProduct(
  page: Page,
  headers: Record<string, string>,
  businessId: string,
  code: string,
  name: string,
): Promise<string> {
  const res = await page.context().request.post("/api/v1/app/product", {
    headers,
    data: { businessId, code, name },
  });
  expect(res.ok(), `createProduct: ${await res.text()}`).toBeTruthy();
  return ((await res.json()) as { id: string }).id;
}

// ─── FR-41: General Directory Search ─────────────────────────────────────────

test.describe("FR-41: general directory search (business + product)", () => {
  test.setTimeout(90_000);

  test("anonymous access: business search returns matching records", async ({ page }) => {
    await signInAsAdmin(page);
    const headers = await csrfHeaders(page);
    const code = `PPV-BZ-${STAMP}`;
    const name = `Cơ sở tra cứu chung ${STAMP}`;
    const bizId = await createBusiness(page, headers, code, name);

    try {
      const anonCtx = await page.context().browser()!.newContext();
      try {
        // Search by name substring
        const res = await anonCtx.request.get(
          `/api/v1/public/businesses/search?Keyword=${encodeURIComponent(STAMP)}&MaxResultCount=20`,
          { maxRedirects: 0 },
        );
        expect(res.status()).not.toBe(401);
        expect(res.ok(), await res.text()).toBeTruthy();
        const body = (await res.json()) as { totalCount: number; items: { name: string; code: string }[] };
        expect(body.items.some(b => b.name === name)).toBeTruthy();
        expect(body.items.some(b => b.code === code)).toBeTruthy();
      } finally {
        await anonCtx.close();
      }
    } finally {
      await deleteBusiness(page, headers, bizId);
    }
  });

  test("anonymous access: product search returns matching records", async ({ page }) => {
    await signInAsAdmin(page);
    const headers = await csrfHeaders(page);
    const bCode = `PPV-BZP-${STAMP}`;
    const bName = `Cơ sở SP công khai ${STAMP}`;
    const pCode = `PPV-SP-${STAMP}`;
    const pName = `Sản phẩm tra cứu ${STAMP}`;
    const bizId = await createBusiness(page, headers, bCode, bName);
    const prodId = await createProduct(page, headers, bizId, pCode, pName);

    try {
      const anonCtx = await page.context().browser()!.newContext();
      try {
        const res = await anonCtx.request.get(
          `/api/v1/public/products/search?Keyword=${encodeURIComponent(pName)}&MaxResultCount=20`,
          { maxRedirects: 0 },
        );
        expect(res.status()).not.toBe(401);
        expect(res.ok(), await res.text()).toBeTruthy();
        const body = (await res.json()) as { totalCount: number; items: { name: string; code: string }[] };
        expect(body.items.some(p => p.name === pName)).toBeTruthy();
      } finally {
        await anonCtx.close();
      }
    } finally {
      await page.context().request.delete(`/api/v1/app/product/${prodId}`, { headers, maxRedirects: 0 });
      await deleteBusiness(page, headers, bizId);
    }
  });

  test("UI: /tra-cuu-chung loads with business and product tabs", async ({ page }) => {
    await page.goto("/tra-cuu-chung");
    await expect(page.locator("h1, h2, .ant-typography").first()).toBeVisible({ timeout: 10_000 });
    // Tabs for business and product should be present
    await expect(page.getByRole("tab").filter({ hasText: /cơ sở|doanh nghiệp/i }).first()).toBeVisible();
  });

  test("empty keyword returns all records (paginated)", async ({ request }) => {
    const res = await request.get("/api/v1/public/businesses/search?MaxResultCount=1", { maxRedirects: 0 });
    expect(res.status()).not.toBe(401);
    const body = (await res.json()) as { totalCount: number; items: unknown[] };
    expect(body.items).toBeDefined();
  });
});

// ─── FR-42..FR-44, FR-46..FR-47: Certificate/Declaration/Registration Search ──

test.describe("FR-42..FR-47: certificate and registration search endpoints", () => {
  test.setTimeout(120_000);

  test("FR-42: eligibility certificate search by number (anonymous)", async ({ page }) => {
    await signInAsAdmin(page);
    const headers = await csrfHeaders(page);
    const bizId = await createBusiness(page, headers, `PPV-EC-${STAMP}`, `Cơ sở ĐKDK ${STAMP}`);
    const certNumber = `PPV-EC-${STAMP}`;

    const certRes = await page.context().request.post("/api/v1/app/eligibility-certificate", {
      headers,
      data: { businessId: bizId, certificateNumber: certNumber, issueDate: "2026-07-01", certifyingAuthority: "Chi cục ATVSTP" },
    });
    expect(certRes.ok(), await certRes.text()).toBeTruthy();
    const certId = ((await certRes.json()) as { id: string }).id;

    try {
      const anonCtx = await page.context().browser()!.newContext();
      try {
        const res = await anonCtx.request.get(
          `/api/v1/public/eligibility-certificates/search?Keyword=${encodeURIComponent(certNumber)}&MaxResultCount=10`,
          { maxRedirects: 0 },
        );
        expect(res.status()).not.toBe(401);
        expect(res.ok(), await res.text()).toBeTruthy();
        const body = (await res.json()) as { items: { number: string }[] };
        expect(body.items.some(c => c.number === certNumber)).toBeTruthy();
      } finally {
        await anonCtx.close();
      }
    } finally {
      await page.context().request.delete(`/api/v1/app/eligibility-certificate/${certId}`, { headers, maxRedirects: 0 });
      await deleteBusiness(page, headers, bizId);
    }
  });

  test("FR-43: self-declaration search by number (anonymous)", async ({ page }) => {
    await signInAsAdmin(page);
    const headers = await csrfHeaders(page);
    const bizId = await createBusiness(page, headers, `PPV-SD-${STAMP}`, `Cơ sở TCB ${STAMP}`);
    const prodId = await createProduct(page, headers, bizId, `PPV-SD-SP-${STAMP}`, `Sản phẩm TCB ${STAMP}`);
    const declNumber = `PPV-SD-${STAMP}`;

    const declRes = await page.context().request.post("/api/v1/app/self-declaration", {
      headers,
      data: { businessId: bizId, productId: prodId, declarationNumber: declNumber, declarationDate: "2026-07-01", productName: `SP TCB ${STAMP}` },
    });
    expect(declRes.ok(), await declRes.text()).toBeTruthy();
    const declId = ((await declRes.json()) as { id: string }).id;

    try {
      const anonCtx = await page.context().browser()!.newContext();
      try {
        const res = await anonCtx.request.get(
          `/api/v1/public/self-declarations/search?Keyword=${encodeURIComponent(declNumber)}&MaxResultCount=10`,
          { maxRedirects: 0 },
        );
        expect(res.status()).not.toBe(401);
        expect(res.ok(), await res.text()).toBeTruthy();
        const body = (await res.json()) as { items: { number: string }[] };
        expect(body.items.some(d => d.number === declNumber)).toBeTruthy();
      } finally {
        await anonCtx.close();
      }
    } finally {
      await page.context().request.delete(`/api/v1/app/self-declaration/${declId}`, { headers, maxRedirects: 0 });
      await page.context().request.delete(`/api/v1/app/product/${prodId}`, { headers, maxRedirects: 0 });
      await deleteBusiness(page, headers, bizId);
    }
  });

  test("FR-44: product registration search by number (anonymous)", async ({ page }) => {
    await signInAsAdmin(page);
    const headers = await csrfHeaders(page);
    const bizId = await createBusiness(page, headers, `PPV-PR-${STAMP}`, `Cơ sở DKCB ${STAMP}`);
    const prodId = await createProduct(page, headers, bizId, `PPV-PR-SP-${STAMP}`, `Sản phẩm DKCB ${STAMP}`);
    const regNumber = `PPV-PR-${STAMP}`;

    const regRes = await page.context().request.post("/api/v1/app/product-registration", {
      headers,
      data: { businessId: bizId, productId: prodId, registrationNumber: regNumber, registrationDate: "2026-07-01", productName: `SP DKCB ${STAMP}` },
    });
    expect(regRes.ok(), await regRes.text()).toBeTruthy();
    const regId = ((await regRes.json()) as { id: string }).id;

    try {
      const anonCtx = await page.context().browser()!.newContext();
      try {
        const res = await anonCtx.request.get(
          `/api/v1/public/product-registrations/search?Keyword=${encodeURIComponent(regNumber)}&MaxResultCount=10`,
          { maxRedirects: 0 },
        );
        expect(res.status()).not.toBe(401);
        expect(res.ok(), await res.text()).toBeTruthy();
        const body = (await res.json()) as { items: { number: string }[] };
        expect(body.items.some(r => r.number === regNumber)).toBeTruthy();
      } finally {
        await anonCtx.close();
      }
    } finally {
      await page.context().request.delete(`/api/v1/app/product-registration/${regId}`, { headers, maxRedirects: 0 });
      await page.context().request.delete(`/api/v1/app/product/${prodId}`, { headers, maxRedirects: 0 });
      await deleteBusiness(page, headers, bizId);
    }
  });

  test("FR-46: CFS certificate search by number (anonymous)", async ({ page }) => {
    await signInAsAdmin(page);
    const headers = await csrfHeaders(page);
    const bizId = await createBusiness(page, headers, `PPV-CFS-${STAMP}`, `Cơ sở CFS ${STAMP}`);

    const countryRes = await page.context().request.get("/api/v1/app/cfs-certificate/country-options");
    expect(countryRes.ok(), await countryRes.text()).toBeTruthy();
    const countries = (await countryRes.json()) as { id: string }[];
    expect(countries.length).toBeGreaterThan(0);

    const certNumber = `PPV-CFS-${STAMP}`;
    const cfsRes = await page.context().request.post("/api/v1/app/cfs-certificate", {
      headers,
      data: { businessId: bizId, destinationCountryId: countries[0].id, certificateNumber: certNumber, issueDate: "2026-07-01" },
    });
    expect(cfsRes.ok(), await cfsRes.text()).toBeTruthy();
    const cfsId = ((await cfsRes.json()) as { id: string }).id;

    try {
      const anonCtx = await page.context().browser()!.newContext();
      try {
        const res = await anonCtx.request.get(
          `/api/v1/public/cfs-certificates/search?Keyword=${encodeURIComponent(certNumber)}&MaxResultCount=10`,
          { maxRedirects: 0 },
        );
        expect(res.status()).not.toBe(401);
        expect(res.ok(), await res.text()).toBeTruthy();
        const body = (await res.json()) as { items: { number: string }[] };
        expect(body.items.some(c => c.number === certNumber)).toBeTruthy();
      } finally {
        await anonCtx.close();
      }
    } finally {
      await page.context().request.delete(`/api/v1/app/cfs-certificate/${cfsId}`, { headers, maxRedirects: 0 });
      await deleteBusiness(page, headers, bizId);
    }
  });

  test("FR-47: export-food certificate search by number (anonymous)", async ({ page }) => {
    await signInAsAdmin(page);
    const headers = await csrfHeaders(page);
    const bizId = await createBusiness(page, headers, `PPV-XK-${STAMP}`, `Cơ sở XK ${STAMP}`);
    const certNumber = `PPV-XK-${STAMP}`;

    const certRes = await page.context().request.post("/api/v1/app/export-food-certificate", {
      headers,
      data: { businessId: bizId, certificateNumber: certNumber, issueDate: "2026-07-01" },
    });
    expect(certRes.ok(), await certRes.text()).toBeTruthy();
    const certId = ((await certRes.json()) as { id: string }).id;

    try {
      const anonCtx = await page.context().browser()!.newContext();
      try {
        const res = await anonCtx.request.get(
          `/api/v1/public/export-food-certificates/search?Keyword=${encodeURIComponent(certNumber)}&MaxResultCount=10`,
          { maxRedirects: 0 },
        );
        expect(res.status()).not.toBe(401);
        expect(res.ok(), await res.text()).toBeTruthy();
        const body = (await res.json()) as { items: { number: string }[] };
        expect(body.items.some(c => c.number === certNumber)).toBeTruthy();
      } finally {
        await anonCtx.close();
      }
    } finally {
      await page.context().request.delete(`/api/v1/app/export-food-certificate/${certId}`, { headers, maxRedirects: 0 });
      await deleteBusiness(page, headers, bizId);
    }
  });

  test("UI: /tra-cuu-giay-phep loads with certificate type tabs", async ({ page }) => {
    await page.goto("/tra-cuu-giay-phep");
    await expect(page.locator("h1, h2, .ant-typography").first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole("tab").first()).toBeVisible({ timeout: 5_000 });
  });
});

// ─── FR-45: Warned Businesses ─────────────────────────────────────────────────

test.describe("FR-45: warned businesses", () => {
  test.setTimeout(90_000);

  test("published alert with businessId appears in warned-businesses list (anonymous)", async ({ page }) => {
    await signInAsAdmin(page);
    const headers = await csrfHeaders(page);
    const bizId = await createBusiness(page, headers, `PPV-WB-${STAMP}`, `Cơ sở bị cảnh báo ${STAMP}`);

    const alertTitle = `Cảnh báo cơ sở PPV ${STAMP}`;
    const alertRes = await page.context().request.post("/api/v1/app/atp-alert", {
      headers,
      data: { title: alertTitle, content: "Nội dung cảnh báo.", category: 1, severity: 2, source: 1, businessId: bizId },
    });
    expect(alertRes.ok(), await alertRes.text()).toBeTruthy();
    const alertId = ((await alertRes.json()) as { id: string }).id;

    const publishRes = await page.context().request.post(`/api/v1/app/atp-alert/${alertId}/publish`, {
      headers,
      data: { isPublic: true },
    });
    expect(publishRes.ok(), await publishRes.text()).toBeTruthy();

    try {
      const anonCtx = await page.context().browser()!.newContext();
      try {
        const res = await anonCtx.request.get(
          `/api/v1/public/warned-businesses?Keyword=${encodeURIComponent(STAMP)}&MaxResultCount=20`,
          { maxRedirects: 0 },
        );
        expect(res.status()).not.toBe(401);
        expect(res.ok(), await res.text()).toBeTruthy();
        const body = (await res.json()) as { items: { businessName: string; alertTitle: string }[] };
        expect(body.items.some(r => r.alertTitle === alertTitle)).toBeTruthy();
      } finally {
        await anonCtx.close();
      }
    } finally {
      // recall then delete
      await page.context().request.post(`/api/v1/app/atp-alert/${alertId}/recall`, {
        headers,
        data: { reason: "Xóa dữ liệu kiểm thử" },
        maxRedirects: 0,
      });
      await page.context().request.delete(`/api/v1/app/atp-alert/${alertId}`, { headers, maxRedirects: 0 });
      await deleteBusiness(page, headers, bizId);
    }
  });

  test("UI: /co-so-bi-canh-bao loads with table or empty state", async ({ page }) => {
    await page.goto("/co-so-bi-canh-bao");
    await expect(page.locator("h1, h2, .ant-typography").first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator(".ant-table, .ant-empty").first()).toBeVisible({ timeout: 10_000 });
  });
});

// ─── FR-48: Public News, Alerts, Citizen Alert Submission ────────────────────

test.describe("FR-48: public news, alerts, and citizen submission", () => {
  test.setTimeout(120_000);

  test("published+isPublic news appears in public list; draft does not", async ({ page }) => {
    await signInAsAdmin(page);
    const headers = await csrfHeaders(page);
    const req = page.context().request;

    const pubTitle = `Tin công khai PPV ${STAMP}`;
    const draftTitle = `Tin nháp PPV ${STAMP}`;

    const pubRes = await req.post("/api/v1/app/atp-news", {
      headers,
      data: { title: pubTitle, content: "Nội dung tin công khai E2E." },
    });
    expect(pubRes.ok(), await pubRes.text()).toBeTruthy();
    const pubId = ((await pubRes.json()) as { id: string }).id;

    await req.post(`/api/v1/app/atp-news/${pubId}/publish`, { headers, data: { isPublic: true } });

    const draftRes = await req.post("/api/v1/app/atp-news", {
      headers,
      data: { title: draftTitle, content: "Nội dung tin nháp." },
    });
    expect(draftRes.ok()).toBeTruthy();
    const draftId = ((await draftRes.json()) as { id: string }).id;

    try {
      const anonCtx = await page.context().browser()!.newContext();
      try {
        const listRes = await anonCtx.request.get(
          `/api/v1/public/news?Keyword=${encodeURIComponent(STAMP)}&MaxResultCount=50`,
          { maxRedirects: 0 },
        );
        expect(listRes.status()).not.toBe(401);
        expect(listRes.ok(), await listRes.text()).toBeTruthy();
        const body = (await listRes.json()) as { items: { title: string; id: string }[] };

        expect(body.items.some(n => n.title === pubTitle)).toBeTruthy();
        expect(body.items.some(n => n.title === draftTitle)).toBeFalsy();

        // News detail endpoint works and returns content
        const found = body.items.find(n => n.title === pubTitle)!;
        const detailRes = await anonCtx.request.get(`/api/v1/public/news/${found.id}`, { maxRedirects: 0 });
        expect(detailRes.ok(), await detailRes.text()).toBeTruthy();
        const detail = (await detailRes.json()) as { title: string; content: string; viewCount: number };
        expect(detail.title).toBe(pubTitle);
        expect(typeof detail.viewCount).toBe("number");
      } finally {
        await anonCtx.close();
      }
    } finally {
      await req.delete(`/api/v1/app/atp-news/${pubId}`, { headers, maxRedirects: 0 });
      await req.delete(`/api/v1/app/atp-news/${draftId}`, { headers, maxRedirects: 0 });
    }
  });

  test("published+isPublic alert appears in public list; draft does not", async ({ page }) => {
    await signInAsAdmin(page);
    const headers = await csrfHeaders(page);
    const req = page.context().request;

    const pubTitle = `Cảnh báo công khai PPV ${STAMP}`;
    const draftTitle = `Cảnh báo nháp PPV ${STAMP}`;

    const pubRes = await req.post("/api/v1/app/atp-alert", {
      headers,
      data: { title: pubTitle, content: "Nội dung cảnh báo.", category: 1, severity: 2, source: 1 },
    });
    expect(pubRes.ok(), await pubRes.text()).toBeTruthy();
    const pubId = ((await pubRes.json()) as { id: string }).id;
    await req.post(`/api/v1/app/atp-alert/${pubId}/publish`, { headers, data: { isPublic: true } });

    const draftRes = await req.post("/api/v1/app/atp-alert", {
      headers,
      data: { title: draftTitle, content: "Cảnh báo nháp.", category: 1, severity: 1, source: 1 },
    });
    expect(draftRes.ok()).toBeTruthy();
    const draftId = ((await draftRes.json()) as { id: string }).id;

    try {
      const anonCtx = await page.context().browser()!.newContext();
      try {
        const listRes = await anonCtx.request.get(
          `/api/v1/public/alerts?Keyword=${encodeURIComponent(STAMP)}&MaxResultCount=50`,
          { maxRedirects: 0 },
        );
        expect(listRes.status()).not.toBe(401);
        expect(listRes.ok(), await listRes.text()).toBeTruthy();
        const body = (await listRes.json()) as { items: { title: string }[] };
        expect(body.items.some(a => a.title === pubTitle)).toBeTruthy();
        expect(body.items.some(a => a.title === draftTitle)).toBeFalsy();
      } finally {
        await anonCtx.close();
      }
    } finally {
      await req.post(`/api/v1/app/atp-alert/${pubId}/recall`, { headers, data: { reason: "Dọn dữ liệu test" }, maxRedirects: 0 });
      await req.delete(`/api/v1/app/atp-alert/${pubId}`, { headers, maxRedirects: 0 });
      await req.delete(`/api/v1/app/atp-alert/${draftId}`, { headers, maxRedirects: 0 });
    }
  });

  test("citizen alert submission via API (captcha bypass with test token) creates Draft with source=PublicReport", async ({ page }) => {
    // In non-production, any non-empty captchaToken string passes because the test
    // Cloudflare secret (1x0000...AA) always returns success:true for any token.
    const title = `Phản ánh công dân PPV ${STAMP}`;

    const anonCtx = await page.context().browser()!.newContext();
    try {
      // Prime the XSRF cookie first (required for POST)
      await anonCtx.request.get("/abp/application-configuration");

      const xsrfCookie = (await anonCtx.cookies()).find(c => c.name === "XSRF-TOKEN");
      const xsrfToken = xsrfCookie ? decodeURIComponent(xsrfCookie.value) : "";

      const submitRes = await anonCtx.request.post("/api/v1/public/alert-reports", {
        headers: xsrfToken ? { RequestVerificationToken: xsrfToken } : {},
        data: {
          title,
          content: "Phát hiện thực phẩm không đảm bảo vệ sinh tại chợ.",
          category: 6,
          captchaToken: "e2e-test-bypass-token",
        },
        maxRedirects: 0,
      });
      expect(submitRes.ok(), `citizen submit failed: ${await submitRes.text()}`).toBeTruthy();
      const result = (await submitRes.json()) as { id: string; message?: string };
      expect(result.id).toBeTruthy();
    } finally {
      await anonCtx.close();
    }

    // Officer confirms the submitted alert appears as Draft with source=2 (PublicReport)
    await signInAsAdmin(page);
    const listRes = await page.context().request.get("/api/v1/app/atp-alert?MaxResultCount=50");
    expect(listRes.ok(), await listRes.text()).toBeTruthy();
    const alerts = (await listRes.json()) as { items: { title: string; source: number; status: number }[] };
    const found = alerts.items.find(a => a.title === title);
    expect(found, "created alert not found in admin list").toBeTruthy();
    expect(found!.source).toBe(2); // AlertSource.PublicReport
    expect(found!.status).toBe(1); // AlertStatus.Draft

    // Cleanup
    const headers = await csrfHeaders(page);
    const detail = await page.context().request.get(`/api/v1/app/atp-alert?Filter=${encodeURIComponent(title)}&MaxResultCount=5`);
    if (detail.ok()) {
      const data = (await detail.json()) as { items: { id: string; title: string }[] };
      const alertToDelete = data.items.find(a => a.title === title);
      if (alertToDelete) {
        await page.context().request.delete(`/api/v1/app/atp-alert/${alertToDelete.id}`, { headers, maxRedirects: 0 });
      }
    }
  });

  test("submission without captchaToken is rejected (400)", async ({ request }) => {
    await request.get("/abp/application-configuration"); // prime XSRF
    const res = await request.post("/api/v1/public/alert-reports", {
      maxRedirects: 0,
      data: { title: "Thiếu captcha", content: "Không có token.", category: 6, captchaToken: "" },
    });
    expect([400, 403]).toContain(res.status());
  });

  test("UI: /tin-tuc news page loads", async ({ page }) => {
    await page.goto("/tin-tuc");
    await expect(page.locator("h1, h2, .ant-typography").first()).toBeVisible({ timeout: 10_000 });
  });

  test("UI: /gui-phan-anh citizen submission form loads", async ({ page }) => {
    await page.goto("/gui-phan-anh");
    await expect(page.locator("form, .ant-form").first()).toBeVisible({ timeout: 10_000 });
  });
});

// ─── FR-49: Public Administrative Documents ───────────────────────────────────

test.describe("FR-49: public administrative documents", () => {
  test.setTimeout(90_000);

  test("isPublic+active document appears in public list; non-public does not", async ({ page }) => {
    await signInAsAdmin(page);
    const headers = await csrfHeaders(page);
    const req = page.context().request;

    // Create a document type
    const typeRes = await req.post("/api/v1/app/master-catalog/document-type", {
      headers,
      data: { code: `VB-PPV-${STAMP}`, name: `Loại VB PPV ${STAMP}`, sortOrder: 1, isActive: true },
    });
    expect(typeRes.ok(), await typeRes.text()).toBeTruthy();
    const docTypeId = ((await typeRes.json()) as { id: string }).id;

    const pubDocNumber = `PPV-VB-PUB-${STAMP}`;
    const privDocNumber = `PPV-VB-PRIV-${STAMP}`;

    const pubDocRes = await req.post("/api/v1/app/administrative-document", {
      headers,
      data: {
        documentTypeId: docTypeId,
        documentNumber: pubDocNumber,
        title: `Văn bản công khai PPV ${STAMP}`,
        issuedDate: "2026-07-01T00:00:00Z",
        status: 1,
        isPublic: true,
      },
    });
    expect(pubDocRes.ok(), await pubDocRes.text()).toBeTruthy();
    const pubDocId = ((await pubDocRes.json()) as { id: string }).id;

    const privDocRes = await req.post("/api/v1/app/administrative-document", {
      headers,
      data: {
        documentTypeId: docTypeId,
        documentNumber: privDocNumber,
        title: `Văn bản nội bộ PPV ${STAMP}`,
        issuedDate: "2026-07-01T00:00:00Z",
        status: 1,
        isPublic: false,
      },
    });
    expect(privDocRes.ok(), await privDocRes.text()).toBeTruthy();
    const privDocId = ((await privDocRes.json()) as { id: string }).id;

    try {
      const anonCtx = await page.context().browser()!.newContext();
      try {
        const listRes = await anonCtx.request.get(
          `/api/v1/public/documents?Keyword=${encodeURIComponent(STAMP)}&MaxResultCount=20`,
          { maxRedirects: 0 },
        );
        expect(listRes.status()).not.toBe(401);
        expect(listRes.ok(), await listRes.text()).toBeTruthy();
        const body = (await listRes.json()) as { items: { documentNumber: string }[] };
        expect(body.items.some(d => d.documentNumber === pubDocNumber)).toBeTruthy();
        expect(body.items.some(d => d.documentNumber === privDocNumber)).toBeFalsy();
      } finally {
        await anonCtx.close();
      }
    } finally {
      await req.delete(`/api/v1/app/administrative-document/${pubDocId}`, { headers, maxRedirects: 0 });
      await req.delete(`/api/v1/app/administrative-document/${privDocId}`, { headers, maxRedirects: 0 });
      await req.delete(`/api/v1/app/master-catalog/${docTypeId}/document-type`, { headers, maxRedirects: 0 });
    }
  });

  test("UI: /tra-cuu-van-ban documents page loads with search box", async ({ page }) => {
    await page.goto("/tra-cuu-van-ban");
    await expect(page.locator("h1, h2, .ant-typography").first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator(".ant-table, .ant-empty, input[placeholder]").first()).toBeVisible({ timeout: 10_000 });
  });
});

// ─── Portal home and navigation ───────────────────────────────────────────────

test.describe("portal home and navigation", () => {
  test.setTimeout(30_000);

  test("/cong-thong-tin: portal home links to all public routes", async ({ page }) => {
    await page.goto("/cong-thong-tin");
    await expect(page.locator("h1, h2, .ant-typography").filter({ hasText: /An toàn thực phẩm|cổng thông tin/i }).first()).toBeVisible({ timeout: 10_000 });
    for (const path of [
      "/tra-cuu-chung",
      "/tra-cuu-giay-phep",
      // Renamed from /co-so-bi-canh-bao in the portal redesign.
      "/danh-sach-canh-bao",
      "/tin-tuc",
      "/tra-cuu-van-ban",
      "/gui-phan-anh",
    ]) {
      await expect(page.locator(`a[href="${path}"]`).first()).toBeVisible();
    }
  });
});
