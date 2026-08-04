/**
 * P1-1a (FR-02-13, FR-03-03, FR-06-06, FR-17-05, FR-40-02/04/06): Excel export
 * downloads driven through the REAL UI, for the admin / catalog / statistics
 * modules that had no executed download-assert spec (doc 73 IMPLEMENTED_NOT_VERIFIED).
 *
 * The per-module lifecycle specs (businesses, certificates, food-poisoning, …)
 * already assert their own exports; this spec closes the remaining export gaps.
 *
 * Real full stack, no interception: a real admin logs in, opens each real route,
 * clicks the real "Xuất Excel" button, and the browser receives a genuine
 * download. Evidence is strengthened beyond a filename check: the downloaded
 * bytes are read and asserted to be a real OpenXML workbook (ZIP magic "PK"),
 * proving the ClosedXML/MiniExcel stream actually reached the browser — not an
 * empty or error blob.
 */

import { test, expect, type Download, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { signInAsAdmin } from "./helpers/auth";
import { activateTab } from "./helpers/tabs";

/** Reads the downloaded file and asserts it is a non-empty real .xlsx (ZIP). */
async function expectXlsx(download: Download): Promise<void> {
  expect(download.suggestedFilename()).toMatch(/\.xlsx$/);
  const path = await download.path();
  const buf = readFileSync(path);
  // OpenXML workbooks are ZIP archives → first two bytes are "PK".
  expect(buf.length, "downloaded workbook must not be empty").toBeGreaterThan(0);
  expect(buf.subarray(0, 2).toString("latin1")).toBe("PK");
}

/** Clicks a visible "Xuất Excel" button and returns the resulting download. */
async function clickExport(page: Page, button = page.getByRole("button", { name: "Xuất Excel" })): Promise<Download> {
  // Report/statistics data can be slow to fetch; allow the button time to mount.
  await expect(button).toBeVisible({ timeout: 15_000 });
  const downloadPromise = page.waitForEvent("download");
  await button.click();
  return downloadPromise;
}

test.describe("P1-1a — Excel export downloads through the real UI", () => {
  test("FR-02-13 — user list export (Quản trị người dùng)", async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto("/administration/identity");
    // Default tab is "Tài khoản" (users) for an admin; the table must load first.
    await expect(page.getByRole("table").first()).toBeVisible();
    await expectXlsx(await clickExport(page));
  });

  test("FR-03-03 — audit log export (Nhật ký hệ thống)", async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto("/administration/audit-logs");
    await expect(page.getByRole("table").first()).toBeVisible();
    await expectXlsx(await clickExport(page));
  });

  test("FR-06-06 — organization list export (Đơn vị)", async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto("/organizations");
    await expect(page.getByRole("table").first()).toBeVisible();
    await expectXlsx(await clickExport(page));
  });

  test("FR-17-05 — testing-services catalog export (Dịch vụ kiểm nghiệm)", async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto("/catalogs");
    // The "Xuất Excel" button only renders for the testing-service catalog kind.
    await activateTab(page, "Dịch vụ kiểm nghiệm");
    await expectXlsx(await clickExport(page));
  });

  test("FR-40-02/04/06 — statistics report exports (licenses / poisoning / inspection)", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    await page.goto("/statistics");

    const reportTabs = [
      "Giấy phép theo loại hình",
      "Ngộ độc theo địa bàn",
      "Kết quả thanh kiểm tra",
    ];

    // Wait for the report card to finish its data fetch before exercising tabs.
    await expect(
      page.getByRole("tab", { name: reportTabs[0] }),
    ).toBeVisible({ timeout: 15_000 });

    for (const tabName of reportTabs) {
      await page.getByRole("tab", { name: tabName }).click();
      // Only the active tab panel is exposed in the a11y tree, so the tabpanel
      // role scopes cleanly to this tab's own export button.
      const activeExport = page
        .getByRole("tabpanel")
        .getByRole("button", { name: "Xuất Excel" });
      await expectXlsx(await clickExport(page, activeExport));
    }
  });

  test("FR-40-07 — statistics business-breakdown export (Cơ sở SXKD)", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    await page.goto("/statistics");

    // The "Cơ sở SXKD" tab hosts a nested tab set plus its own export button
    // (GET /statistics/excel/business-breakdown). Activate the outer tab first;
    // the inactive tab panels stay out of the a11y tree so the export button
    // scopes cleanly to this tab even though it nests further tabs.
    const businessTab = page.getByRole("tab", { name: "Cơ sở SXKD" });
    await expect(businessTab).toBeVisible({ timeout: 15_000 });
    await businessTab.click();

    const activeExport = page
      .getByRole("tabpanel")
      .getByRole("button", { name: "Xuất Excel" });
    await expectXlsx(await clickExport(page, activeExport));
  });

  test("GAP-STAT-1 — dashboard report-compliance export (Trạng thái báo cáo theo đơn vị)", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    await page.goto("/dashboard");

    // The compliance card carries its own "Xuất Excel" button
    // (GET /statistics/excel/report-compliance).
    const complianceCard = page
      .locator(".ant-card")
      .filter({ hasText: "Tình hình nộp báo cáo của các đơn vị" });
    await expect(complianceCard).toBeVisible({ timeout: 20_000 });
    const exportButton = complianceCard.getByRole("button", {
      name: "Xuất Excel",
    });
    await expectXlsx(await clickExport(page, exportButton));
  });
});
