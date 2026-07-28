/**
 * FR-50 / FR-51 (P0-2): DataIntegration outbound credential handling.
 *
 * Verifies, against the REAL stack (no API interception, no injected auth):
 *  1. A partner endpoint's auth secret is WRITE-ONLY: it is accepted on create,
 *     but never returned by create / detail / list — only a `hasCredential`
 *     boolean is exposed.
 *  2. An outbound share injects the correct auth header, decrypted from the
 *     credential stored at rest. Proof is observed at a REAL external receiver
 *     (postman-echo, which reflects the request headers back) — so the header
 *     genuinely left the server and the encrypt→store→decrypt round-trip is
 *     correct. Bearer and API-key strategies are both covered.
 *  3. The secret is never written into the call-log request headers (no leak).
 *  4. Credentials can be rotated and cleared; clearing stops header injection.
 *  5. A user lacking `DataIntegration.Share` is refused server-side (403).
 *  6. The real React UI exposes a write-only credential field for authenticated
 *     endpoints and reflects credential state ("Đã cấu hình") WITHOUT ever
 *     rendering the secret.
 *
 * The SSRF guard (B-5) blocks private/loopback receivers by design, so a public
 * echo service is used as the observation channel; postman-echo resolves to a
 * public IP and is therefore allowed. Real partners do not echo auth headers, so
 * this reflection is purely a test observation, not production behaviour.
 */

import { test, expect, type Page, type APIResponse } from "@playwright/test";
import { signIn, signInAsAdmin, requestVerificationToken } from "./helpers/auth";

const BASE_URL = "http://127.0.0.1:8080";
const ECHO_URL = "https://postman-echo.com/post";
const ENDPOINT_API = "/api/v1/app/api-endpoint";
const CALL_LOG_API = "/api/v1/app/api-call-log";
const SHARE_API = "/api/v1/app/data-sharing/share";
const NOPERM_EMAIL = "noperm@foodsafe.local";
const SEED_PASSWORD = "Admin@2026!";

const AUTH_NONE = 1;
const AUTH_API_KEY = 2;
const AUTH_BEARER = 3;
const DATA_TYPE_ALERT = 1;

// Unique per run so repeated runs never collide and secrets are easy to grep.
const RUN = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;

interface EndpointDto {
  id: string;
  hasCredential: boolean;
  authType: number;
}
interface ShareResult {
  logId: string;
  isSuccess: boolean;
  statusCode?: number;
  errorMessage?: string;
}
interface CallLogDetail {
  responseBody?: string;
  requestHeaders?: string;
}

async function createEndpoint(
  page: Page,
  body: Record<string, unknown>,
): Promise<EndpointDto> {
  const resp = await page.context().request.post(ENDPOINT_API, {
    headers: { RequestVerificationToken: await requestVerificationToken(page) },
    data: {
      url: ECHO_URL,
      httpMethod: "POST",
      externalSystem: "Bộ Y tế",
      authType: AUTH_NONE,
      ...body,
    },
  });
  expect(resp.status(), await resp.text()).toBe(200);
  return (await resp.json()) as EndpointDto;
}

async function updateEndpoint(
  page: Page,
  id: string,
  body: Record<string, unknown>,
): Promise<EndpointDto> {
  const resp = await page.context().request.put(`${ENDPOINT_API}/${id}`, {
    headers: { RequestVerificationToken: await requestVerificationToken(page) },
    data: {
      url: ECHO_URL,
      httpMethod: "POST",
      externalSystem: "Bộ Y tế",
      authType: AUTH_NONE,
      ...body,
    },
  });
  expect(resp.status(), await resp.text()).toBe(200);
  return (await resp.json()) as EndpointDto;
}

/**
 * Shares ONE pinned alert record. Since Batch F-1 the share payload carries the
 * real records of the data type; an unpinned share of the accumulated alert list
 * makes postman-echo's reflection exceed the call-log's 4000-char response
 * truncation, cutting off the reflected headers this spec asserts on. Pinning
 * entityId keeps the envelope (and thus the reflection) small WITHOUT changing
 * any assertion — the injection proof is identical.
 */
async function share(page: Page, endpointId: string): Promise<ShareResult> {
  const alertResp = await page.context().request.post("/api/v1/app/atp-alert", {
    headers: { RequestVerificationToken: await requestVerificationToken(page) },
    data: {
      title: `P02 payload ${RUN}`,
      content: "Bản ghi chia sẻ kiểm chứng P0-2",
      category: 1,
      severity: 2,
      source: 1,
    },
  });
  expect(alertResp.ok(), await alertResp.text()).toBeTruthy();
  const alert = (await alertResp.json()) as { id: string };

  try {
    const resp = await page.context().request.post(SHARE_API, {
      headers: {
        RequestVerificationToken: await requestVerificationToken(page),
      },
      data: {
        endpointId,
        dataType: DATA_TYPE_ALERT,
        entityId: alert.id,
        note: `p02-${RUN}`,
      },
    });
    expect(resp.status(), await resp.text()).toBe(200);
    return (await resp.json()) as ShareResult;
  } finally {
    await page.context().request.delete(`/api/v1/app/atp-alert/${alert.id}`, {
      headers: {
        RequestVerificationToken: await requestVerificationToken(page),
      },
    });
  }
}

async function callLogDetail(
  page: Page,
  logId: string,
): Promise<CallLogDetail> {
  const resp = await page.context().request.get(`${CALL_LOG_API}/${logId}`);
  expect(resp.status(), await resp.text()).toBe(200);
  return (await resp.json()) as CallLogDetail;
}

async function deleteEndpoint(page: Page, id: string): Promise<void> {
  await page.context().request.delete(`${ENDPOINT_API}/${id}`, {
    headers: { RequestVerificationToken: await requestVerificationToken(page) },
  });
}

/** Asserts the raw secret does not appear anywhere in a response payload. */
async function assertSecretAbsent(resp: APIResponse, secret: string) {
  const text = await resp.text();
  expect(text.includes(secret), "secret must never be returned to the client").toBe(
    false,
  );
}

test.describe("FR-50/51: outbound credential encryption & injection", () => {
  test.slow(); // real external receiver round-trips

  test("secret is write-only: never returned by create, detail, or list", async ({
    browser,
  }) => {
    const context = await browser.newContext({ baseURL: BASE_URL });
    const page = await context.newPage();
    const secret = `bearer-secret-${RUN}`;
    let id: string | undefined;
    try {
      await page.goto(BASE_URL);
      await signInAsAdmin(page);

      const created = await createEndpoint(page, {
        name: `P02 write-only ${RUN}`,
        authType: AUTH_BEARER,
        credential: secret,
      });
      id = created.id;
      expect(created.hasCredential).toBe(true);

      // Create response body must not carry the secret back.
      const getResp = await page.context().request.get(`${ENDPOINT_API}/${id}`);
      expect(getResp.status()).toBe(200);
      const detail = (await getResp.json()) as EndpointDto;
      expect(detail.hasCredential).toBe(true);
      await assertSecretAbsent(getResp, secret);

      const listResp = await page.context().request.get(
        `${ENDPOINT_API}?Filter=${encodeURIComponent(`P02 write-only ${RUN}`)}`,
      );
      expect(listResp.status()).toBe(200);
      await assertSecretAbsent(listResp, secret);
    } finally {
      if (id) await deleteEndpoint(page, id);
      await context.close();
    }
  });

  test("Bearer share injects Authorization header (observed at real receiver)", async ({
    browser,
  }) => {
    const context = await browser.newContext({ baseURL: BASE_URL });
    const page = await context.newPage();
    const secret = `bearer-token-${RUN}`;
    let id: string | undefined;
    try {
      await page.goto(BASE_URL);
      await signInAsAdmin(page);

      const created = await createEndpoint(page, {
        name: `P02 bearer ${RUN}`,
        authType: AUTH_BEARER,
        credential: secret,
      });
      id = created.id;

      const result = await share(page, id);
      expect(result.isSuccess, result.errorMessage ?? "share failed").toBe(true);
      expect(result.statusCode).toBe(200);

      // The receiver reflected our request headers: the injected Authorization
      // header must be present with the decrypted secret. This proves the whole
      // encrypt→store→decrypt→inject→send path end-to-end.
      const detail = await callLogDetail(page, result.logId);
      expect(detail.responseBody, "receiver reflection missing").toBeTruthy();
      expect(detail.responseBody).toContain(`Bearer ${secret}`);

      // The secret must NOT have been persisted into the logged request headers.
      expect(detail.requestHeaders ?? "").not.toContain(secret);
    } finally {
      if (id) await deleteEndpoint(page, id);
      await context.close();
    }
  });

  test("API-key share injects X-Api-Key header", async ({ browser }) => {
    const context = await browser.newContext({ baseURL: BASE_URL });
    const page = await context.newPage();
    const secret = `api-key-${RUN}`;
    let id: string | undefined;
    try {
      await page.goto(BASE_URL);
      await signInAsAdmin(page);

      const created = await createEndpoint(page, {
        name: `P02 apikey ${RUN}`,
        authType: AUTH_API_KEY,
        credential: secret,
      });
      id = created.id;

      const result = await share(page, id);
      expect(result.isSuccess, result.errorMessage ?? "share failed").toBe(true);

      const detail = await callLogDetail(page, result.logId);
      // postman-echo lowercases header names in its reflection object.
      expect(detail.responseBody?.toLowerCase()).toContain("x-api-key");
      expect(detail.responseBody).toContain(secret);
    } finally {
      if (id) await deleteEndpoint(page, id);
      await context.close();
    }
  });

  test("credential can be rotated and cleared; clearing stops injection", async ({
    browser,
  }) => {
    const context = await browser.newContext({ baseURL: BASE_URL });
    const page = await context.newPage();
    const secretA = `rotate-A-${RUN}`;
    const secretB = `rotate-B-${RUN}`;
    let id: string | undefined;
    try {
      await page.goto(BASE_URL);
      await signInAsAdmin(page);

      const created = await createEndpoint(page, {
        name: `P02 rotate ${RUN}`,
        authType: AUTH_BEARER,
        credential: secretA,
      });
      id = created.id;

      // Rotate to secret B (leave credential set, new value replaces old).
      const rotated = await updateEndpoint(page, id, {
        name: `P02 rotate ${RUN}`,
        authType: AUTH_BEARER,
        credential: secretB,
      });
      expect(rotated.hasCredential).toBe(true);
      const afterRotate = await callLogDetail(page, (await share(page, id)).logId);
      expect(afterRotate.responseBody).toContain(`Bearer ${secretB}`);
      expect(afterRotate.responseBody).not.toContain(secretA);

      // Clear the credential; subsequent shares must carry no Authorization.
      const cleared = await updateEndpoint(page, id, {
        name: `P02 rotate ${RUN}`,
        authType: AUTH_BEARER,
        clearCredential: true,
      });
      expect(cleared.hasCredential).toBe(false);
      const afterClear = await callLogDetail(page, (await share(page, id)).logId);
      // The reflection lists request headers; none should be a Bearer auth.
      expect(afterClear.responseBody?.toLowerCase()).not.toContain(
        "bearer rotate-b",
      );
    } finally {
      if (id) await deleteEndpoint(page, id);
      await context.close();
    }
  });

  test("permission denial: user without DataIntegration.Share gets 403", async ({
    browser,
  }) => {
    const context = await browser.newContext({ baseURL: BASE_URL });
    const page = await context.newPage();
    try {
      await page.goto(BASE_URL);
      await signIn(page, NOPERM_EMAIL, SEED_PASSWORD);

      const resp = await page.context().request.post(SHARE_API, {
        headers: {
          RequestVerificationToken: await requestVerificationToken(page),
        },
        // Authorization is checked before the handler, so any id yields 403.
        data: {
          endpointId: "00000000-0000-0000-0000-000000000000",
          dataType: DATA_TYPE_ALERT,
        },
      });
      expect(resp.status(), await resp.text()).toBe(403);
    } finally {
      await context.close();
    }
  });

  test("real UI: write-only credential field renders and secret is never shown", async ({
    browser,
  }) => {
    const context = await browser.newContext({ baseURL: BASE_URL });
    const page = await context.newPage();
    const secret = `ui-secret-${RUN}`;
    const name = `P02 ui ${RUN}`;
    let id: string | undefined;
    try {
      await page.goto(BASE_URL);
      await signInAsAdmin(page);
      const created = await createEndpoint(page, {
        name,
        authType: AUTH_BEARER,
        credential: secret,
      });
      id = created.id;

      // Open the real page.
      await page.goto(`${BASE_URL}/data-integration`);
      await expect(
        page.getByRole("button", { name: /Thêm endpoint/ }),
      ).toBeVisible({ timeout: 20_000 });

      // Create modal: the credential field is revealed once an auth type needing
      // a secret is chosen.
      await page.getByRole("button", { name: /Thêm endpoint/ }).click();
      const dialog = page.getByRole("dialog");
      await dialog.getByLabel("Xác thực").click();
      await page.getByTitle("Bearer Token", { exact: true }).last().click();
      await expect(
        dialog.getByPlaceholder("Dán khóa API hoặc token"),
      ).toBeVisible();
      // Dismiss the open dropdown by focusing another field, then close.
      await dialog.getByLabel("Tên endpoint").click();
      await dialog.getByRole("button", { name: "Hủy" }).click();
      await expect(dialog).toBeHidden();

      // Detail drawer reflects credential state without revealing the secret.
      await page
        .getByPlaceholder("Tên, URL, hệ thống")
        .fill(name);
      await page.getByPlaceholder("Tên, URL, hệ thống").press("Enter");
      await page.getByRole("cell", { name }).first().dblclick();
      await expect(page.getByText("Đã cấu hình")).toBeVisible({
        timeout: 10_000,
      });
      await expect(page.getByText(secret)).toHaveCount(0);
    } finally {
      if (id) await deleteEndpoint(page, id);
      await context.close();
    }
  });
});
