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

interface Fixture {
  docTypeId: string;
  docId: string;
  docNumber: string;
}

async function createFixture(
  page: Page,
  headers: Record<string, string>,
  suffix: string,
): Promise<Fixture> {
  const req = page.context().request;

  // Create a document type via catalog API (required since none are seeded)
  const typeRes = await req.post("/api/v1/app/master-catalog/document-type", {
    headers,
    data: {
      code: `VB-E2E-${suffix}`,
      name: `Loại văn bản E2E ${suffix}`,
      sortOrder: 1,
      isActive: true,
    },
  });
  expect(typeRes.ok(), `createDocumentType failed: ${await typeRes.text()}`).toBeTruthy();
  const docType = (await typeRes.json()) as { id: string };

  // Create an administrative document
  const docNumber = `E2E-VB-${suffix}`;
  const docRes = await req.post("/api/v1/app/administrative-document", {
    headers,
    data: {
      documentTypeId: docType.id,
      documentNumber: docNumber,
      title: `Văn bản kiểm chứng E2E ${suffix}`,
      issuedDate: "2026-07-01T00:00:00Z",
      status: 1,
      isPublic: false,
    },
  });
  expect(docRes.ok(), `createDocument failed: ${await docRes.text()}`).toBeTruthy();
  const doc = (await docRes.json()) as { id: string };

  return { docTypeId: docType.id, docId: doc.id, docNumber };
}

async function destroyFixture(
  page: Page,
  headers: Record<string, string>,
  fixture: Fixture,
) {
  const req = page.context().request;
  await req.delete(`/api/v1/app/administrative-document/${fixture.docId}`, {
    headers,
    maxRedirects: 0,
  });
  await req.delete(
    `/api/v1/app/master-catalog/${fixture.docTypeId}/document-type`,
    { headers, maxRedirects: 0 },
  );
}

test.describe("documents verification (F-031)", () => {
  test.setTimeout(90_000);

  test("unauthenticated API access is rejected", async ({ request }) => {
    const res = await request.get("/api/v1/app/administrative-document", {
      maxRedirects: 0,
    });
    expect([401, 302]).toContain(res.status());
    expect(res.ok()).toBeFalsy();
  });

  test("user without documents permission is denied", async ({ browser }) => {
    const { context, page } = await newSignedInPage(
      browser,
      "noperm@foodsafe.local",
    );
    try {
      const res = await page.context().request.get(
        "/api/v1/app/administrative-document",
        { maxRedirects: 0 },
      );
      expect([403, 302]).toContain(res.status());
      expect(res.ok()).toBeFalsy();
    } finally {
      await context.close();
    }
  });

  test("district staff without documents permission is denied", async ({
    browser,
  }) => {
    const { context, page } = await newSignedInPage(
      browser,
      "district.staff@foodsafe.local",
    );
    try {
      const res = await page.context().request.get(
        "/api/v1/app/administrative-document",
        { maxRedirects: 0 },
      );
      expect([403, 302]).toContain(res.status());
      expect(res.ok()).toBeFalsy();
    } finally {
      await context.close();
    }
  });

  test("full CRUD lifecycle: create with catalog type, read, update, delete", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    const headers = await csrfHeaders(page);
    const suffix = Date.now().toString().slice(-8);
    const fixture = await createFixture(page, headers, suffix);

    try {
      // GET by id — verify persisted fields
      const get = await page.context().request.get(
        `/api/v1/app/administrative-document/${fixture.docId}`,
        { maxRedirects: 0 },
      );
      expect(get.ok(), await get.text()).toBeTruthy();
      const dto = (await get.json()) as {
        documentNumber: string;
        documentTypeId: string;
        status: number | string;
      };
      expect(dto.documentNumber).toBe(fixture.docNumber);
      expect(dto.documentTypeId).toBe(fixture.docTypeId);
      expect(String(dto.status)).toMatch(/^(Active|1)$/);

      // UPDATE
      const updated = await page.context().request.put(
        `/api/v1/app/administrative-document/${fixture.docId}`,
        {
          headers,
          maxRedirects: 0,
          data: {
            documentTypeId: fixture.docTypeId,
            documentNumber: fixture.docNumber,
            title: `Văn bản cập nhật E2E ${suffix}`,
            issuedDate: "2026-07-01T00:00:00Z",
            status: 1,
            isPublic: true,
          },
        },
      );
      expect(updated.ok(), await updated.text()).toBeTruthy();
      const updDto = (await updated.json()) as { isPublic: boolean };
      expect(updDto.isPublic).toBe(true);

      // DELETE
      const del = await page.context().request.delete(
        `/api/v1/app/administrative-document/${fixture.docId}`,
        { headers, maxRedirects: 0 },
      );
      expect(del.ok(), await del.text()).toBeTruthy();

      // GET after delete → not found
      const afterDel = await page.context().request.get(
        `/api/v1/app/administrative-document/${fixture.docId}`,
        { maxRedirects: 0 },
      );
      expect(afterDel.ok()).toBeFalsy();
    } finally {
      // cleanup document type (doc already deleted or cleaned above)
      await page.context().request.delete(
        `/api/v1/app/master-catalog/${fixture.docTypeId}/document-type`,
        { headers, maxRedirects: 0 },
      );
    }
  });

  test("server-side validation: missing required fields rejected", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    const headers = await csrfHeaders(page);
    const req = page.context().request;

    // Missing title
    const missingTitle = await req.post("/api/v1/app/administrative-document", {
      headers,
      maxRedirects: 0,
      data: {
        documentTypeId: "00000000-0000-0000-0000-000000000001",
        documentNumber: "E2E-NO-TITLE",
        issuedDate: "2026-07-01T00:00:00Z",
        status: 1,
        isPublic: false,
      },
    });
    expect(missingTitle.ok()).toBeFalsy();

    // Missing documentNumber
    const missingNum = await req.post("/api/v1/app/administrative-document", {
      headers,
      maxRedirects: 0,
      data: {
        documentTypeId: "00000000-0000-0000-0000-000000000001",
        title: "Tiêu đề không số",
        issuedDate: "2026-07-01T00:00:00Z",
        status: 1,
        isPublic: false,
      },
    });
    expect(missingNum.ok()).toBeFalsy();
  });

  test("persistence after reload and empty state (UI)", async ({ page }) => {
    await signInAsAdmin(page);
    const headers = await csrfHeaders(page);
    const suffix = Date.now().toString().slice(-8);
    const fixture = await createFixture(page, headers, suffix);

    try {
      await page.goto("/documents");
      const search = page.getByPlaceholder("Số VB, tiêu đề");
      await search.fill(fixture.docNumber);
      await page.keyboard.press("Enter");
      await expect(page.getByText(fixture.docNumber)).toBeVisible({
        timeout: 10_000,
      });

      // Reload — data persists
      await page.reload();
      await page.getByPlaceholder("Số VB, tiêu đề").fill(fixture.docNumber);
      await page.keyboard.press("Enter");
      await expect(page.getByText(fixture.docNumber)).toBeVisible({
        timeout: 10_000,
      });

      // Empty state
      await page.getByPlaceholder("Số VB, tiêu đề").fill("KHONG-TON-TAI-XYZ-99999");
      await page.keyboard.press("Enter");
      await expect(
        page.locator(".ant-empty-description").first(),
      ).toBeVisible({ timeout: 10_000 });
    } finally {
      await destroyFixture(page, headers, fixture);
    }
  });
});
