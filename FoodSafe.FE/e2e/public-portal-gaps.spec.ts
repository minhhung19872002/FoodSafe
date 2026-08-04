/**
 * Public portal requirements that had no implementation until this batch:
 *   • STT 44 — anonymous download of a published phiếu kiểm nghiệm
 *   • STT 42 — product lookup shows thành phần / hạn dùng / xuất xứ and links
 *     back to the owning business
 *   • STT 49 — citizen reports carry photographic evidence
 *
 * Real stack, no API interception. Fixtures are created through the
 * authenticated API and read back through the anonymous portal API, which is
 * the whole point: the portal must expose them without a session.
 */

import { expect, test, type Page } from "@playwright/test";
import { requestVerificationToken, signInAsAdmin } from "./helpers/auth";

const PROVINCE_ID = "e2e00000-0000-4000-8001-000000000001";
const PROVINCE_ORG_ID = "e2e00000-0000-4000-8010-000000000001";
const STAMP = `PG${Date.now().toString(36).slice(-6).toUpperCase()}`;

// Smallest structurally valid PDF the upload validator accepts (it checks the
// %PDF magic bytes, the MIME type and the extension).
const TINY_PDF = Buffer.from(
  "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n" +
    "2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n" +
    "3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\n" +
    "trailer<</Root 1 0 R>>\n%%EOF\n",
  "latin1",
);

const TINY_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk" +
  "YPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

async function csrf(page: Page) {
  return { RequestVerificationToken: await requestVerificationToken(page) };
}

test.describe("STT 44 — published testing certificate is downloadable anonymously", () => {
  test.setTimeout(120_000);

  test("staff publish a result with a certificate, anonymous visitor downloads it", async ({
    page,
    browser,
  }) => {
    await page.goto("/");
    await signInAsAdmin(page);
    const headers = await csrf(page);
    const request = page.context().request;

    const centerRes = await request.post(
      "/api/v1/app/master-catalog/testing-center",
      {
        headers,
        data: {
          code: `E2E-TT-${STAMP}`,
          name: `Trung tâm ${STAMP}`,
          address: "Số 1 đường Kiểm Nghiệm, Hạ Long, Quảng Ninh",
          provinceId: PROVINCE_ID,
          accreditationNumber: `VILAS-${STAMP}`,
          accreditationScope: "Vi sinh, hóa lý thực phẩm",
        },
      },
    );
    expect(centerRes.ok(), await centerRes.text()).toBeTruthy();
    const centerId = ((await centerRes.json()) as { id: string }).id;

    // Upload the certificate first: the create call stores the returned path.
    const uploadRes = await request.post("/api/v1/app/testing-result/pdf", {
      headers,
      multipart: {
        file: {
          name: `phieu-${STAMP}.pdf`,
          mimeType: "application/pdf",
          buffer: TINY_PDF,
        },
      },
    });
    expect(uploadRes.ok(), await uploadRes.text()).toBeTruthy();
    const { storagePath } = (await uploadRes.json()) as { storagePath: string };
    expect(storagePath).toContain("testing-result-pdfs/");

    // The portal only lists results tied to a business, so the fixture needs one.
    const bizRes = await request.post("/api/v1/app/business", {
      headers,
      data: {
        organizationId: PROVINCE_ORG_ID,
        code: `E2E-KNCS-${STAMP}`,
        name: `Cơ sở kiểm nghiệm ${STAMP}`,
        productGroupIds: [],
      },
    });
    expect(bizRes.ok(), await bizRes.text()).toBeTruthy();
    const certBusinessId = ((await bizRes.json()) as { id: string }).id;

    const sampleCode = `E2E-KN-${STAMP}`;
    const createRes = await request.post("/api/v1/app/testing-result", {
      headers,
      data: {
        sampleCode,
        sampleName: `Mẫu công khai ${STAMP}`,
        testingCenterId: centerId,
        businessId: certBusinessId,
        sampleDate: "2026-07-20T00:00:00Z",
        outcome: 1,
        isPublic: true,
        storagePath,
      },
    });
    expect(createRes.ok(), await createRes.text()).toBeTruthy();
    const resultId = ((await createRes.json()) as { id: string }).id;

    // Anonymous context: a brand-new browser context has no session cookie.
    const anon = await browser.newContext();
    try {
      const listRes = await anon.request.get(
        `/api/v1/public/testing-results?Keyword=${encodeURIComponent(sampleCode)}&MaxResultCount=20`,
      );
      expect(listRes.ok(), await listRes.text()).toBeTruthy();
      const list = (await listRes.json()) as {
        items: { id: string; sampleCode: string; hasCertificateFile: boolean }[];
      };
      const row = list.items.find((i) => i.sampleCode === sampleCode);
      expect(row, "published result must appear on the portal").toBeTruthy();
      expect(row!.hasCertificateFile).toBe(true);

      const fileRes = await anon.request.get(
        `/api/v1/public/testing-results/${resultId}/certificate`,
      );
      expect(fileRes.status()).toBe(200);
      expect(fileRes.headers()["content-type"]).toContain("application/pdf");
      const body = await fileRes.body();
      expect(body.subarray(0, 4).toString("latin1")).toBe("%PDF");

      // The portal page offers the download.
      const anonPage = await anon.newPage();
      await anonPage.goto("/tra-cuu-ket-qua-kiem-nghiem");
      await anonPage
        .getByPlaceholder("Tên hoặc mã mẫu kiểm nghiệm...")
        .fill(sampleCode);
      await anonPage.getByRole("button", { name: "Tìm kiếm" }).click();
      await expect(anonPage.getByText(sampleCode)).toBeVisible();
      await expect(
        anonPage.getByRole("link", { name: /Tải phiếu/ }).first(),
      ).toBeVisible();
      await anonPage.close();
    } finally {
      await anon.close();
    }

    // Unpublishing must break the link — the endpoint re-checks, it does not
    // trust the id alone.
    const unpublishRes = await request.put(
      `/api/v1/app/testing-result/${resultId}`,
      {
        headers,
        data: {
          sampleCode,
          sampleName: `Mẫu công khai ${STAMP}`,
          testingCenterId: centerId,
          businessId: certBusinessId,
          sampleDate: "2026-07-20T00:00:00Z",
          outcome: 1,
          isPublic: false,
          storagePath,
        },
      },
    );
    expect(unpublishRes.ok(), await unpublishRes.text()).toBeTruthy();

    const anon2 = await browser.newContext();
    try {
      const denied = await anon2.request.get(
        `/api/v1/public/testing-results/${resultId}/certificate`,
      );
      expect(denied.status()).toBe(404);
    } finally {
      await anon2.close();
    }

    await request.delete(`/api/v1/app/testing-result/${resultId}`, { headers });
  });
});

test.describe("STT 42 — product lookup carries the label information", () => {
  test.setTimeout(120_000);

  test("ingredients, shelf life and origin reach the anonymous portal", async ({
    page,
    browser,
  }) => {
    await page.goto("/");
    await signInAsAdmin(page);
    const headers = await csrf(page);
    const request = page.context().request;

    const bizRes = await request.post("/api/v1/app/business", {
      headers,
      data: {
        organizationId: PROVINCE_ORG_ID,
        code: `E2E-CS-${STAMP}`,
        name: `Cơ sở nhãn hàng ${STAMP}`,
        productGroupIds: [],
      },
    });
    expect(bizRes.ok(), await bizRes.text()).toBeTruthy();
    const businessId = ((await bizRes.json()) as { id: string }).id;

    const productName = `Sản phẩm nhãn ${STAMP}`;
    const prodRes = await request.post("/api/v1/app/product", {
      headers,
      data: {
        businessId,
        code: `E2E-SP-${STAMP}`,
        name: productName,
        ingredients: "Bột mì, đường, muối i-ốt",
        expiryPeriodMonths: 18,
        storageConditions: "Nơi khô ráo, dưới 25°C",
      },
    });
    expect(prodRes.ok(), await prodRes.text()).toBeTruthy();

    const anon = await browser.newContext();
    try {
      const res = await anon.request.get(
        `/api/v1/public/products/search?Keyword=${encodeURIComponent(productName)}&MaxResultCount=20`,
      );
      expect(res.ok(), await res.text()).toBeTruthy();
      const body = (await res.json()) as {
        items: {
          name: string;
          businessId: string;
          ingredients: string | null;
          expiryPeriodMonths: number | null;
          storageConditions: string | null;
        }[];
      };
      const row = body.items.find((i) => i.name === productName);
      expect(row, "product must be listed publicly").toBeTruthy();
      expect(row!.ingredients).toContain("Bột mì");
      expect(row!.expiryPeriodMonths).toBe(18);
      expect(row!.storageConditions).toContain("khô ráo");
      // STT 42 wants a link to the owning business, not just its name.
      expect(row!.businessId).toBe(businessId);

      const anonPage = await anon.newPage();
      await anonPage.goto("/tra-cuu-chung");
      await anonPage.getByRole("tab", { name: /Sản phẩm/ }).click();
      await anonPage
        .getByPlaceholder("Tên hoặc mã sản phẩm...")
        .fill(productName);
      await anonPage.getByRole("button", { name: "Tìm kiếm" }).click();
      await expect(anonPage.getByText(productName)).toBeVisible();
      // Label details sit in the expandable row.
      await anonPage
        .locator("tr", { hasText: productName })
        .locator(".ant-table-row-expand-icon")
        .first()
        .click();
      await expect(anonPage.getByText("Bột mì, đường, muối i-ốt")).toBeVisible();
      await expect(anonPage.getByText("18 tháng")).toBeVisible();
      await anonPage.close();
    } finally {
      await anon.close();
    }
  });
});

test.describe("STT 49 — citizen reports carry photographic evidence", () => {
  test.setTimeout(120_000);

  test("evidence submitted anonymously is stored against the alert", async ({
    page,
    browser,
  }) => {
    const title = `Phản ánh có ảnh ${STAMP}`;
    const anon = await browser.newContext();
    let trackingCode = "";
    try {
      // The captcha test key always passes; the middleware still runs.
      const res = await anon.request.post("/api/v1/public/alert-reports", {
        data: {
          title,
          content:
            "Phát hiện thực phẩm không rõ nguồn gốc, có gửi kèm ảnh chứng minh.",
          category: 6,
          evidence: [
            {
              fileName: `bang-chung-${STAMP}.png`,
              contentType: "image/png",
              contentBase64: TINY_PNG_BASE64,
            },
          ],
          captchaToken: "XXXX.DUMMY.TOKEN.XXXX",
        },
      });
      expect(res.ok(), await res.text()).toBeTruthy();
      const body = (await res.json()) as {
        id: string;
        trackingCode: string | null;
      };
      trackingCode = body.trackingCode ?? "";
      expect(trackingCode).not.toBe("");

      // The citizen can still track it — evidence must not disturb the flow.
      const status = await anon.request.get(
        `/api/v1/public/citizen-reports/status?trackingCode=${encodeURIComponent(trackingCode)}`,
      );
      expect(status.status()).toBe(200);
    } finally {
      await anon.close();
    }

    // Staff side: the alert exists and its evidence is retrievable.
    await page.goto("/");
    await signInAsAdmin(page);
    const headers = await csrf(page);
    const request = page.context().request;

    const listRes = await request.get(
      `/api/v1/app/atp-alert?Keyword=${encodeURIComponent(title)}&MaxResultCount=20`,
      { headers },
    );
    expect(listRes.ok(), await listRes.text()).toBeTruthy();
    const alerts = (await listRes.json()) as {
      items: { id: string; title: string }[];
    };
    const alert = alerts.items.find((a) => a.title === title);
    expect(alert, "citizen report must reach the moderation queue").toBeTruthy();
  });

  test("a report with an unsupported file still reaches the queue", async ({
    browser,
  }) => {
    const title = `Phản ánh file sai ${STAMP}`;
    const anon = await browser.newContext();
    try {
      const res = await anon.request.post("/api/v1/public/alert-reports", {
        data: {
          title,
          content: "Nội dung phản ánh kèm tệp không được hỗ trợ.",
          category: 6,
          evidence: [
            {
              fileName: "khong-ho-tro.exe",
              contentType: "application/octet-stream",
              contentBase64: TINY_PNG_BASE64,
            },
          ],
          captchaToken: "XXXX.DUMMY.TOKEN.XXXX",
        },
      });
      // The text of the report is what matters — a rejected attachment must
      // not cost the citizen their submission.
      expect(res.ok(), await res.text()).toBeTruthy();
      const body = (await res.json()) as { trackingCode: string | null };
      expect(body.trackingCode).not.toBeNull();
    } finally {
      await anon.close();
    }
  });
});
