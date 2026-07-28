/**
 * P1-4 / SEC-08 (CLAUDE.md §5 "CAPTCHA trên trang đăng nhập"): prove the login
 * CAPTCHA is *really enforced* by the running full stack — not merely present in
 * the source.
 *
 * The audit could never show a CAPTCHA challenge being enforced because the
 * shared dev stack is wired with Cloudflare Turnstile *test keys*
 * (site `1x00000000000000000000AA`, secret `1x0000…AA`), whose siteverify always
 * returns success. That is the intentional "dev bypass": there is no bypass
 * token in the code — the middleware runs on every protected POST, calls the
 * real Cloudflare siteverify, and only lets the request through when a token
 * verifies. So enforcement is fully observable here:
 *
 *   - a request with NO token is rejected *before* Cloudflare is even called
 *     (empty-token short-circuit) → deterministic, key-independent;
 *   - a request WITH a token clears the gate and proceeds to the real login,
 *     which then independently succeeds (valid creds) or fails auth (bad creds).
 *
 * Production hardening (real keys, action + hostname pinning, test-keys-forbidden)
 * is enforced by CaptchaConfiguration.Validate + TurnstileCaptchaVerifier in
 * Production mode and is covered by the backend Host tests; it cannot be
 * exercised on a test-key environment and is out of scope for this runtime probe.
 *
 * Real full stack, NO API interception: every request is a real round-trip
 * through nginx → ASP.NET Core → LoginCaptchaMiddleware. The `request` fixture
 * issues genuine HTTP calls (it is not `page.route`/`route.fulfill`).
 */

import { test, expect, type Page } from "@playwright/test";

const LOGIN = "/api/account/login";
const PASSWORD_RESET = "/api/account/send-password-reset-code";
const CAPTCHA_ERROR = "FoodSafe:Captcha:0001";
// The FE's dev token: any non-empty token verifies under the Turnstile test key.
const DUMMY_TOKEN = "XXXX.DUMMY.TOKEN.XXXX";

/**
 * Seeds the antiforgery cookie (via the same app-configuration call the real FE
 * makes) and returns the RequestVerificationToken, so the ONLY variable between
 * the accepted and rejected probes is the CAPTCHA token itself.
 */
async function verificationToken(page: Page): Promise<string> {
  const configuration = await page.context().request.get(
    "/api/abp/application-configuration?IncludeLocalizationResources=false",
  );
  expect(configuration.ok()).toBeTruthy();
  const xsrf = (await page.context().cookies()).find(
    (cookie) => cookie.name === "XSRF-TOKEN",
  );
  expect(xsrf, "XSRF-TOKEN cookie").toBeDefined();
  return decodeURIComponent(xsrf!.value);
}

test.describe("P1-4 / SEC-08 — login CAPTCHA is really enforced", () => {
  test("missing CAPTCHA token → login rejected (400, FoodSafe:Captcha:0001)", async ({
    page,
  }) => {
    const token = await verificationToken(page);
    const response = await page.context().request.post(LOGIN, {
      headers: { RequestVerificationToken: token },
      data: {
        userNameOrEmailAddress: "admin",
        password: process.env.E2E_ADMIN_PASSWORD,
        rememberMe: false,
      },
    });

    expect(response.status()).toBe(400);
    expect(await response.text()).toContain(CAPTCHA_ERROR);
  });

  test("malformed body → login rejected, never bypassed (SEC-M-01)", async ({
    page,
  }) => {
    const token = await verificationToken(page);
    // A body that is not valid JSON carries no verifiable token; the middleware
    // must reject it rather than fall through to the login handler.
    const response = await page.context().request.post(LOGIN, {
      headers: {
        RequestVerificationToken: token,
        "Content-Type": "application/json",
      },
      data: "not-json{{",
    });

    expect(response.status()).toBe(400);
    expect(await response.text()).toContain(CAPTCHA_ERROR);
  });

  test("valid CAPTCHA token + valid credentials → login succeeds (result 1)", async ({
    page,
  }) => {
    const token = await verificationToken(page);
    const response = await page.context().request.post(LOGIN, {
      headers: { RequestVerificationToken: token },
      data: {
        userNameOrEmailAddress: "admin",
        password: process.env.E2E_ADMIN_PASSWORD,
        captchaToken: DUMMY_TOKEN,
        rememberMe: false,
      },
    });

    expect(response.status()).toBe(200);
    expect(((await response.json()) as { result?: number }).result).toBe(1);
  });

  test("valid CAPTCHA token + bad credentials → gate passes, auth fails independently (result 2, not a CAPTCHA 400)", async ({
    page,
  }) => {
    const token = await verificationToken(page);
    // A username that does not exist → the auth layer returns
    // InvalidUserNameOrPassword (result 2). Crucially it is NOT a 400 CAPTCHA
    // error: the token cleared the CAPTCHA gate and only the credential check
    // failed — proving the gate is real and independent of authentication.
    // Using a throwaway username avoids touching any real account's lockout.
    const response = await page.context().request.post(LOGIN, {
      headers: { RequestVerificationToken: token },
      data: {
        userNameOrEmailAddress: `no-such-user-${Date.now()}`,
        password: "definitely-the-wrong-password",
        captchaToken: DUMMY_TOKEN,
        rememberMe: false,
      },
    });

    expect(response.status()).toBe(200);
    const body = (await response.json()) as { result?: number };
    expect(
      body.result,
      "CAPTCHA passed; only credentials failed (2 = InvalidUserNameOrPassword)",
    ).toBe(2);
  });

  test("CAPTCHA also guards password-reset (missing token → 400)", async ({
    page,
  }) => {
    const token = await verificationToken(page);
    // Proves the middleware coverage is not login-only: the reset endpoint is
    // rejected on a missing token before it ever processes the e-mail.
    const response = await page.context().request.post(PASSWORD_RESET, {
      headers: { RequestVerificationToken: token },
      data: { email: "nobody@foodsafe.local", appName: "FoodSafe" },
    });

    expect(response.status()).toBe(400);
    expect(await response.text()).toContain(CAPTCHA_ERROR);
  });

  test("login page initialises the real CAPTCHA widget when enabled", async ({
    page,
  }) => {
    // The widget config is served from backend config (not hardcoded in the FE):
    // provider + site key prove CAPTCHA is enabled and wired.
    const configResponse = page.waitForResponse(
      (r) =>
        r.request().method() === "GET" &&
        /\/v1\/security\/captcha\/config/.test(r.url()),
    );
    await page.goto("/login");
    const config = await configResponse;
    expect(config.ok()).toBeTruthy();
    const body = (await config.json()) as { provider?: string; siteKey?: string };
    expect(body.provider).toBe("turnstile");
    expect(body.siteKey, "site key served from config, not blank").toBeTruthy();

    // The FE injected the Turnstile loader → the widget initialisation path ran.
    await expect(
      page.locator("script[data-foodsafe-turnstile]"),
    ).toHaveCount(1);
  });
});
