/**
 * FR-33-02 — NDTP report roll-up: a higher-tier officer aggregates the food-
 * poisoning figures reported by lower-tier units for the same period, driven
 * through the REAL "Tổng hợp từ báo cáo tuyến dưới" button with no interception.
 *
 * The roll-up must sum the REAL lower-tier reports, not fabricate numbers. To
 * prove that end-to-end the test:
 *   1. reads the real aggregation endpoint as admin (global data scope) to
 *      capture a per-period BASELINE for a pristine future period (2035/6);
 *   2. as a genuine lower-tier account (district.staff), creates a Draft NDTP
 *      report for that period, writes known non-round stats, and runs the real
 *      Draft → Submitted workflow transition — this is the "tuyến dưới" report;
 *   3. reads the aggregation endpoint again as admin and asserts every figure
 *      incremented by exactly the seeded report's values (baseline + 1 report);
 *   4. as admin creates the higher-tier province Draft for the same period,
 *      opens its editor at /reporting, clicks "Tổng hợp từ báo cáo tuyến dưới",
 *      and asserts the form fields populate with the aggregated totals plus the
 *      "Đã tổng hợp từ N báo cáo tuyến dưới" confirmation;
 *   5. saves the report and reloads to prove the rolled-up figures persist in
 *      the real database.
 *
 * Seeding through the real HTTP pipeline (session cookie + antiforgery token →
 * ASP.NET Core → domain workflow → PostgreSQL) is not interception. The district
 * report lands on a child organization (distinct from admin's province org), so
 * the unique {org, year, month} index never collides with the province Draft.
 * Submitted reports are Draft-only-deletable, so teardown walks the workflow
 * back (Return → ReturnToDraft → Delete); it is best-effort because the
 * baseline-delta assertion stays correct across re-runs regardless of residue.
 */

import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from "@playwright/test";
import {
  requestVerificationToken,
  signIn,
  signInAsAdmin,
} from "./helpers/auth";

const NDTP_ENDPOINT = "/api/v1/app/ndtp-report";
const AGGREGATION_ENDPOINT = "/api/v1/app/report-calculation/ndtp-aggregation";
const LOWER_TIER_USER = "district.staff@foodsafe.local";

// A per-run unique future period keeps every run on a pristine period and, more
// importantly, avoids colliding with the unique {org, year, month} index if a
// prior run's best-effort teardown was interrupted. The band 2040–2095 stays
// clear of the far-future demo reports (2098/2099).
const STAMP = Date.now().toString().slice(-9);
const STAMP_NUM = Number(STAMP);
const YEAR = 2040 + (STAMP_NUM % 56);
const MONTH = 1 + (STAMP_NUM % 12);

/** Distinct, non-round figures so a coincidental match is impossible. */
const CHILD_STATS = {
  caseCount: 7,
  caseAffected: 23,
  caseHospitalized: 11,
  caseDeaths: 2,
  incidentCount: 3,
  incidentAffected: 19,
  incidentHospitalized: 8,
  incidentDeaths: 1,
} as const;

type StatKey = keyof typeof CHILD_STATS;
const STAT_KEYS = Object.keys(CHILD_STATS) as StatKey[];

interface AggregatedStats {
  reportCount: number;
  caseCount: number;
  caseAffected: number;
  caseHospitalized: number;
  caseDeaths: number;
  incidentCount: number;
  incidentAffected: number;
  incidentHospitalized: number;
  incidentDeaths: number;
}

interface SeededNdtp {
  id: string;
  organizationId: string;
  status: number;
}

async function fetchAggregation(
  request: APIRequestContext,
): Promise<AggregatedStats> {
  const res = await request.get(
    `${AGGREGATION_ENDPOINT}?PeriodYear=${YEAR}&PeriodMonth=${MONTH}`,
  );
  expect(res.ok(), await res.text()).toBeTruthy();
  return (await res.json()) as AggregatedStats;
}

/** Creates a Draft NDTP report, writes known stats, then submits it. */
async function seedSubmittedChildReport(
  request: APIRequestContext,
  token: string,
  notes: string,
): Promise<SeededNdtp> {
  const headers = { RequestVerificationToken: token };
  const create = await request.post(NDTP_ENDPOINT, {
    headers,
    data: { periodYear: YEAR, periodMonth: MONTH, notes },
    maxRedirects: 0,
  });
  expect(
    create.ok(),
    `create ndtp failed: ${await create.text()}`,
  ).toBeTruthy();
  const created = (await create.json()) as SeededNdtp;
  expect(created.status, "seed must start as Draft").toBe(1);

  const stats = await request.put(`${NDTP_ENDPOINT}/${created.id}/stats`, {
    headers,
    data: CHILD_STATS,
    maxRedirects: 0,
  });
  expect(stats.ok(), `update stats failed: ${await stats.text()}`).toBeTruthy();

  const submit = await request.post(`${NDTP_ENDPOINT}/${created.id}/submit`, {
    headers,
    maxRedirects: 0,
  });
  expect(submit.ok(), `submit failed: ${await submit.text()}`).toBeTruthy();
  const submitted = (await submit.json()) as { status: number };
  expect(submitted.status, "report must be Submitted after /submit").toBe(2);

  return created;
}

/** Creates a Draft NDTP report and returns it (higher-tier officer's report). */
async function createDraftReport(
  request: APIRequestContext,
  token: string,
  notes: string,
): Promise<SeededNdtp> {
  const create = await request.post(NDTP_ENDPOINT, {
    headers: { RequestVerificationToken: token },
    data: { periodYear: YEAR, periodMonth: MONTH, notes },
    maxRedirects: 0,
  });
  expect(
    create.ok(),
    `create ndtp failed: ${await create.text()}`,
  ).toBeTruthy();
  const created = (await create.json()) as SeededNdtp;
  expect(created.status, "province report must start as Draft").toBe(1);
  return created;
}

async function deleteDraft(
  request: APIRequestContext,
  token: string,
  id: string,
): Promise<void> {
  try {
    await request.delete(`${NDTP_ENDPOINT}/${id}`, {
      headers: { RequestVerificationToken: token },
      maxRedirects: 0,
    });
  } catch {
    // Non-fatal: baseline-delta assertions are re-run-safe with residue.
  }
}

/** Best-effort teardown of a Submitted report: Submitted → Returned → Draft → deleted. */
async function teardownSubmitted(
  request: APIRequestContext,
  token: string,
  id: string,
): Promise<void> {
  const headers = { RequestVerificationToken: token };
  try {
    await request.post(`${NDTP_ENDPOINT}/${id}/return`, {
      headers,
      data: { returnReason: "e2e ndtp-rollup cleanup" },
      maxRedirects: 0,
    });
    await request.post(`${NDTP_ENDPOINT}/${id}/return-to-draft`, {
      headers,
      maxRedirects: 0,
    });
    await request.delete(`${NDTP_ENDPOINT}/${id}`, {
      headers,
      maxRedirects: 0,
    });
  } catch {
    // Non-fatal: baseline-delta assertions are re-run-safe with residue.
  }
}

/**
 * Filters the active NDTP tab to YEAR and opens the period's Draft editor.
 *
 * AntD InputNumber (rc-input-number) fires onChange on real keystrokes, not on
 * Playwright's value-setting fill(), so the year is typed with pressSequentially.
 * Both the province Draft and district Submitted reports share the period text,
 * but only the Draft row exposes a "Sửa" button, so the edit locator is unique.
 */
async function openDraftEditor(page: Page): Promise<void> {
  // Only the active (NĐTP) tab pane is rendered by AntD Tabs, so the year filter
  // is unique at page level — scoping to .ant-tabs-tabpane-active is unreliable
  // because AntD applies the active class after a transition.
  const yearInput = page.getByPlaceholder("Năm");
  await yearInput.click();
  await yearInput.pressSequentially(String(YEAR));
  await yearInput.press("Enter");
  // "Sửa" is in overflow (inline slots are Xem chi tiết + Xem văn bản). Filter to
  // the Draft row so the overflow button is unambiguous when a Submitted row for
  // the same period is also visible (district child report).
  const draftRow = page
    .getByRole("row")
    .filter({ hasText: `Tháng ${MONTH}/${YEAR}` })
    .filter({ has: page.locator(".ant-tag", { hasText: "Nháp" }) });
  const overflowBtn = draftRow.getByRole("button", {
    name: `Thao tác Tháng ${MONTH}/${YEAR}`,
  });
  await expect(overflowBtn).toHaveCount(1, { timeout: 20_000 });
  await overflowBtn.click();
  await page.getByRole("menuitem", { name: "Sửa" }).click();
  await expect(page.getByRole("dialog")).toContainText(
    `Sửa báo cáo NĐTP — Tháng ${MONTH}/${YEAR}`,
  );
}

test.describe("FR-33-02 — NDTP roll-up from lower-tier reports", () => {
  test.setTimeout(150_000);
  // Bound individual actions/navigations so a stuck locator surfaces its call
  // log instead of silently consuming the whole test budget.
  test.use({ actionTimeout: 20_000, navigationTimeout: 30_000 });

  test("higher-tier officer aggregates real lower-tier NDTP figures", async ({
    page,
    browser,
  }) => {
    const password = process.env.E2E_ADMIN_PASSWORD;
    expect(password, "E2E_ADMIN_PASSWORD is required").toBeTruthy();

    await signInAsAdmin(page);
    const adminToken = await requestVerificationToken(page);

    // 1) Baseline for the pristine period, read with admin's global scope.
    const baseline = await fetchAggregation(page.context().request);

    const districtCtx = await browser.newContext();
    let child: SeededNdtp | undefined;
    let province: SeededNdtp | undefined;
    let districtRequest: APIRequestContext | undefined;
    let districtToken: string | undefined;
    try {
      // 2) A genuine lower-tier account seeds + submits one report.
      const districtPage = await districtCtx.newPage();
      await signIn(districtPage, LOWER_TIER_USER, password as string);
      districtRequest = districtPage.context().request;
      districtToken = await requestVerificationToken(districtPage);
      child = await seedSubmittedChildReport(
        districtRequest,
        districtToken,
        `E2E-NDTP-CHILD-${STAMP}`,
      );

      // 3) Admin's system-wide aggregation must reflect the seeded report.
      const after = await fetchAggregation(page.context().request);
      expect(after.reportCount, "one more non-draft report in the period").toBe(
        baseline.reportCount + 1,
      );
      for (const key of STAT_KEYS) {
        expect(after[key], `aggregated ${key}`).toBe(
          baseline[key] + CHILD_STATS[key],
        );
      }

      // 4) Higher-tier officer's own Draft for the same period (different org).
      province = await createDraftReport(
        page.context().request,
        adminToken,
        `E2E-NDTP-PROVINCE-${STAMP}`,
      );
      expect(
        province.organizationId,
        "province report is on a different org than the child report",
      ).not.toBe(child.organizationId);

      // Roll-up through the real editor UI.
      await page.goto("/reporting");
      await openDraftEditor(page);

      const dialog = page.getByRole("dialog");
      const aggPromise = page.waitForResponse(
        (r) =>
          r.url().includes("/report-calculation/ndtp-aggregation") &&
          r.request().method() === "GET",
      );
      await dialog
        .getByRole("button", { name: "Tổng hợp từ báo cáo tuyến dưới" })
        .click();
      expect((await aggPromise).status()).toBe(200);

      await expect(
        page.getByText(
          new RegExp(`Đã tổng hợp từ ${after.reportCount} báo cáo tuyến dưới`),
        ),
      ).toBeVisible({ timeout: 8_000 });

      // The form fields now hold the aggregated totals from the real endpoint.
      for (const key of STAT_KEYS) {
        await expect(
          dialog.locator(`#${key}`),
          `form field ${key} populated from roll-up`,
        ).toHaveValue(String(after[key]));
      }

      // 5) Save and reload — the rolled-up figures persist in the real DB.
      await dialog.getByRole("button", { name: "Lưu", exact: true }).click();
      await expect(dialog).toBeHidden({ timeout: 15_000 });

      await page.reload();
      await openDraftEditor(page);
      const reopened = page.getByRole("dialog");
      await expect(reopened.locator("#caseCount")).toHaveValue(
        String(after.caseCount),
      );
      await expect(reopened.locator("#incidentCount")).toHaveValue(
        String(after.incidentCount),
      );
    } finally {
      if (province) {
        await deleteDraft(page.context().request, adminToken, province.id);
      }
      if (child && districtRequest && districtToken) {
        await teardownSubmitted(districtRequest, districtToken, child.id);
      }
      await districtCtx.close();
    }
  });
});
