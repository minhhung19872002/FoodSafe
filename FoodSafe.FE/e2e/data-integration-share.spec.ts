/**
 * FR-51 (P1-3): DataIntegration outbound data-sharing — real UI-driven action.
 *
 * P0-2 (data-integration-credentials.spec.ts) already proved the SHARE endpoint
 * at the API layer (header injection, no-leak, 403). This spec closes the
 * remaining gap: the operator-facing SHARE ACTION driven through the real React
 * UI, and the persistence of the resulting call-history record.
 *
 * Verified against the REAL stack — no API interception, no injected auth:
 *  1. An admin opens /data-integration → "Lịch sử gọi API" → "Chia sẻ dữ liệu",
 *     picks a seeded ACTIVE partner endpoint + a data type, submits, and sees the
 *     success toast "Đã chia sẻ dữ liệu thành công." The share genuinely leaves
 *     the server (postman-echo, a public receiver reachable through the B-5 SSRF
 *     guard) and returns 200.
 *  2. The share writes an OUTBOUND ("Gửi") call-history row with the correct
 *     data type + receiver URL, visible in the real history table.
 *  3. After a full browser reload the row is still served by the backend
 *     (persistence — not a client-only optimistic entry).
 *  4. Workflow rule: sharing to an INACTIVE endpoint is refused with the
 *     Vietnamese UserFriendlyException message. Because the UI dropdown only
 *     lists ACTIVE endpoints, this is exercised against the real API (real auth),
 *     which is where the invariant lives.
 *  5. Permission/route denial: a non-admin account (no DataIntegration grant) is
 *     shown the 403 Result on /data-integration and can reach neither the history
 *     tab nor the share button.
 *
 * postman-echo resolves to a public IP, so the SSRF guard allows it; real
 * partners are unreachable from the test host. It is used purely as a reachable
 * receiver so the outbound call really executes end-to-end.
 */

import { test, expect, type Page } from "@playwright/test";
import {
  signIn,
  signInAsAdmin,
  requestVerificationToken,
} from "./helpers/auth";

const BASE_URL = "http://127.0.0.1:8080";
const ECHO_URL = "https://postman-echo.com/post";
const ENDPOINT_API = "/api/v1/app/api-endpoint";
const SHARE_API = "/api/v1/app/data-sharing/share";
const READONLY_EMAIL = "readonly@foodsafe.local";
const SEED_PASSWORD = "Admin@2026!";

const AUTH_NONE = 1;
const STATUS_ACTIVE = 1;
const STATUS_INACTIVE = 2;
const DATA_TYPE_ALERT = 1;
const ALERT_LABEL = "Cảnh báo ATTP";

// Unique per run so the receiver system name is greppable and rows never collide.
const RUN = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;

interface EndpointDto {
  id: string;
  name: string;
  externalSystem: string;
  status: number;
}

/**
 * Creates a partner endpoint straight through the real authenticated API (this
 * is test SETUP, not the behaviour under test — the SHARE action itself is
 * driven through the UI). A unique externalSystem makes the endpoint findable in
 * both the share dropdown and the history "Hệ thống" column.
 */
async function createEndpoint(
  page: Page,
  overrides: Record<string, unknown> = {},
): Promise<EndpointDto> {
  const suffix = Math.random().toString(36).slice(2, 8);
  const resp = await page.context().request.post(ENDPOINT_API, {
    headers: { RequestVerificationToken: await requestVerificationToken(page) },
    data: {
      name: `P13 Receiver ${suffix}`,
      externalSystem: `P13-${RUN}-${suffix}`,
      url: ECHO_URL,
      httpMethod: "POST",
      authType: AUTH_NONE,
      status: STATUS_ACTIVE,
      ...overrides,
    },
  });
  expect(resp.status(), await resp.text()).toBe(200);
  return (await resp.json()) as EndpointDto;
}

async function deleteEndpoint(page: Page, id: string): Promise<void> {
  await page.context().request.delete(`${ENDPOINT_API}/${id}`, {
    headers: { RequestVerificationToken: await requestVerificationToken(page) },
  });
}

/** Opens the real history tab and selects a data-type filter so table content is deterministic. */
async function openHistoryFilteredByAlert(page: Page): Promise<void> {
  await page.getByRole("tab", { name: "Lịch sử gọi API" }).click();
  // Inner data-type tab narrows the table to Alert rows only.
  await page.getByRole("tab", { name: ALERT_LABEL, exact: true }).click();
}

/** Locates the outbound history row for a receiver by its unique system name. */
function historyRow(page: Page, externalSystem: string) {
  return page.getByRole("row", { name: new RegExp(externalSystem) });
}

test.describe("FR-51 P1-3 — outbound data sharing through the real UI", () => {
  test("admin shares via UI → success toast, outbound history row, persists after reload", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    const endpoint = await createEndpoint(page);

    try {
      await page.goto(`${BASE_URL}/data-integration`);
      await openHistoryFilteredByAlert(page);

      // The receiver should not appear before we share.
      await expect(historyRow(page, endpoint.externalSystem)).toHaveCount(0);

      // --- drive the real share dialog (Ant Modal exposes no aria label, so the
      // single open dialog is located by role only) ---
      await page.getByRole("button", { name: "Chia sẻ dữ liệu" }).click();
      const dialog = page.getByRole("dialog");
      await expect(
        dialog.getByText("Chia sẻ dữ liệu đến hệ thống bên ngoài"),
      ).toBeVisible();

      // Ant Select options render in a body-level portal with the label as a
      // `title` attribute; `.last()` disambiguates from any selected-value chip.
      await dialog.getByLabel("Điểm kết nối").click();
      await page.getByTitle(endpoint.externalSystem).last().click();

      await dialog.getByLabel("Loại dữ liệu").click();
      await page.getByTitle(ALERT_LABEL, { exact: true }).last().click();

      await dialog.getByLabel("Cảnh báo ATTP").click();
      // The record list is virtualised; committing the highlighted entry with
      // the keyboard avoids racing its re-renders.
      await expect(
        page.locator(".ant-select-dropdown:visible").getByRole("option").first(),
      ).toBeAttached();
      await page.keyboard.press("Enter");

      await dialog
        .getByPlaceholder("Mô tả nội dung dữ liệu được chia sẻ")
        .fill(`p13-${RUN}`);

      await dialog.getByRole("button", { name: "Gửi" }).click();

      // --- outcome 1: success toast (real 200 from the receiver) ---
      await expect(
        page.getByText("Đã chia sẻ dữ liệu thành công.", { exact: true }),
      ).toBeVisible();

      // --- outcome 2: an outbound ("Gửi") history row appeared ---
      const row = historyRow(page, endpoint.externalSystem);
      await expect(row).toBeVisible();
      await expect(row.getByText("Gửi", { exact: true })).toBeVisible();
      await expect(row.getByText(ALERT_LABEL, { exact: true })).toBeVisible();
      // Success result tag ("OK") — the call really reached the receiver.
      await expect(row.getByText("OK", { exact: true })).toBeVisible();

      // --- outcome 3: still served by the backend after a full reload ---
      await page.reload();
      await openHistoryFilteredByAlert(page);
      await expect(historyRow(page, endpoint.externalSystem)).toBeVisible();
    } finally {
      await deleteEndpoint(page, endpoint.id);
    }
  });

  test("sharing to an inactive endpoint is refused with the Vietnamese workflow message", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    // Create is always Active; deactivate through the real toggle-status action.
    // UI lists only ACTIVE endpoints, so the inactive-guard lives at the API.
    const endpoint = await createEndpoint(page);

    try {
      const toggle = await page
        .context()
        .request.post(`${ENDPOINT_API}/${endpoint.id}/toggle-status`, {
          headers: {
            RequestVerificationToken: await requestVerificationToken(page),
          },
        });
      // ABP void action → 204 No Content.
      expect([200, 204]).toContain(toggle.status());

      const detail = await page
        .context()
        .request.get(`${ENDPOINT_API}/${endpoint.id}`);
      expect(((await detail.json()) as EndpointDto).status).toBe(
        STATUS_INACTIVE,
      );

      const resp = await page.context().request.post(SHARE_API, {
        headers: {
          RequestVerificationToken: await requestVerificationToken(page),
        },
        data: {
          endpointId: endpoint.id,
          dataType: DATA_TYPE_ALERT,
          note: `p13-inactive-${RUN}`,
        },
      });
      expect(resp.status()).toBe(403);
      expect(await resp.text()).toContain("Điểm kết nối đang ngừng hoạt động");
    } finally {
      await deleteEndpoint(page, endpoint.id);
    }
  });

  test("a non-admin account is denied the data-integration route and cannot share", async ({
    page,
  }) => {
    await signIn(page, READONLY_EMAIL, SEED_PASSWORD);
    await page.goto(`${BASE_URL}/data-integration`);

    // Route is gated by DataIntegration.ApiEndpoints.View, which no seeded
    // non-admin role holds → the 403 Result renders instead of the page.
    await expect(page.getByText("Không có quyền truy cập")).toBeVisible();
    await expect(
      page.getByRole("tab", { name: "Lịch sử gọi API" }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Chia sẻ dữ liệu" }),
    ).toHaveCount(0);
  });
});
