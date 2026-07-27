/**
 * SEC-04: Server-side password-expiry / forced-change enforcement (P0-1).
 *
 * Verifies, against the REAL stack (no API interception, no injected auth):
 *  1. A user whose password has EXPIRED can still authenticate (login is not the
 *     control point) — but every authenticated BUSINESS API is blocked server-side
 *     with 403 `FoodSafe:Account:PasswordExpired`.
 *  2. The block is the password gate, NOT a permission denial: the same user is a
 *     fully-permissioned ProvinceAdmin (current-user-context lists its permissions),
 *     yet the business API is still refused.
 *  3. The recovery surface stays reachable while gated — the whitelisted
 *     account-security change-password endpoint runs the controller (returns the
 *     invalid-current-password business error, not the gate 403).
 *  4. Control: a NON-expired user (admin) reaches the same business API (200),
 *     proving the middleware discriminates on password state, not blanket-denies.
 *  5. Visible UI behavior: logging in as the expired user and opening a protected
 *     route redirects the real React app to /account/change-password.
 *
 * The expired account (`expired.pw@foodsafe.local`) is seeded deterministically
 * with a password changed 100 days ago under a 90-day policy. This spec never
 * mutates that account's password, so it is fully re-runnable.
 */

import { test, expect, type Page } from "@playwright/test";
import { signIn, signInAsAdmin, requestVerificationToken } from "./helpers/auth";

const BASE_URL = "http://127.0.0.1:8080";
const EXPIRED_EMAIL = "expired.pw@foodsafe.local";
const SEED_PASSWORD = "Admin@2026!";
const BUSINESS_API = "/api/v1/app/business?MaxResultCount=1";
const GATE_CODE = "FoodSafe:Account:PasswordExpired";
const INVALID_CURRENT_PWD_CODE = "FoodSafe:Account:0001";

interface ErrorEnvelope {
  error?: { code?: string; message?: string };
}

async function readError(text: string): Promise<ErrorEnvelope> {
  try {
    return JSON.parse(text) as ErrorEnvelope;
  } catch {
    return {};
  }
}

test.describe("SEC-04: password-expiry server-side enforcement", () => {
  test.setTimeout(90_000);

  // ── 1 + 2: expired user authenticates but is gated out of business APIs ──────
  test("expired-password user logs in yet is refused every business API (403 gate)", async ({
    browser,
  }) => {
    const context = await browser.newContext({ baseURL: BASE_URL });
    const page = await context.newPage();
    try {
      await page.goto(BASE_URL);
      // Real backend login — asserts result===1, i.e. the account authenticates.
      await signIn(page, EXPIRED_EMAIL, SEED_PASSWORD);

      // Business API (non-whitelisted) must be gated.
      const biz = await page.context().request.get(BUSINESS_API);
      expect(biz.status(), await biz.text()).toBe(403);
      const bizErr = await readError(await biz.text());
      expect(bizErr.error?.code).toBe(GATE_CODE);

      // The gate is NOT a permission problem: current-user-context (whitelisted)
      // succeeds and shows this account is fully permissioned.
      const ctxResp = await page.context().request.get(
        "/api/v1/app/current-user-context",
      );
      expect(ctxResp.status()).toBe(200);
      const ctx = (await ctxResp.json()) as {
        passwordMustChange: boolean;
        permissions: string[];
      };
      expect(ctx.passwordMustChange).toBe(true);
      expect(ctx.permissions.length).toBeGreaterThan(50);
      expect(
        ctx.permissions.some((p) => /business/i.test(p)),
        "expired user holds business permissions yet is still gated",
      ).toBeTruthy();
    } finally {
      await context.close();
    }
  });

  // ── 3: the change-password recovery path is not gated ────────────────────────
  test("whitelisted change-password endpoint runs the controller (not the gate)", async ({
    browser,
  }) => {
    const context = await browser.newContext({ baseURL: BASE_URL });
    const page = await context.newPage();
    try {
      await page.goto(BASE_URL);
      await signIn(page, EXPIRED_EMAIL, SEED_PASSWORD);

      const resp = await page.context().request.post(
        "/api/v1/app/account-security/change-password",
        {
          headers: {
            RequestVerificationToken: await requestVerificationToken(page),
          },
          // Deliberately WRONG current password → the controller must reject it
          // with the invalid-current-password error, proving it executed and was
          // not short-circuited by the expiry gate.
          data: {
            currentPassword: "DefinitelyWrong@123",
            newPassword: "Unused@New456",
          },
        },
      );
      const err = await readError(await resp.text());
      expect(
        err.error?.code,
        `change-password must not be gated (got ${resp.status()})`,
      ).not.toBe(GATE_CODE);
      expect(err.error?.code).toBe(INVALID_CURRENT_PWD_CODE);
    } finally {
      await context.close();
    }
  });

  // ── 4: control — a non-expired user is not blocked ───────────────────────────
  test("non-expired admin reaches the same business API (200)", async ({
    browser,
  }) => {
    const context = await browser.newContext({ baseURL: BASE_URL });
    const page = await context.newPage();
    try {
      await page.goto(BASE_URL);
      await signInAsAdmin(page);

      const biz = await page.context().request.get(BUSINESS_API);
      expect(biz.status(), await biz.text()).toBe(200);
    } finally {
      await context.close();
    }
  });

  // ── 5: visible UI behavior — expired session is forced to change-password ─────
  test("real UI redirects the expired session to /account/change-password", async ({
    browser,
  }) => {
    const context = await browser.newContext({ baseURL: BASE_URL });
    const page = await context.newPage();
    try {
      await page.goto(BASE_URL);
      await signIn(page, EXPIRED_EMAIL, SEED_PASSWORD);

      // Open a protected route; the real app queries /current-user-context and the
      // PrivateRoute redirects because passwordMustChange is true.
      await page.goto(`${BASE_URL}/`);
      await page.waitForURL("**/account/change-password", { timeout: 20_000 });
      await expect(
        page.getByRole("heading", { name: "Đổi mật khẩu" }),
      ).toBeVisible({ timeout: 10_000 });
      await expect(
        page.getByPlaceholder("Nhập mật khẩu hiện tại"),
      ).toBeVisible();
    } finally {
      await context.close();
    }
  });
});
