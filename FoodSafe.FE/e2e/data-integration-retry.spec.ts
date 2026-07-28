/**
 * FR-51..57 (Batch F-1): typed outbound payloads + retry with immutable
 * attempt history.
 *
 * Closes the two remaining functional gaps of the data-integration group
 * (docs/functional-audit/02, P1-A..P1-D), verified against the REAL stack —
 * no API interception, no injected auth:
 *
 *  1. TYPED PAYLOAD (P1-A): a share of "Cảnh báo ATTP" carries the REAL alert
 *     record — a seeded alert's title is asserted inside the logged request
 *     body AND inside the receiver's reflection (postman-echo echoes the body
 *     back), together with the versioned envelope (schemaVersion, recordCount)
 *     and the SHA-256 payload checksum. Sharing with entityId pins the
 *     envelope to exactly that record (recordCount = 1).
 *  2. RETRY (P1-B/P1-C): a share to a deterministically failing receiver
 *     produces a failed history row; the officer clicks the real "Thử lại"
 *     button → a NEW attempt row (#2) appears, chained to the original via
 *     correlationId, with the IDENTICAL request body and checksum — the
 *     original attempt's evidence is untouched (immutability), and both rows
 *     survive a full browser reload.
 *  3. TIME FILTER (P1-D): the new date-range filter narrows the history table
 *     (a past-only range hides today's rows).
 *  4. GUARDS: retrying a SUCCESSFUL attempt is refused with the Vietnamese
 *     business error; a user without DataIntegration permissions gets the 403
 *     route Result and the API refuses the retry (403).
 *
 * postman-echo is a public receiver reachable through the B-5 SSRF guard;
 * /status/503 fails deterministically regardless of method support.
 */

import { test, expect, type Page } from "@playwright/test";
import {
  signIn,
  signInAsAdmin,
  requestVerificationToken,
} from "./helpers/auth";

const BASE_URL = "http://127.0.0.1:8080";
const ECHO_URL = "https://postman-echo.com/post";
const FAIL_URL = "https://postman-echo.com/status/503";
const ENDPOINT_API = "/api/v1/app/api-endpoint";
const CALL_LOG_API = "/api/v1/app/api-call-log";
const SHARE_API = "/api/v1/app/data-sharing/share";
const RETRY_API = "/api/v1/app/data-sharing/retry";
const ALERT_API = "/api/v1/app/atp-alert";
const READONLY_EMAIL = "readonly@foodsafe.local";
const SEED_PASSWORD = "Admin@2026!";

const AUTH_NONE = 1;
const DATA_TYPE_ALERT = 1;
const ALERT_LABEL = "Cảnh báo ATTP";

const RUN = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;

interface ShareResult {
  logId: string;
  isSuccess: boolean;
  statusCode?: number;
  errorMessage?: string;
}
interface CallLogDetail {
  id: string;
  correlationId?: string;
  attemptNumber: number;
  payloadChecksum?: string;
  requestBody?: string;
  responseBody?: string;
  isSuccess: boolean;
}

async function csrf(page: Page) {
  return { RequestVerificationToken: await requestVerificationToken(page) };
}

async function createEndpoint(
  page: Page,
  url: string,
  suffix: string,
): Promise<{ id: string; externalSystem: string }> {
  const externalSystem = `F1-${RUN}-${suffix}`;
  const resp = await page.context().request.post(ENDPOINT_API, {
    headers: await csrf(page),
    data: {
      name: `F1 Receiver ${suffix}`,
      externalSystem,
      url,
      httpMethod: "POST",
      authType: AUTH_NONE,
    },
  });
  expect(resp.status(), await resp.text()).toBe(200);
  const dto = (await resp.json()) as { id: string };
  return { id: dto.id, externalSystem };
}

async function deleteEndpoint(page: Page, id: string) {
  await page.context().request.delete(`${ENDPOINT_API}/${id}`, {
    headers: await csrf(page),
  });
}

async function share(
  page: Page,
  endpointId: string,
  entityId?: string,
): Promise<ShareResult> {
  const resp = await page.context().request.post(SHARE_API, {
    headers: await csrf(page),
    data: {
      endpointId,
      dataType: DATA_TYPE_ALERT,
      entityId,
      note: `f1-${RUN}`,
    },
  });
  expect(resp.status(), await resp.text()).toBe(200);
  return (await resp.json()) as ShareResult;
}

async function logDetail(page: Page, id: string): Promise<CallLogDetail> {
  const resp = await page.context().request.get(`${CALL_LOG_API}/${id}`);
  expect(resp.status(), await resp.text()).toBe(200);
  return (await resp.json()) as CallLogDetail;
}

async function openHistoryFilteredByAlert(page: Page) {
  await page.getByRole("tab", { name: "Lịch sử gọi API" }).click();
  await page.getByRole("tab", { name: ALERT_LABEL, exact: true }).click();
}

function historyRows(page: Page, externalSystem: string) {
  return page.getByRole("row", { name: new RegExp(externalSystem) });
}

test.describe("FR-51..57 Batch F-1 — typed payload + retry attempt history", () => {
  test.slow(); // real external receiver round-trips

  test("share carries the real alert record in a versioned checksummed envelope", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    const alertTitle = `Cảnh báo E2E F1 ${RUN}`;
    const alertResp = await page.context().request.post(ALERT_API, {
      headers: await csrf(page),
      data: {
        title: alertTitle,
        content: "Nội dung cảnh báo F1",
        category: 1,
        severity: 2,
        source: 1,
      },
    });
    expect(alertResp.ok(), await alertResp.text()).toBeTruthy();
    const alert = (await alertResp.json()) as { id: string };
    const endpoint = await createEndpoint(page, ECHO_URL, "typed");

    try {
      const result = await share(page, endpoint.id, alert.id);
      expect(result.isSuccess, result.errorMessage ?? "share failed").toBe(
        true,
      );

      const detail = await logDetail(page, result.logId);
      // Versioned envelope with EXACTLY the pinned record inside. Parsing the
      // logged body makes the assertion independent of \uXXXX escaping.
      const envelope = JSON.parse(detail.requestBody!) as {
        schemaVersion: string;
        dataType: string;
        recordCount: number;
        records: Array<{ id: string; title: string; status: string }>;
      };
      expect(envelope.schemaVersion).toBe("1.0");
      expect(envelope.dataType).toBe("Alert");
      expect(envelope.recordCount).toBe(1);
      expect(envelope.records[0].id).toBe(alert.id);
      expect(envelope.records[0].title).toBe(alertTitle);
      // The receiver reflected the body: the real record left the server.
      const reflection = JSON.parse(detail.responseBody!) as {
        data?: unknown;
        json?: unknown;
      };
      expect(
        JSON.stringify(reflection.json ?? reflection.data ?? reflection),
      ).toContain(alertTitle);
      // SHA-256 checksum recorded for attempt evidence.
      expect(detail.payloadChecksum).toMatch(/^[0-9a-f]{64}$/);
      expect(detail.attemptNumber).toBe(1);
      expect(detail.correlationId ?? null).toBeNull();
    } finally {
      await deleteEndpoint(page, endpoint.id);
      await page.context().request.delete(`${ALERT_API}/${alert.id}`, {
        headers: await csrf(page),
      });
    }
  });

  test("failed share retried via the real UI appends an immutable linked attempt", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    const endpoint = await createEndpoint(page, FAIL_URL, "retry");

    try {
      const original = await share(page, endpoint.id);
      expect(original.isSuccess).toBe(false);

      await page.goto(`${BASE_URL}/data-integration`);
      await openHistoryFilteredByAlert(page);

      const rows = historyRows(page, endpoint.externalSystem);
      await expect(rows).toHaveCount(1);
      await expect(
        rows.first().getByText("Lỗi", { exact: true }),
      ).toBeVisible();

      // --- the real retry action ---
      await rows.first().getByRole("button", { name: "Thử lại" }).click();
      // modal.confirm replaces the former Popconfirm.
      await page.getByRole("button", { name: /^(Đồng ý|OK)$/ }).click();
      await expect(
        page.getByText(/Đã thử lại nhưng hệ thống nhận vẫn trả lỗi/),
      ).toBeVisible();

      // A second, linked attempt row appears (#2), original row untouched.
      await expect(historyRows(page, endpoint.externalSystem)).toHaveCount(2);
      const retryRowUi = historyRows(page, endpoint.externalSystem).filter({
        hasText: "#2",
      });
      await expect(retryRowUi).toHaveCount(1);

      // --- immutability + linkage, verified through the real API ---
      const originalDetail = await logDetail(page, original.logId);
      expect(originalDetail.attemptNumber).toBe(1);
      expect(originalDetail.isSuccess).toBe(false);

      const list = await page
        .context()
        .request.get(
          `${CALL_LOG_API}?Filter=${encodeURIComponent(endpoint.externalSystem)}`,
        );
      expect(list.status()).toBe(200);
      const items = ((await list.json()) as { items: CallLogDetail[] }).items;
      expect(items).toHaveLength(2);
      const retryRow = items.find((x) => x.attemptNumber === 2);
      expect(retryRow, "retry attempt row must exist").toBeTruthy();
      expect(retryRow!.correlationId).toBe(original.logId);

      const retryDetail = await logDetail(page, retryRow!.id);
      expect(retryDetail.requestBody).toBe(originalDetail.requestBody);
      expect(retryDetail.payloadChecksum).toBe(originalDetail.payloadChecksum);

      // --- the detail modal surfaces the attempt metadata ---
      await retryRowUi.locator("button").first().click();
      await expect(page.getByText("#2 (thử lại)")).toBeVisible();
      await expect(
        page.getByText(retryDetail.payloadChecksum!, { exact: true }),
      ).toBeVisible();
      await page.keyboard.press("Escape");

      // --- P1-D: date-range filter narrows the table ---
      await page.getByPlaceholder("Từ ngày").fill("01/01/2020");
      await page.keyboard.press("Enter");
      await page.getByPlaceholder("Đến ngày").fill("02/01/2020");
      await page.keyboard.press("Enter");
      await expect(historyRows(page, endpoint.externalSystem)).toHaveCount(0);

      // --- persistence: both attempts survive a full reload ---
      await page.reload();
      await openHistoryFilteredByAlert(page);
      await expect(historyRows(page, endpoint.externalSystem)).toHaveCount(2);
    } finally {
      await deleteEndpoint(page, endpoint.id);
    }
  });

  test("retry guards: successful attempts refused; no-permission user blocked", async ({
    page,
    browser,
  }) => {
    await signInAsAdmin(page);
    const endpoint = await createEndpoint(page, ECHO_URL, "guard");

    try {
      const ok = await share(page, endpoint.id);
      expect(ok.isSuccess).toBe(true);

      // Workflow guard: only FAILED communications may be retried.
      const refuse = await page
        .context()
        .request.post(`${RETRY_API}/${ok.logId}`, {
          headers: await csrf(page),
        });
      expect(refuse.status()).toBe(403);
      expect(await refuse.text()).toContain(
        "Chỉ có thể thử lại giao tiếp thất bại",
      );

      // Permission guard: readonly (no DataIntegration grants) → 403.
      const context = await browser.newContext({ baseURL: BASE_URL });
      const noPermPage = await context.newPage();
      try {
        await noPermPage.goto(BASE_URL);
        await signIn(noPermPage, READONLY_EMAIL, SEED_PASSWORD);
        const denied = await noPermPage
          .context()
          .request.post(`${RETRY_API}/${ok.logId}`, {
            headers: {
              RequestVerificationToken:
                await requestVerificationToken(noPermPage),
            },
          });
        expect(denied.status()).toBe(403);
      } finally {
        await context.close();
      }
    } finally {
      await deleteEndpoint(page, endpoint.id);
    }
  });
});
