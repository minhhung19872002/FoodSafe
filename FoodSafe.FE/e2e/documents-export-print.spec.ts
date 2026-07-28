/**
 * FR-38-07 — Administrative-document module: Excel list export + per-document
 * print, driven through the REAL UI (route /documents).
 *
 * The live document list is normally empty, so a document is SEEDED through the
 * real authenticated admin API (POST /api/v1/app/administrative-document) after
 * a real UI login. This is NOT interception: the seed request carries the real
 * session cookie + antiforgery token and travels through the real ASP.NET Core
 * pipeline, application service, EF Core mapping and PostgreSQL. The subject
 * under test — the officer-facing list export and the per-row print view — is
 * then exercised entirely through the real browser against the real backend.
 *
 * Evidence:
 *  - export: the browser receives a genuine OpenXML workbook (ZIP "PK" magic),
 *    proving the ClosedXML/MiniExcel stream reached the browser.
 *  - print: the real client-side print window (window.open + document.write)
 *    opens and renders the formatted document with its real fields.
 */

import { test, expect, type Download, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { requestVerificationToken, signInAsAdmin } from "./helpers/auth";

const DOC_ENDPOINT = "/api/v1/app/administrative-document";

interface SeededDocument {
  id: string;
  documentNumber: string;
  title: string;
}

/** Reads the download and asserts it is a non-empty real .xlsx (ZIP). */
async function expectXlsx(download: Download): Promise<void> {
  expect(download.suggestedFilename()).toMatch(/\.xlsx$/);
  const buf = readFileSync(await download.path());
  expect(buf.length, "downloaded workbook must not be empty").toBeGreaterThan(0);
  expect(buf.subarray(0, 2).toString("latin1")).toBe("PK");
}

/**
 * Seeds one live administrative document through the real authenticated admin
 * API (after a real UI login has populated the session on this context).
 */
async function seedDocument(page: Page, stamp: string): Promise<SeededDocument> {
  const token = await requestVerificationToken(page);
  const headers = { RequestVerificationToken: token };

  // A document type is required; read the real catalog options.
  const typesRes = await page.context().request.get(
    "/api/v1/app/master-catalog/document-types?maxResultCount=100",
  );
  expect(typesRes.ok(), await typesRes.text()).toBeTruthy();
  const types = (await typesRes.json()) as { items: { id: string }[] };
  expect(types.items.length, "no document types seeded").toBeGreaterThan(0);

  const documentNumber = `E2E-DOC-${stamp}`;
  const title = `Văn bản kiểm chứng xuất/in ${stamp}`;
  const res = await page.context().request.post(DOC_ENDPOINT, {
    headers,
    data: {
      documentTypeId: types.items[0].id,
      documentNumber,
      title,
      issuingAuthority: "Chi cục ATVSTP Quảng Ninh",
      issuedDate: "2026-07-01T00:00:00Z",
      summary: "Nội dung kiểm chứng cho luồng xuất Excel và in văn bản.",
      status: 1, // Hiệu lực (Active)
      isPublic: false,
    },
    maxRedirects: 0,
  });
  expect(res.ok(), `document seed failed: ${await res.text()}`).toBeTruthy();
  const body = (await res.json()) as { id: string };
  expect(body.id).toBeTruthy();
  return { id: body.id, documentNumber, title };
}

async function deleteDocument(page: Page, id: string): Promise<void> {
  await page.context().request.delete(`${DOC_ENDPOINT}/${id}`, {
    headers: { RequestVerificationToken: await requestVerificationToken(page) },
    maxRedirects: 0,
  });
}

test.describe("FR-38-07 — administrative documents export + print", () => {
  test.setTimeout(90_000);

  test("list Excel export downloads a real workbook through the UI", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    const stamp = Date.now().toString().slice(-9);
    const doc = await seedDocument(page, stamp);

    try {
      await page.goto("/documents");
      // Narrow the list to the seeded row so the export reflects real data.
      await page.getByPlaceholder("Số VB, tiêu đề").fill(doc.documentNumber);
      await page.getByPlaceholder("Số VB, tiêu đề").press("Enter");
      await expect(
        page.getByRole("row").filter({ hasText: doc.documentNumber }),
      ).toBeVisible({ timeout: 10_000 });

      const button = page.getByRole("button", { name: "Xuất Excel" });
      await expect(button).toBeVisible();
      const downloadPromise = page.waitForEvent("download");
      await button.click();
      await expectXlsx(await downloadPromise);
    } finally {
      await deleteDocument(page, doc.id);
    }
  });

  test("per-document print opens the real formatted print view", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    const stamp = Date.now().toString().slice(-9);
    const doc = await seedDocument(page, stamp);

    try {
      await page.goto("/documents");
      await page.getByPlaceholder("Số VB, tiêu đề").fill(doc.documentNumber);
      await page.getByPlaceholder("Số VB, tiêu đề").press("Enter");
      await expect(
        page.getByRole("row").filter({ hasText: doc.documentNumber }),
      ).toBeVisible({ timeout: 10_000 });

      // The print button (aria-label "In <số văn bản>") opens a real popup via
      // window.open + document.write; capture it and assert the rendered fields.
      const popupPromise = page.context().waitForEvent("page");
      await page.getByRole("button", { name: `In ${doc.documentNumber}` }).click();
      const popup = await popupPromise;
      await expect(popup.locator("body")).toContainText(doc.documentNumber, {
        timeout: 10_000,
      });
      await expect(popup.locator("body")).toContainText(doc.title);
      await expect(popup.locator("body")).toContainText("Số văn bản:");
      await popup.close();
    } finally {
      await deleteDocument(page, doc.id);
    }
  });
});
