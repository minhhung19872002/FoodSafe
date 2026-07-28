/**
 * FR-38 (P1-1b remainder) — administrative-document file attachments, driven
 * through the REAL /documents UI with no interception.
 *
 * The document list is normally empty, so one document is SEEDED through the
 * real authenticated admin API (POST /api/v1/app/administrative-document) after
 * a real UI login — this carries the real session cookie + antiforgery token
 * and travels the real ASP.NET Core → EF Core → PostgreSQL pipeline (not
 * interception). The subject under test — the officer-facing attachment modal
 * (upload / list / download / delete) — is then exercised entirely through the
 * real browser:
 *   Playwright → React <Upload> → real multipart POST → ASP.NET Core
 *   → ClamAV malware scan → MinIO blob store → PostgreSQL FileAttachment row.
 *
 * Evidence collected:
 *   - upload success toast + the attachment row rendered with its REAL file name,
 *     a real "N KB" size and a valid upload date (proving the DTO fileSize /
 *     uploadTime fields are read correctly — the columns previously read the
 *     non-existent sizeBytes / creationTime and showed NaN KB / Invalid Date);
 *   - persistence across a full page reload (row still served by the backend);
 *   - a real download whose bytes start with the PDF magic "%PDF";
 *   - delete removes the row.
 */

import { test, expect, type Download, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { requestVerificationToken, signInAsAdmin } from "./helpers/auth";

const DOC_ENDPOINT = "/api/v1/app/administrative-document";
const STAMP = Date.now().toString().slice(-9);

/** A minimal but signature-valid PDF (the store validates the %PDF magic). */
const PDF_BYTES = Buffer.from(
  "%PDF-1.7\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n",
);

interface SeededDocument {
  id: string;
  documentNumber: string;
}

async function seedDocument(page: Page): Promise<SeededDocument> {
  const headers = {
    RequestVerificationToken: await requestVerificationToken(page),
  };
  const typesRes = await page.context().request.get(
    "/api/v1/app/master-catalog/document-types?maxResultCount=100",
  );
  expect(typesRes.ok(), await typesRes.text()).toBeTruthy();
  const types = (await typesRes.json()) as { items: { id: string }[] };
  expect(types.items.length, "no document types seeded").toBeGreaterThan(0);

  const documentNumber = `E2E-ATTACH-${STAMP}`;
  const res = await page.context().request.post(DOC_ENDPOINT, {
    headers,
    maxRedirects: 0,
    data: {
      documentTypeId: types.items[0].id,
      documentNumber,
      title: `Văn bản kiểm chứng đính kèm ${STAMP}`,
      issuingAuthority: "Chi cục ATVSTP Quảng Ninh",
      issuedDate: "2026-07-01T00:00:00Z",
      summary: "Kiểm chứng luồng đính kèm tài liệu.",
      status: 1,
      isPublic: false,
    },
  });
  expect(res.ok(), `document seed failed: ${await res.text()}`).toBeTruthy();
  const body = (await res.json()) as { id: string };
  expect(body.id).toBeTruthy();
  return { id: body.id, documentNumber };
}

async function deleteDocument(page: Page, id: string): Promise<void> {
  await page.context().request
    .delete(`${DOC_ENDPOINT}/${id}`, {
      headers: { RequestVerificationToken: await requestVerificationToken(page) },
      maxRedirects: 0,
    })
    .catch(() => undefined);
}

/** Opens the attachment modal for the seeded document row. */
async function openAttachmentsModal(
  page: Page,
  documentNumber: string,
): Promise<void> {
  await page.getByPlaceholder("Số VB, tiêu đề").fill(documentNumber);
  await page.getByPlaceholder("Số VB, tiêu đề").press("Enter");
  const row = page.getByRole("row").filter({ hasText: documentNumber });
  await expect(row).toBeVisible({ timeout: 10_000 });
  // The attachments trigger is the paper-clip icon button (aria-label "Tệp <số>").
  await row.getByRole("button", { name: `Tệp ${documentNumber}` }).click();
  await expect(page.getByRole("dialog")).toContainText(
    `Tài liệu đính kèm — ${documentNumber}`,
  );
}

async function expectPdf(download: Download): Promise<void> {
  const path = await download.path();
  const buf = await readFile(path);
  expect(buf.subarray(0, 4).toString("latin1")).toBe("%PDF");
}

test.describe("FR-38 — administrative-document attachments round-trip", () => {
  test.setTimeout(120_000);
  test.use({ actionTimeout: 20_000, navigationTimeout: 30_000 });

  test("upload → list → reload-persist → download → delete through the UI", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    const doc = await seedDocument(page);
    const fileName = `van-ban-${STAMP}.pdf`;

    try {
      await page.goto("/documents");
      await openAttachmentsModal(page, doc.documentNumber);
      const dialog = page.getByRole("dialog");

      // Empty state before any upload.
      await expect(dialog).toContainText("Chưa có tài liệu đính kèm");

      // 1) Upload a real PDF through the real <Upload> control (hidden input).
      //    This fires a real multipart POST → ClamAV → MinIO → PostgreSQL.
      const uploadPromise = page.waitForResponse(
        (r) =>
          r.url().includes(`/administrative-document/${doc.id}/attachments`) &&
          r.request().method() === "POST",
      );
      await dialog
        .locator('input[type="file"]')
        .setInputFiles({
          name: fileName,
          mimeType: "application/pdf",
          buffer: PDF_BYTES,
        });
      const uploadResponse = await uploadPromise;
      expect(uploadResponse.status(), await uploadResponse.text()).toBe(200);
      await expect(page.getByText("Đã tải lên tài liệu.")).toBeVisible();

      // 2) The attachment row shows the real name, a real "N KB" size and a
      //    valid date (regression guard for the fileSize/uploadTime fix).
      const attachmentRow = dialog.getByRole("row").filter({ hasText: fileName });
      await expect(attachmentRow).toBeVisible({ timeout: 10_000 });
      await expect(attachmentRow).toContainText(/\d+\s*KB/);
      await expect(attachmentRow).not.toContainText("NaN");
      await expect(attachmentRow).not.toContainText("Invalid Date");

      // 3) Persistence across a full browser reload (served by the backend).
      await page.reload();
      await openAttachmentsModal(page, doc.documentNumber);
      const reloadedDialog = page.getByRole("dialog");
      const reloadedRow = reloadedDialog
        .getByRole("row")
        .filter({ hasText: fileName });
      await expect(reloadedRow).toBeVisible({ timeout: 10_000 });

      // 4) Download the attachment and assert real PDF bytes.
      const downloadPromise = page.waitForEvent("download");
      await reloadedRow.getByRole("button", { name: `Tải ${fileName}` }).click();
      await expectPdf(await downloadPromise);

      // 5) Delete the attachment; the row leaves the table.
      await reloadedRow.getByRole("button", { name: `Xóa ${fileName}` }).click();
      await page.getByRole("button", { name: "Xóa", exact: true }).click();
      await expect(page.getByText("Đã xóa tài liệu.")).toBeVisible();
      await expect(
        reloadedDialog.getByRole("row").filter({ hasText: fileName }),
      ).toHaveCount(0, { timeout: 10_000 });
    } finally {
      await deleteDocument(page, doc.id);
    }
  });
});
