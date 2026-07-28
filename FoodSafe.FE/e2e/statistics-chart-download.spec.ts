/**
 * FR-39-09 — statistics chart PNG download, driven through the REAL /statistics
 * UI with no interception.
 *
 * The two time-series cards ("Thanh kiểm tra theo tháng" and "Ngộ độc thực phẩm
 * theo tháng") each expose a download icon that rasterises the live Recharts SVG
 * to a PNG entirely in the browser (SVG → <canvas> → canvas.toBlob("image/png")
 * → anchor download). Since the merge of main's ChartCard, the download action
 * is DISABLED while a chart has no data — so this test first seeds one real
 * inspection result and one real poisoning case for the current year through
 * the real authenticated API (ASP.NET → EF Core → PostgreSQL), then logs in
 * through the real login screen, loads the real statistics page, clicks each
 * download button and asserts:
 *   - the download button is enabled (the seeded data reached the chart);
 *   - a real browser download fires;
 *   - the suggested filename matches the year-stamped chart name;
 *   - the downloaded bytes begin with the 8-byte PNG signature (proving a real
 *     raster image was produced, not an empty/errored file).
 *
 * No API is intercepted; both the seed data and the statistics travel the real
 * React → ASP.NET Core → EF Core → PostgreSQL pipeline. Seeded records are
 * deleted afterwards.
 */

import {
  expect,
  test,
  type APIRequestContext,
  type Download,
  type Page,
} from "@playwright/test";
import { readFile } from "node:fs/promises";
import { signInAsAdmin, requestVerificationToken } from "./helpers/auth";

/** The 8-byte PNG file signature. */
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** Default selected year on the page mirrors the frontend's currentYear(). */
const YEAR = new Date().getFullYear();

const INSPECTION_TYPE_UNSCHEDULED = 2;
const OVERALL_RESULT_PASS = 1;

const STAMP = `CD${Date.now().toString(36).slice(-6).toUpperCase()}`;

async function csrfHeaders(page: Page): Promise<Record<string, string>> {
  return { RequestVerificationToken: await requestVerificationToken(page) };
}

async function firstOrganizationId(request: APIRequestContext): Promise<string> {
  const response = await request.get("/api/v1/app/organization/tree");
  expect(response.ok(), await response.text()).toBeTruthy();
  const payload = (await response.json()) as { items?: Array<{ id: string }> };
  const id = payload.items?.[0]?.id;
  expect(id, "organization tree returned no root node").toBeTruthy();
  return id!;
}

async function bestEffortDelete(
  request: APIRequestContext,
  headers: Record<string, string>,
  url: string,
): Promise<void> {
  await request.delete(url, { headers }).catch(() => undefined);
}

async function expectPng(download: Download, expectedName: string): Promise<void> {
  expect(download.suggestedFilename()).toBe(expectedName);
  const path = await download.path();
  const buf = await readFile(path);
  expect(
    buf.subarray(0, PNG_MAGIC.length).equals(PNG_MAGIC),
    `downloaded file is not a PNG (first bytes: ${buf.subarray(0, 8).toString("hex")})`,
  ).toBeTruthy();
}

async function downloadChart(
  page: Page,
  card: RegExp,
  fileName: string,
): Promise<void> {
  const chartCard = page.locator(".ant-card").filter({ hasText: card });
  await expect(chartCard).toBeVisible({ timeout: 15_000 });

  // With data seeded the card must offer an ENABLED download action (a disabled
  // button means the chart considered itself empty — the seeded record never
  // reached the statistics endpoint).
  const button = chartCard.getByRole("button", { name: `Tải ảnh ${fileName}` });
  await expect(button).toBeEnabled({ timeout: 15_000 });
  // The live Recharts SVG must have rendered before rasterisation can succeed.
  await expect(chartCard.locator("svg").first()).toBeVisible({
    timeout: 15_000,
  });

  const downloadPromise = page.waitForEvent("download");
  await button.click();
  await expectPng(await downloadPromise, fileName);
}

test.describe("FR-39-09 — statistics chart PNG download", () => {
  test.setTimeout(120_000);
  test.use({ actionTimeout: 20_000, navigationTimeout: 30_000 });

  test("downloads inspection and poisoning charts as real PNG files", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    const request = page.context().request;
    const headers = await csrfHeaders(page);

    // ── seed real data so both time-series charts are non-empty this year ────
    const organizationId = await firstOrganizationId(request);
    const businessResp = await request.post("/api/v1/app/business", {
      headers,
      data: {
        organizationId,
        code: `E2E-${STAMP}`,
        name: `Cơ sở biểu đồ ${STAMP}`,
        productGroupIds: [],
      },
    });
    expect(businessResp.ok(), await businessResp.text()).toBeTruthy();
    const business = (await businessResp.json()) as { id: string };

    const resultResp = await request.post("/api/v1/app/inspection-result", {
      headers,
      data: {
        businessId: business.id,
        inspectionDate: new Date().toISOString(),
        inspectionType: INSPECTION_TYPE_UNSCHEDULED,
        overallResult: OVERALL_RESULT_PASS,
      },
    });
    expect(resultResp.ok(), await resultResp.text()).toBeTruthy();
    const result = (await resultResp.json()) as { id: string };

    const caseResp = await request.post("/api/v1/app/food-poisoning-case", {
      headers,
      data: {
        reportDate: new Date().toISOString().slice(0, 10),
        victimName: `Nạn nhân biểu đồ ${STAMP}`,
        location: "Địa điểm kiểm chứng biểu đồ E2E",
        suspectedFood: "Thực phẩm kiểm chứng",
      },
    });
    expect(caseResp.ok(), await caseResp.text()).toBeTruthy();
    const poisoningCase = (await caseResp.json()) as { id: string };

    try {
      await page.goto("/statistics");

      // Wait until the page has finished loading (charts, not the spinner).
      await expect(
        page.getByRole("heading", { name: "Thống kê tổng hợp" }),
      ).toBeVisible();

      await downloadChart(
        page,
        new RegExp(`Thanh kiểm tra theo tháng — Năm ${YEAR}`),
        `thanh-kiem-tra-${YEAR}.png`,
      );

      await downloadChart(
        page,
        new RegExp(`Ngộ độc thực phẩm theo tháng — Năm ${YEAR}`),
        `ngo-doc-thuc-pham-${YEAR}.png`,
      );
    } finally {
      await bestEffortDelete(
        request,
        headers,
        `/api/v1/app/food-poisoning-case/${poisoningCase.id}`,
      );
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
