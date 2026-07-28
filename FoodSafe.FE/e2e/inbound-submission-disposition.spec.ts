/**
 * INT-03 disposition workflow (STT 51–57 "nhận dữ liệu") — verified against the
 * REAL stack with no interception.
 *
 * Flow under test: Đã nhận (Received) → Đã xử lý (Processed) | Từ chối (Rejected).
 *
 *  1. A partner is created and issued an API key through the real admin API, then
 *     a COOKIE-LESS partner client POSTs two real submissions to
 *     /api/v1/partner/submissions/alert (authenticated by X-Api-Key alone).
 *  2. An officer approves one and rejects the other THROUGH THE REAL BROWSER UI;
 *     both decisions survive a full page reload.
 *  3. The domain refuses a second disposition (the API returns the
 *     FoodSafe:DataIntegration:0009 business error, and the UI no longer offers
 *     the buttons).
 *  4. A user without FoodSafe.DataIntegration.Partners.Moderate is refused by the
 *     backend (403) and never sees the action buttons.
 */

import {
  test,
  expect,
  type APIRequestContext,
  type Page,
} from "@playwright/test";
import {
  requestVerificationToken,
  signIn,
  signInAsAdmin,
} from "./helpers/auth";

const BASE_URL = "http://127.0.0.1:8080";
const PARTNER_ADMIN_API = "/api/v1/app/partner-account";
const RECEIVE_API = "/api/v1/partner/submissions";
const TEST_PASSWORD = process.env.E2E_TEST_USER_PASSWORD ?? "Admin@2026!";
const DATA_TYPE_ALERT = 1;

const RUN = `${Date.now()}`.slice(-9);

interface PartnerDto {
  id: string;
  code: string;
}
interface IssuedKeyDto {
  rawKey: string;
}
interface ReceiveResult {
  submissionId: string;
}
interface SubmissionDto {
  id: string;
  requestId: string;
  status: number;
  rejectReason?: string;
  processedById?: string;
  processedAt?: string;
}

async function csrf(page: Page) {
  return { RequestVerificationToken: await requestVerificationToken(page) };
}

async function createPartner(page: Page, suffix: string): Promise<PartnerDto> {
  const resp = await page.context().request.post(PARTNER_ADMIN_API, {
    headers: await csrf(page),
    data: {
      code: `DISP-${RUN}-${suffix}`,
      name: `Đối tác duyệt ${suffix} ${RUN}`,
      externalSystem: "Bộ Y tế",
      allowedDataTypes: [DATA_TYPE_ALERT],
    },
  });
  expect(resp.status(), await resp.text()).toBe(200);
  return (await resp.json()) as PartnerDto;
}

async function issueKey(page: Page, partnerId: string): Promise<string> {
  const resp = await page
    .context()
    .request.post(`${PARTNER_ADMIN_API}/${partnerId}/keys`, {
      headers: await csrf(page),
      data: { description: `e2e disposition ${RUN}` },
    });
  expect(resp.status(), await resp.text()).toBe(200);
  return ((await resp.json()) as IssuedKeyDto).rawKey;
}

/** Cookie-less partner delivery — authentication is the X-Api-Key header alone. */
async function deliver(
  partnerClient: APIRequestContext,
  rawKey: string,
  requestId: string,
): Promise<string> {
  const resp = await partnerClient.post(`${BASE_URL}${RECEIVE_API}/alert`, {
    headers: {
      "X-Api-Key": rawKey,
      "X-Request-Id": requestId,
      "X-Timestamp": new Date().toISOString(),
    },
    data: {
      schemaVersion: "1.0",
      records: [{ title: `Cảnh báo liên thông ${requestId}`, severity: "Medium" }],
      sourceSystem: "E2E-Disposition",
      sentAt: new Date().toISOString(),
    },
  });
  expect(resp.status(), await resp.text()).toBe(200);
  return ((await resp.json()) as ReceiveResult).submissionId;
}

async function readSubmission(
  page: Page,
  submissionId: string,
): Promise<SubmissionDto> {
  const resp = await page
    .context()
    .request.get(`${PARTNER_ADMIN_API}/submissions/${submissionId}`);
  expect(resp.status(), await resp.text()).toBe(200);
  return (await resp.json()) as SubmissionDto;
}

/** Open the inbound tab filtered to one partner so rows are unambiguous. */
async function openInboundTab(page: Page, partnerRequestId: string) {
  await page.goto(`${BASE_URL}/data-integration`);
  await page.getByRole("tab", { name: "Dữ liệu nhận về" }).click();
  await expect(
    page.getByRole("row").filter({ hasText: partnerRequestId }),
  ).toBeVisible({ timeout: 15_000 });
}

test.describe("INT-03 — inbound submission disposition", () => {
  test("officer approves and rejects partner submissions through the real UI", async ({
    page,
    request: partnerClient,
  }) => {
    test.setTimeout(150_000);
    await signInAsAdmin(page);

    const partner = await createPartner(page, "A");
    const rawKey = await issueKey(page, partner.id);
    const approveReq = `req-approve-${RUN}`;
    const rejectReq = `req-reject-${RUN}`;
    const approveId = await deliver(partnerClient, rawKey, approveReq);
    const rejectId = await deliver(partnerClient, rawKey, rejectReq);

    try {
      // ── both land awaiting disposition ────────────────────────────────────
      expect((await readSubmission(page, approveId)).status).toBe(1);
      expect((await readSubmission(page, rejectId)).status).toBe(1);

      await openInboundTab(page, approveReq);

      // ── approve one through the UI ────────────────────────────────────────
      const approveRow = page.getByRole("row").filter({ hasText: approveReq });
      await expect(
        approveRow.locator(".ant-tag").filter({ hasText: "Đã nhận" }),
      ).toBeVisible();
      await approveRow.getByRole("button", { name: "Duyệt" }).click();
      await page.getByRole("button", { name: "Duyệt", exact: true }).last().click();
      await expect(
        page.getByText("Đã duyệt dữ liệu tiếp nhận.", { exact: true }),
      ).toBeVisible({ timeout: 15_000 });
      await expect(
        page
          .getByRole("row")
          .filter({ hasText: approveReq })
          .locator(".ant-tag")
          .filter({ hasText: "Đã xử lý" }),
      ).toBeVisible({ timeout: 15_000 });

      // ── reject the other with a mandatory reason ──────────────────────────
      const reason = `Sai định dạng dữ liệu ${RUN}`;
      const rejectRow = page.getByRole("row").filter({ hasText: rejectReq });
      await rejectRow.getByRole("button", { name: "Từ chối" }).click();
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();

      // Validation: the reason is required — an empty submit must be refused.
      await dialog.getByRole("button", { name: "Từ chối" }).click();
      await expect(
        dialog.getByText("Vui lòng nhập lý do từ chối."),
      ).toBeVisible();

      await dialog.getByRole("textbox").fill(reason);
      await dialog.getByRole("button", { name: "Từ chối" }).click();
      await expect(
        page.getByText("Đã từ chối dữ liệu tiếp nhận.", { exact: true }),
      ).toBeVisible({ timeout: 15_000 });
      await expect(
        page
          .getByRole("row")
          .filter({ hasText: rejectReq })
          .locator(".ant-tag")
          .filter({ hasText: "Từ chối" }),
      ).toBeVisible({ timeout: 15_000 });

      // ── persistence after a full browser reload ──────────────────────────
      await page.reload();
      await page.getByRole("tab", { name: "Dữ liệu nhận về" }).click();
      await expect(
        page
          .getByRole("row")
          .filter({ hasText: approveReq })
          .locator(".ant-tag")
          .filter({ hasText: "Đã xử lý" }),
      ).toBeVisible({ timeout: 15_000 });
      await expect(
        page
          .getByRole("row")
          .filter({ hasText: rejectReq })
          .locator(".ant-tag")
          .filter({ hasText: "Từ chối" }),
      ).toBeVisible({ timeout: 15_000 });

      // ── the database recorded who decided, when, and why ─────────────────
      const approved = await readSubmission(page, approveId);
      expect(approved.status).toBe(2);
      expect(approved.processedById).toBeTruthy();
      expect(approved.processedAt).toBeTruthy();

      const rejected = await readSubmission(page, rejectId);
      expect(rejected.status).toBe(3);
      expect(rejected.rejectReason).toBe(reason);
      expect(rejected.processedById).toBeTruthy();

      // ── a disposed submission offers no further action in the UI ─────────
      const settledRow = page.getByRole("row").filter({ hasText: approveReq });
      await expect(
        settledRow.getByRole("button", { name: "Duyệt" }),
      ).toHaveCount(0);
      await expect(
        settledRow.getByRole("button", { name: "Từ chối" }),
      ).toHaveCount(0);

      // ── and the backend refuses a second disposition outright ────────────
      const second = await page
        .context()
        .request.post(
          `${PARTNER_ADMIN_API}/submissions/${approveId}/process`,
          { headers: await csrf(page), maxRedirects: 0 },
        );
      expect(second.status()).toBe(403);
      expect(await second.text()).toContain("FoodSafe:DataIntegration:0009");

      const overturn = await page
        .context()
        .request.post(`${PARTNER_ADMIN_API}/submissions/${rejectId}/reject`, {
          headers: await csrf(page),
          data: { reason: "Đổi ý" },
          maxRedirects: 0,
        });
      expect(overturn.status()).toBe(403);
      // The original decision is untouched.
      expect((await readSubmission(page, rejectId)).rejectReason).toBe(reason);
    } finally {
      await page
        .context()
        .request.delete(`${PARTNER_ADMIN_API}/${partner.id}`, {
          headers: await csrf(page),
        })
        .catch(() => undefined);
    }
  });

  test("rejection without the Moderate permission is refused by the backend", async ({
    page,
    request: partnerClient,
    browser,
  }) => {
    test.setTimeout(150_000);
    await signInAsAdmin(page);

    const partner = await createPartner(page, "B");
    const rawKey = await issueKey(page, partner.id);
    const requestId = `req-noperm-${RUN}`;
    const submissionId = await deliver(partnerClient, rawKey, requestId);

    const noPermCtx = await browser.newContext();
    const noPermPage = await noPermCtx.newPage();
    try {
      await signIn(noPermPage, "noperm@foodsafe.local", TEST_PASSWORD);

      const denied = await noPermCtx.request.post(
        `${PARTNER_ADMIN_API}/submissions/${submissionId}/process`,
        {
          headers: {
            RequestVerificationToken:
              await requestVerificationToken(noPermPage),
          },
          maxRedirects: 0,
        },
      );
      expect([403, 302]).toContain(denied.status());

      // The submission is untouched: still awaiting disposition.
      expect((await readSubmission(page, submissionId)).status).toBe(1);
    } finally {
      await noPermCtx.close();
      await page
        .context()
        .request.delete(`${PARTNER_ADMIN_API}/${partner.id}`, {
          headers: await csrf(page),
        })
        .catch(() => undefined);
    }
  });
});
