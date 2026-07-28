/**
 * FR-34-10 — ATTP work-report auto-aggregation ("Tự tính số liệu từ hệ thống"),
 * driven through the REAL editor button with no interception.
 *
 * The ATTP work report has a "Tự tính số liệu từ hệ thống" button that calls
 * GET /report-calculation/atp-work-stats, which counts live system data for the
 * report's period (businesses, licences, inspections, poisoning, …) scoped to
 * the caller, and fills the form. To prove the numbers are REAL — computed from
 * live data, not hard-coded — the test:
 *   1. reads the real atp-work-stats endpoint for a FullYear/2026 BASELINE;
 *   2. seeds ONE business over real HTTP (its CreationTime = now, which falls in
 *      the 2026 annual period → it must be counted);
 *   3. reads the endpoint again and asserts `totalBusinesses` and `newBusinesses`
 *      each incremented by exactly one (baseline + 1), and that the totals are
 *      non-zero real figures;
 *   4. seeds a Draft ATTP report, opens it in the real browser, clicks the real
 *      "Tự tính số liệu từ hệ thống" button, and asserts the form fields populate
 *      with EXACTLY the values the endpoint returned to the browser;
 *   5. saves and re-opens after a full page reload to confirm persistence.
 *
 * Seeding through the real authenticated pipeline (session cookie + antiforgery
 * token → ASP.NET Core → EF Core → PostgreSQL) is not interception. The seeded
 * report is a Draft the whole time (directly deletable) and the business is
 * deleted in teardown; the baseline-delta assertion stays re-run-safe regardless.
 */

import { expect, test, type Page } from "@playwright/test";
import { requestVerificationToken, signInAsAdmin } from "./helpers/auth";

const ATP_ENDPOINT = "/api/v1/app/atp-work-report";
const BUSINESS_ENDPOINT = "/api/v1/app/business";
const STATS_ENDPOINT = "/api/v1/app/report-calculation/atp-work-stats";
const PROVINCE_ORG_ID = "e2e00000-0000-4000-8010-000000000001";
const PERIOD_TYPE_FULL_YEAR = 2;
const YEAR = 2026;
const STAMP = Date.now().toString().slice(-9);

interface AtpStats {
  totalBusinesses: number;
  newBusinesses: number;
  inactiveBusinesses: number;
  businessesWithCertificate: number;
  dkcbIssued: number;
  selfDeclarationsReceived: number;
  adRegistrationsIssued: number;
  eligibilityCertificatesIssued: number;
  cfsIssued: number;
  exportCertificatesIssued: number;
  totalInspectionPlans: number;
  businessesInspected: number;
  violationsFound: number;
  finesIssued: number;
  fineTotalAmount: number;
  poisoningCaseCount: number;
  poisoningIncidentCount: number;
  totalAffected: number;
  totalDeaths: number;
}

/** Reads the real ATTP auto-calc endpoint for the FullYear/2026 period. */
async function fetchStats(page: Page): Promise<AtpStats> {
  const res = await page
    .context()
    .request.get(
      `${STATS_ENDPOINT}?PeriodType=${PERIOD_TYPE_FULL_YEAR}&PeriodYear=${YEAR}`,
    );
  expect(res.ok(), await res.text()).toBeTruthy();
  return (await res.json()) as AtpStats;
}

/** Opens the ATTP tab and the (single) Draft report's editor. */
async function openDraftEditor(page: Page): Promise<void> {
  await page.getByRole("tab", { name: "Công tác ATTP" }).click();
  // "Sửa" is in overflow (inline slots are Xem chi tiết + Xem văn bản).
  // With no other live ATTP reports, this overflow button is the only one on the tab.
  // FullYear/2026 → overflowAriaLabel = "Thao tác Cả năm 2026".
  const overflowBtn = page.getByRole("button", {
    name: `Thao tác Cả năm ${YEAR}`,
  });
  await expect(overflowBtn).toHaveCount(1, { timeout: 20_000 });
  await overflowBtn.click();
  await page.getByRole("menuitem", { name: "Sửa" }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "Sửa báo cáo Công tác ATTP",
  );
}

test.describe("FR-34-10 — ATTP work-report auto-aggregation", () => {
  test.setTimeout(120_000);
  test.use({ actionTimeout: 20_000, navigationTimeout: 30_000 });

  test('"Tự tính số liệu" fills the report from real live system data', async ({
    page,
  }) => {
    await signInAsAdmin(page);
    const headers = {
      RequestVerificationToken: await requestVerificationToken(page),
    };

    // 1) Baseline — the auto-calc figures before any seed.
    const baseline = await fetchStats(page);

    let businessId: string | undefined;
    let reportId: string | undefined;
    try {
      // 2) Seed ONE business over real HTTP. Its CreationTime is "now", which
      //    lands inside the 2026 annual period, so the auto-calc must count it.
      const bizRes = await page.context().request.post(BUSINESS_ENDPOINT, {
        headers,
        maxRedirects: 0,
        data: {
          organizationId: PROVINCE_ORG_ID,
          code: `E2E-ATP-${STAMP}`,
          name: `E2E ATP auto-calc ${STAMP}`,
          productGroupIds: [],
        },
      });
      expect(bizRes.ok(), await bizRes.text()).toBeTruthy();
      businessId = ((await bizRes.json()) as { id: string }).id;

      // 3) The endpoint must now reflect that seeded business.
      const after = await fetchStats(page);
      expect(
        after.totalBusinesses,
        "auto-calc totalBusinesses counts the seeded business",
      ).toBe(baseline.totalBusinesses + 1);
      expect(
        after.newBusinesses,
        "auto-calc newBusinesses counts the in-period seeded business",
      ).toBe(baseline.newBusinesses + 1);
      expect(
        after.totalBusinesses,
        "auto-calc returns real non-zero system data",
      ).toBeGreaterThan(0);

      // 4) Seed a Draft ATTP report to edit (stays Draft = editable).
      const rptRes = await page.context().request.post(ATP_ENDPOINT, {
        headers,
        maxRedirects: 0,
        data: {
          periodType: PERIOD_TYPE_FULL_YEAR,
          periodYear: YEAR,
          notes: `E2E-ATP-${STAMP}`,
        },
      });
      expect(rptRes.ok(), await rptRes.text()).toBeTruthy();
      const report = (await rptRes.json()) as { id: string; status: number };
      expect(report.status, "seed must start as Draft").toBe(1);
      reportId = report.id;

      // 5) Open the report in the real browser.
      await page.goto("/reporting");
      await openDraftEditor(page);
      const dialog = page.getByRole("dialog");

      // 6) Click the real auto-calc button; capture the exact endpoint response.
      const statsPromise = page.waitForResponse(
        (r) =>
          r.url().includes("/report-calculation/atp-work-stats") &&
          r.request().method() === "GET",
      );
      await dialog.getByRole("button", { name: "Tự tính số liệu" }).click();
      const statsResponse = await statsPromise;
      expect(statsResponse.status()).toBe(200);
      const browserStats = (await statsResponse.json()) as AtpStats;
      expect(
        browserStats.totalBusinesses,
        "browser auto-calc returns real non-zero data",
      ).toBeGreaterThan(0);
      await expect(
        page.getByText("Đã tự tính số liệu từ dữ liệu hệ thống"),
      ).toBeVisible();

      // The form must populate with EXACTLY what the endpoint returned.
      await expect(dialog.locator("#totalBusinesses")).toHaveValue(
        String(browserStats.totalBusinesses),
      );
      await expect(dialog.locator("#newBusinesses")).toHaveValue(
        String(browserStats.newBusinesses),
      );
      await expect(dialog.locator("#businessesInspected")).toHaveValue(
        String(browserStats.businessesInspected),
      );

      // 7) Save, then confirm persistence after a full browser reload.
      await dialog.getByRole("button", { name: "Lưu", exact: true }).click();
      await expect(dialog).toBeHidden();

      await page.reload();
      await openDraftEditor(page);
      await expect(
        page.getByRole("dialog").locator("#totalBusinesses"),
      ).toHaveValue(String(browserStats.totalBusinesses));
    } finally {
      if (reportId) {
        await page
          .context()
          .request.delete(`${ATP_ENDPOINT}/${reportId}`, {
            headers,
            maxRedirects: 0,
          })
          .catch(() => undefined);
      }
      if (businessId) {
        await page
          .context()
          .request.delete(`${BUSINESS_ENDPOINT}/${businessId}`, {
            headers,
            maxRedirects: 0,
          })
          .catch(() => undefined);
      }
    }
  });
});
