/**
 * Public Lookup Verification (F-024..F-030)
 *
 * Tests all 7 public lookup features with real data:
 * - F-024 Business Lookup
 * - F-025 Self-Declaration Lookup
 * - F-026 Product Registration Lookup
 * - F-027 Eligibility Certificate Lookup
 * - F-028 CFS Certificate Lookup
 * - F-029 Export Food Certificate Lookup
 * - F-030 Advertisement Registration Lookup
 *
 * Strategy:
 * 1. Admin creates entity via authenticated API
 * 2. Anonymous client looks up the entity via public API
 * 3. UI lookup page renders result correctly
 * 4. Not-found case returns error message in UI
 * 5. No auth required (AllowAnonymous endpoints)
 */
import { expect, test, type Page } from "@playwright/test";
import { requestVerificationToken, signInAsAdmin } from "./helpers/auth";

const PROVINCE_ORG_ID = "e2e00000-0000-4000-8010-000000000001";
const STAMP = `PL${Date.now().toString(36).slice(-6).toUpperCase()}`;

async function csrfHeaders(page: Page) {
  return { RequestVerificationToken: await requestVerificationToken(page) };
}

async function createBusiness(
  page: Page,
  headers: Record<string, string>,
  suffix: string,
): Promise<{ id: string; code: string; name: string }> {
  const code = `PL-BIZ-${suffix}`;
  const res = await page.context().request.post("/api/v1/app/business", {
    headers,
    data: {
      organizationId: PROVINCE_ORG_ID,
      code,
      name: `Cơ sở tra cứu công khai ${suffix}`,
      productGroupIds: [],
    },
  });
  expect(res.ok(), `create business: ${await res.text()}`).toBeTruthy();
  const body = (await res.json()) as { id: string };
  return { id: body.id, code, name: `Cơ sở tra cứu công khai ${suffix}` };
}

async function createProduct(
  page: Page,
  headers: Record<string, string>,
  businessId: string,
  suffix: string,
): Promise<{ id: string }> {
  const res = await page.context().request.post("/api/v1/app/product", {
    headers,
    data: {
      businessId,
      code: `PL-SP-${suffix}`,
      name: `Sản phẩm tra cứu ${suffix}`,
    },
  });
  expect(res.ok(), `create product: ${await res.text()}`).toBeTruthy();
  return (await res.json()) as { id: string };
}

// ─── F-024: Business Lookup ────────────────────────────────────────────────

test.describe("public business lookup (F-024)", () => {
  test.setTimeout(60_000);

  test("anonymous access allowed — no auth required", async ({ request }) => {
    const res = await request.get(
      "/api/v1/public/businesses?keyword=NONEXISTENT",
      { maxRedirects: 0 },
    );
    // Not found → ABP UserFriendlyException maps to 403; NOT 401 (which would mean auth required)
    expect(res.status()).not.toBe(401);
    expect(res.status()).not.toBe(302);
    expect(res.ok()).toBeFalsy();
  });

  test("found by exact code (uppercase)", async ({ page }) => {
    await signInAsAdmin(page);
    const headers = await csrfHeaders(page);
    const suffix = `${STAMP}-B1`;
    const business = await createBusiness(page, headers, suffix);

    try {
      // Public API — no auth needed
      const res = await page.context().request.get(
        `/api/v1/public/businesses?keyword=${encodeURIComponent(business.code)}`,
        { maxRedirects: 0 },
      );
      expect(res.ok(), await res.text()).toBeTruthy();
      const body = (await res.json()) as { name: string; code: string };
      expect(body.name).toBe(business.name);
      expect(body.code).toBe(business.code);
    } finally {
      await page.context().request.delete(
        `/api/v1/app/business/${business.id}`,
        { headers, maxRedirects: 0 },
      );
    }
  });

  test("not found returns UserFriendlyException", async ({ request }) => {
    const res = await request.get(
      "/api/v1/public/businesses?keyword=NONEXISTENT-XXXXXX-99999",
      { maxRedirects: 0 },
    );
    // ABP UserFriendlyException → HTTP 403; not 401 (which would mean auth required)
    expect(res.ok()).toBeFalsy();
    expect(res.status()).not.toBe(401);
    expect(res.status()).not.toBe(302);
  });

  test("UI: lookup page renders, finds real data, shows not-found", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    const headers = await csrfHeaders(page);
    const suffix = `${STAMP}-B2`;
    const business = await createBusiness(page, headers, suffix);

    try {
      // Navigate as anonymous (new context)
      const anonCtx = await page.context().browser()!.newContext();
      const anon = await anonCtx.newPage();
      try {
        await anon.goto("/tra-cuu-co-so");
        await expect(
          anon.getByRole("heading", {
            name: /Tra cứu cơ sở sản xuất|Tra cứu cơ sở/i,
          }),
        ).toBeVisible({ timeout: 10_000 });

        // Successful lookup by code
        await anon
          .getByPlaceholder(/Tên cơ sở hoặc mã số|mã số/i)
          .first()
          .fill(business.code);
        await anon.getByRole("button", { name: "Tra cứu" }).click();
        await expect(anon.getByText(business.name)).toBeVisible({
          timeout: 10_000,
        });

        // Not-found lookup
        await anon
          .getByPlaceholder(/Tên cơ sở hoặc mã số|mã số/i)
          .first()
          .fill("NONEXISTENT-XXXXXX-99999");
        await anon.getByRole("button", { name: "Tra cứu" }).click();
        await expect(anon.getByText(/Không tìm thấy/i)).toBeVisible({
          timeout: 10_000,
        });
      } finally {
        await anonCtx.close();
      }
    } finally {
      await page.context().request.delete(
        `/api/v1/app/business/${business.id}`,
        { headers, maxRedirects: 0 },
      );
    }
  });
});

// ─── F-025: Self-Declaration Lookup ───────────────────────────────────────

test.describe("public self-declaration lookup (F-025)", () => {
  test.setTimeout(90_000);

  test("found by declaration number", async ({ page }) => {
    await signInAsAdmin(page);
    const headers = await csrfHeaders(page);
    const suffix = `${STAMP}-S1`;
    const business = await createBusiness(page, headers, suffix);
    const product = await createProduct(page, headers, business.id, suffix);
    const declNumber = `PL-TCB-${suffix}`;

    const declRes = await page.context().request.post(
      "/api/v1/app/self-declaration",
      {
        headers,
        data: {
          businessId: business.id,
          productId: product.id,
          declarationNumber: declNumber,
          declarationDate: "2026-07-01",
          productName: `Sản phẩm tự công bố ${suffix}`,
        },
      },
    );
    expect(declRes.ok(), `create self-declaration: ${await declRes.text()}`).toBeTruthy();
    const decl = (await declRes.json()) as { id: string };

    try {
      const res = await page.context().request.get(
        `/api/v1/public/self-declarations?number=${encodeURIComponent(declNumber)}`,
        { maxRedirects: 0 },
      );
      expect(res.ok(), await res.text()).toBeTruthy();
      const body = (await res.json()) as {
        declarationNumber: string;
        businessName: string;
      };
      expect(body.declarationNumber.toUpperCase()).toBe(
        declNumber.toUpperCase(),
      );
      expect(body.businessName).toBe(business.name);
    } finally {
      await page.context().request.delete(
        `/api/v1/app/self-declaration/${decl.id}`,
        { headers, maxRedirects: 0 },
      );
      await page.context().request.delete(
        `/api/v1/app/product/${product.id}`,
        { headers, maxRedirects: 0 },
      );
      await page.context().request.delete(
        `/api/v1/app/business/${business.id}`,
        { headers, maxRedirects: 0 },
      );
    }
  });

  test("not-found returns error", async ({ request }) => {
    const res = await request.get(
      "/api/v1/public/self-declarations?number=NONEXISTENT-XXXXXX-99999",
      { maxRedirects: 0 },
    );
    // ABP UserFriendlyException → HTTP 403; not 401 (which would mean auth required)
    expect(res.ok()).toBeFalsy();
    expect(res.status()).not.toBe(401);
    expect(res.status()).not.toBe(302);
  });

  test("UI: lookup page renders, finds real data, shows not-found", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    const headers = await csrfHeaders(page);
    const suffix = `${STAMP}-S2`;
    const business = await createBusiness(page, headers, suffix);
    const product = await createProduct(page, headers, business.id, suffix);
    const declNumber = `PL-TCB-${suffix}`;

    const declRes = await page.context().request.post(
      "/api/v1/app/self-declaration",
      {
        headers,
        data: {
          businessId: business.id,
          productId: product.id,
          declarationNumber: declNumber,
          declarationDate: "2026-07-01",
          productName: `Sản phẩm tự công bố ${suffix}`,
        },
      },
    );
    expect(declRes.ok(), await declRes.text()).toBeTruthy();
    const decl = (await declRes.json()) as { id: string };

    try {
      const anonCtx = await page.context().browser()!.newContext();
      const anon = await anonCtx.newPage();
      try {
        await anon.goto("/tra-cuu-tu-cong-bo");
        await expect(
          anon.getByRole("heading", { name: /Tra cứu tự công bố/i }),
        ).toBeVisible({ timeout: 10_000 });

        await anon
          .getByPlaceholder(/Số tự công bố/i)
          .fill(declNumber);
        await anon.getByRole("button", { name: "Tra cứu" }).click();
        await expect(anon.getByText(declNumber)).toBeVisible({
          timeout: 10_000,
        });

        await anon
          .getByPlaceholder(/Số tự công bố/i)
          .fill("NONEXISTENT-XXXXXX-99999");
        await anon.getByRole("button", { name: "Tra cứu" }).click();
        await expect(anon.getByText(/Không tìm thấy/i)).toBeVisible({
          timeout: 10_000,
        });
      } finally {
        await anonCtx.close();
      }
    } finally {
      await page.context().request.delete(
        `/api/v1/app/self-declaration/${decl.id}`,
        { headers, maxRedirects: 0 },
      );
      await page.context().request.delete(
        `/api/v1/app/product/${product.id}`,
        { headers, maxRedirects: 0 },
      );
      await page.context().request.delete(
        `/api/v1/app/business/${business.id}`,
        { headers, maxRedirects: 0 },
      );
    }
  });
});

// ─── F-026: Product Registration Lookup ───────────────────────────────────

test.describe("public product registration lookup (F-026)", () => {
  test.setTimeout(90_000);

  test("found by registration number", async ({ page }) => {
    await signInAsAdmin(page);
    const headers = await csrfHeaders(page);
    const suffix = `${STAMP}-PR1`;
    const business = await createBusiness(page, headers, suffix);
    const product = await createProduct(page, headers, business.id, suffix);
    const regNumber = `PL-DKCB-${suffix}`;

    const regRes = await page.context().request.post(
      "/api/v1/app/product-registration",
      {
        headers,
        data: {
          businessId: business.id,
          productId: product.id,
          registrationNumber: regNumber,
          registrationDate: "2026-07-01",
          productName: `Sản phẩm đăng ký ${suffix}`,
        },
      },
    );
    expect(regRes.ok(), `create product-registration: ${await regRes.text()}`).toBeTruthy();
    const reg = (await regRes.json()) as { id: string };

    try {
      const res = await page.context().request.get(
        `/api/v1/public/product-registrations?number=${encodeURIComponent(regNumber)}`,
        { maxRedirects: 0 },
      );
      expect(res.ok(), await res.text()).toBeTruthy();
      const body = (await res.json()) as {
        registrationNumber: string;
        businessName: string;
      };
      expect(body.registrationNumber.toUpperCase()).toBe(
        regNumber.toUpperCase(),
      );
      expect(body.businessName).toBe(business.name);
    } finally {
      await page.context().request.delete(
        `/api/v1/app/product-registration/${reg.id}`,
        { headers, maxRedirects: 0 },
      );
      await page.context().request.delete(
        `/api/v1/app/product/${product.id}`,
        { headers, maxRedirects: 0 },
      );
      await page.context().request.delete(
        `/api/v1/app/business/${business.id}`,
        { headers, maxRedirects: 0 },
      );
    }
  });

  test("not-found returns error", async ({ request }) => {
    const res = await request.get(
      "/api/v1/public/product-registrations?number=NONEXISTENT-XXXXXX-99999",
      { maxRedirects: 0 },
    );
    // ABP UserFriendlyException → HTTP 403; not 401 (which would mean auth required)
    expect(res.ok()).toBeFalsy();
    expect(res.status()).not.toBe(401);
    expect(res.status()).not.toBe(302);
  });

  test("UI: lookup page loads and shows not-found", async ({ page }) => {
    await page.goto("/tra-cuu-dang-ky-cong-bo");
    await expect(
      page.getByRole("heading", { name: /Tra cứu đăng ký công bố/i }),
    ).toBeVisible({ timeout: 10_000 });
    await page.getByPlaceholder(/Số đăng ký/i).fill("NONEXISTENT-99999");
    await page.getByRole("button", { name: "Tra cứu" }).click();
    await expect(page.getByText(/Không tìm thấy/i)).toBeVisible({
      timeout: 10_000,
    });
  });
});

// ─── F-027: Eligibility Certificate Lookup ────────────────────────────────

test.describe("public eligibility certificate lookup (F-027)", () => {
  test.setTimeout(90_000);

  test("found by certificate number", async ({ page }) => {
    await signInAsAdmin(page);
    const headers = await csrfHeaders(page);
    const suffix = `${STAMP}-EC1`;
    const business = await createBusiness(page, headers, suffix);
    const certNumber = `PL-DKV-${suffix}`;

    const certRes = await page.context().request.post(
      "/api/v1/app/eligibility-certificate",
      {
        headers,
        data: {
          businessId: business.id,
          certificateNumber: certNumber,
          issueDate: "2026-07-01",
          certifyingAuthority: "Chi cục ATVSTP Quảng Ninh",
        },
      },
    );
    expect(certRes.ok(), `create eligibility-certificate: ${await certRes.text()}`).toBeTruthy();
    const cert = (await certRes.json()) as { id: string };

    try {
      const res = await page.context().request.get(
        `/api/v1/public/eligibility-certificates?number=${encodeURIComponent(certNumber)}`,
        { maxRedirects: 0 },
      );
      expect(res.ok(), await res.text()).toBeTruthy();
      const body = (await res.json()) as {
        certificateNumber: string;
        businessName: string;
      };
      expect(body.certificateNumber.toUpperCase()).toBe(
        certNumber.toUpperCase(),
      );
      expect(body.businessName).toBe(business.name);
    } finally {
      await page.context().request.delete(
        `/api/v1/app/eligibility-certificate/${cert.id}`,
        { headers, maxRedirects: 0 },
      );
      await page.context().request.delete(
        `/api/v1/app/business/${business.id}`,
        { headers, maxRedirects: 0 },
      );
    }
  });

  test("not-found returns error", async ({ request }) => {
    const res = await request.get(
      "/api/v1/public/eligibility-certificates?number=NONEXISTENT-XXXXXX-99999",
      { maxRedirects: 0 },
    );
    // ABP UserFriendlyException → HTTP 403; not 401 (which would mean auth required)
    expect(res.ok()).toBeFalsy();
    expect(res.status()).not.toBe(401);
    expect(res.status()).not.toBe(302);
  });

  test("UI: lookup page loads and shows not-found", async ({ page }) => {
    await page.goto("/tra-cuu-giay-du-dieu-kien");
    await expect(
      page.getByRole("heading", { name: /Tra cứu giấy chứng nhận đủ điều kiện/i }),
    ).toBeVisible({ timeout: 10_000 });
    await page
      .getByPlaceholder(/Số giấy|chứng nhận/i)
      .first()
      .fill("NONEXISTENT-99999");
    await page.getByRole("button", { name: "Tra cứu" }).click();
    await expect(page.getByText(/Không tìm thấy/i)).toBeVisible({
      timeout: 10_000,
    });
  });
});

// ─── F-028: CFS Certificate Lookup ────────────────────────────────────────

test.describe("public CFS certificate lookup (F-028)", () => {
  test.setTimeout(90_000);

  test("found by certificate number", async ({ page }) => {
    await signInAsAdmin(page);
    const headers = await csrfHeaders(page);
    const suffix = `${STAMP}-CFS1`;
    const business = await createBusiness(page, headers, suffix);

    // Get a country from master catalog (seeded: countries exist)
    const countriesRes = await page.context().request.get(
      "/api/v1/app/master-catalog/countries?MaxResultCount=1",
    );
    expect(countriesRes.ok(), await countriesRes.text()).toBeTruthy();
    const countries = (await countriesRes.json()) as {
      items: { id: string }[];
    };
    expect(countries.items.length).toBeGreaterThan(0);
    const countryId = countries.items[0].id;

    const certNumber = `PL-CFS-${suffix}`;
    const certRes = await page.context().request.post(
      "/api/v1/app/cfs-certificate",
      {
        headers,
        data: {
          businessId: business.id,
          destinationCountryId: countryId,
          certificateNumber: certNumber,
          issueDate: "2026-07-01",
        },
      },
    );
    expect(certRes.ok(), `create cfs-certificate: ${await certRes.text()}`).toBeTruthy();
    const cert = (await certRes.json()) as { id: string };

    try {
      const res = await page.context().request.get(
        `/api/v1/public/cfs-certificates?number=${encodeURIComponent(certNumber)}`,
        { maxRedirects: 0 },
      );
      expect(res.ok(), await res.text()).toBeTruthy();
      const body = (await res.json()) as {
        certificateNumber: string;
        businessName: string;
      };
      expect(body.certificateNumber.toUpperCase()).toBe(
        certNumber.toUpperCase(),
      );
      expect(body.businessName).toBe(business.name);
    } finally {
      await page.context().request.delete(
        `/api/v1/app/cfs-certificate/${cert.id}`,
        { headers, maxRedirects: 0 },
      );
      await page.context().request.delete(
        `/api/v1/app/business/${business.id}`,
        { headers, maxRedirects: 0 },
      );
    }
  });

  test("not-found returns error", async ({ request }) => {
    const res = await request.get(
      "/api/v1/public/cfs-certificates?number=NONEXISTENT-XXXXXX-99999",
      { maxRedirects: 0 },
    );
    // ABP UserFriendlyException → HTTP 403; not 401 (which would mean auth required)
    expect(res.ok()).toBeFalsy();
    expect(res.status()).not.toBe(401);
    expect(res.status()).not.toBe(302);
  });

  test("UI: lookup page loads and shows not-found", async ({ page }) => {
    await page.goto("/tra-cuu-cfs");
    await expect(
      page.getByRole("heading", { name: /Tra cứu.*CFS/i }),
    ).toBeVisible({ timeout: 10_000 });
    await page.getByPlaceholder(/Số CFS/i).fill("NONEXISTENT-99999");
    await page.getByRole("button", { name: "Tra cứu" }).click();
    await expect(page.getByText(/Không tìm thấy/i)).toBeVisible({
      timeout: 10_000,
    });
  });
});

// ─── F-029: Export Food Certificate Lookup ────────────────────────────────

test.describe("public export food certificate lookup (F-029)", () => {
  test.setTimeout(90_000);

  test("found by certificate number", async ({ page }) => {
    await signInAsAdmin(page);
    const headers = await csrfHeaders(page);
    const suffix = `${STAMP}-XK1`;
    const business = await createBusiness(page, headers, suffix);
    const certNumber = `PL-XK-${suffix}`;

    const certRes = await page.context().request.post(
      "/api/v1/app/export-food-certificate",
      {
        headers,
        data: {
          businessId: business.id,
          certificateNumber: certNumber,
          issueDate: "2026-07-01",
        },
      },
    );
    expect(certRes.ok(), `create export-food-certificate: ${await certRes.text()}`).toBeTruthy();
    const cert = (await certRes.json()) as { id: string };

    try {
      const res = await page.context().request.get(
        `/api/v1/public/export-food-certificates?number=${encodeURIComponent(certNumber)}`,
        { maxRedirects: 0 },
      );
      expect(res.ok(), await res.text()).toBeTruthy();
      const body = (await res.json()) as {
        certificateNumber: string;
        businessName: string;
      };
      expect(body.certificateNumber.toUpperCase()).toBe(
        certNumber.toUpperCase(),
      );
      expect(body.businessName).toBe(business.name);
    } finally {
      await page.context().request.delete(
        `/api/v1/app/export-food-certificate/${cert.id}`,
        { headers, maxRedirects: 0 },
      );
      await page.context().request.delete(
        `/api/v1/app/business/${business.id}`,
        { headers, maxRedirects: 0 },
      );
    }
  });

  test("not-found returns error", async ({ request }) => {
    const res = await request.get(
      "/api/v1/public/export-food-certificates?number=NONEXISTENT-XXXXXX-99999",
      { maxRedirects: 0 },
    );
    // ABP UserFriendlyException → HTTP 403; not 401 (which would mean auth required)
    expect(res.ok()).toBeFalsy();
    expect(res.status()).not.toBe(401);
    expect(res.status()).not.toBe(302);
  });

  test("UI: lookup page loads and shows not-found", async ({ page }) => {
    await page.goto("/tra-cuu-gcn-xuat-khau");
    await expect(
      page.getByRole("heading", { name: /Tra cứu giấy chứng nhận xuất khẩu/i }),
    ).toBeVisible({ timeout: 10_000 });
    await page.getByPlaceholder(/Số GCN xuất khẩu/i).fill("NONEXISTENT-99999");
    await page.getByRole("button", { name: "Tra cứu" }).click();
    await expect(page.getByText(/Không tìm thấy/i)).toBeVisible({
      timeout: 10_000,
    });
  });
});

// ─── F-030: Advertisement Registration Lookup ─────────────────────────────

test.describe("public advertisement registration lookup (F-030)", () => {
  test.setTimeout(90_000);

  test("found by registration number", async ({ page }) => {
    await signInAsAdmin(page);
    const headers = await csrfHeaders(page);
    const suffix = `${STAMP}-AD1`;
    const business = await createBusiness(page, headers, suffix);
    const product = await createProduct(page, headers, business.id, suffix);
    const regNumber = `PL-QC-${suffix}`;

    const regRes = await page.context().request.post(
      "/api/v1/app/advertisement-registration",
      {
        headers,
        data: {
          businessId: business.id,
          productIds: [product.id],
          registrationNumber: regNumber,
          registrationDate: "2026-07-01",
          contentDescription: "Nội dung quảng cáo kiểm chứng E2E",
        },
      },
    );
    expect(regRes.ok(), `create advertisement-registration: ${await regRes.text()}`).toBeTruthy();
    const reg = (await regRes.json()) as { id: string };

    try {
      const res = await page.context().request.get(
        `/api/v1/public/advertisement-registrations?number=${encodeURIComponent(regNumber)}`,
        { maxRedirects: 0 },
      );
      expect(res.ok(), await res.text()).toBeTruthy();
      const body = (await res.json()) as {
        registrationNumber: string;
        businessName: string;
      };
      expect(body.registrationNumber.toUpperCase()).toBe(
        regNumber.toUpperCase(),
      );
      expect(body.businessName).toBe(business.name);
    } finally {
      await page.context().request.delete(
        `/api/v1/app/advertisement-registration/${reg.id}`,
        { headers, maxRedirects: 0 },
      );
      await page.context().request.delete(
        `/api/v1/app/product/${product.id}`,
        { headers, maxRedirects: 0 },
      );
      await page.context().request.delete(
        `/api/v1/app/business/${business.id}`,
        { headers, maxRedirects: 0 },
      );
    }
  });

  test("not-found returns error", async ({ request }) => {
    const res = await request.get(
      "/api/v1/public/advertisement-registrations?number=NONEXISTENT-XXXXXX-99999",
      { maxRedirects: 0 },
    );
    // ABP UserFriendlyException → HTTP 403; not 401 (which would mean auth required)
    expect(res.ok()).toBeFalsy();
    expect(res.status()).not.toBe(401);
    expect(res.status()).not.toBe(302);
  });

  test("UI: lookup page loads and shows not-found", async ({ page }) => {
    await page.goto("/tra-cuu-dang-ky-quang-cao");
    await expect(
      page.getByRole("heading", { name: /Tra cứu đăng ký quảng cáo/i }),
    ).toBeVisible({ timeout: 10_000 });
    await page.getByPlaceholder(/Số đăng ký/i).fill("NONEXISTENT-99999");
    await page.getByRole("button", { name: "Tra cứu" }).click();
    await expect(page.getByText(/Không tìm thấy/i)).toBeVisible({
      timeout: 10_000,
    });
  });
});
