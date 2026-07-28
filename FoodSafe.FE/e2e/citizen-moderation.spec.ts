import { expect, test, type Locator, type Page } from "@playwright/test";
import { requestVerificationToken, signInAsAdmin } from "./helpers/auth";

// FR-29-06 (citizen alert moderation) + FR-30-07 (citizen news approval).
//
// Citizen submissions are SEEDED over real HTTP against the real public
// endpoints (/api/v1/public/*-reports). This is NOT interception: the request
// travels through the real Cloudflare-Turnstile captcha middleware (which
// accepts any non-empty token in non-production because the test secret key
// always returns success), the real application service, the real domain
// factory, and persists to the real PostgreSQL database. The real /gui-tin and
// /gui-phan-anh browser forms cannot be used to seed because the third-party
// Turnstile *widget* does not resolve to a token in this headless environment
// (proven: the submit POST never fires, page.waitForResponse times out) — that
// is an environment limitation of the external widget, not a product defect.
//
// The subject under test — the OFFICER-side moderation queue and the accept /
// reject decisions — is driven entirely through the real browser UI against the
// real backend, with persistence re-checked after a full page reload.

const CMOD_PREFIX = "E2E-CMOD";

interface SeedResult {
  id: string;
}

interface AlertListItem {
  id: string;
  title: string;
  status: number;
}

/** Seed a citizen submission through the real public endpoint (captcha bypass). */
async function seedCitizenSubmission(
  page: Page,
  endpoint: string,
  data: Record<string, unknown>,
): Promise<string> {
  const anonCtx = await page.context().browser()!.newContext();
  try {
    // Prime the XSRF cookie (required for the antiforgery-protected POST).
    await anonCtx.request.get("/abp/application-configuration");
    const xsrfCookie = (await anonCtx.cookies()).find(
      (cookie) => cookie.name === "XSRF-TOKEN",
    );
    const xsrfToken = xsrfCookie ? decodeURIComponent(xsrfCookie.value) : "";

    const response = await anonCtx.request.post(endpoint, {
      headers: xsrfToken ? { RequestVerificationToken: xsrfToken } : {},
      data,
      maxRedirects: 0,
    });
    expect(
      response.ok(),
      `citizen seed failed (${endpoint}): ${await response.text()}`,
    ).toBeTruthy();
    const body = (await response.json()) as SeedResult;
    expect(body.id, "citizen seed returned no id").toBeTruthy();
    return body.id;
  } finally {
    await anonCtx.close();
  }
}

/** The visible Ant Design tab panel for a given tab label (inactive panels are hidden). */
function tabPanel(page: Page, name: string): Locator {
  return page.getByRole("tabpanel", { name });
}

/** Open the "Nguồn" (source) filter within a panel and choose "Từ dân" (PublicReport). */
async function filterBySourcePublicReport(panel: Locator): Promise<void> {
  const page = panel.page();
  // Click the whole AntD select (identified by the "Nguồn" placeholder text it
  // contains). The placeholder span itself has pointer-events:none, so target
  // the outer clickable .ant-select box instead.
  await panel.locator(".ant-select").filter({ hasText: "Nguồn" }).click();
  const dropdown = page.locator(".ant-select-dropdown:visible");
  await dropdown.getByText("Từ dân", { exact: true }).click();
}

/** Best-effort API cleanup of any leftover Draft citizen alerts from prior runs. */
async function cleanupDraftCitizenAlerts(page: Page): Promise<void> {
  const headers = {
    RequestVerificationToken: await requestVerificationToken(page),
  };
  const response = await page
    .context()
    .request.get(
      `/api/v1/app/atp-alert?Filter=${encodeURIComponent(CMOD_PREFIX)}&MaxResultCount=100`,
    );
  if (!response.ok()) return;
  const { items } = (await response.json()) as { items: AlertListItem[] };
  for (const item of items) {
    if (item.title.startsWith(CMOD_PREFIX) && item.status === 1 /* Draft */) {
      await page.context().request.delete(`/api/v1/app/atp-alert/${item.id}`, {
        headers,
        maxRedirects: 0,
      });
    }
  }
}

test.describe("citizen submission moderation", () => {
  test.setTimeout(90_000);

  // FR-30-07 — an officer approves (publishes) a citizen news submission from
  // the moderation queue, and the Published status survives a browser reload.
  test("news approval: citizen news report is published by officer via the UI", async ({
    page,
  }) => {
    const stamp = Date.now().toString().slice(-9);
    const title = `${CMOD_PREFIX}-NEWS-${stamp}`;

    await seedCitizenSubmission(page, "/api/v1/public/news-reports", {
      title,
      content:
        "Phản ánh của người dân về một cơ sở kinh doanh thực phẩm nghi mất vệ sinh.",
      reporterName: "Người dân E2E",
      reporterContact: "0900000000",
      captchaToken: "e2e-test-bypass-token",
    });

    await signInAsAdmin(page);
    await page.goto("/alerts-news");

    // Enter the news moderation queue.
    await page.getByRole("tab", { name: "Tin tức ATTP" }).click();
    let panel = tabPanel(page, "Tin tức ATTP");
    await filterBySourcePublicReport(panel);
    await panel.getByPlaceholder(/Tìm theo tiêu đề/).fill(title);

    // The seeded citizen news appears as a Draft awaiting moderation.
    let row = page.getByRole("row").filter({ hasText: stamp });
    await expect(
      row.locator(".ant-tag").filter({ hasText: "Nháp" }),
    ).toBeVisible({ timeout: 10_000 });

    // Approve → publish, confirming the modal.
    await row.getByRole("button", { name: /Xuất bản/ }).click();
    await page.getByRole("button", { name: "OK" }).click();

    row = page.getByRole("row").filter({ hasText: stamp });
    await expect(
      row.locator(".ant-tag").filter({ hasText: "Đã xuất bản" }),
    ).toBeVisible({ timeout: 10_000 });

    // Persistence: reload and re-enter the queue; the status must stick.
    await page.reload();
    await page.getByRole("tab", { name: "Tin tức ATTP" }).click();
    panel = tabPanel(page, "Tin tức ATTP");
    await filterBySourcePublicReport(panel);
    await panel.getByPlaceholder(/Tìm theo tiêu đề/).fill(title);
    row = page.getByRole("row").filter({ hasText: stamp });
    await expect(
      row.locator(".ant-tag").filter({ hasText: "Đã xuất bản" }),
    ).toBeVisible({ timeout: 10_000 });
    // Cleanup for Published news (not API-deletable) is done out-of-band via SQL
    // keyed on the E2E-CMOD title prefix.
  });

  // FR-29-06 — an officer moderates the citizen alert queue and REJECTS a
  // submission (Draft-only delete), which removes it from the queue.
  test("alert moderation: citizen alert report is rejected by officer via the UI", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    await cleanupDraftCitizenAlerts(page);

    const stamp = Date.now().toString().slice(-9);
    const title = `${CMOD_PREFIX}-ALERT-${stamp}`;
    const alertId = await seedCitizenSubmission(
      page,
      "/api/v1/public/alert-reports",
      {
        title,
        content: "Phát hiện thực phẩm không đảm bảo vệ sinh tại một điểm bán.",
        category: 1,
        captchaToken: "e2e-test-bypass-token",
      },
    );

    try {
      await page.goto("/alerts-news");
      // Alerts tab is the default; enter the alert moderation queue.
      const panel = tabPanel(page, "Cảnh báo VSATTP");
      await filterBySourcePublicReport(panel);
      await panel.getByPlaceholder(/Tìm theo tiêu đề, số cảnh báo/).fill(title);

      // The seeded citizen alert appears as a Draft, tagged source "Từ dân".
      const row = page.getByRole("row").filter({ hasText: stamp });
      await expect(row).toContainText("Từ dân", { timeout: 10_000 });
      await expect(
        row.locator(".ant-tag").filter({ hasText: "Nháp" }),
      ).toBeVisible({ timeout: 10_000 });

      // Reject the submission (Draft-only delete) — open overflow then confirm the modal.
      await row.getByRole("button", { name: `Thao tác ${title}` }).click();
      await page.getByRole("menuitem", { name: "Xóa" }).click();
      await page.getByRole("button", { name: "OK" }).click();

      // The rejected submission leaves the moderation queue.
      await expect(
        page.getByRole("row").filter({ hasText: stamp }),
      ).toHaveCount(0, { timeout: 10_000 });
    } finally {
      // Idempotent safety net if the UI rejection did not remove it.
      const headers = {
        RequestVerificationToken: await requestVerificationToken(page),
      };
      await page.context().request.delete(`/api/v1/app/atp-alert/${alertId}`, {
        headers,
        maxRedirects: 0,
      });
    }
  });
});
