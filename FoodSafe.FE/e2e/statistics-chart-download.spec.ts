/**
 * FR-39-09 — statistics chart PNG download, driven through the REAL /statistics
 * UI with no interception.
 *
 * The two time-series cards ("Thanh kiểm tra theo tháng" and "Ngộ độc thực phẩm
 * theo tháng") each expose a download icon that rasterises the live Recharts SVG
 * to a PNG entirely in the browser (SVG → <canvas> → canvas.toBlob("image/png")
 * → anchor download). This test logs in through the real login screen, loads the
 * real statistics page served by the real backend, clicks each download button
 * and asserts:
 *   - a real browser download fires;
 *   - the suggested filename matches the year-stamped chart name;
 *   - the downloaded bytes begin with the 8-byte PNG signature (proving a real
 *     raster image was produced, not an empty/errored file).
 *
 * No API is intercepted; the statistics data travels the real
 * React → ASP.NET Core → EF Core → PostgreSQL pipeline.
 */

import { expect, test, type Download, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { signInAsAdmin } from "./helpers/auth";

/** The 8-byte PNG file signature. */
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** Default selected year on the page mirrors the frontend's currentYear(). */
const YEAR = new Date().getFullYear();

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
  // The card must have rendered its live SVG before rasterisation can succeed.
  await expect(chartCard.locator("svg").first()).toBeVisible({ timeout: 15_000 });

  const downloadPromise = page.waitForEvent("download");
  await chartCard.getByRole("button", { name: `Tải ảnh ${fileName}` }).click();
  await expectPng(await downloadPromise, fileName);
}

test.describe("FR-39-09 — statistics chart PNG download", () => {
  test.setTimeout(90_000);
  test.use({ actionTimeout: 20_000, navigationTimeout: 30_000 });

  test("downloads inspection and poisoning charts as real PNG files", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    await page.goto("/statistics");

    // Wait until the page has finished loading (charts rendered, not the spinner).
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
  });
});
