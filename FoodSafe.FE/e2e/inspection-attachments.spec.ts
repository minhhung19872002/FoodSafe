/**
 * FR-27-08/09 + FR-28-03/05: inspection PLAN and RESULT file attachments —
 * upload → list → persist-after-reload → download → delete, proven against the
 * real full stack.
 *
 * Real React → real HTTP (multipart) → ASP.NET Core → ClamAV scan → MinIO →
 * EF Core → PostgreSQL. NO interception: the browser drives the real AntD
 * <Upload> control and the download event; the `request` fixture (genuine HTTP,
 * not page.route) seeds a deterministic plan/result/business cohort and cleans
 * it up.
 *
 * Why this spec exists: the attachment round-trip is proven for products and the
 * licensing modules, but NO executed test ever uploaded a file to an inspection
 * plan or result (doc 71 §7 / doc 73). Both areas are seeded here from scratch
 * because the shared DB has 0 active inspection results.
 *
 * ClamAV runs synchronously inside the upload request, so a clean PDF is
 * downloadable immediately after the 200 response — no polling.
 */

import { readFile } from "node:fs/promises";
import {
  expect,
  test,
  type APIRequestContext,
  type Locator,
  type Page,
} from "@playwright/test";
import { requestVerificationToken, signInAsAdmin } from "./helpers/auth";

const PLAN_TYPE_IRREGULAR = 3;
const INSPECTION_TYPE_UNSCHEDULED = 2;
const OVERALL_RESULT_PASS = 1;

interface OrganizationNode {
  id: string;
  children?: OrganizationNode[];
}

async function csrfHeaders(page: Page): Promise<Record<string, string>> {
  return { RequestVerificationToken: await requestVerificationToken(page) };
}

async function firstOrganizationId(request: APIRequestContext): Promise<string> {
  const response = await request.get("/api/v1/app/organization/tree");
  expect(response.ok(), await response.text()).toBeTruthy();
  const payload = (await response.json()) as { items?: OrganizationNode[] };
  const id = payload.items?.[0]?.id;
  expect(id, "organization tree returned no root node").toBeTruthy();
  return id!;
}

async function createBusiness(
  request: APIRequestContext,
  headers: Record<string, string>,
  organizationId: string,
  code: string,
  name: string,
): Promise<{ id: string; name: string }> {
  const response = await request.post("/api/v1/app/business", {
    headers,
    data: { organizationId, code, name, productGroupIds: [] },
  });
  expect(response.ok(), await response.text()).toBeTruthy();
  return (await response.json()) as { id: string; name: string };
}

async function createPlan(
  request: APIRequestContext,
  headers: Record<string, string>,
  planCode: string,
  title: string,
): Promise<{ id: string; planCode: string }> {
  const response = await request.post("/api/v1/app/inspection-plan", {
    headers,
    data: {
      planCode,
      title,
      planType: PLAN_TYPE_IRREGULAR,
      year: new Date().getFullYear(),
      items: [],
    },
  });
  expect(response.ok(), await response.text()).toBeTruthy();
  return (await response.json()) as { id: string; planCode: string };
}

async function createResult(
  request: APIRequestContext,
  headers: Record<string, string>,
  businessId: string,
): Promise<{ id: string; businessName: string }> {
  const response = await request.post("/api/v1/app/inspection-result", {
    headers,
    data: {
      businessId,
      inspectionDate: new Date().toISOString(),
      inspectionType: INSPECTION_TYPE_UNSCHEDULED,
      overallResult: OVERALL_RESULT_PASS,
    },
  });
  expect(response.ok(), await response.text()).toBeTruthy();
  return (await response.json()) as { id: string; businessName: string };
}

async function bestEffortDelete(
  request: APIRequestContext,
  headers: Record<string, string>,
  url: string,
): Promise<void> {
  try {
    await request.delete(url, { headers, maxRedirects: 0 });
  } catch {
    // teardown is best-effort — a failure here must not mask the test result
  }
}

const PDF_BYTES = Buffer.from("%PDF-1.7\n%%EOF\n");

// Uploads a clean PDF through the real AntD <Upload> (fires beforeUpload →
// mutation immediately; there is no separate confirm button) and asserts the
// success toast + the file row.
async function uploadPdf(page: Page, dialog: Locator, fileName: string) {
  await dialog.locator('input[type="file"]').setInputFiles({
    name: fileName,
    mimeType: "application/pdf",
    buffer: PDF_BYTES,
  });
  await expect(page.getByText("Đã tải lên tài liệu.")).toBeVisible({
    timeout: 20_000,
  });
  await expect(
    dialog.getByRole("cell", { name: fileName, exact: true }),
  ).toBeVisible();
}

// Clicks the row's download button and asserts the streamed bytes are a real
// PDF — proves the download endpoint returns the stored file, not a 404/HTML.
async function downloadAndAssertPdf(page: Page, dialog: Locator, fileName: string) {
  const downloadPromise = page.waitForEvent("download");
  await dialog.getByRole("button", { name: `Tải ${fileName}` }).click();
  const download = await downloadPromise;
  const path = await download.path();
  expect(path).not.toBeNull();
  expect((await readFile(path!)).subarray(0, 4).toString()).toBe("%PDF");
}

async function deleteAttachment(page: Page, dialog: Locator, fileName: string) {
  await dialog.getByRole("button", { name: `Xóa ${fileName}` }).click();
  await page
    .locator(".ant-popover:visible")
    .getByRole("button", { name: "Xóa" })
    .click();
  await expect(
    dialog.getByRole("cell", { name: fileName, exact: true }),
  ).toHaveCount(0);
}

test.describe("inspection attachments — plan & result round-trip (FR-27/FR-28)", () => {
  test.setTimeout(120_000);

  test("plan attachment: upload, persist after reload, download, delete", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    const request = page.context().request;
    const headers = await csrfHeaders(page);
    const suffix = Date.now().toString().slice(-8);
    const planCode = `E2E-ATT-${suffix}`;
    const fileName = `ke-hoach-${suffix}.pdf`;

    const plan = await createPlan(
      request,
      headers,
      planCode,
      `Kế hoạch đính kèm E2E ${suffix}`,
    );

    try {
      await page.goto("/inspection");
      await expect(
        page.getByRole("heading", { name: "Thanh tra - Kiểm tra ATTP" }),
      ).toBeVisible();

      // Plans tab is the default view; the freshly-created plan sorts to the top.
      const openModal = async () => {
        const row = page
          .getByRole("row")
          .filter({ hasText: plan.planCode });
        await expect(row).toBeVisible({ timeout: 10_000 });
        await row
          .getByRole("button", { name: `Tài liệu ${plan.planCode}` })
          .click();
        return page.getByRole("dialog");
      };

      let dialog = await openModal();
      await uploadPdf(page, dialog, fileName);

      // Persistence: reload the whole browser, reopen the modal, the file
      // survives (real MinIO + DB persistence, not client state).
      await page.reload();
      await expect(
        page.getByRole("heading", { name: "Thanh tra - Kiểm tra ATTP" }),
      ).toBeVisible();
      dialog = await openModal();
      await expect(
        dialog.getByRole("cell", { name: fileName, exact: true }),
      ).toBeVisible({ timeout: 10_000 });

      await downloadAndAssertPdf(page, dialog, fileName);
      await deleteAttachment(page, dialog, fileName);
    } finally {
      await bestEffortDelete(
        request,
        headers,
        `/api/v1/app/inspection-plan/${plan.id}`,
      );
    }
  });

  test("result attachment: upload, persist after reload, download, delete", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    const request = page.context().request;
    const headers = await csrfHeaders(page);
    const suffix = Date.now().toString().slice(-8);
    const businessName = `Cơ sở E2E ATT ${suffix}`;
    const fileName = `ket-qua-${suffix}.pdf`;

    const organizationId = await firstOrganizationId(request);
    const business = await createBusiness(
      request,
      headers,
      organizationId,
      `E2E-ATT-CS-${suffix}`,
      businessName,
    );
    const result = await createResult(request, headers, business.id);

    try {
      await page.goto("/inspection");
      await expect(
        page.getByRole("heading", { name: "Thanh tra - Kiểm tra ATTP" }),
      ).toBeVisible();

      const openModal = async () => {
        await page.getByRole("tab", { name: "Kết quả" }).click();
        const row = page
          .getByRole("row")
          .filter({ hasText: result.businessName });
        await expect(row).toBeVisible({ timeout: 10_000 });
        await row
          .getByRole("button", {
            name: `Tài liệu kết quả ${result.businessName}`,
          })
          .click();
        return page.getByRole("dialog");
      };

      let dialog = await openModal();
      await uploadPdf(page, dialog, fileName);

      await page.reload();
      await expect(
        page.getByRole("heading", { name: "Thanh tra - Kiểm tra ATTP" }),
      ).toBeVisible();
      dialog = await openModal();
      await expect(
        dialog.getByRole("cell", { name: fileName, exact: true }),
      ).toBeVisible({ timeout: 10_000 });

      await downloadAndAssertPdf(page, dialog, fileName);
      await deleteAttachment(page, dialog, fileName);
    } finally {
      await bestEffortDelete(
        request,
        headers,
        `/api/v1/app/inspection-result/${result.id}`,
      );
      await bestEffortDelete(
        request,
        headers,
        `/api/v1/app/business/${business.id}`,
      );
    }
  });
});
