/**
 * FR-39-03 (view each unit's ATTP work-report submission status) + FR-39-04
 * (view each unit's Action-Month report submission status), driven through the
 * REAL dashboard "Tình hình nộp báo cáo của các đơn vị" compliance widget with
 * no interception.
 *
 * The widget aggregates, per organization, how many required reports have been
 * submitted (Status != Draft) for the year. To prove the numbers are REAL and
 * driven by real report state — not hard-coded — the test:
 *   1. reads the real compliance endpoint to capture a per-org BASELINE;
 *   2. seeds + submits one ATTP work report and one Action-Month report for the
 *      officer's own organization through the real authenticated admin API
 *      (create → Draft, then the real /submit workflow transition → Submitted);
 *   3. reads the compliance endpoint again and asserts the seeded org's ATTP and
 *      Action-Month counts each incremented by exactly one (baseline + 1);
 *   4. opens the real /dashboard in the browser and asserts that same org's row
 *      shows the post-seed counts in the "BC công tác ATTP" (FR-39-03) and
 *      "BC Tháng hành động" (FR-39-04) progress cells, and that they survive a
 *      full page reload.
 *
 * Seeding through the real HTTP pipeline (session cookie + antiforgery token →
 * ASP.NET Core → domain workflow → PostgreSQL) is not interception. Submitted
 * reports are Draft-only-deletable, so teardown walks the real workflow back
 * (Return → ReturnToDraft → Delete); it is best-effort because the baseline-delta
 * assertion above stays correct across re-runs regardless of residue.
 */

import { expect, test, type Page } from "@playwright/test";
import { requestVerificationToken, signInAsAdmin } from "./helpers/auth";

const COMPLIANCE_ENDPOINT = "/api/v1/app/dashboard/report-compliance";
const ATP_ENDPOINT = "/api/v1/app/atp-work-report";
const AMR_ENDPOINT = "/api/v1/app/action-month-report";
// A per-run future period: reports are unique per (organisation, period), so a
// fixed year collides with leftovers from an earlier run whose teardown failed.
// The dashboard's own year filter defaults to the current year, so the seeded
// reports must live in it for the widget to show them. Reports are unique per
// (organisation, period), so any leftover from an earlier run is cleared first.
const YEAR = new Date().getFullYear();

interface ComplianceRow {
  organizationId: string;
  organizationName: string;
  ndtpSubmittedMonths: number;
  ndtpExpectedMonths: number;
  atpWorkSubmitted: number;
  atpWorkExpected: number;
  actionMonthSubmitted: number;
  actionMonthExpected: number;
}

interface SeededReport {
  id: string;
  organizationId: string;
}

/** Reads the real compliance endpoint, keyed by organization id. */
async function fetchCompliance(page: Page): Promise<Map<string, ComplianceRow>> {
  const res = await page.context().request.get(
    `${COMPLIANCE_ENDPOINT}?Year=${YEAR}`,
  );
  expect(res.ok(), await res.text()).toBeTruthy();
  const body = (await res.json()) as { items: ComplianceRow[] };
  return new Map(body.items.map((row) => [row.organizationId, row]));
}

/** Creates a Draft report at `endpoint`, then submits it (Draft → Submitted). */
async function seedSubmittedReport(
  page: Page,
  token: string,
  endpoint: string,
  data: Record<string, unknown>,
): Promise<SeededReport> {
  const headers = { RequestVerificationToken: token };
  const create = await page.context().request.post(endpoint, {
    headers,
    data,
    maxRedirects: 0,
  });
  expect(create.ok(), `create ${endpoint} failed: ${await create.text()}`)
    .toBeTruthy();
  const created = (await create.json()) as SeededReport & { status: number };
  expect(created.status, "seed must start as Draft").toBe(1);

  // ATP-work and Action-Month reports now pass an internal approval gate
  // before they may be submitted to the upper level.
  const internalApprove = await page.context().request.post(
    `${endpoint}/${created.id}/internally-approve`,
    { headers, maxRedirects: 0 },
  );
  expect(
    internalApprove.ok(),
    `internally-approve ${endpoint} failed: ${await internalApprove.text()}`,
  ).toBeTruthy();

  const submit = await page.context().request.post(
    `${endpoint}/${created.id}/submit`,
    { headers, maxRedirects: 0 },
  );
  expect(submit.ok(), `submit ${endpoint} failed: ${await submit.text()}`)
    .toBeTruthy();
  const submitted = (await submit.json()) as { status: number };
  expect(submitted.status, "report must be Submitted after /submit").toBe(2);

  return { id: created.id, organizationId: created.organizationId };
}

/** Best-effort teardown: Submitted → Returned → Draft → deleted. */
async function teardownReport(
  page: Page,
  token: string,
  endpoint: string,
  id: string,
): Promise<void> {
  const headers = { RequestVerificationToken: token };
  try {
    await page.context().request.post(`${endpoint}/${id}/return`, {
      headers,
      data: { returnReason: "e2e compliance-widget cleanup" },
      maxRedirects: 0,
    });
    await page.context().request.post(`${endpoint}/${id}/return-to-draft`, {
      headers,
      maxRedirects: 0,
    });
    await page.context().request.delete(`${endpoint}/${id}`, {
      headers,
      maxRedirects: 0,
    });
  } catch {
    // Non-fatal: the baseline-delta assertion is re-run-safe with residue.
  }
}

test.describe("FR-39-03 / FR-39-04 — dashboard report-compliance widget", () => {
  test.setTimeout(90_000);

  test("per-unit ATTP + Action-Month submission counts reflect real report state", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    const token = await requestVerificationToken(page);
    const stamp = Date.now().toString().slice(-9);
    const notes = `E2E-COMPLIANCE-${stamp}`;

    // 1) Baseline — the officer's org counts before any seed.
    const baseline = await fetchCompliance(page);

    // Clear leftovers from an earlier run whose teardown did not complete —
    // otherwise the period-uniqueness rule refuses the seed below.
    for (const endpoint of [ATP_ENDPOINT, AMR_ENDPOINT]) {
      const existing = await page.context().request.get(
        `${endpoint}?PeriodYear=${YEAR}&MaxResultCount=50`,
      );
      if (!existing.ok()) continue;
      const items = ((await existing.json()) as { items: { id: string }[] })
        .items;
      for (const item of items) {
        await teardownReport(page, token, endpoint, item.id);
      }
    }

    let atp: SeededReport | undefined;
    let amr: SeededReport | undefined;
    try {
      // 2) Seed + submit one report of each tracked kind for the current year.
      atp = await seedSubmittedReport(page, token, ATP_ENDPOINT, {
        periodType: 2, // FullYear — no half required
        periodYear: YEAR,
        notes,
      });
      amr = await seedSubmittedReport(page, token, AMR_ENDPOINT, {
        periodYear: YEAR,
        notes,
      });
      // Both derive the org from the officer's data scope → same organization.
      expect(amr.organizationId).toBe(atp.organizationId);
      const orgId = atp.organizationId;

      // 3) The compliance endpoint must now show +1 for both report kinds.
      const after = await fetchCompliance(page);
      const base = baseline.get(orgId);
      const row = after.get(orgId);
      expect(row, "seeded org must appear in the compliance list").toBeTruthy();
      const afterRow = row as ComplianceRow;
      const baseAtp = base?.atpWorkSubmitted ?? 0;
      const baseAmr = base?.actionMonthSubmitted ?? 0;
      expect(afterRow.atpWorkSubmitted, "FR-39-03 ATTP count").toBe(baseAtp + 1);
      expect(afterRow.actionMonthSubmitted, "FR-39-04 Action-Month count").toBe(
        baseAmr + 1,
      );

      const orgName = afterRow.organizationName;
      const atpText = `${afterRow.atpWorkSubmitted}/${afterRow.atpWorkExpected}`;
      const amrText = `${afterRow.actionMonthSubmitted}/${afterRow.actionMonthExpected}`;

      // 4) The real dashboard renders those same counts in the org's row.
      const compliancePromise = page.waitForResponse(
        (r) =>
          r.url().includes(COMPLIANCE_ENDPOINT) &&
          r.request().method() === "GET",
      );
      await page.goto("/dashboard");
      expect((await compliancePromise).status()).toBe(200);

      const card = page
        .locator(".ant-card")
        .filter({ hasText: "Tình hình nộp báo cáo" });
      await expect(card).toBeVisible({ timeout: 15_000 });

      const assertRow = async () => {
        const orgRow = card.getByRole("row").filter({ hasText: orgName });
        // Each progress bar exposes its "submitted/expected" as its accessible
        // name. Column order: BC NĐTP | BC công tác ATTP | BC Tháng hành động.
        const bars = orgRow.getByRole("progressbar");
        await expect(
          bars.nth(1),
          "FR-39-03 — ATTP work-report progress",
        ).toContainText(atpText, { timeout: 10_000 });
        await expect(
          bars.nth(2),
          "FR-39-04 — Action-Month report progress",
        ).toContainText(amrText);
      };

      await assertRow();

      // Persistence: the counts must survive a full browser reload.
      await page.reload();
      await expect(card).toBeVisible({ timeout: 15_000 });
      await assertRow();
    } finally {
      if (atp) await teardownReport(page, token, ATP_ENDPOINT, atp.id);
      if (amr) await teardownReport(page, token, AMR_ENDPOINT, amr.id);
    }
  });
});
