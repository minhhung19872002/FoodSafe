/**
 * FR-29-06 / FR-30-07 (YCKT STT 29–30: "Duyệt cảnh báo / tin tức do người dân
 * gửi lên") — the REFUSAL branch of citizen moderation, against the REAL stack
 * with no interception.
 *
 * Before this flow existed the only way to say "no" was a hard delete, which
 * destroyed the evidence trail. Now: Nháp (Draft) → Đã từ chối (Rejected) with a
 * mandatory reason; the record is kept, auditable, and never becomes public.
 *
 * Citizen submissions are seeded over real HTTP through the real captcha-gated
 * public endpoints (see citizen-moderation.spec.ts for why the third-party
 * Turnstile widget cannot be driven headlessly). Everything under test — the
 * officer decision, its persistence, and public invisibility — runs through the
 * real browser UI and the real backend.
 */

import { expect, test, type Locator, type Page } from "@playwright/test";
import { requestVerificationToken, signInAsAdmin } from "./helpers/auth";

const PREFIX = "E2E-REJECT";
const ALERT_API = "/api/v1/app/atp-alert";
const NEWS_API = "/api/v1/app/atp-news";

const STATUS_REJECTED = 4;

interface SeedResult {
  id: string;
}
interface ModeratedDto {
  id: string;
  status: number;
  rejectedReason?: string;
  rejectedAt?: string;
  rejectedById?: string;
  isPublic: boolean;
}

async function seedCitizenSubmission(
  page: Page,
  endpoint: string,
  data: Record<string, unknown>,
): Promise<string> {
  const anonCtx = await page.context().browser()!.newContext();
  try {
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
    return ((await response.json()) as SeedResult).id;
  } finally {
    await anonCtx.close();
  }
}

function tabPanel(page: Page, name: string): Locator {
  return page.getByRole("tabpanel", { name });
}

async function filterBySourcePublicReport(panel: Locator): Promise<void> {
  const page = panel.page();
  await panel.locator(".ant-select").filter({ hasText: "Nguồn" }).click();
  const dropdown = page.locator(".ant-select-dropdown:visible");
  await dropdown.getByText("Từ dân", { exact: true }).click();
}

async function readRecord(
  page: Page,
  api: string,
  id: string,
): Promise<ModeratedDto> {
  const resp = await page.context().request.get(`${api}/${id}`);
  expect(resp.status(), await resp.text()).toBe(200);
  return (await resp.json()) as ModeratedDto;
}

/** Drive the shared reason modal: empty submit is refused, then a real reason. */
async function rejectWithReason(page: Page, reason: string): Promise<void> {
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  // The confirm button stays disabled until a reason is typed.
  await expect(dialog.getByRole("button", { name: "Từ chối" })).toBeDisabled();
  await dialog.getByRole("textbox").fill(reason);
  await dialog.getByRole("button", { name: "Từ chối" }).click();
}

test.describe("citizen moderation — reject with reason", () => {
  test.setTimeout(120_000);

  test("alert: officer rejects a citizen report and the decision is kept, auditable and non-public", async ({
    page,
  }) => {
    const stamp = Date.now().toString().slice(-9);
    const title = `${PREFIX}-ALERT-${stamp}`;
    const reason = `Thông tin chưa đủ căn cứ xác minh ${stamp}`;

    const alertId = await seedCitizenSubmission(
      page,
      "/api/v1/public/alert-reports",
      {
        title,
        content: "Phản ánh nghi ngờ mất vệ sinh tại một điểm bán thực phẩm.",
        category: 1,
        captchaToken: "e2e-test-bypass-token",
      },
    );

    await signInAsAdmin(page);
    await page.goto("/alerts-news");
    const panel = tabPanel(page, "Cảnh báo VSATTP");
    await filterBySourcePublicReport(panel);
    await panel.getByPlaceholder(/Tìm theo tiêu đề, số cảnh báo/).fill(title);

    const row = page.getByRole("row").filter({ hasText: stamp });
    await expect(
      row.locator(".ant-tag").filter({ hasText: "Nháp" }),
    ).toBeVisible({ timeout: 15_000 });

    // Reject through the real UI (overflow menu → reason modal).
    await row.getByRole("button", { name: `Thao tác ${title}` }).click();
    await page.getByRole("menuitem", { name: "Từ chối" }).click();
    await rejectWithReason(page, reason);
    await expect(
      page.getByText("Đã từ chối cảnh báo.", { exact: true }),
    ).toBeVisible({ timeout: 15_000 });

    // The record is KEPT with the refusal status — not deleted.
    const stored = await readRecord(page, ALERT_API, alertId);
    expect(stored.status).toBe(STATUS_REJECTED);
    expect(stored.rejectedReason).toBe(reason);
    expect(stored.rejectedAt).toBeTruthy();
    expect(stored.rejectedById).toBeTruthy();
    expect(stored.isPublic).toBeFalsy();

    // Persistence after a full browser reload.
    await page.reload();
    const reloaded = tabPanel(page, "Cảnh báo VSATTP");
    await filterBySourcePublicReport(reloaded);
    await reloaded
      .getByPlaceholder(/Tìm theo tiêu đề, số cảnh báo/)
      .fill(title);
    await expect(
      page
        .getByRole("row")
        .filter({ hasText: stamp })
        .locator(".ant-tag")
        .filter({ hasText: "Đã từ chối" }),
    ).toBeVisible({ timeout: 15_000 });

    // A rejected draft is terminal — publishing it is refused by the backend.
    const republish = await page.context().request.post(
      `${ALERT_API}/${alertId}/publish`,
      {
        headers: {
          RequestVerificationToken: await requestVerificationToken(page),
        },
        data: { isPublic: true },
        maxRedirects: 0,
      },
    );
    expect(republish.status()).toBe(403);
    expect(await republish.text()).toContain("FoodSafe:Alert:0002");

    // It never reaches the anonymous public portal.
    const anonCtx = await page.context().browser()!.newContext();
    try {
      const publicList = await anonCtx.request.get(
        `/api/v1/public/content/alerts?MaxResultCount=100`,
      );
      if (publicList.ok()) {
        expect(await publicList.text()).not.toContain(title);
      }
    } finally {
      await anonCtx.close();
    }
  });

  test("news: officer rejects a citizen news report with a mandatory reason", async ({
    page,
  }) => {
    const stamp = Date.now().toString().slice(-9);
    const title = `${PREFIX}-NEWS-${stamp}`;
    const reason = `Nội dung trùng lặp với tin đã đăng ${stamp}`;

    const newsId = await seedCitizenSubmission(
      page,
      "/api/v1/public/news-reports",
      {
        title,
        content: "Phản ánh hoạt động ATTP của người dân gửi lên hệ thống.",
        reporterName: "Người dân E2E",
        reporterContact: "0900000000",
        captchaToken: "e2e-test-bypass-token",
      },
    );

    await signInAsAdmin(page);
    await page.goto("/alerts-news");
    await page.getByRole("tab", { name: "Tin tức ATTP" }).click();
    const panel = tabPanel(page, "Tin tức ATTP");
    await filterBySourcePublicReport(panel);
    await panel.getByPlaceholder(/Tìm theo tiêu đề/).fill(title);

    const row = page.getByRole("row").filter({ hasText: stamp });
    await expect(
      row.locator(".ant-tag").filter({ hasText: "Nháp" }),
    ).toBeVisible({ timeout: 15_000 });

    await row.getByRole("button", { name: `Thao tác ${title}` }).click();
    await page.getByRole("menuitem", { name: "Từ chối" }).click();
    await rejectWithReason(page, reason);
    await expect(
      page.getByText("Đã từ chối tin tức.", { exact: true }),
    ).toBeVisible({ timeout: 15_000 });

    const stored = await readRecord(page, NEWS_API, newsId);
    expect(stored.status).toBe(STATUS_REJECTED);
    expect(stored.rejectedReason).toBe(reason);
    expect(stored.isPublic).toBeFalsy();

    await page.reload();
    await page.getByRole("tab", { name: "Tin tức ATTP" }).click();
    const reloaded = tabPanel(page, "Tin tức ATTP");
    await filterBySourcePublicReport(reloaded);
    await reloaded.getByPlaceholder(/Tìm theo tiêu đề/).fill(title);
    await expect(
      page
        .getByRole("row")
        .filter({ hasText: stamp })
        .locator(".ant-tag")
        .filter({ hasText: "Đã từ chối" }),
    ).toBeVisible({ timeout: 15_000 });
  });
});
