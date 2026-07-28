/**
 * INT-03 — inbound partner integration, verified against the REAL stack with
 * no interception:
 *
 *  1. LIFECYCLE VIA UI: an admin creates a partner and issues an API key
 *     through the real /data-integration UI (the raw key is shown exactly
 *     once); a cookie-less partner client then POSTs a real submission to
 *     /api/v1/partner/submissions/alert; the submission and its Inbound call
 *     log appear in the real UI and survive a reload; revoking the key
 *     through the UI immediately turns the partner's calls into 401s.
 *  2. GUARDS: invalid key, expired key, suspended partner → 401 (single
 *     generic message); data type outside the partner's allow-list → 403;
 *     unknown data-type segment, stale timestamp (replay), missing
 *     X-Request-Id, unsupported schemaVersion, empty records → 400.
 *  3. IDEMPOTENCY + CROSS-PARTNER ISOLATION: the same X-Request-Id delivered
 *     twice yields ONE submission (duplicate:true echoes the original id);
 *     the same X-Request-Id from a DIFFERENT partner creates a separate
 *     submission; the admin list filter scopes per partner.
 *
 * Partner calls use the Playwright `request` fixture — a fresh context with
 * NO cookies — so authentication is provably the X-Api-Key header alone.
 */

import {
  test,
  expect,
  type APIRequestContext,
  type Page,
} from "@playwright/test";
import { signInAsAdmin, requestVerificationToken } from "./helpers/auth";

const BASE_URL = "http://127.0.0.1:8080";
const PARTNER_ADMIN_API = "/api/v1/app/partner-account";
const RECEIVE_API = "/api/v1/partner/submissions";
const DATA_TYPE_ALERT = 1;

const RUN = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;

interface PartnerDto {
  id: string;
  code: string;
  name: string;
}
interface IssuedKeyDto {
  id: string;
  rawKey: string;
  keyPrefix: string;
}
interface ReceiveResult {
  submissionId: string;
  correlationId: string;
  duplicate: boolean;
}

async function csrf(page: Page) {
  return { RequestVerificationToken: await requestVerificationToken(page) };
}

async function createPartnerViaApi(
  page: Page,
  suffix: string,
  allowedDataTypes: number[] = [DATA_TYPE_ALERT],
): Promise<PartnerDto> {
  const resp = await page.context().request.post(PARTNER_ADMIN_API, {
    headers: await csrf(page),
    data: {
      code: `P-${RUN}-${suffix}`,
      name: `Đối tác E2E ${suffix} ${RUN}`,
      externalSystem: "Bộ Y tế",
      allowedDataTypes,
    },
  });
  expect(resp.status(), await resp.text()).toBe(200);
  return (await resp.json()) as PartnerDto;
}

async function issueKeyViaApi(
  page: Page,
  partnerId: string,
  expiresAt?: string,
): Promise<IssuedKeyDto> {
  const resp = await page.context().request.post(
    `${PARTNER_ADMIN_API}/${partnerId}/keys`,
    {
      headers: await csrf(page),
      data: { expiresAt, description: `e2e ${RUN}` },
    },
  );
  expect(resp.status(), await resp.text()).toBe(200);
  return (await resp.json()) as IssuedKeyDto;
}

async function deletePartner(page: Page, id: string) {
  await page
    .context()
    .request.delete(`${PARTNER_ADMIN_API}/${id}`, { headers: await csrf(page) })
    .catch(() => undefined);
}

/** Cookie-less partner submission with sane defaults, overridable per case. */
async function submit(
  partnerClient: APIRequestContext,
  rawKey: string | undefined,
  options: {
    segment?: string;
    requestId?: string | null;
    timestamp?: string | null;
    schemaVersion?: string;
    records?: unknown[];
    correlationId?: string;
  } = {},
) {
  const headers: Record<string, string> = {};
  if (rawKey) headers["X-Api-Key"] = rawKey;
  if (options.requestId !== null)
    headers["X-Request-Id"] = options.requestId ?? `req-${RUN}-${Math.random()}`;
  if (options.timestamp !== null)
    headers["X-Timestamp"] = options.timestamp ?? new Date().toISOString();
  if (options.correlationId) headers["X-Correlation-Id"] = options.correlationId;

  return partnerClient.post(
    `${BASE_URL}${RECEIVE_API}/${options.segment ?? "alert"}`,
    {
      headers,
      data: {
        schemaVersion: options.schemaVersion ?? "1.0",
        records: options.records ?? [
          { title: `Cảnh báo liên thông ${RUN}`, severity: "Medium" },
        ],
        sourceSystem: "E2E-Partner",
        sentAt: new Date().toISOString(),
      },
    },
  );
}

test.describe("INT-03 — inbound partner integration", () => {
  test("partner lifecycle through the real UI: create, issue key, submit, observe, revoke", async ({
    page,
    request: partnerClient,
  }) => {
    test.setTimeout(120_000);
    await signInAsAdmin(page);
    const partnerName = `Đối tác UI ${RUN}`;
    let partnerId: string | undefined;

    try {
      // ── create the partner through the real UI ─────────────────────────────
      await page.goto(`${BASE_URL}/data-integration`);
      await page.getByRole("tab", { name: "Đối tác liên thông" }).click();
      await page.getByRole("button", { name: "Thêm đối tác" }).click();
      const dialog = page.getByRole("dialog");
      await dialog.getByLabel("Mã đối tác").fill(`UI-${RUN}`);
      await dialog.getByLabel("Tên đối tác").fill(partnerName);
      await dialog.getByLabel("Hệ thống").fill("Bộ Y tế");
      // Close the autocomplete dropdown — it covers the field below.
      await page.keyboard.press("Escape");
      await dialog.getByLabel("Loại dữ liệu được phép gửi").click();
      await page.getByTitle("Cảnh báo ATTP", { exact: true }).last().click();
      await page.keyboard.press("Escape"); // close the multiselect dropdown
      await dialog.getByRole("button", { name: "Lưu" }).click();
      await expect(
        page.getByText("Đã lưu đối tác liên thông.", { exact: true }),
      ).toBeVisible();
      const row = page.getByRole("row", { name: new RegExp(`UI-${RUN}`) });
      await expect(row).toBeVisible();

      // Remember the id for cleanup (via the admin API list).
      const list = await page.context().request.get(
        `${PARTNER_ADMIN_API}?Filter=${encodeURIComponent(`UI-${RUN}`)}`,
      );
      partnerId = ((await list.json()) as { items: PartnerDto[] }).items[0]?.id;
      expect(partnerId).toBeTruthy();

      // ── issue a key through the real UI; the raw key is shown ONCE ────────
      await row.getByRole("button", { name: "Khóa API" }).click();
      const keysModal = page.getByRole("dialog");
      await keysModal.getByRole("button", { name: "Cấp khóa mới" }).click();
      await expect(
        keysModal.getByText(/chỉ hiển thị MỘT LẦN/),
      ).toBeVisible();
      const rawKey = (await keysModal
        .locator("code")
        .first()
        .textContent())!.trim();
      expect(rawKey).toMatch(/^fsp_/);
      await page.keyboard.press("Escape");

      // ── the partner (cookie-less client) submits real data ────────────────
      const requestId = `req-ui-${RUN}`;
      const first = await submit(partnerClient, rawKey, { requestId });
      expect(first.status(), await first.text()).toBe(200);
      const firstBody = (await first.json()) as ReceiveResult;
      expect(firstBody.duplicate).toBe(false);
      expect(firstBody.submissionId).toBeTruthy();

      // Duplicate delivery is idempotent: same submission id, duplicate:true.
      const second = await submit(partnerClient, rawKey, { requestId });
      expect(second.status()).toBe(200);
      const secondBody = (await second.json()) as ReceiveResult;
      expect(secondBody.duplicate).toBe(true);
      expect(secondBody.submissionId).toBe(firstBody.submissionId);

      // Exactly ONE submission persisted for that request id.
      const submissions = await page.context().request.get(
        `${PARTNER_ADMIN_API}/submissions?PartnerAccountId=${partnerId}`,
      );
      const submissionItems = (
        (await submissions.json()) as { items: Array<{ requestId: string }> }
      ).items;
      expect(
        submissionItems.filter((s) => s.requestId === requestId),
      ).toHaveLength(1);

      // ── the submission is visible in the real UI and survives a reload ───
      await page.reload();
      await page.getByRole("tab", { name: "Dữ liệu nhận về" }).click();
      const subRow = page.getByRole("row", { name: new RegExp(requestId) });
      await expect(subRow).toBeVisible();
      await subRow.getByRole("button").click();
      await expect(page.getByText("Chi tiết dữ liệu nhận về")).toBeVisible();
      await expect(
        page.getByText(new RegExp(`Cảnh báo liên thông ${RUN}`)),
      ).toBeVisible();
      await page.keyboard.press("Escape");

      // ── the Inbound call log exists in the history tab ────────────────────
      await page.getByRole("tab", { name: "Lịch sử gọi API" }).click();
      await page.getByRole("tab", { name: "Cảnh báo ATTP", exact: true }).click();
      await expect(
        page
          .getByRole("row", { name: /Bộ Y tế/ })
          .filter({ hasText: "Nhận" })
          .first(),
      ).toBeVisible();

      // ── revoking the key through the real UI stops authentication ─────────
      await page.getByRole("tab", { name: "Đối tác liên thông" }).click();
      await page
        .getByRole("row", { name: new RegExp(`UI-${RUN}`) })
        .getByRole("button", { name: "Khóa API" })
        .click();
      await page.getByRole("button", { name: "Thu hồi" }).first().click();
      await page
        .locator(".ant-popover")
        .getByRole("button", { name: "Thu hồi" })
        .click();
      await expect(
        page.getByText("Đã thu hồi khóa API.", { exact: true }),
      ).toBeVisible();

      const afterRevoke = await submit(partnerClient, rawKey, {
        requestId: `req-revoked-${RUN}`,
      });
      expect(afterRevoke.status()).toBe(401);

      // ── rotation: a replacement key issued in the same UI takes over ──────
      await keysModal.getByRole("button", { name: "Cấp khóa mới" }).click();
      await expect(
        keysModal.getByText(/chỉ hiển thị MỘT LẦN/),
      ).toBeVisible();
      const rotatedKey = (await keysModal
        .locator("code")
        .first()
        .textContent())!.trim();
      expect(rotatedKey).toMatch(/^fsp_/);
      expect(rotatedKey).not.toBe(rawKey);
      await page.keyboard.press("Escape");

      const withRotated = await submit(partnerClient, rotatedKey, {
        requestId: `req-rotated-${RUN}`,
      });
      expect(withRotated.status(), await withRotated.text()).toBe(200);

      // ── disabling the partner through the real UI blocks even live keys ──
      const partnerRow = page.getByRole("row", { name: new RegExp(`UI-${RUN}`) });
      await partnerRow.locator("button:has(.anticon-swap)").click();
      await page
        .locator(".ant-popover")
        .getByRole("button", { name: "Tạm ngưng" })
        .click();
      await expect(
        page.getByText("Đã cập nhật trạng thái.", { exact: true }),
      ).toBeVisible();
      await expect(
        partnerRow.getByText("Tạm ngưng", { exact: true }),
      ).toBeVisible();

      const whileSuspended = await submit(partnerClient, rotatedKey, {
        requestId: `req-suspended-${RUN}`,
      });
      expect(whileSuspended.status()).toBe(401);
    } finally {
      if (partnerId) await deletePartner(page, partnerId);
    }
  });

  test("authentication, replay and payload guards", async ({
    page,
    request: partnerClient,
  }) => {
    await signInAsAdmin(page);
    const partner = await createPartnerViaApi(page, "guards");
    const key = await issueKeyViaApi(page, partner.id);

    try {
      // Invalid / unknown keys → 401 with one generic error shape.
      expect((await submit(partnerClient, undefined)).status()).toBe(401);
      expect(
        (await submit(partnerClient, "fsp_definitelyNotARealKey0000000000000000"))
          .status(),
      ).toBe(401);
      expect((await submit(partnerClient, "not-even-prefixed")).status()).toBe(401);

      // Expired key → 401 (issued with an expiry already in the past).
      const expired = await issueKeyViaApi(
        page, partner.id, new Date(Date.now() - 60_000).toISOString());
      expect((await submit(partnerClient, expired.rawKey)).status()).toBe(401);

      // Data type outside the allow-list → 403 (partner only allows Alert).
      const forbidden = await submit(partnerClient, key.rawKey, {
        segment: "product",
      });
      expect(forbidden.status()).toBe(403);
      expect(await forbidden.text()).toContain("DataTypeNotAllowed");

      // Unknown segment → 400.
      expect(
        (await submit(partnerClient, key.rawKey, { segment: "unknown" }))
          .status(),
      ).toBe(400);

      // Replay protection: stale timestamp outside the ±300s window → 400.
      const stale = await submit(partnerClient, key.rawKey, {
        timestamp: new Date(Date.now() - 10 * 60_000).toISOString(),
      });
      expect(stale.status()).toBe(400);
      expect(await stale.text()).toContain("StaleTimestamp");

      // Missing idempotency and timestamp headers → 400.
      expect(
        (await submit(partnerClient, key.rawKey, { requestId: null })).status(),
      ).toBe(400);
      expect(
        (await submit(partnerClient, key.rawKey, { timestamp: null })).status(),
      ).toBe(400);

      // Malformed payloads → 400.
      const badVersion = await submit(partnerClient, key.rawKey, {
        schemaVersion: "9.9",
      });
      expect(badVersion.status()).toBe(400);
      expect(await badVersion.text()).toContain("UnsupportedSchemaVersion");
      const emptyRecords = await submit(partnerClient, key.rawKey, {
        records: [],
      });
      expect(emptyRecords.status()).toBe(400);
      expect(await emptyRecords.text()).toContain("InvalidRecords");

      // Suspended partner → 401 even with a live key.
      const toggle = await page.context().request.post(
        `${PARTNER_ADMIN_API}/${partner.id}/toggle-status`,
        { headers: await csrf(page) },
      );
      expect([200, 204]).toContain(toggle.status());
      expect((await submit(partnerClient, key.rawKey)).status()).toBe(401);
    } finally {
      await deletePartner(page, partner.id);
    }
  });

  test("idempotency is scoped per partner (cross-partner isolation)", async ({
    page,
    request: partnerClient,
  }) => {
    await signInAsAdmin(page);
    const partnerA = await createPartnerViaApi(page, "isoA");
    const partnerB = await createPartnerViaApi(page, "isoB");
    const keyA = await issueKeyViaApi(page, partnerA.id);
    const keyB = await issueKeyViaApi(page, partnerB.id);

    try {
      const sharedRequestId = `req-shared-${RUN}`;
      const fromA = await submit(partnerClient, keyA.rawKey, {
        requestId: sharedRequestId,
      });
      expect(fromA.status(), await fromA.text()).toBe(200);
      const fromB = await submit(partnerClient, keyB.rawKey, {
        requestId: sharedRequestId,
      });
      expect(fromB.status(), await fromB.text()).toBe(200);

      const a = (await fromA.json()) as ReceiveResult;
      const b = (await fromB.json()) as ReceiveResult;
      // B's delivery is NOT treated as A's duplicate: isolation per partner.
      expect(b.duplicate).toBe(false);
      expect(b.submissionId).not.toBe(a.submissionId);

      // The admin filter returns each partner's own submission only.
      for (const [partnerId, expected] of [
        [partnerA.id, a.submissionId],
        [partnerB.id, b.submissionId],
      ] as const) {
        const resp = await page.context().request.get(
          `${PARTNER_ADMIN_API}/submissions?PartnerAccountId=${partnerId}`,
        );
        const items = (
          (await resp.json()) as { items: Array<{ id: string; requestId: string }> }
        ).items.filter((s) => s.requestId === sharedRequestId);
        expect(items).toHaveLength(1);
        expect(items[0].id).toBe(expected);
      }

      // Unauthenticated admin surface stays closed (sanity).
      const anonAdmin = await partnerClient.get(
        `${BASE_URL}${PARTNER_ADMIN_API}`, { maxRedirects: 0 });
      expect([401, 302]).toContain(anonAdmin.status());
    } finally {
      await deletePartner(page, partnerA.id);
      await deletePartner(page, partnerB.id);
    }
  });
});
